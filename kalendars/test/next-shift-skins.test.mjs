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
 vm.runInContext(html.slice(html.indexOf('  function applyNextShiftSkin('),html.indexOf('  /* /rad no longer gives residents')),c);
 return c;
}
/* The pill's text sits on its own dark left and the picture only fills the right (side-cards-v2.css), so a skin
   gives the pill nothing but its picture or tone: no per-picture text colours to compute. */
test('next-shift skins keep each persons background inside their own pill',()=>{
 const c=skinHarness(),a=card(),b=card();
 c.applyNextShiftSkin(a,{t:'img',id:'sea',txt:'200,230,255',num:'90,180,240',numA:.8,fx:'spark'});
 c.applyNextShiftSkin(b,{t:'grad',id:'ocean',txt:'255,210,120'});
 assert.equal(a.props.get('--mk-next-bg'),"url('stock/sea.jpg')");
 assert.equal(b.props.get('--mk-next-bg'),'linear-gradient(#0d1b2a, #123044)');
 assert.deepEqual([...a.classes],['is-day'],'particle effects are not copied');
 c.applyNextShiftSkin(a,null);assert.equal(a.props.size,0);
 assert.equal(b.props.get('--mk-next-bg'),'linear-gradient(#0d1b2a, #123044)','reset does not alter a neighbour');
});

test('switching image to tint and art clears the previous skin',()=>{
 const c=skinHarness(),a=card();c.applyNextShiftSkin(a,{t:'img',id:'forest',txt:'255,255,255'});
 c.applyNextShiftSkin(a,{t:'hue',rgb:'30,90,150'});
 assert.equal(a.props.get('--mk-next-bg'),undefined);
 assert.equal(a.props.get('--mk-next-tint'),'rgb(30,90,150)');
 c.applyNextShiftSkin(a,{t:'art',id:'moon'});assert.equal(a.props.get('--mk-next-tint'),undefined);assert.equal(a.props.get('--mk-next-bg'),"url('art/moon.webp')");
});

test('next-shift rendering resolves full names without joining today-only worker hooks',()=>{
 const crew=[{name:'AIJA ONE',shift:12},{name:'AIJA TWO',shift:24}],cards=crew.map(w=>card(w.name)),calls=[];
 const target={classList:{remove(){},add(){}},querySelectorAll:()=>cards};
 const c=vm.createContext({document:{getElementById:()=>null},window:{mkGetWorkerSkin:name=>({owner:name}),mkApplySkinToEl:(el,skin)=>calls.push([el.name,skin.owner])},
 isValidShift:()=>true,getDutyShiftType:()=>'',getDutyShiftHours:w=>w.shift,formatSideNamePart:s=>s,mkEscAttr:s=>s,getSidePersonEmoji:()=>'',mkLineIcon:name=>'<svg data-icon="'+name+'"></svg>'});
 vm.runInContext(js.slice(js.indexOf('  function renderNextShiftCard('),js.indexOf('  const SIDE_MONTH_SHORT')),c);
 c.renderNextShiftCard(target,'summary',crew);assert.deepEqual(calls,[['AIJA ONE','AIJA ONE'],['AIJA TWO','AIJA TWO']]);
 assert.match(target.innerHTML,/data-next-worker="AIJA ONE"/);assert.match(target.innerHTML,/<svg data-icon="sun"><\/svg>12 h/,'the shift mark is the shared line icon, not an emoji');assert.match(target.innerHTML,/<svg data-icon="clock"><\/svg>24 h/,'a 24 h shift shows the clock');assert.doesNotMatch(target.innerHTML,/data-worker=/);
});
