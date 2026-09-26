import {num} from "../../utils.js";
import ToggleButton from "./ToggleButton.js";
export default class NStateButton extends ToggleButton {
  constructor() {
    super(...arguments);
    this._statesCount = 2;
    this._states = [0, 1];
    this._stateIndex = 0;
    this._plainImages = {};
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (key.endsWith("image")) {
      this._plainImages[key] = value.toLowerCase();
    }
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "nstates":
        this._statesCount = num(value);
        break;
      case "cfgvals":
        this._states = value.split(";").map((numStr) => num(numStr));
        break;
      default:
        return false;
    }
    return true;
  }
  getcurcfgval() {
    console.log("getCurCfgVal:", this._states[this._stateIndex]);
    return this._states[this._stateIndex];
  }
  _cfgAttribChanged(newValue) {
    const inewValue = parseInt(newValue);
    const newIndex = this._states.indexOf(inewValue);
    if (newIndex != this._stateIndex) {
      this._stateIndex = newIndex;
      this._updateBitmaps();
    }
    this.setactivated(newIndex != 0);
  }
  _handleMouseDown(e) {
    e.stopPropagation();
    this._cycleState();
    this.updateCfgAttib(String(this._states[this._stateIndex]));
    this.setactivated(this._states[this._stateIndex] != 0);
  }
  _cycleState() {
    this._stateIndex++;
    if (this._stateIndex >= this._statesCount) {
      this._stateIndex = 0;
    }
    this._updateBitmaps();
    this.ontoggle(this._states[this._stateIndex] != 0);
  }
  _updateBitmaps() {
    const bitmapSuffix = String(this._stateIndex);
    ["image", "downimage", "hoverimage", "activeimage"].forEach((att) => {
      if (this._plainImages[att]) {
        if (this._uiRoot.hasBitmap(this._plainImages[att] + bitmapSuffix)) {
          super.setXmlAttr(att, this._plainImages[att] + bitmapSuffix);
        } else {
          super.setXmlAttr(att, this._plainImages[att]);
        }
      }
    });
  }
  draw() {
    this._updateBitmaps();
    super.draw();
    this._div.setAttribute("data-obj-name", "NStateButton");
  }
}
NStateButton.GUID = "OFFICIALLY-NO-GUID";
