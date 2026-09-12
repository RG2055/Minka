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
  assert.deepEqual(value.parts.hours, [5, 45, 170, 0]);
  assert.equal(value.parts.name[3], 0);
});

test('every default style includes the person emoji', () => {
  for (const face of M.faces) assert.equal(M.preset(face).parts.emoji[3], 1);
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
  const mutations = [[0,'2'],[1,'4'],[2,'url(x)'],[3,'12'],[4,'3'],[5,'101'],[6,'-1'],[7,'99'],[8,'50,50,100,2'],[9,'50,50,100,-1'],[10,'50,50,171,1'],[11,'00,50,100,1']];
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
  assert.equal(ids.size, 11);
  const aliases=globalThis.MinkaCardMaterials.flatMap(m=>m.legacyIds||[]);
  assert.equal(aliases.length,20);
  for(const id of aliases)assert.ok(globalThis.MinkaFindCardMaterial(id).id.startsWith('photo-'));
});
