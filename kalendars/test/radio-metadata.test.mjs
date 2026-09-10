import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio-metadata.js',import.meta.url),'utf8');
function harness(fetch=async()=>{throw Error('offline')}){const window={};vm.runInNewContext(source,{window,URL,Intl,Date,AbortController,DOMException,TextDecoder,Uint8Array,setTimeout,clearTimeout,fetch});return window.rgRadioMetadata;}
test('Icecast matches the exact mount instead of displaying another station on the host',()=>{
 const api=harness(),data={icestats:{source:[{listenurl:'http://radio.test:8000/other',title:'Wrong - Song'},{listenurl:'http://radio.test:8000/live',title:'Right Artist - Right Song'}]}};
 assert.equal(api.parseIcecast(data,'https://radio.test:8443/live').artist,'Right Artist');assert.equal(api.parseIcecast(data,'https://radio.test/missing'),null);
});
test('ZET uses Warsaw time, rejects future and expired tracks, and preserves punctuation',()=>{
 const api=harness(),now=Date.parse('2026-09-10T14:22:00Z'),row={rds_start:'2026-09-10 16:20:00',rds_duration:'200',rds_artist:'Artist',rds_title:"It's a Song",img:'https://cover.test/a.jpg'};
 assert.equal(api.parseZet({messages:[[row]]},now).title,"It's a Song");
 assert.equal(api.parseZet({messages:[[row]]},now+600000),null);
 assert.equal(api.parseZet({messages:[[{...row,rds_start:'2026-09-10 16:30:00'}]]},now),null);
});
test('KEXP talk breaks do not display the previous song as current',async()=>{
 const api=harness(async()=>({ok:true,json:async()=>({results:[{play_type:'airbreak',song:'Previous song',artist:'Previous artist',airdate:new Date().toISOString()}]})}));
 assert.equal(await api.fetch({stream_128:'https://kexp.streamguys1.com/kexp128.mp3'},new AbortController().signal),null);
});
test('unavailable streams back off; ICY reads are cancelled after the bounded sample',async()=>{
 let requests=0,cancelled=0;
 const api=harness(async url=>{requests++;if(url.includes('status-json'))throw Error('no status');return {ok:true,body:{getReader:()=>({read:async()=>({value:new Uint8Array(150000),done:false}),cancel:async()=>cancelled++})}}});
 const station={stream_128:'https://radio.test/live.mp3'};
 assert.equal(await api.fetch(station,new AbortController().signal),null);assert.equal(cancelled,1);assert.equal(requests,2);
 await api.fetch(station,new AbortController().signal);assert.equal(requests,2);
});
test('station changes abort metadata work and do not disable the next request',async()=>{
 let requests=0;
 const api=harness(async(url,{signal})=>{requests++;return new Promise((resolve,reject)=>{if(signal.aborted)reject(Error('aborted'));else signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});});
 const c=new AbortController(),station={stream_128:'https://ice2.somafm.com/groovesalad-128-mp3'};
 const pending=api.fetch(station,c.signal);c.abort();await pending;
 const next=new AbortController(),again=api.fetch(station,next.signal);next.abort();await again;assert.equal(requests,2);
});
