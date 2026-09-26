import ConfigItem from "./ConfigItem.js";
import ConfigPersistent from "./ConfigPersistent.js";
export default class Config extends ConfigPersistent {
  constructor(uiRoot) {
    super();
    this._id = "CONFIG";
    this._items = {};
    this._uiRoot = uiRoot;
    this._aliases = this.getSectionValues("_alias_");
  }
  getStorageName() {
    return "_CONFIG_";
  }
  newitem(itemName, itemGuid) {
    itemGuid = itemGuid.toLowerCase();
    let cfg = this._items[itemGuid];
    if (!cfg) {
      cfg = new ConfigItem(this._uiRoot, this, itemName, itemGuid);
      this._items[itemGuid] = cfg;
    }
    if (itemName.toLowerCase() == itemGuid) {
      itemName = itemGuid;
    }
    this._aliases[itemName] = itemGuid;
    this._saveState();
    return cfg;
  }
  getitem(item_name) {
    const item_guid = this._aliases[item_name] || item_name;
    const cfg = this._items[item_guid.toLowerCase()];
    if (!cfg) {
      return this.newitem(item_name, item_guid);
    }
    return cfg;
  }
  getitembyguid(item_guid) {
    item_guid = item_guid.toLowerCase();
    const cfg = this._items[item_guid];
    if (!cfg) {
      const item_name = Object.keys(this._aliases).find((key) => this._aliases[key] === item_guid) || item_guid;
      return this.newitem(item_name, item_guid);
    }
    return cfg;
  }
}
Config.GUID = "593dba224976d07771f452b90b405536";
