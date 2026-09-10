/* Pioneer-inspired chrome faceplate. Reuses the player's controls and audio. */
(function(){
 'use strict';
 let head,knob,display,volume,eq,active=false,drag;
 let matrix,matrixObserver,matrixEnabled=false;
 // One static mask, aligned to the displayed source pixels. No frame loop or
 // second decoder: only source changes, layout changes and resizes update it.
 function syncMatrix(){
  if(!matrixEnabled||!display)return;
  const monitor=display.querySelector('.monitor-frame');if(!monitor)return;
  const visible=el=>el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).opacity!=='0';
  const meter=monitor.querySelector('.pioneer-meter'),image=monitor.querySelector('#dolphin-bg');
  const source=visible(meter)?meter:visible(image)&&image.naturalWidth?image:null;
  const box=(source||monitor).getBoundingClientRect(),screen=display.getBoundingClientRect();
  if(!box.width||!box.height)return;
  const width=source?(source.naturalWidth||source.width):256,height=source?(source.naturalHeight||source.height):64;
  const pitch=Math.min(box.width/width,box.height/height);
  const gap=Math.min(1,Math.max(.5,pitch*.2));
  const x=box.left-screen.left-display.clientLeft+(box.width-width*pitch)/2;
  const y=box.top-screen.top-display.clientTop+(box.height-height*pitch)/2;
  matrix.style.setProperty('--oel-pitch',pitch+'px');
  matrix.style.setProperty('--oel-cell',Math.max(.1,pitch-gap)+'px');
  matrix.style.setProperty('--oel-origin-x',x+'px');matrix.style.setProperty('--oel-origin-y',y+'px');
  // Below ~2 CSS pixels, strong gaps would create moiré and obscure text.
  matrix.style.setProperty('--oel-gap-alpha',String(Math.min(.55,Math.max(0,(pitch-1)*.4))));
 }
 function setMatrix(rw,enabled){
  rw.dataset.pioneerPixels=String(enabled);
  if(enabled&&!matrix){
   matrix=document.createElement('div');matrix.className='pioneer-oel-grid';matrix.setAttribute('aria-hidden','true');display.append(matrix);
  }
  if(enabled!==matrixEnabled){
   matrixEnabled=enabled;
   if(enabled){
    matrixObserver=new ResizeObserver(syncMatrix);matrixObserver.observe(display);matrixObserver.observe(display.querySelector('.monitor-frame'));
    display.addEventListener('load',syncMatrix,true);window.addEventListener('rg-viz-change',syncMatrix);
   }else{
    matrixObserver?.disconnect();matrixObserver=null;display?.removeEventListener('load',syncMatrix,true);window.removeEventListener('rg-viz-change',syncMatrix);
   }
  }
  if(enabled)syncMatrix();
 }
 const homes=new Map(),styles=new Map();
 // Display approximations inspired by Apple's published Pro finishes, not
 // manufacturer color specifications. Metal colors never touch the album tint.
 const finishes=[
  {name:'Grey Metallic',color:'#9ca4aa'},{name:'Silver',color:'#c8ccd0'},
  {name:'Black Titanium',color:'#454749'},{name:'White Titanium',color:'#d8d5ce'},
  {name:'Blue Titanium',color:'#535d70'},{name:'Natural Titanium',color:'#a19b91'},
  {name:'Desert Titanium',color:'#bea48d'},{name:'Cosmic Orange',color:'#c87546'},
  {name:'Deep Blue',color:'#344662'},{name:'Burgundy',color:'#653d4a'},
  {name:'Glacier',color:'#abbcc9'}
 ];
 function metalPalette(settings={}){
  const color=/^#[\da-f]{6}$/i.test(settings.metalColor||'')?settings.metalColor:'#9ca4aa';
  const number=(value,fallback)=>Number.isFinite(Number(value))?Math.max(0,Math.min(100,Number(value))):fallback;
  const light=(number(settings.metalLight,50)-50)/100,shine=number(settings.metalShine,65)/100;
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const base=rgb.map(v=>Math.round(light>=0?v+(255-v)*light:v*(1+light)));
  const mix=amount=>'rgb('+base.map(v=>Math.round(amount>=0?v+(255-v)*amount:v*(1+amount))).join(',')+')';
  return {base:mix(0),edge:mix(-.06),top:mix(.18+shine*.5),light:mix(.1+shine*.3),dark:mix(-.12-shine*.3),
   faceTop:mix(.1),face:mix(-.15),faceBottom:mix(-.35),screen:mix(-.94),
   logo:mix(.7),ink:(base[0]*.2126+base[1]*.7152+base[2]*.0722)<105?mix(.82):mix(-.8),grain:String(.06+shine*.14)};
 }
 let lastFinish='';
 function applyFinish(rw,settings){
  const palette=metalPalette(settings),key=JSON.stringify(palette);if(key===lastFinish)return;lastFinish=key;
  for(const [name,value] of Object.entries(palette))rw.style.setProperty('--pioneer-metal-'+name,value);
 }
 function clearPanelOverrides(rw){
  const panel=rw.querySelector('.tech-panel');
  if(!styles.has(panel))styles.set(panel,['background','border-color','box-shadow'].map(name=>[name,panel.style.getPropertyValue(name),panel.style.getPropertyPriority(name)]));
  for(const [name] of styles.get(panel))panel.style.removeProperty(name);
 }
 function move(element,parent){
  if(!element)return;
  if(!homes.has(element)){const marker=document.createComment('pioneer-layout-home');element.before(marker);homes.set(element,marker);}
  if(element.parentElement!==parent)parent.append(element);
 }
 function restore(){
  drag=null;
  for(const [element,marker] of homes)marker.replaceWith(element);
  homes.clear();
  for(const [el,props] of styles)for(const [name,value,priority] of props)el.style.setProperty(name,value,priority);
  styles.clear();
 }
 function syncVolume(){
  if(!knob||!volume)return;
  const value=Math.round(Number(volume.value)*100);
  knob.style.setProperty('--pioneer-knob-angle',(value*2.7-135)+'deg');
 }
 function setVolume(value){
  const next=Math.round(Math.max(0,Math.min(1,value))*100)/100;
  if(Number(volume.value)===next)return;
  volume.value=String(next);volume.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function bindVolume(){
  let wheelValue=0,lastWheel=-Infinity,wheeling=false;
  volume.addEventListener('input',()=>{syncVolume();if(!wheeling)lastWheel=-Infinity;});
  // Relative motion, not the hidden range's absolute click position: grabbing
  // either edge never jumps the volume. Trackpad, mouse and pen share this path.
  volume.addEventListener('pointerdown',event=>{
   if(!active||event.button!==0)return;
   event.preventDefault();event.stopPropagation();volume.focus({preventScroll:true});
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,value:Number(volume.value),axis:null};
   volume.setPointerCapture(event.pointerId);
  });
  volume.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   const dx=event.clientX-drag.x,dy=drag.y-event.clientY;
   if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=4)drag.axis=Math.abs(dy)>Math.abs(dx)?'y':'x';
   if(drag.axis)setVolume(drag.value+(drag.axis==='y'?dy:dx)/200);
  });
  const finish=event=>{if(!drag||event.pointerId!==drag.id)return;drag=null;if(volume.hasPointerCapture(event.pointerId))volume.releasePointerCapture(event.pointerId);volume.dispatchEvent(new Event('change',{bubbles:true}));};
  volume.addEventListener('pointerup',finish);volume.addEventListener('pointercancel',finish);volume.addEventListener('lostpointercapture',()=>{drag=null;});
  volume.addEventListener('wheel',event=>{
   if(!active||event.ctrlKey)return;
   event.preventDefault();event.stopPropagation();
   const now=performance.now();if(now-lastWheel>250)wheelValue=Number(volume.value);lastWheel=now;
   const delta=event.deltaY||event.deltaX;
   wheelValue=Math.max(0,Math.min(1,wheelValue-Math.sign(delta)*Math.min(.03,Math.abs(delta)*(event.deltaMode===0?.001:.02))));wheeling=true;setVolume(wheelValue);wheeling=false;
  },{passive:false});
 }
 function build(rw){
  if(head)return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='css/radio-pioneer-layout.css?v=20260910oel1';css.onload=()=>{window.syncShellLayout?.();window.dispatchEvent(new Event('resize'));};document.head.append(css);
  head=document.createElement('div');head.className='pioneer-faceplate';head.innerHTML='<strong>Pioneer</strong>';rw.prepend(head);
  knob=document.createElement('div');knob.className='pioneer-volume';knob.innerHTML='<div class="pioneer-knob"><i aria-hidden="true"></i><span aria-hidden="true">VOLUME</span></div>';
  display=document.createElement('div');display.className='pioneer-display';
  rw.querySelector('.bottom-console').append(knob,display);
  volume=rw.querySelector('#vol');eq=rw.querySelector('.eq-wrap');bindVolume();
 }
 function apply(rw,settings={}){
  const enabled=rw.dataset.radioLayout==='pioneer';
  if(enabled){
   build(rw);applyFinish(rw,settings);clearPanelOverrides(rw);
   move(eq,rw.querySelector('.bottom-console'));move(volume,knob.querySelector('.pioneer-knob'));
   move(rw.querySelector('.tech-panel'),display);move(rw.querySelector('.monitor-frame'),display);
   volume.setAttribute('aria-label','Skaļums');volume.title='Skaļums — velc augšup vai pa labi. Var arī ritināt.';syncVolume();
  }else if(active)restore();
  if(enabled!==active){active=enabled;window.syncShellLayout?.();}
  setMatrix(rw,enabled&&settings.pioneerPixels===true);
 }
 // A static snapshot of the real rendered faceplate, not a second player.
 // Shadow DOM isolates duplicate control IDs and global app styles. Changes
 // are coalesced; there is no preview animation or audio loop.
 let previewTimer=0,previewLast=0;
 function renderPreview(host){
  clearTimeout(previewTimer);
  previewTimer=setTimeout(()=>{
   if(!active||!host.isConnected||!document.getElementById('themePanel')?.classList.contains('open'))return;
   const source=document.getElementById('radioWindow'),bounds=source.getBoundingClientRect();
   if(!bounds.width||!host.clientWidth)return;
   previewLast=performance.now();
   let surface=host.querySelector('.pioneer-real-preview');
   if(!surface){surface=document.createElement('div');surface.className='pioneer-real-preview';surface.setAttribute('aria-hidden','true');surface.inert=true;surface.attachShadow({mode:'open'});host.append(surface);}
   const rules=[],safeStyle=style=>Array.from(style).filter(name=>!name.startsWith('--')&&!name.startsWith('animation')&&!name.startsWith('transition')).map(name=>name+':'+style.getPropertyValue(name)+'!important;').join('');
   let serial=0;
   function copy(node){
    if(node.nodeType===3)return node.cloneNode();
    if(node.nodeType!==1||['SCRIPT','STYLE','LINK','IFRAME','AUDIO','VIDEO'].includes(node.tagName))return null;
    const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||style.opacity==='0')return null;
    const clone=node.cloneNode(false),token='p'+serial++;
    for(const attribute of [...clone.attributes])if(attribute.name.startsWith('on'))clone.removeAttribute(attribute.name);
    clone.setAttribute('data-snapshot',token);if(clone.id){clone.dataset.previewSource=clone.id;clone.removeAttribute('id');}clone.removeAttribute('autofocus');clone.style.cssText=safeStyle(style);
    for(const pseudo of ['::before','::after']){
     const ps=getComputedStyle(node,pseudo);
     if(ps.display!=='none'&&ps.content!=='none'&&ps.content!=='normal')rules.push('[data-snapshot="'+token+'"]'+pseudo+'{'+safeStyle(ps)+'}');
    }
    if(node.tagName==='CANVAS'){clone.width=node.width;clone.height=node.height;clone.getContext('2d')?.drawImage(node,0,0);}
    if(node.tagName==='IMG'){
     clone.loading='eager';clone.removeAttribute('srcset');
     if(node.id==='dolphin-bg'){
      const src=node.getAttribute('src')||'';
      clone.src=src.includes('data/pioneer/')?src.replace(/(?:-poster)?\.webp.*$/,'-poster.webp'):'data/pioneer/original-poster.webp';
     }
    }
    for(const child of node.childNodes){const copied=copy(child);if(copied)clone.append(copied);}
    return clone;
   }
   const clone=copy(source);if(!clone)return;
   for(const [name,value] of Object.entries({position:'absolute',left:'0px',right:'auto',top:'0px',bottom:'auto',margin:'0px',width:bounds.width+'px',height:bounds.height+'px',transformOrigin:'0 0',transform:'scale('+(host.clientWidth/bounds.width)+')'}))clone.style.setProperty(name.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),value,'important');
   const style=document.createElement('style');style.textContent=rules.join('');surface.shadowRoot.replaceChildren(style,clone);
  },Math.max(0,150-(performance.now()-previewLast)));
 }
 window.rgPioneerLayout={apply,finishes,renderPreview,syncMatrix};
})();
