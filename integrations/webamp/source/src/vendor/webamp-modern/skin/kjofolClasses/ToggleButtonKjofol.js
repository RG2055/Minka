import {px} from "../../utils.js";
import ToggleButton from "../makiClasses/ToggleButton.js";
export default class ToggleButtonKjofol extends ToggleButton {
  getElTag() {
    return "button";
  }
  _renderX() {
    super._renderX();
    this._div.style.setProperty("--left", px(-this._x));
  }
  _renderY() {
    super._renderY();
    this._div.style.setProperty("--top", px(-this._y));
  }
}
