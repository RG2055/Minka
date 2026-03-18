/**
 * Minka Level System v2.0
 * XP = stundas×2 + nakts×15 + 24h×25 + dažādība bonus + regularitāte + svētki + slodze attiecība
 * Tituli: Lv.1–Lv.10 (neitrāli)
 * Tikai Statistikā — nevis uz kartēm
 */
(function() {
  'use strict';

  const LEVELS = [
    { lvl:1,  xp:0,    color:'#6b7280' },
    { lvl:2,  xp:120,  color:'#6b7280' },
    { lvl:3,  xp:300,  color:'#60a5fa' },
    { lvl:4,  xp:600,  color:'#60a5fa' },
    { lvl:5,  xp:1000, color:'#a78bfa' },
    { lvl:6,  xp:1500, color:'#a78bfa' },
    { lvl:7,  xp:2200, color:'#f59e0b' },
    { lvl:8,  xp:3200, color:'#f59e0b' },
    { lvl:9,  xp:4500, color:'#ec4899' },
    { lvl:10, xp:6500, color:'#fbbf24' },
  ];

  // Latvijas svētku datumi (DD.MM formāts)
  const HOLIDAYS = new Set([
    '01.01','18.11','24.06','23.06','04.05','15.05',
    '25.12','26.12','31.12','01.05','14.06','11.11'
  ]);

  function isHoliday(dateStr) {
    // dateStr = "DD.MM.YYYY"
    var p = String(dateStr||'').split('.');
    if (p.length < 2) return false;
    return HOLIDAYS.has(p[0] + '.' + p[1]);
  }

  function getLevelData(xp) {
    var lvl = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xp) { lvl = LEVELS[i]; break; }
    }
    var next = LEVELS.find(function(l) { return l.xp > xp; }) || null;
    var progress = next ? Math.round((xp - lvl.xp) / (next.xp - lvl.xp) * 100) : 100;
    return { current: lvl, next: next, xp: xp, progress: progress };
  }

  function buildAllTimeStats() {
    var store    = window.__grafiksStore    || {};
    var storeRad = window.__grafiksStoreRad || {};

    // --- Pass 1: raw counts per worker ---
    var workers = {};

    function processStore(s, isRad) {
      Object.values(s).forEach(function(monthArr) {
        if (!Array.isArray(monthArr)) return;
        monthArr.forEach(function(day) {
          if (!day || !Array.isArray(day.workers)) return;
          day.workers.forEach(function(w) {
            if (!w.name || !w.shift) return;
            var name = w.name;
            if (!workers[name]) workers[name] = {
              name: name, isRad: isRad,
              totalHrs: 0, nakts: 0, h24: 0, diena: 0,
              holidays: 0, weeks: {}, dates: []
            };
            var hrs  = parseInt(String(w.shift||'').replace(/\D/g,'')) || 8;
            var type = String(w.type||'').toUpperCase();
            workers[name].totalHrs += hrs;
            if (type === 'NAKTS')                     workers[name].nakts++;
            else if (type === 'DIENNAKTS' || hrs>=24) workers[name].h24++;
            else                                       workers[name].diena++;
            if (w.date && isHoliday(w.date))           workers[name].holidays++;
            if (w.date) {
              workers[name].dates.push(w.date);
              // week key: ISO week from date
              var wk = getWeekKey(w.date);
              workers[name].weeks[wk] = (workers[name].weeks[wk]||0) + hrs;
            }
          });
        });
      });
    }
    processStore(store, false);
    processStore(storeRad, true);

    // --- Pass 2: XP per worker ---
    // Total hrs across all workers (for relative load)
    var groupHrsRG = 0, groupHrsRD = 0, groupCountRG = 0, groupCountRD = 0;
    Object.values(workers).forEach(function(ws) {
      if (ws.isRad) { groupHrsRD += ws.totalHrs; groupCountRD++; }
      else          { groupHrsRG += ws.totalHrs; groupCountRG++; }
    });

    Object.values(workers).forEach(function(ws) {
      var xp = 0;

      // 1. Stundas (base)
      xp += ws.totalHrs * 2;

      // 2. Nakts maiņas
      xp += ws.nakts * 15;

      // 3. 24h maiņas
      xp += ws.h24 * 25;

      // 4. Dažādība bonus — ja ir visas 3 kategorijas
      var hasAll = ws.nakts > 0 && ws.h24 > 0 && ws.diena > 0;
      var has2   = (ws.nakts > 0 && ws.h24 > 0) || (ws.nakts > 0 && ws.diena > 0) || (ws.h24 > 0 && ws.diena > 0);
      if (hasAll) xp += 200;
      else if (has2) xp += 80;

      // 5. Regularitāte — nedēļas ar maiņām / kopējās nedēļas
      var weekKeys = Object.keys(ws.weeks);
      if (weekKeys.length > 0) {
        var minWk = weekKeys.reduce(function(a,b){ return a<b?a:b; });
        var maxWk = weekKeys.reduce(function(a,b){ return a>b?a:b; });
        var totalWeeks = Math.max(1, weekDiff(minWk, maxWk) + 1);
        var activeWeeks = weekKeys.length;
        var regularity = activeWeeks / totalWeeks; // 0..1
        xp += Math.round(regularity * 150);
      }

      // 6. Svētku maiņas
      xp += ws.holidays * 30;

      // 7. Slodze attiecība pret grupu
      var groupAvg = ws.isRad
        ? (groupCountRD > 1 ? groupHrsRD / groupCountRD : ws.totalHrs)
        : (groupCountRG > 1 ? groupHrsRG / groupCountRG : ws.totalHrs);
      var ratio = groupAvg > 0 ? ws.totalHrs / groupAvg : 1;
      // bonus tikai ja virs vidējā, max +100
      if (ratio > 1) xp += Math.min(100, Math.round((ratio - 1) * 150));

      ws.xp = Math.round(xp);
      ws.levelData = getLevelData(ws.xp);

      // Bonusu breakdown priekš UI
      ws.bonuses = {
        base: ws.totalHrs * 2,
        nakts: ws.nakts * 15,
        h24: ws.h24 * 25,
        diversity: hasAll ? 200 : has2 ? 80 : 0,
        regularity: Math.round((weekKeys.length > 0 ? (Object.keys(ws.weeks).length / Math.max(1, weekDiff(
          Object.keys(ws.weeks).reduce(function(a,b){return a<b?a:b;},''),
          Object.keys(ws.weeks).reduce(function(a,b){return a>b?a:b;},'')
        ) + 1)) : 0) * 150),
        holidays: ws.holidays * 30,
        load: Math.min(100, ratio > 1 ? Math.round((ratio - 1) * 150) : 0)
      };
    });

    return workers;
  }

  function getWeekKey(dateStr) {
    var p = String(dateStr||'').split('.');
    if (p.length < 3) return '0000-00';
    var d = new Date(+p[2], +p[1]-1, +p[0]);
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-' + String(week).padStart(2,'0');
  }

  function weekDiff(wk1, wk2) {
    if (!wk1 || !wk2) return 0;
    var p1 = wk1.split('-'), p2 = wk2.split('-');
    return Math.abs((+p2[0] - +p1[0]) * 52 + (+p2[1] - +p1[1]));
  }

  // ── MONTH STATS (priekš stats modal augšdaļas) ────────────────────────────────
  function buildMonthStats(activeMonth) {
    var store    = window.__grafiksStore    || {};
    var storeRad = window.__grafiksStoreRad || {};
    var workerStats = {};

    function process(s, isRad) {
      var monthData = s[activeMonth] || [];
      for (var i = 0; i < monthData.length; i++) {
        var day = monthData[i];
        if (!day || !Array.isArray(day.workers)) continue;
        for (var j = 0; j < day.workers.length; j++) {
          var w = day.workers[j];
          if (!w.name || !w.shift) continue;
          var name = w.name;
          if (!workerStats[name]) workerStats[name] = { name, isRad, d12:0, n12:0, h24:0, h8:0, total:0, totalHrs:0 };
          var hrs = parseInt(String(w.shift||'').replace(/\D/g,'')) || 8;
          var type = String(w.type||'').toUpperCase();
          workerStats[name].totalHrs += hrs;
          workerStats[name].total++;
          if (type==='DIENNAKTS'||hrs>=24) workerStats[name].h24++;
          else if (type==='NAKTS') workerStats[name].n12++;
          else if (hrs>=12) workerStats[name].d12++;
          else workerStats[name].h8++;
        }
      }
    }
    process(store, false);
    process(storeRad, true);
    return workerStats;
  }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  window.MinkaLevels = {
    getLevelData: getLevelData,
    buildAllTimeStats: buildAllTimeStats,

    injectIntoStats: function() {
      var wrap = document.getElementById('stats-table-wrap');
      if (!wrap) return;

      var activeMonth = window.__activeMonth || '';
      var monthStats  = buildMonthStats(activeMonth);
      var allStats    = buildAllTimeStats();

      // Merge
      Object.keys(monthStats).forEach(function(name) {
        if (allStats[name]) monthStats[name].levelData = allStats[name].levelData;
        else monthStats[name].levelData = getLevelData(0);
        monthStats[name].allTime = allStats[name] || null;
      });

      var rg = Object.values(monthStats).filter(function(w){ return !w.isRad; })
                 .sort(function(a,b){ return b.totalHrs - a.totalHrs; });
      var rd = Object.values(monthStats).filter(function(w){ return w.isRad; })
                 .sort(function(a,b){ return b.totalHrs - a.totalHrs; });

      // All-time leaderboard (sorted by XP)
      var lbAll = Object.values(allStats).sort(function(a,b){ return b.xp - a.xp; });
      var lbRG  = lbAll.filter(function(w){ return !w.isRad; });
      var lbRD  = lbAll.filter(function(w){ return w.isRad; });

      function monthTable(workers, title, accent) {
        if (!workers.length) return '';
        var rows = workers.map(function(w) {
          var name = w.name.split(' ').map(function(p,i){ return i===0?p:p[0]+'.'; }).join(' ');
          var bar  = Math.min(100, Math.round(w.totalHrs / 200 * 100));
          var emoji = window.MinkaEmoji ? (window.MinkaEmoji.get(w.name)||'') : '';
          var ld = w.levelData || getLevelData(0);
          return '<tr>' +
            '<td style="padding:7px 8px;font-size:11px;font-weight:700;color:#e0e0e0;white-space:nowrap;">' +
              (emoji ? '<span style="margin-right:4px;">' + emoji + '</span>' : '') + name +
              '<span style="margin-left:5px;font-size:9px;font-weight:800;color:' + ld.current.color + ';opacity:.8;">Lv.' + ld.current.lvl + '</span>' +
            '</td>' +
            '<td style="padding:7px 8px;text-align:center;font-size:12px;font-weight:800;color:#00ff7f;">' + w.totalHrs + 'h</td>' +
            '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#60a5fa;">' + (w.d12||'-') + '</td>' +
            '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#c084fc;">' + (w.n12||'-') + '</td>' +
            '<td style="padding:7px 8px;text-align:center;font-size:11px;color:#fb923c;">' + (w.h24||'-') + '</td>' +
            '<td style="padding:7px 8px;text-align:center;font-size:11px;color:rgba(255,255,255,0.35);">' + ((w.h8||0)>0 ? w.h8 : '-') + '</td>' +
            '<td style="padding:7px 8px;min-width:70px;"><div style="height:3px;border-radius:99px;background:rgba(255,255,255,0.07);"><div style="height:100%;width:' + bar + '%;background:' + accent + ';border-radius:99px;"></div></div></td>' +
          '</tr>';
        }).join('');
        return '<div style="margin-bottom:20px;">' +
          '<div style="font-size:9px;font-weight:800;letter-spacing:.12em;color:' + accent + ';text-transform:uppercase;margin-bottom:8px;">' + title + '</div>' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.07);">' +
              '<th style="padding:5px 8px;text-align:left;font-size:9px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;">Darbinieks</th>' +
              '<th style="padding:5px 8px;font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;">Kopā</th>' +
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

      function lbRow(item, idx) {
        var ws = item, ld = ws.levelData || getLevelData(0);
        var name = ws.name.split(' ').map(function(p,i){ return i===0?p:p[0]+'.'; }).join(' ');
        var emoji = window.MinkaEmoji ? (window.MinkaEmoji.get(ws.name)||'') : '';
        var rank = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':('<span style="font-size:10px;color:rgba(255,255,255,0.25);">#'+(idx+1)+'</span>');
        var b = ws.bonuses || {};

        var tooltipParts = [
          'Base: ' + (b.base||0) + ' XP',
          'Nakts: +' + (b.nakts||0),
          '24h: +' + (b.h24||0),
          'Dažādība: +' + (b.diversity||0),
          'Regularitāte: +' + (b.regularity||0),
          'Svētki: +' + (b.holidays||0),
          'Slodze: +' + (b.load||0)
        ].join(' | ');

        return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;margin-bottom:3px;background:rgba(255,255,255,0.025);cursor:default;" title="' + tooltipParts + '">' +
          '<div style="width:22px;text-align:center;flex-shrink:0;">' + rank + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">' +
              (emoji ? '<span style="font-size:13px;">' + emoji + '</span>' : '') +
              '<span style="font-size:11px;font-weight:700;color:#dde4ff;">' + name + '</span>' +
              '<span style="font-size:9px;font-weight:800;color:' + ld.current.color + ';background:rgba(255,255,255,0.06);border-radius:4px;padding:1px 5px;">Lv.' + ld.current.lvl + '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<div style="flex:1;height:2px;border-radius:99px;background:rgba(255,255,255,0.06);">' +
                '<div style="height:100%;width:' + ld.progress + '%;background:' + ld.current.color + ';border-radius:99px;"></div>' +
              '</div>' +
              '<span style="font-size:8px;color:rgba(255,255,255,0.25);white-space:nowrap;">' + ws.xp + ' XP' + (ld.next ? ' / ' + ld.next.xp : '') + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:3px;flex-shrink:0;">' +
            '<div style="text-align:center;padding:2px 6px;border-radius:5px;background:rgba(251,191,36,0.1);" title="24h maiņas">' +
              '<div style="font-size:10px;font-weight:800;color:#fbbf24;">' + (ws.h24||0) + '</div>' +
              '<div style="font-size:6.5px;color:rgba(255,255,255,0.25);">24H</div>' +
            '</div>' +
            '<div style="text-align:center;padding:2px 6px;border-radius:5px;background:rgba(167,139,250,0.1);" title="Nakts maiņas">' +
              '<div style="font-size:10px;font-weight:800;color:#a78bfa;">' + (ws.nakts||0) + '</div>' +
              '<div style="font-size:6.5px;color:rgba(255,255,255,0.25);">NAKTS</div>' +
            '</div>' +
            '<div style="text-align:center;padding:2px 6px;border-radius:5px;background:rgba(96,165,250,0.1);" title="Kopējās stundas">' +
              '<div style="font-size:10px;font-weight:800;color:#60a5fa;">' + (ws.totalHrs||0) + '</div>' +
              '<div style="font-size:6.5px;color:rgba(255,255,255,0.25);">H</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }

      function lbGroup(list, title, accent) {
        if (!list.length) return '';
        return '<div style="margin-bottom:12px;">' +
          '<div style="font-size:8px;font-weight:800;letter-spacing:.14em;color:' + accent + ';text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px;">' +
            '<span style="width:14px;height:1px;background:currentColor;display:inline-block;opacity:.5;"></span>' + title +
            '<span style="flex:1;height:1px;background:currentColor;opacity:.12;display:inline-block;"></span>' +
          '</div>' +
          list.map(lbRow).join('') +
        '</div>';
      }

      // Tabs HTML
      var tabsHtml =
        '<div id="mk-stats-tabs" style="display:flex;gap:6px;margin-bottom:14px;">' +
          '<button id="mk-tab-month" onclick="mkStatsTab(\'month\')" style="flex:1;padding:7px 0;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.08);color:#fff;font-size:10px;font-weight:800;letter-spacing:.08em;cursor:pointer;transition:all .15s;">📅 ' + (activeMonth||'Mēnesis') + '</button>' +
          '<button id="mk-tab-levels" onclick="mkStatsTab(\'levels\')" style="flex:1;padding:7px 0;border-radius:10px;border:1px solid rgba(139,92,246,0.25);background:rgba(139,92,246,0.08);color:#a78bfa;font-size:10px;font-weight:800;letter-spacing:.08em;cursor:pointer;transition:all .15s;">🏆 Leaderboard</button>' +
        '</div>';

      var monthHtml =
        '<div id="mk-pane-month">' +
          monthTable(rg, '● Radiogāferi', '#34d399') +
          monthTable(rd, '● Radiologi', '#a78bfa') +
        '</div>';

      var levelsHtml =
        '<div id="mk-pane-levels" style="display:none;">' +
          '<div style="margin-bottom:14px;padding:10px 12px;background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.18);border-radius:10px;">' +
          '<div style="font-size:10px;font-weight:800;color:#a78bfa;margin-bottom:6px;letter-spacing:.06em;">ℹ️ KĀ TIEK SKAITĪTS LVL</div>' +
          '<div style="font-size:9px;color:rgba(255,255,255,0.5);line-height:1.7;">' +
            '<span style="color:#60a5fa;">Stundu bāze</span> — katra nostrādāta stunda = 2 XP<br>' +
            '<span style="color:#c084fc;">Nakts maiņa</span> — katrs nakts +15 XP (papildus stundām)<br>' +
            '<span style="color:#fb923c;">Diennakts maiņa</span> — katra 24h +25 XP<br>' +
            '<span style="color:#34d399;">Dažādība</span> — ja strādā dienas + nakts + 24h: +200 XP; divas kategorijas: +80 XP<br>' +
            '<span style="color:#fbbf24;">Regularitāte</span> — jo stabilāk katru nedēļu, jo vairāk XP (max +150)<br>' +
            '<span style="color:#f472b6;">Svētku maiņas</span> — katra svētku diena +30 XP<br>' +
            '<span style="color:#a3e635;">Komandas slodze</span> — ja strādā vairāk par komandas vidējo, papildus līdz +100 XP<br>' +
          '</div>' +
          '<div style="font-size:8px;color:rgba(255,255,255,0.2);margin-top:6px;">Hover uz vārda → redzams precīzs sadalījums</div>' +
        '</div>' +
          lbGroup(lbRG, '● Radiogāferi', '#34d399') +
          lbGroup(lbRD, '● Radiologi', '#a78bfa') +
        '</div>';

      wrap.innerHTML = tabsHtml + monthHtml + levelsHtml;

      window.mkStatsTab = function(tab) {
        var mp = document.getElementById('mk-pane-month');
        var lp = document.getElementById('mk-pane-levels');
        var tb = document.getElementById('mk-tab-month');
        var tl = document.getElementById('mk-tab-levels');
        if (tab === 'month') {
          if (mp) mp.style.display = '';
          if (lp) lp.style.display = 'none';
          if (tb) { tb.style.background='rgba(255,255,255,0.08)'; tb.style.color='#fff'; tb.style.borderColor='rgba(255,255,255,0.1)'; }
          if (tl) { tl.style.background='rgba(139,92,246,0.08)'; tl.style.color='#a78bfa'; tl.style.borderColor='rgba(139,92,246,0.25)'; }
        } else {
          if (mp) mp.style.display = 'none';
          if (lp) lp.style.display = '';
          if (tl) { tl.style.background='rgba(139,92,246,0.22)'; tl.style.color='#c4b5fd'; tl.style.borderColor='rgba(139,92,246,0.6)'; }
          if (tb) { tb.style.background='transparent'; tb.style.color='rgba(255,255,255,0.3)'; tb.style.borderColor='rgba(255,255,255,0.06)'; }
        }
      };
    }
  };

  // Listen for openStats postMessage from parent dock button
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'mk_open_stats') return;
    var m = document.getElementById('stats-modal');
    var isOpen = m && m.style.display !== 'none';
    if (isOpen) {
      if (window.closeStatsModal) window.closeStatsModal();
    } else {
      if (window.openStatsModal) window.openStatsModal();
    }
  });

  // ── EMOJI SECTIONS (shared with picker) ──────────────────────────────────────
  const EMOJI_SECTIONS = [
    { label: 'Medicīna',    emoji: ['🩻','💉','🏥','⚕️','🔬','💊','🩺','🩹','🧬','🫀','🧠','🦷','🩸','🧪','🔭','🫁','🧲','⚗️','🩼','🦺','🥼','🚑','🏋️','💪','🧘','🫶','💆','🛌','🩺','🏃'] },
    { label: 'Sajūtas',     emoji: ['😴','😎','🤯','💀','👻','🤖','🦾','😤','🥱','😵','🤪','🧐','😏','🥳','🫡','🥶','🥵','😈','👾','🫠','😑','🙃','😬','🫤','😒','🥺','🫂','💤','😤','💪'] },
    { label: 'Enerģija',   emoji: ['🔥','⚡','❄️','🌊','🌪️','☀️','🌙','⛈️','💥','✨','🎯','🚀','💎','🏆','⚔️','🛡️','🎲','💫','🌟','⭐','🌑','🌕','☄️','🌤️','🌧️','🌬️','🔮','🪬','🌋','🗻'] },
    { label: 'Dzīvnieki',  emoji: ['🦊','🐺','🐱','🦁','🐉','🦋','🦅','🐻','🐼','🦝','🐸','🦎','🦈','🐬','🦌','🦩','🦚','🐙','🦑','🐝','🦔','🐧','🦜','🐊','🦭','🐋','🦘','🐓','🦂','🐍'] },
    { label: 'Daba',        emoji: ['🌵','🌿','🍀','🌱','🍁','🍂','🌸','🌺','🌻','🌹','🪨','🌲','🌴','🎋','🌾','🪸','🍄','🪴','🫧','🧊','🌍','🏔️','🏕️','🌊','🏜️','🏞️','🌅','🌄','🌠','🌃'] },
    { label: 'Priekšmeti', emoji: ['☕','🍕','🎸','🎮','🏂','🤿','🧩','🪄','🎪','🎭','🎨','🎵','🎺','🥊','🎳','🎱','🏹','🔑','🧲','📡','🔦','🛠️','🪓','⛏️','🎤','🎧','📷','🏆','🎁','🃏'] },
    { label: 'Simboli',    emoji: ['💯','⚠️','🆘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔶','🔷','💠','🔺','🔻','🎯','❗','❕','✅','❌','🔒','🔓','🔑','💡','🔔','📌','🏴','🚩','⚡'] }
  ];

  window.MinkaLevels.EMOJI_SECTIONS = EMOJI_SECTIONS;

})();
