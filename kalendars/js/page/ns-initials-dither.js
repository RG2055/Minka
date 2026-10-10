/* Nakts sadalījums: hovering a person's card brings up a dither of their own
   initials around the pointer (each lit cell is the pair, "AL"), in the colour that person chose
   (the card's --nsc-accent: their number colour, else the night palette).

   The same idea as the app's other character grids (Noskaņa's sky,
   js/page/mood-trend.js; the login, js/gate-sky.js): a fixed grid of small
   characters, each cell lit or not by an ordered (Bayer 4×4) threshold. Here the
   light is the card's photo (brighter = denser letters) times a soft circle
   that follows the pointer and fades behind it.

   Cheap on an old computer, no WebGL: one 2D canvas on the hovered card only;
   the letters are drawn once into a small atlas, each frame only copies them;
   the loop runs while the pointer moves or the trail fades, then stops and the
   canvas is cleared. Nothing for reduced motion or in a hidden tab. */
(function () {
  'use strict';
  var CHAR_W = 5.4, CELL_H = 9, FONT_PX = 8;       // css px; a cell is as wide as the initials
  var RADIUS = 84;                                  // the circle round the pointer, css px
  var FADE = .86;                                   // trail: what is left of it each frame
  var LEVELS = [.42, .66, .92];                     // three inks, faint to full
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
  // The photo's light per grid cell (cover fit, like the card shows it); null without one.
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
        var d = x.getImageData(0, 0, cols, rows).data, out = new Float32Array(cols * rows);
        for (var i = 0; i < out.length; i++) out[i] = (d[i * 4] * .2126 + d[i * 4 + 1] * .7152 + d[i * 4 + 2] * .0722) / 255;
        photos[key] = out;
      } catch (_e) { photos[key] = null; }                 // another site's picture: the plain dither
      done(photos[key]);
    };
    im.onerror = function () { photos[key] = null; done(null); };
    im.src = url;
  }
  // The person's initials in their colour, three inks, drawn once.
  function atlasFor(letters, color, dpr, cellW) {
    var cw = Math.round(cellW * dpr), ch = Math.round(CELL_H * dpr);
    var c = document.createElement('canvas'); c.width = cw; c.height = ch * LEVELS.length;
    var x = c.getContext('2d');
    x.font = '700 ' + (FONT_PX * dpr).toFixed(1) + 'px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color;
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
    var cellW = CHAR_W * letters.length + 3, cols = Math.ceil(w / cellW), rows = Math.ceil(h / CELL_H);
    st = { canvas: canvas, ctx: canvas.getContext('2d'), w: w, h: h, dpr: dpr, cols: cols, rows: rows, color: color, letters: letters, cellW: cellW,
      atlas: atlasFor(letters, color, dpr, cellW), heat: new Float32Array(cols * rows), light: null, px: -1, py: -1, inside: false, lit: false };
    states.set(card, st);
    lightOf(photoUrl(card), cols, rows, function (l) { st.light = l; });
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
      var lvl = val > .72 ? 2 : val > .42 ? 1 : 0;
      ctx.drawImage(A.img, 0, lvl * A.ch, A.cw, A.ch, Math.round(xx * CW * st.dpr), Math.round(yy * CELL_H * st.dpr), A.cw, A.ch);
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
