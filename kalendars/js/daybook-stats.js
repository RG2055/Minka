/* Team daybook statistics inside #stats-modal.
   One synchronous render per user action, plain SVG, no chart library and no
   timers. Mood is the anonymous reaction data the mood card already collects,
   so it is shown as a team picture (Daylio-style chart + month in pixels) and
   never attributed to a person. Days nobody marked stay blank, not zero. */
(function () {
  'use strict';
  var M = window.MinkaDaybookModel;
  var D = window.MinkaDaybook;
  var esc = D.esc;

  var MONTHS = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
  var WEEKDAYS = ['Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena', 'Svētdiena'];
  var WEEKDAY_SHORT = ['P', 'O', 'T', 'C', 'P', 'S', 'Sv'];
  // /rad: the left group ("rg" in the data) are the residents; no Bolus or
  // night plan there.
  var IS_RAD = window.MINKA_APP === 'rad';
  var GROUP = { rg: { label: IS_RAD ? 'Rezidenti' : 'Radiogrāferi', accent: IS_RAD ? '#4dd0c8' : '#1fe091' }, rd: { label: 'Radiologi', accent: '#3f9bff' } };
  var SHIFT = { day: { label: 'Diena', color: '#3f9bff' }, night: { label: 'Nakts', color: '#23cdcf' }, '24h': { label: '24h', color: '#f5b73f' } };
  var TABS = [['overview', 'Pārskats'], ['bolus', 'Boluss'], ['radio', 'Radio'], ['coffee', 'Kafija'], ['night', 'Nakts'], ['fatigue', 'Nogurums']]
    .filter(function (t) { return !IS_RAD || (t[0] !== 'bolus' && t[0] !== 'night'); });
  // Long lists show this many rows, the rest behind "Rādīt visus".
  var CAP = 8;
  var NIGHT_STATS_KEY = 'minkaNightStatsV1';
  var NIGHT_STATS_TTL = 12 * 3600 * 1000;
  var BEDS = [['main_left_top', 'Galvenā', 'augšā'], ['main_right_top', 'Galvenā', 'pa labi'], ['main_left_bottom', 'Galvenā', 'apakšā'], ['nmp_center', 'Jaunais NMP', '']];
  var mkKey = (window.__mkKey || function (k) { return k; });            // /rad: own mood storage
  var PULSE_KEY = mkKey('minkaShiftPulseV2');
  var PENDING_KEY = mkKey('minkaShiftPulsePendingV2');
  var COFFEE_KEY = 'minkaCoffeeCountsV1';
  var COFFEE_DETAILS_KEY = 'minkaCoffeeDetailsV1';
  var COFFEE_SOURCES = [['philips', 'Philips'], ['lofbergs', 'Löfbergs'], ['narvesen', 'Narvesen'], ['monster', 'Monster'], ['monsterultra', 'Monster Ultra'], ['redbull', 'Red Bull'], ['brite', 'Brite'], ['cupcoffee', 'Cita kafija'], ['mycoffee', 'Mana kafija']];

  var state = { month: '', group: 'all', tab: 'overview', person: '', day: '' };
  // Shared radio history from the feedback API, per month: { 'YYYY-MM': { at, days: [...] } }.
  var remoteRadio = {};
  var radioJob = null;
  // day -> timestamp of the last successful ratings fetch (this session only).
  var ratingsFetchedAt = {};
  // Failed days wait for an explicit retry, reopening, or restored connectivity.
  var ratingsFailed = {};
  var ratingsJob = null;
  var coffee = { busy: false, loaded: {}, failed: {} };
  // A day's own mood (any Fluent emoji + a few words), written from the mood
  // card as a message with an [[rgmood;…]] marker. day -> { emoji, note, at }.
  var OWN_MOOD_KEY = mkKey('minkaRgOwnMoodV1');
  function ownMood(day) {
    var all = readJson(OWN_MOOD_KEY);
    return all && all[day] && all[day].emoji ? all[day] : null;
  }
  function parseOwnMood(item) {
    var match = String(item && item.text || '').match(/^\[\[rgmood;emoji=([^\]]*)\]\]/);
    if (!match) return null;
    var emoji = '';
    try { emoji = decodeURIComponent(match[1] || ''); } catch (_e) { return null; }
    if (!emoji) return null;
    return { emoji: emoji, note: String(item.text).slice(match[0].length).trim().slice(0, 24), at: Number(item.createdAt) || 0 };
  }

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_e) { return {}; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) {}
  }
  function fmt(n, digits) {
    return new Intl.NumberFormat('lv-LV', { maximumFractionDigits: digits == null ? 1 : digits }).format(n);
  }
  function shortDay(day) { return day.slice(8) + '.' + day.slice(5, 7) + '.'; }
  function longDay(day) {
    var d = new Date(day + 'T12:00:00Z');
    return WEEKDAYS[(d.getUTCDay() + 6) % 7] + ', ' + Number(day.slice(8)) + '. ' + MONTHS[d.getUTCMonth()].toLowerCase() + ' ' + day.slice(0, 4);
  }
  function monthLabel(month) { return MONTHS[+month.slice(5, 7) - 1] + ' ' + month.slice(0, 4); }
  function shiftMonth(month, delta) {
    var d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 + delta, 1));
    return d.toISOString().slice(0, 7);
  }
  function initials(name) {
    return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(function (p) { return (p[0] || '').toUpperCase(); }).join('') || '?';
  }
  function shortName(name) {
    return String(name || '').split(/\s+/).map(function (p, i) { return i === 0 ? p : p[0] + '.'; }).join(' ');
  }
  function rgba(hex, a) {
    var v = parseInt(hex.slice(1), 16);
    return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
  }
  function modalOpen() {
    var modal = document.getElementById('stats-modal');
    if (!modal) return false;
    // data-state is authoritative (a closing dialog is already closed);
    // hosts without it fall back to visibility.
    if (modal.dataset && modal.dataset.state) return modal.dataset.state === 'open';
    return modal.style.display !== 'none';
  }
  function personEmoji(name) {
    try { return (window.MinkaEmoji && window.MinkaEmoji.get(name)) || ''; } catch (_e) { return ''; }
  }

  /* ── data ─────────────────────────────────────────────────────────────── */
  function shiftsAll() { return M.schedule([window.__grafiksStore, window.__grafiksStoreRad]); }
  function radioAll(range) {
    // This device's own records plus what the API knows, one row per day and station.
    var seen = {}, out = [];
    var add = function (day, name, firstAt) {
      var key = day + '|' + M.norm(name);
      if (!day || !name || seen[key]) return;
      seen[key] = true;
      out.push({ day: day, name: name, firstAt: firstAt || 0 });
    };
    Object.keys(remoteRadio).forEach(function (month) { (remoteRadio[month].days || []).forEach(function (e) { add(e.day, e.station, e.firstAt); }); });
    (D.radio() || []).forEach(function (e) { add(e.day, e.name, e.firstAt); });
    return out;
  }
  function ensureRadio(month) {
    var base = String(window.MINKA_RADIO_API_BASE || window.MINKA_FEEDBACK_API_BASE || '').replace(/\/$/, '');
    if (!base || radioJob) return;
    var cached = remoteRadio[month];
    if (cached && Date.now() - cached.at < 5 * 60000) return;
    var range = M.monthRange(month);
    var got = false;
    radioJob = fetch(base + '/api/radio?from=' + range.from + '&to=' + range.to, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data && data.ok) { remoteRadio[month] = { at: Date.now(), days: data.days || [] }; got = true; } })
      .catch(function () {})
      .then(function () {
        // A failed fetch is remembered too, so a missing endpoint never loops.
        if (!got) remoteRadio[month] = { at: Date.now(), days: (cached && cached.days) || [] };
        radioJob = null;
        if (got && state.month === month && modalOpen()) render();
      });
  }
  function summaryFor(range, person, group) {
    return M.summary({
      shifts: shiftsAll(),
      changes: IS_RAD ? [] : M.bolus(readJson('minkaBolusHistoryV1')),   // the radiographers' Bolus only
      ratings: D.ratings(),
      radio: radioAll(range),
      coffee: readJson(COFFEE_KEY),
      from: range.from, to: range.to,
      person: person || '', group: group || 'all'
    });
  }
  function build() {
    var range = M.monthRange(state.month);
    var s = summaryFor(range, '', state.group);
    return { range: range, s: s, rows: M.dayRows(s, range.from, range.to), today: M.dutyDay() };
  }
  function elapsedDays(rows, today) {
    return rows.filter(function (r) { return r.day <= today; });
  }

  /* Ratings live in localStorage per day; the mood card only loads the selected
     day, so a month view pulls the missing days from the feedback API. */
  function ensureRatings(days) {
    var base = String(window.MINKA_FEEDBACK_API_BASE || '').replace(/\/$/, '');
    if (!base || ratingsJob) return;
    var now = Date.now();
    var todo = days.filter(function (d) { return !ratingsFailed[d] && (!ratingsFetchedAt[d] || now - ratingsFetchedAt[d] > 10 * 60000); });
    if (!todo.length) return;
    var month = state.month, done = 0, index = 0;
    ratingsJob = { total: todo.length, done: 0 };
    function worker() {
      return (async function () {
        while (index < todo.length && modalOpen()) {
          var day = todo[index++];
          try {
            var r = await fetch(base + '/api/feedback?date=' + day + '&kind=comment&limit=100', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
            if (!r.ok) throw new Error();
            var data = await r.json();
            if (!data || data.ok !== true) throw new Error();
            var all = readJson(PULSE_KEY), pending = readJson(PENDING_KEY)[day] || {};
            var counts = all[day] || {};
            M.MOODS.forEach(function (m) {
              counts[m.key] = Math.max(0, Number(data.ratings && data.ratings[m.key]) || 0) + Math.max(0, Number(pending[m.key]) || 0);
            });
            all[day] = counts;
            writeJson(PULSE_KEY, all);
            var newest = null;
            (data.messages || []).forEach(function (item) {
              var own = parseOwnMood(item);
              if (own && (!newest || own.at > newest.at)) newest = own;
            });
            var owns = readJson(OWN_MOOD_KEY) || {};
            if (newest) owns[day] = newest; else delete owns[day];
            writeJson(OWN_MOOD_KEY, owns);
            ratingsFetchedAt[day] = Date.now();
            delete ratingsFailed[day];
          } catch (_e) { ratingsFailed[day] = true; }
          done++;
          ratingsJob.done = done;
          if (done % 6 === 0 && state.month === month && modalOpen()) render();
        }
      })();
    }
    Promise.all([worker(), worker(), worker()]).then(function () {
      ratingsJob = null;
      if (state.month === month && modalOpen()) render();
    });
  }

  async function loadCoffee(days) {
    if (coffee.busy) return;
    var todo = days.filter(function (d) { return d <= M.dutyDay() && !coffee.loaded[d] && !coffee.failed[d]; });
    if (!todo.length) return;
    coffee.busy = true;
    if (state.tab === 'coffee' && !state.day && !state.person) render();
    var base = String(window.MINKA_COFFEE_API_BASE || 'https://minka-coffee-api.gamernr1elite.workers.dev').replace(/\/+$/, '');
    var index = 0;
    function worker() {
      return (async function () {
        while (index < todo.length && modalOpen()) {
          var day = todo[index++];
          var date = day.slice(8) + '.' + day.slice(5, 7) + '.' + day.slice(0, 4);
          try {
            var r = await fetch(base + '/api/coffee?date=' + date, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
            if (!r.ok) throw new Error();
            var value = await r.json();
            if (!value || !value.ok) throw new Error();
            // Same lower-case spelling the calendar writes (MinkaCoffeeStore),
            // otherwise the calendar's next poll adds a second copy of a person.
            var C = window.MinkaCoffeeStore;
            var store = readJson(COFFEE_KEY);
            store[date] = C ? C.counts(value.counts) : (value.counts || {});
            writeJson(COFFEE_KEY, store);
            var details = readJson(COFFEE_DETAILS_KEY);
            details[date] = C ? C.details(value.details) : (value.details || {});
            writeJson(COFFEE_DETAILS_KEY, details);
            coffee.loaded[day] = true;
            delete coffee.failed[day];
          } catch (_e) { coffee.failed[day] = true; }
        }
      })();
    }
    await Promise.all([worker(), worker()]);
    coffee.busy = false;
    if (modalOpen() && todo.length) render();
  }

  /* ── small building blocks ────────────────────────────────────────────── */
  function tile(value, label, sub, color) {
    return '<div class="db-tile"><b style="' + (color ? 'color:' + color : '') + '">' + value + '</b><span>' + label + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
  }
  function section(title, meta, body, accent) {
    return '<section class="db-sec"><div class="db-sechead"><h3>' + title + '</h3><i></i>' + (meta ? '<span class="db-meta">' + meta + '</span>' : '') + '</div>' + body + '</section>';
  }
  function empty(text) { return '<div class="db-empty">' + text + '</div>'; }
  function note(text) { return '<p class="db-note">' + text + '</p>'; }
  function table(headers, rows, limit) {
    if (!rows.length) return empty('Šajā periodā ierakstu nav.');
    return capped('<div class="db-scroll"><table class="db-table"><thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>', rows, '</tbody></table></div>', limit);
  }
  function bars(items, color, limit) {
    // items: [{label, value, sub, color?}] rendered as horizontal bars.
    var max = items.reduce(function (m, e) { return Math.max(m, e.value); }, 0) || 1;
    if (!items.length) return empty('Nav ierakstu.');
    return capped('<div class="db-bars">', items.map(function (e) {
      // Fixed-width fill moved by a transform (stats-m3.css), never `width`,
      // so a value change or the entrance grow is compositor-only.
      return '<div class="db-bar-row"><span class="db-bar-label">' + e.label + '</span><span class="db-bar"><i style="--v:' + (e.value / max).toFixed(3) + ';background:' + (e.color || color || '#1fe091') + '"></i></span><b>' + e.value + '</b>' + (e.sub ? '<small>' + e.sub + '</small>' : '') + '</div>';
    }), '</div>', limit);
  }
  /* A list that shows `limit` items and hides the rest behind one button
     (data-db-more, handled below): the tab keeps a sane height. Items are
     HTML strings; the hidden ones get the db-extra class. */
  function capped(open, items, close, limit) {
    limit = limit || items.length;
    var rest = items.length - limit;
    if (rest <= 0) return open + items.join('') + close;
    return '<div class="db-cap">' + open + items.map(function (html, i) {
      return i < limit ? html : html.replace(/^<(\w+)( class=")?/, function (_m, tag, cls) { return '<' + tag + (cls ? ' class="db-extra ' : ' class="db-extra"'); });
    }).join('') + close + '<button type="button" class="db-more" data-db-more>Rādīt vēl ' + rest + '</button></div>';
  }
  function avatar(name, accent) {
    var em = personEmoji(name);
    return '<span class="db-av" style="--a:' + accent + '">' + (em ? '<span class="db-av-em">' + em + '</span>' : initials(name)) + '</span>';
  }
  function shiftLabel(e) { return e.type === '24h' ? '24h' : SHIFT[e.type].label + ' ' + e.hours + 'h'; }
  function chip(text, color) {
    return '<span class="db-chip" style="color:' + color + ';background:' + rgba(color, 0.12) + ';border-color:' + rgba(color, 0.3) + '">' + text + '</span>';
  }

  /* ── header ───────────────────────────────────────────────────────────── */
  var ICON = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5.5M11 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };
  function tabSelected(key) { return state.tab === key && !state.person && !state.day; }
  function personOptions(names) {
    return '<option value="">Cilvēks…</option>' + names.map(function (n) {
      return '<option value="' + esc(n) + '"' + (state.person === n ? ' selected' : '') + '>' + esc(n) + '</option>';
    }).join('');
  }
  function header(names) {
    return '<div class="db-chrome"><div class="db-top">'
      + '<div class="db-monthnav"><button type="button" class="db-icon-btn" data-db-nav="-1" aria-label="Iepriekšējais mēnesis">' + ICON.prev + '</button><b aria-live="polite" data-db-month>' + monthLabel(state.month) + '</b><button type="button" class="db-icon-btn" data-db-nav="1" aria-label="Nākamais mēnesis">' + ICON.next + '</button></div>'
      + '<div class="db-chips" role="group" aria-label="Kuri cilvēki">' + [['all', 'Visi'], ['rg', GROUP.rg.label], ['rd', GROUP.rd.label]].map(function (g) {
        return '<button type="button" data-db-group="' + g[0] + '" aria-pressed="' + (state.group === g[0]) + '">' + ICON.check + '<span>' + g[1] + '</span></button>';
      }).join('') + '</div>'
      + '<label class="db-personpick"><span class="db-visually-hidden">Cilvēks</span><select data-db-person-select>' + personOptions(names) + '</select></label>'
      + '</div>'
      + '<nav class="db-tabs" role="tablist" aria-label="Sadaļa">' + TABS.map(function (t) {
        var on = tabSelected(t[0]);
        return '<button type="button" role="tab" id="db-tab-' + t[0] + '" aria-controls="db-panel" data-db-tab="' + t[0] + '" aria-selected="' + on + '" aria-pressed="' + on + '" tabindex="' + (on || (!TABS.some(function (x) { return tabSelected(x[0]); }) && t[0] === 'overview') ? 0 : -1) + '">' + t[1] + '</button>';
      }).join('') + '<span class="db-tab-indicator" aria-hidden="true"></span></nav></div>';
  }
  function backBar(title, sub) {
    return '<div class="db-back"><button type="button" class="db-icon-btn" data-db-back aria-label="Atpakaļ" title="Atpakaļ (Esc)">' + ICON.back + '</button><div><h2>' + title + '</h2>' + (sub ? '<span>' + sub + '</span>' : '') + '</div></div>';
  }

  /* ── mood chart ───────────────────────────────────────────────────────── */
  function smoothPath(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0].x.toFixed(1) + ',' + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
    }
    return d;
  }
  function moodChart(rows, today) {
    var W = 720, H = 200, padL = 36, padR = 16, padT = 14, padB = 28;
    var gW = W - padL - padR, gH = H - padT - padB, n = rows.length;
    var x = function (i) { return padL + (n > 1 ? i / (n - 1) * gW : gW / 2); };
    var y = function (score) { return padT + gH - (score - 1) / 4 * gH; };
    var out = '<svg class="db-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Komandas sajūta pa dienām">';
    // Weekend bands + y grid with the reaction faces as axis labels.
    rows.forEach(function (r, i) {
      var wd = (new Date(r.day + 'T12:00:00Z').getUTCDay() + 6) % 7;
      if (wd >= 5) out += '<rect x="' + (x(i) - gW / (n - 1) / 2).toFixed(1) + '" y="' + padT + '" width="' + (gW / (n - 1)).toFixed(1) + '" height="' + gH + '" fill="rgba(125,211,252,.035)"/>';
    });
    M.MOODS.forEach(function (m) {
      out += '<line x1="' + padL + '" y1="' + y(m.score).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(m.score).toFixed(1) + '" stroke="rgba(255,255,255,.06)" stroke-width="1"/>'
        + '<text x="' + (padL - 10) + '" y="' + (y(m.score) + 5).toFixed(1) + '" text-anchor="middle" font-size="13" class="db-chart-face">' + m.emoji + '</text>';
    });
    rows.forEach(function (r, i) {
      var dd = Number(r.day.slice(8));
      if (dd === 1 || dd % 5 === 0) out += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" fill="rgba(255,255,255,.32)" font-size="9" font-family="Inter,system-ui,sans-serif">' + dd + '</text>';
      if (r.day === today) out += '<line x1="' + x(i).toFixed(1) + '" y1="' + padT + '" x2="' + x(i).toFixed(1) + '" y2="' + (padT + gH) + '" stroke="rgba(255,255,255,.2)" stroke-dasharray="3 3"/><text x="' + x(i).toFixed(1) + '" y="' + (padT - 4) + '" text-anchor="middle" fill="rgba(255,255,255,.4)" font-size="8" font-weight="700" letter-spacing=".1em" font-family="Inter,system-ui,sans-serif">ŠODIEN</text>';
    });
    // Consecutive marked days form one smooth segment; a gap is a real gap.
    var segment = [], segments = [];
    rows.forEach(function (r, i) {
      if (r.mood) segment.push({ x: x(i), y: y(r.mood.score), row: r });
      else if (segment.length) { segments.push(segment); segment = []; }
    });
    if (segment.length) segments.push(segment);
    // All marked days are joined into one dashed line, so single days do not
    // stand alone as loose dots.
    var allPoints = [].concat.apply([], segments);
    if (allPoints.length > 1) out += '<path d="' + smoothPath(allPoints) + '" fill="none" stroke="rgba(125,211,252,.45)" stroke-width="1.6" stroke-dasharray="4 5" stroke-linecap="round"/>';
    segments.forEach(function (seg) {
      seg.forEach(function (p) {
        var m = M.moodFor(p.row.mood.score);
        var r = 3.2 + Math.min(4, p.row.mood.total / 3);
        out += '<circle data-db-day="' + p.row.day + '" style="cursor:pointer" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + m.color + '" stroke="#0c0d11" stroke-width="1.5"><title>' + esc(shortDay(p.row.day)) + '&ensp;' + fmt(p.row.mood.score) + ' (' + p.row.mood.total + ' reakcijas)</title></circle>';
      });
    });
    // Own moods: the emoji above that day's point, or on the middle line when
    // the day has no reactions. Its note is the tooltip.
    rows.forEach(function (r, i) {
      var own = ownMood(r.day);
      if (!own) return;
      var cy = r.mood ? y(r.mood.score) - 14 : y(3);
      out += '<text data-db-day="' + r.day + '" style="cursor:pointer" x="' + x(i).toFixed(1) + '" y="' + (cy + 5).toFixed(1) + '" text-anchor="middle" font-size="14" class="db-chart-face db-chart-own">' + esc(own.emoji)
        + '<title>' + esc(shortDay(r.day)) + '&ensp;' + esc(own.emoji) + (own.note ? ' — ' + esc(own.note) : '') + '</title></text>';
    });
    return out + '</svg>';
  }
  function ownMoodList(rows) {
    var items = rows.map(function (r) { return { day: r.day, own: ownMood(r.day) }; })
      .filter(function (e) { return e.own; }).reverse();
    if (!items.length) return '';
    return capped('<div class="db-own"><span class="db-own-title">Savi vērtējumi</span>', items.map(function (e) {
      return '<button type="button" class="db-own-item" data-db-day="' + e.day + '"><span class="db-face">' + esc(e.own.emoji) + '</span>'
        + '<b>' + esc(e.own.note || '—') + '</b><small>' + shortDay(e.day) + '</small></button>';
    }), '</div>', 6);
  }
  function moodCounts(s) {
    var total = s.reactionTotal || 0;
    var items = M.MOODS.slice().reverse().map(function (m) {
      var n = s.reactions.reduce(function (sum, e) { return sum + e.counts[m.key]; }, 0);
      return { label: '<span class="db-face">' + m.emoji + '</span>' + m.label, value: n, color: m.color, sub: total ? Math.round(n / total * 100) + '%' : '' };
    });
    return bars(items);
  }

  function moodChips(s) {
    var total = s.reactionTotal || 0;
    return '<div class="db-moodchips">' + M.MOODS.slice().reverse().map(function (m) {
      var n = s.reactions.reduce(function (sum, e) { return sum + e.counts[m.key]; }, 0);
      return '<span class="db-moodchip' + (n ? '' : ' is-zero') + '" style="--c:' + m.color + '"><span class="db-face">' + m.emoji + '</span><b>' + n + '</b><small>' + m.label + (total ? ' ' + Math.round(n / total * 100) + '%' : '') + '</small></span>';
    }).join('') + '</div>';
  }

  /* ── month in pixels ──────────────────────────────────────────────────── */
  function cellSub(r, mode) {
    if (mode === 'shift') {
      // One person's month: the shift spelled out, same cell height on every day.
      return '<small>' + r.shifts.map(function (e) { return '<span style="color:' + SHIFT[e.type].color + '">' + shiftLabel(e) + '</span>'; }).join(' ') + '</small>';
    }
    // Team view: who is on duty, in words a newcomer can read — a day row and
    // a night row, radiographers in green and radiologists in blue. A 24h
    // shift counts for both rows.
    if (!r.shifts.length) return '';
    var n = { day: { rg: 0, rd: 0 }, night: { rg: 0, rd: 0 } };
    r.shifts.forEach(function (e) {
      if (e.type !== 'night') n.day[e.group]++;
      if (e.type !== 'day') n.night[e.group]++;
    });
    // Rows of one tight grid under the day header: numbers sit right next
    // to their word, under the ☀ / ☾ header cells.
    return '<em class="db-px-rg">' + GROUP.rg.label + '</em><b>' + n.day.rg + '</b><b>' + n.night.rg + '</b>'
      + '<em class="db-px-rd">Radiologi</em><b>' + n.day.rd + '</b><b>' + n.night.rd + '</b>';
  }
  function pixels(rows, today, mode) {
    // mode 'mood' colours by the day's dominant reaction; 'shift' by shift type
    // (used for one person, whose shifts are the only thing we know about them).
    var offset = (new Date(rows[0].day + 'T12:00:00Z').getUTCDay() + 6) % 7;
    var cells = WEEKDAY_SHORT.map(function (w) { return '<span class="db-px-weekday">' + w + '</span>'; }).join('');
    for (var i = 0; i < offset; i++) cells += '<span class="db-px db-px--blank"></span>';
    rows.forEach(function (r) {
      var future = r.day > today, color = '', face = '', kind = 'empty', title = shortDay(r.day);
      if (mode === 'shift') {
        var main = r.shifts[0];
        if (main) { color = SHIFT[main.type].color; kind = 'marked'; title += ' ' + shiftLabel(main); }
      } else if (r.mood) {
        var m = M.moodFor(r.mood.score);
        color = m.color; kind = 'marked'; face = '<span class="db-px-face">' + m.emoji + '</span>';
        title += ' ' + fmt(r.mood.score) + ' (' + r.mood.total + ' reakcijas)';
      } else if (!future && !ownMood(r.day)) title += ' — nav atzīmēts';
      var ownDay = mode !== 'shift' ? ownMood(r.day) : null;
      if (ownDay) {
        // The team's own word for the day wins the cell's face; the colour
        // still comes from the reactions when there are any.
        if (!color) { color = '#94a3b8'; kind = 'marked'; }
        face = '<span class="db-px-face db-px-own">' + esc(ownDay.emoji) + '</span>';
        title += ' · ' + ownDay.emoji + (ownDay.note ? ' ' + ownDay.note : '');
      }
      var staff = mode !== 'shift' && r.shifts.length;
      var head = '<span class="db-px-head"><b>' + Number(r.day.slice(8)) + '</b>' + face + '</span>' + (staff ? '<i title="Dienā">☀</i><i title="Naktī">☾</i>' : '');
      if (staff) title += '. Dienā: ' + r.shifts.filter(function (e) { return e.type !== 'night'; }).length + ', naktī: ' + r.shifts.filter(function (e) { return e.type !== 'day'; }).length + ' dežūrā';
      cells += '<button type="button" class="db-px' + (staff ? ' db-px--staff' : '') + (mode === 'shift' ? ' db-px--shift' : '') + (r.day === today ? ' is-today' : '') + (future ? ' is-future' : '') + '" data-db-day="' + r.day + '" data-kind="' + kind + '" style="--c:' + (color || '#94a3b8') + '" title="' + esc(title) + '">' + head + cellSub(r, mode) + '</button>';
    });
    return '<div class="db-pixels-scroll"><div class="db-pixels">' + cells + '</div></div>';
  }

  /* ── team ─────────────────────────────────────────────────────────────── */
  function typeCounts(shifts) {
    var c = { day: 0, night: 0, '24h': 0 };
    shifts.forEach(function (e) { c[e.type]++; });
    return c;
  }
  function personCard(p, group, shifts) {
    var c = typeCounts(shifts), total = shifts.length || 1;
    // Each shift type is one coloured segment of the bar with its own count
    // inside it, so a number always sits on the colour it belongs to.
    var split = ['day', 'night', '24h'].filter(function (k) { return c[k]; }).map(function (k) {
      var short = k === 'day' ? 'D' : k === 'night' ? 'N' : '24h';
      return '<i style="flex:' + c[k] + ' 1 0;background:' + SHIFT[k].color + '" title="' + SHIFT[k].label + ': ' + c[k] + '"><b>' + c[k] + '</b><span>' + short + '</span></i>';
    }).join('');
    var bolusN = p.ge + p.philips;
    return '<button type="button" class="db-person" data-db-person="' + esc(p.name) + '">' + avatar(p.name, group.accent)
      + '<span class="db-person-main"><b>' + esc(shortName(p.name)) + '</b><small>' + p.shifts + ' maiņas&ensp;' + fmt(p.hours, 0) + ' h' + (bolusN ? '&ensp;' + bolusN + ' boluss' : '') + '</small>'
      + '<span class="db-split">' + (split || '<i style="flex:1;background:#1c1e25"></i>') + '</span></span></button>';
  }
  function team(s) {
    var out = '';
    ['rg', 'rd'].forEach(function (g) {
      if (state.group !== 'all' && state.group !== g) return;
      var people = s.people.filter(function (p) { return s.shifts.some(function (e) { return e.group === g && M.norm(e.name) === M.norm(p.name); }); })
        .sort(function (a, b) { return b.hours - a.hours || a.name.localeCompare(b.name, 'lv'); });
      if (!people.length) return;
      out += section(GROUP[g].label, people.length + ' cilvēki', capped('<div class="db-people">', people.map(function (p) {
        return personCard(p, GROUP[g], s.shifts.filter(function (e) { return e.group === g && M.norm(e.name) === M.norm(p.name); }));
      }), '</div>', CAP), GROUP[g].accent);
    });
    return out || empty('Šim mēnesim grafikā nav maiņu.');
  }

  /* ── views ────────────────────────────────────────────────────────────── */
  function overview(b) {
    var s = b.s, rows = b.rows, past = elapsedDays(rows, b.today);
    var marked = past.filter(function (r) { return r.mood || ownMood(r.day); }).length;
    var weighted = rows.reduce(function (acc, r) { if (r.mood) { acc.sum += r.mood.score * r.mood.total; acc.n += r.mood.total; } return acc; }, { sum: 0, n: 0 });
    var avg = weighted.n ? weighted.sum / weighted.n : null;
    var avgMood = M.moodFor(avg);
    var loading = ratingsJob ? '<span class="db-loading">Ielādē sajūtas ' + ratingsJob.done + '/' + ratingsJob.total + '…</span>' : '';
    var tiles = '<div class="db-tiles db-tiles--2 db-tiles--side">'
      + tile(avg == null ? '—' : '<span class="db-face">' + avgMood.emoji + '</span>' + fmt(avg), 'Vidējā sajūta', avg == null ? 'Nav atzīmēts' : avgMood.label, avgMood ? avgMood.color : '')
      + tile(marked + '<small>/' + past.length + '</small>', 'Atzīmētas dienas', 'no aizvadītajām')
      + tile(s.reactionTotal || '—', 'Reakcijas', 'Mood pogu klikšķi')
      + (IS_RAD ? '' : tile(s.bolus.length || '—', 'Bolusa maiņas', 'GE ' + s.bolus.filter(function (e) { return e.room === 'ge'; }).length + '&ensp;Philips ' + s.bolus.filter(function (e) { return e.room === 'philips'; }).length))
      + '</div>';
    return section('Komandas sajūta', loading || 'Dienas vidējā, lielāks punkts = vairāk reakciju',
        (s.reactionTotal || rows.some(function (r) { return ownMood(r.day); }) ? moodChart(rows, b.today) : empty('Šim mēnesim vēl nav nevienas sajūtas atzīmes.')) + '<div class="db-two"><div>' + moodCounts(s) + ownMoodList(rows) + tiles + '</div>' + pixels(rows, b.today, 'mood') + '</div>' + note('Sejiņa — dienas biežākā reakcija; bez sejiņas — neviens nav atzīmējis. ☀ dienā un ☾ naktī dežūrā: <b class="db-px-rg">' + GROUP.rg.label.toLowerCase() + '</b>, <b class="db-px-rd">radiologi</b>. Spied uz dienas, lai redzētu detaļas.'), '#7dd3fc')
      + team(s);
  }
  function bolusView(b) {
    var s = b.s;
    var perPerson = s.people.filter(function (p) { return p.ge + p.philips; }).sort(function (a, c) { return (c.ge + c.philips) - (a.ge + a.philips); })
      .map(function (p) { return { label: esc(shortName(p.name)), value: p.ge + p.philips, sub: 'GE ' + p.ge + '&ensp;Ph ' + p.philips, color: '#ff5c5c' }; });
    return '<div class="db-tiles db-tiles--3">' + tile(s.bolus.length, 'Bolusa maiņas', 'izvēlētajā mēnesī', '#ff5c5c') + tile(s.bolus.filter(function (e) { return e.room === 'ge'; }).length, 'GE', '', '#0a84ff') + tile(s.bolus.filter(function (e) { return e.room === 'philips'; }).length, 'Philips', '', '#30d158') + '</div>'
      + section('Pēc cilvēka', '', bars(perPerson, null, CAP), '#ff5c5c')
      + section('Visas maiņas', s.bolus.length + ' ieraksti', table(['Dežūras diena', 'Mainīts', 'Iekārta', 'Cilvēks'], s.bolus.map(function (e) {
        return '<tr><td><button type="button" class="db-link" data-db-day="' + e.day + '">' + shortDay(e.day) + '</button></td><td>' + esc(new Date(e.ts).toLocaleString('lv-LV', { timeZone: 'Europe/Riga', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) + '</td><td>' + chip(e.room === 'ge' ? 'GE' : 'Philips', e.room === 'ge' ? '#0a84ff' : '#30d158') + '</td><td>' + esc(e.name) + '</td></tr>';
      }), CAP) + note('Bolusa vēsture no ierīcē sinhronizētajiem ierakstiem. Maiņa pirms 08:00 pieder iepriekšējai dežūras dienai.'), '#ff5c5c');
  }
  function radioView(b) {
    var s = b.s, past = elapsedDays(b.rows, b.today).length || 1;
    var items = s.stations.map(function (e) { return { label: esc(e.name), value: e.count, sub: e.count === 1 ? 'diena' : 'dienas', color: '#38bdf8' }; });
    var withRadio = b.rows.filter(function (r) { return r.radio.length; }).length;
    return '<div class="db-tiles db-tiles--3">' + tile(s.stations.length || '—', 'Stacijas', 'klausītas šomēnes', '#38bdf8') + tile(withRadio || '—', 'Dienas ar radio', 'no ' + past) + tile(s.stations[0] ? esc(s.stations[0].name) : '—', 'Biežākā', s.stations[0] ? s.stations[0].count + (s.stations[0].count === 1 ? ' diena' : ' dienas') : '') + '</div>'
      + section('Mēnesis', withRadio + ' dienas ar radio', radioStrip(b), '#38bdf8')
      + section('Stacijas', s.stations.length > 5 ? 'top 5' : '', bars(items, null, 5) + note('Stacija tiek pierakstīta, kad tā sāk skanēt. Klausīšanās ilgums netiek mērīts.'), '#38bdf8');
  }
  // One cell per day of the month: lit when radio played, the stations in the
  // tooltip, a click opens the day. Fixed height, whatever the month holds.
  function radioStrip(b) {
    return '<div class="db-strip" style="--n:' + b.rows.length + '">' + b.rows.map(function (r) {
      var n = r.radio.length, future = r.day > b.today;
      var title = shortDay(r.day) + (n ? ': ' + r.radio.join(', ') : future ? '' : ' — radio nav');
      return '<button type="button" class="db-strip-day' + (n ? ' is-on' : '') + (future ? ' is-future' : '') + (r.day === b.today ? ' is-today' : '') + '" data-db-day="' + r.day + '" title="' + esc(title) + '" style="--k:' + Math.min(1, n / 3).toFixed(2) + '"><b>' + Number(r.day.slice(8)) + '</b>' + (n ? '<i>' + n + '</i>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function eur(cents) {
    return (Math.max(0, Number(cents) || 0) / 100).toLocaleString('lv-LV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  function sourceChips(sources) {
    var icon = window.__minkaCoffeeIcon;
    var parts = COFFEE_SOURCES.filter(function (d) { return (Number(sources && sources[d[0]]) || 0) > 0; }).map(function (d) {
      var n = Number(sources[d[0]]) || 0;
      return '<span class="db-csrc" title="' + d[1] + '">' + (icon ? icon(d[0]) : '<small>' + d[1] + '</small>') + '<b>' + n + '</b></span>';
    });
    return parts.length ? parts.join('') : '<span class="db-dim">—</span>';
  }
  function coffeeRows(people) {
    // people: [{name, cups, cents, sources}] → one row per person, cups first.
    var list = people.filter(function (p) { return p.cups > 0; }).sort(function (a, c) { return c.cups - a.cups || a.name.localeCompare(c.name, 'lv'); });
    if (!list.length) return empty(coffee.busy ? 'Ielādē…' : 'Nav atzīmētu dzērienu.');
    var groupOf = {};
    shiftsAll().forEach(function (e) { groupOf[M.norm(e.name)] = e.group; });
    return capped('<div class="db-coffee">', list.map(function (p) {
      var g = GROUP[groupOf[M.norm(p.name)] || 'rg'];
      return '<button type="button" class="db-coffee-row" data-db-person="' + esc(p.name) + '">' + avatar(p.name, g.accent)
        + '<span class="db-coffee-name"><b>' + esc(shortName(p.name)) + '</b></span>'
        + '<span class="db-coffee-srcs">' + sourceChips(p.sources) + '</span>'
        + '<span class="db-coffee-cups"><b>' + p.cups + '</b><small>' + (p.cups === 1 ? 'tase' : 'tases') + '</small></span>'
        + '<span class="db-coffee-eur"><b>' + eur(p.cents) + '</b><small>iztērēts</small></span></button>';
    }), '</div>', CAP);
  }
  function coffeeMonth(b) {
    // Only days this device has pulled from the coffee API count here.
    var counts = readJson(COFFEE_KEY), details = readJson(COFFEE_DETAILS_KEY), people = {}, days = 0;
    // The coffee API keys workers by lower-cased name; show the schedule's spelling.
    var byKey = {};
    shiftsAll().forEach(function (e) { byKey[M.norm(e.name)] = e.name; });
    Object.keys(counts).forEach(function (key) {
      var day = M.day(key);
      // Every day of the month counts: a cup logged for tomorrow's shift is
      // still this month's cup (the mood card fills those days from the API).
      if (!day || day < b.range.from || day > b.range.to) return;
      days++;
      var det = details[key] || {};
      Object.keys(counts[key] || {}).forEach(function (name) {
        var p = people[M.norm(name)] || (people[M.norm(name)] = { name: byKey[M.norm(name)] || name, cups: 0, cents: 0, sources: {} });
        p.cups += Math.max(0, Number(counts[key][name]) || 0);
        var d = det[name] || {};
        p.cents += Math.max(0, Number(d.spendCents) || 0);
        Object.keys(d.sources || {}).forEach(function (k) { p.sources[k] = (p.sources[k] || 0) + (Number(d.sources[k]) || 0); });
      });
    });
    return { people: Object.values(people), days: days };
  }
  function coffeeAllTime() {
    var totals = window.__mkCoffeeTotalsApi, details = window.__mkCoffeeDetailsApi || {};
    if (!totals) return null;
    var byKey = {};
    shiftsAll().forEach(function (e) { byKey[M.norm(e.name)] = e.name; });
    return Object.keys(totals).map(function (k) {
      var d = details[k] || {};
      return { name: byKey[k] || k, cups: totals[k], cents: d.spendCents || 0, sources: d.sources || {} };
    });
  }
  function coffeeView(b) {
    var days = b.rows.map(function (r) { return r.day; });
    var month = coffeeMonth(b), all = coffeeAllTime();
    var cups = month.people.reduce(function (n, p) { return n + p.cups; }, 0);
    var cents = month.people.reduce(function (n, p) { return n + p.cents; }, 0);
    var sum = {};
    month.people.forEach(function (p) { Object.keys(p.sources).forEach(function (k) { sum[k] = (sum[k] || 0) + p.sources[k]; }); });
    if (!all && !coffee.totalsRequested) {
      coffee.totalsRequested = true;
      fetch(String(window.MINKA_COFFEE_API_BASE || 'https://minka-coffee-api.gamernr1elite.workers.dev').replace(/\/+$/, '') + '/api/coffee?totals=1', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.ok || !d.totals) return;
          var t = {}, det = {};
          Object.keys(d.totals).forEach(function (k) { t[M.norm(k)] = Math.max(0, Number(d.totals[k]) || 0); });
          Object.keys(d.details || {}).forEach(function (k) { det[M.norm(k)] = d.details[k]; });
          window.__mkCoffeeTotalsApi = t; window.__mkCoffeeDetailsApi = det;
          if (modalOpen() && state.tab === 'coffee') render();
        }).catch(function () {});
    }
    var drinkers = month.people.filter(function (p) { return p.cups > 0; }).length;
    return '<div class="db-tiles db-tiles--3">' + tile(cups || (coffee.busy ? '…' : '—'), 'Tases šomēnes', '', '#f5b73f') + tile(eur(cents), 'Iztērēts šomēnes', '')
      + tile(drinkers || '—', 'Cilvēki', 'šomēnes') + '</div>'
      + (cups ? '<div class="db-coffee-sum">' + sourceChips(sum) + '</div>' : '')
      + section(monthLabel(state.month), coffee.busy ? '<span class="db-loading">Ielādē…</span>' : '', coffeeRows(month.people), '#f5b73f')
      + section('Visu laiku', all ? all.reduce(function (n, p) { return n + p.cups; }, 0) + ' tases' : '', all ? coffeeRows(all) : empty('Ielādē…'), '#f5b73f');
  }
  /* ── night ─────────────────────────────────────────────────────────────
     Who takes which part of the night and which bed: the night panel's
     all-time history (the /api/ns-stats summary it caches), plus this month's
     night shifts from the schedule. */
  var nightJob = null, nightTried = 0;
  function nightStats() {
    var c = readJson(NIGHT_STATS_KEY);
    return c && c.data && c.data.parts && typeof c.data.parts === 'object' ? { data: c.data, at: Number(c.at) || 0 } : null;
  }
  function ensureNight() {
    var have = nightStats();
    if ((have && Date.now() - have.at < NIGHT_STATS_TTL) || nightJob || Date.now() - nightTried < 60000) return;
    var api = null;
    try { if (window.MinkaApi && window.MinkaApi.getToken && window.MinkaApi.getToken()) api = window.MinkaApi; } catch (_e) {}
    try { if (!api && window.parent !== window && window.parent.MinkaApi && window.parent.MinkaApi.getToken()) api = window.parent.MinkaApi; } catch (_e) {}
    if (!api || typeof api.apiFetch !== 'function') return;
    nightTried = Date.now();
    nightJob = Promise.resolve().then(function () { return api.apiFetch('/api/ns-stats'); })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.ok || !data.parts) return;
        writeJson(NIGHT_STATS_KEY, { at: Date.now(), data: data });
        if (modalOpen() && state.tab === 'night' && !state.day && !state.person) render();
      }).catch(function () {}).then(function () { nightJob = null; });
  }
  // Where the bed is: the same little plan as in the night panel, the main
  // room (three beds) and Jaunais NMP (one), this bed lit.
  function bedMap(key) {
    var cell = function (k) { return '<i class="' + (k === key ? 'is-on' : '') + (k ? '' : ' is-none') + '"></i>'; };
    return '<span class="db-bedmap" aria-hidden="true"><span class="db-bm-main">' + cell('main_left_top') + cell('main_right_top') + cell('main_left_bottom') + cell('')
      + '</span><span class="db-bm-nmp">' + cell('nmp_center') + '</span></span>';
  }
  function nightView(b) {
    var got = nightStats(), st = got && got.data;
    var groupOf = {};
    shiftsAll().forEach(function (e) { groupOf[M.norm(e.name)] = e.group; });
    // This month's nights from the schedule (a 24h shift includes the night).
    var nightsBy = {};
    b.s.shifts.forEach(function (e) { if (e.type === 'night' || e.type === '24h') nightsBy[e.name] = (nightsBy[e.name] || 0) + 1; });
    var monthNights = Object.keys(nightsBy).map(function (n) { return { label: esc(shortName(n)), value: nightsBy[n], color: '#23cdcf' }; })
      .sort(function (a, c) { return c.value - a.value || a.label.localeCompare(c.label, 'lv'); });
    var tiles = '<div class="db-tiles db-tiles--3">'
      + tile(monthNights.reduce(function (n, e) { return n + e.value; }, 0) || '—', 'Nakts maiņas', 'šomēnes grafikā', '#23cdcf')
      + tile(st && st.nights ? st.nights : '—', 'Sadalītas naktis', 'visā vēsturē')
      + tile(st ? Object.keys(st.parts).length : '—', 'Cilvēki', 'nakts vēsturē')
      + '</div>';
    var parts = '', beds = '';
    if (st) {
      var people = Object.keys(st.parts).map(function (name) {
        var p = [0, 1, 2, 3].map(function (i) { return Math.max(0, Math.round(Number(st.parts[name] && st.parts[name][i]) || 0)); });
        return { name: name, p: p, total: p[0] + p[1] + p[2] + p[3] };
      }).filter(function (e) { return e.total && (state.group === 'all' || (groupOf[M.norm(e.name)] || 'rg') === state.group); })
        .sort(function (a, c) { return c.total - a.total || a.name.localeCompare(c.name, 'lv'); });
      parts = people.length ? capped('<div class="db-parts">', people.map(function (e) {
        var max = Math.max.apply(null, e.p) || 1, fav = e.p.indexOf(Math.max.apply(null, e.p)) + 1;
        var g = GROUP[groupOf[M.norm(e.name)] || 'rg'];
        return '<div class="db-part-row">' + avatar(e.name, g.accent)
          + '<span class="db-part-name"><b>' + esc(shortName(e.name)) + '</b><small>Parasti ' + fav + '. daļa, ' + e.total + ' naktis</small></span>'
          + '<span class="db-part-bars">' + e.p.map(function (v, i) {
            return '<i class="' + (i + 1 === fav ? 'is-fav' : '') + '" style="--h:' + Math.max(.08, v / max).toFixed(3) + '" title="' + (i + 1) + '. daļa: ' + v + '×"><b>' + v + '</b><em>' + (i + 1) + '.</em></i>';
          }).join('') + '</span></div>';
      }), '</div>', CAP) : empty('Šai grupai nakts sadalījuma vēstures nav.');
      beds = '<div class="db-beds">' + BEDS.map(function (bed) {
        var who = Object.keys(st.beds || {}).map(function (name) { return { name: name, n: Math.max(0, Number(st.beds[name] && st.beds[name][bed[0]]) || 0) }; })
          .filter(function (e) { return e.n; }).sort(function (a, c) { return c.n - a.n; });
        var total = who.reduce(function (n, e) { return n + e.n; }, 0);
        return '<div class="db-bed">' + bedMap(bed[0]) + '<span class="db-bed-name"><b>' + bed[1] + '</b>' + (bed[2] ? '<small>' + bed[2] + '</small>' : '') + '</span><span class="db-bed-total">' + (total || '—') + '<small>' + (total ? ' naktis' : '') + '</small></span>'
          + '<span class="db-bed-who">' + (who.slice(0, 3).map(function (e) { return '<span>' + esc(shortName(e.name)) + '<b>' + e.n + '</b></span>'; }).join('') || '<span class="db-dim">nav datu</span>') + '</span></div>';
      }).join('') + '</div>';
    }
    var loading = !st ? empty(nightJob ? 'Ielādē nakts vēsturi…' : 'Nakts vēsture vēl nav ielādēta — tā parādās pēc nakts sadalījuma atvēršanas.') : '';
    return tiles
      + section('Kurš kuru daļu ņem', 'visā vēsturē', loading || parts, '#23cdcf')
      + (st ? section('Gultas', 'kurš guļ kurās gultās visbiežāk', beds, '#23cdcf') : '')
      + section('Naktis šomēnes', monthLabel(state.month), bars(monthNights, null, CAP), '#23cdcf')
      + note('Daļu un gultu skaits ir no nakts sadalījuma vēstures (visas naktis kopā, ne pa mēnešiem). Nakts maiņas — no grafika.');
  }
  /* Fatigue: the model's team curve for the month plus one row per person
     (their month in a sparkline, mean and peak). Radiographers only, as the
     model is built for them. */
  var FAT_LOW = '#38bdf8', FAT_MID = '#f5b73f', FAT_HIGH = '#ff5c5c';
  function fatColor(v) { return v >= 50 ? FAT_HIGH : v >= 30 ? FAT_MID : FAT_LOW; }
  function sparkline(values, color) {
    var n = values.length;
    if (n < 2) return '';
    var W = 120, H = 28;
    var pts = values.map(function (v, i) { return (i / (n - 1) * W).toFixed(1) + ',' + (H - 2 - Math.max(0, Math.min(100, v)) / 100 * (H - 4)).toFixed(1); });
    return '<svg class="db-spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }
  function fatigueView(b) {
    var L = window.MinkaLevels, label = monthLabel(state.month).toUpperCase();
    var data = null, chart = '';
    try { data = L && L.fatigueMonth ? L.fatigueMonth(label) : null; } catch (_e) {}
    try { chart = L && L.renderFatigueChart ? L.renderFatigueChart(label, { bare: true }) : ''; } catch (_e) {}
    if (!data || !chart) return empty('Noguruma modelim šim mēnesim nav datu.');
    var mm = data.mm, past = data.todayIdx >= 0 ? data.todayIdx + 1 : data.daysIn;
    var today = data.todayIdx >= 0 ? data.team[data.todayIdx] : null;
    var people = data.names.map(function (name) {
      var arr = (data.fatByDay[name] || []).slice(0, past);
      var avg = arr.length ? arr.reduce(function (a, v) { return a + v; }, 0) / arr.length : 0;
      var peak = 0, peakDay = 0;
      arr.forEach(function (v, i) { if (v > peak) { peak = v; peakDay = i + 1; } });
      return { name: name, arr: arr, avg: Math.round(avg), peak: Math.round(peak), peakDay: peakDay };
    }).filter(function (p) { return p.arr.some(function (v) { return v > 0; }); })
      .sort(function (a, c) { return c.avg - a.avg || c.peak - a.peak; });
    var tiles = '<div class="db-tiles db-tiles--4">'
      + tile(data.avg + '<small>%</small>', 'Vidēji', 'komandas mēneša vidējais', fatColor(data.avg))
      + tile(data.peak + '<small>%</small>', 'Smagākā diena', data.peakDay + '.' + mm + '.', fatColor(data.peak))
      + tile(today == null ? '—' : today + '<small>%</small>', 'Šodien', today == null ? 'cits mēnesis' : 'komanda', today == null ? '' : fatColor(today))
      + tile((data.corr > 0 ? '+' : '') + data.corr + '<small>%</small>', 'Mēness', 'korelācija, pilnmēness ' + (data.fullIdx + 1) + '.' + mm + '.')
      + '</div>';
    var rows = people.length ? capped('<div class="db-fat">', people.map(function (p) {
      var g = GROUP.rg, c = fatColor(p.avg);
      return '<button type="button" class="db-fat-row" data-db-person="' + esc(p.name) + '">' + avatar(p.name, g.accent)
        + '<span class="db-fat-name"><b>' + esc(shortName(p.name)) + '</b><small>Maksimums ' + p.peak + '% (' + p.peakDay + '.' + mm + '.)</small></span>'
        + sparkline(p.arr, c)
        + '<span class="db-fat-val" style="color:' + c + '"><b>' + p.avg + '%</b><small>vidēji</small></span></button>';
    }), '</div>', CAP) : empty('Šomēnes nav noguruma datu.');
    return tiles
      + section('Komanda', GROUP.rg.label.toLowerCase() + ', dienas vidējais', chart, '#38bdf8')
      + section('Cilvēki', 'mēneša līkne, vidējais un maksimums', rows, '#38bdf8')
      + note('Modeļa aprēķins no grafika un atpūtas laika. Tas nav cilvēka pašsajūta, to rāda sadaļa Pārskats. Mēness līkne ir joks, ne zinātne.');
  }
  function personView(b) {
    var name = state.person, s = summaryFor(b.range, name, 'all');
    var rows = M.dayRows(s, b.range.from, b.range.to);
    var group = s.shifts[0] ? GROUP[s.shifts[0].group] : GROUP.rg;
    var c = typeCounts(s.shifts), p = s.people[0] || { ge: 0, philips: 0 };
    var list = rows.filter(function (r) { return r.shifts.length; }).map(function (r) {
      return '<tr><td><button type="button" class="db-link" data-db-day="' + r.day + '">' + shortDay(r.day) + '</button></td><td>' + r.shifts.map(function (e) { return chip(shiftLabel(e), SHIFT[e.type].color); }).join(' ') + '</td><td>' + (r.bolus.length ? r.bolus.map(function (e) { return chip(e.room === 'ge' ? 'GE' : 'Philips', e.room === 'ge' ? '#0a84ff' : '#30d158'); }).join(' ') : '<span class="db-dim">—</span>') + '</td></tr>';
    });
    return backBar(avatar(name, group.accent) + esc(name), group.label + '&ensp;' + monthLabel(state.month))
      + '<div class="db-tiles db-tiles--5">' + tile(s.shifts.length, 'Maiņas') + tile(fmt(s.hours, 0) + '<small>h</small>', 'Stundas', '', '#1fe091') + tile(c.day, 'Diena', '', SHIFT.day.color) + tile(c.night, 'Nakts', '', SHIFT.night.color) + tile(c['24h'], '24h', '', SHIFT['24h'].color) + '</div>'
      + section('Mēnesis', 'pēc maiņas veida', pixels(rows, b.today, 'shift'), group.accent)
      + section('Maiņas', (p.ge + p.philips) + ' bolusa maiņas', table(['Diena', 'Maiņa', 'Boluss'], list), group.accent)
      + note('Sajūtas ir anonīmas, tāpēc personai tās netiek rādītas — tās redzamas tikai komandas kopainā.');
  }
  function dayView(b) {
    var day = state.day, all = summaryFor({ from: day, to: day }, '', 'all');
    var row = M.dayRows(all, day, day)[0];
    var moodBlock;
    var ownDayMood = ownMood(day);
    var ownBlock = ownDayMood ? '<div class="db-own db-own--day"><span class="db-own-title">Savs vērtējums</span><span class="db-own-item is-static"><span class="db-face">'
      + esc(ownDayMood.emoji) + '</span><b>' + esc(ownDayMood.note || '—') + '</b></span></div>' : '';
    if (row.mood) {
      var m = M.moodFor(row.mood.score);
      moodBlock = '<div class="db-tiles db-tiles--2">' + tile('<span class="db-face">' + m.emoji + '</span>' + fmt(row.mood.score), 'Dienas sajūta', m.label, m.color) + tile(row.mood.total, 'Reakcijas', 'anonīmi klikšķi') + '</div>' + moodCounts(all);
    } else {
      moodBlock = ownBlock ? '' : empty(day > b.today ? 'Diena vēl nav pienākusi.' : 'Šai dienai sajūtas nav atzīmētas.');
    }
    moodBlock = ownBlock + moodBlock;
    var staff = ['rg', 'rd'].map(function (g) {
      var list = row.shifts.filter(function (e) { return e.group === g; });
      if (!list.length) return '';
      return '<div class="db-staff"><span class="db-staff-title" style="color:' + GROUP[g].accent + '">' + GROUP[g].label + '</span>' + list.map(function (e) {
        return '<button type="button" class="db-staff-item" data-db-person="' + esc(e.name) + '">' + avatar(e.name, GROUP[g].accent) + '<b>' + esc(shortName(e.name)) + '</b>' + chip(shiftLabel(e), SHIFT[e.type].color) + '</button>';
      }).join('') + '</div>';
    }).join('');
    var dateKey = day.slice(8) + '.' + day.slice(5, 7) + '.' + day.slice(0, 4);
    var cupsKnown = Object.prototype.hasOwnProperty.call(readJson(COFFEE_KEY), dateKey);
    var cups = all.cups.filter(function (e) { return e.count; }).sort(function (a, c) { return c.count - a.count; });
    return backBar(longDay(day), row.shifts.length + ' cilvēki dežūrā&ensp;' + fmt(row.hours, 0) + ' h plānotas')
      + section('Sajūta', '', moodBlock, '#7dd3fc')
      + section('Dežūrā', '', staff || empty('Grafikā šai dienai nav maiņu.'), '#1fe091')
      + '<div class="db-two">'
      + (IS_RAD ? '' : section('Boluss', row.bolus.length + ' maiņas', row.bolus.length ? '<ul class="db-list">' + row.bolus.map(function (e) { return '<li>' + chip(e.room === 'ge' ? 'GE' : 'Philips', e.room === 'ge' ? '#0a84ff' : '#30d158') + '<b>' + esc(new Date(e.ts).toLocaleTimeString('lv-LV', { timeZone: 'Europe/Riga', hour: '2-digit', minute: '2-digit' })) + '</b><span>' + esc(e.name) + '</span></li>'; }).join('') + '</ul>' : empty('Nav bolusa maiņu.'), '#ff5c5c'))
      + section('Radio', '', row.radio.length ? '<ul class="db-list">' + row.radio.map(function (n) { return '<li><span class="db-face">📻</span><span>' + esc(n) + '</span></li>'; }).join('') + '</ul>' : empty('Radio nav pierakstīts.'), '#38bdf8')
      + '</div>'
      + section('Kafija', cupsKnown ? cups.reduce(function (n, e) { return n + e.count; }, 0) + ' dzērieni' : '', cupsKnown
        ? (cups.length ? '<ul class="db-list">' + cups.map(function (e) { return '<li><b>' + e.count + '</b><span>' + esc(shortName(e.name)) + '</span></li>'; }).join('') + '</ul>' : empty('Neviens nav atzīmējis dzērienus.'))
        : empty(coffee.busy ? 'Ielādē kafiju…' : 'Kafijas dati nav pieejami.'), '#f5b73f');
  }

  /* ── render ───────────────────────────────────────────────────────────── */
  function retryFailed() {
    ratingsFailed = {};
    coffee.failed = {};
    if (modalOpen()) render();
  }
  function loadingError(range) {
    var from = state.day || range.from, to = state.day || range.to;
    var inView = function (d) { return d >= from && d <= to; };
    var missing = [];
    if ((state.day || (!state.person && state.tab === 'overview')) && Object.keys(ratingsFailed).some(inView)) missing.push('pašsajūtas');
    if (Object.keys(coffee.failed).some(inView)) missing.push('kafijas');
    if (!missing.length) return '';
    return '<p class="db-note" role="status">Neizdevās ielādēt visus ' + missing.join(' un ') + ' datus. '
      + 'Pārskats var būt nepilnīgs. <button type="button" class="db-link" data-db-retry>Mēģināt vēlreiz</button></p>';
  }
  /* The toolbar and tabs are built once per open and then updated in place,
     so a click never rebuilds the control the user is on (focus and scroll
     stay put). Only the body is replaced, and the replacement is animated by
     what the change means:
       tab / filter  fade through (effects)
       month         shared axis X in the direction of travel
       forward       the day/person opens out of the item that was clicked
       back          the overview returns, scaled down into place
       refresh       late data (ratings, coffee): swapped with no motion */
  var chrome = null;
  var scrollMemo = { list: 0, from: null };
  function mountChrome(wrap, names) {
    wrap.classList.add('db-stats');
    wrap.innerHTML = header(names) + '<div class="db-body" id="db-panel" role="tabpanel" tabindex="-1"></div>';
    chrome = {
      wrap: wrap,
      body: wrap.querySelector('.db-body'),
      month: wrap.querySelector('[data-db-month]'),
      select: wrap.querySelector('[data-db-person-select]'),
      tablist: wrap.querySelector('.db-tabs'),
      indicator: wrap.querySelector('.db-tab-indicator'),
      names: names.join('|')
    };
  }
  function syncChrome(names) {
    chrome.month.textContent = monthLabel(state.month);
    chrome.wrap.querySelectorAll('[data-db-group]').forEach(function (b) { b.setAttribute('aria-pressed', String(state.group === b.dataset.dbGroup)); });
    var any = TABS.some(function (t) { return tabSelected(t[0]); });
    chrome.wrap.querySelectorAll('[data-db-tab]').forEach(function (b) {
      var on = tabSelected(b.dataset.dbTab);
      b.setAttribute('aria-selected', String(on));
      b.setAttribute('aria-pressed', String(on));
      b.tabIndex = on || (!any && b.dataset.dbTab === 'overview') ? 0 : -1;
    });
    var key = names.join('|');
    if (key !== chrome.names) { chrome.names = key; chrome.select.innerHTML = personOptions(names); }
    chrome.select.value = state.person || '';
  }
  // Liquid underline (MinkaMotion.liquid): one read, one left/right write;
  // the edges ride two springs in CSS.
  function placeIndicator(animate) {
    if (!chrome || !chrome.indicator) return;
    var sel = chrome.tablist.querySelector('[aria-selected="true"]');
    var ind = chrome.indicator;
    if (!sel) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    if (window.MinkaMotion && window.MinkaMotion.liquid) {
      window.MinkaMotion.liquid(ind, chrome.tablist, sel, { animate: !!animate, vertical: false });
      return;
    }
    ind.style.left = sel.offsetLeft + 'px';
    ind.style.width = sel.offsetWidth + 'px';
  }
  function bodyMotion(kind, info) {
    var MM = window.MinkaMotion, body = chrome.body;
    // Tabs: only the indicator moves; the body swaps at once (a fade from
    // nothing reads as a flash).
    if (!MM || !kind || kind === 'refresh' || kind === 'tab') return null;
    var tr = MM.travel();
    if (kind === 'reveal') {
      return MM.animate(body, [{ opacity: 0 }, { opacity: 1 }], 'effects-default');
    }
    if (kind === 'month') {
      return MM.animate(body, [{ opacity: 0, translate: (28 * tr * info.dir) + 'px 0' }, { opacity: 1, translate: '0 0' }], 'spatial-fast', { standard: true, measure: true });
    }
    if (kind === 'forward' || kind === 'back') {
      var origin = '50% 0';
      if (info.point) origin = Math.round(info.point.x) + 'px ' + Math.round(info.point.y) + 'px';
      body.style.transformOrigin = origin;
      var from = kind === 'forward' ? 1 - .08 * tr : 1 + .04 * tr;
      return MM.animate(body, [{ opacity: 0, scale: String(from) }, { opacity: 1, scale: '1' }], 'spatial-default', { standard: kind === 'back', measure: true });
    }
    return MM.animate(body, [{ opacity: 0, translate: '0 ' + (8 * tr) + 'px' }, { opacity: 1, translate: '0 0' }], 'effects-slow', { measure: true });
  }
  // Point inside the body where an element sits: the zoom origin.
  function pointIn(el) {
    if (!el || !chrome || typeof el.getBoundingClientRect !== 'function') return null;
    var r = el.getBoundingClientRect(), b = chrome.body.getBoundingClientRect();
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
  }
  // A caller may ask for a tab when opening (the mood card's month line):
  // window.__mkStatsOpenTab is read once.
  function openTab() {
    var want = String(window.__mkStatsOpenTab || '');
    window.__mkStatsOpenTab = '';
    return TABS.some(function (t) { return t[0] === want; }) ? want : 'overview';
  }
  function render(kind, info) {
    var wrap = document.getElementById('stats-table-wrap');
    if (!wrap) return;
    info = info || {};
    if (!state.month || !modalOpen()) {
      // Opening: start from the day selected in the calendar.
      state.month = D.selectedDay().slice(0, 7);
      state.person = ''; state.day = ''; state.tab = openTab();
      ratingsFailed = {}; coffee.failed = {};
      scrollMemo = { list: 0, from: null };
      wrap.scrollTop = 0;
      if (!kind) kind = 'open';
    }
    if (!state.month) state.month = M.dutyDay().slice(0, 7);
    // Opening: the dialog frame (toolbar, tabs) goes up at once so the open
    // motion starts on the click; the month's numbers (~40–70 ms here, a few
    // times that on the work PCs) are built in the next task, while the frame
    // is already moving, and fade in. Content is never held back for motion.
    if (kind === 'open' && typeof wrap.querySelector === 'function') {
      mountChrome(wrap, []);
      chrome.body.classList.add('db-pending');
      placeIndicator(false);
      var mounted = chrome;
      requestAnimationFrame(function () {
        setTimeout(function () { if (chrome === mounted && modalOpen()) render('reveal'); }, 0);
      });
      return;
    }
    var b = build();
    var names = Array.from(new Set(shiftsAll().filter(function (e) { return e.day >= b.range.from && e.day <= b.range.to; }).map(function (e) { return e.name; }))).sort(function (a, c) { return a.localeCompare(c, 'lv'); });
    var body;
    if (state.day) body = dayView(b);
    else if (state.person) body = personView(b);
    else if (state.tab === 'bolus') body = bolusView(b);
    else if (state.tab === 'radio') body = radioView(b);
    else if (state.tab === 'coffee') body = coffeeView(b);
    else if (state.tab === 'night') body = nightView(b);
    else if (state.tab === 'fatigue') body = fatigueView(b);
    else body = overview(b);
    var inner = loadingError(b.range) + body;
    if (typeof wrap.querySelector !== 'function') {
      // Minimal hosts (unit tests) have no DOM: one string, same content.
      wrap.classList.add('db-stats');
      wrap.innerHTML = header(names) + '<div class="db-body">' + inner + '</div>';
    } else {
      var fresh = !chrome || chrome.wrap !== wrap || !wrap.contains(chrome.body);
      if (fresh) mountChrome(wrap, names); else syncChrome(names);
      // Late data must not replay entrances or steal the reader's place.
      chrome.body.classList.remove('db-pending');
      var animated = kind && kind !== 'refresh';
      var keepScroll = !animated ? wrap.scrollTop : null;
      if (window.MinkaMotion) window.MinkaMotion.run('stats-body', function () {
        chrome.body.innerHTML = inner;
        chrome.body.classList.toggle('db-anim', !!animated);
      }, { fallback: function () { return fresh && kind === 'open' ? null : bodyMotion(kind, info); } });
      else { chrome.body.innerHTML = inner; chrome.body.classList.toggle('db-anim', !!animated); }
      if (keepScroll != null) wrap.scrollTop = keepScroll;
      if (kind === 'forward') wrap.scrollTop = 0;
      if (kind === 'back' && scrollMemo.from != null) { wrap.scrollTop = scrollMemo.list; scrollMemo.from = null; }
      placeIndicator(!fresh && animated);
    }
    if (state.day) {
      ensureRatings(state.day <= b.today ? [state.day] : []);
    } else if (!state.person && state.tab === 'overview') {
      ensureRatings(elapsedDays(b.rows, b.today).map(function (r) { return r.day; }));
    }
    ensureRadio(state.month);
    if (state.tab === 'night' && !state.day && !state.person) ensureNight();
    // Coffee days come from the API on demand; opening the stats (or a month)
    // pulls the month's missing days, a day view pulls its own day.
    var coffeeDays = state.day ? [state.day] : elapsedDays(b.rows, b.today).map(function (r) { return r.day; });
    if (coffeeDays.some(function (d) { return d <= b.today && !coffee.loaded[d] && !coffee.failed[d]; })) void loadCoffee(coffeeDays);
  }
  // Escape and the back button: leave a drill-down first, one level at a time.
  function back() {
    if (!modalOpen() || (!state.day && !state.person)) return false;
    var from = state.day ? '[data-db-day="' + state.day + '"]' : '[data-db-person="' + state.person + '"]';
    if (state.day) state.day = ''; else state.person = '';
    render('back');
    var again = chrome && chrome.body.querySelector(from);
    if (again && typeof again.focus === 'function') { try { again.focus({ preventScroll: true }); } catch (_e) {} }
    return true;
  }
  function openDrill(t, set) {
    var wrap = document.getElementById('stats-table-wrap');
    if (!state.day && !state.person && wrap) { scrollMemo.list = wrap.scrollTop; scrollMemo.from = true; }
    var point = pointIn(t);
    set();
    render('forward', { point: point });
    if (chrome && typeof chrome.body.focus === 'function') { try { chrome.body.focus({ preventScroll: true }); } catch (_e) {} }
  }

  document.addEventListener('click', function (e) {
    var wrap = e.target.closest('#stats-table-wrap');
    if (!wrap) return;
    if (e.target.closest('[data-db-retry]')) { retryFailed(); return; }
    var more = e.target.closest('[data-db-more]');
    if (more) { var cap = more.closest('.db-cap'); if (cap) cap.classList.add('is-open'); return; }
    var t;
    if ((t = e.target.closest('[data-db-nav]'))) { var dir = +t.dataset.dbNav; state.month = shiftMonth(state.month, dir); state.day = ''; render('month', { dir: dir }); return; }
    if ((t = e.target.closest('[data-db-group]'))) { if (state.group === t.dataset.dbGroup) return; state.group = t.dataset.dbGroup; render('filter'); return; }
    if ((t = e.target.closest('[data-db-tab]'))) { if (tabSelected(t.dataset.dbTab)) return; state.tab = t.dataset.dbTab; state.person = ''; state.day = ''; render('tab'); return; }
    if ((t = e.target.closest('[data-db-day]'))) { var day = t.dataset.dbDay; openDrill(t, function () { state.day = day; }); return; }
    if ((t = e.target.closest('[data-db-person]'))) { var person = t.dataset.dbPerson; openDrill(t, function () { state.person = person; state.day = ''; }); return; }
    if (e.target.closest('[data-db-back]')) { back(); return; }
  });
  // M3 tabs: arrow keys move between tabs, Home/End jump to the ends.
  document.addEventListener('keydown', function (e) {
    var tab = e.target && e.target.closest && e.target.closest('#stats-table-wrap [role="tab"]');
    if (!tab) return;
    var tabs = [].slice.call(tab.parentNode.querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(tab), next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    next.focus();
    next.click();
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches('#stats-table-wrap [data-db-person-select]')) return;
    var person = e.target.value;
    if (!person) { if (state.person) { state.person = ''; state.day = ''; render('back'); } return; }
    openDrill(null, function () { state.person = person; state.day = ''; });
  });
  window.addEventListener('minka:daybook', function () { if (modalOpen()) render(); });
  window.addEventListener('online', retryFailed);
  // Outside callers (late data, levels.js, the modal opener) only refresh.
  window.MinkaDaybookStats = {
    render: function () { render(chrome && modalOpen() ? 'refresh' : null); },
    back: back,
    reset: function () { chrome = null; }
  };
})();
