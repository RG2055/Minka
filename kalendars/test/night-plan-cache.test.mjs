import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/calendar.js',import.meta.url),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
test('the live tick parses the night-plan store only when its text changes; writers get their own copy',()=>{
 const store={minkaNightSplitByDateV1:'{"24.09.2026":{"order":["A"]}}'};let parses=0;
 const c=vm.createContext({localStorage:{getItem:k=>store[k]??null},JSON:{parse:s=>{parses++;return JSON.parse(s);}},NIGHT_SPLIT_STORE_KEY:'minkaNightSplitByDateV1'});
 vm.runInContext(extract('  let nightSplitMapRaw','  function getNightSplitColorOrder'),c);
 const a=c.getNightSplitSavedMap(),b=c.getNightSplitSavedMap();
 assert.equal(a,b);assert.equal(parses,1);assert.deepEqual(a['24.09.2026'].order,['A']);
 const mine=c.getNightSplitSavedMap(true);assert.notEqual(mine,a);mine.x=1;assert.equal(c.getNightSplitSavedMap().x,undefined);
 store.minkaNightSplitByDateV1='{"25.09.2026":{}}';assert.ok('25.09.2026' in c.getNightSplitSavedMap());
 store.minkaNightSplitByDateV1='not json';assert.equal(Object.keys(c.getNightSplitSavedMap()).length,0);
});
