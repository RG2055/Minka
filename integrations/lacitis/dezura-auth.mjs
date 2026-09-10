// Shared Lācītis music + Minka radio account API. Uses the existing D1 PIN records.
const enc = new TextEncoder();
// The hospital duty day changes at 08:00 in Riga, including DST weekends.
export function nextDutyBoundary(now=Date.now()){
 const format=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const parts=time=>Object.fromEntries(format.formatToParts(new Date(time)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 const p=parts(now),wall=Date.UTC(p.year,p.month-1,p.day+(p.hour>=8?1:0),8),z=parts(wall);
 return wall-(Date.UTC(z.year,z.month-1,z.day,z.hour,z.minute,z.second)-wall);
}
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const norm = value => String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('lv-LV');
const hex = bytes => [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));
async function hashPin(pin,salt,iterations=100000){
 const key=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveBits']);
 const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations},key,256);
 return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function equal(a,b){const x=enc.encode(a),y=enc.encode(b);if(x.length!==y.length)return false;let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;}
async function payload(req){
 const reader=req.body?.getReader();if(!reader)return {};
 let total=0,parts=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>262144){await reader.cancel();throw Object.assign(new Error('Dati ir pārāk lieli.'),{status:413});}parts.push(value);}}finally{reader.releaseLock();}
 const all=new Uint8Array(total);let offset=0;for(const part of parts){all.set(part,offset);offset+=part.length;}
 const data=JSON.parse(new TextDecoder().decode(all));if(!data||Array.isArray(data)||typeof data!=='object')throw new Error('Nederīgi dati.');return data;
}
async function resolveWorker(db,p){
 const name=String(p.name||'').normalize('NFC').trim().replace(/\s+/g,' ');
 if(!name||name.length>120)throw new Error('Izvēlies darbinieku.');
 const mapped=await db.prepare('SELECT w.worker_id,w.name,p.pin_hash,p.pin_salt,p.iterations FROM media_identities i JOIN dezura_workers w ON w.worker_id=i.worker_id LEFT JOIN dezura_pins p ON p.worker_id=w.worker_id WHERE i.normalized_name = ?').bind(norm(name)).first();
 if(mapped){if(norm(mapped.name)!==norm(name))throw Object.assign(new Error('Nepieciešama konta piesaistes pārbaude.'),{status:409});return mapped;}
 // Old Minka IDs contained the day's list index. Match the established account by name,
 // never silently move or merge multiple PIN-protected accounts.
 const rows=(await db.prepare('SELECT w.worker_id, w.name, p.pin_hash, p.pin_salt, p.iterations FROM dezura_workers w LEFT JOIN dezura_pins p ON p.worker_id = w.worker_id LIMIT 2001').all()).results;
 if(rows.length>2000)throw Object.assign(new Error('Nepieciešama kontu pārbaude.'),{status:409});
 const matches=rows.filter(r=>norm(r.name)===norm(name)),withPin=matches.filter(r=>r.pin_hash);
 if(withPin.length>1)throw Object.assign(new Error('Šim vārdam ir vairāki konti. Administratoram jāpārbauda konti.'),{status:409});
 const id='person-'+(await digest(norm(name))).slice(0,32);
 const found=withPin[0]||matches.find(r=>r.worker_id===id)||matches.sort((a,b)=>a.worker_id.localeCompare(b.worker_id))[0];
 return found||{worker_id:id,name};
}
export function cleanRadio(data={}){
 const id=value=>typeof value==='string'&&value.length<=240&&value.length>0;
 const out={favorites:[...new Set((Array.isArray(data.favorites)?data.favorites:[]).filter(id))].slice(0,250),lastStation:id(data.lastStation)?data.lastStation:'',settings:{}};
 const s=data.settings||{};
 if(['classic','clean','pioneer'].includes(s.layout))out.settings.layout=s.layout;
 if(typeof s.pioneerPixels==='boolean')out.settings.pioneerPixels=s.pioneerPixels;
 if(/^#[\da-f]{6}$/i.test(s.metalColor||''))out.settings.metalColor=s.metalColor;
 for(const key of ['metalLight','metalShine'])if(Number.isFinite(s[key]))out.settings[key]=Math.max(0,Math.min(100,s[key]));
 if(s.vizPositions&&typeof s.vizPositions==='object'&&!Array.isArray(s.vizPositions)){
  out.settings.vizPositions={};
  for(const layout of ['classic','clean','pioneer']){
   const point=s.vizPositions[layout];
   if(point&&!Array.isArray(point)&&Number.isFinite(point.x)&&Number.isFinite(point.y))out.settings.vizPositions[layout]={x:Math.max(-1,Math.min(1,point.x)),y:Math.max(-1,Math.min(1,point.y))};
  }
 }
 if(['auto','on','off'].includes(s.vizFrame))out.settings.vizFrame=s.vizFrame;
 if(s.imageCrops&&typeof s.imageCrops==='object'&&!Array.isArray(s.imageCrops)){
  out.settings.imageCrops=Object.fromEntries(Object.entries(s.imageCrops).filter(([key,crop])=>key.startsWith('kalendars/')&&key.length<=500&&crop&&[crop.x,crop.y,crop.zoom].every(Number.isFinite)).slice(-32).map(([key,crop])=>[key,{x:Math.max(-.75,Math.min(.75,crop.x)),y:Math.max(-2,Math.min(2,crop.y)),zoom:Math.max(.6,Math.min(2,crop.zoom))}]));
 }
 for(const k of ['theme','accentMode','accent','text','background','position','viz','eq','cardName','cardAccent'])if(typeof s[k]==='string'&&s[k].length<=1600)out.settings[k]=s[k];
 for(const k of ['darkness','tint','glass','glow'])if(Number.isFinite(s[k]))out.settings[k]=Math.max(0,Math.min(100,s[k]));
 return out;
}
export function radioOperation(data,op){
 const next=cleanRadio(data);if(!op||typeof op!=='object')throw new Error('Nederīga izmaiņa.');
 const id=String(op.id||'');
 if(['favorite-add','favorite-remove','favorite-move','station'].includes(op.type)&&(!id||id.length>240))throw new Error('Nederīga stacija.');
 if(op.type==='favorite-add'&&!next.favorites.includes(id))next.favorites.push(id);
 else if(op.type==='favorite-remove')next.favorites=next.favorites.filter(x=>x!==id);
 else if(op.type==='favorite-move'&&next.favorites.includes(id)){
  next.favorites=next.favorites.filter(x=>x!==id);const at=op.before?next.favorites.indexOf(op.before):-1;next.favorites.splice(at<0?next.favorites.length:at,0,id);
 }else if(op.type==='station')next.lastStation=id;
 else if(op.type==='settings')next.settings={...next.settings,...cleanRadio({settings:op.settings}).settings};
 else if(op.type==='reset-look')next.settings={};
 else if(!['favorite-add','favorite-remove','favorite-move'].includes(op.type))throw new Error('Nezināma izmaiņa.');
 return cleanRadio(next);
}
async function session(db,p,req){
 const token=String(req.headers.get('Authorization')||'').replace(/^Bearer /,'')||String(p.sessionToken||'');
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 return db.prepare('SELECT worker_id, name, expires_at FROM media_sessions WHERE token_hash = ? AND expires_at > ?').bind(await digest(token),Date.now()).first();
}
export async function handleDezuraAuth(path,request,env){
 if(!env.DB)return json({error:'Profila serveris nav konfigurēts.'},503);
 if(path==='dezura/capabilities')return json({version:2,sharedProfile:true});
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 try{
 const p=await payload(request),db=env.DB;
 if(path==='dezura/admin/recovery'){
  const secret=env.LACITIS_RECOVERY_ADMIN_KEY;
  if(!secret||secret.length<32)return json({error:'Administratora atkopšana nav konfigurēta.'},503);
  if(!equal(await digest(String(p.adminKey||'')),await digest(secret)))return json({error:'Nav administratora atļaujas.'},403);
  const worker=await resolveWorker(db,p);if(!worker.pin_hash)return json({error:'Kontam vēl nav PIN.'},404);
  const code=hex(crypto.getRandomValues(new Uint8Array(12)));
  await db.prepare('INSERT INTO media_recovery (worker_id,code_hash) VALUES (?,?) ON CONFLICT(worker_id) DO UPDATE SET code_hash=excluded.code_hash').bind(worker.worker_id,await digest(code)).run();
  return json({ok:true,name:worker.name,recoveryCode:code});
 }
 if(path==='dezura/recover'){
  const worker=await resolveWorker(db,p),now=Date.now();
  const key='recovery-'+await digest(worker.worker_id+'|'+(request.headers.get('CF-Connecting-IP')||'local'));
  await db.prepare('INSERT INTO media_attempts (attempt_key, attempts, expires_at) VALUES (?,1,?) ON CONFLICT(attempt_key) DO UPDATE SET attempts = CASE WHEN expires_at <= ? THEN 1 ELSE attempts + 1 END, expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END').bind(key,now+900000,now,now).run();
  const count=await db.prepare('SELECT attempts FROM media_attempts WHERE attempt_key = ?').bind(key).first();
  if(count.attempts>5)return json({error:'Pārāk daudz mēģinājumu. Mēģini pēc 15 minūtēm.'},429);
  const code=String(p.recoveryCode||'').replace(/[-\s]/g,'').toLowerCase();
  const saved=await db.prepare('SELECT code_hash FROM media_recovery WHERE worker_id = ?').bind(worker.worker_id).first();
  if(!saved||!equal(saved.code_hash,await digest(code)))return json({error:'Atkopšanas kods nav pareizs. Ja tas pazudis, sazinies ar administratoru.'},401);
  if(!/^\d{6}$/.test(p.pin||'')||p.pin!==p.confirm)return json({error:'Jaunajam PIN vajag 6 ciparus un vienādu atkārtojumu.'},400);
  const salt=crypto.randomUUID(),hash=await hashPin(p.pin,salt),newCode=hex(crypto.getRandomValues(new Uint8Array(12)));
  // One transaction both consumes the recovery code and changes the PIN.
  const reset=await db.batch([
   db.prepare('UPDATE dezura_pins SET pin_hash = ?, pin_salt = ?, iterations = 100000, updated_at = ? WHERE worker_id = ? AND EXISTS (SELECT 1 FROM media_recovery WHERE worker_id = ? AND code_hash = ?)').bind(hash,salt,now,worker.worker_id,worker.worker_id,saved.code_hash),
   db.prepare('DELETE FROM media_sessions WHERE worker_id = ? AND EXISTS (SELECT 1 FROM media_recovery WHERE worker_id = ? AND code_hash = ?)').bind(worker.worker_id,worker.worker_id,saved.code_hash),
   db.prepare('UPDATE media_recovery SET code_hash = ? WHERE worker_id = ? AND code_hash = ?').bind(await digest(newCode),worker.worker_id,saved.code_hash)
  ]);
  if(!reset[0].meta.changes||!reset[2].meta.changes)return json({error:'Kods jau izmantots.'},409);
  return json({ok:true,recoveryCode:newCode});
 }
 if(path==='dezura/pin-status'||path==='dezura/login'){
  const worker=await resolveWorker(db,p);
  if(path.endsWith('pin-status'))return json({hasPin:!!worker.pin_hash,workerId:worker.worker_id,name:worker.name});
  const pin=String(p.pin||'');if(!/^\d{4,8}$/.test(pin))return json({error:'Ievadi PIN ciparus.'},400);
  const now=Date.now();const attemptKey=await digest(worker.worker_id+'|'+(request.headers.get('CF-Connecting-IP')||'local'));
  const attempt=await db.prepare('SELECT attempts, expires_at FROM media_attempts WHERE attempt_key = ?').bind(attemptKey).first();
  if(attempt&&attempt.expires_at>now&&attempt.attempts>=5)return json({error:'Pārāk daudz mēģinājumu. Mēģini pēc 15 minūtēm.'},429);
  // Count before verifying, including parallel attempts. A new window resets atomically.
  await db.prepare('INSERT INTO media_attempts (attempt_key, attempts, expires_at) VALUES (?,1,?) ON CONFLICT(attempt_key) DO UPDATE SET attempts = CASE WHEN expires_at <= ? THEN 1 ELSE attempts + 1 END, expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END').bind(attemptKey,now+900000,now,now).run();
  const counted=await db.prepare('SELECT attempts, expires_at FROM media_attempts WHERE attempt_key = ?').bind(attemptKey).first();
  if(counted.attempts>5)return json({error:'Pārāk daudz mēģinājumu. Mēģini pēc 15 minūtēm.'},429);
  if(worker.pin_hash){
   if(!equal(await hashPin(pin,worker.pin_salt,worker.iterations||100000),worker.pin_hash))return json({error:'Nepareizs PIN.'},401);
  }else{
   if(!p.createPin)return json({error:'Izveido PIN.'},404);
   if(!/^\d{6}$/.test(pin)||pin!==p.confirm)return json({error:'Jaunajam PIN vajag 6 ciparus un vienādu atkārtojumu.'},400);
   const salt=crypto.randomUUID(),hash=await hashPin(pin,salt);
   await db.prepare('INSERT OR IGNORE INTO dezura_workers (worker_id,name,role,shift,last_shift_expires_at,updated_at) VALUES (?,?,?, ?,0,?)').bind(worker.worker_id,worker.name,'','Dežūra',now).run();
   const result=await db.prepare('INSERT OR IGNORE INTO dezura_pins (worker_id,pin_hash,pin_salt,iterations,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(worker.worker_id,hash,salt,100000,now,now).run();
   if(!result.meta.changes)return json({error:'PIN tikko izveidots. Ievadi to vēlreiz.'},409);
  }
  const token=hex(crypto.getRandomValues(new Uint8Array(32))),expiresAt=nextDutyBoundary(now);
  await db.batch([
   db.prepare('DELETE FROM media_attempts WHERE attempt_key = ? OR expires_at < ?').bind(attemptKey,now),
   db.prepare('DELETE FROM media_sessions WHERE expires_at < ?').bind(now),
   db.prepare('INSERT INTO media_sessions (token_hash,worker_id,name,expires_at) VALUES (?,?,?,?)').bind(await digest(token),worker.worker_id,worker.name,expiresAt)
  ]);
  let recoveryCode;
  const existingRecovery=await db.prepare('SELECT code_hash FROM media_recovery WHERE worker_id = ?').bind(worker.worker_id).first();
  if(!existingRecovery){
   const code=hex(crypto.getRandomValues(new Uint8Array(12)));
   const added=await db.prepare('INSERT OR IGNORE INTO media_recovery (worker_id,code_hash) VALUES (?,?)').bind(worker.worker_id,await digest(code)).run();
   if(added.meta.changes)recoveryCode=code;
  }
  return json({ok:true,recoveryCode,session:{workerId:worker.worker_id,name:worker.name,expiresAt,sessionToken:token}});
 }
 const s=await session(db,p,request);if(!s)return json({error:'Ielogojies vēlreiz.'},401);
 if(path==='dezura/session')return json({ok:true,session:{workerId:s.worker_id,name:s.name,expiresAt:s.expires_at}});
 if(path==='dezura/logout'){
  const token=String(p.sessionToken||request.headers.get('Authorization')?.replace(/^Bearer /,'')||'');
  await db.prepare('DELETE FROM media_sessions WHERE token_hash = ?').bind(await digest(token)).run();return json({ok:true});
 }
 if(path==='dezura/radio/load'){
  const r=await db.prepare('SELECT data, revision FROM media_radio WHERE worker_id = ?').bind(s.worker_id).first();return json({data:cleanRadio(r?JSON.parse(r.data):{}),revision:r?.revision||0});
 }
 if(path==='dezura/radio/change'){
  await db.prepare('INSERT OR IGNORE INTO media_radio (worker_id,data,revision) VALUES (?, ?, 0)').bind(s.worker_id,JSON.stringify(cleanRadio())).run();
  for(let n=0;n<5;n++){
   const r=await db.prepare('SELECT data, revision FROM media_radio WHERE worker_id = ?').bind(s.worker_id).first();const next=radioOperation(JSON.parse(r.data),p.operation);
   const result=await db.prepare('UPDATE media_radio SET data = ?, revision = revision + 1 WHERE worker_id = ? AND revision = ?').bind(JSON.stringify(next),s.worker_id,r.revision).run();
   if(result.meta.changes)return json({ok:true,data:next,revision:r.revision+1});
  }return json({error:'Vienlaikus notiek citas izmaiņas. Mēģini vēlreiz.'},409);
 }
 if(path==='dezura/library/load'){
  const row=await db.prepare('SELECT data, updated_at FROM dezura_libraries WHERE worker_id = ?').bind(s.worker_id).first();return json({data:row?JSON.parse(row.data):null,updatedAt:row?.updated_at||0});
 }
 if(path==='dezura/library/save'){
  if(!p.data||typeof p.data!=='object'||Array.isArray(p.data))throw new Error('Nederīga bibliotēka.');
  await db.prepare('INSERT INTO dezura_libraries (worker_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(worker_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at').bind(s.worker_id,JSON.stringify(p.data),Date.now()).run();return json({ok:true});
 }
 return json({error:'Not found'},404);
 }catch(e){return json({error:e.status?e.message:'Neizdevās apstrādāt pieprasījumu.'},e.status||400);}
}
