import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sw=fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8');
const radio=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const catalog=fs.readFileSync(new URL('../../js/radio-catalog.js',import.meta.url),'utf8');
const extract=(src,start,end)=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));

function worker(extra={}){
 const events={};
 vm.runInNewContext(sw,{URL,Request,Response,self:{registration:{scope:'https://app.example/'},location:{origin:'https://app.example'},addEventListener:(type,handler)=>events[type]=handler,clients:{claim:async()=>{},matchAll:async()=>[]}},fetch:async()=>new Response('x'),caches:{match:async()=>undefined,open:async()=>({put:async()=>{},match:async()=>undefined,keys:async()=>[]})},...extra});
 return events;
}
test('cross-origin images bypass the worker, so a failed logo is retried instead of cached for good',()=>{
 const events=worker();
 for(const url of ['https://brila.net/logo.png','https://is1-ssl.mzstatic.com/cover/600x600bb.jpg','https://www.radiorecord.ru/upload/iblock/74d/record_new.jpeg']){
  let responded=false;events.fetch({request:{method:'GET',url,destination:'image',cache:'default',mode:'no-cors'},respondWith:()=>{responded=true;},waitUntil(){}});
  assert.equal(responded,false,url);
 }
 let own=false;events.fetch({request:{method:'GET',url:'https://app.example/data/radio-logos/lr1.png',destination:'image',cache:'default',mode:'no-cors'},respondWith:()=>{own=true;},waitUntil(){}});
 assert.equal(own,true,'the app\'s own images stay cached for offline use');
});
test('an update drops opaque entries (possibly cached errors) and keeps the rest',async()=>{
 const put=[];const old={keys:async()=>[{url:'https://flagcdn.com/w40/lv.png'},{url:'https://app.example/data/radio-logos/lr1.png'}],match:async req=>({type:req.url.includes('flagcdn')?'opaque':'basic'})};
 const events=worker({caches:{keys:async()=>['minka-old','CURRENT'],open:async name=>name==='minka-old'?old:{put:async req=>put.push(req.url),match:async()=>undefined},delete:async()=>true}});
 let done;events.activate({waitUntil:p=>done=p});await done;
 assert.deepEqual(put,['https://app.example/data/radio-logos/lr1.png']);
});
test('a station logo that failed once is not requested again; Latvian rows fall back to the bundled logo',()=>{
 const c=vm.createContext({});
 vm.runInContext(extract(radio,'const LACITIS_RADIO_LOGO_BASE','const LV_STATION_EXTRA_LOGOS')+extract(radio,'const LV_STATION_EXTRA_LOGOS','let stationPickerSource')+extract(radio,'function normalizeStationText(','function radioStationKey(')+extract(radio,'function escapeHtml(s){','function updateVizLabel(')+';this.failed=failedStationLogos;',c);
 const lv={group:'world',country:'LV',title:'Latvijas Radio 1',cover:'https://dead.example/lr1.png'};
 const world={group:'world',country:'DE',title:'Radio X',cover:'https://dead.example/x.png'};
 assert.match(c.stationLogoAttrs(lv),/src="https:\/\/dead\.example\/lr1\.png" data-fallback="data\/radio-logos\/lr1\.png" onerror="stationLogoFailed\(this\)"/);
 const img={attrs:{src:lv.cover,'data-fallback':'data/radio-logos/lr1.png'},getAttribute(k){return this.attrs[k]??null;},set src(v){this.attrs.src=v;},get src(){return this.attrs.src;}};
 c.stationLogoFailed(img);assert.equal(img.src,'data/radio-logos/lr1.png');
 assert.equal(c.stationLogoUrl(lv),'data/radio-logos/lr1.png','the next render skips the dead URL');
 const img2={attrs:{src:world.cover},getAttribute(k){return this.attrs[k]??null;},set src(v){this.attrs.src=v;},get src(){return this.attrs.src;}};
 c.stationLogoFailed(img2);assert.equal(img2.src,'data/radio-default.svg');assert.equal(c.stationLogoUrl(world),'data/radio-default.svg');
 const last={attrs:{src:'data/radio-default.svg'},onerror:()=>{},getAttribute(k){return this.attrs[k]??null;}};
 c.stationLogoFailed(last);assert.equal(last.onerror,null,'the generic logo failing cannot loop');
 assert.equal(c.stationLogoUrl({group:'world',country:'LV',title:'Unknown FM',cover:''}),'data/radio-default.svg');
});
test('http favicons are requested over https instead of being dropped; streams are never upgraded',async()=>{
 const window={};
 vm.runInNewContext(catalog,{window,URL,URLSearchParams,AbortController,Intl,Date,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>[
  {stationuuid:'00000000-0000-4000-8000-000000000001',name:'A',url_resolved:'https://radio.example/a.mp3',lastcheckok:1,countrycode:'GB',favicon:'http://cdn.example/a.png'},
  {stationuuid:'00000000-0000-4000-8000-000000000002',name:'B',url_resolved:'http://radio.example/b.mp3',lastcheckok:1,countrycode:'GB',favicon:'https://cdn.example/b.png'}]})});
 const r=await window.rgRadioCatalog.search();
 assert.equal(r.items.length,1);assert.equal(r.items[0].cover,'https://cdn.example/a.png');
});
test('a site-relative now-playing cover (Record\'s placeholder) is not requested from this app',()=>{
 const body=extract(radio,'function setNowUI(','// Static pixel buddy');
 assert.match(body,/if \(!\/\^https\?:\\\/\\\/\/i\.test\(coverUrl\)\) coverUrl = "";/);
});
test('Amp and Dither covers stop the hidden console visualizer, and leaving them wakes it',()=>{
 const c=vm.createContext({document:{getElementById:()=>c.rw},window:{}});
 c.rw={dataset:{radioLayout:'amp'},classList:{contains:()=>false}};
 vm.runInContext(extract(radio,"const radioWin = document.getElementById('radioWindow');",'function scheduleDraw('),c);
 assert.equal(c.window.__mkRadioConsoleCovered(),true);
 c.rw.dataset.radioLayout='classic';assert.equal(c.window.__mkRadioConsoleCovered(),false);
 c.rw.dataset.radioLayout='dither';c.rw.classList.contains=k=>k==='music-source';assert.equal(c.window.__mkRadioConsoleCovered(),false,'the Winamp shell hides the faceplate, not the engine');
 assert.match(extract(radio,'function draw(ts = 0) {','    if (isAdjustingVol) {'),/window\.__mkRadioConsoleCovered\?\.\(\)/);
 assert.match(extract(radio,'  function paintAppearance(){','  function lookSnapshot(){'),/previousLayout!==rw\.dataset\.radioLayout\)window\.__mkSyncRadioVisuals\?\.\(\)/);
});
