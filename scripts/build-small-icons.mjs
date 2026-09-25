// Small app icons (16–48 px) for the Windows taskbar / title bar / shortcuts.
// The large icon's dithered, side-lit ring turns lopsided when the OS shrinks it,
// so these are drawn pixel-exact: a symmetric anti-aliased ring centred on the
// pixel grid and a pixel-font "RG" centred on the same point.
// usage: node scripts/build-small-icons.mjs [outDir]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT = process.argv[2] || 'data';
const R56 = ['11110', '10001', '11110', '10100', '10010', '10001'];
const G56 = ['01111', '10000', '10011', '10001', '10001', '01110'];
const R34 = ['110', '101', '110', '101'];
const G34 = ['011', '100', '101', '011'];

function draw(s) {
  const px = new Float32Array(s * s * 4);
  const c = s / 2, rr = s * 0.22;            // corner radius of the black tile
  const ro = s * (s >= 48 ? 0.43 : 0.41), ri = s * (s <= 16 ? 0.2 : s >= 48 ? 0.31 : 0.25);
  const N = 8;                               // 8×8 supersampling per pixel
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let tile = 0, ring = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const X = x + (i + .5) / N, Y = y + (j + .5) / N;
      // rounded-square tile
      const dx = Math.max(Math.abs(X - c) - (c - rr), 0), dy = Math.max(Math.abs(Y - c) - (c - rr), 0);
      if (dx * dx + dy * dy <= rr * rr) {
        tile++;
        const d = Math.hypot(X - c, Y - c);
        if (d <= ro && d >= ri) ring++;
      }
    }
    const a = tile / (N * N), w = tile ? ring / tile : 0, k = (y * s + x) * 4;
    px[k] = px[k + 1] = px[k + 2] = 255 * w; px[k + 3] = 255 * a;
  }
  // "RG" in white, centred exactly on (c, c)
  const glyphs = s >= 32 ? [R56, G56] : s >= 24 ? [R34, G34] : null;
  if (glyphs) {
    const sc = s >= 48 ? 2 : 1, gw = glyphs[0][0].length, gh = glyphs[0].length, gap = 2 * sc;
    const W = gw * sc * 2 + gap, H = gh * sc, x0 = (s - W) / 2, y0 = (s - H) / 2;
    if (x0 % 1 || y0 % 1) throw new Error('text not on the pixel grid at ' + s);
    glyphs.forEach((g, gi) => g.forEach((row, ry) => [...row].forEach((bit, rx) => {
      if (bit !== '1') return;
      for (let v = 0; v < sc; v++) for (let u = 0; u < sc; u++) {
        const X = x0 + gi * (gw * sc + gap) + rx * sc + u, Y = y0 + ry * sc + v, k = (Y * s + X) * 4;
        px[k] = px[k + 1] = px[k + 2] = 255;
      }
    })));
  }
  return px;
}

function png(s, px) {
  const raw = Buffer.alloc((s * 4 + 1) * s);
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0;
    for (let x = 0; x < s * 4; x++) raw[y * (s * 4 + 1) + 1 + x] = Math.round(px[y * s * 4 + x]);
  }
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = b => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([l, td, cr]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(s, 0); ih.writeUInt32BE(s, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

for (const s of [16, 24, 32, 48]) {
  const file = path.join(OUT, `rg-cal-${s}.png`);
  fs.writeFileSync(file, png(s, draw(s)));
  console.log(file);
}
