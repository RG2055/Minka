/* Shared transport and device controls. Event-driven; no polling. */
(function () {
  'use strict';
  window.MinkaListening = {create(options) {
    const {audios, current, play, pause, next, previous, metadata, render} = options;
    const enabled = options.enabled || (() => true);
    let state = 'idle', owned = false;
    let volume = .7;
    try { const raw = localStorage.getItem(options.volumeKey); const value = Number(raw); if (raw !== null && Number.isFinite(value) && value >= 0 && value <= 1) volume = value; } catch (_) {}
    audios.forEach(audio => { audio.volume = volume; });
    function paint() { render({state, volume:current().volume, muted:current().muted}); }
    function media() {
      if (!owned || !enabled() || !navigator.mediaSession) return;
      try {
        if (typeof MediaMetadata !== 'undefined') navigator.mediaSession.metadata = new MediaMetadata(metadata());
        navigator.mediaSession.playbackState = current().paused ? 'paused' : 'playing';
        // Live streams have no seekable timeline. Clear stale song progress.
        navigator.mediaSession.setPositionState?.();
      } catch (_) {}
    }
    function claim() {
      if (!enabled() || !navigator.mediaSession) return;
      owned = true;
      const actions = {play:() => { if(current().paused) play(); }, pause, stop:pause, nexttrack:next, previoustrack:previous};
      for (const [action, handler] of Object.entries(actions)) {
        try { navigator.mediaSession.setActionHandler(action, () => { if(enabled()) handler(); }); } catch (_) {}
      }
      media();
    }
    const api = {
      metadata:media,
      setState(value) { state = value; paint(); },
      setVolume(value) {
        if (!Number.isFinite(value)) return;
        volume = Math.max(0, Math.min(1, value));
        audios.forEach(audio => { audio.volume = volume; audio.muted = false; });
        try { localStorage.setItem(options.volumeKey, String(volume)); } catch (_) {}
        paint();
      },
      toggleMute() { const muted = !current().muted; audios.forEach(audio => { audio.muted = muted; }); paint(); },
      release() { owned = false; }
    };
    for (const audio of audios) {
      for (const [event, value] of Object.entries({loadstart:'loading',waiting:'loading',playing:'playing',pause:'paused',ended:'paused',error:'error'})) {
        audio.addEventListener(event, () => {
          if (audio !== current()) return;
          if (event === 'waiting' && audio.paused) return;
          state = value; if (event === 'playing') claim(); else media(); paint();
        });
      }
      audio.addEventListener('play', () => { if(audio === current()) { state = 'loading'; claim(); paint(); } });
      audio.addEventListener('volumechange', paint);
    }
    paint();
    return api;
  }};
})();
