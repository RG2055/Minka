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
  var GROUP = { rg: { label: 'Radiogrāferi', accent: '#1fe091' }, rd: { label: 'Radiologi', accent: '#3f9bff' } };
  var SHIFT = { day: { label: 'Diena', color: '#3f9bff' }, night: { label: 'Nakts', color: '#23cdcf' }, '24h': { label: '24h', color: '#f5b73f' } };
  var TABS = [['overview', 'Pārskats'], ['bolus', 'Boluss'], ['radio', 'Radio'], ['coffee', 'Kafija'], ['fatigue', 'Nogurums']];
  var PULSE_KEY = 'minkaShiftPulseV2';
  var PENDING_KEY = 'minkaShiftPulsePendingV2';
  var COFFEE_KEY = 'minkaCoffeeCountsV1';
  var COFFEE_DETAILS_KEY = 'minkaCoffeeDetailsV1';
  var COFFEE_SOURCES = [['philips', 'Philips'], ['lofbergs', 'Löfbergs'], ['narvesen', 'Narvesen'], ['monster', 'Monster'], ['monsterultra', 'Monster Ultra'], ['redbull', 'Red Bull'], ['cupcoffee', 'Cita kafija']];

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
    return !!modal && modal.style.display !== 'none';
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
    var base = String(window.MINKA_FEEDBACK_API_BASE || '').replace(/\/$/, '');
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
      changes: M.bolus(readJson('minkaBolusHistoryV1')),
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
            var r = await fetch(base + '/api/feedback?date=' + day + '&messages=0', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
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
            var store = readJson(COFFEE_KEY);
            store[date] = value.counts || {};
            writeJson(COFFEE_KEY, store);
            var details = readJson(COFFEE_DETAILS_KEY);
            details[date] = value.details || {};
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
  function table(headers, rows) {
    if (!rows.length) return empty('Šajā periodā ierakstu nav.');
    return '<div class="db-scroll"><table class="db-table"><thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  function bars(items, color) {
    // items: [{label, value, sub, color?}] rendered as horizontal bars.
    var max = items.reduce(function (m, e) { return Math.max(m, e.value); }, 0) || 1;
    if (!items.length) return empty('Nav ierakstu.');
    return '<div class="db-bars">' + items.map(function (e) {
      return '<div class="db-bar-row"><span class="db-bar-label">' + e.label + '</span><span class="db-bar"><i style="width:' + (e.value / max * 100).toFixed(1) + '%;background:' + (e.color || color || '#1fe091') + '"></i></span><b>' + e.value + '</b>' + (e.sub ? '<small>' + e.sub + '</small>' : '') + '</div>';
    }).join('') + '</div>';
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
  function header(names) {
    return '<div class="db-top">'
      + '<div class="db-monthnav"><button type="button" data-db-nav="-1" aria-label="Iepriekšējais mēnesis">‹</button><b>' + monthLabel(state.month) + '</b><button type="button" data-db-nav="1" aria-label="Nākamais mēnesis">›</button></div>'
      + '<div class="db-chips">' + [['all', 'Visi'], ['rg', 'Radiogrāferi'], ['rd', 'Radiologi']].map(function (g) {
        return '<button type="button" data-db-group="' + g[0] + '" aria-pressed="' + (state.group === g[0]) + '">' + g[1] + '</button>';
      }).join('') + '</div>'
      + '<label class="db-personpick"><select data-db-person-select><option value="">Cilvēks…</option>' + names.map(function (n) {
        return '<option value="' + esc(n) + '"' + (state.person === n ? ' selected' : '') + '>' + esc(n) + '</option>';
      }).join('') + '</select></label>'
      + '</div>'
      + '<nav class="db-tabs" aria-label="Sadaļa">' + TABS.map(function (t) {
        return '<button type="button" data-db-tab="' + t[0] + '" aria-pressed="' + (state.tab === t[0] && !state.person && !state.day) + '">' + t[1] + '</button>';
      }).join('') + '</nav>';
  }
  function backBar(title, sub) {
    return '<div class="db-back"><button type="button" data-db-back>‹ Atpakaļ</button><div><h2>' + title + '</h2>' + (sub ? '<span>' + sub + '</span>' : '') + '</div></div>';
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
    segments.forEach(function (seg) {
      if (seg.length > 1) out += '<path d="' + smoothPath(seg) + '" fill="none" stroke="#7dd3fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
      seg.forEach(function (p) {
        var m = M.moodFor(p.row.mood.score);
        var r = 3.2 + Math.min(4, p.row.mood.total / 3);
        out += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + m.color + '" stroke="#0c0d11" stroke-width="1.5"><title>' + esc(shortDay(p.row.day)) + '&ensp;' + fmt(p.row.mood.score) + ' (' + p.row.mood.total + ' reakcijas)</title></circle>';
      });
    });
    return out + '</svg>';
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
    return '<em class="db-px-rg">Radiogrāferi</em><b>' + n.day.rg + '</b><b>' + n.night.rg + '</b>'
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
      } else if (!future) title += ' — nav atzīmēts';
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
      out += section(GROUP[g].label, people.length + ' cilvēki', '<div class="db-people">' + people.map(function (p) {
        return personCard(p, GROUP[g], s.shifts.filter(function (e) { return e.group === g && M.norm(e.name) === M.norm(p.name); }));
      }).join('') + '</div>', GROUP[g].accent);
    });
    return out || empty('Šim mēnesim grafikā nav maiņu.');
  }

  /* ── views ────────────────────────────────────────────────────────────── */
  function overview(b) {
    var s = b.s, rows = b.rows, past = elapsedDays(rows, b.today);
    var marked = past.filter(function (r) { return r.mood; }).length;
    var weighted = rows.reduce(function (acc, r) { if (r.mood) { acc.sum += r.mood.score * r.mood.total; acc.n += r.mood.total; } return acc; }, { sum: 0, n: 0 });
    var avg = weighted.n ? weighted.sum / weighted.n : null;
    var avgMood = M.moodFor(avg);
    var loading = ratingsJob ? '<span class="db-loading">Ielādē sajūtas ' + ratingsJob.done + '/' + ratingsJob.total + '…</span>' : '';
    var tiles = '<div class="db-tiles db-tiles--2 db-tiles--side">'
      + tile(avg == null ? '—' : '<span class="db-face">' + avgMood.emoji + '</span>' + fmt(avg), 'Vidējā sajūta', avg == null ? 'Nav atzīmēts' : avgMood.label, avgMood ? avgMood.color : '')
      + tile(marked + '<small>/' + past.length + '</small>', 'Atzīmētas dienas', 'no aizvadītajām')
      + tile(s.reactionTotal || '—', 'Reakcijas', 'Mood pogu klikšķi')
      + tile(s.bolus.length || '—', 'Bolusa maiņas', 'GE ' + s.bolus.filter(function (e) { return e.room === 'ge'; }).length + '&ensp;Philips ' + s.bolus.filter(function (e) { return e.room === 'philips'; }).length)
      + '</div>';
    return section('Komandas sajūta', loading || 'Dienas vidējā, lielāks punkts = vairāk reakciju',
        (s.reactionTotal ? moodChart(rows, b.today) : empty('Šim mēnesim vēl nav nevienas sajūtas atzīmes.')) + '<div class="db-two"><div>' + moodCounts(s) + tiles + '</div>' + pixels(rows, b.today, 'mood') + '</div>' + note('Sejiņa — dienas biežākā reakcija; bez sejiņas — neviens nav atzīmējis. ☀ dienā un ☾ naktī dežūrā: <b class="db-px-rg">radiogrāferi</b>, <b class="db-px-rd">radiologi</b>. Spied uz dienas, lai redzētu detaļas.'), '#7dd3fc')
      + team(s);
  }
  function bolusView(b) {
    var s = b.s;
    var perPerson = s.people.filter(function (p) { return p.ge + p.philips; }).sort(function (a, c) { return (c.ge + c.philips) - (a.ge + a.philips); })
      .map(function (p) { return { label: esc(shortName(p.name)), value: p.ge + p.philips, sub: 'GE ' + p.ge + '&ensp;Ph ' + p.philips, color: '#ff5c5c' }; });
    return '<div class="db-tiles db-tiles--3">' + tile(s.bolus.length, 'Bolusa maiņas', 'izvēlētajā mēnesī', '#ff5c5c') + tile(s.bolus.filter(function (e) { return e.room === 'ge'; }).length, 'GE', '', '#0a84ff') + tile(s.bolus.filter(function (e) { return e.room === 'philips'; }).length, 'Philips', '', '#30d158') + '</div>'
      + section('Pēc cilvēka', '', bars(perPerson), '#ff5c5c')
      + section('Visas maiņas', s.bolus.length + ' ieraksti', table(['Dežūras diena', 'Mainīts', 'Iekārta', 'Cilvēks'], s.bolus.map(function (e) {
        return '<tr><td><button type="button" class="db-link" data-db-day="' + e.day + '">' + shortDay(e.day) + '</button></td><td>' + esc(new Date(e.ts).toLocaleString('lv-LV', { timeZone: 'Europe/Riga', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) + '</td><td>' + chip(e.room === 'ge' ? 'GE' : 'Philips', e.room === 'ge' ? '#0a84ff' : '#30d158') + '</td><td>' + esc(e.name) + '</td></tr>';
      })) + note('Bolusa vēsture no ierīcē sinhronizētajiem ierakstiem. Maiņa pirms 08:00 pieder iepriekšējai dežūras dienai.'), '#ff5c5c');
  }
  function radioView(b) {
    var s = b.s, past = elapsedDays(b.rows, b.today).length || 1;
    var items = s.stations.map(function (e) { return { label: esc(e.name), value: e.count, sub: e.count === 1 ? 'diena' : 'dienas', color: '#38bdf8' }; });
    return '<div class="db-tiles db-tiles--3">' + tile(s.stations.length || '—', 'Stacijas', 'klausītas šomēnes', '#38bdf8') + tile(b.rows.filter(function (r) { return r.radio.length; }).length || '—', 'Dienas ar radio', 'no ' + past) + tile(s.stations[0] ? esc(s.stations[0].name) : '—', 'Biežākā', s.stations[0] ? s.stations[0].count + (s.stations[0].count === 1 ? ' diena' : ' dienas') : '') + '</div>'
      + section('Stacijas', '', bars(items) + note('Stacija tiek pierakstīta, kad tā sāk skanēt. Klausīšanās ilgums netiek mērīts.'), '#38bdf8')
      + section('Pa dienām', '', table(['Diena', 'Stacijas'], b.rows.filter(function (r) { return r.radio.length; }).reverse().map(function (r) {
        return '<tr><td><button type="button" class="db-link" data-db-day="' + r.day + '">' + shortDay(r.day) + '</button></td><td>' + r.radio.map(esc).join(', ') + '</td></tr>';
      })), '#38bdf8');
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
    return '<div class="db-coffee">' + list.map(function (p) {
      var g = GROUP[groupOf[M.norm(p.name)] || 'rg'];
      return '<button type="button" class="db-coffee-row" data-db-person="' + esc(p.name) + '">' + avatar(p.name, g.accent)
        + '<span class="db-coffee-name"><b>' + esc(shortName(p.name)) + '</b></span>'
        + '<span class="db-coffee-srcs">' + sourceChips(p.sources) + '</span>'
        + '<span class="db-coffee-cups"><b>' + p.cups + '</b><small>' + (p.cups === 1 ? 'tase' : 'tases') + '</small></span>'
        + '<span class="db-coffee-eur"><b>' + eur(p.cents) + '</b><small>iztērēts</small></span></button>';
    }).join('') + '</div>';
  }
  function coffeeMonth(b) {
    // Only days this device has pulled from the coffee API count here.
    var counts = readJson(COFFEE_KEY), details = readJson(COFFEE_DETAILS_KEY), people = {}, days = 0;
    // The coffee API keys workers by lower-cased name; show the schedule's spelling.
    var byKey = {};
    shiftsAll().forEach(function (e) { byKey[M.norm(e.name)] = e.name; });
    Object.keys(counts).forEach(function (key) {
      var day = M.day(key);
      if (!day || day < b.range.from || day > b.range.to || day > b.today) return;
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
      + tile(drinkers || '—', 'Cilvēki', drinkers ? 'atzīmējuši dzērienus' : '') + '</div>'
      + (cups ? '<div class="db-coffee-sum">' + sourceChips(sum) + '</div>' : '')
      + section(monthLabel(state.month), coffee.busy ? '<span class="db-loading">Ielādē…</span>' : '', coffeeRows(month.people), '#f5b73f')
      + section('Visu laiku', all ? all.reduce(function (n, p) { return n + p.cups; }, 0) + ' tases' : '', all ? coffeeRows(all) : empty('Ielādē…'), '#f5b73f');
  }
  function fatigueView() {
    var html = '';
    try { html = window.MinkaLevels && window.MinkaLevels.renderFatigueChart ? window.MinkaLevels.renderFatigueChart(monthLabel(state.month).toUpperCase()) : ''; } catch (_e) {}
    return (html || empty('Noguruma modelim šim mēnesim nav datu.')) + note('Modeļa aprēķins no grafika un atpūtas laika. Tas nav cilvēka pašsajūta — to rāda sadaļa Pārskats.');
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
    if (row.mood) {
      var m = M.moodFor(row.mood.score);
      moodBlock = '<div class="db-tiles db-tiles--2">' + tile('<span class="db-face">' + m.emoji + '</span>' + fmt(row.mood.score), 'Dienas sajūta', m.label, m.color) + tile(row.mood.total, 'Reakcijas', 'anonīmi klikšķi') + '</div>' + moodCounts(all);
    } else {
      moodBlock = empty(day > b.today ? 'Diena vēl nav pienākusi.' : 'Šai dienai sajūtas nav atzīmētas.');
    }
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
      + section('Boluss', row.bolus.length + ' maiņas', row.bolus.length ? '<ul class="db-list">' + row.bolus.map(function (e) { return '<li>' + chip(e.room === 'ge' ? 'GE' : 'Philips', e.room === 'ge' ? '#0a84ff' : '#30d158') + '<b>' + esc(new Date(e.ts).toLocaleTimeString('lv-LV', { timeZone: 'Europe/Riga', hour: '2-digit', minute: '2-digit' })) + '</b><span>' + esc(e.name) + '</span></li>'; }).join('') + '</ul>' : empty('Nav bolusa maiņu.'), '#ff5c5c')
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
  function render() {
    var wrap = document.getElementById('stats-table-wrap');
    if (!wrap) return;
    if (!state.month || !modalOpen()) {
      // Opening: start from the day selected in the calendar.
      state.month = D.selectedDay().slice(0, 7);
      state.person = ''; state.day = ''; state.tab = 'overview';
      ratingsFailed = {}; coffee.failed = {};
      wrap.scrollTop = 0;
    }
    if (!state.month) state.month = M.dutyDay().slice(0, 7);
    var b = build();
    var names = Array.from(new Set(shiftsAll().filter(function (e) { return e.day >= b.range.from && e.day <= b.range.to; }).map(function (e) { return e.name; }))).sort(function (a, c) { return a.localeCompare(c, 'lv'); });
    var body;
    if (state.day) body = dayView(b);
    else if (state.person) body = personView(b);
    else if (state.tab === 'bolus') body = bolusView(b);
    else if (state.tab === 'radio') body = radioView(b);
    else if (state.tab === 'coffee') body = coffeeView(b);
    else if (state.tab === 'fatigue') body = fatigueView();
    else body = overview(b);
    wrap.classList.add('db-stats');
    wrap.innerHTML = header(names) + '<div class="db-body">' + loadingError(b.range) + body + '</div>';
    if (state.day) {
      ensureRatings(state.day <= b.today ? [state.day] : []);
    } else if (!state.person && state.tab === 'overview') {
      ensureRatings(elapsedDays(b.rows, b.today).map(function (r) { return r.day; }));
    }
    ensureRadio(state.month);
    // Coffee days come from the API on demand; opening the stats (or a month)
    // pulls the month's missing days, a day view pulls its own day.
    var coffeeDays = state.day ? [state.day] : elapsedDays(b.rows, b.today).map(function (r) { return r.day; });
    if (coffeeDays.some(function (d) { return d <= b.today && !coffee.loaded[d] && !coffee.failed[d]; })) void loadCoffee(coffeeDays);
  }

  document.addEventListener('click', function (e) {
    var wrap = e.target.closest('#stats-table-wrap');
    if (!wrap) return;
    if (e.target.closest('[data-db-retry]')) { retryFailed(); return; }
    var t;
    if ((t = e.target.closest('[data-db-nav]'))) { state.month = shiftMonth(state.month, +t.dataset.dbNav); state.day = ''; render(); return; }
    if ((t = e.target.closest('[data-db-group]'))) { state.group = t.dataset.dbGroup; render(); return; }
    if ((t = e.target.closest('[data-db-tab]'))) { state.tab = t.dataset.dbTab; state.person = ''; state.day = ''; render(); return; }
    if ((t = e.target.closest('[data-db-day]'))) { state.day = t.dataset.dbDay; render(); wrap.scrollTop = 0; return; }
    if ((t = e.target.closest('[data-db-person]'))) { state.person = t.dataset.dbPerson; state.day = ''; render(); wrap.scrollTop = 0; return; }
    if (e.target.closest('[data-db-back]')) { if (state.day) state.day = ''; else state.person = ''; render(); return; }
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches('#stats-table-wrap [data-db-person-select]')) return;
    state.person = e.target.value; state.day = '';
    render();
  });
  window.addEventListener('minka:daybook', function () { if (modalOpen()) render(); });
  window.addEventListener('online', retryFailed);
  window.MinkaDaybookStats = { render: render };
})();
