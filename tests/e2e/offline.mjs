import {chromium} from 'playwright';
const BASE=process.argv[2]; const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.route(u=>!u.href.startsWith(BASE),r=>r.abort());
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await p.goto(BASE+'/index.html',{waitUntil:'load'}); await p.evaluate(async()=>{await navigator.serviceWorker.ready;}); await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:15000}).catch(()=>{}); await p.waitForTimeout(3000); await p.goto(BASE+'/kalendars/index.html',{waitUntil:'load'});
await p.evaluate(async()=>{await navigator.serviceWorker.ready;}); await p.waitForTimeout(1500);
await p.reload({waitUntil:'load'}); await p.waitForTimeout(6000); // second visit: assets pass through SW and get cached
const controlled=await p.evaluate(()=>!!navigator.serviceWorker.controller);
await ctx.setOffline(true); const failed=[]; p.on('requestfailed',r=>{ if(r.url().startsWith(BASE)) failed.push(r.url().replace(BASE,'')); });
await p.reload({waitUntil:'load'}); await p.waitForTimeout(5000);
const f=p.mainFrame();
const info=f?await f.evaluate(()=>({sheets:[...document.styleSheets].filter(s=>{try{return s.cssRules.length>0}catch{return false}}).length, pageCss:[...document.querySelectorAll('link[href*="css/page/"]')].filter(l=>l.sheet&&l.sheet.cssRules.length).length, pageJsLoaded:typeof window.mkGetRadioSkin==='function', calendarJs:typeof window.MinkaMonthCal})):null;
const r={controlled,calendarFrame:!!f,info,failedSameOrigin:failed.slice(0,8),failedCount:failed.length,errs:errs.slice(0,3)};
const ok=controlled&&info&&info.pageJsLoaded&&info.calendarJs==='object'&&!failed.length&&!errs.length;
console.log((ok?'PASS':'FAIL')+' offline: '+JSON.stringify(r));
await b.close(); process.exit(ok?0:1);
