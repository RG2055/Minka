// Skins: the Winamp Skin Museum browser, the favourites list that Webamp shows
// in its own Skins submenu, and restoring the last chosen skin.
//
// Webamp gives no hook for extra items in its Skins submenu, so the museum
// entry is injected into that submenu after it renders. The submenu markup is
// <li class="parent"><ul>...skins...</ul>Skins</li>.

import { createSkinBrowser } from "./skinBrowser.js";
import { applySkin, readStoredSkin, storeSkin, downloadUrl, skinName } from "./skins.js";
import { onContextMenu } from "./contextMenu.js";

const SKINS_KEY = "webamp.skinList";
const FAVOURITE_LIMIT = 12;

export function readFavourites() {
  try {
    return JSON.parse(localStorage.getItem(SKINS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeFavourites(list) {
  try {
    localStorage.setItem(SKINS_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable; favourites simply do not survive a reload.
  }
}

function findSkinsSubmenu() {
  const submenus = [...document.querySelectorAll("#webamp-context-menu li.parent")];
  return submenus.find((li) => /^Skins/.test(li.lastChild?.textContent?.trim() ?? "")) ?? null;
}

/**
 * @param {object} options
 * @param {import("webamp").default} options.webamp
 * @param {boolean} [options.restore]      re-apply the last museum skin
 * @param {(skin: {url, name}) => void} [options.onSkinChange]
 * @param {() => void} [options.onLoadSkinFile]  "Load skin file (.wsz / .wal)..." entry
 * @param {() => "classic"|"modern"} [options.getSkinMode]
 * @param {() => void} [options.onBackToClassic] "Back to classic skin" entry (shown in Modern mode)
 * @param {() => string[]} [options.getRecentModernSkins] labels for "Modern: <name>" entries
 * @param {(label: string) => void} [options.onPickRecentModernSkin]
 * @param {(skin: {url, label, variant?}) => void} [options.onPickBuiltinModernSkin]
 * @param {() => Array<{url, label, variant?}>} [options.getBuiltinModernSkins] entries for the built-in Modern skins
 */
export function installSkinMenu({ webamp, restore = true, onSkinChange, overlayHost = null, onLoadSkinFile, getSkinMode, onBackToClassic, getRecentModernSkins, onPickRecentModernSkin, onPickBuiltinModernSkin, getBuiltinModernSkins = () => [] }) {
  const skinBrowser = createSkinBrowser({
    overlayHost,
    onApply: async (node) => {
      await applySkin(webamp, node);
      storeSkin(node);
      onSkinChange?.({ url: downloadUrl(node), name: skinName(node) });
    }
  });

  function dispatchSkins() {
    webamp.store.dispatch({ type: "SET_AVAILABLE_SKINS", skins: readFavourites() });
  }

  // A museum pick is pinned into Webamp's Skins submenu for one-click return.
  skinBrowser.onSkinPicked = (node) => {
    const name = skinName(node);
    const url = downloadUrl(node);
    const list = readFavourites().filter((s) => s.url !== url);
    list.unshift({ url, name });
    writeFavourites(list.slice(0, FAVOURITE_LIMIT));
    dispatchSkins();
  };

  function attachSkinMenuItem() {
    const skinsMenu = findSkinsSubmenu();
    const list = skinsMenu?.querySelector("ul");
    if (!list) {
      return;
    }
    if (!skinsMenu.querySelector(".webamp-skin-museum-entry")) {
      const item = document.createElement("li");
      item.className = "webamp-skin-museum-entry";
      item.textContent = "Browse Skin Museum...";
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        document.body.click(); // close the menu
        void skinBrowser.show();
      });
      // Directly under "Load Skin..." so it reads as a menu action.
      list.insertBefore(item, list.children[1] ?? null);
    }
    if (onLoadSkinFile && !skinsMenu.querySelector(".webamp-skin-file-entry")) {
      // One picker for both kinds: a .wsz restyles the classic player, a
      // .wal (Winamp 3/5, XML + MAKI) is drawn by webamp-modern over it.
      const item = document.createElement("li");
      item.className = "webamp-skin-file-entry";
      item.textContent = "Load skin file (.wsz / .wal)...";
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        document.body.click();
        onLoadSkinFile();
      });
      list.insertBefore(item, list.children[2] ?? null);
    }
    if (onPickBuiltinModernSkin && !skinsMenu.querySelector(".webamp-skin-builtin-entry")) {
      // The Winamp 5 skins shipped with the app (see builtinSkins.js).
      let after = skinsMenu.querySelector(".webamp-skin-file-entry");
      for (const skin of getBuiltinModernSkins()) {
        const item = document.createElement("li");
        item.className = "webamp-skin-builtin-entry";
        item.textContent = skin.label;
        item.addEventListener("click", (event) => {
          event.stopPropagation();
          document.body.click();
          onPickBuiltinModernSkin(skin);
        });
        after ? after.after(item) : list.append(item);
        after = item;
      }
    }
    if (getRecentModernSkins && onPickRecentModernSkin && !skinsMenu.querySelector(".webamp-skin-recent-entry")) {
      // The Modern skins loaded before (files in the browser's IndexedDB),
      // minus the built-ins, which are listed above.
      let after = [...skinsMenu.querySelectorAll(".webamp-skin-builtin-entry")].pop() ?? skinsMenu.querySelector(".webamp-skin-file-entry");
      const builtinLabels = new Set(getBuiltinModernSkins().map((s) => s.label));
      for (const label of getRecentModernSkins().filter((l) => !builtinLabels.has(l))) {
        const item = document.createElement("li");
        item.className = "webamp-skin-recent-entry";
        item.textContent = `Modern: ${label}`;
        item.addEventListener("click", (event) => {
          event.stopPropagation();
          document.body.click();
          onPickRecentModernSkin(label);
        });
        after ? after.after(item) : list.append(item);
        after = item;
      }
    }
    if (onBackToClassic && getSkinMode?.() === "modern" && !skinsMenu.querySelector(".webamp-skin-classic-entry")) {
      const item = document.createElement("li");
      item.className = "webamp-skin-classic-entry";
      item.textContent = "Back to classic skin";
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        document.body.click();
        onBackToClassic();
      });
      list.insertBefore(item, list.children[3] ?? null);
    }
  }

  // The menu is rebuilt on each open, so inject whenever it renders.
  const stopWatching = onContextMenu(attachSkinMenuItem);

  dispatchSkins();

  if (restore) {
    const stored = readStoredSkin();
    if (stored?.url) {
      Promise.resolve(webamp.setSkinFromUrl(stored.url)).catch(() => {
        // The skin is gone or was never a classic archive; keep the default.
      });
    }
  }

  return {
    skinBrowser,
    openSkinBrowser: () => skinBrowser.show(),
    setSkin: async (url, name = "") => {
      await webamp.setSkinFromUrl(url);
      try {
        localStorage.setItem("webamp.skin", JSON.stringify({ md5: "", name, url }));
      } catch {}
      onSkinChange?.({ url, name });
    },
    favourites: readFavourites,
    dispose: () => stopWatching()
  };
}
