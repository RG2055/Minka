// Prepare an updated EXISTING lacitis-api bundle. This script never deploys.
// Usage: node integrations/lacitis/build-worker.mjs /path/to/downloaded-worker.js /tmp/lacitis-review
import fs from 'node:fs';
import path from 'node:path';
const [input,output]=process.argv.slice(2);if(!input||!output)throw new Error('Provide the existing worker source and output directory.');
let source=fs.readFileSync(input,'utf8');
const legacyCall='const response = await handleDezuraAuth(path, request, env);';
if(!source.includes('// src/backend/dezuraAuth.ts')||source.split(legacyCall).length!==2||source.includes('handleSharedMediaAuth'))throw new Error('Existing worker structure differs. Review before patching.');
// Add versioned routes so an old deployed player remains usable during rollout.
source='import {handleDezuraAuth as handleSharedMediaAuth} from "./dezura-auth.mjs";\n'+source.replace(legacyCall,
 `const response = path.startsWith("dezura/v2/")
          ? await handleSharedMediaAuth(path.replace("dezura/v2/", "dezura/"), request, env)
          : await handleDezuraAuth(path, request, env);`);
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'worker.js'),source);
fs.copyFileSync(new URL('./dezura-auth.mjs',import.meta.url),path.join(output,'dezura-auth.mjs'));
fs.copyFileSync(new URL('./schema.sql',import.meta.url),path.join(output,'schema.sql'));
console.log('Prepared local review bundle in '+output+'. No deployment.');
