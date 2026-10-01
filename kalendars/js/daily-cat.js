(function () {
  'use strict';

  var CATALOG_URL = 'data/codex-cats.json?v=20260825dailycat1';
  var CHOICE_KEY = 'minka:daily-agent-pet:choice';
  var DAY_MS = 86400000;
  var DAY_START_HOUR = 8;
  var PET_SIZE = 96;
  var PAGE_SIZE = 12;
  var SPRITE_COLS = 8;
  var SPRITE_ROWS = 9;
  var IDLE_DELAYS = [1680, 660, 660, 840, 840, 1920];
  var ACTIONS = {
    idle: { row: 0, frames: 6, fps: 6 },
    'running-right': { row: 1, frames: 8, fps: 7 },
    'running-left': { row: 2, frames: 8, fps: 7 },
    waving: { row: 3, frames: 4, fps: 6 },
    jumping: { row: 4, frames: 5, fps: 7 },
    failed: { row: 5, frames: 8, fps: 7 },
    waiting: { row: 6, frames: 6, fps: 6 },
    running: { row: 7, frames: 6, fps: 7 },
    review: { row: 8, frames: 6, fps: 6 }
  };
  var catalog = [];
  var selectedIndex = -1;
  var pickerPage = 0;
  var picker = null;
  var pickerGrid = null;
  var pickerPageLabel = null;
  var petButton = null;
  var spriteMain = null;
  var spriteGhost = null;
  var pickerOpen = false;
  var midnightTimer = 0;
  var positionObserver = null;
  var positionTimer = 0;
  var anchorFrame = 0;
  var anchorObserver = null;
  var anchorTarget = null;
  var dragFrame = 0;
  var dragState = null;
  var skipClick = false;
  var frameTimer = 0;
  var ambientTimer = 0;
  var ghostAnimation = null;
  var currentFrame = { row: 0, frame: 0 };
  var actionToken = 0;
  var switchToken = 0;
  var rolloverDutyDay = '';
  var activePetDayKey = '';
  var positionMode = 'auto';
  var manualPosition = null;
  var renderedPosition = null;
  // The comment bubble is the pet's home, but every few minutes it wanders off
  // to sit on somebody's card. Only the choice is random — the placement itself
  // is derived from the anchor, so scrolling still follows it exactly.
  var ANCHOR_ROTATE_MIN = 150000;
  var ANCHOR_ROTATE_MAX = 300000;
  var COMMENT_ANCHOR_CHANCE = 0.45;
  var anchorChoice = { kind: 'comment', worker: '' };
  var anchorTimer = 0;
  var hopTimer = 0;
  var nightPerchTarget = null;
  // Where the last auto-position put the pet: under the comment bubble or not.
  // The bubble's tail follows this (see syncBubbleTail), so it never points at
  // an empty spot while the pet sits on a card, is dragged away or is hidden.
  var positionedAtBubble = false;
  // Same breakpoint as daily-cat.css, which hides the pet below it.
  var petHiddenMedia = window.matchMedia ? matchMedia('(max-width: 899px), (max-height: 559px)') : null;

  function pad(value) { return String(value).padStart(2, '0'); }
  function currentDate() {
    try {
      if (typeof window.__minkaNow === 'function') return window.__minkaNow();
    } catch (_error) {}
    return new Date();
  }
  function localDayKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function dayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }
  function petDayDate(date) {
    return new Date(date.getTime() - DAY_START_HOUR * 60 * 60 * 1000);
  }
  function petDayKey(date) {
    return localDayKey(petDayDate(date));
  }
  function safeRead(key) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch (_error) { return null; }
  }
  function safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_error) {}
  }
  function validAsset(value, filename) {
    try {
      var url = new URL(String(value || ''));
      return url.protocol === 'https:' && url.hostname === 'codex-pets.net' &&
        url.pathname.indexOf('/assets/pets/') === 0 && url.pathname.endsWith('/' + filename);
    } catch (_error) { return false; }
  }
  function latinName(name, id) {
    if (!/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(name)) return name;
    var words = String(id || '').replace(/[-_]+/g, ' ')
      .replace(/(\d+)d\b/gi, ' $1D').replace(/\bv(\d+)\b/gi, 'V$1').trim();
    if (!words) return 'Codex Cat';
    return words.split(/\s+/).map(function (word) {
      return /^\d+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }
  function normalizePet(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var id = String(raw.id || '').trim();
    var name = latinName(String(raw.displayName || id).trim().slice(0, 80), id);
    var preview = String(raw.previewUrl || '').trim();
    if (!id || !name || !validAsset(preview, 'preview.webp')) return null;
    var base = preview.slice(0, -'preview.webp'.length);
    var poster = base + 'poster.webp';
    var spritesheet = base + 'spritesheet.webp';
    return validAsset(poster, 'poster.webp') && validAsset(spritesheet, 'spritesheet.webp') ?
      { id: id, displayName: name, posterUrl: poster, spritesheetUrl: spritesheet } : null;
  }
  function catalogIndexForDay(date) {
    return catalog.length ? ((dayNumber(date) % catalog.length) + catalog.length) % catalog.length : -1;
  }
  function automaticIndex(date) {
    return catalogIndexForDay(petDayDate(date));
  }
  function indexForDutyDay(value) {
    var match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || ''));
    if (!match) return -1;
    return catalogIndexForDay(new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12));
  }
  function indexForToday() {
    var now = currentDate();
    var today = petDayKey(now);
    var saved = safeRead(CHOICE_KEY);
    if (saved && saved.dayKey === today && saved.id) {
      var index = catalog.findIndex(function (pet) { return pet.id === saved.id; });
      if (index >= 0) return index;
    }
    try { localStorage.removeItem(CHOICE_KEY); } catch (_error) {}
    return automaticIndex(now);
  }
  function scheduleDayChange() {
    if (midnightTimer) clearTimeout(midnightTimer);
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAY_START_HOUR, 0, 0, 50);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    midnightTimer = setTimeout(function () {
      try { localStorage.removeItem(CHOICE_KEY); } catch (_error) {}
      activePetDayKey = petDayKey(new Date());
      resetAutoPosition();
      transitionToPet(automaticIndex(new Date()), false);
      scheduleDayChange();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function isCompact() {
    return innerWidth < 900 || innerHeight < 560 ||
      document.documentElement.classList.contains('mk-mobile-shell') ||
      document.documentElement.classList.contains('host-radio-open');
  }
  function clampPosition(position) {
    return {
      right: Math.max(8, Math.min(innerWidth - PET_SIZE - 8, Number(position.right) || 8)),
      bottom: Math.max(8, Math.min(innerHeight - PET_SIZE - 8, Number(position.bottom) || 8))
    };
  }
  function reducedMotion() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function nameSeed(value) {
    var seed = 0;
    for (var i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) % 9973;
    return seed;
  }
  function commentAnchorNode() {
    return document.querySelector('.rg-feedback-card .rg-comment-icon');
  }
  function workerCardNodes() {
    var list = document.getElementById('grafiks-list');
    if (!list) return [];
    return [].slice.call(list.querySelectorAll('.card.mk-mid-card[data-worker]:not(.rg-feedback-card)'));
  }
  function visibleWorkerCards() {
    return workerCardNodes().filter(function (card) {
      var rect = card.getBoundingClientRect();
      return card.dataset.worker && rect.width > 0 && rect.height > 0;
    });
  }
  // Resolving a worker name may scan the cards, but this runs only when the
  // anchor deliberately changes (every few minutes or after a date change).
  // Scroll/resize frames use the cached anchorTarget directly.
  // The mood card's big glass (Noskaņa X): the pet hops up there when
  // somebody rates the shift (cheer below).
  function moodAnchorNode() {
    return document.querySelector('.rg-feedback-card .rg-mood-glass-lens');
  }
  function resolveAnchorElement(choice) {
    if (choice && choice.kind === 'mood') return moodAnchorNode() || commentAnchorNode();
    if (choice && choice.kind === 'tap') return document.querySelectorAll('.rg-feedback-card .rg-pulse-taps > button')[choice.index] || null;
    if (choice && choice.kind === 'curve') return document.querySelector('.rg-feedback-card .rg-trend-plot');
    if (!choice || choice.kind !== 'card') return commentAnchorNode();
    var cards = workerCardNodes();
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].dataset.worker === choice.worker) return cards[i];
    }
    return null;
  }
  function setAnchorChoice(choice) {
    anchorChoice = choice || { kind: 'comment', worker: '' };
    observeAnchor(resolveAnchorElement(anchorChoice));
  }
  function pickAnchor() {
    var bubble = commentAnchorNode();
    var cards = visibleWorkerCards();
    if (!cards.length) return bubble ? { kind: 'comment', worker: '' } : anchorChoice;
    // Coming back to the bubble is the most likely single move; otherwise the
    // pet picks a card it is not already sitting on.
    if (bubble && anchorChoice.kind !== 'comment' && Math.random() < COMMENT_ANCHOR_CHANCE) {
      return { kind: 'comment', worker: '' };
    }
    var pool = cards.filter(function (card) {
      return anchorChoice.kind !== 'card' || card.dataset.worker !== anchorChoice.worker;
    });
    if (!pool.length) return bubble ? { kind: 'comment', worker: '' } : anchorChoice;
    return { kind: 'card', worker: pool[Math.floor(Math.random() * pool.length)].dataset.worker };
  }
  /* A new size with every hop ("each time a little different"): big on the
     cards, the comments and the mood glass; small only while it runs about
     on the mood card (tour below). The sprite is scaled round its paws
     (daily-cat.css), so every perch keeps its feet exactly where they are. */
  var SIZE_BIG = [0.84, 1.06];
  var SIZE_MINI = [0.4, 0.56];
  var SIZE_MOOD = [0.5, 0.62];           // on the big glass after a vote
  var SIZE_HOME = [0.5, 0.6];            // at home by the comments
  var FEET = 92;                         // the paws, px from the top of the 96 px frame
  function sizeIn(range) { return range[0] + Math.random() * (range[1] - range[0]); }
  var petScale = 1;
  var homeGlass = 0;
  function setPetSize(scale) {
    petScale = scale;
    if (petButton) petButton.style.setProperty('--cat-size', scale.toFixed(3));
    if (petButton) petButton.classList.toggle('is-mini', scale < 0.7);
  }
  function onMoodCard(choice) { return choice.kind !== 'card' && !!document.querySelector('.rg-feedback-card.mx-compact'); }
  function hopToAnchor(scale, action) {
    hideSpeech(true);
    setPetSize(scale || sizeIn(onMoodCard(anchorChoice) ? SIZE_HOME : SIZE_BIG));
    if (petButton) { petButton.classList.remove('is-running'); petButton.style.removeProperty('--cat-hop'); }
    if (petButton && !petButton.hidden && !reducedMotion()) {
      petButton.classList.add('is-hopping');
      if (hopTimer) clearTimeout(hopTimer);
      hopTimer = setTimeout(function () {
        hopTimer = 0;
        if (petButton) petButton.classList.remove('is-hopping');
        syncBubbleTail();
      }, 700);
      playAction(action || 'jumping', 1);
    }
    scheduleAutoPosition();
  }

  // Runs (not hops) to the current anchor: a steady glide timed by the
  // distance, the running frames facing the way it goes, looped meanwhile.
  var RUN_PX_PER_S = 150;
  function runToAnchor(scale) {
    hideSpeech(true);
    setPetSize(scale);
    var from = renderedPosition, to = fastAutoPosition();
    if (!petButton || !from || !to || reducedMotion()) { hopToAnchor(scale, 'jumping'); return 700; }
    var dx = from.right - to.right, dy = from.bottom - to.bottom;     // + = to the right / up
    var ms = Math.round(Math.max(420, Math.min(1800, Math.hypot(dx, dy) / RUN_PX_PER_S * 1000)));
    petButton.style.setProperty('--cat-hop', ms + 'ms');
    petButton.classList.add('is-hopping', 'is-running');
    if (hopTimer) clearTimeout(hopTimer);
    hopTimer = setTimeout(function () {
      hopTimer = 0;
      if (!petButton) return;
      petButton.classList.remove('is-hopping', 'is-running');
      petButton.style.removeProperty('--cat-hop');
      syncBubbleTail();
    }, ms + 80);
    var run = Math.abs(dx) < 6 ? 'jumping' : (dx > 0 ? 'running-right' : 'running-left');
    playAction(run, run === 'jumping' ? 1 : Math.max(1, Math.round(ms / 1140)));
    applyPosition(to);
    return ms;
  }

  /* Now and then the pet shrinks and runs about the mood card: from face to
     face along the rating row and along the curve's points, a few hops, then
     it grows back and goes off to a card. Only while the card is on screen
     and nobody is dragging; nothing runs between the hops. */
  var tour = null;                       // { left, timer }
  function moodSpots() {
    var spots = [];
    var taps = document.querySelectorAll('.rg-feedback-card .rg-pulse-taps > button');
    for (var i = 0; i < taps.length; i++) spots.push({ kind: 'tap', index: i, worker: '' });
    var trend = window.MinkaMoodTrend;
    if (trend && trend.days && trend.point) {
      trend.days().forEach(function (day) { if (trend.point(day)) spots.push({ kind: 'curve', day: day, worker: '' }); });
    }
    return spots;
  }
  function spotKey(choice) { return choice.kind + ':' + (choice.kind === 'tap' ? choice.index : choice.day); }
  function endTour() {
    if (!tour) return;
    clearTimeout(tour.timer);
    tour = null;
  }
  function tourStep() {
    if (!tour) return;
    tour.timer = 0;
    if (!canAnimate() || positionMode !== 'auto' || dragState || pickerOpen || nightPerchTarget || document.hidden) { endTour(); return; }
    if (tour.left <= 0) {
      // grown back, off to a card (or home)
      endTour();
      var next = pickAnchor();
      if (next.kind === 'tap' || next.kind === 'curve' || next.kind === 'mood') next = { kind: 'comment', worker: '' };
      setAnchorChoice(next);
      hopToAnchor(null, 'jumping');
      return;
    }
    tour.left -= 1;
    var all = moodSpots(), cur = anchorChoice, track, pick;
    // mostly on along its own track (the next face, or the next day on the
    // curve), keeping its way; now and then over to the other track
    if ((cur.kind === 'tap' || cur.kind === 'curve') && Math.random() < 0.75) {
      track = all.filter(function (s) { return s.kind === cur.kind; });
      var at = track.findIndex(function (s) { return spotKey(s) === spotKey(cur); });
      if (at >= 0 && track.length > 1) {
        if (at + tour.dir < 0 || at + tour.dir >= track.length) tour.dir = -tour.dir;
        pick = track[at + tour.dir];
      }
    }
    if (!pick) {
      var other = all.filter(function (s) { return s.kind !== cur.kind && miniSpot(s, resolveAnchorElement(s)); });
      pick = other[Math.floor(Math.random() * other.length)];
    }
    if (!pick || !miniSpot(pick, resolveAnchorElement(pick))) { tour.left = 0; tourStep(); return; }
    setAnchorChoice(pick);
    var ms = runToAnchor(tour.size);
    tour.timer = setTimeout(tourStep, ms + 700 + Math.random() * 1300);
  }
  function startTour() {
    if (tour || !petButton || petButton.hidden || !canAnimate() || positionMode !== 'auto' || nightPerchTarget || dragState || pickerOpen) return false;
    var stage = document.querySelector('.rg-feedback-card .rg-mood-stage');
    var rect = stage && stage.getBoundingClientRect();
    if (!rect || rect.bottom < 120 || rect.top > innerHeight - 160) return false;   // the card must be in view
    if (!moodSpots().length) return false;
    tour = { left: 4 + Math.floor(Math.random() * 4), size: sizeIn(SIZE_MINI), dir: Math.random() < 0.5 ? -1 : 1, timer: 0 };
    tourStep();
    return true;
  }
  // Where a small pet stands on the mood card, in viewport px: on top of a
  // face's glass, or on a day's point on the curve.
  function miniSpot(choice, target) {
    if (!choice || !target || !target.isConnected) return null;
    var rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    if (choice.kind === 'tap') {
      var glass = choice.glass || (choice.glass = parseFloat(getComputedStyle(target, '::before').width) || 40);
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 - glass / 2 + 1 };
    }
    var trend = window.MinkaMoodTrend, p = trend && trend.point ? trend.point(choice.day) : null;
    return p ? { x: rect.left + p.x, y: rect.top + p.y - p.r } : null;
  }
  /* Noskaņa X: a vote is something the pet sees. It hops up onto the mood
     card's big glass, shows how the vote feels (a leap for great, a wave for
     good, a look for so-so, a slump for bad) and after a while goes home.
     Dragged away, perched at night or hidden: it only reacts where it is. */
  var CHEER_ACTION = { excellent: 'jumping', good: 'waving', ok: 'review', bad: 'failed', terrible: 'failed' };
  var CHEER_STAY = 9000;
  var TOUR_CHANCE = 0.4;
  var cheerTimer = 0;
  var cheerActTimer = 0;
  function cheerHome() {
    cheerTimer = 0;
    if (!petButton || anchorChoice.kind !== 'mood') return;
    setAnchorChoice({ kind: 'comment', worker: '' });
    if (positionMode === 'auto' && !dragState) hopToAnchor();
  }
  function cheer(mood) {
    var action = CHEER_ACTION[mood] || 'waving';
    var loops = action === 'failed' ? 1 : 2;
    if (!canAnimate() || pickerOpen || dragState) return false;
    clearTimeout(cheerActTimer);
    cheerActTimer = 0;
    endTour();
    if (positionMode !== 'auto' || nightPerchTarget || !moodAnchorNode()) return playAction(action, loops);
    if (anchorChoice.kind !== 'mood') {
      setAnchorChoice({ kind: 'mood', worker: '' });
      hopToAnchor(sizeIn(SIZE_MOOD));      // leaps across, small; the reaction once it lands
      cheerActTimer = setTimeout(function () { cheerActTimer = 0; playAction(action, loops); }, 720);
    } else {
      playAction(action, loops);
    }
    clearTimeout(cheerTimer);
    cheerTimer = setTimeout(cheerHome, CHEER_STAY);
    return true;
  }
  // A comment rose in the mood sky: a look, if the pet is just sitting.
  function notice(action) {
    if (!canAnimate() || pickerOpen || dragState || cheerTimer || tour ||
        (petButton && petButton.classList.contains('is-hopping'))) return false;
    return playAction(action === 'waving' ? 'waving' : 'review', 1);
  }
  /* The pet speaks (Noskaņa X, mood-feedback.js): "Novērtē maiņu!" when the
     day still waits for a vote, and now and then it reads out a comment
     somebody wrote (the newest unread first), with the writer's animal. The
     cat's own white speech bubble beside its head, on whichever side has
     room; it follows the pet while it sits, and any hop or drag ends it.
     One element, one short animation in and out; nothing runs in between. */
  var speech = null, speechTimer = 0, speechAnim = null, speechClick = null, speechSize = null;
  function speechNode() {
    if (speech && speech.isConnected) return speech;
    speech = document.createElement('button');
    speech.type = 'button';
    speech.className = 'mk-cat-say';
    speech.hidden = true;
    speech.innerHTML = '<svg class="mk-cat-say-shape" aria-hidden="true"><path/></svg>'
      + '<span class="mk-cat-say-ava" aria-hidden="true"></span><span class="mk-cat-say-text"></span>';
    speech.addEventListener('click', function () {
      var act = speechClick;
      hideSpeech(true);
      if (typeof act === 'function') act();
    });
    document.body.appendChild(speech);
    return speech;
  }
  function placeSpeech() {
    if (!speech || speech.hidden || !petButton || !renderedPosition || !speechSize) return;
    var x = innerWidth - PET_SIZE - renderedPosition.right;
    var y = innerHeight - PET_SIZE - renderedPosition.bottom;
    var w = speechSize.w, h = speechSize.h, s = petScale;
    var head = y + FEET - 80 * s;                         // about the top of its head
    var left = x + PET_SIZE / 2 - 20 * s - 16 - w, side = 'left';         // the tail's tip a few px from its head
    if (left < 8) { left = x + PET_SIZE / 2 + 20 * s + 16; side = 'right'; }
    left = Math.max(8, Math.min(innerWidth - w - 8, left));
    var top = Math.max(8, Math.min(innerHeight - h - 8, head - 6));
    speech.dataset.side = side;
    // left/top, not a transform: the bubble grows by scale from its tail, and a
    // scale over a transform-placed box would grow from the window's corner
    speech.style.left = Math.round(left) + 'px';
    speech.style.top = Math.round(top) + 'px';
  }
  /* The bubble and its tail as ONE outline (an SVG path the size of the
     bubble), so there is no joint between them: rounded corners, the tail
     leaving the side straight and curving out to its tip. Mirrored when the
     bubble sits on the cat's right. */
  var TAIL = 11;
  function speechShape(el, w, h) {
    var svg = el.firstChild, path = svg && svg.firstChild;
    if (!path) return;
    var r = Math.min(16, h / 2 - 5), m = h / 2, half = Math.min(7, m - r), y0 = m - half, y1 = m + half;
    var f = function (n) { return Math.round(n * 10) / 10; };
    path.setAttribute('d', 'M' + f(r) + ' 0H' + f(w - r) + 'Q' + w + ' 0 ' + w + ' ' + f(r) + 'V' + f(y0)
      + 'C' + w + ' ' + f(y0 + half * .55) + ' ' + f(w + TAIL * .5) + ' ' + f(m - 1) + ' ' + (w + TAIL) + ' ' + f(m)
      + 'C' + f(w + TAIL * .5) + ' ' + f(m + 1) + ' ' + w + ' ' + f(y1 - half * .55) + ' ' + w + ' ' + f(y1)
      + 'V' + f(h - r) + 'Q' + w + ' ' + h + ' ' + f(w - r) + ' ' + h + 'H' + f(r) + 'Q0 ' + h + ' 0 ' + f(h - r)
      + 'V' + f(r) + 'Q0 0 ' + f(r) + ' 0Z');
    svg.setAttribute('viewBox', '0 0 ' + (w + TAIL) + ' ' + h);
    svg.setAttribute('width', w + TAIL);
    svg.setAttribute('height', h);
  }
  function hideSpeech(now) {
    clearTimeout(speechTimer);
    speechTimer = 0;
    if (!speech || speech.hidden) return;
    if (speechAnim) speechAnim.cancel();
    if (now === true || reducedMotion() || !speech.animate) { speech.hidden = true; return; }
    var anim = speechAnim = speech.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'cubic-bezier(.3, 0, .8, .15)' });
    anim.onfinish = function () { if (speechAnim === anim) { speech.hidden = true; speechAnim = null; } };
  }
  function say(item) {
    if (!item || !item.text || !petButton || petButton.hidden || !canAnimate() || dragState || pickerOpen ||
        cheerTimer || tour || petButton.classList.contains('is-hopping')) return false;
    var el = speechNode();
    if (speechAnim) speechAnim.cancel();
    var ava = el.children[1];
    ava.textContent = item.ava || '';
    ava.hidden = !item.ava;
    if (item.avaBg) ava.style.setProperty('--cat-say-ava', item.avaBg); else ava.style.removeProperty('--cat-say-ava');
    el.children[2].textContent = item.text;
    el.setAttribute('aria-label', item.label || item.text);
    el.classList.toggle('is-ask', !!item.ask);
    speechClick = item.onClick || null;
    el.style.visibility = 'hidden';
    el.hidden = false;
    speechSize = { w: el.offsetWidth, h: el.offsetHeight };
    placeSpeech();
    speechShape(el, speechSize.w, speechSize.h);
    el.style.visibility = '';
    if (!reducedMotion() && el.animate) {
      speechAnim = el.animate([{ opacity: 0, translate: (el.dataset.side === 'right' ? '-6px' : '6px') + ' 0' }, { opacity: 1, translate: '0 0' }],
        { duration: 320, easing: getComputedStyle(document.documentElement).getPropertyValue('--mk-ease-spring').trim() || 'cubic-bezier(.2, .9, .25, 1)' });
    }
    playAction(item.ask ? 'waving' : 'review', 1);
    clearTimeout(speechTimer);
    speechTimer = setTimeout(hideSpeech, Math.max(5000, Math.min(10000, 3800 + item.text.length * 55)));
    return true;
  }
  function rotateAnchor() {
    anchorTimer = 0;
    if (petButton && !petButton.hidden && !nightPerchTarget && positionMode === 'auto' &&
        !dragState && !pickerOpen && !document.hidden && anchorChoice.kind !== 'mood' && !tour) {
      if (Math.random() < TOUR_CHANCE && startTour()) { scheduleAnchorRotation(); return; }
      var next = pickAnchor();
      if (next.kind !== anchorChoice.kind || next.worker !== anchorChoice.worker) {
        setAnchorChoice(next);
        hopToAnchor();
      }
    }
    scheduleAnchorRotation();
  }
  function scheduleAnchorRotation() {
    if (anchorTimer) clearTimeout(anchorTimer);
    anchorTimer = setTimeout(rotateAnchor,
      ANCHOR_ROTATE_MIN + Math.random() * (ANCHOR_ROTATE_MAX - ANCHOR_ROTATE_MIN));
  }
  // The comment bubble reads data-mk-cat-tail on <html> ("out" = tail toward
  // the pet, "in" = tail drawn into the bubble). <html> survives the mood
  // card being re-rendered, and CSS does the morph, so this only flips the
  // state at the moments the pet itself changes place. A pet still gliding
  // home keeps the tail in until the hop ends — it grows out on arrival.
  function syncBubbleTail() {
    var home = !!petButton && !petButton.hidden && !nightPerchTarget &&
      !(petHiddenMedia && petHiddenMedia.matches) &&
      positionMode === 'auto' && !(dragState && dragState.moved) &&
      positionedAtBubble && !petButton.classList.contains('is-hopping');
    var next = home ? 'out' : 'in';
    if (document.documentElement.getAttribute('data-mk-cat-tail') !== next) {
      document.documentElement.setAttribute('data-mk-cat-tail', next);
    }
  }
  function candidatePosition(left, top) {
    return clampPosition({
      right: innerWidth - left - PET_SIZE,
      bottom: innerHeight - top - PET_SIZE
    });
  }
  function nightPerchPosition(target) {
    if (!target || !target.isConnected) return null;
    var rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return candidatePosition(
      rect.left + rect.width * 0.47 - PET_SIZE / 2,
      // Sit above the care plaque: the paws stay on the mattress instead of
      // covering the "Gultas veļa mainīta" text on shorter viewports.
      rect.top - 12
    );
  }
  // Hot path: one cached element and one rect. No card lists, collision scans
  // or mood measurements are allowed here because scroll calls it every frame.
  function anchorPosition(target) {
    if (!target || !target.isConnected) return null;
    var rect = target.getBoundingClientRect();
    var home = target;
    if (!rect.width || !rect.height) return null;
    if (anchorChoice.kind === 'tap' || anchorChoice.kind === 'curve') {
      var spot = miniSpot(anchorChoice, target);
      if (spot) {
        positionedAtBubble = false;
        return candidatePosition(spot.x - PET_SIZE / 2, spot.y - FEET);
      }
      home = commentAnchorNode();
      if (!home) return null;
      rect = home.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
    } else if (anchorChoice.kind === 'mood' && target.classList.contains('rg-mood-glass-lens')) {
      // Paws on the top of the glass (the visible ball starts ~5 % into the
      // picture); too close to the top of the window, it waits at home.
      // by its layout box round the centre: the tap's pop scales the glass
      var lensH = target.offsetHeight || rect.height;
      var sitTop = rect.top + rect.height / 2 - lensH / 2 + lensH * 0.05 - FEET + 2;
      if (sitTop >= 8) {
        positionedAtBubble = false;
        return candidatePosition(rect.left + rect.width / 2 - PET_SIZE / 2, sitTop);
      }
      var homeFallback = commentAnchorNode();
      if (!homeFallback) return null;
      home = homeFallback;
      rect = homeFallback.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
    } else if (anchorChoice.kind === 'card') {
      if (rect.top - PET_SIZE + 10 >= 8) {
        var spread = 0.28 + (nameSeed(anchorChoice.worker) % 45) / 100;
        var perchLeft = rect.left + rect.width * spread - PET_SIZE / 2;
        perchLeft = Math.max(rect.left - 12, Math.min(rect.right - PET_SIZE + 12, perchLeft));
        positionedAtBubble = false;
        return candidatePosition(perchLeft, rect.top - PET_SIZE + 10);
      }
      // If the chosen card is too close to the viewport edge, the bubble is a
      // cheap O(1) fallback until scrolling makes the card perch visible again.
      var bubbleFallback = commentAnchorNode();
      if (!bubbleFallback) return null;
      home = bubbleFallback;
      rect = bubbleFallback.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
    }
    // Noskaņa X keeps the comments in a small bubble at the end of the rating
    // row: the pet waits under the card, right below that bubble.
    // Noskaņa X keeps the comments in a small bubble in the rating row. The
    // pet (small on the mood card) waits right under the card below it, or,
    // when the card reaches the bottom of the window, sits on that bubble.
    var compact = home.closest && home.closest('.rg-feedback-card.mx-compact');
    if (compact) {
      positionedAtBubble = true;
      var btn = home.closest('.rg-pulse-write--comment') || home, b = btn.getBoundingClientRect();
      var glass = homeGlass || (homeGlass = parseFloat(getComputedStyle(btn, '::before').width) || 36);
      var under = compact.getBoundingClientRect().bottom + 2 + 88 * petScale;      // its feet, sitting under the card
      var feet = under <= innerHeight - 14 ? under : b.top + b.height / 2 - glass / 2 + 1;
      return candidatePosition(b.left + b.width / 2 - PET_SIZE / 2, feet - FEET);
    }
    var tailX = rect.left + Math.max(18, Math.min(28, rect.width * 0.2));
    positionedAtBubble = true;
    return candidatePosition(tailX - PET_SIZE / 2, rect.bottom);
  }
  function activeAnchorElement() {
    if (anchorTarget && anchorTarget.isConnected) return anchorTarget;
    // The mood card was rebuilt: its glass is one lookup away.
    if (anchorChoice.kind === 'mood' || anchorChoice.kind === 'tap' || anchorChoice.kind === 'curve') {
      var again = resolveAnchorElement(anchorChoice);
      if (again && again !== commentAnchorNode()) { observeAnchor(again); return again; }
      endTour();
    }
    // A removed worker card must not trigger a list scan from a scroll frame.
    // Fall home to the comment bubble; the rare daySelected handler can later
    // resolve a new card explicitly.
    if (anchorChoice.kind !== 'comment') anchorChoice = { kind: 'comment', worker: '' };
    var target = commentAnchorNode();
    observeAnchor(target);
    return target;
  }
  function fastAutoPosition() {
    positionedAtBubble = false;
    if (nightPerchTarget) {
      var perch = nightPerchPosition(nightPerchTarget);
      if (perch) return perch;
    }
    return anchorPosition(activeAnchorElement());
  }
  // Cold fallback: this may inspect many elements, so it is used only if the
  // normal anchor did not exist while the pet was being mounted.
  function fallbackPosition() {
    var list = document.getElementById('grafiks-list');
    if (!list) return null;
    var workers = [].slice.call(list.querySelectorAll('.card.mk-mid-card[data-worker]:not(.rg-feedback-card)'));
    var mood = list.querySelector('.rg-feedback-card');
    if (!workers.length) return null;
    var rects = workers.map(function (card) { return card.getBoundingClientRect(); })
      .filter(function (rect) { return rect.width > 0 && rect.height > 0; });
    if (!rects.length) return null;
    var moodRect = mood && mood.getBoundingClientRect();
    var blockers = [].slice.call(list.querySelectorAll(
      '.card, .cards-section-label, button, a, input, textarea, select, [role="button"]'
    )).filter(function (node) { return node !== petButton && node !== mood; }).map(function (node) {
      return node.getBoundingClientRect();
    }).filter(function (rect) { return rect.width > 0 && rect.height > 0; });
    function overlaps(a, b, pad) {
      return a.left < b.right + pad && b.left - pad < a.right &&
        a.top < b.bottom + pad && b.top - pad < a.bottom;
    }
    function isFree(candidate) {
      if (candidate.left < 8 || candidate.top < 8 ||
          candidate.right > innerWidth - 8 || candidate.bottom > innerHeight - 8) return false;
      return !blockers.some(function (rect) { return overlaps(candidate, rect, 8); });
    }
    function makeCandidate(left, top) {
      return { left: left, top: top, right: left + PET_SIZE, bottom: top + PET_SIZE };
    }
    function asPosition(candidate) {
      return clampPosition({
        right: innerWidth - candidate.right,
        bottom: innerHeight - candidate.bottom
      });
    }
    var rows = [];
    rects.slice().sort(function (a, b) { return a.top - b.top || a.left - b.left; })
      .forEach(function (rect) {
        var row = rows.find(function (item) { return Math.abs(item.top - rect.top) < 14; });
        if (!row) {
          row = { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
          rows.push(row);
        } else {
          row.top = Math.min(row.top, rect.top);
          row.bottom = Math.max(row.bottom, rect.bottom);
          row.left = Math.min(row.left, rect.left);
          row.right = Math.max(row.right, rect.right);
        }
      });
    // Prefer the lowest populated card row. It normally leaves a clean slot
    // between the final worker card and the tall Mood card, with no heading.
    rows.sort(function (a, b) { return b.top - a.top; });
    if (moodRect && moodRect.width > 0) {
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var rightGap = moodRect.left - row.right;
        if (rightGap >= PET_SIZE + 16) {
          var rightCandidate = makeCandidate(
            row.right + (rightGap - PET_SIZE) / 2,
            row.top + (row.bottom - row.top - PET_SIZE) / 2
          );
          if (isFree(rightCandidate)) return asPosition(rightCandidate);
        }
        var leftGap = row.left - moodRect.right;
        if (leftGap >= PET_SIZE + 16) {
          var leftCandidate = makeCandidate(
            moodRect.right + (leftGap - PET_SIZE) / 2,
            row.top + (row.bottom - row.top - PET_SIZE) / 2
          );
          if (isFree(leftCandidate)) return asPosition(leftCandidate);
        }
      }
    }
    // Unusual rosters fall back to the nearest empty slot inside the card
    // field. Cards, headings and controls remain protected with an 8px margin.
    var fieldLeft = Math.min.apply(null, rects.map(function (rect) { return rect.left; }));
    var fieldRight = Math.max.apply(null, rects.map(function (rect) { return rect.right; }));
    if (moodRect && moodRect.width > 0) fieldRight = Math.max(fieldRight, moodRect.right);
    var fieldTop = Math.min.apply(null, rects.map(function (rect) { return rect.top; }));
    var fieldBottom = Math.max.apply(null, rects.map(function (rect) { return rect.bottom; }));
    var best = null;
    for (var top = fieldTop; top <= Math.min(innerHeight - PET_SIZE - 8, fieldBottom); top += 12) {
      for (var left = fieldLeft; left <= Math.min(innerWidth - PET_SIZE - 8, fieldRight - PET_SIZE); left += 12) {
        var candidate = makeCandidate(left, top);
        if (!isFree(candidate)) continue;
        var distance = Math.min.apply(null, rects.map(function (rect) {
          var dx = Math.max(rect.left - candidate.right, candidate.left - rect.right, 0);
          var dy = Math.max(rect.top - candidate.bottom, candidate.top - rect.bottom, 0);
          return Math.sqrt(dx * dx + dy * dy);
        }));
        if (!best || distance < best.distance) best = { candidate: candidate, distance: distance };
      }
    }
    return best ? asPosition(best.candidate) : null;
  }
  function defaultPosition() {
    return fastAutoPosition() || fallbackPosition();
  }
  function applyPosition(position) {
    if (!petButton) return;
    position = clampPosition(position);
    renderedPosition = { right: position.right, bottom: position.bottom };
    var x = innerWidth - PET_SIZE - position.right;
    var y = innerHeight - PET_SIZE - position.bottom;
    petButton.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
    placeSpeech();
  }
  function paintPosition(position) {
    if (!petButton) return;
    position = clampPosition(position);
    var x = innerWidth - PET_SIZE - position.right;
    var y = innerHeight - PET_SIZE - position.bottom;
    petButton.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
  }
  function currentPosition() {
    if (!petButton || !renderedPosition) return null;
    return clampPosition(renderedPosition);
  }
  function restorePosition() {
    if (!petButton || petButton.hidden || dragState) return;
    if (positionMode === 'manual') {
      // Keep the dropped position unclamped so the pet returns to its own spot
      // once the viewport grows back after the radio closes.
      if (manualPosition) applyPosition(manualPosition);
      return;
    }
    scheduleAutoPosition();
  }
  function observeAnchor(nextTarget) {
    if (!petButton) return;
    if (nextTarget === anchorTarget) return;
    if (anchorObserver) anchorObserver.disconnect();
    anchorTarget = nextTarget;
    if (!anchorTarget || typeof ResizeObserver !== 'function') return;
    anchorObserver = new ResizeObserver(scheduleAutoPosition);
    anchorObserver.observe(anchorTarget);
  }
  function syncAutoPosition() {
    anchorFrame = 0;
    if (!petButton || positionMode !== 'auto' || dragState) return;
    var position = fastAutoPosition();
    if (position) applyPosition(position);
    syncBubbleTail();
    if (pickerOpen) requestAnimationFrame(positionPicker);
  }
  function scheduleAutoPosition() {
    if (!petButton || positionMode !== 'auto' || dragState || anchorFrame) return;
    anchorFrame = requestAnimationFrame(syncAutoPosition);
  }
  function resetAutoPosition() {
    positionMode = 'auto';
    manualPosition = null;
    setAnchorChoice({ kind: 'comment', worker: '' });
    if (petButton) petButton.dataset.positionMode = positionMode;
    scheduleAutoPosition();
  }
  function scheduleScrollPosition() {
    // A deliberate hop may animate, but once the user scrolls the pet must
    // follow its anchor immediately instead of easing behind it.
    if (petButton && petButton.classList.contains('is-hopping')) {
      petButton.classList.remove('is-hopping', 'is-running');
      petButton.style.removeProperty('--cat-hop');
      if (hopTimer) clearTimeout(hopTimer);
      hopTimer = 0;
      syncBubbleTail();
    }
    scheduleAutoPosition();
  }
  function framePosition(row, frame) {
    return (frame / (SPRITE_COLS - 1) * 100) + '% ' + (row / (SPRITE_ROWS - 1) * 100) + '%';
  }
  function showFrame(row, frame, blend) {
    if (!spriteMain || !spriteGhost) return;
    var previous = framePosition(currentFrame.row, currentFrame.frame);
    var next = framePosition(row, frame);
    if (previous === next) return;
    if (blend) {
      spriteGhost.style.backgroundPosition = previous;
      if (ghostAnimation) ghostAnimation.cancel();
      ghostAnimation = spriteGhost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 145,
        easing: 'cubic-bezier(.2,.65,.3,1)',
        fill: 'forwards'
      });
    }
    spriteMain.style.backgroundPosition = next;
    currentFrame = { row: row, frame: frame };
  }
  function clearAnimationTimers() {
    actionToken += 1;
    if (frameTimer) clearTimeout(frameTimer);
    if (ambientTimer) clearTimeout(ambientTimer);
    frameTimer = 0;
    ambientTimer = 0;
  }
  function canAnimate() {
    var reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    return petButton && !petButton.hidden && !document.hidden && !isCompact() && !reduced;
  }
  function scheduleAmbient() {
    if (!canAnimate() || pickerOpen || dragState) return;
    if (ambientTimer) clearTimeout(ambientTimer);
    ambientTimer = setTimeout(function () {
      ambientTimer = 0;
      var choices = ['waving', 'review', 'jumping', 'running', 'running-right', 'running-left'];
      playAction(choices[Math.floor(Math.random() * choices.length)], 1);
    }, 28000 + Math.floor(Math.random() * 22000));
  }
  function startIdle() {
    clearAnimationTimers();
    if (!canAnimate()) return;
    var token = actionToken;
    var frame = 0;
    showFrame(ACTIONS.idle.row, frame, true);
    function nextIdleFrame() {
      if (token !== actionToken || !canAnimate() || pickerOpen || dragState) return;
      frameTimer = setTimeout(function () {
        frame = (frame + 1) % ACTIONS.idle.frames;
        showFrame(ACTIONS.idle.row, frame, true);
        nextIdleFrame();
      }, IDLE_DELAYS[frame]);
    }
    nextIdleFrame();
    scheduleAmbient();
  }
  function playAction(id, loops) {
    var action = ACTIONS[id];
    if (!action || !canAnimate()) return false;
    clearAnimationTimers();
    var token = actionToken;
    var frame = 0;
    var remaining = Math.max(1, Number(loops) || 1) * action.frames;
    showFrame(action.row, 0, true);
    function tick() {
      if (token !== actionToken || !canAnimate()) return;
      frameTimer = setTimeout(function () {
        remaining -= 1;
        if (remaining <= 0) { startIdle(); return; }
        frame = (frame + 1) % action.frames;
        showFrame(action.row, frame, true);
        tick();
      }, Math.round(1000 / action.fps));
    }
    tick();
    return true;
  }
  function playLoop(id) {
    var action = ACTIONS[id];
    if (!action || !canAnimate()) return;
    clearAnimationTimers();
    var token = actionToken;
    var frame = 0;
    showFrame(action.row, frame, true);
    (function tick() {
      if (token !== actionToken || !canAnimate() || !dragState) return;
      frameTimer = setTimeout(function () {
        frame = (frame + 1) % action.frames;
        showFrame(action.row, frame, true);
        tick();
      }, Math.round(1000 / action.fps));
    })();
  }
  function syncVisibility() {
    if (!petButton) return;
    var wasHidden = petButton.hidden;
    petButton.hidden = isCompact() && !nightPerchTarget;
    syncBubbleTail();
    if (petButton.hidden) {
      closePicker();
      clearAnimationTimers();
      hideSpeech(true);
      return;
    }
    if (wasHidden) {
      restorePosition();
      if (positionMode === 'auto') scheduleAutoPosition();
    }
    if (!frameTimer) startIdle();
  }
  function updatePet() {
    var pet = catalog[selectedIndex];
    if (!pet || !spriteMain || !spriteGhost) return;
    clearAnimationTimers();
    var imageValue = 'url("' + pet.spritesheetUrl.replace(/"/g, '%22') + '")';
    spriteMain.style.backgroundImage = imageValue;
    spriteGhost.style.backgroundImage = imageValue;
    if (ghostAnimation) ghostAnimation.cancel();
    ghostAnimation = null;
    spriteGhost.style.opacity = '0';
    spriteGhost.style.backgroundPosition = '0% 0%';
    currentFrame = { row: 0, frame: 0 };
    spriteMain.style.backgroundPosition = '0% 0%';
    petButton.title = pet.displayName + ' — velc vai nospied';
    petButton.setAttribute('aria-label', pet.displayName + '. Velc vai nospied, lai izvēlētos citu kaķi.');
    document.documentElement.setAttribute('data-mk-daily-cat-id', pet.id);
    startIdle();
  }

  function paintDrag() {
    dragFrame = 0;
    if (!dragState || !petButton) return;
    paintPosition({ right: dragState.nextRight, bottom: dragState.nextBottom });
  }
  function onPointerDown(event) {
    hideSpeech(true);
    if (event.button !== 0 || dragState || nightPerchTarget) return;
    closePicker();
    var start = currentPosition() || manualPosition ||
      defaultPosition() || clampPosition({ right: 24, bottom: 24 });
    dragState = { id: event.pointerId, x: event.clientX, y: event.clientY,
      right: start.right, bottom: start.bottom, nextRight: start.right, nextBottom: start.bottom,
      dx: 0, dy: 0, moved: false, action: '' };
    clearAnimationTimers();
    petButton.setPointerCapture(event.pointerId);
    petButton.classList.add('is-dragging');
  }
  function onPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.id) return;
    var dx = event.clientX - dragState.x;
    var dy = event.clientY - dragState.y;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    if (!dragState.moved) { dragState.moved = true; syncBubbleTail(); }
    var next = clampPosition({ right: dragState.right - dx, bottom: dragState.bottom - dy });
    dragState.nextRight = next.right;
    dragState.nextBottom = next.bottom;
    dragState.dx = dragState.right - next.right;
    dragState.dy = dragState.bottom - next.bottom;
    var action = Math.abs(dx) >= Math.abs(dy) ?
      (dx >= 0 ? 'running-right' : 'running-left') : (dy < 0 ? 'jumping' : 'waving');
    if (action !== dragState.action) {
      dragState.action = action;
      playLoop(action);
    }
    if (!dragFrame) dragFrame = requestAnimationFrame(paintDrag);
  }
  function onPointerEnd(event) {
    if (!dragState || event.pointerId !== dragState.id) return;
    if (dragFrame) cancelAnimationFrame(dragFrame);
    var moved = dragState.moved;
    var position = { right: dragState.nextRight, bottom: dragState.nextBottom };
    skipClick = event.type === 'pointerup' && moved;
    dragState = null;
    dragFrame = 0;
    petButton.classList.remove('is-dragging');
    applyPosition(position);
    if (moved) {
      positionMode = 'manual';
      manualPosition = clampPosition(position);
    }
    petButton.dataset.positionMode = positionMode;
    syncBubbleTail();
    if (petButton.hasPointerCapture(event.pointerId)) petButton.releasePointerCapture(event.pointerId);
    startIdle();
  }
  function createPet(position) {
    if (petButton || (isCompact() && !nightPerchTarget)) return;
    position = clampPosition(position);
    petButton = document.createElement('button');
    petButton.id = 'mkDailyCatPet';
    petButton.className = 'mk-daily-cat-pet';
    petButton.dataset.positionMode = positionMode;
    petButton.type = 'button';
    var spriteWrap = document.createElement('span');
    spriteWrap.className = 'mk-daily-cat-sprite-wrap';
    spriteWrap.setAttribute('aria-hidden', 'true');
    spriteMain = document.createElement('span');
    spriteMain.className = 'mk-daily-cat-sprite mk-daily-cat-sprite-main';
    spriteGhost = document.createElement('span');
    spriteGhost.className = 'mk-daily-cat-sprite mk-daily-cat-sprite-ghost';
    spriteWrap.appendChild(spriteMain);
    spriteWrap.appendChild(spriteGhost);
    petButton.appendChild(spriteWrap);
    document.body.appendChild(petButton);
    setPetSize(sizeIn(onMoodCard(anchorChoice) ? SIZE_HOME : SIZE_BIG));
    applyPosition(position);
    scheduleAutoPosition();                // again, now with its size
    observeAnchor(resolveAnchorElement(anchorChoice));
    scheduleAnchorRotation();
    updatePet();
    petButton.addEventListener('pointerdown', onPointerDown);
    petButton.addEventListener('pointermove', onPointerMove);
    petButton.addEventListener('pointerup', onPointerEnd);
    petButton.addEventListener('pointercancel', onPointerEnd);
    petButton.addEventListener('transitionend', function (event) {
      if (event.target !== petButton || event.propertyName !== 'transform') return;
      if (hopTimer) { clearTimeout(hopTimer); hopTimer = 0; }
      petButton.classList.remove('is-hopping', 'is-running');
      petButton.style.removeProperty('--cat-hop');
      syncBubbleTail();
    });
    petButton.addEventListener('pointerenter', function () {
      if (!dragState && !pickerOpen) playAction('waving', 1);
    });
    petButton.addEventListener('pointerleave', function () {
      if (!dragState && !pickerOpen) startIdle();
    });
    petButton.addEventListener('click', function () {
      if (skipClick) { skipClick = false; return; }
      openPicker();
    });
    if (nightPerchTarget) {
      petButton.classList.add('is-night-perched');
      observeAnchor(nightPerchTarget);
      scheduleAutoPosition();
    }
    syncBubbleTail();
  }

  function enterNightSplit(target) {
    if (!target || !target.isConnected) return false;
    var sameTarget = nightPerchTarget === target;
    nightPerchTarget = target;
    closePicker();
    positionMode = 'auto';
    manualPosition = null;
    if (!petButton) {
      mountWhenReady();
      return true;
    }
    petButton.hidden = false;
    petButton.dataset.positionMode = 'night';
    petButton.classList.add('is-night-perched');
    observeAnchor(target);
    syncBubbleTail();
    scheduleAutoPosition();
    if (!sameTarget) playAction('jumping', 1);
    return true;
  }

  function exitNightSplit() {
    if (!nightPerchTarget) return;
    nightPerchTarget = null;
    if (petButton) {
      petButton.classList.remove('is-night-perched');
      petButton.dataset.positionMode = 'auto';
    }
    resetAutoPosition();
    if (petButton) playAction('jumping', 1);
  }
  function stopPositionWait() {
    if (positionObserver) positionObserver.disconnect();
    if (positionTimer) clearTimeout(positionTimer);
    positionObserver = null;
    positionTimer = 0;
  }
  function mountWhenReady() {
    if (petButton || (isCompact() && !nightPerchTarget) || !catalog.length) return;
    positionMode = 'auto';
    // MutationObserver may call this many times while cards render. Keep that
    // callback O(1): only try the comment anchor, never the collision search.
    var target = commentAnchorNode();
    var position = anchorPosition(target);
    if (position) { stopPositionWait(); createPet(position); return; }
    if (!positionObserver) {
      positionObserver = new MutationObserver(mountWhenReady);
      positionObserver.observe(document.getElementById('grafiks-list') || document.body,
        { childList: true, subtree: true });
      positionTimer = setTimeout(function () {
        positionTimer = 0;
        // The expensive empty-space search is allowed only in this one rare
        // six-second fallback when no normal anchor appeared at all.
        var latePosition = fallbackPosition();
        if (latePosition) {
          stopPositionWait();
          createPet(latePosition);
        }
      }, 6000);
    }
  }

  function selectPet(index, manual) {
    if (!catalog.length || index < 0) return;
    selectedIndex = ((index % catalog.length) + catalog.length) % catalog.length;
    // Others (the header's running-cat progress line) follow the pet of the day.
    try { var chosen = catalog[selectedIndex]; if (chosen) window.dispatchEvent(new CustomEvent('minka:daily-pet', { detail: { spritesheetUrl: chosen.spritesheetUrl } })); } catch (_e) {}
    if (manual) safeWrite(CHOICE_KEY, { dayKey: petDayKey(currentDate()), id: catalog[selectedIndex].id });
    pickerPage = Math.floor(selectedIndex / PAGE_SIZE);
    updatePet();
    if (pickerOpen) renderPickerPage();
  }
  function transitionToPet(index, manual) {
    if (!catalog.length || index < 0) return false;
    index = ((index % catalog.length) + catalog.length) % catalog.length;
    if (index === selectedIndex) return false;
    var reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!petButton || reduced) {
      selectPet(index, manual);
      return true;
    }

    switchToken += 1;
    var token = switchToken;
    closePicker();
    clearAnimationTimers();
    petButton.classList.add('is-day-switching');

    setTimeout(function () {
      if (token !== switchToken) return;
      var nextPet = catalog[index];
      var loader = new Image();
      var finished = false;
      var fallback = setTimeout(finish, 2200);
      function finish() {
        if (finished || token !== switchToken) return;
        finished = true;
        clearTimeout(fallback);
        selectPet(index, manual);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (token !== switchToken || !petButton) return;
            petButton.classList.remove('is-day-switching');
            startIdle();
          });
        });
      }
      loader.onload = finish;
      loader.onerror = finish;
      loader.src = nextPet.spritesheetUrl;
      if (loader.decode) loader.decode().then(finish).catch(function () {});
    }, 260);
    return true;
  }
  function createPicker() {
    picker = document.createElement('section');
    picker.id = 'mkDailyCatPicker';
    picker.className = 'mk-daily-cat-picker';
    picker.hidden = true;
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Izvēlies dienas kaķi');
    picker.innerHTML = '<div class="mk-daily-cat-picker-head"><div><strong>Izvēlies kaķi</strong></div>' +
      '<button type="button" class="mk-daily-cat-picker-close" aria-label="Aizvērt">×</button></div>' +
      '<div class="mk-daily-cat-picker-grid"></div><div class="mk-daily-cat-picker-nav">' +
      '<button type="button" data-cat-page="prev" aria-label="Iepriekšējie kaķi">‹</button>' +
      '<span class="mk-daily-cat-picker-page"></span>' +
      '<button type="button" data-cat-page="next" aria-label="Nākamie kaķi">›</button></div>';
    document.body.appendChild(picker);
    pickerGrid = picker.querySelector('.mk-daily-cat-picker-grid');
    pickerPageLabel = picker.querySelector('.mk-daily-cat-picker-page');
    picker.querySelector('.mk-daily-cat-picker-close').addEventListener('click', closePicker);
    picker.querySelector('[data-cat-page="prev"]').addEventListener('click', function () {
      pickerPage = (pickerPage - 1 + Math.ceil(catalog.length / PAGE_SIZE)) % Math.ceil(catalog.length / PAGE_SIZE);
      renderPickerPage();
    });
    picker.querySelector('[data-cat-page="next"]').addEventListener('click', function () {
      pickerPage = (pickerPage + 1) % Math.ceil(catalog.length / PAGE_SIZE);
      renderPickerPage();
    });
  }

  function choosePickerPet(button) {
    if (!pickerOpen || !button) return;
    var index = Number(button.dataset.catIndex);
    if (!Number.isFinite(index)) return;
    selectPet(index, true);
    closePicker();
  }

  function wirePickerItem(button) {
    button.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      button.classList.add('is-pressing');
      try { button.setPointerCapture(event.pointerId); } catch (_error) {}
    });
    button.addEventListener('pointerup', function (event) {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      button.classList.remove('is-pressing');
      choosePickerPet(button);
    });
    button.addEventListener('pointercancel', function () {
      button.classList.remove('is-pressing');
    });
    // Keyboard activation emits click with detail=0. Pointer selection is
    // already committed on pointerup, so it never depends on hover state.
    button.addEventListener('click', function (event) {
      if (event.detail !== 0) return;
      event.preventDefault();
      choosePickerPet(button);
    });
  }

  function renderPickerPage() {
    if (!pickerOpen || !catalog.length) return;
    var pages = Math.ceil(catalog.length / PAGE_SIZE);
    pickerPage = ((pickerPage % pages) + pages) % pages;
    var start = pickerPage * PAGE_SIZE;
    var fragment = document.createDocumentFragment();
    catalog.slice(start, start + PAGE_SIZE).forEach(function (pet, offset) {
      var index = start + offset;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'mk-daily-cat-picker-item' + (index === selectedIndex ? ' is-selected' : '');
      button.dataset.catIndex = String(index);
      button.setAttribute('aria-label', 'Izvēlēties ' + pet.displayName);
      if (index === selectedIndex) button.setAttribute('aria-current', 'true');
      var image = document.createElement('img');
      image.src = pet.posterUrl;
      image.alt = '';
      image.width = 54;
      image.height = 58;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', function () { image.src = 'data/cat_small.webp'; }, { once: true });
      var name = document.createElement('span');
      name.textContent = pet.displayName;
      button.appendChild(image);
      button.appendChild(name);
      wirePickerItem(button);
      fragment.appendChild(button);
    });
    pickerGrid.replaceChildren(fragment);
    pickerPageLabel.textContent = (pickerPage + 1) + ' / ' + pages;
  }
  function positionPicker() {
    if (!pickerOpen || !petButton) return;
    var petPosition = currentPosition();
    if (!petPosition) return;
    var petLeft = innerWidth - PET_SIZE - petPosition.right;
    var petTop = innerHeight - PET_SIZE - petPosition.bottom;
    var petRect = {
      left: petLeft,
      right: petLeft + PET_SIZE,
      top: petTop,
      bottom: petTop + PET_SIZE
    };
    var list = document.getElementById('grafiks-list');
    var listRect = list && list.getBoundingClientRect();
    var pickerRect = picker.getBoundingClientRect();
    var left = petRect.right + 12;
    if (left + pickerRect.width > innerWidth - 8) left = petRect.left - pickerRect.width - 12;
    left = Math.max(8, Math.min(innerWidth - pickerRect.width - 8, left));
    var minTop = listRect ? Math.max(8, listRect.top + 8) : 8;
    var top = Math.max(minTop, Math.min(innerHeight - pickerRect.height - 8, petRect.top));
    picker.style.left = Math.round(left) + 'px';
    picker.style.top = Math.round(top) + 'px';
  }
  function openPicker() {
    if (!picker || !petButton || isCompact()) return;
    pickerOpen = true;
    picker.hidden = false;
    pickerPage = Math.floor(selectedIndex / PAGE_SIZE);
    renderPickerPage();
    positionPicker();
    playAction('waiting', 1);
  }
  function closePicker() {
    if (!picker) return;
    pickerOpen = false;
    picker.hidden = true;
    if (pickerGrid) pickerGrid.replaceChildren();
    if (petButton && !dragState) startIdle();
  }

  function loadCatalog() {
    fetch(CATALOG_URL, { cache: 'force-cache' }).then(function (response) {
      if (!response.ok) throw new Error('Daily cat catalog: ' + response.status);
      return response.json();
    }).then(function (items) {
      catalog = Array.isArray(items) ? items.map(normalizePet).filter(Boolean) : [];
      if (!catalog.length) throw new Error('Daily cat catalog is empty');
      var rolloverIndex = indexForDutyDay(rolloverDutyDay);
      selectedIndex = rolloverIndex >= 0 ? rolloverIndex : indexForToday();
      activePetDayKey = petDayKey(currentDate());
      pickerPage = Math.floor(selectedIndex / PAGE_SIZE);
      createPicker();
      mountWhenReady();
      scheduleDayChange();
      document.documentElement.setAttribute('data-mk-daily-cat-count', String(catalog.length));
      document.documentElement.setAttribute('data-mk-daily-cat-id', catalog[selectedIndex].id);
    }).catch(function () {
      document.documentElement.setAttribute('data-mk-daily-cat-error', 'catalog');
      syncBubbleTail();
    });
  }
  function init() {
    // Compact layouts never show the pet; start those without a tail so the
    // first paint is already the settled pill, not a morph.
    if (isCompact() || (petHiddenMedia && petHiddenMedia.matches)) syncBubbleTail();
    if (petHiddenMedia) {
      var onPetMedia = function () { if (petButton || isCompact() || petHiddenMedia.matches) syncBubbleTail(); };
      if (petHiddenMedia.addEventListener) petHiddenMedia.addEventListener('change', onPetMedia);
      else if (petHiddenMedia.addListener) petHiddenMedia.addListener(onPetMedia);
    }
    addEventListener('scroll', scheduleScrollPosition, { passive: true, capture: true });
    addEventListener('resize', function () {
      if (!petButton && !isCompact()) mountWhenReady();
      syncVisibility();
      restorePosition();
      if (pickerOpen) requestAnimationFrame(positionPicker);
    }, { passive: true });
    addEventListener('daySelected', function () {
      if (pickerOpen) requestAnimationFrame(positionPicker);
      if (petButton && positionMode === 'auto') {
        setTimeout(function () {
          var nextTarget = resolveAnchorElement(anchorChoice);
          if (anchorChoice.kind === 'card' && !nextTarget) {
            setAnchorChoice({ kind: 'comment', worker: '' });
          } else {
            observeAnchor(nextTarget);
          }
          scheduleAutoPosition();
        }, 220);
      }
    });
    addEventListener('minka:auto-day-rollover', function (event) {
      rolloverDutyDay = String(event && event.detail && event.detail.to || '');
      if (!catalog.length) return;
      var nextIndex = indexForDutyDay(rolloverDutyDay);
      if (nextIndex < 0) nextIndex = automaticIndex(new Date());
      try { localStorage.removeItem(CHOICE_KEY); } catch (_error) {}
      activePetDayKey = petDayKey(currentDate());
      resetAutoPosition();
      transitionToPet(nextIndex, false);
    });
    document.addEventListener('pointerdown', function (event) {
      if (pickerOpen && !picker.contains(event.target) && !petButton.contains(event.target)) closePicker();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closePicker();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearAnimationTimers();
      } else if (catalog.length) {
        var currentPetDay = petDayKey(currentDate());
        if (currentPetDay !== activePetDayKey) {
          activePetDayKey = currentPetDay;
          try { localStorage.removeItem(CHOICE_KEY); } catch (_error) {}
          resetAutoPosition();
        }
        var previewIndex = indexForDutyDay(rolloverDutyDay);
        var index = previewIndex >= 0 ? previewIndex : indexForToday();
        if (index !== selectedIndex) transitionToPet(index, false);
        else startIdle();
      }
    });
    window.__minkaDailyCat = {
      open: openPicker,
      close: closePicker,
      enterNightSplit: enterNightSplit,
      exitNightSplit: exitNightSplit,
      getCurrent: function () {
        var pet = catalog[selectedIndex];
        return pet ? { index: selectedIndex, id: pet.id, displayName: pet.displayName, spritesheetUrl: pet.spritesheetUrl } : null;
      },
      getAutomatic: function () {
        var previewIndex = indexForDutyDay(rolloverDutyDay);
        var index = previewIndex >= 0 ? previewIndex : automaticIndex(currentDate());
        var pet = catalog[index];
        return pet ? { index: index, id: pet.id, displayName: pet.displayName } : null;
      },
      play: function (animationId) { return playAction(animationId, 1); },
      cheer: cheer,
      notice: notice,
      tour: startTour,
      say: say,
      // on screen and able to speak at all (it may still be busy right now)
      present: function () { return !!petButton && !petButton.hidden && canAnimate(); },
      animations: function () { return Object.keys(ACTIONS); }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(loadCatalog, { timeout: 2000 });
    else setTimeout(loadCatalog, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
