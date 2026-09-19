import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../../js/radio-pixel.js',import.meta.url),'utf8'),sandbox);
const pixel=sandbox.window.rgPixel;
function frame(level,{dt=16.7,state={},reducedMotion=false,scale=1}={}){
 const curves=[];let stroke;
 const ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},moveTo(){},quadraticCurveTo(...v){curves.push(v);},stroke(){stroke=this.lineWidth;}};
 pixel.drawWave(ctx,360*scale,24*scale,{level,dt,state,color:'#fff',reducedMotion,scale});
 return {curves,stroke,state};
}
test('Pixel uses the upstream Material quadratic half-waves and PixelPlayer dimensions',()=>{
 const {curves,stroke}=frame(1,{dt:0});
 assert.equal(stroke,5);
 assert.equal(curves[0][2]-curves[0][0],7.5);
 assert.equal(curves[1][2]-curves[0][2],15);
 assert.equal(curves[0][1],17);assert.equal(curves[1][1],7);
});
test('wave travels at PixelPlayer 20dp/s, with no drift from display density',()=>{
 const a=frame(1,{dt:500}),b=frame(1,{dt:500,scale:2});
 assert.equal(a.state.pixelPhase,10);assert.equal(b.state.pixelPhase,10);
 assert.equal(b.stroke,a.stroke*2);
 a.curves.forEach((curve,i)=>curve.forEach((v,j)=>assert.equal(b.curves[i][j],v*2)));
});
test('silence flattens the wave and reduced motion freezes horizontal travel',()=>{
 assert.ok(frame(0).curves.every(c=>c[1]===12&&c[3]===12));
 const state={pixelPhase:5};frame(.5,{state,reducedMotion:true});assert.equal(state.pixelPhase,5);
 const quiet=frame(.2,{dt:0}),loud=frame(.9,{dt:0});
 assert.ok(Math.abs(quiet.curves[0][1]-12)<Math.abs(loud.curves[0][1]-12));
});
test('Pixel palettes have readable text and mint transport; album accents recolor the body',()=>{
 assert.ok(pixel.palettes.length>=6);
 assert.equal(pixel.palettes[0].surface,'#514800');
 assert.equal(pixel.palettes[0].play,'#a7d0b5');
 const a=pixel.fromAccent('#dd5533'),b=pixel.fromAccent('#3355dd');
 assert.notEqual(a.surface,b.surface);assert.notEqual(a.text,b.text);
 const luminance=hex=>{const v=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
 for(const p of [...pixel.palettes,a,b])assert.ok((luminance(p.text)+.05)/(luminance(p.surface)+.05)>4.5,p.name||p.surface);
});

test('random Pixel opens keep album colors and the default wave, without pinning a palette',()=>{
 const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
 const start=source.indexOf('  function randomGuestLook(){'),end=source.indexOf('  (window.rgTheme = window.rgTheme || {}).randomGuest',start);
 let applied;
 const context={window:{},Math:Object.assign(Object.create(Math),{random:()=>.99}),lookSnapshot:()=>({layout:'classic',theme:'Old',viz:'24',accentMode:'custom'}),THEMES:[{name:'Photo',chip:'#abcdef'},{name:'Pixel · Olīva',chip:'#ddd17b',pixel:{}}],VIZ_MODES:[{idx:24},{idx:31}],MK_NO_VIZ:12,MK_BUDDY_VIZ:11,closeProfileLook(){},applyLookSettings:value=>applied=value,syncLookControls(){}};
 vm.runInNewContext(source.slice(start,end),context);context.randomGuestLook();
 assert.equal(applied.layout,'pixel');assert.equal(applied.viz,'31');assert.equal(applied.accentMode,'album');
 context.window.__mkUnifiedMedia={getSession:()=>({name:'Saved profile'})};applied=null;context.randomGuestLook();assert.equal(applied,null);
});
