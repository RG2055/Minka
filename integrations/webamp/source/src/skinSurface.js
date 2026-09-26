// One skin system for the two renderers.
//
// The classic Webamp instance is the player and stays mounted for good; a
// Winamp 2 skin (.wsz) restyles it in place. A Winamp 3/5 skin (.wal) is
// rendered by webamp-modern as a second *view* of the same player, in the
// same dock, over the (hidden) classic surface. Either way there is one
// audio element, one playlist, one EQ, one radio library, one favourites and
// history store. This module decides which surface shows, remembers the
// choice, and hands the Modern skin's own buttons (media library, eject,
// menus) to the classic player's implementations.

import { requireJSZip } from "./player.js";
import { onContextMenu } from "./contextMenu.js";

// Its own database: historyStore.js owns "webamp-radio" at its version, and a
// second module upgrading that one would close history's connection.
const MODERN_DB = "webamp-radio-skins";
const MODERN_STORE = "modernSkin";
const RECENT_LIMIT = 8;
const MODE_KEY = "webamp.skin.mode.v1"; // "classic" | "modern"

/**
 * What an archive holds: its kind and the skins inside it. A .wal/.wsz has
 * one skin at the root; a download zip may wrap several skin folders
 * (Big Bento Modern ships four variants in one zip), each a variant.
 * @returns {{ type: "classic"|"modern"|null, variants: {name:string, path:string}[] }}
 */
export async function inspectSkinArchive(blob) {
  const JSZip = await requireJSZip();
  let zip;
  try {
    zip = await JSZip.loadAsync(blob);
  } catch {
    return { type: null, variants: [], zip: null };
  }
  const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  const roots = (pattern) =>
    names
      .filter((name) => pattern.test(name.toLowerCase()))
      .map((name) => name.slice(0, name.length - name.split("/").pop().length))
      .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  const modern = roots(/(^|\/)skin\.xml$/);
  const classic = roots(/(^|\/)main\.bmp$/);
  const found = modern.length ? modern : classic;
  if (!found.length) {
    // A download zip wrapping the skin archive itself (Classic Modern ships
    // as "x.zip" holding "x.wal"): each inner archive is a variant.
    const inner = names.filter((name) => /\.(wal|wsz)$/i.test(name));
    if (inner.length) {
      return {
        type: /\.wal$/i.test(inner[0]) ? "modern" : "classic",
        variants: inner.map((path) => ({ path, name: path.split("/").pop().replace(/\.(wal|wsz)$/i, ""), nested: true })),
        zip
      };
    }
  }
  return {
    type: modern.length ? "modern" : classic.length ? "classic" : null,
    variants: found.map((path) => ({ path, name: path ? path.replace(/\/$/, "").split("/").pop() : "" })),
    zip
  };
}

/** "classic" (.wsz: main.bmp), "modern" (.wal: skin.xml) or null. */
export async function detectSkinType(blob) {
  return (await inspectSkinArchive(blob)).type;
}

// A classic skin folder inside a zip, re-packed with the folder as root
// (Webamp's classic loader reads the archive root only).
async function repackFolder(zip, path) {
  const JSZip = await requireJSZip();
  const out = new JSZip();
  const entries = [];
  zip.folder(path).forEach((relative, file) => {
    if (!file.dir) entries.push([relative, file]);
  });
  for (const [relative, file] of entries) {
    out.file(relative, await file.async("uint8array"));
  }
  return out.generateAsync({ type: "blob" });
}

// The .wal is the user's own file; it is kept in IndexedDB (a File survives
// there) so the choice outlives a reload without bundling anything.
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MODERN_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MODERN_STORE)) {
        db.createObjectStore(MODERN_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("skin store blocked"));
  });
}

function skinLabel(file, skinRoot) {
  return skinRoot ? skinRoot.replace(/\/$/, "").split("/").pop() : (file.name || "skin").replace(/\.(wal|zip)$/i, "");
}

// "current" = what to restore; "recent:<label>" = the last few, for the menu.
async function storeModernSkin(file, skinRoot = "") {
  try {
    const db = await openDb();
    const label = skinLabel(file, skinRoot);
    const row = { file, skinRoot, name: file.name, label, at: Date.now() };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MODERN_STORE, "readwrite");
      const store = tx.objectStore(MODERN_STORE);
      store.put(row, "current");
      store.put(row, `recent:${label}`);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    // Trim to the newest RECENT_LIMIT.
    const recent = await readRecentModernSkins();
    if (recent.length > RECENT_LIMIT) {
      await new Promise((resolve) => {
        const tx = db.transaction(MODERN_STORE, "readwrite");
        for (const old of recent.slice(RECENT_LIMIT)) tx.objectStore(MODERN_STORE).delete(`recent:${old.label}`);
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    }
    db.close();
  } catch {}
}

/** Newest first: [{label, name, skinRoot, file}]. */
async function readRecentModernSkins() {
  try {
    const db = await openDb();
    const rows = await new Promise((resolve, reject) => {
      const out = [];
      const request = db.transaction(MODERN_STORE, "readonly").objectStore(MODERN_STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return resolve(out);
        if (String(cursor.key).startsWith("recent:")) out.push(cursor.value);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  } catch {
    return [];
  }
}

async function readModernSkin() {
  try {
    const db = await openDb();
    const row = await new Promise((resolve, reject) => {
      const request = db.transaction(MODERN_STORE, "readonly").objectStore(MODERN_STORE).get("current");
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return row?.file ? { file: row.file, skinRoot: row.skinRoot || "" } : null;
  } catch {
    return null;
  }
}

// Plain prompt; a host can pass its own chooser to setSkin().
function defaultChooseVariant(names) {
  const answer = window.prompt(
    `This archive holds several skins:\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\nWhich one? (1-${names.length})`,
    "1"
  );
  if (answer == null) return null;
  const index = Number.parseInt(answer, 10) - 1;
  return Number.isInteger(index) && index >= 0 && index < names.length ? index : 0;
}

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) || "classic";
  } catch {
    return "classic";
  }
}

function writeMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
}

/**
 * @param {object} options
 * @param {import("webamp").default} options.webamp   the classic player
 * @param {HTMLElement} options.dock        the element the player fills
 * @param {HTMLElement} options.classicStage the classic row's element
 * @param {object} options.library         classic Media Library (show/hide/isVisible)
 * @param {() => void} [options.openSkinBrowser]
 * @param {() => {width:number,height:number}} options.getBox  space the Modern view may fill
 * @param {(event: string, detail?: any) => void} [options.emit]
 */
export function createSkinSurface({ webamp, dock, classicStage, library, openSkinBrowser, getBox, seedTracks, defaultModern = null, modernAssetsBase = undefined, modernPrivateDefaults = undefined, switchButton = true, barHeight = { max: "70vh" }, getStationInfo = null, emit = () => {} }) {
  let modern = null; // handle from mountModernSkin
  let modernHost = null;
  let mounting = null;
  // Cached for the Skins menu, which is built synchronously on open.
  let recent = [];
  const refreshRecent = () => readRecentModernSkins().then((rows) => { recent = rows; });
  void refreshRecent();

  // A small Winamp-style button in the dock's corner: "MODERN" while the
  // classic skin shows, "CLASSIC" while a Modern skin shows. Part of the
  // embed, so the host app gets it without any UI of its own.
  let switchEl = null;
  if (switchButton) {
    switchEl = document.createElement("button");
    switchEl.type = "button";
    switchEl.className = "webamp-dock-switch";
    switchEl.title = "Switch between the classic and the Modern skin (right-click: Skins menu)";
    switchEl.addEventListener("click", (event) => {
      event.stopPropagation();
      toggle().catch((error) => emit("error", { reason: error?.message ?? String(error) }));
    });
    switchEl.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openClassicMenu(event.clientX, event.clientY);
    });
    dock.append(switchEl);
  }
  function updateSwitch() {
    if (!switchEl) return;
    switchEl.textContent = modern ? "CLASSIC" : "MODERN";
    switchEl.setAttribute("aria-label", modern ? "Switch to the classic skin" : "Switch to the Modern skin");
  }
  updateSwitch();

  function ensureModernHost() {
    if (!modernHost) {
      modernHost = document.createElement("div");
      modernHost.className = "webamp-dock-modern";
      dock.append(modernHost);
    }
    return modernHost;
  }

  // Modern skins carry their own media-library / open / menu buttons; those
  // go to the classic player's features, which are the real ones.
  function onAction(action, param) {
    const target = (param || "").toLowerCase();
    if (action === "toggle" && (target === "guid:ml" || target === "guid:{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}" || target === "ml")) {
      if (library.isVisible()) library.hide();
      else void library.show();
      return true;
    }
    if (action === "eject") {
      void library.show();
      return true;
    }
    if (action === "sysmenu" || action === "controlmenu" || (action === "menu" && !param)) {
      openClassicMenu();
      return true;
    }
    if (action === "menu" && target === "presets") {
      // EQ presets: the classic player's list (Winamp's built-in presets,
      // "From Eqf...", Save) at the pointer.
      openClassicPresets();
      return true;
    }
    return false;
  }

  // Webamp opens this menu from its (hidden) EQ PRESETS button and places it
  // by that button; the first render after the click is moved to the pointer.
  let pendingMenuAt = null;
  const stopMenuWatch = onContextMenu((menu) => {
    if (!pendingMenuAt) return;
    const wrapper = menu.parentElement;
    if (!wrapper) return;
    const { x, y } = pendingMenuAt;
    pendingMenuAt = null;
    wrapper.style.position = "fixed";
    const bounds = menu.getBoundingClientRect();
    wrapper.style.left = `${Math.max(0, Math.min(x, window.innerWidth - bounds.width - 4))}px`;
    wrapper.style.top = `${Math.max(0, Math.min(y, window.innerHeight - bounds.height - 4))}px`;
  });
  function openClassicPresets(x = lastPointer.x, y = lastPointer.y) {
    const button = classicStage.querySelector("#equalizer-window #presets");
    if (!button) return;
    pendingMenuAt = { x, y };
    button.click();
  }

  // A Modern skin's window holders: Winamp's Media Library slot gets our
  // library (its body, embedded); the rest stays with the engine (vis) or empty.
  function holdWindow(alias) {
    if (alias === "ml") {
      const host = document.createElement("div");
      library.embedInto(host);
      return host;
    }
    return null;
  }
  function releaseWindow() {
    if (library.isEmbedded()) library.unembed();
  }

  function isActionActive(action, param) {
    const target = (param || "").toLowerCase();
    if (action === "toggle" && (target === "guid:ml" || target === "ml")) {
      return library.isVisible();
    }
    return null;
  }

  // Webamp's own context menu (Media Library, Skins, Options...) belongs to
  // the hidden classic main window; a synthetic right-click there opens it
  // at the pointer, on top of whichever surface is showing.
  let lastPointer = { x: 0, y: 0 };
  const trackPointer = (event) => {
    lastPointer = { x: event.clientX, y: event.clientY };
  };
  function openClassicMenu(x = lastPointer.x, y = lastPointer.y) {
    const main = classicStage.querySelector("#main-window") ?? classicStage;
    main.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));
  }

  // In Modern mode the bar may grow (never shrink) up to `barHeight.max`
  // so a skin whose windows are taller than the classic bar shows 1:1;
  // the extra height is set on the dock itself and removed on the way back
  // to classic. `potentialBox()` is what layout choice and scripts see.
  const maxBarPx = () => {
    const max = barHeight?.max;
    if (max == null) return 0;
    if (typeof max === "number") return max;
    const m = /^([\d.]+)(vh|px)$/.exec(String(max).trim());
    if (!m) return 0;
    return m[2] === "vh" ? (Number(m[1]) / 100) * window.innerHeight : Number(m[1]);
  };
  let baseBarHeight = null; // the host's own bar height (CSS), measured once
  const potentialBox = () => {
    const box = getBox();
    return { width: box.width, height: Math.max(box.height, maxBarPx()) };
  };
  function applyBarHeight() {
    if (!modern) return;
    if (baseBarHeight == null) {
      dock.style.height = "";
      baseBarHeight = dock.clientHeight;
    }
    const wanted = Math.min(maxBarPx() || 0, modern.bounds.height);
    const target = Math.max(baseBarHeight, Math.round(wanted));
    dock.style.height = target > baseBarHeight ? `${target}px` : "";
  }
  function resetBarHeight() {
    dock.style.height = "";
    baseBarHeight = null;
  }

  // Fits the skin to the bar: shrunk when larger (fractional zoom), and
  // enlarged by whole multiples (crisp pixel art) up to MAX_UPSCALE when
  // smaller - a Winamp windowshade bar (18 px) shows at 2x in a 150 px bar.
  const MAX_UPSCALE = 2;
  let fitting = false;
  function fit() {
    if (!modern || fitting) return;
    fitting = true;
    try {
      const bounds = modern.arrange();
      applyBarHeight();
      const box = getBox();
      if (!bounds.width || !bounds.height) return;
      const raw = Math.min(box.width / bounds.width, box.height / bounds.height);
      // Whole multiples when enlarging (a 1 px rounding slack keeps a bar
      // stretched to exactly half the width at 2x).
      const scale = raw >= 1 ? Math.min(MAX_UPSCALE, Math.floor(raw + 0.01)) : raw;
      modernHost.style.zoom = scale === 1 ? "" : String(scale);
      const width = Math.round(bounds.width * scale);
      const height = Math.round(bounds.height * scale);
      modernHost.style.left = `${Math.max(0, Math.round((box.width - width) / 2))}px`;
      modernHost.style.top = `${Math.max(0, Math.round((box.height - height) / 2))}px`;
      emit("layout", { mode: "modern", width, height, scale });
    } finally {
      fitting = false;
    }
  }

  // Skins resize their windows from scripts after load; refit when the
  // rendered windows change size.
  let sizeObserver = null;
  function watchSkinSize() {
    sizeObserver?.disconnect();
    if (!modern || typeof ResizeObserver === "undefined") return;
    let queued = false;
    sizeObserver = new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fit();
      });
    });
    for (const container of modern.uiRoot.getContainers()) {
      const layoutDiv = container.getDiv()?.firstElementChild;
      if (layoutDiv) sizeObserver.observe(layoutDiv);
      sizeObserver.observe(container.getDiv());
    }
  }

  async function showModern(file, { remember = true, skinRoot = "" } = {}) {
    if (mounting) await mounting.catch(() => {});
    mounting = (async () => {
      const { mountModernSkin } = await import("./modern/modernSkin.js");
      const host = ensureModernHost();
      modern?.dispose();
      modern = null;
      host.replaceChildren();
      host.hidden = false;
      // The Modern skin takes the same bar the classic row uses (Minka's
      // #radioWindow); the host decides the bar's size, never the skin.
      dock.classList.add("modern-active");
      try {
        modern = await mountModernSkin({
          webamp,
          host,
          skin: file,
          layout: "row",
          desktop: potentialBox,
          bar: getBox,
          skinRoot,
          getStationInfo,
          onAction,
          isActionActive,
          holdWindow,
          releaseWindow,
          assetsBase: modernAssetsBase,
          privateDefaults: modernPrivateDefaults,
          onLayoutChanged: () => requestAnimationFrame(fit),
          // The Modern playlist reads through Webamp's store; hand it the
          // host's stations so the window is not empty on first open.
          seedTracks
        });
      } catch (error) {
        dock.classList.remove("modern-active");
        host.hidden = true;
        throw error;
      }
      host.addEventListener("pointermove", trackPointer);
      host.addEventListener("contextmenu", onModernContextMenu);
      applyBarHeight();
      fit();
      watchSkinSize();
      updateSwitch();
      writeMode("modern");
      if (remember) {
        await storeModernSkin(file, skinRoot);
        await refreshRecent();
      }
      emit("skin", { type: "modern", name: skinRoot ? skinRoot.replace(/\/$/, "").split("/").pop() : file.name });
    })();
    return mounting;
  }

  // Right-click on empty skin area: the classic menu. Skins that take the
  // right button themselves (their own menus) stop the event first.
  function onModernContextMenu(event) {
    if (event.defaultPrevented) return;
    event.preventDefault();
    openClassicMenu(event.clientX, event.clientY);
  }

  function showClassic() {
    sizeObserver?.disconnect();
    sizeObserver = null;
    resetBarHeight();
    if (modern) {
      modernHost.removeEventListener("pointermove", trackPointer);
      modernHost.removeEventListener("contextmenu", onModernContextMenu);
      modern.dispose();
      modern = null;
      if (library.isEmbedded()) library.unembed();
      modernHost.replaceChildren();
      modernHost.hidden = true;
      modernHost.style.zoom = "";
    }
    dock.classList.remove("modern-active");
    updateSwitch();
    writeMode("classic");
    emit("layout", { mode: "classic" });
  }

  /**
   * A skin file or URL of either kind. A zip with several skin folders
   * inside asks `chooseVariant(names)` (index, or null to cancel); without
   * a chooser the first folder is used.
   */
  async function setSkin(source, name = "", { variant, chooseVariant = defaultChooseVariant } = {}) {
    let blob = source;
    if (typeof source === "string") {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Skin could not be loaded: ${source}`);
      blob = await response.blob();
      name = name || source.split("/").pop();
    }
    const archive = await inspectSkinArchive(blob);
    const type = archive.type;
    // Skin folder(s) inside the zip (a Skins directory, as Big Bento Modern
    // ships): pick one. The archive stays whole because a variant may borrow
    // files from a sibling folder (@SKINSPATH@\Big Bento Modern\scripts\...).
    let skinRoot = "";
    if (type && archive.variants.length && archive.variants[0].path) {
      let index = 0;
      if (variant != null) {
        index = typeof variant === "number" ? variant : archive.variants.findIndex((v) => v.name === variant);
      } else if (archive.variants.length > 1 && chooseVariant) {
        index = await chooseVariant(archive.variants.map((v) => v.name));
        if (index == null || index < 0) return null;
      }
      const chosen = archive.variants[index] ?? archive.variants[0];
      if (chosen.nested) {
        // The real skin archive sits inside this zip: unwrap and start over.
        const innerBlob = await archive.zip.file(chosen.path).async("blob");
        const innerName = chosen.path.split("/").pop();
        return setSkin(new File([innerBlob], innerName), innerName, { variant, chooseVariant });
      }
      skinRoot = chosen.path;
    }
    if (type === "modern") {
      const file = blob instanceof File ? blob : new File([blob], name || "skin.wal");
      await showModern(file, { skinRoot });
      return "modern";
    }
    if (type === "classic" && skinRoot) {
      blob = await repackFolder(archive.zip, skinRoot);
    }
    if (type === "classic") {
      showClassic();
      // Webamp's public API loads skins by URL; a local file goes through a
      // temporary object URL.
      const url = URL.createObjectURL(blob);
      try {
        webamp.setSkinFromUrl(url);
        await webamp.skinIsLoaded();
      } finally {
        URL.revokeObjectURL(url);
      }
      emit("skin", { type: "classic", name: name || blob.name || "" });
      return "classic";
    }
    throw new Error("Not a Winamp skin (no main.bmp or skin.xml in the archive)");
  }

  /**
   * Classic <-> Modern. The last Modern skin used is shown again; without
   * one, the default built-in (`defaultModern`: {url, label, variant?}) is
   * loaded; without that either, a file is asked for.
   */
  async function toggle() {
    if (modern) {
      showClassic();
      return "classic";
    }
    const stored = await readModernSkin();
    if (stored) {
      await showModern(stored.file, { remember: false, skinRoot: stored.skinRoot });
      return "modern";
    }
    if (defaultModern) {
      await setSkin(defaultModern.url, defaultModern.label, { variant: defaultModern.variant });
      return "modern";
    }
    pickFile();
    return "classic";
  }

  async function restore() {
    if (readMode() !== "modern") return false;
    const stored = await readModernSkin();
    try {
      if (stored) {
        await showModern(stored.file, { remember: false, skinRoot: stored.skinRoot });
      } else if (defaultModern) {
        await setSkin(defaultModern.url, defaultModern.label, { variant: defaultModern.variant });
      } else {
        return false;
      }
      return true;
    } catch (error) {
      console.warn("Stored Modern skin could not be restored:", error);
      showClassic();
      return false;
    }
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".wal,.wsz,.zip,application/zip";
    input.addEventListener("change", () => {
      const [file] = input.files ?? [];
      if (file) {
        setSkin(file).catch((error) => {
          console.error(error);
          emit("error", { reason: error?.message ?? String(error) });
        });
      }
    });
    input.click();
  }

  return {
    setSkin,
    showClassic,
    toggle,
    pickFile,
    restore,
    hasModernSkin: async () => Boolean(await readModernSkin()),
    /** Labels of the last Modern skins loaded, newest first (for a menu). */
    getRecentModernSkins: () => recent.map((row) => row.label),
    /** Re-apply one of them by label. */
    showRecentModernSkin: async (label) => {
      const row = recent.find((r) => r.label === label);
      if (!row) return false;
      await showModern(row.file, { remember: true, skinRoot: row.skinRoot });
      return true;
    },
    fit,
    getMode: () => (modern ? "modern" : "classic"),
    getModern: () => modern,
    openClassicMenu,
    dispose: () => {
      stopMenuWatch();
      showClassic();
      switchEl?.remove();
      modernHost?.remove();
      modernHost = null;
    }
  };
}
