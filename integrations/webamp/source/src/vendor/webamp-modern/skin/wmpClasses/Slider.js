import {num, toBool} from "../../utils.js";
import MakiSlider from "../makiClasses/Slider.js";
import {solvePendingProps} from "./util.js";
export default class SliderZ extends MakiSlider {
  constructor() {
    super(...arguments);
    this._pendingProps = {};
  }
  getElTag() {
    return "slider";
  }
  setXmlAttr(_key, _value) {
    const key = _key.toLowerCase();
    const value = _value.toLowerCase();
    if (["visible", "enabled", "height", "width", "x", "y", "w", "h"].includes(key) && value.startsWith("jscript:")) {
      this._pendingProps[key] = value;
      return true;
    }
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "background":
        this._background = value;
        break;
      case "tiled":
        this._tiled = toBool(value);
        break;
      case "bordersize":
        this._borderSize = num(value);
        break;
      case "value":
        this.setValueToaction(value.toLowerCase());
        break;
      default:
        return false;
    }
    return true;
  }
  setValueToaction(value) {
    switch (value) {
      case "wmpprop:player.controls.currentposition":
        this.setxmlparam("action", "seek");
        break;
      case "wmpprop:player.settings.balance":
        this.setxmlparam("action", "pan");
        break;
      case "wmpprop:player.settings.volume":
        this.setxmlparam("action", "volume");
        break;
      default:
        if (value.startsWith("wmpprop:eq.gainlevel")) {
          const eqIndex = value.substring(20);
          this.setxmlparam("action", "eq_band");
          this.setxmlparam("param", eqIndex);
        }
        return;
    }
  }
  getheight() {
    if (this._h) {
      return this._h;
    }
    if (this._background != null) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      if (bitmap)
        return bitmap.getHeight();
    }
    return super.getheight();
  }
  getwidth() {
    if (this._w) {
      return this._w;
    }
    if (this._background != null) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      if (bitmap)
        return bitmap.getWidth();
    }
    return super.getwidth();
  }
  _renderBackground() {
    if (this._background != null) {
      const bitmap = this._uiRoot.getBitmap(this._background);
      this.setBackgroundImage(bitmap);
    } else {
      this.setBackgroundImage(null);
    }
    if (this._tiled) {
      this._div.classList.add("background-stretched");
      if (this._borderSize) {
        let h, w;
        if (this._vertical) {
          h = this._borderSize;
          w = 0;
        } else {
          w = this._borderSize;
          h = 0;
        }
        this._div.style.setProperty("--border-width", `${w}`);
        this._div.style.setProperty("--border-height", `${h}`);
        this._div.style.setProperty("--border-width-px", `${w}px`);
        this._div.style.setProperty("--border-height-px", `${h}px`);
      }
    }
  }
  draw() {
    solvePendingProps(this, this._pendingProps);
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
}
