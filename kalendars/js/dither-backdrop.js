/* Dither ap redaktoriem un galeriju (2026-10-01): klasisks darbs vienkrāsas
   Bayer (8×8) punktos uz zila vakara ar zvaigznēm. Mikelandželo "Ādama
   radīšanas" rokas sniedzas pret logu no tā sāniem, Frīdriha "Mēness lēkts
   virs jūras", Leonardo "Pasludināšana"; katru atvēršanu nākamais.

   Viens kanvass aiz loga (z-index -1 loga slānī, klikšķi iet cauri), uzzīmēts
   vienreiz; gatavā bilde paliek atmiņā, tāpēc nākamreiz tikai nokopē. Bildes
   (tikai to gaisma) ir assets/gallery, scripts/build-gallery-assets.py.

   MinkaDitherBackdrop.attach(host, { box })  host: fiksēts logs pāri ekrānam (tam
     jābūt savam slānim: position + z-index); box: dialogs, kura sānos rokas
   MinkaDitherBackdrop.detach(host)
   --mk-dither-panel: smalks tonēts dither paneļiem (spēles izvēlnes, galerija) */
(function () {
  'use strict';
  var ART = 'assets/gallery/', V = '?v=20261001a', CELL = 2, KEY = 'minkaDitherAt';
  var SETS = [['adam-left', 'adam-right'], ['moonrise'], ['annunciation']];
  var BAYER8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  var INK = (255 << 24 | 255 << 16 | 233 << 8 | 226) >>> 0;     // #e2e9ff
  var next = 0, images = {}, painted = [], hosts = [], resizeTimer = 0;
  try { next = (+sessionStorage.getItem(KEY) || 0) % SETS.length; } catch (_e) {}

  function ensureCss() {
    if (document.getElementById('mk-dither-css')) return;
    var style = document.createElement('style');
    style.id = 'mk-dither-css';
    style.textContent = '.mk-dither-host{background:linear-gradient(180deg,#1222d8 0%,#1d30e6 55%,#3246ee 100%)!important}'
      + '.mk-dither-bg{position:absolute;top:0;left:0;z-index:-1;pointer-events:none;image-rendering:pixelated}';
    document.head.appendChild(style);
  }
  function load(names, done) {
    var out = [], left = names.length;
    names.forEach(function (name, i) {
      var img = images[name];
      var ready = function () { out[i] = img; if (--left === 0) done(out); };
      if (img && img.complete && img.naturalWidth) { ready(); return; }
      if (!img) { img = images[name] = new Image(); img.decoding = 'async'; img.src = ART + name + '.webp' + V; }
      img.addEventListener('load', ready, { once: true });
    });
  }
  function rnd(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  // the light of the work (and a haze low down) as dots; stars where the sky is dark
  function paint(imgs, boxW, vw, vh, seed) {
    var cols = Math.ceil(vw / CELL), rows = Math.ceil(vh / CELL);
    var tmp = document.createElement('canvas'); tmp.width = cols; tmp.height = rows;
    var t = tmp.getContext('2d', { willReadFrequently: true });
    t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high';
    if (imgs.length === 2) {
      var gw = Math.min(cols * 0.9, boxW / CELL), gl = (cols - gw) / 2, gr = gl + gw, hh = rows * 0.36, cy = rows * 0.5;
      var lw = hh * imgs[0].naturalWidth / imgs[0].naturalHeight, rw = hh * imgs[1].naturalWidth / imgs[1].naturalHeight;
      t.drawImage(imgs[0], Math.min(gl + 26, cols * 0.42) - lw, cy - hh * 0.5, lw, hh);
      t.drawImage(imgs[1], Math.max(gr - 26, cols * 0.58), cy - hh * 0.62, rw, hh);
    } else {
      var im = imgs[0], k = Math.max(cols / im.naturalWidth, rows / im.naturalHeight);
      t.drawImage(im, (cols - im.naturalWidth * k) / 2, (rows - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
    }
    var src = t.getImageData(0, 0, cols, rows).data;
    var out = document.createElement('canvas'); out.width = cols; out.height = rows;
    var ctx = out.getContext('2d'), img = ctx.createImageData(cols, rows), o = new Uint32Array(img.data.buffer), dense = new Float32Array(cols * rows);
    for (var y = 0; y < rows; y++) {
      var haze = Math.max(0, (y / rows - 0.62) / 0.38);
      haze = haze * haze * 0.32;
      for (var x = 0; x < cols; x++) {
        var i = y * cols + x, q = i * 4;
        var lum = (src[q] * 0.3 + src[q + 1] * 0.59 + src[q + 2] * 0.11) / 255 * (src[q + 3] / 255);
        var d = Math.max(Math.pow(lum, 1.25) * 0.95, haze);
        dense[i] = d;
        if ((BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64 < d) o[i] = INK;
      }
    }
    var r = rnd(97 + seed * 13);
    for (var n = 0; n < 60 && n < cols * rows / 2000; n++) {
      var sx = (r() * cols) | 0, sy = (r() * rows * 0.5) | 0, arm = r() < 0.25 ? 3 + ((r() * 3) | 0) : 1;
      if (dense[sy * cols + sx] > 0.06) continue;
      o[sy * cols + sx] = INK;
      for (var a = 1; a <= arm; a++) {
        if (a === arm && arm > 1 && r() < 0.5) continue;
        [[a, 0], [-a, 0], [0, a], [0, -a]].forEach(function (p) {
          var px = sx + p[0], py = sy + p[1];
          if (px >= 0 && py >= 0 && px < cols && py < rows) o[py * cols + px] = INK;
        });
      }
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }
  function draw(entry) {
    var host = entry.host;
    if (!host.isConnected || hosts.indexOf(entry) < 0) return;
    load(SETS[entry.set], function (imgs) {
      if (!host.isConnected || hosts.indexOf(entry) < 0) return;
      var vw = window.innerWidth, vh = window.innerHeight, bw = entry.box && entry.box.offsetWidth || vw * 0.7;
      var key = entry.set + '|' + vw + 'x' + vh + '|' + (imgs.length === 2 ? Math.round(bw / 16) : 0);
      var hit = painted.find(function (p) { return p.key === key; });
      if (!hit) {
        hit = { key: key, canvas: paint(imgs, bw, vw, vh, entry.set) };
        painted.push(hit);
        if (painted.length > 3) painted.shift();
      }
      var cv = entry.canvas, src = hit.canvas;
      cv.width = src.width; cv.height = src.height;
      cv.style.width = src.width * CELL + 'px'; cv.style.height = src.height * CELL + 'px';
      cv.getContext('2d').drawImage(src, 0, 0);
    });
  }
  function attach(host, opts) {
    if (!host) return;
    ensureCss();
    var entry = hosts.find(function (e) { return e.host === host; });
    if (!entry) {
      var cv = document.createElement('canvas');
      cv.className = 'mk-dither-bg';
      cv.setAttribute('aria-hidden', 'true');
      host.insertBefore(cv, host.firstChild);
      entry = { host: host, canvas: cv };
      hosts.push(entry);
    }
    entry.box = opts && opts.box || null;
    entry.set = next;
    next = (next + 1) % SETS.length;
    try { sessionStorage.setItem(KEY, String(next)); } catch (_e) {}
    host.classList.add('mk-dither-host');
    // the box's width is known once it is laid out
    requestAnimationFrame(function () { draw(entry); });
  }
  function detach(host) {
    var i = hosts.findIndex(function (e) { return e.host === host; });
    if (i < 0) return;
    var entry = hosts.splice(i, 1)[0];
    entry.canvas.remove();
    host.classList.remove('mk-dither-host');
  }
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { hosts.slice().forEach(function (e) { if (e.host.isConnected) draw(e); else detach(e.host); }); }, 250);
  });
  // A quiet tint for panels and menus: blue dots thickening towards the
  // bottom, one strip a period wide (repeated across, set at the bottom).
  // --mk-dither-panel on the page; .mk-dither-panel or own rules use it.
  function panelTexture() {
    var root = document.documentElement;
    if (root.style.getPropertyValue('--mk-dither-panel')) return;
    var w = 16, h = 160, c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(110,140,255,.2)';
    for (var y = 0; y < h; y += CELL) {
      var d = Math.pow(y / h, 1.5) * 0.55;
      for (var x = 0; x < w; x += CELL) if ((BAYER8[((y / CELL) & 7) * 8 + ((x / CELL) & 7)] + 0.5) / 64 < d) ctx.fillRect(x, y, CELL, CELL);
    }
    root.style.setProperty('--mk-dither-panel', 'url(' + c.toDataURL('image/png') + ')');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', panelTexture); else panelTexture();
  window.MinkaDitherBackdrop = { attach: attach, detach: detach, panelTexture: panelTexture };
})();
