/* ================================================================
   MONTH CALENDAR — full-screen month grid with per-day rosters.
   Opened from the parent dock (postMessage 'mk_open_month_calendar').
   Self-contained: reads window.__grafiksStore / __grafiksStoreRad /
   __fatigue. Injects its own scoped styles.
   ================================================================ */
(function MinkaMonthCal(){
  'use strict';

  var MONTH_IDX = {
    'JANVĀRIS':0,'JANVARIS':0,'FEBRUĀRIS':1,'FEBRUARIS':1,'MARTS':2,'APRĪLIS':3,'APRILIS':3,
    'MAIJS':4,'JŪNIJS':5,'JUNIJS':5,'JŪLIJS':6,'JULIJS':6,'AUGUSTS':7,'SEPTEMBRIS':8,
    'OKTOBRIS':9,'NOVEMBRIS':10,'DECEMBRIS':11
  };
  var WEEK = ['P','O','T','C','Pk','S','Sv']; // Mon-first (Latvian)
  var _overlay = null, _curMonth = null, _fitRaf = 0;

  function rgStore(){ return window.__grafiksStore || {}; }
  function rdStore(){ return window.__grafiksStoreRad || {}; }

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function firstName(n){ return String(n || '').trim().split(/\s+/)[0] || ''; }

  function monthParts(name){
    var up = String(name || '').toUpperCase();
    var ym = up.match(/(20\d{2})/);
    var idx = null;
    for (var k in MONTH_IDX){ if (up.indexOf(k) >= 0){ idx = MONTH_IDX[k]; break; } }
    return { idx: idx, year: ym ? parseInt(ym[1], 10) : null };
  }
  function monthSortKey(name){ var p = monthParts(name); return (p.year || 0) * 12 + (p.idx == null ? 0 : p.idx); }

  function allMonths(){
    var set = {};
    Object.keys(rgStore()).forEach(function(m){ set[m] = 1; });
    Object.keys(rdStore()).forEach(function(m){ set[m] = 1; });
    return Object.keys(set).sort(function(a, b){ return monthSortKey(a) - monthSortKey(b); });
  }

  function hoursOf(w){
    var m = String((w && w.shift) || '').match(/(\d+(?:[.,]\d+)?)/);
    return m ? Math.round(parseFloat(m[1].replace(',', '.')) || 0) : 0;
  }
  function fatColor(name){
    try {
      if (window.__fatigue && window.__fatigue.calculateFatigue){
        var f = window.__fatigue.calculateFatigue(name);
        if (f && isFinite(f.score)){
          var s = f.score;
          return s > 70 ? '#ff453a' : s > 45 ? '#ff9f0a' : s > 20 ? '#ffd60a' : '#30d158';
        }
      }
    } catch(e){}
    return 'rgba(125,211,252,.35)';
  }
  function dayWorkers(month, dateStr, store){
    var arr = store[month] || [];
    for (var i = 0; i < arr.length; i++){ if (arr[i] && arr[i].date === dateStr) return arr[i].workers || []; }
    return [];
  }

  function injectStyles(){
    if (document.getElementById('mcal-style')) return;
    var s = document.createElement('style');
    s.id = 'mcal-style';
    s.textContent = [
      '#mcal-overlay{position:fixed;inset:0;z-index:240000;display:none;flex-direction:column;background:#060b13;color:#e6eef7;font-family:Inter,system-ui,sans-serif;}',
      '#mcal-overlay.is-open{display:flex;}',
      '.mcal-inner{display:flex;flex-direction:column;width:100%;height:100%;padding:14px 18px 16px;box-sizing:border-box;}',
      '.mcal-head{display:flex;align-items:center;gap:14px;margin-bottom:10px;flex:0 0 auto;}',
      '.mcal-title{font-weight:800;letter-spacing:.06em;font-size:17px;text-transform:uppercase;color:#7dd3fc;}',
      '.mcal-nav{display:flex;align-items:center;gap:6px;}',
      '.mcal-navbtn{cursor:pointer;width:30px;height:30px;border-radius:9px;border:1px solid rgba(125,211,252,.25);background:rgba(125,211,252,.07);color:#cfe6f7;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;}',
      '.mcal-navbtn:hover:not([disabled]){background:rgba(125,211,252,.16);}',
      '.mcal-navbtn[disabled]{opacity:.3;cursor:default;}',
      '.mcal-monthsel{height:30px;border-radius:9px;border:1px solid rgba(125,211,252,.25);background:#0d1322;color:#cfe6f7;font:800 11px Inter,system-ui,sans-serif;letter-spacing:.05em;padding:0 8px;}',
      '.mcal-close{margin-left:auto;cursor:pointer;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#cfe6f7;font-size:16px;}',
      '.mcal-close:hover{background:rgba(255,90,80,.18);border-color:rgba(255,90,80,.4);color:#fff;}',
      '.mcal-weekhead{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;flex:0 0 auto;}',
      '.mcal-weekhead>div{font:800 10px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:rgba(160,180,205,.6);text-align:center;}',
      '.mcal-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;gap:6px;flex:1 1 auto;min-height:0;}',
      '.mcal-cell{position:relative;border-radius:11px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.018);padding:5px 6px 4px;overflow:hidden;display:flex;flex-direction:column;min-height:0;}',
      '.mcal-cell.is-weekend{background:rgba(125,211,252,.045);}',
      '.mcal-cell.is-today{border-color:rgba(56,189,248,.6);box-shadow:inset 0 0 0 1px rgba(56,189,248,.3);}',
      '.mcal-blank{background:transparent;border:0;}',
      '.mcal-daynum{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 46px Inter,system-ui,sans-serif;color:rgba(207,230,247,.10);line-height:1;pointer-events:none;z-index:0;}',
      '.mcal-cell.is-today .mcal-daynum{color:rgba(56,189,248,.22);}',
      '.mcal-body{position:relative;z-index:1;flex:1 1 auto;min-height:0;overflow:hidden;font-size:11px;line-height:1.18;}',
      '.mcal-grp{margin-bottom:3px;}',
      '.mcal-grp-h{font-weight:800;font-size:.72em;letter-spacing:.06em;opacity:.55;margin-bottom:1px;white-space:nowrap;}',
      '.mcal-rg .mcal-grp-h{color:#1fe091;}',
      '.mcal-rd .mcal-grp-h{color:#3f9bff;}',
      '.mcal-w{display:flex;align-items:baseline;gap:4px;white-space:nowrap;}',
      '.mcal-dot{width:.5em;height:.5em;border-radius:50%;flex:0 0 auto;align-self:center;}',
      '.mcal-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.mcal-nf{font-weight:800;color:#eef4fb;}',
      '.mcal-ns{font-size:.82em;font-weight:600;color:rgba(190,205,225,.62);margin-left:3px;}',
      '.mcal-wh{margin-left:auto;color:rgba(160,180,205,.72);font-weight:700;padding-left:6px;flex:0 0 auto;}',
      '.mcal-off{opacity:.25;font-size:.9em;}',
      '.mcal-empty{margin:auto;opacity:.5;}'
    ].join('');
    document.head.appendChild(s);
  }

  function workerRows(list){
    return list.map(function(w){
      var h = hoursOf(w);
      var parts = String(w.name || '').trim().replace(/\s+/g, ' ').split(' ');
      var fn = parts.shift() || '';
      var sn = parts.join(' ');
      return '<div class="mcal-w"><span class="mcal-dot" style="background:' + fatColor(w.name) + '"></span>'
        + '<span class="mcal-name"><b class="mcal-nf">' + esc(fn) + '</b>' + (sn ? '<span class="mcal-ns">' + esc(sn) + '</span>' : '') + '</span>'
        + '<span class="mcal-wh">' + (h ? h + 'h' : '') + '</span></div>';
    }).join('');
  }

  function buildGrid(month){
    var p = monthParts(month);
    if (p.idx == null || !p.year) return '<div class="mcal-empty">Nav datu šim mēnesim.</div>';
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7; // Mon = 0
    var daysIn = new Date(p.year, p.idx + 1, 0).getDate();
    var today = String(window.__g_todayStr || window.__todayDateStr || '').trim();
    var cells = '';
    for (var b = 0; b < startW; b++) cells += '<div class="mcal-cell mcal-blank"></div>';
    for (var d = 1; d <= daysIn; d++){
      var dateStr = ('0' + d).slice(-2) + '.' + ('0' + (p.idx + 1)).slice(-2) + '.' + p.year;
      var rg = dayWorkers(month, dateStr, rgStore());
      var rd = dayWorkers(month, dateStr, rdStore());
      var wd = (startW + d - 1) % 7;
      var body = '';
      if (rg.length) body += '<div class="mcal-grp mcal-rg"><div class="mcal-grp-h">RADIOGRĀFERI</div>' + workerRows(rg) + '</div>';
      if (rd.length) body += '<div class="mcal-grp mcal-rd"><div class="mcal-grp-h">RADIOLOGI</div>' + workerRows(rd) + '</div>';
      if (!body) body = '<div class="mcal-off">—</div>';
      cells += '<div class="mcal-cell' + (wd >= 5 ? ' is-weekend' : '') + (dateStr === today ? ' is-today' : '') + '">'
        + '<div class="mcal-daynum">' + d + '</div><div class="mcal-body">' + body + '</div></div>';
    }
    return '<div class="mcal-weekhead">' + WEEK.map(function(w){ return '<div>' + w + '</div>'; }).join('') + '</div>'
      + '<div class="mcal-grid">' + cells + '</div>';
  }

  // No scrollbars: shrink each cell body's font so its content fits. One read
  // pass + one write pass (cheap on weak PCs), re-run on resize.
  function fitAll(){
    if (!_overlay) return;
    var bodies = [].slice.call(_overlay.querySelectorAll('.mcal-body'));
    bodies.forEach(function(b){ b.style.fontSize = ''; });
    var jobs = bodies.map(function(b){ return { b: b, sh: b.scrollHeight, ch: b.clientHeight }; });
    jobs.forEach(function(o){
      if (o.sh > o.ch + 1 && o.ch > 0){
        var base = parseFloat(getComputedStyle(o.b).fontSize) || 11;
        o.b.style.fontSize = Math.max(5, base * (o.ch / o.sh) * 0.94).toFixed(2) + 'px';
      }
    });
  }
  function scheduleFit(){ cancelAnimationFrame(_fitRaf); _fitRaf = requestAnimationFrame(function(){ requestAnimationFrame(fitAll); }); }

  function render(month){
    var months = allMonths();
    if (!months.length){ _overlay.querySelector('.mcal-inner').innerHTML = '<div class="mcal-empty">Nav grafika datu.</div>'; return; }
    if (months.indexOf(month) < 0) month = window.__activeMonth || months[months.length - 1];
    _curMonth = month;
    var idx = months.indexOf(month);
    var head = '<div class="mcal-head">'
      + '<div class="mcal-title">' + esc(month) + '</div>'
      + '<div class="mcal-nav">'
      + '<button class="mcal-navbtn" data-go="-1"' + (idx <= 0 ? ' disabled' : '') + '>‹</button>'
      + '<select class="mcal-monthsel">' + months.map(function(m){ return '<option' + (m === month ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select>'
      + '<button class="mcal-navbtn" data-go="1"' + (idx >= months.length - 1 ? ' disabled' : '') + '>›</button>'
      + '</div>'
      + '<button class="mcal-close" aria-label="Aizvērt">✕</button>'
      + '</div>';
    _overlay.querySelector('.mcal-inner').innerHTML = head + buildGrid(month);
    scheduleFit();
  }

  function ensureOverlay(){
    if (_overlay) return;
    injectStyles();
    _overlay = document.createElement('div');
    _overlay.id = 'mcal-overlay';
    _overlay.innerHTML = '<div class="mcal-inner"></div>';
    document.body.appendChild(_overlay);
    _overlay.addEventListener('click', function(e){
      var t = e.target;
      if (t.closest && t.closest('.mcal-close')){ close(); return; }
      var go = t.closest && t.closest('.mcal-navbtn');
      if (go && !go.disabled){
        var months = allMonths(), i = months.indexOf(_curMonth) + parseInt(go.getAttribute('data-go'), 10);
        if (i >= 0 && i < months.length) render(months[i]);
      }
    });
    _overlay.addEventListener('change', function(e){
      if (e.target && e.target.classList.contains('mcal-monthsel')) render(e.target.value);
    });
  }

  function notifyParent(isOpenNow){
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mk_monthcal_state', open: !!isOpenNow }, '*'); } catch(e){}
  }
  function open(month){
    ensureOverlay();
    _overlay.classList.add('is-open');
    render(month || window.__activeMonth || _curMonth);
    notifyParent(true);
  }
  function close(){ if (_overlay) _overlay.classList.remove('is-open'); notifyParent(false); }
  function isOpen(){ return !!(_overlay && _overlay.classList.contains('is-open')); }

  window.addEventListener('message', function(e){
    if (!e.data || e.data.type !== 'mk_open_month_calendar') return;
    if (isOpen()) close(); else open(e.data.month);
  });
  window.addEventListener('keydown', function(e){ if (e.key === 'Escape' && isOpen()) close(); });
  window.addEventListener('resize', function(){ if (isOpen()) scheduleFit(); });

  window.MinkaMonthCal = { open: open, close: close, isOpen: isOpen };
})();
