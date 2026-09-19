import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
function setup({ready=true}={}){
 let changes=0,hidden=true;const timers=[],listeners={};const theme={randomGuest(){changes++;}};
 const start=html.indexOf('  let nextGuestLook = ');
 assert.notEqual(start,-1,'reopen preserves a pending guest skin');
 const c=vm.createContext({window:{rgTheme:ready?theme:null,addEventListener:(type,fn)=>listeners[type]=fn},document:{body:{classList:{contains:name=>name==='radio-hidden'&&hidden}}},setTimeout:fn=>timers.push(fn),Image:class{}});
 vm.runInContext(html.slice(start,html.indexOf('  // The state the UI is heading for:',start)),c);
 return {c,timers,close(){hidden=true;vm.runInContext('nextGuestLook=true;rollNextLook({style:{}})',c);},open(){hidden=false;c.prepareGuestLook();},ready(){c.window.rgTheme=theme;listeners['rg-theme-ready']?.();},get changes(){return changes;}};
}
test('quick reopen consumes pending skin before delayed idle work',()=>{
 const h=setup();h.close();h.open();assert.equal(h.changes,1);h.timers.shift()();assert.equal(h.changes,1);
});
test('idle-prepared skin is not rerolled when opened',()=>{
 const h=setup();h.close();h.timers.shift()();assert.equal(h.changes,1);h.open();assert.equal(h.changes,1);
 h.close();h.open();assert.equal(h.changes,2);
});

test('first open after a reload rolls a fresh guest look exactly once',()=>{
 const h=setup();h.open();assert.equal(h.changes,1);h.ready();assert.equal(h.changes,1);
});
test('first open waits for lazy radio scripts and then consumes the pending look',()=>{
 const h=setup({ready:false});h.open();assert.equal(h.changes,0);h.ready();assert.equal(h.changes,1);h.ready();assert.equal(h.changes,1);
});
test('prewarming hidden radio leaves its first-open change pending',()=>{
 const h=setup({ready:false});h.ready();assert.equal(h.changes,0);h.open();assert.equal(h.changes,1);
});
