import {XmlElement} from "../_snowpack/pkg/@rgrove/parse-xml.js";
import Parser from "../_snowpack/pkg/@rgrove/parse-xml/src/lib/Parser.js";
import {GROUP_PHASE, RESOURCE_PHASE} from "./SkinEngine_WAL.js";
import {registerSkinEngine, SkinEngine} from "./SkinEngine.js";
import ButtonElement from "./wmpClasses/ButtonElement.js";
import ButtonGroup from "./wmpClasses/ButtonGroup.js";
import ButtonZ from "./wmpClasses/Button.js";
import PlayListGuiZ from "./wmpClasses/PlayListGui.js";
import SliderZ from "./wmpClasses/Slider.js";
import SubView from "./wmpClasses/SubView.js";
import TextZ from "./wmpClasses/Text.js";
import Theme from "./wmpClasses/Theme.js";
import View from "./wmpClasses/View.js";
import VisZ from "./wmpClasses/Vis.js";
export default class WindowsMediaPlayer_SkinEngine extends SkinEngine {
  constructor() {
    super(...arguments);
    this._phase = 0;
    this._views = [];
  }
  async parseSkin() {
    console.log("RESOURCE_PHASE #################");
    this._phase = RESOURCE_PHASE;
    let includedXml = await this._uiRoot.getFileAsString(".wms");
    const parsed = this.parseXmlFragment(decodeWideChars(includedXml));
    await this.traverseChildren(parsed);
    await this._imageManager.ensureBitmapsLoaded();
    console.log("GROUP_PHASE #################");
    this._phase = GROUP_PHASE;
    await this.traverseChildren(parsed);
    this._setGlobalVar();
    await Promise.all(this._views.map(async (view) => await view.loadJsScripts()));
  }
  async newGroup(Type, node, parent) {
    const group = new Type(this._uiRoot);
    group.setXmlAttributes(node.attributes);
    await this.traverseChildren(node, group);
    this.addToGroup(group, parent);
    return group;
  }
  async traverseChildren(node, parent = null) {
    if (this._phase == RESOURCE_PHASE) {
      return await Promise.all(node.children.map((child) => {
        if (child instanceof XmlElement) {
          return this.traverseChild(child, parent);
        }
      }));
    } else {
      for (const child of node.children) {
        if (child instanceof XmlElement) {
          await this.traverseChild(child, parent);
        }
      }
    }
  }
  async traverseChild(node, parent) {
    const tag = node.name.toLowerCase();
    switch (tag) {
      case "theme":
        return this.theme(node, parent);
      case "view":
        return this.view(node, parent);
      case "subview":
        return this.subview(node, parent);
      case "effects":
        return this.visz(node, parent);
      case "button":
      case "mutebutton":
      case "shufflebutton":
      case "repeatbutton":
      case "playbutton":
      case "stopbutton":
      case "pausebutton":
      case "prevbutton":
      case "nextbutton":
        return this.button(node, parent);
      case "buttongroup":
        return this.buttongroup(node, parent);
      case "buttonelement":
      case "playelement":
      case "stopelement":
      case "pauselement":
      case "prevelement":
      case "nextelement":
        return this.buttonelement(node, parent);
      case "slider":
      case "volumeslider":
      case "balanceslider":
        return this.slider(node, parent);
      case "text":
        return this.textz(node, parent);
      case "playlist":
        return this.playlist(node, parent);
      case "player":
        return this.player(node, parent);
      case "video":
        return this.group(node, parent);
      case "wrapper":
        return this.traverseChildren(node, parent);
      default:
        console.warn(`Unhandled XML node type: ${node.name}`);
        return;
    }
  }
  async view(node, parent) {
    const container = new View(this._uiRoot);
    container.setXmlAttributes(node.attributes);
    this._uiRoot.addContainers(container);
    this._views.push(container);
    node.attributes.id = node.attributes.id + "_normal";
    node.attributes.allowzerosize = "1";
    await this.layout(node, container);
    return container;
  }
  async subview(node, parent) {
    await this.newGroup(SubView, node, parent);
  }
  async button(node, parent) {
    this._parseActionByTag(node);
    return await this.newGui(ButtonZ, node, parent);
  }
  async buttongroup(node, parent) {
    return await this.newGroup(ButtonGroup, node, parent);
  }
  async buttonelement(node, parent) {
    this._parseActionByTag(node);
    return await this.newGui(ButtonElement, node, parent);
  }
  _parseActionByTag(node) {
    const tag = node.name;
    let action;
    if (tag != "buttonelement") {
      if (tag.endsWith("element")) {
        action = tag.substring(0, tag.length - 7);
        node.attributes.action = action;
      } else if (tag.endsWith("button")) {
        action = tag.substring(0, tag.length - 6);
        if (action) {
          node.attributes.action = action;
        }
      }
      switch (action) {
        case "play":
          node.attributes.upToolTip = "Play";
          node.attributes.enabled = `wmpenabled:player.controls.${action}`;
          break;
        case "pause":
          node.attributes.upToolTip = "Pause";
          node.attributes.enabled = `wmpenabled:player.controls.${action}`;
          break;
        case "stop":
          node.attributes.upToolTip = "Stop";
          node.attributes.enabled = `wmpenabled:player.controls.${action}`;
          break;
      }
    }
  }
  async slider(node, parent) {
    const slider = await this.newGui(SliderZ, node, parent);
    switch (node.name.toLowerCase()) {
      case "volumeslider":
        slider.setXmlAttr("action", "volume");
        break;
      case "balanceslider":
        slider.setXmlAttr("action", "pan");
        break;
    }
  }
  async visz(node, parent) {
    return this.newGui(VisZ, node, parent);
  }
  async textz(node, parent) {
    return this.newGui(TextZ, node, parent);
  }
  async playlist(node, parent) {
    return this.newGui(PlayListGuiZ, node, parent);
  }
  async player(node, parent) {
    const theme = this._uiRoot.findContainer("theme");
    theme.getPlayer().setXmlAttributes(node.attributes);
  }
  async theme(node, parent) {
    if (this._phase == RESOURCE_PHASE) {
      this._uiRoot.setSkinInfo(node.attributes);
      return await this.parseAttributesAsImages(node);
    } else {
      const theme = new Theme(this._uiRoot);
      theme.setXmlAttr("id", "theme");
      this._uiRoot.addContainers(theme);
      await this.traverseChildren(node, parent);
    }
  }
  async parseAttributesAsImages(theme) {
    const transparentImages = [
      "background",
      "image",
      "thumb",
      "hoverimage",
      "downimage",
      "hoverdownimage",
      "disabledimage"
    ];
    const recursiveScanChildren = (mother) => {
      for (const element of mother.children) {
        if (element instanceof XmlElement) {
          this._lowercaseAttributes(element);
          for (const att of [
            "background",
            "image",
            "hoverimage",
            "downimage",
            "hoverdownimage",
            "disabledimage",
            "thumb",
            "mappingimage",
            "clippingimage"
          ]) {
            if (element.attributes[att]) {
              const bitmapId = element.attributes[att];
              const bitmap = {
                id: bitmapId,
                file: bitmapId
              };
              if (element.attributes.transparencycolor != null) {
                if (transparentImages.includes(att)) {
                  bitmap.transparentcolor = element.attributes.transparencycolor;
                }
              }
              console.log(`scan bitmap. att:'${att}' value:'${JSON.stringify(bitmap)}' @`, JSON.stringify(element.attributes));
              this.bitmap(new XmlElement("bitmap", bitmap));
            }
          }
          if (element.name == "subview" && element.attributes.transparencycolor) {
            const transparencyColor = element.attributes.transparencycolor;
            for (const subChild of element.children) {
              if (subChild instanceof XmlElement && !subChild.attributes.transparencycolor) {
                subChild.attributes.transparencycolor = transparencyColor;
              }
            }
          }
          recursiveScanChildren(element);
        }
      }
    };
    recursiveScanChildren(theme);
  }
  _lowercaseAttributes(element) {
    element.name = element.name.toLowerCase();
    for (const att of Object.keys(element.attributes)) {
      const lower = att.toLowerCase();
      if (att != lower && lower != "id") {
        element.attributes[lower] = element.attributes[att];
        delete element.attributes[att];
      }
    }
    const replacement = {
      thumbimage: "thumb",
      direction: "orientation",
      left: "x",
      top: "y",
      width: "w",
      height: "h",
      backgroundimage: "background",
      alphablend: "alpha"
    };
    const replacable = Object.keys(replacement);
    for (const att of Object.keys(element.attributes)) {
      if (replacable.includes(att)) {
        element.attributes[replacement[att]] = element.attributes[att];
        delete element.attributes[att];
      }
    }
  }
  parseXmlFragment(xml) {
    if (!xml.startsWith("<wrapper>")) {
      xml = `<wrapper>${xml}</wrapper>`;
    }
    let result;
    try {
      result = parseXml2(xml);
    } catch (error) {
      console.warn(error);
      console.log("e:", error.message);
      console.log("column:", error.column);
      console.log("exceprt:", error.excerpt);
      console.log("line:", error.line);
      console.log("pos:", error.pos);
      console.log(error.excerpt.substring(error.column, error.column + 100));
      console.log("full:", xml.substring(error.pos, error.pos + 100));
    }
    return result;
  }
  _setGlobalVar() {
    window["osPlaylistChanging"] = 1;
    window["osPlaylistLocating"] = 2;
    window["osPlaylistConnecting"] = 3;
    window["osPlaylistLoading"] = 4;
    window["osPlaylistOpening"] = 5;
    window["osPlaylistOpenNoMedia"] = 6;
    window["osPlaylistChanged"] = 7;
    window["osMediaChanging"] = 8;
    window["osMediaLocating"] = 9;
    window["osMediaConnecting"] = 10;
    window["osMediaLoading"] = 11;
    window["osMediaOpening"] = 12;
    window["osMediaOpen"] = 13;
    window["osBeginCodecAcquisition"] = 14;
    window["osEndCodecAcquisition"] = 15;
    window["osBeginLicenseAcquisition"] = 16;
    window["osEndLicenseAcquisition"] = 17;
    window["osBeginIndividualization"] = 18;
    window["osEndIndividualization"] = 19;
    window["osMediaWaiting"] = 20;
    window["osOpeningUnknownURL"] = 21;
  }
}
WindowsMediaPlayer_SkinEngine.canProcess = (filePath) => {
  return filePath.endsWith(".wmz") || filePath.endsWith(".zip");
};
WindowsMediaPlayer_SkinEngine.identifyByFile = (filePath) => {
  return ".wms";
};
WindowsMediaPlayer_SkinEngine.priority = 4;
registerSkinEngine(WindowsMediaPlayer_SkinEngine);
function decodeUTF16LE(binaryStr) {
  var cp = [];
  for (var i = 0; i < binaryStr.length; i += 2) {
    cp.push(binaryStr.charCodeAt(i) | binaryStr.charCodeAt(i + 1) << 8);
  }
  var result = String.fromCharCode.apply(String, cp);
  console.log("res:", result);
  return result;
}
function utf8Encode(unicodeString) {
  if (typeof unicodeString != "string")
    throw new TypeError("parameter ‘unicodeString’ is not a string");
  const utf8String = unicodeString.replace(/[\u0080-\u07ff]/g, function(c) {
    var cc = c.charCodeAt(0);
    return String.fromCharCode(192 | cc >> 6, 128 | cc & 63);
  }).replace(/[\u0800-\uffff]/g, function(c) {
    var cc = c.charCodeAt(0);
    return String.fromCharCode(224 | cc >> 12, 128 | cc >> 6 & 63, 128 | cc & 63);
  });
  console.log("res:", utf8String);
  return utf8String;
}
class Parser2 extends Parser {
  error(message) {
    if (message.startsWith("Duplicate attribute:")) {
      return;
    }
    super.error(message);
  }
}
function parseXml2(xml, options = void 0) {
  return new Parser2(xml, options).document;
}
export function decodeWideChars(binaryStr) {
  if (binaryStr.charCodeAt(0) < 255) {
    return binaryStr;
  }
  var cp = "";
  for (var i = 1; i < binaryStr.length; i += 2) {
    cp += binaryStr[i];
  }
  var result = cp;
  return result;
}
