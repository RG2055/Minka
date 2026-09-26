import {XmlElement} from "../_snowpack/pkg/@rgrove/parse-xml.js";
import ButtonKjofol from "./kjofolClasses/ButtonKjofol.js";
import DialKnob from "./kjofolClasses/DialKnob.js";
import FlatSlider from "./kjofolClasses/FlatSlider.js";
import FloodLevel from "./kjofolClasses/FloodLevel.js";
import {ImageManagerKjofol} from "./kjofolClasses/ImageManagerKjofol.js";
import ToggleButtonKjofol from "./kjofolClasses/ToggleButtonKjofol.js";
import {DisplayHandler} from "./makiClasses/Text.js";
import Vis from "./makiClasses/Vis.js";
import {registerSkinEngine, SkinEngine} from "./SkinEngine.js";
export default class KJofol_SkinEngine extends SkinEngine {
  async parseSkin() {
    this._uiRoot.setImageManager(new ImageManagerKjofol(this._uiRoot));
    this._imageManager = this._uiRoot._imageManager;
    const rcContent = await this._uiRoot.getFileAsString(".rc");
    this._rc = parserRC(rcContent);
    this._rc["prefix"] = "normal";
    const main = await this.loadMain();
    await this.loadMainNormal(main);
    const dockFileName = this._rc["DockModeRCFile"];
    if (dockFileName) {
      const dockContent = await this._uiRoot.getFileAsString(dockFileName);
      this._dock = parserRC(dockContent);
      this._dock["prefix"] = "dock";
      await this.loadMainDock(main);
    }
    const shadeFileName = this._rc["WinshadeModeRCFile"];
    if (shadeFileName) {
      const shadeContent = await this._uiRoot.getFileAsString(shadeFileName);
      this._shade = parserRC(shadeContent);
      this._shade["prefix"] = "shade";
      await this.loadPlayerShade(main);
    }
    this._uiRoot.getRootDiv().classList.add("K-Jofol");
  }
  async loadKnowBitmaps(config) {
    const prefix = config["prefix"];
    await this.loadBitmap(config["BackgroundImage"], `${prefix}-base`);
    await this.loadBitmap(config["BackgroundImage"], `${prefix}-base-inactive`);
    for (var i = 1; i <= 3; i++) {
      const pressed = config[`BackgroundImagePressed${i}`];
      if (pressed != null) {
        await this.loadBitmap(pressed, `${prefix}-BMP${i}`);
      }
    }
  }
  async loadMain() {
    let node = new XmlElement("container", {
      id: "main",
      x: "0",
      y: "0"
    });
    const main = await this.container(node);
    return main;
  }
  async loadMainNormal(parent) {
    await this.loadKnowBitmaps(this._rc);
    const prefix = this._rc["prefix"];
    const bg = this._uiRoot.getBitmap(`${prefix}-base`);
    let node = new XmlElement("container", {
      id: "normal",
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const normal = await this.layout(node, parent);
    node = new XmlElement("group", {
      id: "main-root",
      background: bg.getId(),
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const group = await this.group(node, normal);
    node = new XmlElement("layer", {
      id: "mover",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
    await this.loadSeek(this._rc, group);
    await this.loadButton("Play", "play", group, this._rc);
    await this.loadButton("Pause", "pause", group, this._rc);
    await this.loadButton("Stop", "stop", group, this._rc);
    await this.loadButton("PreviousSong", "previoussong", group, this._rc);
    await this.loadButton("NextSong", "nextsong", group, this._rc);
    await this.loadButton("OpenFile", "openfile", group, this._rc);
    await this.loadTexts(group, this._rc);
    await this.loadVis(group, this._rc);
    await this.loadVolume(this._rc, group);
    await this.loadPitch(this._rc, group);
    await this.loadEqualizer(this._rc, group);
    await this.loadToggleButton("Repeat", "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D};Repeat", group, this._rc);
    await this.loadToggleButton("Shuffle", "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D};Shuffle", group, this._rc);
    await this.loadButton("DockMode", "SWITCH;dock", group, this._rc);
    await this.loadButton("Minimize", "SWITCH;shade", group, this._rc);
  }
  async loadMainDock(parent) {
    await this.loadKnowBitmaps(this._dock);
    const prefix = this._dock["prefix"];
    const bg = this._uiRoot.getBitmap(`${prefix}-base`);
    let node = new XmlElement("layout", {
      id: "dock",
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const normal = await this.layout(node, parent);
    node = new XmlElement("group", {
      id: "dock-root",
      background: bg.getId(),
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const group = await this.group(node, normal);
    node = new XmlElement("layer", {
      id: "mover",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
    await this.loadButton("Play", "play", group, this._dock);
    await this.loadButton("Pause", "pause", group, this._dock);
    await this.loadButton("Stop", "stop", group, this._dock);
    await this.loadButton("PreviousSong", "prev", group, this._dock);
    await this.loadButton("NextSong", "next", group, this._dock);
    await this.loadButton("OpenFile", "openfile", group, this._dock);
    await this.loadTexts(group, this._dock);
    await this.loadVis(group, this._dock);
    await this.loadVolume(this._dock, group);
    await this.loadSeek(this._dock, group);
    await this.loadButton("About", "about", group, this._dock);
    await this.loadButton("UnDockMode", "SWITCH;normal", group, this._dock);
  }
  async loadPlayerShade(parent) {
    const config = this._shade;
    await this.loadKnowBitmaps(config);
    const prefix = config["prefix"];
    const bg = this._uiRoot.getBitmap(`${prefix}-base`);
    let node = new XmlElement("layout", {
      id: `${prefix}`,
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const normal = await this.layout(node, parent);
    node = new XmlElement("group", {
      id: `${prefix}-root`,
      background: bg.getId(),
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const group = await this.group(node, normal);
    node = new XmlElement("layer", {
      id: `${prefix}-mover`,
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
    await this.loadButton("Play", "play", group, config);
    await this.loadButton("Pause", "pause", group, config);
    await this.loadButton("Stop", "stop", group, config);
    await this.loadButton("PreviousSong", "prev", group, config);
    await this.loadButton("NextSong", "next", group, config);
    await this.loadButton("OpenFile", "openfile", group, config);
    await this.loadTexts(group, config);
    await this.loadVis(group, config);
    await this.loadVolume(config, group);
    await this.loadSeek(config, group);
    await this.loadButton("About", "about", group, config);
    await this.loadButton("UnDockMode", "SWITCH;normal", group, config);
  }
  async loadButton(nick, action, parent, config) {
    const prefix = config["prefix"];
    const rect = config[`${nick}Button`];
    if (!rect)
      return;
    const [left, top, right, bottom, tooltip, downimage] = rect;
    let param = "";
    if (action.includes(";")) {
      [action, param] = action.split(";");
    }
    const node = new XmlElement("button", {
      id: nick,
      action,
      param,
      tooltip,
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`,
      downimage: `${prefix}-${downimage}`
    });
    const button = await this.newGui(ButtonKjofol, node, parent);
    return button;
  }
  async loadToggleButton(nick, cfgattrib, parent, config) {
    const prefix = config["prefix"];
    const rect = config[`${nick}Button`];
    if (!rect)
      return;
    const [left, top, right, bottom, tooltip, downimage] = rect;
    const node = new XmlElement("button", {
      id: nick,
      cfgattrib,
      cfgval: "2",
      tooltip,
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`,
      activeImage: `${prefix}-${downimage}`
    });
    const button = await this.newGui(ToggleButtonKjofol, node, parent);
    return button;
  }
  async loadPlainBitmap(fileName, name = null, option = {}) {
    if (name == null) {
      name = fileName;
    }
    const bitmap = await this.bitmap(new XmlElement("bitmap", {id: name, file: fileName, ...option}));
    return bitmap;
  }
  async loadBitmap(fileName, name = null) {
    const bitmap = await this.loadPlainBitmap(fileName, name);
    if (bitmap.getImg() != null) {
      this.applyTransparency(bitmap);
    }
    return bitmap;
  }
  applyTransparency(bitmap) {
    const rgb = {r: 255, g: 0, b: 255};
    let anyPixelChanged = false;
    const canvas = bitmap.getCanvas();
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const length = data.length;
    for (var i = 0; i < length; i += 4) {
      if (data[i + 0] == rgb.r && data[i + 1] == rgb.g && data[i + 2] == rgb.b) {
        data[i + 3] = 0;
        anyPixelChanged = true;
      }
    }
    if (anyPixelChanged) {
      ctx.putImageData(img, 0, 0);
      bitmap.setImage(canvas);
    }
  }
  async loadTexts(parent, config) {
    this.loadText("Filename", "songtitle", parent, config);
    this.loadText("MP3Kbps", "songinfo", parent, config);
  }
  async loadText(prefix, action, parent, config) {
    const rect = config[`${prefix}Window`];
    if (!rect)
      return;
    const [left, top, right, bottom] = rect;
    const node = new XmlElement("text", {
      id: `${prefix}-text`,
      text: `${action}`,
      display: `${action}`,
      ticker: `${1}`,
      x: `${left - 1}`,
      y: `${top - 2}`,
      w: `${right - left + 2}`,
      h: `${bottom - top + 4}`
    });
    await this.text(node, parent);
  }
  async loadVis(parent, config) {
    const [left, top, right, bottom] = config[`AnalyzerWindow`];
    const [r, g, b] = config[`AnalyzerColor`];
    const color = `${r},${g},${b}`;
    const node = new XmlElement("vis", {
      id: `normal-vis`,
      ColorBand1: color,
      ColorBand2: color,
      ColorBand3: color,
      ColorBand4: color,
      ColorBand5: color,
      ColorBand6: color,
      ColorBand7: color,
      ColorBand8: color,
      ColorBand9: color,
      ColorBand10: color,
      ColorBand11: color,
      ColorBand12: color,
      ColorBand13: color,
      ColorBand14: color,
      ColorBand15: color,
      ColorBand16: color,
      ColorBandPeak: color,
      x: `${left}`,
      y: `${top - 1}`,
      w: `${right - left}`,
      h: `${bottom - top + 2}`
    });
    await this.newGui(Vis, node, parent);
  }
  async loadVolume(config, parent) {
    if (config["VolumeControlType"] == "BMP") {
      return await this.loadVolumeBmp(config, parent);
    }
  }
  async loadVolumeBmp(config, parent) {
    const prefix = config["prefix"];
    const [left, top, right, bottom] = config[`VolumeControlButton`];
    await this.loadBitmap(config["VolumeControlImage"], `volume-${prefix}-sprite`);
    await this.loadPlainBitmap(config["VolumeControlImagePosition"], `volume-${prefix}-map`, {
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`
    });
    const xsize = config["VolumeControlImageXSize"];
    const count = config["VolumeControlImageNb"];
    const node = new XmlElement("animatedLayer", {
      id: `${prefix}-volume-knob`,
      image: `volume-${prefix}-sprite`,
      mapimage: `volume-${prefix}-map`,
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`,
      framewidth: `${xsize}`,
      speed: `${1400 / count}`,
      start: `0`,
      action: "volume"
    });
    await this.newGui(DialKnob, node, parent);
  }
  async loadPitch(config, parent) {
    const rect = config[`PitchControlButton`];
    if (!rect)
      return;
    const prefix = config["prefix"];
    let [left, top, right, bottom] = rect;
    await this.loadBitmap(config["PitchControlImage"], `pitch-${prefix}-sprite`);
    await this.loadPlainBitmap(config["PitchControlImagePosition"], `pitch-${prefix}-map`, {
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`
    });
    const xsize = config["PitchControlImageXSize"];
    const count = config["PitchControlImageNb"];
    const node = new XmlElement("animatedLayer", {
      id: `${prefix}-Pitch-knob`,
      image: `pitch-${prefix}-sprite`,
      mapimage: `pitch-${prefix}-map`,
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`,
      framewidth: `${xsize}`,
      speed: `${2e3 / count}`,
      start: `0`,
      action: "Pitch"
    });
    await this.newGui(DialKnob, node, parent);
    [left, top, right, bottom] = config[`PitchText`];
    const tnode = new XmlElement("text", {
      id: `${prefix}-Pitch-text`,
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`,
      display: "custom",
      align: "left",
      color: "255,255,255"
    });
    const text = await this.text(tnode, parent);
    text.setDisplayHandler(PitchTextHandler);
  }
  async loadSeek(config, parent) {
    const prefix = config["prefix"];
    const [left, top, right, bottom] = config[`SeekRegion`];
    await this.loadPlainBitmap(config["SeekImage"], `seek-${prefix}-map`, {
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`
    });
    const node = new XmlElement("layer", {
      id: `${prefix}-seek`,
      mapimage: `seek-${prefix}-map`,
      frontimage: `${prefix}-BMP1`,
      x: `${left}`,
      y: `${top}`,
      w: `${right - left}`,
      h: `${bottom - top}`,
      action: "seek"
    });
    await this.newGui(FloodLevel, node, parent);
  }
  async loadEqualizer(config, parent) {
    let rect = config[`EqualizerWindow`];
    if (!rect)
      return;
    let [left, top, right, bottom, tootip, bandCount, xSpace] = rect;
    let node = new XmlElement("group", {
      id: `Equalizer`,
      x: `${left}`,
      y: `${top - 1}`,
      w: `${right - left}`,
      h: `${bottom - top}`
    });
    const group = await this.group(node, parent);
    const [xSize, frameCount, bg] = config[`EqualizerBmp`];
    this.loadPlainBitmap(bg, "equalizer-sprite");
    const [width, height] = [
      Math.round((right - left + 1) / bandCount),
      bottom - top + 1
    ];
    for (var i = 1; i <= bandCount; i++) {
      node = new XmlElement("bitmap", {
        id: `eq${i}`,
        image: "equalizer-sprite",
        x: `${(i - 1) * width}`,
        y: `${0}`,
        w: `${xSize}`,
        h: `${height}`,
        frameWidth: `${xSize}`,
        frameCount: `${frameCount}`,
        orientation: "vertical",
        action: `eq_band`,
        param: `${Math.min(i, 9)}`
      });
      const slider = await this.newGui(FlatSlider, node, group);
    }
    const prefix = config["prefix"];
    const loadButton = async (nick, action, invert = false) => {
      const button = await this.loadButton(nick, action, parent, config);
      button.setXmlAttr("activeImage", button._downimage);
      button.setXmlAttr("downImage", "");
      if (invert) {
        const base = `${prefix}-base`;
        const temp = button._activeimage || base;
        button.setXmlAttr("activeImage", button._image || base);
        button.setXmlAttr("image", temp);
      }
    };
    await this.loadButton("Equalizer", "EQ_TOGGLE", parent, config);
    await loadButton("EqualizerOn", "EQ_TOGGLE");
    await loadButton("EqualizerOff", "EQ_TOGGLE", true);
  }
}
KJofol_SkinEngine.canProcess = (filePath) => {
  return filePath.endsWith(".kjofol") || filePath.endsWith(".zip");
};
KJofol_SkinEngine.identifyByFile = (filePath) => {
  return ".rc";
};
KJofol_SkinEngine.priority = 3;
function parserRC(content) {
  const cfg = {};
  content = content.replace(/\r/g, "");
  const lines = content.split("\n");
  for (var line of lines) {
    if (line.startsWith("#"))
      continue;
    var words = line.replace(/  /, " ").split(" ");
    var first = words.shift();
    if (line.startsWith("About ")) {
      cfg["About"] = [...cfg["About"] || []].concat([words.join(" ")]);
    } else {
      let value;
      if (words.length == 1) {
        value = words[0];
      } else {
        value = words.map((v) => {
          const num = parseInt(v);
          return isNaN(num) ? v : num;
        });
      }
      cfg[first] = value;
    }
  }
  return cfg;
}
class PitchTextHandler extends DisplayHandler {
  constructor() {
    super(...arguments);
    this.setDisplayText = () => {
      const pitch = this._uiRoot.audio.getPlaybackRate();
      this._text.setDisplayValue(`${Math.round(pitch * 100)}`);
    };
  }
  init() {
    this._subscription = this._uiRoot.audio.on("playbackratechange", this.setDisplayText);
    this.setDisplayText();
  }
}
registerSkinEngine(KJofol_SkinEngine);
