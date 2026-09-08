// The host owns one login. The player verifies its token before switching libraries.
(function(){
 let generation=0,currentToken='',libraryReady=false,saveTimer=0;
 window.__lacLibraryReady=false;
 const parentOrigin=(()=>{try{return new URL(document.referrer).origin;}catch(_){return location.origin;}})();
 function host(type){if(window.parent!==window)window.parent.postMessage({type},parentOrigin);}
 const originalOpen=openDezuraModal;
 openDezuraModal=function(){if(MINI_EMBED)host('lac_shared_login_request');else originalOpen();};
 async function request(path,payload){
  const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),12000);
  try{const r=await fetch(DEZURA_API+'/dezura/v2/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal});if(!r.ok)throw new Error('Profila pieprasījums neizdevās.');return await r.json();}finally{clearTimeout(t);}
 }
 const originalApply=dezuraApplyLibrary;
 dezuraLoadLibrary=async function(){
  const gen=generation,owner=dezuraSession;if(!owner?.sessionToken)return false;
  try{const result=await request('library/load',{sessionToken:owner.sessionToken});if(gen!==generation)return false;if(result.data)originalApply(result.data);libraryReady=true;window.__lacLibraryReady=true;return true;}catch(_){if(gen===generation)setDezuraSyncStatus('error');return false;}
 };
 dezuraSaveLibrary=async function(){
  const gen=generation,owner=dezuraSession;if(!libraryReady||!owner?.sessionToken)return false;
  const snapshot=dezuraGetLibrarySnapshot();
  try{setDezuraSyncStatus('syncing');await request('library/save',{sessionToken:owner.sessionToken,data:snapshot});if(gen===generation)setDezuraSyncStatus('synced');return true;}catch(_){if(gen===generation)setDezuraSyncStatus('error');return false;}
 };
 scheduleDezuraSync=function(){clearTimeout(saveTimer);const gen=generation;saveTimer=setTimeout(()=>{if(gen===generation)void dezuraSaveLibrary();},900);};
 window.lacApplySharedProfile=async function(next){
  const token=next?.sessionToken||'';if(token===currentToken&&libraryReady)return;
  const gen=++generation;currentToken=token;libraryReady=false;window.__lacLibraryReady=false;clearTimeout(saveTimer);clearTimeout(dezuraSyncTimer);
  dezuraClearSession();setUserChip('');window.__lacitisMiniProfileChanged?.();
  if(!token){renderLikedView();return;}
  try{
   const verified=await request('session',{sessionToken:token});if(gen!==generation)return;
   dezuraSession={...verified.session,sessionToken:token};
   setUserChip(dezuraSession.name);setDezuraSyncStatus('syncing');
   const ok=await dezuraLoadLibrary();if(gen!==generation)return;
   setDezuraSyncStatus(ok?'synced':'error');window.__lacitisMiniProfileChanged?.();
  }catch(_){if(gen===generation){dezuraClearSession();currentToken='';setDezuraSyncStatus('error');}}
 };
 // Defer logout to the same owner as radio, including the full-player control.
 document.getElementById('dezura-logout')?.addEventListener('click',()=>host('lac_shared_logout_request'));
})();
