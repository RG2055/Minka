import {num} from "../../utils.js";
import Container from "../makiClasses/Container.js";
import Group from "../makiClasses/Group.js";
import {decodeWideChars} from "../SkinEngine_WindowsMediaPlayer.js";
import {runInlineScript} from "./util.js";
export default class View extends Container {
  constructor() {
    super(...arguments);
    this._jsScript = {};
  }
  getElTag() {
    return "container";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "clippingcolor":
        this._clippingColor = value;
        break;
      case "scriptfile":
        this._scriptFile = value;
        this.addJsScript(value);
        break;
      case "onload":
        this._onLoad = value;
        break;
      case "timerinterval":
        this._timerInterval = num(value);
        break;
      case "ontimer":
        this._onTimer = value;
        break;
      default:
        return false;
    }
    return true;
  }
  init() {
    super.init();
    const ctx = {view: this};
    if (this._onLoad != null) {
      runInlineScript(this._onLoad, ctx);
    }
    if (this._onTimer && this._timerInterval != null) {
      setTimeout(() => {
        console.log("Blendshutter!?", this._onTimer);
        runInlineScript(this._onTimer, ctx);
      }, this._timerInterval);
    }
  }
  get width() {
    return this.getWidth();
  }
  get height() {
    return this.getHeight();
  }
  set width(w) {
    this.setWidth(w);
  }
  set height(h) {
    this.setHeight(h);
  }
  addJsScript(js) {
    if (js.includes(";")) {
      js = js.substring(0, js.indexOf(";"));
      console.log(js);
    }
    this._jsScript[js] = js;
  }
  async loadJsScripts() {
    for (const scriptPath of Object.keys(this._jsScript)) {
      const scriptContent = await this._uiRoot.getFileAsString(scriptPath);
      const scriptText = decodeWideChars(scriptContent);
      const script = document.createElement("script");
      script.textContent = scriptText;
      script.textContent += ";debugger;";
      script.type = "text/javascript";
      document.head.appendChild(script);
    }
  }
  prepareScriptGlobalObjects() {
    const theme = this._uiRoot.findContainer("theme");
    window["view"] = this;
    const recursiveSetGlobal = (element) => {
      if (element.getOriginalId() != null) {
        window[element.getOriginalId()] = element;
      }
      if (element instanceof Group) {
        for (const child of element._children) {
          recursiveSetGlobal(child);
        }
      }
    };
    const layout = this.getcurlayout();
    recursiveSetGlobal(layout);
  }
  draw() {
    super.draw();
    if (this.getOriginalId() != null) {
      window[this.getOriginalId()] = this;
    }
    if (this._scriptFile) {
      this.prepareScriptGlobalObjects();
    }
  }
}
