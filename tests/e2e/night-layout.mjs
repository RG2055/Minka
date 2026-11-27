// Night split layout check (desktop): every card variant and window size, nothing overlapping or outside its box,
// beds inside their rooms, the panel laid out by CSS (no script scale), resizing back and forth lands on the same layout,
// the LED layer of a passed part covers exactly the picture window.  usage: node night-layout.mjs <baseUrl>
import {chromium} from 'playwright';
const BASE=process.argv[2]||'http://127.0.0.1:8012', TZ='Europe/Riga';
const SIZES=[[1100,700],[1280,720],[1366,768],[1470,664],[1470,745],[1672,941],[1920,1080]];
// name lengths seen on the roster, emoji or initials, a picture or a colour look
const NAMES=['ANNA','VIKTORIJA','JEVGĒNIJA','KONSTANTĪNS'];
const b=await chromium.launch(); let fails=0; const out=[];
const fail=m=>{fails++; out.push('FAIL '+m);};

async function open(vp,time){
  const ctx=await b.newContext({viewport:{width:vp[0],height:vp[1]},timezoneId:TZ}); const p=await ctx.newPage();
  await p.clock.setFixedTime(new Date(time)); p.__errs=[]; p.on('pageerror',e=>p.__errs.push(e.message.slice(0,160)));
  await p.goto(BASE+'/kalendars/index.html',{waitUntil:'load'}); await p.waitForTimeout(4500);
  await p.evaluate(()=>window.toggleNsOverlay(true)); await p.waitForTimeout(2500); return {p,ctx};
}
// boxes that must not cross each other inside a card, and must stay in the card
const CHECK=()=>{
  const R=e=>{const r=e.getBoundingClientRect(); return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};};
  const hit=(a,c)=>!(a.r<=c.l+.5||a.l>=c.r-.5||a.b<=c.t+.5||a.t>=c.b-.5);
  const res=[];
  const canvas=document.querySelector('.ns-panel-canvas');
  if(canvas.style.transform && canvas.style.transform!=='none') res.push('canvas scaled by script: '+canvas.style.transform);
  const cv=R(canvas);
  document.querySelectorAll('.ns-cards-row .nsc-full-card').forEach((card,i)=>{
    const c=R(card), parts=[...card.querySelectorAll('.nsc-full-top,.nsc-full-time,.nsc-full-meta>.nsc-full-fat,.nsc-full-dur,.nsc-desc,.nsc-duration-emoji,.nsc-card-checklist')].filter(e=>R(e).w>0);
    parts.forEach(e=>{const r=R(e); if(r.l<c.l-1||r.r>c.r+1||r.t<c.t-1||r.b>c.b+1) res.push('card '+i+' '+e.className.split(' ')[0]+' outside the card');});
    for(let a=0;a<parts.length;a++) for(let z=a+1;z<parts.length;z++){ if(parts[a].contains(parts[z])||parts[z].contains(parts[a])) continue;
      if([parts[a],parts[z]].some(e=>e.matches('.nsc-full-fat'))&&[parts[a],parts[z]].some(e=>e.matches('.nsc-duration-emoji'))) continue;   // the energy is a badge on the emoji
      if(hit(R(parts[a]),R(parts[z]))) res.push('card '+i+' '+parts[a].className.split(' ')[0]+' x '+parts[z].className.split(' ')[0]); }
    const nm=card.querySelector('.nsc-full-name'); if(nm.scrollWidth>nm.clientWidth+1) res.push('card '+i+' name cut');
    const d=card.querySelector('.nsc-desc'); if(d && d.scrollWidth>d.clientWidth+1 && getComputedStyle(d).textOverflow!=='ellipsis') res.push('card '+i+' phase cut');
  });
  // the same rows at the same heights in every card
  const tops=[...document.querySelectorAll('.ns-cards-row .nsc-full-card')].map(c=>['.nsc-full-time','.nsc-full-meta','.nsc-full-desc'].map(s=>{const e=c.querySelector(s); return e?Math.round(R(e).t-R(c).t):-1;}).join(','));
  if(new Set(tops).size>1) res.push('rows differ: '+tops.join(' | '));
  document.querySelectorAll('.ns-room-shell').forEach(sh=>{const s=R(sh); sh.querySelectorAll('.ns-room-bed').forEach(bd=>{const r=R(bd.querySelector('.ns-room-bed-picture')||bd); if(r.l<s.l-2||r.r>s.r+2||r.t<s.t-2||r.b>s.b+2) res.push('bed outside its room');});});
  ['.ns-cards-row','.ns-room-fit','.ns-stats-box','.ns-room-cat'].forEach(s=>{const r=R(document.querySelector(s)); if(r.b>cv.b+1||r.r>cv.r+1) res.push(s+' outside the panel');});
  const sb=document.querySelector('.ns-stats-body'); if(sb.scrollHeight>sb.clientHeight+2) res.push('history rows cut');
  return res;
};
const rects=()=>[...document.querySelectorAll('.nsc-full-card,.ns-room-shell,.ns-stats-box,.ns-room-cat')].map(e=>{const r=e.getBoundingClientRect(); return [r.left,r.top,r.width,r.height].map(Math.round).join(',');}).join(';');

for(const vp of SIZES){
  const {p,ctx}=await open(vp,'2026-09-24T21:30:00+03:00');
  for(const [k,nm] of NAMES.entries()){
    for(const look of ['emoji','initials']){
      await p.evaluate(([nm,look,k])=>{
        document.querySelectorAll('.ns-cards-row .nsc-full-name').forEach(e=>{e.textContent=nm; e.style.setProperty('--nl',nm.length);});
        document.querySelectorAll('.ns-cards-row .nsc-duration-emoji').forEach(e=>{ if(look==='initials'){e.classList.add('nsc-duration-initials'); e.textContent=nm.slice(0,1)+'R';} else {e.classList.remove('nsc-duration-initials'); e.textContent=['🦖','🐈‍⬛','🎮','☀️'][k];} });
      },[nm,look,k]);
      await p.waitForTimeout(80);
      (await p.evaluate(CHECK)).forEach(m=>fail(vp.join('x')+' '+nm+' '+look+': '+m));
    }
  }
  // resizing away and back lands on the same layout (CSS only, nothing re-measured late)
  const before=await p.evaluate(rects);
  await p.setViewportSize({width:vp[0]-180,height:vp[1]-60}); await p.waitForTimeout(250);
  await p.setViewportSize({width:vp[0],height:vp[1]}); await p.waitForTimeout(250);
  const after=await p.evaluate(rects); if(before!==after) fail(vp.join('x')+': layout differs after a resize and back');
  if(p.__errs.length) fail(vp.join('x')+' errors: '+p.__errs.join(' | '));
  out.push('ok '+vp.join('x')); await ctx.close();
}
// 04:30: passed and running parts carry the LED layer, exactly over the picture window
{ const {p,ctx}=await open([1470,745],'2026-09-25T04:30:00+03:00'); await p.waitForTimeout(2500);
  const led=await p.evaluate(()=>[...document.querySelectorAll('.ns-cards-row .nsc-full-card')].map(c=>{const cv=c.querySelector('canvas.nsc-led'), d0=c.querySelector('.nsc-deco'), d=(d0&&d0.clientWidth<c.clientWidth-8)?d0:c; if(!cv) return null; const a=cv.getBoundingClientRect(), z=d.getBoundingClientRect(), x=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; let n=0; for(let i=3;i<x.length;i+=4) if(x[i]) n++; return {lit:n, dw:Math.round(Math.abs(a.width-z.width)), dl:Math.round(Math.abs(a.left-z.left))};}));
  const on=led.filter(Boolean); if(on.length<3) fail('LED layers at 04:30: '+JSON.stringify(led));
  on.forEach((l,i)=>{ if(l.lit<200) fail('LED '+i+' not lit'); if(l.dw>2||l.dl>2) fail('LED '+i+' not over the picture window '+JSON.stringify(l)); });
  out.push('LED '+JSON.stringify(led)); await ctx.close(); }
await b.close(); console.log(out.join('\n')); console.log(fails?fails+' FAIL':'ALL PASS'); process.exit(fails?1:0);
