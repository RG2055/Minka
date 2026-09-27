(function MinkaCardAddons() {
  'use strict';

  var STORAGE_KEY = 'mkWorkerCardAddonsV1';
  var CACHE_BUST = '20260912realistic1';
  // The Focus kit has its own version, so the kept pictures stay in everyone's cache.
  var FOCUS_BUST = '20260927focus2';
  var activeGroup = 'topper';
  var scanFrame = 0;
  var sectionFrame = 0;
  var portalFrame = 0;
  var portalBurstUntil = 0;
  var portalMap = new Map();
  var portalScrollList = null;
  var portalSettleTimer = 0;
  var geometryFrame = 0;
  var topperClearanceFrame = 0;
  var observedRoots = new WeakSet();

  var SURFACE_CLASSES = [
    'card-rd', 'mk-mid-card-rd', 'mk-mid-card-rg',
    'mk-has-skin', 'mk-has-grad', 'mk-skin-fit',
    'nsc-worker-skinned', 'nsc-skin-hue', 'nsc-skin-contain',
    'ns-room-bed-skin-hue'
  ];
  var SURFACE_PROPS = ['--mk-skin-img', '--mk-emoji-tint', '--mk-emoji-tint-a'];
  // Decorations belong to the main roster only. Night distribution reuses
  // worker skins, but its operational cards must stay clean and uncluttered.
  var CARD_SELECTOR = '#grafiks-list .card[data-worker]';

  // Defined before ITEMS: the coffee items are built from them.
  var COFFEE_DRINKS = [['narvesen', 'Narvesen'], ['monster', 'Monster'], ['monsterultra', 'Monster Ultra'], ['redbull', 'Red Bull'],
    ['brite', 'Brite'], ['philips', 'Philips'], ['lofbergs', 'Löfbergs'], ['mycoffee', 'Mana kafija']];
  var COFFEE_STATS = [['', 'Bez skaitļa'], ['n', 'Šodien pie katras'], ['t', 'Šodien kopā'], ['a', 'Visu laiku']];
  /* Groups in the picker. Kept: everything someone uses (checked in the cloud,
     2026-09-27). The unused originals made way for the Focus kit (focus-v1,
     scripts/build-focus-addons.py): gradient-map "fokuss" and halftone cut-outs,
     editorial labels, full-card frames and light, plus live coffee stickers. */
  var GROUPS = [
    { id: 'topper', label: 'Topperi' },
    { id: 'object', label: 'Objekti' },
    { id: 'charm', label: 'Piekariņi' },
    { id: 'chrome', label: 'Hroms' },
    { id: 'frame', label: 'Kadri' },
    { id: 'light', label: 'Gaisma' },
    { id: 'sticker', label: 'Zīmes' },
    { id: 'coffee', label: 'Kafija' }
  ];

  function optimized(file) { return 'data/card-addons/realistic-v1/' + file; }
  function focusKit(file) { return 'data/card-addons/focus-v1/' + file; }

  var ITEMS = [
    { id: 'topper-flower-white-cat', label: 'Ziedu baltais kaķis', group: 'topper', dockY: 5, aspect: '640 / 523', src: optimized('topper-flower-white-cat.webp') },
    { id: 'topper-neon-black-cat', label: 'Neona melnais kaķis', group: 'topper', dockY: 5, aspect: '640 / 610', src: optimized('topper-neon-black-cat.webp') },
    { id: 'topper-cosmic-moon', label: 'Kosmiskais mēness', group: 'topper', dockY: 7, aspect: '640 / 404', src: optimized('topper-cosmic-moon.webp') },
    { id: 'topper-music-orange-cat', label: 'Mūzikas rudais kaķis', group: 'topper', dockY: 6, aspect: '640 / 544', src: optimized('topper-music-orange-cat.webp') },
    { id: 'topper-night-nurse-cat', label: 'Nakts mediķa kaķis', group: 'topper', dockY: 5, aspect: '640 / 501', src: optimized('topper-night-nurse-cat.webp') },
    { id: 'topper-medic-tuxedo-cat', label: 'Mediķa kaķis', group: 'topper', dockY: 6, aspect: '601 / 640', src: optimized('topper-medic-tuxedo-cat.webp') },
    { id: 'topper-focus-tabby', label: 'Kaķis fokusā', group: 'topper', dockY: 5, aspect: '512 / 410', src: focusKit('topper-focus-tabby.webp') },
    { id: 'topper-halftone-cat', label: 'Rastra kaķis', group: 'topper', dockY: 5, aspect: '512 / 422', src: focusKit('topper-halftone-cat.webp') },

    { id: 'object-holo-helmet', label: 'Holo ķivere', group: 'object', src: optimized('object-holo-helmet.webp') },
    { id: 'object-david', label: 'Dāvids', group: 'object', src: optimized('object-david.webp') },
    { id: 'object-strawberry', label: 'Zemene', group: 'object', src: optimized('object-strawberry.webp') },
    { id: 'object-radiology-cat', label: 'Radioloģijas kaķis', group: 'object', src: optimized('object-radiology-cat.webp') },
    { id: 'object-glitch-statue', label: 'Neona statuja', group: 'object', src: optimized('object-glitch-statue.webp') },
    { id: 'object-floral-skull', label: 'Ziedu galvaskauss', group: 'object', src: optimized('object-floral-skull.webp') },
    { id: 'object-skeleton-peace', label: 'Skeleta miera zīme', group: 'object', src: optimized('object-skeleton-peace.webp') },
    { id: 'object-astronaut', label: 'Mēness astronauts', group: 'object', src: optimized('object-astronaut.webp') },
    { id: 'object-crystal-cat', label: 'Kristāla kaķis', group: 'object', src: optimized('object-crystal-cat.webp') },
    { id: 'object-owl', label: 'Baltā pūce', group: 'object', src: optimized('object-owl.webp') },
    { id: 'object-david-focus', label: 'Dāvids fokusā', group: 'object', src: focusKit('object-david-focus.webp') },
    { id: 'object-owl-focus', label: 'Pūce fokusā', group: 'object', src: focusKit('object-owl-focus.webp') },
    { id: 'object-astronaut-focus', label: 'Astronauts fokusā', group: 'object', src: focusKit('object-astronaut-focus.webp') },
    { id: 'object-skull-focus', label: 'Galvaskauss fokusā', group: 'object', src: focusKit('object-skull-focus.webp') },
    { id: 'object-skeleton-halftone', label: 'Miera zīme rastrā', group: 'object', src: focusKit('object-skeleton-halftone.webp') },
    { id: 'object-cat-halftone', label: 'Kaķis rastrā', group: 'object', src: focusKit('object-cat-halftone.webp') },
    { id: 'object-statue-halftone', label: 'Statuja rastrā', group: 'object', src: focusKit('object-statue-halftone.webp') },

    { id: 'charm-masked-night-skull', label: 'Mediķis maskā', group: 'charm', src: optimized('charm-masked-night-skull.webp') },
    { id: 'charm-blue-moon', label: 'Zilais mēness', group: 'charm', src: optimized('charm-blue-moon.webp') },
    { id: 'charm-night-nurse-skull', label: 'Nakts māsiņa', group: 'charm', src: optimized('charm-night-nurse-skull.webp') },
    { id: 'charm-prism-star', label: 'Kristāla zvaigzne', group: 'charm', src: optimized('charm-prism-star.webp') },
    { id: 'charm-white-bone', label: 'Baltais kauliņš', group: 'charm', src: optimized('charm-white-bone.webp') },
    { id: 'charm-coffee', label: 'Kafija', group: 'charm', src: optimized('charm-coffee.webp') },
    { id: 'charm-paw', label: 'Ķepiņa', group: 'charm', src: optimized('charm-paw.webp') },
    { id: 'charm-lens', label: 'Objektīvs', group: 'charm', src: focusKit('charm-lens.svg') },
    { id: 'charm-reticle', label: 'Tēmēklis', group: 'charm', src: focusKit('charm-reticle.svg') },
    { id: 'charm-halftone-orb', label: 'Rastra lode', group: 'charm', src: focusKit('charm-halftone-orb.svg') },
    { id: 'charm-focus-tag', label: 'Fokusa birka', group: 'charm', src: focusKit('charm-focus-tag.svg') },

    { id: 'chrome-set', label: 'Hroma komplekts', group: 'chrome', src: focusKit('chrome-set.webp') },
    { id: 'chrome-d', label: 'Hroma puse', group: 'chrome', src: focusKit('chrome-d.webp') },
    { id: 'chrome-half', label: 'Hroma loks', group: 'chrome', src: focusKit('chrome-half.webp') },
    { id: 'chrome-drop', label: 'Hroma lāse', group: 'chrome', src: focusKit('chrome-drop.webp') },
    { id: 'chrome-circle', label: 'Hroma disks', group: 'chrome', src: focusKit('chrome-circle.webp') },
    { id: 'chrome-pill', label: 'Hroma kapsula', group: 'chrome', src: focusKit('chrome-pill.webp') },

    { id: 'frame-holo', label: 'Holo svītras', group: 'frame', src: focusKit('frame-holo.webp') },
    { id: 'frame-focus', label: 'Fokuss', group: 'frame', src: focusKit('frame-focus.svg') },
    { id: 'frame-viewfinder', label: 'Skatu meklētājs', group: 'frame', src: focusKit('frame-viewfinder.svg') },
    { id: 'frame-thirds', label: 'Trešdaļas', group: 'frame', src: focusKit('frame-thirds.svg') },
    { id: 'frame-registration', label: 'Drukas zīmes', group: 'frame', src: focusKit('frame-registration.svg') },
    { id: 'frame-ruler', label: 'Lineāls', group: 'frame', src: focusKit('frame-ruler.svg') },

    { id: 'light-leak-warm', label: 'Silta noplūde', group: 'light', src: focusKit('light-leak-warm.svg') },
    { id: 'light-leak-cool', label: 'Vēsa noplūde', group: 'light', src: focusKit('light-leak-cool.svg') },
    { id: 'light-bokeh', label: 'Bokeh', group: 'light', src: focusKit('light-bokeh.svg') },
    { id: 'light-flare', label: 'Saules atspīdums', group: 'light', src: focusKit('light-flare.svg') },
    { id: 'light-shine', label: 'Spīdums', group: 'light', src: focusKit('light-shine.svg') },

    { id: 'sticker-24h-duty', label: '24H Duty', group: 'sticker', src: optimized('sticker-24h-duty.webp') },
    { id: 'label-focus', label: 'Focus', group: 'sticker', flat: true, src: focusKit('label-focus.svg') },
    { id: 'label-light-shine', label: 'light focus shine', group: 'sticker', flat: true, src: focusKit('label-light-shine.svg') },
    { id: 'label-rec', label: 'REC', group: 'sticker', flat: true, src: focusKit('label-rec.svg') },
    { id: 'label-exposure', label: 'Ekspozīcija', group: 'sticker', flat: true, src: focusKit('label-exposure.svg') },
    { id: 'label-night', label: 'Nakts maiņa', group: 'sticker', flat: true, src: focusKit('label-night.svg') },
    { id: 'label-lens-dot', label: 'On duty', group: 'sticker', src: focusKit('label-lens-dot.svg') },
    { id: 'label-barcode', label: 'Svītrkods', group: 'sticker', flat: true, src: focusKit('label-barcode.svg') },

    // Kept for the one card that still has it; no longer offered in the picker.
    { id: 'tape-clear', label: 'Caurspīdīga', group: 'tape', hidden: true, src: optimized('tape-clear.webp') },
  ].concat(coffeeItems());

  /* Kafija: live stickers from the person's own coffee log (the same drinks and
     pixel icons as the coffee menu). Each comes in four variants — no number,
     a small count at each drink, today's total, all-time total — stored as the
     id suffix (-n / -t / -a), so the cloud format stays the same. */
  function coffeeItems() {
    var out = [];
    [['coffee-today', 'Šodienas kafijas', '']].concat(COFFEE_DRINKS.map(function(d) { return ['coffee-' + d[0], d[1], d[0]]; })).forEach(function(d) {
      COFFEE_STATS.forEach(function(st) {
        out.push({ id: d[0] + (st[0] ? '-' + st[0] : ''), base: d[0], stat: st[0], drink: d[2], label: d[1], group: 'coffee', dynamic: true, hidden: !!st[0] });
      });
    });
    return out;
  }
  function coffeeToday(name) {
    var out = { count: 0, sources: [] };
    try {
      var all = window.__minkaGetCoffeeDetailsForNames && window.__minkaGetCoffeeDetailsForNames([name]);
      var v = all && Object.keys(all).length ? all[Object.keys(all)[0]] : null;
      if (v) { out.count = v.count || 0; out.sources = (v.sources || []).slice().sort(function(a, b) { return b.count - a.count; }); }
    } catch (_e) {}
    return out;
  }
  function coffeeAllTime(name) {
    try {
      var want = String(name || '').trim().toLowerCase();
      var row = (window.__minkaGetCoffeeLeaderboard ? window.__minkaGetCoffeeLeaderboard(999) : []).filter(function(r) { return String(r.name || '').trim().toLowerCase() === want; })[0];
      return row ? row.count : 0;
    } catch (_e) { return 0; }
  }
  /* Brite and "Mana kafija" icons point at PNG files; an SVG shown as an <img>
     may not load outside files, so each PNG is fetched once and inlined. */
  var coffeePng = Object.create(null);
  function inlineCoffeePngs(raw) {
    return raw.replace(/href="([^"]+\.png)"/g, function(all, href) {
      var abs = new URL(href, document.baseURI).href;
      if (coffeePng[abs] && coffeePng[abs] !== 1) return 'href="' + coffeePng[abs] + '"';
      if (!coffeePng[abs]) {
        coffeePng[abs] = 1;
        fetch(abs).then(function(r) { return r.blob(); }).then(function(b) {
          return new Promise(function(ok) { var fr = new FileReader(); fr.onload = function() { ok(fr.result); }; fr.readAsDataURL(b); });
        }).then(function(data) { coffeePng[abs] = data; refreshCoffee(); }, function() { delete coffeePng[abs]; });
      }
      return 'href=""';
    });
  }
  /* All time = the coffee server's totals, the very numbers the Statistics tab
     shows (it keeps them in window.__mkCoffeeTotalsApi / __mkCoffeeDetailsApi, and
     so does this). Asked once; again only a while after a coffee is logged. */
  var coffeeTotalsJob = null, coffeeTotalsAt = 0;
  function coffeeNorm(name) {
    var M = window.MinkaDaybookModel;
    return M && typeof M.norm === 'function' ? M.norm(name) : String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }
  function loadCoffeeTotals(force) {
    if (coffeeTotalsJob || (!force && window.__mkCoffeeDetailsApi) || (force && Date.now() - coffeeTotalsAt < 5000)) return;
    coffeeTotalsAt = Date.now();
    coffeeTotalsJob = fetch(String(window.MINKA_COFFEE_API_BASE || 'https://coffee.rgapp.page').replace(/\/+$/, '') + '/api/coffee?totals=1', { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d || !d.ok || !d.totals) return;
        var t = {}, det = {};
        Object.keys(d.totals).forEach(function(k) { t[coffeeNorm(k)] = Math.max(0, Number(d.totals[k]) || 0); });
        Object.keys(d.details || {}).forEach(function(k) { det[coffeeNorm(k)] = d.details[k]; });
        window.__mkCoffeeTotalsApi = t; window.__mkCoffeeDetailsApi = det;
        refreshCoffee();
      })
      .catch(function() {})
      .then(function() { coffeeTotalsJob = null; });
  }
  function coffeeAllTimeBySource(name) {
    var det = window.__mkCoffeeDetailsApi;
    if (!det) { loadCoffeeTotals(); return {}; }
    var src = (det[coffeeNorm(name)] || {}).sources || {}, out = {};
    // Stored in caffeine cups; a sticker counts drinks (as the Statistics chips do).
    var eq = { monster: 2, monsterultra: 2, brite: 1.25 };
    Object.keys(src).forEach(function(k) { var n = (Number(src[k]) || 0) / (eq[k] || 1); out[k] = n > 0 ? Math.max(1, Math.round(n)) : 0; });
    return out;
  }
  function coffeeIconAt(drink, x, y, size, faded) {
    var raw = typeof window.__minkaCoffeeIcon === 'function' ? String(window.__minkaCoffeeIcon(drink) || '') : '';
    if (raw.indexOf('<svg') < 0) return '';
    raw = inlineCoffeePngs(raw);
    return '<g filter="url(#o)"' + (faded ? ' opacity=".45"' : '') + '>' + raw.replace('<svg', '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '"') + '</g>';
  }
  function coffeeBadge(x, y, text) {
    var len = String(text).length, w = len > 2 ? 7 * len + 6 : 19;   // a pill for 100+
    return '<rect x="' + (x - w / 2) + '" y="' + (y - 9.5) + '" width="' + w + '" height="19" rx="9.5" fill="#f67a18" stroke="#0a0b0e" stroke-width="1.5"/>'
      + '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Helvetica Neue,Arial,sans-serif">' + text + '</text>';
  }
  function coffeePill(x, y, width, label, value) {
    return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="17" rx="8.5" fill="#0a0b0e" stroke="#f4f2ec" stroke-opacity=".5"/>'
      + '<text x="' + (x + 8) + '" y="' + (y + 12.3) + '" font-size="9.5" font-weight="600" fill="#f4f2ec" font-family="Helvetica Neue,Arial,sans-serif">' + label
      + ' <tspan font-weight="800" fill="#f6a24a">' + value + '</tspan></text>';
  }
  /* Numbers: "n" today's count at each drink; "t" today's total in a pill;
     "a" all time — every drink with its own count (Monster ×N, Narvesen ×N),
     the single-drink sticker its own all-time count. */
  function coffeeSvgUrl(item, name) {
    var today = coffeeToday(name), parts = '', width, height;
    var all = item.stat === 'a' ? coffeeAllTimeBySource(name) : null;
    var drinks;
    if (item.drink) drinks = [{ key: item.drink, count: all ? all[item.drink] || 0 : (today.sources.filter(function(s) { return s.key === item.drink; })[0] || {}).count || 0 }];
    else if (all) drinks = Object.keys(all).filter(function(k) { return all[k] > 0; }).sort(function(a, b) { return all[b] - all[a]; }).slice(0, 4).map(function(k) { return { key: k, count: all[k] }; });
    else drinks = today.sources.slice(0, 4);
    if (!drinks.length) drinks = [{ key: item.drink || 'philips', count: 0 }];
    var size = item.drink ? 58 : 36, step = size + 6;
    drinks.forEach(function(d, i) {
      parts += coffeeIconAt(d.key, 4 + i * step, 4, size, !d.count);
      if (item.stat === 'n' || item.stat === 'a') parts += coffeeBadge(4 + i * step + size - 4, size - 2, d.count);
    });
    // Room for the count badges, which sit over the icons' lower right corner.
    width = 8 + drinks.length * step - 6 + (item.stat === 'n' || item.stat === 'a' ? 10 : 0); height = size + 10 + (item.stat === 'n' || item.stat === 'a' ? 4 : 0);
    if (item.stat === 't') {
      var pw = 22 + (6 + String(today.count).length) * 6.2;
      parts += coffeePill(2, height - 2, pw, 'šodien', today.count);
      width = Math.max(width, pw + 4); height += 19;
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">'
      + '<defs><filter id="o" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d"/><feFlood flood-color="#f4f2ec"/><feComposite in2="d" operator="in" result="w"/><feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
      + parts + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  function cardWorkerName(card) {
    return (card && card.getAttribute && card.getAttribute('data-worker')) || currentWorkerName();
  }

  var ITEM_BY_ID = Object.create(null);
  ITEMS.forEach(function(item) { ITEM_BY_ID[item.id] = item; });

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normName(value) {
    return typeof window.mkAppearanceIdentity === 'function'
      ? window.mkAppearanceIdentity(value) : String(value || '').trim().toUpperCase();
  }

  function readAll() {
    try {
      var stored=JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}, result={};
      // Read legacy display-name keys through the same identity used by skins.
      // An explicit canonical cloud value takes precedence over a legacy copy.
      Object.keys(stored).forEach(function(name){
        var key=normName(name);
        if(!Object.prototype.hasOwnProperty.call(result,key) || name===key) result[key]=stored[name];
      });
      return result;
    }
    catch (_error) { return {}; }
  }

  function writeAll(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
    catch (_error) {}
    if (window.nsRefreshDreams) window.nsRefreshDreams();
  }

  function currentWorkerName() {
    var first = (document.getElementById('modal-firstname') || {}).innerText || '';
    var last = (document.getElementById('modal-surname') || {}).innerText || '';
    return (first + ' ' + last).replace(/--/g, '').trim();
  }

  /* Up to three decorations per card. Stored as a list (older saves hold one
     object — read as a list of one). */
  var MAX_ADDONS = 3;
  function toList(value) {
    var list = Array.isArray(value) ? value : value ? [value] : [];
    return list.map(function(v) { return normalizeConfig(v); }).filter(Boolean).slice(0, MAX_ADDONS);
  }
  function getList(name) { return toList(readAll()[normName(name)]); }
  function getConfig(name) { return getList(name)[0] || null; }
  // Items drawn as graphics (coffee, frames, light, labels) start without a picture effect.
  function plainItem(item) { return !!item && (item.dynamic || item.group === 'frame' || item.group === 'light' || /^label-/.test(item.id)); }

  /* The decoration's own picture effect, independent of the card: 'card' follows
     the card's effect, 'none' keeps the plain picture, the rest are effects. Unset
     = the card's "Efekts arī dekoram" switch decides (older saves). */
  var DECOR_FX = [['card', 'Kā kartītei'], ['none', 'Nav'], ['focus', 'Fokuss'], ['dither', 'Dither'], ['xray', 'Rentgens'], ['halftone', 'Rastrs'], ['duotone', 'Duotons'], ['ascii', 'ASCII']];
  var DECOR_INKS = [['eceae4', 'Balta'], ['64d2ff', 'Ledus'], ['23cdcf', 'Ciāna'], ['1fe091', 'Zaļa'], ['f5b73f', 'Dzintars'], ['ff8a5c', 'Oranža'], ['ff5c5c', 'Sarkana'], ['2554a0', 'Tinte'], ['141414', 'Melna']];
  function validDecorFx(v) { return DECOR_FX.some(function(f) { return f[0] === v; }); }

  function normalizeConfig(config) {
    if (!config || !ITEM_BY_ID[config.id]) return null;
    var clean = {
      id: config.id,
      // The cloud stores 60–140 % (a smaller local value came back as 60 % on the next sync).
      scale: Math.round(Math.max(.6, Math.min(1.4, Number(config.scale) || 1)) * 100) / 100,
      side: config.side === 'left' ? 'left' : 'right',
      x: Math.round(Math.max(-100, Math.min(100, Number(config.x) || 0)) * 100) / 100,
      y: Math.round(Math.max(-100, Math.min(100, Number(config.y) || 0)) * 100) / 100
    };
    // The decoration's own effect and colour ("rrggbb"), independent of the card.
    if (validDecorFx(config.fx)) clean.fx = config.fx;
    // Smalkums + Kontrasts of the decoration's own effect, "bc" (0–9 each); 5/5 = unset.
    if (clean.fx && /^\d\d$/.test(String(config.tune || '')) && config.tune !== '55') clean.tune = String(config.tune);
    if (/^[a-f0-9]{6}$/.test(String(config.color || ''))) clean.color = String(config.color);
    return clean;
  }

  function saveList(name, list, options) {
    var all = readAll();
    var key = normName(name);
    var clean = toList(list);
    if (clean.length) all[key] = clean;
    else delete all[key];
    writeAll(all);
    applyWorker(name);
    if (!(options && options.skipCloud) && typeof window.mkSyncWorkerAppearance === 'function') {
      window.mkSyncWorkerAppearance(name, true);
    }
  }
  function saveConfig(name, config, options) { saveList(name, config ? [config] : [], options); }

  function assetUrl(item, card) {
    if (item.dynamic) return coffeeSvgUrl(item, cardWorkerName(card));
    var v = item.src.indexOf('focus-v1/') >= 0 ? FOCUS_BUST : CACHE_BUST;
    try { return new URL(item.src + '?v=' + v, document.baseURI).href; }
    catch (_error) { return item.src + '?v=' + v; }
  }

  function surfaceSignature(card) {
    var classes = SURFACE_CLASSES.filter(function(name) {
      return card.classList.contains(name);
    }).join(',');
    var properties = SURFACE_PROPS.map(function(name) {
      return card.style.getPropertyValue(name);
    }).join('|');
    return classes + '|' + properties;
  }

  function syncCardSurface(card, surface, force) {
    var signature = surfaceSignature(card);
    if (!force && surface.dataset.surfaceSignature === signature) return;
    var wasActive = card.classList.contains('mk-addon-active');
    if (wasActive) card.classList.remove('mk-addon-active');
    var style = getComputedStyle(card);
    var values = {
      background: style.background,
      blendMode: style.backgroundBlendMode,
      boxShadow: style.boxShadow,
      borderRadius: style.borderRadius
    };
    if (wasActive) card.classList.add('mk-addon-active');
    card.style.setProperty('--mk-addon-card-radius', values.borderRadius);
    surface.style.setProperty('background', values.background, 'important');
    surface.style.setProperty('background-blend-mode', values.blendMode, 'important');
    surface.style.setProperty('box-shadow', values.boxShadow, 'important');
    surface.style.setProperty('border-radius', values.borderRadius, 'important');
    surface.style.setProperty('clip-path', 'inset(0 round ' + values.borderRadius + ')', 'important');
    surface.dataset.surfaceSignature = signature;
  }

  function setAddonGroupClass(card, groups) {
    groups = [].concat(groups || []);
    GROUPS.forEach(function(item) {
      card.classList.toggle('mk-addon-group-' + item.id, groups.indexOf(item.id) >= 0);
    });
  }

  function writeAddonGeometry(image, cardWidth, cardHeight) {
    var offsetX = Number(image.dataset.addonX) || 0;
    var offsetY = Number(image.dataset.addonY) || 0;
    image.style.setProperty('--mk-addon-offset-x', (offsetX * cardWidth / 100) + 'px');
    image.style.setProperty('--mk-addon-offset-y', (offsetY * cardHeight / 100) + 'px');
  }

  function addonDragPosition(baseX, baseY, dx, dy, width, height) {
    return {
      x: Math.max(-100, Math.min(100, baseX + dx / width * 100)),
      y: Math.max(-100, Math.min(100, baseY + dy / height * 100))
    };
  }

  function refreshAddonGeometry() {
    geometryFrame = 0;
    var images = Array.prototype.slice.call(document.querySelectorAll(
      '#grafiks-list .card > .mk-card-addon:not(.mk-card-addon-portal),'
      + '.mk-skin-preview-real > .mk-card-addon:not(.mk-card-addon-portal)'
    ));
    var measurements = images.map(function(image) {
      var card = image.parentElement;
      return { image: image, width: card.clientWidth, height: card.clientHeight };
    });
    measurements.forEach(function(entry) {
      writeAddonGeometry(entry.image, entry.width, entry.height);
    });
    scheduleAddonPortals(80);
  }

  function scheduleAddonGeometry() {
    if (geometryFrame) return;
    geometryFrame = requestAnimationFrame(refreshAddonGeometry);
  }

  function syncTopperClearance() {
    topperClearanceFrame = 0;
    var list = document.querySelector('#grafiks-list.grid-view');
    if (!list || document.documentElement.classList.contains('mk-mobile-shell')) return;
    var toppers = Array.prototype.slice.call(list.querySelectorAll(
      '.cards-section > .cards-subgrid > .card > .mk-card-addon[data-addon-group="topper"]'
    ));
    var style = getComputedStyle(list);
    var current = parseFloat(style.getPropertyValue('--mk-addon-top-clearance')) || 72;
    var desired = 72;
    if (toppers.length) {
      var listRect = list.getBoundingClientRect();
      var panel = list.closest('.main-panel');
      var panelTop = panel ? panel.getBoundingClientRect().top : 0;
      var minTopAtScrollStart = Math.min.apply(null, toppers.map(function(topper) {
        return topper.getBoundingClientRect().top + list.scrollTop;
      }));
      desired = Math.ceil(current + listRect.top - minTopAtScrollStart + 10);
      desired = Math.max(72, Math.min(desired, current + listRect.top - panelTop - 4));
    }
    if (Math.abs(current - desired) >= 1) {
      list.style.setProperty('--mk-addon-top-clearance', desired + 'px');
    }
  }

  function scheduleTopperClearance() {
    if (topperClearanceFrame) return;
    topperClearanceFrame = requestAnimationFrame(syncTopperClearance);
  }

  function applyToCard(card, value) {
    var list = toList(value);
    var images = card.querySelectorAll(':scope > .mk-card-addon');
    var surface = card.querySelector(':scope > .mk-card-addon-surface');
    if (!list.length) {
      images.forEach(function(img) { img.remove(); });
      if (surface) surface.remove();
      card.classList.remove('mk-addon-active');
      setAddonGroupClass(card, []);
      card.style.removeProperty('--mk-addon-card-radius');
      return;
    }
    // One image per slot; images beyond the list go.
    images.forEach(function(img) { if (!(+img.dataset.slot < list.length)) img.remove(); });
    list.forEach(function(config, slot) { placeAddon(card, config, slot); });
    setAddonGroupClass(card, list.map(function(c) { return ITEM_BY_ID[c.id].group; }));
    card.classList.add('mk-addon-active');
  }
  function placeAddon(card, config, slot) {
    var existing = card.querySelector(':scope > .mk-card-addon[data-slot="' + slot + '"]') || (slot === 0 ? card.querySelector(':scope > .mk-card-addon:not([data-slot])') : null);
    var surface = card.querySelector(':scope > .mk-card-addon-surface');
    var item = ITEM_BY_ID[config.id];
    var scale = Math.max(.6, Math.min(1.4, Number(config.scale) || 1));
    var side = config.side === 'left' ? 'left' : 'right';
    var offsetX = Math.max(-100, Math.min(100, Number(config.x) || 0));
    var offsetY = Math.max(-100, Math.min(100, Number(config.y) || 0));
    if (existing && existing.dataset.addonId === item.id
      && existing.dataset.addonSide === side
      && existing.dataset.addonScale === String(scale)
      && existing.dataset.addonX === String(offsetX)
      && existing.dataset.addonY === String(offsetY)) {
      /* Calendar/radio re-renders may rebuild card.className while preserving
         child nodes. Restore the add-on surface and active overflow class even
         when the matching image already exists. Without this, only the few
         pixels inside the card (a clasp or paws) survive overflow:hidden. */
      var needsGeometry = !card.classList.contains('mk-addon-active');
      // Coffee stickers follow the day's log: redraw when the numbers changed.
      if (item.dynamic) { var fresh = assetUrl(item, card); if (existing.getAttribute('src') !== fresh) existing.src = fresh; }
      if ((existing.dataset.addonColor || '') !== (config.color || '') || (existing.dataset.addonFx || '') !== (config.fx || '')
        || (existing.dataset.addonTune || '') !== (config.tune || '')) {
        if (config.color) existing.dataset.addonColor = config.color; else delete existing.dataset.addonColor;
        if (config.fx) existing.dataset.addonFx = config.fx; else delete existing.dataset.addonFx;
        if (config.tune) existing.dataset.addonTune = config.tune; else delete existing.dataset.addonTune;
        if (window.MinkaDither && window.MinkaDither.decor) window.MinkaDither.decor(card);
      }
      if (!surface) {
        surface = document.createElement('span');
        surface.className = 'mk-card-addon-surface';
        surface.setAttribute('aria-hidden', 'true');
        card.insertBefore(surface, card.firstChild);
        needsGeometry = true;
      }
      if (needsGeometry) writeAddonGeometry(existing, card.clientWidth, card.clientHeight);
      existing.style.setProperty('--mk-addon-dock-y', (Number(item.dockY) || 3) + 'px');
      if (item.aspect) existing.style.setProperty('--mk-addon-aspect', item.aspect);
      else existing.style.removeProperty('--mk-addon-aspect');
      existing.dataset.slot = String(slot);
      syncCardSurface(card, surface);
      return;
    }
    if (existing) existing.remove();
    if (!surface) {
      surface = document.createElement('span');
      surface.className = 'mk-card-addon-surface';
      surface.setAttribute('aria-hidden', 'true');
      card.insertBefore(surface, card.firstChild);
    }
    syncCardSurface(card, surface);
    var image = document.createElement('img');
    image.className = 'mk-card-addon';
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.setAttribute('aria-hidden', 'true');
    image.dataset.addonId = item.id;
    image.dataset.slot = String(slot);
    image.dataset.addonGroup = item.group;
    image.dataset.addonSide = side;
    image.dataset.addonScale = String(scale);
    image.dataset.addonX = String(offsetX);
    image.dataset.addonY = String(offsetY);
    if (/^[a-f0-9]{6}$/.test(String(config.color || ''))) image.dataset.addonColor = config.color;
    if (validDecorFx(config.fx)) image.dataset.addonFx = config.fx;
    if (/^\d\d$/.test(String(config.tune || ''))) image.dataset.addonTune = config.tune;
    image.style.setProperty('--mk-addon-scale', scale);
    image.style.setProperty('--mk-addon-dock-y', (Number(item.dockY) || 3) + 'px');
    if (item.aspect) image.style.setProperty('--mk-addon-aspect', item.aspect);
    writeAddonGeometry(image, card.clientWidth, card.clientHeight);
    image.addEventListener('load', function() {
      scheduleSectionClearance();
      scheduleTopperClearance();
      scheduleAddonPortals(80);
    }, { once: true });
    image.src = assetUrl(item, card);
    // Keep slot order in the DOM (later slots paint on top).
    var after = null;
    card.querySelectorAll(':scope > .mk-card-addon[data-slot]').forEach(function(img) { if (!after && +img.dataset.slot > slot) after = img; });
    card.insertBefore(image, after);
    // "Efekts arī dekoram": the card's picture effect follows onto a new decoration.
    if (window.MinkaDither && window.MinkaDither.decor) window.MinkaDither.decor(card);
  }

  function applyWorker(name) {
    var key = normName(name);
    var config = getList(name);
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function(card) {
      if (normName(card.getAttribute('data-worker')) === key) applyToCard(card, config);
    });
    scheduleSectionClearance();
    scheduleAddonPortals(100);
  }

  /* Toppers stay in the card's native layer; the list gets an expanded top
     viewport in CSS so they are never clipped. Only a charm crossing the
     bottom scroll edge needs a temporary document-level fallback. */
  function syncAddonPortals() {
    if (document.hidden) return;
    var selector = '#grafiks-list.grid-view .cards-section > .cards-subgrid'
      + ' > .card.mk-addon-active > .mk-card-addon[data-addon-group="charm"]';
    var sources = Array.prototype.slice.call(document.querySelectorAll(selector));
    var live = new Set(sources);

    portalMap.forEach(function(clone, source) {
      if (source.isConnected && live.has(source)) return;
      source.classList.remove('mk-card-addon-portaled');
      clone.remove();
      portalMap.delete(source);
    });

    var list = document.querySelector('#grafiks-list.grid-view');
    if (!list) return;
    if (portalScrollList !== list) {
      if (portalScrollList) portalScrollList.removeEventListener('scroll', handlePortalScroll);
      portalScrollList = list;
      portalScrollList.addEventListener('scroll', handlePortalScroll, { passive: true });
    }
    // No charms on the roster: nothing to measure, so skip the forced layout
    // that list.getBoundingClientRect() below would cost on every call.
    if (!sources.length) return;
    sources.forEach(function(source) {
      var clone = portalMap.get(source);
      if (!clone) {
        clone = source.cloneNode(false);
        clone.removeAttribute('id');
        clone.classList.add('mk-card-addon-portal');
        clone.decoding = 'async';
        clone.setAttribute('aria-hidden', 'true');
        document.body.appendChild(clone);
        portalMap.set(source, clone);
      }
    });

    /* All geometry reads happen before any positioning writes. This avoids a
       forced full-page layout for every decorated card. */
    var listRect = list.getBoundingClientRect();
    var radioOpen = document.documentElement.classList.contains('host-radio-open');
    var measurements = sources.map(function(source) {
      var clone = portalMap.get(source);
      var card = source.parentElement;
      var cardRect = card.getBoundingClientRect();
      var sourceRect = source.getBoundingClientRect();
      var visibleHeight = Math.max(0,
        Math.min(cardRect.bottom, listRect.bottom) - Math.max(cardRect.top, listRect.top));
      var needsPortal = sourceRect.top < listRect.top || sourceRect.bottom > listRect.bottom
        || (radioOpen && sourceRect.bottom > cardRect.bottom);
      return {
        source: source,
        clone: clone,
        rect: sourceRect,
        portaled: needsPortal,
        visible: needsPortal && visibleHeight >= Math.min(32, cardRect.height * .25)
      };
    });
    measurements.forEach(function(entry) {
      entry.source.classList.toggle('mk-card-addon-portaled', entry.portaled);
      entry.clone.classList.toggle('is-visible', entry.visible);
      if (!entry.visible) return;
      /* A burst re-measures every frame but the card usually stands still.
         Writing the same four properties again would dirty the compositor for
         nothing, so only a real move is written. */
      var signature = entry.rect.left + '|' + entry.rect.top
        + '|' + entry.rect.width + '|' + entry.rect.height;
      if (entry.clone.dataset.portalSignature === signature) return;
      entry.clone.dataset.portalSignature = signature;
      entry.clone.style.setProperty('--mk-addon-portal-x', entry.rect.left + 'px');
      entry.clone.style.setProperty('--mk-addon-portal-y', entry.rect.top + 'px');
      entry.clone.style.width = entry.rect.width + 'px';
      entry.clone.style.height = entry.rect.height + 'px';
    });
  }

  function scheduleAddonPortals(duration) {
    if (document.hidden) return;
    portalBurstUntil = Math.max(portalBurstUntil, Date.now() + (duration || 0));
    if (portalFrame) return;
    portalFrame = requestAnimationFrame(function portalStep() {
      portalFrame = 0;
      syncAddonPortals();
      if (portalMap.size && Date.now() < portalBurstUntil) {
        portalFrame = requestAnimationFrame(portalStep);
        return;
      }
      schedulePortalSettle();
    });
  }

  /* A clone is placed from a measurement, so a layout pass that lands after
     the burst has ended leaves it stranded in empty space — the charm keeps
     the coordinates its card had before the row moved. Callers that move the
     roster say so themselves (refreshPortals); this single deferred pass is
     the net for the ones that cannot, such as an image decoding late. */
  function schedulePortalSettle() {
    if (portalSettleTimer || !portalMap.size) return;
    portalSettleTimer = setTimeout(function() {
      portalSettleTimer = 0;
      if (!document.hidden && portalMap.size) syncAddonPortals();
    }, 260);
  }

  function handlePortalScroll() {
    scheduleAddonPortals(32);
  }

  function syncSectionClearance(skipMoodLayout) {
    sectionFrame = 0;
    var list = document.querySelector('#grafiks-list.grid-view');
    if (!list) return;
    var sections = Array.prototype.slice.call(list.querySelectorAll(':scope > .cards-section'));
    var header = document.getElementById('minkaBarWrap');
    var headerRect = header ? header.getBoundingClientRect() : null;
    var listTop = list.getBoundingClientRect().top;
    /* Read every rectangle first, then update styles. Keeping these phases
       separate avoids a forced page layout for each decorated section. */
    var plans = sections.map(function(section, sectionIndex) {
      var style = getComputedStyle(section);
      var current = parseFloat(style.getPropertyValue('--mk-addon-section-top-clearance')) || 0;
      var label = section.querySelector(':scope > .cards-section-label');
      var toppers = Array.prototype.slice.call(section.querySelectorAll(
        ':scope > .cards-subgrid > .card > .mk-card-addon[data-addon-group="topper"]'
      ));
      var desired = 0;
      if (toppers.length) {
        var labelRect = label ? label.getBoundingClientRect() : null;
        var requiredTop = labelRect && labelRect.height
          ? labelRect.bottom
          : (headerRect ? headerRect.bottom : listTop);
        var minTop = Math.min.apply(null, toppers.map(function(topper) {
          return topper.getBoundingClientRect().top;
        }));
        desired = Math.ceil(current + requiredTop - minTop + 8);
        desired = Math.max(0, Math.min(desired, 220));
      }
      var bottomClearance = 0;
      if (sectionIndex === sections.length - 1) {
        var charms = Array.prototype.slice.call(section.querySelectorAll(
          ':scope > .cards-subgrid > .card > .mk-card-addon[data-addon-group="charm"]'
        ));
        charms.forEach(function(charm) {
          var card = charm.parentElement;
          if (!card) return;
          bottomClearance = Math.max(bottomClearance,
            Math.ceil(charm.offsetTop + charm.offsetHeight - card.clientHeight + 10));
        });
        bottomClearance = Math.max(0, Math.min(bottomClearance, 150));
      }
      return {
        section: section,
        current: current,
        desired: desired,
        bottomClearance: bottomClearance
      };
    });
    var sectionGeometryChanged = false;
    plans.forEach(function(plan) {
      var section = plan.section;
      if (Math.abs(plan.current - plan.desired) >= 1) {
        if (plan.desired) section.style.setProperty('--mk-addon-section-top-clearance', plan.desired + 'px');
        else section.style.removeProperty('--mk-addon-section-top-clearance');
        sectionGeometryChanged = true;
      }
      if (plan.bottomClearance) {
        section.style.setProperty('--mk-addon-section-bottom-clearance', plan.bottomClearance + 'px');
      } else {
        section.style.removeProperty('--mk-addon-section-bottom-clearance');
      }
      // Each role heading belongs to its own section and must remain in normal
      // flow. Pulling it up by all previous topper clearances made the second
      // heading overlap the upper row (or disappear behind a topper) on wide
      // Windows layouts.
      section.style.removeProperty('--mk-addon-label-pullup');
    });
    list.style.removeProperty('--mk-addon-list-bottom-clearance');
    scheduleTopperClearance();
    scheduleAddonPortals(80);
    if (!skipMoodLayout && sectionGeometryChanged && typeof window.__minkaScheduleMoodSectionLayout === 'function') {
      window.__minkaScheduleMoodSectionLayout();
    }
  }

  function scheduleSectionClearance() {
    if (sectionFrame) return;
    sectionFrame = requestAnimationFrame(syncSectionClearance);
  }

  function scanCards() {
    scanFrame = 0;
    observeCardRoots();
    var all = readAll();
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function(card) {
      applyToCard(card, all[normName(card.getAttribute('data-worker'))] || null);
    });
    scheduleSectionClearance();
    scheduleTopperClearance();
    scheduleAddonPortals(80);
  }

  function scheduleScan() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(scanCards);
  }

  function applyRosterNow() {
    var all = readAll();
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function(card) {
      applyToCard(card, all[normName(card.getAttribute('data-worker'))] || null);
    });
    syncSectionClearance(true);
  }

  function nodeTouchesCards(node) {
    if (!node || node.nodeType !== 1 || !node.matches) return false;
    return node.matches(CARD_SELECTOR + ', .mk-card-addon')
      || !!node.querySelector(CARD_SELECTOR + ', .mk-card-addon');
  }

  function handleCardMutations(mutations) {
    for (var i = 0; i < mutations.length; i += 1) {
      var mutation = mutations[i];
      if (mutation.type === 'childList') {
        var changed = Array.prototype.some.call(mutation.addedNodes, nodeTouchesCards)
          || Array.prototype.some.call(mutation.removedNodes, nodeTouchesCards);
        if (changed) { scheduleScan(); return; }
        continue;
      }
      var target = mutation.target;
      if (!target || !target.matches || !target.matches(CARD_SELECTOR)) continue;
      if (mutation.attributeName === 'data-worker') { scheduleScan(); return; }
      if (mutation.attributeName === 'class'
        && target.querySelector(':scope > .mk-card-addon')
        && !target.classList.contains('mk-addon-active')) {
        scheduleScan();
        return;
      }
    }
  }

  function observeCardRoots() {
    ['#grafiks-list'].forEach(function(selector) {
      var root = document.querySelector(selector);
      if (!root || observedRoots.has(root)) return;
      observedRoots.add(root);
      new MutationObserver(handleCardMutations).observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-worker']
      });
    });
  }

  function enhancePicker(host) {
    if (!host || host.querySelector('[data-skin-section="addons"]')) return;
    var tabs = host.querySelector('.mk-skin-main-tabs');
    var editor = host.querySelector('.mk-skin-editor');
    var preview = host.querySelector('.mk-skin-preview-real');
    if (!tabs || !editor) return;
    var name = currentWorkerName();
    // Slots: up to three decorations; the panel edits one of them (config) at a time.
    function emptySlot(side) { return { id: '', scale: 1, side: side || 'right', x: 0, y: 0 }; }
    var slots = getList(name);
    if (!slots.length) slots = [emptySlot()];
    var activeSlot = 0;
    var config = slots[0];
    // Open on the chosen decoration's own group, not on whatever was browsed last.
    if (config.id && ITEM_BY_ID[config.id]) activeGroup = ITEM_BY_ID[config.id].group;
    function saveSlots(options) {
      slots[activeSlot] = config;
      saveList(name, slots.filter(function(c) { return c && c.id; }), options);
    }
    var previewSlot = preview && preview.closest('.mk-skin-preview-slot');

    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'mk-skin-main-tab';
    tab.dataset.skinSection = 'addons';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = 'Dekori';
    tabs.appendChild(tab);

    var panel = document.createElement('section');
    panel.className = 'mk-skin-section mk-addon-section';
    panel.dataset.skinPanel = 'addons';
    var groupsHtml = GROUPS.map(function(group) {
      var count = ITEMS.filter(function(item) { return item.group === group.id && !item.hidden; }).length;
      return '<button type="button" class="mk-addon-group' + (activeGroup === group.id ? ' is-active' : '')
        + '" data-addon-group="' + group.id + '">' + esc(group.label) + '<span>' + count + '</span></button>';
    }).join('');
    panel.innerHTML = '<div class="mk-skin-section-head mk-addon-section-head"><span><strong>Kartītes dekors</strong><small>Līdz 3 dekoriem vienlaikus</small></span><button type="button" class="mk-addon-remove" aria-label="Noņemt izvēlēto dekoru">✕ Noņemt dekoru</button></div>'
      + '<div class="mk-addon-drag-hint">Cita veida dekors nāk klāt (līdz 3), tā paša veida aizstāj izvēlēto. Kartītē velc jebkuru.</div>'
      + '<div class="mk-addon-slots" role="group" aria-label="Dekori uz kartītes"></div>'
      + '<div class="mk-addon-groups">' + groupsHtml + '</div>'
      + '<div class="mk-addon-grid"></div>'
      + '<div class="mk-addon-controls">'
      + '<label><span>Izmērs</span><input class="mk-addon-scale" type="range" min="60" max="140" step="5" value="' + Math.round((Number(config.scale) || 1) * 100) + '"><b class="mk-addon-scale-value">' + Math.round((Number(config.scale) || 1) * 100) + '%</b></label>'
      + '<div class="mk-addon-side" role="group" aria-label="Dekora puse"><button type="button" data-addon-side="left" class="' + (config.side === 'left' ? 'is-active' : '') + '">Kreisā</button><button type="button" data-addon-side="right" class="' + (config.side !== 'left' ? 'is-active' : '') + '">Labā</button></div>'
      + '<button type="button" class="mk-addon-reset-position">↺ Pozīcija</button>'
      + '</div>'
      + '<div class="mk-addon-coffee" hidden><span>Kafijas skaitlis</span><div class="mk-addon-coffee-stats" role="group" aria-label="Kafijas skaitlis">'
      + COFFEE_STATS.map(function(st) { return '<button type="button" data-coffee-stat="' + st[0] + '">' + esc(st[1]) + '</button>'; }).join('') + '</div></div>'
      + '<div class="mk-addon-look">'
      + '<div class="mk-addon-look-label">Dekora efekts</div>'
      + '<div class="mk-addon-fx" role="group" aria-label="Dekora efekts">' + DECOR_FX.map(function(f) { return '<button type="button" data-decor-fx="' + f[0] + '">' + esc(f[1]) + '</button>'; }).join('') + '</div>'
      + '<div class="mk-addon-tune">'
      + '<label><span>Smalkums</span><input type="range" min="0" max="9" step="1" value="5" data-decor-tune="b" aria-label="Dekora smalkums"><output>5</output></label>'
      + '<label><span>Kontrasts</span><input type="range" min="0" max="9" step="1" value="5" data-decor-tune="c" aria-label="Dekora kontrasts"><output>5</output></label>'
      + '</div>'
      + '<div class="mk-addon-inks" role="group" aria-label="Dekora krāsa"><span>Dekora krāsa</span>'
      + '<button type="button" class="mk-addon-ink-auto" data-decor-ink="">Kā kartītei</button>'
      + DECOR_INKS.map(function(c) { return '<button type="button" data-decor-ink="' + c[0] + '" style="--ink:#' + c[0] + '" title="' + c[1] + '" aria-label="' + c[1] + '"></button>'; }).join('')
      + '</div></div>';
    editor.appendChild(panel);

    function syncPreviewClearance() {
      if (!previewSlot || !preview) return;
      if (window.MinkaCardFaces && window.MinkaCardFaces.refreshPreview) window.MinkaCardFaces.refreshPreview();
      var addons = preview.querySelectorAll(':scope > .mk-card-addon');
      var addon = addons[0];
      if (!addon) {
        previewSlot.style.removeProperty('--mk-addon-preview-top-clearance');
        previewSlot.style.removeProperty('--mk-addon-preview-bottom-clearance');
        return;
      }
      var cardRect = preview.getBoundingClientRect();
      var addonRect = { top: Infinity, bottom: -Infinity, width: 0, height: 0 };
      addons.forEach(function(img) { var r = img.getBoundingClientRect(); if (!r.width || !r.height) return; addonRect.top = Math.min(addonRect.top, r.top); addonRect.bottom = Math.max(addonRect.bottom, r.bottom); addonRect.width = 1; addonRect.height = 1; });
      if (!addonRect.width || !addonRect.height) return;
      var topOverflow = Math.max(0, cardRect.top - addonRect.top);
      var bottomOverflow = Math.max(0, addonRect.bottom - cardRect.bottom);
      previewSlot.style.setProperty('--mk-addon-preview-top-clearance', Math.ceil(topOverflow + (topOverflow ? 12 : 0)) + 'px');
      previewSlot.style.setProperty('--mk-addon-preview-bottom-clearance', Math.ceil(bottomOverflow + (bottomOverflow ? 12 : 0)) + 'px');
      requestAnimationFrame(function() {
        var view = preview.closest('#modal-skin-view');
        var scroller = view && view.parentElement;
        if (!scroller) return;
        var freshAddonRect = (preview.querySelector(':scope > .mk-card-addon[data-slot="' + activeSlot + '"]') || addon).getBoundingClientRect();
        var scrollerRect = scroller.getBoundingClientRect();
        if (freshAddonRect.top < scrollerRect.top + 10) {
          scroller.scrollTop = Math.max(0, scroller.scrollTop - (scrollerRect.top + 10 - freshAddonRect.top));
        } else if (freshAddonRect.bottom > scrollerRect.bottom - 10) {
          scroller.scrollTop += freshAddonRect.bottom - (scrollerRect.bottom - 10);
        }
      });
    }

    function applyPreview() {
      if (preview) applyToCard(preview, slots.filter(function(c) { return c && c.id; }));
      var previewAddons = preview ? preview.querySelectorAll(':scope > .mk-card-addon') : [];
      if (previewSlot) previewSlot.classList.toggle('mk-has-addon', !!previewAddons.length);
      syncPreviewClearance();
      previewAddons.forEach(function(previewAddon) {
        if (!previewAddon.complete) previewAddon.addEventListener('load', syncPreviewClearance, { once: true });
        if (previewAddon.dataset.dragBound === '1') return;
        previewAddon.dataset.dragBound = '1';
        previewAddon.addEventListener('pointerdown', function(event) {
          if (event.button !== 0 || previewAddon.classList.contains('is-dragging')) return;
          // Grabbing a decoration also chooses it for the settings below.
          var slot = +previewAddon.dataset.slot || 0;
          if (slot !== activeSlot && slots[slot]) selectSlot(slot);
          if (!config || !config.id) return;
          event.preventDefault();
          event.stopPropagation();
          var startX = event.clientX;
          var startY = event.clientY;
          var baseX = Number(config.x) || 0;
          var baseY = Number(config.y) || 0;
          var rect = preview.getBoundingClientRect();
          var width = preview.clientWidth, height = preview.clientHeight;
          var visibleWidth = width * rect.width / preview.offsetWidth;
          var visibleHeight = height * rect.height / preview.offsetHeight;
          if (!visibleWidth || !visibleHeight) return;
          previewAddon.classList.add('is-dragging');
          previewAddon.setPointerCapture(event.pointerId);
          function move(moveEvent) {
            if (moveEvent.pointerId !== event.pointerId) return;
            var position = addonDragPosition(baseX, baseY, moveEvent.clientX - startX, moveEvent.clientY - startY, visibleWidth, visibleHeight);
            config.x = position.x; config.y = position.y;
            // Store the live position too: a queued geometry refresh must not
            // restore the starting coordinates in the middle of a drag.
            previewAddon.dataset.addonX = String(config.x);
            previewAddon.dataset.addonY = String(config.y);
            writeAddonGeometry(previewAddon, width, height);
          }
          function finish(endEvent) {
            if (endEvent.pointerId !== event.pointerId) return;
            if (endEvent.type === 'pointerup') move(endEvent);
            if (endEvent.type === 'pointercancel') { config.x = baseX; config.y = baseY; }
            previewAddon.classList.remove('is-dragging');
            previewAddon.removeEventListener('pointermove', move);
            previewAddon.removeEventListener('pointerup', finish);
            previewAddon.removeEventListener('pointercancel', finish);
            previewAddon.removeEventListener('lostpointercapture', finish);
            if (previewAddon.hasPointerCapture(event.pointerId)) previewAddon.releasePointerCapture(event.pointerId);
            saveSlots();
            applyPreview();
          }
          previewAddon.addEventListener('pointermove', move);
          previewAddon.addEventListener('pointerup', finish);
          previewAddon.addEventListener('pointercancel', finish);
          previewAddon.addEventListener('lostpointercapture', finish);
        });
      });
      renderSlots();
    }

    /* The slot row: one tile per decoration on the card (its picture), the chosen
       one highlighted, and "+" while there is room for another. */
    function renderSlots() {
      var bar = panel.querySelector('.mk-addon-slots');
      if (!bar) return;
      var html = slots.map(function(c, i) {
        var item = c && ITEM_BY_ID[c.id];
        return '<button type="button" data-slot="' + i + '" aria-pressed="' + (i === activeSlot) + '" title="' + esc(item ? item.label : 'Izvēlies dekoru') + '">'
          + (item ? '<img src="' + esc(assetUrl(item, null)) + '" alt="">' : '<i>?</i>') + '<b>' + (i + 1) + '</b></button>';
      }).join('');
      if (slots.length < MAX_ADDONS && slots[slots.length - 1] && slots[slots.length - 1].id) html += '<button type="button" class="mk-addon-slot-add" data-slot-add="1">+ Dekors</button>';
      if (bar.__html !== html) { bar.innerHTML = html; bar.__html = html; }
    }
    /* A decoration that joins others finds its own free spot along the card's edge:
       a few candidate places are tried on the preview (edit time only) and the one
       that covers the fewest other decorations and card elements wins. */
    function autoPlace() {
      var slot = activeSlot, item = ITEM_BY_ID[config.id];
      var img = preview && preview.querySelector(':scope > .mk-card-addon[data-slot="' + slot + '"]');
      if (!img || !item || item.group === 'frame' || item.group === 'light') return;
      function run() {
        if (!img.isConnected || slots[slot] !== config) return;
        var W = preview.clientWidth, H = preview.clientHeight;
        function area(a, b) { var w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? w * h : 0; }
        var others = Array.prototype.filter.call(preview.querySelectorAll(':scope > .mk-card-addon'), function(o) { return o !== img; }).map(function(o) { return o.getBoundingClientRect(); });
        var parts = Array.prototype.filter.call(preview.querySelectorAll('[data-wf-part]'), function(el) { return !el.hidden && el.getClientRects().length; }).map(function(el) { return el.getBoundingClientRect(); });
        var card = preview.getBoundingClientRect();
        var tries = [['right', 0, 0], ['left', 0, 0], ['right', 0, 30], ['left', 0, 30], ['right', 0, 60], ['left', 0, 60], ['right', -32, 0], ['left', 32, 0]];
        var best = null;
        tries.forEach(function(t, i) {
          img.dataset.addonSide = t[0]; img.dataset.addonX = String(t[1]); img.dataset.addonY = String(t[2]);
          writeAddonGeometry(img, W, H);
          var r = img.getBoundingClientRect(), score = 0;
          others.forEach(function(o) { score += area(r, o) * 3; });
          parts.forEach(function(p) { score += area(r, p); });
          // Mostly off the card is not a spot either.
          var inside = area(r, card), total = r.width * r.height || 1;
          if (inside / total < .35) score += total;
          score += i * 4;   // prefer the familiar spots on a tie
          if (!best || score < best.score) best = { score: score, t: t };
        });
        config.side = best.t[0]; config.x = best.t[1]; config.y = best.t[2];
        slots[slot] = config;
        saveSlots(); syncControls(); applyPreview();
      }
      if (img.complete && img.naturalWidth) requestAnimationFrame(run); else img.addEventListener('load', function() { requestAnimationFrame(run); }, { once: true });
    }
    function syncControls() {
      var sc = panel.querySelector('.mk-addon-scale'), v = Math.round((Number(config.scale) || 1) * 100);
      sc.value = v; panel.querySelector('.mk-addon-scale-value').textContent = v + '%';
      panel.querySelectorAll('[data-addon-side]').forEach(function(b) { b.classList.toggle('is-active', b.dataset.addonSide === (config.side === 'left' ? 'left' : 'right')); });
    }
    function selectSlot(i) {
      activeSlot = i; config = slots[i];
      var item = config && ITEM_BY_ID[config.id];
      if (item) {
        activeGroup = item.group;
        panel.querySelectorAll('.mk-addon-group').forEach(function(b) { b.classList.toggle('is-active', b.dataset.addonGroup === activeGroup); });
      }
      syncControls(); renderGrid(); renderSlots();
    }
    panel.addEventListener('click', function(e) {
      var b = e.target.closest && e.target.closest('.mk-addon-slots button');
      if (!b) return;
      if (b.dataset.slotAdd) {
        // A new decoration starts on the other side, so it does not land on the first one.
        var used = slots.filter(function(c) { return c.id; }).map(function(c) { return c.side; });
        slots.push(emptySlot(used.indexOf('right') >= 0 && used.indexOf('left') < 0 ? 'left' : 'right'));
        selectSlot(slots.length - 1);
        return;
      }
      selectSlot(+b.dataset.slot);
    });

    function renderGrid() {
      var grid = panel.querySelector('.mk-addon-grid');
      var removeButton = panel.querySelector('.mk-addon-remove');
      removeButton.disabled = !(config && config.id);
      removeButton.setAttribute('aria-disabled', String(removeButton.disabled));
      syncLook();
      var chosen = config && ITEM_BY_ID[config.id], chosenBase = chosen ? (chosen.base || chosen.id) : '';
      grid.innerHTML = ITEMS.filter(function(item) { return item.group === activeGroup && !item.hidden; }).map(function(item) {
        var selected = chosenBase === item.id;
        return '<button type="button" class="mk-addon-choice' + (selected ? ' is-active' : '') + '" data-addon-id="' + esc(item.id) + '" aria-label="' + esc(item.label) + '" aria-pressed="' + selected + '" title="' + esc(item.label) + '">'
          + '<span><img loading="lazy" decoding="async" draggable="false" src="' + esc(assetUrl(item, null)) + '" alt=""></span><b>' + esc(item.label) + '</b></button>';
      }).join('');
      grid.querySelectorAll('.mk-addon-choice').forEach(function(button) {
        var thumb = button.querySelector('img');
        function markReady() {
          button.classList.toggle('is-ready', !!thumb.naturalWidth);
          button.classList.toggle('is-error', thumb.complete && !thumb.naturalWidth);
        }
        thumb.addEventListener('load', markReady);
        thumb.addEventListener('error', function() {
          if (thumb.dataset.retried === '1') { markReady(); return; }
          thumb.dataset.retried = '1';
          if (ITEM_BY_ID[button.dataset.addonId].dynamic) { markReady(); return; }
          thumb.src = assetUrl(ITEM_BY_ID[button.dataset.addonId]) + '&retry=1';
        });
        if (thumb.complete) markReady();
        button.addEventListener('click', function() {
          var pickedId = button.dataset.addonId, prevItem = ITEM_BY_ID[config.id];
          /* A different kind than the chosen decoration (coffee while an object is
             chosen) goes on the card next to it, while there is room; the same kind
             swaps the chosen one. */
          var added = false, sameKind = prevItem && ITEM_BY_ID[pickedId].group === prevItem.group;
          if (!config.id && slots.filter(function(c) { return c && c.id; }).length) added = true;   // a "+ Dekors" slot
          if (prevItem && !sameKind && slots.filter(function(c) { return c && c.id; }).length < MAX_ADDONS) {
            added = true;
            var usedSides = slots.filter(function(c) { return c.id; }).map(function(c) { return c.side; });
            slots.push(emptySlot(usedSides.indexOf('right') >= 0 && usedSides.indexOf('left') < 0 ? 'left' : 'right'));
            activeSlot = slots.length - 1; config = slots[activeSlot]; prevItem = null;
          }
          // Another decoration keeps the chosen effect and colour (a coffee sticker its number).
          if (ITEM_BY_ID[pickedId].dynamic && prevItem && prevItem.dynamic && prevItem.stat) pickedId += '-' + prevItem.stat;
          // A picture effect carries over between cut-outs; graphics (coffee, frames,
          // light, labels) start plain — a dither of them on a dark card hid them.
          var plain = plainItem(ITEM_BY_ID[pickedId]) || plainItem(prevItem);
          // The same kind takes the old one's place; anything else starts at its default spot.
          config = { id: pickedId, scale: Number(config.scale) || 1, side: config.side === 'left' ? 'left' : 'right', x: sameKind ? Number(config.x) || 0 : 0, y: sameKind ? Number(config.y) || 0 : 0,
            fx: plain ? (plainItem(ITEM_BY_ID[pickedId]) ? 'none' : undefined) : config.fx, tune: plain ? undefined : config.tune, color: plain ? undefined : config.color };
          saveSlots();
          syncControls();
          renderGrid();
          applyPreview();
          if (added) autoPlace();
        });
      });
    }

    tab.addEventListener('click', function() {
      host.querySelectorAll('.mk-skin-main-tab').forEach(function(item) {
        var selected = item === tab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      host.querySelectorAll('[data-skin-panel]').forEach(function(section) {
        section.classList.toggle('is-active', section === panel);
      });
      applyPreview();
    });

    panel.querySelectorAll('.mk-addon-group').forEach(function(button) {
      button.addEventListener('click', function() {
        activeGroup = button.dataset.addonGroup;
        panel.querySelectorAll('.mk-addon-group').forEach(function(item) {
          item.classList.toggle('is-active', item === button);
        });
        renderGrid();
      });
    });

    // Effect and colour of the decoration itself. Unset effect = the card's
    // "Efekts arī dekoram" switch (fxs integer part 2) decides, as before.
    function followsCard() {
      var tune = preview ? parseFloat(preview.style.getPropertyValue('--mk-fx-scale')) : NaN;
      return isFinite(tune) && Math.floor(tune + 1e-6) >= 2;
    }
    function syncLook() {
      var look = panel.querySelector('.mk-addon-look');
      if (!look) return;
      look.hidden = !(config && config.id);
      var item = config && ITEM_BY_ID[config.id], coffee = panel.querySelector('.mk-addon-coffee');
      coffee.hidden = !(item && item.dynamic);
      if (item && item.dynamic) coffee.querySelectorAll('[data-coffee-stat]').forEach(function(b) { b.setAttribute('aria-pressed', String(b.dataset.coffeeStat === item.stat)); });
      // Frames and light cover the whole card: left / right means nothing there.
      panel.querySelector('.mk-addon-side').hidden = !!item && (item.group === 'frame' || item.group === 'light');
      var fx = config.fx || (followsCard() ? 'card' : 'none');
      look.querySelectorAll('[data-decor-fx]').forEach(function(b) { b.setAttribute('aria-pressed', String(b.dataset.decorFx === fx)); });
      look.querySelectorAll('[data-decor-ink]').forEach(function(b) { b.setAttribute('aria-pressed', String(b.dataset.decorInk === (config.color || ''))); });
      look.querySelector('.mk-addon-inks').hidden = fx === 'none' || fx === 'focus';   // the lens has its own colours
      // Tuning belongs to the decoration's own effect ("Kā kartītei" uses the card's).
      var tuneBox = look.querySelector('.mk-addon-tune'), t = /^\d\d$/.test(config.tune || '') ? config.tune : '55';
      tuneBox.hidden = fx === 'none' || fx === 'card';
      tuneBox.querySelectorAll('[data-decor-tune]').forEach(function(r, i) { r.value = t[i]; r.nextElementSibling.textContent = t[i]; });
    }
    // While a slider moves only the preview is redrawn (after a short rest);
    // the saved decoration (all cards, cloud) follows on release.
    var tuneTimer = 0;
    function readTune() {
      var r = panel.querySelectorAll('[data-decor-tune]');
      var t = r[0].value + r[1].value;
      if (t === '55') delete config.tune; else config.tune = t;
    }
    panel.querySelectorAll('[data-decor-tune]').forEach(function(r) {
      r.addEventListener('input', function() {
        r.nextElementSibling.textContent = r.value;
        if (!config.id) return;
        readTune(); clearTimeout(tuneTimer);
        tuneTimer = setTimeout(function() { slots[activeSlot] = config; if (preview) applyToCard(preview, slots.filter(function(c) { return c && c.id; })); }, 160);
      });
      r.addEventListener('change', function() {
        clearTimeout(tuneTimer);
        if (!config.id) return;
        readTune(); saveSlots(); applyPreview();
      });
    });
    panel.querySelectorAll('[data-decor-fx]').forEach(function(button) {
      button.addEventListener('click', function() {
        if (!config.id) return;
        config.fx = button.dataset.decorFx;
        saveSlots(); syncLook(); applyPreview();
      });
    });
    panel.querySelectorAll('[data-decor-ink]').forEach(function(button) {
      button.addEventListener('click', function() {
        if (!config.id) return;
        if (button.dataset.decorInk) config.color = button.dataset.decorInk; else delete config.color;
        saveSlots(); syncLook(); applyPreview();
      });
    });

    panel.querySelectorAll('[data-coffee-stat]').forEach(function(button) {
      button.addEventListener('click', function() {
        var item = ITEM_BY_ID[config.id];
        if (!item || !item.dynamic) return;
        config.id = item.base + (button.dataset.coffeeStat ? '-' + button.dataset.coffeeStat : '');
        saveSlots(); syncLook(); applyPreview();
      });
    });

    // Removes the chosen decoration only; the others stay.
    panel.querySelector('.mk-addon-remove').addEventListener('click', function() {
      slots.splice(activeSlot, 1);
      if (!slots.length) slots = [emptySlot()];
      activeSlot = Math.min(activeSlot, slots.length - 1); config = slots[activeSlot];
      saveList(name, slots.filter(function(c) { return c && c.id; }));
      syncControls();
      renderGrid();
      applyPreview();
    });

    var scale = panel.querySelector('.mk-addon-scale');
    var scaleValue = panel.querySelector('.mk-addon-scale-value');
    // While dragging only the preview follows; the save (all cards, cloud) on release.
    scale.addEventListener('input', function() {
      config.scale = Number(scale.value) / 100;
      scaleValue.textContent = scale.value + '%';
      slots[activeSlot] = config;
      if (config.id) applyPreview();
    });
    scale.addEventListener('change', function() {
      if (config.id) { saveSlots(); applyPreview(); }
    });

    panel.querySelectorAll('[data-addon-side]').forEach(function(button) {
      button.addEventListener('click', function() {
        config.side = button.dataset.addonSide;
        panel.querySelectorAll('[data-addon-side]').forEach(function(item) { item.classList.toggle('is-active', item === button); });
        if (config.id) { saveSlots(); applyPreview(); }
      });
    });

    panel.querySelector('.mk-addon-reset-position').addEventListener('click', function() {
      config.x = 0;
      config.y = 0;
      if (config.id) { saveSlots(); applyPreview(); }
    });

    renderGrid();
    applyPreview();
  }

  function installPickerHook() {
    if (typeof window.mkRenderSkinPicker !== 'function' || window.mkRenderSkinPicker.__addonsWrapped) return false;
    var original = window.mkRenderSkinPicker;
    var wrapped = function(host) {
      original(host);
      enhancePicker(host);
    };
    wrapped.__addonsWrapped = true;
    window.mkRenderSkinPicker = wrapped;
    return true;
  }

  function installSkinHook() {
    if (typeof window.mkApplySkinToEl !== 'function' || window.mkApplySkinToEl.__addonsWrapped) return false;
    var original = window.mkApplySkinToEl;
    var wrapped = function(element) {
      var result = original.apply(this, arguments);
      if (element && element.matches && element.matches(CARD_SELECTOR + ', .mk-skin-preview-real')) {
        var surface = element.querySelector(':scope > .mk-card-addon-surface');
        if (surface) syncCardSurface(element, surface, true);
        scheduleAddonPortals(100);
      }
      return result;
    };
    wrapped.__addonsWrapped = true;
    window.mkApplySkinToEl = wrapped;
    return true;
  }

  var hookAttempts = 0;
  function waitForHooks() {
    var pickerReady = installPickerHook() || (window.mkRenderSkinPicker && window.mkRenderSkinPicker.__addonsWrapped);
    var skinReady = installSkinHook() || (window.mkApplySkinToEl && window.mkApplySkinToEl.__addonsWrapped);
    if ((pickerReady && skinReady) || hookAttempts++ > 100) return;
    setTimeout(waitForHooks, 50);
  }

  window.MinkaCardAddons = {
    items: ITEMS.slice(),
    getDecoration: function(name) {
      var config = getConfig(name), item = config && ITEM_BY_ID[config.id];
      return item ? { id: item.id, label: item.label, src: assetUrl(item) } : null;
    },
    applyWorker: applyWorker,
    get: getConfig,
    getList: getList,
    getAll: function() { return readAll(); },
    applyRosterNow: applyRosterNow,
    /* For anything that moves a decorated card without touching the DOM the
       card observer watches — the roster pull-up rewrites grid tracks and a
       section class, neither of which is observed here. */
    refreshPortals: function(duration) {
      scheduleAddonPortals(typeof duration === 'number' ? duration : 160);
    },
    /* Same-frame update for a layout change the caller has just made (the
       host resizing the frame and flipping the card compaction): sizes and
       portal positions are read and written now, so decorations land in the
       same paint as the cards instead of one or two frames later. */
    syncNow: function() {
      if (geometryFrame) { cancelAnimationFrame(geometryFrame); geometryFrame = 0; }
      refreshAddonGeometry();
      if (portalFrame) { cancelAnimationFrame(portalFrame); portalFrame = 0; }
      syncAddonPortals();
      scheduleAddonPortals(160);
    },
    replaceFromCloud: function(value) {
      var clean = {};
      Object.keys(value && typeof value === 'object' ? value : {}).forEach(function(name) {
        var list = toList(value[name]);
        if (list.length) clean[normName(name)] = list;
      });
      writeAll(clean);
      scheduleScan();
    },
    clear: function(name) { saveConfig(name, null); },
    // Remix / Pieskaņot / Atsaukt write the decoration together with the look.
    set: function(name, value, options) { saveList(name, toList(value), options); }
  };

  // A coffee was logged (or synced): redraw the coffee stickers (cards and picker tiles), nothing else.
  function refreshCoffee() {
    document.querySelectorAll('.mk-card-addon[data-addon-group="coffee"]').forEach(function(img) {
      var item = ITEM_BY_ID[img.dataset.addonId], card = img.parentElement;
      if (!item || !card) return;
      var fresh = assetUrl(item, card);
      if (img.getAttribute('src') !== fresh) img.src = fresh;
    });
    document.querySelectorAll('.mk-addon-choice[data-addon-id^="coffee-"] img').forEach(function(img) {
      var item = ITEM_BY_ID[img.closest('.mk-addon-choice').dataset.addonId];
      if (!item) return;
      var fresh = assetUrl(item, null);
      if (img.getAttribute('src') !== fresh) img.src = fresh;
    });
  }
  document.addEventListener('minka:coffee-changed', function() {
    refreshCoffee();
    // An all-time sticker on the page: fetch the new totals (after the save has landed).
    if (document.querySelector('.mk-card-addon[data-addon-id$="-a"]')) setTimeout(function() { loadCoffeeTotals(true); }, 4000);
  });

  waitForHooks();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scanCards, { once: true });
  else scanCards();
  document.addEventListener('minka:monthReady', function() {
    observeCardRoots();
    scheduleScan();
  });
  document.addEventListener('pointerover', function(event) {
    if (event.target && event.target.closest
      && event.target.closest('#grafiks-list .card.mk-addon-group-charm')) {
      scheduleAddonPortals(180);
    }
  }, { passive: true });
  document.addEventListener('pointermove', function(event) {
    if (event.target && event.target.closest
      && event.target.closest('#grafiks-list .card.mk-addon-group-charm')) {
      scheduleAddonPortals(0);
    }
  }, { passive: true });
  document.addEventListener('pointerout', function(event) {
    if (event.target && event.target.closest
      && event.target.closest('#grafiks-list .card.mk-addon-group-charm')) {
      scheduleAddonPortals(180);
    }
  }, { passive: true });
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) scheduleAddonPortals(80);
  });
  window.addEventListener('resize', function() {
    document.querySelectorAll('.mk-card-addon-surface').forEach(function(surface) {
      delete surface.dataset.surfaceSignature;
    });
    scheduleAddonGeometry();
    scheduleTopperClearance();
    // The signatures were just cleared: the scan re-copies each card's
    // background/radius onto its add-on surface (syncCardSurface) and re-runs
    // the section clearance. Dropping it left decorations clipped at the
    // pre-resize radius after the radio changed the card size.
    scheduleScan();
    scheduleAddonPortals(120);
  }, { passive: true });
})();
