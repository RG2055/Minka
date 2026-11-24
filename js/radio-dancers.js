/* Three Nogurumiņi dance together inside the mood's big glass bubble (Noskaņa) while the radio or RG Music plays
   minimized; the mood comes back when the music stops (the user: the original round creatures, one choreography
   for the group, on the music's own beat; never a load on an old computer; no switch: they live in the bubble).

   The dance is pre-rendered (scripts/blender/dance/choreo.py -> scripts/build-dance.sh): per creature one WebP
   sheet of 384 frames = 4 phrases (A bounce, B sway, C arms and turns, D jump) x 8 beats x 12 steps; koro has
   96 more in a sheet of their own, E: it comes close and shows off its diamond grillz (its two fangs iced too),
   rendered twice as big with the original's dense fur, cropped tight (EBOX: where in the frame); the diamonds
   flash in the page (glint: small four-point stars on the teeth, TEETH: where they are). One clock, one beat for all three, but each dances its own
   phrase at a time (the user: "why do they all dance the same"), the third mirrored. The clock runs on the radio's own sound when it can be heard (its Web
   Audio graph in radio.js: the bass's onsets give the tempo and nudge the phase, the energy picks the phrase); for RG
   Music (another site's player: its sound cannot be read) and on a weak computer, on a steady 116 a minute.
   Cost: nothing while hidden; while shown, one small frame drawn into each dancer's own small canvas about 12 times
   a second and, with the radio, a 256-point spectrum read 20 times a second. The sheets are held decoded once, as
   bitmaps, in the size the screen can show (-1x or -2x, scripts/build-dance.sh), and given back 20 s after the
   music stops. (Before 2026-11-24 each dancer was a box with its whole sheet as a moving background: Chrome held
   the four full sheets several times over, +350 MB in the tab and +500 MB in the GPU process, for minutes after.)
   RG only (not /rad). */
(function () {
  if (window.MINKA_APP === 'rad') return;
  var V = '20261124dn19', KINDS = ['pufs', 'koro', 'antenas'], MIRROR = [false, false, true];   // three (the user); koro in the middle
  var SHEET = { cols: 16, rows: 24, steps: 12 };
  var FRAME = [186, 160];   // written by scripts/build-dance.sh: one frame as rendered (EBOX and TEETH are in these pixels)
  var EBOX = [16, 11, 152, 145], TEETH = [66, 106, 50, 14];               // written by scripts/build-dance.sh: x, y, w, h in the frame's pixels
  var ART = new URL('kalendars/assets/butnes/', location.href).href;   // whole addresses: the dancers live in the calendar's page
  var LOW = document.documentElement.classList.contains('mk-low-spec');
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SIZE = !LOW && (window.devicePixelRatio || 1) >= 1.5 ? '2x' : '1x';   // which sheets: a dense screen shows more of them
  var row = null, cells = [], ebox = null, frame = 0, raf = 0, last = 0, sync = 0;
  // the sheets, decoded once: the three dancers' and koro's close-up. Loaded when they are first to dance, closed
  // (their memory given back at once) 20 s after they stop
  var art = null, loading = false, freeT = 0;
  function load() {
    clearTimeout(freeT);
    if (art || loading || !window.createImageBitmap || !window.fetch) return;
    loading = true;
    Promise.all(KINDS.concat('koro-e').map(function (name) {
      return fetch(ART + 'dance-' + name + '-' + SIZE + '.webp?v=' + V).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) { return createImageBitmap(b); });
    })).then(function (list) { art = list; loading = false; refresh(); }, function () { loading = false; });
  }
  function free() {
    if (art) art.forEach(function (b) { try { b.close(); } catch (_e) {} });
    art = null;
    cells.forEach(function (c) { c._n = -1; });
    if (ebox) ebox._n = -1;
  }
  function draw(cv, sheet, n, rows) {   // frame n of a sheet into a canvas
    // (willReadFrequently: the canvas is drawn by the processor, so the sheets are never copied to the graphics
    // card whole; a frame this small costs nothing to draw there)
    var ctx = cv._ctx || (cv._ctx = cv.getContext('2d', { willReadFrequently: true })), fw = sheet.width / SHEET.cols, fh = sheet.height / rows;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sheet, (n % SHEET.cols) * fw, Math.floor(n / SHEET.cols) * fh, fw, fh, 0, 0, cv.width, cv.height);
  }
  var minis = function () { return [document.getElementById('rgMini'), document.getElementById('radioMini')].filter(Boolean); };

  // ---- the beat clock ----
  var OFF = [0, 1, 2];   // each dancer's phrase is (phrase + OFF[i]) % 4: three different ones at once; a press changes its own
  var bpm = 116, beat = 0, phrase = 0, close = false, energy = 0, longE = 0, an = null, bins = null, lastRead = 0, pull = 0;
  var onsets = [], lastOnset = 0, flux = 0;
  function radioGraph() {
    // radio.js keeps its graph in script globals (aCtx, masterGain); RG Music's player is another site's frame
    try { return document.getElementById('radioMini') && !document.getElementById('radioMini').hidden && typeof aCtx !== 'undefined' && aCtx && typeof masterGain !== 'undefined' && masterGain ? { ctx: aCtx, out: masterGain } : null; } catch (_e) { return null; }
  }
  function listen(on) {
    var g = on && !LOW && radioGraph();
    if (g && !an) {
      an = g.ctx.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0;
      bins = new Uint8Array(an.frequencyBinCount);
      try { g.out.connect(an); } catch (_e) { an = null; }
    } else if (!g && an) {
      try { an.disconnect(); } catch (_e) {}
      try { radioGraph() && radioGraph().out.disconnect(an); } catch (_e) {}
      an = null;
    }
  }
  function hear(now) {
    if (!an || now - lastRead < 50) return;
    lastRead = now;
    an.getByteFrequencyData(bins);
    var hz = an.context.sampleRate / an.fftSize, b = 0, n = 0;
    for (var i = 1; i * hz < 160; i++) { b += bins[i] * bins[i]; n++; }
    var e = n ? Math.sqrt(b / n) / 255 : 0;
    var rise = Math.max(0, e - energy);
    energy = e;
    longE += (e - longE) * 0.01;
    flux += (rise - flux) * 0.08;
    if (rise > flux * 2.4 + 0.035 && now - lastOnset > 240) {   // a bass hit
      lastOnset = now;
      onsets.push(now);
      while (onsets.length && now - onsets[0] > 10000) onsets.shift();
      // the phase: the hit falls on the nearest beat. Never a step back (it read as a replay): the clock runs a little
      // faster or slower until it is on the beat again
      var err = beat - Math.round(beat);
      if (Math.abs(err) < 0.3) pull = -err * 0.6;
      tempo();
    }
  }
  function tempo() {
    if (onsets.length < 6) return;
    var hist = new Float32Array(81);   // 80 .. 160 a minute
    for (var i = 0; i < onsets.length; i++) for (var j = i + 1; j < onsets.length && j < i + 6; j++) {
      var d = onsets[j] - onsets[i];
      for (var k = 1; k <= 4; k++) {   // the gap may hold one beat or several
        var t = 60000 / (d / k);
        if (t >= 80 && t <= 160) { var x = Math.round(t) - 80; hist[x] += 1; if (x) hist[x - 1] += 0.5; if (x < 80) hist[x + 1] += 0.5; }
      }
    }
    var best = 0;
    for (var m = 1; m < 81; m++) if (hist[m] > hist[best]) best = m;
    if (hist[best] >= 3) bpm += (80 + best - bpm) * 0.15;
  }
  function nextPhrase() {
    // the energy chooses: calm music sways, strong music jumps; never the same phrase twice in a row
    var lvl = longE > 0 ? energy / longE : 1, pick;
    if (!an) pick = [0, 1, 2, 0, 1, 3][Math.floor(beat / 8) % 6];
    else pick = lvl > 1.25 ? 3 : lvl < 0.8 ? 1 : (phrase === 0 ? 2 : 0);
    if (pick === phrase) pick = (pick + 1) % 4;
    phrase = pick;
    close = Math.floor(beat / 8) % 4 === 3;   // every fourth phrase koro comes close to the screen and grins
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    hear(now);
    var before = beat;
    beat += dt * bpm / 60 * (1 + pull);
    pull *= Math.pow(0.2, dt);   // the correction fades within a beat or two
    if (Math.floor(beat / 8) !== Math.floor(before / 8)) nextPhrase();
    if (Math.floor(beat) !== Math.floor(before)) onBeat(Math.floor(beat));
    if (close && Math.floor(beat * 2) !== Math.floor(before * 2) && beat % 8 >= 2 && beat % 8 < 6) glint();   // the grillz flash, twice a beat
    var inPhrase = beat % 8, steps = LOW ? 6 : SHEET.steps;   // a weak computer: every other step
    var f = Math.floor(inPhrase) * SHEET.steps + Math.floor((inPhrase % 1) * steps) * (SHEET.steps / steps);
    if (f !== frame) { frame = f; paint(inPhrase); }
  }

  // ---- the picture ----
  function paint(inPhrase) {
    if (!art || !row) return;
    if (!bowl.isConnected) { soon(); return; }   // the calendar redrew the mood card: back into the new bubble
    var per = 8 * SHEET.steps;
    for (var i = 0; i < cells.length; i++) {
      var grin = close && i === 1, c = cells[i], h = c._h || 1;
      if (c._e !== grin) {   // koro's close-up comes from its own sheet, in a canvas of its own (it may reach past the frame)
        var into = grin && !c._e, back = !grin && c._e;
        if (into) c._eAt = performance.now();
        c._e = grin;
        if (i === 1) {
          // in and out with a short fade over the dancing koro (the close-up's denser fur and finer picture
          // blinked at the switch, the user): it stands in the same pose then, so the fade hides the change
          if (into) { ebox.style.display = 'block'; requestAnimationFrame(function () { ebox.style.opacity = '1'; }); }
          if (back) { c._cv.style.visibility = ''; c._n = -1; ebox.style.opacity = '0'; setTimeout(function () { if (!cells[1]._e) ebox.style.display = 'none'; }, 300); }
        }
      }
      var n = grin ? frame : ((phrase + OFF[i]) % 4) * per + frame;   // each its own phrase, one beat
      if (grin) {
        if (ebox._n !== n) { ebox._n = n; draw(ebox, art[3], n, 6); }
        // the dancing koro stays under the close-up's first frames (they are its pose) until those are surely drawn
        if (c._cv.style.visibility !== 'hidden' && performance.now() - c._eAt > 250) c._cv.style.visibility = 'hidden';
      } else if (c._n !== n) { c._n = n; draw(c._cv, art[i], n, SHEET.rows); }
      // koro's close-up: it hops up to the camera, a hop a beat, two beats (the frames: a nearing camera, a wider
      // lens, a lean in; the page: a step bigger with each hop, in the air), stays for four, hops back over two
      var t = inPhrase || 0, g = 0, up = 0;
      if (grin && (t < 2 || t >= 6)) {
        var k = Math.floor(t < 2 ? t : t - 6), u = Math.max(0, Math.min(1, ((t % 1) - 0.08) / 0.6));   // in the air from .08 to .68 of the beat
        g = (k + ease(u)) / 2; if (t >= 6) g = 1 - g;
        up = Math.sin(Math.PI * u) * 0.12;   // the hop: up a little, of its own height
      } else if (grin) g = 1;
      // (near the camera its face is low in the frames: it rises with each hop, so the grin is well above the screen's edge)
      c.style.transform = (MIRROR[i] && !grin ? 'scaleX(-1) ' : '') + (up || g ? 'translateY(' + (-(up + 0.2 * g) * h).toFixed(1) + 'px) ' : '') + (g ? 'scale(' + (1 + 0.6 * g).toFixed(3) + ')' : '');
      c.style.zIndex = grin ? '3' : i === 1 ? '2' : '1';   // koro in front of the other two
    }
  }
  /* A press on a dancer (the user: "like the side card's creature, a sponge"): it squashes as that one does (the
     same keyframes, on the `scale` property so it adds to the per-frame transform), squeaks, gets up, and dances a
     phrase none of the others is dancing. The beat stays the group's. */
  function press(i, own) {
    var c = cells[i];
    if (c.animate) c.animate([{ scale: '1 1' }, { scale: '1.16 .8', offset: .3 }, { scale: '.94 1.08', offset: .6 }, { scale: '1 1' }],
      { duration: 550, easing: 'cubic-bezier(.3, 1.5, .5, 1)' });
    if (!own) squish();   // the sound only for a press: the dance's own squashes keep quiet under the music
    setTimeout(function () {
      if (close && i === 1) return;   // koro, mid close-up, keeps its grin
      var now = (phrase + OFF[i]) % 4, taken = {};
      OFF.forEach(function (o, j) { if (j !== i) taken[(phrase + o) % 4] = 1; });
      var free = [0, 1, 2, 3].filter(function (p) { return p !== now && !taken[p]; });
      if (free.length) OFF[i] = (free[Math.floor(Math.random() * free.length)] - phrase + 4) % 4;
    }, own ? 170 : 320);   // its own: the new phrase from the squash's deepest point, which hides the change
  }
  // the side card's squeak (mk-side-faces.js): a squeeze toy's short chirp, made on the press, the sound card asleep after
  var sq = null, sqT = 0;
  function squish() {
    try {
      sq = sq || new (window.AudioContext || window.webkitAudioContext)();
      if (sq.state === 'suspended') sq.resume();
      var t = sq.currentTime + .005, o = sq.createOscillator(), g = sq.createGain(), f = sq.createBiquadFilter(), k = .94 + Math.random() * .12;
      o.type = 'triangle'; f.type = 'lowpass'; f.frequency.value = 2600;
      o.frequency.setValueAtTime(420 * k, t); o.frequency.exponentialRampToValueAtTime(980 * k, t + .045); o.frequency.exponentialRampToValueAtTime(560 * k, t + .12);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .005); g.gain.exponentialRampToValueAtTime(.001, t + .14);
      o.connect(f); f.connect(g); g.connect(sq.destination); o.start(t); o.stop(t + .16);
      clearTimeout(sqT); sqT = setTimeout(function () { if (sq) sq.suspend(); }, 20000);
    } catch (_e) {}
  }
  /* The dance's own sponge moments (the user: "they squash by themselves too, in rhythm; sometimes all three"): on
     the first beat of every fourth phrase all three at once (not while koro is close), and in every other phrase one
     of them, chosen by chance, on its fifth beat. Each gets up dancing a phrase the others are not. */
  function onBeat(b) {
    var ph = Math.floor(b / 8), inP = b % 8;
    if (inP === 0 && ph % 4 === 1) { press(0, 1); press(2, 1); setTimeout(function () { press(1, 1); }, 30); }
    else if (inP === 4 && ph % 2 === 0 && !close) press(Math.floor(Math.random() * cells.length), 1);
  }
  function ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  /* The meme's bling: a small white four-point star flashes on the grillz (it grows, turns, is gone), placed in
     koro's own box so it grows with the close-up; a sharp shape, no blur, gone in under half a second. */
  var STAR = 'polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)';
  function glint() {
    var c = cells[1];
    if (!c || !c.animate || !TEETH[2]) return;
    var s = (c._h || 1) / FRAME[1], z = (8 + Math.random() * 5) * s, g = c.ownerDocument.createElement('b');
    g.style.cssText = 'position:absolute;pointer-events:none;background:#fff;clip-path:' + STAR + ';width:' + z.toFixed(1) + 'px;height:' + z.toFixed(1) + 'px;'
      + 'left:' + ((TEETH[0] + Math.random() * TEETH[2]) * s - z / 2).toFixed(1) + 'px;top:' + ((TEETH[1] + Math.random() * TEETH[3] * 0.8) * s - z / 2).toFixed(1) + 'px';
    c.appendChild(g);
    g.animate([{ transform: 'scale(0) rotate(0deg)' }, { transform: 'scale(1) rotate(25deg)', offset: .3 }, { transform: 'scale(0) rotate(70deg)' }],
      { duration: 420, easing: 'ease-out' }).onfinish = function () { g.remove(); };
  }
  /* Where they dance (the user): inside the mood's big glass bubble (Noskaņa, in the calendar's page), while the
     music plays minimized; the mood's face and its jar of drinks step aside, and come back when the music stops.
     A round box of their own under the glass, as the jar is (mood-feedback.js jarCanvas): the glass is over them,
     its rim clips them (koro's close-up presses against it). No bubble on show (another centre, a layout without
     the mood, the phone): no dancers. */
  var bowl = null, wrapNow = null;
  var CSS = '.rg-mood-blob-wrap > .mk-bowl{position:absolute;left:50%;top:48.5%;z-index:5;transform:translate(-50%,-50%);border-radius:50%;overflow:hidden;pointer-events:none;opacity:0;transition:opacity .35s ease-out}'
    + '.rg-mood-blob-wrap.mk-dancing > .mk-bowl{opacity:1}.rg-mood-blob-wrap.mk-dancing > .mk-bowl > div > i{pointer-events:auto}'
    + '.rg-mood-blob-wrap > .rg-mood-fluent-face,.rg-mood-blob-wrap > .mx-jar{transition:opacity .35s ease-out}'
    + '.rg-mood-blob-wrap.mk-dancing > .rg-mood-fluent-face,.rg-mood-blob-wrap.mk-dancing > .mx-jar{opacity:0}'
    // the bubble's liquid in the playing album's colour (the user), the player's own accent (it has no violet)
    + '.rg-mood-blob-wrap.mk-dancing .rg-mood-liquid--fatigue{--rg-fatigue-liquid-rgb:var(--mb-album-rgb,45,212,191)!important}';

  function make() {
    bowl = document.createElement('div');
    bowl.className = 'mk-bowl';
    bowl.setAttribute('aria-hidden', 'true');
    row = document.createElement('div');
    row.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    bowl.appendChild(row);
    KINDS.forEach(function (k, i) {
      var c = document.createElement('i'), cv = document.createElement('canvas');
      c.style.cssText = 'display:block;position:absolute;transform-origin:50% 100%;cursor:pointer';
      cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
      c.appendChild(cv);
      c._cv = cv; c._n = -1;
      c.addEventListener('pointerdown', function (e) { e.stopPropagation(); press(i); });
      c.addEventListener('click', function (e) { e.stopPropagation(); });   // the mood card's own taps are not for them
      row.appendChild(c);
      cells.push(c);
    });
    ebox = document.createElement('canvas');   // koro's close-up frames (their own sheet), over its cell
    ebox.style.cssText = 'position:absolute;display:none;opacity:0;transition:opacity .25s ease;pointer-events:none';
    ebox._n = -1;
    cells[1].appendChild(ebox);
  }
  function calDoc() {
    var cal = document.getElementById('calIframe');
    try { return cal && cal.contentDocument && cal.contentDocument.documentElement ? cal.contentDocument : null; } catch (_e) { return null; }
  }
  // the bubble, if it is on show: Noskaņa X, the mood in this layout, no other centre over it, a lens with a size
  function bubble() {
    var d = calDoc(), h = d && d.documentElement;
    if (!h || !h.classList.contains('mk-mx') || h.classList.contains('mk-cl-nomood') || h.classList.contains('mk-cl-center-on')) return null;
    var lens = d.querySelector('.rg-feedback-card .rg-mood-glass-lens');
    return lens && lens.offsetWidth ? lens : null;
  }
  var hooked = null;
  function hook(d) {   // the calendar's own signals that the bubble moved, was covered or redrawn
    if (hooked === d) return;
    hooked = d;
    if (!d.getElementById('mk-bowl-css')) { var st = d.createElement('style'); st.id = 'mk-bowl-css'; st.textContent = CSS; d.head.appendChild(st); }
    var w = d.defaultView;
    ['mk-card-layout', 'daySelected', 'resize'].forEach(function (ev) { w.addEventListener(ev, soon); });
    d.addEventListener('mk-mood-covered', soon);
  }
  // in the bubble: a round box inside the glass (0.86 of the lens, as its clear part), the three standing on its
  // floor, close together; the outer two partly behind the rim, as in a fishbowl
  function place() {
    var lens = bubble();
    if (!lens) return false;
    hook(lens.ownerDocument);
    var wrap = lens.parentNode;
    if (bowl.parentNode !== wrap) {
      if (wrapNow && wrapNow !== wrap) wrapNow.classList.remove('mk-dancing');
      wrap.insertBefore(lens.ownerDocument.adoptNode(bowl), lens);
      wrapNow = wrap;
      cells.forEach(function (c) { c._n = -1; });   // drawn again
    }
    // koro in the middle and in front; the other two a little smaller, a quarter of the bowl out to either
    // side and a little higher (further back), well inside the glass (the user: they were half behind the rim)
    var D = Math.round(lens.offsetWidth * 0.8), ar = FRAME[0] / FRAME[1], dpr = Math.min(2, window.devicePixelRatio || 1);   // the glass's clear inside, inside its rim
    bowl.style.width = bowl.style.height = D + 'px';
    var fit = function (cv, w, h) {   // a canvas with as many pixels as the screen shows of it
      var bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));
      if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; return true; }
    };
    cells.forEach(function (c, i) {
      var front = i === 1, h = D * (front ? 0.54 : 0.45), w = h * ar, cx = D / 2 + (i - 1) * D * 0.25;
      c._h = h;
      c.style.width = w.toFixed(1) + 'px';
      c.style.height = h.toFixed(1) + 'px';
      c.style.left = (cx - w / 2).toFixed(1) + 'px';
      c.style.bottom = (D * (front ? 0.11 : 0.16)).toFixed(1) + 'px';
      if (fit(c._cv, w, h)) c._n = -1;
      if (front) {   // koro's close-up: its own box in the frame, with pixels for the 1.6 times it grows to
        var s = h / FRAME[1];
        ebox.style.left = (EBOX[0] * s).toFixed(1) + 'px'; ebox.style.top = (EBOX[1] * s).toFixed(1) + 'px';
        ebox.style.width = (EBOX[2] * s).toFixed(1) + 'px'; ebox.style.height = (EBOX[3] * s).toFixed(1) + 'px';
        if (fit(ebox, EBOX[2] * s * 1.6, EBOX[3] * s * 1.6)) ebox._n = -1;
      }
    });
    return true;
  }

  // ---- when ----
  function playing() {
    // not hidden and playing; not "drawn yet" too: just minimised, the player is not laid out in that moment and
    // nothing told the dancers again until a pause and a play (the user)
    return minis().some(function (m) { return !m.hidden && m.classList.contains('rgm-playing'); });
  }
  var waitT = 0;
  function refresh() {
    sync = 0;
    var music = playing(), lens = music && bubble();
    // the music may start before the calendar has drawn the mood card (a reload with the radio on, a minimised
    // player): look again in a moment, until the bubble is there or the music stops (one query each time)
    clearTimeout(waitT);
    if (music && !lens) waitT = setTimeout(soon, 1500);
    var on = !!lens && !REDUCE;   // (reduced motion: the mood stays as it is)
    if (on && !row) make();
    if (!row) return;
    if (on) load();                                         // (the face stays until the sheets are in)
    on = on && !!art && place();
    if (!on && art) { clearTimeout(freeT); freeT = setTimeout(free, 20000); }
    listen(on);
    if (on && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (on) paint(beat % 8);
    if (wrapNow) wrapNow.classList.toggle('mk-dancing', on);   // the face and the jar step aside, or come back
    if (wrapNow && on) {   // the album's colour for the liquid: the playing player's accent, as r, g, b
      var m = minis().filter(function (x) { return !x.hidden && x.classList.contains('rgm-playing'); })[0];
      var rgb = m && toRgb(getComputedStyle(m).getPropertyValue('--rgm-acc'));
      if (rgb) wrapNow.style.setProperty('--mb-album-rgb', rgb); else wrapNow.style.removeProperty('--mb-album-rgb');
    }
  }
  function toRgb(c) {   // '#abc', '#aabbcc' or 'rgb(a)(r, g, b…)' to 'r, g, b'
    c = String(c || '').trim();
    var h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (h) { var x = h[1].length === 3 ? h[1].replace(/./g, '$&$&') : h[1]; return [0, 2, 4].map(function (i) { return parseInt(x.substr(i, 2), 16); }).join(', '); }
    var n = c.match(/[\d.]+/g);
    return /^rgba?\(/.test(c) && n && n.length >= 3 ? n.slice(0, 3).map(Math.round).join(', ') : '';
  }
  function soon() { if (!sync) sync = requestAnimationFrame(refresh); }

  minis().forEach(function (m) { new MutationObserver(soon).observe(m, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] }); });
  addEventListener('resize', soon);
  var calf = document.getElementById('calIframe');
  if (calf) calf.addEventListener('load', function () { hooked = null; soon(); });   // a new calendar page: hook it again
  refresh();
})();
