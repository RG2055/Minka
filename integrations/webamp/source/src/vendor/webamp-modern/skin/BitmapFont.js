import {num, px} from "../utils.js";
import Bitmap from "./Bitmap.js";
const NUMS = "0123456789 -";
const CHARS = [
  'abcdefghijklmnopqrstuvwxyz"@  ',
  "0123456789….:()-'!_+\\/[]^&%,=$#\nâöä?*"
];
const CHAR_MAP = {};
CHARS.forEach((chars, line) => {
  chars.split("").forEach((char, col) => {
    CHAR_MAP[char] = [col, line];
  });
});
console.log("CHAR_MAP:", CHAR_MAP);
export default class BitmapFont extends Bitmap {
  constructor() {
    super(...arguments);
    this._horizontalSpacing = 0;
    this._externalBitmap = false;
    this._bitmap = null;
    this._wa2bignum = 0;
  }
  setXmlAttr(_key, value) {
    if (super.setXmlAttr(_key, value)) {
      return true;
    }
    const key = _key.toLowerCase();
    switch (key) {
      case "charwidth":
        this._charWidth = num(value);
        break;
      case "charheight":
        this._charHeight = num(value);
        break;
      case "hspacing":
        this._horizontalSpacing = num(value);
        break;
      case "vspacing":
        this._verticalSpacing = num(value);
        break;
      case "wa2bignum":
        this._wa2bignum = num(value);
        break;
      default:
        return false;
    }
    return true;
  }
  getHorizontalSpacing() {
    return this._horizontalSpacing;
  }
  _setAsBackground(div, prefix) {
    if (this._externalBitmap) {
      if (!this._bitmap && this._uiRoot != null) {
        this._bitmap = this._uiRoot.getBitmap(this._file);
      }
      if (this._bitmap != null) {
        this._bitmap._setAsBackground(div, prefix);
      }
    } else {
      super._setAsBackground(div, prefix);
    }
  }
  renderLetter(char) {
    if (char == "-" && this._wa2bignum != 0) {
      if (this._wa2bignum == 1) {
        char = ".";
      } else {
        return this.renderWa2MinusChar();
      }
    }
    const span = document.createElement("span");
    const [x, y] = CHAR_MAP[char.toLocaleLowerCase()] ?? CHAR_MAP[" "];
    span.innerText = char;
    span.style.setProperty("--x", px(-(this._charWidth * x)));
    span.style.setProperty("--y", px(-(this._charHeight * y)));
    return span;
  }
  renderWa2MinusChar() {
    const span = document.createElement("span");
    span.innerText = "-";
    span.classList.add("minus", "bignum");
    return span;
  }
  useExternalBitmap() {
    return this._externalBitmap;
  }
  setExternalBitmap(isExternal) {
    this._externalBitmap = isExternal;
  }
}
