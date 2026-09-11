// Local-only preview. New check-ins/radio records stay on this computer.
import http from 'node:http';import {networkInterfaces} from 'node:os';
import {readFile,writeFile,mkdir,rename,realpath,stat} from 'node:fs/promises';import {createReadStream} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import '../kalendars/js/daybook-model.js';
const M=globalThis.MinkaDaybookModel,root=await realpath(fileURLToPath(new URL('../',import.meta.url))),port=Number(process.argv[2]||8010);
const addresses=Object.values(networkInterfaces()).flat().filter(n=>n.family==='IPv4'&&!n.internal).map(n=>n.address),hosts=new Set(['localhost','127.0.0.1',...addresses].map(h=>h+':'+port));
const dir=path.join(root,'.local-preview'),file=path.join(dir,'daybook.json');await mkdir(dir,{recursive:true});
let saved;try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;saved={entries:[],radio:[]};}
let pending=Promise.resolve();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
http.createServer(async(req,res)=>{
 try{
 if(!hosts.has(req.headers.host)){json(res,{error:'Host not allowed'},403);return;}
 const origin='http://'+req.headers.host,url=new URL(req.url,origin);
 if(req.headers.origin&&req.headers.origin!==origin){json(res,{error:'Origin not allowed'},403);return;}
 if(url.pathname.startsWith('/__local/')){
 if(url.pathname==='/__local/daybook'&&req.method==='GET'){json(res,saved);return;}
 if(!['/__local/daybook','/__local/radio'].includes(url.pathname)||req.method!=='POST'){json(res,{error:'Not found'},404);return;}
 let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16000){json(res,{error:'Too large'},413);return;}}
 const input=JSON.parse(raw);let entry;
 if(url.pathname.endsWith('daybook')){entry=M.cleanEntry(input);if(entry.day>M.dutyDay())throw Error('Future day');}
 else{if(!M.day(input.day)||input.day>M.dutyDay()||typeof input.name!=='string'||!input.name.trim()||input.name.length>120)throw Error('Invalid radio');entry={day:input.day,name:input.name.trim(),firstAt:Date.now()};}
 const task=pending.then(async()=>{const next={entries:saved.entries,radio:saved.radio};if(url.pathname.endsWith('daybook'))next.entries=M.merge(saved.entries,entry);else if(!saved.radio.some(e=>e.day===entry.day&&M.norm(e.name)===M.norm(entry.name)))next.radio=[...saved.radio,entry].slice(-3000);
 await writeFile(file+'.tmp',JSON.stringify(next));await rename(file+'.tmp',file);saved=next;});pending=task.catch(()=>{});await task;json(res,saved);return;
 }
 if(url.pathname.startsWith('/dezura/v2/')){
 if(!['POST','GET'].includes(req.method)){json(res,{},405);return;}
 let raw='';for await(const c of req){raw+=c;if(raw.length>262144)throw Error('Too large');}
 const r=await fetch('https://lacitis-api.gamernr1elite.workers.dev'+url.pathname,{method:req.method,headers:{'Content-Type':'application/json'},body:req.method==='POST'?raw:undefined,signal:AbortSignal.timeout(15000)});res.writeHead(r.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await r.text());return;
 }
 if(!['GET','HEAD'].includes(req.method)){json(res,{},405);return;}
 const decoded=decodeURIComponent(url.pathname);
 if(decoded==='/sw.js'||decoded.split('/').some(s=>s.startsWith('.'))||/^\/(scripts|cloudflare|integrations)\//.test(decoded)){json(res,{},404);return;}
 let target=await realpath(path.join(root,decoded));if(target!==root&&!target.startsWith(root+path.sep)){json(res,{},403);return;}
 let info=await stat(target);if(info.isDirectory()){target=await realpath(path.join(target,'index.html'));info=await stat(target);}
 if(!target.startsWith(root+path.sep)||!info.isFile()){json(res,{},403);return;}
 const ext=path.extname(target);if(!mime[ext]){json(res,{},404);return;}
 res.writeHead(200,{'Content-Type':mime[ext],'Cache-Control':'no-store'});if(req.method==='HEAD'){res.end();return;}
 if(ext==='.html'){const html=await readFile(target,'utf8');res.end(html.replace('<head>','<head><script>window.MINKA_LOCAL_DAYBOOK=true;</script>'));}else createReadStream(target).pipe(res);
 }catch(e){if(!res.headersSent)json(res,{error:e.code==='ENOENT'?'Not found':'Request failed'},e.code==='ENOENT'?404:400);else res.destroy();}
}).listen(port,'0.0.0.0',()=>console.log(['http://127.0.0.1:'+port,...addresses.map(ip=>'http://'+ip+':'+port)].join('\n')));
