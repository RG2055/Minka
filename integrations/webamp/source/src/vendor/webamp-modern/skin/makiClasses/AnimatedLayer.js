import {ensureVmInt, num, px, toBool, unimplemented} from "../../utils.js";
import Layer from "./Layer.js";
export default class AnimatedLayer extends Layer {
  constructor() {
    super(...arguments);
    this._vertical = true;
    this._currentFrame = 0;
    this._startFrame = 0;
    this._endFrame = 0;
    this._speed = 200;
    this._autoReplay = true;
    this._autoPlay = false;
    this._animationInterval = null;
    this._paused = false;
    this._geometryKnown = false;
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (key == "image" && /\%[0-9]*d/.test(value)) {
      this._imageFormat = value;
      return true;
    }
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "speed":
        this._speed = num(value);
        break;
      case "start":
        this._startFrame = num(value);
        break;
      case "end":
        this._endFrame = num(value);
        break;
      case "frameheight":
        this._frameHeight = num(value);
        this._vertical = true;
        break;
      case "framewidth":
        this._frameWidth = num(value);
        this._vertical = false;
        break;
      case "autoplay":
        this._autoPlay = toBool(value);
        break;
      case "autoreplay":
        this._autoReplay = toBool(value);
        break;
      default:
        return false;
    }
    return true;
  }
  _getImageHeight() {
    const bitmap = this._uiRoot.getBitmap(this._image);
    return bitmap.getHeight();
  }
  getdirection() {
    return unimplemented(this._vertical ? 1 : 0);
  }
  getlength() {
    const bitmap = this._uiRoot.getBitmap(this._image);
    if (!bitmap || !bitmap.getImg()) {
      return 0;
    }
    if (this._vertical) {
      return bitmap.getHeight() / (this._frameHeight || this.getheight());
    } else {
      return bitmap.getWidth() / (this._frameWidth || this.getwidth());
    }
  }
  gotoframe(framenum) {
    const frame = ensureVmInt(framenum);
    if (!this._geometryKnown) {
      this._currentFrame = frame;
      return;
    }
    const length = this.getlength();
    if (frame < 0 || length > 0 && frame >= length) {
      return;
    }
    this._currentFrame = frame;
    this._renderFrame();
    this._uiRoot.vm.dispatch(this, "onframe", [
      {type: "INT", value: this._currentFrame}
    ]);
  }
  getcurframe() {
    return this._currentFrame;
  }
  setstartframe(framenum) {
    this._startFrame = ensureVmInt(framenum);
  }
  setendframe(framenum) {
    this._endFrame = ensureVmInt(framenum);
  }
  setspeed(msperframe) {
    this._speed = msperframe;
  }
  play() {
    if (this._animationInterval != null) {
      clearInterval(this._animationInterval);
      this._animationInterval = null;
    }
    this._paused = false;
    const end = this._endFrame;
    const start = this._startFrame;
    const change = end > start ? 1 : -1;
    const backward = end < start;
    let frame = this._startFrame;
    this.gotoframe(frame);
    this._uiRoot.vm.dispatch(this, "onplay");
    if (frame === end && !this._autoReplay) {
      this.stop();
      return;
    }
    this._animationInterval = setInterval(() => {
      if (this._paused) {
        return;
      }
      this.gotoframe(frame);
      if (frame === end) {
        if (!this._autoReplay) {
          this.stop();
        }
      }
      if (backward) {
        frame -= 1;
        if (frame < end) {
          frame = start;
        } else if (frame > start) {
          frame = end;
        }
      } else {
        frame += change;
        if (frame < start) {
          frame = end;
        } else if (frame > end) {
          frame = start;
        }
      }
    }, this._speed);
  }
  pause() {
    this._paused = true;
    this._uiRoot.vm.dispatch(this, "onpause");
  }
  stop() {
    if (this._animationInterval != null) {
      clearInterval(this._animationInterval);
      this._animationInterval = null;
    }
    this._uiRoot.vm.dispatch(this, "onstop");
  }
  isplaying() {
    return this._animationInterval != null;
  }
  ispaused() {
    return this._animationInterval != null && this._paused;
  }
  isstopped() {
    return this.isplaying() && !this._paused;
  }
  setautoreplay(onoff) {
    this._autoReplay = onoff;
  }
  getautoreplay() {
    return this._autoReplay;
  }
  getstartframe() {
    return this._startFrame;
  }
  getendframe() {
    return this._endFrame;
  }
  setrealtime(onoff) {
    const a = 1;
  }
  _getActualHeight() {
    return this._h || this._div.getBoundingClientRect().height;
  }
  init() {
    super.init();
    if (!this._frameHeight && !this._frameWidth) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      const w = this.getwidth();
      const h = this.getheight();
      if (bitmap && bitmap.getImg() && bitmap.getHeight() <= h && bitmap.getWidth() > w) {
        this._vertical = false;
        this._frameWidth = w;
      } else {
        this._vertical = true;
        this._frameHeight = h;
      }
    } else if (this._vertical && !this._frameHeight) {
      this._frameHeight = this.getheight();
    } else if (!this._vertical && !this._frameWidth) {
      this._frameWidth = this.getwidth();
    }
    this._geometryKnown = true;
    if (this._endFrame == 0 && this.getlength() > 0) {
      this._endFrame = this.getlength() - 1;
    }
    if (this._startFrame != 0) {
      this.gotoframe(this._startFrame);
    } else {
      this._renderFrame();
    }
    if (this._autoPlay)
      this.play();
  }
  _renderFrame() {
    if (this._vertical) {
      this._div.style.backgroundPositionY = px(-(this._currentFrame * this._frameHeight));
    } else {
      this._div.style.backgroundPositionX = px(-(this._currentFrame * this._frameWidth));
    }
  }
  draw() {
    super.draw();
    this._renderFrame();
    this._div.setAttribute("data-obj-name", "AnimatedLayer");
  }
}
AnimatedLayer.GUID = "6b64cd274c4b5a26a7e6598c3a49f60c";
