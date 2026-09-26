// The radio library, modelled on the "Internet Radio" (SHOUTcast directory)
// view of Winamp 5's Media Library.
//
// That view was three panes inside the library window: the navigation tree on
// the left (Internet Radio, Bookmarks, History, ...), the directory's genre
// tree in the middle (primary genres with expandable sub-genres, "All
// Stations" on top), and a sortable station table on the right with Name,
// Genre, Genre2..., Bitrate and Format columns. A "Search:" box with a "Clear
// Search" button sat above, and the bottom bar held Enqueue / Filter controls
// and a "Found N streams" readout. Double-click or Enter played a station,
// Shift/Ctrl-click selected several, and the right-click menu offered Play,
// Enqueue and Bookmark.
//
// The SHOUTcast directory itself is gone, so the online node searches the
// Radio Browser community database using the same genre tree. Everything is
// drawn inside Webamp's generated-window chrome so the active skin paints the
// frame, and the interior uses the playlist palette like the original.

import { searchStations, countries as rbCountries, languages as rbLanguages, reportPlay, PAGE_SIZE as ONLINE_PAGE } from "./radioBrowser.js";
import { listStations, blockedReason, streamFormat } from "./radio.js";
import { genreTree, genreLabel } from "./genres.js";
import { topTags } from "./radioBrowser.js";

const viewStorageKey = "webamp.radio.view.v1";

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text != null) {
    node.textContent = text;
  }
  return node;
};

const button = (className, text, label) => {
  const node = el("button", className, text);
  node.type = "button";
  if (label) {
    node.setAttribute("aria-label", label);
    node.title = label;
  }
  return node;
};

// Navigation tree, in the order Winamp listed the library nodes that matter here.
// The Media Library navigation tree.
//
// Winamp's tree is hierarchical: gen_ml contributes the shell's own views and
// each ml_* plugin inserts its own branch. ml_online inserts online services
// under an "Online Services" parent, naming each one with the invariant prefix
// "om_svc_" (ml_online/navigation.cpp:36).
//
// Bookmarks is NOT one of those. Winamp's Media Library has Bookmarks as its
// own top-level view that stores any playlist entry, radio stream included — it
// is not part of the online services branch. History plays the same role for
// recently played items.
//
// Radio Record sits where SHOUTcast Radio historically sat: a single child of
// Online Services. There is no invented intermediate level.
const NAV = [
  { id: "bookmarks", name: "Bookmarks", icon: "bookmark" },
  {
    id: "online",
    name: "Online Services",
    icon: "list",
    parent: true,
    // ml_online stores its services with this invariant prefix.
    invariantPrefix: "om_svc_",
    // Filled from the host's sources (createRadioLibrary({ sources })).
    children: []
  },
  {
    // YouTube playlists (createRadioLibrary({ musicSources })): shown only
    // when the host passes some. Each child loads its rows on demand.
    id: "music",
    name: "Online Music",
    icon: "list",
    parent: true,
    children: []
  },
  { id: "history", name: "History", icon: "history" }
];

// Winamp's Internet Radio list: Name | Genre | Now Playing | Bitrate | Type,
// plus the bookmark star. Country, votes and the second genre stay in the
// row tooltip.
const COLUMNS = [
  { id: "name", label: "Name", sort: (s) => s.title.toLowerCase() },
  { id: "genre", label: "Genre", sort: (s) => genreAt(s, 0).toLowerCase() },
  { id: "nowplaying", label: "Now Playing", sort: (s) => (s.nowPlaying || "").toLowerCase() },
  { id: "bitrate", label: "Bitrate", sort: (s) => s.bitrate || 0, numeric: true },
  { id: "format", label: "Type", sort: (s) => streamFormat(s) },
  { id: "fav", label: "\u2605", sort: (s) => (s.isFavorite ? 1 : 0), numeric: true }
];

const SONG_COLUMNS = [
  { id: "name", label: "Song", sort: (s) => (s.title || "").toLowerCase() },
  { id: "artist", label: "Artist", sort: (s) => (s.artist || "").toLowerCase() },
  { id: "station", label: "Station", sort: (s) => (s.station || "").toLowerCase() },
  { id: "when", label: "When", sort: (s) => s.at || 0, numeric: true }
];

// Songs of the music nodes (Lācītis search, YouTube Music playlists).
const MUSIC_COLUMNS = [
  { id: "name", label: "Dziesma", sort: (s) => (s.title || "").toLowerCase() },
  { id: "artist", label: "Izpildītājs", sort: (s) => (s.artist || "").toLowerCase() },
  { id: "length", label: "Garums", sort: (s) => s.duration || 0, numeric: true },
  { id: "fav", label: "\u2605", sort: (s) => (s.isFavorite ? 1 : 0), numeric: true }
];

const SORTS = [
  ["Most popular", "clickcount"],
  ["Most voted", "votes"],
  ["Name", "name"],
  ["Bitrate", "bitrate"]
];

function formatWhen(at) {
  const delta = Date.now() - at;
  if (delta < 60000) return "just now";
  if (delta < 3600000) return `${Math.round(delta / 60000)} min ago`;
  if (delta < 86400000) return `${Math.round(delta / 3600000)} h ago`;
  const date = new Date(at);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

const BITRATES = [
  ["Any bitrate", 0],
  ["64 kbps and up", 64],
  ["96 kbps and up", 96],
  ["128 kbps and up", 128],
  ["192 kbps and up", 192],
  ["320 kbps", 320]
];

const FORMATS = [
  ["Any format", ""],
  ["MP3", "MP3"],
  ["AAC", "AAC"],
  ["AAC+", "AAC+"],
  ["OGG", "OGG"]
];

function stationGenres(station) {
  const tags = Array.isArray(station.tags) && station.tags.length > 0 ? station.tags : [station.genre];
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    const label = genreLabel(tag);
    if (label && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());
      out.push(label);
    }
  }
  return out;
}

function genreAt(station, index) {
  return stationGenres(station)[index] ?? "";
}

function stationTooltip(station) {
  const lines = [station.title];
  if (station.note) lines.push(station.note);
  const genres = stationGenres(station).join(", ");
  if (genres) lines.push(`Genre: ${genres}`);
  if (station.countryName || station.country) lines.push(`Country: ${station.countryName || station.country}`);
  if (station.language) lines.push(`Language: ${station.language}`);
  if (station.bitrate) lines.push(`Bitrate: ${station.bitrate} kbps`);
  const format = streamFormat(station);
  if (format) lines.push(`Format: ${format}`);
  if (station.votes) lines.push(`Votes: ${station.votes}`);
  if (station.clicks) lines.push(`Popularity (clicks): ${station.clicks}`);
  if (station.homepage) lines.push(station.homepage);
  lines.push(station.url);
  const reason = blockedReason(station);
  if (reason) lines.push(reason);
  return lines.join("\n");
}

function readView() {
  try {
    return JSON.parse(localStorage.getItem(viewStorageKey) ?? "null") ?? {};
  } catch {
    return {};
  }
}

function writeView(view) {
  try {
    localStorage.setItem(viewStorageKey, JSON.stringify(view));
  } catch {}
}

// `sources` adds the embedding app's own lists as library nodes ahead of the
// directory: [{ id, name, getStations() }]. `title` is the window caption.
export function createRadioLibrary({
  onPlay,
  onEnqueue,
  favorites,
  history,
  getNowPlaying = () => null,
  getDefaultPosition,
  // Where the window is attached; must sit under an element with id "webamp"
  // so the skin CSS paints the frame. Default: the first #webamp in the page.
  overlayHost = null,
  sources = [],
  // Online Music nodes: [{ id, name, icon, load() -> Promise<rows> }].
  musicSources = [],
  title = "MEDIA LIBRARY",
  // Which built-in nodes to show: "online", "bookmarks", "history".
  nodes = NAV.map((entry) => entry.id),
  // Called with a song row the moment it is pressed (the host looks its
  // stream up before the double-click / Play arrives).
  onPrefetch = null
}) {
  // A host-supplied source can take over a NAV node instead of adding a new
  // one: the Radio Record service node is the same catalogue the host passes in.
  // Matching by id keeps the tree to exactly the Winamp views.
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  function mergeSource(entry) {
    const source = sourceById.get(entry.id);
    if (!source) return entry;
    return { ...entry, getStations: source.getStations };
  }

  const topLevel = NAV
    .filter((entry) => (entry.id === "music" ? musicSources.length > 0 : nodes.includes(entry.id)))
    .map((entry) => mergeSource({
      ...entry,
      // Online Services lists the host's services (each source is a node);
      // Online Music lists the YouTube playlists.
      children: entry.id === "online"
        ? sources.map((source) => ({ id: source.id, name: source.name, icon: source.icon ?? "radio", getStations: source.getStations }))
        : entry.id === "music"
          ? musicSources.map((source) => ({ id: source.id, name: source.name, icon: source.icon ?? "list", load: source.load, search: source.search }))
          : entry.children?.map((child) => mergeSource(child))
    }));

  // Sources that match no NAV node are not shown: the Media Library tree holds
  // Winamp's own views, not arbitrary entries from the host application.
  const navEntries = topLevel;

  const customSources = new Map();
  // Rows of the async (Online Music) sources, per node, after their load().
  const loadedRows = new Map();
  const collectSources = (list) => {
    for (const entry of list) {
      if (entry.getStations || entry.load) customSources.set(entry.id, entry);
      if (entry.children) collectSources(entry.children);
    }
  };
  collectSources(navEntries);
  const overlay = el("div", "ml-overlay");
  overlay.hidden = true;

  // Reuse Webamp's generated-window chrome exactly as its own gen-window component
  // builds it, so the skin draws the frame, title and close button. The interior
  // lives in .gen-middle-center, which Webamp otherwise fills with the playlist.
  const windowEl = el("div", "gen-window window ml-window");

  const top = el("div", "gen-top draggable");
  const topRight = el("div", "gen-top-right draggable");
  const closeButton = el("div", "gen-close winamp-active");
  closeButton.setAttribute("role", "button");
  closeButton.setAttribute("aria-label", "Close media library");
  closeButton.tabIndex = 0;
  topRight.append(closeButton);

  // Webamp renders the title one letter at a time so the skin supplies each glyph.
  const titleNode = el("div", "gen-top-title draggable");
  for (const ch of String(title).toUpperCase()) {
    const glyph = /[a-z0-9]/i.test(ch) ? ch.toLowerCase() : "space";
    titleNode.append(el("div", `draggable gen-text-letter gen-text-${glyph}`));
  }

  top.append(
    el("div", "gen-top-left draggable"),
    el("div", "gen-top-left-fill draggable"),
    el("div", "gen-top-left-end draggable"),
    titleNode,
    el("div", "gen-top-right-end draggable"),
    el("div", "gen-top-right-fill draggable"),
    topRight
  );

  const middle = el("div", "gen-middle");
  const middleLeft = el("div", "gen-middle-left draggable");
  middleLeft.append(el("div", "gen-middle-left-bottom draggable"));
  const middleCenter = el("div", "gen-middle-center");
  const middleRight = el("div", "gen-middle-right draggable");
  middleRight.append(el("div", "gen-middle-right-bottom draggable"));
  middle.append(middleLeft, middleCenter, middleRight);

  const bottom = el("div", "gen-bottom");
  bottom.append(
    el("div", "gen-bottom-left draggable"),
    el("div", "gen-bottom-fill draggable"),
    el("div", "gen-bottom-right draggable")
  );

  const body = el("div", "ml-body");

  // --- Navigation pane ------------------------------------------------------
  //
  // A tree, not a flat list: branch items carry an expander and their children
  // are indented under them. gen_ml persists which branches are collapsed
  // (gen_ml/navigation.cpp stores NIS_EXPANDED_I per item with a saved state);
  // an item with no saved state starts expanded. The same rule is used here —
  // only an explicit collapse is remembered.
  // What a double-click on a station does. Winamp's Online Services help lists
  // this as the directory's Config setting, with Play as the default. Stored
  // alongside the other view state so it survives a reload.
  const DOUBLE_CLICK_KEY = "webamp.radio.doubleclick.v1";
  const DOUBLE_CLICK_ACTIONS = ["play", "enqueue", "bookmark"];

  function readDoubleClickAction() {
    try {
      const stored = localStorage.getItem(DOUBLE_CLICK_KEY);
      return DOUBLE_CLICK_ACTIONS.includes(stored) ? stored : "play";
    } catch {
      return "play";
    }
  }

  function writeDoubleClickAction(action) {
    try {
      localStorage.setItem(DOUBLE_CLICK_KEY, action);
    } catch {
      /* storage unavailable: the choice lasts for the session */
    }
  }

  let doubleClickAction = readDoubleClickAction();

  const COLLAPSE_KEY = "webamp.radio.nav.collapsed.v1";

  function readCollapsed() {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function writeCollapsed(set) {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...set]));
    } catch {
      /* storage unavailable: the tree simply starts expanded each time */
    }
  }

  const collapsed = readCollapsed();
  const nav = el("div", "ml-nav");
  nav.setAttribute("role", "tree");
  nav.setAttribute("aria-label", "Library");
  const navItems = new Map();

  function addNavNode(entry, depth) {
    const row = el("div", "ml-nav-row");
    row.style.setProperty("--depth", String(depth));

    if (entry.parent || entry.children) {
      const toggle = el("div", "ml-genre-toggle");
      const isCollapsed = collapsed.has(entry.id);
      toggle.classList.add(isCollapsed ? "is-collapsed" : "is-expanded");
      toggle.setAttribute("role", "button");
      toggle.setAttribute("aria-label", isCollapsed ? `Expand ${entry.name}` : `Collapse ${entry.name}`);
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const next = !collapsed.has(entry.id);
        if (next) collapsed.add(entry.id);
        else collapsed.delete(entry.id);
        writeCollapsed(collapsed);
        toggle.classList.toggle("is-collapsed", next);
        toggle.classList.toggle("is-expanded", !next);
        renderChildren(entry);
      });
      row.append(toggle);
    } else {
      row.append(el("div", "ml-nav-spacer"));
    }

    const item = el("div", `ml-nav-item ml-icon-${entry.icon}`, entry.name);
    item.setAttribute("role", "treeitem");
    item.dataset.id = entry.id;
    item.tabIndex = -1;
    if (entry.invariantPrefix) item.dataset.invariant = `${entry.invariantPrefix}${entry.id}`;
    item.addEventListener("click", () => selectNav(entry.id));
    row.append(item);
    nav.append(row);
    navItems.set(entry.id, item);
  }

  function renderChildren(entry) {
    // Children live in the nav after their parent; re-adding replaces them.
    for (const child of entry.children ?? []) {
      navItems.get(child.id)?.parentElement?.remove();
      navItems.delete(child.id);
    }
    if (collapsed.has(entry.id)) return;
    const after = navItems.get(entry.id)?.parentElement;
    let anchor = after;
    for (const child of entry.children ?? []) {
      const row = buildChildRow(child, (entry.__depth ?? 0) + 1);
      anchor.after(row);
      anchor = row;
    }
  }

  function buildChildRow(entry, depth) {
    const row = el("div", "ml-nav-row");
    row.style.setProperty("--depth", String(depth));
    row.append(el("div", "ml-nav-spacer"));
    const item = el("div", `ml-nav-item ml-icon-${entry.icon}`, entry.name);
    item.setAttribute("role", "treeitem");
    item.dataset.id = entry.id;
    item.tabIndex = -1;
    item.addEventListener("click", () => selectNav(entry.id));
    row.append(item);
    navItems.set(entry.id, item);
    return row;
  }

  const NAV_DEPTH = new Map();
  function walk(entries, depth) {
    for (const entry of entries) {
      entry.__depth = depth;
      NAV_DEPTH.set(entry.id, depth);
      addNavNode(entry, depth);
      if (entry.children && !collapsed.has(entry.id)) {
        for (const child of entry.children) {
          NAV_DEPTH.set(child.id, depth + 1);
          const row = buildChildRow(child, depth + 1);
          nav.append(row);
        }
      }
    }
  }
  walk(navEntries, 0);

  // --- Search bar -----------------------------------------------------------
  const searchBar = el("div", "ml-search-bar");
  const searchLabel = el("label", "ml-search-label", "Search:");
  const search = el("input", "ml-input ml-search");
  search.type = "search";
  search.id = "ml-radio-search";
  search.setAttribute("aria-label", "Search stations");
  search.autocomplete = "off";
  searchLabel.htmlFor = search.id;
  searchBar.append(searchLabel, search);

  // --- Genre pane -----------------------------------------------------------
  // Winamp's Internet Radio view: the genre tree sits between the library
  // tree and the station list, for every view.
  const genres = el("div", "ml-genres");
  genres.setAttribute("role", "tree");
  genres.setAttribute("aria-label", "Genres");

  // --- Station table --------------------------------------------------------
  const table = el("div", "ml-table");
  const head = el("div", "ml-thead");
  head.setAttribute("role", "row");
  const headCells = new Map();
  function buildHead(columns) {
    head.replaceChildren();
    headCells.clear();
    for (const column of columns) {
      const cell = el("div", `ml-th ml-col-${column.id}`);
      cell.setAttribute("role", "columnheader");
      cell.append(el("span", "ml-th-label", column.label), el("span", "ml-th-arrow"));
      cell.addEventListener("click", () => sortBy(column.id));
      head.append(cell);
      headCells.set(column.id, cell);
    }
  }
  buildHead(COLUMNS);
  const rows = el("div", "ml-rows");
  rows.tabIndex = 0;
  rows.setAttribute("role", "listbox");
  rows.setAttribute("aria-multiselectable", "true");
  rows.setAttribute("aria-label", "Stations");
  const message = el("div", "ml-message");
  table.append(head, rows, message);

  const panes = el("div", "ml-panes");
  panes.append(nav, genres, table);

  // --- Bottom bar -----------------------------------------------------------
  const footer = el("div", "ml-footer");
  const playButton = button("ml-button", "Play");
  const enqueueButton = button("ml-button", "Enqueue");
  const bookmarkButton = button("ml-button ml-bookmark", "Bookmark");
  const filterButton = button("ml-button ml-filter", "Filter ▾");
  filterButton.setAttribute("aria-haspopup", "true");
  const moreButton = button("ml-button ml-more", "More");
  moreButton.hidden = true;
  const clearHistoryButton = button("ml-button", "Clear");
  clearHistoryButton.hidden = true;
  const status = el("span", "ml-status");
  status.setAttribute("role", "status");
  footer.append(playButton, enqueueButton, bookmarkButton, filterButton, moreButton, clearHistoryButton, status);

  // Filter popup: bitrate, format and country, as the directory's Filter menu had.
  const filterPanel = el("div", "ml-popup ml-filter-panel");
  filterPanel.hidden = true;
  const bitrateSelect = el("select", "ml-select");
  bitrateSelect.setAttribute("aria-label", "Minimum bitrate");
  bitrateSelect.append(...BITRATES.map(([label, value]) => new Option(label, String(value))));
  const formatSelect = el("select", "ml-select");
  formatSelect.setAttribute("aria-label", "Stream format");
  formatSelect.append(...FORMATS.map(([label, value]) => new Option(label, value)));
  const countrySelect = el("select", "ml-select");
  countrySelect.setAttribute("aria-label", "Country");
  countrySelect.append(new Option("Any country", ""));
  const languageSelect = el("select", "ml-select");
  languageSelect.setAttribute("aria-label", "Language");
  languageSelect.append(new Option("Any language", ""));
  const sortSelect = el("select", "ml-select");
  sortSelect.setAttribute("aria-label", "Order");
  sortSelect.append(...SORTS.map(([label, value]) => new Option(label, value)));
  const filterReset = button("ml-button", "Reset");
  filterPanel.append(
    el("div", "ml-popup-title", "Filter stations"),
    sortSelect,
    bitrateSelect,
    formatSelect,
    countrySelect,
    languageSelect,
    filterReset
  );

  // Right-click menu for rows.
  const contextMenu = el("div", "ml-popup ml-context");
  contextMenu.hidden = true;
  contextMenu.setAttribute("role", "menu");

  body.append(searchBar, panes, footer, filterPanel, contextMenu);
  middleCenter.append(body);
  windowEl.append(top, middle, bottom);
  overlay.append(windowEl);

  // The skin styles generated windows with selectors scoped to "#webamp", so the
  // window has to live inside that subtree. Webamp may not have rendered yet when
  // this is constructed, so attach on first show and re-check on every show.
  function mount() {
    const host = overlayHost ?? document.querySelector("#webamp");
    if (host && overlay.parentElement !== host) {
      host.append(overlay);
    } else if (!host && !overlay.parentElement) {
      document.body.append(overlay);
    }
  }

  // --- State ----------------------------------------------------------------
  let navId = navEntries[0].id;
  let genre = null; // { name, tag } or null for "All Stations"
  let expanded = new Set();
  let stations = [];
  let selectedUrls = new Set();
  let anchorIndex = -1;
  let lastTap = { url: null, at: 0 };
  let sortColumn = null;
  let sortDescending = false;
  let loading = false;
  let hasMore = false;
  let searchTimer = null;
  let requestId = 0;
  let searchAbort = null;
  let localStations = null;
  let localLoading = null;
  let countriesLoaded = false;

  const filters = { bitrateMin: 0, format: "", country: "", language: "", order: "clickcount" };
  // Cached async sources (history) and the songs view.
  let historyCache = [];
  let songsCache = [];
  const isSongsView = () => navId === "songs";
  // Music nodes load songs (load()); host station lists only list stations.
  const isMusicView = () => Boolean(customSources.get(navId)?.load);
  const columnsFor = () => (isSongsView() ? SONG_COLUMNS : isMusicView() ? MUSIC_COLUMNS : COLUMNS);

  const selectedItems = () => stations.filter((item) => selectedUrls.has(rowKey(item)));
  // Songs resolve to the station they were heard on, so Play / Bookmark work there too.
  const selectedStations = () => (isSongsView()
    ? [...new Map(selectedItems().map((song) => [song.stationUrl, songStation(song)])).values()]
    : selectedItems());
  const songStation = (song) => historyCache.find((s) => s.url === song.stationUrl)
    ?? favorites.get(song.stationUrl)
    ?? { url: song.stationUrl, title: song.station, favicon: song.favicon, https: song.stationUrl.startsWith("https:") };

  // --- Navigation -----------------------------------------------------------
  function selectNav(id) {
    // Child nodes are valid targets too (Online Services children), so the
    // check covers the whole tree rather than only the top level.
    if (!navItems.has(id)) {
      id = navEntries[0].id;
    }
    navId = id;
    for (const [key, item] of navItems) {
      item.classList.toggle("is-selected", key === id);
      item.setAttribute("aria-selected", key === id ? "true" : "false");
    }
    genre = null;
    // The directory and the host app's lists keep their own order.
    sortColumn = id === "online" || customSources.has(id) ? null : "name";
    sortDescending = false;
    clearHistoryButton.hidden = id !== "history";
    buildHead(columnsFor());
    // Winamp: the genre pane belongs to the Internet Radio directory only;
    // Bookmarks and History are plain lists.
    const directoryView = id === "online" || (customSources.has(id) && !customSources.get(id).load);
    genres.hidden = !directoryView;
    panes.classList.toggle("is-two-pane", !directoryView);
    renderGenres();
    void load();
    persistView();
  }

  function persistView() {
    const { left, top: topPos } = readView();
    writeView({ nav: navId, genre: genre?.name ?? null, expanded: [...expanded], left, top: topPos });
  }

  // --- Genre tree -----------------------------------------------------------
  function genreNode(name, tag, depth, { expandable = false, isExpanded = false } = {}) {
    const node = el("div", "ml-genre");
    node.setAttribute("role", "treeitem");
    node.style.setProperty("--depth", String(depth));
    const toggle = el("span", "ml-genre-toggle", expandable ? (isExpanded ? "−" : "+") : "");
    const label = el("span", "ml-genre-label", name);
    node.append(toggle, label);
    const active = genre ? genre.name === name && genre.tag === tag : name === "All Stations";
    node.classList.toggle("is-selected", active);
    node.setAttribute("aria-selected", active ? "true" : "false");
    if (expandable) {
      node.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        if (expanded.has(name)) {
          expanded.delete(name);
        } else {
          expanded.add(name);
        }
        renderGenres();
        persistView();
      });
    }
    node.addEventListener("click", () => {
      genre = name === "All Stations" ? null : { name, tag };
      if (expandable && !expanded.has(name)) {
        expanded.add(name);
      }
      renderGenres();
      void load();
      persistView();
    });
    node.addEventListener("dblclick", () => {
      if (expandable) {
        toggle.click();
      }
    });
    return node;
  }

  function renderGenres() {
    const nodes = [genreNode("All Stations", "", 0)];

    if (navId === "online") {
      for (const primary of genreTree) {
        const open = expanded.has(primary.name);
        nodes.push(genreNode(primary.name, primary.tag, 0, { expandable: primary.children.length > 0, isExpanded: open }));
        if (open) {
          for (const child of primary.children) {
            nodes.push(genreNode(child.name, child.tag, 1));
          }
        }
      }
    } else {
      // Local lists get a flat genre list derived from what they contain.
      const names = new Map();
      for (const station of sourceStations()) {
        for (const name of stationGenres(station)) {
          names.set(name, (names.get(name) ?? 0) + 1);
        }
      }
      for (const name of [...names.keys()].sort((a, b) => a.localeCompare(b))) {
        nodes.push(genreNode(name, name.toLowerCase(), 0));
      }
    }

    genres.replaceChildren(...nodes);
    const active = genres.querySelector(".is-selected");
    active?.scrollIntoView({ block: "nearest" });
  }

  // --- Loading --------------------------------------------------------------
  function sourceStations() {
    if (customSources.has(navId)) {
      const source = customSources.get(navId);
      return source.load ? loadedRows.get(navId) ?? [] : source.getStations() ?? [];
    }
    switch (navId) {
      case "featured":
        return localStations ?? [];
      case "bookmarks":
        return favorites.list();
      case "history":
        return historyCache;
      case "songs":
        return songsCache;
      default:
        return [];
    }
  }

  function matchesFilters(station) {
    if (filters.bitrateMin && (station.bitrate || 0) < filters.bitrateMin) {
      return false;
    }
    if (filters.format && streamFormat(station) !== filters.format) {
      return false;
    }
    if (filters.country && station.country !== filters.country) {
      return false;
    }
    return true;
  }

  function matchesGenre(station) {
    if (!genre) {
      return true;
    }
    const wanted = genre.name.toLowerCase();
    return stationGenres(station).some((name) => name.toLowerCase() === wanted);
  }

  function matchesSongSearch(song) {
    const term = search.value.trim().toLowerCase();
    if (!term) {
      return true;
    }
    const haystack = `${song.title} ${song.artist} ${song.station}`.toLowerCase();
    return term.split(/\s+/).every((part) => haystack.includes(part));
  }

  function matchesSearch(station) {
    const term = search.value.trim().toLowerCase();
    if (!term) {
      return true;
    }
    const haystack = `${station.title} ${station.country} ${station.countryName ?? ""} ${stationGenres(station).join(" ")} ${station.url}`.toLowerCase();
    return term.split(/\s+/).every((part) => haystack.includes(part));
  }

  async function load({ append = false } = {}) {
    const id = ++requestId;
    moreButton.hidden = true;

    if (navId !== "online") {
      if (navId === "featured") {
        await ensureLocal();
        if (id !== requestId) return;
      } else if (navId === "history") {
        historyCache = await history.listStations();
        if (id !== requestId) return;
      } else if (navId === "songs") {
        songsCache = await history.listSongs();
        if (id !== requestId) return;
      } else if (customSources.get(navId)?.search && search.value.trim()) {
        // A searchable music node (Lācītis): the box asks the service, the
        // answer is the list as it is (no local filter on top of it).
        const source = customSources.get(navId);
        const term = search.value.trim();
        searchAbort?.abort();
        const controller = new AbortController();
        searchAbort = controller;
        setMessage("Meklē...");
        try {
          const found = await source.search(term, { signal: controller.signal });
          if (id !== requestId) return;
          loadedRows.set(navId, found);
          setMessage(found.length === 0 ? "Nekas netika atrasts." : "");
          // The likely picks start looking up their streams now.
          found.slice(0, 2).forEach((item) => onPrefetch?.(item));
        } catch (error) {
          if (id !== requestId || controller.signal.aborted) return;
          loadedRows.set(navId, []);
          setMessage(error?.message || "Meklēšana neizdevās.");
        }
        stations = sourceStations();
        hasMore = false;
        if (!append) selectedUrls.clear();
        renderRows();
        setStatus();
        return;
      } else if (customSources.get(navId)?.load) {
        // Online Music: cache-first rows; a stale copy shows at once and the
        // refreshed one replaces it when it lands (same node still open).
        const source = customSources.get(navId);
        if (!loadedRows.has(navId)) setMessage("Loading playlist...");
        try {
          const rows = await source.load({
            onRefresh: (fresh) => {
              loadedRows.set(navId, fresh);
              if (customSources.get(navId) === source) void load();
            }
          });
          if (id !== requestId) return;
          loadedRows.set(navId, rows);
          setMessage(rows.length === 0 ? "This playlist is empty or unavailable." : "");
          if (rows[0]?.source === "youtube") onPrefetch?.(rows[0]);
        } catch (error) {
          if (id !== requestId) return;
          setMessage(error?.message || "The playlist could not be loaded.");
        }
      }
      stations = isSongsView()
        ? sourceStations().filter((song) => matchesSongSearch(song))
        : sourceStations().filter((station) => matchesGenre(station) && matchesFilters(station) && matchesSearch(station));
      hasMore = false;
      if (!append) {
        selectedUrls.clear();
      }
      renderRows();
      setStatus();
      return;
    }

    // A newer request supersedes a running one; the stale result is ignored on return.
    loading = true;
    setMessage(append ? "" : "Searching the directory...");
    if (!append) {
      rows.replaceChildren();
    }

    try {
      const result = await searchStations({
        query: search.value,
        country: filters.country,
        language: filters.language,
        tag: genre?.tag ?? "",
        bitrateMin: filters.bitrateMin,
        codec: filters.format,
        order: filters.order,
        offset: append ? stations.length : 0,
        limit: ONLINE_PAGE
      });
      if (id !== requestId) {
        return;
      }
      stations = append ? [...stations, ...result.items] : result.items;
      hasMore = result.hasMore;
      loading = false;
      if (!append) {
        selectedUrls.clear();
      }
      setMessage(stations.length === 0 ? "No streams found. Try a different search or genre." : "");
      renderRows();
      setStatus();
    } catch (error) {
      if (id !== requestId) {
        return;
      }
      stations = append ? stations : [];
      hasMore = false;
      loading = false;
      renderRows();
      setMessage(error?.message || "The directory is unavailable.");
      setStatus();
    } finally {
      if (id === requestId) {
        loading = false;
      }
    }
  }

  // Loads the curated catalogue once, on first use.
  async function ensureLocal() {
    if (localStations) {
      return localStations;
    }
    if (!localLoading) {
      setMessage("Loading stations...");
      localLoading = listStations()
        .then((items) => {
          localStations = items;
          setMessage("");
          return items;
        })
        .catch((error) => {
          setMessage(error?.message || "The station list could not be loaded.");
          localStations = [];
          return localStations;
        });
    }
    return localLoading;
  }

  async function loadCountries() {
    if (countriesLoaded) {
      return;
    }
    countriesLoaded = true;
    try {
      const [codes, langs] = await Promise.all([rbCountries(), rbLanguages()]);
      const keepCountry = countrySelect.value;
      countrySelect.replaceChildren(new Option("Any country", ""), ...codes.map((c) => new Option(`${c.code} (${c.count})`, c.code)));
      countrySelect.value = keepCountry;
      const keepLanguage = languageSelect.value;
      languageSelect.replaceChildren(new Option("Any language", ""), ...langs.map((l) => new Option(`${l.name} (${l.count})`, l.name)));
      languageSelect.value = keepLanguage;
    } catch {
      countriesLoaded = false;
    }
  }

  // --- Table ----------------------------------------------------------------
  function sortedStations() {
    const list = stations;
    if (!sortColumn) {
      return list;
    }
    const column = columnsFor().find((c) => c.id === sortColumn);
    if (!column) {
      return list;
    }
    const direction = sortDescending ? -1 : 1;
    return [...list].sort((a, b) => {
      const left = column.sort(a);
      const right = column.sort(b);
      if (column.numeric) {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });
  }

  function sortBy(columnId) {
    if (sortColumn === columnId) {
      sortDescending = !sortDescending;
    } else {
      sortColumn = columnId;
      sortDescending = columnId === "bitrate";
    }
    renderRows();
  }

  function logoCell(station) {
    const icon = el("span", `ml-station-icon${favorites.has(station.url) ? " is-bookmarked" : ""}`);
    const src = station.favicon || station.logo || "";
    if (!src) {
      return icon;
    }
    const img = el("img", "ml-logo");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.src = src;
    img.addEventListener("error", () => img.replaceWith(icon), { once: true });
    return img;
  }

  function songRow(song, index, ordered) {
    const node = el("div", "ml-row is-song");
    node.setAttribute("role", "option");
    node.dataset.url = song.stationUrl;
    node.dataset.index = String(index);
    node.title = `${song.streamTitle}\n${song.station}\n${new Date(song.at).toLocaleString()}`;
    if (index % 2 === 1) node.classList.add("is-alt");
    const selected = selectedUrls.has(rowKey(song));
    node.classList.toggle("is-selected", selected);
    const name = el("div", "ml-td ml-col-name");
    name.append(el("span", "ml-station-icon is-song"), el("span", "ml-station-name", song.title || song.streamTitle));
    node.append(
      name,
      el("div", "ml-td ml-col-artist", song.artist || ""),
      el("div", "ml-td ml-col-station", song.station || ""),
      el("div", "ml-td ml-col-when", formatWhen(song.at))
    );
    attachRowEvents(node, song, index, ordered);
    return node;
  }

  // Songs are keyed by their row id; stations by url.
  const rowKey = (item) => (isSongsView() ? `song:${item.id ?? item.at}` : item.url);

  function row(station, index, ordered) {
    if (isSongsView()) {
      return songRow(station, index, ordered);
    }
    if (isMusicView()) {
      return musicRow(station, index);
    }
    const node = el("div", "ml-row");
    node.setAttribute("role", "option");
    node.dataset.url = station.url;
    node.dataset.index = String(index);
    node.title = stationTooltip(station);
    if (index % 2 === 1) {
      node.classList.add("is-alt");
    }
    const reason = blockedReason(station);
    if (reason) {
      node.classList.add("is-blocked");
    }
    const selected = selectedUrls.has(station.url);
    node.classList.toggle("is-selected", selected);
    node.setAttribute("aria-selected", selected ? "true" : "false");

    const genreNames = stationGenres(station);
    const name = el("div", "ml-td ml-col-name");
    name.append(logoCell(station), el("span", "ml-station-name", station.title));
    const current = getNowPlaying();
    const playingHere = current && current.station?.url === station.url ? current.streamTitle : "";
    if (playingHere) {
      node.classList.add("is-playing");
    }
    const fav = el("button", `ml-fav${favorites.has(station.url) ? " is-on" : ""}`, favorites.has(station.url) ? "\u2605" : "\u2606");
    fav.type = "button";
    fav.title = favorites.has(station.url) ? "Remove bookmark" : "Bookmark";
    fav.addEventListener("mousedown", (event) => event.stopPropagation());
    fav.addEventListener("click", (event) => {
      event.stopPropagation();
      favorites.toggle(station);
      if (navId === "bookmarks") {
        void load();
      } else {
        renderRows();
      }
    });
    node.append(
      name,
      el("div", "ml-td ml-col-genre", genreNames[0] ?? ""),
      el("div", "ml-td ml-col-nowplaying", playingHere),
      el("div", "ml-td ml-col-bitrate", station.bitrate ? `${station.bitrate} kbps` : ""),
      el("div", "ml-td ml-col-format", streamFormat(station)),
      (() => { const cell = el("div", "ml-td ml-col-fav"); cell.append(fav); return cell; })()
    );
    node.dataset.index = String(index);
    node.dataset.key = rowKey(station);
    return node;
  }

  function musicRow(song, index) {
    const node = el("div", "ml-row is-music");
    node.setAttribute("role", "option");
    node.dataset.url = song.url;
    node.dataset.index = String(index);
    node.title = song.artist ? `${song.artist} - ${song.title}` : song.title;
    if (index % 2 === 1) node.classList.add("is-alt");
    const selected = selectedUrls.has(song.url);
    node.classList.toggle("is-selected", selected);
    node.setAttribute("aria-selected", selected ? "true" : "false");
    const current = getNowPlaying();
    if (current && current.station?.url === song.url) node.classList.add("is-playing");
    const name = el("div", "ml-td ml-col-name");
    name.append(logoCell(song), el("span", "ml-station-name", song.title));
    const secs = Math.round(song.duration || 0);
    const length = secs ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : "";
    const on = favorites.has(song.url);
    const fav = el("button", `ml-fav${on ? " is-on" : ""}`, on ? "\u2605" : "\u2606");
    fav.type = "button";
    fav.title = on ? "Noņemt no favorītiem" : "Pievienot favorītiem";
    fav.addEventListener("mousedown", (event) => event.stopPropagation());
    fav.addEventListener("click", (event) => {
      event.stopPropagation();
      favorites.toggle(song);
      renderRows();
    });
    node.append(
      name,
      el("div", "ml-td ml-col-artist", song.artist || ""),
      el("div", "ml-td ml-col-length", length),
      (() => { const cell = el("div", "ml-td ml-col-fav"); cell.append(fav); return cell; })()
    );
    node.dataset.key = rowKey(song);
    return node;
  }

  /**
   * Row interactions are handled on the container, not on each row.
   *
   * selectRow() has to re-render the list (selection state drives the row
   * classes), and renderRows() replaces every row element. A listener attached
   * to a row therefore dies with it: the mousedown that triggers selection also
   * destroys the target, so the following mouseup, click and dblclick never
   * arrive — which is why double-clicking a station did nothing at all.
   *
   * The container outlives every render, so all four gestures are resolved from
   * the event target instead.
   */
  function rowFromEvent(event) {
    const node = event.target instanceof Element ? event.target.closest(".ml-row") : null;
    return node && rows.contains(node) ? node : null;
  }

  /**
   * Selection is applied on mouseup, not mousedown.
   *
   * A browser only produces `click` / `dblclick` when the element under the
   * pointer at mouseup is the same one that was under it at mousedown. Selecting
   * on mousedown re-renders the list and destroys that element, so the mouseup
   * lands on a node that no longer exists and neither click nor dblclick is ever
   * raised — the station list looked perfectly normal but was inert.
   *
   * mousedown therefore only records what was pressed; the re-render happens on
   * mouseup, after the click sequence has been resolved.
   */
  let pendingSelection = null;

  rows.addEventListener("mousedown", (event) => {
    const node = rowFromEvent(event);
    if (!node) return;
    const key = node.dataset.key;
    if (onPrefetch && node.classList.contains("is-music")) {
      const item = stations.find((s) => rowKey(s) === key);
      if (item) onPrefetch(item);
    }
    // A right-press on an already-selected row keeps the whole selection, so the
    // context menu can act on it.
    if (event.button === 2 && selectedUrls.has(key)) {
      pendingSelection = null;
      return;
    }
    pendingSelection = { index: Number(node.dataset.index), event };
  });

  rows.addEventListener("mouseup", (event) => {
    if (!pendingSelection || event.button !== 0) {
      pendingSelection = null;
      return;
    }
    const { index } = pendingSelection;
    pendingSelection = null;
    applySelection(index, sortedStations(), event);
  });

  rows.addEventListener("dblclick", (event) => {
    const node = rowFromEvent(event);
    if (!node) return;
    selectedUrls = new Set([node.dataset.key]);
    // The action is the directory's Config setting, defaulting to Play.
    if (doubleClickAction === "enqueue") {
      enqueueSelected();
    } else if (doubleClickAction === "bookmark") {
      bookmarkSelected();
    } else {
      playSelected();
    }
  });

  // Touch screens do not raise dblclick reliably: two taps on the same row
  // within half a second act as a double-click.
  rows.addEventListener("touchend", (event) => {
    const node = rowFromEvent(event);
    if (!node) return;
    const key = node.dataset.key;
    const now = Date.now();
    if (lastTap.url === key && now - lastTap.at < 500) {
      event.preventDefault();
      lastTap = { url: null, at: 0 };
      selectedUrls = new Set([key]);
      if (doubleClickAction === "enqueue") enqueueSelected();
      else if (doubleClickAction === "bookmark") bookmarkSelected();
      else playSelected();
      return;
    }
    lastTap = { url: key, at: now };
  }, { passive: false });

  rows.addEventListener("contextmenu", (event) => {
    const node = rowFromEvent(event);
    if (!node) return;
    event.preventDefault();
    const index = Number(node.dataset.index);
    const key = node.dataset.key;
    if (!selectedUrls.has(key)) {
      selectedUrls = new Set([key]);
      anchorIndex = index;
      renderRows();
    }
    openContextMenu(event.clientX, event.clientY);
  });

  function renderRows() {
    const ordered = sortedStations();
    rows.replaceChildren(...ordered.map((station, index) => row(station, index, ordered)));
    for (const [id, cell] of headCells) {
      const active = id === sortColumn;
      cell.classList.toggle("is-sorted", active);
      cell.querySelector(".ml-th-arrow").textContent = active ? (sortDescending ? "△" : "▽") : "";
      cell.setAttribute("aria-sort", active ? (sortDescending ? "descending" : "ascending") : "none");
    }
    moreButton.hidden = !(navId === "online" && hasMore);
    updateButtons();
  }

  /**
   * Apply a selection.
   *
   * The list re-render is deferred to the next task rather than run inside the
   * event handler: a browser only raises `click` and `dblclick` when the element
   * under the pointer at mouseup is still the same node that was there at
   * mousedown. Replacing the rows synchronously detaches that node while the
   * browser is still deciding, so the click sequence is dropped and the list
   * appears inert. Re-rendering after the current task lets the browser finish
   * the sequence first.
   */
  function applySelection(index, ordered, event) {
    const key = rowKey(ordered[index]);
    if (event.shiftKey && anchorIndex >= 0) {
      const [from, to] = [Math.min(anchorIndex, index), Math.max(anchorIndex, index)];
      selectedUrls = new Set(ordered.slice(from, to + 1).map(rowKey));
    } else if (event.ctrlKey || event.metaKey) {
      if (selectedUrls.has(key)) {
        selectedUrls.delete(key);
      } else {
        selectedUrls.add(key);
      }
      anchorIndex = index;
    } else {
      selectedUrls = new Set([key]);
      anchorIndex = index;
    }
    rows.focus({ preventScroll: true });
    scheduleRender();
  }

  let renderQueued = false;
  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    setTimeout(() => {
      renderQueued = false;
      renderRows();
    }, 0);
  }

  function moveSelection(delta, extend) {
    const ordered = sortedStations();
    if (ordered.length === 0) {
      return;
    }
    const current = anchorIndex >= 0 ? anchorIndex : -1;
    const next = Math.max(0, Math.min(ordered.length - 1, current + delta));
    if (extend && current >= 0) {
      const [from, to] = [Math.min(current, next), Math.max(current, next)];
      for (const item of ordered.slice(from, to + 1)) {
        selectedUrls.add(rowKey(item));
      }
    } else {
      selectedUrls = new Set([rowKey(ordered[next])]);
    }
    anchorIndex = next;
    renderRows();
    rows.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function setMessage(text) {
    message.textContent = text ?? "";
    message.hidden = !text;
  }

  function setStatus() {
    const count = stations.length;
    const noun = isSongsView()
      ? (count === 1 ? "song" : "songs")
      : customSources.get(navId)?.load
        ? (count === 1 ? "track" : "tracks")
        : (count === 1 ? "stream" : "streams");
    status.textContent = loading
      ? "Searching..."
      : `Found ${count} ${noun}`;
    updateButtons();
  }

  function updateButtons() {
    const selected = selectedStations();
    const playable = selected.filter((station) => !blockedReason(station));
    playButton.disabled = playable.length === 0;
    enqueueButton.disabled = playable.length === 0;
    bookmarkButton.disabled = selected.length === 0;
    const allBookmarked = selected.length > 0 && selected.every((station) => favorites.has(station.url));
    bookmarkButton.textContent = allBookmarked ? "Unbookmark" : "Bookmark";
  }

  // --- Actions --------------------------------------------------------------
  function playSelected() {
    const playable = selectedStations().filter((station) => !blockedReason(station));
    if (playable.length === 0) {
      return;
    }
    const [first, ...rest] = playable;
    if (first.source === "radio-browser") {
      reportPlay(first);
    }
    onPlay(first);
    for (const station of rest) {
      onEnqueue(station);
    }
    hide();
  }

  function enqueueSelected() {
    for (const station of selectedStations()) {
      if (!blockedReason(station)) {
        onEnqueue(station);
      }
    }
    setMessage("");
    status.textContent = `Enqueued ${selectedStations().length} ${selectedStations().length === 1 ? "stream" : "streams"}`;
  }

  function bookmarkSelected() {
    const selected = selectedStations();
    const allBookmarked = selected.every((station) => favorites.has(station.url));
    for (const station of selected) {
      if (favorites.has(station.url) === allBookmarked) {
        favorites.toggle(station);
      }
    }
    if (navId === "bookmarks") {
      void load();
    } else {
      renderRows();
    }
  }

  function copySelectedUrls() {
    const text = selectedStations().map((station) => station.url).join("\n");
    if (text && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  // --- Popups ---------------------------------------------------------------
  function closePopups() {
    filterPanel.hidden = true;
    contextMenu.hidden = true;
    filterButton.setAttribute("aria-expanded", "false");
  }

  function placePopup(popup, x, y) {
    const bounds = body.getBoundingClientRect();
    popup.hidden = false;
    const width = popup.offsetWidth;
    const height = popup.offsetHeight;
    const left = Math.max(0, Math.min(x - bounds.left, bounds.width - width - 2));
    const topPos = Math.max(0, Math.min(y - bounds.top, bounds.height - height - 2));
    popup.style.left = `${left}px`;
    popup.style.top = `${topPos}px`;
  }

  function openContextMenu(x, y) {
    const selected = selectedStations();
    if (selected.length === 0) {
      return;
    }
    const allBookmarked = selected.every((station) => favorites.has(station.url));
    const items = [
      ["Play", playSelected, selected.some((s) => !blockedReason(s))],
      ["Enqueue", enqueueSelected, selected.some((s) => !blockedReason(s))],
      [allBookmarked ? "Remove bookmark" : "Bookmark", bookmarkSelected, true],
      ["Copy stream address", copySelectedUrls, true]
    ];
    if (navId === "bookmarks" && selected.length === 1) {
      const [only] = selected;
      items.push(
        ["Rename...", () => {
          const name = window.prompt("Bookmark name", only.title);
          if (name != null) {
            favorites.rename(only.url, name);
            void load();
          }
        }, true],
        ["Move up", () => { favorites.move(only.url, -1); void load(); }, true],
        ["Move down", () => { favorites.move(only.url, 1); void load(); }, true]
      );
    }
    if (selected.length === 1 && selected[0].homepage) {
      items.push(["Open station website", () => window.open(selected[0].homepage, "_blank", "noopener"), true]);
    }
    contextMenu.replaceChildren(...items.map(([label, action, enabled]) => {
      const item = button("ml-menu-item", label);
      item.setAttribute("role", "menuitem");
      item.disabled = !enabled;
      item.addEventListener("click", () => {
        closePopups();
        action();
      });
      return item;
    }));
    filterPanel.hidden = true;
    placePopup(contextMenu, x, y);
  }

  function toggleFilterPanel() {
    if (!filterPanel.hidden) {
      closePopups();
      return;
    }
    contextMenu.hidden = true;
    if (navId === "online") {
      void loadCountries();
    } else {
      const codes = [...new Set(sourceStations().map((s) => s.country).filter(Boolean))].sort();
      const keep = countrySelect.value;
      countrySelect.replaceChildren(new Option("Any country", ""), ...codes.map((c) => new Option(c, c)));
      countrySelect.value = codes.includes(keep) ? keep : "";
      countriesLoaded = false;
    }
    const bounds = filterButton.getBoundingClientRect();
    placePopup(filterPanel, bounds.left, bounds.top - 4);
    filterPanel.style.top = `${bounds.top - body.getBoundingClientRect().top - filterPanel.offsetHeight - 4}px`;
    filterButton.setAttribute("aria-expanded", "true");
  }

  function updateFilterLabel() {
    const active = [filters.bitrateMin ? `${filters.bitrateMin}k+` : "", filters.format, filters.country, filters.language].filter(Boolean);
    filterButton.textContent = active.length > 0 ? `Filter: ${active.join(" ")} ▾` : "Filter ▾";
  }

  function applyFilters() {
    filters.bitrateMin = Number(bitrateSelect.value) || 0;
    filters.format = formatSelect.value;
    filters.country = countrySelect.value;
    filters.language = languageSelect.value;
    filters.order = sortSelect.value;
    updateFilterLabel();
    void load();
  }

  // --- Show / hide ----------------------------------------------------------
  function hide() {
    closePopups();
    overlay.hidden = true;
  }

  // Embedded mode: a Modern skin's <windowholder> hosts the library's
  // body directly (no floating frame), as Winamp's SUI hosts gen_ml.
  let embedHost = null;
  let viewLoaded = false;
  function embedInto(host) {
    embedHost = host;
    hide();
    host.classList.add("ml-embed");
    host.append(body);
    if (!viewLoaded) {
      void restoreView().then(() => load());
    }
  }
  function unembed() {
    if (!embedHost) return;
    embedHost.classList.remove("ml-embed");
    embedHost = null;
    closePopups();
    middleCenter.append(body);
  }

  async function restoreView() {
    viewLoaded = true;
    const view = readView();
    expanded = new Set(Array.isArray(view.expanded) ? view.expanded : ["Electronic"]);
    const restoredNav = navEntries.some((entry) => entry.id === view.nav) ? view.nav : navEntries[0].id;
    navId = restoredNav;
    for (const [key, item] of navItems) {
      item.classList.toggle("is-selected", key === navId);
      item.setAttribute("aria-selected", key === navId ? "true" : "false");
    }
    if (navId === "online" && view.genre) {
      for (const primary of genreTree) {
        if (primary.name === view.genre) genre = { name: primary.name, tag: primary.tag };
        const child = primary.children.find((node) => node.name === view.genre);
        if (child) genre = { name: child.name, tag: child.tag };
      }
    } else {
      genre = null;
    }
    sortColumn = navId === "online" || customSources.has(navId) ? null : "name";
    clearHistoryButton.hidden = navId !== "history" && navId !== "songs";
    buildHead(columnsFor());
    if (navId === "featured") {
      await ensureLocal();
    }
    renderGenres();
  }

  async function show() {
    if (embedHost) {
      // Already on screen inside the skin; nothing to pop up.
      return;
    }
    mount();
    overlay.hidden = false;
    restoreWindowPosition();
    await restoreView();
    await load();
    search.focus();
  }

  // --- Events ---------------------------------------------------------------
  // Search-as-you-type, debounced so the directory does not see every keystroke.
  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const remote = navId === "online" || Boolean(customSources.get(navId)?.search);
    searchTimer = setTimeout(() => void load(), remote ? 300 : 100);
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(searchTimer);
      void load();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      rows.focus();
      moveSelection(1, false);
    }
  });
  rows.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveSelection(1, event.shiftKey);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveSelection(-1, event.shiftKey);
        break;
      case "PageDown":
        event.preventDefault();
        moveSelection(12, event.shiftKey);
        break;
      case "PageUp":
        event.preventDefault();
        moveSelection(-12, event.shiftKey);
        break;
      case "Home":
        event.preventDefault();
        moveSelection(-stations.length, event.shiftKey);
        break;
      case "End":
        event.preventDefault();
        moveSelection(stations.length, event.shiftKey);
        break;
      case "Enter":
        event.preventDefault();
        if (event.shiftKey) {
          enqueueSelected();
        } else {
          playSelected();
        }
        break;
      case "a":
      case "A":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          selectedUrls = new Set(stations.map((s) => s.url));
          renderRows();
        }
        break;
      case "Delete":
      case "Backspace":
        if (navId === "bookmarks" && selectedStations().length > 0) {
          event.preventDefault();
          bookmarkSelected();
        }
        break;
      default:
        break;
    }
  });

  playButton.addEventListener("click", playSelected);
  enqueueButton.addEventListener("click", enqueueSelected);
  bookmarkButton.addEventListener("click", bookmarkSelected);
  moreButton.addEventListener("click", () => void load({ append: true }));
  filterButton.addEventListener("click", toggleFilterPanel);
  clearHistoryButton.addEventListener("click", async () => {
    await history.clear(navId === "songs" ? "songs" : "stations");
    void load();
  });
  languageSelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
  bitrateSelect.addEventListener("change", applyFilters);
  formatSelect.addEventListener("change", applyFilters);
  countrySelect.addEventListener("change", applyFilters);
  filterReset.addEventListener("click", () => {
    bitrateSelect.value = "0";
    formatSelect.value = "";
    countrySelect.value = "";
    languageSelect.value = "";
    sortSelect.value = "clickcount";
    applyFilters();
    closePopups();
  });

  closeButton.addEventListener("click", hide);
  closeButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      hide();
    }
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!filterPanel.hidden || !contextMenu.hidden) {
        closePopups();
      } else {
        hide();
      }
    }
  });
  overlay.addEventListener("mousedown", (event) => {
    if (!filterPanel.hidden && !filterPanel.contains(event.target) && event.target !== filterButton) {
      filterPanel.hidden = true;
      filterButton.setAttribute("aria-expanded", "false");
    }
    if (!contextMenu.hidden && !contextMenu.contains(event.target)) {
      contextMenu.hidden = true;
    }
  });
  // The library is a window of its own, like Winamp's: it is dragged by its
  // title bar and stays where it was left.
  let dragging = null;
  top.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || closeButton.contains(event.target)) {
      return;
    }
    event.preventDefault();
    const bounds = windowEl.getBoundingClientRect();
    dragging = { dx: event.clientX - bounds.left, dy: event.clientY - bounds.top };
    windowEl.classList.add("is-dragging");
  });
  window.addEventListener("mousemove", (event) => {
    if (!dragging) {
      return;
    }
    placeWindow(event.clientX - dragging.dx, event.clientY - dragging.dy);
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) {
      return;
    }
    dragging = null;
    windowEl.classList.remove("is-dragging");
    const view = readView();
    writeView({ ...view, left: windowEl.offsetLeft, top: windowEl.offsetTop });
  });
  window.addEventListener("resize", () => {
    if (!overlay.hidden && windowEl.classList.contains("is-placed")) {
      placeWindow(windowEl.offsetLeft, windowEl.offsetTop);
    }
  });

  function placeWindow(left, topPos) {
    const maxLeft = Math.max(0, overlay.clientWidth - windowEl.offsetWidth);
    const maxTop = Math.max(0, overlay.clientHeight - windowEl.offsetHeight);
    windowEl.style.left = `${Math.round(Math.min(Math.max(0, left), maxLeft))}px`;
    windowEl.style.top = `${Math.round(Math.min(Math.max(0, topPos), maxTop))}px`;
    windowEl.classList.add("is-placed");
  }

  function restoreWindowPosition() {
    const view = readView();
    if (Number.isFinite(view.left) && Number.isFinite(view.top)) {
      placeWindow(view.left, view.top);
      return;
    }
    // First open: where the host wants it, else next to the player windows, or
    // centred when there is no room.
    const overlayBounds = overlay.getBoundingClientRect();
    const wanted = getDefaultPosition?.({ width: windowEl.offsetWidth, height: windowEl.offsetHeight, overlay: overlayBounds });
    if (wanted) {
      placeWindow(wanted.left, wanted.top);
      return;
    }
    const player = document.querySelector("#main-window");
    const bounds = player?.getBoundingClientRect();
    if (bounds && bounds.right + windowEl.offsetWidth + 8 <= overlayBounds.width) {
      placeWindow(bounds.right - overlayBounds.left + 8, bounds.top - overlayBounds.top);
    } else {
      placeWindow((overlayBounds.width - windowEl.offsetWidth) / 2, (overlayBounds.height - windowEl.offsetHeight) / 2);
    }
  }

  // Refreshes the "Now Playing" column without reloading anything.
  function refreshNowPlaying() {
    if (overlay.hidden || isSongsView()) {
      return;
    }
    const current = getNowPlaying();
    for (const node of rows.querySelectorAll(".ml-row")) {
      const mine = current && node.dataset.url === current.station?.url;
      node.classList.toggle("is-playing", Boolean(mine));
      const cell = node.querySelector(".ml-col-nowplaying");
      if (cell) {
        cell.textContent = mine ? current.streamTitle : "";
      }
    }
  }

  // Opens the library on one node (the host's "search music" button), with
  // an optional search already typed in.
  async function showNode(id, term) {
    await show();
    if (id && navItems.has(id) && navId !== id) selectNav(id);
    if (typeof term === "string") search.value = term;
    await load();
    search.focus();
    search.select?.();
  }

  return {
    show,
    showNode,
    hide,
    embedInto,
    unembed,
    isEmbedded: () => Boolean(embedHost),
    get body() {
      return body;
    },
    isVisible: () => Boolean(embedHost) || (Boolean(overlay) && !overlay.hidden),
    refreshNowPlaying,
    render: () => void load(),
    get element() {
      return overlay;
    }
  };
}
