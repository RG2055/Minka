
(function(){
  var isLocal=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||location.protocol==='file:';
  // Local Minka uses the deployed player by default, so it does not depend on
  // a second dev server. Add ?lacLocal=1 only while developing Lācītis itself.
  var useLocalLac=isLocal&&/[?&]lacLocal=1(?:&|$)/.test(location.search);
  var LAC_BASE=useLocalLac?'http://127.0.0.1:5174':new URL('integrations/lacitis/player',location.href).href;
  var LAC_ORIGIN=new URL(LAC_BASE, location.href).origin;
  var MINI_URL=LAC_BASE+'/?embed=mini';
  var frame,cons,stage,deckEl,track,empty,titleEl,artistEl,fillEl,playIco,progEl,searchEl,deckPrev,deckNext;
  var profilePanel,profileStatus,workersEl,pinForm,pinInput,pinConfirm,pinConfirmField,pinSubmit,profileError;
  var loggedOut,loggedIn,libraryEl,favBtn,playlistQuickBtn,favoritesHeaderBtn;
  var lyricsPanel,lyricsBtn,lyricsTitle,lyricsArtist,lyricsBody;
  var soundPanel,soundBtn,soundStatusEl,soundOptions;
  var playlistArea,playlistsEl,playlistToolbar,playlistTitle,playlistNameInput;
  var deck=[], sel=0, curId=null, loaded=false, wired=false;
  var lastNpPayload=null, pendingDeck=null, pendingAppend=[];
  var searchTO=0, openTO=0, pendingSearch=null;
  var nativeFullRequested=false;
  var perfProfile=window.__mkPerfProfile||{};
  var lowSpec=!!(perfProfile.lowSpec||perfProfile.reducedMotion||document.documentElement.classList.contains('mk-low-spec'));
  var bridgeReady=false;
  var morePending=false, moreCooldownUntil=0, DECK_CAP=lowSpec?16:32;
  var pendingCommands=[];
  var profileState={session:null,workers:[],favoriteIds:[],playlists:[],counts:{favorites:0,history:0,playlists:0}};
  var soundState={profile:'off',supported:true,active:false,error:''};
  var selectedWorker=null,profileSection='favorites',profileLibrary=[],selectedPlaylistId=null,pendingPlaylistTrack=null;
  var metaCache={},metaCacheKeys=[],lyricsCache={},activeLyrics=null,activeLyricIndex=-1;

  function $(id){ return document.getElementById(id); }
  function els(){
    frame=$('lacMiniFrame'); cons=$('lacMiniConsole'); stage=$('lacMiniStage');
    deckEl=$('lacMiniDeck'); track=$('lacMiniTrack'); empty=$('lacMiniEmpty');
    titleEl=$('lacMiniTitle'); artistEl=$('lacMiniArtist'); fillEl=$('lacMiniProgFill');
    playIco=$('lacMiniPlayIco'); progEl=$('lacMiniProg'); searchEl=$('lacMiniSearch');
    deckPrev=$('lacMiniDeckPrev'); deckNext=$('lacMiniDeckNext');
    profilePanel=$('lacMiniProfilePanel'); profileStatus=$('lacMiniProfileStatus');
    workersEl=$('lacMiniWorkers'); pinForm=$('lacMiniPinForm'); pinInput=$('lacMiniPin');
    pinConfirm=$('lacMiniPinConfirm'); pinConfirmField=$('lacMiniPinConfirmField'); pinSubmit=$('lacMiniPinSubmit');
    profileError=$('lacMiniProfileError'); loggedOut=$('lacMiniLoggedOut'); loggedIn=$('lacMiniLoggedIn');
    libraryEl=$('lacMiniLibrary'); favBtn=$('lacMiniFavBtn'); playlistQuickBtn=$('lacMiniPlaylistBtn'); favoritesHeaderBtn=$('lacMiniFavoritesBtn');
    lyricsPanel=$('lacMiniLyricsPanel'); lyricsBtn=$('lacMiniLyricsBtn'); lyricsTitle=$('lacMiniLyricsTitle');
    lyricsArtist=$('lacMiniLyricsArtist'); lyricsBody=$('lacMiniLyricsBody');
    soundPanel=$('lacMiniSoundPanel'); soundBtn=$('lacMiniSoundBtn');
    soundStatusEl=$('lacMiniSoundStatus'); soundOptions=$('lacMiniSoundOptions');
    playlistArea=$('lacMiniPlaylistArea'); playlistsEl=$('lacMiniPlaylists'); playlistToolbar=$('lacMiniPlaylistToolbar');
    playlistTitle=$('lacMiniPlaylistTitle'); playlistNameInput=$('lacMiniPlaylistName');
  }
  function send(cmd,extra){
    if(!bridgeReady&&cmd==='search'){ pendingSearch=(extra&&extra.q)||''; return; }
    if(!bridgeReady){ pendingCommands.push({cmd:cmd,extra:extra||{}}); return; }
    try{ frame&&frame.contentWindow&&frame.contentWindow.postMessage(Object.assign({type:'lac_mini_cmd',cmd:cmd},extra||{}),LAC_ORIGIN); }catch(e){}
  }
  function profileIsOpen(){ return !!(profilePanel&&profilePanel.classList.contains('open')); }
  function soundIsOpen(){ return !!(soundPanel&&soundPanel.classList.contains('open')); }
  function soundLabel(profile){
    return {off:'Oriģināls',surround:'Virtual Surround',speakers:'Mazās tumbas',night:'Nakts'}[profile]||'Oriģināls';
  }
  function applySoundState(data){
    els();
    soundState=Object.assign({},soundState,data||{});
    if(!soundState.profile) soundState.profile='off';
    if(soundOptions){
      var options=soundOptions.querySelectorAll('.lms-option');
      for(var i=0;i<options.length;i++){
        var profile=options[i].getAttribute('data-sound');
        options[i].classList.toggle('active',profile===soundState.profile);
        options[i].disabled=soundState.supported===false&&profile!=='off';
      }
    }
    if(soundPanel){
      soundPanel.dataset.profile=soundState.profile;
      soundPanel.dataset.active=soundState.active?'1':'0';
      soundPanel.dataset.context=soundState.contextState||'not-created';
      soundPanel.dataset.width=String(Number(soundState.width||0));
      soundPanel.dataset.lowGain=String(Number(soundState.lowGain||0));
      soundPanel.dataset.voiceGain=String(Number(soundState.voiceGain||0));
      soundPanel.dataset.airGain=String(Number(soundState.airGain||0));
      soundPanel.dataset.masterGain=String(Number(soundState.masterGain||1));
    }
    if(soundBtn){
      var enhanced=soundState.profile!=='off';
      var label=soundLabel(soundState.profile);
      soundBtn.classList.toggle('active',enhanced);
      soundBtn.title='Skaņa: '+label;
      soundBtn.setAttribute('aria-label','Skaņa: '+label);
    }
    if(soundStatusEl){
      if(soundState.error) soundStatusEl.textContent='Nav pieejams';
      else if(soundState.supported===false) soundStatusEl.textContent='Pārlūks neatbalsta';
      else if(soundState.profile==='off') soundStatusEl.textContent='Native Web Audio • izslēgts';
      else if(soundState.active) soundStatusEl.textContent='Web Audio • aktīvs';
      else soundStatusEl.textContent='Web Audio • gaida Play';
    }
  }
  function todayWorkers(){
    var names=[];
    try{ if(typeof window.__lacitisTodayWorkers==='function') names=window.__lacitisTodayWorkers()||[]; }catch(e){}
    if(!names.length){
      try{
        var state=window.__minkaLastSelectedDayState||null;
        var rg=Array.isArray(state&&state.rg)?state.rg:[];
        var live=rg.filter(function(worker){return worker&&worker.name&&!worker.done;});
        names=(live.length?live:rg).map(function(worker){return worker&&worker.name;}).filter(Boolean);
      }catch(e){}
    }
    return names.map(function(name,index){
      var slug=String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'worker';
      return {id:'minka-'+slug+'-'+index,name:String(name||''),shift:'Dežūra'};
    }).filter(function(worker){return worker.name;});
  }
  function cleanMusicTrack(item){
    item=item||{};
    var rawTitle=String(item.title||'').replace(/\s+/g,' ').trim();
    var rawAuthor=String(item.author||'').replace(/\s+/g,' ').trim();
    var cacheKey=rawAuthor+'\u0000'+rawTitle;
    var cached=metaCache[cacheKey];
    if(!cached){
      var title=rawTitle;
      var author=rawAuthor.replace(/\s+-\s+Topic\s*$/i,'').replace(/\s+VEVO\s*$/i,'').trim();
      var generic=/^(?:worldstar(?:hiphop)?|wshh|lyrical lemonade|trap nation|chill nation|rap nation|wave music|cloudkid|7clouds|proximity|majestic casual|mrsuicidesheep|selected|various artists)$/i;
      title=title.replace(/\b(?:official(?:\s+music)?\s+video|music\s+video|official\s+audio|lyrics?\s+video|visuali[sz]er)\b/gi,' ');
      title=title.replace(/\s*[\[(][^\])]{0,180}(?:official|music\s+video|lyrics?|visuali[sz]er|wshh\s+exclusive|audio\s+only|premiere|\b(?:audio|video|4k|hd|hq)\b)[^\])]{0,180}[\])]\s*/gi,' ');
      title=title.replace(/\s*(?:[-–—|•]\s*)?(?:official(?:\s+music)?\s+(?:video|audio)|music\s+video|official\s+(?:video|audio)|lyrics?(?:\s+video)?|visuali[sz]er|wshh\s+exclusive|audio\s+only|premiere|\b(?:4k|hd|hq)\b)\s*$/gi,' ');
      title=title.replace(/\s+/g,' ').trim();
      var quoted=title.match(/^(.{2,80}?)\s+["“”]([^"“”]{1,180})["“”](?:\s|$)/);
      if(quoted){ author=quoted[1].trim(); title=quoted[2].trim(); }
      else{
        var split=title.match(/^(.{2,90}?)\s+[-–—]\s+(.{1,200})$/);
        if(split){
          var inferred=split[1].trim(); title=split[2].trim();
          if(!author||generic.test(author)||author.toLowerCase().indexOf(inferred.toLowerCase())>=0) author=inferred;
        }
      }
      title=title.replace(/\s*[\[(]\s*[\])]\s*$/,'').replace(/^[\s"“”]+|[\s"“”]+$/g,'').replace(/\s+/g,' ').trim();
      if(generic.test(author)){
        var originalSplit=rawTitle.match(/^(.{2,90}?)\s+[-–—]\s+/);
        if(originalSplit) author=originalSplit[1].trim();
      }
      cached={title:title||rawTitle||'Nezināma dziesma',author:author||rawAuthor};
      metaCache[cacheKey]=cached; metaCacheKeys.push(cacheKey);
      if(metaCacheKeys.length>128) delete metaCache[metaCacheKeys.shift()];
    }
    return Object.assign({},item,cached);
  }
  function coverUrl(t){ return 'https://i.ytimg.com/vi/'+encodeURIComponent(t.id)+'/default.jpg'; }
  function isLowSpec(){ return lowSpec||document.documentElement.classList.contains('mk-low-spec')||!!(document.body&&document.body.classList.contains('mk-low-spec')); }
  function updateDeckNav(){
    if(!deckEl||!deckPrev||!deckNext) return;
    var max=Math.max(0,deckEl.scrollWidth-deckEl.clientWidth);
    deckPrev.disabled=deckEl.scrollLeft<=4;
    deckNext.disabled=max<=4||deckEl.scrollLeft>=max-4;
  }
  function unloadFrame(){
    if(!frame) return;
    frame.src='about:blank'; frame.removeAttribute('src'); loaded=false;
    if($('radioMusicStatus')) $('radioMusicStatus').textContent='';
    if($('lacMiniPlay')) $('lacMiniPlay').disabled=false;
    bridgeReady=false;
    deck=[]; pendingDeck=null; pendingAppend=[]; curId=null; lastNpPayload=null;
    pendingCommands=[]; profileLibrary=[]; activeLyrics=null; activeLyricIndex=-1;
    if(track) track.innerHTML='';
    if(empty){ empty.style.display=''; empty.textContent='Ielādē mūziku…'; }
    if(deckPrev) deckPrev.disabled=true;
    if(deckNext) deckNext.disabled=true;
    if(lyricsPanel){ lyricsPanel.classList.remove('open'); lyricsPanel.setAttribute('aria-hidden','true'); }
    if(soundPanel){ soundPanel.classList.remove('open'); soundPanel.setAttribute('aria-hidden','true'); }
    if(soundBtn) soundBtn.setAttribute('aria-expanded','false');
  }
  function ensureFrame(){
    if(loaded||!frame) return;
    frame.src=MINI_URL; loaded=true;
  }
  function sync(){
    if(document.body) document.body.classList.toggle('lacitis-docked',dockVisible());
    try{ if(typeof syncShellLayout==='function') syncShellLayout(); }catch(e){}
    try{ if(typeof updateBuddyUiSuppression==='function') updateBuddyUiSuppression(); }catch(e){}
  }
  function dockVisible(){ return !!(cons&&cons.classList.contains('docked')); }
  function uiVisible(){ return dockVisible()||!!(stage&&stage.classList.contains('full')); }
  function setDockButton(open){
    var btn=$('lacitisDockBtn'); if(!btn) return;
    btn.classList.toggle('lacitis-open',!!open);
    btn.setAttribute('aria-expanded',open?'true':'false');
  }
  function setFullShell(full){
    if(document.body) document.body.classList.toggle('lacitis-full',!!full);
    var calendar=$('calendarEmbed');
    if(calendar){ calendar.setAttribute('aria-hidden',full?'true':'false'); calendar.inert=!!full; }
  }
  function enterNativeFullscreen(){
    if(!stage||!stage.requestFullscreen||document.fullscreenElement) return;
    nativeFullRequested=true;
    try{
      var request=stage.requestFullscreen({navigationUI:'hide'});
      if(request&&request.catch) request.catch(function(){ nativeFullRequested=false; });
    }catch(e){ nativeFullRequested=false; }
  }
  function leaveNativeFullscreen(){
    nativeFullRequested=false;
    if(document.fullscreenElement===stage&&document.exitFullscreen){
      try{ var exit=document.exitFullscreen(); if(exit&&exit.catch) exit.catch(function(){}); }catch(e){}
    }
  }
  var lastNpId=null;
  function showLabel(i){
    var t=cleanMusicTrack(deck[i]); if(!t||!titleEl) return;
    titleEl.textContent=t.title||'—'; titleEl.title=t.title||'';
    artistEl.textContent=t.author||''; artistEl.title=t.author||'';
  }
  function selectIdx(i,scroll){
    if(!deck.length||!track) return;
    sel=Math.max(0,Math.min(deck.length-1,i));
    for(var n=0;n<track.children.length;n++) track.children[n].classList.toggle('active',n===sel);
    showLabel(sel);
    var card=track.children[sel];
    if(scroll&&card) card.scrollIntoView({behavior:isLowSpec()?'auto':'smooth',block:'nearest',inline:'center'});
  }
  function maybeMore(){
    if(morePending||deck.length>=DECK_CAP||Date.now()<moreCooldownUntil) return;
    morePending=true;
    send('more',{ids:deck.map(function(t){return t.id;})});
    setTimeout(function(){ morePending=false; },9000);
  }
  function playIdx(i){
    if(!deck.length) return;
    var t=deck[i]; if(!t) return;
    // Send the whole deck as the queue so playback auto-advances (YouTube/Spotify style).
    var list=deck.map(function(x){ return {id:x.id,title:x.title,author:x.author,thumbnail:x.thumbnail}; });
    send('play',{id:t.id,index:i,list:list});
  }

  function durationText(t){
    if(t&&typeof t.duration==='string'&&t.duration) return t.duration;
    var seconds=Number(t&&t.lengthSeconds||0);
    if(!seconds) return '';
    var minutes=Math.floor(seconds/60), rest=Math.floor(seconds%60);
    return minutes+':'+String(rest).padStart(2,'0');
  }

  function addCover(t,i){
    t=cleanMusicTrack(t);
    var c=document.createElement('button'); c.type='button'; c.className='lm-cover';
    c.setAttribute('aria-label','Atskaņot '+(t.title||'dziesmu'));
    var img=document.createElement('img'); img.loading='lazy'; img.decoding='async'; img.src=coverUrl(t);
    img.alt='';
    img.onerror=function(){ this.onerror=null; this.src='https://lacitis.pages.dev/logo192.png'; };
    c.appendChild(img);
    var copy=document.createElement('span'); copy.className='lm-cover-copy';
    var title=document.createElement('span'); title.className='lm-cover-title'; title.textContent=t.title||'Nezināma dziesma'; title.title=t.title||'';
    var artist=document.createElement('span'); artist.className='lm-cover-artist'; artist.textContent=t.author||''; artist.title=t.author||'';
    copy.appendChild(title); copy.appendChild(artist); c.appendChild(copy);
    var time=document.createElement('span'); time.className='lm-cover-time'; time.textContent=durationText(t); c.appendChild(time);
    c.addEventListener('click',function(){ selectIdx(i,false); playIdx(i); });
    track.appendChild(c);
  }
  function appendDeck(tracks){
    morePending=false;
    if(!tracks||!tracks.length){ moreCooldownUntil=Date.now()+30000; return; }
    var have={}; deck.forEach(function(t){ have[t.id]=1; });
    var added=0;
    tracks.forEach(function(t){
      if(!t||!t.id||have[t.id]||deck.length>=DECK_CAP) return;
      t=cleanMusicTrack(t); have[t.id]=1; deck.push(t); addCover(t,deck.length-1); added++;
    });
    if(added){ selectIdx(sel,false); updateDeckNav(); }
  }
  function renderDeck(tracks,query){
    els(); deck=(tracks||[]).slice(0,DECK_CAP).map(cleanMusicTrack);
    track.innerHTML='';
    if(!deck.length){ empty.style.display=''; empty.textContent=query?'Nekas nav atrasts':'Ielādē mūziku…'; updateDeckNav(); return; }
    empty.style.display='none';
    deck.forEach(function(t,i){ addCover(t,i); });
    var start=0;
    if(!query&&curId){ var idx=deck.findIndex(function(t){return t.id===curId;}); if(idx>=0) start=idx; }
    selectIdx(start,false);
    updateDeckNav();
  }
  function setPlayIco(p){ if(playIco) playIco.innerHTML=p?'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>':'<path d="M8 5v14l11-7z"/>'; }
  function applyNp(d){
    els();
    d=cleanMusicTrack(d);
    lastNpPayload=d;
    curId=d.id||null;
    if(!uiVisible()) return;
    fillEl.style.width=((d.pct||0)*100)+'%';
    setPlayIco(!!d.playing);
    var status=$('radioMusicStatus'), play=$('lacMiniPlay');
    if(status){
      var message=d.loading?'Ielādē dziesmu…':(d.message||'');
      if(status.textContent!==message) status.textContent=message;
      status.title=message;
    }
    if(play){ play.disabled=!!d.loading; play.setAttribute('aria-busy',String(!!d.loading)); }

    // Only recenter when the PLAYING track actually changes (e.g. auto-advance),
    // so manual browsing during playback isn't yanked back every tick.
    if(d.id && d.id!==lastNpId){
      lastNpId=d.id;
      var idx=deck.findIndex(function(t){return t.id===d.id;});
      if(idx>=0) selectIdx(idx,true);
      else if(titleEl){
        titleEl.textContent=d.title||'—'; titleEl.title=d.title||'';
        artistEl.textContent=d.author||''; artistEl.title=d.author||'';
      }
      if(lyricsIsOpen()&&(!activeLyrics||activeLyrics.id!==d.id)) requestLyrics(d);
    }
    updateLyricsPosition(Number(d.position||0));
    updateQuickActions();
  }

  function currentTrack(){
    var fromDeck=deck.find(function(item){return item&&item.id===curId;});
    return fromDeck||(lastNpPayload&&lastNpPayload.id?lastNpPayload:null)||deck[sel]||null;
  }
  function lyricsIsOpen(){ return !!(lyricsPanel&&lyricsPanel.classList.contains('open')); }
  function renderLyrics(data){
    if(!data||!data.id||!lyricsBody) return;
    var lyricMeta=cleanMusicTrack({title:data.title,author:data.artist});
    data.title=lyricMeta.title; data.artist=lyricMeta.author;
    lyricsCache[data.id]=data; activeLyrics=data; activeLyricIndex=-1;
    if(lyricsTitle){ lyricsTitle.textContent=data.title||'Dziesmas vārdi'; lyricsTitle.title=data.title||''; }
    if(lyricsArtist){ lyricsArtist.textContent=data.artist||''; lyricsArtist.title=data.artist||''; }
    lyricsBody.innerHTML='';
    if(!Array.isArray(data.lines)||!data.lines.length){
      var state=document.createElement('div'); state.className='lml-state'; state.textContent=data.error||'Šai dziesmai vārdi nav atrasti.';
      lyricsBody.appendChild(state); return;
    }
    var fragment=document.createDocumentFragment();
    data.lines.slice(0,300).forEach(function(line,index){
      var timed=line.time!==null&&line.time!==''&&Number.isFinite(Number(line.time));
      var el=document.createElement(timed?'button':'div');
      if(timed){ el.type='button'; el.dataset.time=String(Number(line.time)); el.title='Pāriet uz šo dziesmas vietu'; }
      el.className='lml-line'; el.dataset.index=String(index); el.textContent=line.text||'';
      fragment.appendChild(el);
    });
    lyricsBody.appendChild(fragment);
    updateLyricsPosition(Number(lastNpPayload&&lastNpPayload.position||0),true);
  }
  function requestLyrics(item){
    item=cleanMusicTrack(item||currentTrack()); if(!item||!item.id) return;
    if(lyricsCache[item.id]){ renderLyrics(lyricsCache[item.id]); return; }
    activeLyrics={id:item.id,title:item.title,artist:item.author,lines:[]}; activeLyricIndex=-1;
    if(lyricsTitle) lyricsTitle.textContent=item.title||'Dziesmas vārdi';
    if(lyricsArtist) lyricsArtist.textContent=item.author||'';
    if(lyricsBody) lyricsBody.innerHTML='<div class="lml-state">Meklē dziesmas vārdus…</div>';
    send('lyrics',{id:item.id,title:item.title,author:item.author,lengthSeconds:item.lengthSeconds||item.duration||0});
  }
  function updateLyricsPosition(position,force){
    if(!lyricsIsOpen()||!activeLyrics||!activeLyrics.synced||!Array.isArray(activeLyrics.lines)||!activeLyrics.lines.length||!lyricsBody) return;
    var lines=activeLyrics.lines,lo=0,hi=lines.length-1,found=-1;
    while(lo<=hi){
      var mid=(lo+hi)>>1,time=Number(lines[mid]&&lines[mid].time);
      if(Number.isFinite(time)&&time<=position+.08){ found=mid; lo=mid+1; }else hi=mid-1;
    }
    if(!force&&found===activeLyricIndex) return;
    if(activeLyricIndex>=0){
      var previous=lyricsBody.querySelector('[data-index="'+activeLyricIndex+'"]');
      if(previous) previous.classList.remove('active');
    }
    activeLyricIndex=found;
    if(found>=0){
      var current=lyricsBody.querySelector('[data-index="'+found+'"]');
      if(current){
        current.classList.add('active');
        current.scrollIntoView({behavior:isLowSpec()?'auto':'smooth',block:'center'});
      }
    }
  }
  window.lacMiniToggleLyrics=function(force){
    els(); ensureFrame();
    var open=typeof force==='boolean'?force:!lyricsIsOpen();
    if(open&&profileIsOpen()) window.lacMiniToggleProfile(false);
    if(open&&soundIsOpen()) window.lacMiniToggleSound(false);
    lyricsPanel.classList.toggle('open',open); lyricsPanel.setAttribute('aria-hidden',open?'false':'true');
    if(lyricsBtn){ lyricsBtn.classList.toggle('on',open); lyricsBtn.setAttribute('aria-expanded',open?'true':'false'); }
    if(open) requestLyrics(currentTrack());
  };
  window.lacMiniToggleSound=function(force){
    els(); ensureFrame();
    var open=typeof force==='boolean'?force:!soundIsOpen();
    if(open&&profileIsOpen()) window.lacMiniToggleProfile(false);
    if(open&&lyricsIsOpen()) window.lacMiniToggleLyrics(false);
    soundPanel.classList.toggle('open',open); soundPanel.setAttribute('aria-hidden',open?'false':'true');
    if(soundBtn) soundBtn.setAttribute('aria-expanded',open?'true':'false');
    if(open) send('sound_get');
  };
  window.lacMiniSetSound=function(profile){
    profile=String(profile||'off');
    if(!/^(?:off|surround|speakers|night)$/.test(profile)) profile='off';
    applySoundState({profile:profile,active:profile!=='off'&&soundState.active});
    send('sound_profile',{profile:profile});
  };
  function hasId(list,id){ return !!id&&Array.isArray(list)&&list.indexOf(id)>=0; }
  function updateQuickActions(){
    var trackNow=currentTrack(), logged=!!profileState.session;
    if(favBtn){ favBtn.classList.toggle('on',logged&&hasId(profileState.favoriteIds,trackNow&&trackNow.id)); favBtn.disabled=!trackNow; }
    if(playlistQuickBtn) playlistQuickBtn.disabled=!trackNow;
    if(lyricsBtn) lyricsBtn.disabled=!trackNow;
    if(favoritesHeaderBtn) favoritesHeaderBtn.classList.toggle('active',profileIsOpen()&&profileSection==='favorites');
  }
  function setProfileError(message,good){
    if(!profileError) return;
    profileError.textContent=message||'';
    profileError.style.color=good?'#49df7e':'#ff7078';
  }
  function renderWorkers(){
    if(!workersEl) return;
    workersEl.innerHTML='';
    var workers=profileState.workers||[];
    if(!workers.length){ workersEl.innerHTML='<div class="lmp-empty">Nav atrasti šodienas darbinieki.</div>'; return; }
    workers.forEach(function(worker){
      var button=document.createElement('button'); button.type='button'; button.className='lmp-worker';
      var avatar=document.createElement('span'); avatar.className='lmp-avatar'; avatar.textContent=(worker.name||'?').slice(0,1).toUpperCase();
      var copy=document.createElement('span'); copy.className='lmp-worker-copy';
      var name=document.createElement('span'); name.className='lmp-worker-name'; name.textContent=worker.name||'Darbinieks';
      var pin=document.createElement('span'); pin.className='lmp-worker-pin';
      pin.textContent=worker.hasPin===true?'PIN iestatīts':worker.hasPin===false?'Izveidot PIN':'Pārbauda PIN…';
      copy.appendChild(name); copy.appendChild(pin); button.appendChild(avatar); button.appendChild(copy);
      button.disabled=worker.hasPin===undefined;
      button.addEventListener('click',function(){ selectProfileWorker(worker); });
      workersEl.appendChild(button);
    });
  }
  function selectProfileWorker(worker){
    selectedWorker=worker; setProfileError('');
    if(workersEl) workersEl.style.display='none';
    if(pinForm) pinForm.classList.add('show');
    if(pinConfirmField) pinConfirmField.style.display=worker.hasPin===false?'flex':'none';
    if(pinSubmit) pinSubmit.textContent=worker.hasPin===false?'Izveidot PIN':'Ieiet';
    var label=$('lacMiniPinLabel'); if(label) label.textContent=(worker.name||'')+' PIN';
    if(pinInput){ pinInput.value=''; setTimeout(function(){pinInput.focus();},20); }
    if(pinConfirm) pinConfirm.value='';
  }
  window.lacMiniBackToWorkers=function(){
    selectedWorker=null; setProfileError('');
    if(workersEl) workersEl.style.display='grid';
    if(pinForm) pinForm.classList.remove('show');
  };
  window.lacMiniSubmitPin=function(){
    if(!selectedWorker) return;
    var pin=String(pinInput&&pinInput.value||'').trim();
    var confirm=String(pinConfirm&&pinConfirm.value||'').trim();
    if(!/^\d{4,8}$/.test(pin)){ setProfileError('PIN jābūt 4 līdz 8 cipariem.'); return; }
    if(selectedWorker.hasPin===false&&pin!==confirm){ setProfileError('PIN atkārtojums nesakrīt.'); return; }
    if(pinSubmit){ pinSubmit.disabled=true; pinSubmit.textContent='Pārbauda…'; }
    setProfileError('');
    send('profile_login',{workerId:selectedWorker.id,pin:pin,confirm:confirm});
  };
  function profileTrackPayload(item){
    item=cleanMusicTrack(item);
    return {id:item.id,title:item.title||'',author:item.author||'',thumbnail:item.thumbnail||'',duration:item.duration||'',lengthSeconds:item.lengthSeconds||0};
  }
  function renderLibrary(tracks,section){
    if(!libraryEl) return;
    profileLibrary=(tracks||[]).map(cleanMusicTrack); libraryEl.innerHTML='';
    if(!profileLibrary.length){
      var emptyText=section==='favorites'?'Nav iecienīto dziesmu.':section==='history'?'Vēsture pagaidām ir tukša.':'Šajā playlistē vēl nav dziesmu.';
      libraryEl.innerHTML='<div class="lmp-empty">'+emptyText+'</div>'; return;
    }
    profileLibrary.forEach(function(item){
      var row=document.createElement('div'); row.className='lmp-row';
      var image=document.createElement('img'); image.loading='lazy'; image.alt=''; image.src=coverUrl(item);
      image.onerror=function(){this.onerror=null;this.src='https://lacitis.pages.dev/logo192.png';};
      var copy=document.createElement('div'); copy.className='lmp-row-copy'; copy.title='Atskaņot';
      var title=document.createElement('div'); title.className='lmp-row-title'; title.textContent=item.title||'Nezināma dziesma';
      var artist=document.createElement('div'); artist.className='lmp-row-artist'; artist.textContent=item.author||'';
      copy.appendChild(title); copy.appendChild(artist);
      copy.addEventListener('click',function(){send('profile_play',{section:profileSection,id:item.id});});
      var actions=document.createElement('span'); actions.className='lmp-row-actions';
      var play=document.createElement('button'); play.type='button'; play.className='lmp-icon-btn'; play.title='Atskaņot'; play.textContent='▶';
      play.addEventListener('click',function(){send('profile_play',{section:profileSection,id:item.id});});
      var favorite=document.createElement('button'); favorite.type='button'; favorite.className='lmp-icon-btn'; favorite.title='Iecienītās'; favorite.textContent='♥';
      favorite.classList.toggle('on',hasId(profileState.favoriteIds,item.id));
      favorite.addEventListener('click',function(){send('profile_favorite',profileTrackPayload(item));});
      var playlistAction=document.createElement('button'); playlistAction.type='button'; playlistAction.className='lmp-icon-btn';
      if(String(section||'').indexOf('playlist:')===0){
        playlistAction.title='Izņemt no playlistes'; playlistAction.textContent='−';
        playlistAction.addEventListener('click',function(){send('profile_playlist_remove',{playlistId:selectedPlaylistId,id:item.id});});
      }else{
        playlistAction.title='Pievienot playlistei'; playlistAction.textContent='+♫';
        playlistAction.addEventListener('click',function(){openPlaylistPicker(item);});
      }
      actions.appendChild(play); actions.appendChild(favorite); actions.appendChild(playlistAction);
      row.appendChild(image); row.appendChild(copy); row.appendChild(actions); libraryEl.appendChild(row);
    });
  }
  function renderPlaylists(){
    if(!playlistsEl) return;
    playlistsEl.innerHTML='';
    var playlists=profileState.playlists||[];
    if(!playlists.length){ playlistsEl.innerHTML='<div class="lmp-empty">Izveido savu pirmo playlisti.</div>'; return; }
    playlists.forEach(function(item){
      var button=document.createElement('button'); button.type='button'; button.className='lmp-playlist-card';
      var icon=document.createElement('span'); icon.className='lmp-playlist-icon'; icon.textContent='♫';
      var copy=document.createElement('span'); copy.className='lmp-playlist-copy';
      var name=document.createElement('span'); name.className='lmp-playlist-name'; name.textContent=item.name;
      var count=document.createElement('span'); count.className='lmp-playlist-count'; count.textContent=item.count+' dziesmas';
      copy.appendChild(name); copy.appendChild(count); button.appendChild(icon); button.appendChild(copy);
      button.addEventListener('click',function(){
        var candidate=pendingPlaylistTrack; pendingPlaylistTrack=null;
        selectPlaylist(item.id);
        if(candidate) send('profile_playlist_add',Object.assign({playlistId:item.id},profileTrackPayload(candidate)));
      });
      playlistsEl.appendChild(button);
    });
  }
  function selectPlaylist(id){
    var playlist=(profileState.playlists||[]).find(function(item){return item.id===id;});
    if(!playlist) return;
    selectedPlaylistId=id; profileSection='playlist:'+id;
    if(playlistsEl) playlistsEl.style.display='none';
    if(playlistToolbar) playlistToolbar.classList.add('show');
    if(playlistTitle) playlistTitle.textContent=playlist.name;
    if(libraryEl){ libraryEl.style.display='flex'; libraryEl.innerHTML='<div class="lmp-empty">Ielādē playlisti…</div>'; }
    send('profile_library',{section:profileSection});
  }
  function openPlaylistPicker(item){
    pendingPlaylistTrack=item||currentTrack();
    window.lacMiniToggleProfile(true); window.lacMiniLibrary('playlists');
    if(profileState.session&&playlistNameInput&&!profileState.playlists.length) playlistNameInput.focus();
  }
  function applyProfileState(data){
    profileState=data||profileState;
    var session=profileState.session;
    if(profileStatus) profileStatus.textContent=!session?'Nav profila':profileState.syncStatus==='synced'?'Saglabāts':profileState.syncStatus==='syncing'?'Saglabā…':profileState.syncStatus==='error'?'Neizdevās saglabāt':'Profils ielādēts';
    if(loggedOut) loggedOut.style.display=session?'none':'block';
    if(loggedIn) loggedIn.style.display=session?'block':'none';
    if(session){
      var avatar=$('lacMiniSessionAvatar'),name=$('lacMiniSessionName'),shift=$('lacMiniSessionShift');
      if(avatar) avatar.textContent=(session.name||'?').slice(0,1).toUpperCase();
      if(name) name.textContent=session.name||''; if(shift) shift.textContent=session.shift||'Dežūra';
      var counts=profileState.counts||{};
      if($('lacMiniFavCount')) $('lacMiniFavCount').textContent=counts.favorites||0;
      if($('lacMiniHistoryCount')) $('lacMiniHistoryCount').textContent=counts.history||0;
      if($('lacMiniPlaylistCount')) $('lacMiniPlaylistCount').textContent=counts.playlists||0;
      if(favoritesHeaderBtn) favoritesHeaderBtn.title='Atvērt favorītus ('+(counts.favorites||0)+')';
      if(profileSection==='playlists') renderPlaylists();
      if(profileIsOpen()&&profileSection.indexOf('playlist:')===0&&selectedPlaylistId) selectPlaylist(selectedPlaylistId);
      else if(profileIsOpen()&&profileSection!=='playlists') send('profile_library',{section:profileSection});
    }else{
      var selectedId=selectedWorker&&selectedWorker.id;
      var refreshed=selectedId&&(profileState.workers||[]).find(function(worker){return worker.id===selectedId;});
      renderWorkers();
      if(refreshed){
        selectedWorker=refreshed;
        if(workersEl) workersEl.style.display='none';
        if(pinForm) pinForm.classList.add('show');
        if(pinConfirmField) pinConfirmField.style.display=refreshed.hasPin===false?'flex':'none';
        if(pinSubmit&&!pinSubmit.disabled) pinSubmit.textContent=refreshed.hasPin===false?'Izveidot PIN':'Ieiet';
      }else window.lacMiniBackToWorkers();
    }
    updateQuickActions();
  }
  window.lacMiniLibrary=function(section){
    profileSection=section||'favorites';
    var tabs=profilePanel?profilePanel.querySelectorAll('.lmp-tab'):[];
    var tabSection=profileSection.indexOf('playlist:')===0?'playlists':profileSection;
    for(var i=0;i<tabs.length;i++) tabs[i].classList.toggle('active',tabs[i].getAttribute('data-section')===tabSection);
    if(playlistArea) playlistArea.style.display=tabSection==='playlists'?'block':'none';
    if(tabSection==='playlists'){
      selectedPlaylistId=null;
      if(playlistsEl) playlistsEl.style.display='grid';
      if(playlistToolbar) playlistToolbar.classList.remove('show');
      if(libraryEl) libraryEl.style.display='none';
      renderPlaylists();
    }else{
      if(libraryEl){ libraryEl.style.display='flex'; libraryEl.innerHTML='<div class="lmp-empty">Ielādē bibliotēku…</div>'; }
      send('profile_library',{section:profileSection});
    }
    updateQuickActions();
  };
  window.lacMiniToggleProfile=function(force){
    els(); ensureFrame();
    var open=typeof force==='boolean'?force:!profileIsOpen();
    if(open&&lyricsIsOpen()) window.lacMiniToggleLyrics(false);
    if(open&&soundIsOpen()) window.lacMiniToggleSound(false);
    if(open&&!window.__mkUnifiedMedia?.getSession()){ window.__mkUnifiedMedia?.open(); return; }
    profilePanel.classList.toggle('open',open); profilePanel.setAttribute('aria-hidden',open?'false':'true');
    if(favoritesHeaderBtn) favoritesHeaderBtn.setAttribute('aria-expanded',open?'true':'false');
    if(open){
      send('profile_init',{workers:todayWorkers()});
      setTimeout(function(){ if(profileIsOpen()) window.__lacitisMiniRefreshWorkers(); },700);
      setTimeout(function(){ if(profileIsOpen()) window.__lacitisMiniRefreshWorkers(); },2200);
    }
    updateQuickActions();
  };
  window.__lacitisMiniRefreshWorkers=function(){
    var workers=todayWorkers();
    if(profileIsOpen()&&workers.length) send('profile_init',{workers:workers});
  };
  window.lacMiniLogout=function(){ window.__mkUnifiedMedia?.logout(); send('shared_profile',{session:null}); };
  function syncSharedProfile(){ if(bridgeReady)send('shared_profile',{session:window.__mkUnifiedMedia?.getSession()||null}); }
  document.addEventListener('media-profile-change',syncSharedProfile);
  window.lacMiniQuickAction=function(){
    var item=currentTrack();
    if(!item) return;
    if(!profileState.session){ window.lacMiniToggleProfile(true); setProfileError('Vispirms ielogojies profilā.'); return; }
    send('profile_favorite',profileTrackPayload(item));
  };
  window.lacMiniOpenFavorites=function(){
    window.lacMiniToggleProfile(true);
    if(profileState.session) window.lacMiniLibrary('favorites');
    else setProfileError('Ielogojies, lai redzētu savus favorītus.');
  };
  window.lacMiniOpenPlaylists=function(){ openPlaylistPicker(currentTrack()); };
  window.lacMiniCreatePlaylist=function(){
    if(!profileState.session){ setProfileError('Vispirms ielogojies profilā.'); return; }
    var name=String(playlistNameInput&&playlistNameInput.value||'').trim();
    if(!name){ setProfileError('Ievadi playlistes nosaukumu.'); return; }
    setProfileError(''); send('profile_playlist_create',{name:name});
  };
  window.lacMiniPlaylistBack=function(){ window.lacMiniLibrary('playlists'); };
  window.lacMiniAddCurrentToPlaylist=function(){
    var item=currentTrack(); if(!item||!selectedPlaylistId) return;
    send('profile_playlist_add',Object.assign({playlistId:selectedPlaylistId},profileTrackPayload(item)));
  };
  window.lacMiniDeletePlaylist=function(){
    if(!selectedPlaylistId) return;
    var playlist=(profileState.playlists||[]).find(function(item){return item.id===selectedPlaylistId;});
    if(!playlist||!confirm('Dzēst playlisti “'+playlist.name+'”?')) return;
    send('profile_playlist_delete',{playlistId:selectedPlaylistId});
  };

  function wire(){
    if(wired||!deckEl) return; wired=true;
    deckEl.addEventListener('scroll',function(){
      updateDeckNav();
      if(deckEl.scrollLeft+deckEl.clientWidth>=deckEl.scrollWidth-180) maybeMore();
    },{passive:true});
    deckEl.addEventListener('wheel',function(e){
      if(Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return;
      deckEl.scrollLeft+=e.deltaY; e.preventDefault();
    },{passive:false});
    if(searchEl){
      searchEl.addEventListener('input',function(){ clearTimeout(searchTO); var q=searchEl.value.trim(); searchTO=setTimeout(function(){ send('search',{q:q}); }, q?360:0); });
      searchEl.addEventListener('keydown',function(e){ if(e.key==='Enter'){ clearTimeout(searchTO); send('search',{q:searchEl.value.trim()}); } });
    }
    if(pinInput) pinInput.addEventListener('keydown',function(e){if(e.key==='Enter') window.lacMiniSubmitPin();});
    if(pinConfirm) pinConfirm.addEventListener('keydown',function(e){if(e.key==='Enter') window.lacMiniSubmitPin();});
    if(lyricsBody) lyricsBody.addEventListener('click',function(e){
      var target=e.target;
      while(target&&target!==lyricsBody&&!target.classList.contains('lml-line')) target=target.parentNode;
      if(!target||target===lyricsBody||!target.dataset.time) return;
      var seconds=Number(target.dataset.time);
      var duration=Number(lastNpPayload&&lastNpPayload.duration||currentTrack()&&currentTrack().lengthSeconds||0);
      if(Number.isFinite(seconds)&&duration>0) send('seek',{pct:Math.max(0,Math.min(1,seconds/duration))});
    });
  }

  window.addEventListener('message',function(e){
    if(e.origin!==LAC_ORIGIN||!frame||e.source!==frame.contentWindow) return;
    var d=e.data; if(!d||typeof d!=='object') return;
    if(d.type==='lac_mini_ready'){
      bridgeReady=true;
      syncSharedProfile();
      send('profile_init',{workers:todayWorkers()});
      send('sound_get');
      var queued=pendingCommands.slice(); pendingCommands=[];
      queued.forEach(function(item){send(item.cmd,item.extra);});
      if(stage&&stage.classList.contains('full')) send('full');
      if(pendingSearch!==null){ var q=pendingSearch; pendingSearch=null; send('search',{q:q}); }
      else if(uiVisible()) send('deck');
    }
    else if(d.type==='lac_mini_deck'){
      if(uiVisible()) renderDeck(d.tracks,d.query);
      else pendingDeck={tracks:d.tracks,query:d.query};
    }
    else if(d.type==='lac_mini_append'){
      if(uiVisible()) appendDeck(d.tracks);
      else if(Array.isArray(d.tracks)&&d.tracks.length){
        // The hidden mini-player can receive many incremental pages. Keep only a
        // bounded tail so a trusted-but-buggy player cannot grow this queue forever.
        pendingAppend=pendingAppend.concat(d.tracks.slice(0,DECK_CAP)).slice(-DECK_CAP*2);
      }
    }
    else if(d.type==='lac_mini_np'){
      lastNpPayload=d;
      if(!document.hidden&&uiVisible()) applyNp(d);
    }
    else if(d.type==='lac_mini_lyrics'){
      lyricsCache[d.id]=d;
      var now=currentTrack();
      if(lyricsIsOpen()&&now&&now.id===d.id) renderLyrics(d);
    }
    else if(d.type==='lac_mini_sound'){ applySoundState(d); }
    else if(d.type==='lac_shared_login_request'){ window.__mkUnifiedMedia?.open(); }
    else if(d.type==='lac_shared_logout_request'){ window.__mkUnifiedMedia?.logout(); }
    else if(d.type==='lac_mini_profile'){ applyProfileState(d); }
    else if(d.type==='lac_mini_library'){
      if(d.section===profileSection) renderLibrary(d.tracks,d.section);
    }
    else if(d.type==='lac_mini_profile_result'){
      if(pinSubmit){ pinSubmit.disabled=false; pinSubmit.textContent=selectedWorker&&selectedWorker.hasPin===false?'Izveidot PIN':'Ieiet'; }
      if(d.ok){
        if(d.action==='playlist_create'&&d.playlistId){
          selectedPlaylistId=d.playlistId; profileSection='playlist:'+d.playlistId;
          if(playlistNameInput) playlistNameInput.value='';
          var firstTrack=pendingPlaylistTrack; pendingPlaylistTrack=null;
          if(firstTrack) send('profile_playlist_add',Object.assign({playlistId:d.playlistId},profileTrackPayload(firstTrack)));
        }else if(d.action==='playlist_delete') window.lacMiniLibrary('playlists');
        setProfileError(d.action==='login'?'Profils ielādēts.':d.action==='playlist_add'?'Dziesma pievienota playlistei.':d.action==='playlist_remove'?'Dziesma izņemta no playlistes.':'',true);
      }
      else setProfileError(d.error||'Darbība neizdevās.');
    }
  });

  window.openLacMini=function(){
    els(); wire();
    ensureFrame();
    // Music and broadcast radio share one shell and never play together.
    window.__mkRadioSupersededByLacitis=true;
    try{ if(typeof window.__mkPauseRadioForLacitis==='function') window.__mkPauseRadioForLacitis(); }catch(e){}
    var rw=document.getElementById('radioWindow');
    if(rw && cons.parentNode!==rw) rw.appendChild(cons);
    var sourceBar=$('radioSourceBar'),head=cons.querySelector('.lm-head');
    if(sourceBar&&head) head.insertBefore(sourceBar,head.firstChild);
    try{ if(typeof window.__mkSyncRadioVisuals==='function') window.__mkSyncRadioVisuals(); }catch(e){}
    cons.classList.add('docked'); cons.setAttribute('aria-hidden','false');
    stage.classList.remove('full'); stage.setAttribute('aria-hidden','true');
    setDockButton(true);
    sync();
    clearTimeout(openTO);
    openTO=setTimeout(function(){
      openTO=0;
      if(!dockVisible()) return;
      var needsDeck=!deck.length;
      if(pendingDeck){ var p=pendingDeck; pendingDeck=null; renderDeck(p.tracks,p.query); }
      if(pendingAppend.length){ var a=pendingAppend; pendingAppend=[]; appendDeck(a); }
      if(lastNpPayload) applyNp(lastNpPayload);
      if(needsDeck&&!deck.length&&bridgeReady) send('deck');
    },80);
  };
  function hideLacMini(){
    els();
    clearTimeout(openTO); openTO=0;
    var sourceBar=$('radioSourceBar'),radioShell=$('radioWindow');
    if(sourceBar&&radioShell) radioShell.insertBefore(sourceBar,radioShell.firstChild);
    cons.classList.remove('docked'); cons.setAttribute('aria-hidden','true');
    stage.classList.remove('full'); stage.setAttribute('aria-hidden','true');
    if(profilePanel){ profilePanel.classList.remove('open'); profilePanel.setAttribute('aria-hidden','true'); }
    if(favoritesHeaderBtn) favoritesHeaderBtn.setAttribute('aria-expanded','false');
    if(lyricsPanel){ lyricsPanel.classList.remove('open'); lyricsPanel.setAttribute('aria-hidden','true'); }
    if(lyricsBtn){ lyricsBtn.classList.remove('on'); lyricsBtn.setAttribute('aria-expanded','false'); }
    if(soundPanel){ soundPanel.classList.remove('open'); soundPanel.setAttribute('aria-hidden','true'); }
    if(soundBtn) soundBtn.setAttribute('aria-expanded','false');
    setFullShell(false);
    leaveNativeFullscreen();
    setDockButton(false);
    sync();
  }
  window.__minimizeMusicPanel=hideLacMini;
  window.toggleLacMini=function(){ els(); if(uiVisible()) hideLacMini(); else window.openLacMini(); };
  window.__hideLacMiniForRadio=function(){ els(); if(uiVisible()) hideLacMini(); unloadFrame(); };
  window.lacMiniClose=function(){ hideLacMini(); unloadFrame(); window.setRadioSource('radio'); };
  window.lacMiniMaximize=function(){ els(); ensureFrame(); cons.classList.remove('docked'); cons.setAttribute('aria-hidden','true'); stage.classList.add('full'); stage.setAttribute('aria-hidden','false'); setFullShell(true); setDockButton(true); sync(); enterNativeFullscreen(); if(bridgeReady) send('full'); if(lastNpPayload) applyNp(lastNpPayload); };
  window.lacMiniMinimize=function(){ els(); stage.classList.remove('full'); stage.setAttribute('aria-hidden','true'); setFullShell(false); leaveNativeFullscreen(); cons.classList.add('docked'); cons.setAttribute('aria-hidden','false'); setDockButton(true); sync(); if(bridgeReady&&!deck.length) send('deck'); if(lastNpPayload) applyNp(lastNpPayload); };
  window.lacMiniCmd=function(cmd){ if(cmd==='toggle'&&!curId&&deck.length){ playIdx(sel); return; } send(cmd); };
  window.lacMiniSeek=function(e){ els(); var r=progEl.getBoundingClientRect(); var p=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)); send('seek',{pct:p}); fillEl.style.width=(p*100)+'%'; };
  window.lacMiniVolume=function(v){ send('volume',{value:(+v)/100}); };
  window.lacMiniScroll=function(direction){
    els(); if(!deckEl) return;
    var amount=Math.max(240,Math.floor(deckEl.clientWidth*.72));
    deckEl.scrollBy({left:(direction<0?-amount:amount),behavior:isLowSpec()?'auto':'smooth'});
  };

  document.addEventListener('fullscreenchange',function(){
    if(!document.fullscreenElement&&nativeFullRequested&&stage&&stage.classList.contains('full')){
      nativeFullRequested=false;
      window.lacMiniMinimize();
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    if(soundIsOpen()){ e.stopPropagation(); window.lacMiniToggleSound(false); }
    else if(lyricsIsOpen()){ e.stopPropagation(); window.lacMiniToggleLyrics(false); }
    else if(profileIsOpen()){ e.stopPropagation(); window.lacMiniToggleProfile(false); }
  });

  document.addEventListener('visibilitychange',function(){
    if(!document.hidden&&uiVisible()&&lastNpPayload) applyNp(lastNpPayload);
  });
  els(); wire(); applySoundState(soundState);
})();
