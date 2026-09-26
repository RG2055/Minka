// Drives webamp-modern's skin objects from the classic Webamp player.
//
// webamp-modern expects an `AudioPlayer` (skin/AudioPlayer.ts) that owns an
// <audio> element and a Web Audio graph. This adapter implements that same
// surface on top of the classic Webamp instance — its Redux store for state
// and its `media` object for the analyser — so the Modern skin is a second
// *view* of the one player, never a second player. Everything is
// event-driven from the store; no timers.

const BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const KIND_TO_BAND = Object.fromEntries(BANDS.map((band, i) => [String(i + 1), band]));

const STATE = { PLAYING: "playing", PAUSED: "paused", STOPPED: "stopped" };

class Emitter {
  constructor() {
    this._listeners = new Map();
  }
  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }
  trigger(event, ...args) {
    for (const callback of this._listeners.get(event) ?? []) {
      try {
        callback(...args);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

export function createWebampClassicAudioAdapter(webamp) {
  const store = webamp.store;
  const media = webamp.media;
  const audioElement = media?._source?._audio ?? null;
  const events = new Emitter();
  const eqEvents = new Emitter();
  let vuCache = { at: 0, value: 0 };
  let vuBuffer = null;

  const state = () => store.getState();
  const normalizeKind = (kind) => String(kind).toLowerCase();
  const bandFor = (kind) => (kind === "preamp" ? "preamp" : KIND_TO_BAND[kind]);

  // --- store → events -------------------------------------------------------
  let last = {
    status: null,
    second: -1,
    volume: null,
    balance: null,
    sliders: null,
    eqOn: null,
    timeMode: null,
    albumArt: null
  };
  const unsubscribe = store.subscribe(() => {
    const s = state();
    const { media: m, equalizer } = s;
    if (m.status !== last.status) {
      last.status = m.status;
      events.trigger(m.status === "PLAYING" ? "play" : m.status === "PAUSED" ? "pause" : "stop");
      events.trigger("statchanged");
      events.trigger("timeupdate");
    }
    const second = Math.floor(m.timeElapsed || 0);
    if (second !== last.second || m.timeMode !== last.timeMode) {
      last.second = second;
      last.timeMode = m.timeMode;
      events.trigger("timeupdate");
    }
    if (m.volume !== last.volume) {
      last.volume = m.volume;
      events.trigger("volumechanged");
    }
    if (m.balance !== last.balance) {
      last.balance = m.balance;
      events.trigger("balancechange");
    }
    // The cover arrives after the song has started (an online look-up), so the
    // album art view has to be told about it separately from a track change.
    //
    // Read it straight from the store: this subscription is created before
    // `adapter` exists, so referring to it here would throw on the first store
    // change and tear the subscription down with it.
    const artId = s.playlist.currentTrack;
    const albumArt = artId == null ? null : s.tracks[artId]?.albumArtUrl ?? null;
    if (albumArt !== last.albumArt) {
      last.albumArt = albumArt;
      events.trigger("albumartchanged");
    }
    if (equalizer.sliders !== last.sliders) {
      const previous = last.sliders;
      last.sliders = equalizer.sliders;
      for (const [band, value] of Object.entries(equalizer.sliders)) {
        if (!previous || previous[band] !== value) {
          const kind = band === "preamp" ? "preamp" : String(BANDS.indexOf(Number(band)) + 1);
          eqEvents.trigger(kind);
        }
      }
    }
    if (equalizer.on !== last.eqOn) {
      last.eqOn = equalizer.on;
      events.trigger("eqenabledchanged");
    }
  });

  const adapter = {
    // --- events (same names the built-in AudioPlayer uses) ---
    on: (event, callback) => events.on(event, callback),
    off: (event, callback) => events.off(event, callback),
    trigger: (event, ...args) => events.trigger(event, ...args),

    // --- transport ---
    play: () => webamp.play(),
    pause: () => webamp.pause(),
    stop: () => webamp.stop(),
    seekTo: (seconds) => webamp.seekToTime(seconds),
    seekToPercent: (percent) => {
      store.dispatch({ type: "SEEK_TO_PERCENT_COMPLETE", percent: Math.max(0, Math.min(1, percent)) * 100 });
    },
    setAudioSource: () => {
      // Tracks come from the classic playlist through the PlaylistProvider.
      console.warn("Modern skin asked to set an audio source; use the classic playlist instead.");
    },

    // --- time ---
    toggleRemainingTime: () => store.dispatch({ type: "TOGGLE_TIME_MODE" }),
    get _timeRemaining() {
      return state().media.timeMode === "REMAINING";
    },
    getCurrentTime: () => {
      const m = state().media;
      const elapsed = m.timeElapsed || 0;
      return m.timeMode === "REMAINING" && m.length ? elapsed - m.length : elapsed;
    },
    getCurrentTimePercent: () => {
      const m = state().media;
      return m.length ? (m.timeElapsed || 0) / m.length : 0;
    },
    getLength: () => state().media.length || 0,
    getState: () => {
      const status = state().media.status;
      return status === "PLAYING" ? STATE.PLAYING : status === "PAUSED" ? STATE.PAUSED : STATE.STOPPED;
    },
    get _isStop() {
      return state().media.status === "STOPPED";
    },

    // --- volume / balance (Modern: 0..1 and -1..1; classic: 0..100 and -100..100) ---
    getVolume: () => (state().media.volume ?? 100) / 100,
    setVolume: (volume) => {
      const next = Math.round(Math.max(0, Math.min(1, volume)) * 100);
      if (next !== state().media.volume) {
        store.dispatch({ type: "SET_VOLUME", volume: next });
      }
    },
    getBalance: () => (state().media.balance ?? 0) / 100,
    setBalance: (balance) => {
      const next = Math.round(Math.max(-1, Math.min(1, balance)) * 100);
      if (next !== state().media.balance) {
        store.dispatch({ type: "SET_BALANCE", balance: next });
      }
    },
    getPlaybackRate: () => audioElement?.playbackRate ?? 1,
    setPlaybackRate: (value) => {
      if (audioElement) audioElement.playbackRate = Math.max(0.5, Math.min(4, value));
      events.trigger("playbackratechange");
    },

    // --- EQ (Modern: 0..1 per kind "preamp" | "1".."10"; classic: 0..100 per band) ---
    getEq: (kind) => {
      const band = bandFor(normalizeKind(kind));
      const value = band == null ? undefined : state().equalizer.sliders[band];
      return value == null ? 0.5 : value / 100;
    },
    setEq: (kind, value) => {
      const band = bandFor(normalizeKind(kind));
      if (band == null) return;
      store.dispatch({ type: "SET_BAND_VALUE", band, value: Math.round(Math.max(0, Math.min(1, value)) * 100) });
    },
    onEqChange: (kind, callback) => eqEvents.on(normalizeKind(kind), callback),
    getEqEnabled: () => Boolean(state().equalizer.on),
    setEqEnabled: (enable) => store.dispatch({ type: enable ? "SET_EQ_ON" : "SET_EQ_OFF" }),
    get _eqEnabled() {
      return Boolean(state().equalizer.on);
    },

    // --- what the classic player knows about the current track ---
    // (bitrate/sample rate/channels come from Webamp's own track state, fed
    // by its tag reader for files and by the radio metadata modules for
    // streams; absent fields stay absent.)
    getTrackInfo: () => {
      const s = state();
      const id = s.playlist.currentTrack;
      const track = id == null ? null : s.tracks[id];
      if (!track) return {};
      const kbps = Number.parseInt(track.kbps, 10);
      const khz = Number.parseFloat(track.khz);
      const info = {};
      if (Number.isFinite(kbps) && kbps > 0) info.bitrate = kbps;
      if (Number.isFinite(khz) && khz > 0) info.sampleRate = khz * 1000;
      if (Number.isFinite(track.channels) && track.channels > 0) info.channels = track.channels;
      if (track.title) info.title = track.title;
      if (track.artist) info.artist = track.artist;
      if (track.album) info.album = track.album;
      // Radio: the station is the "stream", its tags the genre. Winamp's
      // getPlayItemMetaDataString("streamname"/"streamtitle"/"genre") read
      // these; the host fills them in through setStationInfo().
      const station = adapter.getStationInfo?.() ?? null;
      if (station) {
        info.isStream = true;
        info.streamName = station.title ?? "";
        info.streamTitle = station.streamTitle ?? "";
        if (station.genre) info.genre = station.genre;
        if (!info.title && station.title) info.title = station.title;
      }
      return info;
    },
    // () => { title, genre, streamTitle } of the station playing; set by
    // the host (see mountModernSkin's getStationInfo).
    getStationInfo: null,

    // --- analysis ---
    getAnalyser: () => media.getAnalyser(),
    get _vuMeter() {
      // RMS of the time-domain signal, computed at most once per frame on demand.
      const now = performance.now();
      if (now - vuCache.at < 16) return vuCache.value;
      const analyser = media.getAnalyser();
      if (!vuBuffer || vuBuffer.length !== analyser.fftSize) vuBuffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(vuBuffer);
      let sum = 0;
      for (let i = 0; i < vuBuffer.length; i++) sum += vuBuffer[i] * vuBuffer[i];
      vuCache = { at: now, value: Math.sqrt(sum / vuBuffer.length) };
      return vuCache.value;
    },
    // webamp-modern's AlbumArt object reads this and paints it into its
    // #visual-canvas. The cover comes from the current track's media tags,
    // which the player fills in once the art lookup for a song completes.
    get _albumArtUrl() {
      const state = store.getState();
      const id = state.playlist.currentTrack;
      if (id == null) {
        return null;
      }
      return state.tracks[id]?.albumArtUrl ?? null;
    },
    get albumArtUrl() {
      return this._albumArtUrl;
    },

    // --- subscriptions ---
    onCurrentTimeChange: (callback) => events.on("timeupdate", callback),
    // webamp-modern's AlbumArt view repaints on this; the cover is looked up
    // after the song starts, so a track change alone is too early.
    onAlbumArtChange: (callback) => events.on("albumartchanged", callback),
    onSeek: (callback) => {
      if (!audioElement) return () => {};
      const handler = () => callback();
      audioElement.addEventListener("seeked", handler);
      return () => audioElement.removeEventListener("seeked", handler);
    },
    onVolumeChanged: (callback) => events.on("volumechanged", callback),
    onBalanceChanged: (callback) => events.on("balancechange", callback),

    dispose: () => unsubscribe()
  };

  return adapter;
}
