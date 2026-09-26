import parseXml, {XmlDocument, XmlElement} from "../_snowpack/pkg/@rgrove/parse-xml.js";
import {assert, assume} from "../utils.js";
import Bitmap from "./Bitmap.js";
import Layout from "./makiClasses/Layout.js";
import Group from "./makiClasses/Group.js";
import Container from "./makiClasses/Container.js";
import Layer from "./makiClasses/Layer.js";
import Slider from "./makiClasses/Slider.js";
import Button from "./makiClasses/Button.js";
import Text from "./makiClasses/Text.js";
import Menu from "./makiClasses/Menu.js";
import Frame from "./makiClasses/Frame.js";
import Status from "./makiClasses/Status.js";
import {parse as parseMaki} from "../maki/parser.js";
import SystemObject from "./makiClasses/SystemObject.js";
import ToggleButton from "./makiClasses/ToggleButton.js";
import TrueTypeFont from "./TrueTypeFont.js";
import GuiObj from "./makiClasses/GuiObj.js";
import AnimatedLayer from "./makiClasses/AnimatedLayer.js";
import Vis from "./makiClasses/Vis.js";
import BitmapFont from "./BitmapFont.js";
import Color from "./Color.js";
import GammaGroup from "./GammaGroup.js";
import ColorThemesList from "./ColorThemesList.js";
import AlbumArt from "./makiClasses/AlbumArt.js";
import WindowHolder from "./makiClasses/WindowHolder.js";
import Grid from "./makiClasses/Grid.js";
import ProgressGrid from "./makiClasses/ProgressGrid.js";
import WasabiTitle from "./makiClasses/WasabiTitle.js";
import ComponentBucket from "./makiClasses/ComponentBucket.js";
import GroupXFade from "./makiClasses/GroupXFade.js";
import WasabiButton from "./makiClasses/WasabiButton.js";
import PlayListGui from "./makiClasses/PlayListGui.js";
import XuiElement from "./makiClasses/XuiElement.js";
import NStateButton from "./makiClasses/NStateButton.js";
import EqVis from "./makiClasses/EqVis.js";
import Images from "./makiClasses/Images.js";
import {registerSkinEngine, SkinEngine} from "./SkinEngine.js";
import {PathFileExtractor} from "./FileExtractor.js";
import Avs from "./makiClasses/Avs.js";
export const RESOURCE_PHASE = 1;
const ResourcesTag = [
  "color",
  "bitmap",
  "bitmapfont",
  "truetypefont",
  "skininfo",
  "accelerators"
];
export const GROUP_PHASE = 2;
function substituteSkinTokens(xml) {
  return xml.replace(/@HAVE_LIBRARY@/g, "1");
}
export default class SkinEngineWAL extends SkinEngine {
  constructor() {
    super(...arguments);
    this._path = [];
    this._includedXml = {};
    this._scripts = {};
    this._phase = 0;
    this._res = {
      bitmaps: {
        "studio.button": false,
        "studio.button.pressed": false,
        "studio.scrollbar.vertical.background": false,
        "studio.scrollbar.vertical.left": false,
        "studio.scrollbar.vertical.right": false,
        "studio.scrollbar.vertical.button": false,
        "studio.scrollbar.horizontal.background": false,
        "studio.scrollbar.horizontal.left": false,
        "studio.scrollbar.horizontal.right": false,
        "studio.scrollbar.horizontal.button": false
      },
      colors: {}
    };
  }
  async prepareArial() {
    const node = new XmlElement("truetypefont", {
      id: "Arial",
      family: "Arial, 'Liberation Sans', 'DejaVu Sans'"
    });
    await this.trueTypeFont(node, null);
  }
  async parseSkin() {
    console.log("RESOURCE_PHASE #################");
    this._phase = RESOURCE_PHASE;
    await this.prepareArial();
    this.prepareXuiTags();
    const includedXml = await this._uiRoot.getFileAsString("skin.xml");
    const parsed = parseXml(includedXml);
    await this.traverseChildren(parsed);
    await this._loadBitmaps();
    console.log("GROUP_PHASE #################");
    this._phase = GROUP_PHASE;
    await this.traverseChildren(parsed);
    console.log("BUCKET_PHASE #################");
    await this.rebuildBuckets();
  }
  prepareXuiTags() {
    this._uiRoot.addXuitagGroupDefId("wasabi:mainframe:nostatus", "wasabi.mainframe.nostatusbar");
    this._uiRoot.addXuitagGroupDefId("wasabi:medialibraryframe:nostatus", "wasabi.medialibraryframe.nostatusbar");
    this._uiRoot.addXuitagGroupDefId("wasabi:playlistframe:nostatus", "wasabi.playlistframe.nostatusbar");
    this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:modal", "wasabi.standardframe.modal");
    this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:nostatus", "wasabi.standardframe.nostatusbar");
    this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:static", "wasabi.standardframe.static");
    this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:status", "wasabi.standardframe.statusbar");
    this._uiRoot.addXuitagGroupDefId("wasabi:visframe:nostatus", "wasabi.visframe.nostatusbar");
  }
  async _loadBitmaps() {
    await this._solveMissingBitmaps();
    await this._imageManager.ensureBitmapsLoaded();
  }
  async parseFromUrl(url) {
    const response = await fetch(url);
    const xml = await response.text();
    const parsed = this.parseXmlFragment(xml);
    await this.traverseChildren(parsed);
  }
  _scanRes(node) {
    if (node.attributes.background) {
      this._res.bitmaps[node.attributes.background.toLowerCase()] = false;
    }
  }
  async _solveMissingBitmaps() {
    for (const id of Object.keys(this._uiRoot.getBitmaps())) {
      this._res.bitmaps[id] = true;
    }
  }
  async traverseChildren(node, parent = null) {
    if (this._phase == RESOURCE_PHASE) {
      return await Promise.all(node.children.map((child) => {
        if (child instanceof XmlElement) {
          this._scanRes(child);
          return this.traverseChild(child, parent);
        }
      }));
    } else {
      for (const child of node.children) {
        if (child instanceof XmlElement) {
          this._scanRes(child);
          await this.traverseChild(child, parent);
        }
      }
    }
  }
  async traverseChild(node, parent) {
    const tag = node.name.toLowerCase();
    switch (tag) {
      case "albumart":
        return this.albumart(node, parent);
      case "wasabixml":
        return this.wasabiXml(node, parent);
      case "winampabstractionlayer":
        return this.winampAbstractionLayer(node, parent);
      case "include":
        return this.include(node, parent);
      case "skininfo":
        return this.skininfo(node, parent);
      case "elements":
        return this.elements(node, parent);
      case "bitmap":
        return this.bitmap(node);
      case "bitmapfont":
        return await this.bitmapFont(node);
      case "color":
        return await this.color(node, parent);
      case "groupdef":
        return this.groupdef(node, parent);
      case "animatedlayer":
        return this.animatedLayer(node, parent);
      case "images":
        return this.images(node, parent);
      case "layer":
        return this.layer(node, parent);
      case "container":
        return this.container(node);
      case "layoutstatus":
        return this.layoutStatus(node, parent);
      case "grid":
        return this.grid(node, parent);
      case "progressgrid":
        return this.progressGrid(node, parent);
      case "button":
        return this.button(node, parent);
      case "togglebutton":
        return this.toggleButton(node, parent);
      case "nstatesbutton":
        return this.nStateButton(node, parent);
      case "rect":
      case "group":
        return this.group(node, parent);
      case "groupxfade":
        return this.groupXFade(node, parent);
      case "layout":
        return this.layout(node, parent);
      case "windowholder":
        return this.windowholder(node, parent);
      case "component":
        return this.component(node, parent);
      case "gammaset":
        return this.gammaset(node, parent);
      case "gammagroup":
        return this.gammagroup(node, parent);
      case "slider":
        return this.slider(node, parent);
      case "script":
        return this.script(node, parent);
      case "scripts":
        return this.scripts(node, parent);
      case "text":
        return this.text(node, parent);
      case "menu":
        return this.menu(node, parent);
      case "wasabi:frame":
      case "frame":
        return this.frame(node, parent);
      case "songticker":
        return this.songticker(node, parent);
      case "hideobject":
      case "sendparams":
        return this.sendparams(node, parent);
      case "wasabi:titlebar":
        return this.wasabiTitleBar(node, parent);
      case "wasabi:button":
        return this.wasabiButton(node, parent);
      case "truetypefont":
        return this.trueTypeFont(node, parent);
      case "eqvis":
        return this.eqvis(node, parent);
      case "colorthemes:mgr":
      case "colorthemes:list":
        return this.colorThemesList(node, parent);
      case "status":
        return this.status(node, parent);
      case "elementalias":
        return this.elementalias(node);
      case "componentbucket":
        return this.componentBucket(node, parent);
      case "playlisteditor":
      case "wasabi:tabsheet":
      case "snappoint":
      case "accelerators":
      case "browser":
      case "syscmds":
        return;
      case "vis":
        return this.vis(node, parent);
      case "wrapper":
        return this.traverseChildren(node, parent);
      default:
        if (this._uiRoot.getXuiElement(tag)) {
          return this.dynamicXuiElement(node, parent);
        } else if (this._predefinedXuiNode(tag)) {
          return this.dynamicXuiElement(node, parent);
        }
        console.warn(`Unhandled XML node type: ${node.name}`);
        return;
    }
  }
  async _predefinedXuiNode(tag) {
    let xmlRootPath = `${this._uiRoot.getAssetsBase()}freeform/xml/`;
    let xmlFilePath = null;
    switch (tag) {
      case "wasabi:text":
        xmlRootPath += "wasabi/";
        xmlFilePath = "xml/xui/text/text.xml";
        break;
      case "wasabi:standardframe:status":
      case "wasabi:standardframe:nostatus":
      case "wasabi:standardframe:modal":
      case "wasabi:standardframe:static":
        xmlRootPath += "wasabi/";
        xmlFilePath = "xml/xui/standardframe/standardframe.xml";
        break;
      default:
        return false;
    }
    console.log("handling _predefinedXuiNode", tag);
    const oldZip = this._uiRoot.getZip();
    const oldSkinDir = this._uiRoot.getSkinDir();
    this._uiRoot.setZip(null);
    this._uiRoot.setSkinDir(xmlRootPath);
    const node = new XmlElement("include", {file: xmlFilePath});
    await this.include(node, null);
    this._uiRoot.setSkinDir(oldSkinDir);
    this._uiRoot.setZip(oldZip);
    return true;
  }
  addToGroup(obj, parent) {
    try {
      parent.addChild(obj);
    } catch (err) {
      console.warn("addToGroup failed. child:", obj, "pareng:", parent);
    }
  }
  async newGui(Type, node, parent) {
    const gui = new Type(this._uiRoot);
    gui.setXmlAttributes(node.attributes);
    this.addToGroup(gui, parent);
    return gui;
  }
  async newGroup(Type, node, parent) {
    const group = new Type(this._uiRoot);
    await this.maybeApplyGroupDef(group, node);
    group.setXmlAttributes(node.attributes);
    await this.traverseChildren(node, group);
    this.addToGroup(group, parent);
    if (node.attributes.instanceid)
      group.setxmlparam("id", node.attributes.instanceid);
    return group;
  }
  async wasabiXml(node, parent) {
    await this.traverseChildren(node, parent);
  }
  async winampAbstractionLayer(node, parent) {
    await this.traverseChildren(node, parent);
  }
  async elements(node, parent) {
    await this.traverseChildren(node, parent);
  }
  async group(node, parent) {
    return await this.newGroup(Group, node, parent);
  }
  async groupXFade(node, parent) {
    const xFade = await this.newGroup(GroupXFade, node, parent);
    this._uiRoot.addXFade(xFade);
  }
  async componentBucket(node, parent) {
    const bucket = await this.newGroup(ComponentBucket, node, parent);
    this._uiRoot.addComponentBucket(bucket);
  }
  async _loadThinger(bucket) {
    const ifileExtractor = this._uiRoot._fileExtractor;
    const fileExtractor = new PathFileExtractor();
    this._uiRoot.setFileExtractor(fileExtractor);
  }
  async dynamicXuiElement(node, parent) {
    const xuitag = node.name;
    const xuiEl = this._uiRoot.getXuiElement(xuitag);
    if (xuiEl) {
      const xuiFrame = new XmlElement("dummy", {id: xuiEl.attributes.id});
      const Element = await this.newGroup(XuiElement, xuiFrame, parent);
      Element.setXmlAttributes(node.attributes);
      if (node.attributes.content) {
        const content = await this.group(new XmlElement("group", {
          id: node.attributes.content,
          w: "0",
          h: "0",
          relatw: "1",
          relath: "1"
        }), Element);
        Element.addChild(content);
      }
    }
  }
  async bitmap(node) {
    assume(node.children.length === 0, "Unexpected children in <bitmap> XML node.");
    const bitmap = new Bitmap();
    bitmap.setXmlAttributes(node.attributes);
    this._uiRoot.addBitmap(bitmap);
    this._res.bitmaps[node.attributes.id] = true;
    await bitmap.ensureImageLoaded(this._imageManager);
    return bitmap;
  }
  async bitmapFont(node) {
    assume(node.children.length === 0, "Unexpected children in <bitmapFont> XML node.");
    const font = new BitmapFont(this._uiRoot);
    font.setXmlAttributes(node.attributes);
    const externalBitmap = this._isExternalBitmapFont(font);
    if (externalBitmap) {
      font.setExternalBitmap(true);
    } else {
    }
    this._uiRoot.addFont(font);
    return font;
  }
  _isExternalBitmapFont(font) {
    return font._file.indexOf("/") < 0;
  }
  async text(node, parent) {
    return this.newGui(Text, node, parent);
  }
  async menu(node, parent) {
    return this.newGui(Menu, node, parent);
  }
  async frame(node, parent) {
    const frame = await this.newGui(Frame, node, parent);
    let i = 0;
    for (const direction of ["left", "top", "right", "bottom"]) {
      const group_id = node.attributes[direction];
      if (group_id != null) {
        const pair = await this.group(new XmlElement("group", {
          id: group_id
        }), frame);
        i++;
      }
    }
    return frame;
  }
  async songticker(node, parent) {
    const text = await this.text(node, parent);
    text.setxmlparam("display", "songtitle");
    text.setxmlparam("ticker", "1");
    return text;
  }
  async wasabiTitleBar(node, parent) {
    const group = await this.newGroup(WasabiTitle, node, parent);
    let text = null;
    const xuitag = node.name;
    const xuiEl = this._uiRoot.getXuiElement(xuitag);
    if (xuiEl && node.attributes.id != xuiEl.attributes.id) {
      const xuiFrame = new XmlElement("groupdev", {id: xuiEl.attributes.id});
      await this.maybeApplyGroupDef(group, xuiFrame);
      text = group.findobject(xuiEl.attributes.embed_xui);
    } else {
      text = group.findobject("window.titlebar.title");
    }
    if (text) {
      text.setxmlparam("text", ":componentname");
    }
    return text;
  }
  async script(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <script> XML node.");
    let {file, id, param} = node.attributes;
    assert(file != null, "Script element missing `file` attribute");
    if (file.startsWith("../Winamp Modern/")) {
      file = file.replace("../Winamp Modern/", "");
      node.attributes.file = file;
    }
    let maki = this._scripts[file];
    if (!maki) {
      this._scripts[file] = true;
      const scriptContents = await this._uiRoot.getFileAsBytes(file);
      assert(scriptContents != null, `ScriptFile file not found at path ${file}`);
      this._scripts[file] = scriptContents;
      return;
    }
    if (this._phase == RESOURCE_PHASE) {
      return;
    }
    const maki_id = `${file} (id=${id || "''"})`;
    console.log("parsing.maki:", maki_id);
    const parsedScript = maki == true ? this._scripts[file] : parseMaki(maki, maki_id);
    const systemObj = new SystemObject(this._uiRoot, parsedScript, param, maki_id);
    if (parent instanceof Group) {
      parent.addSystemObject(systemObj);
    } else {
      console.log(">>ScriptLoad at non group: ", `@${file}`, typeof parent);
      this._uiRoot.addSystemObject(systemObj);
    }
  }
  async scripts(node, parent) {
    await this.traverseChildren(node, parent);
  }
  async sendparams(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <sendparams> XML node.");
    if (parent instanceof GuiObj) {
      parent._metaCommands.push(node);
    }
  }
  async button(node, parent) {
    return await this.newGui(Button, node, parent);
  }
  async wasabiButton(node, parent) {
    this._res.bitmaps["studio.button"] = false;
    this._res.bitmaps["studio.button.pressed"] = false;
    this._res.bitmaps["studio.button.upperLeft"] = false;
    this._res.bitmaps["studio.button.top"] = false;
    this._res.bitmaps["studio.button.upperRight"] = false;
    this._res.bitmaps["studio.button.left"] = false;
    this._res.bitmaps["studio.button.middle"] = false;
    this._res.bitmaps["studio.button.right"] = false;
    this._res.bitmaps["studio.button.lowerLeft"] = false;
    this._res.bitmaps["studio.button.bottom"] = false;
    this._res.bitmaps["studio.button.lowerRight"] = false;
    this._res.bitmaps["studio.button.pressed.upperLeft"] = false;
    this._res.bitmaps["studio.button.pressed.top"] = false;
    this._res.bitmaps["studio.button.pressed.upperRight"] = false;
    this._res.bitmaps["studio.button.pressed.left"] = false;
    this._res.bitmaps["studio.button.pressed.middle"] = false;
    this._res.bitmaps["studio.button.pressed.right"] = false;
    this._res.bitmaps["studio.button.pressed.lowerLeft"] = false;
    this._res.bitmaps["studio.button.pressed.bottom"] = false;
    this._res.bitmaps["studio.button.pressed.lowerRight"] = false;
    await this.buildWasabiButtonFace();
    return this.newGui(WasabiButton, node, parent);
  }
  async buildWasabiButtonFace() {
    const face = this._uiRoot.getBitmap("studio.button");
    if (!face) {
      let upperLeft = this._uiRoot.getBitmap("studio.button.upperLeft");
      if (upperLeft) {
        let bottomRight = this._uiRoot.getBitmap("studio.button.lowerRight");
        let dict = {
          id: "studio.button",
          file: upperLeft.getFile(),
          x: String(upperLeft.getLeft()),
          y: String(upperLeft.getTop()),
          w: String(bottomRight.getLeft() - upperLeft.getLeft() + bottomRight.getWidth()),
          h: String(bottomRight.getTop() - upperLeft.getTop() + bottomRight.getHeight())
        };
        const btnFace = new XmlElement("bitmap", {...dict});
        await this.bitmap(btnFace);
        upperLeft = this._uiRoot.getBitmap("studio.button.pressed.upperLeft");
        bottomRight = this._uiRoot.getBitmap("studio.button.pressed.lowerRight");
        dict = {
          id: "studio.button.pressed",
          file: upperLeft.getFile(),
          x: String(upperLeft.getLeft()),
          y: String(upperLeft.getTop()),
          w: String(bottomRight.getLeft() - upperLeft.getLeft() + bottomRight.getWidth()),
          h: String(bottomRight.getTop() - upperLeft.getTop() + bottomRight.getHeight())
        };
        const btnPressedFace = new XmlElement("bitmap", {...dict});
        await this.bitmap(btnPressedFace);
      } else {
        if (!this._uiRoot.hasBitmapFilepath("window/window-elements.png"))
          return;
        let dict = {
          id: "studio.button",
          file: "window/window-elements.png",
          x: "1",
          y: "135",
          w: "31",
          h: "31"
        };
        const btnFace = new XmlElement("bitmap", {...dict});
        await this.bitmap(btnFace);
        dict = {
          id: "studio.button.pressed",
          file: "window/window-elements.png",
          x: "67",
          y: "135",
          w: "31",
          h: "31"
        };
        const btnPressedFace = new XmlElement("bitmap", {...dict});
        await this.bitmap(btnPressedFace);
      }
      await this._imageManager.ensureBitmapsLoaded();
    }
  }
  async toggleButton(node, parent) {
    return this.newGui(ToggleButton, node, parent);
  }
  async nStateButton(node, parent) {
    return this.newGui(NStateButton, node, parent);
  }
  async color(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <color> XML node.");
    const color = new Color();
    color.setXmlAttributes(node.attributes);
    this._uiRoot.addColor(color);
  }
  async elementalias(node) {
    assume(node.children.length === 0, "Unexpected children in <elementalias> XML node.");
    this._uiRoot.addAlias(node.attributes.id, node.attributes.target);
  }
  async slider(node, parent) {
    return this.newGui(Slider, node, parent);
  }
  async groupdef(node, parent) {
    this._uiRoot.addGroupDef(node);
    if (node.attributes.windowtype) {
      await this.appendToBucket(node);
    }
  }
  async appendToBucket(groupDef) {
    const windowType = groupDef.attributes.windowtype;
    groupDef.attributes.attached = "0";
    this._uiRoot.addBucketEntry(windowType, groupDef);
  }
  async rebuildBuckets() {
    for (const bucket of this._uiRoot._buckets) {
      const wndType = bucket._wndType;
      console.log(`rebuild Bucket "${wndType}"`, bucket);
      for (const entry of this._uiRoot.getBucketEntries(wndType)) {
        const dummyNode = new XmlElement("dummy", {
          id: entry.attributes.id
        });
        await this.group(dummyNode, bucket);
      }
    }
  }
  async rebuildBuckets0() {
    for (const [wndType, bucket] of Object.entries(this._uiRoot._buckets)) {
      console.log(`rebuild Bucket "${wndType}"`, bucket);
      for (const entry of this._uiRoot.getBucketEntries(wndType)) {
        if (entry.attributes.attached == "0") {
          const dummyNode = new XmlElement("dummy", {
            id: entry.attributes.id
          });
          await this.group(dummyNode, bucket);
        }
      }
    }
  }
  async albumart(node, parent) {
    return this.newGui(AlbumArt, node, parent);
  }
  async layer(node, parent) {
    return this.newGui(Layer, node, parent);
  }
  async grid(node, parent) {
    return this.newGui(Grid, node, parent);
  }
  async progressGrid(node, parent) {
    return this.newGui(ProgressGrid, node, parent);
  }
  async animatedLayer(node, parent) {
    return this.newGui(AnimatedLayer, node, parent);
  }
  async images(node, parent) {
    return this.newGui(Images, node, parent);
  }
  async maybeApplyGroupDef(group, node) {
    const id = node.attributes.id;
    await this.maybeApplyGroupDefId(group, id);
  }
  async maybeApplyGroupDefId(group, groupdef_id) {
    const groupDef = this._uiRoot.getGroupDef(groupdef_id);
    if (groupDef != null) {
      group.setXmlAttributes(groupDef.attributes);
      if (groupDef.attributes.inherit_group) {
        await this.maybeApplyGroupDefId(group, groupDef.attributes.inherit_group);
      }
      await this.traverseChildren(groupDef, group);
    }
  }
  async layout(node, parent) {
    return this.newGroup(Layout, node, parent);
  }
  async gammaset(node, parent) {
    const gammaSet = [];
    await this.traverseChildren(node, gammaSet);
    this._uiRoot.addGammaSet(node.attributes.id, gammaSet);
  }
  async gammagroup(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <gammagroup> XML node.");
    const gammaGroup = new GammaGroup();
    gammaGroup.setXmlAttributes(node.attributes);
    parent.push(gammaGroup);
  }
  async component(node, parent) {
    const guid = node.attributes.param ?? node.attributes.hold ?? "";
    const id = this._uiRoot.guid2alias(guid);
    switch (id) {
      case "vis":
        return this.newGui(Avs, node, parent);
        break;
    }
    if (id == "pl") {
      await this.buildWasabiButtonFace();
      return this.newGui(PlayListGui, node, parent);
    }
    await this.traverseChildren(node, parent);
  }
  async windowholder(node, parent) {
    const frame = await this.newGroup(WindowHolder, node, parent);
    const hold = node.attributes.hold;
    if (hold && hold.toLowerCase() == "guid:{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}") {
      await this.buildWasabiButtonFace();
      const node2 = new XmlElement("component", {
        fitparent: "1"
      });
      await this.newGui(PlayListGui, node2, frame);
    }
    return frame;
  }
  async container(node) {
    const container = new Container(this._uiRoot);
    container.setXmlAttributes(node.attributes);
    this._uiRoot.addContainers(container);
    await this.traverseChildren(node, container);
    return container;
  }
  async colorThemesList(node, parent) {
    this.buildWasabiScrollbarDimension();
    return this.newGui(ColorThemesList, node, parent);
  }
  buildWasabiScrollbarDimension() {
    this._uiRoot.addWidth("vscrollbar-width", "wasabi.scrollbar.vertical.left");
    this._uiRoot.addHeight("vscrollbar-btn-height", "wasabi.scrollbar.vertical.left");
    this._uiRoot.addHeight("vscrollbar-thumb-height", "wasabi.scrollbar.vertical.button");
    this._uiRoot.addHeight("vscrollbar-thumb-height2", "studio.scrollbar.vertical.button");
    this._uiRoot.addHeight("hscrollbar-height", "wasabi.scrollbar.horizontal.left");
    this._uiRoot.addWidth("hscrollbar-btn-width", "wasabi.scrollbar.horizontal.left");
    this._uiRoot.addWidth("hscrollbar-thumb-width", "wasabi.scrollbar.horizontal.button");
    this._uiRoot.addWidth("hscrollbar-thumb-width2", "studio.scrollbar.horizontal.button");
  }
  async layoutStatus(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <layoutStatus> XML node.");
  }
  async xuiElement(node, parent) {
    assume(node.children.length === 0, "Unexpected children in XUI XML node.");
  }
  async status(node, parent) {
    return this.newGui(Status, node, parent);
  }
  async eqvis(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <eqvis> XML node.");
    return await this.newGui(EqVis, node, parent);
  }
  async vis(node, parent) {
    return this.newGui(Vis, node, parent);
  }
  async trueTypeFont(node, parent) {
    assume(node.children.length === 0, "Unexpected children in <truetypefont> XML node.");
    const font = new TrueTypeFont();
    font.setXmlAttributes(node.attributes);
    await font.ensureFontLoaded(this._imageManager);
    this._uiRoot.addFont(font);
  }
  async include(node, parent) {
    const {file, parent_path} = node.attributes;
    assert(file != null, "Include element missing `file` attribute");
    const promises = [];
    const includes = [];
    let savedDocument = this._includedXml[file];
    if (!savedDocument) {
      this._includedXml[file] = true;
      const parent_dir = parent_path ? parent_path.split("/") : [];
      const directories = file.replace("@DEFAULTSKINPATH@", "").split("/");
      const fileName = directories.pop();
      const path = [...parent_dir, ...directories, fileName].join("/");
      let includedXml;
      try {
        includedXml = await this._uiRoot.getFileAsString(path);
      } catch (err) {
        console.warn(`botFailed to load: ${path}. par:${parent_path}`);
      }
      if (includedXml == null) {
        console.warn(`Zip file not found: ${path} out of: `);
        return;
      }
      const current_dir = [...parent_dir, ...directories].join("/");
      var self = this;
      const recursiveScanChildren = (mother) => {
        var nonGroupDefs = [];
        for (const element of mother.children) {
          if (element instanceof XmlElement) {
            const lower = element.name.toLowerCase();
            if (lower == "groupdef") {
              recursiveScanChildren(element);
              self.groupdef(element, null);
              continue;
            } else if (ResourcesTag.indexOf(lower) >= 0) {
              promises.push(self.traverseChild(element, parent));
              continue;
            } else if (lower == "script") {
              promises.push(self.script(element, parent));
            } else if (lower == "include") {
              element.attributes.parent_path = current_dir;
              element.attributes["parent_path"] = current_dir;
              includes.push(element);
            }
            recursiveScanChildren(element);
            nonGroupDefs.push(element);
          }
        }
        mother.children.splice(0, mother.children.length, ...nonGroupDefs);
      };
      savedDocument = this.parseXmlFragment(includedXml);
      recursiveScanChildren(savedDocument);
      this._includedXml[file] = savedDocument;
      for (const element of includes) {
        promises.push(self.include(element, parent));
      }
      return Promise.all(promises);
    }
    if (this._phase == RESOURCE_PHASE) {
      return;
    }
    if (savedDocument instanceof XmlElement || savedDocument instanceof XmlDocument) {
      await this.traverseChildren(savedDocument, parent);
    }
  }
  async scanIncludes(node, parent) {
    return await Promise.all(node.children.map((child) => {
      if (child instanceof XmlElement && child.name.toLowerCase() == "include") {
        return this.include(child, parent);
      }
    }));
  }
  skininfo(node, parent) {
    const skinInfo = {};
    for (const child of node.children) {
      if (child instanceof XmlElement) {
        const tag = child.name.toLowerCase();
        skinInfo[tag] = child.text;
      }
    }
    this._uiRoot.setSkinInfo(skinInfo);
  }
  parseXmlFragment(xml) {
    return parseXml(`<wrapper>${substituteSkinTokens(xml)}</wrapper>`);
  }
}
SkinEngineWAL.canProcess = (filePath) => {
  return filePath.endsWith(".wal") || filePath.endsWith(".zip") || filePath.endsWith("/");
};
SkinEngineWAL.identifyByFile = (filePath) => {
  return "skin.xml";
};
SkinEngineWAL.priority = 1;
registerSkinEngine(SkinEngineWAL);
