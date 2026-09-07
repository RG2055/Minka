import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.TZ='Europe/Riga';
const c=vm.createContext({Date});
vm.runInContext(fs.readFileSync(new URL('../js/light-model.js',import.meta.url),'utf8'),c);
const m=c.MinkaLightModel,H=3600000;
test('Forger99 numerical convergence across dim and bright scenarios',()=>{
 for(const lux of [0,10,30,100,1000]){
  const y=[-.0843259,-1.09607546,.45584306];
  const a=m.advance(y,24,lux),b=m.advance(y,24,lux,1/120);
  a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-4,`${lux}: ${v-b[i]}`));
 }
});
test('regular baseline is entrained and is not mutated by callers',()=>{
 for(const lux of [100,1000]){
  const y=m.baseline(lux),next=m.advance(m.advance(y,16,lux),8,0);
  next.forEach((v,i)=>assert.ok(Math.abs(v-y[i])<1e-8));
  y[0]=999;assert.notEqual(m.baseline(lux)[0],999);
 }
});
test('dark sleep overrides duty lighting; no windows does not mean zero work light',()=>{
 const settings={workLux:30,dayLux:1000},t=+new Date('2026-09-08T02:00:00+03:00');
 assert.equal(m.lightAt(t,true,true,settings),0);
 assert.equal(m.lightAt(t,false,true,settings),30);
 assert.equal(m.lightAt(t,false,false,settings),10);
 assert.throws(()=>m.advance([1,0,0],1,-1));
});
test('same regular schedule gives zero phase difference and exposure changes phase',()=>{
 const start=+new Date('2026-09-07T07:00:00+03:00'),end=start+24*H;
 const base={start,end,segments:[{start,end:start+16*H,asleep:false},{start:start+16*H,end,asleep:true}]};
 const regular=m.simulate(base,[],end,{workLux:30,dayLux:1000});
 assert.ok(Math.abs(regular.delayHours)<1e-8);
 const dim=m.simulate(base,[{start,end}],end,{workLux:30,dayLux:1000});
 assert.ok(Math.abs(dim.delayHours)>.01);
});
test('splitting identical segments preserves phase and exact sleep boundaries',()=>{
 const start=+new Date('2026-09-07T07:00:00+03:00'),end=start+24*H,a=start+19*H+5*60000;
 const segments=[{start,end:a,asleep:false},{start:a,end,asleep:true}];
 const one=m.simulate({start,end,segments},[{start,end}],end,{workLux:30,dayLux:100});
 const split=[{start,end:start+H,asleep:false},{start:start+H,end:a,asleep:false},segments[1]];
 const two=m.simulate({start,end,segments:split},[{start,end}],end,{workLux:30,dayLux:100});
 assert.ok(Math.abs(one.delayHours-two.delayHours)<1e-9);
});
