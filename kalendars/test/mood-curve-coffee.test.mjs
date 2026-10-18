import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/page/mood-trend.js',import.meta.url),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
test('unrated days run between rated neighbours with a small coffee swell; rated days never move',()=>{
 const coffee={d2:9,d3:4,d4:4,d5:4};
 const c=vm.createContext({coffeeByDay:()=>coffee});
 vm.runInContext(extract('  function curveLevels(rows)','  /* Each day'),c);
 const rows=['d0','d1','d2','d3','d4','d5','d6'].map((day,i)=>({day,i,mood:i===0?{score:2}:i===4?{score:4}:null}));
 const v=c.curveLevels(rows);
 assert.equal(v[0],2);assert.equal(v[4],4);                       // ratings untouched, even with coffee
 assert.ok(Math.abs(v[1]-2.5)<1e-9);                               // no coffee: plain interpolation
 assert.ok(v[2]>3.4 && v[2]<=3+.75+1e-9);                             // more coffee than usual: swell up, capped
 assert.ok(Math.abs(v[3]-3.5)<1e-9);                               // usual coffee: on the line
 assert.equal(v[5],4);assert.equal(v[6],4);                        // after the last rating: level with it
 assert.deepEqual([...c.curveLevels([{day:'x',i:0,mood:null}])],[3]);   // nothing at all: neutral
});
