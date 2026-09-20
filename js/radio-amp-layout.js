/* "Amp" faceplate: three Winamp-style panes (player · equalizer · playlist) in a
   soft dark-navy look. Not Webamp — a thin shell over the existing radio engine:
   it draws its own Winamp-style spectrum off the shared analyser and proxies #playBtn,
   #vol, selectStation() and the station picker; the equalizer is its own
   Winamp-band chain (see ampEq). */
(function(){
 'use strict';
 const BANDS=[60,170,310,600,1000,3000,6000,12000,14000,16000];
 const KEY='minka:amp-panes:v1',EQKEY='minka:amp-eq:v1';
 // Winamp's own presets (dB, clamped to ±12), same band layout as the classic EQ.
 const PRESETS={
  flat:{label:'Flat',g:[0,0,0,0,0,0,0,0,0,0]},
  rock:{label:'Rock',g:[8,4.8,-5.6,-8,-3.2,4,8.8,11.2,11.2,11.2]},
  pop:{label:'Pop',g:[-1.6,4.8,7.2,8,5.6,0,-2.4,-2.4,-1.6,-1.6]},
  dance:{label:'Dance',g:[9.6,7.2,2.4,0,0,-5.6,-7.2,-7.2,0,0]},
  techno:{label:'Techno',g:[8,5.6,0,-5.6,-4.8,0,8,9.6,9.6,8.8]},
  club:{label:'Club',g:[0,0,8,5.6,5.6,5.6,3.2,0,0,0]},
  fullbass:{label:'Full Bass',g:[-8,9.6,9.6,5.6,1.6,-4,-8,-10.4,-11.2,-11.2]},
  fulltreble:{label:'Full Treble',g:[-9.6,-9.6,-9.6,-4,2.4,11.2,12,12,12,12]},
  bassTreble:{label:'Bass & Treble',g:[7.2,5.6,0,-7.2,-4.8,1.6,8,11.2,12,12]},
  headphones:{label:'Headphones',g:[4.8,11.2,5.6,-3.2,-2.4,1.6,4.8,9.6,12,12]},
  hall:{label:'Large Hall',g:[10.4,10.4,5.6,5.6,0,-4.8,-4.8,-4.8,0,0]},
  live:{label:'Live',g:[-4.8,0,4,5.6,5.6,5.6,4,2.4,2.4,2.4]},
  party:{label:'Party',g:[7.2,7.2,0,0,0,0,0,0,7.2,7.2]},
  classical:{label:'Classical',g:[0,0,0,0,0,0,-7.2,-7.2,-7.2,-9.6]},
  reggae:{label:'Reggae',g:[0,0,0,-5.6,0,6.4,6.4,0,0,0]},
  ska:{label:'Ska',g:[-2.4,-4.8,-4,0,4,5.6,8.8,9.6,11.2,9.6]},
  soft:{label:'Soft',g:[4.8,1.6,0,-2.4,0,4,8,9.6,11.2,12]},
  softrock:{label:'Soft Rock',g:[4,4,2.4,0,-4,-5.6,-3.2,0,2.4,8.8]}
 };
 // Auto EQ: a preset guessed from the station name (LV/EN/RU keywords).
 const AUTO_RULES=[
  [/rock|metal|punk|grunge|guitar|рок|мет[аa]л/i,'rock'],
  [/techno|trance|hardstyle|hard ?core|edm|electro|drum|dnb|d&b|dubstep|техно|транс|электро/i,'techno'],
  [/bass|rap|hip[- ]?hop|trap|r&b|рэп|хип/i,'fullbass'],
  [/chill|lounge|relax|ambient|deep|lo-?fi|sleep|calm|чил|релакс|лаунж|спокой/i,'soft'],
  [/classic(al)?|klasik|symph|симфо|opera|jazz|blues|джаз|блюз/i,'classical'],
  [/news|ziņ|talk|sarun|radio ?1\b|bbc|nra|вест|новост|разговор/i,'flat'],
  [/retro|80|90|oldies|ретро|дискотек|zelta|gold|hits|хит/i,'pop'],
  [/dance|club|disco|house|party|mix|remix|record|диско|хаус|танц|клуб/i,'dance'],
  [/pop|поп|top|hit/i,'pop']
 ];
 function autoPresetFor(name){for(const [re,id] of AUTO_RULES)if(re.test(name||''))return id;return 'flat';}
 // This skin's own Winamp-band equalizer, inserted at the very end of the
 // radio graph (analyser → preamp → 10 filters → panner/destination) so it
 // never fights the shared 31–16k engine that radio_extras wires after the
 // master gain. Gains are stored per skin; disabling flattens the chain.
 const ampEq=(function(){
  let state;
  try{state=JSON.parse(localStorage.getItem(EQKEY));}catch(_){}
  if(!state||!Array.isArray(state.gains)||state.gains.length!==BANDS.length)state={enabled:true,preamp:0,auto:false,gains:BANDS.map(()=>0)};
  state.auto=state.auto===true;
  state.gains=state.gains.map(v=>Number.isFinite(v)?Math.max(-12,Math.min(12,v)):0);
  state.preamp=Number.isFinite(state.preamp)?Math.max(-12,Math.min(12,state.preamp)):0;
  let ctx,pre,filters,installed=false,bypassed=false;
  function apply(){
   if(!ctx)return;
   const on=state.enabled!==false&&!bypassed,t=ctx.currentTime;
   pre.gain.setTargetAtTime(on?Math.pow(10,state.preamp/20):1,t,.035);
   filters.forEach((f,i)=>f.gain.setTargetAtTime(on?state.gains[i]:0,t,.035));
  }
  function save(){try{localStorage.setItem(EQKEY,JSON.stringify(state));}catch(_){}apply();}
  return {
   snapshot:()=>({enabled:state.enabled!==false,preamp:state.preamp,auto:state.auto,gains:[...state.gains]}),
   setAuto(v){state.auto=!!v;save();},
   install(){
    if(installed)return true;
    if(typeof aCtx==='undefined'||!aCtx||typeof analyser==='undefined'||!analyser)return false;
    ctx=aCtx;pre=ctx.createGain();
    filters=BANDS.map((hz,i)=>{const f=ctx.createBiquadFilter();f.type=i===0?'lowshelf':i===BANDS.length-1?'highshelf':'peaking';f.frequency.value=hz;f.Q.value=1.1;return f;});
    if(!window._rgPanner){window._rgPanner=ctx.createStereoPanner();window._rgPanner.connect(ctx.destination);}
    analyser.disconnect();analyser.connect(pre);pre.connect(filters[0]);
    filters.slice(0,-1).forEach((f,i)=>f.connect(filters[i+1]));filters.at(-1).connect(window._rgPanner);
    installed=true;apply();return true;
   },
   setBand(i,v){if(!Number.isInteger(i)||i<0||i>=BANDS.length||!Number.isFinite(v))return;state.gains[i]=Math.max(-12,Math.min(12,v));save();},
   setPreamp(v){if(!Number.isFinite(v))return;state.preamp=Math.max(-12,Math.min(12,v));save();},
   setEnabled(v){state.enabled=!!v;save();},
   bypass(v){bypassed=!!v;apply();},
   preset(id){if(!PRESETS[id])return;state.gains=[...PRESETS[id].g];state.enabled=true;save();}
  };
 })();
 let shell,screen,panes={},built=false,active=false,homes=new Map();
 let els={},lastTitle='',marqueeTimer=0,timeBound=false,observers=[],presetMenu=null;
 const $=(sel,root)=>(root||shell).querySelector(sel);
 const pad=n=>String(n).padStart(2,'0');
 const fmt=s=>{s=Math.max(0,Math.floor(s||0));return pad(Math.floor(s/60)%100)+':'+pad(s%60);};
 const svg={
  prev:'<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM18 5 9 12l9 7z"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M7 4.5 20 12 7 19.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  stop:'<svg viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="2"/></svg>',
  next:'<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM6 5l9 7-9 7z"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h9"/></svg>',
  eq:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 9v6M8.5 5v14M12 8v8M15.5 4v16M19 10v4"/></svg>',
  radio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7 13-4M5 8h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/><circle cx="8" cy="14.5" r="2.5"/><path d="M14 12h4m-4 4h4"/></svg>',
  power:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3.5H9l-.3 2.5a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1l.3 2.5h6l.3-2.5a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/></svg>',
  eject:'<svg viewBox="0 0 24 24"><path d="M12 5 4.5 14h15L12 5Z"/><rect x="4.5" y="16" width="15" height="3" rx="1.5"/></svg>',
  speaker:'<svg class="amp-spk" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  wave:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 12h2l2-6 3 12 3-9 2 5 2-2h4"/></svg>'
 };
 function move(el,parent){
  if(!el)return;
  if(!homes.has(el)){const m=document.createComment('amp-home');el.before(m);homes.set(el,m);}
  if(el.parentElement!==parent)parent.append(el);
 }
 function restore(){for(const [el,m] of homes)m.replaceWith(el);homes.clear();}
 function loadPanes(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&typeof v==='object')return {eq:v.eq!==false,pl:v.pl!==false};}catch(_){}return {eq:true,pl:true};}
 function savePanes(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch(_){}}
 function setRange(input,value){input.value=String(value);paintRange(input);}
 function paintRange(input){
  const min=Number(input.min)||0,max=Number(input.max)||100,v=Number(input.value);
  input.style.setProperty('--p',(((v-min)/(max-min))*100).toFixed(2)+'%');
  if(input.classList.contains('amp-vband'))input.dataset.sign=v>0?'up':v<0?'down':'zero';
 }
 // ---------- build ----------
 function build(rw){
  if(built)return;built=true;
  const css=document.createElement('link');css.rel='stylesheet';css.href='css/radio-amp-layout.css?v=20260920amp24';css.onload=()=>window.syncShellLayout?.();document.head.append(css);
  shell=document.createElement('div');shell.className='amp-shell';
  shell.innerHTML=`
   <section class="amp-pane amp-main" aria-label="Atskaņotājs">
    <div class="amp-dots" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="amp-top">
     <div class="amp-screen"><canvas class="amp-vis" data-vis width="300" height="124" aria-hidden="true"></canvas><div class="amp-time" data-time>00:00</div></div>
     <div class="amp-right">
      <div class="amp-now">
       <div class="amp-cover" data-cover><img alt="" decoding="async" loading="lazy" crossorigin="anonymous"><span class="amp-cover-ph" aria-hidden="true">${svg.radio}</span></div>
       <div class="amp-lines">
        <div class="amp-song" data-song><span>RG RADIO</span></div>
        <div class="amp-artist" data-artist><span>Izvēlies staciju</span></div>
       </div>
      </div>
      <div class="amp-volrow">${svg.speaker}<input type="range" class="amp-h amp-vol" min="0" max="1" step="0.01" value="0.7" aria-label="Skaļums" data-vol><input type="range" class="amp-h amp-bal" min="-1" max="1" step="0.05" value="0" aria-label="Balanss (dubultklikšķis = centrs)" title="Balanss" data-bal></div>
      <div class="amp-metaline"><span data-live>LIVE</span><span data-kbps></span></div>
     </div>
    </div>
    <div class="amp-seek-wrap"><input type="range" class="amp-h amp-seek" min="0" max="3600" step="1" value="0" aria-label="Pozīcija" data-seek disabled></div>
    <div class="amp-bottom">
     <div class="amp-transport">
      <button type="button" class="amp-pill" data-act="prev" title="Iepriekšējā stacija">${svg.prev}</button>
      <button type="button" class="amp-pill" data-act="play" title="Atskaņot">${svg.play}</button>
      <button type="button" class="amp-pill" data-act="pause" title="Pauze">${svg.pause}</button>
      <button type="button" class="amp-pill" data-act="next" title="Nākamā stacija">${svg.next}</button>
      <button type="button" class="amp-sq amp-eject" data-act="stations" title="Stacijas">${svg.eject}</button>
     </div>
     <div class="amp-extra">
      <button type="button" class="amp-tog" data-act="shuffle" title="Nejauša stacija">${svg.shuffle}<i></i></button>
      <button type="button" class="amp-tog" data-tog="eq" title="Ekvalaizers">${svg.eq}<i></i></button>
      <button type="button" class="amp-tog" data-tog="pl" title="Stacijas">${svg.list}<i></i></button>
     </div>
    </div>
   </section>
   <section class="amp-pane amp-eq" aria-label="Ekvalaizers">
    <div class="amp-eq-head">
     <button type="button" class="amp-tog" data-eq-on title="Ekvalaizers ieslēgts">${svg.power}<i></i></button>
     <button type="button" class="amp-tog" data-eq-auto title="Auto EQ pēc stacijas"><b>A</b><i></i></button>
     <button type="button" class="amp-tog amp-preset-btn" data-eq-preset title="Preseti">${svg.list}<i></i></button>
     <svg class="amp-curve" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" points=""/></svg>
     <span class="amp-eq-tools" data-tools></span>
    </div>
    <div class="amp-bands">
     <label class="amp-band amp-pre"><input type="range" class="amp-vband" min="-12" max="12" step="1" value="0" data-preamp aria-label="Preamp"><span>PRE</span></label>
     <div class="amp-scale" aria-hidden="true"><span>+12</span><span>+0</span><span>−12</span></div>
     ${BANDS.map((hz,i)=>`<label class="amp-band"><input type="range" class="amp-vband" min="-12" max="12" step="1" value="0" data-band="${i}" aria-label="${hz} Hz"><span>${hz>=1000?hz/1000+'K':hz}</span></label>`).join('')}
    </div>
   </section>
   <section class="amp-pane amp-pl" aria-label="Stacijas">
    <ol class="amp-list" data-list></ol>
    <div class="amp-pl-foot">
     <button type="button" class="amp-sq" data-act="stations" title="Meklēt stacijas">+</button>
     <button type="button" class="amp-sq" data-act="viz" title="Vizualizācija">${svg.wave}</button>
     <button type="button" class="amp-sq" data-act="look" title="Izskats">…</button>
     <span class="amp-chip amp-count" data-count>0/0</span>
    </div>
   </section>`;
  rw.append(shell);
  screen=$('.amp-screen');
  panes={eq:$('.amp-eq'),pl:$('.amp-pl')};
  els={vis:$('[data-vis]'),cover:$('[data-cover]'),time:$('[data-time]'),song:$('[data-song]'),artist:$('[data-artist]'),kbps:$('[data-kbps]'),vol:$('[data-vol]'),bal:$('[data-bal]'),seek:$('[data-seek]'),live:$('[data-live]'),list:$('[data-list]'),count:$('[data-count]'),curve:$('.amp-curve polyline'),eqOn:$('[data-eq-on]'),autoBtn:$('[data-eq-auto]'),presetBtn:$('[data-eq-preset]'),tools:$('[data-tools]')};
  bind();
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(active)startVis();}).observe(screen);
 }
 // ---------- wiring ----------
 function stationsPlain(){return (typeof stationsList!=='undefined'?stationsList:[]).map((s,i)=>({s,i})).filter(x=>x.s&&x.s.group!=='separator');}
 function playToggle(){document.getElementById('playBtn')?.click();}
 function bind(){
  const rw=document.getElementById('radioWindow');
  shell.addEventListener('click',e=>{
   const b=e.target.closest('[data-act],[data-tog]');if(!b)return;
   const act=b.dataset.act;
   if(b.dataset.tog){const v=loadPanes();v[b.dataset.tog]=!v[b.dataset.tog];savePanes(v);applyPanes();return;}
   const audio=window.__ampAudio;
   if(act==='prev')window.playPrev?.();
   else if(act==='next')window.playNext?.();
   else if(act==='play'){if(!audio||audio.paused||audio.error)playToggle();}
   else if(act==='toggle')playToggle();
   else if(act==='pause'||act==='stop'){if(audio&&!audio.paused)playToggle();}
   else if(act==='shuffle'){const list=stationsPlain();if(list.length){const pick=list[Math.floor(Math.random()*list.length)];window.selectStation?.(pick.i);}}
   else if(act==='stations')window.toggleMenu?.(true);
   else if(act==='viz')document.getElementById('vizBtn')?.click();
   else if(act==='look')document.getElementById('themeBtn')?.click();
  });
  // volume ↔ the real #vol input (the engine listens to its input event)
  const vol=document.getElementById('vol');
  els.vol.addEventListener('input',()=>{paintRange(els.vol);if(!vol)return;vol.value=els.vol.value;vol.dispatchEvent(new Event('input',{bubbles:true}));});
  els.vol.addEventListener('change',()=>vol?.dispatchEvent(new Event('change',{bubbles:true})));
  // balance: same stereo panner the EQ dialog uses; double-click recentres
  els.bal.addEventListener('input',()=>{paintRange(els.bal);setBalance(Number(els.bal.value));});
  els.bal.addEventListener('dblclick',()=>{setRange(els.bal,0);setBalance(0);});
  vol?.addEventListener('input',()=>{if(vol.value!==els.vol.value)setRange(els.vol,vol.value);});
  // equalizer
  shell.querySelectorAll('[data-band]').forEach(input=>{
   input.addEventListener('input',()=>{paintRange(input);ensureEq();ampEq.setBand(Number(input.dataset.band),Number(input.value));if(ampEq.snapshot().auto){ampEq.setAuto(false);els.autoBtn.setAttribute('aria-pressed','false');}drawCurve();});
   input.addEventListener('dblclick',()=>{setRange(input,0);ensureEq();ampEq.setBand(Number(input.dataset.band),0);drawCurve();});
  });
  const pre=shell.querySelector('[data-preamp]');
  pre.addEventListener('input',()=>{paintRange(pre);ensureEq();ampEq.setPreamp(Number(pre.value));});
  pre.addEventListener('dblclick',()=>{setRange(pre,0);ensureEq();ampEq.setPreamp(0);});
  els.eqOn.addEventListener('click',()=>{ensureEq();ampEq.setEnabled(!ampEq.snapshot().enabled);renderEq();});
  els.autoBtn.addEventListener('click',()=>{ensureEq();const on=!ampEq.snapshot().auto;ampEq.setAuto(on);if(on){lastAutoStation='';applyAutoEq();}renderEq();});
  els.presetBtn.addEventListener('click',e=>{e.stopPropagation();togglePresets();});
  document.addEventListener('click',e=>{if(presetMenu&&!presetMenu.contains(e.target)&&e.target!==els.presetBtn)closePresets();});
  // playlist
  els.list.addEventListener('click',e=>{const li=e.target.closest('li[data-index]');if(li)window.selectStation?.(Number(li.dataset.index));});
  window.addEventListener('rg-stations-ready',()=>{if(active)renderList();});
  // live state: the engine writes data-playback on the window and the
  // now-playing texts into the hidden console; observe instead of polling.
  const mo=new MutationObserver(()=>{if(active)syncState();});
  mo.observe(rw,{attributes:true,attributeFilter:['data-playback','class']});
  for(const id of ['curStation','npArtist','npTitle','ui-kbps'])
   {const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,characterData:true,subtree:true});}
  const cover=document.getElementById('npCover');if(cover)mo.observe(cover,{attributes:true,attributeFilter:['src','class','style']});
  observers.push(mo);
  document.addEventListener('rg-now-playing-art',()=>{if(active)syncState();});
 }
 function ensureEq(){
  // The graph exists only after setupAudio(); until then gains are stored and
  // applied on install. Installing before the first play is harmless.
  try{if(typeof setupAudio==='function')setupAudio();ampEq.install();}catch(_){}
 }
 function setBalance(value){
  try{
   ensureEq();
   if(typeof aCtx==='undefined'||!aCtx||typeof analyser==='undefined'||!analyser)return;
   if(!window._rgPanner){window._rgPanner=aCtx.createStereoPanner();analyser.disconnect();analyser.connect(window._rgPanner);window._rgPanner.connect(aCtx.destination);}
   window._rgPanner.pan.setTargetAtTime(Math.max(-1,Math.min(1,value)),aCtx.currentTime,.035);
  }catch(_){}
 }
 function bindTime(){
  if(timeBound)return;
  const audio=window.__ampAudio;if(!audio)return;timeBound=true;
  const update=()=>{if(!active)return;els.time.textContent=fmt(audio.currentTime);
   const finite=Number.isFinite(audio.duration)&&audio.duration>0;
   els.seek.disabled=!finite;els.live.textContent=finite?fmt(audio.duration):'LIVE';
   setRange(els.seek,finite?(audio.currentTime/audio.duration)*3600:(audio.currentTime%3600));};
  audio.addEventListener('timeupdate',update);audio.addEventListener('play',()=>{update();if(active){ampEq.install();startVis();}});audio.addEventListener('emptied',update);
  els.seek.addEventListener('input',()=>{paintRange(els.seek);if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(els.seek.value)/3600*audio.duration;});
 }
 // ---------- render ----------
 function applyPanes(){
  const v=loadPanes();
  for(const k of ['eq','pl']){panes[k].hidden=!v[k];shell.querySelector(`[data-tog="${k}"]`).setAttribute('aria-pressed',String(v[k]));}
  shell.dataset.panes=(v.eq?'eq ':'')+(v.pl?'pl':'');
  window.syncShellLayout?.();
 }
 function syncState(){
  const rw=document.getElementById('radioWindow');
  // the music player parks #radioSourceBar at the window top when it closes
  const bar=document.getElementById('radioSourceBar'),mainPane=$('.amp-main');
  if(bar&&mainPane&&!rw.classList.contains('music-source')&&bar.parentElement!==mainPane)mainPane.append(bar);
  const state=rw.dataset.playback||'';
  const audio=window.__ampAudio;
  const playing=state==='playing'||(state==='loading'&&audio&&!audio.paused);
  shell.querySelector('[data-act="play"]').classList.toggle('is-on',playing);
  shell.querySelector('[data-act="pause"]').classList.toggle('is-on',!playing&&!!audio&&audio.currentTime>0);
  shell.classList.toggle('is-playing',playing);
  const st=document.getElementById('curStation')?.textContent.trim()||'RG RADIO';
  const ar=document.getElementById('npArtist')?.textContent.trim()||'',ti=document.getElementById('npTitle')?.textContent.trim()||'';
  // song line: track title when known, else the station; artist line: artist, else station
  const song=ti||st,artist=ti?(ar||st):(ar||(playing?'Tiešraide':'Izvēlies staciju'));
  setLine(els.song,song);setLine(els.artist,artist);
  const q=document.getElementById('ui-kbps')?.textContent.trim()||'';
  const m=q.match(/(\d{2,3})/);els.kbps.textContent=m?m[1]+' kbps':'';
  // album art: same image the engine resolved for the console (cover or station logo)
  const src=document.getElementById('npCover')?.getAttribute('src')||'';
  const img=els.cover.firstElementChild;
  if(!src||src.startsWith('data:image/svg')){els.cover.classList.remove('is-in');}
  else if(img.getAttribute('src')!==src){els.cover.classList.remove('is-in');img.onload=()=>els.cover.classList.add('is-in');img.onerror=()=>els.cover.classList.remove('is-in');img.src=src;}
  renderListCurrent();
 }
 let lastAutoStation='';
 function applyAutoEq(){
  if(!ampEq.snapshot().auto)return;
  const st=document.getElementById('curStation')?.textContent.trim()||'';
  const key=st+'|'+((typeof stationsList!=='undefined'&&typeof currentIndex!=='undefined'&&stationsList[currentIndex])?stationsList[currentIndex].group:'');
  if(!st||key===lastAutoStation)return;lastAutoStation=key;
  ensureEq();ampEq.preset(autoPresetFor(st));renderEq();
 }
 // Winamp-style scroll for lines that do not fit; static when they do.
 let lineTimer=0;
 function setLine(box,text){
  const span=box.firstElementChild;
  if(span.textContent===text&&box.dataset.fit===String(box.clientWidth))return;
  span.textContent=text;box.title=text;box.dataset.fit=String(box.clientWidth);
  box.classList.remove('is-long');span.style.setProperty('--shift','0px');
  clearTimeout(lineTimer);
  lineTimer=setTimeout(()=>{
   for(const b of [els.song,els.artist]){
    const sp=b.firstElementChild,over=sp.scrollWidth-b.clientWidth;
    if(over>4){sp.style.setProperty('--shift',(-over-6)+'px');sp.style.setProperty('--dur',Math.max(6,over/18)+'s');b.classList.add('is-long');}
    else{b.classList.remove('is-long');}
   }
  },50);
 }
 function renderList(){
  const rows=stationsPlain();
  const html=rows.map(({s,i},n)=>`<li data-index="${i}"><span class="amp-n">${n+1}.</span><span class="amp-name">${escape(s.title)}</span><span class="amp-len">${s.group==='world'?'WEB':s.group==='latvija'?'LV':'REC'}</span></li>`).join('');
  if(els.list.innerHTML!==html)els.list.innerHTML=html;
  renderListCurrent();
 }
 function renderListCurrent(){
  const idx=typeof currentIndex!=='undefined'?currentIndex:-1;
  const prev=els.list.querySelector('.is-current'),next=els.list.querySelector(`li[data-index="${idx}"]`);
  if(prev!==next){prev?.classList.remove('is-current');next?.classList.add('is-current');next?.scrollIntoView({block:'nearest'});}
  const rows=els.list.children.length,pos=next?Array.prototype.indexOf.call(els.list.children,next)+1:0;
  els.count.textContent=pos+'/'+rows;
 }
 function escape(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
 function renderEq(){
  const snap=ampEq.snapshot();
  shell.querySelectorAll('[data-band]').forEach(input=>{setRange(input,snap.gains[Number(input.dataset.band)]);input.disabled=!snap.enabled;});
  const pre=shell.querySelector('[data-preamp]');setRange(pre,snap.preamp);pre.disabled=!snap.enabled;
  els.eqOn.setAttribute('aria-pressed',String(snap.enabled));
  els.autoBtn.setAttribute('aria-pressed',String(snap.auto));
  const match=Object.entries(PRESETS).find(([,p])=>p.g.every((v,i)=>v===snap.gains[i]));
  els.presetBtn.title=match?'Preseti · '+match[1].label:'Preseti';
  panes.eq.classList.toggle('is-off',!snap.enabled);
  drawCurve();
 }
 function drawCurve(){
  const snap=ampEq.snapshot(),gains=snap.gains,on=snap.enabled;
  els.curve.setAttribute('points',gains.map((v,i)=>`${(i*100/9).toFixed(1)},${(15-(on?v:0)*1.1).toFixed(2)}`).join(' '));
 }
 function togglePresets(){
  if(presetMenu){closePresets();return;}
  presetMenu=document.createElement('div');presetMenu.className='amp-presets';
  presetMenu.innerHTML=Object.entries(PRESETS).map(([id,p])=>`<button type="button" data-preset="${id}">${escape(p.label)}</button>`).join('');
  presetMenu.addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(!b)return;ensureEq();ampEq.preset(b.dataset.preset);ampEq.setAuto(false);renderEq();closePresets();});
  els.presetBtn.after(presetMenu);els.presetBtn.setAttribute('aria-expanded','true');
 }
 function closePresets(){presetMenu?.remove();presetMenu=null;els.presetBtn.setAttribute('aria-expanded','false');}

 // ---------- Winamp-style spectrum (webamp look: log bands, falling peaks) ----------
 // Two looks: "webamp" (default) — slim light bars with falling peak caps;
 // "classic" — chunky green→yellow→orange ladder like the original Winamp.
 let visStyle='webamp';
 const VIS_FPS=(window.__mkPerfProfile&&window.__mkPerfProfile.lowSpec)?40:60;
 let visRaf=0,visLast=0,visBars=0,visLevels=null,visPeaks=null,visHold=null,visBins=null,visData=null,visWave=null,visIdle=0,visGrad=null,visGradKey='';
 function visSetup(an){
  visBars=visStyle==='classic'?16:26;
  visLevels=new Float32Array(visBars);visPeaks=new Float32Array(visBars);visHold=new Uint8Array(visBars);visGradKey='';
  const n=an.frequencyBinCount,sr=(an.context&&an.context.sampleRate)||44100,hz=i=>i*sr/2/n;
  const lo=visStyle==='classic'?50:45,hi=Math.min(15500,sr/2*.9);visBins=[];
  for(let b=0;b<visBars;b++){
   const f0=lo*Math.pow(hi/lo,b/visBars),f1=lo*Math.pow(hi/lo,(b+1)/visBars);
   let i0=Math.max(1,Math.floor(f0/hz(1))),i1=Math.max(i0+1,Math.ceil(f1/hz(1)));visBins.push([i0,Math.min(n-1,i1)]);
  }
  visData=new Uint8Array(n);
 }
 function visFrame(ts){
  visRaf=0;
  if(!active||document.hidden)return;
  const cv=els.vis,audio=window.__ampAudio;
  const an=(typeof analyser!=='undefined')?analyser:null;
  const playing=!!audio&&!audio.paused&&!!an;
  if(ts-visLast<1000/VIS_FPS){visRaf=requestAnimationFrame(visFrame);return;}
  visLast=ts;
  const w=cv.width,h=cv.height,ctx=cv.getContext('2d');
  if(visStyle==='wave'){
   ctx.clearRect(0,0,w,h);
   if(!playing){visIdle++;if(visIdle>90)return;}else visIdle=0;
   if(an){
    if(!visWave||visWave.length!==an.fftSize)visWave=new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(visWave);
    const dpr=w/(cv.clientWidth||w),padX=14*dpr,top=40*dpr,bottom=h-12*dpr,mid=(top+bottom)/2,amp=(bottom-top)/2;
    const accent=document.getElementById('radioWindow').style.getPropertyValue('--radio-accent-rgb').trim()||'164,229,214';
    ctx.lineWidth=2*dpr;ctx.lineJoin='round';ctx.strokeStyle='rgb('+accent+')';ctx.beginPath();
    const n=visWave.length,step=Math.max(1,Math.floor(n/160));
    for(let i=0,k=0;i<n;i+=step,k++){const x=padX+(i/(n-1))*(w-padX*2),y=mid+((playing?visWave[i]:128)-128)/128*amp*1.15;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();
   }
   visRaf=requestAnimationFrame(visFrame);return;
  }
  if(an&&(!visBins||visData.length!==an.frequencyBinCount||visBars!==(visStyle==='classic'?16:26)))visSetup(an);
  if(!visLevels){ctx.clearRect(0,0,w,h);visRaf=requestAnimationFrame(visFrame);return;}
  if(!playing){visIdle++;for(let b=0;b<visBars;b++){visLevels[b]*=.88;visPeaks[b]=Math.max(0,visPeaks[b]-.03);}if(visIdle>90){ctx.clearRect(0,0,w,h);return;}}
  else{
   visIdle=0;an.getByteFrequencyData(visData);
   for(let b=0;b<visBars;b++){
    const [i0,i1]=visBins[b];let sum=0;for(let i=i0;i<=i1;i++)sum+=visData[i];
    // fast attack, quick fall: the shared analyser already smooths, so no extra lag here
    let v=(sum/(i1-i0+1))/255;v=Math.min(1,Math.pow(v,1.15)*(0.8+b/visBars*.6));
    visLevels[b]=v>=visLevels[b]?v:Math.max(v,visLevels[b]-.07);
    if(visLevels[b]>=visPeaks[b]){visPeaks[b]=visLevels[b];visHold[b]=10;}
    else if(visHold[b]>0)visHold[b]--;else visPeaks[b]=Math.max(visLevels[b],visPeaks[b]-.045);
   }
  }
  ctx.clearRect(0,0,w,h);
  const dpr=w/(cv.clientWidth||w);
  const padX=14*dpr,padTop=40*dpr,padBot=12*dpr,gap=(visStyle==='classic'?4:3)*dpr,bw=(w-padX*2-gap*(visBars-1))/visBars,floor=h-padBot,span=floor-padTop;
  const accent=visStyle==='classic'?'':(document.getElementById('radioWindow').style.getPropertyValue('--radio-accent-rgb').trim()||'164,229,214');
  const key=visStyle+w+'x'+h+accent;
  if(visGradKey!==key){
   visGrad=ctx.createLinearGradient(0,floor,0,padTop);
   if(visStyle==='classic'){visGrad.addColorStop(0,'#3fd61c');visGrad.addColorStop(.45,'#b8e224');visGrad.addColorStop(.72,'#f3c62a');visGrad.addColorStop(1,'#ff6a2a');}
   else{visGrad.addColorStop(0,'rgba('+accent+',.55)');visGrad.addColorStop(1,'rgba(236,240,250,.95)');}
   visGradKey=key;
  }
  ctx.fillStyle=visGrad;
  if(visStyle==='mirror'){
   const mid=(padTop+floor)/2,half=span/2;
   for(let b=0;b<visBars;b++){const x=padX+b*(bw+gap),bh=Math.max(2*dpr,visLevels[b]*half);ctx.beginPath();ctx.roundRect(x,mid-bh,bw,bh*2,bw/2);ctx.fill();}
   visRaf=requestAnimationFrame(visFrame);return;
  }
  for(let b=0;b<visBars;b++){
   const x=padX+b*(bw+gap),bh=Math.max(3*dpr,visLevels[b]*span);
   ctx.beginPath();ctx.roundRect(x,floor-bh,bw,bh,visStyle==='classic'?[2*dpr,2*dpr,0,0]:[bw/2,bw/2,1,1]);ctx.fill();
  }
  if(visStyle!=='classic'){
   ctx.fillStyle='rgba(236,240,250,.9)';
   for(let b=0;b<visBars;b++){const x=padX+b*(bw+gap),py=floor-Math.max(4*dpr,visPeaks[b]*span)-3*dpr;ctx.fillRect(x,py,bw,2*dpr);}
  }
  visRaf=requestAnimationFrame(visFrame);
 }
 // The shared analyser is tuned for whatever visualizer the console runs
 // (classic modes: smoothing .8, 128 bins — sluggish). While Amp is on it gets
 // a fast, finer setting; leaving Amp hands it back to applyVizMode().
 function tuneAnalyser(){
  if(typeof analyser==='undefined'||!analyser)return;
  const low=!!(window.__mkPerfProfile&&window.__mkPerfProfile.lowSpec);
  try{analyser.fftSize=low?512:1024;analyser.smoothingTimeConstant=.35;analyser.minDecibels=-85;analyser.maxDecibels=-12;}catch(_){}
  if(visBins)visBins=null;
 }
 function startVis(){
  if(!els.vis)return;
  tuneAnalyser();
  const box=els.vis.parentElement,dpr=Math.min(window.devicePixelRatio||1,2);
  const rw=box.clientWidth||300,rh=box.clientHeight||124;
  if(els.vis.width!==Math.round(rw*dpr)||els.vis.height!==Math.round(rh*dpr)){els.vis.width=Math.round(rw*dpr);els.vis.height=Math.round(rh*dpr);}
  if(!visRaf)visRaf=requestAnimationFrame(visFrame);
 }
 function stopVis(){if(visRaf)cancelAnimationFrame(visRaf);visRaf=0;}
 document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden)startVis();});
 // ---------- apply ----------
 function apply(rw,settings={}){
  const enabled=rw.dataset.radioLayout==='amp';
  if(enabled){
   build(rw);
   if(!window.__ampAudio&&typeof audio!=='undefined')window.__ampAudio=audio;
   visStyle=['classic','mirror','wave'].includes(settings.ampVis)?settings.ampVis:'webamp';
   startVis();
   // paintAppearance re-homes #themeBtn per layout itself, so no home marker here
   {const look=document.getElementById('themeBtn');if(look&&look.parentElement!==els.tools)els.tools.append(look);}
   move(document.getElementById('radioSourceBar'),$('.amp-main'));
   const vol=document.getElementById('vol');if(vol)setRange(els.vol,vol.value);
   paintRange(els.bal);
   bindTime();applyPanes();renderEq();renderList();syncState();
   if(window.__ampAudio&&!window.__ampAudio.paused)ampEq.install();
   ampEq.bypass(false);
  }else if(active){closePresets();restore();ampEq.bypass(true);stopVis();try{window.applyVizMode?.();}catch(_){}}
  if(enabled!==active){active=enabled;window.syncShellLayout?.();}
 }
 window.rgAmpLayout={apply,refreshEq:()=>{if(active)renderEq();}};
})();
