import ConfigPersistent from "./makiClasses/ConfigPersistent.js";
class PrivateConfig extends ConfigPersistent {
  getStorageName() {
    return "_PRIVATE-CONFIG_";
  }
  setDefaults(defaults) {
    for (const [section, items] of Object.entries(defaults ?? {})) {
      for (const [item, value] of Object.entries(items ?? {})) {
        if (this.getValue(section, item) == null) {
          this.setValue(section, item, String(value));
        }
      }
    }
  }
  getPrivateInt(section, item, defvalue) {
    let value = this.getValue(section, item);
    if (value == null) {
      value = this.setValue(section, item, String(defvalue));
    }
    return Number(value);
  }
  setPrivateInt(section, item, value) {
    const strValue = this.setValue(section, item, String(value));
    return Number(strValue);
  }
  getPrivateString(section, item, defvalue) {
    let value = this.getValue(section, item);
    if (value == null) {
      value = this.setValue(section, item, defvalue);
    }
    return value;
  }
  setPrivateString(section, item, value) {
    return this.setValue(section, item, String(value));
  }
}
const PRIVATE_CONFIG = new PrivateConfig();
export default PRIVATE_CONFIG;
