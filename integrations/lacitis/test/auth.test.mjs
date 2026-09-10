import test from 'node:test';import assert from 'node:assert/strict';
import {handleDezuraAuth,radioOperation,nextDutyBoundary} from '../dezura-auth.mjs';import {localDb} from '../local-db.mjs';
function harness(config={}){const DB=localDb();return {DB,async call(path,data={}){const response=await handleDezuraAuth('dezura/'+path,new Request('http://local/dezura/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),{DB,...config});return {status:response.status,...await response.json()};},close(){DB.sqlite.close();}};}
async function create(h,name='Alpha Test',pin='123456'){return h.call('login',{name,pin,confirm:pin,createPin:true});}
test('duty expiry follows Riga 08:00 through midnight, exact handover and DST',()=>{
 for(const [now,end] of [
  ['2026-09-08T21:01:00Z','2026-09-09T05:00:00Z'],
  ['2026-09-09T04:59:59Z','2026-09-09T05:00:00Z'],
  ['2026-09-09T05:00:00Z','2026-09-10T05:00:00Z'],
  ['2026-03-28T07:00:00Z','2026-03-29T05:00:00Z'],
  ['2026-10-24T06:00:00Z','2026-10-25T06:00:00Z']
 ])assert.equal(nextDutyBoundary(Date.parse(now)),Date.parse(end),now);
});
test('server rejects both music and radio session at handover without browser logout',async t=>{
 let now=Date.parse('2026-09-09T04:59:00Z');t.mock.method(Date,'now',()=>now);const h=harness();
 try{const a=await create(h),payload={sessionToken:a.session.sessionToken};assert.equal(a.session.expiresAt,Date.parse('2026-09-09T05:00:00Z'));
  now=a.session.expiresAt-1;assert.equal((await h.call('radio/load',payload)).status,200);
  now++;for(const route of ['session','radio/load','radio/change','library/load','library/save'])assert.equal((await h.call(route,payload)).status,401,route);
  const again=await h.call('login',{name:'Alpha Test',pin:'123456'});assert.equal(again.status,200);assert.equal(again.session.expiresAt,Date.parse('2026-09-10T05:00:00Z'));
 }finally{h.close();}
});
test('one login owns both libraries; a forged worker ID cannot read/write someone else',async()=>{
 const h=harness();try{const a=await create(h),b=await create(h,'Beta Test');assert.equal(a.status,200);assert.match(a.recoveryCode,/^[a-f0-9]{24}$/);
 const sa={sessionToken:a.session.sessionToken},sb={sessionToken:b.session.sessionToken};
 assert.equal((await h.call('library/save',{...sa,data:{library:{library_favorites:['song']}}})).status,200);
 await h.call('radio/change',{...sa,operation:{type:'favorite-add',id:'lv:swh'}});
 const fake={...sb,workerId:a.session.workerId,name:a.session.name};assert.equal((await h.call('library/load',fake)).data,null);assert.deepEqual((await h.call('radio/load',fake)).data.favorites,[]);
 assert.equal((await h.call('library/load',{workerId:a.session.workerId,name:a.session.name})).status,401);
 assert.deepEqual((await h.call('radio/load',sa)).data.favorites,['lv:swh']);assert.deepEqual((await h.call('library/load',sa)).data.library.library_favorites,['song']);
 }finally{h.close();}
});
test('existing indexed Lācītis account keeps its PIN and library across roster order changes',async()=>{
 const h=harness();try{const a=await create(h);h.DB.sqlite.exec(`UPDATE dezura_workers SET worker_id='minka-alpha-test-3' WHERE worker_id='${a.session.workerId}'; UPDATE dezura_pins SET worker_id='minka-alpha-test-3' WHERE worker_id='${a.session.workerId}'`);
 const status=await h.call('pin-status',{name:' ALPHA   TEST ',workerId:'minka-alpha-test-0'});assert.equal(status.workerId,'minka-alpha-test-3');assert.equal(status.hasPin,true);
 const login=await h.call('login',{name:'Alpha Test',pin:'123456'});assert.equal(login.session.workerId,'minka-alpha-test-3');assert.equal(login.status,200);
 }finally{h.close();}
});
test('new PIN needs six digits and confirmation; incorrect PIN attempts are limited',async()=>{
 const h=harness();try{assert.equal((await create(h,'Alpha Test','1234')).status,400);assert.equal((await h.call('login',{name:'Alpha Test',pin:'123456',confirm:'999999',createPin:true})).status,400);
 await create(h);for(let i=0;i<5;i++)assert.equal((await h.call('login',{name:'Alpha Test',pin:'000000'})).status,401);
 assert.equal((await h.call('login',{name:'Alpha Test',pin:'123456'})).status,429);
 }finally{h.close();}
});
test('PIN recovery consumes code, preserves data and revokes old sessions',async()=>{
 const h=harness();try{const a=await create(h),auth={sessionToken:a.session.sessionToken};await h.call('radio/change',{...auth,operation:{type:'favorite-add',id:'record:rock'}});
 assert.equal((await h.call('recover',{name:'Alpha Test',recoveryCode:'wrong',pin:'654321',confirm:'654321'})).status,401);
 const reset=await h.call('recover',{name:'Alpha Test',recoveryCode:a.recoveryCode,pin:'654321',confirm:'654321'});assert.equal(reset.status,200);assert.notEqual(reset.recoveryCode,a.recoveryCode);
 assert.equal((await h.call('session',auth)).status,401);assert.equal((await h.call('login',{name:'Alpha Test',pin:'123456'})).status,401);
 const next=await h.call('login',{name:'Alpha Test',pin:'654321'});assert.equal(next.status,200);assert.deepEqual((await h.call('radio/load',{sessionToken:next.session.sessionToken})).data.favorites,['record:rock']);
 assert.equal((await h.call('recover',{name:'Alpha Test',recoveryCode:a.recoveryCode,pin:'111111',confirm:'111111'})).status,401);
 }finally{h.close();}
});
test('radio operations are idempotent and preserve settings and favorite order',async()=>{
 const h=harness();try{const a=await create(h),auth={sessionToken:a.session.sessionToken};for(const op of [{type:'favorite-add',id:'a'},{type:'favorite-add',id:'b'},{type:'favorite-add',id:'b'},{type:'settings',settings:{theme:'Pusnakts',glow:50,layout:'clean'}},{type:'favorite-move',id:'b',before:'a'}])assert.equal((await h.call('radio/change',{...auth,operation:op})).status,200);
 const result=await h.call('radio/load',auth);assert.deepEqual(result.data.favorites,['b','a']);assert.equal(result.data.settings.glow,50);assert.equal(result.data.settings.layout,'clean');
 await h.call('radio/change',{...auth,operation:{type:'reset-look'}});assert.deepEqual((await h.call('radio/load',auth)).data.favorites,['b','a']);
 }finally{h.close();}
});
test('expiry, logout and oversized requests fail closed',async()=>{
 const h=harness();try{const a=await create(h),auth={sessionToken:a.session.sessionToken};assert.equal((await h.call('logout',auth)).status,200);assert.equal((await h.call('session',auth)).status,401);
 const b=await h.call('login',{name:'Alpha Test',pin:'123456'});h.DB.sqlite.exec('UPDATE media_sessions SET expires_at=0');assert.equal((await h.call('radio/load',{sessionToken:b.session.sessionToken})).status,401);
 assert.equal((await h.call('login',{name:'x'.repeat(300000)})).status,413);
 }finally{h.close();}
});
test('name collisions with separate protected accounts require review rather than silent merge',async()=>{
 const h=harness();try{const a=await create(h);h.DB.sqlite.exec(`INSERT INTO dezura_workers SELECT 'duplicate',name,role,shift,last_shift_expires_at,updated_at FROM dezura_workers;INSERT INTO dezura_pins SELECT 'duplicate',pin_hash,pin_salt,iterations,created_at,updated_at FROM dezura_pins;`);assert.equal((await h.call('pin-status',{name:a.session.name})).status,409);
 }finally{h.close();}
});

test('administrator recovery requires its own secret and replaces only the recovery code',async()=>{
 const key='test-admin-key-'.repeat(4),h=harness({LACITIS_RECOVERY_ADMIN_KEY:key});try{
  const a=await create(h),auth={sessionToken:a.session.sessionToken};await h.call('radio/change',{...auth,operation:{type:'favorite-add',id:'record:keep'}});
  assert.equal((await h.call('admin/recovery',{name:'Alpha Test',adminKey:'wrong'})).status,403);
  const replacement=await h.call('admin/recovery',{name:'Alpha Test',adminKey:key});assert.equal(replacement.status,200);assert.match(replacement.recoveryCode,/^[a-f0-9]{24}$/);
  assert.equal((await h.call('recover',{name:'Alpha Test',recoveryCode:a.recoveryCode,pin:'888888',confirm:'888888'})).status,401);
  assert.equal((await h.call('session',auth)).status,200);
  assert.equal((await h.call('recover',{name:'Alpha Test',recoveryCode:replacement.recoveryCode,pin:'888888',confirm:'888888'})).status,200);
  const login=await h.call('login',{name:'Alpha Test',pin:'888888'});assert.deepEqual((await h.call('radio/load',{sessionToken:login.session.sessionToken})).data.favorites,['record:keep']);
 }finally{h.close();}
 const disabled=harness();try{assert.equal((await disabled.call('admin/recovery',{name:'Alpha Test',adminKey:key})).status,503);}finally{disabled.close();}
});

test('reviewed canonical identity uses the established account without merging duplicate PIN records',async()=>{
 const h=harness();try{const a=await create(h);h.DB.sqlite.exec(`INSERT INTO dezura_workers SELECT 'old-indexed',name,role,shift,last_shift_expires_at,updated_at FROM dezura_workers;INSERT INTO dezura_pins SELECT 'old-indexed',pin_hash,pin_salt,iterations,created_at,updated_at FROM dezura_pins;`);
  await h.DB.prepare('INSERT INTO media_identities VALUES (?,?)').bind('alpha test',a.session.workerId).run();
  const status=await h.call('pin-status',{name:'ALPHA TEST'});assert.equal(status.workerId,a.session.workerId);assert.equal((await h.call('login',{name:'Alpha Test',pin:'123456'})).status,200);
  assert.equal(h.DB.sqlite.prepare('SELECT count(*) AS n FROM dezura_pins').get().n,2);
 }finally{h.close();}
});
test('radio layout accepts only supported choices and survives unrelated changes',()=>{
 let data=radioOperation({}, {type:'settings',settings:{layout:'clean'}});
 data=radioOperation(data,{type:'favorite-add',id:'record:remix'});assert.equal(data.settings.layout,'clean');
 data=radioOperation(data,{type:'settings',settings:{layout:'invalid'}});assert.equal(data.settings.layout,'clean');
 data=radioOperation(data,{type:'settings',settings:{layout:'classic'}});assert.equal(data.settings.layout,'classic');
});
test('spectrum frame setting persists and invalid values cannot overwrite it',()=>{
 let data=radioOperation({}, {type:'settings',settings:{vizFrame:'off',layout:'clean'}});
 data=radioOperation(data,{type:'settings',settings:{vizFrame:'invalid'}});assert.equal(data.settings.vizFrame,'off');assert.equal(data.settings.layout,'clean');
 data=radioOperation(data,{type:'settings',settings:{vizFrame:'on'}});assert.equal(data.settings.vizFrame,'on');
});
test('image crop coordinates persist through the profile API and stay account scoped',async()=>{
 const h=harness();try{
  const a=await create(h),auth={sessionToken:a.session.sessionToken},key='kalendars/data/radio-skins/marble-bust.webp';
  const imageCrops={[key]:{x:.2,y:-.4,zoom:.85}};
  assert.equal((await h.call('radio/change',{...auth,operation:{type:'settings',settings:{imageCrops}}})).status,200);
  await h.call('radio/change',{...auth,operation:{type:'favorite-add',id:'record:test'}});
  assert.deepEqual((await h.call('radio/load',auth)).data.settings.imageCrops,imageCrops);
  const b=await create(h,'Beta Test');assert.equal((await h.call('radio/load',{sessionToken:b.session.sessionToken,workerId:a.session.workerId})).data.settings.imageCrops,undefined);
  const second=await h.call('login',{name:'Alpha Test',pin:'123456'});assert.deepEqual((await h.call('radio/load',{sessionToken:second.session.sessionToken})).data.settings.imageCrops,imageCrops);
  await h.call('radio/change',{...auth,operation:{type:'reset-look'}});
  assert.equal((await h.call('radio/load',auth)).data.settings.imageCrops,undefined);
 }finally{h.close();}
});
test('image crop payloads reject malformed entries and bound storage and geometry',()=>{
 const imageCrops=Object.fromEntries(Array.from({length:100},(_,i)=>['kalendars/'+i,{x:99,y:-99,zoom:99}]));
 imageCrops.bad={x:0,y:0,zoom:1};imageCrops['kalendars/invalid']={x:NaN,y:0,zoom:1};
 const settings=radioOperation({}, {type:'settings',settings:{imageCrops}}).settings;
 assert.equal(Object.keys(settings.imageCrops).length,32);
 assert.deepEqual(Object.values(settings.imageCrops)[0],{x:.75,y:-2,zoom:2});
 assert.deepEqual(radioOperation({}, {type:'settings',settings:{imageCrops:[]}}).settings,{});
});

test('Pioneer look survives save, unrelated changes and another authenticated device',async()=>{
 const h=harness();try{
  const a=await create(h),auth={sessionToken:a.session.sessionToken};
  const settings={layout:'pioneer',pioneerPixels:true,metalColor:'#755363',metalLight:62,metalShine:48,vizFrame:'off',viz:'27',vizPositions:{classic:{x:.2,y:-.1},pioneer:{x:-.4,y:.3}}};
  const saved=await h.call('radio/change',{...auth,operation:{type:'settings',settings}});
  assert.equal(saved.status,200);assert.deepEqual(saved.data.settings,settings);
  await h.call('radio/change',{...auth,operation:{type:'favorite-add',id:'record:remix'}});
  const second=await h.call('login',{name:'Alpha Test',pin:'123456'});
  const loaded=await h.call('radio/load',{sessionToken:second.session.sessionToken});
  assert.deepEqual(loaded.data.settings,settings);assert.deepEqual(loaded.data.favorites,['record:remix']);
  const b=await create(h,'Beta Test');assert.deepEqual((await h.call('radio/load',{sessionToken:b.session.sessionToken})).data.settings,{});
  await h.call('radio/change',{...auth,operation:{type:'reset-look'}});
  const reset=await h.call('radio/load',auth);assert.deepEqual(reset.data.settings,{});assert.deepEqual(reset.data.favorites,['record:remix']);
 }finally{h.close();}
});

test('Pioneer values validate colors, finite numbers and bounded per-layout positions',()=>{
 const settings=radioOperation({}, {type:'settings',settings:{layout:'pioneer',metalColor:'#aBc123',metalLight:130,metalShine:-5,vizPositions:{pioneer:{x:99,y:-99},classic:{x:NaN,y:0},clean:{x:'1',y:0},unknown:{x:0,y:0}}}}).settings;
 assert.deepEqual(settings,{layout:'pioneer',metalColor:'#aBc123',metalLight:100,metalShine:0,vizPositions:{pioneer:{x:1,y:-1}}});
 const next=radioOperation({settings},{type:'settings',settings:{layout:'bad',metalColor:'url(https://invalid)',metalLight:Infinity,metalShine:'90',vizPositions:[]}});
 assert.deepEqual(next.settings,settings);
});

test('OEL preference accepts booleans, preserves false and ignores malformed values',()=>{
 const enabled=radioOperation({}, {type:'settings',settings:{pioneerPixels:true}});
 assert.equal(enabled.settings.pioneerPixels,true);
 const disabled=radioOperation(enabled,{type:'settings',settings:{pioneerPixels:false}});
 assert.equal(disabled.settings.pioneerPixels,false);
 assert.equal(radioOperation(disabled,{type:'settings',settings:{pioneerPixels:'true'}}).settings.pioneerPixels,false);
});
