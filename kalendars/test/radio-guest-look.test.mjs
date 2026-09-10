import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const savedCode=code.slice(code.indexOf('  function getSaved(){'),code.indexOf('  // Remove the old purple/glass presets'));
const appearanceCode=code.slice(code.indexOf("  const IMAGE_CROP_KEY='"),code.indexOf('  function buildLookControls(){'));
const startup=code.slice(code.indexOf('  restoreGuestLook(getSaved().name'),code.indexOf("  window.dispatchEvent(new Event('rg-theme-ready'))"));
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
function boot(storage=memory()){
 const properties=new Map(),style={setProperty:(k,v)=>properties.set(k,v),getPropertyValue:k=>properties.get(k)};
 const c=vm.createContext({localStorage:storage,window:{},URL,location:{href:'http://localhost:8000/',origin:'http://localhost:8000'},CSS:{supports:()=>true},document:{baseURI:'http://localhost:8000/',documentElement:{style},getElementById:id=>id==='radioWindow'?{style,dataset:{}}:null},STORAGE:{name:'theme',accent:'accent',accentMode:'accentMode',enabled:'enabled'},FIXED_ACCENTS:{},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),parseColorToRGBStr:()=> '83,201,232',findTheme:()=>({image:'ocean.webp',chip:'#53c9e8'}),applyTheme(){},lowNode:null,vizStyle:0,vizFamily:'classic',isModernViz:n=>n>=20,setVizStyle(){}});
 vm.runInContext(savedCode+appearanceCode+startup,c);
 return {storage,c,background:()=>properties.get('background-image'),snapshot:()=>c.lookSnapshot(),capture:()=>c.captureGuestLook(),apply:data=>c.applyLookSettings(data),restore:data=>c.restoreGuestLook(data)};
}
const personal={theme:'Mana kartīte',background:'url("http://localhost:8000/kalendars/data/skins/skin-aesthetic-cyborg.webp")',cardName:'Rihards Gavriļenko',text:'#eef0f2',accentMode:'card',cardAccent:'#b79c80'};
test('personal image and colors disappear on logout; the guest look survives a reload',()=>{
 const h=boot();h.apply({theme:'Dziļais okeāns',text:'#ddffee',darkness:76,accentMode:'album'});
 const guest=h.capture();h.apply(personal);assert.match(h.background(),/cyborg/);
 const reloaded=boot(h.storage);assert.doesNotMatch(reloaded.background(),/cyborg/);assert.equal(reloaded.snapshot().text,guest.text);assert.equal(reloaded.snapshot().darkness,76);
 const baseline=reloaded.capture();reloaded.apply(personal);reloaded.restore(baseline);
 assert.doesNotMatch(reloaded.background(),/cyborg/);assert.equal(reloaded.snapshot().cardName,'');assert.equal(reloaded.snapshot().accentMode,'album');assert.equal(reloaded.snapshot().text,guest.text);
 const loggedOutReload=boot(h.storage);assert.equal(loggedOutReload.snapshot().theme,'Dziļais okeāns');assert.equal(loggedOutReload.snapshot().background,'');
});
test('an older build personal card without a guest backup is cleared on startup',()=>{
 const h=boot();h.apply(personal);
 const reloaded=boot(h.storage);assert.doesNotMatch(reloaded.background(),/cyborg/);assert.equal(reloaded.snapshot().cardName,'');assert.equal(reloaded.snapshot().theme,'Dziļais okeāns');
});
test('repeated profile loads cannot replace the original guest backup',()=>{
 const h=boot();h.apply({theme:'Dziļais okeāns',darkness:81});h.capture();h.apply(personal);const second=h.capture();assert.equal(second.theme,'Dziļais okeāns');assert.equal(second.darkness,81);h.restore(second);assert.doesNotMatch(h.background(),/cyborg/);
});
test('layout defaults to classic and personal layout is cleared with the rest of the profile',()=>{
 const h=boot();assert.equal(h.snapshot().layout,'classic');h.capture();
 h.apply({...personal,layout:'clean'});assert.equal(h.snapshot().layout,'clean');
 h.restore();assert.equal(h.snapshot().layout,'classic');
 h.apply({layout:'invalid'});assert.equal(h.snapshot().layout,'classic');
 h.apply({layout:'clean'});const reloaded=boot(h.storage);assert.equal(reloaded.snapshot().layout,'clean');
});

test('spectrum frame choice is independent of layout and resets with the profile',()=>{
 const h=boot();assert.equal(h.snapshot().vizFrame,'auto');const guest=h.capture();
 h.apply({...personal,layout:'clean',vizFrame:'on'});assert.equal(h.snapshot().vizFrame,'on');assert.equal(h.snapshot().layout,'clean');
 h.restore(guest);assert.equal(h.snapshot().vizFrame,'auto');
 h.apply({vizFrame:'off'});assert.equal(h.snapshot().vizFrame,'off');h.apply({vizFrame:'bad'});assert.equal(h.snapshot().vizFrame,'auto');
});

test('device image framing keeps cover defaults and scales exactly with the preview',()=>{
 const h=boot();
 for(const [width,height] of [[1470,200],[2560,200],[960,190]]){
  const original=h.c.imageGeometry(width,height,1800,600,null);
  assert.equal(original.width,width);assert.equal(original.height,width/3);assert.equal(original.left,0);
  for(const zoom of [.6,1,2]){
   const crop={x:.15,y:-.4,zoom},live=h.c.imageGeometry(width,height,1800,600,crop),ratio=600/width;
   const preview=h.c.imageGeometry(600,height*ratio,1800,600,crop);
   for(const key of ['width','height','left','top'])assert.ok(Math.abs(preview[key]-live[key]*ratio)<1e-8,key);
  }
  const edge=h.c.imageGeometry(width,height,1800,600,{x:99,y:99,zoom:.6});
  assert.ok(edge.left<width&&edge.top<height,'drag cannot lose the entire image');
 }
 assert.equal(h.c.imageGeometry(1000,200,1800,600,null,'top').top,0);
 assert.ok(Math.abs(h.c.imageGeometry(1000,200,1800,600,null,'bottom').top+1000/3-200)<1e-8);
});
test('image framing travels with profile settings and uses origin-independent image keys',()=>{
 const h=boot(),c=h.c,key='kalendars/data/radio-skins/marble-bust.webp';
 assert.equal(c.stableImageKey('http://localhost:8001/'+key),key);
 assert.equal(c.stableImageKey('https://example.test/Minka/'+key),key);
 vm.runInContext("imageSource='http://localhost:8001/kalendars/data/radio-skins/marble-bust.webp';imageCropDraft={...appearance.imageCrops};paintImagePosition=()=>{};",c);
 c.changeImageCrop({x:.2,y:-.4,zoom:1.2});
 assert.deepEqual(Object.keys(h.snapshot().imageCrops),[],'draft not saved until Apply');
 const crops=vm.runInContext('cleanImageCrops(imageCropDraft)',c);
 h.apply({...personal,imageCrops:crops});
 const saved=JSON.parse(JSON.stringify(h.snapshot()));
 const otherDevice=boot();otherDevice.apply(saved);assert.equal(otherDevice.snapshot().imageCrops[key].zoom,1.2);
 otherDevice.apply({...personal,cardName:'Another Test',imageCrops:{}});assert.equal(otherDevice.snapshot().imageCrops[key],undefined);
 assert.equal(c.cleanImageCrop({x:NaN,y:0,zoom:1}),null);
});
test('old device framing migration belongs only to its original profile',()=>{
 const h=boot(),key='kalendars/data/radio-skins/marble-bust.webp';
 h.storage.setItem('rg_radio_image_crop_v1',JSON.stringify({[JSON.stringify(['alpha','https://example.test/Minka/'+key])]:{x:.2,y:-.4,zoom:1.2}}));
 assert.equal(h.c.legacyImageCrops('alpha')[key].zoom,1.2);
 assert.deepEqual(Object.keys(h.c.legacyImageCrops('beta')),[]);
});
