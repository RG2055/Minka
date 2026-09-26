/* /rad startup: an old phosphor monitor (the green screens radiology used to
   read on). A tesseract turns in the middle and a start-up log types itself
   below it; when the schedule is ready the camera goes into the screen and
   the app comes up. RG keeps its own loader (js/dither-loader.js).

   Cheap on the work PCs: one small canvas drawn at half resolution (pixelated
   on purpose), no filters or blur, the exit is transform + opacity only.
   index.html calls window.__mkLoaderExit(done) instead of its own fade. */
(function () {
  'use strict';
  if (window.MINKA_APP !== 'rad') return;
  // Off until the computer intro (after the usual loader) is built around it.
  if (!window.__mkRadIntro) return;
  var loader = document.getElementById('mk-app-loader');
  var root = loader && loader.querySelector('.rdl');
  if (!root) return;
  var crt = root.querySelector('.rdl-crt');
  var canvas = root.querySelector('.rdl-cube');
  var log = root.querySelector('.rdl-log');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = true;

  /* ── tesseract: 16 corners (±1)^4, 32 edges between corners one step apart ── */
  var V = [], E = [];
  for (var i = 0; i < 16; i++) V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
  for (var a = 0; a < 16; a++) for (var b = a + 1; b < 16; b++) {
    var d = a ^ b; if (d && !(d & (d - 1))) E.push([a, b]);
  }
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  function size() {
    var r = canvas.getBoundingClientRect();
    // Half resolution, drawn up with image-rendering: pixelated.
    W = Math.max(60, Math.round(r.width / 2)); H = Math.max(60, Math.round(r.height / 2));
    canvas.width = W; canvas.height = H;
  }
  function rot(p, i, j, t) {
    var c = Math.cos(t), s = Math.sin(t), x = p[i], y = p[j];
    p[i] = x * c - y * s; p[j] = x * s + y * c;
  }
  function draw(time) {
    if (!running) return;
    var t = time / 1000;
    ctx.clearRect(0, 0, W, H);
    var P = V.map(function (v) {
      var p = v.slice();
      rot(p, 0, 3, t * 0.55);        // x–w
      rot(p, 1, 3, t * 0.33);        // y–w
      rot(p, 0, 2, t * 0.21 + 0.5);  // x–z (a slow 3D turn)
      var k4 = 1 / (2.7 - p[3]);     // 4D → 3D
      var x = p[0] * k4, y = p[1] * k4, z = p[2] * k4;
      var k3 = 1 / (3.1 - z);        // 3D → 2D
      var s = Math.min(W, H) * 1.05;
      return [W / 2 + x * k3 * s, H / 2 + y * k3 * s, p[3]];
    });
    ctx.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      ctx.lineWidth = pass ? 1 : 2.6;
      for (var e = 0; e < E.length; e++) {
        var A = P[E[e][0]], B = P[E[e][1]];
        var depth = (A[2] + B[2] + 2) / 4;               // 0 far … 1 near in w
        var alpha = pass ? 0.45 + depth * 0.55 : 0.10 + depth * 0.12;
        ctx.strokeStyle = 'rgba(128,255,178,' + alpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(190,255,214,.95)';
    for (var n = 0; n < 16; n++) ctx.fillRect(Math.round(P[n][0]) - 1, Math.round(P[n][1]) - 1, 2, 2);
    requestAnimationFrame(draw);
  }

  /* ── start-up log ── */
  var lines = [];
  function line(text, cls) {
    var el = document.createElement('div');
    el.className = 'rdl-line' + (cls ? ' ' + cls : '');
    log.appendChild(el);
    while (log.children.length > 6) log.removeChild(log.firstChild);
    lines.push(el);
    if (reduce) { el.textContent = text; return Promise.resolve(el); }
    return new Promise(function (done) {
      var n = 0;
      (function type() {
        n = Math.min(text.length, n + 2);
        el.textContent = text.slice(0, n);
        if (n < text.length) setTimeout(type, 14); else done(el);
      })();
    });
  }
  var host = location.hostname || 'rgapp.page';
  var wait = null;
  line('RG RAD  sistēma ' + new Date().getFullYear() + '.' + String(new Date().getMonth() + 1).padStart(2, '0'), 'is-head')
    .then(function () { return line('> savienojas ar ' + host + ' ... ok'); })
    .then(function () { return line('> grafiks, rezidenti, radiologi ... ok'); })
    .then(function () { return line('> kārto kartītes'); })
    .then(function (el) {
      var dots = 0;
      wait = setInterval(function () { dots = (dots + 1) % 4; el.textContent = '> kārto kartītes' + '...'.slice(0, dots); }, 260);
    });
  // Slow-network notes from index.html go into the log as well.
  var status = document.getElementById('mklLoadStatus');
  if (status && window.MutationObserver) new MutationObserver(function () {
    var text = status.textContent.trim();
    if (text && !/^Ielādē grafiku/.test(text)) line('! ' + text.replace(/…$/, ''), 'is-note');
  }).observe(status, { childList: true, characterData: true, subtree: true });

  function todayCounts() {
    try {
      var st = document.getElementById('calIframe').contentWindow.__minkaGetSelectedDayState();
      var rs = (st.rg || []).length, rd = (st.rd || []).length;
      if (rs || rd) return '> šodien: ' + rs + (rs === 1 ? ' rezidents' : ' rezidenti') + ', ' + rd + (rd === 1 ? ' radiologs' : ' radiologi');
    } catch (_e) {}
    return '> gatavs';
  }

  /* ── exit: into the screen, the app comes up ── */
  window.__mkLoaderExit = function (done) {
    if (wait) clearInterval(wait);
    var last = lines[lines.length - 1];
    if (last) last.textContent = '> kartītes ... ok';
    var el = document.createElement('div');
    el.className = 'rdl-line is-ready';
    el.textContent = todayCounts();
    log.appendChild(el);
    function finish() { running = false; done(); }
    if (reduce) {
      loader.style.transition = 'opacity .2s ease';
      loader.style.opacity = '0';
      setTimeout(finish, 220);
      return;
    }
    setTimeout(function () {
      root.classList.add('is-leaving');
      loader.style.transition = 'opacity .26s ease .3s';
      loader.style.opacity = '0';
      setTimeout(finish, 580);
    }, 240);
  };

  size();
  window.addEventListener('resize', size);
  requestAnimationFrame(draw);
})();
