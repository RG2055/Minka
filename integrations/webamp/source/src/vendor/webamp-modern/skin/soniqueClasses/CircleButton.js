import Button from "../makiClasses/Button.js";
export default class CircleButton extends Button {
  getElTag() {
    return "button";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "iconimage":
        this._iconimage = value;
        this._renderBackground();
        break;
      default:
        return false;
    }
    return true;
  }
  _renderBackground() {
    super._renderBackground();
    if (this._iconimage != null && this._uiRoot.hasBitmap(this._iconimage)) {
      const bitmap = this._uiRoot.getBitmap(this._iconimage);
      this.setIconImage(bitmap);
    } else {
      this.setIconImage(null);
    }
  }
  setIconImage(bitmap) {
    this._backgroundBitmap = bitmap;
    if (bitmap != null) {
      bitmap._setAsBackground(this._div, "icon-");
    } else {
      this._div.style.setProperty(`--icon-background-image`, "none");
    }
  }
  draw() {
    super.draw();
    this.getDiv().classList.add("circle");
  }
}
