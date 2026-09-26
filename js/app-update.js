/* Updates without anyone reloading by hand.
   - The open app looks for a new version by itself: every 15 minutes, when
     it comes back to the screen and when the network returns (sw.js is always
     revalidated, so this is one small request).
   - A new version waits (sw.js no longer takes over on its own). The app
     then shows "Ir jauna versija" with a button, and puts a dot on the
     installed app's icon (App Badge API, where the system supports it).
   - It is applied by itself at a safe moment: right away if the app was just
     opened, or when the app is in the background, or after 10 minutes nobody
     touched it — never while the radio or the player is playing.
   The page registration code (index.html, mobile.html) hands the
   registration over with window.__mkUpdates.watch(registration). */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var CHECK_EVERY = 15 * 60 * 1000, IDLE = 10 * 60 * 1000, FRESH = 8000;
  var started = Date.now(), lastInput = Date.now(), lastCheck = 0;
  var reg = null, pending = false, asked = false, reloadWanted = false, toast = null;

  function badge(on) {
    try {
      if (on && navigator.setAppBadge) navigator.setAppBadge().catch(function () {});
      if (!on && navigator.clearAppBadge) navigator.clearAppBadge().catch(function () {});
    } catch (_e) {}
  }
  badge(false);   // a fresh load is the current version

  // Anything audible: the radio, the player frame, any media element.
  function playing() {
    try { var st = window.__mkRadioPlaybackState && window.__mkRadioPlaybackState(); if (st && !st.paused) return true; } catch (_e) {}
    try { if (navigator.mediaSession && navigator.mediaSession.playbackState === 'playing') return true; } catch (_e) {}
    function busy(doc) {
      try {
        var media = doc.querySelectorAll('audio,video');
        for (var i = 0; i < media.length; i++) if (!media[i].paused && !media[i].muted) return true;
        var frames = doc.querySelectorAll('iframe');
        for (var j = 0; j < frames.length; j++) { var d = frames[j].contentDocument; if (d && busy(d)) return true; }
      } catch (_e) {}
      return false;
    }
    return busy(document);
  }

  function reload() {
    try { sessionStorage.setItem('mkUpdatedAt', String(Date.now())); } catch (_e) {}
    location.reload();
  }
  // Called when the new worker has taken over. Asked for here (button or a
  // safe moment): reload now. Taken over by another tab: wait for a safe
  // moment here too, so the radio is never cut.
  function reloadWhenSafe() {
    if (asked || !playing()) { reload(); return; }
    reloadWanted = true;
  }

  function apply() {
    if (reg && reg.waiting) { asked = true; reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
    else if (reloadWanted) reload();
  }

  function safeMoment() {
    if (!pending && !reloadWanted) return;
    if (playing()) return;
    var hidden = document.visibilityState === 'hidden';
    var idle = Date.now() - lastInput > IDLE;
    if (hidden || idle) apply();
  }

  function showToast() {
    if (toast || !document.body) return;
    toast = document.createElement('div');
    toast.id = 'mkUpdateToast';
    toast.setAttribute('role', 'status');
    toast.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);z-index:2147483000;'
      + 'transform:translate(-50%,12px);opacity:0;transition:opacity .22s ease,transform .22s ease;'
      + 'display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:7px 7px 7px 14px;'
      + 'border-radius:14px;background:#0f141b;border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 30px rgba(0,0,0,.45);'
      + 'color:#e6ebf2;font:500 13px/1.3 Inter,system-ui,-apple-system,sans-serif;';
    var text = document.createElement('span');
    text.textContent = 'Ir jauna versija';
    var go = document.createElement('button');
    go.type = 'button';
    go.textContent = 'Atjaunināt';
    go.style.cssText = 'appearance:none;border:0;cursor:pointer;padding:7px 14px;border-radius:10px;background:#d6e3ff;color:#0b1d36;font:600 13px/1 Inter,system-ui,sans-serif;';
    go.addEventListener('click', function () { go.disabled = true; go.textContent = 'Atjaunina…'; apply(); });
    toast.append(text, go);
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; toast.style.transform = 'translate(-50%,0)'; });
  }

  function ready() {
    if (pending) return;
    pending = true;
    // Just opened: nothing to lose yet, take the new version now.
    if (Date.now() - started < FRESH && !playing()) { apply(); return; }
    badge(true);
    showToast();
  }

  function check() {
    if (!reg || Date.now() - lastCheck < 60 * 1000) return;
    lastCheck = Date.now();
    reg.update().catch(function () {});
  }

  function watch(r) {
    if (!r || reg) return;
    reg = r;
    if (r.waiting && navigator.serviceWorker.controller) ready();
    r.addEventListener('updatefound', function () {
      var next = r.installing;
      if (!next) return;
      next.addEventListener('statechange', function () {
        if (next.state === 'installed' && navigator.serviceWorker.controller) ready();
      });
    });
    setInterval(check, CHECK_EVERY);
    setInterval(safeMoment, 60 * 1000);
  }

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function () { lastInput = Date.now(); }, { passive: true, capture: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') check();
    else safeMoment();
  });
  window.addEventListener('online', check);

  window.__mkUpdates = { watch: watch, reloadWhenSafe: reloadWhenSafe, apply: apply, playing: playing };
})();
