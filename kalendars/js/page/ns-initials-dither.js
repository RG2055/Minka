/* Nakts sadalījums: hovering a person's card draws their card's photo round the
   pointer in their own initials, the way Noskaņa draws its sky in characters
   (js/page/mood-trend.js): a fine fixed grid (3.9 × 6.6 px cells, 6 px
   characters), the light deciding which cells show and how strongly (the same
   ordered Bayer thinning and three inks), each character in the photo's own
   colour there blended with the colour this person chose (the card's
   --nsc-accent), and a soft glow of that colour behind the characters. Only
   the initials are used, alternating (A L A L…). The circle follows the
   pointer and fades behind it.

   Cheap on an old computer, no WebGL: one 2D canvas on the hovered card only;
   the letters are drawn once into a small white atlas, each frame copies them
   and lays the card's tint over them in one draw (source-in), then the glow
   behind (destination-over). The loop runs while the pointer moves or the
   trail fades, then stops and the canvas is cleared. Nothing for reduced
   motion, touch, or in a hidden tab. */
(function () {
  'use strict';
  var CELL_W = 3.9, CELL_H = 6.6, CELL_FONT = 6;    // Noskaņa's grid, css px
  var LO = .16, HI = .9;                            // the light's useful range, as Noskaņa
  var LEVELS = [.34, .56, .8];                      // three inks, as Noskaņa
  var RADIUS = 92;                                  // the circle round the pointer, css px
  var FADE = .9;                                    // trail: what is left of it each frame
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
  function rgbOf(color) {
    var c = document.createElement('canvas'); c.width = c.height = 1;
    var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#9fd8ff'; x.fillStyle = color; x.fillRect(0, 0, 1, 1);
    var d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
  }
  // The photo's light and colour per grid cell (cover fit, like the card shows it); null without one.
  function photoOf(url, cols, rows, done) {
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
        x.imageSmoothingQuality = 'high';
        var s = Math.max(cols / im.naturalWidth, rows / im.naturalHeight);
        var w = im.naturalWidth * s, h = im.naturalHeight * s;
        x.drawImage(im, (cols - w) / 2, (rows - h) / 2, w, h);
        var d = x.getImageData(0, 0, cols, rows).data, lum = new Float32Array(cols * rows), rgb = new Uint8Array(cols * rows * 3);
        for (var i = 0; i < lum.length; i++) {
          lum[i] = (d[i * 4] * .2126 + d[i * 4 + 1] * .7152 + d[i * 4 + 2] * .0722) / 255;
          rgb[i * 3] = d[i * 4]; rgb[i * 3 + 1] = d[i * 4 + 1]; rgb[i * 3 + 2] = d[i * 4 + 2];
        }
        photos[key] = { lum: lum, rgb: rgb };
      } catch (_e) { photos[key] = null; }                 // another site's picture: the plain one
      done(photos[key]);
    };
    im.onerror = function () { photos[key] = null; done(null); };
    im.src = url;
  }
  /* The colour under every character, one pixel per cell (scaled up smoothly
     when drawn): the photo's own colour there (lifted to read on the dark
     card) blended half and half with the person's colour; without a photo,
     the person's colour, a little lighter towards the top. */
  function tintOf(accent, photo, cols, rows) {
    var c = document.createElement('canvas'); c.width = cols; c.height = rows;
    var x = c.getContext('2d'), img = x.createImageData(cols, rows), d = img.data, a = rgbOf(accent);
    for (var y = 0; y < rows; y++) for (var i = 0; i < cols; i++) {
      var k = y * cols + i, r = a[0], g = a[1], b = a[2];
      if (photo) {
        var pr = photo.rgb[k * 3], pg = photo.rgb[k * 3 + 1], pb = photo.rgb[k * 3 + 2];
        var m = Math.max(pr, pg, pb, 1), boost = Math.min(3, 230 / m);
        r = r * .5 + Math.min(255, pr * boost) * .5; g = g * .5 + Math.min(255, pg * boost) * .5; b = b * .5 + Math.min(255, pb * boost) * .5;
      } else {
        var lift = .2 * (1 - y / Math.max(1, rows - 1));
        r += (255 - r) * lift; g += (255 - g) * lift; b += (255 - b) * lift;
      }
      var lum = (r * .2126 + g * .7152 + b * .0722) / 255;
      if (lum < .62) { var up = (.62 - lum) / (1 - lum); r += (255 - r) * up; g += (255 - g) * up; b += (255 - b) * up; }
      d[k * 4] = r; d[k * 4 + 1] = g; d[k * 4 + 2] = b; d[k * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return { canvas: c, rgb: a };
  }
  // Each initial at each ink, in white, once (the tint goes on after).
  function atlasFor(letters, dpr) {
    var cw = Math.max(3, Math.round(CELL_W * dpr)), ch = Math.max(5, Math.round(CELL_H * dpr));
    var c = document.createElement('canvas'); c.width = cw * letters.length; c.height = ch * LEVELS.length;
    var x = c.getContext('2d');
    x.font = '500 ' + (CELL_FONT * dpr).toFixed(2) + 'px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    LEVELS.forEach(function (alpha, row) {
      x.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      for (var k = 0; k < letters.length; k++) x.fillText(letters[k], k * cw + cw / 2, row * ch + ch / 2 + .5 * dpr);
    });
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
    var atlas = atlasFor(letters, dpr), cols = Math.ceil(canvas.width / atlas.cw), rows = Math.ceil(canvas.height / atlas.ch);
    st = { canvas: canvas, ctx: canvas.getContext('2d'), w: w, h: h, dpr: dpr, cols: cols, rows: rows, color: color, letters: letters,
      atlas: atlas, heat: new Float32Array(cols * rows), light: null, tint: tintOf(color, null, cols, rows),
      px: -1, py: -1, inside: false, glow: 0 };
    states.set(card, st);
    photoOf(photoUrl(card), cols, rows, function (p) { st.light = p && p.lum; if (p) st.tint = tintOf(color, p, cols, rows); });
    return st;
  }

  function frame() {
    raf = 0;
    var card = active, st = card && states.get(card);
    if (!st || !card.isConnected || document.hidden) { if (st) clear(st); active = null; return; }
    var A = st.atlas, cols = st.cols, rows = st.rows, heat = st.heat, light = st.light, any = false;
    var cw = A.cw / st.dpr, chh = A.ch / st.dpr;             // a cell, css px
    var cx = st.px / cw, cy = st.py / chh;
    for (var i = 0; i < heat.length; i++) heat[i] *= FADE;
    st.glow = st.inside ? Math.min(1, st.glow + .2) : st.glow * FADE;
    if (st.inside) {
      var rx = Math.ceil(RADIUS / cw), ry = Math.ceil(RADIUS / chh);
      var x0 = Math.max(0, Math.floor(cx) - rx), x1 = Math.min(cols - 1, Math.floor(cx) + rx);
      var y0 = Math.max(0, Math.floor(cy) - ry), y1 = Math.min(rows - 1, Math.floor(cy) + ry);
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var dx = (x + .5 - cx) * cw, dy = (y + .5 - cy) * chh, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= RADIUS) continue;
        var t = 1 - d / RADIUS, v = t * t * (3 - 2 * t), k = y * cols + x;
        if (v > heat[k]) heat[k] = v;
      }
    }
    var ctx = st.ctx, n = st.letters.length;
    ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
    for (var yy = 0; yy < rows; yy++) for (var xx = 0; xx < cols; xx++) {
      var kk = yy * cols + xx, hv = heat[kk];
      if (hv < .02) continue;
      any = true;
      // Noskaņa's rule: the light in its useful range, a cell shows while the
      // ordered threshold is under 1.7× it, its ink from how bright it is
      var v = light ? (light[kk] - LO) / (HI - LO) : .62;
      v = Math.max(0, Math.min(1, v)) * hv;
      if (v <= 0 || (BAYER4[(yy & 3) * 4 + (xx & 3)] + .5) / 16 >= v * 1.7) continue;
      var level = v < .38 ? 0 : v < .7 ? 1 : 2;
      ctx.drawImage(A.img, ((xx + yy) % n) * A.cw, level * A.ch, A.cw, A.ch, xx * A.cw, yy * A.ch, A.cw, A.ch);
    }
    if (any) {
      // the characters take the colour under them
      ctx.globalCompositeOperation = 'source-in';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(st.tint.canvas, 0, 0, st.canvas.width, st.canvas.height);
      // and a soft glow of the person's colour behind them, round the pointer
      if (st.glow > .02 && st.px >= 0) {
        var gx = st.px * st.dpr, gy = st.py * st.dpr, gr = RADIUS * 1.15 * st.dpr, c = st.tint.rgb;
        var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        grad.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (.16 * st.glow).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = grad;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    if (any || st.inside) raf = requestAnimationFrame(frame);
    else { clear(st); active = null; }
  }
  function clear(st) { st.ctx.clearRect(0, 0, st.canvas.width, st.canvas.height); st.heat.fill(0); st.glow = 0; }
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
