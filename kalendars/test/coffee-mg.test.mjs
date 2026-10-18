import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../js/calendar.js',import.meta.url),'utf8');
const cut=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
test('caffeine from stored sources: a Monster (stored as 2 cup units) is 160 mg, a Brite 100 mg, a Philips 80 mg',()=>{
 const c=vm.createContext({window:{},COFFEE_SOURCE_ALIASES:{}});
 vm.runInContext(cut('    const COFFEE_MG_PER_CUP','    function coffeeMgToday')+cut('    function cleanCoffeeSource(','\n    }\n')+'\n    }',c);
 assert.equal(c.coffeeSourcesMg({monster:2}),160);
 assert.equal(c.coffeeSourcesMg({brite:1}),100);
 assert.equal(c.coffeeSourcesMg({monster:2,brite:1,philips:3}),500);
 assert.equal(c.coffeeSourcesMg({nonsense:4}),0);
 assert.equal(c.coffeeSourcesMg(null),0);
});
