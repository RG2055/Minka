import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../cloudflare/minka-api/src/index.js',import.meta.url),'utf8');
const worker=new Function('fetch',source.replace('export default worker;','return worker;'))(async()=>Response.json({ok:true}));
function env(){const values=new Map(),writes=[];return {values,writes,APP_PASSWORD:'test',MINKA_EMOJI:{async get(k){return values.get(k)||null},async put(k,v,opts){values.set(k,v);writes.push({k,v,opts})}}};}
const names=['Worker One','Worker Two','Worker Three'];
function post(e,body,token='test'){return worker.fetch(new Request('https://example.test/api/ns-order',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({date:'07.09.2026',...body})}),e,{waitUntil(p){p.catch(()=>{})}});}
test('night history requires authentication',async()=>{const e=env();assert.equal((await post(e,{order:names,sh:0,ei:0},'wrong')).status,401);assert.equal(e.writes.length,0);});
test('half-hour starts survive API persistence and authenticated history is retained',async()=>{
 for(const sh of [0.5,23.5]){const e=env();const r=await post(e,{order:names,sh,ei:0,savedAt:Date.now()});assert.equal(r.status,200);
 const saved=JSON.parse(e.values.get('ns::07.09.2026'));assert.equal(saved.sh,sh);assert.equal(saved.revisions[0].sh,sh);assert.ok(e.writes[0].opts.expirationTtl>=42*86400);}
});
test('server keeps recorded revisions and rejects older writes',async()=>{
 const e=env(),base=Date.now()-10000,old={order:names,sh:0,ei:0,savedAt:base,revisions:[{order:names,sh:0,ei:0,from:base}]};e.values.set('ns::07.09.2026',JSON.stringify(old));
 assert.equal((await post(e,{order:[...names].reverse(),sh:0,ei:0,savedAt:base-1})).status,409);assert.equal(e.writes.length,0);
 assert.equal((await post(e,{order:[...names].reverse(),sh:0,ei:0,savedAt:base+5000,revisions:[{order:[...names].reverse(),sh:0,ei:0,from:base-1000},{order:[...names].reverse(),sh:0,ei:0,from:base+5000}]})).status,200);
 const saved=JSON.parse(e.values.get('ns::07.09.2026'));assert.equal(saved.revisions.length,2);assert.deepEqual(saved.revisions[0],old.revisions[0]);assert.equal(saved.revisions[1].from,base+5000);
});
test('invalid or duplicate members do not persist night plans',async()=>{
 for(const body of [{order:[names[0],names[0]],sh:0,ei:0},{order:names,sh:2,ei:0},{order:names,sh:0,ei:4}]){const e=env();assert.equal((await post(e,body)).status,400);assert.equal(e.writes.length,0);}
});

test('legacy plans without revisions remain readable and gain history on next save',async()=>{
 const e=env(),savedAt=Date.now()-1000;
 e.values.set('ns::07.09.2026',JSON.stringify({order:names,sh:0,ei:0,savedAt}));
 const before=await worker.fetch(new Request('https://example.test/api/ns-order?date=07.09.2026',{headers:{authorization:'Bearer test'}}),e,{});
 assert.equal(before.status,200);assert.deepEqual((await before.json()).order,names);
 assert.equal((await post(e,{order:names,sh:0,ei:0,savedAt:Date.now()})).status,200);
 const stored=JSON.parse(e.values.get('ns::07.09.2026'));
 assert.deepEqual(stored.order,names);assert.equal(stored.revisions.length,1);
 assert.equal(stored.revisions[0].from,savedAt);
});
