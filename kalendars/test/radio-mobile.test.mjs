import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio-source.js',import.meta.url),'utf8');
function setup(mobile){
 const elements=new Map(),scripts=[];let changes,pause=0,unload=0;
 const make=()=>{const classes=new Set();return {textContent:'',style:{},setAttribute(){},close(){},classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v)}};};
 const body=make(),query={matches:mobile,addEventListener:(event,fn)=>changes=fn};
 const window={matchMedia:()=>query,syncShellLayout(){},__mkPauseRadioForLacitis:()=>pause++,__hideLacMiniForRadio:()=>unload++,openLacMini(){}};
 const context=vm.createContext({window,document:{body,head:{appendChild:s=>scripts.push(s)},createElement:()=>({remove(){}}),getElementById:id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);}}});
 vm.runInContext(source,context);
 return {window,body,scripts,counts:()=>({pause,unload}),resize:mobile=>{query.matches=mobile;changes();}};
}
test('mobile cannot load or reveal the music engine',async()=>{
 const h=setup(true);await h.window.setRadioSource('music');assert.equal(h.scripts.length,0);assert.ok(h.body.classList.contains('radio-hidden'));assert.equal(h.window.toggleRadioMusicVisibility(),true);
});
test('entering mobile pauses playback and unloads music, including a pending load',async()=>{
 const h=setup(false),loading=h.window.setRadioSource('music');assert.equal(h.scripts.length,1);
 h.resize(true);const stopped=h.counts();assert.ok(stopped.pause>0);assert.ok(stopped.unload>0);assert.ok(h.body.classList.contains('radio-idle'));
 h.scripts[0].onload();await loading;assert.ok(h.body.classList.contains('radio-hidden'));
 h.resize(false);assert.equal(h.window.isRadioMobileView(),false);assert.ok(h.body.classList.contains('radio-hidden'));
});
