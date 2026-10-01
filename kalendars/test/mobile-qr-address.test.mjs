import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const hx=fs.readFileSync(new URL('../js/page/mk-header-x.js',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const extract=(src,start,end)=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));

test('the phone QR always opens rgapp.page, also from a computer on the old GitHub Pages copy',()=>{
 for(const href of ['https://rg2055.github.io/Minka/kalendars/index.html','http://127.0.0.1:8010/kalendars/index.html','https://rgapp.page/kalendars/index.html']){
  const c=vm.createContext({location:new URL(href),shell:()=>null,URL});
  vm.runInContext(extract(hx,'  function mobileBaseUrl() {','  function mobileEls() {'),c);
  assert.equal(c.mobileBaseUrl(),'https://rgapp.page/mobile.html',href);
 }
 const body=extract(shell,'  function buildMobileBaseUrl() {','  function buildMobilePairUrl(');
 for(const app of ['rad','rg']){
  const c=vm.createContext({window:{MINKA_APP:app},location:new URL('https://rg2055.github.io/Minka/'),MOBILE_QR_PUBLIC_URL:'https://rgapp.page/mobile.html'});
  vm.runInContext(body,c);
  assert.equal(c.buildMobileBaseUrl(),'https://rgapp.page/mobile.html'+(app==='rad'?'?app=rad':''));
 }
});
