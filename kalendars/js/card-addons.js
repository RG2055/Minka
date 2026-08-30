(function MinkaCardAddons() {
  'use strict';

  var STORAGE_KEY = 'mkWorkerCardAddonsV1';
  var CACHE_BUST = '20260831d';
  var activeGroup = 'topper';
  var scanFrame = 0;
  var sectionFrame = 0;

  var GROUPS = [
    { id: 'topper', label: 'Topperi' },
    { id: 'sticker', label: 'Uzlīmes' },
    { id: 'charm', label: 'Piekariņi' },
    { id: 'strip', label: 'Security stripi' },
    { id: 'tape', label: 'Līmlentes' },
    { id: 'object', label: 'Objekti' }
  ];

  function optimized(file) { return 'data/card-addons/optimized/' + file; }

  var ITEMS = [
    { id: 'topper-happy-tabby', label: 'Priecīgais kaķis', group: 'topper', dockY: 5, src: optimized('topper-happy-tabby.webp') },
    { id: 'topper-space-cat', label: 'Kosmosa kaķis', group: 'topper', dockY: 5, src: optimized('topper-space-cat.webp') },
    { id: 'topper-neon-black-cat', label: 'Neona melnais kaķis', group: 'topper', dockY: 5, src: optimized('topper-neon-black-cat.webp') },
    { id: 'topper-flower-white-cat', label: 'Ziedu baltais kaķis', group: 'topper', dockY: 5, src: optimized('topper-flower-white-cat.webp') },
    { id: 'topper-music-orange-cat', label: 'Mūzikas rudais kaķis', group: 'topper', dockY: 6, src: optimized('topper-music-orange-cat.webp') },
    { id: 'topper-medic-tuxedo-cat', label: 'Mediķa kaķis', group: 'topper', dockY: 6, src: optimized('topper-medic-tuxedo-cat.webp') },
    { id: 'topper-night-nurse-cat', label: 'Nakts mediķa kaķis', group: 'topper', dockY: 5, src: optimized('topper-night-nurse-cat.webp') },
    { id: 'topper-cosmic-moon', label: 'Kosmiskais mēness', group: 'topper', dockY: 7, src: optimized('topper-cosmic-moon.webp') },

    { id: 'sticker-good-vibes', label: 'Good Vibes', group: 'sticker', src: optimized('sticker-good-vibes.webp') },
    { id: 'sticker-night-mode', label: 'Night Mode', group: 'sticker', src: optimized('sticker-night-mode.webp') },
    { id: 'sticker-24h-duty', label: '24H Duty', group: 'sticker', src: optimized('sticker-24h-duty.webp') },
    { id: 'sticker-coffee-first', label: 'Coffee First', group: 'sticker', src: optimized('sticker-coffee-first.webp') },
    { id: 'sticker-focus', label: 'Focus', group: 'sticker', src: optimized('sticker-focus.webp') },
    { id: 'sticker-planet', label: 'Planēta', group: 'sticker', src: optimized('sticker-planet.webp') },
    { id: 'sticker-prism', label: 'Kristāls', group: 'sticker', src: optimized('sticker-prism.webp') },
    { id: 'sticker-pink-paw', label: 'Rozā ķepiņa', group: 'sticker', src: optimized('sticker-pink-paw.webp') },

    { id: 'charm-gold-moon', label: 'Zelta mēness', group: 'charm', src: optimized('charm-gold-moon.webp') },
    { id: 'charm-prism-star', label: 'Kristāla zvaigzne', group: 'charm', src: optimized('charm-prism-star.webp') },
    { id: 'charm-coffee', label: 'Kafija', group: 'charm', src: optimized('charm-coffee.webp') },
    { id: 'charm-paw', label: 'Ķepiņa', group: 'charm', src: optimized('charm-paw.webp') },
    { id: 'charm-planet', label: 'Planēta', group: 'charm', src: optimized('charm-planet.webp') },
    { id: 'charm-blue-moon', label: 'Zilais mēness', group: 'charm', src: optimized('charm-blue-moon.webp') },
    { id: 'charm-white-bone', label: 'Baltais kauliņš', group: 'charm', src: optimized('charm-white-bone.webp') },
    { id: 'charm-night-nurse-skull', label: 'Nakts māsiņa', group: 'charm', src: optimized('charm-night-nurse-skull.webp') },
    { id: 'charm-masked-night-skull', label: 'Mediķis maskā', group: 'charm', src: optimized('charm-masked-night-skull.webp') },

    { id: 'strip-night-shift', label: 'Night Shift', group: 'strip', src: optimized('strip-night-shift.webp') },
    { id: 'strip-ct-ramp', label: 'CT Ramp', group: 'strip', src: optimized('strip-ct-ramp.webp') },
    { id: 'strip-nmp', label: 'NMP', group: 'strip', src: optimized('strip-nmp.webp') },
    { id: 'strip-xray-hand', label: 'Rentgena roka', group: 'strip', src: optimized('strip-xray-hand.webp') },
    { id: 'strip-ct-hazard', label: 'CT brīdinājums', group: 'strip', src: optimized('strip-ct-hazard.webp') },

    { id: 'tape-clear', label: 'Caurspīdīga', group: 'tape', src: optimized('tape-clear.webp') },
    { id: 'tape-black', label: 'Melna', group: 'tape', src: optimized('tape-black.webp') },
    { id: 'tape-white', label: 'Balta', group: 'tape', src: optimized('tape-white.webp') },
    { id: 'tape-paper', label: 'Papīra', group: 'tape', src: optimized('tape-paper.webp') },
    { id: 'tape-grid', label: 'Rūtiņu', group: 'tape', src: optimized('tape-grid.webp') },
    { id: 'tape-cream', label: 'Krēmkrāsas', group: 'tape', src: optimized('tape-cream.webp') },
    { id: 'tape-iridescent', label: 'Hologrāfiska', group: 'tape', src: optimized('tape-iridescent.webp') },
    { id: 'tape-gold', label: 'Zelta', group: 'tape', src: optimized('tape-gold.webp') },
    { id: 'tape-on-duty', label: 'On Duty', group: 'tape', src: optimized('tape-on-duty.webp') },
    { id: 'tape-rakus', label: 'Rakus', group: 'tape', src: optimized('tape-rakus.webp') },
    { id: 'tape-holographic', label: 'Holo spīdums', group: 'tape', src: optimized('tape-holographic.webp') },
    { id: 'tape-botanical-leaves', label: 'Eikalipta zaļumi', group: 'tape', src: optimized('tape-botanical-leaves.webp') },

    { id: 'object-david', label: 'Dāvids', group: 'object', src: optimized('object-david.webp') },
    { id: 'object-floral-statue', label: 'Ziedu statuja', group: 'object', src: optimized('object-floral-statue.webp') },
    { id: 'object-glitch-statue', label: 'Neona statuja', group: 'object', src: optimized('object-glitch-statue.webp') },
    { id: 'object-crystal-cat', label: 'Kristāla kaķis', group: 'object', src: optimized('object-crystal-cat.webp') },
    { id: 'object-snake', label: 'Baltā čūska', group: 'object', src: optimized('object-snake.webp') },
    { id: 'object-lilies', label: 'Lilijas', group: 'object', src: optimized('object-lilies.webp') },
    { id: 'object-astronaut', label: 'Mēness astronauts', group: 'object', src: optimized('object-astronaut.webp') },
    { id: 'object-floral-skull', label: 'Ziedu galvaskauss', group: 'object', src: optimized('object-floral-skull.webp') },
    { id: 'object-owl', label: 'Baltā pūce', group: 'object', src: optimized('object-owl.webp') },
    { id: 'object-radiology-cat', label: 'Radioloģijas kaķis', group: 'object', src: optimized('object-radiology-cat.webp') },
    { id: 'object-new-floral-statue', label: 'Liliju statuja', group: 'object', src: optimized('object-new-floral-statue.webp') },
    { id: 'object-skeleton-peace', label: 'Skeleta miera zīme', group: 'object', src: optimized('object-skeleton-peace.webp') }
  ];

  var ITEM_BY_ID = Object.create(null);
  ITEMS.forEach(function(item) { ITEM_BY_ID[item.id] = item; });

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normName(value) { return String(value || '').trim().toUpperCase(); }

  function readAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (_error) { return {}; }
  }

  function writeAll(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
    catch (_error) {}
  }

  function currentWorkerName() {
    var first = (document.getElementById('modal-firstname') || {}).innerText || '';
    var last = (document.getElementById('modal-surname') || {}).innerText || '';
    return (first + ' ' + last).replace(/--/g, '').trim();
  }

  function getConfig(name) { return readAll()[normName(name)] || null; }

  function normalizeConfig(config) {
    if (!config || !ITEM_BY_ID[config.id]) return null;
    return {
      id: config.id,
      scale: Math.round(Math.max(.6, Math.min(1.4, Number(config.scale) || 1)) * 100) / 100,
      side: config.side === 'left' ? 'left' : 'right',
      x: Math.round(Math.max(-100, Math.min(100, Number(config.x) || 0)) * 100) / 100,
      y: Math.round(Math.max(-100, Math.min(100, Number(config.y) || 0)) * 100) / 100
    };
  }

  function saveConfig(name, config, options) {
    var all = readAll();
    var key = normName(name);
    var clean = normalizeConfig(config);
    if (clean) all[key] = clean;
    else delete all[key];
    writeAll(all);
    applyWorker(name);
    if (!(options && options.skipCloud) && typeof window.mkSyncWorkerAppearance === 'function') {
      window.mkSyncWorkerAppearance(name, true);
    }
  }

  function assetUrl(item) {
    try { return new URL(item.src + '?v=' + CACHE_BUST, document.baseURI).href; }
    catch (_error) { return item.src + '?v=' + CACHE_BUST; }
  }

  function syncCardSurface(card, surface) {
    var wasActive = card.classList.contains('mk-addon-active');
    if (wasActive) card.classList.remove('mk-addon-active');
    var style = getComputedStyle(card);
    card.style.setProperty('--mk-addon-card-radius', style.borderRadius);
    surface.style.setProperty('background', style.background, 'important');
    surface.style.setProperty('background-blend-mode', style.backgroundBlendMode, 'important');
    surface.style.setProperty('box-shadow', style.boxShadow, 'important');
    surface.style.setProperty('border-radius', style.borderRadius, 'important');
    surface.style.setProperty('clip-path', 'inset(0 round ' + style.borderRadius + ')', 'important');
    if (wasActive) card.classList.add('mk-addon-active');
  }

  function applyToCard(card, config) {
    var existing = card.querySelector(':scope > .mk-card-addon');
    var surface = card.querySelector(':scope > .mk-card-addon-surface');
    if (!config || !ITEM_BY_ID[config.id]) {
      if (existing) existing.remove();
      if (surface) surface.remove();
      card.classList.remove('mk-addon-active');
      card.style.removeProperty('--mk-addon-card-radius');
      return;
    }
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
      existing.style.setProperty('--mk-addon-offset-x', (offsetX * card.clientWidth / 100) + 'px');
      existing.style.setProperty('--mk-addon-offset-y', (offsetY * card.clientHeight / 100) + 'px');
      existing.style.setProperty('--mk-addon-dock-y', (Number(item.dockY) || 3) + 'px');
      if (surface) syncCardSurface(card, surface);
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
    image.setAttribute('aria-hidden', 'true');
    image.dataset.addonId = item.id;
    image.dataset.addonGroup = item.group;
    image.dataset.addonSide = side;
    image.dataset.addonScale = String(scale);
    image.dataset.addonX = String(offsetX);
    image.dataset.addonY = String(offsetY);
    image.style.setProperty('--mk-addon-scale', scale);
    image.style.setProperty('--mk-addon-dock-y', (Number(item.dockY) || 3) + 'px');
    image.style.setProperty('--mk-addon-offset-x', (offsetX * card.clientWidth / 100) + 'px');
    image.style.setProperty('--mk-addon-offset-y', (offsetY * card.clientHeight / 100) + 'px');
    image.addEventListener('load', scheduleSectionClearance, { once: true });
    image.src = assetUrl(item);
    card.classList.add('mk-addon-active');
    card.appendChild(image);
  }

  function applyWorker(name) {
    var key = normName(name);
    var config = getConfig(name);
    document.querySelectorAll('#grafiks-list .card[data-worker], #nsPanel .nsc-full-card[data-worker], #nsPanel .ns-room-bed[data-worker]').forEach(function(card) {
      if (normName(card.getAttribute('data-worker')) === key) applyToCard(card, config);
    });
    scheduleSectionClearance();
  }

  function syncSectionClearance() {
    sectionFrame = 0;
    document.querySelectorAll('#grafiks-list.grid-view .cards-section').forEach(function(section) {
      var maxTopOverflow = 0;
      section.querySelectorAll('.cards-subgrid > .card.mk-addon-active').forEach(function(card) {
        var addon = card.querySelector(':scope > .mk-card-addon[data-addon-group="topper"]');
        if (!addon) return;
        var cardRect = card.getBoundingClientRect();
        var addonRect = addon.getBoundingClientRect();
        maxTopOverflow = Math.max(maxTopOverflow, cardRect.top - addonRect.top);
      });
      if (maxTopOverflow > 0) {
        section.style.setProperty('--mk-addon-section-top-clearance', Math.ceil(maxTopOverflow + 12) + 'px');
      } else {
        section.style.removeProperty('--mk-addon-section-top-clearance');
      }
    });
  }

  function scheduleSectionClearance() {
    if (sectionFrame) return;
    sectionFrame = requestAnimationFrame(syncSectionClearance);
  }

  function scanCards() {
    scanFrame = 0;
    var all = readAll();
    document.querySelectorAll('#grafiks-list .card[data-worker], #nsPanel .nsc-full-card[data-worker], #nsPanel .ns-room-bed[data-worker]').forEach(function(card) {
      applyToCard(card, all[normName(card.getAttribute('data-worker'))] || null);
    });
    scheduleSectionClearance();
  }

  function scheduleScan() {
    if (scanFrame) return;
    scanFrame = requestAnimationFrame(scanCards);
  }

  function enhancePicker(host) {
    if (!host || host.querySelector('[data-skin-section="addons"]')) return;
    var tabs = host.querySelector('.mk-skin-main-tabs');
    var editor = host.querySelector('.mk-skin-editor');
    var preview = host.querySelector('.mk-skin-preview-real');
    if (!tabs || !editor) return;
    var name = currentWorkerName();
    var config = getConfig(name) || { id: '', scale: 1, side: 'right', x: 0, y: 0 };
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
      var count = ITEMS.filter(function(item) { return item.group === group.id; }).length;
      return '<button type="button" class="mk-addon-group' + (activeGroup === group.id ? ' is-active' : '')
        + '" data-addon-group="' + group.id + '">' + esc(group.label) + '<span>' + count + '</span></button>';
    }).join('');
    panel.innerHTML = '<div class="mk-skin-section-head"><strong>Kartītes dekors</strong><small>Viens dekors vienlaikus — bez pārblīvējuma</small></div>'
      + '<div class="mk-addon-drag-hint">Satver dekoru uz kartītes un velc uz jebkuru vietu</div>'
      + '<div class="mk-addon-groups">' + groupsHtml + '</div>'
      + '<div class="mk-addon-grid"></div>'
      + '<div class="mk-addon-controls">'
      + '<button type="button" class="mk-addon-remove">Bez dekora</button>'
      + '<label><span>Izmērs</span><input class="mk-addon-scale" type="range" min="60" max="140" step="5" value="' + Math.round((Number(config.scale) || 1) * 100) + '"><b class="mk-addon-scale-value">' + Math.round((Number(config.scale) || 1) * 100) + '%</b></label>'
      + '<div class="mk-addon-side" role="group" aria-label="Dekora puse"><button type="button" data-addon-side="left" class="' + (config.side === 'left' ? 'is-active' : '') + '">Kreisā</button><button type="button" data-addon-side="right" class="' + (config.side !== 'left' ? 'is-active' : '') + '">Labā</button></div>'
      + '<button type="button" class="mk-addon-reset-position">↺ Pozīcija</button>'
      + '</div>';
    editor.appendChild(panel);

    function syncPreviewClearance() {
      if (!previewSlot || !preview) return;
      var addon = preview.querySelector(':scope > .mk-card-addon');
      if (!addon) {
        previewSlot.style.removeProperty('--mk-addon-preview-top-clearance');
        previewSlot.style.removeProperty('--mk-addon-preview-bottom-clearance');
        return;
      }
      var cardRect = preview.getBoundingClientRect();
      var addonRect = addon.getBoundingClientRect();
      if (!addonRect.width || !addonRect.height) return;
      var topOverflow = Math.max(0, cardRect.top - addonRect.top);
      var bottomOverflow = Math.max(0, addonRect.bottom - cardRect.bottom);
      previewSlot.style.setProperty('--mk-addon-preview-top-clearance', Math.ceil(topOverflow + (topOverflow ? 12 : 0)) + 'px');
      previewSlot.style.setProperty('--mk-addon-preview-bottom-clearance', Math.ceil(bottomOverflow + (bottomOverflow ? 12 : 0)) + 'px');
      requestAnimationFrame(function() {
        var view = preview.closest('#modal-skin-view');
        var scroller = view && view.parentElement;
        if (!scroller) return;
        var freshAddonRect = addon.getBoundingClientRect();
        var scrollerRect = scroller.getBoundingClientRect();
        if (freshAddonRect.top < scrollerRect.top + 10) {
          scroller.scrollTop = Math.max(0, scroller.scrollTop - (scrollerRect.top + 10 - freshAddonRect.top));
        } else if (freshAddonRect.bottom > scrollerRect.bottom - 10) {
          scroller.scrollTop += freshAddonRect.bottom - (scrollerRect.bottom - 10);
        }
      });
    }

    function applyPreview() {
      if (preview) applyToCard(preview, config && config.id ? config : null);
      var previewAddon = preview && preview.querySelector(':scope > .mk-card-addon');
      syncPreviewClearance();
      if (previewAddon && !previewAddon.complete) {
        previewAddon.addEventListener('load', syncPreviewClearance, { once: true });
      }
      if (!previewAddon || previewAddon.dataset.dragBound === '1') return;
      previewAddon.dataset.dragBound = '1';
      previewAddon.addEventListener('pointerdown', function(event) {
        if (!config || !config.id) return;
        event.preventDefault();
        var startX = event.clientX;
        var startY = event.clientY;
        var baseX = Number(config.x) || 0;
        var baseY = Number(config.y) || 0;
        var rect = preview.getBoundingClientRect();
        previewAddon.classList.add('is-dragging');
        previewAddon.setPointerCapture(event.pointerId);
        function move(moveEvent) {
          config.x = Math.max(-100, Math.min(100, baseX + ((moveEvent.clientX - startX) / rect.width * 100)));
          config.y = Math.max(-100, Math.min(100, baseY + ((moveEvent.clientY - startY) / rect.height * 100)));
          previewAddon.style.setProperty('--mk-addon-offset-x', (config.x * rect.width / 100) + 'px');
          previewAddon.style.setProperty('--mk-addon-offset-y', (config.y * rect.height / 100) + 'px');
        }
        function finish() {
          previewAddon.classList.remove('is-dragging');
          previewAddon.removeEventListener('pointermove', move);
          previewAddon.removeEventListener('pointerup', finish);
          previewAddon.removeEventListener('pointercancel', finish);
          saveConfig(name, config);
          applyPreview();
        }
        previewAddon.addEventListener('pointermove', move);
        previewAddon.addEventListener('pointerup', finish);
        previewAddon.addEventListener('pointercancel', finish);
      });
    }

    function renderGrid() {
      var grid = panel.querySelector('.mk-addon-grid');
      grid.innerHTML = ITEMS.filter(function(item) { return item.group === activeGroup; }).map(function(item) {
        var selected = config && config.id === item.id;
        return '<button type="button" class="mk-addon-choice' + (selected ? ' is-active' : '') + '" data-addon-id="' + esc(item.id) + '" aria-pressed="' + selected + '" title="' + esc(item.label) + '">'
          + '<span><img loading="eager" decoding="async" draggable="false" src="' + esc(assetUrl(item)) + '" alt=""></span><b>' + esc(item.label) + '</b></button>';
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
          thumb.src = assetUrl(ITEM_BY_ID[button.dataset.addonId]) + '&retry=1';
        });
        if (thumb.complete) markReady();
        button.addEventListener('click', function() {
          config = { id: button.dataset.addonId, scale: Number(config.scale) || 1, side: config.side === 'left' ? 'left' : 'right', x: 0, y: 0 };
          saveConfig(name, config);
          renderGrid();
          applyPreview();
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

    panel.querySelector('.mk-addon-remove').addEventListener('click', function() {
      config = { id: '', scale: Number(config.scale) || 1, side: config.side === 'left' ? 'left' : 'right', x: 0, y: 0 };
      saveConfig(name, null);
      renderGrid();
      applyPreview();
    });

    var scale = panel.querySelector('.mk-addon-scale');
    var scaleValue = panel.querySelector('.mk-addon-scale-value');
    scale.addEventListener('input', function() {
      config.scale = Number(scale.value) / 100;
      scaleValue.textContent = scale.value + '%';
      if (config.id) { saveConfig(name, config); applyPreview(); }
    });

    panel.querySelectorAll('[data-addon-side]').forEach(function(button) {
      button.addEventListener('click', function() {
        config.side = button.dataset.addonSide;
        panel.querySelectorAll('[data-addon-side]').forEach(function(item) { item.classList.toggle('is-active', item === button); });
        if (config.id) { saveConfig(name, config); applyPreview(); }
      });
    });

    panel.querySelector('.mk-addon-reset-position').addEventListener('click', function() {
      config.x = 0;
      config.y = 0;
      if (config.id) { saveConfig(name, config); applyPreview(); }
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

  var hookAttempts = 0;
  function waitForPicker() {
    if (installPickerHook() || hookAttempts++ > 100) return;
    setTimeout(waitForPicker, 50);
  }

  window.MinkaCardAddons = {
    items: ITEMS.slice(),
    applyWorker: applyWorker,
    get: getConfig,
    getAll: function() { return readAll(); },
    replaceFromCloud: function(value) {
      var clean = {};
      Object.keys(value && typeof value === 'object' ? value : {}).forEach(function(name) {
        var config = normalizeConfig(value[name]);
        if (config) clean[normName(name)] = config;
      });
      writeAll(clean);
      scheduleScan();
    },
    clear: function(name) { saveConfig(name, null); }
  };

  waitForPicker();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scanCards, { once: true });
  else scanCards();
  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('minka:monthReady', scheduleScan);
  window.addEventListener('resize', scheduleScan, { passive: true });
})();
