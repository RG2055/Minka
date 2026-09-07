/* UMP caffeine-free PVT-lapse model, Ramakrishnan et al. 2016,
 * doi:10.5665/sleep.6164, Tables 2–3. Independent equation implementation.
 * Inputs are sleep/awake intervals, NOT work/rest or hormone measurements.
 * Native output is modelled group-average number of PVT responses slower than 500 ms.
 * The application's 0–100 display is a separate, unvalidated UI index.
 */
(function(root){
  'use strict';
  const HOUR=3600000;
  const parameters=Object.freeze({U:18.4,wakeTau:40,sleepTau:2.1,debtTau:168,kappa:3.3,phase:2.3,S0:0.5,L0:0});
  function advance(state,hours,asleep){
    if(!Number.isFinite(hours)||hours<0)throw new Error('Invalid elapsed sleep-model time');
    const {U,wakeTau,sleepTau,debtTau}=parameters;
    const floor=-0.11*U;
    let {S,L}=state;
    if(!Number.isFinite(S)||!Number.isFinite(L))throw new Error('Invalid sleep-model state');
    if(!asleep)return {S:U-(U-S)*Math.exp(-hours/wakeTau),L:Math.max(floor,U-(U-L)*Math.exp(-hours/debtTau))};
    // Integrate the moving lower asymptote exactly, then its clamped tail.
    const crossing=L<=floor?0:debtTau*Math.log((L+2*U)/(floor+2*U));
    const h=Math.min(hours,crossing),ew=Math.exp(-h/sleepTau),ed=Math.exp(-h/debtTau);
    S=-2*U+(2*U+S)*ew+(2*U+L)*debtTau/(debtTau-sleepTau)*(ed-ew);
    L=Math.max(floor,-2*U+(L+2*U)*ed);
    if(hours>h)S=floor+(S-floor)*Math.exp(-(hours-h)/sleepTau);
    return {S,L};
  }
  function circadian(time){
    const d=new Date(time),h=d.getHours()+d.getMinutes()/60+d.getSeconds()/3600;
    return [0.97,0.22,0.07,0.03,0.001].reduce((s,a,i)=>s+a*Math.sin(2*Math.PI*(i+1)*(h+parameters.phase)/24),0);
  }
  function observation(state,time){
    const circadianLapses=parameters.kappa*circadian(time),lapses=state.S+circadianLapses;
    // Explicit product scale: 0 PVT lapses -> 0, 20 lapses -> 100. Not a percentage,
    // probability, clinical boundary or a published UMP output scale.
    const score=Math.max(0,Math.min(100,Math.round(lapses*5)));
    return {score,lapses,homeostaticLapses:state.S,circadianLapses,debt:state.L/parameters.U};
  }
  function merge(spans){
    const out=[];
    for(const p of spans.filter(p=>Number.isFinite(p.start)&&Number.isFinite(p.end)&&p.end>p.start).sort((a,b)=>a.start-b.start)){
      const last=out[out.length-1];
      if(last&&p.start<=last.end)last.end=Math.max(last.end,p.end);
      else out.push({start:p.start,end:p.end});
    }
    return out;
  }
  function timeline(start,end,opportunities,latencyMinutes=15){
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||!Number.isFinite(latencyMinutes)||latencyMinutes<0)throw new Error('Invalid sleep timeline');
    // Merge before latency: unchanged revisions must not cause another sleep onset.
    const sleep=merge(opportunities).map(p=>({start:Math.max(start,p.start+latencyMinutes*60000),end:Math.min(end,p.end)})).filter(p=>p.end>p.start);
    const points=[...new Set([start,end,...sleep.flatMap(p=>[p.start,p.end])])].sort((a,b)=>a-b);
    let state={S:parameters.S0,L:parameters.L0},si=0;
    const segments=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];
      while(si<sleep.length&&sleep[si].end<=a)si++;
      const asleep=!!sleep[si]&&sleep[si].start<=a&&sleep[si].end>=b;
      segments.push({start:a,end:b,asleep,state});state=advance(state,(b-a)/HOUR,asleep);
    }
    return {start,end,sleep,segments,at(time){
      if(time<start||time>end)throw new Error('Sample outside sleep timeline');
      let lo=0,hi=segments.length-1;
      while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(segments[mid].start<=time)lo=mid;else hi=mid-1;}
      const p=segments[lo],s=advance(p.state,(time-p.start)/HOUR,p.asleep);
      return {...observation(s,time),asleep:p.asleep&&time<p.end};
    }};
  }
  root.MinkaSleepModel={parameters,advance,circadian,observation,merge,timeline};
})(globalThis);
