import {num} from "../../utils.js";
import BitmapFont from "../BitmapFont.js";
import Text from "../makiClasses/Text.js";
export default class TimeFace extends Text {
  constructor() {
    super(...arguments);
    this._displayValue = "";
    this._digit = null;
  }
  getElTag() {
    return "text";
  }
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key.toLowerCase()) {
      case "digit":
        this._digit = num(value);
        break;
    }
  }
  _getBitmapFontTextWidth(font) {
    if (this._digit != null) {
      const charWidth = font._charWidth;
      return charWidth;
    }
    return super._getBitmapFontTextWidth(font);
  }
  setDisplayValue(newValue) {
    if (newValue !== this._displayValue) {
      const font = this._font_obj;
      if (this._digit != null && font instanceof BitmapFont) {
        newValue = newValue.replace(":", "");
        if (newValue.length < 4) {
          newValue = "0" + newValue;
        }
        const char = newValue[this._digit - 1];
        this._displayValue = char;
        this._renderDigit(font);
        return;
      }
      super.setDisplayValue(newValue);
    }
  }
  _renderDigit(font) {
    let text = this.gettext();
    if (text != null) {
      const charNode = font.renderLetter(text);
      this._textWrapper.replaceChildren(charNode);
    }
  }
}
