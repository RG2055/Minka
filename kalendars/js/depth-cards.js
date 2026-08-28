(function () {
  'use strict';

  /* Fast, lightweight pointer tilt. Pointer events only save the latest target;
     one shared RAF writes it at most once per display frame. CSS performs the
     short easing on the compositor, so there is no JS chase loop at idle. */
  var CARD_SELECTOR = '.card.mk-mid-card:not(.rg-feedback-card)';
  var PROPS = [
    '--mk-depth-rx', '--mk-depth-ry',
    '--mk-depth-far-x', '--mk-depth-far-y'
  ];
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var host = null;
  var active = null;
  var frame = 0;
  var clearTimer = 0;
  var frameWrites = 0;

  function enabled() {
    return (!finePointer || finePointer.matches)
      && (!reducedMotion || !reducedMotion.matches)
      && !document.documentElement.classList.contains('mk-mobile-shell');
  }

  function clamp(value) {
    return Math.max(-1, Math.min(1, value));
  }

  function closestCard(target) {
    if (!target || target.nodeType !== 1 || !target.closest) return null;
    var card = target.closest(CARD_SELECTOR);
    return card && host && host.contains(card) ? card : null;
  }

  function setGeometryListeners(on) {
    if (on) {
      window.addEventListener('resize', geometryChanged, { passive: true });
      window.addEventListener('scroll', geometryChanged, { capture: true, passive: true });
    } else {
      window.removeEventListener('resize', geometryChanged);
      window.removeEventListener('scroll', geometryChanged, true);
    }
  }

  function clearCard(card) {
    if (!card) return;
    card.classList.remove('mk-depth-live');
    PROPS.forEach(function (name) { card.style.removeProperty(name); });
  }

  function stop(immediate) {
    if (frame) cancelAnimationFrame(frame);
    if (clearTimer) clearTimeout(clearTimer);
    frame = 0;
    clearTimer = 0;
    if (active) {
      clearCard(active.card);
      active = null;
      setGeometryListeners(false);
    }
    if (immediate) frameWrites = 0;
  }

  function scheduleWrite() {
    if (!frame && active) {
      frame = requestAnimationFrame(flush);
    }
  }

  function writeFrame(entry) {
    var card = entry.card;
    var x = entry.targetX;
    var y = entry.targetY;
    card.style.setProperty('--mk-depth-rx', (-y * 8.5).toFixed(3) + 'deg');
    card.style.setProperty('--mk-depth-ry', (x * 10).toFixed(3) + 'deg');
    card.style.setProperty('--mk-depth-far-x', (-x * 3.2).toFixed(3) + 'px');
    card.style.setProperty('--mk-depth-far-y', (-y * 2.4).toFixed(3) + 'px');
    frameWrites += 1;
  }

  function flush() {
    frame = 0;
    if (!active || !active.card.isConnected || !enabled()) {
      stop(false);
      return;
    }
    writeFrame(active);
  }

  function pointTarget(entry, clientX, clientY) {
    var rect = entry.rect;
    if (!rect || !rect.width || !rect.height) return;
    entry.targetX = clamp(((clientX - rect.left) / rect.width) * 2 - 1);
    entry.targetY = clamp(((clientY - rect.top) / rect.height) * 2 - 1);
    scheduleWrite();
  }

  function activate(card, event) {
    if (!card || !enabled()) return;
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = 0;
    }
    if (active && active.card === card) {
      active.inside = true;
      pointTarget(active, event.clientX, event.clientY);
      return;
    }

    /* Read the new card before any class/style writes. This avoids the classic
       write -> layout read forced-reflow path when moving between cards. */
    var rect = card.getBoundingClientRect();
    if (active) stop(false);
    active = {
      card: card,
      rect: rect,
      targetX: 0,
      targetY: 0,
      inside: true
    };
    setGeometryListeners(true);
    card.classList.add('mk-depth-live');
    pointTarget(active, event.clientX, event.clientY);
  }

  function leave(card) {
    if (!active || active.card !== card) return;
    active.inside = false;
    active.targetX = 0;
    active.targetY = 0;
    scheduleWrite();
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = window.setTimeout(function () {
      clearTimer = 0;
      if (!active || active.card !== card || active.inside) return;
      clearCard(card);
      active = null;
      setGeometryListeners(false);
    }, 150);
  }

  function geometryChanged() {
    /* Scroll/resize can invalidate the cached rect. Cancel cheaply instead of
       measuring layout inside a high-frequency observer path. */
    if (active) leave(active.card);
  }

  function mount() {
    if (host) return;
    host = document.getElementById('grafiks-list');
    if (!host) return;

    host.addEventListener('pointerover', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      var card = closestCard(event.target);
      if (!card || (event.relatedTarget && card.contains(event.relatedTarget))) return;
      activate(card, event);
    }, { passive: true });

    host.addEventListener('pointermove', function (event) {
      if (!active || (event.pointerType && event.pointerType !== 'mouse')) return;
      if (!active.card.contains(event.target)) return;
      pointTarget(active, event.clientX, event.clientY);
    }, { passive: true });

    host.addEventListener('pointerout', function (event) {
      var card = closestCard(event.target);
      if (!card || (event.relatedTarget && card.contains(event.relatedTarget))) return;
      leave(card);
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(false);
    });
    window.addEventListener('blur', function () { stop(false); });
    if (finePointer && finePointer.addEventListener) finePointer.addEventListener('change', function () { stop(false); });
    if (reducedMotion && reducedMotion.addEventListener) reducedMotion.addEventListener('change', function () { stop(false); });
  }

  window.__minkaDepthDebug = {
    isRunning: function () { return !!frame; },
    activeCard: function () { return active && active.card; },
    frameWrites: function () { return frameWrites; },
    stop: function () { stop(true); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
