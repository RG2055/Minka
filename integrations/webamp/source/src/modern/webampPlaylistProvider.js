// The classic Webamp playlist, exposed to webamp-modern's playlist editor
// (PlaylistProvider in skin/makiClasses/PlayList.ts). Read-through: titles,
// lengths and the current index come straight from Webamp's store, and
// playing a row dispatches Webamp's own PLAY_TRACK.

import { stationForTrackUrl } from "../radio.js";

function formatLength(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return ""; // live stream / unknown
  }
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function trackTitle(track) {
  if (!track) return "";
  if (track.title) {
    return track.artist ? `${track.artist} - ${track.title}` : track.title;
  }
  const station = stationForTrackUrl(track.url);
  return station?.title ?? track.defaultName ?? "";
}

export function createWebampPlaylistProvider(webamp) {
  const store = webamp.store;
  const listeners = new Set();
  let lastOrder = null;
  let lastCurrent = null;
  let lastTracks = null;

  const tracksInOrder = () => {
    const { playlist, tracks } = store.getState();
    return playlist.trackOrder.map((id) => tracks[id]).filter(Boolean);
  };

  const unsubscribe = store.subscribe(() => {
    const { playlist, tracks } = store.getState();
    if (playlist.trackOrder !== lastOrder || playlist.currentTrack !== lastCurrent || tracks !== lastTracks) {
      lastOrder = playlist.trackOrder;
      lastCurrent = playlist.currentTrack;
      lastTracks = tracks;
      for (const listener of listeners) {
        try {
          listener();
        } catch (error) {
          console.error(error);
        }
      }
    }
  });

  return {
    getNumTracks: () => store.getState().playlist.trackOrder.length,
    getCurrentIndex: () => {
      const { playlist } = store.getState();
      return playlist.currentTrack == null ? -1 : playlist.trackOrder.indexOf(playlist.currentTrack);
    },
    getTitle: (index) => trackTitle(tracksInOrder()[index]),
    getLength: (index) => formatLength(tracksInOrder()[index]?.duration),
    playTrack: (index) => {
      const id = store.getState().playlist.trackOrder[index];
      if (id != null) {
        store.dispatch({ type: "PLAY_TRACK", id });
      }
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => unsubscribe()
  };
}
