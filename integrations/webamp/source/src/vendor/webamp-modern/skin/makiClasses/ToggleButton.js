import {V} from "../../maki/v.js";
import Button from "./Button.js";
export default class ToggleButton extends Button {
  getElTag() {
    return "button";
  }
  getcurcfgval() {
    return this._active ? 1 : 0;
  }
  _cfgAttribChanged(newValue) {
    this.setactivated(newValue != "0");
    this.ontoggle(this._active);
  }
  _handleMouseDown(e) {
    e.stopPropagation();
    this.setactivated(!this._active);
    this.updateCfgAttib(this._active ? "1" : "0");
    this.ontoggle(this._active);
  }
  ontoggle(onoff) {
    this._uiRoot.vm.dispatch(this, "ontoggle", [V.newBool(onoff)]);
  }
  onactivate(activated) {
    this._uiRoot.vm.dispatch(this, "onactivate", [
      {type: "INT", value: activated}
    ]);
  }
  draw() {
    super.draw();
    this._div.setAttribute("data-obj-name", "ToggleButton");
  }
}
ToggleButton.GUID = "b4dccfff4bcc81fe0f721b96ff0fbed5";
