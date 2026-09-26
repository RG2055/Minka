import {throttle, toBool} from "../../utils.js";
import GuiObj from "./GuiObj.js";
import {LEFT, RIGHT, TOP, BOTTOM, CURSOR, MOVE} from "../Cursor.js";
export default class Movable extends GuiObj {
  constructor() {
    super(...arguments);
    this._movable = false;
    this._canResize = 0;
    this._resizingEventsRegistered = false;
    this._movingEventsRegistered = false;
    this._handleResizing = (downEvent) => {
      downEvent.stopPropagation();
      if (downEvent.button != 0)
        return;
      const layout = this.getparentlayout();
      layout.setResizing("constraint", this._canResize, 0);
      layout.setResizing("start", 0, 0);
      layout.setResizing(this._div.style.getPropertyValue("cursor"), CURSOR, CURSOR);
      const startX = downEvent.pageX;
      const startY = downEvent.pageY;
      const handleMove = (moveEvent) => {
        const newMouseX = moveEvent.pageX;
        const newMouseY = moveEvent.pageY;
        const deltaY = newMouseY - startY;
        const deltaX = newMouseX - startX;
        layout.setResizing("move", deltaX, deltaY);
      };
      const trottledMove = throttle(handleMove, 5);
      const handleMouseUp = (upEvent) => {
        upEvent.stopPropagation();
        if (upEvent.button != 0)
          return;
        document.removeEventListener("mousemove", trottledMove);
        document.removeEventListener("mouseup", handleMouseUp);
        const newMouseX = upEvent.pageX;
        const newMouseY = upEvent.pageY;
        const deltaY = newMouseY - startY;
        const deltaX = newMouseX - startX;
        layout.setResizing("final", deltaX, deltaY);
      };
      document.addEventListener("mousemove", trottledMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
    this._handleMoving = (downEvent) => {
      downEvent.stopPropagation();
      if (downEvent.button != 0)
        return;
      const layout = this.getparentlayout();
      layout.setMoving("start", 0, 0);
      const startX = downEvent.pageX;
      const startY = downEvent.pageY;
      const handleMove = (moveEvent) => {
        const newMouseX = moveEvent.pageX;
        const newMouseY = moveEvent.pageY;
        const deltaY = newMouseY - startY;
        const deltaX = newMouseX - startX;
        layout.setMoving("move", deltaX, deltaY);
      };
      const trottledMove = throttle(handleMove, 5);
      const handleMouseUp = (upEvent) => {
        if (upEvent.button != 0)
          return;
        upEvent.stopPropagation();
        document.removeEventListener("mousemove", trottledMove);
        document.removeEventListener("mouseup", handleMouseUp);
        const newMouseX = upEvent.pageX;
        const newMouseY = upEvent.pageY;
        const deltaY = newMouseY - startY;
        const deltaX = newMouseX - startX;
        layout.setMoving("final", deltaX, deltaY);
      };
      document.addEventListener("mousemove", trottledMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
  }
  setXmlAttr(_key, value) {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "move":
        this._movable = toBool(value);
        this._renderCssCursor();
        break;
      case "resize":
        this._resize = value == "0" ? "" : value;
        this._renderCssCursor();
        break;
      default:
        return false;
    }
    return true;
  }
  _renderCssCursor() {
    if (this._movable) {
      this._unregisterResizingEvents();
      this._div.style.removeProperty("cursor");
      this._canResize = MOVE;
      this._registerMovingEvents();
    } else {
      this._unregisterMovingEvents();
      switch (this._resize) {
        case "right":
          this._div.style.cursor = "e-resize";
          this._canResize = RIGHT;
          break;
        case "left":
          this._div.style.cursor = "w-resize";
          this._canResize = LEFT;
          break;
        case "top":
          this._div.style.cursor = "n-resize";
          this._canResize = TOP;
          break;
        case "bottom":
          this._div.style.cursor = "s-resize";
          this._canResize = BOTTOM;
          break;
        case "topleft":
          this._div.style.cursor = "nw-resize";
          this._canResize = TOP | LEFT;
          break;
        case "topright":
          this._div.style.cursor = "ne-resize";
          this._canResize = TOP | RIGHT;
          break;
        case "bottomleft":
          this._div.style.cursor = "sw-resize";
          this._canResize = BOTTOM | LEFT;
          break;
        case "bottomright":
          this._div.style.cursor = "se-resize";
          this._canResize = BOTTOM | RIGHT;
          break;
        default:
          this._div.style.removeProperty("cursor");
          this._canResize = 0;
      }
      if (this._canResize != 0) {
        this._registerResizingEvents();
      } else {
        this._unregisterResizingEvents();
      }
    }
  }
  _registerResizingEvents() {
    if (this._resizingEventsRegistered) {
      return;
    }
    this._resizingEventsRegistered = true;
    this._div.addEventListener("mousedown", this._handleResizing);
  }
  _unregisterResizingEvents() {
    if (this._resizingEventsRegistered) {
      this._div.removeEventListener("mousedown", this._handleResizing);
      this._resizingEventsRegistered = false;
    }
  }
  _registerMovingEvents() {
    if (this._movingEventsRegistered) {
      return;
    }
    this._movingEventsRegistered = true;
    this._div.addEventListener("mousedown", this._handleMoving);
  }
  _unregisterMovingEvents() {
    if (this._movingEventsRegistered) {
      this._div.removeEventListener("mousedown", this._handleMoving);
      this._movingEventsRegistered = false;
    }
  }
  draw() {
    super.draw();
    if (this._ghost || this._sysregion == -2) {
      this._div.style.pointerEvents = "none";
    } else if (this._movable || this._canResize) {
      this._div.style.pointerEvents = "auto";
    } else if (this._ghost) {
      this._div.style.pointerEvents = "none";
    }
  }
}
