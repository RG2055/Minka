/* Independent implementation of McCauley et al. (2024),
 * doi:10.3389/fenvh.2024.1362755, Tables 1–2, equations 4 and 9.
 * Research comparison only. Native PVT lapses / KSS, no product fatigue index.
 * Coordinates: q = p - p_f - xi*h; state = [q, u, h, kappa].
 */
(function(root){
 'use strict';
 const HOUR=3600000, STEP=1/12, equilibria=new Map();
 function parameters(metric='PVT'){
  if(!['PVT','KSS'].includes(metric))throw new Error('Unknown metric');
  const k=metric==='KSS';
  return Object.freeze({metric,floor:k?1:0,aw:k?.22:.028,as:k?.037:.26,beta:.26,zeta:1.31,
   etaW:.0126,etaS:.0126*(k?22.02:20.2)/(24-(k?22.02:20.2)),nu:1.37,gamma:.71,
   lambda:.49,muW:k?.82:.466,muS:-1.5,phase:21.2,xi:k?.51:1.09});
 }
 function rates(y,hour,sleep,p){
  const [q,u,h,k]=y,c=Math.sin(2*Math.PI*(hour-p.phase)/24),g=k*(c+(sleep?p.muS:p.muW));
  return [-(sleep?p.as:p.aw)*(q-p.beta*(u-(sleep?1/p.etaS:0)))+p.xi*g,
   sleep?p.etaS*(p.zeta*p.xi*q-u)+1:p.etaW*(u-p.zeta*p.xi*q),
   -p.nu*(h-(sleep?p.gamma*q:0)),sleep?-p.lambda*k:p.lambda*k*(1-k)];
 }
 function advance(y,hours,hour,sleep,p,maxStep=STEP){
  if(!Number.isFinite(hours)||hours<0||!(maxStep>0)||!Number.isFinite(maxStep))throw new Error('Invalid integration interval');
  y=y.slice();const n=Math.ceil(hours/maxStep),dt=n?hours/n:0;
  for(let i=0;i<n;i++){
   const t=hour+i*dt,a=rates(y,t,sleep,p);
   const b=rates(y.map((v,j)=>v+a[j]*dt/2),t+dt/2,sleep,p);
   const c=rates(y.map((v,j)=>v+b[j]*dt/2),t+dt/2,sleep,p);
   const d=rates(y.map((v,j)=>v+c[j]*dt),t+dt,sleep,p);
   y=y.map((v,j)=>v+dt*(a[j]+2*b[j]+2*c[j]+d[j])/6);
  }
  if(y.some(v=>!Number.isFinite(v)))throw new Error('Nonfinite recovery state');
  return y;
 }
 function equilibrium(p){
  if(equilibria.has(p.metric))return equilibria.get(p.metric).slice();
  let y=[1,10,0,.1];
  for(let i=0;i<2000;i++){
   const next=advance(advance(y,16,7,false,p),8,23,true,p);
   if(Math.max(...next.map((v,j)=>Math.abs(v-y[j])))<1e-9){equilibria.set(p.metric,next);return next.slice();}
   y=next;
  }
  throw new Error('Baseline did not converge');
 }
 function observe(y,p,asleep){
  return {metric:p.metric,value:y[0]+p.floor+p.xi*y[2],inertia:p.xi*y[2],asleep};
 }
 function timeline(base,metric='PVT'){
  const p=parameters(metric),first=new Date(base.start),hour=first.getHours()+first.getMinutes()/60;
  if(hour!==7)throw new Error('Comparison baseline must start at 07:00');
  let y=equilibrium(p);const points=[];
  // Inputs are already merged and latency-adjusted by the shared sleep timeline.
  for(const segment of base.segments){
   for(let a=segment.start;a<segment.end;){
    // Stop at UTC hour boundaries as well as sleep boundaries: DST cannot smear
    // a change in local circadian phase over a long integration interval.
    const b=Math.min(segment.end,a+STEP*HOUR,(Math.floor(a/HOUR)+1)*HOUR);
    points.push({start:a,end:b,y,asleep:segment.asleep});
    const d=new Date(a),h=d.getHours()+d.getMinutes()/60+d.getSeconds()/3600;
    y=advance(y,(b-a)/HOUR,h,segment.asleep,p);a=b;
   }
  }
  return {metric,at(t){
   if(t<base.start||t>base.end)throw new Error('Sample outside recovery timeline');
   let lo=0,hi=points.length-1;
   while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(points[mid].start<=t)lo=mid;else hi=mid-1;}
   const v=points[lo],d=new Date(v.start),h=d.getHours()+d.getMinutes()/60+d.getSeconds()/3600;
   return observe(advance(v.y,(t-v.start)/HOUR,h,v.asleep,p),p,v.asleep&&t<v.end);
  }};
 }
 root.MinkaRecoveryModel={parameters,rates,advance,equilibrium,observe,timeline};
})(globalThis);
