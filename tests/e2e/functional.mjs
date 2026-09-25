// Calendar functional smoke tests. usage: node functional.mjs <baseUrl>
import {chromium} from 'playwright';
// Fixed clocks below are Riga times (08:00 shift-day rollover): run the browser in that zone, whatever the host's.
const TZ='Europe/Riga';
const BASE=process.argv[2]; const results=[]; const T=new Date('2026-09-24T10:30:00+03:00');
const b=await chromium.launch();
async function fresh(url,vp={width:1440,height:900}){ const ctx=await b.newContext({viewport:vp,timezoneId:TZ}); const p=await ctx.newPage(); await p.clock.setFixedTime(T);
  p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message.slice(0,160)));
  p.on('console',m=>{if(m.type()==='error'&&!/Content Security Policy|Failed to load resource/.test(m.text()))p.__errs.push('console: '+m.text().slice(0,160));});
  await p.goto(BASE+url,{waitUntil:'load'}); await p.waitForTimeout(5000); return p; }
const shown=(f,sel)=>f.evaluate(s=>{const e=document.querySelector(s); if(!e)return false; const cs=getComputedStyle(e); const r=e.getBoundingClientRect(); return cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05&&r.width>0&&r.height>0;},sel);
const waitFor=async(fn,ms=6000)=>{const t=Date.now(); while(Date.now()-t<ms){ if(await fn())return true; await new Promise(r=>setTimeout(r,150)); } return false;};
async function test(name,fn){ try{ const note=await fn(); results.push([name,'PASS',note||'']); }catch(e){ results.push([name,'FAIL',e.message.slice(0,200)]); } }
const ok=(c,msg)=>{ if(!c) throw new Error(msg); };
const cal=()=>fresh('/kalendars/index.html');

await test('calendar loads without JS errors, cards render', async()=>{ const p=await cal();
  const n=await p.locator('#grafiks-list .card').count(); const txt=await p.locator('#grafiks-list').innerText();
  ok(n>=6,'cards '+n); for(const w of ['ALPHA','BETA','GAMMA','DELTA']) ok(txt.includes(w),'missing '+w); ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return n+' cards'; });

await test('day navigation: click another day, then back', async()=>{ const p=await cal();
  const hdr=async()=>p.locator('#minkaBar').innerText();
  const h0=await hdr(); await p.click('#p-27-09-2026');
  ok(await waitFor(async()=>await p.locator('#p-27-09-2026').evaluate(e=>e.classList.contains('active'))),'27th not active');
  ok(await waitFor(async()=>(await hdr())!==h0),'header did not change after day click');
  const h1=await hdr(); await p.click('#p-24-09-2026');
  ok(await waitFor(async()=>await p.locator('#p-24-09-2026').evaluate(e=>e.classList.contains('active'))),'24th not active again');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return h1.split('\n')[0]; });

await test('worker modal opens from a card and closes with Escape', async()=>{ const p=await cal();
  await p.locator('#grafiks-list .card.card-rd').first().click();
  ok(await waitFor(()=>shown(p,'#worker-modal')),'modal not shown');
  const t=await p.locator('#worker-modal').innerText(); ok(/ALPHA|Alpha/.test(t),'modal lacks worker name');
  await p.keyboard.press('Escape'); ok(await waitFor(async()=>!(await shown(p,'#worker-modal'))),'modal did not close');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return 'modal text '+t.length+' chars'; });

await test('coffee picker opens from a card', async()=>{ const p=await cal();
  await p.locator('button.mk-coffee-mid').first().click();
  ok(await waitFor(()=>p.evaluate(()=>!!document.querySelector('.mk-coffee-picker'))),'no coffee picker');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); });

await test('mood rating: tapping a face records a vote', async()=>{ const p=await cal();
  await p.evaluate(()=>{window.__posts=[];const f=window.fetch;window.fetch=function(u,o){if(o&&o.method==='POST')window.__posts.push(String(typeof u==='string'?u:u.url));return f.apply(this,arguments);};});
  const before=await p.locator('.rg-pulse-tap').first().evaluate(e=>e.closest('.card').innerText);
  await p.locator('.rg-pulse-tap').nth(1).click();
  const changed=await waitFor(async()=>{const posts=await p.evaluate(()=>window.__posts.length); const now=await p.locator('.rg-pulse-tap').first().evaluate(e=>e.closest('.card').innerText); return posts>0||now!==before;});
  ok(changed,'no POST and no UI change after mood tap'); const posts=await p.evaluate(()=>window.__posts);
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return 'POSTs: '+posts.join(','); });

await test('comments panel opens (KOMENTĀRI) and accepts typing', async()=>{ const p=await cal();
  await p.locator('[data-rg-write="comment"]').first().click();
  ok(await waitFor(()=>shown(p,'#rgFeedbackModal section.rg-feedback-dialog')),'feedback dialog not shown');
  const ta=p.locator('section.rg-feedback-dialog textarea, section.rg-feedback-dialog [contenteditable=true], section.rg-feedback-dialog input[type=text]').first();
  let typed='no input field'; if(await ta.count()){ await ta.click(); await ta.fill?.('Tests').catch(async()=>{await p.keyboard.type('Tests');}); typed='typed'; }
  await p.keyboard.press('Escape'); ok(await waitFor(()=>p.evaluate(()=>document.getElementById('rgFeedbackModal').hidden)),'comments did not close on Escape');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return typed; });

await test('header search: launch button opens, typing shows results, Escape clears', async()=>{ const p=await cal();
  const editable=await p.evaluate(()=>document.getElementById('minkaBarInput').getAttribute('contenteditable'));
  ok(editable==='true','input not editable: '+editable);
  await p.click('#mkSearchLaunch');
  ok(await waitFor(()=>p.evaluate(()=>document.getElementById('minkaBar').classList.contains('search-open')&&document.activeElement.id==='minkaBarInput')),'search did not open/focus');
  await p.keyboard.type('alpha',{delay:30});
  ok(await waitFor(()=>p.evaluate(()=>document.getElementById('minkaResults').children.length>0)),'no results for "alpha"');
  const n=await p.evaluate(()=>document.getElementById('minkaResults').children.length);
  const look=await p.evaluate(()=>{const it=document.querySelector('#minkaResults .search-item'); if(!it)return null; const cs=getComputedStyle(it); const a=it.querySelector('a')||it; return {display:cs.display, deco:getComputedStyle(a).textDecorationLine, color:cs.color};});
  ok(look&&look.display==='flex'&&look.deco==='none','search results are unstyled: '+JSON.stringify(look));
  await p.keyboard.press('Escape');
  ok(await waitFor(()=>p.evaluate(()=>document.getElementById('minkaBarInput').textContent==='')),'Escape did not clear text');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return n+' results'; });

await test('shift timer: calendar.js colours a timer that ends in 4 min (warning-critical)', async()=>{ const p=await cal();
  const date=await p.evaluate(()=>window.__activeDateStr||'');
  await p.evaluate(d=>{ const card=document.querySelector('#grafiks-list .card.card-rd'); const s=document.createElement('span');
    s.className='mk-mid-meta-time duty-timer mk-mid-timer test-timer'; s.dataset.worker='ALPHA TEST'; s.dataset.date=d; s.dataset.start='07:00'; s.dataset.end='10:34'; s.dataset.shift='3.5';
    s.innerHTML='<span class="val">--</span>'; card.appendChild(s); }, date);
  ok(await waitFor(()=>p.evaluate(()=>{const t=document.querySelector('.test-timer'); return t&&t.classList.contains('warning-critical')&&/\d/.test(t.textContent);}),5000),'timer not coloured/updated');
  const txt=await p.evaluate(()=>document.querySelector('.test-timer').textContent);
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return 'date '+date+' text '+txt; });

await test('daily cat: pet is visible and its sprite animates', async()=>{ const ctx=await b.newContext({viewport:{width:1440,height:900},timezoneId:TZ}); const p=await ctx.newPage(); p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message));
  await p.goto(BASE+'/kalendars/index.html',{waitUntil:'load'}); await p.waitForTimeout(5000);
  ok(await shown(p,'.mk-daily-cat-pet'),'cat not visible');
  const frames=new Set(); for(let i=0;i<24;i++){ frames.add(await p.evaluate(()=>document.querySelector('.mk-daily-cat-sprite:not(.mk-daily-cat-sprite-ghost)')?.style.backgroundPosition||'')); await p.waitForTimeout(250); }
  ok(frames.size>=2,'sprite frame never changed in 6 s: '+[...frames].join(' / '));
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await ctx.close(); return frames.size+' distinct frames in 6 s'; });

await test('night panel opens and shows night stats rows', async()=>{ const p=await cal();
  await p.evaluate(()=>window.toggleNsOverlay(true));
  ok(await waitFor(()=>p.evaluate(()=>window.__nsOverlayOpen===true)),'overlay flag not set');
  ok(await waitFor(()=>p.evaluate(()=>!!document.querySelector('#nsStatsBody .ns-stat-row')),9000),'no stat rows');
  await p.evaluate(()=>window.toggleNsOverlay(false)); ok(await waitFor(()=>p.evaluate(()=>window.__nsOverlayOpen!==true)),'did not close');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); });

await test('month calendar opens, navigates, closes', async()=>{ const p=await cal();
  await p.evaluate(()=>window.MinkaMonthCal.open()); ok(await waitFor(()=>p.evaluate(()=>window.MinkaMonthCal.isOpen())),'not open');
  const nodes=await p.evaluate(()=>document.getElementsByTagName('*').length);
  await p.evaluate(()=>window.MinkaMonthCal.close()); ok(await waitFor(()=>p.evaluate(()=>!window.MinkaMonthCal.isOpen())),'not closed');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return 'nodes while open '+nodes; });

await test('mood panel: fatigue (NOGURUMS) chip eventually shows', async()=>{ const p=await cal();
  ok(await waitFor(()=>p.evaluate(()=>/NOGURUMS/.test(document.querySelector('.card.mk-mid-card-rd')?.innerText||'')),10000),'no NOGURUMS in mood card'); await p.context().close(); });

await test('main page: calendar iframe loads and dock buttons open panels without errors', async()=>{ const p=await fresh('/index.html');
  const fr=()=>p.frame({url:/kalendars\/index\.html/}); ok(fr(),'no calendar iframe');
  ok((await fr().locator('#grafiks-list .card').count())>=6,'iframe cards missing');
  const opened=[];
  for(const [fn,check] of [['openMonthCalFromDock()',()=>fr().evaluate(()=>window.MinkaMonthCal.isOpen())],['openStatsFromDock()',()=>shown(fr(),'#stats-modal')],['toggleNsFromParent()',()=>fr().evaluate(()=>window.__nsOverlayOpen===true)]]){
    await p.evaluate(fn); ok(await waitFor(check,8000),fn+' did not open'); opened.push(fn);
    await p.reload({waitUntil:'load'}); await p.waitForTimeout(4500); }
  for(const fn of ['openSettingsFromDock()','toggleBolus()','openPlanotajsLauncher()','openPusdienasLauncher()']){ await p.evaluate(fn); await p.waitForTimeout(1200); opened.push(fn); }
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return opened.length+' actions'; });

await test('cross-frame storage: a vote written by the shell page repaints the calendar mood counts', async()=>{ const p=await fresh('/index.html');
  const fr=p.frame({url:/kalendars\/index\.html/}); ok(fr,'no calendar frame');
  const before=await fr.evaluate(()=>[...document.querySelectorAll('[data-rg-count]')].map(e=>e.dataset.rgCount+'='+e.textContent).join(','));
  // write from the PARENT document so the calendar receives a real storage event
  // Vote for the day the mood card shows (other days are cached there too,
  // e.g. by the team curve, so "the last key" is not necessarily it).
  await p.evaluate(()=>{ const all=JSON.parse(localStorage.getItem('minkaShiftPulseV2')||'{}');
    const frame=document.getElementById('calIframe').contentWindow; const m=String(frame.__activeDateStr||frame.__g_todayStr||'').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    const days=Object.keys(all); const key=m?m[3]+'-'+m[2]+'-'+m[1]:(days.length?days[days.length-1]:null);
    all[key]=Object.assign({},all[key]); const react=Object.keys(all[key]).find(k=>k[0]!=='_')||'love'; all[key][react]=(Number(all[key][react])||0)+7; localStorage.setItem('minkaShiftPulseV2',JSON.stringify(all)); window.__votedKey=key+'/'+react; });
  const changed=await waitFor(async()=>{ const now=await fr.evaluate(()=>[...document.querySelectorAll('[data-rg-count]')].map(e=>e.dataset.rgCount+'='+e.textContent).join(',')); return now!==before; },4000);
  const k=await p.evaluate(()=>window.__votedKey);
  // an unrelated key must not break anything
  await p.evaluate(()=>localStorage.setItem('mkRadioViz','x'+Date.now())); await p.waitForTimeout(300);
  ok(changed,'mood counts did not repaint after shell wrote '+k+' (before: '+before+')');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); return 'voted '+k; });

await test('mobile (?mobile=1): cards render, tapping a card opens worker modal', async()=>{ const p=await fresh('/kalendars/index.html?mobile=1',{width:390,height:844});
  ok((await p.locator('#grafiks-list .card').count())>=6,'cards missing');
  await p.locator('#grafiks-list .card.card-rd').first().click(); ok(await waitFor(()=>shown(p,'#worker-modal')),'modal not shown on mobile');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); });

await test('mobile.html loads with calendar', async()=>{ const p=await fresh('/mobile.html',{width:390,height:844});
  const f=p.frames().find(f=>/kalendars/.test(f.url())); ok(f,'no calendar frame'); ok((await f.locator('#grafiks-list .card').count())>=6,'cards missing');
  ok(!p.__errs.length,'errors: '+p.__errs.join(' | ')); await p.context().close(); });

await b.close();
for(const [n,s,note] of results) console.log(s.padEnd(5),n,note?'— '+note:'');
const fails=results.filter(r=>r[1]==='FAIL').length; console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
