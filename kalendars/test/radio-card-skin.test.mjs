import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bridge=html.slice(html.indexOf('  window.mkGetRadioSkin ='),html.indexOf('  function applyNextShiftSkin('));
function harness(){const skins={Alpha:{t:'grad',id:'mint',txt:'217,249,234',num:'110,231,183'},Beta:{t:'img',id:'sea',txt:'255,247,230',num:'252,211,77'}};const ctx=vm.createContext({window:{mkGetWorkerSkin:name=>skins[name]||null},document:{baseURI:'http://localhost:8012/kalendars/index.html'},URL,GRAD_MAP:{mint:'linear-gradient(#14352c,#38b090)'},stockSkinUrl:id=>'data/skins/skin-'+id+'.webp',artUrl:id=>'data/art/'+id+'.webp'});vm.runInContext(bridge,ctx);return ctx.window.mkGetRadioSkin;}
test('radio uses the requested employee background and colors without borrowing another profile',()=>{
 const get=harness(),a=get('Alpha'),b=get('Beta');assert.equal(a.background,'linear-gradient(#14352c,#38b090)');assert.equal(a.text,'#d9f9ea');assert.equal(a.accent,'#6ee7b7');assert.equal(b.background,'url("http://localhost:8012/kalendars/data/skins/skin-sea.webp")');assert.equal(b.text,'#fff7e6');assert.equal(b.accent,'#fcd34d');assert.equal(get('Unknown'),null);assert.equal(get('Alpha').background,a.background);
});
