import BaseObject from "./BaseObject.js";
export default class BitList extends BaseObject {
  constructor(uiRoot) {
    super();
    this._items = [];
    this._uiRoot = uiRoot;
  }
  getitem(n) {
    return this._items[n];
  }
  setitem(n, val) {
    this.setsize(n);
    this._items[n] = val;
  }
  setsize(s) {
    while (this._items.length < s) {
      this._items.push(false);
    }
  }
  getsize() {
    return this._items.length;
  }
}
BitList.GUID = "87c6577849fee743cc09f98556fd2a53";
