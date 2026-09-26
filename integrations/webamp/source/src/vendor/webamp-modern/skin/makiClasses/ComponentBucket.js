import Group from "./Group.js";
import {px, toBool, clamp, num} from "../../utils.js";
import Button from "./Button.js";
export default class ComponentBucket extends Group {
  constructor(uiRoot) {
    super(uiRoot);
    this._vertical = false;
    this._page = 0;
    this._leftmargin = 0;
    this._rightmargin = 0;
    this._spacing = 0;
    this._wrapper = document.createElement("wrapper");
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key.toLowerCase()) {
      case "wndtype":
        this._wndType = value.toLowerCase();
        break;
      case "vertical":
        this._vertical = toBool(value);
        break;
      case "leftmargin":
        this._leftmargin = num(value);
        break;
      case "rightmargin":
        this._rightmargin = num(value);
        break;
      case "spacing":
        this._spacing = num(value);
        break;
      default:
        return false;
    }
    return true;
  }
  getWindowType() {
    return this._wndType;
  }
  getmaxheight() {
    return this._maximumHeight;
  }
  getmaxwidth() {
    return this._maximumWidth;
  }
  setscroll(x) {
    const anchor = this._vertical ? "top" : "left";
    this._wrapper.style.setProperty(anchor, px(x));
    return x;
  }
  getscroll() {
    const anchor = this._vertical ? "top" : "left";
    const value = parseInt(this._wrapper.style.getPropertyValue(anchor));
    return value;
  }
  getnumchildren() {
    return this._children.length;
  }
  enumchildren(n) {
    return this._children[n];
  }
  handleAction(action, param = null, actionTarget = null, source = null) {
    switch (action.toLowerCase()) {
      case "cb_prev":
      case "cb_prevpage":
        this._scrollPage(1);
        return true;
      case "cb_next":
      case "cb_nextpage":
        this._scrollPage(-1);
        return true;
    }
    return false;
  }
  init() {
    this.resolveButtonsAction();
    super.init();
    this._uiRoot.vm.dispatch(this, "onstartup", []);
  }
  resolveButtonsAction() {
    for (const obj of this.getparent()._children) {
      if (obj instanceof Button && (obj._actionTarget == null || obj._actionTarget == "bucket") && obj._action && obj._action.toLowerCase().startsWith("cb_")) {
        obj._actionTarget = this.getId();
      }
    }
  }
  _scrollPage(step) {
    if (!this._children.length)
      return;
    const oneChild = this._children[0];
    const oneStep = this._vertical ? oneChild.getheight() : oneChild.getwidth();
    const anchor = this._vertical ? "top" : "left";
    const currentStep = this._vertical ? this._wrapper.offsetTop : this._wrapper.offsetLeft;
    const viewportSize = this._div.getBoundingClientRect();
    const maxViewport = this._vertical ? viewportSize.height : viewportSize.width;
    const maxSteps = Math.ceil(maxViewport / oneStep);
    const wrapperSize = this._wrapper.getBoundingClientRect();
    const maxScroll = this._vertical ? wrapperSize.height - viewportSize.height : wrapperSize.width - viewportSize.width;
    const newScroll = clamp(currentStep + oneStep * maxSteps * step, -(maxScroll + (this._leftmargin + this._rightmargin)), 0);
    this._wrapper.style.setProperty(anchor, px(newScroll));
  }
  appendChildrenDiv() {
    this._div.appendChild(this._wrapper);
    this._appendChildrenToDiv(this._wrapper);
  }
  draw() {
    super.draw();
    if (this._vertical) {
      this._div.classList.add("vertical");
      this._wrapper.style.marginTop = px(this._leftmargin);
      this._wrapper.style.marginBottom = px(this._rightmargin);
    } else {
      this._div.classList.remove("vertical");
      this._wrapper.style.marginLeft = px(this._leftmargin);
      this._wrapper.style.marginRight = px(this._rightmargin);
    }
    this._wrapper.style.gap = px(this._spacing);
  }
}
ComponentBucket.GUID = "97aa3e4d4fa8f4d0f20a7b818349452a";
