import BaseObject from "./BaseObject.js";
export default class File extends BaseObject {
  constructor(uiRoot) {
    super();
    this._uiRoot = uiRoot;
  }
  load(path) {
    this._path = path;
  }
  exists() {
    return false;
  }
  getsize() {
    const request = new XMLHttpRequest();
    request.open("GET", this._path, false);
    request.send(null);
    return Number(request.getResponseHeader("content-length"));
  }
}
File.GUID = "836f8b2e4db4e0d10a0d7f93d1dcc804";
