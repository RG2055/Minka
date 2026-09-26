import Group from "./Group.js";
import * as Utils from "../../utils.js";
import {LEFT, RIGHT, TOP, BOTTOM, CURSOR} from "../Cursor.js";
import {px, unimplemented} from "../../utils.js";
import {forEachMenuItem} from "./MenuItem.js";
import {findAction} from "./menuWa5actions.js";
export default class Layout extends Group {
  constructor(uiRoot) {
    super(uiRoot);
    this._resizingDiv = null;
    this._resizing = false;
    this._resizing_start = null;
    this._canResize = 0;
    this._scale = 1;
    this._opacity = 1;
    this._desktopalpha = false;
    this._moving = false;
    this._snap = {left: 0, top: 0, right: 0, bottom: 0};
    this._shortcuts = {};
    this._resizeScale = 1;
    this._resizeLocal = null;
    this._isLayout = true;
  }
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "desktopalpha":
        this._desktopAlpha = Utils.toBool(value);
        break;
      case "snapadjustleft":
        this._snap.left = Number(value) || 0;
        break;
      case "snapadjusttop":
        this._snap.top = Number(value) || 0;
        break;
      case "snapadjustright":
        this._snap.right = Number(value) || 0;
        break;
      case "snapadjustbottom":
        this._snap.bottom = Number(value) || 0;
        break;
      default:
        return false;
    }
    return true;
  }
  getSnapAdjust() {
    return {...this._snap};
  }
  getVisibleWidth() {
    return Math.max(0, this.getwidth() - this._snap.left - this._snap.right);
  }
  getVisibleHeight() {
    return Math.max(0, this.getheight() - this._snap.top - this._snap.bottom);
  }
  _renderBackground() {
    super._renderBackground();
    if (this._background != null && this._w == 0 && this._h == 0) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      if (bitmap != null) {
        this._w = bitmap.getWidth();
        this._h = bitmap.getHeight();
        this._renderSize();
      }
    }
  }
  getcontainer() {
    return this._parent;
  }
  gettop() {
    return this._parent._y;
  }
  getleft() {
    return this._parent._x;
  }
  resize(x, y, w, h) {
    const container = this._parent;
    container.setXmlAttr("x", String(x));
    container.setXmlAttr("y", String(y));
    this._w = w;
    this._h = h;
    this._renderDimensions();
  }
  dispatchAction(action, param, actionTarget) {
    if (actionTarget != null) {
      const target = this.findobject(actionTarget);
      if (target != null) {
        target.handleAction(action, param, actionTarget);
      }
      return;
    }
    switch (action) {
      default:
        if (this._parent != null) {
          this._parent.dispatchAction(action, param, actionTarget);
        }
    }
  }
  snapadjust(left, top, right, bottom) {
    const changed = this._snap.left !== left || this._snap.top !== top || this._snap.right !== right || this._snap.bottom !== bottom;
    this._snap.left = left;
    this._snap.top = top;
    this._snap.right = right;
    this._snap.bottom = bottom;
    if (changed) {
      this.onsnapadjustchanged();
      this._uiRoot.onLayoutSnapAdjustChanged?.(this);
    }
  }
  onsnapadjustchanged() {
    this._uiRoot.vm.dispatch(this, "onsnapadjustchanged", []);
  }
  getsnapadjusttop() {
    return this._snap.top;
  }
  getsnapadjustleft() {
    return this._snap.left;
  }
  getsnapadjustright() {
    return this._snap.right;
  }
  beforeredock() {
  }
  redock() {
  }
  getsnapadjustbottom() {
    return this._snap.bottom;
  }
  clienttoscreenh(h) {
    return unimplemented(h);
  }
  islayoutanimationsafe() {
    return true;
  }
  istransparencysafe() {
    return true;
  }
  getscale() {
    return this._scale;
  }
  setscale(scalevalue) {
    this._scale = scalevalue;
    this.getDiv().style.transform = `scale(${this._scale})`;
  }
  setdesktopalpha(onoff) {
    this._desktopalpha = unimplemented(onoff);
  }
  getdesktopalpha() {
    return this._desktopalpha;
  }
  init() {
    super.init();
  }
  afterInited() {
    this._invalidateSize();
    this._uiRoot.vm.dispatch(this, "onstartup");
  }
  _screenScale() {
    const width = this._div.offsetWidth;
    return width ? this._div.getBoundingClientRect().width / width : 1;
  }
  setResizing(cmd, dx, dy) {
    const clampW = (w) => {
      w = this._maximumWidth ? Math.min(w, this._maximumWidth) : w;
      w = this._minimumWidth ? Math.max(w, this._minimumWidth) : w;
      return w;
    };
    const clampH = (h) => {
      h = this._maximumHeight ? Math.min(h, this._maximumHeight) : h;
      h = this._minimumHeight ? Math.max(h, this._minimumHeight) : h;
      return h;
    };
    const drawGhost = (local) => {
      const start = this._resizing_start;
      const scale = this._resizeScale;
      this._resizingDiv.style.cssText = `
        width: ${px(local.width * scale)};
        height: ${px(local.height * scale)};
        left: ${px(start.left + local.left * scale)};
        top: ${px(start.top + local.top * scale)};
        `;
    };
    if (cmd == "constraint") {
      this._canResize = dx;
    } else if (cmd == "start") {
      this.bringtofront();
      const r = this._div.getBoundingClientRect();
      this._resizing_start = r;
      this._resizeScale = this._screenScale();
      this._resizeLocal = {left: 0, top: 0, width: this.getwidth(), height: this.getheight()};
      this._resizing = true;
      this._resizingDiv = document.createElement("div");
      this._resizingDiv.className = "resizing";
      drawGhost(this._resizeLocal);
      document.body.appendChild(this._resizingDiv);
    } else if (dx == CURSOR && dy == CURSOR) {
      this._resizingDiv.style.cursor = cmd;
    } else if (cmd == "move") {
      if (!this._resizing) {
        return;
      }
      const scale = this._resizeScale;
      const ldx = dx / scale;
      const ldy = dy / scale;
      const startW = this.getwidth();
      const startH = this.getheight();
      let left = 0;
      let top = 0;
      let width = startW;
      let height = startH;
      if (this._canResize & RIGHT)
        width = clampW(startW + ldx);
      if (this._canResize & BOTTOM)
        height = clampH(startH + ldy);
      if (this._canResize & LEFT) {
        width = clampW(startW - ldx);
        left = startW - width;
      }
      if (this._canResize & TOP) {
        height = clampH(startH - ldy);
        top = startH - height;
      }
      this._resizeLocal = {left, top, width, height};
      drawGhost(this._resizeLocal);
    } else if (cmd == "final") {
      if (!this._resizing) {
        return;
      }
      this._resizing = false;
      const local = this._resizeLocal;
      const container = this._parent;
      this.setXmlAttr("w", String(Math.round(local.width)));
      this.setXmlAttr("h", String(Math.round(local.height)));
      container.setXmlAttr("x", String(Math.round(container._x + local.left)));
      container.setXmlAttr("y", String(Math.round(container._y + local.top)));
      this._resizingDiv.remove();
      this._resizingDiv = null;
      this._resizeLocal = null;
      this._invalidateSize();
    }
  }
  setMoving(cmd, dx, dy) {
    const container = this._parent;
    if (cmd == "start") {
      this._moving = true;
      this._movingStartX = container._x;
      this._movingStartY = container._y;
      this.bringtofront();
    } else if (dx == CURSOR && dy == CURSOR) {
    } else if (cmd == "move") {
      if (!this._moving) {
        return;
      }
      const scale = this._screenScale();
      container.setLocation(Math.round(this._movingStartX + dx / scale), Math.round(this._movingStartY + dy / scale));
    } else if (cmd == "final") {
      if (!this._moving) {
        return;
      }
      this._invalidateSize();
      this._moving = false;
    }
  }
  registerShortcuts(popup) {
    forEachMenuItem(popup, (m) => {
      if (m.shortcut) {
        this._shortcuts[m.shortcut] = m.id;
      }
    });
  }
  executeShorcut(shortcut) {
    const menuId = this._shortcuts[shortcut];
    const action = findAction(menuId);
    const invalidateRequired = action.onExecute(this._uiRoot);
  }
}
Layout.GUID = "60906d4e482e537e94cc04b072568861";
