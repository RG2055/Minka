// Which object types grow during a long session: heap snapshot after warm-up vs after N more cycles.
// usage: node heap-diff.mjs <baseUrl> [warmup=20] [cycles=120]   (reuses the soak.mjs actions)
import {chromium} from 'playwright';
const [BASE='http://127.0.0.1:8012',WARM='20',MORE='120']=process.argv.slice(2);
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Europe/Riga'});
const p=await ctx.newPage(); await p.clock.setFixedTime(new Date('2026-09-24T10:30:00+03:00'));
const cdp=await ctx.newCDPSession(p); await cdp.send('HeapProfiler.enable');
await p.goto(BASE+'/index.html?visible=1',{waitUntil:'load'}); await p.waitForTimeout(8000);
const cal=()=>p.frame({url:/kalendars\/index\.html/}); const step=async fn=>{try{await fn();}catch(_){}};
async function cycle(i){ const f=cal(); const day=['27','25','24'][i%3];
  await step(()=>f.click(`#p-${day}-09-2026`)); await p.waitForTimeout(400);
  await step(()=>f.evaluate(()=>window.toggleNsOverlay(true))); await p.waitForTimeout(1000);
  await step(()=>f.evaluate(()=>window.toggleNsOverlay(false))); await p.waitForTimeout(400);
  await step(()=>f.evaluate(()=>window.MinkaMonthCal.open())); await p.waitForTimeout(500);
  await step(()=>f.evaluate(()=>window.MinkaMonthCal.close())); await p.waitForTimeout(300);
  await step(()=>f.locator('#grafiks-list .card.card-rd').first().click({timeout:3000})); await p.waitForTimeout(500);
  await step(()=>p.keyboard.press('Escape')); await p.waitForTimeout(200);
  await step(()=>f.click('#hxTop .hx-search',{timeout:3000})); await step(()=>p.keyboard.type('alpha')); await p.waitForTimeout(300);
  await step(()=>p.keyboard.press('Escape')); await step(()=>p.keyboard.press('Escape')); await p.waitForTimeout(200);
  await step(()=>p.evaluate(()=>window.toggleRadio())); await p.waitForTimeout(1200);
  await step(()=>p.evaluate(()=>window.toggleRadio())); await p.waitForTimeout(800); }
async function snapshot(){
  await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(500);
  let chunks=[]; const on=e=>chunks.push(e.chunk); cdp.on('HeapProfiler.addHeapSnapshotChunk',on);
  await cdp.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false}); cdp.off('HeapProfiler.addHeapSnapshotChunk',on);
  const s=JSON.parse(chunks.join('')); chunks=null; const m=s.snapshot.meta, F=m.node_fields.length;
  const iType=m.node_fields.indexOf('type'), iName=m.node_fields.indexOf('name'), iSize=m.node_fields.indexOf('self_size'), types=m.node_types[0];
  const agg=new Map();
  for(let i=0;i<s.nodes.length;i+=F){ const t=types[s.nodes[i+iType]]; const n=t==='object'||t==='native'?s.strings[s.nodes[i+iName]]:'('+t+')';
    const k=n.length>60?n.slice(0,60):n; const a=agg.get(k)||[0,0]; a[0]++; a[1]+=s.nodes[i+iSize]; agg.set(k,a); }
  return agg; }
for(let i=1;i<=+WARM;i++) await cycle(i);
const A=await snapshot(); console.error('snapshot A after',WARM);
for(let i=1;i<=+MORE;i++) await cycle(i);
const B=await snapshot(); await b.close();
const rows=[...new Set([...A.keys(),...B.keys()])].map(k=>{const a=A.get(k)||[0,0],c=B.get(k)||[0,0];return [k,c[0]-a[0],c[1]-a[1]];}).filter(r=>r[2]>0).sort((x,y)=>y[2]-x[2]);
const total=[...B.values()].reduce((s,v)=>s+v[1],0)-[...A.values()].reduce((s,v)=>s+v[1],0);
console.log(`heap self-size delta over ${MORE} cycles: ${(total/1024).toFixed(0)} KB`);
for(const [k,n,sz] of rows.slice(0,30)) console.log(`${(sz/1024).toFixed(1).padStart(8)} KB  ${String(n).padStart(6)}×  ${k}`);
