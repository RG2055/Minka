import {Emitter} from "../../utils.js";
import BaseObject from "./BaseObject.js";
export default class ConfigAttribute extends BaseObject {
  constructor(configItem, name) {
    super();
    this._configItem = configItem;
    this._id = name;
    this._eventListener = new Emitter();
  }
  getparentitem() {
    return this._configItem;
  }
  getattributename() {
    return this._id;
  }
  on(event, callback) {
    return this._eventListener.on(event, callback);
  }
  trigger(event, ...args) {
    this._eventListener.trigger(event, ...args);
  }
  off(event, callback) {
    this._eventListener.off(event, callback);
  }
  getdata() {
    return this._configItem.getValue(this._id);
  }
  setdata(value) {
    this._configItem.setValue(this._id, value);
    this.trigger("datachanged");
    this.ondatachanged();
  }
  ondatachanged() {
    this._configItem._uiRoot.vm.dispatch(this, "ondatachanged");
  }
}
ConfigAttribute.GUID = "24dec2834a36b76e249ecc8c736c6bc4";
