(function () {
  var list = document.getElementById('grafiks-list');
  if (!list) return;
  var PULSE_KEY = 'minkaShiftPulseV2';
  var PENDING_PULSE_KEY = 'minkaShiftPulsePendingV2';
  var TEXT_KEY = 'minkaRgFeedbackV2';
  var ENTRY_COUNT_KEY = 'minkaRgFeedbackCountsV2';
  var lastWriteButton = null;
  var ratingFlushTimer = 0;
  var ratingSyncs = {};
  var ratingsLoadedAt = {};
  // When this device last had the comment/idea feed open, and how fresh the
  // newest entry on the server is. The API already reports lastActivity per
  // day, so "is there anything new" needs no new endpoint — only a local mark.
  var SEEN_KEY = 'minkaRgFeedbackSeenV1';
  var SEEN_COUNT_KEY = 'minkaRgFeedbackSeenCountsV1';
  var newestEntryAt = { comment: 0, suggestion: 0 };
  var globalEntryCounts = { comment: null, suggestion: null };
  var globalEntryCountsLoadedAt = {};
  var globalEntryCountLoads = {};
  var reactions = [
    { key: 'excellent', emoji: '😍', label: 'Lieliski' },
    { key: 'good', emoji: '🙂', label: 'Labi' },
    { key: 'ok', emoji: '😐', label: 'Normāli' },
    { key: 'bad', emoji: '😞', label: 'Slikti' },
    { key: 'terrible', emoji: '😠', label: 'Ļoti slikti' }
  ];
  // Purely visual mapping for the mood blob. Keys are the existing reaction
  // keys — no parallel mood system, no extra storage, no extra requests.
  // Every shape/face path keeps the same command structure so the browser can
  // interpolate `d` between moods instead of snapping.
  var moodVisuals = {
    excellent: {
      path: 'M50 14C69.88 14 86 30.12 86 50C86 69.88 69.88 86 50 86C30.12 86 14 69.88 14 50C14 30.12 30.12 14 50 14Z',
      emoji: '😍', color1: '#a7f3d0', color2: '#34d399', glow: 'rgba(74,222,128,.34)', label: 'Lieliski',
      brows: false, lids: true, openMouth: true,
      face: {
        browL: 'M30 34C33.5 33 38 33 42.5 33', browR: 'M70 34C66.5 33 62 33 57.5 33',
        lidL: 'M27.5 48C31 41 42 41 45.5 48', lidR: 'M54.5 48C58 41 69 41 72.5 48',
        eyeWhiteL: 'M36.5 35.8C41.03 35.8 44.7 39.83 44.7 44.8C44.7 49.77 41.03 53.8 36.5 53.8C31.97 53.8 28.3 49.77 28.3 44.8C28.3 39.83 31.97 35.8 36.5 35.8Z',
        eyeWhiteR: 'M63.5 35.8C68.03 35.8 71.7 39.83 71.7 44.8C71.7 49.77 68.03 53.8 63.5 53.8C58.97 53.8 55.3 49.77 55.3 44.8C55.3 39.83 58.97 35.8 63.5 35.8Z',
        pupilL: 'M36.8 41.1C39.17 41.1 41.1 43.03 41.1 45.4C41.1 47.77 39.17 49.7 36.8 49.7C34.43 49.7 32.5 47.77 32.5 45.4C32.5 43.03 34.43 41.1 36.8 41.1Z',
        pupilR: 'M63.2 41.1C65.57 41.1 67.5 43.03 67.5 45.4C67.5 47.77 65.57 49.7 63.2 49.7C60.83 49.7 58.9 47.77 58.9 45.4C58.9 43.03 60.83 41.1 63.2 41.1Z',
        glintL: 'M34.7 41.4C35.58 41.4 36.3 42.12 36.3 43C36.3 43.88 35.58 44.6 34.7 44.6C33.82 44.6 33.1 43.88 33.1 43C33.1 42.12 33.82 41.4 34.7 41.4Z',
        glintR: 'M61.1 41.4C61.98 41.4 62.7 42.12 62.7 43C62.7 43.88 61.98 44.6 61.1 44.6C60.22 44.6 59.5 43.88 59.5 43C59.5 42.12 60.22 41.4 61.1 41.4Z',
        mouth: 'M39 61C43.5 67 56.5 67 61 61',
        mouthOpen: 'M33 57C33 57 67 57 67 57C67 68.5 59.4 76 50 76C40.6 76 33 68.5 33 57Z',
        teeth: 'M36.5 58.2C36.5 58.2 63.5 58.2 63.5 58.2C63.5 64.6 57.4 68.4 50 68.4C42.6 68.4 36.5 64.6 36.5 58.2Z'
      }
    },
    good: {
      path: 'M50 14C69.88 14 86 30.12 86 50C86 69.88 69.88 86 50 86C30.12 86 14 69.88 14 50C14 30.12 30.12 14 50 14Z',
      emoji: '🙂', color1: '#99f6e4', color2: '#2dd4bf', glow: 'rgba(45,212,191,.32)', label: 'Labi',
      brows: false, lids: false, openMouth: false,
      face: {
        browL: 'M30 34C33.5 33 38 33 42.5 33', browR: 'M70 34C66.5 33 62 33 57.5 33',
        lidL: 'M27.5 48C31 41 42 41 45.5 48', lidR: 'M54.5 48C58 41 69 41 72.5 48',
        eyeWhiteL: 'M36.5 35.8C41.03 35.8 44.7 39.83 44.7 44.8C44.7 49.77 41.03 53.8 36.5 53.8C31.97 53.8 28.3 49.77 28.3 44.8C28.3 39.83 31.97 35.8 36.5 35.8Z',
        eyeWhiteR: 'M63.5 35.8C68.03 35.8 71.7 39.83 71.7 44.8C71.7 49.77 68.03 53.8 63.5 53.8C58.97 53.8 55.3 49.77 55.3 44.8C55.3 39.83 58.97 35.8 63.5 35.8Z',
        pupilL: 'M36.8 41.1C39.17 41.1 41.1 43.03 41.1 45.4C41.1 47.77 39.17 49.7 36.8 49.7C34.43 49.7 32.5 47.77 32.5 45.4C32.5 43.03 34.43 41.1 36.8 41.1Z',
        pupilR: 'M63.2 41.1C65.57 41.1 67.5 43.03 67.5 45.4C67.5 47.77 65.57 49.7 63.2 49.7C60.83 49.7 58.9 47.77 58.9 45.4C58.9 43.03 60.83 41.1 63.2 41.1Z',
        glintL: 'M34.7 41.4C35.58 41.4 36.3 42.12 36.3 43C36.3 43.88 35.58 44.6 34.7 44.6C33.82 44.6 33.1 43.88 33.1 43C33.1 42.12 33.82 41.4 34.7 41.4Z',
        glintR: 'M61.1 41.4C61.98 41.4 62.7 42.12 62.7 43C62.7 43.88 61.98 44.6 61.1 44.6C60.22 44.6 59.5 43.88 59.5 43C59.5 42.12 60.22 41.4 61.1 41.4Z',
        mouth: 'M39 61C43.5 67 56.5 67 61 61',
        mouthOpen: 'M33 57C33 57 67 57 67 57C67 68.5 59.4 76 50 76C40.6 76 33 68.5 33 57Z',
        teeth: 'M36.5 58.2C36.5 58.2 63.5 58.2 63.5 58.2C63.5 64.6 57.4 68.4 50 68.4C42.6 68.4 36.5 64.6 36.5 58.2Z'
      }
    },
    ok: {
      path: 'M50 14C69.88 14 86 30.12 86 50C86 69.88 69.88 86 50 86C30.12 86 14 69.88 14 50C14 30.12 30.12 14 50 14Z',
      emoji: '😐', color1: '#e2e8f0', color2: '#94a3b8', glow: 'rgba(148,163,184,.26)', label: 'Normāli',
      brows: false, lids: false, openMouth: false,
      face: {
        browL: 'M30 34C33.5 33 38 33 42.5 33', browR: 'M70 34C66.5 33 62 33 57.5 33',
        lidL: 'M27.5 48C31 41 42 41 45.5 48', lidR: 'M54.5 48C58 41 69 41 72.5 48',
        eyeWhiteL: 'M36.5 38C40.92 38 44.5 41.22 44.5 45.2C44.5 49.18 40.92 52.4 36.5 52.4C32.08 52.4 28.5 49.18 28.5 45.2C28.5 41.22 32.08 38 36.5 38Z',
        eyeWhiteR: 'M63.5 38C67.92 38 71.5 41.22 71.5 45.2C71.5 49.18 67.92 52.4 63.5 52.4C59.08 52.4 55.5 49.18 55.5 45.2C55.5 41.22 59.08 38 63.5 38Z',
        pupilL: 'M36.5 41.2C38.71 41.2 40.5 42.99 40.5 45.2C40.5 47.41 38.71 49.2 36.5 49.2C34.29 49.2 32.5 47.41 32.5 45.2C32.5 42.99 34.29 41.2 36.5 41.2Z',
        pupilR: 'M63.5 41.2C65.71 41.2 67.5 42.99 67.5 45.2C67.5 47.41 65.71 49.2 63.5 49.2C61.29 49.2 59.5 47.41 59.5 45.2C59.5 42.99 61.29 41.2 63.5 41.2Z',
        glintL: 'M34.5 41.9C35.33 41.9 36 42.57 36 43.4C36 44.23 35.33 44.9 34.5 44.9C33.67 44.9 33 44.23 33 43.4C33 42.57 33.67 41.9 34.5 41.9Z',
        glintR: 'M61.5 41.9C62.33 41.9 63 42.57 63 43.4C63 44.23 62.33 44.9 61.5 44.9C60.67 44.9 60 44.23 60 43.4C60 42.57 60.67 41.9 61.5 41.9Z',
        mouth: 'M41 63C44 63 56 63 59 63',
        mouthOpen: 'M33 57C33 57 67 57 67 57C67 68.5 59.4 76 50 76C40.6 76 33 68.5 33 57Z',
        teeth: 'M36.5 58.2C36.5 58.2 63.5 58.2 63.5 58.2C63.5 64.6 57.4 68.4 50 68.4C42.6 68.4 36.5 64.6 36.5 58.2Z'
      }
    },
    bad: {
      path: 'M50 14C69.88 14 86 30.12 86 50C86 69.88 69.88 86 50 86C30.12 86 14 69.88 14 50C14 30.12 30.12 14 50 14Z',
      emoji: '😞', color1: '#fed7aa', color2: '#f97316', glow: 'rgba(249,115,22,.30)', label: 'Slikti',
      brows: false, lids: true, openMouth: false,
      face: {
        browL: 'M29.5 36.5C33 35 38 32.8 42.5 31.5', browR: 'M70.5 36.5C67 35 62 32.8 57.5 31.5',
        lidL: 'M28 44C31.5 45.2 42 46.8 45.5 47.6', lidR: 'M72 44C68.5 45.2 58 46.8 54.5 47.6',
        eyeWhiteL: 'M36.5 38.6C40.81 38.6 44.3 42 44.3 46.2C44.3 50.4 40.81 53.8 36.5 53.8C32.19 53.8 28.7 50.4 28.7 46.2C28.7 42 32.19 38.6 36.5 38.6Z',
        eyeWhiteR: 'M63.5 38.6C67.81 38.6 71.3 42 71.3 46.2C71.3 50.4 67.81 53.8 63.5 53.8C59.19 53.8 55.7 50.4 55.7 46.2C55.7 42 59.19 38.6 63.5 38.6Z',
        pupilL: 'M36.5 43.5C38.76 43.5 40.6 45.34 40.6 47.6C40.6 49.86 38.76 51.7 36.5 51.7C34.24 51.7 32.4 49.86 32.4 47.6C32.4 45.34 34.24 43.5 36.5 43.5Z',
        pupilR: 'M63.5 43.5C65.76 43.5 67.6 45.34 67.6 47.6C67.6 49.86 65.76 51.7 63.5 51.7C61.24 51.7 59.4 49.86 59.4 47.6C59.4 45.34 61.24 43.5 63.5 43.5Z',
        glintL: 'M34.5 45.2C35.27 45.2 35.9 45.83 35.9 46.6C35.9 47.37 35.27 48 34.5 48C33.73 48 33.1 47.37 33.1 46.6C33.1 45.83 33.73 45.2 34.5 45.2Z',
        glintR: 'M61.5 45.2C62.27 45.2 62.9 45.83 62.9 46.6C62.9 47.37 62.27 48 61.5 48C60.73 48 60.1 47.37 60.1 46.6C60.1 45.83 60.73 45.2 61.5 45.2Z',
        mouth: 'M40 67.5C44 60.5 56 60.5 60 67.5',
        mouthOpen: 'M33 57C33 57 67 57 67 57C67 68.5 59.4 76 50 76C40.6 76 33 68.5 33 57Z',
        teeth: 'M36.5 58.2C36.5 58.2 63.5 58.2 63.5 58.2C63.5 64.6 57.4 68.4 50 68.4C42.6 68.4 36.5 64.6 36.5 58.2Z'
      }
    },
    terrible: {
      path: 'M50 14C69.88 14 86 30.12 86 50C86 69.88 69.88 86 50 86C30.12 86 14 69.88 14 50C14 30.12 30.12 14 50 14Z',
      emoji: '😠', color1: '#fecdd3', color2: '#ef4444', glow: 'rgba(244,63,94,.32)', label: 'Ļoti slikti',
      brows: true, lids: false, openMouth: false,
      face: {
        browL: 'M29.5 31.5C33 33 38 35.4 42.5 37', browR: 'M70.5 31.5C67 33 62 35.4 57.5 37',
        lidL: 'M27.5 48C31 41 42 41 45.5 48', lidR: 'M54.5 48C58 41 69 41 72.5 48',
        eyeWhiteL: 'M36.5 39.2C41.03 39.2 44.7 42.15 44.7 45.8C44.7 49.45 41.03 52.4 36.5 52.4C31.97 52.4 28.3 49.45 28.3 45.8C28.3 42.15 31.97 39.2 36.5 39.2Z',
        eyeWhiteR: 'M63.5 39.2C68.03 39.2 71.7 42.15 71.7 45.8C71.7 49.45 68.03 52.4 63.5 52.4C58.97 52.4 55.3 49.45 55.3 45.8C55.3 42.15 58.97 39.2 63.5 39.2Z',
        pupilL: 'M36.5 42C38.76 42 40.6 43.84 40.6 46.1C40.6 48.36 38.76 50.2 36.5 50.2C34.24 50.2 32.4 48.36 32.4 46.1C32.4 43.84 34.24 42 36.5 42Z',
        pupilR: 'M63.5 42C65.76 42 67.6 43.84 67.6 46.1C67.6 48.36 65.76 50.2 63.5 50.2C61.24 50.2 59.4 48.36 59.4 46.1C59.4 43.84 61.24 42 63.5 42Z',
        glintL: 'M34.5 43.4C35.22 43.4 35.8 43.98 35.8 44.7C35.8 45.42 35.22 46 34.5 46C33.78 46 33.2 45.42 33.2 44.7C33.2 43.98 33.78 43.4 34.5 43.4Z',
        glintR: 'M61.5 43.4C62.22 43.4 62.8 43.98 62.8 44.7C62.8 45.42 62.22 46 61.5 46C60.78 46 60.2 45.42 60.2 44.7C60.2 43.98 60.78 43.4 61.5 43.4Z',
        mouth: 'M38.5 68.5C43 60 57 60 61.5 68.5',
        mouthOpen: 'M33 57C33 57 67 57 67 57C67 68.5 59.4 76 50 76C40.6 76 33 68.5 33 57Z',
        teeth: 'M36.5 58.2C36.5 58.2 63.5 58.2 63.5 58.2C63.5 64.6 57.4 68.4 50 68.4C42.6 68.4 36.5 64.6 36.5 58.2Z'
      }
    },
    _none: {
      path: 'M50 14C69.88 14 86 30.12 86 50C86 69.88 69.88 86 50 86C30.12 86 14 69.88 14 50C14 30.12 30.12 14 50 14Z',
      emoji: '🙂', color1: '#e6ecfb', color2: '#8393c2', glow: 'rgba(139,157,201,.26)', label: '',
      brows: false, lids: false, openMouth: false,
      face: {
        browL: 'M30 34C33.5 33 38 33 42.5 33', browR: 'M70 34C66.5 33 62 33 57.5 33',
        lidL: 'M27.5 48C31 41 42 41 45.5 48', lidR: 'M54.5 48C58 41 69 41 72.5 48',
        eyeWhiteL: 'M36.5 35.8C41.14 35.8 44.9 39.83 44.9 44.8C44.9 49.77 41.14 53.8 36.5 53.8C31.86 53.8 28.1 49.77 28.1 44.8C28.1 39.83 31.86 35.8 36.5 35.8Z',
        eyeWhiteR: 'M63.5 35.8C68.14 35.8 71.9 39.83 71.9 44.8C71.9 49.77 68.14 53.8 63.5 53.8C58.86 53.8 55.1 49.77 55.1 44.8C55.1 39.83 58.86 35.8 63.5 35.8Z',
        pupilL: 'M36.5 40.9C38.93 40.9 40.9 42.87 40.9 45.3C40.9 47.73 38.93 49.7 36.5 49.7C34.07 49.7 32.1 47.73 32.1 45.3C32.1 42.87 34.07 40.9 36.5 40.9Z',
        pupilR: 'M63.5 40.9C65.93 40.9 67.9 42.87 67.9 45.3C67.9 47.73 65.93 49.7 63.5 49.7C61.07 49.7 59.1 47.73 59.1 45.3C59.1 42.87 61.07 40.9 63.5 40.9Z',
        glintL: 'M34.4 41.3C35.28 41.3 36 42.02 36 42.9C36 43.78 35.28 44.5 34.4 44.5C33.52 44.5 32.8 43.78 32.8 42.9C32.8 42.02 33.52 41.3 34.4 41.3Z',
        glintR: 'M61.4 41.3C62.28 41.3 63 42.02 63 42.9C63 43.78 62.28 44.5 61.4 44.5C60.52 44.5 59.8 43.78 59.8 42.9C59.8 42.02 60.52 41.3 61.4 41.3Z',
        mouth: 'M41 62C44.5 66 55.5 66 59 62',
        mouthOpen: 'M33 57C33 57 67 57 67 57C67 68.5 59.4 76 50 76C40.6 76 33 68.5 33 57Z',
        teeth: 'M36.5 58.2C36.5 58.2 63.5 58.2 63.5 58.2C63.5 64.6 57.4 68.4 50 68.4C42.6 68.4 36.5 64.6 36.5 58.2Z'
      }
    }
  };
  var moodFaceParts = ['browL', 'browR', 'lidL', 'lidR', 'eyeWhiteL', 'eyeWhiteR', 'pupilL', 'pupilR', 'glintL', 'glintR', 'mouth', 'mouthOpen', 'teeth'];
  var moodFillParts = ['eyeWhiteL', 'eyeWhiteR', 'pupilL', 'pupilR', 'glintL', 'glintR', 'mouthOpen', 'teeth'];
  var moodBlobKey = null;   // last committed mood, so a preview can be undone
  var moodRenderedKey = null;
  var moodBoredTimer = 0;
  var moodBoredSince = 0;
  var moodBoredDay = '';
  var moodLiquidTimer = 0;
  // How long the card waits before it admits nobody has rated this shift. The
  // old 18 s meant the face went to sleep during a glance at the page, which
  // read as "the app is asleep" rather than "no ratings yet".
  var MOOD_BORED_DELAY = 90000;

  function shiftDayKey() {
    var selected = String(window.__activeDateStr || '').trim();
    var selectedMatch = selected.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (selectedMatch) return selectedMatch[3] + '-' + selectedMatch[2] + '-' + selectedMatch[1];
    var d = new Date();
    if (d.getHours() < 8) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function liveShiftDayKey() {
    var today = String(window.__g_todayStr || '').trim();
    var match = today.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) return match[3] + '-' + match[2] + '-' + match[1];
    var d = new Date();
    if (d.getHours() < 8) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function displayDay(day) {
    var parts = String(day || '').split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] + '.' : String(day || '');
  }
  function compactDay(day) {
    var parts = String(day || '').split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0].slice(-2) : String(day || '');
  }
  function displayEntryTime(item) {
    var date = new Date(Number(item.createdAt) || item.createdAt || Date.now());
    var time = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    return displayDay(item.date || item.shiftDay) + ' · ' + time;
  }
  function feedbackUrl(path) {
    var base = String(window.MINKA_FEEDBACK_API_BASE || '').replace(/\/$/, '');
    return base ? base + path : '';
  }
  function newClientId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'rg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  }
  function newEditToken() {
    if (!window.crypto || typeof window.crypto.getRandomValues !== 'function' || typeof window.btoa !== 'function') return '';
    var bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    var binary = '';
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; }
    catch (_e) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_e) {}
  }
  function readSeenAt(kind) {
    var all = readJson(SEEN_KEY, {});
    return Math.max(0, Number(all && all[kind]) || 0);
  }
  function markSeen(kind, at) {
    var all = readJson(SEEN_KEY, {});
    if (!all || typeof all !== 'object') all = {};
    all[kind] = Math.max(Number(all[kind]) || 0, Number(at) || Date.now());
    writeJson(SEEN_KEY, all);
    // Remember how many entries each day held at this moment; the difference
    // against the live count is exactly what arrived afterwards.
    var seenCounts = readJson(SEEN_COUNT_KEY, {});
    if (!seenCounts || typeof seenCounts !== 'object') seenCounts = {};
    var current = readJson(ENTRY_COUNT_KEY, {});
    Object.keys(current || {}).forEach(function (day) {
      var dayCounts = seenCounts[day] || { comment: 0, suggestion: 0 };
      dayCounts[kind] = Math.max(0, Number(current[day] && current[day][kind]) || 0);
      seenCounts[day] = dayCounts;
    });
    writeJson(SEEN_COUNT_KEY, seenCounts);
    paintEntryCounts();
  }
  // How many entries landed on the live shift day since this device last read
  // the feed. Only today is counted — an older day filling up is history, not
  // news, and the card should not shout about it.
  function newTodayCount(kind) {
    var day = liveShiftDayKey();
    var current = readJson(ENTRY_COUNT_KEY, {});
    var seenCounts = readJson(SEEN_COUNT_KEY, {});
    var now = Math.max(0, Number(current && current[day] && current[day][kind]) || 0);
    var before = Math.max(0, Number(seenCounts && seenCounts[day] && seenCounts[day][kind]) || 0);
    // Entries this device wrote itself are not news to it.
    return Math.max(0, now - before);
  }
  function hasUnseen(kind) {
    return newestEntryAt[kind] > 0 && newestEntryAt[kind] > readSeenAt(kind);
  }
  function saveServerEntryCounts(day, counts) {
    var all = readJson(ENTRY_COUNT_KEY, {});
    var current = all[day] || { comment: 0, suggestion: 0 };
    ['comment', 'suggestion'].forEach(function (kind) {
      if (counts && counts[kind] != null) current[kind] = Math.max(0, Number(counts[kind]) || 0);
    });
    all[day] = current;
    writeJson(ENTRY_COUNT_KEY, all);
  }
  function paintEntryCounts() {
    var allServer = readJson(ENTRY_COUNT_KEY, {});
    var local = { comment: 0, suggestion: 0 };
    var localItems = readJson(TEXT_KEY, []);
    if (Array.isArray(localItems)) {
      localItems.forEach(function (item) {
        if (item && item.pending && (item.type === 'comment' || item.type === 'suggestion')) local[item.type] += 1;
      });
    }
    list.querySelectorAll('[data-rg-action-count]').forEach(function (badge) {
      var kind = badge.dataset.rgActionCount;
      var cachedTotal = Object.keys(allServer).reduce(function (sum, day) {
        return sum + Math.max(0, Number(allServer[day] && allServer[day][kind]) || 0);
      }, 0);
      var serverTotal = globalEntryCounts[kind] == null
        ? cachedTotal
        : Math.max(0, Number(globalEntryCounts[kind]) || 0);
      var count = serverTotal + Math.max(0, Number(local[kind]) || 0);
      var fresh = newTodayCount(kind);
      badge.textContent = count ? String(count) : '';
      badge.classList.remove('is-new');
      badge.setAttribute('aria-label', count ? count + ' ieraksti visās dienās' : 'Nav ierakstu');
      var button = badge.closest('.rg-pulse-write');
      if (!button) return;
      button.classList.toggle('has-new', fresh > 0);
      // "+2" beside the total: today's arrivals only, in its own colour. An
      // older day filling up is history and gets no badge.
      var holder = button.querySelector('.rg-feedback-badges');
      if (!holder) {
        holder = document.createElement('span');
        holder.className = 'rg-feedback-badges';
        badge.parentNode.insertBefore(holder, badge);
        holder.appendChild(badge);
      }
      var freshBadge = holder.querySelector('[data-rg-new-count]');
      if (!freshBadge) {
        freshBadge = document.createElement('small');
        freshBadge.className = 'rg-feedback-new-count';
        freshBadge.dataset.rgNewCount = kind;
        holder.insertBefore(freshBadge, badge);
      }
      freshBadge.textContent = fresh > 0 ? '+' + fresh : '';
      freshBadge.setAttribute('aria-label', fresh > 0 ? fresh + ' jauni šodien' : '');

    });
  }
  function loadGlobalEntryCount(kind, force) {
    var now = Date.now();
    if (!force && globalEntryCountsLoadedAt[kind] && now - globalEntryCountsLoadedAt[kind] < 15000) {
      return globalEntryCountLoads[kind] || Promise.resolve();
    }
    if (globalEntryCountLoads[kind]) return globalEntryCountLoads[kind];
    globalEntryCountsLoadedAt[kind] = now;
    globalEntryCountLoads[kind] = fetchFeedback('/api/feedback/days?kind=' + encodeURIComponent(kind) + '&limit=180')
      .then(function (data) {
        var days = Array.isArray(data.days) ? data.days : [];
        newestEntryAt[kind] = days.reduce(function (newest, item) {
          return Math.max(newest, Math.max(0, Number(item && item.lastActivity) || 0));
        }, 0);
        globalEntryCounts[kind] = data.total != null
          ? Math.max(0, Number(data.total) || 0)
          : days.reduce(function (sum, item) { return sum + Math.max(0, Number(item && item.count) || 0); }, 0);
        var storedCounts = readJson(ENTRY_COUNT_KEY, {});
        days.forEach(function (item) {
          if (!item || !item.date) return;
          var dayCounts = storedCounts[item.date] || { comment: 0, suggestion: 0 };
          dayCounts[kind] = Math.max(0, Number(item.count) || 0);
          storedCounts[item.date] = dayCounts;
        });
        writeJson(ENTRY_COUNT_KEY, storedCounts);
        paintEntryCounts();
      }).catch(function () {}).finally(function () {
        delete globalEntryCountLoads[kind];
      });
    return globalEntryCountLoads[kind];
  }
  function pulseCounts() {
    var all = readJson(PULSE_KEY, {});
    return all[shiftDayKey()] || {};
  }
  function pendingPulseCounts(day) {
    var all = readJson(PENDING_PULSE_KEY, {});
    return all[day] || {};
  }
  async function fetchFeedback(path, options) {
    var url = feedbackUrl(path);
    if (!url) throw new Error('Feedback API nav konfigurēts');
    var response = await fetch(url, Object.assign({ cache: 'no-store' }, options || {}));
    if (!response.ok) throw new Error('Feedback API ' + response.status);
    var data = await response.json();
    if (!data || data.ok !== true) throw new Error('Nederīga Feedback API atbilde');
    return data;
  }
  /* ── Buy me a coffee ────────────────────────────────────────────────────
     Just the QR code on the card — nothing to open or close. People scan it
     with their phone; on a computer the code itself is the link. The code is
     drawn in Buy Me a Coffee's own QR style and encodes BMC_URL exactly. */
  var BMC_URL = 'https://buymeacoffee.com/rgapp';
  var BMC_BUTTON_URL = 'https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=rgapp&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff';
  // The official button draws the supporter count in white on yellow, which is
  // hard to read. Fetch its SVG once and draw only that number black; if the
  // fetch fails the original image stays.
  var bmcButtonSrc = BMC_BUTTON_URL.replace(/&/g, '&amp;');
  var bmcButtonJob = null;
  function darkenBmcCount() {
    if (bmcButtonJob || typeof fetch !== 'function' || !window.URL || typeof URL.createObjectURL !== 'function') return;
    bmcButtonJob = fetch(BMC_BUTTON_URL).then(function (r) { return r.ok ? r.text() : ''; }).then(function (svg) {
      var dark = svg.replace(/(<text[^>]*text-anchor="middle"[^>]*fill=")white(")/, '$1#000000$2');
      if (!svg || dark === svg) return;
      bmcButtonSrc = URL.createObjectURL(new Blob([dark], { type: 'image/svg+xml' }));
      document.querySelectorAll('img.rg-bmc-button').forEach(function (img) { img.src = bmcButtonSrc; });
    }).catch(function () {});
  }
  function bmcQrMarkup() {
    darkenBmcCount();
    return '<a class="rg-bmc-qrblock" href="' + BMC_URL + '" target="_blank" rel="noopener" data-rg-bmc-qr="1"'
      + ' aria-label="Buy me a coffee: atbalsts RG attīstībai (buymeacoffee.com/rgapp)">'
      + '<img class="rg-bmc-qrimg" src="assets/coffee/bmc-qr.svg?v=official1" width="72" height="72" alt="">'
      + '<span class="rg-bmc-copy"><strong><img class="rg-bmc-button" src="' + bmcButtonSrc + '" width="235" height="50" alt="Buy me a coffee" decoding="async"></strong>'
      + '<em>Atbalsts RG attīstībai <span class="rg-bmc-heart">💚</span></em>'
      + '<small>RG ir bez maksas. Ja tas tev noder, vari uzsaukt kafiju projekta attīstībai. Tas palīdz RG uzturēt un pievienot jaunas iespējas. Pilnībā brīvprātīgi. Paldies! ☕</small></span></a>';
  }
  function reactionButtons() {
    return reactions.map(function (item) {
      return '<button class="rg-pulse-tap" type="button" data-rg-pulse="' + item.key + '" data-emoji="' + item.emoji + '" aria-label="' + item.label + '" aria-pressed="false">'
        + '<span aria-hidden="true">' + item.emoji + '</span><small class="rg-pulse-count" data-rg-count="' + item.key + '"></small><small class="rg-pulse-name" aria-hidden="true">' + item.label + '</small></button>';
    }).join('')
      + '<button class="rg-pulse-tap rg-pulse-own" type="button" data-rg-own-mood="1" aria-label="Savs emoji un pāris vārdi par maiņu" title="Savs emoji un pāris vārdi par maiņu">'
        + '<span aria-hidden="true"><svg class="rg-pulse-own-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
        + '<circle cx="12" cy="12" r="8.6"/><circle cx="9.1" cy="10.2" r=".9" fill="currentColor" stroke="none"/>'
        + '<circle cx="14.9" cy="10.2" r=".9" fill="currentColor" stroke="none"/><path d="M8.6 14.1c1.7 2 5.1 2 6.8 0"/></svg></span>'
        + '<small class="rg-pulse-name" aria-hidden="true">Savs vērtējums</small></button>';
  }
  // Fixed-size skeleton for the team curve (mood-trend.js fills it), so the
  // card has its final height from the first frame and nothing shifts later.
  function moodTrendMarkup() {
    var faces = '<span class="rg-trend-axis" aria-hidden="true"><i>😍</i><i>😠</i></span>';
    return '<button class="rg-trend" type="button" data-rg-trend title="Katrs vērtējums anonīmi nonāk komandas statistikā" aria-label="Komandas sajūta. Atvērt statistiku">'
      + '<span class="rg-trend-head"><span class="rg-trend-title">Komandas sajūta</span>'
      + '<span class="rg-trend-meta">14 dienas<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6.5 15 12l-5.5 5.5"/></svg></span></span>'
      + '<span class="rg-trend-plot">' + faces + '<svg class="rg-trend-svg" viewBox="0 0 280 44" aria-hidden="true" focusable="false"></svg></span>'
      + '</button>';
  }
  function moodBlobMarkup() {
    var base = moodVisuals._none;
    var facePath = function (part) {
      var kind = moodFillParts.indexOf(part) >= 0 ? 'rg-mood-fill rg-mood-' + part.replace(/[LR]$/, '') : 'rg-mood-line';
      return '<path class="' + kind + '" data-rg-face="' + part + '" d="' + base.face[part] + '" opacity="' + moodPartOpacity(part, base) + '"></path>';
    };
    return '<div class="rg-mood-stage is-idle">'
      + '<span class="rg-mood-glow" style="color:' + base.glow + '"></span>'
      + '<span class="rg-mood-blob-wrap">'
      + '<svg class="rg-mood-blob" viewBox="0 0 100 100" focusable="false">'
      // The fill fades out before the outline, so the blob melts into the card
      // instead of ending on a hard vector edge — no blur filter needed.
      + '<defs><radialGradient id="rgMoodBlobGrad" cx="47%" cy="43%" r="56%">'
      + '<stop class="rg-mood-blob-stop" data-rg-stop="c1" offset="0%" style="stop-color:' + base.color1 + '"></stop>'
      + '<stop class="rg-mood-blob-stop" data-rg-stop="c1" offset="34%" style="stop-color:' + base.color1 + '"></stop>'
      + '<stop class="rg-mood-blob-stop" data-rg-stop="c2" offset="68%" style="stop-color:' + base.color2 + '"></stop>'
      + '<stop class="rg-mood-blob-stop" data-rg-stop="c2" offset="86%" stop-opacity=".58" style="stop-color:' + base.color2 + '"></stop>'
      + '<stop class="rg-mood-blob-stop" data-rg-stop="c2" offset="100%" stop-opacity="0" style="stop-color:' + base.color2 + '"></stop>'
      + '</radialGradient>'
      + '<radialGradient id="rgMoodBlobSheen" cx="34%" cy="24%" r="54%">'
      + '<stop offset="0%" stop-color="#ffffff" stop-opacity=".40"></stop>'
      + '<stop offset="62%" stop-color="#ffffff" stop-opacity="0"></stop>'
      + '</radialGradient>'
      + '<radialGradient id="rgMoodGlassShell" cx="34%" cy="24%" r="72%">'
      + '<stop offset="0%" stop-color="#ffffff" stop-opacity=".20"></stop>'
      + '<stop offset="42%" stop-color="#bfe8ff" stop-opacity=".06"></stop>'
      + '<stop offset="78%" stop-color="#07111f" stop-opacity=".16"></stop>'
      + '<stop offset="100%" stop-color="#020712" stop-opacity=".48"></stop>'
      + '</radialGradient>'
      + '<linearGradient id="rgMoodGlassRim" x1="16%" y1="10%" x2="82%" y2="92%">'
      + '<stop offset="0%" stop-color="#ffffff" stop-opacity=".80"></stop>'
      + '<stop offset="38%" stop-color="#bfe8ff" stop-opacity=".28"></stop>'
      + '<stop offset="72%" stop-color="#17263a" stop-opacity=".70"></stop>'
      + '<stop offset="100%" stop-color="#f5fbff" stop-opacity=".46"></stop>'
      + '</linearGradient></defs>'
      + '<circle class="rg-mood-glass-shell" cx="50" cy="50" r="44"></circle>'
      + '<circle class="rg-mood-glass-inner" cx="50" cy="50" r="41.5"></circle>'
      + '<path class="rg-mood-blob-shape" fill="url(#rgMoodBlobGrad)" d="' + base.path + '"></path>'
      + '<path class="rg-mood-blob-sheen" fill="url(#rgMoodBlobSheen)" d="' + base.path + '"></path>'
      + '<path class="rg-mood-blob-shape rg-mood-blob-fatigue" d="' + base.path + '"></path>'
      + '<path class="rg-mood-glass-highlight" d="M18 38 C22 22 35 12 51 11"></path>'
      + '<path class="rg-mood-glass-shadowline" d="M27 84 C45 92 67 87 79 72"></path>'
      + '<g class="rg-mood-face">' + facePath('browL') + facePath('browR')
      + '<g class="rg-mood-eyes">'
      + facePath('eyeWhiteL') + facePath('eyeWhiteR')
      + facePath('pupilL') + facePath('pupilR')
      + facePath('glintL') + facePath('glintR')
      + facePath('lidL') + facePath('lidR') + '</g>'
      + facePath('mouth') + facePath('mouthOpen') + facePath('teeth') + '</g>'
      + '</svg>'
      + '<span class="rg-mood-liquid-vessel" aria-hidden="true">'
      + '<i class="rg-mood-liquid rg-mood-liquid--coffee"></i>'
      + '<i class="rg-mood-liquid rg-mood-liquid--fatigue"></i>'
      + '</span>'
      + '<span class="rg-mood-fluent-face" data-rg-fluent-face aria-hidden="true">' + base.emoji + '</span>'
      + '<img class="rg-mood-glass-lens" src="assets/mood-glass-premium.webp?v=20260820b" width="512" height="512" alt="" aria-hidden="true" decoding="async">'
      + '<span class="rg-mood-ring" data-rg-ring></span>'
      + '</span>'
      + '<span class="rg-mood-side rg-mood-side--left" data-rg-chip="fatigue">'
      + '<span class="rg-mood-pill rg-mood-pill--fatigue"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor"></path></svg>'
      + '<b data-rg-fatigue-num>0%</b></span>'
      + '<span class="rg-mood-side-label">Nogurums</span></span>'
      + '<span class="rg-mood-side rg-mood-side--right">'
      + '<span class="rg-mood-pill rg-mood-pill--coffee" data-rg-chip="coffee">'
      + moodPillCupSvg() + '<b data-rg-coffee-num>0</b></span>'
      + '<span class="rg-mood-side-label" title="Šīs dežūras kafija">Dežūrā</span>'
      + '<button class="rg-mood-topbtn" type="button" data-rg-topbtn hidden'
      + ' title="Kafijas statistika">' + moodTopSvg()
      + '<span>Kafijas<br>statistika</span></button>'
      + '</span>'
      + '<span class="rg-mood-label">' + (base.label || '&nbsp;') + '</span>'
      + '</div>';
  }
  function moodCupSvg() {
    return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">'
      + '<rect x="3" y="4" width="8" height="8" fill="#c8842a"></rect><rect x="4" y="12" width="6" height="1" fill="#c8842a"></rect>'
      + '<rect x="11" y="5" width="2" height="1" fill="#c8842a"></rect><rect x="13" y="5" width="1" height="4" fill="#c8842a"></rect>'
      + '<rect x="11" y="8" width="2" height="1" fill="#c8842a"></rect><rect x="4" y="5" width="6" height="1" fill="#f0b860"></rect>'
      + '</svg>';
  }
  // Solid single-colour cup for the pill, where the full-colour mug would
  // disappear against the warm background.
  function moodPillCupSvg() {
    // Filled body, outlined handle: at 14px a stroked-only mug turns into a
    // dark smudge, while the silhouette still reads as a cup.
    return '<svg viewBox="0 0 20 20" aria-hidden="true">'
      + '<path fill="currentColor" d="M2.6 5.6h11v7.6a3.6 3.6 0 0 1-3.6 3.6H6.2a3.6 3.6 0 0 1-3.6-3.6V5.6Z"></path>'
      + '<path fill="none" stroke="currentColor" stroke-width="1.7" d="M14.2 7.6h1.1a2.6 2.6 0 0 1 0 5.2h-1.1"></path>'
      + '<path fill="currentColor" opacity=".45" d="M4.4 3.1a1 1 0 0 1 1 1v.6h-2v-.6a1 1 0 0 1 1-1Zm3.6 0a1 1 0 0 1 1 1v.6h-2v-.6a1 1 0 0 1 1-1Zm3.6 0a1 1 0 0 1 1 1v.6h-2v-.6a1 1 0 0 1 1-1Z"></path>'
      + '</svg>';
  }
  // The old pixel-art mark was unreadable at this size. Three rising bars is
  // the plainest "statistics" symbol there is.
  function moodTopSvg() {
    return '<svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">'
      + '<rect x="2" y="11" width="4" height="7" rx="1.2"></rect>'
      + '<rect x="8" y="7" width="4" height="11" rx="1.2"></rect>'
      + '<rect x="14" y="3" width="4" height="15" rx="1.2"></rect>'
      + '</svg>';
  }
  function moodInitials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2)
      .map(function (part) { return part.charAt(0).toLocaleUpperCase('lv-LV'); }).join('');
  }
  // Read-only snapshot of what the feedback card needs: today's staff, each
  // person's coffee count, the day's total, the all-time coffee top and the
  // shift's average fatigue.
  //
  // Cached on purpose. getCoffeeCount() re-parses the whole coffee store out of
  // localStorage once per name, and paintCounts() can run many times while the
  // grid is rebuilt on a day switch — recomputing there was pure waste.
  var moodStatsCache = { at: 0, day: null, data: null };
  function moodStats(force) {
    var day = String(window.__activeDateStr || '');
    var now = Date.now();
    if (!force && moodStatsCache.day === day && now - moodStatsCache.at < 900) return moodStatsCache.data;
    var names = [];
    var seen = {};
    var scores = [];
    var data = { total: null, top: [], fatigue: null, staff: [], sources: [] };
    list.querySelectorAll('.card.mk-mid-card[data-worker]').forEach(function (card) {
      var name = String(card.getAttribute('data-worker') || '').trim();
      var key = name.toLocaleLowerCase('lv-LV');
      if (!name || seen[key]) return;
      seen[key] = true;
      names.push(name);
      var emojiNode = card.querySelector('.mk-mid-person-emoji');
      var emoji = String(emojiNode && emojiNode.textContent || '').trim();
      data.staff.push({
        name: name,
        key: key,
        emoji: emoji,
        initials: moodInitials(name),
        role: card.classList.contains('mk-mid-card-rd') ? 'rd' : 'rg',
        fatigue: null,
        coffee: 0,
        coffeeSources: []
      });
      /* Noguruma procenti kartītē tagad dzīvo apakšējās joslas ailē
         (.mk-mid-meta-value, piem. “50% ↗”). Vecais .mk-mid-fat-pct paliek kā
         rezerve, ja kāds skats vēl zīmē veco svītriņu rindu. */
      var fatigueNode = card.querySelector('.mk-mid-fat-pct') || card.querySelector('.mk-mid-meta-value');
      var value = parseInt(String(fatigueNode && fatigueNode.textContent || '').replace('%', ''), 10);
      if (Number.isFinite(value)) {
        data.staff[data.staff.length - 1].fatigue = value;
        scores.push(value);
      }
    });
    // Visible cards drive the worker bubbles. Coffee totals use the complete
    // duty roster, so a finished 12h worker can leave the constellation without
    // erasing what they drank from the 08:00–08:00 total.
    var coffeeNames = names.slice();
    var coffeeSeen = Object.assign({}, seen);
    if (typeof window.__minkaGetDutyRosterForDate === 'function') {
      try {
        (window.__minkaGetDutyRosterForDate(day) || []).forEach(function (worker) {
          var name = String(worker && worker.name || '').trim();
          var key = name.toLocaleLowerCase('lv-LV');
          if (!name || coffeeSeen[key]) return;
          coffeeSeen[key] = true;
          coffeeNames.push(name);
        });
      } catch (_error) {}
    }
    var coffeePeople = coffeeNames.map(function (name) {
      return { name: name, key: name.toLocaleLowerCase('lv-LV'), coffee: 0, coffeeSources: [] };
    });
    if (coffeeNames.length && typeof window.__minkaGetCoffeeDetailsForNames === 'function') {
      try {
        var details = window.__minkaGetCoffeeDetailsForNames(coffeeNames) || {};
        data.total = 0;
        coffeePeople.forEach(function (person) {
          var detail = details[person.key] || {};
          person.coffee = Math.max(0, Number(detail.count) || 0);
          person.coffeeSources = Array.isArray(detail.sources) ? detail.sources : [];
          data.total += person.coffee;
        });
        data.staff.forEach(function (person) {
          var detail = details[person.key] || {};
          person.coffee = Math.max(0, Number(detail.count) || 0);
          person.coffeeSources = Array.isArray(detail.sources) ? detail.sources : [];
        });
      } catch (_error) {}
    } else if (coffeeNames.length && typeof window.__minkaGetCoffeeCountsForNames === 'function') {
      try {
        var counts = window.__minkaGetCoffeeCountsForNames(coffeeNames) || {};
        data.total = 0;
        coffeePeople.forEach(function (person) {
          person.coffee = Math.max(0, Number(counts[person.key]) || 0);
          data.total += person.coffee;
        });
        data.staff.forEach(function (person) {
          person.coffee = Math.max(0, Number(counts[person.key]) || 0);
        });
      } catch (_error) {}
    } else if (coffeeNames.length && typeof window.__minkaGetCoffeeCountForName === 'function') {
      data.total = 0;
      coffeePeople.forEach(function (person) {
        try { person.coffee = Math.max(0, Number(window.__minkaGetCoffeeCountForName(person.name)) || 0); }
        catch (_error) { person.coffee = 0; }
        data.total += person.coffee;
      });
      data.staff.forEach(function (person) {
        try { person.coffee = Math.max(0, Number(window.__minkaGetCoffeeCountForName(person.name)) || 0); }
        catch (_error) { person.coffee = 0; }
      });
    }
    var sourceTotals = {};
    coffeePeople.forEach(function (person) {
      (person.coffeeSources || []).forEach(function (source) {
        sourceTotals[source.key] = (sourceTotals[source.key] || 0) + Math.max(0, Number(source.count) || 0);
      });
    });
    data.sources = Object.keys(sourceTotals).map(function (key) {
      return { key: key, count: sourceTotals[key] };
    }).filter(function (source) { return source.count > 0; })
      .sort(function (a, b) { return b.count - a.count; });
    if (typeof window.__minkaGetCoffeeLeaderboard === 'function') {
      try { data.top = window.__minkaGetCoffeeLeaderboard(3) || []; } catch (_error) {}
    }
    // The fatigue percentage is already rendered on every employee card, so it
    // is read straight off the DOM rather than recomputed.
    if (scores.length) {
      data.fatigue = Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length);
    }
    moodStatsCache = { at: now, day: day, data: data };
    return data;
  }
  // Dark ink on the light end of the scale, light ink on the red end.
  function moodFatigueInk(score) { return score > 45 ? '#12161d' : '#0b1a10'; }
  function moodFatigueColor(score) {
    if (score > 70) return '#ff6b5f';
    if (score > 20) return '#f5df4d';
    return '#35d07f';
  }
  // The liquid intentionally avoids yellow/amber, which reads as urine next
  // to transparent glass. Mint → violet → coral remains ordered and stays
  // visually separate from the brown coffee layer.
  function moodFatigueLiquidRgb(score) {
    var value = Math.max(0, Math.min(100, Number(score) || 0));
    var from, to, progress;
    if (value <= 35) {
      from = [52, 211, 153];
      to = [45, 212, 191];
      progress = value / 35;
    } else if (value <= 65) {
      from = [45, 212, 191];
      to = [139, 92, 246];
      progress = (value - 35) / 30;
    } else {
      from = [139, 92, 246];
      to = [251, 113, 133];
      progress = (value - 65) / 35;
    }
    return from.map(function (channel, index) {
      return Math.round(channel + (to[index] - channel) * progress);
    }).join(',');
  }
  function moodFatigueRgb(score) {
    if (score > 70) return '255,107,95';
    if (score > 20) return '245,223,77';
    return '53,208,127';
  }
  // Worker bubbles use three deliberately clean traffic-light colours. The
  // middle band is a bright lemon yellow rather than amber/brown, so it stays
  // fresh inside transparent glass.
  function moodPersonLiquidRgb(score) {
    if (score > 70) return '255,92,113';
    if (score > 20) return '245,229,72';
    return '46,214,145';
  }
  // Static staff constellation. It is laid out once per render and depth is
  // expressed with size, distance, opacity and stacking only — no idle motion.
  var MOOD_PERSON_DEPTHS = [0.04, 0.68, 0.24, 0.88, 0.43, 0.12, 0.76, 0.34, 0.58, 0.19, 0.82, 0.49];
  var MOOD_BUBBLE_VIEWS = [
    [0.94, -5], [0.98, 3], [0.90, 6], [0.96, -4],
    [0.92, 5], [1, 0], [0.95, -6], [0.91, 4]
  ];
  function moodScatterSeed(text) {
    var hash = 2166136261;
    String(text || '').split('').forEach(function (char) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    });
    return hash >>> 0;
  }
  function placeMoodStaff(ring) {
    var wrap = ring && ring.parentElement;
    var blob = wrap && wrap.querySelector('.rg-mood-blob');
    var people = ring ? [].slice.call(ring.querySelectorAll('.rg-mood-person')) : [];
    if (!blob || !people.length) return;
    var blobRect = blob.getBoundingClientRect();
    var blobSize = blobRect.width || 100;
    var card = ring.closest('.rg-feedback-card');
    var cardRect = card.getBoundingClientRect();
    var cx = blobRect.left + blobRect.width / 2;
    var cy = blobRect.top + blobRect.height / 2;
    var bounds = {
      l: cardRect.left - cx + 7, r: cardRect.right - cx - 7,
      t: cardRect.top - cy + 7, b: cardRect.bottom - cy - 7
    };
    var count = people.length;
    var baseSize = Math.max(23, Math.min(37, blobSize * (count > 9 ? .21 : count > 6 ? .245 : .285)));
    // Leave the horizontal centre clear for Nogurums and Kafija. People are
    // distributed over two open arcs instead of colliding with those pills.
    var topCount = Math.ceil(count / 2);
    var bottomCount = count - topCount;
    // No staff token may touch the central mood face. Depth is expressed with
    // size/opacity only; the centre remains an absolute exclusion zone.
    var centreTouchIndex = -1;
    // Alternate between the outer left/right slots first. Keeping the two
    // inner-bottom slots for last leaves a clean gap under the face.
    var bottomAngles = [42, 138, 68, 112, 24, 156, 90];
    /* A busy nine-person shift does not fit on one circular orbit without
       shrinking or hiding the final tokens. A deliberately uneven, fixed
       constellation uses the safe space around the face: everyone remains
       visible without turning the bubbles into obvious rows. */
    var useBusyRows = count >= 5;
    var busyRowMax = Math.max(topCount, bottomCount);
    var busyBaseSize = useBusyRows
      ? Math.max(30, Math.min(38, (bounds.r - bounds.l) / Math.max(1, busyRowMax * 1.42)))
      : 0;
    var staffOccupied = [];
    function nodeBox(node, pad) {
      if (!node) return null;
      var rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        l: rect.left - cx - pad, r: rect.right - cx + pad,
        t: rect.top - cy - pad, b: rect.bottom - cy + pad
      };
    }
    function hitsAny(box, boxes) {
      if (box.l < bounds.l || box.r > bounds.r || box.t < bounds.t || box.b > bounds.b) return true;
      return boxes.some(function (other) {
        return box.l < other.r && other.l < box.r && box.t < other.b && other.t < box.b;
      });
    }
    card.querySelectorAll('.rg-feedback-card-title, .rg-mood-side, .rg-mood-topbtn, .rg-mood-label, .rg-mood-now, .rg-pulse-taps, .rg-trend, .rg-feedback-card-actions, .rg-bmc-qrblock')
      .forEach(function (node) {
        var protectedText = node.classList.contains('rg-mood-label') || node.classList.contains('rg-mood-now') || node.classList.contains('rg-feedback-card-title');
        var box = nodeBox(node, protectedText ? 12 : 6);
        if (box) staffOccupied.push(box);
      });
    var faceBox = nodeBox(blob, 5);
    people.forEach(function (person, index) {
      var depth = MOOD_PERSON_DEPTHS[index % MOOD_PERSON_DEPTHS.length];
      var view = MOOD_BUBBLE_VIEWS[index % MOOD_BUBBLE_VIEWS.length];
      var onTop = index < topCount;
      var arcIndex = onTop ? index : index - topCount;
      var arcCount = onTop ? topCount : bottomCount;
      var degrees;
      if (onTop) {
        degrees = arcCount < 2 ? -90 : -150 + 120 * arcIndex / (arcCount - 1);
      } else {
        // Leave the bottom centre visually open under the face.
        degrees = bottomAngles[arcIndex % bottomAngles.length];
      }
      // Static perspective comes from size and distance, not motion. Keep the
      // foreground/background contrast strong but below the point where the
      // larger glass rims consume every free slot on a busy shift.
      var size = Math.max(28, Math.min(48, baseSize * (2.00 - depth * .75)));
      // Three deliberate depth planes use size, opacity and stacking. Only the
      // single selected token above the orb may graze its outer rim; side and
      // bottom tokens must stay completely visible.
      var isFar = depth >= .62;
      var isNear = depth <= .15;
      var canTouchCentre = index === centreTouchIndex;
      var baseRadius = canTouchCentre
        ? blobSize * .50 + size * .50 - 1
        : isNear
          ? blobSize * .50 + size * .54 + 9
          : blobSize * .50 + size * .54 + 11 + depth * 5;
      var coffeeExtra = person.querySelector('.rg-mood-person-coffee') ? 7 : 2;
      var chosen = null;
      if (useBusyRows) {
        size = Math.max(32, Math.min(46, busyBaseSize * (1.25 - depth * .48)));
        var busyVisualHalf = size * .59 + (coffeeExtra > 2 ? 4 : 0);
        var busyHalfWidth = Math.max(1, Math.min(-bounds.l, bounds.r) - busyVisualHalf);
        var busyTopX = arcCount === 5
          ? [-1, -.58, -.15, .38, 1]
          : arcCount === 4 ? [-1, -.35, .35, 1] : [-.78, 0, .78];
        var busyTopY = arcCount === 5
          ? [58, 0, 4, 10, 62]
          : arcCount === 4 ? [58, 0, 10, 62] : [44, 0, 48];
        var busyBottomX = arcCount === 4
          ? [-1, -.64, .64, 1]
          : arcCount === 3 ? [-.84, -.52, .55] : [-1, 1];
        var busyBottomY = arcCount === 4
          ? [-34, 12, 2, 16]
          : arcCount === 3 ? [-31, -10, -10] : [-18, 12];
        var busyXFactor = onTop
          ? busyTopX[Math.min(arcIndex, busyTopX.length - 1)]
          : busyBottomX[Math.min(arcIndex, busyBottomX.length - 1)];
        var busyYOffset = onTop
          ? busyTopY[Math.min(arcIndex, busyTopY.length - 1)]
          : busyBottomY[Math.min(arcIndex, busyBottomY.length - 1)];
        var busyX = busyXFactor * busyHalfWidth;
        var busyY = onTop
          ? bounds.t + busyVisualHalf + busyYOffset
          : blobSize * .50 + busyVisualHalf + busyYOffset;
        /* The constellation is only an anchor map. Validate each anchor
           against controls and already placed people, then nudge locally.
           This keeps the organic layout without ever stacking glass or
           hiding a coffee count behind the fatigue pill. */
        var busyNudges = [
          [0, 0], [0, -14], [-14, 0], [14, 0], [0, 14],
          [-18, -12], [18, -12], [-22, 14], [22, 14],
          [0, -28], [-34, 0], [34, 0], [0, 28]
        ];
        for (var busyAttempt = 0; busyAttempt < busyNudges.length && !chosen; busyAttempt++) {
          var busyCandidateX = busyX + busyNudges[busyAttempt][0];
          var busyCandidateY = busyY + busyNudges[busyAttempt][1];
          var busyBox = {
            l: busyCandidateX - busyVisualHalf, r: busyCandidateX + busyVisualHalf,
            t: busyCandidateY - busyVisualHalf, b: busyCandidateY + busyVisualHalf
          };
          var busyHitsCentre = faceBox
            && busyBox.l < faceBox.r && faceBox.l < busyBox.r
            && busyBox.t < faceBox.b && faceBox.t < busyBox.b;
          if (!busyHitsCentre && !hitsAny(busyBox, staffOccupied)) {
            chosen = { x: busyCandidateX, y: busyCandidateY, box: busyBox };
          }
        }
      }
      var angleOffsets = [0, -8, 8, -16, 16, -24, 24];
      var radiusOffsets = [0, 9, 18, -5, 27, 36, 45];
      for (var ri = 0; ri < radiusOffsets.length && !chosen; ri++) {
        for (var ai = 0; ai < angleOffsets.length; ai++) {
          var candidateAngle = (degrees + angleOffsets[ai]) * Math.PI / 180;
          var candidateRadius = baseRadius + radiusOffsets[ri];
          var x = Math.cos(candidateAngle) * candidateRadius;
          var y = Math.sin(candidateAngle) * candidateRadius;
          // The transparent lens extends beyond the token box. Reserve that
          // visible rim here so two glass shells never overlap.
          var halfW = size * .66 + coffeeExtra + 3;
          var halfH = size * .66 + coffeeExtra + 3;
          var candidateBox = { l: x - halfW, r: x + halfW, t: y - halfH, b: y + halfH };
          var hitsCentre = !canTouchCentre && faceBox
            && candidateBox.l < faceBox.r && faceBox.l < candidateBox.r
            && candidateBox.t < faceBox.b && faceBox.t < candidateBox.b;
          if (!hitsCentre && !hitsAny(candidateBox, staffOccupied)) {
            chosen = { x: x, y: y, box: candidateBox };
            break;
          }
        }
      }
      if (!chosen) {
        // Nine-person days can fill every regular orbit slot. Use a seeded
        // free-space search inside the same card instead of falling back onto
        // another employee or the heading.
        var personSeed = moodScatterSeed(person.title || index);
        for (var personAttempt = 0; personAttempt < 720; personAttempt++) {
          personSeed = (Math.imul(personSeed, 1664525) + 1013904223) >>> 0;
          var personRx = personSeed / 4294967296;
          personSeed = (Math.imul(personSeed, 1664525) + 1013904223) >>> 0;
          var personRy = personSeed / 4294967296;
          var personHalf = size * .66 + coffeeExtra + 3;
          var personX = bounds.l + personHalf + personRx * Math.max(1, bounds.r - bounds.l - personHalf * 2);
          var personY = bounds.t + personHalf + personRy * Math.max(1, bounds.b - bounds.t - personHalf * 2);
          var freeBox = {
            l: personX - personHalf, r: personX + personHalf,
            t: personY - personHalf, b: personY + personHalf
          };
          var freeHitsCentre = !canTouchCentre && faceBox
            && freeBox.l < faceBox.r && faceBox.l < freeBox.r
            && freeBox.t < faceBox.b && faceBox.t < freeBox.b;
          if (!freeHitsCentre && !hitsAny(freeBox, staffOccupied)) {
            chosen = { x: personX, y: personY, box: freeBox };
            break;
          }
        }
      }
      if (!chosen) {
        // Never fall back to a colliding orbit slot. On a packed shift, retry
        // this token compactly over the whole card; overlap is worse than a
        // slightly smaller far-away object.
        size = Math.min(size, 32);
        var compactSeed = moodScatterSeed((person.title || index) + ':compact');
        for (var compactPersonAttempt = 0; compactPersonAttempt < 1200; compactPersonAttempt++) {
          compactSeed = (Math.imul(compactSeed, 1664525) + 1013904223) >>> 0;
          var compactPersonRx = compactSeed / 4294967296;
          compactSeed = (Math.imul(compactSeed, 1664525) + 1013904223) >>> 0;
          var compactPersonRy = compactSeed / 4294967296;
          var compactPersonHalf = size * .68 + coffeeExtra + 3;
          var compactPersonX = bounds.l + compactPersonHalf + compactPersonRx * Math.max(1, bounds.r - bounds.l - compactPersonHalf * 2);
          var compactPersonY = bounds.t + compactPersonHalf + compactPersonRy * Math.max(1, bounds.b - bounds.t - compactPersonHalf * 2);
          var compactPersonBox = {
            l: compactPersonX - compactPersonHalf, r: compactPersonX + compactPersonHalf,
            t: compactPersonY - compactPersonHalf, b: compactPersonY + compactPersonHalf
          };
          var compactHitsCentre = !canTouchCentre && faceBox
            && compactPersonBox.l < faceBox.r && faceBox.l < compactPersonBox.r
            && compactPersonBox.t < faceBox.b && faceBox.t < compactPersonBox.b;
          if (!compactHitsCentre && !hitsAny(compactPersonBox, staffOccupied)) {
            chosen = { x: compactPersonX, y: compactPersonY, box: compactPersonBox };
            break;
          }
        }
      }
      if (!chosen) {
        /* Deterministic exhaustive fallback. It is intentionally allowed to
           reduce to 30px, but never to overlap another token or the face. */
        size = 30;
        var fallbackHalf = size * .68 + coffeeExtra + 3;
        for (var fallbackY = bounds.t + fallbackHalf; fallbackY <= bounds.b - fallbackHalf && !chosen; fallbackY += 5) {
          for (var fallbackX = bounds.l + fallbackHalf; fallbackX <= bounds.r - fallbackHalf; fallbackX += 5) {
            var fallbackBox = {
              l: fallbackX - fallbackHalf, r: fallbackX + fallbackHalf,
              t: fallbackY - fallbackHalf, b: fallbackY + fallbackHalf
            };
            var fallbackHitsCentre = faceBox
              && fallbackBox.l < faceBox.r && faceBox.l < fallbackBox.r
              && fallbackBox.t < faceBox.b && faceBox.t < fallbackBox.b;
            if (!fallbackHitsCentre && !hitsAny(fallbackBox, staffOccupied)) {
              chosen = { x: fallbackX, y: fallbackY, box: fallbackBox };
              break;
            }
          }
        }
      }
      if (!chosen) {
        /* Safety invariant: an impossible layout must never cover the face or
           another person. The busy-card height makes this unreachable for the
           supported 14-person maximum; QA checks every calendar date. */
        person.hidden = true;
        return;
      }
      person.hidden = false;
      person.style.setProperty('--rg-person-size', size.toFixed(1) + 'px');
      person.style.setProperty('--rg-x', chosen.x.toFixed(1) + 'px');
      person.style.setProperty('--rg-y', chosen.y.toFixed(1) + 'px');
      person.style.setProperty('--rg-person-opacity', (.98 - depth * .24).toFixed(2));
      person.style.setProperty('--rg-person-z', String(canTouchCentre || isNear ? 9 : isFar ? 2 : 5));
      person.style.setProperty('--rg-bubble-squash', String(view[0]));
      person.style.setProperty('--rg-bubble-roll', view[1] + 'deg');
      person.style.setProperty('--rg-bubble-content-x', (1 / Math.sqrt(view[0])).toFixed(3));
      if (chosen.box) staffOccupied.push(chosen.box);
    });
    var coffeeSources = [].slice.call(ring.querySelectorAll('.rg-mood-coffee-orbit'));
    if (!coffeeSources.length) return;
    var occupied = [];
    function addOccupied(node, pad) {
      if (!node) return;
      var rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var box = {
        l: rect.left - cx - pad, r: rect.right - cx + pad,
        t: rect.top - cy - pad, b: rect.bottom - cy + pad
      };
      occupied.push(box);
    }
    people.forEach(function (person) {
      addOccupied(person, Math.max(8, person.getBoundingClientRect().width * .18));
    });
    card.querySelectorAll('.rg-feedback-card-title, .rg-mood-side, .rg-mood-topbtn, .rg-mood-label, .rg-mood-now, .rg-pulse-taps, .rg-trend, .rg-feedback-card-actions, .rg-bmc-qrblock')
      .forEach(function (node) { addOccupied(node, 4); });
    addOccupied(blob, 4);
    function collidesWith(box, boxes) {
      if (box.l < bounds.l || box.r > bounds.r || box.t < bounds.t || box.b > bounds.b) return true;
      return boxes.some(function (other) {
        return box.l < other.r && other.l < box.r && box.t < other.b && other.t < box.b;
      });
    }
    var placements = [];
    /* Keep the scatter organic without allowing a seeded random run to dump
       every coffee source into one half of the card. Each source first gets a
       deterministic, pseudo-random quadrant; if that quadrant is full it may
       use the rest of the same half, and only then the whole free card. */
    var spreadSeed = moodScatterSeed(coffeeSources.map(function (source) {
      return source.dataset.rgCoffeeKey || '';
    }).join('|') + ':' + people.length);
    var verticalPhase = spreadSeed & 1;
    var horizontalPhase = (spreadSeed >>> 1) & 1;
    coffeeSources.forEach(function (source, index) {
      var depth = MOOD_PERSON_DEPTHS[(index + 4) % MOOD_PERSON_DEPTHS.length];
      var seed = moodScatterSeed(source.dataset.rgCoffeeKey || index);
      var chosen = null;
      function findCoffeeSlot(xMin, xMax, yMin, yMax, attempts, fixedSize) {
        if (!(xMax > xMin && yMax > yMin)) return null;
        for (var attempt = 0; attempt < attempts; attempt++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          var rx = seed / 4294967296;
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          var ry = seed / 4294967296;
          var x = xMin + rx * (xMax - xMin);
          var y = yMin + ry * (yMax - yMin);
          var distance = Math.sqrt(x * x + y * y);
          var near = Math.max(0, Math.min(1, 1 - (distance - blobSize * .56) / (blobSize * .92)));
          var size = fixedSize || Math.max(17, Math.min(40, 39 - depth * 23 + near));
          // The count sits just beside the SVG; this envelope matches the real
          // rendered badge closely without wasting most of the available gaps.
          var halfW = size / 2 + 10;
          var halfH = size / 2 + 4;
          var box = { l: x - halfW, r: x + halfW, t: y - halfH, b: y + halfH };
          if (!collidesWith(box, occupied)) return { x: x, y: y, box: box, size: size };
        }
        return null;
      }
      var xAllMin = bounds.l + 22;
      var xAllMax = bounds.r - 22;
      var yAllMin = bounds.t + 18;
      var yAllMax = bounds.b - 18;
      var wantsTop = (index + verticalPhase) % 2 === 0;
      var wantsLeft = (Math.floor(index / 2) + horizontalPhase) % 2 === 0;
      var xHalfMin = wantsLeft ? xAllMin : Math.max(8, xAllMin);
      var xHalfMax = wantsLeft ? Math.min(-8, xAllMax) : xAllMax;
      var yHalfMin = wantsTop ? yAllMin : Math.max(10, yAllMin);
      var yHalfMax = wantsTop ? Math.min(-10, yAllMax) : yAllMax;
      chosen = findCoffeeSlot(xHalfMin, xHalfMax, yHalfMin, yHalfMax, 180);
      if (!chosen) {
        chosen = findCoffeeSlot(xAllMin, xAllMax, yHalfMin, yHalfMax, 320);
      }
      if (!chosen) {
        chosen = findCoffeeSlot(xAllMin, xAllMax, yHalfMin, yHalfMax, 480, 19);
      }
      // Packed shifts may exhaust their assigned half. The final pass keeps
      // every source visible, but clustering is now the fallback, not default.
      if (!chosen) chosen = findCoffeeSlot(xAllMin, xAllMax, yAllMin, yAllMax, 640);
      if (!chosen) {
        // Preserve every source on the very fullest days: retry only that
        // badge a little smaller before considering it impossible to place.
        for (var compactAttempt = 0; compactAttempt < 720; compactAttempt++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          var compactRx = seed / 4294967296;
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          var compactRy = seed / 4294967296;
          var compactSize = 19;
          var compactHalfW = compactSize / 2 + 9;
          var compactHalfH = compactSize / 2 + 4;
          var compactX = bounds.l + 20 + compactRx * Math.max(1, bounds.r - bounds.l - 40);
          var compactY = bounds.t + 16 + compactRy * Math.max(1, bounds.b - bounds.t - 32);
          var compactBox = {
            l: compactX - compactHalfW, r: compactX + compactHalfW,
            t: compactY - compactHalfH, b: compactY + compactHalfH
          };
          if (!collidesWith(compactBox, occupied)) {
            chosen = { x: compactX, y: compactY, box: compactBox, size: compactSize };
            break;
          }
        }
      }
      if (!chosen) {
        source.hidden = true;
        return;
      }
      source.hidden = false;
      occupied.push(chosen.box);
      placements.push({ source: source, size: chosen.size, depth: depth, x: chosen.x, y: chosen.y });
    });
    placements.forEach(function (placement) {
      var source = placement.source;
      source.style.setProperty('--rg-coffee-size', placement.size.toFixed(1) + 'px');
      source.style.setProperty('--rg-x', placement.x.toFixed(1) + 'px');
      source.style.setProperty('--rg-y', placement.y.toFixed(1) + 'px');
      source.style.setProperty('--rg-coffee-opacity', (.99 - placement.depth * .42).toFixed(2));
      source.style.setProperty('--rg-coffee-z', String(Math.round((1 - placement.depth) * 8) + 1));
    });
  }
  function buildMoodStaff(ring, staff, coffeeSources) {
    var moodCard = ring && ring.closest('.rg-feedback-card');
    var staffList = staff || [];
    if (moodCard) {
      /* Five people already consume every safe corner around the face at the
         wide full-PWA breakpoint. Expand from five onward so the fifth worker
         always receives a real slot instead of reaching the hidden fallback. */
      moodCard.classList.toggle('rg-busy-staff', staffList.length >= 5);
      moodCard.classList.toggle('rg-six-staff', staffList.length === 6);
      moodCard.classList.toggle('rg-super-busy-staff', staffList.length >= 7
        && staffList.filter(function (person) { return Number(person.coffee) > 0; }).length >= 4);
    }
    var fragment = document.createDocumentFragment();
    staffList.slice(0, 14).forEach(function (person) {
      var item = document.createElement('span');
      item.className = 'rg-mood-person' + (person.role === 'rd' ? ' is-rd' : '') + (!person.emoji ? ' is-initials' : '');
      item.setAttribute('data-rg-worker', person.name || '');
      item.title = person.name + (person.coffee ? ' · kafija ×' + person.coffee : '');
      if (Number.isFinite(person.fatigue)) {
        var fatigueLevel = Math.max(0, Math.min(100, Number(person.fatigue) || 0));
        item.style.setProperty('--rg-person-fatigue', moodFatigueColor(person.fatigue));
        item.style.setProperty('--rg-person-fatigue-rgb', moodFatigueRgb(person.fatigue));
        item.style.setProperty('--rg-person-fatigue-level', fatigueLevel.toFixed(1) + '%');
        item.style.setProperty('--rg-person-liquid-rgb', moodPersonLiquidRgb(person.fatigue));
      }
      var glass = document.createElement('span');
      glass.className = 'rg-mood-person-glass';
      var liquidVessel = document.createElement('i');
      liquidVessel.className = 'rg-mood-person-liquid-vessel';
      var liquid = document.createElement('i');
      liquid.className = 'rg-mood-person-liquid';
      liquidVessel.appendChild(liquid);
      var identity = document.createElement('span');
      identity.className = 'rg-mood-person-emoji';
      identity.textContent = person.emoji || person.initials || '?';
      glass.appendChild(liquidVessel);
      glass.appendChild(identity);
      item.appendChild(glass);
      if (person.coffee > 0) {
        var coffee = document.createElement('small');
        coffee.className = 'rg-mood-person-coffee';
        var cup = document.createElement('span');
        cup.className = 'rg-mood-person-coffee-source';
        cup.innerHTML = moodCupSvg();
        var cupCount = document.createElement('b');
        cupCount.textContent = String(person.coffee);
        cup.appendChild(cupCount);
        coffee.appendChild(cup);
        item.appendChild(coffee);
      }
      fragment.appendChild(item);
    });
    (coffeeSources || []).slice(0, 7).forEach(function (source) {
      var item = document.createElement('span');
      item.className = 'rg-mood-coffee-orbit';
      item.dataset.rgCoffeeKey = source.key;
      item.title = (MOOD_SOURCE_NAMES[source.key] || source.key) + ': ' + source.count;
      item.innerHTML = moodSourceIcon(source.key);
      var count = document.createElement('b');
      count.textContent = String(source.count);
      item.appendChild(count);
      fragment.appendChild(item);
    });
    ring.replaceChildren(fragment);
    placeMoodStaff(ring);
  }
  // Every source gets its own place all the way around the blob — nothing is
  // ever collapsed into a "+N". Depth is what makes it read as an orbit rather
  // than a clock face: a badge sitting close to the blob is drawn bigger and
  // fully opaque, one pushed further out is drawn smaller and dimmer. The
  // depths come from a fixed scatter sequence, so the ring looks unordered but
  // never reshuffles between renders, and it keeps working for any number of
  // sources added later — nothing here is written per source count.
  var MOOD_DEPTHS = [0.06, 0.66, 0.28, 0.92, 0.44, 0.14, 0.78, 0.36, 0.58, 0.22];
  var MOOD_SRC_GAP = 10;
  var MOOD_SOURCES = ['philips', 'lofbergs', 'narvesen', 'monster', 'monsterultra', 'redbull', 'brite', 'cupcoffee', 'mycoffee'];
  var MOOD_SOURCE_NAMES = {
    philips: 'Philips', lofbergs: 'Löfbergs', narvesen: 'Narvesen', monster: 'Monster',
    monsterultra: 'Monster Ultra', redbull: 'Red Bull', brite: 'Brite', cupcoffee: 'Cita kafija', mycoffee: 'Mana kafija'
  };
  // Badge sizes follow the card's container queries, so a resize moves the
  // whole ring. Lay it out again instead of rebuilding the DOM.
  var moodRingResize = 0;
  var moodRingRetry = 0;
  var moodRingTries = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(moodRingResize);
    moodRingResize = window.setTimeout(function () {
      var refs = moodRefs();
      if (refs && refs.ring && refs.ring.firstChild) placeMoodStaff(refs.ring);
    }, 180);
  }, { passive: true });
  function paintMoodCoffee(force) {
    var refs = moodRefs();
    if (!refs) return;
    var stats = moodStats(force);
    var coffeeTotal = stats.total === null ? 0 : Math.max(0, Number(stats.total) || 0);
    var coffeeFill = coffeeTotal > 0 ? Math.min(28, 8 + Math.log(coffeeTotal + 1) / Math.LN2 * 5.5) : 0;
    var fatigueValue = stats.fatigue === null ? 0 : Math.max(0, Number(stats.fatigue) || 0);
    var fatigueFill = fatigueValue > 0 ? Math.min(53, 8 + fatigueValue * .45) : 0;
    refs.stage.style.setProperty('--rg-coffee-fill', coffeeFill.toFixed(1) + '%');
    refs.stage.style.setProperty('--rg-fatigue-fill', fatigueFill.toFixed(1) + '%');
    refs.stage.style.setProperty('--rg-fatigue-liquid-rgb', moodFatigueLiquidRgb(fatigueValue));
    refs.stage.classList.toggle('has-liquid', coffeeFill > .4 || fatigueFill > .4);
    var liquidSignature = coffeeFill.toFixed(1) + ':' + fatigueFill.toFixed(1);
    var previousLiquidSignature = refs.stage.dataset.rgLiquidLevel || '';
    refs.stage.dataset.rgLiquidLevel = liquidSignature;
    if (previousLiquidSignature && previousLiquidSignature !== liquidSignature) {
      refs.stage.classList.remove('is-sloshing');
      window.clearTimeout(moodLiquidTimer);
      requestAnimationFrame(function () {
        var live = moodRefs();
        if (!live || live.stage.dataset.rgLiquidLevel !== liquidSignature) return;
        live.stage.classList.add('is-sloshing');
        moodLiquidTimer = window.setTimeout(function () {
          var current = moodRefs();
          if (current) current.stage.classList.remove('is-sloshing');
        }, 760);
      });
    }
    var button = refs.topbtn;
    if (button) button.hidden = !(stats.top.length || stats.total !== null);
    // Mount the fixed side furniture before measuring the scatter field. If it
    // is revealed afterwards, a perfectly valid coffee position can suddenly
    // sit under the counter or statistics button.
    var preCoffee = refs.chips.coffee;
    if (preCoffee) {
      preCoffee.classList.toggle('is-mounted', stats.total !== null);
      var preRight = preCoffee.closest('.rg-mood-side');
      if (preRight) preRight.classList.toggle('is-mounted', stats.total !== null);
    }
    var preFatigue = refs.chips.fatigue;
    if (preFatigue) {
      preFatigue.classList.toggle('is-mounted', stats.fatigue !== null);
      preFatigue.classList.add('rg-mood-side');
    }
    var ring = refs.ring;
    if (ring) {
      var signature = stats.staff.map(function (person) {
        var sources = (person.coffeeSources || []).map(function (source) { return source.key + source.count; }).join(',');
        return [person.key, person.emoji, person.role, person.fatigue, person.coffee, sources].join(':');
      }).join('|') + '::' + stats.sources.map(function (source) { return source.key + source.count; }).join(',');
      if (ring.dataset.rgStaff !== signature) {
        buildMoodStaff(ring, stats.staff, stats.sources);
        ring.dataset.rgStaff = signature;
      }
    }
    var coffee = refs.chips.coffee;
    if (coffee) {
      coffee.classList.toggle('is-mounted', stats.total !== null);
      coffee.classList.toggle('rg-mood-pill', true);
      var num = coffee.querySelector('[data-rg-coffee-num]');
      if (num) num.textContent = String(stats.total === null ? 0 : stats.total);
      coffee.classList.toggle('is-on', (stats.total || 0) > 0);
      var rightSide = coffee.closest('.rg-mood-side');
      if (rightSide) rightSide.classList.toggle('is-mounted', stats.total !== null);
    }
    var fatigue = refs.chips.fatigue;
    if (fatigue) {
      fatigue.classList.toggle('is-mounted', stats.fatigue !== null);
      fatigue.classList.add('rg-mood-side');
      if (stats.fatigue !== null) {
        var fnum = fatigue.querySelector('[data-rg-fatigue-num]');
        if (fnum) fnum.textContent = stats.fatigue + '%';
        fatigue.style.setProperty('--rg-fat', moodFatigueColor(stats.fatigue));
        fatigue.style.setProperty('--rg-fat-ink', moodFatigueInk(stats.fatigue));
        refs.stage.style.setProperty('--rg-fatigue-wash', moodFatigueColor(stats.fatigue));
        refs.stage.style.setProperty('--rg-fatigue-alpha', (.12 + Math.min(100, stats.fatigue) * .0022).toFixed(3));
      } else {
        refs.stage.style.removeProperty('--rg-fatigue-wash');
        refs.stage.style.removeProperty('--rg-fatigue-alpha');
      }
    }
  }
  // Everything the badges have to stay off, in blob-centre coordinates. The
  // boxes are read rather than hard-coded, so the ring re-solves itself if the
  // pills, the title or the mood row ever move.
  function moodObstacles(card, cx, cy) {
    var boxes = [];
    var add = function (rect, padX, padY) {
      if (!rect || !rect.width || !rect.height) return;
      boxes.push({
        l: rect.left - cx - padX, r: rect.right - cx + padX,
        t: rect.top - cy - padY, b: rect.bottom - cy + padY
      });
    };
    card.querySelectorAll('.rg-feedback-card-title, .rg-mood-pill, .rg-mood-side-label,'
      + ' .rg-mood-topbtn, .rg-pulse-taps, .rg-trend, .rg-feedback-card-actions, .rg-bmc-qrblock').forEach(function (node) {
      add(node.getBoundingClientRect(), 5, 5);
    });
    var label = card.querySelector('.rg-mood-label');
    if (label) {
      var r = label.getBoundingClientRect();
      boxes.push({ l: -42, r: 42, t: r.top - cy - 5, b: r.bottom - cy + 5 });
    }
    return boxes;
  }
  function moodBoxHits(box, boxes) {
    for (var i = 0; i < boxes.length; i++) {
      var o = boxes[i];
      if (box.l < o.r && o.l < box.r && box.t < o.b && o.t < box.b) return true;
    }
    return false;
  }
  // Distance from the blob's centre to the nearest edge or corner of the badge.
  function moodBoxDistance(box) {
    var dx = Math.max(box.l, 0, -box.r);
    var dy = Math.max(box.t, 0, -box.b);
    return Math.sqrt(dx * dx + dy * dy);
  }
  // The smallest radius at which a badge of this size sits clear of the blob,
  // the card edges and the fixed furniture at the given angle — or 0 if the
  // angle has no room at all. Tracing this for every angle gives the ring
  // curve: a rounded shape that hugs the blob evenly all the way round.
  function moodRingRadius(deg, hw, hh, blobR, blocked, bounds, cap) {
    var a = deg * Math.PI / 180;
    var ux = Math.sin(a), uy = -Math.cos(a);
    var start = blobR + MOOD_SRC_GAP;
    for (var r = start; r <= cap; r += 1) {
      var x = ux * r, y = uy * r;
      var box = { l: x - hw, r: x + hw, t: y - hh, b: y + hh };
      if (box.l < bounds.l || box.r > bounds.r || box.t < bounds.t || box.b > bounds.b) return 0;
      if (moodBoxDistance(box) < start) continue;
      if (moodBoxHits(box, blocked)) continue;
      return r;
    }
    return 0;
  }
  function moodSourceIcon(key) {
    if (typeof window.__minkaCoffeeIcon !== 'function') return '';
    try { return window.__minkaCoffeeIcon(key) || ''; } catch (_error) { return ''; }
  }
  // "Rihards Gavriļenko" -> "Rihards G." — readable, and never a bare initial.
  function moodShortName(name) {
    var parts = String(name || '').trim().split(/\s+/);
    if (parts.length < 2) return parts[0] || '';
    return parts[0] + ' ' + parts[1].charAt(0).toLocaleUpperCase('lv-LV') + '.';
  }
  // The card is rebuilt whenever the schedule re-renders, so the lookups are
  // cached against the live stage and re-resolved once it is replaced.
  var moodNodes = null;
  function moodRefs(what) {
    if (!moodNodes || !moodNodes.stage || !moodNodes.stage.isConnected) {
      var stage = list.querySelector('.rg-mood-stage');
      if (!stage) { moodNodes = null; return null; }
      moodNodes = {
        stage: stage,
        wrap: stage.querySelector('.rg-mood-blob-wrap'),
        shapes: stage.querySelectorAll('.rg-mood-blob-shape, .rg-mood-blob-sheen'),
        stops: stage.querySelectorAll('.rg-mood-blob-stop'),
        glow: stage.querySelector('.rg-mood-glow'),
        fluentFace: stage.querySelector('[data-rg-fluent-face]'),
        label: stage.querySelector('.rg-mood-label'),
        ring: stage.querySelector('[data-rg-ring]'),
        top: stage.querySelector('[data-rg-top]'),
        topbtn: stage.querySelector('[data-rg-topbtn]'),
        chips: {
          coffee: stage.querySelector('[data-rg-chip="coffee"]'),
          fatigue: stage.querySelector('[data-rg-chip="fatigue"]')
        },
        face: {}
      };
      moodFaceParts.forEach(function (part) {
        moodNodes.face[part] = stage.querySelector('[data-rg-face="' + part + '"]');
      });
    }
    return what ? moodNodes[what] : moodNodes;
  }
  // Visual only — called from paintCounts() once the existing mood state has
  // already been read, changed or reloaded. Touches nothing but the blob.
  // `preview` renders a mood the finger/cursor is hovering without committing
  // it, so nothing is stored, sent or counted until the tap actually lands.
  function updateMoodBlob(key, preview) {
    var refs = moodRefs();
    if (!refs) return;
    var stage = refs.stage;
    moodRenderedKey = key || null;
    if (!preview) {
      if (moodBlobKey !== key && (moodBlobKey || key)) popMoodBlob(refs);
      moodBlobKey = key || null;
    }
    stage.classList.toggle('is-idle', !moodBlobKey && !preview);
    stage.classList.toggle('is-preview', !!preview);
    stage.classList.remove('is-bored');
    stage.classList.remove('is-waiting');
    var visual = moodVisuals[key] || moodVisuals._none;
    stage.dataset.rgMood = key || 'none';
    stage.style.setProperty('--rg-mood-primary', visual.color1);
    stage.style.setProperty('--rg-mood-secondary', visual.color2);
    stage.style.setProperty('--rg-mood-glow-color', visual.glow);
    refs.shapes.forEach(function (el) { el.setAttribute('d', visual.path); });
    refs.stops.forEach(function (stop) {
      stop.style.stopColor = stop.dataset.rgStop === 'c1' ? visual.color1 : visual.color2;
    });
    if (refs.glow) refs.glow.style.color = visual.glow;
    var own = ownMoodFor(shiftDayKey());
    if (refs.fluentFace) {
      refs.fluentFace.textContent = (!preview && own && own.emoji) || visual.emoji || moodVisuals._none.emoji;
    }
    if (refs.stage) refs.stage.classList.toggle('has-own-mood', !preview && !!(own && own.emoji));
    if (refs.label) {
      // The day's own note belongs in the visible label under the blob — the
      // card's other label is screen-reader only, so a note written there was
      // never seen.
      var ownNote = !preview && own && own.note ? own.note : '';
      refs.label.textContent = ownNote || visual.label || '\u00a0';
      refs.label.style.color = ownNote ? '' : (key ? visual.color1 : '');
      refs.label.classList.toggle('is-own-note', !!ownNote);
      refs.label.title = ownNote;
    }
    moodFaceParts.forEach(function (part) {
      var el = refs.face[part];
      if (!el) return;
      el.setAttribute('d', visual.face[part]);
      el.setAttribute('opacity', moodPartOpacity(part, visual));
    });
    syncMoodBoredState(key, preview, refs);
    paintMoodCoffee();
  }
  function syncMoodBoredState(key, preview, refs) {
    var day = shiftDayKey();
    if (key) {
      window.clearTimeout(moodBoredTimer);
      moodBoredTimer = 0;
      moodBoredSince = 0;
      moodBoredDay = day;
      refs.stage.classList.remove('is-bored');
      refs.stage.classList.remove('is-waiting');
      return;
    }
    if (moodBoredDay !== day) {
      window.clearTimeout(moodBoredTimer);
      moodBoredTimer = 0;
      moodBoredDay = day;
      moodBoredSince = Date.now();
    }
    if (!moodBoredSince) moodBoredSince = Date.now();
    if (preview) return;

    var showBored = function () {
      moodBoredTimer = 0;
      var live = moodRefs();
      if (!live || moodBlobKey || shiftDayKey() !== moodBoredDay) return;
      if (live.stage.classList.contains('is-preview')) {
        moodBoredTimer = window.setTimeout(showBored, 700);
        return;
      }
      // Asleep is only honest at night. During the day an unrated shift gets
      // the waiting face and the label says so, instead of the app looking
      // like it has dozed off.
      var hour = new Date().getHours();
      var night = hour >= 22 || hour < 6;
      live.stage.classList.toggle('is-bored', night);
      live.stage.classList.toggle('is-waiting', !night);
      if (live.fluentFace) live.fluentFace.textContent = night ? '😴' : (moodVisuals._none.emoji || '🙂');
    };
    var remaining = MOOD_BORED_DELAY - (Date.now() - moodBoredSince);
    if (remaining <= 0) showBored();
    else if (!moodBoredTimer) moodBoredTimer = window.setTimeout(showBored, remaining);
  }
  // Closed lids cross-fade against the open eyes, and the toothy open mouth
  // against the drawn one, so each mood can wear the face from the reference.
  function moodPartOpacity(part, visual) {
    if (part === 'browL' || part === 'browR') return visual.brows ? '1' : '0';
    if (part === 'lidL' || part === 'lidR') return visual.lids ? '1' : '0';
    if (part === 'mouth') return visual.openMouth ? '0' : '1';
    if (part === 'mouthOpen' || part === 'teeth') return visual.openMouth ? '1' : '0';
    return visual.lids ? '0' : '1';   // eye whites, pupils, glints
  }
  function popMoodBlob(refs) {
    var wrap = refs && refs.wrap;
    if (!wrap) return;
    wrap.classList.remove('is-pop');
    void wrap.offsetWidth;   // restart the animation on repeated taps
    wrap.classList.add('is-pop');
  }
  function previewMoodBlob(key) {
    if (key && key !== moodBlobKey) updateMoodBlob(key, true);
  }
  function endMoodBlobPreview() {
    updateMoodBlob(moodBlobKey, false);
  }
  var moodSectionLayoutFrame = 0;
  var moodSectionLayoutBusy = false;
  var moodCardResizeObserver = null;
  var moodCardObserved = null;
  var moodSectionResizeTimer = 0;
  var moodDayRefreshToken = 0;
  var moodDayRefreshFrame = 0;
  var moodDayRefreshIdle = 0;
  var moodDayRefreshTimer = 0;

  function cancelMoodDayRefresh() {
    if (moodDayRefreshFrame) cancelAnimationFrame(moodDayRefreshFrame);
    if (moodDayRefreshIdle && typeof cancelIdleCallback === 'function') cancelIdleCallback(moodDayRefreshIdle);
    if (moodDayRefreshTimer) clearTimeout(moodDayRefreshTimer);
    moodDayRefreshFrame = 0;
    moodDayRefreshIdle = 0;
    moodDayRefreshTimer = 0;
  }

  // Staff/source placement is the expensive part of the mood card: it reads
  // real geometry and runs collision searches for every badge. It used to run
  // inside the day-click task, consuming most of that interaction's frame on
  // older Windows CPUs. Let the new roster paint first, then refresh the mood
  // module in idle time. A token cancels stale work when days are clicked fast.
  function scheduleMoodDayRefresh() {
    cancelMoodDayRefresh();
    var token = ++moodDayRefreshToken;
    var day = shiftDayKey();

    moodDayRefreshFrame = requestAnimationFrame(function () {
      moodDayRefreshFrame = requestAnimationFrame(function () {
        moodDayRefreshFrame = 0;
        var run = function () {
          moodDayRefreshIdle = 0;
          moodDayRefreshTimer = 0;
          if (token !== moodDayRefreshToken || day !== shiftDayKey()) return;
          try {
            // paintCounts() rebuilds and places the constellation synchronously
            // (paintCounts → updateMoodBlob → paintMoodCoffee → buildMoodStaff),
            // so by this line the badges already sit at their final spots.
            // The constellation is already complete when this idle refresh
            // finishes. Keep it static: replaying a staggered 420ms burst here
            // made every day switch look like the emoji rendered twice.
            paintCounts();
            loadRatings(day, true);
          } catch (_error) {}
        };
        if (typeof requestIdleCallback === 'function') {
          moodDayRefreshIdle = requestIdleCallback(run, { timeout: 140 });
        } else {
          moodDayRefreshTimer = setTimeout(run, 0);
        }
      });
    });
  }
  function clearMoodSectionLayout(section, grid) {
    if (section) {
      section.classList.remove('rg-mood-pullup');
      section.style.removeProperty('--rg-mood-pullup');
    }
    if (grid) {
      [].slice.call(grid.children).forEach(function (card) {
        card.style.removeProperty('grid-row');
        card.style.removeProperty('grid-column');
      });
    }
  }
  function setMoodLift(mood, px) {
    if (!mood) return;
    if (px > 0) mood.style.setProperty('--rg-mood-lift', px + 'px');
    else mood.style.removeProperty('--rg-mood-lift');
  }
  function layoutMoodSections() {
    var mood = list.querySelector('.rg-feedback-card');
    var rdLabel = list.querySelector('.cards-section-label-rd');
    var rgLabel = list.querySelector('.cards-section-label-rg');
    var rdSection = rdLabel && rdLabel.closest('.cards-section');
    var rgSection = rgLabel && rgLabel.closest('.cards-section');
    var rdGrid = rdSection && rdSection.querySelector('.cards-subgrid');
    var rgGrid = rgSection && rgSection.querySelector('.cards-subgrid');
    if (!mood || !rdGrid || !rgGrid || !rgSection) {
      clearMoodSectionLayout(rgSection, rgGrid);
      return;
    }
    var mobile = document.documentElement.classList.contains('mk-mobile-shell');
    // Radio mode uses one compact, shared roster grid (see the final style
    // block). The old cross-section pull-up was designed for two tall desktop
    // rows; in the shortened radio viewport it moved RADIOGRĀFERI over the
    // RADIOLOGI cards and left most of the centre panel empty.
    if (document.documentElement.classList.contains('host-radio-open')) {
      setMoodLift(mood, 0);
      clearMoodSectionLayout(rdSection, rdGrid);
      clearMoodSectionLayout(rgSection, rgGrid);
      return;
    }
    // autoSizeCards() has already written the authoritative tracks. Read
    // those actual tracks instead of rebuilding a second, approximate column
    // count from viewport breakpoints. The two guesses diverged on Windows
    // scaling/zoom and assigned following cards to non-existent columns.
    var columns = String(getComputedStyle(rdGrid).gridTemplateColumns || '')
      .trim().split(/\s+/).filter(Boolean).length;
    var employees = [].slice.call(rdGrid.querySelectorAll('.card:not(.rg-feedback-card)'));
    var employee = employees[0] || rgGrid.querySelector('.card');
    if (mobile || columns < 3 || !employee) {
      setMoodLift(mood, 0);
      clearMoodSectionLayout(rgSection, rgGrid);
      return;
    }
    var currentLift = parseFloat(mood.style.getPropertyValue('--rg-mood-lift')) || 0;
    var moodRect = mood.getBoundingClientRect();
    var employeeRect = employee.getBoundingClientRect();
    // Pull the next profession into the free tracks only when the feedback
    // module really shares the employee row. On narrow layouts it wraps below
    // the workers; pulling there would create an overlap.
    if (Math.abs(moodRect.top + currentLift - employeeRect.top) > 4) {
      setMoodLift(mood, 0);
      clearMoodSectionLayout(rgSection, rgGrid);
      return;
    }
    // Beside the workers the RADIOLOGI heading row is empty above the mood
    // column, so the card starts there. That strip holds the team curve and
    // everything under it moves up by the same amount.
    var lift = Math.max(0, Math.round(moodRect.top + currentLift - rdLabel.getBoundingClientRect().top));
    if (lift !== currentLift) {
      setMoodLift(mood, lift);
      moodRect = mood.getBoundingClientRect();
    }
    var employeeBottom = Math.max.apply(null, employees.map(function(card) {
      return card.getBoundingClientRect().bottom;
    }).concat(employeeRect.bottom));
    var currentPullup = parseFloat(rgSection.style.getPropertyValue('--rg-mood-pullup')) || 0;
    var labelRect = rgLabel.getBoundingClientRect();
    var naturalLabelTop = labelRect.top - currentPullup;
    // Recalculate from the current DOM every time. Caching by width/height was
    // wrong because two days can have identical card sizes but different
    // topper clearance; returning to the first day then reused the second
    // day's larger pull-up and placed RADIOGRĀFERI inside the upper card.
    var moodOverhang = Math.max(0, moodRect.bottom - employeeBottom);
    var headingSafePullup = Math.max(0, naturalLabelTop - employeeBottom - 12);
    var pullup = Math.min(moodOverhang, headingSafePullup);
    if (pullup < 12) {
      clearMoodSectionLayout(rgSection, rgGrid);
      return;
    }
    var besideSlots = Math.max(1, columns - 2);
    var cards = [].slice.call(rgGrid.children).filter(function (card) {
      return card.classList.contains('card');
    });
    // Every row that still sits beside the mood card gets only the free
    // columns; only rows that start below it get all of them. The old rule
    // gave the free columns to the first row alone, so a mood card taller
    // than one row of workers had the second row drawn on top of it.
    var gridTopAfter = rgGrid.getBoundingClientRect().top - currentPullup - pullup;
    var rowGap = parseFloat(getComputedStyle(rgGrid).rowGap) || 0;
    var rowHeight = (cards[0] && cards[0].getBoundingClientRect().height) || employeeRect.height;
    var rowSlots = function (row) {
      var rowTop = gridTopAfter + (row - 1) * (rowHeight + rowGap);
      return rowTop < moodRect.bottom - 4 ? besideSlots : columns;
    };
    var row = 1, column = 0;
    cards.forEach(function (card) {
      if (column >= rowSlots(row)) { row += 1; column = 0; }
      card.style.setProperty('grid-row', String(row));
      card.style.setProperty('grid-column', String(column + 1));
      column += 1;
    });
    rgSection.style.setProperty('--rg-mood-pullup', (-pullup).toFixed(2) + 'px');
    rgSection.classList.add('rg-mood-pullup');
  }
  // The pull-up moves the whole RADIOGRĀFERI row. A charm that crosses the
  // grid's bottom scroll edge is drawn by a fixed-position copy living outside
  // the list, and that copy is positioned from a measurement — so every solve
  // has to tell the add-ons to re-read the geometry. Without it the copy keeps
  // its pre-pull-up coordinates and is left hanging in empty space far below
  // its card. Only the portals are refreshed here: section clearance feeds
  // back into this very layout, so requesting it would loop.
  function runMoodSectionLayout() {
    if (moodSectionLayoutFrame) {
      cancelAnimationFrame(moodSectionLayoutFrame);
      moodSectionLayoutFrame = 0;
    }
    if (moodSectionLayoutBusy) return;
    moodSectionLayoutBusy = true;
    try {
      layoutMoodSections();
      watchMoodCardSize();
      var addons = window.MinkaCardAddons;
      if (addons && typeof addons.refreshPortals === 'function') addons.refreshPortals();
    } finally {
      moodSectionLayoutBusy = false;
    }
  }
  /* The feedback card is reused across day switches, so it carries the previous
     day's rendered height until the deferred paintCounts() rebuilds its
     illustration — a change of ~80px. A ResizeObserver callback runs after
     layout and before paint, so the pull-up is corrected in the same frame the
     card resizes; scheduling it left the radiographer row visibly misplaced for
     a frame or two. Only the card is observed, and the pull-up moves the
     section below it, so this cannot feed back into itself. */
  function watchMoodCardSize() {
    if (typeof ResizeObserver !== 'function') return;
    var mood = list.querySelector('.rg-feedback-card');
    if (!mood || mood === moodCardObserved) return;
    if (!moodCardResizeObserver) {
      moodCardResizeObserver = new ResizeObserver(function () { runMoodSectionLayout(); });
    }
    if (moodCardObserved) moodCardResizeObserver.unobserve(moodCardObserved);
    moodCardObserved = mood;
    moodCardResizeObserver.observe(mood);
  }
  function scheduleMoodSectionLayout() {
    if (moodSectionLayoutFrame) return;
    // requestAnimationFrame, not setTimeout(0): a timeout can land after the
    // browser has already painted the roster at its natural position, which
    // reads as the radiographer row dropping to the bottom and snapping back
    // up. A frame callback writes the pull-up before that paint.
    moodSectionLayoutFrame = requestAnimationFrame(function () {
      moodSectionLayoutFrame = 0;
      runMoodSectionLayout();
    });
  }
  // Card add-ons calculate topper clearance after their images have decoded.
  // Let that one geometry change request a fresh mood/roster placement without
  // polling or observing the whole document.
  window.__minkaScheduleMoodSectionLayout = scheduleMoodSectionLayout;
  window.addEventListener('resize', function () {
    window.clearTimeout(moodSectionResizeTimer);
    moodSectionResizeTimer = window.setTimeout(runMoodSectionLayout, 180);
  }, { passive: true });
  function mount(deferLayout, skipRatings, skipMoodPaint) {
    var label = list.querySelector('.cards-section-label-rd');
    var section = label && label.closest('.cards-section');
    var grid = section && section.querySelector('.cards-subgrid');
    if (!grid) return;
    grid.classList.add('rg-has-mood-card');
    // Telefonā (mobile-v2) noskaņojuma kartīte stāv pilnā platumā ZEM darbinieku
    // režģa, tāpēc to pieliek sekcijai, ne režģim. Darbvirsmā — režģī kā līdz šim.
    var moodHost = document.documentElement.classList.contains('mk-mobile-shell') ? section : grid;
    if (section.querySelector('.rg-feedback-card')) {
      if (!deferLayout) scheduleMoodSectionLayout();
      return;
    }
    var pulse = window.__minkaReusableFeedbackCard;
    if (pulse && pulse.nodeType === 1) {
      window.__minkaReusableFeedbackCard = null;
    } else {
      pulse = document.createElement('div');
      pulse.className = 'card mk-mid-card mk-mid-card-rd rg-feedback-card';
      pulse.setAttribute('aria-label', 'Novērtē maiņu');
      pulse.innerHTML = '<div class="rg-feedback-cloud" aria-hidden="true"></div><div class="rg-feedback-card-head-spacer" aria-hidden="true"></div>'
        + '<div class="rg-feedback-card-main"><strong class="rg-feedback-card-title">Novērtē maiņu</strong>'
        + moodBlobMarkup() + moodTrendMarkup()
        + '<span class="rg-pulse-taps" role="group" aria-label="Ātrās reakcijas">' + reactionButtons() + '</span>'
        + '<small class="rg-feedback-card-reaction-label" aria-live="polite">Izvēlies sajūtu</small></div>'
        + '<div class="rg-feedback-card-actions"><button class="rg-pulse-write rg-pulse-write--comment" type="button" data-rg-write="comment" title="Atvērt komentārus"><b class="rg-comment-icon" aria-hidden="true"></b><span>Komentāri</span><small class="rg-feedback-action-count" data-rg-action-count="comment"></small></button></div>'
        + bmcQrMarkup();
    }
    moodHost.appendChild(pulse);
    window.MinkaDaybook?.enhance(pulse);
    if (!deferLayout) scheduleMoodSectionLayout();
    if (!skipMoodPaint) paintCounts();
    // A selected-day render already has one forced refresh queued by the
    // daySelected listener below. Avoid issuing the same API request twice.
    if (!skipRatings) loadRatings(shiftDayKey());
  }

  // calendar.js calls this while rebuilding a selected day. Mounting the mood
  // card, sizing every column and applying the pull-up before returning keeps
  // the browser from ever painting the intermediate "cards moved down" state.
  window.__minkaFinalizeRosterCards = function (rosterWidth) {
    var measure = !!window.__minkaMeasureDaySwitches;
    var startedAt = measure ? performance.now() : 0;
    // The mood's geometry solver is deliberately excluded from the click
    // frame. scheduleMoodDayRefresh() updates it after the roster is visible.
    mount(true, true, true);
    var mountedAt = measure ? performance.now() : 0;
    if (typeof window.__minkaAutoSizeCardsNow === 'function') {
      window.__minkaAutoSizeCardsNow(rosterWidth);
    }
    if (window.MinkaCardAddons && typeof window.MinkaCardAddons.applyRosterNow === 'function') {
      window.MinkaCardAddons.applyRosterNow();
    }
    var sizedAt = measure ? performance.now() : 0;
    // Synchronous, and it drops any solve queued for the next frame — the day
    // switch must not pay for the same geometry pass twice.
    runMoodSectionLayout();
    if (measure) {
      (window.__minkaRosterFinalizeMetrics ||= []).push({
        mountMs: +(mountedAt - startedAt).toFixed(2),
        sizeMs: +(sizedAt - mountedAt).toFixed(2),
        layoutMs: +(performance.now() - sizedAt).toFixed(2)
      });
    }
  };
  function paintCounts() {
    var counts = pulseCounts();
    list.querySelectorAll('[data-rg-count]').forEach(function (item) {
      var count = Math.max(0, Number(counts[item.dataset.rgCount]) || 0);
      item.textContent = count ? String(count) : '';
    });
    var card = list.querySelector('.rg-feedback-card');
    if (!card) return;
    var oldBmc = card.querySelector('[data-rg-bmc]');
    if (oldBmc) oldBmc.remove();
    var qrBlock = card.querySelector('[data-rg-bmc-qr]');
    var actions = card.querySelector('.rg-feedback-card-actions');
    if (!qrBlock && actions) actions.insertAdjacentHTML('afterend', bmcQrMarkup());
    else if (qrBlock && actions && actions.nextElementSibling !== qrBlock) actions.parentNode.insertBefore(qrBlock, actions.nextSibling);
    var selected = reactions.find(function (item) { return item.key === counts._last; });
    var dominant = null;
    var dominantCount = 0;
    reactions.forEach(function (item) {
      var count = Math.max(0, Number(counts[item.key]) || 0);
      if (count > dominantCount || (count === dominantCount && count > 0 && item.key === counts._last)) {
        dominant = item;
        dominantCount = count;
      }
    });
    if (dominant) card.dataset.mood = dominant.key;
    else card.removeAttribute('data-mood');
    var reactionLabel = card.querySelector('.rg-feedback-card-reaction-label');
    if (reactionLabel) {
      var voted = reactions.reduce(function (sum, item) { return sum + Math.max(0, Number(counts[item.key]) || 0); }, 0);
      var isLiveDay = shiftDayKey() === liveShiftDayKey();
      var own = ownMoodFor(shiftDayKey());
      reactionLabel.textContent = own && own.note ? own.note
        : selected ? selected.label
        : dominant ? dominant.label + ' · ' + voted
        : isLiveDay ? 'Vēl neviens nav novērtējis' : 'Šai maiņai nav novērtējumu';
      reactionLabel.classList.toggle('is-empty-state', !own && !selected && !dominant);
      reactionLabel.classList.toggle('is-own-note', !!(own && own.note));
      reactionLabel.title = own && own.note ? own.note : '';
    }
    card.querySelectorAll('[data-rg-pulse]').forEach(function (button) {
      var isSelected = !!selected && button.dataset.rgPulse === selected.key;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
    paintEntryCounts();
    // Single hook for the mood blob: paintCounts() already runs after every
    // path that can change the mood — emoji tap, Cloudflare load, day switch,
    // storage event and mount. `selected` is this device's last tap, `dominant`
    // is the day's leading reaction restored from the server.
    updateMoodBlob((selected && selected.key) || (dominant && dominant.key) || null);
    window.MinkaMoodTrend?.paint(card);
    window.MinkaDaybook?.enhance(card);
    // updateMoodBlob() also rebuilds the responsive feedback illustration.
    // Its final height is only known after that synchronous rebuild, so place
    // the following profession once more. Synchronously: the rebuild and the
    // pull-up it invalidates then land in the same frame. Deferring it to the
    // next frame painted the radiographer row against the new card height but
    // the old pull-up, which is a visible jump. Event-driven (day/rating
    // changes only), not a polling loop.
    runMoodSectionLayout();
  }
  function addBurst(button, emoji) {
    var particles = window.MinkaEmojiParticles;
    var card = button && button.closest('.rg-feedback-card');
    var target = card && (card.querySelector('.rg-mood-glass-lens') || card.querySelector('.rg-mood-blob-wrap'));
    if (particles && target) {
      particles.flyTo(button, target, emoji, {
        count: 4 + Math.floor(Math.random() * 4),
        size: 38,
        duration: 1080,
        targetSpread: 16,
        endScale: .18,
        peakScale: 1.45,
        peakAt: .3,
        arcSpread: 150,
        lift: 72,
        trail: true
      });
      particles.haptic('selection');
      return;
    }
    var burst = document.createElement('span');
    burst.className = 'rg-pulse-burst';
    burst.textContent = emoji;
    burst.style.setProperty('--rg-fly-x', (Math.round(Math.random() * 22) - 11) + 'px');
    button.appendChild(burst);
    burst.addEventListener('animationend', function () { burst.remove(); }, { once: true });
  }
  function addReaction(button) {
    var key = button.dataset.rgPulse;
    var all = readJson(PULSE_KEY, {});
    var day = shiftDayKey();
    var counts = all[day] || {};
    counts[key] = Math.max(0, Number(counts[key]) || 0) + 1;
    counts._last = key;
    all[day] = counts;
    writeJson(PULSE_KEY, all);
    var pending = readJson(PENDING_PULSE_KEY, {});
    var dayPending = pending[day] || {};
    dayPending[key] = Math.max(0, Number(dayPending[key]) || 0) + 1;
    pending[day] = dayPending;
    writeJson(PENDING_PULSE_KEY, pending);
    paintCounts();
    addBurst(button, button.dataset.emoji || '❤️');
    var reaction = reactions.find(function (item) { return item.key === key; });
    var label = button.closest('.rg-feedback-card') && button.closest('.rg-feedback-card').querySelector('.rg-feedback-card-reaction-label');
    if (label) label.textContent = reaction ? reaction.label : 'Paldies!';
    window.clearTimeout(ratingFlushTimer);
    ratingFlushTimer = window.setTimeout(function () { flushRatings(day); }, 320);
  }

  /* ── Sava noskaņa: emoji + pāris vārdi ─────────────────────────────────
     Glabājas kā parasta dienas ziņa ar marķieri, tāpat kā čata tēmas — tā
     tā ir visiem, bez jaunas API tabulas. Lentē šīs ziņas nerāda. */
  // Pāris vārdi, ne stāsts: tikpat īsi kā “Lieliski” vai “Ļoti slikti”, ko
  // raksta piecas gatavās reakcijas.
  var MOOD_NOTE_MAX = 24;
  var MOOD_NOTE_MIN = 2;
  var MOOD_NOTE_WORDS = 3;
  var MOOD_POST_GAP = 5000;           // tikai pret dubultklikšķi, ne pret rakstīšanu
  var moodOwnCache = {};              // day -> { emoji, note, at }
  var moodOwnLoadedAt = {};
  var moodLastPostAt = 0;
  function moodMarker(emoji, note) {
    return '[[rgmood;emoji=' + encodeURIComponent(emoji) + ']]' + note;
  }
  function parseMoodMessage(item) {
    var raw = String(item && item.text || '');
    var match = raw.match(/^\[\[rgmood;emoji=([^\]]*)\]\]/);
    if (!match) return null;
    var emoji = '';
    try { emoji = decodeURIComponent(match[1] || ''); } catch (_error) { return null; }
    if (!emoji) return null;
    return { emoji: emoji, note: raw.slice(match[0].length).trim().slice(0, MOOD_NOTE_MAX), at: Number(item.createdAt) || 0 };
  }
  /* Spama bremzes: garums abos galos, atkārtotu rakstzīmju un tukšumu
     savilkšana, saites nost un viens ieraksts reizi 20 sekundēs. */
  function cleanMoodNote(value) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    text = text.replace(/https?:\/\/\S+/gi, '').trim();
    text = text.replace(/(.)\1{2,}/g, '$1$1');
    text = text.split(' ').slice(0, MOOD_NOTE_WORDS).join(' ');
    return text.slice(0, MOOD_NOTE_MAX);
  }
  // Savs emoji paliek visu dienu: pēc pārlādes vai kamēr serveris vēl nav
  // atbildējis (vai neatbild), rādām to, kas saglabāts šajā ierīcē, nevis
  // noklusēto sejiņu.
  function ownMoodFor(day) {
    if (moodOwnCache[day]) return moodOwnCache[day];
    var saved = readJson('minkaRgOwnMoodV1', {});
    var entry = saved && typeof saved === 'object' ? saved[day] : null;
    return entry && entry.emoji ? entry : null;
  }
  // The statistics view reads the same fact from this key, so a mood saved
  // on the card shows there without waiting for its own fetch.
  function shareOwnMood(day, value) {
    var all = readJson('minkaRgOwnMoodV1', {});
    if (!all || typeof all !== 'object') all = {};
    if (value && value.emoji) all[day] = { emoji: value.emoji, note: value.note || '', at: value.at || Date.now() };
    else delete all[day];
    writeJson('minkaRgOwnMoodV1', all);
  }
  async function loadOwnMood(day, force) {
    var now = Date.now();
    if (!force && moodOwnLoadedAt[day] && now - moodOwnLoadedAt[day] < 20000) return;
    moodOwnLoadedAt[day] = now;
    try {
      var data = await fetchFeedback('/api/feedback?date=' + encodeURIComponent(day) + '&kind=comment&limit=100');
      var newest = null;
      (data.messages || []).forEach(function (item) {
        var parsed = parseMoodMessage(item);
        if (parsed && (!newest || parsed.at > newest.at)) newest = parsed;
      });
      // Tukša atbilde (ziņa izkritusi no loga, ieraksts vēl ceļā) nenodzēš jau
      // izvēlēto emoji — tikai jaunāks ieraksts to nomaina.
      var known = ownMoodFor(day);
      if (!newest || (known && known.at > newest.at)) newest = known;
      moodOwnCache[day] = newest;
      shareOwnMood(day, newest);
      if (day === shiftDayKey()) paintCounts();
    } catch (_error) {}
  }
  async function postOwnMood(day, emoji, note) {
    var now = Date.now();
    var clean = cleanMoodNote(note);
    if (clean.length < MOOD_NOTE_MIN) return { ok: false, error: 'Uzraksti vismaz vārdu.' };
    if (now - moodLastPostAt < MOOD_POST_GAP) return { ok: false, error: 'Mirkli pagaidi.' };
    moodLastPostAt = now;
    moodOwnCache[day] = { emoji: emoji, note: clean, at: now };
    shareOwnMood(day, moodOwnCache[day]);
    paintCounts();
    try {
      await fetchFeedback('/api/feedback/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: day, kind: 'comment', text: moodMarker(emoji, clean), clientId: newClientId() })
      });
      loadOwnMood(day, true);
      return { ok: true };
    } catch (_error) {
      return { ok: false, error: 'Nevarēja nosūtīt — pamēģini vēlreiz.' };
    }
  }
  function updateLocalRating(day, key, serverCount, pendingCount) {
    var all = readJson(PULSE_KEY, {});
    var counts = all[day] || {};
    counts[key] = Math.max(Number(counts[key]) || 0, Math.max(0, Number(serverCount) || 0) + Math.max(0, Number(pendingCount) || 0));
    all[day] = counts;
    writeJson(PULSE_KEY, all);
    if (day === shiftDayKey()) paintCounts();
  }
  function flushRatings(day) {
    if (ratingSyncs[day]) return ratingSyncs[day];
    ratingSyncs[day] = (async function () {
      var snapshot = Object.assign({}, pendingPulseCounts(day));
      var keys = reactions.map(function (item) { return item.key; }).filter(function (key) { return Number(snapshot[key]) > 0; });
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var sent = Math.min(1000, Math.max(1, Math.trunc(Number(snapshot[key]) || 0)));
        try {
          var data = await fetchFeedback('/api/feedback/rating', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ date: day, reaction: key, delta: sent })
          });
          var allPending = readJson(PENDING_PULSE_KEY, {});
          var currentDayPending = allPending[day] || {};
          var remaining = Math.max(0, (Number(currentDayPending[key]) || 0) - sent);
          if (remaining) currentDayPending[key] = remaining;
          else delete currentDayPending[key];
          if (Object.keys(currentDayPending).length) allPending[day] = currentDayPending;
          else delete allPending[day];
          writeJson(PENDING_PULSE_KEY, allPending);
          updateLocalRating(day, key, data.count, remaining);
        } catch (_error) {
          break;
        }
      }
    })().finally(function () { delete ratingSyncs[day]; });
    return ratingSyncs[day];
  }
  async function loadRatings(day, force) {
    var now = Date.now();
    loadOwnMood(day, force);
    if (!force && ratingsLoadedAt[day] && now - ratingsLoadedAt[day] < 15000) return;
    ratingsLoadedAt[day] = now;
    await flushRatings(day);
    try {
      var data = await fetchFeedback('/api/feedback?date=' + encodeURIComponent(day) + '&messages=0');
      var all = readJson(PULSE_KEY, {});
      var counts = all[day] || {};
      var pending = pendingPulseCounts(day);
      reactions.forEach(function (item) {
        counts[item.key] = Math.max(0, Number(data.ratings && data.ratings[item.key]) || 0) + Math.max(0, Number(pending[item.key]) || 0);
      });
      all[day] = counts;
      writeJson(PULSE_KEY, all);
      saveServerEntryCounts(day, data.entryCounts || { comment: 0, suggestion: 0 });
      if (day === shiftDayKey()) paintCounts();
    } catch (_error) {}
  }

  var modal = document.createElement('div');
  modal.id = 'rgFeedbackModal';
  modal.hidden = true;
  modal.innerHTML = '<section class="rg-feedback-dialog rg-comms" role="dialog" aria-modal="true" aria-labelledby="rgFeedbackTitle">'
    + '<header class="rg-comms-head"><span class="rg-comms-logo" aria-hidden="true">💬</span>'
    + '<div class="rg-comms-heading"><h2 id="rgFeedbackTitle">Saziņa</h2><p>Komandas čats un tēmu sarunas</p></div>'
    + '<div class="rg-comms-tabs" role="tablist"><button class="rg-comms-tab is-active" type="button" data-rg-comms-mode="all">Visi</button><button class="rg-comms-tab" type="button" data-rg-comms-mode="topics">Tēmas</button></div>'
    + '<button class="rg-comms-new-topic" id="rgCommsNewTopic" type="button" title="Sākt jaunu tēmu">＋ Jauna tēma</button>'
    + '<button class="rg-feedback-close" type="button" data-rg-close="1" aria-label="Aizvērt">×</button></header>'
    + '<div class="rg-comms-body"><aside class="rg-comms-sidebar">'
    + '<input class="rg-comms-search" id="rgCommsSearch" type="search" placeholder="Meklēt sarunās…" autocomplete="off">'
    + '<nav class="rg-comms-nav"><button class="rg-comms-nav-button is-active" type="button" data-rg-comms-view="all"><span class="rg-comms-nav-icon">☰</span><span>Visi komentāri</span><small class="rg-comms-count" id="rgCommsAllCount">0</small></button>'
    + '<button class="rg-comms-nav-button" type="button" data-rg-comms-view="today"><span class="rg-comms-nav-icon">●</span><span>Šodien</span><small class="rg-comms-count" id="rgCommsTodayCount">0</small></button></nav>'
    + '<p class="rg-comms-section-label">Tēmas</p><div class="rg-comms-topic-list" id="rgCommsTopics"></div></aside>'
    + '<main class="rg-comms-main"><div class="rg-comms-feed-head"><div><strong id="rgCommsFeedTitle">Visi komentāri</strong><small id="rgCommsFeedSubtitle">Visa komandas sarakste vienuviet</small></div></div>'
    + '<div class="rg-feedback-list rg-comms-feed" id="rgFeedbackList" aria-live="polite"></div><button class="rg-feedback-more" id="rgFeedbackMore" type="button" hidden>Rādīt vēl</button>'
    + '<div class="rg-comms-composer"><div class="rg-comms-compose-context"><label class="rg-comms-author-wrap"><span>Autors</span><select class="rg-comms-author" id="rgCommsAuthor" aria-label="Izvēlies komentāra autoru"><option value="">Anonīmi</option></select></label><span class="rg-comms-topic-field"><input class="rg-comms-topic-input" id="rgCommsTopicInput" maxlength="44" placeholder="Tēma (nav obligāta)" autocomplete="off" title="Tēma, zem kuras ziņa parādīsies"><button type="button" class="rg-comms-topic-emoji-btn" id="rgCommsTopicEmoji" title="Tēmas emoji" aria-label="Izvēlēties tēmas emoji">☺</button></span><span class="rg-comms-replying" id="rgCommsReplying"></span><button class="rg-comms-cancel-reply" id="rgCommsCancelReply" type="button" hidden aria-label="Atcelt atbildi">×</button></div>'
    + '<div class="rg-comms-compose-row"><textarea id="rgFeedbackText" maxlength="560" placeholder="Raksti ziņu…"></textarea><button class="rg-comms-send" id="rgFeedbackSave" type="button" disabled aria-label="Nosūtīt ziņu" title="Nosūtīt ziņu">↑</button></div>'
    + '<div class="rg-comms-tools" aria-label="Ātrie emoji"><button class="rg-comms-emoji" type="button" data-rg-chat-emoji="👍">👍</button><button class="rg-comms-emoji" type="button" data-rg-chat-emoji="😂">😂</button><button class="rg-comms-emoji" type="button" data-rg-chat-emoji="❤️">❤️</button><button class="rg-comms-emoji" type="button" data-rg-chat-emoji="🔥">🔥</button><button class="rg-comms-emoji" type="button" data-rg-chat-emoji="☕">☕</button><button class="rg-comms-emoji rg-comms-emoji-more" type="button" id="rgCommsEmojiMore" title="Visi emoji" aria-label="Atvērt emoji sarakstu">＋</button><span class="rg-comms-status" id="rgCommsStatus"></span><span class="rg-comms-char-count" id="rgFeedbackChars">0 / 560</span></div></div>'
    + '</main></div><div id="rgFeedbackDays" hidden></div><span id="rgFeedbackTargetDay" hidden></span>'
    + '</section>';
  document.body.appendChild(modal);
  var textarea = modal.querySelector('#rgFeedbackText');
  var save = modal.querySelector('#rgFeedbackSave');
  var chars = modal.querySelector('#rgFeedbackChars');
  var daysList = modal.querySelector('#rgFeedbackDays');
  var targetDay = modal.querySelector('#rgFeedbackTargetDay');
  var messageList = modal.querySelector('#rgFeedbackList');
  var moreButton = modal.querySelector('#rgFeedbackMore');
  var commsSearch = modal.querySelector('#rgCommsSearch');
  var commsTopics = modal.querySelector('#rgCommsTopics');
  var commsTopicInput = modal.querySelector('#rgCommsTopicInput');
  var commsAuthor = modal.querySelector('#rgCommsAuthor');
  var commsFeedTitle = modal.querySelector('#rgCommsFeedTitle');
  var commsFeedSubtitle = modal.querySelector('#rgCommsFeedSubtitle');
  var commsAllCount = modal.querySelector('#rgCommsAllCount');
  var commsTodayCount = modal.querySelector('#rgCommsTodayCount');
  var commsReplying = modal.querySelector('#rgCommsReplying');
  var commsCancelReply = modal.querySelector('#rgCommsCancelReply');
  var commsStatus = modal.querySelector('#rgCommsStatus');
  var modalDay = '';
  var remoteMessages = [];
  var nextBefore = null;
  var messagesLoading = false;
  var remoteDays = [];
  var daysLoading = false;
  var dayRequestId = 0;
  var messageRequestId = 0;


  function syncFeedbackModalState(open) {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({ type: 'mk_feedback_modal', open: !!open }, window.location.origin);
    } catch (_e) {}
  }

  function updateTextState() {
    var length = textarea.value.length;
    chars.textContent = length + ' / 700';
    save.disabled = !textarea.value.trim();
  }
  function openModal(kind, trigger) {
    var isComment = kind === 'comment';
    lastWriteButton = trigger || null;
    modal.dataset.kind = isComment ? 'comment' : 'suggestion';
    modalDay = shiftDayKey();
    modal.querySelector('#rgFeedbackTitle').textContent = isComment ? 'Komentāri' : 'Idejas RG lietotnei';
    targetDay.textContent = 'Par ' + displayDay(modalDay);
    textarea.placeholder = isComment ? 'Uzraksti komentāru…' : 'Ko RG lietotnē vajadzētu uzlabot vai pievienot?';
    modal.hidden = false;
    syncFeedbackModalState(true);
    textarea.value = '';
    updateTextState();
    remoteMessages = [];
    remoteDays = [];
    nextBefore = null;
    daysLoading = false;
    messagesLoading = false;
    dayRequestId += 1;
    messageRequestId += 1;
    renderDayGroups('Ielādē datumus…');
    loadDayGroups();
    loadMessages(true);
  }
  function closeModal() {
    modal.hidden = true;
    syncFeedbackModalState(false);
    var closedAt = Date.now();
    markSeen('comment', closedAt);
    markSeen('suggestion', closedAt);
    dayRequestId += 1;
    messageRequestId += 1;
    daysLoading = false;
    messagesLoading = false;
  }
  function localMessages(day, kind) {
    var items = readJson(TEXT_KEY, []);
    if (!Array.isArray(items)) return [];
    return items.filter(function (item) { return item && item.shiftDay === day && item.type === kind; });
  }
  function renderDayGroups(loadingText) {
    daysList.replaceChildren();
    if (loadingText && !remoteDays.length && !localMessages(modalDay, modal.dataset.kind).length) {
      var loading = document.createElement('span');
      loading.className = 'rg-feedback-empty';
      loading.textContent = loadingText;
      daysList.appendChild(loading);
      return;
    }
    var counts = {};
    remoteDays.forEach(function (item) {
      if (item && item.date) counts[item.date] = Math.max(0, Number(item.count) || 0);
    });
    var allLocal = readJson(TEXT_KEY, []);
    if (Array.isArray(allLocal)) {
      allLocal.forEach(function (item) {
        if (item && item.type === modal.dataset.kind && item.shiftDay) counts[item.shiftDay] = (counts[item.shiftDay] || 0) + 1;
      });
    }
    if (!(modalDay in counts)) counts[modalDay] = 0;
    Object.keys(counts).sort(function (a, b) {
      if (a === modalDay) return -1;
      if (b === modalDay) return 1;
      return b.localeCompare(a);
    }).forEach(function (day) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'rg-feedback-day-tab' + (day === modalDay ? ' is-active' : '');
      button.dataset.rgDay = day;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', day === modalDay ? 'true' : 'false');
      button.title = displayDay(day);
      button.appendChild(document.createTextNode(compactDay(day)));
      if (counts[day] > 0) {
        var count = document.createElement('small');
        count.className = 'rg-feedback-day-count';
        count.textContent = String(counts[day]);
        count.setAttribute('aria-label', counts[day] + ' ieraksti');
        button.appendChild(count);
      }
      daysList.appendChild(button);
    });
  }
  async function loadDayGroups() {
    if (daysLoading) return;
    daysLoading = true;
    var requestId = ++dayRequestId;
    var requestedKind = modal.dataset.kind;
    try {
      var data = await fetchFeedback('/api/feedback/days?kind=' + encodeURIComponent(requestedKind) + '&limit=90');
      if (requestId !== dayRequestId || requestedKind !== modal.dataset.kind) return;
      remoteDays = Array.isArray(data.days) ? data.days : [];
      newestEntryAt[requestedKind] = remoteDays.reduce(function (newest, item) {
        return Math.max(newest, Math.max(0, Number(item && item.lastActivity) || 0));
      }, 0);
      if (data.total != null) globalEntryCounts[requestedKind] = Math.max(0, Number(data.total) || 0);
      var storedCounts = readJson(ENTRY_COUNT_KEY, {});
      remoteDays.forEach(function (item) {
        if (!item || !item.date) return;
        var dayCounts = storedCounts[item.date] || { comment: 0, suggestion: 0 };
        dayCounts[requestedKind] = Math.max(0, Number(item.count) || 0);
        storedCounts[item.date] = dayCounts;
      });
      writeJson(ENTRY_COUNT_KEY, storedCounts);
    } catch (_error) {
      if (requestId !== dayRequestId) return;
      remoteDays = [];
    } finally {
      if (requestId !== dayRequestId) return;
      daysLoading = false;
      renderDayGroups();
      paintEntryCounts();
    }
  }
  function selectMessageDay(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day || ''))) return;
    modalDay = day;
    targetDay.textContent = 'Par ' + displayDay(modalDay);
    remoteMessages = [];
    nextBefore = null;
    messageRequestId += 1;
    messagesLoading = false;
    renderDayGroups();
    loadMessages(true);
  }
  function removePendingMessage(clientId) {
    var all = readJson(TEXT_KEY, []);
    if (!Array.isArray(all)) return;
    writeJson(TEXT_KEY, all.filter(function (item) { return item && item.clientId !== clientId; }));
    if (Array.isArray(communityMessages)) {
      communityMessages = communityMessages.filter(function (item) { return item && item.clientId !== clientId; });
    }
    renderDayGroups();
    renderMessages();
    paintEntryCounts();
  }
  function renderMessages(loadingText) {
    messageList.replaceChildren();
    var kind = modal.dataset.kind || 'suggestion';
    var local = localMessages(modalDay, kind);
    var seen = {};
    remoteMessages.forEach(function (item) { if (item.clientId) seen[item.clientId] = true; });
    var combined = remoteMessages.concat(local.filter(function (item) { return !item.clientId || !seen[item.clientId]; }));
    combined.sort(function (a, b) { return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0); });
    if (!combined.length) {
      var empty = document.createElement('p');
      empty.className = 'rg-feedback-empty';
      empty.textContent = loadingText || (kind === 'comment' ? 'Šajā datumā vēl nav komentāru.' : 'Šajā datumā vēl nav ideju.');
      messageList.appendChild(empty);
    } else {
      combined.forEach(function (item) {
        var entry = document.createElement('article');
        entry.className = 'rg-feedback-entry' + (item.pending ? ' is-pending' : '');
        var textNode = document.createElement('p');
        textNode.className = 'rg-feedback-entry-text';
        textNode.textContent = item.text;
        var meta = document.createElement('time');
        meta.className = 'rg-feedback-entry-meta';
        meta.textContent = displayEntryTime(item) + (item.pending ? ' · gaida savienojumu' : '');
        entry.append(textNode, meta);
        if (item.pending && item.clientId) {
          var remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'rg-feedback-entry-remove';
          remove.dataset.rgRemovePending = item.clientId;
          remove.setAttribute('aria-label', 'Dzēst nesinhronizēto ierakstu');
          remove.textContent = '×';
          entry.appendChild(remove);
        }
        messageList.appendChild(entry);
      });
    }
    moreButton.hidden = !nextBefore;
    moreButton.disabled = messagesLoading;
  }
  async function postPendingMessages(day, kind) {
    var all = readJson(TEXT_KEY, []);
    if (!Array.isArray(all)) return;
    var targets = all.filter(function (item) { return item && item.pending && item.shiftDay === day && item.type === kind; });
    var postedAny = false;
    for (var i = 0; i < targets.length; i++) {
      var item = targets[i];
      try {
        var editToken = item.editToken || communityEditToken(item.clientId);
        await fetchFeedback('/api/feedback/message', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            date: item.shiftDay,
            kind: item.type,
            text: item.text,
            clientId: item.clientId,
            editToken: editToken || undefined
          })
        });
        if (editToken) rememberCommunityToken(item.clientId, editToken);
        all = readJson(TEXT_KEY, []);
        all = Array.isArray(all) ? all.filter(function (saved) { return saved.clientId !== item.clientId; }) : [];
        writeJson(TEXT_KEY, all);
        postedAny = true;
      } catch (_error) {
        break;
      }
    }
    if (postedAny) await loadGlobalEntryCount(kind, true);
  }
  async function loadMessages(reset) {
    if ((messagesLoading && !reset) || !modalDay) return;
    messagesLoading = true;
    var requestId = ++messageRequestId;
    var requestedDay = modalDay;
    var requestedKind = modal.dataset.kind;
    if (reset) {
      remoteMessages = [];
      nextBefore = null;
      renderMessages('Ielādē…');
    }
    try {
      await postPendingMessages(requestedDay, requestedKind);
      var path = '/api/feedback?date=' + encodeURIComponent(requestedDay) + '&kind=' + encodeURIComponent(requestedKind) + '&limit=50';
      if (!reset && nextBefore) path += '&before=' + encodeURIComponent(nextBefore);
      var data = await fetchFeedback(path);
      if (requestId !== messageRequestId || requestedDay !== modalDay || requestedKind !== modal.dataset.kind) return;
      remoteMessages = reset ? (data.messages || []) : remoteMessages.concat(data.messages || []);
      nextBefore = data.hasMore ? data.nextBefore : null;
    } catch (_error) {
      if (requestId !== messageRequestId) return;
      nextBefore = null;
    } finally {
      if (requestId !== messageRequestId) return;
      messagesLoading = false;
      renderMessages();
    }
  }
  async function saveText() {
    var text = textarea.value.trim();
    if (!text) return;
    var items = readJson(TEXT_KEY, []);
    if (!Array.isArray(items)) items = [];
    items.unshift({ clientId: newClientId(), type: modal.dataset.kind || 'suggestion', text: text, shiftDay: modalDay, createdAt: Date.now(), pending: true });
    writeJson(TEXT_KEY, items.slice(0, 500));
    paintEntryCounts();
    textarea.value = '';
    updateTextState();
    renderMessages();
    await postPendingMessages(modalDay, modal.dataset.kind);
    await loadMessages(true);
    await loadDayGroups();
    var writeButton = lastWriteButton;
    if (writeButton) {
      var original = writeButton.innerHTML;
      writeButton.innerHTML = '<b aria-hidden="true">✓</b><span>Saglabāts</span>';
      window.setTimeout(function () { if (writeButton.isConnected) writeButton.innerHTML = original; }, 1300);
    }
  }

  /* Topic chat layer. The API remains date-based; the client combines those
     pages into one inbox and stores the optional topic/reply metadata inside
     the message body, so existing comments stay readable and no data is lost. */
  var TOPIC_EMOJI_KEY = 'minkaCommunityTopicEmojiV1';
  var COMMUNITY_OWNED_KEY = 'minkaCommunityOwnedV1';
  var COMMUNITY_EDIT_TOKEN_KEY = 'minkaCommunityEditTokensV1';
  var COMMUNITY_AUTHOR_KEY = 'minkaCommunityAuthorV1';
  var communityMessages = [];
  var communityMode = 'all';
  var communityView = 'all';
  var communityTopic = '';
  var communityReply = null;
  var communityEditing = null;
  var communityLoadId = 0;

  // Topic emoji are optional decoration kept on this device: the API stores
  // only the topic's name, and an emoji nobody else sees is better than a
  // schema change for a label.
  function topicEmojiMap() {
    var value = readJson(TOPIC_EMOJI_KEY, {});
    return value && typeof value === 'object' ? value : {};
  }
  function topicEmoji(topic) {
    var value = topicEmojiMap()[String(topic || '')];
    return typeof value === 'string' ? value : '';
  }
  function setTopicEmoji(topic, emoji) {
    var map = topicEmojiMap();
    var key = String(topic || '');
    if (!key) return;
    if (emoji) map[key] = emoji;
    else delete map[key];
    writeJson(TOPIC_EMOJI_KEY, map);
    renderCommunity();
  }
  function communityOwnedIds() {
    var value = readJson(COMMUNITY_OWNED_KEY, []);
    return Array.isArray(value) ? value : [];
  }
  function rememberCommunityId(clientId) {
    var items = communityOwnedIds();
    if (items.indexOf(clientId) < 0) items.push(clientId);
    writeJson(COMMUNITY_OWNED_KEY, items.slice(-500));
  }
  function communityEditTokens() {
    var value = readJson(COMMUNITY_EDIT_TOKEN_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function communityEditToken(clientId) {
    var token = communityEditTokens()[String(clientId || '')];
    return /^[a-zA-Z0-9_-]{43}$/.test(String(token || '')) ? token : '';
  }
  function rememberCommunityToken(clientId, editToken) {
    if (!clientId || !/^[a-zA-Z0-9_-]{43}$/.test(String(editToken || ''))) return;
    var tokens = communityEditTokens();
    delete tokens[clientId];
    tokens[clientId] = editToken;
    var keys = Object.keys(tokens);
    while (keys.length > 500) delete tokens[keys.shift()];
    writeJson(COMMUNITY_EDIT_TOKEN_KEY, tokens);
  }
  function forgetCommunityOwnership(clientId) {
    var tokens = communityEditTokens();
    delete tokens[clientId];
    writeJson(COMMUNITY_EDIT_TOKEN_KEY, tokens);
    writeJson(COMMUNITY_OWNED_KEY, communityOwnedIds().filter(function (item) { return item !== clientId; }));
  }
  function communityEncode(topic, parent, author, body) {
    var cleanTopic = String(topic || '').trim().slice(0, 44) || 'Vispārīgi';
    var cleanParent = String(parent || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
    var cleanAuthor = String(author || '').trim().slice(0, 60);
    return '[[rgchat;topic=' + encodeURIComponent(cleanTopic) + ';parent=' + cleanParent + ';author=' + encodeURIComponent(cleanAuthor) + ']]\n' + String(body || '').trim();
  }
  function communityDecode(item) {
    var raw = String(item && item.text || '');
    var match = raw.match(/^\[\[rgchat;topic=([^;\]]*);parent=([^;\]]*)(?:;author=([^\]]*))?\]\]\n?/);
    var topic = item && item.kind === 'suggestion' ? 'Idejas' : 'Vispārīgi';
    var parent = '';
    var author = '';
    if (match) {
      try { topic = decodeURIComponent(match[1]) || topic; } catch (_error) {}
      parent = match[2] || '';
      try { author = decodeURIComponent(match[3] || ''); } catch (_error) {}
      raw = raw.slice(match[0].length);
    }
    return Object.assign({}, item, {
      topic: String(topic || 'Vispārīgi').slice(0, 44),
      parent: parent,
      author: String(author || '').slice(0, 60),
      body: raw,
      key: String(item && (item.id || item.clientId) || '')
    });
  }
  function communityInitials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'A';
    return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toLocaleUpperCase('lv-LV');
  }
  function refreshCommunityAuthors() {
    var selected = localStorage.getItem(COMMUNITY_AUTHOR_KEY) || '';
    var names = [];
    var nameKeys = {};
    function add(name) {
      var clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      if (clean && clean === clean.toLocaleUpperCase('lv-LV')) {
        clean = clean.split(' ').map(function (part) {
          var lower = part.toLocaleLowerCase('lv-LV');
          return lower.charAt(0).toLocaleUpperCase('lv-LV') + lower.slice(1);
        }).join(' ');
      }
      var key = clean.toLocaleLowerCase('lv-LV');
      if (clean && !nameKeys[key]) {
        nameKeys[key] = true;
        names.push(clean);
      }
    }
    try {
      var stats = moodStats(true);
      (stats.staff || []).forEach(function (person) { add(person.name); });
    } catch (_error) {}
    list.querySelectorAll('.mk-mid-name-wrap').forEach(function (node) {
      var first = node.querySelector('.name-main');
      var last = node.querySelector('.name-sub');
      add(((first && first.textContent) || '') + ' ' + ((last && last.textContent) || ''));
    });
    if (selected) add(selected);
    names.sort(function (a, b) { return a.localeCompare(b, 'lv'); });
    commsAuthor.replaceChildren();
    var anonymous = document.createElement('option');
    anonymous.value = '';
    anonymous.textContent = 'Anonīmi';
    commsAuthor.appendChild(anonymous);
    names.forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      commsAuthor.appendChild(option);
    });
    var selectedKey = selected.toLocaleLowerCase('lv-LV');
    var canonicalSelected = names.find(function (name) { return name.toLocaleLowerCase('lv-LV') === selectedKey; }) || '';
    commsAuthor.value = canonicalSelected;
  }
  function communityMessageTime(item) {
    var stamp = Number(item.createdAt) || 0;
    var time = stamp ? new Date(stamp).toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' }) : '';
    var day = item.date || item.shiftDay || '';
    return (day ? compactDay(day) : '') + (day && time ? ' · ' : '') + time;
  }
  function communityTopicStats() {
    var stats = {};
    communityMessages.forEach(function (item) {
      var topic = item.topic || 'Vispārīgi';
      if (!stats[topic]) stats[topic] = { topic: topic, count: 0, latest: 0 };
      stats[topic].count += 1;
      stats[topic].latest = Math.max(stats[topic].latest, Number(item.createdAt) || 0);
    });
    return Object.keys(stats).map(function (key) { return stats[key]; }).sort(function (a, b) { return b.latest - a.latest; });
  }
  function setCommunityMode(mode) {
    communityMode = mode === 'topics' ? 'topics' : 'all';
    modal.querySelectorAll('[data-rg-comms-mode]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.rgCommsMode === communityMode);
    });
    if (communityMode === 'all') {
      communityView = 'all';
      communityTopic = '';
      modal.removeAttribute('data-mobile-panel');
    } else {
      var mobileTopics = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
      if (mobileTopics) {
        modal.dataset.mobilePanel = 'topics';
      } else {
        var topics = communityTopicStats();
        if (!communityTopic || !topics.some(function (item) { return item.topic === communityTopic; })) {
          communityTopic = topics.length ? topics[0].topic : 'Vispārīgi';
        }
        communityView = 'topic';
        commsTopicInput.value = communityTopic === 'Vispārīgi' ? '' : communityTopic;
        modal.removeAttribute('data-mobile-panel');
      }
    }
    renderCommunity();
  }
  function selectCommunityTopic(topic) {
    communityMode = 'topics';
    communityView = 'topic';
    communityTopic = topic || 'Vispārīgi';
    commsTopicInput.value = communityTopic === 'Vispārīgi' ? '' : communityTopic;
    modal.removeAttribute('data-mobile-panel');
    modal.querySelectorAll('[data-rg-comms-mode]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.rgCommsMode === 'topics');
    });
    renderCommunity();
  }
  /* Tēmas emoji izvēle. Izmanto to pašu Fluent komplektu, kas appā jau ir
     (js/emoji.js katalogs), nevis piecas iepriekš izvēlētas sejiņas. Skaidrība
     pirms blīvuma: virsraksts nosauc tēmu, meklēšana ir pirmais lauks,
     kategorijas ir kapsulas, un abas darbības — noņemt un aizvērt — ir
     redzami vārdi, nevis ikonas. */
  var topicPicker = null;
  var topicPickerTopic = '';
  var topicPickerReturn = null;
  var topicPickerTab = 'all';
  var topicPickerQuery = '';
  var topicPickerMode = 'topic';   // 'topic' | 'message'
  /* Kuri koda punkti Fluent fontam tiešām ir. Saraksts nāk no paša fonta CSS
     (unicode-range gabali), tāpēc tas nekad nenovecos attiecībā pret fontu, un
     emoji, ko uzzīmētu sistēmas fonts, izvēlnē vispār neparādās. */
  var fluentRanges = null;
  function fluentCoverage() {
    if (fluentRanges) return fluentRanges;
    var ranges = [];
    var sheets = Array.prototype.slice.call(document.styleSheets);
    sheets.forEach(function (sheet) {
      if (!/FluentEmojiColor/.test(sheet.href || '')) return;
      var rules;
      try { rules = sheet.cssRules; } catch (_error) { return; }
      Array.prototype.forEach.call(rules || [], function (rule) {
        if (!rule || rule.type !== 5 || !rule.style) return;       // @font-face
        String(rule.style.unicodeRange || '').split(',').forEach(function (part) {
          var match = part.trim().match(/^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/);
          if (!match) return;
          var from = parseInt(match[1], 16);
          ranges.push([from, match[2] ? parseInt(match[2], 16) : from]);
        });
      });
    });
    fluentRanges = ranges;
    return fluentRanges;
  }
  // U+FE0F (variation selector) and U+200D (joiner) are glue, not glyphs.
  function fluentDraws(emoji) {
    var ranges = fluentCoverage();
    if (!ranges.length) return true;                                // font CSS not parsed: show everything
    var points = Array.from(String(emoji || ''));
    for (var i = 0; i < points.length; i++) {
      var code = points[i].codePointAt(0);
      if (code === 0xFE0F || code === 0x200D || code === 0xFE0E) continue;
      var covered = ranges.some(function (range) { return code >= range[0] && code <= range[1]; });
      if (!covered) return false;
    }
    return true;
  }
  /* Meklēšanas vārdi. Blakus rokā rakstītajiem nosaukumiem der arī animēto
     Fluent failu vārdi (x-ray.webp -> "x ray"), tāpēc meklē arī tie emoji,
     kuriem latviskā nosaukuma nav. */
  var fluentFileNames = null;
  function loadFluentNames() {
    if (fluentFileNames) return;
    fluentFileNames = {};
    fetch('assets/emoji-anim/manifest.json?v=' + (window.__minkaLocalBuild || '1'), { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var all = data && data.emoji ? data.emoji : {};
        Object.keys(all).forEach(function (key) {
          var file = String(all[key] && all[key].file || '').replace(/\.webp$/, '').replace(/-/g, ' ');
          if (file) fluentFileNames[key] = file;
        });
        if (topicPicker) renderTopicEmojiGrid();
      })
      .catch(function () {});
  }
  function emojiCatalogue() {
    try {
      if (window.MinkaEmoji && typeof window.MinkaEmoji.catalogue === 'function') return window.MinkaEmoji.catalogue();
    } catch (_error) {}
    return { sections: [{ id: 'all', label: '⭐', title: 'Visi' }], bySection: { all: ['💬', '☕', '🩻', '🌙', '⚡', '🔥'] }, names: {} };
  }
  function closeTopicEmojiPicker() {
    if (!topicPicker) return;
    topicPicker.remove();
    topicPicker = null;
    if (topicPickerReturn && topicPickerReturn.isConnected) topicPickerReturn.focus({ preventScroll: true });
    topicPickerReturn = null;
  }
  function renderTopicEmojiGrid() {
    if (!topicPicker) return;
    var data = emojiCatalogue();
    var list = (data.bySection[topicPickerTab] || data.bySection.all || []).slice();
    var query = topicPickerQuery.trim().toLocaleLowerCase('lv-LV');
    if (query) list = (data.bySection.all || []).slice();
    list = list.filter(fluentDraws);
    if (query) {
      list = list.filter(function (emoji) {
        var name = String(data.names[emoji] || '').toLocaleLowerCase('lv-LV');
        var file = String((fluentFileNames || {})[emoji] || '').toLocaleLowerCase('lv-LV');
        return emoji === query || name.indexOf(query) >= 0 || file.indexOf(query) >= 0;
      });
    }
    var grid = topicPicker.querySelector('.rg-emoji-grid');
    grid.replaceChildren();
    if (!list.length) {
      var empty = document.createElement('p');
      empty.className = 'rg-emoji-empty';
      empty.textContent = 'Nekas neatbilst. Pamēģini citu vārdu vai izvēlies kategoriju.';
      grid.appendChild(empty);
      return;
    }
    var current = topicPickerMode === 'topic' ? topicEmoji(topicPickerTopic) : '';
    list.forEach(function (emoji) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'rg-emoji-cell' + (emoji === current ? ' is-on' : '');
      button.dataset.rgPickEmoji = emoji;
      var label = data.names[emoji] || (fluentFileNames || {})[emoji] || emoji;
      button.title = label;
      button.setAttribute('aria-label', label);
      button.textContent = emoji;
      button.addEventListener('mouseenter', function () { previewPickedEmoji(emoji, label); });
      button.addEventListener('focus', function () { previewPickedEmoji(emoji, label); });
      grid.appendChild(button);
    });
  }
  /* Pāris vārdu lodziņš pēc emoji izvēles. Skaitītājs rāda, cik atlicis,
     poga ir neaktīva, kamēr teksts par īsu, un Esc aizver. */
  var moodNoteBox = null;
  function closeMoodNote() {
    if (!moodNoteBox) return;
    moodNoteBox.remove();
    moodNoteBox = null;
  }
  function openMoodNote(emoji, anchor) {
    closeMoodNote();
    var day = shiftDayKey();
    var existing = ownMoodFor(day);
    moodNoteBox = document.createElement('div');
    moodNoteBox.className = 'rg-mood-note';
    moodNoteBox.setAttribute('role', 'dialog');
    moodNoteBox.setAttribute('aria-label', 'Pāris vārdi par maiņu');
    moodNoteBox.innerHTML = '<div class="rg-mood-note-sheet">'
      + '<div class="rg-mood-note-head"><span class="rg-mood-note-emoji" aria-hidden="true">' + emoji + '</span>'
      + '<div><strong>Kā bija maiņa?</strong><small>Pāris vārdi — paliek uz kartītes visu dienu</small></div></div>'
      + '<input class="rg-mood-note-text" type="text" maxlength="' + MOOD_NOTE_MAX + '" placeholder="Piem. mierīga nakts" autocomplete="off">'
      + '<div class="rg-mood-note-foot"><span class="rg-mood-note-count">0/' + MOOD_NOTE_MAX + '</span>'
      + '<span class="rg-mood-note-error" role="status"></span>'
      + '<button type="button" class="rg-mood-note-cancel">Atcelt</button>'
      + '<button type="button" class="rg-mood-note-save" disabled>Saglabāt</button></div>'
      + '</div>';
    document.body.appendChild(moodNoteBox);
    var sheet = moodNoteBox.querySelector('.rg-mood-note-sheet');
    var field = moodNoteBox.querySelector('.rg-mood-note-text');
    var counter = moodNoteBox.querySelector('.rg-mood-note-count');
    var errorLine = moodNoteBox.querySelector('.rg-mood-note-error');
    var saveButton = moodNoteBox.querySelector('.rg-mood-note-save');
    if (existing && existing.emoji === emoji) field.value = existing.note || '';
    var sync = function () {
      var clean = cleanMoodNote(field.value);
      counter.textContent = clean.length + '/' + MOOD_NOTE_MAX;
      saveButton.disabled = clean.length < MOOD_NOTE_MIN;
    };
    field.addEventListener('input', sync);
    field.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !saveButton.disabled) { event.preventDefault(); saveButton.click(); }
    });
    sync();
    if (anchor) {
      var rect = anchor.getBoundingClientRect();
      var width = sheet.offsetWidth || 300;
      var height = sheet.offsetHeight || 190;
      var left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
      var top = rect.top - height - 10 >= 8 ? rect.top - height - 10 : Math.min(window.innerHeight - height - 8, rect.bottom + 10);
      sheet.style.left = Math.round(left) + 'px';
      sheet.style.top = Math.round(top) + 'px';
    }
    moodNoteBox.addEventListener('click', function (event) {
      if (event.target === moodNoteBox || event.target.closest('.rg-mood-note-cancel')) { closeMoodNote(); return; }
      if (!event.target.closest('.rg-mood-note-save')) return;
      saveButton.disabled = true;
      errorLine.textContent = '';
      postOwnMood(day, emoji, field.value).then(function (result) {
        if (result.ok) { closeMoodNote(); return; }
        errorLine.textContent = result.error || 'Neizdevās.';
        saveButton.disabled = false;
      });
    });
    window.setTimeout(function () { field.focus(); }, 60);
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && moodNoteBox) { event.stopPropagation(); closeMoodNote(); }
  }, true);
  function previewPickedEmoji(emoji, label) {
    if (!topicPicker) return;
    var face = topicPicker.querySelector('.rg-emoji-preview');
    var name = topicPicker.querySelector('.rg-emoji-preview-name');
    if (face) face.textContent = emoji;
    if (name) name.textContent = label;
  }
  // The popover sits next to the button that opened it, flipping above when
  // there is no room below, and never leaves the dialog.
  function placeTopicPicker(anchor) {
    if (!topicPicker || !anchor) return;
    var sheet = topicPicker.querySelector('.rg-emoji-sheet');
    var host = topicPicker.getBoundingClientRect();
    var rect = anchor.getBoundingClientRect();
    var width = sheet.offsetWidth || 320;
    var height = sheet.offsetHeight || 360;
    var left = Math.min(Math.max(8, rect.left - host.left), host.width - width - 8);
    var below = rect.bottom - host.top + 8;
    var above = rect.top - host.top - height - 8;
    var top = below + height <= host.height - 8 ? below : Math.max(8, above);
    sheet.style.left = Math.round(left) + 'px';
    sheet.style.top = Math.round(top) + 'px';
  }
  function openTopicEmojiPicker(topic, anchor, mode) {
    closeTopicEmojiPicker();
    topicPickerMode = mode === 'message' || mode === 'mood' ? mode : 'topic';
    topicPickerTopic = String(topic || '');
    topicPickerReturn = anchor || null;
    topicPickerQuery = '';
    topicPickerTab = 'all';
    if (topicPickerMode === 'topic' && !topicPickerTopic) return;
    var data = emojiCatalogue();
    topicPicker = document.createElement('div');
    topicPicker.className = 'rg-emoji-picker';
    topicPicker.setAttribute('role', 'dialog');
    topicPicker.setAttribute('aria-modal', 'true');
    var isTopic = topicPickerMode === 'topic';
    topicPicker.setAttribute('aria-label', isTopic ? 'Tēmas emoji: ' + topicPickerTopic
      : topicPickerMode === 'mood' ? 'Savs maiņas emoji' : 'Emoji ziņai');
    topicPicker.innerHTML = '<div class="rg-emoji-sheet">'
      + '<input class="rg-emoji-search" type="search" placeholder="Meklēt emoji" autocomplete="off" aria-label="Meklēt emoji pēc nosaukuma">'
      + '<div class="rg-emoji-tabs" role="tablist">' + data.sections.map(function (sec) {
        return '<button type="button" class="rg-emoji-tab' + (sec.id === 'all' ? ' is-on' : '') + '" data-rg-emoji-tab="' + sec.id + '" title="' + sec.title + '" aria-label="' + sec.title + '"><span>' + sec.label + '</span></button>';
      }).join('') + '</div>'
      + '<div class="rg-emoji-grid"></div>'
      + '<div class="rg-emoji-foot"><span class="rg-emoji-preview" aria-hidden="true">' + (isTopic ? (topicEmoji(topicPickerTopic) || '☺') : '☺') + '</span>'
      + '<span class="rg-emoji-preview-name">' + (isTopic ? '# ' + topicPickerTopic
        : topicPickerMode === 'mood' ? 'Izvēlies emoji, tad uzraksti pāris vārdus' : 'Izvēlies emoji') + '</span>'
      + (isTopic ? '<button type="button" class="rg-emoji-clear" data-rg-emoji-clear="1">Noņemt</button>' : '')
      + '</div>'
      + '</div>';
    var host = modal.hidden ? document.body : modal;
    if (host === document.body) topicPicker.classList.add('rg-emoji-picker-loose');
    host.appendChild(topicPicker);
    loadFluentNames();
    renderTopicEmojiGrid();
    placeTopicPicker(anchor);
    var search = topicPicker.querySelector('.rg-emoji-search');
    search.addEventListener('input', function () {
      topicPickerQuery = search.value || '';
      renderTopicEmojiGrid();
    });
    topicPicker.addEventListener('click', function (event) {
      if (event.target === topicPicker || event.target.closest('[data-rg-emoji-close]')) { closeTopicEmojiPicker(); return; }
      var tab = event.target.closest('[data-rg-emoji-tab]');
      if (tab) {
        topicPickerTab = tab.dataset.rgEmojiTab;
        topicPickerQuery = '';
        search.value = '';
        topicPicker.querySelectorAll('.rg-emoji-tab').forEach(function (button) {
          button.classList.toggle('is-on', button === tab);
        });
        renderTopicEmojiGrid();
        return;
      }
      if (event.target.closest('[data-rg-emoji-clear]')) {
        setTopicEmoji(topicPickerTopic, '');
        closeTopicEmojiPicker();
        return;
      }
      var cell = event.target.closest('[data-rg-pick-emoji]');
      if (cell) {
        var picked = cell.dataset.rgPickEmoji;
        if (topicPickerMode === 'mood') {
          var moodAnchor = topicPickerReturn;
          closeTopicEmojiPicker();
          openMoodNote(picked, moodAnchor);
          return;
        }
        if (topicPickerMode === 'message') {
          textarea.value += picked;
          updateTextState();
          closeTopicEmojiPicker();
          textarea.focus();
          return;
        }
        // The topic may still be being typed, so remember the emoji for the
        // name in the field and show it right there.
        var typed = String(commsTopicInput.value || '').trim() || topicPickerTopic;
        setTopicEmoji(typed, picked);
        syncTopicEmojiButton();
        closeTopicEmojiPicker();
      }
    });
    window.setTimeout(function () { search.focus(); }, 60);
  }
  function syncTopicEmojiButton() {
    var button = modal.querySelector('#rgCommsTopicEmoji');
    if (!button) return;
    var typed = String(commsTopicInput.value || '').trim();
    var chosen = typed ? topicEmoji(typed) : '';
    button.textContent = chosen || '☺';
    button.classList.toggle('has-emoji', !!chosen);
    button.classList.toggle('can-pick', !!typed && !chosen);
    button.title = typed
      ? (chosen ? 'Mainīt šīs tēmas emoji' : 'Piešķirt emoji tēmai “' + typed + '”')
      : 'Ieraksti tēmas nosaukumu, tad šeit var piešķirt tai emoji';
    button.setAttribute('aria-label', button.title);
    commsTopicInput.placeholder = 'Tēma';
  }
  function renderCommunityTopics() {
    commsTopics.replaceChildren();
    communityTopicStats().forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'rg-comms-topic' + (communityView === 'topic' && communityTopic === item.topic ? ' is-active' : '');
      button.dataset.rgCommunityTopic = item.topic;
      var chosen = topicEmoji(item.topic);
      var icon = document.createElement('span');
      icon.className = 'rg-comms-nav-icon' + (chosen ? ' rg-comms-topic-emoji' : '');
      icon.textContent = chosen || (item.topic === 'Idejas' ? '✦' : '#');
      var copy = document.createElement('span');
      copy.className = 'rg-comms-topic-copy';
      var title = document.createElement('strong');
      title.textContent = item.topic;
      button.title = item.topic;
      var activity = document.createElement('small');
      activity.textContent = item.latest ? new Date(item.latest).toLocaleDateString('lv-LV', { day: '2-digit', month: 'short' }) : '';
      copy.append(title, activity);
      var count = document.createElement('small');
      count.className = 'rg-comms-count';
      count.textContent = String(item.count);
      button.append(icon, copy, count);
      commsTopics.appendChild(button);
    });
  }
  function renderCommunity(loadingText) {
    renderCommunityTopics();
    var today = shiftDayKey();
    commsAllCount.textContent = String(communityMessages.length);
    commsTodayCount.textContent = String(communityMessages.filter(function (item) {
      return (item.date || item.shiftDay) === today;
    }).length);
    modal.querySelectorAll('[data-rg-comms-view]').forEach(function (button) {
      button.classList.toggle('is-active', communityView === button.dataset.rgCommsView);
    });
    var query = String(commsSearch.value || '').trim().toLocaleLowerCase('lv-LV');
    var items = communityMessages.filter(function (item) {
      if (communityView === 'today' && (item.date || item.shiftDay) !== today) return false;
      if (communityView === 'topic' && item.topic !== communityTopic) return false;
      if (query && (item.body + ' ' + item.topic + ' ' + (item.date || item.shiftDay || '')).toLocaleLowerCase('lv-LV').indexOf(query) < 0) return false;
      return true;
    }).sort(function (a, b) { return (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0); });
    if (communityView === 'topic') {
      commsFeedTitle.textContent = '# ' + communityTopic;
      commsFeedSubtitle.textContent = items.length + ' ziņas šajā tēmā';
    } else if (communityView === 'today') {
      commsFeedTitle.textContent = 'Šodien';
      commsFeedSubtitle.textContent = displayDay(today) + ' · ' + items.length + ' ziņas';
    } else {
      commsFeedTitle.textContent = query ? 'Meklēšanas rezultāti' : 'Visi komentāri';
      commsFeedSubtitle.textContent = query ? items.length + ' atrasti ieraksti' : 'Visa komandas sarakste vienuviet';
    }
    messageList.replaceChildren();
    if (!items.length) {
      var empty = document.createElement('p');
      empty.className = 'rg-comms-empty';
      empty.textContent = loadingText || (query
        ? 'Nekas netika atrasts. Pamēģini citu vārdu vai notīri meklēšanu.'
        : 'Te vēl ir kluss. Uzraksti pirmo ziņu laukā zemāk un spied Sūtīt.');
      messageList.appendChild(empty);
      return;
    }
    var byKey = {};
    communityMessages.forEach(function (item) { if (item.key) byKey[item.key] = item; });
    var owned = communityOwnedIds();
    items.forEach(function (item) {
      var editToken = communityEditToken(item.clientId);
      var own = !!item.pending || !!editToken || owned.indexOf(item.clientId) >= 0;
      var canMutate = !!item.pending || !!editToken;
      var authorName = item.author || 'Anonīms';
      var article = document.createElement('article');
      article.className = 'rg-comms-message' + (own ? ' is-own' : '');
      article.dataset.rgMessageKey = item.key;
      var avatar = document.createElement('span');
      avatar.className = 'rg-comms-avatar';
      avatar.textContent = communityInitials(authorName);
      var main = document.createElement('div');
      main.className = 'rg-comms-message-main';
      var head = document.createElement('div');
      head.className = 'rg-comms-message-head';
      var author = document.createElement('strong');
      author.textContent = authorName;
      var time = document.createElement('time');
      time.textContent = communityMessageTime(item) + (item.pending ? ' · gaida savienojumu' : '');
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'rg-comms-topic-chip';
      chip.dataset.rgCommunityTopic = item.topic;
      var chipEmoji = topicEmoji(item.topic);
      var chipMark = document.createElement('span');
      chipMark.className = chipEmoji ? 'rg-comms-topic-emoji' : '';
      chipMark.textContent = chipEmoji || '#';
      chip.append(chipMark, document.createTextNode(' ' + item.topic));
      head.append(author, time, chip);
      var bubble = document.createElement('div');
      bubble.className = 'rg-comms-bubble';
      if (item.parent && byKey[item.parent]) {
        var quote = document.createElement('span');
        quote.className = 'rg-comms-reply-quote';
        quote.textContent = '↳ ' + byKey[item.parent].body.slice(0, 110);
        bubble.appendChild(quote);
      }
      bubble.appendChild(document.createTextNode(item.body));
      var actions = document.createElement('div');
      actions.className = 'rg-comms-message-actions';
      var reply = document.createElement('button');
      reply.type = 'button';
      reply.dataset.rgCommunityReply = item.key;
      reply.textContent = '↩ Atbildēt';
      actions.appendChild(reply);
      if (canMutate && item.clientId) {
        var edit = document.createElement('button');
        edit.type = 'button';
        edit.dataset.rgCommunityEdit = item.key;
        edit.textContent = 'Rediģēt';
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.rgCommunityDelete = item.key;
        remove.textContent = 'Dzēst';
        actions.append(edit, remove);
      }
      main.append(head, bubble, actions);
      article.append(avatar, main);
      messageList.appendChild(article);
    });
    window.requestAnimationFrame(function () { messageList.scrollTop = messageList.scrollHeight; });
  }
  async function flushAllCommunityPending() {
    var pending = readJson(TEXT_KEY, []);
    var seen = {};
    if (!Array.isArray(pending)) return;
    for (var i = 0; i < pending.length; i++) {
      var item = pending[i];
      if (!item || !item.pending) continue;
      var key = item.shiftDay + '|' + item.type;
      if (seen[key]) continue;
      seen[key] = true;
      await postPendingMessages(item.shiftDay, item.type);
    }
  }
  async function loadCommunityPair(pair) {
    var messages = [];
    var before = null;
    var seenCursors = {};
    while (true) {
      var path = '/api/feedback?date=' + encodeURIComponent(pair.date)
        + '&kind=' + encodeURIComponent(pair.kind) + '&limit=100';
      if (before != null) path += '&before=' + encodeURIComponent(before);
      var data = await fetchFeedback(path);
      messages = messages.concat(data.messages || []);
      if (!data.hasMore || data.nextBefore == null || seenCursors[data.nextBefore]) break;
      seenCursors[data.nextBefore] = true;
      before = data.nextBefore;
    }
    return messages;
  }
  async function loadCommunity() {
    var requestId = ++communityLoadId;
    commsStatus.textContent = 'Ielādē saraksti…';
    renderCommunity('Ielādē saraksti…');
    try {
      await flushAllCommunityPending();
      var groups = await Promise.all(['comment', 'suggestion'].map(function (kind) {
        return fetchFeedback('/api/feedback/days?kind=' + kind + '&limit=180').then(function (data) {
          return (data.days || []).map(function (day) { return { date: day.date, kind: kind }; });
        }).catch(function () { return []; });
      }));
      var pairs = [].concat.apply([], groups);
      ['comment', 'suggestion'].forEach(function (kind) {
        if (!pairs.some(function (pair) { return pair.date === shiftDayKey() && pair.kind === kind; })) pairs.push({ date: shiftDayKey(), kind: kind });
      });
      var pages = await Promise.all(pairs.map(function (pair) {
        return loadCommunityPair(pair).catch(function () { return []; });
      }));
      if (requestId !== communityLoadId) return;
      var combined = [].concat.apply([], pages);
      var local = readJson(TEXT_KEY, []);
      if (Array.isArray(local)) combined = combined.concat(local);
      var seen = {};
      communityMessages = combined.filter(function (item) {
        var key = item.clientId || ('id-' + item.id);
        if (seen[key]) return false;
        seen[key] = true;
        // Dienas noskaņas ieraksti brauc pa to pašu ceļu, bet pieder kartītei,
        // nevis sarakstei.
        if (parseMoodMessage(item)) return false;
        return item && (item.text || '').trim();
      }).map(communityDecode);
      remoteMessages = communityMessages;
      commsStatus.textContent = '';
      renderCommunity();
    } catch (_error) {
      if (requestId !== communityLoadId) return;
      var localOnly = readJson(TEXT_KEY, []);
      communityMessages = (Array.isArray(localOnly) ? localOnly : []).map(communityDecode);
      commsStatus.textContent = 'Bezsaistes režīms';
      renderCommunity();
    }
  }

  updateTextState = function () {
    var length = textarea.value.length;
    chars.textContent = length + ' / 560';
    save.disabled = !textarea.value.trim();
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(120, Math.max(44, textarea.scrollHeight)) + 'px';
  };
  // M3 container transform (js/mk-motion.js): the conversation grows out of
  // the button that opened it and returns into it. `hidden` is only set once
  // the close has played; `commsClosing` is the logical state meanwhile.
  var commsClosing = false;
  var commsOrigin = null;
  openModal = function (kind, trigger) {
    lastWriteButton = trigger || null;
    modal.dataset.kind = 'comment';
    modalDay = shiftDayKey();
    var wasShown = !modal.hidden && !commsClosing;
    commsClosing = false;
    modal.classList.remove('is-closing');
    modal.hidden = false;
    var dialog = modal.querySelector('.rg-feedback-dialog');
    if (!wasShown && window.MinkaMotion && dialog) {
      commsOrigin = trigger || window.MinkaMotion.recentLauncher();
      window.MinkaMotion.openSurface(dialog, { key: 'comms', origin: commsOrigin, scrim: modal });
    }
    syncFeedbackModalState(true);
    textarea.value = '';
    commsSearch.value = '';
    refreshCommunityAuthors();
    commsTopicInput.value = kind === 'suggestion' ? 'Idejas' : '';
    commsTopicInput.placeholder = 'Tēma';
    communityReply = null;
    communityEditing = null;
    commsReplying.textContent = '';
    commsCancelReply.hidden = true;
    communityView = kind === 'suggestion' ? 'topic' : 'all';
    communityTopic = kind === 'suggestion' ? 'Idejas' : '';
    communityMode = kind === 'suggestion' ? 'topics' : 'all';
    modal.removeAttribute('data-mobile-panel');
    updateTextState();
    setCommunityMode(communityMode);
    loadCommunity();
    window.setTimeout(function () { textarea.focus(); }, 80);
  };
  closeModal = function () {
    if (modal.hidden || commsClosing) return;
    var dialog = modal.querySelector('.rg-feedback-dialog');
    if (window.MinkaMotion && dialog) {
      commsClosing = true;
      modal.classList.add('is-closing');
      window.MinkaMotion.closeSurface(dialog, { key: 'comms', origin: commsOrigin, scrim: modal }, function () {
        if (!commsClosing) return;
        commsClosing = false;
        modal.classList.remove('is-closing');
        modal.hidden = true;
      });
    } else {
      modal.hidden = true;
    }
    communityLoadId += 1;
    syncFeedbackModalState(false);
    var closedAt = Date.now();
    markSeen('comment', closedAt);
    markSeen('suggestion', closedAt);
  };
  renderMessages = renderCommunity;
  loadMessages = function () { return loadCommunity(); };
  loadDayGroups = function () { return loadCommunity(); };
  selectMessageDay = function (day) {
    communityView = day === shiftDayKey() ? 'today' : 'all';
    renderCommunity();
  };
  saveText = async function () {
    var body = textarea.value.trim();
    if (!body) return;
    var topic = commsTopicInput.value.trim() || (communityView === 'topic' ? communityTopic : 'Vispārīgi');
    var parent = communityEditing ? (communityEditing.parent || '') : (communityReply && communityReply.key || '');
    var encoded = communityEncode(topic, parent, commsAuthor.value, body);
    save.disabled = true;
    commsStatus.textContent = communityEditing ? 'Saglabā izmaiņas…' : 'Nosūta…';
    if (communityEditing && communityEditing.clientId) {
      if (communityEditing.pending) {
        var pendingItems = readJson(TEXT_KEY, []);
        if (!Array.isArray(pendingItems)) pendingItems = [];
        pendingItems = pendingItems.map(function (item) {
          if (!item || item.clientId !== communityEditing.clientId) return item;
          return Object.assign({}, item, { text: encoded });
        });
        writeJson(TEXT_KEY, pendingItems);
      } else {
        var ownedToken = communityEditToken(communityEditing.clientId);
        if (!ownedToken) {
          commsStatus.textContent = 'Šī vecā ziņa ir tikai lasāma';
          save.disabled = false;
          return;
        }
        try {
          await fetchFeedback('/api/feedback/message', {
            method: 'PATCH', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ clientId: communityEditing.clientId, editToken: ownedToken, text: encoded })
          });
        } catch (_error) {
          commsStatus.textContent = 'Neizdevās rediģēt';
          save.disabled = false;
          return;
        }
      }
    } else {
      var clientId = newClientId();
      var editToken = newEditToken();
      rememberCommunityId(clientId);
      var items = readJson(TEXT_KEY, []);
      if (!Array.isArray(items)) items = [];
      items.unshift({ clientId: clientId, editToken: editToken, type: 'comment', text: encoded, shiftDay: shiftDayKey(), createdAt: Date.now(), pending: true });
      writeJson(TEXT_KEY, items.slice(0, 500));
      await postPendingMessages(shiftDayKey(), 'comment');
    }
    textarea.value = '';
    communityReply = null;
    communityEditing = null;
    commsReplying.textContent = '';
    commsCancelReply.hidden = true;
    updateTextState();
    await loadCommunity();
  };

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && topicPicker) { event.stopPropagation(); closeTopicEmojiPicker(); }
  }, true);
  modal.addEventListener('click', function (event) {
    var topicEmojiButton = event.target.closest('#rgCommsTopicEmoji');
    if (topicEmojiButton) {
      event.stopPropagation();
      var typed = String(commsTopicInput.value || '').trim();
      if (!typed) { commsTopicInput.focus(); commsStatus.textContent = 'Vispirms ieraksti tēmas nosaukumu.'; return; }
      openTopicEmojiPicker(typed, topicEmojiButton, 'topic');
      return;
    }
    if (event.target.closest('#rgCommsEmojiMore')) {
      event.stopPropagation();
      openTopicEmojiPicker('', event.target.closest('#rgCommsEmojiMore'), 'message');
      return;
    }
    var mode = event.target.closest('[data-rg-comms-mode]');
    if (mode) { setCommunityMode(mode.dataset.rgCommsMode); return; }
    var view = event.target.closest('[data-rg-comms-view]');
    if (view) {
      communityView = view.dataset.rgCommsView;
      communityTopic = '';
      modal.removeAttribute('data-mobile-panel');
      renderCommunity();
      return;
    }
    var topic = event.target.closest('[data-rg-community-topic]');
    if (topic) { selectCommunityTopic(topic.dataset.rgCommunityTopic); return; }
    var emoji = event.target.closest('[data-rg-chat-emoji]');
    if (emoji) {
      textarea.value += emoji.dataset.rgChatEmoji;
      updateTextState();
      textarea.focus();
      return;
    }
    var reply = event.target.closest('[data-rg-community-reply]');
    if (reply) {
      communityReply = communityMessages.find(function (item) { return item.key === reply.dataset.rgCommunityReply; }) || null;
      if (communityReply) {
        commsTopicInput.value = communityReply.topic === 'Vispārīgi' ? '' : communityReply.topic;
        commsReplying.textContent = 'Atbilde: ' + communityReply.body.slice(0, 75);
        commsCancelReply.hidden = false;
        textarea.focus();
      }
      return;
    }
    var edit = event.target.closest('[data-rg-community-edit]');
    if (edit) {
      communityEditing = communityMessages.find(function (item) { return item.key === edit.dataset.rgCommunityEdit; }) || null;
      if (communityEditing) {
        textarea.value = communityEditing.body;
        commsTopicInput.value = communityEditing.topic === 'Vispārīgi' ? '' : communityEditing.topic;
        if (communityEditing.author && ![].slice.call(commsAuthor.options).some(function (option) { return option.value === communityEditing.author; })) {
          var authorOption = document.createElement('option');
          authorOption.value = communityEditing.author;
          authorOption.textContent = communityEditing.author;
          commsAuthor.appendChild(authorOption);
        }
        commsAuthor.value = communityEditing.author || '';
        commsReplying.textContent = 'Rediģē ziņu';
        commsCancelReply.hidden = false;
        updateTextState();
        textarea.focus();
      }
      return;
    }
    var remove = event.target.closest('[data-rg-community-delete]');
    if (remove) {
      var item = communityMessages.find(function (entry) { return entry.key === remove.dataset.rgCommunityDelete; });
      if (!item || !item.clientId || !window.confirm('Dzēst šo ziņu?')) return;
      if (item.pending) {
        removePendingMessage(item.clientId);
        commsStatus.textContent = '';
        return;
      }
      var editToken = communityEditToken(item.clientId);
      if (!editToken) {
        commsStatus.textContent = 'Šī vecā ziņa ir tikai lasāma';
        return;
      }
      fetchFeedback('/api/feedback/message', {
        method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId: item.clientId, editToken: editToken })
      }).then(function () {
        forgetCommunityOwnership(item.clientId);
        return loadGlobalEntryCount('comment', true);
      })
        .then(loadCommunity).catch(function () { commsStatus.textContent = 'Neizdevās izdzēst'; });
    }
  });
  modal.querySelector('#rgCommsNewTopic').addEventListener('click', function () {
    communityMode = 'topics';
    communityView = 'all';
    communityTopic = '';
    modal.removeAttribute('data-mobile-panel');
    commsTopicInput.value = '';
    commsTopicInput.placeholder = 'Nosauc jauno tēmu…';
    commsTopicInput.focus();
    renderCommunity();
  });
  commsCancelReply.addEventListener('click', function () {
    communityReply = null;
    communityEditing = null;
    commsReplying.textContent = '';
    commsCancelReply.hidden = true;
    textarea.value = '';
    updateTextState();
  });
  commsSearch.addEventListener('input', function () { renderCommunity(); });
  commsAuthor.addEventListener('change', function () {
    localStorage.setItem(COMMUNITY_AUTHOR_KEY, commsAuthor.value);
  });
  textarea.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); saveText(); }
  });

  list.addEventListener('click', function (event) {
    var ownMood = event.target.closest('[data-rg-own-mood]');
    if (ownMood) {
      event.preventDefault();
      event.stopPropagation();
      openTopicEmojiPicker('', ownMood, 'mood');
      return;
    }
    var tap = event.target.closest('[data-rg-pulse]');
    if (tap) { event.preventDefault(); event.stopPropagation(); addReaction(tap); return; }
    var writeButton = event.target.closest('[data-rg-write]');
    if (writeButton) { event.preventDefault(); event.stopPropagation(); openModal(writeButton.dataset.rgWrite, writeButton); }

  });
  // Hover/press preview. Purely visual — it renders the mood under the pointer
  // and rolls back on leave; only the real click commits anything.
  // Opens the shell's own coffee statistics panel — the one with the per-person
  // and per-day views — instead of a second, poorer copy inside this card.
  list.addEventListener('click', function (event) {
    var button = event.target.closest('[data-rg-topbtn]');
    if (!button) return;
    event.preventDefault();
    var rect = button.getBoundingClientRect();
    try {
      window.parent.postMessage({
        type: 'minka-open-coffee-stats',
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      }, window.location.origin);
    } catch (_error) {}
  });
  list.addEventListener('pointerover', function (event) {
    var tap = event.target.closest('[data-rg-pulse]');
    if (tap) previewMoodBlob(tap.dataset.rgPulse);
  });
  list.addEventListener('pointerout', function (event) {
    var tap = event.target.closest('[data-rg-pulse]');
    if (tap && !tap.contains(event.relatedTarget)) endMoodBlobPreview();
  });
  list.addEventListener('pointercancel', endMoodBlobPreview);
  modal.addEventListener('click', function (event) {
    if (event.target === modal || event.target.closest('[data-rg-close]')) closeModal();
    var dayButton = event.target.closest('[data-rg-day]');
    if (dayButton) selectMessageDay(dayButton.dataset.rgDay);
    var removePending = event.target.closest('[data-rg-remove-pending]');
    if (removePending) removePendingMessage(removePending.dataset.rgRemovePending);
  });
  textarea.addEventListener('input', updateTextState);
  commsTopicInput.addEventListener('input', syncTopicEmojiButton);
  save.addEventListener('click', saveText);
  moreButton.addEventListener('click', function () { loadMessages(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !modal.hidden && !commsClosing) closeModal();
  });
  // The shell page shares this origin, so each of its localStorage writes (radio,
  // theme, bolus…) fires `storage` here — about 30 during startup, each one a full
  // card repaint plus a forced layout. Repaint only for keys paintCounts() reads,
  // plus the shift-radio history that MinkaDaybook.enhance() draws; a null key
  // means storage was cleared.
  var PAINT_STORAGE_KEYS = [PULSE_KEY, PENDING_PULSE_KEY, TEXT_KEY, ENTRY_COUNT_KEY,
    SEEN_KEY, SEEN_COUNT_KEY, 'minkaRgOwnMoodV1', 'minkaShiftRadioV1'];
  window.addEventListener('storage', function (event) {
    if (event.key === null || PAINT_STORAGE_KEYS.indexOf(event.key) >= 0) paintCounts();
  });
  window.addEventListener('daySelected', scheduleMoodDayRefresh);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      loadRatings(shiftDayKey(), true);
      loadGlobalEntryCount('comment', true);
    }
  });
  new MutationObserver(function () {
    // Most subtree changes are counters, emoji or card text and cannot alter
    // the feedback card's grid placement. Re-running mount() for all of them
    // scheduled a needless forced layout after every day switch. Only recover
    // the card when the roster was rebuilt without one.
    var label = list.querySelector('.cards-section-label-rd');
    var section = label && label.closest('.cards-section');
    var grid = section && section.querySelector('.cards-subgrid');
    if (grid && !grid.querySelector('.rg-feedback-card')) mount();
  }).observe(list, { childList: true, subtree: true });
  // The data owner signals one completed snapshot, including source-only changes.
  // No whole-roster DOM observer or extra network polling is needed here.
  var moodCoffeeWatch = 0;
  function scheduleMoodCoffeeRefresh() {
    window.clearTimeout(moodCoffeeWatch);
    moodStatsCache.at = 0;
    if (document.hidden) return;
    moodCoffeeWatch = window.setTimeout(function () { paintMoodCoffee(true); }, 120);
  }
  document.addEventListener('minka:coffee-changed', function (event) {
    if (event.detail && event.detail.day && event.detail.day !== String(window.__activeDateStr || '')) return;
    scheduleMoodCoffeeRefresh();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) scheduleMoodCoffeeRefresh();
  });
  // Card fatigue percentages appear only once the fatigue model has decorated
  // the roster (and change with night plans). Without these the mood card kept
  // the "0 %" it read before that, unless an unrelated repaint happened to follow.
  document.addEventListener('minka:initial-decorations-ready', scheduleMoodCoffeeRefresh);
  document.addEventListener('minka:fatigue-updated', scheduleMoodCoffeeRefresh);
  if (window.__minkaInitialDecorationsReady) scheduleMoodCoffeeRefresh();
  syncFeedbackModalState(false);
  mount();
  paintCounts();
  loadGlobalEntryCount('comment');
})();
