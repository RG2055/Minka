import test from 'node:test';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const root = new URL('../data/card-addons/realistic-v1/', import.meta.url);
const catalogue = await readFile(new URL('../js/card-addons.js', import.meta.url), 'utf8');
const items = [...catalogue.matchAll(/\{ id: '([^']+)', label: '([^']+)', group: '([^']+)'[^\n]+src: optimized\('([^']+)'\)/g)];

test('the complete replacement decor collection preserves every existing picker identity', async () => {
  assert.equal(items.length, 61);
  assert.equal(new Set(items.map(m=>m[1])).size, 61);
  const files=(await readdir(root)).filter(f=>f.endsWith('.webp')).sort();
  assert.deepEqual(files,items.map(m=>m[4]).sort());
  const prompts=JSON.parse(await readFile(new URL('prompts.json',root),'utf8'));
  assert.deepEqual(prompts.map(p=>p.id).sort(),items.map(m=>m[1]).sort());
});

test('decorations are small transparent WebP assets at display-appropriate resolution', async () => {
  let total=0;
  for(const [,id,,,file] of items){
    const data=await readFile(new URL(file,root)); total+=data.length;
    assert.equal(data.toString('ascii',0,4),'RIFF',id);
    assert.equal(data.toString('ascii',8,12),'WEBP',id);
    assert.equal(data.toString('ascii',12,16),'VP8X',id);
    assert.ok(data[20]&0x10,id+' must retain alpha');
    const width=data.readUIntLE(24,3)+1,height=data.readUIntLE(27,3)+1;
    assert.ok(width>16&&width<=512&&height>16&&height<=512,id);
    assert.ok(data.length<100000,id+' exceeds the per-asset budget');
  }
  assert.ok(total<2*1024*1024,'collection exceeds 2 MB');
});


test('saved legacy decorations resolve new artwork without rewriting positions or storage', () => {
  const saved=Object.fromEntries(items.map((m,i)=>['PERSON '+i,{id:m[1],scale:1.2,side:'left',x:12,y:-7}]));
  const original=JSON.stringify(saved);let writes=0;
  const context={window:{addEventListener(){}},document:{readyState:'loading',baseURI:'https://example.test/kalendars/',addEventListener(){}},URL,setTimeout(){},clearTimeout(){},localStorage:{getItem(){return original;},setItem(){writes++;}}};
  vm.runInNewContext(catalogue,context);
  const addons=context.window.MinkaCardAddons;
  items.forEach((m,i)=>{
    assert.equal(JSON.stringify(addons.get('PERSON '+i)),JSON.stringify(saved['PERSON '+i]));
    assert.equal(new URL(addons.getDecoration('PERSON '+i).src).pathname,'/kalendars/data/card-addons/realistic-v1/'+m[4]);
  });
  assert.equal(writes,0);
});
