import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
function harness({native=false,library=true,userAgent=''}={}){
 const elements={},timers=new Map(),instances=[];let timer=0,loads=0,starts=0;
 const events=()=>{const map=new Map();return {on:map,addEventListener(k,fn){if(!map.has(k))map.set(k,new Set());map.get(k).add(fn);},removeEventListener(k,fn){map.get(k)?.delete(fn);},emit(k){for(const fn of [...map.get(k)||[]])fn();}};};
 const audio={...events(),src:'',paused:true,pause(){this.paused=true;this.emit('pause');},load(){loads++;},canPlayType:()=>native?'probably':''};
 class Hls{static Events={MANIFEST_PARSED:'manifest',FRAG_LOADED:'fragment',ERROR:'error'};static ErrorTypes={NETWORK_ERROR:'network',MEDIA_ERROR:'media'};static isSupported=()=>true;
  constructor(){this.events={};this.stopped=0;this.restarted=0;this.destroyed=0;instances.push(this);}on(k,fn){this.events[k]=fn;}loadSource(url){this.url=url;}attachMedia(){}destroy(){this.destroyed++;}stopLoad(){this.stopped++;}startLoad(){this.restarted++;}recoverMediaError(){this.recovered=true;}}
 const document={getElementById:id=>elements[id],head:{appendChild(el){elements[el.id]=el;}},createElement:()=>({...events(),remove(){delete elements[this.id];}})};
 elements.curStation={};const window={Hls:library?Hls:null};
 const c=vm.createContext({window,Hls,document,audio,navigator:{userAgent},hls:null,radioPlayAttempt:0,setupAudio(){},requestRadioPlayback(){starts++;audio.paused=false;audio.emit('play');},setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source.slice(source.indexOf('let radioStreamGeneration ='),source.indexOf('function describeStationStream(')),c);
 return {c,audio,window,elements,instances,timers,Hls,get loads(){return loads;},get starts(){return starts;}};
}
test('reselecting the active direct stream reuses its connection and buffer',()=>{
 const h=harness();for(let i=0;i<5;i++)h.c.play('remix.mp3','Remix');assert.equal(h.loads,1);assert.equal(h.starts,1);
 h.audio.pause();h.c.play('remix.mp3','Remix');assert.equal(h.loads,1);assert.equal(h.starts,2);
 h.audio.error={code:2};h.c.play('remix.mp3','Remix');assert.equal(h.loads,2);
});
test('late HLS library load cannot replace a newer direct station',()=>{
 const h=harness({library:false});h.c.play('old.m3u8','Old');const loader=h.elements['mk-hls-loader'];
 h.c.play('remix.mp3','Remix');h.window.Hls=h.Hls;loader.emit('load');loader.emit('error');
 assert.equal(h.instances.length,0);assert.equal(h.audio.src,'remix.mp3');assert.equal(h.elements.curStation.textContent,'Remix');
 assert.equal(loader.on.get('load').size,0);
});
test('switching station destroys the old HLS engine and cancels its retry timer',()=>{
 const h=harness();h.c.play('old.m3u8','Old');const old=h.instances[0],late=[...h.timers.values()][0];
 h.c.play('remix.m3u8','Remix');const current=h.instances[1];old.events.manifest();old.events.error(null,{fatal:true,type:'network'});late();
 assert.equal(old.destroyed,1);assert.equal(old.restarted,0);assert.equal(h.starts,0);assert.equal(h.timers.size,1);
 current.events.manifest();current.events.fragment();assert.equal(h.starts,1);
});
test('pausing HLS stops downloads and play resumes the same engine',()=>{
 const h=harness();h.c.play('remix.m3u8','Remix');const player=h.instances[0];player.events.manifest();
 h.window.__mkRadioSupersededByLacitis=true;h.audio.pause();assert.equal(player.stopped,1);h.window.__mkRadioSupersededByLacitis=false;h.c.play('remix.m3u8','Remix');assert.equal(player.restarted,1);assert.equal(h.instances.length,1);
});
test('native HLS avoids loading the JavaScript parser',()=>{
 const h=harness({native:true,library:false});h.c.play('radio.m3u8','Radio');assert.equal(h.audio.src,'radio.m3u8');assert.equal(h.elements['mk-hls-loader'],undefined);assert.equal(h.instances.length,0);
});

test('ERR audio uses the working HLS parser even when native HLS is advertised',()=>{
 const h=harness({native:true});h.c.play('https://sb.err.ee/live/vikerraadio.m3u8','Vikerraadio');assert.equal(h.instances.length,1);h.instances[0].events.manifest();assert.equal(h.starts,1);
});

// Regression: native Chromium HLS accepts Remix initially, then fails on SLOW.
test('Chromium HLS uses MSE even when native support is advertised',()=>{
 for(const userAgent of ['Mozilla/5.0 Chrome/146.0.0.0 Safari/537.36','Mozilla/5.0 Edg/146.0']){
  const h=harness({native:true,userAgent});h.c.play('https://example.test/remix.m3u8','Remix');assert.equal(h.instances.length,1);assert.equal(h.audio.src,'');h.instances[0].events.manifest();assert.equal(h.starts,1);
 }
});
test('Chromium direct stations do not load HLS while Safari retains native HLS',()=>{
 const chrome=harness({native:true,library:false,userAgent:'Chrome/146.0'});chrome.c.play('remix.mp3','Remix');assert.equal(chrome.elements['mk-hls-loader'],undefined);assert.equal(chrome.audio.src,'remix.mp3');
 const safari=harness({native:true,library:false,userAgent:'Version/26.0 Safari/605.1.15'});safari.c.play('remix.m3u8','Remix');assert.equal(safari.elements['mk-hls-loader'],undefined);assert.equal(safari.audio.src,'remix.m3u8');
});
