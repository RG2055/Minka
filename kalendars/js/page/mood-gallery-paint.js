(function MinkaGalleryPaint() {
  'use strict';

  /* Zīmēšana tikai galerijā (pārējā lietotnē paliek js/skin-draw.js): MS Paint
     (Windows 98) kā JS Paint, github.com/1j01/jspaint, MIT, Isaiah Odhner; no
     tā ir rīku ikonas un opciju attēli (assets/gallery/paint, licence blakus).
     Virsraksta josla, izvēlne, 16 rīki divās kolonnās ar opciju lodziņu zem tiem,
     audekls pelēkā laukumā, krāsu kaste, statusa josla. Kreisā poga: priekšplāna
     krāsa, labā: fona (sākumā caurspīdīga). Audekla fons ir tas pats tumši zilais,
     uz kura zīmējums karāsies galerijas rāmī.
     Līgums kā MinkaSkinDraw.open({ mode: 'sky' }): 384 × 384, caurspīdīgs, webp
     līdz 96 KB, options.onSave(blob) → Promise. */
  var SIZE = 384, MAX_BYTES = 96 * 1024, UNDO = 50;
  var ASSETS = 'assets/gallery/paint/', V = '?v=20261003gp2';
  var CLEAR = 'transparent';
  // MS Paint's 28 colours (without its purples), the gallery's navy and "see-through" first
  var PALETTE = [
    [CLEAR, '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#404040', '#808040', '#004040', '#0080ff', '#004080', '#0040ff', '#804000'],
    ['#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ffc0a0', '#ffff80', '#00ff80', '#80ffff', '#80c0ff', '#ff4040', '#ff8040', '#13283f']
  ];
  // the tools in the sprite's order (images/classic/tools.png): name, status line, key
  var TOOLS = [
    ['lasso', 'Brīvas formas atlase', 'Atlasa brīvas formas daļu.'],
    ['select', 'Atlase', 'Atlasa taisnstūra daļu.'],
    ['eraser', 'Dzēšgumija', 'Dzēš ar fona krāsu; ar labo pogu nomaina priekšplāna krāsu.'],
    ['fill', 'Krāsas aizpilde', 'Aizpilda laukumu ar krāsu.'],
    ['pick', 'Krāsas paņemšana', 'Paņem krāsu no zīmējuma.'],
    ['zoom', 'Lupa', 'Palielina zīmējumu.'],
    ['pencil', 'Zīmulis', 'Zīmē viena pikseļa līniju.'],
    ['brush', 'Ota', 'Zīmē ar izvēlēto otu.'],
    ['airbrush', 'Aerosols', 'Zīmē ar aerosolu.'],
    ['text', 'Teksts', 'Ieraksta tekstu.'],
    ['line', 'Līnija', 'Velk taisnu līniju. Ar Shift: 45° solī.'],
    ['curve', 'Līkne', 'Velk līniju, tad divreiz izliec.'],
    ['rect', 'Taisnstūris', 'Zīmē taisnstūri. Ar Shift: kvadrātu.'],
    ['polygon', 'Daudzstūris', 'Klikšķi pa stūriem; dubultklikšķis noslēdz.'],
    ['ellipse', 'Elipse', 'Zīmē elipsi. Ar Shift: apli.'],
    ['round', 'Noapaļots taisnstūris', 'Zīmē noapaļotu taisnstūri.']
  ];
  var KEYS = { s: 'select', e: 'eraser', f: 'fill', i: 'pick', z: 'zoom', p: 'pencil', b: 'brush', a: 'airbrush', t: 'text', l: 'line', c: 'curve', r: 'rect', g: 'polygon', o: 'ellipse' };
  var SHAPED = { rect: 1, ellipse: 1, round: 1, polygon: 1 };
  // the brush's 12 tips (as in MS Paint: round, square, / and \, three sizes each)
  var BRUSHES = [['o', 7], ['o', 4], ['o', 1], ['s', 8], ['s', 5], ['s', 2], ['/', 8], ['/', 5], ['/', 2], ['\\', 8], ['\\', 5], ['\\', 2]];
  var ERASERS = [4, 6, 8, 10], SPRAYS = [4, 8, 12], LINES = [1, 2, 3, 4, 5], ZOOMS = [1, 2, 6, 8];
  var FONTS = [['Space Grotesk', '"Space Grotesk", Inter, system-ui, sans-serif'], ['Georgia', 'Georgia, "Times New Roman", serif'], ['Courier', '"Courier New", Courier, monospace'], ['Comic', '"Comic Sans MS", "Chalkboard SE", cursive']];
  var SIZES = [10, 12, 14, 18, 24, 32, 40, 48];
  var BAYER8 = (function () {
    var b = [[0, 2], [3, 1]], m = b;
    for (var n = 2; n < 8; n *= 2) {
      var next = [];
      for (var y = 0; y < n * 2; y++) { next.push([]); for (var x = 0; x < n * 2; x++) next[y].push(4 * m[y % n][x % n] + b[(y / n) | 0][(x / n) | 0]); }
      m = next;
    }
    return m;
  })();

  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hexOf(r, g, b) { return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function blobOf(c, q) { return new Promise(function (ok) { c.toBlob(ok, 'image/webp', q); }); }
  async function compactWebp(c) {
    var qs = [0.88, 0.74, 0.6, 0.46];
    for (var i = 0; i < qs.length; i++) { var b = await blobOf(c, qs[i]); if (b && b.type === 'image/webp' && b.size <= MAX_BYTES) return b; }
    return null;
  }
  function hardAlpha(ctx, w, h) {                                      // no soft edges: the old Paint look
    var d = ctx.getImageData(0, 0, w, h), p = d.data;
    for (var i = 3; i < p.length; i += 4) p[i] = p[i] >= 110 ? 255 : 0;
    ctx.putImageData(d, 0, 0);
  }
  function heartPath(g, x, y, w, h) {
    g.moveTo(x + w / 2, y + h);
    g.bezierCurveTo(x - w * 0.05, y + h * 0.6, x - w * 0.02, y + h * 0.05, x + w * 0.27, y + h * 0.04);
    g.bezierCurveTo(x + w * 0.4, y + h * 0.03, x + w * 0.48, y + h * 0.14, x + w / 2, y + h * 0.24);
    g.bezierCurveTo(x + w * 0.52, y + h * 0.14, x + w * 0.6, y + h * 0.03, x + w * 0.73, y + h * 0.04);
    g.bezierCurveTo(x + w * 1.02, y + h * 0.05, x + w * 1.05, y + h * 0.6, x + w / 2, y + h);
    g.closePath();
  }

  /* ── punktu efekti (izvēlnē Attēls) ────────────────────────────────────── */
  function nearness(alpha, w, h, r) {
    var a = new Float32Array(w * h), b = new Float32Array(w * h);
    for (var i = 0; i < a.length; i++) a[i] = alpha[i] ? 1 : 0;
    for (var pass = 0; pass < 3; pass++) {
      for (var y = 0; y < h; y++) {
        var s = 0, row = y * w;
        for (var x = -r; x <= r; x++) s += a[row + Math.min(w - 1, Math.max(0, x))];
        for (x = 0; x < w; x++) { b[row + x] = s / (2 * r + 1); s += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)]; }
      }
      for (x = 0; x < w; x++) {
        s = 0;
        for (y = -r; y <= r; y++) s += b[Math.min(h - 1, Math.max(0, y)) * w + x];
        for (y = 0; y < h; y++) { a[y * w + x] = s / (2 * r + 1); s += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x]; }
      }
    }
    return a;
  }
  function dotEffect(src, kind, color) {
    var w = SIZE, h = SIZE, s = src.data, out = new ImageData(new Uint8ClampedArray(s), w, h), o = out.data;
    var alpha = new Uint8Array(w * h), d = kind === 'shadow' ? 4 : 0;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) alpha[y * w + x] = x >= d && y >= d && s[((y - d) * w + x - d) * 4 + 3] > 0 ? 1 : 0;
    var near = nearness(alpha, w, h, kind === 'outline' ? 2 : kind === 'shadow' ? 2 : 8), c = rgb(color);
    var gain = kind === 'outline' ? 3.2 : 1.6;
    for (var i = 0; i < w * h; i++) {
      if (s[i * 4 + 3]) continue;
      var v = Math.min(1, near[i] * gain), t = (BAYER8[(i / w | 0) & 7][(i % w) & 7] + 0.5) / 64;
      if (kind === 'outline' && v > 0.12) v = 1;
      if (v > t) { o[i * 4] = c[0]; o[i * 4 + 1] = c[1]; o[i * 4 + 2] = c[2]; o[i * 4 + 3] = 255; }
    }
    return out;
  }

  /* ── Windows 98 ikonas: zīmētas šeit (mapes, dators, kaķis); Paint ikona no JS Paint ── */
  var pixCache = {};
  function pixIcon(kind) {
    if (pixCache[kind]) return pixCache[kind];
    var n = kind === 'cat' ? 16 : 32, c = canvas(n, n), g = c.getContext('2d');
    var R = function (x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); };
    var box = function (x, y, w, h, fill, line) { R(x, y, w, h, line); R(x + 1, y + 1, w - 2, h - 2, fill); };
    if (kind === 'folder' || kind === 'pics') {
      box(3, 6, 11, 5, '#fff2a8', '#806000');                       // the tab
      box(2, 9, 28, 19, '#f2d36b', '#806000');                      // the folder
      R(3, 10, 26, 1, '#fff6c8'); R(3, 26, 26, 1, '#c9a43a'); R(28, 10, 1, 17, '#c9a43a');
      if (kind === 'pics') {                                         // a picture in it: sky, sun, hills
        box(11, 12, 18, 13, '#7cc4ff', '#000000');
        R(12, 13, 16, 1, '#ffffff'); R(23, 15, 3, 3, '#ffd23f');
        R(12, 20, 16, 4, '#3fbf5f'); R(14, 19, 5, 1, '#3fbf5f'); R(21, 18, 4, 2, '#2f9a48');
      }
    } else if (kind === 'computer') {
      box(4, 3, 24, 18, '#c0c0c0', '#000000'); R(5, 4, 22, 1, '#ffffff');
      box(7, 6, 18, 12, '#008080', '#404040'); R(9, 8, 6, 1, '#7fd0d0');
      R(12, 21, 8, 2, '#808080'); box(8, 23, 16, 4, '#c0c0c0', '#000000');
      box(3, 27, 26, 4, '#c0c0c0', '#000000'); R(5, 28, 22, 1, '#808080');
    } else if (kind === 'page') {
      box(7, 3, 18, 26, '#ffffff', '#000000'); R(20, 3, 5, 5, '#ffffff'); R(20, 3, 1, 6, '#000000'); R(20, 8, 6, 1, '#000000'); R(21, 3, 1, 1, '#000000');
      for (var y = 12; y < 26; y += 3) R(10, y, 12, 1, '#808080');
    } else if (kind === 'key') {                                     // the administrator's key
      box(4, 8, 12, 12, '#ffd23f', '#806000'); R(8, 12, 4, 4, '#c0c0c0');
      box(15, 12, 14, 4, '#ffd23f', '#806000'); R(22, 15, 3, 5, '#806000'); R(26, 15, 3, 4, '#806000');
    } else if (kind === 'cat') {                                     // the Start button's mark: a black cat's head
      R(2, 2, 2, 4, '#000'); R(4, 4, 1, 2, '#000'); R(12, 2, 2, 4, '#000'); R(11, 4, 1, 2, '#000');
      R(3, 6, 10, 7, '#000'); R(2, 7, 12, 5, '#000'); R(4, 13, 8, 1, '#000');
      R(5, 8, 2, 2, '#ffd23f'); R(9, 8, 2, 2, '#ffd23f'); R(7, 11, 2, 1, '#ff8a9a');
    }
    return (pixCache[kind] = c.toDataURL('image/png'));
  }
  function pixImg(kind, size) { return '<img class="gp-pix" src="' + pixIcon(kind) + '" width="' + size + '" height="' + size + '" alt="" draggable="false">'; }
  function paintImg(size) { return '<img class="gp-pix" src="' + ASSETS + 'paint-' + (size > 16 ? 32 : 16) + '.png' + V + '" width="' + size + '" height="' + size + '" alt="" draggable="false">'; }
  function dayShort(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '.' + m[2] : ''; }

  /* ── redaktors ─────────────────────────────────────────────────────────── */
  var openNow = null;
  function open(options) {
    options = options || {};
    if (openNow) openNow.close(true);
    var st = {
      tool: 'brush', prevTool: 'brush', fg: '#000000', bg: '#ffffff', brush: 1, eraser: 1, spray: 1, line: 0, fillMode: 0, opaque: false, zoomOpt: 1,
      font: 0, size: 3, bold: false, italic: false, zoom: 1, dirty: false, closed: false, busy: false
    };
    var undo = [], redo = [], clip = null;
    var ink = canvas(SIZE, SIZE), ictx = ink.getContext('2d', { willReadFrequently: true });
    var scratch = canvas(SIZE, SIZE), sctx = scratch.getContext('2d', { willReadFrequently: true });
    var palette = PALETTE.map(function (r) { return r.slice(); });

    var sprite = function (i) { return '<i class="gp-tico" style="--i:' + i + '"></i>'; };
    var root = document.createElement('div');
    root.className = 'gp-root';
    root.innerHTML = ''
      + '<section class="gp-app gp-win" role="dialog" aria-modal="true" aria-label="Paint">'
      + '<header class="gp-tb"><span class="gp-tb-ico">' + paintImg(16) + '</span><span class="gp-tb-title">bez nosaukuma - Paint</span>'
      + '<button type="button" class="gp-tbb gp-tbb-min" data-act="minimize" aria-label="Minimizēt" title="Minimizēt"></button>'
      + '<button type="button" class="gp-tbb gp-tbb-max" data-act="maximize" aria-label="Maksimizēt" title="Maksimizēt"></button>'
      + '<button type="button" class="gp-tbb gp-tbb-x" data-act="close" aria-label="Aizvērt" title="Aizvērt"></button></header>'
      + '<nav class="gp-menubar" role="menubar">'
      + [['file', 'Fails'], ['edit', 'Labot'], ['view', 'Skats'], ['image', 'Attēls'], ['colors', 'Krāsas'], ['help', 'Palīdzība']].map(function (m) {
          return '<button type="button" class="gp-mb" data-menu="' + m[0] + '" role="menuitem"><u>' + m[1].charAt(0) + '</u>' + m[1].slice(1) + '</button>';
        }).join('')
      + '</nav>'
      + '<div class="gp-fontbar" hidden><b>Fonti</b><select class="gp-font" aria-label="Fonts">' + FONTS.map(function (f, i) { return '<option value="' + i + '">' + f[0] + '</option>'; }).join('') + '</select>'
      + '<select class="gp-size" aria-label="Izmērs">' + SIZES.map(function (s, i) { return '<option value="' + i + '"' + (i === 3 ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>'
      + '<button type="button" class="gp-fb gp-bold" aria-pressed="false" title="Treknraksts"><b>B</b></button><button type="button" class="gp-fb gp-italic" aria-pressed="false" title="Slīpraksts"><i>I</i></button></div>'
      + '<div class="gp-mid"><aside class="gp-toolbox"><div class="gp-tools" role="toolbar" aria-label="Rīki">'
      + TOOLS.map(function (t, i) { return '<button type="button" class="gp-tool" data-tool="' + t[0] + '" title="' + t[1] + '" aria-label="' + t[1] + '">' + sprite(i) + '</button>'; }).join('')
      + '</div><div class="gp-opts"></div></aside>'
      + '<div class="gp-work"><div class="gp-paper"><canvas class="gp-canvas" width="' + SIZE + '" height="' + SIZE + '"></canvas><textarea class="gp-type" rows="1" spellcheck="false" hidden aria-label="Teksts"></textarea></div></div></div>'
      + '<footer class="gp-colorbox"><button type="button" class="gp-cur" title="Samainīt krāsas (X)" aria-label="Samainīt krāsas"><span class="gp-bgc"></span><span class="gp-fgc"></span></button>'
      + '<div class="gp-pal" role="group" aria-label="Krāsas"></div>'
      + '<div class="gp-send"><button type="button" class="gp-btn" data-act="close">Atcelt</button><button type="button" class="gp-btn is-default" data-act="save">Nosūtīt uz galeriju</button></div></footer>'
      + '<div class="gp-status"><span class="gp-st-text"></span><span class="gp-st-xy"></span><span class="gp-st-wh"></span></div>'
      + '<input type="color" class="gp-picker" tabindex="-1" aria-hidden="true">'
      + '</section>'
      // the desktop's icons: the gallery's pictures as a folder, Paint itself
      + '<div class="gp-desk"><button type="button" class="gp-dicon" data-desk="pics">' + pixImg('pics', 32) + '<span>Mani attēli</span></button>'
      + '<button type="button" class="gp-dicon" data-desk="paint">' + paintImg(32) + '<span>Paint</span></button></div>'
      // the Windows 98 taskbar: Start, a button for every window, the clock
      + '<div class="gp-taskbar"><button type="button" class="gp-start" aria-haspopup="menu">' + pixImg('cat', 16) + '<b>Sākt</b></button>'
      + '<span class="gp-task-sep" aria-hidden="true"></span><div class="gp-tasks"></div>'
      + '<span class="gp-tray"><span class="gp-tray-key" hidden title="Administrators">' + pixImg('key', 16) + '</span><span class="gp-clock"></span></span></div>'
      + '<div class="gp-startmenu" role="menu" hidden><span class="gp-sm-band"><b>Galerija</b>98</span><div class="gp-sm-items">'
      + '<button type="button" class="gp-sm-item" data-desk="pics">' + pixImg('pics', 32) + '<span><u>M</u>ani attēli</span></button>'
      + '<button type="button" class="gp-sm-item" data-desk="paint">' + paintImg(32) + '<span><u>P</u>aint</span></button><hr>'
      + '<button type="button" class="gp-sm-item" data-act="save">' + paintImg(32) + '<span><u>N</u>osūtīt uz galeriju</span></button>'
      + '<button type="button" class="gp-sm-item" data-act="new">' + pixImg('page', 32) + '<span><u>J</u>auna balta lapa</span></button><hr>'
      + (options.admin ? '<button type="button" class="gp-sm-item gp-sm-admin" data-act="admin">' + pixImg('key', 32) + '<span>A<u>d</u>ministrators…</span></button><hr>' : '')
      + '<button type="button" class="gp-sm-item" data-act="close">' + pixImg('computer', 32) + '<span><u>A</u>izvērt Paint…</span></button></div></div>'
      + '<div class="gp-menu" role="menu" hidden></div><div class="gp-dialog-layer" hidden></div><div class="gp-zoombar" aria-hidden="true" hidden></div>';
    document.body.appendChild(root);
    var $ = function (s) { return root.querySelector(s); };
    var view = $('.gp-canvas'), vctx = view.getContext('2d'), work = $('.gp-work'), paper = $('.gp-paper'), typer = $('.gp-type');
    if (window.MinkaGallery3D && window.MinkaGallery3D.pause) window.MinkaGallery3D.pause(true);

    /* ── the picture: the ink, the selection floating over it, its dashes ── */
    var sel = null, ants = 0, antsTimer = 0;
    function selectionPath(g, s, ox, oy) {
      if (s.pts) { g.beginPath(); s.pts.forEach(function (p, i) { var x = p[0] - s.ox + ox, y = p[1] - s.oy + oy; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); }
      else { g.beginPath(); g.rect(ox, oy, s.w, s.h); }
    }
    function floatShown(s) {                                         // the float as it lands: the background colour left out when "transparent"
      if (!s.float || st.opaque || st.bg === CLEAR) return s.float;
      var c = canvas(s.w, s.h), g = c.getContext('2d'), d = s.float.getContext('2d').getImageData(0, 0, s.w, s.h), p = d.data, b = rgb(st.bg);
      for (var i = 0; i < p.length; i += 4) if (p[i] === b[0] && p[i + 1] === b[1] && p[i + 2] === b[2]) p[i + 3] = 0;
      g.putImageData(d, 0, 0);
      return c;
    }
    function paint() {
      vctx.clearRect(0, 0, SIZE, SIZE);
      vctx.drawImage(ink, 0, 0);
      if (sel) {
        if (sel.float) vctx.drawImage(floatShown(sel), sel.x, sel.y);
        vctx.save(); vctx.lineWidth = 1; vctx.setLineDash([4, 4]);
        if (sel.pts) { vctx.translate(0.5, 0.5); selectionPath(vctx, sel, sel.x, sel.y); }
        else { vctx.beginPath(); vctx.rect(sel.x + 0.5, sel.y + 0.5, sel.w - 1, sel.h - 1); }
        vctx.strokeStyle = '#000'; vctx.lineDashOffset = ants; vctx.stroke();
        vctx.strokeStyle = '#fff'; vctx.lineDashOffset = ants + 4; vctx.stroke();
        vctx.restore();
      }
    }
    function startAnts() { if (!antsTimer) antsTimer = setInterval(function () { ants = (ants + 1) % 8; paint(); }, 110); }

    /* ── undo ── */
    function snapshot() { undo.push(ictx.getImageData(0, 0, SIZE, SIZE)); if (undo.length > UNDO) undo.shift(); redo.length = 0; st.dirty = true; }
    function restore(from, to) {
      dropSel(); endText(true);
      if (!from.length) return;
      to.push(ictx.getImageData(0, 0, SIZE, SIZE));
      ictx.putImageData(from.pop(), 0, 0);
      st.dirty = true; paint();
    }

    /* ── pixels ── */
    function skyBehind() {                                           // the gallery frame's navy, as the drawing hangs there
      var g = ictx.createLinearGradient(0, 0, 0, SIZE); g.addColorStop(0, '#13283f'); g.addColorStop(1, '#070c16');
      ictx.fillStyle = g; ictx.fillRect(0, 0, SIZE, SIZE);
    }
    function put(ctx, x, y, w, h, color) {
      if (color === CLEAR) ctx.clearRect(x, y, w, h);
      else { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
    }
    function disc(ctx, x, y, r, color) {
      if (r <= 0) { put(ctx, x, y, 1, 1, color); return; }
      for (var dy = -r; dy <= r; dy++) { var hw = Math.floor(Math.sqrt(r * r + r - dy * dy)); put(ctx, x - hw, y + dy, hw * 2 + 1, 1, color); }
    }
    function tip(ctx, x, y, color) {                                 // the brush's tip at one point
      var b = BRUSHES[st.brush], n = b[1];
      if (b[0] === 'o') disc(ctx, x, y, n >> 1, color);
      else if (b[0] === 's') put(ctx, x - (n >> 1), y - (n >> 1), n, n, color);
      else for (var k = 0; k < n; k++) { var dx = k - (n >> 1); put(ctx, b[0] === '/' ? x - dx : x + dx, y + dx, 1, 1, color); }
    }
    function walk(x0, y0, x1, y1, each) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
      for (var guard = 0; guard < 5000; guard++) {
        each(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        var e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    }
    function lineWidthR() { return LINES[st.line] - 1; }
    function strokePts(pts, color, closed) {                         // a line through the points, the line width thick
      var r = lineWidthR();
      var each = function (x, y) { if (r <= 0) put(ictx, x, y, 1, 1, color); else if (r === 1) put(ictx, x, y, 2, 2, color); else disc(ictx, x, y, r >> 1, color); };
      for (var i = 1; i < pts.length; i++) walk(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], each);
      if (closed && pts.length > 2) walk(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], each);
      if (pts.length === 1) each(pts[0][0], pts[0][1]);
    }
    // a filled path or a thick outline drawn by the canvas, cut to hard pixels, in a colour (see-through cuts)
    function pathInk(build, how, color) {
      sctx.clearRect(0, 0, SIZE, SIZE);
      sctx.save(); sctx.fillStyle = sctx.strokeStyle = '#000'; sctx.lineWidth = LINES[st.line]; sctx.lineJoin = 'miter';
      sctx.beginPath(); build(sctx);
      if (how === 'fill') sctx.fill(); else sctx.stroke();
      sctx.restore();
      hardAlpha(sctx, SIZE, SIZE);
      ictx.save();
      if (color === CLEAR) ictx.globalCompositeOperation = 'destination-out';
      else { sctx.save(); sctx.globalCompositeOperation = 'source-in'; sctx.fillStyle = color; sctx.fillRect(0, 0, SIZE, SIZE); sctx.restore(); }
      ictx.drawImage(scratch, 0, 0);
      ictx.restore();
    }
    // a shape with the fill mode: outline, outline over the other colour, or filled only
    function drawShape(kind, a, b, primary, secondary) {
      var x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]), lw = LINES[st.line];
      var inset = function (g, full) {
        var i = full ? 0 : lw / 2;
        if (kind === 'rect') g.rect(x + i, y + i, Math.max(0.5, w + 1 - 2 * i), Math.max(0.5, h + 1 - 2 * i));
        else if (kind === 'ellipse') g.ellipse(x + (w + 1) / 2, y + (h + 1) / 2, Math.max(0.5, (w + 1) / 2 - i), Math.max(0.5, (h + 1) / 2 - i), 0, 0, Math.PI * 2);
        else if (kind === 'round') g.roundRect(x + i, y + i, Math.max(0.5, w + 1 - 2 * i), Math.max(0.5, h + 1 - 2 * i), Math.min(w, h) * 0.18 + 3);
        else if (kind === 'heart') heartPath(g, x + i, y + i, Math.max(1, w + 1 - 2 * i), Math.max(1, h + 1 - 2 * i));
      };
      if (st.fillMode === 1) pathInk(function (g) { inset(g, false); }, 'fill', secondary);
      if (st.fillMode === 2) { pathInk(function (g) { inset(g, true); }, 'fill', primary); return; }
      if (kind === 'rect') {                                          // exact edges for the rectangle
        put(ictx, x, y, w + 1, lw, primary); put(ictx, x, y + h + 1 - lw, w + 1, lw, primary);
        put(ictx, x, y, lw, h + 1, primary); put(ictx, x + w + 1 - lw, y, lw, h + 1, primary);
        return;
      }
      pathInk(function (g) { inset(g, false); }, 'stroke', primary);
    }
    function polygonInk(pts, primary, secondary) {
      var build = function (g) { pts.forEach(function (p, i) { if (i) g.lineTo(p[0] + 0.5, p[1] + 0.5); else g.moveTo(p[0] + 0.5, p[1] + 0.5); }); g.closePath(); };
      if (st.fillMode === 1) pathInk(build, 'fill', secondary);
      if (st.fillMode === 2) { pathInk(build, 'fill', primary); return; }
      strokePts(pts, primary, true);
    }
    function bezier(p0, p1, p2, p3) {
      var pts = [];
      for (var i = 0; i <= 64; i++) {
        var t = i / 64, u = 1 - t;
        pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
      }
      return pts;
    }
    function spray(x, y, color) {
      var r = SPRAYS[st.spray];
      for (var i = 0; i < r * 1.6; i++) {
        var a = Math.random() * Math.PI * 2, d = Math.random() * r;
        put(ictx, Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 1, 1, color);
      }
    }
    function erase(x, y, right) {
      var n = ERASERS[st.eraser], x0 = x - (n >> 1), y0 = y - (n >> 1);
      if (!right) { put(ictx, x0, y0, n, n, st.bg); return; }
      // the colour eraser: only the foreground colour turns into the background colour
      if (st.fg === CLEAR) return;
      var d = ictx.getImageData(x0, y0, n, n), p = d.data, f = rgb(st.fg), b = st.bg === CLEAR ? null : rgb(st.bg);
      for (var i = 0; i < p.length; i += 4) if (p[i + 3] && p[i] === f[0] && p[i + 1] === f[1] && p[i + 2] === f[2]) { if (b) { p[i] = b[0]; p[i + 1] = b[1]; p[i + 2] = b[2]; } else p[i + 3] = 0; }
      ictx.putImageData(d, x0, y0);
    }
    function flood(x, y, color) {
      var d = ictx.getImageData(0, 0, SIZE, SIZE), p = d.data, i0 = (y * SIZE + x) * 4;
      var t = [p[i0], p[i0 + 1], p[i0 + 2], p[i0 + 3]], A = color === CLEAR ? [0, 0, 0, 0] : rgb(color).concat(255);
      var same = function (i) { return t[3] === 0 ? p[i + 3] === 0 : p[i + 3] !== 0 && p[i] === t[0] && p[i + 1] === t[1] && p[i + 2] === t[2]; };
      if (A[3] === 0 ? t[3] === 0 : (t[3] !== 0 && A[0] === t[0] && A[1] === t[1] && A[2] === t[2])) return false;
      var seen = new Uint8Array(SIZE * SIZE), stack = [x, y];
      while (stack.length) {
        var sy = stack.pop(), sx = stack.pop(), lx = sx;
        while (lx > 0 && !seen[sy * SIZE + lx - 1] && same((sy * SIZE + lx - 1) * 4)) lx--;
        var up = false, down = false;
        for (var cx = lx; cx < SIZE && !seen[sy * SIZE + cx] && same((sy * SIZE + cx) * 4); cx++) {
          var k = sy * SIZE + cx;
          seen[k] = 1; p[k * 4] = A[0]; p[k * 4 + 1] = A[1]; p[k * 4 + 2] = A[2]; p[k * 4 + 3] = A[3];
          if (sy > 0) { var u = !seen[k - SIZE] && same((k - SIZE) * 4); if (u && !up) stack.push(cx, sy - 1); up = u; }
          if (sy < SIZE - 1) { var dn = !seen[k + SIZE] && same((k + SIZE) * 4); if (dn && !down) stack.push(cx, sy + 1); down = dn; }
        }
      }
      ictx.putImageData(d, 0, 0);
      return true;
    }

    /* ── the selection ── */
    function lift() {
      if (!sel || sel.float) return;
      snapshot();
      var f = canvas(sel.w, sel.h), g = f.getContext('2d');
      g.drawImage(ink, -sel.x, -sel.y);
      if (sel.pts) { g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; selectionPath(g, sel, 0, 0); g.fill(); g.globalCompositeOperation = 'source-over'; hardAlpha(g, sel.w, sel.h); }
      sel.float = f;
      // the hole left behind takes the background colour
      ictx.save();
      ictx.beginPath();
      if (sel.pts) selectionPath(ictx, sel, sel.x, sel.y); else ictx.rect(sel.x, sel.y, sel.w, sel.h);
      ictx.clip();
      put(ictx, sel.x - 1, sel.y - 1, sel.w + 2, sel.h + 2, st.bg);
      ictx.restore();
    }
    function dropSel(discard) {
      if (!sel) return;
      if (sel.float && !discard) ictx.drawImage(floatShown(sel), sel.x, sel.y);
      sel = null; clearInterval(antsTimer); antsTimer = 0; paint(); paintStatus();
    }
    function makeSel(x, y, w, h, pts) {
      sel = { x: x, y: y, w: w, h: h, ox: x, oy: y, pts: pts || null, float: null };
      startAnts(); paint(); paintStatus();
    }
    function floatFrom(c, x, y) {                                    // a picture put down as a floating selection
      dropSel(); snapshot();
      sel = { x: x, y: y, w: c.width, h: c.height, ox: x, oy: y, pts: null, float: c };
      startAnts(); paint(); paintStatus();
    }
    function regionCanvas() { if (sel) { lift(); return sel.float; } return null; }
    function transform(fn) {                                         // flip, rotate, invert: the selection, else the whole picture
      endText(true);
      var src = regionCanvas(), whole = !src;
      if (whole) { snapshot(); src = canvas(SIZE, SIZE); src.getContext('2d').drawImage(ink, 0, 0); }
      var out = fn(src);
      if (whole) { ictx.clearRect(0, 0, SIZE, SIZE); ictx.drawImage(out, 0, 0); paint(); return; }
      var cx = sel.x + sel.w / 2, cy = sel.y + sel.h / 2;
      sel.float = out; sel.pts = null; sel.w = out.width; sel.h = out.height; sel.x = Math.round(cx - sel.w / 2); sel.y = Math.round(cy - sel.h / 2);
      paint(); paintStatus();
    }
    var flipH = function (c) { var o = canvas(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; };
    var flipV = function (c) { var o = canvas(c.width, c.height), g = o.getContext('2d'); g.translate(0, c.height); g.scale(1, -1); g.drawImage(c, 0, 0); return o; };
    var rotate = function (turns) {
      return function (c) {
        var q = ((turns % 4) + 4) % 4, o = canvas(q % 2 ? c.height : c.width, q % 2 ? c.width : c.height), g = o.getContext('2d');
        g.translate(o.width / 2, o.height / 2); g.rotate(q * Math.PI / 2); g.drawImage(c, -c.width / 2, -c.height / 2);
        return o;
      };
    };
    var invert = function (c) {
      var o = canvas(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0);
      var d = g.getImageData(0, 0, o.width, o.height), p = d.data;
      for (var i = 0; i < p.length; i += 4) if (p[i + 3]) { p[i] = 255 - p[i]; p[i + 1] = 255 - p[i + 1]; p[i + 2] = 255 - p[i + 2]; }
      g.putImageData(d, 0, 0);
      return o;
    };

    /* ── text: a box typed in place, then pixels ── */
    var textAt = null;
    function fontCss(px) { return (st.italic ? 'italic ' : '') + (st.bold ? '700 ' : '400 ') + px + 'px/1.15 ' + FONTS[st.font][1]; }
    function styleTyper() {
      if (!textAt) return;
      var k = st.zoom;
      typer.style.left = (textAt.x * k) + 'px'; typer.style.top = (textAt.y * k) + 'px';
      typer.style.font = fontCss(SIZES[st.size] * k);
      typer.style.color = textAt.color === CLEAR ? '#ffffff' : textAt.color;
      typer.style.background = st.opaque && st.bg !== CLEAR ? st.bg : 'transparent';
      typer.style.width = Math.max(40, (SIZE - textAt.x) * k) + 'px';
      typer.style.height = 'auto'; typer.style.height = typer.scrollHeight + 'px';
    }
    function startText(x, y) {
      textAt = { x: x, y: y, color: st.fg };
      typer.hidden = false; typer.value = '';
      styleTyper();
      setTimeout(function () { typer.focus(); }, 0);
    }
    function endText(keep) {
      if (!textAt) return;
      var t = typer.value.replace(/\s+$/, ''), at = textAt;
      textAt = null; typer.hidden = true; typer.blur();
      if (!keep || !t.trim()) return;
      snapshot();
      var px = SIZES[st.size], lines = t.split('\n');
      sctx.clearRect(0, 0, SIZE, SIZE);
      sctx.font = fontCss(px); sctx.textBaseline = 'top';
      if (st.opaque && st.bg !== CLEAR) {
        var w = 0; lines.forEach(function (l) { w = Math.max(w, sctx.measureText(l).width); });
        put(ictx, at.x, at.y, Math.ceil(w) + 2, Math.ceil(lines.length * px * 1.15) + 2, st.bg);
      }
      sctx.fillStyle = '#000';
      lines.forEach(function (l, i) { sctx.fillText(l, at.x, at.y + i * px * 1.15); });
      hardAlpha(sctx, SIZE, SIZE);
      ictx.save();
      if (at.color === CLEAR) ictx.globalCompositeOperation = 'destination-out';
      else { sctx.save(); sctx.globalCompositeOperation = 'source-in'; sctx.fillStyle = at.color; sctx.fillRect(0, 0, SIZE, SIZE); sctx.restore(); }
      ictx.drawImage(scratch, 0, 0);
      ictx.restore();
      paint();
    }
    typer.addEventListener('input', styleTyper);
    typer.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); endText(true); } });

    /* ── the pointer ── */
    var drag = null, sprayTimer = 0, poly = null, curve = null, base = null, hover = null;
    function posOf(e, clamp) {
      var r = view.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * SIZE), y = Math.floor((e.clientY - r.top) / r.height * SIZE);
      return clamp === false ? [x, y] : [Math.max(0, Math.min(SIZE - 1, x)), Math.max(0, Math.min(SIZE - 1, y))];
    }
    function snap45(a, b) {
      var w = b[0] - a[0], h = b[1] - a[1], ang = Math.round(Math.atan2(h, w) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(w, h);
      return [Math.round(a[0] + Math.cos(ang) * len), Math.round(a[1] + Math.sin(ang) * len)];
    }
    function square(a, b) { var w = b[0] - a[0], h = b[1] - a[1], m = Math.max(Math.abs(w), Math.abs(h)); return [a[0] + Math.sign(w || 1) * m, a[1] + Math.sign(h || 1) * m]; }
    function fromBase() { ictx.putImageData(base, 0, 0); }
    view.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    view.addEventListener('dblclick', function (e) { if (st.tool === 'polygon' && poly) { e.preventDefault(); finishPoly(); } });
    view.addEventListener('pointerdown', function (e) {
      if (st.busy || (e.button !== 0 && e.button !== 2)) return;
      e.preventDefault(); closeMenu();
      var p = posOf(e), right = e.button === 2, A = right ? st.bg : st.fg, B = right ? st.fg : st.bg, t = st.tool;
      if (textAt) { endText(true); if (t === 'text') return; }
      if (t === 'pick') {
        var px = ictx.getImageData(p[0], p[1], 1, 1).data, hx = px[3] ? hexOf(px[0], px[1], px[2]) : CLEAR;
        if (right) st.bg = hx; else st.fg = hx;
        paintColors(); setTool(st.prevTool); return;
      }
      if (t === 'zoom') { setZoom(st.zoom === 1 ? ZOOMS[st.zoomOpt] || 2 : 1, p); return; }
      if (t === 'fill') { var before = ictx.getImageData(0, 0, SIZE, SIZE); if (flood(p[0], p[1], A)) { undo.push(before); if (undo.length > UNDO) undo.shift(); redo.length = 0; st.dirty = true; } paint(); return; }
      if (t === 'text') { dropSel(); startText(p[0], p[1]); return; }
      view.setPointerCapture(e.pointerId);
      if (t === 'select' || t === 'lasso') {
        if (sel && p[0] >= sel.x && p[0] < sel.x + sel.w && p[1] >= sel.y && p[1] < sel.y + sel.h) {
          if (!sel.float) lift();
          else if (e.ctrlKey || e.metaKey) { ictx.drawImage(floatShown(sel), sel.x, sel.y); }   // Ctrl: leave a copy
          drag = { kind: 'move', dx: p[0] - sel.x, dy: p[1] - sel.y }; return;
        }
        dropSel();
        drag = { kind: t, a: p, pts: [p] }; return;
      }
      dropSel();
      if (t === 'polygon') {
        if (!poly) { snapshot(); base = ictx.getImageData(0, 0, SIZE, SIZE); poly = { pts: [p, p], A: A, B: B }; }
        else poly.pts.push(p);
        drag = { kind: 'poly' }; drawPoly(); return;
      }
      if (t === 'curve') {
        if (!curve) { snapshot(); base = ictx.getImageData(0, 0, SIZE, SIZE); curve = { p0: p, p3: p, c1: null, c2: null, A: A, stage: 0 }; }
        drag = { kind: 'curve' }; return;
      }
      if (t === 'line' || SHAPED[t]) { snapshot(); base = ictx.getImageData(0, 0, SIZE, SIZE); drag = { kind: 'shape', a: p, b: p, A: A, B: B }; drawDrag(e.shiftKey); return; }
      snapshot();
      drag = { kind: 'free', last: p, A: A, right: right };
      if (t === 'airbrush') { spray(p[0], p[1], A); sprayTimer = setInterval(function () { if (drag) { spray(drag.last[0], drag.last[1], drag.A); paint(); } }, 30); }
      else freeAt(p[0], p[1]);
      paint();
    });
    function freeAt(x, y) {
      if (st.tool === 'pencil') put(ictx, x, y, 1, 1, drag.A);
      else if (st.tool === 'brush') tip(ictx, x, y, drag.A);
      else if (st.tool === 'eraser') erase(x, y, drag.right);
    }
    function drawDrag(shift) {
      fromBase();
      var a = drag.a, b = drag.b;
      if (st.tool === 'line') { if (shift) b = snap45(a, b); strokePts([a, b], drag.A); }
      else { if (shift) b = square(a, b); drawShape(st.tool, a, b, drag.A, drag.B); }
      paint(); paintStatus(Math.abs(b[0] - a[0]) + 1, Math.abs(b[1] - a[1]) + 1);
    }
    function drawPoly() { fromBase(); strokePts(poly.pts, poly.A, false); paint(); }
    function finishPoly() {
      if (!poly) return;
      var pts = poly.pts.filter(function (p, i, all) { return !i || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]; });
      fromBase();
      if (pts.length > 1) polygonInk(pts, poly.A, poly.B);
      poly = null; base = null; paint();
    }
    function drawCurve() {
      fromBase();
      var c = curve, pts = c.stage === 0 ? [c.p0, c.p3] : bezier(c.p0, c.c1, c.c2 || c.c1, c.p3);
      strokePts(pts, c.A); paint();
    }
    view.addEventListener('pointermove', function (e) {
      var p = posOf(e), raw = posOf(e, false);
      hover = raw[0] >= 0 && raw[1] >= 0 && raw[0] < SIZE && raw[1] < SIZE ? raw : null;
      paintStatus();
      if (!drag) return;
      if (drag.kind === 'move') { sel.x = p[0] - drag.dx; sel.y = p[1] - drag.dy; paint(); paintStatus(); return; }
      if (drag.kind === 'select') {
        var x = Math.min(drag.a[0], p[0]), y = Math.min(drag.a[1], p[1]);
        sel = { x: x, y: y, w: Math.abs(p[0] - drag.a[0]) + 1, h: Math.abs(p[1] - drag.a[1]) + 1, ox: x, oy: y, pts: null, float: null };
        startAnts(); paint(); paintStatus(); return;
      }
      if (drag.kind === 'lasso') {
        drag.pts.push(p);
        paint(); vctx.save(); vctx.strokeStyle = '#fff'; vctx.setLineDash([3, 3]); vctx.beginPath();
        drag.pts.forEach(function (q, i) { if (i) vctx.lineTo(q[0] + 0.5, q[1] + 0.5); else vctx.moveTo(q[0] + 0.5, q[1] + 0.5); });
        vctx.stroke(); vctx.restore(); return;
      }
      if (drag.kind === 'shape') { drag.b = p; drawDrag(e.shiftKey); return; }
      if (drag.kind === 'poly') { poly.pts[poly.pts.length - 1] = e.shiftKey ? snap45(poly.pts[poly.pts.length - 2], p) : p; drawPoly(); return; }
      if (drag.kind === 'curve') {
        if (curve.stage === 0) curve.p3 = e.shiftKey ? snap45(curve.p0, p) : p;
        else if (curve.stage === 1) curve.c1 = p; else curve.c2 = p;
        drawCurve(); return;
      }
      if (drag.kind === 'free') {
        if (st.tool !== 'airbrush') walk(drag.last[0], drag.last[1], p[0], p[1], freeAt);
        drag.last = p; paint();
      }
    });
    function up(e) {
      if (!drag) return;
      var d = drag; drag = null;
      clearInterval(sprayTimer); sprayTimer = 0;
      if (d.kind === 'select') { if (!sel || sel.w < 2 || sel.h < 2) { sel = null; paint(); } return; }
      if (d.kind === 'lasso') {
        var xs = d.pts.map(function (q) { return q[0]; }), ys = d.pts.map(function (q) { return q[1]; });
        var x = Math.min.apply(null, xs), y = Math.min.apply(null, ys), w = Math.max.apply(null, xs) - x + 1, h = Math.max.apply(null, ys) - y + 1;
        if (d.pts.length > 2 && w > 2 && h > 2) makeSel(x, y, w, h, d.pts); else paint();
        return;
      }
      if (d.kind === 'shape') { base = null; return; }
      if (d.kind === 'poly') {                                       // a click near the first corner closes it
        var f = poly.pts[0], l = poly.pts[poly.pts.length - 1];
        if (poly.pts.length > 3 && Math.hypot(l[0] - f[0], l[1] - f[1]) < 4) { poly.pts.pop(); finishPoly(); }
        return;
      }
      if (d.kind === 'curve') {
        curve.stage++;
        if (curve.stage === 1 && curve.p0[0] === curve.p3[0] && curve.p0[1] === curve.p3[1]) { curve.stage = 0; return; }
        if (curve.stage === 1) curve.c1 = curve.c2 = null;
        if (curve.stage > 2) { curve = null; base = null; }
        return;
      }
    }
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    view.addEventListener('pointerleave', function () { hover = null; paintStatus(); });

    /* ── tools, their options, zoom ── */
    function finishPending() { endText(true); if (poly) finishPoly(); if (curve) { curve = null; base = null; } }
    function setTool(t) {
      if (t !== st.tool) { finishPending(); if (t !== 'select' && t !== 'lasso') dropSel(); }
      if (t !== 'pick' && t !== 'zoom') st.prevTool = t;
      st.tool = t;
      root.querySelectorAll('.gp-tool').forEach(function (b) { var on = b.dataset.tool === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      view.dataset.tool = t;
      $('.gp-fontbar').hidden = t !== 'text';
      paintOptions(); paintStatus();
    }
    function optList(items, current, key) {
      return '<div class="gp-optlist" data-opt="' + key + '">' + items.map(function (html, i) { return '<button type="button" class="gp-opt' + (i === current ? ' is-on' : '') + '" data-i="' + i + '">' + html + '</button>'; }).join('') + '</div>';
    }
    function paintOptions() {
      var t = st.tool, box = $('.gp-opts'), html = '';
      if (t === 'select' || t === 'lasso' || t === 'text') html = optList(['<i class="gp-oimg gp-otr" style="--i:0"></i>', '<i class="gp-oimg gp-otr" style="--i:1"></i>'], st.opaque ? 0 : 1, 'opaque');
      else if (t === 'eraser') html = optList(ERASERS.map(function (n) { return '<i class="gp-sq" style="width:' + n * 2 + 'px;height:' + n * 2 + 'px"></i>'; }), st.eraser, 'eraser');
      else if (t === 'zoom') html = optList(ZOOMS.map(function (z, i) { return '<i class="gp-oimg gp-omag" style="--i:' + i + '"></i>'; }), st.zoomOpt, 'zoomOpt');
      else if (t === 'brush') html = optList(BRUSHES.map(function (b) { return '<i class="gp-btip" data-k="' + (b[0] === '\\' ? 'b' : b[0] === '/' ? 'f' : b[0]) + '" style="--n:' + b[1] + 'px"></i>'; }), st.brush, 'brush');
      else if (t === 'airbrush') html = optList(SPRAYS.map(function (s, i) { return '<i class="gp-oimg gp-oair" style="--i:' + i + '"></i>'; }), st.spray, 'spray');
      else if (t === 'line' || t === 'curve') html = optList(LINES.map(function (n) { return '<i class="gp-lw" style="height:' + n * 2 + 'px"></i>'; }), st.line, 'line');
      else if (SHAPED[t]) html = optList(['<i class="gp-fm" data-m="0"></i>', '<i class="gp-fm" data-m="1"></i>', '<i class="gp-fm" data-m="2"></i>'], st.fillMode, 'fillMode');
      box.innerHTML = html;
      box.dataset.tool = t;
    }
    $('.gp-opts').addEventListener('click', function (e) {
      var b = e.target.closest('.gp-opt'), list = e.target.closest('[data-opt]'); if (!b || !list) return;
      var key = list.dataset.opt, i = +b.dataset.i;
      if (key === 'opaque') st.opaque = i === 0; else st[key] = i;
      if (key === 'zoomOpt') setZoom(ZOOMS[i]);
      paintOptions(); if (textAt) styleTyper(); if (sel) paint();
    });
    $('.gp-tools').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
    root.querySelectorAll('.gp-tool').forEach(function (b) {
      b.addEventListener('mouseenter', function () { statusText(TOOLS.find(function (t) { return t[0] === b.dataset.tool; })[2]); });
      b.addEventListener('mouseleave', function () { statusText(null); });
    });
    // As a window the work area is just the sheet (and its scroll bars): no grey around it;
    // maximized (or on a phone) the sheet sits in the grey as in Paint
    var PAD = 24;                                                    // the work area's padding, the sheet's margin, a scroll bar
    function windowed() { return !root.classList.contains('is-max') && window.innerWidth > 760; }
    // the window's own bars (title, menu, colours, status): counted from them, the window itself may be cut by max-height
    function barsHeight() {
      var hgt = 8;
      [].forEach.call(app.children, function (c) { if (!c.classList.contains('gp-mid') && !c.hidden && c.offsetParent) hgt += c.offsetHeight; });
      return hgt;
    }
    function fitZoom() {
      var w, h;
      if (windowed()) {
        // the sheet's room: the desktop above the taskbar less the window's own bars (the tool box
        // stands beside the sheet, so it is the middle row's height that counts)
        var r = root.getBoundingClientRect(), bar = $('.gp-taskbar').offsetHeight, mid = $('.gp-mid');
        w = r.width - 24 - (app.offsetWidth - work.offsetWidth) - PAD;
        h = r.height - bar - 24 - barsHeight() - PAD;
      } else { w = work.clientWidth - 12; h = work.clientHeight - 12; }
      var z = [2, 1.5, 1].find(function (k) { return SIZE * k <= w && SIZE * k <= h; });
      return z || Math.max(0.5, Math.floor(Math.min(w, h) / SIZE * 20) / 20);   // small: as large as fits
    }
    function setZoom(z, at) {
      st.zoom = z;
      view.style.width = view.style.height = (SIZE * z) + 'px';
      if (windowed()) {
        if (!st.fit || z <= st.fit) st.fit = z;                      // the lupa's 6× and 8× scroll inside the window's size
        work.style.width = work.style.height = (SIZE * Math.min(z, st.fit) + PAD) + 'px';
      } else work.style.width = work.style.height = '';
      if (at && z > 2) { work.scrollLeft = at[0] * z - work.clientWidth / 2; work.scrollTop = at[1] * z - work.clientHeight / 2; }
      if (textAt) styleTyper();
    }
    function refit() {
      st.fit = 0; work.style.width = work.style.height = '';
      // a short screen (the app's frame is often ~630 px): the tool box with 1× icons, else the window would spill over the taskbar
      root.classList.remove('is-compact');
      if (windowed()) {
        var r = root.getBoundingClientRect(), room = r.height - $('.gp-taskbar').offsetHeight - 24 - barsHeight();
        if ($('.gp-toolbox').scrollHeight > room) root.classList.add('is-compact');
      }
      setZoom(1); var z = fitZoom(); st.fit = z; setZoom(z);
    }

    /* ── colours ── */
    function paintPalette() {
      $('.gp-pal').innerHTML = palette.map(function (row, r) {
        return row.map(function (c, i) { return '<button type="button" class="gp-sw' + (c === CLEAR ? ' is-clear' : '') + '" data-r="' + r + '" data-i="' + i + '" style="--c:' + (c === CLEAR ? 'transparent' : c) + '" title="' + (c === CLEAR ? 'Caurspīdīgs' : c) + '" aria-label="' + (c === CLEAR ? 'Caurspīdīgs' : c) + '"></button>'; }).join('');
      }).join('');
    }
    function paintColors() {
      var f = $('.gp-fgc'), b = $('.gp-bgc');
      f.style.setProperty('--c', st.fg === CLEAR ? 'transparent' : st.fg); f.classList.toggle('is-clear', st.fg === CLEAR);
      b.style.setProperty('--c', st.bg === CLEAR ? 'transparent' : st.bg); b.classList.toggle('is-clear', st.bg === CLEAR);
      if (textAt) { textAt.color = st.fg; styleTyper(); }
    }
    var pal = $('.gp-pal');
    pal.addEventListener('click', function (e) { var b = e.target.closest('.gp-sw'); if (b) { st.fg = palette[b.dataset.r][b.dataset.i]; paintColors(); } });
    pal.addEventListener('contextmenu', function (e) { var b = e.target.closest('.gp-sw'); if (b) { e.preventDefault(); st.bg = palette[b.dataset.r][b.dataset.i]; paintColors(); } });
    pal.addEventListener('dblclick', function (e) { var b = e.target.closest('.gp-sw'); if (b && palette[b.dataset.r][b.dataset.i] !== CLEAR) editColor(+b.dataset.r, +b.dataset.i); });
    $('.gp-cur').addEventListener('click', function () { var t = st.fg; st.fg = st.bg; st.bg = t; paintColors(); });
    var picker = $('.gp-picker'), picking = null;
    function editColor(r, i) {
      picking = { r: r, i: i };
      picker.value = r == null ? (st.fg === CLEAR ? '#ffffff' : st.fg) : palette[r][i];
      picker.click();
    }
    picker.addEventListener('input', function () {
      st.fg = picker.value;
      if (picking && picking.r != null) { palette[picking.r][picking.i] = picker.value; paintPalette(); }
      paintColors();
    });

    /* ── the status bar ── */
    var statusOver = null;
    function statusText(t) { statusOver = t; paintStatus(); }
    function paintStatus(w, h) {
      $('.gp-st-text').textContent = statusOver || 'Kreisā poga: priekšplāna krāsa, labā: fona krāsa.';
      $('.gp-st-xy').textContent = hover ? hover[0] + ',' + hover[1] : '';
      $('.gp-st-wh').textContent = w ? w + '×' + h : sel ? sel.w + '×' + sel.h : '';
    }

    /* ── the fonts bar ── */
    $('.gp-font').addEventListener('change', function () { st.font = +this.value; styleTyper(); });
    $('.gp-size').addEventListener('change', function () { st.size = +this.value; styleTyper(); });
    $('.gp-bold').addEventListener('click', function () { st.bold = !st.bold; this.setAttribute('aria-pressed', String(st.bold)); styleTyper(); });
    $('.gp-italic').addEventListener('click', function () { st.italic = !st.italic; this.setAttribute('aria-pressed', String(st.italic)); styleTyper(); });
    $('.gp-fontbar').addEventListener('mousedown', function (e) { if (textAt && e.target.tagName !== 'SELECT') e.preventDefault(); });

    /* ── the menus ── */
    var MENUS = {
      file: [['Jauna balta lapa', 'Ctrl+N', 'new'], ['Nosūtīt uz galeriju', 'Ctrl+S', 'save'], null, ['Iziet', 'Alt+F4', 'close']],
      edit: [['Atsaukt', 'Ctrl+Z', 'undo'], ['Atkārtot', 'Ctrl+Y', 'redo'], null, ['Izgriezt', 'Ctrl+X', 'cut'], ['Kopēt', 'Ctrl+C', 'copy'], ['Ielīmēt', 'Ctrl+V', 'paste'], ['Notīrīt atlasi', 'Del', 'delete'], ['Atlasīt visu', 'Ctrl+A', 'all']],
      view: [['Rīku kaste', 'Ctrl+T', 'toggle-tools'], ['Krāsu kaste', 'Ctrl+L', 'toggle-colors'], ['Statusa josla', '', 'toggle-status'], null, ['Parasts izmērs', 'Ctrl+PgUp', 'zoom-1'], ['Liels izmērs', 'Ctrl+PgDn', 'zoom-fit'], ['Ļoti liels izmērs', '', 'zoom-6']],
      image: [['Apmest horizontāli', '', 'flip-h'], ['Apmest vertikāli', '', 'flip-v'], ['Pagriezt par 90°', '', 'rot-90'], ['Pagriezt par 180°', '', 'rot-180'], ['Pagriezt par 270°', '', 'rot-270'], null, ['Invertēt krāsas', 'Ctrl+I', 'invert'], ['Notīrīt attēlu', 'Ctrl+Shift+N', 'clear'], null, ['Punktu kontūra', '', 'fx-outline'], ['Punktu ēna', '', 'fx-shadow'], ['Punktu spīdums', '', 'fx-glow']],
      colors: [['Rediģēt krāsas…', '', 'edit-color']],
      help: [['Par Paint', '', 'about']],
      // Mani attēli
      xfile: [['Atvērt', 'Enter', 'x-open'], ['Atvērt Paint', '', 'x-paint'], null, ['Dzēst', 'Del', 'x-delete'], null, ['Aizvērt', '', 'x-close']],
      xedit: [['Atlasīt pirmo', '', 'x-first']],
      xview: [['Lielas ikonas', '', 'x-large'], ['Saraksts', '', 'x-list']],
      xhelp: [['Par Mani attēli', '', 'x-about']]
    };
    var menuOpen = null, menu = $('.gp-menu');
    function checked(act) {
      return (act === 'toggle-tools' && !$('.gp-toolbox').hidden) || (act === 'toggle-colors' && !$('.gp-colorbox').hidden) || (act === 'toggle-status' && !$('.gp-status').hidden)
        || (act === 'x-large' && !listView) || (act === 'x-list' && listView);
    }
    function enabled(act) {
      if (act === 'undo') return undo.length > 0;
      if (act === 'redo') return redo.length > 0;
      if (act === 'cut' || act === 'copy' || act === 'delete') return !!sel;
      if (act === 'paste') return !!clip;
      if (act === 'x-open' || act === 'x-paint') return picked >= 0;
      if (act === 'x-delete') return canDelete(picked);
      if (act === 'x-first') return pics.length > 0;
      return true;
    }
    function openMenu(name) {
      var btn = root.querySelector('[data-menu="' + name + '"]');
      menuOpen = name;
      root.querySelectorAll('.gp-mb').forEach(function (b) { b.classList.toggle('is-open', b === btn); });
      menu.innerHTML = MENUS[name].map(function (it) {
        if (!it) return '<hr>';
        return '<button type="button" class="gp-mi' + (checked(it[2]) ? ' is-check' : '') + '" data-do="' + it[2] + '"' + (enabled(it[2]) ? '' : ' disabled') + ' role="menuitem"><span>' + esc(it[0]) + '</span><kbd>' + esc(it[1]) + '</kbd></button>';
      }).join('');
      var r = btn.getBoundingClientRect(), rr = root.getBoundingClientRect();
      menu.style.left = (r.left - rr.left) + 'px'; menu.style.top = (r.bottom - rr.top) + 'px';
      menu.hidden = false;
    }
    function closeMenu() { if (!menuOpen) return; menuOpen = null; menu.hidden = true; root.querySelectorAll('.gp-mb').forEach(function (b) { b.classList.remove('is-open'); }); }
    function wireMenubar(bar) {
      bar.addEventListener('click', function (e) { var b = e.target.closest('[data-menu]'); if (!b) return; if (menuOpen === b.dataset.menu) closeMenu(); else openMenu(b.dataset.menu); });
      bar.addEventListener('mouseover', function (e) { var b = e.target.closest('[data-menu]'); if (b && menuOpen && menuOpen !== b.dataset.menu) openMenu(b.dataset.menu); });
    }
    wireMenubar($('.gp-menubar'));
    menu.addEventListener('click', function (e) { var b = e.target.closest('[data-do]'); if (!b || b.disabled) return; closeMenu(); run(b.dataset.do); });
    root.addEventListener('pointerdown', function (e) { if (menuOpen && !e.target.closest('.gp-menu, .gp-menubar')) closeMenu(); }, true);

    function run(act) {
      if (act === 'save') return save();
      if (act === 'admin') return adminLogin();
      if (act === 'x-open') return viewPicture(picked);
      if (act === 'x-delete') return deletePicture(picked);
      if (act === 'x-paint') return openInPaint(picked);
      if (act === 'x-close') return closeWin('pics');
      if (act === 'x-first') return pick(0);
      if (act === 'x-large' || act === 'x-list') return setListView(act === 'x-list');
      if (act === 'x-about') return dialog('Par Mani attēli', '<div class="gp-about">' + pixImg('pics', 32) + '<div><b>Mani attēli</b><p>Visi galerijas zīmējumi. Dubultklikšķis atver attēlu, no tā to var ielikt Paint.</p></div></div>', [{ label: 'Labi', main: true }]);
      if (act === 'new') { finishPending(); dropSel(true); snapshot(); put(ictx, 0, 0, SIZE, SIZE, '#ffffff'); paint(); return; }
      if (act === 'minimize') return minimize(true);
      if (act === 'maximize') { var mx = root.classList.toggle('is-max'); $('.gp-tbb-max').classList.toggle('is-restore', mx); refit(); return; }
      if (act === 'close') return close(false);
      if (act === 'undo') return restore(undo, redo);
      if (act === 'redo') return restore(redo, undo);
      if (act === 'all') { finishPending(); dropSel(); setTool('select'); makeSel(0, 0, SIZE, SIZE); return; }
      if (act === 'copy' || act === 'cut') { if (!sel) return; var c = regionCanvas(); clip = canvas(c.width, c.height); clip.getContext('2d').drawImage(c, 0, 0); if (act === 'cut') { sel.float = null; dropSel(true); } return; }
      if (act === 'paste') { if (!clip) return; var cc = canvas(clip.width, clip.height); cc.getContext('2d').drawImage(clip, 0, 0); setTool('select'); floatFrom(cc, 0, 0); return; }
      if (act === 'delete') { if (!sel) return; lift(); dropSel(true); return; }
      if (act === 'toggle-tools' || act === 'toggle-colors' || act === 'toggle-status') { var el = $(act === 'toggle-tools' ? '.gp-toolbox' : act === 'toggle-colors' ? '.gp-colorbox' : '.gp-status'); el.hidden = !el.hidden; return; }
      if (act === 'zoom-1') return setZoom(1);
      if (act === 'zoom-fit') return refit();
      if (act === 'zoom-6') return setZoom(6);
      if (act === 'flip-h') return transform(flipH);
      if (act === 'flip-v') return transform(flipV);
      if (act === 'rot-90') return transform(rotate(1));
      if (act === 'rot-180') return transform(rotate(2));
      if (act === 'rot-270') return transform(rotate(3));
      if (act === 'invert') return transform(invert);
      if (act === 'clear') { finishPending(); dropSel(true); snapshot(); put(ictx, 0, 0, SIZE, SIZE, st.bg); paint(); return; }
      if (act.indexOf('fx-') === 0) {
        finishPending(); dropSel();
        var src = ictx.getImageData(0, 0, SIZE, SIZE), has = false;
        for (var i = 3; i < src.data.length; i += 4) if (src.data[i]) { has = true; break; }
        if (!has) return;
        var kind = act.slice(3), color = kind === 'shadow' ? '#000080' : kind === 'outline' ? (st.fg === '#ffffff' ? '#0080ff' : '#ffffff') : (st.fg === CLEAR ? '#80c0ff' : st.fg);
        snapshot(); ictx.putImageData(dotEffect(src, kind, color), 0, 0); paint(); return;
      }
      if (act === 'edit-color') return editColor(null, null);
      if (act === 'about') {
        return dialog('Par Paint', '<div class="gp-about">' + sprite(7) + '<div><b>Paint</b><p>Galerijas zīmētājs MS Paint (Windows 98) izskatā.</p><p>Rīku ikonas: <a href="https://github.com/1j01/jspaint" target="_blank" rel="noopener">JS Paint</a>, © 2022 Isaiah Odhner, MIT licence.</p></div></div>', [{ label: 'Labi', main: true }]);
      }
    }

    /* ── dialogs ── */
    function dialog(title, html, buttons) {
      var layer = $('.gp-dialog-layer');
      layer.innerHTML = '<section class="gp-dlg" role="alertdialog" aria-label="' + esc(title) + '"><header class="gp-tb"><span class="gp-tb-title">' + esc(title) + '</span><button type="button" class="gp-tbb gp-tbb-x" data-dlg="-1" aria-label="Aizvērt"></button></header>'
        + '<div class="gp-dlg-body">' + html + '</div><div class="gp-dlg-btns">' + buttons.map(function (b, i) { return '<button type="button" class="gp-btn' + (b.main ? ' is-default' : '') + '" data-dlg="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div></section>';
      layer.hidden = false;
      layer.onclick = function (e) {
        var b = e.target.closest('[data-dlg]'); if (!b) return;
        var field = layer.querySelector('input'), value = field ? field.value : '';
        layer.hidden = true; layer.innerHTML = '';
        var it = buttons[+b.dataset.dlg]; if (it && it.run) it.run(value);
      };
      var first = layer.querySelector('input') || layer.querySelector('.is-default'); if (first) first.focus();
    }
    function warn(text, buttons) { dialog('Paint', '<div class="gp-warn"><i class="gp-warn-ico" aria-hidden="true"></i><p>' + esc(text) + '</p></div>', buttons); }

    /* ── closing, sending ── */
    function close(force) {
      if (st.closed) return;
      if (!force && st.dirty) {
        warn('Izmest šo zīmējumu?', [{ label: 'Izmest', main: true, run: function () { close(true); } }, { label: 'Palikt' }]);
        return;
      }
      st.closed = true; openNow = null;
      clearInterval(antsTimer); clearInterval(sprayTimer); clearInterval(clockTimer);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', swallow, true);
      window.removeEventListener('paste', onPaste, true);
      window.removeEventListener('resize', onResize);
      var gone = function () {
        root.remove();
        if (window.MinkaGallery3D && window.MinkaGallery3D.pause) window.MinkaGallery3D.pause(false);
      };
      gone();                                                        // as Windows closed a program: gone at once
    }

    /* ── Windows 98: windows on the desktop, a taskbar button for each ── */
    var app = $('.gp-app'), zoombar = $('.gp-zoombar'), tasks = $('.gp-tasks');
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var wins = {}, zTop = 10, activeId = 'paint';
    // minimizing: only the window's title bar travels to its taskbar button (as Windows 98 drew it), in hard steps
    function caption(fromEl, toEl, before, after) {
      var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect(), r = root.getBoundingClientRect();
      if (before) before();
      if (calm || !zoombar.animate) { if (after) after(); return; }
      var box = function (q, bar) { return { left: (q.left - r.left) + 'px', top: (q.top - r.top) + 'px', width: q.width + 'px', height: (bar ? 22 : q.height) + 'px' }; };
      var fromBar = fromEl.classList.contains('gp-win'), toBar = toEl.classList.contains('gp-win');
      zoombar.hidden = false;
      Object.assign(zoombar.style, box(a, fromBar));
      var anim = zoombar.animate([box(a, fromBar), box(b, toBar)], { duration: 240, easing: 'steps(9, end)', fill: 'forwards' });
      anim.onfinish = anim.oncancel = function () { zoombar.hidden = true; anim.cancel(); if (after) after(); };
    }
    function topVisible() {
      var best = null, z = -1;
      Object.keys(wins).forEach(function (k) { var e = wins[k].el; if (!e.hidden && (+e.style.zIndex || 0) > z) { z = +e.style.zIndex || 0; best = k; } });
      return best;
    }
    function focusWin(id) {
      var w = wins[id]; if (!w) return;
      activeId = id; w.el.style.zIndex = ++zTop;
      Object.keys(wins).forEach(function (k) {
        var o = wins[k];
        o.el.classList.toggle('is-inactive', k !== id);
        o.task.classList.toggle('is-on', k === id && !o.el.hidden);
      });
    }
    function addTask(id, icon, title) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'gp-task'; b.dataset.win = id;
      b.innerHTML = icon + '<span class="gp-task-name">' + esc(title) + '</span>';
      tasks.appendChild(b);
      return b;
    }
    function minimizeWin(id, on) {
      closeMenu(); startMenu(false);
      var w = wins[id]; if (!w) return;
      var el = w.el;
      if (on) {
        if (el.hidden) return;
        w.task.classList.remove('is-on');
        caption(el, w.task, function () { el.style.visibility = 'hidden'; }, function () {
          el.hidden = true; el.style.visibility = '';
          var next = topVisible(); if (next) focusWin(next); else activeId = null;
        });
      } else {
        if (!el.hidden) { focusWin(id); return; }
        el.hidden = false; el.style.visibility = 'hidden'; focusWin(id);
        caption(w.task, el, null, function () { el.style.visibility = ''; });
      }
    }
    function minimize(on) { minimizeWin('paint', on); }
    tasks.addEventListener('click', function (e) {
      var b = e.target.closest('.gp-task'); if (!b) return;
      var id = b.dataset.win, w = wins[id];
      if (w.el.hidden) minimizeWin(id, false); else if (activeId === id) minimizeWin(id, true); else focusWin(id);
    });
    // a window dragged by its title bar (kept on the desktop)
    function draggable(el, maxed) {
      var tbar = el.querySelector('.gp-tb'), at = null, off = [0, 0];
      tbar.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 || e.target.closest('button') || maxed()) return;
        var t = (el.style.translate || '').match(/-?[\d.]+/g);          // where it was put (also by the code, not only dragged)
        off = t ? [+t[0] || 0, +t[1] || 0] : [0, 0];
        tbar.setPointerCapture(e.pointerId);
        at = { x: e.clientX - off[0], y: e.clientY - off[1] };
      });
      tbar.addEventListener('pointermove', function (e) {
        if (!at) return;
        var r = root.getBoundingClientRect(), a = el.getBoundingClientRect(), nx = e.clientX - at.x, ny = e.clientY - at.y;
        var cx = a.left - off[0], cy = a.top - off[1];
        nx = Math.max(r.left - cx - a.width + 80, Math.min(r.right - cx - 80, nx));
        ny = Math.max(r.top - cy, Math.min(r.bottom - cy - 60, ny));
        off = [nx, ny]; el.style.translate = nx + 'px ' + ny + 'px';
      });
      var drop = function () { at = null; };
      tbar.addEventListener('pointerup', drop); tbar.addEventListener('pointercancel', drop);
    }
    wins.paint = { el: app, task: addTask('paint', paintImg(16), 'bez nosaukuma - Paint') };
    draggable(app, function () { return root.classList.contains('is-max'); });
    app.querySelector('.gp-tb').addEventListener('dblclick', function (e) { if (!e.target.closest('button')) run('maximize'); });
    app.addEventListener('pointerdown', function () { if (activeId !== 'paint') focusWin('paint'); }, true);
    focusWin('paint');                                               // Paint over the desktop's icons from the start
    // Mani attēli opens at once beside Paint (to its right, else its left); with no room (a phone) it waits on the taskbar
    function openPicturesBeside() {
      // Paint in the middle, the folder at the desktop's right edge (as wide as there is room, at most 600),
      // as tall as Paint; only without that room does Paint move left, past the desktop's icons
      var r = root.getBoundingClientRect(), gap = 12, bar = $('.gp-taskbar').offsetHeight, a = app.getBoundingClientRect();
      var room = function () { return r.right - gap - (app.getBoundingClientRect().right + gap); };
      if (windowed() && room() < 360) { var dx = Math.min(0, r.left + 100 - a.left); if (dx) app.style.translate = dx + 'px 0px'; }
      a = app.getBoundingClientRect();
      var top = a.top - r.top, height = Math.min(a.height, r.height - bar - top - 8), w = Math.min(600, room());
      if (w >= 300) openPictures({ left: r.width - gap - w, top: top, width: w, height: height });
      else { openPictures(); wins.pics.el.hidden = true; wins.pics.task.classList.remove('is-on'); }   // no room (a phone): it waits on the taskbar
      focusWin('paint');
    }

    // any other window: a title bar with its three buttons, cascaded over the desktop
    function newWin(id, cls, icon16, title, body, w, h, place) {
      if (wins[id]) { minimizeWin(id, false); return wins[id]; }
      var el = document.createElement('section'), n = Object.keys(wins).length;
      el.className = 'gp-win gp-win98 ' + cls;
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
      el.innerHTML = '<header class="gp-tb"><span class="gp-tb-ico">' + icon16 + '</span><span class="gp-tb-title">' + esc(title) + '</span>'
        + '<button type="button" class="gp-tbb gp-tbb-min" data-w="min" aria-label="Minimizēt"></button><button type="button" class="gp-tbb gp-tbb-max" data-w="max" aria-label="Maksimizēt"></button>'
        + '<button type="button" class="gp-tbb gp-tbb-x" data-w="close" aria-label="Aizvērt"></button></header>' + body;
      var r = root.getBoundingClientRect();
      el.style.width = Math.min(w, r.width - 16) + 'px'; el.style.height = Math.min(h, r.height - 46) + 'px';
      el.style.left = Math.max(4, Math.min(r.width - w - 8, 96 + n * 26)) + 'px'; el.style.top = Math.max(4, Math.min(r.height - h - 40, 24 + n * 24)) + 'px';
      if (place) Object.keys(place).forEach(function (k) { el.style[k] = place[k] + 'px'; });
      root.insertBefore(el, $('.gp-taskbar'));
      var o = wins[id] = { el: el, task: addTask(id, icon16, title) };
      var toggleMax = function () { var m = el.classList.toggle('is-max'); el.querySelector('.gp-tbb-max').classList.toggle('is-restore', m); };
      draggable(el, function () { return el.classList.contains('is-max'); });
      el.querySelector('.gp-tb').addEventListener('dblclick', function (e) { if (!e.target.closest('button')) toggleMax(); });
      el.querySelector('.gp-tb').addEventListener('click', function (e) {
        var b = e.target.closest('[data-w]'); if (!b) return;
        if (b.dataset.w === 'min') minimizeWin(id, true); else if (b.dataset.w === 'max') toggleMax(); else closeWin(id);
      });
      el.addEventListener('pointerdown', function () { if (activeId !== id) focusWin(id); }, true);
      focusWin(id);
      return o;
    }
    function closeWin(id) {
      var w = wins[id]; if (!w || id === 'paint') return;
      w.el.remove(); w.task.remove(); delete wins[id];
      var next = topVisible(); if (next) focusWin(next); else activeId = null;
    }

    /* ── Mani attēli: the gallery's drawings as a folder (thumbnails), a picture opened in a viewer ── */
    var pics = (options.pictures || []).filter(function (p) { return p && p.url; });
    var picNames = namesOf();
    function namesOf() {
      var seen = {};
      return pics.map(function (p) {
        var base = p.title || ((p.author || 'Zīmējums') + (dayShort(p.day) ? ' ' + dayShort(p.day) : '')), name = base, k = 2;
        while (seen[name]) name = base + ' (' + (k++) + ')';
        seen[name] = 1;
        return name + '.bmp';
      });
    }
    function iconsHtml() {
      return pics.length ? pics.map(function (p, i) {
        return '<button type="button" class="gp-xi' + (p.own ? ' is-own' : '') + '" data-i="' + i + '" role="option" title="' + esc(picNames[i]) + '"><span class="gp-xthumb"><img src="' + esc(p.url) + '" alt="" loading="lazy" decoding="async" draggable="false"></span><span class="gp-xname">' + esc(picNames[i]) + '</span></button>';
      }).join('') : '<p class="gp-xempty">Šeit vēl nav neviena zīmējuma.</p>';
    }
    function countText() { return pics.length + ' objekt' + (pics.length % 10 === 1 && pics.length % 100 !== 11 ? 's' : 'i'); }
    var picked = -1, listView = false;
    function openPictures(place) {
      if (wins.pics) { minimizeWin('pics', false); return; }
      var body = '<nav class="gp-menubar gp-xmenubar" role="menubar">'
        + [['xfile', 'Fails'], ['xedit', 'Labot'], ['xview', 'Skats'], ['xhelp', 'Palīdzība']].map(function (m) { return '<button type="button" class="gp-mb" data-menu="' + m[0] + '"><u>' + m[1].charAt(0) + '</u>' + m[1].slice(1) + '</button>'; }).join('')
        + '</nav><div class="gp-xtools"><button type="button" class="gp-xtb" disabled><i class="gp-xarrow is-back"></i>Atpakaļ</button><button type="button" class="gp-xtb" disabled><i class="gp-xarrow is-up"></i>Uz augšu</button><span class="gp-xsep"></span>'
        + '<button type="button" class="gp-xtb" data-x="del" disabled><i class="gp-xdel"></i>Dzēst</button><span class="gp-xsep"></span>'
        + '<button type="button" class="gp-xtb" data-x="view"><i class="gp-xviews"></i>Skati</button></div>'
        + '<div class="gp-xaddr"><span>Adrese</span><div class="gp-xaddr-box">' + pixImg('folder', 16) + 'Mani attēli</div></div>'
        + '<div class="gp-xbody"><aside class="gp-xside">' + pixImg('pics', 32) + '<h2>Mani attēli</h2><i class="gp-xline"></i><div class="gp-xdesc"></div></aside>'
        + '<div class="gp-xicons" tabindex="0" role="listbox" aria-label="Attēli">'
        + iconsHtml()
        + '</div></div><div class="gp-status"><span class="gp-xcount">' + countText() + '</span><span class="gp-xcomp">' + pixImg('computer', 16) + 'Mans dators</span></div>';
      var w = newWin('pics', 'gp-explorer', pixImg('folder', 16), 'Mani attēli', body, 760, 520, place);
      var el = w.el;
      el.classList.toggle('is-narrow', el.offsetWidth < 560);         // a narrow window: the pictures without the side panel
      wireMenubar(el.querySelector('.gp-xmenubar'));
      paintPick();
      var grid = el.querySelector('.gp-xicons');
      grid.addEventListener('click', function (e) { var b = e.target.closest('.gp-xi'); pick(b ? +b.dataset.i : -1); });
      grid.addEventListener('dblclick', function (e) { var b = e.target.closest('.gp-xi'); if (b) viewPicture(+b.dataset.i); });
      el.querySelector('[data-x="view"]').addEventListener('click', function () { setListView(!listView); });
      el.querySelector('[data-x="del"]').addEventListener('click', function () { deletePicture(picked); });
    }
    // Dzēst: only one's own drawing (the gallery's own rule), after a Windows 98 question; gone for everyone
    function canDelete(i) { return !!(pics[i] && ((pics[i].own && options.onDelete) || (adminPw && options.admin))); }
    // Administrators (Start menu): the password goes to the server, which says yes or no; kept only
    // in this window's memory while Paint is open. Then any drawing can be deleted, for good.
    var adminPw = '';
    function adminLogin() {
      if (adminPw) {
        adminPw = ''; paintAdmin();
        return warn('Administratora režīms izslēgts.', [{ label: 'Labi', main: true }]);
      }
      dialog('Administrators', '<div class="gp-warn"><img class="gp-pix" src="' + pixIcon('key') + '" width="32" height="32" alt=""><div><p>Ievadi administratora paroli:</p><input type="password" class="gp-pass" autocomplete="off" maxlength="80" aria-label="Parole"></div></div>',
        [{ label: 'Labi', main: true, run: function (pw) {
          if (!pw) return;
          options.admin.check(pw).then(function () {
            adminPw = pw; paintAdmin();
            warn('Administratora režīms: vari dzēst jebkuru zīmējumu.', [{ label: 'Labi', main: true }]);
          }, function (err) { warn(err && err.message ? err.message : 'Nepareiza parole.', [{ label: 'Labi', main: true }]); });
        } }, { label: 'Atcelt' }]);
    }
    function paintAdmin() {
      var k = $('.gp-tray-key'); if (k) k.hidden = !adminPw;
      var item = $('.gp-sm-admin span'); if (item) item.innerHTML = adminPw ? 'Iziet no a<u>d</u>ministratora' : 'A<u>d</u>ministrators…';
      if (wins.pics) wins.pics.el.classList.toggle('is-admin', !!adminPw);
      pick(picked);
    }
    function deletePicture(i) {
      var p = pics[i];
      if (!p) return;
      if (!canDelete(i)) { warn('Dzēst var tikai savus zīmējumus.', [{ label: 'Labi', main: true }]); return; }
      var asAdmin = !(p.own && options.onDelete);
      warn(asAdmin ? 'Izdzēst „' + picNames[i] + '” uz visiem laikiem? Tas pazudīs galerijā visiem.' : 'Vai tiešām izdzēst „' + picNames[i] + '”? Tas pazudīs arī galerijā.', [{ label: 'Jā', main: true, run: function () {
        var del = wins.pics && wins.pics.el.querySelector('[data-x="del"]');
        if (del) del.disabled = true;
        Promise.resolve(asAdmin ? options.admin.remove(p, adminPw) : options.onDelete(p)).then(function () {
          var at = pics.indexOf(p); if (at < 0) return;
          pics.splice(at, 1); picNames = namesOf();
          if (wins.view && viewing === at) closeWin('view'); else if (viewing > at) viewing--;
          if (wins.pics) {
            wins.pics.el.querySelector('.gp-xicons').innerHTML = iconsHtml();
            wins.pics.el.querySelector('.gp-xcount').textContent = countText();
          }
          pick(pics.length ? Math.min(at, pics.length - 1) : -1);
        }, function (err) {
          warn(err && err.message ? err.message : 'Neizdevās izdzēst.', [{ label: 'Labi', main: true }]);
          pick(picked);
        });
      } }, { label: 'Nē' }]);
    }
    function setListView(on) { listView = on; if (wins.pics) wins.pics.el.querySelector('.gp-xicons').classList.toggle('is-list', on); }
    function pick(i) {
      picked = i;
      if (!wins.pics) return;
      wins.pics.el.querySelectorAll('.gp-xi').forEach(function (b) { b.classList.toggle('is-sel', +b.dataset.i === i); b.setAttribute('aria-selected', String(+b.dataset.i === i)); });
      wins.pics.el.querySelector('[data-x="del"]').disabled = !canDelete(i);
      paintPick();
    }
    function paintPick() {
      var d = wins.pics && wins.pics.el.querySelector('.gp-xdesc'); if (!d) return;
      var p = pics[picked];
      d.innerHTML = p ? '<b>' + esc(picNames[picked]) + '</b><p>Bitkartes attēls</p>' + (p.title ? '<p>Nosaukums: ' + esc(p.title) + '</p>' : '') + (p.author ? '<p>Autors: ' + esc(p.author) + '</p>' : '')
        + (p.day ? '<p>Diena: ' + esc(p.day.split('-').reverse().join('.')) + '</p>' : '') + '<p>Izmēri: 384 × 384</p>'
        + '<p class="gp-xown">' + (p.own ? 'Tavs zīmējums: to var izdzēst.' : adminPw ? 'Administrators: var izdzēst.' : 'Dzēst var tikai savus zīmējumus.') + '</p><img class="gp-xprev" src="' + esc(p.url) + '" alt="">'
        : '<p>Izvēlies attēlu, lai redzētu tā aprakstu.</p>';
    }
    var viewing = -1;
    function viewPicture(i) {
      viewing = i;
      var p = pics[i]; if (!p) return;
      var title = picNames[i] + ' - Attēlu priekšskatījums';
      if (!wins.view) {
        var body = '<div class="gp-vbody"><img class="gp-vimg" alt=""></div><div class="gp-vbar">'
          + '<button type="button" class="gp-btn gp-vnav" data-v="prev" aria-label="Iepriekšējais">◀</button><button type="button" class="gp-btn gp-vnav" data-v="next" aria-label="Nākamais">▶</button>'
          + '<span class="gp-vname"></span><button type="button" class="gp-btn is-default" data-v="paint">Atvērt Paint</button></div>';
        var w = newWin('view', 'gp-viewer', pixImg('pics', 16), title, body, 470, 540);
        w.el.querySelector('.gp-vbar').addEventListener('click', function (e) {
          var b = e.target.closest('[data-v]'); if (!b) return;
          if (b.dataset.v === 'prev') viewPicture((viewing - 1 + pics.length) % pics.length);
          else if (b.dataset.v === 'next') viewPicture((viewing + 1) % pics.length);
          else openInPaint(viewing);
        });
      } else minimizeWin('view', false);
      var el = wins.view.el;
      el.querySelector('.gp-tb-title').textContent = title;
      wins.view.task.querySelector('.gp-task-name').textContent = title;
      el.querySelector('.gp-vimg').src = p.url;
      el.querySelector('.gp-vname').textContent = (p.author || '') + (p.day ? '  ' + p.day.split('-').reverse().join('.') : '');
      pick(i);
    }
    // a picture into Paint: on a white sheet, as a new drawing (its own author stays in the gallery)
    function openInPaint(i) {
      var p = pics[i]; if (!p) return;
      var go = function () {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = function () {
          finishPending(); dropSel(true); snapshot();
          skyBehind();
          var k = Math.min(SIZE / im.width, SIZE / im.height), w = im.width * k, h = im.height * k;
          ictx.imageSmoothingEnabled = false;                          // a drawing's pixels stay pixels
          ictx.drawImage(im, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
          ictx.imageSmoothingEnabled = true;
          paint(); minimizeWin('paint', false); focusWin('paint');
        };
        im.onerror = function () { warn('Šo attēlu neizdevās atvērt.', [{ label: 'Labi', main: true }]); };
        im.src = p.url;
      };
      if (st.dirty) warn('Aizstāt pašreizējo zīmējumu ar šo attēlu?', [{ label: 'Aizstāt', main: true, run: go }, { label: 'Atcelt' }]);
      else go();
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-desk]'); if (!b) return;
      if (b.classList.contains('gp-dicon') && e.detail === 1 && b.dataset.desk !== 'paint' && matchMedia('(pointer: fine)').matches) {
        root.querySelectorAll('.gp-dicon').forEach(function (x) { x.classList.toggle('is-sel', x === b); });   // one click selects, two open
        return;
      }
      startMenu(false);
      if (b.dataset.desk === 'pics') openPictures(); else minimizeWin('paint', false);
    });
    root.addEventListener('dblclick', function (e) { var b = e.target.closest('.gp-dicon'); if (b && b.dataset.desk === 'pics') openPictures(); });
    $('.gp-desk').addEventListener('pointerdown', function (e) { if (!e.target.closest('.gp-dicon')) root.querySelectorAll('.gp-dicon').forEach(function (x) { x.classList.remove('is-sel'); }); });

    function startMenu(on) {
      var m = $('.gp-startmenu');
      m.hidden = !on; $('.gp-start').classList.toggle('is-on', on);
    }
    $('.gp-start').addEventListener('click', function (e) { e.stopPropagation(); closeMenu(); startMenu($('.gp-startmenu').hidden); });
    root.addEventListener('pointerdown', function (e) { if (!e.target.closest('.gp-startmenu, .gp-start')) startMenu(false); }, true);
    $('.gp-startmenu').addEventListener('click', function () { startMenu(false); });
    var clockTimer = 0;
    function tick() { var d = new Date(); $('.gp-clock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    tick(); clockTimer = setInterval(tick, 15000);
    // Nosūtīt: first "Saglabāt kā" (a name for the drawing, shown in the folder; may stay empty)
    function save() {
      if (st.busy) return;
      finishPending(); dropSel();
      dialog('Saglabāt kā', '<div class="gp-saveas">' + pixImg('pics', 32) + '<div><p>Zīmējuma nosaukums:</p><div class="gp-saveas-row"><input type="text" class="gp-pass gp-name" maxlength="40" spellcheck="false" autocomplete="off" aria-label="Zīmējuma nosaukums" value="' + esc(st.title || '') + '"><span>.bmp</span></div><p class="gp-saveas-where">Saglabāt: galerijā</p></div></div>',
        [{ label: 'Saglabāt', main: true, run: function (name) { upload(String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40)); } }, { label: 'Atcelt' }]);
    }
    async function upload(title) {
      if (st.busy) return;
      st.title = title;
      if (title) $('.gp-tb-title').textContent = title + ' - Paint';
      var btn = $('[data-act="save"]');
      st.busy = true; btn.disabled = true; btn.textContent = 'Sūta…';
      try {
        var blob = await compactWebp(ink);
        if (!blob) throw new Error('Zīmējums pārsniedz 96 KB.');
        await options.onSave(blob, title);
        st.dirty = false; close(true);
        if (typeof window._mkToast === 'function') window._mkToast('Zīmējums nosūtīts', 'ok');
      } catch (err) {
        st.busy = false; btn.disabled = false; btn.textContent = 'Nosūtīt uz galeriju';
        warn(err && err.message ? err.message : 'Neizdevās nosūtīt.', [{ label: 'Labi', main: true }]);
      }
    }
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (b && !b.disabled) run(b.dataset.act); });

    /* ── keys: they stay here (the gallery behind must not walk) ── */
    function swallow(e) { if (!st.closed) e.stopPropagation(); }
    function onKey(e) {
      e.stopPropagation();
      if (e.target === typer) return;
      var layer = $('.gp-dialog-layer');
      if (!layer.hidden) { if (e.key === 'Escape') { e.preventDefault(); layer.hidden = true; layer.innerHTML = ''; } else if (e.key === 'Enter') { var m = layer.querySelector('.is-default'); if (m) { e.preventDefault(); m.click(); } } return; }
      var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (e.target && e.target.tagName === 'SELECT') return;
      // the keys go to the window in front: Paint's tools only when Paint is it
      if (activeId !== 'paint') {
        if (k === 'escape') { e.preventDefault(); if (menuOpen) closeMenu(); else if (activeId) closeWin(activeId); return; }
        if (activeId === 'view' && (k === 'arrowleft' || k === 'arrowright') && pics.length) { e.preventDefault(); viewPicture((viewing + (k === 'arrowleft' ? -1 : 1) + pics.length) % pics.length); return; }
        if (activeId === 'pics' && pics.length) {
          if (k === 'enter' && picked >= 0) { e.preventDefault(); viewPicture(picked); return; }
          if ((k === 'delete' || k === 'backspace') && picked >= 0) { e.preventDefault(); deletePicture(picked); return; }
          if (/^arrow/.test(k)) {
            e.preventDefault();
            var items = wins.pics.el.querySelectorAll('.gp-xi'), cols = 1;
            for (var c = 1; c < items.length && items[c].offsetTop === items[0].offsetTop; c++) cols = c + 1;
            var step = k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : k === 'arrowup' ? -cols : cols;
            var to = Math.max(0, Math.min(pics.length - 1, (picked < 0 ? 0 : picked + step)));
            pick(to); if (items[to]) items[to].scrollIntoView({ block: 'nearest' });
          }
        }
        return;
      }
      if (k === 'escape') { e.preventDefault(); if (menuOpen) closeMenu(); else if (poly) finishPoly(); else if (curve) { curve = null; base = null; } else if (sel) dropSel(); else close(false); return; }
      if (k === 'enter' && poly) { e.preventDefault(); finishPoly(); return; }
      if (mod) {
        if (k === 'v') return;                                       // the paste event decides: a picture from outside, else our own
        var map = { z: e.shiftKey ? 'redo' : 'undo', y: 'redo', s: 'save', a: 'all', c: 'copy', x: 'cut', i: 'invert', t: 'toggle-tools', l: 'toggle-colors', n: e.shiftKey ? 'clear' : 'new', pageup: 'zoom-1', pagedown: 'zoom-fit' };
        if (map[k]) { e.preventDefault(); run(map[k]); }
        return;
      }
      if (e.altKey) return;
      if (k === 'delete' || k === 'backspace') { if (sel) { e.preventDefault(); run('delete'); } return; }
      if (k === 'x') { e.preventDefault(); var t = st.fg; st.fg = st.bg; st.bg = t; paintColors(); return; }
      if (KEYS[k]) { e.preventDefault(); setTool(KEYS[k]); }
    }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', swallow, true);
    // a picture from outside, as MS Paint takes it: pasted (Ctrl/Cmd+V) or dropped on the window, it comes in
    // as a selection at the top left (or where it was dropped), to be moved and put down
    function pasteImage(file, place) {
      if (!file || !/^image\//.test(file.type || '')) return false;
      createImageBitmap(file).then(function (bmp) {
        var k = Math.min(1, SIZE / bmp.width, SIZE / bmp.height), c = canvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        finishPending(); minimizeWin('paint', false); focusWin('paint'); setTool('select');
        floatFrom(c, place ? Math.max(0, Math.min(SIZE - c.width, place[0])) : 0, place ? Math.max(0, Math.min(SIZE - c.height, place[1])) : 0);
      }, function () { warn('Šo attēlu neizdevās ielīmēt.', [{ label: 'Labi', main: true }]); });
      return true;
    }
    function onPaste(e) {
      if (st.closed || activeId !== 'paint' || e.target === typer) return;
      var items = e.clipboardData ? [].slice.call(e.clipboardData.items || []) : [];
      var it = items.find(function (x) { return x.kind === 'file' && /^image\//.test(x.type); });
      e.preventDefault();
      if (!(it && pasteImage(it.getAsFile()))) run('paste');
    }
    window.addEventListener('paste', onPaste, true);
    app.addEventListener('dragover', function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) e.preventDefault(); });
    app.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      e.preventDefault();
      var r = view.getBoundingClientRect(), on = e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom;
      pasteImage(f, on ? posOf(e) : null);
    });
    function onResize() { if (st.zoom <= 2) refit(); }
    window.addEventListener('resize', onResize);

    // the picture drawn over (a drawing answered with a new one) is the first ink
    if (options.initialUrl) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        if (st.closed || st.dirty) return;
        var k = Math.max(SIZE / img.width, SIZE / img.height), w = img.width * k, h = img.height * k;
        skyBehind();
        ictx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        paint();
      };
      img.src = options.initialUrl;
    }
    $('.gp-tb-title').textContent = (options.over ? 'pa virsu' : 'bez nosaukuma') + ' - Paint';
    // a white sheet, as Paint starts (white can be drawn over colours; see-through stays in the palette)
    put(ictx, 0, 0, SIZE, SIZE, '#ffffff');
    paintPalette(); setTool('brush'); paintColors(); refit(); paint(); paintStatus();
    if (pics.length || options.pictures) openPicturesBeside();
    // the window simply appears, as a program started in Windows 98 (only minimizing flies to the taskbar)
    openNow = { close: close };
    return openNow;
  }

  window.MinkaGalleryPaint = { open: open, isOpen: function () { return !!openNow; } };
})();
