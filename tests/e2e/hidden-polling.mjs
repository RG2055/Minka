// News/weather must not poll while the app is hidden, and must catch up on return.
// usage: node hidden-polling.mjs <baseUrl>
import {chromium} from 'playwright';
const base=process.argv[2]; const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.clock.install({time:new Date('2026-09-24T10:30:00+03:00')}); await p.clock.resume();
await p.addInitScript(()=>{ window.__polls={news:0,weather:0}; document.addEventListener('DOMContentLoaded',()=>{ const f=window.fetch; window.fetch=function(u){ const s=String(typeof u==='string'?u:u&&u.url); if(/rss2json/.test(s))window.__polls.news++; if(/openweathermap/.test(s))window.__polls.weather++; return f.apply(this,arguments); }; },{once:true}); });
await p.goto(base+'/kalendars/index.html',{waitUntil:'load'}); await p.waitForTimeout(4000);
const polls=()=>p.evaluate(()=>({...window.__polls}));
const setHidden=h=>p.evaluate(h=>{ Object.defineProperty(document,'hidden',{configurable:true,get:()=>h}); Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>h?'hidden':'visible'}); document.dispatchEvent(new Event('visibilitychange')); },h);
const a=await polls(); await setHidden(true); await p.clock.fastForward('21:00'); await p.waitForTimeout(1500); const hid=await polls();
await setHidden(false); await p.waitForTimeout(2500); const back=await polls(); await b.close();
const fails=[]; if(hid.news!==a.news||hid.weather!==a.weather) fails.push('polled while hidden '+JSON.stringify({a,hid}));
if(!(back.news>hid.news&&back.weather>hid.weather)) fails.push('no catch-up on return '+JSON.stringify({hid,back}));
console.log(fails.length?'FAIL hidden-polling: '+fails.join('; '):'PASS hidden-polling: 0 requests while hidden, catch-up on return'); process.exit(fails.length?1:0);
