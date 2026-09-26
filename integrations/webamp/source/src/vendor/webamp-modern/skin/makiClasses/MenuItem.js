import {installGlobalMouseDown, uninstallGlobalMouseDown} from "./GuiObj.js";
let ACTIVE_POPUP = null;
export function destroyActivePopup() {
  console.log("globalWindowClick");
  if (ACTIVE_POPUP != null) {
    ACTIVE_POPUP.doClosePopup();
  }
  uninstallGlobalClickListener();
}
export function setActivePopup(popup) {
  ACTIVE_POPUP = popup;
  if (popup) {
    installGlobalClickListener();
  } else {
    uninstallGlobalClickListener();
  }
}
export function deactivePopup(popup) {
  if (popup == ACTIVE_POPUP) {
    setActivePopup(null);
  }
}
let globalClickInstalled = false;
function installGlobalClickListener() {
  setTimeout(() => {
    if (!globalClickInstalled) {
      installGlobalMouseDown(destroyActivePopup);
      document.addEventListener("mousedown", destroyActivePopup);
      globalClickInstalled = true;
    }
  }, 500);
}
function uninstallGlobalClickListener() {
  if (globalClickInstalled) {
    document.removeEventListener("mousedown", destroyActivePopup);
    globalClickInstalled = false;
    uninstallGlobalMouseDown(destroyActivePopup);
  }
}
export function forEachMenuItem(popup, callback) {
  for (const menu of popup.children) {
    if (menu.type == "menuitem") {
      callback(menu);
    } else if (menu.type == "popup") {
      forEachMenuItem(menu.popup, callback);
    }
  }
}
export function extractCaption(text) {
  const [caption, shortcut] = text.split("	");
  const keychar = caption.includes("&") ? caption[caption.indexOf("&") + 1].toLowerCase() : "";
  return {caption, shortcut, keychar};
}
export function generatePopupDiv(popup, callback) {
  const root = document.createElement("ul");
  root.className = "popup-menu-container";
  for (const menu of popup.children) {
    let item;
    switch (menu.type) {
      case "menuitem":
        if (menu.invisible === true) {
          continue;
        }
        item = generatePopupItem(menu);
        item.addEventListener("mousedown", (e) => callback(menu.id));
        break;
      case "popup":
        item = generatePopupItem(menu);
        const subMenu = generatePopupDiv(menu.popup, callback);
        item.appendChild(subMenu);
        break;
      case "separator":
        item = document.createElement("hr");
        break;
    }
    root.appendChild(item);
  }
  return root;
}
function generatePopupItem(menu) {
  const item = document.createElement("li");
  const checkMark = document.createElement("span");
  checkMark.classList.add("checkmark");
  checkMark.textContent = menu.checked ? "✓" : " ";
  item.appendChild(checkMark);
  const label = generateCaption(menu.caption);
  label.classList.add("caption");
  item.appendChild(label);
  const shortcut = document.createElement("span");
  shortcut.classList.add("keystroke");
  shortcut.textContent = menu.type == "menuitem" ? menu.shortcut : "";
  item.appendChild(shortcut);
  const chevron = document.createElement("span");
  chevron.classList.add("chevron");
  chevron.textContent = menu.type == "popup" ? "🞂" : " ";
  item.appendChild(chevron);
  return item;
}
function generateCaption(caption) {
  const regex = /(&(\w))/gm;
  const subst = `<u>$2</u>`;
  caption = caption.replace(regex, subst);
  const span = document.createElement("span");
  span.classList.add("caption");
  span.innerHTML = caption;
  return span;
}
