// The birthday badge must settle in one place on mobile (it used to swap rows every frame).
// usage: node mobile-badge.mjs <baseUrl>
import {chromium} from 'playwright';
const base=process.argv[2]; const b=await chromium.launch(); const fails=[];
for(const [q,expected] of [['?mobile=1','mk-search-date-meta'],['?mobile=1&mv2=0','mk-search-date-main']]){
  const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage();
  await ctx.addInitScript(()=>{ window.__moves=0; document.addEventListener('DOMContentLoaded',()=>new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes) if(n.id==='mkBdayBadge') window.__moves++; }).observe(document.body,{childList:true,subtree:true})); });
  await p.goto(base+'/kalendars/index.html'+q,{waitUntil:'load'}); await p.waitForTimeout(7000);
  const r=await p.evaluate(()=>({moves:window.__moves,parent:document.getElementById('mkBdayBadge')?.parentElement?.className||''}));
  if(r.moves>3) fails.push(q+': badge moved '+r.moves+' times'); if(!r.parent.includes(expected)) fails.push(q+': badge in '+r.parent+', expected '+expected);
  await ctx.close(); }
await b.close(); console.log(fails.length?'FAIL mobile-badge: '+fails.join('; '):'PASS mobile-badge: settles once, correct row with and without mobile-v2'); process.exit(fails.length?1:0);
