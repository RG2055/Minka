import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/nightsplit.js',import.meta.url),'utf8');
const marker=source.slice(source.indexOf('  var _nsFlowTimer=0;'),source.indexOf('  function getPublicPlan('));
test('night buddy timer sleeps when hidden or closed and resumes once',()=>{
  let started=0,cleared=0,reads=0;
  const document={hidden:false,querySelector(){reads++;return null;}};
  const window={__nsOverlayOpen:false};
  const ctx=vm.createContext({document,window,setInterval(){started++;return started;},clearInterval(){cleared++;}});
  vm.runInContext(marker+';globalThis.refresh=refreshFlowLiveMarker;',ctx);
  ctx.refresh();assert.equal(started,0);assert.equal(reads,0);
  window.__nsOverlayOpen=true;ctx.refresh();ctx.refresh();assert.equal(started,1);
  document.hidden=true;ctx.refresh();assert.equal(cleared,1);assert.equal(reads,2);
  document.hidden=false;ctx.refresh();assert.equal(started,2);
  window.__nsOverlayOpen=false;ctx.refresh();ctx.refresh();assert.equal(cleared,2);
});
