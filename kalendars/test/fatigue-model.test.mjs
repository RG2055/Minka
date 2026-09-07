import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.TZ='Europe/Riga';
const source=fs.readFileSync(new URL('../js/fatigue.js',import.meta.url),'utf8');
const names=['Worker One','Worker Two','Worker Three','Worker Four'];
const shift=(date,hours=24,startTime='08:00',endTime='08:00',workers=names)=>({date,workers:workers.map(name=>({name,shift:String(hours),startTime,endTime,type:hours>=24?'DIENNAKTS':'DIENA'}))});
function env(days,at='2026-09-08T07:20:00+03:00',plan=null,stats=null){
 let timestamp=+new Date(at),raw=JSON.stringify(plan||{}),paints=0;
 const listeners={},timers=new Map();let seq=0;
 const emit=e=>(listeners[e.type]||[]).forEach(fn=>fn(e));
 const Fixed=class extends Date{constructor(...args){super(...(args.length?args:[timestamp]));}static now(){return timestamp;}};
 const doc={readyState:'loading',hidden:false,querySelector(){return null},getElementById(){return null},addEventListener(type,fn){(listeners[type]||=[]).push(fn)},dispatchEvent:emit};
 const c=vm.createContext({Date:Fixed,document:doc,CustomEvent:class{constructor(type){this.type=type}},localStorage:{getItem(key){return key==='minkaNightStatsV1'?JSON.stringify({data:stats}):raw}},setTimeout(fn,delay){timers.set(++seq,{fn,delay});return seq},clearTimeout(id){timers.delete(id)},console});
 c.window=c;c.addEventListener=doc.addEventListener;c.__grafiksStore={test:days};c.__activeDateStr='08.09.2026';c.__refreshFatigueBars=()=>paints++;
 vm.runInContext(fs.readFileSync(new URL('../js/night-plan-history.js',import.meta.url),'utf8'),c);
 vm.runInContext(fs.readFileSync(new URL('../js/sleep-model.js',import.meta.url),'utf8'),c);
 vm.runInContext(fs.readFileSync(new URL('../js/recovery-model.js',import.meta.url),'utf8'),c);
 vm.runInContext(fs.readFileSync(new URL('../js/light-model.js',import.meta.url),'utf8'),c);
 vm.runInContext(source,c);
 return {c,doc,score:name=>c.__fatigue.calculateFatigue(name||names[0]),at(value){timestamp=+new Date(value)},plan(value){raw=JSON.stringify(value);emit({type:'minka:night-plan-changed'})},run(){for(const [id,t] of [...timers])if(t.delay===100){timers.delete(id);t.fn()}},paints:()=>paints};
}
const plan=(order=names,sh=0,ei=0)=>({'07.09.2026':{order,sh,ei,savedAt:1}});
test('score stays continuous when a 24h duty ends',()=>{
 const e=env([shift('03.09.2026',12,'08:00','20:00'),shift('07.09.2026')],'2026-09-08T07:59:00+03:00');
 const before=e.score().score;e.at('2026-09-08T08:00:00+03:00');const after=e.score().score;
 assert.ok(Math.abs(after-before)<=1,`${before} -> ${after}`);
 e.at('2026-09-08T20:00:00+03:00');assert.ok(e.score().score<after);
});
test('rolling hours include only elapsed overlap, including the left boundary',()=>{
 const e=env([shift('01.09.2026'),shift('07.09.2026')],'2026-09-07T09:00:00+03:00');e.c.__activeDateStr='07.09.2026';
 assert.equal(e.score().weeklyHours,25);
 e.at('2026-09-08T09:00:00+03:00');e.c.__activeDateStr='08.09.2026';assert.equal(e.score().weeklyHours,47);
});
test('four-person plan accounts for 110 work minutes and 330 rest-opportunity minutes',()=>{
 const e=env([shift('07.09.2026')],undefined,plan());const r=e.score();
 assert.equal(Math.round(r.nightRest.workHours*60),110);assert.equal(Math.round(r.nightRest.restHours*60),330);
 assert.ok(r.score<env([shift('07.09.2026')]).score().score);
 assert.ok(r.score>0);assert.match(r.scoreReasons.map(r=>r.text).join(' '),/Tas nenozīmē, ka šis laiks nogulēts/);
});
test('three-person plan distributes all 440 minutes with at most one minute difference',()=>{
 const team=names.slice(0,3),e=env([shift('07.09.2026',24,'08:00','08:00',team)],undefined,plan(team));
 const minutes=team.map(n=>Math.round(e.score(n).nightRest.workHours*60));
 assert.deepEqual(minutes,[147,147,146]);assert.equal(minutes.reduce((a,b)=>a+b),440);
});
test('future rest never earns credit; midnight is still the active preceding roster day',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T00:30:00+03:00',plan());e.c.__activeDateStr='07.09.2026';
 const r=e.score();assert.equal(r.viewMode,'today');assert.equal(r.nightRest.restHours,0);assert.equal(r.nightRest.workHours,0.5);
 e.at('2026-09-08T01:00:00+03:00');assert.equal(e.score().nightRest.workHours,1);
});
test('saved order changes invalidate same-minute scores without extra network or self-sorting',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T01:00:00+03:00',plan());const before=e.score();
 e.plan(plan([...names].reverse()));const after=e.score();assert.equal(after.nightRest.workHours,0);assert.equal(after.nightRest.restHours,1);assert.ok(after.score<before.score);e.run();assert.equal(e.paints(),1);
});
test('hidden plan update does not schedule a visual repaint',()=>{
 const e=env([shift('07.09.2026')]);e.doc.hidden=true;e.plan(plan());e.run();assert.equal(e.paints(),0);
 e.doc.hidden=false;e.doc.dispatchEvent({type:'visibilitychange'});e.run();assert.equal(e.paints(),1);
});
test('stale team, duplicates, and absent plans cannot imply rest',()=>{
 for(const p of [null,plan(names.slice(0,3)),plan([names[0],names[0],names[2],names[3]])]) assert.equal(env([shift('07.09.2026')],undefined,p).score().nightRest,null);
});
test('23:00 plan crosses midnight and counts only elapsed time',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T00:00:00+03:00',plan(names,23));const r=e.score();assert.equal(r.nightRest.workHours,1);assert.equal(r.nightRest.restHours,0);
});
test('a morning duty tail is not a full day off and absent future roster is unknown',()=>{
 const days=[shift('07.09.2026'),{date:'08.09.2026',workers:[]},{date:'09.09.2026',workers:[]}];
 const e=env(days,'2026-09-07T12:00:00+03:00');e.c.__activeDateStr='07.09.2026';assert.equal(e.score().nextDayOff.getDate(),9);
 const unknown=env([shift('07.09.2026')]);assert.equal(unknown.score().nextDayOff,null);
});
test('zero rest between back-to-back duties is detected',()=>{
 const e=env([shift('06.09.2026'),shift('07.09.2026')]);assert.equal(e.score().shortRests,1);assert.equal(e.score().minRestHours,0);
});
test('overlapping entries contribute their union and decimal hours are retained',()=>{
 const e=env([shift('07.09.2026',4,'08:00','12:00'),shift('07.09.2026',8,'08:00','16:00')]);assert.equal(e.score().weeklyHours,8);
 const f=env([shift('07.09.2026','7,5','08:00','15:30')]);assert.equal(f.score().weeklyHours,7.5);
});
test('circadian component has no abrupt 06:00 step and shared chart sample matches live score',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T05:59:00+03:00',plan());const a=e.score().score;e.at('2026-09-08T06:00:00+03:00');const b=e.score().score;assert.ok(Math.abs(a-b)<=1);
 assert.equal(b,e.c.__fatigue.scoreAt(names[0],new e.c.Date()));
});

test('changing a plan during the night preserves elapsed work before its effective time',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T01:00:00+03:00',plan());
 const before=e.score().score,old=plan()['07.09.2026'];
 const updated=e.c.MinkaNightHistory.save(old,{...old,order:[...names].reverse()},+new Date('2026-09-08T01:00:00+03:00'));
 e.plan({'07.09.2026':updated});assert.equal(e.score().score,before);assert.equal(e.score().nightRest.workHours,1);
 e.at('2026-09-08T02:00:00+03:00');assert.equal(e.score().nightRest.workHours,1);assert.equal(e.score().nightRest.restHours,1);
});
test('a first plan saved late cannot grant rest before the save',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T02:00:00+03:00');const before=e.score().score;
 const saved=e.c.MinkaNightHistory.save(null,{order:[...names].reverse(),sh:0,ei:0},+new Date('2026-09-08T02:00:00+03:00'));
 e.plan({'07.09.2026':saved});assert.equal(e.score().score,before);assert.equal(e.score().nightRest,null);
});
test('legacy remote changes append local history while identical saves do not grow it',()=>{
 const e=env([]),api=e.c.MinkaNightHistory,first=api.save(null,{order:names,sh:23.5,ei:0},100);
 const same=api.save(first,first,200);assert.equal(same.revisions.length,1);
 const remote=api.receive(same,{order:[...names].reverse(),sh:0.5,ei:0,savedAt:300});
 assert.equal(remote.revisions.length,2);assert.equal(remote.revisions[0].from,100);assert.equal(remote.revisions[1].from,300);
 assert.throws(()=>api.save(null,{order:[names[0],names[0]],sh:0,ei:0},400));
});
test('forecast distinguishes continuous rest from split rest and own duty peak',()=>{
 const e=env([shift('07.09.2026')],undefined,plan());
 const projection=n=>e.c.__fatigue.forecast(n,e.c.__fatigue.gatherWorkerHistory(n)[0]);
 const first=projection(names[0]),middle=projection(names[1]);
 assert.ok(Math.abs(first.longestRestHours-5.5)<1e-8);assert.ok(middle.longestRestHours<first.longestRestHours);
 assert.equal(first.restBeforeHours,0);assert.equal(first.restAfterHours,5.5);
 assert.ok(first.ownPeak.score<=first.peak.score);assert.ok(middle.restBeforeHours>0);
 assert.equal(projection(names[0]),first,'forecast is cached');
 e.plan(plan([...names].reverse()));assert.notEqual(projection(names[0]),first);
});
test('forecast counts exact inter-duty rest and overnight opportunities without assuming sleep',()=>{
 const e=env([shift('06.09.2026'),shift('08.09.2026'),shift('10.09.2026',12,'20:00','08:00')]);
 const h=e.c.__fatigue.gatherWorkerHistory(names[0]);
 const second=e.c.__fatigue.forecast(names[0],h[1]),third=e.c.__fatigue.forecast(names[0],h[2]);
 assert.equal(second.between.hours,24);assert.equal(second.between.nights,1);
 assert.equal(third.between.hours,36);assert.equal(third.between.nights,1);
});
test('longer time off decays the residual index and future duties cannot affect earlier samples',()=>{
 const e=env([shift('06.09.2026')]),sample=t=>e.c.__fatigue.scoreAt(names[0],new Date(t));
 const a=sample('2026-09-08T08:00:00+03:00'),b=sample('2026-09-09T08:00:00+03:00'),c=sample('2026-09-10T08:00:00+03:00');
 assert.ok(a>b&&b>c);
 const future=env([shift('06.09.2026'),shift('10.09.2026')]);assert.equal(future.c.__fatigue.scoreAt(names[0],new Date('2026-09-08T08:00:00+03:00')),a);
});
test('sleep-latency sensitivity is monotonic, separate from cached default results',()=>{
 const e=env([shift('07.09.2026')],undefined,plan()),api=e.c.__fatigue,t=new Date('2026-09-08T07:20:00+03:00');
 const scores=[0,15,30].map(latencyMinutes=>api.scoreAt(names[0],t,{latencyMinutes}));
 assert.ok(scores[0]<scores[1]&&scores[1]<scores[2]);assert.equal(api.scoreAt(names[0],t),scores[1]);
});
test('future cards explicitly identify the shift-start forecast',()=>{
 const e=env([shift('08.09.2026')],'2026-09-07T12:00:00+03:00');
 assert.equal(e.score().contextLabel,'Prognoze maiņas sākumā');assert.equal(e.score().modelVersion,17);
 e.at('2026-09-08T12:00:00+03:00');assert.equal(e.score().contextLabel,'Tagad');
});

test('forecast curve shares scores with the model and shows scheduled work during 02–06',()=>{
 const e=env([shift('07.09.2026')],undefined,plan());
 for(const n of names){const api=e.c.__fatigue,p=api.forecast(n,api.gatherWorkerHistory(n)[0]);
 assert.equal(p.samples[0].score,p.startScore);assert.equal(Math.max(...p.samples.map(s=>s.score)),p.peak.score);
 assert.ok(p.samples.every((s,i)=>s.score>=0&&s.score<=100&&(!i||s.time>p.samples[i-1].time)));
 assert.equal(p.nightBands.length,1);assert.ok(p.earlyNightWorkHours>=0&&p.earlyNightWorkHours<=4);
 }
 const first=e.c.__fatigue.forecast(names[0],e.c.__fatigue.gatherWorkerHistory(names[0])[0]);assert.equal(first.earlyNightWorkHours,0);
});

test('night alternatives use the saved three/four-person split without changing the actual plan',()=>{
 for(const count of [3,4]){
 const team=names.slice(0,count),saved=plan(team,23.5,1),e=env([shift('07.09.2026',24,'08:00','08:00',team)],'2026-09-07T21:00:00+03:00',saved);
 const api=e.c.__fatigue,h=api.gatherWorkerHistory(team[0])[0],before=e.score().score;
 const result=api.nightScenarios(team[0],h);
 assert.equal(result.options.length,count);assert.equal(result.options[0].start,+new Date('2026-09-07T23:30:00+03:00'));
 assert.equal(result.options.at(-1).end,+new Date('2026-09-08T07:30:00+03:00'));
 assert.equal(result.options.filter(o=>o.selected).length,1);assert.equal(e.score().score,before);
 assert.ok(result.options.every(o=>Number.isFinite(o.endScore)&&Number.isFinite(o.shiftEndScore)));
 }
});
test('live night preview supplies the actual settings; other dates and invalid teams cannot be invented',()=>{
 const e=env([shift('07.09.2026')],'2026-09-07T21:00:00+03:00'),api=e.c.__fatigue,h=api.gatherWorkerHistory(names[0])[0];
 assert.equal(api.nightScenarios(names[0],h),null);
 e.c.__ns={getPlan:()=>({date:'07.09.2026',sh:0.5,ei:2,segments:names.map(name=>({name}))})};
 const result=api.nightScenarios(names[0],h);assert.equal(result.saved,false);assert.equal(result.options[0].start,+new Date('2026-09-08T00:30:00+03:00'));assert.equal(result.options.at(-1).end,+new Date('2026-09-08T08:00:00+03:00'));
 e.c.__ns.getPlan=()=>({date:'08.09.2026',sh:0,ei:0,segments:names.map(name=>({name}))});assert.equal(api.nightScenarios(names[0],h),null);
});
test('night alternatives do not offer already started slots or rewrite elapsed history',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T03:00:00+03:00',plan()),api=e.c.__fatigue,h=api.gatherWorkerHistory(names[3])[0];
 const before=api.scoreAt(names[3],new Date('2026-09-08T02:00:00+03:00'));
 const result=api.nightScenarios(names[3],h);
 assert.equal(result.options[0].unavailable,true);assert.equal(result.options[1].unavailable,true);assert.equal(result.options[2].unavailable,false);
 assert.equal(api.scoreAt(names[3],new Date('2026-09-08T02:00:00+03:00')),before);
 assert.equal(api.nightScenarios(names[3],h,new Date('2026-09-08T08:00:00+03:00')),null);
});

test('rest timing affects the common morning score; later work is not summed identically',()=>{
 const e=env([shift('07.09.2026')],'2026-09-07T21:00:00+03:00',plan()),api=e.c.__fatigue,entry=api.gatherWorkerHistory(names[0])[0];
 const options=api.nightScenarios(names[0],entry).options;
 assert.ok(options[0].shiftEndScore<options[3].shiftEndScore,JSON.stringify(options));
 assert.ok(new Set(options.map(o=>o.shiftEndScore)).size>1);
});
test('splitting an unchanged rest interval into revisions does not invent extra recovery',()=>{
 const base=plan(),e=env([shift('07.09.2026')],undefined,base),api=e.c.__fatigue;
 const score=e.score().score,p=base['07.09.2026'];
 e.plan({'07.09.2026':{...p,revisions:[{...p,from:1},{...p,from:+new Date('2026-09-08T04:00:00+03:00')},{...p,from:+new Date('2026-09-08T06:00:00+03:00')}]}});
 assert.equal(e.score().score,score);
});
test('rest recovery remains continuous at slot boundaries and keeps simulated history unchanged',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T01:50:00+03:00',plan()),api=e.c.__fatigue;
 const sample=t=>api.scoreAt(names[0],new Date(t));
 assert.ok(Math.abs(sample('2026-09-08T01:49:59+03:00')-sample('2026-09-08T01:50:01+03:00'))<=1);
 assert.ok(sample('2026-09-08T07:20:00+03:00')<env([shift('07.09.2026')]).score().score);
});

test('draft headline and curve use the same night plan as the selected alternative',()=>{
 for(const count of [3,4]){
  const team=names.slice(0,count),e=env([shift('07.09.2026',24,'08:00','08:00',team)],'2026-09-07T21:00:00+03:00');
  e.c.__ns={getPlan:()=>({date:'07.09.2026',sh:0,ei:0,segments:team.map(name=>({name}))})};
  const api=e.c.__fatigue;
  for(const name of team){
   const entry=api.gatherWorkerHistory(name)[0],baseline=api.forecast(name,entry),before=e.score(name).score;
   const result=api.nightScenarios(name,entry),selected=result.options.find(o=>o.selected);
   assert.equal(result.projection.endScore,selected.shiftEndScore);
   assert.equal(result.projection.samples.at(-1).score,selected.shiftEndScore);
   assert.equal(result.projection.samples.find(s=>s.time===selected.end).score,selected.endScore);
   assert.ok(result.projection.endScore<baseline.endScore);
   assert.equal(e.score(name).score,before,'draft must not change current fatigue');
  }
 }
});
test('a changed preview keeps elapsed curve samples and current fatigue intact',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T03:00:00+03:00',plan()),api=e.c.__fatigue;
 e.c.__ns={getPlan:()=>({date:'07.09.2026',sh:0,ei:0,segments:[...names].reverse().map(name=>({name}))})};
 const entry=api.gatherWorkerHistory(names[0])[0],before=api.forecast(names[0],entry),result=api.nightScenarios(names[0],entry);
 for(const s of result.projection.samples.filter(s=>s.time<=e.c.Date.now())){
  assert.equal(s.score,api.scoreAt(names[0],new Date(s.time)));
 }
 assert.equal(result.projection.endScore,result.options.find(o=>o.selected).shiftEndScore);
 assert.notEqual(result.projection,before,'draft forecast cannot reuse saved-plan cache');
});
test('schedule end stays exact when the displayed countdown is one second behind',()=>{
 const e=env([shift('07.09.2026')],'2026-09-07T21:00:00+03:00');
 e.c.__activeDateStr='07.09.2026';
 e.doc.querySelector=selector=>selector.includes('.duty-timer')?{textContent:'10:59:59'}:null;
 const f=e.score();
 assert.equal(+f.currentShiftEnd,+new Date('2026-09-08T08:00:00+03:00'));
 assert.equal(f.hoursToShiftEnd,11);
});

test('all 30 supported three/four-person start/end combinations cover the exact chosen night',()=>{
 for(const count of [3,4])for(const sh of [23,23.5,0,0.5,1])for(const ei of [0,1,2]){
  const team=names.slice(0,count),e=env([shift('07.09.2026',24,'08:00','08:00',team)],'2026-09-07T21:00:00+03:00',plan(team,sh,ei));
  const api=e.c.__fatigue,entry=api.gatherWorkerHistory(team[0])[0],p=api.nightScenarios(team[0],entry);
  assert.equal(p.options.length,count);
  const start=new Date(2026,8,sh>=20?7:8,Math.floor(sh),sh%1*60),end=new Date(2026,8,8,7,[20,30,60][ei]);
  assert.equal(p.options[0].start,+start);assert.equal(p.options.at(-1).end,+end);
  let total=0;
  p.options.forEach((o,i)=>{
   if(i)assert.equal(o.start,p.options[i-1].end);
   total+=o.end-o.start;
   for(const s of o.sleep){assert.ok(s.start>=+start&&s.end<=+end);assert.ok(s.end<=o.start||s.start>=o.end,'no sleep during own work');}
   assert.ok(o.endScore>=0&&o.endScore<=100);assert.ok(o.shiftEndScore>=0&&o.shiftEndScore<=100);
  });
  assert.equal(total,+end-start);
 }
});

test('DST night follows panel wall-clock boundaries but integrates actual elapsed time',()=>{
 for(const date of ['28.03.2026','24.10.2026']){
  const entryDay=shift(date),e=env([entryDay],date.startsWith('28')?'2026-03-28T21:00:00+02:00':'2026-10-24T21:00:00+03:00');
  const api=e.c.__fatigue,entry=api.gatherWorkerHistory(names[0])[0];
  const spans=names.map(name=>api.savedNightWindow(entry,name,{order:names,sh:23,ei:0}));
  assert.equal(new Date(spans[0].ownStart).getHours(),23);
  assert.equal(new Date(spans.at(-1).ownEnd).getHours(),7);
  for(let i=1;i<spans.length;i++)assert.equal(spans[i-1].ownEnd,spans[i].ownStart);
  assert.equal(spans.reduce((n,p)=>n+p.ownEnd-p.ownStart,0),spans[0].end-spans[0].start);
 }
});

test('sleep and no-sleep forecasts share prior history and differ only within selected duty',()=>{
 const e=env([shift('03.09.2026'),shift('07.09.2026')],'2026-09-07T21:00:00+03:00',{'03.09.2026':{order:names,sh:0,ei:0,savedAt:1},...plan()});
 const api=e.c.__fatigue,entry=api.gatherWorkerHistory(names[0]).find(x=>x.dateStr==='07.09.2026');
 const result=api.forecast(names[0],entry);
 assert.equal(result.samples[0].score,result.noSleepSamples[0].score);
 assert.ok(result.noSleepEndScore>result.endScore);
 assert.equal(result.noSleepEndScore,api.scoreAt(names[0],new Date('2026-09-08T08:00:00+03:00'),{noSleepDutyDate:'07.09.2026'}));
 const choices=api.nightScenarios(names[0],entry);
 assert.equal(choices.projection.endScore,choices.options.find(x=>x.selected).shiftEndScore);
 assert.equal(choices.projection.noSleepEndScore,result.noSleepEndScore);
 assert.equal(api.scoreAt(names[0],new Date('2026-09-07T08:00:00+03:00')),api.scoreAt(names[0],new Date('2026-09-07T08:00:00+03:00'),{noSleepDutyDate:'07.09.2026'}));
});

test('without a saved night plan there is no invented sleep comparison',()=>{
 const e=env([shift('07.09.2026')]);const api=e.c.__fatigue;
 const f=api.forecast(names[0],api.gatherWorkerHistory(names[0])[0]);
 assert.equal(f.noSleepSamples,null);assert.equal(f.noSleepEndScore,null);
});


test('hybrid retains duty exposure after planned sleep and recovers continuously off duty',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T08:00:00+03:00',plan());
 const rested=e.score();
 assert.ok(rested.sleepModel.dutyLoad>0);
 assert.ok(rested.score>rested.sleepModel.umpScore);
 const noPlan=env([shift('07.09.2026')],'2026-09-08T08:00:00+03:00').score();
 assert.ok(rested.score<noPlan.score,'sleep must improve the result');
 e.at('2026-09-08T08:01:00+03:00');assert.ok(Math.abs(e.score().score-rested.score)<=1);
 e.at('2026-09-08T20:00:00+03:00');assert.ok(e.score().sleepModel.dutyLoad<rested.sleepModel.dutyLoad);
});

test('hybrid selected scenario and headline use the same endpoints',()=>{
 const e=env([shift('07.09.2026')],'2026-09-07T22:00:00+03:00',plan());
 const api=e.c.__fatigue,entry=api.gatherWorkerHistory(names[0])[0];
 const result=api.nightScenarios(names[0],entry);
 assert.equal(result.options.find(o=>o.selected).shiftEndScore,result.projection.endScore);
 assert.ok(result.options.every(o=>Number.isFinite(o.endScore)&&o.shiftEndScore>=0&&o.shiftEndScore<=100));
 assert.ok(new Set(result.options.map(o=>o.endScore)).size>1);
});

test('post-duty recovery retains residual load after one day and fades over further nights',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T08:00:00+03:00',plan());
 const load=at=>{e.at(at);e.c.__activeDateStr='';e.c.__fatigue.clearCache();return e.score().sleepModel.dutyLoad;};
 const initial=load('2026-09-08T08:00:00+03:00');
 const day1=load('2026-09-09T08:00:00+03:00');
 const day2=load('2026-09-10T08:00:00+03:00');
 const week=load('2026-09-15T08:00:00+03:00');
 // Product regression guard, not a clinically established recovery fraction.
 assert.ok(day1>initial*0.25,'one day must not erase nearly all duty exposure');
 assert.ok(initial>day1&&day1>day2&&day2>week);
 assert.ok(week<initial*0.05,'a remote isolated duty must not leave a permanent penalty');
});

test('off-duty sleep restores load faster than equal elapsed time awake, without boundary jumps',()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T08:00:00+03:00',plan());
 const load=at=>{e.at(at);e.c.__activeDateStr='';e.c.__fatigue.clearCache();return e.score().sleepModel.dutyLoad;};
 const sleeping=load('2026-09-08T12:15:00+03:00')/load('2026-09-08T09:15:00+03:00');
 const awake=load('2026-09-08T17:00:00+03:00')/load('2026-09-08T14:00:00+03:00');
 assert.ok(sleeping<awake);
 for(const boundary of ['2026-09-08T09:15:00+03:00','2026-09-08T13:00:00+03:00','2026-09-08T23:15:00+03:00']){
  assert.ok(Math.abs(load(boundary)-load(new Date(+new Date(boundary)-1000).toISOString()))<0.01);
 }
});

test('repeat 24h duty carries more fatigue with 24h off than with 48h off for three and four parts',()=>{
 for(const size of [3,4]){
  const team=names.slice(0,size);
  const forecast=second=>{
   const dates=['07.09.2026',`${second}.09.2026`];
   const plans=Object.fromEntries(dates.map(date=>[date,{order:team,sh:0,ei:0,savedAt:1}]));
   const e=env(dates.map(date=>shift(date,24,'08:00','08:00',team)),'2026-09-07T07:00:00+03:00',plans);
   return team.map(name=>e.c.__fatigue.forecast(name,e.c.__fatigue.gatherWorkerHistory(name)[1]));
  };
  const short=forecast('09'),long=forecast('10');
  short.forEach((f,i)=>{
   assert.ok(f.startScore>long[i].startScore);
   const evening=f.samples.find(s=>new Date(s.time).getHours()===20);
   const other=long[i].samples.find(s=>new Date(s.time).getHours()===20);
   assert.ok(evening.score>other.score);
  });
 }
});

test('24h then 12h uses post-call sleep scenarios without imposing chronic short sleep before duty',()=>{
 const e=env([shift('07.09.2026'),shift('09.09.2026',12,'08:00','20:00')],'2026-09-09T08:00:00+03:00',plan());
 e.c.__activeDateStr='09.09.2026';
 const api=e.c.__fatigue,t=new Date('2026-09-09T08:00:00+03:00');
 const raw=JSON.stringify(e.c.__grafiksStore);
 for(const name of names){
  const options=[{recoveryHomeHours:6,recoveryHours:2},{recoveryHomeHours:7,recoveryHours:3},{recoveryHomeHours:8,recoveryHours:4}];
  const scores=options.map(o=>api.scoreAt(name,t,o));
  const actual=e.score(name);
  assert.equal(actual.score,Math.round(scores.reduce((a,b)=>a+b)/3));
  assert.deepEqual(Array.from(actual.sleepModel.recoveryRange),[Math.min(...scores),Math.max(...scores)]);
  assert.ok(actual.score>scores[2],'do not automatically choose the most optimistic sleep');
  const before=new Date('2026-09-07T08:00:00+03:00');
  const baseline=api.scoreAt(name,before,{homeHours:8,recoveryHours:4});
  assert.equal(api.scoreAt(name,before),baseline,'future recovery must not change earlier fatigue');
  for(const o of options)assert.equal(api.scoreAt(name,before,o),baseline);
  const entry=api.gatherWorkerHistory(name)[1];
  assert.equal(api.forecast(name,entry).startScore,actual.score);
 }
 assert.equal(JSON.stringify(e.c.__grafiksStore),raw);
});

test('ordinary day shifts do not acquire a short-sleep penalty from recovery scenarios',()=>{
 const e=env([shift('07.09.2026',12,'08:00','20:00'),shift('09.09.2026',12,'08:00','20:00')],'2026-09-09T08:00:00+03:00');
 const api=e.c.__fatigue,t=new Date('2026-09-09T08:00:00+03:00');
 assert.equal(api.scoreAt(names[0],t),api.scoreAt(names[0],t,{homeHours:8,recoveryHours:4}));
});


test('undated habits estimate missing past nights but never replace a saved plan',()=>{
 const days=[shift('05.09.2026'),shift('07.09.2026')];
 const stats={parts:{[names[0]]:[26,3,0,2]}};
 const e=env(days,'2026-09-07T22:00:00+03:00',plan(),stats);
 const result=e.score();
 assert.equal(result.sleepModel.estimatedHistoryNights,1);
 assert.ok(result.sleepModel.historyRange[0]<=result.score&&result.score<=result.sleepModel.historyRange[1]);
 const allPlans={...plan(),'05.09.2026':{order:names,sh:23,ei:2,savedAt:1}};
 const withStats=env(days,'2026-09-07T22:00:00+03:00',allPlans,stats).score();
 const withoutStats=env(days,'2026-09-07T22:00:00+03:00',allPlans).score();
 assert.equal(withStats.score,withoutStats.score);
 assert.equal(withStats.sleepModel.estimatedHistoryNights,undefined);
 const api=e.c.__fatigue,entry=api.gatherWorkerHistory(names[0]).at(-1);
 const comparison=api.nightScenarios(names[0],entry);
 assert.equal(comparison.projection.endScore,comparison.options.find(o=>o.selected).shiftEndScore);
});

test('habit estimates do not invent a current plan and adapt only eligible three-person rosters',()=>{
 const stats={parts:{[names[0]]:[26,3,0,2]}};
 const onlyCurrent=env([shift('07.09.2026')],'2026-09-07T22:00:00+03:00',null,stats);
 assert.equal(onlyCurrent.score().sleepModel.estimatedHistoryNights,undefined);
 const team=names.slice(0,3),days=[shift('05.09.2026',24,'08:00','08:00',team),shift('07.09.2026')];
 const e=env(days,'2026-09-07T22:00:00+03:00',plan(),stats);
 assert.equal(e.score().sleepModel.estimatedHistoryNights,1);
 assert.ok(Number.isFinite(e.score().score));
});

test('different habits change the carried sleep state without changing dated assignments',()=>{
 const days=[shift('05.09.2026'),shift('07.09.2026')];
 const first=env(days,'2026-09-07T22:00:00+03:00',plan(),{parts:{[names[0]]:[100,0,0,0]}}).score();
 const middle=env(days,'2026-09-07T22:00:00+03:00',plan(),{parts:{[names[0]]:[0,100,0,0]}}).score();
 assert.notEqual(first.sleepModel.lapses,middle.sleepModel.lapses);
 assert.equal(first.sleepModel.estimatedHistoryNights,1);
 assert.equal(middle.sleepModel.estimatedHistoryNights,1);
});


test('three-part first shift means longer work and less sleep than four with the same night bounds',()=>{
 const at='2026-09-07T22:00:00+03:00';
 const get=count=>{
  const team=names.slice(0,count);
  const e=env([shift('07.09.2026',24,'08:00','08:00',team)],at,plan(team));
  const api=e.c.__fatigue;
  return api.nightScenarios(names[0],api.gatherWorkerHistory(names[0])[0]);
 };
 const three=get(3),four=get(4);
 assert.equal(three.projection.nightParts,3);
 assert.equal(four.projection.nightParts,4);
 const a=three.options[0],b=four.options[0];
 const minutes=o=>o.sleep.reduce((sum,p)=>sum+(p.end-p.start)/60000,0);
 assert.ok(a.end-a.start>b.end-b.start);
 assert.ok(minutes(a)<minutes(b));
 assert.ok(a.shiftEndScore>=b.shiftEndScore);
});

test('scientific comparison uses the same three post-call scenarios and never replaces the hybrid score',()=>{
 const e=env([shift('07.09.2026'),shift('09.09.2026',12,'08:00','20:00')],'2026-09-09T08:00:00+03:00',plan());
 e.c.__activeDateStr='09.09.2026';const api=e.c.__fatigue,t=new Date('2026-09-09T08:00:00+03:00'),before=e.score().score;
 const r=api.compareRecovery(names[0],t);
 assert.equal(r.variants.length,3);
 for(const v of r.variants){assert.equal(v.hybrid,api.scoreAt(names[0],t,v.settings));assert.ok(Number.isFinite(v.kss.value)&&Number.isFinite(v.pvt.value));assert.equal(v.kss.metric,'KSS');}
 assert.equal(e.score().score,before);
});

test('light comparison uses three/four real slots and never changes scores or plans',async()=>{
 for(const count of [3,4]){
  const team=names.slice(0,count),saved=plan(team,23,1);
  const e=env([shift('07.09.2026',24,'08:00','08:00',team)],'2026-09-07T22:00:00+03:00',saved);
  e.c.setTimeout=fn=>{fn();return 0;};
  const before=e.c.__fatigue.scoreAt(names[0],new Date('2026-09-08T08:00:00+03:00'));
  const entry=e.c.__fatigue.gatherWorkerHistory(names[0])[0];
  const result=await e.c.__fatigue.compareLight(names[0],entry,new Date('2026-09-07T22:00:00+03:00'));
  assert.equal(result.options.length,count);
  assert.equal(result.options[0].start,+new Date('2026-09-07T23:00:00+03:00'));
  assert.equal(result.options.at(-1).end,+new Date('2026-09-08T07:30:00+03:00'));
  assert.ok(result.options.every(o=>o.delayHours.every(Number.isFinite)));
  assert.equal(e.c.__fatigue.scoreAt(names[0],new Date('2026-09-08T08:00:00+03:00')),before);
  assert.equal(JSON.stringify(saved),JSON.stringify(plan(team,23,1)));
 }
});
test('light comparison requires a real plan and does not suggest elapsed alternatives',async()=>{
 const e=env([shift('07.09.2026')],'2026-09-08T03:00:00+03:00',plan());
 e.c.setTimeout=fn=>{fn();return 0;};
 const entry=e.c.__fatigue.gatherWorkerHistory(names[0])[0];
 const result=await e.c.__fatigue.compareLight(names[0],entry,new Date('2026-09-08T03:00:00+03:00'));
 assert.deepEqual(Array.from(result.options,o=>o.part),[1,3,4]);
 const missing=env([shift('07.09.2026')]);
 assert.equal((await missing.c.__fatigue.compareLight(names[0],entry,new Date())).missingPlan,true);
});
