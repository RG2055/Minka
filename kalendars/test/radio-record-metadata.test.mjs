import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const embedded=JSON.parse(fs.readFileSync(new URL('../../data/stations.json',import.meta.url),'utf8')).find(s=>s.title==='Remix');
function harness(){
 const calls=[],c=vm.createContext({window:{},rrPrefixToId:null,rrMapPromise:null,RR_STATIONS_URL:'stations',RR_NOW_URL:'now',
  fetchRadioJson:async url=>{calls.push(url);return url==='stations'?{result:{stations:[{id:548,prefix:'rmx',stream_hls:embedded.hls},{id:15016,prefix:'record',stream_hls:'https://hls-01-radiorecord.hostingradio.ru/record/playlist.m3u8'}]}}:{result:[{id:548,track:{artist:'Artist',song:'Song',image600:'https://art.example/album.jpg'}}]};}});
 vm.runInContext(section('function deriveRRPrefix(', 'function setNowUI(')+section('async function ensureRRPrefixMap(', 'async function updateNowPlaying('),c);
 return {c,calls};
}
test('first-load Remix HLS alias resolves the same track and cover as the upgraded API station',async()=>{
 const {c,calls}=harness();
 const first={title:embedded.title,prefix:c.deriveRRPrefix(embedded),stream_hls:embedded.hls};
 assert.equal(first.prefix,'record-rmx');
 const initial=await c.fetchNowForStation(first);assert.equal(initial.cover,'https://art.example/album.jpg');assert.equal(initial.title,'Song');
 const upgraded=await c.fetchNowForStation({title:'Remix',prefix:'rmx',id:'548'});
 assert.deepEqual(initial,upgraded);assert.equal(calls.filter(x=>x==='stations').length,1);
 assert.equal(c.rrPrefixToId.record,'15016','main Record is not aliased to Remix');
});
test('normalized stream_hls also resolves when the local station has no explicit prefix',async()=>{
 const {c}=harness();const hit=await c.fetchNowForStation({title:'Remix',stream_hls:embedded.hls});assert.equal(hit.artist,'Artist');
});
