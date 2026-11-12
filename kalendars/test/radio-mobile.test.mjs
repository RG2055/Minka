import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio-source.js',import.meta.url),'utf8');
function setup(mobile){
 const elements=new Map(),scripts=[];let changes,pause=0;
 const make=()=>{const classes=new Set();return {textContent:'',style:{},setAttribute(){},close(){},addEventListener(){},classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v)}};};
 const body=make(),query={matches:mobile,addEventListener:(event,fn)=>changes=fn};
 const window={matchMedia:()=>query,syncShellLayout(){},__mkPauseRadioForLacitis:()=>pause++};
 const context=vm.createContext({window,document:{body,head:{appendChild:s=>scripts.push(s)},createElement:()=>({remove(){}}),getElementById:id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);}}});
 vm.runInContext(source,context);
 return {window,body,scripts,counts:()=>({pause}),resize:mobile=>{query.matches=mobile;changes();}};
}
test('mobile has no radio window: selecting the radio only closes it',()=>{
 const h=setup(true);h.window.setRadioSource('radio');assert.ok(h.body.classList.contains('radio-hidden'));assert.equal(h.window.toggleRadioMusicVisibility(),true);
});
test('entering mobile pauses playback and closes the radio',()=>{
 const h=setup(false);assert.equal(h.window.toggleRadioMusicVisibility(),false);
 h.resize(true);assert.ok(h.counts().pause>0);assert.ok(h.body.classList.contains('radio-idle'));
 h.resize(false);assert.equal(h.window.isRadioMobileView(),false);assert.ok(h.body.classList.contains('radio-hidden'));
});
