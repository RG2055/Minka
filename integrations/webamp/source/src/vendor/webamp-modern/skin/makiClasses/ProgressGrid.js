import Grid from "./Grid.js";
export default class ProgressGrid extends Grid {
  constructor(uiRoot) {
    super(uiRoot);
    this._disposeDisplaySubscription = this._uiRoot.audio.onCurrentTimeChange(() => {
      this._middle.style.width = `${this._uiRoot.audio.getCurrentTimePercent() * 100}%`;
    });
  }
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "orientation":
        break;
      default:
        return false;
    }
    return true;
  }
  draw() {
    super.draw();
    this._div.style.removeProperty("display");
  }
}
ProgressGrid.GUID = "OFFICIALLY-NO-GUID";
