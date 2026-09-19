import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup(saved){
 const store=new Map(saved?[['minka:eq:v1',JSON.stringify(saved)]]:[]),window={};
 const source=new URL('../../js/radio-equalizer.js',import.meta.url);
 if(fs.existsSync(source))vm.runInNewContext(fs.readFileSync(source,'utf8'),{window,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
 assert.ok(window.MinkaEqualizer,'shared equalizer engine exists');
 const nodes=[];const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
 const context={currentTime:0,createGain(){const n={gain:param(),connect(){}};nodes.push(n);return n;},createBiquadFilter(){const n={gain:param(),frequency:param(),Q:param(),connect(){}};nodes.push(n);return n;}};
 return {engine:window.MinkaEqualizer.create(),context,nodes,store};
}
test('boosts reserve headroom and bypass restores unity without losing the curve',()=>{
 const h=setup(),eq=h.engine;eq.setBand(0,9);eq.connect(h.context,{connect(){}},[{connect(){}}]);
 assert.equal(h.nodes.filter(n=>n.frequency).length,10);
 assert.equal(h.nodes.find(n=>n.frequency?.value===31).gain.value,9);
 assert.ok(h.nodes[0].gain.value<0.36);
 eq.setEnabled(false);assert.equal(h.nodes[0].gain.value,1);
 assert.ok(h.nodes.filter(n=>n.frequency).every(n=>n.gain.value===0));
 eq.setEnabled(true);assert.equal(h.nodes.find(n=>n.frequency?.value===31).gain.value,9);
});
test('saved curves apply on the first connection, including paused setup',()=>{
 const h=setup({enabled:true,gains:[3,2,1,0,-1,-2,-3,0,1,2]});
 h.engine.connect(h.context,{connect(){}},[{connect(){}}]);
 assert.deepEqual(h.nodes.filter(n=>n.frequency).map(n=>n.gain.value),[3,2,1,0,-1,-2,-3,0,1,2]);
});
test('invalid storage and invalid gains cannot reach audio parameters',()=>{
 const h=setup({enabled:true,gains:[99,'bad',null]});
 h.engine.setBand(2,Infinity);h.engine.setBand(-1,4);h.engine.setBand(0,99);
 h.engine.connect(h.context,{connect(){}},[{connect(){}}]);
 assert.equal(h.nodes.find(n=>n.frequency?.value===31).gain.value,12);
 assert.ok(h.nodes.filter(n=>n.frequency).every(n=>Number.isFinite(n.gain.value)));
 h.engine.preset('flat');assert.ok(h.engine.snapshot().gains.every(v=>v===0));
 assert.ok(JSON.parse(h.store.get('minka:eq:v1')).gains.every(v=>v===0));
});
