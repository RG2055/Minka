/* One authenticated account for radio and Lācītis. No PINs stored in the browser. */
(function(){
 'use strict';
 const local=/^(127\.0\.0\.1|localhost)$/.test(location.hostname);
 const API=local?'/dezura/v2':'https://lacitis-api.gamernr1elite.workers.dev/dezura/v2';
 const KEY='minka:media-session:v2';
 // Keep the persisted handover deadline independent of the selected calendar date.
 function nextDutyBoundary(now=Date.now()){
  const format=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const parts=time=>Object.fromEntries(format.formatToParts(new Date(time)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  const p=parts(now),wall=Date.UTC(p.year,p.month-1,p.day+(p.hour>=8?1:0),8),z=parts(wall);
  return wall-(Date.UTC(z.year,z.month-1,z.day,z.hour,z.minute,z.second)-wall);
 }
 function checkSessionDeadline(){
  if(!session)return false;
  if(Date.now()<Math.min(session.expiresAt,session.dutyEndsAt))return true;
  void logout();status('Maiņa vai sesija beigusies. Ielogojies savā profilā.');return false;
 }
 function armSessionDeadline(){
  clearTimeout(expiryTimer);if(!session)return;
  expiryTimer=setTimeout(()=>{if(checkSessionDeadline())armSessionDeadline();},Math.max(0,Math.min(session.expiresAt,session.dutyEndsAt)-Date.now()));
 }
 const pretty=s=>String(s||'').toLocaleLowerCase('lv-LV').replace(/(^|[\s-])([a-zāčēģīķļņōŗšūž])/g,(_,a,b)=>a+b.toLocaleUpperCase('lv-LV'));
 const norm=s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('lv-LV');
 let rosterDate='',session=null,radio={favorites:[],settings:{},lastStation:''},generation=0,busy=false,queue=[],flushing=false,expiryTimer=0,selected=null,recovering=false,guestLook=null,loaded=false,editingFavorites=false,favoriteUndo=null;
 const $=id=>document.getElementById(id);
 const dialog=document.createElement('dialog');dialog.id='mediaProfile';dialog.setAttribute('aria-labelledby','mediaProfileTitle');
 dialog.innerHTML=`<header><div class="media-identity"><span id="mediaProfileAvatar" hidden></span><div><small>RADIO PROFILS</small><h2 id="mediaProfileTitle">Ielogoties</h2></div></div><button type="button" data-close aria-label="Aizvērt profilu"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></header>
 <p id="mediaDate"></p><p id="mediaStatus" role="status" aria-live="polite"></p><div id="mediaContent"></div>
 <section id="mediaRecoveryNotice" hidden><h3>Saglabā atkopšanas kodu</h3><p>Ar to varēsi nomainīt aizmirstu PIN, saglabājot favorītus. Šis kods tiek parādīts tikai vienu reizi.</p><code id="mediaRecoveryCode"></code><button type="button" id="mediaRecoveryCopy">Kopēt kodu</button><button type="button" id="mediaRecoveryDone">Esmu saglabājis</button></section>`;
 document.body.append(dialog);
 const trigger=document.createElement('button');trigger.type='button';trigger.id='mediaProfileButton';trigger.textContent='Ielogoties';trigger.title='Ielogoties radio profilā';trigger.addEventListener('click',open);
 const exitTrigger=button('Iziet',()=>{void logout();dialog.close();trigger.focus();});exitTrigger.id='mediaLogoutButton';exitTrigger.hidden=true;
 exitTrigger.prepend(icon('exit'));exitTrigger.title='Iziet no sava profila';exitTrigger.setAttribute('aria-label','Iziet no profila');
 $('radioSourceBar')?.prepend(trigger,exitTrigger);
 trigger.title='Saglabā savas iecienītās stacijas un radio izskatu.';
 trigger.setAttribute('aria-description',trigger.title);
 function avatar(name){
  const el=document.createElement('span');el.className='media-worker-avatar';let emoji='';
  try{emoji=$('calIframe')?.contentWindow?.MinkaEmoji?.get(name)||'';}catch(_){}
  el.textContent=emoji||String(name||'').trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('');
  if(emoji)el.classList.add('has-emoji');el.setAttribute('aria-hidden','true');return el;
 }
 function status(text){$('mediaStatus').textContent=text;}
 function roster(){
  let state=window.__minkaLastSelectedDayState;
  try{state=$('calIframe')?.contentWindow?.__minkaGetSelectedDayState?.()||state;}catch(_){}
  const map=new Map();for(const w of (state?.rg||[]))if(w?.name)map.set(norm(w.name),{name:String(w.name),shift:'Dežūra'});
  if(!map.size)for(const name of window.__lacitisTodayWorkers?.()||[])map.set(norm(name),{name,shift:'Dežūra'});
  return {date:state?.activeDateStr||state?.date||state?.dateKey||state?.day||'',workers:[...map.values()]};
 }
 // The local preview uses the deployed API, which may not yet accept new look fields.
 const localLookKey=id=>'minka:media-local-look:'+id;
 function localLookSettings(value={}){
  const out={};if(['classic','clean','pioneer'].includes(value.layout))out.layout=value.layout;
  if(['auto','on','off'].includes(value.vizFrame))out.vizFrame=value.vizFrame;
  if(value.vizPositions&&typeof value.vizPositions==='object'){out.vizPositions={};for(const layout of ['classic','clean','pioneer']){const point=value.vizPositions[layout];if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))out.vizPositions[layout]={x:Math.max(-1,Math.min(1,point.x)),y:Math.max(-1,Math.min(1,point.y))};}}
  if(/^#[\da-f]{6}$/i.test(value.metalColor||''))out.metalColor=value.metalColor;
  for(const key of ['metalLight','metalShine'])if(Number.isFinite(value[key]))out[key]=Math.max(0,Math.min(100,value[key]));
  return out;
 }
 function withLocalLook(data,owner=session){
  if(!local||!owner)return data;
  try{const saved=localLookSettings(JSON.parse(localStorage.getItem(localLookKey(owner.workerId))||'{}'));return {...data,settings:{...saved,...data.settings}};}catch(_){return data;}
 }
 function saveLocalLook(op){
  if(!local||!session)return;
  try{
   const key=localLookKey(session.workerId);
   if(op.type==='reset-look'){localStorage.removeItem(key);return;}
   if(op.type!=='settings')return;
   const saved=localLookSettings(JSON.parse(localStorage.getItem(key)||'{}'));
   localStorage.setItem(key,JSON.stringify({...saved,...localLookSettings(op.settings)}));
  }catch(_){status('Pārlūks nevar saglabāt lokālo izskatu.');}
 }
 const pendingKey=id=>'minka:media-pending:'+id;
 function persistQueue(){if(session)try{localStorage.setItem(pendingKey(session.workerId),JSON.stringify(queue));}catch(_){status('Pārlūks nevar saglabāt gaidošās izmaiņas.');}}
 async function api(path,data={},auth=session){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{
   const r=await fetch(API+'/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,...(auth?{sessionToken:auth.sessionToken}:{})}),signal:ctrl.signal,cache:'no-store'});
   let out;try{out=await r.json();}catch(_){throw new Error('Profila serveris nav pieejams.');}
   if(!r.ok)throw Object.assign(new Error(out.error||'Neizdevās saglabāt.'),{status:r.status});
   return out;
  }finally{clearTimeout(timer);}
 }
 function emit(){
  exitTrigger.hidden=!session;trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded',String(dialog.open));
  trigger.replaceChildren();if(session)trigger.append(avatar(session.name));
  const label=document.createElement('span');label.textContent=session?'Radio '+pretty(session.name).split(' ')[0]:'Ielogoties';trigger.append(label);

  const brand=document.querySelector('#radioWindow .brand-text');if(brand){brand.textContent=session?'RADIO '+pretty(session.name).split(' ')[0].toLocaleUpperCase('lv-LV'):'RG RADIO';brand.hidden=!!session;}
  trigger.setAttribute('aria-description',session?'Tavs radio profils':'Saglabā savas iecienītās stacijas un radio izskatu.');
  trigger.title=session?'Atvērt profilu':'Saglabā savas iecienītās stacijas un radio izskatu.';
  document.dispatchEvent(new CustomEvent('media-profile-change',{detail:{session:session?{name:session.name,workerId:session.workerId}:null,radio}}));
 }
 function applyOperation(data,op){
  const n={...data,favorites:[...(data.favorites||[])],settings:{...(data.settings||{})}};
  if(op.type==='favorite-add'&&!n.favorites.includes(op.id))n.favorites.push(op.id);
  if(op.type==='favorite-remove')n.favorites=n.favorites.filter(id=>id!==op.id);
  if(op.type==='favorite-move'&&n.favorites.includes(op.id)){n.favorites=n.favorites.filter(id=>id!==op.id);const at=n.favorites.indexOf(op.before);n.favorites.splice(at<0?n.favorites.length:at,0,op.id);}
  if(op.type==='station')n.lastStation=op.id;
  if(op.type==='settings')n.settings={...n.settings,...op.settings};
  if(op.type==='reset-look')n.settings={};
  return n;
 }
 async function flush(){
  if(session&&!checkSessionDeadline())return;
  if(flushing||!session||!queue.length||!navigator.onLine)return;
  flushing=true;const gen=generation,owner=session;
  try{
   while(queue.length&&gen===generation){
    const op=queue[0];status('Saglabā…');
    const result=await api('radio/change',{operation:op},owner);
    if(gen!==generation||!checkSessionDeadline())return;
    queue.shift();persistQueue();radio=queue.reduce(applyOperation,withLocalLook(result.data,owner));emit();
   }
   if(gen===generation)status('Saglabāts');
  }catch(e){
   if(gen!==generation)return;
   if(e.status===401){await logout(false);status('Sesija beigusies. Ielogojies vēlreiz; izmaiņas gaidīs tavu profilu.');}
   else status('Gaida savienojumu. '+(e.status?e.message:'Mēģināsim vēlreiz, atverot profilu.'));
  }finally{flushing=false;if(gen!==generation&&session&&queue.length)void flush();}
 }
 function change(op){
  if(session&&!checkSessionDeadline())return false;
  if(!session){open();status('Ielogojies, lai saglabātu savā profilā.');return false;}
  if(!loaded){status('Vispirms jāielādē profils.');return false;}
  saveLocalLook(op);queue.push(op);radio=applyOperation(radio,op);persistQueue();emit();void flush();return true;
 }
 function applyLook(){
  if(!window.rgTheme)return;
  window.rgTheme.applyProfile(radio.settings);
  const imageCrops=window.rgTheme.snapshot()?.imageCrops;
  if(!radio.settings.imageCrops&&imageCrops&&Object.keys(imageCrops).length)change({type:'settings',settings:{imageCrops}});
 }
 function recoveryNotice(code){if(!code)return;$('mediaRecoveryCode').textContent=code.match(/.{1,4}/g).join('-');$('mediaRecoveryNotice').hidden=false;}
 let favoriteStartGeneration=0;
 function startProfileFavorite(){
  if(!favoriteStartGeneration||favoriteStartGeneration!==generation||!session||!loaded)return;
  if(!radio.favorites.length){favoriteStartGeneration=0;return;}
  if(window.rgStations?.startFavorite?.(radio.favorites))favoriteStartGeneration=0;
 }
 window.addEventListener('rg-stations-ready',startProfileFavorite);
 async function adopt(next,startFavorite=false){
  next={...next,dutyEndsAt:Math.min(Number(next.dutyEndsAt)||nextDutyBoundary(),nextDutyBoundary())};
  if(Date.now()>=Math.min(next.expiresAt,next.dutyEndsAt)){sessionStorage.removeItem(KEY);void api('logout',{},next).catch(()=>{});status('Maiņa vai sesija beigusies. Ielogojies savā profilā.');return;}
  // A valid session follows real duty time, not the calendar day being viewed.
  const gen=++generation;selected=null;recovering=false;loaded=false;session=next;
  if(!guestLook&&window.rgTheme)guestLook=window.rgTheme.captureGuest?.()||window.rgTheme.snapshot();
  try{sessionStorage.setItem(KEY,JSON.stringify(next));}catch(_){}
  armSessionDeadline();
  try{queue=JSON.parse(localStorage.getItem(pendingKey(next.workerId))||'[]');if(!Array.isArray(queue))queue=[];}catch(_){queue=[];}
  radio={favorites:[],settings:{},lastStation:''};emit();status('Ielādē profilu…');
  try{
   const result=await api('radio/load',{},next);if(gen!==generation||!checkSessionDeadline())return;
   radio=queue.reduce(applyOperation,withLocalLook(result.data,next));loaded=true;applyLook();emit();if(startFavorite){favoriteStartGeneration=gen;startProfileFavorite();}if(dialog.open)renderLogged();void flush();status(queue.length?'Gaida saglabāšanu':'Profils ielādēts');
  }catch(e){if(gen===generation){status(e.message);if(dialog.open)renderLogged();}}
 }
 async function logout(revoke=true){
  endTour();editingFavorites=false;favoriteUndo=null;const old=session;persistQueue();generation++;session=null;loaded=false;queue=[];radio={favorites:[],settings:{},lastStation:''};clearTimeout(expiryTimer);
  $('mediaRecoveryCode').textContent='';$('mediaRecoveryNotice').hidden=true;
  sessionStorage.removeItem(KEY);if(guestLook){if(window.rgTheme?.restoreGuest)window.rgTheme.restoreGuest(guestLook);else window.rgTheme?.applyProfile(guestLook);guestLook=null;}emit();
  if(revoke&&old)void api('logout',{},old).catch(()=>{});
  if(dialog.open)renderWorkers();
 }
 function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);return b;}
 function icon(kind){
  const paths={exit:'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M10 12h10m-4-4 4 4-4 4',look:'m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',help:'M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',play:'m9 5 11 7-11 7V5Z',star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',close:'m7 7 10 10M17 7 7 17'};
  const el=document.createElement('span');el.className='media-icon';el.setAttribute('aria-hidden','true');
  el.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="'+paths[kind]+'" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';return el;
 }
 function setHeading(name){
  dialog.classList.toggle('is-logged',!!name);$('mediaProfileTitle').textContent=name?pretty(name):'Ielogoties';
  $('mediaDate').hidden=!!name;const pic=$('mediaProfileAvatar');pic.replaceChildren();pic.hidden=!name;if(name)pic.append(avatar(name));
 }
 function showStations(){dialog.close();$('radioSourceBroadcast')?.click();document.querySelector('#radioWindow .station-btn')?.click();}
 function renderLogged(){
  if(!session)return;setHeading(session.name);const host=$('mediaContent'),scroll=host.querySelector('.media-favorite-list')?.scrollTop||0,focusLabel=document.activeElement?.getAttribute('aria-label');host.replaceChildren();
  const actions=document.createElement('div');actions.className='media-shortcuts';
  function shortcut(kind,title,subtitle,action){const b=button('',action),copy=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=title;small.textContent=subtitle;copy.append(strong,small);b.append(icon(kind),copy);return b;}
  actions.append(shortcut('look','Radio izskats','Fons un krāsas',()=>{dialog.close();$('radioSourceBroadcast')?.click();$('themeBtn')?.click();}),shortcut('help','Pamācība','Parādi pie pogām',()=>{dialog.close();void startTour();}));host.append(actions);
  if(!loaded)host.append(button('Mēģināt ielādēt vēlreiz',()=>adopt(session)));
  const section=document.createElement('section');section.className='media-favorites';const head=document.createElement('div');head.className='media-section-head';
  const heading=document.createElement('h3');heading.textContent='Favorīti';if(radio.favorites.length){const count=document.createElement('span');count.className='media-favorite-count';count.textContent=String(radio.favorites.length);heading.append(count);}head.append(heading);
  if(radio.favorites.length){const edit=button(editingFavorites?'Gatavs':'Pārkārtot',()=>{editingFavorites=!editingFavorites;renderLogged();});edit.setAttribute('aria-pressed',String(editingFavorites));head.append(edit);}
  section.append(head);const catalog=window.rgStations?.list()||[],list=document.createElement('div');list.className='media-favorite-list';
  if(!radio.favorites.length){const p=document.createElement('p');p.className='media-empty';p.textContent='Tavas stacijas būs šeit. Pievieno tās ar zvaigznīti staciju sarakstā.';list.append(p);}
  radio.favorites.forEach((id,i)=>{
   const station=catalog.find(s=>s.key===id),title=station?.title||id.replace(/^[^:]+:/,''),line=document.createElement('div');line.className='media-favorite';
   const play=button('',()=>{if(station)window.rgStations.play(id);});play.title='Atskaņot '+title;play.setAttribute('aria-label','Atskaņot '+title);const name=document.createElement('span');name.textContent=title;play.append(icon('play'),name);line.append(play);
   if(editingFavorites){
    const up=button('↑',()=>{if(change({type:'favorite-move',id,before:radio.favorites[i-1]}))renderLogged();});up.setAttribute('aria-label','Pārvietot augstāk '+title);up.title='Augstāk';up.disabled=i===0;
    const down=button('↓',()=>{if(change({type:'favorite-move',id,before:radio.favorites[i+2]||''}))renderLogged();});down.setAttribute('aria-label','Pārvietot zemāk '+title);down.title='Zemāk';down.disabled=i===radio.favorites.length-1;
    const remove=button('',()=>{const before=radio.favorites[i+1]||'';if(change({type:'favorite-remove',id})){favoriteUndo={id,title,before};renderLogged();}});remove.append(icon('close'));remove.setAttribute('aria-label','Noņemt '+title);remove.title='Noņemt no favorītiem';line.append(up,down,remove);
   }list.append(line);
  });
  section.append(list);const add=button('Atvērt staciju sarakstu',showStations);add.className='media-stations-link';add.prepend(icon('star'));section.append(add);host.append(section);
  if(favoriteUndo){const undo=document.createElement('div');undo.className='media-undo';const copy=document.createElement('span');copy.textContent=favoriteUndo.title+' noņemta';undo.append(copy,button('Atjaunot',()=>{const item=favoriteUndo;if(change({type:'favorite-add',id:item.id})){change({type:'favorite-move',id:item.id,before:item.before});favoriteUndo=null;renderLogged();}}));host.append(undo);}
  const footer=document.createElement('div');footer.className='media-account-actions';footer.append(button('Mainīt profilu',()=>logout()));const exit=button('Iziet',()=>{void logout();dialog.close();trigger.focus();});exit.prepend(icon('exit'));footer.append(exit);host.append(footer);list.scrollTop=scroll;
  if(focusLabel)host.querySelectorAll('button[aria-label]').forEach(b=>{if(b.getAttribute('aria-label')===focusLabel)b.focus({preventScroll:true});});
 }
 async function renderWorkers(){
  setHeading(null);const gen=generation;selected=null;recovering=false;const {date,workers}=roster();rosterDate=date;$('mediaDate').textContent=date?'Izvēlētā diena '+date:'Izvēlētās dienas darbinieki';
  const host=$('mediaContent');host.replaceChildren();status('Izvēlies savu vārdu. Radio var klausīties arī bez profila.');
  if(!workers.length){status('Izvēlies kalendārā dienu ar darbiniekiem.');return;}
  const grid=document.createElement('div');grid.className='media-workers';host.append(grid);
  for(const worker of workers){
   const b=button('',async()=>{
    if(busy)return;busy=true;b.disabled=true;status('Pārbauda profilu…');
    $('mediaRecoveryCode').textContent='';$('mediaRecoveryNotice').hidden=true;
    try{const data=await api('pin-status',{name:worker.name},null);if(gen!==generation||session)return;selected={...worker,...data};renderPin();}
    catch(e){status(e.message);}finally{busy=false;b.disabled=false;}
   });
   const picture=avatar(worker.name);
   const copy=document.createElement('span');copy.className='media-worker-copy';const first=document.createElement('strong'),last=document.createElement('small');const parts=pretty(worker.name).split(' ');first.textContent=parts.shift();last.textContent=parts.join(' ');copy.append(first,last);
   b.append(picture,copy);b.setAttribute('aria-label',pretty(worker.name));grid.append(b);
  }
 }
 function renderPin(){
  const host=$('mediaContent');host.replaceChildren();const h=document.createElement('h3');h.className='media-person-heading';h.append(avatar(selected.name),document.createTextNode(pretty(selected.name)));host.append(h);
  const form=document.createElement('form');form.className='media-pin';host.append(form);
  const makeField=(label,type,id,max)=>{const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.id=id;input.type=type;input.required=true;input.maxLength=max;input.autocomplete=type==='password'?'off':'one-time-code';if(type==='password'){input.inputMode='numeric';input.pattern=recovering||!selected.hasPin?'[0-9]{6}':'[0-9]{4,8}';}l.append(input);form.append(l);return input;};
  if(recovering)makeField('Atkopšanas kods','text','mediaRecoveryInput',40);
  const pin=makeField(recovering?'Jauns 6 ciparu PIN':selected.hasPin?'Tavs PIN':'Izveido 6 ciparu PIN','password','mediaPin',recovering||!selected.hasPin?6:8);
  if(recovering||!selected.hasPin)makeField('Atkārto PIN','password','mediaConfirm',6);
  const submit=document.createElement('button');submit.type='submit';submit.textContent=recovering?'Atjaunot PIN':selected.hasPin?'Ielogoties':'Izveidot profilu';form.append(submit);
  form.append(button('Atpakaļ',()=>renderWorkers()));
  if(!recovering&&selected.hasPin)form.append(button('Aizmirsi PIN?',()=>{recovering=true;renderPin();status('Ievadi saglabāto atkopšanas kodu. Ja tas pazudis, sazinies ar administratoru.');}));
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;const worker=selected,gen=generation;busy=true;submit.disabled=true;
   const data={name:worker.name,pin:pin.value,confirm:$('mediaConfirm')?.value,createPin:!worker.hasPin,recoveryCode:$('mediaRecoveryInput')?.value};
   if((recovering||!worker.hasPin)&&data.pin!==data.confirm){status('PIN atkārtojums nesakrīt.');busy=false;submit.disabled=false;return;}
   try{
    status('Pārbauda…');const result=await api(recovering?'recover':'login',data,null);if(gen!==generation)return;
    if(recovering){recovering=false;selected.hasPin=true;renderPin();status('PIN atjaunots. Tagad ielogojies ar jauno PIN.');recoveryNotice(result.recoveryCode);}
    else{await adopt(result.session,true);recoveryNotice(result.recoveryCode);if(!result.recoveryCode&&session){dialog.close();startTour();}}
   }catch(e){if(gen===generation)status(e.message);}finally{busy=false;submit.disabled=false;pin.value='';const c=$('mediaConfirm');if(c)c.value='';}
  });status(recovering?'Atjaunošana nemaina tavas dziesmas un favorītus.':selected.hasPin?'Ievadi savu PIN.':'Izveido PIN, lai saglabātu savas stacijas un izskatu.');pin.focus();
 }
 // Load local UI helpers only when needed. Positioning observers run only while open.
 const assets=new Map();
 function loadAsset(src,css=false){
  if(assets.has(src))return assets.get(src);
  const task=new Promise((resolve,reject)=>{const el=document.createElement(css?'link':'script');if(css){el.rel='stylesheet';el.href=src;}else{el.src=src;el.async=true;}
   el.onload=resolve;el.onerror=()=>{assets.delete(src);el.remove();reject(new Error('Neizdevās ielādēt pamācību. Mēģini vēlreiz.'));};document.head.append(el);
  });assets.set(src,task);return task;
 }
 let tour=null,tourGeneration=0,tourObserver=null;
 function endTour(){tourGeneration++;tourObserver?.disconnect();tourObserver=null;const old=tour;tour=null;old?.destroy();}
 function radioVisible(){return !document.hidden&&!document.body.classList.contains('radio-hidden')&&!document.body.classList.contains('radio-idle')&&!$('radioWindow')?.classList.contains('music-source');}
 async function startTour(){
  if(!session)return;endTour();$('radioSourceBroadcast')?.click();const gen=tourGeneration;
  try{
   await Promise.all([loadAsset('vendor/driver/1.8.0/driver.js.iife.js'),loadAsset('vendor/driver/1.8.0/driver.css',true)]);
   if(gen!==tourGeneration||!session||!radioVisible())return;
   const steps=[
    {element:'#themeBtn',popover:{title:'Tavs radio izskats',description:'Izvēlies fonu un krāsas. Poga Kā mana kartīte pārņem tavas kartītes izskatu.',side:'top',align:'start'}},
    {element:'#radioWindow .station-btn',popover:{title:'Tavas iecienītās stacijas',description:'Atver staciju sarakstu un nospied zvaigznīti. Stacija paliks tavos Favorītos.',side:'top',align:'end'}},
    {element:'#mediaProfileButton',popover:{title:'Tavs profils',description:'Šeit ir tavi favorīti un izskats. Ar Pārkārtot vari mainīt staciju secību.',side:'top',align:'end'}},
    {element:'#mediaLogoutButton',popover:{title:'Pirms dodies prom',description:'Kad beidz klausīties, neaizmirsti iziet no sava profila. Tavi favorīti un radio izskats paliks saglabāti.',side:'top',align:'end'}}
   ].filter(step=>document.querySelector(step.element)?.getClientRects().length);
   if(!steps.length)return;
   const animate=!matchMedia('(prefers-reduced-motion: reduce)').matches&&(navigator.hardwareConcurrency||8)>4;
   tour=window.driver.js.driver({steps,animate,duration:180,smoothScroll:false,allowClose:true,disableActiveInteraction:true,overlayOpacity:.42,stagePadding:5,stageRadius:12,popoverClass:'media-radio-tour',showProgress:true,progressText:'{{current}} no {{total}}',nextBtnText:'Tālāk',prevBtnText:'Atpakaļ',doneBtnText:'Gatavs',onPopoverRender:popover=>{popover.closeButton.setAttribute('aria-label','Aizvērt pamācību');},onDestroyed:()=>{tour=null;tourObserver?.disconnect();tourObserver=null;}});
   tourObserver=new MutationObserver(()=>{if(!radioVisible())endTour();});tourObserver.observe(document.body,{attributes:true,attributeFilter:['class']});tourObserver.observe($('radioWindow'),{attributes:true,attributeFilter:['class']});tour.drive();
  }catch(e){if(gen===tourGeneration&&session){open();status(e.message);}}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)endTour();});
 let floatingCleanup=null,fallbackObserver=null,positionGeneration=0;
 async function attachPositioning(){
  const gen=++positionGeneration;
  try{
   await loadAsset('vendor/floating-ui/core-1.8.0/floating-ui.core.umd.min.js');
   await loadAsset('vendor/floating-ui/dom-1.8.0/floating-ui.dom.umd.min.js');
   if(!dialog.open||gen!==positionGeneration)return;
   const {computePosition,offset,flip,shift,autoUpdate}=window.FloatingUIDOM;
   fallbackObserver?.disconnect();fallbackObserver=null;floatingCleanup?.();floatingCleanup=autoUpdate(trigger,dialog,()=>{
    computePosition(trigger,dialog,{placement:'top-end',strategy:'fixed',middleware:[offset(10),flip({padding:12}),shift({padding:12,crossAxis:true})]}).then(({x,y})=>{if(dialog.open&&gen===positionGeneration){dialog.style.left=x+'px';dialog.style.top=y+'px';}});
   },{animationFrame:false,layoutShift:false});
  }catch(_){positionDialog();}
 }
 function positionDialog(){
  if(!dialog.open||floatingCleanup)return;
  const anchor=trigger.getBoundingClientRect(),rect=dialog.getBoundingClientRect();
  const left=Math.max(12,Math.min(innerWidth-rect.width-12,anchor.right-rect.width));
  const top=Math.max(12,Math.min(innerHeight-rect.height-12,anchor.top-rect.height-10));
  dialog.style.left=left+'px';dialog.style.top=top+'px';
 }
 function open(){checkSessionDeadline();endTour();if(session){renderLogged();void flush();}else void renderWorkers();if(!dialog.open){dialog.showModal();trigger.setAttribute('aria-expanded','true');fallbackObserver=new ResizeObserver(positionDialog);fallbackObserver.observe(dialog);positionDialog();void attachPositioning();}}
 window.addEventListener('resize',positionDialog,{passive:true});
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{positionGeneration++;floatingCleanup?.();floatingCleanup=null;fallbackObserver?.disconnect();fallbackObserver=null;trigger.setAttribute('aria-expanded','false');const p=$('mediaPin');if(p)p.value='';const c=$('mediaConfirm');if(c)c.value='';});
 $('mediaRecoveryCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('mediaRecoveryCode').textContent);status('Atkopšanas kods nokopēts.');}catch(_){status('Iezīmē un nokopē redzamo kodu.');}};
 $('mediaRecoveryDone').onclick=()=>{$('mediaRecoveryCode').textContent='';$('mediaRecoveryNotice').hidden=true;if(session){dialog.close();startTour();}};
 const resumeSession=()=>{if(checkSessionDeadline()){armSessionDeadline();void flush();}};
 window.addEventListener('online',resumeSession);
 window.addEventListener('focus',resumeSession);
 window.addEventListener('pageshow',resumeSession);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumeSession();});
 document.addEventListener('pointerdown',checkSessionDeadline,true);
 document.addEventListener('keydown',checkSessionDeadline,true);
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==$('calIframe')?.contentWindow)return;
  if(e.data?.type==='minka-personal-emoji-updated'){emit();return;}
  if(e.data?.type!=='minka-calendar-selected-day-state')return;
  window.__minkaLastSelectedDayState=e.data.payload;
  if(session&&!checkSessionDeadline())return;
  const r=roster();
  const selectionChanged=(rosterDate&&r.date!==rosterDate)||(selected&&!r.workers.some(w=>norm(w.name)===norm(selected.name)));
  if(selectionChanged&&!session){generation++;busy=false;selected=null;}rosterDate=r.date;
  if(!session&&dialog.open&&!busy&&!selected)void renderWorkers();
 });
 window.__mkUnifiedMedia={open,logout,change,getSession:()=>session,isLoaded:()=>loaded,getRadio:()=>radio,api,roster,refresh:()=>session&&adopt(session)};
 window.addEventListener('rg-theme-ready',()=>{if(session&&loaded){if(!guestLook)guestLook=window.rgTheme.captureGuest?.()||window.rgTheme.snapshot();applyLook();}});
 let saved;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(_){}
 if(saved?.sessionToken&&Math.min(saved.expiresAt,saved.dutyEndsAt||Infinity)>Date.now()){
  const gen=generation;void api('session',{},saved).then(r=>{if(gen===generation&&!session)return adopt({...saved,...r.session},true);}).catch(()=>{if(gen===generation)sessionStorage.removeItem(KEY);});
 }else if(saved?.sessionToken){sessionStorage.removeItem(KEY);void api('logout',{},saved).catch(()=>{});}
})();
