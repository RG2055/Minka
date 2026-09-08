// Run by the administrator only. Uses the existing API, never reads or changes a PIN.
// LACITIS_RECOVERY_ADMIN_KEY must be configured as a Worker secret and in this shell.
import readline from 'node:readline/promises';
const [base,name]=process.argv.slice(2),key=process.env.LACITIS_RECOVERY_ADMIN_KEY;
if(!base||!name||!key)throw new Error('Provide API base URL, full worker name and LACITIS_RECOVERY_ADMIN_KEY.');
const url=new URL(base);if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('HTTPS required.');
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
const answer=await rl.question('Issue a NEW recovery code for '+name+'? Type the full name to confirm: ');rl.close();
if(answer!==name)throw new Error('Cancelled.');
const response=await fetch(new URL('/dezura/v2/admin/recovery',url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,adminKey:key}),signal:AbortSignal.timeout(15000)});
const result=await response.json();if(!response.ok)throw new Error(result.error);
console.log('Give this code ONLY to '+result.name+': '+result.recoveryCode.match(/.{1,4}/g).join('-'));
