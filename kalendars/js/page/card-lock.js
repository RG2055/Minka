/* PIN-protected cards (opt-in): the owner can lock their card's emoji and look
   so only they change it. Same PIN profile and session as the radio (the top
   page's js/media-profile.js, window.__mkUnifiedMedia); minka-api enforces it
   (/api/card-locks, /api/card-lock, 423 on /api/emoji and /api/skins). */
(function () {
  'use strict';
  var norm = function (s) { return String(s || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('lv-LV'); };
  var first = function (s) { var w = String(s || '').trim().split(/\s+/)[0] || ''; return w.charAt(0).toLocaleUpperCase('lv-LV') + w.slice(1).toLocaleLowerCase('lv-LV'); };
  var locked = new Set(), loadedAt = 0, loading = null;

  function media() {
    try { if (window.parent !== window && window.parent.__mkUnifiedMedia) return window.parent.__mkUnifiedMedia; } catch (_e) {}
    return window.__mkUnifiedMedia || null;
  }
  function session() { var m = media(); return m && m.getSession ? m.getSession() : null; }
  function owns(name) { var s = session(); return !!s && norm(s.name) === norm(name); }
  function token() { var s = session(); return s && s.sessionToken || undefined; }
  function isLocked(name) { return locked.has(norm(name)); }
  function api() { return window.MinkaApi && window.MinkaApi.apiFetch && window.MinkaApi.getToken && window.MinkaApi.getToken() ? window.MinkaApi : null; }
  function toast(msg, kind) { if (typeof window._mkToast === 'function') window._mkToast(msg, kind || 'ok'); }

  function load(force) {
    if (!force && (loading || Date.now() - loadedAt < 60000)) return loading || Promise.resolve();
    var a = api();
    if (!a) return Promise.resolve();
    loading = a.apiFetch('/api/card-locks').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && Array.isArray(d.locked)) { locked = new Set(d.locked.map(norm)); loadedAt = Date.now(); }
    }).catch(function () {}).then(function () { loading = null; sync(); });
    return loading;
  }

  // ── UI: the PIN control in the Emoji footer and in the Izskats column, and the gate ──
  var LOCK_SVG = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10 2a4 4 0 0 0-4 4v2H5.5A1.5 1.5 0 0 0 4 9.5v7A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 8H14V6a4 4 0 0 0-4-4Zm-2.5 4a2.5 2.5 0 0 1 5 0v2h-5V6Zm2.5 5a1.25 1.25 0 0 1 .75 2.25V15a.75.75 0 0 1-1.5 0v-1.75A1.25 1.25 0 0 1 10 11Z"/></svg>';
  // Where the control goes in each tab; both tabs re-render, so it is put back (see watch).
  var SPOTS = [
    { view: 'modal-emoji-view', parent: '.mkp-footer', before: '#mkp-modal-asbg', wide: false },
    { view: 'modal-skin-view', parent: '.org-left-top', before: null, wide: true }
  ];
  var gate, dlg, watching = false, watchRaf = 0;
  function control(wide) {
    var box = document.createElement('div');
    box.className = 'wm-lock-ctl' + (wide ? ' is-wide' : '');
    box.innerHTML = '<button type="button" class="wm-lock">' + LOCK_SVG + '<span class="wm-lock-copy"><b></b>' + (wide ? '<small></small>' : '') + '</span></button>'
      + '<button type="button" class="wm-lock-exit" title="Iziet no sava PIN profila (arī radio)">Iziet</button>';
    box.querySelector('.wm-lock').addEventListener('click', onButton);
    box.querySelector('.wm-lock-exit').addEventListener('click', function () { var m = media(); if (m && m.logout) Promise.resolve(m.logout()).then(sync); });
    return box;
  }
  function place() {
    if (!media()) return;
    SPOTS.forEach(function (spot) {
      var view = document.getElementById(spot.view), host = view && view.querySelector(spot.parent);
      if (!host || host.querySelector(':scope > .wm-lock-ctl')) return;
      var at = spot.before ? host.querySelector(':scope > ' + spot.before) : null;
      host.insertBefore(control(spot.wide), at);
      paint();
    });
  }
  function watch() {
    if (watching) return;
    watching = true;
    var mo = new MutationObserver(function () {
      if (watchRaf) return;
      watchRaf = requestAnimationFrame(function () { watchRaf = 0; place(); });
    });
    SPOTS.forEach(function (spot) { var v = document.getElementById(spot.view); if (v) mo.observe(v, { childList: true, subtree: true }); });
  }
  function ensureUi() {
    var modal = document.getElementById('worker-modal');
    if (!modal) return null;
    if (!gate) {
      gate = document.createElement('div');
      gate.className = 'wm-lock-gate';
      gate.innerHTML = '<span class="wm-lock-gate-icon">' + LOCK_SVG + '</span><h3>Kartīte aizsargāta ar PIN</h3><p></p><button type="button">Ievadīt PIN</button>';
      gate.querySelector('button').addEventListener('click', function () { askPin(window.__wmWorkerName).then(sync); });
      var content = modal.querySelector('.modal-content');
      if (content) content.prepend(gate);
    }
    watch();
    place();
    return modal;
  }

  function paint() {
    var name = String(window.__wmWorkerName || '');
    var on = isLocked(name), mine = owns(name);
    document.querySelectorAll('#worker-modal .wm-lock-ctl').forEach(function (box) {
      var b = box.querySelector('.wm-lock'), small = box.querySelector('small');
      box.hidden = !name;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('b').textContent = on ? 'Aizsargāts ar PIN' : 'Aizsargāt ar PIN';
      if (small) small.textContent = on ? 'Mainīt var tikai ' + first(name) + '. Nospied, lai noņemtu.' : 'Emoji un izskatu varēs mainīt tikai ar tavu PIN (to pašu, kas radio).';
      b.title = on ? 'Noņemt PIN aizsardzību' : 'Emoji un izskatu varēs mainīt tikai ar tavu PIN (to pašu, kas radio)';
      box.querySelector('.wm-lock-exit').hidden = !mine;
    });
  }

  function sync() {
    var modal = ensureUi();
    if (!modal) return;
    var name = String(window.__wmWorkerName || '');
    var on = isLocked(name), mine = owns(name);
    modal.classList.toggle('wm-locked', on && !mine);
    // The editors are kept on screen by strong !important rules: hidden here inline, and
    // only this hiding (marked) is undone again.
    ['modal-emoji-view', 'modal-skin-view'].forEach(function (id) {
      var v = document.getElementById(id);
      if (!v) return;
      if (on && !mine) { v.style.setProperty('display', 'none', 'important'); v.dataset.wmGate = '1'; }
      else if (v.dataset.wmGate) { v.style.removeProperty('display'); delete v.dataset.wmGate; }
    });
    paint();
    gate.querySelector('p').textContent = 'Emoji un izskatu var mainīt tikai ' + first(name) + ' ar savu PIN (to pašu, kas radio).';
  }

  function setLock(name, on) {
    var a = api();
    if (!a) { toast('Nav savienojuma ar serveri', 'err'); return Promise.resolve(); }
    return a.apiFetch('/api/card-lock', { method: 'POST', json: { worker: name, locked: on, mediaSession: token() } }).then(function (r) {
      if (!r.ok) throw new Error();
      if (on) locked.add(norm(name)); else locked.delete(norm(name));
      toast(on ? 'Kartīte aizsargāta ar PIN' : 'PIN aizsardzība noņemta');
    }).catch(function () { toast('Neizdevās saglabāt aizsardzību', 'err'); }).then(sync);
  }

  function onButton() {
    var name = String(window.__wmWorkerName || '');
    if (!name) return;
    var on = isLocked(name);
    if (owns(name)) { setLock(name, !on); return; }
    askPin(name).then(function (ok) { if (ok && !on) return setLock(name, true); sync(); });
  }

  // ── PIN dialog: sign in (or create the PIN) with the radio profile API ──
  function askPin(name) {
    var m = media();
    if (!m || !m.api || !m.signIn) { toast('PIN pieteikšanās šeit nav pieejama', 'err'); return Promise.resolve(false); }
    var modal = ensureUi();
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'wm-pin';
      dlg.setAttribute('aria-labelledby', 'wm-pin-title');
      dlg.innerHTML = '<form method="dialog">'
        + '<h3 id="wm-pin-title"></h3><p class="wm-pin-text"></p>'
        + '<input class="wm-pin-in" type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="PIN">'
        + '<input class="wm-pin-again" type="password" inputmode="numeric" autocomplete="off" maxlength="6" aria-label="Atkārto PIN" placeholder="Atkārto PIN">'
        + '<p class="wm-pin-status" role="status" aria-live="polite"></p>'
        + '<div class="wm-pin-code" hidden><b>Saglabā atkopšanas kodu</b><code></code><span>Ar to varēs nomainīt aizmirstu PIN. Kods tiek parādīts tikai vienreiz.</span></div>'
        + '<div class="wm-pin-actions"><button type="button" class="wm-pin-cancel">Atcelt</button><button type="submit" class="wm-pin-ok">Atvērt</button></div>'
        + '</form>';
      // Esc closes only this dialog, not the card window under it.
      dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape') e.stopPropagation(); });
      (modal || document.body).append(dlg);
    }
    var q = function (s) { return dlg.querySelector(s); };
    var pin = q('.wm-pin-in'), again = q('.wm-pin-again'), status = q('.wm-pin-status'), ok = q('.wm-pin-ok'), code = q('.wm-pin-code');
    var create = false, done = false, busy = false;
    q('#wm-pin-title').textContent = first(name) + ' PIN';
    q('.wm-pin-text').textContent = 'Pārbauda…';
    pin.value = again.value = ''; status.textContent = ''; code.hidden = true; ok.textContent = 'Atvērt';
    pin.hidden = again.hidden = true; ok.disabled = true;
    dlg.showModal();
    m.api('pin-status', { name: name }, null).then(function (r) {
      create = !r.hasPin;
      q('.wm-pin-text').textContent = create ? 'Izveido 6 ciparu PIN. Tas pats PIN derēs arī radio.' : 'Ievadi savu PIN (to pašu, kas radio).';
      pin.maxLength = create ? 6 : 8;
      pin.placeholder = create ? 'Jaunais PIN' : 'PIN';
      pin.hidden = false; again.hidden = !create; ok.disabled = false; ok.textContent = create ? 'Izveidot' : 'Atvērt';
      pin.focus();
    }).catch(function (e) { q('.wm-pin-text').textContent = ''; status.textContent = e.message || 'Profila serveris nav pieejams.'; });

    return new Promise(function (resolve) {
      function finish(result) { dlg.removeEventListener('close', onClose); dlg.querySelector('form').onsubmit = null; q('.wm-pin-cancel').onclick = null; if (dlg.open) dlg.close(); resolve(result); }
      function onClose() { finish(done); }
      dlg.addEventListener('close', onClose);
      q('.wm-pin-cancel').onclick = function () { finish(done); };
      dlg.querySelector('form').onsubmit = function (e) {
        e.preventDefault();
        if (done) { finish(true); return; }
        if (busy) return;
        if (!/^\d{4,8}$/.test(pin.value)) { status.textContent = 'Ievadi PIN ciparus.'; return; }
        busy = true; ok.disabled = true; status.textContent = 'Pārbauda…';
        m.api('login', { name: name, pin: pin.value, confirm: again.value, createPin: create }, null).then(function (r) {
          return Promise.resolve(m.signIn(r.session)).then(function () {
            done = true; pin.value = again.value = '';
            if (r.recoveryCode) {
              code.querySelector('code').textContent = r.recoveryCode.match(/.{1,4}/g).join('-');
              code.hidden = false; pin.hidden = again.hidden = true; status.textContent = ''; ok.textContent = 'Gatavs';
            } else finish(true);
          });
        }).catch(function (e) { status.textContent = e.message || 'Neizdevās.'; pin.select(); })
          .then(function () { busy = false; ok.disabled = false; });
      };
    });
  }

  // A save the server refused because the card is locked.
  function refused(name) {
    locked.add(norm(name));
    sync();
    toast('Kartīte aizsargāta ar PIN: izmaiņas netika saglabātas', 'err');
  }

  try { window.parent.document.addEventListener('media-profile-change', function () { sync(); }); } catch (_e) {}
  window.MinkaCardLock = { load: load, sync: sync, isLocked: isLocked, owns: owns, token: token, refused: refused };
  load(true);
})();
