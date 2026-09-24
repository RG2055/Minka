(function(){
  var overlay=document.getElementById('nsOverlay');
  var _nsOpen=false;
  window.__nsOverlayOpen = false;
  var _nsParkTimer=0;
  overlay.classList.add('ns-parked');

  function setNightWalkerMotion(running){
    running = running && !document.hidden && !document.documentElement.classList.contains('minka-ambient-active') && !document.documentElement.classList.contains('minka-visuals-hidden');
    try{
      overlay.querySelectorAll('.ns-room-walker').forEach(function(svg){
        if(!running){
          // Keep the already-built room DOM so reopening does not rebuild the
          // whole modal. Chromium pauses SVG SMIL here; CSS is paused by the
          // closed-overlay rule below as a second guard.
          if(typeof svg.pauseAnimations==='function') svg.pauseAnimations();
        } else if(typeof svg.unpauseAnimations==='function') {
          svg.unpauseAnimations();
        }
      });
    }catch(_e){}
  }
  window.__nsSyncWalkerMotion = setNightWalkerMotion;

  // M3 container transform (js/mk-motion.js): the panel grows out of the
  // button that opened it (dock "Nakts" in the shell, the header toggle) and
  // shrinks back into it. The overlay stays visible (.ns-closing) until the
  // close has played; the logical state flips at once.
  var panel=document.getElementById('nsPanel');
  var _nsOrigin=null;
  function nsSurfaceOpts(){
    var sheet=document.documentElement.classList.contains('mk-mobile-shell');
    return { key:'ns', origin: sheet ? null : _nsOrigin, from: sheet ? 'bottom' : null, scrim: overlay };
  }
  // The daily cat changes place with the panel: it fades out of its spot on
  // the schedule and pops in on the bed once the panel has arrived (and the
  // reverse on close), instead of sliding across the screen. Its own sprite
  // animation (the jump) is untouched.
  var _catFade=null;
  function cat(){ return document.querySelector('.mk-daily-cat-pet'); }
  // Resolves once the pet is invisible, so it is only ever moved unseen.
  // On open it goes at once: the night panel itself perches the pet while it
  // renders, and that must not be seen gliding across the scrim.
  function catOut(instant){
    var el=cat(), MM=window.MinkaMotion;
    if(!el || !MM) return Promise.resolve();
    if(_catFade){ try{ _catFade.cancel(); }catch(_e){} }
    var fade=_catFade=MM.animate(el, [{opacity:1},{opacity:0}], 'effects-fast', {fill:'forwards', duration: instant ? 1 : 0});
    return fade && fade.finished ? fade.finished.catch(function(){}) : Promise.resolve();
  }
  // Move while invisible: no glide across the screen.
  function catMove(move){
    var el=cat();
    if(!el || !window.MinkaMotion){ move(); return; }
    var t=el.style.transition;
    el.style.transition='none';
    move();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.style.transition=t; }); });
  }
  // Appear in the new place (its position lands in the pet's next frame).
  function catPop(){
    var el=cat(), MM=window.MinkaMotion;
    if(!el || !MM) return;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      if(_catFade){ try{ _catFade.cancel(); }catch(_e){} _catFade=null; }
      // Opacity and a short drop into place only. The pet is placed with its
      // own transform from the viewport corner, so a `scale` here would pull
      // it in from across the screen.
      MM.animate(el, [{opacity:0, translate:'0 -10px'},{opacity:1, translate:'0 0'}], 'spatial-fast');
    }); });
  }
  window.toggleNsOverlay=function(forceOpen, opts){
    var wasOpen=_nsOpen;
    _nsOpen = (typeof forceOpen === 'boolean') ? !!forceOpen : !_nsOpen;
    if(_nsOpen === wasOpen) return;
    clearTimeout(_nsParkTimer);
    var MM=window.MinkaMotion;
    if(_nsOpen){
      _nsOrigin=(opts && opts.origin) || (MM && MM.recentLauncher()) || null;
      if(overlay.classList.contains('ns-parked')){
        // Unpark first and let the closed styles compute, so .open transitions.
        overlay.classList.remove('ns-parked');
        void overlay.offsetWidth;
      }
      overlay.classList.remove('ns-closing');
    }
    overlay.classList.toggle('open',_nsOpen);
    if(_nsOpen) catOut(true);
    var opened = (_nsOpen && MM && panel) ? MM.openSurface(panel, nsSurfaceOpts()) : Promise.resolve();
    if(!_nsOpen){
      if(MM && panel){
        overlay.classList.add('ns-closing');
        MM.closeSurface(panel, nsSurfaceOpts(), function(){
          overlay.classList.remove('ns-closing');
          if(!_nsOpen) catPop();   // back on the schedule once the panel is gone
        });
      }
      _nsParkTimer=setTimeout(function(){ if(!_nsOpen) overlay.classList.add('ns-parked'); }, 450);
    }
    window.__nsOverlayOpen = _nsOpen;
    setNightWalkerMotion(_nsOpen);
    if(_nsOpen && window.__ns) {
      // Rooms, beds and the history column are fitted from measured boxes:
      // measure the panel at its final size, not mid-growth.
      var rest = function(fn){ return MM && MM.atRest ? MM.atRest('ns', fn) : fn(); };
      requestAnimationFrame(function(){
        rest(function(){
          if(typeof window.__ns._update==='function') window.__ns._update();
          else if(typeof window.__ns._render==='function') window.__ns._render();
        });
        // The cat is a separate fixed layer: it jumps onto the bed once the
        // panel has arrived, so it never hangs in the air beside a moving bed.
        opened.then(function(){
          if(!_nsOpen) return;
          try {
            var bed = document.querySelector('#nsPanel .ns-bedcare-perch');
            if(bed && window.__minkaDailyCat && typeof window.__minkaDailyCat.enterNightSplit==='function') {
              catMove(function(){ window.__minkaDailyCat.enterNightSplit(bed); });
              catPop();
            }
          } catch(e) {}
        });
      });
    }
    if(!_nsOpen) {
      try { if(window.__ns && typeof window.__ns.closeBedCare==='function') window.__ns.closeBedCare(); } catch(e) {}
      try { if(window.__ns && typeof window.__ns.closeTimeWheel==='function') window.__ns.closeTimeWheel(); } catch(e) {}
      try {
        if(window.__minkaDailyCat && typeof window.__minkaDailyCat.exitNightSplit==='function') {
          catOut().then(function(){
            if(_nsOpen) return;              // reopened meanwhile: the open path owns the pet
            catMove(function(){ window.__minkaDailyCat.exitNightSplit(); });
          });
        }
      } catch(e) {}
      // notify parent
      try { window.parent.postMessage({type:'nsClosed'}, window.location.origin); } catch(e) {}
    }
  };

  function setNightRoomLight(on){
    try{
      document.querySelectorAll('.ns-room-block').forEach(function(el){
        el.classList.toggle('ns-room-lit', !!on);
      });
    }catch(_e){}
  }

  // Listen for postMessage from parent
  window.addEventListener('message', function(e) {
    if(e.origin !== window.location.origin || e.source !== window.parent) return;
    if(e.data && e.data.type==='nsWarm') {
      // Pre-open warm-up (parent hover): let the parked panel compute its
      // style/layout and decode its pictures now, off the click. It re-parks
      // on its own if the click does not follow.
      if(!_nsOpen && overlay.classList.contains('ns-parked')){
        overlay.classList.remove('ns-parked');
        clearTimeout(_nsParkTimer);
        _nsParkTimer=setTimeout(function(){ if(!_nsOpen) overlay.classList.add('ns-parked'); }, 5000);
      }
      try { if(window.__ns && typeof window.__ns.warmImages==='function') window.__ns.warmImages(); } catch(_e) {}
      return;
    }
    if(e.data && e.data.type==='toggleNs') {
      var shouldOpen = e.data.open;
      var nsOpts = e.data.origin ? { origin: e.data.origin } : undefined;
      if(typeof shouldOpen === 'boolean') toggleNsOverlay(shouldOpen, nsOpts);
      else toggleNsOverlay(undefined, nsOpts);
      return;
    }
    if(e.data && e.data.type==='kakisLit') {
      setNightRoomLight(!!e.data.on);
    }
  });

  // Escape to close
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&_nsOpen){ toggleNsOverlay(); try{window.parent.postMessage({type:'nsClosed'},window.location.origin);}catch(ex){} }
  });
})();
