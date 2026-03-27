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
    { lvl: 5, xp: 1000, color: '#a78bfa' },
    { lvl: 6, xp: 1500, color: '#a78bfa' },
    { lvl: 7, xp: 2200, color: '#f59e0b' },
    { lvl: 8, xp: 3200, color: '#f59e0b' },
    { lvl: 9, xp: 4500, color: '#ec4899' },
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

  function buildAllTimeStats() {
    var store = window.__grafiksStore || {};
    var storeRad = window.__grafiksStoreRad || {};
    var workers = {};
    var bolusCounts = _bolusChangesPerPerson();

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
        bolusCount: bolusCount
      };
    });

    return workers;
  }

  function buildMonthStats(activeMonth) {
    var store = window.__grafiksStore || {};
    var storeRad = window.__grafiksStoreRad || {};
    var workerStats = {};

    function process(src, isRad) {
      var monthData = src[activeMonth] || [];
      for (var i = 0; i < monthData.length; i++) {
        var day = monthData[i];
        if (!day || !Array.isArray(day.workers)) continue;
        for (var j = 0; j < day.workers.length; j++) {
          var w = day.workers[j];
          if (!w.name || !w.shift) continue;
          var name = w.name;
          if (!workerStats[name]) {
            workerStats[name] = {
              name: name,
              isRad: isRad,
              d12: 0,
              n12: 0,
              h24: 0,
              h8: 0,
              total: 0,
              totalHrs: 0
            };
          }
          var hrs = parseInt(String(w.shift || '').replace(/\D/g, ''), 10) || 8;
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

    process(store, false);
    process(storeRad, true);
    return workerStats;
  }

  function buildInfoBox() {
    return '<div style="position:relative;margin-bottom:14px;padding:12px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:16px;backdrop-filter:blur(16px) saturate(135%);-webkit-backdrop-filter:blur(16px) saturate(135%);box-shadow:0 18px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06);">' +
        '<div style="font-size:10px;font-weight:800;color:#a78bfa;margin-bottom:6px;letter-spacing:.06em;">ℹ KA TIEK SKAITITS LVL</div>' +
        '<div style="font-size:9px;color:rgba(255,255,255,0.56);line-height:1.7;">' +
          '<span style="color:#60a5fa;">Stundu baze</span> — katra nostradāta stunda = 2 XP<br>' +
          '<span style="color:#c084fc;">Nakts maina</span> — katra nakts +15 XP (papildus stundam)<br>' +
          '<span style="color:#fb923c;">Diennakts maina</span> — katra 24h +25 XP<br>' +
          '<span style="color:#34d399;">Dazadiba</span> — diena + nakts + 24h: +200 XP; divas kategorijas: +80 XP<br>' +
          '<span style="color:#fbbf24;">Regularitate</span> — jo stabilak katru nedelu, jo vairak XP (max +150)<br>' +
          '<span style="color:#f472b6;">Svetku mainas</span> — katra svetku diena +30 XP<br>' +
          '<span style="color:#a3e635;">Komandas slodze</span> — virs komandas videja papildus lidz +100 XP<br>' +
          '<span style="color:#f87171;">Bolusa maina</span> — katra bolusa maina +20 XP<br>' +
        '</div>' +
        '<div style="font-size:8px;color:rgba(255,255,255,0.26);margin-top:6px;">Hover uz rindas redzams detalizets XP sadalijums</div>' +
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
        '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#c084fc;">' + (w.n12 || '-') + '</td>' +
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
          '<th style="padding:5px 8px;font-size:9px;color:#c084fc;letter-spacing:.08em;text-transform:uppercase;">12N</th>' +
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
      : (ws.isRad ? 'linear-gradient(135deg, rgba(167,139,250,0.88), rgba(124,58,237,0.78))' : 'linear-gradient(135deg, rgba(52,211,153,0.88), rgba(5,150,105,0.78))');
    return '<div style="width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;background:' + gradient + ';box-shadow:inset 0 1px 0 rgba(255,255,255,0.22), 0 12px 22px rgba(0,0,0,0.22);flex-shrink:0;">' + getInitials(ws.name) + '</div>';
  }

  function renderLeaderboardRow(ws, idx, topNightCount) {
    var ld = ws.levelData || getLevelData(0);
    var name = shortName(ws.name);
    var emoji = window.MinkaEmoji ? (window.MinkaEmoji.get(ws.name) || '') : '';
    var rank = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ('<span style="font-size:10px;color:rgba(255,255,255,0.25);">#' + (idx + 1) + '</span>');
    var live = isCurrentlyOnDuty(ws.name);
    var levelTitle = getLevelTitle(ld);
    var progressColor = ld.progress >= 85 ? '#c4ff5a' : ld.progress >= 55 ? '#b77bff' : '#60a5fa';
    var badges = renderBadges(ws, topNightCount);
    var cardGlow = idx === 0
      ? '0 0 0 1px rgba(251,191,36,0.34), 0 0 22px rgba(251,191,36,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)'
      : idx === 1
      ? '0 0 0 1px rgba(226,232,240,0.26), 0 0 18px rgba(226,232,240,0.12), inset 0 0 0 1px rgba(255,255,255,0.04)'
      : idx === 2
      ? '0 0 0 1px rgba(251,146,60,0.28), 0 0 18px rgba(251,146,60,0.14), inset 0 0 0 1px rgba(255,255,255,0.04)'
      : '0 0 0 1px rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03)';

    var b = ws.bonuses || {};
    var tooltip = [
      'Base: ' + (b.base || 0) + ' XP',
      'Nakts: +' + (b.nakts || 0),
      '24h: +' + (b.h24 || 0),
      'Dazadiba: +' + (b.diversity || 0),
      'Regularitate: +' + (b.regularity || 0),
      'Svetki: +' + (b.holidays || 0),
      'Slodze: +' + (b.load || 0),
      'Boluss: +' + (b.bolus || 0) + ' (' + (b.bolusCount || 0) + 'x)',
      'Streak: ' + (ws.longestStreak || 0) + ' dienas'
    ].join(' | ');

    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;margin-bottom:8px;background:' + (idx < 3 ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))' : 'rgba(255,255,255,0.025)') + ';cursor:default;border:1px solid rgba(255,255,255,0.06);box-shadow:' + cardGlow + ';" title="' + escapeAttr(tooltip) + '">' +
      '<div style="width:24px;text-align:center;flex-shrink:0;">' + rank + '</div>' +
      renderAvatarChip(ws, idx) +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;">' +
          '<span style="font-size:12px;font-weight:800;color:#f4f7ff;display:inline-flex;align-items:center;gap:6px;">' + name + (live ? '<span style="width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block;box-shadow:0 0 10px rgba(74,222,128,0.55);"></span>' : '') + '</span>' +
          '<span style="font-size:10px;font-weight:900;color:' + ld.current.color + ';background:rgba(255,255,255,0.06);border-radius:6px;padding:2px 6px;">Lv.' + ld.current.lvl + '</span>' +
          '<span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.64);">' + levelTitle + '</span>' +
          (emoji ? '<span style="font-size:14px;line-height:1;">' + emoji + '</span>' : '') +
          badges +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="flex:1;height:4px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;">' +
            '<div style="height:100%;width:' + ld.progress + '%;background:linear-gradient(90deg, #60a5fa 0%, #b77bff 55%, ' + progressColor + ' 100%);border-radius:999px;' + (idx < 3 ? 'box-shadow:0 0 14px ' + progressColor + '55;' : '') + '"></div>' +
          '</div>' +
          '<span style="font-size:9px;color:rgba(255,255,255,0.72);white-space:nowrap;font-weight:700;">' + ws.xp + (ld.next ? ' / ' + ld.next.xp : ' XP') + '</span>' +
        '</div>' +
        (ld.next
          ? '<div style="margin-top:5px;font-size:8px;color:rgba(255,255,255,0.34);">+' + Math.max(0, ld.next.xp - ws.xp) + ' XP lidz nakamajam LVL</div>'
          : '<div style="margin-top:5px;font-size:8px;color:rgba(255,255,255,0.34);">Maksimalais LVL sasniegts</div>') +
      '</div>' +
      '<div style="display:flex;gap:3px;flex-shrink:0;">' +
        '<div style="text-align:center;padding:2px 6px;border-radius:5px;background:rgba(251,191,36,0.1);" title="24h mainas">' +
          '<div style="font-size:10px;font-weight:800;color:#fbbf24;">' + (ws.h24 || 0) + '</div>' +
          '<div style="font-size:6.5px;color:rgba(255,255,255,0.25);">24H</div>' +
        '</div>' +
        '<div style="text-align:center;padding:2px 6px;border-radius:5px;background:rgba(167,139,250,0.1);" title="Nakts mainas">' +
          '<div style="font-size:10px;font-weight:800;color:#a78bfa;">' + (ws.nakts || 0) + '</div>' +
          '<div style="font-size:6.5px;color:rgba(255,255,255,0.25);">NAKTS</div>' +
        '</div>' +
        '<div style="text-align:center;padding:2px 6px;border-radius:5px;background:rgba(96,165,250,0.1);" title="Kopejas stundas">' +
          '<div style="font-size:10px;font-weight:800;color:#60a5fa;">' + (ws.totalHrs || 0) + '</div>' +
          '<div style="font-size:6.5px;color:rgba(255,255,255,0.25);">H</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderLeaderboardGroup(list, title, accent) {
    if (!list.length) return '';
    var topNight = list.reduce(function(max, ws) { return Math.max(max, ws.nakts || 0); }, 0);
    return '<div style="margin-bottom:12px;">' +
      '<div style="font-size:8px;font-weight:800;letter-spacing:.14em;color:' + accent + ';text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px;">' +
        '<span style="width:14px;height:1px;background:currentColor;display:inline-block;opacity:.5;"></span>' + title +
        '<span style="flex:1;height:1px;background:currentColor;opacity:.12;display:inline-block;"></span>' +
      '</div>' +
      list.map(function(item, idx) { return renderLeaderboardRow(item, idx, topNight); }).join('') +
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

      Object.keys(monthStats).forEach(function(name) {
        monthStats[name].levelData = allStats[name] ? allStats[name].levelData : getLevelData(0);
        monthStats[name].allTime = allStats[name] || null;
      });

      var rg = Object.values(monthStats).filter(function(item) { return !item.isRad; }).sort(function(a, b) { return b.totalHrs - a.totalHrs; });
      var rd = Object.values(monthStats).filter(function(item) { return item.isRad; }).sort(function(a, b) { return b.totalHrs - a.totalHrs; });

      var lbAll = Object.values(allStats).sort(function(a, b) { return b.xp - a.xp; });
      var lbRG = lbAll.filter(function(item) { return !item.isRad; });
      var lbRD = lbAll.filter(function(item) { return item.isRad; });

      var tabsHtml =
        '<div id="mk-stats-tabs" style="display:flex;gap:6px;margin-bottom:14px;">' +
          '<button id="mk-tab-month" onclick="mkStatsTab(\'month\')" style="flex:1;padding:7px 0;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.08);color:#fff;font-size:10px;font-weight:800;letter-spacing:.08em;cursor:pointer;transition:all .15s;">📅 ' + (activeMonth || 'Menesis') + '</button>' +
          '<button id="mk-tab-levels" onclick="mkStatsTab(\'levels\')" style="flex:1;padding:7px 0;border-radius:10px;border:1px solid rgba(139,92,246,0.25);background:rgba(139,92,246,0.08);color:#a78bfa;font-size:10px;font-weight:800;letter-spacing:.08em;cursor:pointer;transition:all .15s;">🏆 Leaderboard</button>' +
        '</div>';

      var monthHtml =
        '<div id="mk-pane-month">' +
          renderMonthTable(rg, '● Radiograferi', '#34d399') +
          renderMonthTable(rd, '● Radiologi', '#a78bfa') +
        '</div>';

      var levelsHtml =
        '<div id="mk-pane-levels" style="display:none;">' +
          buildInfoBox() +
          renderLeaderboardGroup(lbRG, '● Radiograferi', '#34d399') +
          renderLeaderboardGroup(lbRD, '● Radiologi', '#a78bfa') +
        '</div>';

      wrap.innerHTML = tabsHtml + monthHtml + levelsHtml;

      window.mkStatsTab = function(tab) {
        var monthPane = document.getElementById('mk-pane-month');
        var levelsPane = document.getElementById('mk-pane-levels');
        var monthBtn = document.getElementById('mk-tab-month');
        var levelsBtn = document.getElementById('mk-tab-levels');
        if (tab === 'month') {
          if (monthPane) monthPane.style.display = '';
          if (levelsPane) levelsPane.style.display = 'none';
          if (monthBtn) {
            monthBtn.style.background = 'rgba(255,255,255,0.08)';
            monthBtn.style.color = '#fff';
            monthBtn.style.borderColor = 'rgba(255,255,255,0.1)';
          }
          if (levelsBtn) {
            levelsBtn.style.background = 'rgba(139,92,246,0.08)';
            levelsBtn.style.color = '#a78bfa';
            levelsBtn.style.borderColor = 'rgba(139,92,246,0.25)';
          }
        } else {
          if (monthPane) monthPane.style.display = 'none';
          if (levelsPane) levelsPane.style.display = '';
          if (levelsBtn) {
            levelsBtn.style.background = 'rgba(139,92,246,0.22)';
            levelsBtn.style.color = '#c4b5fd';
            levelsBtn.style.borderColor = 'rgba(139,92,246,0.6)';
          }
          if (monthBtn) {
            monthBtn.style.background = 'transparent';
            monthBtn.style.color = 'rgba(255,255,255,0.3)';
            monthBtn.style.borderColor = 'rgba(255,255,255,0.06)';
          }
        }
      };
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
