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

  window.toggleNsOverlay=function(forceOpen){
    _nsOpen = (typeof forceOpen === 'boolean') ? !!forceOpen : !_nsOpen;
    clearTimeout(_nsParkTimer);
    if(_nsOpen && overlay.classList.contains('ns-parked')){
      // Unpark first and let the closed styles compute, so .open transitions.
      overlay.classList.remove('ns-parked');
      void overlay.offsetWidth;
    }
    overlay.classList.toggle('open',_nsOpen);
    if(!_nsOpen) _nsParkTimer=setTimeout(function(){ if(!_nsOpen) overlay.classList.add('ns-parked'); }, 450);
    window.__nsOverlayOpen = _nsOpen;
    setNightWalkerMotion(_nsOpen);
    if(_nsOpen && window.__ns) {
      requestAnimationFrame(function(){
        if(typeof window.__ns._update==='function') window.__ns._update();
        else if(typeof window.__ns._render==='function') window.__ns._render();
        requestAnimationFrame(function(){
          try {
            var bed = document.querySelector('#nsPanel .ns-bedcare-perch');
            if(bed && window.__minkaDailyCat && typeof window.__minkaDailyCat.enterNightSplit==='function') {
              window.__minkaDailyCat.enterNightSplit(bed);
            }
          } catch(e) {}
        });
      });
    }
    if(!_nsOpen) {
      try { if(window.__ns && typeof window.__ns.closeBedCare==='function') window.__ns.closeBedCare(); } catch(e) {}
      try { if(window.__ns && typeof window.__ns.closeTimeWheel==='function') window.__ns.closeTimeWheel(); } catch(e) {}
      try { if(window.__minkaDailyCat && typeof window.__minkaDailyCat.exitNightSplit==='function') window.__minkaDailyCat.exitNightSplit(); } catch(e) {}
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
      if(typeof shouldOpen === 'boolean') toggleNsOverlay(shouldOpen);
      else toggleNsOverlay();
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
