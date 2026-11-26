(function(){
  var generated=false;
  var STORAGE_KEY='rg_stars_manual_v1';
  var manualOn=false;

  try { manualOn = localStorage.getItem(STORAGE_KEY) === '1'; } catch(_e) {}

  function container(){
    return document.getElementById('stars-overlay');
  }

  /* The night sky: the same 127 stars with the same look (the CSS in
     kalendars/index.html), the same slow drift (±5 px over 18–38 s) and
     twinkle (6–13 s), but their animations are paused and moved on the app's
     shared clock (MinkaMotion.onSlowTick, ~7.5 steps a second: the ticks the
     mood sky already draws on) instead of running free. As 254 free-running
     CSS animations under a full-screen blend layer they kept the compositor at
     60 frames a second all night: idle CPU 13 % renderer + 69 % GPU process
     (5 % + 11 % with no stars; measured). One canvas for them cost 74 MB of
     the tab's memory, so they stay small elements. */
  var offTick=null, localTimer=0, t0=0;
  var TWINKLE=[
    { opacity:.34, transform:'scale(.94)', easing:'ease-in-out' },
    { offset:.35, opacity:.76, transform:'scale(1.03)', easing:'ease-in-out' },
    { offset:.7, opacity:.52, transform:'scale(.98)', easing:'ease-in-out' },
    { opacity:.88, transform:'scale(1.06)' }
  ];
  function reducedMotion(){ try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(_e){ return false; } }
  /* Thinned (2026-11-24, measured: at night this was most of the idle app's work, a restyle of 254 animations 7.5
     times a second): every other tick moves half the stars, the halves in turn, so a star is moved about twice a
     second. Its drift is under 0.3 px a second and its twinkle takes 6 to 13 s: the steps cannot be seen. The first
     call (startStars) places them all. */
  var tickNo=0;
  /* The same drift and twinkle, computed here from the same keyframes, timing and easing
     the paused animations had, and written as plain 2D transform/opacity. A paused WAAPI animation keeps its
     element on a compositor layer of its own: 127 stars made 255 layers, which every frame of the page then
     carried (commit, composite). Without them the stars paint into the overlay's one layer. */
  var TW_OFF=[0,.35,.7,1], TW_OP=[.34,.76,.52,.88], TW_SC=[.94,1.03,.98,1.06];
  // CSS ease-in-out, cubic-bezier(.42,0,.58,1): x(t) solved for t (Newton, then bisection), as browsers do
  function easeInOut(x){
    var ax=1-3*.58+3*.42, bx=3*.58-6*.42, cx=3*.42, ay=1-3*1+3*0, by=3*1-6*0, cy=0;
    ay=-2; by=3; cy=0;
    var t=x, i, d;
    for(i=0;i<8;i++){ var xt=((ax*t+bx)*t+cx)*t-x; if(Math.abs(xt)<1e-7) return ((ay*t+by)*t+cy)*t; d=(3*ax*t+2*bx)*t+cx; if(Math.abs(d)<1e-6) break; t-=xt/d; }
    var lo=0, hi=1; t=x; while(lo<hi){ var v=((ax*t+bx)*t+cx)*t; if(Math.abs(v-x)<1e-7) break; if(x>v) lo=t; else hi=t; t=(hi-lo)/2+lo; if(hi-lo<1e-9) break; }
    return ((ay*t+by)*t+cy)*t;
  }
  function pose(k, t){
    var s=stars[k];
    // drift: linear, alternate, infinite
    var p=t/s.dd, it=Math.floor(p), f=p-it; if(it & 1) f=1-f;
    s.el.style.transform='translate('+(s.dx*f)+'px,'+(s.dy*f)+'px)';
    // twinkle: 4 keyframes, ease-in-out between each, infinite, negative delay
    var q=((t-s.td)/s.tt)%1; if(q<0) q+=1;
    var j=q<TW_OFF[1]?0:q<TW_OFF[2]?1:2, l=easeInOut((q-TW_OFF[j])/(TW_OFF[j+1]-TW_OFF[j]));
    s.core.style.opacity=String(TW_OP[j]+(TW_OP[j+1]-TW_OP[j])*l);
    s.core.style.transform='scale('+(TW_SC[j]+(TW_SC[j+1]-TW_SC[j])*l)+')';
  }
  var stars=[];
  function step(now, all){
    if(document.hidden) return;
    var t=(now||performance.now())-t0;
    if(all===true){ for(var i=0;i<stars.length;i++) pose(i,t); return; }
    tickNo++;
    if(tickNo & 1) return;
    // the same halves in turn as before (a star's drift and twinkle were neighbours k, k+1 of 4)
    for(var k=(tickNo & 2) ? 0 : 1; k<stars.length; k+=2) pose(k,t);
  }
  function startStars(){
    if(offTick || localTimer || !stars.length) return;
    step(0, true);
    if(reducedMotion()) return;                               // one still pose
    var M=window.MinkaMotion;
    if(M && M.onSlowTick) offTick=M.onSlowTick(step);
    else localTimer=setInterval(step, 133);
  }
  function stopStars(){
    if(offTick){ offTick(); offTick=null; }
    if(localTimer){ clearInterval(localTimer); localTimer=0; }
  }
  function ensureStars(){
    if(generated) return;
    var host=container();
    if(!host) return;
    var layerFar=document.createElement('div');
    var layerNear=document.createElement('div');
    layerFar.className='stars-layer stars-layer-far';
    layerNear.className='stars-layer stars-layer-near';
    host.appendChild(layerFar);
    host.appendChild(layerNear);

    function addStars(layer, count, scale){
      for(var i=0;i<count;i++){
        var star=document.createElement('div');
        var core=document.createElement('span');
        var size=(Math.random()*scale + (scale > 2 ? 0.9 : 0.55)).toFixed(2);
        star.className='s-star' + (Math.random() < 0.45 ? ' is-dim' : '') + (parseFloat(size) < 1.2 ? ' is-tiny' : '');
        core.className='s-star-core';
        star.style.cssText=[
          'width:'+size+'px',
          'height:'+size+'px',
          'left:'+(Math.random()*100).toFixed(3)+'vw',
          'top:'+(Math.random()*100).toFixed(3)+'vh',
          'opacity:'+(Math.random()*0.55+0.20).toFixed(2)
        ].join(';');
        star.appendChild(core);
        layer.appendChild(star);
        var dx=((Math.random()*10)-5).toFixed(2), dy=((Math.random()*8)-4).toFixed(2);
        // the drift's and the twinkle's own random timing, as the animations had it
        var dd=(Math.random()*20+18)*1000, tt=(Math.random()*7+6)*1000, td=-Math.random()*8000;
        stars.push({ el: star, core: core, dx: +dx, dy: +dy, dd: dd, tt: tt, td: td });
      }
    }
    addStars(layerFar, 85, 1.6);
    addStars(layerNear, 42, 2.8);

    t0=performance.now();
    generated=true;
  }

  function moonSvgByIndex(index){
    var phaseByIndex=[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875];
    var phase=phaseByIndex[index==null?4:index];
    var cx=32,cy=32,r=18;
    var k=(1-Math.cos(2*Math.PI*phase))/2;
    var shadow='';
    if(k<0.02){
      shadow='<circle cx="32" cy="32" r="18" fill="rgba(10,14,30,.97)"/>';
    } else if(k<0.98){
      var shadowPhase=(0.5-phase+1)%1;
      var waxing=shadowPhase<0.5;
      var ex=Math.cos(2*Math.PI*shadowPhase)*r;
      var rx=Math.abs(ex).toFixed(2);
      var T=(cy-r).toFixed(2),B=(cy+r).toFixed(2),X=cx.toFixed(2);
      var d;
      if(waxing){
        if(ex>0) d='M '+X+' '+T+' A '+r+' '+r+' 0 0 0 '+X+' '+B+' A '+rx+' '+r+' 0 0 1 '+X+' '+T+' Z';
        else     d='M '+X+' '+T+' A '+r+' '+r+' 0 0 0 '+X+' '+B+' A '+rx+' '+r+' 0 0 0 '+X+' '+T+' Z';
      } else {
        if(ex>0) d='M '+X+' '+T+' A '+r+' '+r+' 0 0 1 '+X+' '+B+' A '+rx+' '+r+' 0 0 0 '+X+' '+T+' Z';
        else     d='M '+X+' '+T+' A '+r+' '+r+' 0 0 1 '+X+' '+B+' A '+rx+' '+r+' 0 0 1 '+X+' '+T+' Z';
      }
      shadow='<path d="'+d+'" fill="rgba(10,14,30,.97)"/>';
    }
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
      +'<defs>'
      +'<radialGradient id="moonGlow" cx="40%" cy="35%" r="65%">'
      +'<stop offset="0%" stop-color="rgba(255,255,255,.98)"/>'
      +'<stop offset="58%" stop-color="rgba(217,227,255,.96)"/>'
      +'<stop offset="100%" stop-color="rgba(176,190,238,.92)"/>'
      +'</radialGradient>'
      +'<filter id="moonBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>'
      +'<clipPath id="moonClip"><circle cx="32" cy="32" r="18"/></clipPath>'
      +'</defs>'
      +'<circle cx="32" cy="32" r="24" fill="rgba(175,190,255,.12)" filter="url(#moonBlur)"/>'
      +'<circle cx="32" cy="32" r="18" fill="url(#moonGlow)"/>'
      +'<g clip-path="url(#moonClip)">'+shadow+'</g>'
      +'</svg>';
  }

  function syncMoon(){
    if(!moonNode) return;
    try{
      var moon = (typeof currentMoon === 'function') ? currentMoon() : null;
      var index = moon && typeof moon.index === 'number' ? moon.index : 4;
      moonNode.innerHTML = moonSvgByIndex(index);
      moonNode.title = moon && moon.name ? moon.name : 'Mēness';
    }catch(_e){
      moonNode.innerHTML = moonSvgByIndex(4);
    }
  }


  function isAutoNight(){
    var h=(new Date()).getHours();
    return h >= 0 && h < 8;
  }

  function autoStrength(){
    var now = new Date();
    var minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < 0 || minutes >= 480) return 0;
    if (minutes < 270) return 1;
    var t = (minutes - 270) / 210;
    return Math.max(0.06, 1 - t);
  }

  function applyStrength(visible){
    var host = container();
    if(!host) return;
    var strength = 0;
    if (isAutoNight()) strength = autoStrength();
    else if (manualOn) strength = 0.86;
    host.style.setProperty('--stars-overlay-opacity', visible ? String(strength) : '0');
  }

  function apply(){
    var on = manualOn || isAutoNight();
    document.body.classList.toggle('stars-active', on);
    if(on){ ensureStars(); startStars(); } else if(generated) stopStars();
    applyStrength(on);
  }

  window.__setStarsManual = function(on){
    manualOn = !!on;
    try { localStorage.setItem(STORAGE_KEY, manualOn ? '1' : '0'); } catch(_e) {}
    apply();
  };

  window.__syncStarsOverlay = function(){
    apply();
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', apply, { once:true });
  } else {
    apply();
  }
  setInterval(function(){ if(!document.hidden) apply(); }, 20 * 1000);
  window.addEventListener('focus', apply);
  window.addEventListener('resize', apply);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) apply(); });
})();
