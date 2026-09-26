// One cheap watcher for Webamp's context menu.
//
// Webamp renders its menu into a `#webamp-context-menu` node appended to
// document.body, rebuilt on every open. Several features need to react to
// that (adding menu items, keeping the menu on screen). Observing the whole
// body subtree for it would run on every DOM change of the host page —
// Minka repaints clocks and animations constantly — so only body's direct
// children are watched for the root, and the root's own subtree after that.

const listeners = new Set();
let rootObserver = null;
let bodyObserver = null;
let observedRoot = null;

function notify() {
  const menu = document.querySelector("#webamp-context-menu ul.context-menu");
  if (!menu) {
    return;
  }
  for (const listener of listeners) {
    try {
      listener(menu);
    } catch (error) {
      console.error(error);
    }
  }
}

function attachRoot() {
  const root = document.getElementById("webamp-context-menu");
  if (root === observedRoot) {
    return;
  }
  rootObserver?.disconnect();
  observedRoot = root;
  if (root) {
    rootObserver = new MutationObserver(notify);
    rootObserver.observe(root, { childList: true, subtree: true });
    notify();
  }
}

/** Calls `listener(menuUl)` whenever a Webamp context menu (re)renders. */
export function onContextMenu(listener) {
  listeners.add(listener);
  if (!bodyObserver) {
    bodyObserver = new MutationObserver(attachRoot);
    bodyObserver.observe(document.body, { childList: true });
    attachRoot();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      bodyObserver?.disconnect();
      rootObserver?.disconnect();
      bodyObserver = null;
      rootObserver = null;
      observedRoot = null;
    }
  };
}
