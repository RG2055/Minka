import BaseObject from "./BaseObject.js";
import ConfigAttribute from "./ConfigAttribute.js";
export default class ConfigItem extends BaseObject {
  constructor(uiRoot, config, name, guid) {
    super();
    this._attributes = {};
    this._uiRoot = uiRoot;
    this._config = config;
    this._id = name;
    this._guid = guid.toLowerCase();
  }
  getname() {
    return this._id;
  }
  getguid(attr_name) {
    return this._guid;
  }
  getValue(key) {
    return this._config.getValue(this._guid, key);
  }
  setValue(key, value) {
    return this._config.setValue(this._guid, key, value);
  }
  newattribute(name, defaultValue) {
    name = name.toLowerCase();
    let oldValue = this.getValue(name);
    if (oldValue == null) {
      this.setValue(name, defaultValue);
    }
    const cfg = this._attributes[name] || new ConfigAttribute(this, name);
    this._attributes[name] = cfg;
    return cfg;
  }
  getattribute(att_name) {
    att_name = att_name.toLowerCase();
    let cfg = this._attributes[att_name];
    if (!cfg) {
      return this.newattribute(att_name, "0");
    }
    return cfg;
  }
}
ConfigItem.GUID = "d40302824d873aab32128d87d5fcad6f";
