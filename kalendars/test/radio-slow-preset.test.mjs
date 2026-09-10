import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
function harness(){
 const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}});
 const node=()=>({gain:param(),frequency:param(),delayTime:param()});
 const window={__eqMode:'none'},document={body:{classList:{add(){},remove(){}}},getElementById:()=>null,querySelectorAll:()=>[]};
 const c=vm.createContext({window,document,audio:{playbackRate:1},__slowFx:{volume:100,pitch:0,speed:88,reverb:40,keepPitch:false},aCtx:{currentTime:0},lowNode:node(),highNode:node(),masterGain:node(),wetGain:node(),feedbackNode:node(),delayNode:node(),vinylGain:node(),vinylLPF:node(),depthWetGain:node(),depthDelayR:node(),compressorNode:Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param()])),initSlowFxPanel(){},toggleSlowPanel(){}});
 vm.runInContext(extract('function applySlowFxCustom(){','function initSlowFxPanel(){')+extract('function setChill(preset){','function toggleMorePresets(){')+extract('function setEQ(mode) {','function ensureCanvasSize(){'),c);
 return c;
}
test('first SLOW selection immediately applies .88 speed from every normal preset',()=>{
 for(const previous of ['none','chill','bass','radio','lofi']){const c=harness();c.setEQ(previous);c.setEQ('chilldeep');assert.equal(c.audio.playbackRate,.88);assert.equal(c.window.__eqMode,'chilldeep');assert.ok(Math.abs(c.wetGain.gain.value-.3)<1e-10);}
});
test('first normal preset selection removes custom slow speed, pitch and boost',()=>{
 const c=harness();Object.assign(c.__slowFx,{speed:80,pitch:-2,volume:150});c.setEQ('chilldeep');assert.ok(c.audio.playbackRate<.75);assert.equal(c.masterGain.gain.value,1.5);
 c.setEQ('none');assert.equal(c.audio.playbackRate,1);assert.equal(c.masterGain.gain.value,1);
 c.setEQ('chill');assert.equal(c.audio.playbackRate,.92);
});

test('one SLOW action commits one final playback rate; applying it again is a no-op for the decoder',()=>{
 const c=harness(),writes=[];let rate=1;Object.defineProperty(c.audio,'playbackRate',{get:()=>rate,set:v=>{rate=v;writes.push(v);}});
 Object.assign(c.__slowFx,{speed:75,pitch:-2});c.setEQ('chilldeep');assert.equal(writes.length,1);assert.ok(writes[0]<.75);
 c.setEQ('chilldeep');assert.equal(writes.length,1);
 c.__slowFx.reverb=0;c.applySlowFxCustom();assert.equal(writes.length,1);assert.equal(c.wetGain.gain.value,0);
 c.setEQ('none');assert.deepEqual(writes,[.75*Math.pow(2,-2/12),1]);
});
test('reverb cancels stale gain automation and low volume attenuates without touching the main slider',()=>{
 const c=harness();let cancelled=0;c.wetGain.gain.cancelScheduledValues=()=>cancelled++;
 c.__slowFx.volume=50;c.__slowFx.reverb=0;c.setEQ('chilldeep');assert.equal(c.masterGain.gain.value,.5);assert.equal(c.wetGain.gain.value,0);assert.ok(cancelled>0);
 c.__slowFx.reverb=40;c.applySlowFxCustom();assert.ok(Math.abs(c.wetGain.gain.value-.3)<1e-10);
});
test('keep original pitch makes speed independent of the stored pitch adjustment',()=>{
 const c=harness();Object.assign(c.__slowFx,{pitch:-6,speed:88,keepPitch:true});c.setEQ('chilldeep');assert.equal(c.audio.playbackRate,.88);assert.equal(c.audio.preservesPitch,true);
});

test('a pause finishing after play cannot leave the audio context suspended',async()=>{
 const handlers={},audio={paused:true,addEventListener:(name,fn)=>handlers[name]=fn};let finishSuspend,resumes=0;
 const aCtx={state:'running',suspend:()=>new Promise(resolve=>{finishSuspend=()=>{aCtx.state='suspended';resolve();};}),resume:()=>{resumes++;aCtx.state='running';return Promise.resolve();}};
 const c=vm.createContext({audio,aCtx,window:{}});
 vm.runInContext(extract("audio.addEventListener('pause', () => {","window.__mkPauseRadioForLacitis ="),c);
 handlers.pause();audio.paused=false;handlers.play();finishSuspend();await Promise.resolve();await Promise.resolve();
 assert.equal(aCtx.state,'running');assert.ok(resumes>=1);
});
