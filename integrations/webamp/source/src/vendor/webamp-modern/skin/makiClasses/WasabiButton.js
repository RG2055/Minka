import Button from "./Button.js";
export default class WasabiButton extends Button {
  getElTag() {
    return "button";
  }
  constructor(uiRoot) {
    super(uiRoot);
    this.registerDimensions();
  }
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "text":
        this._div.innerText = value;
        break;
      default:
        return false;
    }
    return true;
  }
  registerDimensions() {
    this._uiRoot.addHeight("button-border-top", "wasabi.button.top");
    this._uiRoot.addHeight("button-border-bottom", "wasabi.button.bottom");
    this._uiRoot.addWidth("button-border-left", "wasabi.button.left");
    this._uiRoot.addWidth("button-border-right", "wasabi.button.right");
  }
  draw() {
    super.draw();
    this._div.classList.remove("webamp--img");
    this._div.classList.add("wasabi");
    this._div.setAttribute("data-obj-name", "WasabiButton");
  }
}
WasabiButton.GUID = "OFFICIALLY-NO-GUID";
