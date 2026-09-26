// The VIDEO window: Webamp's generated-window chrome (the same .gen-window
// structure the Media Library and the skin browser use, painted by the
// skin) around one pane that shows either the current YouTube track's
// thumbnail (an <img>, nothing else) or, while a YouTube track plays, the
// one YT.Player iframe. Never both; the iframe is created by the engine
// inside `playerHost()` on the first play and stays there for reuse.
//
// Closing the window while a video plays pauses Webamp (the host's onClose)
// rather than destroying the player; opening it again shows the same one.

import { MIN_PLAYER_SIZE } from "./engine.js";

const POSITION_KEY = "webamp.video.window.v2";
// The window at YouTube's minimum: a 200x200 pane plus the gen-window
// chrome (13 x 34). It may be taller/wider to line up with the host's row.
export const MIN_WINDOW = { width: 213, height: 234 };

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

export function createVideoWindow({ overlayHost = null, getDefaultPosition, onClose } = {}) {
  const overlay = el("div", "video-overlay");
  overlay.hidden = true;

  const windowEl = el("div", "gen-window window video-window");
  const top = el("div", "gen-top draggable");
  const topRight = el("div", "gen-top-right draggable");
  const closeButton = el("div", "gen-close winamp-active");
  closeButton.setAttribute("role", "button");
  closeButton.setAttribute("aria-label", "Close video window");
  closeButton.tabIndex = 0;
  topRight.append(closeButton);
  const titleNode = el("div", "gen-top-title draggable");
  for (const ch of "VIDEO") {
    titleNode.append(el("div", `draggable gen-text-letter gen-text-${ch.toLowerCase()}`));
  }
  top.append(
    el("div", "gen-top-left draggable"),
    el("div", "gen-top-left-fill draggable"),
    el("div", "gen-top-left-end draggable"),
    titleNode,
    el("div", "gen-top-right-end draggable"),
    el("div", "gen-top-right-fill draggable"),
    topRight
  );
  const middle = el("div", "gen-middle");
  const middleLeft = el("div", "gen-middle-left draggable");
  middleLeft.append(el("div", "gen-middle-left-bottom draggable"));
  const middleCenter = el("div", "gen-middle-center");
  const middleRight = el("div", "gen-middle-right draggable");
  middleRight.append(el("div", "gen-middle-right-bottom draggable"));
  middle.append(middleLeft, middleCenter, middleRight);
  const bottom = el("div", "gen-bottom");
  bottom.append(el("div", "gen-bottom-left draggable"), el("div", "gen-bottom-fill draggable"), el("div", "gen-bottom-right draggable"));

  // The pane: thumbnail or player, one at a time.
  const body = el("div", "video-body");
  const thumb = el("img", "video-thumb");
  thumb.alt = "";
  thumb.decoding = "async";
  thumb.loading = "lazy";
  thumb.referrerPolicy = "no-referrer";
  thumb.hidden = true;
  const host = el("div", "video-player");
  host.style.minWidth = `${MIN_PLAYER_SIZE}px`;
  host.style.minHeight = `${MIN_PLAYER_SIZE}px`;
  host.hidden = true;
  body.append(thumb, host);
  middleCenter.append(body);
  windowEl.append(top, middle, bottom);
  overlay.append(windowEl);

  let mode = "idle"; // "idle" | "thumbnail" | "player"

  function mount() {
    const root = overlayHost ?? document.querySelector("#webamp");
    if (root && overlay.parentElement !== root) root.append(overlay);
    else if (!root && !overlay.parentElement) document.body.append(overlay);
  }

  // --- Placement (same rules as the Media Library window) -------------------
  function setSize(width, height) {
    windowEl.style.setProperty("width", `${Math.max(MIN_WINDOW.width, Math.round(width || 0))}px`, "important");
    windowEl.style.setProperty("height", `${Math.max(MIN_WINDOW.height, Math.round(height || 0))}px`, "important");
  }
  setSize(MIN_WINDOW.width, MIN_WINDOW.height);

  function placeWindow(left, topPos) {
    const maxLeft = Math.max(0, overlay.clientWidth - windowEl.offsetWidth);
    const maxTop = Math.max(0, overlay.clientHeight - windowEl.offsetHeight);
    windowEl.style.left = `${Math.round(Math.min(Math.max(0, left), maxLeft))}px`;
    windowEl.style.top = `${Math.round(Math.min(Math.max(0, topPos), maxTop))}px`;
    windowEl.classList.add("is-placed");
  }
  function readPosition() {
    try {
      return JSON.parse(localStorage.getItem(POSITION_KEY) ?? "null") ?? null;
    } catch {
      return null;
    }
  }
  function restorePosition() {
    const saved = readPosition();
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      placeWindow(saved.left, saved.top);
      return;
    }
    const overlayBounds = overlay.getBoundingClientRect();
    // The host may also size the window ({height}) to line up with its row.
    const wanted = getDefaultPosition?.({ width: windowEl.offsetWidth, height: windowEl.offsetHeight, min: MIN_WINDOW, overlay: overlayBounds });
    if (wanted) {
      if (wanted.height || wanted.width) setSize(wanted.width ?? windowEl.offsetWidth, wanted.height ?? windowEl.offsetHeight);
      placeWindow(wanted.left, wanted.top);
      return;
    }
    const playlist = document.querySelector("#playlist-window");
    const bounds = playlist?.getBoundingClientRect();
    if (bounds) {
      placeWindow(bounds.left - overlayBounds.left, bounds.top - overlayBounds.top - windowEl.offsetHeight - 8);
    } else {
      placeWindow((overlayBounds.width - windowEl.offsetWidth) / 2, (overlayBounds.height - windowEl.offsetHeight) / 2);
    }
  }
  let dragging = null;
  const onMouseDown = (event) => {
    if (event.button !== 0 || closeButton.contains(event.target)) return;
    event.preventDefault();
    const bounds = windowEl.getBoundingClientRect();
    dragging = { dx: event.clientX - bounds.left, dy: event.clientY - bounds.top };
    windowEl.classList.add("is-dragging");
  };
  const onMouseMove = (event) => {
    if (dragging) placeWindow(event.clientX - dragging.dx, event.clientY - dragging.dy);
  };
  const onMouseUp = () => {
    if (!dragging) return;
    dragging = null;
    windowEl.classList.remove("is-dragging");
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ left: windowEl.offsetLeft, top: windowEl.offsetTop }));
    } catch {
      // not persisted
    }
  };
  const onResize = () => {
    if (!overlay.hidden && windowEl.classList.contains("is-placed")) placeWindow(windowEl.offsetLeft, windowEl.offsetTop);
  };
  top.addEventListener("mousedown", onMouseDown);
  top.addEventListener("dblclick", (event) => {
    if (!closeButton.contains(event.target)) redock();
  });
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("resize", onResize);

  const close = () => {
    hide();
    onClose?.();
  };
  closeButton.addEventListener("click", close);
  closeButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      close();
    }
  });

  function show() {
    mount();
    const wasHidden = overlay.hidden;
    overlay.hidden = false;
    // Placed once (the host's default spot, or where the user left it) and
    // then left alone: the window is the user's to arrange.
    if (!windowEl.classList.contains("is-placed")) restorePosition();
  }
  /** Back to the host's default spot (a double-click on the title bar). */
  function redock() {
    try {
      localStorage.removeItem(POSITION_KEY);
    } catch {
      // nothing stored
    }
    windowEl.classList.remove("is-placed");
    if (!overlay.hidden) restorePosition();
  }
  function hide() {
    overlay.hidden = true;
  }

  function showThumbnail(url, { force = false } = {}) {
    // A playing video keeps its player; the thumbnail is for the idle state
    // (`force`: the track changed while stopped, so the player pane, which
    // would show a black cued video, gives way).
    if (mode === "player" && !force) return;
    mode = "thumbnail";
    host.hidden = true;
    if (url) {
      if (thumb.getAttribute("src") !== url) thumb.src = url;
      thumb.hidden = false;
    } else {
      thumb.removeAttribute("src");
      thumb.hidden = true;
    }
  }

  /** The element the engine creates the player in; shows the window. */
  function playerHost() {
    mode = "player";
    thumb.hidden = true;
    host.hidden = false;
    show();
    return host;
  }

  /** Back from the player to the thumbnail / idle pane (player stays in DOM, hidden). */
  function showIdle(thumbnailUrl = "") {
    mode = "idle";
    host.hidden = true;
    showThumbnail(thumbnailUrl);
  }

  return {
    element: overlay,
    show,
    hide,
    redock,
    setSize,
    isVisible: () => !overlay.hidden,
    getMode: () => mode,
    showThumbnail,
    playerHost,
    showIdle,
    dispose() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      overlay.remove();
    }
  };
}
