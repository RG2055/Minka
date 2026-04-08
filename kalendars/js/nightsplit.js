/* NAKTS SADALÄªTÄ€JS v3 â€” timeline bar design with fatigue mini-graphs */
(function(){
  var END=[{h:7,m:20,l:'07:20'},{h:7,m:30,l:'07:30'},{h:8,m:0,l:'08:00'}];
  var START=[{v:0,l:'00:00'},{v:23,l:'23:00'},{v:23.5,l:'23:30'}];
  // 8 hues, each ~45Â° apart on colour wheel â€” guaranteed visually distinct
  var COL=[
    {bg:'rgba(255,140,0,0.20)',   border:'rgba(255,165,50,0.60)',  accent:'#ffa032',glow:'rgba(255,160,50,0.35)'},  // 0 orange
    {bg:'rgba(0,170,255,0.18)',   border:'rgba(30,200,255,0.60)',  accent:'#1ec8ff',glow:'rgba(0,200,255,0.30)'},   // 1 cyan
    {bg:'rgba(160,0,255,0.18)',   border:'rgba(190,80,255,0.60)',  accent:'#be50ff',glow:'rgba(190,80,255,0.30)'},  // 2 violet
    {bg:'rgba(0,220,80,0.18)',    border:'rgba(0,240,100,0.60)',   accent:'#00f064',glow:'rgba(0,230,100,0.30)'},   // 3 green
    {bg:'rgba(255,30,90,0.18)',   border:'rgba(255,60,110,0.60)',  accent:'#ff3c6e',glow:'rgba(255,60,110,0.30)'},  // 4 red-pink
    {bg:'rgba(240,210,0,0.18)',   border:'rgba(255,230,40,0.60)',  accent:'#ffe628',glow:'rgba(255,220,40,0.30)'},  // 5 yellow
    {bg:'rgba(0,210,190,0.18)',   border:'rgba(0,235,215,0.60)',   accent:'#00ebd7',glow:'rgba(0,225,200,0.30)'},   // 6 teal
    {bg:'rgba(255,80,200,0.18)',  border:'rgba(255,110,220,0.60)', accent:'#ff6edc',glow:'rgba(255,100,210,0.30)'}  // 7 pink
  ];
  // Hash full name to colour index â€” SAME person always gets SAME colour, no duplicates
  function _nameHash(name){
    var s=String(name||'').trim().toUpperCase(), h=0;
    for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))&0x7fffffff;
    return h;
  }
  // Track which hash-slots are used in current render to guarantee no duplicate colours per session
  var _usedHashes={};
  function getCol(name){
    var key=String(name||'').trim().toUpperCase();
    if(!_usedHashes[key]){
      var base=_nameHash(key)%COL.length;
      // Find next free slot if this one is taken
      var used=Object.values(_usedHashes).map(function(v){return v.idx;});
      var idx=base;
      for(var tries=0;tries<COL.length;tries++){
        if(used.indexOf(idx)===-1)break;
        idx=(idx+1)%COL.length;
      }
      _usedHashes[key]={idx:idx,col:COL[idx]};
    }
    return _usedHashes[key].col;
  }
  // Reset used-colours each time a new day is selected (called from update())
  function resetColours(){_usedHashes={};}
  var st=null;
  var _actx=null;
  var NS_STORE_KEY='minkaNightSplitByDateV1';
  var NS_ROOM_LEGACY_STORE_KEY='minkaNightRoomByDateV1';
  var NS_ROOM_KEY_PREFIX='nsrooms::';
  var NS_ROOM_API_PATH='/api/ns-rooms';
  var ROOM_BED_KEYS=['main_left_top','main_left_bottom','main_right_top','nmp_center'];
  var _roomBc=null;
  var _roomPolling=false;
  try{ _roomBc = new BroadcastChannel('minka-ns-rooms-sync'); }catch(_e){}

  function activeDateKey(){
    return String(window.__activeDateStr || window.__todayDateStr || '').trim();
  }
  function loadSavedMap(){
    try{
      var raw = localStorage.getItem(NS_STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed==='object') ? parsed : {};
    }catch(e){ return {}; }
  }
  function saveSavedMap(map){
    try{ localStorage.setItem(NS_STORE_KEY, JSON.stringify(map||{})); }catch(e){}
  }
  function roomStorageKey(dateKey){
    dateKey=String(dateKey||'').trim();
    return dateKey ? (NS_ROOM_KEY_PREFIX + dateKey) : '';
  }
  function loadLegacyRoomSavedMap(){
    try{
      var raw = localStorage.getItem(NS_ROOM_LEGACY_STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed==='object') ? parsed : {};
    }catch(e){ return {}; }
  }
  function loadRoomSavedState(dateKey){
    try{
      var key=roomStorageKey(dateKey);
      if(key){
        var raw=localStorage.getItem(key);
        if(raw){
          var parsed=JSON.parse(raw);
          if(parsed && typeof parsed==='object') return parsed;
        }
      }
    }catch(e){}
    try{
      var legacy=loadLegacyRoomSavedMap()[String(dateKey||'').trim()];
      return (legacy && typeof legacy==='object') ? legacy : null;
    }catch(e){ return null; }
  }
  function saveRoomSavedState(dateKey, data){
    try{
      var key=roomStorageKey(dateKey);
      if(!key || !data || typeof data!=='object') return;
      localStorage.setItem(key, JSON.stringify(data));
    }catch(e){}
  }
  function roomBedsToOrder(beds, names){
    var next=new Array(4).fill('');
    var valid={};
    (names||[]).forEach(function(n){ if(n) valid[n]=true; });
    if(beds && typeof beds==='object'){
      ROOM_BED_KEYS.forEach(function(key, idx){
        var name=String((beds[key]||'')).trim();
        if(name && valid[name] && next.indexOf(name)===-1) next[idx]=name;
      });
    }
    var remaining=(names||[]).filter(function(n){ return next.indexOf(n)===-1; });
    for(var i=0;i<next.length && remaining.length;i++){
      if(!next[i]) next[i]=remaining.shift();
    }
    return next.slice(0,4);
  }
  function orderToRoomBeds(order){
    var beds={};
    ROOM_BED_KEYS.forEach(function(key, idx){
      var name=String(((order||[])[idx]||'')).trim();
      if(name) beds[key]=name;
    });
    return beds;
  }
  function getRoomOrder(slots){
    var names=(slots||[]).map(function(s){ return String((s && s.w && s.w.name) || '').trim(); }).filter(Boolean);
    var dk=activeDateKey();
    var saved=dk ? loadRoomSavedState(dk) : null;
    if(!saved) return names.slice(0,4);
    if(saved.beds && typeof saved.beds==='object'){
      return roomBedsToOrder(saved.beds, names);
    }
    if(Array.isArray(saved.order) && saved.order.length){
      return roomBedsToOrder(orderToRoomBeds(saved.order), names);
    }
    return names.slice(0,4);
  }
  function saveRoomOrder(order){
    try{
      var dk=activeDateKey();
      if(!dk || !Array.isArray(order)) return;
      var payload={
        date: dk,
        beds: orderToRoomBeds(order.slice(0,4)),
        savedAt: Date.now()
      };
      saveRoomSavedState(dk, payload);
      pushRoomState(dk);
    }catch(e){}
  }
  function activeRoomApi(){
    return (window.MinkaApi && typeof window.MinkaApi.apiFetch==='function' && window.MinkaApi.getToken())
      ? window.MinkaApi
      : null;
  }
  function normalizeRoomPayload(data, dateStr){
    if(!data || typeof data!=='object') return null;
    var beds=(data.beds && typeof data.beds==='object') ? data.beds : null;
    if(!beds && Array.isArray(data.order)) beds=orderToRoomBeds(data.order);
    if(!beds) return null;
    var normalizedBeds={};
    ROOM_BED_KEYS.forEach(function(key){
      var name=String((beds[key]||'')).trim();
      if(name) normalizedBeds[key]=name;
    });
    return {
      date: String(dateStr||data.date||'').trim(),
      beds: normalizedBeds,
      savedAt: data.savedAt || Date.now()
    };
  }
  function pushRoomState(dateStr){
    var api=activeRoomApi();
    if(!api || !dateStr) return;
    try{
      var payload=normalizeRoomPayload(loadRoomSavedState(dateStr), dateStr);
      if(!payload || !payload.date) return;
      api.apiFetch(NS_ROOM_API_PATH, { method:'POST', json: payload }).catch(function(){});
      if(_roomBc) try{ _roomBc.postMessage(payload); }catch(_e){}
    }catch(e){}
  }
  function pullRoomState(dateStr, cb){
    var api=activeRoomApi();
    if(!api || !dateStr) return;
    api.apiFetch(NS_ROOM_API_PATH + '?date=' + encodeURIComponent(dateStr))
      .then(function(r){ return r.json(); })
      .then(function(remote){
        var payload=normalizeRoomPayload(remote, dateStr);
        if(!payload || !payload.date || !payload.beds) return;
        var local=loadRoomSavedState(dateStr);
        if(!local || !local.savedAt || (payload.savedAt && payload.savedAt > local.savedAt)){
          saveRoomSavedState(dateStr, payload);
          if(cb) cb(payload);
        }
      }).catch(function(){});
  }
  function startRoomPolling(){
    if(_roomPolling) return;
    _roomPolling=true;
    if(_roomBc){
      _roomBc.onmessage=function(evt){
        try{
          var payload=normalizeRoomPayload(evt.data, evt.data && evt.data.date);
          if(!payload || !payload.date) return;
          var local=loadRoomSavedState(payload.date);
          if(!local || !local.savedAt || (payload.savedAt && payload.savedAt > local.savedAt)){
            saveRoomSavedState(payload.date, payload);
            if(payload.date===activeDateKey()){
              try{ render(); }catch(_e){}
            }
          }
        }catch(_e){}
      };
    }
    var d0=activeDateKey();
    if(d0) pullRoomState(d0, function(){ if(d0===activeDateKey()) render(); });
    setInterval(function(){
      var d=activeDateKey();
      if(d) pullRoomState(d, function(){ if(d===activeDateKey()) render(); });
    }, 45000);
  }
  function saveCurrentDayState(){
    try{
      if(!st || !st.sl || !st.sl.length) return;
      var dk = activeDateKey();
      if(!dk) return;
      var map = loadSavedMap();
      map[dk] = {
        sh: Number(st.sh||0),
        ei: Number(st.ei||0),
        order: st.sl.map(function(s){ return String((s && s.w && s.w.name) || '').trim(); }).filter(Boolean),
        savedAt: Date.now()
      };
      saveSavedMap(map);
      if(window.__nsKv) window.__nsKv.push(dk);
    }catch(e){}
  }
  function applySavedDayState(workers, fallbackSh, fallbackEi){
    var base = Array.isArray(workers) ? workers.slice() : [];
    var sorted = fat(base);
    var out = { workers: sorted, sh: fallbackSh, ei: fallbackEi };
    try{
      var dk = activeDateKey();
      if(!dk) return out;
      var saved = loadSavedMap()[dk];
      if(!saved || typeof saved!=='object') return out;
      out.sh = (typeof saved.sh === 'number' && isFinite(saved.sh)) ? saved.sh : fallbackSh;
      out.ei = (typeof saved.ei === 'number' && isFinite(saved.ei)) ? saved.ei : fallbackEi;
      // Apply saved order — same logic as getNightSplitPlan in calendar.js
      if(Array.isArray(saved.order) && saved.order.length){
        var byName={};
        sorted.forEach(function(w){ byName[String(w.name||'').trim()]=w; });
        var next=[];
        saved.order.forEach(function(name){
          name=String(name||'').trim();
          if(byName[name]){ next.push(byName[name]); delete byName[name]; }
        });
        Object.keys(byName).forEach(function(k){ next.push(byName[k]); });
        if(next.length===sorted.length) out.workers=next;
      }
      return out;
    }catch(e){ return out; }
  }

  // â”€â”€ Web Audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function actx(){if(!_actx)try{_actx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}return _actx;}
  function tone(freq,dur,type,vol){
    var c=actx();if(!c)return;
    try{
      var o=c.createOscillator(),g=c.createGain();
      o.connect(g);g.connect(c.destination);
      o.type=type||'triangle';o.frequency.value=freq;
      g.gain.setValueAtTime(0,c.currentTime);
      g.gain.linearRampToValueAtTime(vol||0.1,c.currentTime+0.01);
      g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
      o.start(c.currentTime);o.stop(c.currentTime+dur);
    }catch(e){}
  }
  function sndPickup(){ tone(220,0.09,'triangle',0.13); setTimeout(function(){tone(280,0.07,'triangle',0.07);},25); }
  function sndHover(){ tone(600,0.03,'sine',0.035); }
  function sndDrop(){ tone(240,0.13,'triangle',0.16); setTimeout(function(){tone(300,0.09,'triangle',0.09);},55); }
  function sndReorder(){ tone(420,0.07,'sine',0.06); setTimeout(function(){tone(530,0.1,'sine',0.08);},85); }
  function sndSnore(){
    tone(145,0.12,'sine',0.035);
    setTimeout(function(){ tone(120,0.18,'triangle',0.028); },90);
    setTimeout(function(){ tone(96,0.22,'sine',0.02); },210);
  }

  // â”€â”€ Utils â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function mt(m){m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  function fm(m){return mt(m);}
  function calc(wk,sh,ei){
    if(!wk||!wk.length)return[];
    var n=wk.length,eo=END[ei]||END[0],sm=Math.round(sh*60),em=eo.h*60+eo.m;
    if(sh>=20)em+=1440;
    // True equal split in minutes (no 5â€‘minute snapping). If total minutes do not divide
    // evenly, distribute the remainder from the beginning so the difference is <= 1 minute.
    var tot=em-sm,base=Math.floor(tot/n),rem=tot%n,slots=[],c=sm;
    for(var i=0;i<n;i++){
      var add=(i<rem?1:0);
      var e=c+base+add;
      if(i===n-1) e=em;
      slots.push({w:wk[i],s:c,e:e,ss:mt(c),es:mt(e),d:e-c});c=e;
    }return slots;
  }
  function fat(wk){
    return wk.map(function(w){
      var sc=50;
      if(window.__fatigue){var f=window.__fatigue.calculateFatigue(w.name);if(f)sc=f.score;}
      return Object.assign({},w,{fs:sc});
    }).sort(function(a,b){return b.fs-a.fs});
  }
  function getW(){
    // Get workers from BOTH radiographers store AND radiologists store
    var ds=window.__activeDateStr||'';if(!ds)return[];
    var f=[];
    var stores=[window.__grafiksStore]; // Nakts sadalÄ«jums: tikai radiogrÄferi
    stores.forEach(function(s){
      if(!s||typeof s!=='object')return;
      for(var mo in s){var days=s[mo];if(!Array.isArray(days))continue;
        for(var di=0;di<days.length;di++){var day=days[di];
          if(day.date!==ds||!Array.isArray(day.workers))continue;
          for(var wi=0;wi<day.workers.length;wi++){var w=day.workers[wi];
            var sh=String(w.shift||'').toUpperCase().trim();
            if(sh==='N'||sh.indexOf('A')>=0||sh==='B'||!sh||sh==='0')continue;
            var hrs=w.hours||parseInt(sh)||0;if(hrs<12)continue;
            var sH=w.startTime?parseInt(w.startTime.split(':')[0]):-1;
            var tp=String(w.type||'').toUpperCase();
            var night=hrs>=24||tp==='NAKTS'||tp==='DIENNAKTS';
            if(!night&&sH>=0&&(sH>=18||sH<=5))night=true;
            if(!night&&sH===-1&&hrs>=12)night=true;
            if(night&&!f.some(function(x){return x.name===w.name;}))f.push(w);
          }
        }
      }
    });
    return f;
  }

  // â”€â”€ Fatigue mini sparkline SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function sparkline(workerName, accentColor) {
    if(!window.__fatigue)return'';
    var hist=window.__fatigue.gatherWorkerHistory(workerName);
    if(!hist||hist.length<3)return'';
    var today=new Date(),scores=[];
    for(var i=13;i>=0;i--){
      var d=new Date(today);d.setDate(d.getDate()-i);
      var dow=d.getDay(),mo=dow===0?6:dow-1;
      var ws=new Date(d);ws.setDate(ws.getDate()-mo);
      var we=new Date(ws);we.setDate(we.getDate()+6);
      var wsh=hist.filter(function(e){return e.date>=ws&&e.date<=we;});
      var wh=wsh.reduce(function(s,e){return s+e.hours;},0);
      var wn=wsh.filter(function(e){return e.isNight;}).length;
      var sc=0;
      if(wh>=60)sc+=40;else if(wh>=48)sc+=20+Math.round((wh-48)/12*20);else sc+=Math.max(0,Math.round(wh/48*15));
      sc+=Math.min(18,wsh.length*3);
      sc+=Math.min(15,wn*5);
      sc=Math.max(0,Math.min(100,sc));
      scores.push(sc);
    }
    if(scores.length<2)return'';
    var W=80,H=28,pad=2;
    var mn=Math.min.apply(null,scores),mx=Math.max.apply(null,scores);
    if(mx===mn)mx=mn+1;
    var xp=function(i){return pad+(i/(scores.length-1))*(W-pad*2);};
    var yp=function(s){return H-pad-(s-mn)/(mx-mn)*(H-pad*2);};
    var pts=scores.map(function(s,i){return i===0?'M':'L'+xp(i).toFixed(1)+','+yp(s).toFixed(1);}).join(' ');
    // Rework as proper path
    var path='M '+xp(0).toFixed(1)+','+yp(scores[0]).toFixed(1);
    for(var j=1;j<scores.length;j++){
      var px=xp(j-1),cx=(px+xp(j))/2;
      path+=' C '+cx.toFixed(1)+','+yp(scores[j-1]).toFixed(1)+' '+cx.toFixed(1)+','+yp(scores[j]).toFixed(1)+' '+xp(j).toFixed(1)+','+yp(scores[j]).toFixed(1);
    }
    var area=path+' L '+xp(scores.length-1).toFixed(1)+','+(H-pad)+' L '+xp(0).toFixed(1)+','+(H-pad)+' Z';
    var gradId='spk'+workerName.replace(/\s+/g,'');
    return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block">'
      +'<defs><linearGradient id="'+gradId+'" x1="0" y1="0" x2="0" y2="1">'
      +'<stop offset="0%" stop-color="'+accentColor+'" stop-opacity="0.3"/>'
      +'<stop offset="100%" stop-color="'+accentColor+'" stop-opacity="0"/>'
      +'</linearGradient></defs>'
      +'<path d="'+area+'" fill="url(#'+gradId+')"/>'
      +'<path d="'+path+'" fill="none" stroke="'+accentColor+'" stroke-width="1.5" stroke-linecap="round"/>'
      +'</svg>';
  }

  // â”€â”€ Sort explanation in Latvian â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function sortReason(slots) {
    if(!slots||slots.length<2) return '';
    var highest=slots[0];
    var nm=function(w){return String(w.name||'').split(/\s+/)[0];};
    return '<div class="ns-reason" style="margin-top:8px;color:rgba(255,255,255,.72);font-size:11px;line-height:1.35">&#128161; <b style="color:#fff">'+nm(highest.w)+'</b> ielikts agr&#257;k, jo noguruma slodze ir augst&#257;ka un l&#299;dz r&#299;tam paliek vair&#257;k atp&#363;tas laika.</div>';
  }

  // â”€â”€ Timeline bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildTimeline(slots) {
    if(!slots||!slots.length) return '';
    var tot=slots[slots.length-1].e-slots[0].s;
    // Handles
    var handles='';
    for(var i=0;i<slots.length-1;i++){
      var pct=(slots[i].e-slots[0].s)/tot*100;
      handles+='<div class="ns-handle" style="left:'+pct.toFixed(2)+'%"><div class="ns-handle-pill"></div></div>';
    }
    // Segments
    var segs=slots.map(function(s,i){
      var pct=(s.d/tot*100).toFixed(2);
      var c=getCol(slots[i].w.name);
      return '<div class="ns-seg" style="flex:'+pct+';background:linear-gradient(135deg,'+c.bg+',rgba(255,255,255,0.04));border-color:'+c.border+'" data-i="'+i+'"></div>';
    }).join('');
    return '<div class="ns-timeline-wrap"><div class="ns-timeline">'+segs+handles+'</div></div>';
  }



  // â”€â”€ GLASSMORPHISM ANALOGUE CLOCK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var _nsClockRAF=null;
  function getGlobalNsArcTip(){
    try{
      var id='nsArcTipGlobal';
      var tip=document.getElementById(id);
      if(!tip){
        tip=document.createElement('div');
        tip.id=id;
        tip.className='ns-arc-tip ns-arc-tip-global';
        tip.setAttribute('aria-hidden','true');
        document.body.appendChild(tip);
      }
      tip.style.position='fixed';
      tip.style.display='flex';
      tip.style.opacity='0';
      tip.style.visibility='hidden';
      tip.style.pointerEvents='none';
      tip.style.zIndex='2147483647';
      tip.style.left='-9999px';
      tip.style.top='-9999px';
      tip.style.maxWidth='320px';
      tip.style.whiteSpace='normal';
      tip.style.willChange='transform, opacity, left, top';
      return tip;
    }catch(_e){ return null; }
  }
  function miniClock(slots){
    var slotDataEsc = '[]';
    try{
      slotDataEsc = JSON.stringify((slots||[]).map(function(s){
        return {
          nm:String((s.w&&s.w.name)||'').split(/\s+/)[0]||'â€”', fnm:String((s.w&&s.w.name)||'')||'â€”',
          ss:s.ss, es:s.es, h:Math.floor((s.d||0)/60), m:(s.d||0)%60,
          fs:(s.w&&s.w.fs)||0, accent:getCol((s.w&&s.w.name)||'').accent,
          s:Math.max(0,s.s||0), e:Math.max(0,s.e||0)
        };
      })).replace(/"/g,'&quot;');
    }catch(_e){}
    var cx=48, cy=48, r=43;
    function polar(aDeg, rr){ var rad=(aDeg-90)*Math.PI/180; return {x:cx+Math.cos(rad)*(rr||r), y:cy+Math.sin(rad)*(rr||r)}; }
    function mod(n,m){ return ((n % m) + m) % m; }
    // Draw segments on a real 12h clock ring (not fixed 00:00/240Â° timeline)
    function arcPathAbs(absStartMin, absEndMin){
      var dur = Math.max(0, (absEndMin||0) - (absStartMin||0));
      if(dur <= 0) return '';
      var sa = mod(absStartMin, 720) * 0.5; // 720 min => 360Â°
      var ea = mod(absEndMin,   720) * 0.5;
      if(ea <= sa && dur > 0) ea += 360; // wrap across 12 o'clock
      var rawSpan = ea - sa;
      var pad = Math.min(1.1, Math.max(0.15, rawSpan * 0.08));
      var s = sa + pad, e = ea - pad;
      if(e <= s){ s = sa; e = ea; if(e <= s) return ''; }
      var p1=polar(s,r), p2=polar(e,r), large=((e-s)>180)?1:0;
      return 'M '+p1.x.toFixed(2)+' '+p1.y.toFixed(2)+' A '+r+' '+r+' 0 '+large+' 1 '+p2.x.toFixed(2)+' '+p2.y.toFixed(2);
    }
    var segs='', hits='', lbls='';
    (slots||[]).forEach(function(s,i){
      var st = Number(s && s.s), en = Number(s && s.e);
      if(!isFinite(st) || !isFinite(en) || en <= st) return;
      var d=arcPathAbs(st,en); if(!d) return;
      var col=getCol((s.w&&s.w.name)||'').accent || ['#66d9ff','#a855f7','#ffae3d','#63f7b7'][i%4];
      var nm=String((s.w&&s.w.name)||'').split(/\s+/)[0]||'â€”';
      segs += '<path class="nsh-ringseg" d="'+d+'" stroke="'+col+'"></path>';
      hits += '<path class="nsh-hitseg nscw-arc-hit" data-wi="'+i+'" data-name="'+nm.replace(/"/g,'&quot;')+'" data-time="'+String((s.ss||'')+'â€“'+(s.es||'')).replace(/"/g,'&quot;')+'" d="'+d+'"><title>'+nm+' '+String((s.ss||'')+'â€“'+(s.es||''))+'</title></path>';
      try{
        var saMid = mod(st, 720) * 0.5;
        var eaMid = mod(en, 720) * 0.5;
        if(eaMid <= saMid) eaMid += 360;
        var ma = (saMid + eaMid) / 2;
        var lp = polar(ma, r + 6.5);
        var initials = (String((s.w&&s.w.name)||'').trim().split(/\s+/).slice(0,2).map(function(w){return (w||'').charAt(0).toUpperCase();}).join('') || nm.slice(0,2).toUpperCase());
        if(false) lbls += '<g class="nsh-arc-label" transform="translate('+lp.x.toFixed(2)+' '+lp.y.toFixed(2)+')">'
          + '<circle r="6.8" fill="rgba(6,10,20,.78)" stroke="'+col+'" stroke-width="1.1"></circle>'
          + '<text text-anchor="middle" dominant-baseline="central" y="0.6" fill="#fff">'+initials.replace(/</g,'&lt;')+'</text>'
          + '</g>';
      }catch(_e){}
    });
    var ticks=''; for(var i=0;i<60;i++){ ticks += '<i class="nsh-tick'+(i%5===0?' major':'')+'" style="--a:'+(i*6)+'deg"></i>'; }
    var html=''
      +'<div class="ns-clock-wrap minka-orb-mini" data-slots="'+slotDataEsc+'">'
      +'<style>.minka-orb-mini{position:relative;display:inline-flex;align-items:center;justify-content:center;width:96px;height:96px}.minka-orb-mini .nsh-shell{position:relative;width:96px;height:96px;border-radius:50%}.minka-orb-mini .nsh-energy{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:#080a12}.minka-orb-mini .nsh-plasma{position:absolute;border-radius:50%;filter:blur(10px);opacity:.22;animation:nshFloat 13s ease-in-out infinite alternate}.minka-orb-mini .p1{width:44px;height:44px;background:#a855f7;left:-4px;top:4px}.minka-orb-mini .p2{width:38px;height:38px;background:#66d9ff;right:-4px;bottom:6px;animation-duration:10s}.minka-orb-mini .p3{width:34px;height:34px;background:#63f7b7;left:24px;bottom:-5px;animation-duration:16s}@keyframes nshFloat{to{transform:translate(10px,7px) scale(1.2)}}.minka-orb-mini .nscw-outer{position:absolute;inset:0;width:96px;height:96px;transform:scale(1);outline:none!important;-webkit-tap-highlight-color:transparent;transform-origin:center center;background:none!important;border:none!important;box-shadow:none!important;border-radius:0!important;cursor:default!important;transition:transform .18s ease, filter .18s ease!important;overflow:visible!important;z-index:5}.minka-orb-mini .nsh-core,.minka-orb-mini .nsh-reflect,.minka-orb-mini .nsh-face{pointer-events:none}.minka-orb-mini .nsh-core{z-index:2}.minka-orb-mini .nsh-reflect{z-index:3}.minka-orb-mini .nsh-face{z-index:4}.minka-orb-mini:hover .nscw-outer{transform:scale(1.08)!important;box-shadow:none!important;filter:drop-shadow(0 0 8px rgba(102,217,255,.18))}@media (hover:none),(pointer:coarse){.minka-orb-mini:hover .nscw-outer{transform:scale(1)!important;filter:none!important}}.minka-orb-mini .nscw-outer:focus,.minka-orb-mini .nscw-outer:focus-visible,.minka-orb-mini .nsh-hitseg:focus,.minka-orb-mini .nsh-hitseg:focus-visible{outline:none!important;box-shadow:none!important}.minka-orb-mini svg *::selection{background:transparent}.minka-orb-mini .nsh-ringtrack{fill:none;stroke:rgba(255,255,255,.07);stroke-width:7}.minka-orb-mini .nsh-ringseg{fill:none;stroke-width:6;stroke-linecap:round;filter:drop-shadow(0 0 4px rgba(255,255,255,.12))}.minka-orb-mini .nsh-hitseg{fill:none;stroke:rgba(255,255,255,.02);stroke-width:22;stroke-linecap:round;pointer-events:stroke;cursor:pointer}.minka-orb-mini .nsh-arc-label{pointer-events:none}.minka-orb-mini .nsh-arc-label text{font:700 4.6px/1 Inter,system-ui,sans-serif;letter-spacing:.2px;paint-order:stroke;stroke:rgba(3,5,10,.7);stroke-width:.7px}.minka-orb-mini .nsh-core{position:absolute;inset:6px;border-radius:50%;background:rgba(5,8,16,.38);backdrop-filter:blur(6px) saturate(130%);border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 8px 18px rgba(0,0,0,.35)}.minka-orb-mini .nsh-reflect{position:absolute;inset:5px;border-radius:50%;background:radial-gradient(circle at 28% 22%, rgba(255,255,255,.12), transparent 45%);pointer-events:none}.minka-orb-mini .nsh-face{position:absolute;inset:6px}.minka-orb-mini .nsh-ticks{position:absolute;inset:0}.minka-orb-mini .nsh-tick{position:absolute;left:50%;top:50%;width:1px;height:100%;transform-origin:50% 50%;transform:translate(-50%,-50%) rotate(var(--a))}.minka-orb-mini .nsh-tick::before{content:"";display:block;margin:6px auto 0;border-radius:2px;width:1px;height:3px;background:rgba(255,255,255,.24)}.minka-orb-mini .nsh-tick.major::before{width:2px;height:5px;background:rgba(255,255,255,.62)}.minka-orb-mini .nsh-num{position:absolute;color:rgba(255,255,255,.92);font:700 7px/1 Inter,system-ui,sans-serif;text-shadow:0 1px 6px rgba(0,0,0,.5)}.minka-orb-mini .n12{top:5px;left:50%;transform:translateX(-50%)}.minka-orb-mini .n3{right:6px;top:50%;transform:translateY(-50%)}.minka-orb-mini .n6{bottom:5px;left:50%;transform:translateX(-50%)}.minka-orb-mini .n9{left:6px;top:50%;transform:translateY(-50%)}.minka-orb-mini .nsh-hw{position:absolute;inset:0;transform-origin:50% 50%}.minka-orb-mini .nsh-hand{position:absolute;left:50%;transform:translateX(-50%);border-radius:99px}.minka-orb-mini .hour{top:22px;width:3px;height:18px;background:linear-gradient(#fff,#dfe8ff)}.minka-orb-mini .min{top:13px;width:2px;height:27px;background:linear-gradient(#fff,#c7d6ff)}.minka-orb-mini .sec{top:10px;width:1px;height:31px;background:#7ef89a;box-shadow:0 0 6px rgba(126,248,154,.6)}.minka-orb-mini .nsh-pin{position:absolute;left:50%;top:50%;width:7px;height:7px;transform:translate(-50%,-50%);border-radius:50%;background:#fff;border:1.5px solid #7ef89a;box-shadow:0 0 7px rgba(126,248,154,.3);z-index:2}.minka-orb-mini .nsh-catPivot{position:absolute;inset:0;pointer-events:none;z-index:0}.minka-orb-mini .nsh-cat{position:absolute;left:50%;top:50%;width:18px;height:18px;transform:translate(-50%,-50%) translateY(0);transition:transform .65s cubic-bezier(.34,1.56,.64,1),opacity .2s;opacity:.95}.minka-orb-mini .nsh-ear{position:absolute;top:2px;width:5px;height:6px;background:#0f121d;clip-path:polygon(50% 0,0 100%,100% 100%);border:1px solid rgba(255,255,255,.08)}.minka-orb-mini .nsh-ear.l{left:3px;transform:rotate(-14deg)}.minka-orb-mini .nsh-ear.r{right:3px;transform:rotate(14deg)}.minka-orb-mini .nsh-facecat{position:absolute;left:50%;top:5px;transform:translateX(-50%);width:12px;height:9px;background:#0f121d;border:1px solid rgba(255,255,255,.08);border-radius:6px 6px 5px 5px}.minka-orb-mini .nsh-eye{position:absolute;top:2px;width:2px;height:2px;border-radius:50%;background:#7ef89a;box-shadow:0 0 4px rgba(126,248,154,.8)}.minka-orb-mini .nsh-eye.l{left:2px}.minka-orb-mini .nsh-eye.r{right:2px}.minka-orb-mini .nsh-smirk{position:absolute;left:50%;bottom:1px;transform:translateX(-50%);width:4px;height:2px;border-bottom:1px solid #7ef89a;border-right:1px solid #7ef89a;border-radius:0 0 4px 0;opacity:.95}</style>'
      +'<div class="nsh-shell" title="Nakts sadalÄ«juma pulkstenis"><div class="nsh-catPivot"><div class="nsh-cat"><div class="nsh-ear l"></div><div class="nsh-ear r"></div><div class="nsh-facecat"><div class="nsh-eye l"></div><div class="nsh-eye r"></div><div class="nsh-smirk"></div></div></div></div><div class="nsh-energy"><div class="nsh-plasma p1"></div><div class="nsh-plasma p2"></div><div class="nsh-plasma p3"></div></div><svg viewBox="0 0 96 96" class="nscw-outer" aria-label="Nakts sadalÄ«juma pulkstenis" tabindex="-1" focusable="false"><circle cx="48" cy="48" r="43" class="nsh-ringtrack"/>'+segs+hits+lbls+'</svg><div class="nsh-core"></div><div class="nsh-reflect"></div><div class="nsh-face"><div class="nsh-ticks">'+ticks+'</div><div class="nsh-num n12">12</div><div class="nsh-num n3">3</div><div class="nsh-num n6">6</div><div class="nsh-num n9">9</div><div class="nsh-hw nsh-h"><div class="nsh-hand hour"></div></div><div class="nsh-hw nsh-m"><div class="nsh-hand min"></div></div><div class="nsh-hw nsh-s"><div class="nsh-hand sec"></div></div><div class="nsh-pin"></div></div></div><div class="ns-clock-tooltip" style="display:none"></div><div class="ns-arc-tip" style="display:none"></div></div>';
    return html;
  }

  function initMiniOrbClock(clockWrap){
    if(!clockWrap || clockWrap.__minkaOrbInit) return;
    clockWrap.__minkaOrbInit = 1;
    try{ clockWrap.querySelectorAll('.nsh-hitseg').forEach(function(p){ p.style.pointerEvents='stroke'; p.style.cursor='pointer'; }); }catch(e){}
    var H=clockWrap.querySelector('.nsh-h'), M=clockWrap.querySelector('.nsh-m'), S=clockWrap.querySelector('.nsh-s');
    var catPivot=clockWrap.querySelector('.nsh-catPivot'), cat=clockWrap.querySelector('.nsh-cat');
    function loop(){
      if(!document.body.contains(clockWrap)) return;
      var n=new Date(), ms=n.getMilliseconds(), ss=n.getSeconds()+ms/1000, mm=n.getMinutes()+ss/60, hh=(n.getHours()%12)+mm/60;
      if(S) S.style.transform='rotate('+(ss*6)+'deg)';
      if(M) M.style.transform='rotate('+(mm*6)+'deg)';
      if(H) H.style.transform='rotate('+(hh*30)+'deg)';
      requestAnimationFrame(loop);
    } requestAnimationFrame(loop);
    if(catPivot && cat && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      (function peek(){ var ang=160+Math.random()*40; catPivot.style.transform='rotate('+ang+'deg)'; setTimeout(function(){cat.style.transform='translate(-50%,-50%) translateY(-40px)';},60); setTimeout(function(){cat.style.transform='translate(-50%,-50%) translateY(0)';},1100+Math.random()*700); setTimeout(peek,3600+Math.random()*3800); })();
    }
  }



  function fatigueTrend(workerName){
    if(!window.__fatigue || typeof window.__fatigue.gatherWorkerHistory !== 'function') return {icon:'&rarr;', cls:'flat', label:'Stabils'};
    var hist = window.__fatigue.gatherWorkerHistory(workerName);
    if(!hist || !hist.length) return {icon:'&rarr;', cls:'flat', label:'Stabils'};
    var now = new Date();
    var recent = 0, prev = 0;
    hist.forEach(function(e){
      var d = e && e.date instanceof Date ? e.date : new Date(e.date);
      if(!(d instanceof Date) || isNaN(d)) return;
      var days = Math.floor((now - d) / 86400000);
      var hrs = Number(e.hours || 0) || 0;
      var weight = hrs + ((e.isNight || e.type === 'NAKTS' || e.type === 'DIENNAKTS') ? 4 : 0);
      if(days >= 0 && days < 7) recent += weight;
      else if(days >= 7 && days < 14) prev += weight;
    });
    var delta = recent - prev;
    if(delta > 4) return {icon:'&nearr;', cls:'up', label:'K&#257;pj'};
    if(delta < -4) return {icon:'&searr;', cls:'down', label:'Kr&#299;t'};
    return {icon:'&rarr;', cls:'flat', label:'Stabils'};
  }

  function slotRealtime(slot){
    var today = (window.__activeDateStr && window.__todayDateStr && window.__activeDateStr === window.__todayDateStr);
    // Latvian status labels (requested)
    var TXT_ACTIVE = 'TAGAD';
    var TXT_NEXT   = 'NĀKAMĀ';
    var TXT_DONE   = 'BEIGTS';
    if(!today || !slot) return {status:TXT_NEXT, active:false, pct:0, left:'', label:''};
    var now = new Date();
    var cur = now.getHours()*60 + now.getMinutes();
    if(st && typeof st.sh === 'number' && st.sh >= 20 && cur < Math.round(st.sh*60)) cur += 1440;
    if(cur >= slot.s && cur < slot.e){
      var total = Math.max(1, slot.e - slot.s);
      var elapsed = Math.max(0, cur - slot.s);
      var leftMin = Math.max(0, slot.e - cur);
      var pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
      return {status:TXT_ACTIVE, active:true, pct:pct, left:fm(leftMin), label:'Atlikušais'};
    }
    if(cur >= slot.e) return {status:TXT_DONE, active:false, pct:100, left:'', label:''};
    return {status:TXT_NEXT, active:false, pct:0, left:'', label:''};
  }


  function escHtml(v){
    return String(v==null?"":v).replace(/[&<>"]/g,function(ch){
      return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':'&quot;';
    });
  }
  function lastSlotChecklist(i,total){
    if(i !== total - 1) return '';
    var note = 'Pirms pedejas dalas parliecinies par bolusa pieejamibu, oranzo maisu sagatavotibu un CT/RTG iekartu kalibracijas vai restarta statusu.';
    return '<div class="nsc-last-checklist" title="'+escHtml(note)+'" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">'
      + '<span style="display:inline-flex;justify-content:center;align-items:center;gap:4px;padding:4px 6px;border-radius:10px;background:rgba(59,130,246,.14);border:1px solid rgba(96,165,250,.35);color:#bfdbfe;font-size:10px;font-weight:700;line-height:1.05;text-align:center">&#128137; Bolus</span>'
      + '<span style="display:inline-flex;justify-content:center;align-items:center;gap:4px;padding:4px 6px;border-radius:10px;background:rgba(249,115,22,.14);border:1px solid rgba(251,146,60,.38);color:#fdba74;font-size:10px;font-weight:700;line-height:1.05;text-align:center">&#128999; Maisi</span>'
      + '<span style="display:inline-flex;justify-content:center;align-items:center;gap:4px;padding:4px 6px;border-radius:10px;background:rgba(244,63,94,.14);border:1px solid rgba(251,113,133,.36);color:#fda4af;font-size:10px;font-weight:700;line-height:1.05;text-align:center">&#9881; CT/RTG</span>'
      + '</div>';
  }

  function balancedOrder(workers){
    var arr=fat(Array.isArray(workers)?workers:[]);
    var out=[];
    var a=0,b=arr.length-1;
    while(a<=b){
      if(a<=b) out.push(arr[a++]);
      if(a<=b) out.push(arr[b--]);
    }
    return out;
  }

  function getStatusSlots(slots){
    var active=null,next=null,after=null;
    var today=(window.__activeDateStr && window.__todayDateStr && window.__activeDateStr===window.__todayDateStr);
    if(!slots||!slots.length) return {active:null,next:null,after:null};
    if(!today){
      return {active:null,next:slots[0]||null,after:slots[1]||null};
    }
    var now = new Date();
    var cur = now.getHours()*60 + now.getMinutes();
    if(st && typeof st.sh==='number' && st.sh >= 20 && cur < Math.round(st.sh*60)) cur += 1440;
    for(var i=0;i<slots.length;i++){
      var s=slots[i];
      if(cur >= s.s && cur < s.e){ active=s; next=slots[i+1]||null; after=slots[i+2]||null; break; }
      if(cur < s.s){ if(!next) next=s; else if(!after) { after=s; break; } }
    }
    if(!active && !next){ next=slots[0]||null; after=slots[1]||null; }
    return {active:active,next:next,after:after};
  }

  function getFlowLiveState(slots){
    if(!slots || !slots.length) return null;
    var now=new Date();
    var cur=now.getHours()*60 + now.getMinutes() + (now.getSeconds()/60);
    if(st && typeof st.sh==='number'){
      var startMin=Math.round(st.sh*60);
      if(st.sh >= 20 && cur < 12*60) cur += 1440;
      if(st.sh >= 20 && cur < startMin && now.getHours() >= 20) cur += 1440;
    }
    var start=slots[0].s;
    var end=slots[slots.length-1].e;
    if(cur < start || cur > end) return null;
    var tot=Math.max(1, end-start);
    return {
      now: cur,
      pct: Math.max(0, Math.min(100, ((cur-start)/tot)*100))
    };
  }

  function ensureNightSplitLiveStyles(){
    if(document.getElementById('nsLiveFlowStyles')) return;
    var style=document.createElement('style');
    style.id='nsLiveFlowStyles';
    style.textContent=''
      +'.ns-flow-bar{position:relative;overflow:visible}'
      +'.ns-flow-live{position:absolute;top:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:999px;background:#ff4d5f;border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 3px rgba(255,77,95,.15),0 0 16px rgba(255,77,95,.48),0 0 28px rgba(255,77,95,.28);pointer-events:none;z-index:7}'
      +'.ns-flow-live::before{content:\"\";position:absolute;left:50%;bottom:100%;transform:translate(-50%,-4px);width:2px;height:10px;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.1));opacity:.9}'
      +'.ns-flow-live::after{content:\"\";position:absolute;inset:-5px;border-radius:inherit;border:1px solid rgba(255,255,255,.18);animation:nsFlowLivePulse 1.8s ease-out infinite}'
      +'@keyframes nsFlowLivePulse{0%{transform:scale(.72);opacity:.85}100%{transform:scale(1.55);opacity:0}}';
    document.head.appendChild(style);
  }

  function refreshFlowLiveMarker(){
    var bar=document.querySelector('#nsPanelContent .ns-flow-bar');
    if(!bar || !st || !st.sl || !st.sl.length) return;
    var dot=bar.querySelector('.ns-flow-live');
    if(!dot) return;
    var live=getFlowLiveState(st.sl);
    if(!live){
      dot.style.display='none';
      return;
    }
    dot.style.display='block';
    dot.style.left=live.pct.toFixed(3)+'%';
  }

  function buildFlowBar(slots){
    if(!slots||!slots.length) return '';
    var tot=Math.max(1, slots[slots.length-1].e-slots[0].s);
    var labels='<div class="ns-flow-labels">';
    labels += '<span>'+escHtml(slots[0].ss)+'</span>';
    for(var i=0;i<slots.length;i++){ labels += '<span>'+escHtml(slots[i].es)+'</span>'; }
    labels += '</div>';
    var segs=slots.map(function(s){
      var c=getCol(s.w.name);
      var rt=slotRealtime(s);
      var w=((s.d/tot)*100).toFixed(3);
      var nm=escHtml(String(s.w.name||'').split(/\s+/)[0]||'');
      return '<div class="ns-flow-seg'+(rt.active?' is-active':'')+'" style="width:'+w+'%;--seg:'+c.accent+'">'
        +'<div class="ns-flow-fill" style="background:'+c.accent+'"></div>'
        +(nm?'<span class="ns-flow-name">'+nm+'</span>':'')
        +(rt.active?'<div class="ns-flow-pulse" style="left:'+rt.pct.toFixed(1)+'%"></div>':'')
        +'</div>';
    }).join('');
    return '<div class="ns-flow-wrap"><div class="ns-flow-track">'+segs+'</div>'+labels+'</div>';
  }

  function stageCard(label, slot, kind){
    if(!slot) return '<div class="ns-stage ns-stage-'+kind+' is-empty"><div class="ns-stage-k">'+label+'</div><div class="ns-stage-empty">â€”</div></div>';
    var c=getCol(slot.w.name);
    var nm=escHtml(String(slot.w.name||'').split(/\s+/)[0]||'â€”');
    var rt=slotRealtime(slot);
    var dur=Math.floor(slot.d/60)+'h'+(((slot.d%60))?String(slot.d%60).padStart(2,'0')+'m':'');
    return '<div class="ns-stage ns-stage-'+kind+(rt.active?' is-live':'')+'" style="--stage:'+c.accent+'">'
      +'<div class="ns-stage-k">'+label+'</div>'
      +'<div class="ns-stage-name">'+nm+'</div>'
      +'<div class="ns-stage-time">'+escHtml(slot.ss)+' â€“ '+escHtml(slot.es)+'</div>'
      +'<div class="ns-stage-meta"><span>'+dur+'</span><span>âš¡'+(slot.w.fs||0)+'%</span></div>'
      +(rt.active?'<div class="ns-stage-progress"><span style="width:'+rt.pct.toFixed(1)+'%;background:'+c.accent+'"></span></div>':'')
      +'</div>';
  }

  function roomInitials(name){
    var parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return '—';
    if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase();
  }

  function roomNames(name){
    var parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    var main=(parts[0]||'Brīva').toUpperCase();
    var size='16px';
    if(main.length >= 11) size='9px';
    else if(main.length >= 10) size='9.5px';
    else if(main.length >= 9) size='10px';
    else if(main.length >= 8) size='10.5px';
    else if(main.length >= 7) size='11px';
    else if(main.length >= 6) size='12.5px';
    else if(main.length >= 5) size='14px';
    return {
      main: escHtml(main),
      sub: escHtml(parts.slice(1).join(' ')),
      size: size
    };
  }

  function roomEmoji(name){
    try{
      return window.MinkaEmoji && typeof window.MinkaEmoji.get === 'function'
        ? String(window.MinkaEmoji.get(String(name||'')) || '')
        : '';
    }catch(_e){ return ''; }
  }

  function roomDevices(slot){
    if(!slot || typeof slot._idx !== 'number' || !st || !Array.isArray(st.sl) || !st.sl.length) return '';
    var activeIdx = -1;
    try{
      var now = new Date();
      var cur = now.getHours()*60 + now.getMinutes();
      var firstStart = st.sl[0] ? st.sl[0].s : 0;
      if(firstStart >= 20*60 && cur < 12*60) cur += 1440;
      for(var ai=0; ai<st.sl.length; ai++){
        var sl = st.sl[ai];
        if(cur >= sl.s && cur < sl.e){ activeIdx = ai; break; }
      }
    }catch(_e){ activeIdx = -1; }
    var deviceIdx = activeIdx >= 0 ? activeIdx : 0;
    if(slot._idx !== deviceIdx) return '';
    var arr=['feature','smart','feature','smart'];
    return '<div class="ns-room-bed-devices" aria-hidden="true">'
      + arr.map(function(tp, idx){
          return '<span class="ns-room-device is-'+tp+' dev-'+idx+'"></span>';
        }).join('')
      + '</div>';
  }

  function roomBed(roomIdx, slot, posCls){
    if(!slot){
      return '<div class="ns-room-bed ns-room-bed-empty '+posCls+'" data-i="'+roomIdx+'" data-empty="1">'
        +'<div class="ns-room-bed-card">'
        +'<div class="ns-room-bed-pillow"></div>'
        +'<div class="ns-room-bed-blanket"><span class="ns-room-bed-main">Brīva</span></div>'
        +'</div>'
        +'</div>';
    }
    var c=getCol(slot.w.name);
    var nm=roomNames(slot.w.name);
    var em=roomEmoji(slot.w.name);
    return '<div class="ns-room-bed '+posCls+'" data-i="'+roomIdx+'" data-name="'+escHtml(String(slot.w.name||''))+'" data-accent="'+c.accent+'">'
      +'<div class="ns-room-bed-card" style="--bed:'+c.accent+';--bed-border:'+c.border+'">'
      +roomDevices(slot)
      +(em?'<div class="ns-room-bed-head-emoji">'+escHtml(em)+'</div>':'')
      +'<div class="ns-room-bed-zzz" aria-hidden="true"><span>Z</span><span>Z</span><span>Z</span></div>'
      +'<div class="ns-room-bed-pillow"></div>'
      +'<div class="ns-room-bed-blanket"><span class="ns-room-bed-main" style="font-size:'+nm.size+'">'+nm.main+'</span></div>'
      +'</div>'
      +'</div>';
  }

  function roomLegendItem(slot){
    if(!slot) return '';
    var c=getCol(slot.w.name);
    var em=roomEmoji(slot.w.name);
    return '<div class="ns-room-pill" style="--pill:'+c.accent+'">'
      +'<span class="ns-room-pill-dot"></span>'
      +'<span class="ns-room-pill-name">'+(em?'<span class="ns-room-pill-emoji">'+escHtml(em)+'</span> ':'')+escHtml(String(slot.w.name||''))+'</span>'
      +'<span class="ns-room-pill-time">'+escHtml(slot.ss)+'–'+escHtml(slot.es)+'</span>'
      +'</div>';
  }

  function roomWalker(roomType){
    if(roomType==='nmp'){
      return '<svg class="ns-room-walker ns-room-walker-nmp" viewBox="0 0 250 308" aria-hidden="true" focusable="false">'
        +'<g opacity="0.95">'
        +'<g>'
        +'<animateTransform attributeName="transform" type="translate" values="42 242; 84 222; 128 196; 176 204; 150 232; 96 236; 42 242" dur="26s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
        +'<animateTransform attributeName="transform" type="scale" additive="sum" values="-1 1; -1 1; -1 1; 1 1; 1 1; 1 1; -1 1" dur="26s" repeatCount="indefinite" calcMode="discrete" />'
        +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -1.4; 0 0.7; 0 -1; 0 0" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
        +'<text x="1.5" y="2" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="rgba(0,0,0,0.42)">🐈‍⬛</text>'
        +'<text font-size="24" text-anchor="middle" dominant-baseline="middle">🐈‍⬛</text>'
        +'</g></g></svg>';
    }
    return '<svg class="ns-room-walker ns-room-walker-main" viewBox="0 0 430 308" aria-hidden="true" focusable="false">'
      +'<g opacity="0.95">'
      +'<g opacity="0.94">'
      +'<g>'
      +'<animateTransform attributeName="transform" type="translate" values="78 112; 94 98; 126 92; 144 108; 136 132; 92 144; 58 148; 42 170; 38 196; 56 218; 92 236; 128 252; 164 248; 202 236; 248 212; 288 182; 322 154; 352 132; 378 112; 386 92; 372 76; 338 74; 308 88; 286 112; 252 148; 224 188; 198 222; 164 242; 126 246; 94 230; 70 204; 62 170; 78 112" dur="40s" repeatCount="indefinite" calcMode="spline" keySplines="0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1" />'
      +'<animateTransform attributeName="transform" type="scale" additive="sum" values="1 1; 1 1; 1 1; 1 1; -1 1; -1 1; -1 1; -1 1; -1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; 1 1; 1 1; 1 1; 1 1" dur="40s" repeatCount="indefinite" calcMode="discrete" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -1.15; 0 0.6; 0 -0.9; 0 0" dur="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
      +'<animate attributeName="opacity" values="0.96;0.96;0.92;0.86;0.52;0.34;0.28;0.22;0.22;0.42;0.78;0.9;0.96;0.96;0.94;0.9;0.84;0.74;0.62;0.46;0.26;0.22;0.22;0.34;0.66;0.82;0.9;0.96;0.96;0.92;0.86;0.92;0.96" dur="40s" repeatCount="indefinite" calcMode="discrete" />'
      +'<ellipse cx="0" cy="2.8" rx="7.8" ry="4.6" fill="rgba(0,0,0,0.14)" />'
      +'<path d="M-6.5 -0.6 C-9.8 -5.8 -12.6 -9.8 -16.8 -11.2" stroke="rgba(154,160,168,0.96)" stroke-width="1.35" stroke-linecap="round" fill="none" />'
      +'<path d="M-9.2 0 C-8.4 -4.6 -4.8 -7.2 1 -7.2 C7.6 -7.2 11.8 -3.2 11.8 1.2 C11.8 4.8 8.4 7.6 2.8 7.8 C-3.2 8 -8.6 5 -9.2 0 Z" fill="#9aa0a8" />'
      +'<path d="M-6.2 -3.8 C-6.1 -7.4 -4.2 -10 -1.6 -10 C0.2 -10 1.2 -7.4 0.6 -4.6 Z" fill="#b7bec8" />'
      +'<path d="M-1.2 -4.2 C-0.8 -7.4 1 -9.5 3.3 -9.1 C4.8 -8.8 5.2 -6.2 4 -3.8 Z" fill="#c2c8d1" />'
      +'<circle cx="7.3" cy="-1.5" r="0.72" fill="#111827" />'
      +'<circle cx="9.4" cy="0.3" r="0.58" fill="#e8a2b5" />'
      +'<path d="M9.4 0.8 L13.6 -0.5 M9.2 1.7 L13.6 1.8 M9 2.7 L13.1 4.2" stroke="rgba(239,242,247,0.9)" stroke-width="0.78" stroke-linecap="round" />'
      +'</g>'
      +'</g>'
      +'<g>'
      +'<animateTransform attributeName="transform" type="translate" values="74 100; 120 90; 140 124; 92 228; 150 244; 220 228; 320 122; 374 100; 352 144; 260 228; 168 208; 98 128; 74 100" dur="36s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -2.1; 0 1.1; 0 -1.4; 0 0" dur="1.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
      +'<g>'
      +'<animateTransform attributeName="transform" type="scale" values="-1 1; -1 1; 1 1; 1 1; -1 1; -1 1; -1 1; 1 1; 1 1; 1 1; -1 1; -1 1; -1 1" dur="36s" repeatCount="indefinite" calcMode="discrete" />'
      +'<text x="1.6" y="2.2" font-size="26" text-anchor="middle" dominant-baseline="middle" fill="rgba(0,0,0,0.42)">🐈‍⬛</text>'
      +'<text font-size="26" text-anchor="middle" dominant-baseline="middle">🐈‍⬛</text>'
      +'</g>'
      +'<g transform="translate(-12,-11)">'
      +'<animate attributeName="opacity" values="0;0;0;0;0.96;0;0;0;0;0;0;0;0" dur="36s" repeatCount="indefinite" calcMode="discrete" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="-12 -11; -11 -14; -12 -11; -12 -11" dur="2.2s" repeatCount="indefinite" />'
      +'<rect x="-14" y="-11" rx="9" ry="9" width="30" height="15" fill="rgba(255,255,255,0.92)" />'
      +'<path d="M2 2 L5 7 L7 2 Z" fill="rgba(255,255,255,0.92)" />'
      +'<text x="1" y="-1" font-size="8.5" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="#1c1325">ņau</text>'
      +'</g>'
      +'<g transform="translate(12,-11)">'
      +'<animate attributeName="opacity" values="0;0;0;0;0;0;0;0;0;0.9;0;0;0" dur="36s" repeatCount="indefinite" calcMode="discrete" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="12 -11; 13 -14; 12 -11; 12 -11" dur="2.2s" repeatCount="indefinite" />'
      +'<rect x="-14" y="-11" rx="9" ry="9" width="30" height="15" fill="rgba(255,255,255,0.92)" />'
      +'<path d="M-7 2 L-5 7 L-2 2 Z" fill="rgba(255,255,255,0.92)" />'
      +'<text x="1" y="-1" font-size="8.5" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="#1c1325">ņau</text>'
      +'</g>'
      +'</g>'
      +'</g></svg>';
  }

  function roomLayout(slots){
    if(!slots||!slots.length) return '';
    var byName={};
    slots.forEach(function(s, idx){
      var nm=String((s && s.w && s.w.name) || '').trim();
      if(nm) byName[nm]=Object.assign({_idx:idx}, s);
    });
    var roomOrder=getRoomOrder(slots);
    var picked=roomOrder.map(function(name){ return byName[name] || null; });
    while(picked.length<4) picked.push(null);
    return '<div class="ns-room-block">'
      +'<div class="ns-room-head">Istabu sadalījums</div>'
      +'<div class="ns-room-fit"><div class="ns-room-layout">'
      +'<div class="ns-room ns-room-main">'
      +'<div class="ns-room-titlebar">Galvenā istaba</div>'
      +'<div class="ns-room-shell">'
      +roomWalker('main')
      +roomBed(0, picked[0], 'is-left')
      +roomBed(1, picked[1], 'is-right-top')
      +roomBed(2, picked[2], 'is-right-bottom')
      +'</div>'
      +'</div>'
      +'<div class="ns-room ns-room-nmp">'
      +'<div class="ns-room-titlebar">Jaunais NMP</div>'
      +'<div class="ns-room-shell">'
      +roomWalker('nmp')
      +roomBed(3, picked[3], 'is-center')
      +'</div>'
      +'</div>'
      +'</div></div>'
      +'</div>';
  }

  function fitRoomBlocks(root){
    try{
      var scope = root || document;
      var panel = document.getElementById('nsPanelContent');
      if(!panel) return;
      var panelRect = panel.getBoundingClientRect();
      var blocks = scope.querySelectorAll('.ns-room-block');
      blocks.forEach(function(block){
        var fit = block.querySelector('.ns-room-fit');
        var layout = fit && fit.querySelector('.ns-room-layout');
        if(!fit || !layout) return;

        layout.style.transform = 'none';
        fit.style.height = 'auto';

        var naturalW = layout.scrollWidth || layout.offsetWidth || 1;
        var naturalH = layout.scrollHeight || layout.offsetHeight || 1;
        var fitRect = fit.getBoundingClientRect();
        var availW = Math.max(120, fit.clientWidth || block.clientWidth || naturalW);
        var availH = Math.max(120, panelRect.bottom - fitRect.top - 10);
        var scale = Math.min(1, availW / naturalW, availH / naturalH);
        if(!isFinite(scale) || scale <= 0) scale = 1;

        layout.style.transform = 'scale(' + scale + ')';
        fit.style.height = Math.ceil(naturalH * scale) + 16 + 'px';
      });
    }catch(_e){}
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function render(){
    // Target the nsPanel inside overlay, not the old bottom panel
    var panel = document.getElementById('nsPanelContent');
    if(!panel) return; // overlay not yet created
    if(!st||!st.sl||!st.sl.length){
      panel.innerHTML='<div style="color:rgba(255,255,255,.35);text-align:center;padding:32px;font-size:13px;">Nav nakts maiņas darbinieku šai dienai.</div>';
      return;
    }
    resetColours();

    var so=START.map(function(o){return'<option value="'+o.v+'"'+(o.v===st.sh?' selected':'')+'>'+o.l+'</option>';}).join('');
    var eo=END.map(function(o,i){return'<option value="'+i+'"'+(i===(st.ei||0)?' selected':'')+'>'+o.l+'</option>';}).join('');

    // Night theme helper — maps slot start hour → visual theme
    function _nightTheme(startMin){
      var h=Math.floor(((startMin%1440)+1440)%1440/60);
      if(h>=22||h<1)  return 'moon';
      if(h>=1&&h<3)   return 'starry';
      if(h>=3&&h<5)   return 'horizon';
      return 'sunrise';
    }
    var _nightDescs={moon:'Dziļā Nakts & Mēness Virsma',starry:'Zvaigžņotais Plašums',horizon:'Tālais Horizonts & Rītausma',sunrise:'Pirmā Gaisma & Saullēkts'};

    // Compute fatigue sparkline path data scaled to SVG coordinates
    function _sparkPaths(workerName, uid, x0, y0, sw, sh){
      if(!window.__fatigue) return null;
      var hist=window.__fatigue.gatherWorkerHistory(workerName);
      if(!hist||hist.length<3) return null;
      var today=new Date(), scores=[];
      for(var i=13;i>=0;i--){
        var d=new Date(today); d.setDate(d.getDate()-i);
        var dow=d.getDay(), mo=dow===0?6:dow-1;
        var ws=new Date(d); ws.setDate(ws.getDate()-mo);
        var we=new Date(ws); we.setDate(we.getDate()+6);
        var wsh=hist.filter(function(e){return e.date>=ws&&e.date<=we;});
        var wh=wsh.reduce(function(s,e){return s+e.hours;},0);
        var wn=wsh.filter(function(e){return e.isNight;}).length;
        var sc=0;
        if(wh>=60)sc+=40;else if(wh>=48)sc+=20+Math.round((wh-48)/12*20);else sc+=Math.max(0,Math.round(wh/48*15));
        sc+=Math.min(18,wsh.length*3); sc+=Math.min(15,wn*5);
        scores.push(Math.max(0,Math.min(100,sc)));
      }
      if(scores.length<2) return null;
      var pad=2, mn=Math.min.apply(null,scores), mx=Math.max.apply(null,scores);
      if(mx===mn) mx=mn+1;
      var xp=function(i){return x0+pad+(i/(scores.length-1))*(sw-pad*2);};
      var yp=function(s){return y0+sh-pad-(s-mn)/(mx-mn)*(sh-pad*2);};
      var path='M '+xp(0).toFixed(1)+','+yp(scores[0]).toFixed(1);
      for(var j=1;j<scores.length;j++){
        var px=xp(j-1),cx=(px+xp(j))/2;
        path+=' C '+cx.toFixed(1)+','+yp(scores[j-1]).toFixed(1)+' '+cx.toFixed(1)+','+yp(scores[j]).toFixed(1)+' '+xp(j).toFixed(1)+','+yp(scores[j]).toFixed(1);
      }
      var area=path+' L '+xp(scores.length-1).toFixed(1)+','+(y0+sh)+' L '+xp(0).toFixed(1)+','+(y0+sh)+' Z';
      return {line:path, area:area};
    }

    // SVG background per theme — unique IDs via card index to avoid conflicts
    function _nightSvg(theme, idx, workerName, accent){
      var u='nsc'+idx;
      var d='', bg='', deco='', gr='';
      // Shared glow filter for graph lines — renders line twice: blurred under + crisp on top
      var gf='<filter id="'+u+'-gl" x="-10%" y="-80%" width="120%" height="260%" color-interpolation-filters="sRGB">'
        +'<feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/>'
        +'<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
        +'</filter>';

      if(theme==='moon'){
        d='<linearGradient id="'+u+'-bg" x1="10%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#201840"/><stop offset="55%" stop-color="#120f28"/><stop offset="100%" stop-color="#08060f"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#9a8cff" stop-opacity="0.55"/>'
          +'<stop offset="60%" stop-color="#9a8cff" stop-opacity="0.12"/>'
          +'<stop offset="100%" stop-color="#9a8cff" stop-opacity="0"/>'
          +'</linearGradient>'
          +'<filter id="'+u+'-mf"><feGaussianBlur stdDeviation="12"/></filter>'
          +gf;
        bg='url(#'+u+'-bg)';
        deco=// Nebula wash
             '<ellipse cx="90" cy="80" rx="110" ry="60" fill="#7050d0" opacity="0.06"/>'
            // Scattered stars
            +'<circle cx="28" cy="18" r="1"   fill="#fff" opacity="0.5"/>'
            +'<circle cx="72" cy="32" r="1.4" fill="#fff" opacity="0.65"/>'
            +'<circle cx="118" cy="14" r="0.9" fill="#fff" opacity="0.4"/>'
            +'<circle cx="155" cy="26" r="1.1" fill="#fff" opacity="0.55"/>'
            +'<circle cx="60"  cy="52" r="0.8" fill="#fff" opacity="0.3"/>'
            // Moon outer soft halo (3 layers)
            +'<circle cx="238" cy="36" r="64" fill="#b0a0ff" opacity="0.07" filter="url(#'+u+'-mf)"/>'
            +'<circle cx="238" cy="36" r="40" fill="#d0c8ff" opacity="0.1"  filter="url(#'+u+'-mf)"/>'
            // Crisp moon disc
            +'<circle cx="238" cy="36" r="27" fill="#eeeaff" opacity="0.92"/>'
            // Crescent shadow — offset circle to cut the moon shape
            +'<circle cx="250" cy="30" r="23" fill="#130f28" opacity="0.9"/>';
        gr='<path d="M10 148 Q55 108 115 126 T232 134 L232 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +'<path d="M10 148 Q55 108 115 126 T232 134" fill="none" stroke="#9a8cff" stroke-width="2" filter="url(#'+u+'-gl)" opacity="0.9"/>';

      } else if(theme==='starry'){
        d='<linearGradient id="'+u+'-bg" x1="5%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#0e1a32"/><stop offset="100%" stop-color="#050b18"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#f0e68c" stop-opacity="0.4"/>'
          +'<stop offset="100%" stop-color="#f0e68c" stop-opacity="0"/>'
          +'</linearGradient>'
          +gf;
        bg='url(#'+u+'-bg)';
        deco=// Milky way subtle diagonal band
             '<ellipse cx="150" cy="55" rx="160" ry="28" fill="#5070c0" opacity="0.055" transform="rotate(-8,150,55)"/>'
            // Stars — varied sizes and brightnesses
            +'<circle cx="22"  cy="14" r="1"   fill="#fff" opacity="0.75"/>'
            +'<circle cx="58"  cy="28" r="1.6" fill="#fff" opacity="0.9"/>'
            +'<circle cx="98"  cy="10" r="0.9" fill="#fff" opacity="0.5"/>'
            +'<circle cx="138" cy="22" r="1.2" fill="#fff" opacity="0.7"/>'
            +'<circle cx="178" cy="8"  r="1.5" fill="#fff" opacity="0.85"/>'
            +'<circle cx="215" cy="20" r="0.9" fill="#fff" opacity="0.6"/>'
            +'<circle cx="252" cy="12" r="1.8" fill="#fff" opacity="0.9"/>'
            +'<circle cx="40"  cy="44" r="0.8" fill="#fff" opacity="0.4"/>'
            +'<circle cx="88"  cy="48" r="1"   fill="#fff" opacity="0.5"/>'
            +'<circle cx="130" cy="38" r="0.8" fill="#fff" opacity="0.35"/>'
            +'<circle cx="195" cy="40" r="1"   fill="#fff" opacity="0.55"/>'
            +'<circle cx="262" cy="36" r="0.8" fill="#fff" opacity="0.7"/>'
            +'<circle cx="240" cy="55" r="1.1" fill="#ffe0a0" opacity="0.6"/>'; // warm tinted star
        gr='<path d="M10 155 Q42 126 82 144 T152 128 T222 146 L222 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +'<path d="M10 155 Q42 126 82 144 T152 128 T222 146" fill="none" stroke="#f0e68c" stroke-width="1.8" stroke-dasharray="5,3" filter="url(#'+u+'-gl)" opacity="0.85"/>';

      } else if(theme==='horizon'){
        d='<linearGradient id="'+u+'-bg" x1="5%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#1e1008"/><stop offset="55%" stop-color="#150c06"/><stop offset="100%" stop-color="#0a0604"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-atm" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#ff6010" stop-opacity="0"/>'
          +'<stop offset="100%" stop-color="#ff6010" stop-opacity="0.22"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#ffb380" stop-opacity="0.55"/>'
          +'<stop offset="60%" stop-color="#ffb380" stop-opacity="0.1"/>'
          +'<stop offset="100%" stop-color="#ffb380" stop-opacity="0"/>'
          +'</linearGradient>'
          +'<filter id="'+u+'-mf"><feGaussianBlur stdDeviation="14"/></filter>'
          +gf;
        bg='url(#'+u+'-bg)';
        deco=// Warm atmosphere wash from bottom
             '<rect x="0" y="0" width="280" height="182" fill="url(#'+u+'-atm)"/>'
            // Layered horizon glow — 3 ellipses for depth
            +'<ellipse cx="140" cy="195" rx="180" ry="65" fill="#ff5500" opacity="0.12" filter="url(#'+u+'-mf)"/>'
            +'<ellipse cx="140" cy="190" rx="130" ry="44" fill="#ff7820" opacity="0.14" filter="url(#'+u+'-mf)"/>'
            +'<ellipse cx="140" cy="184" rx="80"  ry="24" fill="#ffaa40" opacity="0.1"  filter="url(#'+u+'-mf)"/>'
            // Subtle horizon line
            +'<line x1="0" y1="155" x2="280" y2="155" stroke="#ff8030" stroke-width="0.6" opacity="0.2"/>';
        gr='<path d="M10 140 C50 140 68 162 108 154 C148 146 172 142 232 152 L232 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +'<path d="M10 140 C50 140 68 162 108 154 C148 146 172 142 232 152" fill="none" stroke="#ffb380" stroke-width="2" filter="url(#'+u+'-gl)" opacity="0.9"/>';

      } else { // sunrise
        d='<linearGradient id="'+u+'-bg" x1="5%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#260e16"/><stop offset="55%" stop-color="#19090f"/><stop offset="100%" stop-color="#0e0508"/>'
          +'</linearGradient>'
          +'<radialGradient id="'+u+'-sg" cx="92%" cy="98%" r="70%">'
          +'<stop offset="0%"   stop-color="#ffb030" stop-opacity="0.55"/>'
          +'<stop offset="35%"  stop-color="#ff5020" stop-opacity="0.18"/>'
          +'<stop offset="100%" stop-color="#ff1060" stop-opacity="0"/>'
          +'</radialGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#ff8ca3" stop-opacity="0.55"/>'
          +'<stop offset="60%" stop-color="#ff8ca3" stop-opacity="0.1"/>'
          +'<stop offset="100%" stop-color="#ff8ca3" stop-opacity="0"/>'
          +'</linearGradient>'
          +'<filter id="'+u+'-sf"><feGaussianBlur stdDeviation="18"/></filter>'
          +'<filter id="'+u+'-sm"><feGaussianBlur stdDeviation="8"/></filter>'
          +gf;
        bg='url(#'+u+'-bg)';
        deco=// Dawn atmosphere radial wash
             '<rect x="0" y="0" width="280" height="182" fill="url(#'+u+'-sg)"/>'
            // Sun — 3 glow layers for depth + solid disc
            +'<circle cx="256" cy="172" r="88"  fill="#ffaa20" opacity="0.1"  filter="url(#'+u+'-sf)"/>'
            +'<circle cx="256" cy="172" r="56"  fill="#ffcc40" opacity="0.2"  filter="url(#'+u+'-sm)"/>'
            +'<circle cx="256" cy="172" r="36"  fill="#ffe060" opacity="0.82"/>';
        gr='<path d="M10 158 L36 146 L62 152 L88 132 L114 143 L140 118 L166 130 L192 108 L218 122 L232 98 L232 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +'<path d="M10 158 L36 146 L62 152 L88 132 L114 143 L140 118 L166 130 L192 108 L218 122 L232 98" fill="none" stroke="#ff8ca3" stroke-width="2" filter="url(#'+u+'-gl)" opacity="0.9"/>';
      }
      // Embed real fatigue sparkline — x:10–262, y:118–175 (57px tall band)
      var spk=_sparkPaths(workerName, u, 10, 118, 252, 57);
      var spkGrad='', spkPaths='';
      if(spk){
        spkGrad='<linearGradient id="'+u+'-spk" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="'+accent+'" stop-opacity="0.38"/>'
          +'<stop offset="100%" stop-color="'+accent+'" stop-opacity="0"/>'
          +'</linearGradient>';
        spkPaths='<path d="'+spk.area+'" fill="url(#'+u+'-spk)"/>'
          +'<path d="'+spk.line+'" fill="none" stroke="'+accent+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>';
      } else {
        // fallback static decorative line if no data
        spkPaths=gr;
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 182" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">'
        +'<defs>'+d+spkGrad+'</defs>'
        +'<rect width="280" height="182" fill="'+bg+'"/>'
        +deco+spkPaths
        +'</svg>';
    }

    // Build full glowing cards
    var cards=st.sl.map(function(s,i){
      var nm=escHtml(String(s.w.name||'').split(/\s+/)[0]);
      var c=getCol(s.w.name);
      var rt=slotRealtime(s);
      var tr=fatigueTrend(s.w.name);
      var dur=Math.floor(s.d/60)+'h'+(((s.d%60))?String(s.d%60).padStart(2,'0')+'m':'');
      var spk=sparkline(s.w.name, c.accent);
      var statusCls=rt.active?'active':(rt.status==='NĀKAMĀ'?'upnext':'done');
      var gradCss='conic-gradient(from 0deg, transparent 0%, '+c.accent+' 30%, transparent 60%)';
      var theme=_nightTheme(s.s);
      var desc=_nightDescs[theme]||'';
      var checklist = lastSlotChecklist(i, st.sl.length);
      return '<div class="nsc-card-wrap" data-i="'+i+'">'
        +'<div class="nsc-full-card nsc-theme-'+theme+(rt.active?' nsc-active':'')+'" data-i="'+i+'" style="--nsc-accent:'+c.accent+';--nsc-grad:'+gradCss+'">'
        +'<div class="nsc-deco" aria-hidden="true">'+_nightSvg(theme,i,s.w.name,c.accent)+'</div>'
        +'<div class="nsc-full-inner">'
        +'<div class="nsc-full-top">'
        +'<span class="nsc-full-name">'+nm+'</span>'
        +'</div>'
        +'<div class="nsc-full-time">'+escHtml(s.ss)+' – '+escHtml(s.es)+'</div>'
        +(desc?'<div class="nsc-full-desc">'+desc+'</div>':'')
        +'<div class="nsc-full-meta">'
        +'<span class="nsc-full-dur">'+dur+'</span>'
        +'<span class="nsc-full-fat '+tr.cls+'">'+(s.w.fs||0)+'% '+tr.icon+'</span>'
        +'</div>'
        +(rt.active?'<div class="nsc-full-progress"><span style="width:'+rt.pct.toFixed(1)+'%;background:'+c.accent+'"></span></div>':'')
        +'</div>'
        +'</div>'
        +(checklist?'<div class="nsc-below-checklist">'+checklist+'</div>':'')
        +'</div>';
    }).join('');

    ensureNightSplitLiveStyles();

    // Build flow timeline
    var flowBar='';
    if(st.sl.length>1){
      var tot=st.sl[st.sl.length-1].e-st.sl[0].s;
      var live=getFlowLiveState(st.sl);
      flowBar='<div class="ns-flow-bar">'+st.sl.map(function(s,i){
        var c=getCol(s.w.name);
        var pct=(s.d/tot*100).toFixed(2);
        return '<div class="ns-flow-seg'+(slotRealtime(s).active?' is-active':'')+'" style="--w:'+pct+'"><div class="ns-flow-fill" style="background:'+c.accent+'"></div></div>';
      }).join('')
      +(live?'<div class="ns-flow-live" style="left:'+live.pct.toFixed(3)+'%"></div>':'')
      +'</div>';
    }
    var nsCount=Math.max(1, Math.min(st.sl.length||1, 4));
    var nsGap=(nsCount>=4)?'4px':((nsCount===3)?'6px':'8px');
    var nsCardH=(nsCount>=4)?'136px':((nsCount===3)?'148px':'164px');
    var nsNameSize=(nsCount>=4)?'9px':((nsCount===3)?'10px':'11px');
    panel.innerHTML=
      '<div class="ns-panel-head">'
      +'<span class="ns-panel-title">🌙 Nakts sadalījums</span>'
      +'<div class="ns-panel-controls">'
      +'<select class="nss" onchange="__ns.ss(this.value)">'+so+'</select>'
      +'<span style="color:rgba(255,255,255,.3)">—</span>'
      +'<select class="nss" onchange="__ns.se(this.value)">'+eo+'</select>'
      +'</div>'
      +'<div class="ns-mode-btns"></div>'
      +'</div>'
      +'<div class="ns-cards-row" style="--ns-cols:'+nsCount+';--ns-gap:'+nsGap+';--ns-card-h:'+nsCardH+';--ns-name-size:'+nsNameSize+'">'+cards+'</div>'
      +flowBar
      +roomLayout(st.sl)
      +'<div class="ns-flow-meta">'+sortReason(st.sl)+'</div>';

    requestAnimationFrame(function(){
      fitRoomBlocks(panel);
      requestAnimationFrame(function(){ fitRoomBlocks(panel); });
    });

    drag(panel);
    // Update toggle button LED if active worker exists
    try {
      var hasActive=st.sl.some(function(s){return slotRealtime(s).active;});
      var btn=document.getElementById('nsToggleBtn');
      if(btn){btn.style.borderColor=hasActive?'rgba(0,255,136,.55)':'';btn.querySelector && btn.querySelector('.ns-led') && (btn.querySelector('.ns-led').style.background=hasActive?'#00ff88':'');}
    }catch(e){}
    refreshFlowLiveMarker();
  }

  window.addEventListener('resize', function(){
    requestAnimationFrame(function(){ fitRoomBlocks(document); });
  }, { passive:true });

  // ── Drag & Drop ── pure mouse + touch, zero HTML5 drag API ───────────────
  function drag(el){
    if(el._dragWired) return;
    el._dragWired=true;
    var dragging=null, touching=null, lastH=null, ghost=null, rafId=null, mx=0, my=0;
    var touchHoldTimer=null, touchStartX=0, touchStartY=0, touchDragReady=false, touchMoved=false;

    function allDraggables(){ return el.querySelectorAll('.nsc-full-card, .ns-room-bed[data-i]'); }
    function clearOver(){ allDraggables().forEach(function(x){x.classList.remove('nsover');}); lastH=null; }
    function killGhost(){ cancelAnimationFrame(rafId); if(ghost){ghost.remove();ghost=null;} }
    function moveGhost(){
      if(ghost) ghost.style.transform='translate3d('+(mx+18)+'px,'+(my-28)+'px,0) scale(1.06) rotate(-2deg)';
    }

    function startGhost(c){
      killGhost();
      var nm=c.classList.contains('nsc-full-card')
        ? (c.querySelector('.nsc-full-name') && c.querySelector('.nsc-full-name').textContent)
        : (c.getAttribute('data-name')||'');
      var accent=(c.style.getPropertyValue('--nsc-accent')||'#b77bff').trim();
      if(!accent && c.classList.contains('ns-room-bed')){
        accent = c.getAttribute('data-accent') || '#b77bff';
      }
      ghost=document.createElement('div');
      ghost.textContent=nm||'?';
      ghost.style.cssText='position:fixed;top:0;left:0;pointer-events:none;z-index:99999;'
        +'padding:6px 16px;border-radius:12px;font-size:17px;font-weight:900;'
        +'background:rgba(8,10,20,0.92);border:2px solid '+accent+';color:'+accent+';'
        +'box-shadow:0 0 18px '+accent+';will-change:transform;white-space:nowrap;';
      document.body.appendChild(ghost);
      moveGhost();
    }

    function clearTouchHold(){
      if(touchHoldTimer){
        clearTimeout(touchHoldTimer);
        touchHoldTimer=null;
      }
    }

    function updateOver(ox,oy){
      var o=document.elementFromPoint(ox,oy);
      var active=dragging||touching;
      var target=o&&(o.closest('.nsc-full-card') || o.closest('.ns-room-bed[data-i]'));
      if(target&&(!el.contains(target)||target===active))target=null;
      if(target && active){
        var activeRoom=active.classList && active.classList.contains('ns-room-bed');
        var targetRoom=target.classList && target.classList.contains('ns-room-bed');
        var activeCard=active.classList && active.classList.contains('nsc-full-card');
        var targetCard=target.classList && target.classList.contains('nsc-full-card');
        if(!((activeRoom && targetRoom) || (activeCard && targetCard))) target=null;
      }
      if(!target && active && active.classList && active.classList.contains('ns-room-bed')){
        target = nearestRoomBed(ox, oy, active);
      }
      if(lastH&&lastH!==target)lastH.classList.remove('nsover');
      lastH=target;
      if(target){ target.classList.add('nsover'); }
    }

    function nearestRoomBed(x,y,exclude){
      var beds=[].slice.call(el.querySelectorAll('.ns-room-bed[data-i]')).filter(function(b){ return b!==exclude; });
      if(!beds.length) return null;
      var best=null, bestDist=Infinity;
      beds.forEach(function(b){
        var r=b.getBoundingClientRect();
        var cx=r.left + r.width/2;
        var cy=r.top + r.height/2;
        var dx=cx-x, dy=cy-y;
        var dist=Math.sqrt(dx*dx+dy*dy);
        var reach=Math.max(r.width, r.height) * 0.95;
        if(dist <= reach && dist < bestDist){
          best=b; bestDist=dist;
        }
      });
      return best;
    }

    // ── Mouse ──────────────────────────────────────────────────────────────
    el.addEventListener('mousedown',function(e){
      var c=e.target.closest('.nsc-full-card, .ns-room-bed[data-i]'); if(!c||e.button!==0)return;
      e.preventDefault();
      dragging=c; mx=e.clientX; my=e.clientY;
      c.classList.add('nsdrag');
      startGhost(c); sndPickup();
    });
    document.addEventListener('mousemove',function(e){
      if(!dragging)return;
      mx=e.clientX; my=e.clientY;
      cancelAnimationFrame(rafId);
      rafId=requestAnimationFrame(function(){ moveGhost(); updateOver(mx,my); });
    });
    document.addEventListener('mouseup',function(){
      if(!dragging)return;
      var target=lastH;
      if(dragging.classList.contains('ns-room-bed')) target = nearestRoomBed(mx, my, dragging) || target;
      dragging.classList.remove('nsdrag'); clearOver(); killGhost();
      if(target){
        sndDrop();
        if(dragging.classList.contains('ns-room-bed')) swapRoom(+dragging.dataset.i,+target.dataset.i);
        else swap(+dragging.dataset.i,+target.dataset.i);
      }
      dragging=null;
    });

    // ── Touch ──────────────────────────────────────────────────────────────
    el.addEventListener('touchstart',function(e){
      var c=e.target.closest('.nsc-full-card, .ns-room-bed[data-i]'); if(!c)return;
      touching=c;
      touchDragReady=false;
      touchMoved=false;
      touchStartX=mx=e.touches[0].clientX;
      touchStartY=my=e.touches[0].clientY;
      clearTouchHold();
      touchHoldTimer=setTimeout(function(){
        if(!touching || touchMoved) return;
        touchDragReady=true;
        touching.classList.add('nsdrag');
        startGhost(touching);
        sndPickup();
      }, 180);
    },{passive:true});
    el.addEventListener('touchmove',function(e){
      if(!touching)return;
      mx=e.touches[0].clientX; my=e.touches[0].clientY;
      if(!touchDragReady){
        if(Math.abs(mx-touchStartX)>10 || Math.abs(my-touchStartY)>10){
          touchMoved=true;
          clearTouchHold();
          touching=null;
        }
        return;
      }
      cancelAnimationFrame(rafId);
      rafId=requestAnimationFrame(function(){ moveGhost(); updateOver(mx,my); });
      e.preventDefault();
    },{passive:false});
    el.addEventListener('touchend',function(e){
      clearTouchHold();
      if(!touching)return;
      if(!touchDragReady){
        touching=null;
        return;
      }
      var t=e.changedTouches[0];
      mx=t.clientX; my=t.clientY;
      updateOver(t.clientX,t.clientY);
      var target=lastH;
      if(touching.classList.contains('ns-room-bed')) target = nearestRoomBed(mx, my, touching) || target;
      touching.classList.remove('nsdrag'); clearOver(); killGhost();
      if(target){
        sndDrop();
        if(touching.classList.contains('ns-room-bed')) swapRoom(+touching.dataset.i,+target.dataset.i);
        else swap(+touching.dataset.i,+target.dataset.i);
      }
      touching=null;
      touchDragReady=false;
    });
    el.addEventListener('touchcancel',function(){
      clearTouchHold();
      if(!touching)return;
      touching.classList.remove('nsdrag'); clearOver(); killGhost(); touching=null;
      touchDragReady=false;
    },{passive:true});
  }

  function swap(a,b){
    var w=st.sl.map(function(s){return s.w;});
    var t=w[a];w[a]=w[b];w[b]=t;
    st.sl=calc(w,st.sh,st.ei);
    saveCurrentDayState();
    sndReorder(); render();
    try{ if(window.__nsBarSync) window.__nsBarSync(); }catch(_e){}
    setTimeout(function(){
      var c=document.querySelectorAll('#nsPanelContent .nsc-full-card');
      [a,b].forEach(function(i){if(c[i]){c[i].classList.add('nsswapped');setTimeout(function(){c[i]&&c[i].classList.remove('nsswapped');},600);}});
    },40);
  }

  function swapRoom(a,b){
    if(!st || a===b || a<0 || b<0) return;
    var order=getRoomOrder(st.sl);
    while(order.length<4) order.push('');
    var t=order[a]; order[a]=order[b]; order[b]=t;
    saveRoomOrder(order);
    sndReorder();
    render();
    setTimeout(function(){
      [a,b].forEach(function(i){
        var bed=document.querySelector('#nsPanelContent .ns-room-bed[data-i="'+i+'"]');
        if(bed){
          bed.classList.add('nsswapped');
          setTimeout(function(){ bed && bed.classList.remove('nsswapped'); },700);
        }
      });
    },40);
  }

  function update(){
    var el=document.getElementById('night-split-panel');if(!el)return;
    try{ window.__todayDateStr = (window.__grafiksTodayStr || window.__todayDateStr || ''); }catch(e){}
    var dk=activeDateKey();
    if(dk) pullRoomState(dk, function(){ if(dk===activeDateKey()) render(); });
    resetColours(); // reset colour map each time we re-compute for new day
    var wk=getW();
    if(wk.length<2){st=null;render();return;}
    var fallbackSh=st?st.sh:0, fallbackEi=st?(st.ei||0):0;
    var applied=applySavedDayState(fat(wk), fallbackSh, fallbackEi);
    st={sh:applied.sh,ei:applied.ei,sl:calc(applied.workers,applied.sh,applied.ei)};render();
  }

  function init(){
    if(!window.__grafiksStore){setTimeout(init,500);return;}
    startRoomPolling();
    window.addEventListener('daySelected',function(){setTimeout(update,200);});
    setTimeout(update,600);setTimeout(update,1500);
    setInterval(refreshFlowLiveMarker, 15000);
  }

  function _cloneSlotsWithNewEndKeepStarts(oldSlots, ei){
    if(!oldSlots||!oldSlots.length) return [];
    var eo=END[ei]||END[0];
    var sh=oldSlots[0].s;
    var em=eo.h*60+eo.m;
    if(sh>=20*60) em+=1440;
    var out=oldSlots.map(function(sl){ return {w:sl.w,s:sl.s,e:sl.e}; });
    out[out.length-1].e = em;
    // cascade backwards only if overlap/negative appears
    for(var i=out.length-1;i>0;i--){
      if(out[i].e <= out[i].s){
        out[i].s = out[i].e - 5;
      }
      if(out[i].s < out[i-1].s + 5){
        out[i].s = out[i-1].s + 5;
      }
      if(out[i-1].e > out[i].s) out[i-1].e = out[i].s;
      if(out[i-1].e <= out[i-1].s) out[i-1].e = out[i-1].s + 5;
    }
    // if end is too early and caused overflow, rebuild safely
    if(out[0].e > out[1]?.s || out.some(function(sl){return sl.e<=sl.s;})) {
      return calc(oldSlots.map(function(x){return x.w;}), oldSlots[0].s/60, ei);
    }
    for(var j=0;j<out.length;j++){
      out[j].ss = mt(out[j].s); out[j].es = mt(out[j].e); out[j].d = out[j].e-out[j].s;
    }
    return out;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else setTimeout(init,400);

  window.__ns={
    _render: render,
    _update: update,
    ss:function(v){if(!st)return;st.sh=parseFloat(v);st.sl=calc(st.sl.map(function(s){return s.w;}),st.sh,st.ei);saveCurrentDayState();render();},
    se:function(v){if(!st)return;st.ei=parseInt(v); st.sl=calc(st.sl.map(function(s){return s.w;}),st.sh,st.ei); saveCurrentDayState(); render();},
    eq:function(){
      if(!st)return;
      sndReorder();
      st.sl=calc(st.sl.map(function(s){return s.w;}),st.sh,st.ei);
      saveCurrentDayState();
      render();
    },
    re:function(){
      if(!st)return;
      sndReorder();
      var sorted=fat(st.sl.map(function(s){return s.w;}));
      st.sl=calc(sorted,st.sh,st.ei);
      saveCurrentDayState();
      render();
    },
    ba:function(){
      if(!st)return;
      sndReorder();
      var balanced=balancedOrder(st.sl.map(function(s){return s.w;}));
      st.sl=calc(balanced,st.sh,st.ei);
      saveCurrentDayState();
      render();
    }
  };
})();
