/* The login's sky: the mood card's night sky (Noskaņa X,
   kalendars/js/page/mood-trend.js) behind the whole login.
   The same picture (kalendars/assets/mood-sky-v1.webp) and the same idea: a
   grid of tiny characters that stays in place while the clouds drift slowly
   beneath it; each cell shows the character for the light under it, in the
   cloud's own colour, and changes only when the light has clearly moved on.
   Cheap on an old computer, no WebGL: the drift is two paused Web Animations
   on transform, stepped 15 times a second (the app's shared clock pace), the
   characters' colour comes from the drifting light through a still stencil
   (compositor), and only cells whose character changes are redrawn.
   Nothing runs in a hidden tab or for reduced motion (a still sky then).
   MinkaGateSky.mount(host) / MinkaGateSky.destroy(). */
(function () {
  'use strict';
  var SRC = 'kalendars/assets/mood-sky-v1.webp?v=20260928s2';
  var CHARS = '@#S08Xx+=-;:.';                 // dense to sparse, as in the mood card
  var ASPECT = 1918 / 820;                     // the picture's width / height
  var LO = .16, HI = .9;
  var CELL_W = 4.6, CELL_H = 7.8, CELL_FONT = 7; // a little coarser than the card: it fills a screen
  var FIELD = 2;                               // the light is sampled every 2 css px
  var BACK = .72;                              // the soft picture behind the characters
  var PX_PER_S = 5;                            // the drift, css px a second, leftward
  var TICK_MS = 1000 / 15;
  var LEVELS = [.34, .56, .8];
  var st = { host: null, wrap: null, img: null, state: '', key: '', grid: null, anims: [], t0: null, timer: 0, n: 0, resizeT: 0 };

  function reduced() {
    try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_e) { return false; }
  }
  function blank(w, h, read) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, w); c.height = Math.max(1, h);
    c.__ctx = c.getContext('2d', read ? { willReadFrequently: true } : undefined);
    return c;
  }
  function dom() {
    var wrap = document.createElement('div');
    wrap.className = 'gs-sky';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<div class="gs-move"><canvas class="gs-back"></canvas></div>'
      + '<div class="gs-chars"><div class="gs-move"><canvas class="gs-light"></canvas></div><canvas class="gs-mask"></canvas></div>';
    return wrap;
  }
  // Every character at every strength, once, white: a cell change only copies from here.
  function atlas(cw, ch, dpr) {
    var n = CHARS.length, a = blank(cw * n, ch * LEVELS.length), ac = a.__ctx;
    ac.textAlign = 'center'; ac.textBaseline = 'middle';
    ac.font = '500 ' + (CELL_FONT * dpr).toFixed(2) + 'px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
    LEVELS.forEach(function (alpha, li) {
      ac.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      for (var k = 0; k < n; k++) ac.fillText(CHARS[k], k * cw + cw / 2, li * ch + ch / 2 + .5 * dpr);
    });
    return a;
  }

  function build() {
    var host = st.host, wrap = st.wrap;
    if (!host || !wrap || st.state !== 'ready' || !host.isConnected) return;
    var W = host.clientWidth, H = host.clientHeight;
    if (W < 60 || H < 60) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var key = [W, H, dpr].join(',');
    if (key === st.key) return;
    stop();
    st.anims.forEach(function (a) { a.cancel(); });
    st.anims = [];
    st.key = key;
    // 1. The strip, at half size (all later reads are every 2 px): the
    //    picture, its mirror image, the picture again, so one period P loops
    //    without a seam. Its clouds sit on the bottom edge, the cyan ribbon
    //    a little below the middle.
    var pw = Math.max(W * 1.3, H * 1.04 * ASPECT), ph = pw / ASPECT, P = Math.round(pw * 2);
    var SW = P + Math.ceil(W) + 4, y0 = H - ph;
    var hw = Math.ceil(SW / 2), hh = Math.ceil(H / 2) + 2;
    var scene = blank(hw, hh, true), sc = scene.__ctx;
    sc.imageSmoothingQuality = 'high';
    for (var k = 0; k * pw < SW; k++) {
      sc.save();
      if (k % 2) { sc.translate((k + 1) * pw / 2, 0); sc.scale(-1, 1); sc.drawImage(st.img, 0, y0 / 2, pw / 2, ph / 2); }
      else sc.drawImage(st.img, k * pw / 2, y0 / 2, pw / 2, ph / 2);
      sc.restore();
    }
    // 2. The soft picture behind (a third of the size, stretched back).
    var soft = blank(Math.ceil(SW / 3), Math.ceil(H / 3));
    soft.__ctx.imageSmoothingQuality = 'high';
    soft.__ctx.drawImage(scene, 0, 0, soft.width, soft.height);
    var back = wrap.querySelector('.gs-back'), light = wrap.querySelector('.gs-light');
    [back, light].forEach(function (cv) {
      cv.width = hw; cv.height = hh;
      cv.style.width = hw * 2 + 'px'; cv.style.height = hh * 2 + 'px';
    });
    var bk = back.getContext('2d');
    bk.imageSmoothingQuality = 'high';
    bk.globalAlpha = BACK;
    bk.drawImage(soft, 0, 0, hw, hh);
    // 3. The characters' light, drifting with the picture: the picture
    //    brighter and a little richer (black stays black).
    var lc = light.getContext('2d', { willReadFrequently: true });
    lc.drawImage(scene, 0, 0);
    var id = lc.getImageData(0, 0, hw, hh), d = id.data;
    for (var i = 0; i < d.length; i += 4) {
      var m = (d[i] + d[i + 1] + d[i + 2]) / 3, l3 = m / 255, lift = Math.pow(l3, 1.35) / Math.max(.001, l3);
      for (var c3 = 0; c3 < 3; c3++) d[i + c3] = Math.max(0, Math.min(255, (m + (d[i + c3] - m) * 1.25) * 1.55 * lift));
      d[i + 3] = 255;
    }
    lc.putImageData(id, 0, 0);
    // The light under each cell: the strip's own half-size pixels, one period.
    var fw = Math.min(hw, Math.round(P / FIELD) + 1), fh = hh;
    var sd = sc.getImageData(0, 0, fw, fh).data, lum = new Float32Array(fw * fh);
    for (i = 0; i < lum.length; i++) lum[i] = (.2126 * sd[i * 4] + .7152 * sd[i * 4 + 1] + .0722 * sd[i * 4 + 2]) / 255 * (sd[i * 4 + 3] / 255);
    // 4. The grid (device-pixel cells, never moving) and its stencil.
    var cw = Math.max(3, Math.round(CELL_W * dpr)), chh = Math.max(5, Math.round(CELL_H * dpr));
    var mask = wrap.querySelector('.gs-mask');
    mask.width = Math.round(W * dpr); mask.height = Math.round(H * dpr);
    mask.style.width = W + 'px'; mask.style.height = H + 'px';
    var mctx = mask.getContext('2d');
    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mask.width, mask.height);
    var cols = Math.ceil(mask.width / cw), rows = Math.ceil(mask.height / chh), cells = cols * rows;
    var cx = new Float32Array(cells), cy = new Float32Array(cells), dith = new Float32Array(cells);
    var B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (var ci = 0; ci < cells; ci++) {
      var col = ci % cols, row = (ci / cols) | 0;
      cx[ci] = (col + .5) * cw / dpr; cy[ci] = (row + .5) * chh / dpr;
      dith[ci] = (B4[(row & 3) * 4 + (col & 3)] + .5) / 16;   // ordered: a calm, even thinning
    }
    st.grid = { mctx: mctx, mask: mask, white: atlas(cw, chh, dpr), cw: cw, ch: chh, cols: cols, cells: cells,
      cx: cx, cy: cy, dith: dith, cur: new Int16Array(cells).fill(-2), val: new Float32Array(cells).fill(-1),
      fw: fw, fh: fh, lum: lum, P: P, dur: P / PX_PER_S * 1000 };
    // 5. The drift: one period leftward, linear, endless, from one clock.
    if (!reduced()) {
      if (st.t0 == null) st.t0 = performance.now();
      wrap.querySelectorAll('.gs-move').forEach(function (el) {
        if (typeof el.animate !== 'function') return;
        var a = el.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(' + -P + 'px)' }],
          { duration: st.grid.dur, iterations: Infinity, easing: 'linear' });
        a.pause();
        st.anims.push(a);
      });
      tick(true);
    }
    check(true);
    wrap.classList.add('is-on');
    run();
  }
  function offset() {
    var G = st.grid, a = st.anims[0];
    if (!G || !a || a.currentTime == null) return 0;
    return (a.currentTime % G.dur) / G.dur * G.P;
  }
  function fieldAt(G, x, y) {
    var fx = x / FIELD, fy = y / FIELD, x0 = Math.floor(fx), y1 = Math.floor(fy);
    var ax = fx - x0, ay = fy - y1, fw = G.fw, pw = fw - 1, arr = G.lum;
    x0 = ((x0 % pw) + pw) % pw; y1 = Math.max(0, Math.min(G.fh - 2, y1));
    var i0 = y1 * fw + x0, i1 = i0 + fw;
    return (arr[i0] + (arr[i0 + 1] - arr[i0]) * ax) * (1 - ay) + (arr[i1] + (arr[i1 + 1] - arr[i1]) * ax) * ay;
  }
  // The character each cell shows for the light under it now; a cell
  // changes only once the light has moved on by a clear step.
  function check(all) {
    var G = st.grid;
    if (!G || !G.mask.isConnected) return;
    var o = offset(), n = CHARS.length, ctx = G.mctx;
    for (var c = 0; c < G.cells; c++) {
      var code = -1;
      var v = (fieldAt(G, G.cx[c] + o, G.cy[c]) - LO) / (HI - LO);
      if (v > 1) v = 1;
      if (!all && Math.abs(v - G.val[c]) < .045) continue;
      if (v > 0 && G.dith[c] < v * 1.7) {
        var level = v < .38 ? 0 : v < .7 ? 1 : 2;
        code = level * n + Math.min(n - 1, ((1 - v) * n) | 0);
      }
      G.val[c] = v;
      if (!all && code === G.cur[c]) continue;
      G.cur[c] = code;
      var dx = (c % G.cols) * G.cw, dy = ((c / G.cols) | 0) * G.ch;
      ctx.fillStyle = '#000';
      ctx.fillRect(dx, dy, G.cw, G.ch);
      if (code >= 0) ctx.drawImage(G.white, (code % n) * G.cw, ((code / n) | 0) * G.ch, G.cw, G.ch, dx, dy, G.cw, G.ch);
    }
  }
  function tick(first) {
    var t = performance.now() - st.t0;
    for (var i = 0; i < st.anims.length; i++) st.anims[i].currentTime = t;
    if (!first && (++st.n & 1) === 0) check(false);
  }
  function loop() {
    st.timer = setTimeout(loop, TICK_MS);
    tick(false);
  }
  function run() {
    stop();
    if (!st.grid || !st.anims.length || document.hidden) return;
    st.timer = setTimeout(loop, TICK_MS);
  }
  function stop() { clearTimeout(st.timer); st.timer = 0; }
  function onResize() {
    clearTimeout(st.resizeT);
    st.resizeT = setTimeout(build, 180);
  }
  function onVis() { if (document.hidden) stop(); else run(); }

  function mount(host) {
    if (!host || st.host === host) return;
    destroy();
    st.host = host;
    st.wrap = dom();
    host.insertBefore(st.wrap, host.firstChild);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    if (st.img) { st.state = 'ready'; build(); return; }
    st.state = 'loading';
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { st.img = img; st.state = 'ready'; st.key = ''; build(); };
    img.onerror = function () { st.state = 'failed'; };
    img.src = SRC;
  }
  function destroy() {
    stop();
    clearTimeout(st.resizeT);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    st.anims.forEach(function (a) { a.cancel(); });
    st.anims = [];
    if (st.wrap && st.wrap.parentNode) st.wrap.parentNode.removeChild(st.wrap);
    st.host = null; st.wrap = null; st.grid = null; st.key = ''; st.t0 = null;
  }
  window.MinkaGateSky = { mount: mount, destroy: destroy };
})();
