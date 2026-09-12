/* Watch-inspired card faces. Existing live DOM is retained; only the editor drags.
   No animation loop, WebGL, image segmentation, or background network requests. */
(function () {
  'use strict';
  var M = window.MinkaCardFaceModel;
  var labels = { hours: 'Maiņas stundas', name: 'Vārds', initials: 'Iniciāļi', month: 'Stundas mēnesī', coffee: 'Kafija', fatigue: 'Nogurums', remaining: 'Maiņas laiks', emoji: 'Emoji', clock: 'Pulkstenis' };
  var selectors = { hours: '.mk-mid-hours', name: '.mk-mid-name-wrap', initials: '.mk-mid-initials', month: '.mk-mid-month', coffee: '.mk-mid-coffee', fatigue: '.mk-mid-meta-fat', remaining: '.mk-mid-meta-time', emoji: '.mk-mid-meta-emoji', clock: '.mk-wf-clock' };
  var titles = ['Klasika', 'Foto stikls', 'Orbīta', 'Moduļi'];
  var metals = [
    ['Sudrabs','#d7d9de'],['Dabiskais titāns','#b7afa0'],['Melnais titāns','#484a50'],['Rozā zelts','#d9b3a7'],
    ['Zelts','#c7ac7c'],['Slānekļa titāns','#71747a'],['Tuksneša titāns','#c4a98d'],['Baltais titāns','#e7e5de'],
    ['Zilais titāns','#74869e'],['Pusnakts','#303b4a'],['Zvaigžņu gaisma','#e2d8c2'],['Kosmosa pelēks','#858589']
  ];
  var colors = [
    ['Ledus','#d5e6ef'],['Rozā','#f4cec7'],['Ceriņi','#c8b5eb'],['Ultramarīns','#718aff'],['Debeszils','#a5cbea'],
    ['Tirkīzs','#73e2de'],['Salvija','#bacb98'],['Laima','#c8e69f'],['Dzintars','#f0c180'],['Oranžs','#ef9260'],
    ['Koraļļu','#ee9aa0'],['Sarkans','#e67579'],['Balts','#f1f0ec'],['Grafīts','#9da4af'],
    ['Kosmiski oranžs','#e98b50'],['Dziļi zils','#64799b'],['Miglas zils','#cadbea'],['Lavanda','#c9c2df'],['Salvijas zaļš','#c2cab4'],['Mākoņu balts','#eeeae4'],['Gaišs zelts','#e5d8bb'],['Nakts melns','#62666d']
  ];
  var clockTimer = 0;
  var previewObserver = null;
  var previewFrame = 0;
  var refreshPreview = function() {};
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function paintClock() {
    clearTimeout(clockTimer); clockTimer = 0;
    if (document.hidden) return;
    var nodes = document.querySelectorAll('.mk-watch-face .mk-wf-clock:not([hidden])');
    if (!nodes.length) return;
    var time = new Intl.DateTimeFormat('lv-LV', { timeZone: 'Europe/Riga', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    nodes.forEach(function (el) { if (el.textContent !== time) el.textContent = time; });
    clockTimer = setTimeout(paintClock, 60000 - Date.now() % 60000 + 25);
  }
  document.addEventListener('visibilitychange', paintClock);
  function orbitArt() {
    var lines = '';
    for (var i = 0; i < 12; i++) lines += '<ellipse cx="100" cy="100" rx="76" ry="36" transform="rotate(' + (i*15) + ' 100 100)"/>';
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".45" opacity=".28">' + lines + '</g><circle cx="100" cy="100" r="87" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="78 55 70 60 75 209" transform="rotate(-135 100 100)"/></svg>';
  }
  function apply(card, skin) {
    if (!card || !card.matches('.mk-mid-card, .mk-skin-preview-real')) return;
    card.classList.add('mk-face-classic');
    var number = card.querySelector('.mk-mid-hours');
    if (number) { number.style.removeProperty('color'); number.style.removeProperty('-webkit-text-fill-color'); }
    var config = skin && skin.face ? M.clean(skin.face) : null;
    card.classList.toggle('mk-watch-face', !!config);
    if (!config) {
      delete card.dataset.watchFace; delete card.dataset.watchFinish;
      card.querySelectorAll('[data-wf-part]').forEach(function(el) {
        delete el.dataset.wfPart; el.hidden = false;
        ['--wf-x','--wf-y','--wf-scale'].forEach(function(p) { el.style.removeProperty(p); });
      });
      card.querySelectorAll('.mk-wf-art,.mk-wf-clock,.mk-wf-effects,.mk-wf-depth,.mk-wf-background').forEach(function(el) { el.remove(); });
      var originalEmoji=card.querySelector('.mk-mid-bg-emoji');if(originalEmoji)originalEmoji.hidden=false;
      ['--wf-tint','--wf-metal','--wf-bg-x','--wf-bg-y','--wf-bg-zoom','--wf-name-chars','--wf-surname-chars','--wf-number-alpha'].forEach(function(p) { card.style.removeProperty(p); });
      paintClock(); return;
    }
    card.dataset.watchFace = config.face;
    // Keep legacy effect settings saved, but never run them on a custom face.
    card.classList.remove('mk-has-spark','mk-fx-hearts','mk-fx-mirdz','mk-fx-burb','mk-fx-ziedi','mk-fx-taur','mk-depth-live');
    if(skin.t==='hue'&&/^\d{1,3}(,\d{1,3}){2}$/.test(String(skin.rgb||'')))card.style.setProperty('--mk-skin-img','linear-gradient(rgb('+skin.rgb+'),rgb('+skin.rgb+'))');
    var surface=card.querySelector('.mk-wf-background');
    if(!surface){surface=document.createElement('div');surface.className='mk-wf-background';surface.setAttribute('aria-hidden','true');surface.append(document.createElement('i'));card.prepend(surface);}
    surface.firstElementChild.style.backgroundImage='var(--mk-skin-img)';
    card.style.setProperty('--wf-zoom-ratio',config.imageZoom/100);
    var material=skin.t==='img'&&window.MinkaFindCardMaterial(skin.id);
    var depth=card.querySelector('.mk-wf-depth');
    if(material&&skin.depth!==false){
      if(!depth){depth=document.createElement('div');depth.className='mk-wf-depth';depth.setAttribute('aria-hidden','true');card.append(depth);}
      if(!depth.firstElementChild)depth.append(document.createElement('i'));
      depth.style.backgroundImage='none';
      depth.firstElementChild.style.backgroundImage='url("'+new URL((material.foreground||material.path)+'?v=20260912photos1',document.baseURI).href+'")';
    }else if(depth)depth.remove();
    var backgroundEmoji=card.querySelector('.mk-mid-bg-emoji');if(backgroundEmoji)backgroundEmoji.hidden=!!material||!config.parts.emoji[3];
    card.dataset.watchFinish = String(config.finish);
    card.style.setProperty('--wf-number-alpha',Math.max(.15,Math.min(1,Number(skin.numA == null ? 1 : skin.numA)||0)));
    var effects=card.querySelector('.mk-wf-effects');
    var glyph={spark:'✦',hearts:'♡',mirdz:'✧',burb:'○',ziedi:'✿',taur:'ʚɞ'}[skin.fx];
    if(glyph){
      if(!effects){effects=document.createElement('div');effects.className='mk-wf-effects';effects.setAttribute('aria-hidden','true');card.append(effects);}
      if(effects.dataset.effect!==skin.fx){effects.innerHTML=[[8,12],[82,8],[94,52],[6,75],[75,92]].map(function(p){return '<span style="left:'+p[0]+'%;top:'+p[1]+'%">'+glyph+'</span>';}).join('');effects.dataset.effect=skin.fx;}
    }else if(effects)effects.remove();
    card.style.setProperty('--wf-tint', '#'+config.tint);
    card.style.setProperty('--wf-metal', metals[config.metal][1]);
    card.style.setProperty('--wf-bg-x', config.imageX+'%');
    card.style.setProperty('--wf-bg-y', config.imageY+'%');
    card.style.setProperty('--wf-bg-zoom', config.imageZoom+'%');
    var nameMain = card.querySelector('.name-main'), nameSub = card.querySelector('.name-sub');
    card.style.setProperty('--wf-name-chars', Math.max(1, (nameMain && nameMain.textContent || '').trim().length));
    card.style.setProperty('--wf-surname-chars', Math.max(1, (nameSub && nameSub.textContent || '').trim().length));
    var art = card.querySelector('.mk-wf-art');
    if (!art) { art = document.createElement('div'); art.className = 'mk-wf-art'; art.setAttribute('aria-hidden','true'); card.prepend(art); }
    if (art.dataset.face !== config.face) { art.innerHTML = config.face === 'orbit' ? orbitArt() : ''; art.dataset.face = config.face; }
    if (!card.querySelector('.mk-wf-clock')) { var clock = document.createElement('span'); clock.className = 'mk-wf-clock'; clock.setAttribute('aria-label','Laiks Rīgā'); card.append(clock); }
    M.parts.forEach(function(key) {
      var el = card.querySelector(selectors[key]);
      if (!el) return;
      var p = config.parts[key];
      el.dataset.wfPart = key; el.hidden = !p[3];
      el.style.setProperty('--wf-x', p[0]+'%'); el.style.setProperty('--wf-y', p[1]+'%'); el.style.setProperty('--wf-scale', p[2]/100);
    });
    paintClock();
  }
  function mount(host, options) {
    if (previewObserver) { previewObserver.disconnect(); previewObserver = null; }
    cancelAnimationFrame(previewFrame); previewFrame=0;
    var tabs = host.querySelector('.mk-skin-main-tabs'), editor = host.querySelector('.mk-skin-editor');
    var preview = host.querySelector('.mk-skin-preview-real');
    if (!tabs || !editor || !preview) return;
    var slot = preview.closest('.mk-skin-preview-slot');
    var sourceWorker = options.source && options.source.getAttribute('data-worker');
    var sourceSize = null;
    function sizePreview() {
      if (!preview.isConnected || !options.source || !slot.clientWidth) return;
      if (preview.querySelector(':scope > .mk-card-addon.is-dragging')) return;
      // The roster can replace its cards while this editor remains open.
      // Reconnect to the live card; retain its last geometry while it is hidden.
      if (!options.source.isConnected && sourceWorker) {
        var replacement = Array.prototype.find.call(document.querySelectorAll('.card[data-worker]'), function(card) {
          return card.getAttribute('data-worker') === sourceWorker;
        });
        if (replacement) {
          if (previewObserver) previewObserver.unobserve(options.source);
          options.source = replacement;
          if (previewObserver) previewObserver.observe(replacement);
        }
      }
      var measured = options.source.getBoundingClientRect();
      if (measured.width && measured.height) {
        sourceSize = {width: measured.width, height: measured.height, padding: getComputedStyle(options.source).padding};
      }
      if (!sourceSize) return;
      var r = sourceSize;
      var addon=preview.querySelector(':scope > .mk-card-addon'), before=preview.getBoundingClientRect();
      var a=addon&&addon.getBoundingClientRect(), left=0,right=0,top=0,bottom=0;
      if(a&&before.width&&before.height){
        left=Math.max(0,before.left-a.left)/before.width;right=Math.max(0,a.right-before.right)/before.width;
        top=Math.max(0,before.top-a.top)/before.height;bottom=Math.max(0,a.bottom-before.bottom)/before.height;
      }
      var available=slot.parentElement.clientWidth;
      slot.style.width=Math.floor(Math.min(300,(available-12)/(1+left+right)))+'px';
      host.style.setProperty('--wf-card-aspect',r.width+'/'+r.height);
      var scale = slot.clientWidth / r.width;
      slot.style.marginLeft=Math.max(0,(available-slot.clientWidth*(1+left+right))/2+slot.clientWidth*left)+'px';
      slot.style.marginRight='0';
      slot.style.setProperty('--mk-addon-preview-top-clearance',Math.ceil(r.height*scale*top+(top?12:0))+'px');
      slot.style.setProperty('--mk-addon-preview-bottom-clearance',Math.ceil(r.height*scale*bottom+(bottom?12:0))+'px');
      preview.classList.add('wf-scaled-preview');
      preview.style.setProperty('--wf-preview-width', r.width + 'px');
      preview.style.setProperty('--wf-preview-height', r.height + 'px');
      preview.style.setProperty('--wf-preview-scale', scale);
      preview.style.setProperty('--wf-preview-padding', r.padding);
      slot.style.height = (r.height * scale) + 'px';
      slot.style.aspectRatio = 'auto';
    }
    if (options.source && window.ResizeObserver) {
      previewObserver = new ResizeObserver(function(){
        if(!previewFrame)previewFrame=requestAnimationFrame(function(){previewFrame=0;sizePreview();});
      });
      previewObserver.observe(options.source); previewObserver.observe(slot);
      previewObserver.observe(slot.parentElement);
      sizePreview();
    }
    refreshPreview=sizePreview;
    var tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'mk-skin-main-tab'; tab.dataset.skinSection = 'face'; tab.setAttribute('role','tab'); tab.textContent = 'Stils';
    tabs.prepend(tab);
    var panel = document.createElement('section');
    panel.className = 'mk-skin-section wf-editor'; panel.dataset.skinPanel = 'face';
    var selectedPart = 'hours';
    var config = M.clean(options.get().face);
    var history = [];
    var faceTiles = M.faces.map(function(face,i) {
      return '<button type="button" class="wf-face-choice" data-face="'+face+'"><span class="wf-face-thumb wf-thumb-'+face+'"><i></i><b>24</b><small>DEŽŪRA</small></span><strong>'+titles[i]+'</strong></button>';
    }).join('');
    panel.innerHTML = '<div class="wf-editor-heading"><div><strong>Kartītes izskats</strong><p>Pielāgo kartīti savai dežūrai.</p></div></div>'
      + '<div class="wf-faces">'+faceTiles+'</div>'
      + '<div class="wf-section"><div class="wf-label">Stikla tonis <input type="color" class="wf-color" aria-label="Stikla tonis"></div><div class="wf-swatches">'+colors.map(function(c){return '<button type="button" data-tint="'+c[1].slice(1)+'" style="--sw:'+c[1]+'" title="'+c[0]+'" aria-label="'+c[0]+'"></button>';}).join('')+'</div>'
      + '<div class="wf-segment" aria-label="Ciparu materiāls">'+['Stikls','Metāls','Tīrs'].map(function(t,i){return '<button type="button" data-finish="'+i+'">'+t+'</button>';}).join('')+'</div></div>'
      + '<div class="wf-section"><div class="wf-label">Metāla ietvars <span class="wf-metal-name"></span></div><div class="wf-metals">'+metals.map(function(c,i){return '<button type="button" data-metal="'+i+'" style="--sw:'+c[1]+'" title="'+c[0]+'" aria-label="'+c[0]+'"></button>';}).join('')+'</div></div>'
      + '<div class="wf-section"><div class="wf-label">Elementi <span>Velc priekšskatījumā</span></div><div class="wf-elements">'+M.parts.map(function(key){return '<button type="button" data-part="'+key+'">'+labels[key]+'</button>';}).join('')+'</div>'
      + '<div class="wf-part-head"><strong class="wf-part-name"></strong><button type="button" class="wf-remove">Noņemt</button></div>'
      + [['x','Horizontāli',5,95],['y','Vertikāli',5,95],['size','Izmērs',50,170]].map(function(r){return '<label class="wf-range"><span>'+r[1]+'</span><input type="range" data-position="'+r[0]+'" min="'+r[2]+'" max="'+r[3]+'"><output></output></label>';}).join('')
      + '<div class="wf-editor-help">Izvēlies elementu un velc to priekšskatījumā. Ar bultiņām pārvieto precīzi. Noņemtos elementus pievieno atpakaļ ar +.</div></div>'
      + '<label class="wf-depth-control"><input type="checkbox" class="wf-depth-toggle"> Objekts priekšā ciparam</label>'
      + '<details class="wf-background"><summary>Attēla novietojums</summary>'+[['imageX','Horizontāli',0,100],['imageY','Vertikāli',0,100],['imageZoom','Tuvinājums',100,180]].map(function(r){return '<label class="wf-range"><span>'+r[1]+'</span><input type="range" data-image="'+r[0]+'" min="'+r[2]+'" max="'+r[3]+'"><output></output></label>';}).join('')+'<p>Attēlu vai krāsainu fonu izvēlies sadaļā “Fons”.</p></details>'
      + '<div class="wf-footer"><button type="button" class="wf-undo" disabled>Atcelt pēdējo</button><button type="button" class="wf-reset">Atjaunot izkārtojumu</button><button type="button" class="wf-original">Sākotnējā klasika</button></div>';
    tabs.after(panel);
    function activate() {
      config=M.clean(options.get().face);
      options.section('face');
      host.querySelectorAll('.mk-skin-main-tab').forEach(function(el){var on=el===tab;el.classList.toggle('is-active',on);el.setAttribute('aria-selected',String(on));});
      host.querySelectorAll('[data-skin-panel]').forEach(function(el){el.classList.toggle('is-active',el===panel);});
      preview.classList.toggle('wf-editing',!!options.get().face);
      // Opening the tab must still show the person's actual saved appearance.
      apply(preview, options.get());
      sync();
    }
    function sync() {
      panel.querySelectorAll('[data-face]').forEach(function(el){
        el.setAttribute('aria-pressed',String(!!options.get().face&&el.dataset.face===config.face));
        var look=M.preset(el.dataset.face,options.get().face?config:null);
        el.style.setProperty('--wf-thumb-tint','#'+look.tint);
        el.style.setProperty('--wf-thumb-metal',metals[look.metal][1]);
        el.querySelector('b').textContent=(preview.querySelector('.mk-mid-hours')||{}).textContent||'24';
      });
      var depthThumb=preview.querySelector('.mk-wf-depth');
      panel.style.setProperty('--wf-depth-thumbnail',depthThumb?depthThumb.firstElementChild.style.backgroundImage:'none');
      panel.style.setProperty('--wf-thumbnail-image',preview.style.getPropertyValue('--mk-skin-img')||'linear-gradient(150deg,#323b53,#0c121c)');
      panel.querySelectorAll('[data-tint]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.tint===config.tint));});
      panel.querySelectorAll('[data-metal]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.metal===config.metal));});
      panel.querySelectorAll('[data-finish]').forEach(function(el){el.setAttribute('aria-pressed',String(+el.dataset.finish===config.finish));});
      panel.querySelectorAll('[data-part]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.part===selectedPart));el.classList.toggle('is-off',!config.parts[el.dataset.part][3]);});
      var hasDepth=options.get().t==='img'&&!!window.MinkaFindCardMaterial(options.get().id);
      panel.querySelector('.wf-depth-control').hidden=!hasDepth;
      panel.querySelector('.wf-depth-toggle').checked=options.get().depth!==false;
      panel.querySelector('.wf-color').value='#'+config.tint;
      panel.querySelector('.wf-metal-name').textContent=metals[config.metal][0];
      panel.querySelector('.wf-part-name').textContent=labels[selectedPart];
      panel.querySelector('.wf-remove').textContent=config.parts[selectedPart][3]?'Noņemt':'Pievienot';
      panel.querySelector('.wf-undo').disabled=!history.length;
      panel.querySelectorAll('[data-position]').forEach(function(el){var i={x:0,y:1,size:2}[el.dataset.position];el.value=config.parts[selectedPart][i];el.nextElementSibling.textContent=el.value+'%';});
      panel.querySelectorAll('[data-image]').forEach(function(el){el.value=config[el.dataset.image];el.nextElementSibling.textContent=el.value+'%';});
      preview.querySelectorAll('[data-wf-part]').forEach(function(el){el.classList.toggle('wf-selected',el.dataset.wfPart===selectedPart);el.tabIndex=0;el.setAttribute('aria-label',labels[el.dataset.wfPart]);});
      preview.closest('.mk-skin-preview-list').setAttribute('aria-hidden','false');
    }
    // Keep the whole element inside the face, including its scaled bounds.
    // Read geometry only while editing; roster rendering never measures parts.
    function constrainSelected() {
      apply(preview,Object.assign({},options.get(),{face:config}));
      var el=preview.querySelector('[data-wf-part="'+selectedPart+'"]');
      if(!el||el.hidden)return;
      var r=preview.getBoundingClientRect(), b=el.getBoundingClientRect(), p=config.parts[selectedPart];
      if(!r.width||!r.height||!b.width||!b.height)return;
      var fit=Math.min(1,r.width*.88/b.width,r.height*.84/b.height);
      if(fit<1){p[2]=Math.max(50,Math.floor(p[2]*fit));apply(preview,Object.assign({},options.get(),{face:config}));b=el.getBoundingClientRect();}
      var dx=b.left<r.left+r.width*.06?r.left+r.width*.06-b.left:Math.min(0,r.right-r.width*.06-b.right);
      var dy=b.top<r.top+r.height*.08?r.top+r.height*.08-b.top:Math.min(0,r.bottom-r.height*.08-b.bottom);
      p[0]+=dx/r.width*100;p[1]+=dy/r.height*100;
      config=M.clean(config);
    }
    function save(constrain) {
      history.push(options.get().face ? M.clean(options.get().face) : null);
      if(history.length>20)history.shift();
      preview.classList.add('wf-editing');config=M.clean(config);if(constrain)constrainSelected();options.change(M.clean(config));sync();sizePreview();
    }
    tab.addEventListener('click',activate);
    tabs.addEventListener('click',function(e){if(e.target.closest('[data-skin-section]')!==tab){preview.classList.remove('wf-editing');apply(preview,options.get());}});
    panel.addEventListener('click',function(e){
      var el=e.target.closest('button');if(!el)return;
      if(el.dataset.face){var previous=options.get().face;config=M.preset(el.dataset.face,previous?config:null);if(previous)M.parts.forEach(function(key){config.parts[key][3]=previous.parts[key][3];});save(true);}
      if(el.dataset.tint){config.tint=el.dataset.tint;save();}
      if(el.dataset.metal!=null){config.metal=+el.dataset.metal;save();}
      if(el.dataset.finish!=null){config.finish=+el.dataset.finish;save();}
      if(el.dataset.part){selectedPart=el.dataset.part;if(!config.parts[selectedPart][3]||!options.get().face){config.parts[selectedPart][3]=1;save();}else sync();}
      if(el.classList.contains('wf-remove')){config.parts[selectedPart][3]=config.parts[selectedPart][3]?0:1;save();}
      if(el.classList.contains('wf-undo')&&history.length){var previous=history.pop();config=M.clean(previous);options.change(previous);preview.classList.toggle('wf-editing',!!previous);apply(preview,options.get());sync();sizePreview();}
      if(el.classList.contains('wf-reset')){config=M.preset(config.face,config);save(true);}
      if(el.classList.contains('wf-original')){options.change(null);options.section('background');options.rebuild();}
    });
    panel.querySelector('.wf-depth-toggle').addEventListener('change',function(e){options.depth(e.target.checked);sync();});
    panel.addEventListener('input',function(e){
      var el=e.target;
      if(el.classList.contains('wf-color'))config.tint=el.value.slice(1);
      else if(el.dataset.position)config.parts[selectedPart][{x:0,y:1,size:2}[el.dataset.position]]=+el.value;
      else if(el.dataset.image)config[el.dataset.image]=+el.value;
      else return;
      save(!!el.dataset.position);
    });
    // Pointer capture stays on the unchanged preview. All coordinates are relative
    // to its real dimensions; persisted values never depend on device pixels.
    var drag=null;
    preview.addEventListener('pointerdown',function(e){
      if(!preview.classList.contains('wf-editing')||e.button!==0)return;
      var el=e.target.closest('[data-wf-part]');if(!el)return;
      e.preventDefault();e.stopPropagation();selectedPart=el.dataset.wfPart;sync();
      var r=preview.getBoundingClientRect();
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:config.parts[selectedPart][0],py:config.parts[selectedPart][1],r:r};
      preview.setPointerCapture(e.pointerId);
    });
    preview.addEventListener('pointermove',function(e){
      if(!drag||e.pointerId!==drag.id)return;
      config.parts[selectedPart][0]=Math.max(5,Math.min(95,Math.round(drag.px+(e.clientX-drag.x)/drag.r.width*100)));
      config.parts[selectedPart][1]=Math.max(5,Math.min(95,Math.round(drag.py+(e.clientY-drag.y)/drag.r.height*100)));
      constrainSelected();apply(preview,Object.assign({},options.get(),{face:config}));sync();
    });
    function endDrag(e){if(!drag||e.pointerId!==drag.id)return;drag=null;save(true);}
    preview.addEventListener('pointerup',endDrag);preview.addEventListener('pointercancel',endDrag);preview.addEventListener('lostpointercapture',endDrag);
    preview.addEventListener('click',function(e){if(preview.classList.contains('wf-editing')){e.preventDefault();e.stopPropagation();}},true);
    preview.addEventListener('keydown',function(e){
      if(!preview.classList.contains('wf-editing')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      var el=e.target.closest('[data-wf-part]');if(!el)return;
      e.preventDefault();e.stopPropagation();selectedPart=el.dataset.wfPart;
      var i=/Left|Right/.test(e.key)?0:1,delta=/Left|Up/.test(e.key)?-1:1;
      config.parts[selectedPart][i]+=delta*(e.shiftKey?5:1);save(true);
    });
    if(options.active()==='face')activate();
  }
  window.MinkaCardFaces = { apply: apply, mount: mount, refreshPreview: function(){refreshPreview();} };
})();
