/* Card layouts for the desktop calendar without the radio (RG; css/page/card-layout.css).
   A small tile under the mood card's left part (it follows the card in every view; the daily
   cat waits under its right end) opens a menu: ready views drawn as small pictures, and "Savs", one's own view built from a few
   controls (the walls' angle, card size, rows, tilt, the mood card's size or none at all). With
   the radio open there is no mood card: its Cover Flow has its own carousel/grid button.
   Whatever is picked shows on the page at once (the page itself is the preview); Atcelt brings
   the last one back. Saglabāt keeps it on this computer until the next handover (08:00), so the
   following shift starts with the default (flat) view again; "Manam kontam" also keeps it for the
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
    { id: 'koridors', name: 'Telpa', note: 'Kartītes uz sienām telpā ap noskaņu', angle: 22 },
    { id: 'galerija', name: 'Plakans', note: 'Sienas taisni pret tevi (noklusējums)', angle: 0 },
    { id: 'fotografijas', name: 'Kolāža', note: 'Kartītes kā fotogrāfijas uz galda', angle: 0, scatter: true },
    { id: 'fokuss', name: 'Kartītes', note: 'Tikai kartītes, lielākas, bez noskaņas', angle: 12, mood: false, max: 280 },
    { id: 'rezgis', name: 'Režģis', note: 'Visi vienā tīklā, noskaņa sānā', angle: null },
    { id: 'lielas', name: 'Lielās', note: 'Visas kartītes lielas rindās, bez noskaņas', angle: null, carousel: true, flat: true, mood: false }
  ];
  var DEFAULT = 'galerija', KEY = 'mkCardLayout:';
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
    { id: 'candy', name: 'Konfektes', note: 'Konfektes 98 no galerijas, ar līmeņiem', icon: '🍬', game: 'candy' },
    { id: 'runner', name: 'Skrējiens', note: 'Nogurumiņš lec pāri krūzēm, katrs līmenis citā tonī', icon: '🏃', game: 'runner' },
    // widgets: plain DOM in the mood's place (see mountWidget)
    { id: 'emoji', name: 'Emoji', note: 'Liels emoji pēc izvēles, ar kustību', icon: '😎', widget: 'emoji' },
    { id: 'month', name: 'Kalendārs', note: 'Mēneša kalendārs: klikšķis atver dienu', icon: '📅', widget: 'month' },
    { id: 'radio', name: 'Radio', note: 'Radio vadība, neatverot radio logu', icon: '📻', widget: 'radio' }
  ];
  function clampOwn(o) {
    o = o || {};
    var n = function (v, lo, hi, d) { v = Number(v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
    // few controls, each always giving a sound layout: no forced rows, no tilt, no walls turned away
    // max from 100: in a low window the largest cards that fit are smaller than the usual 140 px,
    // and the slider must still have somewhere to go
    return { angle: n(o.angle, 0, 40, 22), max: n(o.max, 100, 340, 240), rows: 0, tilt: 0,
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
    if (isOpen) paint();   // the menu's own state and pictures: only while it is shown (open() paints it)
    paintBtn(l);
  }
  // With the game in the mood's place the walls give it more room (the cards get smaller, down to
  // 96 px; their names shrink to fit, card-name-fit in corridor.js): the corridor reads this, the mood card itself keeps its size underneath (placeCenter).
  // The game asks for just what it uses: the board is square and as tall as the box allows, the panel
  // stands at its side (mood-gallery-pc.js SW), so its width is the board's height plus the panel. Wider
  // would only leave empty bands beside the board and make the cards smaller for nothing.
  function gameOn() { return centerNow() === 'candy' && current().mood !== false; }
  function gameSpan() {
    var Hb = header && header.getBoundingClientRect(), top = Hb && Hb.height ? Hb.bottom + 8 : 4, h = window.innerHeight - 64 - top;
    // what is not the game in the box (the mood's line and the rating row), as last measured
    var gb = centerEl.querySelector('.mk-cl-game-box'), over = !centerEl.hidden && gb && gb.offsetHeight ? centerEl.offsetHeight - gb.offsetHeight : 150;
    // the board as tall as what is left under the strip (78), plus the picture's padding; never
    // narrower than the rating row under it
    // nine columns of the rows' cell size at most (mood-gallery-pc.js NX): the board may be wider than tall
    return { top: top, h: h, w: Math.max(460, Math.round(Math.max(240, h - over - 78) * 9 / 7) + 36) };
  }
  window.MkCardLayout = { list: LAYOUTS, current: function () {
    var l = current(), mood = gameOn() && list.querySelector('.rg-feedback-card'), mw = mood && mood.offsetWidth;
    if (!mw) return l;
    var base = l.moodScale || 1, want = Math.max(base, Math.min(2.6, gameSpan().w / mw));
    return Object.assign({}, l, { moodScale: want, grow: base, min: 96 });
  } };
  // the game's box: the mood card's place grown round its middle as far as the corridor made room
  // (moodScaleNow, corridor.js) and no wider than the game uses, the whole height above the switch's
  // row. In the usual grid nothing made room: the mood card's own place.
  // Any layout: the box takes the free room between the cards beside the mood card, never over one.
  // In the corridor the walls have stepped back for it and it runs the whole height; elsewhere it keeps
  // the mood card's height and widens into whatever is free at its sides.
  function centreRect(M) {
    if (!M || !M.width || !gameOn()) return M;
    var span = gameSpan(), cor = root.classList.contains('mk-corridor'), L = list.getBoundingClientRect();
    var top = cor ? Math.max(L.top + 4, span.top) : M.top, bot = cor ? window.innerHeight - 64 : M.bottom;
    var cx = M.left + M.width / 2, lo = Math.max(L.left + 8, 8), hi = Math.min(L.right - 8, window.innerWidth - 8);
    [].forEach.call(list.querySelectorAll('.card.mk-mid-card:not(.rg-feedback-card), .cards-section-label'), function (c) {
      var r = c.getBoundingClientRect();
      if (!r.width || r.bottom <= top || r.top >= bot) return;
      if (r.right <= cx) lo = Math.max(lo, r.right + 14); else if (r.left >= cx) hi = Math.min(hi, r.left - 14);
    });
    var w = Math.min(span.w, hi - lo);
    if (w <= M.width) { if (!cor) return M; w = M.width; }
    var left = Math.max(lo, Math.min(cx - w / 2, hi - w));
    return { left: left, right: left + w, top: top, bottom: bot, width: w, height: bot - top };
  }

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
  // a wrapped sweet in gold: glossy body with a twist, pleated wrapper ends, a highlight;
  // the glow and the sparks round it are the button's own (card-layout.css)
  var CANDY_ICON = '<i class="mk-cl-candy-halo" aria-hidden="true"></i><svg viewBox="0 0 44 26" aria-hidden="true">' +
    '<defs><radialGradient id="kcA" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffcf4a"/><stop offset="1" stop-color="#b9780c"/></radialGradient>' +
    '<linearGradient id="kcB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#c88a14"/></linearGradient></defs>' +
    '<path fill="url(#kcB)" d="M13.5 13 3 4.2c-1-.8-2.4 0-2.2 1.3l1 7.5-1 7.5c-.2 1.3 1.2 2.1 2.2 1.3Z M30.5 13 41 4.2c1-.8 2.4 0 2.2 1.3l-1 7.5 1 7.5c.2 1.3-1.2 2.1-2.2 1.3Z"/>' +
    '<path fill="none" stroke="#9a6406" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round" d="M5 8.5l6 4.5-6 4.5M39 8.5l-6 4.5 6 4.5"/>' +
    '<circle cx="22" cy="13" r="9.6" fill="url(#kcA)"/>' +
    '<path fill="none" stroke="#a86a06" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round" d="M15.6 9.6c3.4 2.6 9.4 2.6 12.8 0M14.5 14.6c4 2.8 11 2.8 15 0"/>' +
    '<ellipse cx="18.6" cy="8.4" rx="3.6" ry="1.9" fill="#fff" fill-opacity=".8" transform="rotate(-24 18.6 8.4)"/></svg>' +
    '<i class="mk-cl-candy-spark" aria-hidden="true"></i><i class="mk-cl-candy-spark" aria-hidden="true"></i>';
  var bar = document.createElement('div');
  bar.className = 'mk-cl-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Kartīšu izkārtojums');
  bar.innerHTML = '<span class="mk-cl-quick"></span><button type="button" class="mk-cl-more" aria-haspopup="dialog" aria-expanded="false" aria-label="Visi izkārtojumi" title="Visi izkārtojumi">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/></svg></button>' +
    // the game, one press away: a gold segment of the same switch
    '<button type="button" class="mk-cl-candy" aria-pressed="false" aria-label="Konfektes: spēle noskaņas vietā" title="Konfektes">' + CANDY_ICON + '</button>' +
    // the other game, the same way: a Nogurumiņš that jumps over the shift's cups (js/page/mk-runner.js)
    '<button type="button" class="mk-cl-run" aria-pressed="false" aria-label="Skrējiens: spēle noskaņas vietā" title="Skrējiens"><img src="assets/butnes/runner-icon.webp?v=20261124rn1" alt="" width="27" height="24" draggable="false"></button>';
  var quick = bar.querySelector('.mk-cl-quick'), btn = bar.querySelector('.mk-cl-more'), quickKey = '';
  // the game in the mood's place, and back to the mood again
  var candyBtn = bar.querySelector('.mk-cl-candy');
  candyBtn.addEventListener('click', function () { setCenter(centerNow() === 'candy' ? 'mood' : 'candy'); });
  var runBtn = bar.querySelector('.mk-cl-run');
  runBtn.addEventListener('click', function () { setCenter(centerNow() === 'runner' ? 'mood' : 'runner'); });
  // The sweet twinkles now and then, not all the time (running without end it cost more than the whole mood card
  // while the app idled): three breaths when the bar appears, when another day is opened and under the pointer;
  // the CSS animation itself is as it was (card-layout.css), only its class comes and goes. No timer.
  // (restarted without asking for a layout: the class goes now and comes back in the next frame)
  var candyRaf = 0;
  function candyTwinkle() {
    candyBtn.classList.remove('mk-cl-candy-live');
    cancelAnimationFrame(candyRaf);
    candyRaf = requestAnimationFrame(function () { candyBtn.classList.add('mk-cl-candy-live'); });
  }
  candyBtn.addEventListener('animationend', function (e) { if (e.animationName === 'mk-cl-candy-glow') candyBtn.classList.remove('mk-cl-candy-live'); });
  candyBtn.addEventListener('pointerenter', candyTwinkle);
  window.addEventListener('daySelected', candyTwinkle);
  candyTwinkle();
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
  var M3DOCK = document.documentElement.classList.contains('mk-m3');
  var placed = '', header = document.getElementById('minkaBarWrap');
  function placeBtn() {
    var mood = list.querySelector('.rg-feedback-card'), M = mood && mood.getBoundingClientRect();
    // without a mood card on the page (hidden by the layout) the pill keeps its last place
    var off = root.classList.contains('host-radio-open');
    if (!off && (!M || !M.width)) { var L0 = list.getBoundingClientRect(); M = { left: L0.left + L0.width / 2, right: L0.left + L0.width / 2, width: 0.01, top: L0.bottom, bottom: L0.bottom, height: 0 }; mood = null; }
    if (mood && !off) M = centreRect(M);   // the game, larger than the mood card
    // The first of a few places that covers no card, the mood card's rating row nor the header and
    // stays above the dock: under the mood card's left part (the pet waits under its right end,
    // daily-cat.js), over it, beside its rating row, the roster's bottom corner.
    var key = placed;
    if (off) key = 'off';
    else if (M && M.width) {
      var Hb = header && header.getBoundingClientRect(), under = Hb && Hb.height ? Hb.bottom : 0;
      var wide = bar.classList.contains('is-compact') || bar.classList.contains('is-docked');   // (its own width then is not the whole switch's)
      var full = wide ? (bar.__fullW || 260) : (bar.offsetWidth || 260);
      if (!wide && bar.offsetWidth) bar.__fullW = bar.offsetWidth;
      var w = full, h = 40, ih = window.innerHeight, iw = window.innerWidth;
      // the rating row on screen: the middle's own copy while a picture or game covers the mood card
      // (the card's row is hidden under it, wherever the card now stands)
      var covered = !centerEl.hidden && centerEl.querySelector('.mk-cl-moodrow');
      var taps = covered || (mood && mood.querySelector('.rg-pulse-taps')), T = taps && taps.getBoundingClientRect(), ty = T && T.height ? T.top + T.height / 2 - h / 2 : M.bottom - h;
      var L = list.getBoundingClientRect();
      var busy = [].slice.call(list.querySelectorAll('.card.mk-mid-card')).filter(function (c) { return c !== mood; })
        .map(function (c) { return c.getBoundingClientRect(); }).filter(function (r) { return r.width; });
      // the carousel's own ‹ › and view buttons
      [].slice.call(list.querySelectorAll('.mk-cf-nav')).forEach(function (n) { var r = n.getBoundingClientRect(); if (r.width) busy.push(r); });
      busy.push(T && T.width ? T : M);
      // the pet is not in the way: at home it stands beside the switch (daily-cat.js)
      var free = function (x, y) {
        // inside the roster: never over the side columns (radiographers', radiologists')
        if (x < Math.max(6, L.left + 4) || x + w > Math.min(iw - 6, L.right - 4) || y < under + 4 || y + h > ih - 6) return false;
        if (x < M.right && x + w > M.left && y < M.bottom && y + h > M.top) return false;
        return busy.every(function (r) { return x + w <= r.left - 4 || x >= r.right + 4 || y + h <= r.top - 4 || y >= r.bottom + 4; });
      };
      // right in the middle under the rating row; with no mood card shown, the roster's bottom middle first
      var left0 = M.left + 6;
      var bottomMid = [L.left + L.width / 2 - w / 2, Math.min(L.bottom, ih) - h - 8];
      var spots = (current().mood === false ? [bottomMid] : []).concat([[M.left + M.width / 2 - w / 2, M.bottom + 12], [left0, M.bottom + 12],
        [M.left + M.width / 2 - w / 2, M.top - h - 8], [M.right + 12, ty], [M.left - w - 12, ty],
        [L.right - w - 12, Math.min(L.bottom, ih) - h - 8], [L.left + 12, Math.min(L.bottom, ih) - h - 8], bottomMid]);
      var pick = function () { return spots.filter(function (p) { return p && free(p[0], p[1]); })[0]; };
      // M3 (mk-mood-m3.css): one block of buttons (the user: join them): the switch stands right under the rating
      // row as its second row, as wide as it, when nothing is in the way there; otherwise it floats as before
      var spot = null, compact = false;
      // M3: the switch is the rating row's second row, wherever that row is: in the mood card, or in the game's own
      // copy of the row while a game or picture covers the card (the user: the game showed the old look)
      // (Which row it goes into is settled below, after the middle is built or hidden: dockBar.)
      var docked = M3DOCK && !!mood && current().mood !== false;
      if (bar.classList.contains('is-docked') !== docked) { bar.classList.toggle('is-docked', docked); placed = ''; }
      if (docked) {   // one element with the ratings (the user): in the row's own box, so it moves with it and needs no place of its own
        bar.classList.remove('in-rail', 'is-compact');
        spot = ['', ''];
      }
      if (!spot) spot = pick();
      // no room for the whole switch (a short window, many people): only "⋯", in a gap
      if (!spot) {
        compact = true; w = 92;   // "⋯" and the sweet
        left0 = M.left + 6;
        spots = [[M.left + M.width / 2 - w / 2, M.bottom + 8], [M.right + 8, ty], [M.left - w - 8, ty], [M.right - w, M.bottom + 8], [M.left, M.bottom + 8],
          [L.right - w - 12, Math.min(L.bottom, ih) - 48], [L.left + 12, Math.min(L.bottom, ih) - 48]];
        spot = pick();
      }
      // nowhere free at all: "⋯" waits in the day rail, by the month and the calendar
      var rail = !spot && document.querySelector('#minkaBarWrap .mk-date-controls');
      if (rail) { if (bar.parentNode !== rail) rail.insertBefore(bar, rail.firstChild); bar.classList.add('in-rail'); spot = [0, 0]; }
      else if (!docked && bar.parentNode !== document.body) { document.body.appendChild(bar); bar.classList.remove('in-rail'); }
      if (!spot) spot = [M.right - 40, Math.min(M.bottom + 8, ih - 46)];
      if (bar.classList.contains('is-compact') !== compact) { bar.classList.toggle('is-compact', compact); placed = ''; }
      key = docked ? 'dock,' : Math.round(spot[0]) + ',' + Math.round(spot[1]);
    }
    placeCenter(off ? null : M);
    // In the rating row's own box: the game's copy of the row while a game or picture covers the card, else the
    // card's own row (on a day not yet begun a line of words stands under the row: the switch must not land on
    // it). After placeCenter: only then is it known which of the two rows is on show.
    if (!off && M3DOCK && bar.classList.contains('is-docked')) {
      var dockHost = (!centerEl.hidden && centerEl.querySelector('.mk-cl-moodrow')) || (mood && mood.querySelector('.rg-pulse-taps'));
      if (dockHost && bar.parentNode !== dockHost) dockHost.appendChild(bar);
      dockInd();
    }
    if (key === placed && !off === !bar.hidden) return;
    bar.hidden = off;
    if (off) { placed = ''; close(); return; }
    placed = key;
    var k = key.split(',');
    bar.style.left = k[0] === 'dock' ? '' : k[0] + 'px'; bar.style.top = k[0] === 'dock' ? '' : k[1] + 'px';   // docked: the stylesheet places it in the card
    if (isOpen) placePanel();
    window.dispatchEvent(new Event('mk-cl-bar-placed'));   // the pet stands beside it at home
  }
  // The layout shown now has one pill in the docked row, and it flows from the old layout to the new (the user:
  // natural and fluid; MinkaMotion.liquid, as the app's tabs). Read and moved only when the layout or the row
  // it stands in is another.
  var dockIndKey = '';
  function dockInd() {
    var LQ = window.MinkaMotion;
    if (!LQ || !LQ.liquid) return;
    var ind = bar.querySelector(':scope > .m3-ind'), t = bar.querySelector('.mk-cl-q[aria-pressed="true"]');
    if (!ind) { ind = document.createElement('i'); ind.className = 'm3-ind'; ind.setAttribute('aria-hidden', 'true'); bar.insertBefore(ind, bar.firstChild); dockIndKey = ''; }
    var host = bar.parentNode && bar.parentNode.className, key = t ? t.dataset.q + '|' + host : '';
    if (key === dockIndKey) return;
    var flow = !!dockIndKey && !!key && dockIndKey.split('|')[1] === String(host);   // the same row: it flows; another row: it stands there at once
    dockIndKey = key;
    if (!t) { ind.classList.remove('is-on'); return; }
    if (LQ.liquid(ind, bar, t, { animate: flow })) ind.classList.add('is-on'); else dockIndKey = '';
  }
  var placeFrame = 0;
  function schedulePlace() { if (!placeFrame) placeFrame = requestAnimationFrame(function () { placeFrame = 0; placeBtn(); }); }
  // what moves the mood card: a resize, the roster rebuilt (day switch), the layout changed (the
  // cards glide for ~0.5 s), scrolling the corridor, the radio; and its own height
  var moodRO = typeof ResizeObserver === 'function' ? new ResizeObserver(schedulePlace) : null, moodSeen = null;
  function watchMood() { var m = list.querySelector('.rg-feedback-card'); if (moodRO && m && m !== moodSeen) { if (moodSeen) moodRO.unobserve(moodSeen); moodRO.observe(m); moodSeen = m; } schedulePlace(); }
  new MutationObserver(watchMood).observe(list, { childList: true });
  // <html>'s class changes for many reasons (the night panel, a dialog, the weather); only these
  // move the mood card. Placing reads a dozen boxes, which costs a whole layout when the page has
  // just changed, so it is not done for the others.
  var rootSig = '';
  new MutationObserver(function () {
    var c = root.classList, sig = ['host-radio-open', 'mk-corridor', 'mk-cf', 'mk-cf-solo', 'mk-cl-nomood', 'mk-mobile-shell'].map(function (k) { return c.contains(k) ? 1 : 0; }).join('');
    if (sig === rootSig) return;
    rootSig = sig;
    schedulePlace();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedulePlace);
  window.addEventListener('mk-card-layout', function () { schedulePlace(); setTimeout(schedulePlace, 600); });
  window.addEventListener('mk-corridor-placed', schedulePlace);   // the walls moved: the middle's box follows in the same frame's wake
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
  var PAW = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><ellipse cx="12" cy="16" rx="5" ry="4"/><circle cx="5.5" cy="11" r="2.2"/><circle cx="9.5" cy="6.5" r="2.2"/><circle cx="14.5" cy="6.5" r="2.2"/><circle cx="18.5" cy="11" r="2.2"/></g></svg>';
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
      range('max', 'Kartīšu izmērs', 100, 340, 10) + range('angle', 'Sienu leņķis', 0, 40, 1) + range('moodScale', 'Noskaņas izmērs', 0.7, 1.3, 0.05) +
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
      '<label class="mk-cl-switch" title="Rādīt dežūras kafiju"><input type="checkbox" role="switch" data-chip-on="coffee"><span>' + CUP + 'Kafija</span></label>' +
      '<label class="mk-cl-switch" title="Rādīt kaķi"><input type="checkbox" role="switch" data-chip-on="cat"><span>' + PAW + 'Kaķis</span></label></div>' +
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
        // The card size slider ends where the cards stop growing in this window (corridor.js
        // reports the largest size that fits), so its whole travel does something and the number
        // is the size really shown. The chosen size is kept: with more room the cards grow to it.
        var free = k === 'max' && window.MkCardLayout.free || 0, shown = free ? Math.min(o.max, free) : o.max;
        if (k === 'max') input.max = String(free ? Math.max(120, Math.min(340, Math.ceil(free / 10) * 10)) : 340);
        if (input.type === 'checkbox') input.checked = o.mood; else if (Number(input.value) !== (k === 'max' ? Math.min(o.max, Number(input.max)) : o[k])) input.value = String(o[k]);
        var out = panel.querySelector('[data-out="' + k + '"]');
        if (out) out.textContent = k === 'moodScale' ? Math.round(o[k] * 100) + '%' : k === 'max' ? shown + ' px' : o[k] + '°';
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
  window.addEventListener('mk-corridor-fit', function () { if (isOpen) paint(); });

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
    var wasGame = gameOn();
    try { if (id === 'mood') localStorage.removeItem(CENTER); else localStorage.setItem(CENTER, JSON.stringify({ id: id, until: nextHandover(Date.now()) })); } catch (_e) {}
    centerSig = '';
    schedulePlace();
    if (wasGame !== gameOn()) {   // the walls make room for the game, or close in again: at once, no glide
      var moving = [].slice.call(list.querySelectorAll('.card.mk-mid-card'));
      moving.forEach(function (c) { c.classList.add('mk-cor-fresh'); });
      window.dispatchEvent(new Event('mk-card-layout'));
      setTimeout(function () { moving.forEach(function (c) { c.classList.remove('mk-cor-fresh'); }); }, 160);
    }
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
    var copy = taps.cloneNode(true), sw = copy.querySelector('.mk-cl-bar');
    if (sw) sw.remove();                                    // (the layout switch docked in the card's row is not part of the copy)
    copy.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
    [].forEach.call(copy.children, function (b, i) { b.dataset.tap = i; });
    // the card's own custom properties (sizes, colours) on the host
    var cs = getComputedStyle(mood);
    for (var i = 0; i < cs.length; i++) { var p = cs[i]; if (p.charCodeAt(0) === 45 && p.charCodeAt(1) === 45 && /^--(rg|mx|mk-mx|tap|pulse|md-sys|m3-|mb-)/.test(p)) host.style.setProperty(p, cs.getPropertyValue(p)); }   // (md-sys, m3, mb: the M3 look's tones)
    var docked = host.querySelector(':scope > .mk-cl-bar');   // the layout switch docked under the row stays (M3)
    host.replaceChildren(copy);
    if (docked) host.appendChild(docked);
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
    try { var v = JSON.parse(localStorage.getItem(CHIPS) || 'null'); if (v) return { fatigue: v.fatigue !== false, coffee: v.coffee !== false, cat: v.cat !== false }; } catch (_e) {}
    var st = profile(), a = st && st.cardChips;
    return a ? { fatigue: a.fatigue !== false, coffee: a.coffee !== false, cat: a.cat !== false } : { fatigue: true, coffee: true, cat: true };
  }
  // the daily cat and what it says can be switched off with the other two (css/page/card-layout.css)
  root.classList.toggle('mk-cl-nocat', !chipsOn().cat);
  function paintChips(mood) {
    var on = chipsOn(), box = centerEl.firstElementChild;
    root.classList.toggle('mk-cl-nocat', !on.cat);
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
    if (c.widget) return '<div class="mk-cl-art mk-cl-widget" data-c="' + id + '"><div class="mk-cl-wbox"></div>' + moodLine() + rateRow() + '</div>';
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
    candyBtn.setAttribute('aria-pressed', String(on && id === 'candy'));
    runBtn.setAttribute('aria-pressed', String(on && id === 'runner'));
    // The game in the usual grid (Režģis): the mood card is one cell of two columns among the cards; for
    // the game it takes four and the height down to the switch, and the cards close up in the rest
    // (card-layout.css mk-cl-game-grid).
    var gameGrid = on && id === 'candy' && !root.classList.contains('mk-corridor');
    if (root.classList.contains('mk-cl-game-grid') !== gameGrid) root.classList.toggle('mk-cl-game-grid', gameGrid);
    if (mood) {
      var mh = gameGrid ? Math.max(0, Math.round(window.innerHeight - 64 - mood.getBoundingClientRect().top)) + 'px' : '';
      if (mood.style.getPropertyValue('min-height') !== mh) { if (mh) mood.style.setProperty('min-height', mh, 'important'); else mood.style.removeProperty('min-height'); }
    }
    if (on !== root.classList.contains('mk-cl-center-on')) document.dispatchEvent(new CustomEvent('mk-mood-covered', { detail: on }));
    root.classList.toggle('mk-cl-center-on', on);
    centerEl.hidden = !on;
    if (!on) { if (centerSig || centerEl.firstChild) { centerSig = ''; centerMood = null; centerBox = ''; unmountGame(); unmountWidget(); stopLive(); centerEl.innerHTML = ''; } return; }   // (firstChild: setCenter has already cleared centerSig, and the game stayed alive, hidden)
    // The picture (its worker and WebGL program) or the game lives on through day switches: only a
    // new choice builds it again. The mood's face, word and rating row follow the day's own mood
    // card when that card is a new one; later changes to it come through watchMoodState.
    var fresh = id !== centerSig;
    if (fresh) {
      centerSig = id; unmountGame(); unmountWidget(); stopLive();
      centerEl.dataset.center = id; centerEl.innerHTML = centerHtml(id, mood);
      var cc = byCenter(id);
      if (cc.game) mountGame(cc.game); else if (cc.widget) mountWidget(cc.widget); else startFx(cc);
    }
    else if (widget && widget.sync) widget.sync();   // a day switch: the month follows the shown day
    if (fresh) { centerMood = mood; watchMoodState(mood); paintMood(); paintRate(); }
    else if (mood !== centerMood) {
      // a new day's mood card: its face and row are copied right after this frame is painted (the
      // copy reads the card's styles; before the paint that would hold the new day back)
      centerMood = mood;
      setTimeout(function () { if (centerMood !== mood || centerEl.hidden) return; watchMoodState(mood); paintMood(); paintRate(); }, 0);
    }
    // a mood card scrolled up under the day rail: what is under the rail is not shown (the box is
    // fixed and above the page, it would lie over the rail)
    var Hb = header && header.getBoundingClientRect(), cut = Hb && Hb.height ? Math.max(0, Math.round(Hb.bottom - M.top)) : 0;
    var box = Math.round(M.left) + ',' + Math.round(M.top) + ',' + Math.round(M.width) + ',' + Math.round(M.height) + ',' + cut;
    if (box !== centerBox) {
      centerBox = box;
      // the game is shown once its box has stopped changing (the walls step back over ~0.6 s): it
      // appears at its size instead of growing in front of you
      if (game && Date.now() < settleUntil) { clearTimeout(settleTimer); settleTimer = setTimeout(settled, 90); }
      centerEl.style.left = Math.round(M.left) + 'px'; centerEl.style.top = Math.round(M.top) + 'px';
      centerEl.style.width = Math.round(M.width) + 'px'; centerEl.style.height = Math.round(M.height) + 'px';
      centerEl.style.clipPath = cut ? 'inset(' + cut + 'px 0 0 0)' : '';
    }
  }
  var centerMood = null, centerBox = '', settleUntil = 0, settleTimer = 0;
  function settled() { settleUntil = 0; centerEl.classList.remove('is-settling'); }
  // the games: the gallery's own Windows 98 (js/page/mood-gallery-pc.js), one game mounted in the box
  var PC_SRC = 'js/page/mood-gallery-pc.js?v=20261124ng1', pcLoad = null, game = null;
  var RUN_SRC = 'js/page/mk-runner.js?v=20261124rn2', runLoad = null;
  function mountGame(app) {
    var box = centerEl.querySelector('.mk-cl-game-box');
    if (app === 'runner') {   // its own small file, fetched on the first opening; it keeps the mood card's own size
      if (!runLoad) runLoad = new Promise(function (ok, no) {
        if (window.MinkaRunner) { ok(); return; }
        var sc = document.createElement('script'); sc.src = RUN_SRC; sc.onload = ok; sc.onerror = function () { runLoad = null; no(); }; document.head.appendChild(sc);
      });
      runLoad.then(function () { if (box.isConnected && !game && centerNow() === 'runner') window.__mkRunner = game = window.MinkaRunner.open({ mount: box }); }, function () {});
      return;
    }
    loadPC().then(function () {
      if (!box.isConnected || game || window.MinkaGalleryPC.isOpen()) return;
      centerEl.classList.add('is-settling'); settleUntil = Date.now() + 700;
      clearTimeout(settleTimer); settleTimer = setTimeout(settled, 120);
      game = window.MinkaGalleryPC.open({ app: app, mount: box, endless: true, me: { name: window.MinkaMyAnimal ? window.MinkaMyAnimal() : '' } });
    }, function () {});
  }
  function unmountGame() { if (game) { var g = game; game = null; try { g.close(); } catch (_e) {} } }
  function loadPC() {
    if (!pcLoad) pcLoad = new Promise(function (ok, no) {
      if (window.MinkaGalleryPC) { ok(); return; }
      var sc = document.createElement('script'); sc.src = PC_SRC; sc.onload = ok; sc.onerror = function () { pcLoad = null; no(); }; document.head.appendChild(sc);
    });
    return pcLoad;
  }

  /* Widgets in the mood's place: a big emoji of one's choice (still, or with a quiet movement),
     the month (a click opens that day) and the radio's controls (the radio window stays shut).
     Plain DOM, drawn when something changes: nothing runs while a widget only stands there (the
     emoji's movement is one composited CSS animation). */
  var widget = null;
  function unmountWidget() { if (widget) { var w = widget; widget = null; if (w.off) try { w.off(); } catch (_e) {} } }
  function mountWidget(kind) {
    var box = centerEl.querySelector('.mk-cl-wbox');
    if (box) widget = (kind === 'emoji' ? emojiWidget : kind === 'month' ? monthWidget : radioWidget)(box) || {};
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // The big emoji: one of the app's own 3D pictures (js/emoji3d.js: Noto 3D, Emoji 18, Roji,
  // Baloni), chosen from a menu by set, with small pieces of itself drifting up around it (they
  // can be switched off). It plays its own animation while the pointer is on it, where it has one.
  // Kept on this computer.
  var EMOJI = KEY + 'emoji';
  // tabs: Noto 3D (with the few Emoji 18 ones), the classic Noto that can move, Roji, Baloni
  var EMOJI_SETS = [['noto', 'Noto 3D'], ['notoanim', 'Kustīgie'], ['roji', 'Roji'], ['balloon', 'Baloni']];
  function emojiTab(set) { return set === 'noto18' ? 'noto' : set; }
  // where the eight pieces rise: left %, size px, how far along its way each one starts
  var EMOJI_BITS = [[8, 26, 0], [22, 18, 3], [36, 22, 6], [62, 20, 1], [76, 28, 4], [90, 18, 7], [48, 16, 5], [14, 20, 2]];
  function emojiWidget(box) {
    var E3 = window.MinkaEmoji3D;
    if (!E3) { box.innerHTML = '<p class="mk-cl-rnote">Emoji šeit nav pieejami.</p>'; return {}; }
    var first = E3.decode(E3.styled('noto', '😎') || '') || (E3.list('noto')[0] || E3.list()[0]).id;
    var st = { id: first, bits: true, set: 'noto' };
    try { var v = JSON.parse(localStorage.getItem(EMOJI) || 'null'); if (v && E3.get(v.id)) st = { id: v.id, bits: v.bits !== false, set: emojiTab(E3.get(v.id).set) }; } catch (_e) {}
    var src = function (id, big) { return new URL(E3.url(id, big ? 320 : 128), location.href).href; };
    box.innerHTML = '<div class="mk-cl-ebits" aria-hidden="true"></div>' +
      '<button type="button" class="mk-cl-emo" aria-haspopup="dialog" aria-expanded="false" title="Mainīt emoji"><img alt="" draggable="false"></button>' +
      '<div class="mk-cl-emopick" role="dialog" aria-label="Emoji" hidden>' +
      '<div class="mk-cl-emotabs" role="group" aria-label="Komplekts">' + EMOJI_SETS.map(function (t) { return '<button type="button" data-emoset="' + t[0] + '" aria-pressed="false">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="mk-cl-emogrid"></div>' +
      '<label class="mk-cl-switch mk-cl-emobits"><input type="checkbox" role="switch" data-emobits><span>Gabaliņi apkārt</span></label></div>';
    var pick = box.querySelector('.mk-cl-emopick'), big = box.querySelector('.mk-cl-emo'), img = big.firstElementChild, grid = box.querySelector('.mk-cl-emogrid'), bits = box.querySelector('.mk-cl-ebits');
    var gridSet = '';
    function paintGrid() {
      if (gridSet !== st.set) {   // a set's pictures: small ones, each loaded when it scrolls into sight
        gridSet = st.set;
        grid.innerHTML = (st.set === 'noto' ? E3.list('noto').concat(E3.list('noto18')) : E3.list(st.set)).map(function (it) { return '<button type="button" data-emo="' + it.id + '" title="' + esc(it.label) + '" aria-pressed="false"><img alt="' + esc(it.label) + '" loading="lazy" decoding="async" src="' + src(it.id) + '"></button>'; }).join('');
        grid.scrollTop = 0;
      }
      [].forEach.call(grid.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.emo === st.id)); });
      [].forEach.call(box.querySelectorAll('[data-emoset]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.emoset === st.set)); });
    }
    function paint() {
      img.src = src(st.id, true);
      img.alt = E3.get(st.id).label;
      bits.innerHTML = st.bits ? EMOJI_BITS.map(function (b) { return '<img alt="" src="' + src(st.id) + '" style="left:' + b[0] + '%;width:' + b[1] + 'px;animation-delay:-' + b[2] + 's">'; }).join('') : '';
      box.querySelector('[data-emobits]').checked = st.bits;
      if (!pick.hidden) paintGrid();
    }
    function save() { try { localStorage.setItem(EMOJI, JSON.stringify({ id: st.id, bits: st.bits })); } catch (_e) {} }
    function toggle(open) { pick.hidden = !open; big.setAttribute('aria-expanded', String(open)); if (open) { st.set = emojiTab(E3.get(st.id).set); paintGrid(); } }
    function onClick(e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b === big) toggle(pick.hidden);
      else if (b.dataset.emoset) { st.set = b.dataset.emoset; paintGrid(); }
      else if (b.dataset.emo) { st.id = b.dataset.emo; save(); paint(); toggle(false); }
    }
    function onInput(e) { if (e.target.matches('[data-emobits]')) { st.bits = e.target.checked; save(); paint(); } }
    // its own animation while the pointer is on it
    function play() { var a = E3.animUrl(st.id); if (a && pick.hidden) img.src = new URL(a, location.href).href; }
    function still() { img.src = src(st.id, true); }
    function away(e) { if (!pick.hidden && !box.contains(e.target)) toggle(false); }
    box.addEventListener('click', onClick);
    box.addEventListener('input', onInput);
    big.addEventListener('pointerenter', play);
    big.addEventListener('pointerleave', still);
    document.addEventListener('pointerdown', away, true);
    paint();
    return { off: function () { document.removeEventListener('pointerdown', away, true); } };
  }

  // The month of the shown day; a click opens that day.
  var MONTHS = ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'];
  function monthWidget(box) {
    var shown = '';
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    function paint() {
      var act = String(window.__activeDateStr || ''), p = act.split('.').map(Number);
      if (act === shown || p.length !== 3 || !p[2]) return;
      shown = act;
      var y = p[2], m = p[1] - 1, lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
      // the duty day (until 08:00 it is still yesterday's), as everywhere in the calendar
      var now = new Date(); if (now.getHours() < 8) now.setDate(now.getDate() - 1);
      var today = now.getFullYear() === y && now.getMonth() === m ? now.getDate() : 0;
      var html = '<div class="mk-cl-mhead">' + MONTHS[m] + ' ' + y + '</div><div class="mk-cl-mgrid">' +
        ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'].map(function (w, i) { return '<span class="mk-cl-mwd' + (i > 4 ? ' is-we' : '') + '" aria-hidden="true">' + w + '</span>'; }).join('');
      for (var i = 0; i < lead; i++) html += '<span></span>';
      for (var d = 1; d <= days; d++) {
        var we = (lead + d - 1) % 7 > 4;
        html += '<button type="button" data-day="' + two(d) + '.' + two(m + 1) + '.' + y + '" class="' + (d === today ? 'is-today' : '') + (we ? ' is-we' : '') + '" aria-pressed="' + (d === p[0]) + '">' + d + '</button>';
      }
      box.innerHTML = html + '</div>';
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-day]');
      if (b && window.g_goToDate) window.g_goToDate(b.dataset.day);
    });
    paint();
    return { sync: paint };
  }

  // The radio's controls: station, what plays, play / pause, previous and next station. The radio
  // itself lives in the shell page; its window stays shut. Its own elements say what it does
  // (observed, not polled).
  function radioWidget(box) {
    var P = null;
    try { if (window.parent !== window && window.parent.document.getElementById('playBtn')) P = window.parent; } catch (_e) {}
    if (!P) { box.innerHTML = '<p class="mk-cl-rnote">Radio šeit nav pieejams.</p>'; return {}; }
    var ICON = { prev: '<path d="M7 6v12M19 6 9.5 12 19 18Z"/>', next: '<path d="M17 6v12M5 6l9.5 6L5 18Z"/>', play: '<path d="M8 5v14l11-7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>' };
    var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>'; };
    box.innerHTML = '<div class="mk-cl-rnow"><b></b><span></span></div>' +
      '<div class="mk-cl-rbtns"><button type="button" data-r="prev" aria-label="Iepriekšējā stacija" title="Iepriekšējā stacija">' + svg('prev') + '</button>' +
      '<button type="button" data-r="play" class="mk-cl-rplay" aria-label="Atskaņot"></button>' +
      '<button type="button" data-r="next" aria-label="Nākamā stacija" title="Nākamā stacija">' + svg('next') + '</button></div>' +
      '<div class="mk-cl-rmore"><button type="button" class="mk-cl-ropen" data-r="stations" title="Izvēlēties staciju">Stacijas</button>' +
      '<button type="button" class="mk-cl-ropen" data-r="open">Atvērt radio</button></div>';
    var doc = P.document, text = function (id) { var n = doc.getElementById(id); return n ? n.textContent.trim() : ''; };
    function paint() {
      var st = P.__mkRadioPlaybackState ? P.__mkRadioPlaybackState() : null, playing = !!st && !st.paused;
      var station = text('curStation'), track = [text('npArtist'), text('npTitle')].filter(Boolean).join(' – ');
      box.querySelector('.mk-cl-rnow b').textContent = station || 'Radio';
      box.querySelector('.mk-cl-rnow span').textContent = track || (playing ? 'Skan' : 'Nospied, lai klausītos');
      var play = box.querySelector('.mk-cl-rplay');
      play.innerHTML = svg(playing ? 'pause' : 'play');
      play.setAttribute('aria-label', playing ? 'Pauze' : 'Atskaņot');
      play.title = playing ? 'Pauze' : 'Atskaņot';
    }
    // the radio's scripts load on first use (as when its window is opened)
    function ready() { return Promise.resolve(typeof P.loadRadioScripts === 'function' ? P.loadRadioScripts() : true); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-r]'), what = b && b.dataset.r;
      if (!what) return;
      if (what === 'open') { var t = doc.getElementById('radioToggle'); if (t) t.click(); return; }
      ready().then(function () {
        if (what === 'play') doc.getElementById('playBtn').click();
        else if (what === 'stations') { if (typeof P.toggleMenu === 'function') P.toggleMenu(true); }   // the radio's own station list
        else if (typeof P.stepStation === 'function') P.stepStation(what === 'next' ? 1 : -1);
        setTimeout(paint, 60);
      }, function () {});
    });
    var mo = new MutationObserver(paint);
    ['curStation', 'npTitle', 'npArtist', 'playBtn'].forEach(function (id) { var n = doc.getElementById(id); if (n) mo.observe(n, { childList: true, characterData: true, subtree: true }); });
    paint();
    return { off: function () { mo.disconnect(); } };
  }

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
    centerMood = null; schedulePlace();   // the same picture stays; its face, row and chips are painted again
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
    // the card inherits its text from the list it stands in: the copy gets the real list's, not
    // this window's (the cards' own rules reach it as ".mk-acc #grafiks-list", see card-faces.css)
    var ls = getComputedStyle(list);
    ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'text-align', 'font-variant-numeric', '-webkit-font-smoothing'].forEach(function (k) { wrap.style.setProperty(k, ls.getPropertyValue(k)); });
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
