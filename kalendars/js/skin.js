/**
 * Minka Card Skin System v1.0
 * - Per-worker card colour skins
 * - Stored in Cloudflare Workers KV (MINKA_SKIN) via /api/skin
 * - Separate from emoji.js — same API pattern, different endpoint
 */
(function() {
  'use strict';

  // ── SKINS ─────────────────────────────────────────────────────────────────────
  var SKINS = [
    { id: 'aurora',  label: 'Aurora',   accent: '#b77bff', bg: 'rgba(183,123,255,0.08)' },
    { id: 'coral',   label: 'Coral',    accent: '#ff7c6e', bg: 'rgba(255,124,110,0.08)' },
    { id: 'cyan',    label: 'Cyan',     accent: '#1ec8ff', bg: 'rgba(30,200,255,0.08)'  },
    { id: 'green',   label: 'Zaļš',    accent: '#00f064', bg: 'rgba(0,240,100,0.08)'   },
    { id: 'orange',  label: 'Oranžs',  accent: '#ffa032', bg: 'rgba(255,165,50,0.08)'  },
    { id: 'pink',    label: 'Rozā',    accent: '#ff6edc', bg: 'rgba(255,110,220,0.08)' },
    { id: 'yellow',  label: 'Dzeltens',accent: '#ffe628', bg: 'rgba(255,230,40,0.08)'  },
    { id: 'teal',    label: 'Tirkīzs', accent: '#00ebd7', bg: 'rgba(0,235,215,0.08)'   },
    { id: 'red',     label: 'Sarkans', accent: '#ff3c6e', bg: 'rgba(255,60,110,0.08)'  },
    { id: 'gold',    label: 'Zelts',   accent: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
  ];

  // ── STATE ─────────────────────────────────────────────────────────────────────
  var _data        = {};   // { workerName: skinId }
  var _pickerEl    = null;
  var _activeWorker = null;
  var _activeCard   = null;
  var _selectedSkin = null;
  var _hookedCards  = new WeakSet();
  var LOCAL_KEY     = 'minka_skin_v1';

  // ── API AUTH ──────────────────────────────────────────────────────────────────
  function hasApiAuth() {
    return !!(window.MinkaApi &&
              typeof window.MinkaApi.apiFetch === 'function' &&
              window.MinkaApi.getToken && window.MinkaApi.getToken());
  }

  function getSyncLabel() {
    if (hasApiAuth()) return 'Cloudflare sync';
    return 'Tikai šī ierīce';
  }

  // ── CLOUDFLARE / LOCAL STORAGE ────────────────────────────────────────────────
  async function loadFromApi() {
    if (!hasApiAuth()) { loadLocal(); return; }
    try {
      var res = await window.MinkaApi.apiFetch('/api/skin');
      if (res.ok) {
        var j = await res.json();
        _data = (j && typeof j === 'object') ? j : {};
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(_data)); } catch(e) {}
        refreshAllCards();
        return;
      }
    } catch(e) {}
    loadLocal();
  }

  async function saveToApi(workerName) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(_data)); } catch(e) {}
    if (!hasApiAuth()) return 'local';
    try {
      var res = await window.MinkaApi.apiFetch('/api/skin', {
        method: 'POST',
        json: { worker: workerName, skin: _data[workerName] || null }
      });
      return res.ok ? 'cloudflare' : 'error';
    } catch(e) { return 'error'; }
  }

  function loadLocal() {
    try {
      var s = localStorage.getItem(LOCAL_KEY);
      if (s) _data = JSON.parse(s);
    } catch(e) {}
  }

  // ── SKIN APPLICATION ──────────────────────────────────────────────────────────
  function getSkin(id) {
    return SKINS.find(function(s) { return s.id === id; }) || null;
  }

  function applyCardSkin(card, skinId) {
    var skin = getSkin(skinId);
    if (!skin) {
      card.removeAttribute('data-skin');
      card.style.removeProperty('--card-skin-accent');
      card.style.removeProperty('--card-skin-bg');
      return;
    }
    card.setAttribute('data-skin', skin.id);
    card.style.setProperty('--card-skin-accent', skin.accent);
    card.style.setProperty('--card-skin-bg', skin.bg);
  }

  function refreshAllCards() {
    document.querySelectorAll('.card[data-worker]').forEach(function(card) {
      var name = card.getAttribute('data-worker') || '';
      applyCardSkin(card, _data[name] || null);
    });
  }

  // ── HOOK NEW CARDS ────────────────────────────────────────────────────────────
  function hookNewCards() {
    document.querySelectorAll('.card[data-worker]').forEach(function(card) {
      if (_hookedCards.has(card)) return;
      _hookedCards.add(card);

      // Apply stored skin
      var name = card.getAttribute('data-worker') || '';
      applyCardSkin(card, _data[name] || null);

      // Hover edit button
      var btn = document.createElement('button');
      btn.className = 'mk-skin-edit-btn';
      btn.title = 'Mainīt skin';
      btn.innerHTML = '🎨';
      btn.setAttribute('data-mk-skin-edit', '1');
      card.appendChild(btn);
    });
  }

  // ── CONTEXT MENU (right-click) ────────────────────────────────────────────────
  function showCtxMenu(workerName, card, x, y) {
    closeCtxMenu();
    var cm = document.createElement('div');
    cm.id = 'mk-skin-ctx';
    var has = !!_data[workerName];
    cm.innerHTML =
      '<div class="mk-ctx-item" data-mk-skin-ctx-set="1">🎨 ' + (has ? 'Mainīt skin' : 'Pievienot skin') + '</div>' +
      (has ? '<div class="mk-ctx-item mk-ctx-remove" data-mk-skin-ctx-remove="1">🗑️ Noņemt skin</div>' : '') +
      '<div class="mk-ctx-sep"></div>' +
      '<div class="mk-ctx-label">' + (workerName.split(' ')[0] || '') + '</div>';

    var vw = window.innerWidth, vh = window.innerHeight;
    cm.style.cssText = 'position:fixed;left:' + Math.min(x, vw - 165) + 'px;top:' + Math.min(y, vh - 100) + 'px;z-index:99997;';
    document.body.appendChild(cm);

    cm.querySelector('[data-mk-skin-ctx-set]').addEventListener('click', function(e) {
      e.stopPropagation(); closeCtxMenu(); openPicker(workerName, card);
    });
    var rmv = cm.querySelector('[data-mk-skin-ctx-remove]');
    if (rmv) rmv.addEventListener('click', async function(e) {
      e.stopPropagation(); closeCtxMenu();
      delete _data[workerName];
      refreshAllCards();
      await saveToApi(workerName);
    });
  }

  function closeCtxMenu() {
    var cm = document.getElementById('mk-skin-ctx');
    if (cm) cm.remove();
  }

  // ── PICKER ────────────────────────────────────────────────────────────────────
  function buildPicker() {
    var el = document.createElement('div');
    el.id = 'mk-skin-picker';
    el.innerHTML = '<div class="mksp-inner"></div>';
    document.body.appendChild(el);
    return el;
  }

  function renderPicker() {
    if (!_pickerEl) return;
    var inner = _pickerEl.querySelector('.mksp-inner');
    var cur = _selectedSkin;
    var workerFirst = (_activeWorker || '').split(' ')[0] || '';
    var workerSur = (_activeWorker || '').split(' ').slice(1).join(' ') || '';
    var shortSur = workerSur ? workerSur[0] + '.' : '';
    var initials = (workerFirst[0] || '') + (((_activeWorker || '').split(' ')[1] || '')[0] || '');

    // Swatch grid
    var gridHtml = '<div class="mksp-grid">';
    SKINS.forEach(function(skin) {
      var sel = skin.id === cur;
      gridHtml +=
        '<button class="mksp-swatch' + (sel ? ' mksp-sel' : '') + '"' +
        ' data-skin="' + skin.id + '"' +
        ' title="' + skin.label + '"' +
        ' style="--sw-accent:' + skin.accent + ';--sw-bg:' + skin.bg + '">' +
        '<span class="mksp-sw-dot"></span>' +
        '<span class="mksp-sw-lbl">' + skin.label + '</span>' +
        '</button>';
    });
    gridHtml += '</div>';

    // Live preview card
    var previewSkin = getSkin(cur);
    var pa = previewSkin ? previewSkin.accent : 'var(--accent,#b77bff)';
    var pb = previewSkin ? previewSkin.bg : 'rgba(255,255,255,0.035)';
    var previewHtml =
      '<div class="mksp-preview-wrap">' +
        '<div class="mksp-preview-lbl">PRIEKŠSKATĪJUMS</div>' +
        '<div class="mksp-preview-card" id="mksp-prev-card" style="--card-skin-accent:' + pa + ';--card-skin-bg:' + pb + ';background:' + pb + ';border-color:' + pa + ';">' +
          '<div class="mksp-prev-top">' +
            '<div class="mksp-prev-init" style="border-color:' + pa + ';">' + initials.toUpperCase() + '</div>' +
          '</div>' +
          '<div class="mksp-prev-shift" style="color:' + pa + ';">24</div>' +
          '<div class="mksp-prev-name">' + workerFirst + '</div>' +
          '<div class="mksp-prev-sub">' + shortSur + '</div>' +
        '</div>' +
      '</div>';

    var syncLabel = getSyncLabel();
    var dotCls = hasApiAuth() ? 'mksp-dot-ok' : 'mksp-dot-local';
    var footerHtml =
      '<div class="mksp-footer">' +
        '<button class="mksp-btn mksp-clear" data-mksp-clear="1">Noņemt</button>' +
        '<div class="mksp-sync"><span class="mksp-dot ' + dotCls + '" id="mksp-dot"></span><span id="mksp-sync-lbl">' + syncLabel + '</span></div>' +
        '<button class="mksp-btn mksp-save" id="mksp-save">Saglabāt ✓</button>' +
      '</div>';

    inner.innerHTML =
      '<div class="mksp-title">IZVĒLIES SKIN <button class="mksp-close" data-mksp-close="1">✕</button></div>' +
      '<div class="mksp-body">' + gridHtml + previewHtml + '</div>' +
      footerHtml;

    // Swatch hover → live preview
    inner.querySelectorAll('.mksp-swatch').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        updatePreview(btn.getAttribute('data-skin'));
      });
      btn.addEventListener('mouseleave', function() {
        updatePreview(_selectedSkin);
      });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        selectSkin(btn.getAttribute('data-skin'));
      });
    });

    inner.addEventListener('click', function(e) {
      e.stopPropagation();
      if (e.target.closest('[data-mksp-clear]')) { selectSkin(null); return; }
      if (e.target.closest('[data-mksp-close]')) { closePicker(); return; }
      if (e.target.closest('#mksp-save')) { doSave(); return; }
    });
  }

  function updatePreview(skinId) {
    var card = document.getElementById('mksp-prev-card');
    if (!card) return;
    var skin = getSkin(skinId);
    var pa = skin ? skin.accent : 'var(--accent,#b77bff)';
    var pb = skin ? skin.bg : 'rgba(255,255,255,0.035)';
    card.style.background = pb;
    card.style.borderColor = pa;
    card.style.setProperty('--card-skin-accent', pa);
    var initEl = card.querySelector('.mksp-prev-init');
    if (initEl) initEl.style.borderColor = pa;
    var shiftEl = card.querySelector('.mksp-prev-shift');
    if (shiftEl) shiftEl.style.color = pa;
  }

  function selectSkin(id) {
    _selectedSkin = id;
    updatePreview(id);
    if (_pickerEl) {
      _pickerEl.querySelectorAll('.mksp-swatch').forEach(function(b) {
        b.classList.toggle('mksp-sel', b.getAttribute('data-skin') === id);
      });
    }
  }

  async function doSave() {
    if (!_activeWorker) return;
    var saveBtn = document.getElementById('mksp-save');
    var dot = document.getElementById('mksp-dot');
    var lbl = document.getElementById('mksp-sync-lbl');
    if (_selectedSkin) _data[_activeWorker] = _selectedSkin;
    else delete _data[_activeWorker];
    refreshAllCards();
    if (dot) dot.className = 'mksp-dot mksp-dot-syncing';
    if (saveBtn) saveBtn.textContent = '⏳';
    var state = await saveToApi(_activeWorker);
    var ok = state === 'cloudflare' || state === 'local';
    if (dot) dot.className = 'mksp-dot ' + (state === 'cloudflare' ? 'mksp-dot-ok' : state === 'local' ? 'mksp-dot-local' : 'mksp-dot-err');
    if (lbl) lbl.textContent =
      state === 'cloudflare' ? 'Saglabāts Cloudflare' :
      state === 'local'      ? 'Saglabāts lokāli'    : 'Kļūda';
    if (saveBtn) saveBtn.textContent = ok ? '✓ Saglabāts' : '⚠️ Kļūda';
    setTimeout(closePicker, 700);
  }

  function openPicker(workerName, anchorEl) {
    _activeWorker  = workerName;
    _activeCard    = anchorEl;
    _selectedSkin  = _data[workerName] || null;
    if (!_pickerEl) _pickerEl = buildPicker();
    _pickerEl.style.display = 'block';
    renderPicker();

    // Position
    var PW = 460, M = 8;
    var vw = window.innerWidth, vh = window.innerHeight;
    var PH = Math.min(_pickerEl.offsetHeight || 320, vh * 0.85);
    var left = (vw - PW) / 2;
    if (left < M) left = M;
    var rect = anchorEl.getBoundingClientRect();
    var scrollY = window.pageYOffset || 0;
    var top = rect.bottom + scrollY + 8;
    if (top + PH > scrollY + vh - M) top = rect.top + scrollY - PH - 8;
    if (top < scrollY + M) top = scrollY + (vh - PH) / 2;
    _pickerEl.style.left = left + 'px';
    _pickerEl.style.top  = top  + 'px';
  }

  function closePicker() {
    if (_pickerEl) _pickerEl.style.display = 'none';
    _activeWorker = null;
    _activeCard   = null;
  }

  // ── EVENTS ────────────────────────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    // Edit button
    if (e.target.closest && e.target.closest('[data-mk-skin-edit]')) {
      e.stopPropagation(); e.preventDefault();
      var card = e.target.closest('.card[data-worker]');
      if (card) openPicker(card.getAttribute('data-worker'), card);
      return;
    }
    // Close context menu / picker on outside click
    var cm = document.getElementById('mk-skin-ctx');
    if (cm && !cm.contains(e.target)) closeCtxMenu();
    if (_pickerEl && _pickerEl.style.display !== 'none') {
      if (!_pickerEl.contains(e.target)) closePicker();
    }
  }, true);

  document.addEventListener('contextmenu', function(e) {
    var card = e.target.closest && e.target.closest('.card[data-worker]');
    if (!card) return;
    // Don't steal right-click if emoji context menu is active (let emoji.js handle it first)
    // We add our skin option alongside — share the context menu via a slight delay
    setTimeout(function() {
      var existing = document.getElementById('mk-ctx-menu'); // emoji context menu
      if (existing) {
        // Inject skin option into the existing emoji context menu
        var sep = existing.querySelector('.mk-ctx-sep');
        if (sep) {
          var workerName = card.getAttribute('data-worker') || '';
          var hasSkin = !!_data[workerName];
          var skinItem = document.createElement('div');
          skinItem.className = 'mk-ctx-item';
          skinItem.setAttribute('data-mk-skin-inject', '1');
          skinItem.textContent = (hasSkin ? '🎨 Mainīt skin' : '🎨 Pievienot skin');
          var rmvItem = hasSkin ? document.createElement('div') : null;
          if (rmvItem) {
            rmvItem.className = 'mk-ctx-item mk-ctx-remove';
            rmvItem.textContent = '🗑️ Noņemt skin';
            rmvItem.addEventListener('click', async function(ev) {
              ev.stopPropagation();
              // close emoji ctx via click-outside
              document.body.click();
              delete _data[workerName];
              refreshAllCards();
              await saveToApi(workerName);
            });
          }
          existing.insertBefore(skinItem, sep);
          if (rmvItem) existing.insertBefore(rmvItem, sep);
          skinItem.addEventListener('click', function(ev) {
            ev.stopPropagation();
            document.body.click();
            openPicker(workerName, card);
          });
        }
      } else {
        // No emoji ctx menu — show standalone skin ctx menu
        showCtxMenu(card.getAttribute('data-worker') || '', card, e.clientX, e.clientY);
      }
    }, 20);
  });

  // ── CSS ───────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('mk-skin-css')) return;
    var s = document.createElement('style');
    s.id = 'mk-skin-css';
    s.textContent = `
      /* ── Skin card overrides (higher specificity via [data-skin]) ── */
      .card[data-skin] {
        background: var(--card-skin-bg) !important;
        border-color: color-mix(in srgb, var(--card-skin-accent) 35%, rgba(255,255,255,0.09)) !important;
      }
      /* shift number — use double class trick for max specificity */
      .card[data-skin] .card-shift,
      .card[data-skin][data-worker] .card-shift {
        color: var(--card-skin-accent) !important;
        -webkit-text-fill-color: var(--card-skin-accent) !important;
        text-shadow: none !important;
      }
      /* initials badge border */
      .card[data-skin] .card-init {
        border-color: color-mix(in srgb, var(--card-skin-accent) 40%, rgba(255,255,255,.12)) !important;
      }
      /* active-duty glow uses skin colour (specificity 0,3,0 beats 0,2,0) */
      .card[data-skin].is-active-duty {
        border-color: color-mix(in srgb, var(--card-skin-accent) 55%, rgba(255,255,255,.10)) !important;
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--card-skin-accent) 28%, transparent),
          0 0 18px color-mix(in srgb, var(--card-skin-accent) 14%, transparent) !important;
      }

      /* ── Edit button ── */
      .mk-skin-edit-btn {
        position: absolute;
        bottom: 4px;
        right: 26px;
        width: 20px; height: 20px;
        border: none; background: transparent;
        border-radius: 6px; font-size: 12px;
        cursor: pointer; opacity: 0;
        transition: opacity .15s, background .15s;
        padding: 0; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        z-index: 10;
      }
      .card:hover .mk-skin-edit-btn {
        opacity: 1;
        background: rgba(139,92,246,0.35);
      }

      /* ── Picker shell ── */
      #mk-skin-picker {
        position: fixed; z-index: 99998;
        width: 460px; display: none;
      }
      .mksp-inner {
        background: rgba(10,7,24,0.99);
        border: 1px solid rgba(139,92,246,0.45);
        border-radius: 18px;
        box-shadow: 0 28px 70px rgba(0,0,0,0.9);
        overflow: hidden;
        display: flex; flex-direction: column;
        max-height: 90vh;
      }
      .mksp-title {
        font-size: 9px; letter-spacing: 2.5px;
        color: rgba(167,139,250,0.6); font-weight: 800;
        text-align: center; padding: 10px 36px 8px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        flex-shrink: 0; position: relative;
      }
      .mksp-close {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: rgba(255,255,255,0.3);
        font-size: 13px; cursor: pointer; padding: 2px 6px; border-radius: 4px;
      }
      .mksp-close:hover { color: #fff; background: rgba(255,255,255,0.08); }
      .mksp-body {
        display: flex; flex-direction: row;
        flex: 1; min-height: 0; padding: 14px;
        gap: 14px; overflow: hidden;
      }
      /* ── Swatch grid ── */
      .mksp-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        flex: 1; align-content: start;
        overflow-y: auto;
      }
      .mksp-swatch {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 10px; border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        cursor: pointer; transition: background .15s, border-color .15s, transform .12s;
        font-size: 11px; font-weight: 700;
        color: rgba(255,255,255,0.65);
      }
      .mksp-swatch:hover {
        background: rgba(255,255,255,0.07);
        border-color: var(--sw-accent);
        transform: translateY(-1px);
        color: #fff;
      }
      .mksp-swatch.mksp-sel {
        border-color: var(--sw-accent);
        background: var(--sw-bg);
        color: #fff;
        box-shadow: 0 0 0 1px var(--sw-accent);
      }
      .mksp-sw-dot {
        width: 12px; height: 12px; border-radius: 50%;
        background: var(--sw-accent); flex-shrink: 0;
        box-shadow: 0 0 6px var(--sw-accent);
      }
      .mksp-sw-lbl { flex: 1; text-align: left; }
      /* ── Preview card ── */
      .mksp-preview-wrap {
        flex-shrink: 0; width: 110px;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
      }
      .mksp-preview-lbl {
        font-size: 7px; letter-spacing: 1.8px; font-weight: 800;
        color: rgba(255,255,255,0.25); text-transform: uppercase;
      }
      .mksp-preview-card {
        width: 100px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.2);
        padding: 8px 8px 6px;
        display: flex; flex-direction: column; gap: 3px;
        transition: background .25s, border-color .25s;
      }
      .mksp-prev-top { display: flex; align-items: center; }
      .mksp-prev-init {
        font-size: 9px; font-weight: 800;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 20px; padding: 2px 6px;
        background: rgba(0,0,0,0.3); color: #fff;
        transition: border-color .25s;
      }
      .mksp-prev-shift {
        font-size: 28px; font-weight: 900;
        line-height: 1; margin: 2px 0;
        transition: color .25s;
      }
      .mksp-prev-name { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.8); }
      .mksp-prev-sub  { font-size: 8px; color: rgba(255,255,255,0.4); }
      /* ── Footer ── */
      .mksp-footer {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 14px 12px;
        border-top: 1px solid rgba(255,255,255,0.06);
        flex-shrink: 0; gap: 8px;
      }
      .mksp-btn {
        padding: 5px 14px; border-radius: 8px;
        font-size: 11px; font-weight: 700; cursor: pointer;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
        transition: background .15s;
      }
      .mksp-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .mksp-save { border-color: rgba(139,92,246,0.5); color: rgba(167,139,250,0.9); }
      .mksp-save:hover { background: rgba(139,92,246,0.2); }
      .mksp-sync {
        display: flex; align-items: center; gap: 5px;
        font-size: 9px; color: rgba(255,255,255,0.35); flex: 1; justify-content: center;
      }
      .mksp-dot {
        width: 6px; height: 6px; border-radius: 50%;
        flex-shrink: 0;
      }
      .mksp-dot-ok      { background: #30d158; box-shadow: 0 0 4px #30d158; }
      .mksp-dot-local   { background: #ff9f0a; box-shadow: 0 0 4px #ff9f0a; }
      .mksp-dot-syncing { background: #64d2ff; animation: mkspBlink .7s ease-in-out infinite; }
      .mksp-dot-err     { background: #ff453a; box-shadow: 0 0 4px #ff453a; }
      @keyframes mkspBlink {
        0%,100% { opacity: 1; } 50% { opacity: .3; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── MUTATION OBSERVER — watch for new cards ───────────────────────────────────
  function startObserver() {
    var container = document.getElementById('grafiks-list');
    if (!container) { setTimeout(startObserver, 400); return; }
    var mo = new MutationObserver(function() {
      requestAnimationFrame(hookNewCards);
    });
    mo.observe(container, { childList: true, subtree: false });
    hookNewCards();
  }

  // ── INIT ──────────────────────────────────────────────────────────────────────
  injectCSS();
  loadLocal();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      startObserver();
      loadFromApi();
    });
  } else {
    startObserver();
    loadFromApi();
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────────────
  window.MinkaSkin = {
    get: function(name) { return _data[name] || null; },
    set: function(name, skinId) {
      if (skinId) _data[name] = skinId; else delete _data[name];
      refreshAllCards();
    },
    refresh: refreshAllCards,
    SKINS: SKINS
  };

})();
