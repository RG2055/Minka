import {assert, assume} from "../../utils.js";
import BaseObject from "./BaseObject.js";
export default class MakiMap extends BaseObject {
  constructor(uiRoot) {
    super();
    this._uiRoot = uiRoot;
  }
  loadmap(bitmapId) {
    this._bitmap = this._uiRoot.getBitmap(bitmapId);
  }
  inregion(x, y) {
    return true;
  }
  getvalue(x, y) {
    assume(x >= 0, `Expected x to be positive but it was ${x}`);
    assume(y >= 0, `Expected y to be positive but it was ${y}`);
    const canvas = this._bitmap.getCanvas(true);
    const context = canvas.getContext("2d");
    const {data} = context.getImageData(x, y, 1, 1);
    assert(data[0] === data[1] && data[0] === data[2], "Expected map image to be grey scale");
    assume(data[3] === 255, "Expected map image not have transparency");
    return data[0];
  }
  getUnsafeValue(x, y) {
    const canvas = this._bitmap.getCanvas(true);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return null;
    }
    const context = canvas.getContext("2d");
    const {data} = context.getImageData(x, y, 1, 1);
    if (!(data[0] === data[1] && data[0] === data[2]) || data[3] != 255) {
      return null;
    }
    return data[0];
  }
  getwidth() {
    return this._bitmap.getWidth();
  }
  getheight() {
    return this._bitmap.getHeight();
  }
}
MakiMap.GUID = "3860366542a7461b3fd875aa73bf6766";
