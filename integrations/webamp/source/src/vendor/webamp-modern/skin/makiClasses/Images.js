import {num, px} from "../../utils.js";
import Layer from "./Layer.js";
export default class Images extends Layer {
  constructor() {
    super(...arguments);
    this._currentFrame = 0;
    this.updateVolume = () => {
      const vol = this._uiRoot.audio.getVolume();
      this.gotoFrame(vol * this._frameCount);
    };
    this.updateBalance = () => {
      const balance = this._uiRoot.audio.getBalance();
      this.gotoFrame(balance * this._frameCount);
    };
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
      case "source":
        this._source = value.toLowerCase();
        break;
      case "images":
        this._image = value;
        this._renderBackground();
        break;
      case "imagesspacing":
        this._frameHeight = num(value);
        break;
      default:
        return false;
    }
    return true;
  }
  init() {
    super.init();
    this._frameCount = Math.ceil(this._getImageHeight() / this._frameHeight) - 1;
    if (this._source == "volume") {
      this._uiRoot.audio.onVolumeChanged(this.updateVolume);
      this.updateVolume();
    } else if (this._source == "balance") {
      this._uiRoot.audio.onBalanceChanged(this.updateBalance);
      this.updateBalance();
    }
  }
  _getImageHeight() {
    const bitmap = this._uiRoot.getBitmap(this._image);
    if (bitmap) {
      return bitmap.getHeight();
    }
    return null;
  }
  gotoFrame(framenum) {
    this._currentFrame = Math.ceil(framenum);
    this._renderFrame();
  }
  _renderFrame() {
    this._div.style.backgroundPositionY = px(-(this._currentFrame * this._frameHeight));
  }
  draw() {
    super.draw();
    this._renderFrame();
    this._div.setAttribute("data-obj-name", "AnimatedLayer");
  }
}
Images.GUID = "OFFICIALLY-NO-GUID";
