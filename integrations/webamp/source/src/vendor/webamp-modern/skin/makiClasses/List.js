import BaseObject from "./BaseObject.js";
export default class MakiList extends BaseObject {
  constructor(uiRoot) {
    super();
    this._list = [];
    this._uiRoot = uiRoot;
  }
  additem(_object) {
    this._list.push(_object);
  }
  removeitem(pos) {
    const item = this._list[pos];
    if (item) {
      this._list.splice(pos, 1);
    }
  }
  finditem(_object) {
    return this._list.indexOf(_object);
  }
  finditem2(_object, startItem) {
    return this._list.indexOf(_object, startItem);
  }
  enumitem(pos) {
    return this._list[pos];
  }
  getnumitems() {
    return this._list.length;
  }
  removeall() {
    this._list = [];
  }
}
MakiList.GUID = "b2023ab54ba1434d6359aebec6f30375";
