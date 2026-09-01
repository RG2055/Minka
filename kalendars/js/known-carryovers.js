// ── Zināmās nakts astes uz mēneša robežas ──────────────────────────────────
//
// A night that runs 20:00 → 08:00 is stored as two sheet rows: the evening
// part on its own day and an 8h "tail" on the next one. The tail is only
// recognisable as a night when the previous day is loaded, and the schedule
// feed serves the current month alone — mergeCachedDutyMonths keeps the
// previous month from localStorage purely so the 1st-of-month tails can be
// matched. Clear that cache (or open the app on a fresh device) and the
// previous month is gone for good: the tail is left looking like a plain 8h
// day shift and the worker shows up as being on duty today.
//
// Two defences live here:
//   1. isMorningTailShift() — data-driven, no history needed. A shift shorter
//      than a full one that starts between 00:00 and 07:59 and ends at 08:00
//      cannot be a day shift: the roster day itself rolls over at 08:00, so
//      such a block always belongs to the previous roster day.
//   2. isKnownNightCarryover() — the manual list, for boundaries where the
//      source row carries no usable times and only the roster author knows.
(function (global) {
  'use strict';

  // date (dd.mm.yyyy) → entries. `tokens` must ALL appear in the normalised
  // name, so a first name alone can never catch an unrelated colleague.
  var KNOWN_CARRYOVERS = {
    // 31.05.2026 night, split across the May/June sheet boundary.
    '01.06.2026': [
      { hours: 8, tokens: ['karina'] },
      { hours: 8, tokens: ['renda'] }
    ],
    // 31.08.2026 night, split across the August/September sheet boundary.
    // August only ever existed in the local cache, which was cleared.
    '01.09.2026': [
      { hours: 8, tokens: ['annija', 'lagzdi'] },
      { hours: 8, tokens: ['marian', 'petrov'] }
    ]
  };

  function norm(value) {
    var text = String(value == null ? '' : value).toLowerCase();
    try { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    catch (_e) { return text; }
  }

  function normalizeDate(value) {
    var m = String(value == null ? '' : value).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return String(value == null ? '' : value).trim();
    return ('0' + m[1]).slice(-2) + '.' + ('0' + m[2]).slice(-2) + '.' + m[3];
  }

  function parseHours(value) {
    var m = String(value == null ? '' : value).replace(',', '.').match(/(\d+(?:\.\d+)?)/);
    if (!m) return 0;
    return Math.round(parseFloat(m[1]) || 0);
  }

  function hasKnownCarryovers(dateStr) {
    return !!KNOWN_CARRYOVERS[normalizeDate(dateStr)];
  }

  function isKnownNightCarryover(name, hours, dateStr) {
    var entries = KNOWN_CARRYOVERS[normalizeDate(dateStr)];
    if (!entries) return false;
    var compact = norm(name);
    if (!compact) return false;
    var shiftHours = Math.round(Number(hours) || 0);
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.hours && entry.hours !== shiftHours) continue;
      var matched = true;
      for (var t = 0; t < entry.tokens.length; t++) {
        if (compact.indexOf(entry.tokens[t]) < 0) { matched = false; break; }
      }
      if (matched) return true;
    }
    return false;
  }

  // The generic rule, so a cleared cache no longer needs a new list entry.
  // Deliberately strict: only a short block that both starts in the small
  // hours and ends exactly at the 08:00 rollover qualifies.
  function isMorningTailShift(worker) {
    if (!worker) return false;
    var startHour = parseInt(String(worker.startTime || '').split(':')[0], 10);
    if (!isFinite(startHour) || startHour < 0 || startHour > 7) return false;
    if (String(worker.endTime || '').trim() !== '08:00') return false;
    var hours = parseHours(worker.shift) || Math.round(Number(worker.hours) || 0);
    return hours > 0 && hours <= 8;
  }

  global.MinkaKnownCarryovers = {
    hasKnownCarryovers: hasKnownCarryovers,
    isKnownNightCarryover: isKnownNightCarryover,
    isMorningTailShift: isMorningTailShift
  };
})(typeof window !== 'undefined' ? window : this);
