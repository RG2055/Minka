import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readCalendarPage } from './calendar-page-source.mjs';
const html=readCalendarPage();
const js=fs.readFileSync(new URL('../js/calendar.js',import.meta.url),'utf8');
function card(name='',kind='is-day'){
 const props=new Map(),classes=new Set([kind]);
 return {name,props,classes,isConnected:true,style:{setProperty:(k,v)=>props.set(k,v),removeProperty:k=>props.delete(k)},classList:{add:(...ks)=>ks.forEach(k=>classes.add(k)),remove:(...ks)=>ks.forEach(k=>classes.delete(k)),contains:k=>classes.has(k)},getAttribute:key=>key==='data-next-worker'?name:null};
}
function skinHarness(){
 const c=vm.createContext({window:{},GRAD_MAP:{ocean:'linear-gradient(#0d1b2a, #123044)',rits:'linear-gradient(#ffecd2, #fcb69f)'},artUrl:id=>'art/'+id+'.webp',stockSkinUrl:id=>'stock/'+id+'.jpg'});
 const slice=(from,to)=>html.slice(html.indexOf(from),html.indexOf(to));
 vm.runInContext(slice('  function clampByte(value)','  function paletteFromRgb(rgb)'),c);
 vm.runInContext(slice('  var NEXT_TONE_READY','  window.mkApplySkinToEl ='),c);
 return c;
}
/* Kartītes pašas krāsas mums nav zināmas iepriekš — zināms ir tas, ka teksts
   uz tām jāvar salasīt. Tāpēc pārbaudām nevis konkrētu toni, bet kontrastu
   pret abām plāksnītes fona malām, tieši tā, kā to redz acs. */
function painted(c,el){
 const rgb=v=>String(el.props.get(v)||'').match(/\d+/g).map(Number);
 const scrim=String(el.props.get('--mk-next-scrim')||'rgba(0,0,0,0)');
 const scrimRgb=scrim.match(/\d+/g).slice(0,3).map(Number);
 const alpha=Number(scrim.slice(scrim.lastIndexOf(',')+1,-1));
 return {text:rgb('--mk-next-text'),hours:rgb('--mk-next-hours'),scrimRgb,alpha};
}
function worstContrast(c,el,tone,which){
 const paint=painted(c,el),{scrimRgb,alpha}=paint,colour=paint[which];
 const bright=c.blendRgb(scrimRgb,alpha,c.nextBrightEdge(tone));
 const dark=c.blendRgb(scrimRgb,alpha,c.nextDarkEdge(tone));
 const lum=c.relLuminance(colour);
 return Math.min(c.contrastRatio(lum,c.relLuminance(bright)),c.contrastRatio(lum,c.relLuminance(dark)));
}

test('next-shift skins keep each persons background and text inside their own pill',async()=>{
 const c=skinHarness(),a=card(),b=card();
 c.applyNextShiftSkin(a,{t:'img',id:'sea',txt:'200,230,255',num:'90,180,240',numA:.8,fx:'spark'});
 c.applyNextShiftSkin(b,{t:'grad',id:'ocean',txt:'255,210,120'});
 await new Promise(done=>setTimeout(done,0));
 assert.equal(a.props.get('--mk-next-bg'),"url('stock/sea.jpg')");
 assert.equal(b.props.get('--mk-next-bg'),'linear-gradient(#0d1b2a, #123044)');
 assert.deepEqual([...a.classes],['is-day','mk-next-has-text','mk-next-has-hours'],'particle effects are not copied');
 const previous=b.props.get('--mk-next-text');
 c.applyNextShiftSkin(a,null);assert.equal(a.props.size,0);assert.equal(a.classes.size,1);
 assert.equal(b.props.get('--mk-next-text'),previous,'reset does not alter a neighbour');
});

test('switching image to tint and art clears the previous skin without stale colours',()=>{
 const c=skinHarness(),a=card();c.applyNextShiftSkin(a,{t:'img',id:'forest',txt:'255,255,255'});
 c.applyNextShiftSkin(a,{t:'hue',rgb:'30,90,150'});
 assert.equal(a.props.get('--mk-next-bg'),undefined);
 assert.equal(a.props.get('--mk-next-tint'),'rgba(30,90,150,.3)');
 c.applyNextShiftSkin(a,{t:'art',id:'moon'});assert.equal(a.props.get('--mk-next-tint'),undefined);assert.equal(a.props.get('--mk-next-bg'),"url('art/moon.webp')");
});

test('saved text colour is kept when it already reads, and only nudged when it does not',()=>{
 const c=skinHarness(),dark=card(),pale=card();
 c.applyNextShiftSkin(dark,{t:'grad',id:'ocean',txt:'236,243,255'});
 assert.equal(dark.props.get('--mk-next-text'),'rgb(236,243,255)','a light colour on a dark gradient stays untouched');
 c.applyNextShiftSkin(pale,{t:'grad',id:'rits',txt:'255,255,255'});
 const nudged=pale.props.get('--mk-next-text').match(/\d+/g).map(Number);
 assert.ok(c.relLuminance(nudged)<.3,'white on a sunrise gradient is pulled to the dark side: '+nudged);
});

test('every pill reaches AA contrast against both edges of its own background',()=>{
 const c=skinHarness();
 const cases=[
  [{t:'grad',id:'ocean',txt:'255,255,255'},'is-night'],
  [{t:'grad',id:'rits',txt:'246,247,249',num:'255,214,10'},'is-day'],
  [{t:'hue',rgb:'255,175,204',txt:'255,255,255'},'is-24h'],
  [{t:'hue',rgb:'20,26,34'},'is-night'],
  [{},'is-day']
 ];
 for(const [skin,kind] of cases){
  const el=card('',kind);
  c.applyNextShiftSkin(el,skin);
  const tone=c.skinToneSync(skin);
  assert.ok(worstContrast(c,el,tone,'text')>=4.5,'name contrast for '+JSON.stringify(skin));
  assert.ok(worstContrast(c,el,tone,'hours')>=4,'hours contrast for '+JSON.stringify(skin));
 }
});

test('a background that cannot be measured still gets a readable pill',async()=>{
 const c=skinHarness(),el=card('','is-night');
 c.applyNextShiftSkin(el,{t:'img',id:'unreachable',txt:'255,255,255'});
 await new Promise(done=>setTimeout(done,0));
 const tone=c.NEXT_TONE_UNKNOWN;
 assert.ok(Number(painted(c,el).alpha)>0,'an unknown photo is covered before the text is drawn on it');
 assert.ok(worstContrast(c,el,tone,'text')>=4.5);
 assert.ok(worstContrast(c,el,tone,'hours')>=4);
});

test('next-shift rendering resolves full names without joining today-only worker hooks',()=>{
 const crew=[{name:'AIJA ONE',shift:12},{name:'AIJA TWO',shift:24}],cards=crew.map(w=>card(w.name)),calls=[];
 const target={classList:{remove(){},add(){}},querySelectorAll:()=>cards};
 const c=vm.createContext({document:{getElementById:()=>null},window:{mkGetWorkerSkin:name=>({owner:name}),mkApplySkinToEl:(el,skin)=>calls.push([el.name,skin.owner])},
 isValidShift:()=>true,getDutyShiftType:()=>'',getDutyShiftHours:w=>w.shift,formatSideNamePart:s=>s,mkEscAttr:s=>s,getSidePersonEmoji:()=>''});
 vm.runInContext(js.slice(js.indexOf('  function renderNextShiftCard('),js.indexOf('  const SIDE_MONTH_NAMES')),c);
 c.renderNextShiftCard(target,'summary',crew);assert.deepEqual(calls,[['AIJA ONE','AIJA ONE'],['AIJA TWO','AIJA TWO']]);
 assert.match(target.innerHTML,/data-next-worker="AIJA ONE"/);assert.doesNotMatch(target.innerHTML,/data-worker=/);
});
