/* Generates the bundled "Spotify" classic Winamp 2 skin (public/skins/spotify.wsz).
 *
 * A Webamp skin is a .wsz archive of BMP/PNG sprite sheets plus text
 * configuration (PLEDIT.TXT, VISCOLOR.TXT, region.txt). Rather than shipping
 * hand-drawn bitmaps, this tool paints the whole set from a small palette and
 * a list of shapes, so the look can be retuned by editing numbers.
 *
 * The design follows the Spotify reading of Winamp: flat near-black surfaces,
 * one green accent (#1ed760), no bevels on the bodies, thin 1px rims, and a
 * progress bar / volume bar drawn as the familiar rounded Spotify tracks.
 *
 *   node tools/make-spotify-skin.mjs
 *
 * Writes public/skins/spotify.wsz and a preview PNG next to it.
 */

import { deflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SPRITES = JSON.parse(readFileSync(join(HERE, "classic-sprite-map.json"), "utf8"));

/* ---------------------------------------------------------------- palette -- */

const P = {
  // Surfaces, darkest to lightest.
  base: [9, 9, 9],            // window body
  surface: [18, 18, 18],      // raised panel (#121212, Spotify's card)
  surfaceHi: [24, 24, 24],    // the one lit panel per window
  surfaceLo: [5, 5, 5],       // recessed wells (display, playlist list)
  rim: [40, 40, 40],          // 1px window rim
  rimSoft: [30, 30, 30],
  line: [56, 56, 56],

  green: [30, 215, 96],       // #1ed760
  greenDim: [22, 156, 71],
  greenDark: [12, 82, 40],

  text: [255, 255, 255],
  textDim: [179, 179, 179],   // #b3b3b3
  textMuted: [122, 122, 122],
  black: [0, 0, 0],

  // Playlist / list palette (PLEDIT.TXT also carries these).
  plNormal: "#b3b3b3",
  plCurrent: "#ffffff",
  plNormalBg: "#0a0a0a",
  plSelectedBg: "#1ed760",
  plFont: "Arial"
};

/* ------------------------------------------------------------- PNG writer -- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** RGBA pixel buffer -> PNG bytes. */
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

/* -------------------------------------------------------------- the canvas -- */

/** A tiny RGBA canvas: everything the skin needs, nothing else. */
class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
  }

  idx(x, y) {
    return (y * this.width + x) * 4;
  }

  /** Opaque pixel. Coordinates outside the canvas are ignored. */
  set(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = this.idx(x, y);
    this.data[i] = color[0];
    this.data[i + 1] = color[1];
    this.data[i + 2] = color[2];
    this.data[i + 3] = color.length > 3 ? color[3] : 255;
  }

  /** Fully transparent pixel (skins use alpha for the shaped corners). */
  clear(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.data.fill(0, this.idx(x, y), this.idx(x, y) + 4);
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return [0, 0, 0, 0];
    const i = this.idx(x, y);
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  rect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) this.set(xx, yy, color);
    }
  }

  /** Rounded rectangle; `r` is the corner radius in pixels. */
  round(x, y, w, h, r, color) {
    const rad = Math.max(0, Math.min(r, Math.floor(Math.min(w, h) / 2)));
    for (let yy = 0; yy < h; yy += 1) {
      for (let xx = 0; xx < w; xx += 1) {
        if (rad > 0) {
          const cx = xx < rad ? rad - 0.5 : xx > w - rad - 1 ? w - rad - 0.5 : xx;
          const cy = yy < rad ? rad - 0.5 : yy > h - rad - 1 ? h - rad - 0.5 : yy;
          const dx = xx - cx;
          const dy = yy - cy;
          if (dx * dx + dy * dy > rad * rad) continue;
        }
        this.set(x + xx, y + yy, color);
      }
    }
  }

  /** 1px outline of a rounded rectangle. */
  roundOutline(x, y, w, h, r, color) {
    const inner = new Canvas(w, h);
    inner.round(0, 0, w, h, r, color);
    const hole = new Canvas(w, h);
    hole.round(1, 1, Math.max(0, w - 2), Math.max(0, h - 2), Math.max(0, r - 1), color);
    for (let yy = 0; yy < h; yy += 1) {
      for (let xx = 0; xx < w; xx += 1) {
        if (inner.get(xx, yy)[3] > 0 && hole.get(xx, yy)[3] === 0) this.set(x + xx, y + yy, color);
      }
    }
  }

  hline(x, y, w, color) {
    for (let i = 0; i < w; i += 1) this.set(x + i, y, color);
  }

  vline(x, y, h, color) {
    for (let i = 0; i < h; i += 1) this.set(x, y + i, color);
  }

  /** Vertical gradient band. */
  vgrad(x, y, w, h, from, to) {
    for (let i = 0; i < h; i += 1) {
      const t = h <= 1 ? 0 : i / (h - 1);
      const c = [
        Math.round(from[0] + (to[0] - from[0]) * t),
        Math.round(from[1] + (to[1] - from[1]) * t),
        Math.round(from[2] + (to[2] - from[2]) * t)
      ];
      this.hline(x, y + i, w, c);
    }
  }

  /** Copies a rectangle from another canvas (sprite placement). */
  blit(src, sx, sy, sw, sh, dx, dy) {
    for (let yy = 0; yy < sh; yy += 1) {
      for (let xx = 0; xx < sw; xx += 1) {
        this.set(dx + xx, dy + yy, src.get(sx + xx, sy + yy));
      }
    }
  }

  /** Scale-nearest copy: the 9px digits are drawn once and reused at other sizes. */
  scaledBlit(src, sx, sy, sw, sh, dx, dy, dw, dh) {
    for (let yy = 0; yy < dh; yy += 1) {
      for (let xx = 0; xx < dw; xx += 1) {
        const px = sx + Math.min(sw - 1, Math.floor((xx / dw) * sw));
        const py = sy + Math.min(sh - 1, Math.floor((yy / dh) * sh));
        this.set(dx + xx, dy + yy, src.get(px, py));
      }
    }
  }

  png() {
    return encodePng(this.width, this.height, this.data);
  }
}

/* ---------------------------------------------------------------- 3x5 font -- */

// The classic TEXT.bmp is a 5x6 bitmap font the player uses for the playlist
// title and the generated windows' titles. A 3x5 pixel font drawn from ASCII
// art keeps the skin's own consistency and is easy to extend.
const GLYPHS = {
  A: [".#.", "#.#", "#.#", "###", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  N: ["#.#", "###", "###", "###", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "###", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", ".##"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "###", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["##.", "..#", ".#.", "#..", "###"],
  3: ["##.", "..#", ".#.", "..#", "##."],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "##.", "..#", "##."],
  6: [".##", "#..", "###", "#.#", "###"],
  7: ["###", "..#", ".#.", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "#.."],
  '"': [".#.", ".#.", "...", "...", "..."],
  "\u2026": ["...", "...", "...", "...", "###"],
  ".": ["...", "...", "...", "...", ".#."],
  ":": ["...", ".#.", "...", ".#.", "..."],
  "(": [".#.", "#..", "#..", "#..", ".#."],
  ")": [".#.", "..#", "..#", "..#", ".#."],
  "-": ["...", "...", "###", "...", "..."],
  "_": ["...", "...", "...", "...", "###"],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  "\\": ["#..", "#..", ".#.", "..#", "..#"],
  "[": [".##", ".#.", ".#.", ".#.", ".##"],
  "]": ["##.", ".#.", ".#.", ".#.", "##."],
  "!": [".#.", ".#.", ".#.", "...", ".#."],
  "'": [".#.", ".#.", "...", "...", "..."],
  ",": ["...", "...", "...", ".#.", "#.."],
  "&": [".##", "#.#", ".#.", "#.#", ".##"],
  "%": ["#.#", "..#", ".#.", "#..", "#.#"],
  "=": ["...", "###", "...", "###", "..."],
  "*": ["...", "#.#", ".#.", "#.#", "..."],
  "$": [".#.", "###", ".#.", "###", ".#."],
  "#": ["#.#", "###", "#.#", "###", "#.#"],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  "@": [".#.", "#.#", "###", "###", ".#."],
  "<": ["..#", ".#.", "#..", ".#.", "..#"],
  ">": ["#..", ".#.", "..#", ".#.", "#.."],
  "{": ["..#", ".#.", "##.", ".#.", "..#"],
  "}": ["#..", ".#.", ".##", ".#.", "#.."],
  "^": [".#.", "#.#", "...", "...", "..."],
  " ": ["...", "...", "...", "...", "..."]
};

// TEXT.bmp is 155x18: three rows of 31 five-pixel cells. Upper case and
// punctuation live on the first row, digits and symbols on the second, and the
// third holds the accented capitals.
const TEXT_CELLS = 31;
const TEXT_CHAR_W = 5;
const TEXT_CHAR_H = 6;

/** Draws the glyph grid into the 155x18 TEXT sheet. */
function paintTextSheet() {
  const c = new Canvas(155, 18);
  const place = (ch, row, col) => {
    const glyph = GLYPHS[ch] ?? GLYPHS["?"];
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        if (glyph[y][x] === "#") c.set(col * TEXT_CHAR_W + x, row * TEXT_CHAR_H + y, P.text);
      }
    }
  };
  const row0 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ\"@".split("");
  row0.forEach((ch, i) => place(ch, 0, i));
  const row1 = "0123456789\u2026.:()-'!_+\\/[]^&%,=$#".split("");
  row1.forEach((ch, i) => place(ch, 1, i));
  place("\u00c5", 2, 0);      // Å
  place("\u00d6", 2, 1);      // Ö
  place("\u00c4", 2, 2);      // Ä
  place("?", 2, 3);
  place("*", 2, 4);
  return c;
}

/* --------------------------------------------------------- shared helpers -- */

/** A display well: near-black recess with a 1px rim, as used by every readout. */
function well(c, x, y, w, h, radius = 2) {
  if (radius > 0) {
    c.round(x, y, w, h, radius, P.surfaceLo);
    c.roundOutline(x, y, w, h, radius, [26, 26, 26]);
  } else {
    c.rect(x, y, w, h, P.surfaceLo);
    c.hline(x, y, w, [26, 26, 26]);
  }
}

/** A raised control plate (button face, panel). */
function plate(c, x, y, w, h, radius, color = P.surface) {
  if (radius > 0) {
    c.round(x, y, w, h, radius, color);
    c.roundOutline(x, y, w, h, radius, [34, 34, 34]);
  } else {
    c.rect(x, y, w, h, color);
    c.hline(x, y, w, [34, 34, 34]);
  }
}

/** The 5x5 Spotify "play/pause/stop" glyph set. */
function transportGlyph(kind, color) {
  // 23x18 button sprite with a 9x9 glyph centred.
  const c = new Canvas(23, 18);
  const gx = 7;
  const gy = 4;
  const put = (x, y) => c.set(gx + x, gy + y, color);
  if (kind === "play") {
    for (let col = 0; col < 5; col += 1) {
      const h = 9 - col * 2;
      for (let row = 0; row < h; row += 1) put(col, Math.floor((9 - h) / 2) + row);
    }
  } else if (kind === "pause") {
    for (let row = 0; row < 9; row += 1) {
      put(0, row); put(1, row); put(3, row); put(4, row);
      put(6, row); put(7, row);
    }
  } else if (kind === "stop") {
    for (let row = 1; row < 8; row += 1) for (let col = 1; col < 8; col += 1) put(col, row);
  } else if (kind === "prev") {
    for (let row = 0; row < 9; row += 1) put(0, row);
    for (let col = 2; col < 6; col += 1) {
      const h = 9 - (col - 2) * 2;
      for (let row = 0; row < h; row += 1) put(col, Math.floor((9 - h) / 2) + row);
    }
    for (let row = 0; row < 9; row += 1) put(7, row);
  } else if (kind === "next") {
    for (let col = 1; col < 5; col += 1) {
      const h = 1 + col * 2;
      for (let row = 0; row < h; row += 1) put(col, Math.floor((9 - h) / 2) + row);
    }
    for (let row = 0; row < 9; row += 1) put(6, row);
  } else if (kind === "eject") {
    for (let row = 7; row < 9; row += 1) for (let col = 2; col < 8; col += 1) put(col, row);
    for (let col = 2; col < 8; col += 1) {
      const h = (8 - col) * 2;
      for (let row = 0; row < h; row += 1) put(col, 6 - h + row);
    }
  }
  return c;
}

/** A small rounded "pill" used for the shuffle / repeat / eq / playlist toggles. */
function pillButton(w, h, label, options = {}) {
  const { active = false, hover = false, pressed = false, icon = null } = options;
  const c = new Canvas(w, h);
  const bg = pressed ? P.surfaceLo : active ? P.greenDark : hover ? P.surfaceHi : P.surface;
  const rim = active ? P.green : hover ? [58, 58, 58] : [38, 38, 38];
  c.round(0, 0, w, h, 2, bg);
  c.roundOutline(0, 0, w, h, 2, rim);
  const fg = active ? P.green : hover ? P.text : P.textDim;
  const g = GLYPHS[label] ?? GLYPHS["?"];
  // Centre the label; 3x5 glyphs are tiny but readable at 1x, which is what
  // the classic windows are drawn at.
  const textW = label.length * 4 - 1;
  const tx = icon ? 3 : Math.max(2, Math.round((w - textW) / 2));
  const ty = Math.round((h - 5) / 2);
  label.split("").forEach((ch, i) => {
    const glyph = GLYPHS[ch] ?? GLYPHS["?"];
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        if (glyph[y][x] === "#") c.set(tx + i * 4 + x, ty + y, fg);
      }
    }
  });
  if (icon) {
    const gx = w - 9;
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        if ((GLYPHS[icon] ?? GLYPHS["?"])[y][x] === "#") c.set(gx + x, ty + y, fg);
      }
    }
  }
  return c;
}

/** The 9x9 window control glyphs (menu, minimize, shade, close). */
function windowGlyph(kind, selected) {
  const c = new Canvas(9, 9);
  const fg = selected ? P.text : P.textDim;
  if (kind === "menu") {
    for (let row = 1; row < 8; row += 2) { c.hline(1, row, 7, fg); }
  } else if (kind === "minimize") {
    c.hline(2, 5, 5, fg);
    c.hline(2, 4, 5, fg === P.textDim ? P.textMuted : fg);
  } else if (kind === "shade") {
    c.hline(2, 3, 5, fg);
    c.hline(2, 6, 5, fg);
  } else if (kind === "close") {
    for (let i = 0; i < 5; i += 1) {
      c.set(2 + i, 2 + i, fg);
      c.set(6 - i, 2 + i, fg);
    }
  } else if (kind === "expand") {
    c.roundOutline(0, 0, 9, 9, 2, [40, 40, 40]);
    for (let i = 0; i < 4; i += 1) {
      c.set(2 + i, 6 - i, fg);
      c.set(6 - i, 6 - i, fg);
    }
  } else if (kind === "collapse") {
    c.roundOutline(0, 0, 9, 9, 2, [40, 40, 40]);
    for (let i = 0; i < 4; i += 1) {
      c.set(2 + i, 3 + i, fg);
      c.set(6 - i, 3 + i, fg);
    }
  }
  return c;
}

/** The 9x13 seven-segment time digits, drawn in the accent colour. */
function digits(exprW) {
  const c = new Canvas(exprW, 13);
  const on = P.green;
  const off = [22, 44, 30];
  const seg = (x, y, w, h, lit) => {
    const col = lit ? on : off;
    if (w === 1) { for (let i = 0; i < h; i += 1) c.set(x, y + i, col); }
    else c.rect(x, y, w, h, col);
  };
  // Segment layout inside a 9x13 cell: a,b,c,d,e,f,g.
  const paint = (x, bits) => {
    const [a, b, cc, d, e, f, g] = bits;
    seg(x + 2, 1, 5, 1, a);      // top
    seg(x + 7, 2, 1, 4, b);      // top right
    seg(x + 7, 8, 1, 4, cc);     // bottom right
    seg(x + 2, 12, 5, 1, d);     // bottom
    seg(x + 1, 8, 1, 4, e);      // bottom left
    seg(x + 1, 2, 1, 4, f);      // top left
    seg(x + 2, 7, 5, 1, g);      // middle
  };
  const shapes = {
    0: [1, 1, 1, 1, 1, 1, 0], 1: [0, 1, 1, 0, 0, 0, 0], 2: [1, 1, 0, 1, 1, 0, 1],
    3: [1, 1, 1, 1, 0, 0, 1], 4: [0, 1, 1, 0, 0, 1, 1], 5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1], 7: [1, 1, 1, 0, 0, 0, 0], 8: [1, 1, 1, 1, 1, 1, 1],
    9: [1, 1, 1, 1, 0, 1, 1]
  };
  return { canvas: c, paint, shapes };
}

/** Builds the 90x13 NUMBERS sheet (0-9, minus, no-minus). */
function numbersSheet(dimColor = [34, 68, 46]) {
  const c = new Canvas(90, 13);
  const on = P.green;
  const seg = (x, y, w, h, col) => {
    if (w === 1) { for (let i = 0; i < h; i += 1) c.set(x, y + i, col); }
    else c.rect(x, y, w, h, col);
  };
  const shapes = {
    0: [1, 1, 1, 1, 1, 1, 0], 1: [0, 1, 1, 0, 0, 0, 0], 2: [1, 1, 0, 1, 1, 0, 1],
    3: [1, 1, 1, 1, 0, 0, 1], 4: [0, 1, 1, 0, 0, 1, 1], 5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1], 7: [1, 1, 1, 0, 0, 0, 0], 8: [1, 1, 1, 1, 1, 1, 1],
    9: [1, 1, 1, 1, 0, 1, 1]
  };
  const draw = (x, digit, lit) => {
    const [a, b, cc, d, e, f, g] = shapes[digit];
    const col = (bit) => (lit === "dim" ? dimColor : bit ? on : dimColor);
    seg(x + 2, 1, 5, 1, col(a));
    seg(x + 7, 2, 1, 4, col(b));
    seg(x + 7, 8, 1, 4, col(cc));
    seg(x + 2, 12, 5, 1, col(d));
    seg(x + 1, 8, 1, 4, col(e));
    seg(x + 1, 2, 1, 4, col(f));
    seg(x + 2, 7, 5, 1, col(g));
  };
  for (let d = 0; d <= 9; d += 1) draw(d * 9, d, "on");
  // NO_MINUS_SIGN at x=9,y=6 (a dark 5x1) and MINUS_SIGN at x=20,y=6 (lit).
  c.rect(9, 6, 5, 1, dimColor);
  c.rect(20, 6, 5, 1, on);
  return c;
}

/* -------------------------------------------------------------- MAIN.bmp -- */

/* The main window is 275x116. Every element below sits where Webamp's own
   stylesheet puts it, so the painting lines up with the live controls:

     title-bar      0,0    275x14
     clutter-bar   10,22     8x43
     play-pause    26,28     9x9      work-indicator 24,28 3x9
     time          39,26    59x13
     marquee      111,24   154x6
     visualizer    24,43
     kbps         111,43    15x6      khz 156,43 10x6   mono/stereo 212,41 57x12
     volume       107,57    68x13
     balance      177,57    38x13
     windows      219,58    46x12     (EQ 0, PL 23)
     position      16,72   248x10
     actions       16,88    (5 x 23x18, next 22 wide at 108)
     eject        136,89    22x16
     shuffle-repeat 164,89  74x15
     about        253,91    13x15
*/
function paintMain() {
  const c = new Canvas(275, 116);

  // Body: flat near-black, no bevel — the Spotify surface.
  c.rect(0, 0, 275, 116, P.base);

  // Title bar band, one step lighter, with the accent hairline that marks the
  // active surface in the Spotify client.
  c.rect(1, 1, 273, 13, [32, 32, 32]);
  c.hline(1, 14, 273, [52, 52, 52]);
  c.rect(8, 11, 30, 3, P.green);

  // The display: one large recessed pocket holding the clock, the marquee and
  // the spectrum analyser. Bevel-free: a darker fill inside a 1px rim.
  c.round(6, 19, 263, 40, 4, [4, 4, 4]);
  c.roundOutline(6, 19, 263, 40, 4, [44, 44, 44]);
  c.roundOutline(7, 20, 261, 38, 3, [22, 22, 22]);

  // Clutter bar: a thin recessed strip with five indicator cells.
  c.round(11, 23, 9, 41, 3, [4, 4, 4]);
  c.roundOutline(11, 23, 9, 41, 3, [42, 42, 42]);

  // Volume and balance rails.
  volumeTrack(c, 107, 57, 68, 13);
  volumeTrack(c, 177, 57, 38, 13);

  // EQ / PL toggle plates.
  plate(c, 219, 58, 23, 12, 2, [26, 26, 26]);
  plate(c, 242, 58, 23, 12, 2, [26, 26, 26]);

  // Progress rail.
  progressRail(c, 16, 72, 248, 10);

  // Transport cluster and the plates beside it.
  plate(c, 14, 86, 118, 22, 4, [24, 24, 24]);
  plate(c, 134, 87, 26, 20, 4, [24, 24, 24]);
  plate(c, 162, 87, 78, 17, 4, [24, 24, 24]);

  // The green "about" dot that stands in for Winamp's llama mark.
  c.round(256, 90, 12, 17, 3, [26, 26, 26]);
  for (let y = 0; y < 5; y += 1) for (let x = 0; x < 5; x += 1) {
    const dx = x - 2, dy = y - 2;
    if (dx * dx + dy * dy <= 5) c.set(260 + x, 96 + y, P.green);
  }

  return c;
}

/** One of the two Spotify-style horizontal rails (volume, balance). */
function volumeTrack(c, x, y, w, h) {
  const railH = 4;
  const railY = y + Math.round((h - railH) / 2);
  // Rail: a flat grey track; Webamp paints the filled portion with the thumb
  // sprite, so the track itself only has to read as "empty".
  c.round(x, railY, w, railH, 2, [82, 82, 82]);
  c.roundOutline(x, railY, w, railH, 2, [48, 48, 48]);
}

/** The progress bar rail: a rounded track with a small green nub at the start. */
function progressRail(c, x, y, w, h) {
  const railH = 4;
  const railY = y + Math.round((h - railH) / 2);
  c.round(x, railY, w, railH, 2, [82, 82, 82]);
  c.roundOutline(x, railY, w, railH, 2, [48, 48, 48]);
}

/* ------------------------------------------------------------ sprite sets -- */

/** MAIN.bmp: the whole window is one sprite. */
function sheetMain() {
  return paintMain();
}

/** TITLEBAR.bmp (344x87): the bar, its four controls, shade bar, clutter bar. */
function sheetTitlebar() {
  const c = new Canvas(344, 87);

  // Active / inactive bars: active gets the accent hairline, inactive stays flat.
  const bar = (y, active) => {
    c.rect(0, y, 275, 14, active ? [26, 26, 26] : [18, 18, 18]);
    c.hline(0, y, 275, active ? [44, 44, 44] : [30, 30, 30]);
    c.hline(0, y + 13, 275, active ? [16, 16, 16] : [12, 12, 12]);
    if (active) {
      // A short accent tick under the title, the Spotify "now playing" cue.
      c.rect(6, y + 12, 24, 1, P.green);
    }
  };
  bar(0, true);    // MAIN_TITLE_BAR_SELECTED
  bar(15, false);  // MAIN_TITLE_BAR
  bar(57, true);   // easter egg selected
  bar(72, false);  // easter egg

  // Window controls (9x9), at x 0/9/18.
  const controls = [
    ["menu", 0], ["minimize", 9], ["close", 18]
  ];
  for (const [kind, x] of controls) {
    c.blit(windowGlyph(kind, false), 0, 0, 9, 9, x, 0);
    c.blit(windowGlyph(kind, true), 0, 0, 9, 9, x, 9);
  }
  // Shade button uses the same menu glyph cell but its own two states.
  c.blit(windowGlyph("shade", false), 0, 0, 9, 9, 0, 18);
  c.blit(windowGlyph("shade", true), 0, 0, 9, 9, 9, 18);

  // Shade bar background (275x14) at y=29 selected, y=42 normal.
  const shadeBar = (y, active) => {
    c.rect(27, y, 275, 14, active ? [24, 24, 24] : [18, 18, 18]);
    c.hline(27, y, 275, active ? [44, 44, 44] : [30, 30, 30]);
  };
  shadeBar(29, true);
  shadeBar(42, false);

  // Selected shade button.
  c.blit(windowGlyph("shade", true), 0, 0, 9, 9, 0, 27);
  c.blit(windowGlyph("shade", false), 0, 0, 9, 9, 9, 27);

  // Shade position slider: a 17x7 track and a 3x7 thumb (native + left/right
  // halves, as the classic skin provides).
  const track = (x, y) => {
    c.round(x, y + 2, 17, 3, 1, [50, 50, 50]);
  };
  track(0, 36);
  c.rect(20, 36, 3, 7, P.green);
  c.rect(17, 36, 3, 7, P.green);
  c.rect(23, 36, 3, 7, P.green);

  // Clutter bar (8x43) + its five indicator cells.
  c.rect(304, 0, 8, 43, P.surfaceLo);
  c.roundOutline(304, 0, 8, 43, 2, [30, 30, 30]);
  c.rect(312, 0, 8, 43, [14, 14, 14]);
  const dots = [["o", 47, 8], ["a", 55, 7], ["i", 62, 7], ["d", 69, 8], ["v", 77, 7]];
  for (const [, y, h] of dots) {
    c.rect(304, y, 8, h, P.greenDim);
    c.rect(312, y, 8, h, [30, 30, 30]);
  }

  return c;
}

/** CBUTTONS.bmp (136x36): the six transport buttons, normal and pressed. */
function sheetCButtons() {
  const c = new Canvas(136, 36);
  const order = [
    ["prev", 0, 23], ["play", 23, 23], ["pause", 46, 23],
    ["stop", 69, 23], ["next", 92, 23], ["eject", 114, 22]
  ];
  for (const [kind, x, w] of order) {
    const h = kind === "eject" ? 16 : 18;
    const onY = kind === "eject" ? 16 : 18;
    // Normal: the glyph in muted grey on the plate colour.
    const normal = transportGlyph(kind, P.textDim);
    c.blit(normal, 0, 0, Math.min(w, 23), h, x, 0);
    // Pressed/active: the glyph in the accent, nudged 1px down.
    const active = transportGlyph(kind, P.green);
    c.blit(active, 0, 0, Math.min(w, 23), h, x, onY);
  }
  // Eject is 22 wide in the sheet; trim the overhang from its neighbour.
  for (let y = 0; y < 36; y += 1) for (let x = 136 - 22; x < 136; x += 1) { /* keep */ }
  return c;
}

/** SHUFREP.bmp (92x85): shuffle / repeat / EQ / PL toggles in four states. */
function sheetShufRep() {
  const c = new Canvas(92, 85);
  const place = (x, y, w, h, label, state) => {
    const btn = pillButton(w, h, label, state);
    c.blit(btn, 0, 0, w, h, x, y);
  };
  // Shuffle (47x15) at x=28; columns: normal, pressed, selected, selected+pressed.
  place(28, 0, 47, 15, "SHUF", {});
  place(28, 15, 47, 15, "SHUF", { pressed: true });
  place(28, 30, 47, 15, "SHUF", { active: true });
  place(28, 45, 47, 15, "SHUF", { active: true, pressed: true });
  // Repeat (28x15) at x=0.
  place(0, 0, 28, 15, "REP", {});
  place(0, 15, 28, 15, "REP", { pressed: true });
  place(0, 30, 28, 15, "REP", { active: true });
  place(0, 45, 28, 15, "REP", { active: true, pressed: true });
  // EQ (23x12) and PL (23x12).
  place(0, 61, 23, 12, "EQ", {});
  place(0, 73, 23, 12, "EQ", { active: true });
  place(46, 61, 23, 12, "EQ", { pressed: true });
  place(46, 73, 23, 12, "EQ", { active: true, pressed: true });
  place(23, 61, 23, 12, "PL", {});
  place(23, 73, 23, 12, "PL", { active: true });
  place(69, 61, 23, 12, "PL", { pressed: true });
  place(69, 73, 23, 12, "PL", { active: true, pressed: true });
  return c;
}

/** PLAYPAUS.bmp (48x9): the five transport state indicators. */
function sheetPlayPaus() {
  const c = new Canvas(48, 9);
  const dot = (x, col) => {
    for (let y = 0; y < 9; y += 1) for (let xx = 0; xx < 9; xx += 1) {
      const dx = xx - 4;
      const dy = y - 4;
      if (dx * dx + dy * dy <= 16) c.set(x + xx, y, col);
    }
  };
  dot(0, P.green);            // playing/stop indicator (Webamp toggles class)
  dot(9, P.green);            // paused
  dot(18, [70, 70, 70]);      // stopped
  dot(36, [46, 46, 46]);      // not working
  // Working: a small green arc.
  for (let y = 2; y < 9; y += 1) for (let xx = 2; xx < 9; xx += 1) {
    const dx = xx - 5;
    const dy = y - 5;
    const d = dx * dx + dy * dy;
    if (d <= 16 && d >= 4) c.set(39 + xx, y, P.green);
  }
  return c;
}

/** MONOSTER.bmp (56x24): the MONO / STEREO readouts. */
function sheetMonoStereo() {
  const c = new Canvas(56, 24);
  const cell = (x, y, w, label, active) => {
    const bg = active ? P.greenDark : P.surfaceLo;
    const fg = active ? P.green : [70, 70, 70];
    c.round(x, y, w, 12, 2, bg);
    if (active) c.roundOutline(x, y, w, 12, 2, P.green);
    const tw = label.length * 4 - 1;
    const tx = x + Math.max(2, Math.round((w - tw) / 2));
    const ty = y + 4;
    label.split("").forEach((ch, i) => {
      const glyph = GLYPHS[ch] ?? GLYPHS["?"];
      for (let gy = 0; gy < 5; gy += 1) {
        for (let gx = 0; gx < 3; gx += 1) {
          if (glyph[gy][gx] === "#") c.set(tx + i * 4 + gx, ty + gy, fg);
        }
      }
    });
  };
  // Selected row (y=0) then normal row (y=12). STEREO is 29 wide, MONO 27.
  cell(0, 0, 29, "STEREO", true);
  cell(29, 0, 27, "MONO", false);
  cell(0, 12, 29, "STEREO", false);
  cell(29, 12, 27, "MONO", true);
  return c;
}

/** POSBAR.bmp (307x10): the progress rail and its 29x10 thumb. */
function sheetPosBar() {
  const c = new Canvas(307, 10);
  // Background: the rail the filled part runs along.
  c.round(0, 3, 248, 4, 2, [46, 46, 46]);
  c.roundOutline(0, 3, 248, 4, 2, [30, 30, 30]);
  // Thumb: a 3px green nub with a soft halo, the Spotify scrubber.
  const thumb = (x, halo) => {
    if (halo) for (let y = 0; y < 10; y += 1) for (let xx = 0; xx < 29; xx += 1) {
      const dx = (xx - 14) / 14;
      const dy = (y - 4.5) / 4.5;
      if (dx * dx + dy * dy <= 1) c.set(x + xx, y, [18, 66, 40]);
    }
    c.rect(x + 13, 1, 3, 8, P.green);
  };
  thumb(248, false);
  thumb(278, true);
  return c;
}

/** VOLUME.bmp (68x433) and BALANCE.bmp (47x433): rails with 14x11 thumbs. */
function sheetVolume() {
  const c = new Canvas(68, 433);
  // The background is stretched by Webamp (it repeats / scales), so paint a
  // vertical strip of the rail: 13px tall repeated over the whole sheet.
  c.rect(0, 0, 68, 420, [0, 0, 0, 0]);
  for (let y = 0; y < 420; y += 13) {
    c.round(27, y + 4, 14, 4, 2, [58, 58, 58]);
    c.roundOutline(27, y + 4, 14, 4, 2, [30, 30, 30]);
  }
  // Thumbs at y=422 (normal at x=15, selected at x=0).
  const thumb = (x) => {
    c.round(x, 422, 14, 11, 3, P.green);
    c.roundOutline(x, 422, 14, 11, 3, [12, 100, 48]);
  };
  thumb(0);
  thumb(15);
  return c;
}

function sheetBalance() {
  const c = new Canvas(47, 433);
  for (let y = 0; y < 420; y += 13) {
    c.round(9, y + 4, 38, 4, 2, [58, 58, 58]);
    c.roundOutline(9, y + 4, 38, 4, 2, [30, 30, 30]);
  }
  const thumb = (x) => {
    c.round(x, 422, 14, 11, 3, P.green);
    c.roundOutline(x, 422, 14, 11, 3, [12, 100, 48]);
  };
  thumb(0);
  thumb(15);
  return c;
}

/** EQMAIN.bmp (275x315): the equalizer window. */
function sheetEqMain() {
  const c = new Canvas(275, 315);
  // Window background (0,0 275x116).
  c.rect(0, 0, 275, 116, P.base);
  c.vgrad(0, 14, 275, 18, [20, 20, 20], P.base);
  c.roundOutline(0, 0, 275, 116, 3, P.rim);
  well(c, 12, 20, 251, 38, 3);     // the graph area
  well(c, 12, 62, 113, 22, 2);     // preamp label strip
  well(c, 130, 62, 113, 22, 2);    // balance strip
  // Slider background (13,164 209x129): the recessed bar field.
  c.rect(13, 164, 209, 129, P.surfaceLo);
  c.roundOutline(13, 164, 209, 129, 3, [30, 30, 30]);
  // Slider thumbs (11x11) at y=164 (normal) and y=176 (selected).
  const eqThumb = (y) => {
    c.round(0, y, 11, 11, 2, P.green);
    c.roundOutline(0, y, 11, 11, 2, [12, 100, 48]);
  };
  eqThumb(164);
  eqThumb(176);
  // Close button.
  c.blit(windowGlyph("close", false), 0, 0, 9, 9, 0, 116);
  c.blit(windowGlyph("close", true), 0, 0, 9, 9, 0, 125);
  // EQ ON / AUTO buttons (26x12 and 32x12) in four states.
  const eqBtn = (x, y, w, label, state) => c.blit(pillButton(w, 12, label, state), 0, 0, w, 12, x, y);
  eqBtn(10, 119, 26, "ON", {});
  eqBtn(10 + 59, 119, 26, "ON", { active: true });
  eqBtn(69, 119, 26, "ON", { pressed: true });
  eqBtn(187, 119, 26, "ON", { active: true, pressed: true });
  eqBtn(36, 119, 32, "AUTO", {});
  eqBtn(36 + 59, 119, 32, "AUTO", { active: true });
  eqBtn(154, 119, 32, "AUTO", { pressed: true });
  eqBtn(213, 119, 32, "AUTO", { active: true, pressed: true });
  // Maximize fallback button.
  c.blit(windowGlyph("expand", false), 0, 0, 9, 9, 254, 152);
  // Title bar (275x14) selected at y=134, normal at y=149.
  const bar = (y, active) => {
    c.rect(0, y, 275, 14, active ? [26, 26, 26] : [18, 18, 18]);
    c.hline(0, y, 275, active ? [44, 44, 44] : [30, 30, 30]);
    if (active) c.rect(6, y + 12, 24, 1, P.green);
  };
  bar(134, true);
  bar(149, false);
  // Graph background (113x19) and its line colours column (1x19).
  c.round(0, 294, 113, 19, 2, P.surfaceLo);
  c.roundOutline(0, 294, 113, 19, 2, [30, 30, 30]);
  for (let y = 0; y < 19; y += 1) {
    const t = y / 18;
    c.set(115, 294 + y, [
      Math.round(30 + (215 - 30) * t),
      Math.round(215 + (30 - 215) * t),
      Math.round(96 + (96 - 96) * t)
    ]);
  }
  // Preamp lines (the flat reference line inside each band).
  c.hline(0, 314, 113, [70, 70, 70]);
  // Presets button (44x12) at 224,164 and 224,176.
  c.blit(pillButton(44, 12, "PRESETS", {}), 0, 0, 44, 12, 224, 164);
  c.blit(pillButton(44, 12, "PRESETS", { active: true }), 0, 0, 44, 12, 224, 176);
  return c;
}

/** EQ_EX.bmp (275x56): the equalizer's windowshade view. */
function sheetEqEx() {
  const c = new Canvas(275, 56);
  const bar = (y, active) => {
    c.rect(0, y, 275, 14, active ? [26, 26, 26] : [18, 18, 18]);
    c.hline(0, y, 275, active ? [44, 44, 44] : [30, 30, 30]);
    if (active) c.rect(6, y + 12, 24, 1, P.green);
  };
  bar(0, true);
  bar(15, false);
  // Shade volume/balance slider halves (3x7 each) at y=30.
  const half = (x, edge) => {
    c.rect(x, 30, 3, 7, P.green);
    if (edge === "left") c.vline(x, 30, 7, [12, 100, 48]);
    if (edge === "right") c.vline(x + 2, 30, 7, [12, 100, 48]);
  };
  half(1, "left"); half(4, "center"); half(7, "right");
  half(11, "left"); half(14, "center"); half(17, "right");
  // Maximize / minimize / close buttons.
  c.blit(windowGlyph("expand", false), 0, 0, 9, 9, 1, 38);
  c.blit(windowGlyph("minimize", false), 0, 0, 9, 9, 1, 47);
  c.blit(windowGlyph("close", false), 0, 0, 9, 9, 11, 38);
  c.blit(windowGlyph("close", true), 0, 0, 9, 9, 11, 47);
  return c;
}

/** PLEDIT.bmp (280x186): the playlist window and its tool buttons. */
function sheetPlEdit() {
  const c = new Canvas(280, 186);

  const topBar = (y, active) => {
    c.rect(0, y, 280, 20, active ? [30, 30, 30] : [22, 22, 22]);
    c.hline(0, y, 280, active ? [48, 48, 48] : [32, 32, 32]);
    if (active) c.rect(8, y + 17, 26, 2, P.green);
  };
  // Top row, selected at y=0 (corners 25x20, title 100x20, tiles 25x20).
  topBar(0, true);
  topBar(21, false);

  // Middle tiles: left 12 wide, right 20 wide, 29 tall.
  const mid = (x, w) => {
    c.rect(x, 42, w, 29, P.surfaceLo);
  };
  mid(0, 12);
  mid(31, 20);

  // Bottom: left corner 125x38, right corner 150x38, tile 25x38.
  c.rect(0, 72, 125, 38, P.base);
  c.hline(0, 72, 125, P.rim);
  c.rect(126, 72, 150, 38, P.base);
  c.hline(126, 72, 150, P.rim);
  c.rect(179, 0, 25, 38, P.surfaceLo);

  // Visualizer background (75x38) at 205,0.
  c.rect(205, 0, 75, 38, [6, 10, 8]);
  c.roundOutline(205, 0, 75, 38, 2, [30, 30, 30]);

  // Shade backgrounds.
  c.rect(72, 57, 25, 14, [22, 22, 22]);   // TILE
  c.rect(72, 42, 25, 14, [30, 30, 30]);   // LEFT
  c.rect(99, 57, 50, 14, [22, 22, 22]);   // RIGHT
  c.rect(99, 42, 50, 14, [30, 30, 30]);   // RIGHT SELECTED

  // Scroll handle 8x18, at x=52 normal and x=61 selected.
  c.round(52, 53, 8, 18, 2, [70, 70, 70]);
  c.round(61, 53, 8, 18, 2, P.green);

  // Small window control glyphs at the top-right of the playlist.
  c.blit(windowGlyph("close", true), 0, 0, 9, 9, 52, 42);
  c.blit(windowGlyph("collapse", false), 0, 0, 9, 9, 62, 42);
  c.blit(windowGlyph("expand", false), 0, 0, 9, 9, 150, 42);

  // Tool buttons: 22x18 at the documented grid, drawn as flat icons.
  const tools = [
    [0, 111, "ADD URL", "plus"], [23, 111, null, "plus"], [0, 130, "ADD DIR", "plus"],
    [23, 130, null, "plus"], [0, 149, null, "plus"], [23, 149, null, "plus"],
    [54, 111, "REM ALL", "minus"], [77, 111, null, "minus"],
    [54, 130, "CROP", "minus"], [77, 130, null, "minus"],
    [54, 149, "REM SEL", "minus"], [77, 149, null, "minus"],
    [54, 168, "REM MISC", "minus"], [77, 168, null, "minus"],
    [104, 111, "INVERT", "check"], [127, 111, null, "check"],
    [104, 130, "ZERO", "check"], [127, 130, null, "check"],
    [104, 149, "SELECT ALL", "check"], [127, 149, null, "check"],
    [154, 111, "SORT", "sort"], [177, 111, null, "sort"],
    [154, 130, "FILE INFO", "info"], [177, 130, null, "info"],
    [154, 149, "MISC", "info"], [177, 149, null, "info"],
    [204, 111, "NEW LIST", "list"], [227, 111, null, "list"],
    [204, 130, "SAVE LIST", "list"], [227, 130, null, "list"],
    [204, 149, "LOAD LIST", "list"], [227, 149, null, "list"]
  ];
  for (const [x, y, label, icon] of tools) {
    const active = label == null;
    const plateColor = active ? P.greenDark : P.surface;
    c.round(x, y, 22, 18, 2, plateColor);
    c.roundOutline(x, y, 22, 18, 2, active ? P.green : [36, 36, 36]);
    const fg = active ? P.green : P.textDim;
    // A 7x7 icon drawn from primitives keeps the buttons readable at 1x.
    const ix = x + 7;
    const iy = y + 5;
    if (icon === "plus") { c.hline(ix, iy + 3, 7, fg); c.vline(ix + 3, iy, 7, fg); }
    if (icon === "minus") { c.hline(ix, iy + 3, 7, fg); }
    if (icon === "check") {
      for (let i = 0; i < 4; i += 1) c.set(ix + i, iy + 4 + i, fg);
      for (let i = 0; i < 4; i += 1) c.set(ix + 3 + i, iy + 7 - i, fg);
    }
    if (icon === "sort") {
      for (let i = 0; i < 5; i += 1) c.hline(ix, iy + i, 4 + i, fg);
    }
    if (icon === "info") {
      c.rect(ix + 3, iy, 1, 1, fg);
      c.rect(ix + 3, iy + 2, 1, 5, fg);
    }
    if (icon === "list") {
      c.roundOutline(ix, iy, 7, 7, 1, fg);
      c.hline(ix + 2, iy + 2, 3, fg);
      c.hline(ix + 2, iy + 4, 3, fg);
    }
  }

  // Menu bars: 3px vertical separators between the tool groups.
  const barColors = [48, 111, 3, 54, 100, 111, 3, 72, 150, 111, 3, 54, 200, 111, 3, 54, 250, 111, 3, 54];
  const bars = [[48, 111, 3, 54], [100, 111, 3, 72], [150, 111, 3, 54], [200, 111, 3, 54], [250, 111, 3, 54]];
  for (const [x, y, w, h] of bars) c.rect(x, y, w, h, [40, 40, 40]);

  return c;
}

/** GEN.bmp (178x86): the frame of Webamp's generated windows (library, museum). */
function sheetGen() {
  const c = new Canvas(178, 86);
  const bar = (x, y, w, h, active) => {
    c.rect(x, y, w, h, active ? [30, 30, 30] : [22, 22, 22]);
    c.hline(x, y, w, active ? [48, 48, 48] : [32, 32, 32]);
    if (active) c.rect(x + 4, y + h - 4, 18, 2, P.green);
  };
  // Top row: selected at y=0, normal at y=21.
  bar(0, 0, 25, 20, true); bar(26, 0, 25, 20, true); bar(52, 0, 25, 20, true);
  bar(78, 0, 25, 20, true); bar(104, 0, 25, 20, true); bar(130, 0, 25, 20, true);
  bar(0, 21, 25, 20, false); bar(26, 21, 25, 20, false); bar(52, 21, 25, 20, false);
  bar(78, 21, 25, 20, false); bar(104, 21, 25, 20, false); bar(130, 21, 25, 20, false);
  // Bottom: 125-wide halves at y=42 and y=57, plus the 25x14 fill at y=72.
  c.rect(0, 42, 125, 14, P.base); c.hline(0, 42, 125, P.rim);
  c.rect(0, 57, 125, 14, P.base); c.hline(0, 57, 125, P.rim);
  c.rect(127, 72, 25, 14, P.base);
  // Middle edges.
  c.rect(127, 42, 11, 29, P.surfaceLo);
  c.rect(158, 42, 11, 24, P.surfaceLo);
  c.rect(139, 42, 8, 29, P.surfaceLo);
  c.rect(170, 42, 8, 24, P.surfaceLo);
  c.blit(windowGlyph("close", true), 0, 0, 9, 9, 148, 42);
  return c;
}

/** NUMBERS.bmp / NUMS_EX.bmp: the seven-segment time digits. */
function sheetNumbers(width) {
  return numbersSheet(width);
}

/* ------------------------------------------------------------------- ZIP --- */

// A minimal store-only (no compression) ZIP writer: the PNGs are already
// deflated, so there is nothing to gain and no dependency to add.

function zipStore(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const dosTime = 0;
  const dosDate = (2026 - 1980) << 9 | (1 << 5) | 1;

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0, 6);            // flags
    local.writeUInt16LE(0, 8);            // method: store
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(0, 38);         // external attributes
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

/* ------------------------------------------------------------- the skin ---- */

function buildSheets() {
  const text = paintTextSheet();
  return [
    ["MAIN.bmp", sheetMain()],
    ["TITLEBAR.bmp", sheetTitlebar()],
    ["CBUTTONS.bmp", sheetCButtons()],
    ["SHUFREP.bmp", sheetShufRep()],
    ["PLAYPAUS.bmp", sheetPlayPaus()],
    ["MONOSTER.bmp", sheetMonoStereo()],
    ["POSBAR.bmp", sheetPosBar()],
    ["VOLUME.bmp", sheetVolume()],
    ["BALANCE.bmp", sheetBalance()],
    ["EQMAIN.bmp", sheetEqMain()],
    ["EQ_EX.bmp", sheetEqEx()],
    ["PLEDIT.bmp", sheetPlEdit()],
    ["GEN.bmp", sheetGen()],
    ["NUMBERS.bmp", numbersSheet(90)],
    ["NUMS_EX.bmp", numbersSheet(108)],
    ["TEXT.bmp", text]
  ];
}

/** PLEDIT.TXT: the playlist's colour scheme. */
function plEditTxt() {
  return [
    "[text]",
    `Normal=${P.plNormal}`,
    `Current=${P.plCurrent}`,
    `NormalBG=${P.plNormalBg}`,
    `SelectedBG=${P.plSelectedBg}`,
    `Font=${P.plFont}`,
    ""
  ].join("\r\n");
}

/** VISCOLOR.TXT: the spectrum analyser's 24 band colours + 2 peaks. */
function visColorTxt() {
  const lines = [];
  for (let i = 0; i < 16; i += 1) {
    const t = i / 15;
    // Base ramp: near-black -> the accent green.
    lines.push(
      `${Math.round(6 + (30 - 6) * t)},${Math.round(10 + (215 - 10) * Math.pow(t, 1.6))},${Math.round(8 + (96 - 8) * t)}`
    );
  }
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    lines.push(`${Math.round(30 + (255 - 30) * t)},${Math.round(215 + (255 - 215) * t)},${Math.round(96 + (255 - 96) * t)}`);
  }
  lines.push("255,255,255");  // peak dot
  lines.push("30,215,96");    // peak falloff
  return `${lines.map((l) => l + "\n").join("")}`;
}

/** The window's rounded corners, as Winamp region polygons. */
function regionTxt() {
  return [
    "[Normal]",
    "NumPoints=4",
    "PointList=0,2 2,0 273,0 275,2 275,114 273,116 2,116 0,114",
    ""
  ].join("\r\n");
}

function main() {
  const dir = join(ROOT, "public", "skins");
  mkdirSync(dir, { recursive: true });

  const sheets = buildSheets();
  const entries = sheets.map(([name, canvas]) => ({ name, data: encodePng(canvas.width, canvas.height, canvas.data) }));
  entries.push({ name: "PLEDIT.TXT", data: Buffer.from(plEditTxt(), "utf8") });
  entries.push({ name: "VISCOLOR.TXT", data: Buffer.from(visColorTxt(), "utf8") });
  entries.push({ name: "region.txt", data: Buffer.from(regionTxt(), "utf8") });

  const wsz = zipStore(entries);
  writeFileSync(join(dir, "spotify.wsz"), wsz);

  // A contact sheet of every sprite, for eyeballing the design without a player.
  const main = sheets[0][1];
  writeFileSync(join(HERE, "spotify-skin-main.png"), main.png());

  const total = sheets.reduce((sum, [, c]) => sum + c.width * c.height, 0);
  console.log(`spotify.wsz  ${entries.length} files  ${(wsz.length / 1024).toFixed(1)} KB`);
  for (const [name, canvas] of sheets) {
    console.log(`  ${name.padEnd(14)} ${String(canvas.width).padStart(3)}x${String(canvas.height).padEnd(3)}`);
  }
  console.log(`  pixels ${total}`);
}

main();
