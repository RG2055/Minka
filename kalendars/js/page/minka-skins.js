/* ── MinkaSkins: per-darbinieka kartes izskats ──
   Fons (attēls/gradients/krāsa) + cipara/teksta krāsas + emoji kontrole + spīdumiņi.
   Viss statisks CSS (bez animācijām), localStorage kešs, sinhronizācija caur /api/skins. */
(function MinkaSkins() {
  var KEY = 'mkWorkerSkinsV1';
  var cloudTimers = Object.create(null);
  var cloudRevision = 0;
  var cloudWrites = 0;
  var activeImageGroup = 0;
  var activeSkinSection = 'background';
  var activePresetGroup = 'new';
  var autoPaletteEnabled = true;
  var paletteRevision = 0;
  function skinEsc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var IMG_GROUPS = [
    { label: 'Abstrakti',          ids: ['abstract-color-wave','abstract-blue-liquid','abstract-pastel-orbit','abstract-sun-glow','abstract-neon-folds','abstract-white-flow','abstract-copper-web','abstract-paper-geometry','pix-color-waves'] },
    { label: 'Aesthetic',           ids: ['user-holo-jellyfish','user-glitter-rainbow','user-pixel-clouds','user-golden-water','user-rainbow-beach','user-silver-ocean','user-glitch-dinosaurs','gnome-glass-chip-d','gnome-lcd-rainbow-d','gnome-pixels-d','gnome-tarka-d','open-aesthetic','aesthetic-bird','aesthetic-cyborg','aesthetic-face','aesthetic-flash','aesthetic-helmet','aesthetic-sunset','aesthetic-water','user-bubble'] },
    { label: 'Rozā un maigi',      ids: ['user-pink-cosmos','user-pink-liquid','user-pink-water','gnome-blobs-l','gnome-pills-d','open-pink','360','25','888','867','56','788','866','923','301','705','279','213','787','77','544','pix-water-drops','pix-pastel-flow'] },
    { label: 'Mīļi un jauki',      ids: ['gnome-balls-l','open-cute','146','798','219','790','248','user-butterfly'] },
    { label: 'Spilgti',            ids: ['gnome-blendpills-d','gnome-drool-d','gnome-progress-d','open-bright','1080','1069','211','76'] },
    { label: 'Ūdens, sniegs un zili', ids: ['gnome-adwaita-d','gnome-sheet-d','gnome-symbolic-d','open-blue','1015','1036','1035','13','15','16','37','199'] },
    { label: 'Zaļā daba',          ids: ['open-green','1018','1039','1043','10','11','17','18','28','128','190','user-daisy','user-bamboo-forest'] },
    { label: 'Silti un saulaini',  ids: ['gnome-amber-d','gnome-fold-l','gnome-pixel-pusher-d','gnome-glass-stripes-l','open-warm','1016','1057','110','19','46','164','user-autumn-leaves'] },
    { label: 'Tumši un mistiski',  ids: ['gnome-morphogenesis-d','gnome-tubes-d','open-dark','1019','1022','12','29','55','83','95','184','pix-aurora-sky'] },
    { label: 'Pilsēta un arhitektūra', ids: ['gnome-curvaturingster-d','gnome-map-d','1029','1033'] },
    { label: 'Melnbalti',          ids: ['gnome-curvy-d','open-bw','47','58'] },
    { label: 'Barbie rozā',        ids: ['gnome-dithered-sun-l','open-barbie','bb2','bb3','bb4','bd1','bd2','bd3'] },
    { label: 'Kaķi',               ids: ['user-neon-alley-cat','open-cat','cat-01','cat-02','cat-03','cat-04','cat-05','cat-06','cat-07','cat-08','cat-09','cat-10','cat-11','cat-12','cat-13','cat-14','user-black-cat'] }
  ];
  var IMG_LABELS = {
    'abstract-color-wave': 'Krāsu viļņi', 'abstract-blue-liquid': 'Zilā plūsma',
    'abstract-pastel-orbit': 'Pasteļu orbīta', 'abstract-sun-glow': 'Saules mirdzums',
    'abstract-neon-folds': 'Neona locījumi', 'abstract-white-flow': 'Baltā plūsma',
    'abstract-copper-web': 'Vara pinums', 'abstract-paper-geometry': 'Papīra ģeometrija',
    'user-autumn-leaves': 'Rudens lapas', 'user-butterfly': 'Gaišais tauriņš',
    'user-daisy': 'Margrietiņa', 'user-bubble': 'Saules burbulis',
    'user-bamboo-forest': 'Bambusu mežs',
    'user-black-cat': 'Melnais kaķis',
    'user-neon-alley-cat': 'Neona melnais kaķis',
    'user-holo-jellyfish': 'Holo medūzas',
    'user-glitter-rainbow': 'Glitera varavīksne',
    'user-pixel-clouds': 'Pikseļu debesis',
    'user-golden-water': 'Zelta ūdens',
    'user-pink-cosmos': 'Rozā kosmejas',
    'user-pink-liquid': 'Rozā šķidrums',
    'user-rainbow-beach': 'Varavīksnes pludmale',
    'user-pink-water': 'Rozā ūdens',
    'user-silver-ocean': 'Sudraba okeāns',
    'user-glitch-dinosaurs': 'Glitch dinozauri',
    'pix-color-waves': 'Krāsu marmors', 'pix-water-drops': 'Neona lāses',
    'pix-pastel-flow': 'Violetā planēta', 'pix-aurora-sky': 'Ziemeļblāzmas debesis',
    '1015': 'Zilais fjords', '1016': 'Saulainais kanjons', '1018': 'Miglas kalni',
    '1019': 'Vētras krasts', '1022': 'Ziemeļblāzma', '1029': 'Pilsētas parks',
    '1033': 'Modernā arhitektūra', '1036': 'Sniega kalni',
    '1039': 'Meža ūdenskritums', '1043': 'Kalnu ezers',
    '1035': 'Varavīksnes ūdenskritums', '13': 'Meža avots',
    '15': 'Tirkīza līcis', '16': 'Ledus lagūna', '37': 'Ziemeļu jūra',
    '199': 'Pilsētas krasts',
    'open-aesthetic': 'Pasteļu ģeometrija', 'open-pink': 'Rozā ziedi',
    // Līdz šim bez nosaukumiem — režģī visas septiņas rādīja grupas vārdu "Aesthetic".
    'aesthetic-bird': 'Putna lidojums', 'aesthetic-cyborg': 'Hroma kiborgs',
    'aesthetic-face': 'Marmora seja', 'aesthetic-flash': 'Retro plakāts',
    'aesthetic-helmet': 'Tuksneša ķivere', 'aesthetic-sunset': 'Oranžais saulriets',
    'aesthetic-water': 'Ūdens atspīdums',
    'open-cute': 'Mazie pīlēni', 'open-bright': 'Krāsains gleznojums',
    'open-blue': 'Zilā pludmale', 'open-green': 'Palmu mežs',
    'open-warm': 'Zelta kanjons', 'open-dark': 'Miglas mežs',
    'open-bw': 'Melnbaltā pilsēta',
    'open-barbie': 'Rozā spīdumi', 'open-cat': 'Saulainais kaķis',
    'bb2': 'Rozā sirsniņas', 'bb3': 'Rozā punktiņi', 'bb4': 'Rozā zīds',
    'bd1': 'Rozā palmas', 'bd2': 'Rozā tilts', 'bd3': 'Rozā kāpas',
    'gnome-glass-chip': 'Šķidrais stikls', 'gnome-pills': 'Rozā kapsulas',
    'gnome-balls': 'Krāsu lodītes', 'gnome-blendpills': 'Krāsu lentes',
    'gnome-adwaita': 'Zilais dziļums', 'gnome-tarka': 'Maigās formas',
    'gnome-fold': 'Siltais zīds', 'gnome-tubes': 'Nakts caurules',
    'gnome-curvaturingster': 'Telpiskā arhitektūra', 'gnome-curvy': 'Baltais reljefs',
    'gnome-dithered-sun': 'Pasteļu saule',
    'gnome-adwaita-d': 'Zilais dziļums', 'gnome-adwaita-l': 'Zilais dziļums — gaišs',
    'gnome-amber-d': 'Dzintara plūsma', 'gnome-amber-l': 'Dzintara plūsma — gaiša',
    'gnome-balls-d': 'Krāsu lodītes — tumšas', 'gnome-balls-l': 'Krāsu lodītes',
    'gnome-blendpills-d': 'Krāsu lentes', 'gnome-blendpills-l': 'Krāsu lentes — gaišas',
    'gnome-blobs-d': 'Plūstošās salas — tumšas', 'gnome-blobs-l': 'Plūstošās salas — gaišas',
    'gnome-curvaturingster-d': 'Telpiskā arhitektūra', 'gnome-curvaturingster-l': 'Telpiskā arhitektūra — gaiša',
    'gnome-curvy-d': 'Reljefa līnijas', 'gnome-curvy-l': 'Reljefa līnijas — gaišas',
    'gnome-dithered-sun-d': 'Pasteļu saule — tumša', 'gnome-dithered-sun-l': 'Pasteļu saule',
    'gnome-drool-d': 'Krāsu pilieni', 'gnome-drool-l': 'Krāsu pilieni — zili',
    'gnome-fold-d': 'Zīda locījumi — tumši', 'gnome-fold-l': 'Zīda locījumi',
    'gnome-glass-chip-d': 'Šķidrais stikls', 'gnome-glass-chip-l': 'Šķidrais stikls — gaišs',
    'gnome-glass-stripes-d': 'Stikla svītras — tumšas', 'gnome-glass-stripes-l': 'Stikla svītras',
    'gnome-lcd-rainbow-d': 'Pikseļu zīmes', 'gnome-lcd-rainbow-l': 'Pikseļu zīmes — gaišas',
    'gnome-map-d': 'Metro līnijas', 'gnome-map-l': 'Metro līnijas — gaišas',
    'gnome-morphogenesis-d': 'Smalka tekstūra', 'gnome-morphogenesis-l': 'Smalka tekstūra — gaiša',
    'gnome-pills-d': 'Rozā kapsulas', 'gnome-pills-l': 'Rozā kapsulas — gaišas',
    'gnome-pixel-pusher-d': 'Lavas plūsma', 'gnome-pixel-pusher-l': 'Lavas plūsma — gaiša',
    'gnome-pixels-d': 'Pikseļu ikonas', 'gnome-pixels-l': 'Pikseļu ikonas — gaišas',
    'gnome-progress-d': 'Krāsu ceļi', 'gnome-progress-l': 'Krāsu ceļi — gaiši',
    'gnome-sheet-d': 'Zilais zīds', 'gnome-sheet-l': 'Zilais zīds — gaišs',
    'gnome-symbolic-d': 'Smalkie punkti', 'gnome-symbolic-l': 'Smalkie punkti — gaiši',
    'gnome-tarka-d': 'Maigās formas', 'gnome-tarka-l': 'Maigās formas — gaišas',
    'gnome-tarkov-pills-d': 'Krāsu stienīši — tumši', 'gnome-tarkov-pills-l': 'Krāsu stienīši — gaiši',
    'gnome-tubes-d': 'Nakts caurules', 'gnome-tubes-l': 'Nakts caurules — gaišas',
    'gnome-vnc-d': 'Vienkrāsains — tumšs', 'gnome-vnc-l': 'Vienkrāsains — gaišs'
  };
  var MATERIALS = window.MinkaCardMaterials || [];
  IMG_GROUPS.unshift({label:'Foto kompozīcijas', ids:MATERIALS.filter(function(m){return m.kind==='depth';}).map(function(m){return m.id;})});
  MATERIALS.forEach(function(m){IMG_LABELS[m.id]=m.label;});
  /* Viena bilde drīkst būt tikai vienā kategorijā. Šis aizsargs neļauj
     nejaušam nākamajam papildinājumam izvēlnē radīt dublikātus. */
  (function dedupeImageGroups() {
    var seen = Object.create(null);
    IMG_GROUPS.forEach(function(group) {
      group.ids = group.ids.filter(function(id) {
        if (seen[id]) return false;
        seen[id] = true;
        return true;
      });
    });
  })();
  /* Ainavas ir tādi paši lokāli WebP attēli kā visi pārējie foni. */
  var SCENIC_SKINS = [
    { id: 'slani-zili', label: 'Zilie slāņi' },
    { id: 'persiku-kalni', label: 'Persiku kalni' },
    { id: 'miglas-ezers', label: 'Miglas ezers' },
    { id: 'lavandas-ieleja', label: 'Lavandas ieleja' },
    { id: 'piparmetru-laguna', label: 'Piparmētru lagūna' },
    { id: 'roza-kanjons', label: 'Rozā kanjons' },
    { id: 'arktikas-gaisma', label: 'Arktikas gaisma' },
    { id: 'zelta-plava', label: 'Zelta pļava' },
    { id: 'korallu-krasts', label: 'Koraļļu krasts' },
    { id: 'nakts-aurora', label: 'Nakts aurora' },
    { id: 'meness-ezera', label: 'Mēness ezerā' },
    { id: 'ogu-debesis', label: 'Ogu debesis' },
    { id: 'opala-vilni', label: 'Opāla viļņi' },
    { id: 'meza-ausma', label: 'Meža ausma' },
    { id: 'smilsu-dunas', label: 'Smilšu kāpas' },
    { id: 'ledus-fjords', label: 'Ledus fjords' },
    { id: 'konfeksu-ieleja', label: 'Konfekšu ieleja' },
    { id: 'vara-saullekts', label: 'Vara saullēkts' },
    { id: 'lietus-pilseta', label: 'Lietus pilsēta' },
    { id: 'saules-koralli', label: 'Saules koraļļi' },
    { id: 'ziemelblazmas-kalni', label: 'Auroras kalni' },
    { id: 'zilgana-migla', label: 'Zilganā migla' },
    { id: 'kirsu-horizonts', label: 'Ķiršu horizonts' },
    { id: 'tirkiza-salas', label: 'Tirkīza salas' }
  ];
  var SCENIC_IDS = Object.create(null);
  SCENIC_SKINS.forEach(function(skin){ SCENIC_IDS[skin.id] = true; });
  var GRADS = [
    { id: 'roza',    label: 'Rozā sapnis',  css: 'linear-gradient(150deg,#ff9a9e 0%,#fad0c4 100%)' },
    { id: 'sakura',  label: 'Sakura',       css: 'linear-gradient(150deg,#fbc2eb 0%,#fed6e3 100%)' },
    { id: 'konfe',   label: 'Konfektes',    css: 'linear-gradient(150deg,#ffafcc 0%,#cdb4db 100%)' },
    { id: 'flami',   label: 'Flamingo',     css: 'linear-gradient(150deg,#f78ca0 0%,#fe9a8b 100%)' },
    { id: 'persiks', label: 'Persiks',      css: 'linear-gradient(150deg,#ffecd2 0%,#fcb69f 100%)' },
    { id: 'lavanda', label: 'Lavanda',      css: 'linear-gradient(150deg,#a18cd1 0%,#fbc2eb 100%)' },
    { id: 'debess',  label: 'Debesis',      css: 'linear-gradient(150deg,#89f7fe 0%,#66a6ff 100%)' },
    { id: 'menta',   label: 'Piparmētra',   css: 'linear-gradient(150deg,#d4fc79 0%,#96e6a1 100%)' },
    { id: 'naktsr',  label: 'Nakts roze',   css: 'linear-gradient(150deg,#5f0a87 0%,#f80759 100%)' },
    { id: 'zelts',   label: 'Zelta stunda', css: 'linear-gradient(150deg,#f6d365 0%,#fda085 100%)' }
  ];
  var GRAD_MAP = {};
  GRADS.forEach(function(g){ GRAD_MAP[g.id] = g.css; });
  var HUES = [
    { rgb: '100,210,255', hex: '#64d2ff' }, { rgb: '183,123,255', hex: '#b77bff' },
    { rgb: '255,175,204', hex: '#ffafcc' }, { rgb: '51,209,122',  hex: '#33d17a' },
    { rgb: '45,212,191',  hex: '#2dd4bf' }, { rgb: '255,179,64',  hex: '#ffb340' },
    { rgb: '255,107,95',  hex: '#ff6b5f' }, { rgb: '237,147,177', hex: '#ed93b1' }
  ];
  var PRESETS = [
    { label: 'Barbie',      bg: { t: 'img', id: 'bb1' },      num: '255,255,255', na: '0.95', txt: '255,230,244', fx: 'hearts', sw: 'url(data/skins/skin-bb1.webp)' },
    { label: 'Sakura',      bg: { t: 'grad', id: 'sakura' },  num: '214,51,132',  na: '0.90', txt: '124,45,86',   fx: 'spark', sw: GRAD_MAP.sakura },
    { label: 'Flamingo',    bg: { t: 'grad', id: 'flami' },   num: '255,255,255', na: '0.95', txt: '255,240,245', sw: GRAD_MAP.flami },
    { label: 'Lavanda',     bg: { t: 'grad', id: 'lavanda' }, num: '255,255,255', na: '0.95', txt: '243,232,255', fx: 'spark', sw: GRAD_MAP.lavanda },
    { label: 'Nakts roze',  bg: { t: 'grad', id: 'naktsr' },  num: '255,214,232', na: '0.95', txt: '255,228,240', fx: 'spark', sw: GRAD_MAP.naktsr },
    { label: 'Zemenes',     bg: { t: 'img', id: '1080' },     num: '255,228,235', na: '0.95', txt: '255,228,235', sw: 'url(data/skins/skin-1080.webp)' },
    { label: 'Ledus',       bg: { t: 'hue', rgb: '100,210,255' }, num: '220,245,255', na: '0.95', sw: '#64d2ff' },
    { label: 'Aurora',      bg: { t: 'hue', rgb: '183,123,255' }, num: '221,214,254', na: '0.95', sw: '#b77bff' },
    { label: 'Kalnu ezers', bg: { t: 'img', id: '1018' },     num: '125,211,252', na: '0.95', sw: 'url(data/skins/skin-1018.webp)' },
    { label: 'Zvaigznes',   bg: { t: 'img', id: '1043' },     num: '255,214,10',  na: '0.90', fx: 'spark', sw: 'url(data/skins/skin-1043.webp)' },
    { label: 'Mežs',        bg: { t: 'img', id: '28' },       num: '134,239,172', na: '0.95', sw: 'url(data/skins/skin-28.webp)' },
    { label: 'Krasts',      bg: { t: 'img', id: '110' },      num: '255,200,120', na: '0.95', sw: 'url(data/skins/skin-110.webp)' },
    { label: 'Zelta stunda',bg: { t: 'grad', id: 'zelts' },   num: '146,64,14',   na: '0.90', txt: '120,53,15',   sw: GRAD_MAP.zelts }
  ];

  PRESETS = MATERIALS.map(function(m){
    var face=window.MinkaCardFaceModel.preset(m.face);
    Object.assign(face,{tint:m.tint,metal:m.metal,finish:m.finish});
    if(m.hours)face.parts.hours=m.hours.slice();
    Object.keys(m.parts||{}).forEach(function(key){face.parts[key]=m.parts[key].slice();});
    face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    return {label:m.label,group:m.group||'landscape',isNew:!!m.isNew,bg:{t:'img',id:m.id},num:hexToRgb('#'+m.tint),na:'1',txt:'246,247,249',face:face,depth:m.depth,foreground:m.foreground||(m.kind==='depth'?m.path:null),sw:'url('+m.path+')'+(m.background?','+m.background:'')};
  }).concat(PRESETS.map(function(p,i){
    // Legacy bundles now also have a complete, editable arrangement.
    p.face=window.MinkaCardFaceModel.preset(['classic','photo','modular','photo','classic','photo','modular','classic','photo','orbit','photo','classic','modular'][i]);
    p.face.tint=rgbToHex(p.num).slice(1);
    p.face.parts.hours=[p.face.face==='photo'?62:50,p.face.face==='modular'?35:42, p.face.face==='photo'?80:p.face.face==='modular'?70:86,1];
    if(p.face.face==='classic'||p.face.face==='photo'){
      p.face.parts.name=[50,70,65,1];p.face.parts.coffee=[25,13,80,1];p.face.parts.emoji=[82,14,85,1];
      p.face.parts.month=[80,84,70,0];p.face.parts.fatigue=[21,84,70,0];p.face.parts.remaining=[50,91,70,1];
    }
    p.face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(p.face.parts,p.face.face);
    delete p.fx;
    p.group='collection';
    return p;
  }).filter(function(p){return p.bg.t==='img';}));
  [
    ['Koraļļu plūsma','ffb7c9',3,'30,13,28'],['Lagūnas plūsma','80eadf',3,'5,23,31'],
    ['Violetā pērle','c4afff',4,'20,15,33'],['Sudraba pērle','d0e8f4',4,'13,20,29'],
    ['Zilais neons','70cbff',5,'4,12,24'],['Laima neons','c6f17e',5,'12,20,12']
  ].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset('classic');
    face.tint=p[1];face.finish=p[2];face.parts.hours=[50,45,112,1];
    face.parts.name=[50,73,80,1];face.parts.coffee=[22,15,85,1];face.parts.emoji=[81,15,90,1];
    face.parts.month=[81,85,65,0];face.parts.fatigue=[20,85,65,0];face.parts.remaining=[50,92,65,1];
    face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    PRESETS.push({label:p[0],group:'numbers',isNew:true,bg:{t:'hue',rgb:p[3]},num:hexToRgb('#'+p[1]),na:'1',txt:'246,247,249',face:face,depth:false});
  });
  var PRESET_GROUPS=[['all','Visi'],['new','Jaunumi'],['wildlife','Dzīvnieki'],['botanical','Ziedi un augi'],['ocean','Ūdens'],['landscape','Ainavas un nakts'],['numbers','Ciparu efekti'],['collection','Citi foto']];
  function presetInGroup(p,group){return group==='all'||(group==='new'?p.isNew:p.group===group);}

  function loadAll() {
    try {
      var stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      var merged = {};
      var migrated = false;
      Object.keys(stored).forEach(function(k){
        var skin = stored[k];
        if (skin && skin.t === 'grad' && SCENIC_IDS[skin.id]) {
          skin = Object.assign({}, skin, { t: 'img' });
          migrated = true;
        }
        merged[normName(k)] = skin;
      });
      if (migrated) localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    } catch (e) { return {}; }
  }
  function saveAll(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function normName(n) {
    var name = String(n || '').trim().toUpperCase();
    var raw = name.toLowerCase();
    if (raw.normalize) raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var hash = 2166136261;
    for (var i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    var identityHash = (hash >>> 0).toString(36);
    if (identityHash === '3vftwm' || identityHash === 'bdyfi3') return 'WORKER-IDENTITY-01';
    return name;
  }
  window.mkAppearanceIdentity = normName;
  function cloudWorkerName(n) { return String(n || '').trim().toUpperCase(); }
  function hexToRgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length !== 6) return '100,210,255';
    return parseInt(h.substr(0,2),16) + ',' + parseInt(h.substr(2,2),16) + ',' + parseInt(h.substr(4,2),16);
  }
  function rgbToHex(rgb) {
    try { return '#' + String(rgb).split(',').map(function(x){ return (+x).toString(16).padStart(2,'0'); }).join(''); }
    catch (e) { return '#64d2ff'; }
  }
  function artUrl(id) {
    if (!/^[a-f0-9]{32}$/.test(String(id || ''))) return '';
    var base = (window.MinkaApi && window.MinkaApi.base) || window.MINKA_API_BASE || '';
    return base + '/skin-assets/' + id + '.webp';
  }
  function stockSkinUrl(id) {
    var cleanId = String(id || '');
    var material = window.MinkaFindCardMaterial(cleanId);
    if(material) return new URL(material.path+'?v=20260912photos1',document.baseURI).href;
    var path = 'data/skins/skin-' + cleanId + '.webp' + (/^aesthetic-/.test(cleanId) ? '?v=2' : '');
    try { return new URL(path, document.baseURI).href; }
    catch (e) { return path; }
  }

  var paletteCache = Object.create(null);
  function clampByte(value) { return Math.max(0, Math.min(255, Math.round(value || 0))); }
  function rgbToHsl(rgb) {
    var r = clampByte(rgb[0]) / 255, g = clampByte(rgb[1]) / 255, b = clampByte(rgb[2]) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  function hslToRgb(h, s, l) {
    h = ((+h % 360) + 360) % 360 / 360;
    s = Math.max(0, Math.min(100, +s || 0)) / 100;
    l = Math.max(0, Math.min(100, +l || 0)) / 100;
    if (!s) {
      var grey = clampByte(l * 255);
      return [grey, grey, grey];
    }
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < .5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)].map(function(v) { return clampByte(v * 255); });
  }
  function paletteFromRgb(rgb) {
    var c = (rgb || [100, 210, 255]).map(clampByte);
    var lum = (c[0] * .2126 + c[1] * .7152 + c[2] * .0722) / 255;
    var hsl = rgbToHsl(c);
    /* Material tipa tonālā palete: saglabājam fona nokrāsu, bet ciparam un
       tekstam izvēlamies pretējo gaišuma pusi, nevis vienmēr baltu. */
    var lightBackground = lum > .58;
    var contrast = hslToRgb(hsl.h, Math.max(42, hsl.s), lightBackground ? 24 : 80);
    var text = hslToRgb(hsl.h, Math.min(26, Math.max(10, hsl.s * .28)), lightBackground ? 13 : 94);
    return {
      num: contrast.join(','),
      txt: text.join(','),
      source: c.join(','),
      na: '0.98'
    };
  }
  function paletteFromCss(css) {
    var colors = String(css || '').match(/#[0-9a-f]{6}/ig) || [];
    if (!colors.length) return paletteFromRgb([100, 210, 255]);
    var sums = [0, 0, 0];
    colors.forEach(function(hex) {
      sums[0] += parseInt(hex.slice(1, 3), 16);
      sums[1] += parseInt(hex.slice(3, 5), 16);
      sums[2] += parseInt(hex.slice(5, 7), 16);
    });
    return paletteFromRgb(sums.map(function(v) { return v / colors.length; }));
  }
  function sampleImagePalette(url) {
    if (paletteCache[url]) return Promise.resolve(paletteCache[url]);
    return new Promise(function(resolve) {
      var image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = function() {
        try {
          if (!window.ColorThief || typeof window.ColorThief.getSwatchesSync !== 'function') throw new Error('ColorThief nav ielādēts');
          /* Analizējam nelielu, centrāli apgrieztu kartes kopiju. Tas atbilst
             reālajam background-size:cover un neapstrādā miljoniem pikseļu. */
          var sample = document.createElement('canvas');
          sample.width = 96; sample.height = 96;
          var sampleCtx = sample.getContext('2d', { alpha: false, willReadFrequently: true });
          var sourceSide = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
          var sourceX = Math.max(0, ((image.naturalWidth || image.width) - sourceSide) / 2);
          var sourceY = Math.max(0, ((image.naturalHeight || image.height) - sourceSide) / 2);
          sampleCtx.drawImage(image, sourceX, sourceY, sourceSide, sourceSide, 0, 0, 96, 96);
          var swatches = window.ColorThief.getSwatchesSync(sample, {
            colorCount: 12,
            quality: 2,
            ignoreWhite: true
          });
          var picked = swatches.LightVibrant || swatches.Vibrant || swatches.LightMuted || swatches.Muted || swatches.DarkVibrant || swatches.DarkMuted;
          if (!picked || !picked.color) throw new Error('Attēlam neizdevās iegūt paleti');
          var source = picked.color.array();
          var hsl = picked.color.hsl();
          /* Kartes foto jau ir aptumšots ar scrim. Saglabājam attēla nokrāsu,
             bet ceļam to līdz salasāmam Material tonim; teksts ir viegli tonēts. */
          var accent = hslToRgb(hsl.h, Math.max(50, hsl.s), 80);
          var text = hslToRgb(hsl.h, Math.min(24, Math.max(10, hsl.s * .24)), 94);
          paletteCache[url] = { num: accent.join(','), txt: text.join(','), na: '0.98', source: source.join(',') };
          resolve(paletteCache[url]);
        } catch (_error) { resolve(paletteFromRgb([100, 210, 255])); }
      };
      image.onerror = function() { resolve(paletteFromRgb([100, 210, 255])); };
      image.src = url;
    });
  }
  function suggestedPalette(skin) {
    if (!skin) return Promise.resolve(paletteFromRgb([100, 210, 255]));
    if (skin.t === 'grad') return Promise.resolve(paletteFromCss(GRAD_MAP[skin.id]));
    if (skin.t === 'hue' && skin.rgb) return Promise.resolve(paletteFromRgb(String(skin.rgb).split(',').map(Number)));
    if (skin.t === 'img' && skin.id) return sampleImagePalette(stockSkinUrl(skin.id));
    if (skin.t === 'art' && skin.id && artUrl(skin.id)) return sampleImagePalette(artUrl(skin.id));
    return Promise.resolve(paletteFromRgb([100, 210, 255]));
  }
  // Share the existing small-image palette sampler with contrast controls.
  window.mkSuggestSkinPalette=suggestedPalette;

  /* ── Nākamās maiņas plāksnīšu salasāmība ────────────────────────────────
     Plāksnītes fons var būt jebkas — foto, gradients vai vienkrāsains tonis —
     tāpēc tekstu vairs nekrāsojam uz labu laimi. Fonu nolasām vienu reizi —
     mazā pikseļu kopijā atrodam tā tumšāko un gaišāko vietu —, pieliekam tik
     daudz tonēta aizsega, cik vajag, lai gaišums saplaktu vienā pusē, un pašu
     teksta krāsu pabīdām pa gaišuma asi, saglabājot lietotāja izvēlēto nokrāsu.
     Rezultāts vienmēr sasniedz WCAG kontrastu, bet nemaksā neko: nav ne
     text-shadow, ne blur, ne animāciju — tikai viens statisks fona slānis un
     gatava krāsa, ko vecs dators uzzīmē vienreiz. */
  var NEXT_TONE_READY = Object.create(null);
  var NEXT_TONE_PENDING = Object.create(null);
  var NEXT_TONE_SEQ = 0;
  /* Fons, ko neizdevās nolasīt (piem., attēls no cita domēna): rēķināmies ar
     sliktāko — plašu gaišuma amplitūdu, kas prasa pilnu aizsegu. */
  var NEXT_TONE_UNKNOWN = { dark: [16, 20, 26], light: [238, 241, 246], mean: [128, 132, 138] };
  var NEXT_SCRIM_STEPS = [0, .06, .12, .18, .24, .3, .36, .42, .48, .54, .6, .66, .72, .78];
  /* Plāksnīte sānu panelī ir ap 93×25 px, un bilde tajā stiepjas ar cover.
     Rēķinām pēc šaurākās (tātad augstākās) joslas: platākā plāksnītē redzama
     mazāka bildes daļa, un aizsegs tad sanāk drošs, nevis par mazu. */
  var NEXT_PILL_RATIO = 3.5;
  /* Paraugs ir aptuveni plāksnītes dabiskajā izmērā, lai mazi, bet spilgti
     laukumi (saule, atspīdums) paliktu redzami arī aprēķinā. */
  var NEXT_SAMPLE_W = 112;
  var NEXT_SAMPLE_H = 32;
  /* Cik daudz laukuma katrā galā drīkst palikt ārpus aprēķina: mazāk par
     procentu ir atsevišķi punkti, ko burts pārsedz un acs nepamana. */
  var NEXT_EDGE_Q = .01;
  /* WCAG AA sīkam tekstam ir 4.5; paņemam mazu rezervi, jo paraugs tomēr ir
     bildes samazinājums, nevis pati plāksnīte. */
  var NEXT_TEXT_TARGET = 4.8;
  var NEXT_HOURS_TARGET = 4.2;
  var NEXT_KIND_HOURS = { day: [213, 170, 88], night: [121, 185, 216], '24h': [207, 117, 133] };
  var NEXT_DEFAULT_TEXT = [241, 244, 248];

  /* Gaišuma rēķins iet cauri katram parauga pikselim, tāpēc Math.pow vietā
     lietojam 256 vērtību tabulu — tā sagatavo sevi vienu reizi. */
  var SRGB_LINEAR = (function() {
    var table = new Float64Array(256);
    for (var i = 0; i < 256; i++) {
      var v = i / 255;
      table[i] = v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    }
    return table;
  })();
  function relLuminance(rgb) {
    return .2126 * SRGB_LINEAR[clampByte(rgb[0])] + .7152 * SRGB_LINEAR[clampByte(rgb[1])] + .0722 * SRGB_LINEAR[clampByte(rgb[2])];
  }
  function contrastRatio(lumA, lumB) {
    var hi = Math.max(lumA, lumB) + .05, lo = Math.min(lumA, lumB) + .05;
    return hi / lo;
  }
  /* CSS slāņus liek kopā pa sRGB baitiem, nevis lineārā telpā, tāpēc arī mēs. */
  function blendRgb(top, alpha, bottom) {
    var a = Math.max(0, Math.min(1, alpha || 0));
    return [0, 1, 2].map(function(i) { return clampByte(bottom[i] * (1 - a) + top[i] * a); });
  }
  function parseRgbTriplet(value) {
    if (!/^\d{1,3}(,\d{1,3}){2}$/.test(String(value || ''))) return null;
    return String(value).split(',').map(Number).map(clampByte);
  }
  function toneFromColors(colors) {
    var list = (colors || []).filter(Boolean);
    if (!list.length) return NEXT_TONE_UNKNOWN;
    /* Gradientu pieturas krāsas un toņi — saraksts ir īss, tāpēc te vienkārši
       ņemam gaišāko un tumšāko no tā. */
    var ranked = list.slice().sort(function(a, b) { return relLuminance(a) - relLuminance(b); });
    var low = ranked[0];
    var high = ranked[ranked.length - 1];
    var sums = [0, 0, 0];
    list.forEach(function(c) { sums[0] += c[0]; sums[1] += c[1]; sums[2] += c[2]; });
    return {
      dark: low,
      light: high,
      mean: sums.map(function(v) { return clampByte(v / list.length); })
    };
  }
  /* Bildei nepietiek ar procentilēm: viens spilgts pikselis tekstu netraucē,
     bet burta lieluma gaišs plankums — traucē. Tāpēc gaišāko un tumšāko malu
     meklējam pēc 3×3 vidējojuma, kas aptuveni atbilst burta biezumam. */
  function toneFromGrid(data, w, h) {
    var count = w * h;
    if (!count) return NEXT_TONE_UNKNOWN;
    var patchR = new Uint8ClampedArray(count), patchG = new Uint8ClampedArray(count), patchB = new Uint8ClampedArray(count);
    var lums = new Float64Array(count), order = new Array(count);
    var sums = [0, 0, 0];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var r = 0, g = 0, b = 0, seen = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (var dx = -1; dx <= 1; dx++) {
            var xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            var i = (yy * w + xx) << 2;
            r += data[i]; g += data[i + 1]; b += data[i + 2];
            seen++;
          }
        }
        var at = y * w + x;
        patchR[at] = r / seen; patchG[at] = g / seen; patchB[at] = b / seen;
        lums[at] = .2126 * SRGB_LINEAR[patchR[at]] + .7152 * SRGB_LINEAR[patchG[at]] + .0722 * SRGB_LINEAR[patchB[at]];
        order[at] = at;
        var self = at << 2;
        sums[0] += data[self]; sums[1] += data[self + 1]; sums[2] += data[self + 2];
      }
    }
    order.sort(function(a, b) { return lums[a] - lums[b]; });
    function patch(index) { var at = order[index]; return [patchR[at], patchG[at], patchB[at]]; }
    return {
      dark: patch(Math.floor((count - 1) * NEXT_EDGE_Q)),
      light: patch(Math.ceil((count - 1) * (1 - NEXT_EDGE_Q))),
      mean: sums.map(function(v) { return clampByte(v / count); })
    };
  }
  function sampleImageTone(url) {
    if (NEXT_TONE_READY[url]) return Promise.resolve(NEXT_TONE_READY[url]);
    if (NEXT_TONE_PENDING[url]) return NEXT_TONE_PENDING[url];
    NEXT_TONE_PENDING[url] = new Promise(function(resolve) {
      function done(tone) {
        NEXT_TONE_READY[url] = tone;
        delete NEXT_TONE_PENDING[url];
        resolve(tone);
      }
      var image;
      /* Ja pārlūkā nav Image vai canvas, paliekam pie drošākā pieņēmuma,
         nevis krītam ārā renderēšanas vidū. */
      try { image = new Image(); } catch (_error) { done(NEXT_TONE_UNKNOWN); return; }
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = function() {
        try {
          /* Plāksnīte zīmē bildi ar background-size:cover platā, zemā lodziņā,
             tāpēc arī mēs nolasām tikai to joslu, kas tiešām redzama — citādi
             gaišums, ko nogriež kadrējums, sabojātu aprēķinu. */
          var srcW = image.naturalWidth || image.width, srcH = image.naturalHeight || image.height;
          if (!srcW || !srcH) throw new Error('Attēlam nav izmēra');
          var bandH = Math.max(1, Math.min(srcH, srcW / NEXT_PILL_RATIO));
          var bandW = Math.max(1, Math.min(srcW, srcH * NEXT_PILL_RATIO));
          var canvas = document.createElement('canvas');
          canvas.width = NEXT_SAMPLE_W; canvas.height = NEXT_SAMPLE_H;
          var ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
          ctx.drawImage(image, (srcW - bandW) / 2, (srcH - bandH) / 2, bandW, bandH,
            0, 0, NEXT_SAMPLE_W, NEXT_SAMPLE_H);
          done(toneFromGrid(ctx.getImageData(0, 0, NEXT_SAMPLE_W, NEXT_SAMPLE_H).data, NEXT_SAMPLE_W, NEXT_SAMPLE_H));
        } catch (_error) { done(NEXT_TONE_UNKNOWN); }
      };
      image.onerror = function() { done(NEXT_TONE_UNKNOWN); };
      image.src = url;
    });
    return NEXT_TONE_PENDING[url];
  }
  function skinToneKey(skin) {
    if (!skin) return 'plain';
    if (skin.t === 'art' && artUrl(skin.id)) return artUrl(skin.id);
    if (skin.t === 'img' && skin.id) return stockSkinUrl(skin.id);
    if (skin.t === 'grad' && GRAD_MAP[skin.id]) return 'grad:' + skin.id;
    if (skin.t === 'hue' && skin.rgb) return 'hue:' + skin.rgb;
    return 'plain';
  }
  function skinToneSync(skin) {
    var key = skinToneKey(skin);
    if (NEXT_TONE_READY[key]) return NEXT_TONE_READY[key];
    if (key === 'plain') return (NEXT_TONE_READY[key] = toneFromColors([[24, 33, 43], [16, 23, 31]]));
    if (key.indexOf('grad:') === 0) {
      var stops = (String(GRAD_MAP[skin.id] || '').match(/#[0-9a-f]{6}/ig) || []).map(function(hex) {
        return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      });
      return (NEXT_TONE_READY[key] = toneFromColors(stops.length ? stops : null));
    }
    if (key.indexOf('hue:') === 0) {
      /* Toņa skins zīmējas kā rgba(tonis,.3) virs tumšās pamatnes. */
      var tint = parseRgbTriplet(skin.rgb) || [100, 210, 255];
      var over = blendRgb(tint, .3, [16, 23, 31]);
      return (NEXT_TONE_READY[key] = toneFromColors([over, blendRgb(tint, .3, [24, 33, 43])]));
    }
    return null;
  }
  function skinTone(skin) {
    var ready = skinToneSync(skin);
    if (ready) return Promise.resolve(ready);
    return sampleImageTone(skinToneKey(skin));
  }
  /* Fona slāņi virs bildes ir fiksēti, tāpēc to ieguldījumu ierēķinām jau te:
     spožākajā stūrī gulstas gaišā glancējuma svītra, tumšākajā — tikai vājā
     tumšā svītra. */
  function nextBrightEdge(tone) { return blendRgb([242, 250, 255], .16, blendRgb([5, 12, 20], .04, tone.light)); }
  function nextDarkEdge(tone) { return blendRgb([5, 12, 20], .12, tone.dark); }
  function scrimColorFor(mean, wantLightText) {
    var hsl = rgbToHsl(mean);
    /* Aizsegs paņem kartītes nokrāsu, lai plāksnīte nepaliek pelēka kaste. */
    return wantLightText
      ? hslToRgb(hsl.h, Math.min(38, hsl.s), 7)
      : hslToRgb(hsl.h, Math.min(26, hsl.s), 96);
  }
  /* Mazākais aizsegs, pie kura teksts izvēlētajā virzienā vēl var sasniegt
     mērķa kontrastu. Ja pat lielākais aizsegs nepalīdz, atdodam to — labāku
     variantu šajā virzienā nav, un izvēle starp virzieniem notiek augstāk. */
  function planScrim(tone, wantLightText) {
    var scrim = scrimColorFor(tone.mean, wantLightText);
    var bright = nextBrightEdge(tone), dark = nextDarkEdge(tone);
    var textEdgeLum = wantLightText ? 1 : 0;
    var last = null;
    for (var i = 0; i < NEXT_SCRIM_STEPS.length; i++) {
      var alpha = NEXT_SCRIM_STEPS[i];
      var lumBright = relLuminance(blendRgb(scrim, alpha, bright));
      var lumDark = relLuminance(blendRgb(scrim, alpha, dark));
      last = { alpha: alpha, scrim: scrim, light: wantLightText,
        bright: lumBright, dark: lumDark,
        reach: contrastRatio(textEdgeLum, wantLightText ? lumBright : lumDark) };
      if (last.reach >= NEXT_TEXT_TARGET) { last.ok = true; return last; }
    }
    last.ok = false;
    return last;
  }
  /* Krāsu mērām pret abām fona malām — gan gaišāko, gan tumšāko — citādi
     tonis, kas labi lasās uz bildes spožās puses, pazustu tās ēnās. Nokrāsa
     un piesātinājums paliek lietotāja, mainām tikai gaišumu. */
  function fitsBothEdges(rgb, plan, target) {
    var lum = relLuminance(rgb);
    return contrastRatio(lum, plan.bright) >= target && contrastRatio(lum, plan.dark) >= target;
  }
  function fitTextColor(rgb, plan, target) {
    if (fitsBothEdges(rgb, plan, target)) return rgb;
    var hsl = rgbToHsl(rgb);
    var step = plan.light ? 3 : -3;
    for (var l = hsl.l + step; plan.light ? l <= 100 : l >= 0; l += step) {
      var candidate = hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, l)));
      if (fitsBothEdges(candidate, plan, target)) return candidate;
    }
    return plan.light ? [255, 255, 255] : [0, 0, 0];
  }
  function readableNextPalette(tone, wantedText, wantedHours) {
    var meanLum = relLuminance(tone.mean);
    var lightPlan = planScrim(tone, true);
    var darkPlan = planScrim(tone, false);
    /* Vispirms skatāmies, kurā pusē fons jau ir: tumšai bildei gaišs teksts,
       gaišai — tumšs. Otru virzienu ņemam tikai tad, ja tas ietaupa jūtami
       vairāk aizsega, citādi plāksnītes lēkātu no tumšām uz gaišām. */
    var preferLight = meanLum <= .5;
    var primary = preferLight ? lightPlan : darkPlan;
    var fallback = preferLight ? darkPlan : lightPlan;
    var plan;
    if (!primary.ok && !fallback.ok) plan = primary.reach >= fallback.reach ? primary : fallback;
    else if (!fallback.ok || primary.ok && primary.alpha <= fallback.alpha + .12) plan = primary;
    else plan = fallback;
    return {
      alpha: plan.alpha,
      scrim: plan.scrim,
      text: fitTextColor(wantedText, plan, NEXT_TEXT_TARGET),
      hours: fitTextColor(wantedHours, plan, NEXT_HOURS_TARGET)
    };
  }
  function nextPersonKind(el) {
    if (el.classList.contains('is-night')) return 'night';
    if (el.classList.contains('is-24h')) return '24h';
    return 'day';
  }
  function paintNextShiftPalette(el, tone, wantedText, wantedHours) {
    var palette = readableNextPalette(tone, wantedText, wantedHours);
    el.style.setProperty('--mk-next-scrim', 'rgba(' + palette.scrim.join(',') + ',' + palette.alpha.toFixed(2) + ')');
    el.style.setProperty('--mk-next-text', 'rgb(' + palette.text.join(',') + ')');
    /* Stundu krāsa te ir necaurspīdīga: 8,5 px uzrakstam katra caurspīdīguma
       daļa ir tieši tikpat daudz zaudēta kontrasta. */
    el.style.setProperty('--mk-next-hours', 'rgb(' + palette.hours.join(',') + ')');
    el.classList.add('mk-next-has-text', 'mk-next-has-hours');
  }
  function applyNextShiftReadability(el, skin) {
    var wantedText = parseRgbTriplet(skin && skin.txt) || NEXT_DEFAULT_TEXT;
    var wantedHours = parseRgbTriplet(skin && (skin.num || skin.txt)) || NEXT_KIND_HOURS[nextPersonKind(el)];
    /* Jau nolasītam fonam krāsojam uzreiz — pārzīmējot sarakstu reizi minūtē,
       nedrīkst pazibēt vecās krāsas. */
    var ready = skinToneSync(skin);
    if (ready) { paintNextShiftPalette(el, ready, wantedText, wantedHours); return; }
    var token = ++NEXT_TONE_SEQ;
    el.__mkNextToneToken = token;
    skinTone(skin).then(function(tone) {
      if (el.__mkNextToneToken !== token || !el.isConnected) return;
      paintNextShiftPalette(el, tone, wantedText, wantedHours);
    });
  }

  window.mkGetWorkerSkin = function(name) {
    var all = loadAll();
    return all[normName(name)] || null;
  };
  window.mkGetRadioSkin = function(name) {
    var skin=window.mkGetWorkerSkin(name);if(!skin)return null;
    var bg='';
    if(skin.t==='img'||skin.t==='art'){
      var url=skin.t==='img'?stockSkinUrl(skin.id):artUrl(skin.id);
      if(url)bg='url("'+new URL(url,document.baseURI).href+'")';
    }else if(skin.t==='grad')bg=GRAD_MAP[skin.id]||'';
    else if(skin.t==='hue'&&/^\d{1,3}(,\d{1,3}){2}$/.test(skin.rgb||''))bg='linear-gradient(rgb('+skin.rgb+'),rgb('+skin.rgb+'))';
    function hex(rgb){if(!/^\d{1,3}(,\d{1,3}){2}$/.test(rgb||''))return '';return '#'+rgb.split(',').map(function(v){return Math.max(0,Math.min(255,Number(v))).toString(16).padStart(2,'0');}).join('');}
    return {background:bg,text:hex(skin.txt),accent:hex(skin.num||skin.rgb||skin.txt)};
  };
  function applyNextShiftSkin(el, skin) {
    // Next-shift pills share the saved appearance, without particle effects
    // or data-worker hooks that operate on today's duty cards.
    ['--mk-next-bg','--mk-next-tint','--mk-next-text','--mk-next-hours','--mk-next-scrim'].forEach(function(key) { el.style.removeProperty(key); });
    el.classList.remove('mk-next-has-text','mk-next-has-hours');
    el.__mkNextToneToken = ++NEXT_TONE_SEQ;
    if (!skin) return;
    var background = '';
    if (skin.t === 'art' && skin.id && artUrl(skin.id)) background = "url('" + artUrl(skin.id) + "')";
    else if (skin.t === 'img' && skin.id) background = "url('" + stockSkinUrl(skin.id) + "')";
    else if (skin.t === 'grad' && GRAD_MAP[skin.id]) background = GRAD_MAP[skin.id];
    else if (skin.t === 'hue' && skin.rgb) el.style.setProperty('--mk-next-tint', 'rgba(' + skin.rgb + ',.3)');
    if (background) el.style.setProperty('--mk-next-bg', background);
    // Saglabātā teksta krāsa ir sākumpunkts, nevis galavārds: to pieskaņo fonam.
    applyNextShiftReadability(el, skin);
  }
  window.mkApplySkinToEl = function(el, skin) {
    if (el.classList.contains('mk-next-person')) { applyNextShiftSkin(el, skin); return; }
    if (window.nsApplyWorkerColour) window.nsApplyWorkerColour(el, skin);
    var numEl = el.querySelector('.mk-mid-hours.card-shift') || el.querySelector('.pv-num') || el.querySelector('.nsc-full-dur');
    if (numEl) { numEl.style.removeProperty('color'); numEl.style.removeProperty('-webkit-text-fill-color'); }
    // Night duration sits on a fixed dark info strip, independent of skin text colours.
    if (el.classList.contains('nsc-full-card')) numEl = null;
    ['mk-has-skin','mk-has-grad','mk-skin-fit','mk-has-num','mk-has-txt','mk-has-spark','mk-fx-hearts','mk-fx-mirdz','mk-fx-burb','mk-fx-ziedi','mk-fx-taur','mk-emoji-custom','mk-emoji-normal','nsc-worker-skinned','nsc-skin-hue','nsc-skin-contain','ns-room-bed-skin-hue'].forEach(function(c){ el.classList.remove(c); });
    ['--mk-skin-img','--mk-emoji-tint','--mk-emoji-tint-a','--mk-num-color','--mk-num-alpha','--mk-txt-color','--mk-emoji-op','--mk-fx-scale'].forEach(function(p){ el.style.removeProperty(p); });
    if (!skin) { if (window.MinkaCardFaces) window.MinkaCardFaces.apply(el, null); return; }
    if (el.classList.contains('nsc-full-card')) el.classList.add('nsc-worker-skinned');
    if (skin.t === 'art' && skin.id && artUrl(skin.id)) {
      el.classList.add('mk-has-skin');
      el.style.setProperty('--mk-skin-img', "url('" + artUrl(skin.id) + "')");
    } else if (skin.t === 'img' && skin.id) {
      el.classList.add('mk-has-skin');
      if (/^aesthetic-/.test(String(skin.id))) el.classList.add('mk-skin-fit');
      if (el.classList.contains('nsc-full-card') && /^cat-/.test(String(skin.id))) el.classList.add('nsc-skin-contain');
      var material=window.MinkaFindCardMaterial(skin.id);
      el.style.setProperty('--mk-skin-img', "url('" + stockSkinUrl(skin.id) + "')"+(material&&material.background?','+material.background:''));
    } else if (skin.t === 'grad' && skin.id && GRAD_MAP[skin.id]) {
      el.classList.add('mk-has-skin');
      el.classList.add('mk-has-grad');
      el.style.setProperty('--mk-skin-img', GRAD_MAP[skin.id]);
    } else if (skin.t === 'hue' && skin.rgb) {
      el.style.setProperty('--mk-emoji-tint', skin.rgb);
      el.style.setProperty('--mk-emoji-tint-a', '.24');
      if (el.classList.contains('nsc-full-card')) el.classList.add('nsc-skin-hue');
      if (el.classList.contains('ns-room-bed')) el.classList.add('ns-room-bed-skin-hue');
    }
    if (skin.num) {
      el.classList.add('mk-has-num');
      el.style.setProperty('--mk-num-color', skin.num);
      el.style.setProperty('--mk-num-alpha', skin.numA != null ? skin.numA : 1);
      var rgb = String(skin.num).trim();
      if (numEl && /^\d{1,3}(,\d{1,3}){2}$/.test(rgb)) {
        var alpha = Math.max(0, Math.min(1, Number(skin.numA != null ? skin.numA : 1) || 0));
        if (el.classList.contains('nsc-full-card')) alpha = Math.max(.72, alpha);
        numEl.style.setProperty('color', 'rgba(' + rgb + ',' + alpha + ')', 'important');
        numEl.style.setProperty('-webkit-text-fill-color', 'rgba(' + rgb + ',' + alpha + ')', 'important');
      }
    }
    if (skin.txt && /^\d{1,3}(,\d{1,3}){2}$/.test(String(skin.txt))) {
      el.classList.add('mk-has-txt');
      el.style.setProperty('--mk-txt-color', skin.txt);
    }
    if (skin.em != null) {
      el.classList.add('mk-emoji-custom');
      el.style.setProperty('--mk-emoji-op', skin.em);
    }
    if (skin.emn === '0') el.classList.add('mk-emoji-normal');
    if (skin.fx === 'spark') el.classList.add('mk-has-spark');
    else if (['hearts','mirdz','burb','ziedi','taur'].indexOf(skin.fx) >= 0) el.classList.add('mk-fx-' + skin.fx);
    if (skin.fx && skin.fxs != null) el.style.setProperty('--mk-fx-scale', skin.fxs);
    if (window.MinkaCardFaces) window.MinkaCardFaces.apply(el, skin);
  };
  function applyToCards(k) {
    var skin = loadAll()[k] || null;
    document.querySelectorAll('#grafiks-list .card[data-worker], #nsPanel .nsc-full-card[data-worker], #nsPanel .ns-room-bed[data-worker], .mk-next-person[data-next-worker]').forEach(function(c) {
      if (normName(c.getAttribute('data-worker') || c.getAttribute('data-next-worker')) !== k) return;
      window.mkApplySkinToEl(c, skin);
    });
  }
  function hasAny(sk) { return !!(sk && (sk.t || sk.num || sk.txt || sk.em != null || sk.emn != null || sk.fx || sk.face)); }
  function storeSkinLocal(name, skin) {
    cloudRevision++;
    var all = loadAll();
    var k = normName(name);
    if (hasAny(skin)) all[k] = skin; else delete all[k];
    saveAll(all);
    applyToCards(k);
  }
  function setSkin(name, skin, debounceCloud) {
    var k = normName(name);
    storeSkinLocal(name, skin);
    if (cloudTimers[k]) clearTimeout(cloudTimers[k]);
    if (debounceCloud) {
      var pendingSkin = skin ? JSON.parse(JSON.stringify(skin)) : null;
      cloudTimers[k] = setTimeout(function() {
        delete cloudTimers[k];
        cloudPush(name, pendingSkin, true);
      }, 300);
    } else {
      delete cloudTimers[k];
      cloudPush(name, skin);
    }
  }

  // ── Cloudflare sync (skins + dekors vienā /api/skins ierakstā) ──
  // Kanonizē decimālskaitli servera regex vajadzībām: "1.00"→"1", "0.70"→"0.7", "0.95"→"0.95".
  function numStr(v) {
    var n = parseFloat(v);
    return isNaN(n) ? '0' : String(n);
  }
  function cleanAddonConfig(value) {
    if (!value || !/^[a-z0-9-]{1,40}$/.test(String(value.id || ''))) return null;
    return {
      id: String(value.id),
      scale: Math.round(Math.max(.6, Math.min(1.4, Number(value.scale) || 1)) * 100),
      side: value.side === 'left' ? 'l' : 'r',
      x: Math.round(Math.max(-100, Math.min(100, Number(value.x) || 0)) * 10),
      y: Math.round(Math.max(-100, Math.min(100, Number(value.y) || 0)) * 10)
    };
  }
  function packSkin(sk, name) {
    var p = [];
    if (sk) {
      if (sk.t === 'art' && sk.id) p.push('art:' + sk.id);
      else if (sk.t === 'img' && sk.id) p.push('img:' + sk.id);
      else if (sk.t === 'grad' && sk.id) p.push('grad:' + sk.id);
      else if (sk.t === 'hue' && sk.rgb) p.push('hue:' + sk.rgb);
      if (sk.txt) p.push('txt:' + sk.txt);
      if (sk.num) p.push('num:' + sk.num);
      if (sk.numA != null) p.push('na:' + numStr(sk.numA));
      if (sk.em != null) p.push('em:' + numStr(sk.em));
      if (sk.emn != null) p.push('emn:' + sk.emn);
      if (sk.fx) p.push('fx:' + sk.fx);
      if (sk.fx && sk.fxs != null) p.push('fxs:' + numStr(sk.fxs));
      if (sk.depth === false) p.push('dp:0');
      if (sk.face && window.MinkaCardFaceModel) p.push('wf:' + window.MinkaCardFaceModel.pack(sk.face));
    }
    if (window.MinkaCardAddons && typeof window.MinkaCardAddons.get === 'function') {
      p.push('av:1');
      var addon = cleanAddonConfig(window.MinkaCardAddons.get(name));
      if (addon) p.push('ad:' + [addon.id, addon.scale, addon.side, addon.x, addon.y].join(','));
    }
    return p.join(';');
  }
  function unpackAppearance(v) {
    var sk = {};
    var addon = null;
    var addonVersion = 0;
    String(v || '').split(';').forEach(function(part) {
      if (part.indexOf('art:') === 0) { sk.t = 'art'; sk.id = part.slice(4); }
      else if (part.indexOf('img:') === 0) { sk.t = 'img'; sk.id = part.slice(4); }
      else if (part.indexOf('grad:') === 0) { sk.t = 'grad'; sk.id = part.slice(5); }
      else if (part.indexOf('hue:') === 0) { sk.t = 'hue'; sk.rgb = part.slice(4); }
      else if (part.indexOf('txt:') === 0) { sk.txt = part.slice(4); }
      else if (part.indexOf('num:') === 0) { sk.num = part.slice(4); }
      else if (part.indexOf('na:') === 0) { sk.numA = part.slice(3); }
      else if (part.indexOf('em:') === 0) { sk.em = part.slice(3); }
      else if (part.indexOf('emn:') === 0) { sk.emn = part.slice(4); }
      else if (part.indexOf('fx:') === 0) { sk.fx = part.slice(3); }
      else if (part.indexOf('fxs:') === 0) { sk.fxs = part.slice(4); }
      else if (part === 'dp:0') { sk.depth = false; }
      else if (part.indexOf('wf:') === 0 && window.MinkaCardFaceModel) { sk.face = window.MinkaCardFaceModel.unpack(part.slice(3)); }
      else if (part === 'av:1') { addonVersion = 1; }
      else if (part.indexOf('ad:') === 0) {
        var fields = part.slice(3).split(',');
        var clean = fields.length === 5 ? cleanAddonConfig({
          id: fields[0],
          scale: Number(fields[1]) / 100,
          side: fields[2] === 'l' ? 'left' : 'right',
          x: Number(fields[3]) / 10,
          y: Number(fields[4]) / 10
        }) : null;
        if (clean) addon = { id: clean.id, scale: clean.scale / 100, side: clean.side === 'l' ? 'left' : 'right', x: clean.x / 10, y: clean.y / 10 };
      }
    });
    if (sk.t === 'grad' && SCENIC_IDS[sk.id]) sk.t = 'img';
    return { skin: hasAny(sk) ? sk : null, addon: addon, addonVersion: addonVersion };
  }
  function unpackSkin(v) {
    return unpackAppearance(v).skin;
  }
  function warnLocalOnly() {
    if (typeof _mkToast === 'function') _mkToast('Mākonis vēl nav gatavs — izskats pagaidām tikai šajā ierīcē', 'error');
  }
  function cloudPush(name, sk, silent) {
    if (!window.MinkaApi || !window.MinkaApi.apiFetch) { warnLocalOnly(); return; }
    var revision = ++cloudRevision;
    cloudWrites++;
    return window.MinkaApi.apiFetch('/api/skins', { method: 'POST', json: { worker: cloudWorkerName(name), skin: packSkin(sk, name) || null } })
      .then(function(r) { if (!r.ok) throw 0; if (!silent && revision===cloudRevision && typeof _mkToast === 'function') _mkToast('Izskats saglabāts — redzēs visi', 'ok'); })
      .catch(warnLocalOnly)
      .finally(function(){ cloudWrites--; });
  }
  window.mkSyncWorkerAppearance = function(name, debounceCloud) {
    cloudRevision++;
    var key = normName(name);
    var skin = loadAll()[key] || null;
    if (cloudTimers[key]) clearTimeout(cloudTimers[key]);
    if (debounceCloud) {
      cloudTimers[key] = setTimeout(function() {
        delete cloudTimers[key];
        cloudPush(name, skin, true);
      }, 300);
    } else {
      delete cloudTimers[key];
      cloudPush(name, skin, true);
    }
  };
  async function uploadArt(name, blob) {
    if (!window.MinkaApi || !window.MinkaApi.apiFetch || !window.MinkaApi.getToken || !window.MinkaApi.getToken()) {
      throw new Error('Nav savienojuma ar mākoni');
    }
    var form = new FormData();
    form.append('worker', cloudWorkerName(name));
    form.append('image', blob, 'skin.webp');
    cloudRevision++;
    cloudWrites++;
    var response;
    try { response = await window.MinkaApi.apiFetch('/api/skin-art', { method: 'POST', body: form }); }
    finally { cloudWrites--; }
    var data = await response.json().catch(function(){ return {}; });
    if (!response.ok || !data.skin) throw new Error(data.error || 'Neizdevās saglabāt zīmējumu');
    var skin = unpackSkin(data.skin);
    if (!skin || skin.t !== 'art') throw new Error('Serveris atgrieza nederīgu zīmējumu');
    storeSkinLocal(name, skin);
    return skin;
  }
  var cloudPullTimer = 0;
  var cloudPullInFlight = false;
  function sameAppearanceMap(a, b) {
    var keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(function(key) {
      return JSON.stringify(a[key]) === JSON.stringify(b[key]);
    });
  }
  function scheduleCloudPull(delay, attempt) {
    clearTimeout(cloudPullTimer);
    if (document.hidden) return;
    cloudPullTimer = setTimeout(function(){ cloudPull(attempt || 0); }, Math.max(0, delay || 0));
  }
  function cloudPull(attempt) {
    if (document.hidden || cloudPullInFlight) return;
    if (!window.MinkaApi || !window.MinkaApi.apiFetch) return;
    if (window.MinkaApi.getToken && !window.MinkaApi.getToken()) return;
    if (cloudWrites || Object.keys(cloudTimers).length) { scheduleCloudPull(30000, 0); return; }
    cloudPullInFlight = true;
    var revision = cloudRevision;
    var nextDelay = 30000;
    var nextAttempt = 0;
    return window.MinkaApi.apiFetch('/api/skins', { cache: 'no-store' }).then(function(r) {
      if (!r.ok) throw 0;
      return r.json();
    }).then(function(map) {
      if (!map || typeof map !== 'object' || Array.isArray(map)) return;
      // A response started before a local edit must never restore the old skin.
      if (revision !== cloudRevision || cloudWrites || Object.keys(cloudTimers).length) return;
      var previous = loadAll();
      var all = {};
      var localAddons = window.MinkaCardAddons && typeof window.MinkaCardAddons.getAll === 'function'
        ? window.MinkaCardAddons.getAll() : {};
      var cloudAddons = {};
      var addonAuthority = {};
      Object.keys(map).forEach(function(k) {
        var key = normName(k);
        var appearance = unpackAppearance(map[k]);
        if (appearance.skin) all[key] = appearance.skin;
        if (appearance.addonVersion) {
          addonAuthority[key] = true;
          if (appearance.addon) cloudAddons[key] = appearance.addon;
        } else if (localAddons[key]) {
          cloudAddons[key] = localAddons[key];
        }
      });
      Object.keys(localAddons).forEach(function(key) {
        if (!addonAuthority[key] && !cloudAddons[key]) cloudAddons[key] = localAddons[key];
      });
      var changed = Object.keys(Object.assign({}, previous, all)).filter(function(key) {
        return JSON.stringify(previous[key] || null) !== JSON.stringify(all[key] || null);
      });
      if (changed.length) {
        saveAll(all);
        changed.forEach(applyToCards);
      }
      if (!sameAppearanceMap(localAddons, cloudAddons) && window.MinkaCardAddons && typeof window.MinkaCardAddons.replaceFromCloud === 'function') {
        window.MinkaCardAddons.replaceFromCloud(cloudAddons);
      }
      Object.keys(localAddons).forEach(function(key) {
        if (!addonAuthority[key]) cloudPush(key, all[key] || null, true);
      });
    }).catch(function() {
      if (attempt < 2 && window.MinkaApi.getToken && window.MinkaApi.getToken()) {
        nextDelay = 900 * (attempt + 1);
        nextAttempt = attempt + 1;
      }
    }).finally(function() {
      cloudPullInFlight = false;
      scheduleCloudPull(nextDelay, nextAttempt);
    });
  }
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) clearTimeout(cloudPullTimer);
    else scheduleCloudPull(100, 0);
  });
  window.addEventListener('online', function(){ scheduleCloudPull(100, 0); });
  document.addEventListener('minka:auth-ok', function(){ scheduleCloudPull(50, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ scheduleCloudPull(1500, 0); }, { once: true });
  else scheduleCloudPull(1500, 0);

  function currentWorkerName() {
    var f = (document.getElementById('modal-firstname') || {}).innerText || '';
    var l = (document.getElementById('modal-surname') || {}).innerText || '';
    return (f + ' ' + l).replace(/--/g, '').trim();
  }

  window.mkRenderSkinPicker = function(host) {
    if (!host) return;
    paletteRevision++;
    var name = currentWorkerName();
    var cur = window.mkGetWorkerSkin(name);
    var draft = cur ? JSON.parse(JSON.stringify(cur)) : {};
    var chosenMaterial=draft.t==='img'&&window.MinkaFindCardMaterial(draft.id);
    if(chosenMaterial)draft.id=chosenMaterial.id;
    var rosterCards = document.querySelectorAll('#grafiks-list .card[data-worker]');
    var previewSource = Array.prototype.find.call(rosterCards, function(card) {
      return normName(card.getAttribute('data-worker')) === normName(name);
    });
    // Card faces sizes the preview from a live card; roster cards share one size.
    var previewSizeSource = previewSource;
    if (!previewSource && typeof window.__minkaBuildPreviewCard === 'function') {
      previewSource = window.__minkaBuildPreviewCard(name) || undefined;
      if (previewSource) {
        var role = previewSource.classList.contains('mk-mid-card-rd') ? 'mk-mid-card-rd' : 'mk-mid-card-rg';
        previewSizeSource = Array.prototype.find.call(rosterCards, function(card) { return card.classList.contains(role); }) || rosterCards[0];
      }
    }
    var emVal = draft.em != null ? Math.round(parseFloat(draft.em) * 100) : 13;
    var emShown = draft.em !== '0';
    if (draft.t === 'img' && SCENIC_IDS[draft.id]) {
      activeImageGroup = 0;
    } else if (draft.t === 'img' && draft.id) {
      IMG_GROUPS.some(function(group, index) {
        if (group.ids.indexOf(draft.id) < 0) return false;
        activeImageGroup = index + 1;
        return true;
      });
    }

    var html = '<div class="mk-skin-shell"><aside class="mk-skin-aside"><div class="mk-skin-preview-slot">'
      + '<div id="grafiks-list" class="grid-view mk-skin-preview-list" aria-hidden="true"></div></div>'
      + '<div class="mk-auto-palette"><div><strong>Auto krāsas</strong></div>'
      + '<label class="mk-auto-toggle"><input type="checkbox" class="mk-auto-palette-toggle"' + (autoPaletteEnabled ? ' checked' : '') + '><span></span><b>Auto</b></label>'
      + '<button type="button" class="mk-auto-palette-now">Pieskaņot</button></div>'
      + '</aside><div class="mk-skin-editor"><div class="mk-skin-main-tabs" role="tablist" aria-label="Izskata sadaļas">'
      + '<button type="button" class="mk-skin-main-tab' + (activeSkinSection === 'background' ? ' is-active' : '') + '" data-skin-section="background" role="tab" aria-selected="' + (activeSkinSection === 'background') + '">Fons</button>'
      + '<button type="button" class="mk-skin-main-tab' + (activeSkinSection === 'details' ? ' is-active' : '') + '" data-skin-section="details" role="tab" aria-selected="' + (activeSkinSection === 'details') + '">Pieskaņot</button>'
      + '<button type="button" class="mk-skin-main-tab' + (activeSkinSection === 'presets' ? ' is-active' : '') + '" data-skin-section="presets" role="tab" aria-selected="' + (activeSkinSection === 'presets') + '">Komplekti</button>'
      + '</div>';

    html += '<section class="mk-skin-section' + (activeSkinSection === 'presets' ? ' is-active' : '') + '" data-skin-panel="presets"><div class="mk-skin-section-head"><strong>Gatavie komplekti</strong></div><div class="mk-preset-groups" role="group" aria-label="Komplektu grupas">';
    PRESET_GROUPS.forEach(function(g){var count=PRESETS.filter(function(p){return presetInGroup(p,g[0]);}).length;if(count)html+='<button type="button" class="mk-preset-group" data-preset-group="'+g[0]+'" aria-pressed="'+(activePresetGroup===g[0])+'">'+skinEsc(g[1])+' <span>'+count+'</span></button>';});
    html += '</div><div class="mk-skin-presets">';
    PRESETS.forEach(function(p, i) {
      html += '<button type="button" class="mk-skin-preset mk-material-preset" data-preset="'+i+'"'+(presetInGroup(p,activePresetGroup)?'':' hidden')+'><span class="mk-preset-stage" aria-hidden="true"></span><strong>'+skinEsc(p.label)+'</strong></button>';
    });
    html += '</div></section>';

    html += '<section class="mk-skin-section' + (activeSkinSection === 'details' ? ' is-active' : '') + '" data-skin-panel="details"><div class="mk-skin-section-head"><strong>Krāsas un efekti</strong></div><div class="mk-skin-tools">';
    html += '<div class="mk-skin-tool"><div class="mk-skin-tool-head">' + (draft.face ? 'Stikla tonis un cipara redzamība' : 'Cipars') + '</div><div class="mk-skin-custom">'
      + '<input type="color" class="mk-num-color" value="' + (draft.face ? '#'+draft.face.tint : draft.num ? rgbToHex(draft.num) : '#a78bfa') + '" title="Cipara krāsa">'
      + '<input type="range" class="mk-num-alpha" min="15" max="100" step="5" value="' + Math.round((draft.numA != null ? +draft.numA : 1) * 100) + '">'
      + '<span class="mk-num-alpha-val">' + Math.round((draft.numA != null ? +draft.numA : 1) * 100) + '%</span>'
      + '</div></div>';
    html += '<div class="mk-skin-tool mk-skin-tool-text"><div class="mk-skin-tool-head">Teksts</div><div class="mk-skin-custom">'
      + '<input type="color" class="mk-txt-color" value="' + (draft.txt ? rgbToHex(draft.txt) : '#ffffff') + '" title="Vārda un iniciāļu krāsa">'
      + '<button type="button" class="mk-txt-clear" title="Atiestatīt teksta krāsu">↺</button>'
      + '</div></div>';
    html += '<div class="mk-skin-tool mk-skin-tool-emoji"><div class="mk-skin-tool-head">Emoji fonā</div><div class="mk-skin-custom">'
      + '<label class="mk-switch"><input type="checkbox" class="mk-emoji-show"' + (emShown ? ' checked' : '') + '><span></span><b>Rādīt</b></label>'
      + '<input type="range" class="mk-emoji-op" min="4" max="60" step="2" value="' + (emShown ? emVal : 13) + '"' + (emShown ? '' : ' disabled') + '>'
      + '<span class="mk-emoji-op-val">' + (emShown ? emVal : 0) + '%</span>'
      + '<label class="mk-chk"><input type="checkbox" class="mk-emoji-neg"' + (draft.emn === '0' ? '' : ' checked') + '> Negatīvs</label>'
      + '</div></div>';
    html += '</div>';

    html += '<div class="mk-skin-effects"><div class="mk-skin-effects-head"><span>Efekts</span><div class="mk-fx-size-wrap">'
      + '<span>Izmērs</span>'
      + '<input type="range" class="mk-fx-size" min="50" max="300" step="10" value="' + Math.round((draft.fxs != null ? +draft.fxs : 1) * 100) + '"' + (draft.fx ? '' : ' disabled') + '>'
      + '<b class="mk-fx-size-val">' + Math.round((draft.fxs != null ? +draft.fxs : 1) * 100) + '%</b>'
      + '</div></div><div class="mk-fx-row">';
    [['','Nav'],['spark','✨ Zvaigznītes'],['mirdz','🌟 Mirdzums'],['hearts','💗 Sirsniņas'],['ziedi','🌸 Ziedlapiņas'],['taur','🦋 Tauriņi'],['burb','🫧 Burbuļi']].forEach(function(fx) {
      var act = (draft.fx || '') === fx[0];
      html += '<button type="button" class="mk-skin-fx' + (act ? ' is-on' : '') + '" data-fx="' + fx[0] + '" aria-pressed="' + act + '">' + fx[1] + '</button>';
    });
    html += '</div></div></section>';

    var activeBgMode = draft.t === 'img' ? 'image' : (draft.t === 'art' ? 'draw' : 'color');
    html += '<section class="mk-skin-section' + (activeSkinSection === 'background' ? ' is-active' : '') + '" data-skin-panel="background"><div class="mk-skin-section-head"><strong>Izvēlies fonu</strong></div><div class="mk-bg-workspace"><div class="mk-bg-toolbar">'
      + '<div class="mk-bg-mode-tabs" role="tablist" aria-label="Fona veids">'
      + '<button type="button" class="mk-bg-mode' + (activeBgMode === 'image' ? ' is-active' : '') + '" data-bg-mode="image" role="tab" aria-selected="' + (activeBgMode === 'image') + '">Attēli</button>'
      + '<button type="button" class="mk-bg-mode' + (activeBgMode === 'color' ? ' is-active' : '') + '" data-bg-mode="color" role="tab" aria-selected="' + (activeBgMode === 'color') + '">Krāsa</button>'
      + '<button type="button" class="mk-bg-mode' + (activeBgMode === 'draw' ? ' is-active' : '') + '" data-bg-mode="draw" role="tab" aria-selected="' + (activeBgMode === 'draw') + '">Zīmējums</button>'
      + '</div>';
    html += '</div>';

    html += '<div class="mk-bg-panel mk-bg-colors' + (activeBgMode === 'color' ? ' is-active' : '') + '" data-bg-panel="color"><div class="mk-skin-grads">';
    GRADS.forEach(function(g) {
      var act = draft.t === 'grad' && draft.id === g.id;
      html += '<button type="button" class="mk-skin-grad-sw' + (act ? ' is-active' : '') + '" data-grad="' + g.id + '" title="' + g.label + '" aria-label="' + g.label + '" aria-pressed="' + act + '" style="background:' + g.css + '"></button>';
    });
    HUES.forEach(function(h) {
      var act = draft.t === 'hue' && draft.rgb === h.rgb;
      html += '<button type="button" class="mk-skin-hue' + (act ? ' is-active' : '') + '" data-rgb="' + h.rgb + '" aria-label="Fona krāsa ' + h.hex + '" aria-pressed="' + act + '" style="background:' + h.hex + '"></button>';
    });
    html += '<input type="color" class="mk-skin-color" value="' + (draft.t === 'hue' ? rgbToHex(draft.rgb) : '#64d2ff') + '" title="Sava fona krāsa">';
    html += '</div></div>';

    html += '<div class="mk-bg-panel mk-bg-draw' + (activeBgMode === 'draw' ? ' is-active' : '') + '" data-bg-panel="draw"><div class="mk-skin-art-row">'
      + '<button type="button" class="mk-skin-art-open' + (draft.t === 'art' ? ' is-active' : '') + '">'
      + (draft.t === 'art' ? 'Rediģēt savu fonu' : 'Uzzīmēt savu fonu') + '</button>';
    if (draft.t === 'art' && artUrl(draft.id)) {
      html += '<span class="mk-skin-art-current" style="background-image:url(' + artUrl(draft.id) + ')" aria-label="Pašreizējais zīmējums"></span>';
    }
    html += '</div></div>';

    html += '<div class="mk-bg-panel mk-bg-images' + (activeBgMode === 'image' ? ' is-active' : '') + '" data-bg-panel="image">'
      + '<div class="mk-skin-category-nav">'
      + '<div class="mk-skin-category-bar" role="tablist" aria-label="Attēlu kategorijas">';
    html += '<button type="button" class="mk-skin-category' + (activeImageGroup === 0 ? ' is-active' : '') + '" data-group="0" role="tab" aria-selected="' + (activeImageGroup === 0) + '">Ainavas<span>' + SCENIC_SKINS.length + '</span></button>';
    IMG_GROUPS.forEach(function(grp, groupIndex) {
      var categoryIndex = groupIndex + 1;
      html += '<button type="button" class="mk-skin-category' + (categoryIndex === activeImageGroup ? ' is-active' : '') + '" data-group="' + categoryIndex + '" role="tab" aria-selected="' + (categoryIndex === activeImageGroup) + '">'
        + skinEsc(grp.label) + '<span>' + grp.ids.length + '</span></button>';
    });
    html += '</div></div><div class="mk-skin-gallery">';
    html += '<div class="mk-skin-grid' + (activeImageGroup === 0 ? ' is-active' : '') + '" data-group-panel="0">';
    SCENIC_SKINS.forEach(function(scene) {
      var act = draft.t === 'img' && draft.id === scene.id;
      var imageUrl = stockSkinUrl(scene.id);
      html += '<button type="button" class="mk-skin-thumb' + (act ? ' is-active' : '') + '" data-skin="' + scene.id + '" data-src="' + skinEsc(imageUrl) + '" title="' + skinEsc(scene.label) + '" aria-label="' + skinEsc(scene.label) + '" aria-pressed="' + act + '" style="background-image:url(&quot;' + skinEsc(imageUrl) + '&quot;)"><span><b>' + skinEsc(scene.label) + '</b></span></button>';
    });
    html += '</div>';
    IMG_GROUPS.forEach(function(grp, groupIndex) {
      var categoryIndex = groupIndex + 1;
      html += '<div class="mk-skin-grid' + (categoryIndex === activeImageGroup ? ' is-active' : '') + '" data-group-panel="' + categoryIndex + '">';
      grp.ids.forEach(function(id) {
        var act = draft.t === 'img' && draft.id === id;
        var label = IMG_LABELS[id] || grp.label;
        var imageUrl = stockSkinUrl(id);
        var material=window.MinkaFindCardMaterial(id);
        var imageStyle='url(&quot;'+skinEsc(imageUrl)+'&quot;)'+(material&&material.background?','+material.background:'');
        html += '<button type="button" class="mk-skin-thumb' + (act ? ' is-active' : '') + '" data-skin="' + id + '" data-src="' + skinEsc(imageUrl) + '" title="' + skinEsc(label) + '" aria-label="' + skinEsc(label) + '"'
          + ' aria-pressed="' + act + '"'
          + (categoryIndex === activeImageGroup ? ' style="background-image:' + imageStyle + '"' : '')
          + '><span><b>' + skinEsc(label) + '</b></span></button>';
      });
      html += '</div>';
    });
    html += '</div></div></div></section></div></div>';

    html += '<div class="mk-skin-footer">'
      + '<button type="button" class="mk-skin-clear">✕ Noņemt visu izskatu</button></div>';
    host.innerHTML = html;

    var previewList = host.querySelector('.mk-skin-preview-list');
    var prev;
    if (previewSource && previewList) {
      prev = previewSource.cloneNode(true);
      prev.removeAttribute('data-worker');
      prev.removeAttribute('id');
      prev.classList.add('mk-skin-preview-real');
      prev.querySelectorAll('[id]').forEach(function(node) { node.removeAttribute('id'); });
      prev.querySelectorAll('button, input, select, textarea, a').forEach(function(node) {
        node.setAttribute('tabindex', '-1');
        node.setAttribute('aria-hidden', 'true');
      });
      previewList.appendChild(prev);
    } else {
      prev = document.createElement('div');
      prev.className = 'mk-skin-preview mk-skin-preview-real';
      if (previewList) previewList.appendChild(prev);
    }
    function livePreview() {
      window.mkApplySkinToEl(prev, hasAny(draft) ? draft : null);
      var k = normName(name);
      document.querySelectorAll('#grafiks-list .card[data-worker], .mk-next-person[data-next-worker]').forEach(function(c) {
        if (normName(c.getAttribute('data-worker') || c.getAttribute('data-next-worker')) === k) window.mkApplySkinToEl(c, hasAny(draft) ? draft : null);
      });
    }
    function commit() {
      setSkin(name, hasAny(draft) ? draft : null);
      window.mkRenderSkinPicker(host);
    }
    function persistLive() {
      livePreview();
      setSkin(name, hasAny(draft) ? draft : null, true);
    }
    function disableAutoPalette() {
      paletteRevision++;
      autoPaletteEnabled = false;
      var toggle = host.querySelector('.mk-auto-palette-toggle');
      if (toggle) toggle.checked = false;
    }
    function applySuggestedPaletteThenCommit() {
      if (!autoPaletteEnabled) { commit(); return; }
      var request = ++paletteRevision;
      suggestedPalette(draft).then(function(palette) {
        if(request!==paletteRevision) return;
        if (palette) {
          draft.num = palette.num;
          if(draft.face) draft.face.tint=rgbToHex(palette.num).slice(1);
          draft.numA = palette.na || '0.96';
          draft.txt = palette.txt;
        }
        commit();
      }).catch(function(){if(request===paletteRevision)commit();});
    }
    livePreview();

    host.querySelectorAll('.mk-skin-main-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        activeSkinSection = tab.dataset.skinSection;
        host.querySelectorAll('.mk-skin-main-tab').forEach(function(item) {
          var selected = item === tab;
          item.classList.toggle('is-active', selected);
          item.setAttribute('aria-selected', String(selected));
        });
        host.querySelectorAll('[data-skin-panel]').forEach(function(panel) {
          panel.classList.toggle('is-active', panel.dataset.skinPanel === activeSkinSection);
        });
      });
    });
    var autoToggle = host.querySelector('.mk-auto-palette-toggle');
    autoToggle.addEventListener('change', function() {
      autoPaletteEnabled = autoToggle.checked;
    });
    host.querySelector('.mk-auto-palette-now').addEventListener('click', function() {
      autoPaletteEnabled = true;
      autoToggle.checked = true;
      applySuggestedPaletteThenCommit();
    });

    host.querySelector('.mk-skin-art-open').addEventListener('click', function() {
      if (!window.MinkaSkinDraw || typeof window.MinkaSkinDraw.open !== 'function') {
        if (typeof _mkToast === 'function') _mkToast('Zīmēšanas rīks nav ielādēts', 'error');
        return;
      }
      var previewCard = Array.prototype.find.call(document.querySelectorAll('#grafiks-list .card[data-worker]'), function(item) {
        return normName(item.getAttribute('data-worker')) === normName(name);
      });
      window.MinkaSkinDraw.open({
        name: name,
        initialUrl: draft.t === 'art' ? artUrl(draft.id) : '',
        shiftHours: (previewCard && previewCard.querySelector('.mk-mid-hours') || {}).textContent || '',
        monthHours: (previewCard && previewCard.querySelector('.mk-mid-month-num') || {}).textContent || '0h',
        fatigue: (previewCard && (previewCard.querySelector('.fat-pct') || previewCard.querySelector('.mk-mid-meta-value')) || {}).textContent || '',
        role: previewCard && previewCard.classList.contains('card-rd') ? 'rd' : 'rg',
        numberColor: draft.num ? 'rgba(' + draft.num + ',' + (draft.numA != null ? draft.numA : 1) + ')' : (previewCard && previewCard.classList.contains('card-rd') ? '#ff5a55' : '#a78bfa'),
        textColor: draft.txt ? 'rgb(' + draft.txt + ')' : '#ffffff',
        onSave: async function(blob) {
          var artwork = await uploadArt(name, blob);
          draft=Object.assign({},draft,{t:'art',id:artwork.id}); delete draft.rgb;
          applySuggestedPaletteThenCommit();
        }
      });
    });

    function bundleSkin(p) {
      var skin=JSON.parse(JSON.stringify(p.bg));
      skin.face=JSON.parse(JSON.stringify(p.face));
      if(draft.face){skin.face.coffeeMode=draft.face.coffeeMode;skin.face.coffeeContrast=draft.face.coffeeContrast;skin.face.colors=draft.face.colors;skin.face.fullTintMode=draft.face.fullTintMode;skin.face.fullTintHue=draft.face.fullTintHue;skin.face.fullTintIntensity=draft.face.fullTintIntensity;skin.face.fullTintAuto=draft.face.fullTintAuto;skin.face.fullTintScheme=draft.face.fullTintScheme;}
      if(draft.face)Object.keys(draft.face.parts).forEach(function(key){skin.face.parts[key][3]=draft.face.parts[key][3];});
      skin.num=p.num;skin.numA=p.na;skin.em='0';
      if(p.depth===false)skin.depth=false;
      if(p.txt)skin.txt=p.txt;
      return skin;
    }
    function renderBundles(){
      if(!previewSource||!host.querySelector('[data-skin-panel="presets"].is-active'))return;
      host.querySelectorAll('.mk-skin-preset').forEach(function(button){
        if(button.hidden||button.dataset.built)return;
        button.dataset.built='1';
        var card=previewSource.cloneNode(true),stage=button.querySelector('.mk-preset-stage');
        card.removeAttribute('style');card.removeAttribute('id');card.removeAttribute('data-worker');
        card.querySelectorAll('[id],[data-worker]').forEach(function(el){el.removeAttribute('id');el.removeAttribute('data-worker');});
        card.querySelectorAll('.mk-card-addon,.mk-card-addon-surface,.mk-wf-art,.mk-wf-depth,.mk-wf-effects').forEach(function(el){el.remove();});
        card.querySelectorAll('button,input,select,textarea,a').forEach(function(el){var span=document.createElement('span');span.className=el.className;span.innerHTML=el.innerHTML;el.replaceWith(span);});
        card.classList.add('mk-preset-card');card.classList.remove('mk-skin-preview-real','wf-scaled-preview','wf-editing');
        stage.id='grafiks-list';stage.classList.add('grid-view');stage.appendChild(card);
        window.mkApplySkinToEl(card,bundleSkin(PRESETS[+button.dataset.preset]));
      });
      window.MinkaCardFaces.refreshPreview();
    }
    host.querySelectorAll('[data-preset-group]').forEach(function(button){
      button.addEventListener('click',function(){
        activePresetGroup=button.dataset.presetGroup;
        host.querySelectorAll('[data-preset-group]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button));});
        host.querySelectorAll('.mk-skin-preset').forEach(function(b){b.hidden=!presetInGroup(PRESETS[+b.dataset.preset],activePresetGroup);});
        renderBundles();
      });
    });
    host.querySelectorAll('.mk-skin-preset').forEach(function(b) {
      b.addEventListener('click',function(){draft=bundleSkin(PRESETS[+b.dataset.preset]);disableAutoPalette();commit();});
    });
    host.querySelector('[data-skin-section="presets"]').addEventListener('click',renderBundles);
    renderBundles();
    host.querySelectorAll('.mk-skin-grad-sw').forEach(function(b) {
      b.addEventListener('click', function() {
        draft.t = 'grad'; draft.id = b.dataset.grad; delete draft.rgb;
        applySuggestedPaletteThenCommit();
      });
    });
    host.querySelectorAll('.mk-bg-mode').forEach(function(tab) {
      tab.addEventListener('click', function() {
        activeBgMode = tab.dataset.bgMode;
        host.querySelectorAll('.mk-bg-mode').forEach(function(item) {
          var selected = item === tab;
          item.classList.toggle('is-active', selected);
          item.setAttribute('aria-selected', String(selected));
        });
        host.querySelectorAll('[data-bg-panel]').forEach(function(panel) {
          panel.classList.toggle('is-active', panel.dataset.bgPanel === activeBgMode);
        });
        if (activeBgMode === 'image') showImageGroup(activeImageGroup);
      });
    });
    function showImageGroup(index) {
      activeImageGroup = Math.max(0, Math.min(IMG_GROUPS.length, +index || 0));
      host.querySelectorAll('.mk-skin-category').forEach(function(button) {
        var selected = +button.dataset.group === activeImageGroup;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-selected', String(selected));
      });
      host.querySelectorAll('[data-group-panel]').forEach(function(panel) {
        var selected = +panel.dataset.groupPanel === activeImageGroup;
        panel.classList.toggle('is-active', selected);
        if (!selected) return;
        panel.querySelectorAll('.mk-skin-thumb[data-src]').forEach(function(thumb) {
          if (!thumb.style.backgroundImage) {
            var material=window.MinkaFindCardMaterial(thumb.dataset.skin);
            thumb.style.backgroundImage='url("'+thumb.dataset.src+'")'+(material&&material.background?','+material.background:'');
          }
        });
      });
    }
    host.querySelectorAll('.mk-skin-category').forEach(function(button) {
      button.addEventListener('click', function() {
        showImageGroup(button.dataset.group);
      });
    });
    host.querySelectorAll('.mk-skin-thumb[data-skin]').forEach(function(b) {
      b.addEventListener('click', function() {
        draft.t = 'img'; draft.id = b.dataset.skin; delete draft.rgb;
        applySuggestedPaletteThenCommit();
      });
    });
    host.querySelectorAll('.mk-skin-hue').forEach(function(b) {
      b.addEventListener('click', function() {
        draft.t = 'hue'; draft.rgb = b.dataset.rgb; delete draft.id;
        applySuggestedPaletteThenCommit();
      });
    });
    var bgInp = host.querySelector('.mk-skin-color');
    bgInp.addEventListener('input', function() { draft.t = 'hue'; draft.rgb = hexToRgb(bgInp.value); delete draft.id; persistLive(); });
    bgInp.addEventListener('change', applySuggestedPaletteThenCommit);
    var numInp = host.querySelector('.mk-num-color');
    numInp.addEventListener('input', function() { disableAutoPalette(); draft.num = hexToRgb(numInp.value); if(draft.face)draft.face.tint=numInp.value.slice(1); if (draft.numA == null) draft.numA = '0.95'; persistLive(); });
    numInp.addEventListener('change', commit);
    var aInp = host.querySelector('.mk-num-alpha');
    var aVal = host.querySelector('.mk-num-alpha-val');
    aInp.addEventListener('input', function() {
      disableAutoPalette();
      draft.numA = String((+aInp.value / 100).toFixed(2));
      if (!draft.num) draft.num = '167,139,250';
      aVal.textContent = aInp.value + '%';
      persistLive();
    });
    aInp.addEventListener('change', commit);
    var txtInp = host.querySelector('.mk-txt-color');
    txtInp.addEventListener('input', function() { disableAutoPalette(); draft.txt = hexToRgb(txtInp.value); persistLive(); });
    txtInp.addEventListener('change', commit);
    host.querySelector('.mk-txt-clear').addEventListener('click', function() { disableAutoPalette(); delete draft.txt; commit(); });
    var emShow = host.querySelector('.mk-emoji-show');
    var emOp = host.querySelector('.mk-emoji-op');
    var emOpVal = host.querySelector('.mk-emoji-op-val');
    emShow.addEventListener('change', function() {
      if (emShow.checked) { draft.em = String((+emOp.value / 100).toFixed(2)); }
      else { draft.em = '0'; }
      commit();
    });
    emOp.addEventListener('input', function() {
      draft.em = String((+emOp.value / 100).toFixed(2));
      emOpVal.textContent = emOp.value + '%';
      persistLive();
    });
    emOp.addEventListener('change', commit);
    host.querySelector('.mk-emoji-neg').addEventListener('change', function(ev) {
      if (ev.target.checked) delete draft.emn; else draft.emn = '0';
      commit();
    });
    host.querySelectorAll('.mk-skin-fx').forEach(function(b) {
      b.addEventListener('click', function() {
        if (b.dataset.fx) draft.fx = b.dataset.fx; else { delete draft.fx; delete draft.fxs; }
        commit();
      });
    });
    var fxSize = host.querySelector('.mk-fx-size');
    var fxSizeVal = host.querySelector('.mk-fx-size-val');
    fxSize.addEventListener('input', function() {
      if (!draft.fx) return;
      draft.fxs = String((+fxSize.value / 100).toFixed(2));
      fxSizeVal.textContent = fxSize.value + '%';
      persistLive();
    });
    fxSize.addEventListener('change', commit);
    host.querySelector('.mk-skin-clear').addEventListener('click', function() {
      draft = {};
      setSkin(name, null);
      window.mkRenderSkinPicker(host);
    });
    if (window.MinkaCardFaces) window.MinkaCardFaces.mount(host, {
      source: previewSizeSource,
      get: function() { return draft; },
      change: function(face) {
        if (face) {
          draft.face = face; draft.num=hexToRgb('#'+face.tint);
          host.querySelector('.mk-num-color').value='#'+face.tint;
        } else delete draft.face;
        disableAutoPalette(); persistLive();
      },
      depth: function(value){draft.depth=value;persistLive();},
      section: function(value) { activeSkinSection = value; },
      active: function() { return activeSkinSection; },
      rebuild: function() { window.mkRenderSkinPicker(host); }
    });
  };
})();
