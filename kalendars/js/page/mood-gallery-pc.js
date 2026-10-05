(function MinkaGalleryPC() {
  'use strict';

  /* Vecais dators galerijā (mood-gallery-3d.js, priekšmets "oldpc"): Windows 98 darbvirsma
     vaporwave krāsās. Uz tās:
       Konfektes 98: trīs rindā (kā Candy Crush), dienas laukums visiem vienāds, 20 gājieni,
                      dienas rekordu tabula kolēģiem (minka-api /api/candy).
       Hronika.txt:  galerijas stāsts, katru dienu atveras nākamā nodaļa.
       Mans dators, Atkritumi: mazi joki. Katru dienu cits "Kļūda!" logs.
     Viss strādā tikai, kamēr logs atvērts; spēles kanvu pārzīmē tikai kustībā. */
  var START_DAY = '2026-10-03';                                     // the chronicle's first chapter
  var BEST_KEY = 'minkaCandyBestV1';
  var N = 8, CELL = 44, MOVES = 20;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rigaDay(ms) { return new Date((ms == null ? Date.now() : ms) + 3 * 3600000).toISOString().slice(0, 10); }
  function daysSince(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }
  function seedOf(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0 || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function api() {
    function ready(a) { return a && typeof a.apiFetch === 'function' && a.getToken && a.getToken(); }
    try { if (ready(window.MinkaApi)) return window.MinkaApi; } catch (_e) {}
    try { if (window.parent !== window && ready(window.parent.MinkaApi)) return window.parent.MinkaApi; } catch (_e) {}
    return null;
  }

  /* ── the chronicle: one chapter a day (no names, no patients) ── */
  var CHRONICLE = [
    ['1. Pagrabs', 'Šo datoru atradām pagrabā aiz vecajām kasetēm. Uz tā bija uzlīme: "NEIZSLĒGT. Nakts dežūrai." Kāds to bija atstājis ieslēgtu kopš 1998. gada. Monitors vēl silts.'],
    ['2. Divi kaķi', 'Pirmie, kas atnāca paskatīties, bija divi melni kaķi. Viens visu apšļaka ar smidzinātāju, ja kaut kas viņam nepatīk. Otrs nāca klibodams, bet nāca pirmais. Tā viņus arī nosauca: Špricētājs un Klibais.'],
    ['3. Löfbergs', 'Kafijas aparāts ir vecāks par datoru. Dienā tas ņurd un dod remdenu kafiju. Naktī, kad nodaļā kluss, tas pēkšņi gatavo labāko kapučīno pilsētā. Neviens nezina, kāpēc. Neviens arī nejautā.'],
    ['4. Mona Liza', 'Glezna pie sienas ir kopija. Vismaz tā visi saka. Bet ir pamanīts: kad pēc nakts maiņas kāds aiziet mājās nepateicis "ar labu nakti", viņas smaids rīt ir nedaudz šaurāks.'],
    ['5. Akvārijs', 'Zivtiņas akvārijā nekad neviens nav skaitījis vienādi. Kāds saka seši, kāds astoņi. Vienīgais, par ko visi vienojas: zelta zivtiņa pieceļas tieši tad, kad kāds iesaka tai pabarot.'],
    ['6. Statuja', 'Marmora statuja ar abiem kaķiem parādījās vienā rītā zāles vidū. Neviens to neatveda. Uz pamatnes iekalti vārdi. Klibais uz to skatās ilgi. Špricētājs to apšļaka. Abi izskatās apmierināti.'],
    ['7. Konfektes 98', 'Vienīgā spēle uz šī datora. Kāds radiogrāfs 1999. gadā tajā uzstādīja rekordu, kuru neviens nav pārspējis. Rekordu tabula bija izdzēsta. Palika tikai uzraksts: "Pārspēj mani nākamajā dežūrā."'],
    ['8. Zīmējumi', 'Sienas sākumā bija tukšas. Tad kāds uzzīmēja sirdi. Nākamajā naktī blakus parādījās roze. Tagad zāle aug līdzi zīmējumiem: katram jaunam rāmim vieta atrodas pati.'],
    ['9. Gramofons', 'Gramofons spēlē vienu plati. Mūzika ir tā pati, bet katram, kurš klausās, tā šķiet nedaudz cita. Klibais pie tās aizmieg. Špricētājs nekad.'],
    ['10. Monster', 'White Monster kaste stūrī nekad netukšojas. Paņem bundžu, un nākamreiz tā atkal ir pilna. Inventarizācijā kaste nav uzskaitīta. Labāk tā arī paliek.'],
    ['11. Gultas', 'Nakts istabā gultām uz kājgaļa ir vārdi. Tie mainās katru nakti paši. Kad visi guļ pēc plāna, lampiņas pie gultām deg mazliet siltāk.'],
    ['12. Desmitā medaļa', 'Medaļu ir desmit. Deviņas var atrast, staigājot. Desmitā ir tiem, kuri izstaigā visu zāli līdz galam un atpakaļ. Kāds saka, ka tur, zāles galā, ir vēl viena durvis. Neviens nav pārbaudījis.'],
    ['13. Uzlīme', 'Uzlīmei uz monitora otrā pusē bija vēl viens teikums: "Ja to lasi, tu esi nakts dežūras daļa. Uzzīmē kaut ko. Nākamais to ieraudzīs."'],
    ['14. Turpinājums', 'Hronika turpinās tur, kur to raksta paši dežūranti. Uzzīmē, iedzer kafiju, pabaro zivtiņas. Rīt šeit būs kas jauns.']
  ];
  var ERRORS = [
    ['Kļūda!', 'Kafija beigusies. Lūdzu, ievietojiet nākamo maiņu.'],
    ['Brīdinājums', 'Monster līmenis asinīs zems. Turpināt?'],
    ['Kļūda!', 'Kas ir realitātes būtība?'],
    ['Sistēma', 'Nakts dežūra ir sākusies. Izslēgt nav iespējams.'],
    ['Kļūda!', 'Kaķis uz tastatūras. Nospiediet jebkuru kaķi, lai turpinātu.'],
    ['Paziņojums', 'Šodien pārspēts nav neviens rekords. Vēl.'],
    ['Kļūda!', 'Klibais ir pārāk mīļš. Atmiņa pārpildīta.'],
    ['Brīdinājums', 'Špricētājs tuvojas. Saglabājiet darbu.'],
    ['Sistēma', 'Atrasts jauns zīmējums galerijā. Atvērt sirdi?'],
    ['Kļūda!', 'Pārāk daudz mīlestības pret Löfbergs. Restartējiet kafiju.']
  ];

  /* ── pixel icons for the desktop and the pieces ── */
  var iconCache = {};
  function pix(kind, n) {
    var key = kind + n;
    if (iconCache[key]) return iconCache[key];
    var c = canvas(32, 32), g = c.getContext('2d');
    var R = function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); };
    if (kind === 'candy') { R(10, 8, 12, 16, '#ff5fb0'); R(12, 10, 8, 12, '#ff9ad2'); R(4, 12, 6, 8, '#ffd84a'); R(22, 12, 6, 8, '#ffd84a'); R(13, 11, 3, 3, '#fff'); }
    else if (kind === 'note') { R(6, 3, 20, 26, '#000'); R(7, 4, 18, 24, '#fff'); for (var y = 9; y < 26; y += 4) R(10, y, 12, 1, '#6a6a9a'); R(7, 4, 18, 3, '#7a8cff'); }
    else if (kind === 'pc') { R(4, 3, 24, 18, '#000'); R(5, 4, 22, 16, '#d8cfb8'); R(7, 6, 18, 12, '#3a52a8'); R(12, 21, 8, 3, '#a89c80'); R(6, 24, 20, 5, '#d8cfb8'); R(6, 28, 20, 1, '#000'); }
    else if (kind === 'bin') { R(9, 8, 14, 20, '#000'); R(10, 9, 12, 18, '#cfd8ff'); for (var x = 12; x < 22; x += 3) R(x, 11, 1, 14, '#7a86c0'); R(8, 5, 16, 3, '#9aa6e0'); }
    else if (kind === 'mine') { R(9, 9, 14, 14, '#000'); R(7, 13, 18, 6, '#000'); R(13, 7, 6, 18, '#000'); R(15, 4, 2, 24, '#000'); R(4, 15, 24, 2, '#000'); R(11, 11, 4, 4, '#fff'); }
    else if (kind === 'music') { R(11, 5, 3, 18, '#2a1d48'); R(22, 3, 3, 18, '#2a1d48'); R(11, 3, 14, 4, '#2a1d48'); R(5, 19, 9, 7, '#ff5fb0'); R(16, 17, 9, 7, '#5aa8ff'); R(7, 20, 3, 2, '#ffc0d0'); R(18, 18, 3, 2, '#bfe0ff'); }
    else if (kind === 'gear') { R(12, 3, 8, 26, '#8f7ab8'); R(3, 12, 26, 8, '#8f7ab8'); R(6, 6, 20, 20, '#8f7ab8'); R(11, 11, 10, 10, '#d8c8f0'); R(14, 14, 4, 4, '#2a1d48'); }
    else if (kind === 'face' || kind === 'faceWin' || kind === 'faceDead' || kind === 'faceO') {                 // the minesweeper's face: a black cat
      R(6, 4, 4, 7, '#1d1a22'); R(22, 4, 4, 7, '#1d1a22'); R(6, 9, 20, 17, '#1d1a22'); R(4, 12, 24, 11, '#1d1a22');
      if (kind === 'faceWin') { R(8, 13, 7, 4, '#000'); R(17, 13, 7, 4, '#000'); R(9, 14, 2, 1, '#888'); R(18, 14, 2, 1, '#888'); R(15, 14, 2, 1, '#000'); }
      else if (kind === 'faceDead') { R(10, 13, 1, 1, '#d7dd55'); R(12, 15, 1, 1, '#d7dd55'); R(12, 13, 1, 1, '#d7dd55'); R(10, 15, 1, 1, '#d7dd55'); R(11, 14, 1, 1, '#d7dd55'); R(20, 13, 1, 1, '#d7dd55'); R(22, 15, 1, 1, '#d7dd55'); R(22, 13, 1, 1, '#d7dd55'); R(20, 15, 1, 1, '#d7dd55'); R(21, 14, 1, 1, '#d7dd55'); }
      else if (kind === 'faceO') { R(8, 12, 5, 5, '#d7dd55'); R(19, 12, 5, 5, '#d7dd55'); R(10, 14, 1, 1, '#000'); R(21, 14, 1, 1, '#000'); R(14, 21, 4, 3, '#000'); }   // pressing: eyes wide, an "o"
      else { R(9, 13, 4, 4, '#d7dd55'); R(19, 13, 4, 4, '#d7dd55'); R(10, 14, 2, 2, '#000'); R(20, 14, 2, 2, '#000'); }
      R(15, 19, 2, 2, '#ff8a9a');
    }
    else if (kind === 'pinball') { R(4, 4, 24, 24, '#000'); R(5, 5, 22, 22, '#0b1030'); R(9, 7, 1, 1, '#fff'); R(22, 9, 1, 1, '#fff'); R(14, 6, 1, 1, '#9fb0ff'); R(13, 11, 6, 6, '#c8ccd4'); R(14, 12, 2, 2, '#fff'); R(7, 22, 8, 3, '#ff8a1f'); R(17, 22, 8, 3, '#ff8a1f'); R(6, 21, 2, 2, '#ffd23f'); R(24, 21, 2, 2, '#ffd23f'); }
    else if (kind === 'trophy') { R(9, 4, 14, 10, '#ffcf3a'); R(11, 14, 10, 3, '#ffcf3a'); R(14, 17, 4, 5, '#d9a21a'); R(10, 22, 12, 4, '#d9a21a'); R(5, 5, 4, 6, '#ffcf3a'); R(23, 5, 4, 6, '#ffcf3a'); }
    var big = canvas(n, n), bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, n, n);
    return (iconCache[key] = big.toDataURL('image/png'));
  }
  /* 1-bit lettering: a word drawn small with the system font, its soft edges cut to on/off,
     an outline round it, kept; drawn at a whole multiple it is 90s bitmap type */
  var wordCache = {};
  function rgbOf(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function pixWord(text, col, outline) {
    var key = text + '|' + col + '|' + (outline || ''); if (wordCache[key]) return wordCache[key];
    var m = canvas(4, 4).getContext('2d'); m.font = '700 10px Tahoma, Verdana, sans-serif';
    var wd = Math.ceil(m.measureText(text).width) + 4, ht = 15, c = canvas(wd, ht), q = c.getContext('2d');
    q.font = m.font; q.textBaseline = 'top'; q.fillStyle = '#000'; q.fillText(text, 2, 2);
    var d = q.getImageData(0, 0, wd, ht), src = d.data, out = q.createImageData(wd, ht), o = out.data, ci = rgbOf(col), oi = outline ? rgbOf(outline) : null;
    var on = function (x, y) { return x >= 0 && y >= 0 && x < wd && y < ht && src[(y * wd + x) * 4 + 3] > 120; };
    for (var y = 0; y < ht; y++) for (var x = 0; x < wd; x++) {
      var i = (y * wd + x) * 4, use = on(x, y) ? ci : oi && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) ? oi : null;
      if (use) { o[i] = use[0]; o[i + 1] = use[1]; o[i + 2] = use[2]; o[i + 3] = 255; }
    }
    q.putImageData(out, 0, 0);
    if (Object.keys(wordCache).length > 80) wordCache = {};
    return (wordCache[key] = c);
  }
  function drawWord(g, text, col, outline, cx, cy, z) {           // centred, at a whole scale, on whole pixels
    var c = pixWord(text, col, outline), ww = c.width * z, hh = c.height * z;
    g.drawImage(c, Math.round(cx - ww / 2), Math.round(cy - hh / 2), ww, hh);
  }
  function pxLine(g, x0, y0, x1, y1, col, t) {                   // Bresenham, square pen
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); t = t || 1;
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    g.fillStyle = col;
    for (var guard = 0; guard < 4000; guard++) {
      g.fillRect(x0 - (t >> 1), y0 - (t >> 1), t, t);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  function dotted(g, x, y, w, h, col, phase) {                   // the Windows focus rectangle: 1 px dots
    g.fillStyle = col; phase = phase || 0;
    for (var i = phase; i < w; i += 2) { g.fillRect(x + i, y, 1, 1); g.fillRect(x + i, y + h - 1, 1, 1); }
    for (i = phase; i < h; i += 2) { g.fillRect(x, y + i, 1, 1); g.fillRect(x + w - 1, y + i, 1, 1); }
  }

  function img(kind, n) { return '<img class="pc98-pix" src="' + pix(kind, n) + '" width="' + n + '" height="' + n + '" alt="" draggable="false">'; }

  // the six pieces (16×16 pixel art, drawn crisp at the cell's size): coffee, Monster, cat, heart, star, pill
  var PIECES = [];
  function makePieces() {
    if (PIECES.length) return;
    var defs = [
      function (R) { R(4, 5, 8, 9, '#f5efe6'); R(5, 6, 6, 2, '#6b3d1e'); R(12, 7, 2, 4, '#f5efe6'); R(11, 8, 2, 2, '#c9a77a'); R(3, 14, 10, 1, '#c9a77a'); R(6, 2, 1, 2, '#ffffff'); R(9, 1, 1, 3, '#ffffff'); },   // coffee
      function (R) { R(5, 1, 6, 1, '#b0b6b0'); R(4, 2, 8, 13, '#eef0ee'); R(4, 14, 8, 1, '#b0b6b0'); R(5, 4, 1, 6, '#3a3f3a'); R(7, 4, 1, 6, '#3a3f3a'); R(9, 4, 1, 6, '#3a3f3a'); R(5, 4, 5, 1, '#3a3f3a'); R(5, 11, 6, 1, '#7fa0c8'); },   // Monster
      function (R) { R(3, 2, 2, 4, '#1d1a22'); R(11, 2, 2, 4, '#1d1a22'); R(3, 5, 10, 8, '#1d1a22'); R(2, 6, 12, 6, '#1d1a22'); R(5, 7, 2, 2, '#d7dd55'); R(9, 7, 2, 2, '#d7dd55'); R(7, 10, 2, 1, '#ff8a9a'); R(4, 13, 8, 1, '#1d1a22'); },   // cat
      function (R) { R(2, 4, 5, 5, '#ff4f7a'); R(9, 4, 5, 5, '#ff4f7a'); R(3, 3, 3, 1, '#ff4f7a'); R(10, 3, 3, 1, '#ff4f7a'); R(3, 9, 10, 2, '#ff4f7a'); R(4, 11, 8, 1, '#ff4f7a'); R(5, 12, 6, 1, '#ff4f7a'); R(6, 13, 4, 1, '#ff4f7a'); R(7, 14, 2, 1, '#ff4f7a'); R(4, 5, 2, 2, '#ffc0d0'); },   // heart
      function (R) { R(7, 1, 2, 3, '#ffd23f'); R(5, 4, 6, 2, '#ffd23f'); R(1, 6, 14, 2, '#ffd23f'); R(3, 8, 10, 2, '#ffd23f'); R(4, 10, 8, 2, '#ffd23f'); R(3, 12, 3, 2, '#ffd23f'); R(10, 12, 3, 2, '#ffd23f'); R(7, 5, 2, 2, '#fff3b0'); },   // star
      function (R) { R(3, 6, 5, 5, '#5aa8ff'); R(8, 6, 5, 5, '#f5f6ff'); R(4, 5, 4, 1, '#5aa8ff'); R(8, 5, 4, 1, '#f5f6ff'); R(4, 11, 4, 1, '#5aa8ff'); R(8, 11, 4, 1, '#f5f6ff'); R(4, 7, 2, 1, '#bfe0ff'); }   // pill
    ];
    defs.forEach(function (d) {
      var c = canvas(16, 16), g = c.getContext('2d');
      d(function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); });
      PIECES.push(c);
    });
  }

  /* ── sounds: short and dry ── */
  var actx = null;
  function blip(freq, dur, type, vol) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
      g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (_e) {}
  }

  var openNow = null;
  function open(opts) {
    opts = opts || {};
    if (openNow) return openNow;
    makePieces();
    var today = rigaDay(), me = opts.me || {};
    var root = el('div', 'pc98-root');
    root.innerHTML = '<div class="pc98-desk"></div><div class="pc98-wins"></div>'
      + '<div class="pc98-taskbar"><button type="button" class="pc98-start"><span class="pc98-flag"></span><b>Sākt</b></button><span class="pc98-sep"></span><div class="pc98-tasks"></div><span class="pc98-tray"><span class="pc98-clock"></span></span></div>'
      + '<div class="pc98-startmenu" hidden><span class="pc98-band"><b>Windows</b>98</span><div class="pc98-items">'
      + '<button type="button" data-open="candy">' + img('candy', 24) + '<span>Konfektes 98</span></button>'
      + '<button type="button" data-open="mines">' + img('mine', 24) + '<span>Mīnas 98</span></button>'
      + '<button type="button" data-open="pinball">' + img('pinball', 24) + '<span>Pinbols 98</span></button>'
      + '<button type="button" data-open="music">' + img('music', 24) + '<span>Mūzika 98</span></button>'
      + '<button type="button" data-open="chronicle">' + img('note', 24) + '<span>Hronika.txt</span></button>'
      + '<button type="button" data-open="settings">' + img('gear', 24) + '<span>Iestatījumi</span></button>'
      + '<button type="button" data-open="mypc">' + img('pc', 24) + '<span>Mans dators</span></button><hr>'
      + '<button type="button" data-act="off">' + img('pc', 24) + '<span>Izslēgt datoru…</span></button></div></div>'
      + '<div class="pc98-boot"><b>Windows 98</b><span>Startē…</span></div>';
    if (opts.solo) root.classList.add('pc98-solo');
    document.body.appendChild(root);
    var $ = function (s) { return root.querySelector(s); };
    var WALL_KEY = 'minkaPC98Wall';
    try { root.dataset.wall = localStorage.getItem(WALL_KEY) || 'teal'; } catch (_e) { root.dataset.wall = 'teal'; }   // the classic 98 teal first
    if (window.MinkaGallery3D && window.MinkaGallery3D.pause) window.MinkaGallery3D.pause(true);
    // a clicked button gives its focus back: otherwise Space (the pinball's plunger, or just a key)
    // pressed it again and "Jauna spēle" or the cat's face restarted the game
    var inDialog = function (el) { var wnd = el.closest('.pc98-win'); return !!(wnd && wnd.querySelector('.pc98-dlg')); };
    root.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && !inDialog(b)) setTimeout(function () { b.blur(); }, 0); }, true);

    // the desktop's icons
    var desk = $('.pc98-desk');
    [['candy', 'candy', 'Konfektes 98'], ['mines', 'mine', 'Mīnas 98'], ['pinball', 'pinball', 'Pinbols 98'], ['music', 'music', 'Mūzika 98'], ['chronicle', 'note', 'Hronika.txt'], ['mypc', 'pc', 'Mans dators'], ['settings', 'gear', 'Iestatījumi'], ['bin', 'bin', 'Atkritumi']].forEach(function (d) {
      var b = el('button', 'pc98-icon', img(d[1], 32) + '<span>' + d[2] + '</span>'); b.type = 'button'; b.dataset.open = d[0]; desk.appendChild(b);
    });

    /* windows: draggable, a taskbar button each, the one in front blue */
    var wins = {}, z = 10;
    function front(id) {
      Object.keys(wins).forEach(function (k) { var w = wins[k]; w.el.classList.toggle('is-off', k !== id); w.task.classList.toggle('is-on', k === id); });
      if (wins[id]) wins[id].el.style.zIndex = ++z;
    }
    function win(id, title, icon, body, w, x, y) {
      if (wins[id]) { front(id); return wins[id]; }
      var e = el('section', 'pc98-win');
      e.innerHTML = '<header class="pc98-tb">' + img(icon, 16) + '<b>' + esc(title) + '</b><button type="button" class="pc98-mx" aria-label="Maksimizēt"></button><button type="button" class="pc98-x" aria-label="Aizvērt"></button></header><div class="pc98-body">' + body + '</div>';
      var r = root.getBoundingClientRect();
      e.style.width = Math.min(w, r.width - 16) + 'px';
      e.style.left = Math.max(6, Math.min(r.width - Math.min(w, r.width - 16) - 6, x)) + 'px'; e.style.top = Math.max(6, y) + 'px';
      $('.pc98-wins').appendChild(e);
      var t = el('button', 'pc98-task', img(icon, 16) + '<span>' + esc(title) + '</span>'); t.type = 'button'; $('.pc98-tasks').appendChild(t);
      var o = wins[id] = { el: e, task: t };
      t.addEventListener('click', function () { front(id); });
      e.addEventListener('pointerdown', function () { front(id); }, true);
      e.querySelector('.pc98-x').addEventListener('click', function () { closeWin(id); });
      var tb = e.querySelector('.pc98-tb'), at = null;
      tb.addEventListener('pointerdown', function (ev) { if (ev.target.closest('button')) return; tb.setPointerCapture(ev.pointerId); at = [ev.clientX - e.offsetLeft, ev.clientY - e.offsetTop]; });
      tb.addEventListener('pointermove', function (ev) { if (!at) return; var rr = root.getBoundingClientRect(); e.style.left = Math.max(-e.offsetWidth + 60, Math.min(rr.width - 60, ev.clientX - at[0])) + 'px'; e.style.top = Math.max(0, Math.min(rr.height - 60, ev.clientY - at[1])) + 'px'; });
      tb.addEventListener('pointerup', function () { at = null; });
      var maxi = function () { e.classList.toggle('is-max'); if (o.onResize) o.onResize(); };
      e.querySelector('.pc98-mx').addEventListener('click', maxi);
      tb.addEventListener('dblclick', function (ev) { if (!ev.target.closest('button')) maxi(); });
      front(id);
      return o;
    }
    function closeWin(id) {
      var w = wins[id]; if (!w) return;
      if (w.onClose) w.onClose();
      w.el.remove(); w.task.remove(); delete wins[id];
      if (opts.solo && id === opts.app) { close(); return; }        // from the arcade: the game is all there is
      var rest = Object.keys(wins); if (rest.length) front(rest[rest.length - 1]);
    }
    function dialog(title, text, icon) {
      var id = 'dlg' + (++z);
      var r = root.getBoundingClientRect();                         // in the middle, a little lower each time
      var w = win(id, title, 'pc', '<div class="pc98-dlg"><i class="pc98-dlg-ico is-' + (icon || 'err') + '"></i><p>' + esc(text) + '</p></div><div class="pc98-btns"><button type="button" class="pc98-btn is-default">Labi</button></div>', 330, (r.width - 330) / 2 + (z % 4) * 18, r.height * 0.32 + (z % 4) * 18);
      w.el.querySelector('.pc98-btn').addEventListener('click', function () { closeWin(id); });
      w.el.querySelector('.pc98-btn').focus();
      return w;
    }

    /* Hronika.txt: the chapters opened so far, today's last */
    function chronicle() {
      var n = Math.max(1, Math.min(CHRONICLE.length, daysSince(START_DAY, today) + 1));
      var text = CHRONICLE.slice(0, n).map(function (c) { return '<h3>' + esc(c[0]) + '</h3><p>' + esc(c[1]) + '</p>'; }).join('')
        + (n < CHRONICLE.length ? '<p class="pc98-next">Nākamā nodaļa: rīt.</p>' : '');
      var w = win('chronicle', 'Hronika.txt - Notepad', 'note', '<nav class="pc98-menu"><u>F</u>ails <u>L</u>abot <u>M</u>eklēt <u>P</u>alīdzība</nav><div class="pc98-note">' + text + '</div>', 440, 110, 40);
      var box = w.el.querySelector('.pc98-note'); box.scrollTop = box.scrollHeight;
    }
    function mypc() {
      dialog('Mans dators', 'Windows 98. Pentium II 300 MHz, 64 MB RAM, 2 kaķi. Darbojas kopš 1998. gada nakts dežūras. Uz cietā diska: Konfektes 98 un viena hronika.', 'info');
    }
    function bin() { dialog('Atkritumi', 'Atkritumi ir tukši. Kā vienmēr pēc nakts dežūras.', 'info'); }

    /* ── Konfektes 98 (match-3), built on the puzzle skill's rules: the board is the truth and the
       picture only plays out what resolution did; resolve until stable; input locked meanwhile;
       a seeded refill (the day's board); deadlock → reshuffle. Juice in three tiers (game-feel):
       small (3 in a row): sparks, a soft pop, the points rising; medium (a special made, a chain):
       a little shake, more sparks; large (a blast, a bomb, a combo): a flash, a short hit-stop,
       a beam across the board, a word. Hints when idle; tips the first times. ── */
    var PCOL = ['#c9a77a', '#c8ccc8', '#3a3346', '#ff4f7a', '#ffd23f', '#5aa8ff'];
    var PNAME = ['kafijas', 'Monster', 'kaķu', 'siržu', 'zvaigžņu', 'tablešu'];
    var WORDS = ['Lieliski!', 'Super!', 'Fantastiski!', 'Neticami!'];
    // "Dienas maiņa": the board is the day's for everyone; each weekday changes one rule
    var CANDY_RULES = {
      1: ['Pirmdiena', 'parasta maiņa', {}], 2: ['Otrdiena', 'kafijas diena: mērķis ir kafija', { goal: 0 }],
      3: ['Trešdiena', 'ātrā maiņa: 15 gājieni', { moves: 15 }], 4: ['Ceturtdiena', 'želejas diena', { jelly: 2 }],
      5: ['Piektdiena', 'biežāk zelta krūzītes', { gold: 3 }], 6: ['Sestdiena', 'brīvdiena: 25 gājieni', { moves: 25 }], 0: ['Svētdiena', 'brīvdiena: 25 gājieni', { moves: 25 }]
    };
    var CANDY_WEEK_KEY = 'minkaCandyWeekV1';
    function candy() {
      if (wins.candy) { front('candy'); return; }
      var rr0 = root.getBoundingClientRect();
      CELL = Math.max(36, Math.min(80, Math.floor(Math.min(rr0.width - 60, rr0.height - 236) / N)));
      var size = N * CELL;
      var w = win('candy', 'Konfektes 98', 'candy',
        '<div class="pc98-candy"><div class="pc98-cbar"><span>Punkti <b class="pc98-score">0</b></span><span>Gājieni <b class="pc98-moves">' + MOVES + '</b></span>'
        + '<span class="pc98-goal" title="Dienas mērķis"><i class="pc98-gico"></i><b class="pc98-gnum">0/0</b></span><span class="pc98-jelly" title="Želeja"><i class="pc98-jico"></i><b class="pc98-jnum">0</b></span></div>'
        + '<div class="pc98-stars"><i class="pc98-sfill"></i><b data-s="0">★</b><b data-s="1">★</b><b data-s="2">★</b></div>'
        + '<div class="pc98-well"><canvas class="pc98-board" width="' + size + '" height="' + size + '"></canvas></div>'
        + '<div class="pc98-cfoot"><button type="button" class="pc98-btn" data-c="new">Jauna spēle</button><button type="button" class="pc98-btn" data-c="table">Dienas tabula</button><button type="button" class="pc98-btn" data-c="help">Kā spēlēt?</button><button type="button" class="pc98-btn pc98-mbtn" data-c="music" title="Mūzika">♪</button></div><div class="pc98-cstat"><span class="pc98-crule"></span><span class="pc98-week" title="Šīs nedēļas zvaigznes"></span><span>Rekords šodien: <b class="pc98-best">0</b></span></div></div>',
        size + 34, Math.max(100, (rr0.width - size - 34) / 2), Math.max(6, (rr0.height - size - 216) / 2));
      var cv = w.el.querySelector('.pc98-board'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      var G = {}, anim = [], fx = { parts: [], floats: [], beams: [], rings: [], bubbles: [], pix: [], chunks: [], fly: [], stamp: null, flash: 0, shake: 0, word: null, stopUntil: 0 }, raf = 0, busy = false, sel = null, drag = null, hov = null;
      var hint = null, idleAt = performance.now(), swapOff = null;
      var best = 0; try { var b0 = JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); best = b0.day === today ? b0.score : 0; } catch (_e) {}
      w.el.querySelector('.pc98-best').textContent = best;
      function newGame() {
        var r = rng(seedOf('candy:' + today));
        var rule = CANDY_RULES[new Date(today + 'T12:00:00Z').getUTCDay()], rx = rule[2];
        G = { rnd: r, board: [], score: 0, moves: rx.moves || MOVES, over: false, chain: 0, goal: { t: 0, need: 24, got: 0, done: false }, stars: 0, rule: rx };
        w.el.querySelector('.pc98-crule').textContent = rule[0] + ': ' + rule[1];
        // the day's jelly: a mirrored patch under the pieces; matching on it clears it (+2000 for all)
        var jr = rng(seedOf('jelly:' + today)); G.jelly = []; G.jellyLeft = 0; G.jellyDone = false;
        for (var jy = 0; jy < N; jy++) { G.jelly.push([]); for (var jx = 0; jx < N; jx++) G.jelly[jy].push(0); }
        for (jy = 1; jy < N - 1; jy++) for (jx = 0; jx < N / 2; jx++) if (jr() < (jy > 2 && jy < 6 ? 0.55 : 0.25) * (rx.jelly || 1)) { G.jelly[jy][jx] = G.jelly[jy][N - 1 - jx] = 1; }
        G.jelly.forEach(function (row) { row.forEach(function (v) { G.jellyLeft += v; }); });
        for (var y = 0; y < N; y++) { G.board.push([]); for (var x = 0; x < N; x++) G.board[y].push(fresh(x, y, true)); }
        if (!hasMove()) shuffle();
        // the goal: the day's rule, else the piece the board has least of (so it takes aiming)
        if (rx.goal != null) G.goal.t = rx.goal;
        else { var cnt = [0, 0, 0, 0, 0, 0]; G.board.forEach(function (row) { row.forEach(function (c) { if (c.t >= 0) cnt[c.t]++; }); }); G.goal.t = cnt.indexOf(Math.min.apply(null, cnt)); }
        paintWeek();
        fx.parts = []; fx.floats = []; fx.beams = []; fx.rings = []; fx.bubbles = []; fx.pix = []; fx.chunks = []; fx.fly = []; fx.stamp = null; fx.word = null; hint = null; idleAt = performance.now();
        w.el.querySelector('.pc98-gico').style.backgroundImage = 'url(' + PIECES[G.goal.t].toDataURL() + ')';
        paintBar(); draw();
      }
      function fresh(x, y, noMatch) {
        var t, guard = 0;
        do { t = (G.rnd() * 6) | 0; guard++; } while (noMatch && guard < 20 && ((x >= 2 && G.board[y][x - 1].t === t && G.board[y][x - 2].t === t) || (y >= 2 && G.board[y - 1][x].t === t && G.board[y - 2][x].t === t)));
        var c = { t: t, s: '', dy: 0, k: 1, a: 1, sq: 0 };
        if (!noMatch && G.rnd() < 0.022 * ((G.rule && G.rule.gold) || 1)) c.gold = true;   // now and then a golden cup (+2 moves)
        return c;
      }
      function paintBar() {
        w.el.querySelector('.pc98-score').textContent = G.score;
        var mv = w.el.querySelector('.pc98-moves'); mv.textContent = G.moves; mv.classList.toggle('is-low', G.moves <= 5);
        w.el.querySelector('.pc98-gnum').textContent = Math.min(G.goal.got, G.goal.need) + '/' + G.goal.need;
        w.el.querySelector('.pc98-goal').classList.toggle('is-done', G.goal.done);
        w.el.querySelector('.pc98-jnum').textContent = G.jellyLeft;
        w.el.querySelector('.pc98-jelly').classList.toggle('is-done', G.jellyDone);
        // three stars, as Candy Crush: 1500, 3000, 5000
        var STAR = [1500, 3000, 5000], got = STAR.filter(function (v) { return G.score >= v; }).length;
        w.el.querySelector('.pc98-sfill').style.width = Math.min(100, G.score / STAR[2] * 100) + '%';
        w.el.querySelectorAll('.pc98-stars b').forEach(function (b, i) { b.classList.toggle('is-on', i < got); });
        if (got > G.stars) { G.stars = got; blip(988 + got * 120, 0.12, 'triangle', 0.05); setTimeout(function () { blip(1318 + got * 120, 0.14, 'triangle', 0.045); }, 90); saveWeek(got); }
      }
      // the week: seven boxes, Monday first, each with the stars that day earned on this computer
      function weekStore() { try { return JSON.parse(localStorage.getItem(CANDY_WEEK_KEY) || '{}') || {}; } catch (_e) { return {}; } }
      function saveWeek(n) { var st = weekStore(); if ((st[today] || 0) >= n) return; st[today] = n; var keys = Object.keys(st).sort(); while (keys.length > 21) delete st[keys.shift()]; try { localStorage.setItem(CANDY_WEEK_KEY, JSON.stringify(st)); } catch (_e) {} paintWeek(); }
      function paintWeek() {
        var st = weekStore(), d = new Date(today + 'T12:00:00Z'), dow = (d.getUTCDay() + 6) % 7, html = '', L = ['P', 'O', 'T', 'C', 'P', 'S', 'S'];
        d.setUTCDate(d.getUTCDate() - dow);
        for (var i = 0; i < 7; i++) { var key = d.toISOString().slice(0, 10), n = st[key] || 0; html += '<i data-n="' + n + '"' + (i === dow ? ' class="is-today"' : '') + '><b>' + L[i] + '</b>' + '★★★'.slice(0, n) + '</i>'; d.setUTCDate(d.getUTCDate() + 1); }
        w.el.querySelector('.pc98-week').innerHTML = html;
      }
      var at = function (x, y) { return x >= 0 && y >= 0 && x < N && y < N ? G.board[y][x] : null; };
      function runs() {
        var out = [];
        for (var y = 0; y < N; y++) for (var x = 0; x < N;) { var t = G.board[y][x].t, e = x + 1; while (t >= 0 && e < N && G.board[y][e].t === t) e++; if (t >= 0 && e - x >= 3) out.push({ t: t, dir: 'h', cells: seq(x, e).map(function (i) { return [i, y]; }) }); x = e; }
        for (x = 0; x < N; x++) for (y = 0; y < N;) { var t2 = G.board[y][x].t, e2 = y + 1; while (t2 >= 0 && e2 < N && G.board[e2][x].t === t2) e2++; if (t2 >= 0 && e2 - y >= 3) out.push({ t: t2, dir: 'v', cells: seq(y, e2).map(function (i) { return [x, i]; }) }); y = e2; }
        return out;
      }
      function seq(a, b) { var r = []; for (var i = a; i < b; i++) r.push(i); return r; }
      function swapIn(x1, y1, x2, y2) { var t = G.board[y1][x1]; G.board[y1][x1] = G.board[y2][x2]; G.board[y2][x2] = t; }
      function special(c) { return c && (c.s || c.t < 0); }
      // how good a swap is (for the hint): matched pieces, more for specials made or used
      function swapValue(x1, y1, x2, y2) {
        var A = G.board[y1][x1], B = G.board[y2][x2];
        if (special(A) && special(B)) return 60;
        if (A.t < 0 || B.t < 0) return 40;
        swapIn(x1, y1, x2, y2);
        var rs = runs(), v = 0;
        rs.forEach(function (r) { v += r.cells.length + (r.cells.length >= 5 ? 20 : r.cells.length === 4 ? 8 : 0); });
        if (rs.length > 1) v += 6;
        swapIn(x1, y1, x2, y2);
        return v;
      }
      function bestMove() {
        var bestV = 0, mv = null;
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) [[1, 0], [0, 1]].forEach(function (d) {
          var nx = x + d[0], ny = y + d[1]; if (nx >= N || ny >= N) return;
          var v = swapValue(x, y, nx, ny); if (v > bestV) { bestV = v; mv = [x, y, nx, ny]; }
        });
        return mv;
      }
      function hasMove() { return !!bestMove(); }
      function shuffle() {
        var guard = 0;
        do {
          var all = []; G.board.forEach(function (r) { r.forEach(function (c) { all.push(c); }); });
          for (var i = all.length - 1; i > 0; i--) { var j = (G.rnd() * (i + 1)) | 0, tmp = all[i]; all[i] = all[j]; all[j] = tmp; }
          for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) G.board[y][x] = all[y * N + x];
        } while ((runs().length || !hasMove()) && ++guard < 80);
      }

      /* ── a move ── */
      function trySwap(x1, y1, x2, y2) {
        if (busy || G.over) return;
        hint = null; idleAt = performance.now();
        var A = G.board[y1][x1], B = G.board[y2][x2];
        var combo = (special(A) && special(B)) || A.t < 0 || B.t < 0;
        swapIn(x1, y1, x2, y2);
        if (!combo && !runs().length) {                              // no match: they go there and come back
          swapIn(x1, y1, x2, y2); blip(140, 0.08, 'square', 0.03);
          var bo = { x1: x1, y1: y1, x2: x2, y2: y2, k: 0 }; busy = true;   // input locked while it bounces back
          tween(170, function (k) { bo.k = Math.sin(k * Math.PI) * 0.45; swapOff = bo; }, function () { if (swapOff === bo) swapOff = null; busy = false; });
          return;
        }
        G.moves--; G.chain = 0; paintBar(); busy = true;
        pixelTada((x1 + x2) / 2, (y1 + y2) / 2);
        var so = swapOff = { x1: x2, y1: y2, x2: x1, y2: y1, k: 1 };
        tween(130, function (k) { so.k = 1 - k; swapOff = so; }, function () {
          if (swapOff === so) swapOff = null;
          if (combo) comboBlast(x2, y2, x1, y1); else resolve([x2, y2]);
        });
      }
      // two specials (or the bomb with anything) swapped: their combined effect at once
      function comboBlast(xa, ya, xb, yb) {
        var A = G.board[ya][xa], B = G.board[yb][xb], kill = [], fxs = [];
        var line = function (c) { return c && (c.s === 'h' || c.s === 'v'); };
        var addRow = function (y) { for (var x = 0; x < N; x++) kill.push([x, y]); fxs.push({ beam: 'row', i: y }); };
        var addCol = function (x) { for (var y = 0; y < N; y++) kill.push([x, y]); fxs.push({ beam: 'col', i: x }); };
        var box = function (cx, cy, r) { for (var y = cy - r; y <= cy + r; y++) for (var x = cx - r; x <= cx + r; x++) if (at(x, y)) kill.push([x, y]); fxs.push({ ring: [cx, cy, r] }); };
        G.chain = 1;
        if (A.t < 0 && B.t < 0) { for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) kill.push([x, y]); fxs.push({ ring: [xa, ya, 8] }); word(3); }
        else if (A.t < 0 || B.t < 0) {
          var bomb = A.t < 0 ? A : B, other = A.t < 0 ? B : A, col = other.t, bx = A.t < 0 ? xa : xb, by = A.t < 0 ? ya : yb;
          kill.push([bx, by]);
          for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) {
            var c = G.board[yy][xx]; if (c.t !== col) continue;
            if (other.s && c !== other) c.s = other.s === 'w' ? 'w' : (G.rnd() < 0.5 ? 'h' : 'v');   // the bomb makes them all special first
            kill.push([xx, yy]); fxs.push({ zap: [bx, by, xx, yy] });
          }
          word(other.s ? 3 : 2);
        } else if (line(A) && line(B)) { addRow(ya); addCol(xa); word(2); }
        else if ((line(A) && B.s === 'w') || (line(B) && A.s === 'w')) { for (var d = -1; d <= 1; d++) { addRow(ya + d < 0 || ya + d >= N ? ya : ya + d); addCol(xa + d < 0 || xa + d >= N ? xa : xa + d); } word(3); }
        else if (A.s === 'w' && B.s === 'w') { box(xa, ya, 2); word(3); }
        else { resolve([xa, ya]); return; }
        A.spent = B.spent = true;                                    // their power is spent in the combo
        clearCells(kill, null, fxs, 'large', function () { resolve(null); });
      }
      // resolve until stable: find runs, make specials, clear (specials set each other off), fall, again
      function resolve(made) {
        var rs = runs();
        if (!rs.length) { busy = false; afterMove(); return; }
        G.chain++;
        var kill = [], spawn = [], used = {};
        rs.forEach(function (r) { r.cells.forEach(function (c) { kill.push(c); }); });
        // L / T: a horizontal and a vertical run of one colour crossing → a coffee blast at the crossing
        rs.forEach(function (h) {
          if (h.dir !== 'h') return;
          rs.forEach(function (v) {
            if (v.dir !== 'v' || v.t !== h.t) return;
            var cross = h.cells.find(function (a) { return v.cells.some(function (b) { return a[0] === b[0] && a[1] === b[1]; }); });
            if (cross && !used[h.cells[0] + ''] && !used[v.cells[0] + '']) { used[h.cells[0] + ''] = used[v.cells[0] + ''] = 1; spawn.push({ at: cross, t: h.t, s: 'w' }); }
          });
        });
        rs.forEach(function (r) {
          if (used[r.cells[0] + ''] || r.cells.length < 4) return;
          var p = r.cells.find(function (c) { return made && c[0] === made[0] && c[1] === made[1]; }) || r.cells[(r.cells.length / 2) | 0];
          spawn.push({ at: p, t: r.cells.length >= 5 ? -1 : r.t, s: r.cells.length >= 5 ? 'b' : r.dir });
        });
        var tier = spawn.length || G.chain >= 3 ? (spawn.some(function (s) { return s.s === 'b'; }) || G.chain >= 4 ? 'large' : 'medium') : G.chain >= 2 ? 'medium' : 'small';
        if (G.chain >= 3) word(Math.min(3, G.chain - 2));
        if (G.chain >= 2) {                                           // a cascade: "x2", "x3" stamped where it fell, rising in pitch
          var sx = 0, sy = 0; kill.forEach(function (c) { sx += c[0]; sy += c[1]; });
          fx.stamp = { t: 'x' + G.chain, x: (sx / kill.length + 0.5) * CELL, y: (sy / kill.length + 0.5) * CELL, life: 0.4 };
          blip(420 + G.chain * 140, 0.05, 'square', 0.035); if (G.chain >= 3) fx.shake = Math.max(fx.shake, 0.45);
        }
        clearCells(kill, spawn, [], tier, function () { resolve(null); });
      }
      // clear these cells; a special among them goes off and takes its line / box / colour with it
      function clearCells(list, spawn, fxs, tier, done) {
        var seen = {}, cells = [], spawnAt = {}, goldGot = 0;
        (spawn || []).forEach(function (s) { spawnAt[s.at[0] + ',' + s.at[1]] = s; });
        function add(x, y) {
          var key = x + ',' + y, c = at(x, y); if (!c || seen[key]) return; seen[key] = 1;
          cells.push([x, y]);
          if (spawnAt[key] || c.spent) return;                       // a new special born here stays; a spent one does nothing more
          if (c.gold) goldGot++;
          if (c.s === 'h') { fxs.push({ beam: 'row', i: y }); for (var i = 0; i < N; i++) add(i, y); tier = 'large'; }
          else if (c.s === 'v') { fxs.push({ beam: 'col', i: x }); for (var j = 0; j < N; j++) add(x, j); tier = 'large'; }
          else if (c.s === 'w') { fxs.push({ ring: [x, y, 1] }); for (var yy = y - 1; yy <= y + 1; yy++) for (var xx = x - 1; xx <= x + 1; xx++) add(xx, yy); tier = 'large'; }
          else if (c.t < 0) {                                        // a bomb set off by others: the most common colour
            var count = [0, 0, 0, 0, 0, 0]; G.board.forEach(function (r) { r.forEach(function (q) { if (q.t >= 0) count[q.t]++; }); });
            var col = count.indexOf(Math.max.apply(null, count));
            for (var by = 0; by < N; by++) for (var bx = 0; bx < N; bx++) if (G.board[by][bx].t === col) { fxs.push({ zap: [x, y, bx, by] }); add(bx, by); }
            tier = 'large';
          }
        }
        list.forEach(function (c) { add(c[0], c[1]); });
        var chain = Math.max(1, G.chain), gain = 0;
        cells.forEach(function (c) {
          if (G.jelly[c[1]][c[0]]) { G.jelly[c[1]][c[0]] = 0; G.jellyLeft--; gain += 50; jellyBreak(c[0], c[1]); }
          var p = G.board[c[1]][c[0]];
          if (!spawnAt[c[0] + ',' + c[1]] && p.t === G.goal.t) { G.goal.got++; if (fx.fly.length < 4) fx.fly.push({ t: p.t, x: c[0], y: c[1], age: 0 }); }
          gain += 10 * chain;
        });
        gain += (spawn || []).length * 60;
        G.score += gain;
        if (!G.goal.done && G.goal.got >= G.goal.need) { G.goal.done = true; G.score += 1000; floatText(N / 2 - 0.5, N / 2, '+1000', '#1db954', 1.8); blip(784, 0.14, 'triangle', 0.06); setTimeout(function () { blip(1046, 0.2, 'triangle', 0.06); }, 120); }
        if (!G.jellyDone && G.jellyLeft === 0) { G.jellyDone = true; G.score += 2000; floatText(N / 2 - 0.5, N / 2 + 1, '+2000', '#ff5fb0', 1.8); fx.word = { text: 'Visa želeja!', life: 1 }; blip(660, 0.15, 'triangle', 0.06); setTimeout(function () { blip(990, 0.2, 'triangle', 0.06); }, 130); }
        if (goldGot) { G.moves += goldGot * 2; floatText(cells[0][0], cells[0][1], '+' + (goldGot * 2), '#ffcf3a', 1.5); blip(1200, 0.12, 'triangle', 0.05); }
        paintBar();
        // the feedback, by tier
        var cx = 0, cy = 0; cells.forEach(function (c) { cx += c[0]; cy += c[1]; }); cx /= cells.length; cy /= cells.length;
        cells.forEach(function (c) {
          var p = G.board[c[1]][c[0]];
          burst(c[0], c[1], p.t < 0 ? '#b07ae0' : PCOL[p.t], tier === 'small' ? 5 : tier === 'medium' ? 7 : 9);
          fx.bubbles.push({ x: c[0], y: c[1], n: 10 * chain, life: 1 });       // a white glow with the piece's points in it
        });
        fxs.forEach(function (f) { if (f.beam) fx.beams.push({ kind: f.beam, i: f.i, life: 1 }); if (f.ring) fx.rings.push({ x: f.ring[0], y: f.ring[1], r: f.ring[2], life: 1 }); if (f.zap) fx.beams.push({ kind: 'zap', p: f.zap, life: 1 }); });
        if (tier === 'medium') fx.shake = Math.max(fx.shake, 0.35);
        if (tier === 'large') { fx.shake = Math.max(fx.shake, 0.8); fx.flash = 0.5; fx.stopUntil = performance.now() + 70; }
        var base = [523, 587, 659, 784, 880, 1046][Math.min(5, chain - 1)];
        blip(base, 0.09, 'triangle', 0.05);
        if (tier === 'large') { blip(110, 0.25, 'sawtooth', 0.05); setTimeout(function () { blip(base * 1.5, 0.12, 'square', 0.035); }, 60); }
        // the pieces swell and fade, the specials born pop in with an overshoot
        tween(tier === 'small' ? 150 : 190, function (k) {
          cells.forEach(function (c) { var p = G.board[c[1]][c[0]]; if (!spawnAt[c[0] + ',' + c[1]]) { p.k = 1 + k * 0.4; p.a = 1 - k; } });
        }, function () {
          cells.forEach(function (c) {
            var s = spawnAt[c[0] + ',' + c[1]];
            G.board[c[1]][c[0]] = s ? { t: s.t, s: s.s === 'b' ? '' : s.s, dy: 0, k: 0.2, a: 1, sq: 0, born: true } : null;
            if (s && s.s === 'b') G.board[c[1]][c[0]].t = -1;
          });
          var born = [];
          G.board.forEach(function (r) { r.forEach(function (p) { if (p && p.born) { born.push(p); p.born = false; } }); });
          if (born.length) tween(260, function (k) { born.forEach(function (p) { p.k = backOut(k); }); }, null);
          fall(done);
        });
      }
      function backOut(k) { var s = 1.70158; k -= 1; return k * k * ((s + 1) * k + s) + 1; }
      function fall(done) {
        var maxD = 0, moved = [];
        for (var x = 0; x < N; x++) {
          var write = N - 1;
          for (var y = N - 1; y >= 0; y--) if (G.board[y][x]) { var c = G.board[y][x]; if (write !== y) { c.dy = -(write - y); G.board[write][x] = c; G.board[y][x] = null; maxD = Math.max(maxD, write - y); moved.push(c); } write--; }
          for (var ny = write; ny >= 0; ny--) { var f = fresh(x, ny, false); f.dy = -(write + 1); G.board[ny][x] = f; maxD = Math.max(maxD, write + 1); moved.push(f); }
        }
        var start = moved.map(function (c) { return c.dy; });
        tween(120 + maxD * 50, function (k) {
          var e = k * k;                                             // falls under gravity, then lands
          moved.forEach(function (c, i) { c.dy = start[i] * (1 - e); });
        }, function () {
          moved.forEach(function (c) { c.dy = 0; c.sq = 1; });       // squash on landing, then spring back
          tween(160, function (k) { moved.forEach(function (c) { c.sq = 1 - k; }); }, null);
          blip(260, 0.04, 'square', 0.025);
          done();
        });
      }
      function afterMove() {
        if (!hasMove()) { shuffle(); fx.flash = 0.4; kick(); }
        if (G.moves <= 0) finale();
      }
      // "Saldais finālis": the moves are spent; every special still on the board goes off for a bonus
      function finale() {
        var left = [];
        G.board.forEach(function (r, y) { r.forEach(function (c, x) { if (special(c)) left.push([x, y]); }); });
        if (!left.length) { gameOver(); return; }
        busy = true; word(-1);
        G.chain = 2;
        clearCells(left, null, [], 'large', function () { busy = true; var rs = runs(); if (rs.length) resolve(null); else { busy = false; gameOver(); } });
      }
      function gameOver() {
        G.over = true; hint = null;
        if (G.score > best) { best = G.score; try { localStorage.setItem(BEST_KEY, JSON.stringify({ day: today, score: best })); } catch (_e) {} }
        w.el.querySelector('.pc98-best').textContent = best;
        blip(660, 0.15, 'triangle', 0.06); setTimeout(function () { blip(880, 0.2, 'triangle', 0.06); }, 140);
        var head = 'Spēle beigusies: ' + G.score + ' punkti.' + (G.goal.done ? ' Dienas mērķis izpildīts!' : '');
        submit(G.score).then(function () { table(head); }, function () { table(head); });
      }
      function submit(score) {
        var a = api(); if (!a || !score) return Promise.reject();
        return a.apiFetch('/api/candy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ day: today, score: score, name: me.name || 'Anonīms' }) });
      }
      function table(head) {
        var a = api(), id = 'table';
        var t = win(id, 'Dienas tabula', 'trophy', '<div class="pc98-table"><p>' + esc(head || 'Šodienas labākie') + '</p><ol class="pc98-top"><li>Ielādē…</li></ol></div><div class="pc98-btns"><button type="button" class="pc98-btn is-default">Labi</button></div>', 300, 420, 70);
        t.el.querySelector('.pc98-btn').addEventListener('click', function () { closeWin(id); });
        var list = t.el.querySelector('.pc98-top');
        if (head) t.el.querySelector('p').textContent = head;
        if (!a) { list.innerHTML = '<li>Tavs rekords šodien: ' + best + '</li>'; return; }
        a.apiFetch('/api/candy?day=' + today).then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) throw new Error();
          list.innerHTML = d.top.length ? d.top.map(function (e) { return '<li' + (e.me ? ' class="is-me"' : '') + '><span>' + esc(e.name) + '</span><b>' + e.score + '</b></li>'; }).join('') : '<li>Šodien vēl neviens nav spēlējis. Esi pirmais!</li>';
        }).catch(function () { list.innerHTML = '<li>Tavs rekords šodien: ' + best + '</li>'; });
      }
      function help() {
        var id = 'help';
        var row = function (draw, text) { return '<li><span class="pc98-hico">' + draw + '</span><span>' + text + '</span></li>'; };
        var t = win(id, 'Kā spēlēt?', 'candy', '<div class="pc98-table"><ul class="pc98-help">'
          + row('3', 'Samaini divas blakus konfektes, lai 3 vai vairāk vienādas būtu rindā.')
          + row('4', '4 rindā: rentgens. Notīra visu rindu vai kolonnu.')
          + row('L', 'L vai T forma: kafijas sprādziens. Notīra 3×3.')
          + row('5', '5 rindā: MR bumba. Samaini ar konfekti, un visas tās krāsas pazūd.')
          + row('★', 'Zelta krūzīte: +2 gājieni.')
          + row('+', 'Divas speciālās kopā: kombo (krusts, 3 rindas, 5×5, viss laukums).')
          + row('◎', 'Dienas mērķis augšā: savāc konfektes, un +1000. Beigās speciālās uzsprāgst bonusā.')
          + row('▢', 'Rozā želeja: saliec konfektes virs tās. Visa želeja nost: +2000.')
          + row('★', 'Zvaigznes: 1500, 3000 un 5000 punkti.')
          + '</ul></div><div class="pc98-btns"><button type="button" class="pc98-btn is-default">Labi</button></div>', 420, 380, 60);
        t.el.querySelector('.pc98-btn').addEventListener('click', function () { closeWin(id); });
      }

      /* ── effects ── */
      function burst(x, y, col, n) {
        for (var i = 0; i < n; i++) {
          var an = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.5;
          fx.parts.push({ x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 2, life: 1, col: col, s: 2 + (Math.random() * 3 | 0), star: Math.random() < 0.35 });
        }
        if (fx.parts.length > 400) fx.parts.splice(0, fx.parts.length - 400);
      }
      // a cleared jelly: a white edge for a frame, then four chunks fall, darker each step
      function jellyBreak(x, y) {
        var q = (CELL / 4) | 0;
        fx.chunks.push({ edge: true, x: x * CELL, y: y * CELL, life: 0.05 });
        [[0, 0, -1], [2, 0, 1], [0, 2, -1], [2, 2, 1]].forEach(function (o) { fx.chunks.push({ x: x * CELL + o[0] * q + 2, y: y * CELL + o[1] * q + 2, s: q, vx: o[2] * 40, vy: -60, life: 0.25 }); });
        blip(1500, 0.02, 'square', 0.02);
      }
      function floatText(x, y, text, col, scale) { fx.floats.push({ x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, text: text, col: col, s: scale || 1, life: 1 }); kick(); }
      function word(i) { fx.word = { text: i < 0 ? 'Saldais finālis!' : WORDS[Math.max(0, Math.min(WORDS.length - 1, i))], life: 1 }; kick(); }
      /* A move: 8-bit rings ripple out from between the two pieces in stepped
         frames (14 a second, no smooth tween), the colours stepping round the
         ring each frame, and pixel crosses flung out with them. Squares on
         one grid, a few dozen fillRects a frame: nothing for an old PC. */
      var PIX_COLS = ['#ff3d96', '#000080', '#16b4dc', '#ffb800', '#2fc95a'], PIX_STEP = 70, PIX_FRAMES = 9;   // on the light board: no white
      function pixelTada(x, y) {
        var crosses = [];
        for (var i = 0; i < 7; i++) crosses.push({ a: i / 7 * Math.PI * 2 + Math.random() * 0.6, d: 0.8 + Math.random() * 0.7, c: (Math.random() * PIX_COLS.length) | 0 });
        fx.pix.push({ x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, t0: performance.now(), crosses: crosses });
        if (fx.pix.length > 4) fx.pix.shift();
        kick();
      }
      function drawPixelTada(now) {
        var P = Math.max(4, Math.round(CELL * 0.1));
        var sq = function (px, py, c) { g.fillStyle = c; g.fillRect(Math.round(px / P) * P - (P >> 1), Math.round(py / P) * P - (P >> 1), P - 1, P - 1); };
        fx.pix.forEach(function (t) {
          var f = Math.floor((now - t.t0) / PIX_STEP);
          if (f < 0 || f >= PIX_FRAMES) return;
          // two rings, the second a step behind; the leading one thins out at the end
          [f, f - 3].forEach(function (rf, ri) {
            if (rf < 0) return;
            var rad = P * (2.5 + rf * 1.9), n = Math.max(8, Math.round(rad * 2 * Math.PI / (P * 1.35)));
            for (var i = 0; i < n; i++) {
              if (rf > PIX_FRAMES - 4 && (i + rf) % 2) continue;
              var an = i / n * Math.PI * 2;
              sq(t.x + Math.cos(an) * rad, t.y + Math.sin(an) * rad, PIX_COLS[(i + f + ri * 2) % PIX_COLS.length]);
            }
          });
          // crosses: a plus of five squares, stepping outward
          if (f >= 1) t.crosses.forEach(function (c) {
            var r = P * (4 + f * 2.6) * c.d, cx = t.x + Math.cos(c.a) * r, cy = t.y + Math.sin(c.a) * r, col = PIX_COLS[(c.c + (f >> 1)) % PIX_COLS.length];
            sq(cx, cy, col); sq(cx - P, cy, col); sq(cx + P, cy, col); sq(cx, cy - P, col); sq(cx, cy + P, col);
          });
        });
      }
      function fxActive() { return fx.chunks.length || fx.fly.length || fx.stamp || fx.pix.length || fx.parts.length || fx.floats.length || fx.beams.length || fx.rings.length || fx.bubbles.length || fx.flash > 0 || fx.shake > 0.01 || fx.word || hint; }
      function kick() { if (!raf) raf = requestAnimationFrame(tick); }

      /* ── drawing (only while something moves, sparks fly or a hint shows) ── */
      function draw(now) {
        now = now || performance.now();
        var sh = fx.shake * fx.shake * 7, ox = sh ? Math.sin(now * 0.09) * sh : 0, oy = sh ? Math.cos(now * 0.11) * sh : 0;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = '#ece9e1'; g.fillRect(0, 0, size, size);
        g.setTransform(1, 0, 0, 1, Math.round(ox), Math.round(oy));
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) & 1) { g.fillStyle = '#dedad0'; g.fillRect(x * CELL, y * CELL, CELL, CELL); }
        for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (G.jelly[y][x]) {   // jelly: flat pink, a 1 px darker edge, a dithered corner
          var jx0 = x * CELL + 2, jy0 = y * CELL + 2, js = CELL - 4;
          g.fillStyle = '#d0307f'; g.fillRect(jx0, jy0, js, js);
          g.fillStyle = '#ffaad7'; g.fillRect(jx0 + 1, jy0 + 1, js - 2, js - 2);
          g.fillStyle = '#ffffff'; for (var dy2 = 0; dy2 < 6; dy2++) for (var dx2 = (dy2 & 1); dx2 < 6 - dy2; dx2 += 2) g.fillRect(jx0 + 2 + dx2, jy0 + 2 + dy2, 1, 1);
        }
        // the pointer's cell and the chosen one: the Windows focus rectangle
        if (hov && !busy && (!sel || hov[0] !== sel[0] || hov[1] !== sel[1])) dotted(g, hov[0] * CELL + 2, hov[1] * CELL + 2, CELL - 4, CELL - 4, '#808080');
        if (sel) { dotted(g, sel[0] * CELL + 1, sel[1] * CELL + 1, CELL - 2, CELL - 2, '#000000'); dotted(g, sel[0] * CELL + 2, sel[1] * CELL + 2, CELL - 4, CELL - 4, '#000000', 1); }
        var hw = hint ? Math.sin(now / 110) * 0.08 : 0;
        for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
          var c = G.board[y][x]; if (!c) continue;
          var px = x, py = y + (c.dy || 0);
          if (swapOff) {
            if (x === swapOff.x1 && y === swapOff.y1) { px += (swapOff.x2 - swapOff.x1) * swapOff.k; py += (swapOff.y2 - swapOff.y1) * swapOff.k; }
            else if (x === swapOff.x2 && y === swapOff.y2) { px += (swapOff.x1 - swapOff.x2) * swapOff.k; py += (swapOff.y1 - swapOff.y2) * swapOff.k; }
          }
          var hinted = hint && ((x === hint[0] && y === hint[1]) || (x === hint[2] && y === hint[3]));
          if (hinted) { px += (x === hint[0] && y === hint[1] ? hint[2] - hint[0] : hint[0] - hint[2]) * hw; py += (x === hint[0] && y === hint[1] ? hint[3] - hint[1] : hint[1] - hint[3]) * hw; }
          piece(c, px * CELL, py * CELL, now, hinted);
        }
        if (hint) {                                                   // the hinted move: the focus rectangle round both, blinking in steps
          var hx = Math.min(hint[0], hint[2]) * CELL + 3, hy = Math.min(hint[1], hint[3]) * CELL + 3;
          if (((now / 300) | 0) % 2) dotted(g, hx, hy, (Math.abs(hint[2] - hint[0]) + 1) * CELL - 6, (Math.abs(hint[3] - hint[1]) + 1) * CELL - 6, '#000080');
        }
        var Z = Math.max(2, Math.round(CELL / 26));                   // the whole scale for pixel lettering here
        fx.beams.forEach(function (b) {
          var L = Math.max(0, b.life);
          if (b.kind === 'row' || b.kind === 'col') {                 // a flat beam that narrows in steps: white core, blue edges
            var horiz = b.kind === 'row', mid = Math.round((b.i + 0.5) * CELL), half = Math.max(2, Math.round(CELL * 0.4 * L / 4) * 4) / 2;
            g.fillStyle = '#5aa8ff'; if (horiz) g.fillRect(0, mid - half - 2, size, half * 2 + 4); else g.fillRect(mid - half - 2, 0, half * 2 + 4, size);
            g.fillStyle = '#ffffff'; if (horiz) g.fillRect(0, mid - half, size, half * 2); else g.fillRect(mid - half, 0, half * 2, size);
          } else {                                                    // lightning from the bomb: a jagged pixel bolt, new each frame
            var x0 = (b.p[0] + 0.5) * CELL, y0 = (b.p[1] + 0.5) * CELL, x1 = (b.p[2] + 0.5) * CELL, y1 = (b.p[3] + 0.5) * CELL;
            var segs = 7, nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1, pts = [[x0, y0]]; nx /= nl; ny /= nl;
            for (var k = 1; k < segs; k++) { var f = k / segs, j2 = (Math.random() - 0.5) * CELL * 0.45; pts.push([x0 + (x1 - x0) * f + nx * j2, y0 + (y1 - y0) * f + ny * j2]); }
            pts.push([x1, y1]);
            for (k = 1; k < pts.length; k++) pxLine(g, pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], '#000080', 4);
            for (k = 1; k < pts.length; k++) pxLine(g, pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], '#ffffff', 2);
          }
        });
        fx.rings.forEach(function (r) {                               // the wrapped blast: a stepped ring of squares
          var rad = (r.r + 0.5) * CELL * (1.25 - Math.max(0, r.life) * 0.6), cx = (r.x + 0.5) * CELL, cy = (r.y + 0.5) * CELL, P = Math.max(4, Math.round(CELL * 0.1));
          var n = Math.max(12, Math.round(rad * 2 * Math.PI / (P * 1.4)));
          for (var i = 0; i < n; i++) { var an = i / n * Math.PI * 2; g.fillStyle = i % 2 ? '#ffd23f' : '#ffffff'; g.fillRect(Math.round((cx + Math.cos(an) * rad) / P) * P - (P >> 1), Math.round((cy + Math.sin(an) * rad) / P) * P - (P >> 1), P - 1, P - 1); }
        });
        fx.parts.forEach(function (p) {                               // sparks: whole pixels, gone at once (no fading)
          if (p.life < 0.12 && ((p.life * 60) | 0) % 2) return;
          g.fillStyle = p.star ? '#ffffff' : p.col;
          var px0 = Math.round(p.x), py0 = Math.round(p.y);
          if (p.star) { var m = p.s + 1; g.fillRect(px0 - m, py0, m * 2 + 1, 1); g.fillRect(px0, py0 - m, 1, m * 2 + 1); }
          else g.fillRect(px0, py0, p.s, p.s);
        });
        fx.chunks.forEach(function (c) {                              // the jelly breaking: an edge, then four chunks stepping darker
          if (c.edge) { dotted(g, Math.round(c.x), Math.round(c.y), CELL, CELL, '#ffffff'); return; }
          g.fillStyle = c.life > 0.17 ? '#ffaad7' : c.life > 0.08 ? '#f06eb4' : '#d0307f'; g.fillRect(Math.round(c.x), Math.round(c.y), c.s, c.s);
        });
        drawPixelTada(now);
        // each cleared piece's points: pixel digits with a dark edge, rising a pixel at a time
        fx.bubbles.forEach(function (b) { if (b.life < 0.15) return; drawWord(g, String(b.n), '#ffffff', '#000080', (b.x + 0.5) * CELL, (b.y + 0.5) * CELL - Math.round((1 - b.life) * 6) * Z, Z); });
        fx.floats.forEach(function (f) { drawWord(g, f.text, f.col, '#000000', f.x, f.y, Math.max(2, Math.round(Z * f.s))); });
        // the goal's pieces jump to the counter above in six steps
        fx.fly.forEach(function (f) {
          var gc = w.el.querySelector('.pc98-goal'), cr = cv.getBoundingClientRect(), gr = gc.getBoundingClientRect(), sc = size / cr.width;
          var tx = (gr.left + 12 - cr.left) * sc, ty = (gr.top + gr.height / 2 - cr.top) * sc, k = Math.min(6, Math.floor(f.age / 0.05)) / 6;
          var sx0 = (f.x + 0.5) * CELL, sy0 = (f.y + 0.5) * CELL, fx2 = sx0 + (tx - sx0) * k, fy2 = sy0 + (ty - sy0) * k - Math.sin(k * Math.PI) * CELL, s2 = 32;
          g.drawImage(PIECES[f.t], Math.round(fx2 - s2 / 2), Math.round(fy2 - s2 / 2), s2, s2);
        });
        if (fx.stamp) {                                               // "x2": 1×, 2×, 1× in three frames, then held
          var age = 0.4 - fx.stamp.life, zz = age < 0.05 ? Z : age < 0.1 ? Z * 2 : Z;
          drawWord(g, fx.stamp.t, '#ffd23f', '#000000', fx.stamp.x, fx.stamp.y, zz);
        }
        if (fx.word) {                                                // the praise word: 1-bit lettering popping in whole steps
          var wl = fx.word.life, zw = Math.max(3, Math.round(CELL / 14));
          drawWord(g, fx.word.text, '#ff5fb0', '#000000', size / 2, Math.round(size * 0.42), wl > 0.9 ? zw + 2 : wl > 0.8 ? zw + 1 : zw);
        }
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (fx.flash > 0.25) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 0, size, size); }
      }
      // the MR bomb as pixel art: a dark disc, the six colours stepping round it, "MR" in 3×5 letters
      var bombFrames = [];
      function bombFrame(i) {
        if (bombFrames[i]) return bombFrames[i];
        var c = canvas(16, 16), q = c.getContext('2d'), R = function (x, y, w2, h2, col) { q.fillStyle = col; q.fillRect(x, y, w2, h2); };
        for (var y = 0; y < 16; y++) { var hw = Math.floor(Math.sqrt(64 - (y - 7.5) * (y - 7.5))); R(8 - hw, y, hw * 2, 1, '#1b1530'); }
        for (var k = 0; k < 6; k++) { var an = (k + i) / 6 * Math.PI * 2; R(Math.round(7 + Math.cos(an) * 5) - 1, Math.round(7 + Math.sin(an) * 5) - 1, 3, 3, PCOL[k]); }
        [[5, 7, 7, 5, 5], [6, 5, 6, 5, 5]].forEach(function (rows, li) { for (var ry = 0; ry < 5; ry++) for (var rx = 0; rx < 3; rx++) if (rows[ry] & (4 >> rx)) R(4 + li * 4 + rx, 6 + ry, 1, 1, '#ffffff'); });
        return (bombFrames[i] = c);
      }
      var striped = {};
      function stripedOf(t, dir) {
        var key = t + dir; if (striped[key]) return striped[key];
        var c = canvas(16, 16), q = c.getContext('2d'); q.drawImage(PIECES[t], 0, 0);
        var d = q.getImageData(0, 0, 16, 16), px = d.data;
        for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
          var i = (y * 16 + x) * 4, band = ((dir === 'h' ? y : x) + 1) % 4;
          if (!px[i + 3]) continue;
          if (band < 2) { px[i] = px[i] + (255 - px[i]) * 0.72; px[i + 1] = px[i + 1] + (255 - px[i + 1]) * 0.72; px[i + 2] = px[i + 2] + (255 - px[i + 2]) * 0.72; }
          else { px[i] *= 0.82; px[i + 1] *= 0.82; px[i + 2] *= 0.82; }
        }
        q.putImageData(d, 0, 0);
        return (striped[key] = c);
      }
      function piece(c, px, py, now, hinted) {
        var k = c.k || 1, sq = c.sq || 0, s = Math.round(CELL * 0.74 * k);
        var sw = s * (1 + sq * 0.14), shh = s * (1 - sq * 0.14), ox = (CELL - sw) / 2, oy = CELL - (CELL - s) / 2 - shh;   // squash from the bottom
        g.globalAlpha = c.a == null ? 1 : Math.max(0, c.a);
        if (c.gold && ((now / 250) | 0) % 2) { g.fillStyle = '#ffcf3a'; g.fillRect(Math.round(px) + 3, Math.round(py) + 3, CELL - 6, 2); g.fillRect(Math.round(px) + 3, Math.round(py) + CELL - 5, CELL - 6, 2); g.fillRect(Math.round(px) + 3, Math.round(py) + 3, 2, CELL - 6); g.fillRect(Math.round(px) + CELL - 5, Math.round(py) + 3, 2, CELL - 6); }
        if (c.t < 0) {                                                // the MR bomb: a dark disc with the six colours turning round it
          g.drawImage(bombFrame(((now / 120) | 0) % 6), px + ox, py + oy, sw, shh);   // 16×16, six frames, drawn nearest
        } else {
          if (c.s === 'w') {                                          // wrapped: a pink-and-yellow wrapper with twists at the sides
            g.fillStyle = '#ff9ad2'; g.fillRect(px + ox - sw * 0.08, py + oy + shh * 0.1, sw * 1.16, shh * 0.8);
            g.fillStyle = '#ffd23f'; for (var j = 0; j < 4; j++) g.fillRect(px + ox + j * sw / 4, py + oy + shh * 0.1, sw / 8, shh * 0.8);
            g.fillStyle = '#ff5fb0'; g.beginPath(); g.moveTo(px + ox - sw * 0.08, py + oy + shh / 2); g.lineTo(px + ox - sw * 0.28, py + oy + shh * 0.2); g.lineTo(px + ox - sw * 0.28, py + oy + shh * 0.8); g.fill();
            g.beginPath(); g.moveTo(px + ox + sw * 1.08, py + oy + shh / 2); g.lineTo(px + ox + sw * 1.28, py + oy + shh * 0.2); g.lineTo(px + ox + sw * 1.28, py + oy + shh * 0.8); g.fill();
            g.drawImage(PIECES[c.t], px + ox + sw * 0.15, py + oy + shh * 0.15, sw * 0.7, shh * 0.7);
          } else if (c.s === 'h' || c.s === 'v') {                    // an X-ray: the candy itself striped, a soft glow round it
            g.drawImage(stripedOf(c.t, c.s), px + ox, py + oy, sw, shh);
          } else g.drawImage(PIECES[c.t], px + ox, py + oy, sw, shh);
          if (c.gold) { g.fillStyle = '#ffcf3a'; g.font = '900 ' + Math.round(CELL * 0.3) + 'px Tahoma, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', px + CELL * 0.8, py + CELL * 0.2); }
        }
        g.globalAlpha = 1;
      }
      function tween(ms, each, done) { anim.push({ t0: performance.now(), ms: ms, each: each, done: done }); kick(); }
      var last = 0;
      function tick(now) {
        raf = 0;
        var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
        if (now < fx.stopUntil) { raf = requestAnimationFrame(tick); return; }   // the hit-stop: a few frames held
        var keep = [], fin = [];
        anim.forEach(function (a) { var k = Math.min(1, (now - a.t0) / a.ms); a.each(k); if (k < 1) keep.push(a); else fin.push(a); });
        anim = keep;
        fx.parts.forEach(function (p) { p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += 0.22 * dt * 60; p.life -= dt * 1.6; });
        fx.parts = fx.parts.filter(function (p) { return p.life > 0; });
        fx.floats.forEach(function (f) { f.y -= dt * 40; f.life -= dt * 1.1; }); fx.floats = fx.floats.filter(function (f) { return f.life > 0; });
        fx.beams.forEach(function (b) { b.life -= dt * (b.kind === 'zap' ? 2.2 : 2.6); }); fx.beams = fx.beams.filter(function (b) { return b.life > 0; });
        fx.pix = fx.pix.filter(function (t) { return now - t.t0 < PIX_STEP * PIX_FRAMES; });
        fx.rings.forEach(function (r) { r.life -= dt * 2.4; }); fx.rings = fx.rings.filter(function (r) { return r.life > 0; });
        fx.bubbles.forEach(function (b) { b.life -= dt * 2.2; }); fx.bubbles = fx.bubbles.filter(function (b) { return b.life > 0; });
        fx.chunks.forEach(function (c) { c.life -= dt; if (!c.edge) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 900 * dt; } }); fx.chunks = fx.chunks.filter(function (c) { return c.life > 0; });
        fx.fly.forEach(function (f) { f.age += dt; if (f.age >= 0.3 && !f.done) { f.done = true; var gc = w.el.querySelector('.pc98-goal'); gc.classList.add('is-hit'); setTimeout(function () { gc.classList.remove('is-hit'); }, 80); } });
        fx.fly = fx.fly.filter(function (f) { return f.age < 0.3; });
        if (fx.stamp) { fx.stamp.life -= dt; if (fx.stamp.life <= 0) fx.stamp = null; }
        fx.flash = Math.max(0, fx.flash - dt * 3); fx.shake = Math.max(0, fx.shake - dt * 2.2);
        if (fx.word) { fx.word.life -= dt * 0.9; if (fx.word.life <= 0) fx.word = null; }
        // the hint: after 5 s with nothing pressed, the best move wobbles
        if (!busy && !G.over && !hint && !sel && now - idleAt > 5000) hint = bestMove();
        draw(now);
        fin.forEach(function (a) { if (a.done) a.done(); });
        if (anim.length || fxActive() || !G.over) { if (!raf) raf = requestAnimationFrame(anim.length || fxActive() ? tick : idle); }
      }
      // nothing moving: check for the hint once a second instead of every frame
      function idle() { raf = 0; setTimeout(function () { if (wins.candy && !raf) { last = 0; raf = requestAnimationFrame(tick); } }, 1000); }

      /* ── input: click two neighbours, or drag one onto the next ── */
      function cellAt(ev) { var r = cv.getBoundingClientRect(); return [Math.floor((ev.clientX - r.left) / r.width * N), Math.floor((ev.clientY - r.top) / r.height * N)]; }
      cv.addEventListener('pointerdown', function (ev) {
        idleAt = performance.now(); hint = null;
        if (busy || G.over) return;
        var c = cellAt(ev); try { cv.setPointerCapture(ev.pointerId); } catch (_e) {}
        if (sel && Math.abs(sel[0] - c[0]) + Math.abs(sel[1] - c[1]) === 1) { var s0 = sel; sel = null; trySwap(s0[0], s0[1], c[0], c[1]); return; }
        sel = c; drag = { c: c, x: ev.clientX, y: ev.clientY }; blip(520, 0.03, 'square', 0.02); kick();
      });
      cv.addEventListener('pointermove', function (ev) {
        if (ev.pointerType === 'mouse' && !drag) { var hc = cellAt(ev); if (!hov || hc[0] !== hov[0] || hc[1] !== hov[1]) { hov = hc[0] >= 0 && hc[1] >= 0 && hc[0] < N && hc[1] < N ? hc : null; kick(); } }
        if (!drag || busy) return;
        var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y, r = cv.getBoundingClientRect(), th = r.width / N * 0.35;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
        var c = drag.c, t = Math.abs(dx) > Math.abs(dy) ? [c[0] + Math.sign(dx), c[1]] : [c[0], c[1] + Math.sign(dy)];
        drag = null; sel = null;
        if (t[0] >= 0 && t[1] >= 0 && t[0] < N && t[1] < N) trySwap(c[0], c[1], t[0], t[1]); else kick();
      });
      cv.addEventListener('pointerup', function () { drag = null; });
      cv.addEventListener('pointerleave', function () { if (hov) { hov = null; kick(); } });
      w.el.querySelector('[data-c="new"]').addEventListener('click', function () { if (!busy) newGame(); });
      w.el.querySelector('[data-c="table"]').addEventListener('click', function () { table(); });
      w.el.querySelector('[data-c="help"]').addEventListener('click', help);
      var tune = null, tuneGain = null, tuneOn = !!opts.solo;
      function tuneStart() {
        if (tune) return;
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        tuneGain = tuneGain || (function () { var gn = actx.createGain(); gn.gain.value = 0.15; gn.connect(actx.destination); return gn; })();
        var loop = function () { tune = chipPlay(CHIP[0], tuneGain, function () { tune = null; if (tuneOn && wins.candy) loop(); }); };
        loop();
      }
      function tuneStop() { if (tune) { tune.stop(); tune = null; } }
      var mbtn = w.el.querySelector('[data-c="music"]');
      mbtn.classList.toggle('is-on', tuneOn);
      mbtn.addEventListener('click', function () { tuneOn = !tuneOn; mbtn.classList.toggle('is-on', tuneOn); if (tuneOn) tuneStart(); else tuneStop(); });
      if (tuneOn) tuneStart();
      w.onClose = function () { if (raf) cancelAnimationFrame(raf); raf = 0; anim = []; tuneOn = false; tuneStop(); };
      newGame(); kick();
      if (window.__candyTest) window.__candyTest({ G: function () { return G; }, combo: function (xa, ya, xb, yb) { busy = true; comboBlast(xa, ya, xb, yb); } });   // the test page only
    }

    /* ── Iestatījumi: the desktop's wallpaper (as YesterPlayOS lets you change it) ── */
    function settings() {
      var WALLS = [['teal', 'Klasiskā zaļganzilā'], ['vapor', 'Vaporwave'], ['sunset', 'Saulriets'], ['grid', 'Sintvilnis']];
      var w = win('settings', 'Iestatījumi', 'gear', '<div class="pc98-set"><p>Fona tapete:</p><div class="pc98-walls">'
        + WALLS.map(function (x) { return '<button type="button" class="pc98-wall" data-wall="' + x[0] + '"><i data-wall="' + x[0] + '"></i><span>' + x[1] + '</span></button>'; }).join('')
        + '</div></div><div class="pc98-btns"><button type="button" class="pc98-btn is-default" data-s="ok">Labi</button></div>', 380, 200, 80);
      var paint = function () { w.el.querySelectorAll('.pc98-wall').forEach(function (b) { b.classList.toggle('is-on', b.dataset.wall === root.dataset.wall); }); };
      w.el.querySelector('.pc98-walls').addEventListener('click', function (e) {
        var b = e.target.closest('.pc98-wall'); if (!b) return;
        root.dataset.wall = b.dataset.wall; try { localStorage.setItem(WALL_KEY, b.dataset.wall); } catch (_e) {} paint();
      });
      w.el.querySelector('[data-s="ok"]').addEventListener('click', function () { closeWin('settings'); });
      paint();
    }

    /* ── Mīnas 98: the classic, a black cat for the face ── */
    /* ── Mīnas 98: the classic rules (first click safe, chording, flags, best times) and
       "Dienas": one 16×16 board a day, the same for everyone and solvable without a
       guess from its marked start (a small solver checks each candidate board); the
       first try of the day counts and keeps the streak, later ones are practice.
       Every press answers at once: the cell sinks, the cat opens its mouth, an empty
       field opens in waves, a lost board shows its mines one by one. */
    var MINE_LEVELS = [['Iesācējs', 9, 9, 10], ['Vidējs', 16, 16, 40], ['Eksperts', 30, 16, 99], ['Dienas', 16, 16, 40]], MINE_KEY = 'minkaMinesBestV1';
    var MINE_DAILY_KEY = 'minkaMinesDailyV1', MINE_LV_KEY = 'minkaMinesLevelV1', DAILY = 3;
    function mineNear(w, h, k, fn) { var x = k % w, y = (k / w) | 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < w && ny < h) fn(ny * w + nx); } }
    // can the board be cleared from `start` by logic alone (single cells, then pairs of cells)?
    function mineSolvable(w, h, mine, near, start) {
      var N = w * h, open = new Uint8Array(N), flag = new Uint8Array(N), left = N - mine.reduce(function (a, b) { return a + b; }, 0), opened = 0;
      function reveal(k) { var st = [k]; while (st.length) { var i = st.pop(); if (open[i] || flag[i]) continue; if (mine[i]) return false; open[i] = 1; opened++; if (!near[i]) mineNear(w, h, i, function (n) { if (!open[n]) st.push(n); }); } return true; }
      reveal(start);
      var unk = function (k) { var u = []; mineNear(w, h, k, function (n) { if (!open[n] && !flag[n]) u.push(n); }); return u; };
      var flags = function (k) { var f = 0; mineNear(w, h, k, function (n) { if (flag[n]) f++; }); return f; };
      for (var guard = 0; guard < 400 && opened < left; guard++) {
        var moved = false, front = [];
        for (var k = 0; k < N; k++) {
          if (!open[k] || !near[k]) continue;
          var u = unk(k); if (!u.length) continue;
          var rem = near[k] - flags(k);
          if (rem === 0) { u.forEach(reveal); moved = true; }
          else if (rem === u.length) { u.forEach(function (n) { flag[n] = 1; }); moved = true; }
          else front.push(k);
        }
        if (moved) continue;
        // pairs: if A's unknowns are all B's, the rest of B's is settled by the difference
        for (var a = 0; a < front.length && !moved; a++) {
          var A = front[a], ua = unk(A), ra = near[A] - flags(A);
          for (var b2 = 0; b2 < front.length && !moved; b2++) {
            var B = front[b2]; if (A === B || Math.abs(A % w - B % w) > 2 || Math.abs(((A / w) | 0) - ((B / w) | 0)) > 2) continue;
            var ub = unk(B), rb = near[B] - flags(B);
            if (!ua.every(function (n) { return ub.indexOf(n) >= 0; })) continue;
            var diff = ub.filter(function (n) { return ua.indexOf(n) < 0; }); if (!diff.length) continue;
            if (rb - ra === 0) { diff.forEach(reveal); moved = true; }
            else if (rb - ra === diff.length) { diff.forEach(function (n) { flag[n] = 1; }); moved = true; }
          }
        }
        if (!moved) return false;
      }
      return opened >= left;
    }
    function mineDailyBoard(day, w, h, n) {
      var start = ((h >> 1) * w) + (w >> 1), N = w * h, mine, near;
      for (var attempt = 0; attempt < 500; attempt++) {
        var r = rng(seedOf('mines:' + day + ':' + attempt)), keep = {}; keep[start] = 1; mineNear(w, h, start, function (q) { keep[q] = 1; });
        var free = []; for (var k = 0; k < N; k++) if (!keep[k]) free.push(k);
        mine = new Array(N).fill(0);
        for (var i = 0; i < n; i++) { var j = i + ((r() * (free.length - i)) | 0), t = free[i]; free[i] = free[j]; free[j] = t; mine[free[i]] = 1; }
        near = new Array(N).fill(0); for (k = 0; k < N; k++) mineNear(w, h, k, function (q) { if (mine[q]) near[k]++; });
        if (mineSolvable(w, h, mine, near, start)) break;
      }
      return { mine: mine, start: start };
    }
    function mineDailyStore() { try { return JSON.parse(localStorage.getItem(MINE_DAILY_KEY) || '{}') || {}; } catch (_e) { return {}; } }
    function mineStreak(store, today) {
      var d = new Date(today + 'T12:00:00Z'), n = 0;
      if (!(store[today] && store[today].won)) d.setUTCDate(d.getUTCDate() - 1);   // not yet today: count up to yesterday
      for (var i = 0; i < 400; i++) { var key = d.toISOString().slice(0, 10); if (!(store[key] && store[key].won)) break; n++; d.setUTCDate(d.getUTCDate() - 1); }
      return n;
    }
    function mines() {
      if (wins.mines) { front('mines'); return; }
      var lv = DAILY, M, timer = 0, tStart = 0, waves = [];
      try { var saved = localStorage.getItem(MINE_LV_KEY); if (saved !== null && MINE_LEVELS[+saved]) lv = +saved; } catch (_e) {}
      var w = win('mines', 'Mīnas 98', 'mine', '<nav class="pc98-menu pc98-mlevels">' + MINE_LEVELS.map(function (l, i) { return '<button type="button" data-lv="' + i + '">' + l[0] + '</button>'; }).join('') + '</nav>'
        + '<div class="pc98-mines"><div class="pc98-mtop"><span class="pc98-led pc98-mleft">010</span><button type="button" class="pc98-face">' + img('face', 26) + '</button><span class="pc98-led pc98-mtime">000</span></div><div class="pc98-mgrid"></div><div class="pc98-mstat"><span class="pc98-mst1"></span><span class="pc98-mst2"></span></div></div>', 260, 160, 30);
      var grid = w.el.querySelector('.pc98-mgrid'), face = w.el.querySelector('.pc98-face'), timeEl = w.el.querySelector('.pc98-mtime'), leftEl = w.el.querySelector('.pc98-mleft');
      var led = function (n) { n = Math.max(-99, Math.min(999, n | 0)); return (n < 0 ? '-' + String(-n).padStart(2, '0') : String(n).padStart(3, '0')); };
      var setFace = function (k) { face.innerHTML = img(k, 26); };
      function bestOf() { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '{}') || {}; } catch (_e) { return {}; } }
      function stat() {
        var s1 = w.el.querySelector('.pc98-mst1'), s2 = w.el.querySelector('.pc98-mst2');
        if (lv === DAILY) {
          var st = mineDailyStore(), d = st[today], streak = mineStreak(st, today);
          s1.textContent = 'Sērija: ' + streak + (streak === 1 ? ' diena' : ' dienas');
          s2.textContent = d ? (d.won ? 'Šodien: ' + d.time + ' s' : 'Šodien: zaudēts') + (M && M.practice ? ', treniņš' : '') : 'Šodienas laukums';
        } else {
          var b = bestOf()[lv]; s1.textContent = MINE_LEVELS[lv][0]; s2.textContent = b ? 'Labākais: ' + b + ' s' : 'Labākā vēl nav';
        }
      }
      // in the arcade the window grows by a whole number when there is room (crisp, nearest)
      function fit() {
        if (!opts.solo) return;
        w.el.style.zoom = ''; var rr = root.getBoundingClientRect(), z = Math.max(1, Math.min(3, Math.floor(Math.min((rr.height - 40) / w.el.offsetHeight, (rr.width - 40) / w.el.offsetWidth))));
        w.el.style.zoom = z > 1 ? String(z) : '';
        if (window.MinkaDitherBackdrop) window.MinkaDitherBackdrop.attach(root, { box: w.el });
      }
      function start(i) {
        lv = i; try { localStorage.setItem(MINE_LV_KEY, String(i)); } catch (_e) {}
        var L = MINE_LEVELS[lv];
        waves.forEach(clearTimeout); waves = [];
        M = { w: L[1], h: L[2], n: L[3], cells: [], placed: false, over: false, open: 0, flags: 0, start: -1, practice: false };
        for (var k = 0; k < M.w * M.h; k++) M.cells.push({ mine: false, open: false, flag: false, near: 0 });
        if (lv === DAILY) {
          var day = mineDailyBoard(today, M.w, M.h, M.n);
          day.mine.forEach(function (m, k) { M.cells[k].mine = !!m; });
          M.cells.forEach(function (c, k) { mineNear(M.w, M.h, k, function (n) { if (M.cells[n].mine) c.near++; }); });
          M.start = day.start; M.practice = !!mineDailyStore()[today];
        }
        clearInterval(timer); timer = 0; tStart = 0;
        timeEl.textContent = '000'; timeEl.classList.remove('is-best'); leftEl.classList.remove('is-blink'); timeEl.classList.remove('is-blink');
        w.el.style.width = (M.w * 24 + 34) + 'px';
        grid.style.gridTemplateColumns = 'repeat(' + M.w + ', 24px)';
        grid.innerHTML = M.cells.map(function (_c, k) { return '<i data-k="' + k + '"' + (k === M.start ? ' class="is-start"' : '') + '></i>'; }).join('');
        w.el.querySelectorAll('[data-lv]').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.lv === lv); });
        setFace('face'); paintLeft(); stat(); fit();
      }
      function around(k, fn) { mineNear(M.w, M.h, k, fn); }
      function place(safe) {                                        // the first click is never a mine, nor its neighbours
        if (lv !== DAILY) {
          var keep = { }; keep[safe] = 1; around(safe, function (n) { keep[n] = 1; });
          var free = []; for (var k = 0; k < M.cells.length; k++) if (!keep[k]) free.push(k);
          for (var i = 0; i < M.n; i++) { var j = i + ((Math.random() * (free.length - i)) | 0), t = free[i]; free[i] = free[j]; free[j] = t; M.cells[free[i]].mine = true; }
          M.cells.forEach(function (c, k) { around(k, function (n) { if (M.cells[n].mine) c.near++; }); });
        }
        M.placed = true; tStart = Date.now();
        timer = setInterval(function () { timeEl.textContent = led((Date.now() - tStart) / 1000); }, 500);
      }
      function paintCell(k, fresh) {
        var c = M.cells[k], e = grid.children[k];
        e.className = (c.open ? 'is-open' + (c.mine ? ' is-boom' : '') : c.flag ? 'is-flag' : (k === M.start && !M.placed ? 'is-start' : '')) + (fresh ? ' is-fresh' : '');
        e.textContent = c.open && !c.mine && c.near ? c.near : '';
        if (c.open && c.near) e.dataset.n = c.near;
      }
      function paintLeft() { leftEl.textContent = led(M.n - M.flags); }
      // an empty field opens in waves, one ring of cells per frame (all within ~150 ms)
      function reveal(k) {
        var queue = [[k, 0]], rings = [];
        while (queue.length) {
          var q = queue.shift(), i = q[0], c = M.cells[i];
          if (c.open || c.flag) continue;
          c.open = true; M.open++;
          (rings[q[1]] = rings[q[1]] || []).push(i);
          if (!c.mine && !c.near) around(i, function (n) { if (!M.cells[n].open) queue.push([n, q[1] + 1]); });
        }
        var step = rings.length > 1 ? Math.min(16, 150 / rings.length) : 0;
        rings.forEach(function (ring, d) {
          var show = function () { ring.forEach(function (i) { paintCell(i, true); }); setTimeout(function () { ring.forEach(function (i) { var e = grid.children[i]; if (e) e.classList.remove('is-fresh'); }); }, 40); };
          if (!d) show(); else waves.push(setTimeout(show, d * step));
        });
      }
      function lose(k) {
        M.over = true; clearInterval(timer); setFace('faceDead'); blip(90, 0.06, 'square', 0.06);
        grid.children[k].classList.add('is-hit');
        w.el.style.marginTop = '1px'; setTimeout(function () { w.el.style.marginTop = ''; }, 70);   // the window jolts a pixel
        var rest = []; M.cells.forEach(function (c, i) { if (c.mine && !c.open) rest.push(i); else if (c.flag && !c.mine) grid.children[i].className = 'is-wrong'; });
        var gap = Math.min(25, 600 / Math.max(1, rest.length));
        rest.forEach(function (i, n) { waves.push(setTimeout(function () { M.cells[i].open = true; paintCell(i); }, (n + 1) * gap)); });
        recordDaily(false);
      }
      function recordDaily(won, secs) {
        if (lv !== DAILY || M.practice) { stat(); return; }
        var st = mineDailyStore(); st[today] = { won: won, time: won ? secs : null }; M.practice = true;
        try { localStorage.setItem(MINE_DAILY_KEY, JSON.stringify(st)); } catch (_e) {}
        stat();
      }
      function checkWin() {
        if (M.open !== M.cells.length - M.n) return;
        M.over = true; clearInterval(timer); setFace('faceWin');
        M.cells.forEach(function (c, i) { if (c.mine && !c.flag) { c.flag = true; paintCell(i); } }); M.flags = M.n; paintLeft();
        var secs = Math.round((Date.now() - tStart) / 1000), best = bestOf(), record = false;
        timeEl.textContent = led(secs);
        if (lv !== DAILY) {
          record = !best[lv] || secs < best[lv];
          if (record) { best[lv] = secs; try { localStorage.setItem(MINE_KEY, JSON.stringify(best)); } catch (_e) {} }
        }
        leftEl.classList.add('is-blink'); timeEl.classList.add(record ? 'is-best' : 'is-blink');
        blip(660, 0.15, 'triangle', 0.06); setTimeout(function () { blip(990, 0.2, 'triangle', 0.06); }, 140);
        recordDaily(true, secs);
      }
      function open1(k) {
        var c = M.cells[k]; if (M.over || c.flag) return;
        if (!M.placed && lv === DAILY && k !== M.start) {             // the day's board starts at its marked cell
          var s = grid.children[M.start]; s.classList.remove('is-nudge'); void s.offsetWidth; s.classList.add('is-nudge'); blip(140, 0.04, 'square', 0.03); return;
        }
        if (!M.placed) place(k);
        if (c.open) {                                               // a number with its flags around it: open the rest
          var f = 0; around(k, function (n) { if (M.cells[n].flag) f++; });
          if (c.near && f === c.near) around(k, function (n) { var d = M.cells[n]; if (!d.open && !d.flag) { if (d.mine) { d.open = true; M.open++; paintCell(n); if (!M.over) lose(n); } else reveal(n); } });
        } else if (c.mine) { c.open = true; M.open++; paintCell(k); lose(k); return; }
        else { reveal(k); blip(700, 0.02, 'square', 0.02); }
        if (!M.over) checkWin();
      }
      function flag(k) {
        var c = M.cells[k]; if (M.over || c.open) return;
        c.flag = !c.flag; M.flags += c.flag ? 1 : -1; paintCell(k, c.flag); paintLeft(); blip(c.flag ? 900 : 500, 0.03, 'square', 0.02);
        if (c.flag) setTimeout(function () { var e = grid.children[k]; if (e) e.classList.remove('is-fresh'); }, 40);
      }
      // the press: the cell (or the 3×3 under a number) sinks while held, the cat says "o"
      var press = null, sunk = [];
      function sink(k) {
        unsink();
        var c = M.cells[k];
        var list = c.open ? [] : [k]; if (c.open && c.near) around(k, function (n) { if (!M.cells[n].open && !M.cells[n].flag) list.push(n); });
        list.forEach(function (i) { if (!M.cells[i].flag) grid.children[i].classList.add('is-press'); }); sunk = list;
      }
      function unsink() { sunk.forEach(function (i) { var e = grid.children[i]; if (e) e.classList.remove('is-press'); }); sunk = []; }
      grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      grid.addEventListener('pointerdown', function (e) {
        var t = e.target.closest('[data-k]'); if (!t || M.over) return;
        var k = +t.dataset.k;
        if (e.button === 2) { flag(k); return; }
        setFace('faceO'); sink(k);
        press = { k: k, at: Date.now(), timer: e.pointerType === 'touch' ? setTimeout(function () { unsink(); flag(k); press = null; setFace('face'); }, 420) : 0 };
      });
      grid.addEventListener('pointerover', function (e) { if (!press || e.pointerType === 'touch') return; var t = e.target.closest('[data-k]'); if (t) { press.k = +t.dataset.k; sink(press.k); } });
      grid.addEventListener('pointerleave', function () { unsink(); });
      grid.addEventListener('pointerup', function (e) {
        if (!press) return;
        clearTimeout(press.timer); unsink();
        var t = e.target.closest('[data-k]'), k = press.k; press = null;
        if (!M.over) setFace('face');
        if (t && +t.dataset.k === k) open1(k);
      });
      face.addEventListener('click', function () { start(lv); });
      w.el.querySelector('.pc98-mlevels').addEventListener('click', function (e) { var b = e.target.closest('[data-lv]'); if (b) start(+b.dataset.lv); });
      w.onClose = function () { clearInterval(timer); waves.forEach(clearTimeout); };
      start(lv);
    }

    /* ── Mūzika 98: a player in Spotify's manner (playlists, a big cover, the now-playing bar,
       shuffle, repeat, hearts, a little spectrum) in the old window; the hall's classics and
       two chiptunes made here note by note ── */
    var LIKE_KEY = 'minkaPC98Likes';
    var CHIP = [
      { title: 'Konfektes 98 tēma', by: 'Vecais dators', bpm: 138, key: 0, prog: [0, 9, 5, 7], seed: 3 },
      { title: 'Nakts dežūra', by: 'Vecais dators', bpm: 96, key: 9, prog: [0, 8, 3, 10], minor: true, seed: 11 },
      { title: 'Löfbergs boogie', by: 'Vecais dators', bpm: 160, key: 7, prog: [0, 0, 5, 7], seed: 21 }
    ];
    function music() {
      if (wins.music) { front('music'); return; }
      var classic = (opts.music || []).map(function (t) { return { title: t.title, by: 'PM Music, Philip Milman', src: t.src }; });
      var LISTS = [
        { id: 'classic', name: 'Klasika zālē', note: 'Ieraksti: PM Music, diriģents Philip Milman, CC BY 3.0', cover: ['#3a6ad8', '#b07ae0'], tracks: classic },
        { id: 'chip', name: 'Čiptjūns 98', note: 'Uzrakstīts šim datoram, nots pa notij', cover: ['#ff5fb0', '#ffd23f'], tracks: CHIP.map(function (c) { return Object.assign({ chip: c }, c); }) }
      ];
      var likes = {}; try { likes = JSON.parse(localStorage.getItem(LIKE_KEY) || '{}') || {}; } catch (_e) {}
      var all = LISTS[0].tracks.concat(LISTS[1].tracks);
      LISTS.push({ id: 'liked', name: 'Patīk', note: 'Tavas sirsniņas', cover: ['#4a2fb0', '#1db954'], tracks: null });
      var w = win('music', 'Mūzika 98', 'music', '<div class="pc98-mu"><aside class="pc98-mside"><b>Tava bibliotēka</b>'
        + LISTS.map(function (l, i) { return '<button type="button" data-l="' + i + '"><i class="pc98-cover" style="--a:' + l.cover[0] + ';--b:' + l.cover[1] + '"></i><span>' + esc(l.name) + '</span></button>'; }).join('')
        + '</aside><main class="pc98-mmain"></main></div>'
        + '<div class="pc98-now"><i class="pc98-cover pc98-ncover"></i><div class="pc98-ntitle"><b>—</b><span></span></div>'
        + '<div class="pc98-ctrl"><div class="pc98-cbtn"><button type="button" data-p="shuffle" title="Sajaukt">⤨</button><button type="button" data-p="prev" title="Iepriekšējā">⏮</button><button type="button" data-p="play" class="pc98-play" title="Atskaņot">▶</button><button type="button" data-p="next" title="Nākamā">⏭</button><button type="button" data-p="repeat" title="Atkārtot">⟲</button></div>'
        + '<div class="pc98-prog"><span class="pc98-t0">0:00</span><div class="pc98-bar"><i></i></div><span class="pc98-t1">0:00</span></div></div>'
        + '<canvas class="pc98-spec" width="96" height="36"></canvas><input type="range" class="pc98-vol" min="0" max="100" value="70" aria-label="Skaļums"></div>', 680, 120, 30);
      var main = w.el.querySelector('.pc98-mmain'), cur = null, curList = null, shuffle = false, repeat = false, playing = false;
      var a = actxGet(), out = a.createGain(), an = a.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.72; out.gain.value = 0.7; out.connect(an); an.connect(a.destination);
      var au = new Audio(); au.preload = 'none'; var srcNode = null;
      var chip = null, raf = 0;
      function actxGet() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); return actx; }
      function fmt(s) { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); }
      function listTracks(l) { return l.id === 'liked' ? all.filter(function (t) { return likes[t.title]; }) : l.tracks; }
      function showList(i) {
        var l = LISTS[i], tr = listTracks(l);
        w.el.querySelectorAll('[data-l]').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.l === i); });
        main.innerHTML = '<header class="pc98-mhead"><i class="pc98-cover pc98-big" style="--a:' + l.cover[0] + ';--b:' + l.cover[1] + '"></i><div><small>Atskaņošanas saraksts</small><h2>' + esc(l.name) + '</h2><p>' + esc(l.note) + '. ' + tr.length + ' dziesmas</p>'
          + '<button type="button" class="pc98-bigplay" data-play-list="' + i + '"' + (tr.length ? '' : ' disabled') + '>▶</button></div></header>'
          + '<ol class="pc98-tracks">' + (tr.length ? tr.map(function (t, j) { return '<li data-t="' + j + '" class="' + (cur === t ? 'is-cur' : '') + '"><span class="pc98-tn">' + (j + 1) + '</span><span class="pc98-tt"><b>' + esc(t.title) + '</b><small>' + esc(t.by) + '</small></span><button type="button" class="pc98-heart' + (likes[t.title] ? ' is-on' : '') + '" data-like="' + j + '" title="Patīk">♥</button></li>'; }).join('') : '<li class="pc98-empty">Nospied ♥ pie dziesmas, un tā būs šeit.</li>') + '</ol>';
        main.dataset.l = i;
      }
      main.addEventListener('click', function (e) {
        var l = LISTS[+main.dataset.l], tr = listTracks(l);
        var like = e.target.closest('[data-like]');
        if (like) { var t = tr[+like.dataset.like]; likes[t.title] = !likes[t.title]; if (!likes[t.title]) delete likes[t.title]; try { localStorage.setItem(LIKE_KEY, JSON.stringify(likes)); } catch (_e) {} showList(+main.dataset.l); return; }
        if (e.target.closest('[data-play-list]')) { curList = tr.slice(); play(shuffle ? curList[(Math.random() * curList.length) | 0] : curList[0]); return; }
        var li = e.target.closest('[data-t]'); if (li) { curList = tr.slice(); play(tr[+li.dataset.t]); }
      });
      w.el.querySelector('.pc98-mside').addEventListener('click', function (e) { var b = e.target.closest('[data-l]'); if (b) showList(+b.dataset.l); });
      function stopAll() { au.pause(); if (chip) { chip.stop(); chip = null; } }
      function play(t) {
        if (!t) return;
        stopAll(); cur = t; playing = true;
        if (a.state === 'suspended') a.resume();
        if (t.src) {
          if (!srcNode) { try { srcNode = a.createMediaElementSource(au); srcNode.connect(out); } catch (_e) {} }
          if (au.getAttribute('src') !== t.src) au.src = t.src;
          au.currentTime = 0; var pr = au.play(); if (pr && pr.catch) pr.catch(function () {});
        } else chip = chipPlay(t.chip, out, function () { next(true); });
        w.el.querySelector('.pc98-ntitle b').textContent = t.title; w.el.querySelector('.pc98-ntitle span').textContent = t.by;
        var l = LISTS.find(function (x) { return x.tracks && x.tracks.indexOf(t) >= 0; }) || LISTS[0];
        w.el.querySelector('.pc98-ncover').style.cssText = '--a:' + l.cover[0] + ';--b:' + l.cover[1];
        w.el.querySelector('.pc98-play').textContent = '⏸';
        showList(+main.dataset.l || 0);
        if (!raf) raf = requestAnimationFrame(frame);
      }
      function next(auto) {
        if (!curList || !curList.length) return;
        if (auto && repeat) { play(cur); return; }
        var i = curList.indexOf(cur), j = shuffle ? (Math.random() * curList.length) | 0 : (i + 1) % curList.length;
        play(curList[j]);
      }
      function prev() { if (!curList) return; var i = curList.indexOf(cur); play(curList[(i - 1 + curList.length) % curList.length]); }
      au.addEventListener('ended', function () { next(true); });
      function toggle() {
        if (!cur) { curList = listTracks(LISTS[+main.dataset.l || 0]).slice(); play(curList[0]); return; }
        playing = !playing;
        if (cur.src) { if (playing) au.play(); else au.pause(); } else if (playing) { chip = chipPlay(cur.chip, out, function () { next(true); }); } else if (chip) { chip.stop(); chip = null; }
        w.el.querySelector('.pc98-play').textContent = playing ? '⏸' : '▶';
        if (playing && !raf) raf = requestAnimationFrame(frame);
      }
      w.el.querySelector('.pc98-cbtn').addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b) return;
        var k = b.dataset.p;
        if (k === 'play') toggle(); else if (k === 'next') next(false); else if (k === 'prev') prev();
        else if (k === 'shuffle') { shuffle = !shuffle; b.classList.toggle('is-on', shuffle); }
        else if (k === 'repeat') { repeat = !repeat; b.classList.toggle('is-on', repeat); }
      });
      w.el.querySelector('.pc98-vol').addEventListener('input', function () { out.gain.value = this.value / 100; });
      w.el.querySelector('.pc98-bar').addEventListener('click', function (e) {
        if (!cur || !cur.src || !au.duration) return;
        var r = this.getBoundingClientRect(); au.currentTime = (e.clientX - r.left) / r.width * au.duration;
      });
      // the bar, the times and the spectrum: ~20 times a second, only while it plays
      var spec = w.el.querySelector('.pc98-spec'), sg = spec.getContext('2d'), bins = new Uint8Array(an.frequencyBinCount), lastDraw = 0, caps = [];
      function frame(now) {
        raf = 0;
        if (!wins.music) return;
        if (now - lastDraw > 50) {
          lastDraw = now;
          var t = cur && cur.src ? au.currentTime : chip ? chip.time() : 0, d = cur && cur.src ? (au.duration || 0) : chip ? chip.length : 0;
          w.el.querySelector('.pc98-t0').textContent = fmt(t); w.el.querySelector('.pc98-t1').textContent = fmt(d);
          w.el.querySelector('.pc98-bar i').style.width = (d ? t / d * 100 : 0) + '%';
          an.getByteFrequencyData(bins);
          sg.clearRect(0, 0, 96, 36);
          // 16 bars from 60 Hz to 12 kHz on a log scale (as the ear hears), the highs lifted a little,
          // each with a cap that falls slowly
          var nyq = a.sampleRate / 2, B = 16;
          for (var i = 0; i < B; i++) {
            var f0 = 60 * Math.pow(200, i / B), f1 = 60 * Math.pow(200, (i + 1) / B);
            var b0 = Math.max(1, Math.floor(f0 / nyq * bins.length)), b1 = Math.max(b0 + 1, Math.ceil(f1 / nyq * bins.length)), m = 0;
            for (var b = b0; b < b1 && b < bins.length; b++) m = Math.max(m, bins[b]);
            var v = Math.min(1, m / 255 * (1 + i / B * 0.9)), hgt = Math.max(1, Math.round(v * 32));
            caps[i] = Math.max(hgt, (caps[i] || 0) - 1);
            sg.fillStyle = '#6a3fd0'; sg.fillRect(i * 6, 36 - hgt, 5, hgt);
            sg.fillStyle = '#1db954'; sg.fillRect(i * 6, 36 - hgt, 5, Math.min(hgt, 3));
            sg.fillStyle = '#f6f0ff'; sg.fillRect(i * 6, 35 - caps[i], 5, 1);
          }
        }
        if (playing) raf = requestAnimationFrame(frame);
      }
      w.onClose = function () { stopAll(); if (raf) cancelAnimationFrame(raf); raf = 0; try { out.disconnect(); } catch (_e) {} };
      showList(0);
    }
    // a chiptune from its chords: a square lead over the chord's tones, a triangle bass, a soft noise hat
    function chipPlay(c, dest, onEnd) {
      var a = actx, beat = 60 / c.bpm, bars = 16, len = bars * 4 * beat, t0 = a.currentTime + 0.05, nodes = [], r = rng(c.seed), stopped = false;
      var hz = function (semi) { return 440 * Math.pow(2, (semi - 9) / 12); };
      var nb = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      function note(type, f, at, dur, vol) {
        var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(g); g.connect(dest); o.start(at); o.stop(at + dur + 0.02); nodes.push(o);
      }
      var phrase = []; for (var s = 0; s < 8; s++) phrase.push([0, 2, 4, 2, 7, 4, 9, 7][(r() * 8) | 0]);
      for (var bar = 0; bar < bars; bar++) {
        var root = c.key + c.prog[bar % 4], third = c.minor && bar % 4 === 0 ? 3 : 4, chord = [0, third, 7];
        for (var q = 0; q < 4; q++) {
          var at = t0 + (bar * 4 + q) * beat;
          note('triangle', hz(root - 24 + (q % 2 ? 7 : 0)), at, beat * 0.9, 0.14);
          var hat = a.createBufferSource(), hg = a.createGain(); hat.buffer = nb; hg.gain.value = 0.02; hat.connect(hg); hg.connect(dest); hat.start(at + beat / 2); nodes.push(hat);
          for (var e8 = 0; e8 < 2; e8++) {
            var step = phrase[(bar * 2 + q * 2 + e8) % 8], tone = chord[step % 3] + (step > 4 ? 12 : 0);
            if (bar % 8 > 5 && e8) continue;                         // a breath at the end of each phrase
            note('square', hz(root + tone), at + e8 * beat / 2, beat * 0.42, 0.045);
          }
        }
      }
      var endT = setTimeout(function () { if (!stopped) onEnd(); }, len * 1000 + 80);
      return {
        length: len,
        time: function () { return Math.min(len, a.currentTime - t0); },
        stop: function () { stopped = true; clearTimeout(endT); nodes.forEach(function (n) { try { n.stop(); } catch (_e) {} }); }
      };
    }

    /* ── Pinbols 98: a pinball table of our own (not Space Cadet: its pictures and
       sounds are Microsoft's). As a 90s game: one fixed 320×480 canvas shown at a
       whole multiple, every shape set pixel by pixel (no smoothing, no gradients),
       the still table painted once, the physics in fixed small steps so the ball
       never tunnels on a slow PC. Z / Shift / ← and / / Shift / → the flippers,
       Space or ↓ held pulls the plunger, X and . nudge; the mouse's buttons too.
       Missions and ranks as on a real table: each mission is a target on the
       playfield (the drop bank, the planet, the bumpers, the lanes); done, the
       rank goes up and every ball ends with a rank bonus. */
    var PIN_KEY = 'minkaPinball98', PIN_RANK_KEY = 'minkaPinball98Rank';
    var RANKS = ['Kadets', 'Pilots', 'Kapteinis', 'Majors', 'Komandieris', 'Admirālis'];
    function pinball() {
      if (wins.pinball) { front('pinball'); return; }
      var PW = 320, PH = 480, rr = root.getBoundingClientRect();
      // a whole number of screen pixels per game pixel (on a 2× screen 1.5 here is 3 real
      // pixels: still crisp); if that leaves it small, it fills the height (nearest-neighbour)
      var dpr = window.devicePixelRatio || 1, availH = rr.height - (opts.solo ? 96 : 132), availW = rr.width - 60;   // the taskbar's room on the desktop
      var kd = Math.max(1, Math.floor(Math.min(availH * dpr / PH, availW * dpr / PW))), k = kd / dpr;
      if (PH * k < availH * 0.8) k = Math.max(1, Math.min(availH / PH, availW / PW));
      k = Math.round(k * PH) / PH;
      var w = win('pinball', 'Pinbols 98', 'pinball',
        '<div class="pc98-pin"><div class="pc98-cbar"><span>Punkti <b class="pc98-pscore">0</b></span><span>Bumba <b class="pc98-pball">1/3</b></span><span>Reiz. <b class="pc98-pmul">×1</b></span><span>Rangs <b class="pc98-prank">Kadets</b></span><span>Rekords <b class="pc98-pbest">0</b></span></div>'
        + '<div class="pc98-well"><canvas class="pc98-pcv" width="' + PW + '" height="' + PH + '" style="width:' + Math.round(PW * k) + 'px;height:' + Math.round(PH * k) + 'px"></canvas></div>'
        + '<div class="pc98-pmsg"></div></div>',
        Math.max(Math.round(PW * k) + 22, 420), Math.max(6, (rr.width - Math.max(PW * k + 22, 420)) / 2), Math.max(4, (rr.height - (opts.solo ? 0 : 34) - PH * k - 92) / 2));
      var cv = w.el.querySelector('.pc98-pcv'), g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      var msgEl = w.el.querySelector('.pc98-pmsg');
      var best = 0, bestRank = 0;
      try { best = +localStorage.getItem(PIN_KEY) || 0; bestRank = +localStorage.getItem(PIN_RANK_KEY) || 0; } catch (_e) {}
      w.el.querySelector('.pc98-pbest').textContent = best + (bestRank ? ' (' + RANKS[Math.min(bestRank, RANKS.length - 1)] + ')' : '');

      // pixel drawing: a rect, a Bresenham line, a filled circle
      function R(c, x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, ww, hh); }
      function line(c, x0, y0, x1, y1, col, t) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); t = t || 1;
        var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
        c.fillStyle = col;
        for (var guard = 0; guard < 2000; guard++) {
          c.fillRect(x0 - (t >> 1), y0 - (t >> 1), t, t);
          if (x0 === x1 && y0 === y1) break;
          var e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
        }
      }
      function disc(c, cx, cy, r, col) { c.fillStyle = col; for (var y = -r; y <= r; y++) { var hw = Math.floor(Math.sqrt(r * r - y * y + r * 0.6)); c.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } }
      function sprite(ww, hh, draw) { var c = canvas(ww, hh), x = c.getContext('2d'); draw(x); return c; }
      // a 3×5 bitmap font: digits, signs and the letters the table writes
      var PIXFONT = { '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [7, 1, 7, 4, 7], '3': [7, 1, 3, 1, 7], '4': [5, 5, 7, 1, 1], '5': [7, 4, 7, 1, 7], '6': [7, 4, 7, 5, 7], '7': [7, 1, 2, 2, 2], '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 7], '+': [0, 2, 7, 2, 0], 'x': [0, 5, 2, 5, 0],
        P: [6, 5, 6, 4, 4], I: [7, 2, 2, 2, 7], N: [5, 7, 7, 5, 5], B: [6, 5, 6, 5, 6], O: [7, 5, 5, 5, 7], L: [4, 4, 4, 4, 7], S: [7, 4, 7, 1, 7], ' ': [0, 0, 0, 0, 0] };
      function text(c, s, x, y, col, z) {
        z = z || 1; c.fillStyle = col;
        for (var i = 0; i < s.length; i++) {
          var rows = PIXFONT[s[i]]; if (!rows) continue;
          for (var ry = 0; ry < 5; ry++) for (var rx = 0; rx < 3; rx++) if (rows[ry] & (4 >> rx)) c.fillRect(x + (i * 4 + rx) * z, y + ry * z, z, z);
        }
      }

      // the table (logical px): walls as segments, the ball comes up the lane on the right
      var WALLS = [
        [12, 70, 20, 40], [20, 40, 40, 20], [40, 20, 70, 12], [70, 12, 250, 12], [250, 12, 280, 20], [280, 20, 300, 40], [300, 40, 308, 80],
        [308, 80, 308, 470], [12, 70, 12, 360], [284, 120, 284, 470], [12, 360, 84, 414], [284, 360, 212, 414],
        [34, 300, 34, 356], [34, 356, 62, 372], [262, 300, 262, 356], [262, 356, 234, 372],
        // the guide posts between the three top lanes
        [124, 40, 124, 64], [172, 40, 172, 64], [76, 46, 76, 70], [220, 46, 220, 70]
      ];
      var KICK = [[34, 300, 62, 372, 1], [262, 300, 234, 372, -1]];        // the slingshots' kicking faces
      var BUMP = [[112, 150], [184, 150], [148, 206]], BR = 15;
      var ROLL = [[100, 54], [148, 50], [196, 54]];
      var DROP = [[14, 168], [14, 190], [14, 212]], DW = 5, DH = 16;       // the drop bank on the left flank
      var PLANET = [234, 270], PR = 20;
      var FL = [{ px: 88, py: 418, dir: 1, a: 0.5, w: 0, up: false }, { px: 208, py: 418, dir: -1, a: 0.5, w: 0, up: false }];
      var FLEN = 46, REST = 0.5, UP = -0.45;
      var PAL = { bg: '#0b1030', shade: '#050818', wall: '#c8ccd4', wall2: '#5a6478', lane: '#141c48', star: '#ffffff', star2: '#6f80d8', orange: '#ff8a1f', yellow: '#ffd23f', red: '#e0303a', dark: '#5a1418', ink: '#000000', blue: '#3f7af0', blue2: '#2c5fd0' };
      // the ring round the planet: its pixels, so a mission's end can run a marquee round it
      var RING = [];
      (function () { var x0 = 204, y0 = 282, x1 = 266, y1 = 258, n = 40; for (var i = 0; i <= n; i++) RING.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]); })();

      // the still table: drawn once
      var bg = canvas(PW, PH), b = bg.getContext('2d');
      R(b, 0, 0, PW, PH, PAL.bg);
      var sr = rng(seedOf('pinball-stars'));
      for (var i = 0; i < 140; i++) R(b, (sr() * PW) | 0, (sr() * PH) | 0, 1, 1, sr() < 0.3 ? PAL.star : PAL.star2);
      // the planet: a shadow, flat bands
      disc(b, PLANET[0] + 2, PLANET[1] + 2, PR, PAL.shade); disc(b, PLANET[0], PLANET[1], PR, PAL.blue2); disc(b, PLANET[0] - 3, PLANET[1] - 3, PR - 4, PAL.blue);
      for (var py = PLANET[1] - 14; py < PLANET[1] + 16; py += 6) R(b, PLANET[0] - 18, py, 36, 2, PAL.blue2);
      R(b, 285, 120, 23, 360, PAL.lane);
      // rails: a dark base, a light top
      WALLS.forEach(function (sgm) { line(b, sgm[0] + 1, sgm[1] + 1, sgm[2] + 1, sgm[3] + 1, PAL.shade, 4); });
      WALLS.forEach(function (sgm) { line(b, sgm[0], sgm[1], sgm[2], sgm[3], PAL.wall2, 3); });
      WALLS.forEach(function (sgm) { line(b, sgm[0], sgm[1], sgm[2], sgm[3], PAL.wall, 1); });
      KICK.forEach(function (kk) { line(b, kk[0], kk[1], kk[2], kk[3], PAL.red, 3); });   // the slingshots' rubber
      for (i = 0; i < 3; i++) { R(b, 40 + i * 8, 330 - i * 4, 4, 4, PAL.orange); R(b, 252 - i * 8, 330 - i * 4, 4, 4, PAL.orange); }
      // the apron, in the dead corners under the inlanes: the table's name, the gauge's frame
      text(b, 'PINBOLS', 16, 452, PAL.shade, 2); text(b, 'PINBOLS', 15, 451, PAL.yellow, 2);
      text(b, '98', 46, 466, PAL.orange, 2);
      R(b, 223, 455, 56, 12, PAL.ink); R(b, 224, 456, 54, 10, PAL.lane);

      var ballS = sprite(15, 15, function (x) { disc(x, 8, 8, 6, PAL.shade); disc(x, 6, 6, 6, '#5a6478'); disc(x, 6, 6, 5, '#c8ccd4'); R(x, 3, 3, 3, 2, '#ffffff'); });
      var bumpS = [false, true].map(function (lit) { return sprite(BR * 2 + 4, BR * 2 + 4, function (x) { disc(x, BR + 2, BR + 2, BR, PAL.shade); disc(x, BR, BR, BR, PAL.ink); disc(x, BR, BR, BR - 1, lit ? '#ffffff' : PAL.yellow); disc(x, BR, BR, BR - 5, lit ? PAL.yellow : PAL.orange); disc(x, BR, BR, 3, lit ? '#ffffff' : PAL.red); }); });

      var G = null, keys = { l: false, r: false, p: false }, raf = 0, last = 0, acc = 0;
      /* Feedback in tiers (game-feel): small = flash + click; medium = + "+100" in pixel
         digits and a 1 px shake; large = + a 2–3 px shake and a jingle. The shake is
         whole pixels of the picture only, the ball's world never moves. Sounds vary a
         few percent each time (audio-design: no machine-gun repeats). */
      var trauma = 0, shakeT = 0, pops = [], dust = [];
      function sfx(f, d, t, v) { blip(f * (0.96 + Math.random() * 0.08), d, t, v); }
      function feel(tier, x, y, n) {
        if (tier >= 2) trauma = Math.min(1, trauma + (tier === 2 ? 0.25 : 0.6));
        if (n) pops.push({ x: Math.round(x), y: Math.round(y), t: '+' + n, life: 0.9 });
        if (pops.length > 10) pops.shift();
      }
      function jingle() { [660, 880, 1320].forEach(function (f, i) { setTimeout(function () { blip(f, 0.06, 'square', 0.035); }, i * 70); }); }

      // the missions, in turn; each lap round them asks a little more
      var MISSIONS = [['drop', 'Asteroīdi', 'nogāz mērķus kreisajā malā', 2], ['planet', 'Planēta', 'trāpi planētai', 6], ['bump', 'Bumperi', 'atsitieni', 15], ['lanes', 'Lampas', 'iededz visas trīs augšā', 2]];
      function mission() { var m = MISSIONS[G.mi % MISSIONS.length]; return { key: m[0], name: m[1], what: m[2], need: Math.round(m[3] * (1 + 0.5 * Math.floor(G.mi / MISSIONS.length))) }; }
      function progress(key) {
        var m = mission(); if (m.key !== key || G.over) return;
        G.mp++;
        if (G.mp >= m.need) {
          var bonus = 5000 * (G.rank + 1); add(bonus); G.rank = Math.min(RANKS.length - 1, G.rank + 1); G.mi++; G.mp = 0; G.chase = 0.6;
          jingle(); feel(3, 200, 230, bonus * G.mul);
          say('Misija izpildīta! Rangs: ' + RANKS[G.rank]); G.sayUntil = performance.now() + 2500;
        }
        paint();
      }
      function newGame() {
        G = { score: 0, ball: 1, mul: 1, lit: [0, 0, 0], litBlink: 0, bumps: 0, flash: [0, 0, 0], kick: [0, 0], charge: 0, over: false, still: 0,
          drop: [1, 1, 1], dropAnim: [0, 0, 0], dropFlash: [0, 0, 0], dropReset: 0, planetFlash: 0, mi: 0, mp: 0, rank: 0, chase: 0, sayUntil: 0 };
        serve(); paint();
      }
      function serve() { G.x = 296; G.y = 440; G.vx = 0; G.vy = 0; G.inLane = true; G.charge = 0; }
      function say(t) { if (msgEl.textContent !== t) msgEl.textContent = t; }
      function paint() {
        w.el.querySelector('.pc98-pscore').textContent = G.score;
        w.el.querySelector('.pc98-pball').textContent = Math.min(G.ball, 3) + '/3';
        w.el.querySelector('.pc98-pmul').textContent = '×' + G.mul;
        w.el.querySelector('.pc98-prank').textContent = RANKS[G.rank];
      }
      function status() {                                         // the message line: the mission while playing
        if (performance.now() < G.sayUntil) return;
        if (G.over) return;
        if (G.inLane) { say('Atstarpe vai ↓: atspere. Z un /: plaukstiņas. X un .: pagrūst.'); return; }
        var m = mission(); say('Misija: ' + m.name + ' ' + G.mp + '/' + m.need + ' (' + m.what + ')');
      }
      function add(n) { G.score += n * G.mul; paint(); }

      // one fixed physics step (1/480 s)
      var STEP = 1 / 480, GRAV = 560, RB = 6;
      function collideSeg(x0, y0, x1, y1, e, rad) {
        var dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy, t = L ? ((G.x - x0) * dx + (G.y - y0) * dy) / L : 0;
        t = Math.max(0, Math.min(1, t));
        var qx = x0 + dx * t, qy = y0 + dy * t, nx = G.x - qx, ny = G.y - qy, d = Math.hypot(nx, ny), lim = RB + (rad || 1);
        if (d >= lim || d === 0) return null;
        nx /= d; ny /= d; G.x = qx + nx * lim; G.y = qy + ny * lim;
        var vn = G.vx * nx + G.vy * ny;
        if (vn < 0) { G.vx -= (1 + e) * vn * nx; G.vy -= (1 + e) * vn * ny; }
        return [nx, ny, qx, qy, vn];
      }
      function collideCircle(cx, cy, r) {
        var nx = G.x - cx, ny = G.y - cy, d = Math.hypot(nx, ny), lim = RB + r;
        if (d >= lim || d === 0) return null;
        nx /= d; ny /= d; G.x = cx + nx * lim; G.y = cy + ny * lim;
        return [nx, ny, G.vx * nx + G.vy * ny];
      }
      function tip(f) { var an = f.dir > 0 ? f.a : Math.PI - f.a; return [f.px + Math.cos(an) * FLEN, f.py + Math.sin(an) * FLEN]; }
      function step() {
        // flippers turn fast towards up or rest (the angle is mirrored for the right one)
        FL.forEach(function (f) {
          var target = f.up ? UP : REST, sp = 28, old = f.a;
          f.a += Math.max(-sp * STEP, Math.min(sp * STEP, target - f.a));
          f.w = (f.a - old) / STEP * f.dir;                          // + is clockwise on screen
        });
        if (G.inLane) { G.y = 440 + G.charge * 14; G.vy = 0; G.vx = 0; return; }   // on the plunger
        G.vy += GRAV * STEP;
        var sp2 = Math.hypot(G.vx, G.vy); if (sp2 > 900) { G.vx *= 900 / sp2; G.vy *= 900 / sp2; }
        G.x += G.vx * STEP; G.y += G.vy * STEP;
        WALLS.forEach(function (sgm) { collideSeg(sgm[0], sgm[1], sgm[2], sgm[3], 0.45); });
        KICK.forEach(function (kk, i) {
          var hit = collideSeg(kk[0], kk[1], kk[2], kk[3], 0.45);
          if (hit && Math.hypot(G.vx, G.vy) > 60 && G.kick[i] <= 0) { G.vx += hit[0] * 260; G.vy += hit[1] * 260; G.kick[i] = 0.12; add(10); sfx(520, 0.04, 'square', 0.035); feel(1); }
        });
        // the drop bank: a standing target is a short wall; hit, it drops into the table
        DROP.forEach(function (d, i) {
          if (!G.drop[i]) return;
          var hit = collideSeg(d[0] + DW, d[1], d[0] + DW, d[1] + DH, 0.35);
          if (hit && hit[4] < -40) {
            G.drop[i] = 0; G.dropFlash[i] = 0.035; G.dropAnim[i] = 0.07; add(250); sfx(300, 0.05, 'square', 0.04); feel(2, d[0] + 8, d[1] - 2, 250 * G.mul);
            for (var q = 0; q < 4; q++) dust.push({ x: d[0] + 1 + q, y: d[1] + DH, vy: 20 + q * 12, life: 0.1 });
            if (!G.drop[0] && !G.drop[1] && !G.drop[2]) { add(1500); G.dropReset = 1.5; feel(3, 30, 150, 1500 * G.mul); jingle(); progress('drop'); }
          }
        });
        BUMP.forEach(function (bp, i) {
          var hit = collideCircle(bp[0], bp[1], BR); if (!hit) return;
          var vn = hit[2]; G.vx += (380 - Math.min(vn, 0)) * hit[0] * 0.9; G.vy += (380 - Math.min(vn, 0)) * hit[1] * 0.9;
          if (G.flash[i] <= 0) {
            G.flash[i] = 0.06; add(100); sfx(880 + i * 90, 0.05, 'square', 0.04); feel(2, bp[0] - 8, bp[1] - BR - 12, 100 * G.mul);
            if (++G.bumps % 25 === 0) { add(2500); jingle(); feel(3, 136, 100, 2500 * G.mul); }
            progress('bump');
          }
        });
        // the planet: solid, a dull bounce, it counts its hits
        var ph = collideCircle(PLANET[0], PLANET[1], PR);
        if (ph && ph[2] < 0) {
          G.vx -= 1.6 * ph[2] * ph[0]; G.vy -= 1.6 * ph[2] * ph[1];
          if (ph[2] < -60 && G.planetFlash <= 0) { G.planetFlash = 0.08; add(75); sfx(240, 0.06, 'triangle', 0.04); feel(1, PLANET[0] - 8, PLANET[1] - PR - 10, 75 * G.mul); progress('planet'); }
        }
        FL.forEach(function (f) {
          var t = tip(f), hit = collideSeg(f.px, f.py, t[0], t[1], 0, 5);
          if (!hit) return;
          // the flipper's own speed where the ball touches: ω × r
          var rx = hit[2] - f.px, ry = hit[3] - f.py, cvx = -f.w * ry, cvy = f.w * rx;
          var rvx = G.vx - cvx, rvy = G.vy - cvy, rvn = rvx * hit[0] + rvy * hit[1];
          if (rvn < 0) { G.vx -= 1.3 * rvn * hit[0]; G.vy -= 1.3 * rvn * hit[1]; }
        });
        ROLL.forEach(function (rl, i) {
          if (!G.lit[i] && G.litBlink <= 0 && Math.abs(G.x - rl[0]) < 8 && Math.abs(G.y - rl[1]) < 9) {
            G.lit[i] = 1; add(50); sfx(1200, 0.04, 'triangle', 0.03); feel(1, rl[0] - 6, rl[1] + 8, 50 * G.mul);
            if (G.lit[0] && G.lit[1] && G.lit[2]) { G.litBlink = 0.6; G.mul = Math.min(5, G.mul + 1); add(1000); paint(); jingle(); feel(3, 132, 70, 1000); progress('lanes'); }
          }
        });
        if (G.x > 286 && G.y > 438 && G.vy > 0) { G.inLane = true; G.charge = 0; }   // fell back down the lane: onto the plunger again
        if (G.y > PH + 10) drain();
      }
      function drain() {
        blip(110, 0.4, 'sawtooth', 0.05); feel(3);
        var bonus = G.rank * 1000;
        if (bonus) { G.score += bonus; say('Bumba beigusies. Ranga bonuss +' + bonus); G.sayUntil = performance.now() + 2200; }
        G.ball++; G.mul = 1; G.lit = [0, 0, 0];
        if (G.ball > 3) { G.over = true; paint(); gameOver(); return; }
        paint(); serve();
      }
      function gameOver() {
        G.overAt = performance.now(); keys.p = false;
        var rec = G.score > best;
        if (rec) { best = G.score; try { localStorage.setItem(PIN_KEY, String(best)); } catch (_e) {} }
        if (G.rank > bestRank) { bestRank = G.rank; try { localStorage.setItem(PIN_RANK_KEY, String(bestRank)); } catch (_e) {} }
        w.el.querySelector('.pc98-pbest').textContent = best + (bestRank ? ' (' + RANKS[bestRank] + ')' : '');
        G.sayUntil = 0; say('Spēle beigusies. Rangs: ' + RANKS[G.rank] + '. ' + (rec ? 'Jauns rekords! ' : '') + 'Atstarpe: jauna spēle.');
        blip(330, 0.2, 'square', 0.04); setTimeout(function () { blip(220, 0.3, 'square', 0.04); }, 180);
      }
      function launch() {
        if (!G.inLane) return;
        G.inLane = false; G.vy = -(380 + G.charge * 520); G.vx = 0; G.charge = 0;
        blip(200, 0.1, 'sawtooth', 0.035);
      }

      // the flipper: rasterized every frame (distance to its axis, wide at the pivot, thin at the tip), its shadow first
      function drawFlipper(f, shadow) {
        var t = tip(f), o = shadow ? 2 : 0, x0 = Math.min(f.px, t[0]) - 8, x1 = Math.max(f.px, t[0]) + 8, y0 = Math.min(f.py, t[1]) - 8, y1 = Math.max(f.py, t[1]) + 8;
        var dx = t[0] - f.px, dy = t[1] - f.py, L = dx * dx + dy * dy;
        for (var y = y0 | 0; y <= y1; y++) for (var x = x0 | 0; x <= x1; x++) {
          var u = Math.max(0, Math.min(1, ((x + 0.5 - f.px) * dx + (y + 0.5 - f.py) * dy) / L));
          var d = Math.hypot(x + 0.5 - f.px - dx * u, y + 0.5 - f.py - dy * u), rad = 6 - u * 3;
          if (d <= rad) { g.fillStyle = shadow ? PAL.shade : d > rad - 1.3 ? PAL.ink : (u < 0.15 ? PAL.yellow : PAL.orange); g.fillRect(x + o, y + o, 1, 1); }
        }
      }
      function draw(dt) {
        trauma = Math.max(0, trauma - (dt || 0) * 1.6); shakeT += (dt || 0) * 30;
        var sh = trauma * trauma, ox = Math.round(3 * sh * Math.sin(shakeT * 1.7)), oy = Math.round(2 * sh * Math.sin(shakeT * 2.3));
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (ox || oy) { g.fillStyle = '#000'; g.fillRect(0, 0, PW, PH); }
        g.setTransform(1, 0, 0, 1, ox, oy);
        g.drawImage(bg, 0, 0);
        // the lanes' lamps: dark red unlit, yellow lit; all three blink together when done
        var blinkOn = G.litBlink > 0 && ((G.litBlink * 10) | 0) % 2 === 0;
        ROLL.forEach(function (rl, i) { R(g, rl[0] - 5, rl[1] - 3, 10, 6, PAL.ink); R(g, rl[0] - 4, rl[1] - 2, 8, 4, G.litBlink > 0 ? (blinkOn ? '#ffffff' : PAL.yellow) : G.lit[i] ? PAL.yellow : PAL.dark); });
        // the drop bank: standing targets, a white flash when hit, then they sink a row at a time
        DROP.forEach(function (d, i) {
          if (G.drop[i]) { R(g, d[0] + 1, d[1] + 1, DW, DH, PAL.shade); R(g, d[0], d[1], DW, DH, PAL.ink); R(g, d[0] + 1, d[1] + 1, DW - 2, DH - 2, PAL.orange); R(g, d[0] + 1, d[1] + 1, DW - 2, 2, PAL.yellow); }
          else if (G.dropFlash[i] > 0) R(g, d[0], d[1], DW, DH, '#ffffff');
          else if (G.dropAnim[i] > 0) { var hh = Math.max(1, Math.round(DH * G.dropAnim[i] / 0.07)); R(g, d[0], d[1] + DH - hh, DW, hh, PAL.dark); }
          else R(g, d[0], d[1] + DH - 2, DW, 2, PAL.dark);
        });
        dust.forEach(function (p) { R(g, p.x, p.y, 1, 1, PAL.wall); });
        if (G.planetFlash > 0) { disc(g, PLANET[0], PLANET[1], PR, '#ffffff'); }
        // the planet's ring; after a mission a white marquee runs round it
        RING.forEach(function (p, i) { var on = G.chase > 0 && ((i + Math.floor((0.6 - G.chase) * 60)) % 8) < 3; R(g, p[0], p[1], 2, 2, on ? '#ffffff' : PAL.yellow); });
        BUMP.forEach(function (bp, i) { g.drawImage(bumpS[G.flash[i] > 0 ? 1 : 0], bp[0] - BR, bp[1] - BR); });
        KICK.forEach(function (kk, i) { if (G.kick[i] > 0) line(g, kk[0], kk[1], kk[2], kk[3], '#ffffff', 3); });
        FL.forEach(function (f) { drawFlipper(f, true); });
        FL.forEach(function (f) { drawFlipper(f, false); });
        // the plunger, pulled down while held, and its gauge on the apron: eight cells filling
        var pz = 452 + Math.round(G.charge * 14);
        R(g, 291, pz, 10, 4, PAL.red); R(g, 294, pz + 4, 4, 470 - pz, PAL.wall);
        var cells = Math.round(G.charge * 8);
        for (var c = 0; c < 8; c++) R(g, 226 + c * 6 + 1, 458, 4, 6, c < cells ? (c < 5 ? PAL.yellow : c < 7 ? PAL.orange : PAL.red) : '#1c2660');
        // the rank lamps on the apron
        for (c = 0; c < RANKS.length - 1; c++) R(g, 226 + c * 10, 470, 6, 4, c < G.rank ? PAL.yellow : PAL.dark);
        g.drawImage(ballS, Math.round(G.x) - 6, Math.round(G.y) - 6);
        // "+100" in 3×5 pixel digits at 2×, rising in whole pixels, blinking off at the end
        pops.forEach(function (p) {
          p.life -= dt || 0;
          if (p.life > 0 && (p.life > 0.2 || ((p.life * 40) | 0) % 2)) { var yy = p.y - Math.round((0.9 - p.life) * 16); text(g, p.t, p.x + 1, yy + 1, '#000', 2); text(g, p.t, p.x, yy, '#ffffff', 2); }
        });
        pops = pops.filter(function (p) { return p.life > 0; });
      }
      function frame(now) {
        raf = 0;
        if (!wins.pinball) return;
        var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
        if (!G.over) {
          if (G.inLane && keys.p) G.charge = Math.min(1, G.charge + dt * 1.6);
          acc += dt;
          while (acc >= STEP) { step(); acc -= STEP; if (G.over) break; }
          for (var i = 0; i < 3; i++) { G.flash[i] -= dt; G.dropFlash[i] -= dt; if (G.dropFlash[i] <= 0) G.dropAnim[i] -= dt; }
          G.kick[0] -= dt; G.kick[1] -= dt; G.planetFlash -= dt; G.chase = Math.max(0, G.chase - dt);
          if (G.litBlink > 0) { G.litBlink -= dt; if (G.litBlink <= 0) G.lit = [0, 0, 0]; }
          if (G.dropReset > 0) { G.dropReset -= dt; if (G.dropReset <= 0) { G.drop = [1, 1, 1]; sfx(500, 0.05, 'square', 0.03); } }
          dust.forEach(function (p) { p.y += p.vy * dt; p.life -= dt; }); dust = dust.filter(function (p) { return p.life > 0; });
          // a ball resting somewhere with no way out gets a nudge
          if (!G.inLane && Math.hypot(G.vx, G.vy) < 8) { G.still += dt; if (G.still > 2.5) { G.vy = -260; G.vx = (Math.random() - 0.5) * 120; G.still = 0; } } else G.still = 0;
          status();
        }
        draw(dt);
        raf = requestAnimationFrame(frame);
      }

      // the keys: the computer's own Esc handler stays; these only for the table
      function setKey(e, down) {
        if (!wins.pinball || wins.pinball.el.classList.contains('is-off')) return;
        var c = e.code, hit = true;
        if (c === 'KeyZ' || c === 'ShiftLeft' || c === 'ArrowLeft') { if (down && !keys.l) sfx(160, 0.04, 'square', 0.03); keys.l = down; FL[0].up = down; }
        else if (c === 'Slash' || c === 'ShiftRight' || c === 'ArrowRight' || c === 'KeyM') { if (down && !keys.r) sfx(170, 0.04, 'square', 0.03); keys.r = down; FL[1].up = down; }
        else if ((c === 'KeyX' || c === 'Period') && down) {                // a nudge, as on the real table: once in a while
          if (!G.inLane && !G.over && (G.nudgeAt || 0) < performance.now() - 700) { G.nudgeAt = performance.now(); G.vx += c === 'KeyX' ? 70 : -70; G.vy -= 40; trauma = Math.min(1, trauma + 0.35); sfx(90, 0.08, 'square', 0.04); }
        }
        else if (c === 'Space' || c === 'ArrowDown' || c === 'Enter') {
          if (down && G.over) { if (performance.now() - G.overAt > 1500) newGame(); } else if (!down && keys.p) launch();   // a held plunger key at the end does not start the next game
          keys.p = down;
        } else hit = false;
        if (hit) e.preventDefault();
      }
      var kd = function (e) { if (!e.repeat) setKey(e, true); else if (/^(Space|ArrowDown|Slash|KeyZ)$/.test(e.code)) e.preventDefault(); };
      var ku = function (e) { setKey(e, false); };
      window.addEventListener('keydown', kd, true);
      window.addEventListener('keyup', ku, true);
      // the mouse: left button the left flipper, right button the right one; on the plunger both pull it
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      cv.addEventListener('pointerdown', function (e) {
        e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_e) {}
        if (G.over) { if (performance.now() - G.overAt > 1500) newGame(); return; }
        if (G.inLane) { keys.p = true; return; }
        var r = cv.getBoundingClientRect(), right = e.pointerType === 'mouse' ? e.button === 2 : e.clientX > r.left + r.width / 2;
        var f = FL[right ? 1 : 0]; f.up = true; f.ptr = e.pointerId; sfx(right ? 170 : 160, 0.04, 'square', 0.03);
      });
      var up = function (e) {
        if (keys.p) { keys.p = false; launch(); }
        FL.forEach(function (f) { if (f.ptr === e.pointerId || e.pointerType === 'mouse') { f.up = false; f.ptr = null; } });
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);

      w.onClose = function () { if (raf) cancelAnimationFrame(raf); raf = 0; window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); };
      newGame();
      raf = requestAnimationFrame(frame);
    }

    var OPEN = { candy: candy, chronicle: chronicle, mypc: mypc, bin: bin, mines: mines, pinball: pinball, music: music, settings: settings };
    desk.addEventListener('dblclick', function (e) { var b = e.target.closest('[data-open]'); if (b) OPEN[b.dataset.open](); });
    desk.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open]');
      desk.querySelectorAll('.pc98-icon').forEach(function (x) { x.classList.toggle('is-sel', x === b); });
      if (b && !matchMedia('(pointer: fine)').matches) OPEN[b.dataset.open]();   // a touch: one tap opens
    });
    var sm = $('.pc98-startmenu');
    $('.pc98-start').addEventListener('click', function (e) { e.stopPropagation(); sm.hidden = !sm.hidden; $('.pc98-start').classList.toggle('is-on', !sm.hidden); });
    sm.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      sm.hidden = true; $('.pc98-start').classList.remove('is-on');
      if (b.dataset.act === 'off') close(); else OPEN[b.dataset.open]();
    });
    root.addEventListener('pointerdown', function (e) { if (!e.target.closest('.pc98-startmenu, .pc98-start')) { sm.hidden = true; $('.pc98-start').classList.remove('is-on'); } }, true);
    function tickClock() { var d = new Date(); $('.pc98-clock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    tickClock(); var clock = setInterval(tickClock, 15000);
    // the keys stay here; Esc closes the window in front, then the computer
    function onKey(e) {
      e.stopPropagation();
      var fb = e.target && e.target.closest && e.target.closest('.pc98-win button');   // Space never presses a game's button
      if ((e.key === ' ' || e.code === 'Space') && fb && !inDialog(fb)) e.preventDefault();
      if (e.key === 'Escape') { e.preventDefault(); var ids = Object.keys(wins); if (ids.length) { var top = ids.reduce(function (a, b) { return +wins[a].el.style.zIndex > +wins[b].el.style.zIndex ? a : b; }); closeWin(top); } else close(); }
      else if (e.key === 'Enter') { var d = root.querySelector('.pc98-win:last-child .pc98-btn.is-default'); if (d) { e.preventDefault(); d.click(); } }
    }
    function swallow(e) { e.stopPropagation(); }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', swallow, true);
    function close() {
      if (!openNow) return;
      Object.keys(wins).forEach(closeWin);
      clearInterval(clock);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', swallow, true);
      if (window.MinkaDitherBackdrop) window.MinkaDitherBackdrop.detach(root);
      root.remove(); openNow = null;
      if (window.MinkaGallery3D && window.MinkaGallery3D.pause) window.MinkaGallery3D.pause(false);
      if (opts.onClose) opts.onClose();
    }
    // the boot screen, then the day's error and (the first time today) the new chapter
    if (opts.solo) {                                                // the arcade: straight into the game, the gallery's dither round it
      $('.pc98-boot').remove();
      (OPEN[opts.app] || candy)();
      var game = wins[opts.app] || wins.candy;
      if (window.MinkaDitherBackdrop && game) window.MinkaDitherBackdrop.attach(root, { box: game.el });
      openNow = { close: close };
      return openNow;
    }
    setTimeout(function () {
      var bt = $('.pc98-boot'); if (bt) bt.remove();
      if (opts.app && OPEN[opts.app]) { OPEN[opts.app](); return; }   // from the arcade machine: straight into the game
      var seenKey = 'minkaChronicleSeen';
      var seen = ''; try { seen = localStorage.getItem(seenKey) || ''; } catch (_e) {}
      if (seen !== today) { try { localStorage.setItem(seenKey, today); } catch (_e) {} chronicle(); }
      var e = ERRORS[seedOf(today) % ERRORS.length];
      dialog(e[0], e[1], e[0] === 'Kļūda!' ? 'err' : 'info');      // the day's message, on top
      blip(330, 0.12, 'triangle', 0.05); setTimeout(function () { blip(495, 0.16, 'triangle', 0.05); }, 110);
    }, 900);
    openNow = { close: close };
    return openNow;
  }

  window.MinkaGalleryPC = { open: open, isOpen: function () { return !!openNow; } };
})();
