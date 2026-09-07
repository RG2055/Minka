import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.TZ='Europe/Riga';
const c=vm.createContext({Date});
vm.runInContext(fs.readFileSync(new URL('../js/sleep-model.js',import.meta.url),'utf8'),c);
const m=c.MinkaSleepModel,HOUR=3600000;

test('published lapse parameters are kept separate from the display index',()=>{
 assert.equal(m.parameters.U,18.4);assert.equal(m.parameters.wakeTau,40);
 assert.equal(m.parameters.sleepTau,2.1);assert.equal(m.parameters.debtTau,168);
 const t=+new Date('2026-09-08T08:00:00+03:00');
 const raw=m.observation({S:5,L:0},t);
 assert.equal(raw.score,Math.max(0,Math.min(100,Math.round(raw.lapses*5))));
});

// Independent small-step midpoint integration of dS/dt and dL/dt.
function numeric(initial,hours,sleep){
 let {S,L}=initial;const p=m.parameters,dt=hours/60000;
 const rates=(s,l)=>({S:sleep?(l-s)/p.sleepTau:(p.U-s)/p.wakeTau,L:((sleep?-2:1)*p.U-l)/p.debtTau});
 for(let i=0;i<60000;i++){
  const a=rates(S,L),midL=Math.max(-.11*p.U,L+a.L*dt/2),b=rates(S+a.S*dt/2,midL);
  S+=b.S*dt;L=Math.max(-.11*p.U,L+b.L*dt);
 }
 return {S,L};
}
test('exact propagation agrees with independently integrated ODEs, including debt-floor crossing',()=>{
 for(const sleeping of [true,false])for(const initial of [{S:8,L:3},{S:4,L:-1.9}])for(const h of [1.5,6,20]){
  const a=m.advance(initial,h,sleeping),b=numeric(initial,h,sleeping);
  assert.ok(Math.abs(a.S-b.S)<0.0001,`${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  assert.ok(Math.abs(a.L-b.L)<0.0001);
 }
});
test('repeated short sleep accumulates impairment and recovery reduces it',()=>{
 let restricted={S:.5,L:0},control={S:.5,L:0};
 const daily=[];
 for(let i=0;i<7;i++){
  restricted=m.advance(m.advance(restricted,19,false),5,true);
  control=m.advance(m.advance(control,16,false),8,true);daily.push(restricted.S);
 }
 assert.ok(daily.at(-1)>daily[0]);assert.ok(restricted.S>control.S);assert.ok(restricted.L>control.L);
 const recovered=m.advance(m.advance(restricted,14,false),10,true);
 assert.ok(recovered.S<restricted.S);assert.ok(recovered.L<restricted.L);
});
test('identical adjacent opportunities are merged before one sleep latency is applied',()=>{
 const t=+new Date('2026-09-08T00:00:00+03:00');
 const a=m.timeline(t,t+8*HOUR,[{start:t,end:t+6*HOUR}],15);
 const b=m.timeline(t,t+8*HOUR,[{start:t,end:t+3*HOUR},{start:t+3*HOUR,end:t+6*HOUR}],15);
 assert.equal(a.at(t+8*HOUR).lapses,b.at(t+8*HOUR).lapses);
 assert.equal(b.sleep.length,1);assert.equal(b.sleep[0].start,t+15*60000);
 assert.throws(()=>a.at(t-1));
});
test('circadian oscillator repeats by local clock and is independent of night-panel bounds',()=>{
 assert.equal(m.circadian(+new Date('2026-09-08T03:00:00+03:00')),m.circadian(+new Date('2026-09-09T03:00:00+03:00')));
});
