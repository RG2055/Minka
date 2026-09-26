import {assume, throttle} from "../../utils.js";
import AnimatedLayer from "../makiClasses/AnimatedLayer.js";
import MakiMap from "../makiClasses/MakiMap.js";
export class ActionHandler {
  constructor(slider) {
    this._slider = slider;
    this._uiRoot = slider._uiRoot;
    this._subscription = () => {
    };
  }
  init() {
  }
  onChange(percent) {
  }
  onFrame(percent) {
  }
  dispose() {
    this._subscription();
  }
}
export default class DialKnob extends AnimatedLayer {
  constructor(uiRoot) {
    super(uiRoot);
    this._mouseIsDown = false;
    this._map = new MakiMap(uiRoot);
    this._speed = 20;
    this._autoReplay = false;
  }
  getElTag() {
    return "animatedlayer";
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
    this._frameCount = this.getlength();
    this._registerDragEvents();
    this._map.loadmap(this._mapImage);
    this._actionHandler = new ActionHandler(this);
    this._initializeActionHandler();
    this._actionHandler.init();
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
      case "pitch":
        this._actionHandler = new PitchActionHandler(this);
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
      const throttleMouseMove = throttle(handleMove, 50);
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
  setPercentValue(percent, animate = true) {
    if (!this._mouseIsDown) {
      const value = Math.round(percent * 255);
      if (value != this._value) {
        this._value = value;
        if (animate) {
          this._animateDial();
        } else {
          this.gotoframe(Math.round(this._value / 255 * (this._frameCount - 1)));
        }
      }
    }
  }
  gotoframe(framenum) {
    super.gotoframe(framenum);
    this._actionHandler.onFrame(framenum / (this._frameCount - 1));
  }
  doLeftMouseDown(x, y) {
    this._mouseIsDown = true;
    const val = this._map.getUnsafeValue(x, y);
    if (val != null && !isNaN(val) && val != this._value) {
      console.log("knob:", val);
      this._value = val;
      this._animateDial();
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
  _animateDial() {
    this.stop();
    this.setstartframe(this.getcurframe());
    this.setendframe(Math.round(this._value / 255 * (this._frameCount - 1)));
    this.play();
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
    this._subscription = this._uiRoot.audio.onVolumeChanged(() => {
      slider.setPercentValue(this._uiRoot.audio.getVolume());
    });
  }
  init() {
    this._slider.setPercentValue(this._uiRoot.audio.getVolume());
  }
  onChange(percent) {
    this._uiRoot.audio.setVolume(percent);
  }
}
class PitchActionHandler extends ActionHandler {
  constructor(slider) {
    super(slider);
    this._changing = false;
  }
  _setSliderValue(force = false) {
    if (this._slider.isplaying && !force)
      return;
    const pitch = this._uiRoot.audio.getPlaybackRate();
    const percent = (pitch - 0.5) / (2 - 0.5);
    this._slider.setPercentValue(percent, !force);
  }
  _setAudioValue(percent) {
    const pitch = percent * (2 - 0.5) + 0.5;
    this._uiRoot.audio.setPlaybackRate(pitch);
  }
  init() {
    this._subscription = this._uiRoot.audio.on("playbackratechange", () => {
      this._setSliderValue();
    });
    this._setSliderValue(true);
  }
  onFrame(percent) {
    this._setAudioValue(percent);
  }
  onChange(percent) {
  }
}
