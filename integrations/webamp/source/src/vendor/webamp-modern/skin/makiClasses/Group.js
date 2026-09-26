import * as Utils from "../../utils.js";
import GuiObj from "./GuiObj.js";
import Movable from "./Movable.js";
const _Group = class extends Movable {
  constructor() {
    super(...arguments);
    this._inited = false;
    this._drawBackground = true;
    this._isLayout = false;
    this._systemObjects = [];
    this._allowZeroSize = false;
    this._measuring = false;
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "instance_id":
        this._instanceId = value;
        break;
      case "background":
        this._background = value;
        this._renderBackground();
        break;
      case "drawbackground":
        this._drawBackground = Utils.toBool(value);
        this._renderBackground();
        break;
      case "allowzerosize":
        this._allowZeroSize = Utils.toBool(value);
        break;
      default:
        return false;
    }
    return true;
  }
  _visibilityChanged() {
    for (const child of this._children) {
      child._visibilityChanged();
    }
  }
  init() {
    if (this._inited)
      return;
    this._inited = true;
    super.init();
    for (const child of this._children) {
      child.init();
    }
    for (const systemObject of this._systemObjects) {
      systemObject.init();
    }
  }
  dispose() {
    for (const systemObject of this._systemObjects) {
      systemObject.dispose();
    }
    for (const child of this._children) {
      child.dispose();
    }
  }
  getId() {
    return this._instanceId || this._id;
  }
  addSystemObject(systemObj) {
    systemObj.setParentGroup(this);
    this._systemObjects.push(systemObj);
  }
  addChild(child) {
    child.setParent(this);
    this._children.push(child);
  }
  getobject(objectId) {
    const lower = objectId.toLowerCase();
    for (const obj of this._children) {
      if (obj.getId() === lower) {
        return obj;
      }
    }
    const foundIds = this._children.map((child) => child.getId()).join(", ");
    throw new Error(`Could not find an object with the id: "${objectId}" within object "${this.getId()}". Only found: ${foundIds}`);
  }
  enumobject(index) {
    return this._children[index];
  }
  getnumobjects() {
    return this._children.length;
  }
  getparentlayout() {
    let obj = this;
    while (obj._parent) {
      if (obj._isLayout) {
        break;
      }
      obj = obj._parent;
    }
    if (!obj) {
      console.warn("getParentLayout", this.getId(), "failed!");
    }
    return obj;
  }
  islayout() {
    return this._isLayout;
  }
  getheight() {
    const h = super.getheight();
    if (h == 0 && this._allowZeroSize) {
      return h;
    }
    if (!h && this._background != null) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      if (bitmap)
        return bitmap.getHeight();
    }
    if (h) {
      return h;
    }
    return this._measureChildren().height;
  }
  getwidth() {
    if (this._autowidthsource) {
      const widthSource = this.findobject(this._autowidthsource);
      if (widthSource) {
        return widthSource.getautowidth();
      }
    }
    const w = super.getwidth();
    if (w == 0 && this._allowZeroSize) {
      return w;
    }
    if (w < 0) {
      return this._div.getBoundingClientRect().width || 0;
    }
    if (!w && this._background != null) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      if (bitmap)
        return bitmap.getWidth();
    }
    if (w) {
      return w;
    }
    const measured = this._div.getBoundingClientRect().width;
    if (measured) {
      return measured;
    }
    return this._measureChildren().width;
  }
  _measureChildren() {
    if (this._measuring)
      return {width: 0, height: 0};
    this._measuring = true;
    try {
      return this._measureChildrenInner();
    } finally {
      this._measuring = false;
    }
  }
  _measureChildrenInner() {
    let width = 0;
    let height = 0;
    for (const child of this._children ?? []) {
      const childWidth = typeof child.getwidth === "function" ? child.getwidth() : 0;
      const childHeight = typeof child.getheight === "function" ? child.getheight() : 0;
      const x = child._x ?? 0;
      const y = child._y ?? 0;
      if (!childWidth && !childHeight) {
        continue;
      }
      width = Math.max(width, (x ?? 0) + (childWidth ?? 0));
      height = Math.max(height, (y ?? 0) + (childHeight ?? 0));
    }
    return {width, height};
  }
  _renderBackground() {
    if (this._background != null && this._drawBackground) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      this.setBackgroundImage(bitmap);
    } else {
      this.setBackgroundImage(null);
    }
  }
  async doResize() {
    this._uiRoot.vm.dispatch(this, "onresize", [
      {type: "INT", value: 0},
      {type: "INT", value: 0},
      {type: "INT", value: this.getwidth()},
      {type: "INT", value: this.getheight()}
    ]);
  }
  async _invalidateSize() {
    const actualBox = this._div.getBoundingClientRect();
    if (actualBox.width != this._actualWidth || actualBox.height != this._actualHeight) {
      this._actualWidth = actualBox.width;
      this._actualHeight = actualBox.height;
      this.doResize();
      this.applyRegions();
    }
    for (const child of this._children) {
      if (child instanceof _Group)
        child._invalidateSize();
    }
  }
  applyRegions() {
    this._regionCanvas = null;
    let hasRegions = false;
    for (const child of this._children) {
      if (child._sysregion == -1 || child._sysregion == -2) {
        this.putAsRegion(child);
        hasRegions = true;
      }
    }
    if (hasRegions) {
      this.setRegion();
    }
    this._regionCanvas = null;
  }
  putAsRegion(child) {
    if (this._regionCanvas == null || this._regionCanvas.width == 0 || this._regionCanvas.height == 0) {
      const canvas = this._regionCanvas = document.createElement("canvas");
      const bound = this._div.getBoundingClientRect();
      canvas.width = bound.width;
      canvas.height = bound.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, bound.width, bound.height);
    }
    if (this._regionCanvas.width == 0 || this._regionCanvas.height == 0) {
      return;
    }
    const ctx2 = this._regionCanvas.getContext("2d");
    const r = child._div.getBoundingClientRect();
    const bitmap = child._backgroundBitmap;
    if (bitmap && bitmap.loaded()) {
      const img = bitmap.getImg();
      ctx2.drawImage(img, bitmap._x, bitmap._y, r.width, r.height, child._div.offsetLeft, child._div.offsetTop, r.width, r.height);
    }
  }
  setRegion() {
    if (this._regionCanvas.width == 0 || this._regionCanvas.height == 0) {
      return;
    }
    const ctx2 = this._regionCanvas.getContext("2d");
    const imageData = ctx2.getImageData(0, 0, this._regionCanvas.width, this._regionCanvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i + 3] = data[i + 0];
    }
    ctx2.putImageData(imageData, 0, 0);
    this._regionCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      this._div.style.setProperty("mask-image", `url(${url})`);
      this._div.style.setProperty("-webkit-mask-image", `url(${url})`);
    });
  }
  appendChildrenDiv() {
    this._appendChildrenToDiv(this._div);
  }
  _appendChildrenToDiv(containerDiv) {
    for (const child of this._children) {
      child.draw();
      containerDiv.appendChild(child.getDiv());
    }
  }
  _hasDeclaredSize() {
    const bitmap = this._background != null ? this._uiRoot.getBitmap(this._background) : null;
    const hasW = this._relatw == "1" || GuiObj.prototype.getwidth.call(this) > 0 || !!this._autowidthsource || bitmap != null && bitmap.getWidth() > 0;
    const hasH = this._relath == "1" || GuiObj.prototype.getheight.call(this) > 0 || bitmap != null && bitmap.getHeight() > 0;
    return hasW && hasH;
  }
  _renderClipping() {
    this._div.style.overflow = this._hasDeclaredSize() ? "hidden" : "";
  }
  _renderWidth() {
    super._renderWidth();
    this._renderClipping();
  }
  _renderHeight() {
    super._renderHeight();
    this._renderClipping();
  }
  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderClipping();
    if (this._movable || this._canResize) {
      this._div.style.pointerEvents = "auto";
    } else {
      this._div.style.pointerEvents = "none";
    }
    this._div.style.pointerEvents = "none";
    this._renderBackground();
    this.appendChildrenDiv();
    if (this._autowidthsource) {
      this._div.classList.add("autowidthsource");
    }
  }
};
let Group = _Group;
Group.GUID = "45be95e5419120725fbb5c93fd17f1f9";
export default Group;
