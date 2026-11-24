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
  var fetchRetryAt = 0;   // after a failed day, the next try waits (else every paint asked again at once, thousands a second)

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
  // Noskaņa B (kalendars/index.html): a still sky in CSS instead of this ASCII one (nothing to build or step), and
  // the curve in the fatigue's own colour (--mb-acc on the card, mood-feedback.js), without the dither under it.
  var MB = MX && document.documentElement.classList.contains('mk-mb');
  var M3 = MB && document.documentElement.classList.contains('mk-m3');   // the M3 look: a coffee bean over the days, not a small cup
  var FACES = { excellent: ['😍', 'Lieliski'], good: ['🙂', 'Labi'], ok: ['😐', 'Normāli'], bad: ['😞', 'Slikti'], terrible: ['😠', 'Ļoti slikti'] };
  var WD = ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena'];
  var MON = ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs', 'jūnijs', 'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris', 'decembris'];
  var MON_SHORT = ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.', 'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'];
  var SKY_SRC = 'assets/mood-sky-v1.webp?v=20260928s2';
  var SKY_CHARS = '@#S08Xx+=-;:.';                  // dense to sparse, as in the app
  var SKY_ASPECT = 1918 / 820, SKY_BAND = .62;      // the picture's width / height; its lit band, from the top
  var SKY_ZOOM = 2.2;                               // picture width / stage width
  var SKY_LO = .16, SKY_HI = .9;
  // A plain screen (one device pixel per css px, the work PCs' monitors): 6 px characters there blur
  // into grey fog, so the grid is coarser and the inks brighter; a sharp screen keeps the fine grid.
  var PLAIN = (window.devicePixelRatio || 1) < 1.5;
  var CELL_W = PLAIN ? 5 : 3.9, CELL_H = PLAIN ? 8 : 6.6, CELL_FONT = PLAIN ? 7.5 : 6;    // the character grid, css px (fine)
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
  var LEVELS = PLAIN ? [.5, .74, 1] : [.34, .56, .8];
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
    // The size comes from the plot's ResizeObserver (read after the browser's own layout); reading
    // clientWidth here forced a whole-page layout in the middle of loading (~40 ms).
    var size = plot.__mxSize;
    var W = size ? size.W : plot.clientWidth, H = size ? size.H : plot.clientHeight;
    if (W < 120 || H < 200) return null;
    var faceY = mx.faceY || 132, ground = H - (mx.groundGap || 24), amp = 66;   // low enough that the coffee over the points stays clear of the ring
    if (MB) { ground += 8; amp = 46; }   // B: flatter and lower, close over the rating row (the user: less empty room there), bigger marks
    if (M3) { ground = H - 26; amp = 30; }   // M3: a ribbon under the bigger glass, its faces just over the buttons; the day's coffees lift it further (drawScape); under it the days' dates (m3Days)
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
    if (sky.state || MB) return;
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
    ac.font = (PLAIN ? '700 ' : '500 ') + (CELL_FONT * dpr).toFixed(2) + 'px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
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
    skyRun(!scape.hold && !scape.covered && !document.hidden);
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
  /* Under the line, a 1-bit Bayer fill (MinkaDither.bayer8) in the line's colour:
     densest at the curve, fading out ~38 px below, in 2 px cells so the dots stay
     crisp. The line itself stays a clean stroke above it. Drawn with the curve, once
     per data or size change, over that band only; no frames, files or requests. */
  var ditherCv = null;
  function ditherFill(ctx, line, dpr) {
    var bayer = window.MinkaDither && window.MinkaDither.bayer8;
    if (!bayer || line.length < 2) return;
    var fade = 38, x0 = line[0][0], x1 = line[line.length - 1][0], y0 = Infinity, y1 = -Infinity;
    line.forEach(function (p) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var bx = Math.max(0, Math.floor(x0 * dpr)), by = Math.max(0, Math.floor(y0 * dpr));
    var bw = Math.min(ctx.canvas.width, Math.ceil(x1 * dpr)) - bx, bh = Math.min(ctx.canvas.height, Math.ceil((y1 + fade) * dpr)) - by;
    if (bw < 1 || bh < 1) return;
    if (!ditherCv) ditherCv = document.createElement('canvas');
    ditherCv.width = bw; ditherCv.height = bh;
    var c = ditherCv.getContext('2d'), img = c.createImageData(bw, bh), d = img.data, cell = 2 * dpr, seg = 0;
    for (var x = 0; x < bw; x++) {
      var cx = (bx + x + .5) / dpr;                       // the curve's height over this column
      while (seg < line.length - 2 && line[seg + 1][0] < cx) seg++;
      var p = line[seg], q = line[seg + 1], t = q[0] > p[0] ? (cx - p[0]) / (q[0] - p[0]) : 0;
      var top = (p[1] + (q[1] - p[1]) * Math.max(0, Math.min(1, t))) * dpr + 2.5 * dpr;
      var gx = ((bx + x) / cell | 0) & 7;
      for (var y = Math.max(0, Math.ceil(top - by)); y < bh; y++) {
        var density = .5 * (1 - (by + y - top) / (fade * dpr));
        if (density <= 0) break;
        if (density > bayer[(((by + y) / cell | 0) & 7) * 8 + gx]) {
          var i = (y * bw + x) * 4; d[i] = 143; d[i + 1] = 220; d[i + 2] = 255; d[i + 3] = 150;
        }
      }
    }
    c.putImageData(img, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ditherCv, bx, by); ctx.restore();
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
    var levels = curveLevels(m.rows);
    var pts = m.rows.map(function (r, i) { return { row: r, x: X(i), y: Y(levels[i]), own: owns[r.day] && owns[r.day].emoji ? owns[r.day] : null }; });
    if (M3) pts.forEach(function (p) { p.y = geo.H - 58; });   // M3: no rating ribbon (the user: only the team's line); the days stand in one row: a bean, the day's face under it, its date at the foot
    if (false) {   // the ribbon rises with the day's coffees (the user: higher where there was coffee, not a straight line): up to 16 px on the fortnight's biggest day
      var cupsN = coffeeByDay(m.rows.map(function (r) { return r.day; })), most = 0;
      Object.keys(cupsN).forEach(function (d) { if (cupsN[d] > most) most = cupsN[d]; });
      pts.forEach(function (p) { p.lift = 0; });   // the ribbon is the rating alone now: the coffee is the beans with their numbers, the team's day the line over it (the user: three things, each its own; the coffee lift mixed two of them)
    }
    scape.pts = pts;
    var dots = pts.filter(function (p) { return p.row.mood; });
    // From the first vote on, the line passes every day: unrated ones at their
    // curveLevels height (between the votes, with the coffee swell), so a gap or
    // the days after the last vote are no longer one straight stroke.
    var first = pts.findIndex(function (p) { return p.row.mood; });
    var path = first < 0 ? [] : pts.slice(first);
    if (path.length > 1 && !M3) {
      var line = monotone(path.map(function (p) { return [p.x, p.y]; }), 12);
      var trace = function (c) { c.beginPath(); line.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); };
      ctx.save();
      // the dither fill below, then the line: a dark edge so it reads on the
      // bright clouds, a soft wide halo (a plain wider stroke) and the line itself
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var acc = MB && card.style.getPropertyValue('--mb-acc').trim();
      if (!acc) ditherFill(ctx, line, dpr);
      trace(ctx);
      if (!M3) { ctx.strokeStyle = 'rgba(4,7,14,.55)'; ctx.lineWidth = acc ? 5 : 4.2; ctx.stroke(); }
      if (!acc) { ctx.strokeStyle = 'rgba(125,211,252,.22)'; ctx.lineWidth = 6; ctx.stroke(); }
      if (M3) {
        // M3: drawn as the team's line over it (the user: a wearable's curve, not a tube): a mist under it fading
        // into the dark, and the line, both soft at the first day and full at the latest; no dark edge
        var rx0 = line[0][0], rx1 = line[line.length - 1][0], rspan = Math.max(1, rx1 - rx0), base = acc || '#8fdcff';
        var ramp = function (alpha) { var g = ctx.createLinearGradient(rx0, 0, rx1, 0); for (var t = 0; t <= 1.0001; t += .125) g.addColorStop(Math.min(1, t), 'color-mix(in srgb, ' + base + ' ' + Math.round(alpha * (.14 + .86 * Math.pow(t, 1.5)) * 100) + '%, transparent)'); return g; };
        var rlow = Math.max.apply(null, line.map(function (q) { return q[1]; })) + 18, rtop = Math.min.apply(null, line.map(function (q) { return q[1]; }));
        ctx.save(); trace(ctx); ctx.lineTo(rx1, rlow); ctx.lineTo(rx0, rlow); ctx.closePath(); ctx.clip();
        ctx.fillStyle = ramp(.24); ctx.fillRect(rx0 - 2, rtop - 2, rspan + 4, rlow - rtop + 4);
        var rfade = ctx.createLinearGradient(0, rtop, 0, rlow); rfade.addColorStop(0, 'rgba(11,14,17,0)'); rfade.addColorStop(1, 'rgba(11,14,17,1)');
        ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = rfade; ctx.fillRect(rx0 - 2, rtop - 2, rspan + 4, rlow - rtop + 4);
        ctx.restore();
        trace(ctx); ctx.strokeStyle = ramp(1); ctx.lineWidth = 3; ctx.stroke();
      } else { ctx.strokeStyle = acc || '#8fdcff'; ctx.lineWidth = acc ? 3 : 2; ctx.stroke(); }
      ctx.restore();
    }
    // The sky's characters fill down to this curve: move their border too.
    scape.line = line && line.length > 1 ? line : null;
    skyRegion();
    if (M3) { m3Beads(ctx, pts, card.style.getPropertyValue('--mb-acc').trim(), m.selected); m3Days(ctx, pts, geo); m3Energy(ctx, pts, geo, card, plot); }
    else pts.forEach(function (p) {
      var sel = p.row.day === m.selected;
      if (!p.row.mood && MB && scape.line) {   // B: a day without a rating is a quiet grey dot on the line
        var gy = curveYAt(scape.line, p.x);
        if (gy != null) { ctx.fillStyle = '#c3cad6'; ctx.beginPath(); ctx.arc(p.x, gy, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#0c0d11'; ctx.lineWidth = 1.5; ctx.stroke(); }
      }
      if (!p.row.mood) return;
      var r = dotR(p.row);
      ctx.fillStyle = moodFor(p.row.mood.score).color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0c0d11'; ctx.lineWidth = 1.5; ctx.stroke();
      if (sel) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2); ctx.stroke(); }
    });
    if (!M3) drawCoffee(ctx, pts, geo, scape.line);
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
      // the day's own emoji, else the face of the team's rating, so each rated point says what it was
      var emoji = p.own ? p.own.emoji : p.row.mood ? FACES[moodFor(p.row.mood.score).key][0] : '';
      // M3: a day nobody rated says so too, as a grey bean says no coffee: a plain face, grey and faint (the user)
      if (!emoji && M3) { html += '<i class="rg-scape-own is-none" style="left:' + p.x.toFixed(1) + 'px;top:' + (p.y + 20).toFixed(1) + 'px">😐</i>'; return; }
      if (!emoji) return;
      var below = M3 ? 11 : p.row.mood ? dotR(p.row) : 2;   // right under its point (M3: under its bean)
      html += '<i class="rg-scape-own" style="left:' + p.x.toFixed(1) + 'px;top:' + (p.y + below + (M3 ? 9 : MB ? 11.5 : 9)).toFixed(1) + 'px">' + esc(emoji) + '</i>';
    });
    marks.innerHTML = html;
  }
  /* Days nobody rated run between the rated days around them instead of a flat
     "ok", with a small swell where the team logged more coffee than its usual for
     the fortnight: movement only, no verdict (coffee never moves a rated day).
     Uses the coffee already stored for the cups; nothing extra is fetched. */
  function curveLevels(rows) {
    var cups = coffeeByDay(rows.map(function (r) { return r.day; }));
    var vals = Object.keys(cups).map(function (d) { return cups[d]; }).sort(function (a, b) { return a - b; });
    var usual = vals.length ? vals[vals.length >> 1] : 0;
    return rows.map(function (r, i) {
      if (r.mood) return r.mood.score;
      var prev = null, next = null, j;
      for (j = i - 1; j >= 0 && !prev; j--) if (rows[j].mood) prev = j;
      for (j = i + 1; j < rows.length && next === null; j++) if (rows[j].mood) next = j;
      var base = prev !== null && next !== null
        ? rows[prev].mood.score + (rows[next].mood.score - rows[prev].mood.score) * (i - prev) / (next - prev)
        : prev !== null ? rows[prev].mood.score : next !== null ? rows[next].mood.score : 3;
      var swell = cups[r.day] && usual ? Math.max(-.75, Math.min(.75, (cups[r.day] - usual) / Math.max(2, usual) * .9)) : 0;   // up to ~10 px: visible, still below a vote
      return Math.max(1, Math.min(5, base + swell));
    });
  }
  /* Each day's coffee under the curve: the app's own cup and the team's
     number of cups for that day, nothing more. From the same coffee store as
     the calendar (minkaCoffeeCountsV1); a day without coffee shows nothing. */
  var CUP = null;
  function coffeeByDay(days) {
    var store = readJson('minkaCoffeeCountsV1'), out = {};
    days.forEach(function (day) {
      var key = day.slice(8) + '.' + day.slice(5, 7) + '.' + day.slice(0, 4), counts = store[key];
      if (!counts) return;
      var cups = 0;
      Object.keys(counts).forEach(function (name) { cups += Math.max(0, Number(counts[name]) || 0); });
      if (cups) out[day] = cups;
    });
    return out;
  }
  // The curve's height at x (the drawn polyline); null without a curve.
  function curveYAt(line, x) {
    if (!line || line.length < 2 || x < line[0][0] || x > line[line.length - 1][0]) return null;
    for (var i = 1; i < line.length; i++) {
      if (line[i][0] >= x) {
        var a = line[i - 1], b = line[i], t = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return null;
  }
  // On the curve itself: over each day's point the cup, and the number over
  // the cup (stacked, narrow enough for the 14 days), with a dark rim so they read on
  // the bright characters too. A day without a vote sits where the curve
  // passes its date.
  // a rated day's dot: larger with more votes (B: larger altogether, read from across the room)
  function dotR(row) { return M3 ? 8.4 : row.mood ? (MB ? 4.6 : 3.2) + Math.min(MB ? 2.4 : 4, row.mood.total / 3) : (MB ? 3.4 : 1); }
  /* M3: every day is a bead on the ribbon and the day's coffees are the number in it (no cup or bean over the
     line, no outlined text: the user). A rated day's bead is the accent's cream with dark ink, an unrated one the
     container tone; a day without coffee is a small bead. All tones from the fatigue's accent, as the card's. */
  function m3Mix(a, b, t) {
    var p = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }, A = p(a), B = p(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v * t + B[i] * (1 - t)); }).join(',') + ')';
  }
  /* M3: the days in one row (no rating ribbon any more: the user kept only the team's line): each a coffee bean,
     the sweets game's (mood-gallery-pc.js swBean), brown with the day's cups on it, grey without a number where no
     coffee was logged; the day's face under it (the rating), its date at the foot (m3Days). */
  function m3Beads(ctx, pts, acc, selected) {
    if (!/^#[0-9a-f]{6}$/i.test(acc)) acc = '#f7a43a';
    var cups = coffeeByDay(pts.map(function (p) { return p.row.day; }));
    var cream = m3Mix(acc, '#fff6e6', .3), ink = m3Mix(acc, '#0c0a08', .16), tone = '#3a434d';   // an unrated day: a neutral grey (the accent mixed into dark came out brown: the user)
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    pts.forEach(function (p) {
      var n = cups[p.row.day] || 0, y = p.y;
      p.beadY = y; p.beanH = 11;
      // every day a bean (the user): brown with the day's cups on it, or grey without a number where no coffee was logged
      ctx.save(); ctx.translate(p.x, y); ctx.rotate(-0.5);
      var lit = ctx.createRadialGradient(-3.5, -5, 1, 0, 0, 14);
      if (n) { lit.addColorStop(0, '#c58a52'); lit.addColorStop(.5, '#7a4a22'); lit.addColorStop(1, '#3d220f'); }
      else { lit.addColorStop(0, '#5d6168'); lit.addColorStop(.5, '#3a3e44'); lit.addColorStop(1, '#25282d'); }
      ctx.fillStyle = lit; ctx.beginPath(); ctx.ellipse(0, 0, 8.2, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = n ? '#2a160a' : '#16181c'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      if (n) {   // the crease at its two ends only: the number stands clear in the middle
        ctx.beginPath(); ctx.moveTo(.4, -8.9); ctx.quadraticCurveTo(-2.2, -7, -.6, -5.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-.4, 8.9); ctx.quadraticCurveTo(2.2, 7, .6, 5.4); ctx.stroke();
      } else { ctx.beginPath(); ctx.moveTo(.4, -8.9); ctx.bezierCurveTo(-3.1, -3.1, 3.5, 2.6, -.4, 8.9); ctx.stroke(); }
      ctx.fillStyle = n ? 'rgba(255,230,200,.45)' : 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(-3.4, -4.9, 1.7, 3, .3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (!n) return;
      ctx.font = "800 " + (n > 9 ? 10 : 11.5) + "px 'Geist Sans', Inter, system-ui, sans-serif";
      ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(30,16,6,.9)'; ctx.strokeText(String(n), p.x, y + .6);
      ctx.fillStyle = '#ffffff'; ctx.fillText(String(n), p.x, y + .6);
    });
    ctx.restore();
  }
  /* M3: under the ribbon the days' dates, the weekday's letter over each (lv, as the day strip: P O T C P S S),
     subtle; Saturdays, Sundays and the days off by law (js/lv-holidays.js) in red. */
  function m3Days(ctx, pts, geo) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    pts.forEach(function (p) {
      var day = p.row.day, d = new Date(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10), 12), dow = d.getDay();
      var dmy = day.slice(8) + '.' + day.slice(5, 7) + '.' + day.slice(0, 4), h = window.MinkaLvHolidays && window.MinkaLvHolidays.get ? window.MinkaLvHolidays.get(dmy) : null;
      var red = dow === 0 || dow === 6 || !!(h && h.free);
      ctx.font = "600 8px 'Geist Sans', Inter, system-ui, sans-serif";
      ctx.fillStyle = red ? 'rgba(255,122,122,.78)' : 'rgba(214,222,230,.46)';
      ctx.fillText(d.toLocaleDateString('lv', { weekday: 'narrow' }).toUpperCase(), p.x, geo.H - 13);
      ctx.font = "700 9.5px 'Geist Sans', Inter, system-ui, sans-serif";
      ctx.fillStyle = red ? 'rgba(255,122,122,.95)' : 'rgba(226,232,238,.72)';
      ctx.fillText(String(+day.slice(8)), p.x, geo.H - 2.5);
    });
    ctx.restore();
  }
  /* M3: the team's day, a thin line over the ribbon: the same number as the statistics' team chart (daybook-stats.js
     teamFatigue), the hours everyone together spent awake in the high zone (fatigue above Vidējs, fatigue.js
     FATIGUE_LEVELS), the radiographers of the month (MinkaLevels.fatigueNames), from the fatigue model's hourly
     month (monthSeries). (A mean of the people on duty came out as a straight line, the user: a team mean sits
     flat, the statistics say so too.) With energy shown (js/page/mk-outline.js) the line is high on light days
     and low on heavy ones; with fatigue shown the other way round. Its colours are the levels' own, from the
     fortnight's lightest day (green) to its heaviest (red). Worked out a slice
     at a time when the page is idle (as the statistics warm a month), then kept. Full-moon days wear a small moon. */
  var team = { key: '', val: null, busy: 0 };
  var MONTH_LV = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
  function energyOn() { return !window.MkOutline || !window.MkOutline.energyView || window.MkOutline.energyView(); }
  function teamFatigue(days) {
    var F = window.__fatigue, L = window.MinkaLevels;
    if (!F || !F.monthSeries || !F.FATIGUE_LEVELS || !L || !L.fatigueNames || !days.length) return null;
    var key = days.join(',') + '|' + new Date().toDateString() + '|' + (new Date().getHours() >= 8);
    if (team.key === key) return team.val;
    if (team.busy) return null;
    team.busy = 1;
    // the months the fortnight touches, and everyone of each
    var jobs = [], months = {};
    days.forEach(function (day) {
      var mk = day.slice(0, 7);
      if (months[mk]) return;
      var meta = null;
      try { meta = L.fatigueNames(MONTH_LV[+day.slice(5, 7) - 1] + ' ' + day.slice(0, 4)); } catch (_) {}
      months[mk] = { names: meta && meta.names ? meta.names : [], y: +day.slice(0, 4), mm: +day.slice(5, 7), series: {} };
      months[mk].names.forEach(function (name) { jobs.push([mk, name]); });
    });
    var idle = typeof requestIdleCallback === 'function' ? function (fn) { requestIdleCallback(fn, { timeout: 2500 }); } : function (fn) { setTimeout(fn, 60); };
    var high = F.FATIGUE_LEVELS[1].max, crit = F.FATIGUE_LEVELS[2].max;
    (function step() {
      var until = performance.now() + 12;
      while (jobs.length && performance.now() < until) { var j = jobs.shift(), mo = months[j[0]]; try { mo.series[j[1]] = F.monthSeries(j[1], mo.y, mo.mm, 1); } catch (_) {} }
      if (jobs.length) { idle(step); return; }
      var out = {};
      days.forEach(function (day) {
        var mo = months[day.slice(0, 7)], dd = +day.slice(8, 10), h = 0, c = 0, any = false;
        Object.keys(mo.series).forEach(function (name) {
          var se = mo.series[name];
          if (!se) return;
          var per = 24 / se.stepHours, from = (dd - 1) * per;
          for (var i = from; i < from + per && i < se.samples.length; i++) {
            var v = se.samples[i];
            if (!v) continue;
            any = true;
            if (v.asleep || v.score <= high) continue;
            if (v.score > crit) c += se.stepHours; else h += se.stepHours;
          }
        });
        if (any) out[day] = { hours: h + c, crit: c };
      });
      team.key = key; team.val = out; team.busy = 0;
      scape.sig = ''; paint();
    })();
    return null;
  }
  function fullMoon(day) {
    var t = new Date(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10), 12).getTime();
    var phase = (((t - Date.UTC(2000, 0, 6, 18, 14)) / 86400000 / 29.5305882) % 1 + 1) % 1;
    return Math.abs(phase - .5) * 29.5305882 < .5;
  }
  function m3Energy(ctx, pts, geo, card, plot) {
    var fat = teamFatigue(pts.map(function (p) { return p.row.day; }));
    if (!fat) return;
    var en = energyOn(), F = window.__fatigue;
    // its band: under the glass and the colleagues' discs, over the beans
    var P = plot.getBoundingClientRect(), top = geo.faceY + geo.faceR + 7;
    [].forEach.call(card.querySelectorAll('.rg-mood-person'), function (e) { var q = e.getBoundingClientRect(); if (q.height) top = Math.max(top, q.bottom - P.top + 7); });
    var bottom = geo.chartTop - 4;
    var beansTop = bottom;
    pts.forEach(function (p) { if (p.beadY != null) beansTop = Math.min(beansTop, p.beadY - (p.beanH || 4)); });
    bottom = Math.min(bottom, beansTop - 15);   // room under the line for its ribbon (14 px), clear of the beans
    if (bottom - top < 14) top = bottom - 14;
    // the fortnight's lightest day at one edge of the band, its heaviest at the other (the user: it has to show the
    // days as the statistics do; from zero the line hardly moved), never closer than 12 h apart (a calm fortnight
    // stays calm); energy: the heavy days low
    var least = Infinity, most = 0;
    pts.forEach(function (p) { var d = fat[p.row.day]; if (d) { least = Math.min(least, d.hours); most = Math.max(most, d.hours); } });
    if (most - least < 12) { var mid = (most + least) / 2; least = Math.max(0, mid - 6); most = least + 12; }
    // its colours: the fatigue levels' own (fatigue.js), from the fortnight's lightest day (green) to its heaviest
    // (red), so the line says at a glance which days were good and which hard (one level's colour for every day
    // that had some hours in the high zone made it one orange line: the user)
    var line = pts.filter(function (p) { return fat[p.row.day] != null; }).map(function (p) {
      var d = fat[p.row.day], share = Math.max(0, Math.min(1, (d.hours - least) / (most - least))), v = en ? 1 - share : share;
      return { x: p.x, y: bottom - v * (bottom - top), c: F.getPresentation(Math.round(12 + share * 76)).color, moon: fullMoon(p.row.day) };
    });
    if (!line.length) return;
    /* Drawn as a wearable's curve (the user's brief): one smooth spline through the days (the ribbon's own monotone
       curve, so it never overshoots a day), a narrow ribbon right under it that fades out within 14 px, the
       crisp line in the levels' colours over it, and a small warm-white dot on today. No per-day dots, no glow,
       no blur, no fill behind the beans; drawn once per change. */
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var x0 = line[0].x, x1 = line[line.length - 1].x, span = Math.max(1, x1 - x0);
    // the colours along the curve, each day its own, blending into the next; one opacity for every day (each
    // value as readable as the others: a fade along the fortnight hid the past, the user)
    var hue = function (alpha) {
      var g = ctx.createLinearGradient(x0, 0, x1, 0);
      line.forEach(function (q) { var t = Math.max(0, Math.min(1, (q.x - x0) / span)); g.addColorStop(t, alpha < 1 ? 'color-mix(in srgb, ' + q.c + ' ' + Math.round(alpha * 100) + '%, transparent)' : q.c); });
      return g;
    };
    var curve = line.length > 1 ? monotone(line.map(function (q) { return [q.x, q.y]; }), 10) : null;
    if (curve) {
      var trace = function () { ctx.beginPath(); curve.forEach(function (c, i) { if (i) ctx.lineTo(c[0], c[1]); else ctx.moveTo(c[0], c[1]); }); };
      // the ribbon under it: the same curve again, one pixel lower each time, fading out over 14 px (geometry,
      // no blur): it follows the line's own bends and never reaches the beans
      var depth = 14;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, geo.W, beansTop - 1); ctx.clip();
      for (var k = 1; k <= depth; k++) {
        ctx.save(); ctx.translate(0, k);
        trace(); ctx.strokeStyle = hue(.2 * Math.pow(1 - k / (depth + 1), 1.6)); ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      // the line itself: crisp, 2.2 px, every day in full
      trace(); ctx.strokeStyle = hue(1); ctx.lineWidth = 2.2; ctx.stroke();
    }
    var at = function (x) { if (!curve) return line[0].y; for (var i = 1; i < curve.length; i++) if (curve[i][0] >= x) { var a = curve[i - 1], b = curve[i], t = b[0] > a[0] ? (x - a[0]) / (b[0] - a[0]) : 0; return a[1] + (b[1] - a[1]) * t; } return curve[curve.length - 1][1]; };
    line.forEach(function (q) {
      if (!q.moon) return;   // a full moon: a small pale disc on the curve
      var y = at(q.x);
      ctx.fillStyle = '#f1ead2'; ctx.beginPath(); ctx.arc(q.x, y, 4.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0c0d11'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    // today: a small crisp warm-white dot on the line
    var last = line[line.length - 1], ly = at(last.x);
    if (!last.moon) { ctx.fillStyle = '#fff6e6'; ctx.beginPath(); ctx.arc(last.x, ly, 3.2, 0, Math.PI * 2); ctx.fill(); }
    // what the line is, at its start: a bolt for energy, a crescent for fatigue, in its first day's colour
    var a = line[0], k = .42;
    ctx.translate(a.x - 13, a.y); ctx.scale(k, k); ctx.translate(-12, -12);
    ctx.fillStyle = a.c; ctx.strokeStyle = a.c; ctx.lineWidth = 2.2 / k;
    if (en) ctx.fill(new Path2D('M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z'));
    else { ctx.fill(new Path2D('M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2Z')); }
    ctx.restore();
  }
  function drawCoffee(ctx, pts, geo, line) {
    var cups = coffeeByDay(pts.map(function (p) { return p.row.day; }));
    if (!Object.keys(cups).length || typeof Path2D !== 'function') return;
    // the cup of the shift's coffee pill (mood-feedback.js moodPillCupSvg), 20 px box
    CUP = CUP || {
      body: new Path2D('M2.6 5.6h11v7.6a3.6 3.6 0 0 1-3.6 3.6H6.2a3.6 3.6 0 0 1-3.6-3.6V5.6Z'),
      handle: new Path2D('M14.2 7.6h1.1a2.6 2.6 0 0 1 0 5.2h-1.1')
    };
    var k = (MB ? 12.5 : 9) / 20;   // B: the cup and its number a third bigger
    ctx.save();
    ctx.font = MB ? "800 13.5px 'Geist Sans', Inter, system-ui, sans-serif" : '800 9.5px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    pts.forEach(function (p) {
      var n = cups[p.row.day];
      if (!n) return;
      var y = p.row.mood ? p.y : curveYAt(line, p.x), r = dotR(p.row);
      if (y == null) y = p.y;
      // where the curve climbs steeply past its day, sit over the higher side
      // of it, so the line never runs through the cup or the number
      [-6, 6].forEach(function (dx) { var side = curveYAt(line, p.x + dx); if (side != null && side - 2 < y - r) { y = side - 2; r = 0; } });
      var cupTop = y - r - 3 - 16.8 * k;                     // the cup just over the point (its body ends 3 px above)
      ctx.save();
      if (M3) {   // a bean: a leaning oval with its crease (the user: a bean now and then; the cup stays in the shift's chip)
        ctx.translate(p.x, cupTop + 11.2 * k);
        ctx.rotate(-0.5);
        ctx.fillStyle = '#f5c46b';
        ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 5.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(40,22,4,.85)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0.6, -4.1); ctx.bezierCurveTo(-2.2, -1.4, 2.2, 1.4, -0.6, 4.1); ctx.stroke();
      } else {
      ctx.translate(p.x - 9.6 * k, cupTop);
      ctx.scale(k, k);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(4,7,14,.9)';
      ctx.stroke(CUP.body); ctx.stroke(CUP.handle);
      ctx.fillStyle = ctx.strokeStyle = '#f5c46b';
      ctx.fill(CUP.body);
      ctx.lineWidth = 1.9;
      ctx.stroke(CUP.handle);
      }
      ctx.restore();
      var base = cupTop + 5.6 * k - 2;                       // the number over the cup
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(4,7,14,.9)';
      ctx.strokeText(String(n), p.x, base);
      ctx.fillStyle = '#f5c46b';
      ctx.fillText(String(n), p.x, base);
    });
    ctx.restore();
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
        skyRun(!scape.hold && !scape.covered && !document.hidden);
      }).observe(plot);
    }
    if (typeof ResizeObserver === 'function') {
      scape.ro = new ResizeObserver(function () {
        var first = !plot.__mxSize;
        plot.__mxSize = { W: plot.clientWidth, H: plot.clientHeight };   // layout is fresh here: no forced layout
        clearTimeout(scape.roT);
        // the first size paints at once (the scape waited for it); later resizes settle first
        if (first) { if (plot.isConnected) paint(plot.closest('.rg-feedback-card')); return; }
        scape.roT = setTimeout(function () { if (plot.isConnected) paint(plot.closest('.rg-feedback-card')); }, 100);
      });
      scape.ro.observe(plot);
    }
  }
  function paintScape(card, trend, m) {
    var plot = trend.querySelector('.rg-trend-plot');
    if (!plot) return;
    // Not measured yet: let the ResizeObserver report the size (it paints then) instead of forcing it now.
    if (!plot.__mxSize && typeof ResizeObserver === 'function') { wireScape(plot); return; }
    var geo = scapeGeo(card, plot);
    if (!geo) return;
    if (scape.plot !== plot) { scape.plot = plot; scape.sig = ''; wireScape(plot); }
    var owns = readJson(OWN_KEY);
    var sig = m.selected + '|' + m.live + '|' + [geo.W, geo.H, geo.faceY, geo.faceR, window.devicePixelRatio || 1].join(',')
      + '|' + m.rows.map(function (r) { return owns[r.day] && owns[r.day].emoji || ''; }).join(',')
      + '|' + m.rows.map(function (r) { return r.mood ? r.mood.score.toFixed(3) + ':' + r.mood.total : '-'; }).join(',')
      + '|' + JSON.stringify(coffeeByDay(m.rows.map(function (r) { return r.day; })))
      + (MB ? '|' + card.style.getPropertyValue('--mb-acc') : '')   // the curve's colour follows the fatigue
      + (M3 ? '|' + (energyOn() ? 'e' : 'f') + '|' + team.key + '|' + JSON.stringify(team.val) + '|' + card.querySelectorAll('.rg-mood-person').length : '');   // the team's line, and what it shows
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
    var y = mood && mood.mood && scape.geo ? scapeY(scape.geo, mood.mood.score) - (p.lift || 0) : p.y;
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
    if (!base || navigator.onLine === false || document.hidden || Date.now() < fetchRetryAt) return;
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
            // Keep the bookkeeping bounded to the visible window and a margin: never a day being
            // shown (a date browsed months back), else it is forgotten as soon as it loads and asked
            // for again at once, thousands of times a second.
            var oldest = todo.reduce(function (a, b) { return b < a ? b : a; }, addDays(liveDay(), -60));
            Object.keys(fetched).forEach(function (k) { if (k < oldest) delete fetched[k]; });
            writeJson(FETCHED_KEY, fetched);
            changed = true;
          } catch (_e) { fetchRetryAt = Date.now() + 5 * 60000; }
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
  // Coffee logged here or in the shell: the bars follow (only a changed
  // total redraws, see the signature in paintScape).
  var coffeeRepaint = 0;
  function repaintSoon() { clearTimeout(coffeeRepaint); coffeeRepaint = setTimeout(function () { paint(); }, 950); }   // a saved coffee's icon lands on the curve at ~0.9 s (calendar.js flyCoffeeToCurve)
  document.addEventListener('minka:coffee-changed', repaintSoon);
  // the switch over the team's number (energy or fatigue) turns the curve's line too; a fatigue model that changed redraws it
  window.addEventListener('mk-energy-view', function () { scape.sig = ''; paint(); });
  document.addEventListener('minka:fatigue-updated', function () { team.key = ''; repaintSoon(); });
  window.addEventListener('storage', function (event) { if (event.key === 'minkaCoffeeCountsV1') repaintSoon(); });
  // A centre (card-layout.js) stands over the mood card: nobody sees the sky, so it rests
  document.addEventListener('mk-mood-covered', function (e) { scape.covered = !!e.detail; skyRun(!document.hidden && !scape.hold && !scape.covered); });
  document.addEventListener('visibilitychange', function () {
    skyRun(!document.hidden && !scape.hold && !scape.covered);
    if (!document.hidden) paint();
  });

  // Noskaņa X: where a day sits on the curve, in the plot's own px (the
  // comments that rise above their day, mood-feedback.js). Rated days and the
  // selected day only: the others have no point to point at.
  function dayPoint(day) {
    if (!MX || !scape.pts || !scape.m) return null;
    var p = scape.pts.find(function (q) { return q.row.day === day; });
    if (!p || (!p.row.mood && day !== scape.m.selected)) return null;
    return { x: p.x, y: p.y, r: p.row.mood ? 3.2 + Math.min(4, p.row.mood.total / 3) : 1 };
  }
  window.MinkaMoodTrend = {
    paint: paint,
    point: dayPoint,
    days: function () { return (scape.m || model()).rows.map(function (r) { return r.day; }); },
    ping: function (day) { var p = dayPoint(day); if (p) scapePing(p); }
  };
  paint();
})();
