export default class Color {
  constructor() {
    this._resolver = () => null;
  }
  setResolver(resolver) {
    this._resolver = resolver;
  }
  static isRgb(value) {
    return /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,?\s*$/.test(value ?? "");
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
        this._cssVar = `--color-${this.getId().replace(/[^a-zA-Z0-9]/g, "-")}`;
        break;
      case "value":
        this._value = value;
        break;
      case "gammagroup":
        this._gammagroup = value;
        break;
      default:
        return false;
    }
    return true;
  }
  getId() {
    return this._id;
  }
  getGammaGroup() {
    return this._gammagroup;
  }
  getValue() {
    let value = this._value;
    const seen = new Set([this.getId()?.toLowerCase()]);
    for (let hops = 0; hops < 8 && value && !Color.isRgb(value); hops++) {
      const target = this._resolver(value.trim());
      if (!target || seen.has(target.getId()?.toLowerCase()))
        break;
      seen.add(target.getId()?.toLowerCase());
      value = target._value;
    }
    return value ? value.replace(/,\s*$/, "") : value;
  }
  getCSSVar() {
    return this._cssVar;
  }
  getRgb() {
    return `rgb(${this.getValue()})`;
  }
}
