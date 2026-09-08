// Isolated UI verification: synthetic data only; external requests blocked.
import http from 'node:http';
import {handleDezuraAuth} from '../integrations/lacitis/dezura-auth.mjs';
import {localDb} from '../integrations/lacitis/local-db.mjs';
const mediaDb=localDb('/tmp/minka-media-fixture.sqlite');
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const fixture=String.raw`(()=>{
 const q=new URLSearchParams(location.search), baseline=false, cold=q.has('cold');
 const delayMs=Math.max(0,Math.min(60000,Number(q.get('delay')||1000)));
 sessionStorage.setItem('minka_api_token_v1','local-fixture-only');
 try{delete Navigator.prototype.serviceWorker;}catch(_){}
 const names=['ALPHA TEST','BETA TEST','GAMMA TEST','DELTA TEST'];
 const skinState=JSON.parse(localStorage.getItem('minka:audit-skins')||'null')||{'ALPHA TEST':'grad:menta;txt:217,249,234;num:110,231,183','BETA TEST':'grad:zelts;txt:255,247,230;num:252,211,77'};
 const emojiState={}; const bolusState={ge:{changedAt:Date.now()-3600000,history:[{ts:Date.now()-3600000,name:'ALPHA TEST'}]},philips:{changedAt:null,history:[]}};
 const history=n=>({ok:true,nights:n,parts:Object.fromEntries(names.map(name=>[name,[4,3,2,1]])),beds:{}});
 if(cold)localStorage.removeItem('minkaNightStatsV1');
 else localStorage.setItem('minkaNightStatsV1',JSON.stringify({at:Date.now()-13*3600000,data:history(10)}));
 const days=Array.from({length:30},(_,i)=>({date:String(i+1).padStart(2,'0')+'.09.2026',workers:names.map(name=>({name,shift:'24'}))}));
 const schedule={knownCarryovers:{},radiographers:{'SEPTEMBRIS 2026':days},radiologists:{'SEPTEMBRIS 2026':days.map(d=>({...d,workers:d.workers.slice(0,2)}))}};
 const realFetch=window.fetch.bind(window), result={baseline,cold,delayMs,requests:0,requestAt:null,panelAt:null,rowsAt:null,firstText:null,errors:[]};
 function show(){const el=document.getElementById('audit-result');if(el)el.textContent=JSON.stringify({...result,rowWaitMs:result.rowsAt===null?null:Math.round(result.rowsAt-result.panelAt),prefetched:result.requestAt!==null&&result.panelAt!==null&&result.requestAt<result.panelAt});}
 window.addEventListener('error',e=>{result.errors.push(e.message);show();});
 window.addEventListener('unhandledrejection',e=>{result.errors.push(String(e.reason));show();});
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(url.origin===location.origin)return realFetch(input,options);
  let body={};
  if(url.pathname.includes('/api/schedule'))body=schedule;
  else if(url.pathname.includes('/api/ns-stats')){
   result.requests++;result.requestAt=performance.now();show();
   await new Promise((resolve,reject)=>{const id=setTimeout(resolve,delayMs);options.signal?.addEventListener('abort',()=>{clearTimeout(id);reject(new DOMException('Aborted','AbortError'));},{once:true});});
   body=history(20);
  }
  else if(url.pathname.includes('/api/coffee'))body={ok:true,counts:{},details:{},totals:{}};
  else if(url.pathname.includes('/api/feedback'))body={ok:true,ratings:{},entryCounts:{comment:0,suggestion:0},messages:[],days:[]};
  else if(url.pathname.includes('/api/birthdays'))body={ok:true,birthdays:[{d:'08.09',name:'ALPHA TEST'}]};
  else if(url.pathname.includes('/api/emoji')){if(options.method==='POST'){const data=JSON.parse(options.body);if(data.emoji)emojiState[data.worker]=data.emoji;else delete emojiState[data.worker];body={ok:true};}else body=emojiState;}
  else if(url.pathname.includes('/api/skins')){if(options.method==='POST'){const data=JSON.parse(options.body);if(data.skin)skinState[data.worker]=data.skin;else delete skinState[data.worker];localStorage.setItem('minka:audit-skins',JSON.stringify(skinState));body={ok:true};}else body=skinState;}
  else if(url.pathname.includes('/api/phones'))body=[];
  else if(url.hostname==='script.google.com'){const action=url.searchParams.get('action'), room=url.searchParams.get('room');if(action==='write'&&bolusState[room]){const ts=Number(url.searchParams.get('ts'));bolusState[room].changedAt=ts;bolusState[room].history.unshift({ts,name:url.searchParams.get('name')});}body=action?{ok:true}:bolusState;}
  return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.createElement('button');btn.textContent='Atvērt nakts testu';btn.style='position:fixed;bottom:8px;left:8px;z-index:2147483647';btn.onclick=()=>window.toggleNsOverlay(true);document.body.append(btn);
  const out=document.createElement('pre');out.id='audit-result';out.style='display:none';document.body.append(out);show();
  new MutationObserver(()=>{
   const panel=document.getElementById('nsStatsBody');if(!panel)return;
   if(result.panelAt===null){result.panelAt=performance.now();show();}
   if(result.rowsAt===null&&panel.querySelector('.ns-stat-row')){result.rowsAt=performance.now();result.firstText=panel.textContent;show();}
  }).observe(document.body,{childList:true,subtree:true});
 });
})();`;
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://local');
 if(u.pathname==='/__profile-viewport'){
  const width=Math.max(280,Math.min(1600,Number(u.searchParams.get('width'))||360)),height=Math.max(320,Math.min(1200,Number(u.searchParams.get('height'))||480));
  res.setHeader('content-type','text/html');res.setHeader('cache-control','no-store');
  res.end(`<!doctype html><html><head><title>Local profile viewport check</title></head><body style="margin:0;background:#18221e"><iframe title="Radio viewport check" src="/index.html" style="display:block;border:0;width:${width}px;height:${height}px"></iframe></body></html>`);return;
 }

 if(u.pathname.startsWith('/dezura/')){
  try{
   const request=new Request(u,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:req,duplex:'half'}:{})});
   const result=await handleDezuraAuth(u.pathname.slice(1).replace('dezura/v2/','dezura/'),request,{DB:mediaDb});
   res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
  }catch(_){res.writeHead(500);res.end('{"error":"Local test server error"}');}
  return;
 }
 if(u.pathname==='/__fixture.js'){res.setHeader('content-type','text/javascript');res.end(fixture);return;}
 let p=path.resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!p.startsWith(root+'/')){res.writeHead(404);res.end();return;}
 if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
 if(!mime[path.extname(p)]||!fs.existsSync(p)||p.includes('/.')){res.writeHead(404);res.end();return;}
 res.setHeader('content-type',mime[path.extname(p)]);res.setHeader('cache-control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; frame-src 'self'");
 let data=fs.readFileSync(p);
 if(p.endsWith('.html')&&!p.includes('/integrations/lacitis/player/')){let html=data.toString().replace('<head>','<head><script src="/__fixture.js"></script>');data=html;}
 res.end(data);
});
const port=Number(process.env.MINKA_AUDIT_PORT)||8012;
server.listen(port,'127.0.0.1',()=>console.log('Synthetic local audit only: http://127.0.0.1:'+port+'/index.html'));
