export default class BaseObject {
  getclassname() {
    return this.constructor.name;
  }
  getid() {
    return this.getId();
  }
  getId() {
    return this._id;
  }
  dispose() {
  }
}
BaseObject.GUID = "516549714a510d87b5a6e391e7f33532";
