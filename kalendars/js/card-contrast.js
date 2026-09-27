/* Kontrasts: every text on a card measured against what is really under it —
   the picture or its effect, scrims, the element's own plate — the WCAG 2 way
   (the same ratio and AA / AAA levels as colourcontrast.cc).
   It works from pixels: the card's background layers are drawn once into a
   small canvas and each text is compared with the pixels under its box.
   Runs only when asked (the Kontrasts check, Auto colours, Remix): no loops,
   no observers, one canvas of ~160 px. */
(function (host) {
  'use strict';
  var doc = host.document;

  /* ── WCAG 2 ── */
  function chan(v) { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }
  function lum(c) { return .2126 * chan(c[0]) + .7152 * chan(c[1]) + .0722 * chan(c[2]); }
  function ratioL(a, b) { return a > b ? (a + .05) / (b + .05) : (b + .05) / (a + .05); }
  function ratio(a, b) { return ratioL(lum(a), lum(b)); }
  function levels(r) { return { aaLarge: r >= 3, aa: r >= 4.5, aaaLarge: r >= 4.5, aaa: r >= 7 }; }

  /* ── colours ── */
  function parseColor(s) {
    s = String(s || '').trim();
    var m;
    if (!s || s === 'transparent' || s === 'none') return null;
    if ((m = /^rgba?\(([^)]*)\)/i.exec(s))) {
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    if ((m = /^color\(srgb\s+([^)]*)\)/i.exec(s))) {
      var q = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat);
      return [q[0] * 255, q[1] * 255, q[2] * 255, q.length > 3 ? q[3] : 1];
    }
    if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s))) {
      var n = parseInt(m[1], 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255, m[2] ? parseInt(m[2], 16) / 255 : 1];
    }
    if ((m = /^#([0-9a-f]{3})$/i.exec(s))) return [0, 1, 2].map(function (i) { return parseInt(m[1][i] + m[1][i], 16); }).concat(1);
    if (s === 'white') return [255, 255, 255, 1];
    if (s === 'black') return [0, 0, 0, 1];
    return null;
  }
  function hex(c) { return '#' + c.slice(0, 3).map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function rgba(c) { return 'rgba(' + c.slice(0, 3).map(Math.round).join(',') + ',' + (c[3] == null ? 1 : c[3]) + ')'; }
  function toHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }

  /* ── CSS values ── */
  function splitTop(s) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (ch === ',' && !depth) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  var SIDE = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270, 'to top right': 45, 'to right top': 45, 'to bottom right': 135, 'to right bottom': 135, 'to bottom left': 225, 'to left bottom': 225, 'to top left': 315, 'to left top': 315 };
  function parseGradient(layer) {
    var m = /^(?:repeating-)?(linear|radial|conic)-gradient\((.*)\)$/i.exec(layer);
    if (!m) return null;
    var args = splitTop(m[2]), angle = 180, stops = [];
    if (m[1] === 'linear') {
      var am = /^(-?[\d.]+)(deg|turn|rad)$/.exec(args[0]);
      if (am) { angle = am[2] === 'turn' ? am[1] * 360 : am[2] === 'rad' ? am[1] * 180 / Math.PI : +am[1]; args.shift(); }
      else if (/^to /.test(args[0])) { angle = SIDE[args[0]] != null ? SIDE[args[0]] : 180; args.shift(); }
    } else if (args.length && !/^(rgb|color\(|#|transparent)/i.test(args[0])) args.shift();
    args.forEach(function (a) {
      var sm = /^(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}|transparent|white|black)\s*(.*)$/i.exec(a);
      if (!sm) return;
      var c = parseColor(sm[1]) || [0, 0, 0, 0], pm = /(-?[\d.]+)%/.exec(sm[2] || '');
      stops.push({ c: c, p: pm ? +pm[1] / 100 : null });
    });
    if (!stops.length) return null;
    if (stops[0].p == null) stops[0].p = 0;
    if (stops[stops.length - 1].p == null) stops[stops.length - 1].p = 1;
    for (var i = 1; i < stops.length - 1; i++) if (stops[i].p == null) {
      var j = i; while (stops[j].p == null) j++;
      for (var k = i; k < j; k++) stops[k].p = stops[i - 1].p + (stops[j].p - stops[i - 1].p) * (k - i + 1) / (j - i + 1);
    }
    return { kind: m[1], angle: angle, stops: stops };
  }
  // Mean colour weighted by each stop's alpha (a clear stop adds no colour,
  // only lowers the coverage).
  function gradientAverage(g) {
    var acc = [0, 0, 0], wa = 0;
    g.stops.forEach(function (s) { var a = s.c[3] == null ? 1 : s.c[3]; for (var i = 0; i < 3; i++) acc[i] += s.c[i] * a; wa += a; });
    return wa ? [acc[0] / wa, acc[1] / wa, acc[2] / wa, wa / g.stops.length] : [0, 0, 0, 0];
  }

  /* ── pictures ── */
  var pics = new Map();
  function picture(u) {
    if (pics.has(u)) return pics.get(u);
    var job = new Promise(function (resolve) {
      var im = new Image();
      try { if (new URL(u, doc.baseURI).origin !== host.location.origin && !/^(blob|data):/.test(u)) im.crossOrigin = 'anonymous'; } catch (_) {}
      im.decoding = 'async';
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = u;
    });
    pics.set(u, job);
    if (pics.size > 24) pics.delete(pics.keys().next().value);
    return job;
  }
  function urlOf(layer) { var m = /^url\((['"]?)(.*?)\1\)$/.exec(layer); return m ? m[2] : ''; }
  function lengthIn(v, box, img) {
    if (/%$/.test(v)) return parseFloat(v) / 100 * box;
    if (/px$/.test(v)) return parseFloat(v);
    return null;
  }

  /* Paints one element's backgrounds (colour, gradients, pictures) into ctx at
     rect (canvas units). k: CSS px of the element → canvas units. */
  function paintBackground(ctx0, cs, rect, k, alpha, jobs, filter) {
    if (alpha <= 0.01 || rect.w < .5 || rect.h < .5) return [];
    var layers = cs.backgroundImage && cs.backgroundImage !== 'none' ? splitTop(cs.backgroundImage) : [];
    var sizes = splitTop(cs.backgroundSize || 'auto'), poss = splitTop(cs.backgroundPosition || '0% 0%'), reps = splitTop(cs.backgroundRepeat || 'repeat');
    var bgc = parseColor(cs.backgroundColor);
    var ops = [];
    if (bgc && bgc[3] > 0) ops.push(function (ctx) { ctx = ctx || ctx0; ctx.globalAlpha = alpha; ctx.fillStyle = rgba(bgc); ctx.fillRect(rect.x, rect.y, rect.w, rect.h); });
    // Bottom layer first.
    for (var i = layers.length - 1; i >= 0; i--) (function (layer, size, pos, rep) {
      var g = parseGradient(layer);
      if (g) {
        ops.push(function (ctx) {
          ctx = ctx || ctx0; ctx.globalAlpha = alpha;
          if (g.kind !== 'linear') { ctx.fillStyle = rgba(gradientAverage(g)); ctx.fillRect(rect.x, rect.y, rect.w, rect.h); return; }
          var a = g.angle * Math.PI / 180, sx = Math.sin(a), sy = -Math.cos(a), L = Math.abs(rect.w * sx) + Math.abs(rect.h * sy);
          var cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
          var lg = ctx.createLinearGradient(cx - sx * L / 2, cy - sy * L / 2, cx + sx * L / 2, cy + sy * L / 2);
          g.stops.forEach(function (s) { lg.addColorStop(Math.max(0, Math.min(1, s.p)), rgba(s.c)); });
          ctx.fillStyle = lg; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        });
        return;
      }
      var u = urlOf(layer);
      if (!u) return;
      var slot = { im: null };
      jobs.push(picture(u).then(function (im) { slot.im = im; }));
      ops.push(function (ctx) {
        ctx = ctx || ctx0;
        var im = slot.im;
        if (!im || !im.naturalWidth) return;
        var iw = im.naturalWidth, ih = im.naturalHeight, bw = rect.w, bh = rect.h, dw, dh;
        var sz = (size || 'auto').trim();
        if (sz === 'cover' || sz === 'contain') { var s = (sz === 'cover' ? Math.max : Math.min)(bw / iw, bh / ih); dw = iw * s; dh = ih * s; }
        else {
          var parts = sz.split(/\s+/), W = lengthIn(parts[0], bw), H = lengthIn(parts[1] || 'auto', bh);
          if (W != null && parts[0].slice(-2) === 'px') W *= k;
          if (H != null && (parts[1] || '').slice(-2) === 'px') H *= k;
          dw = W != null ? W : H != null ? H * iw / ih : iw * k; dh = H != null ? H : W != null ? W * ih / iw : ih * k;
        }
        var pp = (pos || '0% 0%').trim().split(/\s+/), px = pp[0] || '0%', py = pp[1] || '50%';
        var ox = /%$/.test(px) ? (bw - dw) * parseFloat(px) / 100 : parseFloat(px) * k || 0;
        var oy = /%$/.test(py) ? (bh - dh) * parseFloat(py) / 100 : parseFloat(py) * k || 0;
        ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
        ctx.globalAlpha = alpha;
        var tile = /repeat/.test(rep || '') && !/no-repeat/.test(rep || '') && dw > 0 && dh > 0 && (bw / dw) * (bh / dh) <= 256;
        if (tile) {
          for (var ty = oy - Math.ceil(oy / dh) * dh; ty < bh; ty += dh) for (var tx = ox - Math.ceil(ox / dw) * dw; tx < bw; tx += dw) ctx.drawImage(im, rect.x + tx, rect.y + ty, dw, dh);
        } else ctx.drawImage(im, rect.x + ox, rect.y + oy, dw, dh);
        ctx.restore();
      });
    })(layers[i], sizes[i % sizes.length], poss[i % poss.length], reps[i % reps.length]);
    // CSS filters on the layer (the card's "Tumšs" tone darkens the picture this way).
    if (!filter) return ops;
    return ops.map(function (op) { return function (ctx) { ctx = ctx || ctx0; ctx.save(); ctx.filter = filter; op(ctx); ctx.restore(); }; });
  }
  // The filters that reach an element: its own first, then each parent's (up to the card).
  function filterChain(el, stop) {
    var out = [];
    for (var n = el; n && n !== stop; n = n.parentElement) { var f = host.getComputedStyle(n).filter; if (f && f !== 'none') out.push(f.replace(/drop-shadow\([^()]*(\([^()]*\)[^()]*)*\)/g, '').trim()); }
    return out.filter(Boolean).join(' ');
  }

  /* ── the card ── */
  var PARTS = { hours: 'Cipars', name: 'Vārds', month: 'Mēneša stundas', fatigue: 'Nogurums', remaining: 'Taimeris', coffee: 'Kafija', clock: 'Pulkstenis', initials: 'Iniciāļi', emoji: 'Emoji', moon: 'Maiņas simbols' };
  function shown(el, stop) {
    for (var n = el; n && n !== stop; n = n.parentElement) {
      if (n.hidden) return false;
      var cs = host.getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    }
    return true;
  }
  function opacityChain(el, stop) {
    var a = 1;
    for (var n = el; n && n !== stop; n = n.parentElement) a *= +host.getComputedStyle(n).opacity || 0;
    return a;
  }
  function zOf(el) { var z = parseInt(host.getComputedStyle(el).zIndex, 10); return isFinite(z) ? z : 0; }
  function ownText(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && /[0-9A-Za-zĀ-ž%:–\-]/.test(c.nodeValue)) return true;
    return false;
  }
  function textClip(cs) { return /text/.test(cs.webkitBackgroundClip || '') || /text/.test(cs.backgroundClip || ''); }

  /* audit(card) → Promise of { parts: [...], worst, ok, unknown }.
     Each part: { key, label, ratio, need, pass, levels, fg, bg, leaves }. */
  function audit(card) {
    if (!card || !card.getBoundingClientRect) return Promise.resolve(null);
    var cr = card.getBoundingClientRect();
    if (!cr.width || !cr.height) return Promise.resolve(null);
    var W = Math.min(160, Math.max(60, Math.round(card.offsetWidth || cr.width))), S = W / cr.width, H = Math.round(cr.height * S);
    var kCard = (card.offsetWidth ? cr.width / card.offsetWidth : 1) * S;   // CSS px of the card → canvas units
    function box(r) { return { x: (r.left - cr.left) * S, y: (r.top - cr.top) * S, w: r.width * S, h: r.height * S }; }
    function kOf(el, r) { return (el.offsetWidth ? r.width / el.offsetWidth : 1) * S; }

    var jobs = [], scene = [];
    // 1. Background layers: the card, its scrims, and everything not part of a text element.
    var ccs = host.getComputedStyle(card), full = { x: 0, y: 0, w: W, h: H };
    scene.push({ z: -1e6, ops: paintBackground(null, ccs, full, kCard, 1, jobs) });
    ['::before', '::after'].forEach(function (pe, i) {
      var ps = host.getComputedStyle(card, pe);
      if (ps.content && ps.content !== 'none' && ps.display !== 'none') scene.push({ z: -1e5 + i, ops: paintBackground(null, ps, full, kCard, +ps.opacity || 0, jobs) });
    });
    var order = 0;
    Array.prototype.forEach.call(card.querySelectorAll('*'), function (el) {
      if (el.closest('[data-wf-part]') || el.closest('.mk-wf-dial')) return;
      if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height || !shown(el, card)) return;
      var a = opacityChain(el, card), cs = host.getComputedStyle(el), z = 0;
      for (var n = el; n && n !== card; n = n.parentElement) { var zz = zOf(n); if (zz) { z = zz; } }
      if (el.tagName === 'IMG') {
        var src = el.currentSrc || el.src, cnt = (cs.content || '').match(/url\((['"]?)(.*?)\1\)/);
        if (cnt) src = cnt[2];
        if (!src) return;
        var slot = { im: null }, rr = box(r);
        jobs.push(picture(src).then(function (im) { slot.im = im; }));
        var imf = filterChain(el, card);
        scene.push({ z: z, o: order++, ops: [function (ctx) {
          var im = slot.im; if (!im || !im.naturalWidth) return;
          var s = Math.min(rr.w / im.naturalWidth, rr.h / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
          ctx.save(); if (imf) ctx.filter = imf;
          ctx.globalAlpha = a; ctx.drawImage(im, rr.x + (rr.w - dw) / 2, rr.y + (rr.h - dh) / 2, dw, dh);
          ctx.restore();
        }] });
        return;
      }
      if ((!cs.backgroundImage || cs.backgroundImage === 'none') && !(parseColor(cs.backgroundColor) || [0, 0, 0, 0])[3]) return;
      scene.push({ z: z, o: order++, ops: paintBackground(null, cs, box(r), kOf(el, r), a, jobs, filterChain(el, card)) });
    });

    // 2. Text: every visible element with its own text in each card part.
    var parts = [];
    Array.prototype.forEach.call(card.querySelectorAll('[data-wf-part]'), function (part) {
      var key = part.getAttribute('data-wf-part');
      if (!PARTS[key] || key === 'emoji' || key === 'moon' || !shown(part, card)) return;
      var root = host.getComputedStyle(part), rootFg = parseColor(root.webkitTextFillColor);
      if (!rootFg || !rootFg[3]) rootFg = parseColor(root.color);
      var leaves = [], plates = [];
      [part].concat(Array.prototype.slice.call(part.querySelectorAll('*'))).forEach(function (el) {
        if (!shown(el, card)) return;
        var cs = host.getComputedStyle(el), r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var svgText = el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName.toLowerCase() === 'text';
        var clip = textClip(cs);
        if (!clip && el.namespaceURI === 'http://www.w3.org/1999/xhtml') {
          var hasBg = (cs.backgroundImage && cs.backgroundImage !== 'none') || (parseColor(cs.backgroundColor) || [0, 0, 0, 0])[3] > 0;
          if (hasBg) plates.push({ cs: cs, rect: box(r), k: kOf(el, r), a: opacityChain(el, card) });
          ['::before', '::after'].forEach(function (pe) {
            var ps = host.getComputedStyle(el, pe);
            if (ps.content && ps.content !== 'none' && ps.display !== 'none' && ((ps.backgroundImage && ps.backgroundImage !== 'none') || (parseColor(ps.backgroundColor) || [0, 0, 0, 0])[3] > 0))
              plates.push({ cs: ps, rect: box(r), k: kOf(el, r), a: opacityChain(el, card) * (+ps.opacity || 0) });
          });
        }
        if (!(svgText ? (el.textContent || '').trim() : ownText(el))) return;
        var fg = svgText ? parseColor(cs.fill) : parseColor(cs.webkitTextFillColor);
        if (!fg || !fg[3]) {
          // Numerals: the fill is the element's (or a parent's) gradient, clipped to the text.
          for (var n = el; n && n !== part.parentElement; n = n.parentElement) {
            var ns = host.getComputedStyle(n);
            if (textClip(ns)) { var g = parseGradient(splitTop(ns.backgroundImage)[0] || ''); if (g) { fg = gradientAverage(g); fg[3] = 1; } break; }
          }
        }
        if (!fg || !fg[3]) fg = parseColor(cs.color);
        if (!fg) return;
        var a = fg[3] * opacityChain(el, card);
        // Dark halos (text-shadow) help as a local plate: count a part of them.
        var halo = null;
        (cs.textShadow && cs.textShadow !== 'none' ? splitTop(cs.textShadow) : []).forEach(function (sh) {
          var hc = parseColor((/(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i.exec(sh) || [])[1]);
          if (hc && (!halo || hc[3] > halo[3])) halo = hc;
        });
        var px = parseFloat(cs.fontSize) * (el.offsetHeight ? r.height / el.offsetHeight : 1) / (card.offsetWidth ? cr.width / card.offsetWidth : 1);
        var bold = (parseInt(cs.fontWeight, 10) || 400) >= 700;
        // A faded caption (a label drawn at reduced opacity by design) is held to 3:1,
        // like large text; the value it labels keeps the full 4.5:1.
        var large = px >= 24 || (bold && px >= 18.66), caption = !large && a < .95 && !svgText;
        // The fatigue value is its level colour mixed into the element's colour
        // (card-faces.css: 25 % once the element has its own colour, which is what a
        // suggestion gives it): a new element colour moves it only part of the way.
        var mix = null;
        if (el.classList && el.classList.contains('mk-mid-meta-value') && card.classList.contains('mk-watch-face')) {
          var lvl = parseColor(host.getComputedStyle(el).getPropertyValue('--mk-mid-fat-color')) || [48, 209, 88, 1];
          mix = { c: lvl.slice(0, 3), w: .25 };
        }
        leaves.push({ el: el, rect: box(r), fg: fg.slice(0, 3), a: a, halo: halo, large: large, caption: caption, px: px, mix: mix,
          main: !!rootFg && Math.abs(fg[0] - rootFg[0]) + Math.abs(fg[1] - rootFg[1]) + Math.abs(fg[2] - rootFg[2]) < 60 });
      });
      if (leaves.length) parts.push({ key: key, label: PARTS[key], leaves: leaves, plates: plates, rootFg: rootFg });
    });

    return Promise.all(jobs).then(function () {
      var cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d', { willReadFrequently: true });
      scene.sort(function (a, b) { return a.z - b.z || (a.o || 0) - (b.o || 0); });
      scene.forEach(function (s) { (s.ops || []).forEach(function (op) { op(ctx); }); });
      var base;
      try { base = ctx.getImageData(0, 0, W, H); } catch (_) { return { parts: [], unknown: true }; }
      var tmp = doc.createElement('canvas'); tmp.width = W; tmp.height = H;
      var tctx = tmp.getContext('2d', { willReadFrequently: true });
      var out = [];
      parts.forEach(function (p) {
        tctx.putImageData(base, 0, 0);
        p.plates.forEach(function (pl) { (paintBackground(tctx, pl.cs, pl.rect, pl.k, pl.a, []) || []).forEach(function (op) { op(tctx); }); });
        var data, dataBase = null, af = 0;
        try { data = tctx.getImageData(0, 0, W, H).data; } catch (_) { return; }
        // Glass plates tinted with the element's own text colour: a new colour
        // re-tints the plate too. The plate is painted once more without those
        // stops, and their mean alpha kept, so each candidate gets its own plate.
        var follow = p.plates.map(function (pl) { return followPlate(pl.cs, p.rootFg); });
        if (follow.some(Boolean)) {
          tctx.putImageData(base, 0, 0);
          p.plates.forEach(function (pl, i) {
            var f = follow[i];
            if (f) af = 1 - (1 - af) * (1 - f.af * pl.a);
            (paintBackground(tctx, f ? f.cs : pl.cs, pl.rect, pl.k, pl.a, []) || []).forEach(function (op) { op(tctx); });
          });
          try { dataBase = tctx.getImageData(0, 0, W, H).data; } catch (_) { dataBase = null; }
        }
        var worst = null;
        p.leaves.forEach(function (lf) {
          lf.bg = sampleRegion(data, W, H, lf.rect, lf.halo);
          if (dataBase && af > .01) { lf.bgBase = sampleRegion(dataBase, W, H, lf.rect, lf.halo); lf.af = af; }
          lf.ratio = score(lf.fg, lf.a, lf.bg);
          lf.need = lf.large || lf.caption ? 3 : 4.5;
          if (!worst || lf.ratio / lf.need < worst.ratio / worst.need) worst = lf;
        });
        if (!worst) return;
        out.push({ key: p.key, label: p.label, ratio: worst.ratio, need: worst.need, pass: worst.ratio >= worst.need, levels: levels(worst.ratio),
          fg: hex(worst.fg), bg: hex(meanOf(worst.bg)), leaves: p.leaves, large: worst.large, caption: worst.caption });
      });
      var worstPart = out.reduce(function (w, p) { return !w || p.ratio / p.need < w.ratio / w.need ? p : w; }, null);
      return { parts: out, worst: worstPart, ok: out.every(function (p) { return p.pass; }), fails: out.filter(function (p) { return !p.pass; }).length };
    });
  }

  /* A plate whose gradient stops are the element's text colour (alpha aside) follows
     that colour. Returns the plate without those stops and their mean coverage. */
  function followPlate(cs, fg) {
    if (!fg || !cs.backgroundImage || cs.backgroundImage === 'none') return null;
    var layers = splitTop(cs.backgroundImage), changed = false, cover = 0, n = 0;
    var out = layers.map(function (layer) {
      var g = parseGradient(layer);
      if (!g || g.kind !== 'linear') return layer;
      var stops = g.stops.map(function (st) {
        n++;
        var near = Math.abs(st.c[0] - fg[0]) + Math.abs(st.c[1] - fg[1]) + Math.abs(st.c[2] - fg[2]) < 36;
        if (!near) return rgba(st.c) + ' ' + (st.p * 100).toFixed(1) + '%';
        changed = true; cover += st.c[3] == null ? 1 : st.c[3];
        return 'rgba(0,0,0,0) ' + (st.p * 100).toFixed(1) + '%';
      });
      return 'linear-gradient(' + g.angle + 'deg, ' + stops.join(', ') + ')';
    });
    if (!changed) return null;
    return { cs: { backgroundImage: out.join(', '), backgroundColor: cs.backgroundColor, backgroundSize: cs.backgroundSize, backgroundPosition: cs.backgroundPosition, backgroundRepeat: cs.backgroundRepeat, filter: 'none' }, af: cover / Math.max(1, n) };
  }
  // What a leaf's background becomes when its element (and so its plate) takes colour c.
  function bgFor(lf, c) {
    if (!lf.af || !lf.bgBase) return lf.bg;
    var k = lf.af;
    return lf.bgBase.map(function (px) { return [px[0] * (1 - k) + c[0] * k, px[1] * (1 - k) + c[1] * k, px[2] * (1 - k) + c[2] * k]; });
  }

  /* The pixels under a text box, as seen: a 3×3 local mean (fine dither dots and
     halftone read as their average at text size), a halo counted as a partial plate. */
  function sampleRegion(d, W, H, r, halo) {
    var x0 = Math.max(1, Math.floor(r.x)), y0 = Math.max(1, Math.floor(r.y)), x1 = Math.min(W - 2, Math.ceil(r.x + r.w)), y1 = Math.min(H - 2, Math.ceil(r.y + r.h));
    var px = [], step = Math.max(1, Math.floor(Math.sqrt((x1 - x0) * (y1 - y0) / 900)));
    var hk = halo ? Math.min(.45, halo[3] * .45) : 0;
    for (var y = y0; y <= y1; y += step) for (var x = x0; x <= x1; x += step) {
      var r0 = 0, g0 = 0, b0 = 0;
      for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) { var i = ((y + oy) * W + x + ox) * 4; r0 += d[i]; g0 += d[i + 1]; b0 += d[i + 2]; }
      var c = [r0 / 9, g0 / 9, b0 / 9];
      if (hk) c = [c[0] + (halo[0] - c[0]) * hk, c[1] + (halo[1] - c[1]) * hk, c[2] + (halo[2] - c[2]) * hk];
      px.push(c);
    }
    if (!px.length) px.push([0, 0, 0]);
    return px;
  }
  function meanOf(px) { var s = [0, 0, 0]; px.forEach(function (c) { s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; }); return s.map(function (v) { return v / px.length; }); }
  // The ratio most of the text has (15th percentile over the pixels under it): one
  // bright speck does not fail a word, a busy half of the box does.
  function score(fg, a, bg) {
    var rs = bg.map(function (c) {
      var f = a >= .999 ? fg : [fg[0] * a + c[0] * (1 - a), fg[1] * a + c[1] * (1 - a), fg[2] * a + c[2] * (1 - a)];
      return ratio(f, c);
    }).sort(function (x, y) { return x - y; });
    return rs[Math.floor(rs.length * .15)];
  }

  // The colour a leaf really shows when its element gets colour c.
  function through(c, lf) { return lf.mix ? [0, 1, 2].map(function (i) { return lf.mix.c[i] * lf.mix.w + c[i] * (1 - lf.mix.w); }) : c; }

  /* A colour close to `from` (same hue and saturation, nearest lightness) that
     reaches `need` on every given leaf; or the best one there is. */
  function suggest(from, leaves, need) {
    var h = toHsl(from), best = null, bestMiss = null;
    for (var step = 0; step <= 50; step++) for (var sgn = -1; sgn <= 1; sgn += 2) {
      if (!step && sgn > 0) continue;
      var l = h[2] + sgn * step / 50;
      if (l < 0 || l > 1) continue;
      var c = fromHsl(h[0], l > .9 || l < .1 ? h[1] * .6 : h[1], l), worst = Infinity;
      leaves.forEach(function (lf) { var r = score(through(c, lf), lf.a, bgFor(lf, c)) / (need || lf.need); if (r < worst) worst = r; });
      if (worst >= 1.08 && !best) best = { color: hex(c), ratio: worst };
      if (!bestMiss || worst > bestMiss.ratio) bestMiss = { color: hex(c), ratio: worst };
    }
    return best ? { color: best.color, reaches: true } : { color: bestMiss.color, reaches: false };
  }
  function ratioFor(color, leaves) {
    var c = parseColor(color); if (!c) return 0;
    return leaves.reduce(function (m, lf) { return Math.min(m, score(through(c.slice(0, 3), lf), lf.a, bgFor(lf, c.slice(0, 3)))); }, Infinity);
  }

  // min(ratio / need) over the card: ≥ 1 means every text passes.
  function scoreOf(rep) { return rep && rep.parts && rep.parts.length ? rep.parts.reduce(function (m, p) { return Math.min(m, p.ratio / p.need); }, Infinity) : 0; }

  host.MinkaContrast = { scoreOf: scoreOf, ratio: ratio, lum: lum, levels: levels, parseColor: parseColor, hex: hex, audit: audit, suggest: suggest, ratioFor: ratioFor, labels: PARTS };
})(window);
