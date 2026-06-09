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
  var POLL_MS    = 300000; /* 5 min (was 60s) — lighter background polling */
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
    if (mode === 'github' || mode === 'github-read') return 'Sinhronizēts';
    return 'Lokāli';
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
    { id:'mood',    label:'😎',  title:'Sejas'       },
    { id:'energy',  label:'⚡',  title:'Enerģija'    },
    { id:'animals', label:'🦊',  title:'Dzīvnieki'   },
    { id:'nature',  label:'🌿',  title:'Daba'        },
    { id:'stuff',   label:'☕',  title:'Ikdiena'     },
    { id:'rare',    label:'🔒',  title:'Simboli'     },
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
  EMOJI_BY_SECTION.med = EMOJI_BY_SECTION.med.concat(['🧑‍⚕️','👩‍⚕️','👨‍⚕️','🧑‍🔬','👩‍🔬','👨‍🔬','🫀','🫁','🧫','🧯','🧊','🦠','🧵','🧷','🧻','🧽','🪥','🦿','🦾']);
  EMOJI_BY_SECTION.mood = EMOJI_BY_SECTION.mood.concat(['🫡','🫢','🫣','🫨','🫩','🙂‍↔️','🙂‍↕️','😶‍🌫️','😮‍💨','😵‍💫','❤️‍🔥','❤️‍🩹','🫶','🫰','🫱','🫲']);
  EMOJI_BY_SECTION.energy = EMOJI_BY_SECTION.energy.concat(['🫧','🪩','🛸','🛰️','📟','📈','🧭','🧲','⚙️','🪫','🔦','🚨','🟢','🟡','🟠','🔴','🫆']);
  EMOJI_BY_SECTION.animals = EMOJI_BY_SECTION.animals.concat(['🪿','🪽','🐦‍🔥','🫎','🫏','🪼','🪲','🪱','🦥','🦦','🦧','🦣','🦛','🦏','🦓','🦒','🐿️']);
  EMOJI_BY_SECTION.nature = EMOJI_BY_SECTION.nature.concat(['🪾','🪻','🫚','🫛','🫜','🪷','🪸','🪨','🪵','🧋','🌘','🌗','🌖','🌔','🌓','🌒','🌌']);
  EMOJI_BY_SECTION.stuff = EMOJI_BY_SECTION.stuff.concat(['🪭','🪈','🪇','🪉','🪏','🛜','🪫','🫙','🧿','🪬','🪄','🧰','🧪','🧯','🕹️','🖥️','⌨️','🖱️','📱','💻']);
  Object.keys(EMOJI_BY_SECTION).forEach(function(k) {
    EMOJI_BY_SECTION[k] = EMOJI_BY_SECTION[k].filter(function(e,i,a){return a.indexOf(e)===i;});
  });

  // Build "all" from all sections except rare
  EMOJI_BY_SECTION.all = [];
  ['med','mood','energy','animals','nature','stuff'].forEach(function(k) {
    EMOJI_BY_SECTION.all = EMOJI_BY_SECTION.all.concat(EMOJI_BY_SECTION[k]);
  });
  EMOJI_BY_SECTION.all = EMOJI_BY_SECTION.all.concat(EMOJI_BY_SECTION.rare);
  EMOJI_BY_SECTION.all = EMOJI_BY_SECTION.all.filter(function(e,i,a){return a.indexOf(e)===i;});

  var SECTION_TITLES = {};
  SECTIONS.forEach(function(sec) { SECTION_TITLES[sec.id] = sec.title; });
  var EMOJI_NAMES = {
    '🩻':'Rentgens','💉':'Šļirce','🏥':'Slimnīca','🔬':'Mikroskops','💊':'Tablete','🩺':'Stetoskops','🩹':'Plāksteris','🧬':'DNS','🫀':'Sirds','🫁':'Plaušas','🧠':'Smadzenes','🩸':'Asinis','🧪':'Mēģene','🚑':'Ātrā palīdzība','🥼':'Halāts','😷':'Maska','🤒':'Slims','🦴':'Kauls',
    '😴':'Miegs','😎':'Foršs','🤯':'Pārslodze','🤖':'Robots','🥱':'Žāva','🫡':'Dežūra','🫠':'Izkusis','😮‍💨':'Izelpa','😵‍💫':'Reibonis','❤️‍🔥':'Deg','❤️‍🩹':'Atkopjas',
    '⚡':'Enerģija','❄️':'Ledus','☀️':'Saule','🌙':'Mēness','🚀':'Raķete','🔮':'Kristāls','🪩':'Disko','🛸':'NLO','🚨':'Trauksme','🟢':'Zaļš','🟡':'Dzeltens','🟠':'Oranžs','🔴':'Sarkans',
    '🦊':'Lapsa','🐱':'Kaķis','🐶':'Suns','🐉':'Pūķis','🦖':'Dinozaurs','🦕':'Dinozaurs','🦉':'Pūce','🐦‍🔥':'Fēnikss','🪼':'Medūza','🫎':'Alnis',
    '🌿':'Lapa','🍀':'Āboliņš','🪻':'Hiacinte','🪷':'Lotoss','🪾':'Koks','🌌':'Galaktika','🌈':'Varavīksne','🫧':'Burbuļi',
    '☕':'Kafija','🍕':'Pica','🎮':'Spēles','🎧':'Austiņas','📚':'Grāmatas','🪄':'Burvju nūjiņa','🪬':'Amulets','🛜':'Wi-Fi','💻':'Dators','📱':'Telefons',
    '🔥':'Uguns','🏆':'Kauss','💎':'Dimants','👑':'Kronis'
  };

  function getEmojiSection(emoji) {
    var keys = ['med','mood','energy','animals','nature','stuff','rare'];
    for (var i = 0; i < keys.length; i++) {
      if ((EMOJI_BY_SECTION[keys[i]] || []).indexOf(emoji) !== -1) return keys[i];
    }
    return 'all';
  }

  function getEmojiName(emoji) {
    return EMOJI_NAMES[emoji] || 'Emoji';
  }

  function getVisibleEmojiList() {
    var source = EMOJI_BY_SECTION[_activeTab] || EMOJI_BY_SECTION.all;
    var q = String(_emojiQuery || '').trim().toLowerCase();
    if (!q) return source;
    return source.filter(function(e) {
      return e.indexOf(q) !== -1 ||
        getEmojiName(e).toLowerCase().indexOf(q) !== -1 ||
        (SECTION_TITLES[getEmojiSection(e)] || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  function buildCategoryButtons(buttonClass) {
    return SECTIONS.map(function(sec) {
      return '<button class="' + buttonClass + (_activeTab === sec.id ? ' mkp-tab-active' : '') + '" data-tab="' + sec.id + '" title="' + sec.title + '">' +
        sec.label + '<span class="mkp-cat-name">' + sec.title + '</span></button>';
    }).join('');
  }

  function emojiButtonHtml(e, workerLvl, currentEmoji) {
    var locked = LOCKED[e] && workerLvl < LOCKED[e].lvl;
    var isSelected = e === currentEmoji;
    var cls = 'mkp-emoji-btn' + (isSelected ? ' mkp-selected' : '') + (locked ? ' mkp-locked' : '');
    if (locked) {
      return '<button class="' + cls + '" data-emoji="' + e + '" data-locked="1" title="Nepieciešams ' + LOCKED[e].label + '">' +
        '<span class="mkp-lock-emoji">' + e + '</span>' +
        '<span class="mkp-lock-badge">' + LOCKED[e].label + '</span>' +
      '</button>';
    }
    return '<button class="' + cls + '" data-emoji="' + e + '" title="' + getEmojiName(e) + '">' + e + '</button>';
  }

  function buildEmojiGroupsHtml(workerLvl, currentEmoji) {
    var q = String(_emojiQuery || '').trim().toLowerCase();
    var keys = _activeTab === 'all'
      ? ['med','mood','energy','animals','nature','stuff','rare']
      : [_activeTab];
    var html = '';
    keys.forEach(function(k) {
      var list = (EMOJI_BY_SECTION[k] || []).filter(function(e) {
        if (!q) return true;
        return e.indexOf(q) !== -1 ||
          getEmojiName(e).toLowerCase().indexOf(q) !== -1 ||
          (SECTION_TITLES[k] || '').toLowerCase().indexOf(q) !== -1;
      });
      if (!list.length) return;
      html += '<section class="mkp-group" data-group="' + k + '">' +
        '<h5>' + (SECTION_TITLES[k] || k) + '</h5>' +
        '<div class="mkp-grid">' +
          list.map(function(e) { return emojiButtonHtml(e, workerLvl, currentEmoji); }).join('') +
        '</div>' +
      '</section>';
    });
    return html || '<div class="mkp-empty">Nekas nav atrasts</div>';
  }

  // ── STATE ────────────────────────────────────────────────────────────────────
  var _data = {};
  var _pickerEl = null;
  var _activeWorker = null;
  var _activeCard = null;
  var _selectedEmoji = null;
  var _activeTab = 'all';
  var _emojiQuery = '';
  var _emojiSearchTimer = 0;
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
    var midEl = card.querySelector('.mk-mid-person-emoji');
    var statusRail = card.querySelector('.mk-mid-status-icons');
    var el = card.querySelector('.mk-emoji-badge');

    if (statusRail) {
      if (emoji) {
        if (!midEl) {
          midEl = document.createElement('span');
          midEl.className = 'mk-mid-person-emoji';
          midEl.setAttribute('data-mk-emoji-click', '1');
          statusRail.insertBefore(midEl, statusRail.firstChild);
        }
        midEl.textContent = emoji;
      } else if (midEl) {
        midEl.remove();
      }
      if (shiftIcons) shiftIcons.style.display = '';
      return;
    }

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
      var sideIconRail = block.querySelector('.mk-side-icon-rail');
      var sideNameRow = block.querySelector('.mk-side-name-row');
      if (sideIconRail) sideIconRail.insertBefore(el, sideIconRail.firstChild);
      else if (sideNameRow) sideNameRow.appendChild(el);
      else block.appendChild(el);
    }
    el.textContent = emoji;
  }

  // ── HOOK CARDS ───────────────────────────────────────────────────────────────
  function hookNewCards() {
    document.querySelectorAll('.card[data-worker]').forEach(function(card) {
      if (_hookedCards.has(card)) return;
      _hookedCards.add(card);
      card.style.position = 'relative';
      var btn = card.querySelector('.mk-emoji-edit-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'mk-emoji-edit-btn';
        btn.title = 'Mainīt emoji';
        btn.innerHTML = '✨';
        btn.setAttribute('data-mk-edit', '1');
        if (card.classList.contains('mk-mid-card')) {
          var rail = card.querySelector('.mk-mid-status-icons');
          if (rail) {
            btn.className += ' mk-mid-emoji-edit';
            rail.appendChild(btn);
          } else {
            btn.style.cssText = 'position:absolute;bottom:22px;right:4px;z-index:10;';
            card.appendChild(btn);
          }
        } else {
          btn.style.cssText = 'position:absolute;bottom:22px;right:4px;z-index:10;';
          card.appendChild(btn);
        }
      }
      updateCardEmoji(card, card.getAttribute('data-worker'));

      // No hover animation here: emoji updates stay static for low CPU/GPU usage.
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

    var gridHtml = buildEmojiGroupsHtml(workerLvl, currentEmoji);

    // ── Live preview ──
    var previewEmoji = currentEmoji || '';
    var workerFirst = (_activeWorker || '').split(' ')[0] || '';
    var workerSur   = (_activeWorker || '').split(' ').slice(1).join(' ') || '';
    var initials    = ((workerFirst[0] || '') + (workerSur[0] || '')).toUpperCase() || '??';
    var emojiCat = getEmojiSection(previewEmoji);
    var previewHtml =
      '<div class="mkp-preview-wrap">' +
        '<div class="mkp-preview-label">Dzīvais priekšskatījums</div>' +
        '<div class="mkp-preview-card" id="mkp-preview-card">' +
          '<div class="mkp-prev-top">' +
            '<div><div class="mkp-prev-init">' + initials + '</div><div class="mkp-prev-side-emoji" id="mkp-preview-emoji">' + previewEmoji + '</div></div>' +
            '<div class="mkp-prev-month"><span>132h</span><em>Mēnesī</em></div>' +
          '</div>' +
          '<div class="mkp-prev-center">' +
            '<span class="mkp-prev-bg-emoji" id="mkp-preview-bg-emoji">' + previewEmoji + '</span>' +
            '<div class="mkp-prev-shift" id="mkp-preview-shift">24</div>' +
            '<div class="mkp-prev-name">' + workerFirst + '</div>' +
            '<div class="mkp-prev-sub">' + workerSur + '</div>' +
          '</div>' +
          '<div class="mkp-prev-segs"><span class="on"></span><span class="on"></span><span class="on-s"></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
        '</div>' +
        '<div class="mkp-picked-meta"><div class="mkp-picked-big" id="mkp-picked-big">' + (previewEmoji || '—') + '</div><div><div id="mkp-picked-name">' + (previewEmoji ? getEmojiName(previewEmoji) : 'Nav izvēlēts') + '</div><span id="mkp-picked-cat">' + (previewEmoji ? (SECTION_TITLES[emojiCat] || '') : '') + '</span></div></div>' +
      '</div>';

    // ── Footer ──
    var syncMode = getSyncMode();
    var dotClass = syncMode === 'local' ? ' mkp-local' : (syncMode === 'github-read' ? ' mkp-github-read' : '');
    var footerHtml =
      '<div class="mkp-footer">' +
        '<button class="mkp-btn mkp-clear" data-mk-clear="1">Noņemt</button>' +
        '<div></div>' +
        '<button class="mkp-btn mkp-save" id="mkp-save">Saglabāt</button>' +
      '</div>';

    inner.innerHTML =
      '<div class="mkp-title"><span>Izvēlies savu emoji</span><button class="mkp-close" data-mk-close="1">×</button></div>' +
      '<div class="mkp-toolbar">' +
        '<label class="mkp-search"><span>⌕</span><input id="mkp-search-input" value="' + String(_emojiQuery || '').replace(/"/g, '&quot;') + '" placeholder="Meklēt emoji..." autocomplete="off"></label>' +
        '<div class="mkp-tabs">' + buildCategoryButtons('mkp-tab') + '</div>' +
      '</div>' +
      '<div class="mkp-body">' +
        '<div class="mkp-left">' + gridHtml + '</div>' +
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

    var searchInput = inner.querySelector('#mkp-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        _emojiQuery = e.target.value || '';
        clearTimeout(_emojiSearchTimer);
        _emojiSearchTimer = setTimeout(renderPicker, 90);
      });
      if (_emojiQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }

    // Emoji click only: no hover transform/drop-shadow.
    inner.querySelectorAll('.mkp-emoji-btn:not(.mkp-locked)').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        previewPickerEmoji(btn.getAttribute('data-emoji'));
      });
      btn.addEventListener('mouseleave', function() {
        previewPickerEmoji(_selectedEmoji);
      });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        selectEmoji(btn.getAttribute('data-emoji'));
        renderPicker();
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
    var bg = document.getElementById('mkp-preview-bg-emoji');
    if (bg) bg.textContent = e || '';
    var big = document.getElementById('mkp-picked-big');
    if (big) big.textContent = e || '—';
    var name = document.getElementById('mkp-picked-name');
    if (name) name.textContent = e ? getEmojiName(e) : 'Nav izvēlēts';
    var cat = document.getElementById('mkp-picked-cat');
    if (cat) cat.textContent = e ? (SECTION_TITLES[getEmojiSection(e)] || '') : '';
    // Update selected state in grid
    if (_pickerEl) {
      _pickerEl.querySelectorAll('.mkp-emoji-btn').forEach(function(b) {
        b.classList.toggle('mkp-selected', b.getAttribute('data-emoji') === e);
      });
    }
  }

  function previewPickerEmoji(e) {
    var pe = document.getElementById('mkp-preview-emoji');
    if (pe) pe.textContent = e || '';
    var bg = document.getElementById('mkp-preview-bg-emoji');
    if (bg) bg.textContent = e || '';
    var big = document.getElementById('mkp-picked-big');
    if (big) big.textContent = e || '—';
    var name = document.getElementById('mkp-picked-name');
    if (name) name.textContent = e ? getEmojiName(e) : 'Nav izvēlēts';
    var cat = document.getElementById('mkp-picked-cat');
    if (cat) cat.textContent = e ? (SECTION_TITLES[getEmojiSection(e)] || '') : '';
  }

  function previewModalEmoji(e) {
    var pe = document.getElementById('mkp-modal-prev-emoji');
    if (pe) pe.textContent = e || '';
    var bg = document.getElementById('mkp-modal-bg-emoji');
    if (bg) bg.textContent = e || '';
    var big = document.getElementById('mkp-modal-picked-big');
    if (big) big.textContent = e || '—';
    var name = document.getElementById('mkp-modal-picked-name');
    if (name) name.textContent = e ? getEmojiName(e) : 'Nav izvēlēts';
    var cat = document.getElementById('mkp-modal-picked-cat');
    if (cat) cat.textContent = e ? (SECTION_TITLES[getEmojiSection(e)] || '') : '';
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
    if (saveBtn) saveBtn.textContent = 'Saglabā...';
    var state = await saveToGist(_activeWorker);
    if (dot) dot.className = 'mkp-sync-dot ' + (
      state === 'github' ? 'mkp-ok' :
      state === 'local' ? 'mkp-local' :
      state === 'github-read' ? 'mkp-github-read' : 'mkp-err'
    );
    if (text) text.textContent =
      state === 'error' ? 'Kļūda' : 'Saglabāts';
    if (saveBtn) saveBtn.textContent =
      state === 'error' ? 'Kļūda' : 'Saglabāts';
    setTimeout(closePicker, 700);
  }

  function openPicker(workerName, anchorEl) {
    _activeWorker = workerName;
    _activeCard   = anchorEl;
    _selectedEmoji = _data[workerName] || null;
    if (!_pickerEl) _pickerEl = buildPicker();

    var isMobileShell = document.documentElement.classList.contains('mk-mobile-shell') || window.innerWidth <= 640;
    _pickerEl.classList.toggle('mkp-mobile', !!isMobileShell);
    _pickerEl.style.display = 'block';
    renderPicker();

    if (isMobileShell) {
      _pickerEl.style.left = '6px';
      _pickerEl.style.right = '6px';
      _pickerEl.style.top = 'auto';
      _pickerEl.style.bottom = 'max(8px, env(safe-area-inset-bottom, 0px))';
      return;
    }

    // Center on screen
    var PW = Math.min(1080, Math.max(720, window.innerWidth - 32)), M = 8;
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
      #mk-emoji-picker.mkp-mobile {
        width:calc(100vw - 12px);
        max-width:none;
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

      #mk-emoji-picker.mkp-mobile .mkp-inner {
        border-radius:18px 18px 16px 16px;
        max-height:min(76vh, 620px);
        box-shadow:0 20px 60px rgba(0,0,0,0.88);
      }
      #mk-emoji-picker.mkp-mobile .mkp-title {
        font-size:8px;
        letter-spacing:2px;
        padding:10px 36px 8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-body {
        flex-direction:column;
      }
      #mk-emoji-picker.mkp-mobile .mkp-left {
        border-right:none;
      }
      #mk-emoji-picker.mkp-mobile .mkp-tabs {
        padding:8px 8px 6px;
        gap:4px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-tab {
        font-size:18px;
        padding:6px 8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-grid {
        grid-template-columns:repeat(6,1fr);
        gap:4px;
        padding:6px 8px 8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-emoji-btn {
        font-size:26px;
        min-height:42px;
        border-radius:10px;
        background:rgba(255,255,255,0.03);
      }
      #mk-emoji-picker.mkp-mobile .mkp-emoji-btn:hover:not(.mkp-locked) {
        transform:none;
      }
      #mk-emoji-picker.mkp-mobile .mkp-preview-wrap {
        width:100%;
        padding:0 8px 8px;
        flex-direction:row;
        align-items:stretch;
        gap:8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-preview-label {
        display:none;
      }
      #mk-emoji-picker.mkp-mobile .mkp-preview-card {
        width:100%;
        max-width:none;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:8px 10px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-prev-top {
        margin-bottom:0;
        gap:8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-prev-shift {
        font-size:22px;
        margin:0;
      }
      #mk-emoji-picker.mkp-mobile .mkp-prev-name {
        font-size:10px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-prev-sub {
        font-size:8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-footer {
        padding:8px;
        gap:8px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-btn {
        min-height:38px;
        font-size:11px;
      }
      #mk-emoji-picker.mkp-mobile .mkp-sync-meta {
        min-width:96px;
      }

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
        background: #14141d;
        border: 1px solid #23232f;
        border-radius: 12px;
        padding: 5px;
        min-width: 155px;
        box-shadow: 0 16px 42px rgba(0,0,0,0.72);
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        animation: none;
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
      .mk-ctx-item:hover { background: rgba(255,255,255,0.07); }
      .mk-ctx-remove { color: rgba(248,113,113,0.8) !important; }
      .mk-ctx-remove:hover { background: rgba(248,113,113,0.12) !important; }
      .mk-ctx-sep { height:1px; background:rgba(255,255,255,0.07); margin:4px 0; }
      .mk-ctx-label {
        padding: 5px 12px 4px;
        font-size: 9px; font-weight: 700;
        color: rgba(255,255,255,0.45);
        letter-spacing: .08em; text-transform: uppercase;
      }

      /* Lightweight picker redesign from EmojiPicker.html */
      .mk-emoji-badge,
      .mk-emoji-badge.mk-emoji-hovered {
        animation:none !important;
        filter:none !important;
        transform:none !important;
        transition:opacity .12s ease !important;
        font-size:18px !important;
      }
      .mk-emoji-badge::before { display:none !important; }
      .mk-emoji-edit-btn {
        background:transparent !important;
        box-shadow:none !important;
        filter:none !important;
      }
      .card:hover .mk-emoji-edit-btn { background:rgba(255,255,255,.08) !important; }
      #mk-emoji-picker {
        width:min(1080px, calc(100vw - 32px)) !important;
        max-width:1080px !important;
      }
      .mkp-inner {
        background:#14141d !important;
        border:1px solid #23232f !important;
        border-radius:22px !important;
        box-shadow:0 26px 70px rgba(0,0,0,.78), inset 0 0 0 1px rgba(255,255,255,.05) !important;
        max-height:min(82vh, 720px) !important;
        display:grid !important;
        grid-template-rows:auto auto minmax(0, 1fr) auto !important;
        overflow:hidden !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
      }
      .mkp-title {
        display:grid !important;
        grid-template-columns:1fr auto 1fr !important;
        align-items:center !important;
        padding:18px 22px !important;
        border-bottom:1px solid #1f1f2a !important;
        color:#b0b0c0 !important;
        font:800 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.22em !important;
        text-transform:uppercase !important;
        text-align:center !important;
      }
      .mkp-title > span { grid-column:2 !important; }
      .mkp-close {
        grid-column:3 !important;
        justify-self:end !important;
        position:static !important;
        transform:none !important;
        width:32px !important;
        height:32px !important;
        border-radius:50% !important;
        display:grid !important;
        place-items:center !important;
        background:#1a1a25 !important;
        border:1px solid #23232f !important;
        color:#b0b0c0 !important;
        font:800 17px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        padding:0 !important;
      }
      .mkp-close:hover { background:#20202c !important; color:#fff !important; }
      .mkp-toolbar {
        display:grid !important;
        grid-template-columns:minmax(190px,280px) 1fr !important;
        gap:14px !important;
        padding:14px 20px !important;
        border-bottom:1px solid #1f1f2a !important;
        background:#14141d !important;
      }
      .mkp-search {
        display:flex !important;
        align-items:center !important;
        gap:8px !important;
        min-width:0 !important;
        background:#1a1a25 !important;
        border:1px solid #23232f !important;
        border-radius:10px !important;
        padding:9px 12px !important;
        color:#7a7a8c !important;
      }
      .mkp-search input {
        width:100% !important;
        min-width:0 !important;
        border:0 !important;
        outline:0 !important;
        background:transparent !important;
        color:#fff !important;
        font:500 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
      }
      .mkp-search input::placeholder { color:#7a7a8c !important; }
      .mkp-tabs {
        display:grid !important;
        grid-template-columns:repeat(8, minmax(0, 1fr)) !important;
        gap:6px !important;
        padding:0 !important;
        overflow:visible !important;
      }
      .mkp-tab {
        position:relative !important;
        height:40px !important;
        border-radius:10px !important;
        border:1px solid transparent !important;
        background:transparent !important;
        color:#fff !important;
        display:grid !important;
        place-items:center !important;
        font-size:20px !important;
        padding:0 !important;
        transition:background .1s, border-color .1s !important;
        transform:none !important;
        box-shadow:none !important;
      }
      .mkp-tab:hover { background:rgba(255,255,255,.04) !important; transform:none !important; }
      .mkp-tab-active {
        background:rgba(255,255,255,.06) !important;
        border-color:rgba(255,255,255,.18) !important;
        box-shadow:none !important;
      }
      .mkp-cat-name {
        position:absolute !important;
        top:44px !important;
        left:50% !important;
        transform:translateX(-50%) !important;
        padding:3px 7px !important;
        border-radius:6px !important;
        background:#1a1a25 !important;
        border:1px solid #23232f !important;
        color:#7a7a8c !important;
        font:800 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.06em !important;
        text-transform:uppercase !important;
        white-space:nowrap !important;
        opacity:0 !important;
        pointer-events:none !important;
        z-index:5 !important;
      }
      .mkp-tab:hover .mkp-cat-name { opacity:1 !important; }
      .mkp-body {
        display:grid !important;
        grid-template-columns:minmax(0, 1fr) 280px !important;
        min-height:0 !important;
        overflow:hidden !important;
        background:#14141d !important;
      }
      .mkp-left {
        min-width:0 !important;
        border-right:1px solid #1f1f2a !important;
        overflow:auto !important;
        padding:16px 20px !important;
        contain:layout style paint !important;
      }
      .mkp-group {
        margin:0 0 26px !important;
      }
      .mkp-group:last-child {
        margin-bottom:0 !important;
      }
      .mkp-group h5 {
        margin:0 0 18px !important;
        color:#7a7a8c !important;
        font:900 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.22em !important;
        text-transform:uppercase !important;
      }
      .mkp-grid {
        display:grid !important;
        grid-template-columns:repeat(9, minmax(0, 1fr)) !important;
        gap:18px 26px !important;
        padding:0 !important;
        overflow:visible !important;
        scrollbar-width:thin !important;
        scrollbar-color:#343442 transparent !important;
        contain:layout style !important;
      }
      .mkp-empty {
        grid-column:1 / -1 !important;
        color:#7a7a8c !important;
        font:700 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        padding:28px 8px !important;
        text-align:center !important;
      }
      .mkp-emoji-btn {
        border:1px solid transparent !important;
        background:transparent !important;
        border-radius:10px !important;
        font-size:26px !important;
        aspect-ratio:1 / 1 !important;
        display:grid !important;
        place-items:center !important;
        cursor:pointer !important;
        padding:0 !important;
        transform:none !important;
        filter:none !important;
        box-shadow:none !important;
        transition:background .1s, border-color .1s !important;
        contain:layout style !important;
      }
      .mkp-emoji-btn:hover:not(.mkp-locked) {
        transform:none !important;
        filter:none !important;
        background:rgba(255,255,255,.05) !important;
        border-color:rgba(255,255,255,.10) !important;
        z-index:auto !important;
      }
      .mkp-emoji-btn.mkp-selected {
        background:rgba(255,255,255,.12) !important;
        border-color:rgba(255,255,255,.62) !important;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.24) !important;
      }
      .mkp-locked { opacity:.45 !important; cursor:not-allowed !important; }
      .mkp-lock-emoji { filter:grayscale(1) !important; }
      .mkp-preview-wrap {
        width:auto !important;
        padding:18px !important;
        display:flex !important;
        flex-direction:column !important;
        gap:14px !important;
        align-items:stretch !important;
        border-left:0 !important;
      }
      .mkp-preview-label {
        display:block !important;
        color:#7a7a8c !important;
        font:800 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.18em !important;
        text-transform:uppercase !important;
        text-align:center !important;
      }
      .mkp-preview-card {
        position:relative !important;
        overflow:hidden !important;
        width:100% !important;
        height:220px !important;
        display:grid !important;
        grid-template-rows:auto 1fr auto !important;
        padding:14px !important;
        border-radius:18px !important;
        background:#14141d !important;
        border:1px solid #20202c !important;
        box-shadow:inset 0 0 0 1px rgba(255,107,122,.22) !important;
        text-align:initial !important;
      }
      .mkp-prev-top {
        display:flex !important;
        align-items:flex-start !important;
        justify-content:space-between !important;
        margin:0 !important;
        position:relative !important;
        z-index:2 !important;
      }
      .mkp-prev-init {
        display:block !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        color:rgba(255,107,122,.32) !important;
        font:900 28px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.02em !important;
      }
      .mkp-prev-side-emoji {
        margin-top:4px !important;
        font-size:20px !important;
        line-height:1 !important;
      }
      .mkp-prev-month {
        text-align:right !important;
        line-height:1.15 !important;
      }
      .mkp-prev-month span {
        display:block !important;
        color:#fff !important;
        font:900 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        font-variant-numeric:tabular-nums !important;
      }
      .mkp-prev-month em {
        display:block !important;
        margin-top:2px !important;
        color:#7a7a8c !important;
        font:800 8px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.14em !important;
        text-transform:uppercase !important;
        font-style:normal !important;
      }
      .mkp-prev-center {
        position:relative !important;
        align-self:center !important;
        text-align:center !important;
      }
      .mkp-prev-bg-emoji {
        position:absolute !important;
        top:50% !important;
        left:50% !important;
        transform:translate(-50%, -58%) !important;
        font-size:110px !important;
        line-height:1 !important;
        opacity:.14 !important;
        pointer-events:none !important;
        user-select:none !important;
      }
      .mkp-prev-shift {
        position:relative !important;
        z-index:1 !important;
        margin:0 !important;
        color:#ff6b7a !important;
        font:900 42px/.95 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:-.03em !important;
        font-variant-numeric:tabular-nums !important;
      }
      .mkp-prev-name {
        position:relative !important;
        z-index:1 !important;
        margin-top:6px !important;
        color:#fff !important;
        font:900 16px/1.08 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
      }
      .mkp-prev-sub {
        position:relative !important;
        z-index:1 !important;
        margin-top:2px !important;
        color:#fff !important;
        font:700 12px/1.1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
      }
      .mkp-prev-segs {
        display:grid !important;
        grid-template-columns:repeat(10, 1fr) !important;
        gap:3px !important;
        position:relative !important;
        z-index:2 !important;
      }
      .mkp-prev-segs span {
        height:6px !important;
        border-radius:2px !important;
        background:#23232f !important;
      }
      .mkp-prev-segs span.on { background:rgba(251,191,36,.40) !important; }
      .mkp-prev-segs span.on-s { background:#fbbf24 !important; }
      .mkp-picked-meta {
        display:grid !important;
        grid-template-columns:auto 1fr !important;
        align-items:center !important;
        gap:12px !important;
        padding:10px 12px !important;
        border-radius:12px !important;
        background:#1a1a25 !important;
        border:1px solid #23232f !important;
      }
      .mkp-picked-big {
        font-size:32px !important;
        line-height:1 !important;
      }
      .mkp-picked-meta div div {
        color:#fff !important;
        font:800 13px/1.15 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
      }
      .mkp-picked-meta span {
        display:block !important;
        margin-top:3px !important;
        color:#7a7a8c !important;
        font:800 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:.08em !important;
        text-transform:uppercase !important;
      }
      .mkp-footer {
        display:grid !important;
        grid-template-columns:auto 1fr auto !important;
        align-items:center !important;
        gap:12px !important;
        padding:14px 18px !important;
        border-top:1px solid #1f1f2a !important;
        background:#14141d !important;
      }
      .mkp-btn {
        flex:initial !important;
        height:40px !important;
        padding:0 18px !important;
        border-radius:10px !important;
        border:1px solid #23232f !important;
        background:#1a1a25 !important;
        color:#b0b0c0 !important;
        font:800 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        box-shadow:none !important;
      }
      .mkp-btn:hover { background:#20202c !important; color:#fff !important; }
      .mkp-save {
        background:#34d399 !important;
        color:#04241a !important;
        border-color:transparent !important;
        padding:0 22px !important;
      }
      .mkp-sync-meta {
        display:none !important;
        min-width:0 !important;
      }
      .mkp-sync-dot {
        box-shadow:none !important;
        animation:none !important;
      }
      .mkp-sync-text {
        color:#7a7a8c !important;
        font:700 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
        letter-spacing:0 !important;
        text-transform:none !important;
      }
      .mkp-modal-body {
        grid-template-columns:minmax(0, 1fr) 240px !important;
      }
      #modal-emoji-view .mkp-toolbar {
        padding:0 0 14px !important;
        border-bottom:0 !important;
      }
      #modal-emoji-view .mkp-grid {
        max-height:none !important;
        overflow:visible !important;
        padding:0 !important;
      }
      #modal-emoji-view .mkp-left {
        padding:0 14px 0 0 !important;
        border-right:0 !important;
        max-height:min(44vh, 430px) !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        scrollbar-width:none !important;
      }
      #modal-emoji-view .mkp-left::-webkit-scrollbar {
        width:0 !important;
        height:0 !important;
      }
      #modal-emoji-view .mkp-preview-wrap {
        padding:0 0 0 14px !important;
      }
      #modal-emoji-view .mkp-footer {
        padding:14px 0 0 !important;
        border-top:1px solid #1f1f2a !important;
      }
      #mk-emoji-picker.mkp-mobile .mkp-inner {
        max-height:min(78vh, 680px) !important;
      }
      #mk-emoji-picker.mkp-mobile .mkp-toolbar,
      #modal-emoji-view .mkp-toolbar {
        grid-template-columns:1fr !important;
      }
      #mk-emoji-picker.mkp-mobile .mkp-tabs,
      #modal-emoji-view .mkp-tabs {
        grid-template-columns:repeat(8, minmax(34px, 1fr)) !important;
      }
      #mk-emoji-picker.mkp-mobile .mkp-body,
      #modal-emoji-view .mkp-modal-body {
        grid-template-columns:1fr !important;
      }
      #mk-emoji-picker.mkp-mobile .mkp-preview-wrap,
      #modal-emoji-view .mkp-preview-wrap {
        display:none !important;
      }
      #mk-emoji-picker.mkp-mobile .mkp-grid,
      #modal-emoji-view .mkp-grid {
        grid-template-columns:repeat(8, minmax(0, 1fr)) !important;
      }
      @media (max-width: 720px) {
        .mkp-body { grid-template-columns:1fr !important; }
        .mkp-preview-wrap { display:none !important; }
        .mkp-toolbar { grid-template-columns:1fr !important; }
        .mkp-tabs { grid-template-columns:repeat(8, minmax(34px, 1fr)) !important; }
        .mkp-grid { grid-template-columns:repeat(7, minmax(0, 1fr)) !important; }
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
    var hookTimer = 0;
    var mo = new MutationObserver(function() {
      clearTimeout(hookTimer);
      hookTimer = setTimeout(hookNewCards, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });
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
    if (_activeWorker !== workerName) {
      _activeWorker = workerName;
      _selectedEmoji = current;
    }
    var _sel = _selectedEmoji;
    var workerFirst = workerName.split(' ')[0] || '';
    var workerSur   = workerName.split(' ').slice(1).join(' ') || '';
    var initials    = ((workerFirst[0]||'') + (workerSur[0]||'')).toUpperCase();

    var grid = buildEmojiGroupsHtml(workerLvl, _sel);

    var footer =
      '<div class="mkp-footer" style="padding:8px 0 0;">' +
        '<button class="mkp-btn mkp-clear" data-mk-modal-clear="1">Noņemt</button>' +
        '<div></div>' +
        '<button class="mkp-btn mkp-save" id="mkp-modal-save">Saglabāt</button>' +
      '</div>';

    var emojiCat = getEmojiSection(_sel || '');
    var preview =
      '<div class="mkp-preview-wrap mkp-modal-preview">' +
        '<div class="mkp-preview-label">Dzīvais priekšskatījums</div>' +
        '<div class="mkp-preview-card">' +
          '<div class="mkp-prev-top">' +
            '<div><div class="mkp-prev-init">' + initials + '</div><div class="mkp-prev-side-emoji" id="mkp-modal-prev-emoji">' + (_sel||'') + '</div></div>' +
            '<div class="mkp-prev-month"><span>132h</span><em>Mēnesī</em></div>' +
          '</div>' +
          '<div class="mkp-prev-center">' +
            '<span class="mkp-prev-bg-emoji" id="mkp-modal-bg-emoji">' + (_sel||'') + '</span>' +
            '<div class="mkp-prev-shift">24</div>' +
            '<div class="mkp-prev-name">' + workerFirst + '</div>' +
            '<div class="mkp-prev-sub">' + workerSur + '</div>' +
          '</div>' +
          '<div class="mkp-prev-segs"><span class="on"></span><span class="on"></span><span class="on-s"></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
        '</div>' +
        '<div class="mkp-picked-meta"><div class="mkp-picked-big" id="mkp-modal-picked-big">' + (_sel || '—') + '</div><div><div id="mkp-modal-picked-name">' + (_sel ? getEmojiName(_sel) : 'Nav izvēlēts') + '</div><span id="mkp-modal-picked-cat">' + (_sel ? (SECTION_TITLES[emojiCat] || '') : '') + '</span></div></div>' +
      '</div>';

    container.innerHTML =
      '<div class="mkp-toolbar">' +
        '<label class="mkp-search"><span>⌕</span><input id="mkp-modal-search-input" value="' + String(_emojiQuery || '').replace(/"/g, '&quot;') + '" placeholder="Meklēt emoji..." autocomplete="off"></label>' +
        '<div class="mkp-tabs">' + buildCategoryButtons('mkp-tab') + '</div>' +
      '</div>' +
      '<div class="mkp-body mkp-modal-body">' +
        '<div class="mkp-left">' + grid + '</div>' +
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

    var searchInput = container.querySelector('#mkp-modal-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        _emojiQuery = e.target.value || '';
        clearTimeout(_emojiSearchTimer);
        _emojiSearchTimer = setTimeout(function(){ renderInModal(container); }, 90);
      });
      if (_emojiQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }

    // Emoji clicks
    container.querySelectorAll('.mkp-emoji-btn:not(.mkp-locked)').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        previewModalEmoji(btn.getAttribute('data-emoji'));
      });
      btn.addEventListener('mouseleave', function() {
        previewModalEmoji(_selectedEmoji);
      });
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _sel = btn.getAttribute('data-emoji');
        _selectedEmoji = _sel;
        container.querySelectorAll('.mkp-emoji-btn').forEach(function(b) {
          b.classList.toggle('mkp-selected', b.getAttribute('data-emoji') === _sel);
        });
        // Lock preview on click
        var pe = document.getElementById('mkp-modal-prev-emoji');
        if (pe) pe.textContent = _sel || '';
        var bg = document.getElementById('mkp-modal-bg-emoji');
        if (bg) bg.textContent = _sel || '';
        var big = document.getElementById('mkp-modal-picked-big');
        if (big) big.textContent = _sel || '—';
        var name = document.getElementById('mkp-modal-picked-name');
        if (name) name.textContent = _sel ? getEmojiName(_sel) : 'Nav izvēlēts';
        var cat = document.getElementById('mkp-modal-picked-cat');
        if (cat) cat.textContent = _sel ? (SECTION_TITLES[getEmojiSection(_sel)] || '') : '';
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
      _selectedEmoji = null;
      container.querySelectorAll('.mkp-emoji-btn').forEach(function(b) { b.classList.remove('mkp-selected'); });
      var pe = document.getElementById('mkp-modal-prev-emoji');
      var bg = document.getElementById('mkp-modal-bg-emoji');
      var big = document.getElementById('mkp-modal-picked-big');
      var name = document.getElementById('mkp-modal-picked-name');
      var cat = document.getElementById('mkp-modal-picked-cat');
      if (pe) pe.textContent = '';
      if (bg) bg.textContent = '';
      if (big) big.textContent = '—';
      if (name) name.textContent = 'Nav izvēlēts';
      if (cat) cat.textContent = '';
    });

    // Save
    var saveBtn = document.getElementById('mkp-modal-save');
    var dot = document.getElementById('mkp-modal-dot');
    var syncText = document.getElementById('mkp-modal-sync-text');
    if (saveBtn) saveBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      _sel = _selectedEmoji;
      if (_sel) _data[workerName] = _sel;
      else delete _data[workerName];
      refreshAllCards();
      if (dot) dot.className = 'mkp-sync-dot mkp-syncing';
      saveBtn.textContent = 'Saglabā...';
      var state = await saveToGist(workerName);
      if (dot) dot.className = 'mkp-sync-dot ' + (
        state === 'github' ? 'mkp-ok' :
        state === 'local' ? 'mkp-local' :
        state === 'github-read' ? 'mkp-github-read' : 'mkp-err'
      );
      if (syncText) syncText.textContent =
        state === 'error' ? 'Kļūda' : 'Saglabāts';
      saveBtn.textContent =
        state === 'error' ? 'Kļūda' : 'Saglabāts';
    });
  }

  window.MinkaEmoji = {
    get: function(name) { return _data[name] || null; },
    refresh: refreshAllCards,
    reload: loadFromGist,
    renderInModal: renderInModal
  };
})();
