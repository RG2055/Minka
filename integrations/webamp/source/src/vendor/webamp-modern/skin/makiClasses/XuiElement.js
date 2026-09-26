import Group from "./Group.js";
export default class XuiElement extends Group {
  constructor() {
    super(...arguments);
    this.__inited = false;
    this._unhandledXuiParams = [];
  }
  getElTag() {
    return "group";
  }
  setXmlAttr(_key, value) {
    const lowerkey = _key.toLowerCase();
    if (super.setXmlAttr(lowerkey, value)) {
      return true;
    }
    this._unhandledXuiParams.push({key: lowerkey, value});
    return true;
  }
  init() {
    if (this.__inited)
      return;
    this.__inited = true;
    super.init();
    for (const systemObject of this._systemObjects) {
      this._unhandledXuiParams.forEach(({key, value}) => {
        this._uiRoot.vm.dispatch(systemObject, "onsetxuiparam", [
          {type: "STRING", value: key},
          {type: "STRING", value}
        ]);
      });
    }
    this._unhandledXuiParams = [];
  }
}
