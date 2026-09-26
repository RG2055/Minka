/* ================================================================
   MONTH CALENDAR — full-screen month grid with per-day rosters.
   Opened from the parent dock (postMessage 'mk_open_month_calendar').
   Self-contained: reads window.__grafiksStore / __grafiksStoreRad /
   __fatigue. Injects its own scoped styles.

   Layout: tonal day cells (date and holiday/birthday text on top, then
   radiographers and radiologists, each group marked by a thin role
   rule). Header has a Mēnesis / Nedēļa / Prombūtnes view toggle and two
   action buttons (Dzimšanas dienas, Svētku dienas) that open list dialogs.
   Prombūtnes is a month timeline of absences (DNL, ATV, A…) from
   /api/absences, one row per person.
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
  var _viewMode = 'month';   // 'month' | 'week' | 'abs' | 'rgv' (/rad: radiographers)
  var _weekIdx = 0;          // which week row (0-based) in week view
  var _viewFrom = null;      // view being left, for the tab switch motion
  var _holiCache = {};

  // /rad: the left column holds residents and the radiographers' birthdays
  // are not shown anywhere.
  var IS_RAD = window.MINKA_APP === 'rad';
  var LEFT = IS_RAD ? 'Rezidenti' : 'Radiogrāferi';
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
    try { if (_bdayPopEl) { closeBdayPop(true); toggleBdayPop(); } } catch(_e3){}
  }
  function loadBirthdays(){
    if (window.MINKA_APP === 'rad') { _bdayLoaded = true; return Promise.resolve([]); }
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
    if (window.MINKA_APP === 'rad') return {};
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
      '.mcal-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-bottom:14px;flex:0 0 auto;}',
      '.mcal-headicon{flex:0 0 auto;width:28px;height:28px;image-rendering:pixelated;}',
      '.mcal-titles{display:flex;align-items:baseline;gap:12px;min-width:0;}',
      '.mcal-title{font-size:26px;font-weight:400;line-height:1.15;white-space:nowrap;}',
      '.mcal-sub{font-size:15px;color:var(--on-var);white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '.mcal-nav{display:flex;align-items:center;gap:6px;}',
      '.mcal-icbtn{cursor:pointer;width:40px;height:40px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:20px;background:var(--c2);color:var(--on);padding:0;transition:border-radius 350ms var(--mk-ease-expressive-fast,ease),background-color 150ms ease;}',
      '.mcal-icbtn:hover:not([disabled]){background:var(--c3);}',
      '.mcal-icbtn:active:not([disabled]){border-radius:12px;}',
      '.mcal-icbtn[disabled]{opacity:.38;cursor:default;}',
      '.mcal-icbtn svg{width:20px;height:20px;}',
      '.mcal-seg{position:relative;display:inline-flex;align-items:center;gap:2px;padding:4px;border-radius:24px;background:var(--c1);}',
      '.mcal-segpill{position:absolute;z-index:0;border-radius:16px;background:var(--pri-c);pointer-events:none;}',
      '.mcal-seg button{position:relative;z-index:1;}',
      '.mcal-seg.has-pill button.is-on{background:transparent;}',
      // Label colours change over the pill's travel, not before it arrives.
      '.mcal-seg button{transition:border-radius 350ms var(--mk-ease-expressive-fast,ease),background-color 150ms ease,color 280ms var(--mk-ease-effects,ease) !important;}',
      '.mcal-seg button{cursor:pointer;height:32px;padding:0 16px;border:0;border-radius:16px;background:transparent;color:var(--on-var);font-size:14px;font-weight:500;transition:border-radius 350ms var(--mk-ease-expressive-fast,ease),background-color 150ms ease,color 150ms ease;}',
      '.mcal-seg button:hover{color:var(--on);}',
      '.mcal-seg button.is-on{background:var(--pri-c);color:var(--on-pri-c);}',
      '.mcal-actions{margin-left:auto;display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;}',
      '.mcal-actions>.mcal-legend{margin-right:8px;}',
      '.mcal-actbtn{cursor:pointer;height:40px;padding:0 18px;border:0;border-radius:20px;background:var(--c2);color:var(--on);font-size:14px;font-weight:500;white-space:nowrap;transition:border-radius 350ms var(--mk-ease-expressive-fast,ease),background-color 150ms ease;}',
      '.mcal-actbtn:hover{background:var(--c3);}',
      '.mcal-actbtn:active,.mcal-seg button:active,.mcal-abf:active{border-radius:10px;}',
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
      // /rad: residents teal, radiologists coral (as everywhere in /rad).
      'html.minka-rad #mcal-overlay{--rg:#4dd0c8;--rd:#ff8f80;--rgx:#b8c2cf;}',
      // /rad Radiogrāferi tab: the radiographers in a quiet grey
      '.mcal-rgx{border-left-color:var(--rgx);}',
      '.mcal-rgx .mcal-grp-h{color:var(--rgx);}',
      // The group name in every day (month and week), so it is plain who is
      // a radiographer and who a radiologist (/rad: resident / radiologist).
      '#mcal-overlay .mcal-grp-h{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px;}',
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
      '.mcal-panelwrap{position:absolute;inset:0;z-index:5;display:none;align-items:center;justify-content:center;}',
      '.mcal-scrim{position:absolute;inset:0;background:rgba(0,0,0,.5);}',
      '.mcal-panelwrap.is-open{display:flex;}',
      '.mcal-panel{position:relative;width:min(520px,92%);max-height:80%;display:flex;flex-direction:column;overflow:hidden;border-radius:28px;background:var(--c1);box-shadow:0 16px 40px rgba(0,0,0,.55);}',
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
      '.mcal-soon{padding:32px 24px;text-align:center;color:var(--on-var);font-size:14px;line-height:1.5;}',
      // absences timeline
      '#mcal-overlay{--ab-leave:#f2b84b;--ab-sick:#ff8a80;--ab-away:#4dd0c8;--ab-unavailable:#9aa4b2;--ab-other:#c9ced6;}',
      '.mcal-head .mcal-legend{flex-wrap:wrap;}',
      '.mcal-head .mcal-abfilters{flex:1 0 100%;margin:-4px 0 0 -12px;}',
      '.mcal-abf{cursor:pointer;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:0;border-radius:16px;background:transparent;color:var(--on-var);font-size:13px;font-weight:500;transition:border-radius 350ms var(--mk-ease-expressive-fast,ease),background-color 150ms ease,color 150ms ease,opacity 150ms ease;}',
      '.mcal-abf i{transition:background-color 150ms ease,box-shadow 150ms ease;}',
      '.mcal-abf:hover{background:var(--c2);color:var(--on);}',
      '.mcal-abf i{width:10px;height:10px;border-radius:3px;background:var(--abc);}',
      '.mcal-abf[aria-pressed="false"]{opacity:.45;}',
      '.mcal-abf[aria-pressed="false"] i{background:transparent;box-shadow:inset 0 0 0 1.5px var(--abc);}',
      '.mcal-absw{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;}',
      '.mcal-abs{position:relative;--abn:176px;min-height:100%;padding-bottom:8px;}',
      '.mcal-abs-bg{position:absolute;top:0;bottom:0;left:calc(var(--abn) + 8px);right:0;display:grid;grid-template-columns:repeat(var(--abd),minmax(0,1fr));pointer-events:none;}',
      '.mcal-abs-bg>i{border-left:1px solid rgba(255,255,255,.035);}',
      '.mcal-abs-bg>i.is-weekend{background:rgba(255,255,255,.028);}',
      '.mcal-abs-bg>i.is-free{background:rgba(245,183,63,.06);}',
      '.mcal-abs-bg>i.is-today{background:rgba(168,199,250,.10);box-shadow:inset 1px 0 0 rgba(168,199,250,.45),inset -1px 0 0 rgba(168,199,250,.45);}',
      '.mcal-abhead,.mcal-abrow{position:relative;display:grid;grid-template-columns:var(--abn) minmax(0,1fr);column-gap:8px;align-items:center;}',
      '.mcal-abhead{position:sticky;top:0;z-index:2;height:30px;background:var(--c0);}',
      '.mcal-abdays,.mcal-abtrack{display:grid;grid-template-columns:repeat(var(--abd),minmax(0,1fr));align-items:center;}',
      '.mcal-abdays>span{text-align:center;font-size:12px;color:var(--on-var);font-variant-numeric:tabular-nums;}',
      '.mcal-abdays>span.is-weekend{opacity:.55;}',
      '.mcal-abdays>span.is-free{color:var(--holi);opacity:1;}',
      '.mcal-abdays>span.is-today{color:var(--on-pri);background:var(--pri);border-radius:10px;opacity:1;font-weight:500;}',
      '.mcal-absec{position:relative;margin:14px 0 4px;padding-left:10px;border-left:2px solid var(--rg);font-size:13px;font-weight:500;color:var(--rg);}',
      '.mcal-absec.mcal-rd{border-left-color:var(--rd);color:var(--rd);}',
      '.mcal-absec.mcal-san{border-left-color:var(--on-var);color:var(--on-var);}',
      '.mcal-absec small{margin-left:8px;font-size:12px;font-weight:400;color:var(--on-var);}',
      '.mcal-abrow{min-height:30px;border-radius:10px;}',
      '.mcal-abrow:hover{background:rgba(255,255,255,.035);}',
      '.mcal-abname{min-width:0;padding-left:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--on);}',
      '.mcal-abname .mcal-ns{display:inline;}',
      '.mcal-ni{display:none;color:var(--on-var);}',
      '.mcal-abtrack{height:30px;}',
      '.mcal-ab{grid-row:1;height:22px;min-width:0;margin:0 1px;padding:0 6px;box-sizing:border-box;display:flex;align-items:center;overflow:hidden;white-space:nowrap;border-radius:7px;font-size:11.5px;font-weight:500;line-height:1;color:var(--abc);background:rgba(255,255,255,.07);background:color-mix(in srgb,var(--abc) 20%,transparent);}',
      '.mcal-abwhen{margin-left:8px;font-weight:400;opacity:.75;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;}',
      '.mcal-ab.is-cl{border-top-left-radius:0;border-bottom-left-radius:0;margin-left:0;}',
      '.mcal-ab.is-cr{border-top-right-radius:0;border-bottom-right-radius:0;margin-right:0;}',
      '.mcal-ab.is-unavailable{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--abc) 55%,transparent);}',
      '.is-leave{--abc:var(--ab-leave);}.is-sick{--abc:var(--ab-sick);}.is-away{--abc:var(--ab-away);}.is-unavailable{--abc:var(--ab-unavailable);}.is-other{--abc:var(--ab-other);}',
      '@media (max-width:760px){.mcal-abs{--abn:92px;padding-right:6px;}.mcal-abname .mcal-ns,.mcal-abwhen{display:none;}.mcal-ni{display:inline;}.mcal-abdays>span:not(.is-tick):not(.is-today){visibility:hidden;}.mcal-abdays>span.is-today{border-radius:6px;}.mcal-ab{padding:0 2px;font-size:10px;}.mcal-abdays>span{font-size:10px;}}'
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

  // ---- Absences (Prombūtnes view) ----------------------------------------
  // /api/absences: absences from the monthly sheets (radiographers "tech",
  // radiologists "doc") and the radiographers' yearly leave plan, which is
  // used for months the radiographer sheet does not have yet.
  var AB_GROUPS = [
    { k: 'leave', name: 'Atvaļinājums' },
    { k: 'sick', name: 'Slimība' },
    { k: 'away', name: 'Strādā citur' },
    { k: 'unavailable', name: 'Nevar strādāt' },
    { k: 'other', name: 'Cits' }
  ];
  var AB_NAME = {}; AB_GROUPS.forEach(function(g){ AB_NAME[g.k] = g.name; });
  var AB_TTL = 10 * 60 * 1000; // the sheets are re-read every 10 min
  var _abs = null, _absAt = 0, _absPromise = null, _absFailed = false;
  var _absOff = (function(){ try { return JSON.parse(localStorage.getItem('mcal_abs_off_v1') || '{}') || {}; } catch(_e){ return {}; } })();
  function saveAbsOff(){ try { localStorage.setItem('mcal_abs_off_v1', JSON.stringify(_absOff)); } catch(_e){} }

  function loadAbsences(){
    if (_absPromise) return _absPromise;
    if (_abs && Date.now() - _absAt < AB_TTL) return Promise.resolve(_abs);
    var api = window.MinkaApi;
    if (!api || typeof api.apiFetch !== 'function') return Promise.resolve(_abs);
    _absPromise = Promise.resolve().then(function(){ return api.apiFetch('/api/absences'); })
      .then(function(r){ if (!r || !r.ok) throw new Error('Absences unavailable'); return r.json(); })
      .then(function(data){
        if (!data || !Array.isArray(data.absences)) throw new Error('Invalid absences');
        _abs = data; _absAt = Date.now(); _absFailed = false;
        return _abs;
      })
      .catch(function(){ _absFailed = !_abs; return _abs; })
      .finally(function(){
        _absPromise = null;
        if (isOpen() && _viewMode === 'abs') render(_curMonth);
      });
    return _absPromise;
  }

  function normName(n){ return String(n || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function dnum(s){ var p = String(s).split('.'); return Date.UTC(+p[2], +p[1] - 1, +p[0]) / 864e5; }
  var MONTH_UPPER = MONTH_LOWER.map(function(m){ return m.toUpperCase(); });

  // Months the absences view can show: the schedule's months and on to the
  // end of what the leave plan covers.
  function absMonths(){
    var names = allMonths();
    var start = names.length ? monthSortKey(names[0]) : dutyMonthIndex() - 1;
    var end = names.length ? monthSortKey(names[names.length - 1]) : start;
    if (_abs) (IS_RAD ? (_abs.absences || []).filter(function(a){ return a.src === 'doc'; }) : (_abs.leavePlan || []).concat(_abs.absences || [])).forEach(function(a){
      var p = String(a.to).split('.'); var k = (+p[2]) * 12 + (+p[1]) - 1;
      if (k > end) end = k;
    });
    end = Math.min(end, start + 17);
    var out = [];
    for (var k = start; k <= end; k++) out.push(MONTH_UPPER[k % 12] + ' ' + Math.floor(k / 12));
    return out;
  }

  function storeNames(st){
    var set = {};
    Object.keys(st).forEach(function(m){ (st[m] || []).forEach(function(d){ (d.workers || []).forEach(function(w){ set[normName(w.name)] = 1; }); }); });
    return set;
  }
  function radiologistNames(){
    var set = {};
    var st = rdStore();
    Object.keys(st).forEach(function(m){ (st[m] || []).forEach(function(d){ (d.workers || []).forEach(function(w){ set[normName(w.name)] = 1; }); }); });
    return set;
  }

  function monthAbsences(p){
    var first = Date.UTC(p.year, p.idx, 1) / 864e5, daysIn = new Date(p.year, p.idx + 1, 0).getDate(), last = first + daysIn - 1;
    var hasSheet = (_abs.techMonths || []).some(function(m){ return m.month === p.idx + 1 && m.year === p.year; });
    var rdNames = radiologistNames();
    // /rad: only the radiologist sheet — its residents (left column) and
    // radiologists; nothing from the radiographers' sheet.
    var leftNames = IS_RAD ? storeNames(rgStore()) : null;
    var list = (_abs.absences || []).filter(function(a){
      if (a.src === 'doc') return !!rdNames[normName(a.name)] || !!(leftNames && leftNames[normName(a.name)]);
      return !IS_RAD && a.src === 'tech' && hasSheet;
    });
    if (!hasSheet && !IS_RAD) list = list.concat(_abs.leavePlan || []);
    var rows = {};
    list.forEach(function(a){
      if (a.group === 'assignment') return;
      var f = dnum(a.from), t = dnum(a.to);
      if (t < first || f > last) return;
      var sec = a.src === 'doc' ? (leftNames && leftNames[normName(a.name)] && !rdNames[normName(a.name)] ? 'rg' : 'rd') : (a.role ? 'san' : 'rg');
      var key = sec + '|' + normName(a.name);
      var row = rows[key] || (rows[key] = { sec: sec, name: a.name, items: [], start: Infinity });
      row.items.push({ a: a, s: Math.max(f, first) - first + 1, e: Math.min(t, last) - first + 1, cl: f < first, cr: t > last });
      row.start = Math.min(row.start, Math.max(f, first));
    });
    return { rows: Object.keys(rows).map(function(k){ return rows[k]; }), daysIn: daysIn, plan: !hasSheet };
  }

  function buildAbsences(month){
    var p = monthParts(month);
    if (p.idx == null || !p.year) return '<div class="mcal-empty">Nav datu šim mēnesim.</div>';
    if (!_abs){
      if (!_absPromise) loadAbsences();
      return '<div class="mcal-empty">' + (_absFailed ? 'Prombūtnes nav pieejamas.' : 'Ielādē prombūtnes...') + '</div>';
    }
    if (Date.now() - _absAt >= AB_TTL) loadAbsences();
    var data = monthAbsences(p), n = data.daysIn;
    var today = todayKey(), holi = holidayMap(p.year);
    var startW = (new Date(p.year, p.idx, 1).getDay() + 6) % 7;
    var bg = '', days = '';
    for (var d = 1; d <= n; d++){
      var dateStr = ('0' + d).slice(-2) + '.' + ('0' + (p.idx + 1)).slice(-2) + '.' + p.year;
      var cls = ((startW + d - 1) % 7 >= 5 ? ' is-weekend' : '') + (holi[dateStr] && holi[dateStr].free ? ' is-free' : '')
        + (p.year * 10000 + (p.idx + 1) * 100 + d === today ? ' is-today' : '');
      bg += '<i class="' + cls.trim() + '"></i>';
      // Phones show every fifth day; not right next to today's number.
      var todayDay = today - (p.year * 10000 + (p.idx + 1) * 100);
      if ((d === 1 || d % 5 === 0) && !(todayDay >= 1 && todayDay <= n && Math.abs(d - todayDay) <= 2 && d !== todayDay)) cls += ' is-tick';
      days += '<span class="' + cls.trim() + '">' + d + '</span>';
    }
    var SECS = [
      { k: 'rg', name: LEFT },
      { k: 'rd', name: 'Radiologi' },
      { k: 'san', name: 'Sanitāri' }
    ];
    var body = '', shown = 0;
    SECS.forEach(function(sec){
      var rows = data.rows.filter(function(r){ return r.sec === sec.k; }).map(function(r){
        return { r: r, items: r.items.filter(function(it){ return !_absOff[it.a.group]; }) };
      }).filter(function(x){ return x.items.length; })
        .sort(function(a, b){ return a.r.start - b.r.start || titleCase(a.r.name).localeCompare(titleCase(b.r.name), 'lv'); });
      if (!rows.length) return;
      shown += rows.length;
      body += '<div class="mcal-absec mcal-' + sec.k + '">' + sec.name + (sec.k !== 'rd' && data.plan && !IS_RAD ? '<small>pēc atvaļinājumu plāna</small>' : '') + '</div>';
      rows.forEach(function(x){
        var parts = titleCase(x.r.name).split(' '), fn = parts.shift() || '', sn = parts.join(' ');
        var bars = x.items.map(function(it){
          var a = it.a, g = AB_NAME[a.group] || 'Cits';
          var when = a.from === a.to ? a.from : a.from.slice(0, 5) + '.–' + a.to;
          return '<span class="mcal-ab is-' + esc(a.group || 'other') + (it.cl ? ' is-cl' : '') + (it.cr ? ' is-cr' : '')
            + '" style="grid-column:' + it.s + ' / ' + (it.e + 1) + '" title="' + esc(g + ' (' + a.code + ') ' + when) + '">' + esc(a.code)
            + (it.e - it.s >= 4 && a.from !== a.to ? '<span class="mcal-abwhen">' + esc(a.from.slice(0, 5) + '.–' + a.to.slice(0, 5) + '.') + '</span>' : '') + '</span>';
        }).join('');
        body += '<div class="mcal-abrow"><div class="mcal-abname" title="' + esc(titleCase(x.r.name)) + '"><span class="mcal-nf">' + esc(fn) + '</span>'
          + (sn ? '<span class="mcal-ns">' + esc(sn) + '</span><span class="mcal-ni"> ' + esc(sn.charAt(0)) + '.</span>' : '') + '</div><div class="mcal-abtrack">' + bars + '</div></div>';
      });
    });
    if (!shown) body = '<div class="mcal-soon">Šajā mēnesī prombūtņu nav.</div>';
    return '<div class="mcal-absw"><div class="mcal-abs" style="--abd:' + n + '">'
      + '<div class="mcal-abs-bg" aria-hidden="true">' + bg + '</div>'
      + '<div class="mcal-abhead"><span></span><div class="mcal-abdays">' + days + '</div></div>'
      + body + '</div></div>';
  }

  // ---- /rad: Radiogrāferi view (read only) ------------------------------
  // The radiographers' month from /api/schedule, shown like the month grid.
  // Fetched when the tab is opened and kept in memory only: nothing of the
  // radiographers' data is written anywhere from /rad.
  var _rgx = null, _rgxAt = 0, _rgxPromise = null, _rgxFailed = false;
  function loadRgx(){
    if (!IS_RAD || _rgxPromise || (_rgx && Date.now() - _rgxAt < AB_TTL)) return;
    var api = window.MinkaApi;
    if (!api || typeof api.apiFetch !== 'function'){ _rgxFailed = !_rgx; return; }
    _rgxPromise = Promise.resolve().then(function(){ return api.apiFetch('/api/schedule'); })
      .then(function(r){ if (!r || !r.ok) throw new Error('Schedule unavailable'); return r.json(); })
      .then(function(d){
        if (!d || !d.radiographers || typeof d.radiographers !== 'object') throw new Error('Invalid schedule');
        _rgx = d.radiographers; _rgxAt = Date.now(); _rgxFailed = false;
      })
      .catch(function(){ _rgxFailed = !_rgx; })
      .finally(function(){
        _rgxPromise = null;
        if (isOpen() && _viewMode === 'rgv') render(_curMonth);
      });
  }

  function absFilters(){
    return '<div class="mcal-legend mcal-abfilters" role="group" aria-label="Prombūtņu veidi">' + AB_GROUPS.map(function(g){
      return '<button class="mcal-abf is-' + g.k + '" data-abg="' + g.k + '" aria-pressed="' + !_absOff[g.k] + '"><i></i>' + g.name + '</button>';
    }).join('') + '</div>';
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
    var rgv = _viewMode === 'rgv';
    if (rgv){
      if (!_rgx || Date.now() - _rgxAt >= AB_TTL) loadRgx();
      if (!_rgx) return '<div class="mcal-empty">' + (_rgxFailed ? 'Radiogrāferu grafiks nav pieejams.' : 'Ielādē radiogrāferus...') + '</div>';
    }

    function cellFor(slot){
      var d = slot - startW + 1;
      if (d < 1 || d > daysIn) return '<div class="mcal-cell mcal-blank"></div>';
      var dateStr = ('0' + d).slice(-2) + '.' + ('0' + (p.idx + 1)).slice(-2) + '.' + p.year;
      var key = p.year * 10000 + (p.idx + 1) * 100 + d;
      var rg = rgv ? dayWorkers(month, dateStr, _rgx) : dayWorkers(month, dateStr, rgStore());
      var rd = rgv ? [] : dayWorkers(month, dateStr, rdStore());
      var hd = holi[dateStr];
      var bdNames = bday[dateStr.slice(0, 5)];
      var body = '';
      var rows = _viewMode === 'week' ? workerRows : monthRows;
      var rgHtml = rg.length ? '<div class="mcal-grp ' + (rgv ? 'mcal-rgx' : 'mcal-rg') + '"><div class="mcal-grp-h">' + (rgv ? 'Radiogrāferi' : LEFT) + '</div>' + rows(rg) + '</div>' : '';
      var rdHtml = rd.length ? '<div class="mcal-grp mcal-rd"><div class="mcal-grp-h">Radiologi</div>' + rows(rd) + '</div>' : '';
      body += IS_RAD ? rdHtml + rgHtml : rgHtml + rdHtml;      // /rad: radiologists first
      if (!body) body = '<div class="mcal-off">Nav maiņu</div>';
      var cls = 'mcal-cell' + (slot % 7 >= 5 ? ' is-weekend' : '')
        + (key === today ? ' is-today' : (today && key < today ? ' is-past' : ''));
      if (hd && hd.free) cls += ' is-holi-free';
      var tags = (hd ? '<span class="mcal-tag' + (hd.free ? ' is-free' : '') + '">' + esc(hd.name) + '</span>' : '')
        + (bdNames ? '<span class="mcal-tag is-bday">Dz. d. ' + esc(bdNames.map(function(n){ return titleCase(firstName(n)); }).join(', ')) + '</span>' : '');
      var rail = '<div class="mcal-rail"><span class="mcal-daynum">' + d + '</span></div>';
      var title = _viewMode === 'month' ? ' title="Atvērt nedēļu"' : '';
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

  // Width of the longest "Mēnesis YYYY" in the title font.
  var _titleW = {};
  function titleWidth(year){
    if (_titleW[year]) return _titleW[year];
    try {
      var probe = document.createElement('div');
      probe.className = 'mcal-title';
      probe.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;';
      _overlay.appendChild(probe);
      var w = 0;
      MONTH_LOWER.forEach(function(m){ probe.textContent = titleCase(m) + ' ' + year; w = Math.max(w, probe.offsetWidth + 1); }); // layout width: unaffected by the open animation's scale
      probe.remove();
      // Measured before the web font arrived: do not keep that number.
      if (w && (!document.fonts || document.fonts.status === 'loaded')) _titleW[year] = Math.ceil(w);
      return Math.ceil(w);
    } catch (_e) { return 0; }
  }

  function render(month){
    var months = _viewMode === 'abs' ? absMonths() : allMonths();
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

    // Same icon as the dock's Kalendārs button, in the chosen icon set.
    function headIcon() {
      var icon = '';
      try { if (window.parent !== window && window.parent.__mkDockIcon) icon = window.parent.__mkDockIcon('monthCalDocBtn'); } catch (_e) {}
      return icon ? '<span class="mcal-headicon" aria-hidden="true">' + icon + '</span>' : '';
    }
    var stepName = _viewMode === 'week' ? 'nedēļa' : 'mēnesis';
    // Title, arrows, view tabs, then the week range; the rest on the right.
    // The title keeps the width of the longest month name (titleWidth), so
    // the arrows stay under the pointer while paging through months.
    var head = '<div class="mcal-head">'
      + headIcon()
      + '<div class="mcal-titles"><div class="mcal-title" style="min-width:' + titleWidth(p.year) + 'px">' + esc(titleCase(month)) + '</div></div>'
      + '<div class="mcal-nav">'
      + '<button class="mcal-icbtn mcal-navbtn" data-go="-1" aria-label="Iepriekšējā ' + stepName + '"' + (prevDis ? ' disabled' : '') + '>' + ICON.prev + '</button>'
      + '<button class="mcal-icbtn mcal-navbtn" data-go="1" aria-label="Nākamā ' + stepName + '"' + (nextDis ? ' disabled' : '') + '>' + ICON.next + '</button>'
      + '</div>'
      + '<div class="mcal-seg" role="group" aria-label="Skats">'
      + '<button data-view="month" class="' + (_viewMode === 'month' ? 'is-on' : '') + '" aria-pressed="' + (_viewMode === 'month') + '">Mēnesis</button>'
      + '<button data-view="week" class="' + (_viewMode === 'week' ? 'is-on' : '') + '" aria-pressed="' + (_viewMode === 'week') + '">Nedēļa</button>'
      + '<button data-view="abs" class="' + (_viewMode === 'abs' ? 'is-on' : '') + '" aria-pressed="' + (_viewMode === 'abs') + '">Prombūtnes</button>'
      + (IS_RAD ? '<button data-view="rgv" class="' + (_viewMode === 'rgv' ? 'is-on' : '') + '" aria-pressed="' + (_viewMode === 'rgv') + '">Radiogrāferi</button>' : '')
      + '</div>'
      + (_viewMode === 'week' && p.idx != null ? '<div class="mcal-sub">' + esc(weekRange(p, _weekIdx)) + '</div>' : '')
      + '<div class="mcal-actions">'
      + (_viewMode === 'abs' ? ''
        : '<div class="mcal-legend" aria-label="Maiņu veidi"><span class="mcal-hk is-allday">Diennakts</span><span class="mcal-hk is-day">Diena</span><span class="mcal-hk is-night">Nakts</span></div>')
      + (IS_RAD ? '' : '<button class="mcal-actbtn" data-panel="bday">Dzimšanas dienas</button>')
      + '<button class="mcal-actbtn" data-panel="holi">Svētku dienas</button>'
      + '<button class="mcal-icbtn mcal-close" aria-label="Aizvērt">' + ICON.close + '</button>'
      + '</div>'
      // Absence filters get their own line, so the top line stays as in
      // the other views with the close button in the corner.
      + (_viewMode === 'abs' ? absFilters() : '')
      + '</div>';
    // The view tabs stay the same element across renders: a new element would
    // show the new tab's colours for a frame before the pill arrives.
    // The header is updated in place: unchanged parts are kept and the view
    // tabs never leave the page. (A node taken out and put back loses its
    // previous style, so its colours would snap instead of easing.)
    var inner = _overlay.querySelector('.mcal-inner');
    var body = _viewMode === 'abs' ? buildAbsences(month) : buildGrid(month);
    var oldHead = inner.querySelector(':scope > .mcal-head');
    var oldSeg = oldHead && oldHead.querySelector(':scope > .mcal-seg');
    if (!oldHead || !oldSeg){
      inner.innerHTML = head + body;
    } else {
      var tmp = document.createElement('div');
      tmp.innerHTML = head;
      var fresh = Array.prototype.slice.call(tmp.firstChild.children);
      var keep = {};
      Array.prototype.forEach.call(oldHead.children, function(c){ if (c !== oldSeg) keep[c.outerHTML] = c; });
      var nodes = fresh.map(function(c){
        if (c.classList.contains('mcal-seg')) return oldSeg;
        var same = keep[c.outerHTML];
        if (same){ delete keep[c.outerHTML]; return same; }
        return c;
      });
      Object.keys(keep).forEach(function(k){ keep[k].remove(); });
      // Everything is placed around the tabs, which stay where they are.
      var at = nodes.indexOf(oldSeg);
      nodes.forEach(function(n, i){
        if (i < at) oldHead.insertBefore(n, oldSeg);
        else if (i > at) oldHead.appendChild(n);
      });
      Array.prototype.forEach.call(oldSeg.querySelectorAll('button[data-view]'), function(b){
        var on = b.getAttribute('data-view') === _viewMode;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      while (oldHead.nextSibling) oldHead.nextSibling.remove();
      oldHead.insertAdjacentHTML('afterend', body);
    }
    if (_viewFrom){ var from = _viewFrom; _viewFrom = null; viewMotion(from); }
    scheduleFit();
  }

  // Tab switch (js/mk-motion.js, same pill as the card window): only the
  // selected pill slides to the new tab on springs; the view itself swaps
  // at once (a fade from nothing reads as a flash). Plain when motion is off.
  function viewMotion(from){
    var MM = window.MinkaMotion;
    var seg = _overlay.querySelector('.mcal-seg');
    if (!MM || !MM.liquid || !seg || from === _viewMode) return;
    var prevBtn = seg.querySelector('[data-view="' + from + '"]'), nextBtn = seg.querySelector('[data-view="' + _viewMode + '"]');
    var pill = seg.querySelector('.mcal-segpill');
    if (!pill){
      pill = document.createElement('span');
      pill.className = 'mcal-segpill';
      pill.setAttribute('aria-hidden', 'true');
      seg.prepend(pill);
    }
    if (MM.liquid(pill, seg, nextBtn, { from: prevBtn, animate: true })) seg.classList.add('has-pill');
    else { pill.remove(); seg.classList.remove('has-pill'); }
  }

  // ---- panels -----------------------------------------------------------
  // The dialogs grow out of the button that opens them and return into it
  // (MinkaMotion container transform, like every other window).
  var _panelType = null;
  function panelButton(type){ return _overlay && _overlay.querySelector('.mcal-actbtn[data-panel="' + type + '"]'); }
  function openPanel(type){
    var wrap = _overlay && _overlay.querySelector('.mcal-panelwrap');
    if (!wrap) return;
    var reopen = wrap.classList.contains('is-open');
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
    wrap.innerHTML = '<div class="mcal-scrim"></div>' + html;
    wrap.classList.add('is-open');
    _panelType = type;
    var MM = window.MinkaMotion;
    if (MM && MM.openSurface && !reopen) MM.openSurface(wrap.querySelector('.mcal-panel'), { key: 'mcal-panel', origin: panelButton(type), scrim: wrap.querySelector('.mcal-scrim') });
  }
  function closePanel(instant){
    var w = _overlay && _overlay.querySelector('.mcal-panelwrap');
    if (!w || !w.classList.contains('is-open')) return;
    var panel = w.querySelector('.mcal-panel'), MM = window.MinkaMotion, type = _panelType;
    _panelType = null;
    var hide = function(){ if (!_panelType){ w.classList.remove('is-open'); w.innerHTML = ''; } };
    if (instant || !MM || !MM.closeSurface || !panel){ hide(); return; }
    w.style.pointerEvents = 'none';
    MM.closeSurface(panel, { key: 'mcal-panel', origin: panelButton(type), scrim: w.querySelector('.mcal-scrim') }, function(){ w.style.pointerEvents = ''; hide(); });
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
      if (t.classList && (t.classList.contains('mcal-panelwrap') || t.classList.contains('mcal-scrim'))){ closePanel(); return; }
      if (t.closest && t.closest('.mcal-panel')){ return; } // clicks inside panel: ignore

      if (t.closest && t.closest('.mcal-close')){ close(); return; }

      var abf = t.closest && t.closest('.mcal-abf');
      if (abf){
        var g = abf.getAttribute('data-abg');
        if (_absOff[g]) delete _absOff[g]; else _absOff[g] = 1;
        saveAbsOff();
        // Chip and rows change in place: the chip eases to its new state.
        abf.setAttribute('aria-pressed', String(!_absOff[g]));
        var sw = _overlay.querySelector('.mcal-absw'), top = sw ? sw.scrollTop : 0;
        if (sw){ var tmp = document.createElement('div'); tmp.innerHTML = buildAbsences(_curMonth); sw.replaceWith(tmp.firstChild); var nsw = _overlay.querySelector('.mcal-absw'); if (nsw) nsw.scrollTop = top; }
        return;
      }

      var act = t.closest && t.closest('.mcal-actbtn');
      if (act){ openPanel(act.getAttribute('data-panel')); return; }

      var dayCell = t.closest && t.closest('.mcal-cell[data-day]');
      if (dayCell && _viewMode === 'month'){
        var day = parseInt(dayCell.getAttribute('data-day'), 10);
        var dayMonth = monthParts(_curMonth);
        if (day > 0 && dayMonth.idx != null){
          _weekIdx = weekOfDay(dayMonth, day);
          _viewFrom = _viewMode;
          _viewMode = 'week';
          render(_curMonth);
        }
        return;
      }

      var seg = t.closest && t.closest('.mcal-seg button');
      if (seg){
        var v = seg.getAttribute('data-view');
        if (v && v !== _viewMode){
          _viewFrom = _viewMode;
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
        var months = _viewMode === 'abs' ? absMonths() : allMonths(), i = months.indexOf(_curMonth), step = parseInt(go.getAttribute('data-go'), 10);
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
    if (!wasOpen) loadAbsences();
    if (MM && !wasOpen) MM.openSurface(_overlay, { key: 'monthcal', origin: _origin });
    notifyParent(true);
  }
  function close(){
    if (_overlay){
      var wasOpen = _overlay.classList.contains('is-open');
      closePanel(true);
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
  function closeBdayPop(instant){
    if (_bdayPopEl){
      var pop = _bdayPopEl, MM = window.MinkaMotion;
      _bdayPopEl = null;
      document.removeEventListener('pointerdown', bdayPopOutside, true);
      if (!instant && MM && MM.closeSurface){
        pop.style.pointerEvents = 'none';
        MM.closeSurface(pop, { key: 'mk-bday-pop', origin: document.getElementById('mkBdayBadge') }, function(){ pop.remove(); });
      } else pop.remove();
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
    if (window.MinkaMotion && window.MinkaMotion.openSurface) window.MinkaMotion.openSurface(pop, { key: 'mk-bday-pop', origin: btn });
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
    if (IS_RAD) return;                     // no birthday badge in /rad
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
