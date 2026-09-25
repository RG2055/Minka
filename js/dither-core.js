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
    if (kind === 'xray') ramp = [[2, 6, 12], [14, 40, 66], [60, 128, 170], [205, 234, 250], [250, 253, 255]];
    else ramp = [ink.map(function (v) { return Math.round(v * .08); }), ink.map(function (v) { return Math.round(v * .55); }), ink, ink.map(function (v) { return Math.round(v + (255 - v) * .78); })];
    var n = ramp.length - 1, invert = false;
    if (kind === 'xray') {
      // Film is dark with bright structures: invert light pictures only.
      var sum = 0; for (var q = 0; q < d.length; q += 16) sum += .2126 * d[q] + .7152 * d[q + 1] + .0722 * d[q + 2];
      invert = sum / (d.length / 16) > 118;
    }
    for (var p = 0; p < d.length; p += 4) {
      var l = (.2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]) / 255;
      if (kind === 'xray') { if (invert) l = 1 - l; l = Math.pow(l, 1.12); }   // soft gamma, no S-curve: smooth film tones
      var f = l * n, i = Math.min(n - 1, Math.floor(f)), t = f - i, a = ramp[i], b = ramp[i + 1];
      d[p] = a[0] + (b[0] - a[0]) * t; d[p + 1] = a[1] + (b[1] - a[1]) * t; d[p + 2] = a[2] + (b[2] - a[2]) * t; d[p + 3] = 255;
    }
  }
  /* Halftone (round dots on a grid) and ASCII (characters by brightness),
     drawn at device resolution (opts.scale) so dots and letters stay smooth. */
  var ASCII_RAMP = " .'`,:;-~=+*ox#%&@";
  function patternArt(d, w, h, opts) {
    var f = opts.cell || 1, k = opts.scale || 1, ink = opts.ink || [236, 234, 228];
    var cell = opts.mode === 'ascii' ? [4 * f, 6.5 * f] : [5 * f, 5 * f];
    var cols = Math.max(1, Math.floor(w / cell[0])), rows = Math.max(1, Math.floor(h / cell[1]));
    var cw = Math.max(1, Math.round(cell[0])), chh = Math.max(1, Math.round(cell[1]));
    var out = doc.createElement('canvas'); out.width = Math.round(w * k); out.height = Math.round(h * k);
    var c = out.getContext('2d'); c.fillStyle = '#060606'; c.fillRect(0, 0, out.width, out.height);
    c.fillStyle = 'rgb(' + ink.join(',') + ')';
    if (opts.mode === 'ascii') { c.font = '700 ' + (cell[1] * 1.05 * k).toFixed(1) + 'px ui-monospace,Menlo,Consolas,monospace'; c.textBaseline = 'top'; }
    for (var gy = 0; gy < rows; gy++) for (var gx = 0; gx < cols; gx++) {
      var sum = 0, cnt = 0;
      var y0 = Math.floor(gy * cell[1]), x0 = Math.floor(gx * cell[0]);
      for (var y = y0; y < y0 + chh && y < h; y++) for (var x = x0; x < x0 + cw && x < w; x++) {
        var p = (y * w + x) * 4; sum += .2126 * d[p] + .7152 * d[p + 1] + .0722 * d[p + 2]; cnt++;
      }
      var l = cnt ? sum / cnt / 255 : 0;
      if (opts.mode === 'ascii') {
        var ch = ASCII_RAMP[Math.min(ASCII_RAMP.length - 1, Math.floor(l * ASCII_RAMP.length))];
        if (ch !== ' ') c.fillText(ch, gx * cell[0] * k, gy * cell[1] * k);
      } else {
        var r = Math.sqrt(l) * cell[0] * .62 * k;
        if (r > .35 * k) { c.beginPath(); c.arc((gx + .5) * cell[0] * k, (gy + .5) * cell[1] * k, r, 0, 6.2832); c.fill(); }
      }
    }
    return out;
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
    if (opts.mode === 'halftone' || opts.mode === 'ascii') return patternArt(id.data, w, h, opts);
    if (opts.sharpen !== 0) sharpen(id.data, w, h, opts.sharpen || .35);
    if (opts.mode === 'xray' || opts.mode === 'duotone') { toneMap(id.data, opts.mode, opts.ink || [236, 234, 228]); ctx.putImageData(id, 0, 0); return cv; }
    if (opts.mode === 'bayer') bayerTone(id.data, w, h, opts.ink || [236, 236, 232], opts.paper || [6, 6, 6], opts.gamma || 1);
    else if (opts.mode === 'palette') diffusePalette(id.data, w, h, paletteOf(id.data, opts.colors || 6));
    else atkinson(id.data, w, h, opts.mode || 'color', opts.levels || (opts.mode === 'color' ? 3 : 2), opts.ink, opts.paper);
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  // Resolve once the image is decoded, so swapping it in never shows an empty frame.
  var decoded = new Set();
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
    Promise.resolve(old).then(function (u) {
      if (!u || inUse(u)) return;
      try { URL.revokeObjectURL(u); } catch (_) {}
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
    var key = [src, opts.width | 0, opts.height | 0, opts.box ? opts.box.join('x') + '/' + opts.dot + '/' + (opts.pos || []).join(',') + '/' + (opts.scale || 1) : '', opts.mode || 'color', opts.levels || '', opts.colors || '', (opts.ink || []).join('.'), opts.cover ? 'c' : '', opts.normalize ? 'n' : '', opts.contrast || '', opts.sharpen == null ? '' : opts.sharpen, opts.cell || ''].join('|');
    if (cache.has(key)) {
      var hit = cache.get(key);
      if (hit._wants) { if (opts.stale) hit._wants.push(opts.stale); else hit._wants = null; }
      return hit;
    }
    // Ready-made dither art is cropped pixel for pixel: never from the smoothed copy.
    var pic = opts.mode === 'recolor' ? load(src, !sameOrigin(src)) : source(src);
    var job = pic.then(function (im) {
      var run = lane.then(nextTurn).then(function () {
        if (job._wants && job._wants.every(function (f) { return f(); })) throw STALE();
        if (opts.box) {
          // Exactly the shown box, cropped like cover at opts.pos: one dither
          // pixel = `dot` CSS px, and the element shows it at 100% 100% — no stretch.
          var dot = opts.dot || 2;
          opts = Object.assign({}, opts, { width: Math.max(8, Math.floor(opts.box[0] / dot)), height: Math.max(8, Math.floor(opts.box[1] / dot)), cover: true });
        }
        var cv = image(im, opts);
        return new Promise(function (resolve, reject) {
          cv.toBlob(function (b) { b ? resolve(URL.createObjectURL(b)) : reject(new Error('toBlob')); }, 'image/png');
        });
      });
      lane = run.then(null, function () {});
      return run;
    });
    job._wants = opts.stale ? [opts.stale] : null;
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
      cache.delete(key); decoded.delete(u);
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
  function clearSkin(card) {
    if (!card.classList.contains('mk-has-dither') && !card.style.getPropertyValue('--mk-skin-dither')) return;
    card.classList.remove('mk-has-dither', 'mk-dither-native');
    card.style.removeProperty('--mk-skin-dither');
    delete card.dataset.mkDitherKey;
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
  function skin(card) {
    if (!card || !card.style) return;
    if (!wanted(card)) { pendingSkins.delete(card); clearSkin(card); return; }
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
      snaps.push({ tint: cs.getPropertyValue('--wf-tint').trim(), num: cs.getPropertyValue('--mk-num-color').trim(), bx: cs.getPropertyValue('--wf-bg-x'), by: cs.getPropertyValue('--wf-bg-y'), w: card.offsetWidth, h: card.offsetHeight });
    });
    pendingSkins.clear();
    for (var i = 0; i < cards.length; i++) paintSkin(cards[i], snaps[i]);
  }
  function paintSkin(card, snap) {
    var face = card.getAttribute('data-watch-face') === 'dither';
    var fx = card.classList.contains('mk-fx-dithercolor') ? 'palette' : card.classList.contains('mk-fx-ditherpaper') ? 'paper' : card.classList.contains('mk-fx-dither') ? 'dark'
      : card.classList.contains('mk-fx-xray') ? 'xray' : card.classList.contains('mk-fx-halftone') ? 'halftone' : card.classList.contains('mk-fx-duotone') ? 'duotone' : card.classList.contains('mk-fx-ascii') ? 'ascii' : '';
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
    if (!m || (!want && !/skin-dither-/.test(m[2]))) { clearSkin(card); return; }
    var src = m[2];
    // Layout size (offset*, not the scaled preview's rect) and the image crop point.
    var w = snap.w || 240, h = snap.h || 240;
    var dot = (host.devicePixelRatio || 1) >= 1.5 ? 1 : 2;
    var box = [Math.round(w / dot) * dot, Math.round(h / dot) * dot];
    var pos = [parseFloat(snap.bx) / 100, parseFloat(snap.by) / 100].map(function (v) { return isFinite(v) ? Math.max(0, Math.min(1, v)) : .5; });
    // The picture's dots are a step quieter than the numeral drawn on top of them.
    var dotInk = want === 'paper' ? ink.map(function (v) { return Math.round(v + (239 - v) * .18); }) : ink.map(function (v) { return Math.round(6 + (v - 6) * .7); });
    var native = /skin-dither-/.test(src);   // ready-made dither art: only recoloured
    if (native && !want) want = 'dark';
    var sharp = Math.max(1, Math.round(host.devicePixelRatio || 1));
    // Per-card tuning packed in the skin's fxs field: "1.bc" → b = detail 0–9, c = contrast 0–9 (5/5 default).
    var tune = parseFloat(card.style.getPropertyValue('--mk-fx-scale')), tb = 5, tc = 5;
    if (isFinite(tune) && fx) { var hund = Math.round(tune * 100); tb = Math.floor(hund / 10) % 10; tc = hund % 10; }
    var fine = Math.pow(1.8, (5 - tb) / 5);                     // <1 finer, >1 coarser
    var con = function (base) { return +(base * (0.7 + tc * .06)).toFixed(3); };
    if (fx && !native) {
      var dpx = Math.max(1, Math.min(4, Math.round(2 * fine)));  // dither dot in device pixels
      dot = dpx / sharp; box = [Math.round(w / dot) * dot, Math.round(h / dot) * dot];
    }
    var opts = native ? { box: box, dot: 1, pos: pos, mode: 'recolor', ink: ink, sharpen: 0 }
      : want === 'xray' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'xray', normalize: true, contrast: con(.95), sharpen: +(.2 / fine).toFixed(2) }
      : want === 'duotone' ? { box: box, dot: 1 / sharp, pos: pos, mode: 'duotone', ink: ink, normalize: true, contrast: con(1.05), sharpen: +(.3 / fine).toFixed(2) }
      : (want === 'halftone' || want === 'ascii') ? { box: [w, h], dot: 1, pos: pos, mode: want, ink: ink, normalize: true, contrast: con(1.15), scale: sharp, cell: +fine.toFixed(2) }
      : want === 'palette' ? { box: box, dot: dot, pos: pos, mode: 'palette', colors: 8, contrast: con(1.06) }
      : want === 'mono' ? { box: box, dot: dot, pos: pos, mode: 'bayer', ink: [236, 234, 228], paper: [8, 8, 8], normalize: true, contrast: 1.15 }
      : { box: box, dot: dot, pos: pos, mode: 'bayer', ink: dotInk, paper: want === 'paper' ? [239, 236, 228] : [6, 6, 6], normalize: true, contrast: con(1.2), sharpen: .45 };
    var tint = dotInk;
    var key = [src, want, box.join('x'), pos.join(','), (native || !dithered ? ink : tint).join('.'), tb, tc].join('|');
    if (card.dataset.mkDitherKey === key) return;
    card.dataset.mkDitherKey = key;
    // While a slider is dragged only the last value is computed.
    opts.stale = function () { return card.dataset.mkDitherKey !== key; };
    url(src, opts).then(ready).then(function (u) {
      if (card.dataset.mkDitherKey !== key) return;
      card.style.setProperty('--mk-skin-dither', 'url("' + u + '")');
      card.classList.add('mk-has-dither');
    }, function () { if (card.dataset.mkDitherKey === key) clearSkin(card); });
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
      remember(key, job);
    }
    job.then(function (u) {
      if (card.dataset.mkDitherKey !== key) return;
      card.style.setProperty('--mk-skin-dither', 'url("' + u + '")');
      card.classList.add('mk-has-dither');
    }, function () {});
  }
  function skinAll() {
    doc.querySelectorAll('[style*="--mk-skin-img"]').forEach(function (card) {
      if (mode === 'off' && card.getAttribute('data-watch-face') !== 'dither') clearSkin(card); else skin(card);
    });
  }

  host.MinkaDither = {
    bayer8: BAYER8, image: image, url: url, atkinson: atkinson,
    mode: function () { return mode; }, setMode: setMode, skin: skin, ready: ready, trim: trim, _apply: apply, _cache: cache
  };
  function boot() { if (mode !== 'off') apply(mode); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(window);
