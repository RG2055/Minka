/* NAKTS SADALÄªTÄ€JS v3 â€” timeline bar design with fatigue mini-graphs */
(function(){
  // /rad has its own night (js/rad-night.js): this module never loads there.
  if(window.MINKA_APP==='rad')return;
  var END=[{h:7,m:20,l:'07:20'},{h:7,m:30,l:'07:30'},{h:8,m:0,l:'08:00'}];
  var START=[{v:23,l:'23:00'},{v:23.5,l:'23:30'},{v:0,l:'00:00'},{v:0.5,l:'00:30'},{v:1,l:'01:00'}];
  // 8 hues, each ~45Â° apart on colour wheel â€” guaranteed visually distinct
  var COL=[
    {bg:'rgba(255,140,0,0.20)',   border:'rgba(255,165,50,0.60)',  accent:'#ffa032',glow:'rgba(255,160,50,0.35)',bed:'orange'},  // 0 orange
    {bg:'rgba(0,170,255,0.18)',   border:'rgba(30,200,255,0.60)',  accent:'#1ec8ff',glow:'rgba(0,200,255,0.30)',bed:'cyan'},   // 1 cyan
    {bg:'rgba(55,135,220,0.18)',  border:'rgba(85,170,245,0.60)',  accent:'#55aaf5',glow:'rgba(70,155,235,0.30)',bed:'steel'},  // 2 steel blue
    {bg:'rgba(0,220,80,0.18)',    border:'rgba(0,240,100,0.60)',   accent:'#00f064',glow:'rgba(0,230,100,0.30)',bed:'green'},   // 3 green
    {bg:'rgba(255,30,90,0.18)',   border:'rgba(255,60,110,0.60)',  accent:'#ff3c6e',glow:'rgba(255,60,110,0.30)',bed:'pink'},  // 4 red-pink
    {bg:'rgba(240,210,0,0.18)',   border:'rgba(255,230,40,0.60)',  accent:'#ffe628',glow:'rgba(255,220,40,0.30)',bed:'yellow'},  // 5 yellow
    {bg:'rgba(0,210,190,0.18)',   border:'rgba(0,235,215,0.60)',   accent:'#00ebd7',glow:'rgba(0,225,200,0.30)',bed:'teal'},   // 6 teal
    {bg:'rgba(195,120,70,0.18)',  border:'rgba(220,145,90,0.60)',  accent:'#dc915a',glow:'rgba(205,130,80,0.30)',bed:'copper'}   // 7 copper
  ];
  // Hash full name to colour index â€” SAME person always gets SAME colour, no duplicates
  function _nameHash(name){
    var s=String(name||'').trim().toUpperCase(), h=0;
    for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))&0x7fffffff;
    return h;
  }
  // Track which hash-slots are used in current render to guarantee no duplicate colours per session
  var _usedHashes={};
  function getCol(name, skin){
    if(arguments.length < 2 && window.mkGetWorkerSkin) skin=window.mkGetWorkerSkin(name);
    var rgb=skin && (skin.num || (skin.t==='hue' && skin.rgb));
    if(rgb && /^\d{1,3}(,\d{1,3}){2}$/.test(String(rgb)) && String(rgb).split(',').every(function(n){return +n<=255;})){
      return {accent:'rgb('+rgb+')',border:'rgba('+rgb+',.6)',bg:'rgba('+rgb+',.18)',glow:'rgba('+rgb+',.3)',bed:'neutral',rgb:String(rgb)};
    }
    var key=String(name||'').trim().toUpperCase();
    if(!_usedHashes[key]){
      var base=_nameHash(key)%COL.length;
      // Find next free slot if this one is taken
      var used=Object.values(_usedHashes).map(function(v){return v.idx;});
      var idx=base;
      for(var tries=0;tries<COL.length;tries++){
        if(used.indexOf(idx)===-1)break;
        idx=(idx+1)%COL.length;
      }
      _usedHashes[key]={idx:idx,col:COL[idx]};
    }
    return _usedHashes[key].col;
  }
  function timelineColour(colour){
    if(!colour.rgb) return colour.accent;
    var rgb=colour.rgb.split(',').map(Number);
    var light=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    if(light>=105) return colour.accent;
    var mix=(105-light)/(255-light);
    return 'rgb('+rgb.map(function(n){return Math.round(n+(255-n)*mix);}).join(',')+')';
  }
  // Small, cached bitmaps keep bed tinting out of the animation/compositing loop.
  var _bedPixelsBySrc=new Map(), _bedTints=new Map(), _thumbTints=new Map();
  var _bedImages=new Map();
  function bedImage(url){
    if(!_bedImages.has(url)) _bedImages.set(url,new Promise(function(resolve,reject){
      var im=new Image(); if(!/^(blob|data):/.test(url)) im.crossOrigin='anonymous';
      // decoded off the main thread before it is drawn (drawImage would decode it there, in one go)
      im.onload=function(){ if(im.decode) im.decode().then(function(){ resolve(im); },function(){ resolve(im); }); else resolve(im); };
      im.onerror=function(){ _bedImages.delete(url); reject(new Error('image')); }; im.src=url;
    }));
    return _bedImages.get(url);
  }
  // Each linen zone's median light on the neutral bed (scripts/build-bed-linens.py).
  var LINEN_REF={ duvet:202.3, pillow:190.8, fold:210.8, sheet:192.8 };
  function linenShade(c,s){ return s<=1 ? c*s : c+(255-c)*Math.min(1,(s-1)*1.6); }
  /* "Like the card": the card's own picture on the duvet, its colour on the pillow,
     white sheets, all with the bed's shading. overlay = 'card|url|colours|rgb'. */
  function paintCardLinen(ctx,source,overlay){
    var part=overlay.split('|'), url=part[1], cols=(part[2]||'').split(';').filter(Boolean), pil=(part[3]||'200,200,205').split(',').map(Number);
    var w=source.width, h=source.height;
    function draw(pic){
      var mc=document.createElement('canvas'); mc.width=w; mc.height=h;
      var sc=document.createElement('canvas'); sc.width=w; sc.height=h;
      var mx=mc.getContext('2d',RW), sx=sc.getContext('2d',RW);
      mx.drawImage(pic.mask,0,0,w,h);
      // The picture covers the duvet's box (as a card's background covers the card).
      var bx=w*.06, by=h*.35, bw=w*.88, bh=h*.35;
      if(pic.skin){
        var iw=pic.skin.naturalWidth||1, ih=pic.skin.naturalHeight||1, k=Math.max(bw/iw,bh/ih);
        sx.drawImage(pic.skin,bx+(bw-iw*k)/2,by+(bh-ih*k)/2,iw*k,ih*k);
        // and on the pillow (its own box above the duvet's)
        var px0=w*.22, py0=h*.08, pw0=w*.57, ph0=h*.25, k2=Math.max(pw0/iw,ph0/ih);
        sx.save(); sx.beginPath(); sx.rect(px0,py0,pw0,ph0); sx.clip();
        sx.drawImage(pic.skin,px0+(pw0-iw*k2)/2,py0+(ph0-ih*k2)/2,iw*k2,ih*k2); sx.restore();
      } else {
        var g=sx.createLinearGradient(bx,by,bx+bw,by+bh);
        (cols.length?cols:['#5f95e6','#8fd6bf']).forEach(function(c,i,all){ g.addColorStop(all.length>1?i/(all.length-1):0,c); });
        sx.fillStyle=g; sx.fillRect(bx,by,bw,bh);
      }
      var m=mx.getImageData(0,0,w,h).data, sk=sx.getImageData(0,0,w,h).data, a=source.data;
      var out=ctx.getImageData(0,0,w,h), b=out.data;
      for(var i=0;i<b.length;i+=4){
        var al=m[i+3]/255; if(!al) continue;
        var du=m[i]/255, pi=m[i+1]/255, fo=m[i+2]/255, sh=Math.max(0,al-du-pi-fo), lum=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;
        var sD=lum/LINEN_REF.duvet, sP=lum/LINEN_REF.pillow, sF=lum/LINEN_REF.fold, sS=lum/LINEN_REF.sheet;
        for(var c=0;c<3;c++){
          var v=(du*linenShade(sk[i+c],sD)+pi*linenShade(pic.skin?sk[i+c]:pil[c],sP)+fo*linenShade(246,sF)+sh*linenShade(242,sS))/al;
          b[i+c]=b[i+c]*(1-al)+v*al;
        }
      }
      ctx.putImageData(out,0,0);
    }
    return Promise.all([bedImage('assets/rooms/beds/linen-mask-256.webp?v='+BED_V), url?bedImage(url).catch(function(){ return null; }):Promise.resolve(null)])
      .then(function(r){ try{ draw({mask:r[0],skin:r[1]}); } catch(_e){ draw({mask:r[0],skin:null}); } });
  }
  /* For the cats' duvet game (js/nakts-pets.js), made once per look and sleeper,
     each a URL of its own (the bed pictures' cache releases its URLs, and a bed
     left without its duvet must keep its picture):
     bare  the bed with no duvet, the sleeper on the sheet (nsBedParts' body);
     duvet the duvet alone, as it lies on the bed;
     slide the duvet sliding off the bed's side (the right; mirrored for the left);
     heap  the duvet crumpled on the floor;
     drag  four frames of it carried in a cat's teeth (a strip, one under another). */
  var BED_BARE='assets/rooms/bed-bare-256.webp';
  var _bedParts=new Map();
  function ownCopy(url){ return fetch(url).then(function(r){ return r.blob(); }).then(function(b){ return URL.createObjectURL(b); }); }
  function sleeperOf(bedEl){
    var sl=bedEl.querySelector('.ns-sleeper'), card=bedEl.querySelector('.ns-room-bed-card')||bedEl, cs=getComputedStyle(card);
    var m=/url\(\s*["']?([^"')]+)["']?\s*\)/.exec(cs.getPropertyValue('--mk-skin-img')||'');
    return { fig:sl&&sl.classList.contains('is-f')?'f':'m', pants:sl?sl.style.getPropertyValue('--pants').trim():'', accent:(cs.getPropertyValue('--nsc-accent')||'').trim(), url:m?m[1]:'' };
  }
  window.nsBedParts=function(bedEl){
    var img=bedEl && bedEl.querySelector('.ns-room-bed-picture img'), look=img && img.__look;
    if(!look) return Promise.reject(new Error('no bed look'));
    var who=look.who||sleeperOf(bedEl), body='bare|'+who.fig+'|'+who.pants+'|'+who.accent+'|'+who.url;
    var key=look.rgb+'|'+look.overlay+'|'+body;
    if(_bedParts.has(key)) return _bedParts.get(key);
    var cloth=duvetLook(look.overlay,look.rgb), out={};
    // one piece at a time, the page drawing its frames in between (no long freeze on an old PC)
    function rest(){ return new Promise(function(res){ setTimeout(res,16); }); }
    var job=tintedBed(look.rgb,BED_BARE,0,look.overlay,body).then(ownCopy).then(function(u){ out.bare=u; return rest(); })
      .then(function(){ return tintedBed(look.rgb,BED_BARE,0,look.overlay,'cloth|'+who.fig).then(ownCopy); }).then(function(u){ out.duvet=u; return rest(); })
      .then(function(){ return dressState('slide',cloth); }).then(function(u){ out.slide=u; return rest(); })
      .then(function(){ return dressState('floor',cloth); }).then(function(u){ out.heap=u; return rest(); })
      .then(function(){ return dressState('drag',cloth); }).then(function(u){ out.drag=u; return out; });
    _bedParts.set(key,job);
    if(_bedParts.size>10){
      var k0=_bedParts.keys().next().value, j0=_bedParts.get(k0); _bedParts.delete(k0);
      j0.then(function(p){ setTimeout(function(){ Object.keys(p).forEach(function(n){ URL.revokeObjectURL(p[n]); }); },600000); }).catch(function(){});
    }
    job.catch(function(){ if(_bedParts.get(key)===job) _bedParts.delete(key); });
    return job;
  };
  /* thumbW: a small copy for the studio's pictures, kept in its own cache so they
     never push the beds' own pictures out (whose URLs would then be released).
     overlay: a set of linen laid over the tinted bed (its picture, or 'card|...'),
     so the frame keeps the sleeper's colour and the linen has its own. */
  /* A person under the duvet: a real cloth simulated over a sleeper
     (scripts/blender/nakts_duvet.py), kept as two pictures: its light and shade,
     and where on the cloth each pixel is (UV). Any linen, card picture or colour
     is laid on it here, so every fold stays. mode: 'full' the dressed bed,
     'bare' the bed with no duvet (a flat sheet), 'cloth' the duvet alone. */
  var _duvetMaps=null;
  function duvetMaps(){
    if(!_duvetMaps){
      _duvetMaps=Promise.all([
        fetch('assets/rooms/beds/duvet.json?v='+BED_V).then(function(r){ return r.json(); }),
        fetch('assets/rooms/beds/linen-tex.json?v='+BED_V).then(function(r){ return r.json(); }),
        bedImage('assets/rooms/beds/linen-mask-256.webp?v='+BED_V)
      ]).then(function(r){ return { info:r[0], periods:r[1], mask:r[2] }; });
      _duvetMaps.catch(function(){ _duvetMaps=null; });
    }
    return _duvetMaps;
  }
  // The duvet over a man's or a woman's figure: its UV, the light of cloth and
  // figure, and what shows of the figure (the feet in their socks).
  var _bedCloth={};
  function bedCloth(fig){
    if(!_bedCloth[fig]){
      _bedCloth[fig]=Promise.all(['duvet-bed-'+fig+'-uv','duvet-bed-'+fig+'-shade','body-bed-'+fig+'-zone'].map(function(n){ return bedImage('assets/rooms/beds/'+n+'-256.webp?v='+BED_V); }));
      _bedCloth[fig].catch(function(){ delete _bedCloth[fig]; });
    }
    return _bedCloth[fig];
  }
  // 'full|m|…', 'bare|f|…', 'cloth|m': what to draw, over whom
  function modeOf(mode){ var p=String(mode===true?'full':mode||'').split('|'); return { kind:p[0], fig:p[1]==='f'?'f':'m' }; }
  /* Canvases whose pixels are read back are kept in memory (willReadFrequently):
     reading a GPU canvas stalls the page, long on old PCs. The maps are the same
     every time: their pixels are read once per size. */
  var RW={willReadFrequently:true};
  /* Markup about to be replaced: its CSS animations are taken out of the style
     first. The closed panel is rebuilt on every day switch with its animations
     paused, and a paused CSS animation on a removed node stays in the
     document's timeline and keeps that node, and with it the whole old panel
     (cards, LED canvases, room pictures, bed images): +55 nodes and several MB
     a switch. cancel() does not release it (measured with a heap snapshot);
     animation:none, applied while the node is still in the page, does. */
  function releaseAnims(el){
    try{
      if(!el || !el.getAnimations) return;
      var targets=[];
      el.getAnimations({subtree:true}).forEach(function(a){ var t=a.effect && a.effect.target; if(t && t.style && targets.indexOf(t)<0) targets.push(t); });
      targets.forEach(function(t){ t.style.setProperty('animation','none','important'); });
      targets.forEach(function(t){ void getComputedStyle(t).animationName; });   // applied now, before the node goes
    }catch(_e){}
  }
  var _pixels=new Map();
  function pixelsOf(im,w,h){
    var k=(im.currentSrc||im.src||'')+'|'+w+'x'+h, hit=_pixels.get(k);
    if(hit) return hit;
    var c=document.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d',RW); x.drawImage(im,0,0,w,h);
    var d=x.getImageData(0,0,w,h);
    if(k.charAt(0)!=='|' && k.indexOf('blob:')!==0){ _pixels.set(k,d); if(_pixels.size>24) _pixels.delete(_pixels.keys().next().value); }
    return d;
  }
  // What the duvet is made of: a linen set's cloth, the card's picture, or the sleeper's colour.
  function duvetLook(overlay,rgb){
    if(overlay && overlay.indexOf('card|')===0){
      var part=overlay.split('|');
      return { url:part[1]||'', cols:(part[2]||'').split(';').filter(Boolean), cover:true };
    }
    var m=/linen-([a-z]+)-256/.exec(overlay||'');
    if(m) return { url:'assets/rooms/beds/linen-tex-'+m[1]+'.webp?v='+BED_V, id:m[1] };
    var ch=String(rgb||'200,200,205').split(',').map(function(n){ var c=64+Number(n)*.68; return Math.round(c+(255-c)*(0.8-0.65)/0.35); });
    return { colour:ch };
  }
  function lookPixels(look){
    if(look.url) return bedImage(look.url).then(function(im){
      var tw=256, th=256;
      if(look.cover){ var iw=im.naturalWidth||1, ih=im.naturalHeight||1, k=256/Math.max(iw,ih); tw=Math.max(8,Math.round(iw*k)); th=Math.max(8,Math.round(ih*k)); }
      return { data:pixelsOf(im,tw,th).data, w:tw, h:th };
    }).catch(function(){ return null; });
    if(look.cols && look.cols.length){
      var c=document.createElement('canvas'); c.width=c.height=128; var x=c.getContext('2d',RW), g=x.createLinearGradient(0,0,128,128);
      look.cols.forEach(function(col,i,all){ g.addColorStop(all.length>1?i/(all.length-1):0,col); });
      x.fillStyle=g; x.fillRect(0,0,128,128);
      return Promise.resolve({ data:x.getImageData(0,0,128,128).data, w:128, h:128, cover:true });
    }
    return Promise.resolve(null);
  }
  /* Where on the linen or picture a point of the cloth is. The UV runs from the
     bed's right (u 0) to its left and from the duvet's top edge (v 0) to its foot,
     so u is turned round: prints and pictures read the right way. A card picture
     shows on the duvet's top as it shows on the card (its crop at the card's
     shape, centred), and carries on over the sides. */
  var CARD_ASPECT=1.69, DUVET_TOP=[0.12,0.88,0,1];
  function clothSampler(look,tex,info,periods,state){
    var col=look.colour||[200,200,205];
    if(!tex) return function(u,v,o){ o[0]=col[0]; o[1]=col[1]; o[2]=col[2]; };
    var size=(info.sizes&&info.sizes[state])||info.cloth;      // prints keep their size on every state
    var period=look.id?(periods[look.id]||200):0, cw=size[0]*info.ppm, cd=size[1]*info.ppm;
    var repU=period?cw/period:1, repV=period?cd/period:1, cover=look.cover||tex.cover;
    var ia=tex.w/tex.h, fw=ia>CARD_ASPECT?CARD_ASPECT/ia:1, fh=ia>CARD_ASPECT?1:ia/CARD_ASPECT, fx=(1-fw)/2, fy=(1-fh)/2;
    var U0=DUVET_TOP[0], U1=DUVET_TOP[1], V0=DUVET_TOP[2], V1=DUVET_TOP[3], W=tex.w, H=tex.h, d=tex.data;
    return function(u,v,o){
      var tu, tv;
      if(cover){ tu=fx+(U1-u)/(U1-U0)*fw; tv=fy+(v-V0)/(V1-V0)*fh; tu=tu<0?0:tu>1?1:tu; tv=tv<0?0:tv>1?1:tv; }
      else { tu=((1-u)*repU)%1; tv=(v*repV)%1; }
      var j=(Math.min(H-1,Math.floor(tv*H))*W+Math.min(W-1,Math.floor(tu*W)))*4;
      o[0]=d[j]; o[1]=d[j+1]; o[2]=d[j+2];
    };
  }
  var _clothMaps={};
  function clothMaps(state){
    if(!_clothMaps[state]){
      _clothMaps[state]=Promise.all([bedImage('assets/rooms/beds/duvet-'+state+'-uv.webp?v='+BED_V), bedImage('assets/rooms/beds/duvet-'+state+'-shade.webp?v='+BED_V)]);
      _clothMaps[state].catch(function(){ delete _clothMaps[state]; });
    }
    return _clothMaps[state];
  }
  // A duvet state on its own: the cloth dressed, and the shadow it casts.
  var STATE_SCALE=(window.devicePixelRatio||1)>=1.5?1:0.5;   // the maps are drawn for 2x screens
  function dressState(state,look){
    return Promise.all([clothMaps(state), duvetMaps(), lookPixels(look)]).then(function(r){
      var uvIm=r[0][0], w=Math.round(uvIm.naturalWidth*STATE_SCALE), h=Math.round(uvIm.naturalHeight*STATE_SCALE), info=r[1].info, tex=r[2];
      var uv=pixelsOf(uvIm,w,h).data, sh=pixelsOf(r[0][1],w,h).data, ref=(info.refs&&info.refs[state])||info.ref||0.74;
      var c=document.createElement('canvas'); c.width=w; c.height=h;
      var x=c.getContext('2d'), out=x.createImageData(w,h), a=out.data, sample=clothSampler(look,tex,info,r[1].periods,state), px=[0,0,0];
      for(var i=0;i<a.length;i+=4){
        var cA=uv[i+3]/255, sA=sh[i+3]/255*(1-cA);
        if(cA<=0){ if(sA>0) a[i+3]=Math.round(sA*.5*255); continue; }
        sample(uv[i]/255,uv[i+1]/255,px);
        var L=Math.min(1.5,sh[i]/255/ref);
        a[i]=Math.min(255,px[0]*L); a[i+1]=Math.min(255,px[1]*L); a[i+2]=Math.min(255,px[2]*L); a[i+3]=Math.round(Math.min(1,cA+sA*.5)*255);
      }
      x.putImageData(out,0,0);
      return new Promise(function(res){ c.toBlob(function(bl){ res(URL.createObjectURL(bl)); },'image/png'); });
    });
  }
  /* The bed dressed for a sleeper (the bare bed's picture, its duvet and fold now a
     flat sheet): 'full' the duvet over their figure, the feet out of its end;
     'bare' no duvet, the figure (paintBody); 'cloth' the duvet alone. */
  function dressDuvet(ctx,source,overlay,rgb,mode){
    var m=modeOf(mode), bare=m.kind==='bare', only=m.kind==='cloth';
    return Promise.all([duvetMaps(), bare?null:bedCloth(m.fig)]).then(function(r){
      var maps=r[0], cm=r[1], look=duvetLook(overlay,rgb), info=maps.info;
      return lookPixels(look).then(function(tex){
        var w=ctx.canvas.width, h=ctx.canvas.height, mask=pixelsOf(maps.mask,w,h).data;
        var uv=cm?pixelsOf(cm[0],w,h).data:null, sh=cm?pixelsOf(cm[1],w,h).data:null, zn=cm?pixelsOf(cm[2],w,h).data:null;
        var img=ctx.getImageData(0,0,w,h), a=img.data, s=source.data;
        var ref=(info.bed&&info.bed[m.fig])||info.ref||0.74, sample=clothSampler(look,tex,info,maps.periods,'bed'), px=[0,0,0];
        var foot=Math.round(h*497/728)*w*4, ch=String(rgb||'200,200,205').split(',').map(function(n){ return 64+Number(n)*.68; });
        for(var i=0;i<a.length;i+=4){
          if(only){ a[i]=a[i+1]=a[i+2]=0; a[i+3]=0; }
          else {
            // the linen's duvet and fold give way to a flat sheet on the mattress, and the
            // footboard's top shows where they covered it
            var k=Math.min(1,(mask[i]+mask[i+2])/255);
            if(k>0){ var sl=(s[i]*.2126+s[i+1]*.7152+s[i+2]*.0722)/LINEN_REF.duvet;
              if(i>=foot){ var lt=sl*LINEN_REF.duvet/255;
                for(var q=0;q<3;q++){ var tc=lt<.65?ch[q]*lt/.65:ch[q]+(255-ch[q])*(lt-.65)/.35; a[i+q]=a[i+q]*(1-k)+tc*k; } }
              else { a[i]=a[i]*(1-k)+linenShade(236,sl)*k; a[i+1]=a[i+1]*(1-k)+linenShade(236,sl)*k; a[i+2]=a[i+2]*(1-k)+linenShade(244,sl)*k; }
              a[i+3]=s[i+3]; }
            if(bare) continue;
          }
          var cA=uv[i+3]/255, fA=zn[i+3]/255, sA=sh[i+3]/255*(1-Math.max(cA,fA));
          if(sA>0 && !only){ var d=1-sA*0.55; a[i]*=d; a[i+1]*=d; a[i+2]*=d; }
          if(cA<=0) continue;
          sample(uv[i]/255,uv[i+1]/255,px);
          var L=Math.min(1.5,sh[i]/255/ref);
          if(only){ a[i]=Math.min(255,px[0]*L); a[i+1]=Math.min(255,px[1]*L); a[i+2]=Math.min(255,px[2]*L); a[i+3]=Math.round(cA*255); }
          else { a[i]=a[i]*(1-cA)+Math.min(255,px[0]*L)*cA; a[i+1]=a[i+1]*(1-cA)+Math.min(255,px[1]*L)*cA; a[i+2]=a[i+2]*(1-cA)+Math.min(255,px[2]*L)*cA;
            if(a[i+3]<cA*255) a[i+3]=Math.round(cA*255); }     // the bed picture's seams do not show through
        }
        ctx.putImageData(img,0,0);
        if(m.kind==='full') return paintBody(ctx,mode,{ shade:cm[1], zone:cm[2], ref:ref, shadow:false });
      });
    });
  }
  /* The sleeper without the duvet (scripts/blender/nakts_duvet.py 'body'): a man's
     or a woman's figure, its light and which garment each pixel is. The T-shirt and
     socks wear the card's picture (or its colour), the trousers their own colour,
     arms and hands the emoji yellow; the figure's shadow falls on the sheet and pillow.
     mode: 'bare|m or f|trousers #hex|card colour|picture url'. */
  var SLEEPER_SKIN=[255,200,61];
  var _bodyMaps={};
  function bodyMaps(fig){
    if(!_bodyMaps[fig]){
      _bodyMaps[fig]=Promise.all([bedImage('assets/rooms/beds/body-'+fig+'-shade-256.webp?v='+BED_V), bedImage('assets/rooms/beds/body-'+fig+'-zone-256.webp?v='+BED_V)]);
      _bodyMaps[fig].catch(function(){ delete _bodyMaps[fig]; });
    }
    return _bodyMaps[fig];
  }
  function colourRgb(c){
    c=String(c||'').trim();
    var m=/^#?([0-9a-f]{6})$/i.exec(c); if(m){ var n=parseInt(m[1],16); return [n>>16&255,n>>8&255,n&255]; }
    m=/^#([0-9a-f]{3})$/i.exec(c); if(m) return m[1].split('').map(function(h){ return parseInt(h+h,16); });
    m=/rgba?\(([^)]+)\)/.exec(c); if(m){ var p=m[1].split(/[\s,/]+/).map(parseFloat); return [p[0]||0,p[1]||0,p[2]||0]; }
    return null;
  }
  function pictureIn(pic,w,h,box){
    var c=document.createElement('canvas'); c.width=w; c.height=h;
    var x=c.getContext('2d',RW), iw=pic.naturalWidth||1, ih=pic.naturalHeight||1, bw=box[2]-box[0]+1, bh=box[3]-box[1]+1, k=Math.max(bw/iw,bh/ih);
    x.drawImage(pic,box[0]+(bw-iw*k)/2,box[1]+(bh-ih*k)/2,iw*k,ih*k);
    return x.getImageData(0,0,w,h).data;
  }
  function paintBody(ctx,mode,given){
    var p=String(mode).split('|'), fig=p[1]==='f'?'f':'m', pants=colourRgb(p[2])||[59,64,72], accent=colourRgb(p[3])||[120,170,190], url=p.slice(4).join('|');
    var own=given?Promise.resolve([given.shade,given.zone]):bodyMaps(fig), shadow=!given||given.shadow!==false;
    return Promise.all([own, url?bedImage(url).catch(function(){ return null; }):null, duvetMaps()]).then(function(r){
      var w=ctx.canvas.width, h=ctx.canvas.height, sh=pixelsOf(r[0][0],w,h).data, zn=pixelsOf(r[0][1],w,h).data, ref=given&&given.ref||r[2].info.body||0.73;
      var shirtBox=[w,h,0,0], sockBox=[w,h,0,0], i, x, y;
      for(i=0;i<zn.length;i+=4){
        if(zn[i+3]<128) continue;
        x=(i>>2)%w; y=(i>>2)/w|0;
        var b=zn[i]>128?shirtBox:(zn[i]+zn[i+1]+zn[i+2]<60?sockBox:null);
        if(b){ if(x<b[0]) b[0]=x; if(y<b[1]) b[1]=y; if(x>b[2]) b[2]=x; if(y>b[3]) b[3]=y; }
      }
      var shirt=r[1]&&shirtBox[2]>shirtBox[0]?pictureIn(r[1],w,h,shirtBox):null, socks=r[1]&&sockBox[2]>sockBox[0]?pictureIn(r[1],w,h,sockBox):null;
      var img=ctx.getImageData(0,0,w,h), a=img.data;
      for(i=0;i<a.length;i+=4){
        var cov=zn[i+3]/255, sA=shadow?sh[i+3]/255*(1-cov):0;
        if(sA>0){ var d=1-sA*.5; a[i]*=d; a[i+1]*=d; a[i+2]*=d; }
        if(cov<=0) continue;
        var zr=zn[i]/255, zg=zn[i+1]/255, zb=zn[i+2]/255, zs=Math.max(0,1-zr-zg-zb), L=Math.min(1.6,sh[i]/255/ref);
        for(var c=0;c<3;c++){
          var v=zr*(shirt?shirt[i+c]:accent[c])+zg*pants[c]+zb*SLEEPER_SKIN[c]+zs*(socks?socks[i+c]:accent[c]);
          a[i+c]=a[i+c]*(1-cov)+Math.min(255,v*L)*cov;
        }
        if(a[i+3]<cov*255) a[i+3]=Math.round(cov*255);
      }
      ctx.putImageData(img,0,0);
    });
  }
  function tintedBed(rgb,src,thumbW,overlay,sleeper){
    if(sleeper===true) sleeper='full';
    src=src||(sleeper?BED_BARE:'assets/rooms/bed-neutral-256.webp');
    var tkey=rgb+'|'+src+(thumbW?'|'+thumbW:'')+(overlay?'|'+overlay:'')+(sleeper?'|'+sleeper:''), cache=thumbW?_thumbTints:_bedTints;
    if(cache.has(tkey)) return cache.get(tkey);
    var pkey=src+(thumbW?'|'+thumbW:''), _bedPixels=_bedPixelsBySrc.get(pkey);
    if(!_bedPixels){ _bedPixels=new Promise(function(resolve,reject){
      var img=new Image();
      img.onload=function(){ (img.decode?img.decode().catch(function(){}):Promise.resolve()).then(function(){   // decoded off the main thread
        try {
          var cw=img.naturalWidth||256, chh=img.naturalHeight||364;
          if(thumbW && cw>thumbW){ chh=Math.round(chh*thumbW/cw); cw=thumbW; }
          var canvas=document.createElement('canvas');canvas.width=cw;canvas.height=chh;
          var ctx=canvas.getContext('2d',RW);ctx.drawImage(img,0,0,cw,chh);
          resolve(ctx.getImageData(0,0,cw,chh));
        } catch(err){reject(err);}
      }); };
      img.onerror=function(){_bedPixelsBySrc.delete(pkey);reject(new Error('Bed image unavailable'));};
      img.src=src;
    }); _bedPixelsBySrc.set(pkey,_bedPixels);
      if(_bedPixelsBySrc.size>48) _bedPixelsBySrc.delete(_bedPixelsBySrc.keys().next().value); }
    var task=_bedPixels.then(function(source){
      var canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
      var ctx=canvas.getContext('2d',RW), out=ctx.createImageData(source.width,source.height);
      var channels=rgb.split(',').map(function(n){return 64+Number(n)*.68;}), a=source.data, b=out.data;
      for(var i=0;i<a.length;i+=4){
        var light=(a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722)/255;
        for(var c=0;c<3;c++) b[i+c]=light<.65 ? channels[c]*light/.65 : channels[c]+(255-channels[c])*(light-.65)/.35;
        b[i+3]=a[i+3];
      }
      ctx.putImageData(out,0,0);
      var dressed=!overlay ? null
        : overlay.indexOf('card|')===0 ? paintCardLinen(ctx,source,overlay)
        : bedImage(overlay).then(function(ov){ ctx.drawImage(ov,0,0,canvas.width,canvas.height); });
      return (dressed||Promise.resolve()).then(function(){
        if(sleeper) return dressDuvet(ctx,source,overlay,rgb,sleeper);
      }).then(function(){
        if(String(sleeper).indexOf('bare|')===0) return paintBody(ctx,sleeper);
      }).then(encode);
      // toBlob encodes off the main thread; toDataURL did the PNG encode
      // synchronously for every bed colour, a visible hitch on old PCs.
      function encode(){ return new Promise(function(resolve){
        if(!canvas.toBlob) { resolve(canvas.toDataURL('image/png')); return; }
        canvas.toBlob(function(blob){ resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png')); },'image/png');
      }); }
    });
    if(thumbW && _thumbTints.size>=120){
      // The oldest thumbnail is long off the page: release it at once.
      var tk=_thumbTints.keys().next().value, tt=_thumbTints.get(tk);
      _thumbTints.delete(tk);
      tt.then(function(url){ if(String(url).indexOf('blob:')===0) URL.revokeObjectURL(url); }).catch(function(){});
    }
    if(!thumbW && _bedTints.size>=24){
      var oldKey=_bedTints.keys().next().value, oldTask=_bedTints.get(oldKey);
      _bedTints.delete(oldKey);
      // Beds still showing the old URL keep their decoded bitmap; the blob URL
      // is only released after they have moved on to a newer one.
      if(oldTask) oldTask.then(function(url){ if(String(url).indexOf('blob:')===0) setTimeout(function(){ URL.revokeObjectURL(url); },60000); }).catch(function(){});
    }
    cache.set(tkey,task);
    task.catch(function(){if(cache.get(tkey)===task)cache.delete(tkey);});
    return task;
  }
  /* Bed linen (scripts/build-bed-linens.py): pillow, sheet, fold and duvet as a
     picture of their own, laid over the bed tinted in the sleeper's colour, so
     the frame stays theirs and the linen has its own colours.
     [id, label, kind]: c the card's own picture, x dark, neon, shiny, space and
     radiology, p prints, f fabrics (ambientCG CC0). */
  var BED_STYLES=[['','Gluda','f'],['card','Kā kartiņa','c'],
    ['hearts','Sirsniņas','p'],['daisy','Margrietiņas','p'],['sky','Sapņu debesis','p'],['cherry','Ķirši','p'],['floral','Ziedi','p'],['starlight','Zvaigznes','p'],['balloons','Gaisa baloni','p'],['planes','Lidmašīnas','p'],['bluecheck','Zilās rūtiņas','p'],['mushrooms','Sēnes','p'],['dinos','Dinozauri','p'],['rainbows','Varavīksnes','p'],['cats','Kaķīši','p'],['lemons','Citroni','p'],['ward','Nodaļas','p'],['polka','Punktiņi','p'],['chevron','Zigzagi','p'],['patchwork','Lāpītā','p'],['colorstripe','Krāsu svītras','p'],['fish','Zivtiņas','p'],['bees','Bitītes','p'],['midnight','Melns satīns','x'],['winesatin','Vīna satīns','x'],['emerald','Smaragda samts','x'],['gold','Zelta folija','x'],['silver','Sudraba folija','x'],['holo','Hologramma','x'],['neon','Neons','x'],['neonhearts','Neona sirdis','x'],['glow','Spīd tumsā','x'],['space','Kosmoss','x'],['planets','Planētas','x'],['xray','Rentgens','x'],['radiology','Radioloģija','x'],['knit','Adījums','f'],['quilted','Stepēta','f'],['waffle','Vafeļu','f'],['tartan','Tartāns','f'],['gingham','Rūtiņas','f'],['stripes','Svītras','f'],['linen','Lins','f'],['jersey','Trikotāža','f'],['denim','Džinss','f'],['plush','Plīšs','f'],['wool','Vilna','f'],['flannel','Flanelis','f'],['buffalo','Lielās rūtis','f'],['mustard','Sinepju','f']];
  function bedStyleKind(id){ var b=BED_STYLES.filter(function(x){ return x[0]===id; })[0]; return b?b[2]:'f'; }
  function bedStyleOf(skin){ var id=skin&&skin.bed; return id&&BED_STYLES.some(function(b){return b[0]===id;})?id:''; }
  function bedStyleSrc(id,size){ return 'assets/rooms/beds/linen-'+id+'-'+size+'.webp?v='+BED_V; }
  // What to lay over the tinted bed for a set ('card|...' is painted from the sleeper's card).
  function linenOverlay(id,skin,rgb){
    if(!id) return '';
    if(id!=='card') return bedStyleSrc(id,256);
    var pic=(window.mkSkinPicture && window.mkSkinPicture(skin)) || {};
    var cols=String(pic.css||'').match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)||[];
    return 'card|'+(pic.url||'')+'|'+cols.slice(0,4).join(';')+'|'+(rgb||'200,200,205');
  }
  var BED_V='20260927b15';
  /* On the bed: an extra pillow (Poly Haven CC0 throw pillows) and a toy (a teddy and
     a bunny modelled in Blender, a rubber duck and a ball from Poly Haven), rendered
     from the bed's view at its scale (scripts/blender/bed_accessories.py).
     [file, label, width on the 512 px bed]; where they lie is set in CSS. */
  var BED_PILLOWS=[['','Nav',0,0,''],["kc-cat", "Kaķis", 162, 0, "k"],["kc-bunny", "Zaķis", 136, 0, "k"],["kc-bear", "Lācis", 166, 0, "k"],["kc-moon", "Mēness", 176, 0, "k"],["kc-sun", "Saule", 192, 0, "k"],["kc-cloud", "Mākonis", 219, 0, "k"],["kc-flower", "Zieds", 176, 0, "k"],["kc-avocado", "Avokado", 128, 0, "k"],["kc-cookie", "Cepums", 182, 0, "k"],["kc-donut", "Virtulis", 184, 0, "k"],["kc-strawberry", "Zemene", 157, 0, "k"],["kc-capsule", "Kapsula", 197, 0, "k"],["kc-bone", "Kauls", 192, 0, "k"],["kc-bolt", "Zibens", 116, 0, "k"],["kc-fish", "Zivs", 187, 0, "k"],["kc-rainbow", "Varavīksne", 222, 0, "k"],["pc-heart-hearts", "Sirsniņas, sirds", 177, 0, "p"],["pc-flower-daisy", "Margrietiņas, zieds", 176, 0, "p"],["pc-cloud-sky", "Debesis, mākonis", 219, 0, "p"],["pc-round-cherry", "Ķirši, apaļš", 166, 0, "p"],["pc-square-floral", "Ziedi, kvadrāts", 106, 0, "p"],["pc-moon-starlight", "Zvaigznes, mēness", 176, 0, "p"],["pc-hexagon-balloons", "Baloni, sešstūris", 165, 0, "p"],["pc-lumbar-planes", "Lidmašīnas, garenais", 131, 0, "p"],["pc-bolster-bluecheck", "Rūtiņas, veltnis", 196, 0, "p"],["pc-scallop-mushrooms", "Sēnes, robains", 182, 0, "p"],["pc-triangle-dinos", "Dinozauri, trīsstūris", 148, 0, "p"],["pc-oval-rainbows", "Varavīksnes, ovāls", 222, 0, "p"],["pc-cathead-cats", "Kaķīši, kaķis", 162, 0, "p"],["pc-diamond-lemons", "Citroni, rombs", 153, 0, "p"],["pc-squircle-ward", "Nodaļas, mīksts kvadrāts", 179, 0, "p"],["pc-star-polka", "Punktiņi, zvaigzne", 184, 0, "p"],["pc-bolster-chevron", "Zigzagi, veltnis", 196, 0, "p"],["pc-square-patchwork", "Lāpītā, kvadrāts", 106, 0, "p"],["pc-lumbar-colorstripe", "Krāsu svītras, garenais", 131, 0, "p"],["pc-fish-fish", "Zivtiņas, zivs", 187, 0, "p"],["pc-hexagon-bees", "Bitītes, sešstūris", 165, 0, "p"],["pc-round-space", "Kosmoss, apaļš", 166, 0, "p"],["pc-bone-xray", "Rentgens, kauls", 192, 0, "p"],["pc-squircle-radiology", "Radioloģija, mīksts kvadrāts", 179, 0, "p"],["pc-heart-neon", "Neons, sirds", 177, 0, "p"],["pc-star-glow", "Spīd tumsā, zvaigzne", 184, 0, "p"],["fc-square-knit", "Kvadrāts adīts", 106, 1, "f"],["fc-round-waffle", "Apaļš vafeļu", 166, 1, "f"],["fc-bolster-tartan", "Veltnis tartāns", 196, 1, "f"],["fc-heart-plush", "Sirds plīša", 177, 1, "f"],["fc-star-knit", "Zvaigzne adīts", 184, 1, "f"],["fc-lumbar-waffle", "Garenais vafeļu", 131, 1, "f"],["fc-squircle-tartan", "Mīksts kvadrāts tartāns", 179, 1, "f"],["fc-oval-plush", "Ovāls plīša", 222, 1, "f"],["pillow-1", "Zigzags", 180, 0, "o"],["pillow-2", "Zigzags šķībi", 182, 0, "o"],
    /* emoji balloons as cushions (Emoji Balloons Pack, DESIGNRIP, CC BY 4.0) — added at the end, so saved choices keep their numbers */
    ["bl-b01", "Balons: smaids", 170, 0, "b"], ["bl-b02", "Balons: smaids", 170, 0, "b"], ["bl-b03", "Balons: prieks", 170, 0, "b"], ["bl-b04", "Balons: mirkšķis", 170, 0, "b"], ["bl-b05", "Balons: smiekli", 170, 0, "b"], ["bl-b06", "Balons: plats smaids", 170, 0, "b"], ["bl-b07", "Balons: svilpo", 170, 0, "b"], ["bl-b08", "Balons: dusmas", 170, 0, "b"], ["bl-b09", "Balons: acis uz augšu", 170, 0, "b"], ["bl-b10", "Balons: neveikli", 170, 0, "b"], ["bl-b11", "Balons: mierīgs", 170, 0, "b"], ["bl-b12", "Balons: smejas", 170, 0, "b"], ["bl-b13", "Balons: neitrāls", 170, 0, "b"], ["bl-b14", "Balons: mēle", 170, 0, "b"], ["bl-b15", "Balons: mēle ārā", 170, 0, "b"], ["bl-b16", "Balons: miegains", 170, 0, "b"], ["bl-b17", "Balons: bēdīgs", 170, 0, "b"], ["bl-b18", "Balons: prieka asaras", 170, 0, "b"], ["bl-b19", "Balons: raud", 170, 0, "b"], ["bl-b20", "Balons: siekalas", 170, 0, "b"], ["bl-b21", "Balons: buča", 170, 0, "b"], ["bl-b22", "Balons: iemīlējies", 170, 0, "b"], ["bl-b23", "Balons: satraukts", 170, 0, "b"], ["bl-b24", "Balons: slikti", 170, 0, "b"], ["bl-b25", "Balons: bučo", 170, 0, "b"], ["bl-b26", "Balons: maska", 170, 0, "b"], ["bl-b27", "Balons: nauda", 170, 0, "b"]];
  var BED_TOYS=[['','Nav',0],["toy-teddy", "Lācītis", 94],["toy-teddy-cream", "Krēmīgais lācītis", 94],["toy-teddy-grey", "Pelēkais lācītis", 94],["toy-panda", "Panda", 94],["toy-koala", "Koala", 91],["toy-bunny", "Zaķītis", 77],["toy-cat", "Kaķītis", 85],["toy-cat-black", "Melnais kaķītis", 85],["toy-dog", "Sunītis", 79],["toy-fox", "Lapsiņa", 95],["toy-raccoon", "Jenots", 107],["toy-lion", "Lauva", 89],["toy-monkey", "Pērtiķis", 95],["toy-pig", "Sivēns", 86],["toy-cow", "Gotiņa", 90],["toy-sheep", "Aitiņa", 96],["toy-unicorn", "Vienradzis", 89],["toy-elephant", "Zilonītis", 83],["toy-dino", "Dinozaurs", 81],["toy-penguin", "Pingvīns", 94],["toy-owl", "Pūce", 81],["toy-chick", "Cālītis", 88],["toy-duck", "Pīlīte", 66],["toy-mouse", "Pelīte", 68],["toy-hamster", "Kāmis", 81],["toy-hedgehog", "Ezītis", 81],["toy-frog", "Vardīte", 97],["toy-turtle", "Bruņurupucis", 96],["toy-ladybug", "Mārīte", 80],["toy-bee", "Bitīte", 86],["toy-whale", "Valis", 117],["toy-dolphin", "Delfīns", 70],["toy-seal", "Ronis", 96],["toy-octopus", "Astoņkājis", 182],["toy-star", "Zvaigzne", 176],["toy-heart", "Sirsniņa", 169],["toy-cloud", "Mākonītis", 219]];
  // Fabric cushions come in neutral grey; each gets its own colour (neighbours differ).
  var CUSHION_RGB=['224,165,38','127,184,230','200,50,60','241,157,176','98,184,122','242,138,60','47,99,179','31,157,143','246,212,78','86,101,122','201,111,74','143,174,139','224,72,72','74,163,223'];
  function cushionRgb(file){ var i=BED_PILLOWS.filter(function(p){ return p[3]; }).map(function(p){ return p[0]; }).indexOf(file); return CUSHION_RGB[(i<0?0:i)%CUSHION_RGB.length]; }
  function bedAccSrc(id){ return 'assets/rooms/beds/acc-'+id+'.webp?v='+BED_V; }
  function accOf(list,v){ var n=+v||0; return n>0&&n<list.length?list[n]:null; }
  function applyBedAcc(el,skin){
    var card=el.querySelector('.ns-room-bed-card'); if(!card) return;
    var rgb=null;
    [['pillow',accOf(BED_PILLOWS,skin&&skin.bq)],['toy',accOf(BED_TOYS,skin&&skin.bp)]].forEach(function(pair){
      var node=card.querySelector('.ns-bed-acc.is-'+pair[0]), it=pair[1];
      if(!it){ if(node) node.remove(); return; }
      if(!node){ node=document.createElement('img'); node.className='ns-bed-acc is-'+pair[0]; node.alt=''; node.draggable=false; node.decoding='async'; card.appendChild(node); }
      var src=bedAccSrc(it[0]);
      if(it[3]){
        rgb=cushionRgb(it[0]);
        var tk=src+'|'+rgb;
        if(node.__tk!==tk){ node.__tk=tk; node.style.setProperty('--acc-w',(it[2]/512*100).toFixed(1)+'%'); node.dataset.acc=it[0];
          tintedBed(rgb,src).then(function(u){ if(node.__tk!==tk) return; node.src=u; node.classList.remove('is-new'); void node.offsetWidth; node.classList.add('is-new'); }).catch(function(){ node.src=src; }); }
        return;
      }
      node.__tk='';
      if(node.getAttribute('src')!==src){ node.src=src; node.style.setProperty('--acc-w',(it[2]/512*100).toFixed(1)+'%'); node.dataset.acc=it[0]; node.classList.remove('is-new'); void node.offsetWidth; node.classList.add('is-new'); }
    });
  }
  window.__nsBedStyles={ styles:BED_STYLES, pillows:BED_PILLOWS, toys:BED_TOYS, src:bedStyleSrc };
  window.nsApplyWorkerColour=function(el,skin){
    if(!el.classList.contains('nsc-full-card') && !el.classList.contains('ns-room-bed')) return;
    var colour=getCol(el.getAttribute('data-worker'),skin);
    el.style.setProperty('--nsc-accent',colour.accent);
    var fog=colour.rgb ? colour.rgb.split(',').map(function(n){return Math.round(72+Number(n)*.62);}).join(',') : '112,164,190';
    el.style.setProperty('--nsc-fog',fog);
    if(!el.classList.contains('ns-room-bed')) return;
    dreamRev++;                                  // their look may change their dream
    el.dataset.accent=colour.accent;
    var channels=colour.rgb ? colour.rgb.split(',').map(Number) : null;
    var dark=channels && channels[0]*.2126+channels[1]*.7152+channels[2]*.0722<120;
    el.style.setProperty('--ns-bed-label',dark?'#f0f7fa':'#08121a');
    var frame=el.querySelector('.ns-room-bed-card'), img=el.querySelector('.ns-room-bed-picture img');
    if(frame){frame.style.setProperty('--bed',colour.accent);frame.style.setProperty('--bed-border',colour.border);}
    var style=bedStyleOf(skin);
    // A look with a picture and no linen chosen: the picture is the linen (painted into the
    // bed, so it rises over the sleeper like the rest), not a flat patch on top.
    if(!style && skin && /^(img|art|grad)$/.test(String(skin.t||''))) style='card';
    // A styled bed wears its own bedding: the look's picture is not cropped onto it.
    el.classList.toggle('has-bed-style',!!style);
    applyBedAcc(el,skin);
    if(!img) return;
    var preset='assets/rooms/bed-'+colour.bed+'-256.webp';
    // The sleeper's colour (their own, or their preset tone's accent).
    var rgb=colour.rgb || (/^#[0-9a-f]{6}$/i.test(colour.accent||'') ? [1,3,5].map(function(i){ return parseInt(colour.accent.slice(i,i+2),16); }).join(',') : '');
    var overlay=linenOverlay(style,skin,rgb);
    // who sleeps here: a man's or a woman's figure, their trousers, their card's look on T-shirt and socks
    var sl=el.querySelector('.ns-sleeper'), pic=(window.mkSkinPicture && skin && window.mkSkinPicture(skin)) || {};
    var who={ fig:sl&&sl.classList.contains('is-f')?'f':'m', pants:sl?sl.style.getPropertyValue('--pants').trim():'', accent:colour.accent||'', url:pic.url||'' };
    var dress='full|'+who.fig+'|'+who.pants+'|'+who.accent+'|'+who.url;
    var key=(overlay ? 'linen:'+overlay+'|' : '')+(colour.rgb || colour.bed)+'|'+dress;
    // While a cat has the duvet off (js/nakts-pets.js) the bed shows its bare picture:
    // the new dressed one waits until the duvet is back (img.__dressed).
    var off=el.classList.contains('ns-duvet-off');
    if((off?img.__dressedKey:img.__tintKey)===key)return;
    if(off) img.__dressedKey=key; else img.__tintKey=key;
    // The bed in the sleeper's colour, the linen laid over it, the duvet over the sleeper.
    if(!img.getAttribute('src')) img.src=preset;
    if(!off) img.__look={ rgb:rgb||'200,200,205', overlay:overlay, who:who };
    tintedBed(rgb||'200,200,205',BED_BARE,0,overlay,dress).then(function(url){
      if(el.classList.contains('ns-duvet-off')){ if(img.__dressedKey===key) img.__dressed={ src:url, key:key }; return; }
      if(img.__tintKey===key){ img.removeAttribute('srcset'); img.src=url; }
    }).catch(function(){ if(img.__tintKey===key) img.__tintKey=null; });
  };
  /* The bed by the chalkboard wears a different set every day (the same one all day). */
  function dressCareBed(root){
    var img=(root||document).querySelector('#nsPanel .ns-bedcare-bed .ns-room-bed-picture img'); if(!img) return;
    var d=new Date(), day=d.getFullYear()*1000+Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);
    var pool=BED_STYLES.filter(function(b){ return b[0] && b[2]!=='c'; });
    var h=day*2654435761>>>0, id=pool[h%pool.length][0], key='care:'+id;
    if(img.__tintKey===key) return;
    img.__tintKey=key;
    tintedBed('214,214,220',undefined,0,bedStyleSrc(id,256)).then(function(url){ if(img.__tintKey===key){ img.removeAttribute('srcset'); img.src=url; } }).catch(function(){ img.__tintKey=null; });
  }
  // Reset used-colours each time a new day is selected (called from update())
  function resetColours(){_usedHashes={};}
  var st=null;
  var _nsLastRoomHtml='';
  var _nsSortMode='fatigue'; // 'fatigue' (default) | 'freq' (by history stats)
  var _nsRaffle={open:false,workers:[],selected:-1,parts:[],results:[],revealing:false,revealIndex:-1,revealPart:null,revealToken:0};
  var NS_STORE_KEY='minkaNightSplitByDateV1';
  var NS_ROOM_LEGACY_STORE_KEY='minkaNightRoomByDateV1';
  var NS_ROOM_KEY_PREFIX='nsrooms::';
  var NS_ROOM_API_PATH='/api/ns-rooms';
  var NS_BED_CARE_API_PATH='/api/bed-care';
  var NS_BED_CARE_STORE_KEY='minkaBedCareV1';
  var NS_BED_CARE_ITEMS=[{key:'all',label:'Gultas veļa',icon:'▤'}];
  var _nsBedCareState=null;
  var _nsBedCareLoading=null;
  var _nsBedCareOutside=null;
  var _nsBedCareKeydown=null;
  var NS_CHALKBOARD_WORKER='SYSTEM-CHALKBOARD';
  var NS_CHALKBOARD_STORE_KEY='minkaNightChalkboardV1';
  var _nsChalkboardState=null;
  var _nsChalkboardLoading=null;
  var _nsSharedCloudPulledAt=0;
  var _nsFitRaf=0;
  var _nsIdleRender=0;
  var _nsPendingRenderKey='';
  var _nsLastRenderKey='';
  var ROOM_BED_KEYS=['main_left_top','main_left_bottom','main_right_top','nmp_center'];
  var ROOM_SLOTS={
    // As before: two beds one above the other on the left, one at the back on
    // the right; the NMP bed in the middle. They fill the visible floor
    // (10.5 % to the front wall's top at 85.8 % of the rendered room).
    'is-left':{x:21.7,y:29.3,w:19.6,scale:1,z:24},
    'is-right-top':{x:20.2,y:66.9,w:19.6,scale:1,z:28},
    'is-right-bottom':{x:78.3,y:29.3,w:19.6,scale:1,z:22},
    'is-center':{x:50,y:48,w:37.1,scale:1,z:25}
  };
  // ── Vēsturiskā nakts statistika (kurš ņem kuru daļu / kurā gultā guļ) ──
  // Lasa apkopojumu caur Minka API; Google Apps Script URL paliek Cloudflare secretā.
  var NS_STATS_API_PATH='/api/ns-stats';
  var NS_STATS_CACHE_KEY='minkaNightStatsV1';
  var NS_STATS_TTL=12*3600*1000;
  var _nsStats=null, _nsStatsPromise=null, _nsStatsAt=0, _nsStatsRetryAt=0;
  var _nsStatsRenderVersion=0;
  var NS_STATS_TIMEOUT=15000;
  var NS_BED_LABEL={main_left_top:'Galvenā · augšā',main_left_bottom:'Galvenā · apakšā',main_right_top:'Galvenā · pa labi',nmp_center:'Jaunais NMP'};

  // Header icon: the dock's own Nakts icon in the chosen icon set (one icon
  // everywhere); the RG mark only when the shell is not there to ask.
  function nsHeadIcon(){
    var icon='';
    try{ if(window.parent!==window && window.parent.__mkDockIcon) icon=window.parent.__mkDockIcon('nsToggleBtnParent'); }catch(_e){}
    return icon
      ? '<span class="ns-brand-mark ns-dock-icon" aria-hidden="true">'+icon+'</span>'
      : '<img class="ns-brand-mark" src="../data/rg-brand.svg?v=20260924d1" width="35" height="35" alt="" aria-hidden="true">';
  }

  function nsValidStats(data){
    return !!(data && data.ok && data.parts && typeof data.parts==='object' && !Array.isArray(data.parts));
  }

  function nsCachedStats(){
    if(_nsStats) return _nsStats;
    try{
      var cached=JSON.parse(localStorage.getItem(NS_STATS_CACHE_KEY)||'null');
      if(cached && nsValidStats(cached.data) && Number(cached.at)>0 && Number(cached.at)<=Date.now()){
        _nsStats=cached.data;
        _nsStatsAt=Number(cached.at);
      }
    }catch(_e){}
    return _nsStats;
  }

  function nsStatsFetch(){
    var cached=nsCachedStats();
    if(cached && Date.now()-_nsStatsAt<NS_STATS_TTL) return Promise.resolve(cached);
    if(_nsStatsPromise) return _nsStatsPromise;
    if(Date.now()<_nsStatsRetryAt) return Promise.resolve(cached);
    var api=(window.MinkaApi && typeof window.MinkaApi.apiFetch==='function' && window.MinkaApi.getToken && window.MinkaApi.getToken())
      ? window.MinkaApi
      : null;
    if(!api) return Promise.resolve(cached);
    var controller=typeof AbortController==='function'?new AbortController():null;
    var timeout;
    var deadline=new Promise(function(_resolve,reject){
      timeout=setTimeout(function(){
        if(controller) controller.abort();
        reject(new Error('Night history request timed out'));
      },NS_STATS_TIMEOUT);
    });
    // The deadline covers both response headers and JSON parsing. The race also
    // releases callers when a transport ignores AbortSignal.
    var request=Promise.resolve().then(function(){
      return api.apiFetch(NS_STATS_API_PATH,controller?{signal:controller.signal}:{});
    }).then(function(r){
      if(!r.ok) throw new Error('Night history unavailable');
      return r.json();
    }).then(function(data){
      if(!nsValidStats(data)) throw new Error('Invalid night history');
      return data;
    });
    _nsStatsPromise=Promise.race([request,deadline]).then(function(data){
      _nsStats=data;
      _nsStatsAt=Date.now();
      _nsStatsRetryAt=0;
      try{localStorage.setItem(NS_STATS_CACHE_KEY,JSON.stringify({at:_nsStatsAt,data:data}));}catch(_e){}
      return data;
    }).catch(function(){
      _nsStatsRetryAt=Date.now()+30000;
      return _nsStats;
    }).finally(function(){
      clearTimeout(timeout);
      _nsStatsPromise=null;
    });
    return _nsStatsPromise;
  }

  function nsWarmStats(){
    if(!document.hidden) nsStatsFetch();
  }

  // Mazs istabu plāns (mini-map): galvenā istaba (3 gultas) + NMP (1),
  // iekrāso to gultu, kurā darbinieks guļ biežāk. Tāds pats izkārtojums kā
  // lielajā istabu sadalījumā, ledus zilā stilā.
  function nsBedMiniMap(favBed, bedMap, showTitle){
    bedMap=(bedMap && typeof bedMap==='object') ? bedMap : {};
    function cell(key){
      var on=(key && key===favBed);
      var count=key ? (Number(bedMap[key])||0) : 0;
      return '<span class="ns-bm-cell'+(on?' on':'')+'" title="'+(key?(NS_BED_LABEL[key]||key):'')+': '+count+'×">'
        +(count?'<span class="ns-bm-count">'+count+'</span>':'')+'</span>';
    }
    return '<div class="ns-bedwrap'+(showTitle?' has-title':'')+'">'
      +(showTitle?'<div class="ns-bed-title">Gultas</div>':'')
      +'<div class="ns-bedmap" title="'+(favBed?(NS_BED_LABEL[favBed]||favBed):'nav datu')+'">'
        +'<div class="ns-bm-room ns-bm-main">'
          +cell('main_left_top')+cell('main_right_top')
          +cell('main_left_bottom')+'<span class="ns-bm-cell ns-bm-empty"></span>'
        +'</div>'
        +'<div class="ns-bm-room ns-bm-nmp">'+cell('nmp_center')+'</div>'
      +'</div>'
      +'</div>';
  }

  var _nsView='hist';
  // A segmented control in the panel's own buttons, with a liquid pill (MinkaMotion) under the chosen one.
  function nsSeg(cls,label,items,cur,attr){
    return '<div class="ns-seg '+cls+'" role="tablist" aria-label="'+label+'"><span class="ns-seg-pill" aria-hidden="true"></span>'
      +items.map(function(it){ return '<button type="button" role="tab" class="ns-seg-btn'+(it[0]===cur?' is-on':'')+'" '+attr+'="'+it[0]+'" aria-selected="'+(it[0]===cur)+'">'+it[1]+'</button>'; }).join('')+'</div>';
  }
  function nsSegMove(bar,animate){
    var on=bar&&bar.querySelector('.is-on'), pill=bar&&bar.querySelector('.ns-seg-pill'), prev=bar&&bar.__segPrev;
    if(!on||!pill) return;
    var MM=window.MinkaMotion;
    if(MM&&MM.liquid&&MM.liquid(pill,bar,on,{ from:prev, animate:!!animate&&!!prev&&prev!==on })) bar.classList.add('has-pill');
    bar.__segPrev=on;
  }
  function nsStatsPanelHTML(){
    // Tukšs konteiners — aizpildās asinhroni pēc fetch. Virsraksta vietā pārslēgs
    // Vēsture | Gultas: gultu studija aizņem to pašu vietu (nekas netiek pārklāts).
    return '<div class="ns-stats-box" id="nsStatsBox" data-view="'+_nsView+'">'
      +'<div class="ns-stats-head"><div class="ns-stats-title">'+nsSeg('ns-view-switch','Vēsture vai gultas',[['hist','Vēsture'],['linen','Veļa'],['pillows','Spilveni'],['toys','Rotaļlietas']],(_nsView==='beds'&&_studio)?_studio.cat:'hist','data-ns-view')+'</div><div class="ns-stats-bed-title">Gultas</div></div>'
      +'<div class="ns-stats-body" id="nsStatsBody"><div class="ns-stats-load">Ielādē…</div></div>'
      +'<div class="ns-bed-studio" id="nsBedStudio" aria-live="polite"></div>'
      +'</div>';
  }

  function nsRenderStats(slots){
    var box=document.getElementById('nsStatsBody');
    if(!box) return;
    if(_nsView==='beds') setTimeout(function(){ setStatsView('beds'); },0);
    var people=(slots||[]).map(function(s,i){
      var fatigue=Number(s&&s.w&&s.w.fs);
      return {
        name:String((s&&s.w&&s.w.name)||'').trim(),
        currentPart:i+1,
        fatigue:Number.isFinite(fatigue)?Math.max(0,Math.min(100,fatigue)):0
      };
    }).filter(function(person){ return !!person.name; }).sort(function(a,b){
      return a.name.localeCompare(b.name,'lv',{sensitivity:'base'});
    });
    var version=++_nsStatsRenderVersion;
    if(!people.length){ box.innerHTML='<div class="ns-stats-load">Nav cilvēku</div>'; return; }
    function paint(stats){
      if(version!==_nsStatsRenderVersion || document.getElementById('nsStatsBody')!==box) return;
      if(!stats || !stats.parts){ box.innerHTML='<div class="ns-stats-load">Vēsturi neizdevās ielādēt. Mēģini atvērt paneli pēc brīža.</div>'; return; }
      var rows=people.map(function(person){
        var nm=person.name;
        var currentPart=person.currentPart;
        var fatigueCol=person.fatigue>70?'#ff3b30':(person.fatigue>45?'#ff9500':(person.fatigue>20?'#ffd60a':'#30d158'));
        var rawParts=stats.parts[nm];
        var p=[0,1,2,3].map(function(i){
          var value=Number(rawParts && rawParts[i]);
          return Number.isFinite(value) ? Math.max(0, Math.min(100000, Math.round(value))) : 0;
        });
        var total=p[0]+p[1]+p[2]+p[3];
        var maxP=Math.max(1,p[0],p[1],p[2],p[3]);
        var favPart=total?(p.indexOf(Math.max.apply(null,p))+1):0;
        // gulta
        var bedMap=(stats.beds && stats.beds[nm] && typeof stats.beds[nm]==='object') ? stats.beds[nm] : {};
        var favBed='',favBedN=0;
        Object.keys(bedMap).forEach(function(k){ if(bedMap[k]>favBedN){favBedN=bedMap[k];favBed=k;} });
        var bars=p.map(function(v,i){
          var h=Math.round((v/maxP)*100);
          var on=(i+1===favPart && total);
          return '<div class="ns-stbar" title="'+(i+1)+'. daļa: '+v+'×">'
            +'<div class="ns-stbar-c">'+v+'</div>'
            +'<div class="ns-stbar-fill'+(on?' on':'')+'" style="height:'+Math.max(6,h)+'%"></div>'
            +'<div class="ns-stbar-n">'+(i+1)+'.</div></div>';
        }).join('');
        var short=nm.split(' ')[0];
        var favTxt=favPart?('Parasti ņem <b>'+favPart+'. daļu</b>'):'nav datu';
        return '<div class="ns-stat-row">'
          +'<div class="ns-stat-part" style="--ns-fatigue-color:'+fatigueCol+'" title="Pašlaik izvēlēta '+currentPart+'. daļa">'
            +'<strong>'+currentPart+'</strong><span>DAĻA</span>'
          +'</div>'
          +'<div class="ns-stat-person">'
            +'<div class="ns-stat-name" title="'+escHtml(nm)+'"><span>'+escHtml(short)+'</span>'+(roomEmoji(nm)?'<span class="ns-stat-emoji" aria-hidden="true">'+escHtml(roomEmoji(nm))+'</span>':'')+'</div>'
            +'<div class="ns-stat-fav">'+favTxt+'</div>'
          +'</div>'
          +'<div class="ns-stat-bars">'+bars+'</div>'
          +'<div class="ns-stat-bed">'+nsBedMiniMap(favBed, bedMap, false)+'</div>'
          +'</div>';
      }).join('');
      var nights=Number(stats.nights);
      nights=Number.isFinite(nights) ? Math.max(0, Math.min(100000, Math.round(nights))) : 0;
      var saved=Date.now()-_nsStatsAt>=NS_STATS_TTL;
      var age=saved?' · saglabāta '+new Date(_nsStatsAt).toLocaleString('lv-LV'):'';
      box.innerHTML=rows+'<div class="ns-stats-foot">Vēsture: '+nights+' naktis'+escHtml(age)+'</div>';
    }
    // Paint valid local history synchronously, including an older snapshot.
    // Slow refreshes never replace useful rows with an empty loading panel.
    var cached=nsCachedStats();
    if(cached) paint(cached);
    nsStatsFetch().then(paint);
  }

  function bedCareNormalize(raw){
    var out={};
    var src=(raw && raw.items && typeof raw.items==='object') ? raw.items : raw;
    NS_BED_CARE_ITEMS.forEach(function(item){
      var value=src && src[item.key];
      var changedAt=Number(value && typeof value==='object' ? value.changedAt : value);
      var updatedAt=Number(value && typeof value==='object' ? value.updatedAt : changedAt);
      if(Number.isFinite(changedAt) && changedAt>0) out[item.key]={
        changedAt:Math.trunc(changedAt),
        updatedAt:Number.isFinite(updatedAt) && updatedAt>0 ? Math.trunc(updatedAt) : Math.trunc(changedAt)
      };
    });
    return out;
  }

  function bedCareLoadLocal(){
    if(_nsBedCareState) return _nsBedCareState;
    try{ _nsBedCareState=bedCareNormalize(JSON.parse(localStorage.getItem(NS_BED_CARE_STORE_KEY)||'{}')); }
    catch(_e){ _nsBedCareState={}; }
    return _nsBedCareState;
  }

  function bedCareSaveLocal(state){
    _nsBedCareState=bedCareNormalize(state||{});
    try{ localStorage.setItem(NS_BED_CARE_STORE_KEY,JSON.stringify({items:_nsBedCareState,savedAt:Date.now()})); }catch(_e){}
  }

  function bedCareApi(){
    if(window.MINKA_APP==='rad')return null;           // /rad never writes the radiographers' night data
    function ready(api){
      return api && typeof api.apiFetch==='function' && api.getToken && api.getToken();
    }
    try{ if(ready(window.MinkaApi)) return window.MinkaApi; }catch(_e0){}
    /* The full calendar lives in a same-origin iframe. During a cold PWA load
       the parent can already be authenticated while the iframe is still
       receiving its token, so use the parent's API as a safe fallback. */
    try{ if(window.parent!==window && ready(window.parent.MinkaApi)) return window.parent.MinkaApi; }catch(_e1){}
    return null;
  }

  function bedCareMerge(local,remote){
    var merged=bedCareNormalize(local||{});
    var cloud=bedCareNormalize(remote||{});
    NS_BED_CARE_ITEMS.forEach(function(item){
      var a=Number(merged[item.key]&&merged[item.key].updatedAt)||0;
      var b=Number(cloud[item.key]&&cloud[item.key].updatedAt)||0;
      if(b>a) merged[item.key]=cloud[item.key];
    });
    return merged;
  }

  function bedCareFetch(){
    var local=bedCareLoadLocal();
    var api=bedCareApi();
    if(!api) return Promise.resolve(local);
    if(_nsBedCareLoading) return _nsBedCareLoading;
    _nsBedCareLoading=api.apiFetch(NS_BED_CARE_API_PATH).then(function(r){
      if(!r.ok) throw new Error('bed care unavailable');
      return r.json();
    }).then(function(data){
      var remote=bedCareNormalize(data||{});
      var merged=bedCareMerge(local,remote);
      bedCareSaveLocal(merged);
      /* If a date was saved while offline, publish that newer local change as
         soon as Cloudflare becomes reachable again. */
      NS_BED_CARE_ITEMS.forEach(function(item){
        var localItem=local[item.key];
        var remoteItem=remote[item.key];
        var localUpdated=Number(localItem&&localItem.updatedAt)||0;
        var remoteUpdated=Number(remoteItem&&remoteItem.updatedAt)||0;
        if(localItem&&localUpdated>remoteUpdated){
          api.apiFetch(NS_BED_CARE_API_PATH,{
            method:'POST',
            headers:{'content-type':'application/json'},
            body:JSON.stringify({item:item.key,changedAt:localItem.changedAt,updatedAt:localUpdated})
          }).then(function(r){ return r.ok?r.json():null; }).then(function(next){
            if(!next) return;
            var synced=bedCareMerge(bedCareLoadLocal(),next);
            bedCareSaveLocal(synced);
            bedCareRenderPerch(synced);
          }).catch(function(){});
        }
      });
      return merged;
    }).catch(function(){ return local; }).finally(function(){ _nsBedCareLoading=null; });
    return _nsBedCareLoading;
  }

  function bedCareDateLabel(ts){
    ts=Number(ts)||0;
    if(!ts) return 'Vēl nav atzīmēts';
    var d=new Date(ts), now=new Date();
    var sameDay=d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
    var yesterday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-1);
    var wasYesterday=d.getFullYear()===yesterday.getFullYear() && d.getMonth()===yesterday.getMonth() && d.getDate()===yesterday.getDate();
    if(sameDay) return 'Šodien';
    if(wasYesterday) return 'Vakar';
    return d.toLocaleDateString('lv-LV',{day:'2-digit',month:'2-digit',year:'numeric'});
  }

  function bedCareExactDateLabel(ts){
    var d=new Date(Number(ts)||0);
    if(!Number(ts) || Number.isNaN(d.getTime())) return 'Nav atzīmēts';
    return d.toLocaleDateString('lv-LV',{day:'2-digit',month:'2-digit',year:'numeric'});
  }

  function bedCareDaysSince(ts){
    var changed=new Date(Number(ts)||0);
    if(!Number(ts) || Number.isNaN(changed.getTime())) return null;
    var now=new Date();
    try{
      if(typeof window.__minkaNow==='function'){
        var simulated=new Date(window.__minkaNow());
        if(!Number.isNaN(simulated.getTime())) now=simulated;
      }
    }catch(_e){}
    var changedDay=Date.UTC(changed.getFullYear(),changed.getMonth(),changed.getDate());
    var today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.max(0,Math.floor((today-changedDay)/86400000));
  }

  function bedCareAgeLabel(ts){
    var days=bedCareDaysSince(ts);
    if(days===null) return 'Pievieno datumu';
    if(days===0) return 'Mainīta šodien';
    if(days===1) return 'Mainīta vakar';
    return 'Pirms '+days+(days%10===1 && days%100!==11 ? ' dienas' : ' dienām');
  }

  function bedCareAriaLabel(ts){
    return 'Gultas veļa. Pēdējā nomaiņa: '+bedCareDateLabel(ts)+'. '+bedCareAgeLabel(ts)+'. Atzīmēt gultas veļas nomaiņu.';
  }

  function bedCareInputDate(ts){
    var d=new Date(Number(ts)||Date.now());
    var year=d.getFullYear();
    var month=String(d.getMonth()+1).padStart(2,'0');
    var day=String(d.getDate()).padStart(2,'0');
    return year+'-'+month+'-'+day;
  }

  function bedCareTimestamp(value){
    var match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
    if(!match) return 0;
    var d=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0);
    if(d.getFullYear()!==Number(match[1]) || d.getMonth()!==Number(match[2])-1 || d.getDate()!==Number(match[3])) return 0;
    return d.getTime();
  }

  function bedCareRenderEditor(state,notice){
    var pop=document.getElementById('nsBedCarePopover');
    if(!pop) return;
    state=bedCareNormalize(state||{});
    var ts=Number(state.all&&state.all.changedAt)||0;
    var last=pop.querySelector('.ns-bedcare-last');
    var note=pop.querySelector('.ns-bedcare-note');
    if(last) last.textContent='Pēdējā nomaiņa: '+bedCareDateLabel(ts);
    if(note) note.textContent=notice||'';
    scheduleFitRoomBlocks(document);
  }

  function bedCarePerchHTML(){
    var state=bedCareLoadLocal();
    var ts=Number(state.all&&state.all.changedAt)||0;
    return '<div class="ns-bedcare-perch" role="button" tabindex="0" aria-expanded="false" aria-label="'+escHtml(bedCareAriaLabel(ts))+'">'
      +'<span class="ns-bedcare-bed" aria-hidden="true">'+roomBedPicture('neutral')
      +'<span class="ns-room-bed-devices"><span class="ns-room-device is-feature dev-0"></span><span class="ns-room-device is-smart dev-1"></span><span class="ns-room-device is-feature dev-2"></span><span class="ns-room-device is-smart dev-3"></span></span>'
      +'</span>'
      +'<span class="ns-bedcare-perch-copy"><small>Gultas veļa</small><span class="ns-bedcare-date-line"><svg class="ns-bedcare-calendar" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h3m2 0h3"/></svg><b>'+escHtml(bedCareExactDateLabel(ts))+'</b></span><span class="ns-bedcare-footer"><span class="ns-bedcare-age">'+escHtml(bedCareAgeLabel(ts))+'</span><span class="ns-bedcare-action">Atzīmēt <span aria-hidden="true">↗</span></span></span></span>'
      +'</div>';
  }

  function bedCareRenderPerch(state){
    state=bedCareNormalize(state||{});
    var ts=Number(state.all&&state.all.changedAt)||0;
    document.querySelectorAll('#nsPanel .ns-bedcare-perch').forEach(function(perch){
      var value=perch.querySelector('b');
      var age=perch.querySelector('.ns-bedcare-age');
      if(value) value.textContent=bedCareExactDateLabel(ts);
      if(age) age.textContent=bedCareAgeLabel(ts);
      perch.setAttribute('aria-label',bedCareAriaLabel(ts));
    });
  }

  function closeBedCare(){
    var pop=document.getElementById('nsBedCarePopover');
    if(pop) pop.remove();
    if(_nsBedCareOutside){ document.removeEventListener('pointerdown',_nsBedCareOutside); _nsBedCareOutside=null; }
    if(_nsBedCareKeydown){ document.removeEventListener('keydown',_nsBedCareKeydown); _nsBedCareKeydown=null; }
    var trigger=document.querySelector('#nsPanel .ns-bedcare-perch');
    if(trigger) trigger.setAttribute('aria-expanded','false');
    if(pop) scheduleFitRoomBlocks(document);
  }

  function markBedCare(itemKey,changedAt){
    if(!NS_BED_CARE_ITEMS.some(function(item){return item.key===itemKey;})) return;
    changedAt=Math.trunc(Number(changedAt));
    if(!Number.isFinite(changedAt) || changedAt<=0) return;
    var state=bedCareLoadLocal();
    var updatedAt=Date.now();
    state[itemKey]={changedAt:changedAt,updatedAt:updatedAt};
    bedCareSaveLocal(state);
    bedCareRenderPerch(state);
    var api=bedCareApi();
    if(!api) return;
    api.apiFetch(NS_BED_CARE_API_PATH,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({item:itemKey,changedAt:changedAt,updatedAt:updatedAt})})
      .then(function(r){ if(!r.ok) throw new Error('save failed'); return r.json(); })
      .then(function(data){
        var merged=bedCareMerge(state,data);
        bedCareSaveLocal(merged);
        bedCareRenderPerch(merged);
      })
      .catch(function(){});
  }

  function openBedCare(anchor){
    var existing=document.getElementById('nsBedCarePopover');
    if(existing){ closeBedCare(); return; }
    var trigger=anchor && anchor.closest ? anchor.closest('.ns-bedcare-perch') : document.querySelector('#nsPanel .ns-bedcare-perch');
    var host=trigger && trigger.parentElement;
    if(!host) return;
    var pop=document.createElement('section');
    pop.id='nsBedCarePopover';
    pop.className='ns-bedcare-popover';
    pop.setAttribute('role','dialog');
    pop.setAttribute('aria-label','Atzīmēt gultas veļas nomaiņu');
    pop.innerHTML='<form class="ns-bedcare-form">'
      +'<div class="ns-bedcare-quick-head"><span class="ns-bedcare-icon" aria-hidden="true">▤</span><span><b>Veļas nomaiņa</b><small class="ns-bedcare-last"></small></span><button type="button" class="ns-bedcare-close" aria-label="Aizvērt">×</button></div>'
      +'<label class="ns-bedcare-date"><span>Kad nomainīji?</span><input id="nsBedCareDate" type="date" required max="'+bedCareInputDate(Date.now())+'" value="'+bedCareInputDate(Date.now())+'"></label>'
      +'<button type="submit" class="ns-bedcare-save">Saglabāt</button>'
      +'<div class="ns-bedcare-note" aria-live="polite"></div>'
      +'</form>';
    host.appendChild(pop);
    if(trigger) trigger.setAttribute('aria-expanded','true');
    pop.querySelector('.ns-bedcare-close').addEventListener('click',closeBedCare);
    pop.addEventListener('click',function(event){ event.stopPropagation(); });
    pop.querySelector('form').addEventListener('submit',function(event){
      event.preventDefault();
      var input=pop.querySelector('#nsBedCareDate');
      var changedAt=bedCareTimestamp(input&&input.value);
      if(!changedAt){ bedCareRenderEditor(bedCareLoadLocal(),'Norādi derīgu datumu.'); return; }
      markBedCare('all',changedAt);
      closeBedCare();
    });
    bedCareRenderEditor(bedCareLoadLocal());
    bedCareFetch().then(function(state){
      bedCareRenderPerch(state);
      if(document.body.contains(pop)) bedCareRenderEditor(state);
    });
    _nsBedCareKeydown=function(event){ if(event.key==='Escape') closeBedCare(); };
    document.addEventListener('keydown',_nsBedCareKeydown);
    setTimeout(function(){
      if(!document.body.contains(pop)) return;
      _nsBedCareOutside=function(event){
        if(!pop.contains(event.target) && !trigger.contains(event.target)) closeBedCare();
      };
      document.addEventListener('pointerdown',_nsBedCareOutside);
    },0);
    requestAnimationFrame(function(){
      var input=pop.querySelector('#nsBedCareDate');
      if(input) input.focus({preventScroll:true});
    });
  }

  // ── Laika rats (dators) ──
  // The start/end <select>s stay the source of truth (their onchange runs
  // __ns.ss/__ns.se as before) and keep native keyboard use. A mouse press
  // opens a scroll wheel instead of the OS list: the value in the centre pill
  // is the one you get, like a phone clock. Phones keep their native wheel.
  var _nsWheel=null;
  function closeTimeWheel(commit){
    var wh=_nsWheel; if(!wh) return;
    _nsWheel=null;
    document.removeEventListener('pointerdown',wh.onOutside,true);
    document.removeEventListener('keydown',wh.onKey,true);
    var value=wh.values[wh.center];
    wh.el.classList.remove('is-open');
    setTimeout(function(){ if(wh.el.parentNode) wh.el.parentNode.removeChild(wh.el); },160);
    var sel=wh.select;
    if(commit && sel && sel.isConnected && value!=null && String(sel.value)!==String(value)){
      sel.value=value;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    }
    // After a commit the header is re-rendered; focus the fresh select.
    var label=wh.label;
    requestAnimationFrame(function(){
      var fresh=document.querySelector('#nsPanel select.nss[aria-label="'+label+'"]');
      if(fresh) fresh.focus({preventScroll:true});
    });
  }
  function openTimeWheel(select){
    if(_nsWheel) closeTimeWheel(false);
    var panelEl=document.getElementById('nsPanel'), shell=select.closest('.nss-shell');
    if(!panelEl||!shell) return;
    var opts=[].slice.call(select.options);
    var el=document.createElement('div');
    el.className='ns-wheel';
    el.innerHTML='<div class="ns-wheel-pill" aria-hidden="true"></div>'
      +'<div class="ns-wheel-list" role="listbox" tabindex="0" aria-label="'+escHtml(select.getAttribute('aria-label')||'Laiks')+'">'
      +opts.map(function(o,i){ return '<div class="ns-wheel-item" role="option" data-i="'+i+'">'+escHtml(o.textContent)+'</div>'; }).join('')
      +'</div>';
    panelEl.appendChild(el);
    var pr=panelEl.getBoundingClientRect(), sr=shell.getBoundingClientRect();
    el.style.left=Math.round(sr.left-pr.left+sr.width/2)+'px';
    el.style.top=Math.round(sr.bottom-pr.top+8)+'px';
    var list=el.querySelector('.ns-wheel-list'), items=[].slice.call(list.children);
    var wh={el:el,select:select,label:select.getAttribute('aria-label')||'',values:opts.map(function(o){return o.value;}),center:Math.max(0,select.selectedIndex)};
    // Kompakts saraksts bez tukšām vietām augšā/apakšā: visi laiki redzami
    // uzreiz, "pill" seko peles/bultiņu izvēlei, un viens klikšķis izvēlas.
    function paint(c){
      wh.center=Math.max(0,Math.min(items.length-1,c));
      el.style.setProperty('--ns-wheel-i',wh.center);
      items.forEach(function(it,i){
        it.setAttribute('data-d',i===wh.center?0:1);
        it.setAttribute('aria-selected',i===wh.center?'true':'false');
      });
    }
    paint(wh.center);
    list.addEventListener('pointerover',function(e){
      var it=e.target.closest('.ns-wheel-item'); if(it) paint(Number(it.getAttribute('data-i')));
    });
    list.addEventListener('click',function(e){
      var it=e.target.closest('.ns-wheel-item'); if(!it) return;
      paint(Number(it.getAttribute('data-i')));
      closeTimeWheel(true);
    });
    wh.onOutside=function(e){ if(!el.contains(e.target)) closeTimeWheel(false); };
    wh.onKey=function(e){
      if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); closeTimeWheel(false); }
      else if(e.key==='Enter'||e.key===' '){ e.preventDefault(); closeTimeWheel(true); }
      else if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); paint(wh.center+(e.key==='ArrowDown'?1:-1)); }
    };
    _nsWheel=wh;
    setTimeout(function(){
      if(_nsWheel!==wh) return;
      document.addEventListener('pointerdown',wh.onOutside,true);
      document.addEventListener('keydown',wh.onKey,true);
    },0);
    requestAnimationFrame(function(){ el.classList.add('is-open'); list.focus({preventScroll:true}); });
  }
  function wireTimeWheels(scope){
    if(document.documentElement.classList.contains('mk-mobile-shell')) return;
    (scope||document).querySelectorAll('.nss-shell select.nss').forEach(function(sel){
      if(sel.__nsWheel) return;
      sel.__nsWheel=true;
      sel.addEventListener('mousedown',function(e){
        if(e.button!==0) return;
        e.preventDefault();
        sel.focus({preventScroll:true});
        openTimeWheel(sel);
      });
    });
  }

  function wireBedCarePerch(scope){
    var perch=(scope||document).querySelector('.ns-bedcare-perch');
    if(!perch || perch.__bedCareWired) return;
    perch.__bedCareWired=true;
    perch.addEventListener('click',function(event){ event.stopPropagation(); openBedCare(perch); });
    perch.addEventListener('keydown',function(event){
      if(event.key==='Enter' || event.key===' '){ event.preventDefault(); openBedCare(perch); }
    });
    bedCareFetch().then(bedCareRenderPerch);
    if(window.__nsOverlayOpen===true && window.__minkaDailyCat && typeof window.__minkaDailyCat.enterNightSplit==='function') {
      window.__minkaDailyCat.enterNightSplit(perch);
    }
  }

  function chalkboardArtId(value){
    var match=String(value||'').match(/(?:^|;)art:([a-f0-9]{32})(?:;|$)/);
    return match ? match[1] : '';
  }

  function chalkboardLoadLocal(){
    if(_nsChalkboardState) return _nsChalkboardState;
    try{
      var raw=JSON.parse(localStorage.getItem(NS_CHALKBOARD_STORE_KEY)||'{}');
      _nsChalkboardState={id:/^[a-f0-9]{32}$/.test(String(raw.id||''))?String(raw.id):'',updatedAt:Number(raw.updatedAt)||0};
    }catch(_e){ _nsChalkboardState={id:'',updatedAt:0}; }
    return _nsChalkboardState;
  }

  function chalkboardSaveLocal(state){
    _nsChalkboardState={id:/^[a-f0-9]{32}$/.test(String(state&&state.id||''))?String(state.id):'',updatedAt:Number(state&&state.updatedAt)||Date.now()};
    try{ localStorage.setItem(NS_CHALKBOARD_STORE_KEY,JSON.stringify(_nsChalkboardState)); }catch(_e){}
    return _nsChalkboardState;
  }

  function chalkboardArtUrl(id){
    if(!/^[a-f0-9]{32}$/.test(String(id||''))) return '';
    var api=bedCareApi();
    var parentBase='';
    try{ parentBase=window.parent&&window.parent.MINKA_API_BASE||''; }catch(_e){}
    var base=(api&&api.base)||window.MINKA_API_BASE||parentBase||'';
    return base+'/skin-assets/'+id+'.webp';
  }

  function chalkboardRender(state){
    state=state||chalkboardLoadLocal();
    var url=chalkboardArtUrl(state.id);
    document.querySelectorAll('#nsPanel .ns-cat-rhythm-key').forEach(function(board){
      board.classList.toggle('has-art',!!url);
      var art=board.querySelector('.ns-chalkboard-art');
      if(art) art.style.backgroundImage=url?'url("'+url+'")':'';
      board.setAttribute('aria-label',url?'Atvērt un rediģēt kopīgo nakts tāfeli':'Atvērt kopīgo nakts tāfeli un sākt zīmēt');
    });
  }

  function chalkboardFetch(){
    var local=chalkboardLoadLocal();
    var api=bedCareApi();
    if(!api) return Promise.resolve(local);
    if(_nsChalkboardLoading) return _nsChalkboardLoading;
    _nsChalkboardLoading=api.apiFetch('/api/skins').then(function(r){
      if(!r.ok) throw new Error('chalkboard unavailable');
      return r.json();
    }).then(function(data){
      var map=(data&&data.skins&&typeof data.skins==='object')?data.skins:data;
      var skin='';
      Object.keys(map||{}).some(function(key){
        if(String(key).trim().toUpperCase()===NS_CHALKBOARD_WORKER){ skin=map[key]; return true; }
        return false;
      });
      var id=chalkboardArtId(skin);
      /* A successful Cloudflare response is authoritative. This also clears a
         stale browser cache if the shared board was reset elsewhere. */
      if(!id){
        var empty=chalkboardSaveLocal({id:'',updatedAt:Date.now()});
        chalkboardRender(empty);
        return empty;
      }
      var state=chalkboardSaveLocal({id:id,updatedAt:Date.now()});
      chalkboardRender(state);
      return state;
    }).catch(function(){ return local; }).finally(function(){ _nsChalkboardLoading=null; });
    return _nsChalkboardLoading;
  }

  function chalkboardUpload(blob){
    var api=bedCareApi();
    if(!api) return Promise.reject(new Error('Nav savienojuma ar mākoni'));
    var send=function(){
      var form=new FormData();
      form.append('worker',NS_CHALKBOARD_WORKER);
      form.append('image',blob,'chalkboard.webp');
      return api.apiFetch('/api/skin-art',{method:'POST',body:form});
    };
    /* A dropped connection, or the server failing without CORS headers
       (Cloudflare KV lets one key be written about once a second), reaches
       the page only as "Failed to fetch": try once more before telling. */
    return send().catch(function(error){
      if(!(error instanceof TypeError)) throw error;
      return new Promise(function(resolve){ setTimeout(resolve,1200); }).then(send);
    }).then(function(r){
      return r.json().catch(function(){return {};}).then(function(data){
        if(!r.ok) throw new Error(data.error||'Neizdevās saglabāt tāfeli');
        var id=chalkboardArtId(data.skin);
        if(!id) throw new Error('Serveris neatgrieza tāfeles zīmējumu');
        var state=chalkboardSaveLocal({id:id,updatedAt:Date.now()});
        chalkboardRender(state);
        return state;
      });
    });
  }

  function openChalkboard(){
    if(!window.MinkaSkinDraw || typeof window.MinkaSkinDraw.open!=='function') return;
    /* Always resolve the server version before editing, so an older computer
       cannot accidentally overwrite a drawing it had not loaded yet. */
    chalkboardFetch().catch(function(){ return chalkboardLoadLocal(); }).then(function(state){
      window.MinkaSkinDraw.open({
        mode:'chalkboard',
        name:'Kopīgā nakts tāfele',
        initialUrl:chalkboardArtUrl(state&&state.id),
        onSave:chalkboardUpload
      });
    });
  }

  function wireChalkboard(scope){
    var board=(scope||document).querySelector('.ns-cat-rhythm-key');
    if(!board||board.__chalkboardWired) return;
    board.__chalkboardWired=true;
    board.addEventListener('click',function(event){ event.stopPropagation(); openChalkboard(); });
    board.addEventListener('keydown',function(event){
      if(event.key==='Enter'||event.key===' '){ event.preventDefault(); openChalkboard(); }
    });
    chalkboardRender(chalkboardLoadLocal());
    chalkboardFetch().then(chalkboardRender);
  }

  function refreshSharedCloud(force){
    if(document.hidden || window.__nsOverlayOpen!==true) return;
    var now=Date.now();
    if(!force && now-_nsSharedCloudPulledAt<30000) return;
    _nsSharedCloudPulledAt=now;
    bedCareFetch().then(bedCareRenderPerch);
    chalkboardFetch().then(chalkboardRender);
  }

  var _roomBc=null;
  var _roomPolling=false;
  var _roomPulling={};
  var _roomLastPulledAt={};
  try{ _roomBc = new BroadcastChannel('minka-ns-rooms-sync'); }catch(_e){}

  function activeDateKey(){
    return String(window.__activeDateStr || window.__todayDateStr || '').trim();
  }
  function loadSavedMap(){
    try{
      var raw = localStorage.getItem(NS_STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed==='object') ? parsed : {};
    }catch(e){ return {}; }
  }
  function saveSavedMap(map){
    try{ localStorage.setItem(NS_STORE_KEY, JSON.stringify(map||{})); document.dispatchEvent(new CustomEvent('minka:night-plan-changed')); }catch(e){}
  }
  function roomStorageKey(dateKey){
    dateKey=String(dateKey||'').trim();
    return dateKey ? (NS_ROOM_KEY_PREFIX + dateKey) : '';
  }
  function loadLegacyRoomSavedMap(){
    try{
      var raw = localStorage.getItem(NS_ROOM_LEGACY_STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed==='object') ? parsed : {};
    }catch(e){ return {}; }
  }
  function loadRoomSavedState(dateKey){
    try{
      var key=roomStorageKey(dateKey);
      if(key){
        var raw=localStorage.getItem(key);
        if(raw){
          var parsed=JSON.parse(raw);
          if(parsed && typeof parsed==='object') return parsed;
        }
      }
    }catch(e){}
    try{
      var legacy=loadLegacyRoomSavedMap()[String(dateKey||'').trim()];
      return (legacy && typeof legacy==='object') ? legacy : null;
    }catch(e){ return null; }
  }
  function saveRoomSavedState(dateKey, data){
    try{
      var key=roomStorageKey(dateKey);
      if(!key || !data || typeof data!=='object') return;
      localStorage.setItem(key, JSON.stringify(data));
    }catch(e){}
  }
  function roomBedsToOrder(beds, names){
    var next=new Array(4).fill('');
    var valid={};
    (names||[]).forEach(function(n){ if(n) valid[n]=true; });
    if(beds && typeof beds==='object'){
      ROOM_BED_KEYS.forEach(function(key, idx){
        var name=String((beds[key]||'')).trim();
        if(name && valid[name] && next.indexOf(name)===-1) next[idx]=name;
      });
    }
    var remaining=(names||[]).filter(function(n){ return next.indexOf(n)===-1; });
    for(var i=0;i<next.length && remaining.length;i++){
      if(!next[i]) next[i]=remaining.shift();
    }
    return next.slice(0,4);
  }
  function orderToRoomBeds(order){
    var beds={};
    ROOM_BED_KEYS.forEach(function(key, idx){
      var name=String(((order||[])[idx]||'')).trim();
      if(name) beds[key]=name;
    });
    return beds;
  }
  function getRoomOrder(slots){
    var names=(slots||[]).map(function(s){ return String((s && s.w && s.w.name) || '').trim(); }).filter(Boolean);
    var dk=activeDateKey();
    var saved=dk ? loadRoomSavedState(dk) : null;
    // No manual arrangement → default to where each person usually sleeps (stats).
    if(!saved) return statsBedOrder(names);
    if(saved.beds && typeof saved.beds==='object'){
      return roomBedsToOrder(saved.beds, names);
    }
    if(Array.isArray(saved.order) && saved.order.length){
      return roomBedsToOrder(orderToRoomBeds(saved.order), names);
    }
    return statsBedOrder(names);
  }
  function saveRoomOrder(order){
    try{
      var dk=activeDateKey();
      if(!dk || !Array.isArray(order)) return;
      var payload={
        date: dk,
        beds: orderToRoomBeds(order.slice(0,4)),
        savedAt: Date.now()
      };
      saveRoomSavedState(dk, payload);
      pushRoomState(dk);
    }catch(e){}
  }
  function activeRoomApi(){
    if(window.MINKA_APP==='rad')return null;
    return (window.MinkaApi && typeof window.MinkaApi.apiFetch==='function' && window.MinkaApi.getToken())
      ? window.MinkaApi
      : null;
  }
  function normalizeRoomPayload(data, dateStr){
    if(!data || typeof data!=='object') return null;
    var beds=(data.beds && typeof data.beds==='object') ? data.beds : null;
    if(!beds && Array.isArray(data.order)) beds=orderToRoomBeds(data.order);
    if(!beds) return null;
    var normalizedBeds={};
    ROOM_BED_KEYS.forEach(function(key){
      var name=String((beds[key]||'')).trim();
      if(name) normalizedBeds[key]=name;
    });
    return {
      date: String(dateStr||data.date||'').trim(),
      beds: normalizedBeds,
      savedAt: data.savedAt || Date.now()
    };
  }
  function pushRoomState(dateStr){
    var api=activeRoomApi();
    if(!api || !dateStr) return;
    try{
      var payload=normalizeRoomPayload(loadRoomSavedState(dateStr), dateStr);
      if(!payload || !payload.date) return;
      api.apiFetch(NS_ROOM_API_PATH, { method:'POST', json: payload }).catch(function(){});
      if(_roomBc) try{ _roomBc.postMessage(payload); }catch(_e){}
    }catch(e){}
  }
  function pullRoomState(dateStr, cb){
    var api=activeRoomApi();
    if(!api || !dateStr || _roomPulling[dateStr]) return;
    var now=Date.now();
    // init() performs an immediate pull and two staged paints. Those paints
    // must not turn into three identical API requests on every startup.
    if(now-(_roomLastPulledAt[dateStr]||0)<8000) return;
    _roomLastPulledAt[dateStr]=now;
    _roomPulling[dateStr]=true;
    api.apiFetch(NS_ROOM_API_PATH + '?date=' + encodeURIComponent(dateStr))
      .then(function(r){ return r.json(); })
      .then(function(remote){
        var payload=normalizeRoomPayload(remote, dateStr);
        if(!payload || !payload.date || !payload.beds) return;
        var local=loadRoomSavedState(dateStr);
        if(!local || !local.savedAt || (payload.savedAt && payload.savedAt > local.savedAt)){
          saveRoomSavedState(dateStr, payload);
          if(cb) cb(payload);
        }
      }).catch(function(){})
      .finally(function(){ delete _roomPulling[dateStr]; });
  }
  function startRoomPolling(){
    if(_roomPolling) return;
    _roomPolling=true;
    function refreshActiveRooms(){
      var d=activeDateKey();
      if(d) pullRoomState(d, function(){
        if(d===activeDateKey() && window.__nsOverlayOpen===true) render();
      });
      refreshSharedCloud(false);
    }
    if(_roomBc){
      _roomBc.onmessage=function(evt){
        try{
          var payload=normalizeRoomPayload(evt.data, evt.data && evt.data.date);
          if(!payload || !payload.date) return;
          var local=loadRoomSavedState(payload.date);
          if(!local || !local.savedAt || (payload.savedAt && payload.savedAt > local.savedAt)){
            saveRoomSavedState(payload.date, payload);
            if(payload.date===activeDateKey() && window.__nsOverlayOpen===true){
              try{ render(); }catch(_e){}
            }
          }
        }catch(_e){}
      };
    }
    refreshActiveRooms();
    setInterval(function(){
      if(document.hidden || window.__nsOverlayOpen!==true) return;
      refreshActiveRooms();
    }, 12000);
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden && window.__nsOverlayOpen===true){
        refreshActiveRooms();
        refreshSharedCloud(true);
      }
    });
    window.addEventListener('focus',function(){ refreshSharedCloud(true); });
  }
  function saveCurrentDayState(){
    try{
      if(!st || !st.sl || !st.sl.length) return;
      var dk = activeDateKey();
      if(!dk) return;
      var map = loadSavedMap();
      map[dk] = window.MinkaNightHistory.save(map[dk], {
        sh: Number(st.sh||0),
        ei: Number(st.ei||0),
        order: st.sl.map(function(s){ return String((s && s.w && s.w.name) || '').trim(); }).filter(Boolean),
        mode: _nsSortMode,
        savedAt: Date.now()
      });
      saveSavedMap(map);
      if(window.__nsKv) window.__nsKv.push(dk);
    }catch(e){}
  }
  function applySavedDayState(workers, fallbackSh, fallbackEi){
    var base = Array.isArray(workers) ? workers.slice() : [];
    var sorted = fat(base);
    var out = { workers: sorted, sh: fallbackSh, ei: fallbackEi };
    try{
      var dk = activeDateKey();
      if(!dk) return out;
      var saved = loadSavedMap()[dk];
      if(!saved || typeof saved!=='object') return out;
      // Restore which sort mode produced this saved order, so the active button
      // (and thus the highlight) is correct on every device, not just the one that set it.
      _nsSortMode = (saved.mode === 'freq') ? 'freq' : 'fatigue';
      out.sh = (typeof saved.sh === 'number' && isFinite(saved.sh)) ? saved.sh : fallbackSh;
      out.ei = (typeof saved.ei === 'number' && isFinite(saved.ei)) ? saved.ei : fallbackEi;
      // Apply saved order — same logic as getNightSplitPlan in calendar.js
      if(Array.isArray(saved.order) && saved.order.length){
        var byName={};
        sorted.forEach(function(w){ byName[String(w.name||'').trim()]=w; });
        var next=[];
        saved.order.forEach(function(name){
          name=String(name||'').trim();
          if(byName[name]){ next.push(byName[name]); delete byName[name]; }
        });
        Object.keys(byName).forEach(function(k){ next.push(byName[k]); });
        if(next.length===sorted.length) out.workers=next;
      }
      return out;
    }catch(e){ return out; }
  }

  // â”€â”€ Web Audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // â”€â”€ Utils â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function mt(m){m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  function fm(m){return mt(m);}
  function calc(wk,sh,ei){
    if(!wk||!wk.length)return[];
    var n=wk.length,eo=END[ei]||END[0],sm=Math.round(sh*60),em=eo.h*60+eo.m;
    if(sh>=20)em+=1440;
    // True equal split in minutes (no 5â€‘minute snapping). If total minutes do not divide
    // evenly, distribute the remainder from the beginning so the difference is <= 1 minute.
    var tot=em-sm,base=Math.floor(tot/n),rem=tot%n,slots=[],c=sm;
    for(var i=0;i<n;i++){
      var add=(i<rem?1:0);
      var e=c+base+add;
      if(i===n-1) e=em;
      slots.push({w:wk[i],s:c,e:e,ss:mt(c),es:mt(e),d:e-c});c=e;
    }return slots;
  }
  function fat(wk){
    return wk.map(function(w){
      var sc=50;
      if(window.__fatigue){var f=window.__fatigue.calculateFatigue(w.name);if(f)sc=f.score;}
      return Object.assign({},w,{fs:sc});
    }).sort(function(a,b){return b.fs-a.fs});
  }
  function isPreviousShiftDayCarryover(w){
    var ds=String(window.__activeDateStr||'').trim();
    var sh0=String(w&&w.shift||'').replace(',','.');
    var m0=sh0.match(/(\d+(?:\.\d+)?)/);
    var hrs0=m0 ? Math.round(parseFloat(m0[1])||0) : Math.round(Number(w&&w.hours||0)||0);
    var known=window.MinkaKnownCarryovers||null;
    if(known && known.isKnownNightCarryover(w&&w.name,hrs0,ds)) return true;
    if(!w) return false;
    if(w.__minkaCarryover===true) return true;
    if(!w.startTime) return false;
    var hour=parseInt(String(w.startTime).split(':')[0],10);
    if(!isFinite(hour) || hour>=8) return false;
    var type=String(w.type||'').toUpperCase();
    var shift=String(w.shift||'').replace(',','.');
    var m=shift.match(/(\d+(?:\.\d+)?)/);
    var hrs=m ? Math.round(parseFloat(m[1])||0) : Math.round(Number(w.hours||0)||0);
    // A carryover is the short leftover fragment of the previous night; a full
    // 12h+ shift is a real standalone night and must never be hidden here.
    if(hrs>=12) return false;
    if(type==='NAKTS' || type==='DIENNAKTS' || w.isNight===true) return true;
    // Same fallback as the grid: a short block ending at the 08:00 rollover is
    // last night's tail even when the sheet typed it as a day shift.
    return !!(known && known.isMorningTailShift(w));
  }
  function getW(){
    // Get workers from BOTH radiographers store AND radiologists store
    var ds=window.__activeDateStr||'';if(!ds)return[];
    var f=[];
    var stores=[window.__grafiksStore]; // Nakts sadalÄ«jums: tikai radiogrÄferi
    stores.forEach(function(s){
      if(!s||typeof s!=='object')return;
      for(var mo in s){var days=s[mo];if(!Array.isArray(days))continue;
        for(var di=0;di<days.length;di++){var day=days[di];
          if(day.date!==ds||!Array.isArray(day.workers))continue;
          for(var wi=0;wi<day.workers.length;wi++){var w=day.workers[wi];
            if(isPreviousShiftDayCarryover(w))continue;
            var sh=String(w.shift||'').toUpperCase().trim();
            if(sh==='N'||sh.indexOf('A')>=0||sh==='B'||!sh||sh==='0')continue;
            var hrs=w.hours||parseInt(sh)||0;
            var tp=String(w.type||'').toUpperCase();
            if(hrs<12&&tp!=='NAKTS'&&tp!=='DIENNAKTS')continue;
            var sH=w.startTime?parseInt(w.startTime.split(':')[0]):-1;
            var night=hrs>=24||tp==='NAKTS'||tp==='DIENNAKTS';
            if(!night&&sH>=0&&(sH>=18||sH<=5))night=true;
            if(!night&&sH===-1&&hrs>=12)night=true;
            if(night&&!f.some(function(x){return x.name===w.name;}))f.push(w);
          }
        }
      }
    });
    return f;
  }

  // â”€â”€ Fatigue mini sparkline SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function sparkline(workerName, accentColor) {
    if(!window.__fatigue)return'';
    var hist=window.__fatigue.gatherWorkerHistory(workerName);
    if(!hist||hist.length<3)return'';
    var today=new Date(),scores=[];
    for(var i=13;i>=0;i--){
      var d=new Date(today);d.setDate(d.getDate()-i);
      d.setHours(8,0,0,0);
      var sc=window.__fatigue.scoreAt(workerName,d);
      scores.push(sc);
    }
    if(scores.length<2)return'';
    var W=80,H=28,pad=2;
    var mn=Math.min.apply(null,scores),mx=Math.max.apply(null,scores);
    if(mx===mn)mx=mn+1;
    var xp=function(i){return pad+(i/(scores.length-1))*(W-pad*2);};
    var yp=function(s){return H-pad-(s-mn)/(mx-mn)*(H-pad*2);};
    var pts=scores.map(function(s,i){return i===0?'M':'L'+xp(i).toFixed(1)+','+yp(s).toFixed(1);}).join(' ');
    // Rework as proper path
    var path='M '+xp(0).toFixed(1)+','+yp(scores[0]).toFixed(1);
    for(var j=1;j<scores.length;j++){
      var px=xp(j-1),cx=(px+xp(j))/2;
      path+=' C '+cx.toFixed(1)+','+yp(scores[j-1]).toFixed(1)+' '+cx.toFixed(1)+','+yp(scores[j]).toFixed(1)+' '+xp(j).toFixed(1)+','+yp(scores[j]).toFixed(1);
    }
    var area=path+' L '+xp(scores.length-1).toFixed(1)+','+(H-pad)+' L '+xp(0).toFixed(1)+','+(H-pad)+' Z';
    var gradId='spk'+workerName.replace(/\s+/g,'');
    return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block">'
      +'<defs><linearGradient id="'+gradId+'" x1="0" y1="0" x2="0" y2="1">'
      +'<stop offset="0%" stop-color="'+accentColor+'" stop-opacity="0.3"/>'
      +'<stop offset="100%" stop-color="'+accentColor+'" stop-opacity="0"/>'
      +'</linearGradient></defs>'
      +'<path d="'+area+'" fill="url(#'+gradId+')"/>'
      +'<path d="'+path+'" fill="none" stroke="'+accentColor+'" stroke-width="1.5" stroke-linecap="round"/>'
      +'</svg>';
  }

  // â”€â”€ Sort explanation in Latvian â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function sortReason(slots) {
    // The "X ielikts agrāk, jo..." explanation note was removed at the user's request.
    return '';
  }

  // â”€â”€ Timeline bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildTimeline(slots) {
    if(!slots||!slots.length) return '';
    var tot=slots[slots.length-1].e-slots[0].s;
    // Handles
    var handles='';
    for(var i=0;i<slots.length-1;i++){
      var pct=(slots[i].e-slots[0].s)/tot*100;
      handles+='<div class="ns-handle" style="left:'+pct.toFixed(2)+'%"><div class="ns-handle-pill"></div></div>';
    }
    // Segments
    var segs=slots.map(function(s,i){
      var pct=(s.d/tot*100).toFixed(2);
      var c=getCol(slots[i].w.name);
      return '<div class="ns-seg" style="flex:'+pct+';background:linear-gradient(135deg,'+c.bg+',rgba(255,255,255,0.04));border-color:'+c.border+'" data-i="'+i+'"></div>';
    }).join('');
    return '<div class="ns-timeline-wrap"><div class="ns-timeline">'+segs+handles+'</div></div>';
  }



  // â”€â”€ GLASSMORPHISM ANALOGUE CLOCK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var _nsClockRAF=null;
  function getGlobalNsArcTip(){
    try{
      var id='nsArcTipGlobal';
      var tip=document.getElementById(id);
      if(!tip){
        tip=document.createElement('div');
        tip.id=id;
        tip.className='ns-arc-tip ns-arc-tip-global';
        tip.setAttribute('aria-hidden','true');
        document.body.appendChild(tip);
      }
      tip.style.position='fixed';
      tip.style.display='flex';
      tip.style.opacity='0';
      tip.style.visibility='hidden';
      tip.style.pointerEvents='none';
      tip.style.zIndex='2147483647';
      tip.style.left='-9999px';
      tip.style.top='-9999px';
      tip.style.maxWidth='320px';
      tip.style.whiteSpace='normal';
      tip.style.willChange='transform, opacity, left, top';
      return tip;
    }catch(_e){ return null; }
  }




  function fatigueTrend(workerName){
    if(!window.__fatigue || typeof window.__fatigue.gatherWorkerHistory !== 'function') return {icon:'&rarr;', cls:'flat', label:'Stabils'};
    var hist = window.__fatigue.gatherWorkerHistory(workerName);
    if(!hist || !hist.length) return {icon:'&rarr;', cls:'flat', label:'Stabils'};
    var now = new Date();
    var recent = 0, prev = 0;
    hist.forEach(function(e){
      var d = e && e.date instanceof Date ? e.date : new Date(e.date);
      if(!(d instanceof Date) || isNaN(d)) return;
      var days = Math.floor((now - d) / 86400000);
      var hrs = Number(e.hours || 0) || 0;
      var weight = hrs + ((e.isNight || e.type === 'NAKTS' || e.type === 'DIENNAKTS') ? 4 : 0);
      if(days >= 0 && days < 7) recent += weight;
      else if(days >= 7 && days < 14) prev += weight;
    });
    var delta = recent - prev;
    if(delta > 4) return {icon:'&nearr;', cls:'up', label:'K&#257;pj'};
    if(delta < -4) return {icon:'&searr;', cls:'down', label:'Kr&#299;t'};
    return {icon:'&rarr;', cls:'flat', label:'Stabils'};
  }

  function slotRealtime(slot){
    var today = (window.__activeDateStr && window.__todayDateStr && window.__activeDateStr === window.__todayDateStr);
    // Latvian status labels (requested)
    var TXT_ACTIVE = 'TAGAD';
    var TXT_NEXT   = 'NĀKAMĀ';
    var TXT_DONE   = 'BEIGTS';
    if(!today || !slot) return {status:TXT_NEXT, active:false, pct:0, left:'', label:''};
    var now = new Date();
    var cur = now.getHours()*60 + now.getMinutes();
    if(st && typeof st.sh === 'number' && st.sh >= 20 && cur < Math.round(st.sh*60)) cur += 1440;
    if(cur >= slot.s && cur < slot.e){
      var total = Math.max(1, slot.e - slot.s);
      var elapsed = Math.max(0, cur - slot.s);
      var leftMin = Math.max(0, slot.e - cur);
      var pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
      return {status:TXT_ACTIVE, active:true, pct:pct, left:fm(leftMin), label:'Atlikušais'};
    }
    if(cur >= slot.e) return {status:TXT_DONE, active:false, pct:100, left:'', label:''};
    return {status:TXT_NEXT, active:false, pct:0, left:'', label:''};
  }


  function escHtml(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(ch){
      return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':ch==='"'?'&quot;':'&#39;';
    });
  }
  /* An analog dial beside the times: the part's hours as a thick arc on the
     12-hour face (bright where they have passed), and while the part runs a
     hand at the present moment and a soft pulse. Hover or tap: a big dial
     over the card with the start, the end and how long is left. */
  function clockPt(min,r,c){ var a=((min%720)/720)*Math.PI*2-Math.PI/2; return (c+Math.cos(a)*r).toFixed(2)+' '+(c+Math.sin(a)*r).toFixed(2); }
  function clockArc(from,to,r,c){
    var span=Math.max(.5,Math.min(719.5,to-from));
    return 'M'+clockPt(from,r,c)+'A'+r+' '+r+' 0 '+(span>360?1:0)+' 1 '+clockPt(from+span,r,c);
  }
  function clockSvg(slot,big){
    var V=big?120:40, c=V/2, R=big?46:15, ticks='';
    for(var k=0;k<12;k++){
      var a=k/12*Math.PI*2, r0=R+(big?(k%3?7:4):(k%3?3.2:1.8)), r1=R+(big?11:4.8);
      ticks+='M'+(c+Math.cos(a)*r0).toFixed(2)+' '+(c+Math.sin(a)*r0).toFixed(2)+'L'+(c+Math.cos(a)*r1).toFixed(2)+' '+(c+Math.sin(a)*r1).toFixed(2);
    }
    var lab='';
    if(big){
      [[0,'12'],[180,'3'],[360,'6'],[540,'9']].forEach(function(n){ var p=clockPt(n[0],R-12,c).split(' '); lab+='<text class="nsc-clock-num" x="'+p[0]+'" y="'+p[1]+'">'+n[1]+'</text>'; });
    }
    return '<svg class="nsc-clock'+(big?' is-big':'')+'" viewBox="0 0 '+V+' '+V+'" aria-hidden="true">'
      +'<circle class="nsc-clock-pulse" cx="'+c+'" cy="'+c+'" r="'+(R+(big?12:5.4))+'"/>'
      +'<circle class="nsc-clock-face" cx="'+c+'" cy="'+c+'" r="'+(R+(big?12:5.4))+'"/>'
      +'<path class="nsc-clock-ticks" d="'+ticks+'"/>'+lab
      +'<path class="nsc-clock-track" d="'+clockArc(slot.s,slot.e,R,c)+'"/>'
      +'<path class="nsc-clock-done" d=""/>'
      +(big?'<circle class="nsc-clock-end" cx="'+clockPt(slot.s,R,c).split(' ')[0]+'" cy="'+clockPt(slot.s,R,c).split(' ')[1]+'" r="4"/><circle class="nsc-clock-end" cx="'+clockPt(slot.e,R,c).split(' ')[0]+'" cy="'+clockPt(slot.e,R,c).split(' ')[1]+'" r="4"/>':'')
      +'<line class="nsc-clock-hand is-hour" x1="'+c+'" y1="'+c+'" x2="'+c+'" y2="'+(c-R*.58)+'" style="transform-origin:'+c+'px '+c+'px"/>'
      +'<line class="nsc-clock-hand is-minute" x1="'+c+'" y1="'+c+'" x2="'+c+'" y2="'+(c-R*.92)+'" style="transform-origin:'+c+'px '+c+'px"/>'
      +'<circle class="nsc-clock-pin" cx="'+c+'" cy="'+c+'" r="'+(big?3.4:1.8)+'"/>'
      +'</svg>';
  }
  function nsClock(slot){
    return '<button type="button" class="nsc-clock-btn" aria-label="Darba laiks '+escHtml(slot.ss+' – '+slot.es)+'">'+clockSvg(slot,false)+'</button>';
  }
  function clockLeft(min){ min=Math.max(0,Math.round(min)); var h=Math.floor(min/60), m=min%60; return (h?h+' h ':'')+(m||!h?m+' min':'').trim(); }
  function clockPaint(svg,slot){
    var p=ledProgress(slot), on=p>0&&p<1, big=svg.classList.contains('is-big'), V=big?120:40, c=V/2, R=big?46:15;
    svg.classList.toggle('is-running',on); svg.classList.toggle('is-done',p>=1);
    var done=svg.querySelector('.nsc-clock-done'), now=slot.s+(slot.e-slot.s)*Math.min(1,p);
    if(done) done.setAttribute('d',p>0?clockArc(slot.s,now,R,c):'');
    // A real clock while the part runs: the hour hand and the minute hand.
    var hh=svg.querySelector('.nsc-clock-hand.is-hour'), mh=svg.querySelector('.nsc-clock-hand.is-minute');
    if(on && hh) hh.style.transform='rotate('+((now%720)/720*360).toFixed(1)+'deg)';
    if(on && mh) mh.style.transform='rotate('+((now%60)/60*360).toFixed(1)+'deg)';
    return p;
  }
  function nsClockTick(){
    document.querySelectorAll('#nsPanel .nsc-full-card').forEach(function(card){
      var slot=st&&st.sl?st.sl[+card.getAttribute('data-i')]:null; if(!slot) return;
      card.querySelectorAll('svg.nsc-clock').forEach(function(svg){ clockPaint(svg,slot); });
      var pop=card.querySelector('.nsc-clock-pop'); if(pop) clockPopText(pop,slot);
    });
  }
  function clockPopText(pop,slot){
    var p=ledProgress(slot), total=slot.e-slot.s, t=pop.querySelector('.nsc-clock-status');
    if(!t) return;
    t.textContent = p>=1 ? 'Pabeigts' : p>0 ? 'Atlicis '+clockLeft(total*(1-p)) : 'Sāksies pēc '+clockLeft((function(){ var q=ledProgressAt(slot); return q; })());
  }
  // Minutes until the part starts (for the dial's "Sāksies pēc").
  function ledProgressAt(slot){
    var parts=activeDateKey().match(/^(\d{2})\.(\d{2})\.(\d{4})$/); if(!parts || !st || !st.sl.length) return 0;
    var base=new Date(+parts[3],+parts[2]-1,+parts[1]); if(st.sl[0].s<12*60) base.setDate(base.getDate()+1);
    return (base.getTime()+slot.s*60000-Date.now())/60000;
  }
  // A card's accent comes from its picture and can be almost black; on the
  // dark dial it must still read, so lift it toward white until it does.
  function clockReadable(accent){
    var s=String(accent||'').trim(), m, rgb=null;
    if((m=s.match(/^#([0-9a-f]{6})$/i))) rgb=[0,2,4].map(function(k){ return parseInt(m[1].substr(k,2),16); });
    else if((m=s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i))) rgb=[+m[1],+m[2],+m[3]];
    if(!rgb) return '';
    function lum(c){ return c.map(function(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }).reduce(function(a,v,k){ return a+v*[.2126,.7152,.0722][k]; },0); }
    for(var t=0;t<=1.001;t+=.1){
      var c=rgb.map(function(v){ return Math.round(v+(255-v)*t); });
      if(lum(c)>=.3) return t?'rgb('+c.join(',')+')':'';
    }
    return '';
  }
  function clockOpen(card,byHover){
    var slot=st&&st.sl?st.sl[+card.getAttribute('data-i')]:null; if(!slot) return;
    var pop=card.querySelector('.nsc-clock-pop');
    if(!pop){
      document.querySelectorAll('#nsPanel .nsc-clock-pop').forEach(function(o){ o.remove(); });
      pop=document.createElement('div'); pop.className='nsc-clock-pop';
      var lift=clockReadable(getComputedStyle(card).getPropertyValue('--nsc-accent'));
      if(lift) pop.style.setProperty('--nsc-accent',lift);
      pop.innerHTML=clockSvg(slot,true)+'<div class="nsc-clock-copy"><b>'+escHtml(slot.ss)+' – '+escHtml(slot.es)+'</b><span class="nsc-clock-status"></span></div>';
      card.appendChild(pop);
      clockPaint(pop.querySelector('svg'),slot); clockPopText(pop,slot);
    }
    pop.__hover=!!byHover;
  }
  function clockClose(card){ var pop=card&&card.querySelector('.nsc-clock-pop'); if(!pop) return; pop.classList.add('is-out'); setTimeout(function(){ pop.remove(); },160); }
  if(!window.__nsClockWired){
    window.__nsClockWired=true;
    var hoverT=0;
    document.addEventListener('click',function(e){
      var btn=e.target.closest && e.target.closest('#nsPanel .nsc-clock-btn');
      if(btn){ e.preventDefault(); e.stopPropagation(); var card=btn.closest('.nsc-full-card'), pop=card.querySelector('.nsc-clock-pop'); if(pop && !pop.__hover) clockClose(card); else { clockOpen(card,false); var p2=card.querySelector('.nsc-clock-pop'); if(p2) p2.__hover=false; } return; }
      if(!(e.target.closest && e.target.closest('.nsc-clock-pop'))) document.querySelectorAll('#nsPanel .nsc-clock-pop').forEach(function(o){ clockClose(o.parentNode); });
    },true);
    document.addEventListener('pointerover',function(e){
      if(e.pointerType!=='mouse') return;
      var btn=e.target.closest && e.target.closest('#nsPanel .nsc-clock-btn'); if(!btn) return;
      clearTimeout(hoverT); hoverT=setTimeout(function(){ clockOpen(btn.closest('.nsc-full-card'),true); },180);
    });
    document.addEventListener('pointerout',function(e){
      if(e.pointerType!=='mouse') return;
      var card=e.target.closest && e.target.closest('#nsPanel .nsc-full-card'); if(!card) return;
      if(e.relatedTarget && card.contains(e.relatedTarget)) return;
      clearTimeout(hoverT);
      var pop=card.querySelector('.nsc-clock-pop'); if(pop && pop.__hover) clockClose(card);
    });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') document.querySelectorAll('#nsPanel .nsc-clock-pop').forEach(function(o){ clockClose(o.parentNode); }); });
  }
  /* Time turns each card's picture into light: as a sleeper's part of the night
     passes, their picture becomes an LED dot matrix, from left to right with a
     ragged, grainy front that evens out as the part ends. Finished parts are
     all light, the coming ones untouched. Only the picture: the name, times,
     emoji and the moon stay on top. Cheap: the picture is read once as a small
     grid of colours, and once a second only the cells whose time has come
     (and the thin flickering front) are drawn. */
  var LED_CELL=5, _led={ grids:{}, timer:0, openedAt:0 };
  function ledProgress(slot){
    // The night's own clock: its date, and the next day once the parts start after midnight.
    if(!st || !Array.isArray(st.sl) || !st.sl.length || !slot) return 0;
    var parts=activeDateKey().match(/^(\d{2})\.(\d{2})\.(\d{4})$/); if(!parts) return 0;
    var base=new Date(+parts[3],+parts[2]-1,+parts[1]);
    if(st.sl[0].s<12*60) base.setDate(base.getDate()+1);
    var start=base.getTime()+slot.s*60000, end=base.getTime()+slot.e*60000, now=Date.now();
    if(now>=end) return 1;
    if(now<=start) return 0;
    return (now-start)/Math.max(1,end-start);
  }
  function ledNoise(cols,rows,seed){
    // Grainy clusters: random cells, softened once with their neighbours.
    var r=new Float32Array(cols*rows), n=new Float32Array(cols*rows), h=seed>>>0;
    for(var i=0;i<r.length;i++){ h=(h*1664525+1013904223)>>>0; r[i]=h/4294967296; }
    for(var y=0;y<rows;y++) for(var x=0;x<cols;x++){
      var s0=0,c0=0;
      for(var dy=-1;dy<=1;dy++) for(var dx=-1;dx<=1;dx++){ var xx=x+dx, yy=y+dy; if(xx<0||yy<0||xx>=cols||yy>=rows) continue; var k=(dx||dy)?1:2; s0+=r[yy*cols+xx]*k; c0+=k; }
      n[y*cols+x]=s0/c0*.6+r[y*cols+x]*.4;
    }
    return n;
  }
  function ledSourceColours(card,cols,rows){
    // The picture as the card shows it, drawn into a grid of cols x rows.
    var c=document.createElement('canvas'); c.width=cols; c.height=rows;
    var x=c.getContext('2d',{willReadFrequently:true}), cs=getComputedStyle(card);
    x.fillStyle=cs.backgroundColor||'#0a1116'; x.fillRect(0,0,cols,rows);
    var skinVar=card.style.getPropertyValue('--mk-skin-img')||'', m=skinVar.match(/url\(['"]?([^'")]+)['"]?\)/);
    var cols2=skinVar.replace(/url\([^)]*\)/g,'').match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)||[];
    function finish(){
      var g=x.createLinearGradient(0,0,0,rows);
      g.addColorStop(0,'rgba(4,9,13,.18)'); g.addColorStop(.58,'rgba(4,9,13,.25)'); g.addColorStop(1,'rgba(4,9,13,.54)');
      x.fillStyle=g; x.fillRect(0,0,cols,rows);
      try{ return x.getImageData(0,0,cols,rows).data; }catch(_e){ return null; }
    }
    function cover(img){
      var iw=img.naturalWidth||img.width||1, ih=img.naturalHeight||img.height||1, k=Math.max(cols/iw,rows/ih);
      x.imageSmoothingQuality='high';
      x.drawImage(img,(cols-iw*k)/2,(rows-ih*k)/2,iw*k,ih*k);
    }
    if(m && card.classList.contains('mk-has-skin')) return bedImage(m[1]).then(function(img){ cover(img); return finish(); }).catch(function(){ return finish(); });
    if(cols2.length>1){
      var gg=x.createLinearGradient(0,0,cols,rows);
      cols2.forEach(function(col,i,all){ gg.addColorStop(i/(all.length-1),col); });
      x.fillStyle=gg; x.fillRect(0,0,cols,rows); return Promise.resolve(finish());
    }
    var svg=card.querySelector('.nsc-deco svg');
    if(svg){
      var src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.outerHTML.indexOf('xmlns')<0?svg.outerHTML.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'):svg.outerHTML);
      return new Promise(function(res){ var im=new Image(); im.onload=function(){ x.drawImage(im,0,0,cols,rows); res(finish()); }; im.onerror=function(){ res(finish()); }; im.src=src; });
    }
    return Promise.resolve(finish());
  }
  // Lit like an LED: the colour more saturated and a little brighter, dark stays dark.
  function ledLight(v,m){ return Math.max(0,Math.min(255,Math.round((m+(v-m)*1.45)*1.12))); }
  function ledSetup(card,slot,index){
    var w=card.clientWidth, h=card.clientHeight; if(w<40||h<40) return;
    var cols=Math.ceil(w/LED_CELL), rows=Math.ceil(h/LED_CELL);
    var key=(card.getAttribute('data-worker')||'')+'|'+(card.style.getPropertyValue('--mk-skin-img')||card.className)+'|'+cols+'x'+rows;
    var cv=card.querySelector('canvas.nsc-led');
    if(!cv){
      cv=document.createElement('canvas'); cv.className='nsc-led'; cv.setAttribute('aria-hidden','true');
      var deco=card.querySelector('.nsc-deco');
      if(deco && deco.nextSibling) card.insertBefore(cv,deco.nextSibling); else card.insertBefore(cv,card.firstChild);
    }
    var dpr=Math.min(2,window.devicePixelRatio||1);
    if(cv.__key!==key){
      cv.__key=key; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
      cv.__st={ cols:cols, rows:rows, dpr:dpr, lit:new Uint8Array(cols*rows), band:[], spark:[], colours:null, noise:ledNoise(cols,rows,index*7919+cols*31+rows), shown:0 };
      var grid=_led.grids[key];
      (grid?Promise.resolve(grid):ledSourceColours(card,cols,rows)).then(function(data){
        if(!data || cv.__key!==key) return;
        _led.grids[key]=data; cv.__st.colours=data;
        // Opening the panel: the light sweeps in to where the night is now.
        var target=ledProgress(slot), lvl=document.documentElement.getAttribute('data-motion')||'full';
        if(target>0 && lvl==='full' && performance.now()-_led.openedAt<2500){
          var t0=performance.now(), dur=1100+index*180;
          (function step(){
            if(cv.__key!==key) return;
            var k=Math.min(1,(performance.now()-t0)/dur), e=1-Math.pow(1-k,3);
            ledDraw(cv,target*e,false);
            if(k<1) requestAnimationFrame(step); else ledDraw(cv,target,true);
          })();
        } else ledDraw(cv,target,true);
      });
    }
    cv.__slot=slot;
  }
  function ledDraw(cv,p,flicker){
    var S=cv.__st; if(!S || !S.colours) return;
    var ctx=cv.getContext('2d'), c=LED_CELL*S.dpr, cols=S.cols, rows=S.rows, col=S.colours, lit=S.lit, n=S.noise;
    var amp=.34*(1-Math.min(1,p))+.04;
    function cell(i,a,boost){
      var x=(i%cols)*c, y=Math.floor(i/cols)*c, q=i*4, r=col[q], g=col[q+1], b=col[q+2];
      ctx.clearRect(x,y,c,c);
      if(a<1){ ctx.globalAlpha=a; }
      ctx.fillStyle='#03060a'; ctx.fillRect(x,y,c,c);
      var m=(r+g+b)/3, lr=ledLight(r*boost,m*boost), lg=ledLight(g*boost,m*boost), lb=ledLight(b*boost,m*boost), gap=Math.max(1,Math.round(c*.2)), sz=c-gap;
      if(r+g+b<45){ ctx.fillStyle='rgba(120,150,180,.1)'; ctx.fillRect(x+gap/2,y+gap/2,sz,sz); }
      else {
        ctx.fillStyle='rgb('+lr+','+lg+','+lb+')'; ctx.fillRect(x+gap/2,y+gap/2,sz,sz);
        ctx.fillStyle='rgba(255,255,255,.14)'; ctx.fillRect(x+gap/2,y+gap/2,sz*.4,sz*.25);
      }
      ctx.globalAlpha=1;
    }
    // Last second's sparks settle; the old front is cleared.
    S.spark.forEach(function(i){ cell(i,1,1); }); S.spark=[];
    S.band.forEach(function(i){ if(!lit[i]) ctx.clearRect((i%cols)*c,Math.floor(i/cols)*c,c,c); }); S.band=[];
    for(var i=0;i<lit.length;i++){
      if(lit[i]) continue;
      var t=((i%cols)+.5)/cols+(n[i]-.5)*amp;
      if(p>=1 || t<p){ lit[i]=1; if(flicker){ cell(i,1,1.35); S.spark.push(i); } else cell(i,1,1); }
      else if(flicker && t<p+.035 && Math.random()<.55){ cell(i,.18+Math.random()*.32,1); S.band.push(i); }
    }
  }
  function ledCards(scope){
    if(!st || !st.sl) return;
    if(!_led.timer) _led.openedAt=performance.now();   // the panel has just opened: sweep in
    nsClockTick();
    (scope||document).querySelectorAll('#nsPanel .nsc-full-card[data-i]').forEach(function(card){
      var i=+card.getAttribute('data-i'), slot=st.sl[i];
      if(!slot) return;
      if(ledProgress(slot)<=0){ var old=card.querySelector('canvas.nsc-led'); if(old) old.remove(); return; }
      ledSetup(card,slot,i);
    });
    if(!_led.timer) _led.timer=setInterval(function(){
      if(!window.__nsOverlayOpen){ clearInterval(_led.timer); _led.timer=0; return; }
      if(document.hidden) return;
      nsClockTick();
      document.querySelectorAll('#nsPanel canvas.nsc-led').forEach(function(cv){
        if(!cv.__slot || !cv.__st || !cv.__st.colours) return;
        var p=ledProgress(cv.__slot);
        if(p<1 || cv.__st.spark.length || cv.__st.band.length) ledDraw(cv,p,p<1);
      });
      // A part that has just begun gets its layer.
      if(st && st.sl) st.sl.forEach(function(slot,i){ var card=document.querySelector('#nsPanel .nsc-full-card[data-i="'+i+'"]'); if(card && !card.querySelector('canvas.nsc-led') && ledProgress(slot)>0) ledSetup(card,slot,i); });
    },1000);
  }
  function applyWorkerSkinsToNightCards(scope){
    if(typeof window.mkGetWorkerSkin!=='function' || typeof window.mkApplySkinToEl!=='function') return;
    (scope||document).querySelectorAll('.nsc-full-card[data-worker], .ns-room-bed[data-worker]').forEach(function(el){
      var worker=el.getAttribute('data-worker')||'';
      window.mkApplySkinToEl(el, window.mkGetWorkerSkin(worker));
    });
    dressCareBed(scope);
    requestAnimationFrame(function(){ ledCards(scope); if(window.NaktsPets) window.NaktsPets.sync(); });
  }
  /* The last part of the night does the morning round: bolus check, orange
     bags, CT/RTG restart and calibration. Three small flat illustrations in
     the bolus device's own palette (dark/light blue, yellow, white; the bag is orange), one bar
     like the fatigue bar above, each with a two-line label. */
  var NS_TASK_ICONS={
    bolus:'<svg viewBox="0 0 24 28" aria-hidden="true">'
      +'<rect x="1.5" y="3" width="6.5" height="10" rx="2" fill="#1f5fb4"/><rect x="3" y="4.6" width="3.5" height="5.4" rx="1.1" fill="#f2c14e"/>'
      +'<rect x="16" y="3" width="6.5" height="10" rx="2" fill="#1f5fb4"/><rect x="17.5" y="4.6" width="3.5" height="5.4" rx="1.1" fill="#f2c14e"/>'
      +'<rect x="9.6" y=".6" width="4.8" height="12" rx="2" fill="#4fb3e3"/><circle cx="12" cy="5" r="1.5" fill="none" stroke="#123b6b" stroke-width=".9"/>'
      +'<path d="M2 12.5h20l-1.4 7H3.4z" fill="#eef2f5"/><path d="M4.8 12.5c0 3 2.8 4 7.2 4.4 4.4-.4 7.2-1.4 7.2-4.4" fill="none" stroke="#f2c14e" stroke-width="1"/><path d="M12 12.5v4.4" stroke="#4fb3e3" stroke-width="1"/>'
      +'<rect x="5.8" y="19" width="12.4" height="8.4" rx="3" fill="#1f5fb4"/><rect x="7.4" y="20.4" width="9.2" height="3.4" rx=".8" fill="#fff"/>'
      +'</svg>',
    bags:'<svg viewBox="0 0 24 28" aria-hidden="true">'
      +'<path d="M8.6 3.2c.9 1.6 5.9 1.6 6.8 0l1.2 2.4c-1.5 1.1-7.7 1.1-9.2 0z" fill="#c8651a"/>'
      +'<path d="M10.2 1.2c1-.8 2.6-.8 3.6 0l-.7 2.4h-2.2z" fill="#c8651a"/>'
      +'<path d="M7.4 5.6c3 1 6.2 1 9.2 0 3.4 3.4 5.2 8.4 5 13.4-.2 4.8-4.4 8-9.6 8s-9.4-3.2-9.6-8c-.2-5 1.6-10 5-13.4z" fill="#f28c28"/>'
      +'<path d="M7.4 5.6c-2.4 2.6-3.8 6.4-3.9 10.4" fill="none" stroke="#f7ad62" stroke-width="1.2" stroke-linecap="round"/>'
      +'<rect x="10.7" y="11.6" width="2.6" height="9" rx=".6" fill="#fff"/><rect x="7.5" y="14.8" width="9" height="2.6" rx=".6" fill="#fff"/>'
      +'</svg>',
    ct:'<svg viewBox="0 0 24 28" aria-hidden="true">'
      +'<rect x="3" y="22" width="18" height="4.6" rx="1.6" fill="#1f5fb4"/>'
      +'<circle cx="12" cy="12" r="10.4" fill="#dfe6ec"/><circle cx="12" cy="12" r="10.4" fill="none" stroke="#b9c4cd" stroke-width="1"/>'
      +'<circle cx="12" cy="12" r="5.6" fill="#123b6b"/>'
      +'<path d="M12 7.6v8.8M7.6 12h8.8" stroke="#4fb3e3" stroke-width="1"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="#4fb3e3" stroke-width="1"/>'
      +'<rect x="1" y="13.4" width="22" height="3" rx="1.2" fill="#eef2f5"/>'
      +'<circle cx="19.4" cy="4.6" r="3.8" fill="#f2c14e"/><path d="M17.6 4.7l1.2 1.2 2.3-2.4" fill="none" stroke="#123b6b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>'
      +'</svg>'
  };
  function lastSlotChecklist(i,total){
    if(i !== total - 1) return '';
    var tasks=[
      ['bolus','Bolusa','pārbaude','Pārbaudīt bolusa gatavību, tīrību un darba kārtību'],
      ['bags','Maisu','nomaiņa','Iznest un nomainīt visus oranžos maisus'],
      ['ct','CT/RTG','kalibrācija','Restartēt un kalibrēt CT/RTG iekārtas']
    ];
    return '<div class="nsc-last-checklist nsc-tasks" aria-label="Pēdējās daļas darbi">'
      + tasks.map(function(t){
        return '<div class="nsc-task" title="'+escHtml(t[3])+'"><i class="nsc-task-ico">'+NS_TASK_ICONS[t[0]]+'</i><div class="nsc-task-txt"><b>'+t[1]+'</b><small>'+t[2]+'</small></div></div>';
      }).join('')
      + '</div>';
  }

  function balancedOrder(workers){
    var arr=fat(Array.isArray(workers)?workers:[]);
    var out=[];
    var a=0,b=arr.length-1;
    while(a<=b){
      if(a<=b) out.push(arr[a++]);
      if(a<=b) out.push(arr[b--]);
    }
    return out;
  }

  function _fatScoreOf(name){
    try{ if(window.__fatigue){ var f=window.__fatigue.calculateFatigue(name); if(f && isFinite(f.score)) return f.score; } }catch(_e){}
    return 50;
  }

  // Greedy max-count assignment of N items to N positions from a counts matrix.
  // cells: [{i,pos,c}], returns array posIndex -> itemIndex (or null). Unfilled
  // positions are left null for the caller to fill (e.g. by fatigue order).
  function _assignByCount(cells, nItems, nPos){
    cells.sort(function(a,b){ return b.c-a.c; });
    var posOf=new Array(nPos).fill(null);
    var iDone=new Array(nItems).fill(false);
    var pDone=new Array(nPos).fill(false);
    cells.forEach(function(cell){
      if(cell.c<=0) return;
      if(iDone[cell.i]||pDone[cell.pos]) return;
      posOf[cell.pos]=cell.i; iDone[cell.i]=true; pDone[cell.pos]=true;
    });
    return { posOf:posOf, iDone:iDone };
  }

  // Order workers so each lands in the part they take most often (history stats).
  // No stats / no data → falls back to fatigue order.
  function freqOrder(workers){
    var N=(workers||[]).length;
    if(!N) return [];
    var stats=_nsStats;
    if(!stats || !stats.parts) return fat(workers);
    var people=workers.map(function(w){
      var nm=String((w&&w.name)||'').trim();
      return { w:w, counts:stats.parts[nm]||[] };
    });
    var cells=[];
    people.forEach(function(p,pi){ for(var s=0;s<N;s++){ cells.push({i:pi,pos:s,c:Math.max(0,Number(p.counts[s])||0)}); } });
    var res=_assignByCount(cells, people.length, N);
    var rem=[]; for(var i=0;i<people.length;i++){ if(!res.iDone[i]) rem.push(i); }
    rem.sort(function(a,b){ return _fatScoreOf(people[b].w.name)-_fatScoreOf(people[a].w.name); });
    for(var s2=0;s2<N;s2++){ if(res.posOf[s2]===null && rem.length) res.posOf[s2]=rem.shift(); }
    return res.posOf.map(function(pi){ return people[pi].w; });
  }

  // Bed positions (ROOM_BED_KEYS order) by each person's most-used bed in history.
  // Used only as the default when no manual bed arrangement is saved for the date.
  function statsBedOrder(names){
    names=(names||[]).slice(0,4);
    var stats=_nsStats;
    if(!stats || !stats.beds) return names.slice(0,4);
    var BK=ROOM_BED_KEYS;
    var cells=[];
    names.forEach(function(nm,pi){
      var bm=stats.beds[String(nm||'').trim()]||{};
      BK.forEach(function(bk,bi){ cells.push({i:pi,pos:bi,c:Math.max(0,Number(bm[bk])||0)}); });
    });
    var res=_assignByCount(cells, names.length, BK.length);
    var rem=[]; for(var i=0;i<names.length;i++){ if(!res.iDone[i]) rem.push(i); }
    for(var b=0;b<BK.length;b++){ if(res.posOf[b]===null && rem.length) res.posOf[b]=rem.shift(); }
    return res.posOf.map(function(pi){ return pi===null?'':names[pi]; });
  }


  function getFlowLiveState(slots){
    if(!slots || !slots.length) return null;
    var cur=nsNightCursor();
    var start=slots[0].s;
    var end=slots[slots.length-1].e;
    if(cur < start || cur > end) return null;
    var tot=Math.max(1, end-start);
    return {
      now: cur,
      pct: Math.max(0, Math.min(100, ((cur-start)/tot)*100))
    };
  }

  function ensureNightSplitLiveStyles(){
    if(document.getElementById('nsLiveFlowStyles')) return;
    var style=document.createElement('style');
    style.id='nsLiveFlowStyles';
    // M3 kustība: standard (.2,0,0,1) pārvietojumiem, emphasized decelerate
    // (.05,.7,.1,1) parādīšanās brīžiem, emphasized accelerate (.3,0,.8,.15)
    // aiziešanai. Nekādas pulsēšanas: līnija vienkārši mierīgi slīd.
    style.textContent=''
      +'#nsPanel .ns-flow-bar{position:relative;overflow:visible}'
      +'#nsPanel .ns-flow-cursor{position:absolute;top:-4px;bottom:-4px;width:3px;margin-left:-1.5px;border-radius:3px;background:#fff;box-shadow:0 0 0 1.5px rgba(6,10,16,.55);pointer-events:none;z-index:7;transition:left 1s linear}'
      +'#nsPanel .ns-flow-labels{position:relative}'
      +'#nsPanel .ns-flow-labels>span{transition:opacity 320ms cubic-bezier(.05,.7,.1,1),translate 420ms cubic-bezier(.05,.7,.1,1)}'
      +'#nsPanel .ns-flow-labels>span.ns-lbl-away{opacity:0;translate:0 -4px;transition:opacity 160ms cubic-bezier(.3,0,.8,.15),translate 200ms cubic-bezier(.3,0,.8,.15)}'
      +'#nsPanel .ns-flow-now-chip{position:absolute;top:50%;left:0;translate:0 -50%;padding:0 7px;border-radius:8px;background:#fff;color:#0b1220;font:600 11px/16px var(--font-ui,system-ui);font-style:normal;font-variant-numeric:tabular-nums;white-space:nowrap;pointer-events:none;transition:left 600ms cubic-bezier(.2,0,0,1)}'
      +'#nsPanel .ns-flow-labels.ns-instant>*{transition:none!important}'
      // Kartīšu statuss: kas guļ tagad, nākamais, jau izgulējušies.
      +':is(#nsOverlay,html) #nsPanel .nsc-full-card{transition:opacity 500ms cubic-bezier(.2,0,0,1),filter 500ms cubic-bezier(.2,0,0,1),box-shadow 500ms cubic-bezier(.2,0,0,1)}'
      +':is(#nsOverlay,html) #nsPanel .nsc-full-card.nsc-is-done{opacity:.62;filter:saturate(.7)}'
      +':is(#nsOverlay,html) #nsPanel .nsc-full-card.nsc-is-now{box-shadow:0 0 0 2px var(--nsc-accent,#fff),0 10px 28px rgba(0,0,0,.35)!important}'
      +':is(#nsOverlay,html) #nsPanel .nsc-full-card .nsc-full-desc span.nsc-desc.is-now{background:#fff!important;color:#0b1220!important;-webkit-text-fill-color:#0b1220!important;font-weight:700!important}'
      +':is(#nsOverlay,html) #nsPanel .nsc-full-card .nsc-full-desc span.nsc-desc.is-next{background:rgba(255,255,255,.18)!important}'
      +'#nsPanel .nsc-full-desc .nsc-desc.nsc-swap{animation:nsDescIn 360ms cubic-bezier(.05,.7,.1,1) both}'
      +'@keyframes nsDescIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}'
      +'@media (prefers-reduced-motion:reduce){#nsPanel .ns-flow-cursor,#nsPanel .ns-flow-labels>*,#nsPanel .nsc-full-card{transition:none!important}#nsPanel .nsc-desc.nsc-swap{animation:none!important}}';
    document.head.appendChild(style);
  }

  // Nakts minūtes tajā pašā skalā kā slot.s/slot.e. Vakarā pirms nakts, kas
  // sākas pēc pusnakts, tās ir negatīvas (lai "nākamā pēc 3 h" strādā).
  // The duty day runs 08:00 → 08:00: before 08:00 we are inside the night of
  // the previous date, from 08:00 on tonight's night is still ahead.
  function nsNightCursor(){
    var now=new Date(), h=now.getHours();
    var cur=h*60+now.getMinutes()+now.getSeconds()/60;
    if(st && typeof st.sh==='number'){
      if(st.sh>=12){ if(h<8) cur+=1440; }
      else if(h>=8) cur-=1440;
    }
    return cur;
  }
  function nsLeftText(min){
    min=Math.max(0,Math.ceil(min));
    if(min<1) return 'mazāk par minūti';
    var h=Math.floor(min/60), m=min%60;
    return h?(h+' h'+(m?' '+m+' min':'')):(m+' min');
  }
  // Viena kartīte: guļ tagad / nākamā / izgulējās. Tikai šodienas naktij.
  function nsSlotState(slots,i,cur){
    // __g_todayStr is the live duty day from calendar.js (it stays on the
    // previous date until 08:00, exactly like tonight's plan does).
    var todayStr=window.__g_todayStr || window.__todayDateStr;
    var today=window.__activeDateStr && todayStr && window.__activeDateStr===todayStr;
    if(!today || !slots || !slots[i]) return null;
    var s=slots[i];
    if(cur>=s.s && cur<s.e) return {cls:'is-now', text:'Guļ · vēl '+nsLeftText(s.e-cur)};
    if(cur>=s.e) return {cls:'is-done', text:'Izgulējās ✓'};
    // Countdown only for the very next person, and only within 12 h.
    var prevStarted = i===0 || cur>=slots[i-1].s;
    if(prevStarted && s.s-cur<=12*60) return {cls:'is-next', text:'Nākamā · pēc '+nsLeftText(s.s-cur)};
    return null;
  }
  // The person whose part it is now colours the window (M3 tonal surfaces, the seed is
  // their card's colour): set on #nsPanel, CSS mixes the tokens. Never a purple seed.
  function nsSeed(css){
    var m=/^#([0-9a-f]{6})$/i.exec(css||''), rgb=m?[0,2,4].map(function(i){return parseInt(m[1].slice(i,i+2),16);}):String(css||'').match(/\d+(\.\d+)?/g);
    if(!rgb || rgb.length<3) return '';
    var r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,l=(mx+mn)/2,sat=0;
    if(mx!==mn){var d=mx-mn;sat=l>.5?d/(2-mx-mn):d/(mx+mn);h=(mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4)*60;}
    if(h>228&&h<330) h=h<279?228:330;
    return 'hsl('+Math.round(h)+' '+Math.round(Math.max(sat*100,35))+'% '+Math.round(Math.min(Math.max(l*100,45),70))+'%)';
  }
  // Whose colour: the part on now; before the night the next one (the first part all day
  // long); after the last part the last one, until the day turns. Another date: its first.
  function nsTintIndex(slots,cur){
    var todayStr=window.__g_todayStr || window.__todayDateStr;
    if(!(window.__activeDateStr && todayStr && window.__activeDateStr===todayStr)) return 0;
    for(var i=0;i<slots.length;i++) if(cur<slots[i].e) return i;
    return slots.length-1;
  }
  function nsTintPanel(card){
    var host=document.getElementById('nsPanel'); if(!host) return;
    var seed=card?nsSeed((card.style.getPropertyValue('--nsc-accent')||'').trim()):'';
    host.classList.toggle('ns-tinted',!!seed);
    if(seed){ if(host.style.getPropertyValue('--ns-seed')!==seed) host.style.setProperty('--ns-seed',seed); }
    else host.style.removeProperty('--ns-seed');
  }
  function nsTintNow(){
    var pc=document.getElementById('nsPanelContent');
    if(!pc || !st || !st.sl || !st.sl.length){ nsTintPanel(null); return; }
    nsTintPanel(pc.querySelector('.nsc-full-card[data-i="'+nsTintIndex(st.sl,nsNightCursor())+'"]'));
  }
  function nsApplyCardStates(cur){
    var panel=document.getElementById('nsPanelContent');
    if(!panel || !st || !st.sl) return;
    panel.querySelectorAll('.nsc-full-card[data-i]').forEach(function(card){
      var i=+card.getAttribute('data-i');
      var state=nsSlotState(st.sl,i,cur);
      ['nsc-is-now','nsc-is-next','nsc-is-done'].forEach(function(c){ card.classList.toggle(c, !!state && c==='nsc-'+state.cls); });
      var span=card.querySelector('.nsc-full-desc .nsc-desc');
      if(!span) return;
      var cls=state?state.cls:'';
      var prev=span.getAttribute('data-state')||'';
      var text=state?state.text:(span.getAttribute('data-desc')||'');
      if(span.textContent!==text) span.textContent=text;
      if(prev!==cls){
        span.classList.remove('is-now','is-next','is-done','nsc-swap');
        if(cls) span.classList.add(cls);
        span.setAttribute('data-state',cls);
        // Stāvokļa maiņa (piem., nākamā → guļ) iezogas; minūšu skaitītājs ne.
        if(prev || span.__nsSeen){ void span.offsetWidth; span.classList.add('nsc-swap'); }
      }
      span.__nsSeen=true;
    });
    nsTintNow();
  }

  // Laika čips zem joslas seko līnijai; tuvās robežu atzīmes (01:50…) paceļas
  // un izgaist, lai nekas nepārklājas, un atgriežas, kad čips aizgājis.
  function nsPlaceNowChip(bar, pct, cur){
    var labels=bar.parentNode && bar.parentNode.querySelector('.ns-flow-labels');
    var chip=labels && labels.querySelector('.ns-flow-now-chip');
    if(!chip) return;
    var h=Math.floor(((cur%1440)+1440)%1440/60), m=Math.floor(((cur%60)+60)%60);
    var text=(h<10?'0':'')+h+':'+(m<10?'0':'')+m;
    if(chip.textContent!==text) chip.textContent=text;
    var W=labels.clientWidth, cw=chip.offsetWidth;
    if(!W || !cw) return;
    var left=Math.max(0, Math.min(W-cw, W*pct/100-cw/2));
    if(!chip.__nsPlaced){
      labels.classList.add('ns-instant');
      setTimeout(function(){ labels.classList.remove('ns-instant'); }, 120);
      chip.__nsPlaced=true;
    }
    chip.style.left=left.toFixed(1)+'px';
    var lb=labels.getBoundingClientRect();
    Array.prototype.forEach.call(labels.querySelectorAll(':scope > span'), function(sp){
      var r=sp.getBoundingClientRect(), l=r.left-lb.left;
      sp.classList.toggle('ns-lbl-away', l+r.width>left-6 && l<left+cw+6);
    });
  }

  var _nsFlowTimer=0;
  function refreshFlowLiveMarker(){
    if(document.hidden || window.__nsOverlayOpen!==true){
      if(_nsFlowTimer){ clearInterval(_nsFlowTimer); _nsFlowTimer=0; }
      return;
    }
    if(!_nsFlowTimer) _nsFlowTimer=setInterval(refreshFlowLiveMarker,1000);
    window.nsRefreshDreams();
    var bar=document.querySelector('#nsPanelContent .ns-flow-bar');
    if(!bar || !st || !st.sl || !st.sl.length) return;
    nsApplyCardStates(nsNightCursor());
    var cursor=bar.querySelector('.ns-flow-cursor');
    var spent=bar.querySelector('.ns-flow-spent');
    var live=getFlowLiveState(st.sl);
    if(!live){
      if(cursor) cursor.style.display='none';
      if(spent) spent.style.width='0%';
      return;
    }
    // Pagājušais laiks — tumšāks pārklājs no sākuma līdz tagadnei
    if(spent) spent.style.width=live.pct.toFixed(3)+'%';
    if(cursor){
      cursor.style.display='block';
      cursor.style.left=live.pct.toFixed(3)+'%';
      nsPlaceNowChip(bar, live.pct, live.now);
    }
  }

  function getPublicPlan(){
    if(!st || !st.sl || !st.sl.length) return null;
    return {
      date: st.dateKey,
      sh: st.sh,
      ei: st.ei,
      count: st.sl.length,
      start: st.sl[0].ss,
      end: st.sl[st.sl.length-1].es,
      segments: st.sl.map(function(s){
        return {
          name: String((s.w && s.w.name) || ''),
          firstName: String((s.w && s.w.name) || '').trim().split(/\s+/)[0] || '',
          start: s.ss,
          end: s.es
        };
      })
    };
  }

  function publishPlan(){
    try{
      if(window.parent && window.parent !== window){
        window.parent.postMessage({type:'nightSplitPlan', plan:getPublicPlan()}, window.location.origin);
      }
    }catch(e){}
  }



  function roomInitials(name){
    var parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return '—';
    if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase();
  }

  function roomNames(name){
    var parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    var main=(parts[0]||'Brīva').toUpperCase();
    var size='14px';
    var scale='1';
    if(main.length >= 13){ size='8.5px'; scale='.88'; }
    else if(main.length >= 12){ size='9px'; scale='.90'; }
    else if(main.length >= 11){ size='9.5px'; scale='.92'; }
    else if(main.length >= 10){ size='10px'; scale='.94'; }
    else if(main.length >= 9){ size='10.5px'; scale='.96'; }
    else if(main.length >= 8){ size='11px'; scale='.98'; }
    else if(main.length >= 7) size='12px';
    else if(main.length >= 6) size='13px';
    return {
      main: escHtml(main),
      sub: escHtml(parts.slice(1).join(' ')),
      size: size,
      scale: scale
    };
  }

  function roomEmoji(name){
    try{
      return window.MinkaEmoji && typeof window.MinkaEmoji.get === 'function'
        ? String(window.MinkaEmoji.get(String(name||'')) || '')
        : '';
    }catch(_e){ return ''; }
  }

  function roomDevices(slot){
    if(!slot || typeof slot._idx !== 'number' || !st || !Array.isArray(st.sl) || !st.sl.length) return '';
    var activeIdx = -1;
    try{
      var now = new Date();
      var cur = now.getHours()*60 + now.getMinutes();
      var firstStart = st.sl[0] ? st.sl[0].s : 0;
      if(firstStart >= 20*60 && cur < 12*60) cur += 1440;
      for(var ai=0; ai<st.sl.length; ai++){
        var sl = st.sl[ai];
        if(cur >= sl.s && cur < sl.e){ activeIdx = ai; break; }
      }
    }catch(_e){ activeIdx = -1; }
    var deviceIdx = activeIdx >= 0 ? activeIdx : 0;
    if(slot._idx !== deviceIdx) return '';
    var arr=['feature','smart','feature','smart'];
    return '<div class="ns-room-bed-devices" aria-hidden="true">'
      + arr.map(function(tp, idx){
          return '<span class="ns-room-device is-'+tp+' dev-'+idx+'"></span>';
        }).join('')
      + '</div>';
  }

  function roomPicture(roomType,layer){
    var main=roomType==='main';
    // Rendered in Blender (scripts/blender/nakts_rooms.py): the floor runs from
    // 10.5 % to 91 % of the picture's height, the front wall's top is at 85.8 %.
    var small=main?440:232;
    var large=main?880:464;
    var height=332;
    var base='assets/rooms/room-'+roomType+'-';
    var rev='?v=20260927rooms6';
    return '<picture class="ns-room-image ns-room-image-'+layer+'" aria-hidden="true">'
      +'<source type="image/avif" srcset="'+base+small+'.avif'+rev+' 1x, '+base+large+'.avif'+rev+' 2x">'
      +'<img src="'+base+small+'.webp'+rev+'" srcset="'+base+small+'.webp'+rev+' 1x, '+base+large+'.webp'+rev+' 2x" width="'+small+'" height="'+height+'" alt="" decoding="async" draggable="false">'
      +'</picture>';
  }

  function roomBedPicture(tone){
    var safe=tone||'neutral';
    var base='assets/rooms/bed-'+safe+'-';
    return '<picture class="ns-room-bed-picture" aria-hidden="true">'
      +'<img src="'+base+'256.webp" width="256" height="364" alt="" decoding="async" draggable="false">'
      +'</picture>';
  }

  function roomSlotStyle(posCls){
    var p=ROOM_SLOTS[posCls]||ROOM_SLOTS['is-center'];
    return '--room-x:'+p.x+'%;--room-y:'+p.y+'%;--room-bed-w:'+p.w+'%;--room-bed-scale:'+p.scale+';--room-bed-z:'+p.z;
  }

  // Only the upcoming slot dreams about the same four handsets as the bed.
  // The personal dream returns as soon as that slot starts.
  function dreamPhones(name){
    if(!st || !Array.isArray(st.sl)) return false;
    // The roster date remains the previous day after midnight. Anchor the
    // actual night to that date instead of comparing it with today's date.
    var parts=activeDateKey().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if(!parts || !st.sl.length) return false;
    var base=new Date(+parts[3],+parts[2]-1,+parts[1]);
    if(st.sl[0].s<12*60) base.setDate(base.getDate()+1);
    var now=Date.now();
    var active=st.sl.findIndex(function(slot){
      var start=new Date(base),end=new Date(base);
      start.setMinutes(slot.s);end.setMinutes(slot.e);
      return now>=+start && now<+end;
    });
    return active>=0 && !!st.sl[active+1] && st.sl[active+1].w.name===name;
  }
  /* Dreams. Each sleeper dreams of something of their own, chosen once a night
     from what the app already shows the team about them: their bed's toy and
     linen, their card's picture and decorations, their emoji, the coffee (or
     energy drink) they had tonight, days off coming, their name day; a tired
     sleeper dreams of rest. Never health, absences, moods or numbers. The same
     dream on every PC (seeded by the name and the night), and two sleepers of a
     night do not dream the same.
     Calm: in a room at most one dream shows at a time, for a few seconds, then
     the room rests; pointing at a bed (or tapping it) shows its dream. The one
     whose part comes next dreams of the four handsets, all the time. */
  // [Fluent strip in assets/emoji-anim, its frames, the emoji while it loads]
  var DREAM_ART={
    cat:['cat',72,'🐈'], blackcat:['black-cat',72,'🐈‍⬛'], coffee:['hot-beverage',72,'☕'], energy:['high-voltage',72,'⚡'],
    teddy:['teddy-bear',69,'🧸'], sloth:['sloth',72,'🦥'], otter:['otter',72,'🦦'], lotus:['person-in-lotus-position',72,'🧘'],
    shell:['spiral-shell',72,'🐚'], compass:['compass',72,'🧭'], rocket:['rocket',73,'🚀'], penguin:['penguin',48,'🐧'],
    fox:['fox',73,'🦊'], owl:['owl',72,'🦉'], whale:['whale',72,'🐋'], dolphin:['dolphin',72,'🐬'], trex:['t-rex',72,'🦖'],
    bee:['honeybee',73,'🐝'], hedgehog:['hedgehog',72,'🦔'], star:['glowing-star',72,'🌟'], shooting:['shooting-star',72,'🌠'],
    moon:['first-quarter-moon-face',72,'🌛'], party:['partying-face',73,'🥳'], xray:['x-ray',73,'🩻'],
    snow:['snowflake',72,'❄️'], polar:['polar-bear',72,'🐻‍❄️'], butterfly:['butterfly',72,'🦋'], unicorn:['unicorn',72,'🦄'],
    deer:['deer',64,'🦌'], mammoth:['mammoth',72,'🦣'], maracas:['maracas',73,'🪇'],
    rabbit:['rabbit-face',72,'🐰'], ufo:['flying-saucer',72,'🛸'], robot:['robot',52,'🤖'], sun:['sun-with-face',72,'🌞'],
    wave:['water-wave',72,'🌊'], disco:['mirror-ball',72,'🪩'], dog:['dog-face',72,'🐶'], panda:['panda',72,'🐼'], bear:['bear',72,'🐻'],
    frog:['frog',72,'🐸'], duck:['duck',72,'🦆'], octopus:['octopus',72,'🐙'], seal:['seal',66,'🦭'], parrot:['parrot',72,'🦜']
  };
  var DREAM_REST={teddy:1,moon:1,sloth:1,otter:1,lotus:1,star:1};
  // what each of the bed's toys, linens, the card's decorations and pictures, and emoji dream of: [art, prop]
  var TOY_DREAM={'toy-teddy':['teddy','🍯'],'toy-teddy-cream':['teddy','🍯'],'toy-teddy-grey':['teddy','🍯'],'toy-panda':['panda','🎋'],'toy-koala':['bear','🌿'],
    'toy-bunny':['rabbit','🥕'],'toy-cat':['cat','🧶'],'toy-cat-black':['blackcat','🦋'],'toy-dog':['dog','🦴'],'toy-fox':['fox','🍂'],'toy-raccoon':['moon','🍎'],
    'toy-lion':['sun','👑'],'toy-monkey':['parrot','🍌'],'toy-pig':['sun','🌼'],'toy-cow':['sun','🌼'],'toy-sheep':['moon','☁️'],'toy-unicorn':['unicorn','✨'],
    'toy-elephant':['mammoth','🥜'],'toy-dino':['trex','🌋'],'toy-penguin':['penguin','🐟'],'toy-owl':['owl','📖'],'toy-chick':['duck','🌼'],'toy-duck':['duck','🫧'],
    'toy-mouse':['cat','🧀'],'toy-hamster':['sun','🌻'],'toy-hedgehog':['hedgehog','🍄'],'toy-frog':['frog','🪷'],'toy-turtle':['wave','🐚'],'toy-ladybug':['butterfly','🌸'],
    'toy-bee':['bee','🌼'],'toy-whale':['whale','🌊'],'toy-dolphin':['dolphin','🌊'],'toy-seal':['seal','🐟'],'toy-octopus':['octopus','🫧'],'toy-star':['shooting','✨'],
    'toy-heart':['star','💛'],'toy-cloud':['moon','✨']};
  var LINEN_DREAM={space:['rocket','🪐'],planets:['ufo','🪐'],planes:['compass','✈️'],fish:['dolphin','🐠'],bees:['bee','🌼'],cats:['cat','🧶'],dinos:['trex','🌿'],
    mushrooms:['hedgehog','🍄'],daisy:['butterfly','🌼'],cherry:['butterfly','🌸'],floral:['butterfly','🌷'],starlight:['shooting','✨'],sky:['moon','⭐'],
    midnight:['moon','✨'],glow:['shooting','✨'],neon:['disco','✨'],neonhearts:['disco','💗'],holo:['star','✨'],gold:['star','✨'],silver:['star','✨'],
    xray:['xray','✨'],radiology:['xray','✨'],knit:['polar','❄️'],wool:['polar','❄️'],flannel:['snow','☕'],lemons:['sun','🍋'],balloons:['party','🎈'],
    rainbows:['unicorn','⭐'],hearts:['teddy','💗']};
  var ADDON_DREAM=[['astronaut',['rocket','🪐']],['planet',['ufo','🪐']],['moon',['moon','⭐']],['owl',['owl','📖']],['coffee',['coffee','🥐']],
    ['paw',['cat','🐾']],['cat',['cat','🐾']],['dice',['star','🎲']],['bear',['teddy','🍯']],['strawberry',['sun','🍓']],['lilies',['butterfly','🌸']],
    ['night',['moon','✨']],['prism',['star','✨']],['heart',['teddy','💗']]];
  var PIC_DREAM=[['cat',['cat','🐾']],['dog',['dog','🦴']],['sea',['whale','🌊']],['ocean',['whale','🌊']],['beach',['shell','🏖️']],['space',['rocket','🪐']],
    ['galaxy',['shooting','✨']],['forest',['deer','🌲']],['flower',['butterfly','🌸']],['sunset',['sun','🌅']],['snow',['polar','❄️']],['aesthetic',['star','✨']],
    ['vapor',['disco','✨']],['rtg',['xray','✨']]];
  var EMOJI_DREAM={'🐱':['cat','🧶'],'🐈':['cat','🧶'],'🐈‍⬛':['blackcat','🦋'],'🐶':['dog','🦴'],'🦊':['fox','🍂'],'🐻':['bear','🍯'],'🐼':['panda','🎋'],
    '🐰':['rabbit','🥕'],'🦄':['unicorn','✨'],'🐧':['penguin','🐟'],'🦉':['owl','📖'],'🐸':['frog','🪷'],'🐙':['octopus','🫧'],'🐝':['bee','🌼'],
    '🦋':['butterfly','🌸'],'🦖':['trex','🌿'],'🦕':['trex','🌿'],'🐿️':['hedgehog','🌰'],'🐬':['dolphin','🌊'],'🐳':['whale','🌊'],'🦦':['otter','🫧'],
    '🦥':['sloth','🌿'],'🦔':['hedgehog','🍄'],'🦭':['seal','🐟'],'🦜':['parrot','🍌'],'🦌':['deer','🌲'],'🐻‍❄️':['polar','❄️'],'🌞':['sun','🌼'],
    '🌛':['moon','⭐'],'🚀':['rocket','🪐'],'🤖':['robot','🎮'],'🛸':['ufo','🌙'],'🧸':['teddy','🍯'],'☕':['coffee','🥐'],'🥳':['party','🎈'],'😎':['sun','🏖️']};
  var DREAM_SEASON={0:['snow','⛄'],1:['polar','❄️'],2:['butterfly','🌱'],3:['rabbit','🌷'],4:['bee','🌼'],5:['sun','🍓'],6:['dolphin','🏖️'],7:['shell','🌊'],
    8:['hedgehog','🍄'],9:['fox','🍂'],10:['owl','🍁'],11:['moon','⭐']};
  var DREAM_ANY=[['cat','🌛'],['blackcat','🦋'],['dolphin','🌊'],['hedgehog','🍄'],['rabbit','🥕'],['owl','📖'],['penguin','❄️'],['fox','🍂'],
    ['coffee','🥐'],['maracas','🎵'],['rocket','🪐'],['compass','🗺️'],['robot','🎮'],['ufo','🌙'],['shell','🏖️'],['teddy','🍯']];
  var ENERGY_DRINKS=/^(monster|monsterultra|redbull|brite)/;
  function dreamRandom(seed){ return function(){ seed=(seed+0x6D2B79F5)|0; var t=Math.imul(seed^(seed>>>15),1|seed); t=t+Math.imul(t^(t>>>7),61|t)^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function dreamDays(a,b){ var x=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(a||''), y=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(b||''); if(!x||!y) return null; return Math.round((new Date(+y[3],+y[2]-1,+y[1])-new Date(+x[3],+x[2]-1,+x[1]))/864e5); }
  function readJson(key){ try{ return JSON.parse(localStorage.getItem(key)||'{}')||{}; }catch(_e){ return {}; } }
  // Everything a sleeper might dream of: [{art, prop, w (weight), tier (a name day beats all)}]
  function dreamIdeas(name,night,drinks,slot){
    var ideas=[], skin=(window.mkGetWorkerSkin && window.mkGetWorkerSkin(name)) || {};
    function add(pair,w,tier){ if(pair && DREAM_ART[pair[0]]) ideas.push({art:pair[0],prop:pair[1]||'',w:w,tier:tier}); }
    var first=String(name||'').trim().split(/\s+/)[0].toLocaleLowerCase('lv-LV'), d=new Date();
    var days=window.LATVIAN_NAMEDAYS && window.LATVIAN_NAMEDAYS[('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)];
    if(first && Array.isArray(days) && days.some(function(n){ return String(n).toLocaleLowerCase('lv-LV')===first; })) add(['party','🌸'],1,90);
    var cup=drinks[name];
    if(cup) add(cup.energy?['energy','🥤']:['coffee','🥐'],20+15*Math.min(2,cup.n),50);
    try{
      var f=window.__fatigue && window.__fatigue.calculateFatigue && window.__fatigue.calculateFatigue(name), next=f && f.nextShift && f.nextShift.date;
      var off=next?dreamDays(night,String(next)):null;
      if(off!=null && off>=3){ add(['sloth','🏖️'],30,60); add(['shell','🏝️'],20,60); add(['otter','🫧'],15,60); }
    }catch(_e){}
    var toy=accOf(BED_TOYS,skin.bp); if(toy) add(TOY_DREAM[toy[0]],30,45);
    add(LINEN_DREAM[skin.bed||''],25,40);
    try{ (window.MinkaCardAddons && window.MinkaCardAddons.getList ? window.MinkaCardAddons.getList(name) : []).forEach(function(it){
      var id=String(it && it.id || ''); ADDON_DREAM.some(function(p){ if(id.indexOf(p[0])>=0){ add(p[1],20,40); return true; } return false; }); }); }catch(_e){}
    add(EMOJI_DREAM[roomEmoji(name)],20,35);
    var pid=String(skin.id||'');
    PIC_DREAM.some(function(p){ if(pid.indexOf(p[0])>=0){ add(p[1],15,30); return true; } return false; });
    if(slot && slot.w && Number(slot.w.fs)>=70){ ideas.forEach(function(i){ i.w*=DREAM_REST[i.art]?2:0.5; }); add(['moon','✨'],15,35); add(['teddy','🍯'],10,35); }
    return ideas;
  }
  // Tonight's dreams, by name: the same on every PC, none twice, remade when their data changes.
  var dreamPlan={key:'',byName:{}}, dreamRev=0, dreamRevAt=0;
  function planDreams(names){
    var night=activeDateKey(), now=Date.now();
    if(now-dreamRevAt>60000){ dreamRevAt=now; dreamRev++; }          // coffee, days off: looked at again every minute
    var key=night+'|'+names.join('|')+'|'+dreamRev;
    if(dreamPlan.key===key) return dreamPlan.byName;
    var counts=readJson('minkaCoffeeCountsV1')[night]||{}, details=readJson('minkaCoffeeDetailsV1')[night]||{}, drinks={};
    var K=window.MinkaCoffeeStore && window.MinkaCoffeeStore.key || function(n){ return String(n||'').trim().toLowerCase(); };
    names.forEach(function(n){
      var k=K(n), c=Number(counts[k])||0; if(!c) return;
      var src=(details[k]&&details[k].sources)||{}, energy=0, coffee=0;
      Object.keys(src).forEach(function(s){ if(ENERGY_DRINKS.test(s)) energy+=Number(src[s])||0; else coffee+=Number(src[s])||0; });
      drinks[n]={n:c, energy:energy>coffee};
    });
    var slots=(st && Array.isArray(st.sl)) ? st.sl : [], taken={}, byName={};
    names.slice().sort().forEach(function(n){
      var rnd=dreamRandom(_nameHash(n+'|'+night)), slot=slots.filter(function(sl){ return sl.w && sl.w.name===n; })[0];
      var ideas=dreamIdeas(n,night,drinks,slot).filter(function(i){ return i.tier>=90 || !taken[i.art]; }), pickd=null;
      var top=ideas.filter(function(i){ return i.tier>=90; })[0];
      if(top) pickd=top;
      else if(ideas.length){
        var sum=ideas.reduce(function(t,i){ return t+i.w; },0), r=rnd()*sum;
        for(var i=0;i<ideas.length && !pickd;i++){ r-=ideas[i].w; if(r<=0) pickd=ideas[i]; }
        pickd=pickd||ideas[ideas.length-1];
      } else {
        var m=new Date().getMonth(), pool=[DREAM_SEASON[m]].concat(DREAM_ANY).filter(function(p){ return !taken[p[0]]; });
        var pp=pool[Math.floor(rnd()*pool.length)]||DREAM_ANY[0];
        pickd={art:pp[0],prop:pp[1]};
      }
      taken[pickd.art]=1; byName[n]={art:pickd.art,prop:pickd.prop};
    });
    dreamPlan={key:key,byName:byName};
    return byName;
  }
  window.__nsDreamPlan=function(){ return dreamPlan.byName; };
  var DREAM_CLOUD='<img class="ns-dream-cloud" src="assets/rooms/dream-cloud-120.webp" srcset="assets/rooms/dream-cloud-120.webp 1x, assets/rooms/dream-cloud-240.webp 2x" alt="" decoding="async" draggable="false">';
  function dreamContents(dream,name,phones){
    if(phones) return '<span class="ns-dream-scene is-phones">'+DREAM_CLOUD+'<span class="ns-dream-phones">'+['feature','smart','feature','smart'].map(function(type){return '<span class="ns-room-device is-'+type+'"></span>';}).join('')+'</span></span>';
    var art=DREAM_ART[dream.art]||DREAM_ART.moon, hash=_nameHash(name);
    var sprite='<span class="ns-dream-sprite" style="--dream-frames:'+art[1]+';--dream-duration:'+(art[1]/12)+'s;--dream-phase:-'+(hash%30/10)+'s"><span class="ns-dream-fallback">'+art[2]+'</span><img class="ns-dream-film" data-src="assets/emoji-anim/'+art[0]+'.webp" alt="" decoding="async" draggable="false"></span>';
    return '<span class="ns-dream-scene is-'+dream.art+'">'+DREAM_CLOUD+sprite+(dream.prop?'<span class="ns-dream-prop">'+dream.prop+'</span>':'')+'</span>';
  }
  function refreshBedDream(el,dream,phones){
    var cloud=el.querySelector('.ns-bed-dream');
    if(!cloud || !dream) return;
    var key=phones?'phones':dream.art+'|'+dream.prop;          // markup only when the dream changes
    if(cloud.__dreamKey===key) return;
    cloud.innerHTML=dreamContents(dream,el.getAttribute('data-worker')||'',phones); cloud.__dreamKey=key;
    if(typeof window.__nsObserveDream==='function') window.__nsObserveDream(cloud);
  }
  // Which dream shows: one a room at a time, in turn, 9 s on, then 22-40 s of rest.
  var dreamRooms={}, dreamPeek={el:null,until:0};
  function dreamOn(el,on){
    if(el.__dreaming===on) return;
    el.__dreaming=on; el.classList.toggle('is-dreaming',on);
    var cloud=el.querySelector('.ns-bed-dream');                 // its strip loads and plays only while it shows
    if(cloud && typeof window.__nsObserveDream==='function') window.__nsObserveDream(cloud);
  }
  function peekDream(el,secs){ dreamPeek={el:el,until:Date.now()+secs*1000}; window.nsRefreshDreams(); }
  (function listenForPeeks(){
    var hoverTimer=0;
    document.addEventListener('pointerover',function(e){
      if(e.pointerType==='touch') return;
      var bed=e.target && e.target.closest && e.target.closest('#nsPanel .ns-room-bed[data-worker]'); if(!bed) return;
      clearTimeout(hoverTimer); hoverTimer=setTimeout(function(){ peekDream(bed,4); },300);
    },true);
    document.addEventListener('pointerout',function(e){
      var bed=e.target && e.target.closest && e.target.closest('#nsPanel .ns-room-bed[data-worker]'); if(!bed) return;
      if(e.relatedTarget && bed.contains(e.relatedTarget)) return;
      clearTimeout(hoverTimer);
      if(dreamPeek.el===bed) dreamPeek.until=Math.min(dreamPeek.until,Date.now()+2000);
    },true);
    var downAt=null;
    document.addEventListener('pointerdown',function(e){ downAt=[e.clientX,e.clientY]; },true);
    document.addEventListener('click',function(e){
      var bed=e.target && e.target.closest && e.target.closest('#nsPanel .ns-room-bed[data-worker]'); if(!bed || !downAt) return;
      if(Math.abs(e.clientX-downAt[0])+Math.abs(e.clientY-downAt[1])>6) return;
      peekDream(bed,6);
    },true);
  })();
  window.nsRefreshDreams=function(){
    if(document.hidden || window.__nsOverlayOpen!==true) return;
    var beds=[].slice.call(document.querySelectorAll('#nsPanel .ns-room-bed[data-worker]'));
    if(!beds.length) return;
    var plan=planDreams(beds.map(function(el){ return el.getAttribute('data-worker')||''; }));
    var now=Date.now(), rooms={};
    beds.forEach(function(el){
      var name=el.getAttribute('data-worker')||'', phones=dreamPhones(name);
      refreshBedDream(el,plan[name],phones);
      el.__phones=phones;
      var room=el.closest('.ns-room-main')?'main':'nmp';
      (rooms[room]=rooms[room]||[]).push(el);
    });
    Object.keys(rooms).forEach(function(k){
      var list=rooms[k], R=dreamRooms[k]||(dreamRooms[k]={i:-1,on:null,t:now+4000});
      if(R.on && !R.on.isConnected) R.on=null;
      var free=function(el){ return !el.__phones && !el.classList.contains('ns-dream-quiet') && !el.classList.contains('ns-duvet-off') && !el.classList.contains('nsdrag'); };
      var peek=dreamPeek.el && dreamPeek.until>now && list.indexOf(dreamPeek.el)>=0 ? dreamPeek.el : null;
      if(!peek && now>=R.t){
        if(R.on){ R.on=null; R.t=now+22000+Math.floor(Math.random()*18000); }
        else {
          var ok=list.filter(free);
          if(ok.length){ R.i=(R.i+1)%ok.length; R.on=ok[R.i]; R.t=now+9000; }
          else R.t=now+5000;
        }
      }
      list.forEach(function(el){ dreamOn(el, el.__phones || el===peek || (!peek && el===R.on && free(el))); });
    });
  };
  /* The sleeper, drawn into the bed picture (nsApplyWorkerColour, nsBedParts): a
     man's or a woman's figure under the (simulated) duvet, the feet in socks in
     their card's look out of its end, the head their emoji on the pillow. When a
     cat pulls the duvet off (js/nakts-pets.js, .ns-duvet-off) the whole person
     shows: T-shirt and socks in the card's look, their own trousers colour,
     emoji-yellow arms. This element only carries who they are (is-f, --pants). */
  var SLEEPER_PANTS=['#3b4048','#2c3a55','#48648c','#80734f','#6f747c','#24272c','#55604a','#6b4a3a'];
  // Latvian names and surnames: a man's end in -s or -š, a woman's in -a or -e.
  // Names that break the rule (men's in -o or Russian men's in -a, women's in -s):
  var MEN_NAMES=/^(raivo|ivo|oto|otto|hugo|marko|aivo|arvo|valdo|niko|nikita|ilja|iļja|miša|saša|kostja|vova|griša|daņa|ļova|luka|kuzma|foma)$/;
  var WOMEN_NAMES=/^(iness|ines|agnes|agneses|doris|dolores|mercedes|frances|iris|lilits)$/;
  function isWoman(name){
    var parts=String(name||'').toLowerCase().split(/[\s.-]+/).map(function(t){ return t.replace(/[^a-zāčēģīķļņōŗšūž]/g,''); }).filter(function(t){ return t.length>1; });
    if(!parts.length) return false;
    if(MEN_NAMES.test(parts[0])) return false;
    if(WOMEN_NAMES.test(parts[0])) return true;
    var man=0, woman=0;
    parts.forEach(function(t){ if(/[sš]$/.test(t)) man++; else if(/[ae]$/.test(t)) woman++; });
    if(man!==woman) return woman>man;
    return !/[sš]$/.test(parts[parts.length-1]);
  }
  window.__nsIsWoman=isWoman;
  function sleeperHTML(name){
    var first=String(name||'').trim().split(/\s+/)[0]||'', female=isWoman(name);
    var h=0; for(var i=0;i<first.length;i++) h=(h*31+first.charCodeAt(i))>>>0;
    return '<span class="ns-sleeper'+(female?' is-f':'')+'" aria-hidden="true" style="--pants:'+SLEEPER_PANTS[h%SLEEPER_PANTS.length]+'"></span>';
  }
  function roomBed(roomIdx, slot, posCls){
    if(!slot){
      return '<div class="ns-room-bed ns-room-bed-empty '+posCls+'" data-i="'+roomIdx+'" data-empty="1" style="'+roomSlotStyle(posCls)+'">'
        +'<div class="ns-room-bed-card">'
        +roomBedPicture('neutral')
        +'</div>'
        +'</div>';
    }
    var c=getCol(slot.w.name);
    var nm=roomNames(slot.w.name);
    var em=roomEmoji(slot.w.name);
    return '<div class="ns-room-bed '+posCls+'" data-i="'+roomIdx+'" data-name="'+escHtml(String(slot.w.name||''))+'" data-worker="'+escHtml(String(slot.w.name||''))+'" data-accent="'+c.accent+'" style="'+roomSlotStyle(posCls)+'">'
      +'<div class="ns-room-bed-card" style="--bed:'+c.accent+';--bed-border:'+c.border+'">'
      +roomBedPicture(c.bed)
      +'<span class="ns-room-bed-skin is-pillow" aria-hidden="true"></span>'
      +'<span class="ns-room-bed-skin is-blanket" aria-hidden="true"></span>'
      +sleeperHTML(slot.w.name)
      +roomDevices(slot)
      +(em?'<div class="ns-room-bed-head-emoji">'+escHtml(em)+'</div>':'')
      +'<span class="ns-bed-dream" aria-hidden="true"></span>'
      +'<div class="ns-room-bed-zzz" aria-hidden="true"><span>Z</span><span>Z</span><span>Z</span></div>'
      +'<div class="ns-room-bed-blanket"><span class="ns-room-bed-main" style="font-size:'+nm.size+';--ns-room-name-scale:'+nm.scale+'">'+nm.main+'</span></div>'
      +'</div>'
      +'</div>';
  }

  function roomLegendItem(slot){
    if(!slot) return '';
    var c=getCol(slot.w.name);
    var em=roomEmoji(slot.w.name);
    return '<div class="ns-room-pill" style="--pill:'+c.accent+'">'
      +'<span class="ns-room-pill-dot"></span>'
      +'<span class="ns-room-pill-name">'+(em?'<span class="ns-room-pill-emoji">'+escHtml(em)+'</span> ':'')+escHtml(String(slot.w.name||''))+'</span>'
      +'<span class="ns-room-pill-time">'+escHtml(slot.ss)+'–'+escHtml(slot.es)+'</span>'
      +'</div>';
  }

  function roomFluentCats(roomType){
    var seed=_nameHash((activeDateKey()||'today')+'|room-fluent-cats');
    var mainIsGinger=(seed%2)===0;
    var isGinger=roomType==='main' ? mainIsGinger : !mainIsGinger;
    var cats=[{
      tone:isGinger?'ginger':'red',
      src:'assets/fluent-cat-'+(isGinger?'ginger':'red')+'.webp?v=20260814skeuo11',
      phase:roomType==='main' ? 3+(seed%29) : 2+((seed>>>3)%21)
    }];
    var blackRoom=((seed>>>1)%2)===0?'main':'nmp';
    if(roomType===blackRoom){
      cats.push({
        tone:'black',
        src:'assets/fluent-cat-black.webp?v=20260814skeuo11',
        phase:roomType==='main' ? 5+((seed>>>5)%33) : 4+((seed>>>6)%25)
      });
    }
    return cats;
  }

  function roomFluentCatImage(cat,size){
    var half=size/2;
    return '<ellipse cx="0" cy="'+(half-3)+'" rx="'+(half-5)+'" ry="2.8" fill="rgba(0,0,0,0.18)" />'
      +'<image class="ns-room-fluent-cat" data-tone="'+cat.tone+'" decoding="async" href="'+cat.src+'" x="-'+half+'" y="-'+(half+2)+'" width="'+size+'" height="'+size+'" preserveAspectRatio="xMidYMid meet" />';
  }

  function roomBlackWalker(roomType,cat){
    if(!cat) return '';
    var isMain=roomType==='main';
    var values=isMain
      ?'336 246; 286 232; 258 198; 302 160; 362 176; 386 222; 350 252; 288 238; 232 210; 184 174; 132 158; 90 188; 118 236; 190 252; 270 246; 336 246'
      :'186 74; 160 112; 196 166; 148 184; 94 148; 70 92; 116 70; 186 74';
    var dur=isMain?43:31;
    return '<g opacity="0.94">'
      +'<animateTransform attributeName="transform" type="translate" values="'+values+'" dur="'+dur+'s" begin="-'+cat.phase+'s" repeatCount="indefinite" calcMode="linear" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -1.5; 0 .8; 0 0" dur="2.15s" repeatCount="indefinite" />'
      +roomFluentCatImage(cat,isMain?29:28)
      +'</g>';
  }

  function roomWalker(roomType){
    var cats=roomFluentCats(roomType);
    var cat=cats[0];
    var black=cats[1]||null;
    if(roomType==='nmp'){
      return '<svg class="ns-room-walker ns-room-walker-nmp" viewBox="0 0 250 308" aria-hidden="true" focusable="false">'
        +'<g opacity="0.95">'
        +'<g>'
        +'<animateTransform attributeName="transform" type="translate" values="42 242; 84 222; 128 196; 176 204; 150 232; 96 236; 42 242" dur="26s" begin="-'+cat.phase+'s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
        +'<animateTransform attributeName="transform" type="scale" additive="sum" values="-1 1; -1 1; -1 1; 1 1; 1 1; 1 1; -1 1" dur="26s" repeatCount="indefinite" calcMode="discrete" />'
        +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -1.4; 0 0.7; 0 -1; 0 0" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
        +roomFluentCatImage(cat,30)
        +'</g>'+roomBlackWalker('nmp',black)+'</g></svg>';
    }
    return '<svg class="ns-room-walker ns-room-walker-main" viewBox="0 0 430 308" aria-hidden="true" focusable="false">'
      +'<g opacity="0.95">'
      +'<g opacity="0.94">'
      +'<g>'
      +'<animateTransform attributeName="transform" type="translate" values="78 112; 94 98; 126 92; 144 108; 136 132; 92 144; 58 148; 42 170; 38 196; 56 218; 92 236; 128 252; 164 248; 202 236; 248 212; 288 182; 322 154; 352 132; 378 112; 386 92; 372 76; 338 74; 308 88; 286 112; 252 148; 224 188; 198 222; 164 242; 126 246; 94 230; 70 204; 62 170; 78 112" dur="40s" repeatCount="indefinite" calcMode="spline" keySplines="0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1; 0.46 0 0.2 1" />'
      +'<animateTransform attributeName="transform" type="scale" additive="sum" values="1 1; 1 1; 1 1; 1 1; -1 1; -1 1; -1 1; -1 1; -1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; 1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; -1 1; 1 1; 1 1; 1 1; 1 1" dur="40s" repeatCount="indefinite" calcMode="discrete" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -1.15; 0 0.6; 0 -0.9; 0 0" dur="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
      +'<animate attributeName="opacity" values="0.96;0.96;0.92;0.86;0.52;0.34;0.28;0.22;0.22;0.42;0.78;0.9;0.96;0.96;0.94;0.9;0.84;0.74;0.62;0.46;0.26;0.22;0.22;0.34;0.66;0.82;0.9;0.96;0.96;0.92;0.86;0.92;0.96" dur="40s" repeatCount="indefinite" calcMode="discrete" />'
      +'<ellipse cx="0" cy="2.8" rx="7.8" ry="4.6" fill="rgba(0,0,0,0.14)" />'
      +'<path d="M-6.5 -0.6 C-9.8 -5.8 -12.6 -9.8 -16.8 -11.2" stroke="rgba(154,160,168,0.96)" stroke-width="1.35" stroke-linecap="round" fill="none" />'
      +'<path d="M-9.2 0 C-8.4 -4.6 -4.8 -7.2 1 -7.2 C7.6 -7.2 11.8 -3.2 11.8 1.2 C11.8 4.8 8.4 7.6 2.8 7.8 C-3.2 8 -8.6 5 -9.2 0 Z" fill="#9aa0a8" />'
      +'<path d="M-6.2 -3.8 C-6.1 -7.4 -4.2 -10 -1.6 -10 C0.2 -10 1.2 -7.4 0.6 -4.6 Z" fill="#b7bec8" />'
      +'<path d="M-1.2 -4.2 C-0.8 -7.4 1 -9.5 3.3 -9.1 C4.8 -8.8 5.2 -6.2 4 -3.8 Z" fill="#c2c8d1" />'
      +'<circle cx="7.3" cy="-1.5" r="0.72" fill="#111827" />'
      +'<circle cx="9.4" cy="0.3" r="0.58" fill="#e8a2b5" />'
      +'<path d="M9.4 0.8 L13.6 -0.5 M9.2 1.7 L13.6 1.8 M9 2.7 L13.1 4.2" stroke="rgba(239,242,247,0.9)" stroke-width="0.78" stroke-linecap="round" />'
      +'</g>'
      +'</g>'
      +'<g>'
      +'<animateTransform attributeName="transform" type="translate" values="74 100; 120 90; 140 124; 92 228; 150 244; 220 228; 320 122; 374 100; 352 144; 260 228; 168 208; 98 128; 74 100" dur="36s" begin="-'+cat.phase+'s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0; 0 -2.1; 0 1.1; 0 -1.4; 0 0" dur="1.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1; 0.42 0 0.2 1" />'
      +'<g>'
      +'<animateTransform attributeName="transform" type="scale" values="-1 1; -1 1; 1 1; 1 1; -1 1; -1 1; -1 1; 1 1; 1 1; 1 1; -1 1; -1 1; -1 1" dur="36s" repeatCount="indefinite" calcMode="discrete" />'
      +roomFluentCatImage(cat,30)
      +'</g>'
      +'<g transform="translate(-12,-11)">'
      +'<animate attributeName="opacity" values="0;0;0;0;0.96;0;0;0;0;0;0;0;0" dur="36s" repeatCount="indefinite" calcMode="discrete" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="-12 -11; -11 -14; -12 -11; -12 -11" dur="2.2s" repeatCount="indefinite" />'
      +'<rect x="-14" y="-11" rx="9" ry="9" width="30" height="15" fill="rgba(255,255,255,0.92)" />'
      +'<path d="M2 2 L5 7 L7 2 Z" fill="rgba(255,255,255,0.92)" />'
      +'<text x="1" y="-1" font-size="8.5" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="#1c1325">ņau</text>'
      +'</g>'
      +'<g transform="translate(12,-11)">'
      +'<animate attributeName="opacity" values="0;0;0;0;0;0;0;0;0;0.9;0;0;0" dur="36s" repeatCount="indefinite" calcMode="discrete" />'
      +'<animateTransform attributeName="transform" type="translate" additive="sum" values="12 -11; 13 -14; 12 -11; 12 -11" dur="2.2s" repeatCount="indefinite" />'
      +'<rect x="-14" y="-11" rx="9" ry="9" width="30" height="15" fill="rgba(255,255,255,0.92)" />'
      +'<path d="M-7 2 L-5 7 L-2 2 Z" fill="rgba(255,255,255,0.92)" />'
      +'<text x="1" y="-1" font-size="8.5" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="#1c1325">ņau</text>'
      +'</g>'
      +'</g>'
      +roomBlackWalker('main',black)
      +'</g></svg>';
  }

  function roomLayout(slots){
    if(!slots||!slots.length) return '';
    var byName={};
    slots.forEach(function(s, idx){
      var nm=String((s && s.w && s.w.name) || '').trim();
      if(nm) byName[nm]=Object.assign({_idx:idx}, s);
    });
    var roomOrder=getRoomOrder(slots);
    var picked=roomOrder.map(function(name){ return byName[name] || null; });
    while(picked.length<4) picked.push(null);
    return '<div class="ns-room-block">'
      +'<div class="ns-room-stage">'
      +'<div class="ns-room-fit"><div class="ns-room-layout">'
      +'<div class="ns-room ns-room-main">'
      +'<div class="ns-room-titlebar">Galvenā istaba</div>'
      +'<div class="ns-room-shell">'
      +roomPicture('main','base')
      +'<div class="ns-room-scene-content">'
      +(window.NaktsPets ? '' : roomWalker('main'))
      +roomBed(0, picked[0], 'is-left')
      +roomBed(1, picked[1], 'is-right-top')
      +roomBed(2, picked[2], 'is-right-bottom')
      +'</div>'
      +roomPicture('main','foreground')
      +'</div>'
      +'</div>'
      +'<div class="ns-room ns-room-nmp">'
      +'<div class="ns-room-titlebar">Jaunais NMP</div>'
      +'<div class="ns-room-shell">'
      +roomPicture('nmp','base')
      +'<div class="ns-room-scene-content">'
      +(window.NaktsPets ? '' : roomWalker('nmp'))
      +roomBed(3, picked[3], 'is-center')
      +'</div>'
      +roomPicture('nmp','foreground')
      +'</div>'
      +'</div>'
      +'</div>'
      +'</div>'
      +nsStatsPanelHTML()
      +'<div class="ns-room-cat">'
      +bedCarePerchHTML()
      +'<div class="ns-cat-rhythm-key" role="button" tabindex="0" aria-label="Atvērt kopīgo nakts tāfeli un sākt zīmēt">'
      +'<span class="ns-chalkboard-art" aria-hidden="true"></span>'
      +'<span class="ns-chalkboard-empty"><b>✎</b></span>'
      +'</div>'
      +'</div>'
      +'</div>'
      +'</div>';
  }

  function fitNightCanvas(panel,canvas){
    if(!canvas) return;
    var shell=panel.parentElement;
    var shellStyle=getComputedStyle(shell);
    var panelStyle=getComputedStyle(panel);
    var shellChrome=['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce(function(sum,key){ return sum+(parseFloat(shellStyle[key])||0); },0);
    var paddingY=(parseFloat(panelStyle.paddingTop)||0)+(parseFloat(panelStyle.paddingBottom)||0);
    var paddingX=(parseFloat(panelStyle.paddingLeft)||0)+(parseFloat(panelStyle.paddingRight)||0);
    var viewportHeight=window.visualViewport ? window.visualViewport.height : innerHeight;
    var availableH=Math.max(1,viewportHeight-24-shellChrome-paddingY);
    var availableW=Math.max(1,panel.clientWidth-paddingX);
    // Measure visible controls rather than transformed room artwork's overflow.
    var bounds=canvas.getBoundingClientRect();
    var naturalH=canvas.offsetHeight;
    var naturalW=canvas.offsetWidth;
    canvas.querySelectorAll('.ns-bedcare-perch-copy,.ns-bedcare-popover,.ns-panel-head').forEach(function(el){
      var rect=el.getBoundingClientRect();
      naturalH=Math.max(naturalH,rect.bottom-bounds.top);
      naturalW=Math.max(naturalW,rect.right-bounds.left);
    });
    // Mobile already stacks the sections in a scrollable panel. Fitting that
    // tall column to screen height shrinks every control and history row.
    var scrollable=document.documentElement.classList.contains('mk-mobile-shell');
    var scale=Math.min(1,scrollable?1:availableH/Math.max(1,naturalH),availableW/Math.max(1,naturalW));
    /* Shrunk to fit the height: the canvas is laid out wider (by as much as it
       shrinks) so it still fills the panel's width, no empty sides. The rooms
       are fitted again for the new width (once). */
    if(!scrollable && !fitNightCanvas._again && typeof fitRoomBlocksNow==='function'){
      var baseW=Math.max(1,panel.clientWidth-paddingX);
      var wantW=scale<.995 ? Math.floor(baseW/Math.max(.55,availableH/Math.max(1,naturalH))) : baseW;
      if(Math.abs(wantW-canvas.offsetWidth)>3){
        canvas.style.width=wantW>baseW ? wantW+'px' : '';
        fitNightCanvas._again=true;
        try{ fitRoomBlocksNow(); } finally { fitNightCanvas._again=false; }
        return;
      }
    }
    var offset=Math.max(0,(availableW-naturalW*scale)/2);
    canvas.style.transform='translateX('+offset+'px) scale('+scale+')';
    panel.style.height=Math.ceil(naturalH*scale+paddingY)+'px';
    if(!scrollable) panel.scrollTop=0;
    panel.scrollLeft=0;
    document.documentElement.style.setProperty('--ns-scene-scale',String(scale));
    var perch=canvas.querySelector('.ns-bedcare-perch');
    if(perch && window.__minkaDailyCat && typeof window.__minkaDailyCat.enterNightSplit==='function') {
      window.__minkaDailyCat.enterNightSplit(perch);
    }
  }

  // Every fit measures the panel at its final size, also when it runs while
  // the panel is still growing out of its launcher (js/mk-motion.js atRest).
  function fitRoomBlocks(root){
    var MM=window.MinkaMotion;
    if(MM && typeof MM.atRest==='function') return MM.atRest('ns', function(){ fitRoomBlocksNow(root); });
    fitRoomBlocksNow(root);
  }
  function fitRoomBlocksNow(root){
    try{
      var scope = root || document;
      var panel = document.getElementById('nsPanelContent');
      if(!panel || window.__nsOverlayOpen!==true) return;
      var canvas=panel.querySelector('.ns-panel-canvas');
      if(canvas) canvas.style.transform='none';
      panel.style.height='';
      var blocks = scope.querySelectorAll('.ns-room-block');
      blocks.forEach(function(block){
        var fit = block.querySelector('.ns-room-fit');
        var layout = fit && fit.querySelector('.ns-room-layout');
        var cat = block.querySelector('.ns-room-cat');
        if(!fit || !layout) return;
        // READ PHASE. scrollWidth/scrollHeight are pre-transform dimensions, so
        // we do not need to reset styles and force a preliminary layout first.
        var naturalW = layout.scrollWidth || layout.offsetWidth || 1;
        var naturalH = layout.scrollHeight || layout.offsetHeight || 1;
        var stats = block.querySelector('.ns-stats-box');
        var stage = block.querySelector('.ns-room-stage');
        var stageStyle = stage && window.getComputedStyle ? getComputedStyle(stage) : null;
        var stagePad = stageStyle ? ((parseFloat(stageStyle.paddingLeft)||0)+(parseFloat(stageStyle.paddingRight)||0)) : 0;
        var blockW = Math.max(0,(stage && stage.clientWidth ? stage.clientWidth-stagePad : 0)) || panel.clientWidth || block.clientWidth || naturalW;
        var narrow = blockW < 640;
        var catW = (cat && !narrow) ? (cat.offsetWidth || 220) : 0;
        // The list's own width (before any share of spare room given below).
        if(stats && !stats.__base) stats.__base = stats.offsetWidth || 318;
        var statsW = (stats && !narrow) ? stats.__base : 0;
        var stageGap = stageStyle ? (parseFloat(stageStyle.columnGap)||parseFloat(stageStyle.gap)||16) : 16;
        var occupiedColumns = 1 + (statsW ? 1 : 0) + (catW ? 1 : 0);
        var gapW = Math.max(0,occupiedColumns-1)*stageGap;
        // Keep a small inner reserve for Windows display scaling/rounding. The
        // former hard-coded 350px stats width under-counted the real 370px
        // column and pushed the bed/board behind the panel's clipped edge.
        var edgeReserve = narrow ? 0 : 4;
        var availW = Math.max(120, blockW - catW - statsW - gapW - edgeReserve);
        var panelRect = panel.getBoundingClientRect();
        var fitRect  = fit.getBoundingClientRect();
        var headEl = block.querySelector('.ns-room-head');
        var headRect = headEl ? headEl.getBoundingClientRect() : null;
        var bottomReserve = 35;
        var availH   = Math.max(80, panelRect.bottom - fitRect.top - bottomReserve);
        var widthScale = Math.min(1.35, availW / naturalW);
        var scale = widthScale;
        // The rooms also fill the row's height (set by the list and the board
        // beside them) instead of leaving it empty under them.
        var cat0 = cat ? cat.querySelector('.ns-bedcare-popover') || cat.querySelector('.ns-bedcare-perch-copy') : null;
        var rowH = cat0 ? cat0.getBoundingClientRect().bottom - (stage ? stage.getBoundingClientRect().top : fitRect.top) : 0;
        if(!narrow && rowH > 120){
          var roomTop = stage ? fitRect.top - (parseFloat(fit.style.marginTop)||0) - stage.getBoundingClientRect().top : 0;
          scale = Math.min(widthScale, (rowH - roomTop - 10) / naturalH);
        } else scale = Math.min(1, widthScale);
        if(!isFinite(scale) || scale <= 0) scale = 1;
        var roomsW = Math.ceil(naturalW * scale);
        var roomsH = Math.ceil(naturalH * scale);
        var lift = (!narrow && headRect) ? Math.max(0, Math.round(fitRect.top-headRect.top)) : 0;

        var carePanel=cat && (cat.querySelector('.ns-bedcare-popover') || cat.querySelector('.ns-bedcare-perch-copy'));
        var careHeight=carePanel ? carePanel.getBoundingClientRect().bottom-cat.getBoundingClientRect().top : 0;

        // WRITE PHASE. All geometry reads above are complete; this single batch
        // avoids read → write → read forced reflow on old CPUs.
        layout.style.removeProperty('--ns-room-height');
        layout.style.transform = 'scale(' + scale + ')';
        fit.style.width  = roomsW + 'px';
        fit.style.height = roomsH + 'px';
        // Width the rooms cannot use (they are held by the row's height): the
        // list takes up to 110 px of it, the rest spreads between the columns.
        if(stats && !narrow){
          var spareW = Math.max(0, Math.floor(availW - roomsW));
          var give = Math.min(110, spareW);
          ['width','min-width','flex-basis'].forEach(function(k){ stats.style.setProperty(k, (stats.__base + give) + 'px', 'important'); });
          if(stage) stage.style.justifyContent = spareW - give > 6 ? 'space-between' : '';
        } else if(stats){
          ['width','min-width','flex-basis'].forEach(function(k){ stats.style.removeProperty(k); });
        }
        // Any height the rooms cannot use is shared above and below them.
        var spare = (!narrow && rowH > 120 && stage) ? rowH - (fitRect.top - (parseFloat(fit.style.marginTop)||0) - stage.getBoundingClientRect().top) - roomsH - 10 : 0;
        fit.style.marginTop = spare > 4 ? Math.round(spare / 2) + 'px' : '';
        if(headEl){
          headEl.style.width = roomsW + 'px';
          headEl.style.textAlign = 'center';
        }
        if(stats) {
          if (narrow) {
            stats.style.marginTop = '10px';
            stats.style.height = 'auto';
            stats.style.width = '100%';
          } else {
            stats.style.marginTop = (-lift) + 'px';
            stats.style.height = (careHeight>0 ? careHeight : Math.max(320, roomsH + lift)) + 'px';
            stats.style.marginTop = '0px';
          }
        }
        if(cat) {
          cat.style.width  = (narrow ? 150 : 220) + 'px';
          cat.style.height = (narrow ? 210 : 250) + 'px';
          // Room below it for the bed-linen note exactly, not a fixed reserve
          // (that left an empty band under the whole row).
          if(!narrow && careHeight > 0) cat.style.setProperty('margin-bottom', Math.max(0, Math.ceil(careHeight - 250)) + 'px', 'important');
        }
      });
      fitNightCanvas(panel,canvas);
    }catch(_e){}
  }

  function scheduleFitRoomBlocks(root){
    cancelAnimationFrame(_nsFitRaf);
    _nsFitRaf=requestAnimationFrame(function(){
      _nsFitRaf=0;
      fitRoomBlocks(root||document);
    });
  }

  // Decode the night panel's pictures while the app is idle, so opening the
  // panel only has to paint them. Pictures stay lazy for the first page load:
  // this runs after the panel's own idle render, never on the critical path.
  var _nsWarmPending=0;
  function warmImages(){
    if(_nsWarmPending) return;
    var run=function(){
      _nsWarmPending=0;
      var overlay=document.getElementById('nsOverlay');
      if(!overlay) return;
      overlay.querySelectorAll('img').forEach(function(img){
        var src=img.currentSrc||img.src;
        if(!src || img.__nsWarm===src || typeof img.decode!=='function') return;
        img.__nsWarm=src;
        img.decode().catch(function(){ img.__nsWarm=''; });
      });
    };
    _nsWarmPending=window.requestIdleCallback ? window.requestIdleCallback(run,{timeout:3000}) : setTimeout(run,300);
  }
  function scheduleIdleRender(renderKey){
    _nsPendingRenderKey=renderKey;
    if(_nsIdleRender){
      if(window.cancelIdleCallback) window.cancelIdleCallback(_nsIdleRender);
      else clearTimeout(_nsIdleRender);
    }
    var run=function(){
      _nsIdleRender=0;
      if(window.__nsOverlayOpen===true || _nsPendingRenderKey!==renderKey || !st) return;
      _nsLastRenderKey=renderKey;
      render();
      warmImages();
    };
    _nsIdleRender=window.requestIdleCallback
      ? window.requestIdleCallback(run,{timeout:1400})
      : setTimeout(run,650);
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function render(reorder){
    // Target the nsPanel inside overlay, not the old bottom panel
    var panel = document.getElementById('nsPanelContent');
    if(!panel) return; // overlay not yet created
    if(!st||!st.sl||!st.sl.length){
      releaseAnims(panel);
      panel.innerHTML='<div style="color:rgba(255,255,255,.35);text-align:center;padding:32px;font-size:13px;">Nav nakts maiņas darbinieku šai dienai.</div>';
      return;
    }
    resetColours();

    var so=START.map(function(o){return'<option value="'+o.v+'"'+(o.v===st.sh?' selected':'')+'>'+o.l+'</option>';}).join('');
    var eo=END.map(function(o,i){return'<option value="'+i+'"'+(i===(st.ei||0)?' selected':'')+'>'+o.l+'</option>';}).join('');
    var startLabel=(START.filter(function(o){return o.v===st.sh;})[0]||START[0]).l;
    var endLabel=(END[st.ei||0]||END[0]).l;

    // Night theme helper — maps the slot's place in this split, not just clock time.
    function _nightTheme(slotIndex, slotCount, startMin, firstStart, lastEnd){
      slotCount=Math.max(1, slotCount||1);
      if(slotCount===1) return 'starry';
      if(slotCount===2) return slotIndex===0?'starry':'sunrise';
      if(slotCount===3) return ['moon','horizon','sunrise'][slotIndex]||'sunrise';
      if(slotCount===4) return ['moon','starry','horizon','sunrise'][slotIndex]||'sunrise';

      var span=Math.max(1, (lastEnd||0)-(firstStart||0));
      var ratio=Math.max(0, Math.min(1, ((startMin||0)-(firstStart||0))/span));
      if(ratio<0.25) return 'moon';
      if(ratio<0.58) return 'starry';
      if(ratio<0.84) return 'horizon';
      return 'sunrise';
    }
    var _nightDescs={moon:'Nakts sākums',starry:'Dziļā nakts',horizon:'Rīta puse',sunrise:'Rīts'};

    function _moonPhase(dateStr){
      try{
        var d;
        if(dateStr){
          var m=String(dateStr).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
          if(m) d=new Date(m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2)+'T12:00:00Z');
          else d=new Date(dateStr+'T12:00:00Z');
        } else { d=new Date(); }
        var ref=new Date('2000-01-06T18:14:00Z');
        var cycle=29.53058867;
        var elapsed=(d-ref)/86400000;
        return((elapsed%cycle)+cycle)%cycle/cycle;
      }catch(e){return 0.5;}
    }
    function _moonSVG(cx,cy,r,phase,uid){
      uid=String(uid||('moon-'+cx+'-'+cy)).replace(/[^a-z0-9_-]/gi,'');
      var grad=uid+'-surface',clip=uid+'-clip';
      var defs='<defs><radialGradient id="'+grad+'" cx="32%" cy="26%" r="76%">'
        +'<stop offset="0%" stop-color="#f0ede4"/><stop offset="48%" stop-color="#bbb9b2"/><stop offset="78%" stop-color="#8a8c89"/><stop offset="100%" stop-color="#5e6467"/>'
        +'</radialGradient><clipPath id="'+clip+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"/></clipPath></defs>';
      var disc='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="url(#'+grad+')"/>';
      var craters='<g clip-path="url(#'+clip+')">'
        +'<ellipse cx="'+(cx-r*.28).toFixed(2)+'" cy="'+(cy-r*.25).toFixed(2)+'" rx="'+(r*.19).toFixed(2)+'" ry="'+(r*.15).toFixed(2)+'" fill="#686b6a" opacity="0.30"/>'
        +'<circle cx="'+(cx+r*.32).toFixed(2)+'" cy="'+(cy-r*.10).toFixed(2)+'" r="'+(r*.12).toFixed(2)+'" fill="#747675" opacity="0.28"/>'
        +'<circle cx="'+(cx+r*.06).toFixed(2)+'" cy="'+(cy+r*.31).toFixed(2)+'" r="'+(r*.16).toFixed(2)+'" fill="#6f7271" opacity="0.25"/>'
        +'<ellipse cx="'+(cx-r*.38).toFixed(2)+'" cy="'+(cy+r*.27).toFixed(2)+'" rx="'+(r*.11).toFixed(2)+'" ry="'+(r*.08).toFixed(2)+'" fill="#555a5b" opacity="0.22"/>'
        +'<circle cx="'+(cx+r*.16).toFixed(2)+'" cy="'+(cy-r*.38).toFixed(2)+'" r="'+(r*.055).toFixed(2)+'" fill="#f4f0e5" opacity="0.34"/>'
        +'<path d="M '+(cx-r*.52).toFixed(2)+' '+(cy+r*.02).toFixed(2)+' Q '+cx+' '+(cy-r*.12).toFixed(2)+' '+(cx+r*.48).toFixed(2)+' '+(cy+r*.08).toFixed(2)+' Q '+cx+' '+(cy+r*.22).toFixed(2)+' '+(cx-r*.52).toFixed(2)+' '+(cy+r*.02).toFixed(2)+' Z" fill="#696d6d" opacity="0.12"/>'
        +'</g>';
      var surface=defs+disc+craters;
      var rim='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#b8bab5" stroke-width="0.65" opacity="0.46"/>';
      var k=(1-Math.cos(2*Math.PI*phase))/2;
      if(k<0.02) return surface+'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#071018" opacity="0.78"/>'+rim;
      if(k>0.98) return surface+rim;
      var shadowPhase=(0.5-phase+1)%1;
      var waxing=shadowPhase<0.5;
      var ex=Math.cos(2*Math.PI*shadowPhase)*r;
      var rx=Math.abs(ex).toFixed(2);
      var T=(cy-r).toFixed(2),B=(cy+r).toFixed(2),X=cx.toFixed(2);
      var shadow;
      if(waxing){
        if(ex>0) shadow='M '+X+' '+T+' A '+r+' '+r+' 0 0 0 '+X+' '+B+' A '+rx+' '+r+' 0 0 1 '+X+' '+T+' Z';
        else     shadow='M '+X+' '+T+' A '+r+' '+r+' 0 0 0 '+X+' '+B+' A '+rx+' '+r+' 0 0 0 '+X+' '+T+' Z';
      } else {
        if(ex>0) shadow='M '+X+' '+T+' A '+r+' '+r+' 0 0 1 '+X+' '+B+' A '+rx+' '+r+' 0 0 0 '+X+' '+T+' Z';
        else     shadow='M '+X+' '+T+' A '+r+' '+r+' 0 0 1 '+X+' '+B+' A '+rx+' '+r+' 0 0 1 '+X+' '+T+' Z';
      }
      return surface+'<path d="'+shadow+'" fill="#071018" opacity="0.91"/>'+rim;
    }

    // Compute fatigue sparkline path data scaled to SVG coordinates


    // SVG background per theme — unique IDs via card index to avoid conflicts.
    // No SVG filters here: blur filters re-rasterize on every animation frame
    // (very expensive on integrated GPUs), so all soft glows use radial
    // gradients and line "glow" is a wide translucent under-stroke instead.
    function _nightSvg(theme, idx, workerName, accent, slot, axisStart, axisEnd){
      var u='nsc'+idx;
      var d='', bg='', deco='', gr='';
      // Cheap glow: wide soft stroke under + crisp stroke on top (no filter)
      function glowLine(path, color, w, op){
        return '<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+(w*3)+'" opacity="'+(op*0.28).toFixed(2)+'" stroke-linecap="round"/>'
          +'<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+w+'" opacity="'+op+'" stroke-linecap="round"/>';
      }

      if(theme==='moon'){
        d='<linearGradient id="'+u+'-bg" x1="10%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#173247"/><stop offset="55%" stop-color="#0d1d29"/><stop offset="100%" stop-color="#071016"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#5da9e9" stop-opacity="0.55"/>'
          +'<stop offset="60%" stop-color="#5da9e9" stop-opacity="0.12"/>'
          +'<stop offset="100%" stop-color="#5da9e9" stop-opacity="0"/>'
          +'</linearGradient>'
          +'<radialGradient id="'+u+'-halo"><stop offset="0%" stop-color="#c8ebff" stop-opacity="0.16"/><stop offset="55%" stop-color="#82bde1" stop-opacity="0.07"/><stop offset="100%" stop-color="#82bde1" stop-opacity="0"/></radialGradient>';
        bg='url(#'+u+'-bg)';
        deco=// Nebula wash
             '<ellipse cx="90" cy="80" rx="110" ry="60" fill="#356d86" opacity="0.06"/>'
            // Scattered stars — grouped for CSS twinkle animation
            +'<g class="ns-stars">'
            +'<circle cx="28" cy="18" r="1"   fill="#fff" opacity="0.5"/>'
            +'<circle cx="72" cy="32" r="1.4" fill="#fff" opacity="0.65"/>'
            +'<circle cx="118" cy="14" r="0.9" fill="#fff" opacity="0.4"/>'
            +'<circle cx="155" cy="26" r="1.1" fill="#fff" opacity="0.55"/>'
            +'<circle cx="60"  cy="52" r="0.8" fill="#fff" opacity="0.3"/>'
            +'</g>'
            // Moon — grouped for CSS float animation (gradient halo, no blur filter)
            +'<g class="ns-moon-float">'
            +'<circle cx="238" cy="36" r="64" fill="url(#'+u+'-halo)"/>'
            +_moonSVG(238,36,27,_moonPhase(window.__activeDateStr),u+'-moon')
            +'</g>';
        gr='<path d="M10 148 Q55 108 115 126 T232 134 L232 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +glowLine('M10 148 Q55 108 115 126 T232 134', '#5da9e9', 2, 0.9);

      } else if(theme==='starry'){
        d='<linearGradient id="'+u+'-bg" x1="5%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#0e1a32"/><stop offset="100%" stop-color="#050b18"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#f0e68c" stop-opacity="0.4"/>'
          +'<stop offset="100%" stop-color="#f0e68c" stop-opacity="0"/>'
          +'</linearGradient>';
        bg='url(#'+u+'-bg)';
        deco=// Milky way subtle diagonal band
             '<ellipse cx="150" cy="55" rx="160" ry="28" fill="#5070c0" opacity="0.055" transform="rotate(-8,150,55)"/>'
            // Stars — grouped for CSS twinkle animation
            +'<g class="ns-stars">'
            +'<circle cx="22"  cy="14" r="1"   fill="#fff" opacity="0.75"/>'
            +'<circle cx="58"  cy="28" r="1.6" fill="#fff" opacity="0.9"/>'
            +'<circle cx="98"  cy="10" r="0.9" fill="#fff" opacity="0.5"/>'
            +'<circle cx="138" cy="22" r="1.2" fill="#fff" opacity="0.7"/>'
            +'<circle cx="178" cy="8"  r="1.5" fill="#fff" opacity="0.85"/>'
            +'<circle cx="215" cy="20" r="0.9" fill="#fff" opacity="0.6"/>'
            +'<circle cx="252" cy="12" r="1.8" fill="#fff" opacity="0.9"/>'
            +'<circle cx="40"  cy="44" r="0.8" fill="#fff" opacity="0.4"/>'
            +'<circle cx="88"  cy="48" r="1"   fill="#fff" opacity="0.5"/>'
            +'<circle cx="130" cy="38" r="0.8" fill="#fff" opacity="0.35"/>'
            +'<circle cx="195" cy="40" r="1"   fill="#fff" opacity="0.55"/>'
            +'<circle cx="262" cy="36" r="0.8" fill="#fff" opacity="0.7"/>'
            +'<circle cx="240" cy="55" r="1.1" fill="#ffe0a0" opacity="0.6"/>'
            +'</g>'; // warm tinted star
        gr='<path d="M10 155 Q42 126 82 144 T152 128 T222 146 L222 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +'<path d="M10 155 Q42 126 82 144 T152 128 T222 146" fill="none" stroke="#f0e68c" stroke-width="5.4" opacity="0.22" stroke-linecap="round"/>'
          +'<path d="M10 155 Q42 126 82 144 T152 128 T222 146" fill="none" stroke="#f0e68c" stroke-width="1.8" stroke-dasharray="5,3" opacity="0.85"/>';

      } else if(theme==='horizon'){
        d='<linearGradient id="'+u+'-bg" x1="5%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#1e1008"/><stop offset="55%" stop-color="#150c06"/><stop offset="100%" stop-color="#0a0604"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-atm" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#ff6010" stop-opacity="0"/>'
          +'<stop offset="100%" stop-color="#ff6010" stop-opacity="0.22"/>'
          +'</linearGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#ffb380" stop-opacity="0.55"/>'
          +'<stop offset="60%" stop-color="#ffb380" stop-opacity="0.1"/>'
          +'<stop offset="100%" stop-color="#ffb380" stop-opacity="0"/>'
          +'</linearGradient>'
          +'<radialGradient id="'+u+'-hg"><stop offset="0%" stop-color="#ffaa40" stop-opacity="0.2"/><stop offset="45%" stop-color="#ff7820" stop-opacity="0.12"/><stop offset="100%" stop-color="#ff5500" stop-opacity="0"/></radialGradient>';
        bg='url(#'+u+'-bg)';
        deco=// Warm atmosphere wash from bottom
             '<rect x="0" y="0" width="280" height="182" fill="url(#'+u+'-atm)"/>'
            // Horizon glow — single gradient ellipse (no blur filter)
            +'<ellipse cx="140" cy="192" rx="180" ry="62" fill="url(#'+u+'-hg)"/>';
        gr='<path d="M10 140 C50 140 68 162 108 154 C148 146 172 142 232 152 L232 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +glowLine('M10 140 C50 140 68 162 108 154 C148 146 172 142 232 152', '#ffb380', 2, 0.9);

      } else { // sunrise
        d='<linearGradient id="'+u+'-bg" x1="5%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#260e16"/><stop offset="55%" stop-color="#19090f"/><stop offset="100%" stop-color="#0e0508"/>'
          +'</linearGradient>'
          +'<radialGradient id="'+u+'-sg" cx="92%" cy="98%" r="70%">'
          +'<stop offset="0%"   stop-color="#ffb030" stop-opacity="0.55"/>'
          +'<stop offset="35%"  stop-color="#ff5020" stop-opacity="0.18"/>'
          +'<stop offset="100%" stop-color="#ff1060" stop-opacity="0"/>'
          +'</radialGradient>'
          +'<linearGradient id="'+u+'-gr" x1="0%" y1="0%" x2="0%" y2="100%">'
          +'<stop offset="0%" stop-color="#ff8ca3" stop-opacity="0.55"/>'
          +'<stop offset="60%" stop-color="#ff8ca3" stop-opacity="0.1"/>'
          +'<stop offset="100%" stop-color="#ff8ca3" stop-opacity="0"/>'
          +'</linearGradient>'
          +'<radialGradient id="'+u+'-sun"><stop offset="0%" stop-color="#ffe060" stop-opacity="0.5"/><stop offset="42%" stop-color="#ffcc40" stop-opacity="0.18"/><stop offset="100%" stop-color="#ffaa20" stop-opacity="0"/></radialGradient>';
        bg='url(#'+u+'-bg)';
        deco=// Dawn atmosphere radial wash
             '<rect x="0" y="0" width="280" height="182" fill="url(#'+u+'-sg)"/>'
            // Sun — gradient halo + solid disc (no blur filters)
            +'<circle cx="256" cy="172" r="88" fill="url(#'+u+'-sun)"/>'
            +'<circle cx="256" cy="172" r="36" fill="#ffe060" opacity="0.82"/>';
        gr='<path d="M10 158 L36 146 L62 152 L88 132 L114 143 L140 118 L166 130 L192 108 L218 122 L232 98 L232 182 L10 182 Z" fill="url(#'+u+'-gr)"/>'
          +glowLine('M10 158 L36 146 L62 152 L88 132 L114 143 L140 118 L166 130 L192 108 L218 122 L232 98', '#ff8ca3', 2, 0.9);
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 182" width="100%" height="100%" preserveAspectRatio="none">'
        +'<defs>'+d+'</defs>'
        +'<rect width="280" height="182" fill="'+bg+'"/>'
        +deco
        +'</svg>';
    }



    // Build full glowing cards
    var cards=st.sl.map(function(s,i){
      var nm=escHtml(String(s.w.name||'').split(/\s+/)[0]);
      var c=getCol(s.w.name);
      var rt=slotRealtime(s);
      var tr=fatigueTrend(s.w.name);
      var dur=Math.floor(s.d/60)+'h'+(((s.d%60))?String(s.d%60).padStart(2,'0')+'m':'');
      var fatPct=s.w.fs||0;
      var fatCol=fatPct>70?'#ff3b30':(fatPct>45?'#ff9500':(fatPct>20?'#ffd60a':'#30d158'));
      var statusCls=rt.active?'active':(rt.status==='NĀKAMĀ'?'upnext':'done');
      var gradCss='conic-gradient(from 0deg, transparent 0%, '+c.accent+' 30%, transparent 60%)';
      var theme=_nightTheme(i, st.sl.length, s.s, st.sl[0].s, st.sl[st.sl.length-1].e);
      var desc=_nightDescs[theme]||'';
      var checklist = lastSlotChecklist(i, st.sl.length);
      var em=(window.MinkaEmoji&&window.MinkaEmoji.get)?(window.MinkaEmoji.get(s.w.name)||''):'';
      return '<div class="nsc-card-wrap" data-i="'+i+'">'
        +'<div class="nsc-full-card nsc-theme-'+theme+(rt.active?' nsc-active':'')+(function(){ var x=nsSlotState(st.sl,i,nsNightCursor()); return x?' nsc-'+x.cls:''; })()+(checklist?' nsc-has-checklist':'')+'" data-i="'+i+'" data-worker="'+escHtml(s.w.name||'')+'" style="--nsc-accent:'+c.accent+';--nsc-grad:'+gradCss+'">'
        +'<div class="nsc-deco" aria-hidden="true">'+_nightSvg(theme,i,s.w.name,c.accent,s,st.sl[0].s,st.sl[st.sl.length-1].e)+'</div>'
        +(theme==='moon'?'<span class="nsc-moon-overlay" aria-hidden="true"><svg viewBox="0 0 64 64">'+_moonSVG(32,32,25,_moonPhase(window.__activeDateStr),'nsc-moon-'+i)+'</svg></span>':'')
        +'<div class="nsc-full-inner">'
        +'<div class="nsc-full-top">'
        +'<span class="nsc-full-name">'+nm+'</span>'
        +'</div>'
        +'<div class="nsc-full-time">'+nsClock(s)+'<span>'+escHtml(s.ss)+' – '+escHtml(s.es)+'</span></div>'
        +(function(){
          var state=nsSlotState(st.sl,i,nsNightCursor());
          if(!desc && !state) return '';
          return '<div class="nsc-full-desc"><span class="nsc-desc'+(state?' '+state.cls:'')+'" data-desc="'+escHtml(desc)+'">'+(state?escHtml(state.text):desc)+'</span></div>';
        })()
        +'<div class="nsc-full-meta">'
        +'<span class="nsc-full-fat '+tr.cls+'" style="--nsc-fat-color:'+fatCol+';--nsc-fat-pct:'+fatPct+'%"><span class="nsc-fat-label">Nogurums</span><span class="nsc-fat-value" style="color:'+fatCol+' !important">'+fatPct+'% '+tr.icon+'</span></span>'
        +'<span class="nsc-dur-cluster"><span class="nsc-full-dur">'+dur+'</span></span>'
        +(em?'<span class="nsc-duration-emoji" aria-hidden="true">'+escHtml(em)+'</span>':'<span class="nsc-duration-emoji nsc-duration-emoji-empty" aria-hidden="true"></span>')
        +'</div>'
        +(rt.active?'<div class="nsc-full-progress"><span style="width:'+rt.pct.toFixed(1)+'%;background:'+c.accent+'"></span></div>':'')
        +'</div>'
        +(checklist?'<div class="nsc-card-checklist">'+checklist+'</div>':'')
        +'</div>'
        +'</div>';
    }).join('');

    ensureNightSplitLiveStyles();

    // Build flow timeline
    var flowBar='';
    if(st.sl.length>1){
      var tot=st.sl[st.sl.length-1].e-st.sl[0].s;
      var live=getFlowLiveState(st.sl);
      var _flowSegs=st.sl.map(function(s,i){
        var c=getCol(s.w.name);
        var pct=(s.d/tot*100).toFixed(2);
        return '<div class="ns-flow-seg'+(slotRealtime(s).active?' is-active':'')+'" style="--w:'+pct+';--seg:'+timelineColour(c)+'"><div class="ns-flow-fill" style="background:'+timelineColour(c)+'"></div></div>';
      }).join('');
      var _flowLabels='<div class="ns-flow-labels"><span>'+escHtml(st.sl[0].ss)+'</span>'
        +st.sl.map(function(s){ return '<span>'+escHtml(s.es)+'</span>'; }).join('')
        +(live?'<i class="ns-flow-now-chip" aria-hidden="true"></i>':'')
        +'</div>';
      flowBar='<div class="ns-flow-bar">'
        +_flowSegs
        +(live?'<div class="ns-flow-spent" style="width:'+live.pct.toFixed(3)+'%"></div>':'<div class="ns-flow-spent" style="width:0%"></div>')
        // "Tagad": tieva līnija joslā un viens laika čips zem tās. Kas guļ un
        // cik vēl atlicis, rāda pašas kartītes (nsApplyCardStates).
        +(live?'<div class="ns-flow-cursor" style="left:'+live.pct.toFixed(3)+'%"></div>':'')
        +'</div>'
        +_flowLabels;
    }
    var nsCount=Math.max(1, Math.min(st.sl.length||1, 4));
    var nsGap=(nsCount>=4)?'4px':((nsCount===3)?'6px':'8px');
    var nsCardH=(nsCount>=4)?'136px':((nsCount===3)?'148px':'164px');
    var nsNameSize=(nsCount>=4)?'9px':((nsCount===3)?'10px':'11px');
    var _roomHtml=roomLayout(st.sl);
    var _metaHtml=sortReason(st.sl);

    // Lightweight reorder path: only refresh the cards row + flow timeline + meta in
    // place, leaving the rooms/stats DOM untouched unless the room layout actually
    // changed. Avoids the full innerHTML rebuild + double fitRoomBlocks reflow + stats
    // re-render on every drag — the heavy parts that lagged on weak PCs.
    var _crEl = reorder ? panel.querySelector('.ns-cards-row') : null;
    if(reorder && _crEl){
      _crEl.style.setProperty('--ns-cols',nsCount);
      _crEl.style.setProperty('--ns-gap',nsGap);
      _crEl.style.setProperty('--ns-card-h',nsCardH);
      _crEl.style.setProperty('--ns-name-size',nsNameSize);
      releaseAnims(_crEl);
      _crEl.innerHTML=cards;
      applyWorkerSkinsToNightCards(_crEl);
      var _ob=panel.querySelector('.ns-flow-bar'); if(_ob){ releaseAnims(_ob); _ob.remove(); }
      var _ol=panel.querySelector('.ns-flow-labels'); if(_ol){ releaseAnims(_ol); _ol.remove(); }
      if(flowBar) _crEl.insertAdjacentHTML('afterend', flowBar);
      var _me=panel.querySelector('.ns-flow-meta'); if(_me) _me.innerHTML=_metaHtml;
      // Beds use the saved per-name arrangement, so a pure reorder leaves the room
      // HTML identical → skip the costly room rebuild + reflow + stats re-render.
      var _rb=panel.querySelector('.ns-room-block');
      var _walkersMissing=!!(_rb && !_rb.querySelector('.ns-room-walker'));
      if(_roomHtml!==_nsLastRoomHtml || _walkersMissing){
        if(_rb){ releaseAnims(_rb); _rb.outerHTML=_roomHtml; }
        _nsLastRoomHtml=_roomHtml;
        applyWorkerSkinsToNightCards(panel);
        wireBedCarePerch(panel);
        wireTimeWheels(panel);
        wireChalkboard(panel);
        scheduleFitRoomBlocks(panel);
        nsRenderStats(st.sl);
      }
      drag(panel);
      try {
        var hasActiveR=st.sl.some(function(s){return slotRealtime(s).active;});
        var btnR=document.getElementById('nsToggleBtn');
        if(btnR){btnR.style.borderColor=hasActiveR?'rgba(0,255,136,.55)':'';btnR.querySelector && btnR.querySelector('.ns-led') && (btnR.querySelector('.ns-led').style.background=hasActiveR?'#00ff88':'');}
      }catch(e){}
      nsTintNow();
      refreshFlowLiveMarker();
      publishPlan();
      return;
    }

    releaseAnims(panel);
    panel.innerHTML=
      '<div class="ns-panel-canvas"><div class="ns-panel-head">'
      +'<span class="ns-panel-title">'+nsHeadIcon()+'<span>Nakts sadalījums</span></span>'
      +'<div class="ns-panel-controls">'
      +'<label class="nss-shell"><select class="nss" aria-label="Nakts sākuma laiks" onchange="__ns.ss(this.value)">'+so+'</select><span class="nss-display" aria-hidden="true">'+escHtml(startLabel)+'</span><span class="nss-chevron" aria-hidden="true"></span></label>'
      +'<span style="color:rgba(255,255,255,.3)">—</span>'
      +'<label class="nss-shell"><select class="nss" aria-label="Nakts beigu laiks" onchange="__ns.se(this.value)">'+eo+'</select><span class="nss-display" aria-hidden="true">'+escHtml(endLabel)+'</span><span class="nss-chevron" aria-hidden="true"></span></label>'
      +'</div>'
      +'<div class="ns-mode-group">'
      +'<span class="ns-mode-glabel">Kārtot</span>'
      +'<div class="ns-mode-btns">'
      +'<button type="button" class="ns-mode-btn'+(_nsSortMode==='freq'?'':' is-on')+'" onclick="__ns.byFat()" title="Kārto pēc noguruma — nogurušākais pirmajā daļā">Nogurums</button>'
      +'<button type="button" class="ns-mode-btn'+(_nsSortMode==='freq'?' is-on':'')+'" onclick="__ns.byFreq()" title="Kārto pēc statistikas — katrs savā biežākajā daļā">Biežums</button>'
      +'<button type="button" class="ns-raffle-trigger" data-ns-raffle-action="open" title="Atvērt nakts daļu izlozi" aria-label="Atvērt nakts izlozi">'
      +'<svg class="ns-raffle-cat" viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
      +'<path class="ns-raffle-cat-head" d="M5.6 12.2 5 4.8l6.8 3.5A13.2 13.2 0 0 1 16 7.6c1.5 0 2.9.2 4.2.7L27 4.8l-.6 7.4a10.8 10.8 0 0 1 1.4 5.3c0 6-5.2 9.7-11.8 9.7S4.2 23.5 4.2 17.5c0-1.9.5-3.7 1.4-5.3Z"/>'
      +'<circle cx="11.3" cy="16.5" r="1.25"/><circle cx="20.7" cy="16.5" r="1.25"/>'
      +'<path d="m14.2 20 1.8 1.45L17.8 20M16 21.45v2.15M9.2 20.4l-5.5-1M9.4 22.5l-5.1.9M22.8 20.4l5.5-1M22.6 22.5l5.1.9"/>'
      +'</svg>'
      +'<span>Izloze</span>'
      +'</button>'
      +'</div>'
      +'</div>'
      +'</div>'
      +'<div class="ns-cards-row" style="--ns-cols:'+nsCount+';--ns-gap:'+nsGap+';--ns-card-h:'+nsCardH+';--ns-name-size:'+nsNameSize+'">'+cards+'</div>'
      +flowBar
      +_roomHtml
      +'<div class="ns-flow-meta">'+_metaHtml+'</div></div>';
    _nsLastRoomHtml=_roomHtml;
    applyWorkerSkinsToNightCards(panel);
    wireBedCarePerch(panel);
    wireTimeWheels(panel);
    wireChalkboard(panel);

    var raffleTrigger=panel.querySelector('.ns-raffle-trigger');
    if(raffleTrigger)raffleTrigger.addEventListener('click',openRaffle);

    scheduleFitRoomBlocks(panel);
    nsRenderStats(st.sl);
    requestAnimationFrame(function(){
      try{
        if(typeof window.__nsSyncWalkerMotion==='function'){
          window.__nsSyncWalkerMotion(window.__nsOverlayOpen===true);
        }
      }catch(_e){}
    });

    drag(panel);
    // Update toggle button LED if active worker exists
    try {
      var hasActive=st.sl.some(function(s){return slotRealtime(s).active;});
      var btn=document.getElementById('nsToggleBtn');
      if(btn){btn.style.borderColor=hasActive?'rgba(0,255,136,.55)':'';btn.querySelector && btn.querySelector('.ns-led') && (btn.querySelector('.ns-led').style.background=hasActive?'#00ff88':'');}
    }catch(e){}
    nsTintNow();
    refreshFlowLiveMarker();
    publishPlan();
  }

  window.addEventListener('resize', function(){ scheduleFitRoomBlocks(document); }, { passive:true });
  if(window.visualViewport) window.visualViewport.addEventListener('resize', function(){ scheduleFitRoomBlocks(document); }, { passive:true });
  if(document.fonts) document.fonts.ready.then(function(){ scheduleFitRoomBlocks(document); });

  // ── Drag & Drop ── pointer events, one layout read when a drag starts ───
  /* Press and move: the bed (or card) lifts into a small ghost that follows the
     pointer; the target under it lights up with a ring (no filters). Drop: the
     two beds glide into each other's place (FLIP, nothing rebuilt) and a handful
     of confetti pops. A press without a move on a bed opens its style picker. */
  function drag(el){
    if(el._dragWired) return;
    el._dragWired=true;
    var SEL='.nsc-full-card, .ns-room-bed[data-i]';
    var pend=null, active=null, ghost=null, raf=0, mx=0, my=0, over=null, spots=null, holdTimer=0;
    function isBed(n){ return !!(n && n.classList && n.classList.contains('ns-room-bed')); }
    function setOver(t){
      if(over===t) return;
      if(over) over.classList.remove('nsover');
      over=t;
      if(over){
        over.classList.add('nsover');
        // A little sparkle each time a new place is reached (from the position read at the start).
        var sp=spots && spots.filter(function(s){ return s.n===over; })[0];
        if(sp) nsCheer(sp.r, (active&&active.getAttribute('data-accent'))||'', 5);
      }
      if(ghost) ghost.classList.toggle('is-over',!!t);
    }
    // Every target's place once, at the start: nothing is measured while moving.
    function measure(src){
      var bed=isBed(src);
      spots=[].slice.call(el.querySelectorAll(bed?'.ns-room-bed[data-i]':'.nsc-full-card')).filter(function(n){ return n!==src; }).map(function(n){
        var r=n.getBoundingClientRect();
        return { n:n, x:r.left+r.width/2, y:r.top+r.height/2, reach:Math.max(r.width,r.height)*.95, r:r };
      });
    }
    function pick(x,y){
      if(!spots || !active) return null;
      var best=null, bd=Infinity;
      if(isBed(active)){
        spots.forEach(function(s){ var dx=s.x-x, dy=s.y-y, d=Math.sqrt(dx*dx+dy*dy); if(d<=s.reach && d<bd){ best=s; bd=d; } });
      } else {
        spots.forEach(function(s){ if(x>=s.r.left && x<=s.r.right && y>=s.r.top && y<=s.r.bottom) best=s; });
      }
      return best ? best.n : null;
    }
    function placeGhost(){ if(ghost) ghost.style.transform='translate3d('+mx+'px,'+my+'px,0)'; }
    function makeGhost(src){
      ghost=document.createElement('div');
      ghost.className='ns-lift-ghost'+(isBed(src)?' is-bed':'');
      var accent=(src.getAttribute('data-accent')||src.style.getPropertyValue('--nsc-accent')||'#56d7e6').trim();
      ghost.style.setProperty('--ghost-accent',accent);
      var name=isBed(src) ? (src.getAttribute('data-name')||'') : ((src.querySelector('.nsc-full-name')||{}).textContent||'');
      var img=isBed(src) && src.querySelector('.ns-room-bed-picture img');
      ghost.innerHTML=(img?'<img alt="" draggable="false" src="'+escHtml(img.currentSrc||img.src)+'">':'')+'<b>'+escHtml(String(name).trim().split(/\s+/)[0]||'?')+'</b>';
      document.body.appendChild(ghost);
      placeGhost();
    }
    function begin(src){
      active=src;
      src.classList.add('nsdrag');
      measure(src);
      makeGhost(src);
      document.documentElement.classList.add('ns-dragging');
    }
    function frame(){ raf=0; placeGhost(); setOver(pick(mx,my)); }
    function finish(commit){
      clearTimeout(holdTimer);
      if(raf){ cancelAnimationFrame(raf); raf=0; }
      var src=active, target=commit ? over : null;
      pend=null; active=null; spots=null;
      document.documentElement.classList.remove('ns-dragging');
      if(!src) return;
      src.classList.remove('nsdrag');
      setOver(null);
      var g=ghost; ghost=null;
      var to=(target||src).getBoundingClientRect();
      if(g){
        // The ghost settles into its bed (or back home) and fades.
        g.classList.add('is-dropping');
        g.style.transform='translate3d('+(to.left+to.width/2)+'px,'+(to.top+to.height/2)+'px,0)';
        setTimeout(function(){ g.remove(); },220);
      }
      if(target){
        var accent=src.getAttribute('data-accent')||src.style.getPropertyValue('--nsc-accent')||'';
        var other=target.getAttribute('data-accent')||'', from=src.getBoundingClientRect();
        // the cheer first: nothing in the move may keep it from showing
        nsCheer(to,accent);
        if(isBed(src) && target!==src) nsCheer(from,other,10);    // the other sleeper lands in the first bed's place
        try{ if(isBed(src)) swapRoom(+src.dataset.i,+target.dataset.i); else swap(+src.dataset.i,+target.dataset.i); }
        catch(err){ if(window.console) console.warn('Nakts: move',err); }
      }
    }
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse' && e.button!==0) return;
      var c=e.target.closest(SEL);
      if(!c || !el.contains(c) || e.target.closest('button, a, input, select, label, .ns-bed-picker')) return;
      if(e.pointerType==='mouse') e.preventDefault();   // no text selection while dragging
      pend={ c:c, x:e.clientX, y:e.clientY, id:e.pointerId, ready:e.pointerType==='mouse' };
      mx=e.clientX; my=e.clientY;
      clearTimeout(holdTimer);
      // Touch: a short hold before a drag, so a swipe still scrolls the panel.
      if(!pend.ready) holdTimer=setTimeout(function(){ if(pend) pend.ready=true; },170);
    });
    el.addEventListener('pointermove',function(e){
      if(!pend || e.pointerId!==pend.id) return;
      mx=e.clientX; my=e.clientY;
      if(!active){
        if(Math.abs(mx-pend.x)+Math.abs(my-pend.y)<6) return;
        if(!pend.ready){ pend=null; clearTimeout(holdTimer); return; }
        try{ el.setPointerCapture(e.pointerId); }catch(_e){}
        begin(pend.c);
      }
      e.preventDefault();
      if(!raf) raf=requestAnimationFrame(frame);
    });
    el.addEventListener('pointerup',function(e){
      if(!pend || e.pointerId!==pend.id) return;
      var src=pend.c;
      if(active){ mx=e.clientX; my=e.clientY; setOver(pick(mx,my)); finish(true); return; }
      pend=null; clearTimeout(holdTimer);
    });
    // Vēsture | Gultas and the bed studio (a bed itself is only for dragging).
    el.addEventListener('click',function(e){
      var t=e.target.closest('#nsStatsBox button'); if(!t) return;
      if(studioClick(t)){ e.preventDefault(); e.stopPropagation(); }
    });
    el.addEventListener('pointercancel',function(){ finish(false); });
    el.addEventListener('lostpointercapture',function(){ if(active) finish(false); });
  }

  /* A light cheer where something landed: a dozen specks, CSS only, gone in a
     second (the same on lite: a few transforms cost nothing); with animations
     turned off they only fade where they are. */
  function nsCheer(rect,accent,count){
    var lvl=document.documentElement.getAttribute('data-motion')||'full';
    if(!rect || !rect.width) return;
    var n=Math.min(count||14,14), mini=n<8, cols=[(accent||'#56d7e6').trim(),'#ffd166','#6dd58c','#f4f2ec','#ff8a5c'], h='';
    for(var i=0;i<n;i++){
      var a=-Math.PI/2+(i/(n-1)-.5)*Math.PI*1.4, d=30+Math.random()*46;
      h+='<i style="--x:'+Math.round(Math.cos(a)*d)+'px;--y:'+Math.round(Math.sin(a)*d)+'px;--r:'+Math.round(Math.random()*420-210)+'deg;--c:'+cols[i%cols.length]+';--d:'+Math.round(Math.random()*70)+'ms'+(i%3?'':';border-radius:50%')+'"></i>';
    }
    var box=document.createElement('div');
    box.className='ns-cheer'+(mini?' is-mini':'')+(lvl==='reduced'?' is-still':''); box.setAttribute('aria-hidden','true');
    box.style.left=(rect.left+rect.width/2)+'px'; box.style.top=(rect.top+rect.height*.42)+'px';
    box.innerHTML=h;
    document.body.appendChild(box);
    setTimeout(function(){ box.remove(); },1150);
  }
  // A bed glides from where it was to where it now is (transform only).
  function nsGlide(bed,from,to){
    if(!bed.animate || (document.documentElement.getAttribute('data-motion')||'full')==='reduced') return;
    var p=bed.parentElement, k=p && p.offsetWidth ? p.getBoundingClientRect().width/p.offsetWidth : 1;
    var dx=(from.left+from.width/2-(to.left+to.width/2))/(k||1), dy=(from.top+from.height/2-(to.top+to.height/2))/(k||1);
    if(Math.abs(dx)+Math.abs(dy)<1) return;
    var ease='cubic-bezier(.2,.9,.25,1.12)';
    try{ var v=getComputedStyle(document.documentElement).getPropertyValue('--mk-ease-spring').trim(); if(v) ease=v; }catch(_e){}
    try{ bed.animate([{translate:dx+'px '+dy+'px'},{translate:'0px 0px'}],{duration:540,easing:ease}); }
    catch(_e){ try{ bed.animate([{translate:dx+'px '+dy+'px'},{translate:'0px 0px'}],{duration:480,easing:'cubic-bezier(.2,.9,.25,1.12)'}); }catch(_e2){} }
  }

  /* Gultu studija: in the history box's place, on the same switch as Vēsture
     (Veļa / Spilveni / Rotaļlietas). No words: the sleepers are their own small
     beds with their emoji, the things are pictures in their own shapes, and a
     page holds as many as fit whole, as big as the space allows. Every pick
     shows on the bed at once. */
  var _studio={ name:'', cat:'linen', page:{} };
  function studioBeds(){ return [].slice.call(document.querySelectorAll('#nsPanel .ns-room-bed[data-worker]')); }
  function titleName(n){ var f=String(n||'').trim().split(/\s+/)[0]||''; return f.charAt(0).toUpperCase()+f.slice(1).toLowerCase(); }
  function sleeperRgb(name,skin){
    var colour=getCol(name,skin);
    return colour.rgb || (/^#[0-9a-f]{6}$/i.test(colour.accent||'') ? [1,3,5].map(function(i){ return parseInt(colour.accent.slice(i,i+2),16); }).join(',') : '120,170,200');
  }
  // Groups follow one another (printed, then fabric, then the rest); "none" first.
  var STUDIO_ORDER={ '':-2, c:-1, k:-1, b:-.5, x:0, p:1, f:2, o:3, a:0, s:1 };
  function studioItems(cat,skin){
    var list, cur, key;
    if(cat==='linen'){
      list=BED_STYLES.map(function(b){ return { id:b[0], label:b[1], group:b[0]?b[2]:'', src:'assets/rooms/bed-neutral-256.webp', linen:true }; });
      cur=bedStyleOf(skin); key='bed';
    } else if(cat==='pillows'){
      list=BED_PILLOWS.map(function(p,i){ return { id:String(i), label:p[1], group:p[4]||'', src:p[0]?bedAccSrc(p[0]):'', tint:p[3]?cushionRgb(p[0]):'' }; });
      cur=String(+(skin.bq||0)||0); key='bq';
    } else {
      list=BED_TOYS.map(function(t,i){ return { id:String(i), label:t[1], group:/^toy-(star|heart|cloud)$/.test(t[0])?'s':(t[0]?'a':''), src:t[0]?bedAccSrc(t[0]):'', tint:false }; });
      cur=String(+(skin.bp||0)||0); key='bp';
    }
    list=list.map(function(x,i){ x.n=i; return x; }).sort(function(x,y){ return (STUDIO_ORDER[x.group]-STUDIO_ORDER[y.group]) || (x.n-y.n); });
    return { list:list, cur:cur, key:key };
  }
  /* animate: only when the person asked for it (a tab, a page, a sleeper); a rebuild
     after saving or a new size shows the same things still, nothing jumps. */
  function renderStudio(animate){
    var box=document.getElementById('nsBedStudio'); if(!box) return;
    box.classList.toggle('is-still',!animate);
    var beds=studioBeds();
    if(!beds.length){ box.innerHTML='<div class="ns-stats-load">Šonakt gultās neviena nav</div>'; return; }
    if(!_studio.name || !beds.some(function(b){ return b.getAttribute('data-worker')===_studio.name; })) _studio.name=beds[0].getAttribute('data-worker');
    var name=_studio.name;
    var people='<div class="ns-studio-people" role="group" aria-label="Kura gulta">'+beds.map(function(b){
      var w=b.getAttribute('data-worker'), im=b.querySelector('.ns-room-bed-picture img'), em=roomEmoji(w);
      return '<button type="button" data-studio-person="'+escHtml(w)+'" aria-pressed="'+(w===name)+'" title="'+escHtml(titleName(w))+'" aria-label="'+escHtml(titleName(w))+'">'
        +'<span class="ns-studio-av"><img alt="" draggable="false" src="'+escHtml(im?(im.currentSrc||im.src):'assets/rooms/bed-neutral-256.webp')+'"></span>'
        +(em?'<span class="ns-studio-em" aria-hidden="true">'+escHtml(em)+'</span>':'')+'<b>'+escHtml(titleName(w))+'</b></button>';
    }).join('')+'</div>';
    box.innerHTML=people
      +'<div class="ns-studio-page"></div>'
      +'<div class="ns-studio-nav"><button type="button" class="ns-studio-arrow" data-studio-page="-1" aria-label="Iepriekšējās"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>'
      +'<span class="ns-studio-dots" aria-hidden="true"></span>'
      +'<button type="button" class="ns-studio-arrow" data-studio-page="1" aria-label="Nākamās"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div>';
    var pageEl=box.querySelector('.ns-studio-page');
    studioSwipe(pageEl);
    // A new size (window, panel) lays the page out again, without the slide.
    if(window.ResizeObserver){
      var lastSize=''; if(_studio.ro) _studio.ro.disconnect();
      _studio.ro=new ResizeObserver(function(){
        var sz=pageEl.clientWidth+'x'+pageEl.clientHeight;
        if(sz===lastSize || !pageEl.isConnected) return;
        var first=!lastSize; lastSize=sz; if(!first) paintStudioPage(0,false);
      });
      _studio.ro.observe(pageEl);
    }
    paintStudioPage(0,animate);
  }
  /* Wheel or a sideways swipe turns the page (no scrolling anywhere). */
  function studioSwipe(pageEl){
    if(!pageEl) return;
    var last=0, x0=null;
    pageEl.addEventListener('wheel',function(e){
      var d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      e.preventDefault();
      if(Math.abs(d)<8 || Date.now()-last<380) return;
      last=Date.now(); studioTurn(d>0?1:-1);
    },{passive:false});
    pageEl.addEventListener('pointerdown',function(e){ x0=e.pointerType==='mouse'?null:e.clientX; });
    pageEl.addEventListener('pointerup',function(e){
      if(x0==null) return; var dx=e.clientX-x0; x0=null;
      if(Math.abs(dx)>40){ _studio.swiped=Date.now(); studioTurn(dx<0?1:-1); }
    });
  }
  function studioTurn(d){
    var k=_studio.cat, it=_studio.pages||1, pg=(_studio.page[k]||0)+d;
    if(pg<0 || pg>=it) return;
    _studio.page[k]=pg; paintStudioPage(d);
  }
  /* One page: the cells grow to fill the whole space (rows and columns counted
     from the measured box), so nothing is cut and nothing is left empty. */
  function paintStudioPage(dir,animate){
    var box=document.getElementById('nsBedStudio'); if(!box) return;
    var pageEl=box.querySelector('.ns-studio-page'); if(!pageEl) return;
    var name=_studio.name, skin=(window.mkGetWorkerSkin && window.mkGetWorkerSkin(name)) || {}, rgb=sleeperRgb(name,skin);
    var it=studioItems(_studio.cat,skin), list=it.list, linen=_studio.cat==='linen';
    var W=pageEl.clientWidth, H=pageEl.clientHeight, g=6;
    if(W<40 || H<40) return;
    // Rows nearest to the target size, a cell never bigger than maxH.
    var target=linen?84:72, maxH=linen?120:92, aspect=linen?256/364:1;
    var rows=Math.max(1,Math.round((H+g)/(target+g))), cellH=Math.min(maxH,Math.floor((H-g*(rows-1))/rows));
    var cols=Math.max(1,Math.floor((W+g)/(cellH*aspect+g))), cellW=Math.floor((W-g*(cols-1))/cols);
    var per=cols*rows, pages=Math.max(1,Math.ceil(list.length/per)), k=_studio.cat;
    if(_studio.page[k]==null){ var ci=list.map(function(x){ return x.id; }).indexOf(it.cur); _studio.page[k]=ci>0?Math.min(Math.floor(ci/per),Math.ceil(list.length/per)-1):0; }
    var pg=Math.max(0,Math.min(pages-1,_studio.page[k]||0));
    _studio.page[k]=pg; _studio.pages=pages;
    pageEl.style.setProperty('--cols',cols); pageEl.style.setProperty('--rows',rows);
    pageEl.style.setProperty('--cell-w',cellW+'px'); pageEl.style.setProperty('--cell-h',cellH+'px');
    pageEl.className='ns-studio-page is-'+_studio.cat+(dir?(dir>0?' is-next':' is-prev'):(animate?'':' is-still'));
    // The last page ends with the last things (it may repeat a few), never half empty.
    var from=Math.max(0,Math.min(pg*per,list.length-per));
    pageEl.innerHTML=list.slice(from,from+per).map(function(x,i){
      return '<button type="button" style="--i:'+i+'" data-studio-pick="'+escHtml(x.id)+'" data-studio-key="'+it.key+'" aria-pressed="'+(x.id===it.cur)+'" title="'+escHtml(x.label)+'" aria-label="'+escHtml(x.label)+'">'
        +(x.src?'<img alt="" draggable="false" data-src="'+escHtml(x.src)+'"'+(x.tint?' data-tint="'+x.tint+'"':'')+(x.linen?' data-linen="'+escHtml(x.id)+'"':'')+'>':'<i class="ns-studio-none" aria-hidden="true"></i>')+'</button>';
    }).join('');
    pageEl.querySelectorAll('img').forEach(function(im){
      var src=im.getAttribute('data-src');
      var set=im.getAttribute('data-linen'), tint=im.getAttribute('data-tint');
      // Linen: the sleeper's own bed with the set on it; cushions: in their own colour.
      if(set!=null){ tintedBed(rgb,src,128,linenOverlay(set,skin,rgb)).then(function(u){ if(im.isConnected) im.src=u; }).catch(function(){ im.src=src; }); return; }
      if(!tint){ im.src=src; return; }
      tintedBed(tint,src,160).then(function(u){ if(im.isConnected) im.src=u; }).catch(function(){ im.src=src; });
    });
    var dots=box.querySelector('.ns-studio-dots'), nav=box.querySelector('.ns-studio-nav');
    nav.classList.toggle('is-single',pages<2);
    var dh=''; for(var i=0;i<pages;i++) dh+='<i'+(i===pg?' class="is-on"':'')+'></i>';
    dots.innerHTML=dh; dots.classList.toggle('is-many',pages>8);
    box.querySelector('[data-studio-page="-1"]').disabled=pg<=0;
    box.querySelector('[data-studio-page="1"]').disabled=pg>=pages-1;
  }
  function setStatsView(view,animate){
    var box=document.getElementById('nsStatsBox'); if(!box) return;
    // One switch: Vēsture, or a part of the bed (Veļa / Spilveni / Rotaļlietas).
    var tab=view;
    if(view!=='hist'){ if(view!=='beds') _studio.cat=view; tab=_studio.cat; view='beds'; }
    // The studio lies over the history list (which keeps its place): the box never changes size.
    _nsView=view; box.dataset.view=view;   // first: the head is measured in this view's own layout
    var head=box.querySelector('.ns-stats-head');
    if(head) box.style.setProperty('--ns-studio-top',(head.offsetTop+head.offsetHeight+4)+'px');
    var bar=box.querySelector('.ns-view-switch');
    if(bar){ bar.querySelectorAll('[data-ns-view]').forEach(function(b){ var on=b.getAttribute('data-ns-view')===tab; b.classList.toggle('is-on',on); b.setAttribute('aria-selected',String(on)); }); nsSegMove(bar,animate); }
    if(view==='beds') renderStudio(!!animate);
  }
  function studioClick(t){
    if(t.hasAttribute('data-ns-view')){ setStatsView(t.getAttribute('data-ns-view'),true); return true; }
    if(t.hasAttribute('data-studio-person')){
      if(t.getAttribute('aria-pressed')==='true') return true;
      _studio.name=t.getAttribute('data-studio-person');
      t.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed',String(b===t)); });
      paintStudioPage(0,true); return true;
    }
    if(t.hasAttribute('data-studio-page')){ studioTurn(+t.getAttribute('data-studio-page')); return true; }
    if(!t.hasAttribute('data-studio-pick')) return false;
    if(_studio.swiped && Date.now()-_studio.swiped<400) return true;
    var name=_studio.name, key=t.getAttribute('data-studio-key'), id=t.getAttribute('data-studio-pick'), patch={};
    if(!name || typeof window.mkPatchWorkerSkin!=='function') return false;
    patch[key]=(key==='bed') ? (id||null) : (+id ? id : null);
    window.mkPatchWorkerSkin(name,patch);
    t.parentNode.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed',String(b===t)); b.classList.remove('is-picked'); });
    void t.offsetWidth; t.classList.add('is-picked');   // a little spring on the chosen one
    var bed=studioBeds().filter(function(b){ return b.getAttribute('data-worker')===name; })[0];
    if(bed) nsCheer(bed.getBoundingClientRect(),bed.getAttribute('data-accent'));
    // The sleeper's little bed follows (new linen shows there too).
    setTimeout(function(){ var av=document.querySelector('#nsBedStudio [data-studio-person][aria-pressed="true"] img'), im=bed&&bed.querySelector('.ns-room-bed-picture img'); if(av&&im) av.src=im.currentSrc||im.src; },600);
    return true;
  }

  // Two sleepers trade their turns (a time-slot card dropped on another).
  function swap(a,b){
    var w=st.sl.map(function(s){return s.w;});
    var t=w[a];w[a]=w[b];w[b]=t;
    st.sl=calc(w,st.sh,st.ei);
    saveCurrentDayState();
    render(true);
    try{ if(window.__nsBarSync) window.__nsBarSync(); }catch(_e){}
    setTimeout(function(){
      var c=document.querySelectorAll('#nsPanelContent .nsc-full-card');
      [a,b].forEach(function(i){if(c[i]){c[i].classList.add('nsswapped');setTimeout(function(){c[i]&&c[i].classList.remove('nsswapped');},600);}});
    },40);
  }

  function swapRoom(a,b){
    if(!st || a===b || a<0 || b<0) return;
    var order=getRoomOrder(st.sl);
    while(order.length<4) order.push('');
    var t=order[a]; order[a]=order[b]; order[b]=t;
    saveRoomOrder(order);
    var panel=document.getElementById('nsPanelContent');
    var A=panel && panel.querySelector('.ns-room-bed[data-i="'+a+'"]'), B=panel && panel.querySelector('.ns-room-bed[data-i="'+b+'"]');
    if(!A || !B){ render(); return; }
    /* The two beds trade places in the DOM (slot index, position, room) instead of
       the whole panel being rebuilt, then glide from where they were. */
    var ra=A.getBoundingClientRect(), rb=B.getBoundingClientRect();
    var POS=/\bis-(?:left|right-top|right-bottom|center)\b/;
    var pa=(A.className.match(POS)||[''])[0], pb=(B.className.match(POS)||[''])[0];
    if(pa) A.classList.remove(pa); if(pb) B.classList.remove(pb);
    if(pb) A.classList.add(pb); if(pa) B.classList.add(pa);
    ['--room-x','--room-y','--room-bed-w','--room-bed-scale','--room-bed-z'].forEach(function(prop){
      var va=A.style.getPropertyValue(prop), vb=B.style.getPropertyValue(prop);
      if(vb) A.style.setProperty(prop,vb); else A.style.removeProperty(prop);
      if(va) B.style.setProperty(prop,va); else B.style.removeProperty(prop);
    });
    A.setAttribute('data-i',String(b)); B.setAttribute('data-i',String(a));
    var mark=document.createComment('');
    A.parentNode.insertBefore(mark,A); B.parentNode.insertBefore(A,B); mark.parentNode.insertBefore(B,mark); mark.remove();
    nsGlide(A,ra,A.getBoundingClientRect());
    nsGlide(B,rb,B.getBoundingClientRect());
    try{ if(window.NaktsPets && window.NaktsPets.bedsMoved) window.NaktsPets.bedsMoved(); }catch(_e){}   // the cats' duvet game stops, the beds are measured again
    // What a rebuild would draw now: the next light render leaves the rooms alone.
    _nsLastRoomHtml=roomLayout(st.sl);
    var idle=window.requestIdleCallback || function(f){ return setTimeout(f,120); };
    idle(function(){ try{ nsRenderStats(st.sl); }catch(_e){} });
  }

  function raffleEscape(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function raffleName(worker){
    return String(worker && (worker.name||worker.fullName||worker.label)||'Kolēģis').trim();
  }

  function raffleRandomIndex(max){
    if(max<=1)return 0;
    try{
      if(window.crypto && window.crypto.getRandomValues){
        var range=0x100000000;
        var limit=range-(range%max);
        var value=new Uint32Array(1);
        do{window.crypto.getRandomValues(value);}while(value[0]>=limit);
        return value[0]%max;
      }
    }catch(_e){}
    return Math.floor(Math.random()*max);
  }

  function raffleShuffle(values){
    var out=values.slice();
    for(var i=out.length-1;i>0;i--){
      var j=raffleRandomIndex(i+1),tmp=out[i];
      out[i]=out[j];out[j]=tmp;
    }
    return out;
  }

  function raffleRemainingWorkers(){
    return _nsRaffle.workers.filter(function(worker){
      return !_nsRaffle.results.some(function(result){return result.worker===worker;});
    });
  }

  function closeRaffle(){
    _nsRaffle.open=false;
    _nsRaffle.selected=-1;
    _nsRaffle.revealing=false;
    _nsRaffle.revealToken++;
    var layer=document.getElementById('nsRaffleLayer');
    if(layer)layer.remove();
  }

  function renderRaffle(){
    if(!_nsRaffle.open)return;
    var layer=document.getElementById('nsRaffleLayer');
    if(!layer){
      layer=document.createElement('div');
      layer.id='nsRaffleLayer';
      layer.className='ns-raffle-layer';
      layer.addEventListener('click',function(event){
        if(event.target===layer){closeRaffle();return;}
        var control=event.target&&event.target.closest?event.target.closest('[data-ns-raffle-action]'):null;
        if(!control||!layer.contains(control))return;
        handleRaffleControl(control);
      });
      var host=document.getElementById('nsPanel')||document.getElementById('night-split-panel')||document.body;
      host.appendChild(layer);
    }

    var remaining=raffleRemainingWorkers();
    if(_nsRaffle.selected>=remaining.length)_nsRaffle.selected=-1;
    var complete=_nsRaffle.results.length===_nsRaffle.workers.length;
    var people=remaining.map(function(worker,index){
      var selected=index===_nsRaffle.selected;
      return '<button type="button" class="ns-raffle-person'+(selected?' is-selected':'')+'" data-ns-raffle-action="person" data-ns-raffle-index="'+index+'" aria-pressed="'+selected+'">'
        +raffleEscape(raffleName(worker))
        +'</button>';
    }).join('');
    var papers=_nsRaffle.parts.map(function(part,index){
      var revealed=_nsRaffle.revealing&&index===_nsRaffle.revealIndex;
      return '<button type="button" class="ns-raffle-paper'+(revealed?' is-revealed':'')+'" data-ns-raffle-action="part" data-ns-raffle-index="'+index+'"'+(_nsRaffle.selected<0||_nsRaffle.revealing?' disabled':'')+' aria-label="Izvēlēties aizklāto nakts daļu">'
        +(revealed?'<span class="ns-raffle-reveal" aria-live="polite">'+raffleEscape(_nsRaffle.revealPart)+'.</span>':'<span class="ns-raffle-question" aria-hidden="true">?</span>')
        +'</button>';
    }).join('');
    var results=_nsRaffle.results.slice().sort(function(a,b){return a.part-b.part;}).map(function(result){
      return '<li><strong>'+raffleEscape(raffleName(result.worker))+'</strong><span class="ns-raffle-result-part">'+result.part+'. daļa</span></li>';
    }).join('');
    var remainingParts=_nsRaffle.parts.slice().sort(function(a,b){return a-b;}).join(', ');

    layer.innerHTML='<section class="ns-raffle-dialog" role="dialog" aria-modal="true" aria-labelledby="nsRaffleTitle">'
      +'<header class="ns-raffle-topbar"><div class="ns-raffle-title"><h2 id="nsRaffleTitle">Nakts izloze 🐾</h2></div>'
      +'<div class="ns-raffle-top-actions"><button type="button" class="ns-raffle-reset" data-ns-raffle-action="reset" aria-label="Sākt izlozi no jauna">Sākt no jauna</button><button type="button" class="ns-raffle-close" data-ns-raffle-action="close" aria-label="Aizvērt nakts izlozi">×</button></div></header>'
      +'<div class="ns-raffle-paper-stage" style="--paper-count:'+Math.max(1,_nsRaffle.parts.length)+'">'+papers+'</div>'
      +'<div class="ns-raffle-remaining">Atlikušās daļas: <strong>'+(remainingParts||'nav')+'</strong></div>'
      +'<section class="ns-raffle-panel"><div class="ns-raffle-step">1. Izvēlies darbinieku</div><div class="ns-raffle-people">'+(people||'<span class="ns-raffle-step">Visi darbinieki ir izlozēti.</span>')+'</div>'
      +'<div class="ns-raffle-results"><div class="ns-raffle-results-head"><span class="ns-raffle-step">Rezultāti</span>'+(complete?'<button type="button" class="ns-raffle-apply" data-ns-raffle-action="apply">Lietot sadalījumu</button>':'')+'</div><ol>'+(results||'<li class="is-empty">Vēl neviens nav izlozējis.</li>')+'</ol></div></section>'
      +'</section>';
    var close=layer.querySelector('.ns-raffle-close');
    if(close)close.focus({preventScroll:true});
  }

  function openRaffle(){
    if(!st||!st.sl||st.sl.length<2)return;
    _nsRaffle={
      open:true,
      workers:st.sl.map(function(slot){return slot.w;}),
      selected:-1,
      parts:raffleShuffle(st.sl.map(function(_slot,index){return index+1;})),
      results:[],
      revealing:false,
      revealIndex:-1,
      revealPart:null,
      revealToken:0
    };
    renderRaffle();
  }

  function resetRaffle(){
    if(!_nsRaffle.open)return;
    _nsRaffle.selected=-1;
    _nsRaffle.parts=raffleShuffle(_nsRaffle.workers.map(function(_worker,index){return index+1;}));
    _nsRaffle.results=[];
    _nsRaffle.revealing=false;
    _nsRaffle.revealIndex=-1;
    _nsRaffle.revealPart=null;
    _nsRaffle.revealToken++;
    renderRaffle();
  }

  function selectRafflePerson(index){
    var remaining=raffleRemainingWorkers();
    if(index<0||index>=remaining.length)return;
    _nsRaffle.selected=index;
    renderRaffle();
  }

  function revealRafflePart(worker,index){
    if(_nsRaffle.revealing||!worker||index<0||index>=_nsRaffle.parts.length)return;
    var part=_nsRaffle.parts[index];
    var token=++_nsRaffle.revealToken;
    _nsRaffle.revealing=true;
    _nsRaffle.revealIndex=index;
    _nsRaffle.revealPart=part;
    renderRaffle();
    setTimeout(function(){
      if(!_nsRaffle.open||token!==_nsRaffle.revealToken)return;
      _nsRaffle.results.push({worker:worker,part:part});
      _nsRaffle.parts.splice(index,1);
      _nsRaffle.parts=raffleShuffle(_nsRaffle.parts);
      _nsRaffle.selected=-1;
      _nsRaffle.revealing=false;
      _nsRaffle.revealIndex=-1;
      _nsRaffle.revealPart=null;
      var finalWorkers=raffleRemainingWorkers();
      if(_nsRaffle.parts.length===1&&finalWorkers.length===1){
        _nsRaffle.selected=0;
        renderRaffle();
        revealRafflePart(finalWorkers[0],0);
        return;
      }
      renderRaffle();
    },420);
  }

  function selectRafflePart(index){
    var remaining=raffleRemainingWorkers();
    if(_nsRaffle.revealing||_nsRaffle.selected<0||_nsRaffle.selected>=remaining.length||index<0||index>=_nsRaffle.parts.length)return;
    revealRafflePart(remaining[_nsRaffle.selected],index);
  }

  function applyRaffle(){
    if(!st||_nsRaffle.results.length!==_nsRaffle.workers.length)return;
    var ordered=_nsRaffle.results.slice().sort(function(a,b){return a.part-b.part;}).map(function(result){return result.worker;});
    st.sl=calc(ordered,st.sh,st.ei);
    saveCurrentDayState();
    closeRaffle();
    render(true);
    try{if(window.__nsBarSync)window.__nsBarSync();}catch(_e){}
  }

  function handleRaffleControl(control){
    var action=control.getAttribute('data-ns-raffle-action');
    var index=parseInt(control.getAttribute('data-ns-raffle-index'),10);
    if(action==='close')closeRaffle();
    else if(action==='reset')resetRaffle();
    else if(action==='person')selectRafflePerson(index);
    else if(action==='part')selectRafflePart(index);
    else if(action==='apply')applyRaffle();
  }

  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&_nsRaffle.open){event.preventDefault();closeRaffle();}
  });

  function update(){
    var el=document.getElementById('night-split-panel');if(!el)return;
    try{ window.__todayDateStr = (window.__grafiksTodayStr || window.__todayDateStr || ''); }catch(e){}
    var dk=activeDateKey();
    if(dk) pullRoomState(dk, function(){ if(dk===activeDateKey() && window.__nsOverlayOpen===true) render(); });
    resetColours(); // reset colour map each time we re-compute for new day
    var wk=getW();
    if(wk.length<2){st=null;_nsLastRenderKey='';render();return;}
    var fallbackSh=st?st.sh:0, fallbackEi=st?(st.ei||0):0;
    var applied=applySavedDayState(fat(wk), fallbackSh, fallbackEi);
    var next={dateKey:dk,sh:applied.sh,ei:applied.ei,sl:calc(applied.workers,applied.sh,applied.ei)};
    var nextKey=[activeDateKey(),next.sh,next.ei,_nsSortMode,next.sl.map(function(slot){
      return [String((slot.w&&slot.w.name)||''),Number(slot.w&&slot.w.fs)||0,slot.s,slot.e].join(':');
    }).join('|')].join('::');
    var panel=document.getElementById('nsPanelContent');
    st=next;
    if(nextKey===_nsLastRenderKey && panel && panel.querySelector('.ns-panel-head')){
      scheduleFitRoomBlocks(panel);
      // Reopening reuses the panel DOM; still retry expired/failed history.
      nsRenderStats(st.sl);
      bedCareFetch().then(bedCareRenderPerch);
      nsTintNow();
      refreshFlowLiveMarker();
      publishPlan();
      return;
    }
    if(window.__nsOverlayOpen!==true){
      scheduleIdleRender(nextKey);
      return;
    }
    if(_nsIdleRender){
      if(window.cancelIdleCallback) window.cancelIdleCallback(_nsIdleRender);
      else clearTimeout(_nsIdleRender);
      _nsIdleRender=0;
    }
    _nsLastRenderKey=nextKey;
    render();
  }

  function init(){
    if(window.MINKA_APP==='rad')return;                // radiographers' night plan only
    if(!window.__grafiksStore){setTimeout(init,500);return;}
    startRoomPolling();
    // Roster/auth are ready now; warm history before the night panel is opened.
    // This does not wait on, modify, or delay the application loader.
    if(window.requestIdleCallback) window.requestIdleCallback(nsWarmStats,{timeout:2000});
    else setTimeout(nsWarmStats,0);
    document.addEventListener('minka:auth-ok',nsWarmStats);
    document.addEventListener('visibilitychange',nsWarmStats);
    window.addEventListener('daySelected',function(){setTimeout(update,200);});
    setTimeout(update,600);setTimeout(update,1500);
    document.addEventListener('visibilitychange',refreshFlowLiveMarker);
  }


  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else setTimeout(init,400);

  document.addEventListener('minka:fatigue-updated',function(){
    if(document.hidden || window.__nsOverlayOpen!==true || !st || !window.__fatigue)return;
    // Refresh values only. A saved order must never sort itself as scores change.
    st.sl.forEach(function(slot){var f=window.__fatigue.calculateFatigue(slot.w.name);if(f)slot.w.fs=f.score;});
    render();
  });

  window.__ns={
    _render: render,
    warmImages: warmImages,
    closeTimeWheel: function(){ closeTimeWheel(false); },
    _update: update,
    getPlan:getPublicPlan,
    // Read only, for the mood gallery's night room: who sleeps in which bed
    // (ROOM_BED_KEYS order, as the room picture shows them) and each one's colour.
    getRoomBeds:function(){
      if(!st || !st.sl || !st.sl.length) return null;
      var colors={};
      st.sl.forEach(function(s){ var n=String((s.w && s.w.name) || '').trim(); if(n) colors[n]=getCol(n).accent; });
      return { order:getRoomOrder(st.sl), colors:colors };
    },
    openRaffle:openRaffle,
    closeRaffle:closeRaffle,
    openBedCare:openBedCare,
    closeBedCare:closeBedCare,
    resetRaffle:resetRaffle,
    rafflePerson:selectRafflePerson,
    rafflePart:selectRafflePart,
    applyRaffle:applyRaffle,
    ss:function(v){if(!st)return;st.sh=parseFloat(v);st.sl=calc(st.sl.map(function(s){return s.w;}),st.sh,st.ei);saveCurrentDayState();render();},
    se:function(v){if(!st)return;st.ei=parseInt(v); st.sl=calc(st.sl.map(function(s){return s.w;}),st.sh,st.ei); saveCurrentDayState(); render();},
    eq:function(){
      if(!st)return;
      st.sl=calc(st.sl.map(function(s){return s.w;}),st.sh,st.ei);
      saveCurrentDayState();
      render();
    },
    re:function(){
      if(!st)return;
      var sorted=fat(st.sl.map(function(s){return s.w;}));
      st.sl=calc(sorted,st.sh,st.ei);
      saveCurrentDayState();
      render();
    },
    ba:function(){
      if(!st)return;
      var balanced=balancedOrder(st.sl.map(function(s){return s.w;}));
      st.sl=calc(balanced,st.sh,st.ei);
      saveCurrentDayState();
      render();
    },
    byFat:function(){
      if(!st)return;
      _nsSortMode='fatigue';
      st.sl=calc(fat(st.sl.map(function(s){return s.w;})),st.sh,st.ei);
      saveCurrentDayState();
      render();
    },
    byFreq:function(){
      if(!st)return;
      _nsSortMode='freq';
      // Frequency needs the history stats — fetch (cached) then re-sort.
      nsStatsFetch().then(function(){
        if(!st)return;
        st.sl=calc(freqOrder(st.sl.map(function(s){return s.w;})),st.sh,st.ei);
        saveCurrentDayState();
        render();
      });
    }
  };
})();
