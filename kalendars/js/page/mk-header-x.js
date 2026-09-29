/* Galvene X — RG datora galvene (2026-09-28).

   Augšējais bloks (108 px, tāds pats augstums kā iepriekš) tiek zīmēts no
   jauna: divi spārni "kas dežūrā" (radiogrāferi pa kreisi, radiologi pa labi),
   pa vidu datums ar "Šodien / Pēc 3 dienām", laikapstākļi, mēness, kafijas QR,
   dzimšanas diena, vārdadienas, svinamā diena, meklēšana un ziņu rinda.
   Vecie elementi paliek DOM, un tos turpina atjaunināt savi skripti:
   dzimšanas dienas birka, svinamā diena, laika un mēness čipi un ziņu rinda
   tiek pārcelti šeit, pārējais (vecie spārni, vecais meklētājs) ir paslēpts.
   Salīdzināšanai ar veco: ?hx=0 (sk. kalendars/index.html).

   Meklēšana (Ctrl+K, "/", Ctrl+F): kolēģi ar nākamo maiņu, datumi ("rīt",
   "piektdien", "15.10"), tālruņi, vārdadienas, svinamās dienas un darbības,
   bez garumzīmju jutības (mk-search-core.js).
   Dienas: ← → (index.html), T = šodiena, ‹ › = iepriekšējā / nākamā diena.

   Nekas te neskrien pa kadriem: viss notiek pēc notikumiem (dienas maiņa,
   jauni dati, peles kustība pār čipu). Kustība: tikai transform/opacity un
   kopīgie atsperu tokeni (css/mk-sys.css). */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('mk-hx') || root.classList.contains('mk-mobile-shell')) return;
  var doc = document;
  var CORE = window.MkSearchCore;
  if (!CORE) return;
  function $(id) { return doc.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;';
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  // /rad (radiologists and residents): the same header; only what /rad has (no Bolus,
  // planner, lunch or the radiographers' night plan) and its own name, RG Rad.
  var IS_RAD = window.MINKA_APP === 'rad';
  var APP_NAME = IS_RAD ? 'RG Rad' : 'RG';

  /* ── Ikonas (viena līnija, 24 px režģis, apaļi gali) ─────────────────── */
  var PATHS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v1.9M12 19.3v1.9M5.5 5.5l1.3 1.3M17.2 17.2l1.3 1.3M2.8 12h1.9M19.3 12h1.9M5.5 18.5l1.3-1.3M17.2 6.8l1.3-1.3"/>',
    moon: '<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1Z"/>',
    arrive: '<path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14"/><path d="M4 12h11m-4-4 4 4-4 4"/>',
    full: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/>',
    dot: '<circle cx="12" cy="12" r="3.2"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    person: '<circle cx="12" cy="8.2" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    phone: '<path d="M7 3.5h2.4l1.3 4.1-2.1 1.3a11 11 0 0 0 6.5 6.5l1.3-2.1 4.1 1.3V17a2.6 2.6 0 0 1-2.8 2.5A15.5 15.5 0 0 1 4.5 6.3 2.6 2.6 0 0 1 7 3.5Z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    chevL: '<path d="m14.5 6-6 6 6 6"/>',
    chevR: '<path d="m9.5 6 6 6-6 6"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.6"/><path d="M15.5 8.5V6.6A2.6 2.6 0 0 0 12.9 4H6.6A2.6 2.6 0 0 0 4 6.6v6.3a2.6 2.6 0 0 0 2.6 2.6h1.9"/>',
    check: '<path d="m5 12.5 4.4 4.4L19 7.4"/>',
    chart: '<path d="M5 19V11M12 19V5M19 19v-6"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.9 1.6-2-.4-1.1.3-2.3 1.6-2.3H17a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9.2-8.5-9.2Z"/><circle cx="7.8" cy="11" r="1.1"/><circle cx="10.6" cy="7.4" r="1.1"/><circle cx="15" cy="7.8" r="1.1"/>',
    coffee: '<path d="M5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14.5V9Z"/><path d="M16 10.5h1.2a2.3 2.3 0 0 1 0 4.6H16M8.5 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5"/>',
    party: '<path d="M4.5 19.5 9 8l7 7-11.5 4.5Z"/><path d="M13 5.5c.8-.4 1.3-1.2 1.3-2M18.5 10.5c.4-.8 1.2-1.3 2-1.3M16 3.5l.5 1.5M20.5 7.5 19 8"/>',
    tag: '<path d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a2 2 0 0 1 0 2.8l-5.9 5.9a2 2 0 0 1-2.8 0Z"/><circle cx="8" cy="8" r="1.3"/>',
    enter: '<path d="M19 5v6.5a3 3 0 0 1-3 3H5.5m0 0 4-4m-4 4 4 4"/>',
    news: '<rect x="4" y="5" width="16" height="14" rx="2.6"/><path d="M8 9.5h8M8 13h8M8 16.5h5"/>',
    lanes: '<path d="M4 7h16M7 12h10M5 17h14"/>',
    tune: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    keys: '<rect x="3" y="6" width="18" height="12" rx="2.6"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>',
    radio: '<rect x="3.5" y="8" width="17" height="12" rx="2.6"/><path d="M7 8 16 4"/><circle cx="15.5" cy="14" r="2.6"/><path d="M7 12.5h3M7 15.5h3"/>',
    music: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
    drop: '<path d="M12 3.5c3 3.6 5.5 6.7 5.5 10a5.5 5.5 0 0 1-11 0c0-3.3 2.5-6.4 5.5-10Z"/>',
    mobile: '<rect x="5.8" y="1.8" width="12.4" height="20.4" rx="2.9"/><path d="M10.4 19.2h3.2"/>'
      + '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M8 6h3v3H8zM9 7v1h1V7zM13 6h3v3h-3zM14 7v1h1V7zM8 11h3v3H8zM9 12v1h1v-1z'
      + 'M11 6h1v1h-1zM12 7h1v1h-1zM11 8h1v1h-1zM8 9h1v1H8zM10 9h1v1h-1zM12 9h2v1h-2zM15 9h1v1h-1zM9 10h1v1H9zM11 10h1v1h-1zM14 10h1v1h-1z'
      + 'M12 11h1v1h-1zM14 11h2v1h-2zM11 12h1v1h-1zM13 12h1v1h-1zM12 13h1v1h-1zM14 13h2v1h-2z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    bolt: '<path d="M13 3 5.5 13.5H12l-1 7.5 7.5-10.5H12l1-7.5Z"/>',
    share: '<path d="M12 15V3.8M8 7.5l4-3.7 4 3.7"/><path d="M8 10.5H6.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H16"/>',
    dots: '<circle cx="12" cy="5.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="18.5" r="1.3"/>',
    refresh: '<path d="M19.5 12A7.5 7.5 0 1 1 17 6.4"/><path d="M19.5 4v4.5H15"/>',
    cake: '<path d="M4 12.5h16V20H4z"/><path d="M4 15.8c2 1.6 3-1.6 5 0s3-1.6 5 0 4-1.6 6 0M8 12.5V9m8 3.5V9M12 12.5V9M8 6.2V5m4 1.2V5m4 1.2V5"/>'
  };
  // Cloudflare mākonis (Simple Icons forma, zīmola divi oranžie toņi).
  var CF_LOGO = '<svg class="hx-cf-logo" viewBox="0 6.9 24 10.6" aria-hidden="true" focusable="false">'
    + '<path fill="#f38020" d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268z"/>'
    + '<path fill="#faae40" d="M19.2656 11.2813c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727"/></svg>';
  function icon(name, cls) {
    return '<svg class="hx-ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (PATHS[name] || '') + '</svg>';
  }

  /* ── Datumi ──────────────────────────────────────────────────────────── */
  function parseDMY(s) {
    var m = String(s || '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }
  function dmy(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function dayNum(s) { var d = parseDMY(s); return d ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() : 0; }
  // The duty day turns at 08:00, as everywhere in the calendar.
  function shiftToday() {
    if (window.__g_todayStr) return window.__g_todayStr;
    var d = new Date(); if (d.getHours() < 8) d.setDate(d.getDate() - 1);
    return dmy(d);
  }
  function activeDate() { return window.__activeDateStr || shiftToday(); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function goToDate(ds) {
    if (!ds) return false;
    var ok = typeof window.g_goToDate === 'function' ? window.g_goToDate(ds) : false;
    if (!ok && typeof window.g_selectDay === 'function' && $('p-' + ds.replace(/\./g, '-'))) { window.g_selectDay(ds); ok = true; }
    if (!ok) toast('Šim datumam grafika vēl nav');
    return ok;
  }
  function goToday() { goToDate(shiftToday()); }

  function toast(msg, type) {
    if (typeof window._mkToast === 'function') window._mkToast(msg, type || '');
  }
  /* ── Uzbūve ──────────────────────────────────────────────────────────── */
  var top = null, center = null, els = {};
  function wingHtml(role) {
    var title = role === 'rd' ? 'Radiologi' : ((window.__mkLeftRole && window.__mkLeftRole.many) || 'Radiogrāferi');
    var src = role === 'rd' ? 'data/radiologi.svg' : (window.MINKA_APP === 'rad' ? 'data/rezidenti.svg' : 'data/radiograferi.svg');
    // Drawn as a mask in the zone's own colour (the file itself is violet).
    return '<section class="hx-wing hx-wing-' + role + '" data-role="' + role + '" aria-label="' + esc(title) + ', kas dežūrā">'
      + '<div class="hx-wing-head"><span class="hx-wing-icon" style="--hx-icon:url(&quot;' + esc(new URL(src, location.href).href) + '&quot;)" aria-hidden="true"></span>'
      + '<h2 class="hx-wing-title">' + esc(title) + '</h2><span class="hx-count" hidden></span></div>'
      + '<div class="hx-crew" role="list"><p class="hx-crew-empty">Ielādē…</p></div></section>';
  }
  function build() {
    var wrap = $('minkaBarWrap');
    if (!wrap || $('hxTop')) return !!$('hxTop');
    top = doc.createElement('div');
    top.id = 'hxTop';
    top.className = 'hx-top';
    top.innerHTML = wingHtml('rg')
      + '<div class="hx-center">'
      +   '<div class="hx-dateblock">'
      +     '<div class="hx-line hx-line-date">'
      +       '<span class="hx-date-num"></span>'
      +       '<span class="hx-rel" aria-live="polite"></span>'
      +       '<button type="button" class="hx-today" hidden title="Atpakaļ uz šodienu (T)">' + icon('undo') + '<span>Šodien</span></button>'
      +     '</div>'
      +     '<div class="hx-line hx-line-wd"><span class="hx-date-wd"></span><span class="hx-bday-slot"></span></div>'
      +     '<div class="hx-line hx-namedays" title="Vārdadienas">' + icon('tag') + '<span class="hx-nameday-slot"></span></div>'
      +     '<div class="hx-line hx-dayfact-slot"></div>'
      +   '</div>'
      +   '<div class="hx-side">'
      +     '<div class="hx-row hx-row-tools">'
      +       '<div class="hx-searchbox">'
      +         '<button type="button" class="hx-search" aria-haspopup="dialog" aria-expanded="false" aria-keyshortcuts="Control+K Meta+K /">'
      +           icon('search') + '<span class="hx-search-ph">Meklēt datumu, numuru vai funkciju</span>'
      +           '<kbd class="hx-kbd">' + (isMac ? '⌘' : 'Ctrl') + ' K</kbd></button>'
      +         '<span class="hx-searchbox-sep" aria-hidden="true"></span>'
      +         '<button type="button" class="hx-tools" data-menu="tools" aria-haspopup="menu" aria-expanded="false" title="Tālruņi, maiņu joslas, nakts sadalījums, izskats">'
      +           icon('tune') + '<span>Rīki</span></button>'
      +       '</div>'
      +       '<div class="hx-status" role="group" aria-label="Laikapstākļi, mēness un atbalsts">'
      +         '<button type="button" class="hx-chip hx-weather" data-pop="weather" aria-haspopup="dialog" aria-expanded="false" aria-label="Laikapstākļi Rīgā"></button>'
      +         '<button type="button" class="hx-chip hx-moon" data-pop="moon" aria-haspopup="dialog" aria-expanded="false" aria-label="Mēness"></button>'
      +         '<button type="button" class="hx-chip hx-coffee" data-pop="coffee" aria-haspopup="dialog" aria-expanded="false" aria-label="Atbalstīt RG: Buy me a coffee">'
      +           '<span class="hx-qr-tile"><img src="assets/coffee/bmc-qr.svg?v=official1" width="24" height="24" alt="" aria-hidden="true"></span>'
      +           '<span class="hx-coffee-count" hidden>' + icon('coffee') + '<b></b></span>'
      +         '</button>'
      +         '<button type="button" class="hx-chip hx-mobile" data-pop="mobile" aria-haspopup="dialog" aria-expanded="false" aria-label="' + APP_NAME + ' telefonā: QR kods un instrukcija">'
      +           icon('mobile')
      +         '</button>'
      +       '</div>'
      +     '</div>'
      +     '<div class="hx-row hx-row-feed"><div class="hx-feed"></div></div>'
      +   '</div>'
      + '</div>'
      + wingHtml('rd');
    wrap.appendChild(top);
    center = top.querySelector('.hx-center');
    els = {
      dateNum: top.querySelector('.hx-date-num'),
      dateWd: top.querySelector('.hx-date-wd'),
      rel: top.querySelector('.hx-rel'),
      today: top.querySelector('.hx-today'),
      weather: top.querySelector('.hx-weather'),
      moon: top.querySelector('.hx-moon'),
      coffee: top.querySelector('.hx-coffee'),
      mobile: top.querySelector('.hx-mobile'),
      search: top.querySelector('.hx-search'),
      searchbox: top.querySelector('.hx-searchbox'),
      tools: top.querySelector('.hx-tools'),
      feed: top.querySelector('.hx-feed'),
      bdaySlot: top.querySelector('.hx-bday-slot'),
      namedaySlot: top.querySelector('.hx-nameday-slot'),
      dayfactSlot: top.querySelector('.hx-dayfact-slot')
    };
    wire();
    buildAxis();
    ledWatch();
    return true;
  }

  // The live chips keep their own scripts; they only change their place.
  function adopt() {
    if (!top) return;
    var moves = [
      ['mkBdayBadge', els.bdaySlot],
      ['mkNamedayBar', els.namedaySlot],
      ['mkDayChip', els.dayfactSlot],
      ['mkTempChip', els.weather],
      ['mkMoonChip', els.moon],
      ['mkTickerWrap', els.feed]
    ];
    moves.forEach(function (m) {
      var node = $(m[0]);
      if (node && m[1] && node.parentElement !== m[1]) m[1].appendChild(node);
    });
    syncFacts();
  }
  // A fact that has nothing to say takes no room (and no separator).
  function syncFacts() {
    if (!top) return;
    var bday = $('mkBdayBadge'), nd = $('mkNamedayBar'), dc = $('mkDayChip');
    // A birthday more than two weeks away is not news in the header.
    els.bdaySlot.hidden = !bday || bday.style.display === 'none' || !bday.classList.contains('has-up') || bday.classList.contains('is-far');
    els.namedaySlot.parentElement.hidden = !nd || !nd.textContent.trim() || nd.hidden;
    els.dayfactSlot.hidden = !dc || dc.hidden || !dc.textContent.trim();
  }

  /* ── Spārni: kas dežūrā ──────────────────────────────────────────────── */
  function crewRow(kind, label, list, listId) {
    var ic = kind === 'night' ? 'moon' : kind === 'leave' ? 'sun' : kind === 'later' ? 'arrive' : kind === 'full' ? 'full' : 'dot';
    return '<div class="hx-crew-row is-' + kind + '" role="listitem">' + icon(ic, 'hx-crew-ic')
      + '<span class="hx-crew-label">' + esc(label) + '</span><span class="hx-crew-names">'
      + list.map(function (p, i) {
        return (i ? '<span class="hx-sep">, </span>' : '') + '<button type="button" class="hx-name" data-w="' + esc(p.name) + '" data-list="' + esc(listId) + '" title="Parādīt kartīti">' + esc(p.first) + '</button>';
      }).join('') + '</span></div>';
  }
  // Another day: one row per shift (08–08, 08–17, 17–08…), earliest first.
  function shiftGroups(people) {
    var groups = {}, order = [];
    (people || []).forEach(function (p) {
      var s = String(p.start || '').slice(0, 5), e = String(p.end || '').slice(0, 5);
      var key = s && e ? s + '–' + e : (p.shift ? p.shift + ' h' : 'Dežūrā');
      if (!groups[key]) { groups[key] = { key: key, start: s, end: e, list: [] }; order.push(key); }
      groups[key].list.push(p);
    });
    return order.map(function (k) { return groups[k]; }).sort(function (a, b) { return (a.start || '99').localeCompare(b.start || '99'); }).map(function (g) {
      var sh = parseInt(g.start, 10), eh = parseInt(g.end, 10);
      var kind = g.start && g.start === g.end ? 'full' : sh >= 15 ? 'night' : eh && eh <= 21 && sh < 15 ? 'leave' : 'dot';
      var label = kind === 'full' ? 'Diennakts' : g.key.replace(/^0(\d)/, '$1').replace(/–0(\d)/, '–$1');
      return { kind: kind, label: label, list: g.list };
    });
  }
  function renderWing(role) {
    if (!top) return;
    var wing = top.querySelector('.hx-wing-' + role);
    var s = (window.__mkDutySummary || {})[role];
    if (!wing) return;
    var count = wing.querySelector('.hx-count'), crew = wing.querySelector('.hx-crew');
    if (!s) return;
    var groups = [];
    if (s.isToday) {
      count.innerHTML = '<span>tagad</span><b>' + s.nowCount + '</b>';
      count.title = s.sameNightRoster ? 'Tagad dežūrā ' + s.nowCount + ', visi paliek arī naktī' : 'Tagad dežūrā ' + s.nowCount + ', naktī ' + s.nightCount;
      (s.groups || []).forEach(function (g) {
        groups.push({ kind: g.kind === 'dl-night' ? 'night' : g.kind === 'dl-leave' ? 'leave' : 'later', label: g.label, list: g.people });
      });
    } else {
      count.innerHTML = '<span>dežūrā</span><b>' + s.count + '</b>';
      count.title = 'Dežūrā ' + s.count;
      groups = shiftGroups(s.people);
    }
    count.hidden = false;
    wing.title = groups.map(function (g) { return g.label + ': ' + g.list.map(function (p) { return p.first; }).join(', '); }).join('\n');
    fitWing(wing, crew, groups, s);
  }
  /* Many people on many shifts (a big /rad day): the wing keeps its height (the header
     never grows). Tried in order, the first that shows every name wins: as drawn, smaller
     type, then (3+ shifts) day / night / 24 h rows (times in the tooltip), smaller, three
     lines each. None does: the last that still fits, else one line per shift. */
  function fitWing(wing, crew, groups, s) {
    var merged = groups.length > 2 ? mergeShifts(groups) : null, painted = null, keep = null;
    function paint(list, cls) {
      if (painted !== list) { paintCrew(crew, list, s); painted = list; }
      crew.classList.toggle('is-dense', cls !== ''); wing.classList.toggle('is-dense', cls !== '');
      crew.classList.toggle('is-roomy', cls === 'd3'); crew.classList.toggle('is-tight', cls === 'tight');
    }
    function fitsHeight() { return !wing.clientHeight || wing.scrollHeight <= wing.clientHeight + 1; }
    function allNames() { return Array.prototype.every.call(crew.querySelectorAll('.hx-crew-names'), function (n) { return n.scrollHeight <= n.clientHeight + 1; }); }
    var tries = [[groups, ''], [groups, 'd']];
    if (merged) tries.push([merged, ''], [merged, 'd'], [merged, 'd3']);
    for (var i = 0; i < tries.length; i++) {
      paint(tries[i][0], tries[i][1]);
      if (!fitsHeight()) continue;
      if (allNames()) return;
      keep = tries[i];
    }
    if (keep) paint(keep[0], keep[1]);
    else paint(merged || groups, 'tight');
  }
  function paintCrew(crew, groups, s) {
    crew.innerHTML = groups.length ? groups.map(function (g) { return crewRow(g.kind, g.label, g.list, s.listId); }).join('')
      : '<p class="hx-crew-empty">' + (s.isToday ? 'Šobrīd neviena' : 'Nav dežūru') + '</p>';
  }
  function mergeShifts(groups) {
    var full = { kind: 'full', label: 'Diennakts', list: [] }, day = { kind: 'leave', label: 'Dienā', list: [] }, night = { kind: 'night', label: 'Naktī', list: [] };
    groups.forEach(function (g) {
      var into = g.kind === 'night' ? night : g.kind === 'full' ? full : day;
      g.list.forEach(function (p) { if (!into.list.some(function (q) { return q.name === p.name; })) into.list.push(p); });
    });
    return [full, day, night].filter(function (g) { return g.list.length; });
  }
  function focusWorkerCard(name, listId) {
    var list = $(listId);
    var q = window.CSS && CSS.escape ? CSS.escape(name) : name;
    var card = list && list.querySelector(':is(.mk-side-card,.mk-rad-row)[data-worker="' + q + '"]');
    if (!card) {
      if (typeof window.showWorkerSchedule === 'function') window.showWorkerSchedule(name, '');
      return;
    }
    card.scrollIntoView({ behavior: root.dataset.motion === 'reduced' ? 'auto' : 'smooth', block: 'center' });
    card.classList.remove('mk-dchip-flash');
    void card.offsetWidth;
    card.classList.add('mk-dchip-flash');
    setTimeout(function () { card.classList.remove('mk-dchip-flash'); }, 1400);
  }

  /* ── Datuma rinda ────────────────────────────────────────────────────── */
  function renderDate() {
    if (!top) return;
    var ds = activeDate(), d = parseDMY(ds);
    if (!d) return;
    var today = shiftToday(), isToday = ds === today;
    if (els.dateNum.textContent !== ds) els.dateNum.textContent = ds;
    els.dateWd.textContent = cap(CORE.WEEKDAYS[d.getDay()]);
    var rel = isToday ? 'Šodien' : CORE.relativeLabel(d, parseDMY(today) || new Date());
    if (els.rel.textContent !== rel) els.rel.textContent = rel;
    els.rel.classList.toggle('is-today', isToday);
    els.today.hidden = isToday;
    top.classList.toggle('is-other-day', !isToday);
    syncMoonTuck();
    if (popKind === 'moon' || popKind === 'weather') fillPop(popKind);
    if (wasToday !== isToday) {
      if (isToday) {
        if (wasToday === false) rulerEnter();
        ledShow(true);
      } else ledHide();
      wasToday = isToday;
    }
  }

  /* ── Citas dienas: galvene nemaina augstumu ──────────────────────────────
     Šodienai zem augšējā bloka ir laika lineāls ar progresu. Citām dienām
     tā vietā paliek tās pašas rindas dienas ass (08:00 → 08:00) bez
     progresa (CSS rezervē rindu), tāpēc galvene un visas trīs kolonnas zem
     tās vairs nepārlec. Atgriežoties uz šodienu, progress ieslīd no kreisās. */
  var wasToday = null, rulerT = 0;
  function buildAxis() {
    var wrap = $('minkaBarWrap');
    if (!wrap || $('hxAxis')) return;
    var ax = doc.createElement('div');
    ax.id = 'hxAxis';
    ax.setAttribute('aria-hidden', 'true');
    ax.innerHTML = '<span class="hx-axis-band"></span>'
      + [['08:00', 0, 'is-start'], ['14:00', 25, 'is-day'], ['20:00', 50, ''], ['02:00', 75, 'is-night'], ['08:00', 100, 'is-end']].map(function (t) {
        return '<span class="hx-axis-tick ' + t[2] + '" style="left:' + t[1] + '%">' + t[0] + '</span>';
      }).join('');
    wrap.appendChild(ax);
  }
  function rulerEnter() {
    var wrap = $('minkaBarWrap');
    if (!wrap || root.dataset.motion === 'reduced') return;
    wrap.classList.remove('hx-ruler-in');
    void wrap.offsetWidth;
    wrap.classList.add('hx-ruler-in');
    clearTimeout(rulerT);
    rulerT = setTimeout(function () { wrap.classList.remove('hx-ruler-in'); }, 900);
  }

  /* ── Pagājušais laiks bildē (kā Nakts sadalījuma kartītēs) ───────────────
     Maiņas pagājušā daļa (no 08:00 līdz tagad, tieši virs lineāla progresa)
     kļūst par LED punktu matricu ar graudainu fronti. Lēti: bilde tiek
     nolasīta vienreiz kā mazs krāsu režģis (5 px šūnas), un zīmētas tiek
     tikai šūnas, kuru laiks ir pienācis. Fronte pavirzās par vienu šūnu
     apmēram ik pēc 4 minūtēm, tāpēc minūtes pārbaude parasti neko nezīmē.
     Paslēptā lapā nekas nenotiek; citām dienām slānis ir paslēpts. */
  // The front is a soft band: cells fade in over LED_FEATHER px, and its
  // middle sits exactly at the end of the ruler's progress fill.
  var LED_CELL = 5, LED_FRONT = 14, LED_FEATHER = 90, LED_LEVELS = 6;
  var led = { cv: null, st: null, key: '', timer: 0, anim: 0, on: false, last: 0, ro: null, roT: 0 };
  function ledHost() { return doc.querySelector('#minkaBarWrap > .mk-header-scenic-bg'); }
  function ledSource(host) {
    var cvs = host.querySelector('canvas.mk-header-scenic-canvas');
    if (host.classList.contains('is-stretch') && cvs && cvs.width && cvs.getBoundingClientRect().width) return { el: cvs, kind: 'canvas' };
    var img = host.querySelector('img.mk-header-scenic-img');
    return img && img.complete && img.naturalWidth ? { el: img, kind: 'img' } : null;
  }
  function ledNoise(cols, rows, seed) {
    // Grainy clusters: random cells, softened once with their neighbours.
    var r = new Float32Array(cols * rows), n = new Float32Array(cols * rows), h = seed >>> 0;
    for (var i = 0; i < r.length; i++) { h = (h * 1664525 + 1013904223) >>> 0; r[i] = h / 4294967296; }
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var s0 = 0, c0 = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
        var k = (dx || dy) ? 1 : 2; s0 += r[yy * cols + xx] * k; c0 += k;
      }
      n[y * cols + x] = s0 / c0 * .6 + r[y * cols + x] * .4;
    }
    return n;
  }
  // Lit like an LED: the colour more saturated and a little brighter, dark stays dark.
  function ledLight(v, m) { return Math.max(0, Math.min(255, Math.round((m + (v - m) * 1.45) * 1.12))); }
  function ledColours(host, src, cols, rows, cell) {
    var c = doc.createElement('canvas');
    c.width = cols; c.height = rows;
    var x = c.getContext('2d', { willReadFrequently: true });
    var hr = host.getBoundingClientRect(), s = 1 / cell;
    x.imageSmoothingQuality = 'high';
    try {
      if (src.kind === 'canvas') {
        var r = src.el.getBoundingClientRect();
        x.drawImage(src.el, (r.left - hr.left) * s, (r.top - hr.top) * s, r.width * s, r.height * s);
      } else {
        // The picture as object-fit: cover with its focal point shows it.
        var img = src.el, iw = img.naturalWidth, ih = img.naturalHeight, bw = hr.width, bh = hr.height;
        var k = Math.max(bw / iw, bh / ih), dw = iw * k, dh = ih * k;
        var pos = String(getComputedStyle(img).objectPosition || '50% 50%').split(' ').map(parseFloat);
        var px = isFinite(pos[0]) ? pos[0] / 100 : .5, py = isFinite(pos[1]) ? pos[1] / 100 : .5;
        x.drawImage(img, (bw - dw) * px * s, (bh - dh) * py * s, dw * s, dh * s);
      }
      return x.getImageData(0, 0, cols, rows).data;
    } catch (_e) { return null; }
  }
  function ledEnsure() {
    var host = ledHost(), row = doc.querySelector('#minkaBarWrap > .scroll-row');
    if (!host || !row) return false;
    var src = ledSource(host);
    if (!src) return false;
    // The whole picture, down to its bottom edge under the day strip.
    var hr = host.getBoundingClientRect();
    var W = Math.round(hr.width), H = Math.round(hr.height);
    if (W < 200 || H < 40) return false;
    var key = (src.kind === 'img' ? (src.el.currentSrc || src.el.src) + '|' + getComputedStyle(src.el).objectPosition : 'stretch:' + src.el.width + 'x' + src.el.height) + '|' + W + 'x' + H;
    if (!led.cv) {
      led.cv = doc.createElement('canvas');
      led.cv.id = 'hxLed';
      led.cv.setAttribute('aria-hidden', 'true');
    }
    if (led.cv.parentElement !== host) host.appendChild(led.cv);
    if (led.key === key && led.st && led.st.colours) return true;
    var cols = Math.ceil(W / LED_CELL), rows = Math.ceil(H / LED_CELL);
    led.key = key;
    led.cv.width = W; led.cv.height = H;
    led.cv.style.width = W + 'px'; led.cv.style.height = H + 'px';
    led.st = { cols: cols, rows: rows, lit: new Uint8Array(cols * rows), noise: ledNoise(cols, rows, W * 7 + H), colours: ledColours(host, src, cols, rows, LED_CELL) };
    led.last = 0;
    return !!led.st.colours;
  }
  function ledCell(ctx, i, alpha) {
    var S = led.st, c = LED_CELL, cols = S.cols, col = S.colours;
    var x0 = (i % cols) * c, y0 = Math.floor(i / cols) * c, q = i * 4, r = col[q], g = col[q + 1], b = col[q + 2];
    var m = (r + g + b) / 3, sz = c - 1;
    ctx.clearRect(x0, y0, c, c);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = '#03060a';
    ctx.fillRect(x0, y0, c, c);
    if (r + g + b < 45) { ctx.fillStyle = 'rgba(120,150,180,.1)'; ctx.fillRect(x0 + .5, y0 + .5, sz, sz); ctx.globalAlpha = 1; return; }
    var lr = ledLight(r, m), lg = ledLight(g, m), lb = ledLight(b, m);
    // Light parts of a picture (a sky) are dimmed, up to ~40 %, so the matrix
    // never glares and the text on it stays readable; dark pictures keep
    // their full glow.
    var y = (.2126 * lr + .7152 * lg + .0722 * lb) / 255, t = Math.max(0, Math.min(1, (y - .42) / .5));
    var k = 1 - .42 * t * t * (3 - 2 * t);
    ctx.fillStyle = 'rgb(' + Math.round(lr * k) + ',' + Math.round(lg * k) + ',' + Math.round(lb * k) + ')';
    ctx.fillRect(x0 + .5, y0 + .5, sz, sz);
    ctx.fillStyle = 'rgba(255,255,255,' + (.14 - .08 * t).toFixed(3) + ')';
    ctx.fillRect(x0 + .5, y0 + .5, sz * .4, sz * .25);
    ctx.globalAlpha = 1;
  }
  function ledProgressNow() {
    var el = doc.querySelector('#shift-progress-wrap:not([hidden]) .sl-ruler-elapsed');
    var m = el && /width:\s*([\d.]+)%/.exec(el.getAttribute('style') || '');
    if (m) return Math.max(0, Math.min(1, +m[1] / 100));
    var d = parseDMY(shiftToday());
    if (!d) return 0;
    d.setHours(8, 0, 0, 0);
    return Math.max(0, Math.min(1, (Date.now() - d.getTime()) / 86400000));
  }
  // The front sits right above the ruler's fill.
  function ledFrontX() {
    var host = ledHost();
    if (!host) return 0;
    var hr = host.getBoundingClientRect(), p = ledProgressNow();
    var band = doc.querySelector('#shift-progress-wrap:not([hidden]) .sl-ruler-band');
    var br = band && band.getBoundingClientRect();
    return br && br.width ? br.left - hr.left + p * br.width : p * hr.width;
  }
  function ledReset() {
    if (!led.st || !led.cv) return;
    led.st.lit.fill(0);
    led.cv.getContext('2d').clearRect(0, 0, led.cv.width, led.cv.height);
    led.last = 0;
  }
  function ledDraw(frontX) {
    var S = led.st;
    if (!S || !S.colours || !led.cv) return;
    if (frontX < led.last - LED_CELL * 4) ledReset();       // a new shift began (08:00)
    led.last = Math.max(led.last, frontX);
    // lit[i] is the cell's level (0 = picture, LED_LEVELS = full light). Levels
    // only grow, so a minute's step redraws just the cells inside the band.
    var ctx = led.cv.getContext('2d'), c = LED_CELL, cols = S.cols, lit = S.lit, n = S.noise;
    for (var i = 0; i < lit.length; i++) {
      if (lit[i] === LED_LEVELS) continue;
      var cx = (i % cols + .5) * c + (n[i] - .5) * 2 * LED_FRONT;
      var k = (frontX + LED_FEATHER / 2 - cx) / LED_FEATHER;
      if (k <= 0) continue;
      var level = Math.min(LED_LEVELS, Math.ceil(k * LED_LEVELS));
      if (level <= lit[i]) continue;
      lit[i] = level;
      ledCell(ctx, i, level / LED_LEVELS);
    }
  }
  function ledShow(sweep) {
    led.on = true;
    cancelAnimationFrame(led.anim);
    if (!ledEnsure()) { ledSchedule(); return; }
    led.cv.hidden = false;
    var target = ledFrontX();
    if (sweep && root.dataset.motion !== 'reduced' && !doc.hidden) {
      // The light sweeps in to where the shift is now (one ease, the same on
      // every computer; none only for the system's "reduce motion").
      ledReset();
      var t0 = performance.now(), dur = 900;
      var step = function (now) {
        if (!led.on) return;
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        ledDraw(target * e);
        if (k < 1) led.anim = requestAnimationFrame(step);
        else applyTone();
      };
      led.anim = requestAnimationFrame(step);
    } else ledDraw(target);
    ledSchedule();
    applyTone();
  }
  function ledHide() {
    led.on = false;
    cancelAnimationFrame(led.anim);
    clearTimeout(led.timer);
    if (led.cv) { led.cv.hidden = true; ledReset(); }
    applyTone();
  }
  function ledSchedule() {
    clearTimeout(led.timer);
    if (!led.on) return;
    led.timer = setTimeout(function () {
      if (!doc.hidden && led.on && ledEnsure()) { led.cv.hidden = false; ledDraw(ledFrontX()); }
      applyTone();
      ledSchedule();
    }, 60000 - (Date.now() % 60000) + 50);
  }
  // A new picture (period change, rotation) or size: read the colours again.
  function ledRefresh() {
    tone.key = '';
    applyTone();
    if (!led.on) return;
    led.key = '';
    if (ledEnsure()) { led.cv.hidden = false; ledDraw(ledFrontX()); }
  }

  /* ── Auto krāsas (kā kartīšu redaktora "Auto") ───────────────────────────
     Katrai galvenes zonai (kreisais spārns, vidus, labais spārns, lineāls)
     izmēra, cik gaiša bilde ir zem teksta. Uz gaišas bildes teksts un ikonas
     kļūst tumši, uz tumšas paliek gaiši; kur jau ir LED matrica, teksts ir
     gaišs ar stingrāku oreolu un lodziņi necaurspīdīgāki. Bilde tiek
     nolasīta vienreiz (8 px šūnas), lēmums ir četri skaitļi. */
  var tone = { key: '', lum: null, cols: 0, rows: 0, cell: 8 };
  function chanLin(v) { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }
  function toneSample() {
    var host = ledHost(), row = doc.querySelector('#minkaBarWrap > .scroll-row');
    if (!host || !row) return null;
    var src = ledSource(host);
    if (!src) return null;
    var hr = host.getBoundingClientRect(), rr = row.getBoundingClientRect();
    var W = Math.round(hr.width), H = Math.round(rr.top - hr.top);
    if (W < 200 || H < 40) return null;
    var key = (src.kind === 'img' ? (src.el.currentSrc || src.el.src) : 'stretch:' + src.el.width) + '|' + W + 'x' + H;
    if (tone.key === key && tone.lum) return tone;
    var cols = Math.ceil(W / tone.cell), rows = Math.ceil(H / tone.cell);
    var data = ledColours(host, src, cols, rows, tone.cell);
    if (!data) return null;
    var lum = new Float32Array(cols * rows);
    for (var i = 0; i < lum.length; i++) lum[i] = .2126 * chanLin(data[i * 4]) + .7152 * chanLin(data[i * 4 + 1]) + .0722 * chanLin(data[i * 4 + 2]);
    tone.key = key; tone.lum = lum; tone.cols = cols; tone.rows = rows;
    return tone;
  }
  // How light the picture is under a zone (70th percentile) and how busy (spread).
  function zoneStats(t, x0, x1, y0, y1) {
    var c = t.cell, vals = [], sum = 0;
    for (var y = Math.max(0, Math.floor(y0 / c)); y < Math.min(t.rows, Math.ceil(y1 / c)); y++)
      for (var x = Math.max(0, Math.floor(x0 / c)); x < Math.min(t.cols, Math.ceil(x1 / c)); x++) { var v = t.lum[y * t.cols + x]; vals.push(v); sum += v; }
    if (!vals.length) return { p70: 0, sd: 0 };
    var mean = sum / vals.length, varSum = 0;
    vals.forEach(function (v) { varSum += (v - mean) * (v - mean); });
    vals.sort(function (a, b) { return a - b; });
    return { p70: vals[Math.floor(vals.length * .7)], sd: Math.sqrt(varSum / vals.length) };
  }
  // Windows that live outside the header (the birthday list) take the same
  // picture colours: the palette is mirrored onto <html> when it changes.
  var lastPal = '';
  function syncPaletteToRoot() {
    var wrap = $('minkaBarWrap');
    if (!wrap) return;
    var cs = getComputedStyle(wrap), acc = cs.getPropertyValue('--hs-accent').trim(), surf = cs.getPropertyValue('--hs-surface').trim();
    if (!acc || acc + surf === lastPal) return;
    lastPal = acc + surf;
    root.style.setProperty('--hxr-accent', acc);
    root.style.setProperty('--hxr-surface', surf);
  }
  function applyTone() {
    syncPaletteToRoot();
    var wrap = $('minkaBarWrap'), host = ledHost();
    if (!top || !wrap || !host) return;
    var t = toneSample();
    // Where the light matrix will be (its target, also while it sweeps in).
    var hr = host.getBoundingClientRect(), front = led.on && led.st ? ledFrontX() : -1;
    function zone(el) {
      if (!el || !t) return 'dark';
      var r = el.getBoundingClientRect(), x0 = r.left - hr.left, x1 = r.right - hr.left;
      if (front > x0 + 12) return 'led';
      // Dark text only on a calm, light picture (sky, dunes); on a busy one
      // (a city from above) white text with a dark halo reads better.
      var z = zoneStats(t, x0, x1, r.top - hr.top, r.bottom - hr.top);
      return z.p70 > .34 && z.sd < .13 ? 'light' : 'dark';
    }
    var ruler = doc.querySelector('#shift-progress-wrap:not([hidden])') || $('hxAxis');
    var next = { l: zone(top.querySelector('.hx-wing-rg')), c: zone(center), r: zone(top.querySelector('.hx-wing-rd')), ruler: zone(ruler) };
    if (top.dataset.toneL !== next.l) top.dataset.toneL = next.l;
    if (top.dataset.toneC !== next.c) top.dataset.toneC = next.c;
    if (top.dataset.toneR !== next.r) top.dataset.toneR = next.r;
    if (wrap.dataset.hxToneRuler !== next.ruler) wrap.dataset.hxToneRuler = next.ruler;
  }
  function ledWatch() {
    var host = ledHost();
    if (!host || host.__hxLedWatch) return;
    host.__hxLedWatch = true;
    var wrapEl = $('minkaBarWrap');
    if (wrapEl) new MutationObserver(syncPaletteToRoot).observe(wrapEl, { attributes: true, attributeFilter: ['style'] });
    host.addEventListener('load', function () { setTimeout(ledRefresh, 60); }, true);
    if (window.ResizeObserver) {
      led.ro = new ResizeObserver(function () { clearTimeout(led.roT); led.roT = setTimeout(ledRefresh, 300); });
      led.ro.observe(host);
    }
  }
  window.addEventListener('minka:header-scenery', function () { setTimeout(ledRefresh, 120); });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden && led.on) { if (ledEnsure()) ledDraw(ledFrontX()); ledSchedule(); } });

  /* ── Laikapstākļi un mēness ──────────────────────────────────────────── */
  var WEATHER_ASSETS = { cloudy: 'cloudy', rain: 'rain', 'heavy-rain': 'extreme-rain', snow: 'snow', sleet: 'sleet', hail: 'hail', fog: 'fog', thunderstorm: 'thunderstorms-rain' };
  var MOON_ASSETS = ['moon-new', 'moon-waxing-crescent', 'moon-first-quarter', 'moon-waxing-gibbous', 'moon-full', 'moon-waning-gibbous', 'moon-last-quarter', 'moon-waning-crescent'];
  function weatherAsset(w) {
    var H = window.MinkaHeaderWeather;
    if (!H || !H.mapCondition) return 'partly-cloudy-day';
    var state = H.mapCondition(w), period = /n$/.test(String(w.icon || '')) ? 'night' : 'day';
    return state === 'clear' || state === 'partly-cloudy' ? state + '-' + period : (WEATHER_ASSETS[state] || 'cloudy');
  }
  function wimg(w, size) {
    return '<img src="assets/weather-icons/' + weatherAsset(w) + '.svg" width="' + size + '" height="' + size + '" alt="" aria-hidden="true">';
  }
  function weatherPopHtml() {
    var w = window.__mkBarWeatherData;
    if (!w || w.t == null) return '<p class="hx-pop-empty">Laikapstākļi vēl ielādējas…</p>';
    var html = '<div class="hx-pop-head"><span class="hx-pop-eyebrow">Rīga, tagad</span></div>'
      + '<div class="hx-wx-now">' + wimg(w, 52) + '<div><b class="hx-wx-temp">' + esc(w.t) + '°</b><span class="hx-wx-desc">' + esc(cap(w.desc || '')) + '</span></div></div>'
      + '<dl class="hx-wx-facts">'
      + (w.feels != null ? '<div><dt>Jūtams</dt><dd>' + esc(w.feels) + '°</dd></div>' : '')
      + (w.wind != null ? '<div><dt>Vējš</dt><dd>' + esc(w.wind) + ' m/s</dd></div>' : '')
      + (w.humidity ? '<div><dt>Mitrums</dt><dd>' + esc(w.humidity) + '%</dd></div>' : '')
      + (w.sunrise && w.sunset ? '<div><dt>Saule</dt><dd>' + esc(w.sunrise) + '–' + esc(w.sunset) + '</dd></div>' : '')
      + '</dl>';
    var hours = (w.hours || []).slice(0, 6);
    if (hours.length) {
      html += '<div class="hx-wx-hours" aria-label="Nākamās stundas">' + hours.map(function (h) {
        return '<span>' + '<small>' + esc(h.time) + '</small>' + wimg(h, 26) + '<b>' + esc(h.t) + '°</b></span>';
      }).join('') + '</div>';
    }
    // The chosen day's forecast, when it is not today (up to a week ahead).
    var sel = parseDMY(activeDate()), calToday = new Date();
    if (sel && w.days && dmy(sel) !== dmy(calToday)) {
      var key = sel.getFullYear() + '-' + pad(sel.getMonth() + 1) + '-' + pad(sel.getDate());
      var day = w.days.filter(function (x) { return x.date === key; })[0];
      if (day) {
        html += '<div class="hx-wx-day">' + wimg(day, 34) + '<div><span class="hx-pop-eyebrow">Prognoze: ' + esc(CORE.longLabel(sel)) + '</span>'
          + '<b>' + esc(day.min) + '° … ' + esc(day.max) + '°</b> <span>' + esc(cap(day.desc || '')) + (day.rain != null && day.rain > 0 ? ', lietus iespēja ' + esc(day.rain) + '%' : '') + '</span></div></div>';
      }
    }
    var at = w.at ? new Date(w.at) : null;
    html += '<p class="hx-pop-foot">' + (at ? 'Atjaunots ' + pad(at.getHours()) + ':' + pad(at.getMinutes()) + '. ' : '') + 'Dati: OpenWeatherMap</p>';
    return html;
  }
  function moonPopHtml() {
    var m = typeof window.currentMoon === 'function' ? window.currentMoon() : null;
    if (!m) return '<p class="hx-pop-empty">Nav datu par mēnesi</p>';
    var cycle = 29.53, day = Number(m.dayOfCycle) || 0;
    var toFull = Math.round(((cycle / 2 - day) % cycle + cycle) % cycle);
    var toNew = Math.round(((cycle - day) % cycle + cycle) % cycle);
    function when(n) { return n === 0 ? 'šodien' : n === 1 ? 'rīt' : 'pēc ' + n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'dienas' : 'dienām'); }
    var sel = parseDMY(activeDate());
    return '<div class="hx-pop-head"><span class="hx-pop-eyebrow">Mēness ' + esc(sel ? sel.getDate() + '. ' + CORE.MONTH_GEN[sel.getMonth()].replace(/a$/, 'ā').replace(/ļa$/, 'lī') : '') + '</span></div>'
      + '<div class="hx-moon-now"><img src="assets/weather-icons/' + MOON_ASSETS[m.index] + '.svg" width="56" height="56" alt="" aria-hidden="true">'
      + '<div><b>' + esc(cap(m.name)) + '</b><span>Apgaismots ' + esc(m.illum) + '%</span></div></div>'
      + '<dl class="hx-wx-facts"><div><dt>Pilnmēness</dt><dd>' + when(toFull) + '</dd></div><div><dt>Jauns mēness</dt><dd>' + when(toNew) + '</dd></div></dl>';
  }

  /* ── Kafija: QR + Buy me a coffee ar atbalstītāju skaitu ─────────────── */
  var BMC_URL = 'https://buymeacoffee.com/rgapp';
  var BMC_BUTTON_URL = 'https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=rgapp&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff';
  var BMC_COUNT_KEY = 'mkBmcSupportersV1';
  var bmcSrc = '', bmcJob = null, bmcCount = null;
  try {
    var savedCount = JSON.parse(localStorage.getItem(BMC_COUNT_KEY) || 'null');
    if (savedCount && Number.isFinite(savedCount.n)) bmcCount = savedCount.n;
  } catch (_e) {}
  // The official button draws the supporter count in white on yellow; one
  // fetch gives both a readable (black) count and the number for the chip.
  function loadBmc() {
    if (bmcJob) return bmcJob;
    bmcJob = fetch(BMC_BUTTON_URL).then(function (r) { return r.ok ? r.text() : ''; }).then(function (svg) {
      if (!svg) return;
      var m = svg.match(/text-anchor="middle"[^>]*>\s*(\d{1,6})\s*</);
      if (m) {
        bmcCount = +m[1];
        try { localStorage.setItem(BMC_COUNT_KEY, JSON.stringify({ n: bmcCount, at: Date.now() })); } catch (_s) {}
        paintBmcCount();
      }
      var dark = svg.replace(/(<text[^>]*text-anchor="middle"[^>]*fill=")white(")/, '$1#000000$2');
      if (window.URL && URL.createObjectURL) bmcSrc = URL.createObjectURL(new Blob([dark], { type: 'image/svg+xml' }));
      var img = doc.querySelector('#hxPop .hx-bmc img');
      if (img && bmcSrc) img.src = bmcSrc;
    }).catch(function () {});
    return bmcJob;
  }
  function paintBmcCount() {
    if (!els.coffee) return;
    var box = els.coffee.querySelector('.hx-coffee-count');
    if (!box) return;
    box.hidden = !(bmcCount > 0);
    box.querySelector('b').textContent = bmcCount > 0 ? String(bmcCount) : '';
    els.coffee.title = bmcCount > 0 ? 'Atbalsti RG: ' + bmcCount + ' jau uzsaukuši kafiju' : 'Atbalsti RG';
  }
  function coffeePopHtml() {
    var n = bmcCount > 0 ? bmcCount : 0;
    return '<div class="hx-coffee-pop">'
      + '<a class="hx-qr-big" href="' + BMC_URL + '" target="_blank" rel="noopener" aria-label="Atvērt buymeacoffee.com/rgapp">'
      +   '<img src="assets/coffee/bmc-qr.svg?v=official1" width="136" height="136" alt="QR kods uz buymeacoffee.com/rgapp"></a>'
      + '<div class="hx-coffee-copy">'
      +   '<span class="hx-pop-eyebrow">Brīvprātīgs atbalsts</span>'
      +   '<h3>Atbalsti RG attīstību</h3>'
      +   '<p>Ja RG tev noder darbā, vari uzsaukt kafiju: tas ir paldies par ieguldīto laiku un atbalsts nākamajiem uzlabojumiem.</p>'
      +   '<p class="hx-muted">Noskenē QR ar telefona kameru vai spied pogu. ' + (n ? 'Skaitlis pogā rāda, cik cilvēku jau atbalstījuši: <b>' + n + '</b>.' : 'Skaitlis pogā rāda, cik cilvēku jau atbalstījuši.') + '</p>'
      +   '<a class="hx-bmc" href="' + BMC_URL + '" target="_blank" rel="noopener"><img alt="Buy me a coffee" width="188" height="40" decoding="async" src="' + esc(bmcSrc || BMC_BUTTON_URL) + '"></a>'
      + '</div></div>';
  }

  /* ── Rīki: iepriekšējās četras bezvārda ikonas dienu joslā, tagad ar
     nosaukumiem, paskaidrojumu un slēdža stāvokli, blakus meklēšanai. ── */
  function toolState() {
    var today = activeDate() === shiftToday();
    var wrapP = $('shift-progress-wrap'), nsBtn = $('ns-bar-toggle');
    var nsAvail = today && !!nsBtn && !nsBtn.hidden;
    return { today: today, lanes: !!wrapP && !wrapP.classList.contains('lanes-collapsed'), nsAvail: nsAvail, ns: nsAvail && nsBtn.classList.contains('is-on') };
  }
  function toolsHtml() {
    var t = toolState();
    function item(id, ic, title, sub, trail, disabled) {
      return '<button type="button" class="hx-mi' + (disabled ? ' is-disabled' : '') + '" role="menuitem" data-tool="' + id + '"' + (disabled ? ' aria-disabled="true"' : '') + '>'
        + '<span class="hx-mi-ic">' + icon(ic) + '</span><span class="hx-mi-main"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span>' + (trail || '') + '</button>';
    }
    function sw(on) { return '<span class="hx-switch' + (on ? ' is-on' : '') + '" aria-hidden="true"><i></i></span>'; }
    var chev = icon('chevR', 'hx-mi-chev');
    return '<div class="hx-menu" role="menu" aria-label="Rīki">'
      + item('phones', 'phone', 'Tālruņu saraksts', 'Visi numuri pa nodaļām, ar meklēšanu', chev)
      + item('lanes', 'lanes', 'Katra maiņa savā joslā', t.today ? 'Laika lineālā zem galvenes' : 'Pieejams tikai šodienai', sw(t.lanes), !t.today)
      + (IS_RAD ? '' : item('ns', 'moon', 'Nakts sadalījums lineālā', t.nsAvail ? 'Kurš guļ kurā laikā, uz laika joslas' : (t.today ? 'Šodienai nakts plāna vēl nav' : 'Pieejams tikai šodienai'), sw(t.ns), !t.nsAvail))
      + item('cal', 'calendar', 'Izvēlēties datumu', 'Pāriet uz jebkuru dienu', chev)
      + item('look', 'palette', 'Galvenes izskats', 'Fons, krāsas, progresa josla', chev)
      + '<div class="hx-mi-keys" role="note"><b>Taustiņi</b>'
      +   '<span><kbd>←</kbd><kbd>→</kbd> iepriekšējā, nākamā diena</span>'
      +   '<span><kbd>T</kbd> šodiena</span>'
      +   '<span><kbd>' + (isMac ? '⌘' : 'Ctrl') + '</kbd><kbd>K</kbd> meklēt</span></div>'
      + '</div>';
  }
  function runTool(id) {
    if (id === 'lanes' || id === 'ns') {
      var b = $(id === 'lanes' ? 'lanes-mini-toggle' : 'ns-bar-toggle');
      if (b) b.click();
      // The switch slides to the new state in place (no re-render).
      var t = toolState(), el = pop && pop.querySelector('[data-tool="' + id + '"] .hx-switch');
      if (el) el.classList.toggle('is-on', id === 'lanes' ? t.lanes : t.ns);
      return;
    }
    var from = els.tools;
    closePop();
    if (id === 'phones') openPhones(from);
    else if (id === 'cal') openDate(from);
    else if (id === 'look') openLook(from);
  }

  /* ── Datuma izvēle: M3 kalendārs ─────────────────────────────────────────
     Aizstāj veco mini kalendāru (calendar.js, tas paliek telefonam un /rad).
     Izaug no pogas, kas to atvēra (Rīki vai kalendāra poga dienu joslā), un
     stāv zem tās, tonēts kā pārējie galvenes logi. Mēneši pārslēdzas tikai
     logā: grafiks pāriet uz citu mēnesi tikai tad, kad izvēlas dienu. Mēneši
     bez grafika ir blāvi. Taustiņi: bultas pa dienām un nedēļām, PageUp /
     PageDown pa mēnešiem, Home / End nedēļas sākums un beigas, Esc aizver. */
  var dp = { el: null, anchor: null, y: 0, m: 0, focus: '' };
  var DP_WD = ['Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se', 'Sv'];
  // Months with a schedule (either role) as year * 12 + month, from the
  // previous month on like the calendar's own list; null while not loaded.
  function dpMonths() {
    var set = {}, n = 0, t = parseDMY(shiftToday()), min = t ? t.getFullYear() * 12 + t.getMonth() - 1 : 0;
    [window.__grafiksStore, window.__grafiksStoreRad].forEach(function (store) {
      if (!store || typeof store !== 'object') return;
      Object.keys(store).forEach(function (key) {
        var mi = -1, y = 0;
        String(key).split(/\s+/).forEach(function (w) {
          if (/^20\d{2}$/.test(w)) y = +w;
          else if (/^\d{2}$/.test(w)) y = y || 2000 + +w;
          else if (mi < 0) mi = CORE.monthIndex(w);
        });
        if (mi >= 0 && y && y * 12 + mi >= min) { set[y * 12 + mi] = true; n++; }
      });
    });
    return n ? set : null;
  }
  function dpRange(months) {
    if (!months) return null;
    var keys = Object.keys(months).map(Number);
    return { min: Math.min.apply(null, keys), max: Math.max.apply(null, keys) };
  }
  function dpHtml() {
    var months = dpMonths(), range = dpRange(months), view = dp.y * 12 + dp.m, has = !months || !!months[view];
    var n = new Date(dp.y, dp.m + 1, 0).getDate(), lead = (new Date(dp.y, dp.m, 1).getDay() + 6) % 7;
    var today = shiftToday(), active = activeDate();
    var html = '<div class="hx-dp-head">'
      + '<b class="hx-dp-title" id="hxDpTitle">' + esc(cap(CORE.MONTH_NAMES[dp.m])) + ' ' + dp.y + '</b>'
      + '<button type="button" class="hx-dp-nav" data-dp="-1" aria-label="Iepriekšējais mēnesis"' + (range && view <= range.min ? ' disabled' : '') + '>' + icon('chevL') + '</button>'
      + '<button type="button" class="hx-dp-nav" data-dp="1" aria-label="Nākamais mēnesis"' + (range && view >= range.max ? ' disabled' : '') + '>' + icon('chevR') + '</button>'
      + '</div>'
      + '<div class="hx-dp-wd" aria-hidden="true">' + DP_WD.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>'
      + '<div class="hx-dp-grid" role="group" aria-labelledby="hxDpTitle">';
    for (var i = 0; i < lead; i++) html += '<span aria-hidden="true"></span>';
    for (var d = 1; d <= n; d++) {
      var date = new Date(dp.y, dp.m, d), ds = dmy(date), weekend = date.getDay() === 0 || date.getDay() === 6;
      var label = CORE.longLabel(date) + ' ' + dp.y + (ds === today ? ', šodien' : '') + (ds === active ? ', atvērta' : '') + (has ? '' : ', grafika vēl nav');
      html += '<button type="button" class="hx-dp-day' + (weekend ? ' is-weekend' : '') + (ds === today ? ' is-today' : '') + (ds === active ? ' is-active' : '') + '"'
        + ' data-date="' + ds + '" tabindex="' + (ds === dp.focus ? '0' : '-1') + '" aria-label="' + esc(label) + '"'
        + (ds === today ? ' aria-current="date"' : '') + (has ? '' : ' aria-disabled="true"') + '>' + d + '</button>';
    }
    return html + '</div>' + (has ? '' : '<p class="hx-dp-note">Šim mēnesim grafika vēl nav</p>')
      + '<div class="hx-dp-foot"><button type="button" class="hx-dp-today" data-dp="today" title="Atpakaļ uz šodienu (T)">' + icon('undo') + '<span>Šodien</span></button></div>';
  }
  // The grid's one tab stop: the chosen day, today or the 1st of the month.
  function dpRender(focusSel) {
    if (!dp.el) return;
    var inView = function (ds) { var x = parseDMY(ds); return !!x && x.getFullYear() === dp.y && x.getMonth() === dp.m; };
    if (!inView(dp.focus)) dp.focus = [activeDate(), shiftToday()].filter(inView)[0] || dmy(new Date(dp.y, dp.m, 1));
    dp.el.innerHTML = dpHtml();
    var t = focusSel && dp.el.querySelector(focusSel);
    if (t && t.disabled) t = dp.el.querySelector('.hx-dp-day[tabindex="0"]');
    if (t) t.focus({ preventScroll: true });
  }
  function ensureDate() {
    if (dp.el) return dp.el;
    var el = doc.createElement('div');
    el.id = 'hxDate';
    el.className = 'hx-dp';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Izvēlēties datumu');
    el.hidden = true;
    $('minkaBarWrap').appendChild(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.date) {
        if (b.getAttribute('aria-disabled') === 'true') toast('Šim mēnesim grafika vēl nav');
        else pickDate(b.dataset.date);
      } else if (b.dataset.dp === 'today') pickDate(shiftToday());
      else {
        var v = dp.y * 12 + dp.m + +b.dataset.dp;
        dp.y = Math.floor(v / 12); dp.m = v % 12;
        dpRender('[data-dp="' + b.dataset.dp + '"]');
      }
    });
    el.addEventListener('keydown', dpKey);
    dp.el = el;
    return el;
  }
  function dpKey(e) {
    var k = e.key;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeDate(true); return; }
    var day = e.target.closest && e.target.closest('.hx-dp-day');
    var d = day && parseDMY(day.dataset.date);
    if (!d || e.altKey || e.ctrlKey || e.metaKey) return;
    var wd = (d.getDay() + 6) % 7, to = new Date(d);
    if (k === 'ArrowLeft') to.setDate(d.getDate() - 1);
    else if (k === 'ArrowRight') to.setDate(d.getDate() + 1);
    else if (k === 'ArrowUp') to.setDate(d.getDate() - 7);
    else if (k === 'ArrowDown') to.setDate(d.getDate() + 7);
    else if (k === 'Home') to.setDate(d.getDate() - wd);
    else if (k === 'End') to.setDate(d.getDate() + 6 - wd);
    else if (k === 'PageUp' || k === 'PageDown') {
      to = new Date(d.getFullYear(), d.getMonth() + (k === 'PageUp' ? -1 : 1), 1);
      to.setDate(Math.min(d.getDate(), new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate()));
    } else return;
    e.preventDefault();
    e.stopPropagation();
    var range = dpRange(dpMonths()), v = to.getFullYear() * 12 + to.getMonth();
    if (range && (v < range.min || v > range.max)) return;
    dp.focus = dmy(to);
    if (to.getFullYear() !== dp.y || to.getMonth() !== dp.m) {
      dp.y = to.getFullYear(); dp.m = to.getMonth();
      dpRender('.hx-dp-day[tabindex="0"]');
      return;
    }
    day.tabIndex = -1;
    var next = dp.el.querySelector('[data-date="' + dp.focus + '"]');
    if (next) { next.tabIndex = 0; next.focus({ preventScroll: true }); }
  }
  function pickDate(ds) {
    closeDate(true);
    // The roster is rebuilt a frame later, so the window starts closing at once.
    requestAnimationFrame(function () { goToDate(ds); });
  }
  function openDate(anchor) {
    closePop();
    closeSearch(false);
    closePhones();
    var el = ensureDate(), a = dp.anchor = anchor && anchor.isConnected ? anchor : els.tools;
    var d = parseDMY(activeDate()) || new Date();
    dp.y = d.getFullYear(); dp.m = d.getMonth(); dp.focus = activeDate();
    dpRender();
    el.__closing = false;
    el.hidden = false;
    // Under its opener, centred on it, inside the header's width.
    var wr = $('minkaBarWrap').getBoundingClientRect(), ar = a.getBoundingClientRect(), w = el.offsetWidth;
    el.style.left = Math.round(Math.max(8, Math.min(wr.width - w - 8, ar.left + ar.width / 2 - wr.left - w / 2))) + 'px';
    el.style.top = Math.round(ar.bottom - wr.top + 8) + 'px';
    if (a.getAttribute('aria-haspopup') === 'dialog') a.setAttribute('aria-expanded', 'true');
    layerSync();
    var M = motion();
    if (M && M.openSurface) M.openSurface(el, { key: 'hx-date', origin: a });
    var day = el.querySelector('.hx-dp-day[tabindex="0"]');
    if (day) day.focus({ preventScroll: true });
    doc.addEventListener('pointerdown', outsideDate, true);
  }
  function closeDate(restoreFocus) {
    var el = dp.el, a = dp.anchor;
    if (!el || el.hidden || el.__closing) return;
    el.__closing = true;
    doc.removeEventListener('pointerdown', outsideDate, true);
    if (a && a.getAttribute('aria-haspopup') === 'dialog') a.setAttribute('aria-expanded', 'false');
    var done = function () { if (!el.__closing) return; el.__closing = false; el.hidden = true; layerSync(); };
    var M = motion();
    if (M && M.closeSurface && a && a.isConnected) M.closeSurface(el, { key: 'hx-date', origin: a }, done);
    else done();
    if (restoreFocus && a && a.isConnected) a.focus({ preventScroll: true });
  }
  function toggleDate(anchor) {
    if (dp.el && !dp.el.hidden && !dp.el.__closing && dp.anchor === anchor) closeDate(false);
    else openDate(anchor);
  }
  function outsideDate(e) {
    if (dp.el && !dp.el.contains(e.target) && !(dp.anchor && dp.anchor.contains(e.target))) closeDate(false);
  }

  /* ── Galvenes izskats: izaug no pogas, kas to atvēra, un stāv zem galvenes
     (agrāk tas bija piesiets ekrāna apakšējam stūrim pie vecās pogas). ── */
  function openLook(anchor) {
    closePop();
    closeSearch(false);
    closeDate(false);
    var b = $('headerAppearanceBtn');
    if (!b) return;
    b.click();
    var d = $('headerAppearance');
    if (!d || !d.open) return;
    var from = anchor && anchor.isConnected ? anchor : els.tools;
    var wr = $('minkaBarWrap').getBoundingClientRect(), ar = from.getBoundingClientRect();
    var w = d.offsetWidth, vw = window.innerWidth, topPx = Math.round(wr.bottom + 10);
    d.style.inset = 'auto';
    d.style.top = topPx + 'px';
    d.style.left = Math.round(Math.max(16, Math.min(vw - w - 16, ar.left + ar.width / 2 - w / 2))) + 'px';
    d.style.maxHeight = 'calc(100dvh - ' + (topPx + 16) + 'px)';
    var M = motion();
    if (M && M.openSurface) M.openSurface(d, { key: 'hs-dialog', origin: from });
  }

  /* ── Tālruņi: pārskatāms saraksts tajā pašā stilā kā pārējie logi ─────────
     Meklēšana augšā, kategorijas pa kreisi (ar skaitu), numuri pa labi.
     Klikšķis uz rindas nokopē numuru un to arī pasaka. */
  var ph = { el: null, cat: '', anchor: null, t: 0 };
  var UPPER_WORD = /^[A-ZĀČĒĢĪĶĻŅŌŖŠŪŽ]{4,}$/;
  function phoneCatLabel(cat) {
    var c = String(cat || 'Citi').trim();
    if (/^trendi$/i.test(c)) return 'Bieži lietotie';
    // Whole words in capitals read as shouting; short codes (GA, CT, LOC) stay.
    return c.split(/(\s+|[()])/).map(function (w) { return UPPER_WORD.test(w) ? w.charAt(0) + w.slice(1).toLocaleLowerCase('lv') : w; }).join('');
  }
  function phoneFmt(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length === 8) return d.slice(0, 2) + ' ' + d.slice(2, 5) + ' ' + d.slice(5);
    return String(phone || '').trim();
  }
  function phoneGroups() {
    var db = Array.isArray(window.hospitalDatabase) ? window.hospitalDatabase : [];
    var groups = {};
    db.forEach(function (item) {
      if (!item || !item.phone) return;
      var cat = String(item.cat || 'Citi').trim();
      (groups[cat] = groups[cat] || []).push(item);
    });
    return Object.keys(groups).sort(function (a, b) {
      if (/^trendi$/i.test(a)) return -1;
      if (/^trendi$/i.test(b)) return 1;
      return phoneCatLabel(a).localeCompare(phoneCatLabel(b), 'lv');
    }).map(function (cat) {
      return { cat: cat, label: phoneCatLabel(cat), items: groups[cat].slice().sort(function (x, y) { return String(x.name || '').localeCompare(String(y.name || ''), 'lv'); }) };
    });
  }
  function ensurePhones() {
    if (ph.el) return ph.el;
    var el = doc.createElement('div');
    el.id = 'hxPhones';
    el.className = 'hx-phones';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Tālruņi');
    el.hidden = true;
    el.innerHTML = '<div class="hx-ph-head">'
      + '<span class="hx-ph-title">' + icon('phone') + '<b>Tālruņi</b><small class="hx-ph-total"></small></span>'
      + '<label class="hx-ph-search">' + icon('search') + '<input type="text" autocomplete="off" spellcheck="false" placeholder="Meklēt nodaļu, vārdu vai numuru" aria-label="Meklēt tālruni"></label>'
      + '<button type="button" class="hx-ph-close" aria-label="Aizvērt">' + '<svg class="hx-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>'
      + '</div>'
      + '<div class="hx-ph-body"><nav class="hx-ph-cats" aria-label="Kategorijas"></nav><div class="hx-ph-list" role="list"></div></div>';
    $('minkaBarWrap').appendChild(el);
    var input = el.querySelector('input');
    input.addEventListener('input', function () { clearTimeout(ph.t); ph.t = setTimeout(renderPhones, 50); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (input.value) { input.value = ''; renderPhones(); } else closePhones(); }
    });
    el.querySelector('.hx-ph-close').addEventListener('click', function () { closePhones(); });
    el.querySelector('.hx-ph-cats').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      ph.cat = b.dataset.cat;
      input.value = '';
      renderPhones();
      el.querySelector('.hx-ph-list').scrollTop = 0;
    });
    ph.el = el;
    return el;
  }
  function renderPhones() {
    var el = ph.el;
    if (!el) return;
    var groups = phoneGroups(), q = el.querySelector('input').value.trim(), digits = q.replace(/\D/g, '');
    var total = groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    el.querySelector('.hx-ph-total').textContent = total ? total + ' numuri' : '';
    el.querySelector('.hx-ph-cats').innerHTML = '<button type="button" data-cat=""' + (!ph.cat && !q ? ' aria-current="true"' : '') + '><span>Visi</span><b>' + total + '</b></button>'
      + groups.map(function (g) {
        return '<button type="button" data-cat="' + esc(g.cat) + '"' + (ph.cat === g.cat && !q ? ' aria-current="true"' : '') + '><span>' + esc(g.label) + '</span><b>' + g.items.length + '</b></button>';
      }).join('');
    var shown = groups.filter(function (g) { return q || !ph.cat || g.cat === ph.cat; }).map(function (g) {
      var items = g.items;
      if (q) {
        items = items.map(function (it) {
          var m = CORE.match(q, String(it.name || ''));
          var score = m.score || CORE.match(q, g.label + ' ' + (it.sub || '')).score * .7;
          if (!score && digits.length >= 2 && String(it.phone).replace(/\D/g, '').indexOf(digits) >= 0) score = 60;
          return score ? { it: it, hits: m.hits, score: score } : null;
        }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });
      } else items = items.map(function (it) { return { it: it, hits: [] }; });
      return { g: g, items: items };
    }).filter(function (x) { return x.items.length; });
    var list = el.querySelector('.hx-ph-list');
    if (!total) { list.innerHTML = '<p class="hx-ph-empty"><b>Numuri vēl ielādējas</b><span>Tie parādās pēc pieslēgšanās.</span></p>'; return; }
    if (!shown.length) { list.innerHTML = '<p class="hx-ph-empty"><b>Nekas neatrasts: ' + esc(q) + '</b><span>Mēģini nodaļas nosaukumu vai numura ciparus.</span></p>'; return; }
    list.innerHTML = shown.map(function (x) {
      return '<section class="hx-ph-group"><h3>' + esc(x.g.label) + '<small>' + x.items.length + '</small></h3>'
        + x.items.map(function (r) {
          var it = r.it;
          return '<div class="hx-ph-row' + (q && r.score >= 80 ? ' is-hit' : '') + '" role="listitem">'
            + '<span class="hx-ph-name"><b>' + mark(String(it.name || ''), r.hits) + '</b>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>'
            + '<span class="hx-ph-num">' + esc(phoneFmt(it.phone)) + '</span>'
            + '</div>';
        }).join('') + '</section>';
    }).join('');
  }
  function openPhones(anchor, query) {
    closePop();
    closeSearch(false);
    closeDate(false);
    var el = ensurePhones();
    ph.anchor = anchor && anchor.isConnected ? anchor : els.tools;
    el.querySelector('input').value = query || '';
    if (query) ph.cat = '';
    renderPhones();
    var wrap = $('minkaBarWrap'), wr = wrap.getBoundingClientRect();
    var width = Math.min(wr.width - 24, 920);
    el.style.width = width + 'px';
    el.style.left = Math.round((wr.width - width) / 2) + 'px';
    el.style.top = Math.round(wr.height + 8) + 'px';
    el.style.height = Math.round(Math.min(window.innerHeight - wr.bottom - 24, 600)) + 'px';
    el.hidden = false;
    el.__closing = false;
    root.classList.add('hx-phones-open');
    layerSync();
    var M = motion();
    if (M && M.openSurface) M.openSurface(el, { key: 'hx-phones', origin: ph.anchor });
    el.querySelector('input').focus({ preventScroll: true });
    doc.addEventListener('pointerdown', outsidePhones, true);
  }
  function closePhones() {
    var el = ph.el;
    if (!el || el.hidden || el.__closing) return;
    el.__closing = true;
    doc.removeEventListener('pointerdown', outsidePhones, true);
    var done = function () { if (!el.__closing) return; el.__closing = false; el.hidden = true; root.classList.remove('hx-phones-open'); layerSync(); };
    var M = motion();
    if (M && M.closeSurface && ph.anchor && ph.anchor.isConnected) M.closeSurface(el, { key: 'hx-phones', origin: ph.anchor }, done);
    else done();
  }
  function outsidePhones(e) {
    if (ph.el && !ph.el.contains(e.target) && !(e.target.closest && e.target.closest('#hxTop [data-menu], #hxPop'))) closePhones();
  }

  /* ── RG telefonā: QR atver RG telefonā, un tur ievada šeit redzamo
     vienreizējo kodu (der 2 minūtes, vienu reizi); paroli tur nevajag.
     Pašu kodu QR saitē vairs neliek: telefons (vai kameras priekšskatījums)
     to iztērēja jau atverot saiti, un ar roku ievadītais kods tad vairs
     nederēja. Kods tiek izveidots tikai atverot logu (tas pats
     /api/pair/new), "Jauns kods" dod jaunu jebkurā brīdī, un, kamēr logs
     ir vaļā, beidzies kods pats nomainās pret jaunu. */
  var MOB_AUTO_RENEW = 4;
  var mob = { job: 0, timer: 0, tick: 0, until: 0, total: 120, renew: 0 };
  // Tās pašas ikonas kā doka pogām (izvēlētajā ikonu komplektā), tumšā
  // flīzītē kā mazas lietotņu ikonas.
  function dockTile(id, fallback) {
    var html = '';
    try { var p = shell(); if (p && p.__mkDockIcon) html = p.__mkDockIcon(id) || ''; } catch (_e) {}
    return '<span class="hx-mob-app" aria-hidden="true">' + (html || icon(fallback)) + '</span>';
  }
  function mobilePopHtml() {
    return '<div class="hx-mob">'
      +   '<div class="hx-mob-top">'
      +     '<div class="hx-mob-qr"><img alt="QR kods: atver ' + APP_NAME + ' telefonā" width="132" height="132"></div>'
      +     '<div class="hx-mob-copy">'
      +       '<span class="hx-pop-eyebrow hx-mob-brand"><img src="../data/rg-cal-24.png?v=20260925ic1" srcset="../data/rg-cal-24.png?v=20260925ic1 1x, ../data/rg-cal-48.png?v=20260925ic1 2x" width="24" height="24" alt="" aria-hidden="true">' + APP_NAME + ' telefonā</span>'
      +       '<h3>Noskenē QR un ievadi kodu</h3>'
      +       '<p>Telefons drošībai prasīs šo vienreizējo kodu:</p>'
      +       '<div class="hx-mob-code is-waiting"><div class="hx-mob-coderow"><b aria-live="polite">···· ····</b>'
      +         '<span class="hx-mob-timer" title="Cik ilgi kods vēl der"><svg viewBox="0 0 24 24" aria-hidden="true">'
      +           '<circle class="hx-mt-track" cx="12" cy="12" r="9"/><circle class="hx-mt-bar" cx="12" cy="12" r="9"/></svg><i></i></span></div>'
      +         '<div class="hx-mob-coderow"><small class="hx-mob-left">Gatavo kodu…</small>'
      +         '<button type="button" class="hx-mob-new" title="Izveidot jaunu kodu">' + icon('refresh') + 'Jauns kods</button></div></div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="hx-mob-why"><h4 class="hx-mob-h">Kāpēc ' + APP_NAME + ' telefonā</h4>'
      +   '<ul class="hx-mob-perks">'
      +     (IS_RAD ? '' : '<li>' + dockTile('planotajsDockBtn', 'lanes') + '<span><b>Grafika plānotājs</b>Vēlmes nākamajiem mēnešiem iesniedz no telefona.</span></li>')
      +     '<li>' + dockTile('monthCalDocBtn', 'calendar') + '<span><b>Grafiks kabatā</b>Kurš strādā šodien, rīt un jebkurā dienā.</span></li>'
      +     '<li>' + dockTile('nsToggleBtnParent', 'moon') + '<span><b>' + (IS_RAD ? 'Nakts un statistika' : 'Nakts, Bolus, statistika') + '</b>Tie paši rīki, kas datorā.</span></li>'
      +     '<li><span class="hx-mob-app is-rg" aria-hidden="true"><img src="../data/rg-cal-32.png?v=20260925ic1" srcset="../data/rg-cal-32.png?v=20260925ic1 1x, ../data/rg-cal-192.png?v=20260924d1 2x" width="30" height="30" alt=""></span><span><b>Kā lietotne</b>Sākuma ekrānā, bez App Store, vienmēr jaunākā versija.</span></li>'
      +   '</ul></div>'
      // Zīmēts telefona paraugs (ne ekrānuzņēmums): nekādu īstu datu.
      + '<img class="hx-mob-phone" src="assets/mobile/rg-phone-illustration.svg?v=20260928i1" width="84" height="175" alt="" aria-hidden="true" decoding="async">'
      + '<div class="hx-mob-steps">'
      +   '<div><b>iPhone</b><span>Safari: ' + icon('share') + 'Kopīgot, tad "Pievienot sākuma ekrānam"</span></div>'
      +   '<div><b>Android</b><span>Chrome: ' + icon('dots') + 'izvēlne, tad "Instalēt lietotni"</span></div>'
      + '</div>'
      + '<p class="hx-mob-safe">' + icon('lock') + '<span><b>Droši.</b> Savienojums šifrēts caur <span class="hx-cf">' + CF_LOGO + 'Cloudflare</span>. Telefonā RG atveras tikai ar vienreizēju kodu.</span></p>'
      + '</div>';
  }
  var qrLib = null;
  function ensureQrLib() {
    if (window.qrcode) return Promise.resolve();
    if (qrLib) return qrLib;
    qrLib = new Promise(function (res, rej) {
      var sc = doc.createElement('script');
      sc.src = '../vendor/qrcode.min.js';
      sc.onload = function () { res(); };
      sc.onerror = function () { qrLib = null; rej(new Error('qr')); };
      doc.head.appendChild(sc);
    });
    return qrLib;
  }
  function mobileBaseUrl() {
    var p = shell(), loc = null;
    try { loc = p ? p.location : location; } catch (_e) { loc = location; }
    var local = /^(localhost|127(?:\.\d+){3}|\[?::1\]?|\d+\.\d+\.\d+\.\d+)$/i.test(loc.hostname || '');
    return !local && loc.protocol === 'https:' ? new URL('mobile.html', loc.href).toString() : 'https://rgapp.page/mobile.html';
  }
  function mobileEls() {
    var box = pop && popKind === 'mobile' ? pop.querySelector('.hx-mob-code') : null;
    return box ? { box: box, code: box.querySelector('b'), left: box.querySelector('.hx-mob-left'), btn: box.querySelector('.hx-mob-new') } : null;
  }
  function mobileNote(text, dim) {
    var m = mobileEls();
    if (!m) return;
    m.left.textContent = text;
    if (dim) { m.code.textContent = '···· ····'; m.box.classList.add('is-waiting'); mobileRing(.28); }
  }
  // M3 noteiktais apļa indikators ar spraugu starp joslu un sliedi: josla
  // sarūk līdz ar koda atlikušo laiku (1 s lineāra pāreja starp sekundēm, tāpēc
  // kustība ir vienmērīga), jauns kods to atsperīgi piepilda.
  var RING_C = 2 * Math.PI * 9, RING_GAP = 4.6;
  function mobileRing(f, refill) {
    var box = pop && pop.querySelector('.hx-mob-timer');
    if (!box) return;
    var bar = box.querySelector('.hx-mt-bar'), track = box.querySelector('.hx-mt-track');
    var L = Math.max(.01, Math.min(1, f)) * RING_C, T = RING_C - L - 2 * RING_GAP;
    if (refill && root.dataset.motion !== 'reduced') {
      box.classList.add('is-refill');
      clearTimeout(box.__refillT);
      box.__refillT = setTimeout(function () { box.classList.remove('is-refill'); }, 600);
    }
    bar.style.strokeDasharray = L.toFixed(2) + ' ' + RING_C.toFixed(2);
    track.style.strokeDasharray = Math.max(0, T).toFixed(2) + ' ' + RING_C.toFixed(2);
    track.style.strokeDashoffset = (-(L + RING_GAP)).toFixed(2);
    track.style.opacity = T > .5 ? '' : '0';
  }
  function mobileTtlText(sec) {
    var min = Math.round(sec / 60);
    return sec >= 90 ? min + ' minūtes' : min === 1 ? '1 minūti' : sec + ' sekundes';
  }
  function mobileStop() {
    mob.job++;
    clearTimeout(mob.timer); clearInterval(mob.tick);
  }
  // The QR holds only the address of RG on the phone; drawn once per opening.
  function mobileQr() {
    var img = pop && pop.querySelector('.hx-mob-qr img');
    if (!img) return;
    ensureQrLib().then(function () {
      if (!img.isConnected) return;
      var u = new URL(mobileBaseUrl());
      if (IS_RAD) u.searchParams.set('app', 'rad');
      u.searchParams.set('from', 'desktop-qr');
      var qr = window.qrcode(0, 'M');
      qr.addData(u.toString());
      qr.make();
      // Whole pixels per module and no baked-in margin: the white tile around
      // it is the quiet zone, so the code sits exactly in the middle and stays
      // sharp (nearest-neighbour) on 1x and 2x screens.
      var n = qr.getModuleCount(), cell = Math.max(3, Math.floor(136 / n));
      img.src = qr.createDataURL(cell, 0);
      img.width = img.height = n * cell;
    }).catch(function () {});
  }
  function mobileOpen() {
    mob.renew = 0;
    mobileQr();
    var m = mobileEls();
    if (m) m.btn.addEventListener('click', function (e) { e.stopPropagation(); mob.renew = 0; mobileRefresh(true); });
    mobileRefresh(false);
  }
  function mobileRefresh(now) {
    mobileStop();
    var job = mob.job;
    var api = window.MinkaApi;
    if (!api || !api.getToken || !api.getToken()) { mobileNote('Vispirms pieslēdzies šajā datorā.', true); return; }
    mobileNote('Gatavo kodu…', true);
    // A mouse just passing over the chip should not create codes.
    mob.timer = setTimeout(function () {
      if (job !== mob.job || !mobileEls()) return;
      api.apiFetch('/api/pair/new', { method: 'POST', json: {} }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok || !data || !data.code) throw new Error('pair');
          return data;
        });
      }).then(function (data) {
        if (job !== mob.job) return;
        var m = mobileEls();
        if (!m) return;
        var code = String(data.code).toUpperCase();
        m.code.textContent = code.slice(0, 4) + ' ' + code.slice(4);
        m.box.classList.remove('is-waiting');
        mob.total = Math.max(20, (Number(data.ttl) || 120));
        mob.until = Date.now() + mob.total * 1000;
        m.left.textContent = 'Der ' + mobileTtlText(mob.total) + ' un tikai vienu reizi';
        mobileRing(1, true);
        mobileTick(job);
        mob.tick = setInterval(function () { mobileTick(job); }, 1000);
      }).catch(function () {
        if (job === mob.job) mobileNote('Neizdevās izveidot kodu. Mēģini vēlreiz.', true);
      });
    }, now || popPinned ? 0 : 320);
  }
  // The ring and the small digits show the code's remaining life; when it
  // runs out a new code comes by itself (a few times, then the button).
  function mobileTick(job) {
    var m = mobileEls();
    if (job !== mob.job || !m) { clearInterval(mob.tick); return; }
    var left = Math.max(0, Math.round((mob.until - Date.now()) / 1000));
    var timer = m.box.querySelector('.hx-mob-timer');
    timer.querySelector('i').textContent = Math.floor(left / 60) + ':' + pad(left % 60);
    timer.classList.toggle('is-low', left <= 15);
    if (!timer.classList.contains('is-refill')) mobileRing(left / mob.total);
    if (left > 0) return;
    clearInterval(mob.tick);
    if (mob.renew < MOB_AUTO_RENEW) { mob.renew++; mobileRefresh(true); }
    else mobileNote('Kods beidzies.', true);
  }
  /* Galvenes logi dzīvo #grafiks-app slānī (z 1000), bet ikdienas kaķis staigā
     virs tā (fixed, z 9999). Kamēr kāds logs ir redzams, slānis paceļas virs
     kaķa; kad logs aizvērts, viss ir kā bija. */
  function layerSync() {
    var up = (pop && !pop.hidden) || (pal && !pal.hidden) || (ph.el && !ph.el.hidden) || (dp.el && !dp.el.hidden);
    root.classList.toggle('hx-layer-up', !!up);
  }

  /* ── Uznirstošās kartītes (laiks, mēness, kafija) ────────────────────── */
  var pop = null, popKind = '', popAnchor = null, popPinned = false, popOpenT = 0, popCloseT = 0;
  function ensurePop() {
    if (pop) return pop;
    pop = doc.createElement('div');
    pop.id = 'hxPop';
    pop.className = 'hx-pop';
    pop.setAttribute('role', 'dialog');
    pop.hidden = true;
    $('minkaBarWrap').appendChild(pop);
    pop.addEventListener('pointerenter', function () { clearTimeout(popCloseT); });
    pop.addEventListener('click', function (e) {
      var mi = e.target.closest('[data-tool]');
      if (mi && mi.getAttribute('aria-disabled') !== 'true') runTool(mi.dataset.tool);
    });
    pop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !popPinned) scheduleClose(); });
    return pop;
  }
  function fillPop(kind) {
    if (!pop) return;
    pop.innerHTML = kind === 'weather' ? weatherPopHtml() : kind === 'moon' ? moonPopHtml() : kind === 'tools' ? toolsHtml() : kind === 'mobile' ? mobilePopHtml() : coffeePopHtml();
    pop.setAttribute('aria-label', kind === 'weather' ? 'Laikapstākļi' : kind === 'moon' ? 'Mēness' : kind === 'tools' ? 'Rīki' : kind === 'mobile' ? APP_NAME + ' telefonā' : 'Atbalstīt RG');
    if (kind === 'mobile') mobileOpen();
    pop.dataset.kind = kind;
  }
  function placePop(anchor) {
    var wrap = $('minkaBarWrap');
    var wr = wrap.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    var w = pop.offsetWidth;
    var left = Math.max(8, Math.min(wr.width - w - 8, ar.left + ar.width / 2 - wr.left - w / 2));
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(ar.bottom - wr.top + 8) + 'px';
    pop.style.transformOrigin = Math.round(ar.left + ar.width / 2 - wr.left - left) + 'px 0';
  }
  // Windows grow out of the chip that opened them and shrink back into it:
  // the same M3 container transform (MinkaMotion) as every other window.
  function motion() { return window.MinkaMotion; }
  function openPop(kind, anchor, pinned) {
    clearTimeout(popCloseT); clearTimeout(popOpenT);
    ensurePop();
    if (kind === 'coffee') loadBmc();
    if (popKind === kind && !pop.hidden && !pop.__closing) { if (pinned) popPinned = true; return; }
    closeSearch(false);
    closeDate(false);
    if (popAnchor) popAnchor.setAttribute('aria-expanded', 'false');
    // Moving from one chip to the next: the same window glides over and its
    // content changes, instead of closing and growing again.
    var glideFrom = !pop.hidden && !pop.__closing && popKind ? pop.getBoundingClientRect() : null;
    if (popKind === 'mobile') mobileStop();
    popKind = kind; popAnchor = anchor; popPinned = !!pinned; pop.__closing = false;
    fillPop(kind);
    pop.hidden = false;
    pop.classList.add('is-open');
    layerSync();
    placePop(anchor);
    anchor.setAttribute('aria-expanded', 'true');
    var M = motion();
    if (glideFrom && pop.animate && root.dataset.motion !== 'reduced') {
      var to = pop.getBoundingClientRect(), t = M && M.token ? M.token('spring-fast') : { duration: 420, easing: 'ease' };
      pop.getAnimations().forEach(function (a) { a.cancel(); });
      pop.animate([{ translate: Math.round(glideFrom.left - to.left) + 'px ' + Math.round(glideFrom.top - to.top) + 'px' }, { translate: '0 0' }], { duration: t.duration, easing: t.easing });
      if (pop.firstElementChild) pop.firstElementChild.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
      return;
    }
    if (M && M.openSurface) M.openSurface(pop, { key: 'hx-pop', origin: anchor });
  }
  function closePop() {
    clearTimeout(popCloseT); clearTimeout(popOpenT);
    mobileStop();
    if (!pop || pop.hidden || pop.__closing) return;
    var anchor = popAnchor;
    if (anchor) anchor.setAttribute('aria-expanded', 'false');
    popKind = ''; popAnchor = null; popPinned = false;
    pop.__closing = true;
    var done = function () {
      if (!pop.__closing) return;                    // reopened meanwhile
      pop.__closing = false; pop.hidden = true; pop.classList.remove('is-open');
      layerSync();
    };
    var M = motion();
    if (M && M.closeSurface && anchor && anchor.isConnected) M.closeSurface(pop, { key: 'hx-pop', origin: anchor }, done);
    else done();
  }
  function scheduleClose() { clearTimeout(popCloseT); popCloseT = setTimeout(closePop, 220); }

  /* ── Meklēšana ───────────────────────────────────────────────────────── */
  var pal = null, palInput = null, palList = null, results = [], activeIdx = -1, palTimer = 0, palOpener = null;
  var RECENT_KEY = window.__mkKey ? window.__mkKey('mkHxRecentV1') : 'mkHxRecentV1';   // /rad keeps its own (other people)
  function recent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') || []; } catch (_e) { return []; } }
  function remember(item) {
    if (!item || !item.ref) return;
    var list = recent().filter(function (r) { return r.ref !== item.ref; });
    list.unshift({ ref: item.ref, kind: item.kind, title: item.title, sub: item.sub || '', data: item.data || null });
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5))); } catch (_e) {}
  }

  var peopleCache = null;
  function people() {
    var a = window.__grafiksStore, b = window.__grafiksStoreRad;
    if (peopleCache && peopleCache.a === a && peopleCache.b === b) return peopleCache.list;
    var map = {};
    function collect(store, isRd) {
      if (!store || typeof store !== 'object') return;
      Object.keys(store).forEach(function (month) {
        var days = store[month];
        if (!Array.isArray(days)) return;
        days.forEach(function (day) {
          if (!day || !day.date) return;
          (day.workers || []).forEach(function (w) {
            var name = String(w && w.name || '').trim();
            if (!name) return;
            var key = (isRd ? 'rd|' : 'rg|') + name.toLowerCase();
            var p = map[key] || (map[key] = { name: name, isRd: isRd, shifts: [] });
            var sh = String(w.shift || '').toUpperCase().trim();
            if (!sh || sh === 'N' || sh.indexOf('A') >= 0) return;
            p.shifts.push({ date: day.date, n: dayNum(day.date), shift: String(w.shift || ''), start: String(w.startTime || '').slice(0, 5), end: String(w.endTime || '').slice(0, 5) });
          });
        });
      });
    }
    collect(a, false);
    collect(b, true);
    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.forEach(function (p) { p.shifts.sort(function (x, y) { return x.n - y.n; }); });
    peopleCache = { a: a, b: b, list: list };
    return list;
  }
  function shiftText(s) {
    if (s.start && s.end) return s.start === s.end ? 'diennakts no ' + s.start : s.start + '–' + s.end;
    return s.shift ? s.shift + ' h' : '';
  }
  function nextShiftText(p) {
    var t = dayNum(shiftToday()), base = parseDMY(shiftToday());
    var next = null;
    for (var i = 0; i < p.shifts.length; i++) { if (p.shifts[i].n >= t) { next = p.shifts[i]; break; } }
    if (!next) return { text: 'Tuvākajā grafikā maiņu nav', date: '' };
    var d = parseDMY(next.date);
    var rel = next.n === t ? 'Šodien' : CORE.relativeLabel(d, base);
    var when = next.n === t || /^(Rīt|Parīt)$/.test(rel) ? rel : rel + ', ' + CORE.WEEKDAYS[d.getDay()].slice(0, 2) + ' ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1);
    return { text: 'Nākamā maiņa: ' + when + (shiftText(next) ? ', ' + shiftText(next) : ''), date: next.date };
  }

  var MONTH_LOC = ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'];
  // When a colleague's birthday and name day are ("5. oktobrī, pēc 7 dienām").
  function personDays(name, base) {
    var tags = [], full = CORE.fold(name), first = CORE.fold(String(name).split(/\s+/)[0]);
    function when(d) {
      var rel = CORE.relativeLabel(d, base).toLowerCase();
      return d.getDate() + '. ' + MONTH_LOC[d.getMonth()] + (rel === 'šodien' || rel === 'rīt' || /^pēc/.test(rel) ? ', ' + rel : '');
    }
    function next(dd, mm) {
      var d = new Date(base.getFullYear(), mm - 1, dd);
      if (d < base) d = new Date(base.getFullYear() + 1, mm - 1, dd);
      return d;
    }
    var bd = (window.__mkBirthdays || []).filter(function (b) { return CORE.fold(b.name) === full; })[0];
    if (bd) { var p = bd.d.split('.'); tags.push(['cake', 'Dzimšanas diena ' + when(next(+p[0], +p[1]))]); }
    var nd = window.LATVIAN_NAMEDAYS || {}, key = '';
    Object.keys(nd).some(function (k) { return (nd[k] || []).some(function (n) { if (CORE.fold(n) === first) { key = k; return true; } return false; }); });
    if (key) tags.push(['tag', 'Vārda diena ' + when(next(+key.slice(3, 5), +key.slice(0, 2)))]);
    return tags;
  }
  function holidayDates(entry) {
    // Only fixed-date entries (m, d); rule-based ones stay in the header chip.
    if (!entry || !entry.m || entry.d == null || entry.wd != null || entry.easter != null) return null;
    var base = parseDMY(shiftToday()) || new Date(), best = null;
    [base.getFullYear() - 1, base.getFullYear(), base.getFullYear() + 1].forEach(function (y) {
      var d = entry.d === -1 ? new Date(y, entry.m, 0) : new Date(y, entry.m - 1, entry.d);
      if (!best || Math.abs(d - base) < Math.abs(best - base)) best = d;
    });
    return best;
  }

  // The shell (dock, radio) is the parent page, same origin: its own buttons
  // open its windows exactly as the dock does.
  function shell() { try { return window.parent && window.parent !== window ? window.parent : null; } catch (_e) { return null; } }
  function shellClick(id) {
    var p = shell(), btn = null;
    try { btn = p && p.document.getElementById(id); } catch (_e) {}
    if (!btn) return false;
    btn.click();
    return true;
  }
  // rgpool (rgapp.page/pool, its own Worker) opens in the shell's window,
  // grown out of the search box like the other surfaces.
  function openRgpool() {
    var p = shell(), box = els.searchbox || els.search;
    if (!p || typeof p.openRgpoolSheet !== 'function') { window.open(location.hostname === 'rgapp.page' ? '/pool/' : 'https://rgapp.page/pool/', '_blank', 'noopener'); return; }
    var r = box.getBoundingClientRect(), f = null;
    try { f = window.frameElement; } catch (_e) {}
    var fr = f ? f.getBoundingClientRect() : { left: 0, top: 0 };
    p.openRgpoolSheet({ left: r.left + fr.left, top: r.top + fr.top, width: r.width, height: r.height });
  }
  function openStats(tab) {
    window.__mkStatsOpenTab = tab || '';
    if (typeof window.openStatsModal === 'function') window.openStatsModal({ from: els.searchbox });
    else shellClick('statsDocBtn');
  }
  function radioHidden(p) {
    try { return p.document.body.classList.contains('radio-hidden') || p.document.body.classList.contains('radio-idle'); } catch (_e) { return true; }
  }
  function openRadio(source) {
    var p = shell();
    if (!p) return;
    try {
      if (radioHidden(p) && typeof p.toggleRadio === 'function') p.toggleRadio();
      if (typeof p.setRadioSource === 'function') setTimeout(function () { p.setRadioSource(source === 'music' ? 'music' : 'radio'); }, source === 'music' ? 80 : 0);
    } catch (_e) {}
  }

  var ACTIONS = [
    { id: 'today', title: 'Šodien', sub: 'Atpakaļ uz šodienas maiņu (T)', icon: 'undo', words: 'sodien today atpakal', run: goToday },
    { id: 'next', title: 'Nākamā diena', sub: 'Tas pats, kas bultiņa pa labi', icon: 'chevR', words: 'nakama diena rit', run: function () { if (window.g_stepDay) window.g_stepDay(1); } },
    { id: 'prev', title: 'Iepriekšējā diena', sub: 'Tas pats, kas bultiņa pa kreisi', icon: 'chevL', words: 'ieprieksejā vakar', run: function () { if (window.g_stepDay) window.g_stepDay(-1); } },
    { id: 'ns', title: 'Nakts sadalījums', sub: 'Kurš guļ kurā laikā, gultas', icon: 'moon', words: 'nakts sadalijums gulet miegs gultas', run: function () { if (!shellClick('nsToggleBtnParent') && window.toggleNsOverlay) window.toggleNsOverlay(true); } },
    { id: 'radio', title: 'Radio', sub: 'Atvērt radio', icon: 'radio', words: 'radio muzika stacija klausities', run: function () { openRadio('radio'); } },
    { id: 'winamp', title: 'Winamp', sub: 'Mūzika (Lācītis) radio logā', icon: 'music', words: 'winamp muzika lacitis dziesmas playlist', run: function () { openRadio('music'); } },
    { id: 'bolus', title: 'Bolus', sub: 'Bolusa maiņa un atzīmes', icon: 'drop', words: 'bolus bolusa maina injektors', run: function () { shellClick('bolusDocBtn'); } },
    { id: 'month', title: 'Mēneša kalendārs', sub: 'Viss mēnesis vienā skatā', icon: 'calendar', words: 'kalendars menesis grafiks datums', run: function () { if (!shellClick('monthCalDocBtn')) openDate(els.searchbox); } },
    { id: 'planner', title: 'Plānotājs', sub: 'Grafika plānotājs', icon: 'lanes', words: 'planotajs grafiks planot', run: function () { shellClick('planotajsDockBtn'); } },
    { id: 'rgpool', title: 'rgpool', sub: 'Elektrības cena tagad (Nord Pool)', icon: 'bolt', words: 'rgpool elektriba elektribas cena elektro strava energija nord pool nordpool birza kwh', run: openRgpool },
    { id: 'lunch', title: 'Pusdienas', sub: 'Pusdienu pasūtīšana', icon: 'coffee', words: 'pusdienas edamais pasutit', run: function () { shellClick('pusdienasDockBtn'); } },
    { id: 'mobile', title: 'Mobilā versija', sub: 'QR kods un instrukcija telefonam', icon: 'mobile', words: 'mobila versija telefons qr iphone android lietotne instalet', run: function () { openPop('mobile', els.mobile, true); } },
    { id: 'stats', title: 'Statistika', sub: 'Pārskats par mēnesi', icon: 'chart', words: 'statistika parskats leaderboard', run: function () { openStats('overview'); } },
    { id: 'stats-coffee', title: 'Statistika: kafija', sub: 'Cik kafijas šomēnes, kurš visvairāk', icon: 'chart', words: 'kafija statistika krusites', run: function () { openStats('coffee'); } },
    { id: 'stats-fatigue', title: 'Statistika: nogurums', sub: 'Noguruma līkne pa dienām', icon: 'chart', words: 'nogurums statistika', run: function () { openStats('fatigue'); } },
    { id: 'stats-night', title: 'Statistika: nakts', sub: 'Nakts daļas un gultas', icon: 'chart', words: 'nakts statistika daļas', run: function () { openStats('night'); } },
    { id: 'stats-radio', title: 'Statistika: radio', sub: 'Ko klausījāmies', icon: 'chart', words: 'radio statistika klausisanas', run: function () { openStats('radio'); } },
    { id: 'stats-bolus', title: 'Statistika: bolus', sub: 'Bolusa maiņas pa dienām', icon: 'chart', words: 'bolus statistika', run: function () { openStats('bolus'); } },
    { id: 'phones', title: 'Tālruņu saraksts', sub: 'Visi numuri pa nodaļām', icon: 'phone', words: 'talruni numuri nodalas kontakti', run: function () { openPhones(els.searchbox); } },
    { id: 'look', title: 'Galvenes izskats', sub: 'Fons, krāsas, progresa josla', icon: 'palette', words: 'izskats tema fons krasas', run: function () { openLook(els.searchbox); } },
    { id: 'settings', title: 'Iestatījumi', sub: 'Par sistēmu un atjauninājumiem', icon: 'tune', words: 'iestatijumi versija atjauninajumi', run: function () { shellClick('settingsDockBtn'); } },
    { id: 'coffee', title: 'Atbalstīt RG', sub: 'Buy me a coffee', icon: 'coffee', words: 'kafija atbalsts buy me a coffee ziedot', run: function () { openPop('coffee', els.coffee, true); } }
  ];
  if (IS_RAD) ACTIONS = ACTIONS.filter(function (a) { return ['bolus', 'planner', 'lunch', 'settings', 'stats-night', 'stats-bolus'].indexOf(a.id) < 0; });
  var ACTION_BY_ID = {};
  ACTIONS.forEach(function (a) { ACTION_BY_ID[a.id] = a; });

  function mark(text, hits) {
    if (!hits || !hits.length) return esc(text);
    var set = {}, out = '', open = false;
    hits.forEach(function (i) { set[i] = true; });
    for (var i = 0; i < text.length; i++) {
      if (set[i] && !open) { out += '<mark>'; open = true; }
      if (!set[i] && open) { out += '</mark>'; open = false; }
      out += esc(text[i]);
    }
    return out + (open ? '</mark>' : '');
  }

  function search(q) {
    var out = [];
    var query = String(q || '').trim();
    var base = parseDMY(shiftToday()) || new Date();
    if (!query) {
      var rec = recent();
      if (rec.length) {
        out.push({ group: 'Nesen' });
        rec.forEach(function (r) { out.push(fromRecent(r)); });
      }
      if (activeDate() !== shiftToday()) {
        var t0 = ACTION_BY_ID.today;
        out.push({ group: 'Datums' });
        out.push({ kind: 'action', ref: 'a:today', icon: t0.icon, title: t0.title, sub: t0.sub, run: t0.run });
      }
      out.push({ group: 'Atvērt' });
      ['radio', 'winamp', 'ns', 'bolus', 'month', 'planner', 'stats', 'lunch', 'rgpool', 'mobile', 'phones'].forEach(function (id) {
        var a = ACTION_BY_ID[id];
        if (a) out.push({ kind: 'action', tile: true, ref: 'a:' + id, icon: a.icon, title: a.title, sub: a.sub, run: a.run });
      });
      return out.filter(Boolean);
    }
    // 1. Datums
    var date = CORE.parseDate(query, base);
    if (date) {
      var ds = dmy(date);
      out.push({ group: 'Datums' });
      out.push({ kind: 'date', ref: 'd:' + ds, icon: 'calendar', title: 'Pāriet uz ' + CORE.longLabel(date), sub: ds === shiftToday() ? 'Šodien' : CORE.relativeLabel(date, base), data: { date: ds }, run: function () { goToDate(ds); } });
    }
    // 2. Kolēģi
    var ppl = people().map(function (p) { var m = CORE.match(query, p.name); return m.score ? { p: p, m: m } : null; })
      .filter(Boolean).sort(function (x, y) { return y.m.score - x.m.score; }).slice(0, 6);
    if (ppl.length) {
      out.push({ group: 'Grafikā' });
      ppl.forEach(function (r) {
        var p = r.p, next = nextShiftText(p);
        var role = p.isRd ? 'Radiologs' : ((window.__mkLeftRole && window.__mkLeftRole.one) || 'Radiogrāfers');
        out.push({ kind: 'person', ref: 'p:' + (p.isRd ? 'rd:' : 'rg:') + p.name, icon: 'person', role: p.isRd ? 'rd' : 'rg',
          title: p.name, hits: r.m.hits, sub: role + '. ' + next.text, jump: next.date, tags: personDays(p.name, base),
          data: { name: p.name, date: next.date },
          run: function () { if (typeof window.showWorkerSchedule === 'function') window.showWorkerSchedule(p.name, ''); } });
      });
    }
    // 3. Darbības
    // Functions match by the start of a word ("stat", "kaf"), never by a
    // fragment inside one ("nina" must not find "atjauninājumi").
    var acts = ACTIONS.map(function (a) {
      var m = CORE.match(query, a.title);
      if (m.score >= 45) return { a: a, m: m, score: m.score };
      var w = CORE.match(query, a.words);
      return w.score >= 80 ? { a: a, m: { hits: [] }, score: w.score - 10 } : null;
    }).filter(Boolean).sort(function (x, y) { return y.score - x.score; }).slice(0, 5);
    if (acts.length) {
      out.push({ group: 'Darbības' });
      acts.forEach(function (r) { out.push({ kind: 'action', ref: 'a:' + r.a.id, icon: r.a.icon, title: r.a.title, hits: r.m.hits, sub: r.a.sub, run: r.a.run }); });
    }
    // 4. Tālruņi (nosaukums, nodaļa vai cipari bez atstarpēm)
    var db = Array.isArray(window.hospitalDatabase) ? window.hospitalDatabase : [];
    var digits = query.replace(/\D/g, '');
    var phones = db.map(function (item) {
      if (!item) return null;
      var name = String(item.name || ''), phone = String(item.phone || '');
      var m = CORE.match(query, name);
      var score = m.score;
      if (!score) { var c = CORE.match(query, (item.cat || '') + ' ' + (item.sub || '')); score = c.score ? c.score * .7 : 0; }
      if (!score && digits.length >= 3 && phone.replace(/\D/g, '').indexOf(digits) >= 0) score = 60;
      return score ? { item: item, name: name, phone: phone, hits: m.hits, score: score } : null;
    }).filter(Boolean).sort(function (x, y) { return y.score - x.score; }).slice(0, 6);
    if (phones.length) {
      out.push({ group: 'Tālruņi' });
      phones.forEach(function (r) {
        out.push({ kind: 'phone', ref: 't:' + r.phone + ':' + r.name, icon: 'phone', title: r.name, hits: r.hits,
          sub: [phoneCatLabel(r.item.cat), r.item.sub].filter(Boolean).join(', '), meta: phoneFmt(r.phone), data: { phone: r.phone, name: r.name },
          run: function () { openPhones(els.searchbox, r.name); } });
      });
    }
    // 5. Vārdadienas
    if (CORE.fold(query).replace(/\s/g, '').length >= 3) {
      var nd = window.LATVIAN_NAMEDAYS || {}, found = [];
      Object.keys(nd).forEach(function (mmdd) {
        (nd[mmdd] || []).forEach(function (name) {
          var m = CORE.match(query, name);
          if (m.score >= 80) found.push({ name: name, mmdd: mmdd, m: m });
        });
      });
      found.sort(function (x, y) { return y.m.score - x.m.score; });
      if (found.length) {
        out.push({ group: 'Vārdadienas' });
        found.slice(0, 3).forEach(function (f) {
          var mm = +f.mmdd.slice(0, 2) - 1, dd = +f.mmdd.slice(3, 5);
          var d = holidayDates({ m: mm + 1, d: dd });
          var ds2 = d ? dmy(d) : '';
          out.push({ kind: 'nameday', ref: 'n:' + f.name, icon: 'tag', title: f.name, hits: f.m.hits,
            sub: 'Vārda diena ' + dd + '. ' + CORE.MONTH_NAMES[mm] + (d ? ' (' + CORE.relativeLabel(d, base).toLowerCase() + ')' : ''),
            data: { date: ds2 }, run: function () { goToDate(ds2); } });
        });
      }
    }
    // 6. Svinamās dienas
    var sv = (window.MK_SVINAMAS_DIENAS && window.MK_SVINAMAS_DIENAS.days) || [];
    if (CORE.fold(query).length >= 3) {
      var hol = sv.map(function (e) {
        var m = CORE.match(query, e.s || e.t);
        var m2 = m.score ? m : CORE.match(query, e.t);
        var d = m2.score ? holidayDates(e) : null;
        return d ? { e: e, d: d, m: m2 } : null;
      }).filter(Boolean).sort(function (x, y) { return y.m.score - x.m.score; }).slice(0, 3);
      if (hol.length) {
        out.push({ group: 'Svinamās dienas' });
        hol.forEach(function (h) {
          var ds3 = dmy(h.d), title = h.e.s || h.e.t;
          out.push({ kind: 'holiday', ref: 'h:' + ds3 + ':' + title, icon: 'party', title: title, hits: (h.e.s ? CORE.match(query, h.e.s) : h.m).hits,
            sub: h.d.getDate() + '. ' + CORE.MONTH_NAMES[h.d.getMonth()] + ' (' + CORE.relativeLabel(h.d, base).toLowerCase() + ')',
            data: { date: ds3 }, run: function () { goToDate(ds3); } });
        });
      }
    }
    if (!out.length) out.push({ empty: true, query: query });
    return out;
  }
  function fromRecent(r) {
    var item = { kind: r.kind, ref: r.ref, title: r.title, sub: r.sub, data: r.data, icon: r.kind === 'person' ? 'person' : r.kind === 'phone' ? 'phone' : r.kind === 'action' ? (ACTION_BY_ID[r.ref.slice(2)] || {}).icon || 'dot' : r.kind === 'nameday' ? 'tag' : r.kind === 'holiday' ? 'party' : 'calendar' };
    if (r.kind === 'person') { item.jump = r.data && r.data.date; item.run = function () { if (window.showWorkerSchedule) window.showWorkerSchedule(r.data.name, ''); }; }
    else if (r.kind === 'phone') { item.meta = r.data && phoneFmt(r.data.phone); item.run = function () { openPhones(els.searchbox, r.data && (r.data.name || r.data.phone)); }; }
    else if (r.kind === 'action') { var a = ACTION_BY_ID[r.ref.slice(2)]; if (!a) return null; item.run = a.run; }
    else item.run = function () { goToDate(r.data && r.data.date); };
    return item;
  }

  function ensurePalette() {
    if (pal) return pal;
    pal = doc.createElement('div');
    pal.id = 'hxPalette';
    pal.className = 'hx-palette';
    pal.setAttribute('role', 'dialog');
    pal.setAttribute('aria-label', 'Meklēšana');
    pal.hidden = true;
    pal.innerHTML = '<div class="hx-pal-field">' + icon('search')
      + '<input class="hx-pal-input" type="text" role="combobox" aria-expanded="true" aria-controls="hxPalList" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Datums (rīt, 15.10), numurs, nodaļa vai funkcija" aria-label="Meklēt">'
      + '<kbd class="hx-kbd">Esc</kbd></div>'
      + '<div class="hx-pal-list" id="hxPalList" role="listbox" aria-label="Rezultāti"></div>'
      + '<div class="hx-pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> izvēlēties</span><span><kbd>Enter</kbd> atvērt</span><span class="hx-foot-jump"><kbd>Shift</kbd>+<kbd>Enter</kbd> uz maiņas dienu</span><span><kbd>Esc</kbd> aizvērt</span></div>';
    $('minkaBarWrap').appendChild(pal);
    palInput = pal.querySelector('.hx-pal-input');
    palList = pal.querySelector('.hx-pal-list');
    palInput.addEventListener('input', function () { clearTimeout(palTimer); palTimer = setTimeout(renderResults, 60); });
    // The phone list can arrive after the palette opened: show its numbers then.
    doc.addEventListener('mk:phones', function () { if (palInput.value.trim()) renderResults(); });
    palInput.addEventListener('keydown', onPalKey);
    palList.addEventListener('pointermove', function (e) {
      var opt = e.target.closest('.hx-opt');
      if (opt && +opt.dataset.i !== activeIdx) setActive(+opt.dataset.i, false);
    });
    palList.addEventListener('click', function (e) {
      var opt = e.target.closest('.hx-opt');
      if (!opt) return;
      var jump = e.target.closest('.hx-opt-jump');
      runResult(+opt.dataset.i, !!jump);
    });
    return pal;
  }
  function renderResults() {
    if (!pal || pal.hidden) return;
    results = search(palInput.value);
    var html = '', idx = 0;
    results.forEach(function (r) {
      if (!r) return;
      if (r.group) { html += '<div class="hx-pal-group" role="presentation">' + esc(r.group) + '</div>'; return; }
      if (r.empty) {
        html += '<div class="hx-pal-empty"><b>Nekas neatrasts: ' + esc(r.query) + '</b><span>Mēģini vārdu, nodaļu, numuru vai datumu, piemēram "rīt", "piektdien", "15.10".</span></div>';
        return;
      }
      r.i = idx++;
      if (r.tile) {
        html += '<div class="hx-opt is-tile is-' + r.kind + '" role="option" id="hxo-' + r.i + '" data-i="' + r.i + '" aria-selected="false">'
          + '<span class="hx-opt-ic">' + icon(r.icon || 'dot') + '</span><b>' + esc(r.title) + '</b></div>';
        return;
      }
      html += '<div class="hx-opt is-' + r.kind + (r.role ? ' is-' + r.role : '') + '" role="option" id="hxo-' + r.i + '" data-i="' + r.i + '" aria-selected="false">'
        + '<span class="hx-opt-ic">' + icon(r.icon || 'dot') + '</span>'
        + '<span class="hx-opt-main"><b>' + mark(r.title, r.hits) + '</b>' + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '')
        + (r.tags && r.tags.length ? '<span class="hx-opt-tags">' + r.tags.map(function (t) { return '<i>' + icon(t[0]) + esc(t[1]) + '</i>'; }).join('') + '</span>' : '') + '</span>'
        + (r.meta ? '<span class="hx-opt-meta">' + esc(r.meta) + '</span>' : '')
        + (r.kind === 'person' && r.jump ? '<span class="hx-opt-jump" title="Parādīt šo dienu (Shift+Enter)">' + icon('calendar') + '<span>Uz dienu</span></span>' : '')
        + '</div>';
    });
    palList.innerHTML = html.replace(/(<div class="hx-opt is-tile[\s\S]*?<\/div>)(?=<div class="hx-opt is-tile|$)/g, '$1')
      .replace(/((?:<div class="hx-opt is-tile[^>]*>[\s\S]*?<\/b><\/div>)+)/, '<div class="hx-pal-tiles">$1</div>');
    results = results.filter(function (r) { return r && !r.group && !r.empty; });
    setActive(results.length ? 0 : -1, false);
  }
  function setActive(i, scroll) {
    activeIdx = i;
    var prev = palList.querySelector('.hx-opt.is-active');
    if (prev) { prev.classList.remove('is-active'); prev.setAttribute('aria-selected', 'false'); }
    var el = i >= 0 ? palList.querySelector('#hxo-' + i) : null;
    if (el) {
      el.classList.add('is-active');
      el.setAttribute('aria-selected', 'true');
      palInput.setAttribute('aria-activedescendant', el.id);
      if (scroll !== false) el.scrollIntoView({ block: 'nearest' });
    } else palInput.removeAttribute('aria-activedescendant');
  }
  function runResult(i, jump) {
    var r = results[i];
    if (!r) return;
    remember(r);
    closeSearch(false);
    if (jump && r.jump) goToDate(r.jump);
    else if (r.run) r.run();
  }
  function onPalKey(e) {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); if (results.length) setActive((activeIdx + 1) % results.length); }
    else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) { e.preventDefault(); if (results.length) setActive((activeIdx - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); runResult(activeIdx >= 0 ? activeIdx : 0, e.shiftKey); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (palInput.value) { palInput.value = ''; renderResults(); } else closeSearch(true); }
  }
  function openSearch(initial) {
    closePop();
    closeDate(false);
    ensurePalette();
    var wasOpen = !pal.hidden && !pal.__closing;
    if (!wasOpen) palOpener = doc.activeElement;
    var wrap = $('minkaBarWrap'), wr = wrap.getBoundingClientRect(), sr = (els.searchbox || els.search).getBoundingClientRect();
    var width = Math.min(wr.width - 16, Math.max(sr.width, 560));
    var left = Math.max(8, Math.min(wr.width - width - 8, sr.left - wr.left));
    pal.style.left = Math.round(left) + 'px';
    pal.style.top = Math.round(sr.top - wr.top) + 'px';
    pal.style.width = Math.round(width) + 'px';
    pal.__closing = false;
    pal.hidden = false;
    pal.classList.add('is-open');
    layerSync();
    els.search.setAttribute('aria-expanded', 'true');
    top.classList.add('is-searching');
    palInput.value = typeof initial === 'string' ? initial : (wasOpen ? palInput.value : '');
    if (typeof window.mkEnsurePhones === 'function') window.mkEnsurePhones();
    renderResults();
    palInput.focus({ preventScroll: true });
    if (!wasOpen) {
      var M = motion();
      if (M && M.openSurface) M.openSurface(pal, { key: 'hx-pal', origin: els.searchbox || els.search });
      doc.addEventListener('pointerdown', outsidePalette, true);
    }
  }
  function closeSearch(restoreFocus) {
    if (!pal || pal.hidden || pal.__closing) return;
    els.search.setAttribute('aria-expanded', 'false');
    doc.removeEventListener('pointerdown', outsidePalette, true);
    pal.__closing = true;
    var done = function () {
      if (!pal.__closing) return;
      pal.__closing = false; pal.hidden = true; pal.classList.remove('is-open');
      top.classList.remove('is-searching');
      layerSync();
    };
    var M = motion();
    if (M && M.closeSurface) M.closeSurface(pal, { key: 'hx-pal', origin: els.searchbox || els.search }, done);
    else done();
    if (restoreFocus) (palOpener && palOpener.isConnected ? palOpener : els.search).focus({ preventScroll: true });
  }
  function outsidePalette(e) {
    if (pal && !pal.contains(e.target) && !(els.searchbox || els.search).contains(e.target)) closeSearch(false);
  }

  /* ── Notikumi ────────────────────────────────────────────────────────── */
  function typing(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  function overlayOpen() {
    return !!doc.querySelector('#worker-modal.open, #full-list-modal.open, #nsOverlay.open, #mcal-overlay.is-open, dialog[open], .mk-stats[data-state="open"]');
  }
  function wire() {
    top.addEventListener('click', function (e) {
      var name = e.target.closest('.hx-name');
      if (name) { focusWorkerCard(name.dataset.w, name.dataset.list); return; }
      if (e.target.closest('.hx-today')) { goToday(); return; }
      if (e.target.closest('.hx-search')) { openSearch(); return; }
      var menu = e.target.closest('[data-menu]');
      if (menu) {
        if (popKind === menu.dataset.menu) closePop();
        else openPop(menu.dataset.menu, menu, true);
        return;
      }
      var chip = e.target.closest('[data-pop]');
      if (chip) {
        if (popKind === chip.dataset.pop && popPinned) closePop();
        else openPop(chip.dataset.pop, chip, true);
      }
    });
    top.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var chip = e.target.closest('[data-pop]');
      if (!chip || chip.contains(e.relatedTarget)) return;
      clearTimeout(popCloseT);
      if (popPinned && popKind && popKind !== chip.dataset.pop) return;
      clearTimeout(popOpenT);
      popOpenT = setTimeout(function () { openPop(chip.dataset.pop, chip, false); }, popKind ? 0 : 90);
    });
    top.addEventListener('pointerout', function (e) {
      if (e.pointerType !== 'mouse') return;
      var chip = e.target.closest('[data-pop]');
      if (!chip || chip.contains(e.relatedTarget)) return;
      clearTimeout(popOpenT);
      if (!popPinned) scheduleClose();
    });
    top.addEventListener('focusin', function (e) {
      var chip = e.target.closest('[data-pop]');
      if (chip && chip.matches(':focus-visible')) openPop(chip.dataset.pop, chip, false);
    });
    doc.addEventListener('pointerdown', function (e) {
      if (pop && !pop.hidden && !pop.contains(e.target) && !(e.target.closest && e.target.closest('#hxTop :is([data-pop], [data-menu])'))) closePop();
    }, true);
    doc.addEventListener('keydown', function (e) {
      var k = e.key;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 'k' || k === 'K')) { e.preventDefault(); openSearch(); return; }
      if (k === 'Escape' && pop && !pop.hidden) { closePop(); if (popAnchor) popAnchor.focus(); return; }
      if (k === 'Escape' && ph.el && !ph.el.hidden) { closePhones(); return; }
      if (k === 'Escape' && dp.el && !dp.el.hidden) { closeDate(true); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || overlayOpen() || e.defaultPrevented) return;
      if (k === '/') { e.preventDefault(); openSearch(); }
      else if ((k === 't' || k === 'T') && !e.shiftKey) { e.preventDefault(); goToday(); }
    });
    wireRail();
  }
  // Day rail: ‹ › step one day (they used to scroll the strip by 200 px), a
  // mouse wheel scrolls the strip sideways, the search icon is the bar above.
  // Runs again at 'load': the rail is moved into the header on DOMContentLoaded.
  function wireRail() {
    var row = doc.querySelector('#minkaBarWrap > .scroll-row');
    if (!row || row.dataset.hxWired) return;
    row.dataset.hxWired = '1';
    var arrows = row.querySelectorAll(':scope > button.arrow');
    if (arrows[0]) { arrows[0].onclick = function () { if (window.g_stepDay) window.g_stepDay(-1); }; arrows[0].title = 'Iepriekšējā diena (←)'; arrows[0].setAttribute('aria-label', 'Iepriekšējā diena'); arrows[0].innerHTML = icon('chevL'); }
    if (arrows[1]) { arrows[1].onclick = function () { if (window.g_stepDay) window.g_stepDay(1); }; arrows[1].title = 'Nākamā diena (→)'; arrows[1].setAttribute('aria-label', 'Nākamā diena'); arrows[1].innerHTML = icon('chevR'); }
    var scroller = $('grafiks-scroller');
    if (scroller) scroller.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.ctrlKey) return;
      scroller.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    // The day strip's calendar button opens the date picker below (M3), not
    // the old mini calendar, and toggles it.
    var cal = $('miniCalBtn');
    if (cal) {
      cal.title = 'Izvēlēties datumu';
      cal.setAttribute('aria-haspopup', 'dialog');
      cal.setAttribute('aria-expanded', 'false');
      cal.innerHTML = icon('calendar');
      cal.onclick = function (e) { e.preventDefault(); e.stopPropagation(); toggleDate(cal); };
    }
    var menu = $('minkaBarMenu');
    if (menu) menu.title = 'Tālruņu saraksts';
  }

  /* ── Citā dienā šaurā vidū mēness čips dod vietu datuma rindai ─────────
     (tā procenti ir arī laikapstākļu logā). Pārslēgšana ir momentāna: plūstoša
     čipu platuma maiņa lika pārrēķināt izkārtojumu katrā kadrā tieši dienas
     zīmēšanas laikā, un dienu pārslēgšana kļuva manāmi smagāka. */
  function syncMoonTuck() {
    var moon = top && top.querySelector('.hx-moon'), center = top && top.querySelector('.hx-center');
    if (!moon || !center) return;
    moon.classList.toggle('is-tucked', top.classList.contains('is-other-day') && center.clientWidth <= 780);
  }
  window.addEventListener('resize', function () {
    clearTimeout(syncMoonTuck.t);
    syncMoonTuck.t = setTimeout(function () { syncMoonTuck(); renderWing('rg'); renderWing('rd'); }, 200);
  });

  window.addEventListener('minka:duty-summary', function (e) { renderWing(e.detail && e.detail.role); });
  window.addEventListener('daySelected', function () {
    requestAnimationFrame(function () {
      renderDate();
      syncFacts();
      if (dp.el && !dp.el.hidden && !dp.el.__closing) dpRender();
    });
  });
  window.addEventListener('minka:weather', function () { if (popKind === 'weather') fillPop('weather'); });
  document.addEventListener('minka:storeReady', function () { peopleCache = null; adopt(); renderDate(); });
  window.addEventListener('minka:auto-day-rollover', renderDate);

  // Facts appear and disappear with their data (birthday list, name days).
  var factObserver = new MutationObserver(function () { syncFacts(); });

  var started = false;
  function start() {
    if (started || !build()) return;
    started = true;
    adopt();
    ['rg', 'rd'].forEach(renderWing);
    renderDate();
    applyTone();
    paintBmcCount();
    ['mkBdayBadge', 'mkNamedayBar', 'mkDayChip'].forEach(function (id) {
      var n = $(id);
      if (n) factObserver.observe(n, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    });
    // The supporter count is fetched once, in idle time, after the calendar is up.
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1200); };
    setTimeout(function () { idle(function () { loadBmc(); }); }, 8000);
  }
  window.MkHeaderX = { openSearch: openSearch, closeSearch: closeSearch, goToday: goToday,
    openMobile: function () { if (els.mobile) openPop('mobile', els.mobile, true); } };
  // A click outside the calendar frame (the shell's dock, its edges) closes the
  // header windows too, the same as a click anywhere else in the calendar.
  try {
    var shellDoc = shell() && shell().document;
    if (shellDoc) shellDoc.addEventListener('pointerdown', function () {
      if (pop && !pop.hidden && !pop.__closing) closePop();
      closeSearch(false);
      closePhones();
      closeDate(false);
    }, true);
  } catch (_e) {}

  // A deferred script runs before DOMContentLoaded, when the header is not yet
  // assembled (mk-integrated-duty-header.js mounts it then): start after it.
  if (doc.readyState === 'complete') start();
  else doc.addEventListener('DOMContentLoaded', start, { once: true });
  window.addEventListener('load', function () { start(); adopt(); wireRail(); syncFacts(); }, { once: true });
})();
