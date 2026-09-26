import "./rolldown-runtime-ly0BBW_k.js";
//#region src/radio.js
var e = new URL("data/radio.json", document.baseURI), t = null;
async function loadCatalogue() {
	if (!t) {
		let n = await fetch(e);
		if (!n.ok) throw Error(`Radio catalogue could not be loaded (HTTP ${n.status})`);
		t = await n.json();
	}
	return t;
}
async function listStations() {
	return (await loadCatalogue()).flatMap((e) => e.stations.map((t) => ({
		...t,
		groupId: e.id
	})));
}
var n = (() => {
	try {
		return !!document.createElement("audio").canPlayType("application/vnd.apple.mpegurl") || "MediaSource" in window;
	} catch {
		return !1;
	}
})();
function streamFormat(e) {
	let t = String(e.codec ?? "").trim().toUpperCase();
	if (t === "YOUTUBE") return "YouTube";
	if (t) return t === "AAC+" ? "AAC+" : t.replace("MPEG", "MP3").replace("UNKNOWN", "");
	let n = String(e.url ?? "").split(/[?#]/)[0].toLowerCase();
	return n.endsWith(".m3u8") || n.includes(".isml") ? "HLS" : n.endsWith(".aac") || n.includes("aac") ? "AAC" : n.endsWith(".ogg") || n.endsWith(".oga") ? "OGG" : n.endsWith(".opus") ? "OPUS" : n.endsWith(".flac") ? "FLAC" : n.endsWith(".mp3") || n.includes("mp3") ? "MP3" : "";
}
var r = !1, i = document.baseURI, a = /* @__PURE__ */ new Map();
async function detectStreamProxy(e = document.baseURI) {
	i = e.endsWith("/") ? e : `${e}/`;
	try {
		let e = await fetch(new URL("stream-proxy/ping", i), { cache: "no-store" });
		r = e.ok && (await e.json())?.ok === !0;
	} catch {
		r = !1;
	}
	return r;
}
var hasStreamProxy = () => r;
function streamUrl(e) {
	let t = streamFormat(e) === "HLS";
	return r && !t ? `${new URL("stream", i).href}?u=${encodeURIComponent(e.url)}` : e.url;
}
function stationForTrackUrl(e) {
	return a.get(e) ?? null;
}
function registerTrackStation(e, t) {
	a.set(e, t);
}
async function fetchNowPlaying(e) {
	if (!r) return null;
	try {
		let t = await fetch(`${new URL("stream-title", i).href}?u=${encodeURIComponent(e.url)}`, { cache: "no-store" });
		return t.ok ? await t.json() : null;
	} catch {
		return null;
	}
}
function blockedReason(e) {
	return window.location.protocol === "https:" && !e.https && !r ? "Plain http:// stream: browsers block this on a secure page." : streamFormat(e) === "HLS" && !n ? "HLS stream: this browser cannot play it." : null;
}
function isBlocked(e) {
	return blockedReason(e) !== null;
}
function toPlaylistTracks(e) {
	return e.map((e) => {
		let t = streamUrl(e);
		return a.set(t, e), {
			metaData: {
				artist: e.country || "Radio",
				title: e.title
			},
			defaultName: `${e.title} - ${e.country || "Radio"}`,
			url: t,
			duration: 0
		};
	});
}
//#endregion
export { isBlocked as a, stationForTrackUrl as c, hasStreamProxy as i, streamFormat as l, detectStreamProxy as n, listStations as o, fetchNowPlaying as r, registerTrackStation as s, blockedReason as t, toPlaylistTracks as u };
