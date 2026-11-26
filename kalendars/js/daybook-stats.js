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
  // What a card on the answers page opens (each with a back bar); /rad has no Bolus or night plan.
  var DETAILS = { mood: 'Komandas sajūta', bolus: 'Bolus maiņas', fatigue: 'Nogurums', people: 'Kurš dežurēja visvairāk', coffee: 'Kafija', radio: 'Radio', night: 'Nakts' };
  if (IS_RAD) { delete DETAILS.bolus; delete DETAILS.night; }
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
  var COFFEE_SOURCES = [['philips', 'Philips'], ['lofbergs', 'Löfbergs'], ['narvesen', 'Narvesen'], ['monster', 'Monster'], ['monsterultra', 'Monster Ultra'], ['redbull', 'Red Bull'], ['brite', 'Brite'], ['dynamit', 'Dynamit'], ['kongstrong', 'Kong Strong'], ['cupcoffee', 'Cita kafija'], ['mycoffee', 'Mana kafija']];

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

  /* ── data ─────────────────────────────────────────────────────────────── */
  function shiftsAll() { return M.schedule([window.__grafiksStore, window.__grafiksStoreRad]); }
  // EHR channels got their own radio tab (2026-10-18) under ehr.fm's names; days
  // listened under the old Latvian-list names count for the same channel.
  var EHR_RENAMED = {
    'eiropas hītu radio': 'EHR', 'ehr superhits': 'SuperHits', 'super fm': 'SuperHits', 'ehr latviešu hiti': 'Latviešu hiti',
    'retro fm': 'Retro FM Latvija', 'ehr accoustic': 'SuperHits Chillout Hits', 'ehr gold': 'SuperHits Gold',
    'ehr ice ice party': 'SuperHits SH Dance', 'latviešu deju hiti': 'Latviešu hiti Deju Hiti',
    'latviešu repa hiti': 'Latviešu hiti LV Reps', 'retro disco': 'Retro FM Disco', 'retro fm 70s 80s 90s': "Retro FM 70, 80, 90's"
  };
  function radioAll(range) {
    // This device's own records plus what the API knows, one row per day and station.
    var seen = {}, out = [];
    var add = function (day, name, firstAt) {
      name = EHR_RENAMED[M.norm(name)] || name;
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
    var base = String(window.MINKA_COFFEE_API_BASE || 'https://coffee.rgapp.page').replace(/\/+$/, '');
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
            try { window.dispatchEvent(new Event('minka:coffee-store-written')); } catch (_e) {}
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
  /* A list that shows `limit` items and hides the rest behind one button
     (data-db-more, handled below): the tab keeps a sane height. Items are
     HTML strings; the hidden ones get the db-extra class. */
  function capped(open, items, close, limit) {
    limit = limit || items.length;
    var rest = items.length - limit;
    if (rest <= 0) return open + items.join('') + close;
    return '<div class="db-cap">' + open + items.map(function (html, i) {
      // The class may sit after other attributes (<button type="button" class=…>);
      // a second class attribute would be ignored and the row lose its styles.
      if (i < limit) return html;
      var tag = html.slice(0, html.indexOf('>'));
      return /\sclass="/.test(tag) ? html.replace(/\sclass="/, ' class="db-extra ') : html.replace(/^<(\w+)/, '<$1 class="db-extra"');
    }).join('') + close + '<button type="button" class="db-more" data-db-more>Rādīt vēl ' + rest + '</button></div>';
  }
  // a person: initials in an M3 tonal circle (primary-container), the same everywhere in the statistics
  function formatName(name) { return String(name || '').toLowerCase().replace(/(^|[\s-])(\S)/g, function (m, a, c) { return a + c.toUpperCase(); }); }
  function avatar(name) { return '<span class="db-av" aria-hidden="true">' + initials(name) + '</span>'; }
  function shiftLabel(e) { return e.type === '24h' ? '24h' : SHIFT[e.type].label + ' ' + e.hours + 'h'; }
  /* M3 Expressive shapes (the "cookie" family of the shape library: n soft waves round a circle), each section its own.
     Drawn as one closed path of 240 points on a 100 box, so the curve stays smooth and the badge is never stretched. */
  var SHAPES = { phs: [7, .07], person: [10, .08], clover: [4, .2], sunny: [8, .09], mood: [9, .07], bolus: [4, .16], fatigue: [12, .055], people: [6, .1], coffee: [8, .1], radio: [7, .08], night: [5, .12] };
  var shapeCache = {};
  function shapePath(key) {
    if (shapeCache[key]) return shapeCache[key];
    var p = SHAPES[key] || [8, .08], d = '';
    for (var i = 0; i < 240; i++) {
      var t = i / 240 * Math.PI * 2, r = 50 * (1 + p[1] * Math.cos(p[0] * t)) / (1 + p[1]);
      d += (i ? 'L' : 'M') + (50 + r * Math.sin(t)).toFixed(2) + ',' + (50 - r * Math.cos(t)).toFixed(2);
    }
    return (shapeCache[key] = d + 'Z');
  }
  function badge(key, icon, cls) {
    return '<span class="db-badge is-' + key + (cls ? ' ' + cls : '') + '"><svg class="db-badge-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="' + shapePath(key) + '"/></svg>' + icon + '</span>';
  }
  /* A section's lead: its icon in the section's shape, the big number, then a few facts split by thin rules
     (the user's Bolus mockup). The marker lets render() set it beside the back button. */
  function hero(key, icon, num, label, segs) {
    return '<div class="db-hero is-' + key + '"><div class="db-hero-main">' + badge(key, icon, 'is-xl') + '<span class="db-hero-num"><b>' + num + '</b><small>' + label + '</small></span></div>'
      + '<div class="db-hero-facts">' + (segs || []).filter(Boolean).map(function (s) { return '<div class="db-hero-seg">' + s + '</div>'; }).join('') + '</div></div><!--lead-->';
  }
  // one answer in a line: a short mark in a small shape, a title and a plain sentence under it
  function mini(shape, mark, title, sub) {
    return '<span class="db-mini">' + badge(shape, '<b class="db-badge-txt">' + mark + '</b>') + '<span><b>' + title + '</b><small>' + sub + '</small></span></span>';
  }
  // "1 cilvēks bija ļoti noguris", "7 cilvēki bija ļoti noguruši" (Latvian: 21 is singular too)
  function tired(n) { return n % 10 === 1 && n % 100 !== 11 ? n + ' cilvēks bija ļoti noguris' : n + ' cilvēki bija ļoti noguruši'; }
  function fact(value, label) { return '<span class="db-fact"><b>' + value + '</b><small>' + label + '</small></span>'; }
  // two rooms as one "bun": two circles joined by a smooth neck (tangents level at every join, so no kink)
  function bun(a, aLabel, b, bLabel) {
    return '<span class="db-bun"><svg viewBox="0 0 430 150" aria-hidden="true"><defs><linearGradient id="dbBunG"><stop offset=".38" stop-color="#3f8cff"/><stop offset=".62" stop-color="#5ee6a8"/></linearGradient></defs>'
      + '<path fill="url(#dbBunG)" d="M75,0C130,0 160,35 215,35C270,35 300,0 355,0A75,75 0 0 1 355,150C300,150 270,115 215,115C160,115 130,150 75,150A75,75 0 0 1 75,0Z"/></svg>'
      + '<span class="is-a"><b>' + a + '</b><small>' + aLabel + '</small></span><span class="is-b"><b>' + b + '</b><small>' + bLabel + '</small></span></span>';
  }
  /* A ranked list (the mockup's "Pēc cilvēka"): place, name, one bar of coloured parts on a shared scale, the total,
     then the parts in words. items: [{name, person?, segs: [[value, class]], total, extra?}] */
  function rank(items, opts) {
    opts = opts || {};
    if (!items.length) return empty(opts.empty || 'Nav ierakstu.');
    var max = opts.max || items.reduce(function (m, e) { return Math.max(m, e.total); }, 0) || 1;
    return capped('<div class="db-rank' + (opts.cls ? ' ' + opts.cls : '') + '">', items.map(function (e, i) {
      var open = e.person ? '<button type="button" class="db-rank-row" data-db-person="' + esc(e.person) + '">' : '<div class="db-rank-row">';
      return open + '<span class="db-rank-n">' + (i + 1) + '</span><b class="db-rank-name">' + e.name + '</b>'
        + '<span class="db-rank-bar"' + (opts.mark ? ' style="--n:' + (opts.mark / max * 100).toFixed(2) + '%"' : '') + '>' + e.segs.map(function (s) { return s[0] > 0 ? '<i class="' + s[1] + '" style="width:' + (s[0] / max * 100).toFixed(2) + '%' + (s[2] ? ';background:' + s[2] : '') + '"></i>' : ''; }).join('') + '</span>'
        + '<span class="db-rank-total">' + (e.totalText != null ? e.totalText : e.total) + '</span>' + (e.extra != null ? '<span class="db-rank-extra">' + e.extra + '</span>' : '')
        + (e.person ? '</button>' : '</div>');
    }), '</div>', opts.cap || CAP);
  }
  function legend(parts) { return '<span class="db-legend">' + parts.map(function (p) { return '<span class="' + p[1] + '">' + p[0] + '</span>'; }).join('') + '</span>'; }
  function chip(text, color) {
    return '<span class="db-chip" style="color:' + color + ';background:' + rgba(color, 0.12) + ';border-color:' + rgba(color, 0.3) + '">' + text + '</span>';
  }

  /* ── header ───────────────────────────────────────────────────────────── */
  /* Material Symbols Rounded (Google, Apache License 2.0), the official SVGs from fonts.gstatic.com (the source of
     fonts.google.com/icons), only the controls' ones: weight 400, optical size 24, outlined, in currentColor on a
     0 -960 960 960 box (the answers use the dock's own icons). */
  var MS = {
    f_local_cafe: 'M200-120q-17 0-28.5-11.5T160-160q0-17 11.5-28.5T200-200h560q17 0 28.5 11.5T800-160q0 17-11.5 28.5T760-120H200Zm120-160q-66 0-113-47t-47-113v-320q0-33 23.5-56.5T240-840h560q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Zm400-360h80v-120h-80v120Z',
    battery: 'M660-200h-62q-12 0-17.5-10.5T582-231l100-143q5-6 11.5-4t6.5 10v88h62q12 0 17.5 10.5T778-249L678-106q-5 6-11.5 4t-6.5-10v-88ZM320-80q-17 0-28.5-11.5T280-120v-640q0-17 11.5-28.5T320-800h80v-40q0-17 11.5-28.5T440-880h80q17 0 28.5 11.5T560-840v40h80q17 0 28.5 11.5T680-760v253q0 11-8 19t-19 10q-42 5-78 22.5T511-410q-32 32-51.5 75.5T440-240q0 30 7 58t21 54q8 17 0 32.5T443-80H320Z',
    f_bolt: 'M360-360H236q-24 0-35.5-21.5T203-423l299-430q10-14 26-19.5t33 .5q17 6 25 21t6 32l-32 259h155q26 0 36.5 23t-6.5 43L416-100q-11 13-27 17t-31-3q-15-7-23.5-21.5T328-139l32-221Z',
    f_euro: 'M600-120q-118 0-210-67T260-360H160q-17 0-28.5-11.5T120-400q0-17 11.5-28.5T160-440h82q-3-24-2.5-44.5T242-520h-82q-17 0-28.5-11.5T120-560q0-17 11.5-28.5T160-600h100q38-106 130-173t210-67q58 0 110.5 17t97.5 49q14 10 15 26.5T812-720q-12 12-29 12.5t-31-8.5q-33-21-71.5-32.5T600-760q-85 0-152 44.5T347-600h213q17 0 28.5 11.5T600-560q0 17-11.5 28.5T560-520H323q-4 27-3 47.5t3 32.5h237q17 0 28.5 11.5T600-400q0 17-11.5 28.5T560-360H347q34 71 101 115.5T600-200q42 0 80.5-12t71.5-33q14-9 31-8t29 13q12 11 11 27.5T808-186q-45 32-97.5 49T600-120Z',
    f_group: 'M40-272q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v32q0 33-23.5 56.5T600-160H120q-33 0-56.5-23.5T40-240v-32Zm698 112q11-18 16.5-38.5T760-240v-40q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v40q0 33-23.5 56.5T840-160H738ZM247-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113q0 66-47 113Z',
    sentiment_satisfied: 'M480-260q53 0 100.5-23t76.5-67q11-17 3-33.5T634-400q-8 0-14.5 3.5T609-386q-23 31-57 48.5T480-320q-38 0-72-17.5T351-386q-5-7-11.5-10.5T325-400q-18 0-26 16t3 32q29 45 76.5 68.5T480-260Zm140-260q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm-16 408.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM480-480Zm227 227q93-93 93-227t-93-227q-93-93-227-93t-227 93q-93 93-93 227t93 227q93 93 227 93t227-93Z',
    search: 'M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
    arrow_back: 'm313-440 196 196q12 12 11.5 28T508-188q-12 11-28 11.5T452-188L188-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l264-264q11-11 27.5-11t28.5 11q12 12 12 28.5T508-715L313-520h447q17 0 28.5 11.5T800-480q0 17-11.5 28.5T760-440H313Z',
    check: 'm382-354 339-339q12-12 28-12t28 12q12 12 12 28.5T777-636L410-268q-12 12-28 12t-28-12L182-440q-12-12-11.5-28.5T183-497q12-12 28.5-12t28.5 12l142 143Z',
    chevron_left: 'm432-480 156 156q11 11 11 28t-11 28q-11 11-28 11t-28-11L348-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 28-11t28 11q11 11 11 28t-11 28L432-480Z',
    chevron_right: 'M504-480 348-636q-11-11-11-28t11-28q11-11 28-11t28 11l184 184q6 6 8.5 13t2.5 15q0 8-2.5 15t-8.5 13L404-268q-11 11-28 11t-28-11q-11-11-11-28t11-28l156-156Z',
  };
  function ms(name) { return '<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="' + MS[name] + '"/></svg>'; }
  var ICON = { prev: ms('chevron_left'), next: ms('chevron_right'), back: ms('arrow_back'), check: ms('check') };

  function personOptions(names) {
    return names.map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('');
  }
  function header(names) {
    return '<div class="db-chrome"><div class="db-top">'
      + '<div class="db-monthnav"><button type="button" class="db-icon-btn" data-db-nav="-1" aria-label="Iepriekšējais mēnesis">' + ICON.prev + '</button><b aria-live="polite" data-db-month>' + monthLabel(state.month) + '</b><button type="button" class="db-icon-btn" data-db-nav="1" aria-label="Nākamais mēnesis">' + ICON.next + '</button></div>'
      + '<div class="db-chips" role="group" aria-label="Kuri cilvēki">' + [['all', 'Visi'], ['rg', GROUP.rg.label], ['rd', GROUP.rd.label]].map(function (g) {
        return '<button type="button" data-db-group="' + g[0] + '" aria-pressed="' + (state.group === g[0]) + '">' + ICON.check + '<span>' + g[1] + '</span></button>';
      }).join('') + '</div>'
      + '<label class="db-search">' + ms('search') + '<span class="db-visually-hidden">Meklēt cilvēku</span><input type="search" data-db-person-select list="db-people" placeholder="Meklēt cilvēku" autocomplete="off" spellcheck="false"><datalist id="db-people">' + personOptions(names) + '</datalist></label>'
      + '</div></div>';
  }
  // the back button and title share one row with the section's hero (the part before the marker)
  function withLead(back, view) {
    var at = view.indexOf('<!--lead-->');
    if (at < 0) return back + view;
    var head = view.slice(0, at);
    return '<div class="db-lead' + (head.indexOf('db-hero-title') >= 0 ? ' has-title' : '') + '">' + back + head + '</div>' + view.slice(at + 11);
  }
  function backBar(title, sub) {
    return '<div class="db-back"><button type="button" class="db-backbtn" data-db-back title="Atpakaļ (Esc)">' + ICON.back + '<span>Atpakaļ</span></button><div><h2>' + title + '</h2>' + (sub ? '<span>' + sub + '</span>' : '') + '</div></div>';
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
  /* The month's feeling as a line: the five moods named on the left (HTML, so the faces stay crisp), a dashed line
     through the marked days, a bigger point = more reactions, today a dashed rule. */
  function moodChart(rows, today) {
    var W = 1200, H = 230, padT = 22, padB = 34, padX = 20;
    var gW = W - padX * 2, gH = H - padT - padB, n = rows.length;
    var x = function (i) { return padX + (n > 1 ? i / (n - 1) * gW : gW / 2); };
    var y = function (score) { return padT + gH - (score - 1) / 4 * gH; };
    var out = '<svg class="db-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Komandas sajūta pa dienām">';
    rows.forEach(function (r, i) {
      var wd = (new Date(r.day + 'T12:00:00Z').getUTCDay() + 6) % 7;
      if (wd >= 5) out += '<rect x="' + (x(i) - gW / Math.max(1, n - 1) / 2).toFixed(1) + '" y="' + padT + '" width="' + (gW / Math.max(1, n - 1)).toFixed(1) + '" height="' + gH + '" fill="rgba(255,255,255,.03)"/>';
    });
    M.MOODS.forEach(function (m) { out += '<line x1="0" y1="' + y(m.score).toFixed(1) + '" x2="' + W + '" y2="' + y(m.score).toFixed(1) + '" stroke="rgba(255,255,255,.07)" stroke-width="1"/>'; });
    rows.forEach(function (r, i) {
      var dd = Number(r.day.slice(8));
      if (dd === 1 || dd % 5 === 0) out += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="db-chart-x">' + dd + '</text>';
      if (r.day === today) out += '<line x1="' + x(i).toFixed(1) + '" y1="' + (padT - 6) + '" x2="' + x(i).toFixed(1) + '" y2="' + (padT + gH) + '" stroke="rgba(255,255,255,.55)" stroke-width="1.5" stroke-dasharray="5 5"/><text x="' + x(i).toFixed(1) + '" y="' + (padT - 10) + '" text-anchor="middle" class="db-chart-today">ŠODIEN</text>';
    });
    var pts = [];
    rows.forEach(function (r, i) { if (r.mood) pts.push({ x: x(i), y: y(r.mood.score), row: r }); });
    if (pts.length > 1) out += '<path d="' + smoothPath(pts) + '" fill="none" stroke="rgba(166,238,216,.7)" stroke-width="2.2" stroke-dasharray="6 7" stroke-linecap="round"/>';
    pts.forEach(function (p) {
      var m = M.moodFor(p.row.mood.score), r = 6 + Math.min(5, p.row.mood.total / 2);
      out += '<circle data-db-day="' + p.row.day + '" style="cursor:pointer" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + MOOD_TINT[m.key] + '" stroke="#132a22" stroke-width="2.5"><title>' + esc(shortDay(p.row.day)) + '&ensp;' + m.label + ' (' + p.row.mood.total + ' reakcijas)</title></circle>';
    });
    rows.forEach(function (r, i) {
      var own = ownMood(r.day);
      if (!own) return;
      var cy = r.mood ? y(r.mood.score) - 22 : y(3);
      out += '<text data-db-day="' + r.day + '" style="cursor:pointer" x="' + x(i).toFixed(1) + '" y="' + (cy + 9).toFixed(1) + '" text-anchor="middle" font-size="26" class="db-chart-face">' + esc(own.emoji)
        + '<title>' + esc(shortDay(r.day)) + '&ensp;' + esc(own.emoji) + (own.note ? ' — ' + esc(own.note) : '') + '</title></text>';
    });
    var labels = M.MOODS.map(function (m) { return '<span style="top:' + (y(m.score) / H * 100).toFixed(2) + '%"><span class="db-face">' + m.emoji + '</span>' + m.label + '</span>'; }).join('');
    return '<div class="db-mchart"><div class="db-mchart-y" aria-hidden="true">' + labels + '</div>' + out + '</svg></div>';
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
    return rank(M.MOODS.slice().reverse().map(function (m) {
      var n = s.reactions.reduce(function (sum, e) { return sum + e.counts[m.key]; }, 0);
      return { name: '<span class="db-face">' + m.emoji + '</span>' + m.label, segs: [[n, 'is-mood', MOOD_TINT[m.key]]], total: n, extra: (total ? Math.round(n / total * 100) : 0) + '%' };
    }), { cls: 'is-plain is-moods', max: total || 1 });
  }

  function moodChips(s) {
    var total = s.reactionTotal || 0;
    return '<div class="db-moodchips">' + M.MOODS.slice().reverse().map(function (m) {
      var n = s.reactions.reduce(function (sum, e) { return sum + e.counts[m.key]; }, 0);
      return '<span class="db-moodchip' + (n ? '' : ' is-zero') + '" style="--c:' + m.color + '"><span class="db-face">' + m.emoji + '</span><b>' + n + '</b><small>' + m.label + (total ? ' ' + Math.round(n / total * 100) + '%' : '') + '</small></span>';
    }).join('') + '</div>';
  }

  /* ── month in pixels ──────────────────────────────────────────────────── */
  function duty(r) {
    var n = { day: 0, night: 0 };
    r.shifts.forEach(function (e) {
      if (state.group !== 'all' && e.group !== state.group) return;
      if (e.type !== 'night') n.day++;
      if (e.type !== 'day') n.night++;
    });
    return n;
  }
  // the drinks one person took on a day, read once per person view (personView fills personCups)
  var personCups = null;
  // Emoji glyphs sit off-centre in their em box (each font pads them its own way): draw the glyph once on a canvas
  // laid out the way CSS lays it out (centred advance, line-height 1), find its visible pixels and shift the glyph so
  // their middle lands on the box's middle. Works for any emoji; waits for the emoji font so it never measures a fallback.
  var INK = {};   // emoji -> the shift that centres its visible pixels, measured once, written into every render
  function centerInk(ch) {
    var probe = document.querySelector('.db-ph .db-badge-emoji'); if (!probe) return;
    var fam = getComputedStyle(probe).fontFamily, S = 100;
    (document.fonts ? document.fonts.load(S + 'px ' + fam, ch) : Promise.resolve()).catch(function () {}).then(function () {
      var c = document.createElement('canvas'); c.width = c.height = S * 2;
      var x = c.getContext('2d', { willReadFrequently: true }); x.font = S + 'px ' + fam; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      var m = x.measureText(ch), A = m.fontBoundingBoxAscent || S * .8, D = m.fontBoundingBoxDescent || S * .2;
      var top = S / 2, base = top + (S - (A + D)) / 2 + A;   // the CSS line box (1em tall) placed at y 50..150
      x.fillText(ch, S, base);
      var d = x.getImageData(0, 0, S * 2, S * 2).data, l = S * 2, r = -1, t = S * 2, b = -1;
      for (var y = 0; y < S * 2; y++) for (var i = 0; i < S * 2; i++) if (d[(y * S * 2 + i) * 4 + 3] > 24) { if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y; }
      if (r < 0) return;
      INK[ch] = (-((l + r + 1) / 2 - S) / S).toFixed(3) + 'em ' + (-((t + b + 1) / 2 - S) / S).toFixed(3) + 'em';
      // the view may have been drawn again meanwhile: shift whatever face is on screen now
      document.querySelectorAll('.db-ph .db-badge-emoji').forEach(function (el) { if (el.textContent === ch) el.style.translate = INK[ch]; });
    });
  }
  function cupIcon(key) { return window.__minkaCoffeeIcon ? window.__minkaCoffeeIcon(key || 'cupcoffee') : PX.coffee; }
  // the drink this person takes most this month, for the calendar's key (days show their own drinks)
  function topPersonDrink(any) {
    var sum = {}, mon = state.month ? state.month.slice(5, 7) + '.' + state.month.slice(0, 4) : '';
    Object.keys(personCups.details || {}).forEach(function (day) {
      if (!any && mon && day.slice(3) !== mon) return;
      var d = personCups.details[day] || {};
      Object.keys(d).forEach(function (k) { if (M.norm(k) !== personCups.who) return; var src = (d[k] || {}).sources || {}; Object.keys(src).forEach(function (t) { sum[t] = (sum[t] || 0) + (Number(src[t]) || 0); }); });
    });
    return Object.keys(sum).sort(function (a, b) { return sum[b] - sum[a]; })[0] || (any ? 'cupcoffee' : topPersonDrink(true));
  }
  function dayCoffee(day) {
    if (!personCups) return '';
    var key = day.slice(8) + '.' + day.slice(5, 7) + '.' + day.slice(0, 4), c = personCups.counts[key];
    if (!c) return '';
    var name = Object.keys(c).filter(function (k) { return M.norm(k) === personCups.who; })[0];
    var cups = name ? Math.max(0, Number(c[name]) || 0) : 0;
    if (!cups) return '';
    var src = ((personCups.details[key] || {})[name] || {}).sources || {};
    return '<span class="db-px-coffee" title="' + cups + (cups === 1 ? ' dzēriens' : ' dzērieni') + '">' + (Object.keys(src).length ? sourceChips(src) : cupIcon() + '<b>' + cups + '</b>') + '</span>';
  }
  function cellSub(r, mode) {
    if (mode === 'shift') {
      // One person's month: the shift spelled out, same cell height on every day.
      // the shift in its colour with its sign, and a bolus change as the dock's bolus picture with its room
      return '<small>' + r.shifts.map(function (e) { return '<span class="db-px-shift is-' + (e.type === '24h' ? 'allday' : e.type) + '">' + (e.type === 'night' ? MOON : e.type === 'day' ? SUN : '') + (e.type === '24h' ? '24 h' : SHIFT[e.type].label + ' ' + e.hours + ' h') + '</span>'; }).join(' ') + '</small>'
        + dayCoffee(r.day)
        + (r.bolus.length ? '<span class="db-px-boluses">' + r.bolus.map(function (e) { return '<span class="db-px-bolus is-' + (e.room === 'ge' ? 'ge' : 'ph') + '" title="Bolusa maiņa ' + (e.room === 'ge' ? 'GE' : 'Philips') + '">' + dockIcon('bolusDocBtn') + '<b>' + (e.room === 'ge' ? 'GE' : 'PH') + '</b></span>'; }).join('') + '</span>' : '');
    }
    // Team view: how many people are on duty by day and by night (the chosen group only), a sun and a moon with
    // the number; a 24h shift counts for both.
    var n = duty(r);
    if (!n.day && !n.night) return '';
    return '<span class="db-px-duty"><i>' + SUN + '</i><b>' + n.day + '</b><i>' + MOON + '</i><b>' + n.night + '</b></span>';
  }
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.6"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z"/></svg>';
  function calLegend() {
    var who = state.group === 'all' ? '' : ' (' + GROUP[state.group].label.toLowerCase() + ')';
    return '<span class="db-cal-key"><span class="is-sun">' + SUN + 'cilvēki dežūrā dienā' + who + '</span><span class="is-moon">' + MOON + 'naktī</span></span>';
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
        title += ' ' + m.label + ' (' + r.mood.total + (r.mood.total === 1 ? ' reakcija)' : ' reakcijas)');
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
      var head = '<span class="db-px-head"><b>' + Number(r.day.slice(8)) + '</b>' + face + '</span>';
      if (staff) { var dn = duty(r); title += '. Dežūrā dienā ' + dn.day + ', naktī ' + dn.night; }
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
  // the month's working hours (the same norm as Kalendārs), 0 when unknown
  function monthNorm(month) { month = month || state.month; try { return window.MinkaLvHolidays.workHours(+month.slice(0, 4), +month.slice(5, 7) - 1) || 0; } catch (_e) { return 0; } }
  function diffChip(h, norm) {
    var d = h - norm;
    return '<span class="db-diff' + (d > 0 ? ' is-over' : d < 0 ? ' is-under' : '') + '">' + (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + ' h</span>';
  }
  // who worked most: hours against the norm per group, the norm a mark on every bar
  function team(s) {
    var norm = monthNorm(), all = peopleOf(s), shifts = s.shifts.filter(function (e) { return state.group === 'all' || e.group === state.group; }).length;
    var out = hero('people', dockIcon('statsDocBtn'), fmt(all.reduce(function (n, p) { return n + p.hours; }, 0), 0) + ' h', 'nostrādātas šomēnes,<br>' + all.length + ' cilvēki',
      [norm ? fact(norm + ' h', 'mēneša norma') : '', norm ? fact(all.filter(function (p) { return p.hours > norm; }).length, 'virs normas') : '', fact(shifts, 'maiņas grafikā')]);
    ['rg', 'rd'].forEach(function (g) {
      if (state.group !== 'all' && state.group !== g) return;
      var people = s.people.filter(function (p) { return s.shifts.some(function (e) { return e.group === g && M.norm(e.name) === M.norm(p.name); }); })
        .sort(function (a, c) { return c.hours - a.hours || a.name.localeCompare(c.name, 'lv'); });
      if (!people.length) return;
      var max = Math.max(norm * 1.25, Math.round(people[0].hours));
      out += section(GROUP[g].label, people.length + ' cilvēki' + (norm ? legend([['līdz normai', 'is-main'], ['virs normas', 'is-over'], ['norma', 'is-mark']]) : ''), rank(people.map(function (p) {
        var h = Math.round(p.hours);
        return { name: esc(shortName(p.name)), person: p.name, segs: norm ? [[Math.min(h, norm), 'is-main'], [h - norm, 'is-over']] : [[h, 'is-main']], total: h, totalText: h + ' h',
          extra: (norm ? diffChip(h, norm) : '') + '<small>' + p.shifts + ' maiņas</small>' };
      }), { mark: norm, max: max, cls: 'is-norm' }));
    });
    return out + (all.length ? '' : empty('Šim mēnesim grafikā nav maiņu.'));
  }

  /* ── views ────────────────────────────────────────────────────────────── */
  /* ── the answers page (the user's pick, concept A, then the user's mockup): one page, no tabs. Each answer is an
     organic tonal card (its own shape and colour role), a big number and one small picture, with the dock's own
     icons (toned in the card's on-colour); a card opens its detail with a back bar. ── */
  function dockIcon(id) { try { var f = window.parent && window.parent.__mkDockIcon; return f ? opticalCenter(f(id).replace(/ fill="#[0-9a-f]{6}"/gi, '')) : ''; } catch (_e) { return ''; } }
  // A pixel icon centred by its frame looks off when its pixels lean one way (the radio's antenna): centre it halfway
  // between the frame's middle and the pixels' weight, on a square view big enough to keep every pixel.
  function opticalCenter(svg) {
    var re = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g, m, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, a = 0, ax = 0, ay = 0;
    while ((m = re.exec(svg))) {
      var x = +m[1], y = +m[2], w = Math.round(+m[3]), h = Math.round(+m[4]);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h);
      a += w * h; ax += (x + w / 2) * w * h; ay += (y + h / 2) * w * h;
    }
    if (!a) return svg;
    var cx = ((x0 + x1) / 2 + ax / a) / 2, cy = ((y0 + y1) / 2 + ay / a) / 2;
    var side = Math.max(2 * Math.max(cx - x0, x1 - cx), 2 * Math.max(cy - y0, y1 - cy));
    return svg.replace(/viewBox="[^"]*"/, 'viewBox="' + (cx - side / 2).toFixed(2) + ' ' + (cy - side / 2).toFixed(2) + ' ' + side.toFixed(2) + ' ' + side.toFixed(2) + '"');
  }
  // the few icons the dock has no button for, drawn the dock's way: letters for its three tones (l, m, d)
  function pxIcon(rows) {
    var out = '';
    rows.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var t = row[x]; if (t !== '.') out += '<rect x="' + x + '" y="' + y + '" width="1.04" height="1.04" data-t="' + t + '"/>'; } });
    return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>';
  }
  var PX = {
    fatigue: pxIcon(['....lll..', '...lll...', '..lll....', '.lllllll.', '....lll..', '...lll...', '..lll....', '.ll......', 'l........']),
    coffee: pxIcon(['..m..m...', '...m..m..', '.........', 'lllllll..', 'lllllllll', 'lllllll.l', 'lllllllll', '.lllll...', 'llllllll.'])
  };
  /* A card: the M3 shape scale (css: 48 for the big ones, 32 for the hours and coffee, full for the pills) and, behind
     two of them, a round lighter lobe peeking out (a circle: one smooth curve, nothing stretched) */
  function card(key, look, blob, icon, title, body, lobe) {
    return '<button type="button" class="db-card is-' + look + ' is-k-' + key + '" data-db-open="' + key + '">' + (lobe ? '<svg class="db-card-lobe" viewBox="0 0 100 100" aria-hidden="true"><path d="' + shapePath(key) + '"/></svg>' : '')
      + '<span class="db-card-head">' + badge(key, icon, 'db-card-ic') + '<b>' + title + '</b>' + ICON.next + '</span>' + (body || '') + '</button>';
  }
  function moodAverage(rows) {
    var w = rows.reduce(function (acc, r) { if (r.mood) { acc.sum += r.mood.score * r.mood.total; acc.n += r.mood.total; } return acc; }, { sum: 0, n: 0 });
    return w.n ? w.sum / w.n : null;
  }
  function peopleOf(s) {
    return s.people.filter(function (p) { return s.shifts.some(function (e) { return (state.group === 'all' || e.group === state.group) && M.norm(e.name) === M.norm(p.name); }); });
  }
  /* The answers page in the Pixel apps' expressive language (the user's reference): the month's name as a display
     headline, the team's feeling as one big shape beside it, the month's figures as big shapes of their own size and
     tonal role (no row of equal boxes), the people who worked most as one tonal list. Every figure opens its detail. */
  function overview(b) {
    var s = b.s, rows = b.rows, past = elapsedDays(rows, b.today), out = [];
    // the team's rating: the word, five steps, a dot a day
    var avg = moodAverage(rows), m = avg == null ? null : M.moodFor(avg);
    var marked = past.filter(function (r) { return r.mood || ownMood(r.day); }).length;
    out.push(card('mood', 'mood', 'a', ms('sentiment_satisfied'), 'Kā jūtas komanda?', '<span class="db-big">' + (m ? m.label : 'Nav vērtēts') + '</span>'
      + '<span class="db-scale" role="img" aria-label="' + (m ? 'Vērtējums ' + m.score + ' no 5' : 'Nav vērtējuma') + '">' + [1, 2, 3, 4, 5].map(function (k) { return '<i' + (m && k <= m.score ? ' class="is-on"' : '') + '></i>'; }).join('') + '<em>' + (m ? m.score + ' no 5' : '') + '</em></span>'
      + '<span class="db-card-sub">' + marked + ' no ' + past.length + ' dienām novērtētas</span>'
      + '<span class="db-dots" style="--n:' + rows.length + '">' + rows.map(function (r) { var c = r.mood ? M.moodFor(r.mood.score).color : ''; return '<i' + (c ? ' style="background:' + c + '"' : '') + (r.day > b.today ? ' class="is-future"' : '') + '></i>'; }).join('') + '</span>', true));
    // Bolus: the month's changes, the two rooms as one indicator, who changed most
    if (!IS_RAD) {
      var ge = s.bolus.filter(function (e) { return e.room === 'ge'; }).length, ph = s.bolus.length - ge;
      var top = s.people.slice().sort(function (a, c) { return (c.ge + c.philips) - (a.ge + a.philips); })[0];
      out.push(card('bolus', 'bolus', 'b', dockIcon('bolusDocBtn'), 'Bolus maiņas', '<span class="db-big">' + s.bolus.length + '<small>šomēnes</small></span>'
        + (s.bolus.length ? '<span class="db-split"><i style="flex:' + ge + '"></i><i style="flex:' + ph + '"></i></span><span class="db-key"><span class="is-ge">GE ' + ge + '</span><span class="is-ph">PH ' + ph + '</span></span>' : '')
        + (top && top.ge + top.philips ? mini('clover', initials(top.name), esc(formatName(shortName(top.name))), 'mainīja visbiežāk, ' + (top.ge + top.philips) + (top.ge + top.philips === 1 ? ' reizi' : ' reizes')) : '')));
    }
    // fatigue: hours a person spent very tired this month, on average
    var ff = fatigueFacts();
    out.push(card('fatigue', 'fatigue', 'c', PX.fatigue, 'Nogurums', ff === 'wait' ? '<span class="db-big">…</span><span class="db-card-sub">Rēķina…</span>'
      : ff ? '<span class="db-big">' + ff.perPerson + ' h</span><span class="db-card-sub">tik stundas šomēnes katrs bija ļoti noguris (vidēji)</span>'
        + (ff.heavyPeople ? mini('sunny', ff.heavyDay.replace(/\.$/, ''), 'Smagākā diena', tired(ff.heavyPeople) + ',<br>vidēji ' + ff.heavyEach + ' stundas no 24') : '')
      : '<span class="db-card-sub">Nav datu</span>', true));
    // hours against the month's norm (the same norm as Kalendārs): up to the norm, a mark at it, the overtime past it
    var ppl = peopleOf(s).sort(function (a, c) { return c.hours - a.hours || a.name.localeCompare(c.name, 'lv'); });
    var norm = monthNorm();
    var scale = Math.max(norm * 1.25, ppl[0] ? ppl[0].hours : 0) || 1, pct = function (v) { return (Math.max(0, v) / scale * 100).toFixed(2) + '%'; };
    out.push(card('people', 'people', 'd', dockIcon('statsDocBtn'), 'Stundas pret normu' + (norm ? ' <span class="db-card-norm">Norma ' + norm + ' h</span>' : ''), ppl.length ? '<span class="db-norms">' + ppl.slice(0, 6).map(function (p) {
      var h = Math.round(p.hours), diff = norm ? h - norm : 0;
      return '<span class="db-norms-row">' + avatar(p.name) + '<b>' + esc(shortName(p.name)) + '</b>'
        + '<span class="db-norm"' + (norm ? ' style="--n:' + pct(norm) + '"' : '') + '><i style="width:' + pct(norm ? Math.min(h, norm) : h) + '"></i>' + (diff > 0 ? '<i class="is-over" style="width:' + pct(diff) + '"></i>' : '') + '</span>'
        + '<em>' + h + ' h</em>' + (norm ? '<span class="db-diff' + (diff > 0 ? ' is-over' : diff < 0 ? ' is-under' : '') + '">' + (diff > 0 ? '+' : diff < 0 ? '−' : '±') + Math.abs(diff) + ' h</span>' : '') + '</span>';
    }).join('') + '</span>' : '<span class="db-card-sub">Šomēnes grafikā nav maiņu.</span>'));
    // coffee: cups this month, the drink most taken
    var month = coffeeMonth(b), cups = month.people.reduce(function (n, p) { return n + p.cups; }, 0), src = {};
    month.people.forEach(function (p) { Object.keys(p.sources).forEach(function (k) { src[k] = (src[k] || 0) + p.sources[k]; }); });
    // the mockup's second row: the hours (left), coffee with its big number, radio and nights as two pills
    var mg = month.people.reduce(function (n, p) { return n + (p.mg || 0); }, 0), cents = month.people.reduce(function (n, p) { return n + p.cents; }, 0);
    var topDrink = Object.keys(src).sort(function (a, c) { return src[c] - src[a]; })[0] || 'philips', drinkPic = window.__minkaCoffeeIcon ? window.__minkaCoffeeIcon(topDrink) : '';
    out.push(card('coffee', 'coffee', 'e', drinkPic || PX.coffee, 'Kafija', '<span class="db-big">' + (cups || (coffee.busy ? '…' : '0')) + '<small>tases šomēnes</small></span>'
      + (cups ? '<span class="db-cdrinks">' + sourceChips(src) + '</span><span class="db-cfacts">' + fact(mgText(mg), 'kofeīns') + fact(eur(cents), 'iztērēts') + '</span>' : '<span class="db-card-sub">Šomēnes vēl nav atzīmētu dzērienu.</span>')));
    var pills = [card('radio', 'pill', 'b', dockIcon('radioIdleBtn'), 'Radio ' + rows.filter(function (r) { return r.radio.length; }).length, '<span class="db-card-sub">dienas ar radio</span>')];
    if (!IS_RAD) {
      var nights = s.shifts.filter(function (e) { return (e.type === 'night' || e.type === '24h') && (state.group === 'all' || e.group === state.group); }).length;
      pills.push(card('night', 'pill', 'a', dockIcon('nsToggleBtnParent'), 'Naktis ' + nights, '<span class="db-card-sub">nakts maiņas šomēnes</span>'));
    }
    out.push('<div class="db-stack">' + pills.join('') + '</div>');
    return '<div class="db-cards">' + out.join('') + '</div>';
  }
  // the old overview's feeling part, now the feeling card's detail
  // the reactions' own light tones (dark text on them), one per mood
  var MOOD_TINT = { excellent: '#b9f6c9', good: '#a6eed8', ok: '#cfe6ff', bad: '#ffd6a1', terrible: '#ffb8c2' };
  function moodView(b) {
    var s = b.s, rows = b.rows, past = elapsedDays(rows, b.today), total = s.reactionTotal || 0;
    var loading = ratingsJob ? '<span class="db-loading">Ielādē sajūtas ' + ratingsJob.done + '/' + ratingsJob.total + '…</span>' : '';
    var avg = moodAverage(rows), m = avg == null ? null : M.moodFor(avg);
    var marked = past.filter(function (r) { return r.mood || ownMood(r.day); }).length;
    var any = total || rows.some(function (r) { return ownMood(r.day); });
    // the reactions as one connected row: the total in a circle, then a pill per mood that was chosen
    var pills = M.MOODS.slice().reverse().map(function (mo) {
      var n = s.reactions.reduce(function (sum, e) { return sum + e.counts[mo.key]; }, 0);
      return n ? '<span class="db-rx-pill" style="--t:' + MOOD_TINT[mo.key] + '"><span class="db-face">' + mo.emoji + '</span><span><b>' + Math.round(n / total * 100) + '%</b><small>' + mo.label + '</small></span></span>' : '';
    }).join('');
    var lead = '<div class="db-hero is-mood db-mlead"><span class="db-face db-mlead-face">' + (m ? m.emoji : '😶') + '</span>'
      + '<span class="db-mlead-word"><b class="db-hero-title">Komandas sajūta</b><span class="db-mword" style="--t:' + (m ? MOOD_TINT[m.key] : '#d7e3dd') + '">' + (m ? m.label : 'Nav vērtēts') + '</span></span>'
      + '<span class="db-fact"><b>' + marked + ' no ' + past.length + '</b><small>dienām atzīmētas</small></span>'
      + '<span class="db-rx"><span class="db-rx-total"><b>' + total + '</b><small>' + (total === 1 ? 'reakcija' : 'reakcijas') + '</small></span>' + pills + '</span></div><!--lead-->';
    return lead
      + (any ? '<div class="db-mchart-card"><span class="db-mchart-cap">Dienas vidējā, lielāks punkts = vairāk reakciju' + (loading ? ' ' + loading : '') + '</span>' + moodChart(rows, b.today) + '</div>' : (loading ? '<p class="db-note">' + loading + '</p>' : ''))
      + '<div class="db-mgrid"><div class="db-mside">' + moodCounts(s) + ownMoodList(rows) + '</div>'
      + '<div class="db-cal"><div class="db-cal-head"><h3>' + monthLabel(state.month) + '</h3>' + calLegend() + '</div>' + pixels(rows, b.today, 'mood')
      + '<span class="db-cal-hint">Spied uz dienas, lai redzētu detaļas</span></div></div>';
  }
  function bolusView(b) {
    var s = b.s;
    var perPerson = s.people.filter(function (p) { return p.ge + p.philips; }).sort(function (a, c) { return (c.ge + c.philips) - (a.ge + a.philips) || a.name.localeCompare(c.name, 'lv'); })
      .map(function (p) { return { name: esc(shortName(p.name)), person: p.name, segs: [[p.ge, 'is-ge'], [p.philips, 'is-ph']], total: p.ge + p.philips, extra: '<span class="is-ge">GE ' + p.ge + '</span><span class="is-ph">PH ' + p.philips + '</span>' }; });
    var ge = s.bolus.filter(function (e) { return e.room === 'ge'; }).length, ph = s.bolus.length - ge, pg = s.bolus.length ? Math.round(ge / s.bolus.length * 100) : 0;
    return hero('bolus', dockIcon('bolusDocBtn'), s.bolus.length, 'Bolusa maiņas<br>izvēlētajā mēnesī', [bun(ge, 'GE' + (s.bolus.length ? ', ' + pg + '%' : ''), ph, 'Philips' + (s.bolus.length ? ', ' + (100 - pg) + '%' : ''))])
      + section('Pēc cilvēka', legend([['GE', 'is-ge'], ['Philips', 'is-ph']]), rank(perPerson, { empty: 'Šomēnes neviens nav mainījis bolusu.' }))
      + section('Visas maiņas', s.bolus.length + ' ieraksti', (s.bolus.length ? capped('<div class="db-mlist">', s.bolus.map(function (e) {
        var ge = e.room === 'ge', at = new Date(e.ts).toLocaleString('lv-LV', { timeZone: 'Europe/Riga', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        return '<div class="db-mitem"><span class="db-room ' + (ge ? 'is-ge' : 'is-ph') + '">' + (ge ? 'GE' : 'PH') + '</span><span class="db-mtext"><b>' + esc(formatName(e.name)) + '</b><small>' + (ge ? 'GE' : 'Philips') + ', ' + esc(at) + '</small></span>'
          + '<button type="button" class="db-daychip" data-db-day="' + e.day + '">' + shortDay(e.day) + '</button></div>';
      }), '</div>', CAP) : empty('Šajā periodā ierakstu nav.')) + note('Bolusa vēsture no ierīcē sinhronizētajiem ierakstiem. Maiņa pirms 08:00 pieder iepriekšējai dežūras dienai.'), '#ff5c5c');
  }
  function radioView(b) {
    var s = b.s, past = elapsedDays(b.rows, b.today).length || 1;
    var items = s.stations.map(function (e) { return { name: esc(e.name), segs: [[e.count, 'is-main']], total: e.count, extra: e.count === 1 ? 'diena' : 'dienas' }; });
    var withRadio = b.rows.filter(function (r) { return r.radio.length; }).length, top = s.stations[0];
    return hero('radio', dockIcon('radioIdleBtn'), withRadio, 'dienas ar radio<br>no ' + past, [fact(s.stations.length || '—', 'stacijas šomēnes'), top ? fact(esc(top.name), 'biežākā, ' + top.count + (top.count === 1 ? ' diena' : ' dienas')) : ''])
      + section('Mēnesis', withRadio + ' dienas ar radio', radioStrip(b))
      + section('Stacijas', s.stations.length > 8 ? 'top 8' : '', rank(items, { empty: 'Šomēnes radio nav pierakstīts.', cls: 'is-radio' }) + note('Stacija tiek pierakstīta, kad tā sāk skanēt. Klausīšanās ilgums netiek mērīts.'));
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
  /* Sources are stored in whole caffeine cups (a 500 ml Monster = 2, as the coffee
     menu counts them; a Brite is stored as 1, its 1.25 is only for the mg). Next to a drink's icon the number is drinks —
     cans and cups — like the card's own coffee menu; the "tases" total stays cups. */
  var COFFEE_EQ = { monster: 2, monsterultra: 2, dynamit: 2, kongstrong: 2 };
  function drinks(key, units) { var n = (Number(units) || 0) / (COFFEE_EQ[key] || 1); return n > 0 ? Math.max(1, Math.round(n)) : 0; }
  function sourceChips(sources) {
    var icon = window.__minkaCoffeeIcon;
    var parts = COFFEE_SOURCES.filter(function (d) { return (Number(sources && sources[d[0]]) || 0) > 0; }).map(function (d) {
      var n = drinks(d[0], sources[d[0]]);
      return '<span class="db-csrc" title="' + d[1] + '">' + (icon ? icon(d[0]) : '<small>' + d[1] + '</small>') + '<b>' + n + '</b></span>';
    });
    return parts.length ? parts.join('') : '<span class="db-dim">—</span>';
  }
  // Caffeine through the calendar's own calculation (calendar.js coffeeSourcesMg:
  // a Monster 160 mg, a Brite 100 mg); 1 g and up reads in grams.
  function caffeineMg(sources) { return window.__minkaCoffeeMg ? window.__minkaCoffeeMg(sources || {}) : 0; }
  function mgText(mg) { return mg >= 1000 ? (Math.round(mg / 100) / 10).toLocaleString('lv-LV') + ' g' : Math.round(mg) + ' mg'; }
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
        + '<span class="db-coffee-mg' + (p.over ? ' is-over' : '') + '"><b>' + mgText(p.mg || 0) + '</b>'
          + '<small>' + (p.over ? p.over + ' d. &gt; 400 mg' : 'kofeīns') + '</small>'
          + (p.over ? '<i class="db-mg-tip" role="tooltip">' + p.over + (p.over === 1 ? ' dienā' : ' dienās') + ' kofeīns pārsniedza drošo dienas devu <b>400 mg</b></i>' : '') + '</span>'
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
        var p = people[M.norm(name)] || (people[M.norm(name)] = { name: byKey[M.norm(name)] || name, cups: 0, cents: 0, sources: {}, mg: 0, over: 0 });
        p.cups += Math.max(0, Number(counts[key][name]) || 0);
        var d = det[name] || {};
        p.cents += Math.max(0, Number(d.spendCents) || 0);
        Object.keys(d.sources || {}).forEach(function (k) { p.sources[k] = (p.sources[k] || 0) + (Number(d.sources[k]) || 0); });
        var dayMg = caffeineMg(d.sources);
        p.mg += dayMg;
        if (dayMg > 400) p.over++;
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
      return { name: byKey[k] || k, cups: totals[k], cents: d.spendCents || 0, sources: d.sources || {}, mg: caffeineMg(d.sources) };
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
      fetch(String(window.MINKA_COFFEE_API_BASE || 'https://coffee.rgapp.page').replace(/\/+$/, '') + '/api/coffee?totals=1', { cache: 'no-store' })
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
    var mg = month.people.reduce(function (n, p) { return n + (p.mg || 0); }, 0);
    // the month in four coloured figures, each with its symbol (the user's reference)
    var big = function (look, icon, value, label) { return '<div class="db-cbig is-' + look + '">' + ms(icon) + '<span><b>' + value + '</b><small>' + label + '</small></span></div>'; };
    return '<div class="db-cbigs">' + big('cups', 'f_local_cafe', cups || (coffee.busy ? '…' : '—'), 'Tases šomēnes') + big('mg', 'f_bolt', mg ? mgText(mg) : '—', 'Kofeīns šomēnes')
      + big('eur', 'f_euro', eur(cents), 'Iztērēts šomēnes') + big('people', 'f_group', drinkers || '—', 'Cilvēki šomēnes') + '</div>'
      + (cups ? '<div class="db-coffee-sum">' + sourceChips(sum) + '</div>' : '')
      + section(monthLabel(state.month), coffee.busy ? '<span class="db-loading">Ielādē…</span>' : '', coffeeRows(month.people))
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
    var monthNights = Object.keys(nightsBy).sort(function (a, c) { return nightsBy[c] - nightsBy[a] || a.localeCompare(c, 'lv'); })
      .map(function (n) { return { name: esc(shortName(n)), person: n, segs: [[nightsBy[n], 'is-main']], total: nightsBy[n], extra: nightsBy[n] === 1 ? 'nakts' : 'naktis' }; });
    var lead = hero('night', dockIcon('nsToggleBtnParent'), monthNights.reduce(function (n, e) { return n + e.total; }, 0) || '—', 'nakts maiņas<br>šomēnes grafikā',
      [fact(st && st.nights ? st.nights : '—', 'sadalītas naktis visā vēsturē'), fact(st ? Object.keys(st.parts).length : '—', 'cilvēki nakts vēsturē')]);
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
    return lead
      + section('Kurš kuru daļu ņem', 'visā vēsturē', loading || parts, '#23cdcf')
      + (st ? section('Gultas', 'kurš guļ kurās gultās visbiežāk', beds, '#23cdcf') : '')
      + section('Naktis šomēnes', monthLabel(state.month), rank(monthNights, { empty: 'Šomēnes grafikā nav nakts maiņu.', cls: 'is-night' }))
      + note('Daļu un gultu skaits ir no nakts sadalījuma vēstures (visas naktis kopā, ne pa mēnešiem). Nakts maiņas — no grafika.');
  }
  /* Fatigue: the worker card's model (fatigue.js) for the whole team. The
     team chart on top, then one ranked bar per person: the hours they spent awake at Augsts or above.
     A row opens the person with their full hourly curve. Radiographers only,
     as the model is built for them. The model costs a few ms per person, so a
     cold month is warmed person by person between frames (ensureFatigue). */
  function fatigueApi() { return window.__fatigue && window.__fatigue.monthSeries ? window.__fatigue : null; }
  function fatColor(v) { var F = fatigueApi(); return F ? F.getPresentation(v).color : '#ff9f43'; }
  // The same language as the worker's month curve (fatigue.js monthCurveHtml):
  // the lived part solid, the forecast dashed and fainter. With the forecast
  // drawn, the first day of a month still has a line (it used to need two
  // lived days and showed nothing on the 1st).
  var fatigueJob = null;
  function fatigueMeta() {
    var L = window.MinkaLevels;
    try { return L && L.fatigueNames ? L.fatigueNames(monthLabel(state.month).toUpperCase()) : null; } catch (_e) { return null; }
  }
  function fatigueMissing(meta) {
    var F = fatigueApi();
    if (!F || !meta) return [];
    return meta.names.filter(function (n) { return !F.isMonthSeriesReady(n, meta.year, meta.mm); });
  }
  function ensureFatigue() {
    var meta = fatigueMeta(), todo = fatigueMissing(meta);
    if (fatigueJob || !todo.length) return;
    var month = state.month, F = fatigueApi();
    fatigueJob = { done: 0, total: todo.length };
    (function step() {
      var until = performance.now() + 12;
      while (todo.length && performance.now() < until) { try { F.monthSeries(todo.shift(), meta.year, meta.mm, 1); } catch (_e) {} fatigueJob.done++; }
      if (todo.length && modalOpen() && state.month === month) { setTimeout(step, 0); return; }
      fatigueJob = null;
      if (modalOpen() && state.month === month) render();
    })();
  }
  /* Team month: per day, the hours the team spent awake at Augsts (above
     45) and Kritisks (above 70), summed over people. A team mean sits flat
     near 48 (rest days pull it down) and nearly everyone touches 45 some
     evening, so a count of people would be flat too; hours show heavy days. */
  function teamFatigue(data) {
    var F = fatigueApi(), lv = F.FATIGUE_LEVELS, high = lv[1].max, crit = lv[2].max;
    var days = [];
    for (var d = 0; d < data.daysIn; d++) days.push({ high: 0, crit: 0, total: 0, people: 0 });
    data.names.forEach(function (name) {
      var s = data.series[name], seen = {};
      s.samples.forEach(function (v, i) {
        if (!v || v.asleep || v.score <= high) return;
        var k = Math.floor(i * s.stepHours / 24), day = days[k];
        if (!day) return;
        if (v.score > crit) day.crit += s.stepHours; else day.high += s.stepHours;
        day.total += s.stepHours;
        if (!seen[k]) { seen[k] = 1; day.people++; }   // how many people were very tired that day
      });
    });
    return { days: days, n: data.names.length, high: high, crit: crit };
  }
  function teamFatigueChart(data, team) {
    var W = data.daysIn, max = Math.max(4, Math.max.apply(null, team.days.map(function (d) { return d.total; })));
    var stepY = max > 40 ? 20 : max > 16 ? 10 : 4, top = Math.ceil(max / stepY) * stepY, bars = '', we = '', ticks = '', grid = '';
    team.days.forEach(function (d, i) {
      var date = new Date(data.year, data.mm - 1, i + 1), dow = date.getDay(), future = data.todayIdx >= 0 && i > data.todayIdx;
      if (dow === 0 || dow === 6) we += '<rect x="' + i + '" y="0" width="1" height="100" class="db-ft-we"/>';
      var hh = d.high / top * 100, ch = d.crit / top * 100;
      if (d.high) bars += '<rect x="' + (i + .18) + '" y="' + (100 - hh - ch).toFixed(2) + '" width=".64" height="' + hh.toFixed(2) + '" class="db-ft-h' + (future ? ' is-future' : '') + '"/>';
      if (d.crit) bars += '<rect x="' + (i + .18) + '" y="' + (100 - ch).toFixed(2) + '" width=".64" height="' + ch.toFixed(2) + '" class="db-ft-c' + (future ? ' is-future' : '') + '"/>';
      if (dow === 1 || i === 0) ticks += '<span style="left:' + ((i + .5) / W * 100).toFixed(2) + '%">' + (i + 1) + '.' + data.mm + '.</span>';
    });
    for (var g = stepY; g <= top; g += stepY) grid += '<span class="db-ft-g" style="bottom:' + (g / top * 100).toFixed(2) + '%"><b>' + g + ' h</b></span>';
    var today = data.todayIdx >= 0 ? '<i class="db-ft-today' + (data.fullIdx - data.todayIdx >= 0 && data.fullIdx - data.todayIdx <= 1 ? ' is-by-moon' : '') + '" style="left:' + ((data.todayIdx + .5) / W * 100).toFixed(2) + '%"><b>Šodien</b></i>' : '';
    var moon = '<i class="db-ft-moon" style="left:' + ((data.fullIdx + .5) / W * 100).toFixed(2) + '%" title="Pilnmēness ' + (data.fullIdx + 1) + '.' + data.mm + '.">🌕</i>';
    return '<div class="db-ft"><div class="db-ft-plot" role="img" aria-label="Komandas stundas augstā noguruma zonā katru dienu">' + grid
      + '<svg viewBox="0 0 ' + W + ' 100" preserveAspectRatio="none" aria-hidden="true">' + we + bars + '</svg>' + today + moon + '</div>'
      + '<div class="db-ft-x" aria-hidden="true">' + ticks + '</div>'
      + '<div class="db-ft-key"><span class="is-h">Augsts (virs ' + team.high + ')</span><span class="is-c">Kritisks (virs ' + team.crit + ')</span>' + (data.todayIdx >= 0 ? '<span class="is-f">Prognoze</span>' : '') + '<span>' + team.n + ' cilvēku stundas nomodā kopā</span></div></div>';
  }
  // the month's fatigue in three numbers: 'wait' while it is being computed, null without data
  function fatigueFacts() {
    var F = fatigueApi(), meta = fatigueMeta();
    if (!F || !meta) return null;
    if (fatigueMissing(meta).length) { ensureFatigue(); return 'wait'; }
    var data = null;
    try { data = window.MinkaLevels.fatigueMonth(monthLabel(state.month).toUpperCase()); } catch (_e) {}
    if (!data) return null;
    var past = data.todayIdx >= 0 ? data.todayIdx + 1 : data.daysIn, team = teamFatigue(data), lived = team.days.slice(0, past), heavy = 0, now = Date.now();
    lived.forEach(function (d, i) { if (d.total > lived[heavy].total) heavy = i; });
    var people = data.names.map(function (name) { return F.monthSummary(data.series[name], now); }).filter(function (sum) { return sum && sum.peak; });
    var high = people.reduce(function (a, sum) { return a + sum.highHours; }, 0);
    var hd = lived[heavy] || { total: 0, people: 0 };
    return { perPerson: people.length ? Math.round(high / people.length) : 0, heavyDay: (heavy + 1) + '.' + data.mm + '.', heavyPeople: hd.people, heavyEach: hd.people ? Math.round(hd.total / hd.people) : 0 };
  }
  function fatigueView(b) {
    var F = fatigueApi(), meta = fatigueMeta();
    if (!F || !meta) return empty('Noguruma modelim šim mēnesim nav datu.');
    if (fatigueMissing(meta).length) {
      return '<div class="db-empty db-fat-wait">Rēķina nogurumu' + (fatigueJob ? ' ' + fatigueJob.done + ' / ' + fatigueJob.total : '') + '…</div>';
    }
    var L = window.MinkaLevels, label = monthLabel(state.month).toUpperCase();
    var data = null;
    try { data = L.fatigueMonth(label); } catch (_e) {}
    if (!data) return empty('Noguruma modelim šim mēnesim nav datu.');
    var mm = data.mm, now = Date.now(), past = data.todayIdx >= 0 ? data.todayIdx + 1 : data.daysIn;
    var team = teamFatigue(data), lived = team.days.slice(0, past);
    var heavy = 0;
    lived.forEach(function (d, i) { if (d.total > lived[heavy].total) heavy = i; });
    var people = data.names.map(function (name) {
      var sum = F.monthSummary(data.series[name], now);
      return { name: name, days: data.fatByDay[name], lived: past, sum: sum };
    }).filter(function (p) { return p.sum && p.sum.peak; })
      .sort(function (a, c) { return c.sum.highHours - a.sum.highHours || c.sum.peak.score - a.sum.peak.score; });
    var teamHigh = people.reduce(function (a, p) { return a + p.sum.highHours; }, 0);
    var perPerson = people.length ? Math.round(teamHigh / people.length) : 0;
    var hd = lived[heavy], td = data.todayIdx >= 0 ? team.days[data.todayIdx] : null;
    var lead = hero('fatigue', PX.fatigue, perPerson + ' h', 'tik stundas šomēnes katrs<br>bija ļoti noguris (vidēji)', [
      fact(hd.people, (hd.people === 1 ? 'cilvēks ļoti noguris' : 'cilvēki ļoti noguruši') + '<br>smagākajā dienā, ' + (heavy + 1) + '.' + mm + '.'),
      fact(td ? td.people : '—', td ? (td.people === 1 ? 'cilvēks ļoti noguris' : 'cilvēki ļoti noguruši') + '<br>šodien' : 'šodien<br>(cits mēnesis)')]);
    // one bar per person: hours very tired this month; the highest score in words beside it
    var rows = rank(people.map(function (p) {
      var pk = p.sum.peak;
      return { name: esc(shortName(p.name)), person: p.name, segs: [[p.sum.highHours, 'is-main']], total: p.sum.highHours, totalText: p.sum.highHours + ' h',
        extra: 'augstākais <b style="color:' + fatColor(pk.score) + '">' + pk.score + '</b>' };
    }), { empty: 'Šomēnes nav noguruma datu.', cls: 'is-fatigue' });
    return lead
      + section('Pa dienām', 'cik stundas komanda kopā bija ļoti nogurusi katrā dienā', teamFatigueChart(data, team))
      + section('Cilvēki', 'cik stundas katrs šomēnes bija ļoti noguris', rows)
      + note('Tas pats modelis, ko rāda cilvēka kartīte (0–100, virs 45 ir Augsts). Tā ir aplēse pēc grafika un pieņemta miega, nevis mērījums vai pašsajūta.');
  }
  // The person's month on the card's scale (drill-down from any tab).
  // The person's energy (or fatigue, as the switch says) in three plain numbers over the same month line as their card.
  function personFatigue(name) {
    var F = fatigueApi(), meta = fatigueMeta();
    if (!F || !meta || meta.names.indexOf(name) < 0) return { now: null, html: '' };
    var html = F.monthCurveHtml(name, meta.year, meta.mm);
    if (!html) return { now: null, html: '' };
    var sum = F.monthSummary(F.monthSeries(name, meta.year, meta.mm, 1));
    var pk = sum && sum.peak, d = pk ? new Date(pk.t) : null;
    var EN = !window.MkOutline || !window.MkOutline.energyView || window.MkOutline.energyView(), v = function (x) { return EN ? 100 - x : x; };
    // the number now goes to the person's lead; the month's two facts are one line beside the title
    return {
      now: sum.current == null ? null : { value: v(sum.current), label: EN ? 'enerģija tagad' : 'nogurums tagad', color: fatColor(sum.current) },
      html: section(EN ? 'Enerģija šomēnes' : 'Nogurums šomēnes', (EN ? 'zemā enerģijā ' : 'lielā nogurumā ') + sum.highHours + ' h'
        + (pk ? ', ' + (EN ? 'zemākā ' : 'augstākais ') + v(pk.score) + ' (' + d.getDate() + '.' + (d.getMonth() + 1) + '.)' : ''), '<div class="db-fmc">' + html + '</div>')
    };
  }
  // One person (the user's ask: easy to take in): who, how many hours against the norm, which shifts, their month as
  // a calendar of shifts (bolus marked on the day), then their energy.
  // One person's month as the green summary (the user's design: one surface, three zones; the emoji in a big mint
  // shape; the hours with the difference to the norm and a bar to it; the shifts by kind on top, the bolus changes and
  // the energy below). Used by the statistics' person view and by the worker window's energy tab, which passes
  // energy: false (its own tiles say it) and the hours it already counted. Shift kinds the data cannot tell show "—".
  function personHero(name, month, opts) {
    opts = opts || {};
    var range = M.monthRange(month), s = summaryFor(range, name, 'all');
    var group = s.shifts[0] ? GROUP[s.shifts[0].group] : GROUP.rg;
    var known = s.shifts.length > 0, c = typeCounts(s.shifts), p = s.people[0] || { ge: 0, philips: 0 }, bolus = p.ge + p.philips;
    var fat = opts.energy !== false && group === GROUP.rg && !IS_RAD ? personFatigue(name) : { now: null, html: '' };
    var norm = monthNorm(month), h = Math.round(opts.hours != null ? opts.hours : s.hours), emoji = '';
    try { emoji = (window.MinkaEmoji && window.MinkaEmoji.get && window.MinkaEmoji.get(name)) || ''; } catch (_e) {}
    var many = function (n, one, more) { return n % 10 === 1 && n % 100 !== 11 ? one : more; };
    // one line style for all five (2 px rounded strokes on a 24 grid)
    // vb/sw even out the optical size: a wider box draws the long syringe smaller, a narrower one the slim battery bigger,
    // with the stroke scaled back so every line reads 2 px
    var LI = function (d, vb, sw) { return '<svg class="db-ph-ico" viewBox="' + (vb || '0 0 24 24') + '"' + (sw ? ' style="stroke-width:' + sw + '"' : '') + ' aria-hidden="true">' + d + '</svg>'; };
    var I24 = LI('<path d="M19.4 8.6A8 8 0 1 0 20 12"/><path d="M20.6 4.4v4.6H16"/><text x="11.6" y="14.4" text-anchor="middle" font-size="6.4" font-weight="800">24h</text>');
    var ISUN = LI('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>');
    var IMOON = LI('<path class="is-fill" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>');
    var IBOLUS = LI('<path d="m18 2 4 4M17 7l3-3M19 9l-10.3 10.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>', '-2.5 -2.5 29 29', 2.4);
    var IBATT = LI('<path d="M10 2.5h4M8 4.5h8a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="m12.8 8.5-2.6 4.2h3.6l-2.6 4.2"/>', '2.5 2.5 19 19', 1.6);
    var item = function (cls, shape, icon, n, label, unit) { return '<span class="db-ph-item ' + cls + '">' + badge(shape, icon, 'db-ph-shape') + '<span class="db-ph-txt"><b>' + (known ? n : '—') + (unit || '') + '</b><small>' + label + '</small></span></span>'; };
    var diff = norm ? h - norm : 0, pct = norm ? Math.round(h / norm * 1000) / 10 : 0, top = Math.max(h, norm) || 1;
    var energy = fat.now;
    if (emoji && !INK[emoji]) requestAnimationFrame(function () { centerInk(emoji); });
    var html = '<div class="db-hero is-person db-ph' + (opts.slot ? ' has-slot' : '') + '">'
      // the user's exact outline; the lighter corner is a second path clipped to it, so the two share one edge
      + '<svg class="db-ph-bg" viewBox="0 0 1000 270" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="db-ph-clip"><path d="M0 100C0 42,40 10,96 10C135 10,151 3,190 3C236 3,254 22,300 22C340 22,355 7,395 7C464 7,491 25,560 25C619 25,641 4,700 4C736 4,749 13,785 13C835 13,854 6,904 6C966 6,1000 30,1000 90L1000 190C1000 248,970 262,904 262C860 262,844 250,800 250C733 250,707 267,640 267C583 267,562 252,505 252C432 252,404 265,330 265C278 265,258 247,205 247C159 247,142 259,96 259C36 259,0 240,0 190Z"/></clipPath></defs>'
      + '<path class="is-main" d="M0 100C0 42,40 10,96 10C135 10,151 3,190 3C236 3,254 22,300 22C340 22,355 7,395 7C464 7,491 25,560 25C619 25,641 4,700 4C736 4,749 13,785 13C835 13,854 6,904 6C966 6,1000 30,1000 90L1000 190C1000 248,970 262,904 262C860 262,844 250,800 250C733 250,707 267,640 267C583 267,562 252,505 252C432 252,404 265,330 265C278 265,258 247,205 247C159 247,142 259,96 259C36 259,0 240,0 190Z"/>'
      + '<path class="is-soft" clip-path="url(#db-ph-clip)" d="' + (opts.slot
        ? 'M270 290C400 290,455 262,470 222C477 196,478 142,505 130C532 118,570 116,610 116C650 116,700 132,760 132C820 132,860 116,910 116C950 116,985 124,1010 122L1010 290Z'
        : 'M330 290C470 290,522 262,536 222C542 202,542 154,570 142C598 130,612 124,640 124C668 124,712 146,750 146C788 146,822 122,860 122C898 122,930 144,960 144C985 144,1000 136,1010 132L1010 290Z') + '"/></svg>'
      + '<div class="db-ph-who">' + badge('person', emoji ? '<span class="db-face db-badge-emoji"' + (INK[emoji] ? ' style="translate:' + INK[emoji] + '"' : '') + '>' + esc(emoji) + '</span>' : '<b class="db-badge-txt">' + initials(name) + '</b>', 'is-xl') + '</div>'
      + '<div class="db-ph-hours"><div class="db-ph-row"><b class="db-ph-big">' + h + '<span class="db-ph-unit">h</span></b>'
      + (norm ? '<span class="db-ph-diff' + (diff < 0 ? ' is-under' : diff > 0 ? ' is-over' : '') + '"><b>' + (diff > 0 ? '+' : diff < 0 ? '−' : '±') + Math.abs(diff) + ' h</b><small>Norma ' + norm + ' h</small></span>' : '') + '</div>'
      + '<small class="db-ph-label">nostrādātas šomēnes</small>'
      + (norm ? '<div class="db-ph-progress"><span class="db-ph-bar' + (diff > 0 ? ' has-over' : '') + '"><i style="width:' + (Math.min(h, norm) / top * 100).toFixed(1) + '%"></i>' + (diff > 0 ? '<i class="is-over" style="width:' + (diff / top * 100).toFixed(1) + '%"></i>' : '') + '</span><span class="db-ph-pct"><b>' + h + '/' + norm + '</b><small>' + String(pct).replace('.', ',') + '%</small></span></div>' : '')
      + '</div>'
      + '<div class="db-ph-stats"><div class="db-ph-kinds">'
      + item('is-k24', 'clover', I24, c['24h'], many(c['24h'], 'diennakts maiņa', 'diennakts maiņas'))
      + item('is-kday', 'sunny', ISUN, c.day, many(c.day, 'dienas maiņa', 'dienas maiņas'))
      + item('is-knight', 'night', IMOON, c.night, many(c.night, 'nakts maiņa', 'nakts maiņas'))
      + '</div><div class="db-ph-more">'
      + item('is-kbolus', 'people', IBOLUS, bolus, many(bolus, 'bolusa maiņa', 'bolusa maiņas'))
      + (opts.slot ? '<div class="db-ph-slot"></div>' : '')   // the worker window puts its energy tiles here
      + (energy ? '<span class="db-ph-item is-kenergy" style="--ec:' + energy.color + '">' + badge('fatigue', IBATT, 'db-ph-shape') + '<span class="db-ph-txt"><b>' + energy.value + '<small>/100</small></b><small>' + energy.label + '</small></span></span>' : '')
      + '</div></div></div>';
    return { html: html, s: s, group: group, fat: fat };
  }
  function personView(b) {
    var name = state.person, hero = personHero(name, state.month), s = hero.s, group = hero.group, fat = hero.fat;
    var rows = M.dayRows(s, b.range.from, b.range.to);
    personCups = { counts: readJson(COFFEE_KEY), details: readJson(COFFEE_DETAILS_KEY), who: M.norm(name) };
    var lead = hero.html + '<!--lead-->';
    return withLead(backBar(esc(name), group.label), lead)
      + (state.tab === 'fatigue' ? fat.html : '')
      + section('Maiņas kalendārā', '<span class="db-pkey"><span class="db-px-shift is-day">' + SUN + 'Diena</span><span class="db-px-shift is-night">' + MOON + 'Nakts</span><span class="db-px-shift is-allday">24 h</span><span class="db-px-bolus is-ge">' + dockIcon('bolusDocBtn') + '<b>GE</b></span><span class="db-px-bolus is-ph">' + dockIcon('bolusDocBtn') + '<b>PH</b></span><span>bolusa maiņa</span><span class="db-px-coffee">' + cupIcon(topPersonDrink()) + '<b>dzērieni</b></span></span>', '<div class="db-cal db-pcal">' + pixels(rows, b.today, 'shift') + '</div>')
      + (state.tab === 'fatigue' ? '' : fat.html);
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
    if ((state.day || (!state.person && (state.tab === 'overview' || state.tab === 'mood'))) && Object.keys(ratingsFailed).some(inView)) missing.push('pašsajūtas');
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
  // the month, the groups and the search sit in the window's own title row (before Aizvērt), so the answers start a
  // row higher; without that row (an old page) they stay on top of the scroll area as before
  function mountChrome(wrap, names) {
    wrap.classList.add('db-stats');
    wrap.innerHTML = '<div class="db-body" id="db-panel" role="tabpanel" tabindex="-1"></div>';
    var head = document.querySelector('#stats-modal .mk-stats-head'), close = head && head.querySelector('.mk-stats-close');
    var old = head && head.querySelector('.db-chrome');
    if (old) old.remove();
    if (close) close.insertAdjacentHTML('beforebegin', header(names)); else wrap.insertAdjacentHTML('afterbegin', header(names));
    var bar = close ? head : wrap;
    chrome = {
      wrap: wrap,
      bar: bar,
      body: wrap.querySelector('.db-body'),
      month: bar.querySelector('[data-db-month]'),
      select: bar.querySelector('[data-db-person-select]'),
      list: bar.querySelector('#db-people'),
      names: names.join('|')
    };
  }
  function syncChrome(names) {
    chrome.month.textContent = monthLabel(state.month);
    chrome.bar.querySelectorAll('[data-db-group]').forEach(function (b) { b.setAttribute('aria-pressed', String(state.group === b.dataset.dbGroup)); });
    var key = names.join('|');
    if (key !== chrome.names) { chrome.names = key; chrome.list.innerHTML = personOptions(names); }
    if (document.activeElement !== chrome.select) chrome.select.value = state.person || '';
  }
  function bodyMotion(kind, info) {
    var MM = window.MinkaMotion, body = chrome.body;
    if (!MM || !kind || kind === 'refresh') return null;
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
    return DETAILS[want] ? want : 'overview';
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
      var mounted = chrome;
      requestAnimationFrame(function () {
        setTimeout(function () { if (chrome === mounted && modalOpen()) render('reveal'); }, 0);
      });
      return;
    }
    var b = build();
    var names = Array.from(new Set(shiftsAll().filter(function (e) { return e.day >= b.range.from && e.day <= b.range.to; }).map(function (e) { return e.name; }))).sort(function (a, c) { return a.localeCompare(c, 'lv'); });
    var body;
    var VIEW = { mood: moodView, bolus: bolusView, fatigue: fatigueView, people: function (x) { return team(x.s); }, coffee: coffeeView, radio: radioView, night: nightView };
    if (state.day) body = dayView(b);
    else if (state.person) body = personView(b);
    else if (DETAILS[state.tab]) body = withLead(backBar(DETAILS[state.tab], monthLabel(state.month)), VIEW[state.tab](b));
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
    }
    if (state.day) {
      ensureRatings(state.day <= b.today ? [state.day] : []);
    } else if (!state.person && (state.tab === 'overview' || state.tab === 'mood')) {
      ensureRatings(elapsedDays(b.rows, b.today).map(function (r) { return r.day; }));
    }
    ensureRadio(state.month);
    if (state.tab === 'night' && !state.day && !state.person) ensureNight();
    if (state.tab === 'fatigue' && !state.day && !state.person) ensureFatigue();
    // Coffee days come from the API on demand; opening the stats (or a month)
    // pulls the month's missing days, a day view pulls its own day.
    var coffeeDays = state.day ? [state.day] : elapsedDays(b.rows, b.today).map(function (r) { return r.day; });
    if (coffeeDays.some(function (d) { return d <= b.today && !coffee.loaded[d] && !coffee.failed[d]; })) void loadCoffee(coffeeDays);
  }
  // Escape and the back button: leave a drill-down first, one level at a time.
  function back() {
    if (!modalOpen() || (!state.day && !state.person && !DETAILS[state.tab])) return false;
    var from = state.day ? '[data-db-day="' + state.day + '"]' : state.person ? '[data-db-person="' + state.person + '"]' : '[data-db-open="' + state.tab + '"]';
    if (state.day) state.day = ''; else if (state.person) state.person = ''; else state.tab = 'overview';
    render('back');
    var again = chrome && chrome.body.querySelector(from);
    if (again && typeof again.focus === 'function') { try { again.focus({ preventScroll: true }); } catch (_e) {} }
    return true;
  }
  function openDrill(t, set) {
    var wrap = document.getElementById('stats-table-wrap');
    if (!state.day && !state.person && !DETAILS[state.tab] && wrap) { scrollMemo.list = wrap.scrollTop; scrollMemo.from = true; }
    var point = pointIn(t);
    set();
    render('forward', { point: point });
    if (chrome && typeof chrome.body.focus === 'function') { try { chrome.body.focus({ preventScroll: true }); } catch (_e) {} }
  }

  var openMg = null; // the over-limit note opened by a tap
  document.addEventListener('click', function (e) {
    var wrap = e.target.closest('#stats-modal');   // the answers and the title row's month, groups and search
    if (!wrap) return;
    if (e.target.closest('[data-db-retry]')) { retryFailed(); return; }
    var more = e.target.closest('[data-db-more]');
    if (more) { var cap = more.closest('.db-cap'); if (cap) cap.classList.add('is-open'); return; }
    var t;
    // the over-limit label explains itself on hover; a tap toggles the same note instead of opening the person
    if ((t = e.target.closest('.db-coffee-mg.is-over'))) { if (openMg && openMg !== t) openMg.classList.remove('is-open'); openMg = t.classList.toggle('is-open') ? t : null; return; }
    if (openMg) { openMg.classList.remove('is-open'); openMg = null; }
    if ((t = e.target.closest('[data-db-nav]'))) { var dir = +t.dataset.dbNav; state.month = shiftMonth(state.month, dir); state.day = ''; render('month', { dir: dir }); return; }
    if ((t = e.target.closest('[data-db-group]'))) { if (state.group === t.dataset.dbGroup) return; state.group = t.dataset.dbGroup; render('filter'); return; }
    if ((t = e.target.closest('[data-db-open]'))) { var key = t.dataset.dbOpen; openDrill(t, function () { state.tab = key; state.person = ''; state.day = ''; }); return; }
    if ((t = e.target.closest('[data-db-day]'))) { var day = t.dataset.dbDay; openDrill(t, function () { state.day = day; }); return; }
    if ((t = e.target.closest('[data-db-person]'))) { var person = t.dataset.dbPerson; openDrill(t, function () { state.person = person; state.day = ''; }); return; }
    if (e.target.closest('[data-db-back]')) { back(); return; }
  });
  function searchPerson(e) {
    if (!e.target.matches || !e.target.matches('#stats-modal [data-db-person-select]')) return;
    var typed = e.target.value.trim();
    if (!typed) { if (e.type === 'change' && state.person) { state.person = ''; state.day = ''; render('back'); } return; }
    var opts = [].slice.call(e.target.list ? e.target.list.options : []).map(function (o) { return o.value; });
    var hit = opts.filter(function (n) { return n.toLowerCase() === typed.toLowerCase(); })[0];
    if (!hit && e.type === 'change') { var some = opts.filter(function (n) { return n.toLowerCase().indexOf(typed.toLowerCase()) >= 0; }); if (some.length === 1) hit = some[0]; }
    if (hit && hit !== state.person) { e.target.blur(); openDrill(null, function () { state.person = hit; state.day = ''; }); }
  }
  document.addEventListener('input', searchPerson);
  document.addEventListener('change', searchPerson);
  window.addEventListener('minka:daybook', function () { if (modalOpen()) render(); });
  window.addEventListener('online', retryFailed);
  // Outside callers (late data, levels.js, the modal opener) only refresh.
  window.MinkaDaybookStats = {
    render: function () { render(chrome && modalOpen() ? 'refresh' : null); },
    back: back,
    reset: function () { chrome = null; },
    personHero: function (name, month, opts) { return personHero(name, month, opts).html; }
  };
})();
