import {assume, num} from "../../utils.js";
import Group from "./Group.js";
export default class Frame extends Group {
  constructor() {
    super(...arguments);
    this._position = 0;
    this._orientation = "h";
    this._resizable = true;
  }
  getElTag() {
    return "frame2";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key.toLowerCase()) {
      case "width":
        this._position = num(value);
        break;
      case "height":
        this._position = num(value);
        break;
      case "minwidth":
        this._minwidth = num(value) || 0;
        break;
      case "maxwidth":
        this._maxwidth = num(value) || 0;
        break;
      case "orientation":
        this._orientation = value.toLowerCase()[0];
        break;
      case "from":
        this.setFrom(value.toLowerCase()[0]);
        break;
      case "left":
        this._leftId = value.toLowerCase();
        break;
      case "right":
        this._rightId = value.toLowerCase();
        break;
      case "top":
        this._topId = value.toLowerCase();
        break;
      case "bottom":
        this._bottomId = value.toLowerCase();
        break;
      default:
        return false;
    }
    return true;
  }
  getposition() {
    return this._position;
  }
  setposition(position) {
    this._position = position;
    this.alignChildren();
  }
  setFrom(from) {
    const correction = {
      l: "left",
      r: "right",
      b: "bottom",
      t: "top"
    };
    this._from = correction[from];
  }
  init() {
    super.init();
  }
  _getEl(directions) {
    const ret = [
      this.findobject(this[`_${directions[0]}Id`]),
      this.findobject(this[`_${directions[1]}Id`])
    ];
    assume(ret[0] != null, "Frame." + directions[0] + " NOT FOUND!");
    assume(ret[1] != null, "Frame." + directions[1] + " NOT FOUND!");
    return ret;
  }
  alignChildren() {
    this.getDiv().style.setProperty("--position", `${this._position}`);
    this._width = this._position;
    this._height = this._position;
    console.log("FRAME:" + this._id, this);
    const fullSizes = this._orientation == "v" ? {h: "0", relath: "1"} : {w: "0", relatw: "1"};
    if (this._from == "left") {
      const [el1, el2] = this._getEl(["left", "right"]);
      el1.setXmlAttributes({
        ...fullSizes,
        w: `${this._width - 4}`
      });
      el2.setXmlAttributes({
        ...fullSizes,
        x: `${this._width + 4}`,
        w: `-${this._width + 4}`,
        relatw: "1"
      });
    } else if (this._from == "right") {
      const [el1, el2] = this._getEl(["left", "right"]);
      el1.setXmlAttributes({
        ...fullSizes,
        w: `-${this._width + 4}`,
        relatw: "1"
      });
      el2.setXmlAttributes({
        ...fullSizes,
        x: `-${this._width - 4}`,
        relatx: "1",
        w: `${this._width - 8}`
      });
    } else if (this._from == "bottom") {
      const [el1, el2] = this._getEl(["top", "bottom"]);
      el1.setXmlAttributes({
        ...fullSizes,
        h: `-${this._height + 4}`,
        relath: "1"
      });
      el2.setXmlAttributes({
        ...fullSizes,
        y: `-${this._height - 4}`,
        relaty: "1",
        h: `${this._height - 8}`
      });
    } else {
      console.log("frame not implemented: from=", this._from);
    }
  }
  draw() {
    this.alignChildren();
    super.draw();
  }
}
Frame.GUID = "e2bbc14d417384f6ebb2b3bd5055662f";
