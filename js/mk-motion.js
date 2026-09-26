/* MinkaMotion — one motion system for the shell and the calendar iframe.

   Levels (on <html data-motion>):
     full     M3 Expressive spatial motion, shared-container transitions.
     lite     Same meaning, less work per frame: no overshoot, shorter travel,
              no View Transition snapshots, decorative CSS loops off.
     reduced  prefers-reduced-motion. Spatial motion becomes a short fade.

   `lite` is chosen from runtime evidence, never from one device property:
   frames are sampled only while a MinkaMotion transition runs, and the
   level drops only after repeated janky samples. It is stored per device
   (localStorage is shared with the calendar iframe, so both documents agree)
   and re-probed after two weeks, so it cannot oscillate during normal use.

   State is authoritative: run() applies the state change synchronously (or
   inside the View Transition update callback) and the animation only shows
   it. A newer run() with the same key cancels the older animation, so rapid
   clicks, Escape or Back never leave a surface half way. */
(function () {
  'use strict';
  if (window.MinkaMotion) return;
  var KEY = 'minkaMotionV1';
  var REPROBE_MS = 14 * 24 * 3600 * 1000;
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var listeners = [];
  var active = {};

  // Same-origin parent (shell) owns the detector; the iframe reports to it.
  // Resolved lazily: the shell may finish loading after the iframe.
  function host() {
    try {
      if (window.parent !== window && window.parent.location.origin === location.origin) return window.parent.MinkaMotion || null;
    } catch (_e) {}
    return null;
  }

  var EASE = {
    expressiveFast: 'cubic-bezier(.42, 1.67, .21, .90)',
    expressiveDefault: 'cubic-bezier(.38, 1.21, .22, 1.00)',
    expressiveSlow: 'cubic-bezier(.39, 1.29, .35, .98)',
    standard: 'cubic-bezier(.27, 1.06, .18, 1.00)',
    effects: 'cubic-bezier(.31, .94, .34, 1.00)',
    exit: 'cubic-bezier(.3, 0, .8, .15)'
  };
  // Mirrors --mk-ease-spring / --mk-ease-spring-flat in css/mk-sys.css
  // (scripts/build-spring-easing.mjs). linear() lets the browser run the
  // spring itself; older engines get the nearest cubic-bezier.
  var HAS_LINEAR = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)'));
  EASE.spring = HAS_LINEAR
    ? 'linear(0, 0.0055 1.3%, 0.0247 2.8%, 0.0549 4.3%, 0.1006 6%, 0.1962 9%, 0.4271 15.5%, 0.528 18.5%, 0.6268 21.8%, 0.7064 24.8%, 0.7744 27.8%, 0.8354 31%, 0.8842 34.3%, 0.9248 37.8%, 0.9567 41.5%, 0.9801 45.5%, 0.9967 50%, 1.0068 55.3%, 1.0109 65.8%, 1)'
    : 'cubic-bezier(.2, .9, .25, 1)';
  EASE.springFlat = HAS_LINEAR
    ? 'linear(0, 0.004 1%, 0.0188 2.3%, 0.0422 3.5%, 0.0788 5%, 0.1611 7.8%, 0.3622 13.8%, 0.465 17%, 0.5574 20.3%, 0.6378 23.5%, 0.7063 26.8%, 0.7676 30.3%, 0.8174 33.8%, 0.86 37.5%, 0.899 42%, 0.929 46.8%, 0.9532 52.3%, 0.9711 58.5%, 0.9914 73.8%, 1)'
    : 'cubic-bezier(.2, .8, .3, 1)';
  // Mirrors css/mk-sys.css. [duration, expressive easing, standard easing]
  var TOKENS = {
    full: {
      'spatial-fast': [350, EASE.expressiveFast, EASE.standard],
      'spatial-default': [500, EASE.expressiveDefault, EASE.standard],
      'spatial-slow': [650, EASE.expressiveSlow, EASE.standard],
      'effects-fast': [150, EASE.effects, EASE.effects],
      'effects-default': [200, EASE.effects, EASE.effects],
      'effects-slow': [300, EASE.effects, EASE.effects],
      'spring-fast': [420, EASE.spring, EASE.springFlat],
      'spring-default': [560, EASE.spring, EASE.springFlat],
      'spring-slow': [720, EASE.spring, EASE.springFlat]
    },
    lite: {
      'spatial-fast': [320, EASE.standard, EASE.standard],
      'spatial-default': [420, EASE.standard, EASE.standard],
      'spatial-slow': [480, EASE.standard, EASE.standard],
      'effects-fast': [150, EASE.effects, EASE.effects],
      'effects-default': [200, EASE.effects, EASE.effects],
      'effects-slow': [260, EASE.effects, EASE.effects],
      'spring-fast': [420, EASE.springFlat, EASE.springFlat],
      'spring-default': [520, EASE.springFlat, EASE.springFlat],
      'spring-slow': [620, EASE.springFlat, EASE.springFlat]
    },
    reduced: {
      'spatial-fast': [120, EASE.effects, EASE.effects],
      'spatial-default': [150, EASE.effects, EASE.effects],
      'spatial-slow': [150, EASE.effects, EASE.effects],
      'effects-fast': [100, EASE.effects, EASE.effects],
      'effects-default': [120, EASE.effects, EASE.effects],
      'effects-slow': [150, EASE.effects, EASE.effects],
      'spring-fast': [100, EASE.effects, EASE.effects],
      'spring-default': [120, EASE.effects, EASE.effects],
      'spring-slow': [150, EASE.effects, EASE.effects]
    }
  };
  var TRAVEL = { full: 1, lite: .5, reduced: 0 };

  function readStore() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_e) { return {}; }
  }
  function writeStore(value) {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (_e) {}
  }
  function computeLevel() {
    if (mq && mq.matches) return 'reduced';
    var s = readStore();
    if (s.level === 'lite' && !(s.at && Date.now() - s.at > REPROBE_MS)) return 'lite';
    return 'full';
  }
  var level = computeLevel();
  function apply() {
    if (root.getAttribute('data-motion') !== level) root.setAttribute('data-motion', level);
    listeners.slice().forEach(function (cb) { try { cb(level); } catch (_e) {} });
  }
  function refresh() {
    var next = computeLevel();
    if (next === level) return;
    level = next;
    apply();
  }
  apply();
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', refresh);
    else if (mq.addListener) mq.addListener(refresh);
  }
  // The other document (shell ↔ calendar) changed the stored level.
  window.addEventListener('storage', function (e) { if (e.key === KEY) refresh(); });

  /* ── Evidence ─────────────────────────────────────────────────────────── */
  // A sample is one transition: how many frames were slower than ~30 fps.
  function report(sample) {
    var owner = host();
    if (owner && owner !== api) { try { owner.report(sample); } catch (_e) {} return; }
    if (!sample || sample.frames < 6 || level === 'reduced') return;
    var s = readStore();
    var recent = (s.recent || []).concat([{ l: level, j: +(sample.long / sample.frames).toFixed(3), w: Math.round(sample.worst) }]).slice(-6);
    var next = { level: s.level || 'full', at: s.at || 0, recent: recent };
    if (level === 'full') {
      var bad = recent.filter(function (r) { return r.l === 'full' && (r.j > .25 || r.w > 140); }).length;
      if (bad >= 3) { next.level = 'lite'; next.at = Date.now(); next.recent = []; }
    }
    writeStore(next);
    refresh();
  }
  // Samples frame gaps with rAF, only for the lifetime of one transition.
  function measure(promise, expectedMs) {
    if (document.hidden || !window.requestAnimationFrame || !promise || !promise.then) return;
    var last = 0, frames = 0, long = 0, worst = 0, done = false;
    var start = performance.now();
    function tick(t) {
      if (done) return;
      if (last) {
        var gap = t - last;
        frames++;
        if (gap > 34) long++;
        if (gap > worst) worst = gap;
      }
      last = t;
      if (performance.now() - start < (expectedMs || 1000) + 400) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    var finish = function () {
      if (done) return;
      done = true;
      if (!document.hidden) report({ frames: frames, long: long, worst: worst });
    };
    promise.then(finish, finish);
  }

  /* ── Primitives ───────────────────────────────────────────────────────── */
  function token(name, opts) {
    var t = (TOKENS[level] || TOKENS.full)[name] || TOKENS.full['effects-default'];
    return { duration: t[0], easing: opts && opts.standard ? t[2] : t[1] };
  }
  function finished(anim) {
    return anim && anim.finished ? anim.finished.catch(function () {}) : Promise.resolve();
  }
  // WAAPI with a token. In reduced motion only the opacity part survives.
  function animate(el, keyframes, name, opts) {
    if (!el || typeof el.animate !== 'function') return null;
    opts = opts || {};
    var frames = keyframes;
    if (level === 'reduced' && !opts.keepTransform) {
      var hasOpacity = keyframes.some(function (k) { return k.opacity != null; });
      if (!hasOpacity) return null;
      frames = keyframes.map(function (k) { return k.offset != null ? { offset: k.offset, opacity: k.opacity } : { opacity: k.opacity }; });
    }
    var t = token(name, opts);
    var anim = el.animate(frames, {
      duration: opts.duration || t.duration,
      easing: opts.easing || t.easing,
      delay: opts.delay || 0,
      fill: opts.fill || 'none'
    });
    // startNow: time the animation from this moment, not from the next frame.
    // If the main thread is still busy (a day switch), the first painted frame
    // is already part-way through instead of holding the start pose.
    if (opts.startNow && document.timeline) {
      try { anim.startTime = document.timeline.currentTime; } catch (_e) {}
    }
    if (opts.measure) measure(finished(anim), t.duration);
    return anim;
  }
  // First → Last → Invert → Play for one element whose box changes.
  function flip(el, mutate, name, opts) {
    if (!el) { mutate(); return null; }
    var first = el.getBoundingClientRect();
    mutate();
    var last = el.getBoundingClientRect();
    if (!last.width || !last.height || !first.width || !first.height) return null;
    var dx = first.left - last.left, dy = first.top - last.top;
    var sx = first.width / last.width, sy = first.height / last.height;
    if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(sx - 1) < .005 && Math.abs(sy - 1) < .005) return null;
    return animate(el, [
      { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
      { transformOrigin: '0 0', transform: 'none' }
    ], name || 'spatial-default', Object.assign({ measure: true }, opts || {}));
  }
  /* State change + its transition, cancellable by key.
     opts.viewTransition: use document.startViewTransition in full motion.
     opts.fallback(): returns animation(s) to run after update() otherwise. */
  function run(key, update, opts) {
    opts = opts || {};
    var prev = active[key];
    if (prev) prev.cancel();
    var ctl = {
      anims: [], vt: null,
      cancel: function () {
        this.anims.forEach(function (a) { try { a.cancel(); } catch (_e) {} });
        this.anims = [];
        if (this.vt) { try { this.vt.skipTransition(); } catch (_e) {} }
      }
    };
    active[key] = ctl;
    var release = function () { if (active[key] === ctl) delete active[key]; };
    var useVT = opts.viewTransition && level === 'full' && typeof document.startViewTransition === 'function' && !document.hidden;
    if (useVT) {
      try {
        ctl.vt = document.startViewTransition(function () { update(); });
        var done = ctl.vt.finished.catch(function () {});
        measure(done, 500);
        done.then(release);
        return done;
      } catch (_e) { ctl.vt = null; /* fall through: the update must still happen */ }
    }
    update();
    var anims = [];
    if (typeof opts.fallback === 'function') {
      try { anims = [].concat(opts.fallback() || []).filter(Boolean); } catch (_e) { anims = []; }
    }
    ctl.anims = anims;
    var all = Promise.all(anims.map(finished));
    if (anims.length) measure(all, 500);
    all.then(release);
    return all;
  }

  /* ── Surfaces: dialogs, sheets, panels ────────────────────────────────
     M3 container transform for anything that opens out of a launcher: the
     surface grows from the launcher's box (one uniform scale, centred, so
     nothing inside stretches) and shrinks back into it on close. Without a
     launcher it is the standard M3 dialog enter/exit. Only translate, scale
     and opacity are animated. The caller owns the state: it shows the
     surface before openSurface() and hides it in closeSurface()'s done(),
     which never runs if the surface was reopened meanwhile. */
  var surfaces = {};
  function rectOf(origin) {
    if (!origin) return null;
    if (typeof origin.getBoundingClientRect === 'function') {
      if (!origin.isConnected) return null;
      origin = origin.getBoundingClientRect();
    }
    return origin.width && origin.height ? origin : null;
  }
  function poseFrom(rect, el) {
    var r = el.getBoundingClientRect();
    if (!rect || !r.width || !r.height) return null;
    var s = Math.max(.06, Math.min(1, Math.max(rect.width / r.width, rect.height / r.height)));
    // `scale` works about the element's transform-origin, which sits on the
    // untransformed box. Many surfaces are centred with a translate-only
    // `transform` (translate(-50%,-50%)); undo that shift to find the box.
    var cs = getComputedStyle(el);
    var lx = r.left, ly = r.top;
    if (cs.transform && cs.transform !== 'none' && typeof DOMMatrixReadOnly === 'function') {
      var m = new DOMMatrixReadOnly(cs.transform);
      if (Math.abs(m.a - 1) < .001 && Math.abs(m.d - 1) < .001 && Math.abs(m.b) < .001 && Math.abs(m.c) < .001) { lx -= m.e; ly -= m.f; }
    }
    var o = String(cs.transformOrigin || '').split(' ').map(parseFloat);
    var ox = lx + (isFinite(o[0]) ? o[0] : r.width / 2), oy = ly + (isFinite(o[1]) ? o[1] : r.height / 2);
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = (rect.left + rect.width / 2) - ox - s * (cx - ox);
    var dy = (rect.top + rect.height / 2) - oy - s * (cy - oy);
    return { translate: dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px', scale: s.toFixed(4) };
  }
  function stopSurface(key) {
    var ctl = surfaces[key];
    if (!ctl) return;
    delete surfaces[key];
    ctl.anims.forEach(function (a) { try { a.cancel(); } catch (_e) {} });
  }
  // opts: { key, origin (element or rect), scrim (element), from: 'bottom' }
  function openSurface(el, opts) {
    opts = opts || {};
    var key = opts.key || el.id || 'surface';
    var reopening = !!surfaces[key];
    var scrimFrom = opts.scrim && reopening ? Number(getComputedStyle(opts.scrim).opacity) || 0 : 0;
    stopSurface(key);
    var tr = TRAVEL[level];
    var pose = poseFrom(rectOf(opts.origin), el);
    var anims = [];
    if (pose) {
      // Full-screen surfaces (month calendar, planner) grow in the shorter
      // token without overshoot: a whole-screen layer overshooting past the
      // viewport reads as a wobble and is the heaviest frame to composite.
      var box = el.getBoundingClientRect();
      var big = box.width * box.height > .6 * window.innerWidth * window.innerHeight;
      // One spring (≈1 % overshoot), the same the controls use; full-screen
      // layers take the flat one.
      anims.push(animate(el, [{ translate: pose.translate, scale: pose.scale }, { translate: '0 0', scale: '1' }], big ? 'spring-fast' : 'spring-default', { measure: true, standard: big }));
    } else if (opts.from === 'bottom') {
      anims.push(animate(el, [{ translate: '0 ' + Math.round(48 * tr) + 'px' }, { translate: '0 0' }], 'spring-default', { measure: true }));
    } else {
      anims.push(animate(el, [{ translate: '0 ' + Math.round(20 * tr) + 'px', scale: String(1 - .06 * tr) }, { translate: '0 0', scale: '1' }], 'spring-default', { measure: true }));
    }
    anims.push(animate(el, [{ opacity: 0 }, { opacity: 1 }], 'effects-fast'));
    if (opts.scrim) anims.push(animate(opts.scrim, [{ opacity: scrimFrom }, { opacity: 1 }], 'effects-default'));
    anims = anims.filter(Boolean);
    var ctl = surfaces[key] = { anims: anims };
    var done = Promise.all(anims.map(finished));
    done.then(function () { if (surfaces[key] === ctl) delete surfaces[key]; });
    return done;
  }
  function closeSurface(el, opts, done) {
    opts = opts || {};
    var key = opts.key || el.id || 'surface';
    stopSurface(key);
    var finish = function () { if (typeof done === 'function') done(); };
    if (document.hidden || el.getClientRects().length === 0) { finish(); return Promise.resolve(); }
    var tr = TRAVEL[level];
    var pose = poseFrom(rectOf(opts.origin), el);
    var anims = [];
    if (pose) {
      anims.push(animate(el, [{ translate: '0 0', scale: '1' }, { translate: pose.translate, scale: pose.scale }], 'spring-fast', { standard: true, fill: 'forwards' }));
      anims.push(animate(el, [{ opacity: 1 }, { opacity: 1, offset: .55 }, { opacity: 0 }], 'spatial-fast', { standard: true, fill: 'forwards' }));
    } else if (opts.from === 'bottom') {
      anims.push(animate(el, [{ translate: '0 0', opacity: 1 }, { translate: '0 ' + Math.round(48 * tr) + 'px', opacity: 0 }], 'effects-slow', { fill: 'forwards' }));
    } else {
      anims.push(animate(el, [{ scale: '1', opacity: 1 }, { scale: String(1 - .04 * tr), opacity: 0 }], 'effects-default', { fill: 'forwards' }));
    }
    if (opts.scrim) anims.push(animate(opts.scrim, [{ opacity: 1 }, { opacity: 0 }], 'effects-default', { fill: 'forwards' }));
    anims = anims.filter(Boolean);
    if (!anims.length) { finish(); return Promise.resolve(); }
    var ctl = surfaces[key] = { anims: anims };
    return Promise.all(anims.map(function (a) { return a.finished; })).then(function () {
      if (surfaces[key] !== ctl) return;           // reopened: not ours to hide
      delete surfaces[key];
      finish();                                     // hide first, then drop the fill
      anims.forEach(function (a) { try { a.cancel(); } catch (_e) {} });
    }, function () {});
  }

  // The control that most likely launched a surface: the last button (or
  // card) pressed with pointer or keyboard in the past second.
  var launcher = null;
  var LAUNCHER_SEL = 'button,[role="button"],a[href],[onclick],[data-db-day],[data-db-person],.card';
  document.addEventListener('pointerdown', function (e) {
    var el = e.target && e.target.closest ? e.target.closest(LAUNCHER_SEL) : null;
    if (el) launcher = { el: el, at: Date.now() };
  }, true);
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement !== document.body) launcher = { el: document.activeElement, at: Date.now() };
  }, true);
  function recentLauncher(maxAge) {
    if (!launcher || Date.now() - launcher.at > (maxAge || 1000) || !launcher.el.isConnected) return null;
    return launcher.el;
  }

  /* Layout code that measures with getBoundingClientRect would read the
     surface mid-transform (tiny, while it grows out of its launcher). Run
     such code through atRest(): the surface's animations are parked at
     their end (identity) for the synchronous call and put back, all in one
     task, so nothing is ever painted in that state. */
  function atRest(key, fn) {
    var ctl = surfaces[key];
    if (!ctl || !ctl.anims.length) return fn();
    // Past the end with fill 'none' an animation has no effect at all: the
    // element is measured in its real layout, whichever way it was heading.
    // Only animations that are actually playing (or paused mid-way) are
    // parked. A finished or cancelled one must never be touched: pausing an
    // idle animation would bring its effect back, frozen at its end pose.
    var saved = ctl.anims.filter(function (a) {
      return (a.playState === 'running' || a.playState === 'paused') && a.currentTime != null;
    }).map(function (a) {
      var fill = 'none';
      try { fill = a.effect.getTiming().fill; } catch (_e) {}
      return [a, a.currentTime, a.playState, fill];
    });
    if (!saved.length) return fn();
    saved.forEach(function (x) {
      try {
        x[0].pause();
        x[0].effect.updateTiming({ fill: 'none' });
        x[0].currentTime = x[0].effect.getComputedTiming().endTime + 1;
      } catch (_e) {}
    });
    try { return fn(); } finally {
      saved.forEach(function (x) {
        try {
          x[0].effect.updateTiming({ fill: x[3] });
          x[0].currentTime = x[1];
          if (x[2] === 'running') x[0].play();
        } catch (_e) {}
      });
    }
  }

  /* Liquid indicator: a pill that moves between tabs with its two edges on
     different springs. The edge in the direction of travel leads (short
     spring), the other trails (long spring), so the pill stretches on the
     way and settles to the new tab's width. One write per switch; the
     browser runs both transitions (.mk-liquid in css/mk-sys.css). */
  function liquid(ind, bar, target, opts) {
    opts = opts || {};
    if (!ind || !bar || !target) return false;
    function place(el, animate, dir) {
      var b = bar.getBoundingClientRect(), t = el.getBoundingClientRect();
      if (!t.width || !b.width) return false;         // not laid out: leave it
      var x = t.left - b.left - bar.clientLeft + bar.scrollLeft;
      var left = Math.round(x * 10) / 10;
      var prev = parseFloat(ind.style.left);
      ind.classList.add('mk-liquid');
      ind.setAttribute('data-dir', dir || (isFinite(prev) && left < prev ? '-1' : '1'));
      ind.classList.toggle('is-static', !animate);
      if (opts.vertical !== false) {
        ind.style.top = (Math.round((t.top - b.top - bar.clientTop + bar.scrollTop) * 10) / 10) + 'px';
        ind.style.height = t.height + 'px';
      }
      ind.style.left = left + 'px';
      ind.style.right = (Math.round((bar.clientWidth - x - t.width) * 10) / 10) + 'px';
      return true;
    }
    var placed = ind.classList.contains('mk-liquid') && isFinite(parseFloat(ind.style.left));
    var animate = opts.animate !== false;
    // Never placed yet: start on the previous tab, then flow to the new one.
    if (!placed && animate && opts.from && opts.from !== target && place(opts.from, false)) {
      void ind.offsetWidth;                            // commit the start pose
      placed = true;
    }
    return place(target, placed && animate);
  }

  /* Async button: label → spinner → check → label. The button keeps its box
     (no layout change); only the content inside swaps. `work` is a promise
     or a function returning one. Resolves/rejects with the work's result;
     resolving to `false` counts as a failure (no check). */
  var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var SPIN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>';
  function pending(btn, work, opts) {
    opts = opts || {};
    var p;
    try { p = Promise.resolve(typeof work === 'function' ? work() : work); } catch (e) { p = Promise.reject(e); }
    if (!btn || !btn.isConnected) return p;
    // Bare text can't be faded on its own: wrap it once.
    Array.prototype.slice.call(btn.childNodes).forEach(function (n) {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
      var s = document.createElement('span');
      s.className = 'mk-pend-label';
      btn.replaceChild(s, n);
      s.appendChild(n);
    });
    var fx = btn.querySelector(':scope > .mk-pend-fx');
    if (!fx) {
      fx = document.createElement('span');
      fx.className = 'mk-pend-fx';
      fx.setAttribute('aria-hidden', 'true');
      btn.appendChild(fx);
    }
    clearTimeout(btn.__mkPendT);
    // Only show the spinner if the work is not instant: a local save that
    // finishes in a frame goes straight to the check.
    btn.__mkPendT = setTimeout(function () {
      fx.innerHTML = SPIN_SVG;
      btn.classList.remove('mk-pend-done');
      btn.classList.add('mk-pend-busy');
    }, opts.spinnerDelay == null ? 120 : opts.spinnerDelay);
    btn.setAttribute('aria-busy', 'true');
    var settle = function (ok) {
      clearTimeout(btn.__mkPendT);
      btn.removeAttribute('aria-busy');
      btn.classList.remove('mk-pend-busy');
      if (!ok || opts.check === false) { btn.classList.remove('mk-pend-done'); return; }
      fx.innerHTML = CHECK_SVG;
      btn.classList.add('mk-pend-done');
      btn.__mkPendT = setTimeout(function () { btn.classList.remove('mk-pend-done'); }, opts.hold || 1100);
    };
    // Work that resolves to `false` failed without throwing: no check.
    p.then(function (v) { settle(v !== false); }, function () { settle(false); });
    return p;
  }

  // Animations made elsewhere (the radio reveal) can be registered so that
  // atRest(key) knows about them.
  function track(key, anims) {
    anims = (anims || []).filter(Boolean);
    var ctl = surfaces[key] = { anims: anims };
    Promise.all(anims.map(finished)).then(function () { if (surfaces[key] === ctl) delete surfaces[key]; });
  }

  var api = {
    atRest: atRest,
    track: track,
    recentLauncher: recentLauncher,
    openSurface: openSurface,
    closeSurface: closeSurface,
    level: function () { return level; },
    travel: function () { return TRAVEL[level]; },
    token: token,
    animate: animate,
    flip: flip,
    liquid: liquid,
    pending: pending,
    run: run,
    measure: measure,
    report: report,
    onChange: function (cb) { if (typeof cb === 'function') listeners.push(cb); },
    // Manual override for support/debugging: MinkaMotion.force('lite'|'full')
    force: function (next) {
      writeStore({ level: next === 'lite' ? 'lite' : 'full', at: Date.now(), recent: [] });
      refresh();
    }
  };
  window.MinkaMotion = api;
})();
