import {toBool} from "../../utils.js";
import Button from "../makiClasses/Button.js";
export default class ButtonFace extends Button {
  constructor() {
    super(...arguments);
    this._enabled = true;
  }
  getElTag() {
    return "button";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(_key, value)) {
      return true;
    }
    switch (key) {
      case "enabled":
        this._enabled = toBool(value);
        break;
      case "disabledimage":
        this._disabledImage = value;
        break;
      default:
        return false;
    }
    return true;
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = value;
    this._renderDisabled();
  }
  _renderDisabled() {
    if (this._enabled) {
      this._div.classList.remove("disabled");
    } else {
      this._div.classList.add("disabled");
    }
  }
  _renderBackground() {
    super._renderBackground();
    if (this._disabledImage != null && this._uiRoot.hasBitmap(this._disabledImage)) {
      const disabledImage = this._uiRoot.getBitmap(this._disabledImage);
      this.setDisabledBackgroundImage(disabledImage);
    } else {
      this.setDisabledBackgroundImage(null);
    }
  }
  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
    this._renderDisabled();
  }
}
