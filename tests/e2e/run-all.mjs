// Runs every behavioural check against a running local server.
// usage: node run-all.mjs [auditBase=http://127.0.0.1:8012] [liveBase]
//   auditBase — scripts/local-audit-server.mjs (synthetic data, SW disabled)
//   liveBase  — scripts/local-live-server.mjs; only needed for the offline check
import {spawnSync} from 'node:child_process'; import fs from 'node:fs';
const audit=process.argv[2]||'http://127.0.0.1:8012', live=process.argv[3];
fs.mkdirSync('out',{recursive:true});
const steps=[
  ['functional',['functional.mjs',audit]],
  ['shift states',['shift-states.mjs',audit,'out/shift-states.json']],
  ['shift assertions',['shift-assert.mjs','out/shift-states.json']],
  ['hidden polling',['hidden-polling.mjs',audit]],
  ['mobile badge',['mobile-badge.mjs',audit]],
  ...(live?[['offline',['offline.mjs',live]]]:[]),
];
let failed=0;
for(const [name,args] of steps){ const r=spawnSync(process.execPath,args,{stdio:'inherit'}); if(r.status){ failed++; console.log(`✖ ${name} failed`); } }
if(!live) console.log('(offline check skipped — pass a local-live-server URL as the 2nd argument)');
console.log(failed?`\n${failed} step(s) failed`:'\nALL E2E STEPS PASSED'); process.exit(failed?1:0);
