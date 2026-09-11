/* Shared, dependency-free rules for shift-day summaries. No browser or network work. */
(function(root){
'use strict';
const norm=s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('lv-LV');
function day(value){
 let s=String(value||''),m=s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);if(m)s=m[3]+'-'+m[2]+'-'+m[1];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
 const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?s:'';
}
function dutyDay(ts=Date.now()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Riga',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ts)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 const d=new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);if(+p.hour<8)d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);
}
function cleanEntry(input){
 if(!input||!day(input.day)||typeof input.name!=='string'||!norm(input.name)||input.name.length>100)throw Error('Izvēlies cilvēku un derīgu dienu.');
 const mood=Number(input.mood);if(!Number.isInteger(mood)||mood<1||mood>5)throw Error('Izvēlies pašsajūtu.');
 const radios=[...new Map((Array.isArray(input.radios)?input.radios:[]).filter(s=>typeof s==='string'&&s.trim()).slice(0,8).map(s=>[norm(s.slice(0,120)),s.trim().slice(0,120)])).values()];
 return {day:day(input.day),name:input.name.trim().replace(/\s+/g,' '),mood,pace:['calm','usual','busy'].includes(input.pace)?input.pace:'',radios,updatedAt:Date.now()};
}
function merge(entries,entry){return [...entries.filter(e=>e.day!==entry.day||norm(e.name)!==norm(entry.name)),entry].sort((a,b)=>a.day.localeCompare(b.day)).slice(-5000);}
function schedule(stores){
 const out=[],seen=new Set();
 stores.forEach((store,group)=>Object.values(store||{}).forEach(days=>(Array.isArray(days)?days:[]).forEach(d=>(d.workers||[]).forEach(w=>{
 const date=day(w.date||d.date),hours=Number(String(w.shift||'').match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(',','.'));
 if(!date||!norm(w.name)||!Number.isFinite(hours)||hours<=0||hours>48)return;
 const key=[group,date,norm(w.name),hours,w.type||'',w.startTime||'',w.endTime||''].join('|');if(seen.has(key))return;seen.add(key);
 out.push({day:date,name:w.name,group:group?'rd':'rg',hours,type:hours>=24?'24h':String(w.type).toUpperCase()==='NAKTS'?'night':'day'});
 }))));return out;
}
function bolus(history){
 const out=[],seen=new Set();for(const room of ['ge','philips'])for(const e of Array.isArray(history?.[room])?history[room]:[]){
 const ts=Number(e.ts||e.changedAt||e.timestamp);if(!Number.isFinite(ts)||ts<=0)continue;
 const key=[room,ts,norm(e.name)].join('|');if(seen.has(key))continue;seen.add(key);
 out.push({day:dutyDay(ts),name:e.name||'Nav norādīts',room,ts});
 }return out.sort((a,b)=>b.ts-a.ts);
}
function summary({shifts=[],changes=[],entries=[],ratings={},radio=[],coffee={},from,to,person='',group='all'}){
 const inRange=e=>e.day>=from&&e.day<=to&&(!person||norm(e.name)===norm(person));
 const ss=shifts.filter(e=>inRange(e)&&(group==='all'||e.group===group));
 const allowed=new Set(ss.map(e=>norm(e.name)));const include=e=>inRange(e)&&(group==='all'||allowed.has(norm(e.name)));
 const bb=changes.filter(include),ee=entries.filter(include),people=new Map();
 const row=name=>{const key=norm(name);if(!people.has(key))people.set(key,{name,hours:0,shifts:0,ge:0,philips:0,moods:[],radios:new Set()});return people.get(key);};
 ss.forEach(e=>{row(e.name).hours+=e.hours;row(e.name).shifts++;});
 bb.forEach(e=>row(e.name)[e.room]++);ee.forEach(e=>{row(e.name).moods.push(e.mood);e.radios.forEach(s=>row(e.name).radios.add(s));});
 const reactions=Object.entries(ratings).filter(([d])=>d>=from&&d<=to).map(([day,counts])=>({day,counts:Object.fromEntries(['terrible','bad','ok','good','excellent'].map(key=>[key,Math.max(0,Number(counts[key])||0)]))}));
 const reactionTotal=reactions.reduce((sum,e)=>sum+Object.values(e.counts).reduce((a,b)=>a+b,0),0);
 const stationMap=new Map(),rr=radio.filter(e=>e.day>=from&&e.day<=to);
 rr.forEach(e=>{const k=norm(e.name);if(!stationMap.has(k))stationMap.set(k,{name:e.name,days:new Set()});stationMap.get(k).days.add(e.day);});
 const stations=[...stationMap.values()].map(e=>({...e,count:e.days.size}));
 const cups=[];for(const [key,counts] of Object.entries(coffee)){const date=day(key);if(!date||date<from||date>to)continue;for(const [name,n] of Object.entries(counts||{}))if(include({day:date,name})&&Number.isFinite(Number(n)))cups.push({day:date,name,count:Math.max(0,Number(n))});}
 return {reactions,reactionTotal,shifts:ss,bolus:bb,entries:ee,people:[...people.values()].sort((a,b)=>a.name.localeCompare(b.name,'lv')),stations:stations.sort((a,b)=>b.count-a.count),radio:rr,cups,hours:ss.reduce((n,e)=>n+e.hours,0),mood:ee.length?ee.reduce((n,e)=>n+e.mood,0)/ee.length:null};
}
/* The five existing reaction buttons, low to high. Colours match the mood card. */
const MOODS=[
 {key:'terrible',score:1,emoji:'😠',label:'Ļoti slikti',color:'#fb7185'},
 {key:'bad',score:2,emoji:'😞',label:'Slikti',color:'#fb923c'},
 {key:'ok',score:3,emoji:'😐',label:'Normāli',color:'#cbd5e1'},
 {key:'good',score:4,emoji:'🙂',label:'Labi',color:'#5eead4'},
 {key:'excellent',score:5,emoji:'😍',label:'Lieliski',color:'#86efac'}
];
/* Weighted 1..5 average of one day's reaction counts; null when nobody reacted
   (an unmarked day is unknown, never a zero). */
function moodScore(counts){
 let total=0,sum=0,dominant=null,best=0;
 for(const m of MOODS){const n=Math.max(0,Number(counts?.[m.key])||0);total+=n;sum+=n*m.score;if(n>best){best=n;dominant=m.key;}}
 return total?{score:sum/total,total,dominant}:null;
}
function moodFor(score){
 if(score==null)return null;
 return MOODS.reduce((a,b)=>Math.abs(b.score-score)<Math.abs(a.score-score)?b:a);
}
function dates(from,to){
 const out=[];
 for(let d=new Date(from+'T12:00:00Z');Number.isFinite(+d)&&d.toISOString().slice(0,10)<=to&&out.length<93;d.setUTCDate(d.getUTCDate()+1))out.push(d.toISOString().slice(0,10));
 return out;
}
function monthRange(month){
 const y=+month.slice(0,4),m=+month.slice(5,7);
 return {from:month+'-01',to:month+'-'+String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,'0')};
}
/* One row per calendar day of a summary, with everything that day holds. */
function dayRows(s,from,to){
 const byDay=key=>{const map=new Map();for(const e of s[key]||[]){if(!map.has(e.day))map.set(e.day,[]);map.get(e.day).push(e);}return map;};
 const shifts=byDay('shifts'),bolus=byDay('bolus'),radio=byDay('radio'),cups=byDay('cups');
 const reactions=new Map((s.reactions||[]).map(e=>[e.day,e.counts]));
 return dates(from,to).map(day=>{
 const ss=shifts.get(day)||[],counts=reactions.get(day)||null;
 return {day,shifts:ss,hours:ss.reduce((n,e)=>n+e.hours,0),bolus:bolus.get(day)||[],radio:[...new Set((radio.get(day)||[]).map(e=>e.name))],cups:(cups.get(day)||[]).reduce((n,e)=>n+e.count,0),counts,mood:counts?moodScore(counts):null};
 });
}
root.MinkaDaybookModel={norm,day,dutyDay,cleanEntry,merge,schedule,bolus,summary,MOODS,moodScore,moodFor,dates,monthRange,dayRows};
})(globalThis);
