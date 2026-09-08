import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/nightsplit.js', import.meta.url), 'utf8');
const start = source.indexOf('  var NS_STATS_API_PATH=');
const end = source.indexOf('  function bedCareNormalize', start);
assert.ok(start > 0 && end > start);
const stats = nights => ({ok:true, nights, parts:{ALPHA:[1,2,3,4], BETA:[4,3,2,1]}, beds:{}});
const slots = name => [{w:{name, fs:42}}];
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup({age, hidden=false, auth=true}={}) {
  let now = 1800000000000;
  const storage = new Map();
  if(age !== undefined) storage.set('minkaNightStatsV1', JSON.stringify({at:now-age, data:stats(10)}));
  const box = {innerHTML:'Ielādē…'};
  const document = {hidden, getElementById:() => box};
  const requests = [], timers = new Map();
  let id = 0;
  class Clock extends Date { static now(){return now;} }
  const c = vm.createContext({
    document, Date:Clock, AbortController,
    localStorage:{getItem:k=>storage.get(k), setItem:(k,v)=>storage.set(k,v)},
    setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},
    clearTimeout:id=>timers.delete(id),
    escHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'), roomEmoji:()=>'',
    window:{MinkaApi:{getToken:()=>auth?'fixture':null, apiFetch:(path,options)=>new Promise(resolve=>requests.push({path,options,resolve}))}}
  });
  vm.runInContext(source.slice(start,end),c);
  return {c, box, document, requests, storage, timers,
    async advance(ms){now+=ms;for(const [key,t] of [...timers])if(t.at<=now){timers.delete(key);t.fn();}await tick();},
    reply(i, data, ok=true){requests[i].resolve({ok,json:async()=>data});}
  };
}

test('expired history paints immediately while one shared refresh is delayed', async()=>{
  const h=setup({age:13*3600000});
  h.c.nsRenderStats(slots('ALPHA'));
  assert.match(h.box.innerHTML,/Vēsture: 10 naktis/);
  assert.match(h.box.innerHTML,/saglabāta/);
  h.c.nsWarmStats();
  await tick();
  assert.equal(h.requests.length,1);
  h.reply(0,stats(20));await tick();
  assert.match(h.box.innerHTML,/Vēsture: 20 naktis/);
  assert.doesNotMatch(h.box.innerHTML,/saglabāta|Ielādē/);
});

test('fresh cache does not make a network request', async()=>{
  const h=setup({age:1000});
  h.c.nsRenderStats(slots('ALPHA'));await tick();
  assert.match(h.box.innerHTML,/Vēsture: 10 naktis/);
  assert.equal(h.requests.length,0);
});

test('warm request can finish before panel opens', async()=>{
  const h=setup();h.document.getElementById=()=>null;
  h.c.nsWarmStats();await tick();
  assert.equal(h.requests.length,1);
  h.reply(0,stats(30));await tick();
  h.document.getElementById=()=>h.box;
  h.c.nsRenderStats(slots('ALPHA'));
  assert.match(h.box.innerHTML,/Vēsture: 30 naktis/);
  await tick();assert.equal(h.requests.length,1);
});

test('cold panel joins prefetch and paints only the latest selected people', async()=>{
  const h=setup();h.c.nsWarmStats();h.c.nsRenderStats(slots('ALPHA'));
  h.c.nsRenderStats(slots('BETA'));await tick();
  assert.equal(h.requests.length,1);
  assert.equal(h.box.innerHTML,'Ielādē…');
  h.reply(0,stats(20));await tick();
  assert.match(h.box.innerHTML,/BETA/);assert.doesNotMatch(h.box.innerHTML,/ALPHA/);
});

for(const mode of ['empty','detached']) test(`late response cannot repaint ${mode} panel`,async()=>{
  const h=setup();h.c.nsRenderStats(slots('ALPHA'));await tick();
  if(mode==='empty') h.c.nsRenderStats([]);
  else h.document.getElementById=()=>({innerHTML:''});
  const before=h.box.innerHTML;h.reply(0,stats(20));await tick();
  assert.equal(h.box.innerHTML,before);
});

for(const mode of ['http','invalid','timeout','body-timeout']) test(`cached history survives ${mode} and remains labelled as saved`,async()=>{
  const h=setup({age:13*3600000});h.c.nsRenderStats(slots('ALPHA'));await tick();
  if(mode==='http')h.reply(0,stats(20),false);
  if(mode==='invalid')h.reply(0,{ok:true,parts:[]});
  if(mode==='body-timeout'){h.requests[0].resolve({ok:true,json:()=>new Promise(()=>{})});await tick();}
  if(mode.includes('timeout'))await h.advance(15000);
  await tick();
  assert.match(h.box.innerHTML,/Vēsture: 10 naktis/);
  assert.match(h.box.innerHTML,/saglabāta/);
  assert.equal(JSON.parse(h.storage.get('minkaNightStatsV1')).data.nights,10);
  assert.equal(h.timers.size,0);
});

test('hung cold request times out, retries after cooldown, ignores late old response',async()=>{
  const h=setup();h.c.nsRenderStats(slots('ALPHA'));await tick();
  await h.advance(15000);
  assert.equal(h.requests[0].options.signal.aborted,true);
  assert.match(h.box.innerHTML,/neizdevās/);
  h.c.nsStatsFetch();await tick();assert.equal(h.requests.length,1);
  await h.advance(30000);h.c.nsRenderStats(slots('ALPHA'));await tick();
  assert.equal(h.requests.length,2);h.reply(1,stats(40));await tick();
  h.reply(0,stats(5));await tick();
  assert.match(h.box.innerHTML,/Vēsture: 40 naktis/);
  assert.equal(JSON.parse(h.storage.get('minkaNightStatsV1')).data.nights,40);
});

test('hidden page and missing authentication do not prefetch',async()=>{
  for(const options of [{hidden:true},{auth:false}]){
    const h=setup(options);h.c.nsWarmStats();await tick();assert.equal(h.requests.length,0);
  }
});

test('reopening an unchanged night plan retries history after a timeout',async()=>{
  const h=setup(), workers=[{name:'ALPHA',fs:42},{name:'BETA',fs:42}];
  let renders=0;
  Object.assign(h.c,{
    st:null, _nsLastRenderKey:'', _nsSortMode:'fatigue', _nsIdleRender:0,
    activeDateKey:()=> '08.09.2026', pullRoomState(){}, resetColours(){}, getW:()=>workers,
    fat:w=>w, applySavedDayState:w=>({sh:0,ei:0,workers:w}),
    calc:w=>w.map((worker,i)=>({w:worker,s:i*100,e:(i+1)*100})),
    scheduleFitRoomBlocks(){}, bedCareFetch:async()=>({}), bedCareRenderPerch(){},
    refreshFlowLiveMarker(){}, publishPlan(){},
    render:()=>{renders++;h.c.nsRenderStats(h.c.st.sl);}
  });
  h.c.window.__nsOverlayOpen=true;
  h.box.querySelector=()=>true;
  const a=source.indexOf('  function update(){'), b=source.indexOf('  function init(){',a);
  vm.runInContext(source.slice(a,b),h.c);
  h.c.update();await tick();await h.advance(15000);
  assert.match(h.box.innerHTML,/neizdevās/);
  await h.advance(30000);
  h.c.update();await tick();
  assert.equal(renders,1,'reopening should reuse the built plan');
  assert.equal(h.requests.length,2,'reused plan still retries history');
  h.reply(1,stats(50));await tick();
  assert.match(h.box.innerHTML,/Vēsture: 50 naktis/);
});
