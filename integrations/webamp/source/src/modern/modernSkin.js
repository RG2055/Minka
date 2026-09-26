// Mounts a Winamp Modern / Wasabi skin (.wal) as a rendering layer over the
// classic Webamp player.
//
//   Webamp classic (store, media, playlist, radio modules)  <- authoritative
//        │  createWebampClassicAudioAdapter / createWebampPlaylistProvider
//        ▼
//   webamp-modern UIRoot (XML + MAKI + native PNGs + TrueType)  <- view only
//
// webamp-modern (src/vendor/webamp-modern, the snowpack build of
// packages/webamp-modern, see tools/sync-webamp-modern.sh) is a lazy chunk:
// the classic player pays nothing until a Modern skin is chosen.

import { createWebampClassicAudioAdapter } from "./webampClassicAudioAdapter.js";
import { createWebampPlaylistProvider } from "./webampPlaylistProvider.js";
// The engine's stylesheet (webamp.css and what it @imports), bundled as text
// and scoped at runtime. Keep in step with src/vendor/webamp-modern/css/webamp.css.
import cssElements from "../vendor/webamp-modern/css/elements.css?raw";
import cssList from "../vendor/webamp-modern/css/list.css?raw";
import cssButton from "../vendor/webamp-modern/css/button.css?raw";
import cssScrollbar from "../vendor/webamp-modern/css/scrollbar.css?raw";
import cssWmz from "../vendor/webamp-modern/css/wmz.css?raw";
import cssKjofol from "../vendor/webamp-modern/css/kjofol.css?raw";
import cssSonique from "../vendor/webamp-modern/css/sonique.css?raw";
import cssWebamp from "../vendor/webamp-modern/css/webamp.css?raw";

// Runtime assets the engine fetches (assets/freeform/...): served as files
// next to the page under modern/assets/. A host can move them with
// `assetsBase`.
const DEFAULT_ASSETS_BASE = new URL("modern/assets/", document.baseURI).href;
// Containers to show, in the order they are laid out (container default_x/y).
//
// Album art is included because Winamp 5.5 opens it by itself
// (`default_visible="1"`) and the skin's menu has no entry for it: leaving it
// out means the cover is fetched and then never shown anywhere. It declares
// w=164 h=164 and default_x/y, so it lands to the right of the player.
const DEFAULT_CONTAINERS = ["main", "equalizer", "PLEdit", "winamp.albumart"];

let stylesLoaded = null;

function ensureStyles() {
  if (stylesLoaded) {
    return stylesLoaded;
  }
  stylesLoaded = (async () => {
    // UIRoot writes generated CSS into these two <style> elements by id.
    for (const id of ["bitmap-css", "truetypefont-css"]) {
      if (!document.getElementById(id)) {
        const style = document.createElement("style");
        style.id = id;
        document.head.append(style);
      }
    }
    // webamp.css styles bare element selectors (button, select, slider, text)
    // for its own demo page; scoped under the host so the app's own controls
    // are untouched.
    const css = [cssElements, cssList, cssButton, cssScrollbar, cssWmz, cssKjofol, cssSonique, cssWebamp.replace(/@import[^;]*;/g, "")].join("\n");
    const style = document.createElement("style");
    style.id = "webamp-modern-css";
    style.textContent = scopeCss(css, ".webamp-modern-host");
    document.head.append(style);
  })();
  return stylesLoaded;
}

// Windows the host embeds into a skin (our media library inside a
// <windowholder>) keep their own styling: the engine's element rules
// (button, text, layer... are positioned absolutely) must not reach them.
const HOSTED = ".webamp-modern-hosted-window";
const scopeSelector = (scope, selector) => `${scope} ${selector.trim()}:not(${HOSTED} *)`;

function scopeCss(text, scope) {
  const sheet = new CSSStyleSheet();
  try {
    sheet.replaceSync(text);
  } catch {
    return text;
  }
  const out = [];
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        rule.selectorText = rule.selectorText
          .split(",")
          .map((selector) => scopeSelector(scope, selector))
          .join(", ");
        out.push(rule.cssText);
      } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
        const inner = [];
        for (const child of rule.cssRules) {
          if (child instanceof CSSStyleRule) {
            child.selectorText = child.selectorText.split(",").map((s) => scopeSelector(scope, s)).join(", ");
          }
          inner.push(child.cssText);
        }
        out.push(`${rule.cssText.split("{")[0]}{${inner.join("\n")}}`);
      } else {
        out.push(rule.cssText);
      }
    }
  };
  visit(sheet.cssRules);
  return out.join("\n");
}

/**
 * @param {object} options
 * @param {import("webamp").default} options.webamp  the classic player (authoritative)
 * @param {HTMLElement} options.host     element the skin renders into
 * @param {Blob|string} options.skin     the .wal file the user supplied (or a url)
 * @param {string[]} [options.containers] which skin containers to show (default: main, equalizer, PLEdit)
 * @param {"skin"|"row"} [options.layout] "skin": containers at their default_x/y;
 *   "row": the shown containers side by side at y=0, in `containers` order
 *   (the Minka bottom-bar arrangement). The host is sized to fit either way.
 * @param {() => {width:number,height:number}} [options.desktop] the box skin
 *   scripts treat as the screen (getViewportWidth & co.). Defaults to the
 *   host's own size, else the page.
 * @param {() => {width:number,height:number}} [options.bar] the host's bar as
 *   it is now (what `desktop` may grow to); defaults to `desktop`.
 * @param {() => void} [options.onLayoutChanged] a window's snap adjust changed
 *   (its drawer opened/closed): call `fit()` again.
 * @param {string} [options.assetsBase] where modern/assets/ is served from
 * @param {Record<string, Record<string, string|number>>} [options.privateDefaults]
 *   initial private config for skin scripts, per skin name (see builtinSkins.js)
 * @param {(action, param, target) => boolean|void} [options.onAction] take over
 *   skin actions (guid:ml, eject, menu...); return true when handled.
 * @param {(action, param, target) => boolean|null} [options.isActionActive]
 * @param {string} [options.skinRoot] folder inside the archive when it holds several skins
 * @param {Record<string,string>|"auto"} [options.layouts] layout per container id
 *   ("main": "shade"); "auto" picks, per container, the first layout whose
 *   minimum size fits the desktop box (Big Bento in a bar = its shade layout).
 */
export async function mountModernSkin({ webamp, host, skin, containers = DEFAULT_CONTAINERS, layout = "skin", desktop, onAction, isActionActive, layouts = "auto", skinRoot, seedTracks, getStationInfo, holdWindow, releaseWindow, assetsBase, privateDefaults, bar = desktop, onLayoutChanged }) {
  await ensureStyles();
  // The engine (src/vendor/webamp-modern, bundled by Vite into its own lazy
  // chunk). The skin engines register themselves on import; the WAL engine
  // is the one that reads Winamp Modern / Wasabi archives.
  await import("../vendor/webamp-modern/skin/SkinEngine_WAL.js");
  const { Webamp5 } = await import("../vendor/webamp-modern/WebampModern.js");

  const audio = createWebampClassicAudioAdapter(webamp);
  audio.getStationInfo = getStationInfo ?? null;
  const playlistProvider = createWebampPlaylistProvider(webamp);

  // Webamp's playlist is the single source of truth, and the Modern playlist
  // editor reads straight through it. While it is empty the Modern window opens
  // with no stations, even though the host has a library full of them. Fill it
  // once with the host's stations, using appendTracks rather than
  // setTracksToPlay so nothing starts playing on its own.
  try {
    if (webamp.store.getState().playlist.trackOrder.length === 0) {
      const seed = seedTracks?.() ?? [];
      if (seed.length > 0) {
        webamp.appendTracks(seed);
      }
    }
  } catch (error) {
    console.warn("Could not seed the Modern playlist:", error);
  }

  host.classList.add("webamp-modern-host");
  const desktopRect = desktop
    ? () => ({ left: 0, top: 0, ...desktop() })
    : undefined;
  const instance = new Webamp5(host, {
    skin,
    tracks: [],
    audio,
    playlistProvider,
    containers,
    desktop: desktopRect,
    assetsBase: assetsBase ?? DEFAULT_ASSETS_BASE,
    privateDefaults,
    onLayoutSnapAdjustChanged: () => onLayoutChanged?.(),
    // A zip holding several skin folders: which one (see skinSurface.js).
    skinRoot,
    // The skin's own library / eject / menu buttons go to the host's features.
    onAction,
    isActionActive,
    // <windowholder hold="guid:..."> -> the host's windows (media library...).
    holdWindow,
    releaseWindow
  });
  await instance.ready();

  const uiRoot = instance.getUIRoot();
  const shown0 = containers
    .map((id) => uiRoot.getContainers().find((c) => (c.getId() || "").toLowerCase() === id.toLowerCase()))
    .filter((c) => c && c.getVisible());

  // Which layout each shown container uses. Wasabi skins ship a "normal"
  // and a "shade" (bar) layout; a host with a low box (a bottom bar) needs
  // the one whose minimum size fits, and a stretchable bar layout is
  // widened to the box.
  const box = desktop?.() ?? null;
  // A layout "fits" when the host's box can show it at no less than half
  // size (the row is zoomed down to the box). The box is the bar at the
  // height the host allows it to grow to; only a window that cannot fit
  // even so falls back to its shade (bar) layout.
  const MIN_SCALE = 0.5;
  const layoutFits = (l) => {
    if (!box) return true;
    const minH = l._minimumHeight || l._h || 0;
    const minW = l._minimumWidth || 0;
    return minH * MIN_SCALE <= box.height && minW * MIN_SCALE <= box.width;
  };
  for (const container of shown0) {
    const wanted = layouts === "auto" ? null : layouts?.[container.getId()] ?? layouts?.[(container.getId() || "").toLowerCase()];
    if (wanted) {
      if (container.getlayout(wanted)) container.switchtolayout(wanted);
      continue;
    }
    if (layouts !== "auto" || !container._activeLayout) continue;
    if (!layoutFits(container._activeLayout)) {
      const fitting = container._layouts.find(layoutFits);
      if (fitting) container.switchtolayout(fitting._id);
    }
    const active = container._activeLayout;
    // Stretch a resizable bar layout (Big Bento shade: w=605, min 565, no
    // maximum) to the box width; fixed layouts keep their size.
    //
    // `_maximumWidth` is 0 rather than null when a layout declares no maximum,
    // so the check has to allow 0 explicitly — otherwise every resizable layout
    // is treated as stretchable. Only one container may take the full width:
    // when several are shown side by side (this skin's main + pledit), giving
    // each the box width makes the row twice as wide as the window, and the
    // whole skin is then scaled down to fit, which is what makes it look small.
    const stretchable = (layout) =>
      Boolean(layout) && (layout._maximumWidth === 0 || layout._maximumWidth == null);
    // Containers a skin keeps as 1x1 placeholders (Bento's pledit) do not
    // count as windows sharing the row.
    const shownCount = shown0.filter((c) => c.getWidth() > 1 && c.getHeight() > 1).length;
    if (box && active && active._minimumWidth && stretchable(active) && shownCount === 1) {
      // Leave room for the host to show a low bar layout at 2x (crisp): an
      // 18 px windowshade in a 150 px bar is stretched to half the width and
      // then doubled, rather than stretched to the full width at 1x. `bar`
      // is the host's bar as it is (the box the host zooms into), not the
      // size it may grow to: growing the bar just to double a layout that
      // already fits it is not wanted.
      const barBox = bar?.() ?? box;
      const up = Math.max(1, Math.min(2, Math.floor(barBox.height / Math.max(1, active.getheight()))));
      const width = Math.max(active._minimumWidth, Math.floor(box.width / up));
      if (width !== active.getwidth()) container.setWidth(width);
    }
  }
  const shown = shown0;

  // Live sizes: skins resize their own windows from scripts after load
  // (Big Bento's autoresize, Bento's SUI), so the row and the bounds are
  // recomputed from the containers every time.
  const isPlaceholder = (c) => c.getWidth() <= 1 || c.getHeight() <= 1;
  const arrange = () => {
    // Bento keeps its pledit container as a 1x1 placeholder: it takes no
    // slot in the row and adds nothing to the bounds (an extra pixel would
    // make the fit a fractional zoom, which bleeds sprite edges).
    const visible = shown.filter((c) => c.getVisible() && !isPlaceholder(c));
    // A skin script may switch a window back to a layout the bar cannot
    // hold (Bento's maximize/aerosnap restore a saved "normal" state); the
    // host's box wins, so such a window goes back to the layout that fits.
    if (layouts === "auto" && box) {
      for (const container of visible) {
        const active = container._activeLayout;
        if (active && !layoutFits(active)) {
          const fitting = container._layouts.find(layoutFits);
          if (fitting && fitting !== active) container.switchtolayout(fitting._id);
        }
      }
    }
    // Windows are laid out by their snap-adjusted rect, as Winamp docks
    // them: Winamp Modern's main layout is 280 px tall but the closed drawer
    // below the 164 px player is not window (snapadjustbottom).
    const visibleW = (c) => c.getVisibleWidth?.() ?? c.getWidth();
    const visibleH = (c) => c.getVisibleHeight?.() ?? c.getHeight();
    if (layout === "row") {
      let x = 0;
      for (const container of visible) {
        container.setLocation(x, 0);
        x += visibleW(container);
      }
    }
    const bounds = visible.reduce(
      (acc, c) => ({
        width: Math.max(acc.width, c.getleft() + visibleW(c)),
        height: Math.max(acc.height, c.gettop() + visibleH(c))
      }),
      { width: 0, height: 0 }
    );
    host.style.width = `${bounds.width}px`;
    host.style.height = `${bounds.height}px`;
    handle.bounds = bounds;
    return bounds;
  };
  const handle = { bounds: { width: 0, height: 0 } };
  arrange();

  // Shrinks the whole skin (CSS zoom, never a per-window rescale) so the row
  // fits the width the host has for it. Returns the scale and the height
  // the host must reserve. Above 1 is never applied here: pixel bitmaps only
  // stay 1:1 or smaller; the host may zoom whole multiples itself.
  const fit = (availableWidth) => {
    const bounds = arrange();
    const scale = Math.min(1, availableWidth / bounds.width) || 1;
    host.style.zoom = scale === 1 ? "" : String(scale);
    return { scale, width: Math.round(bounds.width * scale), height: Math.round(bounds.height * scale) };
  };
  // Fresh skin: MAKI init ran, adapter state is already live. Push the
  // current values once so texts that only listen for changes catch up.
  // Volume/balance are not announced: sliders read them on creation, and
  // Winamp fires no onVolumeChanged at skin load (Big Bento pops its volume
  // panel on that event).
  audio.trigger("statchanged");
  audio.trigger("timeupdate");

  Object.assign(handle, {
    instance,
    uiRoot,
    audio,
    playlistProvider,
    layout,
    arrange,
    fit,
    switchSkin: (nextSkin) => instance.switchSkin(nextSkin),
    getContainer: (id) => uiRoot.getContainers().find((c) => (c.getId() || "").toLowerCase() === id.toLowerCase()) ?? null,
    dispose: () => {
      audio.dispose();
      playlistProvider.dispose();
      instance.dispose();
      host.classList.remove("webamp-modern-host");
      host.style.width = "";
      host.style.height = "";
      host.style.zoom = "";
    }
  });
  return handle;
}
