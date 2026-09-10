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
  let response;const request={method:'GET',url:'https://rds.eurozet.pl/reader/history.php?true=jsonData&_='+stamp,destination:'script',cache:'default'};
  events.fetch({request,respondWith:value=>response=value});assert.equal(await(await response).text(),'jsonData({})');
 }
 assert.equal(requests.length,2);
});
