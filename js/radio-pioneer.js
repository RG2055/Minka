/* Native image playback: no WebGL, audio graph, frame decoder or render loop. */
(function(){
 'use strict';
 let setup, catalog, catalogRequest, dialog, list, status, search, category='Visi', observer, stylesReady;
 const inlineGalleries=new Map();
 const base='data/pioneer/', key='mkRadioPioneer';
 const original={id:'original',label:'Delfīns · oriģināls',category:'Oriģināls',color:false,frames:60};
 let selected=original, selectedId='original';
 try{selectedId=localStorage.getItem(key)||'original';}catch(_){}
 const poster=clip=>base+clip.id+'-poster.webp';
 const animation=clip=>clip.id==='original'?'data/dolphin.webp?v=20260908d1':base+clip.id+'.webp';
 const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('lv');
 let meterCanvas, meterContext, meterImage, meterId='', meterTimer=0, meterLevel=[0,0], meterFrame='', meterSamples, meterPeak=[.16,.08], meterTargets=[0,0];
 function stopMeter(){clearTimeout(meterTimer);meterTimer=0;}
 function releaseMeter(){
  stopMeter();if(meterImage){meterImage.onload=null;meterImage.onerror=null;meterImage.removeAttribute('src');meterImage=null;}
  meterId='';meterLevel=[0,0];meterPeak=[.16,.08];meterFrame='';
  if(meterContext)meterContext.clearRect(0,0,meterCanvas.width,meterCanvas.height);
 }
 // Bass and upper-band envelopes from the same reusable time-domain buffer.
 // The old -48..-6 dB mapping squeezed compressed radio into 1–2 top frames.
 // A slow peak reference keeps contrast at different station volumes; there
 // are no synthetic beats, timers driving fake levels, or extra audio nodes.
 function audioLevels(analyser){
  meterTargets[0]=meterTargets[1]=0;
  if(!analyser)return meterTargets;
  if(!meterSamples||meterSamples.length!==analyser.fftSize)meterSamples=new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(meterSamples);
  const alpha=1-Math.exp(-2*Math.PI*450/(analyser.context?.sampleRate||48000));
  let low=0,lowSum=0,highSum=0;
  for(let i=0;i<meterSamples.length;i++){
   const value=(meterSamples[i]-128)/128;
   low+=alpha*(value-low);const high=value-low;
   lowSum+=low*low;highSum+=high*high;
  }
  for(let channel=0;channel<2;channel++){
   const rms=Math.sqrt((channel===0?lowSum:highSum)/meterSamples.length);
   meterPeak[channel]=Math.max(.012,rms,meterPeak[channel]*.996);
   meterTargets[channel]=rms<.002?0:Math.min(1,Math.pow(rms/meterPeak[channel],1.7)*.96);
  }
  return meterTargets;
 }
 function paintMeter(left,right=left){
  const frame=left+':'+right;
  if(!meterImage?.complete||!meterImage.naturalWidth||frame===meterFrame)return;
  meterFrame=frame;
  meterContext.clearRect(0,0,meterCanvas.width,meterCanvas.height);
  // Each source cell contains the same gauge stacked vertically. Use its
  // upper half once, not two doubled columns: correct 4:1 display proportions.
  const w=selected.width,h=selected.height/2;
  meterContext.drawImage(meterImage,0,left*selected.height,w,h,0,0,w,h);
  meterContext.drawImage(meterImage,w,right*selected.height,w,h,w,0,w,h);
 }
 function meterTick(){
  meterTimer=0;
  if(!selected.levels||!setup.isActive()||!setup.isRunning()||document.hidden)return;
  if(!setup.isCovered?.()){
   const targets=audioLevels(setup.getAnalyser?.());
   for(let i=0;i<2;i++)meterLevel[i]+=(targets[i]-meterLevel[i])*(targets[i]>meterLevel[i]?.85:.38);
   paintMeter(Math.round(meterLevel[0]*(selected.levels-1)),Math.round(meterLevel[1]*(selected.levels-1)));
  }
  meterTimer=setTimeout(meterTick,40);
 }
 function syncMeter(active,running){
  if(!selected.levels){releaseMeter();if(meterCanvas)meterCanvas.style.display='none';return;}
  if(!meterCanvas){meterCanvas=document.createElement('canvas');meterCanvas.className='pioneer-meter';meterCanvas.setAttribute('aria-hidden','true');setup.image.after(meterCanvas);meterContext=meterCanvas.getContext('2d');}
  meterCanvas.style.display=active?'block':'none';meterCanvas.style.filter=setup.image.style.filter;
  if(active&&meterId!==selected.id){
   releaseMeter();meterId=selected.id;meterCanvas.width=selected.width*2;meterCanvas.height=selected.height/2;
   const image=new Image();meterImage=image;
   image.onload=()=>{if(meterImage!==image)return;paintMeter(0);if(!meterTimer)meterTick();};
   image.onerror=()=>{if(status)status.textContent='Neizdevās ielādēt indikatoru. Izvēlies to vēlreiz.';releaseMeter();};
   image.src=base+selected.id+'-levels.webp';
  }
  if(running){if(!meterTimer&&meterImage?.complete)meterTick();}
  else{stopMeter();meterLevel=[0,0];paintMeter(0);}
 }
 function sync(){
  if(!setup)return;
  const active=setup.isActive(), image=setup.image;
  const running=active&&setup.isRunning()&&!document.hidden;
  // Replacing the source with one still frees the previous animated decoder.
  const source=running&&selected.frames>1&&!selected.levels?animation(selected):poster(selected);
  if(image.getAttribute('src')!==source)image.setAttribute('src',source);
  image.classList.toggle('pioneer-color',selected.color);
  image.classList.toggle('pioneer-square',selected.width===selected.height);
  image.style.display=active?'block':'none';image.style.opacity=active?'1':'0';
  syncMeter(active,running);if(selected.levels)image.style.display='none';
  setup.button.classList.toggle('active',active);
  setup.button.setAttribute('aria-label','Pioneer animācijas'+(active?' · '+selected.label:''));
  for(const container of inlineGalleries.keys())for(const button of container.querySelectorAll('[data-clip]'))button.setAttribute('aria-pressed',String(active&&button.dataset.clip===selected.id));
  if(list)for(const button of list.querySelectorAll('[data-clip]'))button.setAttribute('aria-pressed',String(active&&button.dataset.clip===selected.id));
 }
 async function loadCatalog(){
  if(catalog)return catalog;
  if(!catalogRequest)catalogRequest=(async()=>{
   const response=await fetch(base+'clips.json?v=20260910pioneer4');if(!response.ok)throw Error('catalog');
   const clips=await response.json();
   if(!Array.isArray(clips)||!clips.length||clips.some(c=>!/^[-a-z0-9_]+$/.test(c.id)||typeof c.label!=='string'))throw Error('catalog');
   catalog=[original,...clips.filter(c=>c.frames>1||c.levels>0)];selected=catalog.find(c=>c.id===selectedId)||original;selectedId=selected.id;try{localStorage.setItem(key,selectedId);}catch(_){}sync();return catalog;
  })().finally(()=>{catalogRequest=null;});
  return catalogRequest;
 }
 function select(id){
  const clip=catalog?.find(c=>c.id===id);if(!clip)return;
  selected=clip;selectedId=id;try{localStorage.setItem(key,id);}catch(_){}
  setup.selectMode();sync();
  if(status)status.textContent=clip.label+(clip.category==='Indikatori'?' · Bass un augšējās frekvences':'');
 }
 function render(){
  observer?.disconnect();list.replaceChildren();
  const query=normalize(search.value.trim());
  const clips=catalog.filter(c=>(category==='Visi'||c.category===category)&&(!query||normalize(c.label+' '+c.id).includes(query)));
  for(const clip of clips){
   const button=document.createElement('button');button.type='button';button.dataset.clip=clip.id;
   button.className='pioneer-tile';button.title=clip.label;button.setAttribute('aria-pressed',String(setup.isActive()&&selected.id===clip.id));
   const image=document.createElement('img');image.width=192;image.height=48;image.alt='';image.decoding='async';image.dataset.poster=poster(clip);
   const label=document.createElement('span');label.textContent=clip.label;
   button.append(image,label);list.append(button);
   // Native lazy loading can preload far beyond a short dialog. Observe its
   // own scroll viewport explicitly so off-screen cards request nothing.
   if(observer)observer.observe(image);else{image.loading='lazy';image.src=image.dataset.poster;}
  }
  if(!clips.length){const empty=document.createElement('p');empty.textContent='Nekas nav atrasts.';list.append(empty);}
  dialog.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
 }
 // Reuse the catalog and player in appearance settings. Only visible still
 // thumbnails load; opening this tab never starts all of the animations.
 async function mountGallery(container,onSelect){
  if(inlineGalleries.has(container)){sync();return;}
  const state={};inlineGalleries.set(container,state);
  container.textContent='Ielādē Pioneer…';
  try{
   const clips=await loadCatalog();container.replaceChildren();
   const searchInput=document.createElement('input');searchInput.type='search';searchInput.placeholder='Meklēt animāciju…';searchInput.setAttribute('aria-label','Meklēt Pioneer animāciju');
   const grid=document.createElement('div');grid.className='radio-viz-grid';
   const io='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const img=entry.target;img.src=img.dataset.poster;io.unobserve(img);}}, {rootMargin:'60px'}):null;
   state.observer=io;
   for(const clip of clips){
    const button=document.createElement('button');button.type='button';button.dataset.clip=clip.id;button.title=clip.label;
    const img=document.createElement('img');img.width=192;img.height=48;img.alt='';img.decoding='async';img.className='pioneer-inline-poster';img.dataset.poster=poster(clip);
    const label=document.createElement('span');label.textContent=clip.label;
    button.append(img,label);grid.append(button);
    if(io)io.observe(img);else{img.loading='lazy';img.src=img.dataset.poster;}
   }
   grid.addEventListener('click',event=>{const button=event.target.closest('[data-clip]');if(button){select(button.dataset.clip);onSelect?.();}});
   searchInput.addEventListener('input',()=>{const query=normalize(searchInput.value.trim());for(const button of grid.children)button.hidden=!normalize(button.textContent+' '+button.dataset.clip).includes(query);});
   container.append(searchInput,grid);sync();
  }catch(_){
   inlineGalleries.delete(container);container.textContent='Neizdevās ielādēt Pioneer. ';
   const retry=document.createElement('button');retry.type='button';retry.textContent='Mēģināt vēlreiz';retry.onclick=()=>mountGallery(container,onSelect);container.append(retry);
  }
 }
 function close(){if(dialog?.open)dialog.close();}
 function makeDialog(){
  if(dialog)return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='css/radio-pioneer.css?v=20260910pioneer4';stylesReady=new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=()=>{css.remove();dialog?.remove();dialog=null;reject(Error('styles'));};});document.head.append(css);
  dialog=document.createElement('dialog');dialog.id='pioneerPicker';dialog.setAttribute('aria-labelledby','pioneerTitle');
  dialog.innerHTML='<header><div><h2 id="pioneerTitle">Pioneer</h2><p>Animācijas un audio indikatori</p></div><button type="button" data-close aria-label="Aizvērt">×</button></header><div class="pioneer-filters"><input type="search" placeholder="Meklēt animāciju…" aria-label="Meklēt animāciju"><div class="pioneer-categories" aria-label="Kategorijas"></div></div><div class="pioneer-list"></div><footer><span role="status" aria-live="polite">Izvēlies skatu</span><button type="button" data-off>Izslēgt</button></footer>';
  document.body.append(dialog);list=dialog.querySelector('.pioneer-list');status=dialog.querySelector('[role=status]');search=dialog.querySelector('input');
  if('IntersectionObserver' in window)observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const image=entry.target;image.src=image.dataset.poster;observer.unobserve(image);}}, {root:list,rootMargin:'60px'});
  const filters=dialog.querySelector('.pioneer-categories');
  for(const name of ['Visi',...new Set(catalog.map(c=>c.category))]){const b=document.createElement('button');b.type='button';b.dataset.category=name;b.textContent=name+' '+(name==='Visi'?catalog.length:catalog.filter(c=>c.category===name).length);filters.append(b);}
  dialog.addEventListener('click',e=>{
   if(e.target.closest('[data-close]'))close();
   const cat=e.target.closest('[data-category]');if(cat){category=cat.dataset.category;render();list.scrollTop=0;}
   const clip=e.target.closest('[data-clip]');if(clip)select(clip.dataset.clip);
   if(e.target.closest('[data-off]')){setup.disable();sync();close();}
   if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}
  });
  search.addEventListener('input',render);
  dialog.addEventListener('close',()=>{observer?.disconnect();setup.button.setAttribute('aria-expanded','false');setup.button.focus({preventScroll:true});});
 }
 async function open(){
  if(dialog?.open){close();return;}
  setup.button.disabled=true;
  try{
   await loadCatalog();makeDialog();await stylesReady;
   const style=getComputedStyle(document.getElementById('radioWindow'));
   for(const property of ['--radio-accent-rgb','--radio-ambient-rgb'])dialog.style.setProperty(property,style.getPropertyValue(property));
   dialog.showModal();setup.button.setAttribute('aria-expanded','true');render();
   status.textContent=setup.isActive()?selected.label:'Izvēlies skatu';
  }catch(_){setup.button.title='Neizdevās ielādēt skatus. Nospied vēlreiz.';}
  finally{setup.button.disabled=false;}
 }
 function init(options){
  if(setup)return;setup=options;
  setup.image.addEventListener('error',()=>{
   const fallback=poster(selected);
   if(setup.image.getAttribute('src')!==fallback){setup.image.src=fallback;if(status)status.textContent='Animācija nav ielādēta. Izvēlies to vēlreiz.';}
  });
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('rg-viz-change',sync);
  setup.audio.addEventListener('play',sync);setup.audio.addEventListener('pause',sync);
  window.addEventListener('pagehide',()=>{stopMeter();setup.image.src=poster(selected);close();});
  window.addEventListener('pageshow',sync);
  if(selectedId==='original')sync();else void loadCatalog().catch(()=>{selected=original;sync();});
 }
 window.rgPioneer={init,open,close,sync,select,mountGallery};
})();
