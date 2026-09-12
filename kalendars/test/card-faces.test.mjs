import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../js/card-face-model.js';

const M = globalThis.MinkaCardFaceModel;
const source = await readFile(new URL('../../cloudflare/minka-api/src/index.js', import.meta.url), 'utf8');
const worker = new Function(source.replace('export default worker;', 'return worker;'))();
function fixture() {
  const values = new Map();
  const env = { APP_PASSWORD: 'fixture', MINKA_EMOJI: {
    get: async key => values.get(key), put: async (key, value) => values.set(key, value), delete: async key => values.delete(key)
  } };
  return (skin, method = 'POST') => worker.fetch(new Request('https://example.test/api/skins', {
    method, headers: { authorization: 'Bearer fixture', 'content-type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify({ worker: 'ALPHA TEST', skin }) } : {})
  }), env, {});
}

test('each face preserves custom positions, visibility, colour and image crop across storage', () => {
  for (const face of M.faces) {
    const value = M.preset(face);
    Object.assign(value, { tint: 'abcdef', metal: 11, finish: 2, imageX: 0, imageY: 100, imageZoom: 180 });
    value.parts.hours = [95, 5, 170, 1];
    value.parts.clock = [50, 80, 50, 1];
    value.parts.coffee[3] = 0;
    assert.deepEqual(M.unpack(M.pack(value)), value);
  }
});

test('changing presets retains chosen materials but resets the element layout', () => {
  const original = M.preset('photo');
  original.parts.hours[0] = 5;
  original.tint = '123456'; original.metal = 10;
  const next = M.preset('orbit', original);
  assert.equal(next.tint, '123456'); assert.equal(next.metal, 10);
  assert.deepEqual(next.parts, M.preset('orbit').parts);
  assert.equal(original.parts.hours[0], 5);
});

test('invalid local values are bounded without overriding chosen visibility', () => {
  const value = M.clean({ tint: 'url(evil)', imageZoom: 999, parts: { hours: [-100, Infinity, 999, 0], name: [50, 50, 100, 0] } });
  assert.equal(value.tint, 'd5e6ef'); assert.equal(value.imageZoom, 180);
  assert.deepEqual(value.parts.hours, [5, 45, 300, 0]);
  assert.equal(value.parts.name[3], 0);
});

test('every default style includes the person emoji', () => {
  for (const face of M.faces) assert.equal(M.preset(face).parts.emoji[3], 1);
});

test('old symbol defaults move beside the numeral while custom positions and visibility survive', () => {
  const face=M.preset('classic');
  Object.assign(face.parts,{coffee:[23,13,80,1],name:[50,77,72,1],month:[81,85,65,0],moon:[82,39,90,0]});
  const upgraded=M.unpack(M.pack(face));
  assert.notDeepEqual(upgraded.parts.moon.slice(0,3),[82,39,90]);
  assert.equal(upgraded.parts.moon[3],0);
  face.parts.moon=[30,62,140,1];
  assert.deepEqual(M.unpack(M.pack(face)).parts.moon,face.parts.moon);
  const fern={hours:[68,39,105,1]},orchid={hours:[70,38,105,1]};
  assert.deepEqual(M.symbolPlacement(fern,'photo'),[47,17,100,1]);
  assert.deepEqual(M.symbolPlacement(orchid,'photo'),[49,16,100,1]);
  // Butterfly and koi use a wider, high-set numeral: leave room to its left.
  const classic=M.symbolPlacement({hours:[58,28,100,1]},'classic');
  assert.deepEqual(classic,[20,24,90,1]);
  assert.ok(classic[0]+16*classic[2]/200 < 58-30);
  const moved=M.clean({...face,parts:{...face.parts,hours:[60,55,120,1]}});
  assert.deepEqual(moved.parts.moon,[30,62,140,1]);
});

test('shift symbols distinguish day, overnight and 24 hour duties including effective overrides', async () => {
  const calendar=await readFile(new URL('../js/calendar.js',import.meta.url),'utf8');
  const fn=calendar.slice(calendar.indexOf('  function getDutyPeriod('),calendar.indexOf('  // Compute real shift end'));
  const period=new Function('getDutyShiftType','getDutyShiftHours','getDutyStartTime','getDutyEndTime',fn+';return getDutyPeriod;')(
    w=>w.__minkaDutyType||w.type||'',w=>w.hours,w=>w.start||'',w=>w.end||''
  );
  assert.equal(period({hours:12,start:'20:00',end:'08:00'}),'night');
  assert.equal(period({hours:15,start:'17:00',end:'08:00'}),'night');
  assert.equal(period({hours:9,start:'08:00',end:'17:00'}),'day');
  assert.equal(period({hours:12,type:'NAKTS'}),'night');
  assert.equal(period({hours:24,start:'08:00',end:'08:00'}),'mixed');
  assert.equal(period({hours:12}),'mixed');
  assert.equal(period({hours:24,type:'DIENA',__minkaDutyType:'NAKTS'}),'night');
});

test('v1 saved cards retain all existing elements and upgrade to an independent moon', async () => {
  const request=fixture();
  const original=M.preset('photo');
  original.parts.month[3]=0;
  original.parts.hours=[68,38,130,1];
  const fields=M.pack(original).split('~');fields[0]='1';fields.pop();
  const legacy=fields.join('~');
  assert.deepEqual(M.unpack(legacy),original);
  assert.equal((await request('wf:'+legacy)).status,200);
  const next=M.unpack(legacy);next.parts.moon=[77,17,135,0];
  const packed=M.pack(next);
  assert.equal(packed.split('~').length,18);
  assert.equal((await request('wf:'+packed)).status,200);
  const stored=(await (await request(undefined,'GET')).json())['ALPHA TEST'];
  assert.deepEqual(M.unpack(stored.slice(3)),next);
  next.parts.moon[3]=1;
  assert.equal(next.parts.month[3],0);
  assert.deepEqual(next.parts.hours,original.parts.hours);
  for(const bad of [packed.replace(/^2~/,'1~'),legacy.replace(/^1~/,'2~'),packed.replace(/77,17,135,0$/,'77,17,171,1')]){
    assert.equal(M.unpack(bad),null);
    assert.equal((await request('wf:'+bad)).status,400);
  }
});

test('coffee presentation and contrast survive API storage and legacy defaults', async () => {
  const request=fixture();
  for(const mode of [0,1])for(const contrast of [0,1,2]){
    const face=M.preset('photo');face.coffeeMode=mode;face.coffeeContrast=contrast;
    face.parts.coffee=[34,27,120,1];
    const packed=M.pack(face);
    assert.deepEqual(M.unpack(packed),face);
    assert.equal((await request('wf:'+packed)).status,200);
    const stored=(await (await request(undefined,'GET')).json())['ALPHA TEST'];
    assert.deepEqual(M.unpack(stored.slice(3)),face);
    assert.equal(M.preset('classic',face).coffeeMode,mode);
    assert.equal(M.preset('classic',face).coffeeContrast,contrast);
  }
  const old=M.unpack(M.pack(M.preset('classic')));
  assert.equal(old.coffeeMode,1);assert.equal(old.coffeeContrast,0);
  const face=M.preset('photo');face.coffeeMode=0;
  for(const index of [18,19])for(const invalid of ['3','-1','true','url(x)']){
    const fields=M.pack(face).split('~');fields[index]=invalid;
    assert.equal(M.unpack(fields.join('~')),null);
    assert.equal((await request('wf:'+fields.join('~'))).status,400);
  }
});

test('adaptive coffee surfaces maintain readable contrast on light and dark palettes', () => {
  const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  for(const r of [0,128,255])for(const g of [0,128,255])for(const b of [0,128,255]){
    const colors=M.coffeeColors([r,g,b].join(','));
    const bg=luminance(colors.background.match(/\d+/g).map(Number));
    const fg=luminance(colors.foreground.slice(1).match(/../g).map(v=>parseInt(v,16)));
    assert.ok((Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)>=7);
    const tinted=M.coffeeColors([r,g,b].join(','),true);
    const tb=luminance(tinted.background.match(/\d+/g).map(Number)),tf=luminance(tinted.foreground.match(/\d+/g).map(Number));
    assert.ok((Math.max(tb,tf)+.05)/(Math.min(tb,tf)+.05)>=4.5);
  }
});

test('a corner widget is moved inside the rounded frame without changing visibility', () => {
  const p=M.fitPart([84,13,90,1],28,34);
  assert.ok(p[0]<=80 && p[1]>=25);
  assert.equal(p[2],90);
  assert.equal(p[3],1);
  for(const x of [p[0]-14,p[0]+14])for(const y of [p[1]-17,p[1]+17]){
    const cx=x<22?22:x>78?78:x,cy=y<22?22:y>78?78:y;
    assert.ok(Math.hypot(x-cx,y-cy)<=18);
  }
});

test('oversized numerals fit while an already safe element keeps its position', () => {
  const p=M.fitPart([95,5,170,1],120,100);
  assert.ok(p[2]<170);
  assert.ok(p[0]+120*p[2]/170/2<=96);
  assert.ok(p[1]-100*p[2]/170/2>=4);
  assert.deepEqual(M.fitPart([50,50,100,0],20,20),[50,50,100,0]);
});

test('manual numeral enlargement survives dragging and storage; fitting is explicit', async () => {
  const request=fixture(),face=M.preset('photo');
  face.parts.hours=[62,40,300,1];
  assert.deepEqual(M.fitPart(face.parts.hours,160,182,true),face.parts.hours);
  assert.ok(M.fitPart(face.parts.hours,160,182)[2]<300);
  const skin='wf:'+M.pack(face);
  assert.equal((await request(skin)).status,200);
  const saved=(await (await request(undefined,'GET')).json())['ALPHA TEST'];
  assert.deepEqual(M.unpack(saved.slice(3)).parts.hours,[62,40,300,1]);
  const tooLarge=skin.replace('62,40,300,1','62,40,301,1');
  assert.equal(M.unpack(tooLarge.slice(3)),null);
  assert.equal((await request(tooLarge)).status,400);
});

test('every element can be removed, stored and restored without losing its position', async () => {
  const request = fixture();
  const face = M.preset('photo');
  for (const part of M.parts) face.parts[part][3] = 0;
  const hidden = M.pack(face);
  assert.deepEqual(M.unpack(hidden), face);
  assert.equal((await request('wf:' + hidden)).status, 200);
  const restored = M.unpack((await (await request(undefined, 'GET')).json())['ALPHA TEST'].slice(3));
  for (const part of M.parts) {
    assert.equal(restored.parts[part][3], 0);
    restored.parts[part][3] = 1;
    assert.deepEqual(restored.parts[part].slice(0, 3), M.preset('photo').parts[part].slice(0, 3));
  }
  assert.equal((await request('wf:' + M.pack(restored))).status, 200);
});

test('API persists complete legacy appearance plus face and decoration, and can reset it', async () => {
  const request = fixture();
  const legacy = 'img:forest;txt:255,255,255;num:110,231,183;na:0.8;em:0.3;emn:1;fx:glow;fxs:1.2;av:1;ad:object-crystal-cat,100,l,0,0';
  for (const skin of [legacy, ...M.faces.map(face => legacy + ';wf:' + M.pack(M.preset(face)))]) {
    const response = await request(skin);
    assert.equal(response.status, 200, await response.text());
    assert.equal((await (await request(undefined, 'GET')).json())['ALPHA TEST'], skin);
  }
  assert.equal((await request(null)).status, 200);
  assert.deepEqual(await (await request(undefined, 'GET')).json(), {});
});

test('API and decoder reject malformed and out of range layouts without overwriting saved data', async () => {
  const request = fixture();
  const valid = M.pack(M.preset('photo'));
  const mutations = [[0,'3'],[1,'4'],[2,'url(x)'],[3,'12'],[4,'6'],[5,'101'],[6,'-1'],[7,'99'],[8,'50,50,100,2'],[9,'50,50,100,-1'],[10,'50,50,171,1'],[11,'00,50,100,1']];
  await request('grad:menta');
  for (const [index, replacement] of mutations) {
    const fields = valid.split('~'); fields[index] = replacement;
    const bad = fields.join('~');
    assert.equal(M.unpack(bad), null);
    assert.equal((await request('wf:' + bad)).status, 400);
  }
  for (const bad of ['wf:' + valid + ';wf:' + valid, 'wf:' + valid + ';background:url(evil)', 'wf:' + valid + ';dp:0;dp:0', 'wf:' + valid + ';dp:2', 'wf:' + valid.slice(0, -1)]) {
    assert.equal((await request(bad)).status, 400);
  }
  assert.equal((await (await request(undefined, 'GET')).json())['ALPHA TEST'], 'grad:menta');
});

test('all material bundles have local lightweight assets and API-compatible appearance data', async () => {
  await import('../js/card-materials.js');
  const request = fixture();
  const ids = new Set();
  for (const material of globalThis.MinkaCardMaterials) {
    assert.ok(!ids.has(material.id), material.id); ids.add(material.id);
    const asset = await readFile(new URL('../' + material.path, import.meta.url));
    if(material.kind==='depth'){
      assert.ok(asset.length<125000,material.id);
      assert.equal(asset.toString('ascii',8,12),'WEBP');
    }else{
      assert.ok(asset.length<10000,material.id);
      assert.doesNotMatch(asset.toString(),/<(?:script|filter|animate|image)\b|(?:href|src)=/i);
    }
    const face = Object.assign(M.preset(material.face), {tint:material.tint,metal:material.metal,finish:material.finish});
    if(material.hours)face.parts.hours=material.hours.slice();
    Object.assign(face.parts,material.parts||{});
    assert.deepEqual(M.unpack(M.pack(face)),face,material.id);
    assert.equal(face.parts.emoji[3],1,material.id);
    if(material.foreground){const front=await readFile(new URL('../'+material.foreground,import.meta.url),'utf8');assert.ok(front.length<10000);assert.doesNotMatch(front,/<(?:filter|animate|script|image)\b/);}
    const skin = 'img:' + material.id + ';wf:' + M.pack(face) + ';dp:0;av:1;ad:charm-paw,140,l,0,0';
    const response = await request(skin);
    assert.equal(response.status, 200, material.id + ': ' + await response.text());
    assert.equal((await (await request(undefined,'GET')).json())['ALPHA TEST'], skin);
  }
  assert.equal(ids.size, 17);
  const aliases=globalThis.MinkaCardMaterials.flatMap(m=>m.legacyIds||[]);
  assert.equal(aliases.length,20);
  for(const id of aliases)assert.ok(globalThis.MinkaFindCardMaterial(id).id.startsWith('photo-'));
});

 test('all six finishes persist through API without changing hidden elements or background', async () => {
  const request = fixture();
  for (const style of M.faces) for (let finish = 0; finish <= 5; finish++) {
    const face = M.preset(style); face.finish = finish; face.parts.month[3] = 0;
    const skin = 'img:photo-magnolia;wf:' + M.pack(face);
    assert.deepEqual(M.unpack(M.pack(face)), face);
    assert.equal((await request(skin)).status, 200);
    assert.equal((await (await request(undefined, 'GET')).json())['ALPHA TEST'], skin);
  }
});
