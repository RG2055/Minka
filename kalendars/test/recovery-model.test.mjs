import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.TZ='Europe/Riga';
const c=vm.createContext({Date});
for(const file of ['sleep-model.js','recovery-model.js'])vm.runInContext(fs.readFileSync(new URL('../js/'+file,import.meta.url),'utf8'),c);
const m=c.MinkaRecoveryModel,H=3600000;
// Independent direct p,u,h,k equations from Table 1, compared to transformed q.
function full(y,hour,sleep,p){
 const [q,u,h,k]=y,P=q+p.floor+p.xi*h,g=k*(Math.sin(2*Math.PI*(hour-p.phase)/24)+(sleep?p.muS:p.muW));
 const dh=sleep?-p.nu*((1+p.gamma*p.xi)*h-p.gamma*(P-p.floor)):-p.nu*h;
 const dp=sleep?-p.as*((1-p.nu*p.gamma*p.xi/p.as)*(P-p.floor)-p.beta*(u-1/p.etaS))+p.xi*(p.as-p.nu*(1+p.gamma*p.xi))*h+p.xi*g:
 -p.aw*(P-p.floor-p.beta*u)+p.xi*(p.aw-p.nu)*h+p.xi*g;
 const du=sleep?p.etaS*(p.zeta*p.xi*(P-p.floor)-u)-p.etaS*p.zeta*p.xi*p.xi*h+1:
 -p.etaW*(p.zeta*p.xi*(P-p.floor)-u)+p.etaW*p.zeta*p.xi*p.xi*h;
 return [dp-p.xi*dh,du,dh,sleep?-p.lambda*k:p.lambda*k*(1-k)];
}
test('2024 transformed equations agree with the published full state equations for both metrics',()=>{
 for(const metric of ['PVT','KSS'])for(const sleep of [true,false])for(const hour of [1,8,20]){
  const p=m.parameters(metric),y=[4,15,2,.4],a=m.rates(y,hour,sleep,p),b=full(y,hour,sleep,p);
  a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-12));
 }
});
test('5 minute integration agrees with 30 second integration',()=>{
 for(const metric of ['PVT','KSS'])for(const sleep of [true,false]){
  const p=m.parameters(metric),a=m.advance([4,15,2,.4],12,7,sleep,p),b=m.advance([4,15,2,.4],12,7,sleep,p,1/120);
  a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<0.0001));
 }
});
test('baseline reaches a repeatable daily equilibrium and returns copies',()=>{
 const p=m.parameters(),a=m.equilibrium(p),b=m.advance(m.advance(a,16,7,false,p),8,23,true,p);
 a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-9));
 a[0]=999;assert.notEqual(m.equilibrium(p)[0],999);
});
test('inertia dissipates after waking without modifying the slow state by a hard reset',()=>{
 const p=m.parameters(),y=m.equilibrium(p),after=m.advance(y,1,7,false,p);
 assert.ok(after[2]>0&&after[2]<y[2]);
 assert.ok(Math.abs(after[2]-y[2]*Math.exp(-p.nu))<0.00001);
});
test('chronic restriction accumulates and recovery improves native predictions',()=>{
 for(const metric of ['PVT','KSS']){
  const p=m.parameters(metric);let y=m.equilibrium(p);const baseline=y[0];
  for(let d=0;d<7;d++)y=m.advance(m.advance(y,20,7,false,p),4,27,true,p);
  assert.ok(y[0]>baseline);
  const after=m.advance(m.advance(y,16,7,false,p),8,23,true,p);
  assert.ok(after[0]<y[0]);
 }
});
test('timeline shares sleep boundaries, preserves continuity and rejects outside samples',()=>{
 const start=+new Date('2026-09-07T07:00:00+03:00'),end=start+48*H;
 const base=c.MinkaSleepModel.timeline(start,end,[{start:start+17*H,end:start+22*H}],15),model=m.timeline(base);
 for(const boundary of [base.sleep[0].start,base.sleep[0].end])assert.ok(Math.abs(model.at(boundary).value-model.at(boundary-1).value)<.001);
 assert.ok(model.at(base.sleep[0].end).inertia>0);assert.equal(model.at(base.sleep[0].end).asleep,false);
 assert.throws(()=>model.at(start-1));assert.throws(()=>model.at(end+1));
});
