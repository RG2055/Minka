import {XmlElement} from "../_snowpack/pkg/@rgrove/parse-xml.js";
import {Edges} from "./Clippath.js";
import GammaGroup from "./GammaGroup.js";
import ToggleButton from "./makiClasses/ToggleButton.js";
import {registerSkinEngine, SkinEngine} from "./SkinEngine.js";
import CircleButton from "./soniqueClasses/CircleButton.js";
import IniFile from "./soniqueClasses/IniFile.js";
import {MISC} from "./soniqueClasses/misc_ini.js";
import RingProgress from "./soniqueClasses/RingProgress.js";
import SgfFileExtractor from "./soniqueClasses/SgfFileExtractor.js";
export class SoniqueSkinEngine extends SkinEngine {
  constructor() {
    super(...arguments);
    this._alphaData = null;
  }
  getFileExtractor() {
    return new SgfFileExtractor();
  }
  async parseSkin() {
    this._ini = new IniFile();
    this._ini.readString(MISC);
    const skinIni = await this._uiRoot.getFileAsString("/skin.ini");
    if (skinIni) {
      this._ini.readString(skinIni);
    }
    console.log(this._ini._tree);
    console.log("RESOURCE_PHASE #################");
    await this.loadKnowBitmaps();
    await this.buildGammaSet();
    await this.loadColorizedBitmaps();
    const container = await this.loadContainer();
    await this.loadMid(container);
    await this.loadNav(container);
    await this.loadSmall(container);
  }
  async loadKnowBitmaps() {
    const knownBitmaps = [
      "extra",
      "midsonique",
      "misc",
      "navigator",
      "navitem1",
      "navitem2",
      "qsound/1",
      "shuttle",
      "skinthumb",
      "skinthumbmask",
      "smallknob",
      "smalllycoslogo",
      "smallstate",
      "splash",
      "volumeknob"
    ];
    for (const bitmapName of knownBitmaps) {
      await this.bitmap(new XmlElement("bitmap", {
        id: bitmapName,
        file: `/jpeg/${bitmapName}`
      }));
    }
  }
  async buildGammaSet() {
    const iColors = this._ini.section("sonique colors");
    const gammaSet = [];
    const gammaGroups = [
      {id: "MidTop", value: "-3897,0,2394", gray: "0", boost: "0"},
      {id: "SystemColor_1", value: "-4096,0,0", gray: "0", boost: "0"},
      {id: "IconColor", value: "-4096,-4096,-4096", gray: "0", boost: "0"},
      {
        id: "BlueBallsColorHover",
        value: "-144,-144,-144",
        gray: "0",
        boost: "0"
      }
    ];
    for (const gamma2 of gammaGroups) {
      console.log("gamma:", gamma2.id, gamma2.value, iColors.getString(gamma2.id));
      const gammaGroup = new GammaGroup();
      gammaGroup.setXmlAttributes(gamma2);
      gammaSet.push(gammaGroup);
    }
    const knownColorsIni = [
      "BlueBallsColor",
      "SystemColor_1",
      "SystemColor_2",
      "SystemColor_3"
    ];
    function gamma(i) {
      return (i - 128) / 128 * 4096;
    }
    for (const colorName of knownColorsIni) {
      const {r, g, b, a} = iColors.getRGBA(colorName);
      const value = `${gamma(r)},${gamma(g)},${gamma(b)}`;
      console.log("gamma:", colorName, value, [r, g, b, a], iColors.getString(colorName));
      const gammaGroup = new GammaGroup();
      gammaGroup.setXmlAttributes({
        id: colorName,
        value
      });
      gammaSet.push(gammaGroup);
    }
    this._uiRoot.addGammaSet("default", gammaSet);
  }
  async loadColorizedBitmaps() {
    const knownBitmaps = [
      "down",
      "up",
      "minus",
      "close",
      "down2",
      "up2",
      "infinity",
      "right",
      "first",
      "prev",
      "play",
      "pause",
      "next",
      "last",
      "stop",
      "eject",
      "help"
    ];
    let i = 0;
    for (const bitmapName of knownBitmaps) {
      await this.bitmap(new XmlElement("bitmap", {
        file: "/png/navitem",
        id: `nav.${bitmapName}`,
        x: `${i * 10}`,
        y: "0",
        w: "10",
        h: "10",
        gammagroup: "IconColor"
      }));
      i++;
    }
    await this.bitmap(new XmlElement("bitmap", {
      file: "/png/navitem",
      id: `nav.item.normal`,
      x: `181`,
      y: "0",
      w: "10",
      h: "10",
      gammagroup: "BlueBallsColor"
    }));
    await this.bitmap(new XmlElement("bitmap", {
      file: "/png/navitem",
      id: `nav.item.hover`,
      x: `181`,
      y: "0",
      w: "10",
      h: "10",
      gammagroup: "BlueBallsColorHover"
    }));
  }
  moveRegions(regions, dx, dy) {
    for (var i = 0; i < regions.length; i++) {
      regions[i].left += dx;
      regions[i].right += dx;
      regions[i].top += dy;
      regions[i].bottom += dy;
    }
  }
  async getRegions(rgnId, skipFirst = true) {
    rgnId = rgnId.toLowerCase();
    const buffer = await this._uiRoot.getFileAsBytes(rgnId);
    const words = new Int16Array(buffer);
    const regions = [];
    const start = skipFirst ? 5 : 1;
    for (var i = start; i < words.length; i += 4) {
      const rect = words.slice(i, i + 4);
      const [l, t, r, b] = [rect[0], rect[1], rect[2], rect[3]];
      regions.push({
        left: l,
        top: t,
        right: r,
        bottom: b,
        width: r - l,
        height: b - t
      });
    }
    return regions;
  }
  async getRect(rgnId) {
    const rects = await this.getRegions(rgnId, false);
    return rects[0];
  }
  async mask(id, regionId, ImageId) {
    let regions = await this.getRegions(regionId, false);
    regions.reverse();
    let rect = regions.pop();
    regions.reverse();
    const bitmap = await this.bitmap(new XmlElement("bitmap", {
      id,
      file: "",
      w: `${rect.width}`,
      h: `${rect.height}`
    }));
    const bg = this._uiRoot.getBitmap(ImageId);
    const bgCanvas = bg.getCanvas();
    this.moveRegions(regions, -rect.left, -rect.top);
    const canvas = document.createElement("canvas");
    const w = canvas.width = rect.width;
    const h = canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bgCanvas, rect.left, rect.top, w, h, 0, 0, w, h);
    const idata = ctx.getImageData(0, 0, w, h);
    const data = idata.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i + 3] = 0;
    }
    for (var region of regions) {
      for (var y = region.top; y < region.bottom; y++) {
        for (var x = region.left; x < region.right; x++) {
          var i = (y * w + x) * 4;
          var a = Math.floor((data[i + 0] + data[i + 1] + data[i + 2]) / 3);
          data[i + 3] = a;
        }
      }
    }
    ctx.putImageData(idata, 0, 0);
    bitmap.setImage(canvas);
    return id;
  }
  async loadContainer() {
    let node = new XmlElement("container", {
      id: "main",
      x: "0",
      y: "0"
    });
    const main = await this.container(node);
    return main;
  }
  async loadMid(parent) {
    const prefix = "mid";
    const bg = this._uiRoot.getBitmap(`midsonique`);
    let node = new XmlElement("layout", {
      id: "mid",
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const normal = await this.layout(node, parent);
    node = new XmlElement("group", {
      id: "mid-root",
      background: bg.getId(),
      w: `${bg.getWidth()}`,
      h: `${bg.getHeight()}`
    });
    const group = await this.group(node, normal);
    await this.applyRegion(group, "/rgn/mid/frame");
    node = new XmlElement("layer", {
      id: "mover",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
    await this.loadButton("eject", "switch;nav", group, {position: "RED"});
    await this.loadButton("play", "play", group);
    await this.loadButton("pause", "pause", group);
    await this.loadButton("stop", "stop", group, {
      rectName: "play",
      attributes: {visible: "audio:play", image: "splash"}
    });
    await this.loadButton("next", "next", group);
    await this.loadButton("prev", "prev", group);
    await this.loadButton("eject", "eject", group, {position: "ORANGE"});
    await this.loadToggleButton("Repeat", "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D};Repeat", group, {position: "CYAN"});
    await this.loadToggleButton("Shuffle", "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D};Shuffle", group, {position: "GREEN"});
    await this.loadMidTop(group);
    await this.loadMidBottom(group);
  }
  async loadMidTop(parent) {
    const iColors = this._ini.section("sonique colors");
    const playListColors = [];
    for (var i = 1; i <= 2; i++) {
      playListColors.push(iColors.getString(`PlayListColor_${i}`));
    }
    let rect = await this.getRect("/rgn/mid/listposring");
    await this.newGui(RingProgress, new XmlElement("dummy", {
      id: `playlist-progress`,
      colors: `${playListColors.join(",")}`,
      bgcolor: iColors.getString("ProgressBkColor") || "grey",
      mask: await this.mask("pl-mask", "/rgn/mid/listposring", "midsonique"),
      degree: this._ini.getInt("misc values", "mid_playlistmode") ? "270" : "360",
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.width}`,
      h: `${rect.height}`
    }), parent);
    rect = await this.getRect("/rgn/mid/top");
    const room = await this.group(new XmlElement("dummy", {
      id: `top-room`,
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.width}`,
      h: `${rect.height}`
    }), parent);
    await this.loadCircleButton("SingleUp", "SWITCH;nav", room, {
      image: "nav.up"
    });
    await this.loadCircleButton("SingleDown", "SWITCH;small", room, {
      image: "nav.down"
    });
    await this.loadCircleButton("Help", "", room, {image: "nav.help"});
    await this.loadCircleButton("Minimize", "", room, {image: "nav.minus"});
    await this.loadCircleButton("Close", "", room, {image: "nav.close"});
  }
  async loadMidBottom(parent) {
    const iColors = this._ini.section("sonique colors");
    const progressColors = [];
    for (var i = 1; i <= 3; i++) {
      progressColors.push(iColors.getString(`ProgressColor_${i}`));
    }
    let rect = await this.getRect("/rgn/mid/songposring");
    await this.newGui(RingProgress, new XmlElement("dummy", {
      id: `song-progress`,
      action: "seek",
      colors: `${progressColors.join(",")}`,
      bgcolor: iColors.getString("ProgressBkColor") || "grey",
      mask: await this.mask("song-mask", "/rgn/mid/songposring", "midsonique"),
      x: `${rect.left}`,
      y: `${rect.top}`,
      w: `${rect.width}`,
      h: `${rect.height}`
    }), parent);
    const outer = await this.getRect("/rgn/mid/bottom");
    let regions = await this.getRegions("/rgn/mid/bottom");
    const halfWidth = outer.width / 2;
    regions = [{...outer}, ...regions];
    this.moveRegions(regions, -outer.left, -outer.top);
    let first = true;
    const p1 = [];
    const p2 = [];
    for (const region of regions) {
      let {left, top, right, bottom} = region;
      right--;
      bottom--;
      if (first) {
        first = false;
        p1.push(`${left}px ${bottom}px`);
        p1.push(`${left}px ${top}px`);
        p2.push(`${right - halfWidth}px ${bottom}px`);
        p2.push(`${right - halfWidth}px ${top}px`);
        continue;
      }
      p1.push(`${left}px ${top}px`);
      p1.push(`${left}px ${bottom}px`);
      p2.push(`${right - halfWidth}px ${top}px`);
      p2.push(`${right - halfWidth}px ${bottom}px`);
    }
    this._uiRoot.addAdditionalCss(`--bottom-arc1: polygon(${p1.join(", ")});`);
    this._uiRoot.addAdditionalCss(`--bottom-arc2: polygon(${p2.join(", ")});`);
    const circle = await this.group(new XmlElement("dummy", {
      id: `bottom-circle`,
      x: `${outer.left}`,
      y: `${outer.top}`,
      w: `${outer.width}`,
      h: `${outer.height}`
    }), parent);
    circle.getDiv().classList.add("text-shaped");
    const circle2 = await this.group(new XmlElement("dummy", {
      id: `bottom-inner-circle`,
      x: `0`,
      y: `0`,
      relatw: `1`,
      relath: `1`
    }), circle);
    circle2.getDiv().classList.add("text-shaped");
    circle2.getDiv().classList.add("right");
    circle2.getDiv().innerText = `Experience design is the design of medium, or across media, with human experience as an
    explicit outcome, and human engagement as an explicit goal. more text test.more text test.more text test.more text test.more text test.more text test.more text test.more text test.more text test.more text test.more text test.`;
  }
  async loadNav(parent) {
    const prefix = "nav";
    const bg = this._uiRoot.getBitmap(`navigator`);
    let node = new XmlElement("layout", {
      id: prefix,
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
    await this.applyRegion(group, `/rgn/${prefix}/frame`);
    node = new XmlElement("layer", {
      id: "mover",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
    await this.loadButton("play", "play", group);
    await this.loadButton("pause", "pause", group);
    await this.loadButton("stop", "stop", group, {
      rectName: "play",
      attributes: {visible: "audio:play", image: "splash"}
    });
    await this.loadButton("next", "next", group);
    await this.loadButton("prev", "prev", group);
    await this.loadButton("eject", "eject", group, {position: "ORANGE"});
    await this.loadToggleButton("Repeat", "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D};Repeat", group, {position: "CYAN"});
    await this.loadToggleButton("Shuffle", "{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D};Shuffle", group, {position: "GREEN"});
  }
  async loadSmall(parent) {
    const prefix = "small";
    const bg = this._uiRoot.getBitmap(`smallstate`);
    let node = new XmlElement("layout", {
      id: prefix,
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
    await this.applyRegion(group, `/rgn/${prefix}/frame`);
    node = new XmlElement("layer", {
      id: "mover",
      w: `0`,
      h: `0`,
      relatw: `1`,
      relath: `1`,
      move: "1"
    });
    const mover = await this.layer(node, group);
  }
  async applyRegion(group, rgnId) {
    const regions = await this.getRegions(rgnId);
    const canvas = document.createElement("canvas");
    canvas.width = group.getwidth();
    canvas.height = group.getheight();
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    for (const region of regions) {
      ctx.fillRect(region.left, region.top, region.width, region.height);
    }
    const edge = new Edges();
    edge.parseCanvasTransparency(canvas);
    if (!edge.isSimpleRect()) {
      group.getDiv().style.clipPath = edge.getPolygon();
      return;
    }
  }
  async loadButton(nick, action, parent, options = {}) {
    const rectName = options.rectName || nick;
    const layout = parent.getparentlayout().getId();
    const regId = `/rgn/${layout}/${rectName}`;
    const {left, top, width, height} = await this.getRect(regId);
    let param = "";
    if (action.includes(";")) {
      [action, param] = action.split(";");
    }
    const attributes = options.attributes || {};
    const position = options.position || nick;
    const misc = this._ini.section("misc locations");
    var x, y;
    if (x = misc.getString(`${position.toLowerCase()}on_x`)) {
      y = misc.getString(`${position.toLowerCase()}on_y`);
      await this.bitmap(new XmlElement("bitmap", {
        id: `${nick}-on`,
        file: `/jpeg/misc`,
        x,
        y,
        w: `${width}`,
        h: `${height}`
      }));
      attributes["downImage"] = `${nick}-on`;
    }
    if (x = misc.getString(`${position.toLowerCase()}_x`)) {
      y = misc.getString(`${position.toLowerCase()}_y`);
      await this.bitmap(new XmlElement("bitmap", {
        id: `${nick}-on`,
        file: `/jpeg/misc`,
        x,
        y,
        w: `${width}`,
        h: `${height}`
      }));
      attributes["downImage"] = `${nick}-on`;
    }
    if (x = misc.getString(`${position.toLowerCase()}off_x`)) {
      y = misc.getString(`${position.toLowerCase()}off_y`);
      await this.bitmap(new XmlElement("bitmap", {
        id: `${nick}-off`,
        file: `/jpeg/misc`,
        x,
        y,
        w: `${width}`,
        h: `${height}`
      }));
      attributes["image"] = `${nick}-off`;
    }
    const node = new XmlElement("button", {
      id: nick,
      action,
      param,
      x: `${left}`,
      y: `${top}`,
      w: `${width}`,
      h: `${height}`,
      ...attributes
    });
    const button = await this.button(node, parent);
    return button;
  }
  async loadToggleButton(nick, cfgattrib, parent, options = {}) {
    const rectName = options.rectName || nick;
    const layout = parent.getparentlayout().getId();
    const regId = `/rgn/${layout}/${rectName}`;
    const {left, top, width, height} = await this.getRect(regId);
    const attributes = options.attributes || {};
    const position = options.position || nick;
    const misc = this._ini.section("misc locations");
    var x, y;
    if (x = misc.getString(`${position.toLowerCase()}on_x`)) {
      y = misc.getString(`${position.toLowerCase()}on_y`);
      await this.bitmap(new XmlElement("bitmap", {
        id: `${nick}-on`,
        file: `/jpeg/misc`,
        x,
        y,
        w: `${width}`,
        h: `${height}`
      }));
      attributes["downImage"] = `${nick}-on`;
      attributes["activeImage"] = `${nick}-on`;
    }
    if (x = misc.getString(`${position.toLowerCase()}_x`)) {
      y = misc.getString(`${position.toLowerCase()}_y`);
      await this.bitmap(new XmlElement("bitmap", {
        id: `${nick}-on`,
        file: `/jpeg/misc`,
        x,
        y,
        w: `${width}`,
        h: `${height}`
      }));
      attributes["downImage"] = `${nick}-on`;
      attributes["activeImage"] = `${nick}-on`;
    }
    if (x = misc.getString(`${nick.toLowerCase()}off_x`)) {
      y = misc.getString(`${nick.toLowerCase()}off_y`);
      await this.bitmap(new XmlElement("bitmap", {
        id: `${nick}-off`,
        file: `/jpeg/misc`,
        x,
        y,
        w: `${width}`,
        h: `${height}`
      }));
      attributes["image"] = `${nick}-off`;
    }
    const node = new XmlElement("button", {
      id: nick,
      cfgattrib,
      cfgval: "2",
      x: `${left}`,
      y: `${top}`,
      w: `${width}`,
      h: `${height}`,
      ...attributes
    });
    const button = await this.newGui(ToggleButton, node, parent);
    return button;
  }
  async loadCircleButton(nick, action, parent, options = {}) {
    let param = "";
    if (action.includes(";")) {
      [action, param] = action.split(";");
    }
    const msm = this._ini.section("msm locations");
    const x = msm.getString(`msm_${nick}_x`);
    const y = msm.getString(`msm_${nick}_y`);
    const w = "10";
    const h = "10";
    const node = new XmlElement("button", {
      id: nick,
      action,
      param,
      image: "nav.item.normal",
      hoverImage: "nav.item.hover",
      iconImage: options.image,
      x,
      y,
      w,
      h
    });
    const button = await this.newGui(CircleButton, node, parent);
    return button;
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
SoniqueSkinEngine.canProcess = (filePath) => {
  return filePath.endsWith(".sgf");
};
SoniqueSkinEngine.identifyByFile = (filePath) => {
  return null;
};
SoniqueSkinEngine.priority = 4;
registerSkinEngine(SoniqueSkinEngine);
