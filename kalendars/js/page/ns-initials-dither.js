/* Nakts sadalījums: hovering a person's card brings up a fine dither of their
   own initials around the pointer (each lit cell is the pair, "AL"), tinted
   with the colour that person chose (the card's --nsc-accent: their number
   colour, else the night palette) blended with the photo's own colour under
   each letter, so every card shimmers a little differently.

   The same idea as the app's other character grids (Noskaņa's sky,
   js/page/mood-trend.js; the login, js/gate-sky.js): a fixed grid of small
   characters, each cell lit or not by an ordered (Bayer 4×4) threshold. Here the
   light is the card's photo (brighter = denser letters) times a soft circle
   that follows the pointer and fades behind it.

   Cheap on an old computer, no WebGL: one 2D canvas on the hovered card only;
   the letters are drawn once into a small white atlas, each frame only copies
   them and lays the card's tint over them in one draw (source-in);
   the loop runs while the pointer moves or the trail fades, then stops and the
   canvas is cleared. Nothing for reduced motion or in a hidden tab. */
(function () {
  'use strict';
  var CHAR_W = 4.1, CELL_H = 7, FONT_PX = 6.4;     // css px; a cell is as wide as the initials
  var RADIUS = 96;                                  // the circle round the pointer, css px
  var FADE = .9;                                    // trail: what is left of it each frame
  var LEVELS = [.2, .36, .54, .74, .95];            // five inks, faint to full
  var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var states = new WeakMap(), active = null, raf = 0, photos = {};

  function reduced() {
    try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_e) { return false; }
  }
  function initialsOf(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    var s = ((parts[0] || '').charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
    return s || '·';
  }
  // The card's photo, if it has one: the last url() of its background layers.
  function photoUrl(card) {
    var deco = card.querySelector(':scope > .nsc-deco');
    var layers = [getComputedStyle(card).backgroundImage, deco ? getComputedStyle(deco).backgroundImage : ''];
    var img = deco && deco.querySelector('img');
    for (var i = 0; i < layers.length; i++) {
      var m = String(layers[i] || '').match(/url\(["']?([^"')]+)["']?\)/g);
      if (m && m.length) return m[m.length - 1].replace(/^url\(["']?|["']?\)$/g, '');
    }
    return img && img.currentSrc ? img.currentSrc : '';
  }
  // A CSS colour as [r, g, b].
  function rgbOf(color) {
    var c = document.createElement('canvas'); c.width = c.height = 1;
    var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#9fd8ff'; x.fillStyle = color; x.fillRect(0, 0, 1, 1);
    var d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
  }
  /* The tint under every letter, one pixel per cell (scaled up smoothly when
     drawn): the person's colour, and where there is a photo, blended with the
     photo's own colour there (made vivid and light enough to read on the dark
     card). Without a photo, the person's colour, a little lighter at the top. */
  function tintOf(accent, photo, cols, rows) {
    var c = document.createElement('canvas'); c.width = cols; c.height = rows;
    var x = c.getContext('2d'), img = x.createImageData(cols, rows), d = img.data, a = rgbOf(accent);
    for (var y = 0; y < rows; y++) for (var i = 0; i < cols; i++) {
      var k = y * cols + i, r = a[0], g = a[1], b = a[2];
      if (photo) {
        var pr = photo.rgb[k * 3], pg = photo.rgb[k * 3 + 1], pb = photo.rgb[k * 3 + 2];
        var m = Math.max(pr, pg, pb, 1), boost = 235 / m;                 // the photo's hue, at full strength
        r = r * .55 + pr * boost * .45; g = g * .55 + pg * boost * .45; b = b * .55 + pb * boost * .45;
      } else {
        var lift = .22 * (1 - y / Math.max(1, rows - 1));
        r += (255 - r) * lift; g += (255 - g) * lift; b += (255 - b) * lift;
      }
      var lum = (r * .2126 + g * .7152 + b * .0722) / 255;
      if (lum < .6) { var up = (.6 - lum) / (1 - lum); r += (255 - r) * up; g += (255 - g) * up; b += (255 - b) * up; }
      d[k * 4] = r; d[k * 4 + 1] = g; d[k * 4 + 2] = b; d[k * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  // The photo's light and colour per grid cell (cover fit, like the card shows it); null without one.
  function lightOf(url, cols, rows, done) {
    if (!url) { done(null); return; }
    var key = url + '|' + cols + 'x' + rows;
    if (photos[key] !== undefined) { done(photos[key]); return; }
    var im = new Image();
    if (!/^(data|blob):/.test(url) && new URL(url, location.href).origin !== location.origin) im.crossOrigin = 'anonymous';
    im.decoding = 'async';
    im.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = cols; c.height = rows;
        var x = c.getContext('2d', { willReadFrequently: true });
        var s = Math.max(cols / im.naturalWidth, rows / im.naturalHeight);
        var w = im.naturalWidth * s, h = im.naturalHeight * s;
        x.drawImage(im, (cols - w) / 2, (rows - h) / 2, w, h);
        var d = x.getImageData(0, 0, cols, rows).data, lum = new Float32Array(cols * rows), rgb = new Uint8Array(cols * rows * 3);
        for (var i = 0; i < lum.length; i++) {
          lum[i] = (d[i * 4] * .2126 + d[i * 4 + 1] * .7152 + d[i * 4 + 2] * .0722) / 255;
          rgb[i * 3] = d[i * 4]; rgb[i * 3 + 1] = d[i * 4 + 1]; rgb[i * 3 + 2] = d[i * 4 + 2];
        }
        photos[key] = { lum: lum, rgb: rgb };
      } catch (_e) { photos[key] = null; }                 // another site's picture: the plain dither
      done(photos[key]);
    };
    im.onerror = function () { photos[key] = null; done(null); };
    im.src = url;
  }
  // The person's initials in white, five inks, drawn once (the tint goes on after).
  function atlasFor(letters, dpr, cellW) {
    var cw = Math.round(cellW * dpr), ch = Math.round(CELL_H * dpr);
    var c = document.createElement('canvas'); c.width = cw; c.height = ch * LEVELS.length;
    var x = c.getContext('2d');
    x.font = '600 ' + (FONT_PX * dpr).toFixed(1) + 'px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    LEVELS.forEach(function (a, row) { x.globalAlpha = a; x.fillText(letters, cw / 2, row * ch + ch / 2 + .5 * dpr); });
    return { img: c, cw: cw, ch: ch };
  }

  function setup(card) {
    var st = states.get(card);
    var r = card.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(r.width), h = Math.round(r.height);
    var color = (getComputedStyle(card).getPropertyValue('--nsc-accent') || '').trim() || '#9fd8ff';
    var letters = initialsOf(card.getAttribute('data-worker'));
    if (st && st.canvas.isConnected && st.w === w && st.h === h && st.color === color && st.letters === letters) return st;
    var canvas = (st && st.canvas.isConnected) ? st.canvas : document.createElement('canvas');
    canvas.className = 'nsc-initials-dither';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    if (!canvas.isConnected) {
      var deco = card.querySelector(':scope > .nsc-deco');
      if (deco) deco.after(canvas); else card.prepend(canvas);
    }
    var cellW = CHAR_W * letters.length + 2.4, cols = Math.ceil(w / cellW), rows = Math.ceil(h / CELL_H);
    st = { canvas: canvas, ctx: canvas.getContext('2d'), w: w, h: h, dpr: dpr, cols: cols, rows: rows, color: color, letters: letters, cellW: cellW,
      atlas: atlasFor(letters, dpr, cellW), heat: new Float32Array(cols * rows), light: null, tint: tintOf(color, null, cols, rows),
      px: -1, py: -1, inside: false, lit: false };
    states.set(card, st);
    lightOf(photoUrl(card), cols, rows, function (l) { st.light = l && l.lum; if (l) st.tint = tintOf(color, l, cols, rows); });
    return st;
  }

  function frame() {
    raf = 0;
    var card = active, st = card && states.get(card);
    if (!st || !card.isConnected || document.hidden) { if (st) clear(st); active = null; return; }
    var cols = st.cols, rows = st.rows, heat = st.heat, light = st.light, any = false;
    var R = RADIUS, CW = st.cellW, cx = st.px / CW, cy = st.py / CELL_H;
    for (var i = 0; i < heat.length; i++) heat[i] *= FADE;
    if (st.inside) {
      var rx = Math.ceil(R / CW), ry = Math.ceil(R / CELL_H);
      var x0 = Math.max(0, Math.floor(cx) - rx), x1 = Math.min(cols - 1, Math.floor(cx) + rx);
      var y0 = Math.max(0, Math.floor(cy) - ry), y1 = Math.min(rows - 1, Math.floor(cy) + ry);
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var dx = (x + .5 - cx) * CW, dy = (y + .5 - cy) * CELL_H, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= R) continue;
        var t = 1 - d / R, v = t * t * (3 - 2 * t), k = y * cols + x;
        if (v > heat[k]) heat[k] = v;
      }
    }
    var ctx = st.ctx, A = st.atlas;
    ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
    for (var yy = 0; yy < rows; yy++) for (var xx = 0; xx < cols; xx++) {
      var kk = yy * cols + xx, hv = heat[kk];
      if (hv < .02) continue;
      any = true;
      var val = hv * (light ? .25 + .85 * light[kk] : .9);
      if (val <= (BAYER4[(xx & 3) + ((yy & 3) << 2)] + .5) / 16) continue;
      var lvl = Math.min(LEVELS.length - 1, Math.floor(val * LEVELS.length));
      ctx.drawImage(A.img, 0, lvl * A.ch, A.cw, A.ch, Math.round(xx * CW * st.dpr), Math.round(yy * CELL_H * st.dpr), A.cw, A.ch);
    }
    // the tint: the letters take the colour under them (one draw)
    if (any) {
      ctx.globalCompositeOperation = 'source-in';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(st.tint, 0, 0, st.canvas.width, st.canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    st.lit = any;
    if (any || st.inside) raf = requestAnimationFrame(frame);
    else { clear(st); active = null; }
  }
  function clear(st) { st.ctx.clearRect(0, 0, st.canvas.width, st.canvas.height); st.heat.fill(0); st.lit = false; }
  function run() { if (!raf) raf = requestAnimationFrame(frame); }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || reduced()) return;
    var card = e.target && e.target.closest ? e.target.closest('#nsPanel .nsc-full-card[data-worker]') : null;
    if (active && active !== card) { var old = states.get(active); if (old) old.inside = false; }
    if (!card) { run(); return; }
    var st = setup(card), r = card.getBoundingClientRect();
    if (active && active !== card) { var prev = states.get(active); if (prev) clear(prev); }
    active = card;
    st.px = e.clientX - r.left; st.py = e.clientY - r.top; st.inside = true;
    run();
  }, { passive: true });
  document.addEventListener('pointerout', function (e) {
    if (!active) return;
    if (e.relatedTarget && active.contains(e.relatedTarget)) return;
    if (e.target && active.contains(e.target)) { var st = states.get(active); if (st) st.inside = false; run(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden && active) { var st = states.get(active); if (st) clear(st); active = null; } });
})();
