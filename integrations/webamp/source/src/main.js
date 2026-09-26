import "./styles.css";
import { mountWebampRadio } from "./embed.js";

// The page is the player as Minka will host it: nothing but the bar at the
// bottom, mounted into #radioWindow exactly the way mountWebampRadio() is
// called inside Minka. The stations are
// Minka's own catalogue (data/minka/*.json: every Latvian station, every
// Radio Record channel, the featured world stations), in Minka's record
// format, handed over as-is. Inside Minka itself this is window.stationsList.
import { loadMinkaStations } from "./minkaStations.js";

let radio = null;
let stationsList = await loadMinkaStations({
  // The Radio Record refresh may land before the player is mounted.
  onUpdate: (rows) => {
    stationsList = rows;
    if (radio) radio.setStations(rows);
  }
});

// ?lowspec=1 / ?lowspec=0 forces the low-spec profile (default: auto-detect).
const lowspecParam = new URLSearchParams(location.search).get("lowspec");
radio = await mountWebampRadio(document.querySelector("#radioWindow"), {
  stations: stationsList,
  stationsName: "Minka stations",
  libraryNodes: ["online", "featured", "bookmarks", "history", "songs"],
  // The Winamp windows are the user's to arrange anywhere on the page.
  lockWindows: false,
  lowSpec: lowspecParam == null ? "auto" : lowspecParam === "1",
  // Online Music: a browser-restricted YouTube Data API key (.env.local, see
  // .env.example). Without a key or playlist id the node shows the bundled
  // fallback list; nothing YouTube is loaded until a track is played.
  youtube: {
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY ?? "",
    defaultPlaylistId: import.meta.env.VITE_YOUTUBE_DEFAULT_PLAYLIST_ID ?? "",
    defaultPlaylistTitle: "WORK"
  }
});

window.radio = radio;
// Rows refreshed while mounting: apply now.
radio.setStations(stationsList);

// --- PWA plumbing ---------------------------------------------------------

let registration = null;
const status = document.querySelector("#pwa-status");

function setStatus(message) {
  if (status) {
    status.textContent = message;
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.__installPrompt = event;
});

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return null;
  }
  try {
    return await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch {
    return null;
  }
}

async function install() {
  const prompt = window.__installPrompt;
  if (!prompt) {
    setStatus('Use your browser menu and choose "Install app" or "Add to Home Screen".');
    return;
  }
  prompt.prompt();
  const choice = await prompt.userChoice;
  if (choice.outcome === "accepted") {
    window.__installPrompt = null;
  }
}

registration = await registerServiceWorker();

document.querySelector("#install-app")?.addEventListener("click", install);
document.querySelector("#reload-app")?.addEventListener("click", async () => {
  await registration?.update().catch(() => {});
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  } else {
    window.location.reload();
  }
});
