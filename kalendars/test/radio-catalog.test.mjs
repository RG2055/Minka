import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio-catalog.js',import.meta.url),'utf8');
const row=(n=1,extra={})=>({stationuuid:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,name:'Radio '+n,url_resolved:`https://radio.example/${n}.mp3`,lastcheckok:1,countrycode:'DE',tags:'rock,pop',...extra});
function harness(reply){const calls=[];const window={};vm.runInNewContext(source,{window,URL,URLSearchParams,AbortController,Intl,Date,setTimeout,clearTimeout,fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>reply(url,calls.length)}}});return {api:window.rgRadioCatalog,calls};}
test('loading the directory makes no requests; country/genre/name use one bounded page',async()=>{
 const h=harness(()=>[row()]);assert.equal(h.calls.length,0);
 const result=await h.api.search({country:'DE',genre:'rock',query:'Jazz & soul',offset:60});
 const url=new URL(h.calls[0].url);assert.equal(url.searchParams.get('limit'),'60');assert.equal(url.searchParams.get('offset'),'60');assert.equal(url.searchParams.get('countrycode'),'DE');assert.equal(url.searchParams.get('tag'),'rock');assert.equal(url.searchParams.get('name'),'Jazz & soul');assert.equal(url.searchParams.get('hidebroken'),'true');assert.equal(result.items.length,1);assert.equal(h.calls[0].options.credentials,'omit');
});
test('duplicate requests share work, reuse cache and retry another mirror on failure',async()=>{
 const h=harness((url,n)=>{if(n===1)throw Error('down');return [row()]});
 const [a,b]=await Promise.all([h.api.search(),h.api.search()]);assert.equal(h.calls.length,2);assert.equal(a.items[0].catalogKey,b.items[0].catalogKey);assert.notEqual(new URL(h.calls[0].url).host,new URL(h.calls[1].url).host);await h.api.search();assert.equal(h.calls.length,2);
});
test('unsafe, broken and duplicate streams are removed without inventing HTTPS addresses',async()=>{
 const h=harness(()=>[row(),row(2,{url_resolved:'https://radio.example/1.mp3'}),row(3,{url_resolved:'http://radio.example/live'}),row(4,{lastcheckok:0}),row(5,{url_resolved:'javascript:alert(1)'}),row(6,{url_resolved:'https://127.0.0.1/secret'}),row(7,{favicon:'javascript:alert(1)'})]);
 const r=await h.api.search();assert.equal(r.items.length,2);assert.equal(r.items[1].cover,'');
});
test('empty HTTPS page preserves Next when the remote page is full',async()=>{
 const h=harness(()=>Array.from({length:60},(_,i)=>row(i,{url_resolved:'http://radio.example/'+i})));const r=await h.api.search();assert.equal(r.items.length,0);assert.equal(r.hasNext,true);
});
test('saved global favorites resolve by stable UUID on another device',async()=>{
 const h=harness(()=>[row()]);const key='rb:'+row().stationuuid;const rows=await h.api.resolve([key,'lv:swh',key]);assert.equal(h.calls.length,1);assert.equal(new URL(h.calls[0].url).searchParams.get('uuids'),row().stationuuid);assert.equal(rows[0].catalogKey,key);
});
test('curated favorites use the small local catalogue without a Radio Browser dependency',async()=>{
 const h=harness(()=>[{catalogKey:'featured:soma-groove-salad',title:'SomaFM Groove Salad'}]);const rows=await h.api.resolve(['featured:soma-groove-salad']);assert.equal(rows.length,1);assert.match(h.calls[0].url,/^data\/radio-featured.json/);
});
test('discovery counts come from API metadata and genre data stays bounded',async()=>{
 const h=harness(url=>url.endsWith('/json/stats')?{stations:58141,countries:241}:url.includes('/countrycodes')?[{name:'DE',stationcount:6000}]:[{name:'rock',stationcount:3020}]);
 assert.equal((await h.api.stats()).stations,58141);assert.equal((await h.api.countries())[0].count,6000);assert.equal((await h.api.genres())[0].count,3020);
 assert.equal(new URL(h.calls[2].url).searchParams.get('limit'),'100');
});
test('quality filters send a supported bitrate minimum without changing the stream URL',async()=>{
 const h=harness(()=>[row(1,{bitrate:192})]);const r=await h.api.search({country:'DE',genre:'rock',bitrateMin:192});assert.equal(new URL(h.calls[0].url).searchParams.get('bitrateMin'),'192');assert.equal(r.items[0].stream_128,row().url_resolved);
});
