import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const catalog=JSON.parse(read('data/pioneer/clips.json'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(saved='original'){
 const listeners={},attributes=new Map(),classes=new Set(),buttonAttrs=new Map(),requests=[];
 let active=true,running=true,selectedMode=0,source='';
 const eventTarget=()=>({addEventListener:(event,callback)=>(listeners[event]??=[]).push(callback)});
 const image={...eventTarget(),style:{},classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},getAttribute:key=>attributes.get(key),setAttribute:(key,value)=>attributes.set(key,value),set src(v){attributes.set('src',v);},get src(){return attributes.get('src');}};
 const button={classList:{toggle(){}},setAttribute:(key,value)=>buttonAttrs.set(key,value)};
 const store=new Map([['mkRadioPioneer',saved]]),window=eventTarget(),document={...eventTarget(),hidden:false};
 const c=vm.createContext({window,document,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},fetch:async url=>{requests.push(url);return {ok:true,json:async()=>catalog};},clearTimeout(){},requestAnimationFrame(){throw Error('No animation loop allowed');},setInterval(){throw Error('No animation timer allowed');}});
 vm.runInContext(read('js/radio-pioneer.js'),c);
 window.rgPioneer.init({image,button,audio:eventTarget(),isActive:()=>active,isRunning:()=>running,selectMode:()=>{active=true;selectedMode++;},disable:()=>active=false});
 return {api:window.rgPioneer,image,classes,requests,store,document,buttonAttrs,active:v=>active=v,running:v=>running=v,emit:event=>listeners[event]?.forEach(fn=>fn()),selectedMode:()=>selectedMode};
}
test('all 83 source clips have small native WebP animations and static posters',()=>{
 assert.equal(catalog.length,83);assert.equal(new Set(catalog.map(c=>c.id)).size,83);
 for(const clip of catalog){
  for(const suffix of ['', '-poster']){const data=fs.readFileSync(new URL('data/pioneer/'+clip.id+suffix+'.webp',root));assert.equal(data.toString('ascii',8,12),'WEBP');if(!suffix)assert.equal(data.length,clip.bytes);}
  assert.ok(clip.bytes<510000);assert.ok(clip.width<=256&&clip.height<=96);
 }
 assert.equal(catalog.filter(c=>c.color).length,24);
});
test('existing dolphin needs no catalog; hidden and paused radio replace animation with still',()=>{
 const h=harness();assert.equal(h.requests.length,0);assert.match(h.image.src,/dolphin.webp/);
 h.running(false);h.api.sync();assert.equal(h.image.src,'data/pioneer/original-poster.webp');
 h.running(true);h.document.hidden=true;h.emit('visibilitychange');assert.match(h.image.src,/-poster.webp$/);
 h.document.hidden=false;h.emit('visibilitychange');assert.match(h.image.src,/dolphin.webp/);
 h.active(false);h.emit('rg-viz-change');assert.equal(h.image.style.display,'none');assert.match(h.image.src,/-poster.webp$/);
});
test('saved and selected clips load one catalog, keep colors, and share the existing image layer',async()=>{
 const h=harness('movie1');await tick();assert.deepEqual(h.requests,['data/pioneer/clips.json?v=20260910pioneer4']);assert.equal(h.image.src,'data/pioneer/movie1.webp');
 h.api.select('color_05_firedragon');assert.equal(h.image.src,'data/pioneer/color_05_firedragon.webp');assert.ok(h.classes.has('pioneer-color'));assert.equal(h.selectedMode(),1);assert.equal(h.store.get('mkRadioPioneer'),'color_05_firedragon');
 h.api.select('not-a-real-clip');assert.equal(h.selectedMode(),1);
 h.api.select('movie2');assert.equal(h.classes.has('pioneer-color'),false);assert.equal(h.requests.length,1);
 h.emit('pagehide');assert.match(h.image.src,/-poster.webp$/);
});
test('saved clip restored after late metadata load respects newly hidden radio',async()=>{
 const h=harness('movie1');h.active(false);await tick();assert.equal(h.image.src,'data/pioneer/movie1-poster.webp');assert.equal(h.image.style.display,'none');
});

test('saved still is replaced by original dolphin; animated backgrounds remain selectable',async()=>{
 const h=harness('still_bgp01');await tick();assert.match(h.image.src,/dolphin.webp/);assert.equal(h.store.get('mkRadioPioneer'),'original');
 h.api.select('still_bgp01');assert.equal(h.selectedMode(),0);
 h.api.select('alt_bgv1');assert.match(h.image.src,/alt_bgv1.webp/);assert.equal(h.selectedMode(),1);
});
function levelsHarness(){
 const source=read('js/radio-pioneer.js');
 const c=vm.createContext({meterSamples:null,meterPeak:[.16,.08],meterTargets:[0,0],Uint8Array,Math});
 vm.runInContext(source.slice(source.indexOf(' function audioLevels('),source.indexOf(' function paintMeter(')),c);
 const analyser=(amplitude,frequency=140)=>({fftSize:512,context:{sampleRate:48000},getByteTimeDomainData(data){for(let i=0;i<data.length;i++)data[i]=128+Math.round(Math.sin(i*2*Math.PI*frequency/48000)*amplitude);}});
 return {c,analyser};
}
test('Pioneer bands respond independently, preserve silence and reuse sample storage',()=>{
 const {c,analyser}=levelsHarness();assert.deepEqual(Array.from(c.audioLevels(analyser(0))),[0,0]);
 const bass=Array.from(c.audioLevels(analyser(10,100)));const treble=Array.from(c.audioLevels(analyser(10,7000)));
 assert.ok(bass[0]>bass[1]);assert.ok(treble[1]>treble[0]);
 const buffer=c.meterSamples;c.audioLevels(analyser(10));assert.equal(c.meterSamples,buffer);
 const quiet=c.audioLevels(analyser(3))[0],loud=c.audioLevels(analyser(40))[0];assert.ok(loud>quiet);
});
test('modest beat changes span several frames instead of pinning near full scale',()=>{
 const {c,analyser}=levelsHarness();let indices=[];
 for(let i=0;i<200;i++){const amplitude=16+22*Math.exp(-(i%16)/4);indices.push(Math.round(c.audioLevels(analyser(amplitude))[0]*10));}
 assert.ok(new Set(indices.slice(-64)).size>=4);assert.ok(Math.max(...indices)<=10);
 for(let i=0;i<10;i++)assert.deepEqual(Array.from(c.audioLevels(analyser(0))),[0,0]);
});
test('meter loop stops hidden and paused; at most 25 samples per second',()=>{
 const source=read('js/radio-pioneer.js');let calls=0,scheduled=0,active=true,running=true;
 const c=vm.createContext({selected:{levels:11},setup:{isActive:()=>active,isRunning:()=>running,getAnalyser:()=>({})},document:{hidden:false},meterLevel:[0,0],meterTimer:0,audioLevels:()=>[.8,.25],paintMeter:(l,r)=>{assert.ok(l>r);calls++;},setTimeout:(_fn,ms)=>{assert.equal(ms,40);scheduled++;return 1;},Math});
 vm.runInContext(source.slice(source.indexOf(' function meterTick('),source.indexOf(' function syncMeter(')),c);
 c.meterTick();assert.equal(calls,1);assert.equal(scheduled,1);
 running=false;c.meterTick();active=false;c.meterTick();assert.equal(scheduled,1);
 active=true;running=true;c.document.hidden=true;c.meterTick();assert.equal(scheduled,1);
});
test('meter removes duplicated lower cells and renders each band independently',()=>{
 const source=read('js/radio-pioneer.js'),draws=[];
 const c=vm.createContext({meterImage:{complete:true,naturalWidth:192},meterFrame:'',meterCanvas:{width:192,height:48},meterContext:{clearRect(){},drawImage:(_image,...args)=>draws.push(args)},selected:{width:96,height:96}});
 vm.runInContext(source.slice(source.indexOf(' function paintMeter('),source.indexOf(' function meterTick(')),c);
 c.paintMeter(8,3);assert.deepEqual(draws,[[0,768,96,48,0,0,96,48],[96,288,96,48,96,0,96,48]]);
 c.paintMeter(8,3);assert.equal(draws.length,2,'unchanged pair does not repaint');
});
