// Makes Webamp's own drag-to-resize handles work.
//
// Webamp already ships resize handles: the playlist and the Milkdrop window
// declare `canResize: true` and render a corner grip (`#playlist-resize-target`,
// `#gen-resize-target`) that emits WINDOW_SIZE_CHANGED using Winamp's own grid
// (25px horizontally, 29px vertically - the classic skin's tile size).
//
// The handles do not respond to a real mouse drag, however. Their React handler
// listens for `mousedown`, but the surrounding window component focuses the
// window on `pointerdown`, and focusing retargets the follow-up mouse event away
// from the grip. Stopping propagation of `pointerdown` on the grip keeps
// `mousedown` addressed to it, and the drag then works.

const GRIP_SELECTOR = [
  "#playlist-resize-target",
  "#gen-resize-target",
  "[id$='-resize-target']"
].join(",");

const styles = `
  /* The grips are painted by the skin; make their intent obvious. */
  #playlist-resize-target,
  #gen-resize-target {
    position: relative;
    z-index: 1;
  }
`;

function attachGrip(grip) {
  if (grip.dataset.resizeReady === "1") {
    return false;
  }
  grip.dataset.resizeReady = "1";

  // Keep the pointerdown local so the window's focus handler does not swallow
  // the mousedown the resize component relies on.
  grip.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  }, true);

  // Touch devices never fire mousedown, so forward the touch drag as mouse
  // events using the same coordinates the component already reads.
  grip.addEventListener("touchstart", (event) => {
    event.stopPropagation();
  }, { capture: true, passive: true });

  return true;
}

function scan() {
  let attached = 0;
  for (const grip of document.querySelectorAll(GRIP_SELECTOR)) {
    if (attachGrip(grip)) {
      attached += 1;
    }
  }
  return attached;
}

// `root` is the element Webamp renders into; only that subtree is watched, so
// the host page's own DOM churn never triggers a scan.
export function initResize(root = document.body) {
  // Grips are created with their windows, so watch for them appearing.
  let queued = false;
  const observer = new MutationObserver(() => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  scan();

  const style = document.createElement("style");
  style.textContent = styles;
  document.head.append(style);

  return { scan };
}
