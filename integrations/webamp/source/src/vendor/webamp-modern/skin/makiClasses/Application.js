import BaseObject from "./BaseObject.js";
import {unimplemented} from "../../utils.js";
export default class Application extends BaseObject {
  constructor(uiRoot) {
    super();
    this._uiRoot = uiRoot;
  }
  getapplicationname() {
    return "WebAmp Modern";
  }
  getversionstring() {
    return unimplemented("5.66");
  }
  getsettingspath() {
    return unimplemented("./");
  }
  getapplicationpath() {
    return unimplemented("./");
  }
}
Application.GUID = "b8e867b04da72715db53baa5acfefca1";
