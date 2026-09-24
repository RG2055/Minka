/* ================================================================
   MONTH CALENDAR — full-screen month grid with per-day rosters.
   Opened from the parent dock (postMessage 'mk_open_month_calendar').
   Self-contained: reads window.__grafiksStore / __grafiksStoreRad /
   __fatigue. Injects its own scoped styles.

   Layout: tonal day cells (date and holiday/birthday text on top, then
   radiographers and radiologists, each group marked by a thin role
   rule). Header has a Mēnesis / Nedēļa view toggle and two action
   buttons (Dzimšanas dienas, Svētku dienas) that open list dialogs.
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

  function dutyMonthIndex(){
    var value = String(window.__g_todayStr || window.__todayDateStr || '').trim();
    var match = value.match(/^\d{2}\.(\d{2})\.(\d{4})$/);
    if (match) return parseInt(match[2], 10) * 12 + parseInt(match[1], 10) - 1;
    var now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }

  function allMonths(){
    var set = {};
    Object.keys(rgStore()).forEach(function(m){ set[m] = 1; });
    Object.keys(rdStore()).forEach(function(m){ set[m] = 1; });
    var minMonth = dutyMonthIndex() - 1;
    return Object.keys(set)
      .filter(function(name){
        var p = monthParts(name);
        return p.year != null && p.idx != null && (p.year * 12 + p.idx) >= minMonth;
      })
      .sort(function(a, b){ return monthSortKey(a) - monthSortKey(b); });
  }

  function hoursOf(w){
    var m = String((w && w.shift) || '').match(/(\d+(?:[.,]\d+)?)/);
    return m ? (parseFloat(m[1].replace(',', '.')) || 0) : 0;
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

  // ---- Colleague birthdays (date without year, DD.MM) -------------------
  // Private data is loaded from minka-api; do not commit names/dates here.
  var BIRTHDAYS = [];
  var _bdayMap = null, _bdayLoadPromise = null, _bdayLoaded = false;
  function normalizeBirthdays(list){
    if (!Array.isArray(list)) return [];
    return list.map(function(b){
      var d = String((b && (b.d || b.date || b.day)) || '').trim();
      var dm = d.match(/^(\d{1,2})\.(\d{1,2})(?:\.\d{4})?$/);
      var name = String((b && b.name) || '').trim();
      if (!dm || !name) return null;
      return { d: ('0' + dm[1]).slice(-2) + '.' + ('0' + dm[2]).slice(-2), name: name };
    }).filter(Boolean);
  }
  function setBirthdays(list){
    BIRTHDAYS = normalizeBirthdays(list);
    _bdayMap = null;
    _bdayLoaded = true;
  }
  function refreshBirthdaysUi(){
    try { if (isOpen()) render(_curMonth); } catch(_e){}
    try { renderBdayBadge(); } catch(_e2){}
    try { if (_bdayPopEl) { closeBdayPop(); toggleBdayPop(); } } catch(_e3){}
  }
  function loadBirthdays(){
    if (_bdayLoadPromise) return _bdayLoadPromise;
    if (_bdayLoaded) return Promise.resolve(BIRTHDAYS);
    var api = window.MinkaApi;
    if (!api || typeof api.apiFetch !== 'function'){
      return Promise.resolve([]);
    }
    var controller = new AbortController(), timer;
    var deadline = new Promise(function(_resolve, reject){
      timer = setTimeout(function(){ controller.abort(); reject(new Error('Birthdays timed out')); }, 20000);
    });
    var request = Promise.resolve().then(function(){ return api.apiFetch('/api/birthdays', { signal: controller.signal }); })
      .then(function(r){
        if (!r || !r.ok) throw new Error('Birthdays unavailable');
        return r.json();
      });
    _bdayLoadPromise = Promise.race([request, deadline])
      .then(function(data){
        var list = Array.isArray(data) ? data : (data && (data.birthdays || data.items || data.data));
        if (!Array.isArray(list)) throw new Error("Invalid birthday response");
        setBirthdays(list);
        refreshBirthdaysUi();
        return BIRTHDAYS;
      })
      .catch(function(){
        return [];
      })
      .finally(function(){
        clearTimeout(timer);
        _bdayLoadPromise = null;
      });
    return _bdayLoadPromise;
  }
  function birthdayMap(){
    if (!_bdayLoaded) loadBirthdays();
    if (_bdayMap) return _bdayMap;
    var m = {};
    BIRTHDAYS.forEach(function(b){ (m[b.d] = m[b.d] || []).push(b.name); });
    return (_bdayMap = m);
  }
  function bdkey(dd){ var p = String(dd).split('.'); return (+p[1]) * 100 + (+p[0]); } // sort by MM then DD

  function injectStyles(){
    if (document.getElementById('mcal-style')) return;
    var s = document.createElement('style');
    s.id = 'mcal-style';
    // Same tonal system as the card window (mk-worker-modal-m3.css): flat
    // surface steps, Google Sans, sentence case, role colour as a thin rule.
    s.textContent = [
      '#mcal-overlay{--c0:#10141b;--c1:#161b23;--c2:#1c222c;--c3:#252c37;--c4:#2f3743;--on:#e3e7ee;--on-var:#b8c1cd;--pri:#a8c7fa;--on-pri:#0b2a57;--pri-c:#d6e3ff;--on-pri-c:#0b1d36;--rg:#1fe091;--rd:#3f9bff;--holi:#f5b73f;--bday:#ff8fc8;--k24:#f5b73f;--kn:#64d2ff;',
      'position:fixed;inset:0;z-index:240000;display:none;flex-direction:column;background:var(--c0);color:var(--on);font-family:"Google Sans","Google Sans Text",Inter,system-ui,sans-serif;}',
      '#mcal-overlay.is-open{display:flex;}',
      '#mcal-overlay.is-closing{display:flex;pointer-events:none;}',
      '#mcal-overlay button{font-family:inherit;}',
      '.mcal-inner{display:flex;flex-direction:column;width:100%;height:100%;padding:16px 20px 18px;box-sizing:border-box;}',
      // header
      '.mcal-head{display:flex;align-items:center;gap:16px;margin-bottom:14px;flex:0 0 auto;}',
      '.mcal-titles{display:flex;align-items:baseline;gap:12px;min-width:0;}',
      '.mcal-title{font-size:26px;font-weight:400;line-height:1.15;white-space:nowrap;}',
      '.mcal-sub{font-size:15px;color:var(--on-var);white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '.mcal-nav{display:flex;align-items:center;gap:6px;}',
      '.mcal-icbtn{cursor:pointer;width:40px;height:40px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:20px;background:var(--c2);color:var(--on);padding:0;transition:border-radius 350ms var(--mk-ease-expressive-fast,ease),background-color 150ms ease;}',
      '.mcal-icbtn:hover:not([disabled]){background:var(--c3);}',
      '.mcal-icbtn:active:not([disabled]){border-radius:12px;}',
      '.mcal-icbtn[disabled]{opacity:.38;cursor:default;}',
      '.mcal-icbtn svg{width:20px;height:20px;}',
      '.mcal-seg{display:inline-flex;align-items:center;gap:2px;padding:4px;border-radius:24px;background:var(--c1);}',
      '.mcal-seg button{cursor:pointer;height:32px;padding:0 16px;border:0;border-radius:16px;background:transparent;color:var(--on-var);font-size:14px;font-weight:500;transition:background-color 150ms ease,color 150ms ease;}',
      '.mcal-seg button:hover{color:var(--on);}',
      '.mcal-seg button.is-on{background:var(--pri-c);color:var(--on-pri-c);}',
      '.mcal-actions{margin-left:auto;display:flex;align-items:center;gap:8px;}',
      '.mcal-actbtn{cursor:pointer;height:40px;padding:0 18px;border:0;border-radius:20px;background:var(--c2);color:var(--on);font-size:14px;font-weight:500;white-space:nowrap;transition:background-color 150ms ease;}',
      '.mcal-actbtn:hover{background:var(--c3);}',
      '.mcal-close{margin-left:4px;}',
      '#mcal-overlay button:focus-visible{outline:2px solid var(--pri);outline-offset:2px;}',
      // grid
      '.mcal-weekhead{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-bottom:8px;flex:0 0 auto;}',
      '.mcal-weekhead>div{padding-left:12px;font-size:13px;font-weight:500;color:var(--on-var);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.mcal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-auto-rows:minmax(min-content,1fr);gap:8px;flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;}',
      '.mcal-cell{position:relative;display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:8px;min-width:0;padding:8px 10px 10px 8px;border-radius:16px;background:var(--c1);}',
      '.mcal-main{display:flex;flex-direction:column;gap:4px;min-width:0;}',
      '.mcal-cell.is-weekend{background:#13171e;}',
      '.mcal-grid:not(.is-week) .mcal-cell:not(.mcal-blank){cursor:pointer;transition:background-color 150ms ease;}',
      '.mcal-grid:not(.is-week) .mcal-cell:not(.mcal-blank):hover{background:var(--c2);}',
      '.mcal-cell.is-past>*{opacity:.5;}',
      '.mcal-cell.is-today{box-shadow:inset 0 0 0 2px var(--pri);}',
      '.mcal-blank{background:transparent !important;}',
            '.mcal-daynum{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:500;line-height:1;font-variant-numeric:tabular-nums;color:var(--on);}',
      '.mcal-cell.is-weekend .mcal-daynum{color:var(--on-var);}',
      '.mcal-cell.is-holi-free .mcal-daynum{color:var(--holi);}',
      '.mcal-cell.is-today .mcal-daynum{border-radius:14px;background:var(--pri);color:var(--on-pri);}',
      '.mcal-tags{display:flex;flex-direction:column;min-width:0;padding-top:5px;font-size:11.5px;line-height:1.25;}',
      '.mcal-tag{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--on-var);}',
      '.mcal-tag.is-free{color:var(--holi);}',
      '.mcal-tag.is-bday{color:var(--bday);}',
      '.mcal-body{position:relative;display:flex;flex-direction:column;gap:5px;min-width:0;padding-top:5px;font-size:var(--mcal-fs,13px);line-height:1.25;}',
      '.mcal-tags+.mcal-body{padding-top:0;}',
      '.mcal-grid.is-week .mcal-body{gap:12px;}',
      '.mcal-grp{display:flex;flex-direction:column;gap:1px;padding-left:8px;border-left:2px solid var(--rg);}',
      '.mcal-rd{border-left-color:var(--rd);}',
      '.mcal-grp-h{display:none;font-size:11.5px;font-weight:500;margin-bottom:3px;}',
      '.mcal-grid.is-week .mcal-grp-h{display:block;}',
      '.mcal-rg .mcal-grp-h{color:var(--rg);}',
      '.mcal-rd .mcal-grp-h{color:var(--rd);}',
      '.mcal-w{display:flex;align-items:baseline;gap:6px;min-width:0;white-space:nowrap;}',
      '.mcal-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--on);}',
      '.mcal-nf{font-weight:500;}',
      '.mcal-ns{color:var(--on-var);margin-left:4px;}',
      '.mcal-grid:not(.is-week) .mcal-ns{display:none;}',
      '.mcal-wt{flex:0 0 auto;display:none;color:var(--on-var);font-size:.9em;font-variant-numeric:tabular-nums;}',
      '.mcal-grid.is-week .mcal-w{flex-wrap:wrap;row-gap:0;}',
      '.mcal-grid.is-week .mcal-wt{display:block;flex-basis:100%;order:3;}',
      '.mcal-wh{flex:0 0 auto;margin-left:auto;color:var(--on-var);font-size:.92em;font-variant-numeric:tabular-nums;}',
      '.mcal-hg{display:grid;grid-template-columns:2.9em minmax(0,1fr);column-gap:6px;align-items:start;}',
      '.mcal-hk{justify-self:start;padding:0 .4em;border-radius:.45em;font-size:.88em;font-weight:500;line-height:1.42;font-variant-numeric:tabular-nums;background:var(--c3);color:var(--on);}',
      '.mcal-hk.is-allday{background:rgba(245,183,63,.18);color:var(--k24);}',
      '.mcal-hk.is-night{background:rgba(100,210,255,.16);color:var(--kn);}',
      '.mcal-hg.is-allday .mcal-hl,.mcal-w.is-allday .mcal-name,.mcal-w.is-allday .mcal-ns{color:var(--k24);}',
      '.mcal-hg.is-night .mcal-hl,.mcal-w.is-night .mcal-name,.mcal-w.is-night .mcal-ns{color:var(--kn);}',
      '.mcal-legend{display:flex;align-items:center;gap:6px;font-size:13px;}',
      '.mcal-legend .mcal-hk{font-size:12px;padding:3px 8px;border-radius:8px;}',
      '.mcal-hl{color:var(--on);}',
      '.mcal-off{color:var(--on-var);opacity:.6;font-size:13px;}',
      '.mcal-empty{margin:auto;color:var(--on-var);font-size:15px;}',
      // holidays / birthdays dialog
      '.mcal-panelwrap{position:absolute;inset:0;z-index:5;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.5);}',
      '.mcal-panelwrap.is-open{display:flex;}',
      '.mcal-panel{width:min(520px,92%);max-height:80%;display:flex;flex-direction:column;overflow:hidden;border-radius:28px;background:var(--c1);box-shadow:0 16px 40px rgba(0,0,0,.55);}',
      '.mcal-panel-h{display:flex;align-items:center;gap:12px;padding:20px 20px 12px 24px;flex:0 0 auto;}',
      '.mcal-panel-t{font-size:22px;font-weight:400;color:var(--on);}',
      '.mcal-panel-x{margin-left:auto;}',
      '.mcal-panel-b{padding:0 12px 16px;overflow:auto;flex:1 1 auto;}',
      '.mcal-hrow{display:flex;align-items:center;gap:14px;min-height:44px;padding:0 12px;border-radius:14px;}',
      '.mcal-hrow:hover{background:var(--c2);}',
      '.mcal-hdate{flex:0 0 auto;min-width:48px;font-size:14px;color:var(--on-var);font-variant-numeric:tabular-nums;}',
      '.mcal-hnm{flex:1 1 auto;min-width:0;font-size:14px;color:var(--on);}',
      '.mcal-hbadge{flex:0 0 auto;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:500;background:rgba(245,183,63,.16);color:var(--holi);}',
      '.mcal-hrow.is-free .mcal-hdate{color:var(--holi);}',
      '.mcal-bbadge{background:rgba(255,143,200,.16);color:var(--bday);}',
      '.mcal-hrow.is-bdaytoday .mcal-hdate{color:var(--bday);}',
      '.mcal-soon{padding:32px 24px;text-align:center;color:var(--on-var);font-size:14px;line-height:1.5;}'
    ].join('');
    document.head.appendChild(s);
  }

  var ICON = {
    prev: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M12.27 4.23a.75.75 0 0 1 0 1.06L7.56 10l4.71 4.71a.75.75 0 1 1-1.06 1.06l-5.24-5.24a.75.75 0 0 1 0-1.06l5.24-5.24a.75.75 0 0 1 1.06 0Z"/></svg>',
    next: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7.73 4.23a.75.75 0 0 0 0 1.06L12.44 10l-4.71 4.71a.75.75 0 1 0 1.06 1.06l5.24-5.24a.75.75 0 0 0 0-1.06L8.79 4.23a.75.75 0 0 0-1.06 0Z"/></svg>',
    close: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 1 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"/></svg>'
  };
  var WEEK_LONG = ['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena'];
  var MONTH_LOWER = ['janvāris','februāris','marts','aprīlis','maijs','jūnijs','jūlijs','augusts','septembris','oktobris','novembris','decembris'];

  // Store names arrive upper case ("VĀRDS UZVĀRDS"); show them as names.
  function titleCase(n){
    return String(n || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s-])(\S)/g, function(m, sep, ch){ return sep + ch.toUpperCase(); });
  }

  function workerRows(list){
    return list.map(function(w){
      var h = hoursOf(w);
      var parts = titleCase(w.name).split(' ');
      var fn = parts.shift() || '';
      var sn = parts.join(' ');
      var time = w.startTime && w.endTime ? w.startTime + '–' + w.endTime : '';
      return '<div class="mcal-w is-' + kindOf(w) + '" title="' + esc(titleCase(w.name)) + '">'
        + '<span class="mcal-name"><span class="mcal-nf">' + esc(fn) + '</span>' + (sn ? '<span class="mcal-ns">' + esc(sn) + '</span>' : '') + '</span>'
        + '<span class="mcal-wh">' + hourChip(w) + '</span>'
        + (time ? '<span class="mcal-wt">' + esc(time) + '</span>' : '')
        + '</div>';
    }).join('');
  }

  // Month overview: one line per shift length, first names flowing after
  // it ("24h Anna, Jānis, Pēteris"). Half the lines of a name list, so a
  // whole month fits without clipping; the week view keeps the full list.
  // Shift kind from the roster row: 24h, day or night (12h day and 12h night
  // are different shifts, so they get their own line and colour).
  var KIND_ORDER = { allday: 0, day: 1, night: 2 };
  var KIND_NAME = { allday: 'Diennakts', day: 'Diena', night: 'Nakts' };
  function kindOf(w){
    var t = String(w && w.type || '').toUpperCase(), h = hoursOf(w);
    if (t === 'DIENNAKTS' || h >= 24) return 'allday';
    if (t === 'NAKTS') return 'night';
    if (t === 'DIENA') return 'day';
    var hr = parseInt(String(w && w.startTime || '').split(':')[0], 10);
    return !isNaN(hr) && (hr >= 18 || hr <= 7) ? 'night' : 'day';
  }
  function hourChip(w){
    var h = hoursOf(w), k = kindOf(w);
    return '<span class="mcal-hk is-' + k + '" title="' + KIND_NAME[k] + '">' + (h ? h + 'h' : '') + '</span>';
  }
  function monthRows(list){
    var byH = {}, order = [];
    list.forEach(function(w){
      var key = kindOf(w) + '|' + hoursOf(w);
      if (!byH[key]){ byH[key] = []; order.push(key); }
      byH[key].push(w);
    });
    order.sort(function(a, b){
      var pa = a.split('|'), pb = b.split('|');
      return (KIND_ORDER[pa[0]] - KIND_ORDER[pb[0]]) || (pb[1] - pa[1]);
    });
    return order.map(function(key){
      var names = byH[key].map(function(w){
        return '<span class="mcal-hn" title="' + esc(titleCase(w.name)) + '">' + esc(titleCase(firstName(w.name))) + '</span>';
      }).join(', ');
      return '<div class="mcal-hg is-' + kindOf(byH[key][0]) + '">' + hourChip(byH[key][0]) + '<span class="mcal-hl">' + names + '</span></div>';
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
  // "21.–27. septembris": the days of the shown week that belong to the month.
  function weekRange(p, week){
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7;
    var daysIn = new Date(p.year, p.idx + 1, 0).getDate();
    var a = Math.max(1, week * 7 - startW + 1), b = Math.min(daysIn, week * 7 - startW + 7);
    return (a === b ? a + '.' : a + '.–' + b + '.') + ' ' + MONTH_LOWER[p.idx];
  }

  function todayKey(){
    var t = String(window.__g_todayStr || window.__todayDateStr || '').trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return t ? (+t[3]) * 10000 + (+t[2]) * 100 + (+t[1]) : 0;
  }

  function buildGrid(month){
    var p = monthParts(month);
    if (p.idx == null || !p.year) return '<div class="mcal-empty">Nav datu šim mēnesim.</div>';
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7; // Mon = 0
    var daysIn = new Date(p.year, p.idx + 1, 0).getDate();
    var total = startW + daysIn;
    var today = todayKey();
    var holi = holidayMap(p.year);
    var bday = birthdayMap();

    function cellFor(slot){
      var d = slot - startW + 1;
      if (d < 1 || d > daysIn) return '<div class="mcal-cell mcal-blank"></div>';
      var dateStr = ('0' + d).slice(-2) + '.' + ('0' + (p.idx + 1)).slice(-2) + '.' + p.year;
      var key = p.year * 10000 + (p.idx + 1) * 100 + d;
      var rg = dayWorkers(month, dateStr, rgStore());
      var rd = dayWorkers(month, dateStr, rdStore());
      var hd = holi[dateStr];
      var bdNames = bday[dateStr.slice(0, 5)];
      var body = '';
      var rows = _viewMode === 'week' ? workerRows : monthRows;
      if (rg.length) body += '<div class="mcal-grp mcal-rg"><div class="mcal-grp-h">Radiogrāferi</div>' + rows(rg) + '</div>';
      if (rd.length) body += '<div class="mcal-grp mcal-rd"><div class="mcal-grp-h">Radiologi</div>' + rows(rd) + '</div>';
      if (!body) body = '<div class="mcal-off">Nav maiņu</div>';
      var cls = 'mcal-cell' + (slot % 7 >= 5 ? ' is-weekend' : '')
        + (key === today ? ' is-today' : (today && key < today ? ' is-past' : ''));
      if (hd && hd.free) cls += ' is-holi-free';
      var tags = (hd ? '<span class="mcal-tag' + (hd.free ? ' is-free' : '') + '">' + esc(hd.name) + '</span>' : '')
        + (bdNames ? '<span class="mcal-tag is-bday">Dz. d. ' + esc(bdNames.map(function(n){ return titleCase(firstName(n)); }).join(', ')) + '</span>' : '');
      var rail = '<div class="mcal-rail"><span class="mcal-daynum">' + d + '</span></div>';
      var title = _viewMode === 'week' ? '' : ' title="Atvērt nedēļu"';
      return '<div class="' + cls + '" data-day="' + d + '"' + title + '>' + rail + '<div class="mcal-main">' + (tags ? '<div class="mcal-tags">' + tags + '</div>' : '') + '<div class="mcal-body">' + body + '</div></div></div>';
    }

    var cells = '';
    if (_viewMode === 'week'){
      var weeksN = Math.ceil(total / 7);
      _weekIdx = Math.max(0, Math.min(weeksN - 1, _weekIdx));
      for (var s = _weekIdx * 7; s < _weekIdx * 7 + 7; s++) cells += cellFor(s);
    } else {
      for (var s2 = 0; s2 < total; s2++) cells += cellFor(s2);
    }
    return '<div class="mcal-weekhead">' + WEEK_LONG.map(function(w){ return '<div>' + w + '</div>'; }).join('') + '</div>'
      + '<div class="mcal-grid' + (_viewMode === 'week' ? ' is-week' : '') + '">' + cells + '</div>';
  }

  // Nothing is ever clipped: rows grow to their busiest day. When the month
  // is taller than the screen the whole grid gets one smaller size (never
  // below 11px, so it stays readable); beyond that the grid scrolls.
  function fitAll(){
    var grid = _overlay && _overlay.querySelector('.mcal-grid');
    if (!grid) return;
    grid.style.removeProperty('--mcal-fs');
    if (_viewMode === 'week') return;
    // Paddings and gaps do not scale with the text, so a second pass settles it.
    var fs = 13;
    for (var pass = 0; pass < 2; pass++){
      var sh = grid.scrollHeight, ch = grid.clientHeight;
      if (!(sh > ch + 1 && ch > 0) || fs <= 11) break;
      fs = Math.max(11, fs * (ch / sh) * 0.98);
      grid.style.setProperty('--mcal-fs', fs.toFixed(2) + 'px');
    }
  }
  function scheduleFit(){
    cancelAnimationFrame(_fitRaf);
    _fitRaf = requestAnimationFrame(function(){
      _fitRaf = requestAnimationFrame(function(){ _fitRaf = 0; if (isOpen()) fitAll(); });
    });
  }

  function render(month){
    var months = allMonths();
    if (!months.length){ _overlay.querySelector('.mcal-inner').innerHTML = '<div class="mcal-empty">Nav grafika datu.</div>'; return; }
    if (months.indexOf(month) < 0) {
      var active = window.__activeMonth;
      month = months.indexOf(active) >= 0 ? active : months[months.length - 1];
    }
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

    var stepName = _viewMode === 'week' ? 'nedēļa' : 'mēnesis';
    var head = '<div class="mcal-head">'
      + '<div class="mcal-titles"><div class="mcal-title">' + esc(titleCase(month)) + '</div>'
      + (_viewMode === 'week' && p.idx != null ? '<div class="mcal-sub">' + esc(weekRange(p, _weekIdx)) + '</div>' : '')
      + '</div>'
      + '<div class="mcal-nav">'
      + '<button class="mcal-icbtn mcal-navbtn" data-go="-1" aria-label="Iepriekšējā ' + stepName + '"' + (prevDis ? ' disabled' : '') + '>' + ICON.prev + '</button>'
      + '<button class="mcal-icbtn mcal-navbtn" data-go="1" aria-label="Nākamā ' + stepName + '"' + (nextDis ? ' disabled' : '') + '>' + ICON.next + '</button>'
      + '</div>'
      + '<div class="mcal-seg" role="group" aria-label="Skats">'
      + '<button data-view="month" class="' + (_viewMode === 'month' ? 'is-on' : '') + '" aria-pressed="' + (_viewMode === 'month') + '">Mēnesis</button>'
      + '<button data-view="week" class="' + (_viewMode === 'week' ? 'is-on' : '') + '" aria-pressed="' + (_viewMode === 'week') + '">Nedēļa</button>'
      + '</div>'
      + '<div class="mcal-legend" aria-label="Maiņu veidi"><span class="mcal-hk is-allday">Diennakts</span><span class="mcal-hk is-day">Diena</span><span class="mcal-hk is-night">Nakts</span></div>'
      + '<div class="mcal-actions">'
      + '<button class="mcal-actbtn" data-panel="bday">Dzimšanas dienas</button>'
      + '<button class="mcal-actbtn" data-panel="holi">Svētku dienas</button>'
      + '<button class="mcal-icbtn mcal-close" aria-label="Aizvērt">' + ICON.close + '</button>'
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
    var closeBtn = '<button class="mcal-icbtn mcal-panel-x" aria-label="Aizvērt">' + ICON.close + '</button>';
    if (type === 'holi'){
      var items = holidaysForYear(year).slice().sort(function(a, b){ return dkey(a.date) - dkey(b.date); });
      html = '<div class="mcal-panel" role="dialog" aria-label="Svētku dienas ' + year + '"><div class="mcal-panel-h"><span class="mcal-panel-t">Svētku dienas ' + year + '</span>' + closeBtn + '</div>'
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
      var todayDM = (function(){ var t = String(window.__g_todayStr || window.__todayDateStr || '').trim().match(/^(\d{2})\.(\d{2})/); return t ? (t[1] + '.' + t[2]) : ''; })();
      if (!_bdayLoaded) loadBirthdays();
      var bdays = BIRTHDAYS.slice().sort(function(a, b){ return bdkey(a.d) - bdkey(b.d); });
      html = '<div class="mcal-panel" role="dialog" aria-label="Dzimšanas dienas"><div class="mcal-panel-h"><span class="mcal-panel-t">Dzimšanas dienas</span>' + closeBtn + '</div>'
        + '<div class="mcal-panel-b">'
        + (!_bdayLoaded
          ? '<div class="mcal-soon">Ielādē dzimšanas dienas...</div>'
          : (bdays.length ? bdays.map(function(b){
            var isToday = b.d === todayDM;
            return '<div class="mcal-hrow' + (isToday ? ' is-bdaytoday' : '') + '">'
              + '<span class="mcal-hdate">' + esc(b.d) + '</span>'
              + '<span class="mcal-hnm">' + esc(titleCase(b.name)) + '</span>'
              + (isToday ? '<span class="mcal-hbadge mcal-bbadge">Šodien</span>' : '')
              + '</div>';
          }).join('') : '<div class="mcal-soon">Dzimšanas dienas nav ielādētas.</div>'))
        + '</div></div>';
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

      var dayCell = t.closest && t.closest('.mcal-cell[data-day]');
      if (dayCell && _viewMode === 'month'){
        var day = parseInt(dayCell.getAttribute('data-day'), 10);
        var dayMonth = monthParts(_curMonth);
        if (day > 0 && dayMonth.idx != null){
          _weekIdx = weekOfDay(dayMonth, day);
          _viewMode = 'week';
          render(_curMonth);
        }
        return;
      }

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
  }

  function notifyParent(isOpenNow){
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mk_monthcal_state', open: !!isOpenNow }, '*'); } catch(e){}
  }
  // M3 container transform (js/mk-motion.js): the full-screen month grows
  // out of the button that opened it (dock "Kalendārs") and returns into it.
  var _origin = null;
  function open(month, opts){
    ensureOverlay();
    var MM = window.MinkaMotion;
    var wasOpen = _overlay.classList.contains('is-open');
    if (!wasOpen) _origin = (opts && opts.origin) || (MM && MM.recentLauncher()) || null;
    _overlay.classList.remove('is-closing');
    _overlay.classList.add('is-open');
    render(month || window.__activeMonth || _curMonth);
    if (MM && !wasOpen) MM.openSurface(_overlay, { key: 'monthcal', origin: _origin });
    notifyParent(true);
  }
  function close(){
    if (_overlay){
      var wasOpen = _overlay.classList.contains('is-open');
      closePanel();
      _overlay.classList.remove('is-open');
      var MM = window.MinkaMotion;
      if (MM && wasOpen) {
        _overlay.classList.add('is-closing');
        MM.closeSurface(_overlay, { key: 'monthcal', origin: _origin }, function(){ _overlay.classList.remove('is-closing'); });
      }
    }
    notifyParent(false);
  }
  function isOpen(){ return !!(_overlay && _overlay.classList.contains('is-open')); }

  // ── Header "upcoming birthdays" badge ──────────────────────────────────
  // Subtle count badge in the top bar; pink accent only when a birthday is
  // imminent (≤3 days) or today. Click opens a popover of birthdays ordered by
  // how soon they are.
  function upcomingBirthdays(){
    var now = new Date(); now.setHours(0,0,0,0);
    var Y = now.getFullYear();
    return BIRTHDAYS.map(function(b){
      var p = b.d.split('.'), dd = +p[0], mm = +p[1] - 1;
      var next = new Date(Y, mm, dd); next.setHours(0,0,0,0);
      if (next < now) next = new Date(Y + 1, mm, dd);
      return { name: b.name, d: b.d, days: Math.round((next - now) / 86400000) };
    }).sort(function(a, b){ return a.days - b.days || bdkey(a.d) - bdkey(b.d); });
  }
  function bdayRelLabel(days, dd){
    if (days === 0) return 'Šodien';
    if (days === 1) return 'Rīt';
    return 'Pēc ' + days + ' d.';
  }
  function bdayRelLong(days){
    if (days === 0) return 'Šodien';
    if (days === 1) return 'Rīt';
    return 'pēc ' + days + ' dienām';
  }
  var BDAY_NEAR_DAYS = 14; // only surface the countdown pill when this close
  function injectBdayBadgeStyles(){
    if (document.getElementById('mcal-bday-style')) return;
    var s = document.createElement('style');
    s.id = 'mcal-bday-style';
    s.textContent = [
      '.mk-bday-badge{display:inline-flex;align-items:center;gap:6px;height:23px;padding:0 5px;border-radius:8px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;transition:background .15s;flex:0 0 auto;}',
      '#mkSearchDate .mk-search-date-main .mk-bday-badge{margin-left:auto;}',
      '.mk-bday-badge:hover{background:rgba(125,211,252,.10);}',
      '.mk-bday-badge .mk-bday-ic{font-size:15px;line-height:1;filter:grayscale(.5);opacity:.68;transition:filter .15s,opacity .15s;}',
      '.mk-bday-badge.has-up .mk-bday-ic{filter:none;opacity:1;}',
      '.mk-bday-pill{padding:2px 9px;border-radius:999px;background:rgba(236,224,245,.92);color:#2a2140;font:800 11px Inter,system-ui,sans-serif;white-space:nowrap;letter-spacing:.01em;}',
      '.mk-bday-badge.is-today .mk-bday-pill{background:rgba(255,150,205,.96);color:#3a1024;}',
      '.mk-bday-pop{position:fixed;z-index:240500;width:420px;max-height:60vh;display:flex;flex-direction:column;background:#0c1421;border:1px solid rgba(125,211,252,.22);border-radius:14px;box-shadow:0 22px 56px rgba(0,0,0,.6);overflow:hidden;font-family:Inter,system-ui,sans-serif;}',
      '.mk-bday-pop-h{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07);font:800 12px Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#7dd3fc;}',
      '.mk-bday-pop-b{overflow:auto;padding:6px;}',
      '.mk-bday-row{display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:9px;}',
      '.mk-bday-row:hover{background:rgba(125,211,252,.05);}',
      '.mk-bday-row.is-today{background:rgba(255,121,198,.08);}',
      '.mk-bday-when{flex:0 0 auto;min-width:48px;font:800 12px "Space Mono",monospace;color:rgba(160,180,205,.82);}',
      '.mk-bday-nm{flex:1 1 auto;min-width:0;color:#e6eef7;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.mk-bday-row .mk-bday-pill{flex:0 0 auto;margin-left:auto;}',
      '.mk-bday-row.is-today .mk-bday-pill{background:rgba(255,150,205,.96);color:#3a1024;}'
    ].join('');
    document.head.appendChild(s);
  }
  var _bdayPopEl = null;
  function notifyBuddyBirthday(hidden){
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({
        type: 'mk-buddy-birthday-visibility',
        hidden: !!hidden
      }, window.location.origin);
    } catch(e) {}
  }
  function closeBdayPop(){
    if (_bdayPopEl){
      _bdayPopEl.remove();
      _bdayPopEl = null;
      document.removeEventListener('pointerdown', bdayPopOutside, true);
    }
    notifyBuddyBirthday(false);
  }
  function bdayPopOutside(e){
    if (_bdayPopEl && !_bdayPopEl.contains(e.target) && !(e.target.closest && e.target.closest('#mkBdayBadge'))) closeBdayPop();
  }
  function toggleBdayPop(){
    if (_bdayPopEl){ closeBdayPop(); return; }
    var btn = document.getElementById('mkBdayBadge'); if (!btn) return;
    var list = upcomingBirthdays();
    var pop = document.createElement('div');
    pop.className = 'mk-bday-pop';
    pop.innerHTML = '<div class="mk-bday-pop-h">🎂 Tuvākās dzimšanas dienas</div><div class="mk-bday-pop-b">'
      + list.map(function(x){
          var soon = x.days <= 3;
          // Left: the date (DD.MM). Right (after the name): a day-count pill in
          // the same style as the header birthday badge.
          return '<div class="mk-bday-row' + (x.days === 0 ? ' is-today' : '') + (soon ? ' is-soon' : '') + '">'
            + '<span class="mk-bday-when">' + esc(x.d) + '</span>'
            + '<span class="mk-bday-nm">' + esc(x.name) + '</span>'
            + '<span class="mk-bday-pill">' + esc(bdayRelLong(x.days)) + '</span></div>';
        }).join('')
      + '</div>';
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect(), w = 420;
    pop.style.top = (r.bottom + 8) + 'px';
    pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
    _bdayPopEl = pop;
    notifyBuddyBirthday(true);
    setTimeout(function(){ document.addEventListener('pointerdown', bdayPopOutside, true); }, 0);
  }
  function birthdayNames(items){
    var names = (items || []).map(function(x){
      return String(x && x.name || '').trim().split(/\s+/)[0];
    }).filter(Boolean);
    if (!names.length) return '';
    return names.length > 1
      ? names.slice(0, -1).join(', ') + ' un ' + names[names.length - 1]
      : names[0];
  }
  function renderBdayBadge(){
    var btn = document.getElementById('mkBdayBadge'); if (!btn) return;
    if (!_bdayLoaded) loadBirthdays();
    var list = upcomingBirthdays();
    var nearest = list[0];
    var today = list.filter(function(x){ return x.days === 0; });
    var isToday = today.length > 0;
    btn.style.display = nearest ? '' : 'none';
    // On the birthday replace the countdown with a compact congratulations.
    btn.innerHTML = '<span class="mk-bday-ic" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16v9H4zM4 16c2 2 3-2 5 0s3-2 5 0 4-2 6 0M8 12V8m8 4V8M8 5V3m8 2V3"/></svg></span>'
      + (nearest ? '<span class="mk-bday-pill">' + esc(isToday ? birthdayNames(today) : bdayRelLong(nearest.days)) + '</span>' : '');
    btn.classList.toggle('has-up', !!nearest);
    btn.classList.toggle('is-today', isToday);
    btn.title = nearest
      ? (isToday ? ('Šodien: ' + today.map(function(x){ return x.name; }).join(', '))
        : ('Tuvākā: ' + nearest.name + ' ' + bdayRelLong(nearest.days)))
      : 'Dzimšanas dienas';
  }
  function initBdayBadge(){
    notifyBuddyBirthday(false);
    injectBdayBadgeStyles();
    // Put it on the weekday (top) row, pushed to the right — weekday left,
    // birthday top-right, namedays below.
    var host = document.querySelector('#mkSearchDate .mk-search-date-main') || document.getElementById('minkaBarInner');
    if (!host) return;
    if (!document.getElementById('mkBdayBadge')){
      var btn = document.createElement('button');
      btn.id = 'mkBdayBadge';
      btn.className = 'mk-bday-badge';
      btn.type = 'button';
      host.appendChild(btn);
      btn.addEventListener('click', function(e){ e.stopPropagation(); toggleBdayPop(); });
    }
    renderBdayBadge();
    loadBirthdays();
    setInterval(renderBdayBadge, 60 * 60 * 1000); // refresh hourly (day rollover)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBdayBadge, { once: true });
  else initBdayBadge();

  window.addEventListener('message', function(e){
    if (e.origin !== window.location.origin || e.source !== window.parent) return;
    if (!e.data || e.data.type !== 'mk_open_month_calendar') return;
    if (isOpen()) close(); else open(e.data.month);
  });
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ if (_bdayPopEl){ closeBdayPop(); } else if (panelOpen()){ closePanel(); } else if (isOpen()){ close(); } }
  });
  window.addEventListener('resize', function(){ if (isOpen()) scheduleFit(); });
  document.addEventListener('minka:auth-ok', loadBirthdays);

  window.MinkaMonthCal = { open: open, close: close, isOpen: isOpen };
})();
