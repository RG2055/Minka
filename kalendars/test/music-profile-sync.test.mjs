import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8');
function section(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return source.slice(a,b);}
test('music save errors reach the visible profile instead of falsely reporting success',async()=>{
 const player=read('integrations/lacitis/player/index.html'),host=read('js/radio-music.js');
 const dot={className:''},indicator={dataset:{},querySelector:()=>dot},label={textContent:''};
 const c=vm.createContext({
  dezuraSyncStatus:indicator,dezuraSyncText:{textContent:''},$:()=>null,window:{},
  dezuraIsActive:()=>true,dezuraSession:{workerId:'test-person',name:'Test Person'},miniWorkers:[],dezuraPinStatus:{},
  getFavorites:()=>[],getHistory:()=>[],getPlaylists:()=>[],miniPlaylistSummaries:()=>[],
  profileState:{},profileBtn:null,profileStatus:label,loggedOut:null,loggedIn:null,
  favoritesHeaderBtn:null,profileSection:'favorites',profileIsOpen:()=>false,updateQuickActions(){},
  post:data=>c.applyProfileState(data)
 });
 vm.runInContext(section(host,'  function applyProfileState(', '  window.lacMiniLibrary='),c);
 vm.runInContext(section(player,'  async function sendMiniProfileState(', '  function miniResult('),c);
 vm.runInContext(section(player,'function setDezuraSyncStatus(', 'async function renderDezuraWorkers('),c);
 c.window.__lacitisMiniProfileChanged=()=>c.sendMiniProfileState();
 c.setDezuraSyncStatus('synced');assert.equal(label.textContent,'Saglabāts');
 c.setDezuraSyncStatus('syncing');assert.equal(label.textContent,'Saglabā…');
 c.setDezuraSyncStatus('error');assert.equal(label.textContent,'Neizdevās saglabāt');
 c.setDezuraSyncStatus('synced');assert.equal(label.textContent,'Saglabāts');
 c.applyProfileState({session:{name:'Test Person'}});assert.equal(label.textContent,'Profils ielādēts');
});
