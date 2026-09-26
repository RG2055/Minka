import {num, removeAllChildNodes} from "../../utils.js";
import TrueTypeFont from "../TrueTypeFont.js";
import Group from "./Group.js";
import Slider, {ActionHandler} from "./Slider.js";
const DEFAULT_PL_FONT = "Arial";
const DEFAULT_PL_FONTSIZE = 13;
export default class PlayListGui extends Group {
  constructor() {
    super(...arguments);
    this._selectedIndex = -1;
    this._contentPanel = document.createElement("div");
    this._slider = new Slider(this._uiRoot);
    this._plFont = null;
    this._plFontSize = null;
    this._plLineSpacing = null;
    this._plColor = null;
    this._plPlayColor = null;
    this._plSelColor = null;
    this._plSelBgColor = null;
    this._plBgColor = null;
    this._contentScrolled = () => {
      const list = this._contentPanel;
      const newPercent = list.scrollTop / (list.scrollHeight - list.clientHeight);
      this._slider.setposition((1 - newPercent) * 255);
    };
    this.refresh = () => {
      removeAllChildNodes(this._contentPanel);
      const pl = this._uiRoot.playlist;
      const currentTrack = pl.getcurrentindex();
      for (let i = 0; i < pl.getnumtracks(); i++) {
        const line = document.createElement("div");
        if (i == currentTrack) {
          line.classList.add("current");
        }
        if (i == this._selectedIndex) {
          line.classList.add("selected");
        }
        line.addEventListener("click", (ev) => {
          this._selectedIndex = i;
          this.refresh();
        });
        line.addEventListener("dblclick", (ev) => {
          this._uiRoot.playlist.playtrack(i);
          this._uiRoot.audio.play();
          this.refresh();
        });
        line.innerHTML = `<span>${i + 1}. ${pl.gettitle(i)}</span><span>${pl.getlength(i)}</span>`;
        this._contentPanel.appendChild(line);
      }
    };
    this.itemClick = () => {
    };
  }
  getElTag() {
    return "group";
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "font":
        this._plFont = value;
        break;
      case "fontsize":
        this._plFontSize = num(value);
        break;
      case "linespacing":
        this._plLineSpacing = num(value);
        break;
      case "color":
        this._plColor = value;
        break;
      case "playcolor":
        this._plPlayColor = value;
        break;
      case "selcolor":
        this._plSelColor = value;
        break;
      case "selbgcolor":
        this._plSelBgColor = value;
        break;
      case "bgcolor":
        this._plBgColor = value;
        break;
      default:
        return false;
    }
    return true;
  }
  _cssColor(value) {
    if (!value)
      return null;
    if (/^\d+\s*,\s*\d+\s*,\s*\d+/.test(value))
      return `rgb(${value})`;
    const color = this._uiRoot.findColor(value);
    return color ? `var(${color.getCSSVar()}, ${color.getRgb()})` : null;
  }
  _applyTextStyle() {
    const skinFont = this._plFont ? null : this._uiRoot.getSkinPlaylistFont();
    const fontId = this._plFont ?? skinFont?.font ?? null;
    const fontSize = this._plFontSize ?? skinFont?.fontsize ?? DEFAULT_PL_FONTSIZE;
    const lineSpacing = this._plLineSpacing ?? skinFont?.linespacing ?? 0;
    let family = DEFAULT_PL_FONT;
    if (fontId) {
      const font = this._uiRoot.getFont(fontId);
      family = font instanceof TrueTypeFont ? font.getFontFamily() : fontId;
    }
    const style = this._div.style;
    style.setProperty("--pl-font-family", family);
    style.setProperty("--pl-font-size", `${fontSize}px`);
    style.setProperty("--pl-line-height", `${fontSize + 1 + lineSpacing}px`);
    const setColor = (name, value) => {
      const css = this._cssColor(value);
      if (css)
        style.setProperty(name, css);
      else
        style.removeProperty(name);
    };
    setColor("--pl-color", this._plColor);
    setColor("--pl-play-color", this._plPlayColor);
    setColor("--pl-sel-color", this._plSelColor);
    setColor("--pl-sel-bg-color", this._plSelBgColor);
    setColor("--pl-bg-color", this._plBgColor);
  }
  init() {
    super.init();
    this._uiRoot.playlist.on("trackchange", this.refresh);
    this._contentPanel.addEventListener("scroll", this._contentScrolled);
    this.refresh();
  }
  _prepareScrollbar() {
    this._slider.setXmlAttributes({
      orientation: "v",
      x: "-10",
      relatx: "1",
      y: "0",
      w: "8",
      h: "0",
      relath: "1"
    });
    this._slider.setThumbSize(8, 18);
    const sliderHandler = new PlaylistScrollActionHandler(this._slider, this);
    this._slider.setActionHandler(sliderHandler);
    this._slider.getDiv().classList.add("scrollbar");
    this.addChild(this._slider);
  }
  _scrollTo(percent) {
    const list = this._contentPanel;
    const newScrollTop = percent * (list.scrollHeight - list.clientHeight);
    list.scrollTop = newScrollTop;
  }
  draw() {
    this._prepareScrollbar();
    super.draw();
    this._applyTextStyle();
    this._div.appendChild(this._contentPanel);
    this._contentPanel.classList.add("content-list");
    this._div.setAttribute("tabindex", "0");
    this._div.classList.add("pl");
    this._div.classList.add("list");
    this._div.style.pointerEvents = "auto";
  }
}
PlayListGui.GUID = "45f3f7c14ee6a6f35e125ea18d3ffc92";
class PlaylistScrollActionHandler extends ActionHandler {
  constructor(slider, pl) {
    super(slider);
    this._scrolling = false;
    this._pl = pl;
  }
  onLeftMouseDown(x, y) {
    this._scrolling = true;
  }
  onLeftMouseUp(x, y) {
    this._scrolling = false;
  }
  onsetposition(position) {
    if (this._scrolling) {
      this._pl._scrollTo(1 - position / 255);
    }
  }
}
