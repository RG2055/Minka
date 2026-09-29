/* Būvētājs: a card from scratch in seven small steps (Fons → Efekts →
   Izkārtojums → Krāsas → Cipari → Taimeris → Dekori), each with its own
   suggestions and the reason for them. The card preview on the left changes
   with every pick and the Kontrasts check measures it, so the "Salasāmība"
   meter always tells the truth. Points, stars and a small confetti make it a
   game, not a form.
   Light on old PCs: the picture effects are small cached thumbnails, the
   preview alone is repainted while building (the roster follows once, on
   leaving), and confetti is a dozen CSS-animated specks, gone in a second. */
(function () {
  'use strict';
  var K = function () { return window.MinkaSkinKit; };
  var M = function () { return window.MinkaCardFaceModel; };

  var STEPS = [
    { key: 'bg', label: 'Fons', title: 'Izvēlies fonu', tip: 'Zīmīte Aa nozīmē mierīgu fonu: uz tā cipari un vārds lasās vislabāk.' },
    { key: 'fx', label: 'Efekts', title: 'Piešķir efektu', tip: 'Efekts pārzīmē bildi. Ieteiktie der tieši šai bildei.' },
    { key: 'layout', label: 'Izkārtojums', title: 'Kur kas atrodas', tip: 'Izvēlies izkārtojumu un to, ko kartītē rādīt. Mazāk elementu nozīmē tīrāku kartīti.' },
    { key: 'colors', label: 'Krāsas', title: 'Krāsas no bildes', tip: 'Visas krāsas ņemtas no fona. Birka rāda, vai cipars lasās.' },
    { key: 'digits', label: 'Cipari', title: 'Ciparu materiāls', tip: 'Uz raiba fona vislabāk lasās Tīrs vai Neons.' },
    { key: 'timer', label: 'Taimeris', title: 'Maiņas taimeris', tip: 'Cipari vai analogs pulkstenis. Pulkstenis pats atrod brīvu vietu.' },
    { key: 'decor', label: 'Dekori', title: 'Dekori', tip: 'Līdz 3 dekoriem. Tie paši atrod vietu, kartītē tos var pārvilkt.' },
    { key: 'done', label: 'Gatavs', title: 'Tava kartīte', tip: '' }
  ];
  var FX = [['', 'Nav'], ['dither', 'Dither'], ['ditherpaper', 'Papīrs'], ['halftone', 'Rastrs'], ['duotone', 'Duotons'], ['led', 'LED'], ['lines', 'Līnijas'], ['ascii', 'ASCII'],
    ['mosaic', 'Mozaīka'], ['bricks', 'Kluči'], ['pixelate', 'Pikseļi'], ['cmyk', 'CMYK'], ['riso', 'Riso'], ['posterize', 'Posters'], ['heatmap', 'Siltums'], ['focus', 'Fokuss'], ['split', 'Puse']];
  var FACES = [['classic', 'Klasisks'], ['photo', 'Foto'], ['orbit', 'Orbīta'], ['modular', 'Moduļi'], ['dither', 'Dither'], ['gameboy', 'Gameboy'], ['thermo', 'Termostats'], ['dots', 'Punkti'], ['lines', 'Līnijas']];
  var PARTS = [['name', 'Vārds'], ['month', 'Mēnesis'], ['fatigue', 'Nogurums'], ['remaining', 'Taimeris'], ['coffee', 'Kafija'], ['emoji', 'Emoji'], ['clock', 'Pulkstenis'], ['initials', 'Iniciāļi'], ['moon', 'Simbols']];
  var ESSENTIAL = { hours: 1, name: 1, month: 1, remaining: 1 };
  var FINISHES = ['Stikls', 'Metāls', 'Tīrs', 'Plūsma', 'Perlamutrs', 'Neons'];
  var BOX = { hours: [60, 51], name: [55, 21], initials: [20, 20], month: [26, 23], coffee: [30, 20], fatigue: [32, 21], remaining: [30, 16], emoji: [17, 17], clock: [26, 20], moon: [16, 16] };

  // "zem …": genitive (dative for the plural ones), for the hints.
  var UNDER = { hours: 'cipara', name: 'vārda', month: 'mēneša stundām', fatigue: 'noguruma', remaining: 'taimera', coffee: 'kafijas', clock: 'pulksteņa', initials: 'iniciāļiem' };
  var B = null;           // the build in progress: { name, step, xp, done:{}, badges:{}, pal, calm }
  var calmCache = Object.create(null);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function motion() { return document.documentElement.getAttribute('data-motion') || 'full'; }
  function ctxOf(host) { return host && host.__builderCtx; }
  function rgb(str) { var p = String(str || '').split(',').map(Number); return p.length === 3 && p.every(isFinite) ? p : null; }
  function hexRgb(h) { var n = parseInt(String(h || '').replace('#', ''), 16); return isFinite(n) ? [n >> 16 & 255, n >> 8 & 255, n & 255] : null; }
  function hex(c) { return c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }

  /* ── little rewards ── */
  function award(host, key, pts, label) {
    if (!B || B.done[key]) return;
    B.done[key] = 1; B.xp += pts;
    var xp = host.querySelector('.bld-xp b');
    if (xp) xp.textContent = B.xp;
    var box = host.querySelector('.bld-xp');
    if (box && motion() !== 'reduced') {
      var pop = document.createElement('span'); pop.className = 'bld-pop'; pop.textContent = '+' + pts + (label ? ' ' + label : '');
      box.append(pop); setTimeout(function () { pop.remove(); }, 1100);
    }
  }
  function confetti(host, count) {
    var lvl = motion(); if (lvl === 'reduced') return;
    var slot = host.querySelector('.mk-skin-preview-slot'); if (!slot) return;
    var n = lvl === 'lite' ? Math.min(6, count) : count;
    var pal = B && B.pal, cols = ['#ffd166', '#6dd58c', '#64d2ff', '#ff8a5c', '#f4f2ec'];
    if (pal) cols = ['#' + pal.accent, pal.pop ? '#' + pal.pop : '#ffd166', 'rgb(' + pal.txt + ')', '#ffd166', '#6dd58c'];
    var layer = document.createElement('div'); layer.className = 'bld-confetti'; layer.setAttribute('aria-hidden', 'true');
    var html = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + Math.random() * .5, d = 60 + Math.random() * 80;
      html += '<i style="--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d * .8 - 30) + 'px;--r:' + Math.round(Math.random() * 540 - 270) + 'deg;--c:' + cols[i % cols.length] + ';--d:' + Math.round(Math.random() * 90) + 'ms' + (i % 3 ? '' : ';border-radius:50%') + '"></i>';
    }
    layer.innerHTML = html; slot.append(layer);
    setTimeout(function () { layer.remove(); }, 1300);
  }

  /* ── picture analysis: how calm is the place where text goes ── */
  function calmOf(img, id) {
    if (calmCache[id] != null) return calmCache[id];
    try {
      var c = document.createElement('canvas'); c.width = c.height = 24;
      var x = c.getContext('2d', { willReadFrequently: true }), w = img.naturalWidth, h = img.naturalHeight, m = Math.min(w, h);
      x.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, 24, 24);
      var d = x.getImageData(0, 6, 24, 17).data, n = 0, s = 0, s2 = 0;
      for (var i = 0; i < d.length; i += 4) { var l = (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; s += l; s2 += l * l; n++; }
      var sd = Math.sqrt(Math.max(0, s2 / n - (s / n) * (s / n)));
      calmCache[id] = sd;
      return sd;
    } catch (_) { return null; }
  }
  function isCalm(id) { return calmCache[id] != null && calmCache[id] < .15; }
  function recommendFx(pal, calm) {
    if (!pal) return ['dither', 'halftone'];
    if (pal.grey) return ['duotone', 'dither', 'ditherpaper'];
    if (calm) return ['halftone', 'riso', 'dither'];
    return ['mosaic', 'bricks', 'cmyk'];
  }

  /* ── the layout sketch: a tiny wireframe of where each element sits ── */
  function sketch(face) {
    var p = face.parts, out = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="2" y="2" width="96" height="96" rx="18" class="bld-sk-card"/>';
    Object.keys(BOX).forEach(function (k) {
      var v = p[k]; if (!v || !v[3]) return;
      var s = v[2] / 100, w = BOX[k][0] * s, h = BOX[k][1] * s;
      if (k === 'hours') { out += '<text x="' + v[0] + '" y="' + (v[1] + h * .32) + '" font-size="' + (h * .9).toFixed(1) + '" text-anchor="middle" class="bld-sk-num">12</text>'; return; }
      out += '<rect x="' + (v[0] - w / 2).toFixed(1) + '" y="' + (v[1] - h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + Math.min(6, h / 2).toFixed(1) + '" class="bld-sk-' + (k === 'name' ? 'name' : 'chip') + '"/>';
    });
    return out + '</svg>';
  }

  /* ── colour variants from the picture's palette ── */
  function variants(pal, fx) {
    var kit = K(), inked = kit.INK_FX.test(fx || ''), light = pal.lum > .42;
    var hi = light ? [22, 22, 26] : [250, 250, 248], acc = hexRgb(pal.accent);
    var pop = pal.pop ? hexRgb(pal.pop) : kit.toneAt((pal.hue + 180) % 360, 70, light ? .12 : .5);
    var pastel = kit.toneAt(pal.hue, 45, light ? .1 : .72);
    return [
      { key: 'auto', label: 'Auto', num: acc, txt: rgb(pal.txt) },
      { key: 'contrast', label: 'Kontrasts', num: hi, txt: hi },
      { key: 'pop', label: 'Akcents', num: pop, txt: rgb(pal.txt) },
      { key: 'pastel', label: 'Pasteļi', num: pastel, txt: rgb(pal.txt) },
      { key: 'mono', label: 'Mono', num: rgb(pal.txt), txt: rgb(pal.txt) }
    ].map(function (v) { v.inked = inked; return v; });
  }

  /* ── steps ── */
  function body(host) {
    var ctx = ctxOf(host), draft = ctx.draft(), step = STEPS[B.step].key, kit = K(), html = '';
    if (step === 'bg') {
      var groups = kit.IMG_GROUPS.filter(function (g) { return g.label !== 'Dither' && g.ids.length > 5; });
      var mood = B.mood || '';
      html += '<div class="bld-chips bld-moods" role="group" aria-label="Noskaņa"><button type="button" data-mood="" aria-pressed="' + !mood + '">Ieteiktie</button>'
        + groups.map(function (g) { return '<button type="button" data-mood="' + esc(g.label) + '" aria-pressed="' + (mood === g.label) + '">' + esc(g.label) + '</button>'; }).join('') + '</div>';
      var pool = mood ? (groups.filter(function (g) { return g.label === mood; })[0] || { ids: [] }).ids : kit.SCENIC_SKINS.map(function (s) { return s.id; });
      if (!B.bgPage || B.bgMood !== mood) { B.bgMood = mood; B.bgPage = 0; }
      var ids = pool.slice(B.bgPage * 12, B.bgPage * 12 + 12);
      if (!ids.length) { B.bgPage = 0; ids = pool.slice(0, 12); }
      html += '<div class="bld-grid bld-pics">' + ids.map(function (id) {
        var on = draft.t === 'img' && draft.id === id;
        return '<button type="button" class="bld-tile" data-bg="' + esc(id) + '" aria-pressed="' + on + '" title="' + esc(kit.IMG_LABELS[id] || '') + '"><img alt="" loading="lazy" decoding="async" src="' + esc(kit.imgUrl(id)) + '"><span class="bld-badge" hidden>Aa ✓</span></button>';
      }).join('') + '</div>';
      if (pool.length > 12) html += '<button type="button" class="bld-more" data-more>Citas bildes</button>';
    } else if (step === 'fx') {
      var rec = recommendFx(B.pal, isCalm(draft.id));
      html += '<div class="bld-grid bld-fx">' + FX.map(function (f) {
        return '<button type="button" class="bld-tile" data-fx="' + f[0] + '" aria-pressed="' + ((draft.fx || '') === f[0]) + '"><span class="bld-thumb"></span><b>' + f[1] + '</b>' + (rec.indexOf(f[0]) >= 0 ? '<em class="bld-rec">Ieteicams</em>' : '') + '</button>';
      }).join('') + '</div>';
    } else if (step === 'layout') {
      var cur = draft.face || M().preset('classic');
      var busy = !isCalm(draft.id) || kit.BUSY_FX.test(draft.fx || '');
      html += '<div class="bld-grid bld-faces">' + FACES.map(function (f) {
        var pv = M().preset(f[0], null); Object.keys(pv.parts).forEach(function (k) { if (cur.parts[k]) pv.parts[k][3] = cur.parts[k][3]; });
        return '<button type="button" class="bld-tile" data-face="' + f[0] + '" aria-pressed="' + (cur.face === f[0]) + '">' + sketch(pv) + '<b>' + f[1] + '</b>' + (f[0] === 'classic' && busy ? '<em class="bld-rec">Ieteicams</em>' : '') + '</button>';
      }).join('') + '</div>'
        + '<div class="bld-sub">Ko rādīt</div><div class="bld-chips bld-parts">'
        + '<button type="button" data-essential class="bld-chip-strong">Tikai svarīgais</button>'
        + PARTS.map(function (p) { return '<button type="button" data-part="' + p[0] + '" aria-pressed="' + !!(cur.parts[p[0]] && cur.parts[p[0]][3]) + '">' + p[1] + '</button>'; }).join('') + '</div>';
    } else if (step === 'colors') {
      if (!B.pal) html += '<p class="bld-wait">Nolasa bildes krāsas…</p>';
      else {
        var src = rgb(B.pal.source) || [60, 60, 60], C = window.MinkaContrast, list = variants(B.pal, draft.fx), best = null;
        // Measured against the pixels really under the numeral and the name on the
        // preview (the effect included); the picture's mean only when there is no report.
        var rp = ctx.report(), part = function (k) { return rp && rp.parts ? rp.parts.filter(function (x) { return x.key === k; })[0] : null; };
        var hp = part('hours'), np = part('name');
        list.forEach(function (v) {
          if (C && hp) {
            v.ratio = C.ratioFor('#' + hex(v.num), hp.leaves);
            v.score = Math.min(v.ratio / hp.need, np ? C.ratioFor('#' + hex(v.txt), np.leaves) / np.need : 9);
          } else { v.ratio = C ? C.ratio(v.num, src) : 0; v.score = v.ratio / 3; }
          if (!best || v.score > best.score) best = v;
        });
        html += '<div class="bld-grid bld-colors">' + list.map(function (v) {
          var ok = v.score >= 1;
          return '<button type="button" class="bld-tile" data-colors="' + v.key + '" aria-pressed="' + (B.colorKey === v.key) + '">'
            + '<span class="bld-swatch" style="background:rgb(' + src.join(',') + ')"><b style="color:rgb(' + v.num.map(Math.round).join(',') + ')">12</b><i style="color:rgb(' + v.txt.map(Math.round).join(',') + ')">Aa</i></span>'
            + '<b>' + v.label + '</b><span class="bld-mini ' + (ok ? 'is-pass' : 'is-fail') + '">' + v.ratio.toFixed(1) + (ok ? ' ✓' : ' ✕') + '</span>'
            + (v === best ? '<em class="bld-rec">Ieteicams</em>' : '') + '</button>';
        }).join('') + '</div><p class="bld-note">Birka rāda cipara kontrastu pret to, kas ir tieši zem tā. Zaļa nozīmē, ka lasās arī vārds.</p>';
      }
    } else if (step === 'digits') {
      var f0 = draft.face || M().preset('classic'), tint = '#' + (f0.tint || 'd5e6ef');
      var busy2 = !isCalm(draft.id) || kit.BUSY_FX.test(draft.fx || '');
      html += '<div class="bld-grid bld-finish wf-segment">' + FINISHES.map(function (t, i) {
        var rec = busy2 ? (i === 2 || i === 5) : i === 0;
        return '<button type="button" class="bld-tile" data-finish-pick="' + i + '" data-watch-finish="' + i + '" style="--wf-tint:' + tint + '" aria-pressed="' + ((f0.finish || 0) === i) + '"><b class="wf-number-sample" aria-hidden="true">12</b><span>' + t + '</span>' + (rec ? '<em class="bld-rec">Ieteicams</em>' : '') + '</button>';
      }).join('') + '</div>';
    } else if (step === 'timer') {
      var tm = String(draft.tm || ''), F = window.MinkaCardFaces, skins = (F && F.dialSkins) || [];
      html += '<div class="bld-grid bld-timers"><button type="button" class="bld-tile" data-tm="" aria-pressed="' + !tm + '"><span class="bld-digital">7:42<small>LĪDZ 20:00</small></span><b>Cipari</b></button>'
        + skins.map(function (k) {
          var key = k[0] + '21';
          return '<button type="button" class="bld-tile" data-tm="' + key + '" aria-pressed="' + (tm[0] === k[0]) + '"><span class="wf-dial-mini"><span class="mk-wf-dial f1 sk-' + k[0] + '">' + (F && F.dialPreview ? F.dialPreview(key) : '') + '</span></span><b>' + k[1] + '</b>' + (k[0] === 'a' ? '<em class="bld-rec">Ieteicams</em>' : '') + '</button>';
        }).join('')
        // The M3 digital readouts, beside the dials.
        + ((F && F.digitSkins) || []).map(function (k) {
          var key = k[0] + '11';
          return '<button type="button" class="bld-tile" data-tm="' + key + '" aria-pressed="' + (tm === key) + '"><span class="wf-digit-mini">' + F.digitPreview(key) + '</span><b>' + k[1] + '</b></button>';
        }).join('') + '</div>';
    } else if (step === 'decor') {
      var A = window.MinkaCardAddons, have = ctx.addons().map(function (a) { return a.id; });
      if (!B.decorPick) {
        var items = (A && A.items || []).filter(function (i) { return !i.hidden && !i.dynamic && !i.flat && /^(object|charm|topper|sticker|chrome)$/.test(i.group); });
        var by = {}; items.forEach(function (i) { (by[i.group] = by[i.group] || []).push(i); });
        var pick = [];
        Object.keys(by).forEach(function (g) { var arr = by[g].slice().sort(function () { return Math.random() - .5; }); pick = pick.concat(arr.slice(0, g === 'object' ? 4 : 2)); });
        B.decorPick = pick.slice(0, 11).map(function (i) { return i.id; });
      }
      html += '<div class="bld-grid bld-decor"><button type="button" class="bld-tile" data-decor="" aria-pressed="' + !have.length + '"><span class="bld-none">∅</span><b>Bez dekora</b></button>'
        + B.decorPick.map(function (id) {
          var item = (A.items || []).filter(function (i) { return i.id === id; })[0];
          return '<button type="button" class="bld-tile" data-decor="' + esc(id) + '" aria-pressed="' + (have.indexOf(id) >= 0) + '"><img alt="" loading="lazy" decoding="async" src="' + esc(A.src(id)) + '"><b>' + esc(item ? item.label : '') + '</b></button>';
        }).join('') + '</div><button type="button" class="bld-more" data-more-decor>Citi dekori</button>';
    } else {
      var rep = ctx.report(), score = window.MinkaContrast && rep ? window.MinkaContrast.scoreOf(rep) : 0;
      var extras = (draft.fx ? 1 : 0) + (ctx.addons().length ? 1 : 0) + (draft.tm ? 1 : 0);
      var stars = 1 + (score >= 1 ? 1 : 0) + (score >= 1 && extras >= 2 ? 1 : 0);
      var badges = [];
      if (score >= 1) badges.push(['Salasāms', 'Viss teksts iziet kontrastu']);
      if (draft.fx) badges.push(['Eksperimentētājs', 'Bildei ir efekts']);
      if (draft.tm) badges.push(['Laika meistars', /^[a-h]/.test(draft.tm) ? 'Analogs taimeris' : 'M3 cipari']);
      if (ctx.addons().length >= 3) badges.push(['Kolekcionārs', 'Trīs dekori']);
      var shown = draft.face ? Object.keys(draft.face.parts).filter(function (k) { return draft.face.parts[k][3]; }).length : 9;
      if (shown <= 5) badges.push(['Minimālists', 'Tikai svarīgais']);
      html += '<div class="bld-done"><div class="bld-stars" aria-label="' + stars + ' no 3 zvaigznēm">' + [1, 2, 3].map(function (i) { return '<span class="' + (i <= stars ? 'on' : '') + '">★</span>'; }).join('') + '</div>'
        + '<strong>' + B.xp + ' punkti</strong>'
        + (stars < 3 ? '<p class="bld-note">' + (score < 1 ? (stars === 1 ? 'Otrā' : 'Trešā') + ' zvaigzne: salabo salasāmību (ieteikums zemāk).' : 'Trešā zvaigzne: pievieno vēl kādu no šiem: efektu, dekoru vai analogo taimeri.') + '</p>' : '<p class="bld-note">Perfekti. Kartīte ir gatava.</p>')
        + '<ul class="bld-badges">' + badges.map(function (b) { return '<li><b>' + b[0] + '</b><small>' + b[1] + '</small></li>'; }).join('') + '</ul>'
        + '<div class="bld-done-actions"><button type="button" class="bld-finish-btn" data-finish>Saglabāt kartīti</button><button type="button" class="bld-ghost" data-restart>Sākt no jauna</button></div></div>';
    }
    return html;
  }

  function render(host) {
    var panel = host.querySelector('.bld'); if (!panel || !B) return;
    var s = STEPS[B.step], last = STEPS.length - 1;
    panel.querySelector('.bld-dots').innerHTML = STEPS.map(function (st, i) {
      return '<li class="' + (i < B.step ? 'is-done' : i === B.step ? 'is-now' : '') + '"><button type="button" data-go="' + i + '" aria-label="' + st.label + '"' + (i === B.step ? ' aria-current="step"' : '') + '></button></li>';
    }).join('');
    panel.querySelector('.bld-h').innerHTML = '<small>' + (B.step < last ? 'Solis ' + (B.step + 1) + ' no ' + last : 'Gatavs') + '</small><h3>' + s.title + '</h3>' + (s.tip ? '<p>' + s.tip + '</p>' : '');
    panel.querySelector('.bld-body').innerHTML = body(host);
    panel.querySelector('.bld-prev').disabled = B.step === 0;
    var next = panel.querySelector('.bld-next');
    next.hidden = B.step === last;
    next.textContent = B.step === last - 1 ? 'Pabeigt' : 'Tālāk';
    panel.querySelector('.bld-foot').hidden = B.step === last;
    after(host);
  }
  // Work that needs the tiles in the DOM: photo calmness badges, effect thumbnails.
  function after(host) {
    var ctx = ctxOf(host), step = STEPS[B.step].key, kit = K();
    if (step === 'bg') {
      host.querySelectorAll('.bld-pics [data-bg]').forEach(function (b) {
        var img = b.querySelector('img'), id = b.dataset.bg;
        var mark = function () { var sd = calmOf(img, id); if (sd != null && sd < .15) b.querySelector('.bld-badge').hidden = false; };
        if (img.complete && img.naturalWidth) mark(); else img.addEventListener('load', mark, { once: true });
      });
    } else if (step === 'fx') {
      var D = window.MinkaDither, draft = ctx.draft(); if (!D || draft.t !== 'img') return;
      var src = kit.imgUrl(draft.id), k = Math.max(1, Math.round(window.devicePixelRatio || 1));
      var ink = B.pal ? B.pal.ink : [236, 234, 228], modes = window.MinkaEffectThumbModes ? window.MinkaEffectThumbModes(ink, k) : {};
      host.querySelectorAll('.bld-fx [data-fx]').forEach(function (b) {
        var t = b.querySelector('.bld-thumb'), o = modes[b.dataset.fx];
        if (!b.dataset.fx) { t.style.backgroundImage = 'url("' + src + '")'; return; }
        if (b.dataset.fx === 'split' || b.dataset.fx === 'focus') o = modes[b.dataset.fx];
        if (!o) return;
        D.url(src, Object.assign({ box: [64, 64], pos: [.5, .5], stale: function () { return !b.isConnected; } }, o)).then(D.ready || function (u) { return u; }).then(function (u) { if (b.isConnected) t.style.backgroundImage = 'url("' + u + '")'; }, function () {});
      });
    }
  }

  function update(host, skin, opts) { ctxOf(host).set(skin, opts); }
  function withPalette(host, skin) {
    var kit = K();
    return kit.palette(skin).then(function (pal) { B.pal = pal; return pal; });
  }

  function pick(host, el) {
    var ctx = ctxOf(host), kit = K(), draft = clone(ctx.draft()), step = STEPS[B.step].key;
    if (!draft.face) draft.face = M().preset('classic');
    if (el.dataset.mood != null) { B.mood = el.dataset.mood; B.bgPage = 0; render(host); return; }
    if (el.hasAttribute('data-more')) { B.bgPage = (B.bgPage || 0) + 1; render(host); return; }
    if (el.hasAttribute('data-more-decor')) { B.decorPick = null; render(host); return; }
    if (el.dataset.go != null) { var g = +el.dataset.go; if (g <= Math.max(B.step, B.reached || 0)) { B.step = g; render(host); } return; }
    if (step === 'bg' && el.dataset.bg) {
      draft.t = 'img'; draft.id = el.dataset.bg; delete draft.rgb;
      var recBg = isCalm(draft.id);
      withPalette(host, draft).then(function (pal) {
        kit.harmonize(draft, pal, { force: true });
        update(host, draft, { fix: true });
        award(host, 'bg', 10);
        if (recBg) award(host, 'bg-smart', 5, 'gudri');
        render(host);
      });
      return;
    }
    if (step === 'fx' && el.dataset.fx != null) {
      var fx = el.dataset.fx, rec = recommendFx(B.pal, isCalm(draft.id)).indexOf(fx) >= 0;
      if (fx) { draft.fx = fx; draft.fxs = draft.fxs || '1.55'; } else { delete draft.fx; delete draft.fxs; }
      if (B.pal) kit.harmonize(draft, B.pal, { force: true });
      if (kit.BUSY_FX.test(fx) && draft.face.finish !== 2 && draft.face.finish !== 5) B.hint = { text: 'Raibs efekts: cipari lasīsies labāk ar materiālu Tīrs.', act: 'finish2', label: 'Ieslēgt Tīrs' };
      update(host, draft, { fix: true });
      award(host, 'fx', 10);
      if (rec && fx) award(host, 'fx-smart', 5, 'gudri');
      render(host); showHint(host);
      return;
    }
    if (step === 'layout') {
      var face = draft.face;
      if (el.dataset.face) {
        var next = M().preset(el.dataset.face, face);
        M().parts.forEach(function (k) { next.parts[k][3] = face.parts[k][3]; });
        next.colors = face.colors; next.finish = face.finish;
        draft.face = next;
      } else if (el.hasAttribute('data-essential')) {
        M().parts.forEach(function (k) { face.parts[k][3] = ESSENTIAL[k] ? 1 : 0; });
        award(host, 'layout-min', 5, 'tīri');
      } else if (el.dataset.part) {
        var p = face.parts[el.dataset.part]; p[3] = p[3] ? 0 : 1;
      } else return;
      if (/^[a-h]/.test(draft.tm || '')) M().fitDial(draft.face);
      update(host, draft, { fix: true });
      award(host, 'layout', 10);
      render(host);
      return;
    }
    if (step === 'colors' && el.dataset.colors && B.pal) {
      var v = variants(B.pal, draft.fx).filter(function (x) { return x.key === el.dataset.colors; })[0];
      kit.harmonize(draft, B.pal, { force: true });
      var numHex = hex(v.num);
      if (!v.inked) draft.num = v.num.map(Math.round).join(',');
      draft.face.tint = numHex;
      if (v.inked && v.key !== 'auto') draft.face.colors.hours = numHex;
      draft.txt = v.txt.map(Math.round).join(',');
      B.colorKey = v.key;
      update(host, draft, { fix: false });
      award(host, 'colors', 10);
      render(host);
      return;
    }
    if (step === 'digits' && el.dataset.finishPick != null) {
      draft.face.finish = +el.dataset.finishPick;
      update(host, draft, { fix: false });
      award(host, 'digits', 10);
      render(host);
      return;
    }
    if (step === 'timer' && el.dataset.tm != null) {
      var tm = el.dataset.tm;
      if (tm) { draft.tm = tm; if (/^[a-h]/.test(tm)) M().fitDial(draft.face); } else delete draft.tm;
      update(host, draft, { fix: false });
      award(host, 'timer', 10);
      render(host);
      return;
    }
    if (step === 'decor' && el.dataset.decor != null) {
      var list = ctx.addons().slice(), id = el.dataset.decor;
      if (!id) list = [];
      else {
        var at = -1; list.forEach(function (a, i) { if (a.id === id) at = i; });
        if (at >= 0) list.splice(at, 1);
        else {
          if (list.length >= 3) list.shift();
          var add = { id: id, scale: .9, side: list.some(function (a) { return a.side === 'right'; }) ? 'left' : 'right', x: 0, y: 0 };
          list.push(B.pal ? kit.harmonizeAddon(add, B.pal) : add);
        }
      }
      ctx.setAddons(list);
      award(host, 'decor', 10);
      if (list.length >= 3) award(host, 'decor-3', 5, 'kolekcija');
      render(host);
      return;
    }
    if (el.hasAttribute('data-finish')) { close(host, true); return; }
    if (el.hasAttribute('data-restart')) { start(host, true); return; }
  }

  function showHint(host) {
    var box = host.querySelector('.bld-tip'); if (!box) return;
    var rep = ctxOf(host).report(), C = window.MinkaContrast, h = B.hint;
    // A failing text wins over any other advice: it is what the person would notice first.
    if (rep && C && !rep.ok && rep.worst) {
      var w = rep.worst, from = C.parseColor(w.fg), sg = C.suggest(from ? from.slice(0, 3) : [255, 255, 255], w.leaves, null), d0 = ctxOf(host).draft();
      // No colour reads on this busy spot: the dark tone calms the whole picture.
      var under = UNDER[w.key] || w.label.toLowerCase(), tuneC = /^\d\.\d\d$/.test(String(d0.fxs || '')) ? +String(d0.fxs).slice(-1) : 5;
      // First a plate behind just that element (the rest of the card stays as it is).
      var M = window.MinkaCardFaceModel, plateOk = d0.face && M && (M.plateParts || []).indexOf(w.key) >= 0 && d0.face.face !== 'winamp' && !((d0.face.plates || {})[w.key] % 2);
      if (!sg.reaches && plateOk) h = { text: 'Fons zem ' + under + ' ir ļoti raibs (' + w.ratio.toFixed(2) + '). Plāksne aiz tā padarīs to skaidri salasāmu.', act: 'plate:' + w.key, label: 'Plāksne' };
      else if (!sg.reaches && d0.face && d0.face.fullTintMode !== 1) h = { text: 'Fons zem ' + under + ' ir ļoti raibs (' + w.ratio.toFixed(2) + '). Tumšs tonis to nomierinās.', act: 'dark', label: 'Tumšs tonis' };
      // Still too busy: a softer effect (its contrast down), then moving the element.
      else if (!sg.reaches && d0.fx && tuneC > 2) h = { text: 'Efekts zem ' + under + ' joprojām ir par raibu (' + w.ratio.toFixed(2) + '). Maigāks efekts palīdzēs.', act: 'soft', label: 'Maigāks efekts' };
      else if (!sg.reaches) h = { text: 'Zem ' + under + ' neder neviena krāsa (' + w.ratio.toFixed(2) + '). Pārvelc to uz mierīgāku vietu kartītē vai paslēp solī Izkārtojums.', act: '', label: '' };
      else h = { text: 'Grūti salasīt: ' + w.label + ' (' + w.ratio.toFixed(2) + ', vajag ' + w.need + ').', act: 'fix', label: 'Salabot' };
    }
    if (!h) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<span class="bld-tip-ico" aria-hidden="true">✦</span><p>' + esc(h.text) + '</p>' + (h.act ? '<button type="button" data-hint="' + h.act + '">' + esc(h.label) + '</button>' : '');
  }
  function meter(host, rep) {
    var m = host.querySelector('.bld-meter'); if (!m || !rep || !window.MinkaContrast) return;
    var sc = window.MinkaContrast.scoreOf(rep), pct = Math.round(Math.max(.05, Math.min(1, sc / 1.4)) * 100), ok = sc >= 1;
    m.dataset.state = rep.unknown ? 'unknown' : ok ? 'pass' : sc >= .8 ? 'near' : 'fail';
    m.querySelector('.bld-meter-bar i').style.transform = 'scaleX(' + (pct / 100).toFixed(3) + ')';
    m.querySelector('em').textContent = rep.unknown ? 'nav zināms' : (rep.worst ? rep.worst.ratio.toFixed(2) : '') + (ok ? ' Pass ✓' : ' Fail ✕');
    if (ok && B && B.fixing) { B.fixing = false; award(host, 'fixed', 10, 'salabots'); }
    if (ok && B && B.step > 0) award(host, 'read-' + STEPS[B.step].key, 5, 'salasāms');
    showHint(host);
    // Steps whose tiles read the measurement redraw with it.
    if (B && /^(done|colors)$/.test(STEPS[B.step].key)) render(host);
  }

  function start(host, fresh) {
    var ctx = ctxOf(host); if (!ctx) return;
    var kit = K(), draft = clone(ctx.draft() || {});
    ctx.undoPush();
    B = { name: ctx.name, step: 0, reached: 0, xp: 0, done: {}, pal: null, mood: '', hint: null };
    // From scratch: a calm classic card; the person's own element choices, emoji and timer stay.
    var face = M().preset('classic');
    if (draft.face) M().parts.forEach(function (k) { if (draft.face.parts && draft.face.parts[k]) face.parts[k][3] = draft.face.parts[k][3]; });
    var fresh0 = { t: 'img', id: (kit.SCENIC_SKINS[0] || {}).id || 'open-blue', face: face, depth: false };
    ['em', 'emn', 'tm'].forEach(function (k) { if (draft[k] != null) fresh0[k] = draft[k]; });
    if (/^[a-h]/.test(fresh0.tm || '')) M().fitDial(fresh0.face);
    withPalette(host, fresh0).then(function (pal) { kit.harmonize(fresh0, pal, { force: true }); update(host, fresh0, { fix: true }); });
    open(host);
  }
  function open(host) {
    var editor = host.querySelector('.mk-skin-editor'), shell = host.querySelector('.mk-skin-shell');
    if (!editor || !shell) return;
    var panel = host.querySelector('.bld');
    if (!panel) {
      panel = document.createElement('section'); panel.className = 'bld'; panel.setAttribute('aria-label', 'Būvētājs');
      panel.innerHTML = '<div class="bld-top"><button type="button" class="bld-x" aria-label="Aizvērt būvētāju" title="Saglabāt un aizvērt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
        + '<ol class="bld-dots"></ol><span class="bld-xp" title="Punkti"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg><b>0</b></span></div>'
        + '<div class="bld-meter" data-state="unknown"><b>Salasāmība</b><span class="bld-meter-bar"><i></i></span><em>mēra…</em></div>'
        + '<header class="bld-h"></header><div class="bld-body"></div><aside class="bld-tip" hidden></aside>'
        + '<footer class="bld-foot"><button type="button" class="bld-prev">Atpakaļ</button><button type="button" class="bld-next">Tālāk</button></footer>';
      editor.prepend(panel);
      panel.addEventListener('click', function (e) {
        var t = e.target.closest('button'); if (!t || !B) return;
        if (t.classList.contains('bld-x')) { close(host, true); return; }
        if (t.classList.contains('bld-prev')) { B.step = Math.max(0, B.step - 1); B.hint = null; render(host); showHint(host); return; }
        if (t.classList.contains('bld-next')) {
          B.step = Math.min(STEPS.length - 1, B.step + 1); B.reached = Math.max(B.reached || 0, B.step); B.hint = null;
          if (STEPS[B.step].key === 'done') { award(host, 'finish', 25, 'gatavs'); confetti(host, 22); }
          else if (B.done[STEPS[B.step - 1].key]) confetti(host, 8);
          render(host); showHint(host);
          return;
        }
        if (t.dataset.hint) {
          var ctx = ctxOf(host);
          if (t.dataset.hint === 'fix') { if (ctx.fixContrast()) B.fixing = true; }
          else if (t.dataset.hint === 'finish2') { var d = clone(ctx.draft()); d.face.finish = 2; update(host, d, {}); }
          else if (t.dataset.hint === 'soft') { var d3 = clone(ctx.draft()), fs = /^\d\.\d\d$/.test(String(d3.fxs || '')) ? String(d3.fxs) : '1.55'; d3.fxs = fs.slice(0, 3) + '2'; B.fixing = true; update(host, d3, { fix: true }); }
          else if (t.dataset.hint === 'dark') { var d2 = clone(ctx.draft()); d2.face.fullTintMode = 1; B.fixing = true; update(host, d2, { fix: true }); }
          else if (t.dataset.hint.indexOf('plate:') === 0) { var d4 = clone(ctx.draft()); d4.face.plates = d4.face.plates || {}; d4.face.plates[t.dataset.hint.slice(6)] = 1; B.fixing = true; update(host, d4, { fix: true }); }
          B.hint = null; showHint(host);
          return;
        }
        pick(host, t);
      });
    }
    shell.classList.add('is-building');
    host.__onContrast = function (rep) { meter(host, rep); };
    var ctx = ctxOf(host); if (ctx && ctx.report()) meter(host, ctx.report());
    if (!B.pal) withPalette(host, ctxOf(host).draft()).then(function () { if (STEPS[B.step].key === 'colors' || STEPS[B.step].key === 'fx') render(host); });
    render(host);
    var xp = panel.querySelector('.bld-xp b'); if (xp) xp.textContent = B.xp;
  }
  function close(host, save) {
    var ctx = ctxOf(host);
    B = null;
    host.__onContrast = null;
    var shell = host.querySelector('.mk-skin-shell'); if (shell) shell.classList.remove('is-building');
    var panel = host.querySelector('.bld'); if (panel) panel.remove();
    if (save && ctx) ctx.finish();
  }

  function entry(host) {
    var presets = host.querySelector('[data-skin-panel="presets"]');
    if (!presets || presets.querySelector('.bld-entry')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'bld-entry';
    b.innerHTML = '<span class="bld-entry-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg></span>'
      + '<span><b>Būvē savu kartīti</b><small>7 soļi ar ieteikumiem, salasāmības pārbaude un punkti</small></span><i aria-hidden="true">→</i>';
    b.addEventListener('click', function () { start(host); });
    presets.prepend(b);
  }

  function mount(host) {
    if (!host || !host.querySelector('.mk-skin-editor') || !ctxOf(host) || !K() || !M()) return;
    entry(host);
    // A re-render while building (a sync, an undo) re-opens the same step.
    if (B && B.name === ctxOf(host).name) open(host);
    else if (B) B = null;
  }
  // Outermost of the render wrappers (after skin-organize has arranged the tabs);
  // the others' markers are carried over so none of them wraps twice.
  function wrap(force) {
    var render0 = window.mkRenderSkinPicker;
    if (typeof render0 !== 'function') return false;
    if (render0.__bld) return true;
    if (!window.MinkaEffectThumbModes && !force) return false;   // skin-organize has run (it wraps on load)
    var wrapped = function (host) { var r = render0.apply(this, arguments); try { mount(host); } catch (e) { console.warn('skin-builder', e); } return r; };
    wrapped.__bld = true; wrapped.__organized = render0.__organized; wrapped.__addonsWrapped = render0.__addonsWrapped;
    window.mkRenderSkinPicker = wrapped;
    return true;
  }
  if (!wrap()) { var tries = 0, timer = setInterval(function () { if (wrap(++tries > 40)) clearInterval(timer); }, 250); }
  window.MinkaSkinBuilder = { start: function (host) { start(host); }, active: function () { return !!B; } };
})();
