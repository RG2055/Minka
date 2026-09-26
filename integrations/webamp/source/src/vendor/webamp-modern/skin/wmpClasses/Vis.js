import {Edges} from "../Clippath.js";
import Avs from "../makiClasses/Avs.js";
export default class VisZ extends Avs {
  getElTag() {
    return "vis";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "clippingcolor":
        this._clippingColor = value;
        break;
      case "clippingimage":
        this._clippingImage = value;
        break;
      default:
        return false;
    }
    return true;
  }
  _renderRegion() {
    if (this._clippingImage && this._clippingColor) {
      const canvas = this._uiRoot.getBitmap(this._clippingImage).getCanvas();
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
    this._renderRegion();
  }
}
