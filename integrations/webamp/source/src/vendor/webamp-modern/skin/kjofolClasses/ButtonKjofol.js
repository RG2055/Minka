import {px} from "../../utils.js";
import Button from "../makiClasses/Button.js";
export default class ButtonKjofol extends Button {
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
