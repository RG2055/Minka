import BaseObject from "./BaseObject.js";
import {assume, px} from "../../utils.js";
import {
  generatePopupDiv,
  extractCaption,
  destroyActivePopup,
  setActivePopup,
  deactivePopup
} from "./MenuItem.js";
import {registerAction} from "./menuWa5actions.js";
export function popupLayer() {
  let layer = document.getElementById("webamp-modern-popups");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "webamp-modern-popups";
    layer.className = "webamp-modern-host webamp-modern-popups";
    layer.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:var(--webamp-overlay-z, 100000);";
    document.body.appendChild(layer);
  }
  return layer;
}
function waitPopup(popup, x = 0, y = 0) {
  return new Promise((acc) => {
    const itemClick = (id) => {
      closePopup();
      acc(id);
    };
    const div = generatePopupDiv(popup, itemClick);
    if (x || y) {
      div.style.left = px(x);
      div.style.top = px(y);
    }
    popupLayer().appendChild(div);
    const closePopup = () => {
      div.remove();
      popup._successPromise = null;
    };
    const outsideClick = (ret) => {
      closePopup();
      acc(ret);
    };
    popup._successPromise = outsideClick;
    function handleClick() {
      document.removeEventListener("click", handleClick);
      closePopup();
      acc(-1);
    }
    document.addEventListener("click", handleClick);
  });
}
export default class PopupMenu extends BaseObject {
  constructor(uiRoot) {
    super();
    this.children = [];
    this._successPromise = null;
    this._uiRoot = uiRoot;
  }
  _addcommand(cmdText, cmd_id, checked = false, disabled = false, data = {}) {
    this.children.push({
      type: "menuitem",
      ...extractCaption(cmdText),
      id: cmd_id,
      checked,
      disabled,
      data
    });
  }
  addcommand(cmdText, cmd_id, checked, disabled) {
    if (cmd_id == 32767) {
      this._loadSkins();
      return;
    }
    this._addcommand(cmdText, cmd_id, checked, disabled);
  }
  addseparator() {
    this.children.push({type: "separator"});
  }
  addsubmenu(popup, submenutext) {
    this.children.push({
      type: "popup",
      popup,
      ...extractCaption(submenutext)
    });
  }
  checkcommand(cmd_id, check) {
    const item = this.children.find((item2) => {
      return item2.type === "menuitem" && item2.id === cmd_id;
    });
    assume(item != null, `Could not find item with id "${cmd_id}"`);
    if (item.type !== "menuitem") {
      throw new Error("Expected item to be an item.");
    }
    item.checked = check;
  }
  disablecommand(cmd_id, disable) {
    for (const item of this.children) {
      if (item.type == "menuitem" && item.id == cmd_id) {
        item.disabled = disable;
        break;
      }
    }
  }
  async popatmouse() {
    console.log("popAtMouse.start...:");
    const mousePos = this._uiRoot._mousePos;
    const result = await this.popatxy(mousePos.x, mousePos.y);
    console.log("popAtMouse.return:", result);
    return result;
  }
  async popatxy(x, y) {
    destroyActivePopup();
    setActivePopup(this);
    const ret = await waitPopup(this, x, y);
    deactivePopup(this);
    return ret;
  }
  doClosePopup() {
    if (this._successPromise) {
      this._successPromise(-1);
    }
  }
  _loadSkins() {
    let action_id = 32767;
    this._uiRoot._skins.forEach((skin) => {
      const name = typeof skin === "string" ? skin : skin.name;
      const url = typeof skin === "string" ? skin : skin.url;
      const skin_info = {name, url};
      action_id++;
      registerAction(action_id, {
        onUpdate: (menu, uiRoot) => {
          menu.checked = uiRoot.getSkinName() == menu.caption || uiRoot.getSkinUrl() == menu.data.url;
        },
        onExecute: (uiRoot) => {
          uiRoot.switchSkin(skin_info);
          return true;
        }
      });
      this._addcommand(name, action_id, false, false, skin_info);
    });
  }
  getnumcommands() {
    return this.children.length;
  }
  hideMenu(cmd_id) {
    for (const item of this.children) {
      if (item.type == "menuitem" && item.id == cmd_id) {
        item.invisible = true;
        break;
      }
    }
  }
}
PopupMenu.GUID = "f4787af44ef7b2bb4be7fb9c8da8bea9";
