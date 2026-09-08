import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const code=fs.readFileSync(new URL('../../js/media-profile.js',import.meta.url),'utf8');
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};};
const tick=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function harness({storage=memory(),fetchHandler,restored=true,now=Date.now(),savedPatch={}}={}){
 const elements=new Map(),events={},documentEvents={},timers=new Map(),applied=[],requests=[];let timer=0,clock=now;
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
 const window={addEventListener:(name,fn)=>{(events[name]||=[]).push(fn);},rgTheme:{snapshot:()=>({theme:'Guest'}),captureGuest:()=>({theme:'Guest'}),restoreGuest:v=>applied.push(v),applyProfile:v=>applied.push(v)},__minkaLastSelectedDayState:state};
 const c=vm.createContext({window,document,Date:ClockDate,location:{hostname:'127.0.0.1',origin:'http://127.0.0.1:8012'},navigator:{onLine:true},localStorage:storage,sessionStorage:ss,ResizeObserver:class{observe(){}},innerWidth:1000,innerHeight:800,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},AbortController,setTimeout:(fn,delay)=>{timers.set(++timer,{fn,at:clock+delay});return timer;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:false}),fetch:async(url,options)=>{
  const path=url.replace('/dezura/v2/',''),data=JSON.parse(options.body);requests.push({path,data});
  const result=await(fetchHandler?.(path,data)??(path==='session'?{session:saved}:path==='radio/load'?{data:{favorites:['record:a'],settings:{theme:'Personal'},lastStation:''}}:{ok:true,data:{favorites:['record:a'],settings:{theme:'Saved'},lastStation:''}}));
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
 }});
 vm.runInContext(code,c);
 return {api:window.__mkUnifiedMedia,c,elements,applied,requests,storage,sessionStorage:ss,brand,advance(ms,runTimers=false){clock+=ms;if(runTimers)for(const [id,t] of [...timers])if(t.at<=clock){timers.delete(id);t.fn();}},wake(event='visibilitychange'){for(const fn of (event==='visibilitychange'?documentEvents:events)[event]||[])fn();},setState(next){state=next;window.__minkaLastSelectedDayState=next;for(const fn of events.message||[])fn({origin:'http://127.0.0.1:8012',source:elements.get('calIframe').contentWindow,data:{type:'minka-calendar-selected-day-state',payload:next}});},online(){for(const fn of events.online||[])fn();}};
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
test('changing the selected day to another radiographer locks the old profile even if listed as radiologist',async()=>{
 const h=harness();await tick();h.setState({activeDateStr:'08.09.2026',rg:[{name:'Alpha Test'}],rd:[]});h.setState({activeDateStr:'09.09.2026',rg:[{name:'Beta Test'}],rd:[{name:'Alpha Test'}]});await tick();assert.equal(h.api.getSession(),null);assert.equal(h.brand.textContent,'RG RADIO');
});
test('appearance loads without a playback call and personal branding is conditional',async()=>{
 const h=harness();await tick();assert.equal(h.brand.textContent,'RADIO ALPHA');assert.equal(h.applied.at(-1).theme,'Personal');assert.ok(!h.requests.some(x=>/play/.test(x.path)));await h.api.logout(false);assert.equal(h.applied.at(-1).theme,'Guest');assert.equal(h.brand.textContent,'RG RADIO');
});

test('radio logout control appears only for an authenticated person and clears both shared-session and branding',async()=>{
 const h=harness();await tick();const exit=h.elements.get('mediaLogoutButton');assert.equal(exit.hidden,false);exit.listeners.click();await tick();assert.equal(exit.hidden,true);assert.equal(h.api.getSession(),null);assert.equal(h.brand.textContent,'RG RADIO');assert.equal(h.requests.filter(r=>r.path==='logout').length,1);
 const guest=harness({restored:false});await tick();assert.equal(guest.elements.get('mediaLogoutButton').hidden,true);
});

test('08:00 Riga handover revokes the profile even with an unchanged selected roster',async()=>{
 const h=harness({now:Date.parse('2026-09-09T04:59:00Z')});await tick();
 assert.equal(h.api.getSession().dutyEndsAt,Date.parse('2026-09-09T05:00:00Z'));
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
