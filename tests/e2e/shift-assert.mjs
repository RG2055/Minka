// Asserts the intended shift lifecycle on a snapshot produced by shiftstates.mjs
import fs from 'node:fs';
const s=JSON.parse(fs.readFileSync(process.argv[2])); const fails=[]; let n=0;
const card=(k,who,sec)=>s[k].cards.find(c=>c.who.startsWith(who)&&(!sec||c.sec===sec));
const ok=(c,m)=>{ n++; if(!c) fails.push(m); };
for(const [k,v] of Object.entries(s)) ok(!v.errors.length, k+': JS errors '+v.errors.join('|'));
// active shift
ok(card('active_1030','DELTA').timer==='05:30:00' && !card('active_1030','DELTA').warn,'active: DELTA counts down 05:30:00 without warning');
ok(card('active_1030','GAMMA').timer===null && card('active_1030','GAMMA').meta==='20–08','active: upcoming night shows its window, no timer');
ok(card('warning_1557','DELTA').warn==='warning-critical' && card('warning_1557','DELTA').timer==='00:03:00','3 min left: warning-critical');
ok(card('warning_1557','ALPHA').warn==='','4 h left: no warning');
// shift just ended
ok(!card('just_ended_1600','DELTA') && s.just_ended_1600.timers===4,'just ended: DELTA leaves the roster, other timers keep running');
ok(!card('live_cross_1600','DELTA') && s.live_cross_1600.timers===4,'live crossing of 16:00: DELTA removed by the running tick, no errors');
// old completed shift
ok(!card('old_completed_2230','ALPHA') && !card('old_completed_2230','DELTA') && card('old_completed_2230','GAMMA').timer==='09:30:00','22:30: finished day shifts gone, night counts down');
// 08:00 duty-day rollover
ok(s.rollover_0759.todayStr==='24.09.2026' && card('rollover_0759','GAMMA').timer==='00:01:00' && card('rollover_0759','GAMMA').warn==='warning-critical','07:59 next morning: still duty day 24.09, night ends in 1 min');
ok(s.rollover_0800.todayStr==='25.09.2026' && s.rollover_0800.activePill==='p-25-09-2026' && card('rollover_0800','DELTA').timer==='07:59:30','08:00:30: duty day rolls to 25.09 with fresh timers');
// selected past/future dates
for(const k of ['selected_future_25','selected_past_23']){ ok(s[k].timers===0 && s[k].todayStr==='24.09.2026','selected '+k+': no live timers, today unchanged'); ok(card(k,'DELTA').meta==='08–16' && card(k,'GAMMA').meta==='20–08','selected '+k+': cards show shift windows'); }
ok(s.selected_future_25.activeDate==='25.09.2026' && s.selected_past_23.activeDate==='23.09.2026','selected dates become active');
ok(s.back_to_today.timers===5 && card('back_to_today','DELTA').timer==='05:30:00','back to today: timers return');
ok(s.mobile_active_1030.timers===5,'mobile: same timers');
console.log(fails.length?`FAIL ${fails.length}/${n}\n - `+fails.join('\n - '):`ALL ${n} SHIFT ASSERTIONS PASS`); process.exit(fails.length?1:0);
