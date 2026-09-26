import BaseObject from "./BaseObject.js";
const _items = {};
export default class WinampConfig extends BaseObject {
  constructor(uiRoot) {
    super();
    this._uiRoot = uiRoot;
  }
  getgroup(config_group_guid) {
    const cfg = this._uiRoot.CONFIG.getitembyguid(config_group_guid);
    return new WinampConfigGroup(cfg);
  }
}
WinampConfig.GUID = "b2ad3f2b4e3131ed95e96dbcbb55d51c";
export class WinampConfigGroup {
  constructor(cfg) {
    this._cfg = cfg;
  }
  getstring(itemName) {
    return this._cfg.getValue(itemName);
  }
  getbool(itemName) {
    return this.getstring(itemName) == "1" ? true : false;
  }
  getint(itemName) {
    return parseInt(this.getstring(itemName) || "0");
  }
  setstring(itemName, itemValue) {
    this._cfg.setValue(itemName, itemValue);
  }
  setbool(itemName, itemValue) {
    this._cfg.setValue(itemName, itemValue ? "1" : "0");
  }
  setint(itemName) {
  }
}
WinampConfigGroup.GUID = "fc17844e4518c72bf9a868a080baa530";
