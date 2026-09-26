import GuiObj from "./GuiObj.js";
import {AUDIO_PAUSED, AUDIO_STOPPED, AUDIO_PLAYING} from "../AudioPlayer.js";
export default class Status extends GuiObj {
  constructor(uiRoot) {
    super(uiRoot);
    this._state = AUDIO_STOPPED;
    this._uiRoot.audio.on("statchanged", () => this._updateStatus());
  }
  _updateStatus() {
    this._state = this._uiRoot.audio.getState();
    this._renderBackground();
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "stopbitmap":
        this._stopbitmap = value;
        this._renderBackground();
        break;
      case "playbitmap":
        this._playbitmap = value;
        this._renderBackground();
        break;
      case "pausebitmap":
        this._pausebitmap = value;
        this._renderBackground();
        break;
      default:
        return false;
    }
    return true;
  }
  getheight() {
    if (this._h) {
      return this._h;
    }
    if (this._stopbitmap != null) {
      const bitmap = this._uiRoot.getBitmap(this._stopbitmap);
      return bitmap ? bitmap.getHeight() : 15;
    }
    return super.getheight();
  }
  getwidth() {
    if (this._w) {
      return this._w;
    }
    if (this._stopbitmap != null) {
      const bitmap = this._uiRoot.getBitmap(this._stopbitmap);
      return bitmap ? bitmap.getWidth() : 15;
    }
    return super.getwidth();
  }
  _renderBackground() {
    let bitmap_id;
    switch (this._state) {
      case AUDIO_PLAYING:
        bitmap_id = this._playbitmap;
        break;
      case AUDIO_PAUSED:
        bitmap_id = this._pausebitmap;
        break;
      case AUDIO_STOPPED:
      default:
        bitmap_id = this._stopbitmap;
        break;
    }
    const bitmap = this._uiRoot.getBitmap(bitmap_id);
    if (bitmap != null) {
      this.setBackgroundImage(bitmap);
    } else {
      this.setBackgroundImage(null);
    }
  }
  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
}
Status.GUID = "0f08c9404b23af39c4b8f38059bb7e8f";
