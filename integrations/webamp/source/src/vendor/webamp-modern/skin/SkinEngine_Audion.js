import {XmlElement} from "../_snowpack/pkg/@rgrove/parse-xml.js";
import ButtonFace from "./faceClasses/ButtonFace.js";
import TimeFace from "./faceClasses/TimeFace.js";
import {registerSkinEngine, SkinEngine} from "./SkinEngine.js";
export class SkinEngineAudion extends SkinEngine {
  constructor() {
    super(...arguments);
    this._alphaData = null;
  }
  async parseSkin() {
    console.log("RESOURCE_PHASE #################");
    const configContent = await this._uiRoot.getFileAsString("index.json");
    this._config = JSON.parse(configContent);
    await this.loadKnowBitmaps();
    const root = await this.getRootGroup();
    await this.loadTime(root);
    await this.laodAnimations(root);
    await this.laodIndicators(root);
    await this.loadButtons(root);
    await this.loadTexts(root);
  }
  async loadKnowBitmaps() {
    await this.loadBase();
  }
  async loadBase() {
    await this.loadPlainBitmap("base-alpha.png");
    await this.loadBitmap("base.png");
  }
  async loadButtons(parent) {
    await this.loadButton("pause", parent, {rectName: "play"});
    await this.loadButton("play", parent, {
      attributes: {visible: "allowed-to:play"}
    });
    await this.loadButton("stop", parent);
    await this.loadButton("rewind", parent, {
      fileName: "rw",
      action: "prev",
      attributes: {enabled: "allowed-to:prev"}
    });
    await this.loadButton("fastForward", parent, {
      fileName: "ff",
      action: "next",
      attributes: {enabled: "allowed-to:next"}
    });
    await this.loadButton("eject", parent, {fileName: "eject"});
    await this.loadButton("playlist", parent, {fileName: "menu"});
    await this.loadButton("info", parent, {fileName: "info"});
    await this.loadButton("volume", parent, {fileName: "volume"});
    await this.loadButton("mode", parent, {fileName: "music"});
    await this.loadButton("close", parent);
  }
  async loadButton(name, parent, options = {}) {
    const fileName = options.fileName || name;
    const rectName = options.rectName || name;
    const actionName = options.action || name;
    const rect = this._config[`${rectName}ButtonRect`];
    await this.loadBitmap(`${fileName}.png`, `${name}`, rect.left, rect.top);
    await this.loadBitmap(`${fileName}-hover.png`, `${name}-hover`, rect.left, rect.top);
    await this.loadBitmap(`${fileName}-active.png`, `${name}-active`, rect.left, rect.top);
    await this.loadBitmap(`${fileName}-disabled.png`, `${name}-disabled`, rect.left, rect.top);
    const attributes = options.attributes || {};
    const node = new XmlElement("button", {
      id: name,
      image: `${name}`,
      downImage: `${name}-active`,
      hoverImage: `${name}-hover`,
      disabledImage: `${name}-disabled`,
      action: actionName,
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.right - rect.left}`,
      h: `${rect.bottom - rect.top}`,
      ...attributes
    });
    const button = await this.buttonFace(node, parent);
  }
  async buttonFace(node, parent) {
    return this.newGui(ButtonFace, node, parent);
  }
  get alphaData() {
    if (!this._alphaData) {
      const alphaBitmap = this._uiRoot.getBitmap("base-alpha.png");
      const canvasa = alphaBitmap.getCanvas();
      const ctxa = canvasa.getContext("2d");
      const imga = ctxa.getImageData(0, 0, canvasa.width, canvasa.height);
      this._alphaData = imga.data;
    }
    return this._alphaData;
  }
  async loadPlainBitmap(fileName, name = null) {
    if (name == null) {
      name = fileName;
    }
    const bitmap = await this.bitmap(new XmlElement("bitmap", {id: name, file: fileName}));
    return bitmap;
  }
  async loadBitmap(fileName, name = null, dx = 0, dy = 0) {
    if (name == null)
      name = fileName;
    const bitmap = await this.loadPlainBitmap(fileName, name);
    if (bitmap.loaded()) {
      await this.applyBaseTransparency(bitmap, dx, dy);
    } else {
      this._uiRoot.removeBitmap(name);
      return null;
    }
    return bitmap;
  }
  async applyBaseTransparency(bitmap, dx, dy) {
    let anyPixelChanged = false;
    const canvasb = bitmap.getCanvas();
    const ctxb = canvasb.getContext("2d");
    const imgb = ctxb.getImageData(0, 0, canvasb.width, canvasb.height);
    const datab = imgb.data;
    const dataa = this.alphaData;
    const bw = bitmap.getWidth();
    const bh = bitmap.getHeight();
    const aw = this._uiRoot.getBitmap("base-alpha.png").getWidth();
    for (var y = 0; y < bh; y++) {
      for (var x = 0; x < bw; x++) {
        const b = y * bw + x;
        if (datab[b * 4 + 3] != 0) {
          const a = (y + dy) * aw + dx + x;
          datab[b * 4 + 3] = dataa[a * 4 + 3];
          anyPixelChanged = true;
        }
      }
    }
    if (anyPixelChanged) {
      ctxb.putImageData(imgb, 0, 0);
      bitmap.setImage(canvasb);
    }
  }
  makeHoleInBase(rect) {
    const bitmap = this._uiRoot.getBitmap("base.png");
    const canvas = bitmap.getCanvas();
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const bw = bitmap.getWidth();
    let anyPixelChanged = false;
    for (var y = rect.top; y < rect.bottom; y++) {
      for (var x = rect.left; x < rect.right; x++) {
        const b = y * bw + x;
        if (data[b * 4 + 3] != 0) {
          data[b * 4 + 3] = 0;
          anyPixelChanged = true;
        }
      }
    }
    if (anyPixelChanged) {
      ctx.putImageData(img, 0, 0);
      bitmap.setImage(canvas);
    }
  }
  async loadTime(parent) {
    for (var i = 1; i <= 4; i++) {
      const start = this._config[`timeDigit${i}FirstPICTID`];
      await this.mergeBitmaps(start, 10, false, false, 0, 0, 0, 1);
      await this.loadTimePart(i, parent);
    }
  }
  async mergeBitmaps(start, count, vertical, applyBaseTransparency, dx = 0, dy = 0, skipX = 0, skipY = 0) {
    const filesPath = [];
    for (var i = start; i < start + count; i++) {
      filesPath.push(`${i}.png`);
    }
    const bitmaps = await Promise.all(filesPath.map(async (filePath) => {
      return applyBaseTransparency ? this.loadBitmap(filePath, filePath, dx, dy) : this.loadPlainBitmap(filePath, filePath);
    }));
    const countX = vertical ? 1 + skipX : count + skipX;
    const countY = vertical ? count + skipY : 1 + skipY;
    const incX = vertical ? 0 : 1;
    const incY = vertical ? 1 : 0;
    const bitmap = bitmaps[0];
    console.log("merge getBitmap:", filesPath[0]);
    const w = bitmap.getWidth();
    const h = bitmap.getHeight();
    const canvas = document.createElement("canvas");
    canvas.width = w * countX;
    canvas.height = h * countY;
    const ctx = canvas.getContext("2d");
    let x = w * skipX;
    let y = h * skipY;
    for (const abitmap of bitmaps) {
      ctx.drawImage(abitmap.getImg(), x, y);
      x += incX * w;
      y += incY * h;
    }
    bitmap.setXmlAttr("w", `${canvas.width}`);
    bitmap.setXmlAttr("h", `${canvas.height}`);
    bitmap.setImage(canvas);
    for (const abitmap of bitmaps) {
      if (abitmap !== bitmap) {
        abitmap.setImage(null);
        abitmap.setXmlAttr("file", null);
        this._uiRoot.removeBitmap(abitmap.getId());
      }
    }
    return {width: w, height: h};
  }
  async loadTimePart(digit, parent) {
    const start = this._config[`timeDigit${digit}FirstPICTID`];
    const rect = this._config[`timeDigit${digit}Rect`];
    const bitmap = this._uiRoot.getBitmap(`${start}.png`);
    const w = bitmap.getWidth() / 10;
    const h = bitmap.getHeight() / 2;
    let node = new XmlElement("bitmapfont", {
      id: `font-${bitmap.getId()}`,
      file: `${bitmap.getId()}`,
      charwidth: `${w}`,
      charheight: `${h}`
    });
    const font = await this.bitmapFont(node);
    font.setImage(bitmap.getImg());
    node = new XmlElement("text", {
      id: `time-${digit}`,
      font: `${font.getId()}`,
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.right - rect.left}`,
      h: `${rect.bottom - rect.top}`,
      charwidth: `${w}`,
      charheight: `${h}`,
      digit: `${digit}`
    });
    const text = await this.textFace(node, parent);
    text.setXmlAttr("display", "time");
    text.setXmlAttr("fontsize", `${h}`);
  }
  async textFace(node, parent) {
    return this.newGui(TimeFace, node, parent);
  }
  async laodAnimations(parent) {
    await Promise.all([
      this.laodAnimation("connecting", parent, true)
    ]);
  }
  async laodAnimation(prefix, parent, makeHole = false) {
    const start = this._config[`${prefix}FirstPICTID`];
    const count = this._config[`${prefix}NumPICTs`];
    const rect = this._config[`${prefix}AnimRect`];
    const delay = this._config[`${prefix}FrameDelay`];
    const frame = await this.mergeBitmaps(start, count, true, true, rect.left, rect.top);
    const node = new XmlElement("animatedLayer", {
      id: "${prefix}Anim",
      image: `${start}.png`,
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.right - rect.left}`,
      h: `${rect.bottom - rect.top}`,
      frameheight: `${frame.height}`,
      speed: `${delay * 100}`,
      autoPlay: `1`,
      move: `1`,
      start: `0`,
      end: `${count - 1}`
    });
    await this.animatedLayer(node, parent);
    if (makeHole) {
      this.makeHoleInBase(rect);
    }
  }
  async laodIndicators(parent) {
    return await Promise.all([
      this.laodIndicator("MP3", parent),
      this.laodIndicator("CD", parent),
      this.laodIndicator("CDDB", parent),
      this.laodIndicator("net", parent)
    ]);
  }
  async laodIndicator(prefix, parent) {
    const rect = this._config[`${prefix}IndicatorRect`];
    const bitmap = await this.loadBitmap(`${prefix}.png`, `${prefix}`, rect.left, rect.top);
    if (!bitmap || !bitmap.loaded()) {
      this._uiRoot.removeBitmap(prefix);
      return;
    }
    await this.loadBitmap(`${prefix}-on.png`, `${prefix}-on`, rect.left, rect.top);
    const node = new XmlElement("layer", {
      id: `${prefix}Indicator`,
      image: `${prefix}`,
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.right - rect.left}`,
      h: `${rect.bottom - rect.top}`
    });
    await this.layer(node, parent);
  }
  async loadTexts(parent) {
    this.loadText("artist", "songtitle", parent);
    this.loadText("album", "songinfo", parent);
  }
  async loadText(prefix, action, parent) {
    const rect = this._config[`${prefix}DisplayRect`];
    const textMode = this._config[`${prefix}TextMode`] == 0 ? "Face" : "Txtr";
    const color = this._config[`${prefix}DisplayTextFaceColorFrom${textMode}`];
    const node = new XmlElement("text", {
      id: `${prefix}-text`,
      text: `${action}`,
      display: `${action}`,
      ticker: `${1}`,
      color: `${color.red},${color.green},${color.blue}`,
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.right - rect.left}`,
      h: `${rect.bottom - rect.top}`
    });
    await this.text(node, parent);
  }
  async getRootGroup() {
    let node = new XmlElement("container", {id: "root"});
    const container = await this.container(node);
    const base = this._uiRoot.getBitmap("base.png");
    node = new XmlElement("layout", {
      id: "normal",
      w: `${base.getWidth()}`,
      h: `${base.getHeight()}`,
      background: "base.png"
    });
    const layout = await this.layout(node, container);
    node = new XmlElement("group", {
      id: "wrapper",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`
    });
    const group = await this.group(node, layout);
    node = new XmlElement("layer", {
      id: "mover",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
    return group;
  }
}
SkinEngineAudion.canProcess = (filePath) => {
  return filePath.endsWith(".face") || filePath.endsWith(".zip");
};
SkinEngineAudion.identifyByFile = (filePath) => {
  return "index.json";
};
SkinEngineAudion.priority = 3;
registerSkinEngine(SkinEngineAudion);
