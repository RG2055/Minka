/* ================================================================
   NOGURUMA INDIKATORS — MIEGA SCENĀRIJS v13
   
   Pielāgots 12h/24h maiņu radiogrāferiem.
   
   Rāda:
   - Nedēļas slodze (stundas / norma)
   - Maiņu skaits pēdējās 7 dienās
   - Tagad dežūrā / Kopš pēdējās maiņas / Atpūta
   - Nākamā maiņa
   - Nākamā brīvdiena
   - Problēmas (ja ir: pārāk maz atpūtas utt.)
   
   FIKSĒTIE BUGI (v3):
   - "Kopš pēdējās maiņas" tagad pareizi aprēķina laiku no maiņas BEIGU laika
   - Cilvēkiem kas šobrīd strādā vairs nerāda "Maiņa beigusies pirms"
   - Alt intervāli no nākotnes maiņām vairs nekļūst par "pēdējo maiņu"
   - Konsekventi rezultāti visiem darbiniekiem ar vienādu maiņas beigu laiku
   ================================================================ */
(function FatigueIndicator() {
  'use strict';

  // Microsoft Fluent System Icons (MIT). License: assets/licenses/LICENSE-fluent-system-icons.txt
  const FLUENT_ICONS = {"clock": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3ZM9.5 5C9.74546 5 9.94961 5.17688 9.99194 5.41012L10 5.5V10H12.5C12.7761 10 13 10.2239 13 10.5C13 10.7455 12.8231 10.9496 12.5899 10.9919L12.5 11H9.5C9.25454 11 9.05039 10.8231 9.00806 10.5899L9 10.5V5.5C9 5.22386 9.22386 5 9.5 5Z\" fill=\"currentColor\"/></svg>", "calendar_ltr": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 11C7.55228 11 8 10.5523 8 10C8 9.44771 7.55228 9 7 9C6.44772 9 6 9.44771 6 10C6 10.5523 6.44772 11 7 11ZM8 13C8 13.5523 7.55228 14 7 14C6.44772 14 6 13.5523 6 13C6 12.4477 6.44772 12 7 12C7.55228 12 8 12.4477 8 13ZM10 11C10.5523 11 11 10.5523 11 10C11 9.44771 10.5523 9 10 9C9.44771 9 9 9.44771 9 10C9 10.5523 9.44771 11 10 11ZM11 13C11 13.5523 10.5523 14 10 14C9.44771 14 9 13.5523 9 13C9 12.4477 9.44771 12 10 12C10.5523 12 11 12.4477 11 13ZM13 11C13.5523 11 14 10.5523 14 10C14 9.44771 13.5523 9 13 9C12.4477 9 12 9.44771 12 10C12 10.5523 12.4477 11 13 11ZM17 5.5C17 4.11929 15.8807 3 14.5 3H5.5C4.11929 3 3 4.11929 3 5.5V14.5C3 15.8807 4.11929 17 5.5 17H14.5C15.8807 17 17 15.8807 17 14.5V5.5ZM4 7H16V14.5C16 15.3284 15.3284 16 14.5 16H5.5C4.67157 16 4 15.3284 4 14.5V7ZM5.5 4H14.5C15.3284 4 16 4.67157 16 5.5V6H4V5.5C4 4.67157 4.67157 4 5.5 4Z\" fill=\"currentColor\"/></svg>", "weather_moon": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M15.4932 13.4967C13.5653 16.8358 9.2957 17.9798 5.95663 16.052C5.20013 15.6152 4.54451 15.0515 4.01047 14.3887C6.8412 13.3015 8.56844 11.9681 9.60339 9.99249C10.651 7.99273 10.9395 5.83183 10.3628 3.08319C11.2605 3.20148 12.1328 3.49537 12.9378 3.96018C16.2769 5.88799 17.421 10.1576 15.4932 13.4967ZM5.45663 16.918C9.27399 19.122 14.1552 17.8141 16.3592 13.9967C18.5631 10.1793 17.2552 5.2981 13.4378 3.09415C12.3371 2.45863 11.1233 2.10173 9.88082 2.03507C9.4801 2.01357 9.17217 2.38477 9.26732 2.77462C9.95545 5.59395 9.70125 7.65076 8.71759 9.52844C7.78322 11.312 6.17301 12.559 3.16661 13.635C2.79667 13.7674 2.65251 14.2143 2.87537 14.538C3.54192 15.5059 4.41706 16.3178 5.45663 16.918Z\" fill=\"currentColor\"/></svg>", "weather_sunny": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10 2C10.2761 2 10.5 2.22386 10.5 2.5V3.5C10.5 3.77614 10.2761 4 10 4C9.72386 4 9.5 3.77614 9.5 3.5V2.5C9.5 2.22386 9.72386 2 10 2ZM10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14ZM10 13C8.34315 13 7 11.6569 7 10C7 8.34315 8.34315 7 10 7C11.6569 7 13 8.34315 13 10C13 11.6569 11.6569 13 10 13ZM17.5 10.5C17.7761 10.5 18 10.2761 18 10C18 9.72386 17.7761 9.5 17.5 9.5H16.5C16.2239 9.5 16 9.72386 16 10C16 10.2761 16.2239 10.5 16.5 10.5H17.5ZM10 16C10.2761 16 10.5 16.2239 10.5 16.5V17.5C10.5 17.7761 10.2761 18 10 18C9.72386 18 9.5 17.7761 9.5 17.5V16.5C9.5 16.2239 9.72386 16 10 16ZM3.5 10.5C3.77614 10.5 4 10.2761 4 10C4 9.72386 3.77614 9.5 3.5 9.5H2.46289C2.18675 9.5 1.96289 9.72386 1.96289 10C1.96289 10.2761 2.18675 10.5 2.46289 10.5H3.5ZM4.14645 4.14645C4.34171 3.95118 4.65829 3.95118 4.85355 4.14645L5.85355 5.14645C6.04882 5.34171 6.04882 5.65829 5.85355 5.85355C5.65829 6.04882 5.34171 6.04882 5.14645 5.85355L4.14645 4.85355C3.95118 4.65829 3.95118 4.34171 4.14645 4.14645ZM4.85355 15.8536C4.65829 16.0488 4.34171 16.0488 4.14645 15.8536C3.95118 15.6583 3.95118 15.3417 4.14645 15.1464L5.14645 14.1464C5.34171 13.9512 5.65829 13.9512 5.85355 14.1464C6.04882 14.3417 6.04882 14.6583 5.85355 14.8536L4.85355 15.8536ZM15.8536 4.14645C15.6583 3.95118 15.3417 3.95118 15.1464 4.14645L14.1464 5.14645C13.9512 5.34171 13.9512 5.65829 14.1464 5.85355C14.3417 6.04882 14.6583 6.04882 14.8536 5.85355L15.8536 4.85355C16.0488 4.65829 16.0488 4.34171 15.8536 4.14645ZM15.1464 15.8536C15.3417 16.0488 15.6583 16.0488 15.8536 15.8536C16.0488 15.6583 16.0488 15.3417 15.8536 15.1464L14.8536 14.1464C14.6583 13.9512 14.3417 13.9512 14.1464 14.1464C13.9512 14.3417 13.9512 14.6583 14.1464 14.8536L15.1464 15.8536Z\" fill=\"currentColor\"/></svg>", "warning": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7.37013 3.55566C8.50949 1.48158 11.4895 1.48168 12.629 3.55566L18.1251 13.5605C19.2227 15.5597 17.7759 18.0046 15.4952 18.0049H4.5039C2.22288 18.0048 0.776902 15.5598 1.87498 13.5605L7.37013 3.55566ZM11.753 4.03711C10.9934 2.65441 9.00677 2.65456 8.24709 4.03711L2.75096 14.042C2.01908 15.3748 2.98329 17.0048 4.5039 17.0049H15.4952C17.0156 17.0046 17.9798 15.3747 17.2481 14.042L11.753 4.03711ZM10 12.75C10.4142 12.7501 10.75 13.0858 10.75 13.5C10.75 13.9141 10.4141 14.2499 10 14.25C9.58587 14.25 9.2501 13.9141 9.25003 13.5C9.25003 13.0858 9.58582 12.75 10 12.75ZM10 6.5C10.2761 6.50007 10.5 6.7239 10.5 7V11C10.5 11.276 10.2761 11.4999 10 11.5C9.72394 11.5 9.50011 11.2761 9.50003 11V7C9.50003 6.72386 9.72389 6.5 10 6.5Z\" fill=\"currentColor\"/></svg>", "checkmark": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3.37371 10.1678C3.19025 9.96143 2.87421 9.94284 2.66782 10.1263C2.46143 10.3098 2.44284 10.6258 2.6263 10.8322L6.6263 15.3322C6.81743 15.5472 7.15013 15.557 7.35356 15.3536L17.8536 4.85355C18.0488 4.65829 18.0488 4.34171 17.8536 4.14645C17.6583 3.95118 17.3417 3.95118 17.1465 4.14645L7.02141 14.2715L3.37371 10.1678Z\" fill=\"currentColor\"/></svg>", "info": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10.4921 8.91012C10.4497 8.67687 10.2456 8.49999 10.0001 8.49999C9.72397 8.49999 9.50011 8.72385 9.50011 8.99999V13.5021L9.50817 13.592C9.55051 13.8253 9.75465 14.0021 10.0001 14.0021C10.2763 14.0021 10.5001 13.7783 10.5001 13.5021V8.99999L10.4921 8.91012ZM10.7988 6.74999C10.7988 6.33578 10.463 5.99999 10.0488 5.99999C9.63461 5.99999 9.29883 6.33578 9.29883 6.74999C9.29883 7.16421 9.63461 7.49999 10.0488 7.49999C10.463 7.49999 10.7988 7.16421 10.7988 6.74999ZM18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10ZM3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10Z\" fill=\"currentColor\"/></svg>", "data_line": "<svg class=\"wm-fluent-icon\" aria-hidden=\"true\" focusable=\"false\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M15.5 4C14.6716 4 14 4.67157 14 5.5C14 6.32843 14.6716 7 15.5 7C16.3284 7 17 6.32843 17 5.5C17 4.67157 16.3284 4 15.5 4ZM13 5.5C13 4.11929 14.1193 3 15.5 3C16.8807 3 18 4.11929 18 5.5C18 6.88071 16.8807 8 15.5 8C15.1663 8 14.8479 7.93463 14.5569 7.81601L13.2748 9.73925C13.7231 10.1911 14 10.8132 14 11.5C14 12.8807 12.8807 14 11.5 14C10.6487 14 9.8968 13.5745 9.44534 12.9246L6.94887 13.9945C6.98239 14.1578 7 14.3268 7 14.5C7 15.8807 5.88071 17 4.5 17C3.11929 17 2 15.8807 2 14.5C2 13.1193 3.11929 12 4.5 12C5.35132 12 6.10325 12.4255 6.55471 13.0755L9.05115 12.0056C9.01761 11.8423 9 11.6732 9 11.5C9 10.1193 10.1193 9 11.5 9C11.8337 9 12.1521 9.06537 12.4431 9.18399L13.7252 7.26075C13.2769 6.8089 13 6.18679 13 5.5ZM10 11.5C10 12.3284 10.6716 13 11.5 13C12.3284 13 13 12.3284 13 11.5C13 10.6716 12.3284 10 11.5 10C10.6716 10 10 10.6716 10 11.5ZM3 14.5C3 15.3284 3.67157 16 4.5 16C5.32843 16 6 15.3284 6 14.5C6 13.6716 5.32843 13 4.5 13C3.67157 13 3 13.6716 3 14.5Z\" fill=\"currentColor\"/></svg>"};
  const fluentIcon = name => FLUENT_ICONS[name] || FLUENT_ICONS.clock;

  const THRESHOLDS = {
    weeklyHoursWarn: 48,
    weeklyHoursCrit: 60,
    shiftsPerWeekWarn: 4,
    shiftsPerWeekCrit: 5,
    minRestHours: 11,
  };

  const FATIGUE_LEVELS = [
    { max: 20, key: 'low', label: 'Zems', level: 'ZEMS', className: 'fatigue-low', color: '#42d991' },
    { max: 45, key: 'mid', label: 'Vidējs', level: 'VIDĒJS', className: 'fatigue-moderate', color: '#e7d34b' },
    { max: 70, key: 'high', label: 'Augsts', level: 'AUGSTS', className: 'fatigue-high', color: '#ff9f43' },
    { max: 100, key: 'crit', label: 'Kritisks', level: 'KRITISKS', className: 'fatigue-critical', color: '#ff5c70' },
  ];
  const historyCache = new Map();
  const resultCache = new Map();
  const sampleCache = new Map();
  const planCache = new Map();
  const forecastCache = new Map();
  const scenarioCache = new Map();
  const sleepCache = new Map();
  let habitRaw = null;
  let nightPlanRaw = null;
  let nightPlans = {};
  let cachedGrafiksStore = null;
  let cachedGrafiksStoreRad = null;

  function clearFatigueCache() {
    historyCache.clear();
    resultCache.clear();
    sampleCache.clear();
    planCache.clear();
    forecastCache.clear();
    scenarioCache.clear();
    sleepCache.clear();
    cachedGrafiksStore = window.__grafiksStore || null;
    cachedGrafiksStoreRad = window.__grafiksStoreRad || null;
  }

  function syncFatigueCache() {
    let habits='';
    try{habits=localStorage.getItem('minkaNightStatsV1')||'';}catch(_){}
    if(habits!==habitRaw){habitRaw=habits;clearFatigueCache();}
    let raw = '';
    try { raw = localStorage.getItem('minkaNightSplitByDateV1') || ''; } catch (_) {}
    if (raw !== nightPlanRaw) {
      nightPlanRaw = raw;
      try { nightPlans = JSON.parse(raw || '{}') || {}; } catch (_) { nightPlans = {}; }
      resultCache.clear();
      sampleCache.clear();
      planCache.clear();
        forecastCache.clear();
      scenarioCache.clear();
      sleepCache.clear();
    }
    const nextGrafiks = window.__grafiksStore || null;
    const nextRadiologists = window.__grafiksStoreRad || null;
    if (nextGrafiks !== cachedGrafiksStore || nextRadiologists !== cachedGrafiksStoreRad) {
      clearFatigueCache();
    }
  }

  function getPresentation(value) {
    const score = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    const level = FATIGUE_LEVELS.find(item => score <= item.max) || FATIGUE_LEVELS[FATIGUE_LEVELS.length - 1];
    return {
      score,
      key: level.key,
      label: level.label,
      level: level.level,
      levelClass: level.className,
      color: level.color,
    };
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  UTILÄªTAS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function parseDate(dateStr) {
    const [d, m, y] = String(dateStr || '').split('.').map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }

  function normalizeDateStr(dateStr) {
    const m = String(dateStr || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return String(dateStr || '').trim();
    const dd = String(parseInt(m[1], 10)).padStart(2, '0');
    const mm = String(parseInt(m[2], 10)).padStart(2, '0');
    return dd + '.' + mm + '.' + m[3];
  }

  function shiftHours(shift) {
    const s = String(shift || '').replace(',', '.').match(/(\d+(?:\.\d+)?)/);
    return s ? Number(s[1]) : 8;
  }

  function isNightShift(type, shift, startTime) {
    const t = String(type || '').toUpperCase();
    // 24h shifts ARE exhausting and count as "heavy" (treated like night for scoring)
    if (t === 'DIENNAKTS') return true;
    if (t === 'NAKTS') return true;
    if (startTime) {
      const h = parseInt(String(startTime).split(':')[0], 10);
      if (h >= 19 || h <= 5) return true;
    }
    return false;
  }

  function shiftKind(entry) {
    if (!entry) return 'diena';
    const hrs = (typeof entry.hours === 'number') ? entry.hours : shiftHours(entry.shift);
    const t = String(entry.type || '').toUpperCase();
    if (hrs >= 24 || t === 'DIENNAKTS') return 'diennakts';
    if (t === 'NAKTS') return 'nakts';
    if (t === 'DIENA') return 'diena';
    return entry.isNight ? 'nakts' : 'diena';
  }

  function shiftKindIcon(entry) {
    const k = shiftKind(entry);
    if (k === 'nakts') return fluentIcon('weather_moon');
    if (k === 'diennakts') return fluentIcon('clock');
    return fluentIcon('weather_sunny');
  }

  //  MAIŅAS LAIKU APRĒĶINS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function getShiftStartEnd(entry) {
    if (!entry || !entry.date) return { start: null, end: null };

    const start = new Date(entry.date);
    const end = new Date(entry.date);

    if (entry.startTime && entry.endTime) {
      const [sh, sm] = String(entry.startTime).split(':').map(Number);
      const [eh, em] = String(entry.endTime).split(':').map(Number);
      start.setHours(sh || 0, sm || 0, 0, 0);
      end.setHours(eh || 0, em || 0, 0, 0);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      return { start, end };
    }

    const hrs = entry.hours || shiftHours(entry.shift);

    if (hrs >= 24 || String(entry.type || '').toUpperCase() === 'DIENNAKTS') {
      start.setHours(8, 0, 0, 0);
      end.setHours(8, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }

    if (hrs === 12) {
      if (entry.isNight) {
        start.setHours(20, 0, 0, 0);
        end.setHours(8, 0, 0, 0);
        end.setDate(end.getDate() + 1);
      } else {
        start.setHours(8, 0, 0, 0);
        end.setHours(20, 0, 0, 0);
      }
      return { start, end };
    }

    start.setHours(8, 0, 0, 0);
    end.setTime(start.getTime() + hrs * 3600000);
    return { start, end };
  }

  /**
   * DaÅ¾Äs tabulÄs nakts/24h maiÅ†as ir ierakstÄ«tas pie BEIGU datuma.
   * PiemÄ“ram: 24h diennakts 19.02â†’20.02 var bÅ«t ierakstÄ«ta pie 20.02.
   * Katrai maiÅ†ai Ä£enerÄ“jam gan "normÄlo", gan "alt" (-1 diena) intervÄlu.
   */
  function getShiftIntervals(entry) {
    if (!entry || !entry.date) return [];

    const { start, end } = getShiftStartEnd(entry);
    if (!start || !end) return [];

    const intervals = [{ start, end, alt: false, entry }];

    const hrs = entry.hours || shiftHours(entry.shift);
    const kind = shiftKind(entry);
    const crossesMidnight = (kind === 'nakts' || kind === 'diennakts' || hrs >= 24);

    if (crossesMidnight) {
      const altStart = new Date(start.getTime() - 86400000);
      const altEnd = new Date(end.getTime() - 86400000);
      if (altEnd > altStart) {
        intervals.push({ start: altStart, end: altEnd, alt: true, entry });
      }
    }

    return intervals;
  }

  function formatDateShort(dateStr) {
    const [d, m] = String(dateStr || '').split('.').map(Number);
    const months = ['janvāris','februāris','marts','aprīlis','maijs','jūnijs','jūlijs','augusts','septembris','oktobris','novembris','decembris'];
    return `${d}. ${months[(m || 1) - 1]}`;
  }

  function pluralHours(n) { return n === 1 ? '1 stunda' : n + ' stundas'; }
  function pluralDays(n) { return n === 1 ? '1 diena' : n + ' dienas'; }

  /** FormatÄ“ ilgumu stundÄs cilvÄ“kiem saprotamÄ veidÄ */
  function formatDuration(totalHours) {
    if (totalHours < 0) return '—';
    const minutes = Math.round(totalHours * 60);
    const hrs = Math.floor(minutes / 60), mins = minutes % 60;
    if (hrs < 1) return mins + ' min';
    const tail = mins ? ` ${mins} min` : '';
    if (hrs < 24) return pluralHours(hrs) + tail;
    const days = Math.floor(hrs / 24), rem = hrs % 24;
    return (rem ? `${pluralDays(days)} ${rem}h` : pluralDays(days)) + tail;
  }

  function formatRemaining(hrsFloat) {
    const mins = Math.max(0, Math.floor(hrsFloat * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return m + ' min';
    return h + 'h ' + String(m).padStart(2, '0') + 'm';
  }

  //  DATU VĀKŠANA

  function gatherWorkerHistory(workerName) {
    syncFatigueCache();
    const cacheKey = String(workerName || '').trim();
    if (historyCache.has(cacheKey)) return historyCache.get(cacheKey);
    const stores = [window.__grafiksStore, window.__grafiksStoreRad];
    const entries = [];

    for (const store of stores) {
      if (!store || typeof store !== 'object') continue;
      for (const month of Object.keys(store)) {
        const days = store[month];
        if (!Array.isArray(days)) continue;
        for (const day of days) {
          if (!day || !Array.isArray(day.workers)) continue;
          for (const w of day.workers) {
            if (w.name !== workerName) continue;
            const s = String(w.shift || '').toUpperCase().trim();
            if (s === 'N' || s.includes('A')) continue;
            const normDateStr = normalizeDateStr(day.date);
            const d = parseDate(normDateStr);
            if (!d) continue;
            const hrs = shiftHours(w.shift);
            entries.push({
              date: d, dateStr: normDateStr, shift: w.shift,
              type: (hrs >= 24 ? 'DIENNAKTS' : (w.type || '')),
              startTime: w.startTime || '', endTime: w.endTime || '',
              hours: hrs,
              isNight: isNightShift((hrs >= 24 ? 'DIENNAKTS' : (w.type || '')), w.shift, w.startTime),
            });
          }
        }
      }
    }

    // Step 1: dedup by exact dateStr+shift
    const seen = new Set();
    let unique = entries.filter(e => {
      const key = [e.dateStr, e.shift, e.startTime, e.endTime].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => a.date - b.date);

    const keep = unique;
    historyCache.set(cacheKey, keep);
    return keep;
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  DOM PALÄªGI
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function _cssEscape(v) {
    return String(v || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function _parseHHMMSS(str) {
    const m = String(str || '').trim().match(/^(\d{1,3}):(\d{2}):(\d{2})$/);
    if (!m) return null;
    return ((parseInt(m[1], 10) || 0) * 3600 + (parseInt(m[2], 10) || 0) * 60 + (parseInt(m[3], 10) || 0)) * 1000;
  }

  function _getOnDutyFromDom(workerName) {
    const sel = `.duty-timer[data-worker="${_cssEscape(workerName)}"] .val`;
    const valEl = document.querySelector(sel);
    if (!valEl) return null;
    const ms = _parseHHMMSS(valEl.textContent);
    if (ms == null || ms <= 0) return null;
    return { msLeft: ms, end: new Date(Date.now() + ms) };
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  GALVENAIS APRÄ’Ä¶INS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function _getSelectedDateStr() {
    try {
      const active = normalizeDateStr(window.__activeDateStr);
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(active)) return active;
    } catch(e) {}
    const el = document.getElementById('grafiks-dateTitle');
    const txt = (el ? el.textContent : '') || '';
    const m = txt.match(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/);
    return m ? normalizeDateStr(m[0]) : null;
  }

  const HOUR = 3600000;
  function overlapHours(start, end, from, to) {
    return Math.max(0, Math.min(+end, +to) - Math.max(+start, +from)) / HOUR;
  }

  function mergeWorkWindows(history) {
    const intervals = history.map(entry => ({...getShiftStartEnd(entry), entry}))
      .filter(iv => iv.start && iv.end && iv.end > iv.start).sort((a,b) => a.start-b.start);
    const out = [];
    for (const iv of intervals) {
      const prev = out[out.length-1];
      if (prev && iv.start < prev.end) { if (iv.end > prev.end) prev.end = iv.end; }
      else out.push({...iv});
    }
    return out;
  }

  function savedNightWindow(entry, workerName, saved) {
    if (!saved || !Array.isArray(saved.order) || saved.order.length < 2 || saved.order.length > 8) return null;
    const order = saved.order;
    if (new Set(order).size !== order.length || !order.includes(workerName)) return null;
    if (![23,23.5,0,0.5,1].includes(saved.sh) || ![0,1,2].includes(saved.ei)) return null;
    // Match the persisted team against this roster, never infer rest from a
    // dynamically fatigue-sorted default or a stale three/four-person plan.
    const team = new Map();
    for (const days of Object.values(window.__grafiksStore || {})) {
      for (const day of Array.isArray(days) ? days : []) {
        if (normalizeDateStr(day.date) !== entry.dateStr) continue;
        for (const w of day.workers || []) {
          const hrs = shiftHours(w.shift);
          const type = String(w.type || '').toUpperCase();
          const startHour = w.startTime ? parseInt(w.startTime,10) : -1;
          if (hrs >= 12 && (hrs >= 24 || type === 'NAKTS' || type === 'DIENNAKTS' || startHour >= 18 || startHour >= 0 && startHour <= 5 || startHour === -1)) team.set(w.name,w);
        }
      }
    }
    if (team.size !== order.length || order.some(name => !team.has(name))) return null;
    const start = new Date(entry.date);
    if (saved.sh < 8) start.setDate(start.getDate()+1);
    start.setHours(Math.floor(saved.sh), Math.round(saved.sh%1*60), 0, 0);
    const end = new Date(start); end.setHours(7, [20,30,60][saved.ei], 0, 0);
    if (end <= start) end.setDate(end.getDate()+1);
    // Every member must actually cover the shared night window.
    for (const w of team.values()) {
      const iv = getShiftStartEnd({...w,date:entry.date,hours:shiftHours(w.shift),isNight:isNightShift(w.type,w.shift,w.startTime)});
      if (iv.start > start || iv.end < end) return null;
    }
    // Match the night panel's wall-clock minute split, including DST nights.
    const startMinute=Math.round(saved.sh*60),endMinute=[440,450,480][saved.ei]+(saved.sh>=20?1440:0);
    const minutes = endMinute-startMinute, count = order.length, index = order.indexOf(workerName);
    const base = Math.floor(minutes/count), rem = minutes%count;
    const boundary=offset=>{const d=new Date(start);d.setMinutes(d.getMinutes()+offset);return +d;};
    const offset=index*base+Math.min(index,rem);
    const ownStart = boundary(offset);
    const ownEnd = boundary(offset+base+(index<rem?1:0));
    return {start:+start,end:+end,ownStart,ownEnd,parts:count,part:index+1};
  }

  const MODEL = Object.freeze({homeHours:8,recoveryHours:4,latencyMinutes:15});
  // Shared automatic assumptions; no worker input or stored personal settings.
  function sleepAssumptions(){ return {...MODEL}; }
  // Undated frequencies are a prior, never a fabricated saved assignment.
  // Four whole-history alternatives preserve nonlinear sleep dynamics. They
  // represent sensitivity scenarios, not statistically calibrated intervals.
  function habitHistory(history,workerName){
    let counts;
    try{counts=JSON.parse(habitRaw||'{}').data?.parts?.[workerName];}catch(_){}
    if(!Array.isArray(counts)||counts.length!==4)return null;
    counts=counts.map(n=>Number.isFinite(Number(n))?Math.min(1000000,Math.max(0,Number(n))):0);
    if(counts.reduce((a,b)=>a+b,0)<4)return null;
    const cutoff=new Date();cutoff.setHours(8,0,0,0);if(Date.now()<+cutoff)cutoff.setDate(cutoff.getDate()-1);
    const plans={};
    for(const entry of history){
      const iv=getShiftStartEnd(entry);
      if(+iv.end>+cutoff||+iv.end<+cutoff-42*24*HOUR||nightPlans[entry.dateStr])continue;
      const team=new Set();
      for(const days of Object.values(window.__grafiksStore||{}))for(const day of Array.isArray(days)?days:[]){
        if(normalizeDateStr(day.date)!==entry.dateStr)continue;
        for(const w of day.workers||[]){
          const hours=shiftHours(w.shift);
          const candidate=getShiftStartEnd({...w,date:entry.date,hours,isNight:isNightShift(w.type,w.shift,w.startTime)});
          const a=new Date(entry.date);a.setDate(a.getDate()+1);a.setHours(0,0,0,0);
          const b=new Date(a);b.setHours(7,20,0,0);
          if(hours>=12&&candidate.start<=a&&candidate.end>=b)team.add(w.name);
        }
      }
      if(![3,4].includes(team.size)||!team.has(workerName))continue;
      const order=[...team].sort();
      if(savedNightWindow(entry,workerName,{order,sh:0,ei:0}))plans[entry.dateStr]={order,sh:0,ei:0};
    }
    if(!Object.keys(plans).length)return null;
    const total=counts.reduce((a,b)=>a+b,0)+4;
    return {plans,weights:counts.map(n=>(n+1)/total)};
  }
  function sleepTimeline(history,workerName,now,overrides,scenario){
    const settings={...sleepAssumptions(workerName),...overrides};
    const work=mergeWorkWindows(history);
    const start=new Date(Math.min(+(work[0]?.start||now),+now));start.setDate(start.getDate()-21);start.setHours(7,0,0,0);
    const end=new Date(Math.max(+now,+work.at(-1)?.end||+now));end.setDate(end.getDate()+2);end.setHours(8,0,0,0);
    const key=workerName+'|'+(+start)+'|'+(+end)+'|'+JSON.stringify(settings)+'|'+JSON.stringify(scenario)+'|'+new Date().toDateString()+'|'+(new Date().getHours()>=8);
    if(sleepCache.has(key))return sleepCache.get(key);
    const inferred=settings.habitVariant===undefined?habitHistory(history,workerName):null;
    if(inferred){
      const variants=inferred.weights.map((weight,habitVariant)=>({weight,model:sleepTimeline(history,workerName,now,{...settings,habitVariant,habitPlans:inferred.plans},scenario)}));
      const exemplar=variants[0].model;
      const result={...exemplar,at(t){
        const values=variants.map(v=>({...v.model.at(t),weight:v.weight}));
        const mean=key=>values.reduce((sum,v)=>sum+v[key]*v.weight,0);
        return {...values[0],score:Math.round(mean('score')),umpScore:mean('umpScore'),dutyLoad:mean('dutyLoad'),lapses:mean('lapses'),homeostaticLapses:mean('homeostaticLapses'),circadianLapses:mean('circadianLapses'),estimatedHistoryNights:Object.keys(inferred.plans).filter(date=>+getShiftStartEnd(history.find(e=>e.dateStr===date)).end<=t).length,historyRange:[Math.min(...values.map(v=>v.score)),Math.max(...values.map(v=>v.score))]};
      }};
      sleepCache.set(key,result);if(sleepCache.size>80)sleepCache.delete(sleepCache.keys().next().value);
      return result;
    }
    const timelineScenario={...scenario,habitVariant:settings.habitVariant,habitPlans:settings.habitPlans};
    const opportunities=[],offDuty=[];
    const day=new Date(start);day.setDate(day.getDate()-1);day.setHours(23,0,0,0);
    // Shared home-sleep assumption, clipped around actual duties.
    while(day<end){const stop=new Date(day);stop.setHours(stop.getHours()+settings.homeHours);offDuty.push({start:+day,end:+stop});day.setDate(day.getDate()+1);}
    const knownDates=new Set();
    for(const iv of work){
      const pieces=dutyPieces(iv,workerName,+iv.start,+iv.end,timelineScenario);
      for(const p of pieces){if(p.rest&&settings.noSleepDutyDate!==iv.entry.dateStr)opportunities.push(p);if(p.inNight&&p.start<+now)knownDates.add(iv.entry.dateStr);}
      // A recovery opportunity starts one hour after a duty covering 02–06.
      // This is a shared modelling assumption, never a recorded sleep.
      const night=new Date(iv.start);night.setHours(2,0,0,0);let overnight=false;
      while(night<iv.end){const stop=new Date(night);stop.setHours(6,0,0,0);if(overlapHours(iv.start,iv.end,night,stop)>0)overnight=true;night.setDate(night.getDate()+1);}
      if(overnight&&settings.recoveryHours>0)offDuty.push({start:+iv.end+HOUR,end:+iv.end+(1+settings.recoveryHours)*HOUR});
    }
    for(const p of offDuty){
      let cursor=Math.max(+start,p.start),stop=Math.min(+end,p.end);
      for(const iv of work){
        if(+iv.end<=cursor)continue;if(+iv.start>=stop)break;
        if(+iv.start>cursor)opportunities.push({start:cursor,end:Math.min(stop,+iv.start)});
        cursor=Math.max(cursor,+iv.end);if(cursor>=stop)break;
      }
      if(cursor<stop)opportunities.push({start:cursor,end:stop});
    }
    const result=window.MinkaSleepModel.timeline(+start,+end,opportunities,settings.latencyMinutes);
    // Product heuristic, NOT a validated UMP/HSE extension. A separate bounded
    // duty-load reservoir prevents sleep opportunity from erasing duty exposure.
    // Parameters are explicit for later calibration against reported fatigue.
    const hybrid={ceiling:50,workTauHours:24,dutyRestTauHours:48,offDutyTauHours:8};
    const exposure=[];let cursor=+start,burden=0;
    const append=(a,b,mode)=>{
      if(b<=a)return;
      const target=mode==='work'?hybrid.ceiling:0;
      const tau=mode==='work'?hybrid.workTauHours:mode==='rest'?hybrid.dutyRestTauHours:hybrid.offDutyTauHours;
      exposure.push({start:a,end:b,initial:burden,target,tau});
      burden=target+(burden-target)*Math.exp(-(b-a)/HOUR/tau);
    };
    for(const iv of work){
      append(cursor,+iv.start,'off');
      for(const piece of dutyPieces(iv,workerName,+iv.start,+iv.end,timelineScenario))
        append(piece.start,piece.end,piece.rest&&settings.noSleepDutyDate!==iv.entry.dateStr?'rest':'work');
      cursor=+iv.end;
    }
    append(cursor,+end,'off');
    const sleepAt=result.at.bind(result);
    result.at=t=>{
      const base=sleepAt(t);
      const piece=exposure.find(p=>t>=p.start&&t<p.end)||(+t===+end?exposure.at(-1):null);
      const dutyLoad=piece?piece.target+(piece.initial-piece.target)*Math.exp(-(+t-piece.start)/HOUR/piece.tau):0;
      const score=Math.max(0,Math.min(100,Math.round(base.score+(100-base.score)*dutyLoad/100)));
      return {...base,umpScore:base.score,dutyLoad,score};
    };
    result.hybridParameters=hybrid;
    result.assumptions=settings;result.knownPlanNights=knownDates.size;
    sleepCache.set(key,result);if(sleepCache.size>80)sleepCache.delete(sleepCache.keys().next().value);
    return result;
  }
  function planTimeline(entry, workerName) {
    const key=workerName+'|'+entry.dateStr;
    if(planCache.has(key)) return planCache.get(key);
    const revisions=window.MinkaNightHistory.revisions(nightPlans[entry.dateStr]);
    const timeline=revisions.map((r,i)=>({from:r.from,to:revisions[i+1]?.from||Infinity,plan:savedNightWindow(entry,workerName,r)}));
    planCache.set(key,timeline);
    return timeline;
  }
  function dutyPieces(iv,workerName,from,to,scenario) {
    let revisions=planTimeline(iv.entry,workerName);
    if(!nightPlans[iv.entry.dateStr]&&scenario?.habitPlans?.[iv.entry.dateStr]){
      const prior=scenario.habitPlans[iv.entry.dateStr];
      const order=prior.order.filter(n=>n!==workerName);
      // Relative night position allows the four-bin habit to inform 3-person nights.
      const index=Math.min(order.length,Math.floor((scenario.habitVariant+0.5)*prior.order.length/4));
      order.splice(index,0,workerName);
      const plan=savedNightWindow(iv.entry,workerName,{...prior,order});
      if(plan)revisions=[{from:-Infinity,to:Infinity,plan}];
    }

    if(scenario&&scenario.date===iv.entry.dateStr){
      revisions=revisions.filter(r=>r.from<scenario.from).map(r=>({...r,to:Math.min(r.to,scenario.from)}));
      revisions.push({from:scenario.from,to:Infinity,plan:savedNightWindow(iv.entry,workerName,scenario.plan)});
    }
    const boundaries=[+from,+to,+iv.start+12*HOUR];
    for(const r of revisions){boundaries.push(r.from,r.to);if(r.plan)boundaries.push(r.plan.start,r.plan.end,r.plan.ownStart,r.plan.ownEnd);}
    const points=[...new Set(boundaries.filter(t=>t>=from&&t<=to))].sort((a,b)=>a-b);
    return points.slice(1).map((end,i)=>{
      const start=points[i],mid=(start+end)/2;
      const revision=revisions.find(r=>r.from<=mid&&r.to>mid),plan=revision?.plan;
      const inNight=!!plan&&mid>=plan.start&&mid<plan.end;
      const rest=inNight&&!(mid>=plan.ownStart&&mid<plan.ownEnd);
      return {start,end,rest,inNight,plan:inNight?plan:null};
    });
  }
  function calculateScheduleLoad(history, workerName, now, parameters={}, scenario=null) {
    let night=null;
    const cutoff=+now-42*24*HOUR;
    for(const iv of mergeWorkWindows(history)){
      if(+iv.start>=+now||+iv.end<=cutoff)continue;
      const start=Math.max(+iv.start,cutoff),end=Math.min(+iv.end,+now);
      const pieces=dutyPieces(iv,workerName,start,end,scenario);
      let restRun=0,workHours=0,restHours=0,longestRest=0,latest=null;
      for(const piece of pieces){
        const hours=(piece.end-piece.start)/HOUR;
        if(piece.inNight){
          latest=piece.plan;
          if(piece.rest){restHours+=hours;restRun+=hours;longestRest=Math.max(longestRest,restRun);}
          else{workHours+=hours;restRun=0;}
        }else restRun=0;
      }
      if(latest&&+now<=latest.end+24*HOUR)night={workHours,restHours,longestRestHours:longestRest,part:latest.part,parts:latest.parts};
    }
    const simulation=sleepTimeline(history,workerName,now,parameters,scenario);
    return {...simulation.at(+now),night,assumptions:simulation.assumptions,knownPlanNights:simulation.knownPlanNights};
  }
  function components(load,now){
    return {...load,raw:load.score};
  }
  function scoreAt(workerName,now,overrides){
    syncFatigueCache();
    const key=workerName+'|'+(+now);
    if(!overrides&&sampleCache.has(key))return sampleCache.get(key);
    const load=sleepTimeline(gatherWorkerHistory(workerName),workerName,now,overrides).at(+now);
    const score=components(load,now).score;
    if(!overrides){sampleCache.set(key,score);if(sampleCache.size>400)sampleCache.delete(sampleCache.keys().next().value);}
    return score;
  }
  function restWindowSummary(from,to){
    if(!from||!to||to<=from)return null;
    let nights=0,nightHours=0;
    const day=new Date(from);day.setDate(day.getDate()-1);day.setHours(22,0,0,0);
    // Describe opportunities, never assume these hours were actually slept.
    for(let i=0;i<45&&day<to;i++,day.setDate(day.getDate()+1)){
      const end=new Date(day);end.setDate(end.getDate()+1);end.setHours(8,0,0,0);
      const hours=overlapHours(day,end,from,to);nightHours+=hours;if(hours>=7)nights++;
    }
    return {hours:(to-from)/HOUR,nightHours,nights};
  }
  function forecast(workerName,entry,scenario=null){
    syncFatigueCache();
    const iv={...getShiftStartEnd(entry),entry};
    const key=workerName+'|'+(+iv.start)+'|'+(+iv.end)+'|'+JSON.stringify(scenario);
    if(forecastCache.has(key))return forecastCache.get(key);
    const pieces=dutyPieces(iv,workerName,+iv.start,+iv.end,scenario);
    const history=scenario?gatherWorkerHistory(workerName):null;
    const times=new Set([+iv.start,+iv.end]);
    for(let t=+iv.start;t<+iv.end;t+=30*60000)times.add(t);
    pieces.forEach(p=>{times.add(p.start);times.add(p.end);});
    let peak={score:-1,time:+iv.start},ownPeak=null;
    const samples=[];
    for(const t of [...times].sort((a,b)=>a-b)){
      const score=scenario?sleepTimeline(history,workerName,new Date(t),{},scenario).at(t).score:scoreAt(workerName,new Date(t));
      samples.push({time:t,score});
      if(score>peak.score)peak={score,time:t};
      const own=pieces.some(p=>p.inNight&&!p.rest&&t>=p.start&&t<=p.end);
      if(own&&(!ownPeak||score>ownPeak.score))ownPeak={score,time:t};
    }
    const nightPieces=pieces.filter(p=>p.inNight);
    let run=0,longest=0;
    for(const p of pieces){run=p.inNight&&p.rest?run+(p.end-p.start)/HOUR:0;longest=Math.max(longest,run);}
    const own=nightPieces.filter(p=>!p.rest),first=own[0],last=own[own.length-1];
    const before=first?nightPieces.filter(p=>p.rest&&p.end<=first.start).reduce((n,p)=>n+(p.end-p.start)/HOUR,0):0;
    const after=last?nightPieces.filter(p=>p.rest&&p.start>=last.end).reduce((n,p)=>n+(p.end-p.start)/HOUR,0):0;
    const previous=mergeWorkWindows(gatherWorkerHistory(workerName)).filter(p=>p.end<=iv.start).at(-1);
    const nightBands=[];
    const day=new Date(iv.start);day.setHours(2,0,0,0);
    while(day<iv.end){
      const end=new Date(day);end.setHours(6,0,0,0);
      const start=Math.max(+iv.start,+day),stop=Math.min(+iv.end,+end);
      if(stop>start)nightBands.push({start,end:stop});
      day.setDate(day.getDate()+1);
    }
    const earlyNightWorkHours=pieces.filter(p=>!p.rest).reduce((sum,p)=>sum+nightBands.reduce((n,b)=>n+Math.max(0,Math.min(p.end,b.end)-Math.max(p.start,b.start))/HOUR,0),0);
    // A second, explicitly hypothetical case: no sleep in this duty. Earlier
    // duty/home assumptions stay identical; this is not a confidence interval.
    const noSleepModel=nightPieces.length?sleepTimeline(gatherWorkerHistory(workerName),workerName,iv.end,{noSleepDutyDate:entry.dateStr},scenario):null;
    const noSleepSamples=noSleepModel?samples.map(s=>({time:s.time,score:noSleepModel.at(s.time).score})):null;
    const result={samples,noSleepSamples,noSleepEndScore:noSleepSamples?.at(-1).score??null,nightBands,restBands:pieces.filter(p=>p.rest).map(p=>({start:p.start,end:p.end})),earlyNightWorkHours,startScore:samples[0].score,endScore:samples.at(-1).score,peak,ownPeak,restBeforeHours:before,restAfterHours:after,longestRestHours:longest,hasNightPlan:nightPieces.length>0,nightParts:nightPieces.at(-1)?.plan?.parts??null,between:restWindowSummary(previous?.end,iv.start)};
    forecastCache.set(key,result);if(forecastCache.size>60)forecastCache.delete(forecastCache.keys().next().value);
    return result;
  }

  // Read-only alternatives: use the actual night panel's settings and team.
  // A hypothetical change takes effect now; already elapsed work is preserved.
  function nightScenarios(workerName,entry,now=new Date()) {
    syncFatigueCache();
    const live=window.__ns?.getPlan?.();
    const saved=nightPlans[entry.dateStr];
    const candidate=live?.date===entry.dateStr?{order:live.segments.map(s=>s.name),sh:live.sh,ei:live.ei}:saved;
    const shape=window.MinkaNightHistory.shape(candidate);
    const actual=shape&&savedNightWindow(entry,workerName,shape);
    if(!actual||+now>=actual.end)return null;
    const key=workerName+'|'+entry.dateStr+'|'+JSON.stringify(shape)+'|'+Math.floor(+now/60000)+'|'+shape.order.map((_,i)=>{
      const order=shape.order.filter(n=>n!==workerName);order.splice(i,0,workerName);
      return savedNightWindow(entry,workerName,{...shape,order}).ownStart<=+now;
    }).join(',');
    if(scenarioCache.has(key))return scenarioCache.get(key);
    const history=gatherWorkerHistory(workerName),shift=getShiftStartEnd(entry);
    const options=shape.order.map((_,i)=>{
      const order=shape.order.filter(n=>n!==workerName);order.splice(i,0,workerName);
      const plan={...shape,order},window=savedNightWindow(entry,workerName,plan);
      const selected=actual.part===i+1;
      if(window.ownStart<+now&&!selected)return {part:i+1,start:window.ownStart,end:window.ownEnd,unavailable:true,selected:false};
      const scenario={date:entry.dateStr,from:+now,plan};
      const sample=t=>sleepTimeline(history,workerName,new Date(t),{},scenario).at(t).score;
      const simulation=sleepTimeline(history,workerName,shift.end,{},scenario);
      const sleep=simulation.sleep.map(p=>({start:Math.max(p.start,window.start),end:Math.min(p.end,window.end)})).filter(p=>p.end>p.start);
      return {part:i+1,start:window.ownStart,end:window.ownEnd,selected,unavailable:window.ownEnd<=+now,endScore:sample(window.ownEnd),shiftEndScore:sample(+shift.end),sleep};
    });
    // The headline and curve use exactly the selected alternative's assumptions.
    // Draft plans only affect the future preview, never the live/history score.
    const projection=forecast(workerName,entry,{date:entry.dateStr,from:+now,plan:shape});
    const result={options,projection,saved:!!saved&&window.MinkaNightHistory.shape(saved)&&JSON.stringify(shape)===JSON.stringify(window.MinkaNightHistory.shape(saved)),date:entry.dateStr};
    scenarioCache.set(key,result);if(scenarioCache.size>80)scenarioCache.delete(scenarioCache.keys().next().value);
    return result;
  }

  function calculateFatigue(workerName) {
    syncFatigueCache();
    const requestedDateStr = _getSelectedDateStr() || '';
    // A past or future view below replaces `now` with a time simulated from the
    // selected shift and never reads the live duty timer, so its score cannot
    // change until the calendar day itself rolls over. Only today's view has to
    // expire with the clock. Bucketing every date by 30 seconds meant that
    // stepping back onto a day that was already on screen recomputed the whole
    // score for every person again — the single most expensive piece of a day
    // switch on a slow machine.
    const clock = new Date();
    const todayStr = [
      String(clock.getDate()).padStart(2, '0'),
      String(clock.getMonth() + 1).padStart(2, '0'),
      clock.getFullYear()
    ].join('.');
    const rosterDay = new Date(clock);
    if (rosterDay.getHours() < 8) rosterDay.setDate(rosterDay.getDate() - 1);
    const rosterStr = [String(rosterDay.getDate()).padStart(2, '0'), String(rosterDay.getMonth()+1).padStart(2, '0'), rosterDay.getFullYear()].join('.');
    const isLiveView = requestedDateStr === todayStr || requestedDateStr === rosterStr;
    const timeBucket = isLiveView
      ? Math.floor(clock.getTime() / 30000)
      : todayStr;
    const cacheKey = [String(workerName || '').trim(), requestedDateStr, timeBucket].join('|');
    if (resultCache.has(cacheKey)) return resultCache.get(cacheKey);
    const history = gatherWorkerHistory(workerName);
    if (!history.length) return null;

    const realNow = new Date();
    let now = realNow;
    const today = new Date(realNow.getFullYear(), realNow.getMonth(), realNow.getDate());

    // â”€â”€ SkatÄ«juma konteksts â”€â”€
    const selectedDateStr = _getSelectedDateStr();
    const selectedDate = selectedDateStr ? parseDate(selectedDateStr) : null;
    let viewMode = 'today';
    if (selectedDate && selectedDate.getTime() > today.getTime()) viewMode = 'future';
    else if (selectedDate && selectedDate.getTime() < today.getTime() && !isLiveView) viewMode = 'past';

    // NÄkotnes/pagÄtnes skatÄ«jumÄ: simulÄ“ now = izvÄ“lÄ“tÄs maiÅ†as sÄkums
    // Tas Ä¼auj aprÄ“ÄinÄt "cik noguris bija/bÅ«s darbinieks TAJÄ€ dienÄ"
    if ((viewMode === 'future' || viewMode === 'past') && selectedDate) {
      const targetEntry = history.find(function(e) { return e.dateStr === selectedDateStr; });
      if (targetEntry) {
        const tse = getShiftStartEnd(targetEntry);
        now = tse.start || new Date(selectedDate.getTime() + 8 * 3600000);
      } else {
        now = new Date(selectedDate.getTime() + 8 * 3600000);
      }
    }

    let selectedShiftEntry = null;
    if (selectedDateStr) {
      selectedShiftEntry = history.find(e => e.dateStr === selectedDateStr) || null;
    }
    let selectedShift = null;
    if (selectedShiftEntry) {
      const { start, end } = getShiftStartEnd(selectedShiftEntry);
      if (start && end) selectedShift = { entry: selectedShiftEntry, start, end };
    }

    // â”€â”€ Visi intervÄli â”€â”€
    const allIntervals = [];
    for (const e of history) {
      for (const iv of getShiftIntervals(e)) {
        if (iv && iv.start && iv.end) {
          allIntervals.push(iv);
        }
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  1) "TAGAD DEÅ½ÅªRÄ€"
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Dzīvo DOM dežūras taimeri lieto TIKAI šodienas skatā — tas atspoguļo
    // reālo tagad. Pagātnes/nākotnes skatā tas nepareizi "pieliptu" citai
    // dienai; tur dežūru nosakām pēc simulētā `now` un intervāliem.
    const domDuty = (viewMode === 'today') ? _getOnDutyFromDom(workerName) : null;

    // MeklÄ“jam intervÄlu kurÄ iekrÄ«t NOW
    let currentInterval = null;
    for (const iv of allIntervals) {
      if (now >= iv.start && now < iv.end) {
        // Alt intervāls no NĀKOTNES ieraksta nav īsta aktīva dežūra.
        // (24h maiņas alt sniedzas dienu atpakaļ; rītdienas maiņa nedrīkst
        //  padarīt cilvēku "dežūrā" šodien.) Tāds pats fikss kā 2./score sekcijās.
        if (iv.alt) {
          const ps = getShiftStartEnd(iv.entry);
          if (ps.start && ps.start > now) continue;
        }
        if (!currentInterval || iv.end > currentInterval.end) {
          currentInterval = iv;
        }
      }
    }

    let onDuty = false;
    let currentShift = null;
    let currentShiftEnd = null;
    let hoursToShiftEnd = -1;

    if (domDuty && domDuty.msLeft > 0) {
      // DOM timer saka â€” cilvÄ“ks ir deÅ¾Å«rÄ
      onDuty = true;
      currentShiftEnd = domDuty.end;
      hoursToShiftEnd = Math.max(0, domDuty.msLeft / 3600000);

      let best = null, bestDiff = Infinity;
      for (const iv of allIntervals) {
        const diff = Math.abs(iv.end - currentShiftEnd);
        if (diff < bestDiff) { bestDiff = diff; best = iv; }
      }
      if (best && bestDiff <= 30 * 60 * 1000) {
        currentShift = best.entry;
        // A countdown is rounded and may be stale. The roster owns the end time.
        currentShiftEnd = best.end;
        hoursToShiftEnd = Math.max(0, (best.end - now) / HOUR);
        currentInterval = best; // SaglabÄjam lai izslÄ“gtu no "pÄ“dÄ“jÄs maiÅ†as"
      } else {
        currentShift = { hours: (hoursToShiftEnd > 12 ? 24 : 12), type: (hoursToShiftEnd > 12 ? 'DIENNAKTS' : 'NAKTS'), isNight: (hoursToShiftEnd <= 12) };
      }
    } else if (currentInterval) {
      onDuty = true;
      currentShift = currentInterval.entry;
      currentShiftEnd = currentInterval.end;
      hoursToShiftEnd = Math.max(0, (currentShiftEnd - now) / 3600000);
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  2) PÄ’DÄ’JÄ€ PABEIGTÄ€ MAIÅ…A
    //     SVARÄªGI: meklÄ“jam pÄ“c BEIGU LAIKA, nevis datuma!
    //     Ja cilvÄ“ks tagad ir deÅ¾Å«rÄ â€” Å¡o maiÅ†u IZSLÄ’DZAM.
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let lastShift = null;
    let lastShiftEnd = null;
    let hoursSinceLastShift = -1;

    let bestLastEnd = null;
    let bestLastEntry = null;

    for (const iv of allIntervals) {
      // IntervÄls jau beidzies
      if (iv.end > now) continue;

      // Ja cilvÄ“ks ir deÅ¾Å«rÄ â€” nedrÄ«kst Å†emt AKTÄªVO maiÅ†u kÄ "pÄ“dÄ“jo beidzies"
      if (onDuty && currentInterval) {
        // PÄrbaudÄm vai Å¡is ir tas pats entry kÄ aktÄ«vais
        if (iv.entry === currentInterval.entry) continue;
      }

      // Alt intervÄls no NÄ€KOTNES ieraksta â€” ignorÄ“jam
      // (piemÄ“ram, rÄ«t ir 24h maiÅ†a, tÄs alt beidzas Å¡odien â€” bet tÄ nav "pÄ“dÄ“jÄ maiÅ†a")
      if (iv.alt) {
        const primarySE = getShiftStartEnd(iv.entry);
        if (primarySE.start && primarySE.start > now) continue;
      }

      if (!bestLastEnd || iv.end > bestLastEnd) {
        bestLastEnd = iv.end;
        bestLastEntry = iv.entry;
      }
    }

    if (bestLastEnd && bestLastEntry) {
      lastShift = bestLastEntry;
      lastShiftEnd = bestLastEnd;
      hoursSinceLastShift = Math.max(0, (now - lastShiftEnd) / 3600000);
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  3) NÄ€KAMÄ€ MAIÅ…A
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let nextShift = null;
    let nextShiftStart = null;

    for (const iv of allIntervals) {
      if (iv.alt) continue;
      if (iv.start > now) {
        if (!nextShiftStart || iv.start < nextShiftStart) {
          nextShiftStart = iv.start;
          nextShift = iv.entry;
        }
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  4) NEDÄ’Ä»AS STATISTIKA
    //     Ja skatÄmies nÄkotni/pagÄtni, rÄ“ÄinÄm nedÄ“Ä¼u
    //     ap IZVÄ’LÄ’TO datumu, nevis Å¡odienu.
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // "Konteksta diena" â€” datums, kuru lietotÄjs skatÄs
    const contextDay = (selectedDate && (viewMode === 'future' || viewMode === 'past'))
      ? selectedDate
      : today;

    // Ritošs 7 dienu logs, kas beidzas pie `now` (novērtējuma brīža), NEVIS
    // kalendārā Pr–Sv nedēļa. Kalendārā nedēļa pirmdienā nullējas, tāpēc smags
    // Pk–Sv tika ignorēts — ritošais logs godīgi rāda pēdējās 7×24h slodzi.
    void contextDay;
    const weekEndTs = now.getTime();
    const weekStartTs = weekEndTs - 7 * 86400000;
    const recentShifts = history.filter(e => {
      const se = getShiftStartEnd(e);
      const t = (se.start || e.date).getTime();
      return se.end && se.end.getTime() > weekStartTs && t < weekEndTs;
    });
    const workWindows = mergeWorkWindows(history);
    const weeklyHours = Math.round(workWindows.reduce((sum, iv) => sum + overlapHours(iv.start, iv.end, weekStartTs, weekEndTs), 0) * 100) / 100;
    const shiftsThisWeek = recentShifts.length;
    // TĪRĀS nakts maiņas (12h nakts) — 24h/diennakts ir atsevišķa kategorija un
    // tām ir savs sods, citādi viena diennakts tiktu sodīta gan kā nakts, gan kā 24h.
    const is24h = (e) => (e.hours >= 24) || String(e.type || '').toUpperCase() === 'DIENNAKTS';
    const nightShiftsThisWeek = recentShifts.filter(e => e.isNight && !is24h(e)).length;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  5) ATPÅªTAS PÄ€RBAUDE
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let shortRests = 0;
    let minRestHours = Infinity;
    for (let i = 1; i < workWindows.length; i++) {
      const prev = workWindows[i-1], curr = workWindows[i];
      if (+curr.start < weekStartTs || +curr.start > weekEndTs) continue;
      const restHrs = (curr.start-prev.end)/HOUR;
      if (restHrs >= 0 && restHrs < minRestHours) minRestHours = restHrs;
      if (restHrs >= 0 && restHrs < THRESHOLDS.minRestHours) shortRests++;
    }
    if (minRestHours === Infinity) minRestHours = -1;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  6) NÄ€KAMÄ€ BRÄªVDIENA
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let nextDayOff = null;
    const dayOffBase = selectedDate && viewMode !== 'today' ? selectedDate : today;
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(dayOffBase);
      checkDate.setDate(checkDate.getDate() + i);
      const endDate = new Date(checkDate); endDate.setDate(endDate.getDate() + 1);
      // No entry outside the loaded roster does not establish a day off.
      const key = [String(checkDate.getDate()).padStart(2,'0'), String(checkDate.getMonth()+1).padStart(2,'0'), checkDate.getFullYear()].join('.');
      const covered = [window.__grafiksStore, window.__grafiksStoreRad].some(store =>
        Object.values(store || {}).some(days => Array.isArray(days) && days.some(day => normalizeDateStr(day.date) === key)));
      if (!covered) continue;
      if (!workWindows.some(iv => iv.start < endDate && iv.end > checkDate)) { nextDayOff = checkDate; break; }
    }




    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  SCORE v8 â€” AtpÅ«ta AP Å ODIENU (ne pÄ“dÄ“jÄ maiÅ†a periodÄ)
    //
    //  LoÄ£ika:
    //   1) Atrodam pÄ“dÄ“jo PABEIGTO maiÅ†u (pirms now)
    //   2) AprÄ“ÄinÄm atpÅ«tu no tÄs beigÄm lÄ«dz now (vai nÄkamÄs maiÅ†as sÄkumam)
    //   3) Score balstÄs uz Å¡o atpÅ«tu
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // Published UMP dynamics with explicitly assumed sleep opportunities.
    // The display index is a product mapping, not measured sleepiness or probability.
    const load = calculateScheduleLoad(history, workerName, now);
    const scoreReasons = [];
    const detail=components(load,now);
    const rawScore=detail.raw,score=detail.score;
    scoreReasons.push({type:'info', text:'UMP prognozētās lēnās reakcijas', pts:detail.lapses.toFixed(1)});
    scoreReasons.push({type:'info', text:'Miega un nomoda ietekme', pts:detail.homeostaticLapses.toFixed(1)});
    scoreReasons.push({type:'info', text:'Diennakts ritma ietekme', pts:(detail.circadianLapses>=0?'+':'')+detail.circadianLapses.toFixed(1)});
    if (load.night) {
      const n = load.night;
      scoreReasons.push({type:'info', text:'Līdz šim nakts plānā: ' + formatDuration(n.workHours) + ' darbam un ' + formatDuration(n.restHours) + ' atpūtai. Bez pārtraukuma — līdz ' + formatDuration(n.longestRestHours) + '. Tas nenozīmē, ka šis laiks nogulēts.', pts:''});
    }
    if (rawScore > 100) scoreReasons.push({type:'info', text:'Skala beidzas pie 100', pts:String(100 - rawScore)});
    scoreReasons.push({type:'info', text:'Skaitlis ir aprēķināts pēc grafika. Lietotne nezina, cik patiesībā gulēts un vai atpūtu pārtrauca darbs.', pts:''});

    const presentation = getPresentation(score);
    const result = {
      workerName, nightRest: load.night, modelVersion: 15, sleepModel:load,
      score, level: presentation.level, levelClass: presentation.levelClass, scoreReasons,
      weeklyHours, shiftsThisWeek, nightShiftsThisWeek,
      lastShift, lastShiftEnd, hoursSinceLastShift,
      onDuty, currentShift, currentShiftEnd, hoursToShiftEnd,
      shortRests, minRestHours,
      nextShift, nextDayOff, recentShifts,
      viewMode, selectedDateStr, selectedShift, evaluatedAt: +now,
      contextLabel: viewMode !== 'today' ? 'Prognoze maiņas sākumā' : 'Tagad',
    };
    resultCache.set(cacheKey, result);
    if (resultCache.size > 200) {
      const oldestKey = resultCache.keys().next().value;
      resultCache.delete(oldestKey);
    }
    return result;
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  UI KOMPONENTES
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  TENDENCES GRAFIKS (28 dienas)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  TENDENCES GRAFIKS v2 â€” smooth bezier + interactive tooltip
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function createTendencyChart(fatigue) {
    if (!fatigue || !fatigue.workerName) return '';
    const history = gatherWorkerHistory(fatigue.workerName);
    if (!history || history.length < 2) return '';

    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = 28;
    const startDate = new Date(todayMid);
    startDate.setDate(startDate.getDate() - days + 1);

    const dailyData = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const sample = new Date(d); sample.setHours(8,0,0,0);
      const sc = scoreAt(fatigue.workerName, sample);

      const dayShift = history.find(e =>
        e.date.getFullYear() === d.getFullYear() &&
        e.date.getMonth() === d.getMonth() &&
        e.date.getDate() === d.getDate()
      );
      dailyData.push({
        date: d, score: sc, shift: dayShift || null,
        label: `${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')}`
      });
    }

    const W = 340, H = 100;
    const padL = 28, padR = 8, padT = 10, padB = 24;
    const gW = W - padL - padR, gH = H - padT - padB;
    const xp = (i) => padL + (i / (days - 1)) * gW;
    const yp = (sc) => padT + gH - (sc / 100) * gH;

    // Smooth bezier path
    function bezierPath(pts) {
      if (!pts.length) return '';
      let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i-1], c = pts[i];
        const cx = (p.x + c.x) / 2;
        d += ` C ${cx.toFixed(1)},${p.y.toFixed(1)} ${cx.toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
      }
      return d;
    }
    const pts = dailyData.map((d, i) => ({ x: xp(i), y: yp(d.score) }));
    const linePath = bezierPath(pts);
    const areaPath = linePath + ` L ${xp(days-1).toFixed(1)},${(padT+gH).toFixed(1)} L ${xp(0).toFixed(1)},${(padT+gH).toFixed(1)} Z`;

    const weekLines = [];
    for (let i = 1; i < days; i++) {
      if (dailyData[i].date.getDay() === 1)
        weekLines.push(`<line x1="${xp(i).toFixed(1)}" y1="${padT}" x2="${xp(i).toFixed(1)}" y2="${padT+gH}" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="2 3"/>`);
    }

    const shiftDots = dailyData.map((d, i) => {
      if (!d.shift) return '';
      const kind = shiftKind(d.shift);
      const col = kind === 'nakts' ? 'rgba(92,154,255,0.85)' : kind === 'diennakts' ? 'rgba(183,123,255,0.85)' : 'rgba(255,160,50,0.8)';
      return `<circle cx="${xp(i).toFixed(1)}" cy="${(padT+gH+9).toFixed(1)}" r="2.5" fill="${col}"/>`;
    }).join('');

    const peakDots = dailyData.map((d, i) => {
      if (d.score < 25 || !d.shift) return '';
      const col = d.score >= 75 ? 'rgba(255,61,90,0.9)' : d.score >= 50 ? 'rgba(255,140,66,0.85)' : 'rgba(245,197,24,0.7)';
      const glow = d.score >= 75 ? '#ff3d5a' : d.score >= 50 ? '#ff8c42' : '#f5c518';
      const r = d.score >= 70 ? 3 : 2.5;
      // No drop-shadow filter — SVG filters re-rasterize and are heavy on iGPUs;
      // a soft halo ring gives the same accent for free.
      return `<circle cx="${xp(i).toFixed(1)}" cy="${yp(d.score).toFixed(1)}" r="${r + 2}" fill="${glow}" opacity="0.22"/>`
        + `<circle cx="${xp(i).toFixed(1)}" cy="${yp(d.score).toFixed(1)}" r="${r}" fill="${col}"/>`;
    }).join('');

    const todayX = xp(days - 1).toFixed(1);
    const startStr = `${startDate.getDate()}.${String(startDate.getMonth()+1).padStart(2,'0')}`;
    const endStr = `${todayMid.getDate()}.${String(todayMid.getMonth()+1).padStart(2,'0')}`;

    const firstWeekAvg = dailyData.slice(0, 7).reduce((s, d) => s + d.score, 0) / 7;
    const lastWeekAvg = dailyData.slice(-7).reduce((s, d) => s + d.score, 0) / 7;
    const diff = lastWeekAvg - firstWeekAvg;
    let trendText = '', trendClass = '';
    if (diff > 8) { trendText = '↗ Nogurums pieaug'; trendClass = 'fatigue-trend-up'; }
    else if (diff < -8) { trendText = '↘ Nogurums samazinās'; trendClass = 'fatigue-trend-down'; }
    else { trendText = '→ Nogurums būtiski nemainās'; trendClass = 'fatigue-trend-stable'; }

    const dataAttr = encodeURIComponent(JSON.stringify(dailyData.map(d => ({
      s: d.score, l: d.label, k: d.shift ? shiftKind(d.shift) : null
    }))));

    return `
    <div class="fatigue-tendency">
      <div class="fatigue-tendency-header">
        <span class="fatigue-tendency-title">TENDENCE — 08:00</span>
        <span class="fatigue-tendency-period">${startStr} — ${endStr}</span>
      </div>
      <div class="fatigue-tendency-chart" data-chart="${dataAttr}">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px">
          <defs>
            <linearGradient id="ftLineGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#00e67a"/>
              <stop offset="35%" stop-color="#f5c518"/>
              <stop offset="65%" stop-color="#ff8c42"/>
              <stop offset="100%" stop-color="#ff3d5a"/>
            </linearGradient>
            <linearGradient id="ftAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(255,140,66,0.13)"/>
              <stop offset="100%" stop-color="rgba(255,140,66,0)"/>
            </linearGradient>
          </defs>
          <rect x="${padL}" y="${padT}" width="${gW}" height="${gH*.25}" fill="rgba(255,50,50,0.04)"/>
          <rect x="${padL}" y="${padT+gH*.25}" width="${gW}" height="${gH*.25}" fill="rgba(255,140,50,0.03)"/>
          <rect x="${padL}" y="${padT+gH*.5}" width="${gW}" height="${gH*.25}" fill="rgba(245,197,24,0.025)"/>
          <rect x="${padL}" y="${padT+gH*.75}" width="${gW}" height="${gH*.25}" fill="rgba(0,230,122,0.025)"/>
          <line x1="${padL}" y1="${yp(75).toFixed(1)}" x2="${padL+gW}" y2="${yp(75).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" stroke-dasharray="3 4"/>
          <line x1="${padL}" y1="${yp(50).toFixed(1)}" x2="${padL+gW}" y2="${yp(50).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" stroke-dasharray="3 4"/>
          <line x1="${padL}" y1="${yp(25).toFixed(1)}" x2="${padL+gW}" y2="${yp(25).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" stroke-dasharray="3 4"/>
          <text x="${padL-4}" y="${(yp(100)+4).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,0.18)" font-size="7">100</text>
          <text x="${padL-4}" y="${(yp(75)+3).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,0.18)" font-size="7">75</text>
          <text x="${padL-4}" y="${(yp(50)+3).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,0.18)" font-size="7">50</text>
          <text x="${padL-4}" y="${(yp(25)+3).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,0.18)" font-size="7">25</text>
          ${weekLines.join('')}
          <path d="${areaPath}" fill="url(#ftAreaGrad)"/>
          <path d="${linePath}" fill="none" stroke="url(#ftLineGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.15"/>
          <path d="${linePath}" fill="none" stroke="url(#ftLineGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          ${peakDots}
          <line x1="${todayX}" y1="${padT}" x2="${todayX}" y2="${padT+gH}" stroke="rgba(0,230,122,0.35)" stroke-width="1" stroke-dasharray="2 3"/>
          ${shiftDots}
          <rect class="ft-hover" x="${padL}" y="${padT}" width="${gW}" height="${gH+12}" fill="transparent" style="cursor:crosshair"/>
        </svg>
      </div>
      <div class="fatigue-tendency-legend">
        <span class="fatigue-tendency-dot" style="background:rgba(255,160,50,0.8)"></span><span>☀️ Diena</span>
        <span class="fatigue-tendency-dot" style="background:rgba(92,154,255,0.8)"></span><span>🌙 Nakts</span>
        <span class="fatigue-tendency-dot" style="background:rgba(183,123,255,0.8)"></span><span>🕛 Diennakts</span>
      </div>
      <div class="fatigue-tendency-trend ${trendClass}">${trendText}</div>
    </div>`;
  }

  // â”€â”€ Tooltip binding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let _tt = null;
  function bindChartTooltips() {
    document.querySelectorAll('.fatigue-tendency-chart:not([data-tt])').forEach(chartEl => {
      chartEl.setAttribute('data-tt','1');
      let data;
      try { data = JSON.parse(decodeURIComponent(chartEl.getAttribute('data-chart') || '')); } catch(e) { return; }
      const svg = chartEl.querySelector('svg');
      const hover = chartEl.querySelector('.ft-hover');
      if (!hover || !svg) return;
      const days = data.length;
      const padL = 28, padR = 8, W = 340;

      function idx(cx) {
        const r = svg.getBoundingClientRect();
        const xn = (cx - r.left - (padL/W)*r.width) / ((W-padL-padR)/W*r.width);
        return Math.max(0, Math.min(days-1, Math.round(xn*(days-1))));
      }

      function tip(e) {
        if (!_tt) { _tt = document.createElement('div'); _tt.className='ft-tooltip'; document.body.appendChild(_tt); }
        const d = data[idx(e.clientX)];
        if (!d) return;
        const col = d.s>=75?'#ff3d5a':d.s>=50?'#ff8c42':d.s>=25?'#f5c518':'#00e67a';
        const shift = d.k ? (d.k === 'nakts' ? '🌙 Nakts maiņa' : d.k === 'diennakts' ? '🕛 Diennakts' : '☀️ Dienas maiņa') : '— Brīvdiena';
        _tt.innerHTML = `<div class="ft-tt-date">${d.l}</div><div class="ft-tt-score" style="color:${col}">${d.s}<span>/100</span></div><div class="ft-tt-shift">${shift}</div>`;
        _tt.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
        _tt.classList.add('visible');
      }
      hover.addEventListener('mousemove', tip);
      hover.addEventListener('mouseleave', () => _tt && _tt.classList.remove('visible'));
    });
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  MINI JOSLA
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function createMiniBar(fatigue) {
    if (!fatigue) return '';
    const pct = fatigue.score;
    return `<div class="fatigue-mini" title="Nogurums: ${pct}% - ${fatigue.level}">` +
      `<div class="fatigue-mini-track">` +
        `<div class="fatigue-mini-fill ${fatigue.levelClass}" style="width:${pct}%"></div>` +
      `</div>` +
      `<span class="fatigue-mini-label ${fatigue.levelClass}">${pct}%</span>` +
    `</div>`;
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  DETAÄ»U PANELIS â€” WHOOP ring header, same rows as before
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function createForecastCurve(projection) {
    if(!projection?.samples?.length)return '';
    const samples=projection.samples,first=samples[0],last=samples[samples.length-1];
    const x=t=>26+Math.max(0,Math.min(1,(t-first.time)/Math.max(1,last.time-first.time)))*292;
    const y=s=>8+(100-s)*0.46;
    const points=samples.map(s=>`${x(s.time).toFixed(1)},${y(s.score).toFixed(1)}`).join(' ');
    const clock=t=>new Date(t).toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'});
    const bands=projection.nightBands.map(b=>`<rect x="${x(b.start)}" y="8" width="${x(b.end)-x(b.start)}" height="46" fill="#fbbf24" opacity=".12"/>`).join('');
    const rest=projection.restBands.map(b=>`<rect x="${x(b.start)}" y="56" width="${x(b.end)-x(b.start)}" height="3" rx="1" fill="#6ee7b7"/>`).join('');
    return `<figure class="mk-fatigue-curve"><figcaption>Noguruma prognoze</figcaption><svg viewBox="0 0 330 76" role="img" aria-label="Noguruma prognoze: sākumā ${first.score}, beigās ${last.score} no 100. Dzeltenais fons rāda laiku no 02.00 līdz 06.00; zaļie posmi rāda plānoto atpūtu."><line x1="26" x2="318" y1="54" y2="54" stroke="#ffffff30"/>${bands}<text x="1" y="13">100</text><text x="12" y="56">0</text><polyline points="${points}" fill="none" stroke="#80e6f4" stroke-width="2" stroke-linejoin="round"/>${rest}<text x="26" y="72">${clock(first.time)}</text><text x="172" y="72" text-anchor="middle">${clock((first.time+last.time)/2)}</text><text x="318" y="72" text-anchor="end">${clock(last.time)}</text></svg><div class="mk-fatigue-curve-key"><span>▧ 02–06: parasti miegaināks</span>${rest?'<span style="color:#80e6f4">━ Ar plānoto miegu</span>':''}</div></figure>`;
  }

  function createDetailPanel(fatigue) {
    if (!fatigue) {
      return `<div class="fatigue-panel fatigue-tab-panel"><div class="fatigue-nodata">Lai aprēķinātu nogurumu, vajadzīgs darba grafiks.</div></div>`;
    }

    const f = fatigue;
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const okIcon = `<span class="fatigue-ok">${fluentIcon('checkmark')}</span>`;
    const warnIcon = `<span class="fatigue-warn">${fluentIcon('warning')}</span>`;
    const rows = [];
    const target=f.selectedShift?.entry||f.currentShift;
    const comparison=target?.date?nightScenarios(f.workerName,target,now):null;
    const projection=comparison?.projection||(target?.date?forecast(f.workerName,target):null);
    const clockText=t=>{
      const date=new Date(t);
      return `${date.getDate()}.${String(date.getMonth()+1).padStart(2,'0')}. ap ${date.toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'})}`;
    };
    const projectionNotes=[];
    if(projection?.between){
      const n=projection.between.nights;
      projectionNotes.push(`Pirms šīs maiņas grafikā brīvas <b>${formatDuration(projection.between.hours)}</b>. ${n} ${n===1?'naktī':'naktīs'} ir vismaz 7 stundas bez darba starp 22.00 un 08.00. Tas nenozīmē, ka visas šīs stundas nogulētas.`);
    }
    if(projection?.hasNightPlan)projectionNotes.push(`Savā nakts daļā lielākais prognozētais nogurums: <b style="color:${getPresentation(projection.ownPeak?.score||0).color}">${projection.ownPeak?.score??'—'}/100</b>${projection.ownPeak?' — '+clockText(projection.ownPeak.time):''}. Darbs laikā no 02.00 līdz 06.00: <b>${formatDuration(projection.earlyNightWorkHours)}</b>.`);

    // 1. Weekly hours
    const hoursOk = f.weeklyHours < THRESHOLDS.weeklyHoursWarn;
    rows.push(`<div class="fatigue-row">
      <span class="${hoursOk?'fatigue-neutral':'fatigue-warn'}">${fluentIcon('clock')}</span>
      <span class="fatigue-row-label">Darbs pēdējās 7 dienās</span>
      <span class="fatigue-row-val ${hoursOk ? '' : 'fatigue-val-warn'}">${formatRemaining(f.weeklyHours).replace(' 00m', '')}</span>
    </div>`);

    // 2. Shifts this week
    const shiftsOk = f.shiftsThisWeek < THRESHOLDS.shiftsPerWeekWarn;
    const shiftsWord = f.shiftsThisWeek === 1 ? '1 maiņa' : f.shiftsThisWeek + ' maiņas';
    rows.push(`<div class="fatigue-row">
      <span class="${shiftsOk?'fatigue-neutral':'fatigue-warn'}">${fluentIcon('calendar_ltr')}</span>
      <span class="fatigue-row-label">Maiņas pēdējās 7 dienās</span>
      <span class="fatigue-row-val ${shiftsOk ? '' : 'fatigue-val-warn'}">${shiftsWord}</span>
    </div>`);

    // 3. Status
    if (f.viewMode === 'future' && f.selectedShift && f.selectedShift.entry) {
      const s = f.selectedShift;
      const sIcon = shiftKindIcon(s.entry);
      const hrsToStart = (s.start - now) / 3600000;
      const hrsToEnd = (s.end - now) / 3600000;
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${sIcon}</span>
        <span class="fatigue-row-label">Izvēlētā maiņa — ${s.entry.hours}h</span>
        <span class="fatigue-row-val">${formatDateShort(s.entry.dateStr)}</span>
      </div>`);
      if (hrsToStart > 0)
        rows.push(`<div class="fatigue-row">${okIcon}<span class="fatigue-row-label">Sāksies pēc</span><span class="fatigue-row-val">${formatRemaining(hrsToStart)}</span></div>`);
      else if (hrsToEnd > 0)
        rows.push(`<div class="fatigue-row">${okIcon}<span class="fatigue-row-label">Beigsies pēc</span><span class="fatigue-row-val">${formatRemaining(hrsToEnd)}</span></div>`);

    } else if (f.onDuty && f.currentShift && f.viewMode !== 'future') {
      const curIcon = shiftKindIcon(f.currentShift);
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${curIcon}</span>
        <span class="fatigue-row-label">${f.viewMode === 'past' ? 'Maiņa šajā datumā' : 'Pašlaik darbā'} — ${f.currentShift.hours}h</span>
        <span class="fatigue-row-val">${f.viewMode === 'past' ? 'Tolaik atlikušas ' : 'Vēl '}${formatRemaining(f.hoursToShiftEnd)}</span>
      </div>`);

    } else if (f.viewMode !== 'future' && f.hoursSinceLastShift >= 0 && f.lastShift) {
      const lastIcon = shiftKindIcon(f.lastShift);
      const restText = formatDuration(f.hoursSinceLastShift);
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${lastIcon}</span>
        <span class="fatigue-row-label">Kopš maiņas beigām</span>
        <span class="fatigue-row-val">${restText}</span>
      </div>`);
    }

    // 4. Next shift
    if (f.nextShift && !(f.viewMode === 'future' && f.selectedShift && f.selectedShift.entry && f.nextShift.dateStr === f.selectedShift.entry.dateStr)) {
      const nIcon = shiftKindIcon(f.nextShift);
      const nKind = shiftKind(f.nextShift);
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${nIcon}</span>
        <span class="fatigue-row-label">Nākamā maiņa</span>
        <span class="fatigue-row-val">${formatDateShort(f.nextShift.dateStr)} — ${f.nextShift.hours}h ${nKind === 'nakts' ? 'naktī' : nKind === 'diena' ? 'dienā' : ''}</span>
      </div>`);
    }

    // 5. Next day off
    if (f.nextDayOff) {
      const diffDays = Math.round((f.nextDayOff - todayMidnight) / 86400000);
      let offText;
      if (f.viewMode !== 'today') offText = formatDateShort(`${f.nextDayOff.getDate()}.${f.nextDayOff.getMonth()+1}.${f.nextDayOff.getFullYear()}`);
      else if (diffDays <= 0) offText = 'šodien';
      else if (diffDays === 1) offText = 'rīt';
      else if (diffDays === 2) offText = 'parīt';
      else offText = 'pēc ' + diffDays + ' dienām';
      rows.push(`<div class="fatigue-row">
        ${okIcon}
        <span class="fatigue-row-label">Nākamā pilnā brīvdiena</span>
        <span class="fatigue-row-val">${offText}</span>
      </div>`);
    }

    // 6. Problems
    if (f.shortRests > 0) {
      const timesWord = f.shortRests === 1 ? '1 reize' : f.shortRests + ' reizes';
      rows.push(`<div class="fatigue-row fatigue-row-problem">
        ${warnIcon}
        <span class="fatigue-row-label">Starp maiņām mazāk par 11h</span>
        <span class="fatigue-row-val fatigue-val-warn">${timesWord} — īsākais ${formatDuration(f.minRestHours)}</span>
      </div>`);
    }
    if (f.nightShiftsThisWeek >= 3) {
      rows.push(`<div class="fatigue-row fatigue-row-problem">
        ${warnIcon}
        <span class="fatigue-row-label">Nakts maiņas pēdējās 7 dienās</span>
        <span class="fatigue-row-val fatigue-val-warn">${f.nightShiftsThisWeek} maiņas</span>
      </div>`);
    }

    const assumptions=sleepAssumptions(f.workerName);
    let usual='';
    try{const stats=JSON.parse(localStorage.getItem('minkaNightStatsV1')||'{}').data;const counts=stats?.parts?.[f.workerName];if(Array.isArray(counts)){const valid=counts.map(n=>Math.max(0,Number(n)||0)),max=Math.max(...valid);if(max>0){const parts=valid.map((n,i)=>n===max?`${i+1}.`:null).filter(Boolean);usual=`<p>Vēsturē biežāk: <b>${parts.join(' / ')} nakts daļa</b> (${max}×${parts.length>1?' katra':''}).</p>`;}}}catch(_){}
    const current=getPresentation(f.score);
    const ending=projection?getPresentation(projection.endScore):null;
    const shiftEnd=f.currentShiftEnd||f.selectedShift?.end;
    const timeValue=f.viewMode==='future'&&f.selectedShift
      ? formatRemaining(Math.max(0,(f.selectedShift.start-now)/HOUR))
      : f.viewMode==='today'&&f.onDuty ? formatRemaining(f.hoursToShiftEnd)
      : f.viewMode==='past'&&shiftEnd ? new Date(shiftEnd).toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'})
      : f.hoursSinceLastShift>=0 ? formatRemaining(f.hoursSinceLastShift) : '—';
    const timeLabel=f.viewMode==='future'?'Maiņa sāksies pēc':f.viewMode==='today'&&f.onDuty?'Līdz maiņas beigām':f.viewMode==='past'?'Maiņas beigas':'Kopš maiņas beigām';
    const timeHint=f.viewMode==='future'&&f.selectedShift?formatDateShort(f.selectedShift.entry.dateStr)
      : shiftEnd&&f.onDuty?`plkst. ${new Date(shiftEnd).toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'})}`:'Brīvais laiks pēc grafika';
    const isNight=target&&(target.isNight||target.hours>=24);
    const miniFact=(label,value)=>`<div class="fh-rest-fact"><span>${label}</span><b>${value}</b></div>`;
    let restHtml='';
    if(projection?.hasNightPlan){
      restHtml=`<h3>Atpūta naktī <small>Pēc sadalījuma</small></h3><div class="fh-rest-grid">${miniFact('Pirms savas daļas',formatDuration(projection.restBeforeHours))}${miniFact('Pēc savas daļas',formatDuration(projection.restAfterHours))}</div><p>Bez pārtraukuma: <b>${formatDuration(projection.longestRestHours)}</b></p>`;
    }else if(isNight){
      restHtml='<h3>Atpūta naktī</h3><p class="fh-rest-missing">Vēl nav ierēķināta</p><p>Nav saglabāts nakts sadalījums. Ar plānotu atpūtu prognoze var mainīties.</p>';
    }else{
      restHtml=`<h3>Brīvais laiks pirms maiņas</h3><b class="fh-rest-total">${projection?.between?formatDuration(projection.between.hours):'Nav pietiekamu datu'}</b><p>Laiks starp iepriekšējās maiņas beigām un šīs maiņas sākumu.</p>`;
    }
    const timeOnly=t=>new Date(t).toLocaleTimeString('lv-LV',{hour:'2-digit',minute:'2-digit'});
    const nightCard=o=>{
      const total=(o.sleep||[]).reduce((sum,p)=>sum+p.end-p.start,0)/HOUR;
      const first=comparison.options[0].start,last=comparison.options.at(-1).end;
      const bar=(start,end,kind)=>`<i class="is-${kind}" style="left:${100*(start-first)/(last-first)}%;width:${100*(end-start)/(last-first)}%"></i>`;
      const longest=Math.max(0,...(o.sleep||[]).map(p=>(p.end-p.start)/HOUR));
      const sleepTimes=(o.sleep||[]).map(p=>`<span>${timeOnly(p.start)}–${timeOnly(p.end)}</span>`).join('');
      return `<div class="fh-option${o.selected?' is-selected':''}${o.unavailable?' is-unavailable':''}"><div class="fh-option-body"><span class="fh-option-label">${o.part}. nakts daļa <small>${o.selected?'Pašreizējā':''}</small></span><span class="fh-option-time">Darbs ${timeOnly(o.start)}–${timeOnly(o.end)}</span>${o.unavailable?'<strong class="fh-option-past">Jau sākusies</strong></div>':`<div class="fh-sleep-total"><b>${formatRemaining(total).replace(' 00m','')}</b><span>miegam*</span></div><div class="fh-sleep-axis" aria-hidden="true">${bar(o.start,o.end,'work')}${o.sleep.map(p=>bar(p.start,p.end,'sleep')).join('')}</div><div class="fh-sleep-times">${sleepTimes||'<span>Miegs nav paredzēts</span>'}</div>${(o.sleep||[]).length>1?`<span class="fh-sleep-note">2 posmi, garākais ${formatRemaining(longest).replace(' 00m','')}</span>`:''}</div><div class="fh-slot-scores"><small>Nogurums /100</small><span>Daļas beigās <b style="color:${getPresentation(o.endScore).color}">${o.endScore}</b></span><span>Maiņas beigās ${timeOnly(shiftEnd)} <b style="color:${getPresentation(o.shiftEndScore).color}">${o.shiftEndScore}</b></span></div>`}</div>`;
    };
    const comparisonHtml=comparison?`<section class="fh-comparison"><div class="fh-comparison-head"><h3>Kuru nakts daļu strādāt?</h3><div class="fh-sleep-legend"><span class="is-work">Darbs</span><span class="is-sleep">Miegs*</span></div></div><div class="fh-options" style="--fh-parts:${comparison.options.length}">${comparison.options.map(nightCard).join('')}</div><p class="fh-sleep-note">* Atvēlētas ${assumptions.latencyMinutes} min iemigšanai katrā reizē.${comparison.saved?'':' Nesaglabāts plāns.'}</p></section>`:'';
    const middleHtml=`<section class="fh-middle"><div class="fh-chart">${createForecastCurve(projection)||'<p>Izvēlies maiņu, lai redzētu noguruma prognozi.</p>'}${projection?`<div class="fh-start-score">Sākumā <b style="color:${getPresentation(projection.startScore).color}">${projection.startScore}/100</b><span>Augstākais <b style="color:${getPresentation(projection.peak.score).color}">${projection.peak.score}/100</b> — ${timeOnly(projection.peak.time)}</span></div>`:''}</div><div class="fh-rest">${restHtml}</div></section>`;
    // SmartCrew-inspired presentation: expose the actual schedule features,
    // without adding a second heuristic score or arbitrary extra penalties.
    const drivers=[];
    const driver=(label,value,tone='neutral')=>`<div class="fh-driver is-${tone}"><span>${label}</span><b>${value}</b></div>`;
    drivers.push(driver('Darbs pēdējās 7 dienās',formatRemaining(f.weeklyHours).replace(' 00m',''),f.weeklyHours>=THRESHOLDS.weeklyHoursWarn?'load':'neutral'));
    if(projection?.between)drivers.push(driver('Brīvs pirms šīs maiņas',formatRemaining(projection.between.hours).replace(' 00m',''),projection.between.hours<THRESHOLDS.minRestHours?'load':'rest'));
    if(projection?.earlyNightWorkHours>0)drivers.push(driver('Darbs laikā 02–06',formatRemaining(projection.earlyNightWorkHours).replace(' 00m',''),'load'));
    else if(projection?.hasNightPlan)drivers.push(driver('Laiks 02–06','Paredzēta atpūta','rest'));
    const driversHtml=drivers.slice(0,3).join('');
    return `<div class="fatigue-panel fatigue-tab-panel mk-detail-fatigue fh-health ${f.levelClass}">
      <section class="fh-summary" aria-label="Svarīgākais par nogurumu">
        <div class="fh-tile fh-current" style="--fh-color:${current.color}"><span class="fh-eyebrow">${f.viewMode==='today'?'Nogurums tagad':'Maiņas sākumā'}</span><div class="fh-number">${f.score}<small>/100</small></div><strong class="fh-level">${current.label}</strong></div>
        <div class="fh-tile" style="--fh-color:${ending?.color||'#aeb9c4'}"><span class="fh-eyebrow">Maiņas beigās <small>Prognoze</small></span><div class="fh-number">${ending?.score??'—'}${ending?'<small>/100</small>':''}</div><span class="fh-tile-note">${projection?.hasNightPlan?`Ar nakts sadalījumu${projection.nightParts?` (${projection.nightParts} daļas)`:''}`:target?`${target.hours}h dežūra`:''}</span></div>
        <div class="fh-tile fh-time" style="--fh-color:#9cceff"><span class="fh-eyebrow">${timeLabel}</span><div class="fh-time-number">${timeValue}</div><span class="fh-tile-note">${timeHint}</span></div>
      </section>
      ${comparisonHtml}

      <details class="fh-more"><summary>Grafiks un aprēķins</summary>
      <div class="fh-switch" role="group" aria-label="Papildu informācija"><button type="button" data-fatigue-section="schedule" aria-pressed="true" aria-controls="fh-schedule">${fluentIcon('calendar_ltr')}<span>Maiņa un atpūta</span></button><button type="button" data-fatigue-section="explanation" aria-pressed="false" aria-controls="fh-explanation">${fluentIcon('info')}<span>Kā aprēķināts?</span></button>${projection?'<button type="button" data-fatigue-section="curve" aria-pressed="false" aria-controls="fh-curve">'+fluentIcon('data_line')+'<span>Līkne un atpūta</span></button>':''}</div>
      <div id="fh-schedule" data-fatigue-panel="schedule" class="fatigue-details mk-detail-stats fh-facts">${rows.join('')}</div>
      <div id="fh-explanation" data-fatigue-panel="explanation" class="fh-explanation" hidden><div class="fh-calculation"><h3>Tava slodze un atpūta</h3><div class="fh-drivers">${driversHtml}</div></div><div class="fh-context"><h3>Miegs un dežūras slodze</h3><p>Miegs samazina prognozi. Uzkrātā dežūras slodze mazinās lēnāk un saglabājas arī pēc maiņas.</p><p>Lietotnes hibrīda indekss, nevis izmērīts noguruma procents.</p>${usual}<details class="fh-model-details"><summary>Par modeli un skalu</summary>${f.sleepModel.estimatedHistoryNights?`<p>${f.sleepModel.estimatedHistoryNights} agrākām naktīm trūkst plāna. Aplēse izmanto daļu biežumu un 00:00–07:20 logu. Šie laiki nav vēsturiski apstiprināti; 3 cilvēkiem pielāgota relatīvā nakts pozīcija. Variantu rezultāti: ${f.sleepModel.historyRange.join('–')}/100, nevis ticamības intervāls.</p>`:''}<p>UMP miega/nomoda prognoze apvienota ar eksperimentālu dežūras slodzes komponenti. Slodzes griesti 50, uzkrāšanās laika konstante 24h, atpūtas dežūrā 48h un ārpus dežūras 8h. Šie svari ir lietotnes pieņēmumi, nevis klīniski validēti koeficienti. 0–100 nav procents vai medicīnisks slieksnis. Netiek noteikts melatonīna daudzums vai pamošanās inerce. Ārpus darba pieņemta 8 stundu miega iespēja no 23.00 un pēc nakts maiņas — 4 stundas, sākot stundu pēc darba. Darba laiks ir izslēgts. Faktiskais miegs nav zināms.</p></details></div></div>
      ${projection?`<div id="fh-curve" data-fatigue-panel="curve" hidden>${middleHtml}</div>`:''}
      </details>
      <p class="fh-footnote">Aptuvena prognoze, nevis mērījums.${f.sleepModel.estimatedHistoryNights?' Daļa vēstures aplēsta pēc ieradumiem.':''}</p>
    </div>`;
  }


  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  INTEGRÄ€CIJA
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  function injectDutyBlockBars() {
    return; // Disabled: calendar.js handles duty block fatigue bars
    document.querySelectorAll('.duty-block[data-worker]').forEach(block => {
      if (block.querySelector('.fatigue-mini')) return;
      const name = block.getAttribute('data-worker');
      if (!name) return;
      const fatigue = calculateFatigue(name);
      const html = createMiniBar(fatigue);
      if (!html) return;
      const badgeRow = block.querySelector('.badge-row');
      if (badgeRow) badgeRow.insertAdjacentHTML('afterend', html);
      else block.insertAdjacentHTML('beforeend', html);
    });
  }

  function injectCardBars() {
    return; // Disabled: calendar.js handles card fatigue bars
    document.querySelectorAll('.card[data-worker]').forEach(card => {
      if (card.querySelector('.fatigue-mini')) return;
      const name = card.getAttribute('data-worker');
      if (!name) return;
      const fatigue = calculateFatigue(name);
      if (!fatigue) return;
      card.insertAdjacentHTML('beforeend', createMiniBar(fatigue));
    });
  }

  function renderModalFatigue() {
    const container = document.getElementById('modal-fatigue-view');
    if (!container) return;
    const nameEl = document.getElementById('modal-worker-name');
    const surnameEl = document.getElementById('modal-surname');
    if (!nameEl) return;
    const firstName = nameEl.textContent.trim();
    const surname = (surnameEl ? surnameEl.textContent.trim() : '');
    const fullName = findFullWorkerName(firstName, surname);
    if (!fullName) {
      container.innerHTML = '<div class="fatigue-panel fatigue-tab-panel"><div class="fatigue-nodata">Lai aprēķinātu nogurumu, vajadzīgs darba grafiks.</div></div>';
      return;
    }
    const moreOpen=container.dataset.worker===fullName&&container.querySelector('.fh-more')?.open;
    const previousSection=container.dataset.worker===fullName?container.querySelector('[data-fatigue-section][aria-pressed="true"]')?.dataset.fatigueSection:'schedule';
    container.dataset.worker=fullName;
    container.innerHTML = createDetailPanel(calculateFatigue(fullName));
    if(moreOpen&&container.querySelector('.fh-more'))container.querySelector('.fh-more').open=true;
    if(!container.dataset.fatigueSectionsBound){
      container.dataset.fatigueSectionsBound='1';
      container.addEventListener('click',event=>{
        const button=event.target.closest('[data-fatigue-section]');
        if(!button||!container.contains(button))return;
        const section=button.dataset.fatigueSection;
        container.querySelectorAll('[data-fatigue-section]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        container.querySelectorAll('[data-fatigue-panel]').forEach(panel=>{panel.hidden=panel.dataset.fatiguePanel!==section;});
      });
    }
    if(previousSection==='explanation'||previousSection==='curve')container.querySelector(`[data-fatigue-section="${previousSection}"]`)?.click();
    requestAnimationFrame(bindChartTooltips);
  }

  function findFullWorkerName(firstName, surname) {
    const stores = [window.__grafiksStore, window.__grafiksStoreRad];
    const firstUp = firstName.toUpperCase();
    for (const store of stores) {
      if (!store || typeof store !== 'object') continue;
      for (const month of Object.keys(store)) {
        const days = store[month];
        if (!Array.isArray(days)) continue;
        for (const day of days) {
          if (!day || !Array.isArray(day.workers)) continue;
          for (const w of day.workers) {
            const parts = String(w.name || '').trim().split(/\s+/);
            const wFirst = (parts[0] || '').toUpperCase();
            const wSurname = parts.slice(1).join(' ').toLowerCase();
            if (wFirst === firstUp && (!surname || wSurname.toLowerCase() === surname.toLowerCase())) return w.name;
          }
        }
      }
    }
    return null;
  }

  // Kartīšu renderis atjauno taimeru tekstu katru sekundi. Novērojot visu
  // subtree, katra teksta izmaiņa agrāk pārrēķināja visu fatigue/assistant
  // stāvokli un izveidoja nepārtrauktu MutationObserver cilpu. Mums vajag
  // reaģēt tikai tad, kad tiek nomainītas pašas augšējā līmeņa kartītes.
  let bridgeNotifyTimer = 0;
  function queueBridgeNotify(delay) {
    clearTimeout(bridgeNotifyTimer);
    bridgeNotifyTimer = setTimeout(() => {
      bridgeNotifyTimer = 0;
      if (!document.hidden) notifyMinkaBridge();
    }, Math.max(80, Number(delay) || 120));
  }

  // â”€â”€ NovÄ“rotÄji â”€â”€
  function observePanels() {
    ['radiographers-duty', 'radiologists-duty'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(() => queueBridgeNotify(120))
        .observe(el, { childList: true });
    });
  }

  function observeCards() {
    const el = document.getElementById('grafiks-list');
    if (!el) return;
    new MutationObserver(() => queueBridgeNotify(120))
      .observe(el, { childList: true });
  }

  function notifyMinkaBridge() {
    try { if (typeof window.__minkaPostAssistantState === 'function') window.__minkaPostAssistantState(); } catch(e) {}
  }

  function init() {
    if (!window.__grafiksStore && !window.__grafiksStoreRad) { setTimeout(init, 500); return; }
    setTimeout(() => {
      injectDutyBlockBars(); injectCardBars(); notifyMinkaBridge();
      // Trigger card fatigue bar refresh in calendar.js
      if (window.__refreshFatigueBars) window.__refreshFatigueBars();
      // Retry after another second in case cards rendered late
      setTimeout(() => { if (window.__refreshFatigueBars) window.__refreshFatigueBars(); }, 1200);
    }, 300);
    observePanels();
    observeCards();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) queueBridgeNotify(500);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 300);

  let nightRefreshTimer = 0;
  function refreshNightFatigue() {
    syncFatigueCache();
    clearTimeout(nightRefreshTimer);
    if (document.hidden) return;
    nightRefreshTimer = setTimeout(() => {
      if (document.hidden) return;
      if (window.__refreshFatigueBars) window.__refreshFatigueBars();
      if (window.g_updatePanelsForDate) window.g_updatePanelsForDate();
      const modal = document.getElementById('modal-fatigue-view');
      if (modal && modal.getClientRects().length) renderModalFatigue();
      notifyMinkaBridge();
      document.dispatchEvent(new CustomEvent('minka:fatigue-updated'));
    }, 100);
  }
  document.addEventListener('minka:night-plan-changed', refreshNightFatigue);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshNightFatigue(); });
  window.addEventListener('storage', e => { if (!e.key || e.key === 'minkaNightSplitByDateV1') refreshNightFatigue(); });

  window.__fatigue = { calculateFatigue, gatherWorkerHistory, getPresentation, scoreAt, forecast, nightScenarios, modelParameters: window.MinkaSleepModel.parameters, sleepAssumptions, savedNightWindow, clearCache: clearFatigueCache };
  window.__fatigueRenderModal = renderModalFatigue;
  window.__minkaFatigueReady = true;
  document.dispatchEvent(new CustomEvent('minka:fatigue-ready'));
  setTimeout(notifyMinkaBridge, 50);
  setTimeout(notifyMinkaBridge, 500);
})();
