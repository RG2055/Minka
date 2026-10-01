/* Shared dither engine.

   MinkaDither.image(img, opts) → canvas     one still image, Atkinson error diffusion
   MinkaDither.url(src, opts)   → Promise<blob URL>   cached per src + size + mode
   MinkaDither.bayer8            Float32Array(64) ordered thresholds (0..1) for live art
   MinkaDither.mode() / setMode('off'|'color'|'mono')   the "dither every image" option

   The "every image" option never touches an <img>'s src (app code compares it);
   it paints the dithered copy with the CSS `content: url()` replacement and
   drops it again when the src changes. Work happens one image per idle slice
   and results are cached, so a re-rendered list costs nothing. SVG, GIF, tiny
   icons and anything under [data-no-dither] stay as they are. */
(function (host) {
  'use strict';
  if (host.MinkaDither) return;
  var doc = host.document;
  var KEY = 'minka:dither-images:v1';
  var MODES = ['off', 'color', 'mono'];

  // 8×8 Bayer matrix, centred thresholds.
  var BAYER8 = new Float32Array(64);
  (function () {
    var m = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
    for (var i = 0; i < 64; i++) BAYER8[i] = (m[i] + .5) / 64;
  })();

  // Shared with the embedded calendar: one cache, blob URLs work across same-origin frames.
  var shared = null;
  try { if (host.parent !== host && host.parent.MinkaDither) shared = host.parent.MinkaDither; } catch (_) {}
  var cache = shared ? shared._cache : new Map();

  function clamp8(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  /* Atkinson on a small copy: `levels` steps per channel (2 = 1-bit).
     mode: 'color' (per channel), 'mono' (luminance → paper/ink),
           'duo' (luminance → black … ink, `ink` = [r,g,b]). */
  function atkinson(data, w, h, mode, levels, ink, paper) {
    var n = w * h, step = 255 / (levels - 1), ch = mode === 'color' ? 3 : 1;
    var buf = new Float32Array(n * ch);
    for (var i = 0, p = 0; i < n; i++, p += 4) {
      if (ch === 3) { buf[i * 3] = data[p]; buf[i * 3 + 1] = data[p + 1]; buf[i * 3 + 2] = data[p + 2]; }
      else buf[i] = .2126 * data[p] + .7152 * data[p + 1] + .0722 * data[p + 2];
    }
    var offs = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var c = 0; c < ch; c++) {
          var k = (y * w + x) * ch + c, old = buf[k];
          var q = Math.round(clamp8(old) / step) * step;
          buf[k] = q;
          var err = (old - q) / 8;
          for (var o = 0; o < 6; o++) {
            var xx = x + offs[o][0], yy = y + offs[o][1];
            if (xx >= 0 && xx < w && yy < h) buf[(yy * w + xx) * ch + c] += err;
          }
        }
      }
    }
    var pr = paper || [10, 10, 10];
    for (i = 0, p = 0; i < n; i++, p += 4) {
      if (ch === 3) { data[p] = buf[i * 3]; data[p + 1] = buf[i * 3 + 1]; data[p + 2] = buf[i * 3 + 2]; }
      else {
        var t = buf[i] / 255, a = ink || [236, 236, 232];
        data[p] = pr[0] + (a[0] - pr[0]) * t; data[p + 1] = pr[1] + (a[1] - pr[1]) * t; data[p + 2] = pr[2] + (a[2] - pr[2]) * t;
      }
      data[p + 3] = 255;
    }
  }

  /* A small palette from the picture itself (k-means on a sample), then
     Atkinson over that palette: few, true colours instead of RGB noise. */
  function paletteOf(d, n) {
    var pts = [], step = Math.max(1, Math.floor(d.length / 4 / 1600)) * 4;
    for (var i = 0; i < d.length; i += step) pts.push([d[i], d[i + 1], d[i + 2]]);
    pts.sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
    var cs = [];
    for (var k = 0; k < n; k++) cs.push(pts[Math.min(pts.length - 1, Math.floor((k + .5) / n * pts.length))].slice());
    for (var it = 0; it < 6; it++) {
      var sum = cs.map(function () { return [0, 0, 0, 0]; });
      for (var p = 0; p < pts.length; p++) {
        var best = 0, bd = 1e9;
        for (k = 0; k < n; k++) { var dr = pts[p][0] - cs[k][0], dg = pts[p][1] - cs[k][1], db = pts[p][2] - cs[k][2], dd = dr * dr * .3 + dg * dg * .59 + db * db * .11; if (dd < bd) { bd = dd; best = k; } }
        sum[best][0] += pts[p][0]; sum[best][1] += pts[p][1]; sum[best][2] += pts[p][2]; sum[best][3]++;
      }
      for (k = 0; k < n; k++) if (sum[k][3]) cs[k] = [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]];
    }
    // Always keep a true dark and a true light so the dots have contrast.
    cs.sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
    cs[0] = cs[0].map(function (v) { return v * .35; });
    cs[n - 1] = cs[n - 1].map(function (v) { return v + (255 - v) * .35; });
    return cs;
  }
  // Floyd–Steinberg, serpentine rows (no directional worms), over the palette.
  function diffusePalette(d, w, h, pal) {
    var buf = new Float32Array(w * h * 3), i, p;
    for (i = 0, p = 0; i < w * h; i++, p += 4) { buf[i * 3] = d[p]; buf[i * 3 + 1] = d[p + 1]; buf[i * 3 + 2] = d[p + 2]; }
    for (var y = 0; y < h; y++) {
      var ltr = (y & 1) === 0, dir = ltr ? 1 : -1;
      for (var n = 0; n < w; n++) {
        var x = ltr ? n : w - 1 - n, k = (y * w + x) * 3, r = buf[k], g = buf[k + 1], b = buf[k + 2], best = 0, bd = 1e12;
        for (var c = 0; c < pal.length; c++) { var dr = r - pal[c][0], dg = g - pal[c][1], db = b - pal[c][2], dd = dr * dr * .3 + dg * dg * .59 + db * db * .11; if (dd < bd) { bd = dd; best = c; } }
        var q = pal[best], er = r - q[0], eg = g - q[1], eb = b - q[2];
        buf[k] = q[0]; buf[k + 1] = q[1]; buf[k + 2] = q[2];
        var spread = [[dir, 0, 7 / 16], [-dir, 1, 3 / 16], [0, 1, 5 / 16], [dir, 1, 1 / 16]];
        for (var o = 0; o < 4; o++) {
          var xx = x + spread[o][0], yy = y + spread[o][1];
          if (xx < 0 || xx >= w || yy >= h) continue;
          var j = (yy * w + xx) * 3, f = spread[o][2];
          buf[j] += er * f; buf[j + 1] += eg * f; buf[j + 2] += eb * f;
        }
      }
    }
    for (i = 0, p = 0; i < w * h; i++, p += 4) { d[p] = buf[i * 3]; d[p + 1] = buf[i * 3 + 1]; d[p + 2] = buf[i * 3 + 2]; d[p + 3] = 255; }
  }
  /* Fine ordered dither in one ink on a paper colour (the "dither shader"
     look): 8×8 Bayer on luminance. Ink goes where the picture is *different*
     from the paper — bright parts on a dark paper, dark parts on a light one. */
  function bayerTone(d, w, h, ink, paper, gamma) {
    var lightPaper = (paper[0] + paper[1] + paper[2]) > 382;
    for (var y = 0, p = 0; y < h; y++) for (var x = 0; x < w; x++, p += 4) {
      var l = (.2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]) / 255;
      if (gamma !== 1) l = Math.pow(l, gamma);
      var t = lightPaper ? 1 - l : l, c = t > BAYER8[(y & 7) * 8 + (x & 7)] ? ink : paper;
      d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
    }
  }
  /* Gradient maps on luminance.
     xray: cold blue-white film ramp with an S-curve (light pictures are inverted first);
     duotone: near-black → ink → near-white. */
  function toneMap(d, kind, ink) {
    var ramp;
    if (kind === 'vivid') {
      for (var v = 0; v < d.length; v += 4) {
        var lv = .2126 * d[v] + .7152 * d[v + 1] + .0722 * d[v + 2];
        d[v] = clamp8(lv + (d[v] - lv) * 1.4); d[v + 1] = clamp8(lv + (d[v + 1] - lv) * 1.4); d[v + 2] = clamp8(lv + (d[v + 2] - lv) * 1.4);
      }
    }
    if (kind === 'xray') ramp = [[2, 6, 12], [14, 40, 66], [60, 128, 170], [205, 234, 250], [250, 253, 255]];
    // mono: black and white film (the grey half of "Puse"; vivid above is its colour half).
    else if (kind === 'mono') ramp = [[10, 10, 11], [92, 92, 94], [196, 196, 198], [246, 246, 246]];
    // poster: a two-ink print — near-black shadows into the ink, lights toward paper.
    else if (kind === 'poster') ramp = [ink.map(function (v) { return Math.round(v * .05); }), ink.map(function (v) { return Math.round(v * .42); }), ink, ink.map(function (v) { return Math.round(v + (255 - v) * .62); })];
    // heatmap: a thermal camera — navy, blue, cyan, green, yellow, orange, red.
    else if (kind === 'heatmap') ramp = [[0, 8, 90], [0, 50, 255], [0, 200, 255], [0, 225, 90], [245, 240, 0], [255, 140, 0], [255, 20, 40]];
    // focus: the "lens" look — shadows ultramarine, mids teal, lights orange, with film grain.
    else if (kind === 'focus') ramp = [[8, 13, 58], [30, 60, 192], [44, 98, 228], [22, 150, 140], [244, 116, 22], [255, 196, 104]];
    else if (kind !== 'vivid') ramp = [ink.map(function (v) { return Math.round(v * .08); }), ink.map(function (v) { return Math.round(v * .55); }), ink, ink.map(function (v) { return Math.round(v + (255 - v) * .78); })];
    var n = ramp ? ramp.length - 1 : 0, invert = false;
    if (kind === 'xray') {
      // Film is dark with bright structures: invert light pictures only.
      var sum = 0; for (var q = 0; q < d.length; q += 16) sum += .2126 * d[q] + .7152 * d[q + 1] + .0722 * d[q + 2];
      invert = sum / (d.length / 16) > 118;
    }
    for (var p = 0; p < d.length; p += 4) {
      var l = (.2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]) / 255;
      if (kind === 'xray') { if (invert) l = 1 - l; l = Math.pow(l, 1.12); }   // soft gamma, no S-curve: smooth film tones
      if (!ramp) break;                                  // vivid: already done above
      var f = l * n, i = Math.min(n - 1, Math.floor(f)), t = f - i, a = ramp[i], b = ramp[i + 1];
      d[p] = a[0] + (b[0] - a[0]) * t; d[p + 1] = a[1] + (b[1] - a[1]) * t; d[p + 2] = a[2] + (b[2] - a[2]) * t; d[p + 3] = 255;
    }
    if (kind === 'focus' || kind === 'poster' || kind === 'mono' || kind === 'vivid') {
      // Fixed per-pixel grain (a hash, not Math.random): the same picture gives the same bytes, so caches hold.
      for (var g = 0, px = 0; g < d.length; g += 4, px++) {
        var hsh = Math.imul(px ^ 0x9e3779b9, 0x85ebca6b); hsh ^= hsh >>> 13; hsh = Math.imul(hsh, 0xc2b2ae35);
        var gn = ((hsh >>> 24) - 128) * (kind === 'vivid' ? .07 : .16);
        d[g] = clamp8(d[g] + gn); d[g + 1] = clamp8(d[g + 1] + gn); d[g + 2] = clamp8(d[g + 2] + gn);
      }
    }
  }
  /* Halftone (round dots on a grid) and ASCII (characters by brightness),
     drawn at device resolution (opts.scale) so dots and letters stay smooth. */
  var ASCII_RAMP = " .:-=+*o#%@";
  /* Cell art, drawn once at device resolution:
     halftone — round dots; ascii — characters by brightness;
     mosaic — the picture's own colours as small rounded tiles with a seam;
     bricks — the same as toy bricks (bevelled square, a stud with light and shade);
     led — a dot matrix: a faint dot in every cell, bright ones where the picture is. */
  function mix(c, t, k) { return [0, 1, 2].map(function (i) { return Math.round(c[i] + (t[i] - c[i]) * k); }); }
  function css(c) { return 'rgb(' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))); }).join(',') + ')'; }
  function patternArt(d, w, h, opts) {
    var f = opts.cell || 1, k = opts.scale || 1, ink = opts.ink || [236, 234, 228], mode = opts.mode;
    var cell = mode === 'ascii' ? [5 * f, 8 * f] : mode === 'mosaic' ? [7 * f, 7 * f] : mode === 'bricks' ? [9 * f, 9 * f] : mode === 'led' ? [6 * f, 6 * f] : mode === 'pixelate' ? [8 * f, 8 * f] : mode === 'pointillism' ? [8 * f, 8 * f] : [5 * f, 5 * f];
    var cols = Math.max(1, Math.floor(w / cell[0])), rows = Math.max(1, Math.floor(h / cell[1]));
    var cw = Math.max(1, Math.round(cell[0])), chh = Math.max(1, Math.round(cell[1]));
    var out = doc.createElement('canvas'); out.width = Math.round(w * k); out.height = Math.round(h * k);
    var c = out.getContext('2d');
    c.fillStyle = mode === 'led' ? css(ink.map(function (v) { return v * .07 + 6; })) : mode === 'mosaic' ? '#101012' : '#060606';
    c.fillRect(0, 0, out.width, out.height);
    c.fillStyle = 'rgb(' + ink.join(',') + ')';
    if (mode === 'ascii') { c.font = '600 ' + (cell[1] * .95 * k).toFixed(1) + 'px ui-monospace,Menlo,Consolas,monospace'; c.textBaseline = 'top'; }
    var S = cell[0] * k, dim = css(ink.map(function (v) { return v * .28 + 8; }));
    for (var gy = 0; gy < rows; gy++) for (var gx = 0; gx < cols; gx++) {
      var sum = 0, cnt = 0, sr = 0, sg = 0, sb = 0;
      var y0 = Math.floor(gy * cell[1]), x0 = Math.floor(gx * cell[0]);
      for (var y = y0; y < y0 + chh && y < h; y++) for (var x = x0; x < x0 + cw && x < w; x++) {
        var p = (y * w + x) * 4; sum += .2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]; sr += d[p]; sg += d[p + 1]; sb += d[p + 2]; cnt++;
      }
      var l = cnt ? sum / cnt / 255 : 0, col = cnt ? [sr / cnt, sg / cnt, sb / cnt] : [0, 0, 0];
      var px = gx * cell[0] * k, py = gy * cell[1] * k;
      if (mode === 'ascii') {
        var ch = ASCII_RAMP[Math.min(ASCII_RAMP.length - 1, Math.floor(l * ASCII_RAMP.length))];
        // Brightness twice over: a denser letter and a brighter ink, like a lit terminal.
        if (ch !== ' ') { c.fillStyle = css(ink.map(function (v) { return v * (.4 + .6 * l); })); c.fillText(ch, px, py); }
      } else if (mode === 'mosaic') {
        var gap = Math.max(1, S * .12);
        c.fillStyle = css(mix(col, [col[0] * 1.08, col[1] * 1.08, col[2] * 1.08], 1));
        if (c.roundRect) { c.beginPath(); c.roundRect(px + gap / 2, py + gap / 2, S - gap, S - gap, S * .16); c.fill(); }
        else c.fillRect(px + gap / 2, py + gap / 2, S - gap, S - gap);
      } else if (mode === 'bricks') {
        var cx = px + S / 2, cy = py + S / 2, e = Math.max(1, S * .07);
        c.fillStyle = css(col); c.fillRect(px, py, S, S);
        c.fillStyle = css(mix(col, [255, 255, 255], .22)); c.fillRect(px, py, S, e); c.fillRect(px, py, e, S);          // lit edges
        c.fillStyle = css(mix(col, [0, 0, 0], .32)); c.fillRect(px, py + S - e, S, e); c.fillRect(px + S - e, py, e, S); // shaded edges
        var r = S * .3;
        c.beginPath(); c.arc(cx + e * .6, cy + e * .6, r, 0, 6.2832); c.fillStyle = css(mix(col, [0, 0, 0], .35)); c.fill();   // stud shadow
        c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fillStyle = css(col); c.fill();
        c.beginPath(); c.arc(cx, cy, r * .78, 3.5, 5.6); c.strokeStyle = css(mix(col, [255, 255, 255], .38)); c.lineWidth = Math.max(1, S * .06); c.stroke();   // stud highlight
      } else if (mode === 'pixelate') {
        c.fillStyle = css(col); c.fillRect(Math.floor(px), Math.floor(py), Math.ceil(S) + 1, Math.ceil(S) + 1);
      } else if (mode === 'pointillism') {
        // Two dabs per cell at fixed pseudo-random spots, bigger where it is darker.
        // The cell's own colour underneath (no paper gaps), then three dabs a shade
        // lighter, darker and warmer at fixed pseudo-random spots: a painted surface.
        var sat = col.map(function (v) { var m = (col[0] + col[1] + col[2]) / 3; return m + (v - m) * 1.3; });
        c.fillStyle = css(mix(sat, [0, 0, 0], .12)); c.fillRect(Math.floor(px), Math.floor(py), Math.ceil(S) + 1, Math.ceil(S) + 1);
        var shades = [mix(sat, [255, 255, 255], .28), mix(sat, [0, 0, 0], .3), mix(sat, [255, 200, 120], .2)];
        for (var dd = 0; dd < 3; dd++) {
          var hh = Math.imul((gx * 73856093) ^ (gy * 19349663) ^ (dd * 83492791), 0x9e3779b1) >>> 0;
          var jx = ((hh & 255) / 255 - .5) * S * .8, jy = (((hh >>> 8) & 255) / 255 - .5) * S * .8;
          c.fillStyle = css(shades[dd]); c.beginPath(); c.ellipse(px + S / 2 + jx, py + S / 2 + jy, S * .3, S * .2, ((hh >>> 16) & 255) / 81, 0, 6.2832); c.fill();
        }
      } else if (mode === 'led') {
        var cx2 = px + S / 2, cy2 = py + S / 2;
        c.fillStyle = dim; c.beginPath(); c.arc(cx2, cy2, Math.max(.6, S * .09), 0, 6.2832); c.fill();
        if (l > .1) { c.fillStyle = css(mix(ink, [255, 255, 255], Math.max(0, l - .75))); c.beginPath(); c.arc(cx2, cy2, Math.sqrt(l) * S * .4, 0, 6.2832); c.fill(); }
      } else {
        var rr = Math.sqrt(l) * cell[0] * .62 * k;
        if (rr > .35 * k) { c.beginPath(); c.arc((gx + .5) * cell[0] * k, (gy + .5) * cell[1] * k, rr, 0, 6.2832); c.fill(); }
      }
    }
    return out;
  }
  /* CMYK print: four dot screens at the classic angles, printed onto paper. */
  function cmykArt(d, w, h, period) {
    var P = Math.max(3, period), inks = [[0, 160, 227], [230, 0, 126], [255, 226, 0], [24, 24, 26]], ang = [15, 75, 0, 45].map(function (a) { return a * Math.PI / 180; });
    var cs = ang.map(Math.cos), sn = ang.map(Math.sin);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var p = (y * w + x) * 4, r = d[p] / 255, g = d[p + 1] / 255, b = d[p + 2] / 255, k = 1 - Math.max(r, g, b);
      var val = k >= .999 ? [0, 0, 0, 1] : [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k];
      var out = [248, 246, 240];
      for (var ch = 0; ch < 4; ch++) {
        var u = x * cs[ch] + y * sn[ch], v = -x * sn[ch] + y * cs[ch];
        var du = u - (Math.floor(u / P) + .5) * P, dv = v - (Math.floor(v / P) + .5) * P;
        var rad = Math.sqrt(val[ch]) * P * .62, dist = Math.sqrt(du * du + dv * dv);
        var cov = rad - dist + .5; cov = cov < 0 ? 0 : cov > 1 ? 1 : cov;
        if (cov) for (var c = 0; c < 3; c++) out[c] *= 1 - cov * (1 - inks[ch][c] / 255);
      }
      d[p] = out[0]; d[p + 1] = out[1]; d[p + 2] = out[2]; d[p + 3] = 255;
    }
  }
  /* Riso: two inks on cream paper, each a grainy layer; the second is printed a
     little off register, as a real duplicator does. */
  function risoArt(d, w, h, ink) {
    var A = [255, 72, 150], B = ink && (ink[0] + ink[1] + ink[2]) < 600 ? ink : [0, 120, 191], src = new Uint8ClampedArray(d);
    function grain(x, y, s) { var hh = Math.imul(((x >> 1) * 374761393) ^ ((y >> 1) * 668265263) ^ s, 1274126177) >>> 0; return (hh >>> 24) / 255; }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var p = (y * w + x) * 4, x2 = Math.min(w - 1, x + 2), y2 = Math.min(h - 1, y + 1), q = (y2 * w + x2) * 4;
      var da = 1 - src[p + 1] / 255, db = 1 - (src[q] * .7 + src[q + 2] * .3) / 255;
      var ga = .5 + (grain(x, y, 11) - .5) * .55, gb = .5 + (grain(x, y, 29) - .5) * .55;
      var ca = Math.max(0, Math.min(1, (da - ga) * 6 + .5)) * .9, cb = Math.max(0, Math.min(1, (db - gb) * 6 + .5)) * .85;
      var out = [246, 240, 228];
      for (var c = 0; c < 3; c++) out[c] *= (1 - ca * (1 - A[c] / 255)) * (1 - cb * (1 - B[c] / 255));
      d[p] = out[0]; d[p + 1] = out[1]; d[p + 2] = out[2]; d[p + 3] = 255;
    }
  }
  // Slieksnis: pure two-tone, the ink (when dark enough) on paper.
  function thresholdArt(d, ink) {
    var dark = ink && .2126 * ink[0] + .7152 * ink[1] + .0722 * ink[2] < 90 ? ink : [12, 12, 14], paper = [240, 239, 234];
    var hist = new Uint32Array(256), n = d.length / 4, cut = 0, acc = 0;
    for (var q = 0; q < d.length; q += 4) hist[(.2126 * d[q] + .7152 * d[q + 1] + .0722 * d[q + 2]) | 0]++;
    for (; cut < 255 && (acc += hist[cut]) < n * .5; cut++);
    cut = Math.max(70, Math.min(185, cut));
    for (var p = 0; p < d.length; p += 4) {
      var l = .2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2], t = (l - cut + 8) / 16; t = t < 0 ? 0 : t > 1 ? 1 : t;
      for (var c = 0; c < 3; c++) d[p + c] = dark[c] + (paper[c] - dark[c]) * t;
      d[p + 3] = 255;
    }
  }
  // Kontūra: the picture's edges as pen lines on paper (Sobel on brightness).
  function outlineArt(d, w, h) {
    var lum = new Float32Array(w * h);
    for (var i = 0, q = 0; i < d.length; i += 4, q++) lum[q] = .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2];
    // Smooth first (3×3 box) so photo grain and compression blocks do not read as edges.
    var raw = lum; lum = new Float32Array(w * h);
    for (var by = 0; by < h; by++) for (var bx = 0; bx < w; bx++) {
      var sm = 0; for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) sm += raw[Math.max(0, Math.min(h - 1, by + oy)) * w + Math.max(0, Math.min(w - 1, bx + ox))];
      lum[by * w + bx] = sm / 9;
    }
    var mag = new Float32Array(w * h), hist = new Uint32Array(512);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var xm = Math.max(0, x - 1), xp = Math.min(w - 1, x + 1), ym = Math.max(0, y - 1), yp = Math.min(h - 1, y + 1);
      var gx = lum[ym * w + xp] + 2 * lum[y * w + xp] + lum[yp * w + xp] - lum[ym * w + xm] - 2 * lum[y * w + xm] - lum[yp * w + xm];
      var gy = lum[yp * w + xm] + 2 * lum[yp * w + x] + lum[yp * w + xp] - lum[ym * w + xm] - 2 * lum[ym * w + x] - lum[ym * w + xp];
      var mm = Math.sqrt(gx * gx + gy * gy); mag[y * w + x] = mm; hist[Math.min(511, mm >> 1)]++;
    }
    for (var lo = 511, acc = 0; lo > 0 && (acc += hist[lo]) < w * h * .09; lo--);
    var edge = Math.max(36, lo * 2), span = Math.max(20, edge * .8);
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var t = (mag[y * w + x] - edge) / span; t = t < 0 ? 0 : t > 1 ? 1 : t;
      var p = (y * w + x) * 4, v = 240 - 226 * t;
      d[p] = v; d[p + 1] = v - 1; d[p + 2] = v - 5; d[p + 3] = 255;
    }
  }
  // Posterizācija: a few flat colour steps, a touch more saturated.
  function posterizeArt(d, levels) {
    var L = levels - 1;
    for (var p = 0; p < d.length; p += 4) {
      var m = (d[p] + d[p + 1] + d[p + 2]) / 3;
      for (var c = 0; c < 3; c++) { var v = clamp8(m + (d[p + c] - m) * 1.3); d[p + c] = Math.round(v / 255 * L) / L * 255; }
      d[p + 3] = 255;
    }
  }
  /* Line screen: diagonal lines, thick where the picture is light, on the ink as
     ground; red and blue read a pixel apart, so the edges fringe like a print. */
  function linesArt(d, w, h, ink, period) {
    var P = Math.max(3, period || 5), lum = new Float32Array(w * h), fg = [246, 247, 255];
    for (var i = 0, q = 0; i < d.length; i += 4, q++) lum[q] = (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255;
    function cover(x, y) {
      var xx = Math.max(0, Math.min(w - 1, x)), l = lum[y * w + xx];
      var v = ((x + y) / P) % 1, dist = Math.abs(v - .5) * 2;
      var t = (.1 + l * .7 - dist) * P * .7 + .5;
      return t < 0 ? 0 : t > 1 ? 1 : t;
    }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var p = (y * w + x) * 4, cr = cover(x + 1, y), cg = cover(x, y), cb = cover(x - 1, y);
      d[p] = ink[0] + (fg[0] - ink[0]) * cr; d[p + 1] = ink[1] + (fg[1] - ink[1]) * cg; d[p + 2] = ink[2] + (fg[2] - ink[2]) * cb; d[p + 3] = 255;
    }
  }
  // Mild unsharp (3×3 cross): dithering eats edges, this puts them back.
  function sharpen(d, w, h, amount) {
    var src = new Uint8ClampedArray(d), a = amount;
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
      var i = (y * w + x) * 4;
      for (var c = 0; c < 3; c++) {
        var v = src[i + c] * (1 + 4 * a) - a * (src[i + c - 4] + src[i + c + 4] + src[i + c - w * 4] + src[i + c + w * 4]);
        d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }
  // High-quality downscale: halve repeatedly, then the last step.
  function drawScaled(ctx, img, sx, sy, sw, sh, dw, dh) {
    var cur = img, cw = sw, chh = sh, cx = sx, cy = sy;
    while (cw / 2 > dw && chh / 2 > dh) {
      var t = doc.createElement('canvas'); t.width = Math.round(cw / 2); t.height = Math.round(chh / 2);
      var tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(cur, cx, cy, cw, chh, 0, 0, t.width, t.height);
      cur = t; cx = 0; cy = 0; cw = t.width; chh = t.height;
    }
    ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cur, cx, cy, cw, chh, 0, 0, dw, dh);
  }

  /* Dither one decoded image into a new canvas `w`×`h` (cover crop to that
     aspect when `cover`). Throws on a tainted (CORS-less) image. */
  function image(img, opts) {
    opts = opts || {};
    var nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
    var w = Math.max(4, Math.round(opts.width || Math.min(nw, 240)));
    var h = Math.max(4, Math.round(opts.height || w * nh / nw));
    var cv = doc.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    if (opts.mode === 'recolor') {
      // Two-tone dither art: nearest-neighbour crop (dots stay dots), then swap the ink.
      var sr = Math.max(w / nw, h / nh), rw = w / sr, rh = h / sr, rp = opts.pos || [.5, .5];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, (nw - rw) * rp[0], (nh - rh) * rp[1], rw, rh, 0, 0, w, h);
      var rd = ctx.getImageData(0, 0, w, h), dd = rd.data, sum = 0, q2;
      for (q2 = 0; q2 < dd.length; q2 += 4) sum += dd[q2] + dd[q2 + 1] + dd[q2 + 2];
      var lightGround = sum / (dd.length / 4) > 382, ink = (opts.ink || [236, 234, 228]).slice(), L = function (c) { return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
      if (lightGround) { for (var a1 = 0; a1 < 10 && L(ink) > 95; a1++) ink = ink.map(function (v) { return Math.round(v * .8); }); }
      else { for (var a2 = 0; a2 < 10 && L(ink) < 150; a2++) ink = ink.map(function (v) { return Math.round(v + (255 - v) * .22); }); ink = ink.map(function (v) { return Math.round(6 + (v - 6) * .78); }); }
      var ground = lightGround ? [239, 236, 228] : [6, 6, 6];
      for (q2 = 0; q2 < dd.length; q2 += 4) {
        var isInk = lightGround ? (dd[q2] + dd[q2 + 1] + dd[q2 + 2]) < 382 : (dd[q2] + dd[q2 + 1] + dd[q2 + 2]) >= 150;
        var cc = isInk ? ink : ground; dd[q2] = cc[0]; dd[q2 + 1] = cc[1]; dd[q2 + 2] = cc[2]; dd[q2 + 3] = 255;
      }
      ctx.putImageData(rd, 0, 0);
      return cv;
    }
    if (opts.cover) {
      // Crop like background-size:cover + background-position (opts.pos, 0..1).
      var s = Math.max(w / nw, h / nh), cropW = w / s, cropH = h / s, pos = opts.pos || [.5, .5];
      drawScaled(ctx, img, (nw - cropW) * pos[0], (nh - cropH) * pos[1], cropW, cropH, w, h);
    } else drawScaled(ctx, img, 0, 0, nw, nh, w, h);
    var id = ctx.getImageData(0, 0, w, h);
    // Cut-out pictures (card decorations): the effect works on the shape only.
    // Transparent pixels take the shape's mean colour so they neither skew the
    // levels nor bleed dark error into the edges; the alpha is put back at the end.
    var alpha = null;
    if (opts.keepAlpha) {
      var da = id.data, sr = 0, sg = 0, sb = 0, sn = 0, qa;
      alpha = new Uint8Array(w * h);
      for (qa = 0; qa < da.length; qa += 4) { alpha[qa >> 2] = da[qa + 3]; if (da[qa + 3] >= 128) { sr += da[qa]; sg += da[qa + 1]; sb += da[qa + 2]; sn++; } }
      if (sn) { sr /= sn; sg /= sn; sb /= sn; }
      for (qa = 0; qa < da.length; qa += 4) if (da[qa + 3] < 128) { da[qa] = sr; da[qa + 1] = sg; da[qa + 2] = sb; }
    }
    // Dither modes keep 1-bit edges (dots stay dots); tone maps keep the soft edge.
    function putAlpha(data, crisp) {
      for (var qb = 0; qb < alpha.length; qb++) data[qb * 4 + 3] = crisp ? (alpha[qb] >= 128 ? 255 : 0) : alpha[qb];
    }
    function maskPattern(out) {
      var mk = doc.createElement('canvas'); mk.width = w; mk.height = h;
      var mc = mk.getContext('2d'), md = mc.createImageData(w, h);
      for (var qc = 0; qc < alpha.length; qc++) md.data[qc * 4 + 3] = alpha[qc];
      mc.putImageData(md, 0, 0);
      var oc = out.getContext('2d'); oc.globalCompositeOperation = 'destination-in'; oc.drawImage(mk, 0, 0, out.width, out.height);
      return out;
    }
    if (opts.normalize) {
      // Auto levels: stretch the 2nd…98th luminance percentile to full range,
      // so soft pastel pictures keep their shapes instead of one even dot field.
      var dn = id.data, hist = new Uint32Array(256), total = w * h, lo = 0, hi = 255, acc = 0;
      for (var q = 0; q < dn.length; q += 4) hist[(.2126 * dn[q] + .7152 * dn[q + 1] + .0722 * dn[q + 2]) | 0]++;
      for (lo = 0, acc = 0; lo < 255 && (acc += hist[lo]) < total * .02; lo++);
      for (hi = 255, acc = 0; hi > 0 && (acc += hist[hi]) < total * .02; hi--);
      if (hi - lo > 8) { var k = 255 / (hi - lo); for (q = 0; q < dn.length; q += 4) { dn[q] = clamp8((dn[q] - lo) * k); dn[q + 1] = clamp8((dn[q + 1] - lo) * k); dn[q + 2] = clamp8((dn[q + 2] - lo) * k); } }
    }
    if (opts.contrast) {
      var d = id.data, c = opts.contrast;
      for (var i = 0; i < d.length; i += 4) { d[i] = clamp8((d[i] - 128) * c + 128); d[i + 1] = clamp8((d[i + 1] - 128) * c + 128); d[i + 2] = clamp8((d[i + 2] - 128) * c + 128); }
    }
    if (/^(cmyk|riso|threshold|outline|posterize)$/.test(opts.mode)) {
      if (opts.mode === 'cmyk') cmykArt(id.data, w, h, 6 * (opts.cell || 1) / (opts.dot || 1));
      else if (opts.mode === 'riso') risoArt(id.data, w, h, opts.ink);
      else if (opts.mode === 'threshold') thresholdArt(id.data, opts.ink);
      else if (opts.mode === 'outline') outlineArt(id.data, w, h);
      else posterizeArt(id.data, 4);
      if (alpha) putAlpha(id.data, false); ctx.putImageData(id, 0, 0); return cv;
    }
    if (/^(halftone|ascii|mosaic|bricks|led|pixelate|pointillism)$/.test(opts.mode)) { var art = patternArt(id.data, w, h, opts); return alpha ? maskPattern(art) : art; }
    if (opts.mode === 'lines') { linesArt(id.data, w, h, opts.ink || [58, 75, 255], 5 * (opts.cell || 1) / (opts.dot || 1)); if (alpha) putAlpha(id.data, false); ctx.putImageData(id, 0, 0); return cv; }
    if (opts.sharpen !== 0) sharpen(id.data, w, h, opts.sharpen || .35);
    if (/^(xray|duotone|focus|poster|mono|vivid|heatmap)$/.test(opts.mode)) { toneMap(id.data, opts.mode, opts.ink || [236, 234, 228]); if (alpha) putAlpha(id.data, false); ctx.putImageData(id, 0, 0); return cv; }
    if (opts.mode === 'bayer') bayerTone(id.data, w, h, opts.ink || [236, 236, 232], opts.paper || [6, 6, 6], opts.gamma || 1);
    else if (opts.mode === 'palette') diffusePalette(id.data, w, h, paletteOf(id.data, opts.colors || 6));
    else atkinson(id.data, w, h, opts.mode || 'color', opts.levels || (opts.mode === 'color' ? 3 : 2), opts.ink, opts.paper);
    if (alpha) putAlpha(id.data, true);
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  // Resolve once the image is decoded, so swapping it in never shows an empty frame.
  var decoded = new Set();
  // The latest finished picture per source + effect, at any size: a card
  // rebuilt on a day switch shows it at once while its exact size is made,
  // so an effect never blinks off and back on. Plain URL strings, dropped
  // when their blob is revoked.
  var recent = new Map(), recentLens = new Map();
  function keepRecent(map, like, u) { map.delete(like); map.set(like, u); if (map.size > 24) map.delete(map.keys().next().value); }
  function forget(u) { [recent, recentLens].forEach(function (m) { m.forEach(function (v, k) { if (v === u) m.delete(k); }); }); }

  /* ---------- finished card effects, kept and shared ----------
     A card's effect is the same PNG for the same picture, effect, size and
     colours. Once made (on this computer or a colleague's) it is kept in this
     browser (Cache Storage) and on minka-api (/api/fx), so it is fetched
     instead of computed again: after a reload, on another day, on a weak PC.
     The editor's own preview copies are never kept (see rosterCard()). */
  var FX_VERSION = 1, FX_CACHE = 'minka-fx-v1', FX_LOCAL_MAX = 100, FX_SHARE_DELAY = 1200;
  var stored = shared && shared._stored ? shared._stored : new Map();   // canonical key -> PNG Blob
  var stats = shared && shared._stats ? shared._stats : { computed: 0, local: 0, server: 0, saved: 0 };
  var storedReady = shared && shared._storedReady ? shared._storedReady : loadStored();
  function loadStored() {
    if (!host.caches) return Promise.resolve();
    return host.caches.open(FX_CACHE).then(function (c) {
      return c.keys().then(function (reqs) {
        var drop = reqs.length > FX_LOCAL_MAX ? reqs.slice(0, reqs.length - FX_LOCAL_MAX) : [];
        drop.forEach(function (r) { c.delete(r); });
        return Promise.all(reqs.slice(drop.length).map(function (r) {
          return c.match(r).then(function (res) {
            var k = res && res.headers.get('x-fx-key');
            return k ? res.blob().then(function (b) { stored.set(decodeURIComponent(k), b); }) : null;
          });
        }));
      });
    }).catch(function () {});
  }
  // The picture's address without the host (rgapp.page, the GitHub test copy and
  // a local server name the same file alike); blob: and data: pictures exist on
  // one device only and are not kept.
  function canonSrc(src) {
    try {
      var u = new URL(src, doc.baseURI);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
      if (u.origin === host.location.origin) return u.pathname.replace(/^\/Minka(?=\/)/, '') + u.search;
      if (/(^|\.)rgapp\.page$|\.workers\.dev$/.test(u.hostname)) return '//' + u.hostname.split('.')[0] + u.pathname + u.search;
      return u.href;
    } catch (_) { return ''; }
  }
  function fxHash(canon) {
    if (!host.crypto || !host.crypto.subtle || !host.TextEncoder) return Promise.reject(new Error('no crypto'));
    return host.crypto.subtle.digest('SHA-256', new host.TextEncoder().encode('fx' + FX_VERSION + '|' + canon)).then(function (buf) {
      return Array.from(new Uint8Array(buf), function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
    });
  }
  function fxApi() {
    var A = null;
    try { A = host.MinkaApi || (host.parent !== host ? host.parent.MinkaApi : null); } catch (_) { A = host.MinkaApi || null; }
    var token = A && A.getToken ? A.getToken() : '';
    return A && A.base && token ? { base: A.base, token: token } : null;
  }
  function keepLocal(canon, hash, blob) {
    stored.set(canon, blob);
    if (stored.size > FX_LOCAL_MAX) stored.delete(stored.keys().next().value);
    if (!host.caches) return;
    host.caches.open(FX_CACHE).then(function (c) {
      return c.put('https://fx.invalid/' + hash, new Response(blob, { headers: { 'content-type': 'image/png', 'x-fx-key': encodeURIComponent(canon) } }));
    }).catch(function () {});
  }
  // From minka-api: a PNG, or null (missing, offline, signed out, slow).
  function serverFx(hash) {
    var api = fxApi();
    if (!api || !host.fetch) return Promise.resolve(null);
    var ctl = host.AbortController ? new host.AbortController() : null;
    var timer = ctl ? host.setTimeout(function () { ctl.abort(); }, 1500) : 0;
    return host.fetch(api.base + '/api/fx/' + hash, { headers: { authorization: 'Bearer ' + api.token }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.status === 200 && /image\/png/.test(r.headers.get('content-type') || '') ? r.blob() : null; })
      .catch(function () { return null; })
      .then(function (b) { host.clearTimeout(timer); return b; });
  }
  // The kept/shared pictures and the same-frame apply are for the schedule's own
  // cards only (centre cards and the side lists); the night split, the editor's
  // copies and anything else keep the old path untouched.
  function rosterCard(card) {
    return !!(card && card.closest && card.closest('#grafiks-list, #radiographers-duty, #radiologists-duty'))
      && !card.closest('.mk-skin-preview-real, .mk-skin-preview, .mk-preset-card, .mk-contrast-probe');
  }
  // The appearance editor is open (its live preview exists in some frame).
  function editorOpen() {
    var docs = [doc];
    try { var f = doc.getElementById('calIframe'); if (f && f.contentDocument) docs.push(f.contentDocument); } catch (_) {}
    try { if (host.parent !== host) docs.push(host.parent.document); } catch (_) {}
    // The preview stays in the page (hidden) after the editor closes: only a
    // visible one means the editor is open.
    return docs.some(function (d) {
      return Array.prototype.some.call(d.querySelectorAll('.mk-skin-preview-real'), function (p) { return p.getClientRects().length > 0; });
    });
  }
  /* Fresh pictures wait in one list and are kept here and sent a moment later,
     off the busy path. One made while the appearance editor is open (a draft,
     a Remix try, a slider value) waits for the editor to close and goes only
     if a card still shows it; any other goes as soon as the editor is not open. */
  var unsaved = new Map(), sweepTimer = 0;   // blob URL -> { canon, blob, drafted }
  function shareLater(canon, u, blob) {
    unsaved.set(u, { canon: canon, blob: blob, drafted: editorOpen() });
    stats.pending = unsaved.size;
    if (!sweepTimer) sweepTimer = host.setTimeout(sweep, FX_SHARE_DELAY);
  }
  function sweep() {
    sweepTimer = 0;
    if (editorOpen()) {
      unsaved.forEach(function (e) { e.drafted = true; });
      sweepTimer = host.setTimeout(sweep, 2000);
      return;
    }
    unsaved.forEach(function (e, u) {
      unsaved.delete(u);
      if (stored.has(e.canon)) return;
      if (e.drafted && !inUse(u)) { stats.dropped = (stats.dropped || 0) + 1; return; }
      fxHash(e.canon).then(function (hash) {
        keepLocal(e.canon, hash, e.blob);
        stats.saved++;
        var api = fxApi();
        if (!api || e.blob.size > 600 * 1024) return;
        host.fetch(api.base + '/api/fx/' + hash, { method: 'POST', headers: { authorization: 'Bearer ' + api.token, 'content-type': 'image/png' }, body: e.blob })
          .then(function (r) { if (r.ok) stats.sent = (stats.sent || 0) + 1; }, function () {});
      }, function () {});
    });
    stats.pending = unsaved.size;
  }
  // A schedule card showing a picture made for a copy that is not kept (the
  // editor's preview hit the same size first): keep it for the card all the same.
  function ensureKept(src, job, u) {
    var cs = job && job._key ? canonSrc(src) : '', canon = cs ? cs + job._key.slice(src.length) : '';
    if (!canon || stored.has(canon) || unsaved.has(u) || !host.fetch) return;
    host.fetch(u).then(function (r) { return r.blob(); }).then(function (b) { shareLater(canon, u, b); }, function () {});
  }
  function ready(u) {
    if (decoded.has(u)) return Promise.resolve(u);
    var im = new Image(); im.src = u;
    return (im.decode ? im.decode() : Promise.resolve()).then(function () { decoded.add(u); return u; }, function () { return u; });
  }
  function load(src, cors) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      if (cors) im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = function () { resolve(im); };
      im.onerror = reject;
      im.src = src;
    });
  }
  function sameOrigin(src) {
    try { var u = new URL(src, doc.baseURI); return u.origin === host.location.origin || u.protocol === 'data:' || u.protocol === 'blob:'; } catch (_) { return false; }
  }

  var MAX_CACHE = 30;   // 8 GB work PCs: keep few finished pictures around
  function remember(key, value) {
    cache.set(key, value);
    if (cache.size <= MAX_CACHE) return;
    var oldKey = cache.keys().next().value, old = cache.get(oldKey);
    cache.delete(oldKey);
    // A job still running when it leaves the cache has a card waiting for it: that
    // card sets the URL a moment after it resolves, so only revoke it later, if unused.
    var settledNow = !!(old && old._url);
    Promise.resolve(old).then(function (u) {
      var drop = function () { if (u && !inUse(u) && cache.get(oldKey) !== old) { forget(u); try { URL.revokeObjectURL(u); } catch (_) {} } };
      if (settledNow) drop(); else host.setTimeout(drop, 5000);
    }, function () {});
  }
  function inUse(u) {
    var docs = [doc];
    try { var f = doc.getElementById('calIframe'); if (f && f.contentDocument) docs.push(f.contentDocument); } catch (_) {}
    try { if (host.parent !== host) docs.push(host.parent.document); } catch (_) {}
    return docs.some(function (d) { return !!d.querySelector('img[data-mk-dither-url="' + u + '"],[style*="' + u + '"]'); });
  }

  /* Each picture is decoded (off the main thread where the browser can) and
     shrunk once; every effect, tuning step and thumbnail then works from that
     small copy instead of decoding and halving the full photo again. */
  var SRC_MAX = 720, sources = new Map();
  function source(src) {
    var hit = sources.get(src);
    if (hit) { sources.delete(src); sources.set(src, hit); return hit; }
    var job = load(src, !sameOrigin(src)).then(function (im) {
      return (im.decode ? im.decode().catch(function () {}) : Promise.resolve()).then(function () {
        var nw = im.naturalWidth || im.width, nh = im.naturalHeight || im.height, s = Math.min(1, SRC_MAX / Math.max(nw, nh, 1));
        var cv = doc.createElement('canvas'); cv.width = Math.max(1, Math.round(nw * s)); cv.height = Math.max(1, Math.round(nh * s));
        drawScaled(cv.getContext('2d'), im, 0, 0, nw, nh, cv.width, cv.height);
        return cv;
      });
    });
    job.catch(function () { if (sources.get(src) === job) sources.delete(src); });
    sources.set(src, job);
    if (sources.size > 3) sources.delete(sources.keys().next().value);
    return job;
  }
  /* One job at a time, each in its own task: the page keeps answering clicks
     and slider drags between jobs. A job nobody waits for any more (every
     requester's opts.stale() is true when its turn comes) is skipped. */
  var lane = Promise.resolve();
  function nextTurn() { return new Promise(function (r) { host.setTimeout(r, 0); }); }
  function STALE() { var e = new Error('stale'); e.stale = true; return e; }

  /* Dithered blob URL for `src`. Tries the plain image (same origin), then a
     CORS copy; rejects when the host does not allow reading its pixels. */
  function url(src, opts) {
    opts = opts || {};
    var key = [src, opts.width | 0, opts.height | 0, opts.box ? opts.box.join('x') + '/' + opts.dot + '/' + (opts.pos || []).join(',') + '/' + (opts.scale || 1) : '', opts.mode || 'color', opts.levels || '', opts.colors || '', (opts.ink || []).join('.'), opts.cover ? 'c' : '', opts.normalize ? 'n' : '', opts.contrast || '', opts.sharpen == null ? '' : opts.sharpen, opts.cell || '', opts.keepAlpha ? 'a' : ''].join('|');
    if (cache.has(key)) {
      var hit = cache.get(key);
      if (hit._wants) { if (opts.stale) hit._wants.push(opts.stale); else hit._wants = null; }
      return hit;
    }
    // Kept from before (this browser, or minka-api): no work, and when it is
    // already in memory the URL is there at once (callers apply it in the same frame).
    var cs0 = opts.share ? canonSrc(src) : '', canon = cs0 ? cs0 + key.slice(src.length) : '';
    if (canon && stored.has(canon)) {
      var su = URL.createObjectURL(stored.get(canon));
      var sj = Promise.resolve(su);
      sj._url = su; sj._wants = null; sj._key = key; stats.local++;
      remember(key, sj);
      return sj;
    }
    var job = canon ? storedReady.then(function () {
      if (stored.has(canon)) { stats.local++; return URL.createObjectURL(stored.get(canon)); }
      return fxHash(canon).then(serverFx, function () { return null; }).then(function (b) {
        if (!b) return compute();
        stats.server++;
        fxHash(canon).then(function (hash) { keepLocal(canon, hash, b); }, function () {});
        return URL.createObjectURL(b);
      });
    }) : compute();
    function compute() {
    // Ready-made dither art is cropped pixel for pixel: never from the smoothed copy.
    var pic = opts.mode === 'recolor' ? load(src, !sameOrigin(src)) : source(src);
    return pic.then(function (im) {
      var run = lane.then(nextTurn).then(function () {
        if (job._wants && job._wants.every(function (f) { return f(); })) throw STALE();
        if (opts.box) {
          // Exactly the shown box, cropped like cover at opts.pos: one dither
          // pixel = `dot` CSS px, and the element shows it at 100% 100% — no stretch.
          var dot = opts.dot || 2;
          opts = Object.assign({}, opts, { width: Math.max(8, Math.floor(opts.box[0] / dot)), height: Math.max(8, Math.floor(opts.box[1] / dot)), cover: true });
        }
        var cv = image(im, opts);
        stats.computed++;
        return new Promise(function (resolve, reject) {
          cv.toBlob(function (b) {
            if (!b) { reject(new Error('toBlob')); return; }
            var u = URL.createObjectURL(b);
            if (canon) shareLater(canon, u, b);
            resolve(u);
          }, 'image/png');
        });
      });
      lane = run.then(null, function () {});
      return run;
    });
    }
    job._wants = opts.stale ? [opts.stale] : null;
    job._key = key;
    job.then(function (u) { job._url = u; }, function () {});
    job.catch(function () { if (cache.get(key) === job) cache.delete(key); });
    remember(key, job);
    return job;
  }

  /* Free what the appearance editor made once it is closed: the decoded
     pictures, and every finished result nothing on screen still shows.
     Jobs still running are left alone (their card is waiting for them). */
  function trim() {
    sources.clear();
    Array.from(cache.keys()).forEach(function (key) {
      var job = cache.get(key), u = job && job._url;
      if (!u || inUse(u)) return;
      cache.delete(key); decoded.delete(u); forget(u);
      try { URL.revokeObjectURL(u); } catch (_) {}
    });
  }

  /* ---------- "dither every image" ---------- */
  var mode = 'off';
  try { mode = MODES.indexOf(localStorage.getItem(KEY)) > 0 ? localStorage.getItem(KEY) : 'off'; } catch (_) {}
  var queue = [], queued = new WeakSet(), idle = 0, observer = null, failed = new Set();
  var ric = host.requestIdleCallback ? host.requestIdleCallback.bind(host) : function (fn) { return host.setTimeout(function () { fn({ timeRemaining: function () { return 8; }, didTimeout: false }); }, 60); };

  function eligible(img) {
    if (!img || img.tagName !== 'IMG' || !img.isConnected) return false;
    var src = img.currentSrc || img.src || '';
    if (!src || failed.has(src)) return false;
    if (/^data:image\/svg|\.svg(\?|#|$)|\.gif(\?|#|$)|^data:image\/gif/i.test(src)) return false;
    if (img.closest('[data-no-dither],#mk-app-loader,.mk-dither-art')) return false;
    return true;
  }
  function clear(img) {
    if (!img.hasAttribute('data-mk-dither-url')) return;
    img.style.removeProperty('content');
    img.removeAttribute('data-mk-dither-url');
    img.removeAttribute('data-mk-dither-src');
    img.classList.remove('mk-dithered');
  }
  function enqueue(img) {
    if (mode === 'off' || queued.has(img) || !eligible(img)) return;
    var src = img.currentSrc || img.src;
    if (img.getAttribute('data-mk-dither-src') === src) return;
    queued.add(img); queue.push(img);
    if (!idle) idle = ric(work, { timeout: 1500 });
  }
  function work(deadline) {
    idle = 0;
    while (queue.length && (deadline.didTimeout || deadline.timeRemaining() > 6)) {
      var img = queue.shift(); queued.delete(img);
      process(img);
    }
    if (queue.length) idle = ric(work, { timeout: 1500 });
  }
  function process(img) {
    if (mode === 'off' || !eligible(img)) return;
    if (!img.complete || !img.naturalWidth) { img.addEventListener('load', function () { enqueue(img); }, { once: true }); return; }
    var r = img.getBoundingClientRect();
    var cw = r.width || img.width, chh = r.height || img.height;
    if (cw < 40 || chh < 40 || img.naturalWidth < 40) return;           // icons, emoji, avatars
    // 2 CSS px per dither dot on large images, 1 on small ones; capped work.
    var dot = cw >= 180 ? 2 : 1, w = Math.min(420, Math.round(cw / dot)), h = Math.round(w * chh / cw);
    var fit = host.getComputedStyle(img).objectFit;
    var src = img.currentSrc || img.src, m = mode;
    var opts = fit === 'cover' ? { width: w, height: h, cover: true, mode: m } : { width: w, height: Math.round(w * img.naturalHeight / img.naturalWidth), mode: m };
    if (m === 'color') { opts.mode = 'palette'; opts.colors = 6; }
    url(src, opts).then(function (u) {
      if (mode !== m || (img.currentSrc || img.src) !== src) return;
      img.style.setProperty('content', 'url("' + u + '")');
      img.setAttribute('data-mk-dither-url', u);
      img.setAttribute('data-mk-dither-src', src);
      img.classList.add('mk-dithered');
    }, function () { failed.add(src); });
  }
  // Picker thumbnails paint their picture as an inline background (data-src
  // holds the URL): the dithered copy replaces it and the original comes back
  // when the option is turned off.
  var BG_SEL = '.mk-skin-thumb[data-src],[data-dither-bg]';
  function bgSrc(el) { return el.getAttribute('data-dither-bg') || el.getAttribute('data-src') || ''; }
  function processBg(el) {
    if (mode === 'off' || !el.isConnected || el.closest('[data-no-dither]')) return;
    var src = bgSrc(el), m = mode;
    if (!src || failed.has(src) || el.getAttribute('data-mk-dither-src') === src + '|' + m) return;
    var r = el.getBoundingClientRect(), bw = Math.max(48, Math.round(r.width) || 96), bh = Math.max(48, Math.round(r.height) || 96);
    url(src, { box: [bw, bh], dot: 2, mode: m === 'color' ? 'palette' : m, colors: 6, levels: 2, normalize: m === 'mono' }).then(function (u) {
      if (mode !== m || bgSrc(el) !== src) return;
      if (!el.hasAttribute('data-mk-dither-orig')) el.setAttribute('data-mk-dither-orig', el.style.getPropertyValue('background-image'));
      el.style.setProperty('background-image', 'url("' + u + '")', 'important');
      el.style.setProperty('image-rendering', 'pixelated');
      el.setAttribute('data-mk-dither-src', src + '|' + m);
    }, function () { failed.add(src); });
  }
  function clearBg(el) {
    if (!el.hasAttribute('data-mk-dither-orig')) return;
    var orig = el.getAttribute('data-mk-dither-orig');
    el.style.removeProperty('background-image'); if (orig) el.style.setProperty('background-image', orig);
    el.style.removeProperty('image-rendering');
    el.removeAttribute('data-mk-dither-orig'); el.removeAttribute('data-mk-dither-src');
  }
  function scan(root) {
    if (root.tagName === 'IMG') enqueue(root);
    else if (root.querySelectorAll) root.querySelectorAll('img').forEach(enqueue);
    if (root.matches && root.matches(BG_SEL)) queueBg(root);
    if (root.querySelectorAll) root.querySelectorAll(BG_SEL).forEach(queueBg);
  }
  var bgQueue = [], bgIdle = 0, io = null;
  // Only thumbnails that are actually on screen: hidden picker groups cost nothing.
  function queueBg(el) {
    if (mode === 'off') return;
    if (!io && host.IntersectionObserver) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); pushBg(en.target); } });
    });
    if (io) io.observe(el); else pushBg(el);
  }
  function pushBg(el) {
    if (mode === 'off') return;
    bgQueue.push(el);
    if (!bgIdle) bgIdle = ric(function run(dl) {
      bgIdle = 0;
      while (bgQueue.length && (dl.didTimeout || dl.timeRemaining() > 4)) processBg(bgQueue.shift());
      if (bgQueue.length) bgIdle = ric(run, { timeout: 1200 });
    }, { timeout: 1200 });
  }
  function ensureStyle() {
    if (doc.getElementById('mk-dither-style')) return;
    var st = doc.createElement('style'); st.id = 'mk-dither-style';
    st.textContent = 'img.mk-dithered{image-rendering:pixelated;image-rendering:crisp-edges}';
    (doc.head || doc.documentElement).appendChild(st);
  }
  function start() {
    ensureStyle();
    if (!observer) {
      observer = new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
          var rec = list[i];
          if (rec.type === 'attributes') {
            var img = rec.target;
            if (img.getAttribute('data-mk-dither-src') && img.getAttribute('data-mk-dither-src') !== (img.currentSrc || img.src)) clear(img);
            enqueue(img);
          } else for (var j = 0; j < rec.addedNodes.length; j++) if (rec.addedNodes[j].nodeType === 1) scan(rec.addedNodes[j]);
        }
      });
    }
    observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
    scan(doc.documentElement);
  }
  function stop() {
    if (observer) observer.disconnect();
    queue.length = 0; bgQueue.length = 0; if (io) { io.disconnect(); io = null; }
    doc.querySelectorAll('img[data-mk-dither-url]').forEach(clear);
    doc.querySelectorAll('[data-mk-dither-orig]').forEach(clearBg);
  }
  function apply(next) {
    next = MODES.indexOf(next) >= 0 ? next : 'off';
    var was = mode; mode = next;
    doc.documentElement.dataset.mkDitherImages = mode;
    if (was !== mode) { doc.querySelectorAll('img[data-mk-dither-url]').forEach(clear); doc.querySelectorAll('[data-mk-dither-orig]').forEach(clearBg); }
    if (mode === 'off') stop(); else start();
    skinAll();
    syncSwitches();
    try { host.dispatchEvent(new CustomEvent('mk-dither-images', { detail: { mode: mode } })); } catch (_) {}
  }
  function setMode(next) {
    next = MODES.indexOf(next) >= 0 ? next : 'off';
    try { localStorage.setItem(KEY, next); } catch (_) {}
    apply(next);
    // The embedded calendar is a separate document; same-tab storage events do
    // not reach it, so hand the change over directly.
    try { var f = doc.getElementById('calIframe'); if (f && f.contentWindow && f.contentWindow.MinkaDither) f.contentWindow.MinkaDither._apply(next); } catch (_) {}
    try { if (host.parent !== host && host.parent.MinkaDither) host.parent.MinkaDither._apply(next); } catch (_) {}
  }
  host.addEventListener('storage', function (e) { if (e.key === KEY) apply(e.newValue); });
  // Every "Dither attēli" switch in the app: <button data-dither-images="off|color|mono">.
  function owner() { try { if (host.parent !== host && host.parent.MinkaDither) return host.parent.MinkaDither; } catch (_) {} return host.MinkaDither; }
  function syncSwitches() {
    doc.querySelectorAll('[data-dither-images]').forEach(function (b) { var on = b.getAttribute('data-dither-images') === mode; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-active', on); });
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-dither-images]');
    if (!b) return;
    var eng = owner(); if (eng) eng.setMode(b.getAttribute('data-dither-images'));
  }, true);   // capture: the worker window stops click propagation

  /* ---------- card backgrounds (--mk-skin-img) ----------
     A card's picture is a CSS variable, not an <img>. The dithered copy goes
     into --mk-skin-dither and .mk-has-dither switches the card's layers to it
     (card-dither.css), so the skin code's own variable is never overwritten.
     Per card (skin fx): dither = fine Bayer in the card's ink on black,
     ditherpaper = the same on light paper, dithercolor = the picture's own
     palette. The Dither face defaults to the dark one. The app-wide option
     only fills in for cards without their own. Skins that are already dither
     art (skin-dither-*) are only shown pixel-sharp. */
  function hexToRgb(h) { h = String(h || '').replace('#', ''); return /^[0-9a-f]{6}$/i.test(h) ? [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }) : null; }
  /* Cards change size after their first paint (roster auto-sizing, the editor's
     preview, a window resize). A picture dithered for the old box would be
     stretched into the new one, so a card whose box changes is re-dithered. */
  var sizeWatch = host.ResizeObserver ? new host.ResizeObserver(function (entries) {
    entries.forEach(function (en) {
      var card = en.target;
      if (!card.isConnected) { sizeWatch.unobserve(card); return; }
      if (card.dataset.mkDitherKey && card.__dthSize !== card.offsetWidth + 'x' + card.offsetHeight) skin(card);
    });
  }) : null;
  /* The decoration (img.mk-card-addon, a transparent cut-out) with the card's
     effect: painted with the CSS content replacement, so the app's own src and
     sizing stay untouched and removing it restores the original at once. */
  function clearDecor(img) {
    if (!img.dataset.mkDitherDecor) return;
    delete img.dataset.mkDitherDecor;
    img.style.removeProperty('content'); img.style.removeProperty('image-rendering');
  }
  var decorSize = host.ResizeObserver ? new host.ResizeObserver(function (entries) {
    entries.forEach(function (en) {
      var img = en.target;
      if (!img.isConnected) { decorSize.unobserve(img); img.__dthWait = 0; return; }
      if (!img.offsetWidth || !img.offsetHeight) return;
      decorSize.unobserve(img); img.__dthWait = 0;
      if (img.parentElement) requestDecor(img.parentElement);
    });
  }) : null;
  // The card's ink for a decoration with its own effect but no own colour.
  function cardInk(card) {
    var cs = host.getComputedStyle(card);
    var v = (card.style.getPropertyValue('--dth-ink-rgb') || cs.getPropertyValue('--mk-num-color') || '').trim().split(',').map(Number);
    if (!(v.length === 3 && v.every(isFinite))) return [236, 234, 228];
    for (var i = 0; i < 10 && .2126 * v[0] + .7152 * v[1] + .0722 * v[2] < 110; i++) v = v.map(function (x) { return Math.round(x + (255 - x) * .18); });
    return v;
  }
  // A decoration's own effect (Dekori → Dekora efekts), whatever the card shows.
  // tune "bc": Smalkums (detail) and Kontrasts 0–9, 5/5 default — the same scale as the card's.
  function decorLook(fx, ink, tune) {
    var sharp = Math.max(1, Math.round(host.devicePixelRatio || 1));
    var tb = /^\d\d$/.test(tune || '') ? +tune[0] : 5, tc = /^\d\d$/.test(tune || '') ? +tune[1] : 5;
    var fine = Math.pow(1.8, (5 - tb) / 5), con = function (base) { return +(base * (0.7 + tc * .06)).toFixed(3); };
    if (fx === 'xray') return { mode: 'xray', normalize: true, contrast: con(.95), sharpen: +(.2 / fine).toFixed(2), dot: 1 / sharp, soft: true };
    if (fx === 'focus') return { mode: 'focus', normalize: true, contrast: con(1.1), sharpen: +(.25 / fine).toFixed(2), dot: 1 / sharp, soft: true };
    if (fx === 'duotone') return { mode: 'duotone', ink: ink, normalize: true, contrast: con(1.05), sharpen: +(.3 / fine).toFixed(2), dot: 1 / sharp, soft: true };
    if (fx === 'halftone' || fx === 'ascii' || fx === 'led') return { mode: fx, ink: ink, normalize: true, contrast: con(1.15), scale: sharp, cell: +fine.toFixed(2), dot: 1, soft: true };
    // Cell art on a small cut-out: finer cells than on the card, or the shape is lost.
    if (/^(mosaic|bricks|pixelate|pointillism)$/.test(fx)) return { mode: fx, normalize: true, contrast: con(1.05), scale: sharp, cell: +(fine * .7).toFixed(2), dot: 1, soft: true };
    if (/^(cmyk|riso|threshold|outline|posterize|heatmap|lines)$/.test(fx)) return { mode: fx, ink: ink, normalize: true, contrast: con(fx === 'outline' ? 1 : 1.08), sharpen: fx === 'outline' || fx === 'lines' ? 0 : .2, cell: +(fine * .8).toFixed(2), dot: 1 / sharp, soft: true };
    var dpx = Math.max(1, Math.min(4, Math.round(2 * fine)));
    return { mode: 'bayer', ink: ink.map(function (v) { return Math.round(6 + (v - 6) * .7); }), paper: [6, 6, 6], normalize: true, contrast: con(1.2), sharpen: .45, dot: dpx / sharp };
  }
  function decor(card) {
    if (!card || !card.querySelectorAll) return;
    card.querySelectorAll(':scope > img.mk-card-addon').forEach(function (img) {
      // Own effect first; 'card' (or unset + the card's "also on the decoration"
      // switch) follows the card's effect; 'none' keeps the plain picture.
      var own = img.dataset.addonFx || '', d = null;
      if (own && own !== 'card' && own !== 'none') d = decorLook(own, hexToRgb(img.dataset.addonColor || '') || cardInk(card), img.dataset.addonTune);
      else if (own === 'card' || (!own && card.__dthDecorOn)) d = card.__dthCardFx || null;
      if (!d) { clearDecor(img); return; }
      var src = img.currentSrc || img.src, w = img.offsetWidth, h = img.offsetHeight;
      if (!src) return;
      if (!w || !h || !img.naturalWidth) {
        if (!img.__dthWait) {
          img.__dthWait = 1;
          // Loaded but not laid out yet (a hidden card): no load event is coming,
          // so wait for it to get a size instead.
          if (img.complete && img.naturalWidth && decorSize) decorSize.observe(img);
          else img.addEventListener('load', function () { img.__dthWait = 0; requestDecor(card); }, { once: true });
        }
        return;
      }
      // The shown picture (object-fit: contain in the element's box), in dots.
      var ar = img.naturalWidth / img.naturalHeight, shownW = Math.min(w, h * ar);
      var o = { mode: d.mode, ink: d.ink, paper: d.paper, colors: d.colors, normalize: d.normalize, contrast: d.contrast, sharpen: d.sharpen, cell: d.cell, scale: d.scale, keepAlpha: true,
        width: Math.max(8, Math.min(600, Math.round(shownW / d.dot))) };
      // The decoration's own colour (picked separately from the card's): it becomes
      // the effect's ink; effects without an ink (rentgens, krāsains) tint it as duotone.
      var own = hexToRgb(img.dataset.addonColor || ''), soft = d.soft;
      if (own) {
        o.ink = own;
        if (o.mode === 'xray' || o.mode === 'palette') { o.mode = 'duotone'; o.normalize = true; o.colors = null; if (!o.contrast) o.contrast = 1.05; soft = true;
          o.width = Math.max(8, Math.min(600, Math.round(shownW * Math.max(1, Math.round(host.devicePixelRatio || 1))))); }
      }
      var key = src + '|' + [o.mode, (o.ink || []).join('.'), o.width, o.contrast, o.cell || '', o.paper ? o.paper.join('.') : '', o.sharpen == null ? '' : o.sharpen].join('|');
      if (img.dataset.mkDitherDecor === key) return;
      img.dataset.mkDitherDecor = key;
      o.stale = function () { return !img.isConnected || img.dataset.mkDitherDecor !== key; };
      o.share = rosterCard(card);
      var paint = function (u) {
        img.style.setProperty('content', 'url("' + u + '")');
        img.style.setProperty('image-rendering', soft ? 'auto' : 'pixelated');
      };
      var dj = url(src, o);
      if (o.share && dj._url) paint(dj._url);   // already made or kept: the same frame
      dj.then(ready).then(function (u) {
        if (o.share) ensureKept(src, dj, u);
        if (img.dataset.mkDitherDecor !== key) return;
        paint(u);
      }, function () { if (img.dataset.mkDitherDecor === key) clearDecor(img); });
    });
  }
  // Called by card-addons.js whenever it (re)creates a card's decoration.
  var decorFrame = 0, decorCards = new Set();
  function requestDecor(card) {
    decorCards.add(card);
    if (decorFrame) return;
    decorFrame = (host.requestAnimationFrame || host.setTimeout)(function () {
      decorFrame = 0; var list = Array.from(decorCards); decorCards.clear();
      list.forEach(function (c) { if (c.isConnected) decor(c); });
    });
  }
  /* Fokuss lens: a window inside the picture layer (clipped with it, under the
     numeral and chips) with crop corners and a centre cross. Static DOM, built
     once per card; its picture lines up with the card's own crop. */
  function showFocus(card, u) {
    var bg = card.querySelector(':scope > .mk-wf-background');
    if (!bg) return;                                  // classic cards without a face: halftone only
    var lens = bg.querySelector(':scope > .mk-focus');
    if (!lens) {
      lens = doc.createElement('span'); lens.className = 'mk-focus'; lens.setAttribute('aria-hidden', 'true');
      lens.innerHTML = '<span class="mk-focus-win"><b></b></span><i></i><i></i><i></i><i></i><em></em>';
      bg.append(lens);
    }
    card.style.setProperty('--mk-skin-focus', 'url("' + u + '")');
  }
  /* Plakāts: the card body behind the picture window — charcoal with a fixed
     grain, a barcode and a small caption. One static element per card. */
  var POSTER_BODY = '<i class="mk-poster-code"></i>';
  function showPoster(card) {
    if (card.querySelector(':scope > .mk-poster')) return;
    var bg = card.querySelector(':scope > .mk-wf-background');
    if (!bg) return;
    var el = doc.createElement('span'); el.className = 'mk-poster'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = POSTER_BODY;
    card.insertBefore(el, bg);
  }
  function clearPoster(card) {
    card.querySelectorAll(':scope > .mk-poster').forEach(function (el) { el.remove(); });
  }
  function clearFocus(card) {
    // The lens may have arrived in a copied card (preset thumbnails): remove it by element, not by style.
    card.style.removeProperty('--mk-skin-focus');
    card.querySelectorAll(':scope > .mk-wf-background > .mk-focus').forEach(function (el) { el.remove(); });
  }
  function clearSkin(card) {
    clearFocus(card); clearPoster(card);
    if (card.__dthCardFx) { card.__dthCardFx = null; card.__dthDecorOn = false; decor(card); }
    if (sizeWatch && card.__dthSize) { sizeWatch.unobserve(card); card.__dthSize = ''; }
    // Always drop the key: a job still running for this card must not paint its
    // effect after the effect was switched off (its stale() check sees no key).
    delete card.dataset.mkDitherKey;
    card.classList.remove('mk-dither-failed');
    if (!card.classList.contains('mk-has-dither') && !card.style.getPropertyValue('--mk-skin-dither')) return;
    card.classList.remove('mk-has-dither', 'mk-dither-native');
    card.style.removeProperty('--mk-skin-dither');
  }
  /* skin() is called for every card on every repaint (and for each preset
     thumbnail while the editor opens). The work that needs computed styles and
     layout is batched: one read pass for all queued cards in the next frame,
     then the writes — never a forced style recalculation per card. */
  function wanted(card) {
    var face = card.getAttribute('data-watch-face') === 'dither';
    var fx = card.classList.contains('mk-fx-dithercolor') || card.classList.contains('mk-fx-ditherpaper') || card.classList.contains('mk-fx-dither') || card.classList.contains('mk-fx-pic');
    var m = (card.style.getPropertyValue('--mk-skin-img') || '').match(/url\((['"]?)([^'")]+)\1\)/);
    return face || fx || mode !== 'off' || !!(m && /skin-dither-/.test(m[2]));
  }
  var pendingSkins = new Set(), skinFrame = 0, skinTimer = 0;
  // settled(): resolves once no card is queued or waiting for its picture — the
  // calendar waits for it (capped) before it is first shown.
  var busySkins = 0, idleWaiters = [];
  function checkIdle() {
    if (busySkins || pendingSkins.size || skinFrame) return;
    var w = idleWaiters; idleWaiters = [];
    w.forEach(function (f) { f(); });
  }
  function settled() { return new Promise(function (resolve) { idleWaiters.push(resolve); checkIdle(); }); }
  function skin(card) {
    if (!card || !card.style) return;
    if (!wanted(card)) { pendingSkins.delete(card); clearSkin(card); checkIdle(); return; }
    pendingSkins.add(card);
    if (skinFrame) return;
    skinFrame = host.requestAnimationFrame ? host.requestAnimationFrame(flushSkins) : 1;
    // rAF can stall (hidden frame): a timer makes sure the batch still runs.
    skinTimer = host.setTimeout(flushSkins, 120);
  }
  function flushSkins() {
    if (skinFrame && host.cancelAnimationFrame) host.cancelAnimationFrame(skinFrame);
    host.clearTimeout(skinTimer); skinFrame = 0; skinTimer = 0;
    var cards = [], snaps = [];
    pendingSkins.forEach(function (card) {
      if (!card.isConnected) return;
      var cs = host.getComputedStyle(card);
      cards.push(card);
      snaps.push({ tint: cs.getPropertyValue('--wf-tint').trim(), num: cs.getPropertyValue('--mk-num-color').trim(), bx: cs.getPropertyValue('--wf-bg-x'), by: cs.getPropertyValue('--wf-bg-y'), zoom: cs.getPropertyValue('--wf-zoom-ratio'), w: card.offsetWidth, h: card.offsetHeight });
    });
    pendingSkins.clear();
    for (var i = 0; i < cards.length; i++) paintSkin(cards[i], snaps[i]);
    checkIdle();
  }
  function paintSkin(card, snap) {
    var face = card.getAttribute('data-watch-face') === 'dither';
    var fx = card.classList.contains('mk-fx-dithercolor') ? 'palette' : card.classList.contains('mk-fx-ditherpaper') ? 'paper' : card.classList.contains('mk-fx-dither') ? 'dark'
      : card.classList.contains('mk-fx-xray') ? 'xray' : card.classList.contains('mk-fx-focus') ? 'focus' : card.classList.contains('mk-fx-split') ? 'split' : card.classList.contains('mk-fx-poster') ? 'poster' : card.classList.contains('mk-fx-mosaic') ? 'mosaic' : card.classList.contains('mk-fx-bricks') ? 'bricks' : card.classList.contains('mk-fx-lines') ? 'lines' : card.classList.contains('mk-fx-led') ? 'led'
      : /\bmk-fx-(pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)\b/.test(card.className) ? card.className.match(/\bmk-fx-(pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)\b/)[1] : card.classList.contains('mk-fx-halftone') ? 'halftone' : card.classList.contains('mk-fx-duotone') ? 'duotone' : card.classList.contains('mk-fx-ascii') ? 'ascii' : '';
    var dithered = fx === 'palette' || fx === 'paper' || fx === 'dark';
    var want = fx || (face ? 'dark' : mode !== 'off' ? (mode === 'color' ? 'palette' : 'mono') : '');
    var raw = card.style.getPropertyValue('--mk-skin-img') || '';
    var m = raw.match(/url\((['"]?)([^'")]+)\1\)/);
    // The card may have changed since it was queued.
    if (!want && !(m && /skin-dither-/.test(m[2]))) { clearSkin(card); return; }
    // Ink for the numeral's dithered extrusion: the face tint, else the skin's number colour.
    var ink = (face ? hexToRgb(snap.tint) : null) || snap.num.split(',').map(Number);
    if (!(ink && ink.length === 3 && ink.every(isFinite))) ink = [236, 234, 228];
    var lumI = function (c) { return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    // Readable ink: light enough on the dark ground, dark enough on paper.
    if (want === 'paper') { for (var i2 = 0; i2 < 10 && lumI(ink) > 95; i2++) ink = ink.map(function (v) { return Math.round(v * .8); }); }
    else { for (var i3 = 0; i3 < 10 && lumI(ink) < 110; i3++) ink = ink.map(function (v) { return Math.round(v + (255 - v) * .18); }); }
    card.style.setProperty('--dth-ink-rgb', ink.join(','));
    var hours = card.querySelector('.mk-mid-hours');
    if (hours && (face || dithered)) hours.setAttribute('data-dth-num', (hours.textContent || '').trim());
    if (face && !m && raw) { colourScene(card, raw); return; }
    // Ready-made dither art always follows the card's colour, effect on or not.
    if (!m || (!want && !/skin-dither-/.test(m[2]))) {
      clearSkin(card);
      // An effect on a colour / gradient background has no picture to work on:
      // mark it so the "effect is computing" placeholder never hides that background.
      if (want && !m) card.classList.add('mk-dither-failed');
      return;
    }
    var src = m[2];
    // Layout size (offset*, not the scaled preview's rect) and the image crop point.
    var w = snap.w || 240, h = snap.h || 240;
    // The face's image zoom scales the picture layer (card-faces.css); the dither
    // is computed that much finer, so after the same zoom its dots keep their size
    // and the crop is exactly the one the plain picture showed.
    var zoom = Math.max(1, Math.min(2.5, parseFloat(snap.zoom) || 1));
    var dot = (host.devicePixelRatio || 1) >= 1.5 ? 1 : 2;
    var box = [Math.round(w / dot) * dot, Math.round(h / dot) * dot];
    var pos = [parseFloat(snap.bx) / 100, parseFloat(snap.by) / 100].map(function (v) { return isFinite(v) ? Math.max(0, Math.min(1, v)) : .5; });
    // The picture's dots are a step quieter than the numeral drawn on top of them.
    var dotInk = want === 'paper' ? ink.map(function (v) { return Math.round(v + (239 - v) * .18); }) : ink.map(function (v) { return Math.round(6 + (v - 6) * .7); });
    var native = /skin-dither-/.test(src);   // ready-made dither art: only recoloured
    if (native && !want) want = 'dark';
    // …unless a non-dither effect was picked for it (rentgens, rastrs, duotons,
    // ASCII): that one is really applied, just as its thumbnail shows.
    var real = !native || /^(xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)$/.test(fx);
    // Plakāts: the picture sits in a window (card-dither.css), so it is computed for that box.
    if (want === 'poster') { w = Math.round(w * .88); h = Math.round(h * .6); }
    var sharp = Math.max(1, Math.round(host.devicePixelRatio || 1));
    // Per-card tuning packed in the skin's fxs field: "1.bc" → b = detail 0–9, c = contrast 0–9 (5/5 default).
    var tune = parseFloat(card.style.getPropertyValue('--mk-fx-scale')), tb = 5, tc = 5;
    if (isFinite(tune) && fx) { var hund = Math.round(tune * 100); tb = Math.floor(hund / 10) % 10; tc = hund % 10; }
    var fine = Math.pow(1.8, (5 - tb) / 5);                     // <1 finer, >1 coarser
    var con = function (base) { return +(base * (0.7 + tc * .06)).toFixed(3); };
    var fxDot = Math.max(1, Math.min(4, Math.round(2 * fine))) / sharp;  // dither dot: device pixels → CSS
    if (fx && real) { dot = fxDot; box = [Math.round(w / dot) * dot, Math.round(h / dot) * dot]; }
    var effect = function (dot) {
      return want === 'xray' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'xray', normalize: true, contrast: con(.95), sharpen: +(.2 / fine).toFixed(2) }
      : want === 'duotone' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'duotone', ink: ink, normalize: true, contrast: con(1.05), sharpen: +(.3 / fine).toFixed(2) }
      : (want === 'halftone' || want === 'ascii' || want === 'led') ? { box: [w, h], dot: 1, pos: pos, mode: want, ink: ink, normalize: true, contrast: con(1.15), scale: sharp, cell: +fine.toFixed(2) }
      : /^(cmyk|riso|threshold|outline|posterize|heatmap)$/.test(want) ? { box: box, dot: 1 / sharp, pos: pos, mode: want, ink: ink, normalize: true, contrast: con(want === 'outline' ? 1 : 1.08), sharpen: want === 'outline' ? 0 : .2, cell: +fine.toFixed(2) }
      : (want === 'mosaic' || want === 'bricks' || want === 'pixelate' || want === 'pointillism') ? { box: [w, h], dot: 1, pos: pos, mode: want, normalize: true, contrast: con(1.05), scale: sharp, cell: +fine.toFixed(2) }
      : want === 'lines' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'lines', ink: ink, normalize: true, contrast: con(1.1), cell: +fine.toFixed(2) }
      // Fokuss: the picture as a fine neutral halftone; the lens (below) shows it in colour.
      : want === 'poster' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'poster', ink: ink, normalize: true, contrast: con(1.12), sharpen: +(.35 / fine).toFixed(2) }
      : want === 'split' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'mono', normalize: true, contrast: con(1.08), sharpen: +(.25 / fine).toFixed(2) }
      : want === 'focus' ? { box: [w, h], dot: 1, pos: pos, mode: 'halftone', ink: [188, 188, 184], normalize: true, contrast: con(1.15), scale: sharp, cell: +(fine * .5).toFixed(2) }
      : want === 'palette' ? { box: box, dot: dot, pos: pos, mode: 'palette', colors: 8, contrast: con(1.06) }
      : want === 'mono' ? { box: box, dot: dot, pos: pos, mode: 'bayer', ink: [236, 234, 228], paper: [8, 8, 8], normalize: true, contrast: 1.15 }
      : { box: box, dot: dot, pos: pos, mode: 'bayer', ink: dotInk, paper: want === 'paper' ? [239, 236, 228] : [6, 6, 6], normalize: true, contrast: con(1.2), sharpen: .45 };
    };
    var opts = real ? effect(dot) : { box: box, dot: 1, pos: pos, mode: 'recolor', ink: ink, sharpen: 0 };
    var tint = dotInk;
    // "Efekts arī dekoram" — the tuning's integer part is 2 (fxs "2.bc"): the card's
    // decoration (a transparent cut-out) gets the same effect, same ink and grain.
    // On ready-made dither art the decoration is dithered in the art's own look.
    var dfx = fx ? (real ? opts : effect(fxDot)) : null;
    card.__dthDecorOn = !!dfx && isFinite(tune) && Math.floor(tune + 1e-6) >= 2;
    card.__dthCardFx = dfx ? {
      mode: dfx.mode, ink: dfx.ink, paper: dfx.paper, colors: dfx.colors, normalize: dfx.normalize,
      contrast: dfx.contrast, sharpen: dfx.sharpen, cell: dfx.cell, scale: dfx.scale,
      dot: /^(halftone|ascii|focus|mosaic|bricks|led|pixelate|pointillism)$/.test(want) ? 1 : dfx.dot, soft: /^(xray|duotone|halftone|ascii|focus|poster|split|mosaic|bricks|lines|led|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)$/.test(want)
    } : null;
    if (card.querySelector(':scope > img.mk-card-addon')) requestDecor(card);
    if (zoom > 1) opts.dot = opts.dot / zoom;
    var key = [src, want, box.join('x'), pos.join(','), (!real || !dithered ? ink : tint).join('.'), tb, tc, zoom.toFixed(2)].join('|');
    if (sizeWatch && !card.__dthSize) sizeWatch.observe(card);
    card.__dthSize = w + 'x' + h;
    if (card.dataset.mkDitherKey === key) return;
    card.dataset.mkDitherKey = key;
    // While a slider is dragged only the last value is computed.
    // A card that left the page (closed editor, re-rendered roster) needs nothing either.
    opts.stale = function () { return !card.isConnected || card.dataset.mkDitherKey !== key; };
    card.classList.remove('mk-dither-failed');
    busySkins++;
    var roster = rosterCard(card);
    opts.share = roster;
    var lensJob = want === 'focus' || want === 'split' ? url(src, { box: box, dot: 1 / sharp, pos: pos, mode: want === 'split' ? 'vivid' : 'focus', normalize: want !== 'split', contrast: con(want === 'split' ? 1.04 : 1.1), sharpen: +(.25 / fine).toFixed(2), stale: opts.stale, share: opts.share }) : null;
    var lens = lensJob ? lensJob.then(ready) : null;
    if (!lens) clearFocus(card);
    if (want === 'poster') showPoster(card); else clearPoster(card);
    // Already made (same day, same size, or kept from before): set it now, in
    // the frame the card first shows. Else the latest one of this picture +
    // effect stands in until the exact one is there.
    var like = [src, want, (!real || !dithered ? ink : tint).join('.'), tb, tc].join('|');
    var main = url(src, opts);
    var nowU = roster ? main._url || recent.get(like) : null;
    if (nowU) { card.style.setProperty('--mk-skin-dither', 'url("' + nowU + '")'); card.classList.add('mk-has-dither'); }
    var nowL = roster && lensJob ? lensJob._url || recentLens.get(like) : null;
    if (nowL) showFocus(card, nowL);
    main.then(ready).then(function (u) {
      if (roster) { keepRecent(recent, like, u); ensureKept(src, main, u); }
      if (card.dataset.mkDitherKey !== key) return;
      card.style.setProperty('--mk-skin-dither', 'url("' + u + '")');
      card.classList.add('mk-has-dither');
      if (lens) return lens.then(function (lu) { if (roster) { keepRecent(recentLens, like, lu); ensureKept(src, lensJob, lu); } if (card.dataset.mkDitherKey === key) showFocus(card, lu); }, function () {});
    }, function () {
      // Pixels not readable (a host without CORS): show the plain picture instead.
      if (card.dataset.mkDitherKey === key) { clearSkin(card); card.classList.add('mk-dither-failed'); }
    }).then(function () { busySkins--; checkIdle(); });
  }
  // Dither face on a plain colour or gradient: a lit sphere + soft ramp drawn
  // in that colour and dithered, so picking a colour recolours the dither.
  function parseColours(raw) {
    var out = [], re = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)|#([0-9a-f]{6})\b/gi, mm;
    while ((mm = re.exec(raw)) && out.length < 3) out.push(mm[4] ? hexToRgb(mm[4]) : [+mm[1], +mm[2], +mm[3]]);
    return out;
  }
  function colourScene(card, raw) {
    var cols = parseColours(raw);
    if (!cols.length) { clearSkin(card); return; }
    var ink = cols[0].slice(), lum = function (c) { return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    for (var i = 0; i < 8 && lum(ink) < 150; i++) ink = ink.map(function (v) { return Math.round(v + (255 - v) * .25); });
    var key = 'scene|' + ink.join('.');
    if (card.dataset.mkDitherKey === key) return;
    card.dataset.mkDitherKey = key;
    var job = cache.get(key);
    if (!job) {
      var cv = doc.createElement('canvas'); cv.width = cv.height = 120;
      var c = cv.getContext('2d');
      var g = c.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#000'); g.addColorStop(1, '#2a2a2a');
      c.fillStyle = g; c.fillRect(0, 0, 120, 120);
      var r = c.createRadialGradient(34, 30, 4, 58, 70, 64); r.addColorStop(0, '#fff'); r.addColorStop(.45, '#8a8a8a'); r.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = r; c.beginPath(); c.arc(70, 78, 62, 0, Math.PI * 2); c.fill();
      var dim = ink.map(function (v) { return Math.round(6 + (v - 6) * .7); });
      var out = image(cv, { width: 120, height: 120, mode: 'duo', levels: 2, ink: dim, paper: [6, 6, 6] });
      job = new Promise(function (resolve, reject) { out.toBlob(function (b) { b ? resolve(URL.createObjectURL(b)) : reject(new Error('toBlob')); }, 'image/png'); });
      job.then(function (u) { job._url = u; }, function () {});
      remember(key, job);
    }
    if (job._url && rosterCard(card)) { card.style.setProperty('--mk-skin-dither', 'url("' + job._url + '")'); card.classList.add('mk-has-dither'); }
    job.then(function (u) {
      if (card.dataset.mkDitherKey !== key) return;
      card.style.setProperty('--mk-skin-dither', 'url("' + u + '")');
      card.classList.add('mk-has-dither');
    }, function () {});
  }
  // skin() itself decides per card (its own effect, the Dither face, the app-wide
  // option); turning the app-wide option off must not drop a card's own effect.
  function skinAll() {
    doc.querySelectorAll('[style*="--mk-skin-img"]').forEach(skin);
  }

  host.MinkaDither = {
    bayer8: BAYER8, image: image, url: url, atkinson: atkinson,
    mode: function () { return mode; }, setMode: setMode, skin: skin, decor: requestDecor, ready: ready, trim: trim, settled: settled, _apply: apply, _cache: cache,
    // The queued cards now, not in the next frame: a day switch held in a View
    // Transition gets no animation frames until it is shown (calendar.js).
    flush: function () { if (pendingSkins.size) flushSkins(); if (decorFrame) { var list = Array.from(decorCards); decorCards.clear(); list.forEach(function (c) { if (c.isConnected) decor(c); }); } },
    _stored: stored, _storedReady: storedReady, _stats: stats
  };
  // Cards painted before this script ran still get their effect.
  function boot() { if (mode !== 'off') apply(mode); else skinAll(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(window);
