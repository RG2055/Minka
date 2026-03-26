/* ================================================================
   NOGURUMA INDIKATORS v3 - PILNS PĀRRAKSTS
   
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

  const THRESHOLDS = {
    weeklyHoursWarn: 48,
    weeklyHoursCrit: 60,
    shiftsPerWeekWarn: 4,
    shiftsPerWeekCrit: 5,
    minRestHours: 11,
  };

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
    const s = String(shift || '').match(/(\d+)/);
    return s ? parseInt(s[1], 10) : 8;
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
    if (k === 'nakts') return '🌙';
    if (k === 'diennakts') return '🕛';
    return '☀️';
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
    const months = ['jan.','feb.','mar.','apr.','mai.','jÅ«n.','jÅ«l.','aug.','sep.','okt.','nov.','dec.'];
    return `${d}. ${months[(m || 1) - 1]}`;
  }

  function pluralHours(n) { return n === 1 ? '1 stunda' : n + ' stundas'; }
  function pluralDays(n) { return n === 1 ? '1 diena' : n + ' dienas'; }

  /** FormatÄ“ ilgumu stundÄs cilvÄ“kiem saprotamÄ veidÄ */
  function formatDuration(totalHours) {
    if (totalHours < 0) return 'â€”';
    const hrs = Math.floor(totalHours);
    if (hrs < 1) return 'mazÄk par stundu';
    if (hrs < 24) return pluralHours(hrs);
    const days = Math.floor(hrs / 24);
    const rem = hrs % 24;
    return rem ? `${pluralDays(days)} ${rem}h` : pluralDays(days);
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
      const key = e.dateStr + '|' + e.shift;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => a.date - b.date);

    // Step 2: dedup cross-month duplicates
    // A 24h shift starting Feb 28 ends Mar 1 â€” it appears in BOTH months.
    // Two entries are the same shift if their computed time windows overlap by â‰¥ 80%.
    const keep = [];
    for (const entry of unique) {
      const { start: es, end: ee } = getShiftStartEnd(entry);
      if (!es || !ee) { keep.push(entry); continue; }
      const dur = ee - es;
      let isDupe = false;
      for (const kept of keep) {
        const { start: ks, end: ke } = getShiftStartEnd(kept);
        if (!ks || !ke) continue;
        const overlapStart = Math.max(es.getTime(), ks.getTime());
        const overlapEnd = Math.min(ee.getTime(), ke.getTime());
        const overlap = Math.max(0, overlapEnd - overlapStart);
        const kDur = ke - ks;
        // If overlap is â‰¥ 70% of either shift's duration â†’ same physical shift
        if (overlap >= dur * 0.7 || overlap >= kDur * 0.7) {
          isDupe = true;
          break;
        }
      }
      if (!isDupe) keep.push(entry);
    }
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

  function calculateFatigue(workerName) {
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
    else if (selectedDate && selectedDate.getTime() < today.getTime()) viewMode = 'past';

    // NÄkotnes/pagÄtnes skatÄ«jumÄ: simulÄ“ now = izvÄ“lÄ“tÄs maiÅ†as sÄkums
    // Tas Ä¼auj aprÄ“Ä·inÄt "cik noguris bija/bÅ«s darbinieks TAJÄ€ dienÄ"
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

    const domDuty = _getOnDutyFromDom(workerName);

    // MeklÄ“jam intervÄlu kurÄ iekrÄ«t NOW
    let currentInterval = null;
    for (const iv of allIntervals) {
      if (now >= iv.start && now < iv.end) {
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
    //     Ja skatÄmies nÄkotni/pagÄtni, rÄ“Ä·inÄm nedÄ“Ä¼u
    //     ap IZVÄ’LÄ’TO datumu, nevis Å¡odienu.
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // "Konteksta diena" â€” datums, kuru lietotÄjs skatÄs
    const contextDay = (selectedDate && (viewMode === 'future' || viewMode === 'past'))
      ? selectedDate
      : today;

    const dayOfWeek = contextDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(contextDay);
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // svÄ“tdiena

    const recentShifts = history.filter(e => e.date >= weekStart && e.date <= weekEnd);
    const weeklyHours = recentShifts.reduce((sum, e) => sum + e.hours, 0);
    const shiftsThisWeek = recentShifts.length;
    const nightShiftsThisWeek = recentShifts.filter(e => e.isNight).length;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  5) ATPÅªTAS PÄ€RBAUDE
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let shortRests = 0;
    let minRestHours = Infinity;
    for (let i = 1; i < recentShifts.length; i++) {
      const { end: prevEnd } = getShiftStartEnd(recentShifts[i - 1]);
      const { start: currStart } = getShiftStartEnd(recentShifts[i]);
      if (prevEnd && currStart) {
        const restHrs = (currStart - prevEnd) / 3600000;
        if (restHrs > 0 && restHrs < minRestHours) minRestHours = restHrs;
        if (restHrs > 0 && restHrs < THRESHOLDS.minRestHours) shortRests++;
      }
    }
    if (minRestHours === Infinity) minRestHours = -1;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  6) NÄ€KAMÄ€ BRÄªVDIENA
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let nextDayOff = null;
    const futureShifts = history.filter(e => e.date > today);
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const has = futureShifts.some(e =>
        e.date.getFullYear() === checkDate.getFullYear() &&
        e.date.getMonth() === checkDate.getMonth() &&
        e.date.getDate() === checkDate.getDate()
      );
      if (!has) { nextDayOff = checkDate; break; }
    }




    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  SCORE v8 â€” AtpÅ«ta AP Å ODIENU (ne pÄ“dÄ“jÄ maiÅ†a periodÄ)
    //
    //  LoÄ£ika:
    //   1) Atrodam pÄ“dÄ“jo PABEIGTO maiÅ†u (pirms now)
    //   2) AprÄ“Ä·inÄm atpÅ«tu no tÄs beigÄm lÄ«dz now (vai nÄkamÄs maiÅ†as sÄkumam)
    //   3) Score balstÄs uz Å¡o atpÅ«tu
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    var score = 0;
    var scoreReasons = [];

    (function() {
      // PÄ“dÄ“jÄs 21 dienas, tikai primÄrie intervÄli, bez alt-dublikÄtiem
      var cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - 21);

      var timeline = history
        .filter(function(e) { return e.date >= cutoff; })
        .map(function(e) {
          var se = getShiftStartEnd(e);
          return { e: e, start: se.start, end: se.end, hrs: e.hours || 12, isNight: e.isNight };
        })
        .filter(function(x) { return x.start && x.end; })
        .sort(function(a, b) { return a.start - b.start; });

      // NoÅ†em alt-dublikÄtus (<2h starpÄ«ba sÄkumos)
      timeline = timeline.filter(function(x, i) {
        if (i === 0) return true;
        return (x.start - timeline[i-1].start) > 2 * 3600000;
      });

      if (!timeline.length) {
        score = 10;
        scoreReasons.push({ type: 'info', text: 'Nav pietiekami daudz datu', pts: '' });
        return;
      }

      // â”€â”€ Atrodam pÄ“dÄ“jo pabeigto maiÅ†u (beidzÄs pirms now) â”€â”€
      // SVARÄªGI: izslÄ“dzam ierakstus kuru start ir NÄ€KOTNÄ’ (alt dublikÄti)
      var lastDone = null;
      for (var i = timeline.length - 1; i >= 0; i--) {
        var t = timeline[i];
        if (t.start > now) continue;  // nÄkotnes maiÅ†a - izlaist
        if (t.end <= now) { lastDone = t; break; }
      }

      // â”€â”€ Atrodam nÄkamo maiÅ†u (sÄkas pÄ“c now) â”€â”€
      var nextUpcoming = null;
      for (var j = 0; j < timeline.length; j++) {
        if (timeline[j].start > now) { nextUpcoming = timeline[j]; break; }
      }

      // â”€â”€ AktÄ«vÄ maiÅ†a (sÄkas pirms now, beidzas pÄ“c now) â”€â”€
      // Papildu pÄrbaude: maiÅ†as ilgums atbilst reÄlam (ne alt <1h dublikÄts)
      var activeCurrent = null;
      for (var k = 0; k < timeline.length; k++) {
        var t2 = timeline[k];
        if (t2.start <= now && t2.end > now) {
          var dur = (t2.end - t2.start) / 3600000;
          if (dur >= 6) { activeCurrent = t2; break; } // min 6h - Ä«stÄ maiÅ†a
        }
      }

      function idealRestH(hrs, isNight) {
        if (hrs >= 24) return 72;
        if (isNight) return 24;
        return 16;
      }
      function minRestH(hrs, isNight) {
        if (hrs >= 24) return 48;
        if (isNight) return 16;
        return 11;
      }

      // â”€â”€ GALVENAIS: atpÅ«ta starp pÄ“dÄ“jo pabeigto un nÄkamo/aktÄ«vo â”€â”€
      if (lastDone) {
        var restEnd = activeCurrent ? activeCurrent.start : (nextUpcoming ? nextUpcoming.start : now);
        var restH = Math.max(0, (restEnd - lastDone.end) / 3600000);
        var ideal = idealRestH(lastDone.hrs, lastDone.isNight);
        var minR = minRestH(lastDone.hrs, lastDone.isNight);
        var shiftLabel = lastDone.hrs + 'h' + (lastDone.hrs >= 24 ? ' diennakts' : (lastDone.isNight ? ' nakts' : ' diena'));

        if (activeCurrent) {
          // Tagad ir aktÄ«va maiÅ†a â€” restH = atpÅ«ta pirms tÄs
          var label = 'Atpūta pirms aktīvās maiņas: ' + Math.round(restH) + 'h (pēc ' + shiftLabel + ')';
          if (restH < minR) {
            var deficit = minR - restH;
            var rs = Math.round(Math.min(75, (deficit / minR) * 75 + 25));
            score += rs;
            var needMore = Math.round(minR - restH);
            scoreReasons.push({ type: 'bad', text: '⚠ Pirms maiņas bija tikai ' + Math.round(restH) + 'h atpūta - vajag vismaz ' + minR + 'h (pietrūkst ' + needMore + 'h)', pts: '+' + rs });
          } else if (restH < ideal) {
            var partial = Math.round(((ideal - restH) / (ideal - minR)) * 35);
            score += partial;
            scoreReasons.push({ type: 'warn', text: 'Pirms maiņas bija ' + Math.round(restH) + 'h atpūta - ieteicami ' + ideal + 'h', pts: partial > 0 ? '+' + partial : '0' });
          } else {
            scoreReasons.push({ type: 'good', text: '✓ Pirms maiņas bija ' + Math.round(restH) + 'h atpūta - pietiekami', pts: '0' });
          }
          // AktÄ«vas deÅ¾Å«ras papildu slodze
          var dutyHrs = activeCurrent.hrs;
          var elapsed = Math.max(0, (now - activeCurrent.start) / 3600000);
          var dutyRatio = Math.min(1, elapsed / dutyHrs);
          var heaviness = dutyHrs >= 24 ? 1.0 : (activeCurrent.isNight ? 0.7 : 0.4);
          var dutyAdd = Math.round(dutyRatio * heaviness * 15);
          if (dutyAdd > 0) {
            score += dutyAdd;
            scoreReasons.push({ type: 'info', text: 'Aktīvā dežūra: ' + Math.round(elapsed) + 'h/' + dutyHrs + 'h', pts: '+' + dutyAdd });
          }
        } else {
          // Å obrÄ«d atpÅ«Å¡as â€” cik laika pagÄjis kopÅ¡ pÄ“dÄ“jÄs maiÅ†as
          var sinceH = Math.max(0, (now - lastDone.end) / 3600000);
          var label2 = 'Atpūta kopš ' + shiftLabel + ': ' + Math.round(sinceH) + 'h';
          if (sinceH < minR) {
            var deficit2 = minR - sinceH;
            var rs2 = Math.round(Math.min(75, (deficit2 / minR) * 75 + 25));
            score += rs2;
            scoreReasons.push({ type: 'bad', text: '⚠ Atpūšas tikai ' + Math.round(sinceH) + 'h pēc ' + shiftLabel + ' - vajag vēl ' + Math.round(minR - sinceH) + 'h', pts: '+' + rs2 });
          } else if (sinceH < ideal) {
            var partial2 = Math.round(((ideal - sinceH) / (ideal - minR)) * 25);
            score += partial2;
            scoreReasons.push({ type: 'warn', text: 'Atpūšas ' + Math.round(sinceH) + 'h pēc ' + shiftLabel + ' (ieteicami ' + ideal + 'h)', pts: partial2 > 0 ? '+' + partial2 : '0' });
          } else {
            scoreReasons.push({ type: 'good', text: '✓ Pietiekama atpūta (' + Math.round(sinceH) + 'h) pēc ' + shiftLabel, pts: '0' });
          }
          // NÄkamÄ maiÅ†a drÄ«z?
          if (nextUpcoming) {
            var untilNext = Math.max(0, (nextUpcoming.start - now) / 3600000);
            if (untilNext < 12) {
              var urgencyAdd = Math.round((1 - untilNext/12) * 15);
              score += urgencyAdd;
              scoreReasons.push({ type: 'warn', text: 'Nākamā maiņa pēc ' + Math.round(untilNext) + 'h', pts: '+' + urgencyAdd });
            }
          }
        }
      } else if (activeCurrent) {
        // PirmÄ maiÅ†a periodÄ, aktÄ«va
        var dutyHrs2 = activeCurrent.hrs;
        var elapsed2 = Math.max(0, (now - activeCurrent.start) / 3600000);
        var dutyAdd2 = Math.round(Math.min(1, elapsed2 / dutyHrs2) * (dutyHrs2 >= 24 ? 20 : 10));
        score += dutyAdd2;
        scoreReasons.push({ type: 'info', text: 'Pirmā maiņa periodā (' + Math.round(elapsed2) + 'h/' + dutyHrs2 + 'h)', pts: '+' + dutyAdd2 });
      } else {
        scoreReasons.push({ type: 'info', text: 'Nav nesenu maiņu', pts: '0' });
      }

      // â”€â”€ PAPILDUS: vÄ“sturiskÄs Ä«sÄs atpÅ«tas (tikai pÄ“dÄ“jie 2 gadÄ«jumi) â”€â”€
      var histViolations = [];
      for (var m = 1; m < timeline.length; m++) {
        var prevT = timeline[m-1];
        var currT = timeline[m];
        if (currT.start > now) continue; // nÄkotnes maiÅ†as - izlaist
        if (activeCurrent && Math.abs(currT.start - activeCurrent.start) < 3600000) continue;
        var gapH = Math.max(0, (currT.start - prevT.end) / 3600000);
        var minG = minRestH(prevT.hrs, prevT.isNight);
        if (gapH > 0 && gapH < minG) {
          histViolations.push({ gapH: gapH, prevHrs: prevT.hrs, minG: minG });
        }
      }
      // RÄda max 2 jaunÄkos pÄrkÄpumus
      var showViol = histViolations.slice(-2);
      for (var v = 0; v < showViol.length; v++) {
        var viol = showViol[v];
        var histAdd = Math.min(8, Math.round(((viol.minG - viol.gapH) / viol.minG) * 8));
        score += histAdd;
        scoreReasons.push({
          type: 'bad',
          text: 'Īsa atpūta: ' + Math.round(viol.gapH) + 'h pēc ' + viol.prevHrs + 'h (min ' + viol.minG + 'h)',
          pts: '+' + histAdd
        });
      }

      score = Math.max(0, Math.min(100, Math.round(score)));
    })();

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  SCORE papildinÄjums v9 â€” kumulatÄ«vÄ slodze + secÄ«gums
    //  Ideja: nogurumu nosaka ne tikai pÄ“dÄ“jÄ atpÅ«ta, arÄ« kopÄ“jÄ slodze
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    (function(){
      var add = 0;

      // 7 dienu stundas (48h jau ir ES/standarta "robeÅ¾a" daudziem grafikiem)
      if (weeklyHours > 36) {
        var wh = weeklyHours;
        var addWh = 0;
        if (wh >= 60) addWh = 25;
        else if (wh >= 48) addWh = 10 + Math.round(((wh - 48) / 12) * 10); // 10â†’20
        else addWh = Math.round(((wh - 36) / 12) * 10); // 0â†’10
        add += addWh;
        if (addWh > 0) scoreReasons.push({ type:'warn', text:'Slodze 7 dienās: ' + wh + 'h', pts:'+' + addWh });
      }

      // MaiÅ†u skaits nedÄ“Ä¼Ä (bieÅ¾Äkas maiÅ†as = mazÄk atjaunoÅ¡anÄs)
      if (shiftsThisWeek >= 4) {
        var addCnt = shiftsThisWeek >= 5 ? 12 : 6;
        add += addCnt;
        scoreReasons.push({ type:'warn', text:'Maiņu skaits 7 dienās: ' + shiftsThisWeek, pts:'+' + addCnt });
      }

      // Nakts/diennakts maiÅ†as (cirkadiÄna slodze)
      var full24 = recentShifts.filter(function(e){
        return (e.hours >= 24) || String(e.type || '').toUpperCase() === 'DIENNAKTS';
      }).length;
      var addNight = Math.min(12, nightShiftsThisWeek * 4);
      var add24 = Math.min(18, full24 * 6);
      if (addNight > 0) { add += addNight; scoreReasons.push({ type:'warn', text:'Nakts maiņas 7 dienās: ' + nightShiftsThisWeek, pts:'+' + addNight }); }
      if (add24 > 0) { add += add24; scoreReasons.push({ type:'bad', text:'Diennakts maiņas 7 dienās: ' + full24, pts:'+' + add24 }); }

      // SecÄ«gas darba dienas (streak)
      var sorted = recentShifts.slice().sort(function(a,b){ return a.date - b.date; });
      var streak = 0, maxStreak = 0;
      var lastDayKey = null;
      for (var i = 0; i < sorted.length; i++) {
        var d = sorted[i].date;
        var key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
        if (!lastDayKey) { streak = 1; lastDayKey = key; maxStreak = 1; continue; }
        var prev = sorted[i-1].date;
        var diffDays = Math.round((d - prev) / 86400000);
        if (diffDays === 1) streak++;
        else streak = 1;
        if (streak > maxStreak) maxStreak = streak;
      }
      if (maxStreak >= 3) {
        var addStreak = Math.min(15, (maxStreak - 2) * 5);
        add += addStreak;
        scoreReasons.push({ type:'warn', text:'Secīgas darba dienas: ' + maxStreak, pts:'+' + addStreak });
      }

      // ÄªpaÅ¡i kritiska zona nakts laikÄ, ja ir nakts/diennakts deÅ¾Å«ra
      try {
        var h = now.getHours();
        if (onDuty && currentShift && (currentShift.isNight || (currentShift.hours>=24) || String(currentShift.type||'').toUpperCase()==='DIENNAKTS')) {
          if (h >= 2 && h <= 5) {
            add += 6;
            scoreReasons.push({ type:'bad', text:'Cirkadiānais kritums (02-05) aktīvā nakts/diennakts maiņā', pts:'+6' });
          }
        }
      } catch(_e) {}

      if (add > 0) score = Math.max(0, Math.min(100, Math.round(score + add)));
    })();


    var level, levelClass;
    if (score <= 20) { level = 'ZEMS'; levelClass = 'fatigue-low'; }
    else if (score <= 45) { level = 'VIDĒJS'; levelClass = 'fatigue-moderate'; }
    else if (score <= 70) { level = 'AUGSTS'; levelClass = 'fatigue-high'; }
    else { level = 'KRITISKS'; levelClass = 'fatigue-critical'; }

    return {
      workerName,
      score, level, levelClass, scoreReasons,
      weeklyHours, shiftsThisWeek, nightShiftsThisWeek,
      lastShift, lastShiftEnd, hoursSinceLastShift,
      onDuty, currentShift, currentShiftEnd, hoursToShiftEnd,
      shortRests, minRestHours,
      nextShift, nextDayOff, recentShifts,
      viewMode, selectedDateStr, selectedShift,
    };
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
      const dow = d.getDay();
      const mondayOff = dow === 0 ? 6 : dow - 1;
      const weekStart = new Date(d); weekStart.setDate(weekStart.getDate() - mondayOff);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);

      const weekShifts = history.filter(e => e.date >= weekStart && e.date <= weekEnd);
      const wkHours = weekShifts.reduce((s, e) => s + e.hours, 0);
      const wkCount = weekShifts.length;
      const wkNight = weekShifts.filter(e => e.isNight).length;

      let sc = 0;
      if (wkHours >= 60) sc += 40;
      else if (wkHours >= 48) sc += 20 + Math.round((wkHours - 48) / 12 * 20);
      else sc += Math.max(0, Math.round(wkHours / 48 * 15));
      if (wkCount >= 5) sc += 25;
      else if (wkCount >= 4) sc += 12 + (wkCount - 4) * 6;
      else sc += wkCount * 3;
      sc += Math.min(15, wkNight * 5);
      sc = Math.max(0, Math.min(100, sc));

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
      return `<circle cx="${xp(i).toFixed(1)}" cy="${yp(d.score).toFixed(1)}" r="${r}" fill="${col}" style="filter:drop-shadow(0 0 3px ${glow})"/>`;
    }).join('');

    const todayX = xp(days - 1).toFixed(1);
    const startStr = `${startDate.getDate()}.${String(startDate.getMonth()+1).padStart(2,'0')}`;
    const endStr = `${todayMid.getDate()}.${String(todayMid.getMonth()+1).padStart(2,'0')}`;

    const firstWeekAvg = dailyData.slice(0, 7).reduce((s, d) => s + d.score, 0) / 7;
    const lastWeekAvg = dailyData.slice(-7).reduce((s, d) => s + d.score, 0) / 7;
    const diff = lastWeekAvg - firstWeekAvg;
    let trendText = '', trendClass = '';
    if (diff > 8) { trendText = 'â†— Tendence augÅ¡upejoÅ¡a'; trendClass = 'fatigue-trend-up'; }
    else if (diff < -8) { trendText = 'â†˜ Tendence lejupejoÅ¡a'; trendClass = 'fatigue-trend-down'; }
    else { trendText = 'â†’ Stabils'; trendClass = 'fatigue-trend-stable'; }

    const dataAttr = encodeURIComponent(JSON.stringify(dailyData.map(d => ({
      s: d.score, l: d.label, k: d.shift ? shiftKind(d.shift) : null
    }))));

    return `
    <div class="fatigue-tendency">
      <div class="fatigue-tendency-header">
        <span class="fatigue-tendency-title">ðŸ“Š TENDENCE</span>
        <span class="fatigue-tendency-period">${startStr} â€” ${endStr}</span>
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
        <span class="fatigue-tendency-dot" style="background:rgba(255,160,50,0.8)"></span><span>â˜€ï¸ Diena</span>
        <span class="fatigue-tendency-dot" style="background:rgba(92,154,255,0.8)"></span><span>ðŸŒ™ Nakts</span>
        <span class="fatigue-tendency-dot" style="background:rgba(183,123,255,0.8)"></span><span>ðŸ•› Diennakts</span>
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
        const shift = d.k ? (d.k==='nakts'?'ðŸŒ™ Nakts maiÅ†a':d.k==='diennakts'?'ðŸ•› Diennakts':'â˜€ï¸ Dienas maiÅ†a') : 'â€” BrÄ«vdiena';
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

  function createDetailPanel(fatigue) {
    if (!fatigue) {
      return `<div class="fatigue-panel fatigue-tab-panel"><div class="fatigue-nodata">Nepietiek datu</div></div>`;
    }

    const f = fatigue;
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const okIcon = '<span class="fatigue-ok">&#10003;</span>';
    const warnIcon = '<span class="fatigue-warn">&#9888;</span>';
    const rows = [];

    // 1. Weekly hours
    const hoursOk = f.weeklyHours < THRESHOLDS.weeklyHoursWarn;
    rows.push(`<div class="fatigue-row">
      ${hoursOk ? okIcon : warnIcon}
      <span class="fatigue-row-label">&#128336; Ned&#275;&#316;as slodze</span>
      <span class="fatigue-row-val ${hoursOk ? '' : 'fatigue-val-warn'}">${f.weeklyHours} stundas</span>
    </div>`);

    // 2. Shifts this week
    const shiftsOk = f.shiftsThisWeek < THRESHOLDS.shiftsPerWeekWarn;
    const shiftsWord = f.shiftsThisWeek === 1 ? '1 maiņa' : f.shiftsThisWeek + ' maiņas';
    rows.push(`<div class="fatigue-row">
      ${shiftsOk ? okIcon : warnIcon}
      <span class="fatigue-row-label">&#128203; Šonedēļ</span>
      <span class="fatigue-row-val ${shiftsOk ? '' : 'fatigue-val-warn'}">${shiftsWord}</span>
    </div>`);

    // 3. Status
    if (f.viewMode === 'future' && f.selectedShift && f.selectedShift.entry) {
      const s = f.selectedShift;
      const kind = shiftKind(s.entry);
      const sIcon = shiftKindIcon(s.entry);
      const hrsToStart = (s.start - now) / 3600000;
      const hrsToEnd = (s.end - now) / 3600000;
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${sIcon}</span>
        <span class="fatigue-row-label">Maiņa šajā datumā (${s.entry.hours}h, ${kind})</span>
        <span class="fatigue-row-val">${formatDateShort(s.entry.dateStr)}</span>
      </div>`);
      if (hrsToStart > 0)
        rows.push(`<div class="fatigue-row">${okIcon}<span class="fatigue-row-label">Sāksies pēc</span><span class="fatigue-row-val">${formatRemaining(hrsToStart)}</span></div>`);
      else if (hrsToEnd > 0)
        rows.push(`<div class="fatigue-row">${okIcon}<span class="fatigue-row-label">Beigsies pēc</span><span class="fatigue-row-val">${formatRemaining(hrsToEnd)}</span></div>`);

    } else if (f.onDuty && f.currentShift && f.viewMode !== 'future') {
      const curKind = shiftKind(f.currentShift);
      const curIcon = shiftKindIcon(f.currentShift);
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${curIcon}</span>
        <span class="fatigue-row-label">Tagad dežūrā (${f.currentShift.hours}h, ${curKind})</span>
        <span class="fatigue-row-val">beidzas pēc ${formatRemaining(f.hoursToShiftEnd)}</span>
      </div>`);

    } else if (f.viewMode !== 'future' && f.hoursSinceLastShift >= 0 && f.lastShift) {
      const lastIcon = shiftKindIcon(f.lastShift);
      const lastKind = shiftKind(f.lastShift);
      const restText = formatDuration(f.hoursSinceLastShift);
      const endedToday = f.lastShiftEnd && (
        f.lastShiftEnd.getFullYear() === todayMidnight.getFullYear() &&
        f.lastShiftEnd.getMonth() === todayMidnight.getMonth() &&
        f.lastShiftEnd.getDate() === todayMidnight.getDate()
      );
      rows.push(`<div class="fatigue-row">
        <span class="fatigue-ok">${lastIcon}</span>
        <span class="fatigue-row-label">${endedToday ? 'Maiņa beigusies pirms' : 'Kopš pēdējās maiņas'} (${f.lastShift.hours}h, ${lastKind})</span>
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
        <span class="fatigue-row-val">${formatDateShort(f.nextShift.dateStr)} · ${f.nextShift.hours}h (${nKind})</span>
      </div>`);
    }

    // 5. Next day off
    if (f.nextDayOff) {
      const diffDays = Math.round((f.nextDayOff - todayMidnight) / 86400000);
      let offText;
      if (diffDays <= 0) offText = 'šodien';
      else if (diffDays === 1) offText = 'rīt';
      else if (diffDays === 2) offText = 'parīt';
      else offText = 'pēc ' + pluralDays(diffDays);
      rows.push(`<div class="fatigue-row">
        ${okIcon}
        <span class="fatigue-row-label">📆 Nākamā brīvdiena</span>
        <span class="fatigue-row-val">${offText}</span>
      </div>`);
    }

    // 6. Problems
    if (f.shortRests > 0) {
      const timesWord = f.shortRests === 1 ? '1 reize' : f.shortRests + ' reizes';
      rows.push(`<div class="fatigue-row fatigue-row-problem">
        ${warnIcon}
        <span class="fatigue-row-label">⚠️ Pārāk īsa atpūta starp maiņām</span>
        <span class="fatigue-row-val fatigue-val-warn">${timesWord} (min. ${Math.round(f.minRestHours)}h)</span>
      </div>`);
    }
    if (f.nightShiftsThisWeek >= 3) {
      rows.push(`<div class="fatigue-row fatigue-row-problem">
        ${warnIcon}
        <span class="fatigue-row-label">🌙 Daudz nakts maiņu nedēļā</span>
        <span class="fatigue-row-val fatigue-val-warn">${f.nightShiftsThisWeek} maiņas</span>
      </div>`);
    }

    // Ring circumference 2Ï€Ã—30 â‰ˆ 188.5
    const C = 188.5;
    const dashOffset = (C - (f.score / 100) * C).toFixed(1);

    return `
    <div class="fatigue-panel fatigue-tab-panel ${f.levelClass}">
      <div class="fatigue-hero">
        <div class="fatigue-ring-wrap ${f.levelClass}">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle class="fatigue-ring-bg" cx="36" cy="36" r="30"/>
            <circle class="fatigue-ring-fill" cx="36" cy="36" r="30"
              stroke-dasharray="${C}" stroke-dashoffset="${dashOffset}"/>
          </svg>
          <div class="fatigue-ring-center">
            <span class="fatigue-ring-score">${f.score}</span>
            <span class="fatigue-ring-label">/100</span>
          </div>
        </div>
        <div class="fatigue-hero-info">
          <div class="fatigue-title">${f.viewMode === "future" ? "🔮 PROGNOZĒTS" : "⚡ NOGURUMS"}</div>
          <div class="fatigue-level-badge">${f.level}</div>
          <div class="fatigue-bar-track">
            <div class="fatigue-bar-fill ${f.levelClass}" style="width:${f.score}%"></div>
          </div>
        </div>
      </div>
      <div class="fatigue-details">
        ${rows.join('')}
      </div>
      ${f.scoreReasons && f.scoreReasons.length ? `
      <div class="fatigue-reasons">
        <div class="fatigue-reasons-title">⚙️ Skora pamatojums</div>
        ${f.scoreReasons.map(r => `
          <div class="fatigue-reason fatigue-reason-${r.type}">
            <span class="fatigue-reason-icon">${r.type==='bad'?'⬆':r.type==='good'?'⬇':r.type==='warn'?'⚠':'ℹ'}</span>
            <span class="fatigue-reason-text">${r.text}</span>
            <span class="fatigue-reason-pts">${r.pts}</span>
          </div>`).join('')}
      </div>` : ''}
    </div>
    `;
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
      container.innerHTML = '<div class="fatigue-panel fatigue-tab-panel"><div class="fatigue-nodata">Nepietiek datu</div></div>';
      return;
    }
    container.innerHTML = createDetailPanel(calculateFatigue(fullName));
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

  // â”€â”€ NovÄ“rotÄji â”€â”€
  function observePanels() {
    ['radiographers-duty', 'radiologists-duty'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(() => requestAnimationFrame(() => { injectDutyBlockBars(); notifyMinkaBridge(); }))
        .observe(el, { childList: true, subtree: true });
    });
  }

  function observeCards() {
    const el = document.getElementById('grafiks-list');
    if (!el) return;
    new MutationObserver(() => requestAnimationFrame(() => { injectCardBars(); notifyMinkaBridge(); }))
      .observe(el, { childList: true, subtree: true });
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 300);

  window.__fatigue = { calculateFatigue, gatherWorkerHistory };
  window.__fatigueRenderModal = renderModalFatigue;
  setTimeout(notifyMinkaBridge, 50);
  setTimeout(notifyMinkaBridge, 500);
})();
