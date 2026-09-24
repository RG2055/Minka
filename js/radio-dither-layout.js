/* "RG Dither" faceplate: one black deck where every element is dithered —
   the album art is an Atkinson dither, the spectrum an ordered (Bayer)
   dither at dot resolution, all text is drawn as 1-bit masks (solid stroke
   cores, dithered edges and a dithered drop shadow, so it stays readable),
   icons are pixel bitmaps, and frames/fills/sliders are checker patterns.
   Ink colour follows the album. A thin shell over the radio engine like
   Amp: it proxies #playBtn, #vol, selectStation() and the station picker
   and reads state from the hidden console. Four spectra exist only here
   (appearance.ditherVis):
     bayer  — bars with a solid core that breaks into dither toward the top
     field  — mirrored waterfall: the last seconds scroll up as dithered terrain
     rowled — CRT row-LED blob with red/blue channel shift (no blur)
     torus  — the RG ring, lit from the top-left, pulsing with the music
   Every frame is a putImageData of a small buffer at ≤30 fps, only while
   playing and visible; idle draws one still frame and stops. Text masks are
   rendered once per string and cached. */
(function(){
 'use strict';
 const VIS=['bayer','field','rowled','torus'];
 const VIS_LABEL={bayer:'Bayer',field:'Lauks',rowled:'Rindas LED',torus:'Tors'};
 const ART_KEY='minka:dither-art:v1';
 // Pixel icons ('#' = on). Drawn at 2 CSS px per pixel.
 const ICON={
  prev:['##.....##','##...####','##.######','#########','##.######','##...####','##.....##'],
  next:['##.....##','####...##','######.##','#########','######.##','####...##','##.....##'],
  play:['##.......','####.....','######...','########.','#########','########.','######...','####.....','##.......'],
  pause:['###..###','###..###','###..###','###..###','###..###','###..###','###..###','###..###','###..###'],
  shuffle:['......#..','##...####','..#.#..#.','...#.....','..#.#..#.','##...####','......#..'],
  list:['#########','.........','#########','.........','######...'],
  speaker:['....#....','...##..#.','#####...#','#####.#.#','#####.#.#','#####...#','...##..#.','....#....'],
  look:['..#####..','.#.....#.','#..#.#..#','#.......#','#..###..#','.#.....#.','..#####..']
 };
 let shell,built=false,active=false,els={},homes=new Map(),timeBound=false;
 let visStyle='bayer',ink=[120,220,200],inkKey='',artMode='duo';
 try{artMode=localStorage.getItem(ART_KEY)==='color'?'color':'duo';}catch(_){}
 const $=sel=>shell.querySelector(sel);
 const pad=n=>String(n).padStart(2,'0');
 const fmt=s=>{s=Math.max(0,Math.floor(s||0));return pad(Math.floor(s/60)%100)+':'+pad(s%60);};
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const lowSpec=()=>{const p=window.__mkPerfProfile||{};return (p.hardwareConcurrency&&p.hardwareConcurrency<=4)||(p.deviceMemory&&p.deviceMemory<=4);};
 function move(el,parent){
  if(!el)return;
  if(!homes.has(el)){const m=document.createComment('dither-home');el.before(m);homes.set(el,m);}
  if(el.parentElement!==parent)parent.append(el);
 }
 function restore(){for(const [el,m] of homes)m.replaceWith(el);homes.clear();}
 function paintRange(input){
  const min=Number(input.min)||0,max=Number(input.max)||100,v=Number(input.value);
  input.style.setProperty('--p',(((v-min)/(max-min))*100).toFixed(2)+'%');
 }
 function setRange(input,v){input.value=String(v);paintRange(input);}

 // ---------- dithered text + pixel icons as 1-bit masks ----------
 // The mask is painted in currentColor, so hover/pressed/ink changes need no
 // redraw. Each dither pixel is `scale` CSS px, baked at device resolution so
 // the browser never smooths it.
 const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 const FONT_UI="'Geist Sans',Inter,system-ui,sans-serif",FONT_MONO="'Geist Mono',ui-monospace,Menlo,monospace";
 const maskCache=new Map();
 function bake(bits,w,h,scale){
  const dpr=Math.max(1,Math.round(window.devicePixelRatio||1)),k=scale*dpr;
  const cv=document.createElement('canvas');cv.width=w*k;cv.height=h*k;
  const c=cv.getContext('2d');c.fillStyle='#fff';
  for(let y=0;y<h;y++){let run=-1;for(let x=0;x<=w;x++){const on=x<w&&bits[y*w+x];if(on&&run<0)run=x;else if(!on&&run>=0){c.fillRect(run*k,y*k,(x-run)*k,k);run=-1;}}}
  return cv.toDataURL();
 }
 function textMask(text,o){
  const key=[text,o.size,o.weight,o.mono?1:0,o.scale||1,o.shadow?1:0].join('|');
  let m=maskCache.get(key);if(m){maskCache.delete(key);maskCache.set(key,m);return m;}
  const scale=o.scale||1,size=o.size/scale;
  const cv=document.createElement('canvas'),c=cv.getContext('2d',{willReadFrequently:true});
  const font=`${o.weight||600} ${size}px ${o.mono?FONT_MONO:FONT_UI}`;c.font=font;
  const w=Math.max(1,Math.ceil(c.measureText(text).width)+3),h=Math.ceil(size*1.32)+2;
  cv.width=w;cv.height=h;c.font=font;c.textBaseline='middle';c.fillStyle='#fff';c.fillText(text,1,h/2+.5);
  const d=c.getImageData(0,0,w,h).data,glyph=new Uint8Array(w*h),shadow=new Uint8Array(w*h);
  // Solid where the glyph is mostly covered; the anti-aliased rim breaks into Bayer dots.
  // Small text (<16px) is plain crisp 1-bit: dots on a 10px stroke would eat it.
  const rim=size>=16;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=d[(y*w+x)*4+3]/255;glyph[y*w+x]=rim?(a>.62||a>.18+.44*(B4[(y&3)*4+(x&3)]+.5)/16?1:0):(a>.42?1:0);}
  if(o.shadow)for(let y=1;y<h;y++)for(let x=1;x<w;x++){const i=y*w+x;if(glyph[i-w-1]&&!glyph[i]&&((x+y)&1)===0)shadow[i]=1;}
  m={w,h,scale,url:bake(glyph,w,h,scale),shadow:o.shadow?bake(shadow,w,h,scale):''};
  maskCache.set(key,m);if(maskCache.size>240)maskCache.delete(maskCache.keys().next().value);
  return m;
 }
 // Put dithered `text` into `host` (keeps the real text for screen readers).
 function dtext(host,text,o){
  text=String(text==null?'':text);
  if(host.__dt===text+'|'+(o.size||0))return;host.__dt=text+'|'+(o.size||0);
  let sr=host.querySelector(':scope>.dth-sr'),dt=host.querySelector(':scope>.dth-dt');
  if(!sr){sr=document.createElement('span');sr.className='dth-sr';host.append(sr);}
  if(!dt){dt=document.createElement('span');dt.className='dth-dt';dt.setAttribute('aria-hidden','true');host.append(dt);}
  sr.textContent=text;
  if(!text){dt.style.width='0px';return;}
  const m=textMask(text,o);
  dt.style.width=m.w*m.scale+'px';dt.style.height=m.h*m.scale+'px';
  dt.style.setProperty('--dt',`url("${m.url}")`);
  if(m.shadow)dt.style.setProperty('--dts',`url("${m.shadow}")`);else dt.style.removeProperty('--dts');
 }
 const iconCache=new Map();
 function icon(name){
  let url=iconCache.get(name);const rows=ICON[name],w=rows[0].length,h=rows.length;
  if(!url){const bits=new Uint8Array(w*h);rows.forEach((r,y)=>{for(let x=0;x<w;x++)bits[y*w+x]=r[x]==='#'?1:0;});url=bake(bits,w,h,2);iconCache.set(name,url);}
  return `<span class="dth-ico" aria-hidden="true" style="width:${w*2}px;height:${h*2}px;--dt:url('${url}')"></span>`;
 }
 // The engine's own buttons (Radio/Mūzika, profile) get dithered labels while
 // they sit on this deck; `undither` puts them back exactly as they were.
 let barObserver=null;
 function ditherButtons(root){
  if(!root)return;
  root.querySelectorAll('button').forEach(b=>{
   let label='';b.childNodes.forEach(n=>{if(!(n.nodeType===1&&n.classList.contains('dth-dt-wrap')))label+=n.textContent;});
   label=label.trim().toUpperCase();
   if(!label)return;
   b.classList.add('dth-dt-host');
   const holder=b.querySelector(':scope>.dth-dt-wrap')||b.appendChild(Object.assign(document.createElement('span'),{className:'dth-dt-wrap'}));
   dtext(holder,label,{size:10,weight:700,mono:true});
  });
 }
 function watchBar(bar){
  if(barObserver||!bar)return;
  barObserver=new MutationObserver(recs=>{if(!active)return;if(recs.some(r=>!r.target.closest?.('.dth-dt-wrap')))ditherButtons(bar);});
  barObserver.observe(bar,{childList:true,subtree:true,characterData:true});
 }
 function undither(){
  barObserver?.disconnect();barObserver=null;
  document.querySelectorAll('.dth-dt-host').forEach(b=>{b.classList.remove('dth-dt-host');b.querySelector(':scope>.dth-dt-wrap')?.remove();});
  const look=document.getElementById('themeBtn');look?.classList.remove('dth-look');look?.querySelector(':scope>.dth-ico')?.remove();
 }

 // ---------- build ----------
 function build(rw){
  if(built)return;built=true;
  const css=document.createElement('link');css.rel='stylesheet';css.href='css/radio-dither-layout.css?v=20260924dth4';css.onload=()=>{window.syncShellLayout?.();if(active){startVis();renderText(true);}};document.head.append(css);
  shell=document.createElement('div');shell.className='dth-shell';shell.dataset.noDither='';
  shell.innerHTML=`
   <section class="dth-deck" aria-label="RG Dither atskaņotājs">
    <header class="dth-head">
     <img class="dth-logo" src="data/rg-brand.svg" width="22" height="22" alt="" decoding="async">
     <span class="dth-brand" data-brand></span>
     <span class="dth-rule" aria-hidden="true"></span>
     <span class="dth-src" data-src></span>
     <span class="dth-tools" data-tools></span>
    </header>
    <div class="dth-body">
     <button type="button" class="dth-art" data-art title="Albuma attēls: krāsains / vienkrāsains" aria-label="Pārslēgt albuma attēla dither krāsas"><canvas width="84" height="84" data-art-canvas aria-hidden="true"></canvas></button>
     <div class="dth-stage">
      <canvas data-vis aria-hidden="true"></canvas>
      <span class="dth-tag" data-vis-tag></span>
      <span class="dth-time" data-time></span>
     </div>
     <div class="dth-info">
      <div class="dth-kicker"><span class="dth-live" data-live></span><span data-kbps></span><span class="dth-station" data-station></span></div>
      <div class="dth-song" data-song><span class="dth-line"></span></div>
      <div class="dth-artist" data-artist><span class="dth-line"></span></div>
      <div class="dth-volrow">${icon('speaker')}<input type="range" class="dth-range dth-vol" min="0" max="1" step="0.01" value="0.7" aria-label="Skaļums" data-vol></div>
     </div>
    </div>
    <footer class="dth-foot">
     <div class="dth-transport">
      <button type="button" class="dth-btn" data-act="prev" title="Iepriekšējā stacija" aria-label="Iepriekšējā stacija">${icon('prev')}</button>
      <button type="button" class="dth-btn dth-play" data-act="toggle" title="Atskaņot" aria-label="Atskaņot">${icon('play')}</button>
      <button type="button" class="dth-btn" data-act="next" title="Nākamā stacija" aria-label="Nākamā stacija">${icon('next')}</button>
      <button type="button" class="dth-btn" data-act="shuffle" title="Nejauša stacija" aria-label="Nejauša stacija">${icon('shuffle')}</button>
      <button type="button" class="dth-btn" data-act="stations" title="Stacijas" aria-label="Stacijas">${icon('list')}</button>
     </div>
     <input type="range" class="dth-range dth-seek" min="0" max="3600" step="1" value="0" aria-label="Pozīcija" data-seek disabled>
     <div class="dth-vis-pick" role="group" aria-label="Spektrs">${VIS.map(v=>`<button type="button" data-vis-choice="${v}" aria-pressed="false"></button>`).join('')}</div>
    </footer>
   </section>`;
  rw.append(shell);
  els={vis:$('[data-vis]'),stage:$('.dth-stage'),tag:$('[data-vis-tag]'),art:$('[data-art]'),artCv:$('[data-art-canvas]'),time:$('[data-time]'),song:$('[data-song]'),artist:$('[data-artist]'),station:$('[data-station]'),kbps:$('[data-kbps]'),live:$('[data-live]'),vol:$('[data-vol]'),seek:$('[data-seek]'),play:$('.dth-play'),tools:$('[data-tools]'),src:$('[data-src]'),brand:$('[data-brand]')};
  bind(rw);
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(active){sizeVis();drawOnce();fitLines();}}).observe(els.stage);
  document.fonts?.ready?.then(()=>{maskCache.clear();if(active)renderText(true);});
 }
 function renderText(force){
  if(force)shell.querySelectorAll('.dth-sr').forEach(sr=>{sr.parentElement.__dt='';});
  dtext(els.brand,'RG DITHER',{size:15,weight:800,mono:true,shadow:true});
  shell.querySelectorAll('[data-vis-choice]').forEach(b=>dtext(b,VIS_LABEL[b.dataset.visChoice].toUpperCase(),{size:10,weight:700,mono:true}));
  dtext(els.tag,'['+VIS_LABEL[visStyle].toUpperCase()+']',{size:10,weight:700,mono:true});
  if(force)syncState();
 }
 function stationsPlain(){return (typeof stationsList!=='undefined'?stationsList:[]).map((s,i)=>({s,i})).filter(x=>x.s&&x.s.group!=='separator');}
 function engineAudio(){return window.__ampAudio||(typeof audio!=='undefined'?audio:null);}
 function bind(rw){
  shell.addEventListener('click',e=>{
   const pick=e.target.closest('[data-vis-choice]');
   if(pick){window.rgDitherLayout.onVisPick?.(pick.dataset.visChoice);return;}
   const b=e.target.closest('[data-act]');if(!b)return;
   const act=b.dataset.act;
   if(act==='prev')window.playPrev?.();
   else if(act==='next')window.playNext?.();
   else if(act==='toggle')document.getElementById('playBtn')?.click();
   else if(act==='shuffle'){const list=stationsPlain();if(list.length){const p=list[Math.floor(Math.random()*list.length)];window.selectStation?.(p.i);}}
   else if(act==='stations')window.toggleMenu?.(true);
  });
  els.art.addEventListener('click',()=>{artMode=artMode==='duo'?'color':'duo';try{localStorage.setItem(ART_KEY,artMode);}catch(_){}artKey='';syncArt(true);});
  const vol=document.getElementById('vol');
  els.vol.addEventListener('input',()=>{paintRange(els.vol);if(!vol)return;vol.value=els.vol.value;vol.dispatchEvent(new Event('input',{bubbles:true}));});
  els.vol.addEventListener('change',()=>vol?.dispatchEvent(new Event('change',{bubbles:true})));
  vol?.addEventListener('input',()=>{if(vol.value!==els.vol.value)setRange(els.vol,vol.value);});
  const mo=new MutationObserver(()=>{if(active)syncState();});
  mo.observe(rw,{attributes:true,attributeFilter:['data-playback','class']});
  for(const id of ['curStation','npArtist','npTitle','ui-kbps']){const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,characterData:true,subtree:true});}
  const cover=document.getElementById('npCover');if(cover)mo.observe(cover,{attributes:true,attributeFilter:['src']});
  document.addEventListener('rg-now-playing-art',()=>{if(active)syncState();});
  document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden)startVis();});
 }
 function bindTime(){
  if(timeBound)return;
  const a=engineAudio();if(!a)return;timeBound=true;
  const update=()=>{if(!active)return;dtext(els.time,fmt(a.currentTime),{size:13,weight:700,mono:true});
   const finite=Number.isFinite(a.duration)&&a.duration>0;
   els.seek.disabled=!finite;dtext(els.live,finite?fmt(a.duration):'LIVE',{size:10,weight:700,mono:true});
   setRange(els.seek,finite?(a.currentTime/a.duration)*3600:0);};
  a.addEventListener('timeupdate',update);a.addEventListener('emptied',update);
  a.addEventListener('play',()=>{update();if(active)startVis();});
  a.addEventListener('pause',()=>{if(active)startVis();});
  els.seek.addEventListener('input',()=>{paintRange(els.seek);if(Number.isFinite(a.duration)&&a.duration>0)a.currentTime=Number(els.seek.value)/3600*a.duration;});
  update();
 }
 // Title and artist: dithered masks with a dithered shadow; long lines scroll.
 function setLine(box,text,o){
  box.title=text;
  dtext(box.firstElementChild,text,o);
  fitLines();
 }
 function fitLines(){
  for(const box of [els.song,els.artist]){
   const line=box.firstElementChild,dt=line.querySelector('.dth-dt');if(!dt)continue;
   const over=parseFloat(dt.style.width||'0')-box.clientWidth;
   if(over>4){line.style.setProperty('--shift',(-over-6)+'px');line.style.setProperty('--dur',Math.max(6,over/18)+'s');box.classList.add('is-long');}
   else{box.classList.remove('is-long');line.style.setProperty('--shift','0px');}
  }
 }
 function syncState(){
  const rw=document.getElementById('radioWindow');
  const bar=document.getElementById('radioSourceBar');
  if(bar&&!rw.classList.contains('music-source')&&bar.parentElement!==els.src)move(bar,els.src);
  if(bar){ditherButtons(bar);watchBar(bar);}
  const state=rw.dataset.playback||'',a=engineAudio();
  const playing=state==='playing'||(state==='loading'&&a&&!a.paused);
  shell.classList.toggle('is-playing',playing);
  if(els.play.dataset.state!==String(playing)){els.play.dataset.state=String(playing);els.play.innerHTML=icon(playing?'pause':'play');}
  els.play.title=playing?'Pauze':'Atskaņot';els.play.setAttribute('aria-label',els.play.title);
  const st=document.getElementById('curStation')?.textContent.trim()||'RG RADIO';
  const ar=document.getElementById('npArtist')?.textContent.trim()||'',ti=document.getElementById('npTitle')?.textContent.trim()||'';
  setLine(els.song,ti||st,{size:21,weight:760,shadow:true});
  setLine(els.artist,ti?(ar||st):(ar||(playing?'Tiešraide':'Izvēlies staciju')),{size:15,weight:620,shadow:true});
  dtext(els.station,(ti?st:'').toUpperCase(),{size:10,weight:700,mono:true});
  const m=(document.getElementById('ui-kbps')?.textContent||'').match(/(\d{2,3})/);dtext(els.kbps,m?m[1]+' KBPS':'',{size:10,weight:700,mono:true});
  if(!timeBound){dtext(els.time,'00:00',{size:13,weight:700,mono:true});dtext(els.live,'LIVE',{size:10,weight:700,mono:true});}
  syncArt();
  startVis();
 }

 // ---------- ink: the album accent, lifted until it reads on black ----------
 function readInk(){
  const rw=document.getElementById('radioWindow');
  const raw=(rw?.style.getPropertyValue('--radio-accent-rgb')||getComputedStyle(rw).getPropertyValue('--radio-accent-rgb')||'').trim()||'120,220,200';
  let c=raw.split(',').map(Number);if(c.length<3||c.some(v=>!Number.isFinite(v)))c=[120,220,200];
  const lum=v=>(.2126*v[0]+.7152*v[1]+.0722*v[2])/255;
  for(let i=0;i<8&&lum(c)<.55;i++)c=c.map(v=>Math.round(v+(255-v)*.22));
  return c;
 }
 function syncInk(){
  const next=readInk(),key=next.join(',');
  if(key===inkKey)return false;
  inkKey=key;ink=next;
  shell.style.setProperty('--dth-ink-rgb',key);
  return true;
 }

 // ---------- album art ----------
 let artKey='',artFrom=null,artTo=null,artAnim=0;
 function orbCanvas(seed){
  // No readable cover (station logo without CORS, or none): a lit sphere, dithered.
  const cv=document.createElement('canvas');cv.width=cv.height=84;const c=cv.getContext('2d');
  c.fillStyle='#000';c.fillRect(0,0,84,84);
  let h=0;for(const ch of String(seed||'rg'))h=(h*31+ch.charCodeAt(0))|0;
  const ox=30+(Math.abs(h)%12),oy=26+(Math.abs(h>>4)%12);
  const g=c.createRadialGradient(ox,oy,4,42,44,38);g.addColorStop(0,'#fff');g.addColorStop(.55,'#777');g.addColorStop(1,'#000');
  c.fillStyle=g;c.beginPath();c.arc(42,44,34,0,Math.PI*2);c.fill();
  return cv;
 }
 function syncArt(force){
  const src=document.getElementById('npCover')?.getAttribute('src')||'';
  const key=src+'|'+artMode+'|'+inkKey;
  if(!force&&key===artKey)return;artKey=key;
  const D=window.MinkaDither;if(!D)return;
  const opts={width:84,height:84,cover:true,mode:artMode==='color'?'color':'duo',levels:artMode==='color'?3:4,ink,paper:[6,6,6],contrast:1.12};
  const done=cv=>{if(artKey===key)showArt(cv);};
  const fallback=()=>done(D.image(orbCanvas(src),{...opts,cover:false}));
  if(!src||src.startsWith('data:image/svg')){fallback();return;}
  const im=new Image();im.decoding='async';
  try{if(new URL(src,document.baseURI).origin!==location.origin)im.crossOrigin='anonymous';}catch(_){}
  im.onload=()=>{try{done(D.image(im,opts));}catch(_){fallback();}};
  im.onerror=fallback;im.src=src;
 }
 function showArt(cv){
  const ctx=els.artCv.getContext('2d');
  const next=cv.getContext('2d').getImageData(0,0,84,84);
  if(reduced()||!artTo){ctx.putImageData(next,0,0);artTo=next;return;}
  // Bayer dissolve from the old picture to the new one, ~420 ms.
  artFrom=artTo;artTo=next;cancelAnimationFrame(artAnim);
  const out=ctx.createImageData(84,84),B=window.MinkaDither.bayer8,t0=performance.now();
  const step=now=>{
   const p=Math.min(1,(now-t0)/420),a=artFrom.data,b=artTo.data,o=out.data;
   for(let y=0,i=0;y<84;y++)for(let x=0;x<84;x++,i+=4){const src=B[(y&7)*8+(x&7)]<p?b:a;o[i]=src[i];o[i+1]=src[i+1];o[i+2]=src[i+2];o[i+3]=255;}
   ctx.putImageData(out,0,0);
   if(p<1)artAnim=requestAnimationFrame(step);
  };
  artAnim=requestAnimationFrame(step);
 }

 // ---------- spectrum ----------
 const FPS=30;
 let raf=0,last=0,idle=0,cols=0,rows=0,pitch=3,img=null,buf32=null,levels=null,peaks=null,holds=null,bins=null,data=null,hist=null,histHead=0,torusMap=null,stars=null,shiftT=0;
 let pal=null;
 function palette(){
  // 0 paper, 1 dim ink, 2 ink, 3 highlight — packed ABGR for the Uint32 view.
  const pack=(r,g,b)=>(255<<24)|(b<<16)|(g<<8)|r;
  const mix=(t,base)=>ink.map((v,i)=>Math.round(base[i]+(v-base[i])*t));
  const dim=mix(.42,[6,6,6]),hi=ink.map(v=>Math.round(v+(255-v)*.6));
  pal=[pack(6,6,6),pack(...dim),pack(...ink),pack(...hi)];
 }
 function sizeVis(){
  const cv=els.vis,w=Math.max(60,Math.round(els.stage.clientWidth)),h=Math.max(40,Math.round(els.stage.clientHeight));
  pitch=visStyle==='rowled'?4:3;
  const nc=Math.floor(w/3),nr=Math.floor(h/pitch);
  if(cv.width!==nc*3||cv.height!==nr*pitch||cols!==nc||rows!==nr){
   cv.width=nc*3;cv.height=nr*pitch;cols=nc;rows=nr;
   img=cv.getContext('2d').createImageData(cv.width,cv.height);buf32=new Uint32Array(img.data.buffer);
   hist=null;torusMap=null;stars=null;bins=null;levels=null;
  }
 }
 function setupBins(an){
  const n=an.frequencyBinCount,sr=an.context?.sampleRate||44100,perBin=sr/2/n;
  const bands=visStyle==='bayer'?Math.floor(cols/4):visStyle==='torus'?48:Math.ceil(cols/2);
  bins=[];const lo=45,hi=Math.min(15000,sr/2*.9);
  for(let b=0;b<bands;b++){
   const f0=lo*Math.pow(hi/lo,b/bands),f1=lo*Math.pow(hi/lo,(b+1)/bands);
   const i0=Math.max(1,Math.floor(f0/perBin)),i1=Math.max(i0,Math.min(n-1,Math.ceil(f1/perBin)-1));bins.push([i0,i1]);
  }
  levels=new Float32Array(bands);peaks=new Float32Array(bands);holds=new Uint8Array(bands);data=new Uint8Array(n);
 }
 function readSpectrum(an,playing){
  if(!bins||data.length!==an.frequencyBinCount)setupBins(an);
  if(playing)an.getByteFrequencyData(data);
  const L=levels.length;
  for(let b=0;b<L;b++){
   let v=0;
   if(playing){const [i0,i1]=bins[b];let s=0;for(let i=i0;i<=i1;i++)s+=data[i];v=Math.min(1,Math.pow(s/(i1-i0+1)/255,1.25)*(.85+b/L*.55));}
   levels[b]=v>=levels[b]?v:Math.max(v,levels[b]-.06);
   if(levels[b]>=peaks[b]){peaks[b]=levels[b];holds[b]=12;}else if(holds[b])holds[b]--;else peaks[b]=Math.max(levels[b],peaks[b]-.03);
  }
 }
 // One dot of the dot grid: pitch×pitch cell, (pitch-1)² lit (rowled: 2×1 per 4-row).
 function dot(x,y,c){
  const W=cols*3,px=x*3,py=y*pitch;
  const o=py*W+px;buf32[o]=c;buf32[o+1]=c;buf32[o+W]=c;buf32[o+W+1]=c;
 }
 const B=()=>window.MinkaDither.bayer8;
 function q(t,x,y){ // 0..1 → palette index 0..2 by ordered dither
  const v=t*2+B()[(y&7)*8+(x&7)]-.5;return v<.5?0:v<1.5?1:2;
 }
 function drawBayer(){
  const bw=4,L=levels.length;
  for(let b=0;b<L;b++){
   const H=levels[b]*rows,core=H*.55,fade=H*.45+rows*.12,pk=Math.round(rows-1-peaks[b]*(rows-1));
   for(let yy=0;yy<rows;yy++){
    const y=rows-1-yy;let t=yy<core?1:1-(yy-core)/fade;if(t<=0&&y!==pk)continue;
    for(let k=0;k<bw-1;k++){const x=b*bw+k;if(x>=cols)break;const lv=y===pk&&peaks[b]>.04?3:q(Math.max(0,t),x,y);if(lv)dot(x,y,pal[lv]);}
   }
  }
 }
 function drawField(playing){
  const half=Math.ceil(cols/2),L=levels.length;
  if(!hist||hist.length!==rows*half){hist=new Float32Array(rows*half);histHead=0;}
  if(playing||idle<2){histHead=(histHead+1)%rows;const row=histHead*half;for(let x=0;x<half;x++)hist[row+x]=levels[Math.min(L-1,Math.floor(x/half*L))];}
  for(let age=0;age<rows;age++){
   const r=((histHead-age)%rows+rows)%rows,row=r*half,y=rows-1-age,fall=1-age/rows*.75;
   for(let x=0;x<half;x++){
    const t=hist[row+x]*fall*1.25;if(t<.12)continue;
    const lv=q(Math.min(1,t),x,y);if(!lv)continue;
    const c=pal[age===0&&t>.7?3:lv];dot(half-1-x,y,c);if(half+x<cols)dot(half+x,y,c);
   }
  }
 }
 function drawRowLed(now){
  // A mirrored blob; each channel is dithered on its own at a shifted column,
  // so the edges split into red/blue like a CRT (the reference's RGB shift).
  const mid=(rows-1)/2,L=levels.length,shift=Math.max(1,Math.round(cols/90)),W=cols*3,bay=B();
  const tint=ink.map(v=>v/255*.35+.65);
  const field=x=>{if(x<0||x>=cols)return 0;return levels[Math.min(L-1,Math.floor(Math.abs(x-cols/2)/(cols/2)*L))];};
  for(let y=0;y<rows;y+=1){
   const dy=Math.abs(y-mid)/(rows/2);
   for(let x=0;x<cols;x++){
    const th=bay[(y&7)*8+(x&7)];
    const f=(v)=>{const edge=v*1.1-dy;return edge>0&&Math.min(1,edge*3.2)>th;};
    const r=f(field(x-shift)),g=f(field(x)),b=f(field(x+shift));
    if(!r&&!g&&!b)continue;
    const o=y*pitch*W+x*3,c=(255<<24)|((b?255*tint[2]:0)<<16)|((g?255*tint[1]:0)<<8)|(r?255*tint[0]:0);
    buf32[o]=c;buf32[o+1]=c;buf32[o+W]=c;buf32[o+W+1]=c;
   }
  }
 }
 function drawTorus(now){
  const L=levels.length;
  if(!torusMap){
   torusMap=new Float32Array(cols*rows*2);const cx=cols/2,cy=rows/2,R=Math.min(cols/2,rows/2)*.98;
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const dx=(x-cx)/R,dy=(y-cy)/R,i=(y*cols+x)*2;torusMap[i]=Math.hypot(dx,dy);torusMap[i+1]=Math.atan2(dy,dx);}
   stars=[];let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;for(let i=0;i<cols*rows/90;i++)stars.push([Math.floor(rnd()*cols),Math.floor(rnd()*rows),rnd()]);
  }
  let bass=0;for(let b=0;b<6;b++)bass+=levels[b];bass/=6;
  const R0=.58+bass*.1,w=.2+bass*.06,light=-2.3+Math.sin(now/2600)*.5;
  for(const [x,y,v] of stars)if(v>.55)dot(x,y,pal[v>.93?2:1]);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const i=(y*cols+x)*2,r=torusMap[i];if(r>1.05||r<.15)continue;
   const d=(r-R0)/w,prof=Math.exp(-d*d*2.2);if(prof<.05)continue;
   const ang=torusMap[i+1],band=levels[Math.floor(((ang+Math.PI)/(Math.PI*2))*L)%L];
   const lit=.4+.6*Math.max(0,Math.cos(ang-light));
   const t=Math.min(1,prof*lit*(.55+band*.9));
   const lv=t>.93?3:q(t,x,y);if(lv)dot(x,y,pal[lv]);
  }
 }
 function frame(now){
  raf=0;
  if(!active||document.hidden||!img)return;
  const a=engineAudio(),an=typeof analyser!=='undefined'?analyser:null,playing=!!a&&!a.paused&&!!an;
  if(now-last<1000/FPS){raf=requestAnimationFrame(frame);return;}
  last=now;
  if(playing)idle=0;else idle++;
  if(an)readSpectrum(an,playing);
  else if(!levels){levels=new Float32Array(visStyle==='bayer'?Math.floor(cols/4):visStyle==='torus'?48:Math.ceil(cols/2));peaks=new Float32Array(levels.length);holds=new Uint8Array(levels.length);}
  // Last idle frame: a still, designed standby shape instead of an empty stage.
  if(!playing&&idle>=39)standby();
  buf32.fill(pal[0]);
  if(visStyle==='field')drawField(playing);
  else if(visStyle==='rowled')drawRowLed(now);
  else if(visStyle==='torus')drawTorus(now);
  else drawBayer();
  els.vis.getContext('2d').putImageData(img,0,0);
  // After the music stops, let the bars fall, then hold the last still frame.
  if(playing||idle<40)raf=requestAnimationFrame(frame);
 }
 function standby(){
  const L=levels.length;
  for(let b=0;b<L;b++){const x=b/L;levels[b]=.1+.26*Math.exp(-Math.pow((x-.22)/.2,2))+.12*Math.exp(-Math.pow((x-.7)/.14,2));peaks[b]=levels[b]+.05;}
  if(visStyle==='field'&&hist){const half=Math.ceil(cols/2);for(let r=0;r<rows;r++)for(let x=0;x<half;x++)hist[r*half+x]=levels[Math.min(L-1,Math.floor(x/half*L))]*(.7+.3*Math.sin(r*.35+x*.08));}
 }
 function tuneAnalyser(){
  if(typeof analyser==='undefined'||!analyser)return;
  try{analyser.fftSize=lowSpec()?512:1024;analyser.smoothingTimeConstant=.5;analyser.minDecibels=-85;analyser.maxDecibels=-14;}catch(_){}
  bins=null;
 }
 function startVis(){
  if(!els.vis||!active)return;
  if(syncInk()){palette();syncArt();}
  if(!pal)palette();
  sizeVis();
  if(!raf){idle=0;raf=requestAnimationFrame(frame);}
 }
 function drawOnce(){if(!raf&&active){idle=38;raf=requestAnimationFrame(frame);}}
 function stopVis(){if(raf)cancelAnimationFrame(raf);raf=0;}

 // ---------- apply ----------
 function apply(rw,settings={}){
  const enabled=rw.dataset.radioLayout==='dither';
  if(enabled){
   build(rw);
   if(!window.__ampAudio&&typeof audio!=='undefined')window.__ampAudio=audio;
   const nextVis=VIS.includes(settings.ditherVis)?settings.ditherVis:'bayer';
   if(nextVis!==visStyle){visStyle=nextVis;cols=0;bins=null;levels=null;hist=null;torusMap=null;}
   shell.querySelectorAll('[data-vis-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.visChoice===visStyle)));
   {const look=document.getElementById('themeBtn');if(look){if(look.parentElement!==els.tools)els.tools.append(look);if(!look.classList.contains('dth-look')){look.classList.add('dth-look');look.insertAdjacentHTML('beforeend',icon('look'));}}}
   renderText();
   move(document.getElementById('radioSourceBar'),els.src);
   const vol=document.getElementById('vol');if(vol)setRange(els.vol,vol.value);
   if(!active){active=true;tuneAnalyser();}
   bindTime();syncState();startVis();
  }else if(active){active=false;stopVis();undither();restore();try{window.applyVizMode?.();}catch(_){}}
  window.syncShellLayout?.();
 }
 window.rgDitherLayout={apply,visModes:VIS,visLabels:VIS_LABEL,onVisPick:null};
})();
