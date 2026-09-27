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
  function hm(t) { var m = /^(\d{1,2}):(\d\d)$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; }
  var DIAL_SKINS = [['a', 'Stikls'], ['b', 'Hronogrāfs'], ['c', 'Gredzens'], ['d', 'Rastrs'], ['e', 'Segmenti']];
  var DIAL_RE = /^[a-e][1-3][1-3]$/;
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
    function ang(min) { return (min % 720) / 720 * 360; }
    function pt(min, r) { var a = (min % 720) / 720 * Math.PI * 2 - Math.PI / 2; return [(50 + r * Math.cos(a)).toFixed(2), (50 + r * Math.sin(a)).toFixed(2)]; }
    function arc(from, span, r) { var p0 = pt(from, r), p1 = pt(from + span, r); return 'M' + p0.join(' ') + 'A' + r + ' ' + r + ' 0 ' + (span > 360 ? 1 : 0) + ' 1 ' + p1.join(' '); }
    function line(a, b, cls) { return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="' + cls + '"/>'; }
    var from = active ? now : s, rest = s == null || phase === 'done' ? 0 : Math.min(719, Math.max(0, e - from));
    var done = active ? Math.min(719, Math.max(0, now - s)) : phase === 'done' ? Math.min(719, e - s) : 0;
    var plan = phase === 'soon' || phase === 'plan';   // not started: the window, dashed, with its start point
    var pc = plan ? ' plan' : '';
    var body = '', label = 'mid', mask = done > 0 && skin !== 'c' && skin !== 'e' ? '<i class="dial-done" style="--a0:' + ang(s).toFixed(1) + 'deg;--sp:' + ang(done).toFixed(1) + 'deg"></i>' : '';
    if (skin === 'a') {
      for (var h = 0; h < 12; h++) body += line(pt(h * 60, 45.5), pt(h * 60, h % 3 ? 41.8 : 39.5), h % 3 ? 'tk' : 'tk q');
      if (rest > 0) body += '<path class="rest' + pc + '" d="' + arc(from, rest, 47.6) + '"/>';
    } else if (skin === 'b') {
      for (var i = 0; i < 60; i++) body += line(pt(i * 12, 46.5), pt(i * 12, i % 5 ? 44.4 : 42.2), i % 5 ? 'tk fine' : 'tk');
      body += [12, 3, 6, 9].map(function(n, k) { var q = pt(k * 180, 34.5); return '<text class="num" x="' + q[0] + '" y="' + (+q[1] + 3.3) + '">' + n + '</text>'; }).join('');
      if (rest > 0) body += '<path class="rest' + pc + '" d="' + arc(from, rest, 40) + '"/>';
      body += '<circle cx="50" cy="66" r="12.5" class="sub"/>'; label = 'sub';
    } else if (skin === 'c') {
      body += '<circle cx="50" cy="50" r="41" class="ring-track"/>';
      if (done > 0) body += '<path class="ring-done" d="' + arc(s, done, 41) + '"/>';
      if (rest > 0) body += '<path class="ring-rest' + pc + '" d="' + arc(from, rest, 41) + '"/>';
      var mk = pt(now, 41); body += '<circle cx="' + mk[0] + '" cy="' + mk[1] + '" r="3.2" class="knob"/>';
      hand = 0; label = 'big';
    } else if (skin === 'd') {
      for (var y = 8; y <= 92; y += 6.5) for (var x = 8; x <= 92; x += 6.5) {
        var dx = x - 50, dy = y - 50, rr = Math.hypot(dx, dy);
        if (rr > 44) continue;
        var mm = ((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360) / 360 * 720;
        var k2 = ((mm - s) % 720 + 720) % 720, isDone = done > 0 && k2 <= done, isRest = !isDone && rest > 0 && ((mm - from) % 720 + 720) % 720 <= rest;
        body += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (isDone ? 2.1 : isRest ? 1.35 : .8) + '" class="' + (isDone ? 'px on' : isRest ? 'px rest-dot' : 'px') + '"/>';
      }
      label = 'plate';
    } else {
      for (var g = 0; g < 12; g++) {
        var g0 = g * 60, seg = arc(g0 + 3, 54, 42);
        var kk = ((g0 - s % 720) + 720) % 720, fill = done > 0 ? Math.max(0, Math.min(60, done - kk)) : 0;
        body += '<path class="seg" d="' + seg + '"/>';
        if (fill > 4) body += '<path class="seg on" d="' + arc(g0 + 3, Math.min(54, fill - 3), 42) + '"/>';
      }
      if (rest > 0) body += '<path class="rest thin' + pc + '" d="' + arc(from, rest, 48) + '"/>';
    }
    // The start point, on the dial's rim: a dot with a tick, so "it begins here" reads at a glance.
    if (plan) { var st = pt(s, 44), st2 = pt(s, 36); body += line(st2, st, 'start-tick') + '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="3.3" class="start"/>'; }
    var tip = pt(now, hand === 3 ? 25 : 35), tail = pt(now + 360, 8), handSvg = '';
    if (hand === 1) handSvg = line(['50', '50'], tip, 'hand') + '<circle cx="' + tip[0] + '" cy="' + tip[1] + '" r="2.4" class="knob"/>';
    else if (hand === 2) handSvg = line(tail, tip, 'hand') + '<circle cx="50" cy="50" r="2.6" class="pin"/>';
    else if (hand === 3) handSvg = line(['50', '50'], tip, 'hand bar');
    if (hand) handSvg += '<circle cx="50" cy="50" r="1.4" class="knob"/>';
    var txt = '';
    if (big) {
      if (label === 'sub') txt = '<text class="v s" x="50" y="68.2">' + big + '</text>';
      else if (label === 'big') txt = '<text class="v xl" x="50" y="55">' + big + '</text><text class="l" x="50" y="64">' + small + '</text>';
      else if (label === 'plate') txt = '<rect x="30" y="58" width="40" height="15" rx="7.5" class="plate"/><text class="v s" x="50" y="68.6">' + big + '</text>';
      else txt = '<text class="v" x="50" y="70">' + big + '</text><text class="l" x="50" y="77.5">' + small + '</text>';
    }
    return mask + '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + handSvg + txt + '</svg>';
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
    el.setAttribute('aria-label', 'Maiņas laiks: ' + ((box.querySelector('.v') || {}).textContent || ''));
  }
  function setDial(card, skin, config) {
    var el = card.querySelector('[data-wf-part="remaining"]');
    if (!el) return;
    var tm = skin && DIAL_RE.test(String(skin.tm || '')) && config && config.face !== 'winamp' ? skin.tm : '';
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
      + '<div class="wf-timer-options" hidden><div class="wf-segment" aria-label="Taimeris"><button type="button" data-timer-style="">Cipari</button><button type="button" data-timer-style="a">Analogs</button></div>'
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

    // Pieskaroties elementam priekšskatījumā, uzreiz rāda tā iestatījumus.
    preview.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest('[data-wf-part]'))showGroup('parts');},true);
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
      var tm=DIAL_RE.test(String(options.get().tm||''))?options.get().tm:'';
      panel.querySelector('.wf-timer-options').hidden=selectedPart!=='remaining'||config.face==='winamp';
      panel.querySelector('.wf-timer-analog').hidden=!tm;
      panel.querySelectorAll('[data-timer-style]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.timerStyle===(tm?'a':'')));});
      panel.querySelectorAll('[data-timer-hand]').forEach(function(el){el.setAttribute('aria-pressed',String(!!tm&&el.dataset.timerHand===tm[1]));el.disabled=tm[0]==='c';});
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
      // Corner handle: resize the selected element with the mouse.
      var oldHandle=preview.querySelector('.wf-resize'),selEl=preview.querySelector('[data-wf-part="'+selectedPart+'"]');
      if(oldHandle&&oldHandle.parentElement!==selEl)oldHandle.remove();
      if(selEl&&!selEl.hidden&&config.face!=='winamp'&&!selEl.querySelector(':scope > .wf-resize')){var hd=document.createElement('span');hd.className='wf-resize';hd.setAttribute('aria-hidden','true');hd.title='Velc, lai mainītu izmēru';selEl.append(hd);}
      preview.closest('.mk-skin-preview-list').setAttribute('aria-hidden','false');
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
    function save(constrain) {
      history.push(options.get().face ? M.clean(options.get().face) : null);
      if(history.length>20)history.shift();
      preview.classList.add('wf-editing');config=M.clean(config);if(constrain)constrainParts(constrain==='all'||constrain==='material',constrain===true||constrain==='material');options.change(M.clean(config));sync();sizePreview();
    }
    tab.addEventListener('click',activate);
    tabs.addEventListener('click',function(e){if(e.target.closest('[data-skin-section]')!==tab){preview.classList.remove('wf-editing');apply(preview,options.get());}});
    panel.addEventListener('click',function(e){
      var el=e.target.closest('button');if(!el)return;
      if(el.dataset.face){var previous=options.get().face;if(previous)previous=M.clean(previous);config=M.preset(el.dataset.face,previous?config:null);if(previous)M.parts.forEach(function(key){config.parts[key][3]=previous.parts[key][3];});if(el.dataset.face==='winamp'&&(!previous||previous.face!=='winamp'))config.tint='9dff4a';save('all');}
      if(el.dataset.tint){config.tint=el.dataset.tint;save();}
      if(el.dataset.metal!=null){config.metal=+el.dataset.metal;save();}
      if(el.dataset.finish!=null){config.finish=+el.dataset.finish;save('material');}
      if(el.dataset.timerStyle!=null||el.dataset.timerHand||el.dataset.timerFace||el.dataset.timerSkin){
        var cur=DIAL_RE.test(String(options.get().tm||''))?options.get().tm:'a11';
        var next=el.dataset.timerStyle!=null?(el.dataset.timerStyle?cur:''):el.dataset.timerSkin?el.dataset.timerSkin+cur[1]+cur[2]:el.dataset.timerHand?cur[0]+el.dataset.timerHand+cur[2]:cur[0]+cur[1]+el.dataset.timerFace;
        // Turning the dial on: it is bigger than the chip, so it takes the nearest free spot.
        if(next&&!DIAL_RE.test(String(options.get().tm||''))&&M.fitDial){M.fitDial(config);save();}
        if(options.timer)options.timer(next);apply(preview,options.get());sync();
      }
      if(el.dataset.coffeeMode!=null){config.coffeeMode=+el.dataset.coffeeMode;config.coffeeExplicit=1;save(true);}
      if(el.dataset.coffeeContrast!=null){if(window.MINKA_APP==='rad'&&!config.coffeeExplicit)config.coffeeMode=0;config.coffeeContrast=+el.dataset.coffeeContrast;save();}
      if(el.dataset.fullTintMode!=null){config.fullTintMode=+el.dataset.fullTintMode;save();}
      if(el.dataset.fullTintScheme!=null){config.fullTintScheme=+el.dataset.fullTintScheme;save();}
      if(el.classList.contains('wf-full-tint-auto')){config.fullTintAuto=config.fullTintAuto?0:1;save();}
      if(el.classList.contains('wf-part-color-clear')){config.colors[selectedPart]='';save();}
      if(el.dataset.part){selectedPart=el.dataset.part;if(!config.parts[selectedPart][3]||!options.get().face){config.parts[selectedPart][3]=1;save(true);}else sync();}
      if(el.classList.contains('wf-remove')){config.parts[selectedPart][3]=config.parts[selectedPart][3]?0:1;save(true);}
      if(el.classList.contains('wf-undo')&&history.length){var previous=history.pop();config=M.clean(previous);options.change(previous);preview.classList.toggle('wf-editing',!!previous);apply(preview,options.get());sync();sizePreview();}
      if(el.classList.contains('wf-fit'))save('fit');
      // The layout most people build by hand: the essentials only.
      if(el.classList.contains('wf-minimal')){var keep={hours:1,name:1,remaining:1,emoji:1,moon:1};M.parts.forEach(function(k){config.parts[k][3]=keep[k]?1:0;});save(true);}
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
      save(!!el.dataset.position);
    });
    // Pointer capture stays on the unchanged preview. All coordinates are relative
    // to its real dimensions; persisted values never depend on device pixels.
    var drag=null;
    preview.addEventListener('pointerdown',function(e){
      if(!preview.classList.contains('wf-editing')||e.button!==0||config.face==='winamp')return;
      var el=e.target.closest('[data-wf-part]');if(!el)return;
      e.preventDefault();e.stopPropagation();
      var resizing=!!e.target.closest('.wf-resize');
      selectedPart=el.dataset.wfPart;sync();
      var r=preview.getBoundingClientRect(),b=el.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:config.parts[selectedPart][0],py:config.parts[selectedPart][1],r:r,
        resize:resizing,size:config.parts[selectedPart][2],cx:cx,cy:cy,d0:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy))};
      try{preview.setPointerCapture(e.pointerId);}catch(_e){}
    });
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
    preview.addEventListener('pointermove',function(e){
      if(!drag||e.pointerId!==drag.id)return;
      if(drag.resize){
        // size follows the distance from the element's centre
        var max=selectedPart==='hours'?300:170,d=Math.hypot(e.clientX-drag.cx,e.clientY-drag.cy);
        config.parts[selectedPart][2]=Math.max(50,Math.min(max,Math.round(drag.size*d/drag.d0)));
        apply(preview,Object.assign({},options.get(),{face:config}));sync();return;
      }
      var nx=Math.max(5,Math.min(95,drag.px+(e.clientX-drag.x)/drag.r.width*100));
      var ny=Math.max(5,Math.min(95,drag.py+(e.clientY-drag.y)/drag.r.height*100));
      var s=snap(nx,ny);
      config.parts[selectedPart][0]=Math.round(s[0]);
      config.parts[selectedPart][1]=Math.round(s[1]);
      constrainParts(false,true);apply(preview,Object.assign({},options.get(),{face:config}));sync();
    });
    function endDrag(e){if(!drag||e.pointerId!==drag.id)return;drag=null;var g=preview.querySelector(':scope > .wf-guides');if(g)g.remove();save(true);}
    preview.addEventListener('pointerup',endDrag);preview.addEventListener('pointercancel',endDrag);preview.addEventListener('lostpointercapture',endDrag);
    preview.addEventListener('click',function(e){if(preview.classList.contains('wf-editing')){e.preventDefault();e.stopPropagation();}},true);
    preview.addEventListener('keydown',function(e){
      if(!preview.classList.contains('wf-editing')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      var el=e.target.closest('[data-wf-part]');if(!el)return;
      e.preventDefault();e.stopPropagation();selectedPart=el.dataset.wfPart;
      var i=/Left|Right/.test(e.key)?0:1,delta=/Left|Up/.test(e.key)?-1:1;
      config.parts[selectedPart][i]+=delta*(e.shiftKey?5:1);save(true);
    });
    if(options.active()==='face')activate();
  }
  // The editor is being emptied: stop watching its preview and card clones.
  function release(host) {
    if (previewObserver) { previewObserver.disconnect(); previewObserver = null; }
    cancelAnimationFrame(previewFrame); previewFrame = 0; refreshPreview = function() {};
    if (waSizes && host) host.querySelectorAll('.wf-winamp').forEach(function (card) { waSizes.unobserve(card); });
  }
  window.MinkaCardFaces = { dialPreview: dialPreview, dialSkins: DIAL_SKINS, apply: apply, mount: mount, release: release, refreshPreview: function(){refreshPreview();} };
})();
