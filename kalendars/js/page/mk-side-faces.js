/* Side-card faces. A person may give their card on the side (today's full card) another face than the classic one:
   the look's "sf" part (minka-skins.js keeps and syncs it, calendar.js puts it on the card as data-sf and loads this
   file on the first need). The faces follow sports-watch faces: black, flat bright colour, very large numerals,
   little text. A face is drawn over the card from what the classic card already shows (its hidden content stays
   the one source: name, fatigue, the shift's ticks, the month's bar, the next shift, the caffeine), so nothing is
   computed twice and nothing here runs on a timer: calendar.js calls sync() where it repaints the cards.
   The person's emoji is never touched: it stays the card's own element, in its place and at its size, in every
   face. A press anywhere else on a face opens the person's fatigue, as the ring does. */
(function () {
  'use strict';
  var FACES = [['b', 'Nogurumiņš'], ['p', 'Dzīvnieks']];   // (Klasiskais and Spīdums taken out: not wanted)
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* The person's own correction to their fatigue (points; minka-skins.js keeps it in the look as "fa": points and
     the minute of the first press; fatigue.js carries it through the whole model from then on, with no end). */
  function manual(worker) { return window.__fatigue && window.__fatigue.manualShift ? window.__fatigue.manualShift(worker) : 0; }
  function signed(n) { return n > 0 ? '+' + n : n < 0 ? '−' + -n : '0'; }

  function read(card) {
    function q(s) { return card.querySelector(s); }
    function tx(s) { var e = q(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
    var row = q(':scope > .mk-side-ticks'), chip = q('.mk-side-shift-chip'), split = q('.mk-nfoot-split'), caf = q('.mk-side-caf:not([hidden])');
    var nx = q('.mk-side-nfoot-row:not(.mk-side-nfoot-row--split):not(.mk-side-month):not(.mk-side-caf) dd');
    var n = row ? row.children.length : 0, at = row ? +row.style.getPropertyValue('--now') || 0 : 0, phase = row ? row.dataset.phase : 'before';
    return {
      // how far the shift is, 0..1 (by its ticks)
      p: phase === 'before' || !n ? 0 : phase === 'after' ? 1 : +((at + .5) / n).toFixed(3),
      who: card.dataset.worker || '', sfp: card.dataset.sfp || '', first: tx('.duty-name'), last: tx('.duty-surname'),
      chip: chip ? [].filter.call(chip.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.nodeValue; }).join('').trim() : '',
      kind: chip && chip.querySelector('.sun-icon') ? 'd' : chip && chip.querySelector('.moon-icon') ? 'n' : 'h',
      score: String(card.dataset.fatScore || '0'), label: card.dataset.fatLabel || '', level: card.dataset.fatigue || '',
      // each tick of the shift: [1 worked / 2 now / 0 still ahead, its level's colour, its height 0..1]
      ticks: row ? [].map.call(row.querySelectorAll(':scope > i'), function (t) { return [t.classList.contains('is-on') ? 1 : t.classList.contains('is-now') ? 2 : 0, t.style.getPropertyValue('--c'), +(+t.style.getPropertyValue('--hr') || +t.style.getPropertyValue('--h') || .3).toFixed(2)]; }) : [],
      next: nx ? [].slice.call(nx.children, 0, 2).map(function (x) { return x.textContent.trim(); }).join(' ') : '',
      nextH: nx && nx.children[2] ? nx.children[2].textContent.trim() : '',
      // the month's shifts by kind: [how many, colour, the kind's word]
      kinds: split ? [].map.call(split.children, function (i) { var w = i.querySelector('[data-w]'); return [parseFloat(i.style.flexGrow) || 1, i.style.backgroundColor, w ? w.dataset.w : '']; }) : [],
      count: tx('.mk-side-month dd span').replace(/\s/g, ''), caf: caf ? caf.dataset.mg || '' : '',
      adj: manual(card.dataset.worker || ''),
      cf: (function (m) { return m ? { src: m[1], pts: +m[2], mg: +m[3] } : null; })(/^([a-z]{2,20}),(\d{1,2}),(\d{1,4})$/.exec(card.dataset.cf || ''))
    };
  }

  // the shared pieces (after the user's own sketch of the card: round capsules, a clock in the shift's one, a
  // calendar before the next shift)
  var KIND = { diena: 'D', dienas: 'D', nakts: 'N', naktis: 'N', diennakts: '24h', diennaktis: '24h' };
  function name(d) { return '<b>' + esc(d.first) + '</b>' + (d.last ? '<i>' + esc(d.last) + '</i>' : ''); }
  function caf(d) { return d.caf ? '<span class="sf-caf"><b>' + esc(d.caf) + '</b><small>mg</small></span>' : ''; }
  /* Būtne and Dzīvnieks (the user's picture): three capsules as tall as the Nogurums row, each a small word over its
     value with an icon: "Šodien 12 h" (the shift's colour), "Mēnesī 2 / 4", "Maiņas 4 × N" (the kind's colour; several
     kinds sit side by side in their own colours on the month's capsule). Plain spans inside: the name's b / i rules
     must not reach them. */
  function hrs(v) { return String(v || '').replace(/(\d)\s*h$/i, '$1\u2009h'); }
  function two(cls, label, value, extra) {
    return '<span class="sf-chip sf-two ' + cls + '"' + (extra || '') + '><span class="sf-ct"><span class="sf-cl">' + label + '</span><span class="sf-cv">' + value + '</span></span></span>';
  }
  function stats(d, part) {
    var ks = d.kinds.filter(function (k) { return KIND[k[2]]; }), one = ks.length === 1;
    if (part === 'kinds') return ks.length ? two(one ? 'sf-kd' : 'sf-kd sf-kds', 'Maiņas', ks.map(function (k) {
        return '<span class="sf-kv"' + (one ? '' : ' style="color:' + esc(k[1]) + '"') + '>' + k[0] + '\u2009×\u2009' + KIND[k[2]] + '</span>';
      }).join(''), one ? ' style="--kb:' + esc(ks[0][1]) + '"' : '') : '';
    // today's hours glow (the user: "it must burn nicely"): a still glow in the sheet, no moving sparks over the text
    return (d.chip ? two('sf-sh', 'Šodien', esc(hrs(d.chip)), ' data-k="' + d.kind + '"') : '')
      + (/^\d+\/\d+$/.test(d.count) ? two('sf-cp', 'Mēnesī', esc(d.count.replace('/', '\u2009/\u2009')), ' title="Mēneša maiņas: izdarītas ' + esc(d.count.replace('/', ' no ')) + '"') : '')
      ;
  }

  /* Būtne: a jelly creature in the fatigue colour, after the stress screen of a sports band and the user's brief:
     a slightly lopsided soft body with one highlight and a shadow on the ground, two glossy eyes and a small
     mouth. Its face and posture follow the fatigue: bright, open-mouthed and upright when rested; heavier
     eyelids, a flat mouth and a slump as the fatigue grows; melted with eyes nearly shut at the top. It breathes,
     blinks now and then, and a few sparks twinkle around it; a press squashes it and it springs back; after a
     correction (+5 / −5) it sinks or perks up once. Plain boxes shaped and moved by the sheet (transform and
     opacity only), no pictures and no libraries. */
  // Būtne: a rendered plush creature (assets/butnes, scripts/blender/rg_mascot.py). Its kind is the person's own:
  // the one they chose (their look's "sf:b-<kind>", so it follows them to every device), or until then one drawn by
  // lot from their name. Its expression follows the fatigue.
  // LOT: the six the lot draws from (unchanged, so nobody's creature swaps under them); the other six are chosen
  // by hand. All twelve are one family (scripts/blender/rg_master.py): the body takes the fatigue's colour, the
  // cheeks, the inside of the ears and what each wears on its head are its own and stay.
  var LOT = ['pufs', 'astonis', 'lacis', 'zakis', 'antenas', 'cekuls'];
  var ALL_KINDS = LOT.concat(['mizi', 'lumo', 'koro', 'aksi', 'asns', 'pele']);
  // each kind's picture's width to height (scripts/build-butnes.py prints them): the button finds the picture's edge
  var KIND_AR = { pufs: 1.26, astonis: 1.29, lacis: 1.25, zakis: 1.07, antenas: 1.02, cekuls: 1.03, mizi: 1.21, lumo: 1.11, koro: 1.20, aksi: 1.32, asns: 1.05, pele: 1.15 };
  var KINDS = ALL_KINDS.filter(function (k) { return KIND_AR[k]; });   // a kind is offered once its pictures are there
  var KIND_NAMES = { pufs: 'Pūka', astonis: 'Astoņkājis', lacis: 'Lācis', zakis: 'Zaķis', antenas: 'Antenas', cekuls: 'Cekuls', mizi: 'Kaķis', lumo: 'Garausis', koro: 'Radziņš', aksi: 'Aksolotls', asns: 'Lapiņas', pele: 'Pele' };
  function kindOf(name) {
    for (var h = 0, i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return LOT[h % LOT.length];
  }
  var PICK = '<button type="button" class="sf-pick" aria-label="Mainīt nogurumiņu vai kartītes skatu" title="Mainīt nogurumiņu"></button>';
  function petKind(d) { return KINDS.indexOf(d.sfp) >= 0 ? d.sfp : kindOf(d.who); }
  // A drink in its paw (the card's data-cf: calendar.js __minkaCaffeineNow), for as long as the caffeine works: the
  // creature's picture is then the one where it holds something (<kind>-hold-<step>), and the drink itself is laid
  // over it (dz-<drink>-<pose>: rendered alone, already cut by the paw in front of it). Another drink logged is
  // another picture on top; when the caffeine is gone the card is drawn without both.
  var DRINKS = ['philips', 'lofbergs', 'narvesen', 'monster', 'monsterultra', 'redbull', 'brite', 'dynamit', 'kongstrong', 'cupcoffee', 'mycoffee'];
  // where the drink's picture lies on each kind's picture: left, top, width, in % of it (scripts/build-butnes.py prints them)
  var KIND_DZ = { pufs: [65.76, 53.08, 15.49], astonis: [65.59, 53.29, 15.32], lacis: [65.18, 55.56, 14.92], zakis: [65.68, 60.82, 15.41], antenas: [65.85, 61.11, 15.57], cekuls: [65.85, 61.54, 15.57], mizi: [65.59, 56.49, 15.32], lumo: [65.68, 59.23, 15.41], koro: [65.59, 56.88, 15.32], aksi: [65.1, 53.61, 14.84], asns: [65.68, 61.8, 15.41], pele: [65.76, 58.11, 15.49] };
  // The film of taking the drink (scripts/build-butnes.py writes these): the kinds that have one for every step, the
  // drinks that have one, where the drink's film lies on each kind's picture (left, top, width in %), its shape.
  var KIND_FILM = { aksi: 1, antenas: 1, asns: 1, astonis: 1, cekuls: 1, koro: 1, lacis: 1, lumo: 1, mizi: 1, pele: 1, pufs: 1, zakis: 1 };
  var DRINK_FILM = { brite: 1, cupcoffee: 1, dynamit: 1, kongstrong: 1, lofbergs: 1, monster: 1, monsterultra: 1, mycoffee: 1, narvesen: 1, philips: 1, redbull: 1 };
  var KIND_DZF = { aksi: [43.06, 53.26, 40.97], antenas: [42.71, 60.83, 42.99], asns: [42.79, 61.52, 42.52], astonis: [42.83, 52.94, 42.29], cekuls: [42.71, 61.25, 42.99], koro: [42.83, 56.56, 42.29], lacis: [43.02, 55.23, 41.19], lumo: [42.79, 58.93, 42.52], mizi: [42.83, 56.17, 42.29], pele: [42.75, 57.8, 42.75], pufs: [42.75, 52.74, 42.75], zakis: [42.79, 60.53, 42.52] };
  var DZF_AR = 1.255;
  var FILM_FRAMES = 38, FILM_MS = 3040;
  function held(d, kind) { return d.cf && KIND_DZ[kind] && DRINKS.indexOf(d.cf.src) >= 0 ? d.cf : null; }
  function step(d) { return { low: 'low', mid: 'mid', high: 'high' }[d.level] || (d.score > 85 ? 'exh' : 'crit'); }
  function petSrc(kind, d) {
    if (held(d, kind)) return 'assets/butnes/' + kind + '-hold-' + step(d) + '.webp';
    return 'assets/butnes/' + kind + '-' + ({ low: 'happy', mid: 'normal', high: 'tired' }[d.level] || (d.score > 85 ? 'exhausted' : 'very-tired')) + '.webp';
  }
  function pet(d) {
    var k = petKind(d), cf = held(d, k), at = KIND_DZ[k], st = step(d);
    return '<div class="sf-pet" data-l="' + esc(d.level || 'mid') + '" style="--ar:' + KIND_AR[k] + '"><i class="gs" aria-hidden="true"></i><span class="ps"><img class="pi" src="' + petSrc(k, d) + '" alt="" draggable="false">'
      + (cf && at ? '<img class="pd" src="assets/butnes/dz-' + cf.src + '-' + (st === 'exh' || st === 'crit' ? st : 'low') + '.webp" alt="" draggable="false" style="left:' + at[0] + '%;top:' + at[1] + '%;width:' + at[2] + '%">' : '')
      + '</span>' + (BAND ? '' : PICK) + '</div>';   // Band: the button is the card's, in its corner (sketch)   // (a cup mark in the figure's corner was tried: the drink in the paw says it already)
  }
  // a press on the creature: it squashes and springs back (and the press does not open the card)
  document.addEventListener('click', function (e) {
    var pt = e.target && e.target.closest && e.target.closest('.mk-sf .sf-pet');
    if (!pt || e.target.closest('.sf-pick')) return;   // the faces' button lives in the figure: its own handler
    e.preventDefault(); e.stopPropagation();
    pt.classList.remove('tap', 'up', 'dn'); void pt.offsetWidth; pt.classList.add('tap');
  }, true);
  /* a squeeze toy's short squeak with the squash: made on the press (no file), the sound card put to sleep after it,
     so nothing runs while nobody presses */
  var ac = null, acT = 0;
  // one note: its pitch path (Hz at seconds), wave, loudness and length
  function tone(path, type, vol, len) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var t = ac.currentTime + (ac.state === 'running' ? .002 : .02), o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = type; f.type = 'lowpass'; f.frequency.value = 2600;
      path.forEach(function (p, i) { if (i) o.frequency.exponentialRampToValueAtTime(p[0], t + p[1]); else o.frequency.setValueAtTime(p[0], t); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.001, t + len);
      o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + len + .02);
      clearTimeout(acT); acT = setTimeout(function () { if (ac) ac.suspend(); }, 20000);   // awake while pressed again soon (waking takes a moment), asleep after
    } catch (_) {}
  }
  // the more tired the creature, the lower and slower its squeak (0 fresh: bright and quick; 100: a low, drawn-out one)
  function squish(score) {
    var u = Math.max(0, Math.min(100, score || 0)) / 100, k = (1 - .5 * u) * (.94 + Math.random() * .12), w = 1 + 1.6 * u;
    tone([[420 * k, 0], [980 * k, .045 * w], [560 * k, .12 * w]], 'triangle', .16, .14 * w);
  }
  // the stepper's arrows: a short dry tick, up a step higher than down
  function tick(up) { var f = up ? 1180 : 820; tone([[f, 0], [f * .9, .03]], 'sine', .12, .045); }
  // the sounds go with the finger going down, not with the click's release: no lag behind the press
  document.addEventListener('pointerdown', function (e) {
    if (e.button || !e.target || !e.target.closest) return;
    var b = e.target.closest('.mk-sf .sf-adj button');
    if (b) { if (!b.disabled) tick(+b.dataset.d > 0); return; }
    var pt = e.target.closest('.mk-sf .sf-pet');
    if (pt && !e.target.closest('.sf-pick')) squish(+((pt.closest('.mk-side-card') || {}).dataset || {}).fatScore || 0);
  }, true);

  /* Dzīvnieks: one of the animated pets of codex-pets.net beside the number (sheets of 8 x 9 frames): the cats of
     the daily pet's catalogue (data/codex-cats.json) and the groups of data/side-pets.json. It idles; with high
     fatigue it waits, with critical it lies down; a press on it makes it wave. The person's pet is the part after
     the dash in "sf" (p-<id>); without one, a pet picked by the name, so everyone starts with their own. */
  var ACT = { idle: [0, 6, 2.6], waving: [3, 4, .7], failed: [5, 8, 2.4], waiting: [6, 6, 2.2] };   // row, frames, seconds a loop
  var pets = null, groups = ['Kaķi'], petsAsked = false;
  function petName(name, id) {
    // a name in letters this app's font has: else the id, as words
    name = String(name || '').trim();
    if (!name || /[^\u0000-ɏ]/.test(name)) name = id.replace(/-+/g, ' ');
    return name.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40);
  }
  function loadPets() {
    if (petsAsked) return;
    petsAsked = true;
    function json(url) { return fetch(url).then(function (r) { return r.json(); }); }
    Promise.all([json('data/codex-cats.json?v=20260825dailycat1'), json('data/side-pets.json?v=20261121sp1').catch(function () { return {}; })]).then(function (res) {
      var all = [], base = 'https://codex-pets.net/assets/pets/';
      (Array.isArray(res[0]) ? res[0] : []).forEach(function (x) {
        var m = x && /^[a-z0-9-]{1,40}$/.test(x.id || '') && /^https:\/\/codex-pets\.net\/assets\/pets\/([\w./-]+\/)preview\.webp$/.exec(x.previewUrl || '');
        if (m) all.push({ id: x.id, name: petName(x.displayName, x.id), dir: base + m[1], g: 0 });
      });
      ((res[1] && res[1].groups) || []).forEach(function (grp) {
        var g = groups.push(String(grp.title || '').slice(0, 30)) - 1;
        (grp.pets || []).forEach(function (x) {
          if (/^[a-z0-9-]{1,40}$/.test(x[0] || '') && /^\d{6,16}$/.test(x[1] || '')) all.push({ id: x[0], name: petName('', x[0]), dir: base + 'v/' + x[1] + '/' + x[0] + '/', g: g });
        });
      });
      pets = all;
      sync();
      if (pick) petPanel();
    }).catch(function () { petsAsked = false; });
  }
  function petIndex(card) {
    if (!pets || !pets.length) return -1;
    var id = card.dataset.sfp || '', i = id ? pets.findIndex(function (x) { return x.id === id; }) : -1;
    if (i >= 0) return i;
    var h = 0, name = card.dataset.worker || '';
    for (var k = 0; k < name.length; k++) h = (h * 31 + name.charCodeAt(k)) >>> 0;
    return h % pets.length;
  }
  function sprite(d) {
    var act = d.level === 'crit' ? 'failed' : d.level === 'high' ? 'waiting' : 'idle', a = ACT[act];
    return '<div class="sf-spr" data-act="' + act + '" title="' + esc(d.petName || '') + '">' + (d.pet ? '<i style="background-image:url(&quot;' + esc(d.pet) + '&quot;);--row:' + a[0] + ';--n:' + a[1] + ';--t:' + a[2] + 's"></i>' : '') + '</div>';
  }
  // a press on the pet: it waves twice, then goes back to what it was doing (the press does not open the card)
  document.addEventListener('click', function (e) {
    var spr = e.target && e.target.closest && e.target.closest('.sf-spr'), i = spr && spr.firstChild;
    if (!i) return;
    e.preventDefault(); e.stopPropagation();
    var back = ACT[spr.dataset.act] || ACT.idle;
    function play(a) { i.style.setProperty('--row', a[0]); i.style.setProperty('--n', a[1]); i.style.setProperty('--t', a[2] + 's'); }
    clearTimeout(spr.__t);
    play(ACT.waving);
    spr.__t = setTimeout(function () { play(back); }, ACT.waving[2] * 2000);
  }, true);

  /* Būtne and Dzīvnieks follow the user's sketch and brief: the figure stays large on the right and nothing
     lies over it; beside the emoji the name and the surname; under the emoji one row of capsules (the shift,
     the month's done/all, its kinds in the kinds' colours), then one row with the fatigue ("Nogurums | 22", in
     the fatigue colour, the number the strong part) and the next shift; along the very bottom the shift's
     fatigue as a thin strip of ticks with no box around it (each as tall as the fatigue then, in its level's
     colour, the one now marked); the caffeine, when there is any, stands at the strip's right end. */
  /* "Band" (the user, looking at a Xiaomi Band at the end of a 24-hour shift): few things, big, no boxes or borders.
     The fatigue goes round the card as a thick ring (as a band shows its battery), the creature and the fatigue number
     are the heroes, and under them only today's hours and when the next shift is, said so that it cannot be taken for
     the time now ("rīt 08:00", not a bare clock). The month's count, the kinds of shifts and the strip of the shift's
     hours are left out of it. */
  var BAND = true;
  var MONTHS = ['janv', 'febr', 'marts', 'apr', 'maijs', 'jūn', 'jūl', 'aug', 'sept', 'okt', 'nov', 'dec'];
  function when(next, short) {   // short: a far day as 29.11. (for a narrow card)
    var m = /^(\d{1,2})\.\s*([a-zāčēģīķļņšūž]+)\.?\s+(\d{1,2}:\d{2})$/i.exec(next || '');
    if (!m) return next || '';
    var mi = MONTHS.indexOf(m[2].toLowerCase().replace(/\.$/, '')), now = new Date();
    if (mi < 0) return next;
    var day = new Date(now.getFullYear(), mi, +m[1]);
    if (day < new Date(now.getFullYear(), now.getMonth(), now.getDate()) - 180 * 864e5) day.setFullYear(day.getFullYear() + 1);
    var n = Math.round((day - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    return (n === 0 ? 'šodien ' : n === 1 ? 'rīt ' : n === 2 ? 'parīt ' : short ? m[1] + '.' + (mi + 1) + '. ' : m[1] + '. ' + m[2] + '. ') + m[3];
  }
  function band(d) {
    var sc = Math.max(0, Math.min(100, +d.score || 0));
    return '<svg class="sf-ring" aria-hidden="true"><rect class="tr"/><rect class="pg" style="--sc:' + sc + '"/></svg>';   // its length and start: CSS (no measuring)
  }
  function sketch(d, figure) {
    if (BAND) {
      return band(d) + '<div class="sf-top"' + (d.ar ? ' style="--ar:' + d.ar + '"' : '') + '><i class="sf-av" aria-hidden="true"></i><div class="sf-nm"><div class="sf-id">' + name(d) + '</div></div><div class="sf-fig">' + figure + '</div></div>'
        + '<div class="sf-pl">' + (d.chip ? '<span class="sf-bv sf-bh" title="Šodien">' + esc(hrs(d.chip)) + '</span>' : '')
        + '<div class="sf-fat" title="' + esc(d.label) + (d.adj ? ' (ar roku ' + signed(d.adj) + ')' : '') + (d.cf && d.cf.pts ? ' (kofeīns uz laiku −' + d.cf.pts + ', ' + d.cf.mg + ' mg organismā)' : '') + '"><span>Nogurums</span><div class="sf-num" data-n="' + d.score.length + '">' + esc(d.score) + '</div>' + (d.adj ? '<em class="sf-ad" data-s="' + (d.adj > 0 ? 'p' : 'm') + '">' + signed(d.adj) + '</em>' : '') + adjust(d) + '</div></div>'
        + (d.next ? '<div class="sf-rc"><span class="sf-bv sf-bn" title="Nākamā maiņa: ' + esc(d.next) + '" data-l="' + esc(when(d.next)) + '" data-s="' + esc(when(d.next, true)) + '">' + esc(when(d.next)) + '</span></div>' : '')
        + caf(d) + (figure.indexOf('sf-pick') < 0 ? PICK : '');
    }
    var ticks = d.ticks.map(function (t) { return '<i class="t' + t[0] + '" style="--c:' + esc(t[1]) + ';--h:' + t[2] + '"></i>'; }).join('');
    // the top is one grid (the sheet): the avatar's column, the name over the surname, the figure over its buttons
    return '<div class="sf-top"' + (d.ar ? ' style="--ar:' + d.ar + '"' : '') + '><i class="sf-av" aria-hidden="true"></i><div class="sf-nm"><div class="sf-id">' + name(d) + '</div></div><div class="sf-fig">' + figure + '</div></div>'
      // the − / + at the end of the row of capsules: the figure keeps the whole height above it
      // In the order one looks (the user): first what is now, today's hours, the month and the fatigue with its − / +
      // under the creature; then the month's shifts and the next one.
      + '<div class="sf-pl">' + stats(d) + '<div class="sf-fat" title="' + esc(d.label) + (d.adj ? ' (ar roku ' + signed(d.adj) + ')' : '') + (d.cf && d.cf.pts ? ' (kofeīns uz laiku −' + d.cf.pts + ', ' + d.cf.mg + ' mg organismā)' : '') + '"><span>Nogurums</span><div class="sf-num" data-n="' + d.score.length + '">' + esc(d.score) + '</div>' + (d.adj ? '<em class="sf-ad" data-s="' + (d.adj > 0 ? 'p' : 'm') + '">' + signed(d.adj) + '</em>' : '') + adjust(d) + '</div></div>'
      + '<div class="sf-rc">' + stats(d, 'kinds') + (d.next ? '<div class="sf-nc"><small>Nākamā</small><b>' + esc(d.next) + '</b>' + (d.nextH ? '<span class="sf-nd"></span><i>' + esc(hrs(d.nextH)) + '</i>' : '') + '</div>' : '') + '</div>'
      + (ticks ? '<div class="sf-tk" title="Nogurums šajā maiņā">' + ticks + '</div>' : '') + caf(d)
      // the faces' button in the figure's empty top left corner (Būtne draws it with its picture, which knows its edge)
      + (figure.indexOf('sf-pick') < 0 ? PICK : '');
  }
  var DRAW = {
    b: function (d) { d.ar = KIND_AR[petKind(d)]; return sketch(d, pet(d)); },
    p: function (d) { return sketch(d, sprite(d)); }
  };

  function paint(card) {
    var id = card.dataset.sf, layer = card.querySelector(':scope > .mk-sf');
    // drawn as soon as the card exists, before its fatigue ticks arrive: no frame of an empty card
    if (!id || !DRAW[id]) { if (layer) layer.remove(); return; }
    var d = read(card);
    if (id === 'p') { loadPets(); var pi = petIndex(card); if (pi >= 0) { d.pet = pets[pi].dir + 'spritesheet.webp'; d.petName = pets[pi].name; } }
    var sig = id + JSON.stringify(d);
    if (layer && layer.__sig === sig) return;
    if (!layer) {
      layer = document.createElement('div');
      layer.tabIndex = 0; layer.setAttribute('role', 'button');
      card.appendChild(layer);
    }
    layer.__sig = sig;
    layer.className = 'mk-sf mk-sf-' + id;
    layer.dataset.level = d.level;
    layer.setAttribute('aria-label', d.first + ': nogurums ' + d.score + ', ' + d.label + '. Atvērt');
    var seen = layer.querySelector('.sf-pet .pi'), was = seen && seen.complete && seen.naturalWidth ? seen.getAttribute('src') : '';
    layer.innerHTML = DRAW[id](d);
    carry(layer, was);
    var mv = settle[card.dataset.worker || ''], fig = mv && performance.now() - mv[1] < 1000 && layer.querySelector('.sf-pet, .sf-spr');
    if (mv && !fig) delete settle[card.dataset.worker || ''];
    // the same movement, carried on from where it is: a second drawing must not start it again
    if (fig) { fig.style.setProperty('--sf-late', -Math.round(performance.now() - mv[1]) + 'ms'); fig.classList.add(mv[0]); }
  }
  /* A creature's picture changes (another step of fatigue, a drink taken or put away): the picture that was there
     stays until the new one can be drawn, and then the new one comes in over it in a fifth of a second: the creature
     is never missing while a file arrives, and one picture does not jump to the next. Only between two pictures of
     the same kind: they are the same size and stand in the same place. With reduced motion the change is at once. */
  function carry(layer, was) {
    var pi = layer.querySelector('.sf-pet .pi');
    if (!pi || !was) return;
    var now = pi.getAttribute('src'), kind = function (u) { return u.split('/').pop().split('-')[0]; };
    if (was === now || kind(was) !== kind(now)) return;
    var ps = pi.parentNode, pd = ps.querySelector('.pd'), still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    ps.style.background = 'url("' + was + '") 50% 100% / 100% 100% no-repeat';
    pi.style.opacity = '0';
    if (pd) pd.style.opacity = '0';
    function shown() {
      if (!pi.isConnected) return;
      pi.style.opacity = ''; if (pd) pd.style.opacity = '';
      if (still || !pi.animate) { ps.style.background = ''; return; }
      var fade = pi.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
      if (pd) pd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
      fade.onfinish = fade.oncancel = function () { ps.style.background = ''; };
    }
    if (pi.complete && pi.naturalWidth) shown();
    else { pi.addEventListener('load', shown, { once: true }); pi.addEventListener('error', function () { pi.style.opacity = ''; if (pd) pd.style.opacity = ''; ps.style.background = ''; }, { once: true }); }
  }
  /* And the pictures a card may need next are fetched ahead, once, when the page is idle: for each creature on
     the screen the one where it holds a drink (its step of fatigue now), and the drinks themselves (33 small files). */
  var warmed = {}, warmTimer = 0;
  function warm() {
    warmTimer = 0;
    var urls = [];
    DRINKS.forEach(function (s) { ['low', 'crit', 'exh'].forEach(function (p) { urls.push('assets/butnes/dz-' + s + '-' + p + '.webp'); }); });
    document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card[data-sf="b"]').forEach(function (card) {
      var d = read(card), k = petKind(d);
      if (KIND_DZ[k]) urls.push('assets/butnes/' + k + '-hold-' + step(d) + '.webp', petSrc(k, { level: d.level, score: d.score }));
    });
    urls.forEach(function (u) { if (!warmed[u]) { (warmed[u] = new Image()).src = u; } });   // kept: a picture let go may have to be read again
  }
  function sync() {
    document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card:is([data-sf], :has(> .mk-sf))').forEach(paint);
    fitNames();
    if (!warmTimer) warmTimer = setTimeout(function () { (window.requestIdleCallback || setTimeout)(warm); }, 1200);
  }
  // Each name as large as its own room allows, the whole of it, never cut: a long name comes out smaller, a short one
  // stops at the cap below. Measured, not guessed: --sf-fs / --sf-fs2 on its .sf-id (the sheet guesses until then).
  // The surname stays under two thirds of the name.
  function fitNames() {
    [].forEach.call(document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card > .mk-sf > .sf-ring'), function (r) {
      // the stepper is centred on the creature; on a narrow card it would reach the ring: moved in by as much
      var f = r.parentElement.querySelector('.sf-pl > .sf-fat'), z = parseFloat(getComputedStyle(r.parentElement.parentElement).zoom) || 1;
      if (!f) return;
      f.style.removeProperty('margin-right');
      var over = f.getBoundingClientRect().right - (r.parentElement.getBoundingClientRect().right - 13 * z);
      if (over > 0) f.style.marginRight = (over / z).toFixed(1) + 'px';
    });
    /* Band: today's hours and the next shift as large as their places let them (the user: on a crowded column the
       card is small, the text came out small with it). The hours reach to the creature, the next shift to the
       stepper; each no taller than its row, and at most 26 / 18px on the screen. Sizes in the card's own px. */
    [].forEach.call(document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card > .mk-sf > .sf-ring'), function (r) {
      var L = r.parentElement, z = parseFloat(getComputedStyle(L.parentElement).zoom) || 1, img = L.querySelector('.sf-fig .ps, .sf-fig .sf-spr'), dn = L.querySelector('.sf-fat .sf-adj button');
      [[L.querySelector('.sf-pl > .sf-bh'), img, 38, 26], [L.querySelector('.sf-rc > .sf-bn'), dn, 32, 18]].forEach(function (t) {
        var el = t[0];
        if (!el || !t[1]) return;
        if (el.dataset.l && el.textContent !== el.dataset.l) el.textContent = el.dataset.l;   // the long day again, then fitted
        el.style.removeProperty('width');
        // its place: from the row's start (the emoji's edge) to the creature or the stepper; the text centred in it
        var room = t[1].getBoundingClientRect().left - 8 * z - el.parentElement.getBoundingClientRect().left;
        var fit = function () { var w = el.getBoundingClientRect().width, fs = parseFloat(getComputedStyle(el).fontSize); return w > 0 && room > 0 ? fs * room / w * .97 : 0; };
        var f = fit();
        if (f && f * z < 12 && el.dataset.s && el.dataset.s !== el.textContent) { el.textContent = el.dataset.s; f = fit(); }   // too narrow for "29. nov.": "29.11."
        // never past the stepper: below 12px on the screen only when even the short day needs it (10px at the least)
        if (f) el.style.fontSize = Math.max(10 / z, Math.min(t[2], t[3] / z, f)).toFixed(1) + 'px';
        if (room > 0) el.style.width = (room / z).toFixed(1) + 'px';
      });
    });
    // a row of four capsules and the − / + does not fit a narrow card: the capsules close up a little (.sf-tight), and
    // on the narrowest the shift's clock goes too (.sf-tight2). Measured by where the buttons land: past the row's end,
    // or onto the last capsule.
    // the next shift's length is shown where the Nogurums / Nākamā row has room for it
    [].forEach.call(document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card > .mk-sf > .sf-rc'), function (rc) {
      var nc = rc.querySelector('.sf-nc');
      rc.classList.remove('sf-rc-tight', 'sf-rc-short', 'sf-rc-lean');
      if (!nc) return;
      // the length's text (not its padded box) stays 4px inside the capsule, and the row inside the card
      function over() {
        var h = nc.querySelector('i'), n = nc.getBoundingClientRect(), g = document.createRange();
        if (h && h.getClientRects().length) { g.selectNodeContents(h); if (g.getBoundingClientRect().right > n.right - 4) return true; }
        return nc.scrollWidth > nc.clientWidth + 1 || n.right > rc.getBoundingClientRect().right + 1;
      }
      ['sf-rc-tight', 'sf-rc-short', 'sf-rc-lean'].some(function (c) { if (!over()) return true; rc.classList.add(c); });
    });
    [].forEach.call(document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card > .mk-sf > .sf-pl'), function (pl) {
      var last = pl.lastElementChild;
      pl.classList.remove('sf-tight', 'sf-tight2', 'sf-tight3', 'sf-tight4');
      if (!last || pl.parentElement.querySelector(':scope > .sf-ring')) return;   // Band: one big value and the stepper, each in its own place: nothing to close up
      var z = parseFloat(getComputedStyle(pl.closest('.mk-side-card')).zoom) || 1;   // the card's own px on the screen
      function over() {
        var end = Math.min(pl.getBoundingClientRect().right + z, pl.parentElement.getBoundingClientRect().right - (pl.parentElement.querySelector(':scope > .sf-ring') ? 14 : 5) * z);   // in the row, and clear of the card's edge (and of the fatigue ring)
        if (last.getBoundingClientRect().right > end) return true;
        var num = last.querySelector && last.querySelector('.sf-num'), bs = last.querySelectorAll ? last.querySelectorAll('.sf-adj button') : [];
        if (!num || bs.length < 2) return false;
        var g = document.createRange(); g.selectNodeContents(num);
        // the arrow down stands left of the number, the arrow up right of it (and of the correction badge, if there is one)
        var t = g.getBoundingClientRect(), down = bs[0].getBoundingClientRect(), up = bs[1].getBoundingClientRect(), ad = last.querySelector('.sf-ad');
        var right = ad && ad.getClientRects().length ? ad.getBoundingClientRect().right : t.right;
        return t.left < down.right + 2 * z || right > up.left - 2 * z;
      }
      ['sf-tight', 'sf-tight2', 'sf-tight3', 'sf-tight4'].some(function (c) { if (!over()) return true; pl.classList.add(c); });
      // the creature stands centred over its − N +: both end at the card's right edge, the stepper is the wider, so
      // the figure steps left by the difference (before the names, which take the room that is left)
      var fig = pl.parentElement.querySelector('.sf-fig'), img = fig && fig.querySelector('.sf-pet .ps, .sf-spr'), bs = pl.querySelectorAll('.sf-fat button');
      if (!img || bs.length < 2) return;
      fig.style.removeProperty('margin-right');
      var z = parseFloat(getComputedStyle(pl.closest('.mk-side-card')).zoom) || 1, ir = img.getBoundingClientRect(),
        dx = (ir.left + ir.right) / 2 - (bs[0].getBoundingClientRect().left + bs[bs.length - 1].getBoundingClientRect().right) / 2;
      if (dx > .5) fig.style.marginRight = Math.round(dx / z * 10) / 10 + 'px';
    });
    /* The names: as large as each card lets them, and every card's at one size on the screen (the user: a
       radiologist's name came out small beside the radiographers'; then: all of them too small for the room they
       have). Each first name's own fit is measured two ways, the larger kept: in its cell beside the creature (its
       height shared with the surname), or, in Band, on its own line over the creature (the creature stands on the
       stepper, the room above it is the name's). All take the smallest fit among those that reach 17px on the
       screen; a name that cannot reach it keeps its own, the others are not pulled down with it. Sizes set in each
       card's own px (the columns are zoomed differently); surnames alike, a step smaller, always beside the creature. */
    var rg = document.createRange();
    function tw(el) { rg.selectNodeContents(el); return rg.getBoundingClientRect().width; }   // the text's own width on the screen
    var ids = [].map.call(document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card > .mk-sf .sf-id'), function (e) {
      var cell = e.parentElement.classList.contains('sf-nm') ? e.parentElement : null, L = e.closest('.mk-sf'), band = !!L.querySelector(':scope > .sf-ring');
      var b = e.querySelector('b'), i = e.querySelector('i'), z = parseFloat(getComputedStyle(e.closest('.mk-side-card')).zoom) || 1;
      var room = (cell ? cell.clientWidth - 16 : e.clientWidth) * z, wb = b && tw(b);
      if (!room || !wb) return null;
      var fs = parseFloat(getComputedStyle(b).fontSize) * z, cap = band ? 34 : 23;
      var own = Math.min(room / wb * fs * .97, band ? 86 * z / 1.9 : 99);
      var img = null;   // (a name run on over the creature was tried; centred between the emoji and the creature it stays in its cell)
      if (img) {
        var br = b.getBoundingClientRect(), lr = L.getBoundingClientRect();
        var pk = L.querySelector(':scope > .sf-pick'), end = pk ? pk.getBoundingClientRect().left - 4 * z : lr.right - 18 * z;   // clear of the corner's button
        own = Math.max(own, Math.min((end - br.left) / wb * fs * .97, (img.getBoundingClientRect().top - 3 * z - br.top) / 1.12));
      }
      return { e: e, z: z, own: Math.min(cap, own), room: room, img: img, right: L.getBoundingClientRect().right - 18 * z };
    }).filter(Boolean);
    // all at the smallest fit among those that reach 17px (or, in a small window where few do, the middle one's)
    var ow = ids.map(function (x) { return x.own; }).sort(function (a, b) { return a - b; }), bar = Math.min(17, ow.length ? ow[Math.floor((ow.length - 1) / 2)] : 17);
    var fit = ow.filter(function (v) { return v >= bar; });
    var one = fit.length ? fit[0] : 15;
    ids.forEach(function (x) {
      var f1 = Math.max(11, Math.floor(Math.min(one, x.own) / x.z * 4) / 4);   // quarter px: a resize moves it in small steps, not whole px
      if (x.e.style.getPropertyValue('--sf-fs') !== f1 + 'px') x.e.style.setProperty('--sf-fs', f1 + 'px');
      x.f1 = f1 * x.z;
      // the surname, now that the first name has its size: beside the creature, or on over it while above the picture
      var i = x.e.querySelector('i'), wi = i && tw(i), img = x.img;
      if (!wi) { x.own2 = 99; return; }
      var fs = parseFloat(getComputedStyle(i).fontSize) * x.z;
      x.own2 = x.room / wi * fs * .97;
      if (img) { var ir = i.getBoundingClientRect(); x.own2 = Math.max(x.own2, Math.min((x.right - ir.left) / wi * fs * .97, (img.getBoundingClientRect().top - 2 * x.z - ir.top) / 1.15)); }
    });
    // surnames: the size most of them can take (the middle one's fit), not the longest's: a long surname alone keeps
    // its own smaller fit (the user: all surnames came out small for one long one)
    var o2 = ids.map(function (x) { return x.own2; }).sort(function (a, b) { return a - b; });
    var two = Math.max(12, Math.min(one * .78, o2.length ? o2[Math.floor((o2.length - 1) / 2)] : 99));
    ids.forEach(function (x) {
      var f2 = Math.max(10, Math.floor(Math.min(two, x.own2, x.f1 * .78) / x.z * 4) / 4);   // the surname about three quarters of the name (the user's sketch)
      if (x.e.style.getPropertyValue('--sf-fs2') !== f2 + 'px') x.e.style.setProperty('--sf-fs2', f2 + 'px');
    });
  }
  // a narrower window makes narrower cards, and the brand font may arrive after the first measure
  var fitFrame = 0, fitWait = 0, fitEase = 0;
  function fitSoon() { if (!fitFrame) fitFrame = requestAnimationFrame(function () { fitFrame = 0; fitNames(); }); }
  /* A window being resized: the fit runs at most every 120 ms while it moves (not every frame: the measuring
     loaded the computer), once more when it rests, and the texts glide between the fits (mk-side-faces.css),
     so they follow the window instead of jumping (the user). The ring is CSS: it follows by itself. */
  var cols = function () { return document.querySelectorAll('#radiographers-duty, #radiologists-duty'); };
  function resized() {
    // the texts glide only while the window moves (mk-side-faces.css .sf-resizing): a card drawn anew, after a
    // fatigue press say, takes its sizes at once and does not grow into them
    [].forEach.call(cols(), function (c) { c.classList.add('sf-resizing'); });
    clearTimeout(fitWait);
    fitWait = setTimeout(function () { fitNames(); setTimeout(function () { [].forEach.call(cols(), function (c) { c.classList.remove('sf-resizing'); }); }, 160); }, 130);   // the last word, when the window rests
    if (fitEase) return;
    fitNames();
    fitEase = setTimeout(function () { fitEase = 0; }, 120);
  }
  if (window.ResizeObserver) { var ro = new ResizeObserver(resized); ['radiographers-duty', 'radiologists-duty'].forEach(function (id) { var c = document.getElementById(id); if (c) ro.observe(c); }); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('mk-sf')) { e.preventDefault(); e.target.click(); }
  });

  /* Under the figure: − (green, less tired) and + (red, more tired). Each press moves the person's fatigue by 5
     points (30 at most either way); the correction is saved to their look at once, so everyone sees it, and it
     stays until they change it. A PIN-locked card refuses as it does for the look. */
  /* A press shows on the card's number, as a coffee lands in the curve (calendar.js flyCoffeeToCurve): two rings
     in the press's colour, the number gives a little pop, and a few specks go up (less tired) or fall (more tired).
     Nothing flies there (the user: "numbers flying in from somewhere" is silly). Web Animations only: nothing loops,
     every node removes itself, nothing at all with reduced motion. The card is drawn again just after the press, so
     the number is looked up once the new one is there. */
  function cardOf(worker) {
    return [].find.call(document.querySelectorAll(':is(#radiographers-duty, #radiologists-duty) > .mk-side-card'), function (c) { return c.dataset.worker === worker; });
  }
  function numOf(worker) { var c = cardOf(worker); return c && c.querySelector(':scope > .mk-sf .sf-fat .sf-num'); }
  function speck(css) {
    var el = document.createElement('i');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;z-index:2147483001;pointer-events:none;' + css;
    document.body.appendChild(el);
    return el;
  }
  function gone(a, el) { a.onfinish = a.oncancel = function () { el.remove(); }; }
  function fly(btn, worker, delta) {
    if (!btn.animate || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    setTimeout(function () { land(numOf(worker), delta < 0 ? '#42d991' : '#ff5c70', delta); }, 160);
    if (window.MinkaEmojiParticles && window.MinkaEmojiParticles.haptic) window.MinkaEmojiParticles.haptic('light');
  }
  function land(num, col, delta) {
    if (!num) return;
    var r = num.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    [0, 130].forEach(function (delay) {
      var ring = speck('left:' + (cx - 20) + 'px;top:' + (cy - 20) + 'px;width:40px;height:40px;border-radius:50%;border:3px solid ' + col);
      gone(ring.animate([{ transform: 'scale(.35)', opacity: 1 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 620, delay: delay, easing: 'cubic-bezier(.2, .7, .3, 1)', fill: 'backwards' }), ring);
    });
    for (var i = 0; i < 7; i++) {
      var x = (Math.random() - .5) * 70, up = delta < 0, s = 4 + Math.random() * 3;
      var dot = speck('left:' + (cx - s / 2) + 'px;top:' + (cy - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + col);
      gone(dot.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + x.toFixed(1) + 'px,' + ((up ? -1 : 1) * (26 + Math.random() * 26)).toFixed(1) + 'px) scale(.4)', opacity: 0 }],
        { duration: 560 + Math.random() * 260, delay: Math.random() * 90, easing: up ? 'cubic-bezier(.2, .7, .3, 1)' : 'cubic-bezier(.5, 0, .9, .6)', fill: 'backwards' }), dot);
    }
    num.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: .35 }, { transform: 'scale(1)' }], { duration: 460, easing: 'ease-out' });   // small: it must not grow over the arrows
  }
  // worker -> ['up' | 'dn', when]: how the figure moves once after the correction that was just made. The card is
  // drawn twice after a press (the look at once, the new number a moment later), so the move is kept for a second.
  var settle = {};
  function adjust(d) {
    var tip = ' Paliek, līdz to maini; redz visi.';
    return '<div class="sf-adj"><button type="button" data-d="-5" aria-label="Mazāks nogurums" title="Jūtos mazāk noguris: −5.' + tip + '"' + (d.adj <= -30 ? ' disabled' : '') + '>↓</button>'
      + '<button type="button" data-d="5" aria-label="Lielāks nogurums" title="Jūtos vairāk noguris: +5.' + tip + '"' + (d.adj >= 30 ? ' disabled' : '') + '>↑</button></div>';
  }
  /* A drink (calendar.js playCoffeeAddedEffect). The latest drink is in the creature's paw for as long as its
     caffeine works (pet() above). When it is added, the creature takes a sip and answers in the drink's own way. sip (every coffee): it leans back, content; buzz (the energy drinks): it
     shivers and hops; fizz (Brite): a squash and a bounce; flex (Kong Strong): it swells with strength.
     One movement of under a second, carried over a redrawn card like a correction's (settle). Nothing with reduced
     motion, and nothing moves between drinks. */
  var DRINK = { monster: 'buzz', monsterultra: 'buzz', redbull: 'buzz', dynamit: 'buzz', brite: 'fizz', kongstrong: 'flex' };
  var MOVES = ['sip', 'buzz', 'fizz', 'flex', 'up', 'dn'];
  /* The film: the creature notices the drink, takes it, drinks, lowers it, waves once, and is left holding it. Two
     strips of frames played together, once (the creature's for its step of fatigue; the drink's, cut by the paws,
     over it); the card's own two pictures are hidden meanwhile and are what the last frame shows. Until both strips
     are loaded the card shows the creature as it was before the drink, so the film starts from what was there. */
  function film(card, fig, source) {
    var d = read(card), k = petKind(d), ps = fig.querySelector('.ps'), pi = ps && ps.querySelector('.pi'), at = KIND_DZF[k];
    if (!pi || !KIND_FILM[k] || !DRINK_FILM[source] || !at || !held(d, k)) return false;
    var st = step(d), urls = ['assets/butnes/' + k + '-film-' + st + '.webp', 'assets/butnes/dzf-' + source + '-' + (st === 'exh' || st === 'crit' ? st : 'low') + '.webp'];
    var after = pi.getAttribute('src'), left = 2;
    fig.classList.add('pre');   // the drink is not in its paw yet
    pi.src = petSrc(k, { level: d.level, score: d.score });
    function play() {
      if (--left || !fig.isConnected) return;
      var a = document.createElement('i'), b = document.createElement('i');
      a.className = 'pf'; a.style.backgroundImage = 'url(' + urls[0] + ')';
      b.className = 'pf pfd'; b.style.cssText = 'background-image:url(' + urls[1] + ');left:' + at[0] + '%;top:' + at[1] + '%;width:' + at[2] + '%;aspect-ratio:' + DZF_AR;
      ps.appendChild(a); ps.appendChild(b);
      fig.classList.add('film');
      a.addEventListener('animationend', function () {
        pi.src = after;
        fig.classList.remove('film', 'pre');
        a.remove(); b.remove();
      }, { once: true });
    }
    urls.forEach(function (u) { var im = new Image(); im.onload = play; im.onerror = function () { pi.src = after; fig.classList.remove('pre'); }; im.src = u; });
    return true;
  }
  /* The drink's moment, as in the user's own picture of it: one thin line sweeps round the creature low down, in
     front of it, and two small four-pointed stars come and go at its sides. Drawn once over the figure (not over the
     name or the numbers), in the fatigue's colour lightened; no blur, no glow; the node removes itself. (Specks rising
     by the mouth, and a spring with a ring round the drink, were tried before and turned down.) */
  function swoosh(fig, card) {
    var r = fig.getBoundingClientRect(), col = getComputedStyle(card).getPropertyValue('--mk-side-fat-color').trim() || '#fff';
    var el = speck('left:' + (r.left - r.width * .08) + 'px;top:' + (r.top - r.height * .04) + 'px;width:' + r.width * 1.16 + 'px;height:' + r.height * 1.08 + 'px');
    el.innerHTML = '<svg viewBox="0 0 116 100" width="100%" height="100%" style="display:block;overflow:visible" fill="none" stroke-linecap="round">'
      + '<path d="M9 50C12 80 100 88 108 54" stroke="color-mix(in srgb, ' + col + ' 45%, #fff)" stroke-width="2.6" pathLength="100" stroke-dasharray="34 100" stroke-dashoffset="34"/>'
      + '<path d="M15 12l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z" fill="#fff" style="transform-box:fill-box;transform-origin:50% 50%"/>'
      + '<path d="M101 24l1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3-4.3-1.7 4.3-1.7z" fill="#fff" style="transform-box:fill-box;transform-origin:50% 50%"/></svg>';
    var k = el.firstChild.children, star = [{ transform: 'scale(0) rotate(-40deg)', opacity: 0 }, { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: .45 }, { transform: 'scale(0) rotate(40deg)', opacity: 0 }];
    // a short stroke runs the length of the line, left to right, and thins out at its end
    k[0].animate([{ strokeDashoffset: 34, opacity: 1 }, { strokeDashoffset: -66, opacity: 1, offset: .8 }, { strokeDashoffset: -100, opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.3, .1, .3, 1)', fill: 'both' });
    k[1].animate(star, { duration: 520, delay: 140, easing: 'ease-out', fill: 'both' });
    gone(k[2].animate(star, { duration: 520, delay: 320, easing: 'ease-out', fill: 'both' }), el);
  }
  window.__minkaSideFaceDrink = function (card, source) {
    var layer = card && card.querySelector(':scope > .mk-sf'), fig = layer && layer.querySelector('.sf-pet, .sf-spr');
    if (!fig || !fig.animate || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var how = DRINK[source] || 'sip', r = (fig.querySelector('.ps') || fig).getBoundingClientRect();
    if (film(card, fig, source)) return;
    settle[card.dataset.worker || ''] = [how, performance.now()];
    MOVES.forEach(function (c) { fig.classList.remove(c); });
    void fig.offsetWidth;   // the same move twice in a row starts again
    fig.style.setProperty('--sf-late', '0ms');
    fig.classList.add(how);
    swoosh(fig, card);
  };
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.mk-sf .sf-adj button'), card = b && b.closest('.mk-side-card');
    if (!card) { if (e.target && e.target.closest && e.target.closest('.mk-sf .sf-fat')) { e.preventDefault(); e.stopPropagation(); } return; }   // the stepper's number and gaps: its own, not the card's window
    e.preventDefault(); e.stopPropagation();   // not the card's own press (the person's window)
    if (b.disabled || !window.mkPatchWorkerSkin) return;
    var worker = card.dataset.worker || '', n = Math.max(-30, Math.min(30, manual(worker) + +b.dataset.d));
    settle[worker] = [+b.dataset.d > 0 ? 'dn' : 'up', performance.now()];
    // the points change, the minute of the first press stays: the whole time since then carries the person's judgement
    var was = /^-?\d{1,2},(\d{7,9})$/.exec(((window.mkGetWorkerSkin && window.mkGetWorkerSkin(worker)) || {}).fa || '');
    // sent at once, as a logged drink is: the other computers have it at their next look (they look every 30 s)
    window.mkPatchWorkerSkin(worker, { fa: n ? n + ',' + (was ? was[1] : Math.floor(Date.now() / 60000)) : null }, 1);
    fly(b, worker, +b.dataset.d);
  }, true);

  /* The picker: the faces by name beside the card; a press puts the face on the card at once and saves it to
     the person's look (everyone sees it; a PIN-locked card refuses as it does for the look). With Dzīvnieks
     chosen, the pets open beside the list: their groups, twelve pictures a page (no scrolling), a press takes one. */
  var ICON = {
    b: '<path d="M10 23C10 10 16 4 22 4s12 6 12 19c0 3-24 3-24 0Z" fill="none" stroke-width="2.4"/><circle cx="18" cy="14" r="1.6" stroke="none" fill="currentColor"/><circle cx="26" cy="14" r="1.6" stroke="none" fill="currentColor"/>',
    p: '<path d="M11 23V11l-1-7 6 4h12l6-4-1 7v12Z" fill="none" stroke-width="2.4"/><circle cx="18" cy="15" r="1.6" stroke="none" fill="currentColor"/><circle cx="26" cy="15" r="1.6" stroke="none" fill="currentColor"/>'
  };
  var PAGE = 12, pick = null;
  function place() {
    var el = pick.el, r = pick.card.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, left = r.left > innerWidth / 2 ? r.left - w - 10 : r.right + 10;
    el.style.left = Math.max(8, Math.min(innerWidth - w - 8, left)) + 'px';
    el.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top)) + 'px';
  }
  function petPanel() {
    if (!pick) return;
    var box = pick.el.querySelector('.sfp-pets'), card = pick.card, on = (card.dataset.sf || 'b') === 'p';
    if (card.dataset.sf === 'b') {
      var d = read(card), mine = petKind(d);
      box.hidden = false;
      box.innerHTML = '<div class="sfp-grid sfp-kinds">' + KINDS.map(function (k) {
        return '<button type="button" data-kind="' + k + '" aria-pressed="' + (k === mine) + '" title="' + KIND_NAMES[k] + '"><img src="' + petSrc(k, { level: d.level, score: d.score }) + '" alt="' + KIND_NAMES[k] + '" draggable="false"></button>';
      }).join('') + '</div>';
      place();
      return;
    }
    if (on) loadPets();
    box.hidden = !on || !pets || !pets.length;
    if (box.hidden) { place(); return; }
    var cur = pets[petIndex(card)];
    if (pick.group == null) { pick.group = cur.g; pick.page = Math.floor(pets.filter(function (x) { return x.g === cur.g; }).indexOf(cur) / PAGE); }
    var list = pets.filter(function (x) { return x.g === pick.group; }), pages = Math.max(1, Math.ceil(list.length / PAGE));
    pick.page = Math.max(0, Math.min(pages - 1, pick.page));
    box.innerHTML = '<div class="sfp-tabs">' + groups.map(function (t, i) { return '<button type="button" data-group="' + i + '" aria-pressed="' + (i === pick.group) + '">' + esc(t) + '</button>'; }).join('') + '</div>'
      + '<div class="sfp-grid">' + list.slice(pick.page * PAGE, pick.page * PAGE + PAGE).map(function (x) {
        return '<button type="button" data-pet="' + x.id + '" aria-pressed="' + (x === cur) + '" title="' + esc(x.name) + '"><img src="' + esc(x.dir) + 'poster.webp" alt="' + esc(x.name) + '" loading="lazy" decoding="async" draggable="false"></button>';
      }).join('') + '</div>'
      + '<div class="sfp-nav"><button type="button" data-page="-1" aria-label="Iepriekšējā lapa"' + (pick.page ? '' : ' disabled') + '>‹</button><span>' + esc(cur.name) + '</span><button type="button" data-page="1" aria-label="Nākamā lapa"' + (pick.page < pages - 1 ? '' : ' disabled') + '>›</button></div>';
    place();
  }
  function close() {
    if (!pick) return;
    pick.el.remove(); pick = null;
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('keydown', onKey, true);
  }
  function outside(e) { if (pick && !pick.el.contains(e.target) && !(e.target.closest && e.target.closest('.mk-side-plus, .sf-pick'))) close(); }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.mk-sf .sf-pick'), card = b && b.closest('.mk-side-card');
    if (!card) return;
    e.preventDefault(); e.stopPropagation();   // not the card's own press (the person's window)
    open(card);
  }, true);
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
  function open(card) {
    var worker = card.dataset.worker || '';
    if (pick && pick.worker === worker) { close(); return; }
    close();
    var el = document.createElement('div'), cur = card.dataset.sf || 'b';
    el.id = 'mkSfPick'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Kartītes skats');
    el.innerHTML = '<div class="sfp-faces">' + FACES.map(function (f) {
      return '<button type="button" data-f="' + f[0] + '" aria-pressed="' + (f[0] === cur) + '"><svg viewBox="0 0 44 26" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[f[0]] + '</svg>' + f[1] + '</button>';
    }).join('') + '</div><div class="sfp-pets" hidden></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !window.mkPatchWorkerSkin) return;
      if (b.dataset.f) {
        // "k" is kept (not removed), so going back to the classic face reaches the other devices too; the pet stays the chosen one
        // the chosen pet or kind goes along only to the face it belongs to
        // the chosen pet or kind goes along to the face it belongs to, also after a look at another face
        if (card.dataset.sfp) pick.own[card.dataset.sf] = card.dataset.sfp;
        var own = pick.own[b.dataset.f];
        window.mkPatchWorkerSkin(worker, { sf: own ? b.dataset.f + '-' + own : b.dataset.f });
        [].forEach.call(el.querySelectorAll('button[data-f]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      } else if (b.dataset.pet) window.mkPatchWorkerSkin(worker, { sf: 'p-' + b.dataset.pet });
      else if (b.dataset.kind) window.mkPatchWorkerSkin(worker, { sf: 'b-' + b.dataset.kind });
      else if (b.dataset.group) { pick.group = +b.dataset.group; pick.page = 0; }
      else if (b.dataset.page) pick.page += +b.dataset.page;
      petPanel();
    });
    pick = { el: el, worker: worker, card: card, group: null, page: 0, own: {} };
    petPanel();
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', onKey, true);
    (el.querySelector('[aria-pressed="true"]') || el.querySelector('button')).focus();
  }

  window.MkSideFaces = { sync: sync, open: open, close: close, faces: FACES };
})();
