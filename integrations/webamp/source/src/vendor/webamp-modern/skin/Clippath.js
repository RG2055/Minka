import {hexToRgb} from "../utils.js";
export class Edges {
  constructor() {
    this._top = [];
    this._right = [];
    this._bottom = [];
    this._left = [];
    this.simplify = true;
  }
  opaqueByTransparent(x, y) {
    return this._data.data[(x + y * this._w) * 4 + 3] != 0;
  }
  parseCanvasTransparency(canvas, preferedWidth = null, preferedHeight = null) {
    this.opaque = this.opaqueByTransparent;
    this._parseCanvasTransparency(canvas, preferedWidth, preferedHeight);
  }
  parseCanvasTransparencyByNonColor(canvas, color) {
    const rgb = hexToRgb(color);
    this.opaque = (x, y) => {
      return this._data.data[(x + y * this._w) * 4 + 0] == rgb.r && this._data.data[(x + y * this._w) * 4 + 1] == rgb.g && this._data.data[(x + y * this._w) * 4 + 2] == rgb.b;
    };
    this._parseCanvasTransparency(canvas, null, null);
  }
  parseCanvasTransparencyByColor(canvas, color) {
    const sum = (r, g, b) => r | g << 8 | b << 16;
    const rgb = hexToRgb(color);
    const transparent = sum(rgb.r, rgb.g, rgb.b);
    this.opaque = (x, y) => {
      const start = (x + y * this._w) * 4;
      const data = this._data.data.slice(start, start + 4);
      const result = sum(data[0], data[1], data[2]) != transparent;
      return result;
    };
    this._parseCanvasTransparency(canvas, null, null);
  }
  _parseCanvasTransparency(canvas, preferedWidth = null, preferedHeight = null) {
    const w = preferedWidth || canvas.width;
    const h = preferedHeight || canvas.height;
    this._w = w;
    const ctx = canvas.getContext("2d");
    this._data = ctx.getImageData(0, 0, w, h);
    let points = [];
    var x, y, lastX, lastY;
    function post(x2, y2, ax, ay) {
      points.push([ax, ay]);
      lastX = x2;
      lastY = y2;
    }
    points = [];
    for (x = 0; x < w; x++) {
      for (y = 0; y < h; y++) {
        if (this.opaque(x, y)) {
          post(x, y, x, y);
          post(x, y, x + 1, y);
          break;
        }
      }
    }
    this._top = points;
    const lastTop = lastY;
    const firstTop = points.length > 0 ? points[0][1] : 0;
    points = [];
    for (y = lastTop; y < h; y++) {
      for (x = w - 1; x >= 0; x--) {
        if (this.opaque(x, y)) {
          post(x, y, x + 1, y);
          post(x, y, x + 1, y + 1);
          break;
        }
      }
    }
    this._right = points;
    const lastRight = lastX;
    points = [];
    for (x = lastRight; x >= 0; x--) {
      for (y = h - 1; y >= 0; y--) {
        if (this.opaque(x, y)) {
          post(x, y, x + 1, y + 1);
          post(x, y, x, y + 1);
          break;
        }
      }
    }
    this._bottom = points;
    const lastBottom = lastY;
    points = [];
    for (y = lastBottom; y >= firstTop; y--) {
      for (x = 0; x < w; x++) {
        if (this.opaque(x, y)) {
          post(x, y, x, y + 1);
          post(x, y, x, y);
          break;
        }
      }
    }
    this._left = points;
  }
  _buildPoint(points) {
    const result = this.simplify ? simplifyPoints(points) : points;
    return result.map((point) => `${point[0]}px ${point[1]}px`).join(", ");
  }
  gettop() {
    return this._buildPoint(this._top);
  }
  getright() {
    return this._buildPoint(this._right);
  }
  getbottom() {
    return this._buildPoint(this._bottom);
  }
  getleft() {
    return this._buildPoint(this._left);
  }
  isSimpleRect() {
    return this._top.length == 2 && this._bottom.length == 2;
  }
  getPolygon() {
    const points = [
      ...this._top,
      ...this._right,
      ...this._bottom,
      ...this._left
    ];
    return `polygon(${this._buildPoint(points)})`;
  }
}
function simplifyPoints(points) {
  const result = [];
  let i = 0;
  let [lx, ly] = [-1, -1];
  let [llx, lly] = [-2, -2];
  while (i < points.length) {
    const next = () => {
      llx = lx;
      lly = ly;
      lx = x;
      ly = y;
      i++;
    };
    const [x, y] = points[i];
    if (x == lx && y == ly) {
      next();
      continue;
    }
    if (result.length >= 2) {
      const [px, py] = result[result.length - 1];
      const [ppx, ppy] = result[result.length - 2];
      if (x == px && (py != ppy || px == ppx)) {
        const [xx, yy] = result.pop();
        result.push([xx, y]);
        next();
        continue;
      }
      if (y == py && (px != ppx || py == ppy)) {
        const [xx, xy] = result.pop();
        result.push([x, xy]);
        next();
        continue;
      }
    }
    result.push([x, y]);
    next();
  }
  return result;
}
