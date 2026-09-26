import Bitmap from "./Bitmap.js";
import BitmapFont from "./BitmapFont.js";
import AnimatedLayer from "./makiClasses/AnimatedLayer.js";
import Button from "./makiClasses/Button.js";
import Container from "./makiClasses/Container.js";
import Group from "./makiClasses/Group.js";
import Layer from "./makiClasses/Layer.js";
import Layout from "./makiClasses/Layout.js";
import Text from "./makiClasses/Text.js";
export class SkinEngine {
  constructor(uiRoot) {
    this._uiRoot = uiRoot;
    this._imageManager = uiRoot.getImageManager();
  }
  getFileExtractor() {
    return null;
  }
  async buildUI() {
    const uiRoot = this._uiRoot;
    this._uiRoot.logMessage("Parsing XML and initializing images...");
    await this.parseSkin();
    uiRoot.loadTrueTypeFonts();
    uiRoot.enableDefaultGammaSet();
    uiRoot.logMessage("Rendering skin for the first time...");
    uiRoot.draw();
    uiRoot.init();
    uiRoot.logMessage("");
  }
  async parseSkin() {
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
    if (parent != null)
      this.addToGroup(gui, parent);
    return gui;
  }
  async newGroup(Type, node, parent) {
    return await this.newGui(Type, node, parent);
  }
  async bitmap(node) {
    const bitmap = new Bitmap();
    bitmap.setXmlAttributes(node.attributes);
    this._uiRoot.addBitmap(bitmap);
    await bitmap.ensureImageLoaded(this._imageManager);
    return bitmap;
  }
  async bitmapFont(node) {
    const font = new BitmapFont(this._uiRoot);
    font.setXmlAttributes(node.attributes);
    this._uiRoot.addFont(font);
    await font.ensureImageLoaded(this._imageManager);
    return font;
  }
  async text(node, parent) {
    return this.newGui(Text, node, parent);
  }
  async button(node, parent) {
    return await this.newGui(Button, node, parent);
  }
  async animatedLayer(node, parent) {
    return this.newGui(AnimatedLayer, node, parent);
  }
  async layer(node, parent) {
    return this.newGui(Layer, node, parent);
  }
  async group(node, parent) {
    return await this.newGroup(Group, node, parent);
  }
  async layout(node, parent) {
    return this.newGroup(Layout, node, parent);
  }
  async container(node) {
    const container = new Container(this._uiRoot);
    container.setXmlAttributes(node.attributes);
    this._uiRoot.addContainers(container);
    return container;
  }
}
SkinEngine.canProcess = (filePath) => {
  return false;
};
SkinEngine.identifyByFile = (filePath) => {
  return "skin.xml";
};
SkinEngine.priority = 100;
const SKIN_ENGINES = [];
export const registerSkinEngine = (Engine) => {
  SKIN_ENGINES.push(Engine);
};
export async function getSkinEngineClass(filePath) {
  const result = [];
  SKIN_ENGINES.sort((a, b) => {
    return a.priority - b.priority;
  });
  if (filePath.endsWith("/")) {
    for (const Engine of SKIN_ENGINES) {
      const aFileName = Engine.identifyByFile(filePath);
      if (aFileName) {
        const response = await fetch(filePath + aFileName);
        if (response.status == 200) {
          return [Engine];
        }
      }
    }
  }
  for (const Engine of SKIN_ENGINES) {
    if (Engine.canProcess(filePath)) {
      result.push(Engine);
    }
  }
  return result;
}
export async function getSkinEngineClassByContent(classes, filePath, uiRoot) {
  for (const Engine of classes) {
    const aFileName = Engine.identifyByFile(filePath);
    const aFile = await uiRoot.getFileAsString(aFileName);
    if (aFile != null) {
      return Engine;
    }
  }
}
