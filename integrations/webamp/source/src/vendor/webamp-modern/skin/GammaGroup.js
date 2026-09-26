import {clamp, normalizeDomId, num} from "../utils.js";
export default class GammaGroup {
  constructor() {
    this._boost = 0;
    this._gray = 0;
  }
  setXmlAttributes(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.setXmlAttr(key, value);
    }
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    switch (key) {
      case "id":
        this._id = value;
        break;
      case "value":
        this._value = value;
        break;
      case "boost":
        this._boost = num(value);
        break;
      case "gray":
        this._gray = num(value);
      default:
        return false;
    }
    return true;
  }
  getId() {
    return this._id;
  }
  getDomId() {
    return normalizeDomId(this._id);
  }
  getRgb() {
    return `rgb(${this._value})`;
  }
  transformImage(img, x, y, w, h) {
    const [r, g, b] = this._value.split(",").map((v) => {
      return Number(v) / 4096 + 1;
    });
    const safeWidth = w || img.width;
    const safeHeight = h || img.height;
    const safeLeft = x ? -x : 0;
    const safeTop = y ? -y : 0;
    const canvas = document.createElement("canvas");
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, safeLeft, safeTop);
    const imageData = ctx.getImageData(0, 0, safeWidth, safeHeight);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      let [ir, ig, ib] = [data[i], data[i + 1], data[i + 2]];
      if (this._gray != 0) {
        if (this._gray == 2)
          ir = (ir + ig + ib) / 3;
        if (this._gray == 1)
          ir = Math.max(ir, ig, ib);
        ig = ir;
        ib = ir;
      }
      const mult = this._boost == 2 ? 4 : 1;
      const brightness = this._boost == 1 ? 128 : this._boost == 2 ? 32 : 0;
      data[i + 0] = clamp((ir + brightness) * mult * r, 0, 255);
      data[i + 1] = clamp((ig + brightness) * mult * g, 0, 255);
      data[i + 2] = clamp((ib + brightness) * mult * b, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
  transformColor2rgb(color) {
    const [r, g, b] = this._value.split(",").map((v) => {
      return Number(v) / 4096 + 1;
    });
    let [red, green, blue] = color.split(",").map((v) => parseInt(v));
    if (this._gray != 0) {
      if (this._gray == 2)
        red = (red + green + blue) / 3;
      if (this._gray == 1)
        red = Math.max(red, green, blue);
      green = red;
      blue = red;
    }
    const mult = this._boost == 2 ? 4 : 1;
    const brightness = this._boost == 1 ? 128 : this._boost == 2 ? 32 : 0;
    red = clamp((red + brightness) * mult * r, 0, 255);
    green = clamp((green + brightness) * mult * g, 0, 255);
    blue = clamp((blue + brightness) * mult * b, 0, 255);
    return [red, green, blue];
  }
  transformColor(color) {
    const [red, green, blue] = this.transformColor2rgb(color);
    return `rgb(${red}, ${green}, ${blue})`;
  }
}
