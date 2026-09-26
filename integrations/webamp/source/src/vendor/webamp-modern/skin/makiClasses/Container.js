import {assert, num, px, removeAllChildNodes, toBool} from "../../utils.js";
import XmlObj from "../XmlObj.js";
export default class Container extends XmlObj {
  constructor(uiRoot) {
    super();
    this._layouts = [];
    this._activeLayout = null;
    this._visible = false;
    this._dynamic = false;
    this._x = 0;
    this._y = 0;
    this._div = document.createElement("container");
    this._uiRoot = uiRoot;
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "name":
        this.setname(value);
        break;
      case "id":
        this._originalId = value;
        this._id = value.toLowerCase();
        break;
      case "dynamic":
        this._dynamic = toBool(value);
        break;
      case "component":
        this._componentGuid = value.toLowerCase().split(":")[1];
        this.resolveAlias();
        break;
      case "default_visible":
        this._visible = value == "1" && !this._dynamic;
        break;
      case "x":
      case "default_x":
        this._x = num(value) ?? 0;
        this._renderDimensions();
        break;
      case "y":
      case "default_y":
        this._y = num(value) ?? 0;
        this._renderDimensions();
        break;
      default:
        return false;
    }
    return true;
  }
  init() {
    for (const layout of this._layouts) {
      layout.init();
    }
    for (const layout of this._layouts) {
      layout.afterInited();
    }
    this._uiRoot.vm.dispatch(this, "onswitchtolayout", [
      {type: "OBJECT", value: this.getcurlayout()}
    ]);
  }
  dispose() {
    for (const layout of this._layouts) {
      layout.dispose();
    }
  }
  setname(name) {
    this._name = name;
  }
  getname() {
    return this._name;
  }
  getguid() {
    return this._componentGuid;
  }
  resolveAlias() {
    const guid = this._componentGuid;
    this._componentAlias = this._uiRoot.guid2alias(guid);
    if (this._componentGuid && !this._componentAlias) {
      console.warn(`unknown component alias for guid:${this._componentGuid}`, `for id:${this.getId()}`);
    }
  }
  hasId(id) {
    if (!id)
      return false;
    id = id.toLowerCase();
    const useGuid = id.startsWith("guid:");
    if (useGuid) {
      id = id.substring(5);
      return this._componentGuid == id || this._componentAlias == id;
    } else {
      return this._id == id;
    }
  }
  getId() {
    return this._id;
  }
  getOriginalId() {
    return this._originalId;
  }
  getDiv() {
    return this._div;
  }
  getWidth() {
    return this._activeLayout.getwidth();
  }
  getHeight() {
    return this._activeLayout.getheight();
  }
  getVisibleWidth() {
    return this._activeLayout?.getVisibleWidth?.() ?? this.getWidth();
  }
  getVisibleHeight() {
    return this._activeLayout?.getVisibleHeight?.() ?? this.getHeight();
  }
  setWidth(w) {
    this._activeLayout.setXmlAttr("w", String(w));
  }
  setHeight(h) {
    this._activeLayout.setXmlAttr("h", String(h));
  }
  gettop() {
    return this._y;
  }
  getleft() {
    return this._x;
  }
  center() {
    const height = document.documentElement.clientHeight;
    const width = document.documentElement.clientWidth;
    this._div.style.top = px((height - this.getHeight()) / 2);
    this._div.style.left = px((width - this.getWidth()) / 2);
  }
  setLocation(x, y) {
    if (x == this._x && y == this._y) {
      return;
    }
    this._x = x;
    this._y = y;
    this._renderDimensions();
  }
  show() {
    if (!this._activeLayout) {
      this.switchtolayout(this._layouts[0]._id);
    }
    this._visible = true;
    this._renderLayout();
  }
  hide() {
    this._visible = false;
    this._renderLayout();
  }
  toggle() {
    if (!this._visible)
      this.show();
    else
      this.hide();
  }
  close() {
    this._activeLayout = null;
    this.hide();
  }
  getVisible() {
    return this._visible;
  }
  getlayout(layoutId) {
    const lower = layoutId.toLowerCase();
    for (const layout of this._layouts) {
      if (layout.getId() === lower) {
        return layout;
      }
    }
    throw new Error(`Could not find a container with the id; "${layoutId}"`);
  }
  isdynamic() {
    return this._dynamic ? 1 : 0;
  }
  getcurlayout() {
    return this._activeLayout;
  }
  addLayout(layout) {
    layout.setParent(this);
    this._layouts.push(layout);
    if (this._activeLayout == null) {
      this._activeLayout = layout;
    }
  }
  getnumlayouts() {
    return this._layouts.length;
  }
  enumlayout(num2) {
    return this._layouts[num2];
  }
  addChild(layout) {
    this.addLayout(layout);
  }
  _clearCurrentLayout() {
    removeAllChildNodes(this._div);
  }
  switchtolayout(layout_id) {
    const layout = this.getlayout(layout_id);
    assert(layout != null, `Could not find layout with id "${layout_id}".`);
    this._uiRoot.vm.dispatch(this, "onswitchtolayout", [
      {type: "OBJECT", value: layout}
    ]);
    this._clearCurrentLayout();
    this._activeLayout = layout;
    this._renderLayout();
  }
  dispatchAction(action, param, actionTarget) {
    switch (action) {
      case "SWITCH":
        this.switchtolayout(param);
        break;
      default:
        this._uiRoot.dispatch(action, param, actionTarget);
    }
  }
  _renderDimensions() {
    this._div.style.left = px(this._x);
    this._div.style.top = px(this._y);
  }
  _renderLayout() {
    if (this._visible && this._activeLayout) {
      this._div.appendChild(this._activeLayout.getDiv());
    } else {
      this._clearCurrentLayout();
    }
  }
  _renderLayouts() {
    for (const layout of this._layouts) {
      layout.draw();
    }
  }
  draw() {
    this.getId() && this._div.setAttribute("id", this.getId());
    this._div.setAttribute("tabindex", "1");
    this._renderDimensions();
    this._renderLayouts();
    this._renderLayout();
  }
}
Container.GUID = "e90dc47b4ae7840d0b042cb0fcf775d2";
