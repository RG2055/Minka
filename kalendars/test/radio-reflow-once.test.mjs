import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const shell=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const calendar=fs.readFileSync(new URL('../js/calendar.js',import.meta.url),'utf8');
const mood=fs.readFileSync(new URL('../js/page/mood-feedback.js',import.meta.url),'utf8');
const extract=(src,start,end)=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));

test('mid-reveal the calendar gets the radio layout height, not its scaled-down box',()=>{
 const props={},sent=[];
 const rw={style:{display:''},offsetHeight:286,getBoundingClientRect:()=>({height:157})};   // scale ~0.55 mid-morph
 const c=vm.createContext({window:{innerWidth:1470,innerHeight:900},_lastShellLayout:null,
  document:{documentElement:{style:{setProperty:(k,v)=>props[k]=v}},body:{classList:{contains:k=>k==='radio-anim'}},
   getElementById:id=>id==='radioWindow'?rw:id==='dockShelf'?{offsetHeight:76}:id==='calIframe'?{contentWindow:{__minkaHostLayout:(p,apply)=>{sent.push(p.radioHeight);apply();}}}:null}});
 vm.runInContext('var _lastShellLayout=null;'+extract(shell,'function _doSync(duringReveal) {','// Initialize Alpine app method'),c);
 c._doSync(true);
 assert.deepEqual(sent,[286]);assert.equal(props['--calendar-bottom'],'372px');
});
test('the mood card is laid out in the host reflow pass, before the cards fade back in',()=>{
 const host=extract(calendar,'window.__minkaHostLayout = function(data, applyHost) {','window.addEventListener(\'message\'');
 assert.match(host,/window\.__minkaMoodHostLayout\(\)/);
 assert.ok(host.indexOf('applyHost()')<host.indexOf('__minkaMoodHostLayout()'),'after the frame has its new size');
 const hook=extract(mood,'  window.__minkaMoodHostLayout = function () {','  window.addEventListener(\'resize\'');
 assert.match(hook,/runMoodSectionLayout\(\);/);assert.match(hook,/placeMoodStaff\(refs\.ring\)/);
});
