import Container from "../makiClasses/Container.js";
import PRIVATE_CONFIG from "../PrivateConfig.js";
import MediaCenter from "./MediaCenter.js";
import Player from "./Player.js";
const WINDOWS_MEDIA_PLAYER = "WindowsMediaPlayer";
export default class Theme extends Container {
  constructor(uiRoot) {
    super(uiRoot);
    this._mediaCenter = new MediaCenter();
    this._player = new Player(this._uiRoot);
  }
  get mediaCenter() {
    return this._mediaCenter;
  }
  getPlayer() {
    return this._player;
  }
  savePreference(name, value) {
    PRIVATE_CONFIG.setPrivateString(WINDOWS_MEDIA_PLAYER, name, value);
  }
  loadPreference(name) {
    return PRIVATE_CONFIG.getPrivateString(WINDOWS_MEDIA_PLAYER, name, "--");
  }
  loadpreference(name) {
    return this.loadPreference(name);
  }
  openView(containerId) {
    const container = this._uiRoot.findContainer(containerId);
    container.show();
  }
  closeView(containerId) {
    const container = this._uiRoot.findContainer(containerId);
    container.hide();
  }
  _setGlobalVar() {
    window["theme"] = this;
    window["mediacenter"] = this._mediaCenter;
    window["player"] = this._player;
  }
  draw() {
    super.draw();
    this._setGlobalVar();
  }
}
