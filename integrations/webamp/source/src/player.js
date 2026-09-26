// The radio player: Webamp plus everything this project adds to it — the
// Media Library window, the stream watcher (reconnect + ICY titles), HLS
// support, EQ AUTO and bookmarks/history. Used by the full-page app
// (main.js) and by the embeddable build (embed.js).

// The "lazy" build leaves out JSZip and music-metadata (~360 KB): JSZip is
// fetched the first time a skin archive is loaded, and tags are never read
// because radio tracks carry their own metadata.
import Webamp from "webamp/lazy";
import {
  toPlaylistTracks,
  isBlocked,
  blockedReason,
  detectStreamProxy,
  hasStreamProxy,
  stationForTrackUrl,
  streamFormat
} from "./radio.js";
import { createRadioLibrary } from "./radioMenu.js";
import { createPlaybackController } from "./playbackController.js";
import { createRadioMetadata } from "./radioMetadata.js";
import { createMediaSessionBridge } from "./mediaSession.js";
import { resolveArtwork } from "./artworkResolver.js";
import { favoritesStore } from "./favoritesStore.js";
import { createYouTubeSources } from "./youtube/sources.js";
import { toYouTubeTracks, isYouTubeUrl, youtubeTracks } from "./youtube/tracks.js";
import { getYouTubeEngine } from "./youtube/engine.js";
import { installYouTubeSource } from "./youtube/source.js";
import { searchMusic, fetchPlaylist } from "./lacitis/search.js";
import { noteSongPlayed } from "./lacitis/featured.js";
import { resolveStream, prefetchStream } from "./lacitis/resolver.js";
import { createVideoWindow } from "./youtube/videoWindow.js";
import { historyStore } from "./historyStore.js";
import { createEqAuto } from "./eqAuto.js";
import { installHlsSupport } from "./hls.js";
import { normalizeStations } from "./stations.js";
import { initResize } from "./resize.js";
import { installSkinMenu, readFavourites } from "./skinMenu.js";

// Classic window sizes, in Webamp's own (unscaled) pixels.
export const WINDOW_WIDTH = 275;
export const WINDOW_HEIGHT = 116;

// JSZip (npm dependency) as a lazy chunk: only skin archives need it.
let jszipLoader = null;

export function requireJSZip() {
  if (window.JSZip) {
    return Promise.resolve(window.JSZip);
  }
  if (!jszipLoader) {
    jszipLoader = import("jszip").then((mod) => mod.default ?? mod).catch((error) => {
      jszipLoader = null;
      throw error;
    });
  }
  return jszipLoader;
}

// Only needed for local files without metadata; streams never get here.
const requireMusicMetadata = () => Promise.reject(new Error("Tag reading is not bundled in the radio build"));

// Old machines: a "low spec" profile trims what costs CPU every frame.
function detectLowSpec() {
  if (window.__mkPerfProfile?.lowSpec != null) {
    return Boolean(window.__mkPerfProfile.lowSpec); // Minka's own profile
  }
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigator.deviceMemory ?? 4;
  return cores <= 2 || memory <= 2;
}

// Webamp repaints the spectrum analyser on every animation frame (an FFT plus
// a canvas paint, 60 times a second). The loop reschedules itself through
// window.requestAnimationFrame, so its callback — the only one in the page
// whose source mentions paintFrame — can be delayed by a few frames to run at
// `fps` instead, keeping the analyser visible at a third of the cost.
function throttleVisualizer(fps) {
  const original = window.requestAnimationFrame.bind(window);
  const isVisLoop = new WeakMap();
  const divider = Math.max(1, Math.round(60 / fps));

  window.requestAnimationFrame = (callback) => {
    let vis = isVisLoop.get(callback);
    if (vis === undefined) {
      vis = typeof callback === "function" && /paintFrame/.test(Function.prototype.toString.call(callback));
      isVisLoop.set(callback, vis);
    }
    if (!vis) {
      return original(callback);
    }
    let remaining = divider;
    const step = (time) => {
      remaining -= 1;
      return remaining <= 0 ? callback(time) : original(step);
    };
    return original(step);
  };
  return () => {
    window.requestAnimationFrame = original;
  };
}

function applyLowSpec(webamp, { visualizerFps }) {
  const { store } = webamp;
  const restoreRaf = throttleVisualizer(visualizerFps);
  // The title ticker re-renders every 220 ms; step it once a second instead.
  const dispatch = store.dispatch;
  let lastStep = 0;
  store.dispatch = (action) => {
    if (action?.type === "STEP_MARQUEE") {
      const now = performance.now();
      if (now - lastStep < 1000) {
        return action;
      }
      lastStep = now;
    }
    return dispatch(action);
  };
  return restoreRaf;
}

function createEmitter() {
  const listeners = new Map();
  return {
    on(event, listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(listener);
      return () => listeners.get(event)?.delete(listener);
    },
    emit(event, payload) {
      for (const listener of listeners.get(event) ?? []) {
        try {
          listener(payload);
        } catch (error) {
          console.error(error);
        }
      }
    },
    clear() {
      listeners.clear();
    }
  };
}

/**
 * @param {object} options
 * @param {HTMLElement} options.host           element Webamp renders into
 * @param {"stack"|"row"} [options.layout]     windows stacked (Winamp default) or side by side
 * @param {string|false} [options.proxy]       stream proxy base URL; default: same origin; false: none
 * @param {Array} [options.stations]           the host app's own stations (Minka or library shape)
 * @param {string} [options.stationsName]      library node name for those stations
 * @param {Array}  [options.availableSkins]    Webamp availableSkins
 * @param {string} [options.skinUrl]           initial skin
 * @param {string} [options.libraryTitle]      caption of the library window
 * @param {function} [options.getLibraryPosition]
 */
export async function createRadioPlayer(options) {
  const {
    host,
    layout = "stack",
    proxy = "auto",
    stations = [],
    stationsName = "My Stations",
    // Skin Museum browser + favourites in Webamp's Skins submenu.
    skins = true,
    // Hooks from the embed's skin surface (Modern .wal view); see skinSurface.js.
    skinFileHooks = null,
    availableSkins = readFavourites(),
    skinUrl = null,
    libraryTitle = "MEDIA LIBRARY",
    getLibraryPosition = null,
    // Element the library / skin browser windows attach to (see radioMenu.js).
    overlayHost = null,
    // Where the VIDEO window opens the first time ({width,height,overlay} -> {left,top}).
    getVideoPosition = null,
    // Built-in library nodes; the embed drops "featured" unless a catalogue is served.
    libraryNodes = ["online", "featured", "bookmarks", "history", "songs"],
    enableHotkeys = true,
    extraFilePickers = [],
    // Album artwork lookup (iTunes Search, strict match) for songs on air.
    artwork = true,
    // "auto" (Minka's profile / hardware hints), true or false.
    lowSpec = "auto",
    // Spectrum analyser frame rate in the low-spec profile (Webamp: 60).
    lowSpecVisualizerFps = 20,
    // contained: windows live inside `host` (renderInto) instead of document.body
    contained = layout === "row",
    // "Online Music" (YouTube) library node + startup playlist:
    // { apiKey, defaultPlaylistId, defaultPlaylistTitle = "WORK" }. null = off.
    // Metadata only: no YouTube player or script is loaded by this.
    youtube = null,
    // Lācītis music (search + streams, the official YouTube player when no
    // stream plays): { starter?: () => rows, api?, streams?: true }. null = off.
    lacitis = null
  } = options;

  const emitter = createEmitter();
  let hostStations = normalizeStations(stations);
  // Service nodes for the host's station groups, in Minka's tree order.
  const HOST_GROUPS = [
    { id: "latvija", name: "Latvijas radio", icon: "radio" },
    { id: "radiorecord", name: "Radio Record", icon: "radio" },
    { id: "featured", name: "Featured", icon: "star" }
  ];
  const groupOf = (station) => {
    const group = String(station.group ?? "").toLowerCase();
    return group === "record" ? "radiorecord" : group === "world" ? "featured" : group;
  };
  const youtubeSources = youtube ? createYouTubeSources(youtube) : null;
  // Lācītis' opening list: a YouTube (Music) playlist when one is set
  // ({ playlistId }), else the host's starter rows.
  let lacitisPlaylist = null;
  const lacitisStartRows = async () => {
    if (lacitis?.playlistId) {
      lacitisPlaylist ??= fetchPlaylist(lacitis.playlistId, lacitis.api ? { api: lacitis.api } : {}).catch(() => null);
      const list = await lacitisPlaylist;
      if (list?.rows?.length) return list.rows;
    }
    return (await lacitis?.starter?.()) ?? [];
  };
  const lacitisSource = lacitis
    ? {
      id: "lacitis",
      name: lacitis.name ?? "Lācītis",
      icon: "list",
      load: lacitisStartRows,
      search: (query, opts) => searchMusic(query, { ...opts, ...(lacitis.api ? { api: lacitis.api } : {}) })
    }
    : null;
  // The YouTube engine, VIDEO window and source wrapper serve both.
  const musicPlayback = Boolean(youtubeSources || lacitisSource);
  let webamp = null;
  let playback = null;
  let metadata = null;
  let session = null;
  let nowPlaying = null;

  if (proxy !== false) {
    await detectStreamProxy(proxy === "auto" ? undefined : proxy);
  }

  // Enqueue the way the original bookmark menu did: "Play" replaced the list
  // and started playback, "Enqueue" appended to what was already there.
  function play(station) {
    const normalized = normalizeStations([station])[0] ?? station;
    if (!normalized || isBlocked(normalized)) {
      emitter.emit("error", { station: normalized, reason: blockedReason(normalized ?? {}) ?? "Not playable" });
      return false;
    }
    // setTracksToPlay already starts the first track. (Webamp's setCurrentTrack
    // takes a track *id*, not an index, so it must not be used here.)
    // The store subscription below notices the new current track and runs
    // stationStarted() for it.
    webamp.setTracksToPlay(toTracks([normalized]));
    return true;
  }

  // Playlist entries for rows of either kind: stations go through the
  // stream proxy decision, YouTube rows are "youtube:<id>" (see youtube/tracks.js).
  const toTracks = (rows) => (rows[0]?.source === "youtube" ? toYouTubeTracks(rows) : toPlaylistTracks(rows));

  // Everything that follows a station starting: reconnect watch, metadata
  // polling, lock-screen info, history. Driven by the current-track change.
  function stationStarted(station) {
    nowPlaying = null;
    playback?.noteStation(station);
    metadata?.start(station);
    session?.setStation(station);
    void historyStore.recordStation(station);
    emitter.emit("station", station);
  }

  async function onNowPlaying(info) {
    // Some sources (Radio Record) hand back the cover with the title; those
    // must not be overwritten with an empty string and then looked up again.
    nowPlaying = { ...info, artwork: info.artwork || "" };
    emitter.emit("nowplaying", nowPlaying);
    library.refreshNowPlaying();
    const id = webamp.store.getState().playlist.currentTrack;
    if (id != null && stationForTrackUrl(webamp.store.getState().tracks[id]?.url)?.url === info.station.url) {
      webamp.store.dispatch({
        type: "SET_MEDIA_TAGS",
        id,
        artist: info.artist,
        title: info.title,
        album: info.station.originalTitle ?? info.station.title,
        // Sources that ship the cover with the title (Radio Record) already
        // have it here; others get a second dispatch below once the lookup ends.
        albumArtUrl: info.artwork || null,
        bitrate: info.station.bitrate ? info.station.bitrate * 1000 : undefined,
        sampleRate: undefined,
        numberOfChannels: undefined
      });
    }
    session?.setNowPlaying({ artist: info.artist, title: info.title, artwork: info.artwork || "" });
    void historyStore.recordSong({ station: info.station, artist: info.artist, title: info.title, streamTitle: info.streamTitle });
    if (artwork && !info.artwork) {
      const url = await resolveArtwork(info.artist, info.title);
      if (url && nowPlaying?.streamTitle === info.streamTitle) {
        nowPlaying = { ...nowPlaying, artwork: url };
        session?.setArtwork(url);
        emitter.emit("artwork", { ...nowPlaying });

        // The tags above went out before the lookup finished, so they carry
        // albumArtUrl: null. Push them again now that there is a cover, or the
        // player (and any skin reading media tags) keeps showing an empty one.
        const artId = webamp.store.getState().playlist.currentTrack;
        if (artId != null && stationForTrackUrl(webamp.store.getState().tracks[artId]?.url)?.url === info.station.url) {
          webamp.store.dispatch({
            type: "SET_MEDIA_TAGS",
            id: artId,
            artist: info.artist,
            title: info.title,
            album: info.station.originalTitle ?? info.station.title,
            albumArtUrl: url,
            bitrate: info.station.bitrate ? info.station.bitrate * 1000 : undefined,
            sampleRate: undefined,
            numberOfChannels: undefined
          });
        }
      }
    }
  }

  function enqueue(station) {
    const normalized = normalizeStations([station])[0] ?? station;
    if (!normalized || isBlocked(normalized)) {
      return false;
    }
    const before = webamp.store.getState().playlist.trackOrder.length;
    webamp.appendTracks(toTracks([normalized]));
    if (before === 0) {
      const id = webamp.store.getState().playlist.trackOrder[0];
      if (id != null) {
        webamp.store.dispatch({ type: "PLAY_TRACK", id });
      }
    }
    return true;
  }

  const library = createRadioLibrary({
    title: libraryTitle,
    onPlay: play,
    onEnqueue: enqueue,
    favorites: favoritesStore,
    history: historyStore,
    getNowPlaying: () => nowPlaying,
    getDefaultPosition: getLibraryPosition ?? undefined,
    overlayHost,
    nodes: libraryNodes,
    onPrefetch: (row) => {
      if (lacitis && lacitis.streams !== false && row?.source === "youtube" && row.youtubeId) prefetchStream(row.youtubeId);
    },
    // The host's stations become services under Online Services, one per
    // group (Minka: latvija, radiorecord, featured), read live so a later
    // setStations() shows up.
    sources: HOST_GROUPS.map((group) => ({
      ...group,
      getStations: () => hostStations.filter((station) => groupOf(station) === group.id)
    })),
    // Online Music: the YouTube playlists (async, cache-first loaders).
    // Lācītis search first, then the featured YouTube Music playlists
    // (lacitis.featured: [{ id, name }]), each loading its songs on demand.
    musicSources: [
      lacitisSource,
      ...(lacitis?.featured ?? []).map((list) => ({
        id: `lacitis-list-${list.id}`,
        name: list.name,
        icon: "list",
        load: async () => (await fetchPlaylist(list.id, lacitis.api ? { api: lacitis.api } : {}))?.rows ?? []
      })),
      ...(youtubeSources?.sources ?? [])
    ].filter(Boolean)
  });

  const radioPicker = {
    contextMenuName: "Internet radio (Media Library)...",
    requiresNetwork: true,
    filePicker: async () => {
      await library.show();
      // Returning nothing keeps Webamp's own playlist untouched; the library
      // enqueues through the playlist API instead.
      return [];
    }
  };

  webamp = new Webamp({
    enableHotkeys,
    requireJSZip,
    requireMusicMetadata,
    filePickers: [radioPicker, ...extraFilePickers],
    availableSkins,
    ...(skinUrl ? { initialSkin: { url: skinUrl } } : {}),
    ...(layout === "row"
      ? {
        windowLayout: {
          main: { position: { top: 0, left: 0 } },
          equalizer: { position: { top: 0, left: WINDOW_WIDTH } },
          playlist: { position: { top: 0, left: WINDOW_WIDTH * 2 }, size: { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } }
        }
      }
      : {})
  });

  if (contained) {
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    await webamp.renderInto(host);
  } else {
    await webamp.renderWhenReady(host);
  }
  metadata = createRadioMetadata({ onNowPlaying: (info) => void onNowPlaying(info) });
  installHlsSupport(webamp, { onMetadata: (bytes) => metadata.pushId3(bytes) });
  // YouTube playback: the VIDEO window (thumbnail / the one player) and the
  // source wrapper, installed after hls.js so "youtube:" urls are taken
  // before the element (and hls.js) ever see them. The player itself is
  // created on the first YouTube play, inside the window's pane.
  const youtubeEngine = musicPlayback ? getYouTubeEngine() : null;
  const videoWindow = musicPlayback
    ? createVideoWindow({
      overlayHost,
      getDefaultPosition: getVideoPosition ?? undefined,
      // Closing the window while a video plays pauses it (the player stays
      // for the next open); nothing is destroyed until dispose().
      onClose: () => {
        if (youtubeSource?.isActive() && webamp.getMediaStatus() === "PLAYING") webamp.pause();
      }
    })
    : null;
  const youtubeSource = musicPlayback
    ? installYouTubeSource(webamp, {
      engine: youtubeEngine,
      getHost: () => videoWindow.playerHost(),
      // Lācītis: a stream through Webamp's own audio first (real EQ and
      // spectrum), the official player when none answers in time.
      resolveStream: lacitisSource && lacitis.streams !== false ? resolveStream : null,
      onStreamMode: (on, detail) => emitter.emit("streammode", { on, ...detail }),
      onActive: (active) => {
        // The official player took the song: its window must be on screen.
        if (active) videoWindow.show();
        // A stream took over: the player pane goes (the player stays for
        // the next video) and the window with it.
        if (!active) {
          videoWindow.showIdle();
          videoWindow.hide();
        }
      }
    })
    : null;
  initResize(contained ? host : document.body);

  const isLowSpec = lowSpec === "auto" ? detectLowSpec() : Boolean(lowSpec);
  const restoreLowSpec = isLowSpec ? applyLowSpec(webamp, { visualizerFps: lowSpecVisualizerFps }) : null;

  session = createMediaSessionBridge({ webamp, isLive: (station) => station.live !== false });

  playback = createPlaybackController({
    webamp,
    onEvent: (event) => {
      switch (event.type) {
        case "status":
          session?.setPlaybackState(event.status);
          if (event.status === "PLAYING") {
            metadata?.start(event.station ?? playback.getStation());
          } else {
            metadata?.stop();
          }
          break;
        case "failed":
          metadata?.stop();
          emitter.emit("error", {
            station: event.station,
            reason: hasStreamProxy() ? "The stream could not be opened." : "The stream could not be opened (offline, or no CORS headers)."
          });
          break;
        default:
          break;
      }
      emitter.emit("playback", event);
    }
  });

  const eqAuto = createEqAuto({ webamp, onApplied: (preset) => emitter.emit("eqpreset", preset?.name ?? "Flat") });

  const skinMenu = skins
    ? installSkinMenu({
        webamp,
        overlayHost,
        restore: !skinUrl,
        onSkinChange: (skin) => emitter.emit("skin", { type: "classic", ...skin }),
        // The hooks are filled in by the embed after the player exists.
        onLoadSkinFile: skinFileHooks ? () => skinFileHooks.pickFile?.() : undefined,
        getSkinMode: skinFileHooks ? () => skinFileHooks.getMode?.() ?? "classic" : undefined,
        onBackToClassic: skinFileHooks ? () => skinFileHooks.showClassic?.() : undefined,
        getRecentModernSkins: skinFileHooks ? () => skinFileHooks.getRecent?.() ?? [] : undefined,
        onPickRecentModernSkin: skinFileHooks ? (label) => skinFileHooks.pickRecent?.(label) : undefined,
        onPickBuiltinModernSkin: skinFileHooks ? (skin) => skinFileHooks.pickBuiltin?.(skin) : undefined,
        getBuiltinModernSkins: skinFileHooks ? () => skinFileHooks.getBuiltin?.() ?? [] : undefined
      })
    : null;

  // Status and track events for the host page.
  let lastStatus = null;
  let lastTrackId = null;
  // YouTube / Lācītis songs: the video's picture is the cover (for a
  // "- Topic" upload it is the album art) and the search row has the clean
  // artist / title. Webamp reads a loaded stream's own tags (a YouTube
  // stream has none) and clears them, so they are put back whenever the
  // current song is without a cover.
  let lastNotedUrl = null;
  let prefetchedFor = null;
  function keepMusicTags(state) {
    const id = state.playlist.currentTrack;
    const track = id == null ? null : state.tracks[id];
    // The next song's stream is looked up while this one plays, so it
    // starts at once (Lācītis only; streams need the resolver).
    if (lacitisSource && lacitis.streams !== false && id != null && prefetchedFor !== id && state.media.status === "PLAYING") {
      prefetchedFor = id;
      const order = state.playlist.trackOrder;
      const next = state.tracks[order[order.indexOf(id) + 1]];
      if (next && isYouTubeUrl(next.url)) setTimeout(() => prefetchStream(youtubeTracks.get(next.url)?.id), 1500);
    }
    // Songs actually playing feed the featured playlists (featured.js).
    if (track && isYouTubeUrl(track.url) && state.media.status === "PLAYING" && lastNotedUrl !== track.url) {
      lastNotedUrl = track.url;
      noteSongPlayed(youtubeTracks.get(track.url)?.id);
    }
    if (!track || !isYouTubeUrl(track.url) || track.albumArtUrl) return;
    const info = youtubeTracks.get(track.url);
    if (!info?.id) return;
    const row = stationForTrackUrl(track.url);
    webamp.store.dispatch({
      type: "SET_MEDIA_TAGS",
      id,
      artist: row?.artist || track.artist || "",
      title: row?.title || track.title || "",
      album: info.channelTitle || "",
      albumArtUrl: `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
      bitrate: undefined,
      sampleRate: undefined,
      numberOfChannels: undefined
    });
  }
  const unsubscribe = webamp.store.subscribe(() => {
    const state = webamp.store.getState();
    keepMusicTags(state);
    if (state.media.status !== lastStatus) {
      lastStatus = state.media.status;
      emitter.emit("status", lastStatus);
    }
    if (state.playlist.currentTrack !== lastTrackId) {
      lastTrackId = state.playlist.currentTrack;
      const track = lastTrackId == null ? null : state.tracks[lastTrackId];
      const row = track ? stationForTrackUrl(track.url) : null;
      // A YouTube row is not a stream: no reconnect watch, no ICY polling.
      const station = row && row.source !== "youtube" ? row : null;
      if (videoWindow) {
        // The VIDEO window follows the current track: its thumbnail while
        // idle (the player pane stays while a video plays), away for streams.
        // Only the thumbnail is prepared here; the window itself opens when
        // the official player actually takes the song (onActive below), so a
        // song that plays as a stream never makes it pop up.
        if (track && isYouTubeUrl(track.url)) {
          videoWindow.showThumbnail(youtubeTracks.get(track.url)?.thumbnail ?? "", { force: state.media.status !== "PLAYING" });
        } else if (videoWindow.getMode() !== "player") {
          videoWindow.hide();
        }
      }
      // Moving to another station via the playlist (next/prev/double-click)
      // starts it the same way play() does.
      if (station && playback.getStation()?.url !== station.url) {
        stationStarted(station);
      } else if (!station) {
        playback.clearStation();
        metadata.stop();
        session.clear();
      }
      emitter.emit("track", track ? { track, station } : null);
    }
  });

  const positions = layout === "row"
    ? { main: { x: 0, y: 0 }, equalizer: { x: WINDOW_WIDTH, y: 0 }, playlist: { x: WINDOW_WIDTH * 2, y: 0 } }
    : { main: { x: 0, y: 0 }, equalizer: { x: 0, y: WINDOW_HEIGHT }, playlist: { x: 0, y: WINDOW_HEIGHT * 2 } };
  webamp.store.dispatch({ type: "UPDATE_WINDOW_POSITIONS", absolute: true, positions });

  // Lācītis: the opening list goes into an empty playlist, never playing
  // by itself.
  // lacitis.intro (a row) goes first, at once, so the host can start playing
  // before the list has arrived; the list follows it.
  if (lacitisSource) {
    const startEmpty = webamp.store.getState().playlist.trackOrder.length === 0;
    if (startEmpty && lacitis.intro) webamp.appendTracks(toYouTubeTracks([lacitis.intro]));
    lacitisStartRows()
      .then((rows) => {
        if (startEmpty && rows.length > 0) webamp.appendTracks(toYouTubeTracks(rows));
      })
      .catch((error) => console.warn("Lācītis playlist:", error));
  }

  // Startup playlist: the default YouTube playlist (WORK). From the cache when
  // there is a copy (no request at all), else fetched; not awaited, so the
  // mount never waits for YouTube. It only fills an empty playlist and never
  // starts playback.
  if (youtubeSources) {
    youtubeSources.loadDefault()
      .then((rows) => {
        if (rows.length > 0 && webamp.store.getState().playlist.trackOrder.length === 0) {
          webamp.appendTracks(toYouTubeTracks(rows));
        }
      })
      .catch((error) => console.warn("Startup playlist:", error));
  }

  return {
    webamp,
    library,
    eqAuto,
    play,
    enqueue,
    pause: () => webamp.pause(),
    resume: () => webamp.play(),
    stop: () => webamp.stop(),
    next: () => webamp.nextTrack(),
    previous: () => webamp.previousTrack(),
    setVolume: (volume) => webamp.setVolume(volume),
    setSkin: (url, name) => (skinMenu ? skinMenu.setSkin(url, name) : webamp.setSkinFromUrl(url)),
    openSkinBrowser: () => skinMenu?.openSkinBrowser(),
    skinBrowser: skinMenu?.skinBrowser ?? null,
    openLibrary: (nodeId, term) => (nodeId ? library.showNode(nodeId, term) : library.show()),
    closeLibrary: () => library.hide(),
    setStations: (rows) => {
      hostStations = normalizeStations(rows);
      library.render();
    },
    getStations: () => hostStations,
    getAnalyser: () => webamp.media.getAnalyser(),
    prefetchSong: (url) => { if (isYouTubeUrl(url)) prefetchStream(youtubeTracks.get(url)?.id ?? url.slice(8)); },
    getStatus: () => webamp.getMediaStatus(),
    getCurrentStation: () => {
      const state = webamp.store.getState();
      const track = state.playlist.currentTrack == null ? null : state.tracks[state.playlist.currentTrack];
      return track ? stationForTrackUrl(track.url) : null;
    },
    hasStreamProxy,
    isLowSpec: () => isLowSpec,
    favorites: favoritesStore,
    history: historyStore,
    // Online Music (YouTube) sources, or null when not configured.
    youtube: youtubeSources,
    lacitis: lacitisSource,
    isStreamPlayback: () => Boolean(youtubeSource?.isStream?.()),
    openVideoWindow: () => videoWindow?.show(),
    closeVideoWindow: () => videoWindow?.hide(),
    redockVideoWindow: () => videoWindow?.redock(),
    getNowPlaying: () => nowPlaying,
    reconnect: () => playback.reconnect(),
    getPlaybackState: () => playback.getState(),
    streamFormat,
    on: emitter.on,
    emit: emitter.emit,
    // Lays the windows out again: the row, or any positions (per window id,
    // relative to `offset`) the host prefers (free-window mode).
    layoutWindows: (offset = { x: 0, y: 0 }, custom = positions) => webamp.store.dispatch({
      type: "UPDATE_WINDOW_POSITIONS",
      absolute: true,
      positions: Object.fromEntries(Object.entries(custom).map(([id, p]) => [id, { x: p.x + offset.x, y: p.y + offset.y }]))
    }),
    dispose: () => {
      unsubscribe();
      youtubeSource?.uninstall();
      youtubeEngine?.destroy();
      videoWindow?.dispose();
      restoreLowSpec?.();
      skinMenu?.dispose();
      playback.dispose();
      metadata.dispose();
      session.clear();
      library.hide();
      emitter.clear();
      webamp.dispose();
    }
  };
}
