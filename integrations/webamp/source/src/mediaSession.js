// Lock-screen / OS media controls for radio.
//
// Webamp registers its own MediaSession handlers, including seek forward /
// backward, and only refreshes the metadata when the track changes. For a
// live stream that is wrong on both counts: there is nothing to seek, and the
// interesting metadata (the song) changes while the track stays the same.
// This module owns the session while a station plays: station + song +
// artwork, play / pause / stop, no seeking, and no position state so the OS
// never draws a progress bar for a stream.

export function createMediaSessionBridge({ webamp, isLive }) {
  const session = "mediaSession" in navigator ? navigator.mediaSession : null;
  let current = { station: null, artist: "", title: "", artwork: "", logo: "" };

  function setHandler(name, handler) {
    if (!session) return;
    try {
      session.setActionHandler(name, handler);
    } catch {
      // Unsupported action on this platform.
    }
  }

  function apply() {
    if (!session) return;
    const { station, artist, title, artwork, logo } = current;
    const art = [];
    if (artwork) art.push({ src: artwork, sizes: "600x600", type: "image/jpeg" });
    if (logo) art.push({ src: logo, sizes: "128x128" });
    try {
      session.metadata = new MediaMetadata({
        title: title || station?.title || "",
        artist: artist || (title ? station?.title ?? "" : ""),
        album: station?.title ?? "",
        artwork: art
      });
    } catch {}
    const live = station ? isLive(station) : false;
    setHandler("play", () => webamp.play());
    setHandler("pause", () => webamp.pause());
    setHandler("stop", () => webamp.stop());
    // Live: no seeking, no "previous/next" unless the playlist has more rows.
    const tracks = webamp.getPlaylistTracks().length;
    setHandler("seekbackward", live ? null : () => webamp.seekBackward(10));
    setHandler("seekforward", live ? null : () => webamp.seekForward(10));
    setHandler("seekto", null);
    setHandler("previoustrack", tracks > 1 ? () => webamp.previousTrack() : null);
    setHandler("nexttrack", tracks > 1 ? () => webamp.nextTrack() : null);
    if (live && "setPositionState" in session) {
      try {
        session.setPositionState();
      } catch {}
    }
  }

  function setPlaybackState(status) {
    if (!session) return;
    session.playbackState = status === "PLAYING" ? "playing" : status === "PAUSED" ? "paused" : "none";
  }

  return {
    /** A station was started. */
    setStation(station) {
      current = { station, artist: "", title: "", artwork: "", logo: station?.favicon || station?.logo || "" };
      apply();
    },
    /** The song changed on the current station. */
    setNowPlaying({ artist, title, artwork }) {
      current = { ...current, artist: artist ?? "", title: title ?? "", artwork: artwork ?? current.artwork };
      apply();
    },
    setArtwork(url) {
      current = { ...current, artwork: url ?? "" };
      apply();
    },
    setPlaybackState,
    clear() {
      current = { station: null, artist: "", title: "", artwork: "", logo: "" };
      if (session) {
        session.metadata = null;
        session.playbackState = "none";
      }
    }
  };
}
