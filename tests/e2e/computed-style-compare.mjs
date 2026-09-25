// Compare computed styles of every element between two versions in several UI states.
// usage: node computedcmp.mjs <baseA> <baseB>
import {chromium} from 'playwright';
// Fixed clocks below are Riga times (08:00 shift-day rollover): run the browser in that zone, whatever the host's.
const TZ='Europe/Riga';
const [A,B]=process.argv.slice(2); const T=new Date('2026-09-24T10:30:00+03:00');
const KILL='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
const states=[
 ['kal-default','/kalendars/index.html',null],
 ['kal-search','/kalendars/index.html',async p=>{await p.click('#mkSearchLaunch'); await p.keyboard.type('alpha',{delay:20}); await p.waitForTimeout(1200);}],
 ['kal-worker-modal','/kalendars/index.html',async p=>{await p.locator('#grafiks-list .card.card-rd').first().click(); await p.waitForTimeout(1500);}],
 ['kal-comments','/kalendars/index.html',async p=>{await p.locator('[data-rg-write="comment"]').first().click(); await p.waitForTimeout(2000);}],
 ['kal-night','/kalendars/index.html',async p=>{await p.evaluate(()=>toggleNsOverlay(true)); await p.waitForTimeout(3500);}],
 ['kal-monthcal','/kalendars/index.html',async p=>{await p.evaluate(()=>MinkaMonthCal.open()); await p.waitForTimeout(1500);}],
 ['kal-coffee','/kalendars/index.html',async p=>{await p.locator('button.mk-coffee-mid').first().click(); await p.waitForTimeout(1200);}],
 ['kal-radio-open','/kalendars/index.html',async p=>{await p.evaluate(()=>document.documentElement.classList.add('host-radio-open')); await p.waitForTimeout(800);}],
 ['kal-mobile','/kalendars/index.html?mobile=1',null,{width:390,height:844}],
 ['main-stats','/index.html',async p=>{await p.evaluate(()=>openStatsFromDock()); await p.waitForTimeout(3000);}],
 ['main-default','/index.html',null],
];
const b=await chromium.launch();
async function grab(base,[name,url,fn,vp]){ const ctx=await b.newContext({viewport:vp||{width:1440,height:900},timezoneId:TZ}); const p=await ctx.newPage(); await p.clock.setFixedTime(T);
  await ctx.addInitScript(()=>{const cnt={};const h=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return x>>>0;};const mb=a=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};Math.random=function(){const fr=(new Error().stack||'').split('\n')[2]||'';const m=fr.match(/at\s+([^\s(]+)?\s*\(?.*\/([^/?:]+)(?:\?[^:]*)?:/);const fn=(m&&m[1]&&!/[\/:]/.test(m[1]))?m[1]:'';const k=m?(fn+'@'+m[2]):'?';cnt[k]=(cnt[k]||0)+1;return mb(h(k)+cnt[k]*7919);};});
  await p.goto(base+url,{waitUntil:'load'}); await p.waitForTimeout(5500); if(fn) await fn(p);
  const out={}; for(const f of p.frames()){ try{ await f.addStyleTag({content:KILL}); await p.waitForTimeout(150);
    Object.assign(out, await f.evaluate(()=>{ const res={}; const key=e=>{const parts=[];let x=e;while(x&&x.nodeType===1&&parts.length<6){let s=x.tagName.toLowerCase();if(x.id)s+='#'+x.id;else{const c=[...x.classList].filter(c=>!/^(is-|mk-emoji-film)/.test(c)).slice(0,3).join('.');if(c)s+='.'+c;const i=[...x.parentElement?.children||[]].filter(y=>y.tagName===x.tagName).indexOf(x);s+=':'+i;}parts.unshift(s);if(x.id)break;x=x.parentElement;}return location.pathname.split('/').slice(-2,-1)+'>'+parts.join('>');};
      for(const e of document.querySelectorAll('body *')){ if(e.closest('[aria-hidden="true"] canvas'))continue; const cs=getComputedStyle(e); const o={}; for(let i=0;i<cs.length;i++){const pn=cs[i]; if(/^(transition|animation)/.test(pn))continue; o[pn]=cs.getPropertyValue(pn);} for(const pe of ['::before','::after']){const c2=getComputedStyle(e,pe); if(c2.content&&c2.content!=='none'){o[pe+' content']=c2.content;o[pe+' display']=c2.display;o[pe+' background']=c2.background;o[pe+' color']=c2.color;}} res[key(e)]=o; } return res; })); }catch(e){} }
  await ctx.close(); return out; }
let total=0;
for(const s of states.filter(x=>!process.env.ONLY||process.env.ONLY.split(',').includes(x[0]))){ const a=await grab(A,s), c=await grab(B,s); const diffs={}; let n=0, onlyA=0, onlyB=0;
  for(const k of Object.keys(a)){ if(!c[k]){onlyA++;continue;} for(const pn of Object.keys(a[k])){ if(pn==='--ambient-hue')continue; if(/mk-weather-cloud|daily-cat-sprite|ns-room-walker|ns-room-bed-zzz/.test(k)&&/transform|opacity|translate/.test(pn))continue; const norm=v=>String(v).replace(/127\.0\.0\.1:80\d\d/g,'HOST').replace(/url\("?#m[a-z0-9]+"?\)/g,'url(#ID)'); if(norm(a[k][pn])!==norm(c[k][pn])){ n++; const key=pn; (diffs[key]=diffs[key]||[]).push(k.slice(-70)+'  '+String(a[k][pn]).slice(0,50)+' → '+String(c[k][pn]).slice(0,50)); } } }
  for(const k of Object.keys(c)) if(!a[k]) onlyB++;
  total+=n; console.log(`${s[0].padEnd(16)} elements ${Object.keys(a).length}/${Object.keys(c).length}  onlyOrig ${onlyA} onlyNew ${onlyB}  differing values ${n}`);
  Object.entries(diffs).sort((x,y)=>y[1].length-x[1].length).slice(0,8).forEach(([pn,l])=>console.log(`   ${pn} ×${l.length}: ${l[0]}`)); }
console.log(total?`TOTAL differing computed values: ${total}`:'ALL COMPUTED STYLES IDENTICAL'); await b.close();
