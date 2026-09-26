# Embedding the Webamp radio in Minka (bottom dock)

Everything needed to put the player into Minka's bottom bar is built into
`dist-embed/`:

```bash
npm run build:embed
# dist-embed/webamp-radio.js      ES module: import { mountMinkaRadio, mountWebampRadio }
# dist-embed/webamp-radio.css     the player's styles
# dist-embed/chunks/*.js          lazy chunks (loaded on first use, see below)
# dist-embed/modern/assets/       webamp-modern runtime assets (Wasabi XUI fallbacks)
# dist-embed/skins/modern/        the built-in Modern skins (~1.8 MB)
# dist-embed/data/minka/          the station catalogue as served by this repo's page
#                                 (Minka has its own; only for a stand-alone page)
# dist-embed/precache.json        every file above, relative paths — feed it to sw.js
```

Copy the whole folder into Minka (for example `vendor/webamp-radio/`) and
pass its location as `assetsBase` when it is not next to the page. Nothing
comes from a CDN: Webamp, the Media Library, EQ AUTO, the Skin Museum browser
and the Minka bridge are in `webamp-radio.js` (~800 KB, 240 KB gzipped); the
rest is split into chunks that load the first time they are needed:

| chunk | when | size (gzip) |
|---|---|---|
| `hls-*.js` | first HLS (`.m3u8`) station (skipped when `window.Hls` exists) | 133 KB |
| `jszip.min-*.js` | first skin archive (`.wsz` / `.wal`) | 32 KB |
| `modernSkin`, `SkinEngine_WAL`, `WebampModern`, `GammaGroup-*.js` | first Modern skin (the webamp-modern engine) | 130 KB |
| `butterchurn-*.js`, `butterchurn-presets-*.js` | a Modern skin's AVS visualiser starts painting | 180 KB |

Tags of local files are not read (radio tracks carry their own titles).
The IIFE build is gone: a plain `<script>` cannot carry lazy chunks. Minka
loads the ES module with `<script type="module">`.

## Old computers

Besides `lowSpec`, the player never watches the host page's DOM: the only
observers are on Webamp's own node and on Webamp's context-menu root, so
Minka's clocks and animations cost the player nothing. Hotkeys are off in
the embed. Everything else that runs continuously is Webamp's own time
display (4 updates/s while playing) and a 700 ms status poll.

## Mount

The Minka bridge (`src/minka.js`) mounts the player and wires it to what
Minka already has, so nothing else in Minka changes:

```html
<link rel="stylesheet" href="vendor/webamp-radio/webamp-radio.css">
<div id="radioWindow"></div>
<script type="module">
  import { mountMinkaRadio } from "./vendor/webamp-radio/webamp-radio.js";
  const radio = await mountMinkaRadio(document.querySelector("#radioWindow"), {
    assetsBase: "./vendor/webamp-radio/",       // where dist-embed/ was copied
    proxy: "https://<your-worker>.workers.dev"  // optional, see below
  });
  window.webampRadio = radio;
</script>
```

What the bridge does (each part can be switched off with an option):

| Minka side | bridge | option |
|---|---|---|
| `stationsList` (a top-level `let` in radio.js, so read as a global binding) and the `rg-stations-ready` window event | `radio.setStations()` now and after every catalogue change | `syncStations` |
| `window.__mkUnifiedMedia` profile: `getRadio().favorites` (station keys, in order), `change({type:"favorite-add"|"favorite-remove", id})`, the `media-profile-change` document event | two-way favorites: while a profile is loaded its list replaces the Media Library's Bookmarks (same order), a star toggled in the library is sent back as a profile operation; logged out, Bookmarks stay local (like Minka's own star) | `syncFavorites` |
| `radioStationKey(s)` = `catalogKey \|\| ("lv:"\|"record:") + title` (lower-cased, lv-LV) | every station carries it as `hostKey`; Radio Browser stations map to `rb:<uuid>` as in Minka's world catalogue | — |
| `rg-now-playing-art` document event `{artist, title, coverUrl}` | dispatched from the player's `nowplaying` / `artwork` events (plus `stationKey`) for the day-book, accent colour and Pioneer panels | `emitNowPlaying` |
| `window.rgStations` `{ list(), play(key), startInitial(), startFavorite(keys) }` | replaced by versions that play through Webamp, so the station picker, deep links and the profile's favourite start use the one player; the previous object's other members are kept | `takeOverRgStations` |

One player: Minka's own `audio` in radio.js must not be started while the
bar is mounted (`selectStation()` there both plays and updates Minka's own
panels; call `radio.play(row)` / `window.rgStations.play(key)` instead and
let the events above drive the panels). MediaSession is owned by the player.

`mountMinkaRadio` returns the player API below plus `playKey(key)`,
`stationKey(station)` and `syncFavorites()`. `mountWebampRadio` is the same
mount without the Minka wiring (this repo's page uses it with the exported
catalogue).

`#radioWindow` in Minka has `will-change: transform` and `contain: layout`,
which would trap fixed-position children inside the bar; the library, the
skin browser and Webamp's context menu are therefore kept at `document.body`
level (a second element with `id="webamp"`, on purpose, so the skin CSS
paints them) and raised with `overlayZIndex`. Minka's global button/input
styles are reset inside those windows.

The container is the dock. Give it the height it has today
(`clamp(142px, 21vh, 170px)` fits the 116 px row at 1×); the player centres
itself and re-fits on resize. For a 2× player the bar needs to be at least
232 px tall (`scale: 2`, or `"auto"` picks the largest whole multiple that
fits — whole multiples only, since the skins are pixel art and anything in
between goes blurry). In Modern mode the bar may grow (never below its own
CSS height) up to `barHeight.max` — default `70vh` — for a skin taller than
the bar (Bento with its Media Library panel open) and shrinks back when the
skin collapses; `{ max: null }` forbids growing.

### Options

| option | default | |
|---|---|---|
| `stations` | `[]` | Minka rows `{ title, group, url / hls / stream_128 ... }` or library rows `{ title, url, genre, tags, bitrate }`. Separators are skipped. |
| `stationsName` | `"My Stations"` | Name of the library node that lists them. |
| `proxy` | `"auto"` | Base URL of the stream proxy. `"auto"` = same origin, `false` = none. |
| `scale` | `"auto"` | `"auto"`, `"fit"` or a number. |
| `maxScale` | `2` | Cap for `"auto"`. |
| `align` | `"center"` | `"left"`, `"center"`, `"right"` inside the container. |
| `lockWindows` | `true` | Keep the three windows in their row (title-bar dragging is swallowed). |
| `skins` | `true` | Skin Museum browser + favourites in Webamp's Skins submenu. Last skin is remembered. |
| `skinUrl` | — | Start with this `.wsz`. |
| `libraryNodes` | `["online","bookmarks","history"]` | Built-in library nodes. |
| `libraryTitle` | `"MEDIA LIBRARY"` | Caption of the library window. |
| `enableHotkeys` | `false` | Webamp's global keyboard shortcuts (off, so they do not fight the host app). |
| `lowSpec` | `"auto"` | Low-spec profile for old machines: the spectrum analyser stays on but repaints at `lowSpecVisualizerFps` (20) instead of 60, and the title ticker steps once a second instead of every 220 ms. `"auto"` follows Minka's `window.__mkPerfProfile.lowSpec`, else ≤2 cores / ≤2 GB. |
| `lowSpecVisualizerFps` | `20` | Analyser frame rate under `lowSpec`. |
| `overlayZIndex` | `10000` | z-index of the library, skin browser and Webamp's context menu. Raise it above any host popup that should not cover them (Minka's onboarding tour uses 70000). |
| `assetsBase` | the page | URL or path of the copied `dist-embed/` folder: `skins/modern/` and `modern/assets/` are resolved against it. |
| `switchButton` | `true` | The MODERN / CLASSIC button on the bar. |
| `barHeight` | `{ max: "70vh" }` | How far the bar may grow for a tall Modern skin (`"300px"`, a number, or `{ max: null }`). |
| `modernPrivateDefaults` | — | Extra initial private config for Modern skin scripts, `{ "<skin name>": { item: value } }` (see `src/builtinSkins.js`: Bento opens collapsed). |
| `restoreSkin` | `true` | Restore the last skin mode / Modern skin on mount. |
| `youtube` | `null` | Online Music: `{ apiKey, defaultPlaylistId, defaultPlaylistTitle: "WORK" }`. See **YouTube** below. |


### Minka's stations in the Media Library

`mountWebampRadio(el, { stations: window.stationsList })` is enough: rows keep
Minka's shape and are grouped by `group` into **Online Services ▸ Latvijas
radio / Radio Record / Featured** (ids `latvija`, `radiorecord`, `featured`;
`record` and `world` map onto the last two). `radio.setStations(rows)` after
`rg-stations-ready` refreshes the tree. The Radio Browser directory (the
"56k" world catalogue) is the **Online Services** node itself, with the genre
tree. Bookmarks and History are Winamp's plain two-pane lists.

Outside Minka (this repo's demo page) the same catalogue is served from
`public/data/minka/` — exported from Minka's `data/` and `js/radio.js` by
`src/minkaStations.js`' loader, with the Radio Record channels refreshed from
Minka's worker (320 kbps streams, channel artwork).


### Classic / Modern switch and the built-in Winamp 5 skins

The dock carries a small Winamp-style button in its top-right corner:
**MODERN** while the classic skin shows, **CLASSIC** while a Modern skin shows
(right-click opens the Skins menu). `switchButton: false` hides it;
`radio.toggleSkinMode()` does the same from your own UI.

The first press loads **Winamp Modern**; the Skins menu also lists **Bento**,
**Big Bento** and **Nokia Edition** — the skins from the Winamp source tree,
packed by `tools/pack-winamp-skins.sh` into `public/skins/modern/`
(`dist-embed/skins/modern/` in the library build, ~1.8 MB, served from
`assetsBase` together with `modern/assets/`).
`radio.setBuiltinModernSkin("bento")` / `radio.getBuiltinModernSkins()`
select them from code. Bento and Big Bento open collapsed (player only,
130 px); their expand button opens the lower panel with the Media Library
and the bar grows for it. The skin remembers the state like Winamp does
(private config in `localStorage` `_PRIVATE-CONFIG_`).

Note: those skins come from the Winamp source release (Llama Group's
Winamp Collaborative License); shipping them is your call as the publisher.

### API

```js
radio.play(station);        // Minka row or library row; replaces the playlist and starts
radio.enqueue(station);
radio.pause(); radio.resume(); radio.stop(); radio.next(); radio.previous();
radio.setVolume(0..100);
radio.openLibrary(); radio.closeLibrary();
radio.openSkinBrowser(); radio.setSkin(url, name);

// Skins of either kind, same player underneath. A .wsz restyles the classic
// player; a .wal (Winamp 3/5, XML + MAKI) is drawn by webamp-modern in the
// same bar, over the hidden classic row. Playlist, EQ, radio library,
// favourites, history and MediaSession are shared; the Modern skin's own
// library / open / menu buttons open the classic player's ones.
radio.setSkin(fileOrBlobOrUrl);   // detects the kind from the archive; resolves "classic" | "modern"
radio.pickSkinFile();             // file picker (.wsz / .wal)
radio.toggleSkinMode();           // classic <-> last Modern skin (asks for a .wal when none is stored)
radio.showClassicSkin();
radio.getSkinMode();              // "classic" | "modern"
radio.on("skin", ({ type, name }) => ...);    // type: "classic" | "modern"
radio.on("layout", ({ mode, width, height, scale }) => ...);
// The chosen .wal is kept in IndexedDB ("webamp-radio-skins") and restored on
// the next mount (restoreSkin: false to skip). The same entries are in the
// right-click menu under Skins: "Load skin file (.wsz / .wal)..." and
// "Back to classic skin". Nothing is bundled: the .wal is always the user's file.
radio.setStations(rows);    // replace the host list (e.g. after rg-stations-ready fires again)
radio.getCurrentStation(); radio.getStatus();   // "PLAYING" | "PAUSED" | "STOPPED"
radio.getAnalyser();        // Web Audio AnalyserNode for your own visualiser / ambilight
radio.refit(); radio.dispose();
radio.webamp;               // the Webamp instance, for anything else

radio.favorites;            // favoritesStore: list/add/remove/toggle/rename/move/subscribe
radio.history;              // historyStore (IndexedDB): listStations/listSongs/clear/subscribe
radio.getNowPlaying();      // { station, streamTitle, artist, title, artwork, source }
radio.reconnect();          // reload the current stream at the live edge

radio.on("station", station => ...);                       // a station was started
radio.on("nowplaying", ({ station, artist, title, streamTitle }) => ...); // ICY title (via proxy)
radio.on("status", status => ...);
radio.on("track", ({ track, station }) => ...);
radio.on("eqpreset", name => ...);                         // EQ AUTO applied a preset
radio.on("skin", ({ url, name }) => ...);
radio.on("artwork", ({ artwork, artist, title }) => ...);  // album art resolved for the song
radio.on("playback", ({ type, ... }) => ...);               // reconnecting / recovered / stalled / failed / waiting-for-network
radio.on("error", ({ station, reason }) => ...);
```

### Modules behind the player

| module | role |
|---|---|
| `playbackController.js` | one authoritative playback state on Webamp's own `<audio>`: retry with backoff on error/drop, stall detection, reload on wake / online / play-after-stop / resume after a long pause (live edge), fallback along `station.urls` |
| `radioMetadata.js` | "now playing": proxy `/stream-title`, direct ICY probe (CORS stations), HLS timed ID3 via hls.js; polls only while playing (10 s visible, 20 s hidden) |
| `mediaSession.js` | lock-screen metadata (song + station + artwork), play/pause/stop, no seek for live streams |
| `artworkResolver.js` | iTunes Search with strict artist+title match, cached (also misses), rate-limited |
| `historyStore.js` | IndexedDB: recently played stations, recently heard songs |
| `favoritesStore.js` | ordered favourites with rename / move, localStorage |
| `radioBrowser.js` | Radio Browser directory: search, tags (SHOUTcast genre tree), countries, languages, order |

## YouTube (Online Music)

`youtube: { apiKey, defaultPlaylistId, defaultPlaylistTitle }` adds an
**Online Music** node to the Media Library with the configured public
playlist (WORK) and puts that playlist into the Webamp playlist at startup.
Phase 1 is metadata only: rows come from the YouTube Data API v3
(`playlistItems.list`, one page of 50, then ONE `videos.list` for all
durations / titles / playable flags), normalized to the player's row shape
(`url: "youtube:<VIDEO_ID>"`, `source: "youtube"`) and cached in
`localStorage` (`webamp.yt.v1:playlist:<id>`, 8 h, cache-first: a stale copy
is shown at once and refreshed in the background). Without a key or id, or
when the API fails and nothing is cached, `data/youtube-fallback.json`
(bundled, six well-known videos) is shown instead — the node is never empty
and the mount never waits for YouTube. No YouTube script, iframe or player
exists until a track is actually played (phase 2).

**The API key is not a secret** — it travels in every request. Security is
the restriction set on it in Google Cloud:

```text
Application restriction: HTTP referrers
    your-domain.example/*
    *.your-domain.example/*
API restriction:         YouTube Data API v3 only
```

Quota (default 10,000 units/day per project): `playlistItems.list` and
`videos.list` cost 1 unit each, so a playlist is 2 units per cache miss.
`search.list` also costs 1 unit per call, but has its own default limit of
about 100 searches per day — which is why search (phase 3) runs only on
Enter / SEARCH, never per keystroke, and is cached by query + type.

This repo's page reads the key from `.env.local`
(`VITE_YOUTUBE_API_KEY`, `VITE_YOUTUBE_DEFAULT_PLAYLIST_ID`; see
`.env.example`). Minka passes its own values in the `youtube` option.

## Streams, CORS and the proxy

Webamp's audio element is `crossOrigin="anonymous"`, so a stream has to send
`Access-Control-Allow-Origin` or the browser refuses it. Minka's curated
stations already do (Radio Record, relaxfm.lv, ...); anything from the
Internet Radio directory mostly does not. Two ways around it:

- **Node / Vite** (`server/streamProxy.js`): `streamProxyMiddleware` is a
  plain `(req, res, next)` middleware for Express/Connect, and `streamProxy()`
  a Vite plugin. It also understands SHOUTcast v1 `ICY 200 OK` servers, plays
  `http://` stations on an `https://` page and serves the current ICY title at
  `/stream-title`.
- **Cloudflare Worker** (`cloudflare/stream-proxy-worker.js`): the same
  endpoints for a static host such as Minka. Deploy with `wrangler deploy` and
  pass its URL as `proxy`. Workers cannot remember state between requests, so
  `/stream-title` reads the first ICY block of a fresh connection (~16–32 KB)
  each time it is polled; the player polls every 8 s while playing.

HLS stations never go through the proxy: hls.js fetches the segments itself,
so the HLS host needs CORS (Radio Record has it).

## What Minka gets

- The three classic windows in a row inside `#radioWindow`, skinnable from the
  Skin Museum (102k skins) — the last skin persists in `localStorage`.
- Media Library window opening above the dock: Minka's own stations first,
  then the Internet Radio directory (SHOUTcast genre tree over Radio Browser),
  Bookmarks and History.
- EQ AUTO picking a Winamp preset from the station's genre.
- Events for the Pioneer display / ambilight: `nowplaying`, `status`,
  `getAnalyser()`.

Nothing in the bundle touches `document.body` styles, the service worker or
the URL hash; `localStorage` keys are prefixed `webamp.`.

Tested by mounting the (then IIFE) build into a local copy of Minka's
`index.html` (unmodified): the row fits the 170 px bar at 1×, the library
opens above the bar, a station plays through the proxy, and the current
Pioneer panels simply sit on top of the Webamp row until they are removed
from `#radioWindow`. The Minka bridge itself was written against Minka's
`js/radio.js` / `js/media-profile.js` as of September 2026 and exercised on
this repo's page (no Minka globals: every part of it is a no-op then); the
first run inside Minka should check the favorites round trip with a logged-in
profile.

### Service worker

`dist-embed/precache.json` lists every file of the build (chunks, skins,
engine assets, catalogue) with paths relative to the folder. Add them to
Minka's `sw.js` precache under the folder they were copied to, e.g.

```js
const WEBAMP = "./vendor/webamp-radio/";
const webampFiles = (await (await fetch(WEBAMP + "precache.json")).json()).map((p) => WEBAMP + p);
```

The skins and chunks carry content hashes in their names (chunks) or change
only with a rebuild (skins), so a plain cache-first rule for that folder is
safe. Streams and the station artwork are never cached.
