import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/card-addons.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('  function normName('),source.indexOf('  function writeAll('))+source.slice(source.indexOf('  function getConfig('),source.indexOf('  function normalizeConfig('));
function client(stored){
 const c=vm.createContext({STORAGE_KEY:'test',window:{mkAppearanceIdentity:n=>['OLD NAME','NEW NAME'].includes(String(n).toUpperCase())?'IDENTITY-01':String(n).toUpperCase()},localStorage:{getItem:()=>JSON.stringify(stored)}});
 vm.runInContext(functions,c);return c;
}
test('cloud identity-keyed decoration is found through either display name',()=>{
 const c=client({'IDENTITY-01':{id:'object-crystal-cat'}});
 assert.equal(c.getConfig('OLD NAME').id,'object-crystal-cat');
 assert.equal(c.getConfig('NEW NAME').id,'object-crystal-cat');
});
test('legacy local decoration remains readable under canonical identity',()=>{
 const c=client({'OLD NAME':{id:'object-crystal-cat'}});
 assert.equal(c.getConfig('NEW NAME').id,'object-crystal-cat');
 assert.deepEqual(Object.keys(c.readAll()),['IDENTITY-01']);
});
test('canonical cloud decoration wins regardless of legacy key order',()=>{
 for(const data of [{ 'OLD NAME':{id:'old'},'IDENTITY-01':{id:'new'}},{'IDENTITY-01':{id:'new'},'OLD NAME':{id:'old'}}])assert.equal(client(data).getConfig('NEW NAME').id,'new');
});
