// Embeddable build: Webamp radio docked at the bottom of another app.
//
//   import { mountWebampRadio } from "./webamp-radio.js";   // or window.WebampRadio.mount
//   const radio = await mountWebampRadio(document.querySelector("#radioWindow"), {
//     stations: window.stationsList,        // Minka's list works as-is
//     proxy: "https://my-worker.workers.dev" // optional stream proxy
//   });
//   radio.on("nowplaying", ({ artist, title }) => ...);
//   radio.play(stationsList[3]);
//
// The three classic windows (main, EQ, playlist) sit in one 825x116 row and
// are zoomed to fit the container (width and height), up to `maxScale`. The
// Media Library opens above the dock at its normal size. Nothing here touches document.body, the
// service worker or the URL; the host page keeps its own layout.

import "./player.css";
import "./theme.css";
import { DEFAULT_THEME, THEMES, themeById, themeSkinUrl, themeList } from "./themes.js";
import { createRadioPlayer, WINDOW_WIDTH, WINDOW_HEIGHT } from "./player.js";
import { onContextMenu } from "./contextMenu.js";
import { normalizeStations, fromMinkaStation } from "./stations.js";
import { toPlaylistTracks } from "./radio.js";
import { createSkinSurface } from "./skinSurface.js";
import { builtinModernSkins } from "./builtinSkins.js";
import { readStoredSkin } from "./skins.js";

const ROW_WIDTH = WINDOW_WIDTH * 3;
// The VIDEO window's width in the free-window desk (youtube/videoWindow.js MIN_WINDOW).
const FREE_VIDEO_WIDTH = 213;

export async function mountWebampRadio(container, options = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new Error("mountWebampRadio: pass the element the player should fill");
  }
  const {
    // "auto": largest whole multiple that fits (crisp); "fit": exact fit
    // (blurry between multiples); or a number.
    scale = "auto",
    maxScale = 2,
    lockWindows = true,
    align = "center",
    // z-index of the library / skin browser / context-menu layer; must beat
    // the host's own bars and popups (Minka: #radioWindow 500, tour 70000).
    overlayZIndex = 10000,
    // The bundled catalogue (data/radio.json) is not part of the library build.
    libraryNodes = ["online", "bookmarks", "history", "songs"],
    // Where the runtime files live (skins/, modern/assets/ — the contents of
    // dist-embed/ minus the bundle): a URL or path, resolved against the page.
    // Default: next to the page.
    assetsBase = document.baseURI,
    // The look the player starts in: a bundled theme id ("spotify" by
    // default) or null for the plain Webamp skin. A classic skin the user
    // picked before (the Skins menu) wins, unless `forceTheme` is set.
    theme = DEFAULT_THEME,
    forceTheme = false,
    ...playerOptions
  } = options;

  const runtimeBase = new URL(assetsBase, document.baseURI).href;
  const BUILTIN_MODERN_SKINS = builtinModernSkins(runtimeBase);

  container.classList.add("webamp-dock");
  const stage = document.createElement("div");
  stage.className = "webamp-dock-stage";
  stage.style.width = `${ROW_WIDTH}px`;
  stage.style.height = `${WINDOW_HEIGHT}px`;
  container.append(stage);

  // The library and skin browser windows live outside the dock, at body level:
  // the dock is zoomed, and a host bar with `will-change: transform` (Minka's
  // #radioWindow) would trap fixed-position children inside itself. The
  // wrapper carries id="webamp" so Webamp's skin CSS (`#webamp .gen-*`)
  // paints their frames; it is a second element with that id on purpose.
  const overlays = document.createElement("div");
  overlays.id = "webamp";
  overlays.className = "webamp-dock-overlays";
  overlays.style.zIndex = String(overlayZIndex);
  document.body.append(overlays);
  document.documentElement.style.setProperty("--webamp-overlay-z", String(overlayZIndex + 1));

  // Webamp opens its context menus downwards from the pointer; at the bottom
  // of the screen that runs off the page, so a menu that would overflow is
  // moved up (and left) to stay visible.
  const stopMenuWatch = onContextMenu((menu) => {
    const wrapper = menu.parentElement;
    if (!wrapper || wrapper.dataset.dockAdjusted === "1") {
      return;
    }
    wrapper.dataset.dockAdjusted = "1";
    const bounds = menu.getBoundingClientRect();
    const overflowY = bounds.bottom - window.innerHeight + 8;
    const overflowX = bounds.right - window.innerWidth + 8;
    if (overflowY > 0) {
      wrapper.style.top = `${Math.max(0, parseFloat(wrapper.style.top || "0") - overflowY)}px`;
    }
    if (overflowX > 0) {
      wrapper.style.left = `${Math.max(0, parseFloat(wrapper.style.left || "0") - overflowX)}px`;
    }
  });

  // Filled in below; the player's Skins menu calls into it.
  const skinHooks = {};
  const player = await createRadioPlayer({
    ...playerOptions,
    skinFileHooks: skinHooks,
    host: stage,
    layout: "row",
    contained: true,
    overlayHost: overlays,
    libraryNodes,
    enableHotkeys: playerOptions.enableHotkeys ?? false,
    // VIDEO window: the next window in the bar's row, right after the
    // playlist (classic) or the Modern skin, at the row's rendered height —
    // never below YouTube's 200x200 pane (213 x 234 with the chrome), so in
    // a 1x row it stands taller than the others, bottom-aligned with them.
    getVideoPosition: playerOptions.getVideoPosition ?? (({ width, min, overlay }) => {
      if (!lockWindows && !container.classList.contains("modern-active")) {
        // The desk layout: right of the main window, bottom-aligned, spanning
        // the EQ + main column (never below the 200x200 pane).
        const main = stage.querySelector("#main-window")?.getBoundingClientRect();
        if (main && main.width > 0) {
          const height = Math.max(min.height, Math.round(WINDOW_HEIGHT * 2 * currentScale));
          return { left: main.right - overlay.left, top: main.bottom - overlay.top - height, height, width: min.width };
        }
      }
      // The row as rendered: the Modern skin's host, or the classic windows
      // themselves (the stage may be a full-page layer in free-window mode).
      let row = null;
      if (container.classList.contains("modern-active")) {
        row = container.querySelector(".webamp-dock-modern")?.getBoundingClientRect() ?? null;
      } else {
        const rects = ["#main-window", "#equalizer-window", "#playlist-window"]
          .map((id) => stage.querySelector(id)?.getBoundingClientRect())
          .filter((r) => r && r.width > 0);
        if (rects.length) {
          const left = Math.min(...rects.map((r) => r.left));
          const top = Math.min(...rects.map((r) => r.top));
          const right = Math.max(...rects.map((r) => r.right));
          const bottom = Math.max(...rects.map((r) => r.bottom));
          row = { left, top, right, bottom, width: right - left, height: bottom - top };
        }
      }
      const bounds = row && row.width > 0 ? row : container.getBoundingClientRect();
      const height = Math.max(min.height, Math.round(bounds.height));
      const left = bounds.right - overlay.left;
      if (left + width <= overlay.width) {
        return { left, top: Math.max(0, bounds.bottom - overlay.top - height), height };
      }
      // No room beside the row (narrow page): above its right end instead.
      return {
        left: Math.max(0, bounds.right - overlay.left - min.width),
        top: Math.max(0, bounds.top - overlay.top - min.height),
        height: min.height
      };
    }),
    getLibraryPosition: playerOptions.getLibraryPosition ?? (({ width, height, overlay }) => {
      // Above the dock, aligned with its left edge, clamped to the viewport.
      const bounds = container.getBoundingClientRect();
      return {
        left: Math.max(0, Math.min(bounds.left - overlay.left, overlay.width - width)),
        top: Math.max(0, bounds.top - overlay.top - height - 8)
      };
    })
  });

  // Windows stay in their row. Webamp starts a drag only when the element
  // under the pointer itself carries the "draggable" class (title bars and
  // window backgrounds), so exactly those mousedowns are swallowed; buttons
  // and sliders never have the class and keep working.
  const stopDrag = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.classList.contains("draggable")) {
      event.stopPropagation();
    }
  };
  if (lockWindows) {
    stage.addEventListener("mousedown", stopDrag, true);
    stage.addEventListener("touchstart", stopDrag, true);
  }

  // Free arrangement (lockWindows: false): Webamp keeps its windows inside
  // its render box, so the box becomes the whole page (the stage turns into
  // a fixed, click-through, full-viewport layer; the row still starts in
  // the bar). Windows are dragged with Webamp's own title-bar drag; where
  // they end up is kept (localStorage) and put back on the next mount, and
  // a refit no longer re-rows them once the user has moved one.
  const WINDOWS_KEY = "webamp.classic.windows.v1";
  if (!lockWindows) container.classList.add("webamp-dock-free");
  let userArranged = false;
  const readArrangement = () => {
    try {
      return JSON.parse(localStorage.getItem(WINDOWS_KEY) ?? "null");
    } catch {
      return null;
    }
  };
  if (!lockWindows) {
    const saved = readArrangement();
    if (saved && typeof saved === "object") {
      userArranged = true;
      player.webamp.store.dispatch({ type: "UPDATE_WINDOW_POSITIONS", absolute: true, positions: saved });
    }
    // Only a move the user makes (a title-bar drag) counts as arranging;
    // Webamp also repositions windows on its own (keeping them on screen
    // when its box changes), and that must not be remembered.
    let dragSession = false;
    stage.addEventListener("mousedown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.classList.contains("draggable")) dragSession = true;
    }, true);
    window.addEventListener("mouseup", () => {
      // The drag's last position lands in the store before mouseup returns.
      setTimeout(() => {
        dragSession = false;
      }, 0);
    }, true);
    let lastWindows = player.webamp.store.getState().windows.genWindows;
    player.webamp.store.subscribe(() => {
      const state = player.webamp.store.getState();
      if (state.windows.genWindows === lastWindows) return;
      const moved = Object.entries(state.windows.genWindows).some(([id, w]) => lastWindows[id] && (w.position.x !== lastWindows[id].position.x || w.position.y !== lastWindows[id].position.y));
      lastWindows = state.windows.genWindows;
      if (!moved || layingOut || !dragSession) return;
      userArranged = true;
      const positions = Object.fromEntries(["main", "equalizer", "playlist"].map((id) => [id, state.windows.genWindows[id]?.position]).filter(([, p]) => p));
      try {
        localStorage.setItem(WINDOWS_KEY, JSON.stringify(positions));
      } catch {
        // not persisted
      }
    });
  }
  let layingOut = false;

  let currentScale = 1;
  function fit() {
    const width = container.clientWidth || ROW_WIDTH;
    const height = container.clientHeight || WINDOW_HEIGHT;
    const fitting = Math.min(width / ROW_WIDTH, height / WINDOW_HEIGHT, maxScale);
    // Skins are pixel art: only whole multiples stay crisp, so "auto" snaps
    // down to 1x, 2x, ... and only shrinks below 1x when the row would not fit.
    const wanted = scale === "auto"
      ? (fitting >= 1 ? Math.floor(fitting) : fitting)
      : scale === "fit"
        ? fitting
        : Number(scale) || 1;
    currentScale = Math.max(0.5, Math.round(wanted * 100) / 100);
    container.style.setProperty("--dock-scale", String(currentScale));
    const rowWidth = ROW_WIDTH * currentScale;
    const rowHeight = WINDOW_HEIGHT * currentScale;

    if (!lockWindows) {
      // Full-page render box (in the stage's own, zoomed, pixels); the row
      // is laid out where the bar shows it until the user moves a window.
      stage.style.left = "0px";
      stage.style.top = "0px";
      stage.style.width = `${Math.ceil(window.innerWidth / currentScale)}px`;
      stage.style.height = `${Math.ceil(window.innerHeight / currentScale)}px`;
      if (!userArranged) {
        // Winamp's classic desk: EQ stacked on the main window, the VIDEO
        // window (213 wide, as tall as the two) beside them, the playlist
        // beside that; the group sits on the bar's bottom edge, centred.
        const groupWidth = (WINDOW_WIDTH + FREE_VIDEO_WIDTH + WINDOW_WIDTH) * currentScale;
        const bounds = container.getBoundingClientRect();
        const left = align === "left" ? bounds.left : align === "right" ? bounds.right - groupWidth : bounds.left + (width - groupWidth) / 2;
        const bottom = bounds.bottom - Math.max(0, (height - rowHeight) / 2);
        const x = Math.max(0, Math.round(left / currentScale));
        const y = Math.max(0, Math.round(bottom / currentScale) - WINDOW_HEIGHT);
        layingOut = true;
        player.layoutWindows({ x, y }, {
          equalizer: { x: 0, y: -WINDOW_HEIGHT },
          main: { x: 0, y: 0 },
          playlist: { x: WINDOW_WIDTH + FREE_VIDEO_WIDTH, y: 0 }
        });
        layingOut = false;
      }
      return;
    }
    const left = align === "left" ? 0 : align === "right" ? width - rowWidth : (width - rowWidth) / 2;
    // The stage is zoomed, so its own offsets are read in zoomed pixels.
    stage.style.left = `${Math.max(0, Math.round(left / currentScale))}px`;
    stage.style.top = `${Math.max(0, Math.round((height - rowHeight) / 2 / currentScale))}px`;
    if (lockWindows || !userArranged) {
      layingOut = true;
      player.layoutWindows();
      layingOut = false;
    }
  }
  // A Modern (.wal) skin is a second view of the same player in the same
  // dock; the classic row stays mounted underneath (it is the player).
  const surface = createSkinSurface({
    webamp: player.webamp,
    // Stations to queue in the Modern playlist when it opens empty. The host's
    // list is held by the player, not by the library window. With Online
    // Music configured the startup playlist is the WORK playlist instead
    // (player.js), so nothing is seeded here.
    seedTracks: () => (player.youtube || player.lacitis ? [] : toPlaylistTracks(player.getStations?.() ?? [])),
    dock: container,
    classicStage: stage,
    library: player.library,
    getBox: () => ({ width: container.clientWidth || ROW_WIDTH, height: container.clientHeight || WINDOW_HEIGHT }),
    // First press of the switch without a chosen .wal: Winamp Modern.
    defaultModern: BUILTIN_MODERN_SKINS[0],
    modernAssetsBase: new URL("modern/assets/", runtimeBase).href,
    // Initial private config of the skins' scripts (see builtinSkins.js); a
    // host may add its own with `modernPrivateDefaults`.
    modernPrivateDefaults: Object.assign({}, ...BUILTIN_MODERN_SKINS.map((s) => s.privateDefaults ?? {}), playerOptions.modernPrivateDefaults ?? {}),
    switchButton: playerOptions.switchButton ?? true,
    // Modern mode may grow the bar up to this (never below the host's own
    // height); { max: "40vh" | "300px" | number } or { max: null } to forbid.
    barHeight: playerOptions.barHeight ?? { max: "70vh" },
    // Station + now-playing for the skin's metadata fields (Bento's info panel).
    getStationInfo: () => {
      const station = player.getCurrentStation?.();
      if (!station) return null;
      const now = player.getNowPlaying?.();
      return { title: station.title, genre: station.genre ?? "", streamTitle: now?.streamTitle ?? "" };
    },
    emit: (event, detail) => player.emit?.(event, detail)
  });
  skinHooks.pickFile = () => surface.pickFile();
  skinHooks.getBuiltin = () => BUILTIN_MODERN_SKINS;
  skinHooks.getMode = () => surface.getMode();
  skinHooks.showClassic = () => surface.showClassic();
  skinHooks.getRecent = () => surface.getRecentModernSkins();
  skinHooks.pickRecent = (label) => surface.showRecentModernSkin(label).catch((error) => player.emit?.("error", { reason: error?.message ?? String(error) }));
  skinHooks.pickBuiltin = (skin) => surface.setSkin(skin.url, skin.label, { variant: skin.variant }).catch((error) => player.emit?.("error", { reason: error?.message ?? String(error) }));

  const refit = () => {
    fit();
    surface.fit();
  };
  refit();
  const observer = new ResizeObserver(refit);
  observer.observe(container);

  // Webamp measures document.body for its off-screen checks; keep the row put.
  window.addEventListener("resize", refit);

  if (playerOptions.restoreSkin !== false) {
    await surface.restore();
  }

  // --- Themes ---------------------------------------------------------------
  // A theme is the bundled classic skin plus the CSS that dresses what a skin
  // bitmap cannot reach. The class goes on the element carrying Webamp's
  // skinned chrome (#webamp), which is where the gen-* styles are scoped.
  const themedElements = () => [stage, overlays].filter(Boolean);
  let activeTheme = null;

  function paintTheme() {
    for (const el of themedElements()) {
      for (const theme of Object.values(THEMES)) {
        if (theme.className) el.classList.toggle(theme.className, theme === activeTheme);
      }
    }
  }

  async function applyTheme(id) {
    const theme = themeById(id);
    activeTheme = theme;
    paintTheme();
    if (!theme?.skin) {
      return theme?.id ?? null;
    }
    // The classic surface must be the one on show: the theme is a .wsz.
    surface.showClassic();
    const url = themeSkinUrl(theme, runtimeBase);
    await player.setSkin(url, theme.label);
    return theme.id;
  }

  // A remembered museum skin means the user picked a look of their own; it
  // must not be overwritten by the default theme on the next mount.
  const rememberedClassic = playerOptions.restoreSkin !== false ? readStoredSkin() : null;
  const storedTheme = !forceTheme && rememberedClassic ? null : theme;
  if (storedTheme) {
    try {
      await applyTheme(storedTheme);
    } catch (error) {
      player.emit?.("error", { reason: `Theme "${storedTheme}" did not load: ${error?.message ?? error}` });
    }
  } else {
    activeTheme = null;
    paintTheme();
  }

  return {
    ...player,
    container,
    stage,
    getScale: () => currentScale,
    refit,
    overlays,
    // Skins of either kind (File, Blob or URL): .wsz restyles the classic
    // player, .wal renders as a Modern view over it.
    setSkin: async (source, name, options) => {
      if (typeof source === "string" && /\.wsz(\?|$)/i.test(source)) {
        // Museum / catalogue URL: the classic skin menu keeps it as the
        // remembered classic skin.
        surface.showClassic();
        await player.setSkin(source, name);
        return "classic";
      }
      return surface.setSkin(source, name, options);
    },
    pickSkinFile: () => surface.pickFile(),
    showClassicSkin: () => surface.showClassic(),
    // Classic <-> the last Modern skin (asks for a .wal when none is stored).
    toggleSkinMode: () => surface.toggle(),
    getSkinMode: () => surface.getMode(),
    getRecentModernSkins: () => surface.getRecentModernSkins(),
    // Skins shipped with the app: [{ id, label, url, variant? }].
    // Themes: a bundled classic skin plus its CSS layer. Ids come from
    // the report's `getThemes()`; null restores the plain Webamp look.
    setTheme: (id) => applyTheme(id),
    getTheme: () => activeTheme?.id ?? null,
    getThemes: () => themeList(),
    getBuiltinModernSkins: () => BUILTIN_MODERN_SKINS,
    setBuiltinModernSkin: (id) => {
      const skin = BUILTIN_MODERN_SKINS.find((s) => s.id === id);
      if (!skin) throw new Error(`Unknown built-in skin: ${id}`);
      return surface.setSkin(skin.url, skin.label, { variant: skin.variant });
    },
    showRecentModernSkin: (label) => surface.showRecentModernSkin(label),
    getModernSkin: () => surface.getModern(),
    dispose: () => {
      surface.dispose();
      observer.disconnect();
      stopMenuWatch();
      window.removeEventListener("resize", refit);
      stage.removeEventListener("mousedown", stopDrag, true);
      stage.removeEventListener("touchstart", stopDrag, true);
      player.dispose();
      stage.remove();
      overlays.remove();
      container.classList.remove("webamp-dock");
    }
  };
}

// The IIFE build exposes these as window.WebampRadio (so `WebampRadio.mount(...)`).
export { mountWebampRadio as mount, createRadioPlayer, normalizeStations, fromMinkaStation };
export { searchMusic, toMusicRow } from "./lacitis/search.js";
