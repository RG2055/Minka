import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
process.env.TZ='Europe/Riga';

// Riga DST: 25.10.2026 04:00 EEST -> 03:00 EET (25 h night), 28.03.2027
// 03:00 -> 04:00 (23 h night). Ordinary days must give the very same numbers
// as before; DST nights follow the wall clock (labels) with real durations.
const read=f=>fs.readFileSync(new URL('../js/'+f,import.meta.url),'utf8');
function fns(src,names){
  let out='';
  for(const n of names){
    const m=new RegExp('function '+n+'\\s*\\(').exec(src); if(!m) throw new Error('missing '+n);
    let i=src.indexOf('{',m.index),depth=0,j=i;
    for(;j<src.length;j++){const ch=src[j];if(ch==='{')depth++;else if(ch==='}'&&--depth===0)break;}
    out+=src.slice(m.index,j+1)+'\n';
  }
  return out;
}
const at=iso=>+new Date(iso);
function clockCtx(extra={}){
  const box={t:0};
  const Fixed=class extends Date{constructor(...a){super(...(a.length?a:[box.t]));}static now(){return box.t;}};
  const c=vm.createContext({Date:Fixed,Math,String,Number,Array,window:{},...extra});
  return {c,box};
}

test('the TZ is Europe/Riga in this process',()=>{
  assert.equal(new Date('2026-10-25T01:30:00Z').getHours(),3);
  assert.equal(new Date('2026-10-25T00:30:00Z').getHours(),3);
});

test('calendar: displayNow is the real now in the repeated hour, unchanged otherwise',()=>{
  const c=vm.createContext({Date,Math,String,Number});
  vm.runInContext(fns(read('calendar.js'),['getDisplayNowForDate','nextDaySameTime']),c);
  for(const iso of ['2026-10-25T00:30:00Z','2026-10-25T01:30:00Z','2027-03-28T01:30:00Z','2026-10-14T00:30:00Z','2026-09-24T10:00:00Z']){
    const now=new Date(iso),ds=new Date(+now-(now.getHours()<8?86400000:0));
    const key=String(ds.getDate()).padStart(2,'0')+'.'+String(ds.getMonth()+1).padStart(2,'0')+'.'+ds.getFullYear();
    assert.equal(+c.getDisplayNowForDate(key,now),+now,iso);
  }
  // Another duty date still maps the time of day onto it.
  assert.equal(+c.getDisplayNowForDate('10.10.2026',new Date('2026-10-14T10:00:00Z')),at('2026-10-10T10:00:00Z'));
  const end=c.nextDaySameTime(new Date(2026,9,24,8));
  assert.equal((end-new Date(2026,9,24,8))/36e5,25);
  assert.equal((c.nextDaySameTime(new Date(2027,2,27,8))-new Date(2027,2,27,8))/36e5,23);
  assert.equal((c.nextDaySameTime(new Date(2026,9,14,8))-new Date(2026,9,14,8))/36e5,24);
});

test('calendar: header night split uses wall-clock boundaries like the Nakts panel',()=>{
  const {c}=clockCtx();
  vm.runInContext('const IS_RAD=false;const NIGHT_SPLIT_ENDS=[{h:7,m:20},{h:7,m:30},{h:8,m:0}];const NIGHT_SPLIT_COLORS=[{}];'
    +'function getNightSplitWorkersForDate(){return [{name:"A"},{name:"B"},{name:"C"},{name:"D"}]}'
    +'function getNightSplitSavedMap(){const p={order:["A","B","C","D"],sh:0,ei:2};return {"24.10.2026":p,"27.03.2027":p,"14.10.2026":p,"14.10.2026b":p}}'
    +'function getNightSplitColorOrder(){return []}\n'+fns(read('calendar.js'),['getNightSplitPlan']),c);
  const hm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  const show=ds=>[...c.getNightSplitPlan(ds).segments].map(s=>hm(s.start)+'-'+hm(s.end)+'/'+(s.end-s.start)/60000);
  assert.deepEqual(show('14.10.2026'),['00:00-02:00/120','02:00-04:00/120','04:00-06:00/120','06:00-08:00/120']);
  assert.deepEqual(show('24.10.2026'),['00:00-02:00/120','02:00-04:00/180','04:00-06:00/120','06:00-08:00/120']);
  assert.deepEqual(show('27.03.2027'),['00:00-02:00/120','02:00-04:00/60','04:00-06:00/120','06:00-08:00/120']);
});

function nightCtx(date,sh=0,ei=2){
  const {c,box}=clockCtx();
  const src=read('nightsplit.js');
  vm.runInContext('var END=[{h:7,m:20,l:"07:20"},{h:7,m:30,l:"07:30"},{h:8,m:0,l:"08:00"}];var st=null;\n'
    +fns(src,['mt','fm','calc','activeDateKey','nsNightCursor','nsMinMs','nsClockBase','nsLeftText','nsSlotState','ledProgress','ledProgressAt','ledSlotMinutes','slotRealtime']),c);
  vm.runInContext('st={sh:'+sh+',ei:'+ei+',sl:calc([{name:"A"},{name:"B"},{name:"C"},{name:"D"}],'+sh+','+ei+')}',c);
  Object.assign(c.window,{__activeDateStr:date,__todayDateStr:date,__g_todayStr:date});
  return {c,box,state:iso=>{box.t=at(iso);const cur=c.nsNightCursor();return [...vm.runInContext('st.sl',c)].map((s,i)=>{const x=c.nsSlotState(vm.runInContext('st.sl',c),i,cur);return x?x.text:'-';});}};
}

test('Nakts: October DST night, card status, LED and cursor agree and never run back',()=>{
  const n=nightCtx('24.10.2026');
  const sl=[...vm.runInContext('st.sl',n.c)];
  assert.deepEqual(sl.map(s=>s.ss+'-'+s.es),['00:00-02:00','02:00-04:00','04:00-06:00','06:00-08:00']);
  assert.deepEqual(sl.map(s=>n.c.ledSlotMinutes(s)),[120,180,120,120]);
  assert.equal(n.state('2026-10-25T00:30:00Z')[1],'Vēl 1 h 30 min');   // 03:30 EEST
  assert.equal(n.state('2026-10-25T01:30:00Z')[1],'Vēl 30 min');       // 03:30 EET
  assert.deepEqual(n.state('2026-10-25T02:30:00Z').slice(1,3),['Beigusies','Vēl 1 h 30 min']); // 04:30 EET
  let prevCur=-1e9,prevLed=-1;
  for(let t=at('2026-10-24T22:00:30Z');t<=at('2026-10-25T06:00:00Z');t+=60000){  // mid-minute: LED is 0 at the exact start
    n.box.t=t;
    const cur=n.c.nsNightCursor(),led=n.c.ledProgress(sl[1]);
    assert.ok(cur>=prevCur,'cursor back at '+new Date(t).toISOString());
    assert.ok(led>=prevLed,'LED back at '+new Date(t).toISOString());
    const rt=n.c.slotRealtime(sl[1]);
    assert.equal(rt.active,led>0&&led<1,'status vs LED at '+new Date(t).toISOString());
    prevCur=cur;prevLed=led;
  }
  n.box.t=at('2026-10-25T02:00:00Z');assert.equal(n.c.ledProgress(sl[1]),1);assert.equal(n.c.nsNightCursor(),240);
});

test('Nakts: March DST night is 1 h for 02:00-04:00; ordinary nights unchanged',()=>{
  const m=nightCtx('27.03.2027');
  const sl=[...vm.runInContext('st.sl',m.c)];
  assert.deepEqual(sl.map(s=>m.c.ledSlotMinutes(s)),[120,60,120,120]);
  assert.equal(m.state('2027-03-28T00:30:00Z')[1],'Vēl 30 min');        // 02:30 EET
  assert.deepEqual(m.state('2027-03-28T01:30:00Z').slice(1,3),['Beigusies','Vēl 1 h 30 min']); // 04:30 EEST
  const o=nightCtx('14.10.2026');
  const osl=[...vm.runInContext('st.sl',o.c)];
  assert.deepEqual(osl.map(s=>o.c.ledSlotMinutes(s)),[120,120,120,120]);
  assert.deepEqual(o.state('2026-10-15T00:30:20Z'),['Beigusies','Vēl 30 min','Pēc 30 min','-']);
  o.box.t=at('2026-10-15T00:30:20Z');
  assert.equal(o.c.nsNightCursor(),3*60+30+20/60);
  assert.equal(o.c.ledProgress(osl[1]),(90*60+20)/(120*60));
  assert.deepEqual({...o.c.slotRealtime(osl[1])},{status:'TAGAD',active:true,pct:75,left:'00:30',label:'Atlikušais'});
});

test('Nakts: a boundary the March jump skips (03:40) is over at the jump, header agrees',()=>{
  const m=nightCtx('27.03.2027',0,0);   // four parts 00:00-07:20: 01:50, 03:40, 05:30
  const sl=[...vm.runInContext('st.sl',m.c)];
  assert.deepEqual(sl.map(s=>s.ss+'-'+s.es+'/'+m.c.ledSlotMinutes(s)),['00:00-01:50/110','01:50-03:40/70','03:40-05:30/90','05:30-07:20/110']);
  assert.deepEqual(m.state('2027-03-28T01:10:00Z'),['Beigusies','Beigusies','Vēl 1 h 20 min','Pēc 1 h 20 min']); // 04:10 EEST
  const {c}=clockCtx();
  vm.runInContext('const IS_RAD=false;const NIGHT_SPLIT_ENDS=[{h:7,m:20},{h:7,m:30},{h:8,m:0}];const NIGHT_SPLIT_COLORS=[{}];'
    +'function getNightSplitWorkersForDate(){return [{name:"A"},{name:"B"},{name:"C"},{name:"D"}]}'
    +'function getNightSplitSavedMap(){return {"27.03.2027":{order:["A","B","C","D"],sh:0,ei:0}}}'
    +'function getNightSplitColorOrder(){return []}\n'+fns(read('calendar.js'),['getNightSplitPlan']),c);
  const seg=[...c.getNightSplitPlan('27.03.2027').segments];
  assert.deepEqual(seg.map(s=>+s.end),sl.map(s=>{const b=new Date(2027,2,28);return m.c.nsMinMs(b,s.e);}));
  assert.equal(seg[1].end.toISOString(),'2027-03-28T01:00:00.000Z');
});

test('card dial: on duty, hours left follow the real end on DST days',()=>{
  const {c,box}=clockCtx();
  const src=read('card-faces.js');
  vm.runInContext(fns(src,['hm','dialMarkup'])+'function m3Dial(skin,s,e,now,phase,left,hhmm,dur){return phase+" "+dur(left)}',c);
  const el=(endIso)=>({dataset:{start:'08:00',end:'08:00',endMs:String(at(endIso))},textContent:''});
  box.t=at('2026-10-25T01:30:00Z');   // 03:30 EET, ends 08:00 EET
  assert.equal(c.dialMarkup(el('2026-10-25T06:00:00Z'),'f11'),'on 4:30');
  box.t=at('2027-03-28T00:30:00Z');   // 02:30 EET, ends 08:00 EEST
  assert.equal(c.dialMarkup(el('2027-03-28T05:00:00Z'),'f11'),'on 4:30');
  box.t=at('2026-10-14T00:30:40Z');   // ordinary night: as before
  assert.equal(c.dialMarkup(el('2026-10-14T05:00:00Z'),'f11'),'on 4:30');
  assert.equal(c.dialMarkup({dataset:{start:'08:00',end:'08:00'},textContent:''},'f11'),'on 4:30');
});

test('daily cat: the pet day turns at 08:00 by the wall clock',()=>{
  const {c}=clockCtx();
  vm.runInContext('var DAY_START_HOUR=8;\n'+fns(read('daily-cat.js'),['petDayDate']),c);
  const day=iso=>{const d=c.petDayDate(new Date(iso));return d.getDate()+'.'+(d.getMonth()+1);};
  assert.equal(day('2026-10-25T05:59:00Z'),'24.10');  // 07:59 EET
  assert.equal(day('2026-10-25T06:00:00Z'),'25.10');  // 08:00 EET
  assert.equal(day('2027-03-28T04:59:00Z'),'27.3');   // 07:59 EEST
  assert.equal(day('2027-03-28T05:00:00Z'),'28.3');   // 08:00 EEST
  assert.equal(day('2026-10-14T04:59:00Z'),'13.10');
  assert.equal(day('2026-10-14T05:00:00Z'),'14.10');
});

function fatigueEnv(days,now){
  const timestamp=+new Date(now);
  const Fixed=class extends Date{constructor(...a){super(...(a.length?a:[timestamp]));}static now(){return timestamp;}};
  const doc={readyState:'loading',hidden:false,querySelector(){return null},getElementById(){return null},addEventListener(){},dispatchEvent(){}};
  const c=vm.createContext({Date:Fixed,document:doc,CustomEvent:class{},localStorage:{getItem(){return '{}'}},setTimeout(){return 0},clearTimeout(){},console});
  c.window=c;c.addEventListener=()=>{};c.__grafiksStore={test:days};c.__activeDateStr='24.10.2026';c.__refreshFatigueBars=()=>{};
  for(const f of ['night-plan-history.js','sleep-model.js','recovery-model.js','light-model.js','fatigue.js']) vm.runInContext(read(f),c);
  return c.__fatigue;
}

test('fatigue: October has 31 days and the DST shift day curve runs 08:00 to 08:00',()=>{
  const names=['Worker One'];
  const shift=date=>({date,workers:names.map(name=>({name,shift:'24',startTime:'08:00',endTime:'08:00',type:'DIENNAKTS'}))});
  const F=fatigueEnv([shift('17.10.2026'),shift('24.10.2026')],'2026-10-26T12:00:00+02:00');
  const oct=F.monthSeries(names[0],2026,10,1);
  assert.equal(oct.days.length,31);
  assert.equal(oct.samples.length,31*24+1+1);  // 745 real hours, both ends
  const sep=F.monthSeries(names[0],2026,9,1);
  assert.equal(sep.days.length,30);
  const html=F.monthCurveHtml(names[0],2026,10,{range:'day',anchor:at('2026-10-24T12:00:00+03:00')});
  const ticks=[...html.matchAll(/<span style="left:([\d.]+)%"[^>]*>(\d\d:00)<\/span>/g)].map(m=>m[2]);
  assert.deepEqual(ticks,['08:00','12:00','16:00','20:00','00:00','04:00','08:00']);
  assert.match(html,/class="is-end">08:00</);
  assert.equal(html.match(/data-fmc="([^"]*)"/)[1].split(',').length,26);  // 25 h, both ends
});
