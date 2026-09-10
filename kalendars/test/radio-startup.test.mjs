import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const radio=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
function harness({loaded=true,signedIn=true}={}){
 let finishLoading;const selected=[],timers=[];
 const fields={radioIdleBtn:{},radioWindow:{style:{}}};
 const profile={getSession:()=>signedIn?{workerId:'test'}:null,isLoaded:()=>loaded,getRadio:()=>({favorites:['record:remix','lv:capital fm']})};
 const window={__mkUnifiedMedia:profile};
 const c=vm.createContext({window,console,ensureWorldFavorites:()=>false,playStationKey(){},currentIndex:0,isFirstPlay:true,
  stationsList:[{title:'Record'},{title:'Remix'},{title:'CAPITAL FM',group:'latvija'}],
  audio:{paused:true},requestRadioPlayback(){c.audio.paused=false;},
  radioStationKey:s=>(s.group==='latvija'?'lv:':'record:')+s.title.toLowerCase(),
  selectStation:index=>{selected.push(index);c.currentIndex=index;c.isFirstPlay=false;c.audio.paused=false;},
  document:{body:{classList:{contains:()=>false,remove(){}}},getElementById:id=>fields[id]},
  syncShellLayout(){},wireVizLazyMilkdrop(){},loadRadioScripts:()=>new Promise(resolve=>finishLoading=resolve),
  setTimeout:fn=>timers.push(fn)});
 Object.defineProperty(window,'stationsList',{get:()=>c.stationsList});
 vm.runInContext(radio.slice(radio.indexOf('function favoriteStationIndex('),radio.indexOf("document.addEventListener('media-profile-change'")),c);
 vm.runInContext(html.slice(html.indexOf('function radioIdleClick()'),html.indexOf('// Keep calendar area synced')),c);
 return {c,selected,timers,profile,ready(){loaded=true;},finish:async()=>{finishLoading();await new Promise(resolve=>setImmediate(resolve));}};
}
test('late lazy-load completion cannot replace Remix with Record',async()=>{
 const h=harness();h.c.radioIdleClick();h.c.window.rgStations.startFavorite(h.profile.getRadio().favorites);
 await h.finish();assert.deepEqual(h.selected,[1]);assert.equal(h.c.currentIndex,1);
});
test('radio opened before profile load waits, then starts Remix',async()=>{
 const h=harness({loaded:false});h.c.radioIdleClick();await h.finish();assert.deepEqual(h.selected,[]);
 h.ready();h.timers.shift()();assert.deepEqual(h.selected,[1]);
});
test('loaded profile chooses Remix even if the catalogue starts with Record',()=>{
 const h=harness();assert.equal(h.c.window.rgStations.startInitial(),true);assert.deepEqual(h.selected,[1]);
});
test('guest startup defaults to Remix',()=>{
 const h=harness({signedIn:false});h.c.window.rgStations.startInitial();assert.deepEqual(h.selected,[1]);
});
test('delayed startup preserves an explicit station selection',async()=>{
 const h=harness();h.c.radioIdleClick();h.c.selectStation(2);await h.finish();assert.deepEqual(h.selected,[2]);
});

test('favorite order and profile completion do not replace Remix or an explicit choice',()=>{
 const h=harness();h.profile.getRadio=()=>({favorites:['lv:capital fm','record:remix']});
 h.c.window.rgStations.startInitial();assert.deepEqual(h.selected,[1]);
 h.c.selectStation(2);h.c.window.rgStations.startFavorite(['record:remix']);assert.deepEqual(h.selected,[1,2]);
});
