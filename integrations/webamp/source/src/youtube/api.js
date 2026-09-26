// YouTube Data API v3, called from the browser with a referrer-restricted key
// (see docs/embed-minka.md, "YouTube"). Only the calls the player needs, each
// returning small normalized objects; nothing here touches playback.
//
// Quota (per project, per day, default 10,000 units): playlistItems.list and
// videos.list cost 1 unit each; search.list also costs 1 unit but has its own
// separate default limit of about 100 calls a day, which is why search is
// never run per keystroke.

const API_BASE = "https://www.googleapis.com/youtube/v3/";
// videos.list takes at most 50 ids per call.
const BATCH = 50;

export class YouTubeApiError extends Error {
  constructor(message, { status = 0, reason = "" } = {}) {
    super(message);
    this.name = "YouTubeApiError";
    this.status = status;
    this.reason = reason;
  }
}

/** ISO 8601 duration ("PT4M13S") to whole seconds. */
export function parseDuration(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(iso ?? ""));
  if (!m) return 0;
  const [, d, h, min, s] = m.map((v) => Number(v) || 0);
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** The largest thumbnail up to ~320 px wide: enough for a list and a window. */
function pickThumbnail(thumbnails) {
  const t = thumbnails ?? {};
  return (t.medium ?? t.high ?? t.default ?? t.standard ?? t.maxres)?.url ?? "";
}

export function createYouTubeApi({ apiKey, fetchImpl = (...args) => fetch(...args) } = {}) {
  if (!apiKey) {
    throw new YouTubeApiError("YouTube API key is not configured", { reason: "noKey" });
  }

  async function request(resource, params, { signal } = {}) {
    const url = new URL(resource, API_BASE);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
    url.searchParams.set("key", apiKey);
    let response;
    try {
      response = await fetchImpl(url, { signal, cache: "no-store" });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new YouTubeApiError("YouTube is unreachable", { reason: "network" });
    }
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const reason = body?.error?.errors?.[0]?.reason ?? "";
      const message = body?.error?.message ?? `YouTube API error ${response.status}`;
      throw new YouTubeApiError(message, { status: response.status, reason });
    }
    return body ?? {};
  }

  /**
   * One page of a public playlist (up to 50 entries). Deleted / private
   * entries come back without a usable id and are dropped.
   * Returns { items: [{ videoId, title, channelTitle, thumbnail, position }], nextPageToken }.
   */
  async function playlistItems(playlistId, { max = BATCH, pageToken, signal } = {}) {
    const body = await request("playlistItems", {
      part: "snippet",
      playlistId,
      maxResults: Math.min(BATCH, max),
      pageToken
    }, { signal });
    const items = [];
    for (const item of body.items ?? []) {
      const s = item.snippet ?? {};
      const videoId = s.resourceId?.videoId;
      if (!videoId || s.title === "Deleted video" || s.title === "Private video") continue;
      items.push({
        videoId,
        title: s.title ?? "",
        // The uploader of the video, not the playlist owner.
        channelTitle: s.videoOwnerChannelTitle ?? s.channelTitle ?? "",
        thumbnail: pickThumbnail(s.thumbnails),
        position: s.position ?? items.length
      });
    }
    return { items, nextPageToken: body.nextPageToken ?? null };
  }

  /**
   * Details for a list of video ids in as few calls as possible (50 per
   * call): duration, proper title, channel, thumbnail, embeddable/playable.
   * Returns a Map id -> { id, title, channelTitle, duration, thumbnail, embeddable, playable }.
   */
  async function videos(ids, { signal } = {}) {
    const out = new Map();
    const unique = [...new Set(ids.filter(Boolean))];
    for (let i = 0; i < unique.length; i += BATCH) {
      const chunk = unique.slice(i, i + BATCH);
      const body = await request("videos", {
        part: "snippet,contentDetails,status",
        id: chunk.join(","),
        maxResults: BATCH
      }, { signal });
      for (const item of body.items ?? []) {
        const s = item.snippet ?? {};
        const st = item.status ?? {};
        out.set(item.id, {
          id: item.id,
          title: s.title ?? "",
          channelTitle: s.channelTitle ?? "",
          duration: parseDuration(item.contentDetails?.duration),
          thumbnail: pickThumbnail(s.thumbnails),
          embeddable: st.embeddable !== false,
          playable: st.privacyStatus !== "private" && st.uploadStatus !== "rejected" && st.uploadStatus !== "failed"
        });
      }
    }
    return out;
  }

  return { request, playlistItems, videos };
}
