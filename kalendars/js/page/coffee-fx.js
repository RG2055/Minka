/* Coffee charm (calendar.js showCoffeePicker / flyCoffeeToCurve), sliced like Fruit Ninja: a blade
   streaks across the drink, it falls apart in two halves under gravity, its own juice splashes out
   and leaves a stain that fades. On top of that every drink throws out something of its own: coffee
   beans, the vending machine's coins, Monster's claw, Red Bull's wings, Brite's lemon and lime,
   Dynamit's lightning, Kong Strong's gorilla. Picking a drink in the menu slices its icon (it pops
   back); saving slices the drink where it lands, bigger, with its own line in big type, and on the
   person's own card the drink is scanned as on an X-ray table and poured in (pour, aura).
   Web Animations only: nothing loops, every node removes itself, nothing at all with reduced motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var Z = 2147483001;   // over the menu and the flying drink

  function node(x, y, w, h, html, css) {
    var el = document.createElement('div');
    el.className = 'mk-cfx';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:' + (x - w / 2).toFixed(1) + 'px;top:' + (y - h / 2).toFixed(1) + 'px;width:' + w + 'px;height:' + h
      + 'px;z-index:' + Z + ';pointer-events:none;' + (css || '');
    if (html) el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  }
  function run(el, frames, opt) {
    var o = { duration: 700, easing: 'linear', fill: 'both' };
    for (var k in opt) o[k] = opt[k];
    var a = el.animate(frames, o);
    a.onfinish = a.oncancel = function () { el.remove(); };
    return a;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function svg(box, body) { return '<svg viewBox="' + box + '" width="100%" height="100%" style="display:block;overflow:visible">' + body + '</svg>'; }

  /* ── the slice itself ───────────────────────────────────────────────────── */
  // the blade: a lens-shaped streak with a glow, drawn across in a blink, then gone
  function blade(c, len, deg) {
    var el = node(c.x, c.y, len, 14, '<svg viewBox="0 0 100 14" width="' + len + '" height="14" preserveAspectRatio="none"><path d="M0 7Q50 0 100 7Q50 14 0 7Z" fill="#fff"/></svg>',
      'filter:drop-shadow(0 0 5px rgba(255,255,255,.9)) drop-shadow(0 0 10px rgba(180,220,255,.6));transform-origin:0 50%;');
    run(el, [
      { transform: 'rotate(' + deg + 'deg) scaleX(0)', opacity: 1 },
      { transform: 'rotate(' + deg + 'deg) scaleX(1)', opacity: 1, offset: .35 },
      { transform: 'rotate(' + deg + 'deg) scaleX(1) scaleY(.2)', opacity: 0 }
    ], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }
  // Monster's cut: three claw marks along the cut instead of a blade
  function claws(c, color, size, deg) {
    var el = node(c.x, c.y, size, size, svg('0 0 40 40', '<g fill="none" stroke="' + color + '" stroke-width="3.4" stroke-linecap="round"><path d="M9 4q7 15 2 32"/><path d="M19 2q7 16 2 35"/><path d="M29 4q7 15 2 32"/></g>'),
      'filter:drop-shadow(0 0 4px ' + color + ');transform:rotate(' + (deg + 90) + 'deg);');
    [].forEach.call(el.querySelectorAll('path'), function (p, i) {
      p.style.strokeDasharray = '42'; p.style.strokeDashoffset = '42';
      p.animate([{ strokeDashoffset: 42 }, { strokeDashoffset: 0 }], { duration: 170, delay: i * 55, fill: 'forwards', easing: 'ease-in' });
    });
    run(el, [{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 720 });
  }
  // the two halves: the drink drawn twice, clipped along the cut, flying apart and falling
  function halves(c, html, w, h, deg, power) {
    var k = Math.max(-40, Math.min(40, Math.tan(deg * Math.PI / 180) * 50 * w / h));   // the cut's slope in % of the height
    var cuts = [
      'polygon(0 0,100% 0,100% ' + (50 + k) + '%,0 ' + (50 - k) + '%)',
      'polygon(0 ' + (50 - k) + '%,100% ' + (50 + k) + '%,100% 100%,0 100%)'
    ];
    [-1, 1].forEach(function (side, i) {
      var el = node(c.x, c.y, w, h, html, 'clip-path:' + cuts[i] + ';');
      var pic = el.querySelector('svg'); if (pic) { pic.setAttribute('width', w); pic.setAttribute('height', h); pic.style.display = 'block'; }
      var dx = side * rnd(14, 22) * power, up = rnd(10, 18) * power, fall = rnd(60, 90) * power, spin = side * rnd(28, 55);
      run(el, [
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + (dx * .35).toFixed(1) + 'px,' + (side < 0 ? -up : -up * .4).toFixed(1) + 'px) rotate(' + (spin * .3).toFixed(1) + 'deg)', opacity: 1, offset: .25 },
        { transform: 'translate(' + (dx * .75).toFixed(1) + 'px,' + (fall * .35).toFixed(1) + 'px) rotate(' + (spin * .7).toFixed(1) + 'deg)', opacity: 1, offset: .6 },
        { transform: 'translate(' + dx.toFixed(1) + 'px,' + fall.toFixed(1) + 'px) rotate(' + spin.toFixed(1) + 'deg)', opacity: 0 }
      ], { duration: 780, easing: 'cubic-bezier(.3,0,.7,1)' });
    });
  }
  // juice: round drops thrown out across the cut, arcing down under gravity
  function juice(c, colors, n, power, deg) {
    var nrm = (deg - 90) * Math.PI / 180;   // across the cut
    for (var i = 0; i < n; i++) {
      var side = i % 2 ? 1 : -1, ang = nrm + (side < 0 ? Math.PI : 0) + rnd(-.9, .9);
      var d = rnd(20, 46) * power, s = Math.round(rnd(3, 8) * (power > 1 ? 1.2 : 1));
      var x = Math.cos(ang) * d, y = Math.sin(ang) * d;
      var el = node(c.x, c.y, s, s, '', 'border-radius:50%;background:' + colors[i % colors.length] + ';');
      run(el, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (x * .6).toFixed(1) + 'px,' + (y * .6 - 6 * power).toFixed(1) + 'px) scale(1)', opacity: 1, offset: .35 },
        { transform: 'translate(' + x.toFixed(1) + 'px,' + (y + 34 * power).toFixed(1) + 'px) scale(.5)', opacity: 0 }
      ], { duration: rnd(560, 820), easing: 'cubic-bezier(.25,.6,.6,1)' });
    }
  }
  // the stain the juice leaves: a blot with a few drops around it, fading away
  function stain(c, color, size) {
    var blobs = '<i style="position:absolute;inset:18%;border-radius:46% 54% 50% 50%;background:' + color + '"></i>';
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2 + rnd(-.4, .4), r = rnd(.3, .46), s = rnd(.08, .16);
      blobs += '<i style="position:absolute;left:' + ((.5 + Math.cos(a) * r - s / 2) * 100).toFixed(1) + '%;top:' + ((.5 + Math.sin(a) * r - s / 2) * 100).toFixed(1)
        + '%;width:' + (s * 100).toFixed(1) + '%;height:' + (s * 100).toFixed(1) + '%;border-radius:50%;background:' + color + '"></i>';
    }
    var el = node(c.x, c.y, size, size, blobs, 'opacity:.5;');
    run(el, [{ transform: 'scale(.4) rotate(' + rnd(-30, 30).toFixed(0) + 'deg)', opacity: .65 }, { transform: 'scale(1)', opacity: .55, offset: .12 }, { transform: 'scale(1.04)', opacity: .4, offset: .55 }, { transform: 'scale(1.06)', opacity: 0 }],
      { duration: 1300, easing: 'ease-out' });
  }

  /* ── what each drink throws out ─────────────────────────────────────────── */
  // pieces thrown up and out of the cut, spinning, then falling: [html, width, height, css]
  function toss(c, pieces, n, power, opt) {
    opt = opt || {};
    for (var i = 0; i < n; i++) {
      var p = pieces[i % pieces.length], s = (opt.scale || 1) * rnd(.85, 1.2);
      var ang = rnd(-Math.PI * .9, -Math.PI * .1), d = rnd(26, 54) * power;
      var x = Math.cos(ang) * d, y = Math.sin(ang) * d, spin = rnd(180, 520) * (Math.random() < .5 ? -1 : 1);
      var el = node(c.x, c.y, Math.round(p[1] * s), Math.round(p[2] * s), p[0], p[3] || '');
      run(el, [
        { transform: 'translate(0,0) rotate(0) scale(.3)', opacity: 0 },
        { transform: 'translate(' + (x * .7).toFixed(1) + 'px,' + (y * .9).toFixed(1) + 'px) rotate(' + (spin * .45).toFixed(0) + 'deg) scale(1)', opacity: 1, offset: .32 },
        { transform: 'translate(' + (x * .95).toFixed(1) + 'px,' + (y * .7).toFixed(1) + 'px) rotate(' + (spin * .7).toFixed(0) + 'deg) scale(1)', opacity: 1, offset: .6 },
        { transform: 'translate(' + (x * 1.15).toFixed(1) + 'px,' + (y * .1 + 46 * power).toFixed(1) + 'px) rotate(' + spin.toFixed(0) + 'deg) scale(.8)', opacity: 0 }
      ], { duration: rnd(820, 1100), delay: (opt.delay || 0) + i * (opt.stagger || 18), easing: 'cubic-bezier(.3,.5,.6,1)' });
    }
  }
  var BEAN = [svg('0 0 12 16', '<ellipse cx="6" cy="8" rx="5" ry="7" fill="#6b3f1d"/><path d="M6.6 1.6q-3.4 6.4 0 12.8" stroke="#2f1a0c" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="4" cy="5.5" rx="1.2" ry="2.2" fill="#8a5a2c"/>'), 9, 12];
  var COIN = [svg('0 0 14 14', '<circle cx="7" cy="7" r="6.2" fill="#f5c542" stroke="#a9780c" stroke-width="1.4"/><circle cx="7" cy="7" r="3.4" fill="none" stroke="#a9780c" stroke-width="1.1"/><circle cx="5" cy="4.8" r="1.1" fill="#fff3b8"/>'), 12, 12];
  function wheel(rind, pulp) {
    return [svg('0 0 16 16', '<circle cx="8" cy="8" r="7.6" fill="' + rind + '"/><circle cx="8" cy="8" r="6" fill="' + pulp + '"/><path d="M8 2.6v10.8M2.6 8h10.8M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" stroke="' + rind
      + '" stroke-opacity=".55" stroke-width=".9"/><circle cx="8" cy="8" r="1" fill="' + rind + '"/>'), 15, 15];
  }
  var LEMON = wheel('#f2c918', '#fff2a0'), LIME = wheel('#6dbb2c', '#d9f29a');
  var BOLT = [svg('0 0 24 24', '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#ffe14a" stroke="#141518" stroke-width="1.6" stroke-linejoin="round"/>'), 18, 18];
  var HEART = [svg('0 0 8 7', '<path d="M1 0h2v1h2V0h2v1h1v2H7v1H6v1H5v1H3V5H2V4H1V3H0V1h1Z" fill="#ff6f9c" shape-rendering="crispEdges"/>'), 14, 12];
  var STAR = [svg('0 0 12 12', '<path d="M6 0l1.5 4.5L12 6 7.5 7.5 6 12 4.5 7.5 0 6l4.5-1.5Z" fill="#e6f4ff"/>'), 11, 11];
  function chip(color) { return ['', 7, 4, 'background:' + color + ';border-radius:1px;']; }
  var N_CONFETTI = ['#1b2a6b', '#3fae49', '#f6c21c', '#f08a24', '#ffffff'].map(chip);   // Narvesen's "N": navy, green, yellow, orange

  function flash(c, color, size) {
    run(node(c.x, c.y, size, size, '', 'border-radius:50%;background:radial-gradient(closest-side,' + color + ',transparent);'),
      [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 420, easing: 'ease-out' });
  }
  function rings(c, color, count, size) {
    for (var i = 0; i < count; i++) {
      run(node(c.x, c.y, size, size, '', 'border-radius:50%;border:3px solid ' + color + ';box-sizing:border-box;'),
        [{ transform: 'scale(.3)', opacity: .9 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 560, delay: 380 + i * 300, easing: 'ease-out' });
    }
  }
  // Red Bull's wings: unfold at the cut, beat twice and carry on upward
  var WING = svg('0 0 26 16', '<path d="M1 13C5 4 14 1 25 1c-3 2-4 3-7 4 2 0 4 0 6 1-3 2-6 2-9 3 2 1 3 1 5 1-4 2-10 4-19 3Z" fill="#fff" stroke="#8a93a6" stroke-width="1"/>');
  function wings(c, big) {
    var w = big ? 50 : 34, h = big ? 31 : 21, lift = big ? 46 : 26;
    [-1, 1].forEach(function (side) {
      // the drawing is a right wing with its root at the left: the left one is mirrored in place,
      // and each turns about its root at the can
      var el = node(c.x + side * (w * .5 + 3), c.y - 4, w, h, WING, 'transform-origin:' + (side < 0 ? '100%' : '0%') + ' 85%;');
      if (side < 0) el.firstChild.style.transform = 'scaleX(-1)';
      var f = function (rot, up, o, off, s) {
        var k = { transform: 'translateY(-' + up + 'px) rotate(' + side * rot + 'deg) scale(' + (s || 1) + ')', opacity: o };
        if (off != null) k.offset = off;
        return k;
      };
      run(el, [f(0, 0, 0, null, .1), f(-26, lift * .15, 1, .16), f(16, lift * .4, 1, .36), f(-26, lift * .6, 1, .56), f(16, lift * .85, 1, .78), f(-10, lift, 0)],
        { duration: 1150, delay: 90, easing: 'ease-in-out' });
    });
  }
  // Kong Strong's gorilla, out of the cut can, beating its chest
  function gorilla(c, big) {
    var size = big ? 48 : 32, rise = big ? 34 : 24;
    var el = node(c.x, c.y, size, size, '🦍', 'font-size:' + Math.round(size * .9) + 'px;line-height:' + size + 'px;text-align:center;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));');
    var at = function (s, o, off) { var k = { transform: 'translateY(-' + rise + 'px) scale(' + s + ')' }; if (o != null) k.opacity = o; if (off != null) k.offset = off; return k; };
    run(el, [
      { transform: 'translateY(0) scale(.2)', opacity: 0 },
      at(1.25, 1, .2), at(1, null, .3), at(1.16, null, .42), at(1, null, .54), at(1.16, null, .66), at(1, 1, .82),
      { transform: 'translateY(-' + (rise + 10) + 'px) scale(.9)', opacity: 0 }
    ], { duration: 1500, delay: 120, easing: 'ease-out' });
    rings({ x: c.x, y: c.y - rise }, '#6aa0ff', 2, size * 1.5);
  }
  // the drink's line, in big type with a dark edge, like a combo
  function line(c, text, color) {
    var el = node(c.x, c.y - 52, 240, 34, '<span style="font:900 22px/34px Inter,system-ui,sans-serif;color:' + color
      + ';letter-spacing:.01em;-webkit-text-stroke:5px #1a120c;paint-order:stroke fill;white-space:nowrap">' + text + '</span>', 'text-align:center;');
    run(el, [{ transform: 'scale(.3) rotate(-8deg)', opacity: 0 }, { transform: 'scale(1.18) rotate(-4deg)', opacity: 1, offset: .14 }, { transform: 'scale(1) rotate(-4deg)', offset: .24 }, { transform: 'translateY(-6px) scale(1) rotate(-4deg)', opacity: 1, offset: .75 }, { transform: 'translateY(-18px) scale(.95) rotate(-4deg)', opacity: 0 }],
      { duration: 1500, delay: 140, easing: 'ease-out' });
  }

  var COFFEE = ['#5a3216', '#7a4a22', '#c89a5c'];
  /* each drink: its juice, its stain, its line, and what it throws out (c: where, big: on saving) */
  var FX = {
    philips: { juice: COFFEE, stain: '#5a3216', line: ['Bez maksas!', '#f3c58e'],
      extra: function (c, big) { toss(c, [BEAN], big ? 9 : 6, big ? 1.4 : 1); } },
    lofbergs: { juice: COFFEE.concat('#9b6ad1'), stain: '#4a2a14', line: ['Löfbergs!', '#d6b4f5'],   // the vending machine pays out
      extra: function (c, big) { toss(c, [COIN, COIN, BEAN], big ? 9 : 6, big ? 1.4 : 1); } },
    narvesen: { juice: COFFEE.concat('#f08a24'), stain: '#5a3216', line: ['Paķerts pa ceļam!', '#ffc48a'],
      extra: function (c, big) { toss(c, N_CONFETTI, big ? 14 : 9, big ? 1.4 : 1); toss(c, [BEAN], big ? 4 : 2, big ? 1.3 : 1); } },
    monster: { juice: ['#7bdc3a', '#b6f57a', '#3fa51c'], stain: '#5fc42a', line: ['Zvērs ir vaļā!', '#8ff04a'], claw: '#8ff04a' },
    monsterultra: { juice: ['#ffffff', '#dfeaf5', '#b9c6d2'], stain: '#dfeaf5', line: ['Ultra!', '#f2f6fa'], claw: '#f2f6fa',
      extra: function (c, big) { toss(c, [STAR], big ? 9 : 6, big ? 1.4 : 1); } },
    redbull: { juice: ['#f2c94c', '#ffe9a0', '#d61f26', '#3c5bd8'], stain: '#e6b93a', line: ['Spārni klāt!', '#ffd94a'],
      extra: function (c, big) { wings(c, big); } },
    brite: { juice: ['#b5e655', '#f6e04b', '#e9f9c8'], stain: '#a8dc48', line: ['Fokuss!', '#c4f07a'],
      extra: function (c, big) { toss(c, [LEMON, LIME], big ? 7 : 5, big ? 1.4 : 1, { scale: big ? 1.3 : 1 }); } },
    dynamit: { juice: ['#ffe14a', '#ff9a1f', '#fff3a0'], stain: '#f5c623', line: ['BUM!', '#ffe14a'], power: 1.5,   // it goes off
      extra: function (c, big) { flash(c, 'rgba(255,225,74,.9)', big ? 130 : 84); toss(c, [BOLT], big ? 7 : 5, big ? 1.6 : 1.15, { scale: big ? 1.4 : 1 }); } },
    kongstrong: { juice: ['#4f8dff', '#9fc0ff', '#1f4fa3'], stain: '#3f7ae6', line: ['Gorillas spēks!', '#8fb6ff'],
      extra: function (c, big) { gorilla(c, big); } },
    cupcoffee: { juice: COFFEE, stain: '#5a3216', line: ['Kafija!', '#f3c58e'],
      extra: function (c, big) { toss(c, [BEAN], big ? 8 : 5, big ? 1.4 : 1); } },
    mycoffee: { juice: COFFEE.concat('#2f6fe0'), stain: '#5a3216', line: ['Savā krūzē!', '#9cc2ff'],
      extra: function (c, big) { toss(c, [HEART, HEART, BEAN], big ? 8 : 5, big ? 1.4 : 1); } }
  };

  /* ── the drink's mark on the person's card, while its caffeine is in the body ─── */
  var CLAW = function (color) { return svg('0 0 40 40', '<g fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round"><path d="M9 4q7 15 2 32"/><path d="M19 2q7 16 2 35"/><path d="M29 4q7 15 2 32"/></g>'); };
  var MARK = {
    philips: BEAN[0], cupcoffee: BEAN[0], narvesen: BEAN[0], lofbergs: COIN[0], mycoffee: HEART[0],
    monster: CLAW('#8ff04a'), monsterultra: CLAW('#f2f6fa'), brite: LEMON[0], dynamit: BOLT[0], kongstrong: '🦍'
  };
  var GOLD_CAN = svg('0 0 12 18', '<rect x="2" y="1" width="8" height="1.5" rx=".7" fill="#b5810f"/><rect x="1" y="2.5" width="10" height="14.5" rx="1.6" fill="#ffd24a" stroke="#a9780c" stroke-width="1"/><rect x="2.6" y="4.5" width="1.6" height="10" rx=".8" fill="#fff6c9"/>');
  // where the liquid stands for this much caffeine: 80 mg about a seventh of the card, 400 mg half of it
  function level(mg) { return Math.max(6, Math.min(50, 6 + (Number(mg) || 0) / 400 * 44)); }
  var STILL = (function () {   // the liquid's still surface: a low wave along its top edge
    var pts = ['0 100%'];
    for (var i = 0; i <= 12; i++) pts.push((i / 12 * 100).toFixed(1) + '% ' + (Math.sin(i * 1.3) * 2.2 + 3).toFixed(1) + 'px');
    return 'polygon(' + pts.concat('100% 100%').join(',') + ')';
  })();
  // The card as a cup: the drink stands in it as high as there is caffeine in the body (mg), with the
  // drink's mark above; a golden can adds a gold edge. Drawn still, redrawn when the level changes.
  function aura(card, source, gold, mg) {
    if (!card) return;
    var el = card.querySelector('.mk-cfx-aura'), fx = FX[source], h = fx ? Math.round(level(mg)) : 0, key = (fx ? source + ':' + h : '') + (gold ? '|g' : '');
    if (!key) { if (el) el.remove(); return; }
    if (el && el.dataset.k === key) return;
    if (!el) { el = document.createElement('div'); el.className = 'mk-cfx-aura'; el.setAttribute('aria-hidden', 'true'); card.appendChild(el); }
    el.dataset.k = key;
    el.style.cssText = 'position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:6;'
      + (gold ? 'box-shadow:inset 0 0 0 2px #ffd24a,inset 0 0 16px #ffd24a66;' : '');
    // the marks stand in from the corners: the cards' corners are round and cut off what is in them
    var shade = 'filter:drop-shadow(0 1px 0 rgba(0,0,0,.6)) drop-shadow(0 2px 3px rgba(0,0,0,.55));', html = '';
    if (fx) html += '<i style="position:absolute;left:0;right:0;bottom:0;height:' + h + '%;background:' + fx.line[1] + ';opacity:.3;clip-path:' + STILL + '"></i>';
    if (source === 'redbull') {   // the card itself gets the wings
      html += '<span class="mk-cfx-mark" style="position:absolute;top:6px;left:20px;width:30px;height:19px;transform:scaleX(-1);' + shade + '">' + WING + '</span>'
        + '<span class="mk-cfx-mark" style="position:absolute;top:6px;right:20px;width:30px;height:19px;' + shade + '">' + WING + '</span>';
    } else if (fx) {
      html += '<span class="mk-cfx-mark" style="position:absolute;top:6px;right:22px;width:24px;height:24px;font-size:21px;line-height:24px;text-align:center;' + shade + '">' + MARK[source] + '</span>';
    }
    if (gold) html += '<span class="mk-cfx-mark" style="position:absolute;top:6px;left:' + (source === 'redbull' ? 54 : 22) + 'px;width:14px;height:21px;' + shade + '" title="Zelta bundža">' + GOLD_CAN + '</span>';
    el.innerHTML = html;
  }
  function thump(card) {
    [].forEach.call(card.querySelectorAll('.mk-cfx-mark'), function (m, i) {
      var flip = m.style.transform.indexOf('scaleX(-1)') >= 0 ? 'scaleX(-1) ' : '';
      m.animate([{ transform: flip + 'scale(1)' }, { transform: flip + 'scale(1.25) rotate(-8deg)', offset: .25 }, { transform: flip + 'scale(1)', offset: .5 }, { transform: flip + 'scale(1.2) rotate(6deg)', offset: .75 }, { transform: flip + 'scale(1)' }],
        { duration: 700, delay: i * 60, easing: 'ease-in-out' });
    });
  }
  /* A coffee was saved, on the person's own card: first it is scanned like on an X-ray table (a bright
     line passes down and the band behind it shows the card as its own negative, the drink inside it),
     then the drink pours in, fills the card, and sinks to the level its caffeine stands at (aura). */
  function pour(card, source, mg) {
    var fx = FX[source];
    if (!fx || !card || !card.isConnected || !card.animate || (reduce && reduce.matches)) return;
    [].forEach.call(card.querySelectorAll('.mk-cfx-pour,.mk-cfx-scan'), function (o) { o.remove(); });
    var color = fx.line[1], H = card.clientHeight, rest = card.querySelector('.mk-cfx-aura');
    var make = function (cls, css, html) {
      var o = document.createElement('div');
      o.className = cls; o.setAttribute('aria-hidden', 'true');
      o.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:7;' + css;
      o.innerHTML = html || '';
      card.appendChild(o);
      return o;
    };
    // the negative: a direct child of the card, so it blends with the card's own picture
    var neg = make('mk-cfx-scan', 'background:#fff;mix-blend-mode:difference;');
    neg.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 62% 0)', offset: .275 }, { clipPath: 'inset(62% 0 0 0)', offset: .725 }, { clipPath: 'inset(100% 0 0 0)' }],
      { duration: 640, fill: 'both' }).onfinish = function () { neg.remove(); };
    var el = make('mk-cfx-pour', 'overflow:hidden;',
      '<i style="position:absolute;left:0;right:0;top:-2px;height:3px;background:#eaffff;box-shadow:0 0 10px 3px rgba(160,240,255,.9)"></i>'
      + '<i style="position:absolute;left:-10%;width:120%;top:0;height:112%;opacity:.62"><svg viewBox="0 0 200 12" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:200%;height:12px;display:block"><path d="M0 6Q12.5 0 25 6T50 6T75 6T100 6T125 6T150 6T175 6T200 6V12H0Z" fill="' + color + '"/></svg>'
      + '<b style="position:absolute;left:0;right:0;top:11px;bottom:0;background:' + color + '"></b></i>'
      + '<span style="position:absolute;left:50%;top:50%;width:54%;aspect-ratio:1;margin:-27% 0 0 -27%">' + (window.__minkaCoffeeIcon ? window.__minkaCoffeeIcon(source) : '') + '</span>');
    var line = el.children[0], liquid = el.children[1], wave = liquid.firstChild, drink = el.children[2];
    var pic = drink.querySelector('svg'); if (pic) { pic.setAttribute('width', '100%'); pic.setAttribute('height', '100%'); pic.style.display = 'block'; }
    line.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(' + H + 'px)', opacity: 1, offset: .725 }, { transform: 'translateY(' + H + 'px)', opacity: 0 }], { duration: 640, fill: 'both' });
    var to = ((100 - level(mg)) / 1.12);   // the resting level, in the liquid's own height
    liquid.animate([
      { transform: 'translateY(100%)' }, { transform: 'translateY(8%)', offset: .38 }, { transform: 'translateY(0)', offset: .5 }, { transform: 'translateY(0)', offset: .6 },
      { transform: 'translateY(' + (to + 4).toFixed(1) + '%)', offset: .84 }, { transform: 'translateY(' + (to - 2).toFixed(1) + '%)', offset: .92 }, { transform: 'translateY(' + to.toFixed(1) + '%)' }
    ], { duration: 1500, delay: 460, fill: 'both', easing: 'cubic-bezier(.35,.5,.4,1)' });
    wave.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 1960, fill: 'both', easing: 'ease-out' });
    // the drink: seen in the scan as on an X-ray, then in its own colours afloat, then it sinks
    drink.animate([
      { opacity: 0, filter: 'grayscale(1) invert(1) brightness(1.4)', transform: 'scale(.8)' },
      { opacity: 0, filter: 'grayscale(1) invert(1) brightness(1.4)', transform: 'scale(.8)', offset: .1 },
      { opacity: 1, filter: 'grayscale(1) invert(1) brightness(1.4)', transform: 'scale(1)', offset: .18 },
      { opacity: 1, filter: 'grayscale(1) invert(1) brightness(1.4)', transform: 'scale(1)', offset: .3 },
      { opacity: 1, filter: 'grayscale(0) invert(0) brightness(1)', transform: 'translateY(-8px) rotate(-6deg) scale(1.05)', offset: .48 },
      { opacity: 1, filter: 'grayscale(0) invert(0) brightness(1)', transform: 'translateY(4px) rotate(5deg) scale(1)', offset: .66 },
      { opacity: 0, filter: 'grayscale(0) invert(0) brightness(1)', transform: 'translateY(40%) rotate(14deg) scale(.6)' }
    ], { duration: 1960, fill: 'both', easing: 'ease-in-out' });
    if (rest) rest.style.opacity = '0';   // the still level waits under the pour
    el.animate([{ opacity: 1 }, { opacity: 1, offset: .88 }, { opacity: 0 }], { duration: 2240, fill: 'both' }).onfinish = function () {
      el.remove();
      [].forEach.call(card.querySelectorAll('.mk-cfx-aura'), function (r) { r.style.opacity = ''; });
      thump(card);
    };
    setTimeout(function () { [].forEach.call(card.querySelectorAll('.mk-cfx-aura'), function (r) { r.style.opacity = ''; }); }, 1900);
  }
  // the saved drink turned out to be a golden can: the card flashes gold and pays out
  function goldBurst(card) {
    if (!card || !card.isConnected || (reduce && reduce.matches)) return;
    var r = card.getBoundingClientRect(), c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    flash(c, 'rgba(255,210,74,.9)', Math.max(r.width, r.height) * 1.5);
    toss(c, [COIN], 12, 1.7, { scale: 1.3 });
    line({ x: c.x, y: r.top + 30 }, 'ZELTA BUNDŽA!', '#ffd24a');
  }
  // now and then every mark gives one small beat (a single timer for the whole page), and the marks
  // of drinks that have worn off are taken down
  var beat = 0;
  setInterval(function () {
    if (document.hidden) return;
    if (++beat % 4 === 0 && window.__minkaCoffeeAuraRefresh) window.__minkaCoffeeAuraRefresh();
    if (reduce && reduce.matches) return;
    [].forEach.call(document.querySelectorAll('.mk-cfx-aura'), function (a) { thump(a); });
  }, 15000);

  function slice(fx, c, html, w, h, big) {
    var deg = rnd(-34, -16) * (Math.random() < .5 ? 1 : -1);
    var p = (big ? 1.5 : 1) * (fx.power || 1);
    stain(c, fx.stain, (big ? 1.9 : 1.3) * Math.max(w, h));
    if (fx.claw) claws(c, fx.claw, Math.max(w, h) * 1.5, deg);
    else blade({ x: c.x - Math.cos(deg * Math.PI / 180) * w, y: c.y - Math.sin(deg * Math.PI / 180) * w }, w * 2, deg);
    if (html) halves(c, html, w, h, deg, p);
    juice(c, fx.juice, big ? 18 : 12, p, deg);
    if (fx.extra) fx.extra(c, big);
  }

  window.MkCoffeeFx = {
    aura: aura,
    pour: pour,
    gold: goldBurst,
    // picked in the menu: its icon is sliced, then pops back whole
    pick: function (btn, source) {
      var fx = FX[source];
      if (!fx || !btn || (reduce && reduce.matches)) return;
      var icon = btn.querySelector('.mk-coffee-source-icon') || btn, r = icon.getBoundingClientRect();
      slice(fx, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, icon.innerHTML, Math.round(r.width), Math.round(r.height), false);
      if (icon.animate) icon.animate([{ opacity: 0, transform: 'scale(.5)' }, { opacity: 0, transform: 'scale(.5)', offset: .45 }, { opacity: 1, transform: 'scale(1.12)', offset: .8 }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 760, easing: 'cubic-bezier(.2,.8,.3,1)' });
    },
    // saved: the flying drink is sliced where it lands (calendar.js flyCoffeeToCurve), with its line
    land: function (x, y, source, html) {
      var fx = FX[source];
      if (!fx || (reduce && reduce.matches)) return;
      var c = { x: x, y: y };
      slice(fx, c, html || '', 40, 40, true);
      line(c, fx.line[0], fx.line[1]);
    }
  };
  if (window.__minkaCoffeeAuraRefresh) window.__minkaCoffeeAuraRefresh();   // cards drawn before this file loaded
})();
