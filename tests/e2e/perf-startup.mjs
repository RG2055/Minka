// Startup cost of the shell + calendar iframe on a throttled CPU (synthetic audit server).
// usage: node perf-startup.mjs <baseUrl> [runs=3] [cpuRate=4] [out.json]
// Reports medians: requests, bytes (raw, and gzip of same-origin JS/CSS/HTML), time until the
// calendar shows its cards, main-thread time (script/style/layout), long tasks, heap, DOM nodes.
import {chromium} from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const [BASE='http://127.0.0.1:8012',RUNS='3',RATE='4',OUT]=process.argv.slice(2);
const T=new Date('2026-09-24T10:30:00+03:00');
const gz=new Map(); const gzipOf=file=>{if(!gz.has(file))gz.set(file,fs.existsSync(file)?zlib.gzipSync(fs.readFileSync(file),{level:6}).length:0);return gz.get(file);};
const b=await chromium.launch();
async function run(){
  const ctx=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Europe/Riga'});
  await ctx.addInitScript(()=>{window.__lt=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(e.duration);}).observe({type:'longtask',buffered:true});}catch(_){}});
  // PERF_PAGE=/kalendars/index.html measures another page; PERF_BLOCK=regex: serve matching CSS as empty (what-if experiment for lazy loading).
  if(process.env.PERF_BLOCK)await ctx.route(new RegExp(process.env.PERF_BLOCK),r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const p=await ctx.newPage(); await p.clock.setFixedTime(T);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
  const cdp=await ctx.newCDPSession(p);
  await cdp.send('Performance.enable'); await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:+RATE});
  const reqs=new Map();
  cdp.on('Network.responseReceived',e=>{const r=reqs.get(e.requestId)||{};r.url=e.response.url;r.type=e.type;reqs.set(e.requestId,r);});
  cdp.on('Network.loadingFinished',e=>{const r=reqs.get(e.requestId)||{};r.bytes=e.encodedDataLength;reqs.set(e.requestId,r);});
  const t0=Date.now();
  await p.goto(BASE+(process.env.PERF_PAGE||'/index.html'),{waitUntil:'load'}); const loadMs=Date.now()-t0;
  let usableMs=null;
  for(let i=0;i<(process.env.PERF_NOCARDS?0:300)&&usableMs===null;i++){
    const f=p.frames().find(f=>/kalendars\/index\.html/.test(f.url()))||(process.env.PERF_PAGE?p.mainFrame():null);
    if(f&&await f.evaluate(()=>document.querySelectorAll('#grafiks-list .card').length>=4).catch(()=>false))usableMs=Date.now()-t0;
    else await p.waitForTimeout(100);
  }
  await p.waitForTimeout(6000);
  const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  let lt=[]; for(const f of p.frames()) lt=lt.concat(await f.evaluate(()=>window.__lt||[]).catch(()=>[]));
  const list=[...reqs.values()].filter(r=>r.url);
  const local=list.filter(r=>r.url.startsWith(BASE));
  const by=t=>local.filter(r=>r.type===t);
  const sum=a=>a.reduce((s,r)=>s+(r.bytes||0),0);
  const gzSum=a=>a.reduce((s,r)=>s+gzipOf(path.join(root,decodeURIComponent(new URL(r.url).pathname))),0);
  const res={loadMs,usableMs,requests:list.length,localRequests:local.length,
    scripts:by('Script').length,styles:by('Stylesheet').length,
    jsKB:Math.round(sum(by('Script'))/1024),cssKB:Math.round(sum(by('Stylesheet'))/1024),totalKB:Math.round(sum(local)/1024),
    jsGzKB:Math.round(gzSum(by('Script'))/1024),cssGzKB:Math.round(gzSum(by('Stylesheet'))/1024),textGzKB:Math.round(gzSum(local.filter(r=>/Script|Stylesheet|Document/.test(r.type)))/1024),
    scriptMs:Math.round(m.ScriptDuration*1000),styleMs:Math.round(m.RecalcStyleDuration*1000),layoutMs:Math.round(m.LayoutDuration*1000),taskMs:Math.round(m.TaskDuration*1000),
    longTasks:lt.length,blockingMs:Math.round(lt.reduce((s,d)=>s+Math.max(0,d-50),0)),
    heapMB:+(m.JSHeapUsedSize/1048576).toFixed(1),nodes:m.Nodes,listeners:m.JSEventListeners,errors:errs.length};
  await ctx.close(); return res;
}
const runs=[]; for(let i=0;i<+RUNS;i++){runs.push(await run()); console.error('run',i+1,JSON.stringify(runs.at(-1)));}
await b.close();
const median=k=>{const v=runs.map(r=>r[k]).filter(x=>x!==null).sort((a,b)=>a-b);return v.length?v[v.length>>1]:null;};
const out=Object.fromEntries(Object.keys(runs[0]).map(k=>[k,median(k)]));
console.log(JSON.stringify({base:BASE,cpuRate:+RATE,runs:runs.length,median:out},null,1));
if(OUT)fs.writeFileSync(OUT,JSON.stringify({median:out,runs},null,1));
