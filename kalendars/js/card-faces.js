/* Watch-inspired card faces. Existing live DOM is retained; only the editor drags.
   No animation loop, WebGL, image segmentation, or background network requests. */
(function () {
  'use strict';
  var M = window.MinkaCardFaceModel;
  var labels = { hours: 'Maiņas stundas', name: 'Vārds', initials: 'Iniciāļi', month: 'Stundas mēnesī', coffee: 'Kafija', fatigue: 'Nogurums', remaining: 'Maiņas laiks', emoji: 'Emoji', clock: 'Pulkstenis', moon: 'Saule / mēness' };
  var selectors = { hours: '.mk-mid-hours', name: '.mk-mid-name-wrap', initials: '.mk-mid-initials', month: '.mk-mid-month', coffee: '.mk-mid-coffee', fatigue: '.mk-mid-meta-fat', remaining: '.mk-mid-meta-time', emoji: '.mk-mid-meta-emoji', clock: '.mk-wf-clock', moon: '.mk-wf-moon' };
  var titles = ['Klasika', 'Foto stikls', 'Loks', 'Moduļi', 'Winamp', 'Dither'];
  var metals = [
    ['Sudrabs','#d7d9de'],['Dabiskais titāns','#b7afa0'],['Melnais titāns','#484a50'],['Rozā zelts','#d9b3a7'],
    ['Zelts','#c7ac7c'],['Slānekļa titāns','#71747a'],['Tuksneša titāns','#c4a98d'],['Baltais titāns','#e7e5de'],
    ['Zilais titāns','#74869e'],['Pusnakts','#303b4a'],['Zvaigžņu gaisma','#e2d8c2'],['Kosmosa pelēks','#858589']
  ];
  var colors = [
    ['Ledus','#d5e6ef'],['Rozā','#f4cec7'],['Ceriņi','#c8b5eb'],['Ultramarīns','#718aff'],['Debeszils','#a5cbea'],
    ['Tirkīzs','#73e2de'],['Salvija','#bacb98'],['Laima','#c8e69f'],['Dzintars','#f0c180'],['Oranžs','#ef9260'],
    ['Koraļļu','#ee9aa0'],['Sarkans','#e67579'],['Balts','#f1f0ec'],['Grafīts','#9da4af'],
    ['Kosmiski oranžs','#e98b50'],['Dziļi zils','#64799b'],['Miglas zils','#cadbea'],['Lavanda','#c9c2df'],['Salvijas zaļš','#c2cab4'],['Mākoņu balts','#eeeae4'],['Gaišs zelts','#e5d8bb'],['Nakts melns','#62666d']
  ];
  var clockTimer = 0;
  var masks = new Map();
  var currentPick = function () { return null; };
  var releaseContours = function () {};
  var currentSettle = function () {};
  var previewObserver = null;
  var previewFrame = 0;
  var refreshPreview = function() {};
  var coffeePalettes = new Map();
  function applyCoffee(card,skin,config) {
    var mode=M.effectiveCoffeeMode(config);
    if(card.dataset.coffeeMode!==(mode?'open':'icon'))delete card.dataset.coffeeExpanded;
    card.dataset.coffeeMode=mode?'open':'icon';
    var button=card.querySelector('button.mk-coffee-mid');
    if(button){
      if(mode){button.removeAttribute('aria-expanded');button.setAttribute('aria-label','Atvērt kafijas izvēlni');}
      else {var expanded=card.dataset.coffeeExpanded==='true';button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'Sakļaut kafijas pogas':'Atvērt kafijas pogas');}
    }
    card.dataset.coffeeContrast=['glass','auto','tint'][config.coffeeContrast];
    if(!config.coffeeContrast){delete card.dataset.coffeePalette;return;}
    if(config.coffeeContrast===2){
      delete card.dataset.coffeePalette;
      var tinted=M.coffeeColors(config.tint.match(/../g).map(function(v){return parseInt(v,16);}).join(','),true);
      card.style.setProperty('--wf-coffee-bg',tinted.background);card.style.setProperty('--wf-coffee-ink',tinted.foreground);return;
    }
    var key=JSON.stringify([skin.t,skin.id,skin.rgb]);
    if(card.dataset.coffeePalette===key)return;
    card.dataset.coffeePalette=key;
    function paint(rgb){var c=M.coffeeColors(rgb);card.style.setProperty('--wf-coffee-bg',c.background);card.style.setProperty('--wf-coffee-ink',c.foreground);}
    paint(skin.rgb);
    if(typeof window.mkSuggestSkinPalette!=='function')return;
    if(!coffeePalettes.has(key)){
      if(coffeePalettes.size>=128)coffeePalettes.delete(coffeePalettes.keys().next().value);
      coffeePalettes.set(key,window.mkSuggestSkinPalette(skin).catch(function(){return null;}));
    }
    coffeePalettes.get(key).then(function(palette){
      if(palette&&card.dataset.coffeeContrast==='auto'&&card.dataset.coffeePalette===key)paint(palette.source||palette.num);
    });
  }
  /* Analog shift timer ("Maiņas laiks" → Analogs). A 12-hour dial: the rest of
     the shift as an arc, the hand at the time now, the hours left in its tip.
     skin.tm = skin a–e + hand (1 dot, 2 needle, 3 bar) + face (1 light, 2 dark,
     3 clear); the colour is the element's own (or the accent). Inline SVG,
     redrawn once a minute — lighter than the digital timer's per-second text. */
  var dialTimer = 0;
  var PLATES = ['', 'dark', 'clear', 'tinted', 'light'];
  function hm(t) { var m = /^(\d{1,2}):(\d\d)$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; }
  /* f–h are M3 Expressive progress dials (see m3Dial); p–t the M3 clock's digital
     readouts (alarm tile, stopwatch, outlined alarm, timer, time-input pills). One field (skin.tm) keeps both: an
     analog skin + hand + face, or a digital skin + "11". Their digits are the
     Google Sans Flex cut in assets/fonts/m3-digits (fetched only when shown). */
  var DIAL_SKINS = [['a', 'Stikls'], ['b', 'Hronogrāfs'], ['c', 'Gredzens'], ['d', 'Rastrs'], ['e', 'Segmenti'], ['f', 'Aplis'], ['g', 'Cepums'], ['h', 'Vilnis']];
  var DIGIT_SKINS = [['p', 'Modinātājs'], ['q', 'Hronometrs'], ['r', 'Kontūra'], ['s', 'Taimeris'], ['t', 'Plāksnes']];
  var DIAL_RE = /^[a-h][1-3][1-3]$/, DIGIT_RE = /^[p-t]11$/, TM_RE = /^(?:[a-h][1-3][1-3]|[p-t]11)$/;
  /* Colours are never baked in: the SVG draws with currentColor (the card's accent,
     or the element's own colour, or the dither ink) and --dial-ink; the dial's round
     plate is the same tinted glass (or dotted dither chip) as the card's other chips.
     The worked part of the shift is a conic mask on a plain element — no SVG ids. */
  function dialMarkup(el, tm) {
    var skin = tm[0], hand = +tm[1] || 1;
    var s = hm(el.dataset.start), e = hm(el.dataset.end), active = s != null && e != null;
    if (!active) {
      var m = /(\d{1,2})(?::(\d\d))?\s*[–-]\s*(\d{1,2})(?::(\d\d))?/.exec(el.textContent || '');
      if (m) { s = +m[1] * 60 + (+m[2] || 0); e = +m[3] * 60 + (+m[4] || 0); }
    }
    var d = new Date(), now = el.dataset.dialNow ? +el.dataset.dialNow : d.getHours() * 60 + d.getMinutes();
    if (s != null && e <= s) e += 1440;
    if (active && now < s) now += 1440;
    /* Where the shift stands, told plainly. The card knows the shift window; when
       the calendar shows today, the time decides — so the dial turns to "on duty"
       by itself at the start (its minute repaint), without waiting for a redraw. */
    function two(n) { return String(n).padStart(2, '0'); }
    function hhmm(min) { min = ((min % 1440) + 1440) % 1440; return two(Math.floor(min / 60)) + ':' + two(min % 60); }
    function dur(min) { return Math.floor(min / 60) + ':' + two(min % 60); }
    var phase = 'none';
    if (active) phase = 'on';
    else if (s != null) {
      // The calendar's own "today" (its duty day) when it has one, else the clock's date
      // — the calendar writes dates as 27.09.2026, older code as 2026-09-27.
      var shown = String(window.__activeDateStr || ''), todays = window.__todayDateStr
        ? [String(window.__todayDateStr)]
        : [two(d.getDate()) + '.' + two(d.getMonth() + 1) + '.' + d.getFullYear(), d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate())];
      if (todays.indexOf(shown) < 0) phase = 'plan';
      else if (now >= s && now < e) phase = 'on';
      else phase = now < s ? 'soon' : 'done';
    }
    var left = phase === 'on' ? Math.max(0, e - now) : phase === 'soon' ? s - now : s == null ? 0 : e - s;
    var big = s == null ? '' : phase === 'on' || phase === 'soon' ? dur(left) : Math.round(left / 60) + 'h';
    var small = { on: 'ATLIKUŠAS', soon: 'LĪDZ ' + hhmm(s), done: 'BEIGUSIES', plan: s == null ? '' : hhmm(s).slice(0, 2) + '–' + hhmm(e).slice(0, 2) }[phase] || '';
    active = phase === 'on';
    if (skin === 'f' || skin === 'g' || skin === 'h') return m3Dial(skin, s, e, now, phase, left, hhmm, dur);
    /* Read like the Nakts clock (one look is enough): the shift's hours as a thick,
       soft arc on the rim, the part already worked bright over it, a round dot where
       it ends, and a real clock's hour and minute hands at the time now. A 12-hour
       dial shows the last 12 hours of a longer shift on the rim; the hours before
       them are a thinner inner lap from now, so a 24-hour shift reads too. */
    function pt(min, r) { var a = (min % 720) / 720 * Math.PI * 2 - Math.PI / 2; return [(50 + r * Math.cos(a)).toFixed(2), (50 + r * Math.sin(a)).toFixed(2)]; }
    function arc(from, span, r) {
      if (span >= 719.5) return 'M' + (50 - r) + ' 50A' + r + ' ' + r + ' 0 1 1 ' + (50 + r) + ' 50A' + r + ' ' + r + ' 0 1 1 ' + (50 - r) + ' 50';
      var p0 = pt(from, r), p1 = pt(from + span, r); return 'M' + p0.join(' ') + 'A' + r + ' ' + r + ' 0 ' + (span > 360 ? 1 : 0) + ' 1 ' + p1.join(' ');
    }
    function line(a, b, cls) { return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="' + cls + '"/>'; }
    function path(d, cls) { return '<path class="' + cls + '" d="' + d + '"/>'; }
    var plan = phase === 'soon' || phase === 'plan';   // not started: the window, dashed, with its start point
    var pc = plan ? ' plan' : '', ended = phase === 'done';
    // the rim shows at most the shift's last 12 hours; before them, an inner lap
    var first = s == null ? null : Math.max(s, e - 720);
    var lapFrom = s == null ? 0 : active ? now : s, lap = s == null || ended ? 0 : Math.max(0, first - lapFrom);
    var doneTo = active ? Math.max(first, now) : ended ? e : first;          // the worked part, on the rim
    var R = { a: 42, b: 37.5, c: 41, d: 44, e: 42 }[skin] || 42;
    var body = '', label = 'mid', mask = '';
    function rimArcs(r) {
      if (s == null) return '';
      var out = path(arc(first, e - first, r), 'trk' + pc);
      if (doneTo > first) out += path(arc(first, doneTo - first, r), 'dn');
      return out;
    }
    function endDot(r) { if (s == null) return ''; var q = pt(e, r); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.6" class="end"/>'; }
    if (skin === 'a') {
      for (var h = 0; h < 12; h++) body += line(pt(h * 60, 34), pt(h * 60, h % 3 ? 31 : 28.5), h % 3 ? 'tk' : 'tk q');
      body += rimArcs(R);
    } else if (skin === 'b') {
      for (var i = 0; i < 60; i++) body += line(pt(i * 12, 47.5), pt(i * 12, i % 5 ? 45.6 : 44), i % 5 ? 'tk fine' : 'tk');
      body += [12, 3, 6, 9].map(function(n, k) { var q = pt(k * 180, 27.5); return '<text class="num" x="' + q[0] + '" y="' + (+q[1] + 3.3) + '">' + n + '</text>'; }).join('');
      body += rimArcs(R);
      body += '<circle cx="50" cy="66" r="12.5" class="sub"/>'; label = 'sub';
    } else if (skin === 'c') {
      body += '<circle cx="50" cy="50" r="' + R + '" class="ring-track"/>' + rimArcs(R);
      hand = 0; label = 'big';
    } else if (skin === 'd') {
      for (var y = 8; y <= 92; y += 6.5) for (var x = 8; x <= 92; x += 6.5) {
        var dx = x - 50, dy = y - 50, rr = Math.hypot(dx, dy);
        if (rr > 44) continue;
        var mm = ((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360) / 360 * 720, cls = 'px', rad = .8;
        if (s != null) {
          var k1 = ((mm - first % 720) % 720 + 720) % 720;
          if (k1 <= doneTo - first && doneTo > first) { cls = 'px on'; rad = 2.1; }
          else if (k1 <= e - first) { cls = 'px rest-dot' + pc; rad = 1.7; }
        }
        body += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rad + '" class="' + cls + '"/>';
      }
      label = 'plate';
    } else {
      for (var g = 0; g < 12; g++) {
        var g0 = g * 60;
        body += path(arc(g0 + 3, 54, R), 'seg');
        if (s == null) continue;
        // this segment's minutes inside the shift (rim window) and inside the worked part
        var k0 = ((g0 - first % 720) % 720 + 720) % 720, a0 = Math.max(k0, 0), inWin = Math.max(0, Math.min(k0 + 60, e - first) - a0);
        if (k0 < e - first && inWin > 4) body += path(arc(g0 + 3, Math.min(54, inWin - 3), R), 'seg rest' + pc);
        var inDone = Math.max(0, Math.min(k0 + 60, doneTo - first) - a0);
        if (k0 < doneTo - first && inDone > 4) body += path(arc(g0 + 3, Math.min(54, inDone - 3), R), 'seg on');
      }
    }
    if (lap > 0) body += path(arc(lapFrom, lap, skin === 'b' ? 32 : skin === 'd' ? 47.5 : R - 8), 'lap' + pc);
    if (skin !== 'd' || s != null) body += endDot(skin === 'd' ? 47.5 : R);
    // The start point, on the dial's rim: a dot with a tick, so "it begins here" reads at a glance.
    if (plan && s != null) { var st = pt(s, R + 3), st2 = pt(s, R - 7); body += line(st2, st, 'start-tick') + '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="3.3" class="start"/>'; }
    // a real clock while it counts: the hour hand (its style), and a thin minute hand
    var handSvg = '', showHands = hand && (active || phase === 'soon');
    if (showHands) {
      var tip = pt(now, hand === 3 ? 24 : 29), tail = pt(now + 360, 7), mtip = [(50 + 36 * Math.sin(now % 60 / 60 * Math.PI * 2)).toFixed(2), (50 - 36 * Math.cos(now % 60 / 60 * Math.PI * 2)).toFixed(2)];
      handSvg = line(['50', '50'], mtip, 'hand min');
      if (hand === 1) handSvg += line(['50', '50'], tip, 'hand') + '<circle cx="' + tip[0] + '" cy="' + tip[1] + '" r="2.4" class="knob"/>';
      else if (hand === 2) handSvg += line(tail, tip, 'hand') + '<circle cx="50" cy="50" r="2.6" class="pin"/>';
      else handSvg += line(['50', '50'], tip, 'hand bar');
      handSvg += '<circle cx="50" cy="50" r="1.6" class="knob"/>';
    }
    if (skin === 'c' && active) { var kn = pt(now, R); handSvg += '<circle cx="' + kn[0] + '" cy="' + kn[1] + '" r="3.4" class="knob now"/>'; }
    var txt = '';
    if (big) {
      if (label === 'sub') txt = '<text class="v s" x="50" y="68.2">' + big + '</text>';
      else if (label === 'big') txt = '<text class="v xl" x="50" y="55">' + big + '</text><text class="l" x="50" y="64">' + small + '</text>';
      else if (label === 'plate') txt = '<rect x="30" y="58" width="40" height="15" rx="7.5" class="plate"/><text class="v s" x="50" y="68.6">' + big + '</text>';
      else txt = '<text class="v" x="50" y="70">' + big + '</text><text class="l" x="50" y="77.5">' + small + '</text>';
    }
    return mask + '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + handSvg + txt + '</svg>';
  }
  /* M3 dials (f Aplis, g Cepums, h Vilnis), after Material's circular progress and
     the Tomato timer: built to be read at card size — a solid tonal disc, a thick
     ring (the part of the shift still to go, depleting clockwise from 12) with a gap
     before its track, and one big number. Nothing smaller than the number.
       on duty → the time left (7:42), the ring = what is left of the shift
       today, not started → the start time (20:00), track only, a dot at 12
       another day / over → the window (20–08), quiet. */
  function m3Dial(skin, s, e, now, phase, left, hhmm, dur) {
    var R = skin === 'g' ? 44 : 41, frac = s == null ? 0 : phase === 'on' ? Math.max(0, Math.min(1, left / Math.max(1, e - s))) : 0;
    var text = s == null ? '' : phase === 'on' ? dur(left) : phase === 'soon' ? hhmm(s) : hhmm(s).slice(0, 2) + '–' + hhmm(e).slice(0, 2);
    function ap(deg, r) { var a = deg * Math.PI / 180; return (50 + r * Math.sin(a)).toFixed(2) + ' ' + (50 - r * Math.cos(a)).toFixed(2); }
    function arcD(a0, a1, r) { if (a1 - a0 >= 359.5) return 'M50 ' + (50 - r) + 'A' + r + ' ' + r + ' 0 1 1 49.99 ' + (50 - r) + 'Z'; return 'M' + ap(a0, r) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + ap(a1, r); }
    function waveD(a0, a1, r, amp, n) {
      var d = '', steps = Math.max(8, Math.ceil((a1 - a0) / 2.5));
      for (var i = 0; i <= steps; i++) { var a = a0 + (a1 - a0) * i / steps, k = Math.min(1, (a - a0) / 8, (a1 - a) / 8); d += (i ? 'L' : 'M') + ap(a, r + amp * k * Math.sin(a / 360 * n * Math.PI * 2)); }
      return d;
    }
    var body = '', end = frac * 360, gap = 17;
    if (skin === 'g') {
      // an M3 cookie (9 soft sides): the plate, and its own outline is the ring
      var ck = '';
      for (var i = 0; i <= 180; i++) { var a = i * 2; ck += (i ? 'L' : 'M') + ap(a, 41.5 + 3.4 * Math.cos(a / 360 * 9 * Math.PI * 2)); }
      body += '<path class="m3disc" d="' + ck + 'Z"/>';
      body += '<path class="m3trk" pathLength="100" d="' + ck + '"/>';
      if (frac > 0) body += '<path class="m3ind" pathLength="100" stroke-dasharray="' + (frac * 100).toFixed(1) + ' 101" d="' + ck + '"/>';
    } else {
      body += '<circle class="m3disc" cx="50" cy="50" r="47.5"/>';
      if (frac <= 0) body += '<path class="m3trk" d="' + arcD(0, 360, R) + '"/>';
      else if (end >= 360 - gap) body += skin === 'h' ? '<path class="m3ind" d="' + waveD(0, 360, R, 2.1, 12) + '"/>' : '<path class="m3ind" d="' + arcD(0, 360, R) + '"/>';
      else {
        body += '<path class="m3trk" d="' + arcD(end + gap, 360 - gap, R) + '"/>';
        body += '<path class="m3ind" d="' + (skin === 'h' && end > 30 ? waveD(0, end, R, 2.1, 12) : arcD(0, end, R)) + '"/>';
      }
    }
    if (phase === 'soon') body += '<circle class="m3dot" cx="50" cy="' + (50 - R) + '" r="3.2"/>';
    if (text) {
      var n = text.length, size = n <= 4 ? 27 : 23.5;
      body += '<text class="m3num' + (phase === 'on' ? '' : ' q') + '" x="50" y="' + (50 + size * .35).toFixed(1) + '" style="font-size:' + size + 'px">' + text + '</text>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + '</svg>';
  }
  // Small previews for the skin picker: a 20–08 shift at 01:40 (on duty, so the worked part shows).
  function dialPreview(tm) {
    var el = document.createElement('span'); el.textContent = '20–08'; el.dataset.dialNow = '100';
    el.dataset.start = '20:00'; el.dataset.end = '08:00';
    return dialMarkup(el, tm);
  }
  function paintDial(el) {
    var tm = el.dataset.tm, box = el.querySelector(':scope > .mk-wf-dial');
    if (!box) { box = document.createElement('span'); el.append(box); }
    var card = el.closest('.card'), dth = !!card && card.matches('[data-watch-face="dither"], .mk-fx-dither');
    var cls = 'mk-wf-dial f' + tm[2] + ' sk-' + tm[0] + (dth ? ' dth' : '');
    if (box.className !== cls) box.className = cls;
    var html = dialMarkup(el, tm);
    if (box.__html !== html) { box.innerHTML = html; box.__html = html; }
    el.setAttribute('aria-label', 'Maiņas laiks: ' + ((box.querySelector('.v, .m3num') || {}).textContent || ''));
  }
  /* M3 digital readouts (p–s). The calendar keeps writing the timer text once a
     second as before; a mirror in digit groups is drawn next to it (the text stays
     for screen readers). Only a group whose digits changed is rewritten. */
  // Two-digit hours, as the M3 clock writes them (07:42, not 7:42).
  function m3Tokens(text) {
    var t = String(text || '').match(/\d+|[:–-]/g) || [];
    if (t[0] && t[0].length === 1) t[0] = '0' + t[0];
    return t;
  }
  /* Taimeris fades what is still zero at the front (00:42:10): a whole zero group
     and the separator after it fade once (.z), a group's own leading zero is <u>. */
  function m3Group(t, zeroGroup, skin) {
    if (skin !== 's' || zeroGroup) return t;
    var z = /^0+(?=\d)/.exec(t);
    return z ? '<u>' + z[0] + '</u>' + t.slice(z[0].length) : t;
  }
  function m3Classes(tokens, skin) {
    var lead = true;
    return tokens.map(function (t) {
      if (!/\d/.test(t)) return (t === ':' ? 'cl' : 'ds') + (skin === 's' && lead ? ' z' : '');
      var zero = lead && /^0+$/.test(t), leadIn = lead; lead = zero;
      return 'g' + (skin === 's' && zero ? ' z' : '') + (leadIn ? '' : ' mid');
    });
  }
  function m3Markup(text, skin) {
    var tokens = m3Tokens(text), cls = m3Classes(tokens, skin);
    return (skin === 'q' ? '<i class="lead"></i>' : '') + tokens.map(function (t, i) {
      if (!/\d/.test(t)) return '<i class="' + cls[i] + '"></i>';
      return '<b class="' + cls[i] + '">' + m3Group(t, / z/.test(cls[i]), cls[i].indexOf('mid') < 0 ? skin : '') + '</b>';
    }).join('');
  }
  function m3Source(el) {
    var v = el.querySelector(':scope > .val');
    if (v) return v.textContent;
    var t = '';
    el.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.nodeValue; else if (n.nodeType === 1 && n.classList.contains('wf-dial-text')) t += n.textContent; });
    return t.trim();
  }
  function m3Paint(el) {
    var skin = el.dataset.td, text = m3Source(el), box = el.querySelector(':scope > .mk-m3d');
    if (!box) { box = document.createElement('span'); box.setAttribute('aria-hidden', 'true'); el.append(box); }
    var cls = 'mk-m3d m3-' + skin;
    if (box.className !== cls) { box.className = cls; box.dataset.shape = ''; box.dataset.text = ''; }
    var tokens = m3Tokens(text), shape = tokens.map(function (t) { return /\d/.test(t) ? 'd' + t.length : t; }).join();
    if (box.dataset.text === text) return;
    box.dataset.text = text;
    if (box.dataset.shape !== shape) { box.innerHTML = m3Markup(text, skin); box.dataset.shape = shape; return; }
    // Same shape (a second ticked): only what changed is rewritten.
    var nodes = box.children, off = skin === 'q' ? 1 : 0, kinds = m3Classes(tokens, skin);
    tokens.forEach(function (t, i) {
      var n = nodes[i + off];
      if (n.className !== kinds[i]) n.className = kinds[i];
      if (!/\d/.test(t)) return;
      var html = m3Group(t, / z/.test(kinds[i]), kinds[i].indexOf('mid') < 0 ? skin : '');
      if (n.__t !== html) { n.innerHTML = html; n.__t = html; }
    });
  }
  function m3Watch(el) {
    m3Paint(el);
    if (el.__m3Obs || typeof MutationObserver !== 'function') return;
    el.__m3Obs = new MutationObserver(function (list) {
      if (list.some(function (m) { var t = m.target.nodeType === 1 ? m.target : m.target.parentElement; return !(t && t.closest('.mk-m3d')); })) m3Paint(el);
    });
    el.__m3Obs.observe(el, { childList: true, characterData: true, subtree: true });
  }
  function clearM3(el) {
    if (!el.classList.contains('wf-m3d')) return;
    el.classList.remove('wf-m3d'); delete el.dataset.td;
    if (el.__m3Obs) { el.__m3Obs.disconnect(); delete el.__m3Obs; }
    var box = el.querySelector(':scope > .mk-m3d'); if (box) box.remove();
  }
  // Picker tiles: the readout as it looks on duty.
  function digitPreview(key) { return '<span class="mk-m3d m3-' + key[0] + '">' + m3Markup(key[0] === 's' ? '0:42:10' : '7:42:10', key[0]) + '</span>'; }
  function setDial(card, skin, config) {
    var el = card.querySelector('[data-wf-part="remaining"]');
    if (!el) return;
    var tm = skin && TM_RE.test(String(skin.tm || '')) && config && config.face !== 'winamp' ? skin.tm : '';
    if (DIGIT_RE.test(tm)) { el.classList.add('wf-m3d'); el.dataset.td = tm[0]; m3Watch(el); tm = ''; }
    else clearM3(el);
    if (!tm) {
      if (el.classList.contains('wf-analog')) { el.classList.remove('wf-analog'); delete el.dataset.tm; el.removeAttribute('aria-label'); var old = el.querySelector(':scope > .mk-wf-dial'); if (old) old.remove(); }
      return;
    }
    el.classList.add('wf-analog'); el.dataset.tm = tm;
    // The static shift window is a bare text node: tuck it into a span the dial hides.
    Array.prototype.slice.call(el.childNodes).forEach(function(n) {
      if (n.nodeType === 3 && n.nodeValue.trim()) { var t = document.createElement('span'); t.className = 'wf-dial-text'; el.insertBefore(t, n); t.append(n); }
    });
    paintDial(el);
    if (!dialTimer) dialTimer = setTimeout(paintDials, 60000 - Date.now() % 60000 + 40);
  }
  function paintDials() {
    clearTimeout(dialTimer); dialTimer = 0;
    if (document.hidden) return;
    var nodes = document.querySelectorAll('.wf-analog[data-tm]');
    if (!nodes.length) return;
    nodes.forEach(paintDial);
    dialTimer = setTimeout(paintDials, 60000 - Date.now() % 60000 + 40);
  }
  document.addEventListener('visibilitychange', paintDials);
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function paintClock() {
    clearTimeout(clockTimer); clockTimer = 0;
    if (document.hidden) return;
    var nodes = document.querySelectorAll('.mk-watch-face .mk-wf-clock:not([hidden])');
    if (!nodes.length) return;
    var time = new Intl.DateTimeFormat('lv-LV', { timeZone: 'Europe/Riga', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    nodes.forEach(function (el) { if (el.textContent !== time) el.textContent = time; });
    document.querySelectorAll('.card.wf-winamp .mk-wa-pos').forEach(function (el) { el.style.setProperty('--p', waProgress(el.closest('.card')).toFixed(3)); });
    clockTimer = setTimeout(paintClock, 60000 - Date.now() % 60000 + 25);
  }
  document.addEventListener('visibilitychange', paintClock);
  function orbitArt() {
    // Two corner arcs only; the earlier faint inner frame read as a stray box.
    return '<svg viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true"><path d="M18 69V53Q18 18 53 18H116 M182 131V147Q182 182 147 182H84" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" opacity=".65"/></svg>';
  }
  /* Player face. The chrome is one sprite sheet composed from a classic
     Winamp 2 skin; the title marquee uses its 5x6 bitmap font (Latin letters
     only, so diacritics are stripped). The card's own elements keep their
     saved layout inside the display window. */
  var WA_SHEET = new URL('assets/winamp/base.png?v=20260912wa3', document.baseURI).href;
  var WA_FRAME = new URL('assets/winamp/frame.webp?v=20260912wa3', document.baseURI).href;
  var WA_NUMS = new URL('assets/winamp/numbers.png?v=20260913wa1', document.baseURI).href;
  /* Skin bitmaps only stay sharp at whole-number zoom, so the card picks the
     biggest step it can hold instead of stretching the sprite to fit. The time
     display gets its own step because it is the one thing with a hard frame to
     fit inside: H:MM:SS is 65 skin px of digits, colons and gaps, and the
     transport bar's panel is 41.5 units wide — 65 / (41.5 / 148) is where the
     step comes from. The title font has no such box, so it keeps the roomier
     step. Below that width the row is drawn at 1:1 anyway and the panel trims
     its edges: the seconds are the point of the readout, never the thing that
     gets dropped to make room. */
  var WA_ZOOM_STEP = 156;
  var WA_LCD_STEP = 232;
  function waZoom(card) {
    var width = card.clientWidth || card.getBoundingClientRect().width || 0;
    var step = function (size) { return Math.max(1, Math.min(6, Math.floor(width / size))); };
    var skin = step(WA_ZOOM_STEP), lcd = step(WA_LCD_STEP);
    var stamp = skin + ':' + lcd;
    if (card.dataset.waZoom === stamp) return;
    card.dataset.waZoom = stamp;
    card.style.setProperty('--wa-px', skin);
    card.style.setProperty('--wa-px-lcd', lcd);
  }
  // Re-fitting on every resize, not only when the zoom step changes: the card
  // is usually measured before it has been laid out, so the first run sees no
  // width at all and the row has to be re-measured once it has one.
  var waSizes = typeof ResizeObserver === 'function' ? new ResizeObserver(function (entries) {
    entries.forEach(function (entry) { waZoom(entry.target); waFitCard(entry.target); });
  }) : null;
  var WA_TEXT = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ"@   ', '0123456789….:()-\'!_+\\/[]^&%,=$#', 'ÅÖÄ?*'];
  var waRadio = { playing: false, text: '' };
  function waAscii(text) { return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
  function waBitmap(host, text) {
    var el = host.querySelector(':scope > .mk-wa-bmp');
    if (!el) { el = document.createElement('span'); el.className = 'mk-wa-bmp'; host.append(el); }
    if (el.dataset.text === text) return el;
    el.dataset.text = text;
    el.innerHTML = Array.prototype.map.call(text, function (ch) {
      if (ch === ' ') return '<b class="sp"></b>';
      var r = -1, c = -1;
      for (var i = 0; i < WA_TEXT.length && r < 0; i++) { var j = WA_TEXT[i].indexOf(ch); if (j >= 0) { r = i; c = j; } }
      if (r < 0) { r = 0; c = 28; }
      return '<b style="--c:' + c + ';--r:' + r + '"></b>';
    }).join('');
    return el;
  }
  function waMarquee(card) {
    var box = card.querySelector(':scope > .mk-wa .mk-wa-mqbox'); if (!box) return;
    var text = waRadio.playing && waRadio.text ? 'NOW PLAYING: ' + waAscii(waRadio.text) : '';
    if (!text) {
      var main = card.querySelector('.name-main'), sub = card.querySelector('.name-sub');
      text = waAscii(((main ? main.textContent : '') + ' ' + (sub ? sub.textContent : '')).trim());
    }
    text = text.replace(/\s+/g, ' ');
    var scroll = text.length > 8, run = scroll ? text + '  ***  ' : text;
    var el = waBitmap(box, scroll ? run + run : run);
    el.classList.toggle('is-scrolling', scroll);
    el.style.setProperty('--n', run.length);
    card.classList.toggle('is-playing', !!waRadio.playing);
  }
  // Shift progress for the position bar. Off duty the bar still sits part way
  // along, like a track that has been playing for a while: the scheduled
  // hours against the clock when they apply, otherwise a fixed spot per person.
  function waProgress(card) {
    var timer = card.querySelector('.duty-timer'), m = timer && /(\d+):(\d\d):(\d\d)/.exec(timer.textContent), hours = +card.dataset.dutyHours || 0;
    if (m && hours) return Math.max(0, Math.min(1, 1 - ((+m[1]) * 3600 + (+m[2]) * 60 + (+m[3])) / (hours * 3600)));
    var span = card.querySelector('.mk-mid-meta-time'), range = span && /(\d{1,2})\D+(\d{1,2})/.exec(span.textContent);
    if (range) {
      var now = new Date(), t = now.getHours() + now.getMinutes() / 60, start = +range[1], end = +range[2];
      if (end <= start) end += 24;
      if (t < start) t += 24;
      if (t >= start && t <= end) return Math.max(.04, Math.min(.96, (t - start) / (end - start)));
    }
    var h = 3, seed = card.dataset.worker || '';
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return .3 + (h % 40) / 100;
  }
  // The readout shows the timer exactly as the shift clock writes it.
  function waLcdText(raw) { return String(raw || '').replace(/\s+/g, ''); }
  /* Whatever the row measures, it is made to fit the panel rather than have
     its edge trimmed — a slightly soft last digit still tells the time, half a
     digit does not. The scale goes on the element itself, not through a custom
     property, so it holds even when the page is running an older stylesheet
     than this script. At every size where the row already fits it does
     nothing. */
  function waFitLcd(host, lcd) {
    lcd.style.transform = '';
    var room = host.clientWidth, row = lcd.scrollWidth || lcd.offsetWidth;
    if (room > 0 && row > room) lcd.style.transform = 'scale(' + (room / row).toFixed(3) + ')';
  }
  function waFitCard(card) {
    var host = card.querySelector('[data-wf-part="remaining"]');
    var row = host && host.querySelector(':scope > .mk-wa-lcd');
    if (host && row) waFitLcd(host, row);
  }
  function waLcdCell(ch) {
    if (/\d/.test(ch)) return '<b style="--c:' + ch + '"></b>';
    if (ch === ':') return '<b class="colon"></b>';
    if (/[-–—]/.test(ch)) return '<b class="dash"></b>';
    return '';
  }
  /* Shift time as Winamp's LCD digits (NUMBERS sprite); ':' and '–' are drawn
     with CSS. A running timer only ever changes a digit or two per second, so
     the cells are rewritten in place — rebuilding the row every second is work
     an old machine does not need to do. */
  function waLcd(el) {
    var text = waLcdText(el.textContent), lcd = el.querySelector(':scope > .mk-wa-lcd');
    if (!lcd) { lcd = document.createElement('span'); lcd.className = 'mk-wa-lcd'; lcd.setAttribute('aria-hidden', 'true'); el.append(lcd); }
    var previous = lcd.dataset.text;
    if (previous === text) return;
    lcd.dataset.text = text;
    if (previous && previous.length === text.length) {
      var cells = lcd.children, moved = false;
      for (var i = 0; i < text.length && !moved; i++) {
        if (text[i] === previous[i]) continue;
        if (/\d/.test(text[i]) && /\d/.test(previous[i])) cells[i].style.setProperty('--c', text[i]);
        else moved = true;
      }
      if (!moved) return;
    }
    lcd.innerHTML = Array.prototype.map.call(text, waLcdCell).join('');
    waFitLcd(el, lcd);
  }
  function waWatchLcd(el) {
    waLcd(el);
    if (el.__waObs || typeof MutationObserver !== 'function') return;
    el.__waObs = new MutationObserver(function (list) {
      if (list.some(function (m) { return !(m.target.nodeType === 1 && m.target.classList.contains('mk-wa-lcd')) && !(m.target.parentElement && m.target.parentElement.closest('.mk-wa-lcd')); })) waLcd(el);
    });
    el.__waObs.observe(el, { childList: true, characterData: true, subtree: true });
  }
  function clearWinamp(card) {
    if (!card.classList.contains('wf-winamp')) return;
    card.classList.remove('wf-winamp', 'is-playing');
    if (waSizes) waSizes.unobserve(card);
    delete card.dataset.waZoom;
    ['--wa-sheet','--wa-frame','--wa-nums','--wa-px','--wa-px-lcd'].forEach(function (key) { card.style.removeProperty(key); });
    card.querySelectorAll(':scope > .mk-wa').forEach(function (el) { el.remove(); });
    var fatigue = card.querySelector('[data-wf-part="fatigue"]'); if (fatigue) fatigue.style.removeProperty('--fat');
    card.style.removeProperty('--fat');
    var remaining = card.querySelector('[data-wf-part="remaining"]');
    if (remaining) { if (remaining.__waObs) { remaining.__waObs.disconnect(); delete remaining.__waObs; } var lcd = remaining.querySelector(':scope > .mk-wa-lcd'); if (lcd) lcd.remove(); }
  }
  function applyWinamp(card) {
    card.classList.add('wf-winamp');
    card.style.setProperty('--wa-sheet', 'url("' + WA_SHEET + '")');
    card.style.setProperty('--wa-frame', 'url("' + WA_FRAME + '")');
    card.style.setProperty('--wa-nums', 'url("' + WA_NUMS + '")');
    waZoom(card);
    if (waSizes) waSizes.observe(card);
    var root = card.querySelector(':scope > .mk-wa');
    if (!root) {
      root = document.createElement('div'); root.className = 'mk-wa'; root.setAttribute('aria-hidden', 'true');
      root.innerHTML = '<i class="mk-wa-mqbox"></i><i class="mk-wa-pos"><b></b><b></b></i><i class="mk-wa-meter"></i>';
      card.append(root);
    }
    root.querySelector('.mk-wa-pos').style.setProperty('--p', waProgress(card).toFixed(3));
    var fatigue = card.querySelector('[data-wf-part="fatigue"] .mk-mid-meta-value');
    var fat = fatigue ? (fatigue.textContent.match(/\d+/) || [0])[0] : 0;
    if (fatigue) fatigue.parentElement.style.setProperty('--fat', fat);
    card.style.setProperty('--fat', fat);
    var remaining = card.querySelector('[data-wf-part="remaining"]');
    if (remaining) waWatchLcd(remaining);
    waMarquee(card);
  }
  // The parent page reports what the radio plays; the daybook forwards it here.
  document.addEventListener('minka-shift-radio', function (e) {
    var d = (e && e.detail) || {};
    waRadio = { playing: !!d.playing, text: [d.artist, d.title].filter(Boolean).join(' - ') || d.name || '' };
    document.querySelectorAll('.card.wf-winamp').forEach(waMarquee);
  });
  function apply(card, skin) {
    if (!card || !card.matches('.mk-mid-card, .mk-skin-preview-real')) return;
    card.classList.add('mk-face-classic');
    var number = card.querySelector('.mk-mid-hours');
    if (number) { number.style.removeProperty('color'); number.style.removeProperty('-webkit-text-fill-color'); }
    var config = skin && skin.face ? M.clean(skin.face) : null;
    card.classList.toggle('mk-watch-face', !!config);
    if (!config) {
      delete card.dataset.watchFace; delete card.dataset.watchFinish;
      delete card.dataset.coffeeMode;delete card.dataset.coffeeContrast;delete card.dataset.coffeePalette;delete card.dataset.coffeeExpanded;
      var coffeeButton=card.querySelector('button.mk-coffee-mid');
      if(coffeeButton){coffeeButton.removeAttribute('aria-expanded');coffeeButton.setAttribute('aria-label','Atvērt kafijas izvēlni');}
      card.querySelectorAll('.wf-analog').forEach(function(el) { el.classList.remove('wf-analog'); delete el.dataset.tm; var dl = el.querySelector(':scope > .mk-wf-dial'); if (dl) dl.remove(); });
      card.querySelectorAll('.wf-m3d').forEach(clearM3);
      card.querySelectorAll('[data-wf-part]').forEach(function(el) {
        delete el.dataset.wfPart; el.hidden = false; el.classList.remove('wf-colored');
        ['--wf-x','--wf-y','--wf-scale','--wf-tint','--mk-txt-color'].forEach(function(p) { el.style.removeProperty(p); });
      });
      card.querySelectorAll('.mk-wf-art,.mk-wf-clock,.mk-wf-moon,.mk-wf-effects,.mk-wf-depth,.mk-wf-background').forEach(function(el) { el.remove(); });
      delete card.dataset.fullTintPalette;delete card.dataset.fullTint;delete card.dataset.fullTintScheme;['--wf-full-tint-hue','--wf-full-tint-sat'].forEach(function(p){card.style.removeProperty(p);});
      clearWinamp(card);
      var originalEmoji=card.querySelector('.mk-mid-bg-emoji');if(originalEmoji)originalEmoji.hidden=false;
      ['--wf-tint','--wf-metal','--wf-bg-x','--wf-bg-y','--wf-bg-zoom','--wf-name-chars','--wf-surname-chars','--wf-number-alpha'].forEach(function(p) { card.style.removeProperty(p); });
      paintClock(); if(window.MinkaDither&&window.MinkaDither.skin)window.MinkaDither.skin(card); return;
    }
    card.dataset.watchFace = config.face;
    applyCoffee(card,skin,config);
    // Keep legacy effect settings saved, but never run them on a custom face.
    card.classList.remove('mk-has-spark','mk-fx-hearts','mk-fx-mirdz','mk-fx-burb','mk-fx-ziedi','mk-fx-taur','mk-depth-live');
    if(skin.t==='hue'&&/^\d{1,3}(,\d{1,3}){2}$/.test(String(skin.rgb||'')))card.style.setProperty('--mk-skin-img','linear-gradient(rgb('+skin.rgb+'),rgb('+skin.rgb+'))');
    var surface=card.querySelector('.mk-wf-background');
    if(!surface){surface=document.createElement('div');surface.className='mk-wf-background';surface.setAttribute('aria-hidden','true');surface.append(document.createElement('i'));card.prepend(surface);}
    surface.firstElementChild.style.backgroundImage='var(--mk-skin-img)';
    card.style.setProperty('--wf-zoom-ratio',config.imageZoom/100);
    var material=skin.t==='img'&&window.MinkaFindCardMaterial(skin.id);
    var depth=card.querySelector('.mk-wf-depth');
    if(material&&skin.depth!==false){
      if(!depth){depth=document.createElement('div');depth.className='mk-wf-depth';depth.setAttribute('aria-hidden','true');card.append(depth);}
      if(!depth.firstElementChild)depth.append(document.createElement('i'));
      depth.style.backgroundImage='none';
      depth.firstElementChild.style.backgroundImage='url("'+new URL((material.foreground||material.path)+'?v=20260912photos1',document.baseURI).href+'")';
    }else if(depth)depth.remove();
    var backgroundEmoji=card.querySelector('.mk-mid-bg-emoji');if(backgroundEmoji)backgroundEmoji.hidden=!!material||!config.parts.emoji[3];
    card.dataset.watchFinish = String(config.finish);
    card.style.setProperty('--wf-number-alpha',Math.max(.15,Math.min(1,Number(skin.numA == null ? 1 : skin.numA)||0)));
    var effects=card.querySelector('.mk-wf-effects');
    var glyph={spark:'✦',hearts:'♡',mirdz:'✧',burb:'○',ziedi:'✿',taur:'ʚɞ'}[skin.fx];
    if(glyph){
      if(!effects){effects=document.createElement('div');effects.className='mk-wf-effects';effects.setAttribute('aria-hidden','true');card.append(effects);}
      if(effects.dataset.effect!==skin.fx){effects.innerHTML=[[8,12],[82,8],[94,52],[6,75],[75,92]].map(function(p){return '<span style="left:'+p[0]+'%;top:'+p[1]+'%">'+glyph+'</span>';}).join('');effects.dataset.effect=skin.fx;}
    }else if(effects)effects.remove();
    card.style.setProperty('--wf-tint', '#'+config.tint);
    card.style.setProperty('--wf-metal', metals[config.metal][1]);
    card.style.setProperty('--wf-bg-x', config.imageX+'%');
    card.style.setProperty('--wf-bg-y', config.imageY+'%');
    card.style.setProperty('--wf-bg-zoom', config.imageZoom+'%');
    var nameMain = card.querySelector('.name-main'), nameSub = card.querySelector('.name-sub');
    card.style.setProperty('--wf-name-chars', Math.max(1, (nameMain && nameMain.textContent || '').trim().length));
    card.style.setProperty('--wf-surname-chars', Math.max(1, (nameSub && nameSub.textContent || '').trim().length));
    var art = card.querySelector('.mk-wf-art');
    if (!art) { art = document.createElement('div'); art.className = 'mk-wf-art'; art.setAttribute('aria-hidden','true'); card.prepend(art); }
    if (art.dataset.face !== config.face) { art.innerHTML = config.face === 'orbit' ? orbitArt() : ''; art.dataset.face = config.face; }
    if (!card.querySelector('.mk-wf-clock')) { var clock = document.createElement('span'); clock.className = 'mk-wf-clock'; clock.setAttribute('aria-label','Laiks Rīgā'); card.append(clock); }
    if (!card.querySelector('.mk-wf-moon')) { var moon=document.createElement('span');moon.className='mk-wf-moon';moon.innerHTML='<i aria-hidden="true"></i>';moon.setAttribute('aria-label','Nakts maiņa');card.append(moon); }
    var shiftIcon=card.querySelector('.mk-mid-shift-emoji');
    var period=card.dataset.dutyPeriod||(shiftIcon&&shiftIcon.textContent.includes('🌙')?'night':shiftIcon&&shiftIcon.textContent.includes('☀')?'day':'mixed');
    card.dataset.shiftSymbol=period;
    card.classList.toggle('wf-night-shift',period==='night');
    card.querySelector('.mk-wf-moon').setAttribute('aria-label',period==='day'?'Dienas maiņa':'Nakts maiņa');
    M.parts.forEach(function(key) {
      var el = card.querySelector(selectors[key]);
      if (!el) return;
      var p = config.parts[key];
      el.dataset.wfPart = key; el.hidden = !p[3] || (key==='moon'&&period==='mixed'&&!card.classList.contains('wf-editing'));
      el.style.setProperty('--wf-x', p[0]+'%'); el.style.setProperty('--wf-y', p[1]+'%'); el.style.setProperty('--wf-scale', p[2]/100);
      // Own colour: the element gets its own tint and text colour variables, so
      // every rule that reads --wf-tint / --mk-txt-color picks it up locally.
      var own=config.fullTintMode===3?'':config.colors[key];
      el.classList.toggle('wf-colored',!!own);
      if(own){el.style.setProperty('--wf-tint','#'+own);el.style.setProperty('--mk-txt-color',own.match(/../g).map(function(v){return parseInt(v,16);}).join(','));}
      else{el.style.removeProperty('--wf-tint');el.style.removeProperty('--mk-txt-color');}
      // Its plate (card-face-model plates): the letters follow it, so it always reads.
      var plate=config.face==='winamp'?'':PLATES[(config.plates&&config.plates[key])||0];
      if(plate)el.dataset.wfPlate=plate;else delete el.dataset.wfPlate;
      var ink=own||config.tint, rgb=ink.match(/../g).map(function(v){return parseInt(v,16)/255;}), lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
      el.classList.toggle('wf-plate-ink-dark',plate==='tinted'&&lum>.55);
    });
    if(config.face==='winamp')applyWinamp(card);else clearWinamp(card);
    setDial(card,skin,config);
    // Dither face (and the app-wide "dither images" option): the background is re-dithered off-thread-ish, once per image.
    if(window.MinkaDither&&window.MinkaDither.skin)window.MinkaDither.skin(card);
    applyFullTint(card,skin,config);
    paintClock();
    if(window.MINKA_APP==='rad'&&card.classList.contains('mk-mid-card-rg'))fitNoOverlap(card);
  }
  /* /rad rule: nothing overlaps inside a resident's card. After layout the
     big number's glyph box is measured against every other visible element;
     while it touches one, the number shrinks (at most 8 steps of 8 %).
     Relative boxes, so it also holds while the card is being scaled. */
  var fitQueue=new Set(),fitRaf=0;
  function fitNoOverlap(card){
    fitQueue.add(card);
    if(fitRaf)return;
    fitRaf=requestAnimationFrame(function(){
      fitRaf=0;var cards=Array.from(fitQueue);fitQueue.clear();
      cards.forEach(function(c){
        var num=c.querySelector('[data-wf-part="hours"]');
        if(!num||num.hidden||!c.isConnected)return;
        var base=parseFloat(num.style.getPropertyValue('--wf-scale'))||1;
        var others=Array.from(c.querySelectorAll('[data-wf-part]')).filter(function(el){return el!==num&&!el.hidden&&el.getClientRects().length;});
        var range=document.createRange();
        // The digits' own outline, not the text line (its empty ascent would
        // "touch" the corner elements): canvas metrics scaled to the line box.
        var cs=getComputedStyle(num),ctx=(fitNoOverlap.cv||(fitNoOverlap.cv=document.createElement('canvas'))).getContext('2d');
        ctx.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
        var m=ctx.measureText(num.textContent.trim());
        function glyphBox(){
          range.selectNodeContents(num);
          var r=range.getBoundingClientRect(),fa=m.fontBoundingBoxAscent,fd=m.fontBoundingBoxDescent;
          if(!r.width||!(fa+fd))return r;
          var k=r.height/(fa+fd);
          return {left:r.left,right:r.right,top:r.top+(fa-m.actualBoundingBoxAscent)*k,bottom:r.top+(fa+m.actualBoundingBoxDescent)*k,width:r.width};
        }
        function hits(){
          var r=glyphBox(),box=c.getBoundingClientRect();
          if(!r.width)return false;
          if(r.left<box.left+2||r.right>box.right-2)return true;          // stays inside the card
          return others.some(function(o){var q=o.getBoundingClientRect();return q.width&&q.height&&!(q.right<=r.left||q.left>=r.right||q.bottom<=r.top||q.top>=r.bottom);});
        }
        var scale=base;
        for(var i=0;i<8&&hits();i++){scale*=.92;num.style.setProperty('--wf-scale',scale.toFixed(3));}
      });
    });
  }
  /* Whole-card look. Dark and clear work on the picture layers with plain
     filters; tinted lays one colour over everything in `color` blend, so the
     photo, chips and text share a hue while keeping their light and shade.
     Auto takes that colour from the picture's own palette. */
  var fullTintPalettes=new Map();
  function hslParts(h,s,l){
    s/=100;l/=100;var k=function(n){var a=(n+h/30)%12;var c=s*Math.min(l,1-l);return l-c*Math.max(-1,Math.min(a-3,9-a,1));};
    return [k(0),k(8),k(4)].map(function(v){return Math.round(v*255);});
  }
  function hslRgb(h,s,l){return hslParts(h,s,l).join(',');}
  function hslHex(h,s,l){return '#'+hslParts(h,s,l).map(function(v){return v.toString(16).padStart(2,'0');}).join('');}
  // "Auto" scheme follows the duty day: dark from 20:00 to 08:00 Riga time.
  function nightNow(){
    var h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Riga',hour:'2-digit',hourCycle:'h23'}).format(new Date());
    return h>=20||h<8;
  }
  function applyFullTint(card,skin,config){
    var mode=['','dark','clear','tinted'][config.fullTintMode];
    if(mode)card.dataset.fullTint=mode;else delete card.dataset.fullTint;
    var dark=config.fullTintScheme===2||(config.fullTintScheme===0&&nightNow());
    if(mode==='clear'||mode==='tinted')card.dataset.fullTintScheme=dark?'dark':'light';else delete card.dataset.fullTintScheme;
    // Everything is done with colour-matrix filters on the picture layers and
    // the decor, so the numeral, name and chips keep their own style and
    // colours (accent or per-element). Tinted: grey → sepia → hue-rotate.
    if(mode!=='tinted'){
      delete card.dataset.fullTintPalette;
      // Drop the text/numeral colours the tint painted, unless the skin has
      // since written its own values over them.
      if(card.dataset.tintNum!=null){
        if(card.style.getPropertyValue('--mk-num-color')===card.dataset.tintNum)card.style.removeProperty('--mk-num-color');
        if(card.style.getPropertyValue('--mk-txt-color')===card.dataset.tintTxt)card.style.removeProperty('--mk-txt-color');
        delete card.dataset.tintNum;delete card.dataset.tintTxt;
      }
      return;
    }
    card.style.setProperty('--wf-full-tint-sat',config.fullTintIntensity);
    // Everything takes the hue: accent (numeral finish, chips, icons) and text.
    var sat=Math.round(config.fullTintIntensity*0.78);
    var paintHue=function(h){
      card.style.setProperty('--wf-full-tint-hue',h);
      card.style.setProperty('--wf-tint',hslHex(h,sat,dark?52:64));
      var num=hslRgb(h,sat,dark?52:64),txt=hslRgb(h,Math.min(sat,45),dark?86:94);
      card.style.setProperty('--mk-num-color',num);card.style.setProperty('--mk-txt-color',txt);
      card.dataset.tintNum=num;card.dataset.tintTxt=txt;
    };
    if(!config.fullTintAuto){delete card.dataset.fullTintPalette;paintHue(config.fullTintHue);return;}
    var key=JSON.stringify([skin.t,skin.id,skin.rgb]);
    if(card.dataset.fullTintPalette===key)return;
    card.dataset.fullTintPalette=key;
    var hueOf=function(rgb){
      var c=String(rgb||'100,150,190').split(',').map(Number);
      var max=Math.max.apply(null,c)/255,min=Math.min.apply(null,c)/255,h=0;
      if(max!==min){var d=max-min;var r=c[0]/255,g=c[1]/255,b=c[2]/255;h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h*=60;}
      return Math.round(h);
    };
    paintHue(hueOf(skin.rgb));
    if(typeof window.mkSuggestSkinPalette!=='function')return;
    if(!fullTintPalettes.has(key)){
      if(fullTintPalettes.size>=128)fullTintPalettes.delete(fullTintPalettes.keys().next().value);
      fullTintPalettes.set(key,window.mkSuggestSkinPalette(skin).catch(function(){return null;}));
    }
    fullTintPalettes.get(key).then(function(palette){
      if(palette&&card.dataset.fullTintPalette===key)paintHue(hueOf(palette.source||palette.num));
    });
  }
  function mount(host, options) {
    if (previewObserver) { previewObserver.disconnect(); previewObserver = null; }
    cancelAnimationFrame(previewFrame); previewFrame=0;
    var tabs = host.querySelector('.mk-skin-main-tabs'), editor = host.querySelector('.mk-skin-editor');
    var preview = host.querySelector('.mk-skin-preview-real');
    if (!tabs || !editor || !preview) return;
    var slot = preview.closest('.mk-skin-preview-slot');
    var sourceWorker = options.source && options.source.getAttribute('data-worker');
    var sourceSize = null;
    function sizePreview() {
      if (!preview.isConnected || !options.source || !slot.clientWidth) return;
      if (preview.querySelector(':scope > .mk-card-addon.is-dragging')) return;
      // The roster can replace its cards while this editor remains open.
      // Reconnect to the live card; retain its last geometry while it is hidden.
      if (!options.source.isConnected && sourceWorker) {
        var replacement = Array.prototype.find.call(document.querySelectorAll('.card[data-worker]'), function(card) {
          return card.getAttribute('data-worker') === sourceWorker;
        });
        if (replacement) {
          if (previewObserver) previewObserver.unobserve(options.source);
          options.source = replacement;
          if (previewObserver) previewObserver.observe(replacement);
        }
      }
      var measured = options.source.getBoundingClientRect();
      if (measured.width && measured.height) {
        sourceSize = {width: measured.width, height: measured.height, padding: getComputedStyle(options.source).padding};
      }
      if (!sourceSize) return;
      var r = sourceSize;
      // Room for every decoration on the card (up to three), not only the first.
      var before=preview.getBoundingClientRect(), a=null, left=0,right=0,top=0,bottom=0;
      preview.querySelectorAll(':scope > .mk-card-addon').forEach(function(img){var r=img.getBoundingClientRect();if(!r.width)return;a=a?{left:Math.min(a.left,r.left),right:Math.max(a.right,r.right),top:Math.min(a.top,r.top),bottom:Math.max(a.bottom,r.bottom)}:{left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
      if(a&&before.width&&before.height){
        left=Math.max(0,before.left-a.left)/before.width;right=Math.max(0,a.right-before.right)/before.width;
        top=Math.max(0,before.top-a.top)/before.height;bottom=Math.max(0,a.bottom-before.bottom)/before.height;
      }
      var available=slot.parentElement.clientWidth;
      slot.style.width=Math.floor(Math.min(300,(available-12)/(1+left+right)))+'px';
      host.style.setProperty('--wf-card-aspect',r.width+'/'+r.height);
      var scale = slot.clientWidth / r.width;
      slot.style.marginLeft=Math.max(0,(available-slot.clientWidth*(1+left+right))/2+slot.clientWidth*left)+'px';
      slot.style.marginRight='0';
      slot.style.setProperty('--mk-addon-preview-top-clearance',Math.ceil(r.height*scale*top+(top?12:0))+'px');
      slot.style.setProperty('--mk-addon-preview-bottom-clearance',Math.ceil(r.height*scale*bottom+(bottom?12:0))+'px');
      if(typeof window!=='undefined'&&window.MinkaCardAddons&&window.MinkaCardAddons.fitPreviewControls)requestAnimationFrame(function(){window.MinkaCardAddons.fitPreviewControls(slot);});
      preview.classList.add('wf-scaled-preview');
      preview.style.setProperty('--wf-preview-width', r.width + 'px');
      preview.style.setProperty('--wf-preview-height', r.height + 'px');
      preview.style.setProperty('--wf-preview-scale', scale);
      preview.style.setProperty('--wf-preview-padding', r.padding);
      slot.style.height = (r.height * scale) + 'px';
      slot.style.aspectRatio = 'auto';
    }
    if (options.source && window.ResizeObserver) {
      previewObserver = new ResizeObserver(function(){
        if(!previewFrame)previewFrame=requestAnimationFrame(function(){previewFrame=0;sizePreview();});
      });
      previewObserver.observe(options.source); previewObserver.observe(slot);
      previewObserver.observe(slot.parentElement);
      sizePreview();
    }
    refreshPreview=sizePreview;
    var tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'mk-skin-main-tab'; tab.dataset.skinSection = 'face'; tab.setAttribute('role','tab'); tab.textContent = 'Stils';
    tabs.prepend(tab);
    var panel = document.createElement('section');
    panel.className = 'mk-skin-section wf-editor'; panel.dataset.skinPanel = 'face';
    var selectedPart = 'hours';
    var config = M.clean(options.get().face);
    var history = [];
    var faceTiles = M.faces.map(function(face,i) {
      return '<button type="button" class="wf-face-choice" data-face="'+face+'"><span class="wf-face-thumb wf-thumb-'+face+'"><i>'+(face==='orbit'?orbitArt():'')+'</i><b>24</b><small>DEŽŪRA</small></span><strong>'+titles[i]+'</strong></button>';
    }).join('');
    var look = ''
      + '<div class="wf-section wf-look"><div class="wf-label">Kartītes izskats <span>attiecas uz visu kartīti, arī attēlu</span></div><div class="wf-segment wf-look-modes" aria-label="Kartītes izskats">'+[['0','Noklusējums'],['1','Tumšs'],['2','Caurspīdīgs'],['3','Tonēts']].map(function(m){return '<button type="button" data-full-tint-mode="'+m[0]+'"><b class="wf-look-sample" aria-hidden="true">24</b><span>'+m[1]+'</span></button>';}).join('')+'</div>'
      + '<div class="wf-look-tinted" hidden><label class="wf-range wf-hue"><span>Krāsa</span><input type="range" class="wf-full-tint-hue" min="0" max="360" aria-label="Toņa krāsa"><output></output></label><label class="wf-range wf-light"><span>Intensitāte</span><input type="range" class="wf-full-tint-light" min="0" max="100" aria-label="Toņa intensitāte"><output></output></label><button type="button" class="wf-full-tint-auto" aria-pressed="false">Krāsa no attēla</button></div>'
      + '<div class="wf-segment wf-look-scheme" hidden aria-label="Gaišs vai tumšs"><button type="button" data-full-tint-scheme="1">Gaišs</button><button type="button" data-full-tint-scheme="2">Tumšs</button><button type="button" data-full-tint-scheme="0">Auto</button></div></div>';
    // Trīs cilnes vienas garās lapas vietā: Izkārtojums · Krāsas · Elementi.
    // Saturs un loģika ir tie paši; mainās tikai tas, kas redzams vienlaikus.
    panel.innerHTML = '<div class="wf-editor-heading"><div><strong>Kartītes izskats</strong></div></div>'
      + '<div class="wf-subtabs" role="tablist" aria-label="Stila iestatījumi">'
      + [['layout','Izkārtojums'],['colors','Krāsas'],['parts','Elementi']].map(function(t){return '<button type="button" role="tab" data-wf-tab="'+t[0]+'">'+t[1]+'</button>';}).join('')
      + '</div>'
      + '<div class="wf-group" data-wf-group="layout" role="tabpanel">'
      + '<div class="wf-faces">'+faceTiles+'</div>'
      + '</div>'
      + '<div class="wf-group" data-wf-group="colors" role="tabpanel">'
      + look
      + '<div class="wf-section wf-accent"><div class="wf-label">Akcenta krāsa <span>cipariem, čipiem un ikonām, ja elementam nav savas</span> <input type="color" class="wf-color" aria-label="Akcenta krāsa"></div><div class="wf-swatches">'+colors.map(function(c){return '<button type="button" data-tint="'+c[1].slice(1)+'" style="--sw:'+c[1]+'" title="'+c[0]+'" aria-label="'+c[0]+'"></button>';}).join('')+'</div>'
      + '</div><div class="wf-section wf-finish"><div class="wf-label">Ciparu materiāls</div>'
      + '<div class="wf-segment" aria-label="Ciparu materiāls">'+['Stikls','Metāls','Tīrs','Plūsma','Perlamutrs','Neons'].map(function(t,i){return '<button type="button" data-finish="'+i+'" data-watch-finish="'+i+'" aria-label="'+t+'"><b class="wf-number-sample" aria-hidden="true">24</b><span>'+t+'</span></button>';}).join('')+'</div></div>'
      + '<div class="wf-section wf-metal"><div class="wf-label">Metāla ietvars <span class="wf-metal-name"></span></div><div class="wf-metals">'+metals.map(function(c,i){return '<button type="button" data-metal="'+i+'" style="--sw:'+c[1]+'" title="'+c[0]+'" aria-label="'+c[0]+'"></button>';}).join('')+'</div></div>'
      + '</div>'
      + '<div class="wf-group" data-wf-group="parts" role="tabpanel">'
      + '<div class="wf-section"><div class="wf-label">Elementi <span>Velc priekšskatījumā</span></div><div class="wf-elements">'+M.parts.map(function(key){return '<button type="button" data-part="'+key+'">'+labels[key]+'</button>';}).join('')+'</div>'
      + '<div class="wf-part-head"><strong class="wf-part-name"></strong><button type="button" class="wf-remove">Noņemt</button></div>'
      + '<div class="wf-part-color"><span>Šī elementa krāsa</span><input type="color" class="wf-part-color-input" aria-label="Šī elementa krāsa"><button type="button" class="wf-part-color-clear">Kā akcenta krāsa</button></div>'
      // The element's plate, in the card tone's own words (and a light one, as on a watch).
      + '<div class="wf-part-plate"><span>Plāksne</span><div class="wf-plate-modes" role="group" aria-label="Plāksne">'+[['0','Kā kartītei'],['1','Tumšs'],['2','Caurspīdīgs'],['3','Tonēts'],['4','Gaišs']].map(function(m){return '<button type="button" data-part-plate="'+m[0]+'"><i class="wf-plate-sample p'+m[0]+'" aria-hidden="true">9</i><span>'+m[1]+'</span></button>';}).join('')+'</div></div>'
      + '<div class="wf-timer-options" hidden><div class="wf-segment" aria-label="Taimeris"><button type="button" data-timer-style="">Cipari</button><button type="button" data-timer-style="a">Analogs</button></div>'
      + '<div class="wf-timer-digital"><div class="wf-digit-skins" role="group" aria-label="Ciparu izskats"><button type="button" data-timer-digit=""><span class="wf-digit-mini"><span class="mk-m3d m3-plain">7:42:10</span></span><b>Parasti</b></button>' + DIGIT_SKINS.map(function(k){return '<button type="button" data-timer-digit="'+k[0]+'"><span class="wf-digit-mini">'+digitPreview(k[0]+'11')+'</span><b>'+k[1]+'</b></button>';}).join('') + '</div></div>'
      + '<div class="wf-timer-analog"><div class="wf-dial-skins" role="group" aria-label="Pulksteņa izskats">' + DIAL_SKINS.map(function(k){return '<button type="button" data-timer-skin="'+k[0]+'"><span class="wf-dial-mini"></span><b>'+k[1]+'</b></button>';}).join('') + '</div>'
      + '<div class="wf-segment" aria-label="Rādītājs"><button type="button" data-timer-hand="1">Punkts</button><button type="button" data-timer-hand="2">Adata</button><button type="button" data-timer-hand="3">Josla</button></div>'
      + '<div class="wf-segment" aria-label="Ciparnīca"><button type="button" data-timer-face="1">Kā kartītei</button><button type="button" data-timer-face="2">Kontrasts</button><button type="button" data-timer-face="3">Bez fona</button></div></div></div>'
      + '<div class="wf-coffee-options" hidden><div class="wf-segment wf-coffee-mode" aria-label="Kafijas vadība"><button type="button" data-coffee-mode="0">Ikona → pogas</button><button type="button" data-coffee-mode="1">Vienmēr − / +</button></div><div class="wf-segment" aria-label="Kafijas tonis"><button type="button" data-coffee-contrast="0">Stikls</button><button type="button" data-coffee-contrast="1">Fona kontrasts</button><button type="button" data-coffee-contrast="2">Kartītes tonis</button></div></div>'
      + [['x','Horizontāli',5,95],['y','Vertikāli',5,95],['size','Izmērs',50,170]].map(function(r){return '<label class="wf-range wf-position"><span>'+r[1]+'</span><input type="range" data-position="'+r[0]+'" min="'+r[2]+'" max="'+r[3]+'"><output></output></label>';}).join('')
      + '<button type="button" class="wf-fit">Ietilpināt kartītē</button></div>'
      + '<label class="wf-depth-control"><input type="checkbox" class="wf-depth-toggle"> Objekts priekšā ciparam</label>'
      + '<details class="wf-background"><summary>Attēla novietojums</summary>'+[['imageX','Horizontāli',0,100],['imageY','Vertikāli',0,100],['imageZoom','Tuvinājums',100,180]].map(function(r){return '<label class="wf-range"><span>'+r[1]+'</span><input type="range" data-image="'+r[0]+'" min="'+r[2]+'" max="'+r[3]+'"><output></output></label>';}).join('')+'</details>'
      + '</div>'
      + '<div class="wf-footer"><button type="button" class="wf-undo" disabled>Atcelt pēdējo</button><button type="button" class="wf-minimal" title="Cipars, vārds, maiņas laiks, emoji un saule/mēness">Tikai svarīgais</button><button type="button" class="wf-reset">Atjaunot izkārtojumu</button><button type="button" class="wf-original">Sākotnējā klasika</button></div>';
    tabs.after(panel);
    var wfTab='layout';
    try{ wfTab=localStorage.getItem('minka:wf-tab')||'layout'; }catch(_e){}
    function showGroup(name){
      if(!panel.querySelector('[data-wf-group="'+name+'"]'))name='layout';
      wfTab=name;
      try{ localStorage.setItem('minka:wf-tab',name); }catch(_e){}
      panel.querySelectorAll('[data-wf-tab]').forEach(function(b){var on=b.dataset.wfTab===name;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on));});
      panel.querySelectorAll('[data-wf-group]').forEach(function(g){g.hidden=g.dataset.wfGroup!==name;});
    }
    showGroup(wfTab);
    panel.addEventListener('click',function(e){var b=e.target.closest('[data-wf-tab]');if(b)showGroup(b.dataset.wfTab);});

    function activate() {
      config=M.clean(options.get().face);
      options.section('face');
      host.querySelectorAll('.mk-skin-main-tab').forEach(function(el){var on=el===tab;el.classList.toggle('is-active',on);el.setAttribute('aria-selected',String(on));});
      host.querySelectorAll('[data-skin-panel]').forEach(function(el){el.classList.toggle('is-active',el===panel);});
      preview.classList.toggle('wf-editing',!!options.get().face);
      // Opening the tab must still show the person's actual saved appearance.
      apply(preview, options.get());
      sync();
    }
    function sync() {
      panel.classList.toggle('is-winamp',config.face==='winamp');
      panel.classList.toggle('is-dither',config.face==='dither');
      panel.querySelectorAll('[data-face]').forEach(function(el){
        el.setAttribute('aria-pressed',String(!!options.get().face&&el.dataset.face===config.face));
        var look=M.preset(el.dataset.face,options.get().face?config:null);
        el.style.setProperty('--wf-thumb-tint','#'+look.tint);
        el.style.setProperty('--wf-thumb-metal',metals[look.metal][1]);
        el.querySelector('b').textContent=(preview.querySelector('.mk-mid-hours')||{}).textContent||'24';
      });
      var depthThumb=preview.querySelector('.mk-wf-depth');
      panel.style.setProperty('--wf-depth-thumbnail',depthThumb?depthThumb.firstElementChild.style.backgroundImage:'none');
      panel.style.setProperty('--wf-thumbnail-image',preview.style.getPropertyValue('--mk-skin-img')||'linear-gradient(150deg,#323b53,#0c121c)');
      panel.querySelectorAll('[data-tint]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.tint===config.tint));});
      panel.querySelectorAll('[data-metal]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.metal===config.metal));});
      panel.style.setProperty('--wf-tint','#'+config.tint);
      panel.querySelectorAll('.wf-number-sample').forEach(function(el){el.textContent=(preview.querySelector('.mk-mid-hours')||{}).textContent||'24';});
      panel.querySelectorAll('[data-finish]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.finish===config.finish));});
      panel.querySelectorAll('[data-part]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.part===selectedPart));el.classList.toggle('is-off',!config.parts[el.dataset.part][3]);});
      var hasDepth=options.get().t==='img'&&!!window.MinkaFindCardMaterial(options.get().id);
      panel.querySelector('.wf-depth-control').hidden=!hasDepth;
      panel.querySelector('.wf-depth-toggle').checked=options.get().depth!==false;
      panel.querySelector('.wf-color').value='#'+config.tint;
      panel.querySelector('.wf-metal-name').textContent=metals[config.metal][0];
      panel.querySelector('.wf-part-name').textContent=labels[selectedPart];
      panel.querySelector('.wf-coffee-options').hidden=selectedPart!=='coffee';
      var tmAll=TM_RE.test(String(options.get().tm||''))?options.get().tm:'', tm=DIAL_RE.test(tmAll)?tmAll:'', td=DIGIT_RE.test(tmAll)?tmAll[0]:'';
      panel.querySelector('.wf-timer-options').hidden=selectedPart!=='remaining'||config.face==='winamp';
      panel.querySelector('.wf-timer-analog').hidden=!tm;
      panel.querySelector('.wf-timer-digital').hidden=!!tm;
      panel.querySelectorAll('[data-timer-digit]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.timerDigit===td));});
      panel.querySelectorAll('[data-timer-style]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.timerStyle===(tm?'a':'')));});
      panel.querySelectorAll('[data-timer-hand]').forEach(function(el){el.setAttribute('aria-pressed',String(!!tm&&el.dataset.timerHand===tm[1]));el.disabled=/[cfgh]/.test(tm[0]);});
      // Skin tiles draw themselves with the chosen hand and face (built only when the list is shown).
      if(tm)panel.querySelectorAll('[data-timer-skin]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.timerSkin===tm[0]));var key=el.dataset.timerSkin+tm[1]+tm[2],mini=el.firstElementChild;if(mini.dataset.key!==key){mini.innerHTML='<span class="mk-wf-dial f'+tm[2]+' sk-'+el.dataset.timerSkin+'">'+dialPreview(key)+'</span>';mini.dataset.key=key;}});
      panel.querySelectorAll('[data-timer-face]').forEach(function(el){el.setAttribute('aria-pressed',String(!!tm&&el.dataset.timerFace===tm[2]));});
      panel.querySelectorAll('[data-coffee-mode]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.coffeeMode===M.effectiveCoffeeMode(config)));});
      panel.querySelectorAll('[data-coffee-contrast]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.coffeeContrast===config.coffeeContrast));});
      panel.querySelector('.wf-remove').textContent=config.parts[selectedPart][3]?'Noņemt':'Pievienot';
      var own=config.colors[selectedPart];
      panel.querySelector('.wf-part-color-input').value='#'+(own||config.tint);
      panel.querySelector('.wf-part-color').classList.toggle('is-own',!!own);
      panel.querySelector('.wf-part-color-clear').hidden=!own;
      var plateRow=panel.querySelector('.wf-part-plate'), canPlate=(M.plateParts||[]).indexOf(selectedPart)>=0&&config.face!=='winamp';
      plateRow.hidden=!canPlate;
      if(canPlate){ plateRow.style.setProperty('--wf-plate-tint','#'+(own||config.tint)); plateRow.querySelectorAll('[data-part-plate]').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.partPlate===(config.plates[selectedPart]||0)));}); }
      panel.querySelectorAll('[data-full-tint-mode]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.fullTintMode===config.fullTintMode));});
      var tinted=panel.querySelector('.wf-look-tinted');tinted.hidden=config.fullTintMode!==3;
      var hue=panel.querySelector('.wf-full-tint-hue');hue.value=config.fullTintHue;hue.nextElementSibling.textContent=config.fullTintHue+'°';
      var light=panel.querySelector('.wf-full-tint-light');light.value=config.fullTintIntensity;light.nextElementSibling.textContent=config.fullTintIntensity+'%';
      panel.style.setProperty('--wf-look-hue',config.fullTintHue);
      var scheme=panel.querySelector('.wf-look-scheme');scheme.hidden=config.fullTintMode<2;
      scheme.querySelectorAll('[data-full-tint-scheme]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.fullTintScheme===config.fullTintScheme));});
      var auto=panel.querySelector('.wf-full-tint-auto');auto.setAttribute('aria-pressed',String(!!config.fullTintAuto));
      tinted.classList.toggle('is-auto',!!config.fullTintAuto);
      panel.querySelectorAll('.wf-look-sample').forEach(function(el){el.textContent=(preview.querySelector('.mk-mid-hours')||{}).textContent||'24';});
      panel.querySelector('.wf-undo').disabled=!history.length;
      panel.querySelectorAll('[data-position]').forEach(function(el){var i={x:0,y:1,size:2}[el.dataset.position];if(i===2)el.max=selectedPart==='hours'?300:170;el.value=config.parts[selectedPart][i];el.nextElementSibling.textContent=el.value+'%';});
      panel.querySelectorAll('[data-image]').forEach(function(el){el.value=config[el.dataset.image];el.nextElementSibling.textContent=el.value+'%';});
      preview.querySelectorAll('[data-wf-part]').forEach(function(el){el.classList.toggle('wf-selected',el.dataset.wfPart===selectedPart);el.tabIndex=0;el.setAttribute('aria-label',labels[el.dataset.wfPart]);});
      placeSel();
      preview.closest('.mk-skin-preview-list').setAttribute('aria-hidden','false');
    }
    /* ---- What is under the pointer ----
       Picking goes by what is drawn, not by the elements' boxes: the big numeral's box
       is far taller than its digits, the name's box runs over the coffee and the moon,
       and a picture (the object in front, a decoration) is mostly see-through. Each
       candidate is measured (a tight glyph box for the numeral, opaque pixels for
       pictures) and the smallest one under the pointer wins; a quick second press on
       the same spot steps to the one below it. Only rectangles are read, on pointer
       events, at most once a frame — nothing runs while the pointer is still. */
    var glyphMetrics={}, glyphCanvas=null;
    function glyphBox(el){
      var range=document.createRange();range.selectNodeContents(el);
      var r=range.getBoundingClientRect(),text=el.textContent.trim();
      if(!r.width||!text)return el.getBoundingClientRect();
      var cs=getComputedStyle(el),font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily,key=font+'|'+text,m=glyphMetrics[key];
      if(!m){
        var ctx=(glyphCanvas||(glyphCanvas=document.createElement('canvas'))).getContext('2d');ctx.font=font;
        var t=ctx.measureText(text);m=glyphMetrics[key]={fa:t.fontBoundingBoxAscent,fd:t.fontBoundingBoxDescent,aa:t.actualBoundingBoxAscent,ad:t.actualBoundingBoxDescent};
      }
      if(!(m.fa+m.fd))return r;
      var k=r.height/(m.fa+m.fd);
      return {left:r.left,right:r.right,top:r.top+(m.fa-m.aa)*k,bottom:r.top+(m.fa+m.ad)*k};
    }
    // Alpha of a picture, once, at most 96 px: which pixels are really there.
    function maskOf(url){
      if(masks.has(url))return masks.get(url);
      if(masks.size>=24)masks.delete(masks.keys().next().value);
      var m={ready:false};masks.set(url,m);
      var img=new Image();img.decoding='async';
      img.onload=function(){try{
        var s=Math.min(1,96/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*s)),h=Math.max(1,Math.round(img.naturalHeight*s));
        var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);
        var d=x.getImageData(0,0,w,h).data,a=new Uint8Array(w*h),b=[w,h,-1,-1];
        for(var i=0;i<w*h;i++){a[i]=d[i*4+3];if(a[i]>40){var px=i%w,py=(i/w)|0;if(px<b[0])b[0]=px;if(py<b[1])b[1]=py;if(px>b[2])b[2]=px;if(py>b[3])b[3]=py;}}
        m.w=w;m.h=h;m.a=a;m.nw=img.naturalWidth;m.nh=img.naturalHeight;m.box=b[2]<0?null:[b[0]/w,b[1]/h,(b[2]+1)/w,(b[3]+1)/h];m.ready=true;
      }catch(_e){m.failed=true;}};
      img.onerror=function(){m.failed=true;};
      img.src=url;
      return m;
    }
    function cssUrl(v){var u=/url\((['"]?)([^'")]+)\1\)/.exec(v||'');return u?u[2]:'';}
    /* A picture drawn inside a box q (screen px) at size W×H, offset ox/oy, clipped
       to `clip`: hit(x,y) says whether an opaque pixel is there; box is the opaque part. */
    function pictureFrame(el,url,q,W,H,ox,oy,clip){
      var m=maskOf(url);
      if(!m.ready&&!m.failed)return {el:el,box:clip,hit:function(x,y){return x>=clip.left&&x<=clip.right&&y>=clip.top&&y<=clip.bottom?{area:(clip.right-clip.left)*(clip.bottom-clip.top)*1.5}:null;}};
      var bx=m.box||[0,0,1,1],box={left:Math.max(clip.left,q.left+ox+W*bx[0]),top:Math.max(clip.top,q.top+oy+H*bx[1]),right:Math.min(clip.right,q.left+ox+W*bx[2]),bottom:Math.min(clip.bottom,q.top+oy+H*bx[3])};
      if(box.right<=box.left||box.bottom<=box.top)return null;
      return {el:el,box:box,hit:function(x,y){
        if(x<box.left||x>box.right||y<box.top||y>box.bottom)return null;
        if(m.ready){var u=Math.floor((x-q.left-ox)/W*m.w),v=Math.floor((y-q.top-oy)/H*m.h);if(u<0||v<0||u>=m.w||v>=m.h||m.a[v*m.w+u]<=40)return null;}
        return {area:(box.right-box.left)*(box.bottom-box.top)};
      }};
    }
    // The object cut out of the photo, standing in front of the numeral (background-size: cover).
    function depthFrame(){
      var d=preview.querySelector(':scope > .mk-wf-depth'),i=d&&d.firstElementChild;
      if(!i||!d.getClientRects().length||getComputedStyle(d).display==='none')return null;
      var url=cssUrl(i.style.backgroundImage);if(!url)return null;
      var m=maskOf(url);if(!m.ready)return m.failed?null:{el:d,box:null,hit:function(){return null;}};
      var q=i.getBoundingClientRect(),s=Math.max(q.width/m.nw,q.height/m.nh),W=m.nw*s,H=m.nh*s;
      return pictureFrame(d,url,q,W,H,(q.width-W)*config.imageX/100,(q.height-H)*config.imageY/100,d.getBoundingClientRect());
    }
    // A decoration: an <img> with object-fit: contain and its own object-position.
    function addonFrame(img){
      var url=img.currentSrc||img.src;if(!url||!img.naturalWidth)return null;
      var q=img.getBoundingClientRect(),s=Math.min(q.width/img.naturalWidth,q.height/img.naturalHeight),W=img.naturalWidth*s,H=img.naturalHeight*s;
      var pos=getComputedStyle(img).objectPosition.split(' ').map(function(v){return /%$/.test(v)?parseFloat(v)/100:.5;});
      return pictureFrame(img,url,q,W,H,(q.width-W)*pos[0],(q.height-H)*(pos[1]==null?.5:pos[1]),q);
    }
    // The card's elements: with a layout, its parts; on the original classic card, the same elements by class.
    function partEls(){
      var face=!!options.get().face,out=[];
      if(face&&config.face==='winamp')return out;
      M.parts.forEach(function(key){
        var el=face?preview.querySelector('[data-wf-part="'+key+'"]'):preview.querySelector(selectors[key]);
        if(!el||el.hidden||!el.getClientRects().length)return;
        out.push([key,el]);
      });
      return out;
    }
    function partBox(key,el){var r=key==='hours'?glyphBox(el):el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};}
    function hits(x,y){
      var list=[];
      partEls().forEach(function(p){
        var b=partBox(p[0],p[1]),w=b.right-b.left,h=b.bottom-b.top;if(!w||!h)return;
        var gx=Math.max(0,(24-w)/2),gy=Math.max(0,(24-h)/2);   // a small one still gets a finger-sized target
        if(x<b.left-gx||x>b.right+gx||y<b.top-gy||y>b.bottom+gy)return;
        list.push({kind:'part',key:p[0],el:p[1],box:b,area:w*h});
      });
      preview.querySelectorAll(':scope > .mk-card-addon').forEach(function(img){
        if(/^(frame|light)$/.test(img.dataset.addonGroup||'')||!img.getClientRects().length)return;
        var f=addonFrame(img),h=f&&f.hit(x,y);if(h)list.push({kind:'addon',el:img,box:f.box,area:h.area});
      });
      var dp=options.get().face&&depthFrame(),hd=dp&&dp.hit(x,y);
      if(hd)list.push({kind:'depth',el:dp.el,box:dp.box,area:hd.area});
      return list.sort(function(a,b){return a.area-b.area;});
    }
    var lastPress=null;
    function sameHit(a,b){return !!a&&!!b&&a.kind===b.kind&&a.el===b.el;}
    // One answer per press, shared with skin-organize (it routes the tabs on the same event).
    function pickPress(e){
      if(lastPress&&lastPress.e===e)return lastPress.hit;
      var list=hits(e.clientX,e.clientY),i=0,p=lastPress;
      if(p&&list.length>1&&!p.moved&&e.timeStamp-p.t<550&&Math.abs(p.x-e.clientX)+Math.abs(p.y-e.clientY)<6){
        var prev=list.findIndex(function(h){return sameHit(h,p.hit);});if(prev>=0)i=(prev+1)%list.length;
      }
      lastPress={e:e,t:e.timeStamp,x:e.clientX,y:e.clientY,hit:list[i]||null,moved:false};
      return lastPress.hit;
    }
    currentPick=pickPress;
    releaseContours=function(){clearContour(contourOn.hov);clearContour(contourOn.sel);contourOn.hov=contourOn.sel=null;};
    /* ---- Hover and selection frames ----
       Hover: the element's own outline lights up (a thin frame with its corner radius).
       Selected: the same frame, solid, with its name and four handles. Both are plain
       boxes outside the card, held inside the preview, so a numeral grown past the
       card edge still has a handle within reach. */
    var selKind='part',selAddon=null;
    function frameHost(){var h=preview.parentElement;if(h&&getComputedStyle(h).position==='static')h.style.position='relative';return h;}
    function placeFrame(box,b,pad){
      var host=box.parentElement,hr=host.getBoundingClientRect(),W=host.clientWidth,H=host.clientHeight;
      var l=Math.max(-6,b.left-hr.left-pad),t=Math.max(-6,b.top-hr.top-pad),r=Math.min(W+6,b.right-hr.left+pad),bt=Math.min(H+6,b.bottom-hr.top+pad);
      box.style.left=l+'px';box.style.top=t+'px';box.style.width=Math.max(12,r-l)+'px';box.style.height=Math.max(12,bt-t)+'px';
      return t;
    }
    function radiusOf(hit){
      if(hit.kind!=='part'||hit.key==='hours')return 12;
      var sc=parseFloat(preview.style.getPropertyValue('--wf-preview-scale'))||1;
      return Math.min(26,(parseFloat(getComputedStyle(hit.el).borderTopLeftRadius)||8)*sc+4);
    }
    /* The outline itself lights up — around the digits, the chip's own shape, the
       object's silhouette — not a box. One SVG filter per state (hover, selected):
       the element's alpha, made solid, grown by a pixel or two, minus the element =
       a clean ring in the accent blue. It sits only on the one element hovered or
       selected and is drawn once (nothing animates), so an old PC does not feel it. */
    var NS='http://www.w3.org/2000/svg',contourOn={hov:null,sel:null};
    function contourFilter(kind){
      var doc=preview.ownerDocument,id='mk-contour-'+kind,f=doc.getElementById(id);
      if(f)return f;
      var svg=doc.getElementById('mk-contour-defs');
      if(!svg){svg=doc.createElementNS(NS,'svg');svg.id='mk-contour-defs';svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden';doc.body.append(svg);}
      var color=kind==='sel'?'#64d2ff':'#8fdfff';
      svg.insertAdjacentHTML('beforeend','<filter id="'+id+'" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">'
        +'<feComponentTransfer in="SourceAlpha" result="a"><feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1"/></feComponentTransfer>'
        +'<feMorphology in="a" operator="dilate" radius="2" result="d"/>'
        +'<feComposite in="d" in2="a" operator="out" result="ring"/>'
        +'<feFlood flood-color="'+color+'"'+(kind==='hov'?' flood-opacity=".85"':'')+'/>'
        +'<feComposite in2="ring" operator="in" result="line"/>'
        +'<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="line"/></feMerge></filter>');
      return doc.getElementById(id);
    }
    var CONTOUR_PROPS=['filter','outline','outline-offset'];
    function clearContour(el){
      if(!el||!el.__contour)return;
      CONTOUR_PROPS.forEach(function(k){var o=el.__contour[k];if(o&&o.v)el.style.setProperty(k,o.v,o.p);else el.style.removeProperty(k);});
      delete el.__contour;
    }
    // A chip (it has a plate) is outlined by the browser itself, exactly along its own
    // rounded shape; its soft shadow is not part of it. Only bare digits, text, icons
    // and pictures take the silhouette filter (alpha ≥ .35, so glows and shadows do not count).
    function isChip(el){
      if(el.tagName==='IMG'||el.classList.contains('mk-wf-depth'))return false;
      var cs=getComputedStyle(el);
      if(cs.backgroundClip==='text'||cs.webkitBackgroundClip==='text')return false;   // gradient digits: their glyphs are the shape
      return cs.backgroundImage!=='none'||!/^(transparent|rgba\(\d+, \d+, \d+, 0\))$/.test(cs.backgroundColor);
    }
    // Keep the ring the same few screen pixels on a small icon and a numeral grown to 300 %.
    function ringRadius(kind,el){
      var w=el.offsetWidth,sc=w?el.getBoundingClientRect().width/w:1,ring=((kind==='sel'?2:1.6)/(sc||1)).toFixed(2);
      var f=contourFilter(kind),m=f.querySelector('feMorphology');
      if(m.getAttribute('radius')!==ring)m.setAttribute('radius',ring);
      return f;
    }
    function applyContour(kind,el){
      if(el.__contour&&el.__contour.k===kind){if(!el.__contour.chip)ringRadius(kind,el);return;}
      clearContour(el);
      var saved={k:kind};CONTOUR_PROPS.forEach(function(k){saved[k]={v:el.style.getPropertyValue(k),p:el.style.getPropertyPriority(k)};});
      el.__contour=saved;
      if(isChip(el)){
        saved.chip=true;
        // In the chip's own units: the preview and the element's size scale it on screen.
        var w=el.offsetWidth,sc=(w?el.getBoundingClientRect().width/w:1)||1;
        el.style.setProperty('outline',((kind==='sel'?2:1.5)/sc).toFixed(2)+'px solid '+(kind==='sel'?'#64d2ff':'#8fdfffd9'),'important');
        el.style.setProperty('outline-offset',(1.5/sc).toFixed(2)+'px','important');
        return;
      }
      var base=getComputedStyle(el).filter,f=ringRadius(kind,el);
      el.style.setProperty('filter','url(#'+f.id+')'+(base&&base!=='none'?' '+base:''),'important');
    }
    function setContour(kind,el){
      if(kind==='hov'&&el&&el===contourOn.sel)el=null;              // the selected one is already outlined
      var prev=contourOn[kind],other=kind==='hov'?'sel':'hov';
      contourOn[kind]=el;
      if(kind==='sel'&&el&&contourOn.hov===el)contourOn.hov=null;   // selection takes it over
      if(prev&&prev!==el){if(prev===contourOn[other])applyContour(other,prev);else clearContour(prev);}
      if(el)applyContour(kind,el);
    }
    var hovFrame=0,hovX=0,hovY=0;
    function showHover(hit){ setContour('hov',hit?hit.el:null); }
    function isSelected(hit){
      if(hit.kind==='part')return selKind==='part'&&hit.key===selectedPart&&preview.classList.contains('wf-editing');
      return hit.kind===selKind&&(hit.kind!=='addon'||hit.el===selAddon);
    }
    function paintHover(){
      hovFrame=0;if(drag)return;
      var hit=hits(hovX,hovY)[0]||null;
      showHover(hit&&!isSelected(hit)?hit:null);
      var cur=hit?'grab':'';if(preview.style.cursor!==cur)preview.style.cursor=cur;
    }
    preview.addEventListener('pointermove',function(e){
      if(drag||e.buttons||e.pointerType==='touch')return;
      hovX=e.clientX;hovY=e.clientY;if(!hovFrame)hovFrame=requestAnimationFrame(paintHover);
    },{passive:true});
    preview.addEventListener('pointerleave',function(){cancelAnimationFrame(hovFrame);hovFrame=0;showHover(null);});
    function selEl(){return selKind==='depth'?preview.querySelector(':scope > .mk-wf-depth'):selKind==='addon'?selAddon:preview.querySelector('[data-wf-part="'+selectedPart+'"]');}
    function selBox(){
      if(selKind==='depth'){var f=depthFrame();return f&&f.box;}
      if(selKind==='addon'){var a=selAddon&&selAddon.isConnected&&addonFrame(selAddon);return a&&a.box;}
      var el=preview.querySelector('[data-wf-part="'+selectedPart+'"]');
      if(!el||el.hidden||!preview.classList.contains('wf-editing')||config.face==='winamp')return null;
      return partBox(selectedPart,el);
    }
    function placeSel(){
      var host=frameHost(),box=host&&host.querySelector(':scope > .wf-sel');
      preview.querySelectorAll('[data-wf-part] > .wf-resize').forEach(function(h){h.remove();});
      if(!host)return;
      var b=selBox();
      setContour('sel',b?selEl():null);
      if(!b){if(box)box.hidden=true;return;}
      if(!box){
        box=document.createElement('div');box.className='wf-sel';box.setAttribute('aria-hidden','true');
        box.innerHTML='<b class="wf-sel-tag"></b>'+['nw','ne','sw','se'].map(function(c){return '<span class="wf-resize" data-c="'+c+'" title="Velc, lai mainītu izmēru"></span>';}).join('');
        host.append(box);
        box.addEventListener('pointerdown',function(e){
          if(e.button!==0||!e.target.classList.contains('wf-resize'))return;
          e.preventDefault();e.stopPropagation();
          if(selKind==='depth'){startObject(e,true);return;}
          var el=preview.querySelector('[data-wf-part="'+selectedPart+'"]');if(el)startDrag(e,el,true);
        });
      }
      box.hidden=false;
      box.classList.toggle('no-size',selKind==='addon');
      var tag=box.firstElementChild,name=selKind==='depth'?'Objekts':selKind==='addon'?'Dekors':labels[selectedPart];
      if(tag.textContent!==name)tag.textContent=name;
      box.style.borderRadius=(selKind==='part'&&selectedPart!=='hours'?radiusOf({kind:'part',key:selectedPart,el:preview.querySelector('[data-wf-part="'+selectedPart+'"]')}):12)+'px';
      box.classList.toggle('tag-in',placeFrame(box,b,5)<18);
    }
    // Keep the whole element inside the face, including its scaled bounds.
    // Read geometry only while editing; roster rendering never measures parts.
    function constrainParts(all, keepSize) {
      // Manual dragging/sliders keep the chosen position, including corners.
      // Only preset layout changes and the explicit Fit action move it inward.
      // The player face lays parts out inside its display window; the round-face fit does not apply.
      if((!all&&keepSize)||config.face==='winamp')return;
      apply(preview,Object.assign({},options.get(),{face:config}));
      var r=preview.getBoundingClientRect();
      if(!r.width||!r.height)return;
      (all?M.parts:[selectedPart]).forEach(function(key){
        var el=preview.querySelector('[data-wf-part="'+key+'"]');
        if(!el||el.hidden)return;
        var b=el.getBoundingClientRect();
        config.parts[key]=M.fitPart(config.parts[key],b.width/r.width*100,b.height/r.height*100,keepSize&&key==='hours');
      });
      config=M.clean(config);
    }
    /* ---- The layout rule under every edit ----
       Elements never lie on top of each other: after a layout is chosen, an element
       is moved, grown, added or given another timer, every visible element is
       measured (the numeral by its digits) and placed in turn — the one just moved
       stays where it was put, then name, timer, fatigue, month, initials, emoji,
       clock, coffee, moon. Each keeps its spot if it is free; otherwise it takes the
       nearest free one inside the rounded card, off the big numeral when there is
       room near by (the numeral may stay behind a chip when there is none), and
       only when nothing is free it gets a little smaller. Edit time only: the roster
       never measures. Returns true when anything moved. */
    var SETTLE_ORDER=['name','remaining','fatigue','month','initials','emoji','clock','coffee','moon'];
    function settle(fixedKey,lastKey){
      if(!options.get().face||config.face==='winamp')return false;
      apply(preview,Object.assign({},options.get(),{face:config}));
      var r=preview.getBoundingClientRect();if(!r.width||!r.height)return false;
      function pct(b){return [(b.left-r.left)/r.width*100,(b.top-r.top)/r.height*100,(b.right-r.left)/r.width*100,(b.bottom-r.top)/r.height*100];}
      var numeral=null,items=[];
      M.parts.forEach(function(key){
        var p=config.parts[key],el=preview.querySelector('[data-wf-part="'+key+'"]');
        if(!p||!p[3]||!el||el.hidden||!el.getClientRects().length)return;
        var b=pct(partBox(key,el));if(b[2]-b[0]<=0||b[3]-b[1]<=0)return;
        if(key==='hours'){numeral=b;return;}
        items.push({key:key,p:p,b:b});
      });
      function rank(k){return k===fixedKey?-1:k===lastKey?99:SETTLE_ORDER.indexOf(k);}
      items.sort(function(a,b){return rank(a.key)-rank(b.key);});
      var G=1.4,placed=[],moved=false;
      function over(a,b,g){return a[0]<b[2]+g&&a[2]>b[0]-g&&a[1]<b[3]+g&&a[3]>b[1]-g;}
      function inCard(b){
        if(b[0]<3||b[2]>97||b[1]<3||b[3]>97)return false;
        return [[b[0],b[1]],[b[2],b[1]],[b[0],b[3]],[b[2],b[3]]].every(function(c){var dx=Math.max(0,22-c[0],c[0]-78),dy=Math.max(0,22-c[1],c[1]-78);return !dx||!dy||dx*dx+dy*dy<=19*19;});
      }
      function free(b,avoidNum){
        if(!inCard(b))return false;
        for(var i=0;i<placed.length;i++)if(over(b,placed[i],G))return false;
        return !(avoidNum&&numeral&&over(b,numeral,.6));
      }
      function at(it,k,dx,dy){var cx=(it.b[0]+it.b[2])/2,cy=(it.b[1]+it.b[3])/2,hw=(it.b[2]-it.b[0])/2*k,hh=(it.b[3]-it.b[1])/2*k;return [cx+dx-hw,cy+dy-hh,cx+dx+hw,cy+dy+hh];}
      function numCover(b){if(!numeral)return 0;var w=Math.min(b[2],numeral[2])-Math.max(b[0],numeral[0]),h=Math.min(b[3],numeral[3])-Math.max(b[1],numeral[1]);return w>0&&h>0?w*h:0;}
      // Nearest free offset, ring by ring outwards (whole per cent steps). Where the
      // numeral may be covered, the cost is distance plus how much of it is covered,
      // so a chip over the numeral takes its edge, not its middle.
      function nearest(it,k,avoidNum,maxD){
        var best=null,bc=1e9;
        for(var d=0;d<=maxD&&d*d<bc;d++){
          var test=function(dx,dy){
            var x=it.p[0]+dx,y=it.p[1]+dy;if(x<5||x>95||y<5||y>95)return;
            var b=at(it,k,dx,dy),q=dx*dx+dy*dy;if(q>=bc)return;
            if(!avoidNum)q+=numCover(b)*1.4;
            if(q<bc&&free(b,avoidNum)){best=[dx,dy];bc=q;}
          };
          for(var i=-d;i<=d;i++){test(i,-d);if(d)test(i,d);if(i>-d&&i<d){test(-d,i);test(d,i);}}
          if(best&&avoidNum)return best;
        }
        return best;
      }
      items.forEach(function(it){
        var hit=null,k=1;
        if(it.key===fixedKey){
          // What was just moved stays — only pulled back inside the card if it pokes out.
          hit=inCard(it.b)?[0,0]:nearest(it,1,false,30)||[0,0];
          if(hit[0]||hit[1]){it.p[0]=Math.round(it.p[0]+hit[0]);it.p[1]=Math.round(it.p[1]+hit[1]);moved=true;}
          placed.push(at(it,1,hit[0],hit[1]));return;
        }
        // Nudge, then a little smaller where it is, then farther (still off the numeral),
        // then over the numeral near by, then anywhere. Never below ~70 % of its size
        // unless nothing else is left: small text is no better than hidden text.
        var tries=[[1,true,6],[.9,true,8],[1,true,24],[.9,true,24],[.8,true,14],[1,false,40],[.9,false,40],[.8,false,100],[.7,false,100]];
        // (never below 70 % of the normal size: smaller text stops being read)
        tries=tries.filter(function(t,i){return i===0||it.p[2]*t[0]>=70;});
        // Last resort, still better than lying on another element: smaller, down to the 50 % floor.
        [.6,.5].forEach(function(k2){var sc=Math.max(50,it.p[2]*k2)/it.p[2];if(sc<1)tries.push([sc,false,100]);});
        // Already over the numeral (the layout's own design) and clear of every chip: leave it.
        if(free(it.b,false))hit=numeral&&over(it.b,numeral,.6)?nearest(it,1,true,10)||[0,0]:[0,0];
        for(var t=0;!hit&&t<tries.length;t++){k=tries[t][0];hit=nearest(it,k,tries[t][1],tries[t][2]);}
        if(!hit){hit=[0,0];k=1;}
        var nx=Math.round(it.p[0]+hit[0]),ny=Math.round(it.p[1]+hit[1]),ns=Math.max(50,Math.round(it.p[2]*k));
        if(nx!==it.p[0]||ny!==it.p[1]||ns!==it.p[2]){it.p[0]=nx;it.p[1]=ny;it.p[2]=ns;moved=true;}
        placed.push(at(it,k,hit[0],hit[1]));
      });
      if(moved){config=M.clean(config,true);apply(preview,Object.assign({},options.get(),{face:config}));}
      return moved;
    }
    // A settle outside save() (a new timer, a slider let go): stored without an undo step of its own.
    // keepNum: a ready-made look keeps its own numeral colour (a layout save would set it to the accent).
    function settleStore(fixedKey,lastKey,keepNum){
      if(!settle(fixedKey,lastKey))return;
      var d=options.get(),num=d.num;
      options.change(M.clean(config,true));
      if(keepNum){if(num==null)delete d.num;else d.num=num;var nc=host.querySelector('.mk-num-color');if(nc&&num)nc.value='#'+String(num).split(',').map(function(n){return (+n).toString(16).padStart(2,'0');}).join('');}
      sync();
    }
    currentSettle=function(){if(options.get().face&&preview.isConnected)settleStore(null,null,true);};
    /* constrain: true = the selected element was moved/sized (it stays, the rest make room);
       'all'/'fit'/'material' = a whole new arrangement; 'parts' = an element was added or
       removed (it finds a free spot, the rest stay); 'slide' = a slider mid-drag (no settle
       until it is let go). */
    function save(constrain) {
      history.push(options.get().face ? M.clean(options.get().face) : null);
      if(history.length>20)history.shift();
      preview.classList.add('wf-editing');config=M.clean(config);
      var c=constrain==='slide'||constrain==='parts'?true:constrain;
      if(c)constrainParts(c==='all'||c==='material',c===true||c==='material');
      if(constrain&&constrain!=='slide')settle(constrain===true?selectedPart:null,constrain==='parts'?selectedPart:null);
      options.change(M.clean(config,true));sync();sizePreview();
    }
    tab.addEventListener('click',activate);
    tabs.addEventListener('click',function(e){if(e.target.closest('[data-skin-section]')!==tab){preview.classList.remove('wf-editing');apply(preview,options.get());}});
    panel.addEventListener('click',function(e){
      var el=e.target.closest('button');if(!el)return;
      if(el.dataset.face){var previous=options.get().face;if(previous)previous=M.clean(previous);config=M.preset(el.dataset.face,previous?config:null);if(previous)M.parts.forEach(function(key){config.parts[key][3]=previous.parts[key][3];});if(el.dataset.face==='winamp'&&(!previous||previous.face!=='winamp'))config.tint='9dff4a';save('all');}
      if(el.dataset.tint){config.tint=el.dataset.tint;save();}
      if(el.dataset.metal!=null){config.metal=+el.dataset.metal;save();}
      if(el.dataset.finish!=null){config.finish=+el.dataset.finish;save('material');}
      if(el.dataset.timerStyle!=null||el.dataset.timerHand||el.dataset.timerFace||el.dataset.timerSkin||el.dataset.timerDigit!=null){
        var cur=DIAL_RE.test(String(options.get().tm||''))?options.get().tm:'a11';
        var next=el.dataset.timerDigit!=null?(el.dataset.timerDigit?el.dataset.timerDigit+'11':''):el.dataset.timerStyle!=null?(el.dataset.timerStyle?cur:''):el.dataset.timerSkin?el.dataset.timerSkin+cur[1]+cur[2]:el.dataset.timerHand?cur[0]+el.dataset.timerHand+cur[2]:cur[0]+cur[1]+el.dataset.timerFace;
        // Turning the dial on: it is bigger than the chip, so it takes the nearest free spot.
        if(DIAL_RE.test(next)&&!DIAL_RE.test(String(options.get().tm||''))&&M.fitDial){M.fitDial(config);save();}
        if(options.timer)options.timer(next);apply(preview,options.get());sync();
        // A dial or a stacked readout is bigger than the chip: it finds room, the rest stay.
        settleStore(null,'remaining');
      }
      if(el.dataset.coffeeMode!=null){config.coffeeMode=+el.dataset.coffeeMode;config.coffeeExplicit=1;save(true);}
      if(el.dataset.coffeeContrast!=null){if(window.MINKA_APP==='rad'&&!config.coffeeExplicit)config.coffeeMode=0;config.coffeeContrast=+el.dataset.coffeeContrast;save();}
      if(el.dataset.fullTintMode!=null){config.fullTintMode=+el.dataset.fullTintMode;save();}
      if(el.dataset.fullTintScheme!=null){config.fullTintScheme=+el.dataset.fullTintScheme;save();}
      if(el.classList.contains('wf-full-tint-auto')){config.fullTintAuto=config.fullTintAuto?0:1;save();}
      if(el.classList.contains('wf-part-color-clear')){config.colors[selectedPart]='';save();}
      if(el.dataset.partPlate!=null){config.plates[selectedPart]=+el.dataset.partPlate;save();}
      if(el.dataset.part){selKind='part';selectedPart=el.dataset.part;if(!config.parts[selectedPart][3]||!options.get().face){config.parts[selectedPart][3]=1;save('parts');}else sync();}
      if(el.classList.contains('wf-remove')){config.parts[selectedPart][3]=config.parts[selectedPart][3]?0:1;save('parts');}
      if(el.classList.contains('wf-undo')&&history.length){var previous=history.pop();config=M.clean(previous);options.change(previous);preview.classList.toggle('wf-editing',!!previous);apply(preview,options.get());sync();sizePreview();}
      if(el.classList.contains('wf-fit'))save('fit');
      // The layout most people build by hand: the essentials only.
      if(el.classList.contains('wf-minimal')){var keep={hours:1,name:1,remaining:1,emoji:1,moon:1};M.parts.forEach(function(k){config.parts[k][3]=keep[k]?1:0;});save('all');}
      if(el.classList.contains('wf-reset')){config=M.preset(config.face,config);save('all');}
      if(el.classList.contains('wf-original')){options.change(null);options.section('background');options.rebuild();}
    });
    panel.querySelector('.wf-depth-toggle').addEventListener('change',function(e){options.depth(e.target.checked);sync();});
    panel.addEventListener('input',function(e){
      var el=e.target;
      if(el.classList.contains('wf-color'))config.tint=el.value.slice(1);
      else if(el.classList.contains('wf-part-color-input'))config.colors[selectedPart]=el.value.slice(1);
      else if(el.classList.contains('wf-full-tint-hue')){config.fullTintHue=+el.value;config.fullTintAuto=0;}
      else if(el.classList.contains('wf-full-tint-light'))config.fullTintIntensity=+el.value;
      else if(el.dataset.position)config.parts[selectedPart][{x:0,y:1,size:2}[el.dataset.position]]=+el.value;
      else if(el.dataset.image)config[el.dataset.image]=+el.value;
      else return;
      save(el.dataset.position?'slide':false);
    });
    // A position slider let go: now the others make room.
    panel.addEventListener('change',function(e){if(e.target.dataset&&e.target.dataset.position)settleStore(selectedPart);});
    // Pointer capture stays on the unchanged preview. All coordinates are relative
    // to its real dimensions; persisted values never depend on device pixels.
    // While dragging only the moved element's three variables change (once a frame);
    // the full repaint, the sliders and the save wait for the release.
    var drag=null,dragFrame=0,dragEvt=null;
    function startDrag(e,el,resizing){
      if(!preview.classList.contains('wf-editing')||config.face==='winamp')return;
      selKind='part';selectedPart=el.dataset.wfPart;sync();showHover(null);
      var r=preview.getBoundingClientRect(),b=partBox(selectedPart,el),cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:config.parts[selectedPart][0],py:config.parts[selectedPart][1],r:r,el:el,
        resize:resizing,size:config.parts[selectedPart][2],cx:cx,cy:cy,d0:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy)),moved:false};
      try{preview.setPointerCapture(e.pointerId);}catch(_e){}
    }
    // The object in front of the numeral is the photo's own cut-out: moving it moves
    // the picture (Attēla novietojums), its handles zoom the picture.
    function startObject(e,zoom){
      var f=depthFrame();if(!f||!f.box)return;
      selKind='depth';showHover(null);placeSel();
      var clip=f.el.getBoundingClientRect(),q=f.el.firstElementChild.getBoundingClientRect(),m=maskOf(cssUrl(f.el.firstElementChild.style.backgroundImage));
      var s=Math.max(q.width/m.nw,q.height/m.nh),cx=(f.box.left+f.box.right)/2,cy=(f.box.top+f.box.bottom)/2;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,obj:true,zoom:zoom,ix:config.imageX,iy:config.imageY,iz:config.imageZoom,
        spanX:m.nw*s-clip.width,spanY:m.nh*s-clip.height,cx:cx,cy:cy,d0:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy)),moved:false};
      try{preview.setPointerCapture(e.pointerId);}catch(_e){}
    }
    function becomeLayout(key){
      // The original classic card has no saved layout: the first grab gives it one,
      // in the same place and colour, so the element can move. Atcelt returns it.
      var num=String(options.get().num||'');
      config=M.preset('classic',null);
      if(/^\d{1,3},\d{1,3},\d{1,3}$/.test(num))config.tint=num.split(',').map(function(n){return Math.min(255,+n).toString(16).padStart(2,'0');}).join('');
      selectedPart=key;save('all');
      if(typeof window._mkToast==='function')window._mkToast('Kartīte pārslēgta uz rediģējamu izkārtojumu — “Atcelt pēdējo” to atgriež','ok');
      return preview.querySelector('[data-wf-part="'+key+'"]');
    }
    preview.addEventListener('pointerdown',function(e){
      if(e.button!==0)return;
      var hit=pickPress(e);
      if(!hit){if(selKind!=='part'){selKind='part';placeSel();}return;}
      if(hit.kind==='addon'){selKind='addon';selAddon=hit.el;showHover(null);placeSel();return;}   // it drags itself (card-addons)
      e.preventDefault();e.stopPropagation();
      if(hit.kind==='depth'){startObject(e,false);return;}
      showGroup('parts');
      var el=hit.el;
      if(!options.get().face){el=becomeLayout(hit.key);if(!el)return;}
      else if(!preview.classList.contains('wf-editing'))return;
      startDrag(e,el,false);
    },true);
    // An addon being dragged (its own capture): the frame follows it.
    preview.addEventListener('pointermove',function(e){
      if(selKind==='addon'&&e.buttons&&selAddon&&selAddon.classList.contains('is-dragging')&&!dragFrame)dragFrame=requestAnimationFrame(function(){dragFrame=0;placeSel();});
    },{passive:true});
    // Alignment guides while dragging: the card centre (amber) and the centres
    // of the other visible elements (blue). Within SNAP % the part locks on.
    var SNAP=2.5;
    function guideLayer(){
      var g=preview.querySelector(':scope > .wf-guides');
      if(!g){g=document.createElement('div');g.className='wf-guides';g.setAttribute('aria-hidden','true');g.innerHTML='<i class="wf-g-cx"></i><i class="wf-g-cy"></i><i class="wf-g-v"></i><i class="wf-g-h"></i>';preview.append(g);}
      return g;
    }
    function snap(nx,ny){
      var xs=[[50,'center']],ys=[[50,'center']];
      M.parts.forEach(function(key){var p=config.parts[key];if(key===selectedPart||!p||!p[3])return;var el=preview.querySelector('[data-wf-part="'+key+'"]');if(!el||el.hidden)return;xs.push([p[0],'part']);ys.push([p[1],'part']);});
      var bx=null,by=null;
      xs.forEach(function(t){var d=Math.abs(t[0]-nx);if(d<=SNAP&&(!bx||d<bx.d))bx={v:t[0],k:t[1],d:d};});
      ys.forEach(function(t){var d=Math.abs(t[0]-ny);if(d<=SNAP&&(!by||d<by.d))by={v:t[0],k:t[1],d:d};});
      var g=guideLayer();g.classList.add('is-on');
      var v=g.querySelector('.wf-g-v'),h=g.querySelector('.wf-g-h');
      v.hidden=!bx;h.hidden=!by;
      if(bx){v.style.left=bx.v+'%';v.dataset.kind=bx.k;nx=bx.v;}
      if(by){h.style.top=by.v+'%';h.dataset.kind=by.k;ny=by.v;}
      return [nx,ny];
    }
    function livePart(){
      var p=config.parts[selectedPart],el=preview.querySelector('[data-wf-part="'+selectedPart+'"]');if(!el)return;
      el.style.setProperty('--wf-x',p[0]+'%');el.style.setProperty('--wf-y',p[1]+'%');el.style.setProperty('--wf-scale',p[2]/100);
    }
    function liveImage(){
      preview.style.setProperty('--wf-bg-x',config.imageX+'%');preview.style.setProperty('--wf-bg-y',config.imageY+'%');
      preview.style.setProperty('--wf-bg-zoom',config.imageZoom+'%');preview.style.setProperty('--wf-zoom-ratio',config.imageZoom/100);
    }
    function dragStep(){
      dragFrame=0;var e=dragEvt;if(!drag||!e)return;
      if(drag.obj){
        if(drag.zoom)config.imageZoom=Math.max(100,Math.min(180,Math.round(drag.iz*Math.hypot(e.clientX-drag.cx,e.clientY-drag.cy)/drag.d0)));
        else{
          if(drag.spanX>1)config.imageX=Math.max(0,Math.min(100,Math.round(drag.ix-(e.clientX-drag.x)*100/drag.spanX)));
          if(drag.spanY>1)config.imageY=Math.max(0,Math.min(100,Math.round(drag.iy-(e.clientY-drag.y)*100/drag.spanY)));
        }
        liveImage();placeSel();
        // A photo that exactly fills the card has nowhere to slide: say what helps instead.
        if(!drag.zoom&&drag.spanX<=1&&drag.spanY<=1){var tg=frameHost().querySelector('.wf-sel-tag');if(tg)tg.textContent='Objekts: vispirms tuvini (velc stūri)';}
        return;
      }
      if(drag.resize){
        // size follows the distance from the element's centre
        var max=selectedPart==='hours'?300:170,d=Math.hypot(e.clientX-drag.cx,e.clientY-drag.cy);
        config.parts[selectedPart][2]=Math.max(50,Math.min(max,Math.round(drag.size*d/drag.d0)));
      }else{
        var nx=Math.max(5,Math.min(95,drag.px+(e.clientX-drag.x)/drag.r.width*100));
        var ny=Math.max(5,Math.min(95,drag.py+(e.clientY-drag.y)/drag.r.height*100));
        var s=snap(nx,ny);
        config.parts[selectedPart][0]=Math.round(s[0]);
        config.parts[selectedPart][1]=Math.round(s[1]);
      }
      livePart();placeSel();
    }
    preview.addEventListener('pointermove',function(e){
      if(!drag||e.pointerId!==drag.id)return;
      if(!drag.moved&&Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)<3)return;
      drag.moved=true;if(lastPress)lastPress.moved=true;
      dragEvt=e;if(!dragFrame)dragFrame=requestAnimationFrame(dragStep);
    });
    function endDrag(e){
      if(!drag||e.pointerId!==drag.id)return;
      var d=drag;if(dragFrame){cancelAnimationFrame(dragFrame);dragStep();}
      drag=null;dragEvt=null;var g=preview.querySelector(':scope > .wf-guides');if(g)g.remove();
      if(d.moved){apply(preview,Object.assign({},options.get(),{face:config}));save(d.obj?false:true);}else placeSel();
    }
    preview.addEventListener('pointerup',endDrag);preview.addEventListener('pointercancel',endDrag);preview.addEventListener('lostpointercapture',endDrag);
    preview.addEventListener('click',function(e){if(preview.classList.contains('wf-editing')){e.preventDefault();e.stopPropagation();}},true);
    // Pinch on a trackpad (or Ctrl + wheel) over the selected element resizes it.
    var wheelSave=0;
    preview.parentElement.addEventListener('wheel',function(e){
      if(!e.ctrlKey||drag)return;
      var b=selBox();if(!b||e.clientX<b.left-8||e.clientX>b.right+8||e.clientY<b.top-8||e.clientY>b.bottom+8)return;
      e.preventDefault();
      // A trackpad pinch sends small steps, a mouse wheel notch ~100: each step is capped.
      var k=Math.max(.9,Math.min(1.1,Math.exp(-e.deltaY*.004)));
      if(selKind==='depth'){config.imageZoom=Math.max(100,Math.min(180,Math.round(config.imageZoom*k)));liveImage();}
      else if(selKind==='part'){var p=config.parts[selectedPart];p[2]=Math.max(50,Math.min(selectedPart==='hours'?300:170,Math.round(p[2]*k)));livePart();}
      else return;
      placeSel();clearTimeout(wheelSave);wheelSave=setTimeout(function(){apply(preview,Object.assign({},options.get(),{face:config}));save(selKind==='part');},260);
    },{passive:false});
    preview.addEventListener('keydown',function(e){
      if(!preview.classList.contains('wf-editing'))return;
      var el=e.target.closest('[data-wf-part]');if(!el)return;
      var arrow=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key),size=e.key==='+'||e.key==='='||e.key==='-';
      if(!arrow&&!size)return;
      e.preventDefault();e.stopPropagation();selKind='part';selectedPart=el.dataset.wfPart;
      if(size){var p=config.parts[selectedPart];p[2]=Math.max(50,Math.min(selectedPart==='hours'?300:170,p[2]+(e.key==='-'?-1:1)*(e.shiftKey?10:4)));save(true);return;}
      var i=/Left|Right/.test(e.key)?0:1,delta=/Left|Up/.test(e.key)?-1:1;
      config.parts[selectedPart][i]+=delta*(e.shiftKey?5:1);save(true);
    });
    if(options.active()==='face')activate();
  }
  // The editor is being emptied: stop watching its preview and card clones.
  function release(host) {
    if (previewObserver) { previewObserver.disconnect(); previewObserver = null; }
    cancelAnimationFrame(previewFrame); previewFrame = 0; refreshPreview = function() {}; currentPick = function () { return null; }; currentSettle = function () {}; releaseContours(); releaseContours = function () {};
    if (waSizes && host) host.querySelectorAll('.wf-winamp').forEach(function (card) { waSizes.unobserve(card); });
  }
  window.MinkaCardFaces = { dialPreview: dialPreview, dialMarkup: dialMarkup, dialSkins: DIAL_SKINS, digitSkins: DIGIT_SKINS, digitPreview: digitPreview, pick: function(e){ return currentPick(e); }, settle: function(){ currentSettle(); }, apply: apply, mount: mount, release: release, refreshPreview: function(){refreshPreview();} };
})();
