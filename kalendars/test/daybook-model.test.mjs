import test from 'node:test';import assert from 'node:assert/strict';import '../js/daybook-model.js';const M=globalThis.MinkaDaybookModel;
test('valid dates and Riga shift days respect 08:00 and DST',()=>{
 assert.equal(M.day('31.02.2026'),'');assert.equal(M.day('11.09.2026'),'2026-09-11');
 assert.equal(M.dutyDay(Date.parse('2026-09-11T04:59:00Z')),'2026-09-10');assert.equal(M.dutyDay(Date.parse('2026-09-11T05:00:00Z')),'2026-09-11');
 assert.equal(M.dutyDay(Date.parse('2026-01-11T05:59:00Z')),'2026-01-10');assert.equal(M.dutyDay(Date.parse('2026-01-11T06:00:00Z')),'2026-01-11');
});
test('one editable check-in per person and day, no repeated-tap inflation',()=>{
 let e=M.cleanEntry({day:'2026-09-10',name:' Anna  Test ',mood:4});let rows=M.merge([],e);rows=M.merge(rows,M.cleanEntry({...e,name:'ANNA TEST',mood:2}));assert.equal(rows.length,1);assert.equal(rows[0].mood,2);assert.throws(()=>M.cleanEntry({...e,mood:9}));
});
test('duplicate schedules and bolus are removed; periods and machines remain separate',()=>{
 const d={date:'10.09.2026',workers:[{name:'Anna Test',shift:'12',type:'NAKTS'}]},shifts=M.schedule([{a:[d],b:[d]},{}]);assert.equal(shifts.length,1);
 const ts=Date.parse('2026-09-11T04:30:00Z'),changes=M.bolus({ge:[{ts,name:'Anna Test'},{ts,name:'Anna Test'}],philips:[{ts,name:'Anna Test'}]});assert.equal(changes.length,2);assert.equal(changes[0].day,'2026-09-10');
 const s=M.summary({shifts,changes,from:'2026-09-10',to:'2026-09-10'});assert.equal(s.hours,12);assert.equal(s.people[0].ge,1);assert.equal(s.people[0].philips,1);assert.equal(s.mood,null);
 assert.equal(M.summary({shifts,changes,from:'2026-09-11',to:'2026-09-11'}).bolus.length,0);
});
test('radio is collective, distinct by station/day, independent of person filter',()=>{
 const radio=[{day:'2026-09-10',name:'Remix'},{day:'2026-09-10',name:'REMIX'},{day:'2026-09-11',name:'Remix'}];
 const s=M.summary({radio,from:'2026-09-10',to:'2026-09-11',person:'Someone'});assert.equal(s.stations.length,1);assert.equal(s.stations[0].days.size,2);
});
test('mood score is a weighted 1..5 average and unmarked days stay unknown',()=>{
 assert.equal(M.moodScore({}),null);assert.equal(M.moodScore({terrible:0,good:0}),null);
 const m=M.moodScore({good:2,excellent:1,bad:1});assert.equal(m.total,4);assert.equal(m.score,(8+5+2)/4);assert.equal(m.dominant,'good');
 assert.equal(M.moodFor(3.4).key,'ok');assert.equal(M.moodFor(4.6).key,'excellent');assert.equal(M.moodFor(null),null);
});
test('month range and day rows keep unmarked days distinct from zero',()=>{
 assert.deepEqual(M.monthRange('2026-02'),{from:'2026-02-01',to:'2026-02-28'});assert.equal(M.dates('2026-09-29','2026-10-02').length,4);
 const d={date:'02.09.2026',workers:[{name:'Anna Test',shift:'24'}]},shifts=M.schedule([{a:[d]},{}]);
 const s=M.summary({shifts,ratings:{'2026-09-01':{good:3},'2026-09-05':{terrible:1}},radio:[{day:'2026-09-02',name:'Remix'}],from:'2026-09-01',to:'2026-09-03'});
 const rows=M.dayRows(s,'2026-09-01','2026-09-03');assert.equal(rows.length,3);
 assert.equal(rows[0].mood.score,4);assert.equal(rows[1].mood,null);assert.equal(rows[1].hours,24);assert.equal(rows[1].shifts[0].type,'24h');assert.deepEqual(rows[1].radio,['Remix']);assert.equal(rows[2].hours,0);
});
