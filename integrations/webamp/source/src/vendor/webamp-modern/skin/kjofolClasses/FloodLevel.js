import {assume, throttle} from "../../utils.js";
import GuiObj from "../makiClasses/GuiObj.js";
import MakiMap from "../makiClasses/MakiMap.js";
export class ActionHandler {
  constructor(slider) {
    this._slider = slider;
    this._uiRoot = slider._uiRoot;
    this._subscription = () => {
    };
  }
  onChange(percent) {
  }
  dispose() {
    this._subscription();
  }
}
export default class FloodLevel extends GuiObj {
  constructor(uiRoot) {
    super(uiRoot);
    this._canvas = document.createElement("canvas");
    this._map = new MakiMap(uiRoot);
  }
  getElTag() {
    return "layer";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "mapimage":
        this._mapImage = value;
        break;
      case "frontimage":
        this._frontImage = value;
        break;
      case "action":
        this._action = value.toLowerCase();
        break;
      default:
        return false;
    }
    return true;
  }
  init() {
    super.init();
    this._map = new MakiMap(this._uiRoot);
    this._map.loadmap(this._mapImage);
    this._actionHandler = new ActionHandler(this);
    this._initializeActionHandler();
    this._registerDragEvents();
  }
  _initializeActionHandler() {
    const oldActionHandler = this._actionHandler;
    switch (this._action) {
      case "seek":
        this._actionHandler = new SeekActionHandler(this);
        break;
      case "volume":
        this._actionHandler = new VolumeActionHandler(this);
        break;
      case null:
        if (!this._actionHandler) {
          this._actionHandler = new ActionHandler(this);
        }
        break;
      default:
        assume(false, `Unhandled slider action: ${this._action}`);
    }
    if (oldActionHandler != null && oldActionHandler != this._actionHandler) {
      oldActionHandler.dispose();
    }
  }
  _registerDragEvents() {
    this._div.addEventListener("mousedown", (downEvent) => {
      downEvent.stopPropagation();
      if (downEvent.button != 0)
        return;
      const startX = downEvent.clientX;
      const startY = downEvent.clientY;
      const innerX = downEvent.offsetX;
      const innerY = downEvent.offsetY;
      this.doLeftMouseDown(downEvent.offsetX, downEvent.offsetY);
      const handleMove = (moveEvent) => {
        moveEvent.stopPropagation();
        const newMouseX = moveEvent.clientX;
        const newMouseY = moveEvent.clientY;
        const deltaX = newMouseX - startX;
        const deltaY = newMouseY - startY;
        this.doMouseMove(innerX + deltaX, innerY + deltaY);
      };
      const throttleMouseMove = throttle(handleMove, 10);
      const handleMouseUp = (upEvent) => {
        upEvent.stopPropagation();
        if (upEvent.button != 0)
          return;
        document.removeEventListener("mousemove", throttleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        this.doLeftMouseUp(upEvent.offsetX, upEvent.offsetY);
      };
      document.addEventListener("mousemove", throttleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    });
  }
  setPercentValue(percent) {
    if (!this._mouseIsDown) {
      const value = Math.round(percent * 255);
      if (value != this._value) {
        this._value = value;
        this._renderFlood();
      }
    }
  }
  doLeftMouseDown(x, y) {
    this._mouseIsDown = true;
    const val = this._map.getUnsafeValue(x, y);
    if (val != null && val != this._value) {
      console.log("flood:", val);
      this._value = val;
      this._renderFlood();
      this._actionHandler.onChange(this._value / 255);
    }
  }
  doMouseMove(x, y) {
    if (this._mouseIsDown) {
      this.doLeftMouseDown(x, y);
    }
  }
  doLeftMouseUp(x, y) {
    this._mouseIsDown = false;
  }
  _renderFlood() {
    const [w, h] = [this.getwidth(), this.getheight()];
    const ctx = this._canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const bitmap = this._uiRoot.getBitmap(this._frontImage);
    const canvasb = bitmap.getCanvas(true);
    const ctxb = canvasb.getContext("2d");
    const imgb = ctxb.getImageData(this.getleft(), this.gettop(), w, h);
    const datab = imgb.data;
    assume(img.width == imgb.width && img.height == imgb.height, "mismatch size of source vs dest");
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        const val = this._map.getUnsafeValue(x, y);
        if (val != null && val <= this._value) {
          const b = (y * w + x) * 4;
          data[b + 0] = datab[b + 0];
          data[b + 1] = datab[b + 1];
          data[b + 2] = datab[b + 2];
          data[b + 3] = datab[b + 3];
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  _renderWidth() {
    super._renderWidth();
    this._canvas.style.width = this._div.style.width;
    this._canvas.setAttribute("width", `${parseInt(this._div.style.width)}`);
  }
  _renderHeight() {
    super._renderHeight();
    this._canvas.style.height = this._div.style.height;
    this._canvas.setAttribute("height", `${parseInt(this._div.style.height)}`);
  }
  draw() {
    super.draw();
    this._div.appendChild(this._canvas);
  }
  dispose() {
    this._actionHandler.dispose();
    super.dispose();
  }
}
class SeekActionHandler extends ActionHandler {
  constructor(slider) {
    super(slider);
    this._onAudioProgres = () => {
      this._slider.setPercentValue(this._uiRoot.audio.getCurrentTimePercent());
    };
    this._registerOnAudioProgress();
  }
  isPendingChange() {
    return true;
  }
  _registerOnAudioProgress() {
    this._subscription = this._uiRoot.audio.onCurrentTimeChange(this._onAudioProgres);
  }
  onChange(percent) {
    this._uiRoot.audio.seekToPercent(percent);
  }
}
class VolumeActionHandler extends ActionHandler {
  constructor(slider) {
    super(slider);
    this._changing = false;
    slider.setPercentValue(this._uiRoot.audio.getVolume());
    this._subscription = this._uiRoot.audio.onVolumeChanged(() => {
      slider.setPercentValue(this._uiRoot.audio.getVolume());
    });
  }
  onChange(percent) {
    this._uiRoot.audio.setVolume(percent);
  }
}
