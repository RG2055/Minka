import GuiObj from "./GuiObj.js";
import {px} from "../../utils.js";
export default class Grid extends GuiObj {
  constructor(uiRoot) {
    super(uiRoot);
    this._left = document.createElement("left");
    this._middle = document.createElement("middle");
    this._right = document.createElement("right");
    this._div.appendChild(this._left);
    this._div.appendChild(this._middle);
    this._div.appendChild(this._right);
  }
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "middle":
        this._setBitmap(this._middle, value);
        break;
      case "left":
        this._setBitmap(this._left, value);
        break;
      case "right":
        this._setBitmap(this._right, value);
        break;
      default:
        return false;
    }
    return true;
  }
  getheight() {
    if (this._h) {
      return this._h;
    }
    if (this._image != null) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      if (bitmap)
        return bitmap.getHeight();
    }
    return super.getheight();
  }
  getwidth() {
    if (this._w) {
      return this._w;
    }
    if (this._image != null) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      if (bitmap)
        return bitmap.getWidth();
    }
    return super.getwidth();
  }
  _renderBackground() {
    const bitmap = this._image != null ? this._uiRoot.getBitmap(this._image) : null;
    this.setBackgroundImage(bitmap);
  }
  _setBitmap(element, bitmap_id) {
    const bitmap = this._uiRoot.getBitmap(bitmap_id);
    if (bitmap) {
      bitmap.setAsBackground(element);
      element.style.width = px(bitmap.getWidth());
    }
  }
  draw() {
    super.draw();
    this._div.style.pointerEvents = "none";
    this._renderVisibility();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
  isinvalid() {
    return false;
  }
}
Grid.GUID = "OFFICIALLY-NO-GUID";
