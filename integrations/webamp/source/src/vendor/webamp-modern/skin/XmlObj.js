import BaseObject from "./makiClasses/BaseObject.js";
export default class XmlObj extends BaseObject {
  setXmlAttributes(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.setXmlAttr(key, value);
    }
  }
  setXmlAttr(_key, _value) {
    return false;
  }
  setxmlparam(key, value) {
    this.setXmlAttr(key, value);
  }
}
