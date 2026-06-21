/* ================================================================
   MONTH CALENDAR — full-screen month grid with per-day rosters.
   Opened from the parent dock (postMessage 'mk_open_month_calendar').
   Self-contained: reads window.__grafiksStore / __grafiksStoreRad /
   __fatigue. Injects its own scoped styles.

   Layout: each day cell has a clear left date rail (no overlapping
   watermark). Header has a Mēnesis / Nedēļa view toggle and two
   action buttons (Dzimšanas dienas, Svētku dienas). Latvian holidays
   are listed in a panel and subtly marked on the grid.
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
  var _viewMode = 'month';   // 'month' | 'week'
  var _weekIdx = 0;          // which week row (0-based) in week view
  var _holiCache = {};

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

  // ---- Latvian holidays -------------------------------------------------
  // Svētku dienas (public holidays / non-working = free:true) + atzīmējamās
  // dienas (celebrated, free:false). Excludes atceres/piemiņas (memorial)
  // days per request. Movable days computed from Easter.
  function easterSunday(y){
    var a=y%19, b=Math.floor(y/100), c=y%100, d=Math.floor(b/4), e=b%4,
        f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3),
        h=(19*a+b-d-g+15)%30, i=Math.floor(c/4), k=c%4,
        l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451),
        mo=Math.floor((h+l-7*m+114)/31), da=((h+l-7*m+114)%31)+1;
    return new Date(y, mo-1, da);
  }
  function nthWeekday(y, monthIdx, weekday, n){ // weekday: 0=Sun
    var first = new Date(y, monthIdx, 1);
    var add = (weekday - first.getDay() + 7) % 7;
    return new Date(y, monthIdx, 1 + add + (n - 1) * 7);
  }
  function dstr(dt){ return ('0'+dt.getDate()).slice(-2)+'.'+('0'+(dt.getMonth()+1)).slice(-2)+'.'+dt.getFullYear(); }
  function addDays(dt, n){ var x = new Date(dt); x.setDate(x.getDate()+n); return x; }
  function holidaysForYear(y){
    var E = easterSunday(y);
    function on(mo, da){ return ('0'+da).slice(-2)+'.'+('0'+mo).slice(-2)+'.'+y; }
    return [
      { date: on(1,1),            name: 'Jaungada diena',                          free: true },
      { date: dstr(addDays(E,-2)),name: 'Lielā Piektdiena',                        free: true },
      { date: dstr(E),            name: 'Pirmās Lieldienas',                       free: true },
      { date: dstr(addDays(E,1)), name: 'Otrās Lieldienas',                        free: true },
      { date: on(5,1),            name: 'Darba svētki',                            free: true },
      { date: on(5,4),            name: 'Neatkarības atjaunošanas diena',          free: true },
      { date: dstr(nthWeekday(y,4,0,2)), name: 'Mātes diena',                      free: false },
      { date: dstr(addDays(E,49)),name: 'Vasarsvētki',                             free: false },
      { date: on(6,23),           name: 'Līgo diena',                              free: true },
      { date: on(6,24),           name: 'Jāņi (Vasaras saulgrieži)',              free: true },
      { date: on(11,18),          name: 'Latvijas Republikas proklamēšanas diena', free: true },
      { date: on(12,24),          name: 'Ziemassvētku vakars',                     free: true },
      { date: on(12,25),          name: 'Pirmie Ziemassvētki',                     free: true },
      { date: on(12,26),          name: 'Otrie Ziemassvētki',                      free: true },
      { date: on(12,31),          name: 'Vecgada diena',                           free: true },
      // Atzīmējamās / svinamās dienas (not days off)
      { date: on(3,8),            name: 'Starptautiskā sieviešu diena',            free: false },
      { date: on(5,12),           name: 'Mediķu diena (medmāsu diena)',            free: false },
      { date: on(5,15),           name: 'Starptautiskā ģimenes diena',             free: false },
      { date: on(6,1),            name: 'Bērnu aizsardzības diena',                free: false },
      { date: on(9,1),            name: 'Zinību diena',                            free: false },
      { date: dstr(nthWeekday(y,8,0,2)), name: 'Tēvu diena',                       free: false },
      { date: on(11,11),          name: 'Lāčplēša diena',                          free: false }
    ];
  }
  function holidayMap(year){
    if (_holiCache[year]) return _holiCache[year];
    var m = {};
    holidaysForYear(year).forEach(function(h){ m[h.date] = h; });
    return (_holiCache[year] = m);
  }
  function dkey(d){ var p = String(d).split('.'); return (+p[2]) * 10000 + (+p[1]) * 100 + (+p[0]); }

  function injectStyles(){
    if (document.getElementById('mcal-style')) return;
    var s = document.createElement('style');
    s.id = 'mcal-style';
    s.textContent = [
      '#mcal-overlay{position:fixed;inset:0;z-index:240000;display:none;flex-direction:column;background:#060b13;color:#e6eef7;font-family:Inter,system-ui,sans-serif;}',
      '#mcal-overlay.is-open{display:flex;}',
      '.mcal-inner{display:flex;flex-direction:column;width:100%;height:100%;padding:14px 18px 16px;box-sizing:border-box;}',
      '.mcal-head{display:flex;align-items:center;gap:12px;margin-bottom:10px;flex:0 0 auto;}',
      '.mcal-title{font-weight:800;letter-spacing:.06em;font-size:17px;text-transform:uppercase;color:#7dd3fc;white-space:nowrap;}',
      '.mcal-nav{display:flex;align-items:center;gap:6px;}',
      '.mcal-navbtn{cursor:pointer;width:30px;height:30px;border-radius:9px;border:1px solid rgba(125,211,252,.25);background:rgba(125,211,252,.07);color:#cfe6f7;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;}',
      '.mcal-navbtn:hover:not([disabled]){background:rgba(125,211,252,.16);}',
      '.mcal-navbtn[disabled]{opacity:.3;cursor:default;}',
      '.mcal-monthsel{height:30px;border-radius:9px;border:1px solid rgba(125,211,252,.25);background:#0d1322;color:#cfe6f7;font:800 11px Inter,system-ui,sans-serif;letter-spacing:.05em;padding:0 8px;accent-color:#38bdf8;outline:none;}',
      '.mcal-monthsel:focus,.mcal-monthsel:focus-visible,.mcal-monthsel:active{outline:none !important;border-color:#38bdf8 !important;box-shadow:0 0 0 2px rgba(56,189,248,.45),0 0 14px rgba(56,189,248,.25) !important;}',
      // segmented view toggle (Mēnesis / Nedēļa)
      '.mcal-seg{display:inline-flex;align-items:center;gap:3px;padding:3px;border-radius:11px;border:1px solid rgba(125,211,252,.22);background:rgba(125,211,252,.05);}',
      '.mcal-seg button{cursor:pointer;border:0;background:transparent;color:rgba(207,230,247,.7);font:800 11px Inter,system-ui,sans-serif;letter-spacing:.04em;padding:5px 12px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;}',
      '.mcal-seg button:hover{color:#e6eef7;}',
      '.mcal-seg button.is-on{background:rgba(56,189,248,.18);color:#7dd3fc;box-shadow:inset 0 0 0 1px rgba(56,189,248,.4);}',
      // right-side action buttons
      '.mcal-actions{margin-left:auto;display:flex;align-items:center;gap:8px;}',
      '.mcal-actbtn{cursor:pointer;display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 13px;border-radius:9px;border:1px solid rgba(125,211,252,.22);background:rgba(125,211,252,.06);color:#cfe6f7;font:800 11px Inter,system-ui,sans-serif;letter-spacing:.03em;}',
      '.mcal-actbtn:hover{background:rgba(125,211,252,.14);border-color:rgba(125,211,252,.38);}',
      '.mcal-close{cursor:pointer;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#cfe6f7;font-size:16px;}',
      '.mcal-close:hover{background:rgba(255,90,80,.18);border-color:rgba(255,90,80,.4);color:#fff;}',
      '.mcal-weekhead{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;flex:0 0 auto;}',
      '.mcal-weekhead>div{font:800 10px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:rgba(160,180,205,.6);padding-left:4px;}',
      '.mcal-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;gap:6px;flex:1 1 auto;min-height:0;}',
      // left date rail layout (no overlapping watermark)
      '.mcal-cell{position:relative;border-radius:11px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.018);padding:5px 7px 5px 5px;overflow:hidden;display:flex;flex-direction:row;gap:6px;min-height:0;}',
      '.mcal-cell.is-weekend{background:rgba(125,211,252,.045);}',
      '.mcal-cell.is-today{border-color:rgba(56,189,248,.6);box-shadow:inset 0 0 0 1px rgba(56,189,248,.3);}',
      '.mcal-cell.is-holi{background:rgba(125,211,252,.05);}',
      '.mcal-cell.is-holi-free{background:rgba(255,196,84,.07);border-color:rgba(255,196,84,.22);}',
      '.mcal-blank{background:transparent;border:0;}',
      '.mcal-rail{flex:0 0 auto;width:22px;display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:1px;}',
      '.mcal-daynum{font:800 17px/1 Inter,system-ui,sans-serif;color:rgba(207,230,247,.62);}',
      '.mcal-cell.is-weekend .mcal-daynum{color:rgba(160,190,225,.72);}',
      '.mcal-cell.is-today .mcal-daynum{color:#38bdf8;}',
      '.mcal-holidot{width:6px;height:6px;border-radius:50%;background:rgba(125,211,252,.6);flex:0 0 auto;}',
      '.mcal-holidot.is-free{background:#ffc454;box-shadow:0 0 5px rgba(255,196,84,.5);}',
      '.mcal-body{position:relative;flex:1 1 auto;min-width:0;min-height:0;overflow:hidden;font-size:11px;line-height:1.18;}',
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
      '.mcal-empty{margin:auto;opacity:.5;}',
      // slide-over panel (holidays / birthdays)
      '.mcal-panelwrap{position:absolute;inset:0;z-index:5;display:none;align-items:center;justify-content:center;background:rgba(4,8,14,.62);}',
      '.mcal-panelwrap.is-open{display:flex;}',
      '.mcal-panel{width:min(540px,92%);max-height:80%;display:flex;flex-direction:column;background:#0c1421;border:1px solid rgba(125,211,252,.22);border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.6);}',
      '.mcal-panel-h{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);flex:0 0 auto;}',
      '.mcal-panel-t{font:800 13px Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#7dd3fc;}',
      '.mcal-panel-x{margin-left:auto;cursor:pointer;width:30px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#cfe6f7;font-size:14px;}',
      '.mcal-panel-x:hover{background:rgba(255,90,80,.18);color:#fff;}',
      '.mcal-panel-b{padding:8px;overflow:auto;flex:1 1 auto;}',
      '.mcal-hrow{display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:9px;}',
      '.mcal-hrow:hover{background:rgba(125,211,252,.05);}',
      '.mcal-hrow.is-free .mcal-hdate{color:#ffc454;}',
      '.mcal-hdate{font:800 12px "Space Mono","SF Mono",monospace;color:#cfe6f7;min-width:54px;flex:0 0 auto;}',
      '.mcal-hnm{flex:1 1 auto;color:#e6eef7;font-weight:600;font-size:13px;}',
      '.mcal-hbadge{flex:0 0 auto;font:800 9px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#ffc454;border:1px solid rgba(255,196,84,.4);border-radius:999px;padding:2px 8px;}',
      '.mcal-soon{padding:34px 24px;text-align:center;color:rgba(190,205,225,.6);font-size:13px;line-height:1.5;}'
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

  function weeksInMonth(p){
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7;
    var daysIn = new Date(p.year, p.idx + 1, 0).getDate();
    return Math.ceil((startW + daysIn) / 7);
  }
  function weekOfDay(p, day){
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7;
    return Math.floor((startW + day - 1) / 7);
  }

  function buildGrid(month){
    var p = monthParts(month);
    if (p.idx == null || !p.year) return '<div class="mcal-empty">Nav datu šim mēnesim.</div>';
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7; // Mon = 0
    var daysIn = new Date(p.year, p.idx + 1, 0).getDate();
    var total = startW + daysIn;
    var today = String(window.__g_todayStr || window.__todayDateStr || '').trim();
    var holi = holidayMap(p.year);

    function cellFor(slot){
      var d = slot - startW + 1;
      if (d < 1 || d > daysIn) return '<div class="mcal-cell mcal-blank"></div>';
      var dateStr = ('0' + d).slice(-2) + '.' + ('0' + (p.idx + 1)).slice(-2) + '.' + p.year;
      var rg = dayWorkers(month, dateStr, rgStore());
      var rd = dayWorkers(month, dateStr, rdStore());
      var wd = slot % 7;
      var hd = holi[dateStr];
      var body = '';
      if (rg.length) body += '<div class="mcal-grp mcal-rg"><div class="mcal-grp-h">RADIOGRĀFERI</div>' + workerRows(rg) + '</div>';
      if (rd.length) body += '<div class="mcal-grp mcal-rd"><div class="mcal-grp-h">RADIOLOGI</div>' + workerRows(rd) + '</div>';
      if (!body) body = '<div class="mcal-off">—</div>';
      var cls = 'mcal-cell' + (wd >= 5 ? ' is-weekend' : '') + (dateStr === today ? ' is-today' : '');
      if (hd) cls += hd.free ? ' is-holi is-holi-free' : ' is-holi';
      var rail = '<div class="mcal-rail"><span class="mcal-daynum">' + d + '</span>'
        + (hd ? '<span class="mcal-holidot' + (hd.free ? ' is-free' : '') + '" title="' + esc(hd.name) + '"></span>' : '')
        + '</div>';
      return '<div class="' + cls + '">' + rail + '<div class="mcal-body">' + body + '</div></div>';
    }

    var cells = '';
    if (_viewMode === 'week'){
      var weeksN = Math.ceil(total / 7);
      _weekIdx = Math.max(0, Math.min(weeksN - 1, _weekIdx));
      for (var s = _weekIdx * 7; s < _weekIdx * 7 + 7; s++) cells += cellFor(s);
    } else {
      for (var s2 = 0; s2 < total; s2++) cells += cellFor(s2);
    }
    return '<div class="mcal-weekhead">' + WEEK.map(function(w){ return '<div>' + w + '</div>'; }).join('') + '</div>'
      + '<div class="mcal-grid' + (_viewMode === 'week' ? ' is-week' : '') + '">' + cells + '</div>';
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
    var p = monthParts(month);

    var prevDis, nextDis;
    if (_viewMode === 'week'){
      var wN = weeksInMonth(p);
      _weekIdx = Math.max(0, Math.min(wN - 1, _weekIdx));
      prevDis = (idx <= 0 && _weekIdx <= 0);
      nextDis = (idx >= months.length - 1 && _weekIdx >= wN - 1);
    } else {
      prevDis = idx <= 0;
      nextDis = idx >= months.length - 1;
    }

    var titleTxt = esc(month) + (_viewMode === 'week' ? ' · ' + (_weekIdx + 1) + '. nedēļa' : '');
    var seg = '<div class="mcal-seg">'
      + '<button data-view="month" class="' + (_viewMode === 'month' ? 'is-on' : '') + '">▦ Mēnesis</button>'
      + '<button data-view="week" class="' + (_viewMode === 'week' ? 'is-on' : '') + '">▤ Nedēļa</button>'
      + '</div>';
    var head = '<div class="mcal-head">'
      + '<div class="mcal-title">' + titleTxt + '</div>'
      + '<div class="mcal-nav">'
      + '<button class="mcal-navbtn" data-go="-1"' + (prevDis ? ' disabled' : '') + '>‹</button>'
      + '<select class="mcal-monthsel">' + months.map(function(m){ return '<option' + (m === month ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select>'
      + '<button class="mcal-navbtn" data-go="1"' + (nextDis ? ' disabled' : '') + '>›</button>'
      + '</div>'
      + seg
      + '<div class="mcal-actions">'
      + '<button class="mcal-actbtn" data-panel="bday">🎂 Dzimšanas dienas</button>'
      + '<button class="mcal-actbtn" data-panel="holi">🎉 Svētku dienas</button>'
      + '<button class="mcal-close" aria-label="Aizvērt">✕</button>'
      + '</div>'
      + '</div>';
    _overlay.querySelector('.mcal-inner').innerHTML = head + buildGrid(month);
    scheduleFit();
  }

  // ---- panels -----------------------------------------------------------
  function openPanel(type){
    var wrap = _overlay && _overlay.querySelector('.mcal-panelwrap');
    if (!wrap) return;
    var year = (monthParts(_curMonth).year) || new Date().getFullYear();
    var html;
    if (type === 'holi'){
      var items = holidaysForYear(year).slice().sort(function(a, b){ return dkey(a.date) - dkey(b.date); });
      html = '<div class="mcal-panel"><div class="mcal-panel-h"><span class="mcal-panel-t">🎉 Svētku dienas ' + year + '</span><button class="mcal-panel-x" aria-label="Aizvērt">✕</button></div>'
        + '<div class="mcal-panel-b">'
        + items.map(function(h){
            return '<div class="mcal-hrow' + (h.free ? ' is-free' : '') + '">'
              + '<span class="mcal-hdate">' + esc(h.date.slice(0, 5)) + '</span>'
              + '<span class="mcal-hnm">' + esc(h.name) + '</span>'
              + (h.free ? '<span class="mcal-hbadge">Brīvdiena</span>' : '')
              + '</div>';
          }).join('')
        + '</div></div>';
    } else {
      html = '<div class="mcal-panel"><div class="mcal-panel-h"><span class="mcal-panel-t">🎂 Dzimšanas dienas</span><button class="mcal-panel-x" aria-label="Aizvērt">✕</button></div>'
        + '<div class="mcal-panel-b"><div class="mcal-soon">Drīzumā — šeit būs kolēģu dzimšanas dienas (datums bez gada).</div></div></div>';
    }
    wrap.innerHTML = html;
    wrap.classList.add('is-open');
  }
  function closePanel(){
    var w = _overlay && _overlay.querySelector('.mcal-panelwrap');
    if (w){ w.classList.remove('is-open'); w.innerHTML = ''; }
  }
  function panelOpen(){
    var w = _overlay && _overlay.querySelector('.mcal-panelwrap');
    return !!(w && w.classList.contains('is-open'));
  }

  function ensureOverlay(){
    if (_overlay) return;
    injectStyles();
    _overlay = document.createElement('div');
    _overlay.id = 'mcal-overlay';
    _overlay.innerHTML = '<div class="mcal-inner"></div><div class="mcal-panelwrap"></div>';
    document.body.appendChild(_overlay);

    _overlay.addEventListener('click', function(e){
      var t = e.target;
      // panel interactions first
      if (t.closest && t.closest('.mcal-panel-x')){ closePanel(); return; }
      if (t.classList && t.classList.contains('mcal-panelwrap')){ closePanel(); return; }
      if (t.closest && t.closest('.mcal-panel')){ return; } // clicks inside panel: ignore

      if (t.closest && t.closest('.mcal-close')){ close(); return; }

      var act = t.closest && t.closest('.mcal-actbtn');
      if (act){ openPanel(act.getAttribute('data-panel')); return; }

      var seg = t.closest && t.closest('.mcal-seg button');
      if (seg){
        var v = seg.getAttribute('data-view');
        if (v && v !== _viewMode){
          _viewMode = v;
          if (v === 'week'){
            var p = monthParts(_curMonth);
            var today = String(window.__g_todayStr || window.__todayDateStr || '').trim();
            var tm = today.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (tm && p.idx != null && (+tm[2] - 1) === p.idx && (+tm[3]) === p.year) _weekIdx = weekOfDay(p, +tm[1]);
            else _weekIdx = 0;
          }
          render(_curMonth);
        }
        return;
      }

      var go = t.closest && t.closest('.mcal-navbtn');
      if (go && !go.disabled){
        var months = allMonths(), i = months.indexOf(_curMonth), step = parseInt(go.getAttribute('data-go'), 10);
        if (_viewMode === 'week'){
          var pp = monthParts(_curMonth), wN = weeksInMonth(pp), nw = _weekIdx + step;
          if (nw < 0){ if (i > 0){ var prevM = months[i - 1]; _weekIdx = weeksInMonth(monthParts(prevM)) - 1; render(prevM); } }
          else if (nw >= wN){ if (i < months.length - 1){ _weekIdx = 0; render(months[i + 1]); } }
          else { _weekIdx = nw; render(_curMonth); }
        } else {
          var j = i + step;
          if (j >= 0 && j < months.length){ _weekIdx = 0; render(months[j]); }
        }
      }
    });
    _overlay.addEventListener('change', function(e){
      if (e.target && e.target.classList.contains('mcal-monthsel')){ _weekIdx = 0; render(e.target.value); }
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
  function close(){ if (_overlay){ closePanel(); _overlay.classList.remove('is-open'); } notifyParent(false); }
  function isOpen(){ return !!(_overlay && _overlay.classList.contains('is-open')); }

  window.addEventListener('message', function(e){
    if (!e.data || e.data.type !== 'mk_open_month_calendar') return;
    if (isOpen()) close(); else open(e.data.month);
  });
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ if (panelOpen()){ closePanel(); } else if (isOpen()){ close(); } }
  });
  window.addEventListener('resize', function(){ if (isOpen()) scheduleFit(); });

  window.MinkaMonthCal = { open: open, close: close, isOpen: isOpen };
})();
