// node compare.mjs <baseDir1,baseDir2,...> <afterDir> <diffDir>
import fs from 'node:fs'; import {PNG} from 'pngjs'; import pixelmatch from 'pixelmatch';
const [AS,B,D]=process.argv.slice(2); const bases=AS.split(','); fs.mkdirSync(D,{recursive:true});
const rb=JSON.parse(fs.readFileSync(B+'/report.json')); let bad=0;
const txt=r=>r.frames.map(f=>f.path+':'+f.text).join('|');
for(const k of Object.keys(rb)){
  const c=PNG.sync.read(fs.readFileSync(`${B}/${k}.png`)); let best=null;
  for(const A of bases){ const ra=JSON.parse(fs.readFileSync(A+'/report.json'));
    const a=PNG.sync.read(fs.readFileSync(`${A}/${k}.png`)); const diff=new PNG({width:a.width,height:a.height});
    const n=pixelmatch(a.data,c.data,diff.data,a.width,a.height,{threshold:0.1});
    if(!best||n<best.n) best={n,diff,A,ra:ra[k],w:a.width,h:a.height}; }
  const textOk=bases.some(A=>txt(JSON.parse(fs.readFileSync(A+'/report.json'))[k])===txt(rb[k]));
  const allBaseErrs=new Set(bases.flatMap(A=>JSON.parse(fs.readFileSync(A+'/report.json'))[k].errs));
  const newErrs=rb[k].errs.filter(e=>!allBaseErrs.has(e));
  if(best.n) fs.writeFileSync(`${D}/${k}.diff.png`,PNG.sync.write(best.diff));
  const flag=(best.n>0||!textOk||newErrs.length)?'  <-- CHECK':''; if(flag)bad++;
  console.log(`${k.padEnd(18)} px-diff=${String(best.n).padStart(6)} (${(100*best.n/(best.w*best.h)).toFixed(3)}%) text=${textOk?'same':'DIFF'} nodes ${best.ra.frames.map(f=>f.nodes).join('+')} -> ${rb[k].frames.map(f=>f.nodes).join('+')} newErrors=${newErrs.length}${newErrs.length?' '+JSON.stringify(newErrs):''}${flag}`);
}
console.log(bad?`${bad} state(s) need a look`:'ALL STATES IDENTICAL TO A BASELINE RUN');
