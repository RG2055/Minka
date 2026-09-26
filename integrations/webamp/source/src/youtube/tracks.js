// YouTube videos as the player already knows things: a *row* is what the
// Media Library lists (the station shape, so selection, Play/Enqueue, the
// bookmark star and History need no second code path), a *track* is the
// Webamp playlist entry. Both carry the same identity, "youtube:<VIDEO_ID>",
// which is the track url Webamp stores and the key everything maps back by.
//
// Nothing here loads a player: a row is metadata and a thumbnail url.

import { registerTrackStation } from "../radio.js";

/** url -> { id, thumbnail, channelTitle, duration }, for the current-track lookups. */
export const youtubeTracks = new Map();

export const YOUTUBE_URL_PREFIX = "youtube:";
export const isYouTubeUrl = (url) => typeof url === "string" && url.startsWith(YOUTUBE_URL_PREFIX);
export const youtubeIdFromUrl = (url) => (isYouTubeUrl(url) ? url.slice(YOUTUBE_URL_PREFIX.length) : "");

const NOISE = /\s*[([](?:official\s*(?:music\s*)?(?:video|audio|visuali[sz]er|lyric\s*video)|lyrics?|hd|hq|4k|audio|visuali[sz]er|explicit|clean|out now|remaster(?:ed)?(?:\s*\d{4})?)[)\]]\s*/gi;
const TOPIC = /\s*-\s*topic$|vevo$/i;

/**
 * "Artist - Title (Official Video)" -> { artist: "Artist", title: "Title" }.
 * Without a separator the channel is the artist (YouTube Music's
 * "<Artist> - Topic" channels give the plain artist name).
 */
export function splitArtistTitle(fullTitle, channelTitle = "") {
  const clean = String(fullTitle ?? "").replace(NOISE, " ").replace(/\s{2,}/g, " ").trim();
  const m = /^(.+?)\s+[-–—]\s+(.+)$/.exec(clean);
  if (m) {
    return { artist: m[1].trim(), title: m[2].trim() };
  }
  return { artist: String(channelTitle ?? "").replace(TOPIC, "").trim(), title: clean };
}

/**
 * Normalized video details (from api.videos / playlistItems merged) to
 * Media Library rows. Order is kept; unplayable or non-embeddable videos are
 * dropped, since nothing could play them later.
 */
export function toYouTubeRows(videos) {
  const rows = [];
  for (const v of videos) {
    if (!v?.id || v.playable === false || v.embeddable === false) continue;
    const { artist, title } = splitArtistTitle(v.title, v.channelTitle);
    const url = `${YOUTUBE_URL_PREFIX}${v.id}`;
    rows.push({
      source: "youtube",
      url,
      youtubeId: v.id,
      title,
      artist,
      originalTitle: v.title,
      // The library's Genre column and tooltip read tags; the channel is the
      // nearest thing a video has.
      genre: v.channelTitle || "",
      tags: v.channelTitle ? [v.channelTitle] : [],
      codec: "YouTube",
      bitrate: 0,
      duration: v.duration || 0,
      favicon: v.thumbnail || "",
      logo: v.thumbnail || "",
      homepage: `https://www.youtube.com/watch?v=${v.id}`,
      // Not a stream: never subject to the mixed-content check.
      https: true
    });
  }
  return rows;
}

/**
 * Rows to Webamp playlist tracks. `duration` and `metaData` are given, so
 * Webamp neither probes the url for a length nor reads tags: adding a
 * hundred tracks costs no request.
 */
export function toYouTubeTracks(rows) {
  return rows.map((row) => {
    youtubeTracks.set(row.url, { id: row.youtubeId, thumbnail: row.favicon, channelTitle: row.genre, duration: row.duration });
    registerTrackStation(row.url, row);
    return {
      url: row.url,
      defaultName: row.artist ? `${row.artist} - ${row.title}` : row.title,
      metaData: { artist: row.artist, title: row.title },
      duration: row.duration
    };
  });
}
