import MakiText from "../makiClasses/Text.js";
import {solvePendingProps} from "./util.js";
export default class TextZ extends MakiText {
  constructor(uiRoot) {
    super(uiRoot);
    this._pendingProps = {};
    this.setXmlAttr("font", "arial");
  }
  getElTag() {
    return "text";
  }
  setXmlAttr(_key, _value) {
    let key = _key.toLowerCase();
    const value = _value.toLowerCase();
    if (value.startsWith("jscript:")) {
      this._pendingProps[key] = value;
      return true;
    } else if (key == "value") {
      key = "text";
      if (value == "wmpprop:player.currentmedia.name") {
        this.setXmlAttr("display", "songname");
        this.setXmlAttr("ticker", "1");
      }
    }
    if (super.setXmlAttr(key, _value)) {
      return true;
    }
    switch (key) {
      case "foregroundcolor":
        this._foregroundColor = value;
        this._div.style.color = value;
        break;
      default:
        return false;
    }
    return true;
  }
  draw() {
    solvePendingProps(this, this._pendingProps);
    super.draw();
    this._div.classList.add("textz");
    if (!this._w) {
      this._div.style.setProperty("--full-width", "auto");
    }
    if (this.getwidth() == 0) {
      this._div.style.width = "auto";
    }
    if (this.getheight() == 0) {
      this._div.style.removeProperty("height");
    }
    if (!this._background) {
      this._div.classList.remove("webamp--img");
    }
  }
}
