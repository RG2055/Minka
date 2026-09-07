import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.TZ='Europe/Riga';
const source=fs.readFileSync(new URL('../js/nightsplit.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('  function dreamPhones('),source.indexOf('  function dreamContents('));
function dreams(time,count=4,start=0,end=440,date='07.09.2026'){
 const Fixed=class extends Date{static now(){return +new Date(time);}};
 const sl=Array.from({length:count},(_,i)=>({w:{name:'worker'+i},s:start+Math.floor((end-start)*i/count),e:start+Math.floor((end-start)*(i+1)/count)}));
 const c=vm.createContext({Date:Fixed,st:{sl},activeDateKey:()=>date});vm.runInContext(code,c);
 return sl.map(s=>c.dreamPhones(s.w.name));
}
test('after midnight previous roster day shows handsets for second slot only',()=>{
 assert.deepEqual(dreams('2026-09-08T01:18:00+03:00'),[false,true,false,false]);
 assert.deepEqual(dreams('2026-09-08T01:50:00+03:00'),[false,false,true,false]);
 assert.deepEqual(dreams('2026-09-08T07:20:00+03:00'),[false,false,false,false]);
});
test('three-person and 23:00 cross-midnight plans use actual dates',()=>{
 assert.deepEqual(dreams('2026-09-08T00:30:00+03:00',3,1380,1890),[false,true,false]);
 assert.deepEqual(dreams('2026-09-08T01:50:00+03:00',3,1380,1890),[false,false,true]);
 assert.deepEqual(dreams('2026-09-09T01:18:00+03:00'),[false,false,false,false]);
});
