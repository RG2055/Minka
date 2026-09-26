import GuiObj from "./GuiObj.js";
export default class LayoutStatus extends GuiObj {
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      default:
        return false;
    }
    return true;
  }
  callme(str) {
    console.log("callme:", str);
  }
}
LayoutStatus.GUID = "7fd5f21048dfacc45154a0a676dc6c57";
