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
    var stores=[window.__grafiksStore]; // Nakts sadalījums: tikai radigrāferi
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
