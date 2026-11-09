/* Radio motion, every layout (classic, clean, pioneer, pixel, amp, dither and the
   music source): one spring for a press, play/pause, a station or track change,
   the current row of the list, panes and a layout or source switch.
   Only scale, translate and opacity through MinkaMotion (WAAPI, on the
   compositor), started by a click or a state change: no loop, no timer, nothing
   runs while the radio just plays. Reduced motion keeps only the fades. */
(function () {
  'use strict';
  var rw = document.getElementById('radioWindow'), MM = window.MinkaMotion;
  if (!rw || !MM || window.rgRadioMotion) return;
  // Each layout's own parts, picked by its name: measuring what is visible would force the whole
  // window's layout right after the new text went in (that doubled a click's cost on a slow PC).
  // fade: opacity and rise; rise: only the rise, where a layout pins opacity with !important (an
  // animation of a pinned property shows nothing and leaves the compositor for the main thread).
  var PARTS = {
    amp: { fade: '.amp-cover, .amp-song, .amp-artist', play: '.amp-pill[data-act="play"], .amp-pill[data-act="pause"]', row: '.amp-list .is-current' },
    dither: { fade: '.dth-info', rise: '.dth-art', play: '.dth-play' },
    other: { rise: '#curStation, #npCover, #npTitle, #npArtist', play: '#playBtn' }
  };
  function parts() { return rw.classList.contains('music-source') ? null : PARTS[rw.dataset.radioLayout] || PARTS.other; }
  // Independent scale/translate properties: they add to each layout's own transform.
  // One radio animation per element: two at once on one target keep both off the compositor.
  function spring(el, frames, name, opts) {
    if (!el) return null;
    if (el.__mkRm) { try { el.__mkRm.cancel(); } catch (_e) {} }
    return (el.__mkRm = MM.animate(el, frames, name || 'spring-fast', opts));
  }

  /* Press: the control sinks under the finger and springs back on release. */
  var PRESS = 'button, [role="button"], .amp-list li[data-index]';
  var held = null;
  function release() {
    var b = held; held = null;
    if (!b) return;
    var a = b.__mkPress; b.__mkPress = null;
    if (!a || a !== b.__mkRm) return;   // something newer (the play pop) already moves it
    // from where the sink got to (a quick tap is released half way), read from the timing alone
    var depth = Number(a.effect.getKeyframes()[1].scale), t = a.effect.getComputedTiming().progress;
    var from = 1 - (1 - depth) * (t == null ? 1 : t);
    spring(b, [{ scale: String(from) }, { scale: '1' }], 'spring-fast');
  }
  rw.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    var b = e.target.closest && e.target.closest(PRESS);
    if (!b || !rw.contains(b) || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    release();
    held = b;
    var depth = '.96';   // never deeper than .95: it reads exaggerated
    b.__mkPress = spring(b, [{ scale: '1' }, { scale: depth }], 'effects-fast', { fill: 'forwards' });
  });
  window.addEventListener('pointerup', release, true);
  window.addEventListener('pointercancel', release, true);

  /* Now playing: the station, track and cover arrive from below. */
  var lastKey = '';
  function swap() {
    var p = parts();
    if (!p) return;
    // short and all at once: each running animation costs a little style work on every frame
    if (p.fade) Array.prototype.forEach.call(rw.querySelectorAll(p.fade), function (el) {
      spring(el, [{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], 'spring-fast');
    });
    if (p.rise) Array.prototype.forEach.call(rw.querySelectorAll(p.rise), function (el) {
      if (el.tagName !== 'IMG' && !el.textContent) return;   // an empty line (no track info yet) shows nothing
      spring(el, [{ translate: '0 8px' }, { translate: '0 0' }], 'spring-fast');
    });
    // the list's current row follows a moment later (the layout marks it on the same event)
    if (p.row) setTimeout(function () {
      spring(rw.querySelector(p.row), [{ scale: '.96', opacity: .6 }, { scale: '1', opacity: 1 }], 'spring-fast');
    }, 0);
  }
  document.addEventListener('rg-now-playing-art', function (e) {
    var d = e.detail || {}, key = (d.artist || '') + '|' + (d.title || '');
    if (key === lastKey) return;
    lastKey = key;
    swap();
  });

  /* Play / pause: the toggle's icon pops; a layout or source switch settles in. */
  var was = { playing: rw.dataset.playback === 'playing', layout: rw.dataset.radioLayout, music: rw.classList.contains('music-source') };
  new MutationObserver(function () {
    var now = { playing: rw.dataset.playback === 'playing', layout: rw.dataset.radioLayout, music: rw.classList.contains('music-source') };
    var p = parts();
    if (p && now.playing !== was.playing) {
      Array.prototype.forEach.call(rw.querySelectorAll(p.play), function (b) {
        // an SVG icon cannot take scale on the compositor: the button itself pops then
        var icon = b.firstElementChild;
        // the new icon arrives from a quarter of its size; a button whose icon cannot be scaled on its
        // own (SVG) only gives the same small press as a click
        if (icon && !(icon instanceof SVGElement)) spring(icon, [{ scale: '.25', opacity: 0 }, { scale: '1', opacity: 1 }], 'spring-fast');
        else spring(b, [{ scale: '.96' }, { scale: '1' }], 'spring-fast');
      });
    }
    if (now.layout !== was.layout || now.music !== was.music) {
      spring(rw, [{ scale: '.985' }, { scale: '1' }], 'spring-default');   // its opacity is pinned
    }
    was = now;
  }).observe(rw, { attributes: true, attributeFilter: ['data-playback', 'data-radio-layout', 'class'] });

  /* A pane or menu that just appeared grows in from its own top. */
  function enter(el) {
    spring(el, [{ opacity: 0, scale: '.97', translate: '0 -4px' }, { opacity: 1, scale: '1', translate: '0 0' }], 'spring-default');
  }

  /* Range inputs glide to new values (an EQ preset) in one short burst of frames. */
  function ranges(inputs, values, paint) {
    var from = inputs.map(function (i) { return Number(i.value); });
    if (MM.level() === 'reduced' || from.every(function (v, k) { return v === values[k]; })) {
      inputs.forEach(function (i, k) { i.value = String(values[k]); paint(i); });
      return;
    }
    var t = MM.token('spring-fast'), start = performance.now(), id = (ranges.id = (ranges.id || 0) + 1);
    (function frame(now) {
      if (id !== ranges.id) return;   // a newer preset took over
      var p = Math.min(1, (now - start) / t.duration), e = 1 - Math.pow(1 - p, 3);
      inputs.forEach(function (i, k) { i.value = String(p < 1 ? from[k] + (values[k] - from[k]) * e : values[k]); paint(i); });
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  window.rgRadioMotion = { swap: swap, enter: enter, ranges: ranges };
})();
