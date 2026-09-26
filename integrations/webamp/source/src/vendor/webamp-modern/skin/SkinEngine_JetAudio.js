import parseXml, {XmlElement} from "../_snowpack/pkg/@rgrove/parse-xml.js";
import JskFileExtractor from "./jetAudioClasses/JskFileExtractor.js";
import {registerSkinEngine, SkinEngine} from "./SkinEngine.js";
export class JetAudioSkinEngine extends SkinEngine {
  constructor() {
    super(...arguments);
    this._alphaData = null;
  }
  getFileExtractor() {
    this._fe = new JskFileExtractor();
    return this._fe;
  }
  async parseSkin() {
    await this.loadKnowBitmaps();
    const container = await this.container(new XmlElement("container"));
    const xmlContent = await this.getMainJsc();
    const parsed = parseXml(xmlContent);
    await this.asyncTraverseChildren(parsed, container, this.traverseRoot);
  }
  async asyncTraverseChildren(node, parent, visit) {
    return await Promise.all(node.children.map((child) => {
      if (child instanceof XmlElement) {
        return visit(child, parent);
      }
    }));
  }
  async traverseChildren(node, parent = null, visit) {
    for (const child of node.children) {
      if (child instanceof XmlElement) {
        await visit(child, parent);
      }
    }
  }
  async traverseRoot(node, parent) {
    const tag = node.name.toLowerCase();
    switch (tag) {
      case "skin_description":
        return this.skininfo(node, parent);
      case "layout":
      case "main":
      case "toolbar":
        return this.layout(node, parent);
      case "skin":
      case "wrapper":
        return this.traverseChildren(node, parent, this.traverseRoot);
      default:
        console.warn(`Unhandled XML node type: ${node.name}`);
        return;
    }
  }
  async traverseComponent(node, parent) {
    const tag = node.name.toLowerCase();
    switch (tag) {
      case "skin_description":
        return this.skininfo(node, parent);
      case "layout":
      case "main":
      case "toolbar":
        return this.layout(node, parent);
      case "skin":
      case "wrapper":
        return this.traverseChildren(node, parent, this.traverseRoot);
      default:
        console.warn(`Unhandled XML node type: ${node.name}`);
        return;
    }
  }
  async newGroup(Type, node, parent) {
    const group = new Type(this._uiRoot);
    group.setXmlAttributes(node.attributes);
    await this.traverseChildren(node, group, this.traverseComponent);
    this.addToGroup(group, parent);
    return group;
  }
  async getMainJsc() {
    let layout = await this._uiRoot.getFileAsString("main.jsc");
    layout = layout.replace(/= *(\d+)/g, (match, num) => `="${num}"`);
    layout = layout.replace(/---/g, (tripledash) => `--`);
    layout = layout.replace(/\0/g, (tripledash) => ``);
    console.log(layout);
    return layout;
  }
  async loadKnowBitmaps() {
    for (const name of Object.keys(this._fe._toc)) {
      if (name == "main.jsc")
        continue;
      await this.bitmap(new XmlElement("bmp", {
        file: name,
        id: name
      }));
    }
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
}
JetAudioSkinEngine.canProcess = (filePath) => {
  return filePath.endsWith(".jsk");
};
JetAudioSkinEngine.identifyByFile = (filePath) => {
  return null;
};
JetAudioSkinEngine.priority = 4;
registerSkinEngine(JetAudioSkinEngine);
