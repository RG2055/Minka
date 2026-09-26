import GuiObj from "./GuiObj.js";
import TrueTypeFont from "../TrueTypeFont.js";
import BitmapFont from "../BitmapFont.js";
import {
  integerToTime,
  removeAllChildNodes,
  num,
  px,
  toBool,
  clamp
} from "../../utils.js";
import Timer from "./Timer.js";
function timeToSeconds(text) {
  if (!text)
    return null;
  const parts = text.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((p) => !Number.isFinite(p)))
    return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
export default class Text extends GuiObj {
  constructor(uiRoot) {
    super(uiRoot);
    this._displayValue = "";
    this._altTextTimer = null;
    this._align = "left";
    this._valign = "center";
    this._ticker = "off";
    this._paddingX = 2;
    this._timeColonWidth = null;
    this._timeroffstyle = 0;
    this._scrollPaused = false;
    this._scrollLeft = 0;
    this._shadowX = 0;
    this._shadowY = 0;
    this._drawn = false;
    this._onClick = () => {
      if (this._display.toLowerCase() == "time") {
        this._uiRoot.audio.toggleRemainingTime();
        this.setDisplayTime();
      }
    };
    this._uiRoot = uiRoot;
    this._textWrapper = document.createElement("wrap");
    this._div.appendChild(this._textWrapper);
  }
  setXmlAttr(key, value) {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key.toLowerCase()) {
      case "display":
        this._setDisplay(value);
        break;
      case "text":
      case "default":
        this._text = value;
        this._renderText();
        break;
      case "bold":
        this._bold = toBool(value);
        this._prepareCss();
        break;
      case "forceupcase":
      case "forceuppercase":
        this._forceuppercase = toBool(value);
        this._prepareCss();
        this._renderText();
        break;
      case "font":
        this._font_id = value;
        this._autoDetectFontType();
        this.ensureFontSize();
        this._prepareCss();
        break;
      case "align":
        this._align = value;
        this._prepareCss();
        break;
      case "valign":
        this._valign = value;
        this._prepareCss();
        break;
      case "fontsize":
        this._fontSize = num(value);
        this.ensureFontSize();
        this._invalidateFullWidth();
        this._prepareCss();
        break;
      case "color":
        this._color = value;
        this._prepareCss();
        break;
      case "ticker":
        if (value == "0")
          value = "off";
        this._ticker = value.toLowerCase();
        break;
      case "timecolonwidth":
        this._timeColonWidth = num(value);
        this._prepareCss();
        this._renderText();
        break;
      case "timeroffstyle":
        this._timeroffstyle = num(value);
        this._setDisplay(this._display);
        break;
      case "shadowcolor":
        this._shadowColor = value;
        this._prepareCss();
        break;
      case "shadowx":
        this._shadowX = num(value);
        this._prepareCss();
        break;
      case "shadowy":
        this._shadowY = num(value);
        this._prepareCss();
        break;
      default:
        return false;
    }
    return true;
  }
  _autoDetectFontType() {
    if (this._font_id) {
      this._font_obj = this._uiRoot.getFont(this._font_id);
      if (!this._font_obj) {
        const newFont = new TrueTypeFont();
        newFont._inlineFamily = this._font_id;
        this._uiRoot.addFont(newFont);
        this._font_obj = newFont;
      }
    }
  }
  _autoDetectColor() {
    if (this._color) {
      if (this._color.split(",").length == 3) {
        this._div.style.color = `rgb(${this._color})`;
        return;
      }
      const color = this._uiRoot.getColor(this._color);
      if (color) {
        this._div.style.color = `var(${color.getCSSVar()}, ${color.getRgb()})`;
      }
    }
  }
  ensureFontSize() {
  }
  init() {
    super.init();
    if (this._ticker && this._ticker != "off") {
      this._prepareScrolling();
    }
    this._div.addEventListener("click", this._onClick);
    if (this._displayHandler != null) {
      this._displayHandler.init();
    }
  }
  _setDisplay(display) {
    if (display == null) {
      return;
    }
    if (this._disposeDisplaySubscription != null) {
      this._disposeDisplaySubscription();
    }
    if (this._disposeTrackChangedSubscription != null) {
      this._disposeTrackChangedSubscription();
    }
    this._display = display;
    switch (this._display.toLowerCase()) {
      case "":
        this._displayValue = "";
        break;
      case "pe_info": {
        const update = () => this.setDisplayValue(this._peInfoText());
        update();
        this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", update);
        break;
      }
      case "vid_info":
        this._displayValue = "";
        break;
      case "time":
        this._disposeDisplaySubscription = this._uiRoot.audio.onCurrentTimeChange(() => {
          this.setDisplayTime();
        });
        console.log("in changing display = time. by:", display);
        this.setDisplayTime();
        break;
      case "songlength": {
        const update = () => {
          const length = this._uiRoot.audio.getLength();
          this.setDisplayValue(length > 0 ? integerToTime(length) : "");
        };
        update();
        this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", update);
        break;
      }
      case "songname":
      case "songtitle":
        this._displayValue = this._uiRoot.playlist.getCurrentTrackTitle();
        this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", () => {
          this._displayValue = this._uiRoot.playlist.getCurrentTrackTitle();
          this._renderText();
        });
        break;
      case "songbitrate":
      case "songsamplerate":
      case "songinfo": {
        const kind = this._display.toLowerCase();
        const update = () => {
          const info = this._uiRoot.getSongInfoText();
          if (kind === "songbitrate") {
            this.setDisplayValue(/(\d+)kbps/.exec(info)?.[1] ?? "");
          } else if (kind === "songsamplerate") {
            this.setDisplayValue(/(\d+)khz/.exec(info)?.[1] ?? "");
          } else {
            this.setDisplayValue(info);
          }
        };
        update();
        this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", update);
        break;
      }
      case "componentbucket":
        this._displayValue = "componentbucket";
        break;
      case "custom":
        break;
      default:
        throw new Error(`Unknown text display name: "${this._display}".`);
    }
    this._renderText();
  }
  setDisplayValue(newValue) {
    if (newValue !== this._displayValue) {
      this._displayValue = newValue;
      this._renderText();
      this._uiRoot.vm.dispatch(this, "ontextchanged", [
        {type: "STRING", value: this.gettext()}
      ]);
    }
  }
  setDisplayTime() {
    if (this._uiRoot.audio._isStop) {
      switch (this._timeroffstyle) {
        case 0:
          this.setDisplayValue("  : ");
          break;
        case 1:
          this.setDisplayValue("00:00");
          break;
        case 2:
          this.setDisplayValue("");
          break;
      }
      return;
    }
    this.setDisplayValue(integerToTime(this._uiRoot.audio.getCurrentTime()));
  }
  ontextchanged(s) {
    this._uiRoot.vm.dispatch(this, "ontextchanged", [
      {type: "STRING", value: this.gettext()}
    ]);
  }
  _interpolateText(value) {
    switch (value.toLowerCase()) {
      case ":componentname":
        const layout = this.getparentlayout();
        if (layout) {
          try {
            return layout.getcontainer()._name || value;
          } catch {
            return value;
          }
        }
        break;
    }
    return value;
  }
  gettext() {
    if (this._alternateText) {
      return this._alternateText;
    }
    if ((this._text || "").startsWith(":") && this._drawn) {
      const layout = this.getparentlayout();
      if (layout) {
        return layout.getcontainer()._name || this._text;
      }
    }
    if (this._display) {
      return this._displayValue;
    }
    return this._text ?? "";
  }
  settext(txt) {
    if (this._text != txt) {
      this._text = txt;
      this._renderText();
      this.ontextchanged(this.gettext());
    }
  }
  _peInfoText() {
    const playlist = this._uiRoot.playlist;
    const count = playlist.getnumtracks();
    let total = 0;
    let unknown = false;
    for (let i = 0; i < count; i++) {
      const seconds = timeToSeconds(playlist.getlength(i));
      if (seconds == null)
        unknown = true;
      else
        total += seconds;
    }
    const current = playlist.getcurrentindex();
    const selected = current >= 0 ? timeToSeconds(playlist.getlength(current)) ?? 0 : 0;
    return `${integerToTime(selected)}/${integerToTime(total)}${unknown ? "+" : ""}`;
  }
  setalternatetext(txt) {
    const next = txt ?? "";
    if (next === (this._alternateText ?? "")) {
      return;
    }
    if (this._altTextTimer != null) {
      clearTimeout(this._altTextTimer);
      this._altTextTimer = null;
    }
    this._alternateText = next;
    this._renderText();
    this.ontextchanged(this.gettext());
    if (next) {
      this._altTextTimer = setTimeout(() => {
        this._altTextTimer = null;
        this.setalternatetext("");
      }, 1e3);
    }
  }
  _prepareCss() {
    if (!this._font_obj && this._font_id) {
      this._font_obj = this._uiRoot.getFont(this._font_id);
    }
    if (!this._font_obj && !this._font_id) {
      this._font_obj = this._uiRoot.getFont("Arial") ?? null;
    }
    const font = this._font_obj;
    if (font instanceof BitmapFont) {
      this._textWrapper.setAttribute("font", "BitmapFont");
      this._div.style.setProperty("--fontSize", (this._fontSize || "~").toString());
      if (this._align != "center") {
        this._div.style.setProperty("--align", this._align);
      } else {
        this._div.style.removeProperty("--align");
      }
      if (this._valign != "center") {
        this._div.style.setProperty("--valign", this._valign == "top" ? "flex-start" : "flex-end");
      } else {
        this._div.style.removeProperty("--valign");
      }
      this._div.style.setProperty("--hspacing", px(font.getHorizontalSpacing()));
      this.setBackgroundImage(font);
      this._div.style.backgroundSize = "0";
      this._div.style.lineHeight = px(this._div.getBoundingClientRect().height);
      this._div.style.setProperty("--charwidth", px(font._charWidth));
      this._div.style.setProperty("--charheight", px(font._charHeight));
    } else {
      this._autoDetectColor();
      if (this._shadowColor) {
        this._div.style.textShadow = `${this._shadowX}px ${this._shadowY}px rgb(${this._shadowColor})`;
      }
      if (font instanceof TrueTypeFont) {
        this._textWrapper.setAttribute("font", "TrueType");
        this._div.style.fontFamily = font.getFontFamily();
        this._div.style.fontSize = px(this._fontSize ?? 11);
        this._div.style.lineHeight = "1";
        this._div.style.textTransform = this._forceuppercase ? "uppercase" : "none";
        if (this._bold) {
          this._div.style.fontWeight = "bold";
        }
        if (this._align) {
          this._div.style.textAlign = this._align;
        }
        if (this._align && this._align != "center") {
          this._div.style.setProperty("--align", this._align);
        } else {
          this._div.style.removeProperty("--align");
        }
        if (this._valign != "center") {
          this._div.style.setProperty("--valign", this._valign == "top" ? "flex-start" : "flex-end");
        } else {
          this._div.style.removeProperty("--valign");
        }
      } else if (font == null) {
        this._div.style.setProperty("--fontMode", "Null");
        this._div.style.fontFamily = "Arial";
      } else {
        throw new Error("Unexpected font");
      }
    }
  }
  _renderText() {
    if (this._ticker != "off")
      this._invalidateFullWidth();
    const font = this._font_obj;
    if (font instanceof BitmapFont) {
      this._renderBitmapFont(font);
    } else {
      this._textWrapper.innerText = this.gettext();
    }
  }
  _useColonWidth() {
    if (this._timeColonWidth == null || this._display == null) {
      return false;
    }
    switch (this._display.toLowerCase()) {
      case "time":
      case "timeelapsed":
      case "timeremaining":
        return true;
    }
    return false;
  }
  _renderBitmapFont(font) {
    removeAllChildNodes(this._textWrapper);
    this._div.style.whiteSpace = "nowrap";
    const useColonWidth = this._useColonWidth();
    if (this.gettext() != null) {
      for (const char of this.gettext().split("")) {
        const charNode = font.renderLetter(char);
        if (char === ":" && useColonWidth) {
          charNode.style.width = px(this._timeColonWidth);
          charNode.style.marginRight = "0";
        }
        this._textWrapper.appendChild(charNode);
      }
    }
  }
  _renderBitmapFont1(font) {
    this._div.style.whiteSpace = "nowrap";
    let s = "";
    for (const char of this.gettext().split("")) {
      s += `<i>${char}</i>`;
    }
    this._div.innerHTML = s;
  }
  _invalidateFullWidth() {
    const font = this._font_obj;
    if (font instanceof BitmapFont) {
      this._textFullWidth = this._getBitmapFontTextWidth(font);
    } else {
      this._textFullWidth = this._getTrueTypeTextWidth(font);
    }
    this._div.style.setProperty("--full-width", px(this._textFullWidth));
  }
  getautowidth() {
    this._invalidateFullWidth();
    let textWidth = this._textFullWidth;
    if (this._relatw == "1") {
      textWidth += this._w * -1;
    }
    return textWidth;
  }
  gettextwidth() {
    return this.getautowidth();
  }
  _getBitmapFontTextWidth(font) {
    const charWidth = font._charWidth;
    return this.gettext().length * charWidth;
  }
  _getTrueTypeTextWidth(font) {
    let txt = this.gettext();
    if (this._forceuppercase) {
      txt = txt.toUpperCase();
    } else if (this._forcelowercase) {
      txt = txt.toLowerCase();
    }
    const fontFamily = font && font.getFontFamily() || '"Liberation Sans", "DejaVu Sans", Arial';
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `${this._bold ? "700" : ""} ${this._fontSize || 11}px ${fontFamily}`;
    const metrics = context.measureText(txt);
    return Math.ceil(metrics.width);
  }
  draw() {
    this._drawn = true;
    super.draw();
    this._renderText();
    this._div.classList.add("webamp--img");
  }
  _prepareScrolling() {
    this._scrollDirection = -1;
    const timer = this._scrollTimer = new Timer(this._uiRoot);
    timer.setdelay(50);
    timer.setOnTimer(() => {
      this.doScrollText();
    });
    timer.start();
  }
  doScrollText() {
    const curL = this._scrollLeft;
    const step = 1;
    const idle = 20;
    const container = this._div.getBoundingClientRect();
    const wrapperWidth = this._textFullWidth;
    if (wrapperWidth <= container.width)
      return;
    var l = curL + step * this._scrollDirection;
    if (l + wrapperWidth < container.width - step * idle) {
      this._scrollDirection *= -1;
      l = curL + step * this._scrollDirection;
    } else if (l > step * idle) {
      this._scrollDirection *= -1;
      l = curL + step * this._scrollDirection;
    }
    this._scrollLeft = l;
    l = clamp(l, -(wrapperWidth - container.width), 0);
    this._textWrapper.style.left = px(Math.round(l));
  }
  dispose() {
    if (this._altTextTimer != null) {
      clearTimeout(this._altTextTimer);
      this._altTextTimer = null;
    }
    if (this._disposeDisplaySubscription != null) {
      this._disposeDisplaySubscription();
    }
    if (this._displayHandler != null) {
      this._displayHandler.dispose();
    }
  }
  setDisplayHandler(Handler) {
    if (this._displayHandler != null) {
      this._displayHandler.dispose();
    }
    this._displayHandler = new Handler(this);
  }
}
Text.GUID = "efaa867241fa310ea985dcb74bcb5b52";
export class DisplayHandler {
  constructor(text) {
    this._text = text;
    this._uiRoot = text._uiRoot;
    this._subscription = () => {
    };
  }
  init() {
  }
  dispose() {
    this._subscription();
  }
}
