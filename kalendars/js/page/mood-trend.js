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
    var to = slotPoint(svg, m);
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
      var dot = svg.querySelector('.rg-trend-dot.is-selected');
      if (dot && typeof dot.animate === 'function') {
        dot.animate([{ transform: 'scale(.2)' }, { transform: 'scale(1)' }], MOTION.spatialFast);
      }
    };
    anim.oncancel = done;
    return true;
  }

  function paint(card) {
    card = card || document.querySelector('.rg-feedback-card');
    if (!card) return;
    var trend = card.querySelector('[data-rg-trend]');
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
  document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });

  window.MinkaMoodTrend = { paint: paint };
  paint();
})();
