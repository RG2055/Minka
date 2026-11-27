/* The liquid in the mood segment's glass, computed per pixel on the CPU, one still frame per change (the user: like
   the Half-Life: Alyx bottles, but no WebGL, no motion, less work than before).

   The glass is a unit sphere seen slightly from above and the emoji a ball inside it. Each liquid is everything under
   a level plane: coffee at the bottom, the fatigue (or energy) liquid over it. A pixel's colour is what is behind it
   dimmed by how much liquid the view ray crosses (Beer-Lambert): amber where the glass is thin, dark where it is deep.
   The surface is seen from above, only in front of the ball, with a light edge where it meets the glass and the
   ball; under the surface the ball looks bigger and lifted, as a spoon in a glass. The coffee has light crema
   streaks and a few bubbles on top and rises into the liquid above in soft wisps.

   MkLiquid.sync(stage, { fatigue, cups }) is called by mood-feedback.js after it reads the shift's fatigue and coffee
   (and with no values after it changes the face). The level follows the number the page shows: energy when the
   energy view is on, fatigue when not, always rising with it, over half the glass's height (the user: more
   sensitive than the old 24 %). The wrap's class and style are watched for the dancers (radio-dancers.js: the face
   steps aside, the liquid takes the album's colour). They are flat pictures across the glass's middle, so the liquid
   is then two frames: the half behind them under them, the half in front over them (the user: they must look as if
   they stand in it). The same input draws nothing. Desktop only: the phone keeps its
   own mood as it is. */
(function () {
  'use strict';
  if (document.documentElement.classList.contains('mk-mobile-shell')) return;
  var N = 250;                                   // drawn at twice the ~125 px it is shown at: smooth edges on any screen
  var PITCH = .2, C = Math.cos(PITCH), S = Math.sin(PITCH), E = .012;
  var BUB = [[.4, .78, .05], [1.3, .7, .035], [2.2, .82, .045], [3.5, .74, .03], [4.4, .8, .05], [5.3, .68, .035]];   // crema bubbles: angle, distance, size
  var geo = null, geoKey = '', tex = {}, seen = new WeakSet(), queued = new Set(), raf = 0, vals = new WeakMap(), stages = new Set();

  // per pixel, once per ball: where its view ray enters and leaves the glass, and where it meets the ball
  function geometry(b) {
    var key = b ? [b.x.toFixed(2), b.y.toFixed(2), b.r.toFixed(2)].join() : 'none';
    if (key === geoKey) return geo;
    var g = { idx: [], px: [], py: [], ch: [], ey: [], ez: [], xy: [], xz: [], my: [], mz: [], ms: [] };
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var px = (i + .5) / N * 2 - 1, py = 1 - (j + .5) / N * 2, r2 = px * px + py * py;
      if (r2 >= 1) continue;
      var s = Math.sqrt(1 - r2), zf = 0;
      if (b) { var d2 = (px - b.x) * (px - b.x) + (py - b.y) * (py - b.y); if (d2 < b.r * b.r) zf = Math.min(s, Math.sqrt(b.r * b.r - d2)); }
      g.idx.push(j * N + i); g.px.push(px); g.py.push(py); g.ch.push(2 * s);
      g.ey.push(py * C + s * S); g.ez.push(-py * S + s * C); g.xy.push(py * C - s * S); g.xz.push(-py * S - s * C);
      g.my.push(py * C + zf * S); g.mz.push(-py * S + zf * C); g.ms.push(s - zf);
    }
    geo = g; geoKey = key;
    return g;
  }

  // the emoji as the page draws it, in the glass's own pixels, and the ball it stands for (from its drawn shape)
  function texture(face, vessel) {
    var ch = face.textContent, cs = getComputedStyle(face), vr = vessel.getBoundingClientRect();
    if (!ch || !vr.width) return null;
    var range = document.createRange(); range.selectNodeContents(face);
    // the glass is a little wider than tall: the frame is stretched over it, so the glyph is drawn in page pixels
    var tr = range.getBoundingClientRect(), kx = N / vr.width, ky = N / vr.height, px = parseFloat(cs.fontSize) * (vr.width / vessel.offsetWidth || 1);
    var font = px + 'px ' + cs.fontFamily;
    var key = [ch, font, Math.round((tr.left - vr.left) * kx), Math.round((tr.top - vr.top) * ky), Math.round(vr.width), Math.round(vr.height)].join('|');
    if (tex[key]) return tex[key];
    if (document.fonts && !document.fonts.check(font, ch)) { document.fonts.load(font, ch).then(function () { MkLiquid.sync(face.closest('.rg-mood-stage')); }, function () {}); return null; }
    var c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.setTransform(kx, 0, 0, ky, 0, 0);
    x.font = font; x.textBaseline = 'alphabetic';
    var m = x.measureText(ch), A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
    x.fillText(ch, tr.left - vr.left, tr.top - vr.top + (tr.height - (A + D)) / 2 + A);
    var d = x.getImageData(0, 0, N, N).data, l = N, r = -1, t = N, bt = -1;
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) if (d[(j * N + i) * 4 + 3] > 110) { if (i < l) l = i; if (i > r) r = i; if (j < t) t = j; if (j > bt) bt = j; }
    tex = {};                                     // one face at a time is kept
    tex[key] = { key: key, data: d, ball: r < 0 ? null : { x: (l + r + 1) / N - 1, y: 1 - (t + bt + 1) / N, r: (r - l + bt - t + 2) / (2 * N) } };
    return tex[key];
  }

  // half: 0 the whole glass; 1 only what is behind the dancers, 2 only what is in front of them
  function draw(canvas, water, coffee, rgb, t, half) {
    var key = [water.toFixed(3), coffee.toFixed(3), rgb.join(), t ? t.key : '-', half].join('|');
    if (canvas.__liq === key) return;             // nothing changed: nothing drawn
    canvas.__liq = key;
    if (canvas.width !== N) canvas.width = canvas.height = N;
    var ctx = canvas.getContext('2d'), img = ctx.createImageData(N, N), out = img.data;
    var hasW = water > .002, hasC = coffee > .002;
    if (hasW || hasC) paint(out, geometry(t && t.ball), t && t.data, water, coffee, rgb, hasW, hasC, half);
    ctx.putImageData(img, 0, 0);
  }

  function paint(out, g, face, water, coffee, rgb, hasW, hasC, half) {
    var b = geoKey === 'none' ? null : geoKey.split(',').map(Number), FX = b ? b[0] : 0, FY = b ? b[1] : 0;
    var h2 = -1 + 2 * Math.min(1, water + coffee), h1 = -1 + 2 * coffee, M = g.idx.length;
    var wr = rgb[0] / 255, wg = rgb[1] / 255, wb = rgb[2] / 255;
    var sw0 = (1 - wr) * 1.5 + .14, sw1 = (1 - wg) * 1.5 + .14, sw2 = (1 - wb) * 1.5 + .14;   // the liquid's absorption per channel
    for (var k = 0; k < M; k++) {
      var px = g.px[k], py = g.py[k], o = g.idx[k] * 4;
      // the ray ends at the emoji ball when it is in the way, else at the glass's far wall
      var ball = !!face && face[o + 3] > 110, ey = ball ? g.my[k] : g.xy[k], ez = ball ? g.mz[k] : g.xz[k], seg = ball ? g.ms[k] : g.ch[k];
      var ny = g.ey[k], nz = g.ez[k];                          // where the ray starts: the glass's front wall
      if (half) {   // the dancers are flat pictures across the glass's middle: the ray is cut there
        seg = g.ch[k] / 2;
        if (half === 1) { ny = py * C; nz = -py * S; } else { ey = py * C; ez = -py * S; seg *= .55; }   // (clearer in front: their legs show)
      }
      var fe2 = ny - h2, fx2 = ey - h2;
      if (fe2 >= E && fx2 >= E) continue;                      // air all the way: the page's own emoji shows
      var fe1 = ny - h1, fx1 = ey - h1;
      var uAll = fe2 < 0 ? (fx2 < 0 ? 1 : fe2 / (fe2 - fx2)) : fx2 < 0 ? 1 - fe2 / (fe2 - fx2) : 0;
      var uC = !hasC ? 0 : fe1 < 0 ? (fx1 < 0 ? 1 : fe1 / (fe1 - fx1)) : fx1 < 0 ? 1 - fe1 / (fe1 - fx1) : 0;
      var Lc = uC * seg, Lw = Math.max(0, uAll - uC) * seg, dep = 0;
      if (ball || half === 2) {   // light from above is dimmed by the depth under the surface: the ball (the dancers) fades into the liquid
        dep = fx2 < 0 ? -fx2 : 0;
        var depC = hasC && fx1 < 0 ? -fx1 : 0;
        Lw += Math.min(.5, dep - depC) * .55; Lc += depC * 2.2 + (depC > 0 ? .12 : 0);   // the face stays readable under clear liquid
      }
      if (hasC && hasW && Lw > 0) {   // coffee rising into the liquid above it: soft wisps, the same for the same level
        var up = ball ? fx1 : (fe1 + fx1) * .5;
        if (up > 0 && up < .5) {
          var wsp = Math.sin(px * 7 + 2.2 * Math.sin(py * 6 + h1 * 9)) * Math.sin(py * 9 + 1.7 * Math.sin(px * 5 - h1 * 7));
          var amt = 1 - up / .5; amt = amt * amt * (.15 + .85 * (.5 + .5 * wsp)) * .95 * Lw;
          Lc += amt; Lw -= amt * .6;
        }
      }
      var fr = 0, fg = 0, fb = 0, fa = 0;
      if (face) {   // what is behind: under the surface the ball looks bigger and lifted
        var mag = ball ? 1 - (.045 + .05 * Math.min(1, dep * 2.2)) : 1 - .09 * Math.min(1.6, Lc + Lw);
        var sx = FX + (px - FX) * mag, sy = FY + (py - FY) * mag - (ball ? .012 : 0);
        var si = Math.round(((sx + 1) / 2) * N - .5), sj = Math.round(((1 - sy) / 2) * N - .5);
        if (si >= 0 && sj >= 0 && si < N && sj < N) { var q = (sj * N + si) * 4; fa = face[q + 3] / 255; fr = face[q] / 255 * fa; fg = face[q + 1] / 255 * fa; fb = face[q + 2] / 255 * fa; }
      }
      var T0 = Math.exp(-sw0 * Lw - 2.6 * Lc), T1 = Math.exp(-sw1 * Lw - 5.4 * Lc), T2 = Math.exp(-sw2 * Lw - 9 * Lc);
      var Ta = (T0 + T1 + T2) / 3, wf = Lw / (Lw + Lc + 1e-6);
      var sr = wr * .78 * wf + .36 * (1 - wf), sg = wg * .78 * wf + .16 * (1 - wf), sb = wb * .78 * wf + .06 * (1 - wf);
      var R = fr * T0 + sr * (1 - Ta), G = fg * T1 + sg * (1 - Ta), B = fb * T2 + sb * (1 - Ta), Al = fa + (1 - fa) * (1 - Ta);
      var u, sz, len, m;
      if (hasW && fe2 >= 0 && fx2 < 0) {   // the upper liquid's top seen from above, in front of the ball
        u = fe2 / (fe2 - fx2); sz = nz + (ez - nz) * u; len = Math.sqrt(px * px + h2 * h2 + sz * sz);
        m = len < .82 ? 0 : Math.min(1, (len - .82) / .17); m = .10 + .34 * m * m;
        if (ball) { var near = 1 - Math.min(1, (1 - u) * seg / .10); if (near > 0) m += .42 * near * near; }
        // with the dancers the surface's own film fades to nothing at the glass's middle, where they stand and the two
        // frames meet: they move, so no line may sit on them, and no seam shows in the open water beside them
        var film = half === 2 ? (1 - u) * (1 - u) : half === 1 ? u * u : 1;
        m *= film;
        R += (1 - R) * m; G += (1 - G) * m; B += (1 - B) * m; if (Al < m + .2 * film) Al = m + .2 * film;
      }
      if (hasC && fe1 >= 0 && fx1 < 0) {   // the coffee's top: dark espresso with light crema streaks and bubbles at the rim
        u = fe1 / (fe1 - fx1); sz = nz + (ez - nz) * u;
        var rad = Math.sqrt(px * px + sz * sz), ang = Math.atan2(sz, px), rr = Math.sqrt(Math.max(1e-4, 1 - h1 * h1));
        var sp = .5 + .5 * Math.sin(rad / rr * 9 - ang * 2 + 1.3 + .8 * Math.sin(ang * 3)), st = sp * sp * sp;
        var kr = .30 + .62 * st, kg = .15 + .64 * st, kb = .06 + .54 * st, bub = 0;
        for (var i = 0; i < BUB.length; i++) {
          var bx = Math.cos(BUB[i][0]) * BUB[i][1] * rr - px, bz = Math.sin(BUB[i][0]) * BUB[i][1] * rr - sz, bd = Math.sqrt(bx * bx + bz * bz) / (BUB[i][2] * rr);
          if (bd < 1) { var ring = 1 - Math.abs(bd - .72) / .28; if (ring > bub) bub = ring; }
        }
        if (bub > 0) { kr += (1 - kr) * bub * .8; kg += (1 - kg) * bub * .8; kb += (1 - kb) * bub * .8; }
        var cm = hasW ? .7 * Math.exp(-1.2 * Lw) + .15 : .9;       // dimmed by the liquid over it
        R += (kr - R) * cm; G += (kg - G) * cm; B += (kb - B) * cm; if (Al < cm) Al = cm;
        if (ball) { var nr = 1 - Math.min(1, (1 - u) * seg / .14); if (nr > 0) { nr *= .7; R += (1 - R) * nr; G += (.95 - G) * nr; B += (.85 - B) * nr; } }
      }
      // soft lines where a surface meets the glass's front wall, and the waterline on the ball
      var l2 = hasW && half !== 1 ? 1 - Math.abs(fe2) / .035 : 0;
      if (l2 > 0) { l2 *= .5; R += (1 - R) * l2; G += (1 - G) * l2; B += (1 - B) * l2; if (Al < l2 + .2) Al = l2 + .2; }
      var l1 = hasC && half !== 1 ? 1 - Math.abs(fe1) / .035 : 0;
      if (l1 > 0) { l1 *= .55; R += (.96 - R) * l1; G += (.84 - G) * l1; B += (.66 - B) * l1; if (Al < l1 + .2) Al = l1 + .2; }
      if (ball) {
        var fx = hasW ? fx2 : fx1, wl = 1 - Math.abs(fx) / .03;
        if (wl > 0) { wl *= .6; R += (1 - R) * wl; G += (1 - G) * wl; B += (1 - B) * wl; }
        else if (fx < 0 && fx > -.11) { var wet = (1 + fx / .11) * .16; R *= 1 - wet; G *= 1 - wet; B *= 1 - wet; }
      }
      var edge = Math.min(1, Math.max(0, (E - Math.min(fe2, fx2)) / (2 * E)));   // the liquid's very edge over a hair's width
      Al *= edge; if (Al > 1) Al = 1;
      var inv = Al > 0 ? 255 * edge / Al : 0;
      out[o] = R * inv; out[o + 1] = G * inv; out[o + 2] = B * inv; out[o + 3] = Al * 255;
    }
  }

  function run() {
    raf = 0;
    var list = Array.from(queued); queued.clear();
    list.forEach(function (stage) {
      if (!stage || !stage.isConnected) return;
      var wrap = stage.querySelector('.rg-mood-blob-wrap'), vessel = stage.querySelector('.rg-mood-liquid-vessel');
      if (!wrap || !vessel) return;
      var canvas = vessel.querySelector('canvas');
      if (!canvas) { canvas = document.createElement('canvas'); vessel.appendChild(canvas); vessel.classList.add('is-liq'); }
      if (!seen.has(wrap)) {   // the dancers change the wrap's class and the album's colour on it
        seen.add(wrap);
        new MutationObserver(function () { MkLiquid.sync(stage); }).observe(wrap, { attributes: true, attributeFilter: ['class', 'style'] });
      }
      var dancing = wrap.classList.contains('mk-dancing'), v = vals.get(stage) || {}, coffee = 0, water = 0;
      if (v.fatigue != null) {
        var energy = !!(window.MkOutline && window.MkOutline.energyView && window.MkOutline.energyView());
        var shown = energy ? 100 - v.fatigue : v.fatigue;
        water = shown > 0 ? (6 + shown * .5) / 100 : 0;
      }
      if (v.cups > 0) coffee = Math.min(14, 4 + Math.log(v.cups + 1) / Math.LN2 * 2.2) / 100;
      if (dancing) { var cap = .25 / (water + coffee || 1); water *= cap; coffee *= cap; }   // the dancers stand in it to the waist, whatever the level was
      var c = (dancing && wrap.style.getPropertyValue('--mb-album-rgb')) || stage.style.getPropertyValue('--rg-fatigue-liquid-rgb') || '45,212,191';
      var rgb = c.split(',').map(function (v) { return Math.max(0, Math.min(255, parseInt(v, 10) || 0)); });
      var face = stage.querySelector('[data-rg-fluent-face]');
      var t = !dancing && face && !wrap.querySelector('.mx-jar') && (water > .002 || coffee > .002) ? texture(face, vessel) : null;
      // the dancers stand in the liquid: what is behind them stays under them, what is in front is drawn over them
      var front = wrap.querySelector('.mk-liq-front');
      if (dancing && !front) {
        front = document.createElement('span'); front.className = 'mk-liq-front'; front.setAttribute('aria-hidden', 'true');
        front.appendChild(document.createElement('canvas')); wrap.insertBefore(front, vessel.nextSibling);
      }
      draw(canvas, water, coffee, rgb, t, dancing ? 1 : 0);
      if (dancing) draw(front.firstChild, water, coffee, rgb, null, 2);
    });
  }
  var MkLiquid = window.MkLiquid = {
    sync: function (stage, v) {
      if (!stage) return;
      if (v) vals.set(stage, { fatigue: v.fatigue == null ? null : Math.max(0, Math.min(100, +v.fatigue || 0)), cups: Math.max(0, +v.cups || 0) });
      stages.add(stage); queued.add(stage);
      if (!raf) raf = requestAnimationFrame(run);
    }
  };
  // energy or fatigue shown: the level turns round with the number
  window.addEventListener('mk-energy-view', function () { stages.forEach(function (st) { if (st.isConnected) MkLiquid.sync(st); else stages.delete(st); }); });
})();
