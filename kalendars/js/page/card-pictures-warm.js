/* Card pictures loaded once, before they are needed.

   On a day switch every card is built anew. Its decorations (img.mk-card-addon),
   3D emoji (img.mk-e3d) and the still Fluent frames of emoji the font cannot
   draw are new <img> elements: a picture not yet in memory paints a moment
   after the card, and a 3D emoji or Fluent frame first shows the plain emoji
   it replaces. That is the "card assembling itself" flicker.

   So, from the start (while the loading screen shows), every colleague's
   decorations and emoji pictures are loaded and decoded, a few per idle slice.
   They are the same small files the cards would load anyway; nothing is drawn
   and nothing on screen changes. The Image objects are kept so the pictures
   stay in memory for the next card that shows them. */
(function () {
  'use strict';
  if (window.MinkaWarm) return;
  var kept = new Map();                 // absolute URL -> decoded Image
  var stats = { queued: 0, ready: 0, failed: 0 };

  function abs(src) { try { return new URL(src, document.baseURI).href; } catch (_e) { return ''; } }
  function add(list, src) {
    var u = src && abs(src);
    if (u && !/^(data|blob):/.test(u) && !kept.has(u) && list.indexOf(u) < 0) list.push(u);
  }
  function collect() {
    var urls = [];
    var A = window.MinkaCardAddons, E = window.MinkaEmoji, E3 = window.MinkaEmoji3D, F = window.MinkaEmojiFilm;
    try {
      var addons = A && A.getAll ? A.getAll() : {};
      Object.keys(addons || {}).forEach(function (name) {
        var v = addons[name];
        (Array.isArray(v) ? v : [v]).forEach(function (cfg) {
          if (!cfg || !cfg.id) return;
          try { add(urls, A.src(cfg.id)); } catch (_e) {}
        });
      });
    } catch (_e) {}
    try {
      var emojis = E && E.all ? E.all() : {};
      Object.keys(emojis || {}).forEach(function (name) {
        var value = emojis[name], id = E3 && E3.decode(value);
        if (id) { add(urls, E3.url(id, 128)); add(urls, E3.url(id, 320)); }
        else if (F) add(urls, F.staticSrc(value));
      });
    } catch (_e) {}
    return urls;
  }
  function idle(fn) {
    if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 3000 });
    else setTimeout(fn, 200);
  }
  function warm() {
    // The "auto" coffee colours of every card face, worked out once and kept
    // (card-faces.js), so the coffee chip does not change colour after a card shows.
    try { if (window.MinkaCardFaces && window.MinkaCardFaces.warmCoffee && window.mkGetAllSkins) idle(function () { window.MinkaCardFaces.warmCoffee(window.mkGetAllSkins()); }); } catch (_e) {}
    var urls = collect();
    stats.queued += urls.length;
    var next = function () {
      idle(function () {
        urls.splice(0, 8).forEach(function (u) {
          var im = new Image();
          im.decoding = 'async';
          im.src = u;
          kept.set(u, im);
          (im.decode ? im.decode() : Promise.resolve()).then(function () { stats.ready++; }, function () { stats.failed++; kept.delete(u); });
        });
        if (urls.length) next();
      });
    };
    if (urls.length) next();
  }
  // Right away while the loading screen shows (the people's decorations and
  // emoji are already known from this browser), and again once the first view
  // is uncovered, so a day switched to right after a reload finds its pictures
  // ready. The later passes pick up what was not known yet (the emoji
  // still-frame list arrives with its own small request, synced changes).
  function start() {
    var root = document.documentElement, begun = false;
    warm();
    var go = function () { if (begun) return; begun = true; warm(); setTimeout(warm, 2500); };
    if (!root.classList.contains('mk-schedule-booting')) go();
    else {
      var mo = new MutationObserver(function () {
        if (root.classList.contains('mk-schedule-booting')) return;
        mo.disconnect(); go();
      });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
      setTimeout(function () { mo.disconnect(); go(); }, 6000);
    }
    // Emoji or decorations synced later (another device, the editor) join in.
    document.addEventListener('minka:auth-ok', function () { setTimeout(warm, 4000); });
  }
  window.MinkaWarm = { has: function (src) { var im = kept.get(abs(src)); return !!(im && im.complete && im.naturalWidth); }, stats: stats, run: warm };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
