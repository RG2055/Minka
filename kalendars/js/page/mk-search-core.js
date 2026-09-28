/* Galvenes meklēšanas kodols: bez DOM, lai to var pārbaudīt ar node --test.
   - fold():  mazie burti, bez garumzīmēm un mīkstinājuma zīmēm (ā→a, ķ→k),
              lai "jevgenija" atrod "Jevgēnija" un "sadal" atrod "sadalījums".
   - match(): vārda sākums > secīgs fragments > burti pēc kārtas; atdod punktus
              un atrasto burtu indeksus izcelšanai.
   - parseDate(): "šodien", "rīt", "parīt", "vakar", "piektdien", "15.10",
              "15.10.2026", "15. okt", "oktobris", "+3", "pēc 3 dienām". */
(function (root) {
  'use strict';

  function fold(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // Word starts in the original string, by folded index (NFD keeps indices
  // aligned only for precomposed input, so work on the folded copy itself).
  function wordStarts(folded) {
    var starts = [0];
    for (var i = 1; i < folded.length; i++) {
      if (/[\s\-–—.,/()]/.test(folded[i - 1]) && !/\s/.test(folded[i])) starts.push(i);
    }
    return starts;
  }

  /* Score how well `query` matches `text`. Higher is better; 0 = no match.
     Returns { score, hits } where hits are indices into `text` (same length as
     the folded copy for the precomposed strings used here). */
  function match(query, text) {
    var q = fold(query).trim();
    var t = fold(text);
    if (!q) return { score: 1, hits: [] };
    if (!t) return { score: 0, hits: [] };
    var tokens = q.split(/\s+/).filter(Boolean);
    var total = 0, hits = [];
    for (var k = 0; k < tokens.length; k++) {
      var one = matchToken(tokens[k], t);
      if (!one.score) return { score: 0, hits: [] };
      total += one.score;
      hits = hits.concat(one.hits);
    }
    // Shorter texts win ties: "Berta" beats "Bermudu salas" for "ber".
    total += Math.max(0, 12 - t.length / 4);
    return { score: total, hits: hits.sort(function (a, b) { return a - b; }) };
  }

  function range(from, length) {
    var out = [];
    for (var i = 0; i < length; i++) out.push(from + i);
    return out;
  }

  function matchToken(q, t) {
    if (t === q) return { score: 120, hits: range(0, q.length) };
    var starts = wordStarts(t);
    for (var s = 0; s < starts.length; s++) {
      if (t.substr(starts[s], q.length) === q) {
        return { score: (s === 0 ? 100 : 80) + q.length, hits: range(starts[s], q.length) };
      }
    }
    var at = t.indexOf(q);
    if (at >= 0 && q.length >= 2) return { score: 50 + q.length, hits: range(at, q.length) };
    // Initials: "ns" → "Nakts sadalījums".
    if (q.length >= 2 && q.length <= starts.length) {
      var ok = true;
      for (var i = 0; i < q.length; i++) { if (t[starts[i]] !== q[i]) { ok = false; break; } }
      if (ok) return { score: 45, hits: starts.slice(0, q.length) };
    }
    // Letters in order, typos of omission ("jvgenija"). Only from 3 letters,
    // and the gaps must stay small, or everything matches everything.
    if (q.length >= 3) {
      var hitsSeq = [], from = 0, gaps = 0;
      for (var j = 0; j < q.length; j++) {
        var idx = t.indexOf(q[j], from);
        if (idx < 0) return { score: 0, hits: [] };
        if (hitsSeq.length) gaps += idx - from;
        hitsSeq.push(idx);
        from = idx + 1;
      }
      if (gaps <= Math.max(2, q.length)) return { score: 20 + q.length - gaps, hits: hitsSeq };
    }
    return { score: 0, hits: [] };
  }

  /* ── Datumi ──────────────────────────────────────────────────────────── */
  var MONTHS = ['janv', 'febr', 'mart', 'apr', 'mai', 'jun', 'jul', 'aug', 'sept', 'okt', 'nov', 'dec'];
  var MONTH_NAMES = ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs', 'jūnijs', 'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris', 'decembris'];
  var MONTH_GEN = ['janvāra', 'februāra', 'marta', 'aprīļa', 'maija', 'jūnija', 'jūlija', 'augusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
  var WEEKDAYS = ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena'];
  var WD_SHORT = ['sv', 'pr', 'ot', 'tr', 'ce', 'pk', 'se'];

  function monthIndex(word) {
    var w = fold(word).replace(/\.$/, '');
    if (w.length < 3) return -1;
    for (var i = 0; i < 12; i++) {
      var stem = fold(MONTHS[i]);
      var full = fold(MONTH_NAMES[i]);
      if (w.indexOf(stem.slice(0, 3)) === 0 && (full.indexOf(w.slice(0, Math.min(w.length, 5))) === 0 || w.indexOf(stem) === 0)) return i;
    }
    return -1;
  }

  function weekdayIndex(word) {
    var w = fold(word).replace(/\.$/, '');
    if (w.length === 2) return WD_SHORT.indexOf(w);
    if (w.length < 3) return -1;
    for (var i = 0; i < 7; i++) {
      var full = fold(WEEKDAYS[i]);
      // "piektdien", "piektdiena", "piektdienā", "piekt"
      if (full.indexOf(w) === 0 || w.indexOf(full.slice(0, full.length - 1)) === 0) return i;
    }
    return -1;
  }

  function atMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { var x = atMidnight(d); x.setDate(x.getDate() + n); return x; }
  function validDay(y, m, d) {
    var x = new Date(y, m, d);
    return x.getFullYear() === y && x.getMonth() === m && x.getDate() === d ? x : null;
  }

  function dayWord(n) {
    var a = Math.abs(n);
    return a % 10 === 1 && a % 100 !== 11 ? 'dienas' : 'dienām';
  }

  /* Human label relative to today: "Šodien", "Rīt", "Pēc 3 dienām", "Vakar". */
  function relativeLabel(date, today) {
    var diff = Math.round((atMidnight(date) - atMidnight(today)) / 86400000);
    if (diff === 0) return 'Šodien';
    if (diff === 1) return 'Rīt';
    if (diff === 2) return 'Parīt';
    if (diff === -1) return 'Vakar';
    if (diff === -2) return 'Aizvakar';
    if (diff > 0) return 'Pēc ' + diff + ' ' + (diff % 10 === 1 && diff % 100 !== 11 ? 'dienas' : 'dienām');
    return 'Pirms ' + (-diff) + ' ' + dayWord(diff);
  }

  function longLabel(date) {
    var wd = WEEKDAYS[date.getDay()];
    return wd.charAt(0).toUpperCase() + wd.slice(1) + ', ' + date.getDate() + '. ' + MONTH_NAMES[date.getMonth()];
  }

  /* One date from free text, or null. `today` defaults to now. A day and month
     without a year that has already passed this year is not moved to next
     year: the roster is about the near past as much as the near future, so
     the nearest occurrence (±6 months) is picked. */
  function parseDate(input, today) {
    today = atMidnight(today || new Date());
    var q = fold(input).trim().replace(/\s+/g, ' ');
    if (!q) return null;
    var simple = { 'sodien': 0, 'tagad': 0, 'rit': 1, 'parit': 2, 'vakar': -1, 'aizvakar': -2 };
    if (Object.prototype.hasOwnProperty.call(simple, q)) return addDays(today, simple[q]);
    var m;
    // "+3", "-2", "+3d", "pēc 3 dienām", "pirms 2 dienām", "3 dienas"
    if ((m = q.match(/^([+-])\s?(\d{1,3})\s?(d|dienas|dienam|dienu)?$/))) return addDays(today, (m[1] === '-' ? -1 : 1) * +m[2]);
    if ((m = q.match(/^pec (\d{1,3}) (d|dien\w*)$/))) return addDays(today, +m[1]);
    if ((m = q.match(/^pirms (\d{1,3}) (d|dien\w*)$/))) return addDays(today, -m[1]);
    // "15.10", "15.10.", "15.10.2026", "15/10", "15-10-26"
    if ((m = q.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\.?$/))) {
      var y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null;
      return pickYear(+m[1], +m[2] - 1, y, today);
    }
    // "15. okt", "15 oktobris", "15. oktobrī", "okt 15"
    if ((m = q.match(/^(\d{1,2})\.? ([a-z]+)\.?(?: (\d{4}))?$/))) {
      var mi = monthIndex(m[2]);
      if (mi >= 0) return pickYear(+m[1], mi, m[3] ? +m[3] : null, today);
    }
    if ((m = q.match(/^([a-z]+)\.? (\d{1,2})\.?$/))) {
      var mj = monthIndex(m[1]);
      if (mj >= 0) return pickYear(+m[2], mj, null, today);
    }
    // "piektdien" = šī vai nākamā tuvākā (šodien, ja šodien piektdiena);
    // "nākamā piektdiena" = vienmēr pēc šodienas.
    var next = false;
    if ((m = q.match(/^nakam\w* (.+)$/))) { next = true; q = m[1]; }
    var wd = weekdayIndex(q);
    if (wd >= 0) {
      var delta = (wd - today.getDay() + 7) % 7;
      if (next && delta === 0) delta = 7;
      return addDays(today, delta);
    }
    // "oktobris" alone: the first day of the nearest such month.
    var mk = monthIndex(q);
    if (mk >= 0 && /^[a-z]+\.?$/.test(q) && q.length >= 3) return pickYear(1, mk, null, today);
    return null;
  }

  function pickYear(day, month, year, today) {
    if (month < 0 || month > 11 || day < 1 || day > 31) return null;
    if (year) return validDay(year, month, day);
    var best = null, bestDist = Infinity;
    [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].forEach(function (y) {
      var d = validDay(y, month, day);
      if (!d) return;
      var dist = Math.abs(d - today);
      if (dist < bestDist) { best = d; bestDist = dist; }
    });
    return best;
  }

  var api = {
    fold: fold,
    match: match,
    parseDate: parseDate,
    relativeLabel: relativeLabel,
    longLabel: longLabel,
    monthIndex: monthIndex,
    weekdayIndex: weekdayIndex,
    MONTH_NAMES: MONTH_NAMES,
    MONTH_GEN: MONTH_GEN,
    WEEKDAYS: WEEKDAYS
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MkSearchCore = api;
})(typeof window !== 'undefined' ? window : this);
