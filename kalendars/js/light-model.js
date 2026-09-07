/* Forger99 equations adapted from Arcascope/circadian (MIT).
 * Copyright (c) [2023] [Kevin Hannay]. See ../assets/licenses/LICENSE-arcascope.txt.
 * Phase sensitivity only, not melatonin concentration or a fatigue score.
 */
(function(root){
 'use strict';
 const H=3600000, TAU=2*Math.PI, cache=new Map();
 function rates(y,lux){
  const [x,xc,n]=y,alpha=.05*Math.sqrt(lux/9500);
  const b=33.75*(1-n)*alpha*(1-.4*x)*(1-.4*xc);
  return [Math.PI/12*(xc+b),Math.PI/12*(.23*(xc-4/3*xc**3)-x*((24/(.99669*24.2))**2+.55*b)),60*(alpha*(1-n)-.0075*n)];
 }
 function advance(state,hours,lux,step=1/12){
  if(!Number.isFinite(lux)||lux<0||!Number.isFinite(hours)||hours<0||!Number.isFinite(step)||step<=0)throw Error('Invalid light input');
  let y=state.slice();const n=Math.ceil(hours/step),dt=n?hours/n:0;
  for(let i=0;i<n;i++){
   const a=rates(y,lux),b=rates(y.map((v,j)=>v+a[j]*dt/2),lux);
   const c=rates(y.map((v,j)=>v+b[j]*dt/2),lux),d=rates(y.map((v,j)=>v+c[j]*dt),lux);
   y=y.map((v,j)=>v+dt*(a[j]+2*b[j]+2*c[j]+d[j])/6);
  }
  if(y.some(v=>!Number.isFinite(v)))throw Error('Invalid circadian state');
  return y;
 }
 function baseline(lux){
  if(cache.has(lux))return cache.get(lux).slice();
  let y=[-.0843259,-1.09607546,.45584306];
  // Entrained state at 07:00, 16h light / 8h dark. Assumed, not personal phase.
  for(let i=0;i<300;i++){
   const next=advance(advance(y,16,lux),8,0);
   if(Math.max(...next.map((v,j)=>Math.abs(v-y[j])))<1e-8){cache.set(lux,next);return next.slice();}
   y=next;
  }
  throw Error('Light baseline did not converge');
 }
 const phase=y=>Math.atan2(-y[1],y[0]);
 function delayHours(y,reference){
  const difference=phase(y)-phase(reference);
  return -Math.atan2(Math.sin(difference),Math.cos(difference))*24/TAU;
 }
 function lightAt(time,asleep,onDuty,settings){
  if(asleep)return 0;
  if(onDuty)return settings.workLux;
  const d=new Date(time),h=d.getHours()+d.getMinutes()/60;
  return h>=7&&h<23?settings.dayLux:10;
 }
 function simulate(base,work,end,settings){
  if(!Number.isFinite(end)||end<base.start||end>base.end)throw Error('Invalid light interval');
  // Keep the shared 07:00 start and sleep boundaries, including sleep latency.
  const first=new Date(base.start);if(first.getHours()!==7||first.getMinutes()!==0)throw Error('Light baseline must start at 07:00');
  let y=baseline(settings.dayLux),reference=y.slice();
  const boundaries=[base.start,end,...base.segments.flatMap(s=>[s.start,s.end]),...work.flatMap(w=>[+w.start,+w.end])];
  // Hour boundaries preserve local 07/23 transitions and DST in actual elapsed time.
  for(let t=(Math.floor(base.start/H)+1)*H;t<end;t+=H)boundaries.push(t);
  const points=[...new Set(boundaries.filter(t=>t>=base.start&&t<=end))].sort((a,b)=>a-b);
  let si=0,wi=0;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],mid=(a+b)/2;
   while(si<base.segments.length-1&&base.segments[si].end<=a)si++;
   while(wi<work.length&&+work[wi].end<=a)wi++;
   const onDuty=wi<work.length&&+work[wi].start<=mid&&+work[wi].end>mid;
   const lux=lightAt(mid,base.segments[si].asleep,onDuty,settings);
   const h=new Date(mid).getHours(),regularLux=h>=7&&h<23?settings.dayLux:0;
   y=advance(y,(b-a)/H,lux);reference=advance(reference,(b-a)/H,regularLux);
  }
  return {delayHours:delayHours(y,reference),phase:phase(y),settings:{...settings}};
 }
 root.MinkaLightModel={rates,advance,baseline,phase,delayHours,lightAt,simulate};
})(globalThis);
