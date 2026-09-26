import {assume, clamp, num, px, throttle} from "../../utils.js";
import GuiObj from "./GuiObj.js";
export class ActionHandler {
  constructor(slider) {
    this._subscription = () => {
    };
    this._slider = slider;
    this._uiRoot = slider._uiRoot;
  }
  onsetposition(position) {
  }
  onLeftMouseDown(x, y) {
  }
  onLeftMouseUp(x, y) {
  }
  onMouseMove(x, y) {
    this._slider._setPositionXY(x, y);
  }
  onFreeMouseMove(x, y) {
  }
  dispose() {
    this._subscription();
  }
}
export default class Slider extends GuiObj {
  constructor() {
    super(...arguments);
    this._vertical = false;
    this._action = null;
    this._low = 0;
    this._high = 255;
    this._thumbWidth = 0;
    this._thumbHeight = 0;
    this._thumbLeft = 0;
    this._thumbTop = 0;
    this._position = 0;
    this._param = null;
    this._mouseDx = 0;
    this._mouseDy = 0;
  }
  _getActualSize() {
    const relatSize = {
      width: this._div.offsetWidth,
      height: this._div.offsetHeight
    };
    if (!this.getguirelatw() || !relatSize.width) {
      relatSize.width = this.getwidth();
    }
    if (!this.getguirelath() || !relatSize.height) {
      relatSize.height = this.getheight();
    }
    return relatSize;
  }
  _getScreenScale() {
    const width = this._div.offsetWidth;
    return width ? this._div.getBoundingClientRect().width / width : 1;
  }
  _setPositionXY(x, y) {
    if (this._vertical) {
      y = y - this._thumbHeight / 2 - this._mouseDy;
    } else {
      x = x - this._thumbWidth / 2 - this._mouseDx;
    }
    const actual = this._getActualSize();
    const width = actual.width - this._thumbWidth;
    const height = actual.height - this._thumbHeight;
    const newPercent = this._vertical ? (height - y) / height : x / width;
    this._position = clamp(newPercent, 0, 1);
    this._renderThumbPosition();
    this.doSetPosition(this.getposition());
  }
  _checkMouseDownInThumb(x, y) {
    if (this._vertical) {
      const thumbTop = parseInt(this._div.style.getPropertyValue("--thumb-top"));
      const dy = y - thumbTop;
      this._mouseDy = dy >= 0 && dy <= this._thumbHeight ? dy - this._thumbHeight / 2 : 0;
    } else {
      const thumbLeft = parseInt(this._div.style.getPropertyValue("--thumb-left"));
      const dx = x - thumbLeft;
      this._mouseDx = dx >= 0 && dx <= this._thumbWidth ? dx - this._thumbWidth / 2 : 0;
    }
  }
  _registerDragEvents() {
    this._div.addEventListener("mousedown", (downEvent) => {
      downEvent.stopPropagation();
      if (downEvent.button != 0)
        return;
      const startX = downEvent.clientX;
      const startY = downEvent.clientY;
      const inner = this._eventToLocal(downEvent);
      const innerX = inner.x;
      const innerY = inner.y;
      const scale = this._getScreenScale();
      this._checkMouseDownInThumb(innerX, innerY);
      this.doLeftMouseDown(innerX, innerY);
      const handleMove = (moveEvent) => {
        moveEvent.stopPropagation();
        const newMouseX = moveEvent.clientX;
        const newMouseY = moveEvent.clientY;
        const deltaX = (newMouseX - startX) / scale;
        const deltaY = (newMouseY - startY) / scale;
        this.doMouseMove(innerX + deltaX, innerY + deltaY);
      };
      const throttleMouseMove = throttle(handleMove, 50);
      const handleMouseUp = (upEvent) => {
        upEvent.stopPropagation();
        if (upEvent.button != 0)
          return;
        document.removeEventListener("mousemove", throttleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        const up = this._eventToLocal(upEvent);
        this.doLeftMouseUp(up.x, up.y);
      };
      document.addEventListener("mousemove", throttleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    });
    this._div.addEventListener("mousemove", (moveEvent) => {
      const local = this._eventToLocal(moveEvent);
      this.doFreeMouseMove(local.x, local.y);
    });
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      if (key == "action")
        this._setAction(value);
      return true;
    }
    switch (key.toLowerCase()) {
      case "thumb":
        this._thumb = value;
        const bitmap = this._uiRoot.getBitmap(this._thumb);
        if (bitmap) {
          this._thumbWidth = bitmap.getWidth();
          this._thumbHeight = bitmap.getHeight();
        }
        break;
      case "downthumb":
        this._downThumb = value;
        break;
      case "hoverthumb":
        this._hoverThumb = value;
        break;
      case "barmiddle":
        this._barMiddle = value;
        break;
      case "barleft":
        this._barLeft = value;
        break;
      case "barright":
        this._barRight = value;
        break;
      case "orientation":
        const lower = value.toLowerCase();
        this._vertical = lower === "v" || lower === "vertical";
        break;
      case "low":
        this._low = num(value);
        break;
      case "high":
        this._high = num(value);
        break;
      case "action":
        this._setAction(value);
        break;
      case "param":
        this._param = value;
        break;
      default:
        return false;
    }
    return true;
  }
  init() {
    super.init();
    this._initializeActionHandler();
    this._registerDragEvents();
  }
  _initializeActionHandler() {
    const oldActionHandler = this._actionHandler;
    switch (this._action) {
      case "seek":
        this._actionHandler = new SeekActionHandler(this);
        break;
      case "eq_band":
        if (this._low === 0 && this._high === 255) {
          this._low = -127;
          this._high = 127;
        }
        if (this._param == "preamp")
          this._actionHandler = new PreampActionHandler(this, this._param);
        else
          this._actionHandler = new EqActionHandler(this, this._param);
        break;
      case "eq_preamp":
        break;
      case "pan":
        if (this._low === 0 && this._high === 255) {
          this._high = 254;
        }
        this._actionHandler = new PanActionHandler(this);
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
  _setAction(value) {
    if (this._actionHandler != null) {
      this._actionHandler.dispose();
      this._actionHandler = null;
    }
    this._action = value.toLowerCase();
    if (this._actionHandler != null) {
      this._actionHandler.dispose();
      this._initializeActionHandler();
    }
  }
  setActionHandler(actionHandler) {
    if (this._actionHandler != null) {
      this._actionHandler.dispose();
      this._actionHandler = null;
    }
    this._actionHandler = actionHandler;
  }
  setThumbSize(width, height) {
    this._thumbWidth = width;
    this._thumbHeight = height;
  }
  _cfgAttribChanged(newValue) {
    const newPos = parseInt(newValue);
    if (newPos != this.getposition()) {
      this.setposition(newPos);
    }
  }
  getposition() {
    return Math.round(this._low + this._position * (this._high - this._low));
  }
  _toPercent(position) {
    return (position - this._low) / (this._high - this._low);
  }
  setposition(newpos) {
    this._position = this._toPercent(newpos);
    this._renderThumbPosition();
    this.doSetPosition(this.getposition());
  }
  onsetposition(newPos) {
    this._onSetPositionEvenEaten = this._uiRoot.vm.dispatch(this, "onsetposition", [
      {type: "INT", value: newPos}
    ]);
  }
  _notifyExternalPosition() {
    if (!this._uiRoot.vm)
      return;
    this.onsetposition(this.getposition());
    this.updateCfgAttib(String(this.getposition()));
  }
  doSetPosition(newPos) {
    this.onsetposition(newPos);
    if (this._actionHandler != null) {
      this._actionHandler.onsetposition(newPos);
    }
    this.updateCfgAttib(String(this.getposition()));
  }
  doLeftMouseDown(x, y) {
    this._setPositionXY(x, y);
    this._uiRoot.vm.dispatch(this, "onleftbuttondown", [
      {type: "INT", value: x},
      {type: "INT", value: y}
    ]);
    if (this._actionHandler != null) {
      this._actionHandler.onLeftMouseDown(x, y);
    }
  }
  doMouseMove(x, y) {
    if (this._actionHandler != null) {
      this._actionHandler.onMouseMove(x, y);
    }
  }
  doLeftMouseUp(x, y) {
    this._uiRoot.vm.dispatch(this, "onleftbuttonup", [
      {type: "INT", value: x},
      {type: "INT", value: y}
    ]);
    this._uiRoot.vm.dispatch(this, "onsetfinalposition", [
      {type: "INT", value: this.getposition()}
    ]);
    this._uiRoot.vm.dispatch(this, "onpostedposition", [
      {type: "INT", value: this.getposition()}
    ]);
    if (this._actionHandler != null) {
      this._actionHandler.onLeftMouseUp(x, y);
    }
  }
  doFreeMouseMove(x, y) {
    if (this._actionHandler != null) {
      this._actionHandler.onFreeMouseMove(x, y);
    }
  }
  _prepareThumbBitmaps() {
    if (this._thumb != null) {
      const bitmap = this._uiRoot.getBitmap(this._thumb);
      if (bitmap && bitmap.loaded()) {
        bitmap._setAsBackground(this._div, "thumb-");
      }
    }
    this._div.style.setProperty("--thumb-width", px(this._thumbWidth));
    this._div.style.setProperty("--thumb-height", px(this._thumbHeight));
    if (this._downThumb != null) {
      const bitmap = this._uiRoot.getBitmap(this._downThumb);
      if (bitmap && bitmap.loaded()) {
        bitmap._setAsBackground(this._div, "thumb-down-");
      }
    }
    if (this._hoverThumb != null) {
      const bitmap = this._uiRoot.getBitmap(this._hoverThumb);
      if (bitmap && bitmap.loaded()) {
        bitmap._setAsBackground(this._div, "thumb-hover-");
      }
    }
  }
  _renderThumbPosition() {
    const actual = this._getActualSize();
    if (this._vertical) {
      const top = Math.floor(Math.max(0, (1 - this._position) * (actual.height - this._thumbHeight)));
      if (this._thumbTop != top) {
        this._thumbTop = top;
        this._div.style.setProperty("--thumb-top", px(top));
      }
    } else {
      const left = Math.floor(this._position * (actual.width - this._thumbWidth));
      if (this._thumbLeft != left) {
        this._thumbLeft = left;
        this._div.style.setProperty("--thumb-left", px(left));
      }
    }
  }
  draw() {
    super.draw();
    this._div.setAttribute("data-obj-name", "Slider");
    assume(this._barLeft == null, "Need to handle Slider barleft");
    assume(this._barRight == null, "Need to handle Slider barright");
    assume(this._barMiddle == null, "Need to handle Slider barmiddle");
    this._prepareThumbBitmaps();
    this._renderThumbPosition();
  }
  dispose() {
    if (this._actionHandler) {
      this._actionHandler.dispose();
    }
    super.dispose();
  }
}
Slider.GUID = "62b65e3f408d375e8176ea8d771bb94a";
class SeekActionHandler extends ActionHandler {
  constructor(slider) {
    super(slider);
    this._onAudioProgres = () => {
      if (!this._pendingChange) {
        this._slider._position = this._uiRoot.audio.getCurrentTimePercent();
        this._slider._renderThumbPosition();
      }
    };
    this._registerOnAudioProgress();
  }
  isPendingChange() {
    return true;
  }
  _registerOnAudioProgress() {
    this._subscription = this._uiRoot.audio.onCurrentTimeChange(this._onAudioProgres);
  }
  onsetposition(position) {
    this._pendingChange = this._slider._onSetPositionEvenEaten != 0;
    if (!this._pendingChange) {
      this._uiRoot.audio.seekToPercent(this._slider._toPercent(position));
    }
  }
  onLeftMouseUp(x, y) {
    if (this._pendingChange) {
      this._pendingChange = false;
      this._uiRoot.audio.seekToPercent(this._slider._toPercent(this._slider.getposition()));
    }
  }
}
const EqGlobalVar = {eqMouseDown: false, targetSlider: null};
class EqActionHandler extends ActionHandler {
  constructor(slider, kind) {
    super(slider);
    this._kind = kind;
    const update = () => {
      slider._position = this._uiRoot.audio.getEq(kind);
      slider._renderThumbPosition();
      slider._notifyExternalPosition();
    };
    update();
    this._subscription = this._uiRoot.audio.onEqChange(kind, update);
  }
  onLeftMouseDown(x, y) {
    EqGlobalVar.eqMouseDown = true;
    this._slider.getparent().getDiv().classList.add("eq-surf");
    this._slider.getDiv().tabIndex = -1;
    this._slider.getDiv().focus();
  }
  onLeftMouseUp(x, y) {
    EqGlobalVar.eqMouseDown = false;
    this._slider.getparent().getDiv().classList.remove("eq-surf");
  }
  onFreeMouseMove(x, y) {
    if (EqGlobalVar.eqMouseDown) {
      EqGlobalVar.targetSlider = this._slider;
      this._slider.getDiv().tabIndex = -1;
      this._slider.getDiv().focus();
      this._slider._setPositionXY(x, y);
    }
  }
  onMouseMove(x, y) {
    if (EqGlobalVar.eqMouseDown && EqGlobalVar.targetSlider) {
      EqGlobalVar.targetSlider._setPositionXY(x, y);
    }
  }
  onsetposition(position) {
    this._uiRoot.audio.setEq(this._kind, this._slider._toPercent(position));
  }
}
class PreampActionHandler extends ActionHandler {
  constructor(slider, kind) {
    super(slider);
    this._kind = kind;
    const update = () => {
      slider._position = this._uiRoot.audio.getEq(kind);
      slider._renderThumbPosition();
      slider._notifyExternalPosition();
    };
    update();
    this._subscription = this._uiRoot.audio.onEqChange(kind, update);
  }
  onsetposition(position) {
    this._uiRoot.audio.setEq(this._kind, this._slider._toPercent(position));
  }
}
class PanActionHandler extends ActionHandler {
  constructor(slider) {
    super(slider);
    this._changing = false;
    const sync = () => {
      slider._position = (this._uiRoot.audio.getBalance() + 1) / 2;
      slider._renderThumbPosition();
      slider._notifyExternalPosition();
    };
    sync();
    this._subscription = this._uiRoot.audio.onBalanceChanged(() => {
      if (!this._changing)
        sync();
    });
  }
  onsetposition(position) {
    this._uiRoot.audio.setBalance(this._slider._toPercent(position) * 2 - 1);
  }
  onLeftMouseDown(x, y) {
    this._changing = true;
  }
  onLeftMouseUp(x, y) {
    this._changing = false;
  }
}
class VolumeActionHandler extends ActionHandler {
  constructor(slider) {
    super(slider);
    this._changing = false;
    slider._position = this._uiRoot.audio.getVolume();
    slider._renderThumbPosition();
    slider._notifyExternalPosition();
    this._subscription = this._uiRoot.audio.onVolumeChanged(() => {
      if (!this._changing) {
        slider._position = this._uiRoot.audio.getVolume();
        slider._renderThumbPosition();
        slider._notifyExternalPosition();
      }
    });
  }
  onsetposition(position) {
    this._uiRoot.audio.setVolume(this._slider._toPercent(position));
  }
  onLeftMouseDown(x, y) {
    this._changing = true;
  }
  onLeftMouseUp(x, y) {
    this._changing = false;
  }
}
