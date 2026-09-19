import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function harness(saved='0.35'){
 const window=new EventTarget(),document=new EventTarget(),audio=new EventTarget();
 let now=1000,next=0,plays=0,pauses=0,enabled=true,rendered;
 Object.assign(audio,{volume:1,muted:false,paused:true,readyState:0,src:'radio.mp3',pause(){this.paused=true;pauses++;this.dispatchEvent(new Event('pause'));}});
 const handlers={},timers=new Map(),store=new Map([['test-volume',saved]]);
 const context={window,document,navigator:{mediaSession:{setActionHandler:(k,v)=>handlers[k]=v}},MediaMetadata:class{constructor(v){Object.assign(this,v);}},Date:{now:()=>now},setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}};
 const file=new URL('../../js/radio-listening.js',import.meta.url);
 if(fs.existsSync(file))vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 assert.ok(window.MinkaListening,'shared listening controls exist');
 const api=window.MinkaListening.create({audios:[audio],current:()=>audio,enabled:()=>enabled,volumeKey:'test-volume',play(){plays++;audio.paused=false;audio.dispatchEvent(new Event('play'));},pause:()=>audio.pause(),next(){},previous(){},metadata:()=>({title:'Remix',artist:'Radio'}),render:v=>rendered=v});
 return {api,audio,handlers,timers,store,context,window,document,setNow:v=>now=v,disable:()=>enabled=false,get plays(){return plays;},get pauses(){return pauses;},get rendered(){return rendered;}};
}
test('restores volume and mute preserves the previous listening level',()=>{
 const h=harness();assert.equal(h.audio.volume,.35);h.api.toggleMute();assert.equal(h.audio.muted,true);assert.equal(h.audio.volume,.35);
 h.api.setVolume(.62);assert.equal(h.audio.muted,false);assert.equal(h.store.get('test-volume'),'0.62');
});
test('media actions are idempotent and do not control an inactive source',()=>{
 const h=harness();h.audio.paused=false;h.audio.dispatchEvent(new Event('playing'));
 assert.equal(h.context.navigator.mediaSession.metadata.title,'Remix');
 h.handlers.play();assert.equal(h.plays,0);h.handlers.pause();assert.equal(h.pauses,1);
 h.disable();h.handlers.play();assert.equal(h.plays,0);
});
test('waiting, playing and pause produce distinct transport states',()=>{
 const h=harness();h.audio.paused=false;h.audio.dispatchEvent(new Event('waiting'));assert.equal(h.rendered.state,'loading');
 h.audio.dispatchEvent(new Event('playing'));assert.equal(h.rendered.state,'playing');
 h.audio.pause();assert.equal(h.rendered.state,'paused');
});
