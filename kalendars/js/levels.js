/**
 * Minka Level System v3.0
 * XP = hours*2 + night*15 + 24h*25 + diversity + regularity + holidays + group load
 * Used only inside stats modal / leaderboard.
 */
(function() {
  'use strict';

  const LEVELS = [
    { lvl: 1, xp: 0, color: '#6b7280' },
    { lvl: 2, xp: 120, color: '#6b7280' },
    { lvl: 3, xp: 300, color: '#60a5fa' },
    { lvl: 4, xp: 600, color: '#60a5fa' },
    { lvl: 5, xp: 1000, color: '#38bdf8' },
    { lvl: 6, xp: 1500, color: '#38bdf8' },
    { lvl: 7, xp: 2200, color: '#f59e0b' },
    { lvl: 8, xp: 3200, color: '#f59e0b' },
    { lvl: 9, xp: 4500, color: '#0ea5e9' },
    { lvl: 10, xp: 6500, color: '#fbbf24' }
  ];

  const LEVEL_TITLES = {
    1: 'Kadets',
    2: 'Operators',
    3: 'Specialists',
    4: 'Eksperts',
    5: 'Meistars',
    6: 'Virsnieks',
    7: 'Komandieris',
    8: 'Elite',
    9: 'Legenda',
    10: 'Veterans'
  };

  const HOLIDAYS = new Set([
    '01.01', '18.11', '24.06', '23.06', '04.05', '15.05',
    '25.12', '26.12', '31.12', '01.05', '14.06', '11.11'
  ]);

  const EMOJI_SECTIONS = [
    { label: 'Medicina', emoji: ['🩻','💉','🏥','⚕️','🔬','💊','🩺','🩹','🧬','🫀','🧠','🦷','🩸','🧪','🔭','🫁','🧲','⚗️','🩼','🦺','🥼','🚑','🏋️‍♂️','💪','🧘','🫶','💆','🛌','🏃','🧑‍⚕️'] },
    { label: 'Sajutas', emoji: ['😴','😎','🤯','💀','👻','🤖','🦾','😤','🥱','😵','🤪','🧐','😏','🥳','🫡','🥶','🥵','😈','👾','🫠','😑','🙃','😬','🫤','😒','🥺','🫂','💤','😤','💪'] },
    { label: 'Enerģija', emoji: ['🔥','⚡','❄️','🌊','🌪️','☀️','🌙','⛈️','💥','✨','🎯','🚀','💎','🏆','⚔️','🛡️','🎲','💫','🌟','⭐','🌑','🌕','☄️','🌤️','🌧️','🌬️','🔮','🪬','🌋','🗻'] },
    { label: 'Dzivnieki', emoji: ['🦊','🐺','🐱','🦁','🐉','🦬','🦅','🐻','🐼','🦝','🐸','🦎','🦈','🐬','🦌','🦩','🦚','🐙','🦑','🐝','🦔','🐧','🦜','🐊','🦭','🐋','🦘','🐓','🦢','🐍'] },
    { label: 'Daba', emoji: ['🌵','🌿','🍀','🌱','🍁','🍂','🌸','🌺','🌻','🌹','🪨','🌲','🌴','🎋','🌾','🪸','🍄','🪴','🫧','🧊','🌍','🏔️','🏕️','🌊','🏜️','🏞️','🌅','🌄','🌠','🌃'] },
    { label: 'Prieksmeti', emoji: ['☕','🍕','🎸','🎮','🏂','🤿','🧩','🪄','🎪','🎭','🎨','🎵','🎺','🥊','🎳','🎱','🏹','🔑','📡','🔦','🛠️','🪓','🎤','🎧','📷','🎁','🃏','🎲','📚','📎'] },
    { label: 'Simboli', emoji: ['💯','⚠️','🆘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔶','🔷','💠','🔺','🔻','🎯','❗','❕','✅','❌','🔒','🔓','🔑','💡','🔔','📌','🏴','🚩','⚡'] }
  ];

  function isHoliday(dateStr) {
    var p = String(dateStr || '').split('.');
    if (p.length < 2) return false;
    return HOLIDAYS.has(p[0] + '.' + p[1]);
  }

  function getLevelData(xp) {
    var lvl = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xp) {
        lvl = LEVELS[i];
        break;
      }
    }
    var next = LEVELS.find(function(entry) { return entry.xp > xp; }) || null;
    var progress = next ? Math.round((xp - lvl.xp) / (next.xp - lvl.xp) * 100) : 100;
    return { current: lvl, next: next, xp: xp, progress: progress };
  }

  function getLevelTitle(levelData) {
    var lvl = levelData && levelData.current ? levelData.current.lvl : 1;
    return LEVEL_TITLES[lvl] || ('Lv. ' + lvl);
  }

  function escapeAttr(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getInitials(name) {
    return String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function(part) { return (part[0] || '').toUpperCase(); })
      .join('') || '??';
  }

  function shortName(name) {
    return String(name || '').split(' ').map(function(part, index) {
      return index === 0 ? part : (part[0] || '') + '.';
    }).join(' ');
  }

  function normalizeDateObj(dateStr) {
    var p = String(dateStr || '').split('.');
    if (p.length < 3) return null;
    var d = new Date(+p[2], +p[1] - 1, +p[0]);
    return isNaN(d.getTime()) ? null : d;
  }

  function calcLongestStreak(dates) {
    var uniq = Array.from(new Set((dates || []).filter(Boolean)))
      .map(normalizeDateObj)
      .filter(Boolean)
      .sort(function(a, b) { return a - b; });
    if (!uniq.length) return 0;
    var best = 1;
    var current = 1;
    for (var i = 1; i < uniq.length; i++) {
      var diffDays = Math.round((uniq[i] - uniq[i - 1]) / 86400000);
      if (diffDays === 1) {
        current++;
        if (current > best) best = current;
      } else if (diffDays > 1) {
        current = 1;
      }
    }
    return best;
  }

  function getWeekKey(dateStr) {
    var p = String(dateStr || '').split('.');
    if (p.length < 3) return '0000-00';
    var d = new Date(+p[2], +p[1] - 1, +p[0]);
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var week = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-' + String(week).padStart(2, '0');
  }

  function weekDiff(wk1, wk2) {
    if (!wk1 || !wk2) return 0;
    var p1 = wk1.split('-');
    var p2 = wk2.split('-');
    return Math.abs((+p2[0] - +p1[0]) * 52 + (+p2[1] - +p1[1]));
  }

  function getEffectiveTodayStr() {
    var now = new Date();
    var eff = new Date(now);
    if (eff.getHours() < 8) eff.setDate(eff.getDate() - 1);
    return String(eff.getDate()).padStart(2, '0') + '.' + String(eff.getMonth() + 1).padStart(2, '0') + '.' + eff.getFullYear();
  }

  function isCurrentlyOnDuty(workerName) {
    var now = new Date();
    var today = getEffectiveTodayStr();
    var stores = [window.__grafiksStore || {}, window.__grafiksStoreRad || {}];

    for (var s = 0; s < stores.length; s++) {
      var store = stores[s];
      for (var monthKey in store) {
        if (!Object.prototype.hasOwnProperty.call(store, monthKey)) continue;
        var monthArr = store[monthKey];
        if (!Array.isArray(monthArr)) continue;
        for (var i = 0; i < monthArr.length; i++) {
          var day = monthArr[i];
          if (!day || day.date !== today || !Array.isArray(day.workers)) continue;
          for (var j = 0; j < day.workers.length; j++) {
            var w = day.workers[j];
            if (!w || w.name !== workerName || !w.startTime || !w.endTime) continue;
            var sh = String(w.startTime).split(':').map(Number);
            var eh = String(w.endTime).split(':').map(Number);
            var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh[0] || 0, sh[1] || 0, 0, 0);
            var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh[0] || 0, eh[1] || 0, 0, 0);
            if (end <= start) end.setDate(end.getDate() + 1);
            if (start > now) start.setDate(start.getDate() - 1);
            if (now >= start && now < end) return true;
          }
        }
      }
    }

    return false;
  }

  function _bolusChangesPerPerson() {
    var counts = {};
    try {
      var h = JSON.parse(localStorage.getItem('minkaBolusHistoryV1') || 'null');
      if (h) {
        ['ge', 'philips'].forEach(function(room) {
          var arr = h[room];
          if (!Array.isArray(arr)) return;
          arr.forEach(function(entry) {
            var name = (entry.name || '').trim();
            if (!name || name === 'Anonīms') return;
            counts[name] = (counts[name] || 0) + 1;
          });
        });
      }
    } catch(_e) {}
    return counts;
  }

  function _coffeeKey(name) {
    return String(name || '').trim().toLocaleLowerCase('lv-LV');
  }
  var _coffeeApiFetchedAt = 0;
  function _fetchCoffeeTotalsFromApi() {
    // The coffee API stores every day in D1; localStorage only has days this
    // device synced. Pull all-time totals so yesterday's coffees show up too.
    var now = Date.now();
    if (now - _coffeeApiFetchedAt < 60000) return;
    _coffeeApiFetchedAt = now;
    try {
      var base = String(window.MINKA_COFFEE_API_BASE || 'https://minka-coffee-api.gamernr1elite.workers.dev').replace(/\/+$/, '');
      fetch(base + '/api/coffee?totals=1')
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (!d || !d.ok || !d.totals) return;
          var t = {};
          Object.keys(d.totals).forEach(function(k) {
            t[_coffeeKey(k)] = Math.max(0, Number(d.totals[k]) || 0);
          });
          window.__mkCoffeeTotalsApi = t;
          var m = document.getElementById('stats-modal');
          if (m && m.style.display && m.style.display !== 'none') {
            window.MinkaLevels.injectIntoStats();
          }
        })
        .catch(function() {});
    } catch (_e) {}
  }
  function _coffeeTotalsPerPerson() {
    var totals = {};
    try {
      var data = JSON.parse(localStorage.getItem('minkaCoffeeCountsV1') || 'null');
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(function(day) {
          var dayObj = data[day];
          if (!dayObj || typeof dayObj !== 'object') return;
          Object.keys(dayObj).forEach(function(key) {
            totals[key] = (totals[key] || 0) + (Number(dayObj[key]) || 0);
          });
        });
      }
    } catch (_e) {}
    // Merge with server totals (authoritative across devices/days) — take the
    // larger value per person so fresh local clicks aren't lost either.
    var api = window.__mkCoffeeTotalsApi;
    if (api) {
      Object.keys(api).forEach(function(key) {
        totals[key] = Math.max(totals[key] || 0, api[key]);
      });
    }
    return totals;
  }

  function buildAllTimeStats() {
    var store = window.__grafiksStore || {};
    var storeRad = window.__grafiksStoreRad || {};
    var workers = {};
    var bolusCounts = _bolusChangesPerPerson();
    var coffeeTotals = _coffeeTotalsPerPerson();

    function processStore(src, isRad) {
      Object.values(src).forEach(function(monthArr) {
        if (!Array.isArray(monthArr)) return;
        monthArr.forEach(function(day) {
          if (!day || !Array.isArray(day.workers)) return;
          day.workers.forEach(function(w) {
            if (!w.name || !w.shift) return;
            var name = w.name;
            if (!workers[name]) {
              workers[name] = {
                name: name,
                isRad: isRad,
                totalHrs: 0,
                nakts: 0,
                h24: 0,
                diena: 0,
                holidays: 0,
                weeks: {},
                dates: []
              };
            }
            var hrs = parseInt(String(w.shift || '').replace(/\D/g, ''), 10) || 8;
            var type = String(w.type || '').toUpperCase();
            workers[name].totalHrs += hrs;
            if (type === 'NAKTS') workers[name].nakts++;
            else if (type === 'DIENNAKTS' || hrs >= 24) workers[name].h24++;
            else workers[name].diena++;
            if (w.date && isHoliday(w.date)) workers[name].holidays++;
            if (w.date) {
              workers[name].dates.push(w.date);
              var wk = getWeekKey(w.date);
              workers[name].weeks[wk] = (workers[name].weeks[wk] || 0) + hrs;
            }
          });
        });
      });
    }

    processStore(store, false);
    processStore(storeRad, true);

    var groupHrsRG = 0;
    var groupHrsRD = 0;
    var groupCountRG = 0;
    var groupCountRD = 0;

    Object.values(workers).forEach(function(ws) {
      if (ws.isRad) {
        groupHrsRD += ws.totalHrs;
        groupCountRD++;
      } else {
        groupHrsRG += ws.totalHrs;
        groupCountRG++;
      }
    });

    Object.values(workers).forEach(function(ws) {
      var xp = 0;
      xp += ws.totalHrs * 2;
      xp += ws.nakts * 15;
      xp += ws.h24 * 25;

      var hasAll = ws.nakts > 0 && ws.h24 > 0 && ws.diena > 0;
      var has2 = (ws.nakts > 0 && ws.h24 > 0) || (ws.nakts > 0 && ws.diena > 0) || (ws.h24 > 0 && ws.diena > 0);
      if (hasAll) xp += 200;
      else if (has2) xp += 80;

      var weekKeys = Object.keys(ws.weeks);
      var regularityBonus = 0;
      if (weekKeys.length > 0) {
        var minWk = weekKeys.reduce(function(a, b) { return a < b ? a : b; });
        var maxWk = weekKeys.reduce(function(a, b) { return a > b ? a : b; });
        var totalWeeks = Math.max(1, weekDiff(minWk, maxWk) + 1);
        var regularity = weekKeys.length / totalWeeks;
        regularityBonus = Math.round(regularity * 150);
        xp += regularityBonus;
      }

      xp += ws.holidays * 30;

      var groupAvg = ws.isRad
        ? (groupCountRD > 1 ? groupHrsRD / groupCountRD : ws.totalHrs)
        : (groupCountRG > 1 ? groupHrsRG / groupCountRG : ws.totalHrs);
      var ratio = groupAvg > 0 ? ws.totalHrs / groupAvg : 1;
      var loadBonus = ratio > 1 ? Math.min(100, Math.round((ratio - 1) * 150)) : 0;
      xp += loadBonus;

      var bolusCount = bolusCounts[ws.name] || 0;
      var bolusBonus = bolusCount * 20;
      xp += bolusBonus;

      var coffeeCount = coffeeTotals[_coffeeKey(ws.name)] || 0;
      var coffeeBonus = coffeeCount * 5;
      xp += coffeeBonus;

      ws.coffeeTotal = coffeeCount;
      ws.xp = Math.round(xp);
      ws.levelData = getLevelData(ws.xp);
      ws.longestStreak = calcLongestStreak(ws.dates);
      ws.bonuses = {
        base: ws.totalHrs * 2,
        nakts: ws.nakts * 15,
        h24: ws.h24 * 25,
        diversity: hasAll ? 200 : has2 ? 80 : 0,
        regularity: regularityBonus,
        holidays: ws.holidays * 30,
        load: loadBonus,
        bolus: bolusBonus,
        bolusCount: bolusCount,
        coffee: coffeeBonus,
        coffeeCount: coffeeCount
      };
    });

    return workers;
  }

  function buildMonthStats(activeMonth) {
    var store = window.__grafiksStore || {};
    var storeRad = window.__grafiksStoreRad || {};
    var workerStats = {};
    var amUp = String(activeMonth || '').toUpperCase();
    var amYear = (amUp.match(/20\d{2}/) || [''])[0];
    var mNums = {'JANVĀRIS':1,'JANVARIS':1,'FEBRUĀRIS':2,'FEBRUARIS':2,'MARTS':3,
      'APRĪLIS':4,'APRILIS':4,'MAIJS':5,'JŪNIJS':6,'JUNIJS':6,
      'JŪLIJS':7,'JULIJS':7,'AUGUSTS':8,'SEPTEMBRIS':9,'OKTOBRIS':10,'NOVEMBRIS':11,'DECEMBRIS':12};
    var mKey = Object.keys(mNums).find(function(k){ return amUp.indexOf(k) !== -1; });
    var amMM = mKey ? mNums[mKey] : null;

    function process(src, isRad) {
      var seen = new Set();
      var keys = Object.keys(src);
      for (var ki = 0; ki < keys.length; ki++) {
        var days = src[keys[ki]];
        if (!Array.isArray(days)) continue;
        for (var i = 0; i < days.length; i++) {
          var day = days[i];
          if (!day || !Array.isArray(day.workers)) continue;
          var dp = String(day.date || '').split('.');
          if (dp.length !== 3) continue;
          var dd = Number(dp[0]), mm = Number(dp[1]), yy = Number(dp[2]);
          if (amMM && amYear && (mm !== amMM || String(yy) !== amYear)) continue;
          for (var j = 0; j < day.workers.length; j++) {
            var w = day.workers[j];
            if (!w.name || !w.shift) continue;
            var dedupKey = day.date + '|' + w.name + '|' + w.shift;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);
            var name = w.name;
            if (!workerStats[name]) {
              workerStats[name] = { name: name, isRad: isRad, d12: 0, n12: 0, h24: 0, h8: 0, total: 0, totalHrs: 0 };
            }
            var hrs = parseInt(String(w.shift || '').replace(/\D/g, ''), 10) || 0;
            var type = String(w.type || '').toUpperCase();
            workerStats[name].totalHrs += hrs;
            workerStats[name].total++;
            if (type === 'DIENNAKTS' || hrs >= 24) workerStats[name].h24++;
            else if (type === 'NAKTS') workerStats[name].n12++;
            else if (hrs >= 12) workerStats[name].d12++;
            else workerStats[name].h8++;
          }
        }
      }
    }

    process(store, false);
    process(storeRad, true);
    return workerStats;
  }

  // ── Team fatigue chart (month curve + moon curve) ─────────────────────
  // Lightweight by design: one static SVG, no filters, no animation. The
  // per-day score is the same weekly-load proxy the tendency/sparkline charts
  // use, averaged across everyone who worked that week.
  var MONTH_NUMS = {'JANVĀRIS':1,'JANVARIS':1,'FEBRUĀRIS':2,'FEBRUARIS':2,'MARTS':3,
    'APRĪLIS':4,'APRILIS':4,'MAIJS':5,'JŪNIJS':6,'JUNIJS':6,
    'JŪLIJS':7,'JULIJS':7,'AUGUSTS':8,'SEPTEMBRIS':9,'OKTOBRIS':10,'NOVEMBRIS':11,'DECEMBRIS':12};

  function _moonIllum(d) { // Date -> 0..1 (0 new moon, 1 full moon)
    var ref = Date.UTC(2000, 0, 6, 18, 14);
    var cycle = 29.53058867;
    var phase = (((d.getTime() - ref) / 86400000) % cycle + cycle) % cycle / cycle;
    return (1 - Math.cos(2 * Math.PI * phase)) / 2;
  }

  function _bezier(pts) {
    if (!pts.length) return '';
    var p = 'M ' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var cx = (pts[i-1].x + pts[i].x) / 2;
      p += ' C ' + cx.toFixed(1) + ',' + pts[i-1].y.toFixed(1) + ' ' + cx.toFixed(1) + ',' + pts[i].y.toFixed(1) + ' ' + pts[i].x.toFixed(1) + ',' + pts[i].y.toFixed(1);
    }
    return p;
  }

  // Per-day fatigue: a shift adds load (hours + night/24h penalties), each rest
  // day recovers. This gives a curve that actually moves day to day — unlike a
  // weekly aggregate, which is flat within each week.
  function _dayLoad(shift) {
    var l = (shift.hours / 12) * 30;       // ~30 pts for a 12h shift
    if (shift.isNight) l += 18;            // night penalty
    if (shift.hours >= 24) l += 14;        // diennakts extra
    return l;
  }

  function buildFatigueChart(monthStats, activeMonth) {
    if (!window.__fatigue || !window.__fatigue.gatherWorkerHistory) return '';
    // Diacritic-insensitive month match (precomposed vs combining safety).
    var _strip = function(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var amUp = _strip(String(activeMonth || '').toUpperCase());
    var year = +((amUp.match(/20\d{2}/) || [0])[0]);
    var mKey = Object.keys(MONTH_NUMS).find(function(k) {
      return amUp.indexOf(_strip(k)) !== -1;
    });
    var mm = mKey ? MONTH_NUMS[mKey] : 0;
    // Radiographers only (RG = !isRad). Falls back to everyone if flags absent.
    var names = Object.keys(monthStats).filter(function(n) { return monthStats[n].isRad !== true; });
    if (!names.length) names = Object.keys(monthStats);
    if (!year || !mm || !names.length) return '';

    var daysIn = new Date(year, mm, 0).getDate();
    var hists = {};
    names.forEach(function(n) { hists[n] = window.__fatigue.gatherWorkerHistory(n) || []; });

    // Warm-up: start the accumulation 12 days before the 1st so the early-month
    // values reflect real prior load instead of starting cold at 0.
    var warm = 12;
    var team = [], moon = [];
    // Precompute per-worker running fatigue across the warm-up + month window.
    var fatByDay = {}; // name -> array aligned to days 1..daysIn
    names.forEach(function(n) {
      var F = 0, arr = [];
      for (var off = -warm; off < daysIn; off++) {
        var d = new Date(year, mm - 1, 1 + off);
        var todays = hists[n].filter(function(e) {
          return e.date.getFullYear() === d.getFullYear() &&
                 e.date.getMonth() === d.getMonth() &&
                 e.date.getDate() === d.getDate();
        });
        if (todays.length) {
          var load = todays.reduce(function(s, e) { return s + _dayLoad(e); }, 0);
          F = Math.min(100, F * 0.78 + load);   // carry some, add new
        } else {
          F = F * 0.5;                            // rest day recovers ~half
        }
        if (off >= 0) arr.push(F);
      }
      fatByDay[n] = arr;
    });

    for (var day = 1; day <= daysIn; day++) {
      var sum = 0, cnt = 0;
      names.forEach(function(n) {
        var v = fatByDay[n][day - 1];
        if (v > 0.5) { sum += v; cnt++; }
      });
      team.push(cnt ? Math.round(sum / cnt) : 0);
      moon.push(Math.round(_moonIllum(new Date(year, mm - 1, day, 12)) * 100));
    }

    // Stats: average / peak / full-moon day / moon correlation
    var avg = Math.round(team.reduce(function(a, b) { return a + b; }, 0) / daysIn);
    var peak = 0, peakDay = 1;
    team.forEach(function(v, i) { if (v > peak) { peak = v; peakDay = i + 1; } });
    var fullIdx = 0;
    moon.forEach(function(v, i) { if (v > moon[fullIdx]) fullIdx = i; });
    // Pearson correlation fatigue vs moon (just for fun)
    var mT = team.reduce(function(a,b){return a+b;},0)/daysIn, mM = moon.reduce(function(a,b){return a+b;},0)/daysIn;
    var num = 0, dT = 0, dM = 0;
    for (var i2 = 0; i2 < daysIn; i2++) { var a2 = team[i2]-mT, b2 = moon[i2]-mM; num += a2*b2; dT += a2*a2; dM += b2*b2; }
    var corr = (dT && dM) ? Math.round(num / Math.sqrt(dT * dM) * 100) : 0;

    var todayIdx = -1;
    var nowD = new Date();
    if (nowD.getFullYear() === year && nowD.getMonth() === mm - 1) todayIdx = nowD.getDate() - 1;

    // ── SVG ── (taller so the curve is easier to read; wider-than-tall stays ~3:1)
    var W = 640, H = 210, padL = 30, padR = 12, padT = 16, padB = 24;
    var gW = W - padL - padR, gH = H - padT - padB;
    var xp = function(i) { return padL + (i / (daysIn - 1)) * gW; };
    var yp = function(v) { return padT + gH - (v / 100) * gH; };
    var teamPts = team.map(function(v, i) { return { x: xp(i), y: yp(v) }; });
    var moonPts = moon.map(function(v, i) { return { x: xp(i), y: yp(v) }; });
    var teamPath = _bezier(teamPts);
    var areaPath = teamPath + ' L ' + xp(daysIn - 1).toFixed(1) + ',' + (padT + gH).toFixed(1) + ' L ' + xp(0).toFixed(1) + ',' + (padT + gH).toFixed(1) + ' Z';
    var moonPath = _bezier(moonPts);

    // Weekend bands — subtle columns so Sa/Sv stand out and explain rest dips.
    var colW = gW / (daysIn - 1);
    var weekendBands = '';
    for (var wd = 0; wd < daysIn; wd++) {
      var dow2 = new Date(year, mm - 1, wd + 1).getDay();
      if (dow2 === 0 || dow2 === 6) {
        weekendBands += '<rect x="' + (xp(wd) - colW / 2).toFixed(1) + '" y="' + padT + '" width="' + colW.toFixed(1) + '" height="' + gH + '" fill="rgba(125,211,252,0.035)"/>';
      }
    }

    // Y zones: faint danger tint up high + zone labels (Zems / Vidējs / Augsts).
    var zones =
      '<rect x="' + padL + '" y="' + yp(100).toFixed(1) + '" width="' + gW + '" height="' + (gH * 0.25).toFixed(1) + '" fill="rgba(244,114,182,0.05)"/>' +
      '<rect x="' + padL + '" y="' + yp(50).toFixed(1) + '" width="' + gW + '" height="' + (gH * 0.25).toFixed(1) + '" fill="rgba(129,140,248,0.03)"/>';
    var grid = '';
    [25, 50, 75].forEach(function(v) {
      grid += '<line x1="' + padL + '" y1="' + yp(v).toFixed(1) + '" x2="' + (padL + gW) + '" y2="' + yp(v).toFixed(1) + '" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" stroke-dasharray="3 4"/>'
        + '<text x="' + (padL - 5) + '" y="' + (yp(v) + 3).toFixed(1) + '" text-anchor="end" fill="rgba(255,255,255,0.2)" font-size="8" font-family="Inter,system-ui,sans-serif">' + v + '</text>';
    });
    var zoneLabels =
      '<text x="' + (padL + gW - 2) + '" y="' + (yp(88)).toFixed(1) + '" text-anchor="end" fill="rgba(244,114,182,0.45)" font-size="7.5" font-weight="700" font-family="Inter,system-ui,sans-serif" letter-spacing="0.5">AUGSTS</text>' +
      '<text x="' + (padL + gW - 2) + '" y="' + (yp(12)).toFixed(1) + '" text-anchor="end" fill="rgba(125,211,252,0.4)" font-size="7.5" font-weight="700" font-family="Inter,system-ui,sans-serif" letter-spacing="0.5">ZEMS</text>';

    // X-axis: a tick + "D.M" label on every Monday — easier to anchor dates.
    var xLabels = '';
    for (var dl = 0; dl < daysIn; dl++) {
      var dow3 = new Date(year, mm - 1, dl + 1).getDay();
      if (dow3 === 1 || dl === 0) {
        xLabels += '<line x1="' + xp(dl).toFixed(1) + '" y1="' + padT + '" x2="' + xp(dl).toFixed(1) + '" y2="' + (padT + gH) + '" stroke="rgba(255,255,255,0.045)" stroke-width="0.5"/>'
          + '<text x="' + xp(dl).toFixed(1) + '" y="' + (padT + gH + 14) + '" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="8" font-family="Inter,system-ui,sans-serif">' + (dl + 1) + '.' + mm + '</text>';
      }
    }
    var todayMark = todayIdx >= 0
      ? '<line x1="' + xp(todayIdx).toFixed(1) + '" y1="' + padT + '" x2="' + xp(todayIdx).toFixed(1) + '" y2="' + (padT + gH) + '" stroke="rgba(56,189,248,0.4)" stroke-width="1" stroke-dasharray="2 3"/>'
        + '<rect x="' + (xp(todayIdx) - 2.6).toFixed(1) + '" y="' + (yp(team[todayIdx]) - 2.6).toFixed(1) + '" width="5.2" height="5.2" fill="#7dd3fc"/>'
        + '<text x="' + xp(todayIdx).toFixed(1) + '" y="' + (padT - 5) + '" text-anchor="middle" fill="rgba(125,211,252,0.8)" font-size="7.5" font-weight="700" font-family="Inter,system-ui,sans-serif">ŠODIEN</text>'
      : '';
    // Full moon: pixel-square marker on the moon curve (echoes the pixel logo)
    var fullMark =
      '<rect x="' + (xp(fullIdx) - 2.8).toFixed(1) + '" y="' + (yp(moon[fullIdx]) - 2.8).toFixed(1) + '" width="5.6" height="5.6" fill="#c4cad2"/>'
      + '<text x="' + xp(fullIdx).toFixed(1) + '" y="' + (yp(moon[fullIdx]) - 7).toFixed(1) + '" text-anchor="middle" fill="rgba(196,202,210,0.75)" font-size="7.5" font-family="Inter,system-ui,sans-serif">🌕 ' + (fullIdx + 1) + '.' + mm + '</text>';
    // Peak fatigue: pixel square in the danger colour
    var peakMark = '<rect x="' + (xp(peakDay - 1) - 2.6).toFixed(1) + '" y="' + (yp(peak) - 2.6).toFixed(1) + '" width="5.2" height="5.2" fill="#f472b6"/>';

    return '<div class="mk-stx-fat">' +
      '<div class="mk-stx-sechead" style="margin-bottom:10px;">' +
        '<div class="lbl"><span class="dot" style="background:#38bdf8;box-shadow:0 0 0 4px rgba(56,189,248,.13);"></span>Nogurums · radiogrāferi — ' + escapeAttr(activeMonth) + '</div>' +
        '<div class="line"></div>' +
        '<div class="mk-stx-fat-legend">' +
          '<i class="lg-line"></i><span>Komanda</span>' +
          '<i class="lg-moon"></i><span>Mēness</span>' +
          '<i class="lg-full"></i><span>Pilnmēness</span>' +
        '</div>' +
      '</div>' +
      '<div class="mk-stx-fat-card">' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:' + H + 'px;display:block;">' +
          '<defs>' +
            // Curve colour ramps with the actual fatigue value (mapped in user
            // space): calm ice-blue low → indigo → pink alert high.
            '<linearGradient id="stxFatLine" gradientUnits="userSpaceOnUse" x1="0" y1="' + padT.toFixed(1) + '" x2="0" y2="' + (padT + gH).toFixed(1) + '">' +
              '<stop offset="0%" stop-color="#f472b6"/>' +
              '<stop offset="28%" stop-color="#a78bfa"/>' +
              '<stop offset="52%" stop-color="#38bdf8"/>' +
              '<stop offset="100%" stop-color="#7dd3fc"/>' +
            '</linearGradient>' +
            '<linearGradient id="stxFatArea" gradientUnits="userSpaceOnUse" x1="0" y1="' + padT.toFixed(1) + '" x2="0" y2="' + (padT + gH).toFixed(1) + '">' +
              '<stop offset="0%" stop-color="rgba(244,114,182,0.22)"/>' +
              '<stop offset="55%" stop-color="rgba(56,189,248,0.12)"/>' +
              '<stop offset="100%" stop-color="rgba(125,211,252,0)"/>' +
            '</linearGradient>' +
          '</defs>' +
          weekendBands + zones + grid + zoneLabels + xLabels +
          '<path d="' + moonPath + '" fill="none" stroke="rgba(196,202,210,0.4)" stroke-width="1.2" stroke-dasharray="3 4"/>' +
          '<path d="' + areaPath + '" fill="url(#stxFatArea)"/>' +
          '<path d="' + teamPath + '" fill="none" stroke="url(#stxFatLine)" stroke-width="6" opacity="0.16" stroke-linecap="round"/>' +
          '<path d="' + teamPath + '" fill="none" stroke="url(#stxFatLine)" stroke-width="2.4" stroke-linecap="round"/>' +
          todayMark + fullMark + peakMark +
        '</svg>' +
        '<div class="mk-stx-fat-stats">' +
          '<span>VIDĒJI <b>' + avg + '%</b></span>' +
          '<span>MAX <b>' + peak + '%</b> (' + peakDay + '.' + mm + ')</span>' +
          '<span>PILNMĒNESS <b>' + (fullIdx + 1) + '.' + mm + '</b></span>' +
          '<span title="Pīrsona korelācija starp komandas nogurumu un mēness gaismu">MĒNESS KORELĀCIJA <b>' + (corr > 0 ? '+' : '') + corr + '%</b></span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var INFO_RULES = [
    { tag: 'Stundu bāze',     color: '#1fe091', desc: 'katra nostrādātā stunda = 2 XP' },
    { tag: 'Nakts maiņa',     color: '#3f9bff', desc: 'katra nakts +15 XP (papildus stundām)' },
    { tag: 'Diennakts maiņa', color: '#f5b73f', desc: 'katra 24h +25 XP' },
    { tag: 'Dažādība',        color: '#23cdcf', desc: 'diena + nakts + 24h: +200 XP; divas kategorijas: +80 XP' },
    { tag: 'Regularitāte',    color: '#b6e84a', desc: 'jo stabilāk katru nedēļu, jo vairāk XP (max +150)' },
    { tag: 'Svētku maiņas',   color: '#fb8a4c', desc: 'katra svētku diena +30 XP' },
    { tag: 'Komandas slodze', color: '#1fe091', desc: 'virs komandas vidējā papildus līdz +100 XP' },
    { tag: 'Bolusa maiņa',    color: '#ff5c5c', desc: 'katra bolusa maiņa +20 XP' },
    { tag: 'Kafija ☕',        color: '#fb8a4c', desc: 'katra kafija +5 XP' }
  ];

  function buildInfoBox() {
    var open = !!window.__mkStatsInfoOpen;
    return '<div class="mk-stx-info' + (open ? '' : ' collapsed') + '" id="mk-stx-info">' +
      '<div class="mk-stx-info-head" onclick="mkStatsInfoToggle()">' +
        '<span class="dot"></span>' +
        '<h2>Kā tiek skaitīts LVL</h2>' +
        '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</div>' +
      (open
        ? '<div class="mk-stx-info-grid">' +
            INFO_RULES.map(function(r) {
              return '<div class="rule"><span class="tag" style="color:' + r.color + ';">' + r.tag + '</span><span class="desc">— ' + r.desc + '</span></div>';
            }).join('') +
          '</div>' +
          '<div class="mk-stx-info-hint">Turi kursoru uz rindas, lai redzētu detalizētu XP sadalījumu.</div>'
        : '') +
    '</div>';
  }

  function renderMonthTable(workers, title, accent) {
    if (!workers.length) return '';
    var rows = workers.map(function(w) {
      var name = shortName(w.name);
      var bar = Math.min(100, Math.round(w.totalHrs / 200 * 100));
      var emoji = window.MinkaEmoji ? (window.MinkaEmoji.get(w.name) || '') : '';
      var ld = w.levelData || getLevelData(0);
      return '<tr>' +
        '<td style="padding:7px 8px;font-size:11px;font-weight:700;color:#e0e0e0;white-space:nowrap;">' +
          (emoji ? '<span style="margin-right:4px;">' + emoji + '</span>' : '') + name +
          '<span style="margin-left:5px;font-size:9px;font-weight:800;color:' + ld.current.color + ';opacity:.8;">Lv.' + ld.current.lvl + '</span>' +
        '</td>' +
        '<td style="padding:7px 8px;text-align:center;font-size:12px;font-weight:800;color:#00ff7f;">' + w.totalHrs + 'h</td>' +
        '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#60a5fa;">' + (w.d12 || '-') + '</td>' +
        '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#67e8f9;">' + (w.n12 || '-') + '</td>' +
        '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#fb923c;">' + (w.h24 || '-') + '</td>' +
        '<td style="padding:7px 8px;text-align:center;font-size:11px;color:rgba(255,255,255,0.35);">' + ((w.h8 || 0) > 0 ? w.h8 : '-') + '</td>' +
        '<td style="padding:7px 8px;min-width:70px;"><div style="height:3px;border-radius:99px;background:rgba(255,255,255,0.07);"><div style="height:100%;width:' + bar + '%;background:' + accent + ';border-radius:99px;"></div></div></td>' +
      '</tr>';
    }).join('');

    return '<div style="margin-bottom:20px;">' +
      '<div style="font-size:9px;font-weight:800;letter-spacing:.12em;color:' + accent + ';text-transform:uppercase;margin-bottom:8px;">' + title + '</div>' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.07);">' +
          '<th style="padding:5px 8px;text-align:left;font-size:9px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;">Darbinieks</th>' +
          '<th style="padding:5px 8px;font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;">Kopa</th>' +
          '<th style="padding:5px 8px;font-size:9px;color:#60a5fa;letter-spacing:.08em;text-transform:uppercase;">12D</th>' +
          '<th style="padding:5px 8px;font-size:9px;color:#67e8f9;letter-spacing:.08em;text-transform:uppercase;">12N</th>' +
          '<th style="padding:5px 8px;font-size:9px;color:#fb923c;letter-spacing:.08em;text-transform:uppercase;">24H</th>' +
          '<th style="padding:5px 8px;font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;">Citas</th>' +
          '<th style="padding:5px 8px;font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;">Slodze</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
  }

  function renderBadges(ws, topNightCount) {
    var badges = [];
    if ((ws.nakts || 0) > 0 && (ws.nakts || 0) === topNightCount) badges.push({ icon: '🌙', label: 'Nakts puce' });
    if ((ws.longestStreak || 0) >= 5) badges.push({ icon: '🔥', label: 'On Fire' });
    if ((ws.levelData && ws.levelData.current && ws.levelData.current.lvl >= 10) || ws.xp >= 6500) badges.push({ icon: '🛡️', label: 'Veterans' });
    return badges.map(function(badge) {
      return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);font-size:9px;font-weight:700;color:rgba(255,255,255,0.78);">' + badge.icon + '<span>' + badge.label + '</span></span>';
    }).join('');
  }

  function renderAvatarChip(ws, idx) {
    var gradient = idx === 0
      ? 'linear-gradient(135deg, rgba(251,191,36,0.95), rgba(245,158,11,0.88))'
      : idx === 1
      ? 'linear-gradient(135deg, rgba(226,232,240,0.92), rgba(148,163,184,0.88))'
      : idx === 2
      ? 'linear-gradient(135deg, rgba(251,146,60,0.92), rgba(180,83,9,0.88))'
      : (ws.isRad ? 'linear-gradient(135deg, rgba(56,189,248,0.88), rgba(124,58,237,0.78))' : 'linear-gradient(135deg, rgba(52,211,153,0.88), rgba(5,150,105,0.78))');
    return '<div style="width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;background:' + gradient + ';box-shadow:inset 0 1px 0 rgba(255,255,255,0.22), 0 12px 22px rgba(0,0,0,0.22);flex-shrink:0;">' + getInitials(ws.name) + '</div>';
  }

  var RANK_ACCENTS = ['#f3b94a', '#c4cad2', '#c98a57']; // gold / silver / bronze; rest ice-blue
  function _accentFor(idx) { return RANK_ACCENTS[idx] || '#38bdf8'; }
  function _hexRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function _fmt(n) {
    try { return Number(n || 0).toLocaleString('lv-LV'); } catch (_e) { return String(n || 0); }
  }

  function _bdItem(label, value, suffix) {
    var zero = !value;
    return '<div class="mk-stx-bi"><span>' + label + '</span><b class="' + (zero ? 'z' : '') + '">' +
      (zero ? '+0' : '+' + _fmt(value)) + (suffix || '') + '</b></div>';
  }

  function renderBreakdown(ws) {
    var b = ws.bonuses || {};
    var total = (b.base || 0) + (b.nakts || 0) + (b.h24 || 0) + (b.diversity || 0) +
      (b.regularity || 0) + (b.holidays || 0) + (b.load || 0) + (b.bolus || 0) + (b.coffee || 0);
    return '<div class="mk-stx-bd">' +
      '<h4>XP sadalījums</h4>' +
      '<div class="mk-stx-bd-grid">' +
        _bdItem('Bāze', b.base) +
        _bdItem('Nakts', b.nakts) +
        _bdItem('24h', b.h24) +
        _bdItem('Dažādība', b.diversity) +
        _bdItem('Regularitāte', b.regularity) +
        _bdItem('Svētki', b.holidays) +
        _bdItem('Slodze', b.load) +
        _bdItem('Boluss', b.bolus, b.bolusCount ? ' (' + b.bolusCount + '×)' : '') +
        _bdItem('Kafija', b.coffee, b.coffeeCount ? ' (' + b.coffeeCount + '×)' : '') +
        '<div class="mk-stx-bi"><span>Streak</span><b class="' + ((ws.longestStreak || 0) ? '' : 'z') + '">' + (ws.longestStreak || 0) + ' d.</b></div>' +
      '</div>' +
      '<div class="mk-stx-bd-foot"><span>Kopā</span><span class="tot">' + _fmt(total) + ' XP</span></div>' +
    '</div>';
  }

  function _metricTile(value, label, color) {
    var on = (Number(value) || 0) > 0;
    return '<div class="mk-stx-metric"><div class="v" style="color:' + (on ? color : 'var(--stx-t3)') + ';">' + value + '</div><div class="k">' + label + '</div></div>';
  }

  function renderLeaderboardRow(ws, idx) {
    var ld = ws.levelData || getLevelData(0);
    var accent = _accentFor(idx);
    var name = shortName(ws.name);
    var emoji = window.MinkaEmoji ? (window.MinkaEmoji.get(ws.name) || '') : '';
    var live = isCurrentlyOnDuty(ws.name);
    var pct = Math.max(0, Math.min(100, ld.progress || 0));
    var cap = ld.next ? ld.next.xp : ws.xp;
    var C = 2 * Math.PI * 26;

    return '<div class="mk-stx-row' + (idx < 3 ? ' top' : '') + '">' +
      '<div class="mk-stx-rank" style="' + (idx < 3 ? 'color:' + accent : '') + '">' + (idx + 1) + '</div>' +
      '<div class="mk-stx-av">' +
        '<svg width="58" height="58" viewBox="0 0 58 58">' +
          '<circle cx="29" cy="29" r="26" fill="none" stroke="#1c1e25" stroke-width="3.5"/>' +
          '<circle cx="29" cy="29" r="26" fill="none" stroke="' + accent + '" stroke-width="3.5" stroke-linecap="round" ' +
            'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C - C * pct / 100).toFixed(1) + '" transform="rotate(-90 29 29)"/>' +
        '</svg>' +
        '<div class="mk-stx-avc" style="background:' + accent + '">' + getInitials(ws.name) + '</div>' +
      '</div>' +
      '<div class="mk-stx-meta">' +
        '<div class="mk-stx-nameline">' +
          '<span class="mk-stx-name">' + name + '</span>' +
          '<span class="mk-stx-lvl" style="color:' + accent + ';background:' + _hexRgba(accent, 0.13) + ';border-color:' + _hexRgba(accent, 0.26) + ';">Lv.' + ld.current.lvl + '</span>' +
          (live ? '<span class="mk-stx-live" title="Šobrīd dežūrā"></span>' : '') +
        '</div>' +
        '<div class="mk-stx-title">' + getLevelTitle(ld) + (emoji ? ' <span class="em">' + emoji + '</span>' : '') + '</div>' +
      '</div>' +
      '<div class="mk-stx-prog">' +
        '<div class="mk-stx-bar"><div class="mk-stx-fill" style="width:' + pct + '%;background:linear-gradient(90deg,' + _hexRgba(accent, 0.65) + ',' + accent + ');"></div></div>' +
        '<div class="mk-stx-pstat">' +
          '<div class="frac">' + _fmt(ws.xp) + ' <small>/ ' + _fmt(cap) + ' XP</small></div>' +
          '<div class="next">' + (ld.next ? '+' + _fmt(Math.max(0, ld.next.xp - ws.xp)) + ' XP līdz nākamajam' : 'Maks. līmenis') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mk-stx-metrics">' +
        _metricTile((ws.totalHrs || 0) + 'h', 'Stundas', '#1fe091') +
        _metricTile(ws.h24 || 0, '24H', '#f5b73f') +
        _metricTile(ws.d12 || 0, '12 Diena', '#3f9bff') +
        _metricTile(ws.n12 || 0, '12 Nakts', '#23cdcf') +
        _metricTile(ws.bolusCount || 0, 'Boluss', '#ff5c5c') +
        _metricTile(ws.coffeeTotal || 0, 'Kafija', '#fb8a4c') +
      '</div>' +
      renderBreakdown(ws) +
    '</div>';
  }

  function renderLeaderboardGroup(list, title, accent) {
    if (!list.length) return '';
    return '<div class="mk-stx-section">' +
      '<div class="mk-stx-sechead">' +
        '<div class="lbl"><span class="dot" style="background:' + accent + ';box-shadow:0 0 0 4px ' + _hexRgba(accent, 0.13) + ';"></span>' + title + '</div>' +
        '<div class="line"></div>' +
        '<div class="count">' + list.length + ' dalībnieki</div>' +
      '</div>' +
      '<div class="mk-stx-rows">' +
        list.map(function(item, idx) { return renderLeaderboardRow(item, idx); }).join('') +
      '</div>' +
    '</div>';
  }

  window.MinkaLevels = {
    getLevelData: getLevelData,
    buildAllTimeStats: buildAllTimeStats,

    injectIntoStats: function() {
      var wrap = document.getElementById('stats-table-wrap');
      if (!wrap) return;

      var activeMonth = window.__activeMonth || '';
      var monthStats = buildMonthStats(activeMonth);
      var allStats = buildAllTimeStats();

      // Merge: MONTH numbers (hours, 12D, 12N, 24h — like the old clear table)
      // + all-time level/XP + bolus/coffee totals onto one object per person.
      Object.keys(monthStats).forEach(function(name) {
        var at = allStats[name] || null;
        var ms = monthStats[name];
        ms.levelData = at ? at.levelData : getLevelData(0);
        ms.xp = at ? at.xp : 0;
        ms.bonuses = at ? at.bonuses : {};
        ms.longestStreak = at ? at.longestStreak : 0;
        ms.coffeeTotal = at ? (at.coffeeTotal || 0) : 0;
        ms.bolusCount = at && at.bonuses ? (at.bonuses.bolusCount || 0) : 0;
        ms.allTime = at;
      });

      var sortKey = window.__mkStatsSort || 'xp';
      function cmp(a, b) {
        if (sortKey === 'hours') return (b.totalHrs || 0) - (a.totalHrs || 0);
        if (sortKey === 'bolus') return (b.bolusCount || 0) - (a.bolusCount || 0);
        if (sortKey === 'coffee') return (b.coffeeTotal || 0) - (a.coffeeTotal || 0);
        return (b.xp || 0) - (a.xp || 0);
      }
      var merged = Object.values(monthStats).sort(cmp);
      var lbRG = merged.filter(function(item) { return !item.isRad; });
      var lbRD = merged.filter(function(item) { return item.isRad; });

      function sortBtn(key, label) {
        return '<button class="mk-stx-sortbtn' + (sortKey === key ? ' active' : '') + '" onclick="mkStatsSort(\'' + key + '\')">' + label + '</button>';
      }
      var sortBar =
        '<div class="mk-stx-sort">' +
          '<span class="mk-stx-sort-lbl">TOP PĒC</span>' +
          sortBtn('xp', 'XP') +
          sortBtn('hours', 'Stundām') +
          sortBtn('bolus', 'Bolusa') +
          sortBtn('coffee', 'Kafijas') +
        '</div>';

      wrap.innerHTML =
        sortBar +
        buildInfoBox() +
        buildFatigueChart(monthStats, activeMonth) +
        renderLeaderboardGroup(lbRG, 'Radiogrāferi', '#1fe091') +
        renderLeaderboardGroup(lbRD, 'Radiologi', '#3f9bff');

      // Pull cross-device coffee totals (yesterday's coffees etc.) — re-renders when ready.
      _fetchCoffeeTotalsFromApi();

      window.mkStatsSort = function(key) {
        window.__mkStatsSort = key;
        window.MinkaLevels.injectIntoStats();
      };
      window.mkStatsInfoToggle = function() {
        window.__mkStatsInfoOpen = !window.__mkStatsInfoOpen;
        window.MinkaLevels.injectIntoStats();
      };
      // Tabs removed — single unified view. Keep a no-op for any legacy callers.
      window.mkStatsTab = function() {};
    }
  };

  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'mk_open_stats') return;
    var modal = document.getElementById('stats-modal');
    var isOpen = modal && modal.style.display !== 'none';
    if (isOpen) {
      if (window.closeStatsModal) window.closeStatsModal();
    } else {
      if (window.openStatsModal) window.openStatsModal();
    }
  });

  window.MinkaLevels.EMOJI_SECTIONS = EMOJI_SECTIONS;
})();
