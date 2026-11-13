/* The golden can: about one logged drink in fifteen is golden, and the person's card glows gold until the
   shift ends (js/page/coffee-fx.js). Nothing is stored: whether a person's n-th drink of a kind is golden
   is worked out from their name, the drink and n, so every device agrees. n comes from the coffee
   server's all-time counts (today's drinks are the latest of each kind). */
(function () {
  'use strict';
  // FNV-1a over the text, then a murmur finish: an even 32-bit number that never changes for the same text
  function hash(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }
  function norm(name) { return String(name || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('lv-LV'); }
  function is(name, source, n) { return hash('gold|' + norm(name) + '|' + source + '|' + n) % 15 === 0; }

  var counts = null, job = null, fetchedAt = 0, pending = [];   // pending: saved here since the counts were asked
  function eq(source) { return window.__minkaCoffeeEq ? window.__minkaCoffeeEq(source) : 1; }
  function load(force) {
    if (job) return job;
    if (counts && !force) return Promise.resolve();
    var started = Date.now();
    var get = window.__minkaCoffeeFetch || function (path, opt) { return fetch('https://coffee.rgapp.page' + path, opt); };
    job = get('/api/coffee?totals=1', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok || !d.details) return;
        var next = {};
        Object.keys(d.details).forEach(function (worker) {
          var src = (d.details[worker] || {}).sources || {}, out = {};
          Object.keys(src).forEach(function (k) { var n = Math.round((Number(src[k]) || 0) / eq(k)); if (n > 0) out[k] = n; });
          next[norm(worker)] = out;
        });
        counts = next; fetchedAt = Date.now();
        pending = pending.filter(function (p) { return p.at > started - 1500; });   // older ones are in the answer already
        if (window.__minkaCoffeeAuraRefresh) window.__minkaCoffeeAuraRefresh();
      })
      .catch(function () {})
      .then(function () { job = null; });
    return job;
  }
  function drinks(name, source) {
    var key = norm(name), n = counts && counts[key] && counts[key][source] || 0;
    pending.forEach(function (p) { if (p.key === key && p.src === source) n++; });
    return n;
  }
  var refetch = 0;
  function refetchSoon() { clearTimeout(refetch); refetch = setTimeout(function () { load(true); }, 6000); }
  // someone else's coffee, or one taken back: ask again, but not more often than every two minutes
  document.addEventListener('minka:coffee-changed', function () { if (counts && Date.now() - fetchedAt > 120000) refetchSoon(); });

  window.MkCoffeeGold = {
    is: is,
    load: load,
    // a coffee was just saved (calendar.js, the menu's Saglabāt): resolves true when it is a golden can
    saved: function (name, source) {
      return load().then(function () {
        if (!counts) return false;   // the counts could not be read: no gold this time
        var n = drinks(name, source) + 1;
        pending.push({ key: norm(name), src: source, at: Date.now() });
        refetchSoon();
        return is(name, source, n);
      });
    },
    // one of today's drinks was a golden can
    today: function (name) {
      var today = window.__minkaCoffeeTodayDrinks ? window.__minkaCoffeeTodayDrinks(name) : null;
      if (!today || !counts) return false;
      return Object.keys(today).some(function (src) {
        var last = Math.max(drinks(name, src), today[src]);
        for (var n = last - today[src] + 1; n <= last; n++) if (is(name, src, n)) return true;
        return false;
      });
    }
  };
  setTimeout(function () { load(); }, 2500);   // the golden glow needs the counts: ask once the page has settled
})();
