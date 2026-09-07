// Equation-level audit using an external, unmodified FIPS source file.
// Usage: node scripts/check-fatigue-fips.mjs /path/to/simulation_unifiedfatiguemodel.R
// Does not bundle FIPS (AGPL-3.0) in the PWA or claim to run the full R package.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const source=fs.readFileSync(process.argv[2],'utf8');
const ctx=vm.createContext({Date});
vm.runInContext(fs.readFileSync(new URL('../kalendars/js/sleep-model.js',import.meta.url),'utf8'),ctx);
const m=ctx.MinkaSleepModel,p=m.parameters;
function reference(name,args){
 const match=source.match(new RegExp(name+' <- function\\(([^)]*)\\) \\{([\\s\\S]*?)\\n\\}'));
 if(!match)throw new Error('Reference function not found: '+name);
 const names=match[1].split(',').map(s=>s.trim().split(' ')[0]);
 const body=match[2].replace(/#[^\n]*/g,'').replace(/\bexp\(/g,'Math.exp(').replace(/\bsin\(/g,'Math.sin(').replace(/\bpi\b/g,'Math.PI');
 // Only the small arithmetic functions explicitly listed below are interpreted.
 const sandbox=vm.createContext(Object.fromEntries(names.map((n,i)=>[n,args[i]])));
 return vm.runInContext('(function(){'+body+'})()',sandbox,{timeout:100});
}
let maxError=0,cases=0;
for(const state of [{S:8,L:10},{S:4,L:3}])for(const h of [.1,1,2])for(const sleep of [false,true]){
 const actual=m.advance(state,h,sleep);
 const expected=sleep?{
  S:reference('unified_Spfun',[state.S,h,p.sleepTau,p.U,p.debtTau,state.L]),
  L:reference('unified_Lpfun',[state.L,h,p.debtTau,p.U])
 }:{S:reference('unified_Sfun',[state.S,h,p.wakeTau,p.U]),L:reference('unified_Lfun',[state.L,h,p.debtTau,p.U])};
 // FIPS lacks the later model's lower-asymptote floor: compare before crossing.
 assert.ok(expected.L>=-.11*p.U);
 maxError=Math.max(maxError,Math.abs(expected.S-actual.S),Math.abs(expected.L-actual.L));cases++;
}
assert.ok(maxError<1e-10);
console.log(JSON.stringify({reference:'humanfactors/FIPS/R/simulation_unifiedfatiguemodel.R',sha256:crypto.createHash('sha256').update(source).digest('hex'),cases,maxError,scope:'State equations with matched parameters, before debt-floor crossing. Not full-package or clinical validation.',differences:['FIPS defaults use a different 2016 parameter set.','FIPS fifth circadian harmonic is 0.0001; current PWA is 0.001.','FIPS does not apply the later lower-asymptote floor.']},null,2));
