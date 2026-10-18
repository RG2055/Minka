import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/radio.js',import.meta.url),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const redirect=m=>'https://playerservices.streamtheworld.com/api/livestream-redirect/'+m;
function build(ehrRows){
 const c=vm.createContext({LV_DISABLED_STATIONS:new Set(),LV_STREAM_OVERRIDES:new Map(),LV_STATION_ADDITIONS:[],normalizeStationText:t=>String(t).trim().toUpperCase(),
  LATVIAN_STATIONS:[{title:'EIROPAS HĪTU RADIO',group:'latvija',stream_128:redirect('EHR.mp3')},{title:'SUPER FM',group:'latvija',stream_128:redirect('EHR_SUPERHITS.mp3')},{title:'EHR SUPERHITS',group:'latvija',stream_128:redirect('EHR_SUPERHITS.mp3')},{title:'RADIO SWH',group:'latvija',stream_128:'https://swh.example/stream'}],
  extraLatvianStations:[{title:'EHR+',group:'latvija',stream_128:redirect('EHR_PLUSAAC.aac')}],ehrStationRows:ehrRows});
 vm.runInContext(extract('function radioStationKey(station)','function updateStationFavorites')+extract('function buildLatvianStations()','async function initStations()')+';this.out=buildLatvianStations();this.key=radioStationKey;',c);
 return c;
}
test('EHR streams leave the Latvian list for the EHR tab and keep the favorite key of their old Latvian name',()=>{
 const rows=['EHR','EHR_SUPERHITS','EHR_PLUS','EHR_KOOL'].map(mount=>({mount,title:mount,category:'EHR',url:redirect(mount+'.mp3')}));
 const c=build(rows),lv=c.out.filter(s=>!s.ehr),ehr=c.out.filter(s=>s.ehr);
 assert.deepEqual(lv.map(s=>s.title),['RADIO SWH']);
 assert.deepEqual(ehr.map(s=>c.key(s)),['lv:eiropas hītu radio','lv:super fm','lv:ehr+','ehr:ehr_kool']);
 assert.ok(ehr.every(s=>s.group==='latvija'&&s.stream_128.endsWith('.mp3')));
});
test('without the EHR list the Latvian stations stay as they were',()=>{
 assert.equal(build([]).out.length,5);
});
