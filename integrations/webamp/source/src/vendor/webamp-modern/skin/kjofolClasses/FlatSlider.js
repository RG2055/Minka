import {num, px} from "../../utils.js";
import Slider from "../makiClasses/Slider.js";
export default class FlatSlider extends Slider {
  constructor() {
    super(...arguments);
    this._frameCount = 1;
    this._frameVertical = true;
  }
  getElTag() {
    return "slider";
  }
  setXmlAttr(_key, value) {
    if (super.setXmlAttr(_key, value)) {
      return true;
    }
    const key = _key.toLowerCase();
    switch (key) {
      case "image":
        this._image = value;
        break;
      case "framecount":
        this._frameCount = num(value);
        break;
      case "frameheight":
        this._frameHeight = num(value);
        this._frameVertical = true;
        break;
      case "framewidth":
        this._frameWidth = num(value);
        this._frameVertical = false;
        break;
      default:
        return false;
    }
    return true;
  }
  _checkMouseDownInThumb(x, y) {
  }
  _prepareThumbBitmaps() {
  }
  _renderThumbPosition() {
    const actual = this._getActualSize();
    if (this._frameVertical) {
    } else {
      const left = Math.floor(this._position * (this._frameCount - 1)) * this._frameWidth;
      if (this._thumbLeft != left) {
        this._thumbLeft = left;
        this._div.style.backgroundPositionX = px(-left);
      }
    }
  }
  _renderBackground() {
    const bitmap = this._image != null ? this._uiRoot.getBitmap(this._image) : null;
    this.setBackgroundImage(bitmap);
  }
  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
}
