import {assume, num, throttle} from "../../utils.js";
import GuiObj from "../makiClasses/GuiObj.js";
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
  dispose() {
    this._subscription();
  }
}
export default class RingProgress extends GuiObj {
  constructor() {
    super(...arguments);
    this._colors = [];
    this._maxDegree = 360;
    this._bgColor = "red";
    this._progress = 0;
    this._mouseIsDown = false;
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
      case "action":
        this._action = value.toLowerCase();
        break;
      case "degree":
        this._maxDegree = num(value);
        break;
      case "mask":
        this._maskId = value;
        break;
      case "colors":
        this._buildColors(value);
        break;
      case "bgcolor":
        this._bgColor = parseColor(value);
        break;
      default:
        return false;
    }
    return true;
  }
  _buildColors(colors) {
    for (var color of colors.split(",")) {
      this._colors.push(parseColor(color));
    }
  }
  init() {
    super.init();
    this._actionHandler = new ActionHandler(this);
    this._registerDragEvents();
    this._initializeActionHandler();
    this._actionHandler.init();
  }
  _initializeActionHandler() {
    const oldActionHandler = this._actionHandler;
    switch (this._action) {
      case "seek":
        this._actionHandler = new SeekActionHandler(this);
        break;
      case null:
        if (!this._actionHandler) {
          this._actionHandler = new ActionHandler(this);
        }
        break;
      default:
        assume(false, `Unhandled ring action: ${this._action}`);
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
      this._progress = percent;
      this.drawProgress();
    }
  }
  doLeftMouseDown(x, y) {
    this._mouseIsDown = true;
    const bound = this.getDiv().getBoundingClientRect();
    const cx = bound.width / 2;
    const cy = bound.height / 2;
    const deltaX = x - cx;
    const deltaY = y - cy;
    const rad = Math.atan2(deltaY, deltaX);
    const pi = Math.PI;
    let deg = rad * (180 / pi);
    deg = (deg + 450) % 360;
    const progress = deg / this._maxDegree;
    if (progress != this._progress) {
      this._progress = progress;
      this.drawProgress();
      this._actionHandler.onChange(this._progress);
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
  drawMask() {
    if (!this._maskId)
      return;
    const bitmap = this._uiRoot.getBitmap(this._maskId);
    bitmap._setAsBackground(this.getDiv(), "mask");
    this.getDiv().style.setProperty("-webkit-mask-image", `var(${bitmap.getCSSVar()})`);
    this.getDiv().style.setProperty("webkit-mask-image", `var(${bitmap.getCSSVar()})`);
  }
  prepareGradient() {
    const fullColors = [...this._colors];
    if (this._maxDegree < 360) {
      let lastColor = fullColors.pop();
      lastColor = `${lastColor} ${this._maxDegree}deg`;
      fullColors.push(lastColor);
      fullColors.push(`transparent ${this._maxDegree}deg`);
    }
    this._staticGradient = `conic-gradient(${fullColors.join(", ")})`;
  }
  drawProgress() {
    const progressColors = [
      `transparent ${this._progress * this._maxDegree}deg`,
      `${this._bgColor} ${this._progress * this._maxDegree}deg ${this._maxDegree}deg`,
      `transparent ${this._maxDegree}deg`
    ];
    const dynamicGradient = `conic-gradient(${progressColors.join(", ")})`;
    this.getDiv().style.backgroundImage = `${dynamicGradient}, ${this._staticGradient}`;
  }
  draw() {
    super.draw();
    this.prepareGradient();
    this.drawMask();
    this.drawProgress();
  }
}
function parseColor(soniqueColor) {
  let color = soniqueColor;
  if (!color.startsWith("0x")) {
    throw new Error("color is expected in 0xFF999999 format.");
  }
  if (color.length == 10) {
    color = color.substring(4);
  } else {
    color = color.substring(2);
  }
  return `#${color}`;
}
class SeekActionHandler extends ActionHandler {
  constructor() {
    super(...arguments);
    this._onAudioProgres = () => {
      this._slider.setPercentValue(this._uiRoot.audio.getCurrentTimePercent());
    };
  }
  init() {
    this._registerOnAudioProgress();
  }
  _registerOnAudioProgress() {
    this._subscription = this._uiRoot.audio.onCurrentTimeChange(this._onAudioProgres);
  }
  onChange(percent) {
    this._uiRoot.audio.seekToPercent(percent);
  }
}
