// The "Online Music" sources: what the Media Library lists under that node
// and what seeds the Webamp playlist at startup. Phase 1: one configured
// public playlist (WORK). Every loader is cache-first (cache.js) and turns
// the API's answer into rows (tracks.js); the YouTube player is never
// involved here.
//
//   const yt = createYouTubeSources({ apiKey, defaultPlaylistId, defaultPlaylistTitle: "WORK" });
//   yt.sources            // Media Library nodes: [{ id, name, icon, load() }]
//   yt.loadDefault()      // rows of the default playlist (cache / API / fallback)

import { createYouTubeApi, YouTubeApiError } from "./api.js";
import { cached, cacheKey, HOURS } from "./cache.js";
import { toYouTubeRows } from "./tracks.js";

export const PLAYLIST_TTL = 8 * HOURS;

/**
 * A playlist's rows: playlistItems.list for the entries (one page, 50), then
 * ONE videos.list for their durations / titles / playable status.
 */
export async function fetchPlaylistRows(api, playlistId, { signal } = {}) {
  const { items } = await api.playlistItems(playlistId, { max: 50, signal });
  const details = await api.videos(items.map((item) => item.videoId), { signal });
  // Playlist order, details from the batch; an entry the batch did not
  // return (removed meanwhile) is skipped.
  const videos = items.map((item) => details.get(item.videoId)).filter(Boolean);
  return toYouTubeRows(videos);
}

export function createYouTubeSources({
  apiKey = "",
  defaultPlaylistId = "",
  defaultPlaylistTitle = "WORK",
  // Rows shown when there is no key / playlist id / network and no cache:
  // a small bundled list, so the node is never empty.
  fallbackUrl = new URL("data/youtube-fallback.json", document.baseURI).href
} = {}) {
  let api = null;
  const getApi = () => {
    if (!api) api = createYouTubeApi({ apiKey });
    return api;
  };

  let fallbackRows = null;
  async function loadFallback() {
    if (fallbackRows) return fallbackRows;
    try {
      const response = await fetch(fallbackUrl, { cache: "force-cache" });
      const videos = response.ok ? await response.json() : [];
      fallbackRows = toYouTubeRows(Array.isArray(videos) ? videos : []);
    } catch {
      fallbackRows = [];
    }
    return fallbackRows;
  }

  /**
   * Rows of a playlist, cache-first. `onRefresh` is called with newer rows
   * when a stale cache entry was answered first.
   */
  async function loadPlaylist(playlistId, { onRefresh, signal } = {}) {
    if (!playlistId) return loadFallback();
    // A cached copy is used even without a key (offline, key not configured
    // in this build); only a miss needs the API.
    try {
      return await cached(cacheKey("playlist", playlistId), PLAYLIST_TTL, () => fetchPlaylistRows(getApi(), playlistId, { signal }), { onRefresh });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      console.warn("YouTube playlist unavailable:", error instanceof YouTubeApiError ? `${error.reason || error.status} ${error.message}` : error);
      return loadFallback();
    }
  }

  const loadDefault = (options) => loadPlaylist(defaultPlaylistId, options);

  const sources = [
    {
      id: `youtube-playlist-${defaultPlaylistId || "fallback"}`,
      name: defaultPlaylistTitle,
      icon: "list",
      load: (options) => loadDefault(options)
    }
  ];

  return { sources, loadDefault, loadPlaylist, isConfigured: () => Boolean(apiKey && defaultPlaylistId) };
}
