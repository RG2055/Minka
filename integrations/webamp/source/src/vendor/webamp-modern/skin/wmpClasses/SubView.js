import {toBool} from "../../utils.js";
import {AUDIO_PAUSED, AUDIO_PLAYING, AUDIO_STOPPED} from "../AudioPlayer.js";
import {Edges} from "../Clippath.js";
import Group from "../makiClasses/Group.js";
import {runInlineScript} from "./util.js";
export default class SubView extends Group {
  constructor() {
    super(...arguments);
    this._audioEvent = {};
  }
  getElTag() {
    return "subview";
  }
  setXmlAttr(_key, value) {
    let key = _key.toLowerCase();
    if (value.startsWith("wmpenabled:player.controls.")) {
      this._audioEvent[value.split(".").pop()] = key;
      return;
    }
    if (key == "passthrough") {
      this.passThrough = value;
      return true;
    }
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "backgroundcolor":
        this._backgroundColor = value;
        this._renderBackground();
        break;
      case "clippingcolor":
        this._clippingColor = value;
        break;
      case "transparencycolor":
        this._transparencyColor = value;
        break;
      case "onendmove":
        this._onEndMove = value;
        break;
      case "zindex":
        const zindex = value;
        this._div.style.zIndex = zindex;
        break;
      default:
        return false;
    }
    return true;
  }
  set passThrough(val) {
    const noMouse = toBool(val);
    this.getDiv().classList.toggle("passthrough", noMouse);
  }
  moveTo(x, y, speed) {
    this.settargetx(x);
    this.settargety(y);
    this.settargetspeed(speed / 1e3);
    this.gototarget();
    if (this._onEndMove != null) {
      setTimeout(() => {
        runInlineScript(this._onEndMove);
      }, speed / 1e3 + 500);
    }
  }
  moveto(x, y, speed) {
    this.moveTo(x, y, speed);
  }
  alphaBlendTo(alpha, speed) {
    this.settargeta(alpha);
    this.settargetspeed(speed / 1e3);
    this.gototarget();
  }
  get alphaBlend() {
    return this._alpha;
  }
  set alphaBlend(value) {
    this._alpha = value;
    this._renderAlpha();
  }
  init() {
    super.init();
    this._uiRoot.audio.on("statchanged", () => this._updateStatus());
    this._updateStatus();
  }
  _updateStatus() {
    const state = this._uiRoot.audio.getState();
    for (const [audioEvent, prop] of Object.entries(this._audioEvent)) {
      this[prop] = audioEvent == "play" && state != AUDIO_PLAYING || audioEvent == "pause" && state != AUDIO_PAUSED || audioEvent == "stop" && state != AUDIO_STOPPED;
    }
  }
  _renderRegion() {
    if ((this._clippingColor || this._transparencyColor) && this._background) {
      const canvas = this._uiRoot.getBitmap(this._background).getCanvas(false);
      const edge = new Edges();
      edge.parseCanvasTransparencyByColor(canvas, this._clippingColor || this._transparencyColor);
      if (edge.isSimpleRect()) {
      } else {
        this._div.style.clipPath = edge.getPolygon();
      }
    }
  }
  _renderBackground() {
    super._renderBackground();
    this._div.style.setProperty("--background-color", this._backgroundColor || "transparent");
  }
  draw() {
    super.draw();
    this._renderRegion();
  }
}
