import Group from "./Group.js";
import {px} from "../../utils.js";
import Layer from "./Layer.js";
import {getWa5Popup} from "./menuWa5.js";
import {popupLayer} from "./PopupMenu.js";
import {
  destroyActivePopup,
  generatePopupDiv,
  setActivePopup
} from "./MenuItem.js";
import {findAction, updateActions} from "./menuWa5actions.js";
let ACTIVE_MENU_GROUP = "";
export default class Menu extends Group {
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key.toLowerCase()) {
      case "normal":
        this.setnormalid(value);
        break;
      case "hover":
        this.sethoverid(value);
        break;
      case "down":
        this.setdownid(value);
        break;
      case "next":
        this._nextMenuId = value.toLowerCase();
        break;
      case "prev":
        this._prevMenuId = value.toLowerCase();
        break;
      case "menu":
        this.setmenu(value);
        break;
      case "menugroup":
        this.setmenugroup(value);
        break;
      default:
        return false;
    }
    return true;
  }
  getmenu() {
    return this._menuId;
  }
  setmenu(menuId) {
    this._menuId = menuId;
  }
  getmenugroup() {
    return this._menuGroupId;
  }
  setmenugroup(groupId) {
    this._menuGroupId = groupId;
  }
  setnormalid(id) {
    this._normalId = id.toLowerCase();
  }
  setdownid(id) {
    this._downId = id.toLowerCase();
  }
  sethoverid(id) {
    this._hoverId = id.toLowerCase();
  }
  _showButton(el) {
    for (const obj of [this._elNormal, this._elHover, this._elDown]) {
      if (obj) {
        if (obj == el) {
          obj.show();
        } else {
          obj.hide();
        }
      }
    }
  }
  _setButtonWidth(w) {
    for (const obj of [this._elNormal, this._elHover, this._elDown]) {
      if (obj) {
        obj.setXmlAttr("w", w);
      }
    }
  }
  doClosePopup() {
    this._showButton(this._elNormal);
    this._div.classList.remove("open");
    this._placePopup(false);
  }
  onLeftButtonDown(x, y) {
    if (ACTIVE_MENU_GROUP != this._menuGroupId) {
      ACTIVE_MENU_GROUP = this._menuGroupId;
      destroyActivePopup();
      setActivePopup(this);
    } else {
      ACTIVE_MENU_GROUP = null;
      destroyActivePopup();
    }
    this.onEnterArea();
  }
  onEnterArea() {
    if (ACTIVE_MENU_GROUP == this._menuGroupId) {
      destroyActivePopup();
      this._showButton(this._elDown);
      this._div.classList.add("open");
      this._placePopup(true);
      setActivePopup(this);
    } else {
      this._showButton(this._elHover);
    }
  }
  onLeaveArea() {
    if (ACTIVE_MENU_GROUP != this._menuGroupId) {
      this._showButton(this._elNormal);
    }
  }
  setup() {
    super.setup();
    this.getparentlayout().registerShortcuts(this._popup);
  }
  resolveButtonsAction() {
    for (const obj of this.getparent()._children) {
      if (obj._id == this._normalId) {
        this._elNormal = obj;
      } else if (obj._id == this._hoverId) {
        this._elHover = obj;
      } else if (obj._id == this._downId) {
        this._elDown = obj;
      } else if (obj instanceof Layer && obj._image && !this._w) {
        this._elImage = obj;
        this.setXmlAttr("relatw", "0");
        const w = this._elImage.getwidth().toString();
        this.setXmlAttr("w", w);
        this._setButtonWidth(w);
      }
    }
  }
  draw() {
    this.resolveButtonsAction();
    super.draw();
    this._div.style.pointerEvents = "all";
    if (this._menuId.startsWith("WA5:")) {
      const [, popupId] = this._menuId.split(":");
      this._popup = getWa5Popup(popupId, this._uiRoot);
      this.invalidatePopup();
    }
  }
  invalidatePopup() {
    const self = this;
    if (this._popup) {
      if (this._popupDiv) {
        this._popupDiv.remove();
      }
      updateActions(this._popup, this._uiRoot);
      const menuItemClick = (id) => {
        console.log("menu clicked:", id);
        const action = findAction(id);
        const invalidateRequired = action.onExecute(self._uiRoot);
        if (invalidateRequired)
          self.invalidatePopup();
      };
      this._popupDiv = generatePopupDiv(this._popup, menuItemClick);
      this._popupDiv.classList.add("popup");
      popupLayer().appendChild(this._popupDiv);
      this._placePopup(this._div.classList.contains("open"));
    }
  }
  _placePopup(open) {
    const popup = this._popupDiv;
    if (!popup)
      return;
    if (!open) {
      popup.style.display = "none";
      return;
    }
    const rect = this._div.getBoundingClientRect();
    popup.style.display = "block";
    popup.style.left = px(rect.left + window.scrollX);
    popup.style.top = px(rect.bottom + window.scrollY);
  }
}
Menu.GUID = "73c00594401b961f24671b9b6541ac27";
