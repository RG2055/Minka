# Webamp PWA

The real [Webamp](https://github.com/captbaritone/webamp) (Winamp 2.9 in the
browser) as an installable PWA, with internet radio and the Winamp Skin Museum.

## Features

- Full Webamp player: main window, equalizer, playlist, MilkDrop
- **Drag-to-resize** the playlist and MilkDrop windows by their corner grip
- Local files and folders through Webamp's own menus
- **Media Library / Internet Radio**: the Winamp 5 SHOUTcast directory view —
  navigation tree, the full SHOUTcast genre tree, a sortable station table
  (Name, Genre, Genre2, Genre3, Country, Bitrate, Format), search, bitrate /
  format / country filters, bookmarks, history, multi-select, right-click menu
- **History** (IndexedDB): recently played stations and recently heard songs;
  **Favorites** with rename and reorder
- **Robust streams**: reconnect with backoff, stall detection, live edge after
  pause/stop/wake, fallback stream addresses; **MediaSession** with song,
  station and album art; ICY / HLS-ID3 "now playing"
- **Stream proxy** on the dev/preview server so any station plays (CORS, plain
  http://) and the ICY "now playing" title shows in the player
- **EQ AUTO** picks a Winamp preset from the station's genre
- **Skin Museum browser**: browse and apply any of ~102,000 classic skins
- **Webamp Modern mode**: render Winamp 3/5 skins (XML + MAKI), which the classic
  engine cannot read at all
- Works offline (service worker); install as an app

## Run

```bash
npm install
npm run dev      # dev server on the network
npm run build    # production build into dist/
npm run serve    # preview the build on 0.0.0.0:4173
```

The tools live in the player's own context menu (right-click the main window):

- **Play → Internet radio (Media Library)...** (or `window.webampRadio.show()`)
- **Skins → Browse Skin Museum...**
- **Skins → Winamp Modern / Bento / Big Bento / Nokia Edition** and the **MODERN / CLASSIC** button on the bar

## Internet radio

The library window (right-click the player → *Internet radio (Media
Library)...*) follows Winamp 5's SHOUTcast directory view: pick a node on the
left (**Internet Radio** searches the Radio Browser community database with
the SHOUTcast genre tree, **Featured Stations** is the bundled `data/radio.json`,
plus **Bookmarks** and **History**), a genre in the middle, and stations on
the right. Double-click, Enter or **Play** plays; **Enqueue** appends;
Shift/Ctrl-click selects several; right-click for Play / Enqueue / Bookmark /
Copy stream address; **Filter ▾** narrows by bitrate, format and country;
click a column header to sort. The last view and window position are
remembered. Drag the window by its title bar.

Webamp's audio element is `crossOrigin="anonymous"`, so a stream needs CORS
headers to play — most radio servers send none. `server/streamProxy.js` is a
Vite plugin (dev and preview) that re-serves streams from `/stream?u=<url>`,
accepts SHOUTcast v1 `ICY 200 OK` answers, strips ICY metadata and publishes
the current title at `/stream-title?u=<url>`; the player polls it and shows
"Artist - Title" in the marquee. When the page is served without the plugin
(static hosting) streams are used directly and only CORS-enabled stations
work. HLS (`.m3u8`) stations need a browser with native HLS (Safari).

The equalizer's **AUTO** button — a no-op in stock Webamp — applies the
built-in Winamp preset that matches the station's genre (Dance, Rock, Full
Bass, Classical, ...) whenever a station starts, and a flat EQ otherwise.

## Embedding in another app (bottom dock)

The app page itself (`index.html`) is now the docked layout: a stand-in host
page with the player in a fixed bottom bar, exactly as it will sit in Minka.
`npm run build:embed` produces `dist-embed/webamp-radio.js` (+ `.iife.js`,
`.css`): one call, `mountWebampRadio(container, { stations })` (or
`WebampRadio.mount(...)` from the plain script), docks the three classic
windows in a row inside any element, opens the Media Library above it, and
exposes play/enqueue/events. See [docs/embed-minka.md](docs/embed-minka.md).

## Resizing

Webamp already ships resize handles: the playlist and the Milkdrop window declare
`canResize: true` and render a corner grip that emits `WINDOW_SIZE_CHANGED` on
Winamp's own tile grid (25px horizontally, 29px vertically).

Those grips do not respond to a real mouse drag. Their React handler listens for
`mousedown`, but the surrounding window component focuses the window on
`pointerdown`, and focusing retargets the follow-up mouse event away from the
grip. `src/resize.js` stops propagation of `pointerdown` on the grips, after
which dragging works:

```
playlist   275x116  ->  400x232   (drag out)
           400x232  ->  300x145   (drag in)
milkdrop   275x116  ->  425x232
```

The main window and equalizer are fixed-size in Winamp itself (`canResize:
false`), so they are left alone. Use the player's own **Double Size** option to
scale those.

## Skins

Open it from **Skins → Browse Skin Museum...** The browser talks to the
[Winamp Skin Museum](https://skins.webamp.org) public GraphQL endpoint:

| | |
|---|---|
| Browsing | `skins(first, offset, sort) { count nodes }` |
| Searching | `search_classic_skins(query, first, offset)` |
| Archive | `https://r2.webampskins.org/skins/<md5>.wsz` |
| Preview | `https://r2.webampskins.org/screenshots/<md5>.png` |
| Available | 102,783 skins |

Search uses `search_classic_skins` rather than the museum's general
`search_skins`, because the general search also returns `.wal` (Winamp 3/5)
archives that Webamp cannot load. Every search result is therefore a classic
`.wsz` that will actually apply.

Applying a skin also pins it into Webamp's own **Skins** submenu (up to 12),
where it can be switched back to in one click; that list is kept in
`localStorage` under `webamp.skinList`.

The chosen skin is remembered in `localStorage` and restored on the next visit.
Entries that are Wasabi XML skins (Winamp 3/5) cannot be loaded by Webamp and are
reported as such instead of failing silently.

## Webamp Modern

Classic `.wsz` skins mostly change artwork. Winamp 3/5 **Modern** skins instead
declare layout, animation and behaviour in XML with MAKI scripts — a different
engine entirely, which the classic Webamp cannot read.

The player has one skin surface with two views of the same Webamp instance
(`src/skinSurface.js`): the classic row (main, EQ, playlist) and a Modern skin
rendered by webamp-modern (the fork in `packages/webamp-modern` of the
x5066 workspace, built by `tools/sync-webamp-modern.sh` into
`src/vendor/webamp-modern/`, a lazy chunk). The classic Webamp is the player —
the Modern view drives it through an audio adapter and a playlist provider and
owns no `<audio>` element of its own.

* The small **MODERN / CLASSIC** button on the bar switches views; right-click
  on it opens the classic menu.
* **Skins →** lists the built-in Modern skins (Winamp Modern, Bento, Big Bento,
  Nokia Edition — the four from the Winamp source tree, packed by
  `tools/pack-winamp-skins.sh`; check the licence before shipping them), the
  Modern skins loaded before (kept in IndexedDB), *Load skin file (.wsz / .wal)...*
  and *Back to classic skin*.
* Bento's lower panel (Media Library / Visualization) hosts the player's own
  Media Library through the skin's `<windowholder>`; the bar grows for it up
  to `barHeight.max` (70vh) and shrinks back when the skin collapses.

## Radio

Modelled on the original Winamp bookmark view
(`Src/Plugins/Library/ml_bookmarks/` in the Winamp source), not a custom window:

| Original Winamp | Here |
|---|---|
| `BookmarkWriter::Write()` → `fprintf(fp,"%s\n%s\n", url, title)` | `localStorage` holds the same `url\ntitle` layout |
| Two columns: "Bookmark Title", "Bookmark Filename/URL" | `Station` and `Country / Genre` |
| `SWLVS_ALTERNATEITEMS` | Alternate row striping |
| `SWLVS_FULLROWSELECT` | Full-row selection |
| No column headers (`setShowColumnsHeaders(FALSE)`) | Same |
| `Enter` = play, `Shift+Enter` = enqueue | Same |
| `IPC_ENQUEUEFILEW` appends to the playlist | `webamp.appendTracks()` |

The window frame is Webamp's generated-window chrome (`.gen-window` plus the
`gen-*` skin sprites), so it repaints with whatever skin is active. It must be
mounted inside `#webamp`, because the skin styles those selectors scoped there.

The library has two sources, switchable in its toolbar:

* **This list** — the curated catalogue in `public/data/radio.json`, generated
  from the Minka project's `data/stations.json` and `data/radio-featured.json`.
  Instant, and every station was verified to play.
* **Online** — live search of [Radio Browser](https://www.radio-browser.info)
  across ~30,000 stations, with country and genre filters.

The curated catalogue:

| Group | Country | Genre | Stations |
|---|---|---|---|
| featured | International | Featured | 5 |
| latvija | Latvia | Public & Pop | 24 |
| radiorecord | Russia | Dance & Electronic (+ sub-genres) | 105 |

### Live streams vs local files

Streams need two things that local files do not, both handled in
`src/streamWatch.js`:

* HTML5 audio drops the connection after `stop()`, so pressing play on a live
  stream fetches nothing. A `STOPPED`/`ENDED` -> `PLAYING` watcher re-feeds the
  station to force a fresh connection. It stays quiet for a few seconds after a
  station starts, so it does not undo the fetch it has just opened.
* A stream that cannot be loaded ends immediately. The watcher reports those
  instead of leaving the transport silently stopped.

Online search results come from a community database, so station availability is
not guaranteed. Sampling the top results with Webamp's own CORS setting showed
**88% playable**; the rest are offline or do not send an
`Access-Control-Allow-Origin` header.

### Why some stations do not play

Webamp creates its audio element with `crossOrigin = "anonymous"`, so a stream
must send an `Access-Control-Allow-Origin` header. On an https:// page the
browser also blocks plain `http://` streams as mixed content.

Measured against the real streams with Webamp's setting: **129 of 134 play
(96%)**. The five exceptions are `Latvijas Radio 1-4` (plain `http://` only) and
one SomaFM endpoint; those rows are dimmed rather than failing silently.

## Layout

- `src/main.js` - the page: mounts the player into `#radioWindow` the way Minka does
- `src/embed.js` - `mountWebampRadio()`, the embeddable player (library build)
- `src/minka.js` - `mountMinkaRadio()`, the Minka bridge (stations, favorites, events)
- `src/player.js` - the Webamp instance, playback, stations, EQ, skins menu
- `src/skinSurface.js` - Classic ⇄ Modern skin surface
- `src/modern/` - the Modern view: engine mount, audio adapter, playlist provider
- `src/vendor/webamp-modern/` - the engine build (do not edit; see `tools/sync-webamp-modern.sh`)
- `src/radioMenu.js` - the Media Library window
- `src/skins.js` / `src/skinBrowser.js` - Skin Museum client and browser
- `src/minkaStations.js` + `public/data/minka/` - Minka's catalogue for the page
- `public/skins/modern/` - built-in Modern skins; `public/modern/assets/` - engine runtime assets
- `public/sw.js` - offline service worker
- `docs/embed-minka.md` - how to embed in Minka
