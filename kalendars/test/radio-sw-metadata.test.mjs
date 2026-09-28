import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('ZET JSONP refreshes bypass the SW asset cache, even with script destination', async()=>{
 const events={},requests=[];
 vm.runInNewContext(fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8'),{
  URL,Request,Response,self:{registration:{scope:'https://app.example/'},location:{origin:'https://app.example'},addEventListener:(type,handler)=>events[type]=handler},
  fetch:async request=>{requests.push(request);return new Response('jsonData({})');},
  caches:{match(){throw Error('Live metadata must not use cached script responses');},open(){throw Error('Live metadata must not enter the asset cache');}}
 });
 for(const stamp of ['1','2']){
  // The worker leaves live metadata to the browser: no respondWith, so no
  // cached script can answer it and nothing enters the asset cache.
  let responded=false;const request={method:'GET',url:'https://rds.eurozet.pl/reader/history.php?true=jsonData&_='+stamp,destination:'script',cache:'default'};
  events.fetch({request,respondWith:()=>{responded=true;}});assert.equal(responded,false);
 }
 assert.equal(requests.length,0);
});
