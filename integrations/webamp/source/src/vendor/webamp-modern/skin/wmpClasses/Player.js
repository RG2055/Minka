import {AUDIO_PAUSED, AUDIO_PLAYING, AUDIO_STOPPED} from "../AudioPlayer.js";
import GuiObj from "../makiClasses/GuiObj.js";
import {runInlineScript} from "./util.js";
export default class Player extends GuiObj {
  constructor(uiRoot) {
    super(uiRoot);
    this.setXmlAttr("id", "player");
    this._controls = new PlayerControls();
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(_key, value)) {
      return true;
    }
    switch (key) {
      case "backgroundcolor":
        break;
      case "playState_onchange":
        this._playState_onchange = value;
        break;
      default:
        return false;
    }
    return true;
  }
  init() {
    super.init();
    if (this._playState_onchange != null) {
      this._uiRoot.audio.on("statchanged", () => this._updateAudioStatus());
      this._updateAudioStatus();
    }
  }
  _updateAudioStatus() {
    runInlineScript(this._playState_onchange);
  }
  get controls() {
    return this._controls;
  }
  get playState() {
    switch (this._uiRoot.audio.getState()) {
      case AUDIO_STOPPED:
        return 1;
      case AUDIO_PAUSED:
        return 2;
      case AUDIO_PLAYING:
        return 3;
      default:
        return 0;
    }
  }
  draw() {
    console.log("setting window.player ");
    window["player"] = this;
  }
}
class PlayerControls {
  isAvailable(buttonId) {
    return false;
  }
}
