import {debounce} from "../../utils.js";
import BaseObject from "./BaseObject.js";
export default class ConfigPersistent extends BaseObject {
  constructor() {
    super();
    this._saveState = debounce(() => {
      window.localStorage.setItem(this.getStorageName(), JSON.stringify(this._configTree));
    }, 2e3);
    this.loadStorage();
  }
  getStorageName() {
    return `${this.getclassname()}.${this.getId() || "~"}`;
  }
  loadStorage() {
    const cookies = window.localStorage.getItem(this.getStorageName());
    if (cookies) {
      this._configTree = JSON.parse(cookies);
    } else {
      this._configTree = {};
    }
  }
  getSectionValues(section) {
    if (this._configTree[section] == null) {
      this._configTree[section] = {};
    }
    return this._configTree[section];
  }
  getValue(section, key) {
    key = key.toLowerCase();
    return this.getSectionValues(section)[key];
  }
  setValue(section, key, value) {
    key = key.toLowerCase();
    if (this.getValue(section, key) != value) {
      const values = this.getSectionValues(section);
      values[key] = value;
      this._saveState();
    }
    return value;
  }
}
