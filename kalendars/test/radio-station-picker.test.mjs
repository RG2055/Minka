import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function harness() {
  let writes=0, buttons=[];
  const list={scrollTop:128,
    set innerHTML(html){writes++; buttons=[...html.matchAll(/data-station-index="(\d+)"[^>]+aria-current="(true|false)"/g)].map(m=>{
      const b={index:+m[1],selected:m[2]==='true',mark:{innerHTML:''},setAttribute(){},querySelector:()=>b.mark};
      b.classList={toggle:(name,on)=>b.selected=on}; return b;
    });},
    querySelector(selector){return selector==='.is-current'?buttons.find(b=>b.selected):buttons.find(b=>b.index===Number(selector.match(/"(\d+)"/)[1]));}
  };
  const count={textContent:''};
  const overlay={style:{display:'grid'},querySelector:s=>s==='#stationPickerList'?list:count};
  const c=vm.createContext({window:{},document:{addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;},getElementById:id=>id==='stationOverlay'?overlay:id==='stationPickerList'?list:null},
    stationsList:[{title:'Record',group:'record'},{title:'Latviešu hiti',group:'latvija'},{title:'Rock',group:'record'}],
    currentIndex:0,escapeHtml:s=>s,LACITIS_RADIO_FALLBACK:'fallback.svg',LV_STATION_LOGO_RULES:[],LV_STATION_EXTRA_LOGOS:{}});
  vm.runInContext(section("let stationPickerSource =",'// Pull stations from'),c);
  return {c,list,overlay,get writes(){return writes;},get buttons(){return buttons;}};
}
test('reopening and selecting keep station buttons, images and scroll position',()=>{
  const h=harness();h.c.renderStationOverlay();assert.equal(h.writes,1);
  const first=h.buttons[0],next=h.buttons[1];
  h.c.currentIndex=2;h.c.renderStationOverlay();
  assert.equal(h.writes,1);assert.equal(h.buttons[0],first);assert.equal(h.buttons[1],next);
  assert.equal(first.selected,false);assert.equal(next.selected,true);assert.equal(h.list.scrollTop,128);
  h.c.renderStationOverlay();assert.equal(h.writes,1);
});
test('hidden picker defers catalogue rendering until reopened',()=>{
  const h=harness();h.overlay.style.display='none';h.c.renderStationOverlay();assert.equal(h.writes,0);
  h.c.stationsList=[{title:'Fresh',group:'record'}];h.overlay.style.display='grid';h.c.renderStationOverlay();
  assert.equal(h.writes,1);assert.equal(h.c.stationPickerItems()[0].station.title,'Fresh');
});
test('search index is reused and replaced when the catalogue changes',()=>{
  const h=harness(),index=h.c.stationPickerIndex();assert.equal(h.c.stationPickerIndex(),index);
  vm.runInContext("stationPickerSource='latvija';stationPickerQuery='latviesu'",h.c);
  assert.equal(h.c.stationPickerItems()[0].index,1);
  h.c.stationsList=[{title:'Latviešu jaunumi',group:'latvija'}];
  assert.notEqual(h.c.stationPickerIndex(),index);assert.equal(h.c.stationPickerItems()[0].station.title,'Latviešu jaunumi');
});
test('starting playback leaves the open station picker open',()=>{
  const overlay={style:{display:'grid'}},fields={};let starts=0;
  const c=vm.createContext({window:{},setupAudio(){},aCtx:null,hls:null,
    audio:{pause(){},load(){},canPlayType(){return false;},play(){starts++;return Promise.resolve();}},
    document:{getElementById:id=>id==='stationOverlay'?overlay:(fields[id]||={style:{},setAttribute(){}})},
    toggleMenu(){throw new Error('Playback must not dismiss the picker');}});
  vm.runInContext(section('let radioPlayAttempt =', 'function describeStationStream('),c);
  c.play('local.mp3','Test station');assert.equal(starts,1);assert.equal(overlay.style.display,'grid');
  assert.equal(fields.curStation.textContent,'Test station');
});
test('Escape and outside clicks close; station rows and trigger do not',()=>{
  const events={},closed=[],overlay={style:{display:'grid'},contains:()=>false};
  const c=vm.createContext({document:{addEventListener:(name,fn)=>events[name]=fn,getElementById:()=>overlay},toggleMenu:open=>closed.push(open)});
  vm.runInContext(section("document.addEventListener('keydown', (event) => {",'function changeVizStyle()'),c);
  events.pointerdown({composedPath:()=>[overlay]});
  events.pointerdown({composedPath:()=>[{classList:{contains:name=>name==='station-btn'}}]});
  assert.equal(closed.length,0);
  events.pointerdown({composedPath:()=>[]});events.keydown({key:'Escape'});
  assert.deepEqual(closed,[false,false]);
});
test('picker stays within narrow and short windows when resized',()=>{
  const el={style:{}}, c=vm.createContext({window:{innerWidth:320,innerHeight:480},document:{getElementById:id=>id==='radioWindow'?{getBoundingClientRect:()=>({width:320,top:300})}:null}});
  vm.runInContext(section('function positionStationPicker(',"window.addEventListener('resize', () => {"),c);
  for(const [width,height] of [[320,480],[877,754],[1280,720],[320,180]]){
    c.window.innerWidth=width;c.window.innerHeight=height;c.positionStationPicker(el);
    assert.ok(parseFloat(el.style.left)>=12);assert.ok(parseFloat(el.style.left)+parseFloat(el.style.width)<=width-12);
    assert.ok(parseFloat(el.style.top)>=12);assert.ok(parseFloat(el.style.top)+parseFloat(el.style.height)<=height-12);
  }
});
test('Latvian logos are local existing assets and override stale feed covers',()=>{
  const c=vm.createContext({window:{},document:{addEventListener(){}}});
  vm.runInContext(section('const LACITIS_RADIO_LOGO_BASE', 'function stationPickerItems()'),c);
  const files=vm.runInContext('[...LV_STATION_LOGO_RULES.map(x=>x[1]),...Object.values(LV_STATION_EXTRA_LOGOS)]',c);
  for(const file of files) assert.ok(fs.existsSync(new URL('../../data/radio-logos/'+file,import.meta.url)),file);
  for(const name of ['SWH','SKONTO','EHR DANCE','LATVIJAS RADIO 1','NABA','DIVU KRASTU RADIO','ABC LOUNGE','CHILLTRAX']){
    const path=c.stationLogoUrl({group:'latvija',title:name,cover:'https://broken.example/old.png'});
    assert.match(path,/^data\/radio-logos\//);assert.ok(fs.existsSync(new URL('../../'+path,import.meta.url)));
  }
  assert.notEqual(c.stationLogoUrl({group:'latvija',title:'SWH'}),c.stationLogoUrl({group:'latvija',title:'SWH GOLD'}));
  assert.notEqual(c.stationLogoUrl({group:'latvija',title:'EHR'}),c.stationLogoUrl({group:'latvija',title:'EHR DANCE'}));
});
test('opening defaults to current profile favorites and clears stale searches',()=>{
  let favorites=['record:rock'],session={};
  const search={value:'old search'};
  const tabs=['favorites','featured','record','latvija'].map(source=>({dataset:{stationSource:source},classList:{toggle(){}},setAttribute(name,value){this[name]=value;}}));
  const overlay={style:{display:'none'},setAttribute(){},querySelector:()=>search,querySelectorAll:()=>tabs};
  const c=vm.createContext({window:{__mkUnifiedMedia:{getSession:()=>session,getRadio:()=>({favorites})}},
    document:{getElementById:id=>id==='stationOverlay'?overlay:null,querySelectorAll:()=>[]},
    positionStationPicker(){},renderStationOverlay(){},loadFeaturedStations(){},clearTimeout(){},requestAnimationFrame(){},
    stationPickerSource:'latvija',stationPickerQuery:'old search',stationPickerSearchTimer:0});
  vm.runInContext(section('function toggleMenu(', 'function positionStationPicker('),c);
  c.toggleMenu(true);
  assert.equal(c.stationPickerSource,'favorites');assert.equal(c.stationPickerQuery,'');assert.equal(search.value,'');
  assert.equal(tabs[0]['aria-selected'],'true');assert.equal(tabs[1]['aria-selected'],'false');
  c.stationPickerSource='latvija';c.toggleMenu(true);
  assert.equal(c.stationPickerSource,'latvija','already open picker keeps manual tab selection');
  c.toggleMenu(false);c.toggleMenu(true);assert.equal(c.stationPickerSource,'favorites');
  favorites=[];c.toggleMenu(false);c.toggleMenu(true);
  assert.equal(c.stationPickerSource,'featured');assert.equal(tabs[1]['aria-selected'],'true');
  favorites=['record:rock'];session=null;c.toggleMenu(false);c.toggleMenu(true);
  assert.equal(c.stationPickerSource,'featured','guest opens discovery instead of another profile favorites');
});

test('a pending audio unlock does not prevent preparing the favorite stream',async()=>{
  const fields={};let starts=0;
  const c=vm.createContext({window:{},setupAudio(){},hls:null,
    aCtx:{state:'suspended',resume:()=>new Promise(()=>{})},
    audio:{paused:true,pause(){},load(){},play(){starts++;return Promise.reject({name:'NotAllowedError'});}},
    document:{getElementById:id=>fields[id]||=( {style:{},setAttribute(){}} )}});
  vm.runInContext(section('let radioPlayAttempt =','function describeStationStream('),c);
  c.play('favorite.mp3','Favorite');await new Promise(resolve=>setImmediate(resolve));
  assert.equal(starts,1);assert.equal(c.audio.src,'favorite.mp3');
  assert.match(fields.playBtn.innerHTML,/fa-play/);assert.match(fields.playBtn.title,/Nospied/);
  c.aCtx.resume=()=>{c.aCtx.state='running';return Promise.resolve();};
  c.audio.play=()=>{starts++;c.audio.paused=false;return Promise.resolve();};
  await c.requestRadioPlayback();
  assert.equal(starts,2);assert.equal(c.audio.src,'favorite.mp3');assert.match(fields.playBtn.innerHTML,/fa-pause/);
});

test('a rejected older play request cannot overwrite a newer successful start',async()=>{
  let reject;const button={setAttribute(){}};
  const c=vm.createContext({window:{},aCtx:null,audio:{paused:false,play:()=>new Promise((_,r)=>reject=r)},document:{getElementById:()=>button}});
  vm.runInContext(section('let radioPlayAttempt =','function play(url, name)'),c);
  const old=c.requestRadioPlayback();c.audio.play=()=>Promise.resolve();await c.requestRadioPlayback();
  reject({name:'NotAllowedError'});await old;assert.match(button.innerHTML,/fa-pause/);
});
