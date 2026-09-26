/* Bolusa maiņa (ulrich CT motion šļūtenes 24h uzskaite): viens modulis
   datoram (index.html) un telefonam (mobile.html). Stili: css/bolus.css
   (izkārtojums) un css/bolus-m3.css (M3 slānis); pārējos stilus modulis
   ievieto pats (_injectCss). */
// ============================================================
// BOLUS IZSEKOTĀJS — ulrich ctmotion 24h šļūtenes tracker
// ============================================================
(function(){
  'use strict';
  function _mkToast(msg, type) {
    var t = document.getElementById('mk-toast') || (function(){ var el = document.createElement('div'); el.id = 'mk-toast'; document.body.appendChild(el); return el; })();
    t.textContent = msg;
    t.className = 'mk-show' + (type === 'error' ? ' mk-err' : type === 'ok' ? ' mk-ok' : '');
    clearTimeout(t._to);
    t._to = setTimeout(function(){ t.className = ''; }, 3000);
  }
  var STORE_KEY = 'minkaBolusV3';
  var HISTORY_KEY = 'minkaBolusHistoryV1';
  // Bolus lives in Cloudflare D1 behind the same login as the schedule (the
  // Apps Script sheet it replaced was readable by anyone and took ~3 s). The
  // worker keeps the old sheet up to date as an archive.
  var BOLUS_API = 'https://minka-api.gamernr1elite.workers.dev/api/bolus';
  function _bolusHeaders(json) {
    var token = '';
    try { token = sessionStorage.getItem('minka_api_token_v1') || localStorage.getItem('minka_api_token_v1') || ''; } catch(e) {}
    var headers = token ? { authorization: 'Bearer ' + token } : {};
    if (json) headers['content-type'] = 'application/json';
    return headers;
  }
  function _bolusPost(body) {
    return fetch(BOLUS_API, { method: 'POST', headers: _bolusHeaders(true), body: JSON.stringify(body) });
  }
  var WARN_MS   = 24 * 60 * 60 * 1000; // 24h
  // Divi kabineti — GE un PHILIPS
  var ROOMS = [
    { id: 'ge',      label: 'GE',      color: '#0a84ff' },
    { id: 'philips', label: 'PHILIPS', color: '#30d158' }
  ];
  var _state = {
    ge:      { changedAt: null },
    philips: { changedAt: null }
  };
  var _lastLocalWriteAt = { ge: 0, philips: 0 };
  // Local history edits/deletes: block remote history overwrite briefly and
  // track inline editor state per room (-1 = nothing open)
  var _lastLocalHistWriteAt = { ge: 0, philips: 0 };
  var _histEdit = { ge: -1, philips: -1 };
  var _histDel = { ge: -1, philips: -1 };
  var _histExpanded = { ge: false, philips: false };
  var _history = { ge: [], philips: [] }; // entries: {ts, name}
  var MEDIA_DRAFT_KEY = 'minkaBolusMediaDraftV1';
  function _newMediaDraft() {
    return {
      left:  { enabled: false, concentration: 370, volumeMl: 500 },
      nacl:  { enabled: false, volumeMl: 1000 },
      right: { enabled: false, concentration: 300, volumeMl: 500 }
    };
  }
  var _mediaDraft = { ge: _newMediaDraft(), philips: _newMediaDraft() };
  var _mediaFocus = { ge: 'left', philips: 'left' };
  var _mediaChooserOpen = { ge: false, philips: false };
  // The rack is not device-local state: it must show what the newest logged
  // change actually carried, so a selection made on one computer is visible
  // on every other one. MEDIA_SYNC_KEY remembers which history entry the
  // local rack already mirrors.
  var MEDIA_SYNC_KEY = 'minkaBolusMediaSyncV1';
  var _mediaSyncTs = { ge: 0, philips: 0 };
  var _lastMediaTouchAt = { ge: 0, philips: 0 };
  // keepNaclVolume is for history text only: past records keep the volume they
  // were saved with, while the live rack always shows the current 1000 ml bag.
  function _sanitizeMedia(value, keepNaclVolume) {
    var src = value && typeof value === 'object' ? value : {};
    var clean = _newMediaDraft();
    ['left', 'right'].forEach(function(side) {
      var slot = src[side] && typeof src[side] === 'object' ? src[side] : {};
      var concentration = Number(slot.concentration);
      var volumeMl = Number(slot.volumeMl);
      clean[side].concentration = concentration === 300 ? 300 : 370;
      if (side === 'right' && concentration !== 300 && concentration !== 370) clean[side].concentration = 300;
      clean[side].volumeMl = volumeMl === 200 ? 200 : 500;
      clean[side].enabled = slot.enabled === true || slot.enabled === 1 || slot.enabled === '1';
    });
    var nacl = src.nacl && typeof src.nacl === 'object' ? src.nacl : {};
    clean.nacl.enabled = nacl.enabled === true || nacl.enabled === 1 || nacl.enabled === '1';
    clean.nacl.volumeMl = keepNaclVolume && Number(nacl.volumeMl) === 500 ? 500 : 1000;
    return clean;
  }
  function _mediaSnapshot(roomId) {
    var media = _sanitizeMedia(_mediaDraft[roomId]);
    if (!media.left.enabled && !media.nacl.enabled && !media.right.enabled) return null;
    return media;
  }
  function _saveMediaDraft() {
    try { localStorage.setItem(MEDIA_DRAFT_KEY, JSON.stringify(_mediaDraft)); } catch(e) {}
  }
  function _saveMediaSync() {
    try { localStorage.setItem(MEDIA_SYNC_KEY, JSON.stringify(_mediaSyncTs)); } catch(e) {}
  }
  function _markMediaTouch(roomId) {
    _lastMediaTouchAt[roomId] = Date.now();
  }
  // Adopt the media of the newest history entry — that is the set currently in
  // the machine, whichever device recorded it. Someone who is picking bottles
  // right now keeps their own draft until they save it.
  function _syncMediaFromHistory(roomId) {
    var top = (_history[roomId] || [])[0];
    var ts = top ? (top.ts || top) : 0;
    if (!ts || ts === _mediaSyncTs[roomId]) return false;
    if (_mediaChooserOpen[roomId] || _recordStep[roomId] ||
        Date.now() - (_lastMediaTouchAt[roomId] || 0) < 90000) return false;
    _mediaSyncTs[roomId] = ts;
    _saveMediaSync();
    // An entry logged without media (older app, phone) must not wipe the rack —
    // only a recorded set replaces what is shown.
    if (!top.media) return false;
    _mediaDraft[roomId] = _sanitizeMedia(top.media);
    _saveMediaDraft();
    return true;
  }
  function _mediaSummary(media) {
    var m = _sanitizeMedia(media, true);
    var parts = [];
    if (m.left.enabled) parts.push('K: U' + m.left.concentration + ' · ' + m.left.volumeMl + ' ml');
    if (m.nacl.enabled) parts.push('NaCl · ' + m.nacl.volumeMl + ' ml');
    if (m.right.enabled) parts.push('L: U' + m.right.concentration + ' · ' + m.right.volumeMl + ' ml');
    return parts.join(' | ');
  }
  var _names = { ge: '', philips: '' };
  try { _names.ge      = localStorage.getItem('minkaBolusName_ge')      || ''; } catch(e) {}
  try { _names.philips = localStorage.getItem('minkaBolusName_philips') || ''; } catch(e) {}
  var _workersCache = {}; // { 'DD.MM.YYYY': ['Name1', ...] }
  function _tsToDateStr(ts) {
    var d = ts ? new Date(ts) : new Date();
    return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear();
  }
  function _workersForTs(ts) {
    return _workersCache[_tsToDateStr(ts)] || [];
  }
  function _collectWorkersFromStore(storeObj, dateStr, seen, out) {
    if (!storeObj || typeof storeObj !== 'object' || !dateStr) return;
    for (var month in storeObj) {
      var days = storeObj[month];
      if (!Array.isArray(days)) continue;
      for (var i = 0; i < days.length; i++) {
        var day = days[i];
        if (!day || day.date !== dateStr || !Array.isArray(day.workers)) continue;
        day.workers.forEach(function(w) {
          var name = String((w && w.name) || '').trim();
          if (!name || seen[name]) return;
          seen[name] = 1;
          out.push(name);
        });
      }
    }
  }
  function _directWorkersForDate(dateStr) {
    var out = [];
    var seen = {};
    try {
      var frames = document.querySelectorAll('iframe');
      frames.forEach(function(f) {
        try {
          var win = f && f.contentWindow;
          if (!win) return;
          _collectWorkersFromStore(win.__grafiksStore, dateStr, seen, out);
        } catch(_e) {}
      });
    } catch(_e) {}
    return out;
  }
  function _ensureWorkersForDate(dateStr) {
    dateStr = String(dateStr || '').trim();
    if (!dateStr) return [];
    if (Array.isArray(_workersCache[dateStr]) && _workersCache[dateStr].length) return _workersCache[dateStr];
    var direct = _directWorkersForDate(dateStr);
    if (direct.length) {
      _workersCache[dateStr] = direct;
      return direct;
    }
    try {
      var calendarFrame = document.getElementById('calIframe');
      if (calendarFrame && calendarFrame.contentWindow) {
        calendarFrame.contentWindow.postMessage({ type: 'mk_request_workers_for_date', date: dateStr }, window.location.origin);
      }
    } catch(_e) {}
    return _workersCache[dateStr] || [];
  }
  // Receive full workers index pushed by calendar on load
  window.addEventListener('message', function(e) {
    var calendarFrame = document.getElementById('calIframe');
    if (e.origin !== window.location.origin || !calendarFrame || e.source !== calendarFrame.contentWindow) return;
    if (!e || !e.data) return;
    if (e.data.type === 'mk_workers_index' && e.data.data) {
      _workersCache = e.data.data;
      if (_open) _render();
      return;
    }
    if (e.data.type === 'mk_workers_result' && e.data.date) {
      _workersCache[e.data.date] = e.data.workers || [];
      if (_open) _render();
    }
  });
  // Picker state
  var _pick     = { ge: null, philips: null }; // working ts (null = use saved)
  var _recordStep = { ge: 0, philips: 0 }; // 0: button, 1: choose person, 2: choose time and save
  var _calOpen  = { ge: false, philips: false };
  var _calView  = { ge: null,  philips: null  }; // {y,m} of calendar view
  var _tpOpen   = { ge: false, philips: false };
  var _chipDay  = { ge: 0, philips: 0 }; // day offset from today for worker chips (0=today,-1=yesterday)
  var LAT_MONTHS = ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'];
  var LAT_DAYS   = ['P','O','T','C','Pk','S','Sv'];
  function _shiftStart() {
    var now = new Date();
    var s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
    if (now.getHours() < 8) s.setDate(s.getDate() - 1);
    return s.getTime();
  }
  function _pickTs(room) {
    if (_pick[room] !== null) return _pick[room];
    var saved = _state[room].changedAt;
    if (!saved) return Date.now();
    if (saved < _shiftStart()) {
      var d = new Date(saved), t = new Date();
      var candidate = new Date(t.getFullYear(), t.getMonth(), t.getDate(), d.getHours(), d.getMinutes(), 0);
      // Before today's saved clock time, the matching past event was yesterday.
      // Never synthesize a future bolus timestamp from an old saved value.
      if (candidate.getTime() > Date.now()) candidate.setDate(candidate.getDate() - 1);
      return candidate.getTime();
    }
    return saved;
  }
  function _buildCal(room) {
    var cv = _calView[room]; var y = cv.y, m = cv.m;
    var sel = new Date(_pickTs(room)); var now = new Date();
    var first = new Date(y,m,1).getDay(); first = first===0?6:first-1;
    var dim = new Date(y,m+1,0).getDate();
    var hd = LAT_DAYS.map(function(d){ return '<div class="bcd-hd">'+d+'</div>'; }).join('');
    var cells = '';
    for (var i=0;i<first;i++) cells += '<div></div>';
    for (var d=1;d<=dim;d++) {
      var isT = now.getDate()===d&&now.getMonth()===m&&now.getFullYear()===y;
      var isS = sel.getDate()===d&&sel.getMonth()===m&&sel.getFullYear()===y;
      cells += '<button class="bcd'+(isT?' bcd-t':'')+(isS?' bcd-s':'')+'" data-room="'+room+'" data-y="'+y+'" data-m="'+m+'" data-d="'+d+'">'+d+'</button>';
    }
    return '<div class="bnm-caldrop">'+
      '<div class="bnm-calh">'+
        '<button class="bnm-cnav" data-room="'+room+'" data-dir="-1">‹</button>'+
        '<span>'+LAT_MONTHS[m]+' '+y+'</span>'+
        '<button class="bnm-cnav" data-room="'+room+'" data-dir="1">›</button>'+
      '</div>'+
      '<div class="bnm-calgrid">'+hd+cells+'</div>'+
    '</div>';
  }
  function _buildTp(room) {
    var d = new Date(_pickTs(room));
    var h = d.getHours(), mn = d.getMinutes();
    function col(unit, val) {
      return '<div class="bnm-tpcol">'+
        '<button class="bnm-tpa" data-room="'+room+'" data-unit="'+unit+'" data-dir="1">▲</button>'+
        '<div class="bnm-tpv" id="bnm-'+unit+'-'+room+'">'+('0'+val).slice(-2)+'</div>'+
        '<button class="bnm-tpa" data-room="'+room+'" data-unit="'+unit+'" data-dir="-1">▼</button>'+
      '</div>';
    }
    return '<div class="bnm-tpdrop">'+col('h',h)+'<div class="bnm-tpsep">:</div>'+col('m',mn)+'</div>';
  }
  var _open = false, _tick = null, _bc = null;
  var _syncTimer = null, _lastSyncAt = 0;
  try { _bc = new BroadcastChannel('minka-bolus-sync'); } catch(e) {}

  function _bcSync() {
    if (_bc) try { _bc.postMessage({ type: 'bolus', state: JSON.parse(JSON.stringify(_state)), history: JSON.parse(JSON.stringify(_history)) }); } catch(e) {}
  }
  function _kvPush(roomId) {
    var ts = _state[roomId] && _state[roomId].changedAt;
    var body = { action: 'write', room: roomId, ts: ts, name: _names[roomId] || 'Anonīms' };
    var latest = _history[roomId] && _history[roomId][0];
    var media = latest && latest.media ? _sanitizeMedia(latest.media) : null;
    if (media) {
      if (media.left.enabled) { body.leftConc = media.left.concentration; body.leftMl = media.left.volumeMl; }
      if (media.nacl.enabled) body.naclMl = media.nacl.volumeMl;
      if (media.right.enabled) { body.rightConc = media.right.concentration; body.rightMl = media.right.volumeMl; }
    }
    if (ts) _bolusPost(body).then(function(r){ if (!r.ok) throw new Error('Bolus save failed'); return r.json(); }).then(function(result){
      if (!result || result.ok !== true) throw new Error('Bolus save rejected');
      _mkToast('Saglabāts', 'ok');
    }).catch(function(){ _mkToast('Bolusa saglabāšana neizdevās', 'error'); });
    _bcSync();
  }
  // Edit/delete a single history entry on the server.
  function _kvEntryOp(action, roomId, params) {
    var body = { action: action, room: roomId, ts: params.ts };
    if (params.oldTs) body.oldTs = params.oldTs;
    if (params.name !== undefined) body.name = params.name || 'Anonīms';
    _bolusPost(body).then(function(r){ return r.json(); }).then(function(j) {
      if (j && j.ok) _mkToast(action === 'delete_entry' ? 'Ieraksts dzēsts ✓' : 'Ieraksts izlabots ✓', 'ok');
      else if (j && j.error === 'not_found') _mkToast('Ieraksts serverī nav atrasts — izmaiņa redzama tikai šajā ierīcē', 'error');
      else _mkToast('Neizdevās saglabāt — izmaiņa redzama tikai šajā ierīcē', 'error');
    }).catch(function(){ _mkToast('Nav savienojuma — izmaiņa redzama tikai šajā ierīcē', 'error'); });
  }
  // The newest history entry drives the ring — recompute after edit/delete
  function _recalcChangedAt(roomId) {
    var top = _history[roomId] && _history[roomId][0];
    _state[roomId].changedAt = top ? (top.ts || top) : null;
  }
  function _applyHistEdit(roomId, i, newTs, newName) {
    var entry = _history[roomId] && _history[roomId][i];
    if (!entry) return;
    var oldTs = entry.ts || entry;
    var safeName = String(newName || '').trim().slice(0, 60) || 'Anonīms';
    _history[roomId][i] = { ts: newTs, name: safeName, media: entry.media || null };
    _history[roomId].sort(function(a, b) { return (b.ts || b) - (a.ts || a); });
    _histEdit[roomId] = -1;
    _recalcChangedAt(roomId);
    _markLocalWrite(roomId); _markLocalHistWrite(roomId);
    _save(); _saveHistory(); _render(); _updateLed();
    _kvEntryOp('edit_entry', roomId, { oldTs: oldTs, ts: newTs, name: safeName });
    _bcSync();
  }
  function _applyHistDelete(roomId, i) {
    var entry = _history[roomId] && _history[roomId][i];
    if (!entry) return;
    var ts = entry.ts || entry;
    _history[roomId].splice(i, 1);
    _histDel[roomId] = -1;
    _recalcChangedAt(roomId);
    _markLocalWrite(roomId); _markLocalHistWrite(roomId);
    _save(); _saveHistory(); _render(); _updateLed();
    _kvEntryOp('delete_entry', roomId, { ts: ts });
    _bcSync();
  }
  function _markLocalWrite(roomId) {
    _lastLocalWriteAt[roomId] = Date.now();
  }
  function _markLocalHistWrite(roomId) {
    _lastLocalHistWriteAt[roomId] = Date.now();
  }
  function _remoteHistOverwriteAllowed(roomId) {
    return (Date.now() - (_lastLocalHistWriteAt[roomId] || 0)) > 90000;
  }

  // ── Gamification: month leaderboard, champion crown, personal thanks ──
  function _escHtml(v) {
    return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _splitNames(raw) {
    return String(raw || '').split(/[\/+&,]/).map(function(x){ return x.trim(); })
      .filter(function(x){ return x && x.toLowerCase() !== 'anonīms'; });
  }
  function _monthTop(limit) {
    var now = new Date(), y = now.getFullYear(), mo = now.getMonth();
    var counts = {}, disp = {};
    ROOMS.forEach(function(r) {
      (_history[r.id] || []).forEach(function(e) {
        var d = new Date(e.ts || e);
        if (d.getFullYear() !== y || d.getMonth() !== mo) return;
        _splitNames(e.name).forEach(function(n) {
          var k = n.toUpperCase();
          counts[k] = (counts[k] || 0) + 1;
          if (!disp[k]) disp[k] = n;
        });
      });
    });
    return Object.keys(counts).map(function(k) { return { key: k, name: disp[k], count: counts[k] }; })
      .sort(function(a, b) { return b.count - a.count || a.name.localeCompare(b.name); })
      .slice(0, limit || 5);
  }
  var _champ = null, _champAt = 0;
  function _updateChamp() {
    var t = _monthTop(1);
    _champ = (t[0] && t[0].count >= 2) ? t[0] : null;
    _champAt = Date.now();
  }
  function _updateChampCached() { if (Date.now() - _champAt > 60000) _updateChamp(); }
  function _isChamp(name) {
    if (!_champ) return false;
    if (String(name || '').trim().toUpperCase() === _champ.key) return true;
    return _splitNames(name).some(function(n){ return n.toUpperCase() === _champ.key; });
  }
  function _prettyFirst(n) {
    var f = String(n || '').trim().split(/\s+/)[0] || '';
    return f ? f.charAt(0).toUpperCase() + f.slice(1).toLowerCase() : '';
  }
  function _renderTops() {
    var p = document.getElementById('bolus-tops');
    if (!p) return;
    _updateChamp();
    var MO = ['janvārī','februārī','martā','aprīlī','maijā','jūnijā','jūlijā','augustā','septembrī','oktobrī','novembrī','decembrī'];
    var top = _monthTop(5), medals = ['👑','🥈','🥉','4.','5.'];
    p.innerHTML = '<div class="btops-h">Čaklākie bolusa mainītāji ' + MO[new Date().getMonth()] + '</div>' +
      (top.length ? top.map(function(t, i) {
        return '<div class="btops-row' + (i === 0 ? ' btops-first' : '') + '">' +
          '<span class="btops-medal">' + medals[i] + '</span>' +
          '<span class="btops-name">' + _escHtml(t.name) + '</span>' +
          '<span class="btops-cnt">' + t.count + '×</span></div>';
      }).join('') : '<div class="btops-row">Šomēnes vēl nav ierakstu</div>');
  }
  function _remoteOverwriteAllowed(roomId) {
    return (Date.now() - (_lastLocalWriteAt[roomId] || 0)) > 15000;
  }
  var _pullPromise = null;
  // Pēc pārlūka vēstures/datu dzēšanas ierīcē nav nekā saglabāta, un pirmais
  // Apps Script pieprasījums (auksts savienojums/skripts) var ilgt ilgāk par 20 s.
  // Kamēr neesam saņēmuši datus, gaidām ilgāk un mēģinām atkal drīz, nevis
  // rādām "Nav ierakstu" divas minūtes.
  var _everPulled = false, _pullRetryDelay = 4000;
  function _hasLocalBolusData() {
    return ROOMS.some(function(r) { return (_history[r.id] && _history[r.id].length) || _state[r.id].changedAt; });
  }
  function _readBolusJson(url) {
    var controller = new AbortController(), timer;
    var limit = _hasLocalBolusData() ? 20000 : 45000;
    var deadline = new Promise(function(_resolve, reject) {
      timer = setTimeout(function() { controller.abort(); reject(new Error('Bolus read timed out')); }, limit);
    });
    var request = Promise.resolve().then(function() {
      // No cache: 'no-store' here: the API answers no-store itself, and
      // Chrome skips its cached CORS preflight for no-store requests.
      return fetch(url, { headers: _bolusHeaders(false), signal: controller.signal });
    }).then(function(r) { if (!r.ok) throw new Error('Bolus read failed'); return r.json(); });
    return Promise.race([request, deadline]).finally(function() { clearTimeout(timer); });
  }
  function _kvPull(cb) {
    if (_pullPromise) return _pullPromise.then(function(changed) { if (changed && cb) cb(); return changed; });
    if (window.__minkaHasApiAuth && !window.__minkaHasApiAuth()) return;
    var readStartedAt = Date.now();
    // A fixed URL: the reply is no-store already, and a timestamp in the URL
    // would force a fresh CORS preflight on every poll.
    _pullPromise = _readBolusJson(BOLUS_API).then(function(remote) {
      if (!remote || typeof remote !== 'object') return;
      // The first successful read must repaint once (the history leaves its
      // "Ielādē…" state), but only real differences are written back to storage.
      var firstPull = !_everPulled, changed = false;
      _everPulled = true;
      _pullRetryDelay = 4000;
      ROOMS.forEach(function(r) {
        var rem = remote[r.id], loc = _state[r.id];
        if (!rem || (_lastLocalWriteAt[r.id] || 0) >= readStartedAt || (_lastLocalHistWriteAt[r.id] || 0) >= readStartedAt) return;
        if (Array.isArray(rem.history) && _remoteHistOverwriteAllowed(r.id) && _remoteOverwriteAllowed(r.id)) {
          // Until the updated Apps Script deployment is live, an older server
          // returns matching history rows without the new media fields. Keep
          // media already recorded on this device instead of erasing it on the
          // next background refresh.
          var localMediaByTs = {};
          (_history[r.id] || []).forEach(function(entry) {
            var entryTs = entry && (entry.ts || entry);
            if (entryTs && entry.media) localMediaByTs[String(entryTs)] = entry.media;
          });
          rem.history = rem.history.map(function(entry) {
            var entryTs = entry && (entry.ts || entry);
            if (entry && typeof entry === 'object' && !entry.media && localMediaByTs[String(entryTs)]) {
              entry.media = localMediaByTs[String(entryTs)];
            }
            return entry;
          });
          // History is the source of truth for the ring. After a delete/edit
          // the newest entry can be OLDER than what this device remembers, so
          // accept backward moves too — the old "only newer wins" rule kept a
          // stale ring time forever once its entry was deleted elsewhere.
          var historyChanged = JSON.stringify(_history[r.id]) !== JSON.stringify(rem.history);
          if (historyChanged) _history[r.id] = rem.history;
          var top = rem.history[0];
          var topTs = top ? (top.ts || top) : null;
          if (topTs !== loc.changedAt) { _state[r.id] = { changedAt: topTs }; changed = true; }
          if (historyChanged) changed = true;
        } else if (rem.changedAt && _remoteOverwriteAllowed(r.id) && (!loc.changedAt || rem.changedAt > loc.changedAt)) {
          _state[r.id] = { changedAt: rem.changedAt }; changed = true;
        }
      });
      ROOMS.forEach(function(r) { if (_syncMediaFromHistory(r.id)) changed = true; });
      if (changed) { _save(); _saveHistory(); }
      return changed || firstPull;
    }).catch(function(){
      _mkToast('Bolusa datu ielāde neizdevās', 'error');
      // Nav nekā, ko rādīt — mēģinām vēlreiz pēc dažām sekundēm (4 → 8 → … 30 s).
      if (!_hasLocalBolusData()) {
        var retry = _pullRetryDelay;
        _pullRetryDelay = Math.min(30000, _pullRetryDelay * 2);
        setTimeout(function() { _scheduleSync(retry); }, 0);
      }
      return false;
    }).finally(function() { _pullPromise = null; });
    return _pullPromise.then(function(changed) { if (changed && cb) cb(); return changed; });
  }
  function _scheduleSync(delay) {
    if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
    if (document.hidden || (window.__minkaHasApiAuth && !window.__minkaHasApiAuth())) return;
    var wait = typeof delay === 'number' ? delay : (_open ? 30000 : 120000);
    _syncTimer = setTimeout(_runSync, wait);
  }
  function _runSync() {
    if (document.hidden) return;
    _lastSyncAt = Date.now();
    _kvPull(function(){ if (_open) _render(); _updateLed(); });
    _scheduleSync();
  }
  function _refreshSync(force) {
    if (document.hidden) return;
    var maxAge = _open ? 30000 : 120000;
    if (force || !_lastSyncAt || Date.now() - _lastSyncAt >= maxAge) _runSync();
    else _scheduleSync(maxAge - (Date.now() - _lastSyncAt));
  }
  function _load() {
    try {
      var p = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (p && typeof p === 'object') ROOMS.forEach(function(r){
        if (p[r.id] && p[r.id].changedAt) _state[r.id] = { changedAt: p[r.id].changedAt };
      });
    } catch(e) {}
    try {
      var h = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null');
      if (h && typeof h === 'object') ROOMS.forEach(function(r){
        if (Array.isArray(h[r.id])) _history[r.id] = h[r.id];
      });
    } catch(e) {}
    try {
      var media = JSON.parse(localStorage.getItem(MEDIA_DRAFT_KEY) || 'null');
      if (media && typeof media === 'object') ROOMS.forEach(function(r) {
        _mediaDraft[r.id] = _sanitizeMedia(media[r.id]);
      });
    } catch(e) {}
    try {
      var mediaSync = JSON.parse(localStorage.getItem(MEDIA_SYNC_KEY) || 'null');
      if (mediaSync && typeof mediaSync === 'object') ROOMS.forEach(function(r) {
        _mediaSyncTs[r.id] = Number(mediaSync[r.id]) || 0;
      });
    } catch(e) {}
    ROOMS.forEach(function(r) { _syncMediaFromHistory(r.id); });
  }
  function _save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(_state)); } catch(e) {} }
  function _saveHistory() { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(_history)); } catch(e) {} }
  function _fmt(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  }
  function _fmtClock(ts) {
    if (!ts) return '—:—';
    var d = new Date(ts);
    return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  }
  function _fmtElapsedClock(ts, now) {
    if (!ts) return '—:—:—';
    var total = Math.max(0, Math.floor(((now || Date.now()) - ts) / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return (h < 10 ? '0' : '') + h + ':' + ('0'+m).slice(-2) + ':' + ('0'+s).slice(-2);
  }
  function _fmtElapsedPanel(ts, now) {
    if (!ts) return { hm: '—', sec: '' };
    var total = Math.max(0, Math.floor(((now || Date.now()) - ts) / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return { hm: h + 'h ' + ('0'+m).slice(-2) + 'm', sec: ('0'+s).slice(-2) + 's' };
  }
  function _fmtElapsed(ms) {
    if (ms === null || ms === undefined || ms < 0) return '0h 00m 00s';
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    return h + 'h ' + ('0'+m).slice(-2) + 'm ' + ('0'+s).slice(-2) + 's';
  }
  // Compact ring display — hours + minutes only, fits on one line
  function _fmtRing(ms) {
    if (ms === null || ms === undefined || ms < 0) return { hm: '0h 00m', s: '00s' };
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    // 100h+ elapsed: minutes/seconds carry no information — keep the screen
    // text short so it always fits inside the injector display chip.
    if (h >= 100) return { hm: h + 'h', s: ('0'+m).slice(-2) + 'm' };
    return { hm: h + 'h ' + ('0'+m).slice(-2) + 'm', s: ('0'+s).slice(-2) + 's' };
  }
  // Plain-language hours+minutes for the 24h progress bar caption
  function _fmtHM(ms) {
    if (ms < 0) ms = 0;
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    if (h >= 100) return h + 'h';
    return h + 'h ' + ('0'+m).slice(-2) + 'm';
  }
  // Room accent used when fresh (< 60%); warning colours take over as timer ages
  function _ringColor(pct, roomId) {
    if (pct >= 95) return '#ff3b30';
    if (pct >= 80) return '#ff9500';
    if (pct >= 60) return '#ffd60a';
    return roomId === 'philips' ? '#30d158' : '#0a84ff';
  }
  function _ringStrokeState(elapsed, pct, circumference) {
    if (elapsed === null || !isFinite(pct) || pct <= 0) {
      return { dasharray: circumference.toFixed(2), dashoffset: circumference.toFixed(2), cap: 'butt' };
    }
    if (pct >= 100) {
      return { dasharray: '9999', dashoffset: '0', cap: 'butt' };
    }
    var clamped = Math.max(0, Math.min(100, pct));
    var visible = circumference * clamped / 100;
    var offset = Math.max(0, circumference - visible);
    return {
      dasharray: circumference.toFixed(2),
      dashoffset: offset.toFixed(2),
      cap: (clamped > 3 && clamped < 99) ? 'round' : 'butt'
    };
  }
  function _mediaAssembly(roomId, changedAt) {
    var elapsedPanel = _fmtElapsedPanel(changedAt);
    var media = _sanitizeMedia(_mediaDraft[roomId]);
    function bottle(side, src, title) {
      var slot = media[side];
      var active = side !== 'nacl' && _mediaFocus[roomId] === side && _mediaChooserOpen[roomId];
      var main = side === 'nacl' ? 'NaCl' : 'U' + slot.concentration;
      var amount = slot.volumeMl + ' ml';
      var statusHtml = slot.enabled
        ? '<span class="ctmotion-piece-status"><b>'+main+'</b><small>'+amount+'</small></span>'
        : '<span class="ctmotion-piece-empty" aria-hidden="true"><b>+</b></span>';
      var aria = title + (slot.enabled ? ': ' + main + ', ' + amount : ': nav atzīmēts');
      return '<button class="ctmotion-piece ctmotion-piece-'+side+' bmedia-toggle'+(slot.enabled?' is-loaded':'')+(active?' is-active':'')+'" type="button" data-room="'+roomId+'" data-side="'+side+'" aria-pressed="'+(slot.enabled?'true':'false')+'" aria-label="'+aria+'">'+
        '<img src="'+src+'" alt="">'+
        statusHtml+
      '</button>';
    }
    return '<div class="ctmotion-assembly" role="group" aria-label="Ulrich CT motion interaktīvais boluss">'+
      '<img class="ctmotion-orthographic" src="assets/ct-motion-orthographic-v2.png?v=20260824grid3" alt="" aria-hidden="true">'+
      bottle('left','assets/ct-motion-left.png','Kreisais kontrasts')+
      bottle('nacl','assets/ct-motion-nacl.png','NaCl 1000 ml')+
      bottle('right','assets/ct-motion-right.png','Labais kontrasts')+
      '<img class="ctmotion-body" src="assets/ct-motion-body.png" alt="" aria-hidden="true">'+
      '<button class="ctmotion-time-control" type="button" data-room="'+roomId+'" aria-label="Kopš nomaiņas '+_escHtml(_fmtElapsedClock(changedAt))+'. Spied, lai mainītu laiku">'+
        '<img src="assets/ct-motion-display.png" alt=""><span><b>'+elapsedPanel.hm+'</b><small>'+elapsedPanel.sec+' · kopš nomaiņas</small></span>'+
      '</button>'+
    '</div>';
  }
  function _mediaQuickbar(roomId) {
    if (!_mediaChooserOpen[roomId]) return '';
    var side = _mediaFocus[roomId] === 'right' ? 'right' : 'left';
    var slot = _sanitizeMedia(_mediaDraft[roomId])[side];
    function choice(kind, value, label) {
      var content = kind === 'concentration'
        ? '<span class="bmedia-bottle-shape" aria-hidden="true"></span><span class="bmedia-choice-caption">'+label+'</span>'
        : label;
      return '<button type="button" class="bmedia-choice'+(slot[kind]===value?' is-selected':'')+'" data-room="'+roomId+'" data-side="'+side+'" data-kind="'+kind+'" data-value="'+value+'">'+content+'</button>';
    }
    return '<div class="ctmotion-quickbar" aria-label="'+(side==='left'?'Kreisās':'Labās')+' kontrastvielas izvēle">'+
      '<button type="button" class="ctmotion-quickbar-back" data-room="'+roomId+'" aria-label="Aizvērt kontrastvielas izvēli">←</button>'+
      choice('concentration',370,'U370')+choice('concentration',300,'U300')+
      '<i aria-hidden="true">+</i>'+choice('volumeMl',500,'500ml')+choice('volumeMl',200,'200ml')+
      '<button type="button" class="bmedia-confirm" data-room="'+roomId+'" data-side="'+side+'" aria-label="Apstiprināt '+(side==='left'?'kreiso':'labo')+' kontrastvielu">✓</button>'+
      '<button type="button" class="bmedia-remove" data-room="'+roomId+'" data-side="'+side+'" aria-label="Noņemt '+(side==='left'?'kreiso':'labo')+' kontrastvielu">×</button>'+
    '</div>';
  }
  function _mediaPanel(roomId, changedAt) {
    var hasMedia = !!_mediaSnapshot(roomId);
    return '<div class="bmedia-panel" data-room="'+roomId+'">'+
      '<div class="ctmotion-media-stage'+(_mediaChooserOpen[roomId]?' is-choosing':'')+'">'+
        '<div class="ctmotion-toolbar"><button type="button" class="bmedia-preset" data-room="'+roomId+'" title="Atzīmēt standarta komplektu" aria-label="Atzīmēt visas pudeles"><b aria-hidden="true">+</b> Visi</button>'+
        '<button type="button" class="bmedia-clear" data-room="'+roomId+'" title="Noņemt visas pudeles" aria-label="Noņemt visas pudeles"'+(hasMedia?'':' disabled')+'><b aria-hidden="true">×</b> Notīrīt</button></div>'+
        '<figure class="ctmotion-reference">'+_mediaAssembly(roomId, changedAt)+'</figure>'+
        _mediaQuickbar(roomId)+
      '</div>'+
    '</div>';
  }
  function _bolusIcon(name) {
    var paths = {
      edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
      trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 13h8l1-13"/><path d="M10 11v5M14 11v5"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      calendar: '<path d="M5 4h14v16H5z"/><path d="M8 2v4M16 2v4M5 9h14"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v5M8 20h8M10 17h4"/>'
    };
    return '<svg class="bulrich-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||'')+'</svg>';
  }
  function _renderRoom(r) {
    var st = _state[r.id], now = Date.now();
    var elapsed = st.changedAt ? Math.max(0, now - st.changedAt) : null;
    var pct = elapsed !== null ? Math.min(elapsed / WARN_MS * 100, 100) : 0;
    var over = elapsed !== null && elapsed >= WARN_MS;
    var ringColor = elapsed !== null ? _ringColor(pct, r.id) : 'rgba(255,255,255,0.08)';
    var R = 48, C = 2 * Math.PI * R;
    var ringStroke = _ringStrokeState(elapsed, pct, C);
    var elapsedStr = elapsed !== null ? _fmtElapsed(elapsed) : '—';
    var ringParts  = elapsed !== null ? _fmtRing(elapsed) : { hm: '—', s: '' };
    var changedStr = st.changedAt ? 'Nomainīts: ' + _fmt(st.changedAt) : 'Nav nomainīts';
    var curName  = _names[r.id] || '';
    // Compute chip day: offset from today, then fall back to picker/saved date if no workers found
    var cdOffset = _chipDay[r.id] || 0;
    var cdDate   = new Date(); cdDate.setDate(cdDate.getDate() + cdOffset);
    var cdStr    = _tsToDateStr(cdDate.getTime());
    var workers  = _ensureWorkersForDate(cdStr);
    // If no workers for chip day, also try today as last fallback
    if (!workers.length && cdOffset !== 0) workers = _ensureWorkersForDate(_tsToDateStr(Date.now()));
    var cdLabel  = cdOffset === 0 ? 'Šodien' : cdOffset === -1 ? 'Vakar' : cdOffset === 1 ? 'Rīt' : cdStr;
    // Show custom input whenever "Cits" mode is active or current name is not in the worker list
    var isCustom = curName === ' ' || (!!curName && workers.indexOf(curName) === -1);
    var safeRoomId = _escHtml(r.id);
    var safeCdLabel = _escHtml(cdLabel);
    var histAll = _history[r.id] || [];
    // Keep enough nearby rows ready for tall screens; CSS reveals only what fits.
    var histRows = _histExpanded[r.id] ? histAll : histAll.slice(0, 7);
    var chipsHtml =
      '<div class="boperator">'+
      '<div class="bwd-nav">'+
        '<button class="bwd-arr" data-room="'+safeRoomId+'" data-dir="-1">‹</button>'+
        '<span class="bwd-lbl">'+safeCdLabel+'</span>'+
        '<button class="bwd-arr" data-room="'+safeRoomId+'" data-dir="1">›</button>'+
      '</div>'+
      '<div class="bwrap">'+
        workers.map(function(n){
          var first = n.split(/\s+/)[0];
          var sel   = curName === n;
          var champ = _isChamp(n);
          var longName = first.length > 8;
          return '<button class="bwc'+(sel?' bwsel':'')+(champ?' bwchamp':'')+(longName?' bwc-long':'')+'" data-room="'+safeRoomId+'" data-name="'+_escHtml(n)+'" aria-label="'+_escHtml(first)+'">'+
            (champ?'<span class="bwc-crown" aria-hidden="true">👑</span>':'')+
            '<span class="bwc-label">'+_escHtml(first)+'</span></button>';
        }).join('')+
        '<button class="bwc bwcits'+(isCustom?' bwsel':'')+'" data-room="'+safeRoomId+'">Cits</button>'+
        '<button class="bwc bwblank'+(curName==='Anonīms'?' bwsel':'')+'" data-room="'+safeRoomId+'" data-name="Anonīms" title="Saglabāt bez vārda">—</button>'+
      '</div>'+
      (isCustom ? '<input class="bname-inp bname-cits" data-room="'+safeRoomId+'" type="text" placeholder="Ieraksti vārdu..." maxlength="24" autocomplete="off" value="'+_escHtml(curName.trim())+'">' : '')+
      '</div>';
    var bodyFill = r.id === 'philips' ? '#0c3520' : '#0d2b52';
    return '<div class="brc record-step-'+_recordStep[r.id]+(over?' brd':'')+'" data-room="'+r.id+'">'+
      '<div class="brn" style="color:'+r.color+'">'+r.label+'</div>'+
      '<div class="bdevice-console">'+
      _mediaPanel(r.id, st.changedAt)+
      '</div>'+
      chipsHtml+
      (function(){
        if (_recordStep[r.id] === 0) {
          return '<div class="bnm-section bnm-idle"><button class="bnm-begin" data-room="'+r.id+'" type="button">Nomainīt</button></div>';
        }
        if (_recordStep[r.id] === 1) {
          return '<div class="bnm-section bnm-who-hint">Kurš nomainīja?</div>';
        }
        var pts = _pick[r.id] !== null ? _pick[r.id] : Date.now();
        var pd = new Date(pts);
        var dStr = _dateText(pd.getTime());
        var tStr = _timeText(pd.getTime());
        return '<div class="bnm-section">'+
          '<div class="bnm-label">Ieraksta laiks</div>'+
          '<div class="bnm-prow">'+
            '<label class="bnm-native-field"><span>Datums</span><input class="bnm-date-input" data-room="'+r.id+'" type="text" inputmode="numeric" maxlength="10" placeholder="DD.MM.GGGG" value="'+dStr+'"><button class="bnm-picker-btn bnm-dpick" data-room="'+r.id+'" type="button" aria-label="Atvērt kalendāru">'+_bolusIcon('calendar')+'</button></label>'+
            '<label class="bnm-native-field bnm-time-field"><span>Precīzs laiks</span><input class="bnm-time-input" data-room="'+r.id+'" type="text" inputmode="numeric" maxlength="5" placeholder="HH:MM" value="'+tStr+'"><button class="bnm-picker-btn bnm-tpick" data-room="'+r.id+'" type="button" aria-label="Atvērt stundu un minūšu izvēli">'+_bolusIcon('clock')+'</button></label>'+
            '<button class="bnm-savepick" data-room="'+r.id+'" type="button">Saglabāt</button>'+
          '</div>'+
          (_calOpen[r.id] ? _buildCal(r.id) : '')+
          (_tpOpen[r.id] ? _buildTp(r.id) : '')+
          '<small class="bnm-last">'+_escHtml(changedStr)+'</small>'+
        '</div>';
      })()+
      '<div class="bhist-hdr"><span class="bhist-lbl">Vēsture</span>'+(histAll.length?'<span class="bhist-cnt">'+histAll.length+'</span>':'')+(histAll.length>3?'<button class="bhist-toggle" type="button" data-room="'+r.id+'">'+(_histExpanded[r.id]?'Tuvākie':'Visi')+'</button>':'')+'</div>'+
      '<div class="bhist'+(_histExpanded[r.id]?' is-all':'')+'" id="bhist-'+r.id+'">'+
        (histRows.length ?
          histRows.map(function(entry,i){
            var ts = entry.ts || entry;
            var who = entry.name || 'Anonīms';
            var safeWho = _escHtml(who);
            var mediaText = entry && entry.media ? _mediaSummary(entry.media) : '';
            if (_histEdit[r.id] === i) {
              return '<div class="bhist-row bhist-editing" data-i="'+i+'">'+
                '<div class="bhe-head">'+_bolusIcon('edit')+' Labo ierakstu nr. '+(i+1)+'</div>'+
                '<input type="text" class="bhe-dt" data-room="'+r.id+'" data-i="'+i+'" inputmode="numeric" maxlength="16" placeholder="DD.MM.GGGG HH:MM" value="'+_dtText(ts)+'">'+
                '<input type="text" class="bhe-nm" data-room="'+r.id+'" data-i="'+i+'" maxlength="30" placeholder="Vārds" value="'+safeWho+'">'+
                '<div class="bhe-btns">'+
                  '<button class="bhe-save" data-room="'+r.id+'" data-i="'+i+'">'+_bolusIcon('check')+' Saglabāt</button>'+
                  '<button class="bhe-cancel" data-room="'+r.id+'" data-i="'+i+'">'+_bolusIcon('close')+' Atcelt</button>'+
                '</div>'+
              '</div>';
            }
            if (_histDel[r.id] === i) {
              return '<div class="bhist-row bhist-deleting" data-i="'+i+'">'+
                '<div class="bhx-q">'+_bolusIcon('trash')+' Dzēst "'+_fmt(ts)+' '+safeWho+'"?</div>'+
                '<div class="bhe-btns">'+
                  '<button class="bhx-yes" data-room="'+r.id+'" data-i="'+i+'">Jā, dzēst</button>'+
                  '<button class="bhx-no" data-room="'+r.id+'" data-i="'+i+'">Nē, atstāt</button>'+
                '</div>'+
              '</div>';
            }
            return '<div class="bhist-row'+(i===0?' bhist-latest':'')+'" data-i="'+i+'">'+
              '<span class="bhist-num">'+(i+1)+'.</span>'+
              '<span class="bhist-time">'+_fmt(ts)+'</span>'+
              '<span class="bhist-who">'+(_isChamp(who)?'👑 ':'')+safeWho+'</span>'+
              '<span class="bh-actions">'+
                '<button class="bh-edit" data-room="'+r.id+'" data-i="'+i+'" title="Labot šo ierakstu" aria-label="Labot šo ierakstu">'+_bolusIcon('edit')+'</button>'+
                '<button class="bh-del" data-room="'+r.id+'" data-i="'+i+'" title="Dzēst šo ierakstu" aria-label="Dzēst šo ierakstu">'+_bolusIcon('trash')+'</button>'+
              '</span>'+
              (mediaText ? '<span class="bhist-media">'+_escHtml(mediaText)+'</span>' : '')+
            '</div>';
          }).join('') :
          '<div class="bhist-empty">'+(_everPulled ? 'Nav ierakstu. Nospied „Nomainīt”.' : 'Ielādē ierakstus…')+'</div>')+
      '</div>'+
    '</div>';
  }
  // Native date/time inputs follow the browser locale — on an English system
  // they render mm/dd/yyyy and a 12h clock with AM/PM. Every bolus field is a
  // plain text box instead, so the date stays dd.mm.yyyy and the clock 24h.
  function _pad2(value) { return ('0' + value).slice(-2); }
  function _dateText(ts) {
    var d = ts ? new Date(ts) : new Date();
    return _pad2(d.getDate())+'.'+_pad2(d.getMonth()+1)+'.'+d.getFullYear();
  }
  function _timeText(ts) {
    var d = ts ? new Date(ts) : new Date();
    return _pad2(d.getHours())+':'+_pad2(d.getMinutes());
  }
  function _dtText(ts) { return _dateText(ts)+' '+_timeText(ts); }
  function _parseDateTimeText(dateValue, timeValue) {
    var dm = String(dateValue || '').trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\.?$/);
    var tm = String(timeValue || '').trim().match(/^(\d{1,2})[:.](\d{2})$/);
    if (!dm || !tm) return null;
    return _parseLocalDateTime(dm[3]+'-'+_pad2(dm[2])+'-'+_pad2(dm[1])+'T'+_pad2(tm[1])+':'+tm[2]);
  }
  function _parseDtText(value) {
    var parts = String(value || '').trim().split(/[\s,]+/);
    return parts.length === 2 ? _parseDateTimeText(parts[0], parts[1]) : null;
  }
  function _parseLocalDateTime(value) {
    var m = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    var y = parseInt(m[1], 10);
    var mo = parseInt(m[2], 10) - 1;
    var d = parseInt(m[3], 10);
    var h = parseInt(m[4], 10);
    var mi = parseInt(m[5], 10);
    var dt = new Date(y, mo, d, h, mi, 0, 0);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo ||
      dt.getDate() !== d ||
      dt.getHours() !== h ||
      dt.getMinutes() !== mi
    ) return null;
    return dt.getTime();
  }
  function _render() {
    var rooms = document.getElementById('bolus-rooms');
    if (!rooms) return;
    _updateChamp();
    rooms.innerHTML = ROOMS.map(_renderRoom).join('');
    function _saveName(room, val) {
      _names[room] = val;
      try { localStorage.setItem('minkaBolusName_' + room, val); } catch(e) {}
    }
    function _readExactInputs(room) {
      var dateInput = rooms.querySelector('.bnm-date-input[data-room="'+room+'"]');
      var timeInput = rooms.querySelector('.bnm-time-input[data-room="'+room+'"]');
      if (!dateInput || !timeInput) return null;
      var ts = _parseDateTimeText(dateInput.value, timeInput.value);
      if (ts !== null) _pick[room] = ts;
      return ts;
    }
    rooms.querySelectorAll('.bnm-date-input,.bnm-time-input').forEach(function(input) {
      input.addEventListener('change', function() { _readExactInputs(input.dataset.room); });
      input.addEventListener('input', function() { _readExactInputs(input.dataset.room); });
    });
    rooms.querySelectorAll('.bmedia-toggle').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room, side = btn.dataset.side;
        _markMediaTouch(room);
        _mediaDraft[room] = _sanitizeMedia(_mediaDraft[room]);
        if (side === 'nacl') {
          _mediaDraft[room].nacl.enabled = !_mediaDraft[room].nacl.enabled;
        } else {
          _mediaFocus[room] = side;
          _mediaChooserOpen[room] = true;
        }
        _saveMediaDraft(); _render();
      });
    });
    rooms.querySelectorAll('.ctmotion-time-control').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var inp = rooms.querySelector('.bnm-time-input[data-room="'+btn.dataset.room+'"]');
        if (!inp) return;
        inp.focus({ preventScroll: true });
        try { if (inp.showPicker) inp.showPicker(); }
        catch(err) { inp.click(); }
      });
    });
    rooms.querySelectorAll('.bmedia-choice').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room, side = btn.dataset.side, kind = btn.dataset.kind;
        _markMediaTouch(room);
        _mediaDraft[room] = _sanitizeMedia(_mediaDraft[room]);
        _mediaFocus[room] = side;
        _mediaDraft[room][side][kind] = Number(btn.dataset.value);
        _saveMediaDraft(); _render();
      });
    });
    rooms.querySelectorAll('.ctmotion-quickbar-back').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _mediaChooserOpen[btn.dataset.room] = false;
        _render();
      });
    });
    rooms.querySelectorAll('.bmedia-confirm').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room, side = btn.dataset.side;
        _markMediaTouch(room);
        _mediaDraft[room] = _sanitizeMedia(_mediaDraft[room]);
        _mediaDraft[room][side].enabled = true;
        _mediaChooserOpen[room] = false;
        _saveMediaDraft(); _render();
      });
    });
    rooms.querySelectorAll('.bmedia-remove').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room, side = btn.dataset.side;
        _markMediaTouch(room);
        _mediaDraft[room] = _sanitizeMedia(_mediaDraft[room]);
        _mediaDraft[room][side].enabled = false;
        _mediaChooserOpen[room] = false;
        _saveMediaDraft(); _render();
      });
    });
    rooms.querySelectorAll('.bmedia-preset').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room;
        _markMediaTouch(room);
        _mediaDraft[room] = {
          left: { enabled: true, concentration: 370, volumeMl: 500 },
          nacl: { enabled: true, volumeMl: 1000 },
          right: { enabled: true, concentration: 300, volumeMl: 500 }
        };
        _mediaFocus[room] = 'left';
        _mediaChooserOpen[room] = false;
        _saveMediaDraft(); _render();
      });
    });
    rooms.querySelectorAll('.bmedia-clear').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _markMediaTouch(btn.dataset.room);
        _mediaDraft[btn.dataset.room] = _newMediaDraft();
        _mediaChooserOpen[btn.dataset.room] = false;
        _saveMediaDraft(); _render();
      });
    });
    // Worker chip selected
    rooms.querySelectorAll('.bwc:not(.bwcits):not(.bwblank)').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room;
        _saveName(room, btn.dataset.name);
        if (_recordStep[room] === 1) {
          _recordStep[room] = 2;
          _pick[room] = Date.now();
        }
        _render();
      });
    });
    // Blank chip
    rooms.querySelectorAll('.bwblank').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room;
        _saveName(room, 'Anonīms');
        if (_recordStep[room] === 1) {
          _recordStep[room] = 2;
          _pick[room] = Date.now();
        }
        _render();
      });
    });
    // "Cits" chip — show text input
    rooms.querySelectorAll('.bwcits').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room;
        _saveName(room, ' ');
        _render();
        setTimeout(function(){
          var inp = rooms.querySelector('.bname-cits[data-room="'+room+'"]');
          if (inp) { inp.value = _names[room].trim(); inp.focus(); }
        }, 40);
      });
    });
    // Free-text input for "Cits"
    rooms.querySelectorAll('.bname-cits').forEach(function(inp) {
      inp.addEventListener('input', function() {
        _saveName(inp.dataset.room, inp.value);
      });
      inp.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' || !inp.value.trim()) return;
        e.preventDefault();
        var room = inp.dataset.room;
        _recordStep[room] = 2;
        _pick[room] = Date.now();
        _render();
      });
    });
    // Day navigation arrows for worker chips — also sync recording date
    rooms.querySelectorAll('.bwd-arr').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room, dir = parseInt(btn.dataset.dir);
        _chipDay[room] = (_chipDay[room] || 0) + dir;
        if (_chipDay[room] === 0) {
          // Back to today → clear pick (use saved state / Tagad)
          _pick[room] = null; _calView[room] = null;
        } else {
          // Navigate to another day → set the recording date to that day, keep current HH:MM
          var cur = new Date(_pickTs(room));
          var nd = new Date(); nd.setDate(nd.getDate() + _chipDay[room]);
          nd.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
          _pick[room] = nd.getTime();
          _calView[room] = { y: nd.getFullYear(), m: nd.getMonth() };
        }
        _calOpen[room] = false; _tpOpen[room] = false;
        _render();
      });
    });
    // Date picker toggle
    rooms.querySelectorAll('.bnm-dpick').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room;
        var opening = !_calOpen[room];
        _calOpen[room] = opening; _tpOpen[room] = false;
        if (opening && !_calView[room]) { var d=new Date(_pickTs(room)); _calView[room]={y:d.getFullYear(),m:d.getMonth()}; }
        _render();
        if (opening) setTimeout(function(){
          var card = rooms.querySelector('.brc[data-room="'+room+'"]');
          var sheet = document.getElementById('bolus-sheet');
          if (card && sheet) sheet.scrollTo({ top: sheet.scrollHeight, behavior: 'smooth' });
        }, 60);
      });
    });
    // Time picker toggle
    rooms.querySelectorAll('.bnm-tpick').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room;
        _tpOpen[room] = !_tpOpen[room]; _calOpen[room] = false;
        _render();
        if (_tpOpen[room]) setTimeout(function(){
          var sheet = document.getElementById('bolus-sheet');
          if (sheet) sheet.scrollTo({ top: sheet.scrollHeight, behavior: 'smooth' });
        }, 60);
      });
    });
    // Calendar month nav
    rooms.querySelectorAll('.bnm-cnav').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room, dir = parseInt(btn.dataset.dir);
        var cv = _calView[room]; cv.m += dir;
        if (cv.m > 11) { cv.m=0; cv.y++; } else if (cv.m < 0) { cv.m=11; cv.y--; }
        _render();
      });
    });
    // Calendar day click
    rooms.querySelectorAll('.bcd').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room=btn.dataset.room, y=parseInt(btn.dataset.y), m=parseInt(btn.dataset.m), d=parseInt(btn.dataset.d);
        var cur = new Date(_pickTs(room));
        var nd = new Date(y,m,d,cur.getHours(),cur.getMinutes(),0,0);
        _pick[room] = nd.getTime(); _calOpen[room]=false;
        // Sync chip day navigator to the selected date
        var todayMid = new Date(); todayMid.setHours(0,0,0,0);
        var pickMid  = new Date(y,m,d,0,0,0,0);
        _chipDay[room] = Math.round((pickMid - todayMid) / 86400000);
        _render();
      });
    });
    // Time picker arrows — update DOM directly (no full re-render)
    rooms.querySelectorAll('.bnm-tpa').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room=btn.dataset.room, unit=btn.dataset.unit, dir=parseInt(btn.dataset.dir);
        var d = new Date(_pickTs(room));
        if (unit==='h') d.setHours((d.getHours()+dir+24)%24);
        else d.setMinutes((d.getMinutes()+dir+60)%60);
        _pick[room] = d.getTime();
        _render();
      });
    });
    // Start the change flow with the computer's current date and time.
    rooms.querySelectorAll('.bnm-begin').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room;
        _recordStep[room] = 1;
        _pick[room] = Date.now();
        _chipDay[room] = 0;
        _calOpen[room] = false; _tpOpen[room] = false; _calView[room] = null;
        _saveName(room, '');
        _render();
      });
    });
    // Saglabāt picked time
    rooms.querySelectorAll('.bnm-savepick').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room=btn.dataset.room, ts=_readExactInputs(room);
        if (!(_names[room] || '').trim()) { _mkToast('Izvēlies, kurš nomainīja bolusu', 'error'); return; }
        if (ts === null) { _mkToast('Norādi derīgu datumu un laiku', 'error'); return; }
        _state[room].changedAt=ts; _pick[room]=null;
        _markLocalWrite(room);
        _calOpen[room]=false; _tpOpen[room]=false; _calView[room]=null;
        _history[room].unshift({ts:ts,name:_names[room]||'Anonīms',media:_mediaSnapshot(room)});
        _mediaSyncTs[room] = ts; _saveMediaSync();
        _recordStep[room]=0;
        _save(); _saveHistory(); _kvPush(room); _render(); _updateLed();
      });
    });
    // History: fade the bottom edge while there is more to scroll, so rows
    // never look chopped mid-line; fade lifts at the end of the list.
    rooms.querySelectorAll('.bhist-toggle').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var room = btn.dataset.room;
        _histExpanded[room] = !_histExpanded[room];
        _histEdit[room] = -1;
        _histDel[room] = -1;
        _render();
      });
    });
    rooms.querySelectorAll('.bhist').forEach(function(el) {
      function updFade() {
        el.classList.toggle('has-more', el.scrollHeight - el.scrollTop - el.clientHeight > 6);
      }
      el.addEventListener('scroll', updFade, { passive: true });
      updFade();
    });
    // History: edit / delete per entry (inline, with explicit confirmation)
    rooms.querySelectorAll('.bh-edit').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room;
        _histDel[room] = -1;
        _histEdit[room] = parseInt(btn.dataset.i);
        _render();
        setTimeout(function(){
          var inp = rooms.querySelector('.bhe-dt[data-room="'+room+'"]');
          if (inp) inp.focus();
        }, 40);
      });
    });
    rooms.querySelectorAll('.bh-del').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room;
        _histEdit[room] = -1;
        _histDel[room] = parseInt(btn.dataset.i);
        _render();
      });
    });
    rooms.querySelectorAll('.bhe-cancel').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        _histEdit[btn.dataset.room] = -1;
        _render();
      });
    });
    rooms.querySelectorAll('.bhx-no').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        _histDel[btn.dataset.room] = -1;
        _render();
      });
    });
    rooms.querySelectorAll('.bhe-save').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        var room = btn.dataset.room, i = parseInt(btn.dataset.i);
        var dtInp = rooms.querySelector('.bhe-dt[data-room="'+room+'"][data-i="'+i+'"]');
        var nmInp = rooms.querySelector('.bhe-nm[data-room="'+room+'"][data-i="'+i+'"]');
        var ts = dtInp ? _parseDtText(dtInp.value) : null;
        if (ts === null) { _mkToast('Nederīgs datums/laiks — izmaiņa nav saglabāta', 'error'); return; }
        _applyHistEdit(room, i, ts, nmInp ? nmInp.value : '');
      });
    });
    rooms.querySelectorAll('.bhx-yes').forEach(function(btn) {
      btn.addEventListener('click', function(e) { e.stopPropagation();
        _applyHistDelete(btn.dataset.room, parseInt(btn.dataset.i));
      });
    });
    _updateLed();
  }
  function _openEditModal(roomId) {
    var modal = document.getElementById('bolus-edit-modal');
    if (!modal) return;
    var roomLabel = roomId === 'ge' ? 'GE' : 'PHILIPS';
    document.getElementById('bolus-edit-title').textContent = 'Labot laiku — ' + roomLabel;
    var inp = document.getElementById('bolus-edit-inp');
    inp.value = _dtText(_state[roomId].changedAt);
    modal.style.display = 'flex';
    if (window.updateBuddyUiSuppression) window.updateBuddyUiSuppression();
    setTimeout(function(){ inp.focus(); try { inp.select(); } catch(ex) {} }, 100);
    // Clone buttons to remove old listeners
    var saveBtn   = document.getElementById('bolus-edit-save');
    var cancelBtn = document.getElementById('bolus-edit-cancel');
    var newSave   = saveBtn.cloneNode(true);
    var newCancel = cancelBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newSave.addEventListener('click', function() {
      var ts = _parseDtText(document.getElementById('bolus-edit-inp').value);
      if (ts === null) { _mkToast('Nederīgs datums vai laiks — gaida DD.MM.GGGG HH:MM', 'error'); return; }
      if (ts !== null) {
        _state[roomId].changedAt = ts;
        _markLocalWrite(roomId);
        _history[roomId].unshift({ ts: ts, name: _names[roomId] || 'Anonīms', media: _mediaSnapshot(roomId) });
        _mediaSyncTs[roomId] = ts; _saveMediaSync();
        _save(); _saveHistory(); _kvPush(roomId); _render(); _updateLed();
      }
      modal.style.display = 'none';
      if (window.updateBuddyUiSuppression) window.updateBuddyUiSuppression();
    });
    newCancel.addEventListener('click', function() {
      modal.style.display = 'none';
      if (window.updateBuddyUiSuppression) window.updateBuddyUiSuppression();
    });
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        if (window.updateBuddyUiSuppression) window.updateBuddyUiSuppression();
      }
    };
  }
  function _updateRings() {
    var now = Date.now();
    ROOMS.forEach(function(r) {
      var st = _state[r.id];
      var elapsed = st.changedAt ? Math.max(0, now - st.changedAt) : null;
      var pct = elapsed !== null ? Math.min(elapsed / WARN_MS * 100, 100) : 0;
      var over = elapsed !== null && elapsed >= WARN_MS;
      var ringColor = elapsed !== null ? _ringColor(pct, r.id) : 'rgba(255,255,255,0.08)';
      var R = 48, C = 2 * Math.PI * R;
      var ringStroke = _ringStrokeState(elapsed, pct, C);
      var card = document.querySelector('#bolus-rooms .brc[data-room="'+r.id+'"]');
      if (!card) return;
      var fill = card.querySelector('.bbar-fill');
      if (fill) {
        fill.style.width = (elapsed !== null ? Math.min(pct, 100).toFixed(1) : 0) + '%';
        fill.style.background = elapsed !== null ? ringColor : 'transparent';
        fill.style.animation = over ? 'bring-pulse-soft 1.6s ease-in-out infinite' : '';
      }
      var btxt = card.querySelector('.bbar-txt');
      if (btxt) {
        btxt.textContent = elapsed === null ? 'nav ierakstu' : (over ? 'pāri par ' + _fmtHM(elapsed - WARN_MS) : 'līdz 24h vēl ' + _fmtHM(WARN_MS - elapsed));
        btxt.className = 'bbar-txt' + (over ? ' bbar-txt-over' : '');
      }
      var parts = _fmtRing(elapsed);
      var timeEl = card.querySelector('.bring-time');
      if (timeEl) timeEl.textContent = elapsed !== null ? parts.hm : '—';
      var secsEl = card.querySelector('.bring-secs');
      if (secsEl) secsEl.textContent = elapsed !== null ? parts.s : '';
      var lblEl = card.querySelector('.bring-label');
      if (lblEl) lblEl.textContent = over ? 'PĀRI 24h!' : 'kopš maiņas / 24h';
      var chipEl = card.querySelector('.bscreen');
      if (chipEl) chipEl.classList.toggle('bscreen-over', over);
      var displayPanel = _fmtElapsedPanel(st.changedAt, now);
      var displayMain = card.querySelector('.ctmotion-time-control span b');
      var displaySecs = card.querySelector('.ctmotion-time-control span small');
      if (displayMain) displayMain.textContent = displayPanel.hm;
      if (displaySecs) displaySecs.textContent = displayPanel.sec + ' · kopš nomaiņas';
      if (over) card.classList.add('brd'); else card.classList.remove('brd');
    });
  }
  function _updateLed() {
    var ct = document.getElementById('bolusCrownTag');
    if (ct) {
      _updateChampCached();
      var txt = _champ ? _prettyFirst(_champ.name) : '';
      if (ct.__champName !== txt) {
        ct.__champName = txt;
        // Pixel crown in the dock's own 1-px-grid style (like the drop above),
        // not the emoji: it matched nothing else on the bar.
        ct.innerHTML = txt ? '<svg class="bolus-crown-px" viewBox="0 0 9 7" width="12" height="9" shape-rendering="crispEdges" aria-hidden="true">'
          + '<rect x="0" y="0" width="1.04" height="1.04" fill="#fde68a"/><rect x="4" y="0" width="1.04" height="1.04" fill="#fde68a"/><rect x="8" y="0" width="1.04" height="1.04" fill="#fde68a"/>'
          + '<rect x="0" y="1" width="2.04" height="1.04" fill="#fbbf24"/><rect x="3" y="1" width="3.04" height="1.04" fill="#fbbf24"/><rect x="7" y="1" width="2.04" height="1.04" fill="#fbbf24"/>'
          + '<rect x="0" y="2" width="9.04" height="1.04" fill="#fbbf24"/>'
          + '<rect x="0" y="3" width="9.04" height="1.04" fill="#f59e0b"/><rect x="2" y="3" width="1.04" height="1.04" fill="#f87171"/><rect x="4" y="3" width="1.04" height="1.04" fill="#7dd3fc"/><rect x="6" y="3" width="1.04" height="1.04" fill="#f87171"/>'
          + '<rect x="0" y="4" width="9.04" height="1.04" fill="#f59e0b"/>'
          + '<rect x="0" y="5" width="9.04" height="1.04" fill="#b45309"/>'
          + '</svg><span class="bolus-crown-name"></span>' : '';
        var nameEl = ct.querySelector('.bolus-crown-name');
        if (nameEl) nameEl.textContent = txt;
      }
    }
    var btn = document.getElementById('bolusDocBtn');
    var led = document.getElementById('bolusLed');
    if (!btn) return;
    var now = Date.now();
    var worstPct = 0;
    var staleCount = 0;
    ROOMS.forEach(function(r) {
      var st = _state[r.id];
      var fresh = !!(st.changedAt && (now - st.changedAt) < WARN_MS);
      var pctRoom = st.changedAt ? Math.min((now - st.changedAt) / WARN_MS * 100, 100) : 100;
      var roomLevel = !fresh ? 'stale' : pctRoom >= 80 ? 'warn' : pctRoom >= 60 ? 'caution' : 'fresh';
      var seg = document.getElementById(r.id === 'ge' ? 'bolusSegGe' : 'bolusSegPh');
      if (seg) {
        seg.classList.toggle('is-fresh', roomLevel === 'fresh');
        seg.classList.toggle('is-caution', roomLevel === 'caution');
        seg.classList.toggle('is-warn', roomLevel === 'warn');
        seg.classList.toggle('is-stale', roomLevel === 'stale');
        // Čips ir kā baterija: aizpildījums = cik no 24 h vēl atlicis.
        var leftPct = Math.max(0, 100 - pctRoom);
        seg.style.setProperty('--bol-left', leftPct.toFixed(1) + '%');
        var hoursLeft = st.changedAt ? Math.max(0, (WARN_MS - (now - st.changedAt)) / 3600000) : 0;
        seg.title = r.label + (fresh ? ' bolus — atlikušas ' + (hoursLeft >= 1 ? Math.floor(hoursLeft) + ' h' : Math.round(hoursLeft * 60) + ' min') : ' bolus jāmaina tagad');
      }
      if (!fresh) staleCount++;
      if (st.changedAt) {
        var pct = Math.min((now - st.changedAt) / WARN_MS * 100, 100);
        if (pct > worstPct) worstPct = pct;
      } else {
        worstPct = 100;
      }
    });
    var isAlert = staleCount > 0 || worstPct >= 100;
    var isWarn  = worstPct >= 80 && !isAlert;
    var col = isAlert ? '#ff3b30' : (isWarn ? '#ff9500' : '#34d399');
    if (led) {
      led.style.background = col;
      led.style.boxShadow  = '0 0 8px ' + col;
    }
    btn.classList.toggle('bolus-alert', isAlert);
    btn.classList.toggle('bolus-warn',  isWarn);
    btn.setAttribute('aria-label', 'Bolus: GE ' + (document.getElementById('bolusSegGe') && document.getElementById('bolusSegGe').classList.contains('is-fresh') ? 'nomainīts' : 'jāmaina') + ', PH ' + (document.getElementById('bolusSegPh') && document.getElementById('bolusSegPh').classList.contains('is-fresh') ? 'nomainīts' : 'jāmaina'));
    // Drive conic-gradient progress ring via CSS custom properties
    btn.style.setProperty('--bp-pct', worstPct.toFixed(2) + '%');
    btn.style.setProperty('--bp-col', col);
    btn.style.setProperty('--bp-vis', '1');
    if (window.__minkaBolusNeedsChange !== isAlert) {
      window.__minkaBolusNeedsChange = isAlert;
      window.dispatchEvent(new CustomEvent('minka-bolus-status', { detail: { needsChange: isAlert } }));
    } else {
      window.__minkaBolusNeedsChange = isAlert;
    }
  }

  function _injectCss() {
    if (document.getElementById('bolus-css')) return;
    var s = document.createElement('style');
    s.id = 'bolus-css';
    s.textContent =
      /* ── Overlay ── */
      '#bolus-overlay{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:none;align-items:flex-end;justify-content:center;overscroll-behavior:contain;}'+
      /* ── Sheet ── */
      '#bolus-sheet{width:100%;max-width:min(720px,98vw);background:linear-gradient(170deg,#0c1422 0%,#060c18 55%,#040a14 100%);border-radius:28px 28px 0 0;border:1px solid rgba(255,255,255,0.10);border-bottom:none;display:flex;flex-direction:column;height:calc(100dvh - 24px);overflow:hidden;box-shadow:0 -14px 34px rgba(0,0,0,0.64),0 -2px 0 rgba(255,255,255,0.04);}'+
      '#bolus-title-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 14px 6px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.08);}'+
      '#bolus-title{font-size:11px;font-weight:800;letter-spacing:.20em;color:rgba(255,255,255,0.92);text-transform:uppercase;font-family:"Space Grotesk",system-ui;}'+
      '#bolus-close-btn{background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.85);border-radius:50%;width:26px;height:26px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0;}'+
      '#bolus-close-btn:hover{background:rgba(255,255,255,0.22);}'+
      /* ── Rooms row ── */
      '#bolus-rooms{display:flex;flex-direction:row;gap:10px;padding:2px 10px max(env(safe-area-inset-bottom,0px),84px);flex:1;min-height:0;overflow:hidden;}'+
      /* ── Cards ── */
      '.brc{flex:1;min-width:0;min-height:0;background:linear-gradient(160deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.020) 100%);border:1px solid rgba(255,255,255,0.10);border-radius:22px;padding:14px 11px 12px;display:flex;flex-direction:column;align-items:center;gap:7px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.07);}'+
      '.brd{border-color:rgba(255,59,48,0.65)!important;background:linear-gradient(160deg,rgba(255,59,48,0.10) 0%,rgba(255,59,48,0.04) 100%)!important;box-shadow:0 0 32px rgba(255,59,48,0.18),0 8px 40px rgba(0,0,0,0.50),inset 0 1px 0 rgba(255,100,80,0.10)!important;}'+
      /* Room name — small label, accent color comes from r.color inline */
      '.brn{font-size:clamp(11px,1.7dvh,14px);font-weight:900;letter-spacing:.26em;text-align:center;flex-shrink:0;opacity:1;text-shadow:0 0 18px currentColor;}'+
      /* ── Progress ring — HERO, fills most of card width ── */
      '.binj-svg{width:min(80%,222px);height:auto;display:block;margin:-2px auto -12px;flex-shrink:0;}'+
      '.binj-body{position:relative;width:min(76%,212px);aspect-ratio:220/150;flex-shrink:0;}'+
      '.binj-shell{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.45));}'+
      '.bbar{position:absolute;left:13%;right:13%;top:62%;height:8.5%;min-height:8px;border-radius:99px;background:rgba(255,255,255,0.16);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.4);}'+
      '.bbar-fill{height:100%;border-radius:99px;transition:width 1s linear;}'+
      '.bbar-scale{position:absolute;left:13%;right:13%;top:71.5%;display:flex;justify-content:space-between;font-size:clamp(8px,1.1dvh,10px);font-weight:700;color:rgba(255,255,255,0.55);}'+
      '.bbar-txt{position:absolute;left:7%;right:7%;top:80%;text-align:center;font-size:clamp(9.5px,1.4dvh,12px);font-weight:800;color:rgba(255,255,255,0.88);}'+
      '.bbar-txt-over{color:#ff9d94;}'+
      '.bring-wrap{position:relative;width:min(86%,clamp(148px,22dvh,204px));aspect-ratio:1;flex-shrink:0;}'+
      '.bring-svg{width:100%;height:100%;transform:rotate(-90deg);overflow:visible;}'+
      '.bring-bg{fill:none;stroke:rgba(255,255,255,0.24);stroke-width:10;}'+
      '.bring-arc{fill:none;stroke-width:10;stroke-linecap:round;vector-effect:non-scaling-stroke;shape-rendering:geometricPrecision;filter:drop-shadow(0 0 6px rgba(255,255,255,0.12));transition:stroke-dashoffset 1s,stroke 1s,stroke-dasharray 1s,stroke-linecap .18s;}'+
      '@keyframes bring-pulse{0%,100%{opacity:1}50%{opacity:.2}}'+
      '@keyframes bring-pulse-soft{0%,100%{opacity:1}50%{opacity:.6}}'+
      '.bring-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0px;}'+
      /* "0h 50m" — hero timer, big white */
      '.bscreen{position:absolute;left:13%;right:13%;top:9%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:6px 8px 5px;border-radius:11px;background:#eef3f9;box-shadow:inset 0 -2px 0 rgba(9,20,40,0.14),0 2px 8px rgba(0,0,0,0.4);}'+
      '.bscreen .bring-time{color:#0d1b33!important;animation:none!important;font-size:clamp(15px,2.3dvh,21px);letter-spacing:-.02em;}'+
      '.bscreen .bring-secs{color:#41618c!important;animation:none!important;}'+
      '.bscreen .bring-label{color:#6d80a0!important;text-align:center;}'+
      '.bscreen-over{background:#ffe7e4;}'+
      '.bscreen-over .bring-time{color:#c21a10!important;}'+
      '.bscreen-over .bring-secs{color:#d95048!important;}'+
      '.bscreen-over .bring-label{color:#c21a10!important;font-weight:900!important;}'+
      '.bring-time{font-size:clamp(16px,2.6dvh,23px);font-weight:900;font-variant-numeric:tabular-nums;color:#ffffff;line-height:1.1;letter-spacing:-.01em;white-space:nowrap;}'+
      /* "40s" — secondary, smaller */
      '.bring-secs{font-size:clamp(10px,1.5dvh,13px);font-weight:700;font-variant-numeric:tabular-nums;color:rgba(255,255,255,0.80);line-height:1.2;white-space:nowrap;}'+
      '.bring-over{color:#ff5b50!important;animation:bring-pulse-soft 1.6s ease-in-out infinite;}'+
      '.bring-label{font-size:clamp(7px,1.0dvh,9px);font-weight:700;color:rgba(255,255,255,0.60);letter-spacing:.04em;margin-top:1px;}'+
      /* ── History — always visible, no toggle button ── */
      '.bhist-hdr{width:100%;display:flex;align-items:center;gap:6px;flex-shrink:0;padding:0 2px;}'+
      '.bhist-lbl{font-size:9px;font-weight:800;letter-spacing:.12em;color:rgba(255,255,255,0.85);text-transform:uppercase;font-family:"Space Grotesk",system-ui;}'+
      '.bhist-cnt{font-size:9px;font-weight:700;color:rgba(255,255,255,0.75);background:rgba(255,255,255,0.12);border-radius:8px;padding:1px 5px;}'+
      /* History: flex:1 fills remaining card space, scrolls */
      '.bhist{width:100%;background:rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.06);border-radius:11px;padding:5px 6px 12px;box-sizing:border-box;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;}'+
      '.bhist.has-more{-webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 30px),transparent 100%);mask-image:linear-gradient(180deg,#000 calc(100% - 30px),transparent 100%);}'+
      '.bhist-row{display:flex;flex-wrap:wrap;gap:2px 6px;align-items:baseline;font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);padding:5px 2px;border-bottom:1px solid rgba(255,255,255,0.07);font-variant-numeric:tabular-nums;}'+
      '.bhist-row:last-child{border-bottom:none;}'+
      '.bhist-num{font-size:9px;color:rgba(255,255,255,0.50);min-width:12px;flex-shrink:0;}'+
      '.bhist-time{flex:1;color:rgba(255,255,255,0.90);font-weight:700;}'+
      '.bhist-who{font-size:11px;color:rgba(180,230,255,0.95);background:rgba(0,180,255,0.14);border-radius:5px;padding:1px 6px;word-break:break-word;font-weight:700;}'+
      '.bhist-latest .bhist-who{color:rgba(80,240,160,0.98);background:rgba(0,220,120,0.18);}'+
      '.bhist-latest{color:rgba(80,240,160,0.98)!important;font-weight:800;}'+
      '.bhist-empty{font-size:10px;color:rgba(255,255,255,0.55);text-align:center;padding:6px;}'+
      '.bhist-hint{margin-left:auto;font-size:9px;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:.02em;white-space:nowrap;}'+
      '.bh-actions{display:inline-flex;gap:4px;margin-left:auto;flex-shrink:0;}'+
      '.bh-edit,.bh-del{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:6px;font-size:11px;line-height:1;padding:3px 5px;cursor:pointer;}'+
      '.bh-edit:hover{background:rgba(10,132,255,0.28);}'+
      '.bh-del:hover{background:rgba(255,69,58,0.28);}'+
      '.bhist-editing,.bhist-deleting{display:flex;flex-direction:column;align-items:stretch;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.18);border-radius:9px;padding:8px;margin:3px 0;}'+
      '.bhe-head{font-size:10px;font-weight:800;color:rgba(255,255,255,0.88);}'+
      '.bhx-q{font-size:11.5px;font-weight:800;color:#ffb4ad;line-height:1.35;word-break:break-word;}'+
      '.bhe-dt,.bhe-nm{width:100%;box-sizing:border-box;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.25);border-radius:7px;color:#fff;font-size:12px;font-weight:700;padding:6px;color-scheme:dark;}'+
      '.bhe-btns{display:flex;gap:6px;}'+
      '.bhe-save,.bhx-yes,.bhe-cancel,.bhx-no{flex:1;border-radius:7px;font-size:11px;font-weight:800;padding:7px 4px;cursor:pointer;}'+
      '.bhe-save{background:rgba(0,210,90,0.18);border:1px solid rgba(0,230,110,0.45);color:#7df5a5;}'+
      '.bhx-yes{background:rgba(255,69,58,0.20);border:1px solid rgba(255,69,58,0.60);color:#ffb4ad;}'+
      '.bhe-cancel,.bhx-no{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.78);}'+
      '.bhist::-webkit-scrollbar{width:6px;}'+
      '.bhist::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.22);border-radius:3px;}'+
      '.bring-label-over{color:#ff8d84!important;font-weight:900!important;letter-spacing:.03em;}'+
      /* ── NOMAINĪTS — ghost/minimal style ── */
      '.bnm-section{width:100%;background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.08);border-radius:13px;padding:7px 9px 7px;box-sizing:border-box;flex-shrink:0;}'+
      '.brc[data-room="ge"] .bnm-section{border-color:rgba(10,132,255,0.22);}'+
      '.brc[data-room="philips"] .bnm-section{border-color:rgba(48,209,88,0.22);}'+
      '.bnm-label{font-size:7px;font-weight:800;letter-spacing:.18em;color:rgba(255,255,255,0.75);text-transform:uppercase;margin-bottom:4px;text-align:center;font-family:"Space Grotesk",system-ui;}'+
      /* ── Day nav arrows ── */
      '.bwd-nav{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;margin-bottom:2px;}'+
      '.bwd-arr{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:7px;color:rgba(255,255,255,0.85);font-size:13px;width:24px;height:21px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s;line-height:1;flex-shrink:0;}'+
      '.bwd-arr:hover{background:rgba(255,255,255,0.18);color:#fff;}'+
      '.bwd-arr:active{background:rgba(255,255,255,0.28)!important;}'+
      '.bwd-lbl{font-size:9px;font-weight:800;color:rgba(255,255,255,0.90);letter-spacing:.06em;text-transform:uppercase;min-width:36px;text-align:center;font-family:"Space Grotesk",system-ui;}'+
      /* ── Worker chips — single row, horizontal scroll ── */
      '.bwrap{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;width:100%;overflow:visible;padding-bottom:3px;}'+
      '.bwc{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);border-radius:11px;color:rgba(255,255,255,0.88);font-size:10px;font-weight:700;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap;flex:0 1 auto;max-width:100%;font-family:"Space Grotesk",system-ui;}'+
      '.bwc:hover{background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.36);color:#fff;}'+
      /* GE: blue active */
      '.brc[data-room="ge"] .bwsel{background:rgba(10,132,255,0.24)!important;border-color:rgba(10,132,255,0.70)!important;color:rgba(140,205,255,0.98)!important;box-shadow:0 0 10px rgba(10,132,255,0.22);}'+
      /* PHILIPS: green active */
      '.brc[data-room="philips"] .bwsel{background:rgba(48,209,88,0.22)!important;border-color:rgba(48,209,88,0.70)!important;color:rgba(100,240,145,0.98)!important;box-shadow:0 0 10px rgba(48,209,88,0.22);}'+
      /* Blank "—" chip: always neutral */
      '.bwblank.bwsel{background:rgba(255,255,255,0.09)!important;border-color:rgba(255,255,255,0.24)!important;color:rgba(255,255,255,0.55)!important;box-shadow:none!important;}'+
      /* Custom name input */
      '.bname-inp{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.11);border-radius:9px;color:#fff;font-size:11px;font-weight:600;padding:6px 10px;outline:none;text-align:center;box-sizing:border-box;transition:border-color .2s;flex-shrink:0;}'+
      '.bname-inp::placeholder{color:rgba(255,255,255,0.18);}'+
      '.bname-inp:focus{border-color:rgba(0,200,255,0.45)!important;}'+
      /* ── Edit modal ── */
      '#bolus-edit-modal{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;overscroll-behavior:contain;}'+
      '#bolus-edit-box{background:#0c1420;border:1px solid rgba(255,255,255,0.10);border-radius:20px;padding:26px 22px;display:flex;flex-direction:column;gap:14px;min-width:280px;box-shadow:0 24px 64px rgba(0,0,0,.75);}'+
      '#bolus-edit-title{font-size:12px;font-weight:800;color:rgba(255,255,255,0.75);letter-spacing:.12em;text-align:center;}'+
      '#bolus-edit-inp{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:10px;color:#fff;font-size:15px;font-weight:600;padding:13px 12px;width:100%;box-sizing:border-box;outline:none;text-align:center;cursor:pointer;}'+
      '#bolus-edit-inp:focus{border-color:rgba(0,200,255,0.50)!important;}'+
      '#bolus-edit-save{flex:1;background:rgba(0,200,80,0.14);border:1px solid rgba(0,220,100,0.35);border-radius:10px;color:rgba(80,240,140,0.95);font-size:13px;font-weight:800;padding:13px 8px;cursor:pointer;}'+
      '#bolus-edit-save:active{background:rgba(0,200,80,0.30)!important;}'+
      '#bolus-edit-cancel{flex:0 0 76px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:10px;color:rgba(255,255,255,0.35);font-size:12px;font-weight:700;padding:13px 8px;cursor:pointer;}'+
      '#bolus-gs-btn{display:none;}'+
      /* ── Dock button progress ring ── */
      '#bolusDocBtn{position:relative!important;overflow:visible!important;border-radius:18px!important;}'+
      '#bolusDocBtn>*{position:relative;z-index:1;}'+
      '#bolusDocBtn::before{content:"";position:absolute;inset:-2px;border-radius:20px;padding:2px;background:conic-gradient(from -90deg,var(--bp-col,transparent) var(--bp-pct,0%),rgba(255,255,255,0.05) 0%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:destination-out;mask-composite:exclude;pointer-events:none;z-index:0;opacity:var(--bp-vis,0);transition:opacity 1.2s;}'+
      '#bolusDocBtn.bolus-warn{border-color:rgba(255,150,0,0.7)!important;box-shadow:0 0 18px rgba(255,150,0,.45),0 2px 12px rgba(0,0,0,.45)!important;}'+
      '#bolusDocBtn.bolus-alert{border-color:rgba(255,59,48,0.62)!important;border-width:1px!important;animation:none!important;}'+
      '@keyframes bap{0%,100%{background:rgba(255,30,0,0.06);box-shadow:0 2px 12px rgba(0,0,0,.45),0 0 6px rgba(255,59,48,.25),0 0 14px rgba(255,59,48,.10);}50%{background:rgba(255,30,0,0.38);box-shadow:0 2px 12px rgba(0,0,0,.45),0 0 22px rgba(255,59,48,.95),0 0 50px rgba(255,59,48,.55),0 0 80px rgba(255,59,48,.22);}}'+
      '@keyframes ledBap{0%,100%{box-shadow:0 0 5px rgba(255,59,48,.6);}50%{box-shadow:0 0 12px rgba(255,59,48,1),0 0 22px rgba(255,59,48,.5);}}'+
      '#bolusDocBtn.bolus-alert #bolusLed{animation:ledBap 1.5s ease-in-out infinite!important;}'+
      /* ── Ghost date / time pickers ── */
      '.bnm-prow{display:flex;gap:5px;align-items:center;width:100%;}'+
      '.bnm-dpick,.bnm-tpick{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:8px;color:rgba(255,255,255,0.65);font-size:10px;font-weight:700;padding:6px 4px;cursor:pointer;text-align:center;transition:background .15s,border-color .15s;white-space:nowrap;}'+
      '.bnm-dpick:hover,.bnm-tpick:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.18);}'+
      '.brc[data-room="ge"] .bnm-pact{background:rgba(10,132,255,0.16)!important;border-color:rgba(10,132,255,0.52)!important;color:rgba(130,200,255,0.97)!important;}'+
      '.brc[data-room="philips"] .bnm-pact{background:rgba(48,209,88,0.16)!important;border-color:rgba(48,209,88,0.52)!important;color:rgba(100,240,145,0.97)!important;}'+
      '.bnm-savepick{flex-shrink:0;background:rgba(0,210,90,0.16);border:1px solid rgba(0,230,110,0.38);border-radius:8px;color:rgba(80,245,150,0.95);font-size:10px;font-weight:800;padding:6px 8px;cursor:pointer;white-space:nowrap;transition:background .15s;}'+
      '.bnm-savepick:active{background:rgba(0,210,90,0.35)!important;}'+
      '.bnm-now{flex-shrink:0;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:8px;color:rgba(255,255,255,0.50);font-size:10px;font-weight:700;padding:6px 8px;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s;}'+
      '.bnm-now:hover{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.82);}'+
      /* ── Calendar dropdown ── */
      '.bnm-caldrop{width:100%;background:#090f1c;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:6px 5px 8px;box-sizing:border-box;margin-top:4px;}'+
      '.bnm-calh{display:flex;align-items:center;justify-content:space-between;padding:0 3px 5px;}'+
      '.bnm-calh span{font-size:10px;font-weight:800;color:rgba(255,255,255,0.72);letter-spacing:.04em;}'+
      '.bnm-cnav{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:6px;color:rgba(255,255,255,0.50);font-size:13px;font-weight:700;cursor:pointer;padding:1px 8px;line-height:1.4;transition:background .12s,color .12s;}'+
      '.bnm-cnav:hover{background:rgba(255,255,255,0.10);color:#fff;}'+
      '.bnm-calgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}'+
      '.bcd-hd{font-size:7px;font-weight:800;color:rgba(255,255,255,0.20);text-align:center;padding:1px 0 4px;letter-spacing:.04em;}'+
      '.bcd{background:none;border:none;color:rgba(255,255,255,0.52);font-size:10px;font-weight:600;padding:4px 0;border-radius:7px;cursor:pointer;text-align:center;transition:background .12s,color .12s;}'+
      '.bcd:hover{background:rgba(255,255,255,0.09);color:#fff;}'+
      '.bcd.bcd-t{color:rgba(100,200,255,0.95);font-weight:900;}'+
      '.brc[data-room="ge"] .bcd.bcd-s{background:rgba(10,132,255,0.28)!important;color:rgba(140,210,255,0.99)!important;font-weight:900;}'+
      '.brc[data-room="philips"] .bcd.bcd-s{background:rgba(48,209,88,0.28)!important;color:rgba(100,245,145,0.99)!important;font-weight:900;}'+
      /* ── Time picker dropdown ── */
      '.bnm-tpdrop{display:flex;align-items:center;justify-content:center;gap:8px;background:#090f1c;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 10px;margin-top:4px;}'+
      '.bnm-tpcol{display:flex;flex-direction:column;align-items:center;gap:4px;}'+
      '.bnm-tpa{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:8px;color:rgba(255,255,255,0.50);font-size:12px;width:34px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s;}'+
      '.bnm-tpa:hover{background:rgba(255,255,255,0.12);color:#fff;}'+
      '.bnm-tpa:active{background:rgba(0,190,255,0.20)!important;color:rgba(140,235,255,0.97)!important;}'+
      '.bnm-tpv{font-size:clamp(18px,2.8dvh,24px);font-weight:900;color:#fff;font-variant-numeric:tabular-nums;min-width:34px;text-align:center;line-height:1.1;}'+
      '.bnm-tpsep{font-size:clamp(18px,2.8dvh,24px);font-weight:900;color:rgba(255,255,255,0.32);line-height:1.1;margin-bottom:2px;}'+
      /* ── Medical injector screen pass ── */
      '#bolus-sheet{background:linear-gradient(180deg,#06111f 0%,#020712 100%)!important;border-color:rgba(43,151,255,.42)!important;border-radius:10px!important;box-shadow:0 -4px 14px rgba(0,0,0,.52),inset 0 1px 0 rgba(121,196,255,.08)!important;}'+
      '#bolus-title-bar{padding:13px 18px 12px!important;background:linear-gradient(180deg,rgba(12,30,52,.84),rgba(3,10,20,.96))!important;border-bottom:1px solid rgba(32,150,255,.72)!important;box-shadow:0 1px 0 rgba(80,190,255,.16)!important;}'+
      '#bolus-title{font-size:17px!important;font-weight:900!important;letter-spacing:.22em!important;color:#f1f7ff!important;text-shadow:none!important;}'+
      '#bolus-title i{color:#2b95ff!important;opacity:1!important;font-size:15px!important;margin-right:8px!important;}'+
      '#bolus-close-btn{width:38px!important;height:38px!important;border-radius:7px!important;background:rgba(4,18,34,.92)!important;border-color:rgba(43,151,255,.74)!important;color:#f3f8ff!important;font-size:22px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;}'+
      '#bolus-rooms{gap:14px!important;padding:12px 14px max(env(safe-area-inset-bottom,0px),18px)!important;background:linear-gradient(90deg,rgba(16,69,122,.08),rgba(0,0,0,0),rgba(25,124,64,.08))!important;}'+
      '.brc{border-radius:14px!important;padding:14px!important;gap:8px!important;background:linear-gradient(160deg,rgba(5,16,31,.98),rgba(1,7,16,.98))!important;border-color:rgba(111,151,194,.24)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 3px 10px rgba(0,0,0,.34)!important;}'+
      '.brc[data-room="ge"]{background:radial-gradient(circle at 50% 20%,rgba(10,132,255,.18),transparent 42%),linear-gradient(160deg,#06162a,#020814)!important;border-color:rgba(43,151,255,.68)!important;}'+
      '.brc[data-room="philips"]{background:radial-gradient(circle at 50% 20%,rgba(48,209,88,.16),transparent 42%),linear-gradient(160deg,#061b15,#020a0d)!important;border-color:rgba(74,222,128,.56)!important;}'+
      '.brn{font-size:18px!important;letter-spacing:.28em!important;text-shadow:none!important;}'+
      '.bring-wrap{width:min(58%,clamp(112px,18dvh,158px))!important;}'+
      '.bring-bg{stroke:rgba(34,65,102,.82)!important;stroke-width:9!important;}'+
      '.bring-arc{stroke-width:9!important;filter:none!important;}'+
      '.bring-time{font-size:clamp(20px,3.2dvh,28px)!important;color:#f8fbff!important;text-shadow:none!important;}'+
      '.bring-secs{font-size:clamp(12px,1.7dvh,15px)!important;color:rgba(248,251,255,.92)!important;}'+
      '.bring-label{font-size:10px!important;color:rgba(218,232,248,.74)!important;}'+
      '.bwd-arr,.bwc,.bwblank,.bwcits,.bnm-dpick,.bnm-tpick,.bnm-now,.bnm-savepick,.bnm-cnav,.bnm-tpa{background:linear-gradient(180deg,rgba(12,33,58,.92),rgba(2,12,25,.96))!important;border:1px solid rgba(57,151,255,.52)!important;border-radius:7px!important;color:#f4f9ff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)!important;font-weight:900!important;}'+
      '.brc[data-room="philips"] .bwd-arr,.brc[data-room="philips"] .bwc,.brc[data-room="philips"] .bwblank,.brc[data-room="philips"] .bwcits,.brc[data-room="philips"] .bnm-dpick,.brc[data-room="philips"] .bnm-tpick,.brc[data-room="philips"] .bnm-now,.brc[data-room="philips"] .bnm-savepick,.brc[data-room="philips"] .bnm-cnav,.brc[data-room="philips"] .bnm-tpa{background:linear-gradient(180deg,rgba(9,43,25,.94),rgba(2,17,10,.98))!important;border-color:rgba(74,222,128,.54)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)!important;}'+
      '.bwd-lbl,.bnm-label,.bhist-lbl{color:var(--room-col,#60a5fa)!important;text-shadow:none!important;}'+
      '.brc[data-room="ge"]{--room-col:#2b95ff;}.brc[data-room="philips"]{--room-col:#63e46f;}'+
      '.bnm-section{background:rgba(1,9,18,.74)!important;border-color:rgba(43,151,255,.46)!important;border-radius:13px!important;box-shadow:inset 0 0 18px rgba(0,0,0,.25)!important;}'+
      '.brc[data-room="philips"] .bnm-section{border-color:rgba(74,222,128,.42)!important;}'+
      '.bnm-savepick,.bnm-now{min-width:96px!important;color:#ffffff!important;}'+
      '.brc[data-room="ge"] .bnm-savepick,.brc[data-room="ge"] .bnm-now{background:linear-gradient(180deg,rgba(18,90,154,.92),rgba(5,36,73,.96))!important;border-color:rgba(43,151,255,.72)!important;}'+
      '.brc[data-room="philips"] .bnm-savepick,.brc[data-room="philips"] .bnm-now{background:linear-gradient(180deg,rgba(24,117,52,.92),rgba(6,50,24,.96))!important;border-color:rgba(74,222,128,.72)!important;}'+
      '.bhist{background:rgba(1,7,15,.86)!important;border-color:rgba(115,144,177,.18)!important;border-radius:9px!important;padding:5px 8px 18px!important;overflow-y:auto!important;border-bottom:1px solid rgba(115,144,177,.22)!important;}'+
      '.bhist-row{border-bottom-color:rgba(129,156,190,.15)!important;color:#f3f7fb!important;}'+
      '.bhist-num{color:rgba(222,232,244,.50)!important;}'+
      '.bhist-time{color:rgba(255,255,255,.78)!important;}'+
      '.bhist-who{border:1px solid rgba(43,151,255,.42)!important;background:rgba(5,24,43,.86)!important;color:#dff4ff!important;border-radius:6px!important;}'+
      '.brc[data-room="philips"] .bhist-who{background:rgba(5,35,19,.86)!important;color:#dcffe8!important;}'+
      /* ── Compact vertical fit ── */
      '#bolus-sheet{height:calc(100dvh - 10px)!important;}'+
      '#bolus-title-bar{padding:8px 16px 8px!important;}'+
      '#bolus-title{font-size:15px!important;}'+
      '#bolus-close-btn{width:32px!important;height:32px!important;font-size:19px!important;}'+
      '#bolus-rooms{padding:8px 12px max(env(safe-area-inset-bottom,0px),76px)!important;align-items:stretch!important;}'+
      '.brc{padding:10px 12px!important;gap:5px!important;display:flex!important;min-height:0!important;}'+
      '.brn{font-size:16px!important;line-height:1!important;}'+
      '.bring-wrap{width:min(42%,clamp(92px,14dvh,124px))!important;}'+
      '.bring-time{font-size:clamp(18px,2.6dvh,24px)!important;}'+
      '.bring-secs{font-size:clamp(10px,1.4dvh,13px)!important;}'+
      '.bwd-nav{margin-bottom:0!important;}'+
      '.bwrap{gap:4px!important;padding-bottom:1px!important;}'+
      '.bwc{font-size:9px!important;padding:4px 8px!important;border-radius:8px!important;}'+
      '.bnm-section{padding:5px 7px!important;border-radius:10px!important;}'+
      '.bnm-label{font-size:7px!important;margin-bottom:3px!important;}'+
      '.bnm-dpick,.bnm-tpick,.bnm-now,.bnm-savepick{font-size:9px!important;padding:5px 6px!important;border-radius:7px!important;}'+
      '.bhist-hdr{padding-top:2px!important;}'+
      '.bhist{flex:1 1 0!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;padding-bottom:26px!important;margin-bottom:0!important;}'+

      '.bhist-row{font-size:11px!important;padding:4px 2px!important;}'+
      /* Sheet ends ABOVE the bottom dock (overlay gets padding-bottom at open
         time, measured from the real dock height) — no more rows hiding
         behind the toolbar. */
      '#bolus-overlay{padding-top:10px;box-sizing:border-box;}'+
      '#bolus-sheet{height:100%!important;max-height:100%!important;border-bottom:1px solid rgba(43,151,255,.42)!important;border-radius:12px!important;}'+
      '#bolus-rooms{padding-bottom:max(env(safe-area-inset-bottom,0px),14px)!important;}'+
      '#bolus-tops-btn{background:rgba(255,199,50,0.12);border:1px solid rgba(255,199,50,0.45);border-radius:9px;color:#ffd77a;font-size:11px;font-weight:800;padding:6px 10px;cursor:pointer;letter-spacing:.06em;white-space:nowrap;}'+
      '#bolus-tops-btn.on{background:rgba(255,199,50,0.28);}'+
      '#bolus-tops{flex-shrink:0;margin:8px 14px 0;padding:9px 12px;background:rgba(255,199,50,0.07);border:1px solid rgba(255,199,50,0.30);border-radius:12px;}'+
      '.btops-h{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#ffd77a;margin-bottom:6px;}'+
      '.btops-row{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:rgba(255,255,255,.88);padding:3px 0;}'+
      '.btops-first{color:#ffe9a8;font-size:13px;}'+
      '.btops-medal{width:24px;text-align:center;flex-shrink:0;}'+
      '.btops-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'+
      '.btops-cnt{font-variant-numeric:tabular-nums;color:#ffd77a;flex-shrink:0;}'+
      /* ── CT motion inspired working console: large data, three media slots ── */
      '.bdevice-console{display:flex;flex-direction:column;gap:7px;width:100%;min-width:0;}'+
      '.bdevice-console .binj-body{position:relative;width:100%!important;aspect-ratio:auto!important;display:grid;grid-template-columns:1fr;gap:5px;padding:8px 10px 7px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--room-col) 46%,transparent);border-radius:12px;background:linear-gradient(180deg,rgba(10,27,49,.98),rgba(2,11,23,.98));}'+
      '.bdevice-console .binj-shell{display:none!important;}'+
      '.bdevice-console .bscreen{position:static!important;min-height:68px;border-radius:9px!important;padding:6px 10px!important;background:linear-gradient(180deg,#f8fbff,#dce8f4)!important;}'+
      '.bdevice-console .bring-time{font-size:clamp(30px,4.8dvh,44px)!important;line-height:.95!important;letter-spacing:-.045em!important;font-variant-numeric:tabular-nums;}'+
      '.bdevice-console .bring-secs{font-size:clamp(15px,2dvh,19px)!important;line-height:1!important;}'+
      '.bdevice-console .bring-label{font-size:9px!important;line-height:1.1!important;margin-top:2px;}'+
      '.bdevice-console .bbar{position:static!important;width:100%!important;height:9px!important;min-height:9px!important;}'+
      '.bdevice-console .bbar-scale{position:static!important;display:flex!important;justify-content:space-between!important;padding:0 1px!important;font-size:8px!important;}'+
      '.bdevice-console .bbar-txt{position:static!important;min-height:14px;text-align:center;font-size:11px!important;line-height:1.1!important;}'+
      '.bmedia-panel{width:100%;box-sizing:border-box;padding:7px;border:1px solid rgba(116,169,221,.24);border-radius:12px;background:linear-gradient(180deg,rgba(9,24,42,.92),rgba(1,9,19,.96));}'+
      '.bmedia-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;}'+
      '.bmedia-head>span{display:flex;align-items:baseline;gap:6px;color:#e9f4ff;}'+
      '.bmedia-head b{font-size:9px;letter-spacing:.16em;}'+
      '.bmedia-head small{font-size:7px;color:rgba(219,234,254,.48);}'+
      '.bmedia-head>div{display:flex;gap:4px;}'+
      '.bmedia-preset,.bmedia-clear{border-radius:6px;padding:4px 7px;font:800 8px/1 system-ui;cursor:pointer;color:#ddecff;background:#0b2743;border:1px solid rgba(87,170,255,.42);}'+
      '.bmedia-clear{color:rgba(255,255,255,.58);background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.14);}'+
      '.bmedia-clear:disabled{opacity:.3;cursor:default;}'+
      '.bmedia-rack{display:grid;grid-template-columns:1fr .82fr 1fr;gap:5px;position:relative;align-items:stretch;}'+
      '.bmedia-rack:after{content:"";position:absolute;left:13%;right:13%;bottom:5px;height:2px;background:linear-gradient(90deg,var(--room-col),#cfe9ff,var(--room-col));opacity:.34;border-radius:9px;pointer-events:none;}'+
      '.bmedia-slot{min-width:0;border:1px solid rgba(139,181,222,.18);border-radius:9px;background:rgba(4,13,25,.86);padding:4px;transition:border-color .16s,background .16s,box-shadow .16s;}'+
      '.bmedia-slot.is-loaded{border-color:#27d17f;background:linear-gradient(180deg,rgba(18,96,57,.34),rgba(3,24,18,.88));box-shadow:inset 0 0 16px rgba(39,209,127,.08);}'+
      '.bmedia-toggle{width:100%;border:0;background:none;color:#eef7ff;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;}'+
      '.bmedia-bottle{position:relative;display:block;width:34px;height:36px;margin:0 auto 1px;border:2px solid #426a92;border-radius:6px 6px 9px 9px;background:linear-gradient(180deg,rgba(30,75,120,.82),rgba(7,31,61,.95));box-sizing:border-box;}'+
      '.bmedia-bottle:before{content:"";position:absolute;left:11px;top:-6px;width:8px;height:6px;border-radius:2px 2px 0 0;background:#93abc3;}'+
      '.bmedia-bottle:after{content:"";position:absolute;left:14px;bottom:-7px;width:3px;height:7px;background:#8da8c1;border-radius:0 0 2px 2px;}'+
      '.bmedia-bottle i{position:absolute;inset:6px 4px 4px;border-radius:4px;background:rgba(35,183,100,.22);}'+
      '.bmedia-slot.is-loaded .bmedia-bottle{border-color:#37dc8c;background:linear-gradient(180deg,#159652,#08713b);}'+
      '.bmedia-slot.is-loaded .bmedia-bottle i{background:linear-gradient(180deg,rgba(161,255,201,.38),rgba(23,121,66,.16));}'+
      '.bmedia-nacl .bmedia-bottle{border-color:#a7bed4;background:linear-gradient(180deg,rgba(226,241,255,.72),rgba(112,154,193,.56));}'+
      '.bmedia-nacl.is-loaded .bmedia-bottle{border-color:#dff3ff;background:linear-gradient(180deg,#eef9ff,#98bed9);}'+
      '.bmedia-slot-kicker{font-size:6px;font-weight:900;letter-spacing:.12em;color:rgba(209,228,247,.55);}'+
      '.bmedia-toggle strong{white-space:nowrap;font-size:8px;line-height:1.05;letter-spacing:.02em;}'+
      '.bmedia-toggle strong b{font-size:18px;color:#67e29a;vertical-align:-2px;}'+
      '.bmedia-loaded{font-size:9px;font-weight:900;color:rgba(225,238,251,.55);white-space:nowrap;}'+
      '.bmedia-slot.is-loaded .bmedia-loaded{color:#78f0a9;}'+
      '.bmedia-options{display:flex;flex-direction:column;gap:2px;margin-top:4px;}'+
      '.bmedia-option-label{display:block;text-align:center;font-size:6px;font-weight:800;color:rgba(213,228,244,.38);}'+
      '.bmedia-choice-row{display:grid;grid-template-columns:1fr 1fr;gap:2px;}'+
      '.bmedia-choice{min-width:0;border:1px solid rgba(117,160,203,.18);border-radius:5px;padding:3px 1px;background:rgba(255,255,255,.035);color:rgba(229,240,251,.6);font:800 8px/1 system-ui;cursor:pointer;}'+
      '.bmedia-choice.is-selected{border-color:#28d17f;background:rgba(26,149,84,.2);color:#91f5ba;}'+
      '.bmedia-nacl-note{text-align:center;margin-top:6px;font-size:7px;font-weight:800;color:rgba(220,237,250,.54);}'+
      '.bmedia-help{margin:5px 0 0;text-align:center;font-size:6.5px;line-height:1.15;color:rgba(211,228,245,.38);}'+
      '.bnm-section{padding:8px!important;}'+
      '.bnm-label{font-size:8px!important;margin-bottom:5px!important;}'+
      '.bnm-prow{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px!important;align-items:end!important;}'+
      '.bnm-native-field{display:flex;flex-direction:column;gap:3px;min-width:0;}'+
      '.bnm-native-field>span{font-size:6px;font-weight:900;letter-spacing:.13em;color:rgba(215,232,248,.48);text-align:center;}'+
      '.bnm-native-field input{width:100%;height:42px;box-sizing:border-box;border:1px solid rgba(65,160,255,.55);border-radius:8px;padding:3px 6px;background:linear-gradient(180deg,#102b49,#061426);color:#fff;font:900 16px/1 "Space Grotesk",system-ui;font-variant-numeric:tabular-nums;text-align:center;color-scheme:dark;outline:none;}'+
      '.bnm-time-field input{font-size:clamp(21px,3.2dvh,28px)!important;letter-spacing:.04em;}'+
      '.brc[data-room="philips"] .bnm-native-field input{border-color:rgba(74,222,128,.58);background:linear-gradient(180deg,#123921,#061b10);}'+
      '.bnm-prow .bnm-now,.bnm-prow .bnm-savepick{height:38px!important;min-width:0!important;width:100%!important;padding:5px 8px!important;font-size:10px!important;line-height:1.05!important;}'+
      '.bnm-last{display:block;margin-top:4px;text-align:center;font-size:7px;color:rgba(218,232,246,.38);font-variant-numeric:tabular-nums;}'+
      '.bhist-row{display:grid!important;grid-template-columns:auto auto minmax(0,1fr) auto!important;align-items:center!important;}'+
      '.bhist-media{grid-column:2/-1;display:block;margin:2px 0 3px;padding:3px 6px;border-radius:5px;background:rgba(51,144,224,.08);color:#98c9f3;font-size:7px;font-weight:800;line-height:1.2;}'+
      /* ulrich medical CT motion: deep blue + cyan light, clean white information hierarchy. */+
      '#bolus-sheet{max-width:min(920px,98vw)!important;position:relative!important;background:radial-gradient(circle at 76% 0,rgba(82,197,207,.24),transparent 34%),linear-gradient(145deg,#124a72 0%,#0a3159 25%,#061d3b 62%,#041329 100%)!important;border-color:#64cad3!important;}'+
      '#bolus-title-bar{background:linear-gradient(90deg,rgba(8,42,73,.99),rgba(13,72,98,.98))!important;border-bottom-color:#65cbd3!important;}'+
      '#bolus-title{display:flex!important;flex-direction:column;align-items:flex-start;gap:2px;line-height:1!important;}'+
      '.bolus-main-title{color:#fff;font-size:14px;font-weight:900;letter-spacing:.18em;}'+
      '#bolus-guide-btn{display:flex;align-items:center;gap:5px;height:30px;padding:0 9px;border:1px solid #83dce1;border-radius:7px;background:#0a4168;color:#fff;font:900 9px/1 "Space Grotesk",system-ui;letter-spacing:.08em;cursor:pointer;white-space:nowrap;}'+
      '#bolus-guide-btn b{display:grid;place-items:center;width:16px;height:16px;border:1px solid #fff;border-radius:50%;font-size:11px;}'+
      '#bolus-guide-btn.is-new{animation:bolusHelpPulse 2.2s ease-in-out infinite;}'+
      '@keyframes bolusHelpPulse{50%{background:#11758a;box-shadow:0 0 0 3px rgba(107,218,225,.24),0 0 22px rgba(107,218,225,.42)}}'+
      '#bolus-rooms{background:linear-gradient(90deg,rgba(40,150,184,.08),rgba(4,23,48,.12),rgba(77,194,201,.08))!important;}'+
      '.brc[data-room="ge"],.brc[data-room="philips"]{background:linear-gradient(165deg,rgba(13,53,86,.98),rgba(4,21,43,.99))!important;border-color:#4daabf!important;--room-col:#73d4dc;}'+
      '.brc[data-room="philips"]{--room-col:#8ce2df;}'+
      '.brc[data-room="philips"] .bwd-arr,.brc[data-room="philips"] .bwc,.brc[data-room="philips"] .bwblank,.brc[data-room="philips"] .bwcits,.brc[data-room="philips"] .bnm-now,.brc[data-room="philips"] .bnm-savepick{background:linear-gradient(180deg,#155675,#083352)!important;border-color:#71d2d8!important;}'+
      '.brc[data-room="philips"] .bnm-section{border-color:#58bdc8!important;}'+
      '.brc[data-room="philips"] .bnm-native-field input{border-color:#69cbd2!important;background:linear-gradient(180deg,#174f70,#0a3152)!important;}'+
      '.brc[data-room="philips"] .bhist-who{background:#092f4c!important;color:#fff!important;}'+
      '.bdevice-console .binj-body{padding:5px 8px!important;}'+
      '.bdevice-console .bscreen{min-height:56px!important;padding:4px 8px!important;}'+
      '.bdevice-console .bbar-scale{display:none!important;}'+
      '.bdevice-console .bbar-txt{min-height:11px!important;font-size:10px!important;}'+
      '.bmedia-panel{padding:6px!important;background:linear-gradient(180deg,#f8fcfd,#dcecf0)!important;border-color:#b9e5e8!important;box-shadow:inset 0 1px 0 #fff,0 6px 16px rgba(0,10,30,.20);}'+
      '.bmedia-head>span,.bmedia-head b{color:#073457!important}.bmedia-head small{color:#0f6680!important;font-weight:800!important}.bmedia-help{display:none!important}.bmedia-option-label,.bmedia-nacl-note{color:#174d68!important;font-weight:900!important}.bmedia-slot{background:linear-gradient(180deg,#fff,#e1eef1)!important;border-color:#8eb7c3!important}.bmedia-slot.is-loaded{background:linear-gradient(180deg,#fbfffe,#d9f1ea)!important;border-color:#168a78!important}.bmedia-toggle{color:#072f50!important}.bmedia-loaded{color:#154f69!important}.bmedia-slot.is-loaded .bmedia-loaded{color:#08715e!important}.bmedia-choice{background:#f1f7f8!important;color:#0b3c5c!important;border-color:#8eb7c3!important}.bmedia-choice.is-selected{background:#0c6b79!important;border-color:#0c6b79!important;color:#fff!important}.bmedia-preset{background:#0a4168!important;border-color:#0a4168!important;color:#fff!important}.bmedia-clear{background:#fff!important;color:#0b4764!important;border-color:#9abfc8!important;}'+
      '.bnm-native-field input:focus,.bnm-native-field input:focus-visible{outline:0!important;border-color:#7ce2e5!important;box-shadow:0 0 0 3px rgba(93,210,216,.34)!important;}'+
      '.bnm-native-field input::selection{background:#9be4e7!important;color:#062d4b!important;}'+
      '.bnm-native-field>span,.bnm-label,.bwd-lbl,.bhist-lbl{color:#85e1e5!important;font-size:8px!important;font-weight:900!important;}'+
      '.bnm-last,.bhist-hint{color:#fff!important;font-weight:750!important;opacity:.82!important;}'+
      '.bwc{font-size:11px!important;font-weight:900!important;color:#fff!important;}'+
      '.bhist{flex:1 0 88px!important;min-height:88px!important;color:#fff!important;}'+
      '.bhist-row{font-size:12px!important;color:#fff!important;}'+
      '.bhist-time{color:#fff!important;font-weight:850!important}.bhist-num{color:#8bdde2!important}.bhist-who{font-size:11px!important;font-weight:900!important;color:#fff!important}.bhist-media{color:#fff!important;background:#0b4365!important;font-size:8px!important;}'+
      '#bolus-guide{position:absolute;inset:0;z-index:40;display:none;padding:54px 18px 18px;box-sizing:border-box;background:radial-gradient(circle at 78% 0,rgba(91,205,215,.30),transparent 35%),linear-gradient(150deg,rgba(9,62,96,.995),rgba(3,20,43,.998));overflow-y:auto;}'+
      '#bolus-guide.open{display:block;}'+
      'body.bolus-work-open #dockShelf,body.bolus-work-open #bottomBtnBar{opacity:0!important;transform:translateY(110%)!important;pointer-events:none!important;transition:opacity .16s ease,transform .16s ease!important;}'+
      '.bolus-guide-box{width:min(820px,100%);margin:0 auto;color:#072f50;}'+
      '.bolus-guide-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;color:#fff;margin-bottom:10px;}'+
      '.bolus-guide-head small{display:block;color:#83e1e5;font:900 8px/1 "Space Grotesk",system-ui;letter-spacing:.18em;margin-bottom:5px;}'+
      '.bolus-guide-head h2{margin:0;font:900 clamp(23px,3.8vw,35px)/1.05 "Space Grotesk",system-ui;letter-spacing:-.035em;}'+
      '.bolus-guide-close{display:grid;place-items:center;flex:0 0 auto;width:34px;height:34px;border:1px solid #83dce1;border-radius:8px;background:#083b60;color:#fff;font-size:21px;cursor:pointer;}'+
      '.bolus-guide-intro{margin:0 0 11px;color:#fff;font:700 11px/1.4 "Space Grotesk",system-ui;}'+
      '.bolus-guide-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}'+
      '.bolus-guide-step{overflow:hidden;border-radius:12px;background:#f7fcfd;border:1px solid #c3ebed;box-shadow:0 10px 25px rgba(0,10,28,.28);}'+
      '.bolus-guide-photo{position:relative;height:190px;background:#dcecef;overflow:hidden}.bolus-guide-photo img{display:block;width:100%;height:100%;object-fit:cover}.bolus-guide-step:nth-child(1) img{object-position:50% 52%}.bolus-guide-step:nth-child(2) img{object-position:50% 48%}.bolus-guide-step:nth-child(3) img{object-position:52% 38%}'+
      '.bolus-guide-num{position:absolute;left:9px;top:9px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0d5275;color:#fff;font:900 15px/1 system-ui;}'+
      '.bolus-guide-copy{padding:10px 11px 12px}.bolus-guide-copy h3{margin:0 0 4px;color:#072f50;font:900 13px/1.1 "Space Grotesk",system-ui}.bolus-guide-copy p{margin:0;color:#083d5c;font:750 9.5px/1.38 "Space Grotesk",system-ui}'+
      '.bolus-guide-safety{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;margin-top:10px;padding:9px 11px;border:1px solid #78d7dc;border-radius:10px;background:#083d62;color:#fff}.bolus-guide-safety>strong{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#72d3da;color:#063352;font-size:15px}.bolus-guide-safety p{margin:0;color:#fff;font:700 9px/1.35 "Space Grotesk",system-ui}.bolus-guide-source{color:#9aedeb;font:900 8px/1.2 "Space Grotesk",system-ui;text-decoration:none;white-space:nowrap}.bolus-guide-done{display:block;width:100%;height:40px;margin-top:9px;border:1px solid #87e4e7;border-radius:9px;background:linear-gradient(180deg,#16869a,#0a5879);color:#fff;font:900 11px/1 "Space Grotesk",system-ui;letter-spacing:.10em;cursor:pointer;}'+
      /* Desktop uses its width: timer and the three media connections share one row. */+
      '#bolus-sheet{max-width:min(1180px,98vw)!important;}'+
      '.bdevice-console{display:grid!important;grid-template-columns:1fr!important;gap:0!important;align-items:stretch!important;}'+
      '.bdevice-console .binj-body{height:100%!important;align-content:center!important;padding:8px 10px!important;}'+
      '.bdevice-console .bscreen{min-height:62px!important;}'+
      '.bmedia-panel{height:100%!important;display:flex!important;flex-direction:column!important;justify-content:center!important;box-sizing:border-box!important;}'+
      '.bhist-hdr{flex:0 0 auto!important;}'+
      '.bhist{flex:1 1 110px!important;min-height:105px!important;}'+
      /* Flatten nested cards into one CT motion working surface. */+
      '.brc[data-room="ge"],.brc[data-room="philips"]{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:8px 12px!important;}'+
      '.brc[data-room="philips"]{border-left:1px solid rgba(112,210,217,.30)!important;}'+
      '.brn{color:#fff!important;font-size:17px!important;letter-spacing:.24em!important;}'+
      '.bdevice-console .binj-body{border:0!important;background:transparent!important;border-radius:0!important;box-shadow:none!important;}'+
      '.bdevice-console .bscreen{border:1px solid #b9e7ea!important;background:linear-gradient(180deg,#fff,#e7f3f5)!important;box-shadow:inset 0 -2px 0 #b5cbd2,0 7px 18px rgba(0,9,24,.30)!important;}'+
      '.bmedia-panel{padding:2px 4px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;justify-content:flex-start!important;}'+
      '.bmedia-head{margin-bottom:0!important}.bmedia-head>span,.bmedia-head b{color:#fff!important}.bmedia-head small{display:none!important}.bmedia-preset{background:#fff!important;border-color:#fff!important;color:#08395a!important}.bmedia-clear{width:25px!important;padding:4px!important;background:transparent!important;border-color:#7bd7dd!important;color:#fff!important}'+
      '.bmedia-rack{gap:2px!important;z-index:2!important}.bmedia-rack:after{left:17%!important;right:17%!important;bottom:-5px!important;height:3px!important;background:#d7edf0!important;opacity:.88!important}'+
      '.bmedia-slot,.bmedia-slot.is-loaded{padding:2px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}'+
      '.bmedia-toggle{color:#fff!important}.bmedia-slot-kicker{color:#8de1e4!important;font-size:7px!important}.bmedia-loaded,.bmedia-slot.is-loaded .bmedia-loaded{color:#fff!important}.bmedia-option-label{display:none!important}.bmedia-options{margin-top:2px!important;gap:2px!important}.bmedia-choice{border-color:#76cfd6!important;background:rgba(5,51,80,.72)!important;color:#fff!important}.bmedia-choice.is-selected{border-color:#fff!important;background:#fff!important;color:#073756!important}.bmedia-nacl-note{color:#fff!important}.bmedia-toggle strong{color:#fff!important}.bmedia-toggle strong b{color:#8de4df!important}'+
      '.ctmotion-media-stage{position:relative;display:block;min-height:820px}.ctmotion-media-stage.is-choosing{min-height:875px}'+
      '.ctmotion-toolbar{position:absolute;right:2px;top:0;z-index:6;display:flex;align-items:center;gap:11px}.ctmotion-toolbar .bmedia-preset,.ctmotion-toolbar .bmedia-clear{height:28px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#9be7e9!important}.ctmotion-toolbar .bmedia-preset{font-size:8px!important;text-decoration:underline;text-underline-offset:3px}.ctmotion-toolbar .bmedia-clear{width:auto!important;font-size:18px!important}'+
      '.ctmotion-reference{position:absolute;left:0;right:0;top:0;display:block;width:100%;height:820px;margin:0;overflow:visible}'+
      '.ctmotion-assembly{position:relative;width:min(310px,100%);aspect-ratio:190/492;margin:0 auto}'+
      '.ctmotion-arrow,.ctmotion-body,.ctmotion-piece,.ctmotion-time-control{position:absolute;display:block;padding:0;border:0;background:transparent;box-sizing:border-box}.ctmotion-arrow{left:27.4%;top:0;width:44.7%;height:17.3%;object-fit:fill;pointer-events:none}.ctmotion-body{left:0;top:42.48%;z-index:2;width:100%;height:57.32%;object-fit:fill;pointer-events:none}'+
      '.ctmotion-piece{z-index:1;cursor:pointer;filter:none}.ctmotion-piece img,.ctmotion-time-control img{display:block;width:100%;height:100%;object-fit:fill;pointer-events:none}.ctmotion-piece-left{left:0;top:15.85%;width:39.47%;height:31.50%}.ctmotion-piece-nacl{left:35.79%;top:14.23%;width:28.42%;height:32.52%}.ctmotion-piece-right{left:60.53%;top:15.85%;width:39.47%;height:31.50%}'+
      '.ctmotion-piece-value{position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);display:grid;place-items:center;color:#07345c;font:900 22px/1 "Space Grotesk",system-ui;text-align:center;text-shadow:0 1px rgba(255,255,255,.35);pointer-events:none}.ctmotion-piece-value small{display:block;margin-top:7px;color:#07345c;font:900 11px/1 "Space Grotesk",system-ui;white-space:nowrap}.ctmotion-piece-nacl .ctmotion-piece-value{font-size:19px;top:48%}'+
      '.ctmotion-piece-ok{position:absolute;right:4px;top:3px;display:grid;place-items:center;width:29px;height:29px;border-radius:50%;background:#20b86a;color:#fff;font:900 16px/1 system-ui;box-shadow:0 2px 7px rgba(0,0,0,.28);pointer-events:none}.ctmotion-piece.is-active,.ctmotion-piece:hover,.ctmotion-piece:focus-visible{outline:0;filter:drop-shadow(0 0 12px #ffd000);transform:scale(1.035)}'+
      '.ctmotion-time-control{left:25.79%;top:64.63%;z-index:4;width:48.42%;height:9.76%;cursor:pointer}.ctmotion-time-control span{position:absolute;inset:0;display:grid;place-items:center;color:#07345c;font:900 34px/1 "Space Grotesk",system-ui;letter-spacing:-.04em;pointer-events:none}.ctmotion-time-control:hover,.ctmotion-time-control:focus-visible{outline:0;filter:drop-shadow(0 0 9px #fff)}'+
      '.ctmotion-quickbar{position:absolute;left:50%;bottom:0;transform:translateX(-50%);display:grid;grid-template-columns:23px repeat(2,42px) 8px repeat(2,46px) 38px;align-items:center;gap:5px;width:max-content;height:42px;padding:0;border:0;box-sizing:border-box}'+
      '.ctmotion-quickbar>b{color:#8de4e6;font-size:19px;text-align:center}.ctmotion-quickbar>i{width:8px;height:1px;background:#73cdd2}'+
      '.ctmotion-quickbar .bmedia-choice{width:38px!important;height:38px!important;padding:0!important;border-radius:50%!important;border:1px solid #70cbd2!important;background:#0a456e!important;color:#fff!important;font-size:8.5px!important}.ctmotion-quickbar .bmedia-choice.is-selected{background:#fff!important;color:#073756!important;border-color:#fff!important}.ctmotion-quickbar .bmedia-remove,.ctmotion-quickbar .bmedia-confirm{width:38px;height:38px;border-radius:50%;font:900 18px/1 system-ui;cursor:pointer}.ctmotion-quickbar .bmedia-remove{border:1px solid #e89191;background:transparent;color:#ffb2b2}.ctmotion-quickbar .bmedia-confirm{border:0;background:#1b9b60;color:#fff}'+
      '.bnm-section{border:0!important;border-top:1px solid rgba(126,216,222,.40)!important;border-radius:0!important;background:transparent!important;padding-top:7px!important}'+
      '.bhist{border:0!important;border-top:1px solid rgba(126,216,222,.28)!important;border-radius:0!important;background:rgba(2,19,39,.34)!important;box-shadow:none!important}'+
      /* Final anti-card pass: flat surfaces, no ornamental glass or nested windows. */+
      '#bolus-sheet{background:#07345c!important;box-shadow:none!important}#bolus-title-bar{background:#082d50!important;box-shadow:none!important}'+
      '.bdevice-console .bscreen{border:0!important;background:transparent!important;box-shadow:none!important;color:#fff!important}.bdevice-console .bring-time,.bdevice-console .bring-secs,.bdevice-console .bring-label{color:#fff!important}.bbar{background:#16496d!important;box-shadow:none!important}'+
      '.bwd-arr,.bwc,.bwblank,.bwcits,.bnm-now,.bnm-savepick,.brc[data-room="philips"] .bwd-arr,.brc[data-room="philips"] .bwc,.brc[data-room="philips"] .bwblank,.brc[data-room="philips"] .bwcits,.brc[data-room="philips"] .bnm-now,.brc[data-room="philips"] .bnm-savepick{background:#0a456e!important;box-shadow:none!important;border-color:#66cbd2!important}'+
      '.bnm-native-field input,.brc[data-room="philips"] .bnm-native-field input{background:#092f54!important;box-shadow:none!important}.bnm-now,.bnm-savepick{border-radius:4px!important}.bnm-native-field input{border-radius:4px!important}'+
      '.bmedia-bottle{box-shadow:none!important}'+
      '#bolus-guide{background:#07345c!important}.bolus-guide-step{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important}.bolus-guide-photo{height:205px!important;border:1px solid #78d8dd!important;border-radius:2px!important;background:#082d50!important}.bolus-guide-copy{padding:9px 0 4px!important}.bolus-guide-copy h3{color:#8ce4e6!important}.bolus-guide-copy p{color:#fff!important}.bolus-guide-safety{border:0!important;border-top:1px solid #78d8dd!important;border-bottom:1px solid #78d8dd!important;border-radius:0!important;background:transparent!important}.bolus-guide-done{border-radius:3px!important;background:#fff!important;color:#07345c!important}'+
      /* Ulrich CT motion design system: dark blue, ocean blue, sky blue, sunshine, white. */+
      '#bolus-overlay{padding-top:0!important}#bolus-sheet{width:100vw!important;max-width:none!important;background:#00325c!important;border-left:0!important;border-right:0!important;border-color:#00a9db!important;border-radius:0!important;font-family:Arial,system-ui,sans-serif!important}#bolus-title-bar{background:#002544!important;border-bottom-color:#00a9db!important}#bolus-title{font-size:19px!important;letter-spacing:.15em!important}'+
      '#bolus-guide-btn,#bolus-tops-btn,#bolus-close-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:40px!important;border:0!important;border-radius:3px!important;background:#00a3a5!important;color:#fff!important;box-shadow:none!important;font:700 11px/1 Arial,system-ui,sans-serif!important}#bolus-guide-btn{padding:0 13px!important}#bolus-guide-btn b{display:grid;place-items:center;width:20px;height:20px;border:1.5px solid #fff;border-radius:50%;font-size:12px}#bolus-tops-btn{padding:0 13px!important}#bolus-tops-btn .bulrich-icon{width:18px;height:18px}#bolus-close-btn{width:40px!important;font-size:21px!important}#bolus-guide-btn:hover,#bolus-tops-btn:hover,#bolus-close-btn:hover{background:#006d8a!important}'+
      '#bolus-rooms{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0!important;padding:10px 12px 14px!important;background:#00325c!important;overflow-x:hidden!important;overflow-y:auto!important;align-items:start!important}'+
      '.brc[data-room="ge"],.brc[data-room="philips"]{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:auto auto auto auto auto minmax(150px,1fr)!important;grid-template-areas:"name name" "device device" "operator operator" "input input" "histhead histhead" "history history"!important;column-gap:16px!important;row-gap:8px!important;align-items:start!important;min-height:0!important;padding:8px 14px!important;overflow:hidden!important}'+
      '.brc[data-room="philips"]{border-left:1px solid #00a9db!important}.brn{grid-area:name!important;align-self:center!important;font:700 20px/1.15 Arial,system-ui,sans-serif!important;letter-spacing:.16em!important;color:#fff!important}.bdevice-console{grid-area:device!important;width:100%!important;align-self:start!important}.boperator{grid-area:operator!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:7px!important;width:100%!important;min-width:0!important}.bnm-section{grid-area:input!important}.bhist-hdr{grid-area:histhead!important}.bhist{grid-area:history!important;min-height:150px!important;max-height:none!important;overflow-y:auto!important;background:#002544!important;border-top:2px solid #00a3a5!important;padding:7px 8px 16px!important}'+
      '.ctmotion-media-stage{min-height:445px!important}.ctmotion-media-stage.is-choosing{min-height:500px!important}.ctmotion-reference{height:445px!important}.ctmotion-assembly{width:min(165px,100%)!important}.ctmotion-piece-nacl img{clip-path:inset(6% 0 0 0)!important}.ctmotion-piece-value{font-size:15px!important}.ctmotion-piece-value small{font-size:9px!important;margin-top:3px!important}.ctmotion-piece-nacl .ctmotion-piece-value{font-size:13px!important}.ctmotion-piece-ok{width:22px!important;height:22px!important;font-size:12px!important}.ctmotion-time-control{left:12%!important;top:63.5%!important;width:76%!important;height:12%!important}.ctmotion-time-control span{font-size:20px!important;letter-spacing:-.06em!important}'+
      '.ctmotion-quickbar{bottom:2px!important;grid-template-columns:23px repeat(2,42px) 8px repeat(2,46px) 38px!important;grid-template-rows:42px!important;gap:5px!important;width:max-content!important;height:42px!important}.ctmotion-quickbar>b{grid-column:auto!important;font-size:19px!important}.ctmotion-quickbar>i{display:block!important}.ctmotion-quickbar .bmedia-choice{width:38px!important;height:38px!important}.ctmotion-quickbar .bmedia-remove,.ctmotion-quickbar .bmedia-confirm{grid-column:auto!important;width:38px!important;height:38px!important}'+
      '.ctmotion-toolbar .bmedia-preset,.ctmotion-toolbar .bmedia-clear{color:#00a9db!important}.ctmotion-quickbar .bmedia-choice{background:#00519e!important;border-color:#00a9db!important}.ctmotion-quickbar .bmedia-choice.is-selected{background:#fbba00!important;border-color:#fbba00!important;color:#00325c!important}.ctmotion-quickbar .bmedia-confirm{background:#00a3a5!important}.ctmotion-quickbar>b{color:#00a9db!important}'+
      '.bwd-nav{margin:0!important}.bwd-lbl,.bnm-label,.bhist-lbl,.bnm-native-field>span{color:#00a9db!important}.bwrap{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;width:100%!important}.bwc,.bwcits,.bwblank{width:100%!important;min-width:0!important;min-height:32px!important;padding:5px 6px!important;overflow:hidden!important;text-overflow:ellipsis!important;border:1px solid #00a9db!important;border-radius:3px!important;background:#00519e!important;color:#fff!important;font:700 11px/1 Arial,system-ui,sans-serif!important}.bwsel{background:#00a3a5!important;border-color:#00a3a5!important;color:#fff!important;box-shadow:none!important}'+
      '.bnm-section{border-top:1px solid #00a9db!important;padding:7px 0 0!important}.bnm-native-field input,.brc[data-room="philips"] .bnm-native-field input{height:44px!important;background:#fff!important;border:1px solid #00a9db!important;color:#00325c!important;font:700 18px/1 Arial,system-ui,sans-serif!important}.bnm-now,.bnm-savepick,.brc[data-room="philips"] .bnm-now,.brc[data-room="philips"] .bnm-savepick{height:40px!important;border:0!important;border-radius:3px!important;color:#fff!important;font:700 11px/1 Arial,system-ui,sans-serif!important}.bnm-now{background:#00519e!important}.bnm-savepick{background:#00a3a5!important}.bnm-last{color:#fff!important;opacity:1!important}'+
      '.bhist-row{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;grid-template-rows:auto auto auto!important;align-items:center!important;column-gap:8px!important;font-size:13px!important;line-height:1.25!important;padding:7px 2px!important;border-bottom-color:rgba(0,169,219,.32)!important}.bhist-num{grid-column:1!important;grid-row:1!important;color:#00a9db!important}.bhist-time{grid-column:2!important;grid-row:1!important;min-width:0!important;color:#fff!important;white-space:nowrap!important}.bhist-who{grid-column:2!important;grid-row:2!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;word-break:normal!important;font-size:12px!important;background:transparent!important;border:0!important;color:#fff!important;padding:0!important}.bh-actions{grid-column:3!important;grid-row:1/3!important;display:flex!important;gap:6px!important}.bhist-media{grid-column:2/4!important;grid-row:3!important;background:rgba(0,169,219,.14)!important;color:#fff!important}.bhist-latest,.bhist-latest .bhist-who{color:#fff!important;background:transparent!important}.bhist-cnt{background:#00a3a5!important;color:#fff!important}'+
      '.bh-actions{gap:7px!important}.bh-edit,.bh-del{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#00a3a5!important;color:#fff!important}.bh-edit:hover,.bh-del:hover,.bh-edit:focus-visible,.bh-del:focus-visible{outline:3px solid rgba(0,169,219,.45)!important;background:#006d8a!important}.bulrich-icon{width:19px;height:19px;flex:0 0 auto}.bhe-head,.bhx-q{display:flex!important;align-items:center!important;gap:7px!important;color:#fff!important}.bhe-head .bulrich-icon,.bhx-q .bulrich-icon{width:24px;height:24px;padding:6px;border-radius:50%;background:#00a3a5;color:#fff}.bhe-save,.bhx-yes,.bhe-cancel,.bhx-no{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important}.bhe-save .bulrich-icon,.bhe-cancel .bulrich-icon{width:15px;height:15px}'+
      '#bolus-guide{background:#00325c!important}.bolus-guide-box{background:#00325c!important}.bolus-guide-head{background:#002544!important;border-bottom-color:#00a9db!important}.bolus-guide-head small,.bolus-guide-copy h3{color:#00a9db!important}.bolus-guide-intro,.bolus-guide-copy p,.bolus-guide-safety p{color:#fff!important}.bolus-guide-num,.bolus-guide-safety>strong{background:#00a3a5!important;color:#fff!important}.bolus-guide-photo{border-color:#00a9db!important}.bolus-guide-done{background:#00a3a5!important;color:#fff!important}'+
      '@media(max-width:1100px){#bolus-rooms{display:block!important;overflow-y:auto!important}.brc[data-room="ge"],.brc[data-room="philips"]{min-height:700px!important;margin:0!important}.brc[data-room="philips"]{border-left:0!important;border-top:1px solid #00a9db!important}}'+
      '@media(max-width:560px){.brc[data-room="ge"],.brc[data-room="philips"]{display:flex!important;min-height:0!important;overflow:visible!important}.ctmotion-media-stage{min-height:575px!important}.ctmotion-media-stage.is-choosing{min-height:630px!important}.bhist{min-height:180px!important}.bnm-prow{grid-template-columns:1fr 1fr!important}.bnm-prow .bnm-now,.bnm-prow .bnm-savepick{min-width:0!important}}'+
      '@media(max-width:700px){.bolus-guide-steps{grid-template-columns:1fr}.bolus-guide-photo{height:220px}.bolus-guide-safety{grid-template-columns:auto 1fr}.bolus-guide-source{grid-column:2}.bolus-guide-head h2{font-size:24px}}'+
      '#bolusDocBtn .bolus-crown{display:inline-flex;align-items:center;justify-content:center;gap:4px;margin-top:2px;color:#ffd77a;font:700 8.5px/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;}'+
      '#bolusDocBtn .bolus-crown:empty{display:none;}'+
      '#bolusDocBtn .bolus-crown-px{display:block;flex:0 0 12px;width:12px;height:9px;image-rendering:pixelated;}';
    document.head.appendChild(s);
  }
  // force: true/false opens/closes; nothing toggles (the phone's back and
  // drag-to-close call toggleBolus(false)).
  window.toggleBolus = function(force) {
    var ov = document.getElementById('bolus-overlay');
    if (!ov) return;
    var next = typeof force === 'boolean' ? force : !_open;
    if (next === _open) return;
    _open = next;
    // Phone shell: one history entry while open, so its back closes it.
    if (_open) { if (window.__mkSheetOpened) window.__mkSheetOpened('bolus'); }
    else if (window.__mkSheetClosed) window.__mkSheetClosed('bolus');
    document.body.classList.toggle('bolus-work-open', _open);
    if (_open) {
      // Bolus is a focused work surface; the app dock is hidden while open.
      ov.style.paddingBottom = '10px';
    }
    ov.style.display = _open ? 'flex' : 'none';
    var btn = document.getElementById('bolusDocBtn');
    if (btn) { btn.classList.toggle('bolus-open', _open); btn.classList.toggle('is-active', _open); }
    if (window.updateBuddyUiSuppression) window.updateBuddyUiSuppression();
    if (_open) { _render(); _startTick(); _refreshSync(true); }
    else { _stopTick(); _scheduleSync(); }
  };
  function _startTick() {
    _stopTick();
    _tick = setInterval(function(){ if(_open) _updateRings(); _updateLed(); }, 1000);
  }
  function _stopTick() { if(_tick){clearInterval(_tick);_tick=null;} }
  function _initBc() {
    if (!_bc) return;
    _bc.onmessage = function(evt) {
      try {
        var d = evt.data;
        if (!d || d.type !== 'bolus' || !d.state) return;
        var ch = false;
        ROOMS.forEach(function(r){
          var rem=d.state[r.id],loc=_state[r.id];
          if(!rem||!_remoteOverwriteAllowed(r.id)) return;
          var remHist = d.history && d.history[r.id];
          if (remHist) {
            // Same rule as _kvPull: history is the source of truth, and after
            // a delete in another tab the correct changedAt moves BACKWARD.
            _history[r.id] = remHist;
            var top = remHist[0];
            var topTs = top ? (top.ts || top) : null;
            if (topTs !== loc.changedAt) _state[r.id] = { changedAt: topTs };
            ch = true;
          } else if (rem.changedAt && (!loc.changedAt || rem.changedAt > loc.changedAt)) {
            _state[r.id] = { changedAt: rem.changedAt }; ch = true;
          }
        });
        ROOMS.forEach(function(r) { if (_syncMediaFromHistory(r.id)) ch = true; });
        if(ch){_save();_saveHistory();if(_open)_render();_updateLed();}
      } catch(e) {}
    };
  }
  function init() {
    _load(); _injectCss();
    var ov = document.createElement('div');
    ov.id = 'bolus-overlay';
    ov.innerHTML =
      '<div id="bolus-sheet" onclick="event.stopPropagation()">'+
        '<div id="bolus-title-bar">'+
          '<span id="bolus-title"><span class="bolus-head-icon" aria-hidden="true">'+(window.__mkDockIcon?window.__mkDockIcon('bolusDocBtn'):'')+'</span><span class="bolus-main-title">Bolusa maiņa</span></span>'+
          '<span style="display:flex;gap:8px;align-items:center;">'+
            '<button id="bolus-guide-btn" type="button" title="Atvērt pudeles pieslēgšanas pamācību"><b>?</b><span>Pamācība</span></button>'+
            '<button id="bolus-tops-btn" type="button" title="Mēneša čaklākie">'+_bolusIcon('trophy')+'<span>Tops</span></button>'+
            '<button id="bolus-close-btn" onclick="toggleBolus()">✕</button>'+
          '</span>'+
        '</div>'+
        '<div id="bolus-tops" style="display:none"></div>'+
        '<div id="bolus-rooms"></div>'+
        '<div id="bolus-guide" aria-hidden="true">'+
          '<div class="bolus-guide-box" role="dialog" aria-modal="true" aria-labelledby="bolus-guide-heading">'+
            '<div class="bolus-guide-head"><h2 id="bolus-guide-heading">Ievieto savienotāju taisni membrānas centrā</h2><button class="bolus-guide-close" type="button" aria-label="Aizvērt pamācību">×</button></div>'+
            '<p class="bolus-guide-intro">Turi taisni. Mērķē centrā. Tad spied.</p>'+
            '<div class="bolus-guide-compare">'+
              '<section class="bolus-guide-case is-wrong">'+
                '<div class="bolus-guide-visual bolus-guide-photo bolus-guide-target-photo"><img src="assets/bolus-guide-target-square.jpg?v=20260824" alt="Kvadrāts norāda nepareizu dūriena vietu blakus membrānas centram"><strong class="bolus-guide-badge">1 ✕ GARĀM</strong></div>'+
                '<div class="bolus-guide-result"><b>NĒ</b><span>Nav trāpīts <strong>centrā.</strong></span></div>'+
              '</section>'+
              '<section class="bolus-guide-case is-wrong">'+
                '<div class="bolus-guide-visual bolus-guide-photo bolus-guide-angle-photo"><img src="assets/bolus-guide-wrong-angle.jpg?v=20260824" alt="Savienotājs ievietots šķībi, nevis taisni membrānas centrā"><strong class="bolus-guide-badge">2 ✕ ŠĶĪBI</strong></div>'+
                '<div class="bolus-guide-result"><b>NĒ</b><span>Savienotājs ir <strong>šķībs.</strong></span></div>'+
              '</section>'+
              '<section class="bolus-guide-case is-wrong">'+
                '<div class="bolus-guide-visual bolus-guide-photo bolus-guide-leak-photo"><img src="assets/bolus-guide-wrong-leak.jpg?v=20260824" alt="Gar šķībi ievietotu savienotāju iztecējusi kontrastviela"><strong class="bolus-guide-badge">3 ✕ TEK</strong></div>'+
                '<div class="bolus-guide-result"><b>NĒ</b><span>Gar savienojumu tek <strong>kontrastviela.</strong></span></div>'+
              '</section>'+
              '<section class="bolus-guide-case is-wrong">'+
                '<div class="bolus-guide-visual bolus-guide-photo bolus-guide-microgap-photo"><img src="assets/bolus-guide-microgap-leak.jpg?v=20260824" alt="Tuvplānā redzama mikrosprauga gar šķībi ievadīta spika ārpusi"><strong class="bolus-guide-badge">4 ✕ MIKROSPRAUGA</strong></div>'+
                '<div class="bolus-guide-result"><b>NĒ</b><span>Šķībi ievadīts spiks atstāj <strong>mikrospraugu.</strong> Pa to kontrastviela tek gar spika ārpusi.</span></div>'+
              '</section>'+
              '<section class="bolus-guide-case is-right">'+
                '<div class="bolus-guide-visual bolus-guide-photo bolus-guide-center-photo"><img src="assets/bolus-guide-target-center.jpg?v=20260824" alt="Kvadrāts norāda pareizo mērķi membrānas centrā"><strong class="bolus-guide-badge">5 ✓ CENTRĀ</strong></div>'+
                '<div class="bolus-guide-result"><b>JĀ</b><span>Trāpi <strong>centrā.</strong></span></div>'+
              '</section>'+
              '<section class="bolus-guide-case is-right">'+
                '<div class="bolus-guide-visual bolus-guide-photo bolus-guide-straight-photo"><img src="assets/bolus-guide-straight-center.jpg?v=20260824" alt="Savienotājs iet taisni pa centra līniju membrānas centrā"><span class="bolus-guide-photo-angle">90°</span><strong class="bolus-guide-badge">6 ✓ TAISNI</strong></div>'+
                '<div class="bolus-guide-result"><b>JĀ</b><span>Ievieto <strong>taisni.</strong></span></div>'+
              '</section>'+
            '</div>'+
            '<div class="bolus-guide-stop"><b>Ja savienotājs ievietots šķībi vai tek šķidrums, STOP.</b><span> Nesāc darbu. Ievieto no jauna taisni centrā.</span></div>'+
            '<button class="bolus-guide-done" type="button">Aizvērt</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    ov.addEventListener('click', function(e){ if(e.target===ov) toggleBolus(); });
    document.body.appendChild(ov);
    var guide = document.getElementById('bolus-guide');
    var guideBtn = document.getElementById('bolus-guide-btn');
    function setGuide(opening) {
      if (!guide) return;
      guide.classList.toggle('open', !!opening);
      guide.setAttribute('aria-hidden', opening ? 'false' : 'true');
      if (guideBtn) guideBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) {
        try { localStorage.setItem('minkaBolusGuideSeenV1', '1'); } catch(e) {}
        if (guideBtn) guideBtn.classList.remove('is-new');
      }
    }
    try { if (guideBtn && localStorage.getItem('minkaBolusGuideSeenV1') !== '1') guideBtn.classList.add('is-new'); } catch(e) {}
    if (guideBtn) guideBtn.addEventListener('click', function(e) { e.stopPropagation(); setGuide(true); });
    if (guide) {
      guide.querySelectorAll('.bolus-guide-close,.bolus-guide-done').forEach(function(btn) {
        btn.addEventListener('click', function(e) { e.stopPropagation(); setGuide(false); });
      });
      guide.addEventListener('click', function(e) { if (e.target === guide) setGuide(false); });
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && guide && guide.classList.contains('open')) { e.stopPropagation(); setGuide(false); }
    });
    var topsBtn = document.getElementById('bolus-tops-btn');
    if (topsBtn) topsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var p = document.getElementById('bolus-tops');
      if (!p) return;
      var opening = p.style.display === 'none';
      if (opening) _renderTops();
      p.style.display = opening ? 'block' : 'none';
      topsBtn.classList.toggle('on', opening);
    });
    // Edit modal
    var em = document.createElement('div');
    em.id = 'bolus-edit-modal';
    em.innerHTML =
      '<div id="bolus-edit-box">'+
        '<div id="bolus-edit-title">Labot laiku</div>'+
        '<input type="text" id="bolus-edit-inp" inputmode="numeric" maxlength="16" placeholder="DD.MM.GGGG HH:MM">'+
        '<div style="display:flex;gap:10px;margin-top:4px;">'+
          '<button id="bolus-edit-cancel">Atcelt</button>'+
          '<button id="bolus-edit-save">Saglabāt</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(em);
    _initBc();
    _updateLed();
    // Request workers index from calendar iframe (handles race condition on cached pages)
    function _requestWorkers() {
      var calendarFrame = document.getElementById('calIframe');
      if (calendarFrame && calendarFrame.contentWindow) {
        try { calendarFrame.contentWindow.postMessage({ type: 'mk_request_workers_index' }, window.location.origin); } catch(e) {}
      }
    }
    setTimeout(_requestWorkers, 800);
    setTimeout(_requestWorkers, 3000); // second attempt in case iframe still loading
    setTimeout(function(){ _refreshSync(true); }, 2000);
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
      } else {
        _refreshSync(Date.now() - _lastSyncAt >= 30000);
      }
    }, { passive: true });
    document.addEventListener('minka:auth-ok', function() { _refreshSync(true); });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,500);});
  else setTimeout(init, 500);
})();
