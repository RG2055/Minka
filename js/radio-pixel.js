/* Pixel appearance and live-audio adapter. No additional animation loop. */
(function(global){
 'use strict';
 const palettes=[
  {name:'Olīva',surface:'#514800',text:'#f4ed9a',accent:'#ddd17b',play:'#a7d0b5'},
  {name:'Ceriņi',surface:'#352347',text:'#eedcf8',accent:'#d5b7e8',play:'#c0d6ad'},
  {name:'Roze',surface:'#572b3c',text:'#ffdde7',accent:'#efb4cb',play:'#b4d6cb'},
  {name:'Persiks',surface:'#5b3525',text:'#ffe2c7',accent:'#f1c59e',play:'#b8d6b5'},
  {name:'Piparmētra',surface:'#1c463c',text:'#d3f1d9',accent:'#a5d4ba',play:'#e8dfaa'},
  {name:'Zils',surface:'#233e58',text:'#d8ebff',accent:'#afccec',play:'#d8c2e8'}
 ];
 const mix=(hex,other,amount)=>'#'+hex.slice(1).match(/../g).map((c,i)=>Math.round(parseInt(c,16)*(1-amount)+parseInt(other.slice(1+i*2,3+i*2),16)*amount).toString(16).padStart(2,'0')).join('');
 function fromAccent(accent){
  if(!/^#[\da-f]{6}$/i.test(accent))accent='#a5d4ba';
  return {surface:mix(accent,'#080e12',.64),text:mix(accent,'#ffffff',.83),accent:mix(accent,'#ffffff',.55),play:'#a7d0b5'};
 }
 /* Quadratic wave adapted from AndroidX LinearWavyProgressModifiers.kt.
  * Copyright 2024 The Android Open Source Project; Apache-2.0.
  * See docs/licenses/Apache-2.0.txt and docs/radio-pixel-local.md.
  * PixelPlayer PlayerSeekBar uses wavelength 30dp, stroke 5dp and speed 20dp/s.
  * Live radio replaces seek progress with a full-width, audio-level-driven wave.
  */
 function drawWave(ctx,w,h,{level,dt,state,color,scale=1,reducedMotion=false}){
  const wavelength=30*scale,half=wavelength/2,stroke=5*scale;
  state.pixelPhase=((state.pixelPhase||0)+(reducedMotion?0:Math.max(0,dt)*.02))%30;
  const offset=state.pixelPhase*scale,center=h/2;
  const amplitude=Math.max(0,Math.min(1,level||0))*Math.min(5*scale,Math.max(0,h-stroke));
  ctx.save();ctx.beginPath();ctx.rect(stroke/2,0,Math.max(0,w-stroke),h);ctx.clip();
  ctx.beginPath();ctx.moveTo(-offset,center);
  let controlY=amplitude;
  for(let x=half-offset;x<=w+wavelength;x+=half){
   ctx.quadraticCurveTo(x-half/2,center+controlY,x,center);controlY=-controlY;
  }
  ctx.strokeStyle=color;ctx.lineWidth=stroke;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();ctx.restore();
 }
 global.rgPixel={palettes,fromAccent,drawWave};
})(window);
