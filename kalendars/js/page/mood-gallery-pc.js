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
    else if (kind === 'face' || kind === 'faceWin' || kind === 'faceDead') {                 // the minesweeper's face: a black cat
      R(6, 4, 4, 7, '#1d1a22'); R(22, 4, 4, 7, '#1d1a22'); R(6, 9, 20, 17, '#1d1a22'); R(4, 12, 24, 11, '#1d1a22');
      if (kind === 'faceWin') { R(8, 13, 7, 4, '#000'); R(17, 13, 7, 4, '#000'); R(9, 14, 2, 1, '#888'); R(18, 14, 2, 1, '#888'); R(15, 14, 2, 1, '#000'); }
      else if (kind === 'faceDead') { R(10, 13, 1, 1, '#d7dd55'); R(12, 15, 1, 1, '#d7dd55'); R(12, 13, 1, 1, '#d7dd55'); R(10, 15, 1, 1, '#d7dd55'); R(11, 14, 1, 1, '#d7dd55'); R(20, 13, 1, 1, '#d7dd55'); R(22, 15, 1, 1, '#d7dd55'); R(22, 13, 1, 1, '#d7dd55'); R(20, 15, 1, 1, '#d7dd55'); R(21, 14, 1, 1, '#d7dd55'); }
      else { R(9, 13, 4, 4, '#d7dd55'); R(19, 13, 4, 4, '#d7dd55'); R(10, 14, 2, 2, '#000'); R(20, 14, 2, 2, '#000'); }
      R(15, 19, 2, 2, '#ff8a9a');
    }
    else if (kind === 'trophy') { R(9, 4, 14, 10, '#ffcf3a'); R(11, 14, 10, 3, '#ffcf3a'); R(14, 17, 4, 5, '#d9a21a'); R(10, 22, 12, 4, '#d9a21a'); R(5, 5, 4, 6, '#ffcf3a'); R(23, 5, 4, 6, '#ffcf3a'); }
    var big = canvas(n, n), bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, n, n);
    return (iconCache[key] = big.toDataURL('image/png'));
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
    try { root.dataset.wall = localStorage.getItem(WALL_KEY) || 'vapor'; } catch (_e) { root.dataset.wall = 'vapor'; }
    if (window.MinkaGallery3D && window.MinkaGallery3D.pause) window.MinkaGallery3D.pause(true);

    // the desktop's icons
    var desk = $('.pc98-desk');
    [['candy', 'candy', 'Konfektes 98'], ['mines', 'mine', 'Mīnas 98'], ['music', 'music', 'Mūzika 98'], ['chronicle', 'note', 'Hronika.txt'], ['mypc', 'pc', 'Mans dators'], ['settings', 'gear', 'Iestatījumi'], ['bin', 'bin', 'Atkritumi']].forEach(function (d) {
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
      if (opts.solo && id === 'candy') { close(); return; }         // from the arcade: the game is all there is
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
    function candy() {
      if (wins.candy) { front('candy'); return; }
      var rr0 = root.getBoundingClientRect();
      CELL = Math.max(36, Math.min(80, Math.floor(Math.min(rr0.width - 60, rr0.height - 212) / N)));
      var size = N * CELL;
      var w = win('candy', 'Konfektes 98', 'candy',
        '<div class="pc98-candy"><div class="pc98-cbar"><span>Punkti <b class="pc98-score">0</b></span><span>Gājieni <b class="pc98-moves">' + MOVES + '</b></span>'
        + '<span class="pc98-goal" title="Dienas mērķis"><i class="pc98-gico"></i><b class="pc98-gnum">0/0</b></span><span class="pc98-jelly" title="Želeja"><i class="pc98-jico"></i><b class="pc98-jnum">0</b></span></div>'
        + '<div class="pc98-stars"><i class="pc98-sfill"></i><b data-s="0">★</b><b data-s="1">★</b><b data-s="2">★</b></div>'
        + '<div class="pc98-well"><canvas class="pc98-board" width="' + size + '" height="' + size + '"></canvas></div>'
        + '<div class="pc98-cfoot"><button type="button" class="pc98-btn" data-c="new">Jauna spēle</button><button type="button" class="pc98-btn" data-c="table">Dienas tabula</button><button type="button" class="pc98-btn" data-c="help">Kā spēlēt?</button><button type="button" class="pc98-btn pc98-mbtn" data-c="music" title="Mūzika">♪</button><span class="pc98-hint">Rekords šodien: <b class="pc98-best">0</b></span></div></div>',
        size + 34, Math.max(100, (rr0.width - size - 34) / 2), Math.max(6, (rr0.height - size - 192) / 2));
      var cv = w.el.querySelector('.pc98-board'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      var G = {}, anim = [], fx = { parts: [], floats: [], beams: [], rings: [], bubbles: [], flash: 0, shake: 0, word: null, stopUntil: 0 }, raf = 0, busy = false, sel = null, drag = null;
      var hint = null, idleAt = performance.now(), swapOff = null;
      var best = 0; try { var b0 = JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); best = b0.day === today ? b0.score : 0; } catch (_e) {}
      w.el.querySelector('.pc98-best').textContent = best;
      function newGame() {
        var r = rng(seedOf('candy:' + today));
        G = { rnd: r, board: [], score: 0, moves: MOVES, over: false, chain: 0, goal: { t: (seedOf('goal:' + today) % 6), need: 24, got: 0, done: false }, stars: 0 };
        // the day's jelly: a mirrored patch under the pieces; matching on it clears it (+2000 for all)
        var jr = rng(seedOf('jelly:' + today)); G.jelly = []; G.jellyLeft = 0; G.jellyDone = false;
        for (var jy = 0; jy < N; jy++) { G.jelly.push([]); for (var jx = 0; jx < N; jx++) G.jelly[jy].push(0); }
        for (jy = 1; jy < N - 1; jy++) for (jx = 0; jx < N / 2; jx++) if (jr() < (jy > 2 && jy < 6 ? 0.55 : 0.25)) { G.jelly[jy][jx] = G.jelly[jy][N - 1 - jx] = 1; }
        G.jelly.forEach(function (row) { row.forEach(function (v) { G.jellyLeft += v; }); });
        for (var y = 0; y < N; y++) { G.board.push([]); for (var x = 0; x < N; x++) G.board[y].push(fresh(x, y, true)); }
        if (!hasMove()) shuffle();
        fx.parts = []; fx.floats = []; fx.beams = []; fx.rings = []; fx.bubbles = []; fx.word = null; hint = null; idleAt = performance.now();
        w.el.querySelector('.pc98-gico').style.backgroundImage = 'url(' + PIECES[G.goal.t].toDataURL() + ')';
        paintBar(); draw();
      }
      function fresh(x, y, noMatch) {
        var t, guard = 0;
        do { t = (G.rnd() * 6) | 0; guard++; } while (noMatch && guard < 20 && ((x >= 2 && G.board[y][x - 1].t === t && G.board[y][x - 2].t === t) || (y >= 2 && G.board[y - 1][x].t === t && G.board[y - 2][x].t === t)));
        var c = { t: t, s: '', dy: 0, k: 1, a: 1, sq: 0 };
        if (!noMatch && G.rnd() < 0.022) c.gold = true;             // now and then a golden cup (+2 moves)
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
        if (got > G.stars) { G.stars = got; blip(988 + got * 120, 0.12, 'triangle', 0.05); setTimeout(function () { blip(1318 + got * 120, 0.14, 'triangle', 0.045); }, 90); }
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
          if (G.jelly[c[1]][c[0]]) { G.jelly[c[1]][c[0]] = 0; G.jellyLeft--; gain += 50; for (var jb = 0; jb < 6; jb++) burst(c[0], c[1], '#ff9ad2', 1); }
          var p = G.board[c[1]][c[0]];
          if (!spawnAt[c[0] + ',' + c[1]] && p.t === G.goal.t) G.goal.got++;
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
      function floatText(x, y, text, col, scale) { fx.floats.push({ x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, text: text, col: col, s: scale || 1, life: 1 }); kick(); }
      function word(i) { fx.word = { text: i < 0 ? 'Saldais finālis!' : WORDS[Math.max(0, Math.min(WORDS.length - 1, i))], life: 1 }; kick(); }
      function fxActive() { return fx.parts.length || fx.floats.length || fx.beams.length || fx.rings.length || fx.bubbles.length || fx.flash > 0 || fx.shake > 0.01 || fx.word || hint; }
      function kick() { if (!raf) raf = requestAnimationFrame(tick); }

      /* ── drawing (only while something moves, sparks fly or a hint shows) ── */
      function draw(now) {
        now = now || performance.now();
        var sh = fx.shake * fx.shake * 7, ox = sh ? Math.sin(now * 0.09) * sh : 0, oy = sh ? Math.cos(now * 0.11) * sh : 0;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = '#efe6fb'; g.fillRect(0, 0, size, size);
        g.setTransform(1, 0, 0, 1, ox, oy);
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) & 1) { g.fillStyle = '#e4d8f6'; g.fillRect(x * CELL, y * CELL, CELL, CELL); }
        for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (G.jelly[y][x]) {   // jelly: a soft pink tile with a shine
          var jx0 = x * CELL + 2, jy0 = y * CELL + 2, js = CELL - 4;
          var jg = g.createLinearGradient(0, jy0, 0, jy0 + js); jg.addColorStop(0, 'rgba(255,170,215,.85)'); jg.addColorStop(1, 'rgba(240,110,180,.75)');
          g.fillStyle = jg; g.beginPath(); g.roundRect(jx0, jy0, js, js, CELL * 0.18); g.fill();
          g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.roundRect(jx0 + js * 0.12, jy0 + js * 0.08, js * 0.5, js * 0.14, js * 0.07); g.fill();
        }
        if (sel) { g.fillStyle = 'rgba(122,92,255,.28)'; g.fillRect(sel[0] * CELL, sel[1] * CELL, CELL, CELL); }
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
        if (hint) {                                                   // a soft ring round the two pieces of the hinted move
          g.strokeStyle = 'rgba(255,255,255,' + (0.55 + Math.sin(now / 140) * 0.35) + ')'; g.lineWidth = 3;
          var hx = Math.min(hint[0], hint[2]) * CELL + 3, hy = Math.min(hint[1], hint[3]) * CELL + 3;
          g.strokeRect(hx, hy, (Math.abs(hint[2] - hint[0]) + 1) * CELL - 6, (Math.abs(hint[3] - hint[1]) + 1) * CELL - 6);
        }
        // light: added on top ('lighter'), so it glows over the candy
        g.globalCompositeOperation = 'lighter';
        fx.bubbles.forEach(function (b) {
          var cx = (b.x + 0.5) * CELL, cy = (b.y + 0.5) * CELL, r = CELL * (0.35 + (1 - b.life) * 0.25);
          var gb = g.createRadialGradient(cx, cy, 0, cx, cy, r); gb.addColorStop(0, 'rgba(255,255,255,' + (0.95 * b.life) + ')'); gb.addColorStop(0.55, 'rgba(255,240,255,' + (0.6 * b.life) + ')'); gb.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gb; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
        });
        fx.beams.forEach(function (b) {
          var L = Math.max(0, b.life);
          if (b.kind === 'row' || b.kind === 'col') {
            var horiz = b.kind === 'row', mid = (b.i + 0.5) * CELL, half = CELL * 0.5 * L;
            var gr = horiz ? g.createLinearGradient(0, mid - half, 0, mid + half) : g.createLinearGradient(mid - half, 0, mid + half, 0);
            gr.addColorStop(0, 'rgba(120,180,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + L + ')'); gr.addColorStop(1, 'rgba(255,120,210,0)');
            g.fillStyle = gr; if (horiz) g.fillRect(0, mid - half, size, half * 2); else g.fillRect(mid - half, 0, half * 2, size);
          } else {                                                    // lightning from the bomb: a jagged bolt, new each frame
            var x0 = (b.p[0] + 0.5) * CELL, y0 = (b.p[1] + 0.5) * CELL, x1 = (b.p[2] + 0.5) * CELL, y1 = (b.p[3] + 0.5) * CELL;
            var segs = 7, nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
            [[6, 'rgba(150,120,255,' + (0.45 * L) + ')'], [2.2, 'rgba(255,255,255,' + L + ')']].forEach(function (st) {
              g.strokeStyle = st[1]; g.lineWidth = st[0]; g.beginPath(); g.moveTo(x0, y0);
              for (var k = 1; k < segs; k++) { var f = k / segs, j2 = (Math.random() - 0.5) * CELL * 0.45; g.lineTo(x0 + (x1 - x0) * f + nx * j2, y0 + (y1 - y0) * f + ny * j2); }
              g.lineTo(x1, y1); g.stroke();
            });
          }
        });
        fx.rings.forEach(function (r) {
          var L = Math.max(0, r.life), rad = (r.r + 0.5) * CELL * (1.25 - L * 0.6), cx = (r.x + 0.5) * CELL, cy = (r.y + 0.5) * CELL;
          var gr2 = g.createRadialGradient(cx, cy, rad * 0.6, cx, cy, rad); gr2.addColorStop(0, 'rgba(255,210,63,0)'); gr2.addColorStop(0.8, 'rgba(255,230,140,' + L + ')'); gr2.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr2; g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.fill();
        });
        fx.parts.forEach(function (p) {
          g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.star ? '#fff6c8' : p.col;
          if (p.star) { var m = p.s + 1; g.fillRect(p.x - m, p.y, m * 2 + 1, 1); g.fillRect(p.x, p.y - m, 1, m * 2 + 1); g.fillRect(p.x - 1, p.y - 1, 3, 3); }
          else g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
        });
        g.globalCompositeOperation = 'source-over';
        // the points of each cleared piece, in its glow
        g.textAlign = 'center'; g.textBaseline = 'middle';
        fx.bubbles.forEach(function (b) {
          if (b.life < 0.15) return;
          g.globalAlpha = Math.min(1, b.life * 1.4); g.font = '900 ' + Math.round(CELL * 0.28) + 'px Tahoma, sans-serif';
          g.fillStyle = '#7a3fd0'; g.fillText(b.n, (b.x + 0.5) * CELL, (b.y + 0.5) * CELL - (1 - b.life) * 6);
        });
        g.globalAlpha = 1;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        fx.floats.forEach(function (f) {
          g.globalAlpha = Math.min(1, f.life * 1.6);
          g.font = '900 ' + Math.round(CELL * 0.36 * f.s) + 'px Tahoma, sans-serif';
          g.fillStyle = '#2a1d48'; g.fillText(f.text, f.x + 2, f.y + 2); g.fillStyle = f.col; g.fillText(f.text, f.x, f.y);
        });
        if (fx.word) {
          var wl = fx.word.life, ws = wl > 0.8 ? backOut((1 - wl) / 0.2) : 1;
          g.globalAlpha = Math.min(1, wl * 2.5);
          g.font = '900 ' + Math.round(CELL * 0.85 * ws) + 'px Tahoma, sans-serif';
          g.lineWidth = 6; g.strokeStyle = '#2a1d48'; g.strokeText(fx.word.text, size / 2, size * 0.42);
          var gr = g.createLinearGradient(0, size * 0.36, 0, size * 0.48); gr.addColorStop(0, '#ffe0f0'); gr.addColorStop(1, '#ff5fb0');
          g.fillStyle = gr; g.fillText(fx.word.text, size / 2, size * 0.42);
        }
        g.globalAlpha = 1;
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (fx.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + fx.flash + ')'; g.fillRect(0, 0, size, size); }
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
        if (c.gold) { g.fillStyle = 'rgba(255,207,58,' + (0.35 + Math.sin(now / 200) * 0.15) + ')'; g.beginPath(); g.arc(px + CELL / 2, py + CELL / 2, CELL * 0.46, 0, Math.PI * 2); g.fill(); }
        if (c.t < 0) {                                                // the MR bomb: a dark disc with the six colours turning round it
          var cx = px + CELL / 2, cy = py + CELL / 2, r = sw / 2;
          g.fillStyle = '#1b1530'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
          for (var i = 0; i < 6; i++) { var an = now / 400 + i * Math.PI / 3; g.fillStyle = PCOL[i]; g.beginPath(); g.arc(cx + Math.cos(an) * r * 0.58, cy + Math.sin(an) * r * 0.58, r * 0.2, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = '#fff'; g.font = '900 ' + Math.round(r * 0.6) + 'px Tahoma, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MR', cx, cy + 1);
        } else {
          if (c.s === 'w') {                                          // wrapped: a pink-and-yellow wrapper with twists at the sides
            g.fillStyle = '#ff9ad2'; g.fillRect(px + ox - sw * 0.08, py + oy + shh * 0.1, sw * 1.16, shh * 0.8);
            g.fillStyle = '#ffd23f'; for (var j = 0; j < 4; j++) g.fillRect(px + ox + j * sw / 4, py + oy + shh * 0.1, sw / 8, shh * 0.8);
            g.fillStyle = '#ff5fb0'; g.beginPath(); g.moveTo(px + ox - sw * 0.08, py + oy + shh / 2); g.lineTo(px + ox - sw * 0.28, py + oy + shh * 0.2); g.lineTo(px + ox - sw * 0.28, py + oy + shh * 0.8); g.fill();
            g.beginPath(); g.moveTo(px + ox + sw * 1.08, py + oy + shh / 2); g.lineTo(px + ox + sw * 1.28, py + oy + shh * 0.2); g.lineTo(px + ox + sw * 1.28, py + oy + shh * 0.8); g.fill();
            g.drawImage(PIECES[c.t], px + ox + sw * 0.15, py + oy + shh * 0.15, sw * 0.7, shh * 0.7);
          } else if (c.s === 'h' || c.s === 'v') {                    // an X-ray: the candy itself striped, a soft glow round it
            var gl = g.createRadialGradient(px + CELL / 2, py + CELL / 2, 2, px + CELL / 2, py + CELL / 2, CELL * 0.5);
            gl.addColorStop(0, 'rgba(255,255,255,.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gl; g.fillRect(px, py, CELL, CELL);
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
        fx.rings.forEach(function (r) { r.life -= dt * 2.4; }); fx.rings = fx.rings.filter(function (r) { return r.life > 0; });
        fx.bubbles.forEach(function (b) { b.life -= dt * 2.2; }); fx.bubbles = fx.bubbles.filter(function (b) { return b.life > 0; });
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
        if (!drag || busy) return;
        var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y, r = cv.getBoundingClientRect(), th = r.width / N * 0.35;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
        var c = drag.c, t = Math.abs(dx) > Math.abs(dy) ? [c[0] + Math.sign(dx), c[1]] : [c[0], c[1] + Math.sign(dy)];
        drag = null; sel = null;
        if (t[0] >= 0 && t[1] >= 0 && t[0] < N && t[1] < N) trySwap(c[0], c[1], t[0], t[1]); else kick();
      });
      cv.addEventListener('pointerup', function () { drag = null; });
      w.el.querySelector('[data-c="new"]').addEventListener('click', function () { if (!busy) newGame(); });
      w.el.querySelector('[data-c="table"]').addEventListener('click', function () { table(); });
      w.el.querySelector('[data-c="help"]').addEventListener('click', help);
      var tune = null, tuneGain = null, tuneOn = !!opts.solo;
      function tuneStart() {
        if (tune) return;
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        tuneGain = tuneGain || (function () { var gn = actx.createGain(); gn.gain.value = 0.5; gn.connect(actx.destination); return gn; })();
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
      var WALLS = [['vapor', 'Vaporwave'], ['teal', 'Klasiskā zaļganzilā'], ['sunset', 'Saulriets'], ['grid', 'Sintvilnis']];
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
    var MINE_LEVELS = [['Iesācējs', 9, 9, 10], ['Vidējs', 16, 16, 40], ['Eksperts', 30, 16, 99]], MINE_KEY = 'minkaMinesBestV1';
    function mines() {
      if (wins.mines) { front('mines'); return; }
      var lv = 0, M, timer = 0, tStart = 0;
      var w = win('mines', 'Mīnas 98', 'mine', '<nav class="pc98-menu pc98-mlevels">' + MINE_LEVELS.map(function (l, i) { return '<button type="button" data-lv="' + i + '">' + l[0] + '</button>'; }).join('') + '</nav>'
        + '<div class="pc98-mines"><div class="pc98-mtop"><span class="pc98-led pc98-mleft">010</span><button type="button" class="pc98-face">' + img('face', 26) + '</button><span class="pc98-led pc98-mtime">000</span></div><div class="pc98-mgrid"></div></div>', 260, 160, 30);
      var grid = w.el.querySelector('.pc98-mgrid'), face = w.el.querySelector('.pc98-face');
      var led = function (n) { n = Math.max(-99, Math.min(999, n | 0)); return (n < 0 ? '-' + String(-n).padStart(2, '0') : String(n).padStart(3, '0')); };
      var setFace = function (k) { face.innerHTML = img(k, 26); };
      function start(i) {
        lv = i; var L = MINE_LEVELS[lv];
        M = { w: L[1], h: L[2], n: L[3], cells: [], placed: false, over: false, open: 0, flags: 0 };
        for (var k = 0; k < M.w * M.h; k++) M.cells.push({ mine: false, open: false, flag: false, near: 0 });
        clearInterval(timer); timer = 0; tStart = 0;
        w.el.querySelector('.pc98-mtime').textContent = '000';
        w.el.style.width = (M.w * 24 + 34) + 'px';
        grid.style.gridTemplateColumns = 'repeat(' + M.w + ', 24px)';
        grid.innerHTML = M.cells.map(function (_c, k) { return '<i data-k="' + k + '"></i>'; }).join('');
        w.el.querySelectorAll('[data-lv]').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.lv === lv); });
        setFace('face'); paintLeft();
      }
      function around(k, fn) { var x = k % M.w, y = (k / M.w) | 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < M.w && ny < M.h) fn(ny * M.w + nx); } }
      function place(safe) {                                        // the first click is never a mine, nor its neighbours
        var keep = { }; keep[safe] = 1; around(safe, function (n) { keep[n] = 1; });
        var free = []; for (var k = 0; k < M.cells.length; k++) if (!keep[k]) free.push(k);
        for (var i = 0; i < M.n; i++) { var j = i + ((Math.random() * (free.length - i)) | 0), t = free[i]; free[i] = free[j]; free[j] = t; M.cells[free[i]].mine = true; }
        M.cells.forEach(function (c, k) { around(k, function (n) { if (M.cells[n].mine) c.near++; }); });
        M.placed = true; tStart = Date.now();
        timer = setInterval(function () { w.el.querySelector('.pc98-mtime').textContent = led((Date.now() - tStart) / 1000); }, 500);
      }
      function paintCell(k) {
        var c = M.cells[k], e = grid.children[k];
        e.className = c.open ? 'is-open' + (c.mine ? ' is-boom' : '') : c.flag ? 'is-flag' : '';
        e.textContent = c.open && !c.mine && c.near ? c.near : '';
        if (c.open && c.near) e.dataset.n = c.near;
      }
      function paintLeft() { w.el.querySelector('.pc98-mleft').textContent = led(M.n - M.flags); }
      function reveal(k) {
        var stack = [k];
        while (stack.length) {
          var i = stack.pop(), c = M.cells[i];
          if (c.open || c.flag) continue;
          c.open = true; M.open++; paintCell(i);
          if (!c.mine && !c.near) around(i, function (n) { if (!M.cells[n].open) stack.push(n); });
        }
      }
      function lose(k) {
        M.over = true; clearInterval(timer); setFace('faceDead'); blip(120, 0.3, 'sawtooth', 0.06);
        M.cells.forEach(function (c, i) { if (c.mine) { c.open = true; paintCell(i); } else if (c.flag) grid.children[i].className = 'is-wrong'; });
        grid.children[k].classList.add('is-hit');
      }
      function checkWin() {
        if (M.open !== M.cells.length - M.n) return;
        M.over = true; clearInterval(timer); setFace('faceWin');
        M.cells.forEach(function (c, i) { if (c.mine && !c.flag) { c.flag = true; paintCell(i); } }); M.flags = M.n; paintLeft();
        var secs = Math.round((Date.now() - tStart) / 1000), best = {};
        try { best = JSON.parse(localStorage.getItem(MINE_KEY) || '{}') || {}; } catch (_e) {}
        var record = !best[lv] || secs < best[lv];
        if (record) { best[lv] = secs; try { localStorage.setItem(MINE_KEY, JSON.stringify(best)); } catch (_e) {} }
        blip(660, 0.15, 'triangle', 0.06); setTimeout(function () { blip(990, 0.2, 'triangle', 0.06); }, 140);
        dialog('Mīnas 98', (record ? 'Jauns rekords! ' : '') + MINE_LEVELS[lv][0] + ': ' + secs + ' s. Labākais: ' + best[lv] + ' s.', 'info');
      }
      function open1(k) {
        var c = M.cells[k]; if (M.over || c.flag) return;
        if (!M.placed) place(k);
        if (c.open) {                                               // a number with its flags around it: open the rest
          var f = 0; around(k, function (n) { if (M.cells[n].flag) f++; });
          if (c.near && f === c.near) around(k, function (n) { var d = M.cells[n]; if (!d.open && !d.flag) { if (d.mine) { reveal(n); lose(n); } else reveal(n); } });
        } else if (c.mine) { reveal(k); lose(k); return; }
        else { reveal(k); blip(700, 0.02, 'square', 0.02); }
        if (!M.over) checkWin();
      }
      function flag(k) {
        var c = M.cells[k]; if (M.over || c.open) return;
        c.flag = !c.flag; M.flags += c.flag ? 1 : -1; paintCell(k); paintLeft(); blip(c.flag ? 900 : 500, 0.03, 'square', 0.02);
      }
      var press = null;
      grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      grid.addEventListener('pointerdown', function (e) {
        var t = e.target.closest('[data-k]'); if (!t || M.over) return;
        var k = +t.dataset.k;
        if (e.button === 2) { flag(k); return; }
        setFace('faceWin'); face.firstChild.style.opacity = '.85';
        press = { k: k, at: Date.now(), timer: e.pointerType === 'touch' ? setTimeout(function () { flag(k); press = null; setFace('face'); }, 420) : 0 };
      });
      grid.addEventListener('pointerup', function (e) {
        if (!press) return;
        clearTimeout(press.timer);
        var t = e.target.closest('[data-k]'), k = press.k; press = null;
        if (!M.over) setFace('face');
        if (t && +t.dataset.k === k) open1(k);
      });
      face.addEventListener('click', function () { start(lv); });
      w.el.querySelector('.pc98-mlevels').addEventListener('click', function (e) { var b = e.target.closest('[data-lv]'); if (b) start(+b.dataset.lv); });
      w.onClose = function () { clearInterval(timer); };
      start(0);
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

    var OPEN = { candy: candy, chronicle: chronicle, mypc: mypc, bin: bin, mines: mines, music: music, settings: settings };
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
      candy();
      if (window.MinkaDitherBackdrop && wins.candy) window.MinkaDitherBackdrop.attach(root, { box: wins.candy.el });
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
