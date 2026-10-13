import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
function setup({ready=true}={}){
 let changes=0,hidden=true;const timers=[],listeners={};const theme={randomGuest(){changes++;}};
 const start=html.indexOf('  let nextGuestLook = ');
 assert.notEqual(start,-1,'reopen preserves a pending guest skin');
 const c=vm.createContext({window:{rgTheme:ready?theme:null,addEventListener:(type,fn)=>listeners[type]=fn},document:{body:{classList:{contains:name=>name==='radio-hidden'&&hidden}},getElementById:()=>({style:{}})},setTimeout:fn=>timers.push(fn),Image:class{}});
 vm.runInContext(html.slice(start,html.indexOf('  // The state the UI is heading for:',start)),c);
 return {c,timers,close(){hidden=true;vm.runInContext('nextGuestLook=true;rollNextLook({style:{}})',c);},open(){hidden=false;vm.runInContext('nextGuestLook=false',c);},ready(){c.window.rgTheme=theme;listeners['rg-theme-ready']?.();},get changes(){return changes;}};
}
test('quick reopen keeps the current look; the late idle roll cannot restyle the open radio',()=>{
 const h=setup();h.close();h.open();assert.equal(h.changes,0);h.timers.shift()();assert.equal(h.changes,0);
});
test('idle-prepared skin is not rerolled when opened',()=>{
 const h=setup();h.close();h.timers.shift()();assert.equal(h.changes,1);h.open();assert.equal(h.changes,1);
 h.close();h.timers.shift()();h.open();assert.equal(h.changes,2);
});

test('first guest look after a reload is rolled while hidden, exactly once',()=>{
 const h=setup();h.ready();h.timers.shift()();assert.equal(h.changes,1);h.open();assert.equal(h.changes,1);h.ready();assert.equal(h.changes,1);
});
test('lazy radio scripts arriving while open never restyle it; the next look rolls after closing',()=>{
 const h=setup({ready:false});h.open();assert.equal(h.changes,0);h.ready();assert.equal(h.changes,0);assert.equal(h.timers.length,0);
 h.close();h.timers.shift()();assert.equal(h.changes,1);
});
test('prewarming hidden radio rolls the first guest look before it opens',()=>{
 const h=setup({ready:false});h.ready();assert.equal(h.changes,0);h.timers.shift()();assert.equal(h.changes,1);h.open();assert.equal(h.changes,1);
});
