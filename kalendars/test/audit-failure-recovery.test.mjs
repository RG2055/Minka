import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const section=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return s.slice(i,j);};
const tick=()=>new Promise(r=>setImmediate(r));
function harness(extra={}){
 let now=1800000000000,id=0;const timers=new Map(),requests=[];
 class Clock extends Date {static now(){return now;}}
 const fetch=(url,options={})=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
 const c=vm.createContext({Date:Clock,AbortController,console,fetch,
  setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),...extra});
 return {c,requests,timers,async advance(ms){now+=ms;for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}await tick();}};
}
function bolus(path){const h=harness({window:{},GS_URL:'https://fixture',ROOMS:[{id:'ge'}],_state:{ge:{changedAt:10}},_history:{ge:[{ts:10}]},_lastLocalWriteAt:{},_lastLocalHistWriteAt:{},_remoteOverwriteAllowed:()=>true,_remoteHistOverwriteAllowed:()=>true,_syncMediaFromHistory:()=>false,_save(){},_saveHistory(){},_mkToast(){}});vm.runInContext(section(read(path),'var _pullPromise = null;','function _scheduleSync('),h.c);return h;}
for(const path of ['index.html','mobile.html'])for(const bodyHang of [false,true])test(`${path}: ${bodyHang?'hung JSON body':'hung request'} releases bolus polling and ignores late data`,async()=>{
 const h=bolus(path);h.c._kvPull();await tick();
 if(bodyHang){h.requests[0].resolve({ok:true,json:()=>new Promise(()=>{})});await tick();}
 await h.advance(20000);h.c._kvPull();await tick();
 assert.equal(h.requests.length,2,'poll must recover without reloading page');
 h.requests[1].resolve({ok:true,json:async()=>({ge:{history:[{ts:30}]}})});await tick();
 h.requests[0].resolve({ok:true,json:async()=>({ge:{history:[{ts:5}]}})});await tick();
 assert.equal(h.c._state.ge.changedAt,30);
 assert.equal(h.requests[0].options.signal.aborted,true);
});
function emoji(){const h=harness({document:{hidden:false},_data:{Worker:'🐱'},GIST_ID:'',LOCAL_KEY:'emoji',hasApiAuth:()=>true,sanitizeEmojiMap:x=>x,refreshAllCards(){},localStorage:{setItem(){},removeItem(){}}});h.c.window={MinkaApi:{apiFetch:h.c.fetch}};vm.runInContext(section(read('kalendars/js/emoji.js'),'  var emojiReadPending','  function loadLocal()'),h.c);return h;}
test('emoji read resumes after a hung request and rejects its late result',async()=>{
 const h=emoji();h.c.loadFromGist();await tick();await h.advance(20000);
 h.c.loadFromGist();await tick();assert.equal(h.requests.length,2);
 h.requests[1].resolve({ok:true,json:async()=>({Worker:'🦊'})});await tick();
 h.requests[0].resolve({ok:true,json:async()=>({Worker:'🐶'})});await tick();
 assert.equal(h.c._data.Worker,'🦊');
});
test('one hung emoji save does not block every later selection',async()=>{
 const h=emoji();const first=h.c.saveToGist('Worker');await tick();
 h.c._data.Worker='🦊';const second=h.c.saveToGist('Worker');await tick();
 assert.equal(h.requests.length,1);await h.advance(20000);
 assert.equal(h.requests.length,2,'next queued save must proceed');
 assert.equal(h.requests[1].options.json.emoji,'🦊');
 h.requests[1].resolve({ok:true});
 assert.equal(await first,'error');assert.equal(await second,'github');
 assert.equal(h.c.emojiWritesPending,0);
});
test('radio station-map failure can retry without reloading',async()=>{
 const h=harness({rrPrefixToId:null,rrMapPromise:null,RR_STATIONS_URL:'stations'});
 const s=read('js/radio.js');vm.runInContext(section(s,'async function '+(s.includes('async function fetchRadioJson(')?'fetchRadioJson(':'ensureRRPrefixMap('),'function parseNowList('),h.c);
 const first=h.c.ensureRRPrefixMap();await tick();h.requests[0].reject(new Error('offline'));await first;
 const second=h.c.ensureRRPrefixMap();await tick();assert.equal(h.requests.length,2);
 h.requests[1].resolve({ok:true,json:async()=>({result:[{prefix:'test',id:7}]})});
 assert.equal((await second).test,'7');
});
test('radio hung station-map response releases the shared request',async()=>{
 const h=harness({rrPrefixToId:null,rrMapPromise:null,RR_STATIONS_URL:'stations'});
 const s=read('js/radio.js');vm.runInContext(section(s,'async function '+(s.includes('async function fetchRadioJson(')?'fetchRadioJson(':'ensureRRPrefixMap('),'function parseNowList('),h.c);
 h.c.ensureRRPrefixMap();await tick();await h.advance(20000);h.c.ensureRRPrefixMap();await tick();
 assert.equal(h.requests.length,2);
 h.requests[1].resolve({ok:true,json:async()=>({result:[{prefix:'new',id:8}]})});await tick();
 h.requests[0].resolve({ok:true,json:async()=>({result:[{prefix:'old',id:2}]})});await tick();
 assert.equal(h.c.rrPrefixToId.new,'8');assert.equal(h.c.rrPrefixToId.old,undefined);
});
test('malformed birthday response is retryable rather than cached as an empty success',async()=>{
 const h=harness({BIRTHDAYS:[],_bdayLoadPromise:null,_bdayLoaded:false,refreshBirthdaysUi(){}});
 h.c.window={MinkaApi:{apiFetch:h.c.fetch}};h.c.setBirthdays=list=>{h.c.BIRTHDAYS=list;h.c._bdayLoaded=true;};
 vm.runInContext(section(read('kalendars/js/monthcal.js'),'  function loadBirthdays()','  function birthdayMap()'),h.c);
 const a=h.c.loadBirthdays();await tick();h.requests[0].resolve({ok:true,json:async()=>({error:'temporary'})});await a;
 assert.equal(h.c._bdayLoaded,false);
 const b=h.c.loadBirthdays();await tick();assert.equal(h.requests.length,2);
 h.requests[1].resolve({ok:true,json:async()=>({birthdays:[]})});await b;assert.equal(h.c._bdayLoaded,true);
});
test('hung birthday body can retry and late results cannot replace the retry',async()=>{
 const h=harness({BIRTHDAYS:[],_bdayLoadPromise:null,_bdayLoaded:false,refreshBirthdaysUi(){}});
 h.c.window={MinkaApi:{apiFetch:h.c.fetch}};h.c.setBirthdays=list=>{h.c.BIRTHDAYS=list;h.c._bdayLoaded=true;};
 vm.runInContext(section(read('kalendars/js/monthcal.js'),'  function loadBirthdays()','  function birthdayMap()'),h.c);
 let late;const first=h.c.loadBirthdays();await tick();h.requests[0].resolve({ok:true,json:()=>new Promise(r=>late=r)});await tick();await h.advance(20000);await first;
 const second=h.c.loadBirthdays();await tick();assert.equal(h.requests.length,2);
 h.requests[1].resolve({ok:true,json:async()=>[{d:'01.01',name:'New'}]});await second;
 late([{d:'02.02',name:'Old'}]);await tick();assert.equal(h.c.BIRTHDAYS[0].name,'New');
});

for(const path of ['index.html','mobile.html']) for(const response of ['http500','invalid-json','rejected','success'])test(`${path}: bolus save handles ${response}`,async()=>{
 const messages=[];const c=vm.createContext({GS_URL:'fixture',_state:{ge:{changedAt:123}},_names:{ge:'Test'},_history:{ge:[]},_pendingThanks:null,_prettyFirst:()=>'',_bcSync(){},_mkToast:(_t,k)=>messages.push(k),fetch:async()=>({ok:response!=='http500',json:async()=>{if(response==='invalid-json')throw new Error('parse');return {ok:response==='success'};}})});
 vm.runInContext(section(read(path),'function _kvPush(',path==='index.html'?'// Edit/delete':'var _pullPromise'),c);c._kvPush('ge');await tick();
 assert.equal(messages[0],response==='success'?'ok':'error');
});
for(const path of ['cloudflare/minka-api/src/index.js','cloudflare/coffee-api/src/index.js'])test(`${path}: JSON reader boundaries, malformed data and stream failure`,async()=>{
 const s=read(path),a=s.indexOf('async function readJson('),c=vm.createContext({TextDecoder});vm.runInContext(s.slice(a,s.indexOf('\n}',a)+2),c);
 const enc=new TextEncoder(),valid='{"value":"ā😀"}',bytes=enc.encode(valid);
 for(const [limit,expected]of [[bytes.length,true],[bytes.length-1,false]]){
  const result=await c.readJson(new Request('https://fixture',{method:'POST',body:valid}),limit);
  assert.equal(!!result,expected);if(expected)assert.equal(result.value,'ā😀');
 }
 for(const body of ['', '{bad', 'null'])assert.equal(await c.readJson(new Request('https://fixture',{method:'POST',body})),null);
 let released=false;assert.equal(await c.readJson({headers:new Headers(),body:{getReader:()=>({read:async()=>{throw new Error('disconnected');},releaseLock:()=>released=true})}}),null);assert.equal(released,true);
});
const worker=(await import(new URL('../../cloudflare/minka-api/src/index.js',import.meta.url))).default;
test('main API accepts valid login and rejects incorrect, malformed, empty and oversized logins',async()=>{
 for(const [body,status]of [[JSON.stringify({password:'fixture'}),200],[JSON.stringify({password:'wrong'}),401],['{',401],['',401],[JSON.stringify({password:'fixture',padding:'x'.repeat(65536)}),401]]){
  const r=await worker.fetch(new Request('https://fixture/api/login',{method:'POST',body}),{APP_PASSWORD:'fixture'},{});assert.equal(r.status,status);assert.equal((await r.json()).ok,status===200);
 }
});
test('emoji API write, paginated read and deletion round trip with isolated KV',async()=>{
 const map=new Map([['ns::08.09.2026','private plan'],['skin-art::fixture','binary']]);
 const env={APP_PASSWORD:'fixture',MINKA_EMOJI:{put:async(k,v)=>map.set(k,v),delete:async k=>map.delete(k),get:async k=>map.get(k),list:async({cursor}={})=>{const n=Number(cursor)||0,keys=[...map.keys()].slice(n,n+1).map(name=>({name}));return {keys,list_complete:n+1>=map.size,cursor:n+1<map.size?String(n+1):undefined};}}};
 const call=(method,body,auth=true)=>worker.fetch(new Request('https://fixture/api/emoji',{method,headers:auth?{authorization:'Bearer fixture'}:{},...(body?{body:JSON.stringify(body)}:{})}),env,{});
 assert.equal((await call('GET',null,false)).status,401);
 for(const name of ['TEST ĀNA','__proto__','constructor'])assert.equal((await call('POST',{worker:name,emoji:'🐱'})).status,200);
 let data=await(await call('GET')).json();assert.equal(data['TEST ĀNA'],'🐱');assert.equal(data.__proto__,'🐱');assert.equal(data['ns::08.09.2026'],undefined);
 assert.equal((await call('POST',{worker:'TEST ĀNA',emoji:null})).status,200);data=await(await call('GET')).json();assert.equal(data['TEST ĀNA'],undefined);assert.equal(data.constructor,'🐱');
});
test('emoji selection and removal update the visible card badge without a roster reload',()=>{
 const glyph={textContent:'AT'},classes=new Set(['is-initials']),attrs={};
 const meta={querySelector:()=>glyph,setAttribute:(k,v)=>attrs[k]=v,classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
 const hiddenEmoji={textContent:'',remove(){}};
 const card={querySelector:selector=>selector==='.mk-mid-meta-emoji'?meta:selector==='.mk-mid-status-icons'?{}:selector==='.mk-mid-person-emoji'?hiddenEmoji:null};
 const c=vm.createContext({_data:{'ALPHA TEST':'🦊'},safeEmoji:x=>x});
 vm.runInContext(section(read('kalendars/js/emoji.js'),'  function updateCardEmoji(','  function updateSideEmoji('),c);
 c.updateCardEmoji(card,'ALPHA TEST');assert.equal(glyph.textContent,'🦊');assert.equal(classes.has('is-initials'),false);assert.equal(attrs['data-mk-emoji-home'],'🦊');
 delete c._data['ALPHA TEST'];c.updateCardEmoji(card,'ALPHA TEST');assert.equal(glyph.textContent,'AT');assert.equal(classes.has('is-initials'),true);
});
test('new day/night cards paint personal initials immediately, before emoji hooks run',()=>{
 const c=vm.createContext({window:{},probe:null,isGridView:true,isToday:false,now:new Date(),
  document:{createElement:()=>({setAttribute(){},querySelector:()=>null})},
  capitalize:x=>x,escapeHtml:x=>String(x),safeEmojiText:x=>x||'',
  getPersonEmoji:w=>w.emoji,getShiftEmoji:w=>w.night?'🌙':'☀️',
  getDutyStartTime:()=> '20:00',getDutyEndTime:()=> '08:00',
  midFatigueTrend:()=>({icon:'→',cls:''}),getMonthHoursForWorker:()=>120,
  getDutyShiftHours:()=>12,buildCoffeeRow:()=>''});
 vm.runInContext(section(read('kalendars/js/calendar.js'),'    function buildMidMeta(','    // Refresh fatigue bars after render'),c);
 for(const night of [false,true])for(const emoji of ['', '🦊']){
  const card=c.buildCard({name:'AIJA JAIDZUMA',shift:'12',night,emoji},false);
  const badge=card.innerHTML.match(/<span class="mk-mid-meta-emoji([^\"]*)"[^>]*data-mk-emoji-home="([^\"]*)"[^>]*><span class="mk-mid-meta-emoji-fly">([^<]*)<\/span>/);
  assert.ok(badge);assert.equal(badge[2],emoji||'AJ');assert.equal(badge[3],emoji||'AJ');
  assert.equal(badge[1].includes('is-initials'),!emoji);
  assert.ok(card.innerHTML.includes(night?'🌙':'☀️'),'shift symbol remains in its own place');
 }
});
test('mobile night history stays readable and retains scroll while desktop still fits height',()=>{
 const s=read('kalendars/js/nightsplit.js');
 for(const mobile of [false,true]){
  let scale;const c=vm.createContext({window:{visualViewport:{height:700}},getComputedStyle:()=>({}),document:{documentElement:{classList:{contains:()=>mobile},style:{setProperty:(_k,v)=>scale=Number(v)}}}});
  vm.runInContext(section(s,'  function fitNightCanvas(','  function fitRoomBlocks('),c);
  const canvas={style:{},getBoundingClientRect:()=>({top:0,left:0}),offsetHeight:1500,offsetWidth:360,querySelectorAll:()=>[],querySelector:()=>null};
  const panel={parentElement:{},style:{},clientWidth:360,scrollTop:120,scrollLeft:0};
  c.fitNightCanvas(panel,canvas);
  if(mobile){assert.equal(scale,1);assert.equal(panel.scrollTop,120);}
  else{assert.ok(scale<0.5);assert.equal(panel.scrollTop,0);}
 }
});
