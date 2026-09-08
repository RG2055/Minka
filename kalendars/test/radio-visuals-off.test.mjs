import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
test('disabled visualizer stops before sampling audio or scheduling another frame',()=>{
 const body=extract('function draw(ts = 0) {','    if (isAdjustingVol) {')+'}';
 const c=vm.createContext({MK_NO_VIZ:12,vizStyle:12,__drawScheduled:true,radioVisualsInactive(){throw Error('should short circuit');}});
 vm.runInContext(body+'draw();',c);assert.equal(c.__drawScheduled,false);
});
test('selecting no visualizer survives preferences, hides display, and releasing it restarts drawing',()=>{
 const classes=new Set(),saved=[],frames=[];
 const c=vm.createContext({isModernViz:m=>m===13||(m>=20&&m<=30),vizFamily:'classic',analyser:null,MK_FLOW_VIZ:13,MK_NO_VIZ:12,MK_BUDDY_VIZ:11,MK_DEFAULT_VIZ:7,VIZ_MODES:[{idx:0},{idx:7},{idx:12}],vizStyle:7,__mkLastSpectrum:7,milkdropEnabled:false,milkdrop:null,dGif:{style:{}},ctx:{clearRect(){}},cvs:{width:100,height:40},Event:class {},window:{dispatchEvent(){},__slowedWave:{stop(){saved.push('wave stopped');}}},document:{body:{classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},remove(k){classes.delete(k);}}}},localStorage:{setItem:(k,v)=>saved.push(v)},updateVizLabel(){},updateVizPickerUI(){},mkUpdateVizToggle(){},milkdropStop(){},scheduleDraw(){frames.push('frame');}});
 vm.runInContext(extract('function setVizStyle(idx){','function updateVizPickerUI')+extract('function applyVizMode() {','// Keyboard: Winamp-ish'),c);
 vm.runInContext('setVizStyle(12);',c);assert.equal(c.vizStyle,12);assert.ok(saved.includes('spectrum:12'));assert.ok(classes.has('radio-viz-off'));assert.equal(frames.length,0);
 vm.runInContext('setVizStyle(7);',c);assert.equal(classes.has('radio-viz-off'),false);assert.equal(frames.length,1);
 vm.runInContext('setVizStyle(99);',c);assert.equal(c.vizStyle,7);
});
test('all shipped background assets exist and the added photo collection stays below 400 KB',()=>{
 const names=['greek-columns','marble-face','marble-bust','marble-shadow','stone-arches','quiet-gallery','dune-shadows','mist-peaks','fog-city','aurora'];
 let total=0;for(const name of names)for(const suffix of ['', '-preview']){const data=fs.readFileSync(new URL('../data/radio-skins/'+name+suffix+'.webp',import.meta.url));assert.equal(data.toString('ascii',8,12),'WEBP');total+=data.length;}
 assert.ok(total<400000,`${total} bytes`);
});
test('favorite selection follows profile order and skips unavailable stations',()=>{
 const c=vm.createContext({stationsList:[{key:'record:default'},{key:'lv:second'},{key:'lv:first'}],radioStationKey:s=>s.key});
 vm.runInContext(extract('function favoriteStationIndex(favorites){','window.rgStations='),c);
 assert.equal(c.favoriteStationIndex(['lv:first','lv:second']),2);
 assert.equal(c.favoriteStationIndex(['missing','lv:second']),1);
 assert.equal(c.favoriteStationIndex([]),-1);
});
test('appearance menu stays in bounds after resizing from a small window to a tall monitor',()=>{
 const panel={style:{maxHeight:'600px'},scrollHeight:600,getBoundingClientRect(){return {height:Math.min(1800,parseFloat(this.style.maxHeight))};}};
 const c=vm.createContext({panel,window:{innerWidth:2560,innerHeight:1440},document:{getElementById:()=>({getBoundingClientRect:()=>({top:1200})})}});
 vm.runInContext(extract('  function positionPanel(){','  function openPanel(){'),c);c.positionPanel();
 assert.ok(parseFloat(panel.style.top)+panel.getBoundingClientRect().height<=1428);assert.equal(panel.style.maxHeight,'900px');
 c.window.innerWidth=900;c.window.innerHeight=600;c.positionPanel();assert.ok(parseFloat(panel.style.top)+panel.getBoundingClientRect().height<=588);
});
test('new CENTER draws 24 rounded bars at high DPI with a 60 fps ceiling',()=>{
 const bars=[],ctx={clearRect(){},beginPath(){},roundRect(...args){bars.push(args);},fill(){}};
 const c=vm.createContext({isModernViz:m=>m>=20&&m<=30,modernBaseMode:m=>m-20,MK_LOW_SPEC:false,MK_NO_VIZ:12,MK_FLOW_VIZ:13,MK_BUDDY_VIZ:11,MK_VIZ_FRAME_MS:0,vizStyle:24,__drawScheduled:false,__vizLastFrameTs:0,__vizFreqData:null,__radioVizAccentRGB:[30,215,96],__radioImageSkin:true,lookPreviewActive:false,modernMeter:{level:0},flowLevels:new Float32Array(24),radioVisualsInactive:()=>false,audio:{paused:false},analyser:{fftSize:128,frequencyBinCount:128,getByteFrequencyData(data){data.fill(180);},getByteTimeDomainData(data){data.fill(180);}},isAdjustingVol:false,scheduleDraw(){},dGif:{style:{}},ledPoint:{style:{}},ledHalo:{style:{}},modernWaveData:null,ctx,cvs:{width:0,height:0,clientWidth:400,clientHeight:64},window:{devicePixelRatio:2},performance:{now:()=>100}});
 vm.runInContext(extract('function ensureCanvasSize(){','// Pixel Buddy uses')+extract('function drawModernSpectrum(',"document.getElementById('playBtn').onclick"),c);
 c.draw(100);assert.equal(bars.length,24);assert.equal(c.cvs.width,800);assert.ok(bars.every(([x,y,w,h,r])=>x>=0&&y>=0&&r===Math.min(w/2,h/2)&&h>=2));
 c.draw(108);assert.equal(bars.length,24);c.draw(118);assert.equal(bars.length,48);
});
for(let mode=0;mode<=10;mode++)test('new mode '+mode+' renders bounded geometry from real analyser samples',()=>{
 let calls=0;
 const ctx=new Proxy({},{get(target,key){if(key in target)return target[key];return (...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),key);calls++;};},set(target,key,value){target[key]=value;return true;}});
 const c=vm.createContext({lookPreviewActive:false,modernMeter:{level:0},flowLevels:new Float32Array(24),modernWaveData:null,analyser:{fftSize:128,getByteTimeDomainData(a){a.forEach((_,i)=>a[i]=128+Math.round(Math.sin(i*.5)*60));}}});
 vm.runInContext(extract('function drawModernSpectrum(','function draw(ts = 0)'),c);
 c.drawModernSpectrum(mode,ctx,800,128,new Uint8Array(128).fill(180),16.7,'#66ccaa');assert.ok(calls>0);assert.equal(ctx.globalAlpha,1);
});
test('Classic and new families map the selected mode and retain their own cycling',()=>{
 const selected=[];
 const c=vm.createContext({vizStyle:5,isModernViz:m=>m>=20,modernBaseMode:m=>m-20,setVizStyle:m=>selected.push(m)});
 vm.runInContext(extract('function switchVizFamily(','function mkSaveVizPref'),c);
 c.switchVizFamily('new');assert.equal(selected.pop(),25);c.vizStyle=25;c.switchVizFamily('classic');assert.equal(selected.pop(),5);
});
test('new LED meter responds to volume and returns to silence without staying fully lit',()=>{
 const c=vm.createContext({});vm.runInContext(extract('function drawModernSpectrum(','function drawClassicSpectrum('),c);
 const levels=new Float32Array(24),meter={level:0},data=new Uint8Array(128).fill(220);
 let lit=0;const ctx={globalAlpha:1,beginPath(){},roundRect(){},fill(){if(this.globalAlpha===1)lit++;}};
 const frame=(amplitude,dt=16.7)=>{lit=0;const wave=Uint8Array.from({length:128},(_,i)=>128+Math.round(Math.sin(i*.3)*amplitude));c.drawModernSpectrum(9,ctx,800,128,data,dt,'#fff',levels,wave,meter);return lit;};
 assert.equal(frame(0),0);const quiet=frame(8,100);const loud=frame(80,100);
 assert.ok(quiet>0&&quiet<loud);assert.ok(loud<24,'ordinary audio must not peg all LEDs');
 assert.ok(frame(0,100)<loud);for(let i=0;i<50;i++)frame(0);assert.equal(frame(0),0);assert.ok(meter.level<.0001);
});
test('visualization choices use small static snapshots for every real renderer',()=>{
 const modes=[...Array(12).keys(),...Array.from({length:11},(_,i)=>i+20)];let total=0;
 for(const mode of modes){const data=fs.readFileSync(new URL('../data/radio-viz/'+mode+'.webp',import.meta.url));assert.equal(data.toString('ascii',8,12),'WEBP');total+=data.length;}
 assert.ok(total<160000,`${total} bytes`);
 const preview=extract('  function vizPreview(mode){','  function buildLookControls(){');
 assert.match(preview,/<img class="radio-viz-thumbnail"/);assert.doesNotMatch(preview,/<canvas|requestAnimationFrame|getContext/);
});
test('leaving DOLPHIN clears its layer immediately for every mode, including paused extras',()=>{
 const c=vm.createContext({vizStyle:5,MK_NO_VIZ:12,isModernViz:n=>n>=20,analyser:null,peaks:[50,80],__vizLastFrameTs:99,dGif:{style:{}},ctx:{clearRect(){}},cvs:{width:800,height:128},milkdropEnabled:false,milkdrop:null,window:{dispatchEvent(){},__slowedWave:{stop(){}}},Event:class{},document:{body:{classList:{toggle(){},remove(){}}}},scheduleDraw(){},milkdropStop(){}});
 vm.runInContext(extract('function applyVizMode() {','// Keyboard: Winamp-ish'),c);
 for(const mode of [...Array(13).keys(),20,24,30]){c.vizStyle=5;c.applyVizMode();assert.equal(c.dGif.style.display,'block');c.vizStyle=mode;c.applyVizMode();assert.equal(c.dGif.style.display,mode===5?'block':'none');assert.equal(c.peaks[0],0);}
});
const extras=fs.readFileSync(new URL('../../js/radio_extras_v4.js',import.meta.url),'utf8');
for(const height of [48,64,128])test('all Classic renderers have finite, nonnegative shapes at height '+height,()=>{
 let rectangles=0;
 const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return(...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),k);if(k==='roundRect'||k==='fillRect'){assert.ok(args[2]>=0&&args[3]>=0,`${k} ${args}`);rectangles++;}if(k==='arc')assert.ok(args[2]>=0);};},set(o,k,v){o[k]=v;return true;}});
 const c=vm.createContext({window:{}});vm.runInContext(extract('function drawClassicSpectrum(','function draw(ts = 0)')+extras.slice(extras.indexOf('const RG_peaks'),extras.indexOf('// ─ Hook new viz modes')),c);
 const data=Uint8Array.from({length:128},(_,i)=>30+(i*17)%220);
 for(const width of [180,400,960]){for(let mode=0;mode<8;mode++)c.drawClassicSpectrum(mode,ctx,{width,height},data,'30,215,96',new Float32Array(128));c.drawVU(ctx,width,height,data);c.drawLEDBar(ctx,width,height,data);c.drawDotMatrix(ctx,width,height,data);}
 assert.ok(rectangles>0);
});
test('Buddy is a Classic choice and schedules capped work without sampling FFT',()=>{
 assert.match(source,/idx: MK_BUDDY_VIZ, label: "BUDDY"/);assert.doesNotMatch(source,/b.id = 'mkVizToggle'/);
 let delay=0,drawn=0;const c=vm.createContext({MK_NO_VIZ:12,MK_BUDDY_VIZ:11,vizStyle:11,MK_LOW_SPEC:false,radioVisualsInactive:()=>false,audio:{paused:false},analyser:{getByteFrequencyData(){throw Error('Buddy must not sample FFT');}},isAdjustingVol:false,scheduleDraw:d=>delay=d,dGif:{style:{}},mkDrawBuddyViz:()=>drawn++,performance:{now:()=>100}});
 vm.runInContext(extract('function draw(ts = 0)',"document.getElementById('playBtn').onclick"),c);c.draw(100);assert.equal(drawn,1);assert.equal(delay,1000/24);
});

test('changing a theme cannot force an inline spectrum window over the frame choice',()=>{
 const values=new Map([['background','rgba(0,0,0,.12)'],['border-color','#fff'],['box-shadow','0 0 8px #000']]);
 const monitor={style:{setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)}};
 const rw={style:{setProperty(){}},classList:{toggle(){}},querySelector:()=>null,querySelectorAll:s=>s==='.monitor-frame'?[monitor]:[]};
 const c=vm.createContext({URL,__radioImageSkin:false,setVar(){},parseColorToRGBStr:()=> '30,215,96',document:{baseURI:'http://localhost/',getElementById:()=>rw}});
 vm.runInContext(extract('  function applyGlassIntensity(','  function parseColorToRGBStr('),c);
 for(const image of ['kalendars/data/radio-skins/marble-face.webp','']){
  c.applyGlassIntensity(24,{image,surfaceRGB:[10,14,12]});
  for(const property of ['background','border-color','box-shadow'])assert.equal(values.has(property),false);
  assert.ok(values.get('--radio-monitor-background'));
 }
});

test('DOLPHIN uses only its animation without side bars or a redundant audio render loop',()=>{
 const fail=()=>{throw Error('Dolphin must not draw bars, sample audio or schedule another frame');};
 const c=vm.createContext({vizStyle:5,MK_NO_VIZ:12,__drawScheduled:true,audio:{paused:false},analyser:{getByteFrequencyData:fail},scheduleDraw:fail});
 vm.runInContext(extract('function draw(ts = 0)',"document.getElementById('playBtn').onclick"),c);c.draw(100);assert.equal(c.__drawScheduled,false);
 vm.runInContext(extract('function drawClassicSpectrum(','function draw(ts = 0)'),c);
 c.drawClassicSpectrum(5,{fillRect:fail},{width:960,height:128},new Uint8Array(128),'30,215,96',new Float32Array(128));
});

test('modern preview mask uses the image URL, not a path relative to the CSS folder',()=>{
 const properties=new Map(),image={hidden:false,getAttribute:()=>'',parentElement:{classList:{toggle(){}},style:{setProperty:(k,v)=>properties.set(k,v)}}};
 const c=vm.createContext({URL,document:{baseURI:'http://localhost:8001/',getElementById:()=>image},vizStyle:27,MK_NO_VIZ:12,isModernViz:()=>true,appearance:{vizFrame:'off'},vizPreviewSource:()=> 'kalendars/data/radio-viz/27.webp?v=preview'});
 vm.runInContext(extract('  function renderLookPreviews(){','  function syncLayoutPreview(){'),c);c.renderLookPreviews();
 assert.equal(properties.get('--viz-preview-mask'),'url("http://localhost:8001/kalendars/data/radio-viz/27.webp?v=preview")');assert.equal(image.hidden,false);
});
