import Group from "./Group.js";
import Avs from "./Avs.js";
import {XmlElement} from "../../_snowpack/pkg/@rgrove/parse-xml.js";
export default class WindowHolder extends Group {
  constructor() {
    super(...arguments);
    this._hostEl = null;
    this._hostAsked = false;
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "hold":
        this._hold = value.toLowerCase();
        this._buildConent();
        break;
      default:
        return false;
    }
    return true;
  }
  getguid() {
    return this._hold;
  }
  getcontent() {
    return this._heldObj;
  }
  _syncHold() {
    if (!this._hold)
      return;
    const visible = this.isEffectivelyVisible();
    if (visible && !this._hostEl) {
      const id = this._uiRoot.guid2alias(this._hold);
      const hosted = this._uiRoot.holdWindow?.(id, this._hold, this);
      this._hostAsked = true;
      if (hosted instanceof HTMLElement) {
        this._hostEl = hosted;
        hosted.classList.add("webamp-modern-hosted-window");
        hosted.style.position = "absolute";
        hosted.style.inset = "0";
        this._div.appendChild(hosted);
      }
    } else if (!visible && this._hostEl) {
      this._uiRoot.releaseWindow?.(this._hold, this._hostEl);
      this._hostEl.remove();
      this._hostEl = null;
    }
  }
  _visibilityChanged() {
    super._visibilityChanged();
    if (this._inited)
      this._syncHold();
  }
  init() {
    super.init();
    this._syncHold();
  }
  _buildConent() {
    const id = this._uiRoot.guid2alias(this._hold);
    switch (id) {
      case "avs":
      case "vis":
        const gui = new Avs(this._uiRoot);
        const spec = new XmlElement("dummy", {fitparent: "1"});
        gui.setXmlAttributes(spec.attributes);
        this.addChild(gui);
        this._heldObj = gui;
        break;
    }
  }
  dispose() {
    if (this._hostEl) {
      this._uiRoot.releaseWindow?.(this._hold, this._hostEl);
      this._hostEl = null;
    }
    super.dispose?.();
  }
  getcomponentname() {
    if (this._heldObj) {
      return this._heldObj._name;
    }
    return "";
  }
}
WindowHolder.GUID = "403abcc04bd66f22c810a48b47259329";
