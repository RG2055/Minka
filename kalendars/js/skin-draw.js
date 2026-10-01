(function MinkaSkinDraw() {
  'use strict';

  /* The drawing editor (a card's own background, and the night chalkboard).
     M3 layout: tools on a rail on the left, the canvas in the middle, colour,
     brush and background on the right; undo/redo/clear in the header.
     Layers: the background (colour or the earlier picture), the ink (every
     stroke, so the eraser only takes ink) and the stroke being drawn. */
  var SIZE = 384;
  var PREVIEW_SIZE = 220;
  var MAX_BYTES = 96 * 1024;
  var MAX_UNDO_STROKES = 160;
  var RECENT_KEY = 'minka:draw-recent';
  // No purple anywhere; light and dark neutrals first.
  var PALETTE = ['#f8fafc', '#111418', '#ff5a5f', '#ff9f43', '#ffd166', '#7bd88f', '#2ec4b6', '#4dabf7', '#1c7ed6', '#f783ac', '#c8a27a', '#8d99ae'];
  var BACKGROUNDS = ['#0b1019', '#10241c', '#2a1414', '#0d1b2a', '#f4efe6', '#e8f1f8'];

  var I = function (d, extra) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>'; };
  var ICON = {
    pen: I('<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z"/><path d="M13.5 7.5l3 3"/>'),
    neon: I('<path d="M3.5 15.5c2.6-5.2 4.6 3.2 7.6-2s5 3.2 9.4-3"/><path d="M18 4v2M17 5h2"/>'),
    marker: I('<path d="M14.5 4.5l5 5-7.5 7.5H7.5V12.5z"/><path d="M7.5 17L5 19.5M4 20.5h8"/>'),
    spray: I('<rect x="6.5" y="9.5" width="7" height="11" rx="2"/><path d="M8.5 9.5v-3h3v3"/><path class="f" d="M16.5 6.5h.01M18.5 4.5h.01M18.5 8.5h.01M20.5 6.5h.01"/>'),
    eraser: I('<path d="M15.5 4.5l4 4-9.5 9.5H6l-2-2 11.5-11.5z"/><path d="M9 9l6 6M10.5 19.5H20"/>'),
    line: I('<path d="M5 19L19 5"/>'),
    arrow: I('<path d="M5 19L19 5"/><path d="M10 5h9v9"/>'),
    rect: I('<rect x="4.5" y="6" width="15" height="12" rx="2.5"/>'),
    circle: I('<circle cx="12" cy="12" r="7.5"/>'),
    star: I('<path d="M12 3.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z"/>'),
    heart: I('<path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z"/>'),
    spark: I('<path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9z"/>'),
    dither: I('<path class="f" d="M6 6h.01M18 6h.01M9 10h.01M15 10h.01M6 14h.01M12 14h.01M18 14h.01M9 18h.01M15 18h.01M6 18h.01M12 18h.01M18 18h.01"/>'),
    undo: I('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
    redo: I('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
    clear: I('<path d="M5 7h14M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
    close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    brush: I('<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z"/><path d="M13.5 7.5l3 3"/>'),
    plus: I('<path d="M12 6v12M6 12h12"/>')
  };
  var TOOLS = [
    ['Otas', [['pen', 'Pildspalva'], ['neon', 'Neons'], ['marker', 'Marķieris'], ['spray', 'Aerosols'], ['dither', 'Dither'], ['eraser', 'Dzēšgumija']]],
    ['Figūras', [['line', 'Līnija'], ['arrow', 'Bulta'], ['rect', 'Taisnstūris'], ['circle', 'Aplis']]],
    ['Zīmogi', [['star', 'Zvaigzne'], ['heart', 'Sirds'], ['spark', 'Dzirksts']]]
  ];
  var FREEHAND = { pen: 1, neon: 1, marker: 1, spray: 1, dither: 1, eraser: 1 };
  // ordered (Bayer 4×4) dots, the app's dither: a soft brush and a background
  var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var DOT = 2;
  var STAMP = { star: 1, heart: 1, spark: 1 };

  function toast(message, type) {
    if (typeof window._mkToast === 'function') window._mkToast(message, type || 'ok');
  }
  function canvasBlob(canvas, quality) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/webp', quality); });
  }
  async function compactWebp(canvas) {
    var qualities = [0.84, 0.70, 0.56, 0.44];
    for (var i = 0; i < qualities.length; i++) {
      var blob = await canvasBlob(canvas, qualities[i]);
      if (blob && blob.type === 'image/webp' && blob.size <= MAX_BYTES) return blob;
    }
    return null;
  }
  function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
  }
  function readRecent() { try { var a = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(a) ? a.filter(function (c) { return /^#[0-9a-f]{6}$/i.test(c); }).slice(0, 6) : []; } catch (_e) { return []; } }
  function writeRecent(list) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6))); } catch (_e) {} }
  function mixWhite(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r + (255 - r) * k) + ',' + Math.round(g + (255 - g) * k) + ',' + Math.round(b + (255 - b) * k) + ')';
  }
  // A small seeded random, so a spray stroke looks the same every time it is redrawn.
  function rng(seed) { seed = (seed >>> 0) || 1; return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  function open(options) {
    options = options || {};
    var chalkboardMode = options.mode === 'chalkboard';
    // A drawing for the comments and the mood sky: transparent, drawn on the
    // night sky it will float in (mood-feedback.js).
    var skyMode = options.mode === 'sky';
    var DRAW_W = chalkboardMode ? 480 : SIZE;
    var DRAW_H = chalkboardMode ? 270 : SIZE;
    var old = document.querySelector('.mk-draw-overlay');
    if (old) old.remove();

    var name = String(options.name || 'Darbinieks').trim();
    var nameParts = name.split(/\s+/);
    var firstName = nameParts.shift() || 'Darbinieks';
    var lastName = nameParts.join(' ');
    var recent = readRecent();
    var slider = function (cls, label, min, max, value, unit) {
      return '<label class="dr-slider ' + cls + '"><input type="range" min="' + min + '" max="' + max + '" step="1" value="' + value + '" aria-label="' + label + '">'
        + '<span class="dr-slider-fill" aria-hidden="true"></span><span class="dr-slider-label">' + label + '</span><output>' + value + unit + '</output></label>';
    };
    var overlay = document.createElement('div');
    overlay.className = 'mk-draw-overlay' + (chalkboardMode ? ' is-chalkboard' : '') + (skyMode ? ' is-sky' : '');
    overlay.innerHTML = ''
      + '<section class="mk-draw-dialog" role="dialog" aria-modal="true" aria-labelledby="mkDrawTitle">'
      + '<header class="dr-head"><span class="dr-head-ico">' + ICON.brush + '</span>'
      + '<div class="dr-title"><h3 id="mkDrawTitle">' + (chalkboardMode ? 'Nakts tāfele' : skyMode ? 'Uzzīmē' : 'Zīmē savu fonu') + '</h3><span class="mk-draw-worker"></span></div>'
      + '<div class="dr-head-actions">'
      + '<button type="button" class="dr-icon mk-draw-undo" aria-label="Atsaukt" title="Atsaukt (Ctrl+Z)" disabled>' + ICON.undo + '</button>'
      + '<button type="button" class="dr-icon mk-draw-redo" aria-label="Atkārtot" title="Atkārtot (Ctrl+Shift+Z)" disabled>' + ICON.redo + '</button>'
      + '<button type="button" class="dr-icon mk-draw-clear" aria-label="Notīrīt zīmējumu" title="Notīrīt zīmējumu">' + ICON.clear + '</button>'
      + '<span class="dr-sep" aria-hidden="true"></span>'
      + '<button type="button" class="dr-icon mk-draw-close" aria-label="Aizvērt" title="Aizvērt">' + ICON.close + '</button></div></header>'
      + '<div class="dr-body">'
      + '<nav class="dr-rail" aria-label="Zīmēšanas rīki">'
      + TOOLS.map(function (group) {
          return '<div class="dr-group" role="group" aria-label="' + group[0] + '">' + group[1].map(function (t) {
            return '<button type="button" class="dr-tool' + (t[0] === 'pen' ? ' is-active' : '') + '" data-tool="' + t[0] + '" aria-pressed="' + (t[0] === 'pen') + '" title="' + t[1] + '">'
              + '<span class="dr-tool-ico">' + ICON[t[0]] + '</span><span class="dr-tool-name">' + t[1] + '</span></button>';
          }).join('') + '</div>';
        }).join('')
      + '</nav>'
      + '<div class="dr-stage"><canvas class="mk-draw-canvas" width="' + DRAW_W + '" height="' + DRAW_H + '"></canvas></div>'
      + '<aside class="dr-panel">'
      + '<section class="dr-card"><h4>Krāsa</h4><div class="dr-swatches" role="group" aria-label="Krāsa">'
      + PALETTE.map(function (c, i) { return '<button type="button" class="dr-swatch' + (i === 0 ? ' is-active' : '') + '" data-color="' + c + '" style="--c:' + c + '" aria-label="Krāsa ' + c + '"></button>'; }).join('')
      + '<label class="dr-swatch dr-swatch-own" title="Sava krāsa">' + ICON.plus + '<input type="color" class="mk-draw-color" value="#f8fafc" aria-label="Sava krāsa"></label></div>'
      + '<div class="dr-recent" aria-label="Nesen lietotās"></div></section>'
      + '<section class="dr-card">'
      + slider('mk-draw-size-control', 'Biezums', 2, 36, 7, '')
      + slider('mk-draw-alpha-control', 'Necaurspīdīgums', 10, 100, 100, '%')
      + '<div class="dr-seg mk-draw-fill-shape" role="group" aria-label="Figūra"><button type="button" data-shape-fill="0" aria-pressed="true">Kontūra</button><button type="button" data-shape-fill="1" aria-pressed="false">Pildīta</button></div>'
      + '</section>'
      + '<section class="dr-card"><h4>Fons</h4><div class="dr-swatches dr-bgs" role="group" aria-label="Fona krāsa">'
      + BACKGROUNDS.map(function (c) { return '<button type="button" class="dr-swatch" data-bg="' + c + '" style="--c:' + c + '" aria-label="Fons ' + c + '"></button>'; }).join('')
      + '<label class="dr-swatch dr-swatch-own" title="Sava fona krāsa">' + ICON.plus + '<input type="color" class="mk-draw-bg" value="#0b1019" aria-label="Sava fona krāsa"></label></div>'
      + '<div class="dr-chips" role="group" aria-label="Efekti">'
      + [['stars', 'Zvaigznes'], ['dots', 'Punkti'], ['dither', 'Dither'], ['grid', 'Režģis'], ['vignette', 'Vinjete']].map(function (e) { return '<button type="button" class="dr-chip mk-draw-effect" data-effect="' + e[0] + '">' + e[1] + '</button>'; }).join('')
      + '</div></section>'
      + '<section class="dr-card dr-preview-card"><h4>Kartē</h4><div class="mk-draw-card-preview">'
      + '<canvas class="mk-draw-preview" width="' + PREVIEW_SIZE + '" height="' + PREVIEW_SIZE + '"></canvas><div class="mk-draw-card-scrim"></div>'
      + '<strong class="mk-draw-card-initials"></strong><span class="mk-draw-card-month"><b></b><small>MĒNESĪ</small></span>'
      + '<span class="mk-draw-card-shift"></span><span class="mk-draw-card-name"></span><span class="mk-draw-card-last"></span>'
      + '<span class="mk-draw-card-fatigue"><i><em></em></i><b></b></span></div></section>'
      + '</aside></div>'
      + '<footer class="dr-foot"><span class="mk-draw-status" role="status"></span><button type="button" class="dr-btn dr-btn-text mk-draw-cancel">Atcelt</button>'
      + '<button type="button" class="dr-btn dr-btn-filled mk-draw-save">' + (chalkboardMode ? 'Saglabāt tāfeli' : skyMode ? 'Nosūtīt' : 'Saglabāt') + '</button></footer>'
      + '</section>';
    // The same tones as the card window (and its tint, when the card coloured it).
    var wm = document.getElementById('worker-modal');
    if (wm && !chalkboardMode && !skyMode) {
      var ws = getComputedStyle(wm);
      ['--pp-bg', '--pp-c1', '--pp-c2', '--pp-c3', '--pp-c4', '--pp-primary', '--pp-on-primary', '--pp-primary-c', '--pp-on-primary-c'].forEach(function (k) {
        var v = ws.getPropertyValue(k).trim(); if (v) overlay.style.setProperty(k, v);
      });
    }
    document.body.appendChild(overlay);
    // round the editor the same dithered work on blue as round the gallery (js/dither-backdrop.js)
    if (window.MinkaDitherBackdrop) window.MinkaDitherBackdrop.attach(overlay, { box: overlay.querySelector('.mk-draw-dialog') });

    overlay.querySelector('.mk-draw-worker').textContent = name;
    overlay.querySelector('.mk-draw-card-initials').textContent = initials(name);
    overlay.querySelector('.mk-draw-card-month b').textContent = String(options.monthHours || '0h');
    overlay.querySelector('.mk-draw-card-shift').textContent = String(options.shiftHours || '');
    overlay.querySelector('.mk-draw-card-name').textContent = firstName;
    overlay.querySelector('.mk-draw-card-last').textContent = lastName;
    overlay.querySelector('.mk-draw-card-fatigue b').textContent = String(options.fatigue || '');
    var fatigueValue = Math.max(0, Math.min(100, parseFloat(options.fatigue) || 0));
    overlay.querySelector('.mk-draw-card-fatigue em').style.width = fatigueValue + '%';
    if (options.role === 'rd') overlay.querySelector('.mk-draw-card-preview').classList.add('is-rd');
    // The preview is the person's own card (a still copy, its layout and colours as
    // they are), with the drawing as its background; updated after each stroke.
    var live = null, liveUrl = '', liveTimer = 0;
    if (options.card && options.card.getBoundingClientRect) {
      var src = options.card, sr = src.getBoundingClientRect(), holder = overlay.querySelector('.mk-draw-card-preview');
      if (sr.width && sr.height) {
        var wrap = document.createElement('div'); wrap.id = 'grafiks-list'; wrap.className = 'grid-view mk-skin-preview-list mk-draw-live';
        live = src.cloneNode(true);
        live.removeAttribute('data-worker'); live.querySelectorAll('[id],[data-worker]').forEach(function (el) { el.removeAttribute('id'); el.removeAttribute('data-worker'); });
        live.querySelectorAll('.mk-card-addon,.mk-card-addon-surface,.mk-wf-depth,.mk-wf-art,.mk-wf-effects,.mk-focus,.mk-poster,.wf-sel,.wf-edge,.wf-rim-knob,.wf-edge-mode,.wf-rim-tip,.wf-guides,.wf-ghost').forEach(function (el) { el.remove(); });
        live.querySelectorAll('button,input,select,textarea,a').forEach(function (el) { var span = document.createElement('span'); span.className = el.className; span.innerHTML = el.innerHTML; el.replaceWith(span); });
        live.className = live.className.replace(/\bmk-fx-[\w-]+|\bwf-editing\b|\bwf-scaled-preview\b|\bmk-depth-live\b/g, '').trim();
        live.classList.add('mk-has-skin');
        ['--wf-preview-width', '--wf-preview-height', '--wf-preview-scale', '--wf-preview-padding'].forEach(function (k) { live.style.removeProperty(k); });
        live.style.setProperty('width', sr.width + 'px', 'important'); live.style.setProperty('height', sr.height + 'px', 'important');
        live.style.setProperty('position', 'absolute', 'important'); live.style.setProperty('left', '0', 'important'); live.style.setProperty('top', '0', 'important');
        live.style.setProperty('transform-origin', 'top left', 'important'); live.style.setProperty('margin', '0', 'important');
        wrap.append(live); holder.append(wrap); holder.classList.add('is-live');   // the mock stays (hidden): its canvas is still drawn to
        holder.style.aspectRatio = sr.width + ' / ' + sr.height;
        var fit = function () { var w = holder.clientWidth; if (w) live.style.setProperty('transform', 'scale(' + (w / sr.width).toFixed(4) + ')', 'important'); };
        fit(); requestAnimationFrame(fit);
      }
    }
    function pushLive() {
      if (!live || closed) return;
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        if (closed) return;
        canvas.toBlob(function (blob) {
          if (!blob || closed) return;
          var url = URL.createObjectURL(blob), old = liveUrl; liveUrl = url;
          live.style.setProperty('--mk-skin-img', 'url("' + url + '")');
          if (old) setTimeout(function () { URL.revokeObjectURL(old); }, 500);
        }, 'image/webp', .82);
      }, 120);
    }

    var canvas = overlay.querySelector('.mk-draw-canvas');
    var ctx = canvas.getContext('2d', { alpha: true });
    var preview = overlay.querySelector('.mk-draw-preview');
    var previewCtx = preview.getContext('2d', { alpha: false });
    function layer() { var c = document.createElement('canvas'); c.width = DRAW_W; c.height = DRAW_H; return c; }
    var base = layer(), baseCtx = base.getContext('2d', { alpha: true });       // background: colour or the earlier picture
    var inkBase = layer(), inkBaseCtx = inkBase.getContext('2d', { alpha: true }); // strokes older than the undo reach
    var ink = layer(), inkCtx = ink.getContext('2d', { alpha: true });           // every stroke
    var strokes = [], redoStack = [];
    var current = null;
    var tool = 'pen';
    var color = '#f8fafc';
    var brushSize = 7;
    var alpha = 1;
    var bg = '#0b1019';
    var shapeFill = false;
    var closed = false;
    var dirty = false;
    var previewFrame = 0;

    function pathStar(target, x, y, radius, points) {
      target.beginPath();
      for (var i = 0; i < points * 2; i++) {
        var angle = -Math.PI / 2 + i * Math.PI / points;
        var r = i % 2 ? radius * 0.42 : radius;
        var px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
        if (!i) target.moveTo(px, py); else target.lineTo(px, py);
      }
      target.closePath();
    }
    function pathHeart(target, x, y, radius) {
      var r = radius / 2;
      target.beginPath();
      target.moveTo(x, y + radius * 0.75);
      target.bezierCurveTo(x - radius * 1.35, y, x - r, y - radius, x, y - radius * 0.35);
      target.bezierCurveTo(x + r, y - radius, x + radius * 1.35, y, x, y + radius * 0.75);
      target.closePath();
    }
    // A smooth freehand path (through the midpoints), not a polyline.
    function pathFree(target, pts) {
      target.beginPath(); target.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 2) { target.lineTo(pts[1].x, pts[1].y); return; }
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        target.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      var l = pts[pts.length - 1]; target.lineTo(l.x, l.y);
    }
    function drawEffect(target, stroke) {
      target.save();
      if (stroke.effect === 'vignette') {
        var maxSide = Math.max(DRAW_W, DRAW_H);
        var gradient = target.createRadialGradient(DRAW_W / 2, DRAW_H / 2, maxSide * 0.2, DRAW_W / 2, DRAW_H / 2, maxSide * 0.72);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,.68)');
        target.fillStyle = gradient;
        target.fillRect(0, 0, DRAW_W, DRAW_H);
      } else if (stroke.effect === 'dither') {
        target.fillStyle = stroke.color;
        for (var dy = 0; dy < DRAW_H; dy += DOT) {
          var dd = Math.pow(dy / DRAW_H, 1.3) * 0.9;
          for (var dx = 0; dx < DRAW_W; dx += DOT) {
            if ((BAYER4[((dy / DOT) & 3) * 4 + ((dx / DOT) & 3)] + 0.5) / 16 < dd) target.fillRect(dx, dy, DOT, DOT);
          }
        }
      } else if (stroke.effect === 'grid') {
        target.strokeStyle = stroke.color; target.globalAlpha = .24; target.lineWidth = 1;
        for (var gx = 24; gx < DRAW_W; gx += 24) { target.beginPath(); target.moveTo(gx, 0); target.lineTo(gx, DRAW_H); target.stroke(); }
        for (var gy = 24; gy < DRAW_H; gy += 24) { target.beginPath(); target.moveTo(0, gy); target.lineTo(DRAW_W, gy); target.stroke(); }
      } else {
        target.fillStyle = stroke.color;
        stroke.points.forEach(function (point, index) {
          target.globalAlpha = point.a;
          if (stroke.effect === 'stars') { pathStar(target, point.x, point.y, point.r, index % 3 ? 4 : 5); target.fill(); }
          else { target.beginPath(); target.arc(point.x, point.y, point.r, 0, Math.PI * 2); target.fill(); }
        });
      }
      target.restore();
    }
    function drawStroke(target, stroke) {
      if (!stroke) return;
      if (stroke.tool === 'effect') { drawEffect(target, stroke); return; }
      if (!stroke.points || !stroke.points.length) return;
      var t = stroke.tool, first = stroke.points[0], last = stroke.points[stroke.points.length - 1];
      target.save();
      target.globalAlpha = stroke.alpha == null ? 1 : stroke.alpha;
      target.globalCompositeOperation = t === 'eraser' ? 'destination-out' : 'source-over';
      target.strokeStyle = target.fillStyle = stroke.color;
      target.lineWidth = stroke.size; target.lineCap = 'round'; target.lineJoin = 'round';
      if (t === 'dither') {
        // every point a round patch of dots on the same grid, densest in the middle
        var rr = stroke.size * 1.6, seen = {};
        stroke.points.forEach(function (p, pi) {
          var q = stroke.points[pi + 1] || p, steps = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / (rr * 0.5)));
          for (var k = 0; k < steps; k++) {
            var cx = p.x + (q.x - p.x) * k / steps, cy = p.y + (q.y - p.y) * k / steps;
            for (var gy = Math.floor((cy - rr) / DOT) * DOT; gy <= cy + rr; gy += DOT) {
              for (var gx = Math.floor((cx - rr) / DOT) * DOT; gx <= cx + rr; gx += DOT) {
                var key = gx + ',' + gy;
                if (seen[key]) continue;
                var f = 1 - Math.hypot(gx + 1 - cx, gy + 1 - cy) / rr;
                if (f <= 0) continue;
                if ((BAYER4[((gy / DOT) & 3) * 4 + ((gx / DOT) & 3)] + 0.5) / 16 < f * 1.15) { seen[key] = 1; target.fillRect(gx, gy, DOT, DOT); }
              }
            }
          }
        });
      } else if (t === 'spray') {
        var rand = rng(stroke.seed), rad = stroke.size * 1.7;
        stroke.points.forEach(function (p) {
          for (var k = 0; k < 8 + stroke.size; k++) {
            var a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * rad;
            target.beginPath(); target.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, .6 + rand() * .9, 0, Math.PI * 2); target.fill();
          }
        });
      } else if (t === 'line' || t === 'arrow') {
        target.beginPath(); target.moveTo(first.x, first.y); target.lineTo(last.x, last.y); target.stroke();
        if (t === 'arrow') {
          var ang = Math.atan2(last.y - first.y, last.x - first.x), head = Math.max(10, stroke.size * 3);
          target.beginPath();
          target.moveTo(last.x - head * Math.cos(ang - .45), last.y - head * Math.sin(ang - .45));
          target.lineTo(last.x, last.y);
          target.lineTo(last.x - head * Math.cos(ang + .45), last.y - head * Math.sin(ang + .45));
          target.stroke();
        }
      } else if (t === 'rect') {
        var rw = last.x - first.x, rh = last.y - first.y;
        if (stroke.fill) target.fillRect(first.x, first.y, rw, rh); else target.strokeRect(first.x, first.y, rw, rh);
      } else if (t === 'circle') {
        target.beginPath();
        target.ellipse((first.x + last.x) / 2, (first.y + last.y) / 2, Math.abs(last.x - first.x) / 2, Math.abs(last.y - first.y) / 2, 0, 0, Math.PI * 2);
        if (stroke.fill) target.fill(); else target.stroke();
      } else if (t === 'star') { pathStar(target, first.x, first.y, stroke.size * 1.8, 5); target.fill(); }
      else if (t === 'heart') { pathHeart(target, first.x, first.y, stroke.size * 1.7); target.fill(); }
      else if (t === 'spark') { pathStar(target, first.x, first.y, stroke.size * 2, 4); target.fill(); }
      else if (stroke.points.length === 1) {
        target.beginPath(); target.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2); target.fill();
      } else if (t === 'marker') {
        // a highlighter: wide, flat and see-through, the same all along
        target.globalAlpha *= .42; target.lineCap = 'butt'; target.lineWidth = stroke.size * 1.8;
        pathFree(target, stroke.points); target.stroke();
      } else if (t === 'neon') {
        // a glowing tube: the colour as light around a pale core
        target.shadowColor = stroke.color; target.shadowBlur = Math.max(6, stroke.size * 1.6);
        pathFree(target, stroke.points); target.stroke();
        target.shadowBlur = 0; target.strokeStyle = mixWhite(stroke.color, .7); target.lineWidth = Math.max(1.4, stroke.size * .38);
        pathFree(target, stroke.points); target.stroke();
      } else {
        pathFree(target, stroke.points); target.stroke();
      }
      target.restore();
    }

    function syncPreview() {
      previewFrame = 0;
      if (live) { if (!current) pushLive(); return; }
      previewCtx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      previewCtx.drawImage(canvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    }
    function schedulePreview() { if (previewFrame || closed) return; previewFrame = requestAnimationFrame(syncPreview); }
    function syncButtons() {
      overlay.querySelector('.mk-draw-undo').disabled = strokes.length === 0;
      overlay.querySelector('.mk-draw-redo').disabled = redoStack.length === 0;
    }
    // What is shown: the background, the ink, and the stroke being drawn on top.
    function redraw() {
      ctx.clearRect(0, 0, DRAW_W, DRAW_H);
      ctx.drawImage(base, 0, 0);
      ctx.drawImage(ink, 0, 0);
      if (current && current.tool !== 'eraser') drawStroke(ctx, current);
      syncButtons();
      schedulePreview();
    }
    function rebuildInk() {
      inkCtx.clearRect(0, 0, DRAW_W, DRAW_H);
      inkCtx.drawImage(inkBase, 0, 0);
      strokes.forEach(function (s) { drawStroke(inkCtx, s); });
    }
    function rememberColor(c) {
      if (!c || c === '#111418' && tool === 'eraser') return;
      recent = [c].concat(recent.filter(function (x) { return x.toLowerCase() !== c.toLowerCase(); })).slice(0, 6);
      writeRecent(recent); paintRecent();
    }
    function commitStroke(stroke) {
      if (strokes.length >= MAX_UNDO_STROKES) drawStroke(inkBaseCtx, strokes.shift());
      strokes.push(stroke); redoStack.length = 0;
      if (stroke.tool !== 'eraser') drawStroke(inkCtx, stroke);   // an eraser stroke is already on the ink
      dirty = true;
      if (stroke.color && stroke.tool !== 'eraser' && stroke.tool !== 'effect') rememberColor(stroke.color);
    }
    function undo() { if (!strokes.length) return; redoStack.push(strokes.pop()); rebuildInk(); dirty = true; redraw(); }
    function redo() { if (!redoStack.length) return; var s = redoStack.pop(); strokes.push(s); drawStroke(inkCtx, s); dirty = true; redraw(); }
    function fillBase(nextColor) {
      bg = nextColor;
      baseCtx.save(); baseCtx.globalCompositeOperation = 'copy'; baseCtx.fillStyle = bg; baseCtx.fillRect(0, 0, DRAW_W, DRAW_H); baseCtx.restore();
      overlay.querySelectorAll('[data-bg]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.bg.toLowerCase() === bg.toLowerCase()); });
      dirty = true; redraw();
    }
    function clearInk() {
      strokes = []; redoStack = [];
      inkBaseCtx.clearRect(0, 0, DRAW_W, DRAW_H); inkCtx.clearRect(0, 0, DRAW_W, DRAW_H);
      dirty = true; redraw();
    }
    function pointFromEvent(event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(DRAW_W, (event.clientX - rect.left) * DRAW_W / rect.width)),
        y: Math.max(0, Math.min(DRAW_H, (event.clientY - rect.top) * DRAW_H / rect.height))
      };
    }
    function finishStroke(event) {
      if (!current) return;
      if (event && canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      commitStroke(current);
      current = null;
      redraw();
    }
    function close() {
      if (closed) return;
      closed = true;
      if (previewFrame) cancelAnimationFrame(previewFrame);
      clearTimeout(liveTimer); if (liveUrl) URL.revokeObjectURL(liveUrl); live = null;
      window.removeEventListener('keydown', onKeyDown, true);
      if (window.MinkaDitherBackdrop) window.MinkaDitherBackdrop.detach(overlay);
      overlay.remove();
      strokes.length = 0; redoStack.length = 0;
      current = null;
      canvas.width = canvas.height = preview.width = preview.height = base.width = base.height = ink.width = ink.height = inkBase.width = inkBase.height = 1;
    }
    function onKeyDown(event) {
      // Escape closes this editor only, never the card window under it
      if (event.key === 'Escape') { event.stopPropagation(); close(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); event.stopPropagation();
        if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault(); event.stopPropagation(); redo();
      }
    }
    function seededPoints(count) {
      var rand = rng(Date.now()), points = [];
      for (var i = 0; i < count; i++) points.push({ x: rand() * DRAW_W, y: rand() * DRAW_H, r: 1.5 + rand() * 5, a: .22 + rand() * .58 });
      return points;
    }
    function applyEffect(effect) {
      var points = effect === 'stars' ? seededPoints(34) : effect === 'dots' ? seededPoints(54) : [];
      commitStroke({ tool: 'effect', effect: effect, color: color, points: points });
      redraw();
    }

    canvas.addEventListener('pointerdown', function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      var point = pointFromEvent(event);
      if (STAMP[tool]) { commitStroke({ tool: tool, color: color, alpha: alpha, size: brushSize, fill: true, points: [point] }); redraw(); return; }
      canvas.setPointerCapture(event.pointerId);
      current = { tool: tool, color: color, alpha: tool === 'eraser' ? 1 : alpha, size: tool === 'eraser' ? brushSize * 1.6 : brushSize, fill: shapeFill, points: [point], seed: (Math.random() * 4294967296) >>> 0 };
      if (tool === 'eraser') drawStroke(inkCtx, current);
      redraw();
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!current) return;
      event.preventDefault();
      var point = pointFromEvent(event);
      if (FREEHAND[current.tool]) {
        var previous = current.points[current.points.length - 1];
        if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.2) return;
        current.points.push(point);
        // the eraser works on the ink as it goes (only its newest piece)
        if (current.tool === 'eraser') drawStroke(inkCtx, { tool: 'eraser', size: current.size, points: current.points.slice(-3) });
      } else {
        current.points[1] = point;
      }
      redraw();
    });
    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);

    function setTool(next) {
      tool = next;
      overlay.querySelectorAll('.dr-tool').forEach(function (item) { var on = item.dataset.tool === tool; item.classList.toggle('is-active', on); item.setAttribute('aria-pressed', String(on)); });
      overlay.querySelector('.mk-draw-fill-shape').classList.toggle('is-visible', tool === 'rect' || tool === 'circle');
      canvas.dataset.tool = tool;
    }
    function setColor(next) {
      color = next;
      overlay.querySelector('.mk-draw-color').value = next;
      overlay.querySelectorAll('.dr-swatches:not(.dr-bgs) .dr-swatch[data-color], .dr-recent .dr-swatch').forEach(function (b) { b.classList.toggle('is-active', b.dataset.color.toLowerCase() === next.toLowerCase()); });
      overlay.style.setProperty('--dr-ink', next);
      if (tool === 'eraser') setTool('pen');
    }
    function paintRecent() {
      var box = overlay.querySelector('.dr-recent');
      box.innerHTML = recent.length ? '<span>Nesen</span>' + recent.map(function (c) { return '<button type="button" class="dr-swatch" data-color="' + c + '" style="--c:' + c + '" aria-label="Nesen lietotā ' + c + '"></button>'; }).join('') : '';
      box.querySelectorAll('.dr-swatch').forEach(function (b) { b.classList.toggle('is-active', b.dataset.color.toLowerCase() === color.toLowerCase()); });
    }
    function paintSlider(label) {
      var input = label.querySelector('input'), min = +input.min, max = +input.max;
      label.style.setProperty('--p', ((input.value - min) / (max - min) * 100).toFixed(1) + '%');
    }
    overlay.querySelector('.dr-rail').addEventListener('click', function (event) { var b = event.target.closest('.dr-tool'); if (b) setTool(b.dataset.tool); });
    overlay.querySelectorAll('.dr-swatches:not(.dr-bgs)').forEach(function (box) { box.addEventListener('click', function (event) { var b = event.target.closest('[data-color]'); if (b) setColor(b.dataset.color); }); });
    overlay.querySelector('.dr-recent').addEventListener('click', function (event) { var b = event.target.closest('[data-color]'); if (b) setColor(b.dataset.color); });
    overlay.querySelector('.mk-draw-color').addEventListener('input', function (event) { setColor(event.target.value); });
    overlay.querySelector('.dr-bgs').addEventListener('click', function (event) { var b = event.target.closest('[data-bg]'); if (b) fillBase(b.dataset.bg); });
    overlay.querySelector('.mk-draw-bg').addEventListener('input', function (event) { fillBase(event.target.value); });
    overlay.querySelectorAll('.mk-draw-effect').forEach(function (button) { button.addEventListener('click', function () { applyEffect(button.dataset.effect); }); });
    overlay.querySelectorAll('.dr-slider').forEach(function (label) {
      var input = label.querySelector('input'), out = label.querySelector('output');
      input.addEventListener('input', function () {
        if (label.classList.contains('mk-draw-size-control')) { brushSize = Number(input.value) || 7; out.value = String(brushSize); }
        else { alpha = (Number(input.value) || 100) / 100; out.value = input.value + '%'; }
        paintSlider(label);
      });
      paintSlider(label);
    });
    overlay.querySelector('.mk-draw-fill-shape').addEventListener('click', function (event) {
      var b = event.target.closest('[data-shape-fill]'); if (!b) return;
      shapeFill = b.dataset.shapeFill === '1';
      this.querySelectorAll('[data-shape-fill]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
    overlay.querySelector('.mk-draw-undo').addEventListener('click', undo);
    overlay.querySelector('.mk-draw-redo').addEventListener('click', redo);
    overlay.querySelector('.mk-draw-clear').addEventListener('click', clearInk);
    overlay.querySelector('.mk-draw-close').addEventListener('click', close);
    overlay.querySelector('.mk-draw-cancel').addEventListener('click', close);
    // a click beside the editor does nothing (a drawing is never lost by a slip): × , Atcelt or Esc close it
    window.addEventListener('keydown', onKeyDown, true);

    overlay.querySelector('.mk-draw-save').addEventListener('click', async function () {
      var save = overlay.querySelector('.mk-draw-save');
      var status = overlay.querySelector('.mk-draw-status');
      save.disabled = true;
      status.textContent = 'Sagatavo...';
      current = null; redraw();
      var MM = window.MinkaMotion;
      var work = (async function () {
        var blob = await compactWebp(canvas);
        if (!blob) throw new Error('Zīmējums pārsniedz 96 KB');
        status.textContent = 'Saglabā...';
        await options.onSave(blob);
      })();
      try {
        // Label → spinner → check; the editor closes once the check is drawn.
        await (MM && MM.pending ? MM.pending(save, work) : work);
        status.textContent = '';
        toast(skyMode ? 'Zīmējums nosūtīts' : 'Zīmējums saglabāts — redzēs visi', 'ok');
        if (MM && MM.pending && MM.level() !== 'reduced') setTimeout(close, 380);
        else close();
      } catch (error) {
        status.textContent = error && error.message ? error.message : 'Neizdevās saglabāt';
        save.disabled = false;
      }
    });

    if (options.numberColor) overlay.querySelector('.mk-draw-card-shift').style.color = options.numberColor;
    if (options.textColor) {
      overlay.querySelector('.mk-draw-card-name').style.color = options.textColor;
      overlay.querySelector('.mk-draw-card-last').style.color = options.textColor;
      overlay.querySelector('.mk-draw-card-initials').style.color = options.textColor;
    }
    paintRecent(); setTool('pen'); setColor(color);
    fillBase(skyMode ? 'transparent' : bg); dirty = false;
    if (options.initialUrl) {
      var image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = function () {
        if (closed || dirty) return;
        var scale = Math.max(DRAW_W / image.width, DRAW_H / image.height);
        var width = image.width * scale, height = image.height * scale;
        baseCtx.clearRect(0, 0, DRAW_W, DRAW_H);
        baseCtx.drawImage(image, (DRAW_W - width) / 2, (DRAW_H - height) / 2, width, height);
        redraw();
      };
      image.src = options.initialUrl;
    }
  }

  window.MinkaSkinDraw = { open: open };
})();
