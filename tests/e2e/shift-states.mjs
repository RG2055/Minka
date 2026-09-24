// Shift lifecycle scenarios with timed fixture data. usage: node shiftstates.mjs <base> <outJson>
import {chromium} from 'playwright'; import fs from 'node:fs';
const [BASE,OUT]=process.argv.slice(2);
const WORKERS=`[{name:'ALPHA TEST',shift:'12',startTime:'08:00',endTime:'20:00',type:'DIENA'},{name:'BETA TEST',shift:'24',startTime:'08:00',endTime:'08:00'},{name:'GAMMA TEST',shift:'12',startTime:'20:00',endTime:'08:00',type:'NAKTS'},{name:'DELTA TEST',shift:'8',startTime:'08:00',endTime:'16:00',type:'DIENA'}]`;
const b=await chromium.launch(); const out={};
async function open(time,{live=false,vp={width:1440,height:900},q=''}={}){ const ctx=await b.newContext({viewport:vp}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
  await ctx.route('**/__fixture.js',async r=>{ const res=await r.fetch(); let js=await res.text(); const before=js;
    js=js.replace("workers:names.map(name=>({name,shift:'24'}))","workers:"+WORKERS); if(js===before) throw new Error('fixture pattern not found'); await r.fulfill({response:res,body:js}); });
  if(live){ await p.clock.install({time:new Date(time)}); await p.clock.resume(); } else await p.clock.setFixedTime(new Date(time));
  await p.goto(BASE+'/kalendars/index.html'+q,{waitUntil:'load'}); await p.waitForTimeout(6000); p.__errs=errs; return p; }
const snap=p=>p.evaluate(()=>{ const t=e=>e?e.textContent.replace(/\s+/g,' ').trim():null;
  const cards=[...document.querySelectorAll('#grafiks-list .card')].filter(c=>!c.classList.contains('rg-feedback-card')).map(c=>{ const tm=c.querySelector('.mk-mid-timer'); const mt=c.querySelector('.mk-mid-meta-time');
    return {who:(c.getAttribute('data-worker')||t(c.querySelector('.name-main,.card-name'))||'').slice(0,20), sec:c.closest('.cards-section')?.querySelector('.cards-section-label-rd')?'RD':'RG', timer:tm?t(tm):null, warn:tm?[...tm.classList].filter(x=>x.startsWith('warning')).join(','):null, meta:t(mt), done:c.classList.contains('duty-done'), live:c.classList.contains('card-live')}; });
  const side=[...document.querySelectorAll('#radiographers-duty, #radiologists-duty')].map(s=>t(s).slice(0,220));
  return {todayStr:window.__g_todayStr||null, activeDate:window.__activeDateStr||null, activePill:document.querySelector('.pill.active')?.id||null, dateTitle:t(document.getElementById('grafiks-dateTitle')), timers:document.querySelectorAll('.duty-timer').length, cards, side}; });
async function scenario(name,time,fn,opts){ const p=await open(time,opts); if(fn) await fn(p); const s=await snap(p); s.errors=p.__errs; out[name]=s; await p.context().close(); return s; }
await scenario('active_1030','2026-09-24T10:30:00+03:00');
await scenario('warning_1557','2026-09-24T15:57:00+03:00');
await scenario('just_ended_1600','2026-09-24T16:00:30+03:00');
await scenario('old_completed_2230','2026-09-24T22:30:00+03:00');
await scenario('rollover_0759','2026-09-25T07:59:00+03:00');
await scenario('rollover_0800','2026-09-25T08:00:30+03:00');
await scenario('selected_future_25','2026-09-24T10:30:00+03:00',async p=>{ await p.click('#p-25-09-2026'); await p.waitForTimeout(2500); });
await scenario('selected_past_23','2026-09-24T10:30:00+03:00',async p=>{ await p.click('#p-23-09-2026'); await p.waitForTimeout(2500); });
await scenario('back_to_today','2026-09-24T10:30:00+03:00',async p=>{ await p.click('#p-23-09-2026'); await p.waitForTimeout(2000); await p.click('#p-24-09-2026'); await p.waitForTimeout(2500); });
// live transition across 16:00 with the real clock running (the path enhanceTimers used to race)
await scenario('live_cross_1600','2026-09-24T15:59:52+03:00',async p=>{ const before=await snap(p); p.__before=before; await p.waitForTimeout(12000); },{live:true});
await scenario('mobile_active_1030','2026-09-24T10:30:00+03:00',null,{vp:{width:390,height:844},q:'?mobile=1'});
fs.writeFileSync(OUT,JSON.stringify(out,null,1)); await b.close();
for(const [k,v] of Object.entries(out)) console.log(k.padEnd(20),'today',v.todayStr,'active',v.activeDate,'timers',v.timers,'|',v.cards.map(c=>`${c.sec}:${c.who.split(' ')[0]}=${c.timer||c.meta}${c.warn?'('+c.warn+')':''}`).join(' '),'| errs',v.errors.length);
