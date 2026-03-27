/**
 * Minka Emoji System v2.0
 * - Tab categories with large grid
 * - Live preview of worker card
 * - Rare/locked emoji by LVL
 * - Hover scale effect
 * - Top-right position in side panel
 */
(function() {
  'use strict';

  var SYNC_CFG   = window.MINKA_SYNC || {};
  var GIST_ID    = window.MINKA_GIST_ID    || SYNC_CFG.gistId    || '';
  var GIST_TOKEN = window.MINKA_GIST_TOKEN || SYNC_CFG.gistToken || '';
  var GIST_FILE  = 'minka_emoji.json';
  var POLL_MS    = 60000;
  var LOCAL_KEY  = 'minka_emoji_v2';
  function hasApiAuth() {
    return !!(window.MinkaApi && typeof window.MinkaApi.apiFetch === 'function' && window.MinkaApi.getToken && window.MinkaApi.getToken());
  }

  function getSyncMode() {
    if (hasApiAuth()) return 'github';
    if (GIST_ID && GIST_TOKEN) return 'github';
    if (GIST_ID) return 'github-read';
    return 'local';
  }

  function getSyncLabel() {
    var mode = getSyncMode();
    if (mode === 'github') return 'GitHub sync';
    if (mode === 'github-read') return 'GitHub read-only';
    return 'Only this device';
  }

  // ── RARE LOCKED EMOJI (require LVL) ─────────────────────────────────────────
  var LOCKED = {
    '🔥': { lvl: 7,  label: 'Lv.7+'  },
    '🏆': { lvl: 8,  label: 'Lv.8+'  },
    '💎': { lvl: 9,  label: 'Lv.9+'  },
    '👑': { lvl: 10, label: 'Lv.10'  },
  };

  // ── EMOJI SECTIONS ───────────────────────────────────────────────────────────
  var SECTIONS = [
    { id:'all',     label:'⭐',  title:'Visi'        },
    { id:'med',     label:'🩺',  title:'Medicīna'    },
    { id:'mood',    label:'😎',  title:'Sajūtas'     },
    { id:'energy',  label:'⚡',  title:'Enerģija'    },
    { id:'animals', label:'🦊',  title:'Dzīvnieki'   },
    { id:'nature',  label:'🌿',  title:'Daba'        },
    { id:'stuff',   label:'☕',  title:'Fun'         },
    { id:'rare',    label:'🔒',  title:'Rare'        },
  ];

  var EMOJI_BY_SECTION = {
    med:     ['🩻','💉','🏥','🤧','🔬','💊','🩺','🩹','🧬','🫀','🧠','🦷','🩸','🧪','🔭','🫁','🤲','🧴','🩼','🦺','🥼','🚑','💪','🧘','🫶','💆','🛌','🏃','🧑‍⚕️','🌡️'],
    mood:    ['😴','😎','🤯','💀','👻','🤖','🦾','😤','🥱','😵','🤪','🧐','😏','🥳','🫡','🥶','🥵','😈','👾','🫠','😑','🙃','😬','🫤','😒','🥺','🫂','💤','😔','🫥'],
    energy:  ['⚡','❄️','🌊','🌪️','☀️','🌙','⛈️','💥','✨','🎯','🚀','💫','🌟','⭐','🌑','🌕','☄️','🌤️','🌧️','🌬️','🔮','🌋','🗻','🌈','💡','🕯️','🪔','🌠','🎆','🌀'],
    animals: ['🦊','🐺','🐱','🦁','🐉','🦋','🦅','🐻','🐼','🦝','🐸','🦎','🦈','🐬','🦌','🦩','🦚','🐙','🦑','🐝','🦔','🐧','🦜','🐊','🦭','🐋','🦘','🐓','🦂','🐆'],
    nature:  ['🌵','🌿','🍀','🌱','🍁','🍂','🌸','🌺','🌻','🌹','🪨','🌲','🌴','🎋','🌾','🪸','🍄','🪴','🫧','🧊','🌍','🏔️','🏕️','🏜️','🏞️','🌅','🌄','🌁','🌃','🐚'],
    stuff:   ['☕','🍕','🎸','🎮','🏂','🤿','🧩','🪄','🎪','🎭','🎨','🎵','🎺','🥊','🎳','🎱','🏹','🔑','🪩','📡','🔦','🛠️','🪓','🎤','🎧','📷','🎁','🃏','🎲','🧸'],
    rare:    ['🔥','🏆','💎','👑'],
  };

  EMOJI_BY_SECTION.med = EMOJI_BY_SECTION.med.concat(['😷','🤒','🤕','🦴','🧫','🧼','🦽','👨‍⚕️','👩‍⚕️']);
  EMOJI_BY_SECTION.med = EMOJI_BY_SECTION.med.filter(function(e,i,a){return a.indexOf(e)===i;});
  EMOJI_BY_SECTION.mood = EMOJI_BY_SECTION.mood.concat(['😍','🥰','🤩','😊','😌','🤔','😇','😜','🤗','😺']);
  EMOJI_BY_SECTION.energy = EMOJI_BY_SECTION.energy.concat(['🔋','🔌','🌞','🌛','🌩️','🎇','🌫️','🔭','💣','🧨']);
  EMOJI_BY_SECTION.animals = EMOJI_BY_SECTION.animals.concat(['🐶','🐰','🐹','🐮','🐴','🦉','🦄','🐑','🦆','🐯','🐈','🐈‍⬛','😸','🦕','🦖','🫎','🐻‍❄️','🦬','🦤','🪼']);
  EMOJI_BY_SECTION.nature = EMOJI_BY_SECTION.nature.concat(['🍃','🌼','🪻','🪷','🐾','🌥️','🌦️','🌨️','🪵','🌳']);
  EMOJI_BY_SECTION.stuff = EMOJI_BY_SECTION.stuff.concat(['👓','🕹️','🏓','🏀','⚽','🎰','🎬','📚','📎','🪀','🧋','🍜','🪆','🎻','🛸']);

  // Build "all" from all sections except rare
  EMOJI_BY_SECTION.all = [];
  ['med','mood','energy','animals','nature','stuff'].forEach(function(k) {
    EMOJI_BY_SECTION.all = EMOJI_BY_SECTION.all.concat(EMOJI_BY_SECTION[k]);
  });
  EMOJI_BY_SECTION.all = EMOJI_BY_SECTION.all.concat(EMOJI_BY_SECTION.rare);
  EMOJI_BY_SECTION.all = EMOJI_BY_SECTION.all.filter(function(e,i,a){return a.indexOf(e)===i;});

  // ── STATE ────────────────────────────────────────────────────────────────────
  var _data = {};
  var _pickerEl = null;
  var _activeWorker = null;
  var _activeCard = null;
  var _selectedEmoji = null;
  var _activeTab = 'all';
  var _hookedCards = new WeakSet();
  function getPerfMode() {
    var root = document.documentElement;
    return (root && root.getAttribute('data-performance')) || (root && root.classList.contains('mk-low-spec') ? 'low' : 'high');
  }

  // ── GIST ─────────────────────────────────────────────────────────────────────
  async function loadFromGist() {
    if (hasApiAuth()) {
      try {
        var apiRes = await window.MinkaApi.apiFetch('/api/emoji?_=' + Date.now());
        if (apiRes.ok) {
          var apiJson = await apiRes.json();
          _data = (apiJson && typeof apiJson === 'object') ? apiJson : {};
          try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(_data));
            localStorage.removeItem('minka_emoji_v1');
          } catch(e) {}
          refreshAllCards();
          return;
        }
      } catch(e) {}
    }
    if (!GIST_ID) return;
    try {
      var h = { 'Accept': 'application/vnd.github+json' };
      if (GIST_TOKEN) h['Authorization'] = 'Bearer ' + GIST_TOKEN;
      var r = await fetch('https://api.github.com/gists/' + GIST_ID + '?_=' + Date.now(), { headers: h, cache: 'no-store' });
      if (!r.ok) return;
      var j = await r.json();
      var raw = j.files && j.files[GIST_FILE] && j.files[GIST_FILE].content;
      if (raw) {
        _data = JSON.parse(raw);
        try {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(_data));
          localStorage.removeItem('minka_emoji_v1');
        } catch(e) {}
        refreshAllCards();
      }
    } catch(e) {}
  }

  async function saveToGist(workerName) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(_data));
      localStorage.removeItem('minka_emoji_v1');
    } catch(e) {}
    if (hasApiAuth() && workerName) {
      try {
        var apiRes = await window.MinkaApi.apiFetch('/api/emoji', {
          method: 'POST',
          json: { worker: workerName, emoji: _data[workerName] || null }
        });
        if (apiRes.ok) {
          setTimeout(loadFromGist, 150);
          return 'github';
        }
        return 'error';
      } catch(e) { return 'error'; }
    }
    if (!GIST_ID) return 'local';
    if (!GIST_TOKEN) return 'github-read';
    try {
      var r = await fetch('https://api.github.com/gists/' + GIST_ID, {
        method: 'PATCH',
        headers: { 'Accept':'application/vnd.github+json','Authorization':'Bearer '+GIST_TOKEN,'Content-Type':'application/json' },
        body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(_data, null, 2) } } })
      });
      return r.ok ? 'github' : 'error';
    } catch(e) { return 'error'; }
  }

  function loadLocal() {
    try {
      var s = localStorage.getItem(LOCAL_KEY) || localStorage.getItem('minka_emoji_v1');
      if (s) _data = JSON.parse(s);
    } catch(e) {}
  }

  // ── WORKER LVL ───────────────────────────────────────────────────────────────
  function getWorkerLvl(name) {
    if (!window.MinkaLevels || !window.MinkaLevels.buildAllTimeStats) return 1;
    try {
      var stats = window.MinkaLevels.buildAllTimeStats();
      var ws = stats[name];
      if (!ws || !ws.levelData) return 1;
      return ws.levelData.current.lvl || 1;
    } catch(e) { return 1; }
  }

  function isUnlocked(emoji, workerName) {
    if (!LOCKED[emoji]) return true;
    return getWorkerLvl(workerName) >= LOCKED[emoji].lvl;
  }

  // ── CARD UPDATES ─────────────────────────────────────────────────────────────
  function refreshAllCards() {
    document.querySelectorAll('.card[data-worker]').forEach(function(card) {
      updateCardEmoji(card, card.getAttribute('data-worker'));
    });
    document.querySelectorAll('.duty-block[data-worker]').forEach(function(b) {
      updateSideEmoji(b, b.getAttribute('data-worker'));
    });
  }

  function updateCardEmoji(card, name) {
    var emoji = _data[name] || null;
    var shiftIcons = card.querySelector('.shift-icons');
    var el = card.querySelector('.mk-emoji-badge');

    if (!emoji) {
      if (el) el.remove();
      if (shiftIcons) shiftIcons.style.display = '';
      return;
    }

    if (shiftIcons) shiftIcons.style.display = '';

    if (!el) {
      el = document.createElement('span');
      el.className = 'mk-emoji-badge';
      el.setAttribute('data-mk-emoji-click', '1');
      var si = card.querySelector('.shift-icons');
      if (si) {
        si.insertBefore(el, si.firstChild);
      } else {
        var topDiv = card.querySelector('.card-top');
        if (topDiv) topDiv.appendChild(el);
      }
    }
    el.textContent = emoji;
  }

  function updateSideEmoji(block, name) {
    var emoji = _data[name] || null;
    var el = block.querySelector('.mk-emoji-side');
    if (!emoji) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('span');
      el.className = 'mk-emoji-side';
      block.style.position = 'relative';
      block.appendChild(el);
    }
    el.textContent = emoji;
  }

  // ── HOOK CARDS ───────────────────────────────────────────────────────────────
  function hookNewCards() {
    document.querySelectorAll('.card[data-worker]').forEach(function(card) {
      if (_hookedCards.has(card)) return;
      _hookedCards.add(card);
      card.style.position = 'relative';
      var btn = document.createElement('button');
      btn.className = 'mk-emoji-edit-btn';
      btn.title = 'Mainīt emoji';
      btn.innerHTML = '✨';
      btn.setAttribute('data-mk-edit', '1');
      btn.style.cssText = 'position:absolute;bottom:22px;right:4px;z-index:10;';
      card.appendChild(btn);
      updateCardEmoji(card, card.getAttribute('data-worker'));

      // Keep emoji aligned; flow is driven by CSS so it stays smooth and deterministic
      card.addEventListener('mouseenter', function() {
        var badge = card.querySelector('.mk-emoji-badge');
        if (!badge) return;
        badge.classList.add('mk-emoji-hovered');
      });
      card.addEventListener('mouseleave', function() {
        var badge = card.querySelector('.mk-emoji-badge');
        if (!badge) return;
        badge.classList.remove('mk-emoji-hovered');
      });
    });
    document.querySelectorAll('.duty-block[data-worker]').forEach(function(b) {
      updateSideEmoji(b, b.getAttribute('data-worker'));
    });
  }

  document.addEventListener('click', function(e) {
    // Edit button click
    if (e.target.closest && e.target.closest('[data-mk-edit]')) {
      e.stopPropagation(); e.preventDefault();
      var card = e.target.closest('.card[data-worker]');
      if (card) openPicker(card.getAttribute('data-worker'), card);
      return;
    }
    // Emoji badge click
    if (e.target.closest && e.target.closest('[data-mk-emoji-click]')) {
      e.stopPropagation(); e.preventDefault();
      var card = e.target.closest('.card[data-worker]');
      if (card) openPicker(card.getAttribute('data-worker'), card);
      return;
    }
    // Context menu close
    var cm = document.getElementById('mk-ctx-menu');
    if (cm && !cm.contains(e.target)) closeCtxMenu();
    // Picker close
    if (_pickerEl && _pickerEl.style.display !== 'none') {
      if (!_pickerEl.contains(e.target)) closePicker();
    }
  }, true);

  // Right-click OR long-press on card → context menu
  document.addEventListener('contextmenu', function(e) {
    var card = e.target.closest && e.target.closest('.card[data-worker]');
    if (!card) return;
    e.preventDefault();
    showCtxMenu(card.getAttribute('data-worker'), card, e.clientX, e.clientY);
  });

  // ── CONTEXT MENU ─────────────────────────────────────────────────────────────
  function showCtxMenu(workerName, card, x, y) {
    closeCtxMenu();
    var cm = document.createElement('div');
    cm.id = 'mk-ctx-menu';
    var emoji = _data[workerName] || null;
    cm.innerHTML =
      '<div class="mk-ctx-item" data-mk-ctx-emoji="1">✨ ' + (emoji ? 'Mainīt emoji' : 'Pievienot emoji') + '</div>' +
      (emoji ? '<div class="mk-ctx-item mk-ctx-remove" data-mk-ctx-remove="1">🗑️ Noņemt emoji</div>' : '') +
      '<div class="mk-ctx-sep"></div>' +
      '<div class="mk-ctx-label">Lv.' + getWorkerLvl(workerName) + ' · ' + (workerName.split(' ')[0] || '') + '</div>';

    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = Math.min(x, vw - 160), cy = Math.min(y, vh - 100);
    cm.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;z-index:99998;';
    document.body.appendChild(cm);

    cm.querySelector('[data-mk-ctx-emoji]').addEventListener('click', function(e) {
      e.stopPropagation();
      closeCtxMenu();
      openPicker(workerName, card);
    });
    var rmv = cm.querySelector('[data-mk-ctx-remove]');
    if (rmv) rmv.addEventListener('click', async function(e) {
      e.stopPropagation();
      closeCtxMenu();
      delete _data[workerName];
      refreshAllCards();
      await saveToGist(workerName);
    });
  }

  function closeCtxMenu() {
    var cm = document.getElementById('mk-ctx-menu');
    if (cm) cm.remove();
  }

  // ── PICKER ───────────────────────────────────────────────────────────────────
  function buildPicker() {
    var el = document.createElement('div');
    el.id = 'mk-emoji-picker';
    el.innerHTML = '<div class="mkp-inner"></div>';
    document.body.appendChild(el);
    return el;
  }

  function renderPicker() {
    if (!_pickerEl) return;
    var inner = _pickerEl.querySelector('.mkp-inner');
    var workerLvl = getWorkerLvl(_activeWorker || '');
    var currentEmoji = _selectedEmoji;

    // ── Tabs ──
    var tabsHtml = '<div class="mkp-tabs">';
    SECTIONS.forEach(function(sec) {
      var isActive = _activeTab === sec.id;
      tabsHtml += '<button class="mkp-tab' + (isActive ? ' mkp-tab-active' : '') + '" data-tab="' + sec.id + '" title="' + sec.title + '">' + sec.label + '</button>';
    });
    tabsHtml += '</div>';

    // ── Grid ──
    var emojis = EMOJI_BY_SECTION[_activeTab] || EMOJI_BY_SECTION.all;
    var gridHtml = '<div class="mkp-grid">';
    emojis.forEach(function(e) {
      var locked = LOCKED[e] && workerLvl < LOCKED[e].lvl;
      var isSelected = e === currentEmoji;
      var cls = 'mkp-emoji-btn' + (isSelected ? ' mkp-selected' : '') + (locked ? ' mkp-locked' : '');
      if (locked) {
        gridHtml += '<button class="' + cls + '" data-emoji="' + e + '" data-locked="1" title="Nepieciešams ' + LOCKED[e].label + '">' +
          '<span class="mkp-lock-emoji">' + e + '</span>' +
          '<span class="mkp-lock-badge">' + LOCKED[e].label + '</span>' +
        '</button>';
      } else {
        gridHtml += '<button class="' + cls + '" data-emoji="' + e + '">' + e + '</button>';
      }
    });
    gridHtml += '</div>';

    // ── Live preview ──
    var previewEmoji = currentEmoji || '?';
    var workerFirst = (_activeWorker || '').split(' ')[0] || '';
    var workerSur   = (_activeWorker || '').split(' ').slice(1).join(' ') || '';
    var shortSur    = workerSur ? workerSur[0] + '.' : '';
    var previewHtml =
      '<div class="mkp-preview-wrap">' +
        '<div class="mkp-preview-label">DZĪVAIS<br>PRIEKŠSKATĪJUMS</div>' +
        '<div class="mkp-preview-card" id="mkp-preview-card">' +
          '<div class="mkp-prev-top">' +
            '<div class="mkp-prev-init">' + workerFirst.substring(0,2).toUpperCase() + '</div>' +
            '<div class="mkp-prev-emoji" id="mkp-preview-emoji">' + (currentEmoji || '') + '</div>' +
          '</div>' +
          '<div class="mkp-prev-shift" id="mkp-preview-shift">24</div>' +
          '<div class="mkp-prev-name">' + workerFirst + '</div>' +
          '<div class="mkp-prev-sub">' + shortSur + '</div>' +
        '</div>' +
      '</div>';

    // ── Footer ──
    var syncMode = getSyncMode();
    var dotClass = syncMode === 'local' ? ' mkp-local' : (syncMode === 'github-read' ? ' mkp-github-read' : '');
    var footerHtml =
      '<div class="mkp-footer">' +
        '<button class="mkp-btn mkp-clear" data-mk-clear="1">Noņemt</button>' +
        '<div class="mkp-sync-meta"><div class="mkp-sync-dot' + dotClass + '" id="mkp-dot"></div><span class="mkp-sync-text" id="mkp-sync-text">' + getSyncLabel() + '</span></div>' +
        '<button class="mkp-btn mkp-save" id="mkp-save">Saglabāt ✓</button>' +
      '</div>';

    inner.innerHTML =
      '<div class="mkp-title">IZVĒLIES SAVU EMOJI <button class="mkp-close" data-mk-close="1">✕</button></div>' +
      '<div class="mkp-body">' +
        '<div class="mkp-left">' + tabsHtml + gridHtml + '</div>' +
        previewHtml +
      '</div>' +
      footerHtml;

    // Tab click
    inner.querySelectorAll('.mkp-tab').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _activeTab = btn.getAttribute('data-tab');
        renderPicker();
      });
    });

    // Emoji hover → live preview + bounce
    inner.querySelectorAll('.mkp-emoji-btn:not(.mkp-locked)').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        var e = btn.getAttribute('data-emoji');
        var rot = (Math.random() * 24 - 12).toFixed(1);
        var perf = getPerfMode();
        var scale = perf === 'low' ? 1.12 : (perf === 'medium' ? 1.26 : 1.5);
        var lift = perf === 'low' ? 0 : -2;
        var tilt = perf === 'low' ? 0 : rot;
        btn.style.transition = 'transform .14s cubic-bezier(.34,1.8,.64,1)';
        btn.style.transform = 'scale(' + scale + ') translateY(' + lift + 'px) rotate(' + tilt + 'deg)';
        btn.style.zIndex = '10';
        btn.style.filter = perf === 'low' ? 'none' : 'drop-shadow(0 4px 8px rgba(139,92,246,0.6))';
        var pe = document.getElementById('mkp-preview-emoji');
        if (pe) pe.textContent = e;
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
        btn.style.zIndex = '';
        btn.style.filter = '';
        var pe = document.getElementById('mkp-preview-emoji');
        if (pe) pe.textContent = _selectedEmoji || '';
      });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        selectEmoji(btn.getAttribute('data-emoji'));
      });
    });

    // Locked tooltip click
    inner.querySelectorAll('.mkp-locked').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        // flash tooltip
        btn.classList.add('mkp-lock-flash');
        setTimeout(function() { btn.classList.remove('mkp-lock-flash'); }, 600);
      });
    });

    inner.addEventListener('click', function(e) {
      e.stopPropagation();
      if (e.target.closest('[data-mk-clear]')) { selectEmoji(null); return; }
      if (e.target.closest('[data-mk-close]')) { closePicker(); return; }
      if (e.target.closest('#mkp-save'))       { doSave(); return; }
    });
  }

  function selectEmoji(e) {
    _selectedEmoji = e;
    // Update preview immediately
    var pe = document.getElementById('mkp-preview-emoji');
    if (pe) pe.textContent = e || '';
    // Update selected state in grid
    if (_pickerEl) {
      _pickerEl.querySelectorAll('.mkp-emoji-btn').forEach(function(b) {
        b.classList.toggle('mkp-selected', b.getAttribute('data-emoji') === e);
      });
    }
  }

  async function doSave() {
    if (!_activeWorker) return;
    var saveBtn = document.getElementById('mkp-save');
    var dot = document.getElementById('mkp-dot');
    var text = document.getElementById('mkp-sync-text');
    if (_selectedEmoji) _data[_activeWorker] = _selectedEmoji;
    else delete _data[_activeWorker];
    refreshAllCards();
    if (dot) dot.className = 'mkp-sync-dot mkp-syncing';
    if (saveBtn) saveBtn.textContent = '⏳';
    var state = await saveToGist(_activeWorker);
    if (dot) dot.className = 'mkp-sync-dot ' + (
      state === 'github' ? 'mkp-ok' :
      state === 'local' ? 'mkp-local' :
      state === 'github-read' ? 'mkp-github-read' : 'mkp-err'
    );
    if (text) text.textContent =
      state === 'github' ? 'Saved to GitHub' :
      state === 'local' ? 'Saved on this device' :
      state === 'github-read' ? 'Saved locally only' :
      'Save failed';
    if (saveBtn) saveBtn.textContent =
      state === 'github' ? '✓ GitHub saved' :
      state === 'local' ? '✓ Saved locally' :
      state === 'github-read' ? '✓ Saved locally' :
      '⚠️ Error';
    setTimeout(closePicker, 700);
  }

  function openPicker(workerName, anchorEl) {
    _activeWorker = workerName;
    _activeCard   = anchorEl;
    _selectedEmoji = _data[workerName] || null;
    if (!_pickerEl) _pickerEl = buildPicker();

    _pickerEl.style.display = 'block';
    renderPicker();

    // Center on screen
    var PW = 560, M = 8;
    var vw = window.innerWidth, vh = window.innerHeight;
    var scrollY = window.pageYOffset || 0;

    // Measure actual height after render
    var PH = Math.min(_pickerEl.offsetHeight || 420, vh * 0.88);

    var left = (vw - PW) / 2;
    if (left < M) left = M;

    // Prefer below anchor, else center vertically
    var rect = anchorEl.getBoundingClientRect();
    var top = rect.bottom + scrollY + 8;
    if (top + PH > scrollY + vh - M) {
      // Try above
      top = rect.top + scrollY - PH - 8;
    }
    if (top < scrollY + M) {
      // Center vertically
      top = scrollY + (vh - PH) / 2;
    }

    _pickerEl.style.left = left + 'px';
    _pickerEl.style.top  = top  + 'px';
  }

  function closePicker() {
    if (_pickerEl) _pickerEl.style.display = 'none';
    _activeWorker = null;
    _activeCard   = null;
  }

  // ── CSS ───────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('mk-emoji-css')) return;
    var s = document.createElement('style');
    s.id = 'mk-emoji-css';
    s.textContent = `
      /* ── Card badge ── */
      .mk-emoji-badge {
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        flex:0 0 22px;
        width:22px;
        height:22px;
        font-size:17px;
        line-height:1;
        pointer-events:auto;
        cursor:pointer;
        user-select:none;
        z-index:6;
        border-radius:999px;
        transform-origin:center center;
        transition:
          transform .28s cubic-bezier(.22,.9,.2,1),
          filter .28s ease,
          opacity .2s ease,
          font-size .18s ease,
          width .18s ease,
          height .18s ease;
        filter:none;
        text-rendering:optimizeLegibility;
        -webkit-font-smoothing:antialiased;
      }
      .mk-emoji-badge::before {
        content:'';
        position:absolute;
        inset:-4px;
        border-radius:inherit;
        background:
          radial-gradient(circle at 35% 35%, rgba(255,255,255,.24), rgba(255,255,255,0) 42%),
          radial-gradient(circle at 50% 55%, rgba(167,139,250,.22), rgba(167,139,250,0) 70%);
        opacity:0;
        transform:scale(.82);
        transition:opacity .24s ease, transform .28s ease;
        z-index:-1;
      }
      .mk-emoji-badge.mk-emoji-hovered {
        font-size:22px;
        filter:drop-shadow(0 6px 14px rgba(0,0,0,.18));
        animation:mkEmojiFlow 1.7s cubic-bezier(.45,.05,.55,.95) infinite;
      }
      html[data-performance="low"] .mk-emoji-badge.mk-emoji-hovered {
        filter:none;
        animation:none;
      }
      html[data-performance="medium"] .mk-emoji-badge.mk-emoji-hovered {
        animation:mkEmojiFlow 2.4s cubic-bezier(.45,.05,.55,.95) infinite;
      }
      .mk-emoji-badge.mk-emoji-hovered::before {
        opacity:1;
        transform:scale(1.08);
      }
      .shift-icons {
        display:flex !important;
        align-items:center !important;
        justify-content:flex-end !important;
        gap:5px !important;
        position:relative !important;
        overflow:visible !important;
        padding-right:0 !important;
        min-height:22px;
        flex:0 0 auto;
      }
      .card {
        position:relative;
        overflow:visible !important;
      }
      .card-top {
        overflow:visible !important;
        align-items:flex-start !important;
      }
      @keyframes mkEmojiFlow {
        0%, 100% {
          transform: translate3d(0,0,0) rotate(0deg);
        }
        18% {
          transform: translate3d(0,-1px,0) rotate(-4deg);
        }
        38% {
          transform: translate3d(1px,-3px,0) rotate(3deg);
        }
        58% {
          transform: translate3d(0,-2px,0) rotate(-2deg);
        }
        78% {
          transform: translate3d(-1px,-1px,0) rotate(2deg);
        }
      }

      /* ── Side panel ── */
      .mk-emoji-side {
        position:absolute; top:6px; right:8px;
        font-size:18px; line-height:1;
        pointer-events:none; user-select:none; z-index:2;
      }

      /* ── Edit button ── */
      .mk-emoji-edit-btn {
        position:absolute; bottom:22px; right:4px;
        width:20px; height:20px; border:none;
        background:transparent; border-radius:6px;
        font-size:12px; cursor:pointer; opacity:0;
        transition:opacity .15s,background .15s;
        padding:0; line-height:1; display:flex;
        align-items:center; justify-content:center; z-index:10;
      }
      .card:hover .mk-emoji-edit-btn { opacity:1; background:rgba(139,92,246,0.35); }
      html[data-performance="low"] .card:hover .mk-emoji-edit-btn { background:rgba(139,92,246,0.18); }
      .card { position:relative; }

      /* ── Picker shell ── */
      #mk-emoji-picker {
        position:fixed; z-index:99999;
        width:560px; display:none;
      }
      .mkp-inner {
        background:rgba(10,7,24,0.99);
        border:1px solid rgba(139,92,246,0.45);
        border-radius:18px;
        box-shadow:0 28px 70px rgba(0,0,0,0.9);
        overflow:hidden; display:flex; flex-direction:column;
        max-height:90vh;
      }
      .mkp-title {
        font-size:9px; letter-spacing:2.5px;
        color:rgba(167,139,250,0.6); font-weight:800;
        text-align:center; padding:10px 36px 8px;
        border-bottom:1px solid rgba(255,255,255,0.05);
        flex-shrink:0; position:relative;
      }
      .mkp-close {
        position:absolute; right:10px; top:50%; transform:translateY(-50%);
        background:none; border:none; color:rgba(255,255,255,0.3);
        font-size:13px; cursor:pointer; padding:2px 6px; border-radius:4px;
      }
      .mkp-close:hover { color:#fff; background:rgba(255,255,255,0.08); }

      /* Body */
      .mkp-body {
        display:flex; flex-direction:row;
        flex:1; min-height:0; overflow:hidden;
      }
      .mkp-left {
        flex:1; display:flex; flex-direction:column;
        min-width:0; border-right:1px solid rgba(255,255,255,0.05);
        overflow:hidden;
      }

      /* Tabs */
      .mkp-tabs {
        display:flex; gap:2px; padding:7px 7px 5px;
        flex-shrink:0; flex-wrap:nowrap; overflow-x:auto;
        scrollbar-width:none;
      }
      .mkp-tabs::-webkit-scrollbar { display:none; }
      .mkp-tab {
        border:none; background:transparent; border-radius:8px;
        font-size:20px; cursor:pointer; padding:4px 8px;
        transition:background .12s, transform .12s;
        line-height:1; flex-shrink:0;
      }
      .mkp-tab:hover { background:rgba(255,255,255,0.08); transform:scale(1.2); }
      html[data-performance="low"] .mkp-tab:hover { transform:none; }
      html[data-performance="medium"] .mkp-tab:hover { transform:scale(1.08); }
      .mkp-tab-active { background:rgba(139,92,246,0.3) !important; box-shadow:0 0 0 1px rgba(139,92,246,0.5); }

      /* Grid */
      .mkp-grid {
        display:grid;
        grid-template-columns:repeat(9,1fr);
        gap:1px; padding:4px 7px 8px;
        overflow-y:auto; flex:1;
        scrollbar-width:thin;
        scrollbar-color:rgba(139,92,246,0.3) transparent;
      }
      .mkp-emoji-btn {
        border:none; background:transparent; border-radius:8px;
        font-size:22px; cursor:pointer; aspect-ratio:1;
        display:flex; align-items:center; justify-content:center;
        padding:0; position:relative;
        transition:transform .1s, background .1s;
      }
      .mkp-emoji-btn:hover:not(.mkp-locked) {
        transform:scale(1.35);
        background:rgba(139,92,246,0.22); z-index:5;
      }
      html[data-performance="low"] .mkp-emoji-btn:hover:not(.mkp-locked) {
        transform:none;
        background:rgba(139,92,246,0.14);
      }
      html[data-performance="medium"] .mkp-emoji-btn:hover:not(.mkp-locked) {
        transform:scale(1.14);
      }
      .mkp-emoji-btn.mkp-selected {
        background:rgba(139,92,246,0.4);
        box-shadow:0 0 0 1.5px rgba(167,139,250,0.7);
      }

      /* Locked */
      .mkp-locked { cursor:not-allowed; opacity:0.45; position:relative; }
      .mkp-lock-emoji { filter:grayscale(1); font-size:18px; }
      .mkp-lock-badge {
        position:absolute; bottom:1px; right:1px;
        font-size:6px; font-weight:900; color:#fbbf24;
        background:rgba(0,0,0,0.75); border-radius:3px;
        padding:1px 2px; line-height:1; pointer-events:none;
      }
      .mkp-locked.mkp-lock-flash { animation:mkLockShake .3s ease; }
      @keyframes mkLockShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }

      /* Live preview */
      .mkp-preview-wrap {
        width:120px; flex-shrink:0;
        display:flex; flex-direction:column;
        align-items:center; padding:12px 8px; gap:8px;
      }
      .mkp-preview-label {
        font-size:7px; font-weight:900; letter-spacing:1.5px;
        text-transform:uppercase; color:rgba(167,139,250,0.5);
        text-align:center; line-height:1.4;
      }
      .mkp-preview-card {
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(139,92,246,0.3);
        border-radius:14px; padding:10px 8px 8px;
        width:100%; text-align:center;
        box-shadow:0 4px 20px rgba(0,0,0,0.5);
      }
      .mkp-prev-top {
        display:flex; justify-content:space-between;
        align-items:center; margin-bottom:6px;
      }
      .mkp-prev-init {
        font-size:9px; font-weight:800;
        background:rgba(139,92,246,0.2);
        border:1px solid rgba(139,92,246,0.3);
        border-radius:6px; padding:2px 5px; color:#b78bff;
      }
      .mkp-prev-emoji { font-size:20px; line-height:1; min-width:24px; text-align:right; }
      .mkp-prev-shift { font-size:28px; font-weight:900; color:#a78bfa; letter-spacing:-1px; line-height:1; margin:2px 0; }
      .mkp-prev-name { font-size:11px; font-weight:800; color:#fff; }
      .mkp-prev-sub { font-size:9px; color:rgba(255,255,255,0.4); margin-top:1px; }

      /* Footer */
      .mkp-footer {
        display:flex; align-items:center; gap:6px;
        padding:8px 10px; flex-shrink:0;
        border-top:1px solid rgba(255,255,255,0.05);
      }
      .mkp-btn {
        flex:1; padding:7px 0; border-radius:10px;
        border:none; font-size:10px; font-weight:800;
        cursor:pointer; font-family:inherit;
      }
      .mkp-clear { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.4); }
      .mkp-clear:hover { background:rgba(255,255,255,0.12); }
      .mkp-save { background:linear-gradient(135deg,#6d28d9,#9333ea); color:#fff; box-shadow:0 3px 12px rgba(109,40,217,0.4); }
      .mkp-save:hover { opacity:.88; }
      .mkp-sync-meta { display:flex;align-items:center;gap:7px;min-width:118px;justify-content:center; }
      .mkp-sync-text { font-size:9px;color:rgba(255,255,255,0.45);font-weight:700;letter-spacing:.05em;white-space:nowrap; }
      .mkp-sync-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0;background:rgba(255,255,255,0.12); }
      .mkp-sync-dot.mkp-local  { background:#f59e0b;box-shadow:0 0 5px #f59e0b; }
      .mkp-sync-dot.mkp-github-read { background:#a78bfa;box-shadow:0 0 5px #a78bfa; }
      .mkp-sync-dot.mkp-syncing{ background:#60a5fa;box-shadow:0 0 5px #60a5fa;animation:mkPulse .6s infinite alternate; }
      .mkp-sync-dot.mkp-ok     { background:#34d399;box-shadow:0 0 5px #34d399; }
      .mkp-sync-dot.mkp-err    { background:#f87171;box-shadow:0 0 5px #f87171; }
      @keyframes mkPulse{from{opacity:.4}to{opacity:1}}

      /* Modal inline preview panel */
      .mkp-modal-preview {
        width: 110px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 6px 0 6px;
        gap: 6px;
        border-left: 1px solid rgba(255,255,255,0.05);
      }
      .mkp-modal-preview .mkp-preview-label {
        font-size: 6.5px;
        font-weight: 900;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: rgba(167,139,250,0.45);
        text-align: center;
        line-height: 1.4;
      }
      .mkp-prev-emoji {
        transition: transform .2s cubic-bezier(.34,1.56,.64,1) !important;
      }

      /* Context menu */
      #mk-ctx-menu {
        background: rgba(12,8,28,0.98);
        border: 1px solid rgba(139,92,246,0.4);
        border-radius: 12px;
        padding: 5px;
        min-width: 155px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.8);
        backdrop-filter: blur(20px);
        animation: mkCtxIn .12s cubic-bezier(.2,.9,.3,1) both;
      }
      @keyframes mkCtxIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
      html[data-performance="low"] .mk-ctx-menu { animation:none; }
      .mk-ctx-item {
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        color: #dde4ff;
        cursor: pointer;
        border-radius: 8px;
        transition: background .1s;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .mk-ctx-item:hover { background: rgba(139,92,246,0.25); }
      .mk-ctx-remove { color: rgba(248,113,113,0.8) !important; }
      .mk-ctx-remove:hover { background: rgba(248,113,113,0.12) !important; }
      .mk-ctx-sep { height:1px; background:rgba(255,255,255,0.07); margin:4px 0; }
      .mk-ctx-label {
        padding: 5px 12px 4px;
        font-size: 9px; font-weight: 700;
        color: rgba(167,139,250,0.5);
        letter-spacing: .08em; text-transform: uppercase;
      }
    `;
    document.head.appendChild(s);
  }

  // ── INIT ──────────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    loadLocal();
    hookNewCards();
    refreshAllCards();
    setInterval(hookNewCards, 2000);
    setTimeout(loadFromGist, 250);
    if (hasApiAuth() || GIST_ID) setInterval(loadFromGist, POLL_MS);
    document.addEventListener('minka:auth-ok', loadFromGist);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 400);
  }

  // Track current worker in modal
  var _modalWorker = null;

  var _origShowWorker = null;
  function patchShowWorker() {
    if (window.showWorkerSchedule && window.showWorkerSchedule !== _patchedShowWorker) {
      _origShowWorker = window.showWorkerSchedule;
      window.showWorkerSchedule = _patchedShowWorker;
    }
  }
  function _patchedShowWorker(workerName, shift) {
    _modalWorker = workerName;
    if (_origShowWorker) _origShowWorker.call(this, workerName, shift);
  }
  setInterval(patchShowWorker, 500);

  function renderInModal(container) {
    if (!container || !_modalWorker) return;
    var workerName = _modalWorker;
    var workerLvl = getWorkerLvl(workerName);
    var current = _data[workerName] || null;
    var _sel = current;
    var workerFirst = workerName.split(' ')[0] || '';
    var workerSur   = workerName.split(' ').slice(1).join(' ') || '';
    var shortSur    = workerSur ? workerSur[0] + '.' : '';
    var initials    = ((workerFirst[0]||'') + (workerSur[0]||'')).toUpperCase();

    // Build inline picker (no position, fits modal)
    var sectionsHtml = '';
    // Tabs
    var tabs = '<div class="mkp-tabs" style="flex-wrap:wrap;">';
    SECTIONS.forEach(function(sec) {
      tabs += '<button class="mkp-tab' + (_activeTab === sec.id ? ' mkp-tab-active' : '') + '" data-tab="' + sec.id + '" title="' + sec.title + '">' + sec.label + '</button>';
    });
    tabs += '</div>';

    var emojis = EMOJI_BY_SECTION[_activeTab] || EMOJI_BY_SECTION.all;
    var grid = '<div class="mkp-grid" style="grid-template-columns:repeat(10,1fr);max-height:220px;">';
    emojis.forEach(function(e) {
      var locked = LOCKED[e] && workerLvl < LOCKED[e].lvl;
      var sel = e === _sel;
      var cls = 'mkp-emoji-btn' + (sel ? ' mkp-selected' : '') + (locked ? ' mkp-locked' : '');
      if (locked) {
        grid += '<button class="' + cls + '" data-emoji="' + e + '" data-locked="1" title="' + LOCKED[e].label + '"><span class="mkp-lock-emoji">' + e + '</span><span class="mkp-lock-badge">' + LOCKED[e].label + '</span></button>';
      } else {
        grid += '<button class="' + cls + '" data-emoji="' + e + '">' + e + '</button>';
      }
    });
    grid += '</div>';

    var footer =
      '<div class="mkp-footer" style="padding:8px 0 0;">' +
        '<button class="mkp-btn mkp-clear" data-mk-modal-clear="1">Noņemt</button>' +
        '<div class="mkp-sync-meta"><div class="mkp-sync-dot' + (getSyncMode() === 'local' ? ' mkp-local' : (getSyncMode() === 'github-read' ? ' mkp-github-read' : '')) + '" id="mkp-modal-dot"></div><span class="mkp-sync-text" id="mkp-modal-sync-text">' + getSyncLabel() + '</span></div>' +
        '<button class="mkp-btn mkp-save" id="mkp-modal-save">Saglabāt ✓</button>' +
      '</div>';

    var preview =
      '<div class="mkp-modal-preview">' +
        '<div class="mkp-preview-label">PRIEKŠSKATĪJUMS</div>' +
        '<div class="mkp-preview-card" style="width:100px;">' +
          '<div class="mkp-prev-top">' +
            '<div class="mkp-prev-init">' + initials + '</div>' +
            '<div class="mkp-prev-emoji" id="mkp-modal-prev-emoji">' + (_sel||'') + '</div>' +
          '</div>' +
          '<div class="mkp-prev-shift">24</div>' +
          '<div class="mkp-prev-name">' + workerFirst + '</div>' +
          '<div class="mkp-prev-sub">' + shortSur + '</div>' +
        '</div>' +
        '<div style="font-size:8px;color:rgba(255,255,255,0.2);text-align:center;margin-top:4px;letter-spacing:.05em;">Lv.' + workerLvl + '</div>' +
      '</div>';

    container.innerHTML =
      '<div style="display:flex;gap:0;">' +
        '<div style="flex:1;min-width:0;">' + tabs + grid + '</div>' +
        preview +
      '</div>' +
      footer;

    // Tab clicks
    container.querySelectorAll('.mkp-tab').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _activeTab = btn.getAttribute('data-tab');
        renderInModal(container);
      });
    });

    // Emoji clicks
    container.querySelectorAll('.mkp-emoji-btn:not(.mkp-locked)').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _sel = btn.getAttribute('data-emoji');
        container.querySelectorAll('.mkp-emoji-btn').forEach(function(b) {
          b.classList.toggle('mkp-selected', b.getAttribute('data-emoji') === _sel);
        });
        // Lock preview on click
        var pe = document.getElementById('mkp-modal-prev-emoji');
        if (pe) { pe.textContent = _sel; pe.style.transform='scale(1.3)'; setTimeout(function(){ pe.style.transform=''; },300); }
      });
      btn.addEventListener('mouseenter', function() {
        var e = btn.getAttribute('data-emoji');
        // Fun bounce animation
        var perf = getPerfMode();
        var scale = perf === 'low' ? 1.12 : (perf === 'medium' ? 1.26 : 1.5);
        var lift = perf === 'low' ? 0 : -2;
        var tilt = perf === 'low' ? 0 : (Math.random()*16-8);
        btn.style.transition = 'transform .12s cubic-bezier(.34,1.8,.64,1)';
        btn.style.transform = 'scale(' + scale + ') translateY(' + lift + 'px) rotate(' + tilt + 'deg)';
        btn.style.zIndex = '10';
        btn.style.filter = perf === 'low' ? 'none' : 'drop-shadow(0 4px 8px rgba(139,92,246,0.6))';
        // Update modal preview
        var pe = document.getElementById('mkp-modal-prev-emoji');
        if (pe) pe.textContent = e;
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
        btn.style.zIndex = '';
        btn.style.filter = '';
        // Restore selected or empty in preview
        var pe = document.getElementById('mkp-modal-prev-emoji');
        if (pe) pe.textContent = _sel || '';
      });
    });

    // Locked shake
    container.querySelectorAll('.mkp-locked').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        btn.classList.add('mkp-lock-flash');
        setTimeout(function() { btn.classList.remove('mkp-lock-flash'); }, 400);
      });
    });

    // Clear
    var clearBtn = container.querySelector('[data-mk-modal-clear]');
    if (clearBtn) clearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _sel = null;
      container.querySelectorAll('.mkp-emoji-btn').forEach(function(b) { b.classList.remove('mkp-selected'); });
    });

    // Save
    var saveBtn = document.getElementById('mkp-modal-save');
    var dot = document.getElementById('mkp-modal-dot');
    var syncText = document.getElementById('mkp-modal-sync-text');
    if (saveBtn) saveBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      if (_sel) _data[workerName] = _sel;
      else delete _data[workerName];
      refreshAllCards();
      if (dot) dot.className = 'mkp-sync-dot mkp-syncing';
      saveBtn.textContent = '⏳';
      var state = await saveToGist(workerName);
      if (dot) dot.className = 'mkp-sync-dot ' + (
        state === 'github' ? 'mkp-ok' :
        state === 'local' ? 'mkp-local' :
        state === 'github-read' ? 'mkp-github-read' : 'mkp-err'
      );
      if (syncText) syncText.textContent =
        state === 'github' ? 'Saved to GitHub' :
        state === 'local' ? 'Saved on this device' :
        state === 'github-read' ? 'Saved locally only' :
        'Save failed';
      saveBtn.textContent =
        state === 'github' ? '✓ GitHub saved' :
        state === 'local' ? '✓ Saved locally' :
        state === 'github-read' ? '✓ Saved locally' :
        '⚠️ Error';
    });
  }

  window.MinkaEmoji = {
    get: function(name) { return _data[name] || null; },
    refresh: refreshAllCards,
    reload: loadFromGist,
    renderInModal: renderInModal
  };
})();
