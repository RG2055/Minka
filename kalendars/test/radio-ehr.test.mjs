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
 vm.runInContext(extract('function radioStationKey(station)','function updateStationFavorites')+extract('const EHR_GROUP_NAMES','async function initStations()')+';this.out=buildLatvianStations();this.key=radioStationKey;',c);
 return c;
}
test('EHR streams leave the Latvian list for the EHR tab and keep the favorite key of their old Latvian name',()=>{
 const rows=[['EHR','EHR','FM radio'],['EHR_SUPERHITS','SuperHits','FM radio'],['EHR_PLUS','EHR+','FM radio'],['EHR_KOOL','KOOL Hits','EHR']].map(([mount,title,category])=>({mount,title,category,url:redirect(mount+'.mp3')}));
 const c=build(rows),lv=c.out.filter(s=>!s.ehr),ehr=c.out.filter(s=>s.ehr);
 assert.deepEqual(lv.map(s=>s.title),['RADIO SWH']);
 assert.deepEqual(ehr.map(s=>c.key(s)),['lv:eiropas hītu radio','lv:super fm','lv:ehr+','ehr:ehr_kool']);
 assert.ok(ehr.every(s=>s.group==='latvija'&&s.stream_128.endsWith('.mp3')));
 assert.deepEqual(ehr.map(s=>s.title),['EHR','SuperHits','EHR+','EHR KOOL Hits']);   // history/player name carries the group
});
test('without the EHR list the Latvian stations stay as they were',()=>{
 assert.equal(build([]).out.length,5);
});
test('statistics count days under the old Latvian-list names for the renamed EHR channel',()=>{
 const stats=fs.readFileSync(new URL('../js/daybook-stats.js',import.meta.url),'utf8');
 const c=vm.createContext({M:{norm:s=>String(s).trim().toLocaleLowerCase('lv-LV')},remoteRadio:{m:{days:[{day:'2026-10-01',station:'EIROPAS HĪTU RADIO'},{day:'2026-10-02',station:'EHR ACCOUSTIC'}]}},D:{radio:()=>[{day:'2026-10-01',name:'EHR'},{day:'2026-10-03',name:'Rock'}]}});
 vm.runInContext(stats.slice(stats.indexOf('  var EHR_RENAMED'),stats.indexOf('  function ensureRadio'))+';this.out=radioAll();',c);
 assert.deepEqual([...c.out].map(e=>e.day+' '+e.name),['2026-10-01 EHR','2026-10-02 SuperHits Chillout Hits','2026-10-03 Rock']);
});
