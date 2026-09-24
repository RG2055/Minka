// usage: node regress.mjs <baseUrl> <outDir>
import {chromium} from 'playwright'; import fs from 'node:fs';
const [BASE,OUT]=process.argv.slice(2); fs.mkdirSync(OUT,{recursive:true});
const T=new Date('2026-09-24T10:30:00+03:00');
const KILL='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
const main=(name,fn,vp={width:1440,height:900})=>({name,url:'/index.html',vp,fn});
const kal=(name,fn,vp={width:1440,height:900},q='')=>({name,url:'/kalendars/index.html'+q,vp,fn});
const states=[
 main('main-default'), main('main-1024',null,{width:1024,height:768}), main('main-1920',null,{width:1920,height:1080}),
 main('main-monthcal',"openMonthCalFromDock()"), main('main-stats',"openStatsFromDock()"), main('main-settings',"openSettingsFromDock()"),
 main('main-night',"toggleNsFromParent()"), main('main-bolus',"toggleBolus()"), main('main-planotajs',"openPlanotajsLauncher()"),
 main('main-pusdienas',"openPusdienasLauncher()"), main('main-radio',"radioIdleClick()"), main('main-radio-menu',"radioIdleClick(); setTimeout(()=>toggleMenu(true),1500)"),
 kal('kal-default'), kal('kal-worker-modal',"document.querySelector('#grafiks-list .card').click()"),
 kal('kal-night',"toggleNsOverlay(true)"),
 kal('kal-mobile',null,{width:390,height:844},'?mobile=1'),
 kal('kal-radio-open',"document.documentElement.classList.add('host-radio-open')"),
 {...kal('kal-radio-open-hover',"document.documentElement.classList.add('host-radio-open')"),hover:'.cards-subgrid .card'},
 {...kal('kal-card-hover'),hover:'.cards-subgrid .card'},
 {name:'mobile-html',url:'/mobile.html',vp:{width:390,height:844}},
];
const b=await chromium.launch(); const report={};
for(const s of states){
  const ctx=await b.newContext({viewport:s.vp,deviceScaleFactor:1}); const p=await ctx.newPage();
  await p.clock.setFixedTime(T);
  await ctx.addInitScript(()=>{const cnt={};const h=str=>{let x=2166136261;for(let i=0;i<str.length;i++){x^=str.charCodeAt(i);x=Math.imul(x,16777619);}return x>>>0;};
    const mb=a=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
    Math.random=function(){const fr=(new Error().stack||'').split('\n')[2]||'';const m=fr.match(/at\s+([^\s(]+)?\s*\(?.*\/([^/?:]+)(?:\?[^:]*)?:/);const fn=(m&&m[1]&&!/[\/:]/.test(m[1]))?m[1]:'';const k=m?(fn+'@'+m[2]):'?';cnt[k]=(cnt[k]||0)+1;return mb(h(k)+cnt[k]*7919);};});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,160)));
  p.on('console',m=>{if(m.type()==='error'&&!/Content Security Policy|Failed to load resource/.test(m.text()))errs.push('CONSOLE '+m.text().slice(0,160));});
  await p.goto(BASE+s.url,{waitUntil:'load'}); await p.waitForTimeout(6000);
  if(s.fn){ await p.evaluate(s.fn).catch(e=>errs.push('ACTION '+e.message.slice(0,120))); await p.waitForTimeout(3500); }
  { let prev='',same=0; for(let i=0;i<30&&same<3;i++){ const cur=(await Promise.all(p.frames().map(f=>f.evaluate(()=>document.body?document.body.innerText:'').catch(()=>'')))).join('|'); same=cur===prev?same+1:0; prev=cur; await p.waitForTimeout(500);} }
  for(const f of p.frames()) await f.addStyleTag({content:KILL}).catch(()=>{});
  if(s.hover){ await p.hover(s.hover+' >> nth=0'); await p.waitForTimeout(700); }
  await p.waitForTimeout(400);
  await p.screenshot({path:`${OUT}/${s.name}.png`});
  const info=[]; for(const f of p.frames()){ try{ info.push(await f.evaluate(()=>({path:location.pathname,nodes:document.getElementsByTagName('*').length,text:(document.body?.innerText||'').replace(/\s+/g,' ').trim()}))); }catch{} }
  report[s.name]={errs,frames:info.filter(i=>i.path!=='blank'&&i.nodes>5)};
  await ctx.close();
}
fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1)); await b.close();
console.log(Object.entries(report).map(([k,v])=>`${k}: errs=${v.errs.length} nodes=${v.frames.map(f=>f.nodes).join('+')}`).join('\n'));
