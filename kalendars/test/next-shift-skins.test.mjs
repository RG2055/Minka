import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../js/calendar.js',import.meta.url),'utf8');
function card(name=''){
 const props=new Map(),classes=new Set();
 return {name,props,classes,style:{setProperty:(k,v)=>props.set(k,v),removeProperty:k=>props.delete(k)},classList:{add:(...ks)=>ks.forEach(k=>classes.add(k)),remove:(...ks)=>ks.forEach(k=>classes.delete(k))},getAttribute:key=>key==='data-next-worker'?name:null};
}
function skinHarness(){const c=vm.createContext({GRAD_MAP:{ocean:'linear-gradient(blue, teal)'},artUrl:id=>'art/'+id+'.webp',stockSkinUrl:id=>'stock/'+id+'.jpg'});vm.runInContext(html.slice(html.indexOf('  function applyNextShiftSkin('),html.indexOf('  window.mkApplySkinToEl =')),c);return c;}
test('next-shift skins keep each persons background and text inside their own pill',()=>{
 const c=skinHarness(),a=card(),b=card();
 c.applyNextShiftSkin(a,{t:'img',id:'sea',txt:'200,230,255',num:'90,180,240',numA:.8,fx:'spark'});
 c.applyNextShiftSkin(b,{t:'grad',id:'ocean',txt:'255,210,120'});
 assert.equal(a.props.get('--mk-next-bg'),"url('stock/sea.jpg')");
 assert.equal(b.props.get('--mk-next-bg'),'linear-gradient(blue, teal)');
 assert.equal(a.props.get('--mk-next-text'),'rgb(200,230,255)');
 assert.equal(b.props.get('--mk-next-hours'),'rgba(255,210,120,1)');
 assert.equal(a.props.get('--mk-next-hours'),'rgba(90,180,240,0.8)');
 assert.deepEqual([...a.classes],['mk-next-has-text','mk-next-has-hours'],'particle effects are not copied');
 c.applyNextShiftSkin(a,null);assert.equal(a.props.size,0);assert.equal(a.classes.size,0);
 assert.equal(b.props.get('--mk-next-text'),'rgb(255,210,120)','reset does not alter a neighbour');
});
test('switching image to tint and art clears the previous skin without stale colours',()=>{
 const c=skinHarness(),a=card();c.applyNextShiftSkin(a,{t:'img',id:'forest',txt:'255,255,255'});
 c.applyNextShiftSkin(a,{t:'hue',rgb:'30,90,150'});
 assert.equal(a.props.get('--mk-next-bg'),undefined);assert.equal(a.props.get('--mk-next-text'),undefined);
 assert.equal(a.props.get('--mk-next-tint'),'rgba(30,90,150,.3)');
 c.applyNextShiftSkin(a,{t:'art',id:'moon'});assert.equal(a.props.get('--mk-next-tint'),undefined);assert.equal(a.props.get('--mk-next-bg'),"url('art/moon.webp')");
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
