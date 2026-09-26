// The equalizer's AUTO button.
//
// In Winamp, AUTO loaded a saved preset for each song as it started. Webamp
// draws the button but never lets it switch on ("We don't actually support
// this feature yet"). This implements it for radio: when AUTO is lit, every
// station that starts gets the built-in Winamp preset that fits its genre,
// and stations without a recognisable genre get a flat EQ.

import { eqPresets } from "./eqPresets.js";
import { stationForTrackUrl } from "./radio.js";

const storageKey = "webamp.eq.auto.v1";
const BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const FLAT = 50; // 0 dB on Webamp's 0-100 store scale

// First matching rule wins, so the specific genres come before the broad ones.
const RULES = [
  [/classical|opera|symphon|baroque|chamber|choral|orchestr|piano/i, "Classical"],
  [/techno|trance|hardstyle|hardcore|industrial|hard house|psy/i, "Techno"],
  [/house|club|edm|dance|disco|eurodance|italo|electro|breakbeat|jungle|drum|dubstep|garage/i, "Dance"],
  [/hip.?hop|rap|trap|urban|r&b|rnb|grime|bass/i, "Full Bass"],
  [/reggae|dancehall|dub\b|roots/i, "Reggae"],
  [/\bska\b/i, "Ska"],
  [/metal|punk|grunge|hard rock|rock|alternative|indie|emo|goth/i, "Rock"],
  [/ambient|chill|lounge|downtempo|new age|easy listening|relax|meditation|sleep|smooth/i, "Soft"],
  [/country|folk|americana|bluegrass|acoustic|singer/i, "Soft Rock"],
  [/latin|salsa|reggaeton|cumbia|merengue|bachata|samba|party|carnival/i, "Party"],
  [/jazz|blues|soul|funk|motown|swing|gospel/i, "Live"],
  [/talk|news|sport|comedy|spoken|podcast|religio|sermon|christian|educat/i, "Laptop speakers/headphones"],
  [/pop|top 40|hits|chart|oldies|\d0s|adult contemporary|schlager|variety/i, "Pop"]
];

export function presetForGenres(genres) {
  const haystack = genres.filter(Boolean).join(" ");
  for (const [pattern, name] of RULES) {
    if (pattern.test(haystack)) {
      return eqPresets.find((preset) => preset.name === name) ?? null;
    }
  }
  return null;
}

export function createEqAuto({ webamp, onApplied }) {
  let enabled = false;
  try {
    enabled = localStorage.getItem(storageKey) === "1";
  } catch {}

  function setEnabled(value) {
    enabled = value;
    webamp.store.dispatch({ type: "SET_EQ_AUTO", value });
    try {
      localStorage.setItem(storageKey, value ? "1" : "0");
    } catch {}
    if (value) {
      applyForCurrentTrack();
    }
  }

  // Preset values are on Winamp's 1..64 .eqf scale; Webamp's store keeps 0..100.
  const toStore = (value) => Math.round(((value - 1) / 63) * 100);

  function applyPreset(preset) {
    for (const band of BANDS) {
      webamp.store.dispatch({ type: "SET_BAND_VALUE", band, value: preset ? toStore(preset[`hz${band}`]) : FLAT });
    }
    webamp.store.dispatch({ type: "SET_BAND_VALUE", band: "preamp", value: preset ? toStore(preset.preamp) : FLAT });
    if (!webamp.store.getState().equalizer.on) {
      webamp.store.dispatch({ type: "SET_EQ_ON" });
    }
    onApplied?.(preset);
  }

  function applyForCurrentTrack() {
    if (!enabled) {
      return;
    }
    const state = webamp.store.getState();
    const id = state.playlist.currentTrack;
    const track = id == null ? null : state.tracks[id];
    if (!track) {
      return;
    }
    const station = stationForTrackUrl(track.url);
    const genres = station
      ? [station.genre, ...(station.tags ?? []), station.title]
      : [track.title, track.artist, track.album];
    applyPreset(presetForGenres(genres));
  }

  // Webamp's own handler forces auto off, so the click is taken over here
  // before React sees it.
  document.addEventListener("click", (event) => {
    const auto = event.target instanceof Element ? event.target.closest("#equalizer-window #auto") : null;
    if (!auto) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    setEnabled(!enabled);
  }, true);

  webamp.onTrackDidChange(() => applyForCurrentTrack());

  if (enabled) {
    webamp.store.dispatch({ type: "SET_EQ_AUTO", value: true });
  }

  return {
    isEnabled: () => enabled,
    setEnabled,
    apply: applyForCurrentTrack
  };
}
