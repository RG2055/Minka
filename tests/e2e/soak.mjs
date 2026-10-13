// Long-session check: repeat ordinary actions and watch what survives garbage collection.
// usage: node soak.mjs <baseUrl> [cycles=30] [sampleEvery=5] [out.json]
// Every cycle switches days, opens/closes the night panel, month calendar, worker modal,
// search and the radio. After every `sampleEvery` cycles it forces GC and records heap,
// DOM nodes, listeners, live setInterval timers and requestAnimationFrame calls per second.
// A healthy app levels off; steady growth per cycle points at a leak. CI: 30 cycles; soak: 300+.
import {chromium} from 'playwright'; import fs from 'node:fs';
const [BASE='http://127.0.0.1:8012',CYCLES='30',EVERY='5',OUT]=process.argv.slice(2);
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Europe/Riga'});
const p=await ctx.newPage(); await p.clock.setFixedTime(new Date('2026-09-24T10:30:00+03:00'));
// Count live intervals and rAF callbacks in every frame (shell and calendar).
// After the clock: its own timer shims would replace ours otherwise.
await p.addInitScript(()=>{
  const live=new Set(), si=setInterval, ci=clearInterval, raf=requestAnimationFrame; let frames=0;
  window.setInterval=function(...a){const id=si.apply(this,a);live.add(id);return id;};
  window.clearInterval=function(id){live.delete(id);return ci.call(this,id);};
  window.requestAnimationFrame=function(cb){frames++;return raf.call(this,cb);};
  window.__soak=()=>({intervals:live.size,frames});
});
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,160)));
const cdp=await ctx.newCDPSession(p); await cdp.send('Performance.enable');
await p.goto(BASE+'/index.html?visible=1',{waitUntil:'load'}); await p.waitForTimeout(8000);
const cal=()=>p.frame({url:/kalendars\/index\.html/});
const step=async(fn)=>{try{await fn();}catch(e){errs.push('step: '+e.message.slice(0,160));}};
async function cycle(i){
  const f=cal(); const day=['27','25','24'][i%3];
  await step(()=>f.click(`#p-${day}-09-2026`)); await p.waitForTimeout(500);
  await step(()=>f.evaluate(()=>window.toggleNsOverlay(true))); await p.waitForTimeout(1200);
  await step(()=>f.evaluate(()=>window.toggleNsOverlay(false))); await p.waitForTimeout(500);
  await step(()=>f.evaluate(()=>window.MinkaMonthCal.open())); await p.waitForTimeout(600);
  await step(()=>f.evaluate(()=>window.MinkaMonthCal.close())); await p.waitForTimeout(400);
  await step(()=>f.locator('#grafiks-list .card.card-rd').first().click({timeout:3000})); await p.waitForTimeout(600);
  await step(()=>p.keyboard.press('Escape')); await p.waitForTimeout(300);
  await step(()=>f.click('#hxTop .hx-search',{timeout:3000})); await step(()=>p.keyboard.type('alpha')); await p.waitForTimeout(300);
  await step(()=>p.keyboard.press('Escape')); await step(()=>p.keyboard.press('Escape')); await p.waitForTimeout(300);
  await step(()=>p.evaluate(()=>window.toggleRadio())); await p.waitForTimeout(1500);
  await step(()=>p.evaluate(()=>window.toggleRadio())); await p.waitForTimeout(1000);
}
async function sample(cycleNo){
  await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(300);
  const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const before=await Promise.all(p.frames().map(f=>f.evaluate(()=>window.__soak&&window.__soak()).catch(()=>null)));
  await p.waitForTimeout(1000);
  const after=await Promise.all(p.frames().map(f=>f.evaluate(()=>window.__soak&&window.__soak()).catch(()=>null)));
  const intervals=after.reduce((s,x)=>s+(x?x.intervals:0),0);
  const rafPerSec=after.reduce((s,x,i)=>s+(x&&before[i]?x.frames-before[i].frames:0),0);
  return {cycle:cycleNo,heapMB:+(m.JSHeapUsedSize/1048576).toFixed(2),nodes:m.Nodes,listeners:m.JSEventListeners,documents:m.Documents,frames:m.Frames,intervals,rafPerSec,errors:errs.length};
}
const samples=[await sample(0)]; console.log(JSON.stringify(samples[0]));
for(let i=1;i<=+CYCLES;i++){ await cycle(i); if(i%+EVERY===0){ samples.push(await sample(i)); console.log(JSON.stringify(samples.at(-1))); } }
await b.close();
const first=samples[1]||samples[0], last=samples.at(-1), n=Math.max(1,last.cycle-first.cycle);
const growth={heapKBPerCycle:+((last.heapMB-first.heapMB)*1024/n).toFixed(1),nodesPerCycle:+((last.nodes-first.nodes)/n).toFixed(1),listenersPerCycle:+((last.listeners-first.listeners)/n).toFixed(1),intervalsPerCycle:+((last.intervals-first.intervals)/n).toFixed(2)};
console.log('growth after warm-up (cycle '+first.cycle+' → '+last.cycle+'):',JSON.stringify(growth));
if(errs.length) console.log('errors:\n  '+[...new Set(errs)].join('\n  '));
if(OUT) fs.writeFileSync(OUT,JSON.stringify({samples,growth,errors:[...new Set(errs)]},null,1));
