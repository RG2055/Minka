// Local preview of real files and the deployed shared-profile API. No fixtures.
// node scripts/local-live-server.mjs [port]
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=await realpath(fileURLToPath(new URL('../',import.meta.url)));
const port=Number(process.argv[2]||8000);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
 try{
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)){res.writeHead(403).end();return;}
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(url.pathname.startsWith('/dezura/v2/')){
   if(!['GET','POST','OPTIONS'].includes(req.method)){res.writeHead(405).end();return;}
   if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)){res.writeHead(403).end();return;}
   let size=0;const parts=[];
   for await(const part of req){size+=part.length;if(size>262144){res.writeHead(413).end();return;}parts.push(part);}
   const upstream=await fetch('https://lacitis-api.gamernr1elite.workers.dev'+url.pathname,{
    method:req.method,headers:{'Content-Type':'application/json'},
    body:req.method==='POST'?Buffer.concat(parts):undefined,signal:AbortSignal.timeout(15000)
   });
   res.writeHead(upstream.status,{'Content-Type':'application/json','Cache-Control':'no-store'});
   res.end(Buffer.from(await upstream.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const decoded=decodeURIComponent(url.pathname);
  if(decoded.split('/').some(segment=>segment.startsWith('.'))){res.writeHead(403).end();return;}
  let file=await realpath(path.join(root,decoded));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  let info=await stat(file);if(info.isDirectory()){file=await realpath(path.join(file,'index.html'));info=await stat(file);}
  if(!file.startsWith(root+path.sep)||!info.isFile()){res.writeHead(403).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store'});
  if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch(error){if(!res.headersSent)res.writeHead(error.code==='ENOENT'?404:502,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Priekšskatījuma pieprasījums neizdevās.'}));}
}).listen(port,'127.0.0.1',()=>console.log('Real-data preview: http://127.0.0.1:'+port));
