import {Edges} from "../Clippath.js";
import ButtonElement from "./ButtonElement.js";
export default class ButtonZ extends ButtonElement {
  getElTag() {
    return "button";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(_key, value)) {
      return true;
    }
    switch (key) {
      case "backgroundcolor":
        this._backgroundColor = value;
        this._renderBackground();
        break;
      case "zindex":
        const zindex = value;
        this._div.style.zIndex = zindex == "-1" ? "6556" : zindex;
        break;
      case "image":
        this._image = value;
        break;
      case "hoverimage":
        this._hoverImage = value;
        break;
      case "downimage":
        this._downImage = value;
        break;
      case "hoverdownimage":
        this._hoverDownImage = value;
        break;
      case "disabledimage":
        this._disabledImage = value;
        break;
      case "transparencycolor":
        this._transparencyColor = value;
        break;
      case "clippingcolor":
        this._clippingColor = value;
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
    if (this._backgroundColor) {
      this._div.style.setProperty("--background-color", this._backgroundColor);
    }
    const setCssVar = (bitmapId, bitmapMethod) => {
      if (bitmapId != null) {
        const bitmap = this._uiRoot.getBitmap(bitmapId);
        if (bitmap != null) {
          bitmap[bitmapMethod](this._div);
        }
      }
    };
    setCssVar(this._image, "setAsBackground");
    setCssVar(this._hoverImage, "setAsHoverBackground");
    setCssVar(this._downImage, "setAsDownBackground");
    setCssVar(this._hoverDownImage, "setAsHoverDownBackground");
    setCssVar(this._disabledImage, "setAsDisabledBackground");
  }
  _renderRegion() {
    if (this._clippingColor) {
      const canvas = this._uiRoot.getBitmap(this._image).getCanvas();
      const edge = new Edges();
      edge.parseCanvasTransparencyByColor(canvas, this._clippingColor);
      if (edge.isSimpleRect()) {
      } else {
        this._div.style.clipPath = edge.getPolygon();
      }
    }
  }
  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
}
