/* Card layouts for the desktop calendar without the radio (RG; css/page/card-layout.css).
   A small tile under the mood card's left part (it follows the card in every view; the daily
   cat waits under its right end) opens a menu: ready views drawn as small pictures, and "Savs", one's own view built from a few
   controls (the walls' angle, card size, rows, tilt, the mood card's size or none at all). With
   the radio open there is no mood card: its Cover Flow has its own carousel/grid button.
   Whatever is picked shows on the page at once (the page itself is the preview); Atcelt brings
   the last one back. Saglabāt keeps it on this computer until the next handover (08:00), so the
   following shift starts with the default corridor again; "Manam kontam" also keeps it for the
   person logged in (the one shared account, js/media-profile.js), back whenever they log in.
   corridor.js lays the cards out from window.MkCardLayout. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('mk-mobile-shell') || window.MINKA_APP === 'rad') return;
  var list = document.getElementById('grafiks-list');
  if (!list) return;

  // scatter: photos on a table;
  // angle: the walls' turn toward the mood card (negative: away from it); max/min: card size in
  // px; rows: exactly that many rows per wall; tilt: cards leaning back; mood false: no mood card;
  // moodScale: its size; angle null: the usual grid
  var LAYOUTS = [
    { id: 'koridors', name: 'Telpa', note: 'Kartītes uz sienām telpā ap noskaņu (noklusējums)', angle: 22 },
    { id: 'galerija', name: 'Plakans', note: 'Sienas taisni pret tevi', angle: 0 },
    { id: 'fotografijas', name: 'Kolāža', note: 'Kartītes kā fotogrāfijas uz galda', angle: 0, scatter: true },
    { id: 'fokuss', name: 'Kartītes', note: 'Tikai kartītes, lielākas, bez noskaņas', angle: 12, mood: false, max: 280 },
    { id: 'rezgis', name: 'Režģis', note: 'Visi vienā tīklā, noskaņa sānā', angle: null },
    { id: 'lielas', name: 'Lielās', note: 'Visas kartītes lielas rindās, bez noskaņas', angle: null, carousel: true, flat: true, mood: false }
  ];
  var DEFAULT = 'koridors', KEY = 'mkCardLayout:';
  // what stands in the middle (art: a one-ink mask in kalendars/assets, drawn in the mood's colour)
  // In the mood's place: dithercn's moving examples (js/page/mk-dither.js), each in the mood's colour
  // with its face and the same rating row; the cat with the sword on the same engine; two games.
  // face: 'mid' sits in the picture's own middle (the eclipse's dark disc, the tunnel's end).
  var CENTERS = [
    { id: 'mood', name: 'Noskaņa', note: 'Noskaņas kartīte (noklusējums)', icon: '🙂' },
    { id: 'galaxy', name: 'Galaktika', note: 'Griežas spirālveida galaktika', fx: { field: 'galaxy', shares: [0, .4, .75, 1], t0: 8,
      uniforms: { galaxyAngle: 70, galaxyArms: 2, galaxyCenter: [.5, .5], galaxyCos: Math.cos(55 * Math.PI / 180), galaxyDust: .8, galaxySize: .48, galaxySpin: 1, galaxyStars: 1, galaxyTwist: 1 } } },
    { id: 'eclipse', name: 'Aptumsums', note: 'Saules aptumsums, noskaņa pašā vidū', face: 'mid', fx: { field: 'eclipse', shares: [0, .5, 1], t0: 5,
      uniforms: { eclipseCenter: [.5, .5], eclipseCorona: .55, eclipseLight: 315, eclipsePulse: .5, eclipseSize: .24 } } },
    { id: 'orb', name: 'Lode', note: 'Dzīva, elpojoša lode', fx: { field: 'orb', shares: [0, .45, 1],
      uniforms: { orbBody: 1, orbGlow: .5, orbLean: [0, 0], orbMorph: 1, orbSize: .3 } } },
    { id: 'tunnel', name: 'Tunelis', note: 'Lidojums tunelī, noskaņa galā', face: 'mid', fx: { field: 'tunnel', shares: [0, .5, 1], t0: 6,
      uniforms: { tunnelCenter: [.5, .5], tunnelFog: 1, tunnelRings: 1, tunnelShape: 0, tunnelSpokes: 12, tunnelSway: 0 } } },
    // ugunskurs in fire's own colours (dithercn's campfire: red tips, orange, pale yellow core)
    { id: 'fire', name: 'Uguns', note: 'Ugunskurs ar dzirkstelēm', fx: { field: 'fire', colors: [[0, 0, 0, 0], [252, 88, 85, 255], [254, 162, 71, 255], [255, 213, 119, 255]], t0: 6,
      uniforms: { fireEdge: 0, fireEmbers: 2.2, fireHeight: .85, fireInks: 2, fireIntensity: 1, fireScale: 1.6, fireSpread: .5, fireWind: .1 } } },
    { id: 'waves', name: 'Viļņi', note: 'Jūras viļņi zem apvāršņa', fx: { field: 'waves', shares: [0, .35, 1],
      uniforms: { wavesAmplitude: 1, wavesHorizon: .62, wavesLayers: 6, wavesMode: 0 } } },
    { id: 'ridgelines', name: 'Kalni', note: 'Kalnu grēdas līnijās', fx: { field: 'ridgelines', shares: [0, 1], t0: 8,
      uniforms: { ridgeAmplitude: 1, ridgeLines: 24, ridgeShade: .25, ridgeSpread: .5 } } },
    { id: 'retrogrid', name: 'Retro', note: 'Astoņdesmito gadu režģis ar sauli', fx: { field: 'retrogrid', shares: [0, .3, .65, 1], t0: 3,
      uniforms: { retroColumns: 12, retroHorizon: .42, retroSun: .4 } } },
    { id: 'aurora', name: 'Blāzma', note: 'Ziemeļblāzma noskaņas krāsā', fx: { field: 'aurora', shares: [0, .4, .75, 1],
      uniforms: { auroraCurtains: 3, auroraDrift: 0, auroraFlip: 0, auroraGlow: .9, auroraHeight: .42, auroraIntensity: .95, auroraLength: .45, auroraMask: 0, auroraRays: 8, auroraScale: 1, auroraShimmer: .2, auroraSpread: .11, auroraSway: 1, auroraTilt: 0, auroraTurbulence: .6 } } },
    { id: 'silk', name: 'Zīds', note: 'Zīda audums vējā', fx: { field: 'silk', shares: [0, .3, .65, 1], t0: 7,
      uniforms: { silkAngle: 110, silkFolds: 6, silkIntensity: 1, silkSheen: .6 } } },
    { id: 'smoke', name: 'Dūmi', note: 'Dūmi kāpj augšup', fx: { field: 'smoke', shares: [0, .45, 1], t0: 12,
      uniforms: { smokeAmount: 1, smokeHeight: .8, smokeScale: 1, smokeWind: .2 } } },
    { id: 'ripples', name: 'Apļi', note: 'Apļi uz ūdens', fx: { field: 'ripples', shares: [0, .45, 1], t0: 5,
      uniforms: { ripplesA: [.3, .36, .72, .68], ripplesB: [.3, .36, .3, .36], ripplesCount: 2, ripplesDecay: 1, ripplesIntensity: 1, ripplesRings: 12 } } },
    { id: 'storm', name: 'Kaķis', note: 'Kaķis ar zobenu dejo lietū', fx: { field: 'cat', img: 'center-g-cat.webp', shares: [0, .5, 1], uniforms: {} } },
    { id: 'mines', name: 'Mīnas', note: 'Mīnas noskaņas krāsā, spēlē uzreiz', icon: '💣', game: 'mines' },
    { id: 'candy', name: 'Konfektes', note: 'Konfektes 98 no galerijas, bezgalīgi', icon: '🍬', game: 'candy' }
  ];
  function clampOwn(o) {
    o = o || {};
    var n = function (v, lo, hi, d) { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
    // few controls, each always giving a sound layout: no forced rows, no tilt, no walls turned away
    return { angle: n(o.angle, 0, 40, 22), max: n(o.max, 140, 340, 240), rows: 0, tilt: 0,
      mood: o.mood !== false, moodScale: n(o.moodScale, 0.7, 1.3, 1) };
  }
  function ownLayout(o) {
    o = clampOwn(o);
    return { id: 'savs', name: 'Pielāgot', note: 'Savs izkārtojums ar slīdņiem', angle: o.angle, max: o.max, min: Math.min(140, o.max - 10),
      rows: o.rows || 0, tilt: o.tilt, mood: o.mood, moodScale: o.moodScale, own: o };
  }
  function byId(id) { for (var i = 0; i < LAYOUTS.length; i++) if (LAYOUTS[i].id === id) return LAYOUTS[i]; return null; }

  // The account lives in the shell (js/media-profile.js); the calendar may also run alone.
  function media() {
    try { if (window.parent !== window && window.parent.__mkUnifiedMedia) return window.parent.__mkUnifiedMedia; } catch (_e) {}
    return window.__mkUnifiedMedia || null;
  }
  function person() { var m = media(), s = m && m.getSession && m.getSession(); return s && s.workerId ? s : null; }
  // A saved layout: a ready view's id, or {"own": {...}} for one's own.
  function parse(v) {
    if (!v) return null;
    if (typeof v === 'string' && v.charAt(0) !== '{') return byId(v);
    var o = typeof v === 'string' ? JSON.parse(v) : v;
    return o && o.own ? ownLayout(o.own) : null;
  }
  function asStored(l) { return l.id === 'savs' ? JSON.stringify({ own: l.own }) : l.id; }
  // the person's profile settings (the shared account, js/media-profile.js), once loaded
  function profile() {
    var m = media();
    if (!person() || !m || (m.isLoaded && !m.isLoaded())) return null;
    var r = m.getRadio && m.getRadio();
    return r && r.settings || null;
  }
  // the person's own, while they are logged in: from their account (any computer), else as kept here
  function accountSaved() {
    var p = person();
    if (!p) return null;
    var st = profile();
    try { return st && st.cardLayout ? parse(st.cardLayout) : parse(localStorage.getItem(KEY + p.workerId)); } catch (_e) { return null; }
  }
  // this computer's, until the next handover (8:00 in Riga, as js/media-profile.js)
  var DEVICE = KEY + 'device';
  function nextHandover(now) {
    var format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Riga', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    var parts = function (t) { var o = {}; format.formatToParts(new Date(t)).forEach(function (p) { if (p.type !== 'literal') o[p.type] = Number(p.value); }); return o; };
    var p = parts(now), wall = Date.UTC(p.year, p.month - 1, p.day + (p.hour >= 8 ? 1 : 0), 8), z = parts(wall);
    return wall - (Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second) - wall);
  }
  var expiryTimer = 0;
  function deviceSaved() {
    try {
      var v = JSON.parse(localStorage.getItem(DEVICE) || 'null');
      if (!v || !(v.until > Date.now())) return null;
      clearTimeout(expiryTimer);   // one timer to the handover: then the default comes back by itself
      expiryTimer = setTimeout(apply, Math.min(v.until - Date.now() + 1000, 2147483000));
      return parse(v.layout);
    } catch (_e) { return null; }
  }
  var preview = null, own = clampOwn({}), shownKey = '';
  function current() { return preview || accountSaved() || deviceSaved() || byId(DEFAULT); }
  function keyOf(l) { return l.id === 'savs' ? 'savs:' + JSON.stringify(l.own) : l.id; }
  function apply() {
    var l = current(), key = keyOf(l);
    if (key === shownKey) return;
    shownKey = key;
    // the mood card: hidden (still measured in the corridor), or sized with one scale
    root.classList.toggle('mk-cl-nomood', l.mood === false);
    var s = l.mood === false ? 1 : (l.moodScale || 1);
    if (s === 1) list.style.removeProperty('--mk-mood-s'); else list.style.setProperty('--mk-mood-s', String(s));
    window.dispatchEvent(new Event('mk-card-layout'));
    paint();
    paintBtn(l);
  }
  window.MkCardLayout = { current: current, list: LAYOUTS };

  /* Pictures: the mood card as a circle in the middle, the cards as small shapes. */
  function picture(l) {
    var cards = '', i, x, y;
    if (l.carousel && l.flat) {
      for (i = 0; i < 6; i++) cards += '<rect x="' + (14 + (i % 3) * 25) + '" y="' + (6 + Math.floor(i / 3) * 23) + '" width="22" height="21" rx="3"/>';
      return '<svg viewBox="0 0 100 56" aria-hidden="true"><g class="mk-cl-cards">' + cards + '</g></svg>';
    }
    if (l.carousel) {
      cards = [[50, 26], [28, 22], [72, 22], [13, 18], [87, 18]].map(function (q, j) { var w = j ? (j < 3 ? 12 : 8) : 26; return '<rect x="' + (q[0] - w / 2) + '" y="' + (28 - q[1] / 2) + '" width="' + w + '" height="' + q[1] + '" rx="2.5"/>'; }).join('');
      return '<svg viewBox="0 0 100 56" aria-hidden="true"><g class="mk-cl-cards">' + cards + '</g></svg>';
    }
    if (l.angle == null) {
      // the usual grid: the groups one under another, the mood card in its own column on the right
      for (i = 0; i < 8; i++) { x = 6 + (i % 4) * 16; y = 9 + Math.floor(i / 4) * 21; cards += '<rect x="' + x + '" y="' + y + '" width="13" height="16" rx="3"/>'; }
      return '<svg viewBox="0 0 100 56" aria-hidden="true"><g class="mk-cl-cards">' + cards + '</g><rect class="mk-cl-mood-box" x="72" y="9" width="22" height="37" rx="4"/><circle class="mk-cl-mood" cx="83" cy="24" r="7"/></svg>';
    }
    var r = function (cx, cy, w, h, deg) { return '<rect x="' + (cx - w / 2).toFixed(1) + '" y="' + (cy - h / 2).toFixed(1) + '" width="' + w + '" height="' + h + '" rx="2.5"' + (deg ? ' transform="rotate(' + deg + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"' : '') + '/>'; };
    var dot = '<circle class="mk-cl-mood" cx="50" cy="28" r="9"/>';
    if (l.scatter) {
      [-1, 1].forEach(function (s) { for (i = 0; i < 4; i++) { var h = (i * 7 + (s > 0 ? 3 : 0)) % 11; cards += r(50 + s * (21 + (i % 2) * 16) + (h % 3 - 1), 18 + Math.floor(i / 2) * 20, 14, 15, (h - 5) * 2.4); } });
      return '<svg viewBox="0 0 100 56" aria-hidden="true"><g class="mk-cl-cards">' + cards + '</g>' + dot + '</svg>';
    }
    // four people on each side, drawn with the layout's own angle, size, rows and tilt
    var k = Math.sin(l.angle * Math.PI / 180), rows = l.rows || 2, cols = Math.ceil(4 / rows);
    var z = Math.max(0.72, Math.min(1.15, (l.max || 240) / 240)), tilt = l.tilt ? Math.cos(l.tilt * Math.PI / 180) : 1;
    var inner = l.mood === false ? 5 : 15 * (l.moodScale || 1);
    var cell = Math.min(15, (50 - inner - 2 - 2 * cols) / cols) * z;
    [-1, 1].forEach(function (s) {
      for (var col = 0; col < cols; col++) for (var row = 0; row < rows; row++) {
        // the card next to the mood card (col 0) stands deepest: drawn smaller, its inner edge shorter
        var depth = 1 - k * 0.3 * (cols > 1 ? 1 - col / (cols - 1) : 0.5);
        var w = cell * depth * (1 - Math.abs(k) * 0.4), h = cell * depth * tilt;
        var cx = 50 + s * (inner + (col + 0.5) * (cell * (1 - Math.abs(k) * 0.3) + 2));
        var top = 28 - (rows * (h + 3) - 3) / 2 + row * (h + 3);
        var nearX = cx - s * w / 2, farX = cx + s * w / 2, d = k * h * 0.22;
        cards += '<path d="M' + farX.toFixed(1) + ' ' + top.toFixed(1) + 'L' + nearX.toFixed(1) + ' ' + (top + d).toFixed(1) +
          'V' + (top + h - d).toFixed(1) + 'L' + farX.toFixed(1) + ' ' + (top + h).toFixed(1) + 'Z"/>';
      }
    });
    var mood = l.mood === false ? '' : '<circle class="mk-cl-mood" cx="50" cy="28" r="' + (10 * (l.moodScale || 1)).toFixed(1) + '"/>';
    return '<svg viewBox="0 0 100 56" aria-hidden="true"><g class="mk-cl-cards">' + cards + '</g>' + mood + '</svg>';
  }

  /* Under the mood card: a small segmented switch with the three layouts used last (one click
     shows one and keeps it, as Saglabāt does) and "⋯" opening all of them. */
  var bar = document.createElement('div');
  bar.className = 'mk-cl-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Kartīšu izkārtojums');
  bar.innerHTML = '<span class="mk-cl-quick"></span><button type="button" class="mk-cl-more" aria-haspopup="dialog" aria-expanded="false" aria-label="Visi izkārtojumi" title="Visi izkārtojumi">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/></svg></button>';
  var quick = bar.querySelector('.mk-cl-quick'), btn = bar.querySelector('.mk-cl-more'), quickKey = '';
  var RECENT = KEY + 'recent', OWN = KEY + 'own';
  function lastOwn() { try { return ownLayout(JSON.parse(localStorage.getItem(OWN) || 'null') || own); } catch (_e) { return ownLayout(own); } }
  function recent() {
    var r = null;
    try { r = JSON.parse(localStorage.getItem(RECENT) || 'null'); } catch (_e) {}
    r = Array.isArray(r) ? r.filter(function (id) { return id === 'savs' || byId(id); }) : [];
    ['koridors', 'galerija', 'rezgis'].forEach(function (id) { if (r.length < 3 && r.indexOf(id) < 0) r.push(id); });
    return r.slice(0, 3);
  }
  // the switch keeps its order (no segment jumps under the pointer): a layout not on it yet takes
  // the place of the one used longest ago (kept in "used", newest first)
  function remember(l) {
    var r = recent(), used = null;
    try { used = JSON.parse(localStorage.getItem(RECENT + ':used') || 'null'); } catch (_e) {}
    used = (Array.isArray(used) ? used : r.slice()).filter(function (x) { return x !== l.id; });
    used.unshift(l.id);
    if (r.indexOf(l.id) < 0) {
      var oldest = r.slice().sort(function (a, b) { return (used.indexOf(a) < 0 ? 99 : used.indexOf(a)) - (used.indexOf(b) < 0 ? 99 : used.indexOf(b)); }).pop();
      r[r.indexOf(oldest)] = l.id;
    }
    try {
      localStorage.setItem(RECENT, JSON.stringify(r));
      localStorage.setItem(RECENT + ':used', JSON.stringify(used.slice(0, 6)));
      if (l.id === 'savs') localStorage.setItem(OWN, JSON.stringify(l.own));
    } catch (_e) {}
  }
  function paintBtn(l) {
    var ids = recent();
    if (ids.indexOf(l.id) < 0) ids = ids.slice(0, 2).concat(l.id);   // shown now but not kept on it: at its end
    var a = !preview && accountSaved(), fromAcc = !!(a && keyOf(a) === keyOf(l));
    var k = keyOf(l) + '|' + ids.join(',') + '|' + fromAcc;
    if (k === quickKey) return;
    quickKey = k;
    quick.innerHTML = ids.map(function (id) {
      var x = id === l.id ? l : id === 'savs' ? lastOwn() : byId(id), mine = fromAcc && id === l.id;
      return '<button type="button" class="mk-cl-q" data-q="' + id + '" aria-pressed="' + (id === l.id) + '" title="' + x.name + (mine ? ': no tava konta' : '') + '">' + picture(x) + '<span>' + x.name + '</span>' +
        (mine ? '<i class="mk-cl-qacct" aria-label="No tava konta"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v1.5h16V19c0-2.8-3.6-5-8-5Z"/></svg></i>' : '') + '</button>';
    }).join('');
    schedulePlace();
  }
  bar.hidden = true;
  document.body.appendChild(bar);
  var placed = '', header = document.getElementById('minkaBarWrap');
  function placeBtn() {
    var mood = list.querySelector('.rg-feedback-card'), M = mood && mood.getBoundingClientRect();
    // without a mood card on the page (hidden by the layout) the pill keeps its last place
    var off = root.classList.contains('host-radio-open');
    if (!off && (!M || !M.width)) { var L0 = list.getBoundingClientRect(); M = { left: L0.left + L0.width / 2, right: L0.left + L0.width / 2, width: 0.01, top: L0.bottom, bottom: L0.bottom, height: 0 }; mood = null; }
    // The first of a few places that covers no card, the mood card's rating row nor the header and
    // stays above the dock: under the mood card's left part (the pet waits under its right end,
    // daily-cat.js), over it, beside its rating row, the roster's bottom corner.
    var key = placed;
    if (off) key = 'off';
    else if (M && M.width) {
      var Hb = header && header.getBoundingClientRect(), under = Hb && Hb.height ? Hb.bottom : 0;
      var full = bar.classList.contains('is-compact') ? (bar.__fullW || 260) : (bar.offsetWidth || 260);
      if (!bar.classList.contains('is-compact') && bar.offsetWidth) bar.__fullW = bar.offsetWidth;
      var w = full, h = 40, ih = window.innerHeight, iw = window.innerWidth;
      var taps = mood && mood.querySelector('.rg-pulse-taps'), T = taps && taps.getBoundingClientRect(), ty = T && T.height ? T.top + T.height / 2 - h / 2 : M.bottom - h;
      var L = list.getBoundingClientRect();
      var busy = [].slice.call(list.querySelectorAll('.card.mk-mid-card')).filter(function (c) { return c !== mood; })
        .map(function (c) { return c.getBoundingClientRect(); }).filter(function (r) { return r.width; });
      // the carousel's own ‹ › and view buttons
      [].slice.call(list.querySelectorAll('.mk-cf-nav')).forEach(function (n) { var r = n.getBoundingClientRect(); if (r.width) busy.push(r); });
      busy.push(T && T.width ? T : M);
      var pet = document.querySelector('.mk-daily-cat-pet'), P = pet && pet.getBoundingClientRect();
      if (P && P.width && !pet.hidden) busy.push(P);
      var free = function (x, y) {
        // inside the roster: never over the side columns (radiographers', radiologists')
        if (x < Math.max(6, L.left + 4) || x + w > Math.min(iw - 6, L.right - 4) || y < under + 4 || y + h > ih - 6) return false;
        if (x < M.right && x + w > M.left && y < M.bottom && y + h > M.top) return false;
        return busy.every(function (r) { return x + w <= r.left - 4 || x >= r.right + 4 || y + h <= r.top - 4 || y >= r.bottom + 4; });
      };
      // under the mood card, moved left as far as the pet needs; with no mood card shown, the
      // roster's bottom middle first
      var left0 = P && P.width && P.top < M.bottom + 80 && P.left > M.left ? Math.min(M.left + 6, P.left - w - 10) : M.left + 6;
      var bottomMid = [L.left + L.width / 2 - w / 2, Math.min(L.bottom, ih) - h - 8];
      var nearPet = P && P.width && P.top < M.bottom + 80;
      var spots = (current().mood === false ? [bottomMid] : []).concat([[left0, M.bottom + 12],
        nearPet ? [P.right + 10, M.bottom + 12] : null, nearPet ? [M.left + 6, P.bottom + 8] : null, [M.left + M.width / 2 - w / 2, M.top - h - 8], [M.right + 12, ty], [M.left - w - 12, ty],
        [L.right - w - 12, Math.min(L.bottom, ih) - h - 8], [L.left + 12, Math.min(L.bottom, ih) - h - 8], bottomMid]);
      var pick = function () { return spots.filter(function (p) { return p && free(p[0], p[1]); })[0]; };
      var spot = pick(), compact = false;
      // no room for the whole switch (a short window, many people): only "⋯", in a gap
      if (!spot) {
        compact = true; w = 40;
        left0 = M.left + 6;
        spots = [[M.left + M.width / 2 - 20, M.bottom + 8], [M.right + 8, ty], [M.left - 48, ty], [M.right - 40, M.bottom + 8], [M.left, M.bottom + 8],
          [L.right - 52, Math.min(L.bottom, ih) - 48], [L.left + 12, Math.min(L.bottom, ih) - 48]];
        spot = pick();
      }
      // nowhere free at all: "⋯" waits in the day rail, by the month and the calendar
      var rail = !spot && document.querySelector('#minkaBarWrap .mk-date-controls');
      if (rail) { if (bar.parentNode !== rail) rail.insertBefore(bar, rail.firstChild); bar.classList.add('in-rail'); spot = [0, 0]; }
      else if (bar.parentNode !== document.body) { document.body.appendChild(bar); bar.classList.remove('in-rail'); }
      if (!spot) spot = [M.right - 40, Math.min(M.bottom + 8, ih - 46)];
      if (bar.classList.contains('is-compact') !== compact) { bar.classList.toggle('is-compact', compact); placed = ''; }
      key = Math.round(spot[0]) + ',' + Math.round(spot[1]);
    }
    placeCenter(off ? null : M);
    if (key === placed && !off === !bar.hidden) return;
    bar.hidden = off;
    if (off) { placed = ''; close(); return; }
    placed = key;
    var k = key.split(',');
    bar.style.left = k[0] + 'px'; bar.style.top = k[1] + 'px';
    if (isOpen) placePanel();
  }
  var placeFrame = 0;
  function schedulePlace() { if (!placeFrame) placeFrame = requestAnimationFrame(function () { placeFrame = 0; placeBtn(); }); }
  // what moves the mood card: a resize, the roster rebuilt (day switch), the layout changed (the
  // cards glide for ~0.5 s), scrolling the corridor, the radio; and its own height
  var moodRO = typeof ResizeObserver === 'function' ? new ResizeObserver(schedulePlace) : null, moodSeen = null;
  function watchMood() { var m = list.querySelector('.rg-feedback-card'); if (moodRO && m && m !== moodSeen) { if (moodSeen) moodRO.unobserve(moodSeen); moodRO.observe(m); moodSeen = m; } schedulePlace(); }
  new MutationObserver(watchMood).observe(list, { childList: true });
  new MutationObserver(schedulePlace).observe(root, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedulePlace);
  window.addEventListener('mk-card-layout', function () { schedulePlace(); setTimeout(schedulePlace, 600); });
  list.addEventListener('scroll', schedulePlace, { passive: true });

  /* The menu. */
  var panel = document.createElement('div');
  panel.className = 'mk-cl-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Kartīšu izkārtojums');
  panel.hidden = true;
  var tiles = LAYOUTS.concat([{ id: 'savs', name: 'Pielāgot', note: 'Savs izkārtojums ar slīdņiem', own: true }]);
  function range(name, label, min, max, step) {
    return '<label class="mk-cl-range"><span>' + label + '</span><output data-out="' + name + '"></output>' +
      '<input type="range" data-own="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '"></label>';
  }
  // Two tabs: how the cards stand, and what stands in the mood's place (large previews: the picture
  // with the mood's face on it, as it will look)
  var CUP = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M2.6 5.6h11v7.6a3.6 3.6 0 0 1-3.6 3.6H6.2a3.6 3.6 0 0 1-3.6-3.6V5.6Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M14.2 7.6h1.1a2.6 2.6 0 0 1 0 5.2h-1.1"/></svg>';
  var BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor"/></svg>';
  function centreTile(c) {
    var pic = c.fx ? '<canvas width="52" height="38"></canvas>'
      : c.id === 'mines' ? '<span class="mk-cl-cmines">' + '<i></i><i></i><i>1</i><i></i><i></i><i>2</i><i></i><i></i>' + '</span>'
      : c.id === 'mood' ? '' : '<span class="mk-cl-cicon">' + c.icon + '</span>';
    return '<button type="button" data-center="' + c.id + '" aria-pressed="false" title="' + c.note + '"><i class="mk-cl-cpic" data-c="' + c.id + '"' + (c.face ? ' data-face="' + c.face + '"' : '') + '>' + pic +
      '<b class="mk-cl-cface" aria-hidden="true"></b></i><span>' + c.name + '</span></button>';
  }
  // The editor: two sheets over the side columns (the people's lists, which no layout moves) and the
  // page between them as the live preview: whatever is picked shows there at once, as in the card
  // editor. Left: how the cards stand (and one's own sliders). Right: what stands in the mood's
  // place, what else it shows, and saving.
  panel.innerHTML = '<section class="mk-cl-sheet" data-side="l" aria-label="Kartītes"><h3>Kartītes</h3><div class="mk-cl-grid">' + tiles.map(function (l, i) {
      return '<button type="button" class="mk-cl-opt" data-layout="' + l.id + '" aria-pressed="false" title="' + l.note + '" style="--i:' + i + '">' +
        (l.own ? '<svg viewBox="0 0 100 56" aria-hidden="true"><g class="mk-cl-cards"><rect x="30" y="17" width="40" height="2.4" rx="1.2"/><rect x="30" y="27" width="40" height="2.4" rx="1.2"/><rect x="30" y="37" width="40" height="2.4" rx="1.2"/></g><circle class="mk-cl-mood" cx="42" cy="18.2" r="4.5"/><circle class="mk-cl-mood" cx="61" cy="28.2" r="4.5"/><circle class="mk-cl-mood" cx="36" cy="38.2" r="4.5"/></svg>' : picture(l)) +
        '<span class="mk-cl-name">' + l.name + '</span>' +
        '<i class="mk-cl-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></i></button>';
    }).join('') + '</div>' +
    '<section class="mk-cl-own" hidden>' +
      range('max', 'Kartīšu izmērs', 140, 340, 10) + range('angle', 'Sienu leņķis', 0, 40, 1) + range('moodScale', 'Noskaņas izmērs', 0.7, 1.3, 0.05) +
      '<label class="mk-cl-switch"><input type="checkbox" role="switch" data-own="mood"><span>Noskaņa</span></label>' +
    '</section>' +
    // saving, for both sheets' choices, under the views (the right sheet holds more)
    '<p class="mk-cl-who" aria-live="polite"></p>' +
    '<div class="mk-cl-foot"><button type="button" class="mk-cl-cancel">Atcelt</button>' +
    '<button type="button" class="mk-cl-account" title="Saglabā tavā kontā: atgriežas, kad ielogojies">Manam kontam</button>' +
    '<button type="button" class="mk-cl-save" title="Šim datoram līdz maiņas beigām (8:00), tad atkal Telpa">Saglabāt līdz 8:00</button></div></section>' +
    '<section class="mk-cl-sheet" data-side="r" aria-label="Centrā"><h3>Centrā</h3>' +
    '<div class="mk-cl-centers">' + CENTERS.map(centreTile).join('') + '</div>' +
    '<div class="mk-cl-cshow" role="group" aria-label="Rādīt arī">' +
      '<label class="mk-cl-switch" title="Rādīt maiņas nogurumu"><input type="checkbox" role="switch" data-chip-on="fatigue"><span>' + BOLT + 'Nogurums</span></label>' +
      '<label class="mk-cl-switch" title="Rādīt dežūras kafiju"><input type="checkbox" role="switch" data-chip-on="coffee"><span>' + CUP + 'Kafija</span></label></div>' +
    '</section>';
  document.body.appendChild(panel);
  var ownBox = panel.querySelector('.mk-cl-own');

  var PERSON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v1.5h16V19c0-2.8-3.6-5-8-5Z"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // whose account: the name, and whether what is shown now is what the account keeps
  function paintWho() {
    var p = person(), who = panel.querySelector('.mk-cl-who'), acc = panel.querySelector('.mk-cl-account'), a = accountSaved(), st = profile();
    var same = !!(p && a && keyOf(a) === keyOf(current()) && (!st || (st.cardCenter || 'mood') === centerNow()));
    who.innerHTML = p ? PERSON + '<span>Konts: <b>' + String(p.name || '').replace(/[<>&]/g, '') + '</b></span>' : PERSON + '<span>Neesi ielogojies</span>';
    who.classList.toggle('is-out', !p);
    acc.innerHTML = !p ? 'Ielogoties un saglabāt' : same ? CHECK + 'Saglabāts kontam' : 'Manam kontam';
    acc.setAttribute('aria-pressed', String(same));
  }
  function paint() {
    paintTiles(panel);
    paintWho();
    // the mood's own face on every preview
    var mc = list.querySelector('.rg-feedback-card'), mf = mc && mc.querySelector('.rg-mood-fluent-face'), mfont = mf ? getComputedStyle(mf).fontFamily : '';
    Array.prototype.forEach.call(panel.querySelectorAll('.mk-cl-cface'), function (e) { e.textContent = moodNow(mc).face; if (mfont) e.style.fontFamily = mfont; });
    var ch = chipsOn();
    Array.prototype.forEach.call(panel.querySelectorAll('[data-chip-on]'), function (i) { i.checked = ch[i.dataset.chipOn]; });
    var c = centerNow();
    Array.prototype.forEach.call(panel.querySelectorAll('[data-center]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.center === c)); });
    var l = current();
    Array.prototype.forEach.call(panel.querySelectorAll('.mk-cl-opt[data-layout]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.layout === l.id)); });
    var isOwn = l.id === 'savs';
    ownBox.hidden = !isOwn;
    if (isOwn) {
      var o = l.own;
      Array.prototype.forEach.call(panel.querySelectorAll('[data-own]'), function (input) {
        var k = input.dataset.own;
        if (input.type === 'checkbox') input.checked = o.mood; else if (Number(input.value) !== o[k]) input.value = String(o[k]);
        var out = panel.querySelector('[data-out="' + k + '"]');
        if (out) out.textContent = k === 'moodScale' ? Math.round(o[k] * 100) + '%' : k === 'max' ? o[k] + ' px' : o[k] + '°';
        if (k === 'moodScale') input.disabled = !o.mood;
      });
    }
  }
  function setOwn(patch) {
    for (var k in patch) own[k] = patch[k];
    own = clampOwn(own);
    preview = ownLayout(own);
    apply();
  }

  // A band over the header (date, weather, the day rail): the header is no part of the cards'
  // layout, so the whole roster and the mood card stay in sight as the preview.
  function placePanel() {
    var L = list.getBoundingClientRect(), side = Math.round(Math.max(212, Math.min(268, L.left - 10)));
    panel.style.setProperty('--mk-cl-side', side + 'px');
  }
  window.addEventListener('resize', function () { if (isOpen) placePanel(); });

  var MM = window.MinkaMotion, isOpen = false;   // not panel.hidden: it stays shown while closing
  function open() {
    if (isOpen) return;
    isOpen = true;
    preview = null;
    var l = current();
    if (l.id === 'savs') own = clampOwn(l.own);
    panel.hidden = false;
    placePanel();
    btn.setAttribute('aria-expanded', 'true');
    paint();
    // the sheets come in from their own sides on the spring
    if (MM) Array.prototype.forEach.call(panel.querySelectorAll('.mk-cl-sheet'), function (sh) {
      MM.animate(sh, [{ opacity: 0, translate: (sh.dataset.side === 'l' ? -28 : 28) + 'px 0' }, { opacity: 1, translate: '0 0' }], 'spring-default');
    });
    panel.classList.add('is-entering');
    clearTimeout(open.t); open.t = setTimeout(function () { panel.classList.remove('is-entering'); }, 600);
    var sel = panel.querySelector('.mk-cl-opt[aria-pressed="true"]');
    if (sel) sel.focus();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onOutside, true);
  }
  // keep: the choice was saved; otherwise the shown layout goes back
  function close(keep) {
    if (!isOpen) return;
    isOpen = false;
    if (!keep) preview = null;
    pendingSave = null;
    apply();
    btn.setAttribute('aria-expanded', 'false');
    root.classList.remove('mk-cl-live');
    schedulePlace();
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onOutside, true);
    var hide = function () { if (!isOpen) panel.hidden = true; };
    if (!MM) { hide(); return; }
    var anims = Array.prototype.map.call(panel.querySelectorAll('.mk-cl-sheet'), function (sh) {
      return MM.animate(sh, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: (sh.dataset.side === 'l' ? -20 : 20) + 'px 0' }], 'effects-fast', { fill: 'forwards' });
    });
    Promise.all(anims.map(function (an) { return an && an.finished ? an.finished.catch(function () {}) : null; })).then(function () {
      hide(); anims.forEach(function (an) { if (an) try { an.cancel(); } catch (_e) {} });
    });
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); btn.focus(); } }
  function onOutside(e) { if (!panel.contains(e.target) && !btn.contains(e.target)) close(); }
  // one click on the switch: that layout, kept (this computer until 8:00, and the account if logged in)
  quick.addEventListener('click', function (e) {
    var q = e.target.closest('[data-q]');
    if (!q) return;
    var l = q.dataset.q === 'savs' ? (current().id === 'savs' ? current() : lastOwn()) : byId(q.dataset.q);
    close();
    saveDevice(l); saveAccount(l); remember(l);
    preview = null;
    apply();
  });
  watchMood();

  var pendingSave = null;
  function saveDevice(l) {
    try {
      if (l.id === DEFAULT) localStorage.removeItem(DEVICE);
      else localStorage.setItem(DEVICE, JSON.stringify({ layout: asStored(l), until: nextHandover(Date.now()) }));
    } catch (_e) {}
  }
  // into the account: the layout, the centre and its chips follow the person to every computer
  function saveAccount(l) {
    var p = person(), m = media();
    if (!p) return false;
    try { localStorage.setItem(KEY + p.workerId, asStored(l)); } catch (_e) {}
    if (m && m.change && profile()) m.change({ type: 'settings', settings: { cardLayout: asStored(l), cardCenter: centerNow(), cardChips: chipsOn() } });
    return true;
  }
  btn.addEventListener('click', function () { if (isOpen) close(); else open(); });
  panel.addEventListener('click', function (e) {
    var opt = e.target.closest('.mk-cl-opt');
    if (opt) { preview = opt.dataset.layout === 'savs' ? ownLayout(own) : byId(opt.dataset.layout); apply(); paint(); placePanel(); return; }
    var cb = e.target.closest('[data-center]');
    if (cb) { setCenter(cb.dataset.center); paint(); return; }
    if (e.target.closest('.mk-cl-cancel')) { close(); return; }
    var l = current();
    if (e.target.closest('.mk-cl-save')) { saveDevice(l); saveAccount(l); remember(l); preview = null; close(true); return; }
    if (e.target.closest('.mk-cl-account')) {
      saveDevice(l); remember(l);
      if (saveAccount(l)) { preview = null; close(true); return; }
      // not logged in: the account's login opens in the shell; saved once it succeeds
      pendingSave = l;
      var m = media();
      if (m && m.open) m.open({ center: true });
    }
  });
  var liveTimer = 0;
  panel.addEventListener('input', function (e) {
    // fatigue / coffee on the centre: a display choice, kept on this computer at once
    var chip = e.target.dataset && e.target.dataset.chipOn;
    if (chip) {
      var ch = chipsOn(); ch[chip] = e.target.checked;
      try { localStorage.setItem(CHIPS, JSON.stringify(ch)); } catch (_e) {}
      paintChips(list.querySelector('.rg-feedback-card'));
      return;
    }
    var k = e.target.dataset && e.target.dataset.own;
    if (!k) return;
    root.classList.add('mk-cl-live');
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { root.classList.remove('mk-cl-live'); }, 400);
    var patch = {};
    patch[k] = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
    setOwn(patch);
  });

  /* The centre: the mood card (default) or one of a few pictures in its place, each of them still
     the team's mood: the ink takes the mood's own colour, the mood's face sits on the picture with
     its word, and the rating faces are under it (a tap there is the mood card's own button). Moving
     dither from dithercn's examples (js/page/mk-dither.js), the cat with the sword in the rain, and
     the gallery's two games, Mīnas and Konfektes, opened from here
     (js/page/mood-gallery-pc.js). The mood card stays underneath, hidden, so the layout measures
     it as before. Kept like the quick switch: this computer until 8:00. */
  var CENTER = KEY + 'center';
  function centerNow() {
    try { var v = JSON.parse(localStorage.getItem(CENTER) || 'null'); if (v && v.until > Date.now() && byCenter(v.id)) return v.id; } catch (_e) {}
    // nothing chosen on this computer today: the account's
    var st = profile();
    return st && st.cardCenter && byCenter(st.cardCenter) ? st.cardCenter : 'mood';
  }
  function byCenter(id) { for (var i = 0; i < CENTERS.length; i++) if (CENTERS[i].id === id) return CENTERS[i]; return null; }
  function setCenter(id) {
    try { if (id === 'mood') localStorage.removeItem(CENTER); else localStorage.setItem(CENTER, JSON.stringify({ id: id, until: nextHandover(Date.now()) })); } catch (_e) {}
    centerSig = '';
    schedulePlace();
  }
  var centerEl = document.createElement('div');
  centerEl.className = 'mk-cl-center';
  centerEl.hidden = true;
  document.body.appendChild(centerEl);
  var centerSig = '';
  var MOOD_WORD = { excellent: 'Lieliski', good: 'Labi', ok: 'Normāli', bad: 'Slikti', terrible: 'Ļoti slikti' };
  // the mood as the mood card shows it now: its key, colours and face
  function moodNow(mood) {
    var st = mood && mood.querySelector('.rg-mood-stage'), face = mood && mood.querySelector('.rg-mood-fluent-face');
    var key = st ? st.dataset.rgMood : 'none';
    return { key: key, word: MOOD_WORD[key] || 'Vēl nav vērtējumu', face: face ? face.textContent.trim() : '🙂',
      c1: st && st.style.getPropertyValue('--rg-mood-primary') || '', c2: st && st.style.getPropertyValue('--rg-mood-secondary') || '' };
  }
  // The rating row: the mood card's own row, copied, and dressed by the mood card's own rules: they
  // are written for "#grafiks-list .rg-feedback-card …", so they are copied once with that part
  // read as ".mk-cl-moodrow" (every rule about the row, its buttons, counts and the comments' icon,
  // also inside @media and @layer). The same buttons, the same look, whatever the card wears.
  // A press is the card's own button.
  function rateRow() { return '<div class="mk-cl-moodrow" role="group" aria-label="Novērtē maiņu"></div>'; }
  var rowStyled = false, ROW_RE = /rg-pulse|rg-comment-icon|rg-feedback-badge|mx-draw/;
  function mirrorRowStyles() {
    if (rowStyled) return;
    rowStyled = true;
    var out = [];
    // split a selector list at its own commas only (never inside :is(a, b) / :not(a, b))
    var parts = function (sel) {
      var out = [], depth = 0, from = 0;
      for (var i = 0; i < sel.length; i++) {
        var ch = sel.charAt(i);
        if (ch === '(') depth++; else if (ch === ')') depth--;
        else if (ch === ',' && !depth) { out.push(sel.slice(from, i)); from = i + 1; }
      }
      out.push(sel.slice(from));
      return out;
    };
    var rewrite = function (sel) {
      return parts(sel).filter(function (x) { return ROW_RE.test(x) && /rg-feedback-card/.test(x); })
        .map(function (x) { return x.replace(/#grafiks-list\s*/g, '').replace(/\.card(?=\.)/g, '').replace(/\.rg-feedback-card(?:\.[\w-]+|:not\([^)]*\))*/g, '.mk-cl-moodrow'); }).join(',');
    };
    var walk = function (rules, wrap) {
      [].forEach.call(rules, function (r) {
        if (r.selectorText) {
          if (!ROW_RE.test(r.selectorText)) return;
          var sel = rewrite(r.selectorText);
          if (sel) out.push(wrap(sel + '{' + r.style.cssText + '}'));
        } else if (r.cssRules) {
          // keep each rule's condition and layer: a layered !important outranks an unlayered one
          var at = r instanceof CSSMediaRule ? '@media ' + r.media.mediaText
            : window.CSSContainerRule && r instanceof CSSContainerRule ? '@container ' + (r.containerName ? r.containerName + ' ' : '') + (r.containerQuery || r.conditionText)
            : r instanceof CSSSupportsRule ? '@supports ' + r.conditionText
            : window.CSSLayerBlockRule && r instanceof CSSLayerBlockRule ? '@layer ' + r.name : '';
          walk(r.cssRules, at ? function (t) { return wrap(at + '{' + t + '}'); } : wrap);
        }
      });
    };
    [].forEach.call(document.styleSheets, function (sh) { var rs; try { rs = sh.cssRules; } catch (_e) { return; } if (rs) walk(rs, function (t) { return t; }); });
    var st = document.createElement('style');
    st.id = 'mk-cl-moodrow-css';
    st.textContent = out.join('\n');
    document.head.appendChild(st);
  }
  function paintRate() {
    var host = centerEl.querySelector('.mk-cl-moodrow'), mood = list.querySelector('.rg-feedback-card'), taps = mood && mood.querySelector('.rg-pulse-taps');
    if (!host || !taps) return;
    mirrorRowStyles();
    var copy = taps.cloneNode(true);
    copy.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
    [].forEach.call(copy.children, function (b, i) { b.dataset.tap = i; });
    // the card's own custom properties (sizes, colours) on the host
    var cs = getComputedStyle(mood);
    for (var i = 0; i < cs.length; i++) { var p = cs[i]; if (p.charCodeAt(0) === 45 && p.charCodeAt(1) === 45 && /^--(rg|mx|mk-mx|tap|pulse)/.test(p)) host.style.setProperty(p, cs.getPropertyValue(p)); }
    host.replaceChildren(copy);
  }
  // the mood line: its face and word, then the shift's fatigue and coffee as on the mood card (each
  // can be switched off in the menu); the coffee chip opens the coffee statistics, as there
  function moodLine() {
    return '<div class="mk-cl-mood-line" title="Komandas noskaņa"><span class="mk-cl-mface" aria-hidden="true"></span><span class="mk-cl-mword"></span>' +
      '<span class="mk-cl-chip" data-chip="fatigue" title="Maiņas nogurums">' + BOLT + '<b></b></span>' +
      '<button type="button" class="mk-cl-chip" data-chip="coffee" title="Šīs dežūras kafija: atver statistiku">' + CUP + '<b></b></button></div>';
  }
  var CHIPS = KEY + 'chips';
  function chipsOn() {
    try { var v = JSON.parse(localStorage.getItem(CHIPS) || 'null'); if (v) return { fatigue: v.fatigue !== false, coffee: v.coffee !== false }; } catch (_e) {}
    var st = profile(), a = st && st.cardChips;
    return a ? { fatigue: a.fatigue !== false, coffee: a.coffee !== false } : { fatigue: true, coffee: true };
  }
  function paintChips(mood) {
    var on = chipsOn(), box = centerEl.firstElementChild;
    if (!box) return;
    ['fatigue', 'coffee'].forEach(function (k) {
      var chip = box.querySelector('.mk-cl-chip[data-chip="' + k + '"]'), src = mood && mood.querySelector(k === 'fatigue' ? '[data-rg-fatigue-num]' : '[data-rg-coffee-num]');
      if (!chip) return;
      chip.hidden = !on[k] || !src;
      if (src) chip.querySelector('b').textContent = src.textContent.trim();
    });
  }
  function gameStat(id) {
    try {
      var today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Riga', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (id === 'mines') { var d = (JSON.parse(localStorage.getItem('minkaMinesDailyV1') || '{}') || {})[today]; return d ? (d.won ? 'Šodien: ' + d.time + ' s' : 'Šodien: zaudēts') : 'Šodienas laukums gaida'; }
      var b = JSON.parse(localStorage.getItem('minkaCandyBestV1') || 'null');
      var v = b && typeof b === 'object' ? b[today] : b;
      return v ? 'Tavs labākais: ' + (v.score != null ? v.score : v) : 'Dienas laukums visiem vienāds';
    } catch (_e) { return ''; }
  }
  function centerHtml(id, mood) {
    var c = byCenter(id);
    if (c.game) return '<div class="mk-cl-art mk-cl-game" data-c="' + id + '"><div class="mk-cl-game-box"></div>' + moodLine() + rateRow() + '</div>';
    var art = "<canvas class='mk-cl-fx' aria-hidden='true'></canvas>";
    if (id === 'storm') art += '<div class="mk-cl-rain" aria-hidden="true"></div>';
    return '<div class="mk-cl-art" data-c="' + id + '"' + (c.face ? ' data-face="' + c.face + '"' : '') + '><div class="mk-cl-stage">' + art + '<span class="mk-cl-bigface" aria-hidden="true"></span></div>' + moodLine() + rateRow() + '</div>';
  }
  // the mood's colour and face on the picture; after a vote, a day switch or a new mood
  function paintMood() {
    var box = centerEl.firstElementChild, mood = list.querySelector('.rg-feedback-card');
    if (!box || !mood) return;
    // the theme's colour, as everything else (it follows the header's picture), made lively
    var m = moodNow(mood), th = theme(), ink = css(th.ramp(.8));
    box.style.setProperty('--ink', ink);
    box.style.setProperty('--ink2', css(th.ramp(.4)));
    box.dataset.mood = m.key;
    var ff = mood.querySelector('.rg-mood-fluent-face'), font = ff ? getComputedStyle(ff).fontFamily : '';
    Array.prototype.forEach.call(box.querySelectorAll('.mk-cl-mface, .mk-cl-bigface'), function (e) { e.textContent = m.face; delete e.dataset.own; if (font) e.style.fontFamily = font; });
    var w = box.querySelector('.mk-cl-mword'); if (w) w.textContent = m.word;
    paintChips(mood);
    // the mood's face on the games' face button too (Mīnas)
    centerEl.style.setProperty('--mk-face', JSON.stringify(m.face || '🙂'));
    if (font) centerEl.style.setProperty('--mk-face-font', font);
    if (live) { live.api.ink(th.ramp); if (live.api.draw && !live.off) live.api.draw(live.t0); }
  }
  // a new header picture changes the theme's colour: the centre follows
  new MutationObserver(function () { var was = themeCache; if (!centerEl.hidden && was && theme() !== was) paintMood(); })
    .observe(root, { attributes: true, attributeFilter: ['style'] });
  var moodWatch = null, moodWatched = null;
  function watchMoodState(mood) {
    var st = mood && mood.querySelector('.rg-mood-stage');
    if (st === moodWatched) return;
    if (moodWatch) moodWatch.disconnect();
    moodWatched = st;
    if (!st) return;
    moodWatch = new MutationObserver(function () { if (!centerEl.hidden) { paintMood(); paintRate(); } });
    moodWatch.observe(st, { attributes: true, attributeFilter: ['data-rg-mood', 'style'] });
    var face = mood.querySelector('.rg-mood-fluent-face');
    if (face) moodWatch.observe(face, { childList: true, characterData: true, subtree: true });
    // the fatigue and coffee numbers
    Array.prototype.forEach.call(mood.querySelectorAll('[data-rg-fatigue-num], [data-rg-coffee-num]'), function (n) { moodWatch.observe(n, { childList: true, characterData: true, subtree: true }); });
    // the row too: counts, the comments' number, the chosen face
    var taps = mood.querySelector('.rg-pulse-taps');
    if (taps) moodWatch.observe(taps, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'data-total'] });
  }
  function placeCenter(M) {
    var id = centerNow(), l = current(), mood = list.querySelector('.rg-feedback-card');
    var on = id !== 'mood' && !!M && !!mood && l.mood !== false;
    if (on !== root.classList.contains('mk-cl-center-on')) document.dispatchEvent(new CustomEvent('mk-mood-covered', { detail: on }));
    root.classList.toggle('mk-cl-center-on', on);
    centerEl.hidden = !on;
    if (!on) { if (centerSig) { centerSig = ''; unmountGame(); stopLive(); centerEl.innerHTML = ''; } return; }
    var sig = id + '|' + (window.__activeDateStr || '');
    if (sig !== centerSig) {
      centerSig = sig; unmountGame(); stopLive();
      centerEl.dataset.center = id; centerEl.innerHTML = centerHtml(id, mood);
      var cc = byCenter(id);
      if (cc.game) mountGame(cc.game); else startFx(cc);
    }
    watchMoodState(mood);
    paintMood();
    paintRate();
    centerEl.style.left = Math.round(M.left) + 'px'; centerEl.style.top = Math.round(M.top) + 'px';
    centerEl.style.width = Math.round(M.width) + 'px'; centerEl.style.height = Math.round(M.height) + 'px';
  }
  // the games: the gallery's own Windows 98 (js/page/mood-gallery-pc.js), one game mounted in the box
  var PC_SRC = 'js/page/mood-gallery-pc.js?v=20261109cl68', pcLoad = null, game = null;
  function mountGame(app) {
    if (!pcLoad) pcLoad = new Promise(function (ok, no) {
      if (window.MinkaGalleryPC) { ok(); return; }
      var sc = document.createElement('script'); sc.src = PC_SRC; sc.onload = ok; sc.onerror = function () { pcLoad = null; no(); }; document.head.appendChild(sc);
    });
    var box = centerEl.querySelector('.mk-cl-game-box');
    pcLoad.then(function () {
      if (!box.isConnected || game || window.MinkaGalleryPC.isOpen()) return;
      game = window.MinkaGalleryPC.open({ app: app, mount: box, endless: true, me: {} });
    }, function () {});
  }
  function unmountGame() { if (game) { var g = game; game = null; try { g.close(); } catch (_e) {} } }

  /* The moving picture: one WebGL canvas drawn by MkDither (js/page/mk-dither.js) on the shared
     slow clock, the time in seconds. The GPU does the work; without a real GPU (software
     WebGL) it stays one still frame, as with reduced motion. */
  var DITHER_SRC = 'js/page/mk-dither.js?v=20261109cl68', ditherLoad = null, live = null;
  function loadDither() {
    return ditherLoad || (ditherLoad = new Promise(function (ok, no) {
      if (window.MkDither) { ok(); return; }
      var sc = document.createElement('script'); sc.src = DITHER_SRC; sc.onload = ok; sc.onerror = function () { ditherLoad = null; no(); }; document.head.appendChild(sc);
    }));
  }
  function stopLive() { if (live) { if (live.off) live.off(); if (live.ro) live.ro.disconnect(); live.api.destroy(); live = null; } }
  function fxOpts(c, img) { return { field: c.fx.field, uniforms: c.fx.uniforms, shares: c.fx.shares, colors: c.fx.colors, img: img, rgb: theme().ramp }; }
  // the picture's inks in the theme's colour, one per share (a picture with its own colours: none)
  function paletteOf(c) { var r = theme().ramp; return c.fx.colors ? null : c.fx.shares.map(function (v) { return v ? r(v) : [0, 0, 0, 0]; }); }
  var imgs = {};
  function withImg(c, fn) {
    if (!c.fx.img) { fn(null); return; }
    if (imgs[c.fx.img]) { fn(imgs[c.fx.img]); return; }
    var im = new Image(); im.onload = function () { imgs[c.fx.img] = im; fn(im); }; im.src = new URL('assets/' + c.fx.img + '?v=2', location.href).href;
  }
  function fxTime() { return live.t0 + (live.off ? (performance.now() - live.start) / 1000 : 0); }
  // On the main thread: where the browser cannot hand a canvas to a worker, and as a still where
  // there is no real GPU (the worker said so)
  function mainFx(c, cv, img, animate) {
    var M = window.MinkaMotion, o = fxOpts(c, img), api = animate ? window.MkDither.mount(cv, o) : null;
    if (!api) { api = window.MkDither.mount(cv, Object.assign(o, { soft: true })); animate = false; }
    if (!api) return;
    live = { api: api, t0: c.fx.t0 || 0, start: performance.now(), off: null, c: c };
    if (window.ResizeObserver) { live.ro = new ResizeObserver(function () { if (live && live.api.resize()) live.api.draw(fxTime()); }); live.ro.observe(cv); }
    if (animate) live.off = M.onSlowTick(function () { if (live) live.api.draw(fxTime()); });
    api.resize(); api.draw(fxTime());
  }
  function startFx(c) {
    var cv = centerEl.querySelector('.mk-cl-fx'), M = window.MinkaMotion;
    if (!cv) return;
    loadDither().then(function () {
      withImg(c, function (img) {
        if (!cv.isConnected || live) return;
        var animate = !!M && M.level() !== 'reduced';
        // in a worker: its frames reach the screen without the page's main thread
        var w = window.MkDither.live(cv, { field: c.fx.field, uniforms: c.fx.uniforms, shares: c.fx.shares, colors: c.fx.colors, palette: paletteOf(c), img: img, t0: c.fx.t0 || 0 }, animate, function () {
          // no real GPU: one still frame on a fresh canvas (the first one belongs to the worker now)
          if (!live || live.w !== w) return;
          stopLive();
          var fresh = cv.cloneNode(false); if (cv.isConnected) { cv.replaceWith(fresh); mainFx(c, fresh, img, false); }
        });
        if (!w) { mainFx(c, cv, img, animate); return; }
        live = { w: w, c: c, api: { destroy: w.destroy, ink: function () { w.palette(paletteOf(c)); } } };
        if (window.ResizeObserver) { live.ro = new ResizeObserver(function () { w.resize(); }); live.ro.observe(cv); }
      });
    }, function () {});
  }
  // the menu's tiles: a still frame of each picture in the accent colour
  function paintTiles(panel) {
    var cvs = panel.querySelectorAll('.mk-cl-cpic canvas');
    if (!cvs.length) return;
    loadDither().then(function () {
      var th = theme();
      [].forEach.call(cvs, function (cv) {
        var c = byCenter(cv.parentNode.dataset.c);
        if (!c || !c.fx || cv.dataset.rgb === th.key) return;
        withImg(c, function (img) { if (window.MkDither.still(cv, fxOpts(c, img), c.fx.t0 || 0)) cv.dataset.rgb = th.key; });
      });
    }, function () {});
  }
  /* The theme's colour (--hxr-accent, from the header's picture) as a lively ramp: its hue, at least
     fairly saturated, from deep (faint tones) to bright (full ones). A grey accent takes the
     surface's hue; when both are grey it stays a cool grey. */
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function rgbFromHsl(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6;
    var t = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
    return [Math.round((t[0] + m) * 255), Math.round((t[1] + m) * 255), Math.round((t[2] + m) * 255), 255];
  }
  function css(c) { return 'rgb(' + c[0] + ' ' + c[1] + ' ' + c[2] + ')'; }
  var themeCache = null;
  function theme() {
    // written inline on <html> by mk-header-x.js: read there (no style recalculation), else computed
    var a = root.style.getPropertyValue('--hxr-accent').trim(), sf = root.style.getPropertyValue('--hxr-surface').trim();
    if (!a || !sf) { var cs = getComputedStyle(centerEl); a = a || cs.getPropertyValue('--mk-cl-accent').trim() || '#c8d3e2'; sf = sf || cs.getPropertyValue('--mk-cl-surface').trim() || '#1a2026'; }
    if (themeCache && themeCache.key === a + '|' + sf) return themeCache;
    var A = hsl.apply(null, rgbOf(a)), S = hsl.apply(null, rgbOf(sf));
    var hue = A[1] > .12 ? A[0] : S[1] > .12 ? S[0] : 210, sat = A[1] > .12 || S[1] > .12 ? Math.max(.62, Math.min(.9, Math.max(A[1], S[1]))) : .12;
    return (themeCache = { key: a + '|' + sf, ramp: function (t) { return rgbFromHsl(hue, sat, .3 + .5 * t); } });
  }
  function rgbOf(col) { var c = document.createElement('canvas').getContext('2d'); c.fillStyle = col; var h = c.fillStyle; if (h.charAt(0) === '#') return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; var m = h.match(/\d+/g) || [200, 210, 225]; return [+m[0], +m[1], +m[2]]; }
  // over a rating face, the big face shows it at once (as the mood card's glass does); back on leave
  centerEl.addEventListener('pointerover', function (e) {
    // only the rating faces (they carry their emoji); not the comments' or the drawing's button
    var b = e.target.closest && e.target.closest('.mk-cl-moodrow [data-tap][data-rg-pulse][data-emoji]'), big = centerEl.querySelector('.mk-cl-bigface');
    if (!b || !big) return;
    var em = b.dataset.emoji;
    if (!em || big.textContent === em) return;
    if (big.dataset.own == null) big.dataset.own = big.textContent;
    big.textContent = em;
    if (window.MinkaMotion) window.MinkaMotion.animate(big, [{ scale: '.8' }, { scale: '1' }], 'spring-fast');
  });
  centerEl.addEventListener('pointerout', function (e) {
    var b = e.target.closest && e.target.closest('.mk-cl-moodrow [data-tap][data-rg-pulse]'), big = centerEl.querySelector('.mk-cl-bigface');
    if (!b || !big || big.dataset.own == null || (e.relatedTarget && b.contains(e.relatedTarget))) return;
    var into = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.mk-cl-moodrow [data-tap][data-rg-pulse][data-emoji]');
    if (into) return;   // straight onto the next face: its own pointerover takes over
    big.textContent = big.dataset.own; delete big.dataset.own;
  });
  centerEl.addEventListener('click', function (e) {
    if (e.target.closest('.mk-cl-chip[data-chip="coffee"]')) { var cup = list.querySelector('.rg-feedback-card [data-rg-coffee-open]'); if (cup) cup.click(); return; }
    var b = e.target.closest('[data-tap]'), taps = list.querySelector('.rg-feedback-card .rg-pulse-taps');
    if (!b || !taps) return;
    var real = taps.children[+b.dataset.tap];
    if (real) real.click();
  });

  // Login, logout and the handover (the session ends at 8:00): the layout follows the person.
  function onProfile() {
    // logged in from "Ielogoties un saglabāt": saved once the profile is there (it loads after the login)
    if (pendingSave && person() && profile()) { var l = pendingSave; pendingSave = null; saveAccount(l); preview = null; close(true); }
    if (isOpen) paint();
    quickKey = ''; shownKey = '';
    apply();
    centerSig = ''; schedulePlace();
    if (acc && !acc.hidden) { if (person()) paintAccount(); else closeAccount(); }
  }
  try { (window.parent !== window ? window.parent.document : document).addEventListener('media-profile-change', onProfile); }
  catch (_e) { document.addEventListener('media-profile-change', onProfile); }

  /* ── Tavs konts: what the account keeps, at a glance (the header's name opens it) ─────────────
     The person's own card as it looks, with its editors; the layout, the centre and the chips as
     kept in the account; the radio in one line (its stations and look stay in the shell's
     profile window). Logged out, the header opens the login instead (mk-header-x.js). */
  var acc = null;
  function rosterName(p) {
    var key = String(p.name || '').trim().toLocaleUpperCase('lv-LV'), hit = null;
    Array.prototype.some.call(document.querySelectorAll('#grafiks-list .card.mk-mid-card[data-worker]'), function (c) {
      if (c.closest('.mk-skin-preview-list') || c.getAttribute('data-worker').trim().toLocaleUpperCase('lv-LV') !== key) return false;
      hit = c; return true;
    });
    return { key: key, card: hit };
  }
  // a still copy of the person's card, at its own shape, scaled into the stage
  function cardCopy(p, stage) {
    var r = rosterName(p), src = r.card || (typeof window.__minkaBuildPreviewCard === 'function' ? window.__minkaBuildPreviewCard(r.key) : null);
    if (!src) { stage.innerHTML = '<p class="mk-acc-nocard">Tava kartīte parādīsies, kad būsi grafikā.</p>'; return; }
    var w = src.offsetWidth || 180, h = src.offsetHeight || 180;
    var c = src.cloneNode(true);
    ['--cs', '--cx', '--cyo', '--cz', '--cry', '--crx', '--crz', '--cin', '--chz', '--chry', 'z-index'].forEach(function (k) { c.style.removeProperty(k); });
    c.classList.remove('mk-cor-hot', 'mk-cor-fresh');
    c.removeAttribute('data-worker'); c.removeAttribute('id');
    c.querySelectorAll('[id],[data-worker]').forEach(function (el) { el.removeAttribute('id'); el.removeAttribute('data-worker'); });
    c.querySelectorAll('button,input,select,textarea,a').forEach(function (el) { el.setAttribute('tabindex', '-1'); el.setAttribute('aria-hidden', 'true'); });
    ['position:absolute', 'left:0', 'top:0', 'margin:0', 'transform-origin:0 0', 'pointer-events:none', 'min-height:0', 'max-height:none', 'aspect-ratio:auto', 'width:' + w + 'px', 'height:' + h + 'px'].forEach(function (d) {
      var i = d.indexOf(':'); c.style.setProperty(d.slice(0, i), d.slice(i + 1), 'important');
    });
    var wrap = document.createElement('div'); wrap.id = 'grafiks-list'; wrap.className = 'grid-view mk-skin-preview-list mk-acc-wrap';
    wrap.appendChild(c); stage.replaceChildren(wrap);
    var side = Math.min(stage.clientWidth || 200, 220), k = side / Math.max(w, h);
    stage.style.height = Math.round(h * k) + 'px';
    c.style.setProperty('transform', 'scale(' + k.toFixed(4) + ')', 'important');
  }
  function accRow(icon, title, value, note, act, actLabel) {
    return '<div class="mk-acc-row"><i class="mk-acc-ic" aria-hidden="true">' + icon + '</i><div class="mk-acc-txt"><b>' + title + '</b><span>' + value + '</span>' + (note ? '<small>' + note + '</small>' : '') + '</div>' +
      (act ? '<button type="button" class="mk-acc-go" data-acc="' + act + '">' + actLabel + '</button>' : '') + '</div>';
  }
  function esc(t) { return String(t || '').replace(/[<>&"]/g, ''); }
  function paintAccount() {
    var p = person(), st = profile() || {}, m = media();
    if (!acc || !p) return;
    var a = accountSaved(), saved = !!st.cardLayout, lay = a || current(), cid = st.cardCenter || centerNow(), cen = byCenter(cid) || byCenter('mood');
    var ch = st.cardChips || chipsOn(), r = m && m.getRadio && m.getRadio(), fav = r && r.favorites ? r.favorites.length : 0;
    var LAYI = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="7" height="6" rx="1.6"/><rect x="14" y="5" width="7" height="6" rx="1.6"/><rect x="3" y="14" width="7" height="6" rx="1.6"/><rect x="14" y="14" width="7" height="6" rx="1.6"/></svg>';
    var CENI = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
    var RADI = '<svg viewBox="0 0 24 24"><rect x="3.5" y="8" width="17" height="12" rx="2.6"/><path d="M7 8 16 4"/><circle cx="15.5" cy="14" r="2.6"/></svg>';
    var where = saved ? CHECK + 'Kontā: seko tev uz jebkura datora' : 'Vēl nav kontā: saglabā ar "Manam kontam"';
    acc.querySelector('.mk-acc-name').textContent = p.name || '';
    acc.querySelector('.mk-acc-rows').innerHTML =
      accRow(LAYI, 'Izkārtojums', esc(lay.name), where, 'layout', 'Mainīt') +
      accRow(CENI, 'Centrā', esc(cen.name), cen.id === 'mood' ? 'Noskaņas kartīte' : esc(cen.note), 'layout', 'Mainīt') +
      '<div class="mk-acc-row mk-acc-chips"><i class="mk-acc-ic" aria-hidden="true">' + BOLT + '</i><div class="mk-acc-txt"><b>Centrā rāda arī</b><span>' +
        '<label class="mk-cl-switch"><input type="checkbox" role="switch" data-acc-chip="fatigue"' + (ch.fatigue !== false ? ' checked' : '') + '><span>' + BOLT + 'Nogurums</span></label>' +
        '<label class="mk-cl-switch"><input type="checkbox" role="switch" data-acc-chip="coffee"' + (ch.coffee !== false ? ' checked' : '') + '><span>' + CUP + 'Kafija</span></label></span></div></div>' +
      accRow(RADI, 'Radio', fav ? fav + (fav === 1 ? ' favorīts' : ' favorīti') : 'Vēl nav favorītu', 'Stacijas, radio izskats un pamācība', 'radio', 'Atvērt');
    cardCopy(p, acc.querySelector('.mk-acc-stage'));
  }
  function closeAccount() {
    if (!acc || acc.hidden) return;
    document.removeEventListener('keydown', accKey, true);
    var el = acc, done = function () { el.hidden = true; };
    if (MM && MM.animate) { var an = MM.animate(el.firstElementChild, [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.97' }], 'effects-fast', { fill: 'forwards' }); if (an && an.finished) an.finished.then(function () { done(); an.cancel(); }, done); else done(); }
    else done();
  }
  function accKey(e) { if (e.key === 'Escape') { e.preventDefault(); closeAccount(); } }
  function openAccount() {
    var p = person(), m = media();
    if (!p) { if (m && m.open) m.open({ center: true }); return; }
    if (!acc) {
      acc = document.createElement('div');
      acc.className = 'mk-acc';
      acc.innerHTML = '<section class="mk-acc-box" role="dialog" aria-modal="true" aria-labelledby="mkAccName">' +
        '<div class="mk-acc-cardcol"><div class="mk-acc-stage"></div>' +
          '<button type="button" class="mk-acc-btn" data-acc="look">Mainīt izskatu</button><button type="button" class="mk-acc-btn mk-acc-btn2" data-acc="emoji">Mainīt emoji</button></div>' +
        '<div class="mk-acc-main"><header><div><small>Tavs konts</small><h2 class="mk-acc-name" id="mkAccName"></h2></div>' +
          '<button type="button" class="mk-acc-x" data-acc="close" aria-label="Aizvērt"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
          '<div class="mk-acc-rows"></div>' +
          '<footer><button type="button" class="mk-acc-link" data-acc="switch">Mainīt profilu</button><button type="button" class="mk-acc-link" data-acc="logout">Iziet</button></footer></div></section>';
      document.body.appendChild(acc);
      acc.addEventListener('click', function (e) {
        if (e.target === acc) { closeAccount(); return; }
        var b = e.target.closest('[data-acc]'), mm = media(), pp = person();
        if (!b) return;
        var what = b.dataset.acc, rn = pp && rosterName(pp).key;
        if (what === 'close') closeAccount();
        else if (what === 'layout') { closeAccount(); open(); }
        else if (what === 'look' || what === 'emoji') { closeAccount(); if (typeof window.showWorkerSchedule === 'function' && rn) window.showWorkerSchedule(rn, null, { view: what === 'look' ? 'skin' : 'emoji' }); }
        else if (what === 'radio') { closeAccount(); if (mm && mm.open) mm.open({ center: true }); }
        else if (what === 'switch') { closeAccount(); if (mm && mm.logout) Promise.resolve(mm.logout()).then(function () { if (mm.open) mm.open({ center: true }); }); }
        else if (what === 'logout') { closeAccount(); if (mm && mm.logout) mm.logout(); }
      });
      // the chips: kept on this computer at once and in the account
      acc.addEventListener('input', function (e) {
        var k = e.target.dataset && e.target.dataset.accChip, mm = media();
        if (!k) return;
        var ch = chipsOn(); ch[k] = e.target.checked;
        try { localStorage.setItem(CHIPS, JSON.stringify(ch)); } catch (_e) {}
        if (mm && mm.change && profile()) mm.change({ type: 'settings', settings: { cardChips: ch } });
        paintChips(list.querySelector('.rg-feedback-card'));
      });
    }
    acc.hidden = false;
    paintAccount();
    document.addEventListener('keydown', accKey, true);
    if (MM && MM.animate) MM.animate(acc.firstElementChild, [{ opacity: 0, scale: '.96' }, { opacity: 1, scale: '1' }], 'spring-default');
    var x = acc.querySelector('.mk-acc-x'); if (x) x.focus({ preventScroll: true });
  }
  window.MkAccount = { open: openAccount, close: closeAccount };
  apply();
})();
