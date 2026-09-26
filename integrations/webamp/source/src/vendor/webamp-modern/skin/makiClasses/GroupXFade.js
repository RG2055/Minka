import Group from "./Group.js";
import {findLast, num} from "../../utils.js";
import {XmlElement} from "../../_snowpack/pkg/@rgrove/parse-xml.js";
import SkinParser from "../SkinEngine_WAL.js";
export default class GroupXFade extends Group {
  constructor() {
    super(...arguments);
    this._speed = null;
    this._activeChild = null;
  }
  getElTag() {
    return "group";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "speed":
        this._speed = num(value);
        break;
      case "groupid":
        console.log("xFade new groupid", value);
        this._switchTo(value.toLowerCase());
        break;
      default:
        return false;
    }
    return true;
  }
  handleAction(action, param = null, actionTarget = null, source = null) {
    if (action.toLowerCase().startsWith("switchto;")) {
      this._uiRoot.vm.dispatch(this, "onaction", [
        {type: "STRING", value: action},
        {type: "STRING", value: param},
        {type: "INT", value: 0},
        {type: "INT", value: 0},
        {type: "INT", value: 0},
        {type: "INT", value: 0},
        {type: "OBJECT", value: source}
      ]);
      return true;
    }
    switch (action.toLowerCase()) {
      case "groupid":
        return true;
      case "switchto":
        break;
    }
    return false;
  }
  init() {
    super.init();
  }
  async _switchTo(group_id) {
    if (this._activeChild)
      this._fadeOut(this._activeChild);
    let child = findLast(this._children, (c) => c.getId() == group_id);
    if (child == null) {
      const dummyNode = new XmlElement("dummy", {
        id: group_id,
        w: "0",
        h: "0",
        relatw: "1",
        relath: "1",
        alpha: "0"
      });
      const parser = new SkinParser(this._uiRoot);
      child = await parser.group(dummyNode, this);
      child.draw();
      child.init();
      this._div.appendChild(child.getDiv());
    }
    await this._fadeIn(child);
    this._activeChild = child;
  }
  async _fadeOut(child) {
    child._div.classList.add("fading-out");
    child.setalpha(0);
    setTimeout(() => {
      child._div.classList.remove("fading-out");
      child.hide();
    }, this._speed * 1500);
  }
  async _fadeIn(child) {
    child.show();
    child.setalpha(255);
  }
  draw() {
    super.draw();
    this._div.classList.add("x-fade");
    this._div.style.setProperty("--fade-in-speed", `${this._speed}s`);
    this._div.style.setProperty("--fade-out-speed", `${this._speed / 2}s`);
  }
}
GroupXFade.GUID = "OFFICIALLY-NO-GUID";
