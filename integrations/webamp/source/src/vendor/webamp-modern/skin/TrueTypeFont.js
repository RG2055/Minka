import * as Utils from "../utils.js";
export default class TrueTypeFont {
  setXmlAttributes(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.setXmlAttr(key, value);
    }
  }
  setXmlAttr(key, value) {
    switch (key.toLowerCase()) {
      case "id":
        this._id = value;
        break;
      case "family":
        this._inlineFamily = value;
        break;
      case "file":
        this._file = value;
        break;
      default:
        return false;
    }
    return true;
  }
  getId() {
    return this._id || "";
  }
  getFontFamily() {
    const family = this._inlineFamily || this._fontFace?.family || this.getId();
    if (/[,'"]/.test(family)) {
      return family;
    }
    return `'${family}'`;
  }
  dispose() {
    if (this._fontFace)
      document.fonts.delete(this._fontFace);
  }
  getBase64() {
    console.log("getting Base64. me:", this.getId());
    return this._imageManager.getCachedUrl(this._file);
  }
  hasUrl() {
    return this._imageManager != null;
  }
  async ensureFontLoaded(imageManager) {
    if (!this._file)
      return;
    Utils.assert(this._fontFace == null, "Tried to ensure a TrueTypeFont was laoded more than once.");
    this._imageManager = imageManager;
    const fontUrl = await imageManager.getUrl(this._file);
    if (!fontUrl) {
      console.warn(`TrueType font file not found in skin: ${this._file}`);
      this._imageManager = null;
      return;
    }
    const fontFamily = `font-${Utils.getId()}-${this.getId()}-${this._file}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const font = new FontFace(fontFamily, `url(${fontUrl})`);
    this._fontFace = await font.load();
    document.fonts.add(this._fontFace);
  }
}
