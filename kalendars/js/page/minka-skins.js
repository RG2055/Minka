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
  // Kontrasts: the check panel stays open across editor re-renders; Remix and
  // Auto colours ask for one fixing pass on the next render.
  var contrastOpen = false, contrastFixPending = false;
  var paletteRevision = 0;
  function skinEsc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Name lettering (skin `nf`): a font and its effect on the first name only.
  // Fonts: kalendars/assets/fonts/name-styles (a face downloads only when a card uses it).
  var NAME_STYLES = [['', 'Parasts'], ['c', 'Hroms'], ['n', 'Neons'], ['z', 'Zelts'], ['r', '80-tie'], ['b', '3D bloks'],
    ['k', 'Komikss'], ['a', 'Plakāts'], ['d', 'Rakstīts'], ['l', 'Izkārtne'], ['p', 'Pikseļi'], ['e', 'Elegants']];
  // Lower case: every text on the card in that font (the name with the effect);
  // a capital letter keeps it to the name only (`nf:C`).
  var NAME_STYLE_RE = /^[cnzrbkadlpe]$/i;
  var IMG_GROUPS = [
    // Generated for the Focus kit (scripts/build-chrome-art.py): grain, chrome, holo foil.
    { label: 'Hroms un graudi',     ids: ['focus-ribbons','focus-ribbons-teal','focus-chrome','focus-holo','grain-grafits','grain-okeans','grain-ogles','grain-sfumato','grain-varss','grain-sudrabs','grain-terauds','grain-misins'] },
    { label: 'Abstrakti',          ids: ['abstract-color-wave','abstract-blue-liquid','abstract-pastel-orbit','abstract-sun-glow','abstract-neon-folds','abstract-white-flow','abstract-copper-web','abstract-paper-geometry','pix-color-waves','grain-kapu-ausma','grain-mints','grain-persiks','grain-citrons'] },
    { label: 'Aesthetic',           ids: ['user-holo-jellyfish','user-glitter-rainbow','user-pixel-clouds','user-golden-water','user-rainbow-beach','user-silver-ocean','user-glitch-dinosaurs','gnome-glass-chip-d','gnome-lcd-rainbow-d','gnome-pixels-d','gnome-tarka-d','open-aesthetic','aesthetic-bird','aesthetic-cyborg','aesthetic-face','aesthetic-flash','aesthetic-helmet','aesthetic-sunset','aesthetic-water','user-bubble','vapor-secret','vapor-floral'] },
    { label: 'Rozā un maigi',      ids: ['user-pink-cosmos','user-pink-liquid','user-pink-water','gnome-blobs-l','gnome-pills-d','open-pink','360','25','888','867','56','788','866','923','301','705','279','213','787','77','544','pix-water-drops','pix-pastel-flow','ilu-kalni'] },
    { label: 'Mīļi un jauki',      ids: ['gnome-balls-l','open-cute','146','798','219','790','248','user-butterfly','mili-ezis','mili-lapsens','mili-zakis','mili-calis','mili-vavere','mili-pucite','ilu-meness','ilu-ausma'] },
    { label: 'Spilgti',            ids: ['gnome-blendpills-d','gnome-drool-d','gnome-progress-d','open-bright','1080','1069','211','76','spilgti-majas','spilgti-lietussargi','spilgti-tulpes','gaisma-stari','gaisma-ella'] },
    { label: 'Ūdens un sniegs', ids: ['gnome-adwaita-d','gnome-sheet-d','gnome-symbolic-d','open-blue','1015','1036','1035','13','15','16','37','199','daba-sarma','lv-ziema','gaisma-zila-lode','ilu-ziemas-koki'] },
    { label: 'Zaļā daba',          ids: ['open-green','1018','1039','1043','10','11','17','18','28','128','190','user-daisy','user-bamboo-forest','daba-paparde','daba-sunas','daba-lase','lv-mezs'] },
    { label: 'Silti un saulaini',  ids: ['gnome-amber-d','gnome-fold-l','gnome-pixel-pusher-d','gnome-glass-stripes-l','open-warm','1016','1057','110','19','46','164','user-autumn-leaves','daba-lapa','daba-sarmas-lapa','lv-kapas','gaisma-stikla-lode','gaisma-bokeh'] },
    { label: 'Tumši un mistiski',  ids: ['gnome-morphogenesis-d','gnome-tubes-d','open-dark','1019','1022','12','29','55','83','95','184','pix-aurora-sky','gaisma-ledus'] },
    { label: 'Pilsēta', ids: ['gnome-curvaturingster-d','gnome-map-d','1029','1033','lv-riga-nakti','lv-vecriga','pils-jugends-seja','pils-jugends-fasade','pils-balta-forma','pils-betona-loki','pils-apla-logs','pils-zelta-kupols','pils-vecriga-augsa','pils-nakts-gaismas'] },
    { label: 'Melnbalti',          ids: ['gnome-curvy-d','open-bw','47','58','daba-pienene','lv-eglu-migla','mb-balkoni','mb-vartu-klusums','mb-spirale','mb-ziedi'] },
    { label: 'Barbie rozā',        ids: ['gnome-dithered-sun-l','open-barbie','bb2','bb3','bb4','bd1','bd2','bd3','grain-roze','grain-zemene','grain-konfekte','grain-flamingo'] },
    // Real stone photographs (Pixabay), the slabs for the Akmens layout.
    { label: 'Akmens',             ids: ['akmens-travertins','akmens-slaneklis','akmens-granits','akmens-smilsakmens','akmens-smilts','akmens-iezis'] },
    { label: 'Dither',             ids: ['dither-tors','dither-lode','dither-kapas','dither-lentes','dither-rezgis','dither-signals','dither-papirs','art-partenons','art-kolonnas','art-piramidas','art-sfinksa','art-herakls','art-atena','art-kariatides','art-apolons','art-domatajs','art-konkordija','art-herkuls'] },
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
    'gnome-vnc-d': 'Vienkrāsains — tumšs', 'gnome-vnc-l': 'Vienkrāsains — gaišs',
    'vapor-secret': 'Secret_ logs', 'vapor-floral': 'Floral grīda',
    'focus-ribbons': 'Zilās lentes', 'focus-ribbons-teal': 'Tirkīza lentes', 'focus-chrome': 'Hroma formas', 'focus-holo': 'Holo svītras',
    'dither-tors': 'Dither tors', 'dither-lode': 'Dither lode', 'dither-kapas': 'Dither kāpas',
    'dither-lentes': 'Dither lentes', 'dither-rezgis': 'Dither režģis', 'dither-signals': 'Dither signāls', 'dither-papirs': 'Dither papīrs',
    'daba-paparde': 'Papardes pumpurs', 'daba-sunas': 'Rasa sūnās', 'daba-lase': 'Lāse uz lapas',
    'daba-lapa': 'Rudens lapa', 'daba-pienene': 'Pienene', 'daba-sarma': 'Sarmotas lapas', 'daba-sarmas-lapa': 'Sarmas lapa',
    'lv-riga-nakti': 'Melngalvju nams', 'lv-vecriga': 'Pētera baznīca', 'lv-kapas': 'Kāpas', 'lv-mezs': 'Mežs',
    'lv-eglu-migla': 'Egles miglā', 'lv-ziema': 'Sarmots koks',
    'gaisma-stikla-lode': 'Stikla lode', 'gaisma-zila-lode': 'Zilā lode', 'gaisma-bokeh': 'Siltās gaismas',
    'gaisma-stari': 'Gaismas stari', 'gaisma-ledus': 'Ledus stikls', 'gaisma-ella': 'Eļļas burbuļi',
    'ilu-meness': 'Mēness jūrā', 'ilu-ziemas-koki': 'Ziemas koki', 'ilu-kalni': 'Rožainie kalni', 'ilu-ausma': 'Zaļā ausma',
    'grain-kapu-ausma': 'Kāpu ausma', 'grain-mints': 'Piparmētru migla', 'grain-persiks': 'Persiku migla', 'grain-citrons': 'Citronu gaisma', 'grain-grafits': 'Grafīts', 'grain-varss': 'Varš', 'grain-sudrabs': 'Sudrabs', 'grain-terauds': 'Tērauds', 'grain-misins': 'Misiņš', 'grain-roze': 'Rozā', 'grain-zemene': 'Zemene', 'grain-konfekte': 'Konfekte', 'grain-flamingo': 'Flamingo', 'grain-okeans': 'Okeāna dzīles', 'grain-ogles': 'Ogles', 'grain-sfumato': 'Sfumato', 'pils-jugends-seja': 'Jūgendstila seja', 'pils-jugends-fasade': 'Jūgendstila fasāde', 'pils-balta-forma': 'Baltā forma', 'pils-betona-loki': 'Betona loki', 'pils-apla-logs': 'Apaļais logs', 'pils-zelta-kupols': 'Zelta kupols', 'pils-vecriga-augsa': 'Vecrīga no augšas', 'pils-nakts-gaismas': 'Nakts gaismas', 'mb-balkoni': 'Balkoni', 'mb-vartu-klusums': 'Vārti ūdenī', 'mb-spirale': 'Spirāle', 'mb-ziedi': 'Baltie ziedi', 'mili-ezis': 'Ezis', 'mili-lapsens': 'Lapsēns', 'mili-zakis': 'Zaķēns', 'mili-calis': 'Cālis', 'mili-vavere': 'Vāvere', 'mili-pucite': 'Pūcēns', 'spilgti-majas': 'Krāsainās mājas', 'spilgti-lietussargi': 'Lietussargi', 'spilgti-tulpes': 'Tulpes',
    'akmens-travertins': 'Travertīns', 'akmens-slaneklis': 'Slāneklis', 'akmens-granits': 'Granīts', 'akmens-smilsakmens': 'Smilšakmens',
    'akmens-smilts': 'Smilšu akmens', 'akmens-iezis': 'Iezis',
    'art-partenons': 'Partenons', 'art-kolonnas': 'Jonu kolonna', 'art-piramidas': 'Piramīda', 'art-sfinksa': 'Sfinksa', 'art-herakls': 'Hērakls', 'art-atena': 'Atēna', 'art-kariatides': 'Kariatīdes', 'art-apolons': 'Apolons', 'art-domatajs': 'Domātājs', 'art-konkordija': 'Konkordijas templis', 'art-herkuls': 'Hērakls naktī'
  };
  var MATERIALS = window.MinkaCardMaterials || [];
  IMG_GROUPS.unshift({label:'Dzīvā daba', ids:MATERIALS.filter(function(m){return m.kind==='depth';}).map(function(m){return m.id;})});
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
  // Dither examples: real photos with the per-card effect (fine Bayer / palette).
  [['Zilā tinte','58','ditherpaper','2554a0'],['Kaķis 1-bit','cat-06','dither','eceae4'],['Zaļā tinte','1018','ditherpaper','305c28'],
   ['Nakts okeāns','user-silver-ocean','dither','64d2ff'],['Zemeņu rastrs','1080','dithercolor','ffe4eb'],['Saulriets','110','dither','f5b73f'],
   ['Mols','47','ditherpaper','141414'],['Aurora','pix-aurora-sky','dithercolor','c8f1ff']].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset('classic');
    face.tint=p[3];face.parts.hours=[50,45,112,1];
    face.parts.name=[50,73,80,1];face.parts.coffee=[22,15,85,1];face.parts.emoji=[81,15,90,1];
    face.parts.month=[81,85,65,0];face.parts.fatigue=[20,85,65,0];face.parts.remaining=[50,92,65,1];
    face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    PRESETS.push({label:p[0],group:'dither',isNew:true,bg:{t:'img',id:p[1]},num:hexToRgb('#'+p[3]),na:'1',txt:p[2]==='ditherpaper'?'20,20,20':'241,240,234',fx:p[2],face:face,depth:false,sw:'url(data/skins/skin-'+p[1]+'.webp)'});
  });
  // Dither sets: pre-dithered backgrounds (scripts/build-dither-skins.py) on the Dither face.
  [['Tors','tors','eceae4'],['Lode','lode','64d2ff'],['Kāpas','kapas','1fe091'],['Lentes','lentes','f5b73f'],
   ['Režģis','rezgis','23cdcf'],['Signāls','signals','ff5c5c'],['Papīrs','papirs','141414','ditherpaper']].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset('dither');
    face.tint=p[2];face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    // Light paper art gets the paper look: light chips, dark text (dark chips on it hid the values).
    PRESETS.push({label:'Dither · '+p[0],group:'dither',isNew:true,bg:{t:'img',id:'dither-'+p[1]},num:hexToRgb('#'+p[2]),na:'1',txt:p[3]?'20,20,20':'241,240,234',fx:p[3],face:face,depth:false,sw:'url(data/skins/skin-dither-'+p[1]+'.webp)'});
  });
  // Dither art: pre-dithered prints (scripts/build-dither-art.py) on the Classic face;
  // the Dither face would dither them a second time. The number takes the ink: [label, id, ink, paper].
  [['Partenons','partenons','1730b8','d6e1ff'],['Jonu kolonna','kolonnas','1730b8','d6e1ff'],['Piramīda','piramidas','121212','efe9dc'],['Sfinksa','sfinksa','7a3418','f2e3c6'],['Hērakls','herakls','0d0f0e','a6f0cc'],['Atēna','atena','0b5cbf','e3f2ff'],['Kariatīdes','kariatides','c4410f','ffe8d6'],['Apolons','apolons','f0be52','0d0c0a'],['Domātājs','domatajs','121212','efe9dc'],['Konkordijas templis','konkordija','2c4a1c','e8edd8'],['Hērakls naktī','herkuls','ff7a3d','0c0806']].forEach(function(p){
    // The name and small text stay neutral (near black on light paper, cream on dark) and
    // every chip gets a solid plate of the paper's kind: the dots never run under text.
    var face=window.MinkaCardFaceModel.preset('classic'), dark=parseInt(p[3].slice(0,2),16)<128;
    face.tint=p[2];
    window.MinkaCardFaceModel.plateParts.forEach(function(k){face.plates[k]=dark?1:4;});
    PRESETS.push({label:p[0],group:'dithart',isNew:true,bg:{t:'img',id:'art-'+p[1]},num:hexToRgb('#'+p[2]),na:'1',txt:dark?'244,242,236':'20,20,22',face:face,depth:false,sw:'url(data/skins/skin-art-'+p[1]+'.webp)'});
  });
  // The newer layouts, each on a picture that suits it: [label, face, picture, number, text, depth].
  [['Biļete','ticket','','196,65,15','28,24,22'],['Biļete · Lapsēns','ticket','mili-lapsens','255,214,170','250,246,240'],
   ['Žurnāla vāks','cover','photo-fox','244,242,236','250,248,244',1],['Vāks · Magnolija','cover','photo-magnolia','246,214,222','252,246,248',1,{hours:[84,40,44,1],coffee:[87,60,54,1]}],
   ['Pulkstenis','analog','', '255,159,10','244,244,246'],
   ['Akmens · Travertīns','stone','akmens-travertins','70,58,46','64,52,40'],['Akmens · Slāneklis','stone','akmens-slaneklis','228,224,216','232,228,220'],
   ['Akmens · Smilšakmens','stone','akmens-smilsakmens','255,240,224','255,244,232']].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset(p[1]);
    // A picture whose subject reaches the number's spot moves the number aside.
    if(p[6])Object.keys(p[6]).forEach(function(k){face.parts[k]=p[6][k].slice();});
    face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    face.tint=p[3].split(',').map(function(v){return ('0'+(+v).toString(16)).slice(-2);}).join('');
    // Dark text on a light picture: the chips get light plates so their values read.
    if(p[4].split(',').reduce(function(a,v){return a+(+v);},0)<300)window.MinkaCardFaceModel.plateParts.forEach(function(k){face.plates[k]=4;});
    var material=p[2]&&window.MinkaFindCardMaterial(p[2]);
    // No picture: the ticket is cream paper, the watch a dark dial.
    var paper=p[1]==='ticket'?'242,236,224':'10,10,12';
    if(!p[2]&&p[1]==='ticket'){window.MinkaCardFaceModel.plateParts.forEach(function(k){face.plates[k]=2;});face.plates.emoji=1;}
    var sw=p[2]?'url('+(material?material.path:'data/skins/skin-'+p[2]+'.webp')+')'+(material&&material.background?','+material.background:''):'rgb('+paper+')';
    PRESETS.push({label:p[0],group:'layouts',isNew:true,keepLayout:true,keepParts:true,bg:p[2]?{t:'img',id:p[2]}:{t:'hue',rgb:paper},num:p[3],na:'1',txt:p[4],face:face,depth:p[5]?undefined:false,foreground:p[5]&&material?material.path:null,sw:sw});
  });
  // Plakāts: collector-card look — the picture in a window, a big name below it.
  [['Plakāts · Seja','aesthetic-face','f67a18'],['Plakāts · Kaķis','cat-06','f67a18'],['Plakāts · Ķivere','aesthetic-helmet','64d2ff'],['Plakāts · Kalni','1036','f5b73f']].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset('classic');
    face.tint='f4f2ec';
    // Every element has its own spot (the person's own shown/hidden choice is kept):
    // picture window above y≈65, name and chips on the charcoal below it.
    face.parts.hours=[74,26,92,1];face.parts.name=[30,74,92,1];face.parts.coffee=[16,13,78,1];face.parts.moon=[57,12,68,1];
    face.parts.emoji=[85,53,78,1];face.parts.initials=[16,53,78,0];face.parts.clock=[36,12,72,0];
    face.parts.month=[84,72,66,1];face.parts.remaining=[84,87,66,1];face.parts.fatigue=[52,88,62,0];
    PRESETS.push({label:p[0],group:'poster',isNew:true,bg:{t:'img',id:p[1]},num:hexToRgb('#'+p[2]),na:'1',txt:'244,242,236',fx:'poster',face:face,depth:false,sw:'url(data/skins/skin-'+p[1]+'.webp)'});
  });
  // Fokuss / Puse: only on pictures where the lens or the split really looks good.
  [['Fokuss · Seja','aesthetic-face','focus','50,40'],['Fokuss · Kaķis','open-cat','focus',''],['Puse · Kaķis','cat-06','split','52,50'],['Puse · Saulriets','aesthetic-sunset','split','']].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset('classic');
    face.tint='f4f2ec';face.parts.hours=[50,45,112,1];
    face.parts.name=[50,73,80,1];face.parts.coffee=[22,15,85,1];face.parts.emoji=[81,15,90,1];
    face.parts.month=[81,85,65,0];face.parts.fatigue=[20,85,65,0];face.parts.remaining=[50,92,65,1];
    face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    PRESETS.push({label:p[0],group:'fx',isNew:true,bg:{t:'img',id:p[1]},num:'244,242,236',na:'1',txt:'244,242,236',fx:p[2],fl:p[3],face:face,depth:false,sw:'url(data/skins/skin-'+p[1]+'.webp)'});
  });
  /* Efekti: whole looks built around one picture effect, each on a picture that
     suits it (colour tiles on colourful photos, line and dot screens on a clear
     subject). The numeral takes a finish that stands off the pattern under it. */
  [['Kluči · Margrietiņa','user-daisy','bricks','ffffff',2,'1.55'],['Mozaīka · Zemenes','1080','mosaic','ffffff',2,'1.55'],
   ['LED · Kiborgs','aesthetic-cyborg','led','c4ff5a',5,'1.55'],['Termināls','aesthetic-face','ascii','7be6a0',5,'1.55'],
   ['Līnijas · Putns','aesthetic-bird','lines','3a4bff',2,'1.55'],['Kluči · Kosmejas','user-pink-cosmos','bricks','ffffff',2,'1.45'],
   ['CMYK · Kaķis','cat-06','cmyk','141414',2,'1.55'],['Siltums · Ķivere','aesthetic-helmet','heatmap','ffffff',2,'1.55'],
   ['Riso · Saulriets','aesthetic-sunset','riso','2554a0',2,'1.55'],['Rastrs · Seja','aesthetic-face','halftone','eceae4',0,'1.55'],
   ['Kontūra · Putns','aesthetic-bird','outline','141414',2,'1.55']].forEach(function(p){
    var face=window.MinkaCardFaceModel.preset('classic'), light=/^(cmyk|riso|outline)$/.test(p[2]);
    face.tint=p[3];face.finish=p[4];face.parts.hours=[50,45,112,1];
    face.parts.name=[50,73,80,1];face.parts.coffee=[22,15,85,1];face.parts.emoji=[81,15,90,1];
    face.parts.month=[81,85,65,0];face.parts.fatigue=[20,85,65,0];face.parts.remaining=[50,92,65,1];
    face.parts.moon=window.MinkaCardFaceModel.symbolPlacement(face.parts,face.face);
    PRESETS.push({label:p[0],group:'fx',isNew:true,bg:{t:'img',id:p[1]},num:hexToRgb('#'+p[3]),na:'1',txt:light?'20,20,20':'244,242,236',fx:p[2],fxs:p[5],face:face,depth:false,sw:'url(data/skins/skin-'+p[1]+'.webp)'});
  });
  /* Vaporwave: whole looks — picture, layout, colours, the analog shift timer and
     the decoration — made to go together. Their layout is kept as designed. */
  (function(){
    function vapor(label,bg,tint,finish,txt,tm,dialColor,addons,parts){
      var face=window.MinkaCardFaceModel.preset('classic');
      face.tint=tint;face.finish=finish;
      Object.keys(parts).forEach(function(k){face.parts[k]=parts[k];});
      face.colors.remaining=dialColor;
      PRESETS.push({label:label,group:'vapor',isNew:true,bg:{t:'img',id:bg},num:hexToRgb('#'+tint),na:'1',txt:txt,face:face,depth:false,tm:tm,addons:addons,keepParts:true,sw:'url(data/skins/skin-'+bg+'.webp)'});
    }
    var hide=[50,50,100,0];
    vapor('Secret_','vapor-secret','ffffff',2,'255,255,255','d13','3a2bf2',
      [{id:'object-david-vapor',scale:1,side:'left',x:6,y:-4}],
      {hours:[76,20,86,1],name:[66,90,70,1],remaining:[82,62,90,1],coffee:[14,11,72,1],moon:[58,9,56,0],month:hide.slice(),fatigue:hide.slice(),emoji:hide.slice(),initials:hide.slice(),clock:hide.slice()});
    vapor('Floral','vapor-floral','4fe0b0',2,'255,255,255','b21','4fe0b0',
      [{id:'object-david',scale:1.05,side:'left',x:4,y:-2}],
      {hours:[80,46,74,1],name:[66,91,68,1],remaining:[82,72,84,1],coffee:[14,11,72,1],moon:[58,9,56,0],month:hide.slice(),fatigue:hide.slice(),emoji:hide.slice(),initials:hide.slice(),clock:hide.slice()});
  })();
  /* Show the finest first: photo compositions, then posters and picture effects;
     the plain number looks come last. (Sorted once, before any button exists.) */
  (function(){
    var rank={layouts:-3,dithart:-2,vapor:-1,wildlife:0,botanical:0,ocean:0,fx:1,landscape:1,poster:2,dither:3,collection:4,numbers:5};
    PRESETS=PRESETS.map(function(p,i){return [p,i];}).sort(function(a,b){return ((rank[a[0].group]==null?4:rank[a[0].group])-(rank[b[0].group]==null?4:rank[b[0].group]))||a[1]-b[1];}).map(function(x){return x[0];});
  })();
  var DITHER_INKS=[['eceae4','Balta'],['64d2ff','Ledus'],['23cdcf','Ciāna'],['1fe091','Zaļa'],['f5b73f','Dzintars'],['ff8a5c','Oranža'],['ff5c5c','Sarkana'],['2554a0','Tinte'],['141414','Melna']];
  var PRESET_GROUPS=[['all','Visi'],['new','Jaunumi'],['dithart','Dither māksla'],['layouts','Jauni izkārtojumi'],['vapor','Vaporwave'],['fx','Efekti'],['poster','Plakāti'],['dither','Dither'],['wildlife','Dzīvnieki'],['botanical','Ziedi un augi'],['ocean','Ūdens'],['landscape','Ainavas un nakts'],['numbers','Ciparu efekti'],['collection','Citi foto']];
  function presetInGroup(p,group){return group==='all'||(group==='new'?p.isNew:p.group===group);}

  /* Every card render asks for its skin: parse the stored map once per change,
     not once per card (it is ~30 KB of JSON). Callers treat it as read-only;
     storeSkinLocal mutates it and saves right away, which refreshes the cache. */
  var loadCache = { raw: null, value: null };
  function loadAll() {
    var raw = null;
    try { raw = localStorage.getItem(KEY) || '{}'; } catch (e) { return {}; }
    if (raw === loadCache.raw && loadCache.value) return loadCache.value;
    var value = parseAll(raw);
    loadCache = { raw: raw, value: value };
    return value;
  }
  function parseAll(raw) {
    try {
      var stored = JSON.parse(raw) || {};
      var merged = {};
      var migrated = false;
      Object.keys(stored).forEach(function(k){
        var skin = stored[k];
        if (skin && skin.t === 'grad' && SCENIC_IDS[skin.id]) {
          skin = Object.assign({}, skin, { t: 'img' });
          migrated = true;
        }
        if (window.MINKA_APP === 'rad') skin = radUndither(skin);
        if (!skin) return;
        merged[normName(k)] = skin;
      });
      if (migrated) localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    } catch (e) { return {}; }
  }
  function saveAll(o) {
    try { var raw = JSON.stringify(o); localStorage.setItem(KEY, raw); loadCache = { raw: raw, value: o }; }
    catch (e) { loadCache = { raw: null, value: null }; }
  }
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
    var path = 'data/skins/skin-' + cleanId + '.webp' + (/^aesthetic-/.test(cleanId) ? '?v=2' : /^dither-rtg-/.test(cleanId) ? '?v=20260926h5' : /^(focus|vapor)-/.test(cleanId) ? '?v=20260927f2' : /^art-/.test(cleanId) ? '?v=20261010c' : '');
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
  /* ── Saskaņotā palete (Auto krāsas, Pieskaņot, Remix) ──────────────────────
     Viens mazs attēla paraugs (48×48, centrā apgriezts kā background-size:cover)
     dod visu kartītes krāsu komplektu: akcentu, tekstu, efekta tinti tumšam un
     papīra fonam, kontrasta krāsu dekoram un ietvara metālu. Krāsas izvēlas pēc
     gaišuma (relatīvā luminance), nevis pēc HSL L, tāpēc dzeltens un zils
     akcents izskatās vienlīdz spilgti. Viss vienreiz uz attēlu, kešā. */
  function hueDist(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  function hexOf(rgb) { return rgb.map(function(v) { return clampByte(v).toString(16).padStart(2, '0'); }).join(''); }
  // Tonis ar vajadzīgo gaišumu: HSL L meklē pēc relatīvās luminances.
  function toneAt(h, s, lumTarget) {
    var lo = 3, hi = 97;
    for (var k = 0; k < 14; k++) {
      var mid = (lo + hi) / 2;
      if (relLuminance(hslToRgb(h, s, mid)) < lumTarget) lo = mid; else hi = mid;
    }
    return hslToRgb(h, s, (lo + hi) / 2);
  }
  function analyzePixels(d) {
    var bins = new Float64Array(36), sumR = new Float64Array(36), sumG = new Float64Array(36), sumB = new Float64Array(36);
    var count = d.length >> 2, lumSum = 0, chromaSum = 0, warmSum = 0, meanR = 0, meanG = 0, meanB = 0;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      meanR += r; meanG += g; meanB += b;
      lumSum += .2126 * SRGB_LINEAR[r] + .7152 * SRGB_LINEAR[g] + .0722 * SRGB_LINEAR[b];
      var max = Math.max(r, g, b), min = Math.min(r, g, b), c = (max - min) / 255;
      chromaSum += c; warmSum += (r - b) / 255;
      if (c < .1) continue;
      var h = max === r ? (g - b) / (max - min) + (g < b ? 6 : 0) : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
      var l = (max + min) / 510, w = c * (1 - Math.min(.9, Math.abs(l - .5) * 1.2));
      var bin = Math.floor(h * 6) % 36;
      bins[bin] += w; sumR[bin] += r * w; sumG[bin] += g * w; sumB[bin] += b * w;
    }
    count = Math.max(1, count);
    var smooth = new Float64Array(36), total = 0;
    for (var s = 0; s < 36; s++) { smooth[s] = bins[(s + 35) % 36] * .5 + bins[s] + bins[(s + 1) % 36] * .5; total += bins[s]; }
    function peakColor(at) {
      var w = 0, rr = 0, gg = 0, bb = 0;
      [-1, 0, 1].forEach(function(o) { var k = (at + o + 36) % 36; w += bins[k]; rr += sumR[k]; gg += sumG[k]; bb += sumB[k]; });
      return w ? [rr / w, gg / w, bb / w] : null;
    }
    var p1 = 0;
    for (var a = 1; a < 36; a++) if (smooth[a] > smooth[p1]) p1 = a;
    var c1 = total ? peakColor(p1) : null;
    var hsl1 = c1 ? rgbToHsl(c1) : { h: 205, s: 0, l: 50 };
    var p2 = -1;
    for (var q = 0; q < 36; q++) {
      if (hueDist(q * 10 + 5, hsl1.h) < 60 || smooth[q] < smooth[p1] * .18) continue;
      if (p2 < 0 || smooth[q] > smooth[p2]) p2 = q;
    }
    var c2 = p2 >= 0 ? peakColor(p2) : null;
    return {
      hue: hsl1.h, sat: hsl1.s, source: c1 || [meanR / count, meanG / count, meanB / count],
      hue2: c2 ? rgbToHsl(c2).h : null,
      lum: lumSum / count, chroma: chromaSum / count, warm: warmSum / count
    };
  }
  var METAL_OPTIONS = {
    grey: { light: [0, 7], dark: [11, 2] },
    warm: { light: [4, 10, 3], dark: [6, 1] },
    cool: { light: [0, 7], dark: [8, 9] },
    neutral: { light: [0, 10], dark: [5, 11] }
  };
  function harmonyFrom(info) {
    var grey = info.chroma < .07 || info.sat < 12;
    var h = info.hue, s = Math.max(45, Math.min(85, info.sat));
    var accent = grey ? toneAt(h, 10, .6) : toneAt(h, s, .52);
    var text = toneAt(h, grey ? 5 : Math.min(22, s * .3), .86);
    var ink = grey ? [236, 234, 228] : toneAt(h, Math.max(62, s), .42);
    var inkPaper = grey ? [26, 26, 28] : toneAt(h, Math.max(55, s), .045);
    // Dekoram: otra attēla krāsa, ja tā ir; citādi silts pret vēsu (koraļļi uz zila, ledus uz silta).
    var popHue = info.hue2 != null ? info.hue2 : grey ? null : (h >= 150 && h <= 290 ? 8 : 198);
    var pop = popHue == null ? '' : hexOf(toneAt(popHue, 82, .36));
    var family = grey ? 'grey' : info.warm > .08 ? 'warm' : info.warm < -.04 ? 'cool' : 'neutral';
    var metals = METAL_OPTIONS[family][info.lum > .3 ? 'light' : 'dark'];
    return {
      // Saderīgi ar veco API (kafijas tonis, pilnais tonis): num / txt / na / source.
      num: accent.join(','), txt: text.join(','), na: '1', source: info.source.map(clampByte).join(','),
      accent: hexOf(accent), ink: ink, inkPaper: inkPaper, pop: pop, metals: metals,
      hue: Math.round(h) % 360, lum: info.lum, grey: grey, info: info
    };
  }
  /* Four colourings that suit the background, as examples to pick from: the
     picture's own, its second colour (or the opposite one), and the two
     neighbours. A grey picture gets four calm colours instead. */
  function paletteVariants(pal) {
    var info = pal && pal.info; if (!info) return pal ? [pal] : [];
    var tint = function (hue, sat) { return harmonyFrom(Object.assign({}, info, { hue: ((hue % 360) + 360) % 360, sat: sat || Math.max(55, info.sat), chroma: Math.max(.2, info.chroma) })); };
    if (pal.grey) return [pal, tint(212, 58), tint(24, 64), tint(158, 52)];
    return [pal, info.hue2 != null && Math.abs(((info.hue2 - info.hue + 540) % 360) - 180) < 150 ? tint(info.hue2) : tint(info.hue + 180), tint(info.hue + 32), tint(info.hue - 32)];
  }
  function harmonyFromColors(list) {
    var d = new Uint8ClampedArray(list.length * 4);
    list.forEach(function(c, i) { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; });
    return harmonyFrom(analyzePixels(d));
  }
  var FALLBACK_HARMONY = null;
  function fallbackHarmony() { return FALLBACK_HARMONY || (FALLBACK_HARMONY = harmonyFromColors([[40, 70, 110], [100, 170, 220], [20, 30, 44]])); }
  function sampleImagePalette(url) {
    if (paletteCache[url]) return paletteCache[url];
    paletteCache[url] = new Promise(function(resolve) {
      var image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = function() {
        try {
          var side = 48, w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
          var crop = Math.min(w, h);
          var canvas = document.createElement('canvas');
          canvas.width = side; canvas.height = side;
          var ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
          ctx.drawImage(image, (w - crop) / 2, (h - crop) / 2, crop, crop, 0, 0, side, side);
          resolve(harmonyFrom(analyzePixels(ctx.getImageData(0, 0, side, side).data)));
        } catch (_error) { delete paletteCache[url]; resolve(fallbackHarmony()); }
      };
      image.onerror = function() { delete paletteCache[url]; resolve(fallbackHarmony()); };
      image.src = url;
    });
    return paletteCache[url];
  }
  function gradStops(id) {
    return (String(GRAD_MAP[id] || '').match(/#[0-9a-f]{6}/ig) || []).map(function(hex) {
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    });
  }
  function suggestedPalette(skin) {
    if (!skin) return Promise.resolve(fallbackHarmony());
    if (skin.t === 'grad') { var stops = gradStops(skin.id); return Promise.resolve(stops.length ? harmonyFromColors(stops) : fallbackHarmony()); }
    if (skin.t === 'hue' && parseRgbTriplet(skin.rgb)) return Promise.resolve(harmonyFromColors([parseRgbTriplet(skin.rgb)]));
    if (skin.t === 'img' && skin.id) return sampleImagePalette(stockSkinUrl(skin.id));
    if (skin.t === 'art' && skin.id && artUrl(skin.id)) return sampleImagePalette(artUrl(skin.id));
    if (skin.t === 'emo' && skin.id) { var ps = emoSpec(skin.id); if (ps) return emoPaint(ps).then(sampleImagePalette, function () { return fallbackHarmony(); }); }
    return Promise.resolve(fallbackHarmony());
  }
  // Share the existing small-image palette sampler with contrast controls.
  window.mkSuggestSkinPalette=suggestedPalette;

  /* Uzliek paleti izskatam. Efekta tinte, ko cilvēks pats izvēlējies no
     gatavajām tintēm, paliek (ja vien force), jo tā ir apzināta izvēle. */
  var INK_FX = /^(dither|ditherpaper|halftone|duotone|ascii|poster|lines|led|riso|threshold)$/;
  function isCuratedInk(num) { return DITHER_INKS.some(function(c) { return hexToRgb('#' + c[0]) === String(num || ''); }); }
  // Paper-ground effects want a deep ink, the rest a light one.
  function effectInk(fx, pal) { return fx === 'ditherpaper' || fx === 'threshold' ? pal.inkPaper : pal.ink; }
  function harmonizeSkin(skin, pal, opts) {
    opts = opts || {};
    var fx = skin.fx || '', inked = INK_FX.test(fx);
    var keepInk = inked && !opts.force && isCuratedInk(skin.num);
    var ink = inked ? (keepInk ? parseRgbTriplet(skin.num) : effectInk(fx, pal)) : null;
    // Cipara krāsa bez efekta, efekta tinte ar to (tā ir tas pats "num" lauks).
    if (ink) skin.num = ink.join(',');
    else if (!opts.keepAccent) skin.num = pal.num;
    skin.numA = '1';
    skin.txt = fx === 'ditherpaper' ? '20,20,20' : pal.txt;
    var f = skin.face;
    if (f) {
      if (f.face === 'dither' && ink) f.tint = hexOf(ink);
      else if (!opts.keepAccent) f.tint = pal.accent;
      var moon = f.colors && f.colors.moon;
      f.colors = {};
      if (moon) f.colors.moon = moon;
      if (!opts.keepAccent) f.metal = opts.metal != null ? opts.metal : pal.metals[0];
      f.fullTintHue = pal.hue;
    }
    return skin;
  }
  // Dekoram ar savu tintētu efektu — kontrasta krāsa; bez tā krāsa nav vajadzīga.
  function harmonizeAddon(addon, pal) {
    if (!addon || !addon.id) return addon;
    if (!addon.fx || addon.fx === 'none' || addon.fx === 'xray') { delete addon.color; return addon; }
    if (pal.pop) addon.color = pal.pop; else delete addon.color;
    return addon;
  }

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

  // Every colleague's skin (read-only use, e.g. warming caches in idle time).
  window.mkGetAllSkins = function() { return loadAll(); };
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
  /* /rad no longer gives residents a dithered radiology picture: a look saved while that
     was the default (its dither-rtg picture was never a choice of its own) reads as the
     plain card, and the person's own choices on it stay (emoji, text effect, bed …). */
  function radUndither(skin) {
    if (!skin || skin.t !== 'img' || !/^dither-rtg-/.test(String(skin.id || ''))) return skin;
    var s = JSON.parse(JSON.stringify(skin));
    ['t', 'id', 'face', 'num', 'na', 'txt', 'depth', 'radDefault'].forEach(function (k) { delete s[k]; });
    return hasAny(s) ? s : null;
  }
  /* ── Emoji as the background ──────────────────────────────────────────────
     skin.t 'emo', id "<layout><style>[m]-<code points>": layout b (one, big), c (in the
     corner, cut by the edge) or p (a pattern); style 0 Fluent, 1 the system's emoji,
     2 black, 3 white; "m" = it follows the person's own emoji. The picture is drawn once
     per emoji and look into a small canvas (webp) and then is an ordinary background:
     the picture effects (Dither, Rastrs …) work on it like on a photo. */
  // …or "x<id>": a 3D emoji picture (js/emoji3d.js), e.g. "p2-xr07".
  var EMO_RE = /^[bcp][0-3]m?-(?:[0-9a-f]{2,6}(\.[0-9a-f]{2,6}){0,9}|x[rb]\d{2})$/;
  var emoReady = Object.create(null), emoPending = Object.create(null);
  function emoCodes(e) { return Array.from(String(e || '')).map(function (c) { return c.codePointAt(0).toString(16); }).join('.'); }
  function emoFromCodes(s) { try { return String.fromCodePoint.apply(null, String(s).split('.').map(function (h) { return parseInt(h, 16); })); } catch (_e) { return ''; } }
  // A background's tail: a 3D emoji as its picture's id ("xr29"), any other as its code points.
  function emoTail(e) { var id = window.MinkaEmoji3D && window.MinkaEmoji3D.decode(e); return id ? 'x' + id : emoCodes(e); }
  function emoSpec(id, owner) {
    var m = /^([bcp])([0-3])(m?)-(.+)$/.exec(String(id || '')); if (!m || !EMO_RE.test(id)) return null;
    // "Mans emoji" follows the person's emoji, a 3D one as its picture
    var mine = m[3] && owner && window.MinkaEmoji && window.MinkaEmoji.get ? window.MinkaEmoji.get(owner) : '';
    var mine3d = mine && window.MinkaEmoji3D && window.MinkaEmoji3D.decode(mine);
    if (mine3d) return { layout: m[1], style: +m[2], image: window.MinkaEmoji3D.url(mine3d, 320), tail: 'x' + mine3d, key: m[1] + m[2] + '|x' + mine3d };
    if (m[4].charAt(0) === 'x') {
      var pic = window.MinkaEmoji3D && window.MinkaEmoji3D.url(m[4].slice(1), 320); if (!pic) return null;
      return { layout: m[1], style: +m[2], image: pic, tail: m[4], key: m[1] + m[2] + '|' + m[4] };
    }
    var own = m[3] && owner && window.MinkaEmoji && window.MinkaEmoji.get ? window.MinkaEmoji.get(owner) : '';
    var emoji = own || emoFromCodes(m[4]); if (!emoji) return null;
    return { layout: m[1], style: +m[2], emoji: emoji, key: m[1] + m[2] + '|' + emoji };
  }
  function emoPaint(spec) {
    if (emoPending[spec.key]) return emoPending[spec.key];
    var S = 384, font = function (px) { return px + 'px ' + (spec.style === 1 ? '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' : '"Fluent Emoji Gaps","Fluent Emoji Color","Apple Color Emoji","Segoe UI Emoji",sans-serif'); };
    var picture = null;
    var load = spec.image
      ? new Promise(function (ok, no) { var im = new Image(); im.decoding = 'async'; im.onload = function () { picture = im; ok(); }; im.onerror = no; im.src = spec.image; })
      : spec.style === 1 || !document.fonts || !document.fonts.load ? Promise.resolve() : document.fonts.load(font(64), spec.emoji).catch(function () {});
    emoPending[spec.key] = load.then(function () {
      var c = document.createElement('canvas'); c.width = c.height = S;
      var g = c.getContext('2d');
      // the emoji layer, then its look (grey / black / white) worked out on the pixels
      var L = document.createElement('canvas'); L.width = L.height = S; var lg = L.getContext('2d', { willReadFrequently: true });
      lg.textAlign = 'center'; lg.textBaseline = 'middle';
      // one emoji at (x, y), size px: the glyph, or the 3D picture
      var put = function (x, y, px) { if (picture) lg.drawImage(picture, x - px * .5, y - px * .5, px, px); else { lg.font = font(px); lg.fillText(spec.emoji, x, y); } };
      if (spec.layout === 'p') {
        for (var row = 0; row * 96 < S + 96; row++) for (var col = -1; col * 96 < S + 96; col++) {
          lg.save(); lg.translate(col * 96 + (row % 2 ? 48 : 0) + 24, row * 96 + 30); lg.rotate((row + col) % 2 ? .14 : -.14); put(0, 0, picture ? 66 : 58); lg.restore();
        }
      } else if (spec.layout === 'c') put(S * .74, S * .78, picture ? 460 : 430);
      else put(S / 2, S * .54, picture ? 270 : 250);
      var img = lg.getImageData(0, 0, S, S), d = img.data, sr = 0, sg = 0, sb = 0, sa = 0;
      for (var i = 0; i < d.length; i += 16) { var a = d[i + 3]; if (a > 60) { sr += d[i] * a; sg += d[i + 1] * a; sb += d[i + 2] * a; sa += a; } }
      var avg = sa ? [sr / sa, sg / sa, sb / sa] : [60, 90, 130];
      if (spec.style >= 2) {
        var br = spec.style === 2 ? .62 : 1.25, ct = spec.style === 2 ? 1.45 : .8;
        for (var j = 0; j < d.length; j += 4) {
          var v = (.2126 * d[j] + .7152 * d[j + 1] + .0722 * d[j + 2]) / 255 * br; v = ((v - .5) * ct + .5) * 255;
          d[j] = d[j + 1] = d[j + 2] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
        lg.putImageData(img, 0, 0);
      }
      // the ground: the emoji's own colour, deep; charcoal under black, slate under white
      var mix = function (c1, k) { return 'rgb(' + c1.map(function (v, n) { return Math.round(v + ([10, 12, 16][n] - v) * k); }).join(',') + ')'; };
      var grd = g.createLinearGradient(0, 0, S, S);
      if (spec.style === 2) { grd.addColorStop(0, '#34373d'); grd.addColorStop(1, '#0f1013'); }
      else if (spec.style === 3) { grd.addColorStop(0, '#3e4a5e'); grd.addColorStop(1, '#171c26'); }
      else { grd.addColorStop(0, mix(avg, .5)); grd.addColorStop(1, mix(avg, .82)); }
      g.fillStyle = grd; g.fillRect(0, 0, S, S);
      g.globalAlpha = spec.layout === 'p' ? .85 : 1; g.drawImage(L, 0, 0); g.globalAlpha = 1;
      var url = c.toDataURL('image/webp', .86); if (!/^data:image\/webp/.test(url)) url = c.toDataURL('image/png');
      c.width = c.height = L.width = L.height = 1;
      emoReady[spec.key] = url; delete emoPending[spec.key];
      return url;
    });
    return emoPending[spec.key];
  }
  function emoOwner(el) { var w = el && el.getAttribute && (el.getAttribute('data-worker') || el.getAttribute('data-next-worker') || el.getAttribute('data-emo-owner')); return w || ''; }
  window.mkEmojiBackground = { codes: emoCodes, tail: emoTail, spec: emoSpec, paint: emoPaint, ready: function (spec) { return spec && emoReady[spec.key]; } };
  // The person saved a new emoji in the Emoji tab: a background that follows it is redrawn.
  window.mkSyncEmojiBackground = function (name) {
    var sk = window.mkGetWorkerSkin && window.mkGetWorkerSkin(name);
    if (!sk || sk.t !== 'emo' || !/^[bcp][0-3]m-/.test(sk.id || '')) return;
    var em = window.MinkaEmoji && window.MinkaEmoji.get(name); if (!em) return;
    var next = JSON.parse(JSON.stringify(sk)); next.id = sk.id.slice(0, 3) + '-' + emoTail(em);
    if (next.id === sk.id) return;
    setSkin(name, next);
    var k = normName(name);
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function (c) { if (normName(c.getAttribute('data-worker')) === k) window.mkApplySkinToEl(c, next); });
  };

  var EZ_RE = /^(?:[123]|[6-9]\d|[1-3]\d\d)$/;
  function ezPercent(v) {
    v = String(v || ''); if (!EZ_RE.test(v)) return 100;
    return v.length === 1 ? { '1': 80, '2': 220, '3': 340 }[v] : Math.max(60, Math.min(350, +v));
  }
  /* A large emoji (L / XL) never leaves the card: once placed, its plate is measured and
     pushed back inside by the least it takes (a translate, 3 % of the card from the edge). */
  // A plate measured wholly off its card is not laid out yet (a look or face still being
  // applied, a picture still loading): pushed by that, the emoji ended up a card's length
  // away until the page was reloaded.
  function offCard(c, r) { return r.bottom <= c.top || r.top >= c.bottom || r.right <= c.left || r.left >= c.right; }
  function fitEmojiInside(card, tries) {
    var el = card && (card.querySelector('[data-wf-part="emoji"]') || card.querySelector('.mk-mid-meta-emoji:not(.is-initials)'));
    if (!el) return;
    if (card.__ezRetry) { cancelAnimationFrame(card.__ezRetry); card.__ezRetry = 0; }
    if (el.style.getPropertyValue('translate')) el.style.removeProperty('translate');
    if (!card.classList.contains('mk-emoji-zs') || !(parseFloat(card.style.getPropertyValue('--mk-ez')) > 1)) return;
    var c = card.getBoundingClientRect(), r = el.getBoundingClientRect(); if (!c.width || !r.width) return;
    var again = function () { if ((tries || 0) < 30) card.__ezRetry = requestAnimationFrame(function () { card.__ezRetry = 0; fitEmojiInside(card, (tries || 0) + 1); }); };
    if ((card.dataset.watchFace && !el.hasAttribute('data-wf-part')) || offCard(c, r)) { again(); return; }
    var pic = el.querySelector('img'); if (pic && !pic.complete) pic.addEventListener('load', function () { if (el.isConnected) fitEmojiInside(card); }, { once: true });
    var m = c.width * .03, dx = 0, dy = 0;
    if (r.width > c.width - 2 * m) dx = (c.left + c.right - r.left - r.right) / 2;
    else if (r.left < c.left + m) dx = c.left + m - r.left; else if (r.right > c.right - m) dx = c.right - m - r.right;
    if (r.height > c.height - 2 * m) dy = (c.top + c.bottom - r.top - r.bottom) / 2;
    else if (r.top < c.top + m) dy = c.top + m - r.top; else if (r.bottom > c.bottom - m) dy = c.bottom - m - r.bottom;
    if (!dx && !dy) return;
    var k = card.offsetWidth ? c.width / card.offsetWidth : 1;     // a scaled preview: undo its scale
    el.style.setProperty('translate', (dx / k).toFixed(1) + 'px ' + (dy / k).toFixed(1) + 'px');
    // The push must leave it on the card; if the layout moved meanwhile, measure again.
    if (offCard(card.getBoundingClientRect(), el.getBoundingClientRect())) { el.style.removeProperty('translate'); again(); }
  }
  window.mkFitEmojiInside = fitEmojiInside;
  // Emoji tab → Izmērs: how big the person's emoji sits on the card ('' = as drawn).
  // sizes in %: 60–350 (the older S / L / XL presets were stored as 1 / 2 / 3)
  window.mkGetEmojiSize = function (name) { var sk = window.mkGetWorkerSkin && window.mkGetWorkerSkin(name); return ezPercent(sk && sk.ez); };
  window.mkSetEmojiSize = function (name, z) {
    var cur = (window.mkGetWorkerSkin && window.mkGetWorkerSkin(name)) || null;
    var sk = JSON.parse(JSON.stringify(cur || {}));
    var pc = Math.round(Math.max(60, Math.min(350, Number(z) || 100)));
    if (pc === 100) delete sk.ez; else sk.ez = String(pc);
    if ((sk.ez || '') === ((cur && cur.ez) || '')) return;
    pushUndo(name, cur);
    var next = hasAny(sk) ? sk : null;
    setSkin(name, next, 400);
    var k = normName(name);
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function (c) { if (normName(c.getAttribute('data-worker')) === k) window.mkApplySkinToEl(c, next); });
  };
  // Emoji look (Fluent '' / system 's' / black 'b' / white 'w'): the Emoji tab sets it too.
  window.mkGetEmojiLook = function (name) { var sk = window.mkGetWorkerSkin && window.mkGetWorkerSkin(name); return (sk && /^[sbw]$/.test(sk.es || '')) ? sk.es : ''; };
  window.mkSetEmojiLook = function (name, es) {
    var cur = (window.mkGetWorkerSkin && window.mkGetWorkerSkin(name)) || null;
    var sk = JSON.parse(JSON.stringify(cur || {}));
    if (/^[sbw]$/.test(es || '')) sk.es = es; else delete sk.es;
    if ((sk.es || '') === ((cur && cur.es) || '')) return;
    pushUndo(name, cur);
    var next = hasAny(sk) ? sk : null;
    setSkin(name, next, 400);
    var k = normName(name);
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function (c) { if (normName(c.getAttribute('data-worker')) === k) window.mkApplySkinToEl(c, next); });
  };
  // The look samples show the person's own emoji (a 3D one as its picture), else the cat.
  window.mkPaintEmojiLookSamples = function (root, emoji) {
    if (!root) return;
    root.querySelectorAll('.mk-emoji-style-sample').forEach(function (s) {
      var v = emoji || '😺';
      if (window.MinkaEmoji3D && window.MinkaEmoji3D.decode(v)) window.MinkaEmoji3D.paint(s, v);
      else { if (s.hasAttribute('data-mk-emoji')) s.removeAttribute('data-mk-emoji'); if (s.textContent !== v || s.children.length) s.textContent = v; }
    });
  };
  // Emoji tab → drag the emoji on the preview: its place on a card with a layout (% of the card).
  window.mkSetEmojiPlace = function (name, x, y) {
    var M = window.MinkaCardFaceModel, cur = (window.mkGetWorkerSkin && window.mkGetWorkerSkin(name)) || null;
    if (!M || !cur || !cur.face) return false;
    var sk = JSON.parse(JSON.stringify(cur)), f = M.clean(sk.face, true);
    f.parts.emoji[0] = Math.round(Math.max(6, Math.min(94, x))); f.parts.emoji[1] = Math.round(Math.max(6, Math.min(94, y))); f.parts.emoji[3] = 1;
    sk.face = M.clean(f, true);
    pushUndo(name, cur);
    setSkin(name, sk, 400);
    var k = normName(name);
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function (c) { if (normName(c.getAttribute('data-worker')) === k) window.mkApplySkinToEl(c, sk); });
    return true;
  };
  // Emoji tab → "Likt kā fonu": the person's emoji becomes the card's background (keeps the
  // layout and look it had, else one big Fluent emoji).
  window.mkSetEmojiBackground = function (name) {
    var em = window.MinkaEmoji && window.MinkaEmoji.get(name); if (!em) return false;
    var sk = JSON.parse(JSON.stringify((window.mkGetWorkerSkin && window.mkGetWorkerSkin(name)) || {}));
    var cur = sk.t === 'emo' ? /^([bcp])([0-3])/.exec(String(sk.id || '')) : null;
    pushUndo(name, window.mkGetWorkerSkin(name));
    sk.t = 'emo'; sk.id = (cur ? cur[1] + cur[2] : 'b0') + 'm-' + emoTail(em); delete sk.rgb;
    setSkin(name, sk);
    var k = normName(name);
    document.querySelectorAll('#grafiks-list .card[data-worker]').forEach(function (c) { if (normName(c.getAttribute('data-worker')) === k) window.mkApplySkinToEl(c, sk); });
    return true;
  };
  // The picture behind a look (for the Nakts bed linen "like the card"): a URL or CSS gradient.
  window.mkSkinPicture = function(skin) {
    if (skin && skin.t === 'emo') { var es = emoSpec(skin.id); return es && emoReady[es.key] ? { url: emoReady[es.key] } : null; }
    if (!skin) return null;
    if (skin.t === 'art' && skin.id && artUrl(skin.id)) return { url: artUrl(skin.id) };
    if (skin.t === 'img' && skin.id) return { url: stockSkinUrl(skin.id) };
    if (skin.t === 'grad' && skin.id && GRAD_MAP[skin.id]) return { css: GRAD_MAP[skin.id] };
    return null;
  };
  window.mkApplySkinToEl = function(el, skin) {
    if (window.MINKA_APP === 'rad') skin = radUndither(skin);
    if (el.classList.contains('mk-next-person')) { applyNextShiftSkin(el, skin); return; }
    if (window.nsApplyWorkerColour) window.nsApplyWorkerColour(el, skin);
    var numEl = el.querySelector('.mk-mid-hours.card-shift') || el.querySelector('.pv-num') || el.querySelector('.nsc-full-dur');
    if (numEl) { numEl.style.removeProperty('color'); numEl.style.removeProperty('-webkit-text-fill-color'); }
    // Night duration sits on a fixed dark info strip, independent of skin text colours.
    if (el.classList.contains('nsc-full-card')) numEl = null;
    ['mk-has-skin','mk-has-grad','mk-skin-fit','mk-has-num','mk-has-txt','mk-txt-dark','mk-emoji-sys','mk-emoji-black','mk-emoji-white','mk-txtfx-f','mk-txtfx-g','mk-txtfx-o','mk-txtfx-h','mk-nf','mk-nf-only','mk-emoji-zs','mk-has-spark','mk-fx-hearts','mk-fx-mirdz','mk-fx-burb','mk-fx-ziedi','mk-fx-taur','mk-fx-dither','mk-fx-ditherpaper','mk-fx-dithercolor','mk-fx-pic','mk-fx-xray','mk-fx-halftone','mk-fx-duotone','mk-fx-ascii','mk-fx-focus','mk-fx-poster','mk-fx-split','mk-fx-mosaic','mk-fx-bricks','mk-fx-lines','mk-fx-led','mk-fx-pixelate','mk-fx-cmyk','mk-fx-riso','mk-fx-pointillism','mk-fx-heatmap','mk-fx-threshold','mk-fx-outline','mk-fx-posterize','mk-emoji-custom','mk-emoji-normal','nsc-worker-skinned','nsc-skin-hue','nsc-skin-contain','ns-room-bed-skin-hue'].forEach(function(c){ el.classList.remove(c); });
    NAME_STYLES.forEach(function(o){ if (o[0]) el.classList.remove('mk-nf-' + o[0]); });
    ['--mk-skin-img','--mk-ez','--mk-emoji-tint','--mk-emoji-tint-a','--mk-num-color','--mk-num-alpha','--mk-txt-color','--mk-emoji-op','--mk-fx-scale','--mk-focus-x','--mk-focus-y'].forEach(function(p){ el.style.removeProperty(p); });
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
    } else if (skin.t === 'emo' && skin.id) {
      var es = emoSpec(skin.id, emoOwner(el));
      if (es) {
        el.classList.add('mk-has-skin');
        el.__emoKey = es.key;
        if (emoReady[es.key]) el.style.setProperty('--mk-skin-img', "url('" + emoReady[es.key] + "')");
        else {
          el.style.setProperty('--mk-skin-img', 'linear-gradient(150deg,#1d2230,#0b0e14)');
          emoPaint(es).then(function (url) {
            if (el.__emoKey !== es.key) return;
            el.style.setProperty('--mk-skin-img', "url('" + url + "')");
            if (window.MinkaDither && window.MinkaDither.skin) window.MinkaDither.skin(el);
          }, function () {});
        }
      }
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
      // Dark or light ink: the Dither chips only take a text colour that reads on them.
      // (WCAG luminance: below .105 it would not reach 3:1 on the near-black chips)
      var tc = String(skin.txt).split(',').map(function (v) { v = Number(v) / 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
      if (tc[0] * .2126 + tc[1] * .7152 + tc[2] * .0722 < .105) el.classList.add('mk-txt-dark');
    }
    if (skin.em != null) {
      el.classList.add('mk-emoji-custom');
      el.style.setProperty('--mk-emoji-op', skin.em);
    }
    if (skin.emn === '0') el.classList.add('mk-emoji-normal');
    // Emoji look for the card's emoji and the background one: system, black, white (Fluent by default).
    var esClass = { s: 'mk-emoji-sys', b: 'mk-emoji-black', w: 'mk-emoji-white' }[skin.es];
    if (esClass) el.classList.add(esClass);
    // Text effect for the name, labels and small values (not the numeral): flat, glow, outline, hard shadow.
    if (/^[fgoh]$/.test(String(skin.te || ''))) el.classList.add('mk-txtfx-' + skin.te);
    if (NAME_STYLE_RE.test(String(skin.nf || ''))) {
      el.classList.add('mk-nf', 'mk-nf-' + skin.nf.toLowerCase());
      if (skin.nf !== skin.nf.toLowerCase()) el.classList.add('mk-nf-only');
    }
    // The person's emoji on the card: small, as drawn, large or extra large (Emoji tab → Izmērs).
    // The person's emoji on the card: its size in % (Emoji tab → size), 100 = as drawn.
    var ezp = ezPercent(skin.ez);
    if (ezp !== 100) { el.classList.add('mk-emoji-zs'); el.style.setProperty('--mk-ez', (ezp / 100).toFixed(2)); }
    if (el.__ezFit) cancelAnimationFrame(el.__ezFit);
    el.__ezFit = requestAnimationFrame(function () { el.__ezFit = 0; fitEmojiInside(el); });
    if (skin.fx === 'spark') el.classList.add('mk-has-spark');
    else if (['hearts','mirdz','burb','ziedi','taur'].indexOf(skin.fx) >= 0) el.classList.add('mk-fx-' + skin.fx);
    else if (skin.fx === 'dither' || skin.fx === 'ditherpaper' || skin.fx === 'dithercolor') { el.classList.add('mk-fx-dither'); if (skin.fx !== 'dither') el.classList.add('mk-fx-' + skin.fx); }
    else if (['xray','halftone','duotone','ascii','focus','poster','split','mosaic','bricks','lines','led','pixelate','cmyk','riso','pointillism','heatmap','threshold','outline','posterize'].indexOf(skin.fx) >= 0) el.classList.add('mk-fx-pic', 'mk-fx-' + skin.fx);
    if (skin.fx && skin.fxs != null) el.style.setProperty('--mk-fx-scale', skin.fxs);
    // Fokuss: where the colour lens sits (its centre, % of the card).
    if ((skin.fx === 'focus' || skin.fx === 'split') && /^\d{1,2},\d{1,2}$/.test(String(skin.fl || ''))) {
      var lens = String(skin.fl).split(',');
      el.style.setProperty('--mk-focus-x', lens[0]); el.style.setProperty('--mk-focus-y', lens[1]);
    }
    if (window.MinkaCardFaces) window.MinkaCardFaces.apply(el, skin);
  };
  function applyToCards(k) {
    var skin = loadAll()[k] || null;
    document.querySelectorAll('#grafiks-list .card[data-worker], #nsPanel .nsc-full-card[data-worker], #nsPanel .ns-room-bed[data-worker], .mk-next-person[data-next-worker]').forEach(function(c) {
      if (normName(c.getAttribute('data-worker') || c.getAttribute('data-next-worker')) !== k) return;
      window.mkApplySkinToEl(c, skin);
    });
  }
  function hasAny(sk) { return !!(sk && (sk.t || sk.num || sk.txt || sk.em != null || sk.emn != null || sk.es || sk.te || sk.nf || sk.ez || sk.fx || sk.face || sk.bed || sk.bp || sk.bq)); }
  function storeSkinLocal(name, skin) {
    cloudRevision++;
    localEdited = true;
    var all = loadAll();
    var k = normName(name);
    // A copy: the editor keeps mutating its draft, the stored map must not follow it.
    if (hasAny(skin)) all[k] = JSON.parse(JSON.stringify(skin)); else delete all[k];
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
      }, typeof debounceCloud === 'number' ? debounceCloud : 300);
    } else {
      delete cloudTimers[k];
      cloudPush(name, skin);
    }
  }

  /* The editor's left column sticks while the options scroll. Taller than the
     window's visible part (the contrast list open), its bottom could never be
     reached: it is held to the scroller's visible height and scrolls itself. */
  function fitSkinAside(host) {
    var aside = host && host.querySelector('.mk-skin-aside'); if (!aside) return;
    var sc = aside.parentElement;
    while (sc && sc !== document.body && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    if (!sc || sc === document.body) { aside.style.maxHeight = ''; return; }
    aside.style.maxHeight = Math.max(240, sc.clientHeight - 24) + 'px';
  }
  if (!window.__mkAsideFit) {
    window.__mkAsideFit = true;
    window.addEventListener('resize', function () { document.querySelectorAll('.mk-skin-shell').forEach(function (sh) { fitSkinAside(sh.parentElement); }); });
  }
  // ── Cloudflare sync (skins + dekors vienā /api/skins ierakstā) ──
  // Kanonizē decimālskaitli servera regex vajadzībām: "1.00"→"1", "0.70"→"0.7", "0.95"→"0.95".
  function numStr(v) {
    var n = parseFloat(v);
    return isNaN(n) ? '0' : String(n);
  }
  // The decoration's own effect, tuning and colour ride in the id field as "id--" + a
  // one-letter effect code, optional two tuning digits (smalkums, kontrasts) and optional
  // "rrggbb" (no item id contains "--"), so they sync through the API's existing ad:
  // format. The tail length tells the parts apart (1/3/7/9); "id--rrggbb" (colour only)
  // is the first version of it.
  var DECOR_FX_CODE = { card: 'c', none: 'n', dither: 'd', xray: 'x', halftone: 'h', duotone: 't', ascii: 'a', focus: 'f',
    led: 'l', lines: 'i', cmyk: 'k', riso: 'r', heatmap: 'm', pixelate: 'p', mosaic: 'o', bricks: 'b', pointillism: 'z', threshold: 'e', outline: 'u', posterize: 's' };
  function decorFxFromCode(code) { for (var k in DECOR_FX_CODE) if (DECOR_FX_CODE[k] === code) return k; return ''; }
  function packAddonId(addon) {
    var code = DECOR_FX_CODE[addon.fx] || '';
    var tail = code ? code + (addon.tune || '') + (addon.color || '') : (addon.color || '');
    return addon.id + (tail ? '--' + tail : '');
  }
  function cleanAddonConfig(value) {
    if (!value || !/^[a-z0-9-]{1,40}$/.test(String(value.id || ''))) return null;
    var id = String(value.id), color = String(value.color || ''), fx = DECOR_FX_CODE[value.fx] ? String(value.fx) : '', tune = String(value.tune || '');
    var cut = id.indexOf('--');
    if (cut > 0) {
      var tail = id.slice(cut + 2);
      id = id.slice(0, cut);
      if (/^[a-f0-9]{6}$/.test(tail)) { if (!color) color = tail; }
      else if (/^[a-z](\d\d)?([a-f0-9]{6})?$/.test(tail)) {
        if (!fx) fx = decorFxFromCode(tail[0]);
        var rest = tail.slice(1);
        if (rest.length === 2 || rest.length === 8) { if (!tune) tune = rest.slice(0, 2); rest = rest.slice(2); }
        if (!color && rest.length === 6) color = rest;
      }
    }
    var clean = {
      id: id,
      scale: Math.round(Math.max(.3, Math.min(2, Number(value.scale) || 1)) * 100),
      side: value.side === 'left' ? 'l' : 'r',
      x: Math.round(Math.max(-100, Math.min(100, Number(value.x) || 0)) * 10),
      y: Math.round(Math.max(-100, Math.min(100, Number(value.y) || 0)) * 10)
    };
    if (fx) clean.fx = fx;
    if (fx && /^\d\d$/.test(tune) && tune !== '55') clean.tune = tune;
    if (/^[a-f0-9]{6}$/.test(color)) clean.color = color;
    if (packAddonId(clean).length > 40) { delete clean.color; delete clean.tune; delete clean.fx; }
    return clean;
  }
  function packSkin(sk, name) {
    var p = [];
    if (sk) {
      if (sk.t === 'art' && sk.id) p.push('art:' + sk.id);
      else if (sk.t === 'img' && sk.id) p.push('img:' + sk.id);
      else if (sk.t === 'grad' && sk.id) p.push('grad:' + sk.id);
      else if (sk.t === 'emo' && EMO_RE.test(String(sk.id || ''))) p.push('emo:' + sk.id);
      else if (sk.t === 'hue' && sk.rgb) p.push('hue:' + sk.rgb);
      if (sk.txt) p.push('txt:' + sk.txt);
      if (sk.num) p.push('num:' + sk.num);
      if (sk.numA != null) p.push('na:' + numStr(sk.numA));
      if (sk.em != null) p.push('em:' + numStr(sk.em));
      if (sk.emn != null) p.push('emn:' + sk.emn);
      if (/^[sbw]$/.test(String(sk.es || ''))) p.push('es:' + sk.es);
      if (/^[fgoh]$/.test(String(sk.te || ''))) p.push('te:' + sk.te);
      if (NAME_STYLE_RE.test(String(sk.nf || ''))) p.push('nf:' + sk.nf);
      if (EZ_RE.test(String(sk.ez || ''))) p.push('ez:' + sk.ez);
      if (sk.fx) p.push('fx:' + sk.fx);
      if (sk.fx && sk.fxs != null) p.push('fxs:' + numStr(sk.fxs));
      if ((sk.fx === 'focus' || sk.fx === 'split') && /^\d{1,2},\d{1,2}$/.test(String(sk.fl || ''))) p.push('fp:' + sk.fl);
      if (sk.depth === false) p.push('dp:0');
      if (/^(?:[a-h][1-3][1-3]|[p-t]11)$/.test(String(sk.tm || ''))) p.push('tm:' + sk.tm);
      if (/^[a-z]{2,12}$/.test(String(sk.bed || ''))) p.push('bd:' + sk.bed);
      if (/^\d{1,2}$/.test(String(sk.bp || ''))) p.push('bp:' + sk.bp);
      if (/^\d{1,2}$/.test(String(sk.bq || ''))) p.push('bq:' + sk.bq);
      if (sk.face && window.MinkaCardFaceModel) p.push('wf:' + window.MinkaCardFaceModel.pack(sk.face));
    }
    if (window.MinkaCardAddons && typeof window.MinkaCardAddons.get === 'function') {
      p.push('av:1');
      // Up to three decorations: one "ad:" part each, in slot order.
      var addons = typeof window.MinkaCardAddons.getList === 'function' ? window.MinkaCardAddons.getList(name) : [window.MinkaCardAddons.get(name)];
      addons.forEach(function(value) {
        var addon = cleanAddonConfig(value);
        if (addon) p.push('ad:' + [packAddonId(addon), addon.scale, addon.side, addon.x, addon.y].join(','));
      });
    }
    return p.join(';');
  }
  function unpackAppearance(v) {
    var sk = {};
    var addons = [];
    var addonVersion = 0;
    String(v || '').split(';').forEach(function(part) {
      if (part.indexOf('art:') === 0) { sk.t = 'art'; sk.id = part.slice(4); }
      else if (part.indexOf('img:') === 0) { sk.t = 'img'; sk.id = part.slice(4); }
      else if (part.indexOf('grad:') === 0) { sk.t = 'grad'; sk.id = part.slice(5); }
      else if (part.indexOf('emo:') === 0) { if (EMO_RE.test(part.slice(4))) { sk.t = 'emo'; sk.id = part.slice(4); } }
      else if (part.indexOf('hue:') === 0) { sk.t = 'hue'; sk.rgb = part.slice(4); }
      else if (part.indexOf('txt:') === 0) { sk.txt = part.slice(4); }
      else if (part.indexOf('num:') === 0) { sk.num = part.slice(4); }
      else if (part.indexOf('na:') === 0) { sk.numA = part.slice(3); }
      else if (part.indexOf('em:') === 0) { sk.em = part.slice(3); }
      else if (part.indexOf('emn:') === 0) { sk.emn = part.slice(4); }
      else if (part.indexOf('es:') === 0) { if (/^[sbw]$/.test(part.slice(3))) sk.es = part.slice(3); }
      else if (part.indexOf('te:') === 0) { if (/^[fgoh]$/.test(part.slice(3))) sk.te = part.slice(3); }
      else if (part.indexOf('nf:') === 0) { if (NAME_STYLE_RE.test(part.slice(3))) sk.nf = part.slice(3); }
      else if (part.indexOf('ez:') === 0) { if (EZ_RE.test(part.slice(3))) sk.ez = part.slice(3); }
      else if (part.indexOf('fx:') === 0) { sk.fx = part.slice(3); }
      else if (part.indexOf('fxs:') === 0) { sk.fxs = part.slice(4); }
      else if (part.indexOf('fp:') === 0) { if (/^\d{1,2},\d{1,2}$/.test(part.slice(3))) sk.fl = part.slice(3); }
      else if (part === 'dp:0') { sk.depth = false; }
      else if (part.indexOf('tm:') === 0) { if (/^(?:[a-h][1-3][1-3]|[p-t]11)$/.test(part.slice(3))) sk.tm = part.slice(3); }
      else if (part.indexOf('bd:') === 0) { if (/^[a-z]{2,12}$/.test(part.slice(3))) sk.bed = part.slice(3); }
      else if (part.indexOf('bp:') === 0) { if (/^\d{1,2}$/.test(part.slice(3))) sk.bp = part.slice(3); }
      else if (part.indexOf('bq:') === 0) { if (/^\d{1,2}$/.test(part.slice(3))) sk.bq = part.slice(3); }
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
        if (clean && addons.length < 3) {
          var addon = { id: clean.id, scale: clean.scale / 100, side: clean.side === 'l' ? 'left' : 'right', x: clean.x / 10, y: clean.y / 10 };
          if (clean.fx) addon.fx = clean.fx;
          if (clean.tune) addon.tune = clean.tune;
          if (clean.color) addon.color = clean.color;
          addons.push(addon);
        }
      }
    });
    if (sk.t === 'grad' && SCENIC_IDS[sk.id]) sk.t = 'img';
    return { skin: hasAny(sk) ? sk : null, addon: addons[0] || null, addons: addons, addonVersion: addonVersion };
  }
  function unpackSkin(v) {
    return unpackAppearance(v).skin;
  }
  function warnLocalOnly() {
    if (typeof _mkToast === 'function') _mkToast('Mākonis vēl nav gatavs — izskats pagaidām tikai šajā ierīcē', 'error');
  }
  /* Local preview server (scripts/local-daybook-server.mjs sets MINKA_LOCAL_DAYBOOK):
     trying looks out must never change a colleague's card for everyone. Edits stay
     in this browser, and the cloud stops overwriting them once something was edited. */
  var LOCAL_PREVIEW = !!window.MINKA_LOCAL_DAYBOOK, localEdited = false, localToastShown = false;
  function cloudPush(name, sk, silent) {
    if (LOCAL_PREVIEW) {
      if (!localToastShown && typeof _mkToast === 'function') { localToastShown = true; _mkToast('Lokālais tests: izskats saglabāts tikai šajā ierīcē', 'ok'); }
      return Promise.resolve();
    }
    if (!window.MinkaApi || !window.MinkaApi.apiFetch) { warnLocalOnly(); return; }
    var revision = ++cloudRevision;
    cloudWrites++;
    var packed = packSkin(sk, name) || null;
    function post(value) { return window.MinkaApi.apiFetch('/api/skins', { method: 'POST', json: { worker: cloudWorkerName(name), skin: value } }); }
    return post(packed)
      // An API that does not know the lens position yet (fp:) refuses the whole
      // look: send it again without that part, so everything else still syncs.
      .then(function(r) {
        if (r.ok || r.status !== 400 || !packed) return r;
        var lean = packed.split(';').filter(function(x) { return !/^(fp|tm|bd|bp|bq):/.test(x); });
        var firstAd = lean.findIndex(function(x) { return x.indexOf('ad:') === 0; });
        var single = lean.filter(function(x, i) { return x.indexOf('ad:') !== 0 || i === firstAd; });
        // Older API: first without the new parts, then with the first decoration only.
        return (lean.length < packed.split(';').length ? post(lean.join(';')) : Promise.resolve(r)).then(function(r2) {
          return r2.ok || r2.status !== 400 || single.length === lean.length ? r2 : post(single.join(';'));
        });
      })
      .then(function(r) { if (!r.ok) throw 0; if (!silent && revision===cloudRevision && typeof _mkToast === 'function') _mkToast('Izskats saglabāts — redzēs visi', 'ok'); })
      .catch(warnLocalOnly)
      .finally(function(){ cloudWrites--; });
  }
  /* One or two fields of a person's look changed outside the editor (the Nakts
     bed picker): merged into the saved look, synced, and every card and bed of
     that person repainted. A null value removes the field. */
  window.mkPatchWorkerSkin = function(name, patch) {
    var cur = window.mkGetWorkerSkin(name), next = cur ? JSON.parse(JSON.stringify(cur)) : {};
    Object.keys(patch || {}).forEach(function(k) { if (patch[k] == null || patch[k] === '') delete next[k]; else next[k] = patch[k]; });
    setSkin(name, hasAny(next) ? next : null, 800);
    var k2 = normName(name);
    document.querySelectorAll('#grafiks-list .card[data-worker], #nsPanel .ns-room-bed[data-worker], #nsPanel .nsc-full-card[data-worker]').forEach(function(c) {
      if (normName(c.getAttribute('data-worker')) === k2) window.mkApplySkinToEl(c, hasAny(next) ? next : null);
    });
    return next;
  };
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
    if (LOCAL_PREVIEW) throw new Error('Lokālajā testā zīmējumu mākonī nesaglabā');
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
    if (document.hidden || cloudPullInFlight || (LOCAL_PREVIEW && localEdited)) return;
    if (!window.MinkaApi || !window.MinkaApi.apiFetch) return;
    if (window.MinkaApi.getToken && !window.MinkaApi.getToken()) return;
    if (cloudWrites || Object.keys(cloudTimers).length) { scheduleCloudPull(30000, 0); return; }
    cloudPullInFlight = true;
    var revision = cloudRevision;
    var nextDelay = 30000;
    var nextAttempt = 0;
    return window.MinkaApi.apiFetch('/api/skins').then(function(r) {
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
          if (appearance.addons.length) cloudAddons[key] = appearance.addons;
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

  // The number's actual colour: its own element colour, else the face tint, else "num".
  function numberHex(skin) {
    if (skin && skin.face) return '#' + ((skin.face.colors && skin.face.colors.hours) || skin.face.tint || 'd5e6ef');
    return skin && skin.num ? rgbToHex(skin.num) : '#d5e6ef';
  }

  /* ── Atsaukt: izskats + dekors pirms lielākām izmaiņām (Remix, Pieskaņot,
     komplekts, fons, noņemšana). Tikai šajā sesijā, maksimums 20 soļi. */
  var undoStacks = Object.create(null);
  function undoStack(name) { var k = normName(name); return undoStacks[k] || (undoStacks[k] = []); }
  // The card's decorations (a list of up to three).
  function currentAddon(name) {
    var A = window.MinkaCardAddons;
    var list = A && typeof A.getList === 'function' ? A.getList(name) : A && typeof A.get === 'function' && A.get(name) ? [A.get(name)] : [];
    return JSON.parse(JSON.stringify(list));
  }
  function pushUndo(name, skin) {
    var stack = undoStack(name);
    stack.push({ skin: hasAny(skin) ? JSON.parse(JSON.stringify(skin)) : null, addon: currentAddon(name) });
    if (stack.length > 20) stack.shift();
  }
  function setAddonQuiet(name, addon) {
    var A = window.MinkaCardAddons;
    if (A && typeof A.set === 'function') A.set(name, addon || null, { skipCloud: true });
  }

  /* ── Remix: saskaņots izskats no pārdomātām receptēm, nevis tīrs nejaušums.
     Recepte nosaka fona veidu, ciparnīcu, efektu un dekora veidu; krāsas
     (akcents, teksts, tinte, metāls, dekora kontrasts) nāk no paša attēla.
     Nesen rādītie foni un dekori neatkārtojas; elementu redzamība un kafijas
     iestatījumi paliek cilvēka. Darbs notiek tikai pēc klikšķa. */
  var REMIX_RECENT = [], REMIX_LAST = [];
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pickOne(list) { return list[rnd(list.length)]; }
  function weighted(list) {
    var total = 0; list.forEach(function(x) { total += x[0]; });
    var r = Math.random() * total;
    for (var i = 0; i < list.length; i++) { r -= list[i][0]; if (r < 0) return list[i][1]; }
    return list[list.length - 1][1];
  }
  function freshId(ids) {
    var left = ids.filter(function(id) { return REMIX_RECENT.indexOf(id) < 0; });
    var id = pickOne(left.length ? left : ids);
    REMIX_RECENT.push(id); if (REMIX_RECENT.length > 18) REMIX_RECENT.shift();
    return id;
  }
  function groupIds(labels) {
    var out = [];
    IMG_GROUPS.forEach(function(g) { if (labels.indexOf(g.label) >= 0) out = out.concat(g.ids); });
    return out;
  }
  function carryFace(face, current) {
    var M = window.MinkaCardFaceModel, c = current && current.face ? M.clean(current.face) : null;
    if (c) {
      M.parts.forEach(function(k) { face.parts[k][3] = c.parts[k][3]; });
      face.coffeeMode = c.coffeeMode; face.coffeeExplicit = c.coffeeExplicit; face.coffeeContrast = c.coffeeContrast;
      if (c.colors.moon) face.colors.moon = c.colors.moon;
    }
    var moonShown = face.parts.moon[3];
    face.parts.moon = M.symbolPlacement(face.parts, face.face); face.parts.moon[3] = moonShown;
    return face;
  }
  function remixAddon(groups, fx) {
    var A = window.MinkaCardAddons;
    if (!A || !A.items) return null;
    var group = pickOne(groups);
    // Flat text labels are picked by hand only: dropped in at random they look like a bug.
    var ids = A.items.filter(function(i) { return i.group === group && !i.hidden && !i.flat; }).map(function(i) { return i.id; });
    if (!ids.length) return null;
    var addon = { id: freshId(ids), scale: { topper: 1, charm: .9, sticker: .8, object: .85, tape: .9, strip: .9 }[group] || .9,
      side: Math.random() < .5 ? 'left' : 'right', x: 0, y: 0 };
    if (fx) addon.fx = fx;
    if (fx && fx !== 'card' && fx !== 'none') addon.tune = String(6 + rnd(3)) + String(4 + rnd(3));
    return addon;
  }
  var REMIX_EFFECT_PHOTOS = null, REMIX_SCENE_PHOTOS = null, REMIX_COLOR_PHOTOS = null, REMIX_SUBJECT_PHOTOS = null;
  // Effects built from the picture's own colours want a colourful photo; line,
  // dot and letter screens want a clear subject. Everything else takes any photo.
  var REMIX_COLOR_FX = /^(mosaic|bricks|pixelate|pointillism|posterize|cmyk|heatmap)$/, REMIX_SUBJECT_FX = /^(led|lines|ascii|halftone|threshold|outline|focus|split|riso)$/;
  // The pattern under a busy effect: the numeral gets a solid or neon finish that stands off it.
  var REMIX_BUSY_FX = /^(mosaic|bricks|pixelate|pointillism|posterize|cmyk|heatmap|riso|led|lines|ascii|halftone|threshold|outline)$/;
  function remixRecipe() {
    var recent = REMIX_LAST.slice(-2);
    // Weighted toward what people pick themselves (photo compositions, dither).
    var list = [[26, 'photo'], [24, 'effect'], [5, 'numbers'], [15, 'scene'], [10, 'dither'], [7, 'poster'], [9, 'fxset'], [4, 'vapor']].filter(function(r) {
      return !(recent.length === 2 && recent[0] === r[1] && recent[1] === r[1]);
    });
    var kind = weighted(list.map(function(r) { return [r[0], r[1]]; }));
    REMIX_LAST.push(kind); if (REMIX_LAST.length > 4) REMIX_LAST.shift();
    return kind;
  }
  function remixSkin(current) {
    var M = window.MinkaCardFaceModel, kind = remixRecipe(), skin, addon = null, opts = { force: true };
    if (!REMIX_EFFECT_PHOTOS) {
      REMIX_EFFECT_PHOTOS = SCENIC_SKINS.map(function(s) { return s.id; }).concat(groupIds(['Ūdens un sniegs', 'Zaļā daba', 'Silti un saulaini', 'Tumši un mistiski', 'Pilsēta', 'Melnbalti', 'Kaķi', 'Abstrakti', 'Aesthetic']));
      REMIX_COLOR_PHOTOS = groupIds(['Rozā un maigi', 'Spilgti', 'Zaļā daba', 'Silti un saulaini', 'Abstrakti', 'Mīļi un jauki']);
      REMIX_SUBJECT_PHOTOS = groupIds(['Kaķi', 'Melnbalti']).concat(['aesthetic-bird', 'aesthetic-cyborg', 'aesthetic-face', 'aesthetic-helmet', 'aesthetic-sunset', 'open-aesthetic', 'user-neon-alley-cat', 'user-butterfly', 'user-daisy']);
      REMIX_SCENE_PHOTOS = SCENIC_SKINS.map(function(s) { return s.id; }).concat(groupIds(['Hroms un graudi', 'Abstrakti', 'Aesthetic', 'Rozā un maigi', 'Spilgti', 'Ūdens un sniegs', 'Zaļā daba', 'Silti un saulaini', 'Tumši un mistiski', 'Mīļi un jauki', 'Barbie rozā', 'Kaķi']));
    }
    if (kind === 'fxset' || kind === 'vapor') {
      // A ready-made effect look or vaporwave set, as designed (layout, timer, decoration).
      var sets = PRESETS.filter(function(x) { return x.group === (kind === 'fxset' ? 'fx' : 'vapor'); }), setLabel = freshId(sets.map(function(y) { return y.label; }));
      var ps = sets.filter(function(y) { return y.label === setLabel; })[0];
      skin = JSON.parse(JSON.stringify(ps.bg));
      skin.face = JSON.parse(JSON.stringify(ps.face));
      if (!ps.keepParts) skin.face = carryFace(skin.face, current);
      ['fx', 'fxs', 'fl', 'tm', 'txt'].forEach(function(k) { if (ps[k]) skin[k] = ps[k]; });
      skin.num = ps.num; skin.depth = false;
      if (ps.addons) addon = JSON.parse(JSON.stringify(ps.addons));
      opts = { keep: true };
    } else if (kind === 'poster') {
      var posters = PRESETS.filter(function(x) { return x.group === 'poster'; }), pp = pickOne(posters);
      skin = { t: 'img', id: freshId(REMIX_EFFECT_PHOTOS), fx: 'poster', depth: false, face: carryFace(JSON.parse(JSON.stringify(pp.face)), current) };
      if (Math.random() < .35) addon = remixAddon(['sticker', 'frame', 'chrome'], null);
    } else if (kind === 'photo' || kind === 'dither') {
      // Hand-tuned bundles: their layout and accent stay, the rest follows the photo.
      var pool = PRESETS.filter(function(p) { return kind === 'dither' ? p.group === 'dither' && /^dither-/.test(p.bg.id) : ['wildlife', 'botanical', 'ocean', 'landscape'].indexOf(p.group) >= 0; });
      var id = freshId(pool.map(function(p) { return p.bg.id; }));
      var p = pool.filter(function(x) { return x.bg.id === id; })[0];
      skin = JSON.parse(JSON.stringify(p.bg));
      skin.face = carryFace(JSON.parse(JSON.stringify(p.face)), current);
      if (kind === 'photo') skin.face.finish = pickOne([skin.face.finish, skin.face.finish, 1, 4, 5]);   // neon is a favourite
      if (p.fx) skin.fx = p.fx;
      if (p.depth === false) skin.depth = false;
      skin.num = p.num;
      opts = { force: true, keepAccent: true };
      if (Math.random() < (kind === 'photo' ? .35 : .5)) addon = remixAddon(kind === 'photo' ? ['topper', 'charm', 'sticker'] : ['object', 'charm'], kind === 'dither' ? 'dither' : null);
    } else if (kind === 'effect') {
      var fx = weighted([[24, 'dither'], [10, 'ditherpaper'], [8, 'halftone'], [8, 'duotone'], [5, 'dithercolor'], [4, 'ascii'],
        [6, 'bricks'], [6, 'mosaic'], [5, 'led'], [5, 'lines'], [5, 'cmyk'], [4, 'riso'], [3, 'heatmap'], [3, 'focus'], [3, 'split'],
        [2, 'pixelate'], [2, 'posterize'], [2, 'threshold'], [2, 'outline'], [2, 'pointillism']]);
      var faceKind = /^dither(paper)?$/.test(fx) ? pickOne(['classic', 'classic', 'dither']) : pickOne(['classic', 'photo']);
      var pool = REMIX_COLOR_FX.test(fx) ? REMIX_COLOR_PHOTOS : REMIX_SUBJECT_FX.test(fx) ? REMIX_SUBJECT_PHOTOS : REMIX_EFFECT_PHOTOS;
      // Cell effects stay mid-fine (big tiles hide the picture); the rest vary a little.
      var tb = REMIX_COLOR_FX.test(fx) ? 4 + rnd(3) : 5 + rnd(4);
      skin = { t: 'img', id: freshId(pool.length ? pool : REMIX_EFFECT_PHOTOS), fx: fx, fxs: '1.' + tb + (4 + rnd(5)), depth: false, face: carryFace(M.preset(faceKind), current) };
      if (REMIX_BUSY_FX.test(fx)) skin.face.finish = pickOne([2, 2, 5]);
      if (Math.random() < .55) addon = remixAddon(['object', 'object', 'charm', 'topper'], /^dither/.test(fx) && fx !== 'dithercolor' ? pickOne(['dither', 'dither', 'card']) : 'card');
    } else if (kind === 'numbers') {
      var hue = pickOne([8, 20, 35, 45, 95, 140, 165, 185, 200, 215, 335, 350]);   // bez violetā
      skin = { t: 'hue', rgb: hslToRgb(hue, 40, 7).join(','), depth: false, face: carryFace(M.preset('classic'), current) };
      skin.face.finish = pickOne([3, 4, 5]); skin.face.parts.hours[2] = 112;
      if (Math.random() < .4) addon = remixAddon(['sticker', 'charm'], null);
    } else {
      skin = { t: 'img', id: freshId(REMIX_SCENE_PHOTOS), depth: false, face: carryFace(M.preset(pickOne(['classic', 'photo', 'orbit', 'modular'])), current) };
      skin.face.finish = weighted([[4, 0], [2, 1], [1, 2], [2, 4], [1, 3], [3, 5]]);
      var look = Math.random();
      if (look < .12) { skin.face.fullTintMode = 3; skin.face.fullTintAuto = 1; }
      else if (look < .2) skin.face.fullTintMode = 1;
      if (Math.random() < .3) addon = remixAddon(['topper', 'tape', 'charm', 'sticker'], null);
    }
    // The person's own emoji and timer settings stay.
    // (A ready-made set with its own timer keeps it; elsewhere the dial gets a free spot.)
    if (current && current.tm && !(opts.keep && skin.tm)) { skin.tm = current.tm; if (skin.face && /^[a-h]/.test(skin.tm)) M.fitDial(skin.face); }
    if (current && current.em != null) skin.em = current.em;
    if (current && current.emn != null) skin.emn = current.emn;
    if (current && current.es) skin.es = current.es;
    if (current && current.te) skin.te = current.te;
    if (current && current.nf) skin.nf = current.nf;
    if (current && current.ez) skin.ez = current.ez;
    if (opts.keep) return Promise.resolve({ skin: skin, addon: addon });
    return suggestedPalette(skin).then(function(pal) {
      harmonizeSkin(skin, pal, opts);
      if (!opts.keepAccent && skin.face) skin.face.metal = pickOne(pal.metals);
      if (addon) harmonizeAddon(addon, pal);
      return { skin: skin, addon: addon };
    });
  }

  // Izskats closed or left: drop its card clones, previews and effect pictures
  // (a few hundred DOM nodes and canvases on 8 GB PCs). The next visit renders anew.
  /* Būvētājs (skin-builder.js) works from the same data and colour logic as the
     editor: pictures, palettes, the harmoniser and the ready-made sets. */
  window.MinkaSkinKit = {
    IMG_GROUPS: IMG_GROUPS, IMG_LABELS: IMG_LABELS, SCENIC_SKINS: SCENIC_SKINS, DITHER_INKS: DITHER_INKS,
    NAME_STYLES: NAME_STYLES, imgUrl: stockSkinUrl, palette: suggestedPalette, harmonize: harmonizeSkin, harmonizeAddon: harmonizeAddon,
    INK_FX: INK_FX, COLOR_FX: REMIX_COLOR_FX, SUBJECT_FX: REMIX_SUBJECT_FX, BUSY_FX: REMIX_BUSY_FX,
    hexOf: hexOf, hexToRgb: hexToRgb, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, toneAt: toneAt, relLuminance: relLuminance
  };

  window.mkReleaseSkinPicker = function(host) {
    if (!host || !host.firstChild) return;
    if (host.__flushLive) host.__flushLive();   // a colour still being dragged is saved, not lost
    host.__flushLive = null;
    paletteRevision++;   // a pending auto-palette result must not re-render the hidden editor
    if (host.__bundleIO) { host.__bundleIO.disconnect(); host.__bundleIO = null; }
    host.__org = null;
    if (window.MinkaCardFaces && window.MinkaCardFaces.release) window.MinkaCardFaces.release(host);
    host.innerHTML = '';
    if (window.MinkaDither && window.MinkaDither.trim) window.MinkaDither.trim();
  };
  window.mkRenderSkinPicker = function(host) {
    if (!host) return;
    // A rebuild in place (a change, undo) keeps each column where it was scrolled to:
    // a tap on a tile further down never throws the list back to its top.
    function rerender() {
      var key = function (el) { return el.tagName + '.' + String(el.className || '').split(/\s+/).filter(function (c) { return c && !/^(is|has)-/.test(c); }).sort().join('.') + (el.dataset && el.dataset.tab ? '#' + el.dataset.tab : ''); };
      var kept = [];
      Array.prototype.forEach.call(host.querySelectorAll('*'), function (el) { if (el.scrollTop > 0) kept.push([key(el), el.scrollTop]); });
      window.mkRenderSkinPicker(host);
      if (!kept.length) return;
      var all = host.querySelectorAll('*');
      kept.forEach(function (k) { for (var i = 0; i < all.length; i++) if (key(all[i]) === k[0]) { all[i].scrollTop = k[1]; break; } });
    }
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
      + '<div class="mk-skin-quick">'
      + '<button type="button" class="mk-remix" title="Jauns, saskaņots izskats — katru reizi citāds"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.5c2 0 3.2.8 4.3 2.4l2.4 3.6c1.1 1.6 2.3 2.4 4.3 2.4H21M3 17h3.5c2 0 3.2-.8 4.3-2.4M13.2 11l.4-.6C14.7 8.8 15.9 8 17.9 8H21M18 5l3 3-3 3M18 13l3 3-3 3"/></svg><span>Remix</span></button>'
      + '<button type="button" class="mk-skin-undo" aria-label="Atsaukt pēdējo izmaiņu" title="Atsaukt"' + (undoStack(name).length ? '' : ' disabled') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button>'
      + '<button type="button" class="mk-contrast-btn" aria-expanded="' + contrastOpen + '" aria-label="Kontrasts: vai viss labi salasāms" title="Kontrasts"><b>Aa</b><i class="mk-contrast-dot" aria-hidden="true"></i></button>'
      + '</div>'
      + '<section class="mk-contrast" aria-label="Kontrasts"' + (contrastOpen ? '' : ' hidden') + '><p class="mk-contrast-wait">Mēra…</p></section>'
      + '<div class="mk-auto-palette"><div><strong>Auto krāsas</strong><small>Saskaņo ciparus, tekstu, efekta tinti, ietvaru un dekoru ar fonu</small></div>'
      + '<label class="mk-auto-toggle"><input type="checkbox" class="mk-auto-palette-toggle"' + (autoPaletteEnabled ? ' checked' : '') + '><span></span><b>Auto</b></label>'
      + '<button type="button" class="mk-auto-palette-now">Pieskaņot</button>'
      + '<div class="mk-auto-variants" role="group" aria-label="Fonam atbilstošas krāsas"></div></div>'
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
      + '<input type="color" class="mk-num-color" value="' + numberHex(draft) + '" title="Cipara krāsa">'
      + '<input type="range" class="mk-num-alpha" min="15" max="100" step="5" value="' + Math.round((draft.numA != null ? +draft.numA : 1) * 100) + '">'
      + '<span class="mk-num-alpha-val">' + Math.round((draft.numA != null ? +draft.numA : 1) * 100) + '%</span>'
      + '</div></div>';
    html += '<div class="mk-skin-tool mk-skin-tool-text"><div class="mk-skin-tool-head">Teksts</div><div class="mk-skin-custom">'
      + '<input type="color" class="mk-txt-color" value="' + (draft.txt ? rgbToHex(draft.txt) : '#ffffff') + '" title="Vārda un iniciāļu krāsa">'
      + '<button type="button" class="mk-txt-clear" title="Atiestatīt teksta krāsu">↺</button>'
      + '<div class="mk-txt-fx" role="group" aria-label="Teksta efekts">' + [['', 'Parasts'], ['f', 'Plakans'], ['g', 'Mirdzums'], ['o', 'Kontūra'], ['h', 'Ēna']].map(function (o) {
          return '<button type="button" data-txt-fx="' + o[0] + '" aria-pressed="' + ((draft.te || '') === o[0]) + '"><i class="mk-txtfx-sample' + (o[0] ? ' mk-txtfx-' + o[0] : '') + '" aria-hidden="true">Aa</i><b>' + o[1] + '</b></button>';
        }).join('') + '</div>'
      + '</div></div>';
    // Fonts: each tile writes the person's own first name in that style.
    var nfFirst = String(name || '').trim().split(/\s+/)[0] || 'Vārds';
    nfFirst = nfFirst.charAt(0).toUpperCase() + nfFirst.slice(1).toLowerCase();
    html += '<div class="mk-skin-tool mk-skin-tool-namestyle"><div class="mk-skin-tool-head">Fonts</div>'
      + '<div class="mk-nf-grid" role="group" aria-label="Kartītes fonts">' + NAME_STYLES.map(function (o) {
          return '<button type="button" data-name-style="' + o[0] + '" aria-pressed="' + ((draft.nf || '').toLowerCase() === o[0]) + '"><i class="mk-nf-sample' + (o[0] ? ' mk-nf-' + o[0] : '') + '" aria-hidden="true">' + skinEsc(nfFirst) + '</i><b>' + o[1] + '</b></button>';
        }).join('') + '</div>'
      + '<label class="mk-switch mk-nf-only-switch"><input type="checkbox" class="mk-nf-only-toggle"' + (draft.nf && draft.nf !== draft.nf.toLowerCase() ? ' checked' : '') + (draft.nf ? '' : ' disabled') + '><span></span><b>Tikai vārdam</b></label>'
      + '</div>';
    html += '<div class="mk-skin-tool mk-skin-tool-emoji"><div class="mk-skin-tool-head">Emoji fonā</div><div class="mk-skin-custom">'
      + '<label class="mk-switch"><input type="checkbox" class="mk-emoji-show"' + (emShown ? ' checked' : '') + '><span></span><b>Rādīt</b></label>'
      + '<input type="range" class="mk-emoji-op" min="4" max="60" step="2" value="' + (emShown ? emVal : 13) + '"' + (emShown ? '' : ' disabled') + '>'
      + '<span class="mk-emoji-op-val">' + (emShown ? emVal : 0) + '%</span>'
      + '<label class="mk-chk"><input type="checkbox" class="mk-emoji-neg"' + (draft.emn === '0' ? '' : ' checked') + '> Negatīvs</label>'
      + '<div class="mk-emoji-style" role="group" aria-label="Emoji izskats">' + [['', 'Fluent', ''], ['s', 'Sistēmas', 'mk-emoji-sys'], ['b', 'Melns', 'mk-emoji-black'], ['w', 'Balts', 'mk-emoji-white']].map(function (o) {
          return '<button type="button" data-emoji-style="' + o[0] + '" aria-pressed="' + ((draft.es || '') === o[0]) + '"><span class="mk-emoji-style-sample ' + o[2] + '" aria-hidden="true">😺</span><b>' + o[1] + '</b></button>';
        }).join('') + '</div>'
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
    html += '<section class="mk-skin-section' + (activeSkinSection === 'background' ? ' is-active' : '') + '" data-skin-panel="background"><div class="mk-skin-section-head"><strong>Izvēlies fonu</strong></div>'
      + (function(){
          var fx=draft.fx||'',kind=/^dither/.test(fx)?'dither':(['xray','halftone','duotone','ascii','focus','poster','split','mosaic','bricks','lines','led','pixelate','cmyk','riso','pointillism','heatmap','threshold','outline','posterize'].indexOf(fx)>=0?fx:'');
          var inked=kind&&!/^(xray|focus|split|mosaic|bricks|pixelate|cmyk|pointillism|heatmap|outline|posterize)$/.test(kind)&&fx!=='dithercolor';
          return '<div class="mk-dither-switch" data-pic-kind="'+kind+'"><div class="wf-segment mk-pic-effects" role="group" aria-label="Attēla efekts">'
          + [['','Nav'],['focus','Fokuss'],['split','Puse'],['poster','Plakāts'],['dither','Dither'],['halftone','Rastrs'],['cmyk','CMYK'],['led','LED punkti'],['riso','Riso'],['pixelate','Pikseļi'],['mosaic','Mozaīka'],['bricks','Kluči'],['pointillism','Punktisms'],['heatmap','Siltums'],['xray','Rentgens'],['duotone','Duotons'],['lines','Līnijas'],['threshold','Slieksnis'],['outline','Kontūra'],['posterize','Posterizācija'],['ascii','ASCII']].map(function(m){return '<button type="button" data-pic-effect="'+m[0]+'" aria-pressed="'+(kind===m[0])+'">'+m[1]+'</button>';}).join('')
          + '</div><div class="wf-segment mk-card-dither" role="group" aria-label="Dither"'+(kind==='dither'?'':' hidden')+'>'
          + [['dither','Tumšs'],['ditherpaper','Papīrs'],['dithercolor','Krāsains']].map(function(m){return '<button type="button" data-card-dither="'+m[0]+'" aria-pressed="'+(fx===m[0])+'">'+m[1]+'</button>';}).join('')
          + '</div><div class="mk-focus-hint"'+(kind==='focus'||kind==='split'?'':' hidden')+'>'+(kind==='split'?'Velc krāsu robežu kartītē':'Satver krāsaino lodziņu kartītē un pārvieto to')+'</div><div class="mk-pic-tune"'+(kind?'':' hidden')+'>'
          + (function(){var h=Math.round((parseFloat(draft.fxs)||1.55)*100),b=/^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(fx)&&draft.fxs!=null?Math.floor(h/10)%10:5,c=/^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(fx)&&draft.fxs!=null?h%10:5;
              // fxs "1.bc"; integer part 2 = older "effect also on the decoration" (kept as is;
              // the decoration now has its own effect in Dekori).
              return '<label><span>Smalkums</span><input type="range" min="0" max="9" step="1" value="'+b+'" data-pic-tune="b" aria-label="Smalkums"><output class="mk-pic-val">'+b+'</output></label>'
                + '<label><span>Kontrasts</span><input type="range" min="0" max="9" step="1" value="'+c+'" data-pic-tune="c" aria-label="Kontrasts"><output class="mk-pic-val">'+c+'</output></label>'
                ;})()
          + '</div><div class="mk-dither-inks" role="group" aria-label="Efekta krāsa"'+(inked?'':' hidden')+'>'
          + '<button type="button" class="mk-ink-auto" data-dither-ink="" title="Tinte no fona attēla" aria-pressed="'+!isCuratedInk(draft.num)+'">Auto</button>'
          + DITHER_INKS.map(function(c){return '<button type="button" data-dither-ink="'+c[0]+'" style="--ink:#'+c[0]+'" title="'+c[1]+'" aria-label="'+c[1]+'" aria-pressed="'+(String(draft.num||'')===hexToRgb('#'+c[0]))+'"></button>';}).join('')
          + '</div></div>';})() + '<div class="mk-bg-workspace"><div class="mk-bg-toolbar">'
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

    // Emoji fons: any emoji as the background (the person's own, which then follows it,
    // or any other from the Fluent set), in three layouts and four looks.
    var myEmoji = window.MinkaEmoji && window.MinkaEmoji.get ? window.MinkaEmoji.get(name) : '';
    var emoNow = draft.t === 'emo' ? /^([bcp])([0-3])(m?)-(.+)$/.exec(String(draft.id || '')) : null;
    var emoSpecNow = emoNow ? window.mkEmojiBackground.spec(draft.id, name) : null;
    var my3d = myEmoji && window.MinkaEmoji3D ? window.MinkaEmoji3D.decode(myEmoji) : null;
    var emoPicId = emoSpecNow && emoSpecNow.image ? emoSpecNow.tail.slice(1) : !emoNow && my3d ? my3d : '';
    var emoPic = emoPicId ? '<img src="' + skinEsc(window.MinkaEmoji3D.url(emoPicId, 128)) + '" alt="">' : '';
    var emoShown = emoNow ? (emoNow[3] && myEmoji ? myEmoji : (emoSpecNow || {}).emoji || (emoPic ? 'pic' : '')) : myEmoji;
    var emoGlyph = function (n) { return emoPic ? emoPic.repeat(n) : skinEsc(emoShown).repeat(n); };
    var emoMine = !!emoNow && !!emoNow[3];
    html += '<div class="mk-bg-panel mk-bg-emoji" data-bg-panel="emoji"><div class="mk-bg-emoji-head">Emoji fonā</div>'
      + '<div class="mk-bg-emoji-which">'
      + (myEmoji ? '<button type="button" class="mk-bg-emoji-mine" aria-pressed="' + emoMine + '"><i>' + (my3d ? '<img src="' + skinEsc(window.MinkaEmoji3D.url(my3d, 128)) + '" alt="">' : skinEsc(myEmoji)) + '</i><b>Mans emoji</b></button>' : '')
      + '<button type="button" class="mk-bg-emoji-other" aria-expanded="false" aria-pressed="' + (!!emoNow && !emoMine) + '"><i>' + (emoNow && !emoMine ? emoGlyph(1) : '＋') + '</i><b>' + (emoNow && !emoMine ? 'Cits emoji' : 'Izvēlēties citu') + '</b></button>'
      + '</div>'
      + '<div class="mk-bg-emoji-pop" hidden><div class="mk-bg-emoji-tabs" role="tablist" aria-label="Emoji grupas"></div><div class="mk-bg-emoji-grid"></div></div>'
      + (emoShown
        ? '<div class="mk-bg-emoji-layouts" role="group" aria-label="Emoji fona izkārtojums">' + [['b', 'Viens'], ['c', 'Stūrī'], ['p', 'Raksts']].map(function (l) {
            return '<button type="button" data-emo-layout="' + l[0] + '" aria-pressed="' + (!!emoNow && emoNow[1] === l[0]) + '"><span class="mk-emo-mini mk-emo-' + l[0] + '" aria-hidden="true">' + emoGlyph(l[0] === 'p' ? 6 : 1) + '</span><b>' + l[1] + '</b></button>';
          }).join('') + '</div>'
          + '<div class="mk-bg-emoji-looks" role="group" aria-label="Emoji fona izskats">' + [['0', 'Fluent'], ['1', 'Sistēmas'], ['2', 'Melns'], ['3', 'Balts']].map(function (o) {
            return '<button type="button" data-emo-look="' + o[0] + '" aria-pressed="' + (emoNow ? emoNow[2] === o[0] : o[0] === '0') + '">' + o[1] + '</button>';
          }).join('') + '</div>'
        : '')
      + '</div>';

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
        // No own name: no caption (a row of identical group names says nothing).
        var own = IMG_LABELS[id], label = own || grp.label;
        var imageUrl = stockSkinUrl(id);
        var material=window.MinkaFindCardMaterial(id);
        var imageStyle='url(&quot;'+skinEsc(imageUrl)+'&quot;)'+(material&&material.background?','+material.background:'');
        html += '<button type="button" class="mk-skin-thumb' + (act ? ' is-active' : '') + '" data-skin="' + id + '" data-src="' + skinEsc(imageUrl) + '" title="' + skinEsc(label) + '" aria-label="' + skinEsc(label) + '"'
          + ' aria-pressed="' + act + '"'
          + (categoryIndex === activeImageGroup ? ' style="background-image:' + imageStyle + '"' : '')
          + '>' + (own ? '<span><b>' + skinEsc(label) + '</b></span>' : '') + '</button>';
      });
      html += '</div>';
    });
    html += '</div></div></div></section></div></div>';

    html += '<div class="mk-skin-footer">'
      + '<button type="button" class="mk-skin-clear">✕ Noņemt visu izskatu</button></div>';
    host.innerHTML = html;
    fitSkinAside(host);

    var previewList = host.querySelector('.mk-skin-preview-list');
    var prev;
    if (previewSource && previewList) {
      prev = previewSource.cloneNode(true);
      prev.removeAttribute('data-worker');
      prev.setAttribute('data-emo-owner', name);   // "Mans emoji" backgrounds follow this person
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
    function livePreview(previewOnly) {
      window.mkApplySkinToEl(prev, hasAny(draft) ? draft : null);
      if (previewOnly) return;
      var k = normName(name);
      document.querySelectorAll('#grafiks-list .card[data-worker], .mk-next-person[data-next-worker]').forEach(function(c) {
        if (normName(c.getAttribute('data-worker') || c.getAttribute('data-next-worker')) === k) window.mkApplySkinToEl(c, hasAny(draft) ? draft : null);
      });
    }
    /* Dragging a colour or slider: the preview follows once per frame; the save
       (localStorage, the roster cards, the cloud) waits until the hand rests.
       On an old PC that is one card repaint per frame instead of every card and
       a 30 KB JSON write per input event. */
    var liveFrame = 0, liveSaveTimer = 0;
    function cancelLive() {
      if (liveFrame) { cancelAnimationFrame(liveFrame); liveFrame = 0; }
      clearTimeout(liveSaveTimer); liveSaveTimer = 0;
    }
    function flushLive() {
      if (!liveFrame && !liveSaveTimer) return;
      cancelLive();
      livePreview(true);
      setSkin(name, hasAny(draft) ? draft : null, true);
    }
    host.__flushLive = flushLive;
    function commit() {
      cancelLive();
      setSkin(name, hasAny(draft) ? draft : null);
      rerender();
    }
    // Save and repaint the cards, but keep the editor as it is: effect, colour and
    // tuning changes update their own controls in place (no rebuild, no flicker).
    function commitQuiet() {
      cancelLive();
      livePreview(true);
      setSkin(name, hasAny(draft) ? draft : null);
      try { host.dispatchEvent(new CustomEvent('mk-skin-quiet', { detail: { fx: draft.fx || '', num: draft.num || '' } })); } catch (_e) {}
    }
    function persistLive() {
      if (!liveFrame) liveFrame = requestAnimationFrame(function() { liveFrame = 0; livePreview(true); });
      clearTimeout(liveSaveTimer);
      liveSaveTimer = setTimeout(flushLive, 220);
    }
    function disableAutoPalette() {
      paletteRevision++;
      autoPaletteEnabled = false;
      var toggle = host.querySelector('.mk-auto-palette-toggle');
      if (toggle) toggle.checked = false;
    }
    // Colours from the background for everything at once (see harmonizeSkin);
    // force = the explicit "Pieskaņot" (also replaces a hand-picked ink).
    function applySuggestedPaletteThenCommit(force) {
      if (!autoPaletteEnabled && force !== true) { commit(); return; }
      var request = ++paletteRevision;
      suggestedPalette(draft).then(function(palette) {
        if (request !== paletteRevision) return;
        harmonizeSkin(draft, palette, { force: force === true });
        var addons = currentAddon(name);
        if (addons.length) setAddonQuiet(name, addons.map(function(a) { return harmonizeAddon(a, palette); }));
        contrastFixPending = true;
        commit();
      }).catch(function(){ if (request === paletteRevision) commit(); });
    }
    function rememberForUndo() { pushUndo(name, window.mkGetWorkerSkin(name)); }
    livePreview(true);

    var remixBtn = host.querySelector('.mk-remix');
    remixBtn.addEventListener('click', function() {
      if (remixBtn.getAttribute('aria-busy') === 'true') return;
      remixBtn.setAttribute('aria-busy', 'true');
      var request = ++paletteRevision, tries = 0, best = null;
      function pick() {
        return remixSkin(draft).then(function(result) {
          if (request !== paletteRevision) return null;
          return probeLook(result.skin, result.addon).then(function(rep) {
            var sc = window.MinkaContrast ? window.MinkaContrast.scoreOf(rep) : 1;
            tries++;
            if (!best || sc > best.sc) best = { result: result, sc: sc };
            return sc >= 1 || !rep || tries >= 5 ? best.result : pick();
          });
        });
      }
      pick().then(function(result) {
        if (!result || request !== paletteRevision) return;
        rememberForUndo();
        draft = result.skin;
        setAddonQuiet(name, result.addon);
        // Remix is often pressed several times in a row: the cloud gets the one kept.
        cancelLive();
        setSkin(name, draft, 1500);
        contrastFixPending = true;
        rerender();
      }).catch(function() { remixBtn.removeAttribute('aria-busy'); });
    });
    /* ── Kontrasts (WCAG 2, like colourcontrast.cc): every text on the preview
       against the pixels really under it. Measured once the effect picture is
       ready, after each change; Remix and Auto colours get one fixing pass
       (a part's own colour, same hue, nearest lightness that reads). */
    var cBtn = host.querySelector('.mk-contrast-btn'), cBox = host.querySelector('.mk-contrast'), cRun = 0, cReport = null, cFixWanted = 0;
    function afterPaint() {
      var D = window.MinkaDither, wait = D && D.settled ? D.settled() : Promise.resolve();
      return wait.then(function() { return new Promise(function(r) { requestAnimationFrame(function() { r(); }); }); });
    }
    function contrastSuggest(p) {
      var C = window.MinkaContrast, from = C.parseColor(p.fg);
      return C.suggest(from ? from.slice(0, 3) : [255, 255, 255], p.leaves, null);
    }
    function canOwnColour(skin) { skin = skin || draft; return !!(skin.face && skin.face.colors && skin.face.fullTintMode !== 3); }
    function applyContrastFix(p, skin) {
      skin = skin || draft;
      if (!canOwnColour(skin)) return false;
      var sg = contrastSuggest(p);
      if (!sg || !sg.color) return false;
      skin.face.colors[p.key] = sg.color.slice(1);
      return true;
    }
    /* Try a look on a hidden copy of the preview (same size and styles, off
       screen): measure it, give failing parts a readable colour once, measure
       again. Nothing on screen changes while Remix picks. */
    function probeLook(skin, addon) {
      var C = window.MinkaContrast;
      if (!C || !prev || !prev.parentNode) return Promise.resolve(null);
      var c = prev.cloneNode(true);
      c.classList.add('mk-contrast-probe');
      c.setAttribute('aria-hidden', 'true');
      c.style.position = 'absolute'; c.style.left = '-10000px'; c.style.top = '0'; c.style.pointerEvents = 'none';
      prev.parentNode.appendChild(c);
      function paint() {
        window.mkApplySkinToEl(c, skin);
        var A = window.MinkaCardAddons;
        if (A && A.applyTo) A.applyTo(c, addon ? (Array.isArray(addon) ? addon : [addon]) : []);
        return afterPaint().then(function() { return C.audit(c); });
      }
      return paint().then(function(rep) {
        if (rep && !rep.ok && rep.parts.filter(function(p) { return !p.pass; }).map(function(p) { return applyContrastFix(p, skin); }).some(Boolean)) return paint();
        return rep;
      }).then(function(rep) { c.remove(); return rep; }, function() { c.remove(); return null; });
    }
    function contrastCheck(fixRounds) {
      if (!window.MinkaContrast || !prev) return;
      // A newer check replaces an older one but keeps the fixing it was asked to do.
      cFixWanted = Math.max(cFixWanted, fixRounds || 0);
      var run = ++cRun;
      afterPaint().then(function() {
        if (run !== cRun || !prev.isConnected) return null;
        return window.MinkaContrast.audit(prev);
      }).then(function(rep) {
        if (!rep || run !== cRun) return;
        var rounds = cFixWanted; cFixWanted = 0;
        if (rounds > 0 && !rep.ok && canOwnColour()) {
          var changed = rep.parts.filter(function(p) { return !p.pass; }).map(function(p) { return applyContrastFix(p); }).some(Boolean);
          if (changed) { livePreview(); setSkin(name, draft, 1500); contrastCheck(rounds - 1); return; }
        }
        cReport = rep;
        renderContrast(rep);
        if (host.__onContrast) try { host.__onContrast(rep); } catch (_e) {}
      }).catch(function() {});
    }
    function badge(ok, label) { return '<span class="mk-c-badge ' + (ok ? 'is-pass' : 'is-fail') + '"><b>' + (ok ? 'Pass ✓' : 'Fail ✕') + '</b><small>' + label + '</small></span>'; }
    function renderContrast(rep) {
      var fails = rep.parts.filter(function(p) { return !p.pass; });
      if (cBtn) {
        cBtn.dataset.state = rep.unknown ? 'unknown' : fails.length ? 'fail' : 'pass';
        cBtn.title = rep.unknown ? 'Kontrasts: šo fonu nevar izmērīt' : fails.length ? 'Kontrasts: ' + fails.length + ' slikti salasāmi' : 'Kontrasts: viss labi salasāms';
      }
      if (!cBox || cBox.hidden) return;
      if (rep.unknown || !rep.parts.length) { cBox.innerHTML = '<p class="mk-contrast-wait">Šo fonu nevar izmērīt (attēls no citas vietnes).</p>'; return; }
      var w = rep.worst, lv = w.levels;
      var html = '<div class="mk-contrast-head"><span class="mk-contrast-sample" style="background:' + w.bg + ';color:' + w.fg + '">Aa</span>'
        + '<div><strong>' + w.ratio.toFixed(2) + '</strong><small>' + (fails.length ? 'Vājākais: ' + skinEsc(w.label) : 'Viss labi salasāms') + '</small></div></div>'
        + '<div class="mk-contrast-badges">' + badge(lv.aaLarge, 'AA liels') + badge(lv.aaaLarge, 'AAA liels') + badge(lv.aa, 'AA') + badge(lv.aaa, 'AAA') + '</div>'
        + '<ul class="mk-contrast-list">';
      // A colour is offered only where it really helps: on a very busy spot the best
      // colour can be the one already there (Mainīt then did nothing) — the dark tone
      // calms the picture instead.
      var darkOk = !!(draft.face && draft.face.fullTintMode !== 1), fixable = 0;
      function helps(p, sg) { return !!sg && (sg.reaches || sg.ratio > p.ratio / p.need + .03); }
      // a plate behind just that element (none yet, or a clear one)
      function plateOk(key) { var M = window.MinkaCardFaceModel; return !!(draft.face && M && (M.plateParts || []).indexOf(key) >= 0 && draft.face.face !== 'winamp' && !((draft.face.plates || {})[key] % 2)); }
      rep.parts.slice().sort(function(a, b) { return a.ratio / a.need - b.ratio / b.need; }).forEach(function(p) {
        var sg = p.pass ? null : contrastSuggest(p), can = canOwnColour() && helps(p, sg);
        if (can) fixable++;
        html += '<li class="' + (p.pass ? 'is-pass' : 'is-fail') + '" data-contrast-part="' + p.key + '">'
          + '<span class="mk-contrast-sw" style="background:' + p.bg + ';color:' + p.fg + '">Aa</span>'
          + '<span class="mk-contrast-name">' + skinEsc(p.label) + '<small>' + (p.large ? 'liels teksts, vajag 3' : p.caption ? 'paraksts, vajag 3' : 'mazs teksts, vajag 4.5') + '</small></span>'
          + '<b class="mk-contrast-ratio">' + p.ratio.toFixed(2) + '</b>'
          + (p.pass ? '<span class="mk-c-mini is-pass">Pass ✓</span>'
            : can ? '<button type="button" class="mk-contrast-fix" data-contrast-fix="' + p.key + '" title="Mainīt uz ' + sg.color + '"><i style="background:' + sg.color + '"></i>Mainīt</button>'
            : sg && !sg.reaches && plateOk(p.key) ? '<button type="button" class="mk-contrast-fix" data-contrast-plate="' + p.key + '" title="Tumša plāksne aiz šī elementa">Plāksne</button>'
            : sg && !sg.reaches && darkOk ? '<button type="button" class="mk-contrast-fix mk-contrast-dark" title="Tumšs tonis nomierina raibo fonu">Tumšs tonis</button>'
            : '<span class="mk-c-mini is-fail">Fail ✕</span>')
          + (sg && !sg.reaches ? '<p class="mk-contrast-note">Fons zem šī ir ļoti raibs: labāk pārvieto to vai izvēlies mierīgāku efektu.</p>' : '')
          + '</li>';
      });
      html += '</ul>';
      // Where no colour reads (a busy spot), the dark tone calms the picture itself.
      var stuck = fails.some(function(p) { var sg = contrastSuggest(p); return sg && !sg.reaches; });
      if (stuck && draft.face && draft.face.fullTintMode !== 1) html += '<p class="mk-contrast-note">Dažviet fons ir pārāk raibs jebkurai krāsai. Tumšs tonis nomierina bildi.</p><button type="button" class="mk-contrast-dark">Ieslēgt tumšu toni</button>';
      if (fixable && canOwnColour()) html += '<button type="button" class="mk-contrast-fixall">Salabot visu (' + fixable + ')</button>';
      else if (fails.length && !canOwnColour()) html += '<p class="mk-contrast-note">Izskats "Tonēts" krāso visu vienā tonī: izvēlies citu izskatu, lai varētu mainīt krāsas.</p>';
      cBox.innerHTML = html;
    }
    if (cBtn) cBtn.addEventListener('click', function() {
      contrastOpen = !contrastOpen;
      cBtn.setAttribute('aria-expanded', String(contrastOpen));
      cBox.hidden = !contrastOpen;
      if (contrastOpen) { if (cReport) renderContrast(cReport); else contrastCheck(0); }
    });
    if (cBox) {
      cBox.addEventListener('click', function(e) {
        var one = e.target.closest('[data-contrast-fix]'), all = e.target.closest('.mk-contrast-fixall');
        var plate = e.target.closest('[data-contrast-plate]');
        if (plate && draft.face) {
          rememberForUndo(); draft.face.plates = draft.face.plates || {}; draft.face.plates[plate.dataset.contrastPlate] = 1;
          livePreview(); setSkin(name, draft, 1500); contrastCheck(1);
          var u0 = host.querySelector('.mk-skin-undo'); if (u0) u0.disabled = false;
          return;
        }
        if (e.target.closest('.mk-contrast-dark') && draft.face) {
          rememberForUndo(); draft.face.fullTintMode = 1;
          livePreview(); setSkin(name, draft, 1500); contrastCheck(1);
          return;
        }
        if ((!one && !all) || !cReport) return;
        rememberForUndo();
        cReport.parts.filter(function(p) { return !p.pass && (all || p.key === one.dataset.contrastFix); }).forEach(function(p) { applyContrastFix(p); });
        livePreview(); setSkin(name, draft, 1500);
        var u = host.querySelector('.mk-skin-undo'); if (u) u.disabled = false;
        contrastCheck(all ? 1 : 0);
      });
      // Pointing at a row outlines that element on the preview.
      cBox.addEventListener('pointerover', function(e) {
        var li = e.target.closest('[data-contrast-part]');
        prev.querySelectorAll('.mk-contrast-flag').forEach(function(el) { el.classList.remove('mk-contrast-flag'); });
        if (li) { var el = prev.querySelector('[data-wf-part="' + li.dataset.contrastPart + '"]'); if (el) el.classList.add('mk-contrast-flag'); }
      });
      cBox.addEventListener('pointerleave', function() { prev.querySelectorAll('.mk-contrast-flag').forEach(function(el) { el.classList.remove('mk-contrast-flag'); }); });
    }
    // The host outlives each render: swap the listener instead of stacking them.
    if (host.__contrastQuiet) host.removeEventListener('mk-skin-quiet', host.__contrastQuiet);
    host.__contrastQuiet = function() { contrastCheck(0); };
    host.addEventListener('mk-skin-quiet', host.__contrastQuiet);
    (function() { var fix = contrastFixPending; contrastFixPending = false; contrastCheck(fix ? 2 : 0); })();

    // Būvētājs: live changes on the preview only (the roster follows when it closes).
    host.__builderCtx = {
      name: name,
      preview: prev,
      draft: function() { return draft; },
      set: function(next, opts) {
        draft = next;
        cancelLive();
        livePreview(true);
        setSkin(name, hasAny(draft) ? draft : null, 1500);
        contrastCheck(opts && opts.fix ? 1 : 0);
      },
      addons: function() { return currentAddon(name); },
      setAddons: function(list) {
        setAddonQuiet(name, list && list.length ? list : null);
        var A = window.MinkaCardAddons;
        if (A && A.applyTo) A.applyTo(prev, list || []);
        // Room above/below the preview for decorations that reach past the card
        // (toppers, charms), as the Dekori panel leaves it.
        requestAnimationFrame(function() {
          var slot = prev.closest('.mk-skin-preview-slot'); if (!slot) return;
          var cr = prev.getBoundingClientRect(), top = Infinity, bottom = -Infinity;
          prev.querySelectorAll(':scope > .mk-card-addon').forEach(function(im) { var r = im.getBoundingClientRect(); if (!r.width) return; top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); });
          var t = top === Infinity ? 0 : Math.max(0, cr.top - top), b = bottom === -Infinity ? 0 : Math.max(0, bottom - cr.bottom);
          slot.style.setProperty('--mk-addon-preview-top-clearance', Math.ceil(t + (t ? 12 : 0)) + 'px');
          slot.style.setProperty('--mk-addon-preview-bottom-clearance', Math.ceil(b + (b ? 12 : 0)) + 'px');
          if (A && A.fitPreviewControls) A.fitPreviewControls(slot);
        });
        contrastCheck(0);
      },
      report: function() { return cReport; },
      fixContrast: function() {
        if (!cReport) return false;
        var changed = cReport.parts.filter(function(p) { return !p.pass; }).map(function(p) { return applyContrastFix(p); }).some(Boolean);
        if (changed) { livePreview(true); setSkin(name, draft, 1500); contrastCheck(1); }
        return changed;
      },
      undoPush: rememberForUndo,
      finish: function() { cancelLive(); livePreview(); setSkin(name, hasAny(draft) ? draft : null); rerender(); }
    };

    /* Fokuss: drag the colour lens on the preview. Only two CSS variables move
       (the lens picture is the card's own crop, aligned in CSS), so nothing is
       recomputed while dragging; the position is saved on release. Elements on
       the card keep their own drag (they are on top of the lens). */
    var previewListEl = host.querySelector('.mk-skin-preview-list');
    if (previewListEl) previewListEl.addEventListener('pointerdown', function(e) {
      var split = draft.fx === 'split';
      if (e.button !== 0 || (draft.fx !== 'focus' && !split) || (e.target.closest && e.target.closest('.mk-card-addon'))) return;
      var lens = prev.querySelector('.mk-focus-win');
      if (!lens) return;
      var r = lens.getBoundingClientRect(), card = prev.getBoundingClientRect(), pad = 7;
      if (!card.width || (!split && (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad))) return;
      // In Efekti the lens is what is being edited, so it wins over the numeral on top
      // of it; elsewhere only its frame (edges, corners) grabs it.
      var onEdge = split ? Math.abs(e.clientX - r.right) <= 10 : Math.min(Math.abs(e.clientX - r.left), Math.abs(e.clientX - r.right), Math.abs(e.clientY - r.top), Math.abs(e.clientY - r.bottom)) <= pad;
      // Puse: the colour half is the whole left part; only its edge (the divider) moves.
      if (split) { r = { left: card.left, right: r.right, top: card.top, bottom: card.bottom }; if (!onEdge && !(host.__org && host.__org.tab && host.__org.tab() === 'effects')) return; }
      var onEffects = host.__org && host.__org.tab && host.__org.tab() === 'effects';
      if (!onEffects && !onEdge && e.target.closest && e.target.closest('[data-wf-part]')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var start = String(draft.fl || (split ? '50,50' : '35,44')).split(',').map(Number), x0 = e.clientX, y0 = e.clientY, id = e.pointerId, pos = start;
      // In Efekti a press anywhere on the card puts the divider there.
      if (split && !onEdge) { start = [Math.round((e.clientX - card.left) / card.width * 100), 50]; pos = start; prev.style.setProperty('--mk-focus-x', start[0]); }
      prev.classList.add('is-moving-focus');
      try { previewListEl.setPointerCapture(id); } catch (_e) {}
      function move(ev) {
        if (ev.pointerId !== id) return;
        pos = split ? [Math.max(8, Math.min(92, Math.round(start[0] + (ev.clientX - x0) / card.width * 100))), 50]
          : [Math.max(21, Math.min(79, Math.round(start[0] + (ev.clientX - x0) / card.width * 100))),
          Math.max(27, Math.min(73, Math.round(start[1] + (ev.clientY - y0) / card.height * 100)))];
        prev.style.setProperty('--mk-focus-x', pos[0]); prev.style.setProperty('--mk-focus-y', pos[1]);
      }
      function end(ev) {
        if (ev.pointerId !== id) return;
        previewListEl.removeEventListener('pointermove', move); previewListEl.removeEventListener('pointerup', end); previewListEl.removeEventListener('pointercancel', end);
        prev.classList.remove('is-moving-focus');
        if (split ? pos[0] === 50 : pos[0] === 35 && pos[1] === 44) delete draft.fl; else draft.fl = pos.join(',');
        commitQuiet();
      }
      previewListEl.addEventListener('pointermove', move); previewListEl.addEventListener('pointerup', end); previewListEl.addEventListener('pointercancel', end);
    }, true);
    // A grab cursor over the lens tells it can be moved (only with Fokuss on).
    if (previewListEl) previewListEl.addEventListener('pointermove', function(e) {
      if ((draft.fx !== 'focus' && draft.fx !== 'split') || e.buttons) return;
      var lens = prev.querySelector('.mk-focus-win'), r = lens && lens.getBoundingClientRect();
      var over = draft.fx === 'split' ? !!r && Math.abs(e.clientX - r.right) <= 10
        : !!r && e.clientX >= r.left - 7 && e.clientX <= r.right + 7 && e.clientY >= r.top - 7 && e.clientY <= r.bottom + 7;
      prev.classList.toggle('can-move-focus', over);
    }, { passive: true });
    host.querySelector('.mk-skin-undo').addEventListener('click', function() {
      var step = undoStack(name).pop();
      if (!step) return;
      paletteRevision++;
      draft = step.skin || {};
      setAddonQuiet(name, step.addon);
      cancelLive();
      setSkin(name, hasAny(draft) ? draft : null, 600);
      rerender();
    });

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
    var variantsBox = host.querySelector('.mk-auto-variants');
    if (variantsBox) suggestedPalette(draft).then(function (pal) {
      if (!variantsBox.isConnected) return;
      var list = paletteVariants(pal), rgb = function (t) { return 'rgb(' + String(t).split(',').map(Math.round).join(',') + ')'; };
      variantsBox.innerHTML = list.map(function (v, i) {
        var on = String(draft.num || '') === String(v.num);
        return '<button type="button" class="mk-auto-var" data-var="' + i + '" aria-pressed="' + on + '" title="' + (i ? 'Cits saskaņots variants' : 'Fona paša krāsas') + '" style="--v-bg:' + rgb(v.source) + ';--v-num:' + rgb(v.num) + ';--v-txt:' + rgb(v.txt) + '"><b>24</b><i></i></button>';
      }).join('');
      variantsBox.querySelectorAll('.mk-auto-var').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = list[+b.dataset.var]; if (!v) return;
          rememberForUndo(); disableAutoPalette();
          harmonizeSkin(draft, v, { force: true });
          var addons = currentAddon(name);
          if (addons.length) setAddonQuiet(name, addons.map(function (a) { return harmonizeAddon(a, v); }));
          contrastFixPending = true; commit();
        });
      });
    }, function () {});
    var autoToggle = host.querySelector('.mk-auto-palette-toggle');
    autoToggle.addEventListener('change', function() {
      autoPaletteEnabled = autoToggle.checked;
    });
    host.querySelector('.mk-auto-palette-now').addEventListener('click', function() {
      autoPaletteEnabled = true;
      autoToggle.checked = true;
      rememberForUndo();
      applySuggestedPaletteThenCommit(true);
    });

    // Emoji fons: which emoji, a layout or a look sets it (keeping the rest); the picture is
    // drawn first, so the auto colours can read it.
    function setEmojiBg(layout, look, pick) {
      var mine = window.MinkaEmoji && window.MinkaEmoji.get ? window.MinkaEmoji.get(name) : '';
      var cur = draft.t === 'emo' ? /^([bcp])([0-3])(m?)-(.+)$/.exec(String(draft.id || '')) : null;
      var follow = pick ? pick === 'mine' : cur ? !!cur[3] : !!mine;
      // the tail: a 3D picture ("x…") as is, an emoji as its code points
      var tail = pick && pick.charAt(0) === 'x' ? pick
        : pick && pick !== 'mine' ? window.mkEmojiBackground.codes(pick)
        : follow && mine ? window.mkEmojiBackground.tail(mine)
        : cur ? cur[4] : mine ? window.mkEmojiBackground.tail(mine) : '';
      if (!tail) return;
      var id = (layout || (cur ? cur[1] : 'b')) + (look != null ? look : (cur ? cur[2] : '0')) + (follow && mine ? 'm' : '') + '-' + tail;
      rememberForUndo();
      draft = Object.assign({}, draft, { t: 'emo', id: id }); delete draft.rgb;
      var sp = window.mkEmojiBackground.spec(id, name);
      (sp ? window.mkEmojiBackground.paint(sp) : Promise.resolve()).then(function () { applySuggestedPaletteThenCommit(); }, function () { commit(); });
    }
    host.querySelectorAll('[data-emo-layout]').forEach(function (b) { b.addEventListener('click', function () { setEmojiBg(b.dataset.emoLayout, null); }); });
    host.querySelectorAll('[data-emo-look]').forEach(function (b) { b.addEventListener('click', function () { setEmojiBg(null, b.dataset.emoLook); }); });
    var emoMineBtn = host.querySelector('.mk-bg-emoji-mine');
    if (emoMineBtn) emoMineBtn.addEventListener('click', function () { setEmojiBg(null, null, 'mine'); });
    // "Cits emoji": the Fluent set by group, built when first opened
    var emoOther = host.querySelector('.mk-bg-emoji-other'), emoPop = host.querySelector('.mk-bg-emoji-pop');
    if (emoOther && emoPop) {
      var cat = window.MinkaEmoji && window.MinkaEmoji.catalogue ? window.MinkaEmoji.catalogue() : null;
      var groups = cat ? cat.sections.filter(function (g) { return g.id !== 'all' && cat.bySection[g.id] && cat.bySection[g.id].length; }) : [];
      var E3 = window.MinkaEmoji3D;
      if (E3) E3.sets.forEach(function (st) { var first = E3.list(st[0])[0]; if (first) groups.push({ id: '3d-' + st[0], set: st[0], title: st[1], icon: E3.url(first.id, 128) }); });
      var paintGroup = function (id) {
        emoPop.querySelectorAll('[data-emo-group]').forEach(function (t) { var on = t.dataset.emoGroup === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); });
        var g = groups.filter(function (x) { return x.id === id; })[0];
        emoPop.querySelector('.mk-bg-emoji-grid').innerHTML = g && g.set
          ? E3.list(g.set).map(function (it) { return '<button type="button" class="is-pic" data-emo-pick="x' + it.id + '" title="' + skinEsc(it.label) + '"><img loading="lazy" decoding="async" src="' + skinEsc(E3.url(it.id, 128)) + '" alt=""></button>'; }).join('')
          : (cat.bySection[id] || []).map(function (e) { return '<button type="button" data-emo-pick="' + skinEsc(e) + '" title="' + skinEsc(cat.names[e] || '') + '">' + skinEsc(e) + '</button>'; }).join('');
      };
      emoOther.addEventListener('click', function () {
        var open = emoPop.hidden;
        emoPop.hidden = !open; emoOther.setAttribute('aria-expanded', String(open));
        if (open && cat && !emoPop.dataset.built) {
          emoPop.dataset.built = '1';
          emoPop.querySelector('.mk-bg-emoji-tabs').innerHTML = groups.map(function (g) { return '<button type="button" role="tab" data-emo-group="' + g.id + '" title="' + skinEsc(g.title) + '">' + (g.icon ? '<img src="' + skinEsc(g.icon) + '" alt="">' : skinEsc(g.label)) + '</button>'; }).join('');
          paintGroup(groups.length > 4 ? groups[3].id : (groups[0] || {}).id);
        }
      });
      emoPop.addEventListener('click', function (e) {
        var t = e.target.closest('[data-emo-group]'); if (t) { paintGroup(t.dataset.emoGroup); return; }
        var p = e.target.closest('[data-emo-pick]'); if (p) setEmojiBg(null, null, p.dataset.emoPick);
      });
    }
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
        card: previewCard || null,
        numberColor: draft.num ? 'rgba(' + draft.num + ',' + (draft.numA != null ? draft.numA : 1) + ')' : (previewCard && previewCard.classList.contains('card-rd') ? '#ff5a55' : numberHex(draft)),
        textColor: draft.txt ? 'rgb(' + draft.txt + ')' : '#ffffff',
        onSave: async function(blob) {
          var artwork = await uploadArt(name, blob);
          rememberForUndo();
          draft=Object.assign({},draft,{t:'art',id:artwork.id}); delete draft.rgb;
          applySuggestedPaletteThenCommit();
        }
      });
    });

    function bundleSkin(p) {
      var skin=JSON.parse(JSON.stringify(p.bg));
      skin.face=JSON.parse(JSON.stringify(p.face));
      if(draft.face){skin.face.coffeeMode=draft.face.coffeeMode;skin.face.coffeeContrast=draft.face.coffeeContrast;skin.face.colors=draft.face.colors;skin.face.fullTintMode=draft.face.fullTintMode;skin.face.fullTintHue=draft.face.fullTintHue;skin.face.fullTintIntensity=draft.face.fullTintIntensity;skin.face.fullTintAuto=draft.face.fullTintAuto;skin.face.fullTintScheme=draft.face.fullTintScheme;}
      if(draft.face&&!p.keepParts)Object.keys(draft.face.parts).forEach(function(key){skin.face.parts[key][3]=draft.face.parts[key][3];});
      if(p.keepParts&&draft.face)skin.face.colors.moon=draft.face.colors&&draft.face.colors.moon||'';
      skin.num=p.num;skin.numA=p.na;skin.em='0';
      if(p.fx)skin.fx=p.fx;
      if(p.fl)skin.fl=p.fl;
      if(p.fxs)skin.fxs=p.fxs;
      if(p.tm)skin.tm=p.tm;
      if(p.depth===false)skin.depth=false;
      if(p.txt)skin.txt=p.txt;
      // The person's analog timer on a layout drawn for the small chip: give it a free spot.
      if(draft.tm&&!p.tm){skin.tm=draft.tm;if(/^[a-h]/.test(skin.tm))window.MinkaCardFaceModel.fitDial(skin.face);}
      return skin;
    }
    // Each preset is a full clone of the card: build them only as they come into
    // view, a few per frame, so opening Izskats never waits for the whole gallery.
    if(host.__bundleIO){host.__bundleIO.disconnect();host.__bundleIO=null;}
    var bundleQueue=[],bundleFrame=0;
    function pumpBundles(){
      bundleFrame=0;
      var t0=performance.now();
      while(bundleQueue.length&&performance.now()-t0<12)buildBundle(bundleQueue.shift());
      if(bundleQueue.length)bundleFrame=requestAnimationFrame(pumpBundles);
      else window.MinkaCardFaces.refreshPreview();
    }
    function renderBundles(){
      if(!previewSource||!host.querySelector('[data-skin-panel="presets"].is-active'))return;
      var todo=Array.prototype.filter.call(host.querySelectorAll('.mk-skin-preset'),function(b){return !b.hidden&&!b.dataset.built;});
      if(!window.IntersectionObserver){todo.forEach(buildBundle);window.MinkaCardFaces.refreshPreview();return;}
      if(!host.__bundleIO)host.__bundleIO=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting||!en.target.isConnected)return;
          host.__bundleIO.unobserve(en.target);
          if(bundleQueue.indexOf(en.target)<0)bundleQueue.push(en.target);
        });
        if(bundleQueue.length&&!bundleFrame)bundleFrame=requestAnimationFrame(pumpBundles);
      },{rootMargin:'300px 0px'});
      todo.forEach(function(b){host.__bundleIO.observe(b);});
    }
    function buildBundle(button){
      if(button.hidden||button.dataset.built||!button.isConnected)return;
      button.dataset.built='1';
      var card=previewSource.cloneNode(true),stage=button.querySelector('.mk-preset-stage');
      card.removeAttribute('style');card.removeAttribute('id');card.removeAttribute('data-worker');
      card.querySelectorAll('[id],[data-worker]').forEach(function(el){el.removeAttribute('id');el.removeAttribute('data-worker');});
      card.querySelectorAll('.mk-card-addon,.mk-card-addon-surface,.mk-wf-art,.mk-wf-depth,.mk-wf-effects,.mk-focus,.mk-poster,.mk-wf-dial').forEach(function(el){el.remove();});
      card.querySelectorAll('button,input,select,textarea,a').forEach(function(el){var span=document.createElement('span');span.className=el.className;span.innerHTML=el.innerHTML;el.replaceWith(span);});
      card.classList.add('mk-preset-card');card.classList.remove('mk-skin-preview-real','wf-scaled-preview','wf-editing');
      stage.id='grafiks-list';stage.classList.add('grid-view');stage.appendChild(card);
      var preset=PRESETS[+button.dataset.preset];
      window.mkApplySkinToEl(card,bundleSkin(preset));
      if(preset.addons&&window.MinkaCardAddons&&window.MinkaCardAddons.applyTo)window.MinkaCardAddons.applyTo(card,preset.addons);
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
      b.addEventListener('click',function(){
        var p=PRESETS[+b.dataset.preset];
        rememberForUndo();draft=bundleSkin(p);disableAutoPalette();
        // A whole look brings its decoration (the old ones can come back with Atsaukt).
        if(p.addons)setAddonQuiet(name,JSON.parse(JSON.stringify(p.addons)));
        commit();
        // The look's layout drawn for other names and numbers: make room where they collide (card-faces settle).
        // (Not for the new layouts: they are drawn on their own grid, and the card must look like its tile.)
        if(!p.keepLayout)requestAnimationFrame(function(){ if(window.MinkaCardFaces&&window.MinkaCardFaces.settle)window.MinkaCardFaces.settle(); });
      });
    });
    host.querySelector('[data-skin-section="presets"]').addEventListener('click',renderBundles);
    renderBundles();
    host.querySelectorAll('.mk-skin-grad-sw').forEach(function(b) {
      b.addEventListener('click', function() {
        rememberForUndo();
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
        if (draft.t === 'img' && draft.id === b.dataset.skin) return;
        rememberForUndo();
        draft.t = 'img'; draft.id = b.dataset.skin; delete draft.rgb;
        applySuggestedPaletteThenCommit();
      });
    });
    host.querySelectorAll('.mk-skin-hue').forEach(function(b) {
      b.addEventListener('click', function() {
        rememberForUndo();
        draft.t = 'hue'; draft.rgb = b.dataset.rgb; delete draft.id;
        applySuggestedPaletteThenCommit();
      });
    });
    var bgInp = host.querySelector('.mk-skin-color');
    bgInp.addEventListener('input', function() { draft.t = 'hue'; draft.rgb = hexToRgb(bgInp.value); delete draft.id; persistLive(); });
    bgInp.addEventListener('change', function() { applySuggestedPaletteThenCommit(); });
    var numInp = host.querySelector('.mk-num-color');
    // The number's own colour: on a face with its own number colour that one,
    // else the face tint. "num" follows unless it is the picture effect's ink.
    numInp.addEventListener('input', function() {
      disableAutoPalette();
      var hex = numInp.value.slice(1);
      if (draft.face) {
        if (draft.face.colors && draft.face.colors.hours) draft.face.colors.hours = hex; else draft.face.tint = hex;
      }
      if (!draft.face || !INK_FX.test(draft.fx || '') || draft.face.face === 'dither') draft.num = hexToRgb(numInp.value);
      if (draft.numA == null) draft.numA = '1';
      persistLive();
    });
    numInp.addEventListener('change', commit);
    var aInp = host.querySelector('.mk-num-alpha');
    var aVal = host.querySelector('.mk-num-alpha-val');
    aInp.addEventListener('input', function() {
      disableAutoPalette();
      draft.numA = String((+aInp.value / 100).toFixed(2));
      if (!draft.num) draft.num = hexToRgb(numberHex(draft));
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
    host.querySelectorAll('[data-name-style]').forEach(function (b) {
      b.addEventListener('click', function () {
        rememberForUndo();
        var only = !!(draft.nf && draft.nf !== draft.nf.toLowerCase());
        if (b.dataset.nameStyle) draft.nf = only ? b.dataset.nameStyle.toUpperCase() : b.dataset.nameStyle; else delete draft.nf;
        commit();
      });
    });
    var nfOnly = host.querySelector('.mk-nf-only-toggle');
    if (nfOnly) nfOnly.addEventListener('change', function () {
      if (!draft.nf) return;
      rememberForUndo();
      draft.nf = nfOnly.checked ? draft.nf.toUpperCase() : draft.nf.toLowerCase();
      commit();
    });
    host.querySelectorAll('[data-txt-fx]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.txtFx) draft.te = b.dataset.txtFx; else delete draft.te;
        commit();
      });
    });
    window.mkPaintEmojiLookSamples(host.querySelector('.mk-emoji-style'), window.MinkaEmoji && window.MinkaEmoji.get(name));
    host.querySelectorAll('[data-emoji-style]').forEach(function (b) {
      b.addEventListener('click', function () {
        disableAutoPalette();
        if (b.dataset.emojiStyle) draft.es = b.dataset.emojiStyle; else delete draft.es;
        commit();
      });
    });
    // Per-card dither effect (stored in the skin's fx slot, which the API already accepts).
    // One picture effect per card (skin fx): dither variants, rentgens, rastrs, duotons, ascii.
    function setPicEffect(v) {
      // Switching between effects keeps the tuning (and an older decoration flag).
      if (v) { draft.fx = v; packTune(); if (draft.fxs === '1.55') delete draft.fxs; } else if (/^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(draft.fx || '')) { delete draft.fx; delete draft.fxs; }
      var kind = /^dither/.test(v) ? 'dither' : v, box = host.querySelector('.mk-dither-switch');
      if (box) {
        box.dataset.picKind = kind || '';
        box.querySelector('.mk-card-dither').hidden = kind !== 'dither';
        box.querySelector('.mk-dither-inks').hidden = !kind || /^(xray|focus|split|mosaic|bricks|pixelate|cmyk|pointillism|heatmap|outline|posterize)$/.test(kind) || v === 'dithercolor';
        box.querySelector('.mk-pic-tune').hidden = !kind;
        var hint = box.querySelector('.mk-focus-hint');
        hint.hidden = kind !== 'focus' && kind !== 'split';
        hint.textContent = kind === 'split' ? 'Velc krāsu robežu kartītē' : 'Satver krāsaino lodziņu kartītē un pārvieto to';
        box.querySelectorAll('[data-pic-effect]').forEach(function(x){ x.setAttribute('aria-pressed', String(x.dataset.picEffect === (kind || ''))); });
        box.querySelectorAll('[data-card-dither]').forEach(function(x){ x.setAttribute('aria-pressed', String(x.dataset.cardDither === v)); });
      }
      host.querySelectorAll('.mk-skin-fx').forEach(function(x){ var on=(draft.fx||'')===x.dataset.fx; x.classList.toggle('is-on',on); x.setAttribute('aria-pressed',String(on)); });
      // Auto colours: a new effect gets the ink that suits it (dark ground or paper),
      // unless one of the ready inks was picked by hand.
      if (autoPaletteEnabled && INK_FX.test(draft.fx || '') && !isCuratedInk(draft.num)) { autoInk(); return; }
      commitQuiet();
    }
    function syncInks() {
      var curated = isCuratedInk(draft.num);
      host.querySelectorAll('[data-dither-ink]').forEach(function(x) {
        x.setAttribute('aria-pressed', String(x.dataset.ditherInk ? hexToRgb('#' + x.dataset.ditherInk) === String(draft.num || '') : !curated));
      });
      var numInput = host.querySelector('.mk-num-color'); if (numInput) numInput.value = numberHex(draft);
    }
    function setInk(rgb) {
      draft.num = rgb.join(','); draft.numA = '1';
      if (draft.face && draft.face.face === 'dither') draft.face.tint = hexOf(rgb);
      if (draft.fx === 'ditherpaper') draft.txt = '20,20,20';
      syncInks();
    }
    // "Auto" ink: from the picture, light for a dark ground, deep for paper.
    function autoInk() {
      var request = ++paletteRevision;
      suggestedPalette(draft).then(function(pal) {
        if (request !== paletteRevision) return;
        setInk(effectInk(draft.fx || '', pal));
        commitQuiet();
      });
    }
    var setCardDither = setPicEffect;
    // Smalkums / Kontrasts, packed as fxs "1.bc" (the API already accepts fxs).
    // While dragging only the number follows at once; the picture is recomputed
    // when the thumb rests for a moment (and on release), never per input event.
    var tuneTimer = 0;
    function packTune() {
      var b = host.querySelector('[data-pic-tune="b"]'), c = host.querySelector('[data-pic-tune="c"]');
      if (!b || !c) return;
      var keep = draft.fxs != null && Math.floor(parseFloat(draft.fxs) + 1e-6) >= 2;
      draft.fxs = (keep ? '2.' : '1.') + b.value + c.value;
    }
    host.querySelectorAll('[data-pic-tune]').forEach(function(r) {
      function pack() { packTune(); }
      r.addEventListener('input', function() {
        if (r.nextElementSibling) r.nextElementSibling.textContent = r.value;
        if (!/^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(draft.fx || '')) return;
        pack(); clearTimeout(tuneTimer); tuneTimer = setTimeout(persistLive, 160);
      });
      r.addEventListener('change', function() { clearTimeout(tuneTimer); if (!/^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(draft.fx || '')) return; pack(); commitQuiet(); });
    });
    host.querySelectorAll('[data-pic-effect]').forEach(function(b) {
      b.addEventListener('click', function() { var v = b.dataset.picEffect; setPicEffect(v === 'dither' ? (/^dither/.test(draft.fx || '') ? draft.fx : 'dither') : v); });
    });
    host.querySelectorAll('[data-card-dither]').forEach(function(b) {
      b.addEventListener('click', function() {
        setCardDither(b.dataset.cardDither);
      });
    });
    // Dither colour = the number colour (and the Dither face's tint): one tap.
    // Tapping the chosen ink again (or Auto) hands the colour back to the picture.
    host.querySelectorAll('[data-dither-ink]').forEach(function(b) {
      b.addEventListener('click', function() {
        var hex = b.dataset.ditherInk;
        if (!hex || b.getAttribute('aria-pressed') === 'true') { autoInk(); return; }
        paletteRevision++;
        setInk(parseRgbTriplet(hexToRgb('#' + hex)));
        commitQuiet();
      });
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
      if (!draft.fx || /^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(draft.fx)) return;
      draft.fxs = String((+fxSize.value / 100).toFixed(2));
      fxSizeVal.textContent = fxSize.value + '%';
      persistLive();
    });
    fxSize.addEventListener('change', function() { if (!/^(dither|xray|halftone|duotone|ascii|focus|poster|split|mosaic|bricks|lines|led|pixelate|cmyk|riso|pointillism|heatmap|threshold|outline|posterize)/.test(draft.fx || '')) commit(); });
    // "Everything" includes the decoration; Atsaukt brings both back.
    host.querySelector('.mk-skin-clear').addEventListener('click', function() {
      rememberForUndo();
      draft = {};
      setAddonQuiet(name, null);
      setSkin(name, null);
      rerender();
    });
    if (window.MinkaCardFaces) window.MinkaCardFaces.mount(host, {
      source: previewSizeSource,
      get: function() { return draft; },
      change: function(face) {
        if (face) {
          draft.face = face;
          // The accent is also the number colour, but never overwrites the picture effect's ink.
          if (!INK_FX.test(draft.fx || '') || face.face === 'dither') draft.num = hexToRgb('#'+face.tint);
          host.querySelector('.mk-num-color').value = numberHex(draft);
        } else delete draft.face;
        disableAutoPalette(); persistLive();
      },
      depth: function(value){draft.depth=value;persistLive();},
      // Maiņas laiks as an analog dial ("a" + hand + face) or the digital timer ('').
      timer: function(value){ if (value) draft.tm = value; else delete draft.tm; commitQuiet(); },
      section: function(value) { activeSkinSection = value; },
      active: function() { return activeSkinSection; },
      rebuild: function() { rerender(); },
      // save now and redraw (a rebuild alone redraws from the saved look, which a
      // change made a moment ago has not reached yet: the first press was undone)
      commit: function() { commit(); }
    });
  };
})();
