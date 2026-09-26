import "./rolldown-runtime-ly0BBW_k.js";
import { c as e } from "./radio-Bv3-HvbG.js";
//#region src/modern/webampClassicAudioAdapter.js
var t = [
	60,
	170,
	310,
	600,
	1e3,
	3e3,
	6e3,
	12e3,
	14e3,
	16e3
], n = Object.fromEntries(t.map((e, t) => [String(t + 1), e])), r = {
	PLAYING: "playing",
	PAUSED: "paused",
	STOPPED: "stopped"
}, Emitter = class {
	constructor() {
		this._listeners = /* @__PURE__ */ new Map();
	}
	on(e, t) {
		return this._listeners.has(e) || this._listeners.set(e, /* @__PURE__ */ new Set()), this._listeners.get(e).add(t), () => this.off(e, t);
	}
	off(e, t) {
		this._listeners.get(e)?.delete(t);
	}
	trigger(e, ...t) {
		for (let n of this._listeners.get(e) ?? []) try {
			n(...t);
		} catch (e) {
			console.error(e);
		}
	}
};
function createWebampClassicAudioAdapter(e) {
	let i = e.store, a = e.media, o = a?._source?._audio ?? null, s = new Emitter(), c = new Emitter(), l = {
		at: 0,
		value: 0
	}, u = null, state = () => i.getState(), normalizeKind = (e) => String(e).toLowerCase(), bandFor = (e) => e === "preamp" ? "preamp" : n[e], d = {
		status: null,
		second: -1,
		volume: null,
		balance: null,
		sliders: null,
		eqOn: null,
		timeMode: null,
		albumArt: null
	}, f = i.subscribe(() => {
		let e = state(), { media: n, equalizer: r } = e;
		n.status !== d.status && (d.status = n.status, s.trigger(n.status === "PLAYING" ? "play" : n.status === "PAUSED" ? "pause" : "stop"), s.trigger("statchanged"), s.trigger("timeupdate"));
		let i = Math.floor(n.timeElapsed || 0);
		(i !== d.second || n.timeMode !== d.timeMode) && (d.second = i, d.timeMode = n.timeMode, s.trigger("timeupdate")), n.volume !== d.volume && (d.volume = n.volume, s.trigger("volumechanged")), n.balance !== d.balance && (d.balance = n.balance, s.trigger("balancechange"));
		let a = e.playlist.currentTrack, o = a == null ? null : e.tracks[a]?.albumArtUrl ?? null;
		if (o !== d.albumArt && (d.albumArt = o, s.trigger("albumartchanged")), r.sliders !== d.sliders) {
			let e = d.sliders;
			d.sliders = r.sliders;
			for (let [n, i] of Object.entries(r.sliders)) if (!e || e[n] !== i) {
				let e = n === "preamp" ? "preamp" : String(t.indexOf(Number(n)) + 1);
				c.trigger(e);
			}
		}
		r.on !== d.eqOn && (d.eqOn = r.on, s.trigger("eqenabledchanged"));
	}), p = {
		on: (e, t) => s.on(e, t),
		off: (e, t) => s.off(e, t),
		trigger: (e, ...t) => s.trigger(e, ...t),
		play: () => e.play(),
		pause: () => e.pause(),
		stop: () => e.stop(),
		seekTo: (t) => e.seekToTime(t),
		seekToPercent: (e) => {
			i.dispatch({
				type: "SEEK_TO_PERCENT_COMPLETE",
				percent: Math.max(0, Math.min(1, e)) * 100
			});
		},
		setAudioSource: () => {
			console.warn("Modern skin asked to set an audio source; use the classic playlist instead.");
		},
		toggleRemainingTime: () => i.dispatch({ type: "TOGGLE_TIME_MODE" }),
		get _timeRemaining() {
			return state().media.timeMode === "REMAINING";
		},
		getCurrentTime: () => {
			let e = state().media, t = e.timeElapsed || 0;
			return e.timeMode === "REMAINING" && e.length ? t - e.length : t;
		},
		getCurrentTimePercent: () => {
			let e = state().media;
			return e.length ? (e.timeElapsed || 0) / e.length : 0;
		},
		getLength: () => state().media.length || 0,
		getState: () => {
			let e = state().media.status;
			return e === "PLAYING" ? r.PLAYING : e === "PAUSED" ? r.PAUSED : r.STOPPED;
		},
		get _isStop() {
			return state().media.status === "STOPPED";
		},
		getVolume: () => (state().media.volume ?? 100) / 100,
		setVolume: (e) => {
			let t = Math.round(Math.max(0, Math.min(1, e)) * 100);
			t !== state().media.volume && i.dispatch({
				type: "SET_VOLUME",
				volume: t
			});
		},
		getBalance: () => (state().media.balance ?? 0) / 100,
		setBalance: (e) => {
			let t = Math.round(Math.max(-1, Math.min(1, e)) * 100);
			t !== state().media.balance && i.dispatch({
				type: "SET_BALANCE",
				balance: t
			});
		},
		getPlaybackRate: () => o?.playbackRate ?? 1,
		setPlaybackRate: (e) => {
			o && (o.playbackRate = Math.max(.5, Math.min(4, e))), s.trigger("playbackratechange");
		},
		getEq: (e) => {
			let t = bandFor(normalizeKind(e)), n = t == null ? void 0 : state().equalizer.sliders[t];
			return n == null ? .5 : n / 100;
		},
		setEq: (e, t) => {
			let n = bandFor(normalizeKind(e));
			n != null && i.dispatch({
				type: "SET_BAND_VALUE",
				band: n,
				value: Math.round(Math.max(0, Math.min(1, t)) * 100)
			});
		},
		onEqChange: (e, t) => c.on(normalizeKind(e), t),
		getEqEnabled: () => !!state().equalizer.on,
		setEqEnabled: (e) => i.dispatch({ type: e ? "SET_EQ_ON" : "SET_EQ_OFF" }),
		get _eqEnabled() {
			return !!state().equalizer.on;
		},
		getTrackInfo: () => {
			let e = state(), t = e.playlist.currentTrack, n = t == null ? null : e.tracks[t];
			if (!n) return {};
			let r = Number.parseInt(n.kbps, 10), i = Number.parseFloat(n.khz), a = {};
			Number.isFinite(r) && r > 0 && (a.bitrate = r), Number.isFinite(i) && i > 0 && (a.sampleRate = i * 1e3), Number.isFinite(n.channels) && n.channels > 0 && (a.channels = n.channels), n.title && (a.title = n.title), n.artist && (a.artist = n.artist), n.album && (a.album = n.album);
			let o = p.getStationInfo?.() ?? null;
			return o && (a.isStream = !0, a.streamName = o.title ?? "", a.streamTitle = o.streamTitle ?? "", o.genre && (a.genre = o.genre), !a.title && o.title && (a.title = o.title)), a;
		},
		getStationInfo: null,
		getAnalyser: () => a.getAnalyser(),
		get _vuMeter() {
			let e = performance.now();
			if (e - l.at < 16) return l.value;
			let t = a.getAnalyser();
			(!u || u.length !== t.fftSize) && (u = new Float32Array(t.fftSize)), t.getFloatTimeDomainData(u);
			let n = 0;
			for (let e = 0; e < u.length; e++) n += u[e] * u[e];
			return l = {
				at: e,
				value: Math.sqrt(n / u.length)
			}, l.value;
		},
		get _albumArtUrl() {
			let e = i.getState(), t = e.playlist.currentTrack;
			return t == null ? null : e.tracks[t]?.albumArtUrl ?? null;
		},
		get albumArtUrl() {
			return this._albumArtUrl;
		},
		onCurrentTimeChange: (e) => s.on("timeupdate", e),
		onAlbumArtChange: (e) => s.on("albumartchanged", e),
		onSeek: (e) => {
			if (!o) return () => {};
			let handler = () => e();
			return o.addEventListener("seeked", handler), () => o.removeEventListener("seeked", handler);
		},
		onVolumeChanged: (e) => s.on("volumechanged", e),
		onBalanceChanged: (e) => s.on("balancechange", e),
		dispose: () => f()
	};
	return p;
}
//#endregion
//#region src/modern/webampPlaylistProvider.js
function formatLength(e) {
	if (!Number.isFinite(e) || e <= 0) return "";
	let t = Math.round(e), n = Math.floor(t / 60), r = t % 60;
	return `${n}:${String(r).padStart(2, "0")}`;
}
function trackTitle(t) {
	return t ? t.title ? t.artist ? `${t.artist} - ${t.title}` : t.title : e(t.url)?.title ?? t.defaultName ?? "" : "";
}
function createWebampPlaylistProvider(e) {
	let t = e.store, n = /* @__PURE__ */ new Set(), r = null, i = null, a = null, tracksInOrder = () => {
		let { playlist: e, tracks: n } = t.getState();
		return e.trackOrder.map((e) => n[e]).filter(Boolean);
	}, o = t.subscribe(() => {
		let { playlist: e, tracks: o } = t.getState();
		if (e.trackOrder !== r || e.currentTrack !== i || o !== a) {
			r = e.trackOrder, i = e.currentTrack, a = o;
			for (let e of n) try {
				e();
			} catch (e) {
				console.error(e);
			}
		}
	});
	return {
		getNumTracks: () => t.getState().playlist.trackOrder.length,
		getCurrentIndex: () => {
			let { playlist: e } = t.getState();
			return e.currentTrack == null ? -1 : e.trackOrder.indexOf(e.currentTrack);
		},
		getTitle: (e) => trackTitle(tracksInOrder()[e]),
		getLength: (e) => formatLength(tracksInOrder()[e]?.duration),
		playTrack: (e) => {
			let n = t.getState().playlist.trackOrder[e];
			n != null && t.dispatch({
				type: "PLAY_TRACK",
				id: n
			});
		},
		onChange: (e) => (n.add(e), () => n.delete(e)),
		dispose: () => o()
	};
}
//#endregion
//#region src/vendor/webamp-modern/css/elements.css?raw
var i = "textarea,\ngroup,\ntext,\ninput,\nselect {\n  font-size: 10.5px;\n  user-select: none;\n}\ntextarea:focus,\ninput:focus,\nselect:focus {\n  outline: none;\n}\n#ui-root select {\n  background-color: transparent;\n  color: var(--color-studio-list-text, var(--color-wasabi-list-text));\n}\nselect option {\n  padding-left: 5px;\n  width: 300%;\n}\nselect option[selected] {\n  font-weight: bold;\n}\nselect::before {\n  padding-left: 5px;\n  content: var(--colheader, none);\n  display: block;\n  position: sticky;\n  top: var(--colheadertop, 0);\n  left: 0;\n  background-color: black;\n  color: silver;\n}\n.webamp--img {\n  background-image: var(--background-image);\n  background-position: top 0 left 0;\n}\n/* A layer or button whose size differs from its bitmap shows the bitmap\n   stretched to its rect (Wasabi Layer::onPaint / ButtonWnd::onPaint), never\n   tiled: Bento's 15 px sysmenu bitmap in a 20 px button. A layer with\n   tile=\"1\" tiles. */\nlayer.webamp--img,\nbutton.webamp--img,\ntogglebutton.webamp--img {\n  background-size: 100% 100%;\n  background-repeat: no-repeat;\n}\nlayer.webamp--img.tile {\n  background-size: auto;\n  background-repeat: repeat;\n}\n.webamp--img:active {\n  background-image: var(--down-background-image, var(--background-image));\n}\n.webamp--img:hover {\n  background-image: var(--hover-background-image, var(--background-image));\n}\n\n/* TODO: Should this fallback to hover? */\n.webamp--img:hover:active {\n  background-image: var(--down-background-image, var(--background-image));\n}\n\n.webamp--img.active {\n  background-image: var(--active-background-image, var(--background-image));\n}\n\nbutton {\n  border: none;\n  background: transparent;\n  padding: 0;\n}\nslider {\n  overflow: hidden;\n  --thumb-left: 0px;\n  --thumb-top: 0px;\n  outline: none;\n}\nslider > div {\n  display: none;\n}\nslider::after {\n  content: \"\";\n  position: absolute;\n  left: var(--thumb-left);\n  top: var(--thumb-top);\n  width: var(--thumb-width);\n  height: var(--thumb-height);\n  background-image: var(--thumb-background-image);\n  pointer-events: none;\n}\nslider:hover:after {\n  background-image: var(\n    --thumb-hover-background-image,\n    var(--thumb-background-image)\n  );\n}\n/* slider:active:after { */\nslider:active:after,\n.eq-surf slider:focus:after {\n  background-image: var(\n    --thumb-down-background-image,\n    var(--thumb-background-image)\n  );\n}\ntext {\n  overflow: hidden;\n  box-sizing: border-box;\n  text-align: center;\n  /* padding: 2px; */\n  --valign: center;\n}\ntext i {\n  pointer-events: none;\n  font-style: normal;\n}\ntext wrap {\n  display: block;\n  /* white-space: nowrap; */\n  background-image: inherit;\n  background-size: 0px;\n  position: relative;\n  /* line-height: 1; */\n  height: 100%;\n  width: var(--full-width);\n  min-width: 100%;\n  font-family: monospace;\n  white-space: pre;\n}\ntext wrap {\n  margin-left: 2px;\n}\ntext wrap[font=\"TrueType\"] {\n  /* The <text> sets font-family/size from the skin; the wrapper must inherit\n     them (the generic wrap rule above is monospace, meant for bitmap glyph\n     spans) and aligns the single line inside the box like the bitmap-font\n     wrapper does. */\n  font-family: inherit;\n  display: flex;\n  align-items: var(--valign, center);\n  justify-content: var(--align, center);\n  text-align: var(--align, center);\n}\ntext wrap[font=\"BitmapFont\"] {\n  display: flex;\n  white-space: nowrap;\n  /* vertical align: */\n  /* align-items: center; */\n  align-items: var(--valign, center);\n  justify-content: var(--align, center);\n}\ntext span {\n  user-select: none;\n  pointer-events: none;\n  /* display: inline-block; */\n  background-image: inherit;\n  /* vertical-align: bottom; */\n  color: transparent;\n  width: var(--charwidth);\n  height: var(--charheight);\n  margin-right: var(--hspacing, 0);\n  background-position-x: var(--x);\n  background-position-y: var(--y);\n  overflow: hidden;\n  flex-shrink: 0;\n  background-repeat-x: no-repeat;\n}\n/* body > div *  */\ncontainer {\n  position: absolute;\n}\nmenu {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.popup hr {\n  margin-block-start: 3px;\n  margin-block-end: 3px;\n  border-bottom: none;\n}\n/* frame2 {\n  box-shadow: inset 0 0 5px red;\n} */\n\n/* Lets register all supported tag's default property here: */\nalbumart,\nanimatedlayer,\nbutton,\ncolorthemeslist,\ncomponentbucket,\neqvis,\ngrid,\ngroup,\nlayer,\nlayout,\nprogressgrid,\nslider,\nstatus,\ntext,menu,frame2,\nvis,\nwasabiframe,\nwasabititlebar,\nwindowholder\n{\n  position: absolute;\n  left: 0;\n  top: 0;\n  display: block;\n  /* overflow: hidden; */\n}\ngroup {\n  overflow: visible;\n}\nalbumart {\n  /* background-size: cover; */\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center!important;\n}\nwasabititlebar {\n  text-align: center;\n}\ngrid,\nprogressgrid {\n  display: flex;\n}\ngrid *,\nprogressgrid * {\n  height: 100%;\n  background-image: var(--background-image);\n}\ngrid middle {\n  flex-grow: 1;\n}\ncomponentbucket {\n  overflow: hidden;\n}\ncomponentbucket > wrapper {\n  display: flex;\n  position: absolute;\n  left: 0;\n  top: 0;\n  height: 100%;\n  width: auto;\n  transition: top 0.5s, left 0.5s;\n}\ncomponentbucket.vertical > wrapper {\n  flex-direction: column;\n  height: auto;\n  width: 100%;\n}\ncomponentbucket > wrapper > group {\n  position: relative;\n}\ngroup.x-fade > * {\n  transition: opacity var(--fade-in-speed, 0.5);\n}\ngroup.x-fade > .fading-out {\n  transition: opacity var(--fade-out-speed, 0.25);\n}\n\nvis > canvas {\n  display: block;\n}\nanimatedlayer {\n  background-repeat: no-repeat;\n}\n.autowidthsource {\n  width: auto;\n}\n\n/* .pl {\n        background: white;\n        color: black;\n      } */\n\n/* titleBar active state */\n[inactivealpha=\"0\"] {\n  opacity: 0;\n}\n[inactivealpha=\"128\"] {\n  opacity: 0.5;\n}\ncontainer:focus-within [activealpha=\"0\"],\ncontainer:active [activealpha=\"0\"] {\n  opacity: 0;\n}\ncontainer:focus-within [inactivealpha],\ncontainer:active [inactivealpha] {\n  opacity: 1;\n}\ncontainer:not(:active):not(container:focus-within) .webamp--img.inactivable {\n  background-image: var(--inactive-background-image, var(--background-image));\n}\n\n.resizing {\n  position:fixed; \n  border: 1px solid blue;\n  background-color: rgba(74, 74, 251, 0.205);\n  z-index: 1000;\n  box-sizing: border-box;\n  transition: width 0.1s, height 0.1s, left 0.1s, top 0.1s;\n}\n\n\n#wasabi\\.menubar,\n#wasabi\\.menubar\\.pl,\n#wasabi\\.menubar\\.ml {\n  background: var(--color-wasabi-window-background);\n}\n\n\nmenu {\n  /* pointer-events: unset; */\n  overflow: visible;\n}\n/* FAKE POPUP */\n.fake-popup {\n  width: 200px;\n  height: 300px;\n  background-color: yellow;\n  z-index: 1000;\n}\nmenu > .popup{\n  position: absolute;\n  left: 0;\n  top: 100%;\n  display: none;\n}\n.open > .popup{\n  display: block;\n}\n\n.popup-menu-container{\n  position: absolute;\n  margin: 0;\n  background: white;\n  /* Own colours: the menu is rendered at body level and must not inherit a\n     dark host page's text colour. */\n  color: #000;\n  padding: 0;\n  /* border: 2px solid gray; */\n  border: 1px solid #C9CCD2;\n  z-index: 100;\n  width: auto;\n  display: inline-block;\n  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);\n  font-size: 10.5px;\n}\nul.popup-menu-container li {\n  display: flex;\n  padding: 2px 10px;\n  padding: 0;\n  white-space: nowrap;\n}\nul.popup-menu-container li > span {\n  padding: 4px 0;\n}\nul.popup-menu-container li:hover > span {\n  background: #316ac5;\n  color: white;\n}\n\n.popup-menu-container .checkmark{\n  min-width: 15px;\n  text-align: center;\n}\n.popup-menu-container .keystroke{\n  min-width: 20px;\n  flex-grow: 1;\n  /* background: fuchsia; */\n  text-align: right;\n  padding-left: 10px;\n}\n.popup-menu-container .chevron{\n  min-width: 15px;\n  text-align: center;\n  font-size: smaller;\n  line-height: 1;\n}\n\n/* nested popup */\n.popup-menu-container > li > .popup-menu-container{\n  left: calc(100% - 3px);\n  display: none;\n}\n.popup-menu-container > li:hover > .popup-menu-container{\n  display: unset;\n}\n\n/* COMPONENT BUCKET */\ncomponentbucket[id=\"component list\"] wrapper button {\n  width: 44px;\n  height: 34px;\n  /* border: none; */\n  /* border: 2px solid fuchsia; */\n  margin: 0 1px;\n  position: unset;\n    display: inline-block;\n    /* left: unset; */\n    /* top: unset; */\n    /* background: red; */\n}\n", a = ".list {\n  color: var(--color-studio-list-text, var(--color-wasabi-list-text));\n  background-color: var(--color-wasabi-list-background, transparent);\n  background-image: var(--bitmap-studio-list-background, none);\n}\n.list > * {\n  user-select: none;\n}\n.list .selected {\n  background-color: var(\n    --color-studio-list-item-selected,\n    var(--color-wasabi-list-text-selected-background)\n  );\n  color: var(\n    --color-studio-list-item-selected-fg,\n    var(--color-wasabi-list-text-selected)\n  );\n}\n\n/* == COLORTHEMELIST == */\ncolorthemeslist {\n  border: 1px solid black;\n  border: none;\n}\ncolorthemeslist > select {\n  border: none;\n  background-color: transparent;\n  color: inherit;\n}\n\n/* == PLAYLIST ==\n   Text style comes from the PlaylistPlus object (--pl-* set by PlayListGui);\n   colours fall back to the skin's pledit.* / wasabi.list.* colour ids. */\n.pl.list {\n  color: var(--pl-color, var(--color-pledit-text, var(--color-wasabi-list-text)));\n  background: none;\n  font-family: var(--pl-font-family);\n  font-size: var(--pl-font-size);\n  line-height: var(--pl-line-height);\n}\n.pl > .content-list {\n  margin-right: 15px;\n  max-height: 100%;\n  min-height: 100%;\n  overflow: auto;\n  background-color: var(--pl-bg-color, var(--color-wasabi-list-background, transparent));\n  background-image: var(--bitmap-studio-list-background, none);\n}\n.pl > .content-list > div {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  height: var(--pl-line-height);\n  padding: 0 4px 0 6px;\n  white-space: nowrap;\n}\n.pl > .content-list > div.current {\n  color: var(--pl-play-color, var(--color-pledit-text-current, var(--color-wasabi-list-text-current)));\n}\n.pl > .content-list > div.selected {\n  color: var(--pl-sel-color, var(--color-studio-list-item-selected-fg, var(--color-wasabi-list-text-selected)));\n  background-color: var(--pl-sel-bg-color, var(--color-studio-list-item-selected, var(--color-wasabi-list-text-selected-background)));\n}\n.pl > .content-list div>span:first-child{\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n}\n.pl > .content-list div>span:last-child{\n  flex: 0 0 auto;\n  text-align: right;\n}\n.pl > .content-list::-webkit-scrollbar {\n  display: none;\n}\n.pl::before,\n.pl::after {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  width: 15px;\n  height: 100%;\n  right: 0;\n  box-sizing: border-box;\n  background: var(--color-wasabi-window-background, transparent);\n  z-index: 0;\n  pointer-events: none;\n}\n.pl::after {\n  width: 8px;\n  right: 2px;\n  border-left: 1px solid\n    var(--color-wasabi-border-sunken, rgba(192, 192, 192, 0.8));\n  border-right: 1px solid\n    var(--color-wasabi-border-sunken, rgba(192, 192, 192, 0.8));\n  background: var(--color-wasabi-scrollbar-background-inverted, black);\n}\n.pl > slider {\n  z-index: 1;\n}\n.classic .pl::before,\n.classic .pl::after {\n  content: none;\n}\n\n.pl > slider::after /* button.wasabi */ {\n  box-sizing: border-box;\n  background-image: none;\n  border: 4px solid transparent;\n  border-image-source: var(--bitmap-studio-button);\n  /* border-image-slice: 4 4 4 5 fill; */\n  border-image-slice: 4 fill;\n  vertical-align: middle;\n}\n.pl > slider:active:after /* button.wasabi:active  */ {\n  border-image-source: var(--bitmap-studio-button-pressed);\n}\n\n.pl > slider::before {\n  content: \"\";\n  position: absolute;\n  /* TODO: do centering it by calc the real grip's bitmap height/width. */\n  left: calc(var(--thumb-left) + 1px);\n  top: calc(var(--thumb-top) + 5px);\n  width: 6px;\n  height: 8px;\n  background-image: var(--bitmap-wasabi-scrollbar-vertical-grip);\n}\n\n.pl .current {\n  color: var(\n    --color-pledit-text-current,\n    var(--color-wasabi-list-text-current)\n  );\n}\n", o = "button.wasabi {\n    background-image: none;\n  border: 4px solid transparent;\n  border-image-source: var(--bitmap-studio-button);  \n  /* border-image-slice: 4 4 4 5 fill; */\n  border-image-slice: 4 fill;\n  vertical-align:middle;\n}\n\n/* button.wasabi:hover {\n    border-image-source: var(--bitmap-wasabi-button-hover);\n} */\n\nbutton.wasabi:active {\n    border-image-source: var(--bitmap-studio-button-pressed);\n}\n\nbutton.center_image::before {\n    content: '';\n    position: absolute;\n    inset: 0;\n    background-image: var(--background-image);\n    background-repeat: no-repeat;\n    background-position: center center;\n}\n", s = "/* Let's get this party started */\n/*? VERTICAL */\n/* #web-amp *::-webkit-scrollbar-track { */\n#web-amp *::-webkit-scrollbar {\n  width: var(--dim-vscrollbar-width);\n  background-image: var(--bitmap-wasabi-scrollbar-vertical-background);\n}\n\n/* Track */\n/* #web-amp *::-webkit-scrollbar-track {\n    background-image: var(--bitmap-wasabi-scrollbar-vertical-background);\n} */\n#web-amp *::-webkit-scrollbar-button {\n  background-image: var(--bitmap-wasabi-scrollbar-vertical-left);\n}\n#web-amp *::-webkit-scrollbar-button:vertical {\n  height: var(--dim-vscrollbar-btn-height);\n}\n#web-amp *::-webkit-scrollbar-button:vertical:increment {\n  background-image: var(--bitmap-wasabi-scrollbar-vertical-right);\n}\n\n/* Handle */\n#web-amp *::-webkit-scrollbar-thumb {\n  background-image: var(\n    --bitmap-wasabi-scrollbar-vertical-button,\n    var(--bitmap-studio-scrollbar-vertical-button)\n  );\n  /*background-repeat: repeat;*/\n}\n#web-amp *::-webkit-scrollbar-thumb {\n  max-height: var(\n    --dim-vscrollbar-thumb-height,\n    var(--dim-vscrollbar-thumb-height2)\n  );\n  min-height: var(\n    --dim-vscrollbar-thumb-height,\n    var(--dim-vscrollbar-thumb-height2)\n  );\n  background-repeat: no-repeat;\n}\n/* #web-amp *::-webkit-scrollbar-thumb::after {\n    content: 'HALO';\n    position: absolute;\n    display: block;\n    inset: 0;\n    background: rgba(255, 230, 0, 1);\n    z-index: 100;\n} */\n/* #web-amp *::-webkit-scrollbar-thumb:window-inactive {\n  background: rgba(255,0,0,0.4); \n} */\n\n/*? HORIZONTAL */\n#web-amp *::-webkit-scrollbar:horizontal {\n  height: var(--dim-hscrollbar-height);\n  background-image: var(--bitmap-wasabi-scrollbar-horizontal-background);\n}\n/* Track */\n/* #web-amp *::-webkit-scrollbar-track:horizontal {\n} */\n#web-amp *::-webkit-scrollbar-button:horizontal {\n  background-image: var(--bitmap-wasabi-scrollbar-horizontal-left);\n  width: var(--dim-hscrollbar-btn-width);\n}\n#web-amp *::-webkit-scrollbar-button:horizontal:increment {\n  background-image: var(--bitmap-wasabi-scrollbar-horizontal-right);\n}\n/* Handle */\n#web-amp *::-webkit-scrollbar-thumb:horizontal {\n  background-image: var(--bitmap-studio-scrollbar-horizontal-button);\n}\n\n#web-amp *::-webkit-scrollbar-corner {\n  background: transparent;\n}\n/* ---------- EOF SCROLLBAR ------------ */\n", c = ".passthrough, .passthrough *{\n  pointer-events: none !important;\n}\nsubview,\nbuttongroup,\nbuttonelement {\n  position: absolute;\n  left: 0;\n  top: 0;\n  display: block;\n  overflow: hidden;\n  padding: 0;\n  margin: 0;\n  background-color: var(--background-color);\n}\nbuttongroup {\n  background: none;\n}\nbuttongroup > buttonelement {\n  width: inherit !important;\n  height: inherit !important;\n  background-position: top left;\n  cursor: pointer;\n}\nbuttongroup.webamp--img:active,\nbuttongroup.webamp--img:hover:active,\nbuttongroup.webamp--img:hover {\n  background-image: var(--background-image);\n}\nsubview.webamp--img::before,\nbuttongroup.has-image::before{\n  content: '';\n  position: absolute;\n  background-image: var(--background-image);\n  top: 0;\n  left: 0;\n  width: inherit;\n  height: inherit;\n  z-index: 0;\n}\nbuttongroup > buttonelement.down {\n  background-image: var(--down-background-image, var(--background-image));\n}\nbuttongroup > buttonelement:hover {\n  background-image: var(--hover-background-image, var(--background-image));\n}\nbuttongroup > buttonelement.down:hover {\n  background-image: var(\n    --hover-down-background-image,\n    var(--hover-background-image, var(--background-image))\n  );\n}\nbuttongroup > buttonelement:active,\nbuttongroup > buttonelement:hover:active {\n  background-image: var(--down-background-image, var(--background-image));\n}\nbutton.disabled,\nbuttongroup > buttonelement.disabled {\n  pointer-events: none !important;\n  background-image: var(\n    --disabled-background-image,\n    var(--background-image)\n  ) !important;\n}\n\ntext.textz wrap {\n  width: auto;\n}\n\nsubview > * {\n  background-color: var(--background-color);\n} \n\n/** SLIDER **/\nslider.background-stretched::before {\n  content: \"\";\n  box-sizing: border-box;\n  border: 7px solid transparent;\n  border-top-width: var(--border-height-px);\n  border-bottom-width: var(--border-height-px);\n  border-left-width: var(--border-width-px);\n  border-right-width: var(--border-width-px);\n  border-image-source: var(--background-image);\n  border-image-slice: var(--border-height) var(--border-width) fill;\n  position: absolute;\n  inset: 0;\n}\n\n#web-amp container#main > #normal { clip-path: url(#region-for-normal); }\n#web-amp container#main > #shade  { clip-path: url(#region-for-windowshade); }\n/* #web-amp container#main > #normal { clip-path: url(#region-for-equalizer); } */\n/* #web-amp container#main > #normal { clip-path: url(#region-for-equalizerws); } */\n\n\n/* WA2 PSEUDO OF MINUS SIGN */\ntext span.bignum.minus{\n  background-position-x: 15px;\n  position: relative;\n  /* box-shadow: inset 0 0 1px yellow; */\n}\ntext span.bignum.minus::before,\ntext span.bignum.minus::after{\n  content: '';\n  position: absolute;\n  background: inherit;\n  background-position: inherit;\n  left: 1px;\n  top:5px;\n  width: 4px;\n  height: 3px;\n  /* border:1px solid fuchsia; */\n  background-position-x: -63px;\n  background-position-y: -13px;\n}\ntext span.bignum.minus::after{\n  background-position-x: -49px;\n  background-position-y: -13px;\n  left:5px;\n  /* border:1px solid lime; */\n}", l = ".K-Jofol button {\n  background-position-x: var(--left, 0);\n  background-position-y: var(--top, 0);\n}\n.K-Jofol canvas {\n  display: block;\n}", u = ".text-shaped {\n  color: silver;\n  font-size: 9px;\n  text-align: center;\n  color: aqua;\n  font-weight: bold;\n}\n.text-shaped::before {\n  content: \"\";\n  width: 50%;\n  height: 100%;\n  float: left;\n  shape-outside: var(--bottom-arc1);\n  shape-margin: 3px;\n}\n.text-shaped.right {\n  position: initial;\n}\n.text-shaped.right::before {\n  float: right;\n  shape-outside: var(--bottom-arc2);\n}\n\nbutton.circle::before {\n  /* background-color: aqua; */\n  /* border-radius: 50%; */\n  content: '';\n  position: absolute;\n  inset: 0;\n  background-image: var(--icon-background-image);\n}", d = "@import url(./elements.css);\n@import url(./list.css);\n@import url(./button.css);\n@import url(./scrollbar.css);\n\n@import url(./wmz.css);\n@import url(./kjofol.css);\n@import url(./sonique.css);\n", f = new URL("modern/assets/", document.baseURI).href, p = [
	"main",
	"equalizer",
	"PLEdit",
	"winamp.albumart"
], m = null;
function ensureStyles() {
	return m || (m = (async () => {
		for (let e of ["bitmap-css", "truetypefont-css"]) if (!document.getElementById(e)) {
			let t = document.createElement("style");
			t.id = e, document.head.append(t);
		}
		let e = [
			i,
			a,
			o,
			s,
			c,
			l,
			u,
			d.replace(/@import[^;]*;/g, "")
		].join("\n"), t = document.createElement("style");
		t.id = "webamp-modern-css", t.textContent = scopeCss(e, ".webamp-modern-host"), document.head.append(t);
	})(), m);
}
var h = ".webamp-modern-hosted-window", scopeSelector = (e, t) => `${e} ${t.trim()}:not(${h} *)`;
function scopeCss(e, t) {
	let n = new CSSStyleSheet();
	try {
		n.replaceSync(e);
	} catch {
		return e;
	}
	let r = [], visit = (e) => {
		for (let n of e) if (n instanceof CSSStyleRule) n.selectorText = n.selectorText.split(",").map((e) => scopeSelector(t, e)).join(", "), r.push(n.cssText);
		else if (n instanceof CSSMediaRule || n instanceof CSSSupportsRule) {
			let e = [];
			for (let r of n.cssRules) r instanceof CSSStyleRule && (r.selectorText = r.selectorText.split(",").map((e) => scopeSelector(t, e)).join(", ")), e.push(r.cssText);
			r.push(`${n.cssText.split("{")[0]}{${e.join("\n")}}`);
		} else r.push(n.cssText);
	};
	return visit(n.cssRules), r.join("\n");
}
async function mountModernSkin({ webamp: e, host: t, skin: n, containers: r = p, layout: i = "skin", desktop: a, onAction: o, isActionActive: s, layouts: c = "auto", skinRoot: l, seedTracks: u, getStationInfo: d, holdWindow: m, releaseWindow: h, assetsBase: g, privateDefaults: _, bar: v = a, onLayoutChanged: y }) {
	await ensureStyles(), await import("./SkinEngine_WAL-DB-xz-pz.js");
	let { Webamp5: b } = await import("./WebampModern-BLDVtZlt.js"), x = createWebampClassicAudioAdapter(e);
	x.getStationInfo = d ?? null;
	let S = createWebampPlaylistProvider(e);
	try {
		if (e.store.getState().playlist.trackOrder.length === 0) {
			let t = u?.() ?? [];
			t.length > 0 && e.appendTracks(t);
		}
	} catch (e) {
		console.warn("Could not seed the Modern playlist:", e);
	}
	t.classList.add("webamp-modern-host");
	let C = new b(t, {
		skin: n,
		tracks: [],
		audio: x,
		playlistProvider: S,
		containers: r,
		desktop: a ? () => ({
			left: 0,
			top: 0,
			...a()
		}) : void 0,
		assetsBase: g ?? f,
		privateDefaults: _,
		onLayoutSnapAdjustChanged: () => y?.(),
		skinRoot: l,
		onAction: o,
		isActionActive: s,
		holdWindow: m,
		releaseWindow: h
	});
	await C.ready();
	let w = C.getUIRoot(), T = r.map((e) => w.getContainers().find((t) => (t.getId() || "").toLowerCase() === e.toLowerCase())).filter((e) => e && e.getVisible()), E = a?.() ?? null, D = .5, layoutFits = (e) => {
		if (!E) return !0;
		let t = e._minimumHeight || e._h || 0, n = e._minimumWidth || 0;
		return t * D <= E.height && n * D <= E.width;
	};
	for (let e of T) {
		let t = c === "auto" ? null : c?.[e.getId()] ?? c?.[(e.getId() || "").toLowerCase()];
		if (t) {
			e.getlayout(t) && e.switchtolayout(t);
			continue;
		}
		if (c !== "auto" || !e._activeLayout) continue;
		if (!layoutFits(e._activeLayout)) {
			let t = e._layouts.find(layoutFits);
			t && e.switchtolayout(t._id);
		}
		let n = e._activeLayout, stretchable = (e) => !!e && (e._maximumWidth === 0 || e._maximumWidth == null), r = T.filter((e) => e.getWidth() > 1 && e.getHeight() > 1).length;
		if (E && n && n._minimumWidth && stretchable(n) && r === 1) {
			let t = v?.() ?? E, r = Math.max(1, Math.min(2, Math.floor(t.height / Math.max(1, n.getheight())))), i = Math.max(n._minimumWidth, Math.floor(E.width / r));
			i !== n.getwidth() && e.setWidth(i);
		}
	}
	let O = T, isPlaceholder = (e) => e.getWidth() <= 1 || e.getHeight() <= 1, arrange = () => {
		let e = O.filter((e) => e.getVisible() && !isPlaceholder(e));
		if (c === "auto" && E) for (let t of e) {
			let e = t._activeLayout;
			if (e && !layoutFits(e)) {
				let n = t._layouts.find(layoutFits);
				n && n !== e && t.switchtolayout(n._id);
			}
		}
		let visibleW = (e) => e.getVisibleWidth?.() ?? e.getWidth(), visibleH = (e) => e.getVisibleHeight?.() ?? e.getHeight();
		if (i === "row") {
			let t = 0;
			for (let n of e) n.setLocation(t, 0), t += visibleW(n);
		}
		let n = e.reduce((e, t) => ({
			width: Math.max(e.width, t.getleft() + visibleW(t)),
			height: Math.max(e.height, t.gettop() + visibleH(t))
		}), {
			width: 0,
			height: 0
		});
		return t.style.width = `${n.width}px`, t.style.height = `${n.height}px`, k.bounds = n, n;
	}, k = { bounds: {
		width: 0,
		height: 0
	} };
	arrange();
	let fit = (e) => {
		let n = arrange(), r = Math.min(1, e / n.width) || 1;
		return t.style.zoom = r === 1 ? "" : String(r), {
			scale: r,
			width: Math.round(n.width * r),
			height: Math.round(n.height * r)
		};
	};
	return x.trigger("statchanged"), x.trigger("timeupdate"), Object.assign(k, {
		instance: C,
		uiRoot: w,
		audio: x,
		playlistProvider: S,
		layout: i,
		arrange,
		fit,
		switchSkin: (e) => C.switchSkin(e),
		getContainer: (e) => w.getContainers().find((t) => (t.getId() || "").toLowerCase() === e.toLowerCase()) ?? null,
		dispose: () => {
			x.dispose(), S.dispose(), C.dispose(), t.classList.remove("webamp-modern-host"), t.style.width = "", t.style.height = "", t.style.zoom = "";
		}
	}), k;
}
//#endregion
export { mountModernSkin };
