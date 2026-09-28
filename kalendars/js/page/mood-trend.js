/* Team mood trend directly above "Novērtē maiņu" in the mood card.
   The same anonymous reactions the card collects, drawn as a small curve of the
   last 14 duty days, so everyone sees where a tap ends up. Tapping the curve
   opens Statistika, whose first section is the full-month version of it.

   Cost model: one static SVG rebuilt only when its data changes, no idle
   animation, no timers. Missing days are fetched once, lightly (messages=0),
   after the page is idle. The vote "flight" is one transform/opacity WAAPI
   animation on one element. */
(function () {
  'use strict';
  var mkKey = (window.__mkKey || function (k) { return k; });            // /rad: own mood storage
  var PULSE_KEY = mkKey('minkaShiftPulseV2');
  var PENDING_KEY = mkKey('minkaShiftPulsePendingV2');
  var FETCHED_KEY = mkKey('minkaRgTrendFetchedV1');
  var OWN_KEY = mkKey('minkaRgOwnMoodV1');           // a day's own emoji + note (mood-feedback.js)
  var DAYS = 14;
  var W = 280, H = 44, PAD_X = 7, PAD_T = 7, PAD_B = 7;
  // Material 3 Expressive motion tokens (CSS approximations of the spring
  // tokens). Kept by their spec names so the global motion system can lift them.
  var MOTION = {
    spatialSlow: { duration: 650, easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)' },
    spatialFast: { duration: 350, easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)' },
    effectsDefault: { duration: 200, easing: 'cubic-bezier(0.31, 0.94, 0.34, 1.00)' }
  };
  var MOODS = [
    { key: 'terrible', score: 1, color: '#fb7185' },
    { key: 'bad', score: 2, color: '#fb923c' },
    { key: 'ok', score: 3, color: '#cbd5e1' },
    { key: 'good', score: 4, color: '#5eead4' },
    { key: 'excellent', score: 5, color: '#86efac' }
  ];
  var lastSignature = '';
  var pendingFlight = null;
  var fetching = false;
  var fetchQueued = false;

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_e) { return {}; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) {}
  }
  function isoDay(ddmmyyyy) {
    var m = String(ddmmyyyy || '').trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
  }
  function liveDay() {
    var today = isoDay(window.__g_todayStr);
    if (today) return today;
    var d = new Date();
    if (d.getHours() < 8) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(day, delta) {
    var d = new Date(day + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  // The card rates the selected day; the curve ends on it when it is in the
  // past, otherwise on today (future days have nothing to show yet).
  function windowDays() {
    var live = liveDay();
    var selected = isoDay(window.__activeDateStr) || live;
    var end = selected < live ? selected : live;
    var out = [];
    for (var i = DAYS - 1; i >= 0; i--) out.push(addDays(end, -i));
    return { days: out, selected: selected <= live ? selected : live, live: live };
  }
  function score(counts) {
    var total = 0, sum = 0;
    MOODS.forEach(function (m) {
      var n = Math.max(0, Number(counts && counts[m.key]) || 0);
      total += n; sum += n * m.score;
    });
    return total ? { score: sum / total, total: total } : null;
  }
  function moodFor(value) {
    return MOODS.reduce(function (a, b) { return Math.abs(b.score - value) < Math.abs(a.score - value) ? b : a; });
  }
  function smoothPath(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0].x.toFixed(1) + ',' + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
      // Clamp control points to the plot so the curve never bulges past the
      // top/bottom faces it is measured against.
      var c1y = Math.max(PAD_T, Math.min(H - PAD_B, p1.y + (p2.y - p0.y) / 6));
      var c2y = Math.max(PAD_T, Math.min(H - PAD_B, p2.y - (p3.y - p1.y) / 6));
      d += ' C' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ',' + c1y.toFixed(1)
        + ' ' + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ',' + c2y.toFixed(1)
        + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
    }
    return d;
  }
  function x(i) { return PAD_X + i / (DAYS - 1) * (W - PAD_X * 2); }
  function y(value) { return PAD_T + (H - PAD_T - PAD_B) * (1 - (value - 1) / 4); }

  function model() {
    var win = windowDays();
    var all = readJson(PULSE_KEY);
    var rows = win.days.map(function (day, i) {
      return { day: day, i: i, mood: score(all[day]) };
    });
    return { rows: rows, selected: win.selected, live: win.live };
  }
  function svgMarkup(m) {
    var points = m.rows.filter(function (r) { return r.mood; }).map(function (r) {
      return { x: x(r.i), y: y(r.mood.score), row: r };
    });
    var out = '<defs><linearGradient id="rgTrendFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rg-trend-fade-top"/><stop offset="1" class="rg-trend-fade-bottom"/></linearGradient></defs>'
      + '<line class="rg-trend-mid" x1="' + PAD_X + '" x2="' + (W - PAD_X) + '" y1="' + y(3).toFixed(1) + '" y2="' + y(3).toFixed(1) + '"/>';
    if (points.length > 1) {
      var line = smoothPath(points);
      var last = points[points.length - 1], first = points[0];
      out += '<path class="rg-trend-area" d="' + line + ' L' + last.x.toFixed(1) + ',' + H + ' L' + first.x.toFixed(1) + ',' + H + 'Z"/>'
        + '<path class="rg-trend-line" d="' + line + '"/>';
    }
    points.forEach(function (p) {
      var isSel = p.row.day === m.selected;
      out += '<circle class="rg-trend-dot' + (isSel ? ' is-selected' : '') + '" data-day="' + p.row.day + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1)
        + '" r="' + (isSel ? 4.4 : 2.9) + '" fill="' + moodFor(p.row.mood.score).color + '"/>';
    });
    // The day this card rates, still unrated: an open slot that the next tap fills.
    var sel = m.rows.find(function (r) { return r.day === m.selected; });
    if (sel && !sel.mood) {
      out += '<circle class="rg-trend-slot" cx="' + x(sel.i).toFixed(1) + '" cy="' + y(3).toFixed(1) + '" r="4.4"/>';
    }
    return out;
  }
  function slotPoint(svg, m) {
    var sel = m.rows.find(function (r) { return r.day === m.selected; });
    if (!sel) return null;
    var rect = svg.getBoundingClientRect();
    if (!rect.width) return null;
    var k = rect.width / W;
    return { x: rect.left + x(sel.i) * k, y: rect.top + (sel.mood ? y(sel.mood.score) : y(3)) * k };
  }

  function motionLevel() {
    if (window.MinkaMotion) return window.MinkaMotion.level();
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
  }
  function reducedMotion() { return motionLevel() === 'reduced'; }
  function lite() { return motionLevel() === 'lite'; }

  /* One emoji travels from the tapped reaction to its point on the curve:
     spatial motion that shows where the vote went. Measured before any DOM
     write; transform + opacity only; the element removes itself on finish or
     cancel, so rapid taps never leave debris or a half-state. */
  function fly(card, svg, m) {
    var flight = pendingFlight;
    pendingFlight = null;
    if (!flight || Date.now() - flight.at > 800 || reducedMotion()) return false;
    var cardRect = card.getBoundingClientRect();
    var to = MX ? scapeSlot(m) : slotPoint(svg, m);
    if (!to || !cardRect.width) return false;
    var from = flight.from;
    var dx = to.x - from.x, dy = to.y - from.y;
    var el = document.createElement('span');
    el.className = 'rg-trend-fly';
    el.textContent = flight.emoji;
    el.setAttribute('aria-hidden', 'true');
    el.style.left = (from.x - cardRect.left) + 'px';
    el.style.top = (from.y - cardRect.top) + 'px';
    card.appendChild(el);
    if (typeof el.animate !== 'function') { el.remove(); return false; }
    // A shallow arc sampled into keyframes: the curve stays on the compositor
    // and one WAAPI timeline carries both the arc and the easing.
    var steps = lite() ? 4 : 10, frames = [];
    var bow = Math.min(60, Math.abs(dy) * 0.22) * (dx >= 0 ? -1 : 1);
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var e = 1 - Math.pow(1 - t, 3);
      var px = dx * e + bow * Math.sin(Math.PI * e);
      var py = dy * e;
      var sc = 1 - 0.62 * e;
      frames.push({ offset: t, transform: 'translate(-50%,-50%) translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')', opacity: t < 0.85 ? 1 : 0 });
    }
    var anim = el.animate(frames, { duration: lite() ? 460 : 560, easing: 'linear', fill: 'forwards' });
    var done = function () { el.remove(); };
    anim.onfinish = function () {
      done();
      if (MX) { scapePing(to.local); return; }
      var dot = svg.querySelector('.rg-trend-dot.is-selected');
      if (dot && typeof dot.animate === 'function') {
        dot.animate([{ transform: 'scale(.2)' }, { transform: 'scale(1)' }], MOTION.spatialFast);
      }
    };
    anim.oncancel = done;
    return true;
  }

  /* ── Noskaņa X: debesis no simboliem ─────────────────────────────────────
     The effect of ASCII Magic's "Characters" video: a grid of tiny
     characters that stays in place while the clouds drift slowly beneath
     it; each cell shows the character for the light under it, so as a
     cloud comes a cell goes . : - + x X 8 S # @ and back as it leaves, in
     the cloud's own colour. Nothing random: the character follows the
     light alone, read smoothly and changed only when the light has really
     moved on (no flicker), so the characters flow with the clouds.
     The picture is a night sky (assets/mood-sky-v1.webp, see
     scripts/build-mood-sky.py): black above, a cyan ribbon, cream cumulus,
     its lit band behind the orbit, soft behind the characters. Down to the
     curve (their lower border), soft cloud noise drifts the same way,
     tinted by the days' moods near their points.
     Cheap and smooth on an old computer, no WebGL: the drift is one Web
     Animation on transform (the compositor runs it, like the orbit), the
     characters' colour comes from the drifting light through a still
     stencil (compositor too), and the script only redraws the few cells
     whose character changes, 24 times a second. Nothing runs off screen,
     in a hidden tab or for reduced motion. */
  var MX = document.documentElement.classList.contains('mk-mx');
  var FACES = { excellent: ['😍', 'Lieliski'], good: ['🙂', 'Labi'], ok: ['😐', 'Normāli'], bad: ['😞', 'Slikti'], terrible: ['😠', 'Ļoti slikti'] };
  var WD = ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena'];
  var MON = ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs', 'jūnijs', 'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris', 'decembris'];
  var MON_SHORT = ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.', 'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'];
  var SKY_SRC = 'assets/mood-sky-v1.webp?v=20260928s2';
  var SKY_CHARS = '@#S08Xx+=-;:.';                  // dense to sparse, as in the app
  var SKY_ASPECT = 1918 / 820, SKY_BAND = .62;      // the picture's width / height; its lit band, from the top
  var SKY_ZOOM = 2.2;                               // picture width / stage width
  var SKY_LO = .16, SKY_HI = .9;
  var CELL_W = 3.9, CELL_H = 6.6, CELL_FONT = 6;    // the character grid, css px (fine)
  var FIELD = 2;                                    // the light is sampled every 2 css px
  var SKY_BACK = .72;                               // the soft picture behind the characters
  var SKY_PX_PER_S = 2;                             // the drift, css px a second, always leftward (the orbit's own pace)
  /* The sky moves on the shared clock (MinkaMotion.onAmbientTick, 15 a
     second, the same ticks as the orbit and the header weather): its drift
     animations stay paused and each tick sets their time, and every other
     tick (onSlowTick) the cells are checked, so the page draws one frame per
     tick instead of every refresh; a step is ~0.1 px at this speed. */
  // The fill's colours (the curve's ice blue, the clouds' cream, the moods).
  var TONES = [[125, 211, 252], [150, 196, 222], [214, 205, 186], [251, 113, 133], [251, 146, 60], [203, 213, 225], [94, 234, 212], [134, 239, 172]];
  var MOOD_TONE = { terrible: 3, bad: 4, ok: 5, good: 6, excellent: 7 };
  var LEVELS = [.34, .56, .8];
  var sky = { state: '', img: null, key: '', wrap: null, W: 0, H: 0, dpr: 1, run: false, offTick: null, offCells: null, t0: null, anims: [], grid: null };
  var scape = { sig: '', geo: null, pts: null, line: null, ro: null, roT: 0, plot: null, m: null, hold: false };
  function dayDate(day) { return new Date(day + 'T12:00:00'); }
  function dayLabel(day) {
    var d = dayDate(day), wd = WD[d.getDay()];
    return wd.charAt(0).toUpperCase() + wd.slice(1) + ', ' + d.getDate() + '. ' + MON[d.getMonth()];
  }
  function dayShort(day) { var d = dayDate(day); return d.getDate() + '. ' + MON_SHORT[d.getMonth()]; }
  // Monotone cubic through the rated days (Fritsch–Carlson): smooth, and it
  // never swings past a real value the way a plain spline would.
  function monotone(pts, per) {
    var n = pts.length, d = [], k = [], out = [];
    if (n < 2) return pts.slice();
    for (var i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
    k[0] = d[0]; k[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) k[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (!d[i]) { k[i] = k[i + 1] = 0; continue; }
      var a = k[i] / d[i], b = k[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { var tau = 3 / Math.sqrt(s); k[i] = tau * a * d[i]; k[i + 1] = tau * b * d[i]; }
    }
    for (i = 0; i < n - 1; i++) {
      var h = pts[i + 1][0] - pts[i][0];
      for (var j = 0; j < per; j++) {
        var t = j / per, t2 = t * t, t3 = t2 * t;
        out.push([pts[i][0] + t * h, (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h * k[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h * k[i + 1]]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }
  function scapeGeo(card, plot) {
    var mx = card.__mx || {};
    var W = plot.clientWidth, H = plot.clientHeight;
    if (W < 120 || H < 200) return null;
    var faceY = mx.faceY || 132, ground = H - (mx.groundGap || 24), amp = 92;
    return { W: W, H: H, cx: W / 2, faceY: faceY, faceR: (mx.faceD || 124) / 2,
      ground: ground, amp: amp, left: 14, right: W - 14, chartTop: ground - 4 - amp, chartBottom: ground - 14 };
  }
  // A mood score's height on the stage (the curve, the flight and the ping).
  function scapeY(geo, score) { return geo.ground - 14 - (score - 1) / 4 * (geo.amp - 10); }
  function skyDom(plot) {
    var wrap = plot.querySelector(':scope > .rg-scape-sky');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'rg-scape-sky';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = '<div class="rg-sky-move"><canvas class="rg-sky-back"></canvas></div>'
        + '<div class="rg-sky-chars"><div class="rg-sky-move"><canvas class="rg-sky-light"></canvas></div><canvas class="rg-sky-tint"></canvas><canvas class="rg-sky-mask"></canvas></div>';
    }
    if (plot.firstChild !== wrap) plot.insertBefore(wrap, plot.firstChild);
    return wrap;
  }
  function layerCanvas(plot, cls) {
    var cv = plot.querySelector(':scope > canvas.' + cls);
    if (!cv) {
      cv = document.createElement('canvas');
      cv.className = cls;
      cv.setAttribute('aria-hidden', 'true');
      plot.appendChild(cv);
    }
    var wrap = plot.querySelector(':scope > .rg-scape-sky');
    var at = wrap ? wrap.nextSibling : plot.firstChild;
    if (at !== cv) plot.insertBefore(cv, at);
    return cv;
  }
  function blankCanvas(w, h, read) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, w); c.height = Math.max(1, h);
    c.__ctx = c.getContext('2d', read ? { willReadFrequently: true } : undefined);
    return c;
  }
  function loadSky() {
    if (sky.state) return;
    sky.state = 'loading';
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      sky.img = img; sky.state = 'ready'; sky.key = '';
      if (scape.plot && scape.plot.isConnected && scape.geo) buildSky(scape.plot, scape.geo);
    };
    img.onerror = function () { sky.state = 'failed'; };
    img.src = SKY_SRC;
  }
  // A stable random number per position, so a rebuild draws the same sky.
  function hash3(i, j, s) {
    var h = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663) ^ Math.imul(s, 83492791)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // Smooth value noise (0..1), three octaves: soft cloud clumps.
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash3(xi, yi, s), b = hash3(xi + 1, yi, s), c = hash3(xi, yi + 1, s), d = hash3(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function cloudNoise(x, y) { return vnoise(x / 26, y / 16, 7) * .55 + vnoise(x / 11, y / 8, 8) * .3 + vnoise(x / 5, y / 4, 9) * .15; }
  // Value noise that repeats every `nx` lattice cells across (so the drift loops).
  function loopNoise(x, y, s, nx) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var x0 = ((xi % nx) + nx) % nx, x1 = (x0 + 1) % nx;
    var a = hash3(x0, yi, s), b = hash3(x1, yi, s), c = hash3(x0, yi + 1, s), d = hash3(x1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function nearestTone(r, g, b) {
    var best = 0, bd = 1e9;
    for (var i = 0; i < TONES.length; i++) {
      var t = TONES[i], dr = t[0] - r, dg = t[1] - g, db = t[2] - b, dd = dr * dr * .8 + dg * dg + db * db * .7;
      if (dd < bd) { bd = dd; best = i; }
    }
    return best;
  }
  // Every character at every strength, once: white for the stencil, and in
  // the fill's tones. A cell change only copies from here.
  function skyAtlas(cw, ch, dpr, tones) {
    var n = SKY_CHARS.length, rows = (tones ? tones.length : 1) * LEVELS.length;
    var atlas = blankCanvas(cw * n, ch * rows), ac = atlas.__ctx;
    ac.textAlign = 'center'; ac.textBaseline = 'middle';
    ac.font = '500 ' + (CELL_FONT * dpr).toFixed(2) + 'px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
    (tones || [[255, 255, 255]]).forEach(function (tone, ti) {
      LEVELS.forEach(function (alpha, li) {
        ac.fillStyle = 'rgba(' + tone[0] + ',' + tone[1] + ',' + tone[2] + ',' + alpha + ')';
        var row = ti * LEVELS.length + li;
        for (var k = 0; k < n; k++) ac.fillText(SKY_CHARS[k], k * cw + cw / 2, row * ch + ch / 2 + .5 * dpr);
      });
    });
    return atlas;
  }
  /* The sky's outline: not a box. Each edge wanders like a cloud's (smooth
     noise, two scales) and fades softly; with the dark ring round the face,
     it is the sky's mask. Drawn once per size. */
  function skyEdges(wrap, W, H) {
    var mw = Math.max(8, Math.ceil(W / 2)), mh = Math.max(8, Math.ceil(H / 2));
    var cv = blankCanvas(mw, mh, true), cx = cv.__ctx, img = cx.createImageData(mw, mh), d = img.data;
    var wob = function (t, s1, s2) { return (vnoise(t / 55, 3.7, s1) - .5) * 30 + (vnoise(t / 19, 8.1, s2) - .5) * 12; };
    var ss = function (a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    var xl = new Float32Array(mh), xr = new Float32Array(mh), yt = new Float32Array(mw), yb = new Float32Array(mw);
    for (var y = 0; y < mh; y++) { xl[y] = W * .06 + wob(y * 2, 41, 42); xr[y] = W - W * .06 - wob(y * 2, 43, 44); }
    for (var x = 0; x < mw; x++) { yt[x] = 20 + wob(x * 2, 45, 46) * .6; yb[x] = H - 22 - wob(x * 2, 47, 48) * .6; }
    for (y = 0; y < mh; y++) {
      for (x = 0; x < mw; x++) {
        var px = x * 2, py = y * 2;
        var a = ss(xl[y] - 12, xl[y] + 26, px) * ss(xr[y] + 12, xr[y] - 26, px) * ss(yt[x] - 10, yt[x] + 22, py) * ss(yb[x] + 10, yb[x] - 22, py);
        d[(y * mw + x) * 4 + 3] = Math.round(a * 255);
      }
    }
    cx.putImageData(img, 0, 0);
    var ring = 'radial-gradient(circle at 50% var(--mx-face-y, 132px), transparent 60px, rgba(0, 0, 0, .35) 74px, #000 104px)';
    var mask = 'url(' + cv.toDataURL('image/png') + '), ' + ring;
    wrap.style.webkitMaskImage = mask; wrap.style.maskImage = mask;
    wrap.style.webkitMaskSize = '100% 100%, auto'; wrap.style.maskSize = '100% 100%, auto';
    wrap.style.webkitMaskRepeat = 'no-repeat'; wrap.style.maskRepeat = 'no-repeat';
  }
  function buildSky(plot, geo) {
    if (!geo || sky.state !== 'ready') return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = geo.W, H = geo.H;
    var wrap = skyDom(plot);
    var key = [W, H, geo.faceY, geo.ground, dpr].join(',');
    if (key === sky.key && sky.wrap === wrap) return;
    skyRun(false);
    sky.anims.forEach(function (anim) { anim.cancel(); });
    sky.anims = [];
    sky.key = key; sky.wrap = wrap; sky.W = W; sky.H = H; sky.dpr = dpr;
    skyEdges(wrap, W, H);
    // 1. The strip: the picture, its mirror image, the picture again (one
    //    period P loops without a seam); lit band behind the orbit, bottom
    //    fading to black before the curve.
    var img = sky.img, pw = W * SKY_ZOOM, ph = pw / SKY_ASPECT, P = Math.round(pw * 2);
    var SW = P + Math.ceil(W) + 4;
    var bandY = geo.faceY + 30, y0 = bandY - SKY_BAND * ph;
    var scene = blankCanvas(SW, H, true), sc = scene.__ctx;
    sc.imageSmoothingQuality = 'high';
    for (var k = 0; k * pw < SW; k++) {
      sc.save();
      if (k % 2) { sc.translate((k + 1) * pw, 0); sc.scale(-1, 1); sc.drawImage(img, 0, y0, pw, ph); }
      else sc.drawImage(img, k * pw, y0, pw, ph);
      sc.restore();
    }
    sc.globalCompositeOperation = 'destination-out';
    var under = sc.createLinearGradient(0, y0 + ph * .78, 0, y0 + ph * .98);
    under.addColorStop(0, 'rgba(0,0,0,0)'); under.addColorStop(1, '#000');
    sc.fillStyle = under; sc.fillRect(0, y0 + ph * .78, SW, H);
    sc.globalCompositeOperation = 'source-over';
    // 2. The soft picture behind (a third of the size, stretched back).
    var soft = blankCanvas(Math.ceil(SW / 3), Math.ceil(H / 3));
    soft.__ctx.imageSmoothingQuality = 'high';
    soft.__ctx.drawImage(scene, 0, 0, soft.width, soft.height);
    var back = wrap.querySelector('.rg-sky-back'), light = wrap.querySelector('.rg-sky-light');
    [back, light].forEach(function (cv) {
      cv.width = Math.ceil(SW / 2); cv.height = Math.ceil(H / 2);
      cv.style.width = SW + 'px'; cv.style.height = H + 'px';
    });
    var bk = back.getContext('2d');
    bk.imageSmoothingQuality = 'high';
    bk.globalAlpha = SKY_BACK;
    bk.drawImage(soft, 0, 0, back.width, back.height);
    // 3. The characters' light, drifting with the picture: the picture
    //    brighter (black stays black), and down to the curve soft cloud noise
    //    that repeats every P. The same two, every 2 px, choose the characters.
    var fillTop = Math.max(0, geo.chartTop - 96), n1 = Math.round(P / 26), n2 = Math.round(P / 11), n3 = Math.round(P / 5);
    var noiseAt = function (wx, wy) {
      var nx = (wx % P) / P;
      return loopNoise(nx * n1, wy / 16, 7, n1) * .55 + loopNoise(nx * n2, wy / 8, 8, n2) * .3 + loopNoise(nx * n3, wy / 4, 9, n3) * .15;
    };
    var lc = light.getContext('2d', { willReadFrequently: true });
    lc.drawImage(scene, 0, 0, light.width, light.height);
    var id = lc.getImageData(0, 0, light.width, light.height), d = id.data, lw = light.width;
    for (var i = 0; i < d.length; i += 4) {
      var m = (d[i] + d[i + 1] + d[i + 2]) / 3, lum3 = m / 255, lift = Math.pow(lum3, 1.35) / Math.max(.001, lum3);
      for (var ch3 = 0; ch3 < 3; ch3++) d[i + ch3] = Math.max(0, Math.min(255, (m + (d[i + ch3] - m) * 1.25) * 1.55 * lift));
      var p4 = i / 4, ly = (p4 / lw) | 0, lx = p4 - ly * lw;
      if (ly * 2 >= fillTop) {
        var v = Math.max(0, Math.min(1, (noiseAt(lx * 2, ly * 2) - .24) / .42)) * 230;
        d[i] = Math.max(d[i], v); d[i + 1] = Math.max(d[i + 1], v); d[i + 2] = Math.max(d[i + 2], v);
      }
      d[i + 3] = 255;
    }
    lc.putImageData(id, 0, 0);
    var fw = Math.round(P / FIELD) + 1, fh = Math.ceil(H / FIELD) + 2;
    var small = blankCanvas(fw, fh, true), smc = small.__ctx;
    smc.imageSmoothingQuality = 'high';
    smc.drawImage(scene, 0, 0, fw * FIELD, fh * FIELD, 0, 0, fw, fh);
    var sd = smc.getImageData(0, 0, fw, fh).data, lum = new Float32Array(fw * fh), noise = new Float32Array(fw * fh);
    for (i = 0; i < lum.length; i++) {
      lum[i] = (.2126 * sd[i * 4] + .7152 * sd[i * 4 + 1] + .0722 * sd[i * 4 + 2]) / 255 * (sd[i * 4 + 3] / 255);
      var fy = (i / fw) | 0;
      if (fy * FIELD >= fillTop - 4) noise[i] = noiseAt((i - fy * fw) * FIELD, fy * FIELD);
    }
    // 4. The grid (device-pixel cells, never moving) and its two still
    //    canvases: the stencil (white characters on black) and the tint.
    var cw = Math.max(3, Math.round(CELL_W * dpr)), chh = Math.max(5, Math.round(CELL_H * dpr));
    var mask = wrap.querySelector('.rg-sky-mask'), tint = wrap.querySelector('.rg-sky-tint');
    [mask, tint].forEach(function (cv) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
    });
    var mctx = mask.getContext('2d');
    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mask.width, mask.height);
    var cols = Math.ceil(mask.width / cw), rows = Math.ceil(mask.height / chh), cells = cols * rows;
    var cx = new Float32Array(cells), cy = new Float32Array(cells), dith = new Float32Array(cells);
    var B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (var c = 0; c < cells; c++) {
      var col = c % cols, row = (c / cols) | 0;
      cx[c] = (col + .5) * cw / dpr; cy[c] = (row + .5) * chh / dpr;
      dith[c] = (B4[(row & 3) * 4 + (col & 3)] + .5) / 16;    // ordered, not random: a calm, even thinning
    }
    sky.grid = { mask: mask, mctx: mctx, tint: tint, white: skyAtlas(cw, chh, dpr), cw: cw, ch: chh, cols: cols, cells: cells,
      cx: cx, cy: cy, dith: dith, cur: new Int16Array(cells).fill(-2), val: new Float32Array(cells).fill(-1),
      above: null, near: null, fw: fw, fh: fh, lum: lum, noise: noise, fillTop: fillTop, P: P, dur: P / SKY_PX_PER_S * 1000 };
    // 5. The drift: the soft picture and the characters' light, one period
    //    leftward, linear and endless, from one start time.
    if (!reducedMotion()) {
      if (sky.t0 == null) sky.t0 = performance.now();           // one clock: a rebuild never jumps
      wrap.querySelectorAll('.rg-sky-move').forEach(function (el) {
        if (typeof el.animate !== 'function') return;
        var anim = el.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(' + -P + 'px)' }],
          { duration: sky.grid.dur, iterations: Infinity, easing: 'linear' });
        anim.pause();
        sky.anims.push(anim);
      });
      skyTick(performance.now());
    }
    skyRegion();
    wrap.classList.add('is-on');
    skyRun(!scape.hold && !document.hidden);
  }
  // How far the light has drifted now (0..P), from the animation's own clock.
  function skyOffset() {
    var G = sky.grid, a = sky.anims[0];
    if (!G || !a || a.currentTime == null) return 0;
    return (a.currentTime % G.dur) / G.dur * G.P;
  }
  function fieldAt(arr, G, x, y) {
    var fx = x / FIELD, fy = y / FIELD, x0 = Math.floor(fx), y1 = Math.floor(fy);
    var ax = fx - x0, ay = fy - y1, fw = G.fw, pw = fw - 1;
    x0 = ((x0 % pw) + pw) % pw; y1 = Math.max(0, Math.min(G.fh - 2, y1));
    var i0 = y1 * fw + x0, i1 = i0 + fw;
    return (arr[i0] + (arr[i0 + 1] - arr[i0]) * ax) * (1 - ay) + (arr[i1] + (arr[i1 + 1] - arr[i1]) * ax) * ay;
  }
  /* The character each cell shows for the light under it now: the light
     alone decides it (no randomness), and a cell changes only once the
     light has moved on by a clear step, so nothing flickers. Only changed
     cells are redrawn. */
  function skyCheck(all) {
    var G = sky.grid;
    if (!G || !G.mask.isConnected) return;
    var o = skyOffset(), n = SKY_CHARS.length, ctx = G.mctx, above = G.above, near = G.near;
    for (var c = 0; c < G.cells; c++) {
      var code = -1, v = 0;
      if (!above || above[c]) {
        var x = G.cx[c] + o, y = G.cy[c];
        v = (fieldAt(G.lum, G, x, y) - SKY_LO) / (SKY_HI - SKY_LO);
        if (near && near[c] > 0) v = Math.max(v, (fieldAt(G.noise, G, x, y) - .24) / .42 * near[c]);
        if (v > 1) v = 1;
        // hold the last value unless the light has clearly moved on
        if (!all && Math.abs(v - G.val[c]) < .045) continue;
        if (v > 0 && G.dith[c] < v * 1.7) {
          var level = v < .38 ? 0 : v < .7 ? 1 : 2;
          code = level * n + Math.min(n - 1, ((1 - v) * n) | 0);
        }
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
  function skyTick(now) {
    var t = now - sky.t0;
    for (var i = 0; i < sky.anims.length; i++) sky.anims[i].currentTime = t;
  }
  function skyCells() { skyCheck(false); }
  // On while the card is on screen and the tab visible; off otherwise.
  function skyRun(on) {
    var M = window.MinkaMotion;
    on = !!on && !!sky.grid && !reducedMotion() && !!(M && M.onAmbientTick);
    if (on === sky.run) return;
    sky.run = on;
    if (sky.offTick) { sky.offTick(); sky.offTick = null; }
    if (sky.offCells) { sky.offCells(); sky.offCells = null; }
    if (on) { sky.offTick = M.onAmbientTick(skyTick); sky.offCells = M.onSlowTick(skyCells); }
  }
  /* With the curve (so the border follows the data): which cells lie above
     it (characters stop at the curve), how strongly the cloud noise shows
     near it, and the tint: white, except near the curve, from the clouds'
     cream to the curve's ice blue, with each marked day's mood colour over
     its point. */
  function skyRegion() {
    var G = sky.grid;
    if (!G) return;
    var line = scape.line && scape.line.length > 1 ? scape.line : null, dpr = sky.dpr, cols = G.cols;
    var tc = G.tint.getContext('2d');
    tc.fillStyle = '#fff'; tc.fillRect(0, 0, G.tint.width, G.tint.height);
    if (!line) { G.above = null; G.near = null; skyCheck(true); return; }
    var colY = new Float32Array(cols), li = 0;
    for (var col = 0; col < cols; col++) {
      var x = (col + .5) * G.cw / dpr, last = line[line.length - 1];
      if (x <= line[0][0]) colY[col] = line[0][1];
      else if (x >= last[0]) colY[col] = last[1];
      else {
        while (li < line.length - 2 && line[li + 1][0] < x) li++;
        var p0 = line[li], p1 = line[li + 1];
        colY[col] = p0[1] + (p1[1] - p0[1]) * (x - p0[0]) / ((p1[0] - p0[0]) || 1);
      }
    }
    var above = new Uint8Array(G.cells), near = new Float32Array(G.cells);
    var dots = (scape.pts || []).filter(function (p) { return p.row.mood; });
    var top = G.fillTop;
    for (var c = 0; c < G.cells; c++) {
      var cx = G.cx[c], cy = G.cy[c], dist = colY[c % cols] - cy;
      if (dist <= 2) continue;
      above[c] = 1;
      if (cy < top || dist > 140) continue;
      var up = Math.min(1, (cy - top) / 56);
      near[c] = (.45 + .55 * Math.exp(-dist / 30)) * up * up * (3 - 2 * up);
      var kk = Math.max(0, Math.min(1, dist / 70));
      var r = 125 + (214 - 125) * kk, g = 211 + (205 - 211) * kk, b = 252 + (186 - 252) * kk, wsum = 1;
      for (var di = 0; di < dots.length; di++) {
        var p = dots[di], ddx = (cx - p.x) / (24 + Math.min(14, p.row.mood.total * 2)), ddy = (cy - p.y + 10) / 36;
        var wgt = Math.exp(-(ddx * ddx + ddy * ddy)) * 1.6;
        if (wgt < .02) continue;
        var mt = TONES[MOOD_TONE[moodFor(p.row.mood.score).key]];
        r += mt[0] * wgt; g += mt[1] * wgt; b += mt[2] * wgt; wsum += wgt;
      }
      var w = Math.min(1, near[c] * 1.2);
      tc.fillStyle = 'rgb(' + ((255 + (r / wsum - 255) * w) | 0) + ',' + ((255 + (g / wsum - 255) * w) | 0) + ',' + ((255 + (b / wsum - 255) * w) | 0) + ')';
      tc.fillRect((c % cols) * G.cw, ((c / cols) | 0) * G.ch, G.cw, G.ch);
    }
    G.above = above; G.near = near;
    skyCheck(true);
  }
  // The curve, above the sky: drawn once per data or size change.
  function drawScape(card, plot, m, geo) {
    var cv = layerCanvas(plot, 'rg-scape');
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = geo.W, H = geo.H, n = m.rows.length;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // The fortnight drawn like the statistics chart (daybook-stats.js
    //    moodChart), but only the curve itself: one dashed ice-blue line
    //    through the marked days, dots in the mood's colour that grow with the
    //    votes, and a day's own emoji above its point. No axis, grid or labels.
    var X = function (i) { return geo.left + 6 + i / (n - 1) * (geo.right - geo.left - 12); };
    var Y = function (score) { return scapeY(geo, score); };
    var owns = readJson(OWN_KEY);
    var pts = m.rows.map(function (r, i) { return { row: r, x: X(i), y: r.mood ? Y(r.mood.score) : Y(3), own: owns[r.day] && owns[r.day].emoji ? owns[r.day] : null }; });
    scape.pts = pts;
    var dots = pts.filter(function (p) { return p.row.mood; });
    if (dots.length > 1) {
      var line = monotone(dots.map(function (p) { return [p.x, p.y]; }), 12);
      ctx.save();
      ctx.beginPath(); line.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.setLineDash([4, 5]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(4,7,14,.45)'; ctx.lineWidth = 3.4; ctx.stroke();   // a thin dark edge: reads on the clouds too
      ctx.strokeStyle = 'rgba(125,211,252,.9)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    }
    // The sky's characters fill down to this curve: move their border too.
    scape.line = dots.length > 1 ? line : null;
    skyRegion();
    pts.forEach(function (p) {
      var sel = p.row.day === m.selected;
      if (!p.row.mood) {
        if (!sel || p.own) return;
        ctx.save(); ctx.setLineDash([2.5, 2.5]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        return;
      }
      var r = 3.2 + Math.min(4, p.row.mood.total / 3);
      ctx.fillStyle = moodFor(p.row.mood.score).color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0c0d11'; ctx.lineWidth = 1.5; ctx.stroke();
      if (sel) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2); ctx.stroke(); }
    });
    // The days' own emoji, under their point (the characters fill the sky
    // above the curve): real text in the Fluent font (drawn by the page, so
    // the web font is always the one used).
    var marks = plot.querySelector('.rg-scape-marks');
    if (!marks) {
      marks = document.createElement('div');
      marks.className = 'rg-scape-marks';
      marks.setAttribute('aria-hidden', 'true');
      plot.appendChild(marks);
    }
    var html = '';
    pts.forEach(function (p) {
      if (!p.own) return;
      html += '<i class="rg-scape-own" style="left:' + p.x.toFixed(1) + 'px;top:' + (p.y + 15).toFixed(1) + 'px">' + esc(p.own.emoji) + '</i>';
    });
    marks.innerHTML = html;
  }
  function scapeSummary(m) {
    var rated = m.rows.filter(function (r) { return r.mood; });
    if (!rated.length) return 'Komandas noskaņa 14 dienās: vēl nav vērtējumu. Atvērt statistiku';
    var total = rated.reduce(function (n, r) { return n + r.mood.total; }, 0);
    var avg = rated.reduce(function (n, r) { return n + r.mood.score * r.mood.total; }, 0) / total;
    var best = rated.reduce(function (a, b) { return b.mood.score > a.mood.score ? b : a; });
    var worst = rated.reduce(function (a, b) { return b.mood.score < a.mood.score ? b : a; });
    return 'Komandas noskaņa 14 dienās: vidēji ' + FACES[moodFor(avg).key][1].toLowerCase() + ', ' + total + ' anonīmi vērtējumi. '
      + 'Labākā diena ' + dayLabel(best.day) + ', grūtākā ' + dayLabel(worst.day) + '. Atvērt statistiku';
  }
  function wireScape(plot) {
    if (plot.__mxWired) return;
    plot.__mxWired = true;
    // Off screen (scrolled away, radio over the calendar): the sky's CSS
    // motion pauses (mk-mood-x.css), so it costs nothing there.
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        scape.hold = !entries[entries.length - 1].isIntersecting;
        skyRun(!scape.hold && !document.hidden);
      }).observe(plot);
    }
    if (typeof ResizeObserver === 'function') {
      scape.ro = new ResizeObserver(function () {
        clearTimeout(scape.roT);
        scape.roT = setTimeout(function () { if (plot.isConnected) paint(plot.closest('.rg-feedback-card')); }, 100);
      });
      scape.ro.observe(plot);
    }
  }
  function paintScape(card, trend, m) {
    var plot = trend.querySelector('.rg-trend-plot');
    if (!plot) return;
    var geo = scapeGeo(card, plot);
    if (!geo) return;
    if (scape.plot !== plot) { scape.plot = plot; scape.sig = ''; wireScape(plot); }
    var owns = readJson(OWN_KEY);
    var sig = m.selected + '|' + m.live + '|' + [geo.W, geo.H, geo.faceY, geo.faceR, window.devicePixelRatio || 1].join(',')
      + '|' + m.rows.map(function (r) { return owns[r.day] && owns[r.day].emoji || ''; }).join(',')
      + '|' + m.rows.map(function (r) { return r.mood ? r.mood.score.toFixed(3) + ':' + r.mood.total : '-'; }).join(',');
    scape.m = m;
    scape.geo = geo;
    loadSky();
    buildSky(plot, geo);
    if (sig !== scape.sig) {
      scape.sig = sig;
      drawScape(card, plot, m, geo);
      trend.setAttribute('aria-label', scapeSummary(m));
      trend.removeAttribute('title');
      trend.classList.toggle('is-empty', !m.rows.some(function (r) { return r.mood; }));
    }
  }
  // Where a vote lands on the landscape (for the flight), in viewport pixels.
  function scapeSlot(m) {
    if (!scape.plot || !scape.pts) return null;
    var p = scape.pts.find(function (q) { return q.row.day === m.selected; });
    if (!p) return null;
    var r = scape.plot.getBoundingClientRect();
    var mood = model().rows.find(function (row) { return row.day === m.selected; });
    var y = mood && mood.mood && scape.geo ? scapeY(scape.geo, mood.mood.score) : p.y;
    return { x: r.left + p.x, y: r.top + y, local: { x: p.x, y: y } };
  }
  function scapePing(local) {
    if (!scape.plot || !local || reducedMotion()) return;
    var ping = document.createElement('span');
    ping.className = 'rg-scape-ping';
    ping.style.left = local.x.toFixed(1) + 'px';
    ping.style.top = local.y.toFixed(1) + 'px';
    scape.plot.appendChild(ping);
    if (typeof ping.animate !== 'function') { ping.remove(); return; }
    var a = ping.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .9 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' });
    a.onfinish = a.oncancel = function () { ping.remove(); };
  }

  function paint(card) {
    card = card || document.querySelector('.rg-feedback-card');
    if (!card) return;
    var trend = card.querySelector('[data-rg-trend]');
    if (MX && trend) {
      var mm = model();
      paintScape(card, trend, mm);
      if (pendingFlight) fly(card, null, mm);
      scheduleFetch();
      return;
    }
    var svg = trend && trend.querySelector('.rg-trend-svg');
    if (!svg) return;
    var m = model();
    var marked = m.rows.filter(function (r) { return r.mood; });
    var signature = m.selected + '|' + m.rows.map(function (r) { return r.mood ? r.mood.score.toFixed(3) + ':' + r.mood.total : '-'; }).join(',');
    if (signature !== lastSignature || !svg.firstChild) {
      lastSignature = signature;
      svg.innerHTML = svgMarkup(m);
      var total = marked.reduce(function (n, r) { return n + r.mood.total; }, 0);
      trend.setAttribute('aria-label', 'Komandas sajūta pēdējās ' + DAYS + ' dienās: ' + (total ? total + ' anonīmi vērtējumi' : 'vēl nav vērtējumu') + '. Atvērt statistiku');
      trend.classList.toggle('is-empty', !marked.length);
    }
    if (pendingFlight) fly(card, svg, m);
    scheduleFetch();
  }

  /* Days the card itself never loaded. Recent days may still gain votes, so
     they refresh after 10 minutes; older days after 12 hours. */
  function staleDays() {
    var m = model();
    var fetched = readJson(FETCHED_KEY);
    var now = Date.now();
    var selected = m.selected;
    return m.rows.map(function (r) { return r.day; }).filter(function (day) {
      if (day === selected) return false; // mood-feedback.js loads this one
      var ttl = day >= addDays(m.live, -1) ? 10 * 60000 : 12 * 3600000;
      return !fetched[day] || now - fetched[day] > ttl;
    });
  }
  function scheduleFetch() {
    if (fetching || fetchQueued) return;
    var base = String(window.MINKA_FEEDBACK_API_BASE || '').replace(/\/$/, '');
    if (!base || navigator.onLine === false || document.hidden) return;
    if (!staleDays().length) return;
    fetchQueued = true;
    var run = function () { fetchQueued = false; fetchMissing(base); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 1500);
  }
  function fetchMissing(base) {
    var todo = staleDays();
    if (!todo.length || fetching) return;
    fetching = true;
    var index = 0, changed = false;
    function worker() {
      return (async function () {
        while (index < todo.length) {
          var day = todo[index++];
          try {
            var r = await fetch(base + '/api/feedback?date=' + day + '&messages=0', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
            if (!r.ok) throw new Error();
            var data = await r.json();
            if (!data || data.ok !== true) throw new Error();
            var all = readJson(PULSE_KEY), pending = readJson(PENDING_KEY)[day] || {};
            var counts = all[day] || {};
            MOODS.forEach(function (mood) {
              counts[mood.key] = Math.max(0, Number(data.ratings && data.ratings[mood.key]) || 0) + Math.max(0, Number(pending[mood.key]) || 0);
            });
            all[day] = counts;
            writeJson(PULSE_KEY, all);
            var fetched = readJson(FETCHED_KEY);
            fetched[day] = Date.now();
            // Keep the bookkeeping bounded to the visible window and a margin.
            var oldest = addDays(liveDay(), -60);
            Object.keys(fetched).forEach(function (k) { if (k < oldest) delete fetched[k]; });
            writeJson(FETCHED_KEY, fetched);
            changed = true;
          } catch (_e) { /* next paint retries after the TTL logic */ }
        }
      })();
    }
    Promise.all([worker(), worker()]).then(function () {
      fetching = false;
      if (changed) paint();
    });
  }

  // Remember where the tapped reaction was; paintCounts() → paint() runs in
  // the same click and turns it into the flight.
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('.rg-feedback-card [data-rg-pulse]');
    if (!button) return;
    var glyph = button.querySelector('span') || button;
    var rect = glyph.getBoundingClientRect();
    pendingFlight = { at: Date.now(), emoji: button.dataset.emoji || '', from: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } };
  }, true);
  document.addEventListener('click', function (event) {
    var trend = event.target.closest && event.target.closest('[data-rg-trend]');
    if (!trend) return;
    event.preventDefault();
    // The statistics dialog grows out of the curve it expands on.
    if (typeof window.openStatsModal === 'function') window.openStatsModal({ from: trend });
  });
  window.addEventListener('online', scheduleFetch);
  document.addEventListener('visibilitychange', function () {
    skyRun(!document.hidden && !scape.hold);
    if (!document.hidden) paint();
  });

  window.MinkaMoodTrend = { paint: paint };
  paint();
})();
