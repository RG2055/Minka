/* The app moved from rg2055.github.io/Minka to rgapp.page (2026-09-26).
   On the old address only: a bar at the top with one button. It opens
   rgapp.page/migrate.html and hands it what this device kept for the app
   (look, radio settings, sign-in), straight from window to window: sent
   only to rgapp.page, only to the window it opened, only when that window
   asks. Caches are left behind (the new address fetches fresh).
   rgapp.page is the app; this address stays for testing before an update
   goes there, so once a device has moved the bar never shows on it again. */
(function () {
  if (location.hostname !== 'rg2055.github.io') return;
  var NEW = 'https://rgapp.page';
  var HIDE_KEY = 'minkaMoveNoticeHiddenAt';
  var MOVED_KEY = 'minkaMovedToRgappAt';
  try {
    if (localStorage.getItem(MOVED_KEY)) return;
    if (Date.now() - Number(localStorage.getItem(HIDE_KEY) || 0) < 864e5) return;
  } catch (_e) {}

  var app = window.MINKA_APP === 'rad' ? 'rad' : '';
  var mobile = /\/mobile\.html$/.test(location.pathname);
  var SKIP = /cache|_ts_|^workbox|^sw[-_]/i;

  function snapshot() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || SKIP.test(k) || k === HIDE_KEY || k === MOVED_KEY) continue;
        var v = localStorage.getItem(k);
        if (typeof v === 'string' && v.length < 2e6) out[k] = v;
      }
    } catch (_e) {}
    return out;
  }

  function move() {
    try { localStorage.setItem(MOVED_KEY, String(Date.now())); } catch (_e) {}
    var bar = document.getElementById('mkMoveBar');
    if (bar) bar.remove();
    var url = NEW + '/migrate.html?' + (app ? 'app=rad&' : '') + (mobile ? 'm=1' : '');
    var win = window.open(url, '_blank');
    if (!win) { location.href = NEW + (mobile ? '/mobile.html' + (app ? '?app=rad' : '') : (app ? '/rad/' : '/')); return; }
    function onMessage(e) {
      if (e.origin !== NEW || e.source !== win || !e.data || e.data.type !== 'minka-move-ready') return;
      window.removeEventListener('message', onMessage);
      try { win.postMessage({ type: 'minka-move-data', items: snapshot() }, NEW); } catch (_e) {}
    }
    window.addEventListener('message', onMessage);
  }

  function show() {
    if (document.getElementById('mkMoveBar')) return;
    var bar = document.createElement('div');
    bar.id = 'mkMoveBar';
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:10px;'
      + 'max-width:calc(100vw - 24px);box-sizing:border-box;padding:8px 8px 8px 14px;border-radius:14px;background:#0f141b;'
      + 'border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 30px rgba(0,0,0,.45);color:#e6ebf2;'
      + 'font:500 13px/1.3 Inter,system-ui,-apple-system,sans-serif;';
    var text = document.createElement('span');
    text.textContent = 'Lietotne pārcēlās uz rgapp.page';
    var go = document.createElement('button');
    go.type = 'button';
    go.textContent = 'Pāriet';
    go.style.cssText = 'appearance:none;border:0;cursor:pointer;padding:7px 14px;border-radius:10px;background:#d6e3ff;color:#0b1d36;font:600 13px/1 Inter,system-ui,sans-serif;';
    go.addEventListener('click', move);
    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Paslēpt līdz rītdienai');
    close.textContent = '×';
    close.style.cssText = 'appearance:none;border:0;cursor:pointer;width:28px;height:28px;border-radius:8px;background:transparent;color:#9aa4b2;font:400 20px/1 system-ui,sans-serif;';
    close.addEventListener('click', function () {
      try { localStorage.setItem(HIDE_KEY, String(Date.now())); } catch (_e) {}
      bar.remove();
    });
    bar.append(text, go, close);
    document.body.appendChild(bar);
  }
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show, { once: true });
})();
