// The one YouTube player. Nothing YouTube (script, iframe) exists until the
// first real playback; from then on the same YT.Player is reused for every
// track (loadVideoById) until dispose(). Only the current track is ever
// loaded or cued: no pre-cueing of a playlist.
//
// The engine knows nothing about Webamp; youtube/source.js maps it onto the
// ElementSource semantics Webamp's Media expects.

const IFRAME_API = "https://www.youtube.com/iframe_api";
// Minimum real player viewport (a smaller iframe is not a playable embed).
export const MIN_PLAYER_SIZE = 200;

// YT.PlayerState values, spelled out so the source never sees numbers.
const STATE = { "-1": "unstarted", 0: "ended", 1: "playing", 2: "paused", 3: "buffering", 5: "cued" };

let apiLoader = null;
function loadIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiLoader) {
    apiLoader = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = IFRAME_API;
      script.async = true;
      script.onerror = () => {
        apiLoader = null;
        script.remove();
        reject(new Error("YouTube player script could not be loaded"));
      };
      document.head.append(script);
    });
  }
  return apiLoader;
}

let singleton = null;

/** The application-wide engine (created on first use, not at import). */
export function getYouTubeEngine() {
  if (!singleton) singleton = createYouTubeEngine();
  return singleton;
}

export function createYouTubeEngine() {
  let player = null;        // YT.Player
  let ready = null;         // Promise<YT.Player> while creating / once created
  let element = null;       // the div YT.Player replaces with its iframe
  let currentId = null;     // video loaded or cued in the player
  let state = "idle";       // "idle" | STATE values
  let volume = 100;
  const listeners = new Set();

  const emit = (event, detail) => {
    for (const listener of listeners) {
      try {
        listener(event, detail);
      } catch (error) {
        console.error(error);
      }
    }
  };

  /**
   * Creates the player inside `host` on first use (loads the IFrame API
   * once). Resolves with the YT.Player once it is ready.
   */
  function ensurePlayer(host) {
    if (ready) return ready;
    ready = (async () => {
      const YT = await loadIframeApi();
      element = document.createElement("div");
      host.replaceChildren(element);
      await new Promise((resolve) => {
        player = new YT.Player(element, {
          width: "100%",
          height: "100%",
          playerVars: {
            // Webamp is the transport: no YouTube controls, keyboard or
            // related videos; inline on phones.
            controls: 0,
            disablekb: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              player.setVolume(volume);
              resolve();
              emit("ready");
            },
            onStateChange: (event) => {
              state = STATE[event.data] ?? "idle";
              emit("state", state);
            },
            onError: (event) => {
              // 100/101/150: unavailable or not embeddable; 2/5: bad id /
              // HTML5 error. The track cannot play: report it like an end.
              emit("error", event.data);
            }
          }
        });
      });
      return player;
    })();
    ready.catch(() => {
      ready = null;
    });
    return ready;
  }

  const iframe = () => player?.getIframe?.() ?? null;

  return {
    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hasPlayer: () => Boolean(player),
    getState: () => state,
    getCurrentId: () => currentId,
    ensurePlayer,
    getIframe: iframe,

    /**
     * Makes `id` the player's video. autoplay: loadVideoById (starts the
     * stream); otherwise cueVideoById (metadata only, no stream until play).
     * Requires the player (see ensurePlayer).
     */
    async load(id, { autoplay = false, host } = {}) {
      await ensurePlayer(host);
      currentId = id;
      if (autoplay) player.loadVideoById(id);
      else player.cueVideoById(id);
    },
    play() {
      player?.playVideo();
    },
    pause() {
      player?.pauseVideo();
    },
    /** Pause and rewind; the player and its video stay for a later play. */
    stop() {
      if (!player) return;
      player.pauseVideo();
      try {
        player.seekTo(0, true);
      } catch {
        // no video loaded
      }
    },
    seekTo(seconds) {
      player?.seekTo(Math.max(0, seconds), true);
    },
    getCurrentTime: () => (player?.getCurrentTime ? player.getCurrentTime() || 0 : 0),
    getDuration: () => (player?.getDuration ? player.getDuration() || 0 : 0),
    setVolume(value) {
      volume = Math.max(0, Math.min(100, Math.round(value)));
      player?.setVolume?.(volume);
    },
    getVolume: () => volume,

    /** Tears the player and its iframe down; the API script stays loaded. */
    destroy() {
      try {
        player?.destroy();
      } catch {
        // already gone
      }
      element?.remove();
      player = null;
      ready = null;
      element = null;
      currentId = null;
      state = "idle";
      listeners.clear();
      if (singleton === this) singleton = null;
    }
  };
}
