// YouTube as a Webamp media source, installed the way hls.js is: a wrapper
// over the methods of `webamp.media._source` (Webamp's ElementSource). A
// "youtube:<id>" url is taken over here and never reaches the <audio>
// element; every other url goes to exactly the method that was there
// before (the hls.js wrapper, then the original).
//
// One state machine: activeKind is "youtube" while the current track is a
// YouTube track and null otherwise; a normal url deactivates YouTube (stops
// the player) before the old path runs, and a YouTube url detaches the
// <audio> element first, so the two never play at once.
//
// Webamp's Media only listens to the source's own events, and they are the
// only ones emitted here:
//   loaded          -> Media "fileLoaded"  -> SET_MEDIA (duration)
//   positionChange  -> Media "timeupdate"  -> UPDATE_TIME_ELAPSED
//   statusChange    -> Media "playing"/"timeupdate"
//   ended           -> Media "ended"       -> Webamp picks the next track
// Install after hls.js (see player.js), so this wrapper is the outermost.

import { isYouTubeUrl, youtubeIdFromUrl, youtubeTracks } from "./tracks.js";

// Webamp's MediaStatus values (ElementSource._status).
const PLAYING = "PLAYING";
const PAUSED = "PAUSED";
const STOPPED = "STOPPED";
// Current-time updates while a video plays (Webamp's own <audio> gives ~4/s).
const POSITION_INTERVAL_MS = 500;

/**
 * @param webamp   the Webamp instance (after installHlsSupport)
 * @param options.engine   the YouTube engine (youtube/engine.js)
 * @param options.getHost  () => element the player is created in (the VIDEO
 *                         window's player pane); called on the first play
 * @param options.onActive (active: boolean) => void  YouTube took over / let go
 */
export function installYouTubeSource(webamp, { engine, getHost, onActive, resolveStream = null, onStreamMode = null } = {}) {
  const media = webamp.media;
  const source = media?._source;
  const audio = source?._audio;
  if (!source || !audio || source.__youtubeInstalled) {
    return source?.__youtubeSource ?? null;
  }
  source.__youtubeInstalled = true;

  // What was there before: the hls.js wrapper for loadUrl/seekToTime, the
  // originals for the rest.
  const previous = {
    loadUrl: source.loadUrl.bind(source),
    play: source.play.bind(source),
    pause: source.pause.bind(source),
    stop: source.stop.bind(source),
    seekToTime: source.seekToTime.bind(source),
    getDuration: source.getDuration.bind(source),
    getTimeElapsed: source.getTimeElapsed.bind(source),
    setVolume: media.setVolume.bind(media),
    loadFromUrl: media.loadFromUrl.bind(media)
  };

  // "youtube": the official player plays the video. "stream": a resolved
  // audio stream plays through Webamp's own <audio> (real EQ and spectrum);
  // every method then takes the element path exactly like a radio stream.
  let activeKind = null;      // "youtube" | "stream" | null
  let activeId = null;        // video id of the current YouTube track
  let activeUrl = null;
  let knownDuration = 0;      // from the track metadata until the player reports one
  let reportedDuration = 0;   // what the last "loaded" told Webamp
  let pendingAutoplay = false; // Media.loadFromUrl's autoplay flag, for loadUrl
  let expected = "idle";      // what we asked the player for: playing | paused | stopped
  let timer = null;
  let pauseCheck = null;      // settles a "paused" the player reported on its own

  const trigger = (event) => source._emitter.trigger(event);
  const setStatus = (status) => source._setStatus(status);

  function startTimer() {
    if (timer) return;
    timer = setInterval(() => trigger("positionChange"), POSITION_INTERVAL_MS);
  }
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function clearPauseCheck() {
    if (pauseCheck) clearTimeout(pauseCheck);
    pauseCheck = null;
  }

  // The video is over: Webamp decides what comes next (next / repeat /
  // stop); nothing here touches the playlist.
  function ended() {
    stopTimer();
    clearPauseCheck();
    expected = "stopped";
    trigger("ended");
    setStatus(STOPPED);
  }

  // Frees the <audio> element (and an hls.js session on it) so nothing keeps
  // streaming underneath the video. Removing the src fires no "error" or
  // "ended" on the element, so nothing upstream mistakes it for a failure.
  function detachAudio() {
    audio.pause();
    source.__dropHls?.();
    if (audio.hasAttribute("src")) {
      audio.removeAttribute("src");
      audio.load();
    }
  }

  function deactivate() {
    stopTimer();
    clearPauseCheck();
    if (engine.hasPlayer()) engine.stop();
    expected = "stopped";
    activeKind = null;
    activeId = null;
    activeUrl = null;
    knownDuration = 0;
    onActive?.(false);
  }

  // Streams (resolveStream): tried first, within a time budget, so a song
  // never waits long for a dead mirror; ids whose stream failed go straight
  // to the official player until the page reloads.
  const STREAM_BUDGET_MS = 7000;
  const streamFailed = new Set();
  let loadToken = 0;
  let streamAbort = null;

  async function findStream(id) {
    streamAbort?.abort();
    const controller = new AbortController();
    streamAbort = controller;
    const timer = setTimeout(() => controller.abort(), STREAM_BUDGET_MS);
    // The budget holds even when this joins a lookup a prefetch started.
    const budget = new Promise((resolve) => controller.signal.addEventListener("abort", () => resolve(null), { once: true }));
    try {
      return await Promise.race([resolveStream(id, { signal: controller.signal }), budget]);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      if (streamAbort === controller) streamAbort = null;
    }
  }

  // An <audio> error is "track ended" to Webamp (it would skip the song).
  // While a resolved stream plays, take the error first (a capture listener
  // on the target runs before Webamp's) and continue with the official
  // player for the same song instead.
  const onStreamError = (event) => {
    if (activeKind !== "stream" || !activeUrl) return;
    event.stopImmediatePropagation();
    const url = activeUrl;
    const resume = expected === "playing" || source.getStatus() === PLAYING;
    streamFailed.add(youtubeIdFromUrl(url));
    onStreamMode?.(false, { url });
    console.warn("Lācītis stream failed, switching to the YouTube player:", youtubeIdFromUrl(url));
    activeKind = null;
    void (async () => {
      pendingAutoplay = resume;
      await source.loadUrl(url);
      if (resume && activeUrl === url) await source.play();
    })();
  };
  audio.addEventListener("error", onStreamError, true);

  // Media.loadFromUrl(url, autoplay): remember autoplay for loadUrl, which
  // Webamp calls without it. BUFFER_TRACK (next/prev while stopped) loads
  // with autoplay=false and must not start a stream or create the player.
  // Webamp's own loadFromUrl awaits loadUrl and then plays: with a stream
  // lookup in between, a quick second click would let the first lookup's
  // play() start the wrong song ("TODO #race" upstream). Same steps, but a
  // superseded load does not play.
  media.loadFromUrl = async (url, autoplay) => {
    pendingAutoplay = Boolean(autoplay);
    const emitter = media._emitter;
    if (!emitter) return previous.loadFromUrl(url, autoplay);
    const token = loadToken + 1; // what source.loadUrl is about to take
    emitter.trigger("waiting");
    await source.loadUrl(url);
    emitter.trigger("stopWaiting");
    if (autoplay && token === loadToken) media.play();
  };

  source.loadUrl = async (url) => {
    const token = ++loadToken;
    if (!isYouTubeUrl(url)) {
      streamAbort?.abort();
      if (activeKind === "youtube") deactivate();
      activeKind = null;
      return previous.loadUrl(url);
    }
    const id = youtubeIdFromUrl(url);
    if (resolveStream && !streamFailed.has(id)) {
      const stream = await findStream(id);
      if (token !== loadToken) return; // another track was chosen meanwhile
      if (stream) {
        if (activeKind === "youtube") deactivate();
        activeKind = "stream";
        activeUrl = url;
        activeId = id;
        expected = pendingAutoplay ? "playing" : "stopped";
        onStreamMode?.(true, { url, stream });
        return previous.loadUrl(stream.url);
      }
    }
    if (activeKind === "stream") onStreamMode?.(false, { url });
    if (activeKind !== "youtube") detachAudio();
    stopTimer();
    clearPauseCheck();
    activeKind = "youtube";
    activeUrl = url;
    activeId = youtubeIdFromUrl(url);
    knownDuration = youtubeTracks.get(url)?.duration ?? 0;
    reportedDuration = knownDuration;
    expected = "stopped";
    onActive?.(true);
    // An existing player is pointed at the new video without a stream
    // (cue); play() does loadVideoById itself. Without a player nothing is
    // created here: browsing and next/prev while stopped stay iframe-free.
    if (engine.hasPlayer() && !pendingAutoplay && engine.getCurrentId() !== activeId) {
      await engine.load(activeId, { autoplay: false });
    }
    // Duration is known from the metadata: Webamp's SET_MEDIA gets it now.
    trigger("loaded");
  };

  source.play = async () => {
    if (activeKind === "stream") expected = "playing";
    if (activeKind !== "youtube") return previous.play();
    // ElementSource semantics: play() on anything but a paused source starts
    // from the beginning.
    const fromStart = source.getStatus() !== PAUSED;
    const id = activeId;
    expected = "playing";
    try {
      const host = getHost?.();
      if (engine.getCurrentId() !== id || engine.getState() === "idle" || engine.getState() === "ended") {
        await engine.load(id, { autoplay: true, host });
      } else {
        await engine.ensurePlayer(host);
        if (fromStart && engine.getState() !== "cued") engine.seekTo(0);
        engine.play();
      }
    } catch (error) {
      console.warn("YouTube playback failed:", error);
      expected = "stopped";
      trigger("ended");
      setStatus(STOPPED);
      return;
    }
    if (activeId !== id) return; // superseded while the player was loading
    setStatus(PLAYING);
  };

  source.pause = () => {
    if (activeKind === "stream") expected = "paused";
    if (activeKind !== "youtube") return previous.pause();
    expected = "paused";
    stopTimer();
    clearPauseCheck();
    engine.pause();
    setStatus(PAUSED);
  };

  source.stop = () => {
    if (activeKind === "stream") expected = "stopped";
    if (activeKind !== "youtube") return previous.stop();
    expected = "stopped";
    stopTimer();
    clearPauseCheck();
    engine.stop();
    setStatus(STOPPED);
  };

  source.seekToTime = (seconds) => {
    if (activeKind !== "youtube") return previous.seekToTime(seconds);
    const duration = source.getDuration();
    engine.seekTo(Math.max(0, Math.min(Number(seconds) || 0, duration || Infinity)));
    trigger("positionChange");
  };

  // The player's duration counts only once it holds this track's video;
  // before that (or without a player) the metadata's.
  const playerHasTrack = () => engine.hasPlayer() && engine.getCurrentId() === activeId;
  source.getDuration = () => (activeKind === "youtube" ? (playerHasTrack() && engine.getDuration()) || knownDuration : previous.getDuration());
  source.getTimeElapsed = () => (activeKind === "youtube" ? (playerHasTrack() ? engine.getCurrentTime() : 0) : previous.getTimeElapsed());

  // Webamp hands Media the store's volume (0..100); the gain node keeps it
  // for audio, the engine mirrors it (applied when the player exists). The
  // store stays the only volume state.
  media.setVolume = (value) => {
    previous.setVolume(value);
    engine.setVolume(value);
  };
  engine.setVolume(webamp.store.getState().media.volume);

  // Player state -> the source's events. Only while YouTube is the active
  // source, and only for what we asked for (a stale event from a video that
  // was just replaced changes nothing).
  const offEngine = engine.on((event, detail) => {
    if (activeKind !== "youtube") return;
    if (event === "state") {
      switch (detail) {
        case "playing": {
          if (expected === "playing") startTimer();
          const duration = engine.getDuration();
          if (duration && Math.round(duration) !== Math.round(reportedDuration)) {
            knownDuration = duration;
            reportedDuration = duration;
            trigger("loaded");
          }
          break;
        }
        case "buffering":
          // Time does not move; the timer resumes on "playing".
          stopTimer();
          break;
        case "paused":
          stopTimer();
          // A pause Webamp did not ask for. The player also reports one
          // for a moment when a new video replaces a playing one and at the
          // very end of a video, so it is settled a little later: still
          // paused at the end -> the video is over; still paused elsewhere
          // (the viewer clicked the video) -> Webamp pauses through its own
          // action, so its store stays right.
          if (expected === "playing" && !pauseCheck) {
            pauseCheck = setTimeout(() => {
              pauseCheck = null;
              if (activeKind !== "youtube" || expected !== "playing" || engine.getState() !== "paused") return;
              const duration = engine.getDuration();
              if (duration && engine.getCurrentTime() >= duration - 1) ended();
              else webamp.pause();
            }, 400);
          }
          break;
        case "ended":
          if (expected === "playing") ended();
          else stopTimer();
          break;
        default:
          break;
      }
    } else if (event === "error" && expected === "playing") {
      // Unplayable video: same as a stream error, Webamp moves on.
      console.warn(`YouTube player error ${detail} for ${activeId}`);
      ended();
    }
  });

  const api = {
    engine,
    isActive: () => activeKind === "youtube",
    isStream: () => activeKind === "stream",
    getActiveUrl: () => activeUrl,
    hasTimer: () => timer != null,
    uninstall() {
      stopTimer();
      clearPauseCheck();
      offEngine();
      streamAbort?.abort();
      audio.removeEventListener("error", onStreamError, true);
      source.loadUrl = previous.loadUrl;
      source.play = previous.play;
      source.pause = previous.pause;
      source.stop = previous.stop;
      source.seekToTime = previous.seekToTime;
      source.getDuration = previous.getDuration;
      source.getTimeElapsed = previous.getTimeElapsed;
      media.setVolume = previous.setVolume;
      media.loadFromUrl = previous.loadFromUrl;
      source.__youtubeInstalled = false;
      source.__youtubeSource = null;
      activeKind = null;
    }
  };
  source.__youtubeSource = api;
  return api;
}
