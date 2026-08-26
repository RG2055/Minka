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
  function defaultPosition() {
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
    var commentBubble = list.querySelector('.rg-feedback-card .rg-comment-icon');
    if (commentBubble) {
      var bubbleRect = commentBubble.getBoundingClientRect();
      if (bubbleRect.width > 0 && bubbleRect.height > 0) {
        // Anchor to the white bubble itself, not its full-width button. The
        // tail begins about one fifth into the bubble; the pet's centre sits
        // directly beneath it so the bubble reads as the pet speaking.
        var tailX = bubbleRect.left + Math.max(18, Math.min(28, bubbleRect.width * 0.2));
        var speechCandidate = makeCandidate(
          tailX - PET_SIZE / 2,
          bubbleRect.bottom
        );
        return asPosition(speechCandidate);
      }
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
  function applyPosition(position) {
    if (!petButton) return;
    position = clampPosition(position);
    petButton.style.right = Math.round(position.right) + 'px';
    petButton.style.bottom = Math.round(position.bottom) + 'px';
  }
  function currentPosition() {
    // A hidden pet (radio open, compact layout) reports an empty rect, so the
    // measured position would collapse into the top-left corner. Report
    // nothing instead and let the stored manual position stand.
    if (!petButton || petButton.hidden) return null;
    var rect = petButton.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return clampPosition({ right: innerWidth - rect.right, bottom: innerHeight - rect.bottom });
  }
  function restorePosition() {
    if (!petButton || petButton.hidden || dragState) return;
    if (positionMode === 'manual') {
      // Keep the dropped position unclamped so the pet returns to its own spot
      // once the viewport grows back after the radio closes.
      if (manualPosition) applyPosition(manualPosition);
      return;
    }
    var position = defaultPosition();
    if (position) applyPosition(position);
  }
  function observeAnchor() {
    if (!petButton || typeof ResizeObserver !== 'function') return;
    var nextTarget = document.querySelector('.rg-feedback-card .rg-comment-icon');
    if (nextTarget === anchorTarget) return;
    if (anchorObserver) anchorObserver.disconnect();
    anchorTarget = nextTarget;
    if (!anchorTarget) return;
    anchorObserver = new ResizeObserver(scheduleAutoPosition);
    anchorObserver.observe(anchorTarget);
  }
  function syncAutoPosition() {
    anchorFrame = 0;
    if (!petButton || positionMode !== 'auto' || dragState) return;
    observeAnchor();
    var position = defaultPosition();
    if (position) applyPosition(position);
    if (pickerOpen) positionPicker();
  }
  function scheduleAutoPosition() {
    if (!petButton || positionMode !== 'auto' || dragState || anchorFrame) return;
    anchorFrame = requestAnimationFrame(syncAutoPosition);
  }
  function resetAutoPosition() {
    positionMode = 'auto';
    manualPosition = null;
    if (petButton) petButton.dataset.positionMode = positionMode;
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
    petButton.hidden = isCompact();
    if (petButton.hidden) {
      closePicker();
      clearAnimationTimers();
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
    petButton.style.transform = 'translate3d(' + Math.round(dragState.dx) + 'px,' +
      Math.round(dragState.dy) + 'px,0)';
  }
  function onPointerDown(event) {
    if (event.button !== 0 || dragState) return;
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
    dragState.moved = true;
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
    petButton.style.transform = '';
    petButton.classList.remove('is-dragging');
    applyPosition(position);
    if (moved) {
      positionMode = 'manual';
      manualPosition = clampPosition(position);
    }
    petButton.dataset.positionMode = positionMode;
    if (petButton.hasPointerCapture(event.pointerId)) petButton.releasePointerCapture(event.pointerId);
    startIdle();
  }
  function createPet(position) {
    if (petButton || isCompact()) return;
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
    applyPosition(position);
    observeAnchor();
    updatePet();
    petButton.addEventListener('pointerdown', onPointerDown);
    petButton.addEventListener('pointermove', onPointerMove);
    petButton.addEventListener('pointerup', onPointerEnd);
    petButton.addEventListener('pointercancel', onPointerEnd);
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
  }
  function stopPositionWait() {
    if (positionObserver) positionObserver.disconnect();
    if (positionTimer) clearTimeout(positionTimer);
    positionObserver = null;
    positionTimer = 0;
  }
  function mountWhenReady() {
    if (petButton || isCompact() || !catalog.length) return;
    positionMode = 'auto';
    var position = defaultPosition();
    if (position) { stopPositionWait(); createPet(position); return; }
    if (!positionObserver) {
      positionObserver = new MutationObserver(mountWhenReady);
      positionObserver.observe(document.getElementById('grafiks-list') || document.body,
        { childList: true, subtree: true });
      positionTimer = setTimeout(function () {
        positionTimer = 0;
        var latePosition = defaultPosition();
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
    picker.innerHTML = '<div class="mk-daily-cat-picker-head"><div><strong>Izvēlies kaķi</strong>' +
      '<small>viegli, nekustīgi priekšskatījumi</small></div>' +
      '<button type="button" class="mk-daily-cat-picker-close" aria-label="Aizvērt">×</button></div>' +
      '<div class="mk-daily-cat-picker-grid"></div><div class="mk-daily-cat-picker-nav">' +
      '<button type="button" data-cat-page="prev" aria-label="Iepriekšējie kaķi">‹</button>' +
      '<span class="mk-daily-cat-picker-page"></span>' +
      '<button type="button" data-cat-page="next" aria-label="Nākamie kaķi">›</button></div>' +
      '<div class="mk-daily-cat-picker-foot">Katru dienu plkst. 08:00 ieslēdzas jaunās dienas kaķis</div>';
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
    pickerGrid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-cat-index]');
      if (!button) return;
      selectPet(Number(button.dataset.catIndex), true);
      closePicker();
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
      fragment.appendChild(button);
    });
    pickerGrid.replaceChildren(fragment);
    pickerPageLabel.textContent = (pickerPage + 1) + ' / ' + pages;
  }
  function positionPicker() {
    if (!pickerOpen || !petButton) return;
    var petRect = petButton.getBoundingClientRect();
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
    });
  }
  function init() {
    addEventListener('scroll', scheduleAutoPosition, { passive: true, capture: true });
    addEventListener('resize', function () {
      if (!petButton && !isCompact()) mountWhenReady();
      syncVisibility();
      restorePosition();
      if (pickerOpen) positionPicker();
    }, { passive: true });
    addEventListener('daySelected', function () {
      if (pickerOpen) requestAnimationFrame(positionPicker);
      if (petButton && positionMode === 'auto') {
        setTimeout(function () {
          observeAnchor();
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
      getCurrent: function () {
        var pet = catalog[selectedIndex];
        return pet ? { index: selectedIndex, id: pet.id, displayName: pet.displayName } : null;
      },
      getAutomatic: function () {
        var previewIndex = indexForDutyDay(rolloverDutyDay);
        var index = previewIndex >= 0 ? previewIndex : automaticIndex(currentDate());
        var pet = catalog[index];
        return pet ? { index: index, id: pet.id, displayName: pet.displayName } : null;
      },
      play: function (animationId) { return playAction(animationId, 1); },
      animations: function () { return Object.keys(ACTIONS); }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(loadCatalog, { timeout: 2000 });
    else setTimeout(loadCatalog, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
