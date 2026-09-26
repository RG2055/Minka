// Keeps live radio playing through the things that break it in a browser.
//
// Webamp owns the single <audio> element and the play/pause/stop state; this
// controller only watches that element and Webamp's store, and when a live
// stream fails it asks Webamp to load the same track again (or the station's
// next known stream address). There is never a second audio element.
//
// Handled:
//   - the connection drops (error / premature "ended")   -> retry with backoff
//   - the stream stalls (no timeupdate for a while)      -> reload
//   - the device comes back online / wakes up            -> reload at once
//   - resume after a long pause, or play after stop      -> reload, so the
//     listener hears the live edge instead of stale buffered audio
//   - several known addresses for one station            -> fall back
//
// Everything is event driven; the only timer is a 5 s stall check that runs
// while a station is playing, plus the pending retry delay.

import { toPlaylistTracks, stationForTrackUrl } from "./radio.js";

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000, 30000, 30000];
const STALL_CHECK_MS = 5000;
const STALL_AFTER_MS = 15000;
const LIVE_EDGE_AFTER_PAUSE_MS = 30000;
// Right after a station starts, a stop is the user's, not a failure signal.
const START_GRACE_MS = 4000;

export function createPlaybackController({ webamp, onEvent }) {
  const audio = webamp.media?._source?._audio ?? null;
  const emit = (type, detail = {}) => onEvent?.({ type, ...detail });

  let station = null;          // what the listener asked for
  let intent = "stopped";      // "playing" | "paused" | "stopped"
  let attempt = 0;
  let urlIndex = 0;
  let retryTimer = null;
  let stallTimer = null;
  let lastProgressAt = 0;
  let lastFailureAt = 0;
  let pausedAt = 0;
  let startedAt = 0;
  let lastStatus = null;
  let reloading = false;

  const isLive = (s) => Boolean(s) && (s.live !== false);

  function currentTrackId() {
    return webamp.store.getState().playlist.currentTrack;
  }

  function clearTimers() {
    clearTimeout(retryTimer);
    retryTimer = null;
    clearInterval(stallTimer);
    stallTimer = null;
  }

  function startStallCheck() {
    clearInterval(stallTimer);
    stallTimer = setInterval(() => {
      if (intent !== "playing" || !audio || audio.paused) {
        return;
      }
      if (Date.now() - lastProgressAt > STALL_AFTER_MS) {
        emit("stalled", { station });
        reload("stalled");
      }
    }, STALL_CHECK_MS);
  }

  // Loads the current station again; `useNextUrl` moves to the next known address.
  function reload(reason, { useNextUrl = false } = {}) {
    if (!station || reloading) {
      return;
    }
    reloading = true;
    try {
      const urls = Array.isArray(station.urls) && station.urls.length > 1 ? station.urls : [station.url];
      if (useNextUrl && urls.length > 1) {
        urlIndex = (urlIndex + 1) % urls.length;
      }
      const url = urls[urlIndex] ?? station.url;
      const id = currentTrackId();
      const track = id == null ? null : webamp.store.getState().tracks[id];
      const sameStation = track && stationForTrackUrl(track.url)?.url === station.url;

      if (sameStation && url === station.url) {
        // Same address: reload the track in place (fresh connection, playlist kept).
        webamp.store.dispatch({ type: "PLAY_TRACK", id });
      } else {
        // Another address of the same station: keep the retry state, so the
        // player's track-change handling does not treat it as a new station.
        const variant = { ...station, url, urls, originalTitle: station.originalTitle ?? station.title };
        station = variant;
        webamp.setTracksToPlay(toPlaylistTracks([variant]));
      }
      startedAt = Date.now();
      lastProgressAt = Date.now();
      emit("reconnecting", { station, attempt, reason, url });
    } finally {
      reloading = false;
    }
  }

  function scheduleRetry(reason) {
    if (!station || intent !== "playing" || retryTimer) {
      return;
    }
    if (attempt >= RETRY_DELAYS.length) {
      intent = "stopped";
      emit("failed", { station, reason });
      return;
    }
    const delay = navigator.onLine === false ? null : RETRY_DELAYS[attempt];
    attempt += 1;
    if (delay == null) {
      // Offline: the "online" event restarts us.
      emit("waiting-for-network", { station });
      return;
    }
    retryTimer = setTimeout(() => {
      retryTimer = null;
      // After two failures on one address, try the next known one.
      reload(reason, { useNextUrl: attempt > 2 && attempt % 2 === 1 });
    }, delay);
  }

  function markFailure() {
    lastFailureAt = Date.now();
  }

  // --- audio element events (capture: before Webamp's own handlers) ---------
  const onError = () => {
    markFailure();
    if (station && intent === "playing") {
      scheduleRetry("error");
    }
  };
  const onEnded = () => {
    // A live stream never ends by itself.
    if (station && isLive(station) && intent === "playing") {
      markFailure();
      scheduleRetry("ended");
    }
  };
  const onProgress = () => {
    lastProgressAt = Date.now();
    if (attempt > 0 && intent === "playing" && !audio.paused && Date.now() - startedAt > 1500) {
      attempt = 0;
      urlIndex = 0;
      emit("recovered", { station });
    }
  };
  if (audio) {
    audio.addEventListener("error", onError, true);
    audio.addEventListener("ended", onEnded, true);
    audio.addEventListener("timeupdate", onProgress);
    audio.addEventListener("playing", onProgress);
  }

  // --- Webamp status -----------------------------------------------------
  const unsubscribe = webamp.store.subscribe(() => {
    const status = webamp.store.getState().media.status;
    if (status === lastStatus) {
      return;
    }
    const previous = lastStatus;
    lastStatus = status;
    if (!station) {
      return;
    }

    if (status === "PLAYING") {
      if (previous === "PAUSED" && Date.now() - pausedAt > LIVE_EDGE_AFTER_PAUSE_MS && isLive(station)) {
        intent = "playing";
        reload("live-edge");
      } else if (previous === "STOPPED" && Date.now() - lastFailureAt > 200 && Date.now() - startedAt > START_GRACE_MS) {
        // Play after a stop: the element dropped the connection on stop.
        intent = "playing";
        reload("play-after-stop");
      } else {
        intent = "playing";
      }
      lastProgressAt = Date.now();
      startStallCheck();
    } else if (status === "PAUSED") {
      intent = "paused";
      pausedAt = Date.now();
      clearTimers();
    } else if (status === "STOPPED") {
      const failure = Date.now() - lastFailureAt < 200;
      if (!failure) {
        intent = "stopped";
        attempt = 0;
        clearTimers();
      }
    }
    emit("status", { status, intent });
  });

  // --- network / wake ------------------------------------------------------
  const onOnline = () => {
    if (station && intent === "playing") {
      clearTimeout(retryTimer);
      retryTimer = null;
      attempt = 0;
      reload("online");
    }
  };
  const onWake = () => {
    if (document.hidden || !station || intent !== "playing" || !audio) {
      return;
    }
    if (audio.paused || Date.now() - lastProgressAt > STALL_AFTER_MS) {
      reload("wake");
    }
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onWake);
  window.addEventListener("pageshow", onWake);

  return {
    /** Called when the listener starts a station (the track is already loading). */
    noteStation(next) {
      station = next;
      intent = "playing";
      attempt = 0;
      urlIndex = Math.max(0, (next?.urls ?? []).indexOf(next?.url));
      startedAt = Date.now();
      lastProgressAt = Date.now();
      lastFailureAt = 0;
      clearTimers();
      startStallCheck();
    },
    /** The listener moved to a track that is not a station. */
    clearStation() {
      station = null;
      intent = "stopped";
      clearTimers();
    },
    getStation: () => station,
    getIntent: () => intent,
    getState: () => ({ attempt, urlIndex, intent, urls: station?.urls ?? null, url: station?.url ?? null }),
    reconnect: () => {
      attempt = 0;
      reload("manual");
    },
    dispose() {
      clearTimers();
      unsubscribe();
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("pageshow", onWake);
      if (audio) {
        audio.removeEventListener("error", onError, true);
        audio.removeEventListener("ended", onEnded, true);
        audio.removeEventListener("timeupdate", onProgress);
        audio.removeEventListener("playing", onProgress);
      }
    }
  };
}
