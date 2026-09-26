// Minka (RG) bridge: mounts the player in Minka's #radioWindow and wires it
// to what Minka already has - its station catalogue, its profile favorites
// and its now-playing events - so the rest of Minka keeps working unchanged.
//
//   import { mountMinkaRadio } from "./webamp-radio/webamp-radio.js";
//   const radio = await mountMinkaRadio(document.querySelector("#radioWindow"), {
//     assetsBase: "./webamp-radio/"      // where dist-embed/ was copied
//   });
//
// Minka side (radio.js / media-profile.js), as found in the repository:
//   stationsList            the merged catalogue (a top-level `let`, so it is
//                           read as a global binding, never window.stationsList)
//   "rg-stations-ready"     window event after every catalogue change
//   radioStationKey(s)      catalogKey || "lv:"/"record:" + title (lower, lv-LV)
//   window.rgStations       { list(), play(key), startInitial(), startFavorite() }
//   window.__mkUnifiedMedia { getSession(), isLoaded(), getRadio().favorites,
//                             change({type:"favorite-add"|"favorite-remove", id}) }
//   "media-profile-change"  document event, detail.radio.favorites (keys)
//   "rg-now-playing-art"    document event, detail {artist, title, coverUrl}
//
// One player: Minka's own `audio` in radio.js must not be started while this
// is mounted (`takeOverRgStations` points window.rgStations.play here so the
// station picker, favorites start and deep links play through Webamp).

import { mountWebampRadio } from "./embed.js";

const PROFILE_EVENT = "media-profile-change";
const STATIONS_EVENT = "rg-stations-ready";

/** Minka's list, wherever it lives (Minka declares it with `let`). */
function readMinkaStations() {
  try {
    // eslint-disable-next-line no-undef
    if (typeof stationsList !== "undefined" && Array.isArray(stationsList)) return stationsList;
  } catch {
    // not defined
  }
  return Array.isArray(window.stationsList) ? window.stationsList : null;
}

/** The key Minka's favorites use for one of our stations. */
export function stationKey(station) {
  if (!station) return "";
  if (station.hostKey) return station.hostKey;
  if (station.uuid) return `rb:${station.uuid}`;
  return "";
}

/**
 * @param {HTMLElement} container   Minka's #radioWindow (or any element)
 * @param {object} [options]        mountWebampRadio options, plus:
 *   stations            initial list (default: Minka's stationsList)
 *   syncStations        follow "rg-stations-ready" (default true)
 *   syncFavorites       two-way favorites with the Minka profile (default true)
 *   emitNowPlaying      dispatch "rg-now-playing-art" (default true)
 *   takeOverRgStations  make window.rgStations.play/list use this player (default true)
 */
export async function mountMinkaRadio(container, options = {}) {
  const {
    stations = readMinkaStations() ?? [],
    syncStations = true,
    syncFavorites = true,
    emitNowPlaying = true,
    takeOverRgStations = true,
    ...playerOptions
  } = options;

  const radio = await mountWebampRadio(container, {
    stationsName: "Minka stations",
    libraryNodes: ["online", "featured", "bookmarks", "history", "songs"],
    ...playerOptions,
    stations
  });
  const cleanups = [];

  // --- stations -----------------------------------------------------------
  const applyStations = () => {
    const rows = readMinkaStations();
    if (rows) radio.setStations(rows);
  };
  if (syncStations) {
    window.addEventListener(STATIONS_EVENT, applyStations);
    cleanups.push(() => window.removeEventListener(STATIONS_EVENT, applyStations));
  }

  const findByKey = (key) => (radio.getStations?.() ?? []).find((s) => stationKey(s) === key) ?? null;

  // --- favorites ----------------------------------------------------------
  // The Minka profile is the source of truth while someone is logged in:
  // its list (keys, in its order) replaces ours on every profile change, and
  // a star toggled in the Media Library is sent back as a profile operation.
  // Logged out, bookmarks stay local, as Minka's own star does nothing then.
  const profile = () => window.__mkUnifiedMedia ?? null;
  const profileReady = () => Boolean(profile()?.getSession?.() && profile()?.isLoaded?.());
  let syncing = false;

  const pullFavorites = () => {
    if (!profileReady()) return;
    const keys = profile().getRadio?.()?.favorites ?? [];
    const ours = radio.favorites.list();
    syncing = true;
    try {
      // Drop keyed entries the profile no longer has, add the missing ones,
      // then take the profile's order (entries without a key keep their place
      // at the end).
      for (const entry of ours) {
        const key = stationKey(entry);
        if (key && !keys.includes(key)) radio.favorites.remove(entry.url);
      }
      for (const key of keys) {
        if (radio.favorites.list().some((e) => stationKey(e) === key)) continue;
        const station = findByKey(key);
        if (station) radio.favorites.add(station);
      }
      const byKey = new Map(radio.favorites.list().map((e) => [stationKey(e), e.url]));
      radio.favorites.reorder(keys.map((k) => byKey.get(k)).filter(Boolean));
    } finally {
      syncing = false;
    }
  };

  const pushFavorites = (list) => {
    if (syncing || !profileReady()) return;
    const p = profile();
    const theirs = p.getRadio?.()?.favorites ?? [];
    const keys = list.map(stationKey).filter(Boolean);
    for (const key of keys) {
      if (!theirs.includes(key)) p.change?.({ type: "favorite-add", id: key });
    }
    for (const key of theirs) {
      if (!keys.includes(key)) p.change?.({ type: "favorite-remove", id: key });
    }
  };

  if (syncFavorites) {
    document.addEventListener(PROFILE_EVENT, pullFavorites);
    window.addEventListener(STATIONS_EVENT, pullFavorites);
    cleanups.push(() => document.removeEventListener(PROFILE_EVENT, pullFavorites));
    cleanups.push(() => window.removeEventListener(STATIONS_EVENT, pullFavorites));
    cleanups.push(radio.favorites.subscribe(pushFavorites));
    pullFavorites();
  }

  // --- now playing --------------------------------------------------------
  if (emitNowPlaying) {
    const announce = (now) => {
      const station = radio.getCurrentStation?.();
      document.dispatchEvent(new CustomEvent("rg-now-playing-art", {
        detail: {
          artist: now?.artist ?? "",
          title: now?.title ?? now?.streamTitle ?? station?.title ?? "",
          coverUrl: now?.artwork ?? now?.cover ?? station?.logo ?? "",
          stationKey: stationKey(station)
        }
      }));
    };
    cleanups.push(radio.on("nowplaying", announce));
    cleanups.push(radio.on("artwork", announce));
  }

  // --- rgStations ---------------------------------------------------------
  const play = (key) => {
    const station = findByKey(key);
    if (!station) return false;
    radio.play(station);
    return true;
  };
  if (takeOverRgStations) {
    const previous = window.rgStations;
    window.rgStations = {
      ...(previous ?? {}),
      list: () => (radio.getStations?.() ?? []).map((s) => ({ key: stationKey(s), title: s.title })),
      play,
      startInitial: () => {
        if (radio.getCurrentStation?.()) {
          radio.resume?.();
          return true;
        }
        const list = radio.getStations?.() ?? [];
        const remix = list.find((s) => s.group !== "world" && s.group !== "latvija" && String(s.title).trim().toLowerCase() === "remix");
        const first = remix ?? list[0];
        if (!first) return false;
        radio.play(first);
        return true;
      },
      startFavorite: (favorites) => {
        for (const key of favorites ?? []) if (play(key)) return true;
        return false;
      }
    };
    cleanups.push(() => {
      if (window.rgStations && window.rgStations.play === play) window.rgStations = previous;
    });
  }

  return {
    ...radio,
    stationKey,
    playKey: play,
    syncFavorites: pullFavorites,
    dispose: () => {
      for (const cleanup of cleanups.splice(0)) {
        try {
          cleanup();
        } catch (error) {
          console.error(error);
        }
      }
      radio.dispose();
    }
  };
}
