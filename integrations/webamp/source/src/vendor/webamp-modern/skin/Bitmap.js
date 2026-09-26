import {assert, hexToRgb, num, px} from "../utils.js";
export function genCssVar(bitmapId) {
  return `--bitmap-${bitmapId.replace(/[^a-zA-Z0-9]/g, "-")}`;
}
export default class Bitmap {
  constructor(uiRoot = null) {
    this._x = 0;
    this._y = 0;
    this._uiRoot = uiRoot;
  }
  setUiRoot(uiRoot) {
    this._uiRoot = uiRoot;
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
        this._cssVar = genCssVar(this.getId());
        break;
      case "x":
        this._x = num(value) ?? 0;
        break;
      case "y":
        this._y = num(value) ?? 0;
        break;
      case "w":
        this._w = num(value);
        break;
      case "h":
        this._h = num(value);
        break;
      case "file":
        this._file = value;
        break;
      case "gammagroup":
        this._gammagroup = value;
        break;
      case "transparentcolor":
        this._transparentColor = value;
        break;
      default:
        return false;
    }
    return true;
  }
  getId() {
    return this._id || "";
  }
  getFile() {
    return this._file || "";
  }
  getWidth() {
    return this._w;
  }
  getHeight() {
    return this._h;
  }
  getLeft() {
    return this._x;
  }
  getTop() {
    return this._y;
  }
  getCSSVar() {
    return this._cssVar;
  }
  getGammaGroup() {
    return this._gammagroup;
  }
  getImg() {
    return this._img;
  }
  setImage(img) {
    this._img = img;
  }
  loaded() {
    return this._img != null;
  }
  async ensureImageLoaded(imageManager) {
    assert(this._url == null, "Tried to ensure a Bitmap was laoded more than once.");
    this._img = await imageManager.getImage(this._file);
    if (this._img && this._w == null && this._h == null) {
      this.setXmlAttr("w", String(this._img.width));
      this.setXmlAttr("h", String(this._img.height));
    }
  }
  _getBackgrondImageCSSAttribute() {
    return `var(${this.getCSSVar()})`;
  }
  _getBackgrondPositionCSSAttribute() {
    const x = px(-(this._x ?? 0));
    const y = px(-(this._y ?? 0));
    return `${x} ${y}`;
  }
  _getBackgrondSizeCSSAttribute() {
    const width = px(this._w);
    const height = px(this._h);
    return `${width} ${height}`;
  }
  _setAsBackground(div, prefix) {
    div.style.setProperty(`--${prefix}background-image`, this._getBackgrondImageCSSAttribute());
  }
  setAsBackground(div) {
    this._setAsBackground(div, "");
  }
  setAsDownBackground(div) {
    this._setAsBackground(div, "down-");
  }
  setAsActiveBackground(div) {
    this._setAsBackground(div, "active-");
  }
  setAsInactiveBackground(div) {
    this._setAsBackground(div, "inactive-");
  }
  setAsHoverBackground(div) {
    this._setAsBackground(div, "hover-");
  }
  setAsHoverDownBackground(div) {
    this._setAsBackground(div, "hover-down-");
  }
  setAsDisabledBackground(div) {
    this._setAsBackground(div, "disabled-");
  }
  async getGammaTransformedUrl(uiRoot) {
    const buildCssProp = (url2) => `  ${this.getCSSVar()}: url(${url2});`;
    const img = this.getImg();
    if (!img) {
      console.warn(`Bitmap/font ${this.getId()} has no img. skipped.`);
      return "";
    }
    const groupId = this.getGammaGroup();
    const gammaGroup = uiRoot._getGammaGroup(groupId);
    if (gammaGroup._value == "0,0,0" && gammaGroup._gray == 0) {
      const url2 = await this.toDataURL(uiRoot);
      return buildCssProp(url2);
    }
    const url = gammaGroup.transformImage(img, this._x, this._y, this._w, this._h);
    return buildCssProp(url);
  }
  async toDataURL(uiRoot) {
    if (this._file.endsWith(".gif")) {
      return await uiRoot.getImageManager().getUrl(this._file);
    } else {
      return this.getCanvas().toDataURL();
    }
  }
  getCanvas(store = false) {
    let workingCanvas;
    if (this._canvas == null || !store) {
      assert(this._img != null, `Expected bitmap image to be loaded: ${this.getId()}`);
      if (this._img instanceof HTMLCanvasElement) {
        workingCanvas = this._img;
      } else {
        workingCanvas = document.createElement("canvas");
        workingCanvas.width = this.getWidth();
        workingCanvas.height = this.getHeight();
        const ctx = workingCanvas.getContext("2d");
        ctx.drawImage(this._img, -this._x, -this._y);
        if (this._transparentColor != null) {
          const rgb = hexToRgb(this._transparentColor);
          var image = ctx.getImageData(0, 0, workingCanvas.width, workingCanvas.height);
          var data = image.data;
          const length = data.length;
          for (var i = 0; i < length; i += 4) {
            if (data[i + 0] == rgb.r && data[i + 1] == rgb.g && data[i + 2] == rgb.b) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(image, 0, 0);
        }
      }
      if (store) {
        this._canvas = workingCanvas;
      }
    }
    if (store) {
      workingCanvas = this._canvas;
    }
    return workingCanvas;
  }
}
