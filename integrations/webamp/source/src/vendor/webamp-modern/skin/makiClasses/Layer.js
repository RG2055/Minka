import {toBool} from "../../utils.js";
import Movable from "./Movable.js";
import {Edges} from "../Clippath.js";
export default class Layer extends Movable {
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      if (key == "sysregion") {
        this._renderRegion();
      }
      return true;
    }
    switch (key) {
      case "image":
        this._image = value;
        this._renderBackground();
        this._renderRegion();
        break;
      case "inactiveimage":
        this._inactiveImage = value;
        this._renderBackground();
        break;
      case "tile":
        this._div.classList.toggle("tile", toBool(value));
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
    this.setInactiveBackgroundImage(bitmap);
    if (this._inactiveImage) {
      this.setInactiveBackgroundImage(this._uiRoot.getBitmap(this._inactiveImage));
      this._div.classList.add("inactivable");
    }
  }
  _renderRegion() {
    if (this._sysregion == 1 && this._image) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      if (bitmap && bitmap.getImg()) {
        const canvas = bitmap.getCanvas();
        const edge = new Edges();
        edge.parseCanvasTransparency(canvas, this.getwidth(), this.getheight());
        if (!edge.isSimpleRect()) {
          this._div.style.clipPath = edge.getPolygon();
          return;
        }
      }
      this.setXmlAttr("sysregion", "0");
    }
  }
  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
}
Layer.GUID = "5ab9fa1545579a7d5765c8aba97cc6a6";
