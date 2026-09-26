import {
  assert,
  num,
  toBool,
  px,
  assume,
  relative,
  findLast
} from "../../utils.js";
import XmlObj from "../XmlObj.js";
let BRING_LEAST = -1;
let BRING_MOST_TOP = 1;
const globalMouseDown = [];
export const installGlobalMouseDown = (f) => {
  if (!globalMouseDown.includes(f)) {
    globalMouseDown.push(f);
  }
};
export const uninstallGlobalMouseDown = (f) => {
  const index = globalMouseDown.indexOf(f);
  if (index != -1) {
    globalMouseDown.splice(index, 1);
  }
};
export const executeGlobalMouseDown = (e) => {
  for (let i = 0; i < globalMouseDown.length; i++) {
    globalMouseDown[i](e);
  }
};
export default class GuiObj extends XmlObj {
  constructor(uiRoot) {
    super();
    this._children = [];
    this._w = 0;
    this._h = 0;
    this._x = 0;
    this._y = 0;
    this._minimumHeight = 0;
    this._maximumHeight = 0;
    this._minimumWidth = 0;
    this._maximumWidth = 0;
    this._relatw = "0";
    this._relath = "0";
    this._visible = true;
    this._alpha = 255;
    this._ghost = false;
    this._sysregion = 0;
    this._tooltip = "";
    this._targetX = null;
    this._targetY = null;
    this._targetWidth = null;
    this._targetHeight = null;
    this._targetAlpha = null;
    this._targetSpeed = null;
    this._goingToTarget = false;
    this._backgroundBitmap = null;
    this._metaCommands = [];
    this.__cfgAttribChanged = () => {
      const newValue = this._configAttrib.getdata();
      this._cfgAttribChanged(newValue);
    };
    this._uiRoot = uiRoot;
    this._div = document.createElement(this.getElTag().toLowerCase().replace("_", ""));
  }
  getElTag() {
    return this.constructor.name;
  }
  setParent(group) {
    this._parent = group;
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    switch (key) {
      case "id":
        this._originalId = value;
        this._id = value.toLowerCase();
        break;
      case "name":
        this._name = value;
        break;
      case "autowidthsource":
        this._autowidthsource = value.toLowerCase();
        break;
      case "fitparent":
        this._relatw = "1";
        this._relath = "1";
        this._renderWidth();
        this._renderHeight();
        break;
      case "w":
      case "default_w":
        this._w = num(value);
        this._renderWidth();
        break;
      case "h":
      case "default_h":
        this._h = num(value);
        this._renderHeight();
        break;
      case "x":
      case "default_x":
        this._x = num(value) ?? 0;
        this._renderX();
        break;
      case "y":
      case "default_y":
        this._y = num(value) ?? 0;
        this._renderY();
        break;
      case "minimum_h":
        this._minimumHeight = num(value);
        break;
      case "minimum_w":
        this._minimumWidth = num(value);
        break;
      case "maximum_h":
        this._maximumHeight = num(value);
        break;
      case "maximum_w":
        this._maximumWidth = num(value);
        break;
      case "relatw":
        this._relatw = value;
        this._renderWidth();
        break;
      case "relath":
        this._relath = value;
        this._renderHeight();
        break;
      case "relatx":
        this._relatx = value;
        this._renderX();
        break;
      case "relaty":
        this._relaty = value;
        this._renderY();
        break;
      case "droptarget":
        this._droptarget = value;
        break;
      case "dblclickaction":
        const [action, param, actionTarget] = value.split(";");
        this._div.addEventListener("dblclick", (e) => {
          this.dispatchAction(action, param, actionTarget);
        });
        break;
      case "ghost":
        this._ghost = toBool(value);
        break;
      case "visible":
        this._visible = toBool(value);
        this._renderVisibility();
        break;
      case "activealpha":
      case "inactivealpha":
        this._div.setAttribute(key, value);
        break;
      case "tooltip":
        this._tooltip = value;
        break;
      case "alpha":
        this.setalpha(num(value));
      case "sysregion":
        this._sysregion = num(value);
        break;
      case "cfgattrib":
        this._setConfigAttrib(value);
        break;
      default:
        return false;
    }
    return true;
  }
  setxmlparam(key, value) {
    this.setXmlAttr(key, value);
  }
  _setConfigAttrib(cfgattrib) {
    const [guid, attrib] = cfgattrib.split(";");
    const configItem = this._uiRoot.CONFIG.getitem(guid);
    this._configAttrib = configItem.getattribute(attrib);
    this._configAttrib.on("datachanged", this.__cfgAttribChanged.bind(this));
  }
  _cfgAttribChanged(newValue) {
  }
  updateCfgAttib(newValue) {
    if (this._configAttrib != null) {
      this._configAttrib.setdata(newValue);
    }
  }
  setSize(newWidth, newHeight) {
  }
  init() {
    for (const node of this._metaCommands) {
      const cmd = node.name.toLowerCase();
      const el = node.attributes.group ? this.findobject(node.attributes.group) : this;
      const targets_ids = node.attributes.target.split(";");
      for (const target_id of targets_ids) {
        const gui = el.findobjectF(target_id, `<${cmd}(${target_id})=notfound. @${this.getId()}`);
        if (gui == null) {
          continue;
        }
        if (cmd == "sendparams") {
          for (let attribute in node.attributes) {
            if (gui && attribute != "target") {
              gui.setxmlparam(attribute, node.attributes[attribute]);
            }
          }
        } else if (cmd == "hideobject" && target_id != "close") {
          gui.hide();
        }
      }
    }
    if (this._configAttrib) {
      this._cfgAttribChanged(this._configAttrib.getdata());
    }
    this._div.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      console.log("mouse-down!");
      const down = this._eventToLocal(e);
      this.onLeftButtonDown(down.x + this.getleft(), down.y + this.gettop());
      const mouseUpHandler = (e2) => {
        console.log("mouse-up!");
        const up = this._eventToLocal(e2);
        this.onLeftButtonUp(up.x + this.getleft(), up.y + this.gettop());
        this._div.removeEventListener("mouseup", mouseUpHandler);
      };
      this._div.addEventListener("mouseup", mouseUpHandler);
    });
    this._div.addEventListener("mouseenter", (e) => {
      this.onEnterArea();
    });
    this._div.addEventListener("mouseleave", (e) => {
      this.onLeaveArea();
    });
  }
  dispose() {
  }
  _eventToLocal(e) {
    const rect = this._div.getBoundingClientRect();
    const scaleX = this._div.offsetWidth ? rect.width / this._div.offsetWidth : 1;
    const scaleY = this._div.offsetHeight ? rect.height / this._div.offsetHeight : 1;
    return {
      x: (e.clientX - rect.left) / (scaleX || 1),
      y: (e.clientY - rect.top) / (scaleY || 1)
    };
  }
  getDiv() {
    return this._div;
  }
  getId() {
    return this._id || "";
  }
  getOriginalId() {
    return this._originalId;
  }
  show() {
    this._visible = true;
    this._renderVisibility();
    this.onsetvisible(true);
  }
  hide() {
    this._visible = false;
    this._renderVisibility();
    this.onsetvisible(false);
  }
  isvisible() {
    return this._visible;
  }
  isEffectivelyVisible() {
    if (!this._visible)
      return false;
    const parent = this._parent;
    return typeof parent?.isEffectivelyVisible === "function" ? parent.isEffectivelyVisible() : true;
  }
  get visible() {
    return this._visible;
  }
  set visible(showing) {
    if (showing) {
      this.show();
    } else {
      this.hide();
    }
  }
  gettop() {
    return this._y;
  }
  getleft() {
    return this._x;
  }
  getheight() {
    if (this._relath == "1" && this._parent && !this._parent._measuring) {
      const parentHeight = this._parent.getheight?.() ?? 0;
      if (parentHeight > 0)
        return Math.max(0, parentHeight + (this._h || 0));
    }
    if (this._h || this._minimumHeight || this._maximumHeight) {
      let h = Math.max(this._h || 0, this._minimumHeight);
      h = Math.min(h, this._maximumHeight || h);
      return h;
    }
    return this._h;
  }
  get height() {
    return this.getheight();
  }
  set height(value) {
    this._h = value;
    this._renderDimensions();
  }
  getwidth() {
    if (this._relatw == "1" && this._parent && !this._parent._measuring) {
      const parentWidth = this._parent.getwidth?.() ?? 0;
      if (parentWidth > 0)
        return Math.max(0, parentWidth + (this._w || 0));
    }
    if (this._w || this._minimumWidth || this._maximumWidth) {
      let w = Math.max(this._w || 0, this._minimumWidth);
      if (this._maximumHeight) {
        w = Math.min(w, this._maximumWidth || w);
      }
      return w;
    }
    return this._w;
  }
  get width() {
    return this.getwidth();
  }
  set width(value) {
    this._w = value;
    this._renderDimensions();
  }
  resize(x, y, w, h) {
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
    this._renderDimensions();
  }
  getxmlparam(param) {
    param = param.toLowerCase();
    const _ = this["_" + param];
    return _ != null ? _.toString() : null;
  }
  getguiw() {
    return this._w;
  }
  getguih() {
    return this._h;
  }
  getguix() {
    return this._x;
  }
  getguiy() {
    return this._y;
  }
  getguirelatw() {
    return this._relatw == "1" ? 1 : 0;
  }
  getguirelath() {
    return this._relath == "1" ? 1 : 0;
  }
  getguirelatx() {
    return this._relatx == "1" ? 1 : 0;
  }
  getguirelaty() {
    return this._relaty == "1" ? 1 : 0;
  }
  getautowidth() {
    const child = !this._autowidthsource ? this : findLast(this._children, (c) => c._id.toLowerCase() == this._autowidthsource);
    if (child) {
      const intrinsic = child.getwidth();
      if (intrinsic > 0) {
        return intrinsic;
      }
      return child._div.getBoundingClientRect().width;
    }
    return 1;
  }
  getautoheight() {
    return this._div.getBoundingClientRect().height;
  }
  findobject(id) {
    if (id.toLowerCase() == this.getId().toLowerCase())
      return this;
    let ret = this._findobject(id);
    if (!ret) {
      const layout = this.getparentlayout();
      if (layout) {
        ret = layout._findobject(id);
      }
    }
    if (!ret && id != "sysmenu") {
      console.warn(`findObject(${id}) failed, @${this.getId()}`);
    }
    return ret;
  }
  findobjectF(id, msg) {
    const ret = this._findobject(id);
    const warnMissingObject = false;
    if (warnMissingObject && !ret && id != "sysmenu") {
      console.warn(msg);
    }
    return ret;
  }
  _findobject(id) {
    const lower = id.toLowerCase();
    for (const obj of this._children) {
      if ((obj.getId() || "").toLowerCase() === lower) {
        return obj;
      }
    }
    for (const obj of this._children) {
      const found = obj._findobject(id);
      if (found != null) {
        return found;
      }
    }
    return null;
  }
  isActive() {
    return this._div.matches(":focus");
  }
  setregion(reg) {
  }
  ismouseoverrect() {
    const pointer = this._uiRoot.getLastPointer();
    if (!pointer)
      return false;
    const rect = this._div.getBoundingClientRect();
    return pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
  }
  onresize(x, y, w, h) {
    this._uiRoot.vm.dispatch(this, "onresize", [
      {type: "INT", value: x},
      {type: "INT", value: y},
      {type: "INT", value: this.getwidth()},
      {type: "INT", value: this.getheight()}
    ]);
  }
  onLeftButtonUp(x, y) {
    this._uiRoot.vm.dispatch(this, "onleftbuttonup", [
      {type: "INT", value: x},
      {type: "INT", value: y}
    ]);
  }
  onLeftButtonDown(x, y) {
    assert(x >= this.getleft(), `Expected click to be to the right of the component's left. x:${x} left:${this.getleft()}`);
    assert(y >= this.gettop(), `Expected click to be below the component's top. y:${y} top:${this.gettop()}`);
    this.getparentlayout().bringtofront();
    this._uiRoot.vm.dispatch(this, "onleftbuttondown", [
      {type: "INT", value: x},
      {type: "INT", value: y}
    ]);
  }
  onRightButtonUp(x, y) {
    this._uiRoot.vm.dispatch(this, "onrightbuttonup", [
      {type: "INT", value: x},
      {type: "INT", value: y}
    ]);
  }
  onRightButtonDown(x, y) {
    this._uiRoot.vm.dispatch(this, "onrightbuttondown", [
      {type: "INT", value: x},
      {type: "INT", value: y}
    ]);
  }
  onEnterArea() {
    this._uiRoot.vm.dispatch(this, "onenterarea");
  }
  onLeaveArea() {
    this._uiRoot.vm.dispatch(this, "onleavearea");
  }
  settargetx(x) {
    this._targetX = x;
  }
  settargety(y) {
    this._targetY = y;
  }
  settargetw(w) {
    this._targetWidth = w;
  }
  settargeth(h) {
    this._targetHeight = h;
  }
  settargeta(alpha) {
    this._targetAlpha = alpha;
  }
  settargetspeed(insecond) {
    this._targetSpeed = insecond;
  }
  gototarget() {
    this._goingToTarget = true;
    const duration = this._targetSpeed * 1e3;
    const startTime = performance.now();
    const pairs = [
      ["_x", "_targetX", "_renderX"],
      ["_y", "_targetY", "_renderY"],
      ["_w", "_targetWidth", "_renderWidth"],
      ["_h", "_targetHeight", "_renderHeight"],
      ["_alpha", "_targetAlpha", "_renderAlpha"]
    ];
    const changes = {};
    for (const [key, targetKey, renderKey] of pairs) {
      const target = this[targetKey];
      if (target != null) {
        const start = this[key];
        const positive = target > start;
        const delta = target - start;
        changes[key] = {start, delta, renderKey, target, positive};
      }
    }
    const clamp = (current, target, positive) => {
      if (positive) {
        return Math.min(current, target);
      } else {
        return Math.max(current, target);
      }
    };
    const update = (time) => {
      const timeDiff = time - startTime;
      const progress = timeDiff / duration;
      for (const [
        key,
        {start, delta, renderKey, target, positive}
      ] of Object.entries(changes)) {
        this[key] = clamp(start + delta * progress, target, positive);
        this[renderKey]();
      }
      if (timeDiff < duration && this._goingToTarget) {
        window.requestAnimationFrame(update);
      } else {
        this._goingToTarget = false;
        this.ontargetreached();
      }
    };
    window.requestAnimationFrame(update);
  }
  isgoingtotarget() {
    return this._goingToTarget;
  }
  __gototargetWebAnimationApi() {
    const duration = this._targetSpeed * 1e3;
    const start = {
      left: px(this._x ?? 0),
      top: px(this._y ?? 0),
      width: px(this._w),
      height: px(this._h),
      opacity: this._alpha / 255
    };
    const end = {
      left: px(this._targetX ?? this._x ?? 0),
      top: px(this._targetY ?? this._y ?? 0),
      width: px(this._targetWidth ?? this._w),
      height: px(this._targetHeight ?? this._h),
      opacity: (this._targetAlpha ?? this._alpha) / 255
    };
    const frames = [start, end];
    const animation = this._div.animate(frames, {duration});
    animation.addEventListener("finish", () => {
      this._x = this._targetX ?? this._x;
      this._y = this._targetY ?? this._y;
      this._w = this._targetWidth ?? this._w;
      this._h = this._targetHeight ?? this._h;
      this._alpha = this._targetAlpha ?? this._alpha;
      this._renderDimensions();
      this._renderAlpha();
      this._uiRoot.vm.dispatch(this, "ontargetreached");
    });
  }
  ontargetreached() {
    this._uiRoot.vm.dispatch(this, "ontargetreached");
  }
  canceltarget() {
    this._goingToTarget = true;
  }
  reversetarget(reverse) {
    assume(false, "Unimplemented: reverseTarget");
  }
  onsetvisible(onoff) {
    this._uiRoot.vm.dispatch(this, "onsetvisible", [
      {type: "BOOLEAN", value: onoff ? 1 : 0}
    ]);
  }
  onstartup() {
    this._uiRoot.vm.dispatch(this, "onstartup");
  }
  setalpha(alpha) {
    this._alpha = alpha;
    this._renderAlpha();
  }
  getalpha() {
    return this._alpha;
  }
  _windowBox() {
    const layout = this.getparentlayout?.() ?? this;
    const div = layout.getDiv();
    const rect = div.getBoundingClientRect();
    const scale = div.offsetWidth ? rect.width / div.offsetWidth : 1;
    return {left: rect.left, top: rect.top, scale: scale || 1};
  }
  clienttoscreenx(x) {
    const box = this._windowBox();
    return window.screenX + box.left + x * box.scale;
  }
  clienttoscreeny(y) {
    const box = this._windowBox();
    return window.screenY + box.top + y * box.scale;
  }
  clienttoscreenw(w) {
    return w * this._windowBox().scale;
  }
  clienttoscreenh(h) {
    return h * this._windowBox().scale;
  }
  screentoclientx(x) {
    const box = this._windowBox();
    return (x - (window.screenX + box.left)) / box.scale;
  }
  screentoclienty(y) {
    const box = this._windowBox();
    return (y - (window.screenY + box.top)) / box.scale;
  }
  screentoclientw(w) {
    return w / this._windowBox().scale;
  }
  screentoclienth(h) {
    return h / this._windowBox().scale;
  }
  getparent() {
    return this._parent;
  }
  getparentlayout() {
    if (this._parent) {
      return this._parent.getparentlayout();
    }
  }
  bringtofront() {
    BRING_MOST_TOP += 1;
    this._div.style.zIndex = String(BRING_MOST_TOP);
  }
  bringtoback() {
    BRING_LEAST -= 1;
    this._div.style.zIndex = String(BRING_LEAST);
  }
  setenabled(onoff) {
  }
  handleAction(action, param = null, actionTarget = null, source = null) {
    return false;
  }
  dispatchAction(action, param, actionTarget) {
    const handled = this.handleAction(action, param, actionTarget);
    if (!handled && this._parent != null) {
      this._parent.dispatchAction(action, param, actionTarget);
    }
  }
  sendaction(action, param, x, y, p1, p2) {
    return this._uiRoot.vm.dispatch(this, "onaction", [
      {type: "STRING", value: action},
      {type: "STRING", value: param},
      {type: "INT", value: x},
      {type: "INT", value: y},
      {type: "INT", value: p1},
      {type: "INT", value: p2},
      {type: "OBJECT", value: this}
    ]);
  }
  _renderAlpha() {
    if (this._alpha != 255) {
      this._div.style.opacity = `${this._alpha / 255}`;
    } else {
      this._div.style.removeProperty("opacity");
    }
  }
  _renderVisibility() {
    if (!this._visible) {
      this._div.style.display = "none";
    } else {
      this._div.style.removeProperty("display");
    }
    this._visibilityChanged();
  }
  _visibilityChanged() {
  }
  _renderTransate() {
    this._div.style.transform = `translate(${px(this._x ?? 0)}, ${px(this._y ?? 0)})`;
  }
  _renderX() {
    this._div.style.left = this._relatx == "1" ? relative(this._x ?? 0) : px(this._x ?? 0);
  }
  _renderY() {
    this._div.style.top = this._relaty == "1" ? relative(this._y ?? 0) : px(this._y ?? 0);
  }
  _renderWidth() {
    this._div.style.width = this._relatw == "1" ? relative(this._w ?? 0) : px(this.getwidth());
  }
  _renderHeight() {
    this._div.style.height = this._relath == "1" ? relative(this._h ?? 0) : px(this.getheight());
  }
  _renderDimensions() {
    this._renderX();
    this._renderY();
    this._renderWidth();
    this._renderHeight();
  }
  _renderLocation() {
    this._renderX();
    this._renderY();
  }
  _renderSize() {
    this._renderWidth();
    this._renderHeight();
  }
  doResize() {
    this._uiRoot.vm.dispatch(this, "onresize", [
      {type: "INT", value: 0},
      {type: "INT", value: 0},
      {type: "INT", value: this.getwidth()},
      {type: "INT", value: this.getheight()}
    ]);
  }
  setBackgroundImage(bitmap) {
    this._backgroundBitmap = bitmap;
    if (bitmap != null) {
      bitmap.setAsBackground(this._div);
    } else {
      this._div.style.setProperty(`--background-image`, "none");
    }
  }
  setDownBackgroundImage(bitmap) {
    if (bitmap != null) {
      bitmap.setAsDownBackground(this._div);
    }
  }
  setHoverBackgroundImage(bitmap) {
    if (bitmap != null) {
      bitmap.setAsHoverBackground(this._div);
    }
  }
  setActiveBackgroundImage(bitmap) {
    if (bitmap != null) {
      bitmap.setAsActiveBackground(this._div);
    }
  }
  setInactiveBackgroundImage(bitmap) {
    if (bitmap != null) {
      bitmap.setAsInactiveBackground(this._div);
    }
  }
  setDisabledBackgroundImage(bitmap) {
    if (bitmap != null) {
      bitmap.setAsDisabledBackground(this._div);
    }
  }
  draw() {
    this.getId() && this._div.setAttribute("id", this.getId());
    this._renderVisibility();
    this._renderAlpha();
    if (this._tooltip) {
      this._div.setAttribute("title", this._tooltip);
    }
    if (this._ghost || this._sysregion == -2) {
      this._div.style.pointerEvents = "none";
    } else {
      this._div.style.pointerEvents = "auto";
    }
    this._renderDimensions();
  }
}
GuiObj.GUID = "4ee3e1994becc636bc78cd97b028869c";
