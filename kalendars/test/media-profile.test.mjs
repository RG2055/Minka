import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../../js/media-profile.js',import.meta.url),'utf8');
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};};
const tick=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function harness({storage=memory(),fetchHandler,restored=true,now=Date.now(),savedPatch={},stationsReady=true}={}){
 const elements=new Map(),events={},documentEvents={},timers=new Map(),applied=[],requests=[],started=[];let timer=0,clock=now;
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 class Element{
  constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attributes={};this.classList={add(){},remove(){},toggle(){}};this.listeners={};this.open=false;this.textContent='';}
  set id(id){this._id=id;elements.set(id,this);}get id(){return this._id;}
  set innerHTML(html){this.html=html;for(const m of html.matchAll(/id="([^"]+)"/g)){const el=new Element();el.id=m[1];}}
  append(...els){this.children.push(...els);}prepend(...els){this.children.unshift(...els);}replaceChildren(...els){this.children=els;}
  setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){this.listeners[k]=fn;}
  querySelector(s){if(s==='[data-close]')return this.closeButton||=new Element('button');return null;}
  getBoundingClientRect(){return {left:700,right:820,top:500,bottom:540,width:480,height:320};}
  showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}focus(){}
 }
 const body=new Element(),brand=new Element();for(const id of ['radioSourceBar','calIframe']){const e=new Element();e.id=id;}
 let state={activeDateStr:'08.09.2026',rg:[{name:'Alpha Test'}],rd:[{name:'Radiologist Only'}]};
 elements.get('calIframe').contentWindow={__minkaGetSelectedDayState:()=>state,MinkaEmoji:{get:()=> '🐈'}};
 const ss=memory(),saved={workerId:'alpha',name:'Alpha Test',sessionToken:'a'.repeat(64),expiresAt:clock+3600000,...savedPatch};if(restored)ss.setItem('minka:media-session:v2',JSON.stringify(saved));
 const document={body,hidden:false,addEventListener:(name,fn)=>{(documentEvents[name]||=[]).push(fn);},createElement:t=>new Element(t),createTextNode:text=>({textContent:text}),getElementById:id=>elements.get(id),querySelector:s=>s==='#radioWindow .brand-text'?brand:null,dispatchEvent(){}};
 const window={rgStations:{startFavorite(ids){if(!stationsReady)return false;started.push([...ids]);return true;}},addEventListener:(name,fn)=>{(events[name]||=[]).push(fn);},rgTheme:{snapshot:()=>({theme:'Guest'}),captureGuest:()=>({theme:'Guest'}),restoreGuest:v=>applied.push(v),applyProfile:v=>applied.push(v)},__minkaLastSelectedDayState:state};
 const c=vm.createContext({window,document,Date:ClockDate,location:{hostname:'127.0.0.1',origin:'http://127.0.0.1:8012'},navigator:{onLine:true},localStorage:storage,sessionStorage:ss,ResizeObserver:class{observe(){}},innerWidth:1000,innerHeight:800,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},AbortController,setTimeout:(fn,delay)=>{timers.set(++timer,{fn,at:clock+delay});return timer;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:false}),fetch:async(url,options)=>{
  const path=url.replace('/dezura/v2/',''),data=JSON.parse(options.body);requests.push({path,data});
  const result=await(fetchHandler?.(path,data)??(path==='session'?{session:saved}:path==='radio/load'?{data:{favorites:['record:a'],settings:{theme:'Personal'},lastStation:''}}:{ok:true,data:{favorites:['record:a'],settings:{theme:'Saved'},lastStation:''}}));
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
 }});
 vm.runInContext(code.replace('window.__mkUnifiedMedia={','window.__testAdopt=adopt;window.__mkUnifiedMedia={'),c);
 return {started,signIn:()=>window.__testAdopt(saved,true),stationsReady(){stationsReady=true;for(const fn of events['rg-stations-ready']||[])fn();},api:window.__mkUnifiedMedia,c,elements,applied,requests,storage,sessionStorage:ss,brand,advance(ms,runTimers=false){clock+=ms;if(runTimers)for(const [id,t] of [...timers])if(t.at<=clock){timers.delete(id);t.fn();}},wake(event='visibilitychange'){for(const fn of (event==='visibilitychange'?documentEvents:events)[event]||[])fn();},setState(next){state=next;window.__minkaLastSelectedDayState=next;for(const fn of events.message||[])fn({origin:'http://127.0.0.1:8012',source:elements.get('calIframe').contentWindow,data:{type:'minka-calendar-selected-day-state',payload:next}});},online(){for(const fn of events.online||[])fn();}};
}
test('guest stays passive; roster includes only selected radiographers',async()=>{
 const h=harness({restored:false});await tick();assert.equal(h.requests.length,0);assert.deepEqual(Array.from(h.api.roster().workers,x=>x.name),['Alpha Test']);assert.equal(h.api.getSession(),null);assert.equal(h.api.roster().date,'08.09.2026');
});
test('late profile load after logout cannot apply the old appearance or favorites',async()=>{
 const load=deferred(),h=harness({fetchHandler:path=>path==='radio/load'?load.promise:undefined});await tick();assert.equal(h.api.getSession().workerId,'alpha');await h.api.logout(false);
 load.resolve({data:{favorites:['private'],settings:{theme:'Wrong'},lastStation:''}});await tick();assert.equal(h.api.getSession(),null);assert.deepEqual(Array.from(h.api.getRadio().favorites),[]);assert.ok(!h.applied.some(x=>x.theme==='Wrong'));assert.equal(h.brand.textContent,'RG RADIO');
});
test('late save after logout cannot revive the person; pending operations remain owner-scoped',async()=>{
 const save=deferred(),h=harness({fetchHandler:path=>path==='radio/change'?save.promise:undefined});await tick();h.api.change({type:'favorite-add',id:'record:b'});await tick();await h.api.logout(false);
 save.resolve({ok:true,data:{favorites:['record:a','record:b'],settings:{theme:'Old'},lastStation:''}});await tick();assert.equal(h.api.getSession(),null);assert.equal(h.api.getRadio().favorites.length,0);assert.ok(h.storage.getItem('minka:media-pending:alpha').includes('record:b'));
});
test('offline edits replay after returning to the same account without restoring another account',async()=>{
 const storage=memory(),h=harness({storage,fetchHandler:path=>{if(path==='radio/change')throw new Error('Offline');}});await tick();h.api.change({type:'favorite-add',id:'record:b'});await tick();assert.match(storage.getItem('minka:media-pending:alpha'),/record:b/);await h.api.logout(false);
 const next=harness({storage});await tick();await tick();assert.equal(next.requests.filter(x=>x.path==='radio/change').length,1);assert.equal(storage.getItem('minka:media-pending:alpha'),'[]');
});
test('browsing other calendar days keeps the authenticated profile and its original deadline',async()=>{
 const h=harness({now:Date.parse('2026-09-08T19:00:00Z')});await tick();const session=h.api.getSession(),deadline=session.dutyEndsAt;
 for(const day of [
  {activeDateStr:'09.09.2026',rg:[{name:'Beta Test'}],rd:[{name:'Alpha Test'}]},
  {activeDateStr:'01.08.2026',rg:[],rd:[]},
  {activeDateStr:'08.09.2026',rg:[{name:'Alpha Test'}],rd:[]}
 ]){
  h.setState(day);await tick();assert.equal(h.api.getSession(),session);assert.equal(h.api.getSession().dutyEndsAt,deadline);
  assert.deepEqual(Array.from(h.api.getRadio().favorites),['record:a']);assert.equal(h.brand.textContent,'RADIO ALPHA');assert.equal(h.applied.at(-1).theme,'Personal');
 }
 assert.ok(!h.requests.some(r=>r.path==='logout'));assert.equal(h.started.length,1);
 h.setState({activeDateStr:'01.08.2026',rg:[],rd:[]});await h.api.refresh();
 assert.equal(h.api.getSession().workerId,'alpha');assert.equal(h.api.getSession().dutyEndsAt,deadline);assert.equal(h.started.length,1);
});
test('restoring a valid session does not depend on the displayed calendar roster',async()=>{
 const h=harness({now:Date.parse('2026-09-08T19:00:00Z')});
 h.setState({activeDateStr:'11.09.2026',rg:[{name:'Beta Test'}],rd:[]});await tick();
 assert.equal(h.api.getSession()?.workerId,'alpha');assert.equal(h.applied.at(-1)?.theme,'Personal');assert.ok(!h.requests.some(r=>r.path==='logout'));
});
test('restoring a profile selects its favorites without an extra server playback API and branding is conditional',async()=>{
 const h=harness();await tick();assert.equal(h.brand.textContent,'RADIO ALPHA');assert.equal(h.applied.at(-1).theme,'Personal');assert.ok(!h.requests.some(x=>/play/.test(x.path)));await h.api.logout(false);assert.equal(h.applied.at(-1).theme,'Guest');assert.equal(h.brand.textContent,'RG RADIO');
});

test('radio logout control appears only for an authenticated person and clears both shared-session and branding',async()=>{
 const h=harness();await tick();const exit=h.elements.get('mediaLogoutButton');assert.equal(exit.hidden,false);exit.listeners.click();await tick();assert.equal(exit.hidden,true);assert.equal(h.api.getSession(),null);assert.equal(h.brand.textContent,'RG RADIO');assert.equal(h.requests.filter(r=>r.path==='logout').length,1);
 const guest=harness({restored:false});await tick();assert.equal(guest.elements.get('mediaLogoutButton').hidden,true);
});

test('08:00 Riga handover revokes the profile even while browsing another calendar day',async()=>{
 const h=harness({now:Date.parse('2026-09-09T04:59:00Z')});await tick();
 assert.equal(h.api.getSession().dutyEndsAt,Date.parse('2026-09-09T05:00:00Z'));
 h.setState({activeDateStr:'15.09.2026',rg:[{name:'Beta Test'}],rd:[]});
 h.advance(59999,true);assert.ok(h.api.getSession());h.advance(1,true);await tick();
 assert.equal(h.api.getSession(),null);assert.equal(h.brand.textContent,'RG RADIO');
 assert.equal(h.applied.at(-1).theme,'Guest');
 assert.equal(h.requests.filter(r=>r.path==='logout').length,1);
 assert.equal(h.sessionStorage.getItem('minka:media-session:v2'),null);
});
for(const event of ['visibilitychange','focus','pageshow','online'])test('sleeping past handover locks immediately on '+event,async()=>{
 const h=harness({now:Date.parse('2026-09-09T04:59:00Z')});await tick();h.c.navigator.onLine=false;
 h.advance(90*60000);h.wake(event);await tick();assert.equal(h.api.getSession(),null);assert.equal(h.api.getRadio().favorites.length,0);
 assert.equal(h.applied.at(-1).theme,'Guest');
});
test('expired handover cannot be extended by reload or a late server response',async()=>{
 const expired=Date.parse('2026-09-09T05:00:00Z');
 const h=harness({now:expired+1,savedPatch:{dutyEndsAt:expired}});await tick();assert.equal(h.api.getSession(),null);assert.ok(!h.requests.some(r=>r.path==='session'||r.path==='radio/load'));
 const response=deferred(),late=harness({now:expired-1000,fetchHandler:path=>path==='radio/load'?response.promise:undefined});await tick();late.advance(2000);response.resolve({data:{favorites:['late'],settings:{theme:'Wrong'}}});await tick();assert.equal(late.api.getSession(),null);assert.ok(!late.applied.some(x=>x.theme==='Wrong'));
});
test('an action after a delayed handover timer cannot save under the previous profile',async()=>{
 const h=harness({now:Date.parse('2026-09-09T04:59:00Z')});await tick();h.advance(61000);assert.equal(h.api.change({type:'favorite-add',id:'test'}),false);await tick();assert.ok(!h.requests.some(r=>r.path==='radio/change'));
});
test('explicit login starts favorites in profile order; refreshing settings does not restart playback',async()=>{
 const h=harness({restored:false});await h.signIn();assert.deepEqual(h.started,[['record:a']]);await h.api.refresh();assert.equal(h.started.length,1);
});
test('favorite start waits for catalogue and cannot run for a logged-out account',async()=>{
 const h=harness({restored:false,stationsReady:false});await h.signIn();assert.equal(h.started.length,0);h.stationsReady();assert.deepEqual(h.started,[['record:a']]);h.stationsReady();assert.equal(h.started.length,1);
 const old=harness({restored:false,stationsReady:false});await old.signIn();await old.api.logout(false);old.stationsReady();assert.equal(old.started.length,0);
});
test('a profile with no favorites leaves the current station alone',async()=>{
 const h=harness({restored:false,fetchHandler:path=>path==='radio/load'?{data:{favorites:[],settings:{},lastStation:''}}:undefined});await h.signIn();assert.equal(h.started.length,0);
});

test('calendar refresh preserves PIN entry until the day or selected worker changes',()=>{
 const start=code.indexOf(" window.addEventListener('message',e=>{"),end=code.indexOf(' window.__mkUnifiedMedia=',start);
 let listener,renders=0;const frame={contentWindow:{}};
 const c=vm.createContext({window:{addEventListener:(name,fn)=>listener=fn},location:{origin:'http://localhost'},$:()=>frame,session:null,selected:{name:'Alpha Test'},rosterDate:'08.09.2026',generation:0,busy:false,dialog:{open:true},norm:s=>s.toLowerCase(),roster:()=>c.window.__minkaLastSelectedDayState,renderWorkers(){renders++;},status(){},emit(){}});
 vm.runInContext(code.slice(start,end),c);
 const refresh=(date,workers=[{name:'Alpha Test'}])=>listener({origin:'http://localhost',source:frame.contentWindow,data:{type:'minka-calendar-selected-day-state',payload:{date,workers}}});
 refresh('08.09.2026');assert.equal(renders,0);assert.equal(c.selected.name,'Alpha Test');assert.equal(c.generation,0);
 refresh('09.09.2026');assert.equal(renders,1);assert.equal(c.selected,null);assert.equal(c.generation,1);
 c.selected={name:'Alpha Test'};c.busy=true;
 refresh('09.09.2026',[{name:'Beta Test'}]);assert.equal(renders,2);assert.equal(c.selected,null);assert.equal(c.generation,2);assert.equal(c.busy,false);
});

test('local preview restores unsupported layout fields per account after server save and reauthentication',async()=>{
 const storage=memory(),fetchHandler=path=>path==='radio/change'||path==='radio/load'?{data:{favorites:['record:a'],settings:{theme:'Saved'},lastStation:''}}:undefined;
 const h=harness({storage,fetchHandler});await tick();
 h.api.change({type:'settings',settings:{layout:'clean',vizFrame:'off'}});await tick();
 assert.equal(h.api.getRadio().settings.layout,'clean');assert.equal(h.api.getRadio().settings.vizFrame,'off');
 await h.api.logout(false);assert.equal(h.api.getRadio().settings.layout,undefined);
 const again=harness({storage,fetchHandler});await tick();assert.equal(again.applied.at(-1).layout,'clean');assert.equal(again.applied.at(-1).vizFrame,'off');
 const other=harness({storage,fetchHandler,savedPatch:{workerId:'beta'}});await tick();assert.equal(other.applied.at(-1).layout,undefined);
 again.api.change({type:'settings',settings:{eq:'chill'}});await tick();assert.equal(again.api.getRadio().settings.vizFrame,'off');
 again.api.change({type:'reset-look'});await tick();assert.equal(storage.getItem('minka:media-local-look:alpha'),null);
});
test('migrated image framing is queued once into the authenticated shared profile',async()=>{
 const imageCrops={'kalendars/data/radio-skins/marble-bust.webp':{x:.1,y:-.2,zoom:.8}};
 const h=harness({restored:false,fetchHandler:(path,data)=>path==='radio/change'?{data:{favorites:[],settings:{imageCrops:data.operation.settings.imageCrops}}}:undefined});
 h.c.window.rgTheme.snapshot=()=>({imageCrops});
 await h.signIn();await tick();
 const saves=h.requests.filter(r=>r.path==='radio/change');assert.equal(saves.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(saves[0].data.operation.settings.imageCrops)),imageCrops);
 assert.deepEqual(JSON.parse(JSON.stringify(h.api.getRadio().settings.imageCrops)),imageCrops);
});
