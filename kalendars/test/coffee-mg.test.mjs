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
test('caffeine curve: nothing before the drink, a peak about an hour later, half of it five hours on, drinks add up',()=>{
 const c=vm.createContext({});
 vm.runInContext(cut('    const CAF_KA','    // This person\'s drinks of the shown duty day'),c);
 const H=3600000,one=[{mg:80,at:0}],at=h=>c.caffeineAt(one,h*H);
 assert.equal(at(-1),0);assert.equal(at(0),0);
 let peakH=0;for(let h=0;h<6;h+=.05)if(at(h)>at(peakH))peakH=h;
 assert.ok(peakH>.8&&peakH<1.4,'peak at '+peakH);
 assert.ok(at(peakH)>60&&at(peakH)<80,'peak '+at(peakH));
 assert.ok(Math.abs(at(8)/at(3)-.5)<.01,'5 h half-life');
 assert.ok(Math.abs(c.caffeineAt([{mg:80,at:0},{mg:160,at:2*H}],6*H)-(at(6)+2*at(4)))<1e-9);
});
