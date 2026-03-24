(function() {
  'use strict';

  var STORAGE_KEY = 'minka_radiologist_plan_v1';
  var META_KEY = 'minka_radiologist_plan_meta_v1';
  var GET_ACTION = 'rad_plan_get';
  var WRITE_ACTION = 'rad_plan_write';
  var currentLoadToken = 0;
  var modal = null;
  var textarea = null;
  var statusEl = null;
  var titleDateEl = null;
  var isSaving = false;
  var _pollTimer = null;
  var POLL_MS = 30000;

  function getActiveDate() {
    return String(window.__activeDateStr || '').trim();
  }

  function pad2(v) {
    return String(v).padStart(2, '0');
  }

  function parseDateStr(dateStr) {
    var p = String(dateStr || '').split('.');
    if (p.length !== 3) return null;
    var d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    return isNaN(d.getTime()) ? null : d;
  }

  function dateToStr(d) {
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function getShiftDateStr() {
    var now = new Date();
    var effective = new Date(now);
    if (effective.getHours() < 8) effective.setDate(effective.getDate() - 1);
    return dateToStr(effective);
  }

  function compareDateStr(a, b) {
    var da = parseDateStr(a);
    var db = parseDateStr(b);
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    return da.getTime() - db.getTime();
  }

  function formatDateLabel(dateStr) {
    if (!dateStr) return '--';
    var p = dateStr.split('.');
    if (p.length !== 3) return dateStr;
    var d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('lv-LV', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getGsUrl() {
    try {
      var qp = new URLSearchParams(window.location.search).get('radPlanUrl') || '';
      if (qp) return String(qp).trim();
    } catch (_e0) {}
    try {
      if (window.parent && window.parent.__minkaCloud) {
        if (window.parent.__minkaCloud.radPlanUrl) {
          return String(window.parent.__minkaCloud.radPlanUrl).trim();
        }
        if (window.parent.__minkaCloud.gsUrl) {
          return String(window.parent.__minkaCloud.gsUrl).trim();
        }
      }
    } catch (_e) {}
    try {
      var direct = String(localStorage.getItem('minka_rad_plan_gs_url') || '').trim();
      if (direct) return direct;
    } catch (_e2) {}
    try {
      return String(localStorage.getItem('minka_cloud_gs_url') || '').trim();
    } catch (_e3) {}
    return '';
  }

  function readLocalMap() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function saveLocalMap(map) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
    } catch (_e) {}
  }

  function readMeta() {
    try {
      var parsed = JSON.parse(localStorage.getItem(META_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function saveMeta(meta) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta || {}));
    } catch (_e) {}
  }

  function getLocalPlan(dateStr) {
    var map = readLocalMap();
    var entry = map[dateStr];
    if (entry && typeof entry === 'object') return String(entry.text || '');
    if (typeof entry === 'string') return entry;
    return '';
  }

  function setLocalPlan(dateStr, text) {
    var map = readLocalMap();
    map[dateStr] = {
      text: String(text || ''),
      savedAt: Date.now()
    };
    saveLocalMap(map);
  }

  function parseRemotePayload(payload, dateStr) {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (typeof payload.text === 'string') return payload.text;
    if (payload.data && typeof payload.data.text === 'string') return payload.data.text;
    if (payload[dateStr] && typeof payload[dateStr] === 'string') return payload[dateStr];
    if (payload[dateStr] && typeof payload[dateStr].text === 'string') return payload[dateStr].text;
    if (payload.item && typeof payload.item.text === 'string') return payload.item.text;
    return '';
  }

  async function fetchRemotePlan(dateStr) {
    var gsUrl = getGsUrl();
    if (!gsUrl || !dateStr) return null;
    try {
      var url = gsUrl + '?action=' + encodeURIComponent(GET_ACTION) + '&date=' + encodeURIComponent(dateStr) + '&_=' + Date.now();
      var res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      var payload = await res.json();
      return parseRemotePayload(payload, dateStr);
    } catch (_e) {
      return null;
    }
  }

  async function writeRemotePlan(dateStr, text, extra) {
    var gsUrl = getGsUrl();
    if (!gsUrl || !dateStr) return false;
    extra = extra || {};
    try {
      var url = gsUrl
        + '?action=' + encodeURIComponent(WRITE_ACTION)
        + '&date=' + encodeURIComponent(dateStr)
        + '&text=' + encodeURIComponent(text || '');
      if (extra.shiftDate) {
        url += '&shiftDate=' + encodeURIComponent(String(extra.shiftDate));
      }
      var res = await fetch(url, { cache: 'no-store' });
      return !!res.ok;
    } catch (_e) {
      return false;
    }
  }

  function queueRemoteClearDates(items) {
    if (!Array.isArray(items) || !items.length) return;
    var meta = readMeta();
    var queue = Array.isArray(meta.pendingRemoteClearDates) ? meta.pendingRemoteClearDates.slice() : [];
    items.forEach(function(item) {
      if (!item || !item.date) return;
      var exists = queue.some(function(queued) {
        return queued && queued.date === item.date;
      });
      if (!exists) queue.push({ date: item.date, shiftDate: item.shiftDate || '' });
    });
    meta.pendingRemoteClearDates = queue;
    saveMeta(meta);
  }

  async function flushRemoteClearQueue() {
    var gsUrl = getGsUrl();
    if (!gsUrl) return;
    var meta = readMeta();
    var queue = Array.isArray(meta.pendingRemoteClearDates) ? meta.pendingRemoteClearDates.slice() : [];
    if (!queue.length) return;

    var failed = [];
    for (var i = 0; i < queue.length; i++) {
      var item = queue[i] || {};
      var ok = await writeRemotePlan(item.date, '', { shiftDate: item.shiftDate || '' });
      if (!ok) failed.push(queue[i]);
    }
    meta.pendingRemoteClearDates = failed;
    saveMeta(meta);
  }

  async function pruneExpiredPlans() {
    var shiftDateStr = getShiftDateStr();
    var map = readLocalMap();
    var staleDates = Object.keys(map).filter(function(dateStr) {
      return compareDateStr(dateStr, shiftDateStr) < 0;
    });

    if (staleDates.length) {
      var clearItems = [];
      staleDates.forEach(function(dateStr) {
        delete map[dateStr];
        clearItems.push({ date: dateStr, shiftDate: shiftDateStr });
      });
      saveLocalMap(map);
      queueRemoteClearDates(clearItems);
    }

    var meta = readMeta();
    meta.lastShiftCleanupDate = shiftDateStr;
    saveMeta(meta);

    await flushRemoteClearQueue();
  }

  function renderPlan(dateStr, text, sourceLabel) {
    var content = document.getElementById('radiologists-plan-content');
    var dateNode = document.getElementById('radiologists-plan-date');
    if (!content || !dateNode) return;

    var trimmed = String(text || '').trim();
    dateNode.textContent = formatDateLabel(dateStr) + (sourceLabel ? ' • ' + sourceLabel : '');
    content.textContent = trimmed || 'Nav ievadīts.';
    content.classList.toggle('is-empty', !trimmed);
  }

  async function loadPlan(dateStr, opts) {
    opts = opts || {};
    var token = ++currentLoadToken;
    var localText = getLocalPlan(dateStr);
    renderPlan(dateStr, localText, localText ? 'lokāli' : '');

    if (opts.localOnly) return;

    var remoteText = await fetchRemotePlan(dateStr);
    if (token !== currentLoadToken) return;
    if (remoteText !== null) {
      setLocalPlan(dateStr, remoteText);
      renderPlan(dateStr, remoteText, '');
    }
  }

  function ensureModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'radiologists-plan-modal';
    modal.innerHTML =
      '<div class="radiologists-plan-sheet" role="dialog" aria-modal="true">'
      + '<div class="radiologists-plan-modal-head">'
      +   '<div>'
      +     '<div class="radiologists-plan-modal-title">Radiologu sadalījums</div>'
      +     '<div class="radiologists-plan-modal-date" id="radiologists-plan-modal-date">--</div>'
      +   '</div>'
      +   '<button type="button" class="radiologists-plan-btn secondary" id="radiologists-plan-close">Aizvērt</button>'
      + '</div>'
      + '<textarea id="radiologists-plan-textarea" class="radiologists-plan-textarea" placeholder="Piemērs:\n08:00–11:00  CT - Līcis\n08:00–11:00  RTG - Safronova"></textarea>'
      + '<div class="radiologists-plan-help">Raksti brīvi, tāpat kā uz lapiņas. Katrs datums glabājas atsevišķi.</div>'
      + '<div class="radiologists-plan-actions">'
      +   '<div id="radiologists-plan-status" class="radiologists-plan-status"> </div>'
      +   '<div class="radiologists-plan-btns">'
      +     '<button type="button" class="radiologists-plan-btn secondary" id="radiologists-plan-clear">Notīrīt</button>'
      +     '<button type="button" class="radiologists-plan-btn primary" id="radiologists-plan-save">Saglabāt</button>'
      +   '</div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(modal);

    textarea = modal.querySelector('#radiologists-plan-textarea');
    statusEl = modal.querySelector('#radiologists-plan-status');
    titleDateEl = modal.querySelector('#radiologists-plan-modal-date');

    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeEditor();
    });
    modal.querySelector('#radiologists-plan-close').addEventListener('click', closeEditor);
    modal.querySelector('#radiologists-plan-clear').addEventListener('click', function() {
      if (textarea) textarea.value = '';
    });
    modal.querySelector('#radiologists-plan-save').addEventListener('click', saveCurrentEditor);
  }

  function openEditor() {
    ensureModal();
    var dateStr = getActiveDate();
    modal.classList.add('is-open');
    modal.dataset.date = dateStr;
    titleDateEl.textContent = formatDateLabel(dateStr);
    textarea.value = getLocalPlan(dateStr);
    statusEl.textContent = getGsUrl() ? 'Saglabās lokāli + Google' : 'Saglabās lokāli. Google URL nav pieejams.';
    setTimeout(function() {
      textarea && textarea.focus();
      textarea && textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, 30);
  }

  function closeEditor() {
    if (!modal) return;
    modal.classList.remove('is-open');
  }

  async function saveCurrentEditor() {
    if (!modal || isSaving) return;
    isSaving = true;
    var dateStr = modal.dataset.date || getActiveDate();
    var text = String((textarea && textarea.value) || '').replace(/\r\n/g, '\n');
    setLocalPlan(dateStr, text);
    renderPlan(dateStr, text, 'lokāli');
    statusEl.textContent = 'Saglabā...';

    var remoteOk = await writeRemotePlan(dateStr, text, { shiftDate: getShiftDateStr() });
    statusEl.textContent = remoteOk
      ? 'Saglabāts Google'
      : (getGsUrl() ? 'Saglabāts lokāli. Nav sinhronizēts.' : 'Saglabāts lokāli.');
    isSaving = false;
    closeEditor();
    loadPlan(dateStr);
  }

  function bindUi() {
    var btn = document.getElementById('radiologists-plan-edit');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', openEditor);
    }
  }

  function refresh() {
    bindUi();
    var dateStr = getActiveDate();
    if (!dateStr) return;
    loadPlan(dateStr);
  }

  async function handleShiftCleanupAndRefresh() {
    await pruneExpiredPlans();
    refresh();
  }

  function scheduleNextShiftCleanup() {
    function msUntilNextShift() {
      var now = new Date();
      var next = new Date(now);
      next.setHours(8, 0, 5, 0);
      if (now.getHours() >= 8) next.setDate(next.getDate() + 1);
      return Math.max(1000, next.getTime() - now.getTime());
    }

    setTimeout(function run() {
      handleShiftCleanupAndRefresh();
      setTimeout(run, msUntilNextShift());
    }, msUntilNextShift());
  }

  function startPolling() {
    if (_pollTimer) return;
    if (!getGsUrl()) return;
    _pollTimer = setInterval(function() {
      if (isSaving) return;
      if (modal && modal.classList.contains('is-open')) return;
      var dateStr = getActiveDate();
      if (!dateStr) return;
      fetchRemotePlan(dateStr).then(function(remoteText) {
        if (remoteText === null) return;
        var localText = getLocalPlan(dateStr);
        if (remoteText !== localText) {
          setLocalPlan(dateStr, remoteText);
          renderPlan(dateStr, remoteText, '');
        }
      });
    }, POLL_MS);
  }

  function init() {
    bindUi();
    handleShiftCleanupAndRefresh();
    scheduleNextShiftCleanup();
    startPolling();
    window.addEventListener('daySelected', function(e) {
      var dateStr = e && e.detail && e.detail.date ? String(e.detail.date).trim() : getActiveDate();
      if (!dateStr) return;
      pruneExpiredPlans().then(function() {
        loadPlan(dateStr);
      });
    });
    window.addEventListener('focus', handleShiftCleanupAndRefresh);
    window.__radiologistPlan = { refresh: refresh, openEditor: openEditor };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
