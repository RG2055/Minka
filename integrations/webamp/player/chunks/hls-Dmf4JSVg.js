import "./rolldown-runtime-ly0BBW_k.js";
//#region node_modules/hls.js/dist/hls.mjs
function getDefaultExportFromCjs(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var e = { exports: {} };
(function(e, t) {
	(function(t) {
		var n = /^(?=((?:[a-zA-Z0-9+\-.]+:)?))\1(?=((?:\/\/[^\/?#]*)?))\2(?=((?:(?:[^?#\/]*\/)*[^;?#\/]*)?))\3((?:;[^?#]*)?)(\?[^#]*)?(#[^]*)?$/, r = /^(?=([^\/?#]*))\1([^]*)$/, i = /(?:\/|^)\.(?=\/)/g, a = /(?:\/|^)\.\.\/(?!\.\.\/)[^\/]*(?=\/)/g, o = {
			buildAbsoluteURL: function(e, t, n) {
				if (n ||= {}, e = e.trim(), t = t.trim(), !t) {
					if (!n.alwaysNormalize) return e;
					var i = o.parseURL(e);
					if (!i) throw Error("Error trying to parse base URL.");
					return i.path = o.normalizePath(i.path), o.buildURLFromParts(i);
				}
				var a = o.parseURL(t);
				if (!a) throw Error("Error trying to parse relative URL.");
				if (a.scheme) return n.alwaysNormalize ? (a.path = o.normalizePath(a.path), o.buildURLFromParts(a)) : t;
				var s = o.parseURL(e);
				if (!s) throw Error("Error trying to parse base URL.");
				if (!s.netLoc && s.path && s.path[0] !== "/") {
					var c = r.exec(s.path);
					s.netLoc = c[1], s.path = c[2];
				}
				s.netLoc && !s.path && (s.path = "/");
				var l = {
					scheme: s.scheme,
					netLoc: a.netLoc,
					path: null,
					params: a.params,
					query: a.query,
					fragment: a.fragment
				};
				if (!a.netLoc && (l.netLoc = s.netLoc, a.path[0] !== "/")) {
					if (!a.path) l.path = s.path, a.params || (l.params = s.params, a.query || (l.query = s.query));
					else {
						var u = s.path, d = u.substring(0, u.lastIndexOf("/") + 1) + a.path;
						l.path = o.normalizePath(d);
					}
				}
				return l.path === null && (l.path = n.alwaysNormalize ? o.normalizePath(a.path) : a.path), o.buildURLFromParts(l);
			},
			parseURL: function(e) {
				var t = n.exec(e);
				return t ? {
					scheme: t[1] || "",
					netLoc: t[2] || "",
					path: t[3] || "",
					params: t[4] || "",
					query: t[5] || "",
					fragment: t[6] || ""
				} : null;
			},
			normalizePath: function(e) {
				for (e = e.split("").reverse().join("").replace(i, ""); e.length !== (e = e.replace(a, "")).length;);
				return e.split("").reverse().join("");
			},
			buildURLFromParts: function(e) {
				return e.scheme + e.netLoc + e.path + e.params + e.query + e.fragment;
			}
		};
		e.exports = o;
	})();
})(e);
var t = e.exports;
function ownKeys(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function _objectSpread2(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? ownKeys(Object(n), !0).forEach(function(t) {
			_defineProperty(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ownKeys(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function _toPrimitive(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function _toPropertyKey(e) {
	var t = _toPrimitive(e, "string");
	return typeof t == "symbol" ? t : String(t);
}
function _defineProperty(e, t, n) {
	return t = _toPropertyKey(t), t in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function _extends() {
	return _extends = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, _extends.apply(this, arguments);
}
var n = Number.isFinite || function(e) {
	return typeof e == "number" && isFinite(e);
}, r = Number.isSafeInteger || function(e) {
	return typeof e == "number" && Math.abs(e) <= i;
}, i = 2 ** 53 - 1 || 9007199254740991, a = /*#__PURE__*/ function(e) {
	return e.MEDIA_ATTACHING = "hlsMediaAttaching", e.MEDIA_ATTACHED = "hlsMediaAttached", e.MEDIA_DETACHING = "hlsMediaDetaching", e.MEDIA_DETACHED = "hlsMediaDetached", e.BUFFER_RESET = "hlsBufferReset", e.BUFFER_CODECS = "hlsBufferCodecs", e.BUFFER_CREATED = "hlsBufferCreated", e.BUFFER_APPENDING = "hlsBufferAppending", e.BUFFER_APPENDED = "hlsBufferAppended", e.BUFFER_EOS = "hlsBufferEos", e.BUFFER_FLUSHING = "hlsBufferFlushing", e.BUFFER_FLUSHED = "hlsBufferFlushed", e.MANIFEST_LOADING = "hlsManifestLoading", e.MANIFEST_LOADED = "hlsManifestLoaded", e.MANIFEST_PARSED = "hlsManifestParsed", e.LEVEL_SWITCHING = "hlsLevelSwitching", e.LEVEL_SWITCHED = "hlsLevelSwitched", e.LEVEL_LOADING = "hlsLevelLoading", e.LEVEL_LOADED = "hlsLevelLoaded", e.LEVEL_UPDATED = "hlsLevelUpdated", e.LEVEL_PTS_UPDATED = "hlsLevelPtsUpdated", e.LEVELS_UPDATED = "hlsLevelsUpdated", e.AUDIO_TRACKS_UPDATED = "hlsAudioTracksUpdated", e.AUDIO_TRACK_SWITCHING = "hlsAudioTrackSwitching", e.AUDIO_TRACK_SWITCHED = "hlsAudioTrackSwitched", e.AUDIO_TRACK_LOADING = "hlsAudioTrackLoading", e.AUDIO_TRACK_LOADED = "hlsAudioTrackLoaded", e.SUBTITLE_TRACKS_UPDATED = "hlsSubtitleTracksUpdated", e.SUBTITLE_TRACKS_CLEARED = "hlsSubtitleTracksCleared", e.SUBTITLE_TRACK_SWITCH = "hlsSubtitleTrackSwitch", e.SUBTITLE_TRACK_LOADING = "hlsSubtitleTrackLoading", e.SUBTITLE_TRACK_LOADED = "hlsSubtitleTrackLoaded", e.SUBTITLE_FRAG_PROCESSED = "hlsSubtitleFragProcessed", e.CUES_PARSED = "hlsCuesParsed", e.NON_NATIVE_TEXT_TRACKS_FOUND = "hlsNonNativeTextTracksFound", e.INIT_PTS_FOUND = "hlsInitPtsFound", e.FRAG_LOADING = "hlsFragLoading", e.FRAG_LOAD_EMERGENCY_ABORTED = "hlsFragLoadEmergencyAborted", e.FRAG_LOADED = "hlsFragLoaded", e.FRAG_DECRYPTED = "hlsFragDecrypted", e.FRAG_PARSING_INIT_SEGMENT = "hlsFragParsingInitSegment", e.FRAG_PARSING_USERDATA = "hlsFragParsingUserdata", e.FRAG_PARSING_METADATA = "hlsFragParsingMetadata", e.FRAG_PARSED = "hlsFragParsed", e.FRAG_BUFFERED = "hlsFragBuffered", e.FRAG_CHANGED = "hlsFragChanged", e.FPS_DROP = "hlsFpsDrop", e.FPS_DROP_LEVEL_CAPPING = "hlsFpsDropLevelCapping", e.MAX_AUTO_LEVEL_UPDATED = "hlsMaxAutoLevelUpdated", e.ERROR = "hlsError", e.DESTROYING = "hlsDestroying", e.KEY_LOADING = "hlsKeyLoading", e.KEY_LOADED = "hlsKeyLoaded", e.LIVE_BACK_BUFFER_REACHED = "hlsLiveBackBufferReached", e.BACK_BUFFER_REACHED = "hlsBackBufferReached", e.STEERING_MANIFEST_LOADED = "hlsSteeringManifestLoaded", e;
}({}), o = /*#__PURE__*/ function(e) {
	return e.NETWORK_ERROR = "networkError", e.MEDIA_ERROR = "mediaError", e.KEY_SYSTEM_ERROR = "keySystemError", e.MUX_ERROR = "muxError", e.OTHER_ERROR = "otherError", e;
}({}), s = /*#__PURE__*/ function(e) {
	return e.KEY_SYSTEM_NO_KEYS = "keySystemNoKeys", e.KEY_SYSTEM_NO_ACCESS = "keySystemNoAccess", e.KEY_SYSTEM_NO_SESSION = "keySystemNoSession", e.KEY_SYSTEM_NO_CONFIGURED_LICENSE = "keySystemNoConfiguredLicense", e.KEY_SYSTEM_LICENSE_REQUEST_FAILED = "keySystemLicenseRequestFailed", e.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED = "keySystemServerCertificateRequestFailed", e.KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED = "keySystemServerCertificateUpdateFailed", e.KEY_SYSTEM_SESSION_UPDATE_FAILED = "keySystemSessionUpdateFailed", e.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED = "keySystemStatusOutputRestricted", e.KEY_SYSTEM_STATUS_INTERNAL_ERROR = "keySystemStatusInternalError", e.MANIFEST_LOAD_ERROR = "manifestLoadError", e.MANIFEST_LOAD_TIMEOUT = "manifestLoadTimeOut", e.MANIFEST_PARSING_ERROR = "manifestParsingError", e.MANIFEST_INCOMPATIBLE_CODECS_ERROR = "manifestIncompatibleCodecsError", e.LEVEL_EMPTY_ERROR = "levelEmptyError", e.LEVEL_LOAD_ERROR = "levelLoadError", e.LEVEL_LOAD_TIMEOUT = "levelLoadTimeOut", e.LEVEL_PARSING_ERROR = "levelParsingError", e.LEVEL_SWITCH_ERROR = "levelSwitchError", e.AUDIO_TRACK_LOAD_ERROR = "audioTrackLoadError", e.AUDIO_TRACK_LOAD_TIMEOUT = "audioTrackLoadTimeOut", e.SUBTITLE_LOAD_ERROR = "subtitleTrackLoadError", e.SUBTITLE_TRACK_LOAD_TIMEOUT = "subtitleTrackLoadTimeOut", e.FRAG_LOAD_ERROR = "fragLoadError", e.FRAG_LOAD_TIMEOUT = "fragLoadTimeOut", e.FRAG_DECRYPT_ERROR = "fragDecryptError", e.FRAG_PARSING_ERROR = "fragParsingError", e.FRAG_GAP = "fragGap", e.REMUX_ALLOC_ERROR = "remuxAllocError", e.KEY_LOAD_ERROR = "keyLoadError", e.KEY_LOAD_TIMEOUT = "keyLoadTimeOut", e.BUFFER_ADD_CODEC_ERROR = "bufferAddCodecError", e.BUFFER_INCOMPATIBLE_CODECS_ERROR = "bufferIncompatibleCodecsError", e.BUFFER_APPEND_ERROR = "bufferAppendError", e.BUFFER_APPENDING_ERROR = "bufferAppendingError", e.BUFFER_STALLED_ERROR = "bufferStalledError", e.BUFFER_FULL_ERROR = "bufferFullError", e.BUFFER_SEEK_OVER_HOLE = "bufferSeekOverHole", e.BUFFER_NUDGE_ON_STALL = "bufferNudgeOnStall", e.INTERNAL_EXCEPTION = "internalException", e.INTERNAL_ABORTED = "aborted", e.UNKNOWN = "unknown", e;
}({}), c = function noop() {}, l = {
	trace: c,
	debug: c,
	log: c,
	warn: c,
	info: c,
	error: c
}, u = l;
function consolePrintFn(e) {
	let t = self.console[e];
	return t ? t.bind(self.console, `[${e}] >`) : c;
}
function exportLoggerFunctions(e, ...t) {
	t.forEach(function(t) {
		u[t] = e[t] ? e[t].bind(e) : consolePrintFn(t);
	});
}
function enableLogs(e, t) {
	if (typeof console == "object" && e === !0 || typeof e == "object") {
		exportLoggerFunctions(e, "debug", "log", "info", "warn", "error");
		try {
			u.log(`Debug logs enabled for "${t}" in hls.js version 1.5.13`);
		} catch {
			u = l;
		}
	} else u = l;
}
var d = u, f = /^(\d+)x(\d+)$/, p = /(.+?)=(".*?"|.*?)(?:,|$)/g, m = class AttrList {
	constructor(e) {
		typeof e == "string" && (e = AttrList.parseAttrList(e)), _extends(this, e);
	}
	get clientAttrs() {
		return Object.keys(this).filter((e) => e.substring(0, 2) === "X-");
	}
	decimalInteger(e) {
		let t = parseInt(this[e], 10);
		return t > 2 ** 53 - 1 ? Infinity : t;
	}
	hexadecimalInteger(e) {
		if (this[e]) {
			let t = (this[e] || "0x").slice(2);
			t = (t.length & 1 ? "0" : "") + t;
			let n = new Uint8Array(t.length / 2);
			for (let e = 0; e < t.length / 2; e++) n[e] = parseInt(t.slice(e * 2, e * 2 + 2), 16);
			return n;
		}
		return null;
	}
	hexadecimalIntegerAsNumber(e) {
		let t = parseInt(this[e], 16);
		return t > 2 ** 53 - 1 ? Infinity : t;
	}
	decimalFloatingPoint(e) {
		return parseFloat(this[e]);
	}
	optionalFloat(e, t) {
		let n = this[e];
		return n ? parseFloat(n) : t;
	}
	enumeratedString(e) {
		return this[e];
	}
	bool(e) {
		return this[e] === "YES";
	}
	decimalResolution(e) {
		let t = f.exec(this[e]);
		if (t !== null) return {
			width: parseInt(t[1], 10),
			height: parseInt(t[2], 10)
		};
	}
	static parseAttrList(e) {
		let t, n = {};
		for (p.lastIndex = 0; (t = p.exec(e)) !== null;) {
			let e = t[2];
			e.indexOf("\"") === 0 && e.lastIndexOf("\"") === e.length - 1 && (e = e.slice(1, -1));
			let r = t[1].trim();
			n[r] = e;
		}
		return n;
	}
};
function isDateRangeCueAttribute(e) {
	return e !== "ID" && e !== "CLASS" && e !== "START-DATE" && e !== "DURATION" && e !== "END-DATE" && e !== "END-ON-NEXT";
}
function isSCTE35Attribute(e) {
	return e === "SCTE35-OUT" || e === "SCTE35-IN";
}
var DateRange = class {
	constructor(e, t) {
		if (this.attr = void 0, this._startDate = void 0, this._endDate = void 0, this._badValueForSameId = void 0, t) {
			let n = t.attr;
			for (let t in n) if (Object.prototype.hasOwnProperty.call(e, t) && e[t] !== n[t]) {
				d.warn(`DATERANGE tag attribute: "${t}" does not match for tags with ID: "${e.ID}"`), this._badValueForSameId = t;
				break;
			}
			e = _extends(new m({}), n, e);
		}
		if (this.attr = e, this._startDate = new Date(e["START-DATE"]), "END-DATE" in this.attr) {
			let e = new Date(this.attr["END-DATE"]);
			n(e.getTime()) && (this._endDate = e);
		}
	}
	get id() {
		return this.attr.ID;
	}
	get class() {
		return this.attr.CLASS;
	}
	get startDate() {
		return this._startDate;
	}
	get endDate() {
		if (this._endDate) return this._endDate;
		let e = this.duration;
		return e === null ? null : new Date(this._startDate.getTime() + e * 1e3);
	}
	get duration() {
		if ("DURATION" in this.attr) {
			let e = this.attr.decimalFloatingPoint("DURATION");
			if (n(e)) return e;
		} else if (this._endDate) return (this._endDate.getTime() - this._startDate.getTime()) / 1e3;
		return null;
	}
	get plannedDuration() {
		return "PLANNED-DURATION" in this.attr ? this.attr.decimalFloatingPoint("PLANNED-DURATION") : null;
	}
	get endOnNext() {
		return this.attr.bool("END-ON-NEXT");
	}
	get isValid() {
		return !!this.id && !this._badValueForSameId && n(this.startDate.getTime()) && (this.duration === null || this.duration >= 0) && (!this.endOnNext || !!this.class);
	}
}, LoadStats = class {
	constructor() {
		this.aborted = !1, this.loaded = 0, this.retry = 0, this.total = 0, this.chunkCount = 0, this.bwEstimate = 0, this.loading = {
			start: 0,
			first: 0,
			end: 0
		}, this.parsing = {
			start: 0,
			end: 0
		}, this.buffering = {
			start: 0,
			first: 0,
			end: 0
		};
	}
}, h = {
	AUDIO: "audio",
	VIDEO: "video",
	AUDIOVIDEO: "audiovideo"
}, BaseSegment = class {
	constructor(e) {
		this._byteRange = null, this._url = null, this.baseurl = void 0, this.relurl = void 0, this.elementaryStreams = {
			[h.AUDIO]: null,
			[h.VIDEO]: null,
			[h.AUDIOVIDEO]: null
		}, this.baseurl = e;
	}
	setByteRange(e, t) {
		let n = e.split("@", 2), r;
		r = n.length === 1 ? t?.byteRangeEndOffset || 0 : parseInt(n[1]), this._byteRange = [r, parseInt(n[0]) + r];
	}
	get byteRange() {
		return this._byteRange ? this._byteRange : [];
	}
	get byteRangeStartOffset() {
		return this.byteRange[0];
	}
	get byteRangeEndOffset() {
		return this.byteRange[1];
	}
	get url() {
		return !this._url && this.baseurl && this.relurl && (this._url = t.buildAbsoluteURL(this.baseurl, this.relurl, { alwaysNormalize: !0 })), this._url || "";
	}
	set url(e) {
		this._url = e;
	}
}, Fragment = class extends BaseSegment {
	constructor(e, t) {
		super(t), this._decryptdata = null, this.rawProgramDateTime = null, this.programDateTime = null, this.tagList = [], this.duration = 0, this.sn = 0, this.levelkeys = void 0, this.type = void 0, this.loader = null, this.keyLoader = null, this.level = -1, this.cc = 0, this.startPTS = void 0, this.endPTS = void 0, this.startDTS = void 0, this.endDTS = void 0, this.start = 0, this.deltaPTS = void 0, this.maxStartPTS = void 0, this.minEndPTS = void 0, this.stats = new LoadStats(), this.data = void 0, this.bitrateTest = !1, this.title = null, this.initSegment = null, this.endList = void 0, this.gap = void 0, this.urlId = 0, this.type = e;
	}
	get decryptdata() {
		let { levelkeys: e } = this;
		if (!e && !this._decryptdata) return null;
		if (!this._decryptdata && this.levelkeys && !this.levelkeys.NONE) {
			let e = this.levelkeys.identity;
			if (e) this._decryptdata = e.getDecryptData(this.sn);
			else {
				let e = Object.keys(this.levelkeys);
				if (e.length === 1) return this._decryptdata = this.levelkeys[e[0]].getDecryptData(this.sn);
			}
		}
		return this._decryptdata;
	}
	get end() {
		return this.start + this.duration;
	}
	get endProgramDateTime() {
		if (this.programDateTime === null || !n(this.programDateTime)) return null;
		let e = n(this.duration) ? this.duration : 0;
		return this.programDateTime + e * 1e3;
	}
	get encrypted() {
		var e;
		if ((e = this._decryptdata) != null && e.encrypted) return !0;
		if (this.levelkeys) {
			let e = Object.keys(this.levelkeys), t = e.length;
			if (t > 1 || t === 1 && this.levelkeys[e[0]].encrypted) return !0;
		}
		return !1;
	}
	setKeyFormat(e) {
		if (this.levelkeys) {
			let t = this.levelkeys[e];
			t && !this._decryptdata && (this._decryptdata = t.getDecryptData(this.sn));
		}
	}
	abortRequests() {
		var e, t;
		(e = this.loader) == null || e.abort(), (t = this.keyLoader) == null || t.abort();
	}
	setElementaryStreamInfo(e, t, n, r, i, a = !1) {
		let { elementaryStreams: o } = this, s = o[e];
		if (!s) {
			o[e] = {
				startPTS: t,
				endPTS: n,
				startDTS: r,
				endDTS: i,
				partial: a
			};
			return;
		}
		s.startPTS = Math.min(s.startPTS, t), s.endPTS = Math.max(s.endPTS, n), s.startDTS = Math.min(s.startDTS, r), s.endDTS = Math.max(s.endDTS, i);
	}
	clearElementaryStreamInfo() {
		let { elementaryStreams: e } = this;
		e[h.AUDIO] = null, e[h.VIDEO] = null, e[h.AUDIOVIDEO] = null;
	}
}, Part = class extends BaseSegment {
	constructor(e, t, n, r, i) {
		super(n), this.fragOffset = 0, this.duration = 0, this.gap = !1, this.independent = !1, this.relurl = void 0, this.fragment = void 0, this.index = void 0, this.stats = new LoadStats(), this.duration = e.decimalFloatingPoint("DURATION"), this.gap = e.bool("GAP"), this.independent = e.bool("INDEPENDENT"), this.relurl = e.enumeratedString("URI"), this.fragment = t, this.index = r;
		let a = e.enumeratedString("BYTERANGE");
		a && this.setByteRange(a, i), i && (this.fragOffset = i.fragOffset + i.duration);
	}
	get start() {
		return this.fragment.start + this.fragOffset;
	}
	get end() {
		return this.start + this.duration;
	}
	get loaded() {
		let { elementaryStreams: e } = this;
		return !!(e.audio || e.video || e.audiovideo);
	}
}, g = 10, LevelDetails = class {
	constructor(e) {
		this.PTSKnown = !1, this.alignedSliding = !1, this.averagetargetduration = void 0, this.endCC = 0, this.endSN = 0, this.fragments = void 0, this.fragmentHint = void 0, this.partList = null, this.dateRanges = void 0, this.live = !0, this.ageHeader = 0, this.advancedDateTime = void 0, this.updated = !0, this.advanced = !0, this.availabilityDelay = void 0, this.misses = 0, this.startCC = 0, this.startSN = 0, this.startTimeOffset = null, this.targetduration = 0, this.totalduration = 0, this.type = null, this.url = void 0, this.m3u8 = "", this.version = null, this.canBlockReload = !1, this.canSkipUntil = 0, this.canSkipDateRanges = !1, this.skippedSegments = 0, this.recentlyRemovedDateranges = void 0, this.partHoldBack = 0, this.holdBack = 0, this.partTarget = 0, this.preloadHint = void 0, this.renditionReports = void 0, this.tuneInGoal = 0, this.deltaUpdateFailed = void 0, this.driftStartTime = 0, this.driftEndTime = 0, this.driftStart = 0, this.driftEnd = 0, this.encryptedFragments = void 0, this.playlistParsingError = null, this.variableList = null, this.hasVariableRefs = !1, this.fragments = [], this.encryptedFragments = [], this.dateRanges = {}, this.url = e;
	}
	reloaded(e) {
		if (!e) {
			this.advanced = !0, this.updated = !0;
			return;
		}
		let t = this.lastPartSn - e.lastPartSn, n = this.lastPartIndex - e.lastPartIndex;
		this.updated = this.endSN !== e.endSN || !!n || !!t || !this.live, this.advanced = this.endSN > e.endSN || t > 0 || t === 0 && n > 0, this.misses = this.updated || this.advanced ? Math.floor(e.misses * .6) : e.misses + 1, this.availabilityDelay = e.availabilityDelay;
	}
	get hasProgramDateTime() {
		return this.fragments.length ? n(this.fragments[this.fragments.length - 1].programDateTime) : !1;
	}
	get levelTargetDuration() {
		return this.averagetargetduration || this.targetduration || g;
	}
	get drift() {
		let e = this.driftEndTime - this.driftStartTime;
		return e > 0 ? (this.driftEnd - this.driftStart) * 1e3 / e : 1;
	}
	get edge() {
		return this.partEnd || this.fragmentEnd;
	}
	get partEnd() {
		var e;
		return (e = this.partList) != null && e.length ? this.partList[this.partList.length - 1].end : this.fragmentEnd;
	}
	get fragmentEnd() {
		var e;
		return (e = this.fragments) != null && e.length ? this.fragments[this.fragments.length - 1].end : 0;
	}
	get age() {
		return this.advancedDateTime ? Math.max(Date.now() - this.advancedDateTime, 0) / 1e3 : 0;
	}
	get lastPartIndex() {
		var e;
		return (e = this.partList) != null && e.length ? this.partList[this.partList.length - 1].index : -1;
	}
	get lastPartSn() {
		var e;
		return (e = this.partList) != null && e.length ? this.partList[this.partList.length - 1].fragment.sn : this.endSN;
	}
};
function base64Decode(e) {
	return Uint8Array.from(atob(e), (e) => e.charCodeAt(0));
}
function getKeyIdBytes(e) {
	let t = strToUtf8array(e).subarray(0, 16), n = /* @__PURE__ */ new Uint8Array(16);
	return n.set(t, 16 - t.length), n;
}
function changeEndianness(e) {
	let t = function swap(e, t, n) {
		let r = e[t];
		e[t] = e[n], e[n] = r;
	};
	t(e, 0, 3), t(e, 1, 2), t(e, 4, 5), t(e, 6, 7);
}
function convertDataUriToArrayBytes(e) {
	let t = e.split(":"), n = null;
	if (t[0] === "data" && t.length === 2) {
		let e = t[1].split(";"), r = e[e.length - 1].split(",");
		if (r.length === 2) {
			let t = r[0] === "base64", i = r[1];
			t ? (e.splice(-1, 1), n = base64Decode(i)) : n = getKeyIdBytes(i);
		}
	}
	return n;
}
function strToUtf8array(e) {
	return Uint8Array.from(unescape(encodeURIComponent(e)), (e) => e.charCodeAt(0));
}
var _ = typeof self < "u" ? self : void 0, v = {
	CLEARKEY: "org.w3.clearkey",
	FAIRPLAY: "com.apple.fps",
	PLAYREADY: "com.microsoft.playready",
	WIDEVINE: "com.widevine.alpha"
}, y = {
	CLEARKEY: "org.w3.clearkey",
	FAIRPLAY: "com.apple.streamingkeydelivery",
	PLAYREADY: "com.microsoft.playready",
	WIDEVINE: "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"
};
function keySystemFormatToKeySystemDomain(e) {
	switch (e) {
		case y.FAIRPLAY: return v.FAIRPLAY;
		case y.PLAYREADY: return v.PLAYREADY;
		case y.WIDEVINE: return v.WIDEVINE;
		case y.CLEARKEY: return v.CLEARKEY;
	}
}
var b = { WIDEVINE: "edef8ba979d64acea3c827dcd51d21ed" };
function keySystemIdToKeySystemDomain(e) {
	if (e === b.WIDEVINE) return v.WIDEVINE;
}
function keySystemDomainToKeySystemFormat(e) {
	switch (e) {
		case v.FAIRPLAY: return y.FAIRPLAY;
		case v.PLAYREADY: return y.PLAYREADY;
		case v.WIDEVINE: return y.WIDEVINE;
		case v.CLEARKEY: return y.CLEARKEY;
	}
}
function getKeySystemsForConfig(e) {
	let { drmSystems: t, widevineLicenseUrl: n } = e, r = t ? [
		v.FAIRPLAY,
		v.WIDEVINE,
		v.PLAYREADY,
		v.CLEARKEY
	].filter((e) => !!t[e]) : [];
	return !r[v.WIDEVINE] && n && r.push(v.WIDEVINE), r;
}
var x = function(e) {
	return _ != null && (e = _.navigator) != null && e.requestMediaKeySystemAccess ? self.navigator.requestMediaKeySystemAccess.bind(self.navigator) : null;
}();
function getSupportedMediaKeySystemConfigurations(e, t, n, r) {
	let i;
	switch (e) {
		case v.FAIRPLAY:
			i = ["cenc", "sinf"];
			break;
		case v.WIDEVINE:
		case v.PLAYREADY:
			i = ["cenc"];
			break;
		case v.CLEARKEY:
			i = ["cenc", "keyids"];
			break;
		default: throw Error(`Unknown key-system: ${e}`);
	}
	return createMediaKeySystemConfigurations(i, t, n, r);
}
function createMediaKeySystemConfigurations(e, t, n, r) {
	return [{
		initDataTypes: e,
		persistentState: r.persistentState || "optional",
		distinctiveIdentifier: r.distinctiveIdentifier || "optional",
		sessionTypes: r.sessionTypes || [r.sessionType || "temporary"],
		audioCapabilities: t.map((e) => ({
			contentType: `audio/mp4; codecs="${e}"`,
			robustness: r.audioRobustness || "",
			encryptionScheme: r.audioEncryptionScheme || null
		})),
		videoCapabilities: n.map((e) => ({
			contentType: `video/mp4; codecs="${e}"`,
			robustness: r.videoRobustness || "",
			encryptionScheme: r.videoEncryptionScheme || null
		}))
	}];
}
function sliceUint8(e, t, n) {
	return Uint8Array.prototype.slice ? e.slice(t, n) : new Uint8Array(Array.prototype.slice.call(e, t, n));
}
var isHeader$2 = (e, t) => t + 10 <= e.length && e[t] === 73 && e[t + 1] === 68 && e[t + 2] === 51 && e[t + 3] < 255 && e[t + 4] < 255 && e[t + 6] < 128 && e[t + 7] < 128 && e[t + 8] < 128 && e[t + 9] < 128, isFooter = (e, t) => t + 10 <= e.length && e[t] === 51 && e[t + 1] === 68 && e[t + 2] === 73 && e[t + 3] < 255 && e[t + 4] < 255 && e[t + 6] < 128 && e[t + 7] < 128 && e[t + 8] < 128 && e[t + 9] < 128, getID3Data = (e, t) => {
	let n = t, r = 0;
	for (; isHeader$2(e, t);) {
		r += 10;
		let n = readSize(e, t + 6);
		r += n, isFooter(e, t + 10) && (r += 10), t += r;
	}
	if (r > 0) return e.subarray(n, n + r);
}, readSize = (e, t) => {
	let n = 0;
	return n = (e[t] & 127) << 21, n |= (e[t + 1] & 127) << 14, n |= (e[t + 2] & 127) << 7, n |= e[t + 3] & 127, n;
}, canParse$2 = (e, t) => isHeader$2(e, t) && readSize(e, t + 6) + 10 <= e.length - t, getTimeStamp = (e) => {
	let t = getID3Frames(e);
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (isTimeStampFrame(n)) return readTimeStamp(n);
	}
}, isTimeStampFrame = (e) => e && e.key === "PRIV" && e.info === "com.apple.streaming.transportStreamTimestamp", getFrameData = (e) => {
	let t = String.fromCharCode(e[0], e[1], e[2], e[3]), n = readSize(e, 4);
	return {
		type: t,
		size: n,
		data: e.subarray(10, 10 + n)
	};
}, getID3Frames = (e) => {
	let t = 0, n = [];
	for (; isHeader$2(e, t);) {
		let r = readSize(e, t + 6);
		t += 10;
		let i = t + r;
		for (; t + 8 < i;) {
			let r = getFrameData(e.subarray(t)), i = decodeFrame(r);
			i && n.push(i), t += r.size + 10;
		}
		isFooter(e, t) && (t += 10);
	}
	return n;
}, decodeFrame = (e) => e.type === "PRIV" ? decodePrivFrame(e) : e.type[0] === "W" ? decodeURLFrame(e) : decodeTextFrame(e), decodePrivFrame = (e) => {
	if (e.size < 2) return;
	let t = utf8ArrayToStr(e.data, !0), n = new Uint8Array(e.data.subarray(t.length + 1));
	return {
		key: e.type,
		info: t,
		data: n.buffer
	};
}, decodeTextFrame = (e) => {
	if (e.size < 2) return;
	if (e.type === "TXXX") {
		let t = 1, n = utf8ArrayToStr(e.data.subarray(t), !0);
		t += n.length + 1;
		let r = utf8ArrayToStr(e.data.subarray(t));
		return {
			key: e.type,
			info: n,
			data: r
		};
	}
	let t = utf8ArrayToStr(e.data.subarray(1));
	return {
		key: e.type,
		data: t
	};
}, decodeURLFrame = (e) => {
	if (e.type === "WXXX") {
		if (e.size < 2) return;
		let t = 1, n = utf8ArrayToStr(e.data.subarray(t), !0);
		t += n.length + 1;
		let r = utf8ArrayToStr(e.data.subarray(t));
		return {
			key: e.type,
			info: n,
			data: r
		};
	}
	let t = utf8ArrayToStr(e.data);
	return {
		key: e.type,
		data: t
	};
}, readTimeStamp = (e) => {
	if (e.data.byteLength === 8) {
		let t = new Uint8Array(e.data), n = t[3] & 1, r = (t[4] << 23) + (t[5] << 15) + (t[6] << 7) + t[7];
		return r /= 45, n && (r += 47721858.84), Math.round(r);
	}
}, utf8ArrayToStr = (e, t = !1) => {
	let n = getTextDecoder();
	if (n) {
		let r = n.decode(e);
		if (t) {
			let e = r.indexOf("\0");
			return e === -1 ? r : r.substring(0, e);
		}
		return r.replace(/\0/g, "");
	}
	let r = e.length, i, a, o, s = "", c = 0;
	for (; c < r;) {
		if (i = e[c++], i === 0 && t) return s;
		if (i !== 0 && i !== 3) switch (i >> 4) {
			case 0:
			case 1:
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:
			case 7:
				s += String.fromCharCode(i);
				break;
			case 12:
			case 13:
				a = e[c++], s += String.fromCharCode((i & 31) << 6 | a & 63);
				break;
			case 14: a = e[c++], o = e[c++], s += String.fromCharCode((i & 15) << 12 | (a & 63) << 6 | (o & 63) << 0);
		}
	}
	return s;
}, S;
function getTextDecoder() {
	if (!navigator.userAgent.includes("PlayStation 4")) return !S && self.TextDecoder !== void 0 && (S = new self.TextDecoder("utf-8")), S;
}
var C = { hexDump: function(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) {
		let r = e[n].toString(16);
		r.length < 2 && (r = "0" + r), t += r;
	}
	return t;
} }, w = 2 ** 32 - 1, T = [].push, E = {
	video: 1,
	audio: 2,
	id3: 3,
	text: 4
};
function bin2str(e) {
	return String.fromCharCode.apply(null, e);
}
function readUint16(e, t) {
	let n = e[t] << 8 | e[t + 1];
	return n < 0 ? 65536 + n : n;
}
function readUint32(e, t) {
	let n = readSint32(e, t);
	return n < 0 ? 4294967296 + n : n;
}
function readUint64(e, t) {
	let n = readUint32(e, t);
	return n *= 2 ** 32, n += readUint32(e, t + 4), n;
}
function readSint32(e, t) {
	return e[t] << 24 | e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3];
}
function writeUint32(e, t, n) {
	e[t] = n >> 24, e[t + 1] = n >> 16 & 255, e[t + 2] = n >> 8 & 255, e[t + 3] = n & 255;
}
function hasMoofData(e) {
	let t = e.byteLength;
	for (let n = 0; n < t;) {
		let r = readUint32(e, n);
		if (r > 8 && e[n + 4] === 109 && e[n + 5] === 111 && e[n + 6] === 111 && e[n + 7] === 102) return !0;
		n = r > 1 ? n + r : t;
	}
	return !1;
}
function findBox(e, t) {
	let n = [];
	if (!t.length) return n;
	let r = e.byteLength;
	for (let i = 0; i < r;) {
		let a = readUint32(e, i), o = bin2str(e.subarray(i + 4, i + 8)), s = a > 1 ? i + a : r;
		if (o === t[0]) {
			if (t.length === 1) n.push(e.subarray(i + 8, s));
			else {
				let r = findBox(e.subarray(i + 8, s), t.slice(1));
				r.length && T.apply(n, r);
			}
		}
		i = s;
	}
	return n;
}
function parseSegmentIndex(e) {
	let t = [], n = e[0], r = 8, i = readUint32(e, r);
	r += 4;
	let a = 0, o = 0;
	n === 0 ? (a = readUint32(e, r), o = readUint32(e, r + 4), r += 8) : (a = readUint64(e, r), o = readUint64(e, r + 8), r += 16), r += 2;
	let s = e.length + o, c = readUint16(e, r);
	r += 2;
	for (let n = 0; n < c; n++) {
		let n = r, a = readUint32(e, n);
		n += 4;
		let o = a & 2147483647;
		if ((a & 2147483648) >>> 31 == 1) return d.warn("SIDX has hierarchical references (not supported)"), null;
		let c = readUint32(e, n);
		n += 4, t.push({
			referenceSize: o,
			subsegmentDuration: c,
			info: {
				duration: c / i,
				start: s,
				end: s + o - 1
			}
		}), s += o, n += 4, r = n;
	}
	return {
		earliestPresentationTime: a,
		timescale: i,
		version: n,
		referencesCount: c,
		references: t
	};
}
function parseInitSegment(e) {
	let t = [], n = findBox(e, ["moov", "trak"]);
	for (let e = 0; e < n.length; e++) {
		let r = n[e], i = findBox(r, ["tkhd"])[0];
		if (i) {
			let e = i[0], n = readUint32(i, e === 0 ? 12 : 20), a = findBox(r, ["mdia", "mdhd"])[0];
			if (a) {
				e = a[0];
				let i = readUint32(a, e === 0 ? 12 : 20), o = findBox(r, ["mdia", "hdlr"])[0];
				if (o) {
					let e = bin2str(o.subarray(8, 12)), a = {
						soun: h.AUDIO,
						vide: h.VIDEO
					}[e];
					if (a) {
						let e = findBox(r, [
							"mdia",
							"minf",
							"stbl",
							"stsd"
						])[0], o = parseStsd(e);
						t[n] = {
							timescale: i,
							type: a
						}, t[a] = _objectSpread2({
							timescale: i,
							id: n
						}, o);
					}
				}
			}
		}
	}
	return findBox(e, [
		"moov",
		"mvex",
		"trex"
	]).forEach((e) => {
		let n = readUint32(e, 4), r = t[n];
		r && (r.default = {
			duration: readUint32(e, 12),
			flags: readUint32(e, 20)
		});
	}), t;
}
function parseStsd(e) {
	let t = e.subarray(8), n = t.subarray(86), r = bin2str(t.subarray(4, 8)), i = r, a = r === "enca" || r === "encv";
	switch (a && findBox(findBox(t, [r])[0].subarray(r === "enca" ? 28 : 78), ["sinf"]).forEach((e) => {
		let t = findBox(e, ["schm"])[0];
		if (t) {
			let n = bin2str(t.subarray(4, 8));
			if (n === "cbcs" || n === "cenc") {
				let t = findBox(e, ["frma"])[0];
				t && (i = bin2str(t));
			}
		}
	}), i) {
		case "avc1":
		case "avc2":
		case "avc3":
		case "avc4": {
			let e = findBox(n, ["avcC"])[0];
			i += "." + toHex(e[1]) + toHex(e[2]) + toHex(e[3]);
			break;
		}
		case "mp4a": {
			let e = findBox(t, [r])[0], n = findBox(e.subarray(28), ["esds"])[0];
			if (n && n.length > 12) {
				let e = 4;
				if (n[e++] !== 3) break;
				e = skipBERInteger(n, e), e += 2;
				let t = n[e++];
				if (t & 128 && (e += 2), t & 64 && (e += n[e++]), n[e++] !== 4) break;
				e = skipBERInteger(n, e);
				let r = n[e++];
				if (r === 64) i += "." + toHex(r);
				else break;
				if (e += 12, n[e++] !== 5) break;
				e = skipBERInteger(n, e);
				let a = n[e++], o = (a & 248) >> 3;
				o === 31 && (o += 1 + ((a & 7) << 3) + ((n[e] & 224) >> 5)), i += "." + o;
			}
			break;
		}
		case "hvc1":
		case "hev1": {
			let e = findBox(n, ["hvcC"])[0], t = e[1], r = [
				"",
				"A",
				"B",
				"C"
			][t >> 6], a = t & 31, o = readUint32(e, 2), s = (t & 32) >> 5 ? "H" : "L", c = e[12], l = e.subarray(6, 12);
			i += "." + r + a, i += "." + o.toString(16).toUpperCase(), i += "." + s + c;
			let u = "";
			for (let e = l.length; e--;) {
				let t = l[e];
				(t || u) && (u = "." + t.toString(16).toUpperCase() + u);
			}
			i += u;
			break;
		}
		case "dvh1":
		case "dvhe": {
			let e = findBox(n, ["dvcC"])[0], t = e[2] >> 1 & 127, r = e[2] << 5 & 32 | e[3] >> 3 & 31;
			i += "." + addLeadingZero(t) + "." + addLeadingZero(r);
			break;
		}
		case "vp09": {
			let e = findBox(n, ["vpcC"])[0], t = e[4], r = e[5], a = e[6] >> 4 & 15;
			i += "." + addLeadingZero(t) + "." + addLeadingZero(r) + "." + addLeadingZero(a);
			break;
		}
		case "av01": {
			let e = findBox(n, ["av1C"])[0], t = e[1] >>> 5, r = e[1] & 31, a = e[2] >>> 7 ? "H" : "M", o = (e[2] & 64) >> 6, s = (e[2] & 32) >> 5, c = t === 2 && o ? s ? 12 : 10 : o ? 10 : 8, l = (e[2] & 16) >> 4, u = (e[2] & 8) >> 3, d = (e[2] & 4) >> 2, f = e[2] & 3;
			i += "." + t + "." + addLeadingZero(r) + a + "." + addLeadingZero(c) + "." + l + "." + u + d + f + "." + addLeadingZero(1) + "." + addLeadingZero(1) + "." + addLeadingZero(1) + ".0";
			break;
		}
	}
	return {
		codec: i,
		encrypted: a
	};
}
function skipBERInteger(e, t) {
	let n = t + 5;
	for (; e[t++] & 128 && t < n;);
	return t;
}
function toHex(e) {
	return ("0" + e.toString(16).toUpperCase()).slice(-2);
}
function addLeadingZero(e) {
	return (e < 10 ? "0" : "") + e;
}
function patchEncyptionData(e, t) {
	if (!e || !t) return e;
	let n = t.keyId;
	return n && t.isCommonEncryption && findBox(e, ["moov", "trak"]).forEach((e) => {
		let t = findBox(e, [
			"mdia",
			"minf",
			"stbl",
			"stsd"
		])[0].subarray(8), r = findBox(t, ["enca"]), i = r.length > 0;
		i || (r = findBox(t, ["encv"])), r.forEach((e) => {
			findBox(i ? e.subarray(28) : e.subarray(78), ["sinf"]).forEach((e) => {
				let t = parseSinf(e);
				if (t) {
					let e = t.subarray(8, 24);
					e.some((e) => e !== 0) || (d.log(`[eme] Patching keyId in 'enc${i ? "a" : "v"}>sinf>>tenc' box: ${C.hexDump(e)} -> ${C.hexDump(n)}`), t.set(n, 8));
				}
			});
		});
	}), e;
}
function parseSinf(e) {
	let t = findBox(e, ["schm"])[0];
	if (t) {
		let n = bin2str(t.subarray(4, 8));
		if (n === "cbcs" || n === "cenc") return findBox(e, ["schi", "tenc"])[0];
	}
	return d.error("[eme] missing 'schm' box"), null;
}
function getStartDTS(e, t) {
	return findBox(t, ["moof", "traf"]).reduce((t, r) => {
		let i = findBox(r, ["tfdt"])[0], a = i[0], o = findBox(r, ["tfhd"]).reduce((t, r) => {
			let o = e[readUint32(r, 4)];
			if (o) {
				let e = readUint32(i, 4);
				if (a === 1) {
					if (e === w) return d.warn("[mp4-demuxer]: Ignoring assumed invalid signed 64-bit track fragment decode time"), t;
					e *= w + 1, e += readUint32(i, 8);
				}
				let r = o.timescale || 9e4, s = e / r;
				if (n(s) && (t === null || s < t)) return s;
			}
			return t;
		}, null);
		return o !== null && n(o) && (t === null || o < t) ? o : t;
	}, null);
}
function getDuration(e, t) {
	let r = 0, i = 0, a = 0, o = findBox(e, ["moof", "traf"]);
	for (let e = 0; e < o.length; e++) {
		let n = o[e], s = findBox(n, ["tfhd"])[0], c = t[readUint32(s, 4)];
		if (!c) continue;
		let l = c.default, u = readUint32(s, 0) | l?.flags, d = l?.duration;
		u & 8 && (d = u & 2 ? readUint32(s, 12) : readUint32(s, 8));
		let f = c.timescale || 9e4, p = findBox(n, ["trun"]);
		for (let e = 0; e < p.length; e++) {
			if (r = computeRawDurationFromSamples(p[e]), !r && d) {
				let t = readUint32(p[e], 4);
				r = d * t;
			}
			c.type === h.VIDEO ? i += r / f : c.type === h.AUDIO && (a += r / f);
		}
	}
	if (i === 0 && a === 0) {
		let t = Infinity, r = 0, i = 0, a = findBox(e, ["sidx"]);
		for (let e = 0; e < a.length; e++) {
			let n = parseSegmentIndex(a[e]);
			if (n != null && n.references) {
				t = Math.min(t, n.earliestPresentationTime / n.timescale);
				let e = n.references.reduce((e, t) => e + t.info.duration || 0, 0);
				r = Math.max(r, e + n.earliestPresentationTime / n.timescale), i = r - t;
			}
		}
		if (i && n(i)) return i;
	}
	return i || a;
}
function computeRawDurationFromSamples(e) {
	let t = readUint32(e, 0), n = 8;
	t & 1 && (n += 4), t & 4 && (n += 4);
	let r = 0, i = readUint32(e, 4);
	for (let a = 0; a < i; a++) {
		if (t & 256) {
			let t = readUint32(e, n);
			r += t, n += 4;
		}
		t & 512 && (n += 4), t & 1024 && (n += 4), t & 2048 && (n += 4);
	}
	return r;
}
function offsetStartDTS(e, t, n) {
	findBox(t, ["moof", "traf"]).forEach((t) => {
		findBox(t, ["tfhd"]).forEach((r) => {
			let i = e[readUint32(r, 4)];
			if (!i) return;
			let a = i.timescale || 9e4;
			findBox(t, ["tfdt"]).forEach((e) => {
				let t = e[0], r = n * a;
				if (r) {
					let n = readUint32(e, 4);
					if (t === 0) n -= r, n = Math.max(n, 0), writeUint32(e, 4, n);
					else {
						n *= 2 ** 32, n += readUint32(e, 8), n -= r, n = Math.max(n, 0);
						let t = Math.floor(n / (w + 1)), i = Math.floor(n % (w + 1));
						writeUint32(e, 4, t), writeUint32(e, 8, i);
					}
				}
			});
		});
	});
}
function segmentValidRange(e) {
	let t = {
		valid: null,
		remainder: null
	}, n = findBox(e, ["moof"]);
	if (n.length < 2) return t.remainder = e, t;
	let r = n[n.length - 1];
	return t.valid = sliceUint8(e, 0, r.byteOffset - 8), t.remainder = sliceUint8(e, r.byteOffset - 8), t;
}
function appendUint8Array(e, t) {
	let n = new Uint8Array(e.length + t.length);
	return n.set(e), n.set(t, e.length), n;
}
function parseSamples(e, t) {
	let n = [], r = t.samples, i = t.timescale, a = t.id, o = !1;
	return findBox(r, ["moof"]).map((s) => {
		let c = s.byteOffset - 8;
		findBox(s, ["traf"]).map((s) => {
			let l = findBox(s, ["tfdt"]).map((e) => {
				let t = e[0], n = readUint32(e, 4);
				return t === 1 && (n *= 2 ** 32, n += readUint32(e, 8)), n / i;
			})[0];
			return l !== void 0 && (e = l), findBox(s, ["tfhd"]).map((l) => {
				let u = readUint32(l, 4), d = readUint32(l, 0) & 16777215, f = !!(d & 1), p = !!(d & 2), m = !!(d & 8), g = 0, _ = !!(d & 16), v = 0, y = !!(d & 32), b = 8;
				u === a && (f && (b += 8), p && (b += 4), m && (g = readUint32(l, b), b += 4), _ && (v = readUint32(l, b), b += 4), y && (b += 4), t.type === "video" && (o = isHEVC(t.codec)), findBox(s, ["trun"]).map((a) => {
					let s = a[0], l = readUint32(a, 0) & 16777215, u = !!(l & 1), d = 0, f = !!(l & 4), p = !!(l & 256), m = 0, _ = !!(l & 512), y = 0, b = !!(l & 1024), x = !!(l & 2048), S = 0, C = readUint32(a, 4), w = 8;
					u && (d = readUint32(a, w), w += 4), f && (w += 4);
					let T = d + c;
					for (let c = 0; c < C; c++) {
						if (p ? (m = readUint32(a, w), w += 4) : m = g, _ ? (y = readUint32(a, w), w += 4) : y = v, b && (w += 4), x && (S = s === 0 ? readUint32(a, w) : readSint32(a, w), w += 4), t.type === h.VIDEO) {
							let t = 0;
							for (; t < y;) {
								let a = readUint32(r, T);
								T += 4, isSEIMessage(o, r[T]) && parseSEIMessageFromNALu(r.subarray(T, T + a), o ? 2 : 1, e + S / i, n), T += a, t += a + 4;
							}
						}
						e += m / i;
					}
				}));
			});
		});
	}), n;
}
function isHEVC(e) {
	if (!e) return !1;
	let t = e.indexOf("."), n = t < 0 ? e : e.substring(0, t);
	return n === "hvc1" || n === "hev1" || n === "dvh1" || n === "dvhe";
}
function isSEIMessage(e, t) {
	if (e) {
		let e = t >> 1 & 63;
		return e === 39 || e === 40;
	}
	return (t & 31) == 6;
}
function parseSEIMessageFromNALu(e, t, n, r) {
	let i = discardEPB(e), a = 0;
	a += t;
	let o = 0, s = 0, c = 0;
	for (; a < i.length;) {
		o = 0;
		do {
			if (a >= i.length) break;
			c = i[a++], o += c;
		} while (c === 255);
		s = 0;
		do {
			if (a >= i.length) break;
			c = i[a++], s += c;
		} while (c === 255);
		let e = i.length - a, t = a;
		if (s < e) a += s;
		else if (s > e) {
			d.error(`Malformed SEI payload. ${s} is too small, only ${e} bytes left to parse.`);
			break;
		}
		if (o === 4) {
			if (i[t++] === 181) {
				let e = readUint16(i, t);
				if (t += 2, e === 49) {
					let e = readUint32(i, t);
					if (t += 4, e === 1195456820) {
						let e = i[t++];
						if (e === 3) {
							let a = i[t++], s = 31 & a, c = 64 & a, l = c ? 2 + s * 3 : 0, u = new Uint8Array(l);
							if (c) {
								u[0] = a;
								for (let e = 1; e < l; e++) u[e] = i[t++];
							}
							r.push({
								type: e,
								payloadType: o,
								pts: n,
								bytes: u
							});
						}
					}
				}
			}
		} else if (o === 5 && s > 16) {
			let e = [];
			for (let n = 0; n < 16; n++) {
				let r = i[t++].toString(16);
				e.push(r.length == 1 ? "0" + r : r), (n === 3 || n === 5 || n === 7 || n === 9) && e.push("-");
			}
			let a = s - 16, c = new Uint8Array(a);
			for (let e = 0; e < a; e++) c[e] = i[t++];
			r.push({
				payloadType: o,
				pts: n,
				uuid: e.join(""),
				userData: utf8ArrayToStr(c),
				userDataBytes: c
			});
		}
	}
}
function discardEPB(e) {
	let t = e.byteLength, n = [], r = 1;
	for (; r < t - 2;) e[r] === 0 && e[r + 1] === 0 && e[r + 2] === 3 ? (n.push(r + 2), r += 2) : r++;
	if (n.length === 0) return e;
	let i = t - n.length, a = new Uint8Array(i), o = 0;
	for (r = 0; r < i; o++, r++) o === n[0] && (o++, n.shift()), a[r] = e[o];
	return a;
}
function parseEmsg(e) {
	let t = e[0], n = "", i = "", a = 0, o = 0, s = 0, c = 0, l = 0, u = 0;
	if (t === 0) {
		for (; bin2str(e.subarray(u, u + 1)) !== "\0";) n += bin2str(e.subarray(u, u + 1)), u += 1;
		for (n += bin2str(e.subarray(u, u + 1)), u += 1; bin2str(e.subarray(u, u + 1)) !== "\0";) i += bin2str(e.subarray(u, u + 1)), u += 1;
		i += bin2str(e.subarray(u, u + 1)), u += 1, a = readUint32(e, 12), o = readUint32(e, 16), c = readUint32(e, 20), l = readUint32(e, 24), u = 28;
	} else if (t === 1) {
		u += 4, a = readUint32(e, u), u += 4;
		let t = readUint32(e, u);
		u += 4;
		let o = readUint32(e, u);
		for (u += 4, s = 2 ** 32 * t + o, r(s) || (s = 2 ** 53 - 1, d.warn("Presentation time exceeds safe integer limit and wrapped to max safe integer in parsing emsg box")), c = readUint32(e, u), u += 4, l = readUint32(e, u), u += 4; bin2str(e.subarray(u, u + 1)) !== "\0";) n += bin2str(e.subarray(u, u + 1)), u += 1;
		for (n += bin2str(e.subarray(u, u + 1)), u += 1; bin2str(e.subarray(u, u + 1)) !== "\0";) i += bin2str(e.subarray(u, u + 1)), u += 1;
		i += bin2str(e.subarray(u, u + 1)), u += 1;
	}
	let f = e.subarray(u, e.byteLength);
	return {
		schemeIdUri: n,
		value: i,
		timeScale: a,
		presentationTime: s,
		presentationTimeDelta: o,
		eventDuration: c,
		id: l,
		payload: f
	};
}
function mp4Box(e, ...t) {
	let n = t.length, r = 8, i = n;
	for (; i--;) r += t[i].byteLength;
	let a = new Uint8Array(r);
	for (a[0] = r >> 24 & 255, a[1] = r >> 16 & 255, a[2] = r >> 8 & 255, a[3] = r & 255, a.set(e, 4), i = 0, r = 8; i < n; i++) a.set(t[i], r), r += t[i].byteLength;
	return a;
}
function mp4pssh(e, t, n) {
	if (e.byteLength !== 16) throw RangeError("Invalid system id");
	let r, i;
	if (t) {
		r = 1, i = new Uint8Array(t.length * 16);
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			if (n.byteLength !== 16) throw RangeError("Invalid key");
			i.set(n, e * 16);
		}
	} else r = 0, i = /* @__PURE__ */ new Uint8Array();
	let a;
	r > 0 ? (a = /* @__PURE__ */ new Uint8Array(4), t.length > 0 && new DataView(a.buffer).setUint32(0, t.length, !1)) : a = /* @__PURE__ */ new Uint8Array();
	let o = /* @__PURE__ */ new Uint8Array(4);
	return n && n.byteLength > 0 && new DataView(o.buffer).setUint32(0, n.byteLength, !1), mp4Box([
		112,
		115,
		115,
		104
	], new Uint8Array([
		r,
		0,
		0,
		0
	]), e, a, i, o, n || /* @__PURE__ */ new Uint8Array());
}
function parsePssh(e) {
	if (!(e instanceof ArrayBuffer) || e.byteLength < 32) return null;
	let t = {
		version: 0,
		systemId: "",
		kids: null,
		data: null
	}, n = new DataView(e), r = n.getUint32(0);
	if (e.byteLength !== r && r > 44 || n.getUint32(4) !== 1886614376 || (t.version = n.getUint32(8) >>> 24, t.version > 1)) return null;
	t.systemId = C.hexDump(new Uint8Array(e, 12, 16));
	let i = n.getUint32(28);
	if (t.version === 0) {
		if (r - 32 < i) return null;
		t.data = new Uint8Array(e, 32, i);
	} else if (t.version === 1) {
		t.kids = [];
		for (let n = 0; n < i; n++) t.kids.push(new Uint8Array(e, 32 + n * 16, 16));
	}
	return t;
}
var D = {}, O = class LevelKey {
	static clearKeyUriToKeyIdMap() {
		D = {};
	}
	constructor(e, t, n, r = [1], i = null) {
		this.uri = void 0, this.method = void 0, this.keyFormat = void 0, this.keyFormatVersions = void 0, this.encrypted = void 0, this.isCommonEncryption = void 0, this.iv = null, this.key = null, this.keyId = null, this.pssh = null, this.method = e, this.uri = t, this.keyFormat = n, this.keyFormatVersions = r, this.iv = i, this.encrypted = e ? e !== "NONE" : !1, this.isCommonEncryption = this.encrypted && e !== "AES-128";
	}
	isSupported() {
		if (this.method) {
			if (this.method === "AES-128" || this.method === "NONE") return !0;
			if (this.keyFormat === "identity") return this.method === "SAMPLE-AES";
			switch (this.keyFormat) {
				case y.FAIRPLAY:
				case y.WIDEVINE:
				case y.PLAYREADY:
				case y.CLEARKEY: return [
					"ISO-23001-7",
					"SAMPLE-AES",
					"SAMPLE-AES-CENC",
					"SAMPLE-AES-CTR"
				].indexOf(this.method) !== -1;
			}
		}
		return !1;
	}
	getDecryptData(e) {
		if (!this.encrypted || !this.uri) return null;
		if (this.method === "AES-128" && this.uri && !this.iv) {
			typeof e != "number" && (this.method === "AES-128" && !this.iv && d.warn(`missing IV for initialization segment with method="${this.method}" - compliance issue`), e = 0);
			let t = createInitializationVector(e);
			return new LevelKey(this.method, this.uri, "identity", this.keyFormatVersions, t);
		}
		let t = convertDataUriToArrayBytes(this.uri);
		if (t) switch (this.keyFormat) {
			case y.WIDEVINE:
				this.pssh = t, t.length >= 22 && (this.keyId = t.subarray(t.length - 22, t.length - 6));
				break;
			case y.PLAYREADY: {
				let e = new Uint8Array([
					154,
					4,
					240,
					121,
					152,
					64,
					66,
					134,
					171,
					146,
					230,
					91,
					224,
					136,
					95,
					149
				]);
				this.pssh = mp4pssh(e, null, t);
				let n = new Uint16Array(t.buffer, t.byteOffset, t.byteLength / 2), r = String.fromCharCode.apply(null, Array.from(n)), i = r.substring(r.indexOf("<"), r.length), a = new DOMParser().parseFromString(i, "text/xml").getElementsByTagName("KID")[0];
				if (a) {
					let e = a.childNodes[0] ? a.childNodes[0].nodeValue : a.getAttribute("VALUE");
					if (e) {
						let t = base64Decode(e).subarray(0, 16);
						changeEndianness(t), this.keyId = t;
					}
				}
				break;
			}
			default: {
				let e = t.subarray(0, 16);
				if (e.length !== 16) {
					let t = /* @__PURE__ */ new Uint8Array(16);
					t.set(e, 16 - e.length), e = t;
				}
				this.keyId = e;
				break;
			}
		}
		if (!this.keyId || this.keyId.byteLength !== 16) {
			let e = D[this.uri];
			if (!e) {
				let t = Object.keys(D).length % (2 ** 53 - 1);
				e = /* @__PURE__ */ new Uint8Array(16), new DataView(e.buffer, 12, 4).setUint32(0, t), D[this.uri] = e;
			}
			this.keyId = e;
		}
		return this;
	}
};
function createInitializationVector(e) {
	let t = /* @__PURE__ */ new Uint8Array(16);
	for (let n = 12; n < 16; n++) t[n] = e >> 8 * (15 - n) & 255;
	return t;
}
var k = /\{\$([a-zA-Z0-9-_]+)\}/g;
function hasVariableReferences(e) {
	return k.test(e);
}
function substituteVariablesInAttributes(e, t, n) {
	if (e.variableList !== null || e.hasVariableRefs) for (let r = n.length; r--;) {
		let i = n[r], a = t[i];
		a && (t[i] = substituteVariables(e, a));
	}
}
function substituteVariables(e, t) {
	if (e.variableList !== null || e.hasVariableRefs) {
		let n = e.variableList;
		return t.replace(k, (t) => {
			let r = t.substring(2, t.length - 1), i = n?.[r];
			return i === void 0 ? (e.playlistParsingError ||= /* @__PURE__ */ Error(`Missing preceding EXT-X-DEFINE tag for Variable Reference: "${r}"`), t) : i;
		});
	}
	return t;
}
function addVariableDefinition(e, t, n) {
	let r = e.variableList;
	r || (e.variableList = r = {});
	let i, a;
	if ("QUERYPARAM" in t) {
		i = t.QUERYPARAM;
		try {
			let e = new self.URL(n).searchParams;
			if (e.has(i)) a = e.get(i);
			else throw Error(`"${i}" does not match any query parameter in URI: "${n}"`);
		} catch (t) {
			e.playlistParsingError ||= /* @__PURE__ */ Error(`EXT-X-DEFINE QUERYPARAM: ${t.message}`);
		}
	} else i = t.NAME, a = t.VALUE;
	i in r ? e.playlistParsingError ||= /* @__PURE__ */ Error(`EXT-X-DEFINE duplicate Variable Name declarations: "${i}"`) : r[i] = a || "";
}
function importVariableDefinition(e, t, n) {
	let r = t.IMPORT;
	if (n && r in n) {
		let t = e.variableList;
		t || (e.variableList = t = {}), t[r] = n[r];
	} else e.playlistParsingError ||= /* @__PURE__ */ Error(`EXT-X-DEFINE IMPORT attribute not found in Multivariant Playlist: "${r}"`);
}
function getMediaSource(e = !0) {
	if (!(typeof self > "u")) return (e || !self.MediaSource) && self.ManagedMediaSource || self.MediaSource || self.WebKitMediaSource;
}
function isManagedMediaSource(e) {
	return typeof self < "u" && e === self.ManagedMediaSource;
}
var A = {
	audio: {
		a3ds: 1,
		"ac-3": .95,
		"ac-4": 1,
		alac: .9,
		alaw: 1,
		dra1: 1,
		"dts+": 1,
		"dts-": 1,
		dtsc: 1,
		dtse: 1,
		dtsh: 1,
		"ec-3": .9,
		enca: 1,
		fLaC: .9,
		flac: .9,
		FLAC: .9,
		g719: 1,
		g726: 1,
		m4ae: 1,
		mha1: 1,
		mha2: 1,
		mhm1: 1,
		mhm2: 1,
		mlpa: 1,
		mp4a: 1,
		"raw ": 1,
		Opus: 1,
		opus: 1,
		samr: 1,
		sawb: 1,
		sawp: 1,
		sevc: 1,
		sqcp: 1,
		ssmv: 1,
		twos: 1,
		ulaw: 1
	},
	video: {
		avc1: 1,
		avc2: 1,
		avc3: 1,
		avc4: 1,
		avcp: 1,
		av01: .8,
		drac: 1,
		dva1: 1,
		dvav: 1,
		dvh1: .7,
		dvhe: .7,
		encv: 1,
		hev1: .75,
		hvc1: .75,
		mjp2: 1,
		mp4v: 1,
		mvc1: 1,
		mvc2: 1,
		mvc3: 1,
		mvc4: 1,
		resv: 1,
		rv60: 1,
		s263: 1,
		svc1: 1,
		svc2: 1,
		"vc-1": 1,
		vp08: 1,
		vp09: .9
	},
	text: {
		stpp: 1,
		wvtt: 1
	}
};
function isCodecType(e, t) {
	let n = A[t];
	return !!n && !!n[e.slice(0, 4)];
}
function areCodecsMediaSourceSupported(e, t, n = !0) {
	return !e.split(",").some((e) => !isCodecMediaSourceSupported(e, t, n));
}
function isCodecMediaSourceSupported(e, t, n = !0) {
	return getMediaSource(n)?.isTypeSupported(mimeTypeForCodec(e, t)) ?? !1;
}
function mimeTypeForCodec(e, t) {
	return `${t}/mp4;codecs="${e}"`;
}
function videoCodecPreferenceValue(e) {
	if (e) {
		let t = e.substring(0, 4);
		return A.video[t];
	}
	return 2;
}
function codecsSetSelectionPreferenceValue(e) {
	return e.split(",").reduce((e, t) => {
		let n = A.video[t];
		return n ? (n * 2 + e) / (e ? 3 : 2) : (A.audio[t] + e) / (e ? 2 : 1);
	}, 0);
}
var j = {};
function getCodecCompatibleNameLower(e, t = !0) {
	if (j[e]) return j[e];
	let n = {
		flac: [
			"flac",
			"fLaC",
			"FLAC"
		],
		opus: ["opus", "Opus"]
	}[e];
	for (let r = 0; r < n.length; r++) if (isCodecMediaSourceSupported(n[r], "audio", t)) return j[e] = n[r], n[r];
	return e;
}
var M = /flac|opus/i;
function getCodecCompatibleName(e, t = !0) {
	return e.replace(M, (e) => getCodecCompatibleNameLower(e.toLowerCase(), t));
}
function pickMostCompleteCodecName(e, t) {
	return e && e !== "mp4a" ? e : t && t.split(",")[0];
}
function convertAVC1ToAVCOTI(e) {
	let t = e.split(",");
	for (let e = 0; e < t.length; e++) {
		let n = t[e].split(".");
		if (n.length > 2) {
			let r = n.shift() + ".";
			r += parseInt(n.shift()).toString(16), r += ("000" + parseInt(n.shift()).toString(16)).slice(-4), t[e] = r;
		}
	}
	return t.join(",");
}
var N = /#EXT-X-STREAM-INF:([^\r\n]*)(?:[\r\n](?:#[^\r\n]*)?)*([^\r\n]+)|#EXT-X-(SESSION-DATA|SESSION-KEY|DEFINE|CONTENT-STEERING|START):([^\r\n]*)[\r\n]+/g, P = /#EXT-X-MEDIA:(.*)/g, ee = /^#EXT(?:INF|-X-TARGETDURATION):/m, te = new RegExp([
	"#EXTINF:\\s*(\\d*(?:\\.\\d+)?)(?:,(.*)\\s+)?",
	"(?!#) *(\\S[^\\r\\n]*)",
	"#EXT-X-BYTERANGE:*(.+)",
	"#EXT-X-PROGRAM-DATE-TIME:(.+)",
	"#.*"
].join("|"), "g"), ne = new RegExp([
	"#(EXTM3U)",
	"#EXT-X-(DATERANGE|DEFINE|KEY|MAP|PART|PART-INF|PLAYLIST-TYPE|PRELOAD-HINT|RENDITION-REPORT|SERVER-CONTROL|SKIP|START):(.+)",
	"#EXT-X-(BITRATE|DISCONTINUITY-SEQUENCE|MEDIA-SEQUENCE|TARGETDURATION|VERSION): *(\\d+)",
	"#EXT-X-(DISCONTINUITY|ENDLIST|GAP|INDEPENDENT-SEGMENTS)",
	"(#)([^:]*):(.*)",
	"(#)(.*)(?:.*)\\r?\\n?"
].join("|")), re = class M3U8Parser {
	static findGroup(e, t) {
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (r.id === t) return r;
		}
	}
	static resolve(e, n) {
		return t.buildAbsoluteURL(n, e, { alwaysNormalize: !0 });
	}
	static isMediaPlaylist(e) {
		return ee.test(e);
	}
	static parseMasterPlaylist(e, t) {
		let n = {
			contentSteering: null,
			levels: [],
			playlistParsingError: null,
			sessionData: null,
			sessionKeys: null,
			startTimeOffset: null,
			variableList: null,
			hasVariableRefs: hasVariableReferences(e)
		}, r = [];
		N.lastIndex = 0;
		let i;
		for (; (i = N.exec(e)) != null;) if (i[1]) {
			var a;
			let e = new m(i[1]);
			substituteVariablesInAttributes(n, e, [
				"CODECS",
				"SUPPLEMENTAL-CODECS",
				"ALLOWED-CPC",
				"PATHWAY-ID",
				"STABLE-VARIANT-ID",
				"AUDIO",
				"VIDEO",
				"SUBTITLES",
				"CLOSED-CAPTIONS",
				"NAME"
			]);
			let o = substituteVariables(n, i[2]), s = {
				attrs: e,
				bitrate: e.decimalInteger("BANDWIDTH") || e.decimalInteger("AVERAGE-BANDWIDTH"),
				name: e.NAME,
				url: M3U8Parser.resolve(o, t)
			}, c = e.decimalResolution("RESOLUTION");
			c && (s.width = c.width, s.height = c.height), setCodecs(e.CODECS, s), (a = s.unknownCodecs) != null && a.length || r.push(s), n.levels.push(s);
		} else if (i[3]) {
			let e = i[3], r = i[4];
			switch (e) {
				case "SESSION-DATA": {
					let e = new m(r);
					substituteVariablesInAttributes(n, e, [
						"DATA-ID",
						"LANGUAGE",
						"VALUE",
						"URI"
					]);
					let t = e["DATA-ID"];
					t && (n.sessionData === null && (n.sessionData = {}), n.sessionData[t] = e);
					break;
				}
				case "SESSION-KEY": {
					let e = parseKey(r, t, n);
					e.encrypted && e.isSupported() ? (n.sessionKeys === null && (n.sessionKeys = []), n.sessionKeys.push(e)) : d.warn(`[Keys] Ignoring invalid EXT-X-SESSION-KEY tag: "${r}"`);
					break;
				}
				case "DEFINE":
					{
						let e = new m(r);
						substituteVariablesInAttributes(n, e, [
							"NAME",
							"VALUE",
							"QUERYPARAM"
						]), addVariableDefinition(n, e, t);
					}
					break;
				case "CONTENT-STEERING": {
					let e = new m(r);
					substituteVariablesInAttributes(n, e, ["SERVER-URI", "PATHWAY-ID"]), n.contentSteering = {
						uri: M3U8Parser.resolve(e["SERVER-URI"], t),
						pathwayId: e["PATHWAY-ID"] || "."
					};
					break;
				}
				case "START": n.startTimeOffset = parseStartTimeOffset(r);
			}
		}
		return n.levels = r.length > 0 && r.length < n.levels.length ? r : n.levels, n.levels.length === 0 && (n.playlistParsingError = /* @__PURE__ */ Error("no levels found in manifest")), n;
	}
	static parseMasterPlaylistMedia(e, t, n) {
		let r, i = {}, a = n.levels, o = {
			AUDIO: a.map((e) => ({
				id: e.attrs.AUDIO,
				audioCodec: e.audioCodec
			})),
			SUBTITLES: a.map((e) => ({
				id: e.attrs.SUBTITLES,
				textCodec: e.textCodec
			})),
			"CLOSED-CAPTIONS": []
		}, s = 0;
		for (P.lastIndex = 0; (r = P.exec(e)) !== null;) {
			let e = new m(r[1]), a = e.TYPE;
			if (a) {
				let r = o[a], c = i[a] || [];
				i[a] = c, substituteVariablesInAttributes(n, e, [
					"URI",
					"GROUP-ID",
					"LANGUAGE",
					"ASSOC-LANGUAGE",
					"STABLE-RENDITION-ID",
					"NAME",
					"INSTREAM-ID",
					"CHARACTERISTICS",
					"CHANNELS"
				]);
				let l = e.LANGUAGE, u = e["ASSOC-LANGUAGE"], d = e.CHANNELS, f = e.CHARACTERISTICS, p = e["INSTREAM-ID"], m = {
					attrs: e,
					bitrate: 0,
					id: s++,
					groupId: e["GROUP-ID"] || "",
					name: e.NAME || l || "",
					type: a,
					default: e.bool("DEFAULT"),
					autoselect: e.bool("AUTOSELECT"),
					forced: e.bool("FORCED"),
					lang: l,
					url: e.URI ? M3U8Parser.resolve(e.URI, t) : ""
				};
				if (u && (m.assocLang = u), d && (m.channels = d), f && (m.characteristics = f), p && (m.instreamId = p), r != null && r.length) {
					let e = M3U8Parser.findGroup(r, m.groupId) || r[0];
					assignCodec(m, e, "audioCodec"), assignCodec(m, e, "textCodec");
				}
				c.push(m);
			}
		}
		return i;
	}
	static parseLevelPlaylist(e, t, r, i, a, o) {
		let s = new LevelDetails(t), c = s.fragments, l = null, u = 0, f = 0, p = 0, h = 0, g = null, _ = new Fragment(i, t), v, y, b, x = -1, S = !1, C = null;
		for (te.lastIndex = 0, s.m3u8 = e, s.hasVariableRefs = hasVariableReferences(e); (v = te.exec(e)) !== null;) {
			S && (S = !1, _ = new Fragment(i, t), _.start = p, _.sn = u, _.cc = h, _.level = r, l && (_.initSegment = l, _.rawProgramDateTime = l.rawProgramDateTime, l.rawProgramDateTime = null, C &&= (_.setByteRange(C), null)));
			let e = v[1];
			if (e) {
				_.duration = parseFloat(e);
				let t = (" " + v[2]).slice(1);
				_.title = t || null, _.tagList.push(t ? [
					"INF",
					e,
					t
				] : ["INF", e]);
			} else if (v[3]) {
				if (n(_.duration)) {
					_.start = p, b && setFragLevelKeys(_, b, s), _.sn = u, _.level = r, _.cc = h, c.push(_);
					let e = (" " + v[3]).slice(1);
					_.relurl = substituteVariables(s, e), assignProgramDateTime(_, g), g = _, p += _.duration, u++, f = 0, S = !0;
				}
			} else if (v[4]) {
				let e = (" " + v[4]).slice(1);
				g ? _.setByteRange(e, g) : _.setByteRange(e);
			} else if (v[5]) _.rawProgramDateTime = (" " + v[5]).slice(1), _.tagList.push(["PROGRAM-DATE-TIME", _.rawProgramDateTime]), x === -1 && (x = c.length);
			else {
				if (v = v[0].match(ne), !v) {
					d.warn("No matches on slow regex match for level playlist!");
					continue;
				}
				for (y = 1; y < v.length && v[y] === void 0; y++);
				let e = (" " + v[y]).slice(1), a = (" " + v[y + 1]).slice(1), p = v[y + 2] ? (" " + v[y + 2]).slice(1) : "";
				switch (e) {
					case "PLAYLIST-TYPE":
						s.type = a.toUpperCase();
						break;
					case "MEDIA-SEQUENCE":
						u = s.startSN = parseInt(a);
						break;
					case "SKIP": {
						let e = new m(a);
						substituteVariablesInAttributes(s, e, ["RECENTLY-REMOVED-DATERANGES"]);
						let t = e.decimalInteger("SKIPPED-SEGMENTS");
						if (n(t)) {
							s.skippedSegments = t;
							for (let e = t; e--;) c.unshift(null);
							u += t;
						}
						let r = e.enumeratedString("RECENTLY-REMOVED-DATERANGES");
						r && (s.recentlyRemovedDateranges = r.split("	"));
						break;
					}
					case "TARGETDURATION":
						s.targetduration = Math.max(parseInt(a), 1);
						break;
					case "VERSION":
						s.version = parseInt(a);
						break;
					case "INDEPENDENT-SEGMENTS":
					case "EXTM3U": break;
					case "ENDLIST":
						s.live = !1;
						break;
					case "#":
						(a || p) && _.tagList.push(p ? [a, p] : [a]);
						break;
					case "DISCONTINUITY":
						h++, _.tagList.push(["DIS"]);
						break;
					case "GAP":
						_.gap = !0, _.tagList.push([e]);
						break;
					case "BITRATE":
						_.tagList.push([e, a]);
						break;
					case "DATERANGE": {
						let e = new m(a);
						substituteVariablesInAttributes(s, e, [
							"ID",
							"CLASS",
							"START-DATE",
							"END-DATE",
							"SCTE35-CMD",
							"SCTE35-OUT",
							"SCTE35-IN"
						]), substituteVariablesInAttributes(s, e, e.clientAttrs);
						let t = new DateRange(e, s.dateRanges[e.ID]);
						t.isValid || s.skippedSegments ? s.dateRanges[t.id] = t : d.warn(`Ignoring invalid DATERANGE tag: "${a}"`), _.tagList.push(["EXT-X-DATERANGE", a]);
						break;
					}
					case "DEFINE":
						{
							let e = new m(a);
							substituteVariablesInAttributes(s, e, [
								"NAME",
								"VALUE",
								"IMPORT",
								"QUERYPARAM"
							]), "IMPORT" in e ? importVariableDefinition(s, e, o) : addVariableDefinition(s, e, t);
						}
						break;
					case "DISCONTINUITY-SEQUENCE":
						h = parseInt(a);
						break;
					case "KEY": {
						let e = parseKey(a, t, s);
						if (e.isSupported()) {
							if (e.method === "NONE") {
								b = void 0;
								break;
							}
							b ||= {}, b[e.keyFormat] && (b = _extends({}, b)), b[e.keyFormat] = e;
						} else d.warn(`[Keys] Ignoring invalid EXT-X-KEY tag: "${a}"`);
						break;
					}
					case "START":
						s.startTimeOffset = parseStartTimeOffset(a);
						break;
					case "MAP": {
						let e = new m(a);
						if (substituteVariablesInAttributes(s, e, ["BYTERANGE", "URI"]), _.duration) {
							let n = new Fragment(i, t);
							setInitSegment(n, e, r, b), l = n, _.initSegment = l, l.rawProgramDateTime && !_.rawProgramDateTime && (_.rawProgramDateTime = l.rawProgramDateTime);
						} else {
							let t = _.byteRangeEndOffset;
							if (t) {
								let e = _.byteRangeStartOffset;
								C = `${t - e}@${e}`;
							} else C = null;
							setInitSegment(_, e, r, b), l = _, S = !0;
						}
						break;
					}
					case "SERVER-CONTROL": {
						let e = new m(a);
						s.canBlockReload = e.bool("CAN-BLOCK-RELOAD"), s.canSkipUntil = e.optionalFloat("CAN-SKIP-UNTIL", 0), s.canSkipDateRanges = s.canSkipUntil > 0 && e.bool("CAN-SKIP-DATERANGES"), s.partHoldBack = e.optionalFloat("PART-HOLD-BACK", 0), s.holdBack = e.optionalFloat("HOLD-BACK", 0);
						break;
					}
					case "PART-INF":
						s.partTarget = new m(a).decimalFloatingPoint("PART-TARGET");
						break;
					case "PART": {
						let e = s.partList;
						e ||= s.partList = [];
						let n = f > 0 ? e[e.length - 1] : void 0, r = f++, i = new m(a);
						substituteVariablesInAttributes(s, i, ["BYTERANGE", "URI"]);
						let o = new Part(i, _, t, r, n);
						e.push(o), _.duration += o.duration;
						break;
					}
					case "PRELOAD-HINT": {
						let e = new m(a);
						substituteVariablesInAttributes(s, e, ["URI"]), s.preloadHint = e;
						break;
					}
					case "RENDITION-REPORT": {
						let e = new m(a);
						substituteVariablesInAttributes(s, e, ["URI"]), s.renditionReports = s.renditionReports || [], s.renditionReports.push(e);
						break;
					}
					default: d.warn(`line parsed but not handled: ${v}`);
				}
			}
		}
		g && !g.relurl ? (c.pop(), p -= g.duration, s.partList && (s.fragmentHint = g)) : s.partList && (assignProgramDateTime(_, g), _.cc = h, s.fragmentHint = _, b && setFragLevelKeys(_, b, s));
		let w = c.length, T = c[0], E = c[w - 1];
		if (p += s.skippedSegments * s.targetduration, p > 0 && w && E) {
			s.averagetargetduration = p / w;
			let e = E.sn;
			s.endSN = e === "initSegment" ? 0 : e, s.live || (E.endList = !0), T && (s.startCC = T.cc);
		} else s.endSN = 0, s.startCC = 0;
		return s.fragmentHint && (p += s.fragmentHint.duration), s.totalduration = p, s.endCC = h, x > 0 && backfillProgramDateTimes(c, x), s;
	}
};
function parseKey(e, t, n) {
	let r = new m(e);
	substituteVariablesInAttributes(n, r, [
		"KEYFORMAT",
		"KEYFORMATVERSIONS",
		"URI",
		"IV",
		"URI"
	]);
	let i = r.METHOD ?? "", a = r.URI, o = r.hexadecimalInteger("IV"), s = r.KEYFORMATVERSIONS, c = r.KEYFORMAT ?? "identity";
	return a && r.IV && !o && d.error(`Invalid IV: ${r.IV}`), new O(i, a ? re.resolve(a, t) : "", c, (s || "1").split("/").map(Number).filter(Number.isFinite), o);
}
function parseStartTimeOffset(e) {
	let t = new m(e).decimalFloatingPoint("TIME-OFFSET");
	return n(t) ? t : null;
}
function setCodecs(e, t) {
	let n = (e || "").split(/[ ,]+/).filter((e) => e);
	[
		"video",
		"audio",
		"text"
	].forEach((e) => {
		let r = n.filter((t) => isCodecType(t, e));
		r.length && (t[`${e}Codec`] = r.join(","), n = n.filter((e) => r.indexOf(e) === -1));
	}), t.unknownCodecs = n;
}
function assignCodec(e, t, n) {
	let r = t[n];
	r && (e[n] = r);
}
function backfillProgramDateTimes(e, t) {
	let n = e[t];
	for (let r = t; r--;) {
		let t = e[r];
		if (!t) return;
		t.programDateTime = n.programDateTime - t.duration * 1e3, n = t;
	}
}
function assignProgramDateTime(e, t) {
	e.rawProgramDateTime ? e.programDateTime = Date.parse(e.rawProgramDateTime) : t != null && t.programDateTime && (e.programDateTime = t.endProgramDateTime), n(e.programDateTime) || (e.programDateTime = null, e.rawProgramDateTime = null);
}
function setInitSegment(e, t, n, r) {
	e.relurl = t.URI, t.BYTERANGE && e.setByteRange(t.BYTERANGE), e.level = n, e.sn = "initSegment", r && (e.levelkeys = r), e.initSegment = null;
}
function setFragLevelKeys(e, t, n) {
	e.levelkeys = t;
	let { encryptedFragments: r } = n;
	(!r.length || r[r.length - 1].levelkeys !== t) && Object.keys(t).some((e) => t[e].isCommonEncryption) && r.push(e);
}
var F = {
	MANIFEST: "manifest",
	LEVEL: "level",
	AUDIO_TRACK: "audioTrack",
	SUBTITLE_TRACK: "subtitleTrack"
}, I = {
	MAIN: "main",
	AUDIO: "audio",
	SUBTITLE: "subtitle"
};
function mapContextToLevelType(e) {
	let { type: t } = e;
	switch (t) {
		case F.AUDIO_TRACK: return I.AUDIO;
		case F.SUBTITLE_TRACK: return I.SUBTITLE;
		default: return I.MAIN;
	}
}
function getResponseUrl(e, t) {
	let n = e.url;
	return (n === void 0 || n.indexOf("data:") === 0) && (n = t.url), n;
}
var PlaylistLoader = class {
	constructor(e) {
		this.hls = void 0, this.loaders = Object.create(null), this.variableList = null, this.hls = e, this.registerListeners();
	}
	startLoad(e) {}
	stopLoad() {
		this.destroyInternalLoaders();
	}
	registerListeners() {
		let { hls: e } = this;
		e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.LEVEL_LOADING, this.onLevelLoading, this), e.on(a.AUDIO_TRACK_LOADING, this.onAudioTrackLoading, this), e.on(a.SUBTITLE_TRACK_LOADING, this.onSubtitleTrackLoading, this);
	}
	unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.LEVEL_LOADING, this.onLevelLoading, this), e.off(a.AUDIO_TRACK_LOADING, this.onAudioTrackLoading, this), e.off(a.SUBTITLE_TRACK_LOADING, this.onSubtitleTrackLoading, this);
	}
	createInternalLoader(e) {
		let t = this.hls.config, n = t.pLoader, r = t.loader, i = new (n || r)(t);
		return this.loaders[e.type] = i, i;
	}
	getInternalLoader(e) {
		return this.loaders[e.type];
	}
	resetInternalLoader(e) {
		this.loaders[e] && delete this.loaders[e];
	}
	destroyInternalLoaders() {
		for (let e in this.loaders) {
			let t = this.loaders[e];
			t && t.destroy(), this.resetInternalLoader(e);
		}
	}
	destroy() {
		this.variableList = null, this.unregisterListeners(), this.destroyInternalLoaders();
	}
	onManifestLoading(e, t) {
		let { url: n } = t;
		this.variableList = null, this.load({
			id: null,
			level: 0,
			responseType: "text",
			type: F.MANIFEST,
			url: n,
			deliveryDirectives: null
		});
	}
	onLevelLoading(e, t) {
		let { id: n, level: r, pathwayId: i, url: a, deliveryDirectives: o } = t;
		this.load({
			id: n,
			level: r,
			pathwayId: i,
			responseType: "text",
			type: F.LEVEL,
			url: a,
			deliveryDirectives: o
		});
	}
	onAudioTrackLoading(e, t) {
		let { id: n, groupId: r, url: i, deliveryDirectives: a } = t;
		this.load({
			id: n,
			groupId: r,
			level: null,
			responseType: "text",
			type: F.AUDIO_TRACK,
			url: i,
			deliveryDirectives: a
		});
	}
	onSubtitleTrackLoading(e, t) {
		let { id: n, groupId: r, url: i, deliveryDirectives: a } = t;
		this.load({
			id: n,
			groupId: r,
			level: null,
			responseType: "text",
			type: F.SUBTITLE_TRACK,
			url: i,
			deliveryDirectives: a
		});
	}
	load(e) {
		let t = this.hls.config, r = this.getInternalLoader(e);
		if (r) {
			let t = r.context;
			if (t && t.url === e.url && t.level === e.level) {
				d.trace("[playlist-loader]: playlist request ongoing");
				return;
			}
			d.log(`[playlist-loader]: aborting previous loader for type: ${e.type}`), r.abort();
		}
		let i;
		if (i = e.type === F.MANIFEST ? t.manifestLoadPolicy.default : _extends({}, t.playlistLoadPolicy.default, {
			timeoutRetry: null,
			errorRetry: null
		}), r = this.createInternalLoader(e), n(e.deliveryDirectives?.part)) {
			let t;
			if (e.type === F.LEVEL && e.level !== null ? t = this.hls.levels[e.level].details : e.type === F.AUDIO_TRACK && e.id !== null ? t = this.hls.audioTracks[e.id].details : e.type === F.SUBTITLE_TRACK && e.id !== null && (t = this.hls.subtitleTracks[e.id].details), t) {
				let e = t.partTarget, n = t.targetduration;
				if (e && n) {
					let t = Math.max(e * 3, n * .8) * 1e3;
					i = _extends({}, i, {
						maxTimeToFirstByteMs: Math.min(t, i.maxTimeToFirstByteMs),
						maxLoadTimeMs: Math.min(t, i.maxTimeToFirstByteMs)
					});
				}
			}
		}
		let a = i.errorRetry || i.timeoutRetry || {}, o = {
			loadPolicy: i,
			timeout: i.maxLoadTimeMs,
			maxRetry: a.maxNumRetry || 0,
			retryDelay: a.retryDelayMs || 0,
			maxRetryDelay: a.maxRetryDelayMs || 0
		};
		r.load(e, o, {
			onSuccess: (e, t, n, r) => {
				let i = this.getInternalLoader(n);
				this.resetInternalLoader(n.type);
				let a = e.data;
				if (a.indexOf("#EXTM3U") !== 0) {
					this.handleManifestParsingError(e, n, /* @__PURE__ */ Error("no EXTM3U delimiter"), r || null, t);
					return;
				}
				t.parsing.start = performance.now(), re.isMediaPlaylist(a) ? this.handleTrackOrLevelPlaylist(e, t, n, r || null, i) : this.handleMasterPlaylist(e, t, n, r);
			},
			onError: (e, t, n, r) => {
				this.handleNetworkError(t, n, !1, e, r);
			},
			onTimeout: (e, t, n) => {
				this.handleNetworkError(t, n, !0, void 0, e);
			}
		});
	}
	handleMasterPlaylist(e, t, n, r) {
		let i = this.hls, o = e.data, s = getResponseUrl(e, n), c = re.parseMasterPlaylist(o, s);
		if (c.playlistParsingError) {
			this.handleManifestParsingError(e, n, c.playlistParsingError, r, t);
			return;
		}
		let { contentSteering: l, levels: u, sessionData: f, sessionKeys: p, startTimeOffset: h, variableList: g } = c;
		this.variableList = g;
		let { AUDIO: _ = [], SUBTITLES: v, "CLOSED-CAPTIONS": y } = re.parseMasterPlaylistMedia(o, s, c);
		_.length && !_.some((e) => !e.url) && u[0].audioCodec && !u[0].attrs.AUDIO && (d.log("[playlist-loader]: audio codec signaled in quality level, but no embedded audio track signaled, create one"), _.unshift({
			type: "main",
			name: "main",
			groupId: "main",
			default: !1,
			autoselect: !1,
			forced: !1,
			id: -1,
			attrs: new m({}),
			bitrate: 0,
			url: ""
		})), i.trigger(a.MANIFEST_LOADED, {
			levels: u,
			audioTracks: _,
			subtitles: v,
			captions: y,
			contentSteering: l,
			url: s,
			stats: t,
			networkDetails: r,
			sessionData: f,
			sessionKeys: p,
			startTimeOffset: h,
			variableList: g
		});
	}
	handleTrackOrLevelPlaylist(e, t, r, i, o) {
		let s = this.hls, { id: c, level: l, type: u } = r, d = getResponseUrl(e, r), f = n(l) ? l : n(c) ? c : 0, p = mapContextToLevelType(r), h = re.parseLevelPlaylist(e.data, d, f, p, 0, this.variableList);
		if (u === F.MANIFEST) {
			let e = {
				attrs: new m({}),
				bitrate: 0,
				details: h,
				name: "",
				url: d
			};
			s.trigger(a.MANIFEST_LOADED, {
				levels: [e],
				audioTracks: [],
				url: d,
				stats: t,
				networkDetails: i,
				sessionData: null,
				sessionKeys: null,
				contentSteering: null,
				startTimeOffset: null,
				variableList: null
			});
		}
		t.parsing.end = performance.now(), r.levelDetails = h, this.handlePlaylistLoaded(h, e, t, r, i, o);
	}
	handleManifestParsingError(e, t, n, r, i) {
		this.hls.trigger(a.ERROR, {
			type: o.NETWORK_ERROR,
			details: s.MANIFEST_PARSING_ERROR,
			fatal: t.type === F.MANIFEST,
			url: e.url,
			err: n,
			error: n,
			reason: n.message,
			response: e,
			context: t,
			networkDetails: r,
			stats: i
		});
	}
	handleNetworkError(e, t, n = !1, r, i) {
		let c = `A network ${n ? "timeout" : "error" + (r ? " (status " + r.code + ")" : "")} occurred while loading ${e.type}`;
		e.type === F.LEVEL ? c += `: ${e.level} id: ${e.id}` : (e.type === F.AUDIO_TRACK || e.type === F.SUBTITLE_TRACK) && (c += ` id: ${e.id} group-id: "${e.groupId}"`);
		let l = Error(c);
		d.warn(`[playlist-loader]: ${c}`);
		let u = s.UNKNOWN, f = !1, p = this.getInternalLoader(e);
		switch (e.type) {
			case F.MANIFEST:
				u = n ? s.MANIFEST_LOAD_TIMEOUT : s.MANIFEST_LOAD_ERROR, f = !0;
				break;
			case F.LEVEL:
				u = n ? s.LEVEL_LOAD_TIMEOUT : s.LEVEL_LOAD_ERROR, f = !1;
				break;
			case F.AUDIO_TRACK:
				u = n ? s.AUDIO_TRACK_LOAD_TIMEOUT : s.AUDIO_TRACK_LOAD_ERROR, f = !1;
				break;
			case F.SUBTITLE_TRACK: u = n ? s.SUBTITLE_TRACK_LOAD_TIMEOUT : s.SUBTITLE_LOAD_ERROR, f = !1;
		}
		p && this.resetInternalLoader(e.type);
		let m = {
			type: o.NETWORK_ERROR,
			details: u,
			fatal: f,
			url: e.url,
			loader: p,
			context: e,
			error: l,
			networkDetails: t,
			stats: i
		};
		r && (m.response = _objectSpread2({
			url: t?.url || e.url,
			data: void 0
		}, r)), this.hls.trigger(a.ERROR, m);
	}
	handlePlaylistLoaded(e, t, n, r, i, c) {
		let l = this.hls, { type: u, level: d, id: f, groupId: p, deliveryDirectives: m } = r, h = getResponseUrl(t, r), g = mapContextToLevelType(r), _ = typeof r.level == "number" && g === I.MAIN ? d : void 0;
		if (!e.fragments.length) {
			let e = /* @__PURE__ */ Error("No Segments found in Playlist");
			l.trigger(a.ERROR, {
				type: o.NETWORK_ERROR,
				details: s.LEVEL_EMPTY_ERROR,
				fatal: !1,
				url: h,
				error: e,
				reason: e.message,
				response: t,
				context: r,
				level: _,
				parent: g,
				networkDetails: i,
				stats: n
			});
			return;
		}
		e.targetduration || (e.playlistParsingError = /* @__PURE__ */ Error("Missing Target Duration"));
		let v = e.playlistParsingError;
		if (v) {
			l.trigger(a.ERROR, {
				type: o.NETWORK_ERROR,
				details: s.LEVEL_PARSING_ERROR,
				fatal: !1,
				url: h,
				error: v,
				reason: v.message,
				response: t,
				context: r,
				level: _,
				parent: g,
				networkDetails: i,
				stats: n
			});
			return;
		}
		switch (e.live && c && (c.getCacheAge && (e.ageHeader = c.getCacheAge() || 0), (!c.getCacheAge || isNaN(e.ageHeader)) && (e.ageHeader = 0)), u) {
			case F.MANIFEST:
			case F.LEVEL:
				l.trigger(a.LEVEL_LOADED, {
					details: e,
					level: _ || 0,
					id: f || 0,
					stats: n,
					networkDetails: i,
					deliveryDirectives: m
				});
				break;
			case F.AUDIO_TRACK:
				l.trigger(a.AUDIO_TRACK_LOADED, {
					details: e,
					id: f || 0,
					groupId: p || "",
					stats: n,
					networkDetails: i,
					deliveryDirectives: m
				});
				break;
			case F.SUBTITLE_TRACK: l.trigger(a.SUBTITLE_TRACK_LOADED, {
				details: e,
				id: f || 0,
				groupId: p || "",
				stats: n,
				networkDetails: i,
				deliveryDirectives: m
			});
		}
	}
};
function sendAddTrackEvent(e, t) {
	let n;
	try {
		n = new Event("addtrack");
	} catch {
		n = document.createEvent("Event"), n.initEvent("addtrack", !1, !1);
	}
	n.track = e, t.dispatchEvent(n);
}
function addCueToTrack(e, t) {
	let n = e.mode;
	if (n === "disabled" && (e.mode = "hidden"), e.cues && !e.cues.getCueById(t.id)) try {
		if (e.addCue(t), !e.cues.getCueById(t.id)) throw Error(`addCue is failed for: ${t}`);
	} catch (n) {
		d.debug(`[texttrack-utils]: ${n}`);
		try {
			let n = new self.TextTrackCue(t.startTime, t.endTime, t.text);
			n.id = t.id, e.addCue(n);
		} catch (e) {
			d.debug(`[texttrack-utils]: Legacy TextTrackCue fallback failed: ${e}`);
		}
	}
	n === "disabled" && (e.mode = n);
}
function clearCurrentCues(e) {
	let t = e.mode;
	if (t === "disabled" && (e.mode = "hidden"), e.cues) for (let t = e.cues.length; t--;) e.removeCue(e.cues[t]);
	t === "disabled" && (e.mode = t);
}
function removeCuesInRange(e, t, n, r) {
	let i = e.mode;
	if (i === "disabled" && (e.mode = "hidden"), e.cues && e.cues.length > 0) {
		let i = getCuesInRange(e.cues, t, n);
		for (let t = 0; t < i.length; t++) (!r || r(i[t])) && e.removeCue(i[t]);
	}
	i === "disabled" && (e.mode = i);
}
function getFirstCueIndexAfterTime(e, t) {
	if (t < e[0].startTime) return 0;
	let n = e.length - 1;
	if (t > e[n].endTime) return -1;
	let r = 0, i = n;
	for (; r <= i;) {
		let a = Math.floor((i + r) / 2);
		if (t < e[a].startTime) i = a - 1;
		else if (t > e[a].startTime && r < n) r = a + 1;
		else return a;
	}
	return e[r].startTime - t < t - e[i].startTime ? r : i;
}
function getCuesInRange(e, t, n) {
	let r = [], i = getFirstCueIndexAfterTime(e, t);
	if (i > -1) for (let a = i, o = e.length; a < o; a++) {
		let i = e[a];
		if (i.startTime >= t && i.endTime <= n) r.push(i);
		else if (i.startTime > n) return r;
	}
	return r;
}
function filterSubtitleTracks(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		(r.kind === "subtitles" || r.kind === "captions") && r.label && t.push(e[n]);
	}
	return t;
}
var L = {
	audioId3: "org.id3",
	dateRange: "com.apple.quicktime.HLS",
	emsg: "https://aomedia.org/emsg/ID3"
}, ie = .25;
function getCueClass() {
	if (!(typeof self > "u")) return self.VTTCue || self.TextTrackCue;
}
function createCueWithDataFields(e, t, n, r, i) {
	let a = new e(t, n, "");
	try {
		a.value = r, i && (a.type = i);
	} catch {
		a = new e(t, n, JSON.stringify(i ? _objectSpread2({ type: i }, r) : r));
	}
	return a;
}
var ae = (() => {
	let e = getCueClass();
	try {
		e && new e(0, Infinity, "");
	} catch {
		return Number.MAX_VALUE;
	}
	return Infinity;
})();
function dateRangeDateToTimelineSeconds(e, t) {
	return e.getTime() / 1e3 - t;
}
function hexToArrayBuffer(e) {
	return Uint8Array.from(e.replace(/^0x/, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")).buffer;
}
var ID3TrackController = class {
	constructor(e) {
		this.hls = void 0, this.id3Track = null, this.media = null, this.dateRangeCuesAppended = {}, this.hls = e, this._registerListeners();
	}
	destroy() {
		this._unregisterListeners(), this.id3Track = null, this.media = null, this.dateRangeCuesAppended = {}, this.hls = null;
	}
	_registerListeners() {
		let { hls: e } = this;
		e.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.FRAG_PARSING_METADATA, this.onFragParsingMetadata, this), e.on(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.on(a.LEVEL_UPDATED, this.onLevelUpdated, this);
	}
	_unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.FRAG_PARSING_METADATA, this.onFragParsingMetadata, this), e.off(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.off(a.LEVEL_UPDATED, this.onLevelUpdated, this);
	}
	onMediaAttached(e, t) {
		this.media = t.media;
	}
	onMediaDetaching() {
		this.id3Track && (clearCurrentCues(this.id3Track), this.id3Track = null, this.media = null, this.dateRangeCuesAppended = {});
	}
	onManifestLoading() {
		this.dateRangeCuesAppended = {};
	}
	createTrack(e) {
		let t = this.getID3Track(e.textTracks);
		return t.mode = "hidden", t;
	}
	getID3Track(e) {
		if (this.media) {
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				if (n.kind === "metadata" && n.label === "id3") return sendAddTrackEvent(n, this.media), n;
			}
			return this.media.addTextTrack("metadata", "id3");
		}
	}
	onFragParsingMetadata(e, t) {
		if (!this.media) return;
		let { hls: { config: { enableEmsgMetadataCues: n, enableID3MetadataCues: r } } } = this;
		if (!n && !r) return;
		let { samples: i } = t;
		this.id3Track ||= this.createTrack(this.media);
		let a = getCueClass();
		if (a) for (let e = 0; e < i.length; e++) {
			let t = i[e].type;
			if (t === L.emsg && !n || !r) continue;
			let o = getID3Frames(i[e].data);
			if (o) {
				let n = i[e].pts, r = n + i[e].duration;
				r > ae && (r = ae), r - n <= 0 && (r = n + ie);
				for (let e = 0; e < o.length; e++) {
					let i = o[e];
					if (!isTimeStampFrame(i)) {
						this.updateId3CueEnds(n, t);
						let e = createCueWithDataFields(a, n, r, i, t);
						e && this.id3Track.addCue(e);
					}
				}
			}
		}
	}
	updateId3CueEnds(e, t) {
		let n = this.id3Track?.cues;
		if (n) for (let r = n.length; r--;) {
			let i = n[r];
			i.type === t && i.startTime < e && i.endTime === ae && (i.endTime = e);
		}
	}
	onBufferFlushing(e, { startOffset: t, endOffset: n, type: r }) {
		let { id3Track: i, hls: a } = this;
		if (!a) return;
		let { config: { enableEmsgMetadataCues: o, enableID3MetadataCues: s } } = a;
		if (i && (o || s)) {
			let e;
			e = r === "audio" ? (e) => e.type === L.audioId3 && s : r === "video" ? (e) => e.type === L.emsg && o : (e) => e.type === L.audioId3 && s || e.type === L.emsg && o, removeCuesInRange(i, t, n, e);
		}
	}
	onLevelUpdated(e, { details: t }) {
		if (!this.media || !t.hasProgramDateTime || !this.hls.config.enableDateRangeMetadataCues) return;
		let { dateRangeCuesAppended: r, id3Track: i } = this, { dateRanges: a } = t, o = Object.keys(a);
		if (i) {
			let e = Object.keys(r).filter((e) => !o.includes(e));
			for (let t = e.length; t--;) {
				let n = e[t];
				Object.keys(r[n].cues).forEach((e) => {
					i.removeCue(r[n].cues[e]);
				}), delete r[n];
			}
		}
		let s = t.fragments[t.fragments.length - 1];
		if (o.length === 0 || !n(s?.programDateTime)) return;
		this.id3Track ||= this.createTrack(this.media);
		let c = s.programDateTime / 1e3 - s.start, l = getCueClass();
		for (let e = 0; e < o.length; e++) {
			let t = o[e], n = a[t], i = dateRangeDateToTimelineSeconds(n.startDate, c), s = r[t], u = s?.cues || {}, d = s?.durationKnown || !1, f = ae, p = n.endDate;
			if (p) f = dateRangeDateToTimelineSeconds(p, c), d = !0;
			else if (n.endOnNext && !d) {
				let e = o.reduce((e, t) => {
					if (t !== n.id) {
						let r = a[t];
						if (r.class === n.class && r.startDate > n.startDate && (!e || n.startDate < e.startDate)) return r;
					}
					return e;
				}, null);
				e && (f = dateRangeDateToTimelineSeconds(e.startDate, c), d = !0);
			}
			let m = Object.keys(n.attr);
			for (let e = 0; e < m.length; e++) {
				let r = m[e];
				if (!isDateRangeCueAttribute(r)) continue;
				let a = u[r];
				if (a) d && !s.durationKnown && (a.endTime = f);
				else if (l) {
					let e = n.attr[r];
					isSCTE35Attribute(r) && (e = hexToArrayBuffer(e));
					let a = createCueWithDataFields(l, i, f, {
						key: r,
						data: e
					}, L.dateRange);
					a && (a.id = t, this.id3Track.addCue(a), u[r] = a);
				}
			}
			r[t] = {
				cues: u,
				dateRange: n,
				durationKnown: d
			};
		}
	}
}, LatencyController = class {
	constructor(e) {
		this.hls = void 0, this.config = void 0, this.media = null, this.levelDetails = null, this.currentTime = 0, this.stallCount = 0, this._latency = null, this.timeupdateHandler = () => this.timeupdate(), this.hls = e, this.config = e.config, this.registerListeners();
	}
	get latency() {
		return this._latency || 0;
	}
	get maxLatency() {
		let { config: e, levelDetails: t } = this;
		return e.liveMaxLatencyDuration === void 0 ? t ? e.liveMaxLatencyDurationCount * t.targetduration : 0 : e.liveMaxLatencyDuration;
	}
	get targetLatency() {
		let { levelDetails: e } = this;
		if (e === null) return null;
		let { holdBack: t, partHoldBack: n, targetduration: r } = e, { liveSyncDuration: i, liveSyncDurationCount: a, lowLatencyMode: o } = this.config, s = this.hls.userConfig, c = o && n || t;
		(s.liveSyncDuration || s.liveSyncDurationCount || c === 0) && (c = i === void 0 ? a * r : i);
		let l = r;
		return c + Math.min(this.stallCount * 1, l);
	}
	get liveSyncPosition() {
		let e = this.estimateLiveEdge(), t = this.targetLatency, n = this.levelDetails;
		if (e === null || t === null || n === null) return null;
		let r = n.edge, i = e - t - this.edgeStalled, a = r - n.totalduration, o = r - (this.config.lowLatencyMode && n.partTarget || n.targetduration);
		return Math.min(Math.max(a, i), o);
	}
	get drift() {
		let { levelDetails: e } = this;
		return e === null ? 1 : e.drift;
	}
	get edgeStalled() {
		let { levelDetails: e } = this;
		if (e === null) return 0;
		let t = (this.config.lowLatencyMode && e.partTarget || e.targetduration) * 3;
		return Math.max(e.age - t, 0);
	}
	get forwardBufferLength() {
		let { media: e, levelDetails: t } = this;
		if (!e || !t) return 0;
		let n = e.buffered.length;
		return (n ? e.buffered.end(n - 1) : t.edge) - this.currentTime;
	}
	destroy() {
		this.unregisterListeners(), this.onMediaDetaching(), this.levelDetails = null, this.hls = this.timeupdateHandler = null;
	}
	registerListeners() {
		this.hls.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), this.hls.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), this.hls.on(a.MANIFEST_LOADING, this.onManifestLoading, this), this.hls.on(a.LEVEL_UPDATED, this.onLevelUpdated, this), this.hls.on(a.ERROR, this.onError, this);
	}
	unregisterListeners() {
		this.hls.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), this.hls.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), this.hls.off(a.MANIFEST_LOADING, this.onManifestLoading, this), this.hls.off(a.LEVEL_UPDATED, this.onLevelUpdated, this), this.hls.off(a.ERROR, this.onError, this);
	}
	onMediaAttached(e, t) {
		this.media = t.media, this.media.addEventListener("timeupdate", this.timeupdateHandler);
	}
	onMediaDetaching() {
		this.media &&= (this.media.removeEventListener("timeupdate", this.timeupdateHandler), null);
	}
	onManifestLoading() {
		this.levelDetails = null, this._latency = null, this.stallCount = 0;
	}
	onLevelUpdated(e, { details: t }) {
		this.levelDetails = t, t.advanced && this.timeupdate(), !t.live && this.media && this.media.removeEventListener("timeupdate", this.timeupdateHandler);
	}
	onError(e, t) {
		var n;
		t.details === s.BUFFER_STALLED_ERROR && (this.stallCount++, (n = this.levelDetails) != null && n.live && d.warn("[playback-rate-controller]: Stall detected, adjusting target latency"));
	}
	timeupdate() {
		let { media: e, levelDetails: t } = this;
		if (!e || !t) return;
		this.currentTime = e.currentTime;
		let n = this.computeLatency();
		if (n === null) return;
		this._latency = n;
		let { lowLatencyMode: r, maxLiveSyncPlaybackRate: i } = this.config;
		if (!r || i === 1 || !t.live) return;
		let a = this.targetLatency;
		if (a === null) return;
		let o = n - a;
		if (o < Math.min(this.maxLatency, a + t.targetduration) && o > .05 && this.forwardBufferLength > 1) {
			let t = Math.min(2, Math.max(1, i)), n = Math.round(2 / (1 + Math.exp(-.75 * o - this.edgeStalled)) * 20) / 20;
			e.playbackRate = Math.min(t, Math.max(1, n));
		} else e.playbackRate !== 1 && e.playbackRate !== 0 && (e.playbackRate = 1);
	}
	estimateLiveEdge() {
		let { levelDetails: e } = this;
		return e === null ? null : e.edge + e.age;
	}
	computeLatency() {
		let e = this.estimateLiveEdge();
		return e === null ? null : e - this.currentTime;
	}
}, oe = [
	"NONE",
	"TYPE-0",
	"TYPE-1",
	null
];
function isHdcpLevel(e) {
	return oe.indexOf(e) > -1;
}
var se = [
	"SDR",
	"PQ",
	"HLG"
];
function isVideoRange(e) {
	return !!e && se.indexOf(e) > -1;
}
var R = {
	No: "",
	Yes: "YES",
	v2: "v2"
};
function getSkipValue(e) {
	let { canSkipUntil: t, canSkipDateRanges: n, age: r } = e, i = r < t / 2;
	return t && i ? n ? R.v2 : R.Yes : R.No;
}
var HlsUrlParameters = class {
	constructor(e, t, n) {
		this.msn = void 0, this.part = void 0, this.skip = void 0, this.msn = e, this.part = t, this.skip = n;
	}
	addDirectives(e) {
		let t = new self.URL(e);
		return this.msn !== void 0 && t.searchParams.set("_HLS_msn", this.msn.toString()), this.part !== void 0 && t.searchParams.set("_HLS_part", this.part.toString()), this.skip && t.searchParams.set("_HLS_skip", this.skip), t.href;
	}
}, Level = class {
	constructor(e) {
		this._attrs = void 0, this.audioCodec = void 0, this.bitrate = void 0, this.codecSet = void 0, this.url = void 0, this.frameRate = void 0, this.height = void 0, this.id = void 0, this.name = void 0, this.videoCodec = void 0, this.width = void 0, this.details = void 0, this.fragmentError = 0, this.loadError = 0, this.loaded = void 0, this.realBitrate = 0, this.supportedPromise = void 0, this.supportedResult = void 0, this._avgBitrate = 0, this._audioGroups = void 0, this._subtitleGroups = void 0, this._urlId = 0, this.url = [e.url], this._attrs = [e.attrs], this.bitrate = e.bitrate, e.details && (this.details = e.details), this.id = e.id || 0, this.name = e.name, this.width = e.width || 0, this.height = e.height || 0, this.frameRate = e.attrs.optionalFloat("FRAME-RATE", 0), this._avgBitrate = e.attrs.decimalInteger("AVERAGE-BANDWIDTH"), this.audioCodec = e.audioCodec, this.videoCodec = e.videoCodec, this.codecSet = [e.videoCodec, e.audioCodec].filter((e) => !!e).map((e) => e.substring(0, 4)).join(","), this.addGroupId("audio", e.attrs.AUDIO), this.addGroupId("text", e.attrs.SUBTITLES);
	}
	get maxBitrate() {
		return Math.max(this.realBitrate, this.bitrate);
	}
	get averageBitrate() {
		return this._avgBitrate || this.realBitrate || this.bitrate;
	}
	get attrs() {
		return this._attrs[0];
	}
	get codecs() {
		return this.attrs.CODECS || "";
	}
	get pathwayId() {
		return this.attrs["PATHWAY-ID"] || ".";
	}
	get videoRange() {
		return this.attrs["VIDEO-RANGE"] || "SDR";
	}
	get score() {
		return this.attrs.optionalFloat("SCORE", 0);
	}
	get uri() {
		return this.url[0] || "";
	}
	hasAudioGroup(e) {
		return hasGroup(this._audioGroups, e);
	}
	hasSubtitleGroup(e) {
		return hasGroup(this._subtitleGroups, e);
	}
	get audioGroups() {
		return this._audioGroups;
	}
	get subtitleGroups() {
		return this._subtitleGroups;
	}
	addGroupId(e, t) {
		if (t) {
			if (e === "audio") {
				let e = this._audioGroups;
				e ||= this._audioGroups = [], e.indexOf(t) === -1 && e.push(t);
			} else if (e === "text") {
				let e = this._subtitleGroups;
				e ||= this._subtitleGroups = [], e.indexOf(t) === -1 && e.push(t);
			}
		}
	}
	get urlId() {
		return 0;
	}
	set urlId(e) {}
	get audioGroupIds() {
		return this.audioGroups ? [this.audioGroupId] : void 0;
	}
	get textGroupIds() {
		return this.subtitleGroups ? [this.textGroupId] : void 0;
	}
	get audioGroupId() {
		return this.audioGroups?.[0];
	}
	get textGroupId() {
		return this.subtitleGroups?.[0];
	}
	addFallback() {}
};
function hasGroup(e, t) {
	return !t || !e ? !1 : e.indexOf(t) !== -1;
}
function updateFromToPTS(e, t) {
	let r = t.startPTS;
	if (n(r)) {
		let n = 0, i;
		t.sn > e.sn ? (n = r - e.start, i = e) : (n = e.start - r, i = t), i.duration !== n && (i.duration = n);
	} else t.start = t.sn > e.sn ? e.cc === t.cc && e.minEndPTS ? e.start + (e.minEndPTS - e.start) : e.start + e.duration : Math.max(e.start - t.duration, 0);
}
function updateFragPTSDTS(e, t, r, i, a, o) {
	i - r <= 0 && (d.warn("Fragment should have a positive duration", t), i = r + t.duration, o = a + t.duration);
	let s = r, c = i, l = t.startPTS, u = t.endPTS;
	if (n(l)) {
		let e = Math.abs(l - r);
		t.deltaPTS = n(t.deltaPTS) ? Math.max(e, t.deltaPTS) : e, s = Math.max(r, l), r = Math.min(r, l), a = Math.min(a, t.startDTS), c = Math.min(i, u), i = Math.max(i, u), o = Math.max(o, t.endDTS);
	}
	let f = r - t.start;
	t.start !== 0 && (t.start = r), t.duration = i - t.start, t.startPTS = r, t.maxStartPTS = s, t.startDTS = a, t.endPTS = i, t.minEndPTS = c, t.endDTS = o;
	let p = t.sn;
	if (!e || p < e.startSN || p > e.endSN) return 0;
	let m, h = p - e.startSN, g = e.fragments;
	for (g[h] = t, m = h; m > 0; m--) updateFromToPTS(g[m], g[m - 1]);
	for (m = h; m < g.length - 1; m++) updateFromToPTS(g[m], g[m + 1]);
	return e.fragmentHint && updateFromToPTS(g[g.length - 1], e.fragmentHint), e.PTSKnown = e.alignedSliding = !0, f;
}
function mergeDetails(e, t) {
	let r = null, i = e.fragments;
	for (let e = i.length - 1; e >= 0; e--) {
		let t = i[e].initSegment;
		if (t) {
			r = t;
			break;
		}
	}
	e.fragmentHint && delete e.fragmentHint.endPTS;
	let a = 0, o;
	if (mapFragmentIntersection(e, t, (e, i) => {
		e.relurl && (a = e.cc - i.cc), n(e.startPTS) && n(e.endPTS) && (i.start = i.startPTS = e.startPTS, i.startDTS = e.startDTS, i.maxStartPTS = e.maxStartPTS, i.endPTS = e.endPTS, i.endDTS = e.endDTS, i.minEndPTS = e.minEndPTS, i.duration = e.endPTS - e.startPTS, i.duration && (o = i), t.PTSKnown = t.alignedSliding = !0), i.elementaryStreams = e.elementaryStreams, i.loader = e.loader, i.stats = e.stats, e.initSegment && (i.initSegment = e.initSegment, r = e.initSegment);
	}), r && (t.fragmentHint ? t.fragments.concat(t.fragmentHint) : t.fragments).forEach((e) => {
		e && (!e.initSegment || e.initSegment.relurl === r?.relurl) && (e.initSegment = r);
	}), t.skippedSegments) {
		if (t.deltaUpdateFailed = t.fragments.some((e) => !e), t.deltaUpdateFailed) {
			d.warn("[level-helper] Previous playlist missing segments skipped in delta playlist");
			for (let e = t.skippedSegments; e--;) t.fragments.shift();
			t.startSN = t.fragments[0].sn, t.startCC = t.fragments[0].cc;
		} else t.canSkipDateRanges && (t.dateRanges = mergeDateRanges(e.dateRanges, t.dateRanges, t.recentlyRemovedDateranges));
	}
	let s = t.fragments;
	if (a) {
		d.warn("discontinuity sliding from playlist, take drift into account");
		for (let e = 0; e < s.length; e++) s[e].cc += a;
	}
	t.skippedSegments && (t.startCC = t.fragments[0].cc), mapPartIntersection(e.partList, t.partList, (e, t) => {
		t.elementaryStreams = e.elementaryStreams, t.stats = e.stats;
	}), o ? updateFragPTSDTS(t, o, o.startPTS, o.endPTS, o.startDTS, o.endDTS) : adjustSliding(e, t), s.length && (t.totalduration = t.edge - s[0].start), t.driftStartTime = e.driftStartTime, t.driftStart = e.driftStart;
	let c = t.advancedDateTime;
	if (t.advanced && c) {
		let e = t.edge;
		t.driftStart ||= (t.driftStartTime = c, e), t.driftEndTime = c, t.driftEnd = e;
	} else t.driftEndTime = e.driftEndTime, t.driftEnd = e.driftEnd, t.advancedDateTime = e.advancedDateTime;
}
function mergeDateRanges(e, t, n) {
	let r = _extends({}, e);
	return n && n.forEach((e) => {
		delete r[e];
	}), Object.keys(t).forEach((e) => {
		let n = new DateRange(t[e].attr, r[e]);
		n.isValid ? r[e] = n : d.warn(`Ignoring invalid Playlist Delta Update DATERANGE tag: "${JSON.stringify(t[e].attr)}"`);
	}), r;
}
function mapPartIntersection(e, t, n) {
	if (e && t) {
		let r = 0;
		for (let i = 0, a = e.length; i <= a; i++) {
			let a = e[i], o = t[i + r];
			a && o && a.index === o.index && a.fragment.sn === o.fragment.sn ? n(a, o) : r--;
		}
	}
}
function mapFragmentIntersection(e, t, n) {
	let r = t.skippedSegments, i = Math.max(e.startSN, t.startSN) - t.startSN, a = +!!e.fragmentHint + (r ? t.endSN : Math.min(e.endSN, t.endSN)) - t.startSN, o = t.startSN - e.startSN, s = t.fragmentHint ? t.fragments.concat(t.fragmentHint) : t.fragments, c = e.fragmentHint ? e.fragments.concat(e.fragmentHint) : e.fragments;
	for (let e = i; e <= a; e++) {
		let i = c[o + e], a = s[e];
		r && !a && e < r && (a = t.fragments[e] = i), i && a && n(i, a);
	}
}
function adjustSliding(e, t) {
	let n = t.startSN + t.skippedSegments - e.startSN, r = e.fragments;
	n < 0 || n >= r.length || addSliding(t, r[n].start);
}
function addSliding(e, t) {
	if (t) {
		let n = e.fragments;
		for (let r = e.skippedSegments; r < n.length; r++) n[r].start += t;
		e.fragmentHint && (e.fragmentHint.start += t);
	}
}
function computeReloadInterval(e, t = Infinity) {
	let n = 1e3 * e.targetduration;
	if (e.updated) {
		let r = e.fragments;
		if (r.length && n * 4 > t) {
			let e = r[r.length - 1].duration * 1e3;
			e < n && (n = e);
		}
	} else n /= 2;
	return Math.round(n);
}
function getFragmentWithSN(e, t, n) {
	if (!(e != null && e.details)) return null;
	let r = e.details, i = r.fragments[t - r.startSN];
	return i || (i = r.fragmentHint, i && i.sn === t) ? i : t < r.startSN && n && n.sn === t ? n : null;
}
function getPartWith(e, t, n) {
	return e != null && e.details ? findPart(e.details?.partList, t, n) : null;
}
function findPart(e, t, n) {
	if (e) for (let r = e.length; r--;) {
		let i = e[r];
		if (i.index === n && i.fragment.sn === t) return i;
	}
	return null;
}
function reassignFragmentLevelIndexes(e) {
	e.forEach((e, t) => {
		let { details: n } = e;
		n != null && n.fragments && n.fragments.forEach((e) => {
			e.level = t;
		});
	});
}
function isTimeoutError(e) {
	switch (e.details) {
		case s.FRAG_LOAD_TIMEOUT:
		case s.KEY_LOAD_TIMEOUT:
		case s.LEVEL_LOAD_TIMEOUT:
		case s.MANIFEST_LOAD_TIMEOUT: return !0;
	}
	return !1;
}
function getRetryConfig(e, t) {
	let n = isTimeoutError(t);
	return e.default[`${n ? "timeout" : "error"}Retry`];
}
function getRetryDelay(e, t) {
	let n = e.backoff === "linear" ? 1 : 2 ** t;
	return Math.min(n * e.retryDelayMs, e.maxRetryDelayMs);
}
function getLoaderConfigWithoutReties(e) {
	return _objectSpread2(_objectSpread2({}, e), {
		errorRetry: null,
		timeoutRetry: null
	});
}
function shouldRetry(e, t, n, r) {
	if (!e) return !1;
	let i = r?.code, a = t < e.maxNumRetry && (retryForHttpStatus(i) || !!n);
	return e.shouldRetry ? e.shouldRetry(e, t, n, r, a) : a;
}
function retryForHttpStatus(e) {
	return e === 0 && navigator.onLine === !1 || !!e && (e < 400 || e > 499);
}
var ce = { search: function(e, t) {
	let n = 0, r = e.length - 1, i = null, a = null;
	for (; n <= r;) {
		i = (n + r) / 2 | 0, a = e[i];
		let o = t(a);
		if (o > 0) n = i + 1;
		else if (o < 0) r = i - 1;
		else return a;
	}
	return null;
} };
function findFragmentByPDT(e, t, r) {
	if (t === null || !Array.isArray(e) || !e.length || !n(t) || t < (e[0].programDateTime || 0) || t >= (e[e.length - 1].endProgramDateTime || 0)) return null;
	r ||= 0;
	for (let n = 0; n < e.length; ++n) {
		let i = e[n];
		if (pdtWithinToleranceTest(t, r, i)) return i;
	}
	return null;
}
function findFragmentByPTS(e, t, n = 0, r = 0, i = .005) {
	let a = null;
	if (e) {
		a = t[e.sn - t[0].sn + 1] || null;
		let r = e.endDTS - n;
		r > 0 && r < 15e-7 && (n += 15e-7);
	} else n === 0 && t[0].start === 0 && (a = t[0]);
	if (a && ((!e || e.level === a.level) && fragmentWithinToleranceTest(n, r, a) === 0 || fragmentWithinFastStartSwitch(a, e, Math.min(i, r)))) return a;
	let o = ce.search(t, fragmentWithinToleranceTest.bind(null, n, r));
	return o && (o !== e || !a) ? o : a;
}
function fragmentWithinFastStartSwitch(e, t, n) {
	if (t && t.start === 0 && t.level < e.level && (t.endPTS || 0) > 0) {
		let r = t.tagList.reduce((e, t) => (t[0] === "INF" && (e += parseFloat(t[1])), e), n);
		return e.start <= r;
	}
	return !1;
}
function fragmentWithinToleranceTest(e = 0, t = 0, n) {
	if (n.start <= e && n.start + n.duration > e) return 0;
	let r = Math.min(t, n.duration + (n.deltaPTS ? n.deltaPTS : 0));
	return n.start + n.duration - r <= e ? 1 : n.start - r > e && n.start ? -1 : 0;
}
function pdtWithinToleranceTest(e, t, n) {
	let r = Math.min(t, n.duration + (n.deltaPTS ? n.deltaPTS : 0)) * 1e3;
	return (n.endProgramDateTime || 0) - r > e;
}
function findFragWithCC(e, t) {
	return ce.search(e, (e) => e.cc < t ? 1 : e.cc > t ? -1 : 0);
}
var z = {
	DoNothing: 0,
	SendEndCallback: 1,
	SendAlternateToPenaltyBox: 2,
	RemoveAlternatePermanently: 3,
	InsertDiscontinuity: 4,
	RetryRequest: 5
}, B = {
	None: 0,
	MoveAllAlternatesMatchingHost: 1,
	MoveAllAlternatesMatchingHDCP: 2,
	SwitchToSDR: 4
}, ErrorController = class {
	constructor(e) {
		this.hls = void 0, this.playlistError = 0, this.penalizedRenditions = {}, this.log = void 0, this.warn = void 0, this.error = void 0, this.hls = e, this.log = d.log.bind(d, "[info]:"), this.warn = d.warn.bind(d, "[warning]:"), this.error = d.error.bind(d, "[error]:"), this.registerListeners();
	}
	registerListeners() {
		let e = this.hls;
		e.on(a.ERROR, this.onError, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.LEVEL_UPDATED, this.onLevelUpdated, this);
	}
	unregisterListeners() {
		let e = this.hls;
		e && (e.off(a.ERROR, this.onError, this), e.off(a.ERROR, this.onErrorOut, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.LEVEL_UPDATED, this.onLevelUpdated, this));
	}
	destroy() {
		this.unregisterListeners(), this.hls = null, this.penalizedRenditions = {};
	}
	startLoad(e) {}
	stopLoad() {
		this.playlistError = 0;
	}
	getVariantLevelIndex(e) {
		return e?.type === I.MAIN ? e.level : this.hls.loadLevel;
	}
	onManifestLoading() {
		this.playlistError = 0, this.penalizedRenditions = {};
	}
	onLevelUpdated() {
		this.playlistError = 0;
	}
	onError(e, t) {
		var n;
		if (t.fatal) return;
		let r = this.hls, i = t.context;
		switch (t.details) {
			case s.FRAG_LOAD_ERROR:
			case s.FRAG_LOAD_TIMEOUT:
			case s.KEY_LOAD_ERROR:
			case s.KEY_LOAD_TIMEOUT:
				t.errorAction = this.getFragRetryOrSwitchAction(t);
				return;
			case s.FRAG_PARSING_ERROR: if ((n = t.frag) != null && n.gap) {
				t.errorAction = {
					action: z.DoNothing,
					flags: B.None
				};
				return;
			}
			case s.FRAG_GAP:
			case s.FRAG_DECRYPT_ERROR:
				t.errorAction = this.getFragRetryOrSwitchAction(t), t.errorAction.action = z.SendAlternateToPenaltyBox;
				return;
			case s.LEVEL_EMPTY_ERROR:
			case s.LEVEL_PARSING_ERROR:
				{
					var a, c;
					let e = t.parent === I.MAIN ? t.level : r.loadLevel;
					t.details === s.LEVEL_EMPTY_ERROR && (a = t.context) != null && (c = a.levelDetails) != null && c.live ? t.errorAction = this.getPlaylistRetryOrSwitchAction(t, e) : (t.levelRetry = !1, t.errorAction = this.getLevelSwitchAction(t, e));
				}
				return;
			case s.LEVEL_LOAD_ERROR:
			case s.LEVEL_LOAD_TIMEOUT:
				typeof i?.level == "number" && (t.errorAction = this.getPlaylistRetryOrSwitchAction(t, i.level));
				return;
			case s.AUDIO_TRACK_LOAD_ERROR:
			case s.AUDIO_TRACK_LOAD_TIMEOUT:
			case s.SUBTITLE_LOAD_ERROR:
			case s.SUBTITLE_TRACK_LOAD_TIMEOUT:
				if (i) {
					let e = r.levels[r.loadLevel];
					if (e && (i.type === F.AUDIO_TRACK && e.hasAudioGroup(i.groupId) || i.type === F.SUBTITLE_TRACK && e.hasSubtitleGroup(i.groupId))) {
						t.errorAction = this.getPlaylistRetryOrSwitchAction(t, r.loadLevel), t.errorAction.action = z.SendAlternateToPenaltyBox, t.errorAction.flags = B.MoveAllAlternatesMatchingHost;
						return;
					}
				}
				return;
			case s.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED:
				{
					let e = r.levels[r.loadLevel]?.attrs["HDCP-LEVEL"];
					e ? t.errorAction = {
						action: z.SendAlternateToPenaltyBox,
						flags: B.MoveAllAlternatesMatchingHDCP,
						hdcpLevel: e
					} : this.keySystemError(t);
				}
				return;
			case s.BUFFER_ADD_CODEC_ERROR:
			case s.REMUX_ALLOC_ERROR:
			case s.BUFFER_APPEND_ERROR:
				t.errorAction = this.getLevelSwitchAction(t, t.level ?? r.loadLevel);
				return;
			case s.INTERNAL_EXCEPTION:
			case s.BUFFER_APPENDING_ERROR:
			case s.BUFFER_FULL_ERROR:
			case s.LEVEL_SWITCH_ERROR:
			case s.BUFFER_STALLED_ERROR:
			case s.BUFFER_SEEK_OVER_HOLE:
			case s.BUFFER_NUDGE_ON_STALL:
				t.errorAction = {
					action: z.DoNothing,
					flags: B.None
				};
				return;
		}
		t.type === o.KEY_SYSTEM_ERROR && this.keySystemError(t);
	}
	keySystemError(e) {
		let t = this.getVariantLevelIndex(e.frag);
		e.levelRetry = !1, e.errorAction = this.getLevelSwitchAction(e, t);
	}
	getPlaylistRetryOrSwitchAction(e, t) {
		let n = this.hls, r = getRetryConfig(n.config.playlistLoadPolicy, e), i = this.playlistError++;
		if (shouldRetry(r, i, isTimeoutError(e), e.response)) return {
			action: z.RetryRequest,
			flags: B.None,
			retryConfig: r,
			retryCount: i
		};
		let a = this.getLevelSwitchAction(e, t);
		return r && (a.retryConfig = r, a.retryCount = i), a;
	}
	getFragRetryOrSwitchAction(e) {
		let t = this.hls, n = this.getVariantLevelIndex(e.frag), r = t.levels[n], { fragLoadPolicy: i, keyLoadPolicy: a } = t.config, o = getRetryConfig(e.details.startsWith("key") ? a : i, e), c = t.levels.reduce((e, t) => e + t.fragmentError, 0);
		if (r && (e.details !== s.FRAG_GAP && r.fragmentError++, shouldRetry(o, c, isTimeoutError(e), e.response))) return {
			action: z.RetryRequest,
			flags: B.None,
			retryConfig: o,
			retryCount: c
		};
		let l = this.getLevelSwitchAction(e, n);
		return o && (l.retryConfig = o, l.retryCount = c), l;
	}
	getLevelSwitchAction(e, t) {
		let n = this.hls;
		t ??= n.loadLevel;
		let r = this.hls.levels[t];
		if (r) {
			let t = e.details;
			r.loadError++, t === s.BUFFER_APPEND_ERROR && r.fragmentError++;
			let o = -1, { levels: c, loadLevel: l, minAutoLevel: u, maxAutoLevel: d } = n;
			n.autoLevelEnabled || (n.loadLevel = -1);
			let f = e.frag?.type, p = (f === I.AUDIO && t === s.FRAG_PARSING_ERROR || e.sourceBufferName === "audio" && (t === s.BUFFER_ADD_CODEC_ERROR || t === s.BUFFER_APPEND_ERROR)) && c.some(({ audioCodec: e }) => r.audioCodec !== e), m = e.sourceBufferName === "video" && (t === s.BUFFER_ADD_CODEC_ERROR || t === s.BUFFER_APPEND_ERROR) && c.some(({ codecSet: e, audioCodec: t }) => r.codecSet !== e && r.audioCodec === t), { type: h, groupId: g } = e.context ?? {};
			for (let n = c.length; n--;) {
				let _ = (n + l) % c.length;
				if (_ !== l && _ >= u && _ <= d && c[_].loadError === 0) {
					var i, a;
					let n = c[_];
					if (t === s.FRAG_GAP && f === I.MAIN && e.frag) {
						let t = c[_].details;
						if (t) {
							let n = findFragmentByPTS(e.frag, t.fragments, e.frag.start);
							if (n != null && n.gap) continue;
						}
					} else if (h === F.AUDIO_TRACK && n.hasAudioGroup(g) || h === F.SUBTITLE_TRACK && n.hasSubtitleGroup(g)) continue;
					else if (f === I.AUDIO && (i = r.audioGroups) != null && i.some((e) => n.hasAudioGroup(e)) || f === I.SUBTITLE && (a = r.subtitleGroups) != null && a.some((e) => n.hasSubtitleGroup(e)) || p && r.audioCodec === n.audioCodec || !p && r.audioCodec !== n.audioCodec || m && r.codecSet === n.codecSet) continue;
					o = _;
					break;
				}
			}
			if (o > -1 && n.loadLevel !== o) return e.levelRetry = !0, this.playlistError = 0, {
				action: z.SendAlternateToPenaltyBox,
				flags: B.None,
				nextAutoLevel: o
			};
		}
		return {
			action: z.SendAlternateToPenaltyBox,
			flags: B.MoveAllAlternatesMatchingHost
		};
	}
	onErrorOut(e, t) {
		switch (t.errorAction?.action) {
			case z.DoNothing: break;
			case z.SendAlternateToPenaltyBox:
				this.sendAlternateToPenaltyBox(t), !t.errorAction.resolved && t.details !== s.FRAG_GAP ? t.fatal = !0 : /MediaSource readyState: ended/.test(t.error.message) && (this.warn(`MediaSource ended after "${t.sourceBufferName}" sourceBuffer append error. Attempting to recover from media error.`), this.hls.recoverMediaError());
				break;
			case z.RetryRequest:
		}
		if (t.fatal) {
			this.hls.stopLoad();
			return;
		}
	}
	sendAlternateToPenaltyBox(e) {
		let t = this.hls, n = e.errorAction;
		if (!n) return;
		let { flags: r, hdcpLevel: i, nextAutoLevel: a } = n;
		switch (r) {
			case B.None:
				this.switchLevel(e, a);
				break;
			case B.MoveAllAlternatesMatchingHDCP: i && (t.maxHdcpLevel = oe[oe.indexOf(i) - 1], n.resolved = !0), this.warn(`Restricting playback to HDCP-LEVEL of "${t.maxHdcpLevel}" or lower`);
		}
		n.resolved || this.switchLevel(e, a);
	}
	switchLevel(e, t) {
		t !== void 0 && e.errorAction && (this.warn(`switching to level ${t} after ${e.details}`), this.hls.nextAutoLevel = t, e.errorAction.resolved = !0, this.hls.nextLoadLevel = this.hls.nextAutoLevel);
	}
}, BasePlaylistController = class {
	constructor(e, t) {
		this.hls = void 0, this.timer = -1, this.requestScheduled = -1, this.canLoad = !1, this.log = void 0, this.warn = void 0, this.log = d.log.bind(d, `${t}:`), this.warn = d.warn.bind(d, `${t}:`), this.hls = e;
	}
	destroy() {
		this.clearTimer(), this.hls = this.log = this.warn = null;
	}
	clearTimer() {
		this.timer !== -1 && (self.clearTimeout(this.timer), this.timer = -1);
	}
	startLoad() {
		this.canLoad = !0, this.requestScheduled = -1, this.loadPlaylist();
	}
	stopLoad() {
		this.canLoad = !1, this.clearTimer();
	}
	switchParams(e, t, n) {
		let r = t?.renditionReports;
		if (r) {
			let i = -1;
			for (let n = 0; n < r.length; n++) {
				let a = r[n], o;
				try {
					o = new self.URL(a.URI, t.url).href;
				} catch (e) {
					d.warn(`Could not construct new URL for Rendition Report: ${e}`), o = a.URI || "";
				}
				if (o === e) {
					i = n;
					break;
				}
				o === e.substring(0, o.length) && (i = n);
			}
			if (i !== -1) {
				let e = r[i], a = parseInt(e["LAST-MSN"]) || t?.lastPartSn, o = parseInt(e["LAST-PART"]) || t?.lastPartIndex;
				if (this.hls.config.lowLatencyMode) {
					let e = Math.min(t.age - t.partTarget, t.targetduration);
					o >= 0 && e > t.partTarget && (o += 1);
				}
				let s = n && getSkipValue(n);
				return new HlsUrlParameters(a, o >= 0 ? o : void 0, s);
			}
		}
	}
	loadPlaylist(e) {
		this.requestScheduled === -1 && (this.requestScheduled = self.performance.now());
	}
	shouldLoadPlaylist(e) {
		return this.canLoad && !!e && !!e.url && (!e.details || e.details.live);
	}
	shouldReloadPlaylist(e) {
		return this.timer === -1 && this.requestScheduled === -1 && this.shouldLoadPlaylist(e);
	}
	playlistLoaded(e, t, n) {
		let { details: r, stats: i } = t, a = self.performance.now(), o = i.loading.first ? Math.max(0, a - i.loading.first) : 0;
		if (r.advancedDateTime = Date.now() - o, r.live || n != null && n.live) {
			if (r.reloaded(n), n && this.log(`live playlist ${e} ${r.advanced ? "REFRESHED " + r.lastPartSn + "-" + r.lastPartIndex : r.updated ? "UPDATED" : "MISSED"}`), n && r.fragments.length > 0 && mergeDetails(n, r), !this.canLoad || !r.live) return;
			let o, s, c;
			if (r.canBlockReload && r.endSN && r.advanced) {
				let e = this.hls.config.lowLatencyMode, i = r.lastPartSn, a = r.endSN, l = r.lastPartIndex, u = l !== -1, d = i === a, f = e ? 0 : l;
				u ? (s = d ? a + 1 : i, c = d ? f : l + 1) : s = a + 1;
				let p = r.age, m = p + r.ageHeader, h = Math.min(m - r.partTarget, r.targetduration * 1.5);
				if (h > 0) {
					if (n && h > n.tuneInGoal) this.warn(`CDN Tune-in goal increased from: ${n.tuneInGoal} to: ${h} with playlist age: ${r.age}`), h = 0;
					else {
						let e = Math.floor(h / r.targetduration);
						if (s += e, c !== void 0) {
							let e = Math.round(h % r.targetduration / r.partTarget);
							c += e;
						}
						this.log(`CDN Tune-in age: ${r.ageHeader}s last advanced ${p.toFixed(2)}s goal: ${h} skip sn ${e} to part ${c}`);
					}
					r.tuneInGoal = h;
				}
				if (o = this.getDeliveryDirectives(r, t.deliveryDirectives, s, c), e || !d) {
					this.loadPlaylist(o);
					return;
				}
			} else (r.canBlockReload || r.canSkipUntil) && (o = this.getDeliveryDirectives(r, t.deliveryDirectives, s, c));
			let l = this.hls.mainForwardBufferInfo, u = l ? l.end - l.len : 0, d = computeReloadInterval(r, (r.edge - u) * 1e3);
			r.updated && a > this.requestScheduled + d && (this.requestScheduled = i.loading.start), s !== void 0 && r.canBlockReload ? this.requestScheduled = i.loading.first + d - (r.partTarget * 1e3 || 1e3) : this.requestScheduled === -1 || this.requestScheduled + d < a ? this.requestScheduled = a : this.requestScheduled - a <= 0 && (this.requestScheduled += d);
			let f = this.requestScheduled - a;
			f = Math.max(0, f), this.log(`reload live playlist ${e} in ${Math.round(f)} ms`), this.timer = self.setTimeout(() => this.loadPlaylist(o), f);
		} else this.clearTimer();
	}
	getDeliveryDirectives(e, t, n, r) {
		let i = getSkipValue(e);
		return t != null && t.skip && e.deltaUpdateFailed && (n = t.msn, r = t.part, i = R.No), new HlsUrlParameters(n, r, i);
	}
	checkRetry(e) {
		let t = e.details, n = isTimeoutError(e), r = e.errorAction, { action: i, retryCount: a = 0, retryConfig: o } = r || {}, s = !!r && !!o && (i === z.RetryRequest || !r.resolved && i === z.SendAlternateToPenaltyBox);
		if (s) {
			var c;
			if (this.requestScheduled = -1, a >= o.maxNumRetry) return !1;
			if (n && (c = e.context) != null && c.deliveryDirectives) this.warn(`Retrying playlist loading ${a + 1}/${o.maxNumRetry} after "${t}" without delivery-directives`), this.loadPlaylist();
			else {
				let e = getRetryDelay(o, a);
				this.timer = self.setTimeout(() => this.loadPlaylist(), e), this.warn(`Retrying playlist loading ${a + 1}/${o.maxNumRetry} after "${t}" in ${e}ms`);
			}
			e.levelRetry = !0, r.resolved = !0;
		}
		return s;
	}
}, EWMA = class {
	constructor(e, t = 0, n = 0) {
		this.halfLife = void 0, this.alpha_ = void 0, this.estimate_ = void 0, this.totalWeight_ = void 0, this.halfLife = e, this.alpha_ = e ? Math.exp(Math.log(.5) / e) : 0, this.estimate_ = t, this.totalWeight_ = n;
	}
	sample(e, t) {
		let n = this.alpha_ ** +e;
		this.estimate_ = t * (1 - n) + n * this.estimate_, this.totalWeight_ += e;
	}
	getTotalWeight() {
		return this.totalWeight_;
	}
	getEstimate() {
		if (this.alpha_) {
			let e = 1 - this.alpha_ ** +this.totalWeight_;
			if (e) return this.estimate_ / e;
		}
		return this.estimate_;
	}
}, EwmaBandWidthEstimator = class {
	constructor(e, t, n, r = 100) {
		this.defaultEstimate_ = void 0, this.minWeight_ = void 0, this.minDelayMs_ = void 0, this.slow_ = void 0, this.fast_ = void 0, this.defaultTTFB_ = void 0, this.ttfb_ = void 0, this.defaultEstimate_ = n, this.minWeight_ = .001, this.minDelayMs_ = 50, this.slow_ = new EWMA(e), this.fast_ = new EWMA(t), this.defaultTTFB_ = r, this.ttfb_ = new EWMA(e);
	}
	update(e, t) {
		let { slow_: n, fast_: r, ttfb_: i } = this;
		n.halfLife !== e && (this.slow_ = new EWMA(e, n.getEstimate(), n.getTotalWeight())), r.halfLife !== t && (this.fast_ = new EWMA(t, r.getEstimate(), r.getTotalWeight())), i.halfLife !== e && (this.ttfb_ = new EWMA(e, i.getEstimate(), i.getTotalWeight()));
	}
	sample(e, t) {
		e = Math.max(e, this.minDelayMs_);
		let n = 8 * t, r = e / 1e3, i = n / r;
		this.fast_.sample(r, i), this.slow_.sample(r, i);
	}
	sampleTTFB(e) {
		let t = e / 1e3, n = Math.sqrt(2) * Math.exp(-(t ** 2) / 2);
		this.ttfb_.sample(n, Math.max(e, 5));
	}
	canEstimate() {
		return this.fast_.getTotalWeight() >= this.minWeight_;
	}
	getEstimate() {
		return this.canEstimate() ? Math.min(this.fast_.getEstimate(), this.slow_.getEstimate()) : this.defaultEstimate_;
	}
	getEstimateTTFB() {
		return this.ttfb_.getTotalWeight() >= this.minWeight_ ? this.ttfb_.getEstimate() : this.defaultTTFB_;
	}
	destroy() {}
}, le = {
	supported: !0,
	configurations: [],
	decodingInfoResults: [{
		supported: !0,
		powerEfficient: !0,
		smooth: !0
	}]
}, ue = {};
function requiresMediaCapabilitiesDecodingInfo(e, t, r, i, a, o) {
	let s = e.audioCodec ? e.audioGroups : null, c = o?.audioCodec, l = o?.channels, u = l ? parseInt(l) : c ? Infinity : 2, d = null;
	if (s != null && s.length) try {
		d = s.length === 1 && s[0] ? t.groups[s[0]].channels : s.reduce((e, n) => {
			if (n) {
				let r = t.groups[n];
				if (!r) throw Error(`Audio track group ${n} not found`);
				Object.keys(r.channels).forEach((t) => {
					e[t] = (e[t] || 0) + r.channels[t];
				});
			}
			return e;
		}, { 2: 0 });
	} catch {
		return !0;
	}
	return e.videoCodec !== void 0 && (e.width > 1920 && e.height > 1088 || e.height > 1920 && e.width > 1088 || e.frameRate > Math.max(i, 30) || e.videoRange !== "SDR" && e.videoRange !== r || e.bitrate > Math.max(a, 8e6)) || !!d && n(u) && Object.keys(d).some((e) => parseInt(e) > u);
}
function getMediaDecodingInfoPromise(e, t, r) {
	let i = e.videoCodec, a = e.audioCodec;
	if (!i || !a || !r) return Promise.resolve(le);
	let o = {
		width: e.width,
		height: e.height,
		bitrate: Math.ceil(Math.max(e.bitrate * .9, e.averageBitrate)),
		framerate: e.frameRate || 30
	}, s = e.videoRange;
	s !== "SDR" && (o.transferFunction = s.toLowerCase());
	let c = i.split(",").map((e) => ({
		type: "media-source",
		video: _objectSpread2(_objectSpread2({}, o), {}, { contentType: mimeTypeForCodec(e, "video") })
	}));
	return a && e.audioGroups && e.audioGroups.forEach((e) => {
		var r;
		e && ((r = t.groups[e]) == null || r.tracks.forEach((t) => {
			if (t.groupId === e) {
				let e = t.channels || "", r = parseFloat(e);
				n(r) && r > 2 && c.push.apply(c, a.split(",").map((e) => ({
					type: "media-source",
					audio: {
						contentType: mimeTypeForCodec(e, "audio"),
						channels: "" + r
					}
				})));
			}
		}));
	}), Promise.all(c.map((e) => {
		let t = getMediaDecodingInfoKey(e);
		return ue[t] || (ue[t] = r.decodingInfo(e));
	})).then((e) => ({
		supported: !e.some((e) => !e.supported),
		configurations: c,
		decodingInfoResults: e
	})).catch((e) => ({
		supported: !1,
		configurations: c,
		decodingInfoResults: [],
		error: e
	}));
}
function getMediaDecodingInfoKey(e) {
	let { audio: t, video: n } = e, r = n || t;
	if (r) {
		let e = r.contentType.split("\"")[1];
		if (n) return `r${n.height}x${n.width}f${Math.ceil(n.framerate)}${n.transferFunction || "sd"}_${e}_${Math.ceil(n.bitrate / 1e5)}`;
		if (t) return `c${t.channels}${t.spatialRendering ? "s" : "n"}_${e}`;
	}
	return "";
}
function isHdrSupported() {
	if (typeof matchMedia == "function") {
		let e = matchMedia("(dynamic-range: high)"), t = matchMedia("bad query");
		if (e.media !== t.media) return e.matches === !0;
	}
	return !1;
}
function getVideoSelectionOptions(e, t) {
	let n = !1, r = [];
	return e && (n = e !== "SDR", r = [e]), t && (r = t.allowedVideoRanges || se.slice(0), n = t.preferHDR === void 0 ? isHdrSupported() : t.preferHDR, r = n ? r.filter((e) => e !== "SDR") : ["SDR"]), {
		preferHDR: n,
		allowedVideoRanges: r
	};
}
function getStartCodecTier(e, t, r, i, a) {
	let o = Object.keys(e), s = i?.channels, c = i?.audioCodec, l = s && parseInt(s) === 2, u = !0, d = !1, f = Infinity, p = Infinity, m = Infinity, h = 0, g = [], { preferHDR: _, allowedVideoRanges: v } = getVideoSelectionOptions(t, a);
	for (let t = o.length; t--;) {
		let n = e[o[t]];
		u = n.channels[2] > 0, f = Math.min(f, n.minHeight), p = Math.min(p, n.minFramerate), m = Math.min(m, n.minBitrate);
		let r = v.filter((e) => n.videoRanges[e] > 0);
		r.length > 0 && (d = !0, g = r);
	}
	f = n(f) ? f : 0, p = n(p) ? p : 0;
	let y = Math.max(1080, f), b = Math.max(30, p);
	return m = n(m) ? m : r, r = Math.max(m, r), d || (t = void 0, g = []), {
		codecSet: o.reduce((t, n) => {
			let i = e[n];
			if (n === t) return t;
			if (i.minBitrate > r) return logStartCodecCandidateIgnored(n, `min bitrate of ${i.minBitrate} > current estimate of ${r}`), t;
			if (!i.hasDefaultAudio) return logStartCodecCandidateIgnored(n, "no renditions with default or auto-select sound found"), t;
			if (c && n.indexOf(c.substring(0, 4)) % 5 != 0) return logStartCodecCandidateIgnored(n, `audio codec preference "${c}" not found`), t;
			if (s && !l) {
				if (!i.channels[s]) return logStartCodecCandidateIgnored(n, `no renditions with ${s} channel sound found (channels options: ${Object.keys(i.channels)})`), t;
			} else if ((!c || l) && u && i.channels[2] === 0) return logStartCodecCandidateIgnored(n, "no renditions with stereo sound found"), t;
			return i.minHeight > y ? (logStartCodecCandidateIgnored(n, `min resolution of ${i.minHeight} > maximum of ${y}`), t) : i.minFramerate > b ? (logStartCodecCandidateIgnored(n, `min framerate of ${i.minFramerate} > maximum of ${b}`), t) : g.some((e) => i.videoRanges[e] > 0) ? i.maxScore < h ? (logStartCodecCandidateIgnored(n, `max score of ${i.maxScore} < selected max of ${h}`), t) : t && (codecsSetSelectionPreferenceValue(n) >= codecsSetSelectionPreferenceValue(t) || i.fragmentError > e[t].fragmentError) ? t : (h = i.maxScore, n) : (logStartCodecCandidateIgnored(n, `no variants with VIDEO-RANGE of ${JSON.stringify(g)} found`), t);
		}, void 0),
		videoRanges: g,
		preferHDR: _,
		minFramerate: p,
		minBitrate: m
	};
}
function logStartCodecCandidateIgnored(e, t) {
	d.log(`[abr] start candidates with "${e}" ignored because ${t}`);
}
function getAudioTracksByGroup(e) {
	return e.reduce((e, t) => {
		let n = e.groups[t.groupId];
		n ||= e.groups[t.groupId] = {
			tracks: [],
			channels: { 2: 0 },
			hasDefault: !1,
			hasAutoSelect: !1
		}, n.tracks.push(t);
		let r = t.channels || "2";
		return n.channels[r] = (n.channels[r] || 0) + 1, n.hasDefault = n.hasDefault || t.default, n.hasAutoSelect = n.hasAutoSelect || t.autoselect, n.hasDefault && (e.hasDefaultAudio = !0), n.hasAutoSelect && (e.hasAutoSelectAudio = !0), e;
	}, {
		hasDefaultAudio: !1,
		hasAutoSelectAudio: !1,
		groups: {}
	});
}
function getCodecTiers(e, t, n, r) {
	return e.slice(n, r + 1).reduce((e, n) => {
		if (!n.codecSet) return e;
		let r = n.audioGroups, i = e[n.codecSet];
		i || (e[n.codecSet] = i = {
			minBitrate: Infinity,
			minHeight: Infinity,
			minFramerate: Infinity,
			maxScore: 0,
			videoRanges: { SDR: 0 },
			channels: { 2: 0 },
			hasDefaultAudio: !r,
			fragmentError: 0
		}), i.minBitrate = Math.min(i.minBitrate, n.bitrate);
		let a = Math.min(n.height, n.width);
		return i.minHeight = Math.min(i.minHeight, a), i.minFramerate = Math.min(i.minFramerate, n.frameRate), i.maxScore = Math.max(i.maxScore, n.score), i.fragmentError += n.fragmentError, i.videoRanges[n.videoRange] = (i.videoRanges[n.videoRange] || 0) + 1, r && r.forEach((e) => {
			if (!e) return;
			let n = t.groups[e];
			n && (i.hasDefaultAudio = i.hasDefaultAudio || t.hasDefaultAudio ? n.hasDefault : n.hasAutoSelect || !t.hasDefaultAudio && !t.hasAutoSelectAudio, Object.keys(n.channels).forEach((e) => {
				i.channels[e] = (i.channels[e] || 0) + n.channels[e];
			}));
		}), e;
	}, {});
}
function findMatchingOption(e, t, n) {
	if ("attrs" in e) {
		let n = t.indexOf(e);
		if (n !== -1) return n;
	}
	for (let r = 0; r < t.length; r++) {
		let i = t[r];
		if (matchesOption(e, i, n)) return r;
	}
	return -1;
}
function matchesOption(e, t, n) {
	let { groupId: r, name: i, lang: a, assocLang: o, characteristics: s, default: c } = e, l = e.forced;
	return (r === void 0 || t.groupId === r) && (i === void 0 || t.name === i) && (a === void 0 || t.lang === a) && (a === void 0 || t.assocLang === o) && (c === void 0 || t.default === c) && (l === void 0 || t.forced === l) && (s === void 0 || characteristicsMatch(s, t.characteristics)) && (n === void 0 || n(e, t));
}
function characteristicsMatch(e, t = "") {
	let n = e.split(","), r = t.split(",");
	return n.length === r.length && !n.some((e) => r.indexOf(e) === -1);
}
function audioMatchPredicate(e, t) {
	let { audioCodec: n, channels: r } = e;
	return (n === void 0 || (t.audioCodec || "").substring(0, 4) === n.substring(0, 4)) && (r === void 0 || r === (t.channels || "2"));
}
function findClosestLevelWithAudioGroup(e, t, n, r, i) {
	let a = t[r], o = t.reduce((e, t, n) => {
		let r = t.uri;
		return (e[r] || (e[r] = [])).push(n), e;
	}, {})[a.uri];
	o.length > 1 && (r = Math.max.apply(Math, o));
	let s = a.videoRange, c = a.frameRate, l = a.codecSet.substring(0, 4), u = searchDownAndUpList(t, r, (t) => {
		if (t.videoRange !== s || t.frameRate !== c || t.codecSet.substring(0, 4) !== l) return !1;
		let r = t.audioGroups;
		return findMatchingOption(e, n.filter((e) => !r || r.indexOf(e.groupId) !== -1), i) > -1;
	});
	return u > -1 ? u : searchDownAndUpList(t, r, (t) => {
		let r = t.audioGroups;
		return findMatchingOption(e, n.filter((e) => !r || r.indexOf(e.groupId) !== -1), i) > -1;
	});
}
function searchDownAndUpList(e, t, n) {
	for (let r = t; r; r--) if (n(e[r])) return r;
	for (let r = t + 1; r < e.length; r++) if (n(e[r])) return r;
	return -1;
}
var AbrController = class {
	constructor(e) {
		this.hls = void 0, this.lastLevelLoadSec = 0, this.lastLoadedFragLevel = -1, this.firstSelection = -1, this._nextAutoLevel = -1, this.nextAutoLevelKey = "", this.audioTracksByGroup = null, this.codecTiers = null, this.timer = -1, this.fragCurrent = null, this.partCurrent = null, this.bitrateTestDelay = 0, this.bwEstimator = void 0, this._abandonRulesCheck = () => {
			let { fragCurrent: e, partCurrent: t, hls: r } = this, { autoLevelEnabled: i, media: o } = r;
			if (!e || !o) return;
			let s = performance.now(), c = t ? t.stats : e.stats, l = t ? t.duration : e.duration, u = s - c.loading.start, f = r.minAutoLevel;
			if (c.aborted || c.loaded && c.loaded === c.total || e.level <= f) {
				this.clearTimer(), this._nextAutoLevel = -1;
				return;
			}
			if (!i || o.paused || !o.playbackRate || !o.readyState) return;
			let p = r.mainForwardBufferInfo;
			if (p === null) return;
			let m = this.bwEstimator.getEstimateTTFB(), h = Math.abs(o.playbackRate);
			if (u <= Math.max(m, 1e3 * (l / (h * 2)))) return;
			let g = p.len / h, _ = c.loading.first ? c.loading.first - c.loading.start : -1, v = c.loaded && _ > -1, y = this.getBwEstimate(), b = r.levels, x = b[e.level], S = c.total || Math.max(c.loaded, Math.round(l * x.averageBitrate / 8)), C = v ? u - _ : u;
			C < 1 && v && (C = Math.min(u, c.loaded * 8 / y));
			let w = v ? c.loaded * 1e3 / C : 0, T = w ? (S - c.loaded) / w : S * 8 / y + m / 1e3;
			if (T <= g) return;
			let E = w ? w * 8 : y, D = Infinity, O;
			for (O = e.level - 1; O > f; O--) {
				let e = b[O].maxBitrate;
				if (D = this.getTimeToLoadFrag(m / 1e3, E, l * e, !b[O].details), D < g) break;
			}
			if (D >= T || D > l * 10) return;
			r.nextLoadLevel = r.nextAutoLevel = O, v ? this.bwEstimator.sample(u - Math.min(m, _), c.loaded) : this.bwEstimator.sampleTTFB(u);
			let k = b[O].maxBitrate;
			this.getBwEstimate() * this.hls.config.abrBandWidthUpFactor > k && this.resetEstimator(k), this.clearTimer(), d.warn(`[abr] Fragment ${e.sn}${t ? " part " + t.index : ""} of level ${e.level} is loading too slowly;
      Time to underbuffer: ${g.toFixed(3)} s
      Estimated load time for current fragment: ${T.toFixed(3)} s
      Estimated load time for down switch fragment: ${D.toFixed(3)} s
      TTFB estimate: ${_ | 0} ms
      Current BW estimate: ${n(y) ? y | 0 : "Unknown"} bps
      New BW estimate: ${this.getBwEstimate() | 0} bps
      Switching to level ${O} @ ${k | 0} bps`), r.trigger(a.FRAG_LOAD_EMERGENCY_ABORTED, {
				frag: e,
				part: t,
				stats: c
			});
		}, this.hls = e, this.bwEstimator = this.initEstimator(), this.registerListeners();
	}
	resetEstimator(e) {
		e && (d.log(`setting initial bwe to ${e}`), this.hls.config.abrEwmaDefaultEstimate = e), this.firstSelection = -1, this.bwEstimator = this.initEstimator();
	}
	initEstimator() {
		let e = this.hls.config;
		return new EwmaBandWidthEstimator(e.abrEwmaSlowVoD, e.abrEwmaFastVoD, e.abrEwmaDefaultEstimate);
	}
	registerListeners() {
		let { hls: e } = this;
		e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.FRAG_LOADING, this.onFragLoading, this), e.on(a.FRAG_LOADED, this.onFragLoaded, this), e.on(a.FRAG_BUFFERED, this.onFragBuffered, this), e.on(a.LEVEL_SWITCHING, this.onLevelSwitching, this), e.on(a.LEVEL_LOADED, this.onLevelLoaded, this), e.on(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.on(a.MAX_AUTO_LEVEL_UPDATED, this.onMaxAutoLevelUpdated, this), e.on(a.ERROR, this.onError, this);
	}
	unregisterListeners() {
		let { hls: e } = this;
		e && (e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.FRAG_LOADING, this.onFragLoading, this), e.off(a.FRAG_LOADED, this.onFragLoaded, this), e.off(a.FRAG_BUFFERED, this.onFragBuffered, this), e.off(a.LEVEL_SWITCHING, this.onLevelSwitching, this), e.off(a.LEVEL_LOADED, this.onLevelLoaded, this), e.off(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.off(a.MAX_AUTO_LEVEL_UPDATED, this.onMaxAutoLevelUpdated, this), e.off(a.ERROR, this.onError, this));
	}
	destroy() {
		this.unregisterListeners(), this.clearTimer(), this.hls = this._abandonRulesCheck = null, this.fragCurrent = this.partCurrent = null;
	}
	onManifestLoading(e, t) {
		this.lastLoadedFragLevel = -1, this.firstSelection = -1, this.lastLevelLoadSec = 0, this.fragCurrent = this.partCurrent = null, this.onLevelsUpdated(), this.clearTimer();
	}
	onLevelsUpdated() {
		this.lastLoadedFragLevel > -1 && this.fragCurrent && (this.lastLoadedFragLevel = this.fragCurrent.level), this._nextAutoLevel = -1, this.onMaxAutoLevelUpdated(), this.codecTiers = null, this.audioTracksByGroup = null;
	}
	onMaxAutoLevelUpdated() {
		this.firstSelection = -1, this.nextAutoLevelKey = "";
	}
	onFragLoading(e, t) {
		let n = t.frag;
		this.ignoreFragment(n) || (n.bitrateTest || (this.fragCurrent = n, this.partCurrent = t.part ?? null), this.clearTimer(), this.timer = self.setInterval(this._abandonRulesCheck, 100));
	}
	onLevelSwitching(e, t) {
		this.clearTimer();
	}
	onError(e, t) {
		if (!t.fatal) switch (t.details) {
			case s.BUFFER_ADD_CODEC_ERROR:
			case s.BUFFER_APPEND_ERROR:
				this.lastLoadedFragLevel = -1, this.firstSelection = -1;
				break;
			case s.FRAG_LOAD_TIMEOUT: {
				let e = t.frag, { fragCurrent: n, partCurrent: r } = this;
				if (e && n && e.sn === n.sn && e.level === n.level) {
					let t = performance.now(), n = r ? r.stats : e.stats, i = t - n.loading.start, a = n.loading.first ? n.loading.first - n.loading.start : -1;
					if (n.loaded && a > -1) {
						let e = this.bwEstimator.getEstimateTTFB();
						this.bwEstimator.sample(i - Math.min(e, a), n.loaded);
					} else this.bwEstimator.sampleTTFB(i);
				}
				break;
			}
		}
	}
	getTimeToLoadFrag(e, t, n, r) {
		return e + n / t + (r ? this.lastLevelLoadSec : 0);
	}
	onLevelLoaded(e, t) {
		let r = this.hls.config, { loading: i } = t.stats, a = i.end - i.start;
		n(a) && (this.lastLevelLoadSec = a / 1e3), t.details.live ? this.bwEstimator.update(r.abrEwmaSlowLive, r.abrEwmaFastLive) : this.bwEstimator.update(r.abrEwmaSlowVoD, r.abrEwmaFastVoD);
	}
	onFragLoaded(e, { frag: t, part: n }) {
		let r = n ? n.stats : t.stats;
		if (t.type === I.MAIN && this.bwEstimator.sampleTTFB(r.loading.first - r.loading.start), !this.ignoreFragment(t)) {
			if (this.clearTimer(), t.level === this._nextAutoLevel && (this._nextAutoLevel = -1), this.firstSelection = -1, this.hls.config.abrMaxWithRealBitrate) {
				let e = n ? n.duration : t.duration, i = this.hls.levels[t.level], a = (i.loaded ? i.loaded.bytes : 0) + r.loaded, o = (i.loaded ? i.loaded.duration : 0) + e;
				i.loaded = {
					bytes: a,
					duration: o
				}, i.realBitrate = Math.round(8 * a / o);
			}
			if (t.bitrateTest) {
				let e = {
					stats: r,
					frag: t,
					part: n,
					id: t.type
				};
				this.onFragBuffered(a.FRAG_BUFFERED, e), t.bitrateTest = !1;
			} else this.lastLoadedFragLevel = t.level;
		}
	}
	onFragBuffered(e, t) {
		let { frag: n, part: r } = t, i = r != null && r.stats.loaded ? r.stats : n.stats;
		if (i.aborted || this.ignoreFragment(n)) return;
		let a = i.parsing.end - i.loading.start - Math.min(i.loading.first - i.loading.start, this.bwEstimator.getEstimateTTFB());
		this.bwEstimator.sample(a, i.loaded), i.bwEstimate = this.getBwEstimate(), this.bitrateTestDelay = n.bitrateTest ? a / 1e3 : 0;
	}
	ignoreFragment(e) {
		return e.type !== I.MAIN || e.sn === "initSegment";
	}
	clearTimer() {
		this.timer > -1 && (self.clearInterval(this.timer), this.timer = -1);
	}
	get firstAutoLevel() {
		let { maxAutoLevel: e, minAutoLevel: t } = this.hls, n = this.getBwEstimate(), r = this.hls.config.maxStarvationDelay, i = this.findBestLevel(n, t, e, 0, r, 1, 1);
		if (i > -1) return i;
		let a = this.hls.firstLevel, o = Math.min(Math.max(a, t), e);
		return d.warn(`[abr] Could not find best starting auto level. Defaulting to first in playlist ${a} clamped to ${o}`), o;
	}
	get forcedAutoLevel() {
		return this.nextAutoLevelKey ? -1 : this._nextAutoLevel;
	}
	get nextAutoLevel() {
		let e = this.forcedAutoLevel, t = this.bwEstimator.canEstimate(), n = this.lastLoadedFragLevel > -1;
		if (e !== -1 && (!t || !n || this.nextAutoLevelKey === this.getAutoLevelKey())) return e;
		let r = t && n ? this.getNextABRAutoLevel() : this.firstAutoLevel;
		if (e !== -1) {
			let t = this.hls.levels;
			if (t.length > Math.max(e, r) && t[e].loadError <= t[r].loadError) return e;
		}
		return this._nextAutoLevel = r, this.nextAutoLevelKey = this.getAutoLevelKey(), r;
	}
	getAutoLevelKey() {
		return `${this.getBwEstimate()}_${this.getStarvationDelay().toFixed(2)}`;
	}
	getNextABRAutoLevel() {
		let { fragCurrent: e, partCurrent: t, hls: n } = this, { maxAutoLevel: r, config: i, minAutoLevel: a } = n, o = t ? t.duration : e ? e.duration : 0, s = this.getBwEstimate(), c = this.getStarvationDelay(), l = i.abrBandWidthFactor, u = i.abrBandWidthUpFactor;
		if (c) {
			let e = this.findBestLevel(s, a, r, c, 0, l, u);
			if (e >= 0) return e;
		}
		let f = o ? Math.min(o, i.maxStarvationDelay) : i.maxStarvationDelay;
		if (!c) {
			let e = this.bitrateTestDelay;
			e && (f = (o ? Math.min(o, i.maxLoadingDelay) : i.maxLoadingDelay) - e, d.info(`[abr] bitrate test took ${Math.round(1e3 * e)}ms, set first fragment max fetchDuration to ${Math.round(1e3 * f)} ms`), l = u = 1);
		}
		let p = this.findBestLevel(s, a, r, c, f, l, u);
		if (d.info(`[abr] ${c ? "rebuffering expected" : "buffer is empty"}, optimal quality level ${p}`), p > -1) return p;
		let m = n.levels[a], h = n.levels[n.loadLevel];
		return m?.bitrate < h?.bitrate ? a : n.loadLevel;
	}
	getStarvationDelay() {
		let e = this.hls, t = e.media;
		if (!t) return Infinity;
		let n = t && t.playbackRate !== 0 ? Math.abs(t.playbackRate) : 1, r = e.mainForwardBufferInfo;
		return (r ? r.len : 0) / n;
	}
	getBwEstimate() {
		return this.bwEstimator.canEstimate() ? this.bwEstimator.getEstimate() : this.hls.config.abrEwmaDefaultEstimate;
	}
	findBestLevel(e, t, r, i, a, o, s) {
		var c;
		let l = i + a, u = this.lastLoadedFragLevel, f = u === -1 ? this.hls.firstLevel : u, { fragCurrent: p, partCurrent: m } = this, { levels: h, allAudioTracks: g, loadLevel: _, config: v } = this.hls;
		if (h.length === 1) return 0;
		let y = h[f], b = !!(y != null && (c = y.details) != null && c.live), x = _ === -1 || u === -1, S, C = "SDR", w = y?.frameRate || 0, { audioPreference: T, videoPreference: E } = v, D = this.audioTracksByGroup ||= getAudioTracksByGroup(g);
		if (x) {
			if (this.firstSelection !== -1) return this.firstSelection;
			let n = getStartCodecTier(this.codecTiers ||= getCodecTiers(h, D, t, r), C, e, T, E), { codecSet: i, videoRanges: a, minFramerate: o, minBitrate: s, preferHDR: c } = n;
			S = i, C = c ? a[a.length - 1] : a[0], w = o, e = Math.max(e, s), d.log(`[abr] picked start tier ${JSON.stringify(n)}`);
		} else S = y?.codecSet, C = y?.videoRange;
		let O = m ? m.duration : p ? p.duration : 0, k = this.bwEstimator.getEstimateTTFB() / 1e3, A = [];
		for (let c = r; c >= t; c--) {
			var j;
			let t = h[c], p = c > f;
			if (!t) continue;
			if (v.useMediaCapabilities && !t.supportedResult && !t.supportedPromise) {
				let n = navigator.mediaCapabilities;
				typeof n?.decodingInfo == "function" && requiresMediaCapabilitiesDecodingInfo(t, D, C, w, e, T) ? (t.supportedPromise = getMediaDecodingInfoPromise(t, D, n), t.supportedPromise.then((e) => {
					if (!this.hls) return;
					t.supportedResult = e;
					let n = this.hls.levels, r = n.indexOf(t);
					e.error ? d.warn(`[abr] MediaCapabilities decodingInfo error: "${e.error}" for level ${r} ${JSON.stringify(e)}`) : e.supported || (d.warn(`[abr] Unsupported MediaCapabilities decodingInfo result for level ${r} ${JSON.stringify(e)}`), r > -1 && n.length > 1 && (d.log(`[abr] Removing unsupported level ${r}`), this.hls.removeLevel(r)));
				})) : t.supportedResult = le;
			}
			if (S && t.codecSet !== S || C && t.videoRange !== C || p && w > t.frameRate || !p && w > 0 && w < t.frameRate || t.supportedResult && !((j = t.supportedResult.decodingInfoResults) != null && j[0].smooth)) {
				A.push(c);
				continue;
			}
			let g = t.details, E = (m ? g?.partTarget : g?.averagetargetduration) || O, M;
			M = p ? s * e : o * e;
			let N = O && i >= O * 2 && a === 0 ? h[c].averageBitrate : h[c].maxBitrate, P = this.getTimeToLoadFrag(k, M, N * E, g === void 0);
			if (M >= N && (c === u || t.loadError === 0 && t.fragmentError === 0) && (P <= k || !n(P) || b && !this.bitrateTestDelay || P < l)) {
				let e = this.forcedAutoLevel;
				return c !== _ && (e === -1 || e !== _) && (A.length && d.trace(`[abr] Skipped level(s) ${A.join(",")} of ${r} max with CODECS and VIDEO-RANGE:"${h[A[0]].codecs}" ${h[A[0]].videoRange}; not compatible with "${y.codecs}" ${C}`), d.info(`[abr] switch candidate:${f}->${c} adjustedbw(${Math.round(M)})-bitrate=${Math.round(M - N)} ttfb:${k.toFixed(1)} avgDuration:${E.toFixed(1)} maxFetchDuration:${l.toFixed(1)} fetchDuration:${P.toFixed(1)} firstSelection:${x} codecSet:${S} videoRange:${C} hls.loadLevel:${_}`)), x && (this.firstSelection = c), c;
			}
		}
		return -1;
	}
	set nextAutoLevel(e) {
		let { maxAutoLevel: t, minAutoLevel: n } = this.hls, r = Math.min(Math.max(e, n), t);
		this._nextAutoLevel !== r && (this.nextAutoLevelKey = "", this._nextAutoLevel = r);
	}
}, TaskLoop = class {
	constructor() {
		this._boundTick = void 0, this._tickTimer = null, this._tickInterval = null, this._tickCallCount = 0, this._boundTick = this.tick.bind(this);
	}
	destroy() {
		this.onHandlerDestroying(), this.onHandlerDestroyed();
	}
	onHandlerDestroying() {
		this.clearNextTick(), this.clearInterval();
	}
	onHandlerDestroyed() {}
	hasInterval() {
		return !!this._tickInterval;
	}
	hasNextTick() {
		return !!this._tickTimer;
	}
	setInterval(e) {
		return !this._tickInterval && (this._tickCallCount = 0, this._tickInterval = self.setInterval(this._boundTick, e), !0);
	}
	clearInterval() {
		return this._tickInterval ? (self.clearInterval(this._tickInterval), this._tickInterval = null, !0) : !1;
	}
	clearNextTick() {
		return this._tickTimer ? (self.clearTimeout(this._tickTimer), this._tickTimer = null, !0) : !1;
	}
	tick() {
		this._tickCallCount++, this._tickCallCount === 1 && (this.doTick(), this._tickCallCount > 1 && this.tickImmediate(), this._tickCallCount = 0);
	}
	tickImmediate() {
		this.clearNextTick(), this._tickTimer = self.setTimeout(this._boundTick, 0);
	}
	doTick() {}
}, V = {
	NOT_LOADED: "NOT_LOADED",
	APPENDING: "APPENDING",
	PARTIAL: "PARTIAL",
	OK: "OK"
}, FragmentTracker = class {
	constructor(e) {
		this.activePartLists = Object.create(null), this.endListFragments = Object.create(null), this.fragments = Object.create(null), this.timeRanges = Object.create(null), this.bufferPadding = .2, this.hls = void 0, this.hasGaps = !1, this.hls = e, this._registerListeners();
	}
	_registerListeners() {
		let { hls: e } = this;
		e.on(a.BUFFER_APPENDED, this.onBufferAppended, this), e.on(a.FRAG_BUFFERED, this.onFragBuffered, this), e.on(a.FRAG_LOADED, this.onFragLoaded, this);
	}
	_unregisterListeners() {
		let { hls: e } = this;
		e.off(a.BUFFER_APPENDED, this.onBufferAppended, this), e.off(a.FRAG_BUFFERED, this.onFragBuffered, this), e.off(a.FRAG_LOADED, this.onFragLoaded, this);
	}
	destroy() {
		this._unregisterListeners(), this.fragments = this.activePartLists = this.endListFragments = this.timeRanges = null;
	}
	getAppendedFrag(e, t) {
		let n = this.activePartLists[t];
		if (n) for (let t = n.length; t--;) {
			let r = n[t];
			if (!r) break;
			let i = r.end;
			if (r.start <= e && i !== null && e <= i) return r;
		}
		return this.getBufferedFrag(e, t);
	}
	getBufferedFrag(e, t) {
		let { fragments: n } = this, r = Object.keys(n);
		for (let i = r.length; i--;) {
			let a = n[r[i]];
			if (a?.body.type === t && a.buffered) {
				let t = a.body;
				if (t.start <= e && e <= t.end) return t;
			}
		}
		return null;
	}
	detectEvictedFragments(e, t, n, r) {
		this.timeRanges && (this.timeRanges[e] = t);
		let i = r?.fragment.sn || -1;
		Object.keys(this.fragments).forEach((r) => {
			let a = this.fragments[r];
			if (!a || i >= a.body.sn) return;
			if (!a.buffered && !a.loaded) {
				a.body.type === n && this.removeFragment(a.body);
				return;
			}
			let o = a.range[e];
			o && o.time.some((e) => {
				let n = !this.isTimeBuffered(e.startPTS, e.endPTS, t);
				return n && this.removeFragment(a.body), n;
			});
		});
	}
	detectPartialFragments(e) {
		let t = this.timeRanges, { frag: n, part: r } = e;
		if (!t || n.sn === "initSegment") return;
		let i = getFragmentKey(n), a = this.fragments[i];
		if (!a || a.buffered && n.gap) return;
		let o = !n.relurl;
		Object.keys(t).forEach((e) => {
			let i = n.elementaryStreams[e];
			if (!i) return;
			let s = t[e], c = o || i.partial === !0;
			a.range[e] = this.getBufferedTimes(n, r, c, s);
		}), a.loaded = null, Object.keys(a.range).length ? (a.buffered = !0, (a.body.endList = n.endList || a.body.endList) && (this.endListFragments[a.body.type] = a), isPartial(a) || this.removeParts(n.sn - 1, n.type)) : this.removeFragment(a.body);
	}
	removeParts(e, t) {
		let n = this.activePartLists[t];
		n && (this.activePartLists[t] = n.filter((t) => t.fragment.sn >= e));
	}
	fragBuffered(e, t) {
		let n = getFragmentKey(e), r = this.fragments[n];
		!r && t && (r = this.fragments[n] = {
			body: e,
			appendedPTS: null,
			loaded: null,
			buffered: !1,
			range: Object.create(null)
		}, e.gap && (this.hasGaps = !0)), r && (r.loaded = null, r.buffered = !0);
	}
	getBufferedTimes(e, t, n, r) {
		let i = {
			time: [],
			partial: n
		}, a = e.start, o = e.end, s = e.minEndPTS || o, c = e.maxStartPTS || a;
		for (let e = 0; e < r.length; e++) {
			let t = r.start(e) - this.bufferPadding, n = r.end(e) + this.bufferPadding;
			if (c >= t && s <= n) {
				i.time.push({
					startPTS: Math.max(a, r.start(e)),
					endPTS: Math.min(o, r.end(e))
				});
				break;
			}
			if (a < n && o > t) {
				let t = Math.max(a, r.start(e)), n = Math.min(o, r.end(e));
				n > t && (i.partial = !0, i.time.push({
					startPTS: t,
					endPTS: n
				}));
			} else if (o <= t) break;
		}
		return i;
	}
	getPartialFragment(e) {
		let t = null, n, r, i, a = 0, { bufferPadding: o, fragments: s } = this;
		return Object.keys(s).forEach((c) => {
			let l = s[c];
			l && isPartial(l) && (r = l.body.start - o, i = l.body.end + o, e >= r && e <= i && (n = Math.min(e - r, i - e), a <= n && (t = l.body, a = n)));
		}), t;
	}
	isEndListAppended(e) {
		let t = this.endListFragments[e];
		return t !== void 0 && (t.buffered || isPartial(t));
	}
	getState(e) {
		let t = getFragmentKey(e), n = this.fragments[t];
		return n ? n.buffered ? isPartial(n) ? V.PARTIAL : V.OK : V.APPENDING : V.NOT_LOADED;
	}
	isTimeBuffered(e, t, n) {
		let r, i;
		for (let a = 0; a < n.length; a++) {
			if (r = n.start(a) - this.bufferPadding, i = n.end(a) + this.bufferPadding, e >= r && t <= i) return !0;
			if (t <= r) return !1;
		}
		return !1;
	}
	onFragLoaded(e, t) {
		let { frag: n, part: r } = t;
		if (n.sn === "initSegment" || n.bitrateTest) return;
		let i = r ? null : t, a = getFragmentKey(n);
		this.fragments[a] = {
			body: n,
			appendedPTS: null,
			loaded: i,
			buffered: !1,
			range: Object.create(null)
		};
	}
	onBufferAppended(e, t) {
		let { frag: n, part: r, timeRanges: i } = t;
		if (n.sn === "initSegment") return;
		let a = n.type;
		if (r) {
			let e = this.activePartLists[a];
			e || (this.activePartLists[a] = e = []), e.push(r);
		}
		this.timeRanges = i, Object.keys(i).forEach((e) => {
			let t = i[e];
			this.detectEvictedFragments(e, t, a, r);
		});
	}
	onFragBuffered(e, t) {
		this.detectPartialFragments(t);
	}
	hasFragment(e) {
		let t = getFragmentKey(e);
		return !!this.fragments[t];
	}
	hasParts(e) {
		var t;
		return !!((t = this.activePartLists[e]) != null && t.length);
	}
	removeFragmentsInRange(e, t, n, r, i) {
		(!r || this.hasGaps) && Object.keys(this.fragments).forEach((a) => {
			let o = this.fragments[a];
			if (!o) return;
			let s = o.body;
			s.type !== n || r && !s.gap || s.start < t && s.end > e && (o.buffered || i) && this.removeFragment(s);
		});
	}
	removeFragment(e) {
		let t = getFragmentKey(e);
		e.stats.loaded = 0, e.clearElementaryStreamInfo();
		let n = this.activePartLists[e.type];
		if (n) {
			let t = e.sn;
			this.activePartLists[e.type] = n.filter((e) => e.fragment.sn !== t);
		}
		delete this.fragments[t], e.endList && delete this.endListFragments[e.type];
	}
	removeAllFragments() {
		this.fragments = Object.create(null), this.endListFragments = Object.create(null), this.activePartLists = Object.create(null), this.hasGaps = !1;
	}
};
function isPartial(e) {
	return e.buffered && (e.body.gap || e.range.video?.partial || e.range.audio?.partial || e.range.audiovideo?.partial);
}
function getFragmentKey(e) {
	return `${e.type}_${e.level}_${e.sn}`;
}
var de = {
	length: 0,
	start: () => 0,
	end: () => 0
}, H = class BufferHelper {
	static isBuffered(e, t) {
		try {
			if (e) {
				let n = BufferHelper.getBuffered(e);
				for (let e = 0; e < n.length; e++) if (t >= n.start(e) && t <= n.end(e)) return !0;
			}
		} catch {}
		return !1;
	}
	static bufferInfo(e, t, n) {
		try {
			if (e) {
				let r = BufferHelper.getBuffered(e), i = [], a = 0;
				for (; a < r.length; a++) i.push({
					start: r.start(a),
					end: r.end(a)
				});
				return this.bufferedInfo(i, t, n);
			}
		} catch {}
		return {
			len: 0,
			start: t,
			end: t,
			nextStart: void 0
		};
	}
	static bufferedInfo(e, t, n) {
		t = Math.max(0, t), e.sort(function(e, t) {
			return e.start - t.start || t.end - e.end;
		});
		let r = [];
		if (n) for (let t = 0; t < e.length; t++) {
			let i = r.length;
			if (i) {
				let a = r[i - 1].end;
				e[t].start - a < n ? e[t].end > a && (r[i - 1].end = e[t].end) : r.push(e[t]);
			} else r.push(e[t]);
		}
		else r = e;
		let i = 0, a, o = t, s = t;
		for (let e = 0; e < r.length; e++) {
			let c = r[e].start, l = r[e].end;
			if (t + n >= c && t < l) o = c, s = l, i = s - t;
			else if (t + n < c) {
				a = c;
				break;
			}
		}
		return {
			len: i,
			start: o || 0,
			end: s || 0,
			nextStart: a
		};
	}
	static getBuffered(e) {
		try {
			return e.buffered;
		} catch (e) {
			return d.log("failed to get media.buffered", e), de;
		}
	}
}, ChunkMetadata = class {
	constructor(e, t, n, r = 0, i = -1, a = !1) {
		this.level = void 0, this.sn = void 0, this.part = void 0, this.id = void 0, this.size = void 0, this.partial = void 0, this.transmuxing = getNewPerformanceTiming(), this.buffering = {
			audio: getNewPerformanceTiming(),
			video: getNewPerformanceTiming(),
			audiovideo: getNewPerformanceTiming()
		}, this.level = e, this.sn = t, this.id = n, this.size = r, this.part = i, this.partial = a;
	}
};
function getNewPerformanceTiming() {
	return {
		start: 0,
		executeStart: 0,
		executeEnd: 0,
		end: 0
	};
}
function findFirstFragWithCC(e, t) {
	for (let n = 0, r = e.length; n < r; n++) if (e[n]?.cc === t) return e[n];
	return null;
}
function shouldAlignOnDiscontinuities(e, t, n) {
	return !!(t && (n.endCC > n.startCC || e && e.cc < n.startCC));
}
function findDiscontinuousReferenceFrag(e, t) {
	let n = e.fragments, r = t.fragments;
	if (!r.length || !n.length) {
		d.log("No fragments to align");
		return;
	}
	let i = findFirstFragWithCC(n, r[0].cc);
	if (!i || i && !i.startPTS) {
		d.log("No frag in previous level to align on");
		return;
	}
	return i;
}
function adjustFragmentStart(e, t) {
	if (e) {
		let n = e.start + t;
		e.start = e.startPTS = n, e.endPTS = n + e.duration;
	}
}
function adjustSlidingStart(e, t) {
	let n = t.fragments;
	for (let t = 0, r = n.length; t < r; t++) adjustFragmentStart(n[t], e);
	t.fragmentHint && adjustFragmentStart(t.fragmentHint, e), t.alignedSliding = !0;
}
function alignStream(e, t, n) {
	t && (alignDiscontinuities(e, n, t), !n.alignedSliding && t && alignMediaPlaylistByPDT(n, t), !n.alignedSliding && t && !n.skippedSegments && adjustSliding(t, n));
}
function alignDiscontinuities(e, t, r) {
	if (shouldAlignOnDiscontinuities(e, r, t)) {
		let e = findDiscontinuousReferenceFrag(r, t);
		e && n(e.start) && (d.log(`Adjusting PTS using last level due to CC increase within current level ${t.url}`), adjustSlidingStart(e.start, t));
	}
}
function alignMediaPlaylistByPDT(e, t) {
	if (!e.hasProgramDateTime || !t.hasProgramDateTime) return;
	let n = e.fragments, r = t.fragments;
	if (!n.length || !r.length) return;
	let i, a, o = Math.min(t.endCC, e.endCC);
	t.startCC < o && e.startCC < o && (i = findFirstFragWithCC(r, o), a = findFirstFragWithCC(n, o)), (!i || !a) && (i = r[Math.floor(r.length / 2)], a = findFirstFragWithCC(n, i.cc) || n[Math.floor(n.length / 2)]);
	let s = i.programDateTime, c = a.programDateTime;
	s && c && adjustSlidingStart((c - s) / 1e3 - (a.start - i.start), e);
}
var fe = 2 ** 17, FragmentLoader = class {
	constructor(e) {
		this.config = void 0, this.loader = null, this.partLoadTimeout = -1, this.config = e;
	}
	destroy() {
		this.loader &&= (this.loader.destroy(), null);
	}
	abort() {
		this.loader && this.loader.abort();
	}
	load(e, t) {
		let n = e.url;
		if (!n) return Promise.reject(new LoadError({
			type: o.NETWORK_ERROR,
			details: s.FRAG_LOAD_ERROR,
			fatal: !1,
			frag: e,
			error: /* @__PURE__ */ Error(`Fragment does not have a ${n ? "part list" : "url"}`),
			networkDetails: null
		}));
		this.abort();
		let r = this.config, i = r.fLoader, a = r.loader;
		return new Promise((c, l) => {
			if (this.loader && this.loader.destroy(), e.gap) {
				if (e.tagList.some((e) => e[0] === "GAP")) {
					l(createGapLoadError(e));
					return;
				}
				e.gap = !1;
			}
			let u = this.loader = e.loader = i ? new i(r) : new a(r), d = createLoaderContext(e), f = getLoaderConfigWithoutReties(r.fragLoadPolicy.default), p = {
				loadPolicy: f,
				timeout: f.maxLoadTimeMs,
				maxRetry: 0,
				retryDelay: 0,
				maxRetryDelay: 0,
				highWaterMark: e.sn === "initSegment" ? Infinity : fe
			};
			e.stats = u.stats, u.load(d, p, {
				onSuccess: (t, n, r, i) => {
					this.resetLoader(e, u);
					let a = t.data;
					r.resetIV && e.decryptdata && (e.decryptdata.iv = new Uint8Array(a.slice(0, 16)), a = a.slice(16)), c({
						frag: e,
						part: null,
						payload: a,
						networkDetails: i
					});
				},
				onError: (t, r, i, a) => {
					this.resetLoader(e, u), l(new LoadError({
						type: o.NETWORK_ERROR,
						details: s.FRAG_LOAD_ERROR,
						fatal: !1,
						frag: e,
						response: _objectSpread2({
							url: n,
							data: void 0
						}, t),
						error: /* @__PURE__ */ Error(`HTTP Error ${t.code} ${t.text}`),
						networkDetails: i,
						stats: a
					}));
				},
				onAbort: (t, n, r) => {
					this.resetLoader(e, u), l(new LoadError({
						type: o.NETWORK_ERROR,
						details: s.INTERNAL_ABORTED,
						fatal: !1,
						frag: e,
						error: /* @__PURE__ */ Error("Aborted"),
						networkDetails: r,
						stats: t
					}));
				},
				onTimeout: (t, n, r) => {
					this.resetLoader(e, u), l(new LoadError({
						type: o.NETWORK_ERROR,
						details: s.FRAG_LOAD_TIMEOUT,
						fatal: !1,
						frag: e,
						error: /* @__PURE__ */ Error(`Timeout after ${p.timeout}ms`),
						networkDetails: r,
						stats: t
					}));
				},
				onProgress: (n, r, i, a) => {
					t && t({
						frag: e,
						part: null,
						payload: i,
						networkDetails: a
					});
				}
			});
		});
	}
	loadPart(e, t, n) {
		this.abort();
		let r = this.config, i = r.fLoader, a = r.loader;
		return new Promise((c, l) => {
			if (this.loader && this.loader.destroy(), e.gap || t.gap) {
				l(createGapLoadError(e, t));
				return;
			}
			let u = this.loader = e.loader = i ? new i(r) : new a(r), d = createLoaderContext(e, t), f = getLoaderConfigWithoutReties(r.fragLoadPolicy.default), p = {
				loadPolicy: f,
				timeout: f.maxLoadTimeMs,
				maxRetry: 0,
				retryDelay: 0,
				maxRetryDelay: 0,
				highWaterMark: fe
			};
			t.stats = u.stats, u.load(d, p, {
				onSuccess: (r, i, a, o) => {
					this.resetLoader(e, u), this.updateStatsFromPart(e, t);
					let s = {
						frag: e,
						part: t,
						payload: r.data,
						networkDetails: o
					};
					n(s), c(s);
				},
				onError: (n, r, i, a) => {
					this.resetLoader(e, u), l(new LoadError({
						type: o.NETWORK_ERROR,
						details: s.FRAG_LOAD_ERROR,
						fatal: !1,
						frag: e,
						part: t,
						response: _objectSpread2({
							url: d.url,
							data: void 0
						}, n),
						error: /* @__PURE__ */ Error(`HTTP Error ${n.code} ${n.text}`),
						networkDetails: i,
						stats: a
					}));
				},
				onAbort: (n, r, i) => {
					e.stats.aborted = t.stats.aborted, this.resetLoader(e, u), l(new LoadError({
						type: o.NETWORK_ERROR,
						details: s.INTERNAL_ABORTED,
						fatal: !1,
						frag: e,
						part: t,
						error: /* @__PURE__ */ Error("Aborted"),
						networkDetails: i,
						stats: n
					}));
				},
				onTimeout: (n, r, i) => {
					this.resetLoader(e, u), l(new LoadError({
						type: o.NETWORK_ERROR,
						details: s.FRAG_LOAD_TIMEOUT,
						fatal: !1,
						frag: e,
						part: t,
						error: /* @__PURE__ */ Error(`Timeout after ${p.timeout}ms`),
						networkDetails: i,
						stats: n
					}));
				}
			});
		});
	}
	updateStatsFromPart(e, t) {
		let n = e.stats, r = t.stats, i = r.total;
		if (n.loaded += r.loaded, i) {
			let r = Math.round(e.duration / t.duration), a = Math.min(Math.round(n.loaded / i), r), o = (r - a) * Math.round(n.loaded / a);
			n.total = n.loaded + o;
		} else n.total = Math.max(n.loaded, n.total);
		let a = n.loading, o = r.loading;
		a.start ? a.first += o.first - o.start : (a.start = o.start, a.first = o.first), a.end = o.end;
	}
	resetLoader(e, t) {
		e.loader = null, this.loader === t && (self.clearTimeout(this.partLoadTimeout), this.loader = null), t.destroy();
	}
};
function createLoaderContext(e, t = null) {
	let r = t || e, i = {
		frag: e,
		part: t,
		responseType: "arraybuffer",
		url: r.url,
		headers: {},
		rangeStart: 0,
		rangeEnd: 0
	}, a = r.byteRangeStartOffset, o = r.byteRangeEndOffset;
	if (n(a) && n(o)) {
		let t = a, n = o;
		if (e.sn === "initSegment" && e.decryptdata?.method === "AES-128") {
			let e = o - a;
			e % 16 && (n = o + (16 - e % 16)), a !== 0 && (i.resetIV = !0, t = a - 16);
		}
		i.rangeStart = t, i.rangeEnd = n;
	}
	return i;
}
function createGapLoadError(e, t) {
	let n = /* @__PURE__ */ Error(`GAP ${e.gap ? "tag" : "attribute"} found`), r = {
		type: o.MEDIA_ERROR,
		details: s.FRAG_GAP,
		fatal: !1,
		frag: e,
		error: n,
		networkDetails: null
	};
	return t && (r.part = t), (t || e).stats.aborted = !0, new LoadError(r);
}
var LoadError = class extends Error {
	constructor(e) {
		super(e.error.message), this.data = void 0, this.data = e;
	}
}, AESCrypto = class {
	constructor(e, t) {
		this.subtle = void 0, this.aesIV = void 0, this.subtle = e, this.aesIV = t;
	}
	decrypt(e, t) {
		return this.subtle.decrypt({
			name: "AES-CBC",
			iv: this.aesIV
		}, t, e);
	}
}, FastAESKey = class {
	constructor(e, t) {
		this.subtle = void 0, this.key = void 0, this.subtle = e, this.key = t;
	}
	expandKey() {
		return this.subtle.importKey("raw", this.key, { name: "AES-CBC" }, !1, ["encrypt", "decrypt"]);
	}
};
function removePadding(e) {
	let t = e.byteLength, n = t && new DataView(e.buffer).getUint8(t - 1);
	return n ? sliceUint8(e, 0, t - n) : e;
}
var AESDecryptor = class {
	constructor() {
		this.rcon = [
			0,
			1,
			2,
			4,
			8,
			16,
			32,
			64,
			128,
			27,
			54
		], this.subMix = [
			/* @__PURE__ */ new Uint32Array(256),
			/* @__PURE__ */ new Uint32Array(256),
			/* @__PURE__ */ new Uint32Array(256),
			/* @__PURE__ */ new Uint32Array(256)
		], this.invSubMix = [
			/* @__PURE__ */ new Uint32Array(256),
			/* @__PURE__ */ new Uint32Array(256),
			/* @__PURE__ */ new Uint32Array(256),
			/* @__PURE__ */ new Uint32Array(256)
		], this.sBox = /* @__PURE__ */ new Uint32Array(256), this.invSBox = /* @__PURE__ */ new Uint32Array(256), this.key = /* @__PURE__ */ new Uint32Array(), this.ksRows = 0, this.keySize = 0, this.keySchedule = void 0, this.invKeySchedule = void 0, this.initTable();
	}
	uint8ArrayToUint32Array_(e) {
		let t = new DataView(e), n = /* @__PURE__ */ new Uint32Array(4);
		for (let e = 0; e < 4; e++) n[e] = t.getUint32(e * 4);
		return n;
	}
	initTable() {
		let e = this.sBox, t = this.invSBox, n = this.subMix, r = n[0], i = n[1], a = n[2], o = n[3], s = this.invSubMix, c = s[0], l = s[1], u = s[2], d = s[3], f = /* @__PURE__ */ new Uint32Array(256), p = 0, m = 0, h = 0;
		for (h = 0; h < 256; h++) h < 128 ? f[h] = h << 1 : f[h] = h << 1 ^ 283;
		for (h = 0; h < 256; h++) {
			let n = m ^ m << 1 ^ m << 2 ^ m << 3 ^ m << 4;
			n = n >>> 8 ^ n & 255 ^ 99, e[p] = n, t[n] = p;
			let s = f[p], h = f[s], g = f[h], _ = f[n] * 257 ^ n * 16843008;
			r[p] = _ << 24 | _ >>> 8, i[p] = _ << 16 | _ >>> 16, a[p] = _ << 8 | _ >>> 24, o[p] = _, _ = g * 16843009 ^ h * 65537 ^ s * 257 ^ p * 16843008, c[n] = _ << 24 | _ >>> 8, l[n] = _ << 16 | _ >>> 16, u[n] = _ << 8 | _ >>> 24, d[n] = _, p ? (p = s ^ f[f[f[g ^ s]]], m ^= f[f[m]]) : p = m = 1;
		}
	}
	expandKey(e) {
		let t = this.uint8ArrayToUint32Array_(e), n = !0, r = 0;
		for (; r < t.length && n;) n = t[r] === this.key[r], r++;
		if (n) return;
		this.key = t;
		let i = this.keySize = t.length;
		if (i !== 4 && i !== 6 && i !== 8) throw Error("Invalid aes key size=" + i);
		let a = this.ksRows = (i + 6 + 1) * 4, o, s, c = this.keySchedule = new Uint32Array(a), l = this.invKeySchedule = new Uint32Array(a), u = this.sBox, d = this.rcon, f = this.invSubMix, p = f[0], m = f[1], h = f[2], g = f[3], _, v;
		for (o = 0; o < a; o++) {
			if (o < i) {
				_ = c[o] = t[o];
				continue;
			}
			v = _, o % i === 0 ? (v = v << 8 | v >>> 24, v = u[v >>> 24] << 24 | u[v >>> 16 & 255] << 16 | u[v >>> 8 & 255] << 8 | u[v & 255], v ^= d[o / i | 0] << 24) : i > 6 && o % i === 4 && (v = u[v >>> 24] << 24 | u[v >>> 16 & 255] << 16 | u[v >>> 8 & 255] << 8 | u[v & 255]), c[o] = _ = (c[o - i] ^ v) >>> 0;
		}
		for (s = 0; s < a; s++) o = a - s, v = s & 3 ? c[o] : c[o - 4], s < 4 || o <= 4 ? l[s] = v : l[s] = p[u[v >>> 24]] ^ m[u[v >>> 16 & 255]] ^ h[u[v >>> 8 & 255]] ^ g[u[v & 255]], l[s] = l[s] >>> 0;
	}
	networkToHostOrderSwap(e) {
		return e << 24 | (e & 65280) << 8 | (e & 16711680) >> 8 | e >>> 24;
	}
	decrypt(e, t, n) {
		let r = this.keySize + 6, i = this.invKeySchedule, a = this.invSBox, o = this.invSubMix, s = o[0], c = o[1], l = o[2], u = o[3], d = this.uint8ArrayToUint32Array_(n), f = d[0], p = d[1], m = d[2], h = d[3], g = new Int32Array(e), _ = new Int32Array(g.length), v, y, b, x, S, C, w, T, E, D, O, k, A, j, M = this.networkToHostOrderSwap;
		for (; t < g.length;) {
			for (E = M(g[t]), D = M(g[t + 1]), O = M(g[t + 2]), k = M(g[t + 3]), S = E ^ i[0], C = k ^ i[1], w = O ^ i[2], T = D ^ i[3], A = 4, j = 1; j < r; j++) v = s[S >>> 24] ^ c[C >> 16 & 255] ^ l[w >> 8 & 255] ^ u[T & 255] ^ i[A], y = s[C >>> 24] ^ c[w >> 16 & 255] ^ l[T >> 8 & 255] ^ u[S & 255] ^ i[A + 1], b = s[w >>> 24] ^ c[T >> 16 & 255] ^ l[S >> 8 & 255] ^ u[C & 255] ^ i[A + 2], x = s[T >>> 24] ^ c[S >> 16 & 255] ^ l[C >> 8 & 255] ^ u[w & 255] ^ i[A + 3], S = v, C = y, w = b, T = x, A += 4;
			v = a[S >>> 24] << 24 ^ a[C >> 16 & 255] << 16 ^ a[w >> 8 & 255] << 8 ^ a[T & 255] ^ i[A], y = a[C >>> 24] << 24 ^ a[w >> 16 & 255] << 16 ^ a[T >> 8 & 255] << 8 ^ a[S & 255] ^ i[A + 1], b = a[w >>> 24] << 24 ^ a[T >> 16 & 255] << 16 ^ a[S >> 8 & 255] << 8 ^ a[C & 255] ^ i[A + 2], x = a[T >>> 24] << 24 ^ a[S >> 16 & 255] << 16 ^ a[C >> 8 & 255] << 8 ^ a[w & 255] ^ i[A + 3], _[t] = M(v ^ f), _[t + 1] = M(x ^ p), _[t + 2] = M(b ^ m), _[t + 3] = M(y ^ h), f = E, p = D, m = O, h = k, t += 4;
		}
		return _.buffer;
	}
}, pe = 16, Decrypter = class {
	constructor(e, { removePKCS7Padding: t = !0 } = {}) {
		if (this.logEnabled = !0, this.removePKCS7Padding = void 0, this.subtle = null, this.softwareDecrypter = null, this.key = null, this.fastAesKey = null, this.remainderData = null, this.currentIV = null, this.currentResult = null, this.useSoftware = void 0, this.useSoftware = e.enableSoftwareAES, this.removePKCS7Padding = t, t) try {
			let e = self.crypto;
			e && (this.subtle = e.subtle || e.webkitSubtle);
		} catch {}
		this.useSoftware = !this.subtle;
	}
	destroy() {
		this.subtle = null, this.softwareDecrypter = null, this.key = null, this.fastAesKey = null, this.remainderData = null, this.currentIV = null, this.currentResult = null;
	}
	isSync() {
		return this.useSoftware;
	}
	flush() {
		let { currentResult: e, remainderData: t } = this;
		if (!e || t) return this.reset(), null;
		let n = new Uint8Array(e);
		return this.reset(), this.removePKCS7Padding ? removePadding(n) : n;
	}
	reset() {
		this.currentResult = null, this.currentIV = null, this.remainderData = null, this.softwareDecrypter &&= null;
	}
	decrypt(e, t, n) {
		return this.useSoftware ? new Promise((r, i) => {
			this.softwareDecrypt(new Uint8Array(e), t, n);
			let a = this.flush();
			a ? r(a.buffer) : i(/* @__PURE__ */ Error("[softwareDecrypt] Failed to decrypt data"));
		}) : this.webCryptoDecrypt(new Uint8Array(e), t, n);
	}
	softwareDecrypt(e, t, n) {
		let { currentIV: r, currentResult: i, remainderData: a } = this;
		this.logOnce("JS AES decrypt"), a && (e = appendUint8Array(a, e), this.remainderData = null);
		let o = this.getValidChunk(e);
		if (!o.length) return null;
		r && (n = r);
		let s = this.softwareDecrypter;
		s ||= this.softwareDecrypter = new AESDecryptor(), s.expandKey(t);
		let c = i;
		return this.currentResult = s.decrypt(o.buffer, 0, n), this.currentIV = sliceUint8(o, -16).buffer, c || null;
	}
	webCryptoDecrypt(e, t, n) {
		if (this.key !== t || !this.fastAesKey) {
			if (!this.subtle) return Promise.resolve(this.onWebCryptoError(e, t, n));
			this.key = t, this.fastAesKey = new FastAESKey(this.subtle, t);
		}
		return this.fastAesKey.expandKey().then((t) => this.subtle ? (this.logOnce("WebCrypto AES decrypt"), new AESCrypto(this.subtle, new Uint8Array(n)).decrypt(e.buffer, t)) : Promise.reject(/* @__PURE__ */ Error("web crypto not initialized"))).catch((r) => (d.warn(`[decrypter]: WebCrypto Error, disable WebCrypto API, ${r.name}: ${r.message}`), this.onWebCryptoError(e, t, n)));
	}
	onWebCryptoError(e, t, n) {
		this.useSoftware = !0, this.logEnabled = !0, this.softwareDecrypt(e, t, n);
		let r = this.flush();
		if (r) return r.buffer;
		throw Error("WebCrypto and softwareDecrypt: failed to decrypt data");
	}
	getValidChunk(e) {
		let t = e, n = e.length - e.length % pe;
		return n !== e.length && (t = sliceUint8(e, 0, n), this.remainderData = sliceUint8(e, n)), t;
	}
	logOnce(e) {
		this.logEnabled &&= (d.log(`[decrypter]: ${e}`), !1);
	}
}, me = { toString: function(e) {
	let t = "", n = e.length;
	for (let r = 0; r < n; r++) t += `[${e.start(r).toFixed(3)}-${e.end(r).toFixed(3)}]`;
	return t;
} }, U = {
	STOPPED: "STOPPED",
	IDLE: "IDLE",
	KEY_LOADING: "KEY_LOADING",
	FRAG_LOADING: "FRAG_LOADING",
	FRAG_LOADING_WAITING_RETRY: "FRAG_LOADING_WAITING_RETRY",
	WAITING_TRACK: "WAITING_TRACK",
	PARSING: "PARSING",
	PARSED: "PARSED",
	ENDED: "ENDED",
	ERROR: "ERROR",
	WAITING_INIT_PTS: "WAITING_INIT_PTS",
	WAITING_LEVEL: "WAITING_LEVEL"
}, BaseStreamController = class extends TaskLoop {
	constructor(e, t, n, r, i) {
		super(), this.hls = void 0, this.fragPrevious = null, this.fragCurrent = null, this.fragmentTracker = void 0, this.transmuxer = null, this._state = U.STOPPED, this.playlistType = void 0, this.media = null, this.mediaBuffer = null, this.config = void 0, this.bitrateTest = !1, this.lastCurrentTime = 0, this.nextLoadPosition = 0, this.startPosition = 0, this.startTimeOffset = null, this.loadedmetadata = !1, this.retryDate = 0, this.levels = null, this.fragmentLoader = void 0, this.keyLoader = void 0, this.levelLastLoaded = null, this.startFragRequested = !1, this.decrypter = void 0, this.initPTS = [], this.onvseeking = null, this.onvended = null, this.logPrefix = "", this.log = void 0, this.warn = void 0, this.playlistType = i, this.logPrefix = r, this.log = d.log.bind(d, `${r}:`), this.warn = d.warn.bind(d, `${r}:`), this.hls = e, this.fragmentLoader = new FragmentLoader(e.config), this.keyLoader = n, this.fragmentTracker = t, this.config = e.config, this.decrypter = new Decrypter(e.config), e.on(a.MANIFEST_LOADED, this.onManifestLoaded, this);
	}
	doTick() {
		this.onTickEnd();
	}
	onTickEnd() {}
	startLoad(e) {}
	stopLoad() {
		this.fragmentLoader.abort(), this.keyLoader.abort(this.playlistType);
		let e = this.fragCurrent;
		e != null && e.loader && (e.abortRequests(), this.fragmentTracker.removeFragment(e)), this.resetTransmuxer(), this.fragCurrent = null, this.fragPrevious = null, this.clearInterval(), this.clearNextTick(), this.state = U.STOPPED;
	}
	_streamEnded(e, t) {
		if (t.live || e.nextStart || !e.end || !this.media) return !1;
		let n = t.partList;
		if (n != null && n.length) {
			let e = n[n.length - 1];
			return H.isBuffered(this.media, e.start + e.duration / 2);
		}
		let r = t.fragments[t.fragments.length - 1].type;
		return this.fragmentTracker.isEndListAppended(r);
	}
	getLevelDetails() {
		if (this.levels && this.levelLastLoaded !== null) return this.levelLastLoaded?.details;
	}
	onMediaAttached(e, t) {
		let n = this.media = this.mediaBuffer = t.media;
		this.onvseeking = this.onMediaSeeking.bind(this), this.onvended = this.onMediaEnded.bind(this), n.addEventListener("seeking", this.onvseeking), n.addEventListener("ended", this.onvended);
		let r = this.config;
		this.levels && r.autoStartLoad && this.state === U.STOPPED && this.startLoad(r.startPosition);
	}
	onMediaDetaching() {
		let e = this.media;
		e != null && e.ended && (this.log("MSE detaching and video ended, reset startPosition"), this.startPosition = this.lastCurrentTime = 0), e && this.onvseeking && this.onvended && (e.removeEventListener("seeking", this.onvseeking), e.removeEventListener("ended", this.onvended), this.onvseeking = this.onvended = null), this.keyLoader && this.keyLoader.detach(), this.media = this.mediaBuffer = null, this.loadedmetadata = !1, this.fragmentTracker.removeAllFragments(), this.stopLoad();
	}
	onMediaSeeking() {
		let { config: e, fragCurrent: t, media: r, mediaBuffer: i, state: a } = this, o = r ? r.currentTime : 0, s = H.bufferInfo(i || r, o, e.maxBufferHole);
		if (this.log(`media seeking to ${n(o) ? o.toFixed(3) : o}, state: ${a}`), this.state === U.ENDED) this.resetLoadingState();
		else if (t) {
			let n = e.maxFragLookUpTolerance, r = t.start - n, i = t.start + t.duration + n;
			if (!s.len || i < s.start || r > s.end) {
				let e = o > i;
				(o < r || e) && (e && t.loader && (this.log("seeking outside of buffer while fragment load in progress, cancel fragment load"), t.abortRequests(), this.resetLoadingState()), this.fragPrevious = null);
			}
		}
		r && (this.fragmentTracker.removeFragmentsInRange(o, Infinity, this.playlistType, !0), this.lastCurrentTime = o), !this.loadedmetadata && !s.len && (this.nextLoadPosition = this.startPosition = o), this.tickImmediate();
	}
	onMediaEnded() {
		this.startPosition = this.lastCurrentTime = 0;
	}
	onManifestLoaded(e, t) {
		this.startTimeOffset = t.startTimeOffset, this.initPTS = [];
	}
	onHandlerDestroying() {
		this.hls.off(a.MANIFEST_LOADED, this.onManifestLoaded, this), this.stopLoad(), super.onHandlerDestroying(), this.hls = null;
	}
	onHandlerDestroyed() {
		this.state = U.STOPPED, this.fragmentLoader && this.fragmentLoader.destroy(), this.keyLoader && this.keyLoader.destroy(), this.decrypter && this.decrypter.destroy(), this.hls = this.log = this.warn = this.decrypter = this.keyLoader = this.fragmentLoader = this.fragmentTracker = null, super.onHandlerDestroyed();
	}
	loadFragment(e, t, n) {
		this._loadFragForPlayback(e, t, n);
	}
	_loadFragForPlayback(e, t, n) {
		let progressCallback = (t) => {
			if (this.fragContextChanged(e)) {
				this.warn(`Fragment ${e.sn}${t.part ? " p: " + t.part.index : ""} of level ${e.level} was dropped during download.`), this.fragmentTracker.removeFragment(e);
				return;
			}
			e.stats.chunkCount++, this._handleFragmentLoadProgress(t);
		};
		this._doFragLoad(e, t, n, progressCallback).then((t) => {
			if (!t) return;
			let n = this.state;
			if (this.fragContextChanged(e)) {
				(n === U.FRAG_LOADING || !this.fragCurrent && n === U.PARSING) && (this.fragmentTracker.removeFragment(e), this.state = U.IDLE);
				return;
			}
			"payload" in t && (this.log(`Loaded fragment ${e.sn} of level ${e.level}`), this.hls.trigger(a.FRAG_LOADED, t)), this._handleFragmentLoadComplete(t);
		}).catch((t) => {
			this.state !== U.STOPPED && this.state !== U.ERROR && (this.warn(`Frag error: ${t?.message || t}`), this.resetFragmentLoading(e));
		});
	}
	clearTrackerIfNeeded(e) {
		let { fragmentTracker: t } = this;
		if (t.getState(e) === V.APPENDING) {
			let n = e.type, r = this.getFwdBufferInfo(this.mediaBuffer, n), i = Math.max(e.duration, r ? r.len : this.config.maxBufferLength), a = this.backtrackFragment;
			((a ? e.sn - a.sn : 0) === 1 || this.reduceMaxBufferLength(i, e.duration)) && t.removeFragment(e);
		} else this.mediaBuffer?.buffered.length === 0 ? t.removeAllFragments() : t.hasParts(e.type) && (t.detectPartialFragments({
			frag: e,
			part: null,
			stats: e.stats,
			id: e.type
		}), t.getState(e) === V.PARTIAL && t.removeFragment(e));
	}
	checkLiveUpdate(e) {
		if (e.updated && !e.live) {
			let t = e.fragments[e.fragments.length - 1];
			this.fragmentTracker.detectPartialFragments({
				frag: t,
				part: null,
				stats: t.stats,
				id: t.type
			});
		}
		e.fragments[0] || (e.deltaUpdateFailed = !0);
	}
	flushMainBuffer(e, t, n = null) {
		if (!(e - t)) return;
		let r = {
			startOffset: e,
			endOffset: t,
			type: n
		};
		this.hls.trigger(a.BUFFER_FLUSHING, r);
	}
	_loadInitSegment(e, t) {
		this._doFragLoad(e, t).then((t) => {
			if (!t || this.fragContextChanged(e) || !this.levels) throw Error("init load aborted");
			return t;
		}).then((t) => {
			let { hls: n } = this, { payload: r } = t, i = e.decryptdata;
			if (r && r.byteLength > 0 && i != null && i.key && i.iv && i.method === "AES-128") {
				let c = self.performance.now();
				return this.decrypter.decrypt(new Uint8Array(r), i.key.buffer, i.iv.buffer).catch((t) => {
					throw n.trigger(a.ERROR, {
						type: o.MEDIA_ERROR,
						details: s.FRAG_DECRYPT_ERROR,
						fatal: !1,
						error: t,
						reason: t.message,
						frag: e
					}), t;
				}).then((r) => {
					let i = self.performance.now();
					return n.trigger(a.FRAG_DECRYPTED, {
						frag: e,
						payload: r,
						stats: {
							tstart: c,
							tdecrypt: i
						}
					}), t.payload = r, this.completeInitSegmentLoad(t);
				});
			}
			return this.completeInitSegmentLoad(t);
		}).catch((t) => {
			this.state !== U.STOPPED && this.state !== U.ERROR && (this.warn(t), this.resetFragmentLoading(e));
		});
	}
	completeInitSegmentLoad(e) {
		let { levels: t } = this;
		if (!t) throw Error("init load aborted, missing levels");
		let n = e.frag.stats;
		this.state = U.IDLE, e.frag.data = new Uint8Array(e.payload), n.parsing.start = n.buffering.start = self.performance.now(), n.parsing.end = n.buffering.end = self.performance.now(), this.tick();
	}
	fragContextChanged(e) {
		let { fragCurrent: t } = this;
		return !e || !t || e.sn !== t.sn || e.level !== t.level;
	}
	fragBufferedComplete(e, t) {
		let n = this.mediaBuffer ? this.mediaBuffer : this.media;
		if (this.log(`Buffered ${e.type} sn: ${e.sn}${t ? " part: " + t.index : ""} of ${this.playlistType === I.MAIN ? "level" : "track"} ${e.level} (frag:[${(e.startPTS ?? NaN).toFixed(3)}-${(e.endPTS ?? NaN).toFixed(3)}] > buffer:${n ? me.toString(H.getBuffered(n)) : "(detached)"})`), e.sn !== "initSegment") {
			if (e.type !== I.SUBTITLE) {
				let t = e.elementaryStreams;
				if (!Object.keys(t).some((e) => !!t[e])) {
					this.state = U.IDLE;
					return;
				}
			}
			let t = this.levels?.[e.level];
			t != null && t.fragmentError && (this.log(`Resetting level fragment error count of ${t.fragmentError} on frag buffered`), t.fragmentError = 0);
		}
		this.state = U.IDLE, n && (!this.loadedmetadata && e.type == I.MAIN && n.buffered.length && this.fragCurrent?.sn === this.fragPrevious?.sn && (this.loadedmetadata = !0, this.seekToStartPos()), this.tick());
	}
	seekToStartPos() {}
	_handleFragmentLoadComplete(e) {
		let { transmuxer: t } = this;
		if (!t) return;
		let { frag: n, part: r, partsLoaded: i } = e, a = !i || i.length === 0 || i.some((e) => !e), o = new ChunkMetadata(n.level, n.sn, n.stats.chunkCount + 1, 0, r ? r.index : -1, !a);
		t.flush(o);
	}
	_handleFragmentLoadProgress(e) {}
	_doFragLoad(e, t, r = null, i) {
		var o;
		let s = t?.details;
		if (!this.levels || !s) throw Error(`frag load aborted, missing level${s ? "" : " detail"}s`);
		let c = null;
		if (e.encrypted && !((o = e.decryptdata) != null && o.key) ? (this.log(`Loading key for ${e.sn} of [${s.startSN}-${s.endSN}], ${this.logPrefix === "[stream-controller]" ? "level" : "track"} ${e.level}`), this.state = U.KEY_LOADING, this.fragCurrent = e, c = this.keyLoader.load(e).then((e) => {
			if (!this.fragContextChanged(e.frag)) return this.hls.trigger(a.KEY_LOADED, e), this.state === U.KEY_LOADING && (this.state = U.IDLE), e;
		}), this.hls.trigger(a.KEY_LOADING, { frag: e }), this.fragCurrent === null && (c = Promise.reject(/* @__PURE__ */ Error("frag load aborted, context changed in KEY_LOADING")))) : !e.encrypted && s.encryptedFragments.length && this.keyLoader.loadClear(e, s.encryptedFragments), r = Math.max(e.start, r || 0), this.config.lowLatencyMode && e.sn !== "initSegment") {
			let n = s.partList;
			if (n && i) {
				r > e.end && s.fragmentHint && (e = s.fragmentHint);
				let o = this.getNextPart(n, e, r);
				if (o > -1) {
					let l = n[o];
					this.log(`Loading part sn: ${e.sn} p: ${l.index} cc: ${e.cc} of playlist [${s.startSN}-${s.endSN}] parts [0-${o}-${n.length - 1}] ${this.logPrefix === "[stream-controller]" ? "level" : "track"}: ${e.level}, target: ${parseFloat(r.toFixed(3))}`), this.nextLoadPosition = l.start + l.duration, this.state = U.FRAG_LOADING;
					let u;
					return u = c ? c.then((n) => !n || this.fragContextChanged(n.frag) ? null : this.doFragPartsLoad(e, l, t, i)).catch((e) => this.handleFragLoadError(e)) : this.doFragPartsLoad(e, l, t, i).catch((e) => this.handleFragLoadError(e)), this.hls.trigger(a.FRAG_LOADING, {
						frag: e,
						part: l,
						targetBufferTime: r
					}), this.fragCurrent === null ? Promise.reject(/* @__PURE__ */ Error("frag load aborted, context changed in FRAG_LOADING parts")) : u;
				}
				if (!e.url || this.loadedEndOfParts(n, r)) return Promise.resolve(null);
			}
		}
		this.log(`Loading fragment ${e.sn} cc: ${e.cc} ${s ? "of [" + s.startSN + "-" + s.endSN + "] " : ""}${this.logPrefix === "[stream-controller]" ? "level" : "track"}: ${e.level}, target: ${parseFloat(r.toFixed(3))}`), n(e.sn) && !this.bitrateTest && (this.nextLoadPosition = e.start + e.duration), this.state = U.FRAG_LOADING;
		let l = this.config.progressive, u;
		return u = l && c ? c.then((t) => !t || this.fragContextChanged(t?.frag) ? null : this.fragmentLoader.load(e, i)).catch((e) => this.handleFragLoadError(e)) : Promise.all([this.fragmentLoader.load(e, l ? i : void 0), c]).then(([e]) => (!l && e && i && i(e), e)).catch((e) => this.handleFragLoadError(e)), this.hls.trigger(a.FRAG_LOADING, {
			frag: e,
			targetBufferTime: r
		}), this.fragCurrent === null ? Promise.reject(/* @__PURE__ */ Error("frag load aborted, context changed in FRAG_LOADING")) : u;
	}
	doFragPartsLoad(e, t, n, r) {
		return new Promise((i, o) => {
			let s = [], c = n.details?.partList, loadPart = (t) => {
				this.fragmentLoader.loadPart(e, t, r).then((r) => {
					s[t.index] = r;
					let o = r.part;
					this.hls.trigger(a.FRAG_LOADED, r);
					let l = getPartWith(n, e.sn, t.index + 1) || findPart(c, e.sn, t.index + 1);
					if (l) loadPart(l);
					else return i({
						frag: e,
						part: o,
						partsLoaded: s
					});
				}).catch(o);
			};
			loadPart(t);
		});
	}
	handleFragLoadError(e) {
		if ("data" in e) {
			let t = e.data;
			e.data && t.details === s.INTERNAL_ABORTED ? this.handleFragLoadAborted(t.frag, t.part) : this.hls.trigger(a.ERROR, t);
		} else this.hls.trigger(a.ERROR, {
			type: o.OTHER_ERROR,
			details: s.INTERNAL_EXCEPTION,
			err: e,
			error: e,
			fatal: !0
		});
		return null;
	}
	_handleTransmuxerFlush(e) {
		let t = this.getCurrentContext(e);
		if (!t || this.state !== U.PARSING) {
			!this.fragCurrent && this.state !== U.STOPPED && this.state !== U.ERROR && (this.state = U.IDLE);
			return;
		}
		let { frag: n, part: r, level: i } = t, a = self.performance.now();
		n.stats.parsing.end = a, r && (r.stats.parsing.end = a), this.updateLevelTiming(n, r, i, e.partial);
	}
	getCurrentContext(e) {
		let { levels: t, fragCurrent: n } = this, { level: r, sn: i, part: a } = e;
		if (!(t != null && t[r])) return this.warn(`Levels object was unset while buffering fragment ${i} of level ${r}. The current chunk will not be buffered.`), null;
		let o = t[r], s = a > -1 ? getPartWith(o, i, a) : null, c = s ? s.fragment : getFragmentWithSN(o, i, n);
		return c ? (n && n !== c && (c.stats = n.stats), {
			frag: c,
			part: s,
			level: o
		}) : null;
	}
	bufferFragmentData(e, t, n, r, i) {
		var o;
		if (!e || this.state !== U.PARSING) return;
		let { data1: s, data2: c } = e, l = s;
		if (s && c && (l = appendUint8Array(s, c)), !((o = l) != null && o.length)) return;
		let u = {
			type: e.type,
			frag: t,
			part: n,
			chunkMeta: r,
			parent: t.type,
			data: l
		};
		if (this.hls.trigger(a.BUFFER_APPENDING, u), e.dropped && e.independent && !n) {
			if (i) return;
			this.flushBufferGap(t);
		}
	}
	flushBufferGap(e) {
		let t = this.media;
		if (!t) return;
		if (!H.isBuffered(t, t.currentTime)) {
			this.flushMainBuffer(0, e.start);
			return;
		}
		let n = t.currentTime, r = H.bufferInfo(t, n, 0), i = e.duration, a = Math.min(this.config.maxFragLookUpTolerance * 2, i * .25), o = Math.max(Math.min(e.start - a, r.end - a), n + a);
		e.start - o > a && this.flushMainBuffer(o, e.start);
	}
	getFwdBufferInfo(e, t) {
		let r = this.getLoadPosition();
		return n(r) ? this.getFwdBufferInfoAtPos(e, r, t) : null;
	}
	getFwdBufferInfoAtPos(e, t, n) {
		let { config: { maxBufferHole: r } } = this, i = H.bufferInfo(e, t, r);
		if (i.len === 0 && i.nextStart !== void 0) {
			let a = this.fragmentTracker.getBufferedFrag(t, n);
			if (a && i.nextStart < a.end) return H.bufferInfo(e, t, Math.max(i.nextStart, r));
		}
		return i;
	}
	getMaxBufferLength(e) {
		let { config: t } = this, n;
		return n = e ? Math.max(8 * t.maxBufferSize / e, t.maxBufferLength) : t.maxBufferLength, Math.min(n, t.maxMaxBufferLength);
	}
	reduceMaxBufferLength(e, t) {
		let n = this.config, r = Math.max(Math.min(e - t, n.maxBufferLength), t), i = Math.max(e - t * 3, n.maxMaxBufferLength / 2, r);
		return i >= r && (n.maxMaxBufferLength = i, this.warn(`Reduce max buffer length to ${i}s`), !0);
	}
	getAppendedFrag(e, t = I.MAIN) {
		let n = this.fragmentTracker.getAppendedFrag(e, I.MAIN);
		return n && "fragment" in n ? n.fragment : n;
	}
	getNextFragment(e, t) {
		let n = t.fragments, r = n.length;
		if (!r) return null;
		let { config: i } = this, a = n[0].start, o;
		if (t.live) {
			let s = i.initialLiveManifestSize;
			if (r < s) return this.warn(`Not enough fragments to start playback (have: ${r}, need: ${s})`), null;
			(!t.PTSKnown && !this.startFragRequested && this.startPosition === -1 || e < a) && (o = this.getInitialLiveFragment(t, n), this.startPosition = this.nextLoadPosition = o ? this.hls.liveSyncPosition || o.start : e);
		} else e <= a && (o = n[0]);
		if (!o) {
			let n = i.lowLatencyMode ? t.partEnd : t.fragmentEnd;
			o = this.getFragmentAtPosition(e, n, t);
		}
		return this.mapToInitFragWhenRequired(o);
	}
	isLoopLoading(e, t) {
		let n = this.fragmentTracker.getState(e);
		return (n === V.OK || n === V.PARTIAL && !!e.gap) && this.nextLoadPosition > t;
	}
	getNextFragmentLoopLoading(e, t, n, r, i) {
		let a = e.gap, o = this.getNextFragment(this.nextLoadPosition, t);
		if (o === null) return o;
		if (e = o, a && e && !e.gap && n.nextStart) {
			let t = this.getFwdBufferInfoAtPos(this.mediaBuffer ? this.mediaBuffer : this.media, n.nextStart, r);
			if (t !== null && n.len + t.len >= i) return this.log(`buffer full after gaps in "${r}" playlist starting at sn: ${e.sn}`), null;
		}
		return e;
	}
	mapToInitFragWhenRequired(e) {
		return e != null && e.initSegment && !(e != null && e.initSegment.data) && !this.bitrateTest ? e.initSegment : e;
	}
	getNextPart(e, t, n) {
		let r = -1, i = !1, a = !0;
		for (let o = 0, s = e.length; o < s; o++) {
			let s = e[o];
			if (a &&= !s.independent, r > -1 && n < s.start) break;
			let c = s.loaded;
			c ? r = -1 : (i || s.independent || a) && s.fragment === t && (r = o), i = c;
		}
		return r;
	}
	loadedEndOfParts(e, t) {
		let n = e[e.length - 1];
		return n && t > n.start && n.loaded;
	}
	getInitialLiveFragment(e, t) {
		let n = this.fragPrevious, r = null;
		if (n) {
			if (e.hasProgramDateTime && (this.log(`Live playlist, switching playlist, load frag with same PDT: ${n.programDateTime}`), r = findFragmentByPDT(t, n.endProgramDateTime, this.config.maxFragLookUpTolerance)), !r) {
				let i = n.sn + 1;
				if (i >= e.startSN && i <= e.endSN) {
					let a = t[i - e.startSN];
					n.cc === a.cc && (r = a, this.log(`Live playlist, switching playlist, load frag with next SN: ${r.sn}`));
				}
				r || (r = findFragWithCC(t, n.cc), r && this.log(`Live playlist, switching playlist, load frag with same CC: ${r.sn}`));
			}
		} else {
			let t = this.hls.liveSyncPosition;
			t !== null && (r = this.getFragmentAtPosition(t, this.bitrateTest ? e.fragmentEnd : e.edge, e));
		}
		return r;
	}
	getFragmentAtPosition(e, t, n) {
		let { config: r } = this, { fragPrevious: i } = this, { fragments: a, endSN: o } = n, { fragmentHint: s } = n, { maxFragLookUpTolerance: c } = r, l = n.partList, u = !!(r.lowLatencyMode && l != null && l.length && s);
		u && s && !this.bitrateTest && (a = a.concat(s), o = s.sn);
		let d;
		if (e < t) {
			let n = e > t - c ? 0 : c;
			d = findFragmentByPTS(i, a, e, n);
		} else d = a[a.length - 1];
		if (d) {
			let e = d.sn - n.startSN, t = this.fragmentTracker.getState(d);
			if ((t === V.OK || t === V.PARTIAL && d.gap) && (i = d), i && d.sn === i.sn && (!u || l[0].fragment.sn > d.sn) && i && d.level === i.level) {
				let t = a[e + 1];
				d = d.sn < o && this.fragmentTracker.getState(t) !== V.OK ? t : null;
			}
		}
		return d;
	}
	synchronizeToLiveEdge(e) {
		let { config: t, media: n } = this;
		if (!n) return;
		let r = this.hls.liveSyncPosition, i = n.currentTime, a = e.fragments[0].start, o = e.edge, s = i >= a - t.maxFragLookUpTolerance && i <= o;
		if (r !== null && n.duration > r && (i < r || !s)) {
			let a = t.liveMaxLatencyDuration === void 0 ? t.liveMaxLatencyDurationCount * e.targetduration : t.liveMaxLatencyDuration;
			(!s && n.readyState < 4 || i < o - a) && (this.loadedmetadata || (this.nextLoadPosition = r), n.readyState && (this.warn(`Playback: ${i.toFixed(3)} is located too far from the end of live sliding playlist: ${o}, reset currentTime to : ${r.toFixed(3)}`), n.currentTime = r));
		}
	}
	alignPlaylists(e, t, r) {
		let i = e.fragments.length;
		if (!i) return this.warn("No fragments in live playlist"), 0;
		let a = e.fragments[0].start, o = !t, s = e.alignedSliding && n(a);
		if (o || !s && !a) {
			let { fragPrevious: n } = this;
			alignStream(n, r, e);
			let a = e.fragments[0].start;
			return this.log(`Live playlist sliding: ${a.toFixed(2)} start-sn: ${t ? t.startSN : "na"}->${e.startSN} prev-sn: ${n ? n.sn : "na"} fragments: ${i}`), a;
		}
		return a;
	}
	waitForCdnTuneIn(e) {
		return e.live && e.canBlockReload && e.partTarget && e.tuneInGoal > Math.max(e.partHoldBack, e.partTarget * 3);
	}
	setStartPosition(e, t) {
		let r = this.startPosition;
		if (r < t && (r = -1), r === -1 || this.lastCurrentTime === -1) {
			let i = this.startTimeOffset !== null, a = i ? this.startTimeOffset : e.startTimeOffset;
			a !== null && n(a) ? (r = t + a, a < 0 && (r += e.totalduration), r = Math.min(Math.max(t, r), t + e.totalduration), this.log(`Start time offset ${a} found in ${i ? "multivariant" : "media"} playlist, adjust startPosition to ${r}`), this.startPosition = r) : e.live ? r = this.hls.liveSyncPosition || t : this.startPosition = r = 0, this.lastCurrentTime = r;
		}
		this.nextLoadPosition = r;
	}
	getLoadPosition() {
		let { media: e } = this, t = 0;
		return this.loadedmetadata && e ? t = e.currentTime : this.nextLoadPosition && (t = this.nextLoadPosition), t;
	}
	handleFragLoadAborted(e, t) {
		this.transmuxer && e.sn !== "initSegment" && e.stats.aborted && (this.warn(`Fragment ${e.sn}${t ? " part " + t.index : ""} of level ${e.level} was aborted`), this.resetFragmentLoading(e));
	}
	resetFragmentLoading(e) {
		(!this.fragCurrent || !this.fragContextChanged(e) && this.state !== U.FRAG_LOADING_WAITING_RETRY) && (this.state = U.IDLE);
	}
	onFragmentOrKeyLoadError(e, t) {
		if (t.chunkMeta && !t.frag) {
			let e = this.getCurrentContext(t.chunkMeta);
			e && (t.frag = e.frag);
		}
		let n = t.frag;
		if (!n || n.type !== e || !this.levels) return;
		if (this.fragContextChanged(n)) {
			this.warn(`Frag load error must match current frag to retry ${n.url} > ${this.fragCurrent?.url}`);
			return;
		}
		let r = t.details === s.FRAG_GAP;
		r && this.fragmentTracker.fragBuffered(n, !0);
		let i = t.errorAction, { action: a, retryCount: o = 0, retryConfig: c } = i || {};
		if (i && a === z.RetryRequest && c) {
			this.resetStartWhenNotLoaded(this.levelLastLoaded);
			let r = getRetryDelay(c, o);
			this.warn(`Fragment ${n.sn} of ${e} ${n.level} errored with ${t.details}, retrying loading ${o + 1}/${c.maxNumRetry} in ${r}ms`), i.resolved = !0, this.retryDate = self.performance.now() + r, this.state = U.FRAG_LOADING_WAITING_RETRY;
		} else if (c && i) {
			if (this.resetFragmentErrors(e), o < c.maxNumRetry) !r && a !== z.RemoveAlternatePermanently && (i.resolved = !0);
			else {
				d.warn(`${t.details} reached or exceeded max retry (${o})`);
				return;
			}
		} else this.state = i?.action === z.SendAlternateToPenaltyBox ? U.WAITING_LEVEL : U.ERROR;
		this.tickImmediate();
	}
	reduceLengthAndFlushBuffer(e) {
		if (this.state === U.PARSING || this.state === U.PARSED) {
			let t = e.frag, n = e.parent, r = this.getFwdBufferInfo(this.mediaBuffer, n), i = r && r.len > .5;
			i && this.reduceMaxBufferLength(r.len, t?.duration || 10);
			let a = !i;
			return a && this.warn(`Buffer full error while media.currentTime is not buffered, flush ${n} buffer`), t && (this.fragmentTracker.removeFragment(t), this.nextLoadPosition = t.start), this.resetLoadingState(), a;
		}
		return !1;
	}
	resetFragmentErrors(e) {
		e === I.AUDIO && (this.fragCurrent = null), this.loadedmetadata || (this.startFragRequested = !1), this.state !== U.STOPPED && (this.state = U.IDLE);
	}
	afterBufferFlushed(e, t, n) {
		if (!e) return;
		let r = H.getBuffered(e);
		this.fragmentTracker.detectEvictedFragments(t, r, n), this.state === U.ENDED && this.resetLoadingState();
	}
	resetLoadingState() {
		this.log("Reset loading state"), this.fragCurrent = null, this.fragPrevious = null, this.state = U.IDLE;
	}
	resetStartWhenNotLoaded(e) {
		if (!this.loadedmetadata) {
			this.startFragRequested = !1;
			let t = e ? e.details : null;
			t != null && t.live ? (this.startPosition = -1, this.setStartPosition(t, 0), this.resetLoadingState()) : this.nextLoadPosition = this.startPosition;
		}
	}
	resetWhenMissingContext(e) {
		this.warn(`The loading context changed while buffering fragment ${e.sn} of level ${e.level}. This chunk will not be buffered.`), this.removeUnbufferedFrags(), this.resetStartWhenNotLoaded(this.levelLastLoaded), this.resetLoadingState();
	}
	removeUnbufferedFrags(e = 0) {
		this.fragmentTracker.removeFragmentsInRange(e, Infinity, this.playlistType, !1, !0);
	}
	updateLevelTiming(e, t, n, r) {
		let i = n.details;
		if (!i) {
			this.warn("level.details undefined");
			return;
		}
		if (!Object.keys(e.elementaryStreams).reduce((t, o) => {
			let s = e.elementaryStreams[o];
			if (s) {
				let c = s.endPTS - s.startPTS;
				if (c <= 0) return this.warn(`Could not parse fragment ${e.sn} ${o} duration reliably (${c})`), t || !1;
				let l = r ? 0 : updateFragPTSDTS(i, e, s.startPTS, s.endPTS, s.startDTS, s.endDTS);
				return this.hls.trigger(a.LEVEL_PTS_UPDATED, {
					details: i,
					level: n,
					drift: l,
					type: o,
					frag: e,
					start: s.startPTS,
					end: s.endPTS
				}), !0;
			}
			return t;
		}, !1) && this.transmuxer?.error === null) {
			let t = /* @__PURE__ */ Error(`Found no media in fragment ${e.sn} of level ${e.level} resetting transmuxer to fallback to playlist timing`);
			if (n.fragmentError === 0 && (n.fragmentError++, e.gap = !0, this.fragmentTracker.removeFragment(e), this.fragmentTracker.fragBuffered(e, !0)), this.warn(t.message), this.hls.trigger(a.ERROR, {
				type: o.MEDIA_ERROR,
				details: s.FRAG_PARSING_ERROR,
				fatal: !1,
				error: t,
				frag: e,
				reason: `Found no media in msn ${e.sn} of level "${n.url}"`
			}), !this.hls) return;
			this.resetTransmuxer();
		}
		this.state = U.PARSED, this.hls.trigger(a.FRAG_PARSED, {
			frag: e,
			part: t
		});
	}
	resetTransmuxer() {
		this.transmuxer &&= (this.transmuxer.destroy(), null);
	}
	recoverWorkerError(e) {
		e.event === "demuxerWorker" && (this.fragmentTracker.removeAllFragments(), this.resetTransmuxer(), this.resetStartWhenNotLoaded(this.levelLastLoaded), this.resetLoadingState());
	}
	set state(e) {
		let t = this._state;
		t !== e && (this._state = e, this.log(`${t}->${e}`));
	}
	get state() {
		return this._state;
	}
}, ChunkCache = class {
	constructor() {
		this.chunks = [], this.dataLength = 0;
	}
	push(e) {
		this.chunks.push(e), this.dataLength += e.length;
	}
	flush() {
		let { chunks: e, dataLength: t } = this, n;
		if (e.length) n = e.length === 1 ? e[0] : concatUint8Arrays(e, t);
		else return /* @__PURE__ */ new Uint8Array();
		return this.reset(), n;
	}
	reset() {
		this.chunks.length = 0, this.dataLength = 0;
	}
};
function concatUint8Arrays(e, t) {
	let n = new Uint8Array(t), r = 0;
	for (let t = 0; t < e.length; t++) {
		let i = e[t];
		n.set(i, r), r += i.length;
	}
	return n;
}
function hasUMDWorker() {
	return typeof __HLS_WORKER_BUNDLE__ == "function";
}
function injectWorker() {
	let e = new self.Blob([`var exports={};var module={exports:exports};function define(f){f()};define.amd=true;(${__HLS_WORKER_BUNDLE__.toString()})(true);`], { type: "text/javascript" }), t = self.URL.createObjectURL(e);
	return {
		worker: new self.Worker(t),
		objectURL: t
	};
}
function loadWorker(e) {
	let t = new self.URL(e, self.location.href).href;
	return {
		worker: new self.Worker(t),
		scriptURL: t
	};
}
function dummyTrack(e = "", t = 9e4) {
	return {
		type: e,
		id: -1,
		pid: -1,
		inputTimeScale: t,
		sequenceNumber: -1,
		samples: [],
		dropped: 0
	};
}
var BaseAudioDemuxer = class {
	constructor() {
		this._audioTrack = void 0, this._id3Track = void 0, this.frameIndex = 0, this.cachedData = null, this.basePTS = null, this.initPTS = null, this.lastPTS = null;
	}
	resetInitSegment(e, t, n, r) {
		this._id3Track = {
			type: "id3",
			id: 3,
			pid: -1,
			inputTimeScale: 9e4,
			sequenceNumber: 0,
			samples: [],
			dropped: 0
		};
	}
	resetTimeStamp(e) {
		this.initPTS = e, this.resetContiguity();
	}
	resetContiguity() {
		this.basePTS = null, this.lastPTS = null, this.frameIndex = 0;
	}
	canParse(e, t) {
		return !1;
	}
	appendFrame(e, t, n) {}
	demux(e, t) {
		this.cachedData &&= (e = appendUint8Array(this.cachedData, e), null);
		let r = getID3Data(e, 0), i = r ? r.length : 0, a, o = this._audioTrack, s = this._id3Track, c = r ? getTimeStamp(r) : void 0, l = e.length;
		for ((this.basePTS === null || this.frameIndex === 0 && n(c)) && (this.basePTS = initPTSFn(c, t, this.initPTS), this.lastPTS = this.basePTS), this.lastPTS === null && (this.lastPTS = this.basePTS), r && r.length > 0 && s.samples.push({
			pts: this.lastPTS,
			dts: this.lastPTS,
			data: r,
			type: L.audioId3,
			duration: Infinity
		}); i < l;) {
			if (this.canParse(e, i)) {
				let t = this.appendFrame(o, e, i);
				t ? (this.frameIndex++, this.lastPTS = t.sample.pts, i += t.length, a = i) : i = l;
			} else canParse$2(e, i) ? (r = getID3Data(e, i), s.samples.push({
				pts: this.lastPTS,
				dts: this.lastPTS,
				data: r,
				type: L.audioId3,
				duration: Infinity
			}), i += r.length, a = i) : i++;
			if (i === l && a !== l) {
				let t = sliceUint8(e, a);
				this.cachedData = this.cachedData ? appendUint8Array(this.cachedData, t) : t;
			}
		}
		return {
			audioTrack: o,
			videoTrack: dummyTrack(),
			id3Track: s,
			textTrack: dummyTrack()
		};
	}
	demuxSampleAes(e, t, n) {
		return Promise.reject(/* @__PURE__ */ Error(`[${this}] This demuxer does not support Sample-AES decryption`));
	}
	flush(e) {
		let t = this.cachedData;
		return t && (this.cachedData = null, this.demux(t, 0)), {
			audioTrack: this._audioTrack,
			videoTrack: dummyTrack(),
			id3Track: this._id3Track,
			textTrack: dummyTrack()
		};
	}
	destroy() {}
}, initPTSFn = (e, t, r) => {
	if (n(e)) return e * 90;
	let i = r ? r.baseTime * 9e4 / r.timescale : 0;
	return t * 9e4 + i;
};
function getAudioConfig(e, t, n, r) {
	let i, c, l, u, f = navigator.userAgent.toLowerCase(), p = r, m = [
		96e3,
		88200,
		64e3,
		48e3,
		44100,
		32e3,
		24e3,
		22050,
		16e3,
		12e3,
		11025,
		8e3,
		7350
	];
	i = ((t[n + 2] & 192) >>> 6) + 1;
	let h = (t[n + 2] & 60) >>> 2;
	if (h > m.length - 1) {
		let t = /* @__PURE__ */ Error(`invalid ADTS sampling index:${h}`);
		e.emit(a.ERROR, a.ERROR, {
			type: o.MEDIA_ERROR,
			details: s.FRAG_PARSING_ERROR,
			fatal: !0,
			error: t,
			reason: t.message
		});
		return;
	}
	return l = (t[n + 2] & 1) << 2, l |= (t[n + 3] & 192) >>> 6, d.log(`manifest codec:${r}, ADTS type:${i}, samplingIndex:${h}`), /firefox/i.test(f) ? h >= 6 ? (i = 5, u = [
		,
		,
		,
		,
	], c = h - 3) : (i = 2, u = [, ,], c = h) : f.indexOf("android") === -1 ? (i = 5, u = [
		,
		,
		,
		,
	], r && (r.indexOf("mp4a.40.29") !== -1 || r.indexOf("mp4a.40.5") !== -1) || !r && h >= 6 ? c = h - 3 : ((r && r.indexOf("mp4a.40.2") !== -1 && (h >= 6 && l === 1 || /vivaldi/i.test(f)) || !r && l === 1) && (i = 2, u = [, ,]), c = h)) : (i = 2, u = [, ,], c = h), u[0] = i << 3, u[0] |= (h & 14) >> 1, u[1] |= (h & 1) << 7, u[1] |= l << 3, i === 5 && (u[1] |= (c & 14) >> 1, u[2] = (c & 1) << 7, u[2] |= 8, u[3] = 0), {
		config: u,
		samplerate: m[h],
		channelCount: l,
		codec: "mp4a.40." + i,
		manifestCodec: p
	};
}
function isHeaderPattern$1(e, t) {
	return e[t] === 255 && (e[t + 1] & 246) == 240;
}
function getHeaderLength(e, t) {
	return e[t + 1] & 1 ? 7 : 9;
}
function getFullFrameLength(e, t) {
	return (e[t + 3] & 3) << 11 | e[t + 4] << 3 | (e[t + 5] & 224) >>> 5;
}
function canGetFrameLength(e, t) {
	return t + 5 < e.length;
}
function isHeader$1(e, t) {
	return t + 1 < e.length && isHeaderPattern$1(e, t);
}
function canParse$1(e, t) {
	return canGetFrameLength(e, t) && isHeaderPattern$1(e, t) && getFullFrameLength(e, t) <= e.length - t;
}
function probe$1(e, t) {
	if (isHeader$1(e, t)) {
		let n = getHeaderLength(e, t);
		if (t + n >= e.length) return !1;
		let r = getFullFrameLength(e, t);
		if (r <= n) return !1;
		let i = t + r;
		return i === e.length || isHeader$1(e, i);
	}
	return !1;
}
function initTrackConfig(e, t, n, r, i) {
	if (!e.samplerate) {
		let a = getAudioConfig(t, n, r, i);
		if (!a) return;
		e.config = a.config, e.samplerate = a.samplerate, e.channelCount = a.channelCount, e.codec = a.codec, e.manifestCodec = a.manifestCodec, d.log(`parsed codec:${e.codec}, rate:${a.samplerate}, channels:${a.channelCount}`);
	}
}
function getFrameDuration(e) {
	return 9216e4 / e;
}
function parseFrameHeader(e, t) {
	let n = getHeaderLength(e, t);
	if (t + n <= e.length) {
		let r = getFullFrameLength(e, t) - n;
		if (r > 0) return {
			headerLength: n,
			frameLength: r
		};
	}
}
function appendFrame$2(e, t, n, r, i) {
	let a = r + i * getFrameDuration(e.samplerate), o = parseFrameHeader(t, n), s;
	if (o) {
		let { frameLength: r, headerLength: i } = o, c = i + r, l = Math.max(0, n + c - t.length);
		l ? (s = new Uint8Array(c - i), s.set(t.subarray(n + i, t.length), 0)) : s = t.subarray(n + i, n + c);
		let u = {
			unit: s,
			pts: a
		};
		return l || e.samples.push(u), {
			sample: u,
			length: c,
			missing: l
		};
	}
	let c = t.length - n;
	return s = new Uint8Array(c), s.set(t.subarray(n, t.length), 0), {
		sample: {
			unit: s,
			pts: a
		},
		length: c,
		missing: -1
	};
}
var he = null, ge = [
	32,
	64,
	96,
	128,
	160,
	192,
	224,
	256,
	288,
	320,
	352,
	384,
	416,
	448,
	32,
	48,
	56,
	64,
	80,
	96,
	112,
	128,
	160,
	192,
	224,
	256,
	320,
	384,
	32,
	40,
	48,
	56,
	64,
	80,
	96,
	112,
	128,
	160,
	192,
	224,
	256,
	320,
	32,
	48,
	56,
	64,
	80,
	96,
	112,
	128,
	144,
	160,
	176,
	192,
	224,
	256,
	8,
	16,
	24,
	32,
	40,
	48,
	56,
	64,
	80,
	96,
	112,
	128,
	144,
	160
], _e = [
	44100,
	48e3,
	32e3,
	22050,
	24e3,
	16e3,
	11025,
	12e3,
	8e3
], ve = [
	[
		0,
		72,
		144,
		12
	],
	[
		0,
		0,
		0,
		0
	],
	[
		0,
		72,
		144,
		12
	],
	[
		0,
		144,
		144,
		12
	]
], ye = [
	0,
	1,
	1,
	4
];
function appendFrame$1(e, t, n, r, i) {
	if (n + 24 > t.length) return;
	let a = parseHeader(t, n);
	if (a && n + a.frameLength <= t.length) {
		let o = r + i * (a.samplesPerFrame * 9e4 / a.sampleRate), s = {
			unit: t.subarray(n, n + a.frameLength),
			pts: o,
			dts: o
		};
		return e.config = [], e.channelCount = a.channelCount, e.samplerate = a.sampleRate, e.samples.push(s), {
			sample: s,
			length: a.frameLength,
			missing: 0
		};
	}
}
function parseHeader(e, t) {
	let n = e[t + 1] >> 3 & 3, r = e[t + 1] >> 1 & 3, i = e[t + 2] >> 4 & 15, a = e[t + 2] >> 2 & 3;
	if (n !== 1 && i !== 0 && i !== 15 && a !== 3) {
		let o = e[t + 2] >> 1 & 1, s = e[t + 3] >> 6, c = ge[(n === 3 ? 3 - r : r === 3 ? 3 : 4) * 14 + i - 1] * 1e3, l = _e[(n === 3 ? 0 : n === 2 ? 1 : 2) * 3 + a], u = s === 3 ? 1 : 2, d = ve[n][r], f = ye[r], p = d * 8 * f, m = Math.floor(d * c / l + o) * f;
		if (he === null) {
			let e = (navigator.userAgent || "").match(/Chrome\/(\d+)/i);
			he = e ? parseInt(e[1]) : 0;
		}
		return he && he <= 87 && r === 2 && c >= 224e3 && s === 0 && (e[t + 3] = e[t + 3] | 128), {
			sampleRate: l,
			channelCount: u,
			frameLength: m,
			samplesPerFrame: p
		};
	}
}
function isHeaderPattern(e, t) {
	return e[t] === 255 && (e[t + 1] & 224) == 224 && !!(e[t + 1] & 6);
}
function isHeader(e, t) {
	return t + 1 < e.length && isHeaderPattern(e, t);
}
function canParse(e, t) {
	return isHeaderPattern(e, t) && 4 <= e.length - t;
}
function probe(e, t) {
	if (t + 1 < e.length && isHeaderPattern(e, t)) {
		let n = parseHeader(e, t), r = 4;
		n != null && n.frameLength && (r = n.frameLength);
		let i = t + r;
		return i === e.length || isHeader(e, i);
	}
	return !1;
}
var AACDemuxer = class extends BaseAudioDemuxer {
	constructor(e, t) {
		super(), this.observer = void 0, this.config = void 0, this.observer = e, this.config = t;
	}
	resetInitSegment(e, t, n, r) {
		super.resetInitSegment(e, t, n, r), this._audioTrack = {
			container: "audio/adts",
			type: "audio",
			id: 2,
			pid: -1,
			sequenceNumber: 0,
			segmentCodec: "aac",
			samples: [],
			manifestCodec: t,
			duration: r,
			inputTimeScale: 9e4,
			dropped: 0
		};
	}
	static probe(e) {
		if (!e) return !1;
		let t = getID3Data(e, 0)?.length || 0;
		if (probe(e, t)) return !1;
		for (let n = e.length; t < n; t++) if (probe$1(e, t)) return d.log("ADTS sync word found !"), !0;
		return !1;
	}
	canParse(e, t) {
		return canParse$1(e, t);
	}
	appendFrame(e, t, n) {
		initTrackConfig(e, this.observer, t, n, e.manifestCodec);
		let r = appendFrame$2(e, t, n, this.basePTS, this.frameIndex);
		if (r && r.missing === 0) return r;
	}
}, be = /\/emsg[-/]ID3/i, MP4Demuxer = class {
	constructor(e, t) {
		this.remainderData = null, this.timeOffset = 0, this.config = void 0, this.videoTrack = void 0, this.audioTrack = void 0, this.id3Track = void 0, this.txtTrack = void 0, this.config = t;
	}
	resetTimeStamp() {}
	resetInitSegment(e, t, n, r) {
		let i = this.videoTrack = dummyTrack("video", 1), a = this.audioTrack = dummyTrack("audio", 1), o = this.txtTrack = dummyTrack("text", 1);
		if (this.id3Track = dummyTrack("id3", 1), this.timeOffset = 0, !(e != null && e.byteLength)) return;
		let s = parseInitSegment(e);
		if (s.video) {
			let { id: e, timescale: t, codec: n } = s.video;
			i.id = e, i.timescale = o.timescale = t, i.codec = n;
		}
		if (s.audio) {
			let { id: e, timescale: t, codec: n } = s.audio;
			a.id = e, a.timescale = t, a.codec = n;
		}
		o.id = E.text, i.sampleDuration = 0, i.duration = a.duration = r;
	}
	resetContiguity() {
		this.remainderData = null;
	}
	static probe(e) {
		return hasMoofData(e);
	}
	demux(e, t) {
		this.timeOffset = t;
		let n = e, r = this.videoTrack, i = this.txtTrack;
		if (this.config.progressive) {
			this.remainderData && (n = appendUint8Array(this.remainderData, e));
			let t = segmentValidRange(n);
			this.remainderData = t.remainder, r.samples = t.valid || /* @__PURE__ */ new Uint8Array();
		} else r.samples = n;
		let a = this.extractID3Track(r, t);
		return i.samples = parseSamples(t, r), {
			videoTrack: r,
			audioTrack: this.audioTrack,
			id3Track: a,
			textTrack: this.txtTrack
		};
	}
	flush() {
		let e = this.timeOffset, t = this.videoTrack, n = this.txtTrack;
		t.samples = this.remainderData || /* @__PURE__ */ new Uint8Array(), this.remainderData = null;
		let r = this.extractID3Track(t, this.timeOffset);
		return n.samples = parseSamples(e, t), {
			videoTrack: t,
			audioTrack: dummyTrack(),
			id3Track: r,
			textTrack: dummyTrack()
		};
	}
	extractID3Track(e, t) {
		let r = this.id3Track;
		if (e.samples.length) {
			let i = findBox(e.samples, ["emsg"]);
			i && i.forEach((e) => {
				let i = parseEmsg(e);
				if (be.test(i.schemeIdUri)) {
					let e = n(i.presentationTime) ? i.presentationTime / i.timeScale : t + i.presentationTimeDelta / i.timeScale, a = i.eventDuration === 4294967295 ? Infinity : i.eventDuration / i.timeScale;
					a <= .001 && (a = Infinity);
					let o = i.payload;
					r.samples.push({
						data: o,
						len: o.byteLength,
						dts: e,
						pts: e,
						type: L.emsg,
						duration: a
					});
				}
			});
		}
		return r;
	}
	demuxSampleAes(e, t, n) {
		return Promise.reject(/* @__PURE__ */ Error("The MP4 demuxer does not support SAMPLE-AES decryption"));
	}
	destroy() {}
}, getAudioBSID = (e, t) => {
	let n = 0, r = 5;
	t += r;
	let i = /* @__PURE__ */ new Uint32Array(1), a = /* @__PURE__ */ new Uint32Array(1), o = /* @__PURE__ */ new Uint8Array(1);
	for (; r > 0;) {
		o[0] = e[t];
		let s = Math.min(r, 8), c = 8 - s;
		a[0] = 4278190080 >>> 24 + c << c, i[0] = (o[0] & a[0]) >> c, n = n ? n << s | i[0] : i[0], t += 1, r -= s;
	}
	return n;
}, AC3Demuxer = class extends BaseAudioDemuxer {
	constructor(e) {
		super(), this.observer = void 0, this.observer = e;
	}
	resetInitSegment(e, t, n, r) {
		super.resetInitSegment(e, t, n, r), this._audioTrack = {
			container: "audio/ac-3",
			type: "audio",
			id: 2,
			pid: -1,
			sequenceNumber: 0,
			segmentCodec: "ac3",
			samples: [],
			manifestCodec: t,
			duration: r,
			inputTimeScale: 9e4,
			dropped: 0
		};
	}
	canParse(e, t) {
		return t + 64 < e.length;
	}
	appendFrame(e, t, n) {
		let r = appendFrame(e, t, n, this.basePTS, this.frameIndex);
		if (r !== -1) return {
			sample: e.samples[e.samples.length - 1],
			length: r,
			missing: 0
		};
	}
	static probe(e) {
		if (!e) return !1;
		let t = getID3Data(e, 0);
		if (!t) return !1;
		let n = t.length;
		return e[n] === 11 && e[n + 1] === 119 && getTimeStamp(t) !== void 0 && getAudioBSID(e, n) < 16;
	}
};
function appendFrame(e, t, n, r, i) {
	if (n + 8 > t.length || t[n] !== 11 || t[n + 1] !== 119) return -1;
	let a = t[n + 4] >> 6;
	if (a >= 3) return -1;
	let o = [
		48e3,
		44100,
		32e3
	][a], s = t[n + 4] & 63, c = [
		64,
		69,
		96,
		64,
		70,
		96,
		80,
		87,
		120,
		80,
		88,
		120,
		96,
		104,
		144,
		96,
		105,
		144,
		112,
		121,
		168,
		112,
		122,
		168,
		128,
		139,
		192,
		128,
		140,
		192,
		160,
		174,
		240,
		160,
		175,
		240,
		192,
		208,
		288,
		192,
		209,
		288,
		224,
		243,
		336,
		224,
		244,
		336,
		256,
		278,
		384,
		256,
		279,
		384,
		320,
		348,
		480,
		320,
		349,
		480,
		384,
		417,
		576,
		384,
		418,
		576,
		448,
		487,
		672,
		448,
		488,
		672,
		512,
		557,
		768,
		512,
		558,
		768,
		640,
		696,
		960,
		640,
		697,
		960,
		768,
		835,
		1152,
		768,
		836,
		1152,
		896,
		975,
		1344,
		896,
		976,
		1344,
		1024,
		1114,
		1536,
		1024,
		1115,
		1536,
		1152,
		1253,
		1728,
		1152,
		1254,
		1728,
		1280,
		1393,
		1920,
		1280,
		1394,
		1920
	][s * 3 + a] * 2;
	if (n + c > t.length) return -1;
	let l = t[n + 6] >> 5, u = 0;
	l === 2 ? u += 2 : (l & 1 && l !== 1 && (u += 2), l & 4 && (u += 2));
	let d = (t[n + 6] << 8 | t[n + 7]) >> 12 - u & 1, f = [
		2,
		1,
		2,
		3,
		3,
		4,
		4,
		5
	][l] + d, p = t[n + 5] >> 3, m = t[n + 5] & 7, h = new Uint8Array([
		a << 6 | p << 1 | m >> 2,
		(m & 3) << 6 | l << 3 | d << 2 | s >> 4,
		s << 4 & 224
	]), g = r + i * (1536 / o * 9e4), _ = t.subarray(n, n + c);
	return e.config = h, e.channelCount = f, e.samplerate = o, e.samples.push({
		unit: _,
		pts: g
	}), c;
}
var BaseVideoParser = class {
	constructor() {
		this.VideoSample = null;
	}
	createVideoSample(e, t, n, r) {
		return {
			key: e,
			frame: !1,
			pts: t,
			dts: n,
			units: [],
			debug: r,
			length: 0
		};
	}
	getLastNalUnit(e) {
		var t;
		let n = this.VideoSample, r;
		if ((!n || n.units.length === 0) && (n = e[e.length - 1]), (t = n) != null && t.units) {
			let e = n.units;
			r = e[e.length - 1];
		}
		return r;
	}
	pushAccessUnit(e, t) {
		if (e.units.length && e.frame) {
			if (e.pts === void 0) {
				let n = t.samples, r = n.length;
				if (r) {
					let t = n[r - 1];
					e.pts = t.pts, e.dts = t.dts;
				} else {
					t.dropped++;
					return;
				}
			}
			t.samples.push(e);
		}
		e.debug.length && d.log(e.pts + "/" + e.dts + ":" + e.debug);
	}
}, ExpGolomb = class {
	constructor(e) {
		this.data = void 0, this.bytesAvailable = void 0, this.word = void 0, this.bitsAvailable = void 0, this.data = e, this.bytesAvailable = e.byteLength, this.word = 0, this.bitsAvailable = 0;
	}
	loadWord() {
		let e = this.data, t = this.bytesAvailable, n = e.byteLength - t, r = /* @__PURE__ */ new Uint8Array(4), i = Math.min(4, t);
		if (i === 0) throw Error("no bytes available");
		r.set(e.subarray(n, n + i)), this.word = new DataView(r.buffer).getUint32(0), this.bitsAvailable = i * 8, this.bytesAvailable -= i;
	}
	skipBits(e) {
		let t;
		e = Math.min(e, this.bytesAvailable * 8 + this.bitsAvailable), this.bitsAvailable > e ? (this.word <<= e, this.bitsAvailable -= e) : (e -= this.bitsAvailable, t = e >> 3, e -= t << 3, this.bytesAvailable -= t, this.loadWord(), this.word <<= e, this.bitsAvailable -= e);
	}
	readBits(e) {
		let t = Math.min(this.bitsAvailable, e), n = this.word >>> 32 - t;
		if (e > 32 && d.error("Cannot read more than 32 bits at a time"), this.bitsAvailable -= t, this.bitsAvailable > 0) this.word <<= t;
		else if (this.bytesAvailable > 0) this.loadWord();
		else throw Error("no bits available");
		return t = e - t, t > 0 && this.bitsAvailable ? n << t | this.readBits(t) : n;
	}
	skipLZ() {
		let e = 0;
		for (; e < this.bitsAvailable; ++e) if (this.word & 2147483648 >>> e) return this.word <<= e, this.bitsAvailable -= e, e;
		return this.loadWord(), e + this.skipLZ();
	}
	skipUEG() {
		this.skipBits(1 + this.skipLZ());
	}
	skipEG() {
		this.skipBits(1 + this.skipLZ());
	}
	readUEG() {
		let e = this.skipLZ();
		return this.readBits(e + 1) - 1;
	}
	readEG() {
		let e = this.readUEG();
		return 1 & e ? 1 + e >>> 1 : -1 * (e >>> 1);
	}
	readBoolean() {
		return this.readBits(1) === 1;
	}
	readUByte() {
		return this.readBits(8);
	}
	readUShort() {
		return this.readBits(16);
	}
	readUInt() {
		return this.readBits(32);
	}
	skipScalingList(e) {
		let t = 8, n = 8, r;
		for (let i = 0; i < e; i++) n !== 0 && (r = this.readEG(), n = (t + r + 256) % 256), t = n === 0 ? t : n;
	}
	readSPS() {
		let e = 0, t = 0, n = 0, r = 0, i, a, o, s = this.readUByte.bind(this), c = this.readBits.bind(this), l = this.readUEG.bind(this), u = this.readBoolean.bind(this), d = this.skipBits.bind(this), f = this.skipEG.bind(this), p = this.skipUEG.bind(this), m = this.skipScalingList.bind(this);
		s();
		let h = s();
		if (c(5), d(3), s(), p(), h === 100 || h === 110 || h === 122 || h === 244 || h === 44 || h === 83 || h === 86 || h === 118 || h === 128) {
			let e = l();
			if (e === 3 && d(1), p(), p(), d(1), u()) for (a = e === 3 ? 12 : 8, o = 0; o < a; o++) u() && m(o < 6 ? 16 : 64);
		}
		p();
		let g = l();
		if (g === 0) l();
		else if (g === 1) for (d(1), f(), f(), i = l(), o = 0; o < i; o++) f();
		p(), d(1);
		let _ = l(), v = l(), y = c(1);
		y === 0 && d(1), d(1), u() && (e = l(), t = l(), n = l(), r = l());
		let b = [1, 1];
		if (u() && u()) switch (s()) {
			case 1:
				b = [1, 1];
				break;
			case 2:
				b = [12, 11];
				break;
			case 3:
				b = [10, 11];
				break;
			case 4:
				b = [16, 11];
				break;
			case 5:
				b = [40, 33];
				break;
			case 6:
				b = [24, 11];
				break;
			case 7:
				b = [20, 11];
				break;
			case 8:
				b = [32, 11];
				break;
			case 9:
				b = [80, 33];
				break;
			case 10:
				b = [18, 11];
				break;
			case 11:
				b = [15, 11];
				break;
			case 12:
				b = [64, 33];
				break;
			case 13:
				b = [160, 99];
				break;
			case 14:
				b = [4, 3];
				break;
			case 15:
				b = [3, 2];
				break;
			case 16:
				b = [2, 1];
				break;
			case 255: b = [s() << 8 | s(), s() << 8 | s()];
		}
		return {
			width: Math.ceil((_ + 1) * 16 - e * 2 - t * 2),
			height: (2 - y) * (v + 1) * 16 - (y ? 2 : 4) * (n + r),
			pixelRatio: b
		};
	}
	readSliceType() {
		return this.readUByte(), this.readUEG(), this.readUEG();
	}
}, AvcVideoParser = class extends BaseVideoParser {
	parseAVCPES(e, t, n, r, i) {
		let a = this.parseAVCNALu(e, n.data), o = this.VideoSample, s, c = !1;
		n.data = null, o && a.length && !e.audFound && (this.pushAccessUnit(o, e), o = this.VideoSample = this.createVideoSample(!1, n.pts, n.dts, "")), a.forEach((r) => {
			var a;
			switch (r.type) {
				case 1: {
					let t = !1;
					s = !0;
					let i = r.data;
					if (c && i.length > 4) {
						let e = new ExpGolomb(i).readSliceType();
						(e === 2 || e === 4 || e === 7 || e === 9) && (t = !0);
					}
					if (t) {
						var l;
						(l = o) != null && l.frame && !o.key && (this.pushAccessUnit(o, e), o = this.VideoSample = null);
					}
					o ||= this.VideoSample = this.createVideoSample(!0, n.pts, n.dts, ""), o.frame = !0, o.key = t;
					break;
				}
				case 5:
					s = !0, (a = o) != null && a.frame && !o.key && (this.pushAccessUnit(o, e), o = this.VideoSample = null), o ||= this.VideoSample = this.createVideoSample(!0, n.pts, n.dts, ""), o.key = !0, o.frame = !0;
					break;
				case 6:
					s = !0, parseSEIMessageFromNALu(r.data, 1, n.pts, t.samples);
					break;
				case 7: {
					s = !0, c = !0;
					let t = r.data, n = new ExpGolomb(t).readSPS();
					if (!e.sps || e.width !== n.width || e.height !== n.height || e.pixelRatio?.[0] !== n.pixelRatio[0] || e.pixelRatio?.[1] !== n.pixelRatio[1]) {
						e.width = n.width, e.height = n.height, e.pixelRatio = n.pixelRatio, e.sps = [t], e.duration = i;
						let r = t.subarray(1, 4), a = "avc1.";
						for (let e = 0; e < 3; e++) {
							let t = r[e].toString(16);
							t.length < 2 && (t = "0" + t), a += t;
						}
						e.codec = a;
					}
					break;
				}
				case 8:
					s = !0, e.pps = [r.data];
					break;
				case 9:
					s = !0, e.audFound = !0, o && this.pushAccessUnit(o, e), o = this.VideoSample = this.createVideoSample(!1, n.pts, n.dts, "");
					break;
				case 12:
					s = !0;
					break;
				default: s = !1, o && (o.debug += "unknown NAL " + r.type + " ");
			}
			o && s && o.units.push(r);
		}), r && o && (this.pushAccessUnit(o, e), this.VideoSample = null);
	}
	parseAVCNALu(e, t) {
		let n = t.byteLength, r = e.naluState || 0, i = r, a = [], o = 0, s, c, l, u = -1, d = 0;
		for (r === -1 && (u = 0, d = t[0] & 31, r = 0, o = 1); o < n;) {
			if (s = t[o++], !r) {
				r = +!s;
				continue;
			}
			if (r === 1) {
				r = s ? 0 : 2;
				continue;
			}
			if (!s) r = 3;
			else if (s === 1) {
				if (c = o - r - 1, u >= 0) {
					let e = {
						data: t.subarray(u, c),
						type: d
					};
					a.push(e);
				} else {
					let n = this.getLastNalUnit(e.samples);
					n && (i && o <= 4 - i && n.state && (n.data = n.data.subarray(0, n.data.byteLength - i)), c > 0 && (n.data = appendUint8Array(n.data, t.subarray(0, c)), n.state = 0));
				}
				o < n ? (l = t[o] & 31, u = o, d = l, r = 0) : r = -1;
			} else r = 0;
		}
		if (u >= 0 && r >= 0) {
			let e = {
				data: t.subarray(u, n),
				type: d,
				state: r
			};
			a.push(e);
		}
		if (a.length === 0) {
			let n = this.getLastNalUnit(e.samples);
			n && (n.data = appendUint8Array(n.data, t));
		}
		return e.naluState = r, a;
	}
}, SampleAesDecrypter = class {
	constructor(e, t, n) {
		this.keyData = void 0, this.decrypter = void 0, this.keyData = n, this.decrypter = new Decrypter(t, { removePKCS7Padding: !1 });
	}
	decryptBuffer(e) {
		return this.decrypter.decrypt(e, this.keyData.key.buffer, this.keyData.iv.buffer);
	}
	decryptAacSample(e, t, n) {
		let r = e[t].unit;
		if (r.length <= 16) return;
		let i = r.subarray(16, r.length - r.length % 16), a = i.buffer.slice(i.byteOffset, i.byteOffset + i.length);
		this.decryptBuffer(a).then((i) => {
			let a = new Uint8Array(i);
			r.set(a, 16), this.decrypter.isSync() || this.decryptAacSamples(e, t + 1, n);
		});
	}
	decryptAacSamples(e, t, n) {
		for (;; t++) {
			if (t >= e.length) {
				n();
				return;
			}
			if (!(e[t].unit.length < 32) && (this.decryptAacSample(e, t, n), !this.decrypter.isSync())) return;
		}
	}
	getAvcEncryptedData(e) {
		let t = Math.floor((e.length - 48) / 160) * 16 + 16, n = new Int8Array(t), r = 0;
		for (let t = 32; t < e.length - 16; t += 160, r += 16) n.set(e.subarray(t, t + 16), r);
		return n;
	}
	getAvcDecryptedUnit(e, t) {
		let n = new Uint8Array(t), r = 0;
		for (let t = 32; t < e.length - 16; t += 160, r += 16) e.set(n.subarray(r, r + 16), t);
		return e;
	}
	decryptAvcSample(e, t, n, r, i) {
		let a = discardEPB(i.data), o = this.getAvcEncryptedData(a);
		this.decryptBuffer(o.buffer).then((o) => {
			i.data = this.getAvcDecryptedUnit(a, o), this.decrypter.isSync() || this.decryptAvcSamples(e, t, n + 1, r);
		});
	}
	decryptAvcSamples(e, t, n, r) {
		if (e instanceof Uint8Array) throw Error("Cannot decrypt samples of type Uint8Array");
		for (;; t++, n = 0) {
			if (t >= e.length) {
				r();
				return;
			}
			let i = e[t].units;
			for (; !(n >= i.length); n++) {
				let a = i[n];
				if (!(a.data.length <= 48 || a.type !== 1 && a.type !== 5) && (this.decryptAvcSample(e, t, n, r, a), !this.decrypter.isSync())) return;
			}
		}
	}
}, W = 188, xe = class TSDemuxer {
	constructor(e, t, n) {
		this.observer = void 0, this.config = void 0, this.typeSupported = void 0, this.sampleAes = null, this.pmtParsed = !1, this.audioCodec = void 0, this.videoCodec = void 0, this._duration = 0, this._pmtId = -1, this._videoTrack = void 0, this._audioTrack = void 0, this._id3Track = void 0, this._txtTrack = void 0, this.aacOverFlow = null, this.remainderData = null, this.videoParser = void 0, this.observer = e, this.config = t, this.typeSupported = n, this.videoParser = new AvcVideoParser();
	}
	static probe(e) {
		let t = TSDemuxer.syncOffset(e);
		return t > 0 && d.warn(`MPEG2-TS detected but first sync word found @ offset ${t}`), t !== -1;
	}
	static syncOffset(e) {
		let t = e.length, n = Math.min(940, t - W) + 1, r = 0;
		for (; r < n;) {
			let i = !1, a = -1, o = 0;
			for (let s = r; s < t; s += W) if (e[s] === 71 && (t - s === W || e[s + W] === 71)) {
				if (o++, a === -1 && (a = s, a !== 0 && (n = Math.min(a + 18612, e.length - W) + 1)), i ||= parsePID(e, s) === 0, i && o > 1 && (a === 0 && o > 2 || s + W > n)) return a;
			} else if (o) return -1;
			else break;
			r++;
		}
		return -1;
	}
	static createTrack(e, t) {
		return {
			container: e === "video" || e === "audio" ? "video/mp2t" : void 0,
			type: e,
			id: E[e],
			pid: -1,
			inputTimeScale: 9e4,
			sequenceNumber: 0,
			samples: [],
			dropped: 0,
			duration: e === "audio" ? t : void 0
		};
	}
	resetInitSegment(e, t, n, r) {
		this.pmtParsed = !1, this._pmtId = -1, this._videoTrack = TSDemuxer.createTrack("video"), this._audioTrack = TSDemuxer.createTrack("audio", r), this._id3Track = TSDemuxer.createTrack("id3"), this._txtTrack = TSDemuxer.createTrack("text"), this._audioTrack.segmentCodec = "aac", this.aacOverFlow = null, this.remainderData = null, this.audioCodec = t, this.videoCodec = n, this._duration = r;
	}
	resetTimeStamp() {}
	resetContiguity() {
		let { _audioTrack: e, _videoTrack: t, _id3Track: n } = this;
		e && (e.pesData = null), t && (t.pesData = null), n && (n.pesData = null), this.aacOverFlow = null, this.remainderData = null;
	}
	demux(e, t, n = !1, r = !1) {
		n || (this.sampleAes = null);
		let i, a = this._videoTrack, o = this._audioTrack, s = this._id3Track, c = this._txtTrack, l = a.pid, u = a.pesData, f = o.pid, p = s.pid, m = o.pesData, h = s.pesData, g = null, _ = this.pmtParsed, v = this._pmtId, y = e.length;
		if (this.remainderData &&= (e = appendUint8Array(this.remainderData, e), y = e.length, null), y < W && !r) return this.remainderData = e, {
			audioTrack: o,
			videoTrack: a,
			id3Track: s,
			textTrack: c
		};
		let b = Math.max(0, TSDemuxer.syncOffset(e));
		y -= (y - b) % W, y < e.byteLength && !r && (this.remainderData = new Uint8Array(e.buffer, y, e.buffer.byteLength - y));
		let x = 0;
		for (let t = b; t < y; t += W) if (e[t] === 71) {
			let r = !!(e[t + 1] & 64), y = parsePID(e, t), x = (e[t + 3] & 48) >> 4, S;
			if (x > 1) {
				if (S = t + 5 + e[t + 4], S === t + W) continue;
			} else S = t + 4;
			switch (y) {
				case l:
					r && (u && (i = parsePES(u)) && this.videoParser.parseAVCPES(a, c, i, !1, this._duration), u = {
						data: [],
						size: 0
					}), u && (u.data.push(e.subarray(S, t + W)), u.size += t + W - S);
					break;
				case f:
					if (r) {
						if (m && (i = parsePES(m))) switch (o.segmentCodec) {
							case "aac":
								this.parseAACPES(o, i);
								break;
							case "mp3":
								this.parseMPEGPES(o, i);
								break;
							case "ac3": this.parseAC3PES(o, i);
						}
						m = {
							data: [],
							size: 0
						};
					}
					m && (m.data.push(e.subarray(S, t + W)), m.size += t + W - S);
					break;
				case p:
					r && (h && (i = parsePES(h)) && this.parseID3PES(s, i), h = {
						data: [],
						size: 0
					}), h && (h.data.push(e.subarray(S, t + W)), h.size += t + W - S);
					break;
				case 0:
					r && (S += e[S] + 1), v = this._pmtId = parsePAT(e, S);
					break;
				case v: {
					r && (S += e[S] + 1);
					let i = parsePMT(e, S, this.typeSupported, n, this.observer);
					l = i.videoPid, l > 0 && (a.pid = l, a.segmentCodec = i.segmentVideoCodec), f = i.audioPid, f > 0 && (o.pid = f, o.segmentCodec = i.segmentAudioCodec), p = i.id3Pid, p > 0 && (s.pid = p), g !== null && !_ && (d.warn(`MPEG-TS PMT found at ${t} after unknown PID '${g}'. Backtracking to sync byte @${b} to parse all TS packets.`), g = null, t = b - 188), _ = this.pmtParsed = !0;
					break;
				}
				case 17:
				case 8191: break;
				default: g = y;
			}
		} else x++;
		x > 0 && emitParsingError(this.observer, /* @__PURE__ */ Error(`Found ${x} TS packet/s that do not start with 0x47`)), a.pesData = u, o.pesData = m, s.pesData = h;
		let S = {
			audioTrack: o,
			videoTrack: a,
			id3Track: s,
			textTrack: c
		};
		return r && this.extractRemainingSamples(S), S;
	}
	flush() {
		let { remainderData: e } = this;
		this.remainderData = null;
		let t;
		return t = e ? this.demux(e, -1, !1, !0) : {
			videoTrack: this._videoTrack,
			audioTrack: this._audioTrack,
			id3Track: this._id3Track,
			textTrack: this._txtTrack
		}, this.extractRemainingSamples(t), this.sampleAes ? this.decrypt(t, this.sampleAes) : t;
	}
	extractRemainingSamples(e) {
		let { audioTrack: t, videoTrack: n, id3Track: r, textTrack: i } = e, a = n.pesData, o = t.pesData, s = r.pesData, c;
		if (a && (c = parsePES(a)) ? (this.videoParser.parseAVCPES(n, i, c, !0, this._duration), n.pesData = null) : n.pesData = a, o && (c = parsePES(o))) {
			switch (t.segmentCodec) {
				case "aac":
					this.parseAACPES(t, c);
					break;
				case "mp3":
					this.parseMPEGPES(t, c);
					break;
				case "ac3": this.parseAC3PES(t, c);
			}
			t.pesData = null;
		} else o != null && o.size && d.log("last AAC PES packet truncated,might overlap between fragments"), t.pesData = o;
		s && (c = parsePES(s)) ? (this.parseID3PES(r, c), r.pesData = null) : r.pesData = s;
	}
	demuxSampleAes(e, t, n) {
		let r = this.demux(e, n, !0, !this.config.progressive), i = this.sampleAes = new SampleAesDecrypter(this.observer, this.config, t);
		return this.decrypt(r, i);
	}
	decrypt(e, t) {
		return new Promise((n) => {
			let { audioTrack: r, videoTrack: i } = e;
			r.samples && r.segmentCodec === "aac" ? t.decryptAacSamples(r.samples, 0, () => {
				i.samples ? t.decryptAvcSamples(i.samples, 0, 0, () => {
					n(e);
				}) : n(e);
			}) : i.samples && t.decryptAvcSamples(i.samples, 0, 0, () => {
				n(e);
			});
		});
	}
	destroy() {
		this._duration = 0;
	}
	parseAACPES(e, t) {
		let n = 0, r = this.aacOverFlow, i = t.data;
		if (r) {
			this.aacOverFlow = null;
			let t = r.missing, a = r.sample.unit.byteLength;
			if (t === -1) i = appendUint8Array(r.sample.unit, i);
			else {
				let o = a - t;
				r.sample.unit.set(i.subarray(0, t), o), e.samples.push(r.sample), n = r.missing;
			}
		}
		let a, o;
		for (a = n, o = i.length; a < o - 1 && !isHeader$1(i, a); a++);
		if (a !== n) {
			let e, t = a < o - 1;
			if (e = t ? `AAC PES did not start with ADTS header,offset:${a}` : "No ADTS header found in AAC PES", emitParsingError(this.observer, Error(e), t), !t) return;
		}
		initTrackConfig(e, this.observer, i, a, this.audioCodec);
		let s;
		if (t.pts !== void 0) s = t.pts;
		else if (r) {
			let t = getFrameDuration(e.samplerate);
			s = r.sample.pts + t;
		} else {
			d.warn("[tsdemuxer]: AAC PES unknown PTS");
			return;
		}
		let c = 0, l;
		for (; a < o;) {
			if (l = appendFrame$2(e, i, a, s, c), a += l.length, l.missing) {
				this.aacOverFlow = l;
				break;
			}
			for (c++; a < o - 1 && !isHeader$1(i, a); a++);
		}
	}
	parseMPEGPES(e, t) {
		let n = t.data, r = n.length, i = 0, a = 0, o = t.pts;
		if (o === void 0) {
			d.warn("[tsdemuxer]: MPEG PES unknown PTS");
			return;
		}
		for (; a < r;) if (isHeader(n, a)) {
			let t = appendFrame$1(e, n, a, o, i);
			if (t) a += t.length, i++;
			else break;
		} else a++;
	}
	parseAC3PES(e, t) {
		{
			let n = t.data, r = t.pts;
			if (r === void 0) {
				d.warn("[tsdemuxer]: AC3 PES unknown PTS");
				return;
			}
			let i = n.length, a = 0, o = 0, s;
			for (; o < i && (s = appendFrame(e, n, o, r, a++)) > 0;) o += s;
		}
	}
	parseID3PES(e, t) {
		if (t.pts === void 0) {
			d.warn("[tsdemuxer]: ID3 PES unknown PTS");
			return;
		}
		let n = _extends({}, t, {
			type: this._videoTrack ? L.emsg : L.audioId3,
			duration: Infinity
		});
		e.samples.push(n);
	}
};
function parsePID(e, t) {
	return ((e[t + 1] & 31) << 8) + e[t + 2];
}
function parsePAT(e, t) {
	return (e[t + 10] & 31) << 8 | e[t + 11];
}
function parsePMT(e, t, n, r, i) {
	let a = {
		audioPid: -1,
		videoPid: -1,
		id3Pid: -1,
		segmentVideoCodec: "avc",
		segmentAudioCodec: "aac"
	}, o = (e[t + 1] & 15) << 8 | e[t + 2], s = t + 3 + o - 4, c = (e[t + 10] & 15) << 8 | e[t + 11];
	for (t += 12 + c; t < s;) {
		let o = parsePID(e, t), s = (e[t + 3] & 15) << 8 | e[t + 4];
		switch (e[t]) {
			case 207: if (!r) {
				logEncryptedSamplesFoundInUnencryptedStream("ADTS AAC");
				break;
			}
			case 15:
				a.audioPid === -1 && (a.audioPid = o);
				break;
			case 21:
				a.id3Pid === -1 && (a.id3Pid = o);
				break;
			case 219: if (!r) {
				logEncryptedSamplesFoundInUnencryptedStream("H.264");
				break;
			}
			case 27:
				a.videoPid === -1 && (a.videoPid = o, a.segmentVideoCodec = "avc");
				break;
			case 3:
			case 4:
				!n.mpeg && !n.mp3 ? d.log("MPEG audio found, not supported in this browser") : a.audioPid === -1 && (a.audioPid = o, a.segmentAudioCodec = "mp3");
				break;
			case 193: if (!r) {
				logEncryptedSamplesFoundInUnencryptedStream("AC-3");
				break;
			}
			case 129:
				n.ac3 ? a.audioPid === -1 && (a.audioPid = o, a.segmentAudioCodec = "ac3") : d.log("AC-3 audio found, not supported in this browser");
				break;
			case 6:
				if (a.audioPid === -1 && s > 0) {
					let r = t + 5, i = s;
					for (; i > 2;) {
						e[r] === 106 && (n.ac3 === !0 ? (a.audioPid = o, a.segmentAudioCodec = "ac3") : d.log("AC-3 audio found, not supported in this browser for now"));
						let t = e[r + 1] + 2;
						r += t, i -= t;
					}
				}
				break;
			case 194:
			case 135: return emitParsingError(i, /* @__PURE__ */ Error("Unsupported EC-3 in M2TS found")), a;
			case 36: return emitParsingError(i, /* @__PURE__ */ Error("Unsupported HEVC in M2TS found")), a;
		}
		t += s + 5;
	}
	return a;
}
function emitParsingError(e, t, n) {
	d.warn(`parsing error: ${t.message}`), e.emit(a.ERROR, a.ERROR, {
		type: o.MEDIA_ERROR,
		details: s.FRAG_PARSING_ERROR,
		fatal: !1,
		levelRetry: n,
		error: t,
		reason: t.message
	});
}
function logEncryptedSamplesFoundInUnencryptedStream(e) {
	d.log(`${e} with AES-128-CBC encryption found in unencrypted stream`);
}
function parsePES(e) {
	let t = 0, n, r, i, a, o, s = e.data;
	if (!e || e.size === 0) return null;
	for (; s[0].length < 19 && s.length > 1;) s[0] = appendUint8Array(s[0], s[1]), s.splice(1, 1);
	if (n = s[0], (n[0] << 16) + (n[1] << 8) + n[2] === 1) {
		if (r = (n[4] << 8) + n[5], r && r > e.size - 6) return null;
		let c = n[7];
		c & 192 && (a = (n[9] & 14) * 536870912 + (n[10] & 255) * 4194304 + (n[11] & 254) * 16384 + (n[12] & 255) * 128 + (n[13] & 254) / 2, c & 64 ? (o = (n[14] & 14) * 536870912 + (n[15] & 255) * 4194304 + (n[16] & 254) * 16384 + (n[17] & 255) * 128 + (n[18] & 254) / 2, a - o > 54e5 && (d.warn(`${Math.round((a - o) / 9e4)}s delta between PTS and DTS, align them`), a = o)) : o = a), i = n[8];
		let l = i + 9;
		if (e.size <= l) return null;
		e.size -= l;
		let u = new Uint8Array(e.size);
		for (let e = 0, r = s.length; e < r; e++) {
			n = s[e];
			let r = n.byteLength;
			if (l) {
				if (l > r) {
					l -= r;
					continue;
				}
				n = n.subarray(l), r -= l, l = 0;
			}
			u.set(n, t), t += r;
		}
		return r && (r -= i + 3), {
			data: u,
			pts: a,
			dts: o,
			len: r
		};
	}
	return null;
}
var MP3Demuxer = class extends BaseAudioDemuxer {
	resetInitSegment(e, t, n, r) {
		super.resetInitSegment(e, t, n, r), this._audioTrack = {
			container: "audio/mpeg",
			type: "audio",
			id: 2,
			pid: -1,
			sequenceNumber: 0,
			segmentCodec: "mp3",
			samples: [],
			manifestCodec: t,
			duration: r,
			inputTimeScale: 9e4,
			dropped: 0
		};
	}
	static probe(e) {
		if (!e) return !1;
		let t = getID3Data(e, 0), n = t?.length || 0;
		if (t && e[n] === 11 && e[n + 1] === 119 && getTimeStamp(t) !== void 0 && getAudioBSID(e, n) <= 16) return !1;
		for (let t = e.length; n < t; n++) if (probe(e, n)) return d.log("MPEG Audio sync word found !"), !0;
		return !1;
	}
	canParse(e, t) {
		return canParse(e, t);
	}
	appendFrame(e, t, n) {
		if (this.basePTS !== null) return appendFrame$1(e, t, n, this.basePTS, this.frameIndex);
	}
}, AAC = class {
	static getSilentFrame(e, t) {
		switch (e) {
			case "mp4a.40.2":
				if (t === 1) return new Uint8Array([
					0,
					200,
					0,
					128,
					35,
					128
				]);
				if (t === 2) return new Uint8Array([
					33,
					0,
					73,
					144,
					2,
					25,
					0,
					35,
					128
				]);
				if (t === 3) return new Uint8Array([
					0,
					200,
					0,
					128,
					32,
					132,
					1,
					38,
					64,
					8,
					100,
					0,
					142
				]);
				if (t === 4) return new Uint8Array([
					0,
					200,
					0,
					128,
					32,
					132,
					1,
					38,
					64,
					8,
					100,
					0,
					128,
					44,
					128,
					8,
					2,
					56
				]);
				if (t === 5) return new Uint8Array([
					0,
					200,
					0,
					128,
					32,
					132,
					1,
					38,
					64,
					8,
					100,
					0,
					130,
					48,
					4,
					153,
					0,
					33,
					144,
					2,
					56
				]);
				if (t === 6) return new Uint8Array([
					0,
					200,
					0,
					128,
					32,
					132,
					1,
					38,
					64,
					8,
					100,
					0,
					130,
					48,
					4,
					153,
					0,
					33,
					144,
					2,
					0,
					178,
					0,
					32,
					8,
					224
				]);
				break;
			default:
				if (t === 1) return new Uint8Array([
					1,
					64,
					34,
					128,
					163,
					78,
					230,
					128,
					186,
					8,
					0,
					0,
					0,
					28,
					6,
					241,
					193,
					10,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					94
				]);
				if (t === 2 || t === 3) return new Uint8Array([
					1,
					64,
					34,
					128,
					163,
					94,
					230,
					128,
					186,
					8,
					0,
					0,
					0,
					0,
					149,
					0,
					6,
					241,
					161,
					10,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					90,
					94
				]);
		}
	}
}, G = 2 ** 32 - 1, K = class MP4 {
	static init() {
		MP4.types = {
			avc1: [],
			avcC: [],
			btrt: [],
			dinf: [],
			dref: [],
			esds: [],
			ftyp: [],
			hdlr: [],
			mdat: [],
			mdhd: [],
			mdia: [],
			mfhd: [],
			minf: [],
			moof: [],
			moov: [],
			mp4a: [],
			".mp3": [],
			dac3: [],
			"ac-3": [],
			mvex: [],
			mvhd: [],
			pasp: [],
			sdtp: [],
			stbl: [],
			stco: [],
			stsc: [],
			stsd: [],
			stsz: [],
			stts: [],
			tfdt: [],
			tfhd: [],
			traf: [],
			trak: [],
			trun: [],
			trex: [],
			tkhd: [],
			vmhd: [],
			smhd: []
		};
		let e;
		for (e in MP4.types) MP4.types.hasOwnProperty(e) && (MP4.types[e] = [
			e.charCodeAt(0),
			e.charCodeAt(1),
			e.charCodeAt(2),
			e.charCodeAt(3)
		]);
		let t = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			118,
			105,
			100,
			101,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			86,
			105,
			100,
			101,
			111,
			72,
			97,
			110,
			100,
			108,
			101,
			114,
			0
		]), n = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			115,
			111,
			117,
			110,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			83,
			111,
			117,
			110,
			100,
			72,
			97,
			110,
			100,
			108,
			101,
			114,
			0
		]);
		MP4.HDLR_TYPES = {
			video: t,
			audio: n
		};
		let r = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			12,
			117,
			114,
			108,
			32,
			0,
			0,
			0,
			1
		]), i = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]);
		MP4.STTS = MP4.STSC = MP4.STCO = i, MP4.STSZ = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]), MP4.VMHD = new Uint8Array([
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]), MP4.SMHD = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]), MP4.STSD = new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1
		]);
		let a = new Uint8Array([
			105,
			115,
			111,
			109
		]), o = new Uint8Array([
			97,
			118,
			99,
			49
		]), s = new Uint8Array([
			0,
			0,
			0,
			1
		]);
		MP4.FTYP = MP4.box(MP4.types.ftyp, a, s, a, o), MP4.DINF = MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, r));
	}
	static box(e, ...t) {
		let n = 8, r = t.length, i = r;
		for (; r--;) n += t[r].byteLength;
		let a = new Uint8Array(n);
		for (a[0] = n >> 24 & 255, a[1] = n >> 16 & 255, a[2] = n >> 8 & 255, a[3] = n & 255, a.set(e, 4), r = 0, n = 8; r < i; r++) a.set(t[r], n), n += t[r].byteLength;
		return a;
	}
	static hdlr(e) {
		return MP4.box(MP4.types.hdlr, MP4.HDLR_TYPES[e]);
	}
	static mdat(e) {
		return MP4.box(MP4.types.mdat, e);
	}
	static mdhd(e, t) {
		t *= e;
		let n = Math.floor(t / (G + 1)), r = Math.floor(t % (G + 1));
		return MP4.box(MP4.types.mdhd, new Uint8Array([
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			2,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			3,
			e >> 24 & 255,
			e >> 16 & 255,
			e >> 8 & 255,
			e & 255,
			n >> 24,
			n >> 16 & 255,
			n >> 8 & 255,
			n & 255,
			r >> 24,
			r >> 16 & 255,
			r >> 8 & 255,
			r & 255,
			85,
			196,
			0,
			0
		]));
	}
	static mdia(e) {
		return MP4.box(MP4.types.mdia, MP4.mdhd(e.timescale, e.duration), MP4.hdlr(e.type), MP4.minf(e));
	}
	static mfhd(e) {
		return MP4.box(MP4.types.mfhd, new Uint8Array([
			0,
			0,
			0,
			0,
			e >> 24,
			e >> 16 & 255,
			e >> 8 & 255,
			e & 255
		]));
	}
	static minf(e) {
		return e.type === "audio" ? MP4.box(MP4.types.minf, MP4.box(MP4.types.smhd, MP4.SMHD), MP4.DINF, MP4.stbl(e)) : MP4.box(MP4.types.minf, MP4.box(MP4.types.vmhd, MP4.VMHD), MP4.DINF, MP4.stbl(e));
	}
	static moof(e, t, n) {
		return MP4.box(MP4.types.moof, MP4.mfhd(e), MP4.traf(n, t));
	}
	static moov(e) {
		let t = e.length, n = [];
		for (; t--;) n[t] = MP4.trak(e[t]);
		return MP4.box.apply(null, [MP4.types.moov, MP4.mvhd(e[0].timescale, e[0].duration)].concat(n, MP4.mvex(e)));
	}
	static mvex(e) {
		let t = e.length, n = [];
		for (; t--;) n[t] = MP4.trex(e[t]);
		return MP4.box.apply(null, [MP4.types.mvex, ...n]);
	}
	static mvhd(e, t) {
		t *= e;
		let n = Math.floor(t / (G + 1)), r = Math.floor(t % (G + 1)), i = new Uint8Array([
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			2,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			3,
			e >> 24 & 255,
			e >> 16 & 255,
			e >> 8 & 255,
			e & 255,
			n >> 24,
			n >> 16 & 255,
			n >> 8 & 255,
			n & 255,
			r >> 24,
			r >> 16 & 255,
			r >> 8 & 255,
			r & 255,
			0,
			1,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			64,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			255,
			255,
			255,
			255
		]);
		return MP4.box(MP4.types.mvhd, i);
	}
	static sdtp(e) {
		let t = e.samples || [], n = new Uint8Array(4 + t.length), r, i;
		for (r = 0; r < t.length; r++) i = t[r].flags, n[r + 4] = i.dependsOn << 4 | i.isDependedOn << 2 | i.hasRedundancy;
		return MP4.box(MP4.types.sdtp, n);
	}
	static stbl(e) {
		return MP4.box(MP4.types.stbl, MP4.stsd(e), MP4.box(MP4.types.stts, MP4.STTS), MP4.box(MP4.types.stsc, MP4.STSC), MP4.box(MP4.types.stsz, MP4.STSZ), MP4.box(MP4.types.stco, MP4.STCO));
	}
	static avc1(e) {
		let t = [], n = [], r, i, a;
		for (r = 0; r < e.sps.length; r++) i = e.sps[r], a = i.byteLength, t.push(a >>> 8 & 255), t.push(a & 255), t = t.concat(Array.prototype.slice.call(i));
		for (r = 0; r < e.pps.length; r++) i = e.pps[r], a = i.byteLength, n.push(a >>> 8 & 255), n.push(a & 255), n = n.concat(Array.prototype.slice.call(i));
		let o = MP4.box(MP4.types.avcC, new Uint8Array([
			1,
			t[3],
			t[4],
			t[5],
			255,
			224 | e.sps.length
		].concat(t, [e.pps.length], n))), s = e.width, c = e.height, l = e.pixelRatio[0], u = e.pixelRatio[1];
		return MP4.box(MP4.types.avc1, new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			s >> 8 & 255,
			s & 255,
			c >> 8 & 255,
			c & 255,
			0,
			72,
			0,
			0,
			0,
			72,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			18,
			100,
			97,
			105,
			108,
			121,
			109,
			111,
			116,
			105,
			111,
			110,
			47,
			104,
			108,
			115,
			46,
			106,
			115,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			24,
			17,
			17
		]), o, MP4.box(MP4.types.btrt, new Uint8Array([
			0,
			28,
			156,
			128,
			0,
			45,
			198,
			192,
			0,
			45,
			198,
			192
		])), MP4.box(MP4.types.pasp, new Uint8Array([
			l >> 24,
			l >> 16 & 255,
			l >> 8 & 255,
			l & 255,
			u >> 24,
			u >> 16 & 255,
			u >> 8 & 255,
			u & 255
		])));
	}
	static esds(e) {
		let t = e.config.length;
		return new Uint8Array([
			0,
			0,
			0,
			0,
			3,
			23 + t,
			0,
			1,
			0,
			4,
			15 + t,
			64,
			21,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			5,
			t
		].concat(e.config, [
			6,
			1,
			2
		]));
	}
	static audioStsd(e) {
		let t = e.samplerate;
		return new Uint8Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			e.channelCount,
			0,
			16,
			0,
			0,
			0,
			0,
			t >> 8 & 255,
			t & 255,
			0,
			0
		]);
	}
	static mp4a(e) {
		return MP4.box(MP4.types.mp4a, MP4.audioStsd(e), MP4.box(MP4.types.esds, MP4.esds(e)));
	}
	static mp3(e) {
		return MP4.box(MP4.types[".mp3"], MP4.audioStsd(e));
	}
	static ac3(e) {
		return MP4.box(MP4.types["ac-3"], MP4.audioStsd(e), MP4.box(MP4.types.dac3, e.config));
	}
	static stsd(e) {
		return e.type === "audio" ? e.segmentCodec === "mp3" && e.codec === "mp3" ? MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp3(e)) : e.segmentCodec === "ac3" ? MP4.box(MP4.types.stsd, MP4.STSD, MP4.ac3(e)) : MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp4a(e)) : MP4.box(MP4.types.stsd, MP4.STSD, MP4.avc1(e));
	}
	static tkhd(e) {
		let t = e.id, n = e.duration * e.timescale, r = e.width, i = e.height, a = Math.floor(n / (G + 1)), o = Math.floor(n % (G + 1));
		return MP4.box(MP4.types.tkhd, new Uint8Array([
			1,
			0,
			0,
			7,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			2,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			3,
			t >> 24 & 255,
			t >> 16 & 255,
			t >> 8 & 255,
			t & 255,
			0,
			0,
			0,
			0,
			a >> 24,
			a >> 16 & 255,
			a >> 8 & 255,
			a & 255,
			o >> 24,
			o >> 16 & 255,
			o >> 8 & 255,
			o & 255,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			64,
			0,
			0,
			0,
			r >> 8 & 255,
			r & 255,
			0,
			0,
			i >> 8 & 255,
			i & 255,
			0,
			0
		]));
	}
	static traf(e, t) {
		let n = MP4.sdtp(e), r = e.id, i = Math.floor(t / (G + 1)), a = Math.floor(t % (G + 1));
		return MP4.box(MP4.types.traf, MP4.box(MP4.types.tfhd, new Uint8Array([
			0,
			0,
			0,
			0,
			r >> 24,
			r >> 16 & 255,
			r >> 8 & 255,
			r & 255
		])), MP4.box(MP4.types.tfdt, new Uint8Array([
			1,
			0,
			0,
			0,
			i >> 24,
			i >> 16 & 255,
			i >> 8 & 255,
			i & 255,
			a >> 24,
			a >> 16 & 255,
			a >> 8 & 255,
			a & 255
		])), MP4.trun(e, n.length + 16 + 20 + 8 + 16 + 8 + 8), n);
	}
	static trak(e) {
		return e.duration = e.duration || 4294967295, MP4.box(MP4.types.trak, MP4.tkhd(e), MP4.mdia(e));
	}
	static trex(e) {
		let t = e.id;
		return MP4.box(MP4.types.trex, new Uint8Array([
			0,
			0,
			0,
			0,
			t >> 24,
			t >> 16 & 255,
			t >> 8 & 255,
			t & 255,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			1
		]));
	}
	static trun(e, t) {
		let n = e.samples || [], r = n.length, i = 12 + 16 * r, a = new Uint8Array(i), o, s, c, l, u, d;
		for (t += 8 + i, a.set([
			+(e.type === "video"),
			0,
			15,
			1,
			r >>> 24 & 255,
			r >>> 16 & 255,
			r >>> 8 & 255,
			r & 255,
			t >>> 24 & 255,
			t >>> 16 & 255,
			t >>> 8 & 255,
			t & 255
		], 0), o = 0; o < r; o++) s = n[o], c = s.duration, l = s.size, u = s.flags, d = s.cts, a.set([
			c >>> 24 & 255,
			c >>> 16 & 255,
			c >>> 8 & 255,
			c & 255,
			l >>> 24 & 255,
			l >>> 16 & 255,
			l >>> 8 & 255,
			l & 255,
			u.isLeading << 2 | u.dependsOn,
			u.isDependedOn << 6 | u.hasRedundancy << 4 | u.paddingValue << 1 | u.isNonSync,
			u.degradPrio & 61440,
			u.degradPrio & 15,
			d >>> 24 & 255,
			d >>> 16 & 255,
			d >>> 8 & 255,
			d & 255
		], 12 + 16 * o);
		return MP4.box(MP4.types.trun, a);
	}
	static initSegment(e) {
		MP4.types || MP4.init();
		let t = MP4.moov(e);
		return appendUint8Array(MP4.FTYP, t);
	}
};
K.types = void 0, K.HDLR_TYPES = void 0, K.STTS = void 0, K.STSC = void 0, K.STCO = void 0, K.STSZ = void 0, K.VMHD = void 0, K.SMHD = void 0, K.STSD = void 0, K.FTYP = void 0, K.DINF = void 0;
var Se = 9e4;
function toTimescaleFromBase(e, t, n = 1, r = !1) {
	let i = e * t * n;
	return r ? Math.round(i) : i;
}
function toTimescaleFromScale(e, t, n = 1, r = !1) {
	return toTimescaleFromBase(e, t, 1 / n, r);
}
function toMsFromMpegTsClock(e, t = !1) {
	return toTimescaleFromBase(e, 1e3, 1 / Se, t);
}
function toMpegTsClockFromTimescale(e, t = 1) {
	return toTimescaleFromBase(e, Se, 1 / t);
}
var Ce = 1e4, we = 1024, Te = 1152, Ee = 1536, q = null, De = null, MP4Remuxer = class {
	constructor(e, t, n, r = "") {
		if (this.observer = void 0, this.config = void 0, this.typeSupported = void 0, this.ISGenerated = !1, this._initPTS = null, this._initDTS = null, this.nextAvcDts = null, this.nextAudioPts = null, this.videoSampleDuration = null, this.isAudioContiguous = !1, this.isVideoContiguous = !1, this.videoTrackConfig = void 0, this.observer = e, this.config = t, this.typeSupported = n, this.ISGenerated = !1, q === null) {
			let e = (navigator.userAgent || "").match(/Chrome\/(\d+)/i);
			q = e ? parseInt(e[1]) : 0;
		}
		if (De === null) {
			let e = navigator.userAgent.match(/Safari\/(\d+)/i);
			De = e ? parseInt(e[1]) : 0;
		}
	}
	destroy() {
		this.config = this.videoTrackConfig = this._initPTS = this._initDTS = null;
	}
	resetTimeStamp(e) {
		d.log("[mp4-remuxer]: initPTS & initDTS reset"), this._initPTS = this._initDTS = e;
	}
	resetNextTimestamp() {
		d.log("[mp4-remuxer]: reset next timestamp"), this.isVideoContiguous = !1, this.isAudioContiguous = !1;
	}
	resetInitSegment() {
		d.log("[mp4-remuxer]: ISGenerated flag reset"), this.ISGenerated = !1, this.videoTrackConfig = void 0;
	}
	getVideoStartPts(e) {
		let t = !1, n = e.reduce((e, n) => {
			let r = n.pts - e;
			return r < -4294967296 ? (t = !0, normalizePts(e, n.pts)) : r > 0 ? e : n.pts;
		}, e[0].pts);
		return t && d.debug("PTS rollover detected"), n;
	}
	remux(e, t, n, r, i, a, o, s) {
		let c, l, u, f, p, m, h = i, g = i, _ = e.pid > -1, v = t.pid > -1, y = t.samples.length, b = e.samples.length > 0, x = o && y > 0 || y > 1;
		if ((!_ || b) && (!v || x) || this.ISGenerated || o) {
			if (this.ISGenerated) {
				let e = this.videoTrackConfig;
				e && (t.width !== e.width || t.height !== e.height || t.pixelRatio?.[0] !== e.pixelRatio?.[0] || t.pixelRatio?.[1] !== e.pixelRatio?.[1]) && this.resetInitSegment();
			} else u = this.generateIS(e, t, i, a);
			let n = this.isVideoContiguous, r = -1, o;
			if (x && (r = findKeyframeIndex(t.samples), !n && this.config.forceKeyFrameOnDiscontinuity)) {
				if (m = !0, r > 0) {
					d.warn(`[mp4-remuxer]: Dropped ${r} out of ${y} video samples due to a missing keyframe`);
					let e = this.getVideoStartPts(t.samples);
					t.samples = t.samples.slice(r), t.dropped += r, g += (t.samples[0].pts - e) / t.inputTimeScale, o = g;
				} else r === -1 && (d.warn(`[mp4-remuxer]: No keyframe found out of ${y} video samples`), m = !1);
			}
			if (this.ISGenerated) {
				if (b && x) {
					let n = this.getVideoStartPts(t.samples), r = (normalizePts(e.samples[0].pts, n) - n) / t.inputTimeScale;
					h += Math.max(0, r), g += Math.max(0, -r);
				}
				if (b) {
					if (e.samplerate || (d.warn("[mp4-remuxer]: regenerate InitSegment as audio detected"), u = this.generateIS(e, t, i, a)), l = this.remuxAudio(e, h, this.isAudioContiguous, a, v || x || s === I.AUDIO ? g : void 0), x) {
						let r = l ? l.endPTS - l.startPTS : 0;
						t.inputTimeScale || (d.warn("[mp4-remuxer]: regenerate InitSegment as video detected"), u = this.generateIS(e, t, i, a)), c = this.remuxVideo(t, g, n, r);
					}
				} else x && (c = this.remuxVideo(t, g, n, 0));
				c && (c.firstKeyFrame = r, c.independent = r !== -1, c.firstKeyFramePTS = o);
			}
		}
		return this.ISGenerated && this._initPTS && this._initDTS && (n.samples.length && (p = flushTextTrackMetadataCueSamples(n, i, this._initPTS, this._initDTS)), r.samples.length && (f = flushTextTrackUserdataCueSamples(r, i, this._initPTS))), {
			audio: l,
			video: c,
			initSegment: u,
			independent: m,
			text: f,
			id3: p
		};
	}
	generateIS(e, t, n, r) {
		let i = e.samples, a = t.samples, o = this.typeSupported, s = {}, c = this._initPTS, l = !c || r, u = "audio/mp4", d, f, p;
		if (l && (d = f = Infinity), e.config && i.length) {
			switch (e.timescale = e.samplerate, e.segmentCodec) {
				case "mp3":
					o.mpeg ? (u = "audio/mpeg", e.codec = "") : o.mp3 && (e.codec = "mp3");
					break;
				case "ac3": e.codec = "ac-3";
			}
			s.audio = {
				id: "audio",
				container: u,
				codec: e.codec,
				initSegment: e.segmentCodec === "mp3" && o.mpeg ? /* @__PURE__ */ new Uint8Array() : K.initSegment([e]),
				metadata: { channelCount: e.channelCount }
			}, l && (p = e.inputTimeScale, !c || p !== c.timescale ? d = f = i[0].pts - Math.round(p * n) : l = !1);
		}
		if (t.sps && t.pps && a.length) {
			if (t.timescale = t.inputTimeScale, s.video = {
				id: "main",
				container: "video/mp4",
				codec: t.codec,
				initSegment: K.initSegment([t]),
				metadata: {
					width: t.width,
					height: t.height
				}
			}, l) {
				if (p = t.inputTimeScale, !c || p !== c.timescale) {
					let e = this.getVideoStartPts(a), t = Math.round(p * n);
					f = Math.min(f, normalizePts(a[0].dts, e) - t), d = Math.min(d, e - t);
				} else l = !1;
			}
			this.videoTrackConfig = {
				width: t.width,
				height: t.height,
				pixelRatio: t.pixelRatio
			};
		}
		if (Object.keys(s).length) return this.ISGenerated = !0, l ? (this._initPTS = {
			baseTime: d,
			timescale: p
		}, this._initDTS = {
			baseTime: f,
			timescale: p
		}) : d = p = void 0, {
			tracks: s,
			initPTS: d,
			timescale: p
		};
	}
	remuxVideo(e, t, n, r) {
		let i = e.inputTimeScale, c = e.samples, l = [], u = c.length, f = this._initPTS, p = this.nextAvcDts, m = 8, h = this.videoSampleDuration, g, _, v = Infinity, y = -Infinity, b = !1;
		if (!n || p === null) {
			let e = t * i, r = c[0].pts - normalizePts(c[0].dts, c[0].pts);
			q && p !== null && Math.abs(e - r - p) < 15e3 ? n = !0 : p = e - r;
		}
		let x = f.baseTime * i / f.timescale;
		for (let e = 0; e < u; e++) {
			let t = c[e];
			t.pts = normalizePts(t.pts - x, p), t.dts = normalizePts(t.dts - x, p), t.dts < c[e > 0 ? e - 1 : e].dts && (b = !0);
		}
		b && c.sort(function(e, t) {
			let n = e.dts - t.dts, r = e.pts - t.pts;
			return n || r;
		}), g = c[0].dts, _ = c[c.length - 1].dts;
		let S = _ - g, C = S ? Math.round(S / (u - 1)) : h || e.inputTimeScale / 30;
		if (n) {
			let e = g - p, n = e > C, r = e < -1;
			if ((n || r) && (n ? d.warn(`AVC: ${toMsFromMpegTsClock(e, !0)} ms (${e}dts) hole between fragments detected at ${t.toFixed(3)}`) : d.warn(`AVC: ${toMsFromMpegTsClock(-e, !0)} ms (${e}dts) overlapping between fragments detected at ${t.toFixed(3)}`), !r || p >= c[0].pts || q)) {
				g = p;
				let t = c[0].pts - e;
				if (n) c[0].dts = g, c[0].pts = t;
				else for (let n = 0; n < c.length && !(c[n].dts > t); n++) c[n].dts -= e, c[n].pts -= e;
				d.log(`Video: Initial PTS/DTS adjusted: ${toMsFromMpegTsClock(t, !0)}/${toMsFromMpegTsClock(g, !0)}, delta: ${toMsFromMpegTsClock(e, !0)} ms`);
			}
		}
		g = Math.max(0, g);
		let w = 0, T = 0, E = g;
		for (let e = 0; e < u; e++) {
			let t = c[e], n = t.units, r = n.length, i = 0;
			for (let e = 0; e < r; e++) i += n[e].data.length;
			T += i, w += r, t.length = i, t.dts < E ? (t.dts = E, E += C / 4 | 0 || 1) : E = t.dts, v = Math.min(t.pts, v), y = Math.max(t.pts, y);
		}
		_ = c[u - 1].dts;
		let D = T + 4 * w + 8, O;
		try {
			O = new Uint8Array(D);
		} catch (e) {
			this.observer.emit(a.ERROR, a.ERROR, {
				type: o.MUX_ERROR,
				details: s.REMUX_ALLOC_ERROR,
				fatal: !1,
				error: e,
				bytes: D,
				reason: `fail allocating video mdat ${D}`
			});
			return;
		}
		let k = new DataView(O.buffer);
		k.setUint32(0, D), O.set(K.types.mdat, 4);
		let A = !1, j = Infinity, M = Infinity, N = -Infinity, P = -Infinity;
		for (let e = 0; e < u; e++) {
			let t = c[e], n = t.units, a = 0;
			for (let e = 0, t = n.length; e < t; e++) {
				let t = n[e], r = t.data, i = t.data.byteLength;
				k.setUint32(m, i), m += 4, O.set(r, m), m += i, a += 4 + i;
			}
			let o;
			if (e < u - 1) h = c[e + 1].dts - t.dts, o = c[e + 1].pts - t.pts;
			else {
				let n = this.config, a = e > 0 ? t.dts - c[e - 1].dts : C;
				if (o = e > 0 ? t.pts - c[e - 1].pts : C, n.stretchShortVideoTrack && this.nextAudioPts !== null) {
					let e = Math.floor(n.maxBufferHole * i), o = (r ? v + r * i : this.nextAudioPts) - t.pts;
					o > e ? (h = o - a, h < 0 ? h = a : A = !0, d.log(`[mp4-remuxer]: It is approximately ${o / 90} ms to the next segment; using duration ${h / 90} ms for the last video frame.`)) : h = a;
				} else h = a;
			}
			let s = Math.round(t.pts - t.dts);
			j = Math.min(j, h), N = Math.max(N, h), M = Math.min(M, o), P = Math.max(P, o), l.push(new Mp4Sample(t.key, h, a, s));
		}
		if (l.length) {
			if (q) {
				if (q < 70) {
					let e = l[0].flags;
					e.dependsOn = 2, e.isNonSync = 0;
				}
			} else if (De && P - M < N - j && C / N < .025 && l[0].cts === 0) {
				d.warn("Found irregular gaps in sample duration. Using PTS instead of DTS to determine MP4 sample duration.");
				let e = g;
				for (let t = 0, n = l.length; t < n; t++) {
					let r = e + l[t].duration, i = e + l[t].cts;
					if (t < n - 1) {
						let e = r + l[t + 1].cts;
						l[t].duration = e - i;
					} else l[t].duration = t ? l[t - 1].duration : C;
					l[t].cts = 0, e = r;
				}
			}
		}
		h = A || !h ? C : h, this.nextAvcDts = p = _ + h, this.videoSampleDuration = h, this.isVideoContiguous = !0;
		let ee = {
			data1: K.moof(e.sequenceNumber++, g, _extends({}, e, { samples: l })),
			data2: O,
			startPTS: v / i,
			endPTS: (y + h) / i,
			startDTS: g / i,
			endDTS: p / i,
			type: "video",
			hasAudio: !1,
			hasVideo: !0,
			nb: l.length,
			dropped: e.dropped
		};
		return e.samples = [], e.dropped = 0, ee;
	}
	getSamplesPerFrame(e) {
		switch (e.segmentCodec) {
			case "mp3": return Te;
			case "ac3": return Ee;
			default: return we;
		}
	}
	remuxAudio(e, t, n, r, i) {
		let c = e.inputTimeScale, l = c / (e.samplerate ? e.samplerate : c), u = this.getSamplesPerFrame(e), f = u * l, p = this._initPTS, m = e.segmentCodec === "mp3" && this.typeSupported.mpeg, h = [], g = i !== void 0, _ = e.samples, v = m ? 0 : 8, y = this.nextAudioPts || -1, b = t * c, x = p.baseTime * c / p.timescale;
		if (this.isAudioContiguous = n ||= _.length && y > 0 && (r && Math.abs(b - y) < 9e3 || Math.abs(normalizePts(_[0].pts - x, b) - y) < 20 * f), _.forEach(function(e) {
			e.pts = normalizePts(e.pts - x, b);
		}), !n || y < 0) {
			if (_ = _.filter((e) => e.pts >= 0), !_.length) return;
			y = i === 0 ? 0 : r && !g ? Math.max(0, b) : _[0].pts;
		}
		if (e.segmentCodec === "aac") {
			let t = this.config.maxAudioFramesDrift;
			for (let n = 0, r = y; n < _.length; n++) {
				let i = _[n], a = i.pts, o = a - r, s = Math.abs(1e3 * o / c);
				if (o <= -t * f && g) n === 0 && (d.warn(`Audio frame @ ${(a / c).toFixed(3)}s overlaps nextAudioPts by ${Math.round(1e3 * o / c)} ms.`), this.nextAudioPts = y = r = a);
				else if (o >= t * f && s < Ce && g) {
					let t = Math.round(o / f);
					r = a - t * f, r < 0 && (t--, r += f), n === 0 && (this.nextAudioPts = y = r), d.warn(`[mp4-remuxer]: Injecting ${t} audio frame @ ${(r / c).toFixed(3)}s due to ${Math.round(1e3 * o / c)} ms gap.`);
					for (let a = 0; a < t; a++) {
						let t = Math.max(r, 0), a = AAC.getSilentFrame(e.manifestCodec || e.codec, e.channelCount);
						a ||= (d.log("[mp4-remuxer]: Unable to get silent frame for given audio codec; duplicating last frame instead."), i.unit.subarray()), _.splice(n, 0, {
							unit: a,
							pts: t
						}), r += f, n++;
					}
				}
				i.pts = r, r += f;
			}
		}
		let S = null, C = null, w, T = 0, E = _.length;
		for (; E--;) T += _[E].unit.byteLength;
		for (let t = 0, r = _.length; t < r; t++) {
			let r = _[t], i = r.unit, c = r.pts;
			if (C !== null) {
				let e = h[t - 1];
				e.duration = Math.round((c - C) / l);
			} else if (n && e.segmentCodec === "aac" && (c = y), S = c, T > 0) {
				T += v;
				try {
					w = new Uint8Array(T);
				} catch (e) {
					this.observer.emit(a.ERROR, a.ERROR, {
						type: o.MUX_ERROR,
						details: s.REMUX_ALLOC_ERROR,
						fatal: !1,
						error: e,
						bytes: T,
						reason: `fail allocating audio mdat ${T}`
					});
					return;
				}
				m || (new DataView(w.buffer).setUint32(0, T), w.set(K.types.mdat, 4));
			} else return;
			w.set(i, v);
			let d = i.byteLength;
			v += d, h.push(new Mp4Sample(!0, u, d, 0)), C = c;
		}
		let D = h.length;
		if (!D) return;
		let O = h[h.length - 1];
		this.nextAudioPts = y = C + l * O.duration;
		let k = m ? /* @__PURE__ */ new Uint8Array() : K.moof(e.sequenceNumber++, S / l, _extends({}, e, { samples: h }));
		e.samples = [];
		let A = S / c, j = y / c, M = {
			data1: k,
			data2: w,
			startPTS: A,
			endPTS: j,
			startDTS: A,
			endDTS: j,
			type: "audio",
			hasAudio: !0,
			hasVideo: !1,
			nb: D
		};
		return this.isAudioContiguous = !0, M;
	}
	remuxEmptyAudio(e, t, n, r) {
		let i = e.inputTimeScale, a = i / (e.samplerate ? e.samplerate : i), o = this.nextAudioPts, s = this._initDTS, c = s.baseTime * 9e4 / s.timescale, l = (o === null ? r.startDTS * i : o) + c, u = r.endDTS * i + c, f = a * we, p = Math.ceil((u - l) / f), m = AAC.getSilentFrame(e.manifestCodec || e.codec, e.channelCount);
		if (d.warn("[mp4-remuxer]: remux empty Audio"), !m) {
			d.trace("[mp4-remuxer]: Unable to remuxEmptyAudio since we were unable to get a silent frame for given audio codec");
			return;
		}
		let h = [];
		for (let e = 0; e < p; e++) {
			let t = l + e * f;
			h.push({
				unit: m,
				pts: t,
				dts: t
			});
		}
		return e.samples = h, this.remuxAudio(e, t, n, !1);
	}
};
function normalizePts(e, t) {
	let n;
	if (t === null) return e;
	for (n = t < e ? -8589934592 : 8589934592; Math.abs(e - t) > 4294967296;) e += n;
	return e;
}
function findKeyframeIndex(e) {
	for (let t = 0; t < e.length; t++) if (e[t].key) return t;
	return -1;
}
function flushTextTrackMetadataCueSamples(e, t, n, r) {
	let i = e.samples.length;
	if (!i) return;
	let a = e.inputTimeScale;
	for (let o = 0; o < i; o++) {
		let i = e.samples[o];
		i.pts = normalizePts(i.pts - n.baseTime * a / n.timescale, t * a) / a, i.dts = normalizePts(i.dts - r.baseTime * a / r.timescale, t * a) / a;
	}
	let o = e.samples;
	return e.samples = [], { samples: o };
}
function flushTextTrackUserdataCueSamples(e, t, n) {
	let r = e.samples.length;
	if (!r) return;
	let i = e.inputTimeScale;
	for (let a = 0; a < r; a++) {
		let r = e.samples[a];
		r.pts = normalizePts(r.pts - n.baseTime * i / n.timescale, t * i) / i;
	}
	e.samples.sort((e, t) => e.pts - t.pts);
	let a = e.samples;
	return e.samples = [], { samples: a };
}
var Mp4Sample = class {
	constructor(e, t, n, r) {
		this.size = void 0, this.duration = void 0, this.cts = void 0, this.flags = void 0, this.duration = t, this.size = n, this.cts = r, this.flags = {
			isLeading: 0,
			isDependedOn: 0,
			hasRedundancy: 0,
			degradPrio: 0,
			dependsOn: e ? 2 : 1,
			isNonSync: +!e
		};
	}
}, PassThroughRemuxer = class {
	constructor() {
		this.emitInitSegment = !1, this.audioCodec = void 0, this.videoCodec = void 0, this.initData = void 0, this.initPTS = null, this.initTracks = void 0, this.lastEndTime = null;
	}
	destroy() {}
	resetTimeStamp(e) {
		this.initPTS = e, this.lastEndTime = null;
	}
	resetNextTimestamp() {
		this.lastEndTime = null;
	}
	resetInitSegment(e, t, n, r) {
		this.audioCodec = t, this.videoCodec = n, this.generateInitSegment(patchEncyptionData(e, r)), this.emitInitSegment = !0;
	}
	generateInitSegment(e) {
		let { audioCodec: t, videoCodec: n } = this;
		if (!(e != null && e.byteLength)) {
			this.initTracks = void 0, this.initData = void 0;
			return;
		}
		let r = this.initData = parseInitSegment(e);
		r.audio && (t = getParsedTrackCodec(r.audio, h.AUDIO)), r.video && (n = getParsedTrackCodec(r.video, h.VIDEO));
		let i = {};
		r.audio && r.video ? i.audiovideo = {
			container: "video/mp4",
			codec: t + "," + n,
			initSegment: e,
			id: "main"
		} : r.audio ? i.audio = {
			container: "audio/mp4",
			codec: t,
			initSegment: e,
			id: "audio"
		} : r.video ? i.video = {
			container: "video/mp4",
			codec: n,
			initSegment: e,
			id: "main"
		} : d.warn("[passthrough-remuxer.ts]: initSegment does not contain moov or trak boxes."), this.initTracks = i;
	}
	remux(e, t, r, i, a, o) {
		var s, c;
		let { initPTS: l, lastEndTime: u } = this, f = {
			audio: void 0,
			video: void 0,
			text: i,
			id3: r,
			initSegment: void 0
		};
		n(u) || (u = this.lastEndTime = a || 0);
		let p = t.samples;
		if (!(p != null && p.length)) return f;
		let m = {
			initPTS: void 0,
			timescale: 1
		}, h = this.initData;
		if ((s = h) != null && s.length || (this.generateInitSegment(p), h = this.initData), !((c = h) != null && c.length)) return d.warn("[passthrough-remuxer.ts]: Failed to generate initSegment."), f;
		this.emitInitSegment &&= (m.tracks = this.initTracks, !1);
		let g = getDuration(p, h), _ = getStartDTS(h, p), v = _ === null ? a : _;
		(isInvalidInitPts(l, v, a, g) || m.timescale !== l.timescale && o) && (m.initPTS = v - a, l && l.timescale === 1 && d.warn(`Adjusting initPTS by ${m.initPTS - l.baseTime}`), this.initPTS = l = {
			baseTime: m.initPTS,
			timescale: 1
		});
		let y = e ? v - l.baseTime / l.timescale : u, b = y + g;
		offsetStartDTS(h, p, l.baseTime / l.timescale), g > 0 ? this.lastEndTime = b : (d.warn("Duration parsed from mp4 should be greater than zero"), this.resetNextTimestamp());
		let x = !!h.audio, S = !!h.video, C = "";
		x && (C += "audio"), S && (C += "video");
		let w = {
			data1: p,
			startPTS: y,
			startDTS: y,
			endPTS: b,
			endDTS: b,
			type: C,
			hasAudio: x,
			hasVideo: S,
			nb: 1,
			dropped: 0
		};
		return f.audio = w.type === "audio" ? w : void 0, f.video = w.type === "audio" ? void 0 : w, f.initSegment = m, f.id3 = flushTextTrackMetadataCueSamples(r, a, l, l), i.samples.length && (f.text = flushTextTrackUserdataCueSamples(i, a, l)), f;
	}
};
function isInvalidInitPts(e, t, n, r) {
	if (e === null) return !0;
	let i = Math.max(r, 1), a = t - e.baseTime / e.timescale;
	return Math.abs(a - n) > i;
}
function getParsedTrackCodec(e, t) {
	let n = e?.codec;
	if (n && n.length > 4) return n;
	if (t === h.AUDIO) {
		if (n === "ec-3" || n === "ac-3" || n === "alac") return n;
		if (n === "fLaC" || n === "Opus") return getCodecCompatibleName(n, !1);
		let e = "mp4a.40.5";
		return d.info(`Parsed audio codec "${n}" or audio object type not handled. Using "${e}"`), e;
	}
	return d.warn(`Unhandled video codec "${n}"`), n === "hvc1" || n === "hev1" ? "hvc1.1.6.L120.90" : n === "av01" ? "av01.0.04M.08" : "avc1.42e01e";
}
var J;
try {
	J = self.performance.now.bind(self.performance);
} catch {
	d.debug("Unable to use Performance API on this environment"), J = _?.Date.now;
}
var Oe = [
	{
		demux: MP4Demuxer,
		remux: PassThroughRemuxer
	},
	{
		demux: xe,
		remux: MP4Remuxer
	},
	{
		demux: AACDemuxer,
		remux: MP4Remuxer
	},
	{
		demux: MP3Demuxer,
		remux: MP4Remuxer
	}
];
Oe.splice(2, 0, {
	demux: AC3Demuxer,
	remux: MP4Remuxer
});
var Transmuxer = class {
	constructor(e, t, n, r, i) {
		this.async = !1, this.observer = void 0, this.typeSupported = void 0, this.config = void 0, this.vendor = void 0, this.id = void 0, this.demuxer = void 0, this.remuxer = void 0, this.decrypter = void 0, this.probe = void 0, this.decryptionPromise = null, this.transmuxConfig = void 0, this.currentTransmuxState = void 0, this.observer = e, this.typeSupported = t, this.config = n, this.vendor = r, this.id = i;
	}
	configure(e) {
		this.transmuxConfig = e, this.decrypter && this.decrypter.reset();
	}
	push(e, t, n, r) {
		let i = n.transmuxing;
		i.executeStart = J();
		let c = new Uint8Array(e), { currentTransmuxState: l, transmuxConfig: u } = this;
		r && (this.currentTransmuxState = r);
		let { contiguous: f, discontinuity: p, trackSwitch: m, accurateTimeOffset: h, timeOffset: g, initSegmentChange: _ } = r || l, { audioCodec: v, videoCodec: y, defaultInitPts: b, duration: x, initSegmentData: S } = u, C = getEncryptionType(c, t);
		if (C && C.method === "AES-128") {
			let e = this.getDecrypter();
			if (e.isSync()) {
				let t = e.softwareDecrypt(c, C.key.buffer, C.iv.buffer);
				if (n.part > -1 && (t = e.flush()), !t) return i.executeEnd = J(), emptyResult(n);
				c = new Uint8Array(t);
			} else return this.decryptionPromise = e.webCryptoDecrypt(c, C.key.buffer, C.iv.buffer).then((e) => {
				let t = this.push(e, null, n);
				return this.decryptionPromise = null, t;
			}), this.decryptionPromise;
		}
		let w = this.needsProbing(p, m);
		if (w) {
			let e = this.configureTransmuxer(c);
			if (e) return d.warn(`[transmuxer] ${e.message}`), this.observer.emit(a.ERROR, a.ERROR, {
				type: o.MEDIA_ERROR,
				details: s.FRAG_PARSING_ERROR,
				fatal: !1,
				error: e,
				reason: e.message
			}), i.executeEnd = J(), emptyResult(n);
		}
		(p || m || _ || w) && this.resetInitSegment(S, v, y, x, t), (p || _ || w) && this.resetInitialTimestamp(b), f || this.resetContiguity();
		let T = this.transmux(c, C, g, h, n), E = this.currentTransmuxState;
		return E.contiguous = !0, E.discontinuity = !1, E.trackSwitch = !1, i.executeEnd = J(), T;
	}
	flush(e) {
		let t = e.transmuxing;
		t.executeStart = J();
		let { decrypter: n, currentTransmuxState: r, decryptionPromise: i } = this;
		if (i) return i.then(() => this.flush(e));
		let a = [], { timeOffset: o } = r;
		if (n) {
			let t = n.flush();
			t && a.push(this.push(t, null, e));
		}
		let { demuxer: s, remuxer: c } = this;
		if (!s || !c) return t.executeEnd = J(), [emptyResult(e)];
		let l = s.flush(o);
		return isPromise(l) ? l.then((t) => (this.flushRemux(a, t, e), a)) : (this.flushRemux(a, l, e), a);
	}
	flushRemux(e, t, n) {
		let { audioTrack: r, videoTrack: i, id3Track: a, textTrack: o } = t, { accurateTimeOffset: s, timeOffset: c } = this.currentTransmuxState;
		d.log(`[transmuxer.ts]: Flushed fragment ${n.sn}${n.part > -1 ? " p: " + n.part : ""} of level ${n.level}`);
		let l = this.remuxer.remux(r, i, a, o, c, s, !0, this.id);
		e.push({
			remuxResult: l,
			chunkMeta: n
		}), n.transmuxing.executeEnd = J();
	}
	resetInitialTimestamp(e) {
		let { demuxer: t, remuxer: n } = this;
		t && n && (t.resetTimeStamp(e), n.resetTimeStamp(e));
	}
	resetContiguity() {
		let { demuxer: e, remuxer: t } = this;
		e && t && (e.resetContiguity(), t.resetNextTimestamp());
	}
	resetInitSegment(e, t, n, r, i) {
		let { demuxer: a, remuxer: o } = this;
		a && o && (a.resetInitSegment(e, t, n, r), o.resetInitSegment(e, t, n, i));
	}
	destroy() {
		this.demuxer &&= (this.demuxer.destroy(), void 0), this.remuxer &&= (this.remuxer.destroy(), void 0);
	}
	transmux(e, t, n, r, i) {
		let a;
		return a = t && t.method === "SAMPLE-AES" ? this.transmuxSampleAes(e, t, n, r, i) : this.transmuxUnencrypted(e, n, r, i), a;
	}
	transmuxUnencrypted(e, t, n, r) {
		let { audioTrack: i, videoTrack: a, id3Track: o, textTrack: s } = this.demuxer.demux(e, t, !1, !this.config.progressive);
		return {
			remuxResult: this.remuxer.remux(i, a, o, s, t, n, !1, this.id),
			chunkMeta: r
		};
	}
	transmuxSampleAes(e, t, n, r, i) {
		return this.demuxer.demuxSampleAes(e, t, n).then((e) => ({
			remuxResult: this.remuxer.remux(e.audioTrack, e.videoTrack, e.id3Track, e.textTrack, n, r, !1, this.id),
			chunkMeta: i
		}));
	}
	configureTransmuxer(e) {
		let { config: t, observer: n, typeSupported: r, vendor: i } = this, a;
		for (let t = 0, n = Oe.length; t < n; t++) {
			var o;
			if ((o = Oe[t].demux) != null && o.probe(e)) {
				a = Oe[t];
				break;
			}
		}
		if (!a) return /* @__PURE__ */ Error("Failed to find demuxer by probing fragment data");
		let s = this.demuxer, c = this.remuxer, l = a.remux, u = a.demux;
		(!c || !(c instanceof l)) && (this.remuxer = new l(n, t, r, i)), (!s || !(s instanceof u)) && (this.demuxer = new u(n, t, r), this.probe = u.probe);
	}
	needsProbing(e, t) {
		return !this.demuxer || !this.remuxer || e || t;
	}
	getDecrypter() {
		let e = this.decrypter;
		return e ||= this.decrypter = new Decrypter(this.config), e;
	}
};
function getEncryptionType(e, t) {
	let n = null;
	return e.byteLength > 0 && t?.key != null && t.iv !== null && t.method != null && (n = t), n;
}
var emptyResult = (e) => ({
	remuxResult: {},
	chunkMeta: e
});
function isPromise(e) {
	return "then" in e && e.then instanceof Function;
}
var TransmuxConfig = class {
	constructor(e, t, n, r, i) {
		this.audioCodec = void 0, this.videoCodec = void 0, this.initSegmentData = void 0, this.duration = void 0, this.defaultInitPts = void 0, this.audioCodec = e, this.videoCodec = t, this.initSegmentData = n, this.duration = r, this.defaultInitPts = i || null;
	}
}, TransmuxState = class {
	constructor(e, t, n, r, i, a) {
		this.discontinuity = void 0, this.contiguous = void 0, this.accurateTimeOffset = void 0, this.trackSwitch = void 0, this.timeOffset = void 0, this.initSegmentChange = void 0, this.discontinuity = e, this.contiguous = t, this.accurateTimeOffset = n, this.trackSwitch = r, this.timeOffset = i, this.initSegmentChange = a;
	}
}, ke = { exports: {} };
(function(e) {
	var t = Object.prototype.hasOwnProperty, n = "~";
	function Events() {}
	Object.create && (Events.prototype = Object.create(null), new Events().__proto__ || (n = !1));
	function EE(e, t, n) {
		this.fn = e, this.context = t, this.once = n || !1;
	}
	function addListener(e, t, r, i, a) {
		if (typeof r != "function") throw TypeError("The listener must be a function");
		var o = new EE(r, i || e, a), s = n ? n + t : t;
		return e._events[s] ? e._events[s].fn ? e._events[s] = [e._events[s], o] : e._events[s].push(o) : (e._events[s] = o, e._eventsCount++), e;
	}
	function clearEvent(e, t) {
		--e._eventsCount === 0 ? e._events = new Events() : delete e._events[t];
	}
	function EventEmitter() {
		this._events = new Events(), this._eventsCount = 0;
	}
	EventEmitter.prototype.eventNames = function eventNames() {
		var e = [], r, i;
		if (this._eventsCount === 0) return e;
		for (i in r = this._events) t.call(r, i) && e.push(n ? i.slice(1) : i);
		return Object.getOwnPropertySymbols ? e.concat(Object.getOwnPropertySymbols(r)) : e;
	}, EventEmitter.prototype.listeners = function listeners(e) {
		var t = n ? n + e : e, r = this._events[t];
		if (!r) return [];
		if (r.fn) return [r.fn];
		for (var i = 0, a = r.length, o = Array(a); i < a; i++) o[i] = r[i].fn;
		return o;
	}, EventEmitter.prototype.listenerCount = function listenerCount(e) {
		var t = n ? n + e : e, r = this._events[t];
		return r ? r.fn ? 1 : r.length : 0;
	}, EventEmitter.prototype.emit = function emit(e, t, r, i, a, o) {
		var s = n ? n + e : e;
		if (!this._events[s]) return !1;
		var c = this._events[s], l = arguments.length, u, d;
		if (c.fn) {
			switch (c.once && this.removeListener(e, c.fn, void 0, !0), l) {
				case 1: return c.fn.call(c.context), !0;
				case 2: return c.fn.call(c.context, t), !0;
				case 3: return c.fn.call(c.context, t, r), !0;
				case 4: return c.fn.call(c.context, t, r, i), !0;
				case 5: return c.fn.call(c.context, t, r, i, a), !0;
				case 6: return c.fn.call(c.context, t, r, i, a, o), !0;
			}
			for (d = 1, u = Array(l - 1); d < l; d++) u[d - 1] = arguments[d];
			c.fn.apply(c.context, u);
		} else {
			var f = c.length, p;
			for (d = 0; d < f; d++) switch (c[d].once && this.removeListener(e, c[d].fn, void 0, !0), l) {
				case 1:
					c[d].fn.call(c[d].context);
					break;
				case 2:
					c[d].fn.call(c[d].context, t);
					break;
				case 3:
					c[d].fn.call(c[d].context, t, r);
					break;
				case 4:
					c[d].fn.call(c[d].context, t, r, i);
					break;
				default:
					if (!u) for (p = 1, u = Array(l - 1); p < l; p++) u[p - 1] = arguments[p];
					c[d].fn.apply(c[d].context, u);
			}
		}
		return !0;
	}, EventEmitter.prototype.on = function on(e, t, n) {
		return addListener(this, e, t, n, !1);
	}, EventEmitter.prototype.once = function once(e, t, n) {
		return addListener(this, e, t, n, !0);
	}, EventEmitter.prototype.removeListener = function removeListener(e, t, r, i) {
		var a = n ? n + e : e;
		if (!this._events[a]) return this;
		if (!t) return clearEvent(this, a), this;
		var o = this._events[a];
		if (o.fn) o.fn === t && (!i || o.once) && (!r || o.context === r) && clearEvent(this, a);
		else {
			for (var s = 0, c = [], l = o.length; s < l; s++) (o[s].fn !== t || i && !o[s].once || r && o[s].context !== r) && c.push(o[s]);
			c.length ? this._events[a] = c.length === 1 ? c[0] : c : clearEvent(this, a);
		}
		return this;
	}, EventEmitter.prototype.removeAllListeners = function removeAllListeners(e) {
		var t;
		return e ? (t = n ? n + e : e, this._events[t] && clearEvent(this, t)) : (this._events = new Events(), this._eventsCount = 0), this;
	}, EventEmitter.prototype.off = EventEmitter.prototype.removeListener, EventEmitter.prototype.addListener = EventEmitter.prototype.on, EventEmitter.prefixed = n, EventEmitter.EventEmitter = EventEmitter, e.exports = EventEmitter;
})(ke);
var Ae = ke.exports, je = /*@__PURE__*/ getDefaultExportFromCjs(Ae), TransmuxerInterface = class {
	constructor(e, t, n, r) {
		this.error = null, this.hls = void 0, this.id = void 0, this.observer = void 0, this.frag = null, this.part = null, this.useWorker = void 0, this.workerContext = null, this.onwmsg = void 0, this.transmuxer = null, this.onTransmuxComplete = void 0, this.onFlush = void 0;
		let i = e.config;
		this.hls = e, this.id = t, this.useWorker = !!i.enableWorker, this.onTransmuxComplete = n, this.onFlush = r;
		let forwardMessage = (e, t) => {
			t ||= {}, t.frag = this.frag, t.id = this.id, e === a.ERROR && (this.error = t.error), this.hls.trigger(e, t);
		};
		this.observer = new je(), this.observer.on(a.FRAG_DECRYPTED, forwardMessage), this.observer.on(a.ERROR, forwardMessage);
		let c = getMediaSource(i.preferManagedMediaSource) || { isTypeSupported: () => !1 }, l = {
			mpeg: c.isTypeSupported("audio/mpeg"),
			mp3: c.isTypeSupported("audio/mp4; codecs=\"mp3\""),
			ac3: c.isTypeSupported("audio/mp4; codecs=\"ac-3\"")
		};
		if (this.useWorker && typeof Worker < "u" && (i.workerPath || hasUMDWorker())) {
			try {
				i.workerPath ? (d.log(`loading Web Worker ${i.workerPath} for "${t}"`), this.workerContext = loadWorker(i.workerPath)) : (d.log(`injecting Web Worker for "${t}"`), this.workerContext = injectWorker()), this.onwmsg = (e) => this.onWorkerMessage(e);
				let { worker: e } = this.workerContext;
				e.addEventListener("message", this.onwmsg), e.onerror = (e) => {
					let n = /* @__PURE__ */ Error(`${e.message}  (${e.filename}:${e.lineno})`);
					i.enableWorker = !1, d.warn(`Error in "${t}" Web Worker, fallback to inline`), this.hls.trigger(a.ERROR, {
						type: o.OTHER_ERROR,
						details: s.INTERNAL_EXCEPTION,
						fatal: !1,
						event: "demuxerWorker",
						error: n
					});
				}, e.postMessage({
					cmd: "init",
					typeSupported: l,
					vendor: "",
					id: t,
					config: JSON.stringify(i)
				});
			} catch (e) {
				d.warn(`Error setting up "${t}" Web Worker, fallback to inline`, e), this.resetWorker(), this.error = null, this.transmuxer = new Transmuxer(this.observer, l, i, "", t);
			}
			return;
		}
		this.transmuxer = new Transmuxer(this.observer, l, i, "", t);
	}
	resetWorker() {
		if (this.workerContext) {
			let { worker: e, objectURL: t } = this.workerContext;
			t && self.URL.revokeObjectURL(t), e.removeEventListener("message", this.onwmsg), e.onerror = null, e.terminate(), this.workerContext = null;
		}
	}
	destroy() {
		if (this.workerContext) this.resetWorker(), this.onwmsg = void 0;
		else {
			let e = this.transmuxer;
			e && (e.destroy(), this.transmuxer = null);
		}
		let e = this.observer;
		e && e.removeAllListeners(), this.frag = null, this.observer = null, this.hls = null;
	}
	push(e, t, n, r, i, a, o, s, c, l) {
		c.transmuxing.start = self.performance.now();
		let { transmuxer: u } = this, f = a ? a.start : i.start, p = i.decryptdata, m = this.frag, h = !(m && i.cc === m.cc), g = !(m && c.level === m.level), _ = m ? c.sn - m.sn : -1, v = this.part ? c.part - this.part.index : -1, y = _ === 0 && c.id > 1 && c.id === m?.stats.chunkCount, b = !g && (_ === 1 || _ === 0 && (v === 1 || y && v <= 0)), x = self.performance.now();
		(g || _ || i.stats.parsing.start === 0) && (i.stats.parsing.start = x), a && (v || !b) && (a.stats.parsing.start = x);
		let S = !(m && i.initSegment?.url === m.initSegment?.url), C = new TransmuxState(h, b, s, g, f, S);
		if (!b || h || S) {
			d.log(`[transmuxer-interface, ${i.type}]: Starting new transmux session for sn: ${c.sn} p: ${c.part} level: ${c.level} id: ${c.id}
        discontinuity: ${h}
        trackSwitch: ${g}
        contiguous: ${b}
        accurateTimeOffset: ${s}
        timeOffset: ${f}
        initSegmentChange: ${S}`);
			let e = new TransmuxConfig(n, r, t, o, l);
			this.configureTransmuxer(e);
		}
		if (this.frag = i, this.part = a, this.workerContext) this.workerContext.worker.postMessage({
			cmd: "demux",
			data: e,
			decryptdata: p,
			chunkMeta: c,
			state: C
		}, e instanceof ArrayBuffer ? [e] : []);
		else if (u) {
			let t = u.push(e, p, c, C);
			isPromise(t) ? (u.async = !0, t.then((e) => {
				this.handleTransmuxComplete(e);
			}).catch((e) => {
				this.transmuxerError(e, c, "transmuxer-interface push error");
			})) : (u.async = !1, this.handleTransmuxComplete(t));
		}
	}
	flush(e) {
		e.transmuxing.start = self.performance.now();
		let { transmuxer: t } = this;
		if (this.workerContext) this.workerContext.worker.postMessage({
			cmd: "flush",
			chunkMeta: e
		});
		else if (t) {
			let n = t.flush(e);
			isPromise(n) || t.async ? (isPromise(n) || (n = Promise.resolve(n)), n.then((t) => {
				this.handleFlushResult(t, e);
			}).catch((t) => {
				this.transmuxerError(t, e, "transmuxer-interface flush error");
			})) : this.handleFlushResult(n, e);
		}
	}
	transmuxerError(e, t, n) {
		this.hls && (this.error = e, this.hls.trigger(a.ERROR, {
			type: o.MEDIA_ERROR,
			details: s.FRAG_PARSING_ERROR,
			chunkMeta: t,
			frag: this.frag || void 0,
			fatal: !1,
			error: e,
			err: e,
			reason: n
		}));
	}
	handleFlushResult(e, t) {
		e.forEach((e) => {
			this.handleTransmuxComplete(e);
		}), this.onFlush(t);
	}
	onWorkerMessage(e) {
		let t = e.data;
		if (!(t != null && t.event)) {
			d.warn(`worker message received with no ${t ? "event name" : "data"}`);
			return;
		}
		let n = this.hls;
		if (this.hls) switch (t.event) {
			case "init": {
				let e = this.workerContext?.objectURL;
				e && self.URL.revokeObjectURL(e);
				break;
			}
			case "transmuxComplete":
				this.handleTransmuxComplete(t.data);
				break;
			case "flush":
				this.onFlush(t.data);
				break;
			case "workerLog":
				d[t.data.logType] && d[t.data.logType](t.data.message);
				break;
			default: t.data = t.data || {}, t.data.frag = this.frag, t.data.id = this.id, n.trigger(t.event, t.data);
		}
	}
	configureTransmuxer(e) {
		let { transmuxer: t } = this;
		this.workerContext ? this.workerContext.worker.postMessage({
			cmd: "configure",
			config: e
		}) : t && t.configure(e);
	}
	handleTransmuxComplete(e) {
		e.chunkMeta.transmuxing.end = self.performance.now(), this.onTransmuxComplete(e);
	}
};
function subtitleOptionsIdentical(e, t) {
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (!mediaAttributesIdentical(e[n].attrs, t[n].attrs)) return !1;
	return !0;
}
function mediaAttributesIdentical(e, t, n) {
	let r = e["STABLE-RENDITION-ID"];
	return r && !n ? r === t["STABLE-RENDITION-ID"] : !(n || [
		"LANGUAGE",
		"NAME",
		"CHARACTERISTICS",
		"AUTOSELECT",
		"DEFAULT",
		"FORCED",
		"ASSOC-LANGUAGE"
	]).some((n) => e[n] !== t[n]);
}
function subtitleTrackMatchesTextTrack(e, t) {
	return t.label.toLowerCase() === e.name.toLowerCase() && (!t.language || t.language.toLowerCase() === (e.lang || "").toLowerCase());
}
var Me = 100, AudioStreamController = class extends BaseStreamController {
	constructor(e, t, n) {
		super(e, t, n, "[audio-stream-controller]", I.AUDIO), this.videoBuffer = null, this.videoTrackCC = -1, this.waitingVideoCC = -1, this.bufferedTrack = null, this.switchingTrack = null, this.trackId = -1, this.waitingData = null, this.mainDetails = null, this.flushing = !1, this.bufferFlushed = !1, this.cachedTrackLoadedData = null, this._registerListeners();
	}
	onHandlerDestroying() {
		this._unregisterListeners(), super.onHandlerDestroying(), this.mainDetails = null, this.bufferedTrack = null, this.switchingTrack = null;
	}
	_registerListeners() {
		let { hls: e } = this;
		e.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.LEVEL_LOADED, this.onLevelLoaded, this), e.on(a.AUDIO_TRACKS_UPDATED, this.onAudioTracksUpdated, this), e.on(a.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this), e.on(a.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this), e.on(a.ERROR, this.onError, this), e.on(a.BUFFER_RESET, this.onBufferReset, this), e.on(a.BUFFER_CREATED, this.onBufferCreated, this), e.on(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.on(a.BUFFER_FLUSHED, this.onBufferFlushed, this), e.on(a.INIT_PTS_FOUND, this.onInitPtsFound, this), e.on(a.FRAG_BUFFERED, this.onFragBuffered, this);
	}
	_unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.LEVEL_LOADED, this.onLevelLoaded, this), e.off(a.AUDIO_TRACKS_UPDATED, this.onAudioTracksUpdated, this), e.off(a.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this), e.off(a.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this), e.off(a.ERROR, this.onError, this), e.off(a.BUFFER_RESET, this.onBufferReset, this), e.off(a.BUFFER_CREATED, this.onBufferCreated, this), e.off(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.off(a.BUFFER_FLUSHED, this.onBufferFlushed, this), e.off(a.INIT_PTS_FOUND, this.onInitPtsFound, this), e.off(a.FRAG_BUFFERED, this.onFragBuffered, this);
	}
	onInitPtsFound(e, { frag: t, id: n, initPTS: r, timescale: i }) {
		if (n === "main") {
			let e = t.cc;
			this.initPTS[t.cc] = {
				baseTime: r,
				timescale: i
			}, this.log(`InitPTS for cc: ${e} found from main: ${r}`), this.videoTrackCC = e, this.state === U.WAITING_INIT_PTS && this.tick();
		}
	}
	startLoad(e) {
		if (!this.levels) {
			this.startPosition = e, this.state = U.STOPPED;
			return;
		}
		let t = this.lastCurrentTime;
		this.stopLoad(), this.setInterval(Me), t > 0 && e === -1 ? (this.log(`Override startPosition with lastCurrentTime @${t.toFixed(3)}`), e = t, this.state = U.IDLE) : (this.loadedmetadata = !1, this.state = U.WAITING_TRACK), this.nextLoadPosition = this.startPosition = this.lastCurrentTime = e, this.tick();
	}
	doTick() {
		switch (this.state) {
			case U.IDLE:
				this.doTickIdle();
				break;
			case U.WAITING_TRACK: {
				let { levels: e, trackId: t } = this, n = e?.[t]?.details;
				if (n) {
					if (this.waitForCdnTuneIn(n)) break;
					this.state = U.WAITING_INIT_PTS;
				}
				break;
			}
			case U.FRAG_LOADING_WAITING_RETRY: {
				var e;
				let t = performance.now(), n = this.retryDate;
				if (!n || t >= n || (e = this.media) != null && e.seeking) {
					let { levels: e, trackId: t } = this;
					this.log("RetryDate reached, switch back to IDLE state"), this.resetStartWhenNotLoaded(e?.[t] || null), this.state = U.IDLE;
				}
				break;
			}
			case U.WAITING_INIT_PTS: {
				let e = this.waitingData;
				if (e) {
					let { frag: t, part: n, cache: r, complete: i } = e;
					if (this.initPTS[t.cc] !== void 0) {
						this.waitingData = null, this.waitingVideoCC = -1, this.state = U.FRAG_LOADING;
						let e = {
							frag: t,
							part: n,
							payload: r.flush(),
							networkDetails: null
						};
						this._handleFragmentLoadProgress(e), i && super._handleFragmentLoadComplete(e);
					} else if (this.videoTrackCC !== this.waitingVideoCC) this.log(`Waiting fragment cc (${t.cc}) cancelled because video is at cc ${this.videoTrackCC}`), this.clearWaitingFragment();
					else {
						let e = this.getLoadPosition(), n = H.bufferInfo(this.mediaBuffer, e, this.config.maxBufferHole);
						fragmentWithinToleranceTest(n.end, this.config.maxFragLookUpTolerance, t) < 0 && (this.log(`Waiting fragment cc (${t.cc}) @ ${t.start} cancelled because another fragment at ${n.end} is needed`), this.clearWaitingFragment());
					}
				} else this.state = U.IDLE;
			}
		}
		this.onTickEnd();
	}
	clearWaitingFragment() {
		let e = this.waitingData;
		e && (this.fragmentTracker.removeFragment(e.frag), this.waitingData = null, this.waitingVideoCC = -1, this.state = U.IDLE);
	}
	resetLoadingState() {
		this.clearWaitingFragment(), super.resetLoadingState();
	}
	onTickEnd() {
		let { media: e } = this;
		e != null && e.readyState && (this.lastCurrentTime = e.currentTime);
	}
	doTickIdle() {
		let { hls: e, levels: t, media: n, trackId: r } = this, i = e.config;
		if (!n && (this.startFragRequested || !i.startFragPrefetch) || !(t != null && t[r])) return;
		let o = t[r], s = o.details;
		if (!s || s.live && this.levelLastLoaded !== o || this.waitForCdnTuneIn(s)) {
			this.state = U.WAITING_TRACK;
			return;
		}
		let c = this.mediaBuffer ? this.mediaBuffer : this.media;
		this.bufferFlushed && c && (this.bufferFlushed = !1, this.afterBufferFlushed(c, h.AUDIO, I.AUDIO));
		let l = this.getFwdBufferInfo(c, I.AUDIO);
		if (l === null) return;
		let { bufferedTrack: u, switchingTrack: d } = this;
		if (!d && this._streamEnded(l, s)) {
			e.trigger(a.BUFFER_EOS, { type: "audio" }), this.state = U.ENDED;
			return;
		}
		let f = this.getFwdBufferInfo(this.videoBuffer ? this.videoBuffer : this.media, I.MAIN), p = l.len, m = this.getMaxBufferLength(f?.len), g = s.fragments, _ = g[0].start, v = this.flushing ? this.getLoadPosition() : l.end;
		if (d && n) {
			let e = this.getLoadPosition();
			u && !mediaAttributesIdentical(d.attrs, u.attrs) && (v = e), s.PTSKnown && e < _ && (l.end > _ || l.nextStart) && (this.log("Alt audio track ahead of main track, seek to start of alt audio track"), n.currentTime = _ + .05);
		}
		if (p >= m && !d && v < g[g.length - 1].start) return;
		let y = this.getNextFragment(v, s), b = !1;
		if (y && this.isLoopLoading(y, v) && (b = !!y.gap, y = this.getNextFragmentLoopLoading(y, s, l, I.MAIN, m)), !y) {
			this.bufferFlushed = !0;
			return;
		}
		let x = f && y.start > f.end + s.targetduration;
		if (x || !(f != null && f.len) && l.len) {
			let e = this.getAppendedFrag(y.start, I.MAIN);
			if (e === null || (b ||= !!e.gap || !!x && f.len === 0, x && !b || b && l.nextStart && l.nextStart < e.end)) return;
		}
		this.loadFragment(y, o, v);
	}
	getMaxBufferLength(e) {
		let t = super.getMaxBufferLength();
		return e ? Math.min(Math.max(t, e), this.config.maxMaxBufferLength) : t;
	}
	onMediaDetaching() {
		this.videoBuffer = null, this.bufferFlushed = this.flushing = !1, super.onMediaDetaching();
	}
	onAudioTracksUpdated(e, { audioTracks: t }) {
		this.resetTransmuxer(), this.levels = t.map((e) => new Level(e));
	}
	onAudioTrackSwitching(e, t) {
		let n = !!t.url;
		this.trackId = t.id;
		let { fragCurrent: r } = this;
		r && (r.abortRequests(), this.removeUnbufferedFrags(r.start)), this.resetLoadingState(), n ? this.setInterval(Me) : this.resetTransmuxer(), n ? (this.switchingTrack = t, this.state = U.IDLE, this.flushAudioIfNeeded(t)) : (this.switchingTrack = null, this.bufferedTrack = t, this.state = U.STOPPED), this.tick();
	}
	onManifestLoading() {
		this.fragmentTracker.removeAllFragments(), this.startPosition = this.lastCurrentTime = 0, this.bufferFlushed = this.flushing = !1, this.levels = this.mainDetails = this.waitingData = this.bufferedTrack = this.cachedTrackLoadedData = this.switchingTrack = null, this.startFragRequested = !1, this.trackId = this.videoTrackCC = this.waitingVideoCC = -1;
	}
	onLevelLoaded(e, t) {
		this.mainDetails = t.details, this.cachedTrackLoadedData !== null && (this.hls.trigger(a.AUDIO_TRACK_LOADED, this.cachedTrackLoadedData), this.cachedTrackLoadedData = null);
	}
	onAudioTrackLoaded(e, t) {
		var n;
		if (this.mainDetails == null) {
			this.cachedTrackLoadedData = t;
			return;
		}
		let { levels: r } = this, { details: i, id: a } = t;
		if (!r) {
			this.warn(`Audio tracks were reset while loading level ${a}`);
			return;
		}
		this.log(`Audio track ${a} loaded [${i.startSN},${i.endSN}]${i.lastPartSn ? `[part-${i.lastPartSn}-${i.lastPartIndex}]` : ""},duration:${i.totalduration}`);
		let o = r[a], s = 0;
		if (i.live || (n = o.details) != null && n.live) {
			this.checkLiveUpdate(i);
			let e = this.mainDetails;
			if (i.deltaUpdateFailed || !e) return;
			!o.details && i.hasProgramDateTime && e.hasProgramDateTime ? (alignMediaPlaylistByPDT(i, e), s = i.fragments[0].start) : s = this.alignPlaylists(i, o.details, this.levelLastLoaded?.details);
		}
		o.details = i, this.levelLastLoaded = o, !this.startFragRequested && (this.mainDetails || !i.live) && this.setStartPosition(this.mainDetails || i, s), this.state === U.WAITING_TRACK && !this.waitForCdnTuneIn(i) && (this.state = U.IDLE), this.tick();
	}
	_handleFragmentLoadProgress(e) {
		let { frag: t, part: n, payload: r } = e, { config: i, trackId: a, levels: o } = this;
		if (!o) {
			this.warn(`Audio tracks were reset while fragment load was in progress. Fragment ${t.sn} of level ${t.level} will not be buffered`);
			return;
		}
		let s = o[a];
		if (!s) {
			this.warn("Audio track is undefined on fragment load progress");
			return;
		}
		let c = s.details;
		if (!c) {
			this.warn("Audio track details undefined on fragment load progress"), this.removeUnbufferedFrags(t.start);
			return;
		}
		let l = i.defaultAudioCodec || s.audioCodec || "mp4a.40.2", u = this.transmuxer;
		u ||= this.transmuxer = new TransmuxerInterface(this.hls, I.AUDIO, this._handleTransmuxComplete.bind(this), this._handleTransmuxerFlush.bind(this));
		let d = this.initPTS[t.cc], f = t.initSegment?.data;
		if (d !== void 0) {
			let e = n ? n.index : -1, i = e !== -1, a = new ChunkMetadata(t.level, t.sn, t.stats.chunkCount, r.byteLength, e, i);
			u.push(r, f, l, "", t, n, c.totalduration, !1, a, d);
		} else {
			this.log(`Unknown video PTS for cc ${t.cc}, waiting for video PTS before demuxing audio frag ${t.sn} of [${c.startSN} ,${c.endSN}],track ${a}`);
			let { cache: e } = this.waitingData = this.waitingData || {
				frag: t,
				part: n,
				cache: new ChunkCache(),
				complete: !1
			};
			e.push(new Uint8Array(r)), this.waitingVideoCC = this.videoTrackCC, this.state = U.WAITING_INIT_PTS;
		}
	}
	_handleFragmentLoadComplete(e) {
		if (this.waitingData) {
			this.waitingData.complete = !0;
			return;
		}
		super._handleFragmentLoadComplete(e);
	}
	onBufferReset() {
		this.mediaBuffer = this.videoBuffer = null, this.loadedmetadata = !1;
	}
	onBufferCreated(e, t) {
		let n = t.tracks.audio;
		n && (this.mediaBuffer = n.buffer || null), t.tracks.video && (this.videoBuffer = t.tracks.video.buffer || null);
	}
	onFragBuffered(e, t) {
		let { frag: n, part: r } = t;
		if (n.type !== I.AUDIO) {
			if (!this.loadedmetadata && n.type === I.MAIN) {
				let e = this.videoBuffer || this.media;
				e && H.getBuffered(e).length && (this.loadedmetadata = !0);
			}
			return;
		}
		if (this.fragContextChanged(n)) {
			this.warn(`Fragment ${n.sn}${r ? " p: " + r.index : ""} of level ${n.level} finished buffering, but was aborted. state: ${this.state}, audioSwitch: ${this.switchingTrack ? this.switchingTrack.name : "false"}`);
			return;
		}
		if (n.sn !== "initSegment") {
			this.fragPrevious = n;
			let e = this.switchingTrack;
			e && (this.bufferedTrack = e, this.switchingTrack = null, this.hls.trigger(a.AUDIO_TRACK_SWITCHED, _objectSpread2({}, e)));
		}
		this.fragBufferedComplete(n, r);
	}
	onError(e, t) {
		if (t.fatal) {
			this.state = U.ERROR;
			return;
		}
		switch (t.details) {
			case s.FRAG_GAP:
			case s.FRAG_PARSING_ERROR:
			case s.FRAG_DECRYPT_ERROR:
			case s.FRAG_LOAD_ERROR:
			case s.FRAG_LOAD_TIMEOUT:
			case s.KEY_LOAD_ERROR:
			case s.KEY_LOAD_TIMEOUT:
				this.onFragmentOrKeyLoadError(I.AUDIO, t);
				break;
			case s.AUDIO_TRACK_LOAD_ERROR:
			case s.AUDIO_TRACK_LOAD_TIMEOUT:
			case s.LEVEL_PARSING_ERROR:
				!t.levelRetry && this.state === U.WAITING_TRACK && t.context?.type === F.AUDIO_TRACK && (this.state = U.IDLE);
				break;
			case s.BUFFER_APPEND_ERROR:
			case s.BUFFER_FULL_ERROR:
				if (!t.parent || t.parent !== "audio") return;
				if (t.details === s.BUFFER_APPEND_ERROR) {
					this.resetLoadingState();
					return;
				}
				this.reduceLengthAndFlushBuffer(t) && (this.bufferedTrack = null, super.flushMainBuffer(0, Infinity, "audio"));
				break;
			case s.INTERNAL_EXCEPTION: this.recoverWorkerError(t);
		}
	}
	onBufferFlushing(e, { type: t }) {
		t !== h.VIDEO && (this.flushing = !0);
	}
	onBufferFlushed(e, { type: t }) {
		if (t !== h.VIDEO) {
			this.flushing = !1, this.bufferFlushed = !0, this.state === U.ENDED && (this.state = U.IDLE);
			let e = this.mediaBuffer || this.media;
			e && (this.afterBufferFlushed(e, t, I.AUDIO), this.tick());
		}
	}
	_handleTransmuxComplete(e) {
		var t;
		let n = "audio", { hls: r } = this, { remuxResult: i, chunkMeta: o } = e, s = this.getCurrentContext(o);
		if (!s) {
			this.resetWhenMissingContext(o);
			return;
		}
		let { frag: c, part: l, level: u } = s, { details: d } = u, { audio: f, text: p, id3: m, initSegment: g } = i;
		if (this.fragContextChanged(c) || !d) {
			this.fragmentTracker.removeFragment(c);
			return;
		}
		if (this.state = U.PARSING, this.switchingTrack && f && this.completeAudioSwitch(this.switchingTrack), g != null && g.tracks) {
			let e = c.initSegment || c;
			this._bufferInitSegment(u, g.tracks, e, o), r.trigger(a.FRAG_PARSING_INIT_SEGMENT, {
				frag: e,
				id: n,
				tracks: g.tracks
			});
		}
		if (f) {
			let { startPTS: e, endPTS: t, startDTS: n, endDTS: r } = f;
			l && (l.elementaryStreams[h.AUDIO] = {
				startPTS: e,
				endPTS: t,
				startDTS: n,
				endDTS: r
			}), c.setElementaryStreamInfo(h.AUDIO, e, t, n, r), this.bufferFragmentData(f, c, l, o);
		}
		if (m != null && (t = m.samples) != null && t.length) {
			let e = _extends({
				id: n,
				frag: c,
				details: d
			}, m);
			r.trigger(a.FRAG_PARSING_METADATA, e);
		}
		if (p) {
			let e = _extends({
				id: n,
				frag: c,
				details: d
			}, p);
			r.trigger(a.FRAG_PARSING_USERDATA, e);
		}
	}
	_bufferInitSegment(e, t, n, r) {
		if (this.state !== U.PARSING) return;
		t.video && delete t.video;
		let i = t.audio;
		if (!i) return;
		i.id = "audio";
		let o = e.audioCodec;
		this.log(`Init audio buffer, container:${i.container}, codecs[level/parsed]=[${o}/${i.codec}]`), o && o.split(",").length === 1 && (i.levelCodec = o), this.hls.trigger(a.BUFFER_CODECS, t);
		let s = i.initSegment;
		if (s != null && s.byteLength) {
			let e = {
				type: "audio",
				frag: n,
				part: null,
				chunkMeta: r,
				parent: n.type,
				data: s
			};
			this.hls.trigger(a.BUFFER_APPENDING, e);
		}
		this.tickImmediate();
	}
	loadFragment(e, t, n) {
		let r = this.fragmentTracker.getState(e);
		if (this.fragCurrent = e, this.switchingTrack || r === V.NOT_LOADED || r === V.PARTIAL) {
			var i;
			if (e.sn === "initSegment") this._loadInitSegment(e, t);
			else if ((i = t.details) != null && i.live && !this.initPTS[e.cc]) {
				this.log(`Waiting for video PTS in continuity counter ${e.cc} of live stream before loading audio fragment ${e.sn} of level ${this.trackId}`), this.state = U.WAITING_INIT_PTS;
				let n = this.mainDetails;
				n && n.fragments[0].start !== t.details.fragments[0].start && alignMediaPlaylistByPDT(t.details, n);
			} else this.startFragRequested = !0, super.loadFragment(e, t, n);
		} else this.clearTrackerIfNeeded(e);
	}
	flushAudioIfNeeded(e) {
		let { media: t, bufferedTrack: n } = this, r = n?.attrs, i = e.attrs;
		t && r && (r.CHANNELS !== i.CHANNELS || n.name !== e.name || n.lang !== e.lang) && (this.log("Switching audio track : flushing all audio"), super.flushMainBuffer(0, Infinity, "audio"), this.bufferedTrack = null);
	}
	completeAudioSwitch(e) {
		let { hls: t } = this;
		this.flushAudioIfNeeded(e), this.bufferedTrack = e, this.switchingTrack = null, t.trigger(a.AUDIO_TRACK_SWITCHED, _objectSpread2({}, e));
	}
}, AudioTrackController = class extends BasePlaylistController {
	constructor(e) {
		super(e, "[audio-track-controller]"), this.tracks = [], this.groupIds = null, this.tracksInGroup = [], this.trackId = -1, this.currentTrack = null, this.selectDefaultTrack = !0, this.registerListeners();
	}
	registerListeners() {
		let { hls: e } = this;
		e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_PARSED, this.onManifestParsed, this), e.on(a.LEVEL_LOADING, this.onLevelLoading, this), e.on(a.LEVEL_SWITCHING, this.onLevelSwitching, this), e.on(a.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this), e.on(a.ERROR, this.onError, this);
	}
	unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_PARSED, this.onManifestParsed, this), e.off(a.LEVEL_LOADING, this.onLevelLoading, this), e.off(a.LEVEL_SWITCHING, this.onLevelSwitching, this), e.off(a.AUDIO_TRACK_LOADED, this.onAudioTrackLoaded, this), e.off(a.ERROR, this.onError, this);
	}
	destroy() {
		this.unregisterListeners(), this.tracks.length = 0, this.tracksInGroup.length = 0, this.currentTrack = null, super.destroy();
	}
	onManifestLoading() {
		this.tracks = [], this.tracksInGroup = [], this.groupIds = null, this.currentTrack = null, this.trackId = -1, this.selectDefaultTrack = !0;
	}
	onManifestParsed(e, t) {
		this.tracks = t.audioTracks || [];
	}
	onAudioTrackLoaded(e, t) {
		let { id: n, groupId: r, details: i } = t, a = this.tracksInGroup[n];
		if (!a || a.groupId !== r) {
			this.warn(`Audio track with id:${n} and group:${r} not found in active group ${a?.groupId}`);
			return;
		}
		let o = a.details;
		a.details = t.details, this.log(`Audio track ${n} "${a.name}" lang:${a.lang} group:${r} loaded [${i.startSN}-${i.endSN}]`), n === this.trackId && this.playlistLoaded(n, t, o);
	}
	onLevelLoading(e, t) {
		this.switchLevel(t.level);
	}
	onLevelSwitching(e, t) {
		this.switchLevel(t.level);
	}
	switchLevel(e) {
		let t = this.hls.levels[e];
		if (!t) return;
		let n = t.audioGroups || null, r = this.groupIds, i = this.currentTrack;
		if (!n || r?.length !== n?.length || n != null && n.some((e) => r?.indexOf(e) === -1)) {
			this.groupIds = n, this.trackId = -1, this.currentTrack = null;
			let e = this.tracks.filter((e) => !n || n.indexOf(e.groupId) !== -1);
			if (e.length) this.selectDefaultTrack && !e.some((e) => e.default) && (this.selectDefaultTrack = !1), e.forEach((e, t) => {
				e.id = t;
			});
			else if (!i && !this.tracksInGroup.length) return;
			this.tracksInGroup = e;
			let t = this.hls.config.audioPreference;
			if (!i && t) {
				let n = findMatchingOption(t, e, audioMatchPredicate);
				if (n > -1) i = e[n];
				else {
					let e = findMatchingOption(t, this.tracks);
					i = this.tracks[e];
				}
			}
			let r = this.findTrackId(i);
			r === -1 && i && (r = this.findTrackId(null));
			let c = { audioTracks: e };
			this.log(`Updating audio tracks, ${e.length} track(s) found in group(s): ${n?.join(",")}`), this.hls.trigger(a.AUDIO_TRACKS_UPDATED, c);
			let l = this.trackId;
			if (r !== -1 && l === -1) this.setAudioTrack(r);
			else if (e.length && l === -1) {
				let t = /* @__PURE__ */ Error(`No audio track selected for current audio group-ID(s): ${this.groupIds?.join(",")} track count: ${e.length}`);
				this.warn(t.message), this.hls.trigger(a.ERROR, {
					type: o.MEDIA_ERROR,
					details: s.AUDIO_TRACK_LOAD_ERROR,
					fatal: !0,
					error: t
				});
			}
		} else this.shouldReloadPlaylist(i) && this.setAudioTrack(this.trackId);
	}
	onError(e, t) {
		!t.fatal && t.context && t.context.type === F.AUDIO_TRACK && t.context.id === this.trackId && (!this.groupIds || this.groupIds.indexOf(t.context.groupId) !== -1) && (this.requestScheduled = -1, this.checkRetry(t));
	}
	get allAudioTracks() {
		return this.tracks;
	}
	get audioTracks() {
		return this.tracksInGroup;
	}
	get audioTrack() {
		return this.trackId;
	}
	set audioTrack(e) {
		this.selectDefaultTrack = !1, this.setAudioTrack(e);
	}
	setAudioOption(e) {
		let t = this.hls;
		if (t.config.audioPreference = e, e) {
			let n = this.allAudioTracks;
			if (this.selectDefaultTrack = !1, n.length) {
				let r = this.currentTrack;
				if (r && matchesOption(e, r, audioMatchPredicate)) return r;
				let i = findMatchingOption(e, this.tracksInGroup, audioMatchPredicate);
				if (i > -1) {
					let e = this.tracksInGroup[i];
					return this.setAudioTrack(i), e;
				}
				if (r) {
					let r = t.loadLevel;
					r === -1 && (r = t.firstAutoLevel);
					let i = findClosestLevelWithAudioGroup(e, t.levels, n, r, audioMatchPredicate);
					if (i === -1) return null;
					t.nextLoadLevel = i;
				}
				if (e.channels || e.audioCodec) {
					let t = findMatchingOption(e, n);
					if (t > -1) return n[t];
				}
			}
		}
		return null;
	}
	setAudioTrack(e) {
		let t = this.tracksInGroup;
		if (e < 0 || e >= t.length) {
			this.warn(`Invalid audio track id: ${e}`);
			return;
		}
		this.clearTimer(), this.selectDefaultTrack = !1;
		let n = this.currentTrack, r = t[e], i = r.details && !r.details.live;
		if (e === this.trackId && r === n && i || (this.log(`Switching to audio-track ${e} "${r.name}" lang:${r.lang} group:${r.groupId} channels:${r.channels}`), this.trackId = e, this.currentTrack = r, this.hls.trigger(a.AUDIO_TRACK_SWITCHING, _objectSpread2({}, r)), i)) return;
		let o = this.switchParams(r.url, n?.details, r.details);
		this.loadPlaylist(o);
	}
	findTrackId(e) {
		let t = this.tracksInGroup;
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			if ((!this.selectDefaultTrack || r.default) && (!e || matchesOption(e, r, audioMatchPredicate))) return n;
		}
		if (e) {
			let { name: n, lang: r, assocLang: i, characteristics: a, audioCodec: o, channels: s } = e;
			for (let e = 0; e < t.length; e++) {
				let c = t[e];
				if (matchesOption({
					name: n,
					lang: r,
					assocLang: i,
					characteristics: a,
					audioCodec: o,
					channels: s
				}, c, audioMatchPredicate)) return e;
			}
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				if (mediaAttributesIdentical(e.attrs, r.attrs, [
					"LANGUAGE",
					"ASSOC-LANGUAGE",
					"CHARACTERISTICS"
				])) return n;
			}
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				if (mediaAttributesIdentical(e.attrs, r.attrs, ["LANGUAGE"])) return n;
			}
		}
		return -1;
	}
	loadPlaylist(e) {
		let t = this.currentTrack;
		if (this.shouldLoadPlaylist(t) && t) {
			super.loadPlaylist();
			let n = t.id, r = t.groupId, i = t.url;
			if (e) try {
				i = e.addDirectives(i);
			} catch (e) {
				this.warn(`Could not construct new URL with HLS Delivery Directives: ${e}`);
			}
			this.log(`loading audio-track playlist ${n} "${t.name}" lang:${t.lang} group:${r}`), this.clearTimer(), this.hls.trigger(a.AUDIO_TRACK_LOADING, {
				url: i,
				id: n,
				groupId: r,
				deliveryDirectives: e || null
			});
		}
	}
}, Ne = 500, SubtitleStreamController = class extends BaseStreamController {
	constructor(e, t, n) {
		super(e, t, n, "[subtitle-stream-controller]", I.SUBTITLE), this.currentTrackId = -1, this.tracksBuffered = [], this.mainDetails = null, this._registerListeners();
	}
	onHandlerDestroying() {
		this._unregisterListeners(), super.onHandlerDestroying(), this.mainDetails = null;
	}
	_registerListeners() {
		let { hls: e } = this;
		e.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.LEVEL_LOADED, this.onLevelLoaded, this), e.on(a.ERROR, this.onError, this), e.on(a.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this), e.on(a.SUBTITLE_TRACK_SWITCH, this.onSubtitleTrackSwitch, this), e.on(a.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this), e.on(a.SUBTITLE_FRAG_PROCESSED, this.onSubtitleFragProcessed, this), e.on(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.on(a.FRAG_BUFFERED, this.onFragBuffered, this);
	}
	_unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.LEVEL_LOADED, this.onLevelLoaded, this), e.off(a.ERROR, this.onError, this), e.off(a.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this), e.off(a.SUBTITLE_TRACK_SWITCH, this.onSubtitleTrackSwitch, this), e.off(a.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this), e.off(a.SUBTITLE_FRAG_PROCESSED, this.onSubtitleFragProcessed, this), e.off(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.off(a.FRAG_BUFFERED, this.onFragBuffered, this);
	}
	startLoad(e) {
		this.stopLoad(), this.state = U.IDLE, this.setInterval(Ne), this.nextLoadPosition = this.startPosition = this.lastCurrentTime = e, this.tick();
	}
	onManifestLoading() {
		this.mainDetails = null, this.fragmentTracker.removeAllFragments();
	}
	onMediaDetaching() {
		this.tracksBuffered = [], super.onMediaDetaching();
	}
	onLevelLoaded(e, t) {
		this.mainDetails = t.details;
	}
	onSubtitleFragProcessed(e, t) {
		let { frag: n, success: r } = t;
		if (this.fragPrevious = n, this.state = U.IDLE, !r) return;
		let i = this.tracksBuffered[this.currentTrackId];
		if (!i) return;
		let a, o = n.start;
		for (let e = 0; e < i.length; e++) if (o >= i[e].start && o <= i[e].end) {
			a = i[e];
			break;
		}
		let s = n.start + n.duration;
		a ? a.end = s : (a = {
			start: o,
			end: s
		}, i.push(a)), this.fragmentTracker.fragBuffered(n), this.fragBufferedComplete(n, null);
	}
	onBufferFlushing(e, t) {
		let { startOffset: n, endOffset: r } = t;
		if (n === 0 && r !== Infinity) {
			let e = r - 1;
			if (e <= 0) return;
			t.endOffsetSubtitles = Math.max(0, e), this.tracksBuffered.forEach((t) => {
				for (let n = 0; n < t.length;) {
					if (t[n].end <= e) {
						t.shift();
						continue;
					}
					if (t[n].start < e) t[n].start = e;
					else break;
					n++;
				}
			}), this.fragmentTracker.removeFragmentsInRange(n, e, I.SUBTITLE);
		}
	}
	onFragBuffered(e, t) {
		if (!this.loadedmetadata && t.frag.type === I.MAIN) {
			var n;
			(n = this.media) != null && n.buffered.length && (this.loadedmetadata = !0);
		}
	}
	onError(e, t) {
		let n = t.frag;
		n?.type === I.SUBTITLE && (t.details === s.FRAG_GAP && this.fragmentTracker.fragBuffered(n, !0), this.fragCurrent && this.fragCurrent.abortRequests(), this.state !== U.STOPPED && (this.state = U.IDLE));
	}
	onSubtitleTracksUpdated(e, { subtitleTracks: t }) {
		if (this.levels && subtitleOptionsIdentical(this.levels, t)) {
			this.levels = t.map((e) => new Level(e));
			return;
		}
		this.tracksBuffered = [], this.levels = t.map((e) => {
			let t = new Level(e);
			return this.tracksBuffered[t.id] = [], t;
		}), this.fragmentTracker.removeFragmentsInRange(0, Infinity, I.SUBTITLE), this.fragPrevious = null, this.mediaBuffer = null;
	}
	onSubtitleTrackSwitch(e, t) {
		var n;
		if (this.currentTrackId = t.id, !((n = this.levels) != null && n.length) || this.currentTrackId === -1) {
			this.clearInterval();
			return;
		}
		let r = this.levels[this.currentTrackId];
		this.mediaBuffer = r != null && r.details ? this.mediaBufferTimeRanges : null, r && this.setInterval(Ne);
	}
	onSubtitleTrackLoaded(e, t) {
		var n;
		let { currentTrackId: r, levels: i } = this, { details: a, id: o } = t;
		if (!i) {
			this.warn(`Subtitle tracks were reset while loading level ${o}`);
			return;
		}
		let s = i[o];
		if (o >= i.length || !s) return;
		this.log(`Subtitle track ${o} loaded [${a.startSN},${a.endSN}]${a.lastPartSn ? `[part-${a.lastPartSn}-${a.lastPartIndex}]` : ""},duration:${a.totalduration}`), this.mediaBuffer = this.mediaBufferTimeRanges;
		let c = 0;
		if (a.live || (n = s.details) != null && n.live) {
			let e = this.mainDetails;
			if (a.deltaUpdateFailed || !e) return;
			let t = e.fragments[0];
			s.details ? (c = this.alignPlaylists(a, s.details, this.levelLastLoaded?.details), c === 0 && t && (c = t.start, addSliding(a, c))) : a.hasProgramDateTime && e.hasProgramDateTime ? (alignMediaPlaylistByPDT(a, e), c = a.fragments[0].start) : t && (c = t.start, addSliding(a, c));
		}
		s.details = a, this.levelLastLoaded = s, o === r && (!this.startFragRequested && (this.mainDetails || !a.live) && this.setStartPosition(this.mainDetails || a, c), this.tick(), a.live && !this.fragCurrent && this.media && this.state === U.IDLE && (findFragmentByPTS(null, a.fragments, this.media.currentTime, 0) || (this.warn("Subtitle playlist not aligned with playback"), s.details = void 0)));
	}
	_handleFragmentLoadComplete(e) {
		let { frag: t, payload: n } = e, r = t.decryptdata, i = this.hls;
		if (!this.fragContextChanged(t) && n && n.byteLength > 0 && r != null && r.key && r.iv && r.method === "AES-128") {
			let e = performance.now();
			this.decrypter.decrypt(new Uint8Array(n), r.key.buffer, r.iv.buffer).catch((e) => {
				throw i.trigger(a.ERROR, {
					type: o.MEDIA_ERROR,
					details: s.FRAG_DECRYPT_ERROR,
					fatal: !1,
					error: e,
					reason: e.message,
					frag: t
				}), e;
			}).then((n) => {
				let r = performance.now();
				i.trigger(a.FRAG_DECRYPTED, {
					frag: t,
					payload: n,
					stats: {
						tstart: e,
						tdecrypt: r
					}
				});
			}).catch((e) => {
				this.warn(`${e.name}: ${e.message}`), this.state = U.IDLE;
			});
		}
	}
	doTick() {
		if (!this.media) {
			this.state = U.IDLE;
			return;
		}
		if (this.state === U.IDLE) {
			let { currentTrackId: e, levels: t } = this, n = t?.[e];
			if (!n || !t.length || !n.details) return;
			let { config: r } = this, i = this.getLoadPosition(), { end: a, len: o } = H.bufferedInfo(this.tracksBuffered[this.currentTrackId] || [], i, r.maxBufferHole), s = this.getFwdBufferInfo(this.media, I.MAIN), c = n.details;
			if (o > this.getMaxBufferLength(s?.len) + c.levelTargetDuration) return;
			let l = c.fragments, u = l.length, d = c.edge, f = null, p = this.fragPrevious;
			if (a < d) {
				let e = r.maxFragLookUpTolerance, t = a > d - e ? 0 : e;
				f = findFragmentByPTS(p, l, Math.max(l[0].start, a), t), !f && p && p.start < l[0].start && (f = l[0]);
			} else f = l[u - 1];
			if (!f) return;
			if (f = this.mapToInitFragWhenRequired(f), f.sn !== "initSegment") {
				let e = l[f.sn - c.startSN - 1];
				e && e.cc === f.cc && this.fragmentTracker.getState(e) === V.NOT_LOADED && (f = e);
			}
			this.fragmentTracker.getState(f) === V.NOT_LOADED && this.loadFragment(f, n, a);
		}
	}
	getMaxBufferLength(e) {
		let t = super.getMaxBufferLength();
		return e ? Math.max(t, e) : t;
	}
	loadFragment(e, t, n) {
		this.fragCurrent = e, e.sn === "initSegment" ? this._loadInitSegment(e, t) : (this.startFragRequested = !0, super.loadFragment(e, t, n));
	}
	get mediaBufferTimeRanges() {
		return new BufferableInstance(this.tracksBuffered[this.currentTrackId] || []);
	}
}, BufferableInstance = class {
	constructor(e) {
		this.buffered = void 0;
		let getRange = (t, n, r) => {
			if (n >>>= 0, n > r - 1) throw new DOMException(`Failed to execute '${t}' on 'TimeRanges': The index provided (${n}) is greater than the maximum bound (${r})`);
			return e[n][t];
		};
		this.buffered = {
			get length() {
				return e.length;
			},
			end(t) {
				return getRange("end", t, e.length);
			},
			start(t) {
				return getRange("start", t, e.length);
			}
		};
	}
}, SubtitleTrackController = class extends BasePlaylistController {
	constructor(e) {
		super(e, "[subtitle-track-controller]"), this.media = null, this.tracks = [], this.groupIds = null, this.tracksInGroup = [], this.trackId = -1, this.currentTrack = null, this.selectDefaultTrack = !0, this.queuedDefaultTrack = -1, this.asyncPollTrackChange = () => this.pollTrackChange(0), this.useTextTrackPolling = !1, this.subtitlePollingInterval = -1, this._subtitleDisplay = !0, this.onTextTracksChanged = () => {
			if (this.useTextTrackPolling || self.clearInterval(this.subtitlePollingInterval), !this.media || !this.hls.config.renderTextTracksNatively) return;
			let e = null, t = filterSubtitleTracks(this.media.textTracks);
			for (let n = 0; n < t.length; n++) if (t[n].mode === "hidden") e = t[n];
			else if (t[n].mode === "showing") {
				e = t[n];
				break;
			}
			let n = this.findTrackForTextTrack(e);
			this.subtitleTrack !== n && this.setSubtitleTrack(n);
		}, this.registerListeners();
	}
	destroy() {
		this.unregisterListeners(), this.tracks.length = 0, this.tracksInGroup.length = 0, this.currentTrack = null, this.onTextTracksChanged = this.asyncPollTrackChange = null, super.destroy();
	}
	get subtitleDisplay() {
		return this._subtitleDisplay;
	}
	set subtitleDisplay(e) {
		this._subtitleDisplay = e, this.trackId > -1 && this.toggleTrackModes();
	}
	registerListeners() {
		let { hls: e } = this;
		e.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_PARSED, this.onManifestParsed, this), e.on(a.LEVEL_LOADING, this.onLevelLoading, this), e.on(a.LEVEL_SWITCHING, this.onLevelSwitching, this), e.on(a.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this), e.on(a.ERROR, this.onError, this);
	}
	unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_PARSED, this.onManifestParsed, this), e.off(a.LEVEL_LOADING, this.onLevelLoading, this), e.off(a.LEVEL_SWITCHING, this.onLevelSwitching, this), e.off(a.SUBTITLE_TRACK_LOADED, this.onSubtitleTrackLoaded, this), e.off(a.ERROR, this.onError, this);
	}
	onMediaAttached(e, t) {
		this.media = t.media, this.media && (this.queuedDefaultTrack > -1 && (this.subtitleTrack = this.queuedDefaultTrack, this.queuedDefaultTrack = -1), this.useTextTrackPolling = !(this.media.textTracks && "onchange" in this.media.textTracks), this.useTextTrackPolling ? this.pollTrackChange(500) : this.media.textTracks.addEventListener("change", this.asyncPollTrackChange));
	}
	pollTrackChange(e) {
		self.clearInterval(this.subtitlePollingInterval), this.subtitlePollingInterval = self.setInterval(this.onTextTracksChanged, e);
	}
	onMediaDetaching() {
		this.media &&= (self.clearInterval(this.subtitlePollingInterval), this.useTextTrackPolling || this.media.textTracks.removeEventListener("change", this.asyncPollTrackChange), this.trackId > -1 && (this.queuedDefaultTrack = this.trackId), filterSubtitleTracks(this.media.textTracks).forEach((e) => {
			clearCurrentCues(e);
		}), this.subtitleTrack = -1, null);
	}
	onManifestLoading() {
		this.tracks = [], this.groupIds = null, this.tracksInGroup = [], this.trackId = -1, this.currentTrack = null, this.selectDefaultTrack = !0;
	}
	onManifestParsed(e, t) {
		this.tracks = t.subtitleTracks;
	}
	onSubtitleTrackLoaded(e, t) {
		let { id: n, groupId: r, details: i } = t, a = this.tracksInGroup[n];
		if (!a || a.groupId !== r) {
			this.warn(`Subtitle track with id:${n} and group:${r} not found in active group ${a?.groupId}`);
			return;
		}
		let o = a.details;
		a.details = t.details, this.log(`Subtitle track ${n} "${a.name}" lang:${a.lang} group:${r} loaded [${i.startSN}-${i.endSN}]`), n === this.trackId && this.playlistLoaded(n, t, o);
	}
	onLevelLoading(e, t) {
		this.switchLevel(t.level);
	}
	onLevelSwitching(e, t) {
		this.switchLevel(t.level);
	}
	switchLevel(e) {
		let t = this.hls.levels[e];
		if (!t) return;
		let n = t.subtitleGroups || null, r = this.groupIds, i = this.currentTrack;
		if (!n || r?.length !== n?.length || n != null && n.some((e) => r?.indexOf(e) === -1)) {
			this.groupIds = n, this.trackId = -1, this.currentTrack = null;
			let e = this.tracks.filter((e) => !n || n.indexOf(e.groupId) !== -1);
			if (e.length) this.selectDefaultTrack && !e.some((e) => e.default) && (this.selectDefaultTrack = !1), e.forEach((e, t) => {
				e.id = t;
			});
			else if (!i && !this.tracksInGroup.length) return;
			this.tracksInGroup = e;
			let t = this.hls.config.subtitlePreference;
			if (!i && t) {
				this.selectDefaultTrack = !1;
				let n = findMatchingOption(t, e);
				if (n > -1) i = e[n];
				else {
					let e = findMatchingOption(t, this.tracks);
					i = this.tracks[e];
				}
			}
			let r = this.findTrackId(i);
			r === -1 && i && (r = this.findTrackId(null));
			let o = { subtitleTracks: e };
			this.log(`Updating subtitle tracks, ${e.length} track(s) found in "${n?.join(",")}" group-id`), this.hls.trigger(a.SUBTITLE_TRACKS_UPDATED, o), r !== -1 && this.trackId === -1 && this.setSubtitleTrack(r);
		} else this.shouldReloadPlaylist(i) && this.setSubtitleTrack(this.trackId);
	}
	findTrackId(e) {
		let t = this.tracksInGroup, n = this.selectDefaultTrack;
		for (let r = 0; r < t.length; r++) {
			let i = t[r];
			if (!(n && !i.default || !n && !e) && (!e || matchesOption(i, e))) return r;
		}
		if (e) {
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				if (mediaAttributesIdentical(e.attrs, r.attrs, [
					"LANGUAGE",
					"ASSOC-LANGUAGE",
					"CHARACTERISTICS"
				])) return n;
			}
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				if (mediaAttributesIdentical(e.attrs, r.attrs, ["LANGUAGE"])) return n;
			}
		}
		return -1;
	}
	findTrackForTextTrack(e) {
		if (e) {
			let t = this.tracksInGroup;
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				if (subtitleTrackMatchesTextTrack(r, e)) return n;
			}
		}
		return -1;
	}
	onError(e, t) {
		!t.fatal && t.context && t.context.type === F.SUBTITLE_TRACK && t.context.id === this.trackId && (!this.groupIds || this.groupIds.indexOf(t.context.groupId) !== -1) && this.checkRetry(t);
	}
	get allSubtitleTracks() {
		return this.tracks;
	}
	get subtitleTracks() {
		return this.tracksInGroup;
	}
	get subtitleTrack() {
		return this.trackId;
	}
	set subtitleTrack(e) {
		this.selectDefaultTrack = !1, this.setSubtitleTrack(e);
	}
	setSubtitleOption(e) {
		if (this.hls.config.subtitlePreference = e, e) {
			let t = this.allSubtitleTracks;
			if (this.selectDefaultTrack = !1, t.length) {
				let n = this.currentTrack;
				if (n && matchesOption(e, n)) return n;
				let r = findMatchingOption(e, this.tracksInGroup);
				if (r > -1) {
					let e = this.tracksInGroup[r];
					return this.setSubtitleTrack(r), e;
				}
				if (n) return null;
				{
					let n = findMatchingOption(e, t);
					if (n > -1) return t[n];
				}
			}
		}
		return null;
	}
	loadPlaylist(e) {
		super.loadPlaylist();
		let t = this.currentTrack;
		if (this.shouldLoadPlaylist(t) && t) {
			let n = t.id, r = t.groupId, i = t.url;
			if (e) try {
				i = e.addDirectives(i);
			} catch (e) {
				this.warn(`Could not construct new URL with HLS Delivery Directives: ${e}`);
			}
			this.log(`Loading subtitle playlist for id ${n}`), this.hls.trigger(a.SUBTITLE_TRACK_LOADING, {
				url: i,
				id: n,
				groupId: r,
				deliveryDirectives: e || null
			});
		}
	}
	toggleTrackModes() {
		let { media: e } = this;
		if (!e) return;
		let t = filterSubtitleTracks(e.textTracks), n = this.currentTrack, r;
		if (n && (r = t.filter((e) => subtitleTrackMatchesTextTrack(n, e))[0], r || this.warn(`Unable to find subtitle TextTrack with name "${n.name}" and language "${n.lang}"`)), [].slice.call(t).forEach((e) => {
			e.mode !== "disabled" && e !== r && (e.mode = "disabled");
		}), r) {
			let e = this.subtitleDisplay ? "showing" : "hidden";
			r.mode !== e && (r.mode = e);
		}
	}
	setSubtitleTrack(e) {
		let t = this.tracksInGroup;
		if (!this.media) {
			this.queuedDefaultTrack = e;
			return;
		}
		if (e < -1 || e >= t.length || !n(e)) {
			this.warn(`Invalid subtitle track id: ${e}`);
			return;
		}
		this.clearTimer(), this.selectDefaultTrack = !1;
		let r = this.currentTrack, i = t[e] || null;
		if (this.trackId = e, this.currentTrack = i, this.toggleTrackModes(), !i) {
			this.hls.trigger(a.SUBTITLE_TRACK_SWITCH, { id: e });
			return;
		}
		let o = !!i.details && !i.details.live;
		if (e === this.trackId && i === r && o) return;
		this.log(`Switching to subtitle-track ${e}` + (i ? ` "${i.name}" lang:${i.lang} group:${i.groupId}` : ""));
		let { id: s, groupId: c = "", name: l, type: u, url: d } = i;
		this.hls.trigger(a.SUBTITLE_TRACK_SWITCH, {
			id: s,
			groupId: c,
			name: l,
			type: u,
			url: d
		});
		let f = this.switchParams(i.url, r?.details, i.details);
		this.loadPlaylist(f);
	}
}, BufferOperationQueue = class {
	constructor(e) {
		this.buffers = void 0, this.queues = {
			video: [],
			audio: [],
			audiovideo: []
		}, this.buffers = e;
	}
	append(e, t, n) {
		let r = this.queues[t];
		r.push(e), r.length === 1 && !n && this.executeNext(t);
	}
	insertAbort(e, t) {
		this.queues[t].unshift(e), this.executeNext(t);
	}
	appendBlocker(e) {
		let t, n = new Promise((e) => {
			t = e;
		}), r = {
			execute: t,
			onStart: () => {},
			onComplete: () => {},
			onError: () => {}
		};
		return this.append(r, e), n;
	}
	executeNext(e) {
		let t = this.queues[e];
		if (t.length) {
			let n = t[0];
			try {
				n.execute();
			} catch (t) {
				d.warn(`[buffer-operation-queue]: Exception executing "${e}" SourceBuffer operation: ${t}`), n.onError(t);
				let r = this.buffers[e];
				r != null && r.updating || this.shiftAndExecuteNext(e);
			}
		}
	}
	shiftAndExecuteNext(e) {
		this.queues[e].shift(), this.executeNext(e);
	}
	current(e) {
		return this.queues[e][0];
	}
}, Pe = /(avc[1234]|hvc1|hev1|dvh[1e]|vp09|av01)(?:\.[^.,]+)+/, BufferController = class {
	constructor(e) {
		this.details = null, this._objectUrl = null, this.operationQueue = void 0, this.listeners = void 0, this.hls = void 0, this.bufferCodecEventsExpected = 0, this._bufferCodecEventsTotal = 0, this.media = null, this.mediaSource = null, this.lastMpegAudioChunk = null, this.appendSource = void 0, this.appendErrors = {
			audio: 0,
			video: 0,
			audiovideo: 0
		}, this.tracks = {}, this.pendingTracks = {}, this.sourceBuffer = void 0, this.log = void 0, this.warn = void 0, this.error = void 0, this._onEndStreaming = (e) => {
			this.hls && this.hls.pauseBuffering();
		}, this._onStartStreaming = (e) => {
			this.hls && this.hls.resumeBuffering();
		}, this._onMediaSourceOpen = () => {
			let { media: e, mediaSource: t } = this;
			this.log("Media source opened"), e && (e.removeEventListener("emptied", this._onMediaEmptied), this.updateMediaElementDuration(), this.hls.trigger(a.MEDIA_ATTACHED, {
				media: e,
				mediaSource: t
			})), t && t.removeEventListener("sourceopen", this._onMediaSourceOpen), this.checkPendingTracks();
		}, this._onMediaSourceClose = () => {
			this.log("Media source closed");
		}, this._onMediaSourceEnded = () => {
			this.log("Media source ended");
		}, this._onMediaEmptied = () => {
			let { mediaSrc: e, _objectUrl: t } = this;
			e !== t && d.error(`Media element src was set while attaching MediaSource (${t} > ${e})`);
		}, this.hls = e;
		let t = "[buffer-controller]";
		this.appendSource = isManagedMediaSource(getMediaSource(e.config.preferManagedMediaSource)), this.log = d.log.bind(d, t), this.warn = d.warn.bind(d, t), this.error = d.error.bind(d, t), this._initSourceBuffer(), this.registerListeners();
	}
	hasSourceTypes() {
		return this.getSourceBufferTypes().length > 0 || Object.keys(this.pendingTracks).length > 0;
	}
	destroy() {
		this.unregisterListeners(), this.details = null, this.lastMpegAudioChunk = null, this.hls = null;
	}
	registerListeners() {
		let { hls: e } = this;
		e.on(a.MEDIA_ATTACHING, this.onMediaAttaching, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_PARSED, this.onManifestParsed, this), e.on(a.BUFFER_RESET, this.onBufferReset, this), e.on(a.BUFFER_APPENDING, this.onBufferAppending, this), e.on(a.BUFFER_CODECS, this.onBufferCodecs, this), e.on(a.BUFFER_EOS, this.onBufferEos, this), e.on(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.on(a.LEVEL_UPDATED, this.onLevelUpdated, this), e.on(a.FRAG_PARSED, this.onFragParsed, this), e.on(a.FRAG_CHANGED, this.onFragChanged, this);
	}
	unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHING, this.onMediaAttaching, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_PARSED, this.onManifestParsed, this), e.off(a.BUFFER_RESET, this.onBufferReset, this), e.off(a.BUFFER_APPENDING, this.onBufferAppending, this), e.off(a.BUFFER_CODECS, this.onBufferCodecs, this), e.off(a.BUFFER_EOS, this.onBufferEos, this), e.off(a.BUFFER_FLUSHING, this.onBufferFlushing, this), e.off(a.LEVEL_UPDATED, this.onLevelUpdated, this), e.off(a.FRAG_PARSED, this.onFragParsed, this), e.off(a.FRAG_CHANGED, this.onFragChanged, this);
	}
	_initSourceBuffer() {
		this.sourceBuffer = {}, this.operationQueue = new BufferOperationQueue(this.sourceBuffer), this.listeners = {
			audio: [],
			video: [],
			audiovideo: []
		}, this.appendErrors = {
			audio: 0,
			video: 0,
			audiovideo: 0
		}, this.lastMpegAudioChunk = null;
	}
	onManifestLoading() {
		this.bufferCodecEventsExpected = this._bufferCodecEventsTotal = 0, this.details = null;
	}
	onManifestParsed(e, t) {
		let n = 2;
		(t.audio && !t.video || !t.altAudio) && (n = 1), this.bufferCodecEventsExpected = this._bufferCodecEventsTotal = n, this.log(`${this.bufferCodecEventsExpected} bufferCodec event(s) expected`);
	}
	onMediaAttaching(e, t) {
		let n = this.media = t.media, r = getMediaSource(this.appendSource);
		if (n && r) {
			let e = this.mediaSource = new r();
			this.log(`created media source: ${e.constructor?.name}`), e.addEventListener("sourceopen", this._onMediaSourceOpen), e.addEventListener("sourceended", this._onMediaSourceEnded), e.addEventListener("sourceclose", this._onMediaSourceClose), this.appendSource && (e.addEventListener("startstreaming", this._onStartStreaming), e.addEventListener("endstreaming", this._onEndStreaming));
			let t = this._objectUrl = self.URL.createObjectURL(e);
			if (this.appendSource) try {
				n.removeAttribute("src");
				let r = self.ManagedMediaSource;
				n.disableRemotePlayback = n.disableRemotePlayback || r && e instanceof r, removeSourceChildren(n), addSource(n, t), n.load();
			} catch {
				n.src = t;
			}
			else n.src = t;
			n.addEventListener("emptied", this._onMediaEmptied);
		}
	}
	onMediaDetaching() {
		let { media: e, mediaSource: t, _objectUrl: n } = this;
		if (t) {
			if (this.log("media source detaching"), t.readyState === "open") try {
				t.endOfStream();
			} catch (e) {
				this.warn(`onMediaDetaching: ${e.message} while calling endOfStream`);
			}
			this.onBufferReset(), t.removeEventListener("sourceopen", this._onMediaSourceOpen), t.removeEventListener("sourceended", this._onMediaSourceEnded), t.removeEventListener("sourceclose", this._onMediaSourceClose), this.appendSource && (t.removeEventListener("startstreaming", this._onStartStreaming), t.removeEventListener("endstreaming", this._onEndStreaming)), e && (e.removeEventListener("emptied", this._onMediaEmptied), n && self.URL.revokeObjectURL(n), this.mediaSrc === n ? (e.removeAttribute("src"), this.appendSource && removeSourceChildren(e), e.load()) : this.warn("media|source.src was changed by a third party - skip cleanup")), this.mediaSource = null, this.media = null, this._objectUrl = null, this.bufferCodecEventsExpected = this._bufferCodecEventsTotal, this.pendingTracks = {}, this.tracks = {};
		}
		this.hls.trigger(a.MEDIA_DETACHED, void 0);
	}
	onBufferReset() {
		this.getSourceBufferTypes().forEach((e) => {
			this.resetBuffer(e);
		}), this._initSourceBuffer();
	}
	resetBuffer(e) {
		let t = this.sourceBuffer[e];
		try {
			if (t) {
				var n;
				this.removeBufferListeners(e), this.sourceBuffer[e] = void 0, (n = this.mediaSource) != null && n.sourceBuffers.length && this.mediaSource.removeSourceBuffer(t);
			}
		} catch (t) {
			this.warn(`onBufferReset ${e}`, t);
		}
	}
	onBufferCodecs(e, t) {
		let n = this.getSourceBufferTypes().length, r = Object.keys(t);
		if (r.forEach((e) => {
			if (n) {
				let n = this.tracks[e];
				if (n && typeof n.buffer.changeType == "function") {
					let { id: r, codec: i, levelCodec: a, container: o, metadata: s } = t[e], c = pickMostCompleteCodecName(n.codec, n.levelCodec), l = c?.replace(Pe, "$1"), u = pickMostCompleteCodecName(i, a), d = u?.replace(Pe, "$1");
					if (u && l !== d) {
						e.slice(0, 5) === "audio" && (u = getCodecCompatibleName(u, this.appendSource));
						let t = `${o};codecs=${u}`;
						this.appendChangeType(e, t), this.log(`switching codec ${c} to ${u}`), this.tracks[e] = {
							buffer: n.buffer,
							codec: i,
							container: o,
							levelCodec: a,
							metadata: s,
							id: r
						};
					}
				}
			} else this.pendingTracks[e] = t[e];
		}), n) return;
		let i = Math.max(this.bufferCodecEventsExpected - 1, 0);
		this.bufferCodecEventsExpected !== i && (this.log(`${i} bufferCodec event(s) expected ${r.join(",")}`), this.bufferCodecEventsExpected = i), this.mediaSource && this.mediaSource.readyState === "open" && this.checkPendingTracks();
	}
	appendChangeType(e, t) {
		let { operationQueue: n } = this;
		n.append({
			execute: () => {
				let r = this.sourceBuffer[e];
				r && (this.log(`changing ${e} sourceBuffer type to ${t}`), r.changeType(t)), n.shiftAndExecuteNext(e);
			},
			onStart: () => {},
			onComplete: () => {},
			onError: (t) => {
				this.warn(`Failed to change ${e} SourceBuffer type`, t);
			}
		}, e, !!this.pendingTracks[e]);
	}
	onBufferAppending(e, t) {
		let { hls: n, operationQueue: r, tracks: i } = this, { data: c, type: l, frag: u, part: d, chunkMeta: f } = t, p = f.buffering[l], m = self.performance.now();
		p.start = m;
		let h = u.stats.buffering, g = d ? d.stats.buffering : null;
		h.start === 0 && (h.start = m), g && g.start === 0 && (g.start = m);
		let _ = i.audio, v = !1;
		l === "audio" && _?.container === "audio/mpeg" && (v = !this.lastMpegAudioChunk || f.id === 1 || this.lastMpegAudioChunk.sn !== f.sn, this.lastMpegAudioChunk = f);
		let y = u.start;
		r.append({
			execute: () => {
				if (p.executeStart = self.performance.now(), v) {
					let e = this.sourceBuffer[l];
					if (e) {
						let t = y - e.timestampOffset;
						Math.abs(t) >= .1 && (this.log(`Updating audio SourceBuffer timestampOffset to ${y} (delta: ${t}) sn: ${u.sn})`), e.timestampOffset = y);
					}
				}
				this.appendExecutor(c, l);
			},
			onStart: () => {},
			onComplete: () => {
				let e = self.performance.now();
				p.executeEnd = p.end = e, h.first === 0 && (h.first = e), g && g.first === 0 && (g.first = e);
				let { sourceBuffer: t } = this, n = {};
				for (let e in t) n[e] = H.getBuffered(t[e]);
				this.appendErrors[l] = 0, l === "audio" || l === "video" ? this.appendErrors.audiovideo = 0 : (this.appendErrors.audio = 0, this.appendErrors.video = 0), this.hls.trigger(a.BUFFER_APPENDED, {
					type: l,
					frag: u,
					part: d,
					chunkMeta: f,
					parent: u.type,
					timeRanges: n
				});
			},
			onError: (e) => {
				let t = {
					type: o.MEDIA_ERROR,
					parent: u.type,
					details: s.BUFFER_APPEND_ERROR,
					sourceBufferName: l,
					frag: u,
					part: d,
					chunkMeta: f,
					error: e,
					err: e,
					fatal: !1
				};
				if (e.code === DOMException.QUOTA_EXCEEDED_ERR) t.details = s.BUFFER_FULL_ERROR;
				else {
					let e = ++this.appendErrors[l];
					t.details = s.BUFFER_APPEND_ERROR, this.warn(`Failed ${e}/${n.config.appendErrorMaxRetry} times to append segment in "${l}" sourceBuffer`), e >= n.config.appendErrorMaxRetry && (t.fatal = !0);
				}
				n.trigger(a.ERROR, t);
			}
		}, l, !!this.pendingTracks[l]);
	}
	onBufferFlushing(e, t) {
		let { operationQueue: n } = this, flushOperation = (e) => ({
			execute: this.removeExecutor.bind(this, e, t.startOffset, t.endOffset),
			onStart: () => {},
			onComplete: () => {
				this.hls.trigger(a.BUFFER_FLUSHED, { type: e });
			},
			onError: (t) => {
				this.warn(`Failed to remove from ${e} SourceBuffer`, t);
			}
		});
		t.type ? n.append(flushOperation(t.type), t.type) : this.getSourceBufferTypes().forEach((e) => {
			n.append(flushOperation(e), e);
		});
	}
	onFragParsed(e, t) {
		let { frag: n, part: r } = t, i = [], o = r ? r.elementaryStreams : n.elementaryStreams;
		o[h.AUDIOVIDEO] ? i.push("audiovideo") : (o[h.AUDIO] && i.push("audio"), o[h.VIDEO] && i.push("video"));
		let onUnblocked = () => {
			let e = self.performance.now();
			n.stats.buffering.end = e, r && (r.stats.buffering.end = e);
			let t = r ? r.stats : n.stats;
			this.hls.trigger(a.FRAG_BUFFERED, {
				frag: n,
				part: r,
				stats: t,
				id: n.type
			});
		};
		i.length === 0 && this.warn(`Fragments must have at least one ElementaryStreamType set. type: ${n.type} level: ${n.level} sn: ${n.sn}`), this.blockBuffers(onUnblocked, i);
	}
	onFragChanged(e, t) {
		this.trimBuffers();
	}
	onBufferEos(e, t) {
		this.getSourceBufferTypes().reduce((e, n) => {
			let r = this.sourceBuffer[n];
			return r && (!t.type || t.type === n) && (r.ending = !0, r.ended || (r.ended = !0, this.log(`${n} sourceBuffer now EOS`))), e && !(r && !r.ended);
		}, !0) && (this.log("Queueing mediaSource.endOfStream()"), this.blockBuffers(() => {
			this.getSourceBufferTypes().forEach((e) => {
				let t = this.sourceBuffer[e];
				t && (t.ending = !1);
			});
			let { mediaSource: e } = this;
			if (!e || e.readyState !== "open") {
				e && this.log(`Could not call mediaSource.endOfStream(). mediaSource.readyState: ${e.readyState}`);
				return;
			}
			this.log("Calling mediaSource.endOfStream()"), e.endOfStream();
		}));
	}
	onLevelUpdated(e, { details: t }) {
		t.fragments.length && (this.details = t, this.getSourceBufferTypes().length ? this.blockBuffers(this.updateMediaElementDuration.bind(this)) : this.updateMediaElementDuration());
	}
	trimBuffers() {
		let { hls: e, details: t, media: r } = this;
		if (!r || t === null || !this.getSourceBufferTypes().length) return;
		let i = e.config, a = r.currentTime, o = t.levelTargetDuration, s = t.live && i.liveBackBufferLength !== null ? i.liveBackBufferLength : i.backBufferLength;
		if (n(s) && s > 0) {
			let e = Math.max(s, o), t = Math.floor(a / o) * o - e;
			this.flushBackBuffer(a, o, t);
		}
		if (n(i.frontBufferFlushThreshold) && i.frontBufferFlushThreshold > 0) {
			let e = Math.max(i.maxBufferLength, i.frontBufferFlushThreshold), t = Math.max(e, o), n = Math.floor(a / o) * o + t;
			this.flushFrontBuffer(a, o, n);
		}
	}
	flushBackBuffer(e, t, n) {
		let { details: r, sourceBuffer: i } = this;
		this.getSourceBufferTypes().forEach((o) => {
			let s = i[o];
			if (s) {
				let i = H.getBuffered(s);
				if (i.length > 0 && n > i.start(0)) {
					if (this.hls.trigger(a.BACK_BUFFER_REACHED, { bufferEnd: n }), r != null && r.live) this.hls.trigger(a.LIVE_BACK_BUFFER_REACHED, { bufferEnd: n });
					else if (s.ended && i.end(i.length - 1) - e < t * 2) {
						this.log(`Cannot flush ${o} back buffer while SourceBuffer is in ended state`);
						return;
					}
					this.hls.trigger(a.BUFFER_FLUSHING, {
						startOffset: 0,
						endOffset: n,
						type: o
					});
				}
			}
		});
	}
	flushFrontBuffer(e, t, n) {
		let { sourceBuffer: r } = this;
		this.getSourceBufferTypes().forEach((i) => {
			let o = r[i];
			if (o) {
				let r = H.getBuffered(o), s = r.length;
				if (s < 2) return;
				let c = r.start(s - 1), l = r.end(s - 1);
				if (n > c || e >= c && e <= l) return;
				if (o.ended && e - l < 2 * t) {
					this.log(`Cannot flush ${i} front buffer while SourceBuffer is in ended state`);
					return;
				}
				this.hls.trigger(a.BUFFER_FLUSHING, {
					startOffset: c,
					endOffset: Infinity,
					type: i
				});
			}
		});
	}
	updateMediaElementDuration() {
		if (!this.details || !this.media || !this.mediaSource || this.mediaSource.readyState !== "open") return;
		let { details: e, hls: t, media: r, mediaSource: i } = this, a = e.fragments[0].start + e.totalduration, o = r.duration, s = n(i.duration) ? i.duration : 0;
		e.live && t.config.liveDurationInfinity ? (i.duration = Infinity, this.updateSeekableRange(e)) : (a > s && a > o || !n(o)) && (this.log(`Updating Media Source duration to ${a.toFixed(3)}`), i.duration = a);
	}
	updateSeekableRange(e) {
		let t = this.mediaSource, n = e.fragments;
		if (n.length && e.live && t != null && t.setLiveSeekableRange) {
			let r = Math.max(0, n[0].start), i = Math.max(r, r + e.totalduration);
			this.log(`Media Source duration is set to ${t.duration}. Setting seekable range to ${r}-${i}.`), t.setLiveSeekableRange(r, i);
		}
	}
	checkPendingTracks() {
		let { bufferCodecEventsExpected: e, operationQueue: t, pendingTracks: n } = this, r = Object.keys(n).length;
		if (r && (!e || r === 2 || "audiovideo" in n)) {
			this.createSourceBuffers(n), this.pendingTracks = {};
			let e = this.getSourceBufferTypes();
			if (e.length) this.hls.trigger(a.BUFFER_CREATED, { tracks: this.tracks }), e.forEach((e) => {
				t.executeNext(e);
			});
			else {
				let e = /* @__PURE__ */ Error("could not create source buffer for media codec(s)");
				this.hls.trigger(a.ERROR, {
					type: o.MEDIA_ERROR,
					details: s.BUFFER_INCOMPATIBLE_CODECS_ERROR,
					fatal: !0,
					error: e,
					reason: e.message
				});
			}
		}
	}
	createSourceBuffers(e) {
		let { sourceBuffer: t, mediaSource: n } = this;
		if (!n) throw Error("createSourceBuffers called when mediaSource was null");
		for (let r in e) if (!t[r]) {
			let i = e[r];
			if (!i) throw Error(`source buffer exists for track ${r}, however track does not`);
			let c = i.levelCodec?.indexOf(",") === -1 ? i.levelCodec : i.codec;
			c && r.slice(0, 5) === "audio" && (c = getCodecCompatibleName(c, this.appendSource));
			let l = `${i.container};codecs=${c}`;
			this.log(`creating sourceBuffer(${l})`);
			try {
				let e = t[r] = n.addSourceBuffer(l), o = r;
				this.addBufferListener(o, "updatestart", this._onSBUpdateStart), this.addBufferListener(o, "updateend", this._onSBUpdateEnd), this.addBufferListener(o, "error", this._onSBUpdateError), this.appendSource && this.addBufferListener(o, "bufferedchange", (e, t) => {
					let n = t.removedRanges;
					n != null && n.length && this.hls.trigger(a.BUFFER_FLUSHED, { type: r });
				}), this.tracks[r] = {
					buffer: e,
					codec: c,
					container: i.container,
					levelCodec: i.levelCodec,
					metadata: i.metadata,
					id: i.id
				};
			} catch (e) {
				this.error(`error while trying to add sourceBuffer: ${e.message}`), this.hls.trigger(a.ERROR, {
					type: o.MEDIA_ERROR,
					details: s.BUFFER_ADD_CODEC_ERROR,
					fatal: !1,
					error: e,
					sourceBufferName: r,
					mimeType: l
				});
			}
		}
	}
	get mediaSrc() {
		return (this.media?.firstChild || this.media)?.src;
	}
	_onSBUpdateStart(e) {
		let { operationQueue: t } = this;
		t.current(e).onStart();
	}
	_onSBUpdateEnd(e) {
		if (this.mediaSource?.readyState === "closed") {
			this.resetBuffer(e);
			return;
		}
		let { operationQueue: t } = this;
		t.current(e).onComplete(), t.shiftAndExecuteNext(e);
	}
	_onSBUpdateError(e, t) {
		let n = /* @__PURE__ */ Error(`${e} SourceBuffer error. MediaSource readyState: ${this.mediaSource?.readyState}`);
		this.error(`${n}`, t), this.hls.trigger(a.ERROR, {
			type: o.MEDIA_ERROR,
			details: s.BUFFER_APPENDING_ERROR,
			sourceBufferName: e,
			error: n,
			fatal: !1
		});
		let r = this.operationQueue.current(e);
		r && r.onError(n);
	}
	removeExecutor(e, t, r) {
		let { media: i, mediaSource: a, operationQueue: o, sourceBuffer: s } = this, c = s[e];
		if (!i || !a || !c) {
			this.warn(`Attempting to remove from the ${e} SourceBuffer, but it does not exist`), o.shiftAndExecuteNext(e);
			return;
		}
		let l = n(i.duration) ? i.duration : Infinity, u = n(a.duration) ? a.duration : Infinity, d = Math.max(0, t), f = Math.min(r, l, u);
		f > d && (!c.ending || c.ended) ? (c.ended = !1, this.log(`Removing [${d},${f}] from the ${e} SourceBuffer`), c.remove(d, f)) : o.shiftAndExecuteNext(e);
	}
	appendExecutor(e, t) {
		let n = this.sourceBuffer[t];
		if (!n) {
			if (!this.pendingTracks[t]) throw Error(`Attempting to append to the ${t} SourceBuffer, but it does not exist`);
			return;
		}
		n.ended = !1, n.appendBuffer(e);
	}
	blockBuffers(e, t = this.getSourceBufferTypes()) {
		if (!t.length) {
			this.log("Blocking operation requested, but no SourceBuffers exist"), Promise.resolve().then(e);
			return;
		}
		let { operationQueue: n } = this, r = t.map((e) => n.appendBlocker(e));
		Promise.all(r).then(() => {
			e(), t.forEach((e) => {
				let t = this.sourceBuffer[e];
				t != null && t.updating || n.shiftAndExecuteNext(e);
			});
		});
	}
	getSourceBufferTypes() {
		return Object.keys(this.sourceBuffer);
	}
	addBufferListener(e, t, n) {
		let r = this.sourceBuffer[e];
		if (!r) return;
		let i = n.bind(this, e);
		this.listeners[e].push({
			event: t,
			listener: i
		}), r.addEventListener(t, i);
	}
	removeBufferListeners(e) {
		let t = this.sourceBuffer[e];
		t && this.listeners[e].forEach((e) => {
			t.removeEventListener(e.event, e.listener);
		});
	}
};
function removeSourceChildren(e) {
	let t = e.querySelectorAll("source");
	[].slice.call(t).forEach((t) => {
		e.removeChild(t);
	});
}
function addSource(e, t) {
	let n = self.document.createElement("source");
	n.type = "video/mp4", n.src = t, e.appendChild(n);
}
var Fe = {
	42: 225,
	92: 233,
	94: 237,
	95: 243,
	96: 250,
	123: 231,
	124: 247,
	125: 209,
	126: 241,
	127: 9608,
	128: 174,
	129: 176,
	130: 189,
	131: 191,
	132: 8482,
	133: 162,
	134: 163,
	135: 9834,
	136: 224,
	137: 32,
	138: 232,
	139: 226,
	140: 234,
	141: 238,
	142: 244,
	143: 251,
	144: 193,
	145: 201,
	146: 211,
	147: 218,
	148: 220,
	149: 252,
	150: 8216,
	151: 161,
	152: 42,
	153: 8217,
	154: 9473,
	155: 169,
	156: 8480,
	157: 8226,
	158: 8220,
	159: 8221,
	160: 192,
	161: 194,
	162: 199,
	163: 200,
	164: 202,
	165: 203,
	166: 235,
	167: 206,
	168: 207,
	169: 239,
	170: 212,
	171: 217,
	172: 249,
	173: 219,
	174: 171,
	175: 187,
	176: 195,
	177: 227,
	178: 205,
	179: 204,
	180: 236,
	181: 210,
	182: 242,
	183: 213,
	184: 245,
	185: 123,
	186: 125,
	187: 92,
	188: 94,
	189: 95,
	190: 124,
	191: 8764,
	192: 196,
	193: 228,
	194: 214,
	195: 246,
	196: 223,
	197: 165,
	198: 164,
	199: 9475,
	200: 197,
	201: 229,
	202: 216,
	203: 248,
	204: 9487,
	205: 9491,
	206: 9495,
	207: 9499
}, getCharForByte = (e) => String.fromCharCode(Fe[e] || e), Y = 15, X = 100, Ie = {
	17: 1,
	18: 3,
	21: 5,
	22: 7,
	23: 9,
	16: 11,
	19: 12,
	20: 14
}, Le = {
	17: 2,
	18: 4,
	21: 6,
	22: 8,
	23: 10,
	19: 13,
	20: 15
}, Re = {
	25: 1,
	26: 3,
	29: 5,
	30: 7,
	31: 9,
	24: 11,
	27: 12,
	28: 14
}, ze = {
	25: 2,
	26: 4,
	29: 6,
	30: 8,
	31: 10,
	27: 13,
	28: 15
}, Be = [
	"white",
	"green",
	"blue",
	"cyan",
	"red",
	"yellow",
	"magenta",
	"black",
	"transparent"
], CaptionsLogger = class {
	constructor() {
		this.time = null, this.verboseLevel = 0;
	}
	log(e, t) {
		if (this.verboseLevel >= e) {
			let n = typeof t == "function" ? t() : t;
			d.log(`${this.time} [${e}] ${n}`);
		}
	}
}, Z = function numArrayToHexArray(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) t.push(e[n].toString(16));
	return t;
}, PenState = class {
	constructor() {
		this.foreground = "white", this.underline = !1, this.italics = !1, this.background = "black", this.flash = !1;
	}
	reset() {
		this.foreground = "white", this.underline = !1, this.italics = !1, this.background = "black", this.flash = !1;
	}
	setStyles(e) {
		let t = [
			"foreground",
			"underline",
			"italics",
			"background",
			"flash"
		];
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			e.hasOwnProperty(r) && (this[r] = e[r]);
		}
	}
	isDefault() {
		return this.foreground === "white" && !this.underline && !this.italics && this.background === "black" && !this.flash;
	}
	equals(e) {
		return this.foreground === e.foreground && this.underline === e.underline && this.italics === e.italics && this.background === e.background && this.flash === e.flash;
	}
	copy(e) {
		this.foreground = e.foreground, this.underline = e.underline, this.italics = e.italics, this.background = e.background, this.flash = e.flash;
	}
	toString() {
		return "color=" + this.foreground + ", underline=" + this.underline + ", italics=" + this.italics + ", background=" + this.background + ", flash=" + this.flash;
	}
}, StyledUnicodeChar = class {
	constructor() {
		this.uchar = " ", this.penState = new PenState();
	}
	reset() {
		this.uchar = " ", this.penState.reset();
	}
	setChar(e, t) {
		this.uchar = e, this.penState.copy(t);
	}
	setPenState(e) {
		this.penState.copy(e);
	}
	equals(e) {
		return this.uchar === e.uchar && this.penState.equals(e.penState);
	}
	copy(e) {
		this.uchar = e.uchar, this.penState.copy(e.penState);
	}
	isEmpty() {
		return this.uchar === " " && this.penState.isDefault();
	}
}, Row = class {
	constructor(e) {
		this.chars = [], this.pos = 0, this.currPenState = new PenState(), this.cueStartTime = null, this.logger = void 0;
		for (let e = 0; e < X; e++) this.chars.push(new StyledUnicodeChar());
		this.logger = e;
	}
	equals(e) {
		for (let t = 0; t < X; t++) if (!this.chars[t].equals(e.chars[t])) return !1;
		return !0;
	}
	copy(e) {
		for (let t = 0; t < X; t++) this.chars[t].copy(e.chars[t]);
	}
	isEmpty() {
		let e = !0;
		for (let t = 0; t < X; t++) if (!this.chars[t].isEmpty()) {
			e = !1;
			break;
		}
		return e;
	}
	setCursor(e) {
		this.pos !== e && (this.pos = e), this.pos < 0 ? (this.logger.log(3, "Negative cursor position " + this.pos), this.pos = 0) : this.pos > X && (this.logger.log(3, "Too large cursor position " + this.pos), this.pos = X);
	}
	moveCursor(e) {
		let t = this.pos + e;
		if (e > 1) for (let e = this.pos + 1; e < t + 1; e++) this.chars[e].setPenState(this.currPenState);
		this.setCursor(t);
	}
	backSpace() {
		this.moveCursor(-1), this.chars[this.pos].setChar(" ", this.currPenState);
	}
	insertChar(e) {
		e >= 144 && this.backSpace();
		let t = getCharForByte(e);
		if (this.pos >= X) {
			this.logger.log(0, () => "Cannot insert " + e.toString(16) + " (" + t + ") at position " + this.pos + ". Skipping it!");
			return;
		}
		this.chars[this.pos].setChar(t, this.currPenState), this.moveCursor(1);
	}
	clearFromPos(e) {
		let t;
		for (t = e; t < X; t++) this.chars[t].reset();
	}
	clear() {
		this.clearFromPos(0), this.pos = 0, this.currPenState.reset();
	}
	clearToEndOfRow() {
		this.clearFromPos(this.pos);
	}
	getTextString() {
		let e = [], t = !0;
		for (let n = 0; n < X; n++) {
			let r = this.chars[n].uchar;
			r !== " " && (t = !1), e.push(r);
		}
		return t ? "" : e.join("");
	}
	setPenStyles(e) {
		this.currPenState.setStyles(e), this.chars[this.pos].setPenState(this.currPenState);
	}
}, CaptionScreen = class {
	constructor(e) {
		this.rows = [], this.currRow = 14, this.nrRollUpRows = null, this.lastOutputScreen = null, this.logger = void 0;
		for (let t = 0; t < Y; t++) this.rows.push(new Row(e));
		this.logger = e;
	}
	reset() {
		for (let e = 0; e < Y; e++) this.rows[e].clear();
		this.currRow = 14;
	}
	equals(e) {
		let t = !0;
		for (let n = 0; n < Y; n++) if (!this.rows[n].equals(e.rows[n])) {
			t = !1;
			break;
		}
		return t;
	}
	copy(e) {
		for (let t = 0; t < Y; t++) this.rows[t].copy(e.rows[t]);
	}
	isEmpty() {
		let e = !0;
		for (let t = 0; t < Y; t++) if (!this.rows[t].isEmpty()) {
			e = !1;
			break;
		}
		return e;
	}
	backSpace() {
		this.rows[this.currRow].backSpace();
	}
	clearToEndOfRow() {
		this.rows[this.currRow].clearToEndOfRow();
	}
	insertChar(e) {
		this.rows[this.currRow].insertChar(e);
	}
	setPen(e) {
		this.rows[this.currRow].setPenStyles(e);
	}
	moveCursor(e) {
		this.rows[this.currRow].moveCursor(e);
	}
	setCursor(e) {
		this.logger.log(2, "setCursor: " + e), this.rows[this.currRow].setCursor(e);
	}
	setPAC(e) {
		this.logger.log(2, () => "pacData = " + JSON.stringify(e));
		let t = e.row - 1;
		if (this.nrRollUpRows && t < this.nrRollUpRows - 1 && (t = this.nrRollUpRows - 1), this.nrRollUpRows && this.currRow !== t) {
			for (let e = 0; e < Y; e++) this.rows[e].clear();
			let e = this.currRow + 1 - this.nrRollUpRows, n = this.lastOutputScreen;
			if (n) {
				let r = n.rows[e].cueStartTime, i = this.logger.time;
				if (r !== null && i !== null && r < i) for (let r = 0; r < this.nrRollUpRows; r++) this.rows[t - this.nrRollUpRows + r + 1].copy(n.rows[e + r]);
			}
		}
		this.currRow = t;
		let n = this.rows[this.currRow];
		if (e.indent !== null) {
			let t = e.indent, r = Math.max(t - 1, 0);
			n.setCursor(e.indent), e.color = n.chars[r].penState.foreground;
		}
		let r = {
			foreground: e.color,
			underline: e.underline,
			italics: e.italics,
			background: "black",
			flash: !1
		};
		this.setPen(r);
	}
	setBkgData(e) {
		this.logger.log(2, () => "bkgData = " + JSON.stringify(e)), this.backSpace(), this.setPen(e), this.insertChar(32);
	}
	setRollUpRows(e) {
		this.nrRollUpRows = e;
	}
	rollUp() {
		if (this.nrRollUpRows === null) {
			this.logger.log(3, "roll_up but nrRollUpRows not set yet");
			return;
		}
		this.logger.log(1, () => this.getDisplayText());
		let e = this.currRow + 1 - this.nrRollUpRows, t = this.rows.splice(e, 1)[0];
		t.clear(), this.rows.splice(this.currRow, 0, t), this.logger.log(2, "Rolling up");
	}
	getDisplayText(e) {
		e ||= !1;
		let t = [], n = "", r = -1;
		for (let n = 0; n < Y; n++) {
			let i = this.rows[n].getTextString();
			i && (r = n + 1, e ? t.push("Row " + r + ": '" + i + "'") : t.push(i.trim()));
		}
		return t.length > 0 && (n = e ? "[" + t.join(" | ") + "]" : t.join("\n")), n;
	}
	getTextAndFormat() {
		return this.rows;
	}
}, Cea608Channel = class {
	constructor(e, t, n) {
		this.chNr = void 0, this.outputFilter = void 0, this.mode = void 0, this.verbose = void 0, this.displayedMemory = void 0, this.nonDisplayedMemory = void 0, this.lastOutputScreen = void 0, this.currRollUpRow = void 0, this.writeScreen = void 0, this.cueStartTime = void 0, this.logger = void 0, this.chNr = e, this.outputFilter = t, this.mode = null, this.verbose = 0, this.displayedMemory = new CaptionScreen(n), this.nonDisplayedMemory = new CaptionScreen(n), this.lastOutputScreen = new CaptionScreen(n), this.currRollUpRow = this.displayedMemory.rows[14], this.writeScreen = this.displayedMemory, this.mode = null, this.cueStartTime = null, this.logger = n;
	}
	reset() {
		this.mode = null, this.displayedMemory.reset(), this.nonDisplayedMemory.reset(), this.lastOutputScreen.reset(), this.outputFilter.reset(), this.currRollUpRow = this.displayedMemory.rows[14], this.writeScreen = this.displayedMemory, this.mode = null, this.cueStartTime = null;
	}
	getHandler() {
		return this.outputFilter;
	}
	setHandler(e) {
		this.outputFilter = e;
	}
	setPAC(e) {
		this.writeScreen.setPAC(e);
	}
	setBkgData(e) {
		this.writeScreen.setBkgData(e);
	}
	setMode(e) {
		e !== this.mode && (this.mode = e, this.logger.log(2, () => "MODE=" + e), this.mode === "MODE_POP-ON" ? this.writeScreen = this.nonDisplayedMemory : (this.writeScreen = this.displayedMemory, this.writeScreen.reset()), this.mode !== "MODE_ROLL-UP" && (this.displayedMemory.nrRollUpRows = null, this.nonDisplayedMemory.nrRollUpRows = null), this.mode = e);
	}
	insertChars(e) {
		for (let t = 0; t < e.length; t++) this.writeScreen.insertChar(e[t]);
		let t = this.writeScreen === this.displayedMemory ? "DISP" : "NON_DISP";
		this.logger.log(2, () => t + ": " + this.writeScreen.getDisplayText(!0)), (this.mode === "MODE_PAINT-ON" || this.mode === "MODE_ROLL-UP") && (this.logger.log(1, () => "DISPLAYED: " + this.displayedMemory.getDisplayText(!0)), this.outputDataUpdate());
	}
	ccRCL() {
		this.logger.log(2, "RCL - Resume Caption Loading"), this.setMode("MODE_POP-ON");
	}
	ccBS() {
		this.logger.log(2, "BS - BackSpace"), this.mode !== "MODE_TEXT" && (this.writeScreen.backSpace(), this.writeScreen === this.displayedMemory && this.outputDataUpdate());
	}
	ccAOF() {}
	ccAON() {}
	ccDER() {
		this.logger.log(2, "DER- Delete to End of Row"), this.writeScreen.clearToEndOfRow(), this.outputDataUpdate();
	}
	ccRU(e) {
		this.logger.log(2, "RU(" + e + ") - Roll Up"), this.writeScreen = this.displayedMemory, this.setMode("MODE_ROLL-UP"), this.writeScreen.setRollUpRows(e);
	}
	ccFON() {
		this.logger.log(2, "FON - Flash On"), this.writeScreen.setPen({ flash: !0 });
	}
	ccRDC() {
		this.logger.log(2, "RDC - Resume Direct Captioning"), this.setMode("MODE_PAINT-ON");
	}
	ccTR() {
		this.logger.log(2, "TR"), this.setMode("MODE_TEXT");
	}
	ccRTD() {
		this.logger.log(2, "RTD"), this.setMode("MODE_TEXT");
	}
	ccEDM() {
		this.logger.log(2, "EDM - Erase Displayed Memory"), this.displayedMemory.reset(), this.outputDataUpdate(!0);
	}
	ccCR() {
		this.logger.log(2, "CR - Carriage Return"), this.writeScreen.rollUp(), this.outputDataUpdate(!0);
	}
	ccENM() {
		this.logger.log(2, "ENM - Erase Non-displayed Memory"), this.nonDisplayedMemory.reset();
	}
	ccEOC() {
		if (this.logger.log(2, "EOC - End Of Caption"), this.mode === "MODE_POP-ON") {
			let e = this.displayedMemory;
			this.displayedMemory = this.nonDisplayedMemory, this.nonDisplayedMemory = e, this.writeScreen = this.nonDisplayedMemory, this.logger.log(1, () => "DISP: " + this.displayedMemory.getDisplayText());
		}
		this.outputDataUpdate(!0);
	}
	ccTO(e) {
		this.logger.log(2, "TO(" + e + ") - Tab Offset"), this.writeScreen.moveCursor(e);
	}
	ccMIDROW(e) {
		let t = { flash: !1 };
		t.underline = e % 2 == 1, t.italics = e >= 46, t.foreground = t.italics ? "white" : [
			"white",
			"green",
			"blue",
			"cyan",
			"red",
			"yellow",
			"magenta"
		][Math.floor(e / 2) - 16], this.logger.log(2, "MIDROW: " + JSON.stringify(t)), this.writeScreen.setPen(t);
	}
	outputDataUpdate(e = !1) {
		let t = this.logger.time;
		t !== null && this.outputFilter && (this.cueStartTime === null && !this.displayedMemory.isEmpty() ? this.cueStartTime = t : this.displayedMemory.equals(this.lastOutputScreen) || (this.outputFilter.newCue(this.cueStartTime, t, this.lastOutputScreen), e && this.outputFilter.dispatchCue && this.outputFilter.dispatchCue(), this.cueStartTime = this.displayedMemory.isEmpty() ? null : t), this.lastOutputScreen.copy(this.displayedMemory));
	}
	cueSplitAtTime(e) {
		this.outputFilter && (this.displayedMemory.isEmpty() || (this.outputFilter.newCue && this.outputFilter.newCue(this.cueStartTime, e, this.displayedMemory), this.cueStartTime = e));
	}
}, Cea608Parser = class {
	constructor(e, t, n) {
		this.channels = void 0, this.currentChannel = 0, this.cmdHistory = createCmdHistory(), this.logger = void 0;
		let r = this.logger = new CaptionsLogger();
		this.channels = [
			null,
			new Cea608Channel(e, t, r),
			new Cea608Channel(e + 1, n, r)
		];
	}
	getHandler(e) {
		return this.channels[e].getHandler();
	}
	setHandler(e, t) {
		this.channels[e].setHandler(t);
	}
	addData(e, t) {
		this.logger.time = e;
		for (let e = 0; e < t.length; e += 2) {
			let n = t[e] & 127, r = t[e + 1] & 127, i = !1, a = null;
			if (n === 0 && r === 0) continue;
			this.logger.log(3, () => "[" + Z([t[e], t[e + 1]]) + "] -> (" + Z([n, r]) + ")");
			let o = this.cmdHistory;
			if (n >= 16 && n <= 31) {
				if (hasCmdRepeated(n, r, o)) {
					setLastCmd(null, null, o), this.logger.log(3, () => "Repeated command (" + Z([n, r]) + ") is dropped");
					continue;
				}
				setLastCmd(n, r, this.cmdHistory), i = this.parseCmd(n, r), i ||= this.parseMidrow(n, r), i ||= this.parsePAC(n, r), i ||= this.parseBackgroundAttributes(n, r);
			} else setLastCmd(null, null, o);
			if (!i && (a = this.parseChars(n, r), a)) {
				let e = this.currentChannel;
				e && e > 0 ? this.channels[e].insertChars(a) : this.logger.log(2, "No channel found yet. TEXT-MODE?");
			}
			!i && !a && this.logger.log(2, () => "Couldn't parse cleaned data " + Z([n, r]) + " orig: " + Z([t[e], t[e + 1]]));
		}
	}
	parseCmd(e, t) {
		if (!((e === 20 || e === 28 || e === 21 || e === 29) && t >= 32 && t <= 47 || (e === 23 || e === 31) && t >= 33 && t <= 35)) return !1;
		let n = e === 20 || e === 21 || e === 23 ? 1 : 2, r = this.channels[n];
		return e === 20 || e === 21 || e === 28 || e === 29 ? t === 32 ? r.ccRCL() : t === 33 ? r.ccBS() : t === 34 ? r.ccAOF() : t === 35 ? r.ccAON() : t === 36 ? r.ccDER() : t === 37 ? r.ccRU(2) : t === 38 ? r.ccRU(3) : t === 39 ? r.ccRU(4) : t === 40 ? r.ccFON() : t === 41 ? r.ccRDC() : t === 42 ? r.ccTR() : t === 43 ? r.ccRTD() : t === 44 ? r.ccEDM() : t === 45 ? r.ccCR() : t === 46 ? r.ccENM() : t === 47 && r.ccEOC() : r.ccTO(t - 32), this.currentChannel = n, !0;
	}
	parseMidrow(e, t) {
		let n = 0;
		if ((e === 17 || e === 25) && t >= 32 && t <= 47) {
			if (n = e === 17 ? 1 : 2, n !== this.currentChannel) return this.logger.log(0, "Mismatch channel in midrow parsing"), !1;
			let r = this.channels[n];
			return r ? (r.ccMIDROW(t), this.logger.log(3, () => "MIDROW (" + Z([e, t]) + ")"), !0) : !1;
		}
		return !1;
	}
	parsePAC(e, t) {
		let n;
		if (!((e >= 17 && e <= 23 || e >= 25 && e <= 31) && t >= 64 && t <= 127 || (e === 16 || e === 24) && t >= 64 && t <= 95)) return !1;
		let r = e <= 23 ? 1 : 2;
		n = t >= 64 && t <= 95 ? r === 1 ? Ie[e] : Re[e] : r === 1 ? Le[e] : ze[e];
		let i = this.channels[r];
		return i ? (i.setPAC(this.interpretPAC(n, t)), this.currentChannel = r, !0) : !1;
	}
	interpretPAC(e, t) {
		let n, r = {
			color: null,
			italics: !1,
			indent: null,
			underline: !1,
			row: e
		};
		return n = t > 95 ? t - 96 : t - 64, r.underline = (n & 1) == 1, n <= 13 ? r.color = [
			"white",
			"green",
			"blue",
			"cyan",
			"red",
			"yellow",
			"magenta",
			"white"
		][Math.floor(n / 2)] : n <= 15 ? (r.italics = !0, r.color = "white") : r.indent = Math.floor((n - 16) / 2) * 4, r;
	}
	parseChars(e, t) {
		let n, r = null, i = null;
		if (e >= 25 ? (n = 2, i = e - 8) : (n = 1, i = e), i >= 17 && i <= 19) {
			let e;
			e = i === 17 ? t + 80 : i === 18 ? t + 112 : t + 144, this.logger.log(2, () => "Special char '" + getCharForByte(e) + "' in channel " + n), r = [e];
		} else e >= 32 && e <= 127 && (r = t === 0 ? [e] : [e, t]);
		return r && this.logger.log(3, () => "Char codes =  " + Z(r).join(",")), r;
	}
	parseBackgroundAttributes(e, t) {
		if (!((e === 16 || e === 24) && t >= 32 && t <= 47 || (e === 23 || e === 31) && t >= 45 && t <= 47)) return !1;
		let n, r = {};
		e === 16 || e === 24 ? (n = Math.floor((t - 32) / 2), r.background = Be[n], t % 2 == 1 && (r.background += "_semi")) : t === 45 ? r.background = "transparent" : (r.foreground = "black", t === 47 && (r.underline = !0));
		let i = e <= 23 ? 1 : 2;
		return this.channels[i].setBkgData(r), !0;
	}
	reset() {
		for (let e = 0; e < Object.keys(this.channels).length; e++) {
			let t = this.channels[e];
			t && t.reset();
		}
		setLastCmd(null, null, this.cmdHistory);
	}
	cueSplitAtTime(e) {
		for (let t = 0; t < this.channels.length; t++) {
			let n = this.channels[t];
			n && n.cueSplitAtTime(e);
		}
	}
};
function setLastCmd(e, t, n) {
	n.a = e, n.b = t;
}
function hasCmdRepeated(e, t, n) {
	return n.a === e && n.b === t;
}
function createCmdHistory() {
	return {
		a: null,
		b: null
	};
}
var OutputFilter = class {
	constructor(e, t) {
		this.timelineController = void 0, this.cueRanges = [], this.trackName = void 0, this.startTime = null, this.endTime = null, this.screen = null, this.timelineController = e, this.trackName = t;
	}
	dispatchCue() {
		this.startTime !== null && (this.timelineController.addCues(this.trackName, this.startTime, this.endTime, this.screen, this.cueRanges), this.startTime = null);
	}
	newCue(e, t, n) {
		(this.startTime === null || this.startTime > e) && (this.startTime = e), this.endTime = t, this.screen = n, this.timelineController.createCaptionsTrack(this.trackName);
	}
	reset() {
		this.cueRanges = [], this.startTime = null;
	}
}, Ve = (function() {
	if (_ != null && _.VTTCue) return self.VTTCue;
	let e = [
		"",
		"lr",
		"rl"
	], t = [
		"start",
		"middle",
		"end",
		"left",
		"right"
	];
	function isAllowedValue(e, t) {
		if (typeof t != "string" || !Array.isArray(e)) return !1;
		let n = t.toLowerCase();
		return ~e.indexOf(n) ? n : !1;
	}
	function findDirectionSetting(t) {
		return isAllowedValue(e, t);
	}
	function findAlignSetting(e) {
		return isAllowedValue(t, e);
	}
	function extend(e, ...t) {
		let n = 1;
		for (; n < arguments.length; n++) {
			let t = arguments[n];
			for (let n in t) e[n] = t[n];
		}
		return e;
	}
	function VTTCue(e, t, n) {
		let r = this, i = { enumerable: !0 };
		r.hasBeenReset = !1;
		let a = "", o = !1, s = e, c = t, l = n, u = null, d = "", f = !0, p = "auto", m = "start", h = 50, g = "middle", _ = 50, v = "middle";
		Object.defineProperty(r, "id", extend({}, i, {
			get: function() {
				return a;
			},
			set: function(e) {
				a = "" + e;
			}
		})), Object.defineProperty(r, "pauseOnExit", extend({}, i, {
			get: function() {
				return o;
			},
			set: function(e) {
				o = !!e;
			}
		})), Object.defineProperty(r, "startTime", extend({}, i, {
			get: function() {
				return s;
			},
			set: function(e) {
				if (typeof e != "number") throw TypeError("Start time must be set to a number.");
				s = e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "endTime", extend({}, i, {
			get: function() {
				return c;
			},
			set: function(e) {
				if (typeof e != "number") throw TypeError("End time must be set to a number.");
				c = e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "text", extend({}, i, {
			get: function() {
				return l;
			},
			set: function(e) {
				l = "" + e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "region", extend({}, i, {
			get: function() {
				return u;
			},
			set: function(e) {
				u = e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "vertical", extend({}, i, {
			get: function() {
				return d;
			},
			set: function(e) {
				let t = findDirectionSetting(e);
				if (t === !1) throw SyntaxError("An invalid or illegal string was specified.");
				d = t, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "snapToLines", extend({}, i, {
			get: function() {
				return f;
			},
			set: function(e) {
				f = !!e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "line", extend({}, i, {
			get: function() {
				return p;
			},
			set: function(e) {
				if (typeof e != "number" && e !== "auto") throw SyntaxError("An invalid number or illegal string was specified.");
				p = e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "lineAlign", extend({}, i, {
			get: function() {
				return m;
			},
			set: function(e) {
				let t = findAlignSetting(e);
				if (!t) throw SyntaxError("An invalid or illegal string was specified.");
				m = t, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "position", extend({}, i, {
			get: function() {
				return h;
			},
			set: function(e) {
				if (e < 0 || e > 100) throw Error("Position must be between 0 and 100.");
				h = e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "positionAlign", extend({}, i, {
			get: function() {
				return g;
			},
			set: function(e) {
				let t = findAlignSetting(e);
				if (!t) throw SyntaxError("An invalid or illegal string was specified.");
				g = t, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "size", extend({}, i, {
			get: function() {
				return _;
			},
			set: function(e) {
				if (e < 0 || e > 100) throw Error("Size must be between 0 and 100.");
				_ = e, this.hasBeenReset = !0;
			}
		})), Object.defineProperty(r, "align", extend({}, i, {
			get: function() {
				return v;
			},
			set: function(e) {
				let t = findAlignSetting(e);
				if (!t) throw SyntaxError("An invalid or illegal string was specified.");
				v = t, this.hasBeenReset = !0;
			}
		})), r.displayState = void 0;
	}
	return VTTCue.prototype.getCueAsHTML = function() {
		return self.WebVTT.convertCueToDOMTree(self, this.text);
	}, VTTCue;
})(), StringDecoder = class {
	decode(e, t) {
		if (!e) return "";
		if (typeof e != "string") throw Error("Error - expected string data.");
		return decodeURIComponent(encodeURIComponent(e));
	}
};
function parseTimeStamp(e) {
	function computeSeconds(e, t, n, r) {
		return (e | 0) * 3600 + (t | 0) * 60 + (n | 0) + parseFloat(r || 0);
	}
	let t = e.match(/^(?:(\d+):)?(\d{2}):(\d{2})(\.\d+)?/);
	return t ? parseFloat(t[2]) > 59 ? computeSeconds(t[2], t[3], 0, t[4]) : computeSeconds(t[1], t[2], t[3], t[4]) : null;
}
var Settings = class {
	constructor() {
		this.values = Object.create(null);
	}
	set(e, t) {
		!this.get(e) && t !== "" && (this.values[e] = t);
	}
	get(e, t, n) {
		return n ? this.has(e) ? this.values[e] : t[n] : this.has(e) ? this.values[e] : t;
	}
	has(e) {
		return e in this.values;
	}
	alt(e, t, n) {
		for (let r = 0; r < n.length; ++r) if (t === n[r]) {
			this.set(e, t);
			break;
		}
	}
	integer(e, t) {
		/^-?\d+$/.test(t) && this.set(e, parseInt(t, 10));
	}
	percent(e, t) {
		if (/^([\d]{1,3})(\.[\d]*)?%$/.test(t)) {
			let n = parseFloat(t);
			if (n >= 0 && n <= 100) return this.set(e, n), !0;
		}
		return !1;
	}
};
function parseOptions(e, t, n, r) {
	let i = r ? e.split(r) : [e];
	for (let e in i) {
		if (typeof i[e] != "string") continue;
		let r = i[e].split(n);
		if (r.length !== 2) continue;
		let a = r[0], o = r[1];
		t(a, o);
	}
}
var He = new Ve(0, 0, ""), Ue = He.align === "middle" ? "middle" : "center";
function parseCue(e, t, n) {
	let r = e;
	function consumeTimeStamp() {
		let t = parseTimeStamp(e);
		if (t === null) throw Error("Malformed timestamp: " + r);
		return e = e.replace(/^[^\sa-zA-Z-]+/, ""), t;
	}
	function consumeCueSettings(e, t) {
		let r = new Settings();
		parseOptions(e, function(e, t) {
			let i;
			switch (e) {
				case "region":
					for (let i = n.length - 1; i >= 0; i--) if (n[i].id === t) {
						r.set(e, n[i].region);
						break;
					}
					break;
				case "vertical":
					r.alt(e, t, ["rl", "lr"]);
					break;
				case "line":
					i = t.split(","), r.integer(e, i[0]), r.percent(e, i[0]) && r.set("snapToLines", !1), r.alt(e, i[0], ["auto"]), i.length === 2 && r.alt("lineAlign", i[1], [
						"start",
						Ue,
						"end"
					]);
					break;
				case "position":
					i = t.split(","), r.percent(e, i[0]), i.length === 2 && r.alt("positionAlign", i[1], [
						"start",
						Ue,
						"end",
						"line-left",
						"line-right",
						"auto"
					]);
					break;
				case "size":
					r.percent(e, t);
					break;
				case "align": r.alt(e, t, [
					"start",
					Ue,
					"end",
					"left",
					"right"
				]);
			}
		}, /:/, /\s/), t.region = r.get("region", null), t.vertical = r.get("vertical", "");
		let i = r.get("line", "auto");
		i === "auto" && He.line === -1 && (i = -1), t.line = i, t.lineAlign = r.get("lineAlign", "start"), t.snapToLines = r.get("snapToLines", !0), t.size = r.get("size", 100), t.align = r.get("align", Ue);
		let a = r.get("position", "auto");
		a === "auto" && He.position === 50 && (a = t.align === "start" || t.align === "left" ? 0 : t.align === "end" || t.align === "right" ? 100 : 50), t.position = a;
	}
	function skipWhitespace() {
		e = e.replace(/^\s+/, "");
	}
	if (skipWhitespace(), t.startTime = consumeTimeStamp(), skipWhitespace(), e.slice(0, 3) !== "-->") throw Error("Malformed time stamp (time stamps must be separated by '-->'): " + r);
	e = e.slice(3), skipWhitespace(), t.endTime = consumeTimeStamp(), skipWhitespace(), consumeCueSettings(e, t);
}
function fixLineBreaks(e) {
	return e.replace(/<br(?: \/)?>/gi, "\n");
}
var VTTParser = class {
	constructor() {
		this.state = "INITIAL", this.buffer = "", this.decoder = new StringDecoder(), this.regionList = [], this.cue = null, this.oncue = void 0, this.onparsingerror = void 0, this.onflush = void 0;
	}
	parse(e) {
		let t = this;
		e && (t.buffer += t.decoder.decode(e, { stream: !0 }));
		function collectNextLine() {
			let e = t.buffer, n = 0;
			for (e = fixLineBreaks(e); n < e.length && e[n] !== "\r" && e[n] !== "\n";) ++n;
			let r = e.slice(0, n);
			return e[n] === "\r" && ++n, e[n] === "\n" && ++n, t.buffer = e.slice(n), r;
		}
		function parseHeader(e) {
			parseOptions(e, function(e, t) {}, /:/);
		}
		try {
			let e = "";
			if (t.state === "INITIAL") {
				if (!/\r\n|\n/.test(t.buffer)) return this;
				e = collectNextLine();
				let n = e.match(/^(ï»¿)?WEBVTT([ \t].*)?$/);
				if (!(n != null && n[0])) throw Error("Malformed WebVTT signature.");
				t.state = "HEADER";
			}
			let n = !1;
			for (; t.buffer;) {
				if (!/\r\n|\n/.test(t.buffer)) return this;
				switch (n ? n = !1 : e = collectNextLine(), t.state) {
					case "HEADER":
						/:/.test(e) ? parseHeader(e) : e || (t.state = "ID");
						continue;
					case "NOTE":
						e || (t.state = "ID");
						continue;
					case "ID":
						if (/^NOTE($|[ \t])/.test(e)) {
							t.state = "NOTE";
							break;
						}
						if (!e) continue;
						if (t.cue = new Ve(0, 0, ""), t.state = "CUE", e.indexOf("-->") === -1) {
							t.cue.id = e;
							continue;
						}
					case "CUE":
						if (!t.cue) {
							t.state = "BADCUE";
							continue;
						}
						try {
							parseCue(e, t.cue, t.regionList);
						} catch {
							t.cue = null, t.state = "BADCUE";
							continue;
						}
						t.state = "CUETEXT";
						continue;
					case "CUETEXT":
						{
							let r = e.indexOf("-->") !== -1;
							if (!e || r && (n = !0)) {
								t.oncue && t.cue && t.oncue(t.cue), t.cue = null, t.state = "ID";
								continue;
							}
							if (t.cue === null) continue;
							t.cue.text && (t.cue.text += "\n"), t.cue.text += e;
						}
						continue;
					case "BADCUE": e || (t.state = "ID");
				}
			}
		} catch {
			t.state === "CUETEXT" && t.cue && t.oncue && t.oncue(t.cue), t.cue = null, t.state = t.state === "INITIAL" ? "BADWEBVTT" : "BADCUE";
		}
		return this;
	}
	flush() {
		let e = this;
		try {
			if ((e.cue || e.state === "HEADER") && (e.buffer += "\n\n", e.parse()), e.state === "INITIAL" || e.state === "BADWEBVTT") throw Error("Malformed WebVTT signature.");
		} catch (t) {
			e.onparsingerror && e.onparsingerror(t);
		}
		return e.onflush && e.onflush(), this;
	}
}, We = /\r\n|\n\r|\n|\r/g, Ge = function startsWith(e, t, n = 0) {
	return e.slice(n, n + t.length) === t;
}, Ke = function cueString2millis(e) {
	let t = parseInt(e.slice(-3)), r = parseInt(e.slice(-6, -4)), i = parseInt(e.slice(-9, -7)), a = e.length > 9 ? parseInt(e.substring(0, e.indexOf(":"))) : 0;
	if (!n(t) || !n(r) || !n(i) || !n(a)) throw Error(`Malformed X-TIMESTAMP-MAP: Local:${e}`);
	return t += 1e3 * r, t += 6e4 * i, t += 36e5 * a, t;
}, qe = function hash(e) {
	let t = 5381, n = e.length;
	for (; n;) t = t * 33 ^ e.charCodeAt(--n);
	return (t >>> 0).toString();
};
function generateCueId(e, t, n) {
	return qe(e.toString()) + qe(t.toString()) + qe(n);
}
var Je = function calculateOffset(e, t, n) {
	let r = e[t], i = e[r.prevCC];
	if (!i || !i.new && r.new) {
		e.ccOffset = e.presentationOffset = r.start, r.new = !1;
		return;
	}
	for (; (a = i) != null && a.new;) {
		var a;
		e.ccOffset += r.start - i.start, r.new = !1, r = i, i = e[r.prevCC];
	}
	e.presentationOffset = n;
};
function parseWebVTT(e, t, n, r, i, a, o) {
	let s = new VTTParser(), c = utf8ArrayToStr(new Uint8Array(e)).trim().replace(We, "\n").split("\n"), l = [], u = t ? toMpegTsClockFromTimescale(t.baseTime, t.timescale) : 0, d = "00:00.000", f = 0, p = 0, m, h = !0;
	s.oncue = function(e) {
		let a = n[r], o = n.ccOffset, s = (f - u) / 9e4;
		if (a != null && a.new && (p === void 0 ? Je(n, r, s) : o = n.ccOffset = a.start), s) {
			if (!t) {
				m = /* @__PURE__ */ Error("Missing initPTS for VTT MPEGTS");
				return;
			}
			o = s - n.presentationOffset;
		}
		let c = e.endTime - e.startTime, d = normalizePts((e.startTime + o - p) * 9e4, i * 9e4) / 9e4;
		e.startTime = Math.max(d, 0), e.endTime = Math.max(d + c, 0);
		let h = e.text.trim();
		e.text = decodeURIComponent(encodeURIComponent(h)), e.id ||= generateCueId(e.startTime, e.endTime, h), e.endTime > 0 && l.push(e);
	}, s.onparsingerror = function(e) {
		m = e;
	}, s.onflush = function() {
		if (m) {
			o(m);
			return;
		}
		a(l);
	}, c.forEach((e) => {
		if (h) {
			if (Ge(e, "X-TIMESTAMP-MAP=")) {
				h = !1, e.slice(16).split(",").forEach((e) => {
					Ge(e, "LOCAL:") ? d = e.slice(6) : Ge(e, "MPEGTS:") && (f = parseInt(e.slice(7)));
				});
				try {
					p = Ke(d) / 1e3;
				} catch (e) {
					m = e;
				}
				return;
			}
			e === "" && (h = !1);
		}
		s.parse(e + "\n");
	}), s.flush();
}
var Ye = "stpp.ttml.im1t", Xe = /^(\d{2,}):(\d{2}):(\d{2}):(\d{2})\.?(\d+)?$/, Ze = /^(\d*(?:\.\d*)?)(h|m|s|ms|f|t)$/, Qe = {
	left: "start",
	center: "center",
	right: "end",
	start: "start",
	end: "end"
};
function parseIMSC1(e, t, n, r) {
	let i = findBox(new Uint8Array(e), ["mdat"]);
	if (i.length === 0) {
		r(/* @__PURE__ */ Error("Could not parse IMSC1 mdat"));
		return;
	}
	let a = i.map((e) => utf8ArrayToStr(e)), o = toTimescaleFromScale(t.baseTime, 1, t.timescale);
	try {
		a.forEach((e) => n(parseTTML(e, o)));
	} catch (e) {
		r(e);
	}
}
function parseTTML(e, t) {
	let n = new DOMParser().parseFromString(e, "text/xml").getElementsByTagName("tt")[0];
	if (!n) throw Error("Invalid ttml");
	let r = {
		frameRate: 30,
		subFrameRate: 1,
		frameRateMultiplier: 0,
		tickRate: 0
	}, i = Object.keys(r).reduce((e, t) => (e[t] = n.getAttribute(`ttp:${t}`) || r[t], e), {}), a = n.getAttribute("xml:space") !== "preserve", o = collectionToDictionary(getElementCollection(n, "styling", "style")), s = collectionToDictionary(getElementCollection(n, "layout", "region")), c = getElementCollection(n, "body", "[begin]");
	return [].map.call(c, (e) => {
		let n = getTextContent(e, a);
		if (!n || !e.hasAttribute("begin")) return null;
		let r = parseTtmlTime(e.getAttribute("begin"), i), c = parseTtmlTime(e.getAttribute("dur"), i), l = parseTtmlTime(e.getAttribute("end"), i);
		if (r === null) throw timestampParsingError(e);
		if (l === null) {
			if (c === null) throw timestampParsingError(e);
			l = r + c;
		}
		let u = new Ve(r - t, l - t, n);
		u.id = generateCueId(u.startTime, u.endTime, u.text);
		let d = s[e.getAttribute("region")], f = o[e.getAttribute("style")], p = getTtmlStyles(d, f, o), { textAlign: m } = p;
		if (m) {
			let e = Qe[m];
			e && (u.lineAlign = e), u.align = m;
		}
		return _extends(u, p), u;
	}).filter((e) => e !== null);
}
function getElementCollection(e, t, n) {
	let r = e.getElementsByTagName(t)[0];
	return r ? [].slice.call(r.querySelectorAll(n)) : [];
}
function collectionToDictionary(e) {
	return e.reduce((e, t) => {
		let n = t.getAttribute("xml:id");
		return n && (e[n] = t), e;
	}, {});
}
function getTextContent(e, t) {
	return [].slice.call(e.childNodes).reduce((e, n, r) => {
		var i;
		return n.nodeName === "br" && r ? e + "\n" : (i = n.childNodes) != null && i.length ? getTextContent(n, t) : t ? e + n.textContent.trim().replace(/\s+/g, " ") : e + n.textContent;
	}, "");
}
function getTtmlStyles(e, t, n) {
	let r = "http://www.w3.org/ns/ttml#styling", i = null, a = [
		"displayAlign",
		"textAlign",
		"color",
		"backgroundColor",
		"fontSize",
		"fontFamily"
	], o = e != null && e.hasAttribute("style") ? e.getAttribute("style") : null;
	return o && n.hasOwnProperty(o) && (i = n[o]), a.reduce((n, a) => {
		let o = getAttributeNS(t, r, a) || getAttributeNS(e, r, a) || getAttributeNS(i, r, a);
		return o && (n[a] = o), n;
	}, {});
}
function getAttributeNS(e, t, n) {
	return e && e.hasAttributeNS(t, n) ? e.getAttributeNS(t, n) : null;
}
function timestampParsingError(e) {
	return /* @__PURE__ */ Error(`Could not parse ttml timestamp ${e}`);
}
function parseTtmlTime(e, t) {
	if (!e) return null;
	let n = parseTimeStamp(e);
	return n === null && (Xe.test(e) ? n = parseHoursMinutesSecondsFrames(e, t) : Ze.test(e) && (n = parseTimeUnits(e, t))), n;
}
function parseHoursMinutesSecondsFrames(e, t) {
	let n = Xe.exec(e), r = (n[4] | 0) + (n[5] | 0) / t.subFrameRate;
	return (n[1] | 0) * 3600 + (n[2] | 0) * 60 + (n[3] | 0) + r / t.frameRate;
}
function parseTimeUnits(e, t) {
	let n = Ze.exec(e), r = Number(n[1]);
	switch (n[2]) {
		case "h": return r * 3600;
		case "m": return r * 60;
		case "ms": return r * 1e3;
		case "f": return r / t.frameRate;
		case "t": return r / t.tickRate;
	}
	return r;
}
var TimelineController = class {
	constructor(e) {
		this.hls = void 0, this.media = null, this.config = void 0, this.enabled = !0, this.Cues = void 0, this.textTracks = [], this.tracks = [], this.initPTS = [], this.unparsedVttFrags = [], this.captionsTracks = {}, this.nonNativeCaptionsTracks = {}, this.cea608Parser1 = void 0, this.cea608Parser2 = void 0, this.lastCc = -1, this.lastSn = -1, this.lastPartIndex = -1, this.prevCC = -1, this.vttCCs = newVTTCCs(), this.captionsProperties = void 0, this.hls = e, this.config = e.config, this.Cues = e.config.cueHandler, this.captionsProperties = {
			textTrack1: {
				label: this.config.captionsTextTrack1Label,
				languageCode: this.config.captionsTextTrack1LanguageCode
			},
			textTrack2: {
				label: this.config.captionsTextTrack2Label,
				languageCode: this.config.captionsTextTrack2LanguageCode
			},
			textTrack3: {
				label: this.config.captionsTextTrack3Label,
				languageCode: this.config.captionsTextTrack3LanguageCode
			},
			textTrack4: {
				label: this.config.captionsTextTrack4Label,
				languageCode: this.config.captionsTextTrack4LanguageCode
			}
		}, e.on(a.MEDIA_ATTACHING, this.onMediaAttaching, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_LOADED, this.onManifestLoaded, this), e.on(a.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this), e.on(a.FRAG_LOADING, this.onFragLoading, this), e.on(a.FRAG_LOADED, this.onFragLoaded, this), e.on(a.FRAG_PARSING_USERDATA, this.onFragParsingUserdata, this), e.on(a.FRAG_DECRYPTED, this.onFragDecrypted, this), e.on(a.INIT_PTS_FOUND, this.onInitPtsFound, this), e.on(a.SUBTITLE_TRACKS_CLEARED, this.onSubtitleTracksCleared, this), e.on(a.BUFFER_FLUSHING, this.onBufferFlushing, this);
	}
	destroy() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHING, this.onMediaAttaching, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_LOADED, this.onManifestLoaded, this), e.off(a.SUBTITLE_TRACKS_UPDATED, this.onSubtitleTracksUpdated, this), e.off(a.FRAG_LOADING, this.onFragLoading, this), e.off(a.FRAG_LOADED, this.onFragLoaded, this), e.off(a.FRAG_PARSING_USERDATA, this.onFragParsingUserdata, this), e.off(a.FRAG_DECRYPTED, this.onFragDecrypted, this), e.off(a.INIT_PTS_FOUND, this.onInitPtsFound, this), e.off(a.SUBTITLE_TRACKS_CLEARED, this.onSubtitleTracksCleared, this), e.off(a.BUFFER_FLUSHING, this.onBufferFlushing, this), this.hls = this.config = null, this.cea608Parser1 = this.cea608Parser2 = void 0;
	}
	initCea608Parsers() {
		if (this.config.enableCEA708Captions && (!this.cea608Parser1 || !this.cea608Parser2)) {
			let e = new OutputFilter(this, "textTrack1"), t = new OutputFilter(this, "textTrack2"), n = new OutputFilter(this, "textTrack3"), r = new OutputFilter(this, "textTrack4");
			this.cea608Parser1 = new Cea608Parser(1, e, t), this.cea608Parser2 = new Cea608Parser(3, n, r);
		}
	}
	addCues(e, t, n, r, i) {
		let o = !1;
		for (let e = i.length; e--;) {
			let r = i[e], a = intersection(r[0], r[1], t, n);
			if (a >= 0 && (r[0] = Math.min(r[0], t), r[1] = Math.max(r[1], n), o = !0, a / (n - t) > .5)) return;
		}
		if (o || i.push([t, n]), this.config.renderTextTracksNatively) {
			let i = this.captionsTracks[e];
			this.Cues.newCue(i, t, n, r);
		} else {
			let i = this.Cues.newCue(null, t, n, r);
			this.hls.trigger(a.CUES_PARSED, {
				type: "captions",
				cues: i,
				track: e
			});
		}
	}
	onInitPtsFound(e, { frag: t, id: n, initPTS: r, timescale: i }) {
		let { unparsedVttFrags: o } = this;
		n === "main" && (this.initPTS[t.cc] = {
			baseTime: r,
			timescale: i
		}), o.length && (this.unparsedVttFrags = [], o.forEach((e) => {
			this.onFragLoaded(a.FRAG_LOADED, e);
		}));
	}
	getExistingTrack(e, t) {
		let { media: n } = this;
		if (n) for (let r = 0; r < n.textTracks.length; r++) {
			let i = n.textTracks[r];
			if (canReuseVttTextTrack(i, {
				name: e,
				lang: t,
				attrs: {}
			})) return i;
		}
		return null;
	}
	createCaptionsTrack(e) {
		this.config.renderTextTracksNatively ? this.createNativeTrack(e) : this.createNonNativeTrack(e);
	}
	createNativeTrack(e) {
		if (this.captionsTracks[e]) return;
		let { captionsProperties: t, captionsTracks: n, media: r } = this, { label: i, languageCode: a } = t[e], o = this.getExistingTrack(i, a);
		if (o) n[e] = o, clearCurrentCues(n[e]), sendAddTrackEvent(n[e], r);
		else {
			let t = this.createTextTrack("captions", i, a);
			t && (t[e] = !0, n[e] = t);
		}
	}
	createNonNativeTrack(e) {
		if (this.nonNativeCaptionsTracks[e]) return;
		let t = this.captionsProperties[e];
		if (!t) return;
		let n = {
			_id: e,
			label: t.label,
			kind: "captions",
			default: t.media ? !!t.media.default : !1,
			closedCaptions: t.media
		};
		this.nonNativeCaptionsTracks[e] = n, this.hls.trigger(a.NON_NATIVE_TEXT_TRACKS_FOUND, { tracks: [n] });
	}
	createTextTrack(e, t, n) {
		let r = this.media;
		if (r) return r.addTextTrack(e, t, n);
	}
	onMediaAttaching(e, t) {
		this.media = t.media, this._cleanTracks();
	}
	onMediaDetaching() {
		let { captionsTracks: e } = this;
		Object.keys(e).forEach((t) => {
			clearCurrentCues(e[t]), delete e[t];
		}), this.nonNativeCaptionsTracks = {};
	}
	onManifestLoading() {
		this.lastCc = -1, this.lastSn = -1, this.lastPartIndex = -1, this.prevCC = -1, this.vttCCs = newVTTCCs(), this._cleanTracks(), this.tracks = [], this.captionsTracks = {}, this.nonNativeCaptionsTracks = {}, this.textTracks = [], this.unparsedVttFrags = [], this.initPTS = [], this.cea608Parser1 && this.cea608Parser2 && (this.cea608Parser1.reset(), this.cea608Parser2.reset());
	}
	_cleanTracks() {
		let { media: e } = this;
		if (!e) return;
		let t = e.textTracks;
		if (t) for (let e = 0; e < t.length; e++) clearCurrentCues(t[e]);
	}
	onSubtitleTracksUpdated(e, t) {
		let n = t.subtitleTracks || [], r = n.some((e) => e.textCodec === Ye);
		if (this.config.enableWebVTT || r && this.config.enableIMSC1) {
			if (subtitleOptionsIdentical(this.tracks, n)) {
				this.tracks = n;
				return;
			}
			if (this.textTracks = [], this.tracks = n, this.config.renderTextTracksNatively) {
				let e = this.media, t = e ? filterSubtitleTracks(e.textTracks) : null;
				if (this.tracks.forEach((e, n) => {
					let r;
					if (t) {
						let n = null;
						for (let r = 0; r < t.length; r++) if (t[r] && canReuseVttTextTrack(t[r], e)) {
							n = t[r], t[r] = null;
							break;
						}
						n && (r = n);
					}
					if (r) clearCurrentCues(r);
					else {
						let t = captionsOrSubtitlesFromCharacteristics(e);
						r = this.createTextTrack(t, e.name, e.lang), r && (r.mode = "disabled");
					}
					r && this.textTracks.push(r);
				}), t != null && t.length) {
					let e = t.filter((e) => e !== null).map((e) => e.label);
					e.length && d.warn(`Media element contains unused subtitle tracks: ${e.join(", ")}. Replace media element for each source to clear TextTracks and captions menu.`);
				}
			} else if (this.tracks.length) {
				let e = this.tracks.map((e) => ({
					label: e.name,
					kind: e.type.toLowerCase(),
					default: e.default,
					subtitleTrack: e
				}));
				this.hls.trigger(a.NON_NATIVE_TEXT_TRACKS_FOUND, { tracks: e });
			}
		}
	}
	onManifestLoaded(e, t) {
		this.config.enableCEA708Captions && t.captions && t.captions.forEach((e) => {
			let t = /(?:CC|SERVICE)([1-4])/.exec(e.instreamId);
			if (!t) return;
			let n = `textTrack${t[1]}`, r = this.captionsProperties[n];
			r && (r.label = e.name, e.lang && (r.languageCode = e.lang), r.media = e);
		});
	}
	closedCaptionsForLevel(e) {
		return this.hls.levels[e.level]?.attrs["CLOSED-CAPTIONS"];
	}
	onFragLoading(e, t) {
		if (this.enabled && t.frag.type === I.MAIN) {
			let { cea608Parser1: e, cea608Parser2: n, lastSn: r } = this, { cc: i, sn: a } = t.frag, o = t.part?.index ?? -1;
			e && n && (a !== r + 1 || a === r && o !== this.lastPartIndex + 1 || i !== this.lastCc) && (e.reset(), n.reset()), this.lastCc = i, this.lastSn = a, this.lastPartIndex = o;
		}
	}
	onFragLoaded(e, t) {
		let { frag: n, payload: r } = t;
		if (n.type === I.SUBTITLE) {
			if (r.byteLength) {
				let e = n.decryptdata, i = "stats" in t;
				if (e == null || !e.encrypted || i) {
					let e = this.tracks[n.level], i = this.vttCCs;
					i[n.cc] || (i[n.cc] = {
						start: n.start,
						prevCC: this.prevCC,
						new: !0
					}, this.prevCC = n.cc), e && e.textCodec === Ye ? this._parseIMSC1(n, r) : this._parseVTTs(t);
				}
			} else this.hls.trigger(a.SUBTITLE_FRAG_PROCESSED, {
				success: !1,
				frag: n,
				error: /* @__PURE__ */ Error("Empty subtitle payload")
			});
		}
	}
	_parseIMSC1(e, t) {
		let n = this.hls;
		parseIMSC1(t, this.initPTS[e.cc], (t) => {
			this._appendCues(t, e.level), n.trigger(a.SUBTITLE_FRAG_PROCESSED, {
				success: !0,
				frag: e
			});
		}, (t) => {
			d.log(`Failed to parse IMSC1: ${t}`), n.trigger(a.SUBTITLE_FRAG_PROCESSED, {
				success: !1,
				frag: e,
				error: t
			});
		});
	}
	_parseVTTs(e) {
		var t;
		let { frag: n, payload: r } = e, { initPTS: i, unparsedVttFrags: o } = this, s = i.length - 1;
		if (!i[n.cc] && s === -1) {
			o.push(e);
			return;
		}
		let c = this.hls;
		parseWebVTT((t = n.initSegment) != null && t.data ? appendUint8Array(n.initSegment.data, new Uint8Array(r)) : r, this.initPTS[n.cc], this.vttCCs, n.cc, n.start, (e) => {
			this._appendCues(e, n.level), c.trigger(a.SUBTITLE_FRAG_PROCESSED, {
				success: !0,
				frag: n
			});
		}, (t) => {
			let i = t.message === "Missing initPTS for VTT MPEGTS";
			i ? o.push(e) : this._fallbackToIMSC1(n, r), d.log(`Failed to parse VTT cue: ${t}`), !(i && s > n.cc) && c.trigger(a.SUBTITLE_FRAG_PROCESSED, {
				success: !1,
				frag: n,
				error: t
			});
		});
	}
	_fallbackToIMSC1(e, t) {
		let n = this.tracks[e.level];
		n.textCodec || parseIMSC1(t, this.initPTS[e.cc], () => {
			n.textCodec = Ye, this._parseIMSC1(e, t);
		}, () => {
			n.textCodec = "wvtt";
		});
	}
	_appendCues(e, t) {
		let n = this.hls;
		if (this.config.renderTextTracksNatively) {
			let n = this.textTracks[t];
			if (!n || n.mode === "disabled") return;
			e.forEach((e) => addCueToTrack(n, e));
		} else {
			let r = this.tracks[t];
			if (!r) return;
			let i = r.default ? "default" : "subtitles" + t;
			n.trigger(a.CUES_PARSED, {
				type: "subtitles",
				cues: e,
				track: i
			});
		}
	}
	onFragDecrypted(e, t) {
		let { frag: n } = t;
		n.type === I.SUBTITLE && this.onFragLoaded(a.FRAG_LOADED, t);
	}
	onSubtitleTracksCleared() {
		this.tracks = [], this.captionsTracks = {};
	}
	onFragParsingUserdata(e, t) {
		this.initCea608Parsers();
		let { cea608Parser1: n, cea608Parser2: r } = this;
		if (!this.enabled || !n || !r) return;
		let { frag: i, samples: a } = t;
		if (i.type !== I.MAIN || this.closedCaptionsForLevel(i) !== "NONE") for (let e = 0; e < a.length; e++) {
			let t = a[e].bytes;
			if (t) {
				let i = this.extractCea608Data(t);
				n.addData(a[e].pts, i[0]), r.addData(a[e].pts, i[1]);
			}
		}
	}
	onBufferFlushing(e, { startOffset: t, endOffset: n, endOffsetSubtitles: r, type: i }) {
		let { media: a } = this;
		if (!(!a || a.currentTime < n)) {
			if (!i || i === "video") {
				let { captionsTracks: e } = this;
				Object.keys(e).forEach((r) => removeCuesInRange(e[r], t, n));
			}
			if (this.config.renderTextTracksNatively && t === 0 && r !== void 0) {
				let { textTracks: e } = this;
				Object.keys(e).forEach((n) => removeCuesInRange(e[n], t, r));
			}
		}
	}
	extractCea608Data(e) {
		let t = [[], []], n = e[0] & 31, r = 2;
		for (let i = 0; i < n; i++) {
			let n = e[r++], i = 127 & e[r++], a = 127 & e[r++];
			if ((i !== 0 || a !== 0) && 4 & n) {
				let e = 3 & n;
				(e === 0 || e === 1) && (t[e].push(i), t[e].push(a));
			}
		}
		return t;
	}
};
function captionsOrSubtitlesFromCharacteristics(e) {
	return e.characteristics && /transcribes-spoken-dialog/gi.test(e.characteristics) && /describes-music-and-sound/gi.test(e.characteristics) ? "captions" : "subtitles";
}
function canReuseVttTextTrack(e, t) {
	return !!e && e.kind === captionsOrSubtitlesFromCharacteristics(t) && subtitleTrackMatchesTextTrack(t, e);
}
function intersection(e, t, n, r) {
	return Math.min(t, r) - Math.max(e, n);
}
function newVTTCCs() {
	return {
		ccOffset: 0,
		presentationOffset: 0,
		0: {
			start: 0,
			prevCC: -1,
			new: !0
		}
	};
}
var $e = class CapLevelController {
	constructor(e) {
		this.hls = void 0, this.autoLevelCapping = void 0, this.firstLevel = void 0, this.media = void 0, this.restrictedLevels = void 0, this.timer = void 0, this.clientRect = void 0, this.streamController = void 0, this.hls = e, this.autoLevelCapping = Infinity, this.firstLevel = -1, this.media = null, this.restrictedLevels = [], this.timer = void 0, this.clientRect = null, this.registerListeners();
	}
	setStreamController(e) {
		this.streamController = e;
	}
	destroy() {
		this.hls && this.unregisterListener(), this.timer && this.stopCapping(), this.media = null, this.clientRect = null, this.hls = this.streamController = null;
	}
	registerListeners() {
		let { hls: e } = this;
		e.on(a.FPS_DROP_LEVEL_CAPPING, this.onFpsDropLevelCapping, this), e.on(a.MEDIA_ATTACHING, this.onMediaAttaching, this), e.on(a.MANIFEST_PARSED, this.onManifestParsed, this), e.on(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.on(a.BUFFER_CODECS, this.onBufferCodecs, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this);
	}
	unregisterListener() {
		let { hls: e } = this;
		e.off(a.FPS_DROP_LEVEL_CAPPING, this.onFpsDropLevelCapping, this), e.off(a.MEDIA_ATTACHING, this.onMediaAttaching, this), e.off(a.MANIFEST_PARSED, this.onManifestParsed, this), e.off(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.off(a.BUFFER_CODECS, this.onBufferCodecs, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this);
	}
	onFpsDropLevelCapping(e, t) {
		let n = this.hls.levels[t.droppedLevel];
		this.isLevelAllowed(n) && this.restrictedLevels.push({
			bitrate: n.bitrate,
			height: n.height,
			width: n.width
		});
	}
	onMediaAttaching(e, t) {
		this.media = t.media instanceof HTMLVideoElement ? t.media : null, this.clientRect = null, this.timer && this.hls.levels.length && this.detectPlayerSize();
	}
	onManifestParsed(e, t) {
		let n = this.hls;
		this.restrictedLevels = [], this.firstLevel = t.firstLevel, n.config.capLevelToPlayerSize && t.video && this.startCapping();
	}
	onLevelsUpdated(e, t) {
		this.timer && n(this.autoLevelCapping) && this.detectPlayerSize();
	}
	onBufferCodecs(e, t) {
		this.hls.config.capLevelToPlayerSize && t.video && this.startCapping();
	}
	onMediaDetaching() {
		this.stopCapping();
	}
	detectPlayerSize() {
		if (this.media) {
			if (this.mediaHeight <= 0 || this.mediaWidth <= 0) {
				this.clientRect = null;
				return;
			}
			let e = this.hls.levels;
			if (e.length) {
				let t = this.hls, n = this.getMaxLevel(e.length - 1);
				n !== this.autoLevelCapping && d.log(`Setting autoLevelCapping to ${n}: ${e[n].height}p@${e[n].bitrate} for media ${this.mediaWidth}x${this.mediaHeight}`), t.autoLevelCapping = n, t.autoLevelCapping > this.autoLevelCapping && this.streamController && this.streamController.nextLevelSwitch(), this.autoLevelCapping = t.autoLevelCapping;
			}
		}
	}
	getMaxLevel(e) {
		let t = this.hls.levels;
		if (!t.length) return -1;
		let n = t.filter((t, n) => this.isLevelAllowed(t) && n <= e);
		return this.clientRect = null, CapLevelController.getMaxLevelByMediaSize(n, this.mediaWidth, this.mediaHeight);
	}
	startCapping() {
		this.timer || (this.autoLevelCapping = Infinity, self.clearInterval(this.timer), this.timer = self.setInterval(this.detectPlayerSize.bind(this), 1e3), this.detectPlayerSize());
	}
	stopCapping() {
		this.restrictedLevels = [], this.firstLevel = -1, this.autoLevelCapping = Infinity, this.timer &&= (self.clearInterval(this.timer), void 0);
	}
	getDimensions() {
		if (this.clientRect) return this.clientRect;
		let e = this.media, t = {
			width: 0,
			height: 0
		};
		if (e) {
			let n = e.getBoundingClientRect();
			t.width = n.width, t.height = n.height, !t.width && !t.height && (t.width = n.right - n.left || e.width || 0, t.height = n.bottom - n.top || e.height || 0);
		}
		return this.clientRect = t, t;
	}
	get mediaWidth() {
		return this.getDimensions().width * this.contentScaleFactor;
	}
	get mediaHeight() {
		return this.getDimensions().height * this.contentScaleFactor;
	}
	get contentScaleFactor() {
		let e = 1;
		if (!this.hls.config.ignoreDevicePixelRatio) try {
			e = self.devicePixelRatio;
		} catch {}
		return e;
	}
	isLevelAllowed(e) {
		return !this.restrictedLevels.some((t) => e.bitrate === t.bitrate && e.width === t.width && e.height === t.height);
	}
	static getMaxLevelByMediaSize(e, t, n) {
		if (!(e != null && e.length)) return -1;
		let atGreatestBandwidth = (e, t) => !t || e.width !== t.width || e.height !== t.height, r = e.length - 1, i = Math.max(t, n);
		for (let t = 0; t < e.length; t += 1) {
			let n = e[t];
			if ((n.width >= i || n.height >= i) && atGreatestBandwidth(n, e[t + 1])) {
				r = t;
				break;
			}
		}
		return r;
	}
}, FPSController = class {
	constructor(e) {
		this.hls = void 0, this.isVideoPlaybackQualityAvailable = !1, this.timer = void 0, this.media = null, this.lastTime = void 0, this.lastDroppedFrames = 0, this.lastDecodedFrames = 0, this.streamController = void 0, this.hls = e, this.registerListeners();
	}
	setStreamController(e) {
		this.streamController = e;
	}
	registerListeners() {
		this.hls.on(a.MEDIA_ATTACHING, this.onMediaAttaching, this);
	}
	unregisterListeners() {
		this.hls.off(a.MEDIA_ATTACHING, this.onMediaAttaching, this);
	}
	destroy() {
		this.timer && clearInterval(this.timer), this.unregisterListeners(), this.isVideoPlaybackQualityAvailable = !1, this.media = null;
	}
	onMediaAttaching(e, t) {
		let n = this.hls.config;
		if (n.capLevelOnFPSDrop) {
			let e = t.media instanceof self.HTMLVideoElement ? t.media : null;
			this.media = e, e && typeof e.getVideoPlaybackQuality == "function" && (this.isVideoPlaybackQualityAvailable = !0), self.clearInterval(this.timer), this.timer = self.setInterval(this.checkFPSInterval.bind(this), n.fpsDroppedMonitoringPeriod);
		}
	}
	checkFPS(e, t, n) {
		let r = performance.now();
		if (t) {
			if (this.lastTime) {
				let e = r - this.lastTime, i = n - this.lastDroppedFrames, o = t - this.lastDecodedFrames, s = 1e3 * i / e, c = this.hls;
				if (c.trigger(a.FPS_DROP, {
					currentDropped: i,
					currentDecoded: o,
					totalDroppedFrames: n
				}), s > 0 && i > c.config.fpsDroppedMonitoringThreshold * o) {
					let e = c.currentLevel;
					d.warn("drop FPS ratio greater than max allowed value for currentLevel: " + e), e > 0 && (c.autoLevelCapping === -1 || c.autoLevelCapping >= e) && (--e, c.trigger(a.FPS_DROP_LEVEL_CAPPING, {
						level: e,
						droppedLevel: c.currentLevel
					}), c.autoLevelCapping = e, this.streamController.nextLevelSwitch());
				}
			}
			this.lastTime = r, this.lastDroppedFrames = n, this.lastDecodedFrames = t;
		}
	}
	checkFPSInterval() {
		let e = this.media;
		if (e) {
			if (this.isVideoPlaybackQualityAvailable) {
				let t = e.getVideoPlaybackQuality();
				this.checkFPS(e, t.totalVideoFrames, t.droppedVideoFrames);
			} else this.checkFPS(e, e.webkitDecodedFrameCount, e.webkitDroppedFrameCount);
		}
	}
}, et = "[eme]", tt = class EMEController {
	constructor(e) {
		this.hls = void 0, this.config = void 0, this.media = null, this.keyFormatPromise = null, this.keySystemAccessPromises = {}, this._requestLicenseFailureCount = 0, this.mediaKeySessions = [], this.keyIdToKeySessionPromise = {}, this.setMediaKeysQueue = EMEController.CDMCleanupPromise ? [EMEController.CDMCleanupPromise] : [], this.onMediaEncrypted = this._onMediaEncrypted.bind(this), this.onWaitingForKey = this._onWaitingForKey.bind(this), this.debug = d.debug.bind(d, et), this.log = d.log.bind(d, et), this.warn = d.warn.bind(d, et), this.error = d.error.bind(d, et), this.hls = e, this.config = e.config, this.registerListeners();
	}
	destroy() {
		this.unregisterListeners(), this.onMediaDetached();
		let e = this.config;
		e.requestMediaKeySystemAccessFunc = null, e.licenseXhrSetup = e.licenseResponseCallback = void 0, e.drmSystems = e.drmSystemOptions = {}, this.hls = this.onMediaEncrypted = this.onWaitingForKey = this.keyIdToKeySessionPromise = null, this.config = null;
	}
	registerListeners() {
		this.hls.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), this.hls.on(a.MEDIA_DETACHED, this.onMediaDetached, this), this.hls.on(a.MANIFEST_LOADING, this.onManifestLoading, this), this.hls.on(a.MANIFEST_LOADED, this.onManifestLoaded, this);
	}
	unregisterListeners() {
		this.hls.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), this.hls.off(a.MEDIA_DETACHED, this.onMediaDetached, this), this.hls.off(a.MANIFEST_LOADING, this.onManifestLoading, this), this.hls.off(a.MANIFEST_LOADED, this.onManifestLoaded, this);
	}
	getLicenseServerUrl(e) {
		let { drmSystems: t, widevineLicenseUrl: n } = this.config, r = t[e];
		if (r) return r.licenseUrl;
		if (e === v.WIDEVINE && n) return n;
		throw Error(`no license server URL configured for key-system "${e}"`);
	}
	getServerCertificateUrl(e) {
		let { drmSystems: t } = this.config, n = t[e];
		if (n) return n.serverCertificateUrl;
		this.log(`No Server Certificate in config.drmSystems["${e}"]`);
	}
	attemptKeySystemAccess(e) {
		let t = this.hls.levels, uniqueCodec = (e, t, n) => !!e && n.indexOf(e) === t, n = t.map((e) => e.audioCodec).filter(uniqueCodec), r = t.map((e) => e.videoCodec).filter(uniqueCodec);
		return n.length + r.length === 0 && r.push("avc1.42e01e"), new Promise((t, i) => {
			let attempt = (e) => {
				let a = e.shift();
				this.getMediaKeysPromise(a, n, r).then((e) => t({
					keySystem: a,
					mediaKeys: e
				})).catch((t) => {
					e.length ? attempt(e) : t instanceof EMEKeyError ? i(t) : i(new EMEKeyError({
						type: o.KEY_SYSTEM_ERROR,
						details: s.KEY_SYSTEM_NO_ACCESS,
						error: t,
						fatal: !0
					}, t.message));
				});
			};
			attempt(e);
		});
	}
	requestMediaKeySystemAccess(e, t) {
		let { requestMediaKeySystemAccessFunc: n } = this.config;
		if (typeof n != "function") {
			let e = `Configured requestMediaKeySystemAccess is not a function ${n}`;
			return x === null && self.location.protocol === "http:" && (e = `navigator.requestMediaKeySystemAccess is not available over insecure protocol ${location.protocol}`), Promise.reject(Error(e));
		}
		return n(e, t);
	}
	getMediaKeysPromise(e, t, n) {
		let r = getSupportedMediaKeySystemConfigurations(e, t, n, this.config.drmSystemOptions), i = this.keySystemAccessPromises[e], a = i?.keySystemAccess;
		if (!a) {
			this.log(`Requesting encrypted media "${e}" key-system access with config: ${JSON.stringify(r)}`), a = this.requestMediaKeySystemAccess(e, r);
			let t = this.keySystemAccessPromises[e] = { keySystemAccess: a };
			return a.catch((t) => {
				this.log(`Failed to obtain access to key-system "${e}": ${t}`);
			}), a.then((n) => {
				this.log(`Access for key-system "${n.keySystem}" obtained`);
				let r = this.fetchServerCertificate(e);
				return this.log(`Create media-keys for "${e}"`), t.mediaKeys = n.createMediaKeys().then((t) => (this.log(`Media-keys created for "${e}"`), r.then((n) => n ? this.setMediaKeysServerCertificate(t, e, n) : t))), t.mediaKeys.catch((t) => {
					this.error(`Failed to create media-keys for "${e}"}: ${t}`);
				}), t.mediaKeys;
			});
		}
		return a.then(() => i.mediaKeys);
	}
	createMediaKeySessionContext({ decryptdata: e, keySystem: t, mediaKeys: n }) {
		this.log(`Creating key-system session "${t}" keyId: ${C.hexDump(e.keyId || [])}`);
		let r = {
			decryptdata: e,
			keySystem: t,
			mediaKeys: n,
			mediaKeysSession: n.createSession(),
			keyStatus: "status-pending"
		};
		return this.mediaKeySessions.push(r), r;
	}
	renewKeySession(e) {
		let t = e.decryptdata;
		if (t.pssh) {
			let n = this.createMediaKeySessionContext(e), r = this.getKeyIdString(t);
			this.keyIdToKeySessionPromise[r] = this.generateRequestWithPreferredKeySession(n, "cenc", t.pssh, "expired");
		} else this.warn("Could not renew expired session. Missing pssh initData.");
		this.removeSession(e);
	}
	getKeyIdString(e) {
		if (!e) throw Error("Could not read keyId of undefined decryptdata");
		if (e.keyId === null) throw Error("keyId is null");
		return C.hexDump(e.keyId);
	}
	updateKeySession(e, t) {
		let n = e.mediaKeysSession;
		return this.log(`Updating key-session "${n.sessionId}" for keyID ${C.hexDump(e.decryptdata?.keyId || [])}
      } (data length: ${t && t.byteLength})`), n.update(t);
	}
	selectKeySystemFormat(e) {
		let t = Object.keys(e.levelkeys || {});
		return this.keyFormatPromise ||= (this.log(`Selecting key-system from fragment (sn: ${e.sn} ${e.type}: ${e.level}) key formats ${t.join(", ")}`), this.getKeyFormatPromise(t)), this.keyFormatPromise;
	}
	getKeyFormatPromise(e) {
		return new Promise((t, n) => {
			let r = getKeySystemsForConfig(this.config), i = e.map(keySystemFormatToKeySystemDomain).filter((e) => !!e && r.indexOf(e) !== -1);
			return this.getKeySystemSelectionPromise(i).then(({ keySystem: e }) => {
				let r = keySystemDomainToKeySystemFormat(e);
				r ? t(r) : n(/* @__PURE__ */ Error(`Unable to find format for key-system "${e}"`));
			}).catch(n);
		});
	}
	loadKey(e) {
		let t = e.keyInfo.decryptdata, n = this.getKeyIdString(t), r = `(keyId: ${n} format: "${t.keyFormat}" method: ${t.method} uri: ${t.uri})`;
		this.log(`Starting session for key ${r}`);
		let i = this.keyIdToKeySessionPromise[n];
		return i || (i = this.keyIdToKeySessionPromise[n] = this.getKeySystemForKeyPromise(t).then(({ keySystem: n, mediaKeys: i }) => (this.throwIfDestroyed(), this.log(`Handle encrypted media sn: ${e.frag.sn} ${e.frag.type}: ${e.frag.level} using key ${r}`), this.attemptSetMediaKeys(n, i).then(() => {
			this.throwIfDestroyed();
			let e = this.createMediaKeySessionContext({
				keySystem: n,
				mediaKeys: i,
				decryptdata: t
			});
			return this.generateRequestWithPreferredKeySession(e, "cenc", t.pssh, "playlist-key");
		}))), i.catch((e) => this.handleError(e))), i;
	}
	throwIfDestroyed(e = "Invalid state") {
		if (!this.hls) throw Error("invalid state");
	}
	handleError(e) {
		this.hls && (this.error(e.message), e instanceof EMEKeyError ? this.hls.trigger(a.ERROR, e.data) : this.hls.trigger(a.ERROR, {
			type: o.KEY_SYSTEM_ERROR,
			details: s.KEY_SYSTEM_NO_KEYS,
			error: e,
			fatal: !0
		}));
	}
	getKeySystemForKeyPromise(e) {
		let t = this.getKeyIdString(e), n = this.keyIdToKeySessionPromise[t];
		if (!n) {
			let t = keySystemFormatToKeySystemDomain(e.keyFormat), n = t ? [t] : getKeySystemsForConfig(this.config);
			return this.attemptKeySystemAccess(n);
		}
		return n;
	}
	getKeySystemSelectionPromise(e) {
		if (e.length || (e = getKeySystemsForConfig(this.config)), e.length === 0) throw new EMEKeyError({
			type: o.KEY_SYSTEM_ERROR,
			details: s.KEY_SYSTEM_NO_CONFIGURED_LICENSE,
			fatal: !0
		}, `Missing key-system license configuration options ${JSON.stringify({ drmSystems: this.config.drmSystems })}`);
		return this.attemptKeySystemAccess(e);
	}
	_onMediaEncrypted(e) {
		let { initDataType: t, initData: n } = e;
		if (this.debug(`"${e.type}" event: init data type: "${t}"`), n === null) return;
		let r, i;
		if (t === "sinf" && this.config.drmSystems[v.FAIRPLAY]) {
			let e = bin2str(new Uint8Array(n));
			try {
				let t = base64Decode(JSON.parse(e).sinf), n = parseSinf(new Uint8Array(t));
				if (!n) return;
				r = n.subarray(8, 24), i = v.FAIRPLAY;
			} catch {
				this.warn("Failed to parse sinf \"encrypted\" event message initData");
				return;
			}
		} else {
			let e = parsePssh(n);
			if (e === null) return;
			e.version === 0 && e.systemId === b.WIDEVINE && e.data && (r = e.data.subarray(8, 24)), i = keySystemIdToKeySystemDomain(e.systemId);
		}
		if (!i || !r) return;
		let a = C.hexDump(r), { keyIdToKeySessionPromise: o, mediaKeySessions: s } = this, c = o[a];
		for (let e = 0; e < s.length; e++) {
			let i = s[e], l = i.decryptdata;
			if (l.pssh || !l.keyId) continue;
			let u = C.hexDump(l.keyId);
			if (a === u || l.uri.replace(/-/g, "").indexOf(a) !== -1) {
				c = o[u], delete o[u], l.pssh = new Uint8Array(n), l.keyId = r, c = o[a] = c.then(() => this.generateRequestWithPreferredKeySession(i, t, n, "encrypted-event-key-match"));
				break;
			}
		}
		c ||= o[a] = this.getKeySystemSelectionPromise([i]).then(({ keySystem: e, mediaKeys: i }) => {
			this.throwIfDestroyed();
			let o = new O("ISO-23001-7", a, keySystemDomainToKeySystemFormat(e) ?? "");
			return o.pssh = new Uint8Array(n), o.keyId = r, this.attemptSetMediaKeys(e, i).then(() => {
				this.throwIfDestroyed();
				let r = this.createMediaKeySessionContext({
					decryptdata: o,
					keySystem: e,
					mediaKeys: i
				});
				return this.generateRequestWithPreferredKeySession(r, t, n, "encrypted-event-no-match");
			});
		}), c.catch((e) => this.handleError(e));
	}
	_onWaitingForKey(e) {
		this.log(`"${e.type}" event`);
	}
	attemptSetMediaKeys(e, t) {
		let n = this.setMediaKeysQueue.slice();
		this.log(`Setting media-keys for "${e}"`);
		let r = Promise.all(n).then(() => {
			if (!this.media) throw Error("Attempted to set mediaKeys without media element attached");
			return this.media.setMediaKeys(t);
		});
		return this.setMediaKeysQueue.push(r), r.then(() => {
			this.log(`Media-keys set for "${e}"`), n.push(r), this.setMediaKeysQueue = this.setMediaKeysQueue.filter((e) => n.indexOf(e) === -1);
		});
	}
	generateRequestWithPreferredKeySession(e, t, n, r) {
		let i = this.config.drmSystems?.[e.keySystem]?.generateRequest;
		if (i) try {
			let r = i.call(this.hls, t, n, e);
			if (!r) throw Error("Invalid response from configured generateRequest filter");
			t = r.initDataType, n = e.decryptdata.pssh = r.initData ? new Uint8Array(r.initData) : null;
		} catch (e) {
			var a;
			if (this.warn(e.message), (a = this.hls) != null && a.config.debug) throw e;
		}
		if (n === null) return this.log(`Skipping key-session request for "${r}" (no initData)`), Promise.resolve(e);
		let c = this.getKeyIdString(e.decryptdata);
		this.log(`Generating key-session request for "${r}": ${c} (init data type: ${t} length: ${n ? n.byteLength : null})`);
		let l = new je(), u = e._onmessage = (t) => {
			let n = e.mediaKeysSession;
			if (!n) {
				l.emit("error", /* @__PURE__ */ Error("invalid state"));
				return;
			}
			let { messageType: r, message: i } = t;
			this.log(`"${r}" message event for session "${n.sessionId}" message size: ${i.byteLength}`), r === "license-request" || r === "license-renewal" ? this.renewLicense(e, i).catch((e) => {
				this.handleError(e), l.emit("error", e);
			}) : r === "license-release" ? e.keySystem === v.FAIRPLAY && (this.updateKeySession(e, strToUtf8array("acknowledged")), this.removeSession(e)) : this.warn(`unhandled media key message type "${r}"`);
		}, d = e._onkeystatuseschange = (t) => {
			if (!e.mediaKeysSession) {
				l.emit("error", /* @__PURE__ */ Error("invalid state"));
				return;
			}
			this.onKeyStatusChange(e);
			let n = e.keyStatus;
			l.emit("keyStatus", n), n === "expired" && (this.warn(`${e.keySystem} expired for key ${c}`), this.renewKeySession(e));
		};
		e.mediaKeysSession.addEventListener("message", u), e.mediaKeysSession.addEventListener("keystatuseschange", d);
		let f = new Promise((e, t) => {
			l.on("error", t), l.on("keyStatus", (n) => {
				n.startsWith("usable") ? e() : n === "output-restricted" ? t(new EMEKeyError({
					type: o.KEY_SYSTEM_ERROR,
					details: s.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED,
					fatal: !1
				}, "HDCP level output restricted")) : n === "internal-error" ? t(new EMEKeyError({
					type: o.KEY_SYSTEM_ERROR,
					details: s.KEY_SYSTEM_STATUS_INTERNAL_ERROR,
					fatal: !0
				}, `key status changed to "${n}"`)) : n === "expired" ? t(/* @__PURE__ */ Error("key expired while generating request")) : this.warn(`unhandled key status change "${n}"`);
			});
		});
		return e.mediaKeysSession.generateRequest(t, n).then(() => {
			this.log(`Request generated for key-session "${e.mediaKeysSession?.sessionId}" keyId: ${c}`);
		}).catch((e) => {
			throw new EMEKeyError({
				type: o.KEY_SYSTEM_ERROR,
				details: s.KEY_SYSTEM_NO_SESSION,
				error: e,
				fatal: !1
			}, `Error generating key-session request: ${e}`);
		}).then(() => f).catch((t) => {
			throw l.removeAllListeners(), this.removeSession(e), t;
		}).then(() => (l.removeAllListeners(), e));
	}
	onKeyStatusChange(e) {
		e.mediaKeysSession.keyStatuses.forEach((t, n) => {
			this.log(`key status change "${t}" for keyStatuses keyId: ${C.hexDump("buffer" in n ? new Uint8Array(n.buffer, n.byteOffset, n.byteLength) : new Uint8Array(n))} session keyId: ${C.hexDump(new Uint8Array(e.decryptdata.keyId || []))} uri: ${e.decryptdata.uri}`), e.keyStatus = t;
		});
	}
	fetchServerCertificate(e) {
		let t = this.config, n = t.loader, r = new n(t), i = this.getServerCertificateUrl(e);
		return i ? (this.log(`Fetching server certificate for "${e}"`), new Promise((n, a) => {
			let c = {
				responseType: "arraybuffer",
				url: i
			}, l = t.certLoadPolicy.default, u = {
				loadPolicy: l,
				timeout: l.maxLoadTimeMs,
				maxRetry: 0,
				retryDelay: 0,
				maxRetryDelay: 0
			};
			r.load(c, u, {
				onSuccess: (e, t, r, i) => {
					n(e.data);
				},
				onError: (t, n, r, l) => {
					a(new EMEKeyError({
						type: o.KEY_SYSTEM_ERROR,
						details: s.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED,
						fatal: !0,
						networkDetails: r,
						response: _objectSpread2({
							url: c.url,
							data: void 0
						}, t)
					}, `"${e}" certificate request failed (${i}). Status: ${t.code} (${t.text})`));
				},
				onTimeout: (t, n, r) => {
					a(new EMEKeyError({
						type: o.KEY_SYSTEM_ERROR,
						details: s.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED,
						fatal: !0,
						networkDetails: r,
						response: {
							url: c.url,
							data: void 0
						}
					}, `"${e}" certificate request timed out (${i})`));
				},
				onAbort: (e, t, n) => {
					a(/* @__PURE__ */ Error("aborted"));
				}
			});
		})) : Promise.resolve();
	}
	setMediaKeysServerCertificate(e, t, n) {
		return new Promise((r, i) => {
			e.setServerCertificate(n).then((i) => {
				this.log(`setServerCertificate ${i ? "success" : "not supported by CDM"} (${n?.byteLength}) on "${t}"`), r(e);
			}).catch((e) => {
				i(new EMEKeyError({
					type: o.KEY_SYSTEM_ERROR,
					details: s.KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED,
					error: e,
					fatal: !0
				}, e.message));
			});
		});
	}
	renewLicense(e, t) {
		return this.requestLicense(e, new Uint8Array(t)).then((t) => this.updateKeySession(e, new Uint8Array(t)).catch((e) => {
			throw new EMEKeyError({
				type: o.KEY_SYSTEM_ERROR,
				details: s.KEY_SYSTEM_SESSION_UPDATE_FAILED,
				error: e,
				fatal: !0
			}, e.message);
		}));
	}
	unpackPlayReadyKeyMessage(e, t) {
		let n = String.fromCharCode.apply(null, new Uint16Array(t.buffer));
		if (!n.includes("PlayReadyKeyMessage")) return e.setRequestHeader("Content-Type", "text/xml; charset=utf-8"), t;
		let r = new DOMParser().parseFromString(n, "application/xml"), i = r.querySelectorAll("HttpHeader");
		if (i.length > 0) {
			let t;
			for (let n = 0, r = i.length; n < r; n++) {
				t = i[n];
				let r = t.querySelector("name")?.textContent, a = t.querySelector("value")?.textContent;
				r && a && e.setRequestHeader(r, a);
			}
		}
		let a = r.querySelector("Challenge")?.textContent;
		if (!a) throw Error("Cannot find <Challenge> in key message");
		return strToUtf8array(atob(a));
	}
	setupLicenseXHR(e, t, n, r) {
		let i = this.config.licenseXhrSetup;
		return i ? Promise.resolve().then(() => {
			if (!n.decryptdata) throw Error("Key removed");
			return i.call(this.hls, e, t, n, r);
		}).catch((a) => {
			if (!n.decryptdata) throw a;
			return e.open("POST", t, !0), i.call(this.hls, e, t, n, r);
		}).then((n) => (e.readyState || e.open("POST", t, !0), {
			xhr: e,
			licenseChallenge: n || r
		})) : (e.open("POST", t, !0), Promise.resolve({
			xhr: e,
			licenseChallenge: r
		}));
	}
	requestLicense(e, t) {
		let n = this.config.keyLoadPolicy.default;
		return new Promise((r, i) => {
			let a = this.getLicenseServerUrl(e.keySystem);
			this.log(`Sending license request to URL: ${a}`);
			let c = new XMLHttpRequest();
			c.responseType = "arraybuffer", c.onreadystatechange = () => {
				if (!this.hls || !e.mediaKeysSession) return i(/* @__PURE__ */ Error("invalid state"));
				if (c.readyState === 4) {
					if (c.status === 200) {
						this._requestLicenseFailureCount = 0;
						let t = c.response;
						this.log(`License received ${t instanceof ArrayBuffer ? t.byteLength : t}`);
						let n = this.config.licenseResponseCallback;
						if (n) try {
							t = n.call(this.hls, c, a, e);
						} catch (e) {
							this.error(e);
						}
						r(t);
					} else {
						let l = n.errorRetry, u = l ? l.maxNumRetry : 0;
						if (this._requestLicenseFailureCount++, this._requestLicenseFailureCount > u || c.status >= 400 && c.status < 500) i(new EMEKeyError({
							type: o.KEY_SYSTEM_ERROR,
							details: s.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
							fatal: !0,
							networkDetails: c,
							response: {
								url: a,
								data: void 0,
								code: c.status,
								text: c.statusText
							}
						}, `License Request XHR failed (${a}). Status: ${c.status} (${c.statusText})`));
						else {
							let n = u - this._requestLicenseFailureCount + 1;
							this.warn(`Retrying license request, ${n} attempts left`), this.requestLicense(e, t).then(r, i);
						}
					}
				}
			}, e.licenseXhr && e.licenseXhr.readyState !== XMLHttpRequest.DONE && e.licenseXhr.abort(), e.licenseXhr = c, this.setupLicenseXHR(c, a, e, t).then(({ xhr: t, licenseChallenge: n }) => {
				e.keySystem == v.PLAYREADY && (n = this.unpackPlayReadyKeyMessage(t, n)), t.send(n);
			});
		});
	}
	onMediaAttached(e, t) {
		if (!this.config.emeEnabled) return;
		let n = t.media;
		this.media = n, n.addEventListener("encrypted", this.onMediaEncrypted), n.addEventListener("waitingforkey", this.onWaitingForKey);
	}
	onMediaDetached() {
		let e = this.media, t = this.mediaKeySessions;
		e && (e.removeEventListener("encrypted", this.onMediaEncrypted), e.removeEventListener("waitingforkey", this.onWaitingForKey), this.media = null), this._requestLicenseFailureCount = 0, this.setMediaKeysQueue = [], this.mediaKeySessions = [], this.keyIdToKeySessionPromise = {}, O.clearKeyUriToKeyIdMap();
		let n = t.length;
		EMEController.CDMCleanupPromise = Promise.all(t.map((e) => this.removeSession(e)).concat(e?.setMediaKeys(null).catch((e) => {
			this.log(`Could not clear media keys: ${e}`);
		}))).then(() => {
			n && (this.log("finished closing key sessions and clearing media keys"), t.length = 0);
		}).catch((e) => {
			this.log(`Could not close sessions and clear media keys: ${e}`);
		});
	}
	onManifestLoading() {
		this.keyFormatPromise = null;
	}
	onManifestLoaded(e, { sessionKeys: t }) {
		if (t && this.config.emeEnabled && !this.keyFormatPromise) {
			let e = t.reduce((e, t) => (e.indexOf(t.keyFormat) === -1 && e.push(t.keyFormat), e), []);
			this.log(`Selecting key-system from session-keys ${e.join(", ")}`), this.keyFormatPromise = this.getKeyFormatPromise(e);
		}
	}
	removeSession(e) {
		let { mediaKeysSession: t, licenseXhr: n } = e;
		if (t) {
			this.log(`Remove licenses and keys and close session ${t.sessionId}`), e._onmessage &&= (t.removeEventListener("message", e._onmessage), void 0), e._onkeystatuseschange &&= (t.removeEventListener("keystatuseschange", e._onkeystatuseschange), void 0), n && n.readyState !== XMLHttpRequest.DONE && n.abort(), e.mediaKeysSession = e.decryptdata = e.licenseXhr = void 0;
			let r = this.mediaKeySessions.indexOf(e);
			return r > -1 && this.mediaKeySessions.splice(r, 1), t.remove().catch((e) => {
				this.log(`Could not remove session: ${e}`);
			}).then(() => t.close()).catch((e) => {
				this.log(`Could not close session: ${e}`);
			});
		}
	}
};
tt.CDMCleanupPromise = void 0;
var EMEKeyError = class extends Error {
	constructor(e, t) {
		super(t), this.data = void 0, e.error ||= Error(t), this.data = e, e.err = e.error;
	}
}, Q;
(function(e) {
	e.MANIFEST = "m", e.AUDIO = "a", e.VIDEO = "v", e.MUXED = "av", e.INIT = "i", e.CAPTION = "c", e.TIMED_TEXT = "tt", e.KEY = "k", e.OTHER = "o";
})(Q ||= {});
var nt;
(function(e) {
	e.DASH = "d", e.HLS = "h", e.SMOOTH = "s", e.OTHER = "o";
})(nt ||= {});
var $;
(function(e) {
	e.OBJECT = "CMCD-Object", e.REQUEST = "CMCD-Request", e.SESSION = "CMCD-Session", e.STATUS = "CMCD-Status";
})($ ||= {});
var rt = {
	[$.OBJECT]: [
		"br",
		"d",
		"ot",
		"tb"
	],
	[$.REQUEST]: [
		"bl",
		"dl",
		"mtp",
		"nor",
		"nrr",
		"su"
	],
	[$.SESSION]: [
		"cid",
		"pr",
		"sf",
		"sid",
		"st",
		"v"
	],
	[$.STATUS]: ["bs", "rtp"]
}, it = class SfItem {
	constructor(e, t) {
		this.value = void 0, this.params = void 0, Array.isArray(e) && (e = e.map((e) => e instanceof SfItem ? e : new SfItem(e))), this.value = e, this.params = t;
	}
}, SfToken = class {
	constructor(e) {
		this.description = void 0, this.description = e;
	}
}, at = "Dict";
function format(e) {
	return Array.isArray(e) ? JSON.stringify(e) : e instanceof Map ? "Map{}" : e instanceof Set ? "Set{}" : typeof e == "object" ? JSON.stringify(e) : String(e);
}
function throwError(e, t, n, r) {
	return Error(`failed to ${e} "${format(t)}" as ${n}`, { cause: r });
}
var ot = "Bare Item", st = "Boolean", ct = "Byte Sequence", lt = "Decimal", ut = "Integer";
function isInvalidInt(e) {
	return e < -999999999999999 || 999999999999999 < e;
}
var dt = /[\x00-\x1f\x7f]+/, ft = "Token", pt = "Key";
function serializeError(e, t, n) {
	return throwError("serialize", e, t, n);
}
function serializeBoolean(e) {
	if (typeof e != "boolean") throw serializeError(e, st);
	return e ? "?1" : "?0";
}
function base64encode(e) {
	return btoa(String.fromCharCode(...e));
}
function serializeByteSequence(e) {
	if (ArrayBuffer.isView(e) === !1) throw serializeError(e, ct);
	return `:${base64encode(e)}:`;
}
function serializeInteger(e) {
	if (isInvalidInt(e)) throw serializeError(e, ut);
	return e.toString();
}
function serializeDate(e) {
	return `@${serializeInteger(e.getTime() / 1e3)}`;
}
function roundToEven(e, t) {
	if (e < 0) return -roundToEven(-e, t);
	let n = 10 ** t;
	if (Math.abs(e * n % 1 - .5) < 2 ** -52) {
		let t = Math.floor(e * n);
		return (t % 2 == 0 ? t : t + 1) / n;
	}
	return Math.round(e * n) / n;
}
function serializeDecimal(e) {
	let t = roundToEven(e, 3);
	if (Math.floor(Math.abs(t)).toString().length > 12) throw serializeError(e, lt);
	let n = t.toString();
	return n.includes(".") ? n : `${n}.0`;
}
var mt = "String";
function serializeString(e) {
	if (dt.test(e)) throw serializeError(e, mt);
	return `"${e.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
function symbolToStr(e) {
	return e.description || e.toString().slice(7, -1);
}
function serializeToken(e) {
	let t = symbolToStr(e);
	if (/^([a-zA-Z*])([!#$%&'*+\-.^_`|~\w:/]*)$/.test(t) === !1) throw serializeError(t, ft);
	return t;
}
function serializeBareItem(e) {
	switch (typeof e) {
		case "number":
			if (!n(e)) throw serializeError(e, ot);
			return Number.isInteger(e) ? serializeInteger(e) : serializeDecimal(e);
		case "string": return serializeString(e);
		case "symbol": return serializeToken(e);
		case "boolean": return serializeBoolean(e);
		case "object":
			if (e instanceof Date) return serializeDate(e);
			if (e instanceof Uint8Array) return serializeByteSequence(e);
			if (e instanceof SfToken) return serializeToken(e);
		default: throw serializeError(e, ot);
	}
}
function serializeKey(e) {
	if (/^[a-z*][a-z0-9\-_.*]*$/.test(e) === !1) throw serializeError(e, pt);
	return e;
}
function serializeParams(e) {
	return e == null ? "" : Object.entries(e).map(([e, t]) => t === !0 ? `;${serializeKey(e)}` : `;${serializeKey(e)}=${serializeBareItem(t)}`).join("");
}
function serializeItem(e) {
	return e instanceof it ? `${serializeBareItem(e.value)}${serializeParams(e.params)}` : serializeBareItem(e);
}
function serializeInnerList(e) {
	return `(${e.value.map(serializeItem).join(" ")})${serializeParams(e.params)}`;
}
function serializeDict(e, t = { whitespace: !0 }) {
	if (typeof e != "object") throw serializeError(e, at);
	let n = e instanceof Map ? e.entries() : Object.entries(e), r = t != null && t.whitespace ? " " : "";
	return Array.from(n).map(([e, t]) => {
		t instanceof it || (t = new it(t));
		let n = serializeKey(e);
		return t.value === !0 ? n += serializeParams(t.params) : (n += "=", Array.isArray(t.value) ? n += serializeInnerList(t) : n += serializeItem(t)), n;
	}).join(`,${r}`);
}
function encodeSfDict(e, t) {
	return serializeDict(e, t);
}
var isTokenField = (e) => e === "ot" || e === "sf" || e === "st", isValid = (e) => typeof e == "number" ? n(e) : e != null && e !== "" && e !== !1;
function urlToRelativePath(e, t) {
	let n = new URL(e), r = new URL(t);
	if (n.origin !== r.origin) return e;
	let i = n.pathname.split("/").slice(1), a = r.pathname.split("/").slice(1, -1);
	for (; i[0] === a[0];) i.shift(), a.shift();
	for (; a.length;) a.shift(), i.unshift("..");
	return i.join("/");
}
function uuid() {
	try {
		return crypto.randomUUID();
	} catch {
		try {
			let e = URL.createObjectURL(new Blob()), t = e.toString();
			return URL.revokeObjectURL(e), t.slice(t.lastIndexOf("/") + 1);
		} catch {
			let e = (/* @__PURE__ */ new Date()).getTime();
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (t) => {
				let n = (e + Math.random() * 16) % 16 | 0;
				return e = Math.floor(e / 16), (t == "x" ? n : n & 3 | 8).toString(16);
			});
		}
	}
}
var toRounded = (e) => Math.round(e), toUrlSafe = (e, t) => (t != null && t.baseUrl && (e = urlToRelativePath(e, t.baseUrl)), encodeURIComponent(e)), toHundred = (e) => toRounded(e / 100) * 100, ht = {
	br: toRounded,
	d: toRounded,
	bl: toHundred,
	dl: toHundred,
	mtp: toHundred,
	nor: toUrlSafe,
	rtp: toHundred,
	tb: toRounded
};
function processCmcd(e, t) {
	let n = {};
	if (typeof e != "object" || !e) return n;
	let r = Object.keys(e).sort(), i = _extends({}, ht, t?.formatters), a = t?.filter;
	return r.forEach((r) => {
		if (a != null && a(r)) return;
		let o = e[r], s = i[r];
		s && (o = s(o, t)), (r !== "v" || o !== 1) && (r != "pr" || o !== 1) && isValid(o) && (isTokenField(r) && typeof o == "string" && (o = new SfToken(o)), n[r] = o);
	}), n;
}
function encodeCmcd(e, t = {}) {
	return e ? encodeSfDict(processCmcd(e, t), _extends({ whitespace: !1 }, t)) : "";
}
function toCmcdHeaders(e, t = {}) {
	if (!e) return {};
	let n = Object.entries(e), r = Object.entries(rt).concat(Object.entries(t?.customHeaderMap || {})), i = n.reduce((e, t) => {
		let [n, i] = t, a = r.find((e) => e[1].includes(n))?.[0] || $.REQUEST;
		return e[a] ?? (e[a] = {}), e[a][n] = i, e;
	}, {});
	return Object.entries(i).reduce((e, [n, r]) => (e[n] = encodeCmcd(r, t), e), {});
}
function appendCmcdHeaders(e, t, n) {
	return _extends(e, toCmcdHeaders(t, n));
}
var gt = "CMCD";
function toCmcdQuery(e, t = {}) {
	if (!e) return "";
	let n = encodeCmcd(e, t);
	return `${gt}=${encodeURIComponent(n)}`;
}
var _t = /CMCD=[^&#]+/;
function appendCmcdQuery(e, t, n) {
	let r = toCmcdQuery(t, n);
	return r ? _t.test(e) ? e.replace(_t, r) : `${e}${e.includes("?") ? "&" : "?"}${r}` : e;
}
var CMCDController = class {
	constructor(e) {
		this.hls = void 0, this.config = void 0, this.media = void 0, this.sid = void 0, this.cid = void 0, this.useHeaders = !1, this.includeKeys = void 0, this.initialized = !1, this.starved = !1, this.buffering = !0, this.audioBuffer = void 0, this.videoBuffer = void 0, this.onWaiting = () => {
			this.initialized && (this.starved = !0), this.buffering = !0;
		}, this.onPlaying = () => {
			this.initialized ||= !0, this.buffering = !1;
		}, this.applyPlaylistData = (e) => {
			try {
				this.apply(e, {
					ot: Q.MANIFEST,
					su: !this.initialized
				});
			} catch (e) {
				d.warn("Could not generate manifest CMCD data.", e);
			}
		}, this.applyFragmentData = (e) => {
			try {
				let t = e.frag, n = this.hls.levels[t.level], r = this.getObjectType(t), i = {
					d: t.duration * 1e3,
					ot: r
				};
				(r === Q.VIDEO || r === Q.AUDIO || r == Q.MUXED) && (i.br = n.bitrate / 1e3, i.tb = this.getTopBandwidth(r) / 1e3, i.bl = this.getBufferLength(r)), this.apply(e, i);
			} catch (e) {
				d.warn("Could not generate segment CMCD data.", e);
			}
		}, this.hls = e;
		let t = this.config = e.config, { cmcd: n } = t;
		n != null && (t.pLoader = this.createPlaylistLoader(), t.fLoader = this.createFragmentLoader(), this.sid = n.sessionId || uuid(), this.cid = n.contentId, this.useHeaders = n.useHeaders === !0, this.includeKeys = n.includeKeys, this.registerListeners());
	}
	registerListeners() {
		let e = this.hls;
		e.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.on(a.MEDIA_DETACHED, this.onMediaDetached, this), e.on(a.BUFFER_CREATED, this.onBufferCreated, this);
	}
	unregisterListeners() {
		let e = this.hls;
		e.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.off(a.MEDIA_DETACHED, this.onMediaDetached, this), e.off(a.BUFFER_CREATED, this.onBufferCreated, this);
	}
	destroy() {
		this.unregisterListeners(), this.onMediaDetached(), this.hls = this.config = this.audioBuffer = this.videoBuffer = null, this.onWaiting = this.onPlaying = null;
	}
	onMediaAttached(e, t) {
		this.media = t.media, this.media.addEventListener("waiting", this.onWaiting), this.media.addEventListener("playing", this.onPlaying);
	}
	onMediaDetached() {
		this.media &&= (this.media.removeEventListener("waiting", this.onWaiting), this.media.removeEventListener("playing", this.onPlaying), null);
	}
	onBufferCreated(e, t) {
		this.audioBuffer = t.tracks.audio?.buffer, this.videoBuffer = t.tracks.video?.buffer;
	}
	createData() {
		return {
			v: 1,
			sf: nt.HLS,
			sid: this.sid,
			cid: this.cid,
			pr: this.media?.playbackRate,
			mtp: this.hls.bandwidthEstimate / 1e3
		};
	}
	apply(e, t = {}) {
		_extends(t, this.createData());
		let n = t.ot === Q.INIT || t.ot === Q.VIDEO || t.ot === Q.MUXED;
		this.starved && n && (t.bs = !0, t.su = !0, this.starved = !1), t.su ?? (t.su = this.buffering);
		let { includeKeys: r } = this;
		r && (t = Object.keys(t).reduce((e, n) => (r.includes(n) && (e[n] = t[n]), e), {})), this.useHeaders ? (e.headers ||= {}, appendCmcdHeaders(e.headers, t)) : e.url = appendCmcdQuery(e.url, t);
	}
	getObjectType(e) {
		let { type: t } = e;
		if (t === "subtitle") return Q.TIMED_TEXT;
		if (e.sn === "initSegment") return Q.INIT;
		if (t === "audio") return Q.AUDIO;
		if (t === "main") return this.hls.audioTracks.length ? Q.VIDEO : Q.MUXED;
	}
	getTopBandwidth(e) {
		let t = 0, n, r = this.hls;
		if (e === Q.AUDIO) n = r.audioTracks;
		else {
			let e = r.maxAutoLevel, t = e > -1 ? e + 1 : r.levels.length;
			n = r.levels.slice(0, t);
		}
		for (let e of n) e.bitrate > t && (t = e.bitrate);
		return t > 0 ? t : NaN;
	}
	getBufferLength(e) {
		let t = this.hls.media, n = e === Q.AUDIO ? this.audioBuffer : this.videoBuffer;
		return !n || !t ? NaN : H.bufferInfo(n, t.currentTime, this.config.maxBufferHole).len * 1e3;
	}
	createPlaylistLoader() {
		let { pLoader: e } = this.config, t = this.applyPlaylistData, n = e || this.config.loader;
		return class CmcdPlaylistLoader {
			constructor(e) {
				this.loader = void 0, this.loader = new n(e);
			}
			get stats() {
				return this.loader.stats;
			}
			get context() {
				return this.loader.context;
			}
			destroy() {
				this.loader.destroy();
			}
			abort() {
				this.loader.abort();
			}
			load(e, n, r) {
				t(e), this.loader.load(e, n, r);
			}
		};
	}
	createFragmentLoader() {
		let { fLoader: e } = this.config, t = this.applyFragmentData, n = e || this.config.loader;
		return class CmcdFragmentLoader {
			constructor(e) {
				this.loader = void 0, this.loader = new n(e);
			}
			get stats() {
				return this.loader.stats;
			}
			get context() {
				return this.loader.context;
			}
			destroy() {
				this.loader.destroy();
			}
			abort() {
				this.loader.abort();
			}
			load(e, n, r) {
				t(e), this.loader.load(e, n, r);
			}
		};
	}
}, vt = 3e5, ContentSteeringController = class {
	constructor(e) {
		this.hls = void 0, this.log = void 0, this.loader = null, this.uri = null, this.pathwayId = ".", this.pathwayPriority = null, this.timeToLoad = 300, this.reloadTimer = -1, this.updated = 0, this.started = !1, this.enabled = !0, this.levels = null, this.audioTracks = null, this.subtitleTracks = null, this.penalizedPathways = {}, this.hls = e, this.log = d.log.bind(d, "[content-steering]:"), this.registerListeners();
	}
	registerListeners() {
		let e = this.hls;
		e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_LOADED, this.onManifestLoaded, this), e.on(a.MANIFEST_PARSED, this.onManifestParsed, this), e.on(a.ERROR, this.onError, this);
	}
	unregisterListeners() {
		let e = this.hls;
		e && (e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_LOADED, this.onManifestLoaded, this), e.off(a.MANIFEST_PARSED, this.onManifestParsed, this), e.off(a.ERROR, this.onError, this));
	}
	startLoad() {
		if (this.started = !0, this.clearTimeout(), this.enabled && this.uri) {
			if (this.updated) {
				let e = this.timeToLoad * 1e3 - (performance.now() - this.updated);
				if (e > 0) {
					this.scheduleRefresh(this.uri, e);
					return;
				}
			}
			this.loadSteeringManifest(this.uri);
		}
	}
	stopLoad() {
		this.started = !1, this.loader &&= (this.loader.destroy(), null), this.clearTimeout();
	}
	clearTimeout() {
		this.reloadTimer !== -1 && (self.clearTimeout(this.reloadTimer), this.reloadTimer = -1);
	}
	destroy() {
		this.unregisterListeners(), this.stopLoad(), this.hls = null, this.levels = this.audioTracks = this.subtitleTracks = null;
	}
	removeLevel(e) {
		let t = this.levels;
		t && (this.levels = t.filter((t) => t !== e));
	}
	onManifestLoading() {
		this.stopLoad(), this.enabled = !0, this.timeToLoad = 300, this.updated = 0, this.uri = null, this.pathwayId = ".", this.levels = this.audioTracks = this.subtitleTracks = null;
	}
	onManifestLoaded(e, t) {
		let { contentSteering: n } = t;
		n !== null && (this.pathwayId = n.pathwayId, this.uri = n.uri, this.started && this.startLoad());
	}
	onManifestParsed(e, t) {
		this.audioTracks = t.audioTracks, this.subtitleTracks = t.subtitleTracks;
	}
	onError(e, t) {
		let { errorAction: n } = t;
		if (n?.action === z.SendAlternateToPenaltyBox && n.flags === B.MoveAllAlternatesMatchingHost) {
			let e = this.levels, r = this.pathwayPriority, i = this.pathwayId;
			if (t.context) {
				let { groupId: n, pathwayId: r, type: a } = t.context;
				n && e ? i = this.getPathwayForGroupId(n, a, i) : r && (i = r);
			}
			i in this.penalizedPathways || (this.penalizedPathways[i] = performance.now()), !r && e && (r = e.reduce((e, t) => (e.indexOf(t.pathwayId) === -1 && e.push(t.pathwayId), e), [])), r && r.length > 1 && (this.updatePathwayPriority(r), n.resolved = this.pathwayId !== i), n.resolved || d.warn(`Could not resolve ${t.details} ("${t.error.message}") with content-steering for Pathway: ${i} levels: ${e && e.length} priorities: ${JSON.stringify(r)} penalized: ${JSON.stringify(this.penalizedPathways)}`);
		}
	}
	filterParsedLevels(e) {
		this.levels = e;
		let t = this.getLevelsForPathway(this.pathwayId);
		if (t.length === 0) {
			let n = e[0].pathwayId;
			this.log(`No levels found in Pathway ${this.pathwayId}. Setting initial Pathway to "${n}"`), t = this.getLevelsForPathway(n), this.pathwayId = n;
		}
		return t.length === e.length ? e : (this.log(`Found ${t.length}/${e.length} levels in Pathway "${this.pathwayId}"`), t);
	}
	getLevelsForPathway(e) {
		return this.levels === null ? [] : this.levels.filter((t) => e === t.pathwayId);
	}
	updatePathwayPriority(e) {
		this.pathwayPriority = e;
		let t, n = this.penalizedPathways, r = performance.now();
		Object.keys(n).forEach((e) => {
			r - n[e] > vt && delete n[e];
		});
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (i in n) continue;
			if (i === this.pathwayId) return;
			let o = this.hls.nextLoadLevel, s = this.hls.levels[o];
			if (t = this.getLevelsForPathway(i), t.length > 0) {
				this.log(`Setting Pathway to "${i}"`), this.pathwayId = i, reassignFragmentLevelIndexes(t), this.hls.trigger(a.LEVELS_UPDATED, { levels: t });
				let e = this.hls.levels[o];
				s && e && this.levels && (e.attrs["STABLE-VARIANT-ID"] !== s.attrs["STABLE-VARIANT-ID"] && e.bitrate !== s.bitrate && this.log(`Unstable Pathways change from bitrate ${s.bitrate} to ${e.bitrate}`), this.hls.nextLoadLevel = o);
				break;
			}
		}
	}
	getPathwayForGroupId(e, t, n) {
		let r = this.getLevelsForPathway(n).concat(this.levels || []);
		for (let n = 0; n < r.length; n++) if (t === F.AUDIO_TRACK && r[n].hasAudioGroup(e) || t === F.SUBTITLE_TRACK && r[n].hasSubtitleGroup(e)) return r[n].pathwayId;
		return n;
	}
	clonePathways(e) {
		let t = this.levels;
		if (!t) return;
		let n = {}, r = {};
		e.forEach((e) => {
			let { ID: i, "BASE-ID": a, "URI-REPLACEMENT": o } = e;
			if (t.some((e) => e.pathwayId === i)) return;
			let s = this.getLevelsForPathway(a).map((e) => {
				let t = new m(e.attrs);
				t["PATHWAY-ID"] = i;
				let a = t.AUDIO && `${t.AUDIO}_clone_${i}`, s = t.SUBTITLES && `${t.SUBTITLES}_clone_${i}`;
				a && (n[t.AUDIO] = a, t.AUDIO = a), s && (r[t.SUBTITLES] = s, t.SUBTITLES = s);
				let c = performUriReplacement(e.uri, t["STABLE-VARIANT-ID"], "PER-VARIANT-URIS", o), l = new Level({
					attrs: t,
					audioCodec: e.audioCodec,
					bitrate: e.bitrate,
					height: e.height,
					name: e.name,
					url: c,
					videoCodec: e.videoCodec,
					width: e.width
				});
				if (e.audioGroups) for (let t = 1; t < e.audioGroups.length; t++) l.addGroupId("audio", `${e.audioGroups[t]}_clone_${i}`);
				if (e.subtitleGroups) for (let t = 1; t < e.subtitleGroups.length; t++) l.addGroupId("text", `${e.subtitleGroups[t]}_clone_${i}`);
				return l;
			});
			t.push(...s), cloneRenditionGroups(this.audioTracks, n, o, i), cloneRenditionGroups(this.subtitleTracks, r, o, i);
		});
	}
	loadSteeringManifest(e) {
		let t = this.hls.config, n = t.loader;
		this.loader && this.loader.destroy(), this.loader = new n(t);
		let r;
		try {
			r = new self.URL(e);
		} catch {
			this.enabled = !1, this.log(`Failed to parse Steering Manifest URI: ${e}`);
			return;
		}
		if (r.protocol !== "data:") {
			let e = (this.hls.bandwidthEstimate || t.abrEwmaDefaultEstimate) | 0;
			r.searchParams.set("_HLS_pathway", this.pathwayId), r.searchParams.set("_HLS_throughput", "" + e);
		}
		let i = {
			responseType: "json",
			url: r.href
		}, o = t.steeringManifestLoadPolicy.default, s = o.errorRetry || o.timeoutRetry || {}, c = {
			loadPolicy: o,
			timeout: o.maxLoadTimeMs,
			maxRetry: s.maxNumRetry || 0,
			retryDelay: s.retryDelayMs || 0,
			maxRetryDelay: s.maxRetryDelayMs || 0
		};
		this.log(`Requesting steering manifest: ${r}`), this.loader.load(i, c, {
			onSuccess: (e, t, n, i) => {
				this.log(`Loaded steering manifest: "${r}"`);
				let o = e.data;
				if (o.VERSION !== 1) {
					this.log(`Steering VERSION ${o.VERSION} not supported!`);
					return;
				}
				this.updated = performance.now(), this.timeToLoad = o.TTL;
				let { "RELOAD-URI": s, "PATHWAY-CLONES": c, "PATHWAY-PRIORITY": l } = o;
				if (s) try {
					this.uri = new self.URL(s, r).href;
				} catch {
					this.enabled = !1, this.log(`Failed to parse Steering Manifest RELOAD-URI: ${s}`);
					return;
				}
				this.scheduleRefresh(this.uri || n.url), c && this.clonePathways(c);
				let u = {
					steeringManifest: o,
					url: r.toString()
				};
				this.hls.trigger(a.STEERING_MANIFEST_LOADED, u), l && this.updatePathwayPriority(l);
			},
			onError: (e, t, n, r) => {
				if (this.log(`Error loading steering manifest: ${e.code} ${e.text} (${t.url})`), this.stopLoad(), e.code === 410) {
					this.enabled = !1, this.log(`Steering manifest ${t.url} no longer available`);
					return;
				}
				let i = this.timeToLoad * 1e3;
				if (e.code === 429) {
					let e = this.loader;
					if (typeof e?.getResponseHeader == "function") {
						let t = e.getResponseHeader("Retry-After");
						t && (i = parseFloat(t) * 1e3);
					}
					this.log(`Steering manifest ${t.url} rate limited`);
					return;
				}
				this.scheduleRefresh(this.uri || t.url, i);
			},
			onTimeout: (e, t, n) => {
				this.log(`Timeout loading steering manifest (${t.url})`), this.scheduleRefresh(this.uri || t.url);
			}
		});
	}
	scheduleRefresh(e, t = this.timeToLoad * 1e3) {
		this.clearTimeout(), this.reloadTimer = self.setTimeout(() => {
			let t = this.hls?.media;
			if (t && !t.ended) {
				this.loadSteeringManifest(e);
				return;
			}
			this.scheduleRefresh(e, this.timeToLoad * 1e3);
		}, t);
	}
};
function cloneRenditionGroups(e, t, n, r) {
	e && Object.keys(t).forEach((i) => {
		let a = e.filter((e) => e.groupId === i).map((e) => {
			let a = _extends({}, e);
			return a.details = void 0, a.attrs = new m(a.attrs), a.url = a.attrs.URI = performUriReplacement(e.url, e.attrs["STABLE-RENDITION-ID"], "PER-RENDITION-URIS", n), a.groupId = a.attrs["GROUP-ID"] = t[i], a.attrs["PATHWAY-ID"] = r, a;
		});
		e.push(...a);
	});
}
function performUriReplacement(e, t, n, r) {
	let { HOST: i, PARAMS: a, [n]: o } = r, s;
	t && (s = o?.[t], s && (e = s));
	let c = new self.URL(e);
	return i && !s && (c.host = i), a && Object.keys(a).sort().forEach((e) => {
		e && c.searchParams.set(e, a[e]);
	}), c.href;
}
var yt = /^age:\s*[\d.]+\s*$/im, XhrLoader = class {
	constructor(e) {
		this.xhrSetup = void 0, this.requestTimeout = void 0, this.retryTimeout = void 0, this.retryDelay = void 0, this.config = null, this.callbacks = null, this.context = null, this.loader = null, this.stats = void 0, this.xhrSetup = e && e.xhrSetup || null, this.stats = new LoadStats(), this.retryDelay = 0;
	}
	destroy() {
		this.callbacks = null, this.abortInternal(), this.loader = null, this.config = null, this.context = null, this.xhrSetup = null;
	}
	abortInternal() {
		let e = this.loader;
		self.clearTimeout(this.requestTimeout), self.clearTimeout(this.retryTimeout), e && (e.onreadystatechange = null, e.onprogress = null, e.readyState !== 4 && (this.stats.aborted = !0, e.abort()));
	}
	abort() {
		var e;
		this.abortInternal(), (e = this.callbacks) != null && e.onAbort && this.callbacks.onAbort(this.stats, this.context, this.loader);
	}
	load(e, t, n) {
		if (this.stats.loading.start) throw Error("Loader can only be used once.");
		this.stats.loading.start = self.performance.now(), this.context = e, this.config = t, this.callbacks = n, this.loadInternal();
	}
	loadInternal() {
		let { config: e, context: t } = this;
		if (!e || !t) return;
		let n = this.loader = new self.XMLHttpRequest(), r = this.stats;
		r.loading.first = 0, r.loaded = 0, r.aborted = !1;
		let i = this.xhrSetup;
		i ? Promise.resolve().then(() => {
			if (!(this.loader !== n || this.stats.aborted)) return i(n, t.url);
		}).catch((e) => {
			if (!(this.loader !== n || this.stats.aborted)) return n.open("GET", t.url, !0), i(n, t.url);
		}).then(() => {
			this.loader !== n || this.stats.aborted || this.openAndSendXhr(n, t, e);
		}).catch((e) => {
			this.callbacks.onError({
				code: n.status,
				text: e.message
			}, t, n, r);
		}) : this.openAndSendXhr(n, t, e);
	}
	openAndSendXhr(e, t, r) {
		e.readyState || e.open("GET", t.url, !0);
		let i = t.headers, { maxTimeToFirstByteMs: a, maxLoadTimeMs: o } = r.loadPolicy;
		if (i) for (let t in i) e.setRequestHeader(t, i[t]);
		t.rangeEnd && e.setRequestHeader("Range", "bytes=" + t.rangeStart + "-" + (t.rangeEnd - 1)), e.onreadystatechange = this.readystatechange.bind(this), e.onprogress = this.loadprogress.bind(this), e.responseType = t.responseType, self.clearTimeout(this.requestTimeout), r.timeout = a && n(a) ? a : o, this.requestTimeout = self.setTimeout(this.loadtimeout.bind(this), r.timeout), e.send();
	}
	readystatechange() {
		let { context: e, loader: t, stats: n } = this;
		if (!e || !t) return;
		let r = t.readyState, i = this.config;
		if (!n.aborted && r >= 2 && (n.loading.first === 0 && (n.loading.first = Math.max(self.performance.now(), n.loading.start), i.timeout !== i.loadPolicy.maxLoadTimeMs && (self.clearTimeout(this.requestTimeout), i.timeout = i.loadPolicy.maxLoadTimeMs, this.requestTimeout = self.setTimeout(this.loadtimeout.bind(this), i.loadPolicy.maxLoadTimeMs - (n.loading.first - n.loading.start)))), r === 4)) {
			self.clearTimeout(this.requestTimeout), t.onreadystatechange = null, t.onprogress = null;
			let r = t.status, a = t.responseType !== "text";
			if (r >= 200 && r < 300 && (a && t.response || t.responseText !== null)) {
				n.loading.end = Math.max(self.performance.now(), n.loading.first);
				let i = a ? t.response : t.responseText;
				if (n.loaded = n.total = t.responseType === "arraybuffer" ? i.byteLength : i.length, n.bwEstimate = n.total * 8e3 / (n.loading.end - n.loading.first), !this.callbacks) return;
				let o = this.callbacks.onProgress;
				if (o && o(n, e, i, t), !this.callbacks) return;
				let s = {
					url: t.responseURL,
					data: i,
					code: r
				};
				this.callbacks.onSuccess(s, n, e, t);
			} else {
				let a = i.loadPolicy.errorRetry, o = n.retry;
				shouldRetry(a, o, !1, {
					url: e.url,
					data: void 0,
					code: r
				}) ? this.retry(a) : (d.error(`${r} while loading ${e.url}`), this.callbacks.onError({
					code: r,
					text: t.statusText
				}, e, t, n));
			}
		}
	}
	loadtimeout() {
		if (!this.config) return;
		let e = this.config.loadPolicy.timeoutRetry, t = this.stats.retry;
		if (shouldRetry(e, t, !0)) this.retry(e);
		else {
			d.warn(`timeout while loading ${this.context?.url}`);
			let e = this.callbacks;
			e && (this.abortInternal(), e.onTimeout(this.stats, this.context, this.loader));
		}
	}
	retry(e) {
		let { context: t, stats: n } = this;
		this.retryDelay = getRetryDelay(e, n.retry), n.retry++, d.warn(`${status ? "HTTP Status " + status : "Timeout"} while loading ${t?.url}, retrying ${n.retry}/${e.maxNumRetry} in ${this.retryDelay}ms`), this.abortInternal(), this.loader = null, self.clearTimeout(this.retryTimeout), this.retryTimeout = self.setTimeout(this.loadInternal.bind(this), this.retryDelay);
	}
	loadprogress(e) {
		let t = this.stats;
		t.loaded = e.loaded, e.lengthComputable && (t.total = e.total);
	}
	getCacheAge() {
		let e = null;
		if (this.loader && yt.test(this.loader.getAllResponseHeaders())) {
			let t = this.loader.getResponseHeader("age");
			e = t ? parseFloat(t) : null;
		}
		return e;
	}
	getResponseHeader(e) {
		return this.loader && RegExp(`^${e}:\\s*[\\d.]+\\s*$`, "im").test(this.loader.getAllResponseHeaders()) ? this.loader.getResponseHeader(e) : null;
	}
};
function fetchSupported() {
	if (self.fetch && self.AbortController && self.ReadableStream && self.Request) try {
		return new self.ReadableStream({}), !0;
	} catch {}
	return !1;
}
var bt = /(\d+)-(\d+)\/(\d+)/, FetchLoader = class {
	constructor(e) {
		this.fetchSetup = void 0, this.requestTimeout = void 0, this.request = null, this.response = null, this.controller = void 0, this.context = null, this.config = null, this.callbacks = null, this.stats = void 0, this.loader = null, this.fetchSetup = e.fetchSetup || getRequest, this.controller = new self.AbortController(), this.stats = new LoadStats();
	}
	destroy() {
		this.loader = this.callbacks = this.context = this.config = this.request = null, this.abortInternal(), this.response = null, this.fetchSetup = this.controller = this.stats = null;
	}
	abortInternal() {
		this.controller && !this.stats.loading.end && (this.stats.aborted = !0, this.controller.abort());
	}
	abort() {
		var e;
		this.abortInternal(), (e = this.callbacks) != null && e.onAbort && this.callbacks.onAbort(this.stats, this.context, this.response);
	}
	load(e, t, r) {
		let i = this.stats;
		if (i.loading.start) throw Error("Loader can only be used once.");
		i.loading.start = self.performance.now();
		let a = getRequestParameters(e, this.controller.signal), o = r.onProgress, s = e.responseType === "arraybuffer", c = s ? "byteLength" : "length", { maxTimeToFirstByteMs: l, maxLoadTimeMs: u } = t.loadPolicy;
		this.context = e, this.config = t, this.callbacks = r, this.request = this.fetchSetup(e, a), self.clearTimeout(this.requestTimeout), t.timeout = l && n(l) ? l : u, this.requestTimeout = self.setTimeout(() => {
			this.abortInternal(), r.onTimeout(i, e, this.response);
		}, t.timeout), self.fetch(this.request).then((a) => {
			this.response = this.loader = a;
			let c = Math.max(self.performance.now(), i.loading.start);
			if (self.clearTimeout(this.requestTimeout), t.timeout = u, this.requestTimeout = self.setTimeout(() => {
				this.abortInternal(), r.onTimeout(i, e, this.response);
			}, u - (c - i.loading.start)), !a.ok) {
				let { status: e, statusText: t } = a;
				throw new FetchError(t || "fetch, bad network response", e, a);
			}
			return i.loading.first = c, i.total = getContentLength(a.headers) || i.total, o && n(t.highWaterMark) ? this.loadProgressively(a, i, e, t.highWaterMark, o) : s ? a.arrayBuffer() : e.responseType === "json" ? a.json() : a.text();
		}).then((a) => {
			let s = this.response;
			if (!s) throw Error("loader destroyed");
			self.clearTimeout(this.requestTimeout), i.loading.end = Math.max(self.performance.now(), i.loading.first);
			let l = a[c];
			l && (i.loaded = i.total = l);
			let u = {
				url: s.url,
				data: a,
				code: s.status
			};
			o && !n(t.highWaterMark) && o(i, e, a, s), r.onSuccess(u, i, e, s);
		}).catch((t) => {
			if (self.clearTimeout(this.requestTimeout), i.aborted) return;
			let n = t && t.code || 0, a = t ? t.message : null;
			r.onError({
				code: n,
				text: a
			}, e, t ? t.details : null, i);
		});
	}
	getCacheAge() {
		let e = null;
		if (this.response) {
			let t = this.response.headers.get("age");
			e = t ? parseFloat(t) : null;
		}
		return e;
	}
	getResponseHeader(e) {
		return this.response ? this.response.headers.get(e) : null;
	}
	loadProgressively(e, t, n, r = 0, i) {
		let a = new ChunkCache(), o = e.body.getReader(), pump = () => o.read().then((o) => {
			if (o.done) return a.dataLength && i(t, n, a.flush(), e), Promise.resolve(/* @__PURE__ */ new ArrayBuffer(0));
			let s = o.value, c = s.length;
			return t.loaded += c, c < r || a.dataLength ? (a.push(s), a.dataLength >= r && i(t, n, a.flush(), e)) : i(t, n, s, e), pump();
		}).catch(() => Promise.reject());
		return pump();
	}
};
function getRequestParameters(e, t) {
	let n = {
		method: "GET",
		mode: "cors",
		credentials: "same-origin",
		signal: t,
		headers: new self.Headers(_extends({}, e.headers))
	};
	return e.rangeEnd && n.headers.set("Range", "bytes=" + e.rangeStart + "-" + String(e.rangeEnd - 1)), n;
}
function getByteRangeLength(e) {
	let t = bt.exec(e);
	if (t) return parseInt(t[2]) - parseInt(t[1]) + 1;
}
function getContentLength(e) {
	let t = e.get("Content-Range");
	if (t) {
		let e = getByteRangeLength(t);
		if (n(e)) return e;
	}
	let r = e.get("Content-Length");
	if (r) return parseInt(r);
}
function getRequest(e, t) {
	return new self.Request(e.url, t);
}
var FetchError = class extends Error {
	constructor(e, t, n) {
		super(e), this.code = void 0, this.details = void 0, this.code = t, this.details = n;
	}
}, xt = /\s/, St = { newCue(e, t, n, r) {
	let i = [], a, o, s, c, l, u = self.VTTCue || self.TextTrackCue;
	for (let f = 0; f < r.rows.length; f++) if (a = r.rows[f], s = !0, c = 0, l = "", !a.isEmpty()) {
		var d;
		for (let e = 0; e < a.chars.length; e++) xt.test(a.chars[e].uchar) && s ? c++ : (l += a.chars[e].uchar, s = !1);
		a.cueStartTime = t, t === n && (n += 1e-4), c >= 16 ? c-- : c++;
		let r = fixLineBreaks(l.trim()), p = generateCueId(t, n, r);
		e != null && (d = e.cues) != null && d.getCueById(p) || (o = new u(t, n, r), o.id = p, o.line = f + 1, o.align = "left", o.position = 10 + Math.min(80, Math.floor(c * 8 / 32) * 10), i.push(o));
	}
	return e && i.length && (i.sort((e, t) => e.line === "auto" || t.line === "auto" ? 0 : e.line > 8 && t.line > 8 ? t.line - e.line : e.line - t.line), i.forEach((t) => addCueToTrack(e, t))), i;
} }, Ct = _objectSpread2(_objectSpread2({
	autoStartLoad: !0,
	startPosition: -1,
	defaultAudioCodec: void 0,
	debug: !1,
	capLevelOnFPSDrop: !1,
	capLevelToPlayerSize: !1,
	ignoreDevicePixelRatio: !1,
	preferManagedMediaSource: !0,
	initialLiveManifestSize: 1,
	maxBufferLength: 30,
	backBufferLength: Infinity,
	frontBufferFlushThreshold: Infinity,
	maxBufferSize: 6e7,
	maxBufferHole: .1,
	highBufferWatchdogPeriod: 2,
	nudgeOffset: .1,
	nudgeMaxRetry: 3,
	maxFragLookUpTolerance: .25,
	liveSyncDurationCount: 3,
	liveMaxLatencyDurationCount: Infinity,
	liveSyncDuration: void 0,
	liveMaxLatencyDuration: void 0,
	maxLiveSyncPlaybackRate: 1,
	liveDurationInfinity: !1,
	liveBackBufferLength: null,
	maxMaxBufferLength: 600,
	enableWorker: !0,
	workerPath: null,
	enableSoftwareAES: !0,
	startLevel: void 0,
	startFragPrefetch: !1,
	fpsDroppedMonitoringPeriod: 5e3,
	fpsDroppedMonitoringThreshold: .2,
	appendErrorMaxRetry: 3,
	loader: XhrLoader,
	fLoader: void 0,
	pLoader: void 0,
	xhrSetup: void 0,
	licenseXhrSetup: void 0,
	licenseResponseCallback: void 0,
	abrController: AbrController,
	bufferController: BufferController,
	capLevelController: $e,
	errorController: ErrorController,
	fpsController: FPSController,
	stretchShortVideoTrack: !1,
	maxAudioFramesDrift: 1,
	forceKeyFrameOnDiscontinuity: !0,
	abrEwmaFastLive: 3,
	abrEwmaSlowLive: 9,
	abrEwmaFastVoD: 3,
	abrEwmaSlowVoD: 9,
	abrEwmaDefaultEstimate: 5e5,
	abrEwmaDefaultEstimateMax: 5e6,
	abrBandWidthFactor: .95,
	abrBandWidthUpFactor: .7,
	abrMaxWithRealBitrate: !1,
	maxStarvationDelay: 4,
	maxLoadingDelay: 4,
	minAutoBitrate: 0,
	emeEnabled: !1,
	widevineLicenseUrl: void 0,
	drmSystems: {},
	drmSystemOptions: {},
	requestMediaKeySystemAccessFunc: x,
	testBandwidth: !0,
	progressive: !1,
	lowLatencyMode: !0,
	cmcd: void 0,
	enableDateRangeMetadataCues: !0,
	enableEmsgMetadataCues: !0,
	enableID3MetadataCues: !0,
	useMediaCapabilities: !0,
	certLoadPolicy: { default: {
		maxTimeToFirstByteMs: 8e3,
		maxLoadTimeMs: 2e4,
		timeoutRetry: null,
		errorRetry: null
	} },
	keyLoadPolicy: { default: {
		maxTimeToFirstByteMs: 8e3,
		maxLoadTimeMs: 2e4,
		timeoutRetry: {
			maxNumRetry: 1,
			retryDelayMs: 1e3,
			maxRetryDelayMs: 2e4,
			backoff: "linear"
		},
		errorRetry: {
			maxNumRetry: 8,
			retryDelayMs: 1e3,
			maxRetryDelayMs: 2e4,
			backoff: "linear"
		}
	} },
	manifestLoadPolicy: { default: {
		maxTimeToFirstByteMs: Infinity,
		maxLoadTimeMs: 2e4,
		timeoutRetry: {
			maxNumRetry: 2,
			retryDelayMs: 0,
			maxRetryDelayMs: 0
		},
		errorRetry: {
			maxNumRetry: 1,
			retryDelayMs: 1e3,
			maxRetryDelayMs: 8e3
		}
	} },
	playlistLoadPolicy: { default: {
		maxTimeToFirstByteMs: 1e4,
		maxLoadTimeMs: 2e4,
		timeoutRetry: {
			maxNumRetry: 2,
			retryDelayMs: 0,
			maxRetryDelayMs: 0
		},
		errorRetry: {
			maxNumRetry: 2,
			retryDelayMs: 1e3,
			maxRetryDelayMs: 8e3
		}
	} },
	fragLoadPolicy: { default: {
		maxTimeToFirstByteMs: 1e4,
		maxLoadTimeMs: 12e4,
		timeoutRetry: {
			maxNumRetry: 4,
			retryDelayMs: 0,
			maxRetryDelayMs: 0
		},
		errorRetry: {
			maxNumRetry: 6,
			retryDelayMs: 1e3,
			maxRetryDelayMs: 8e3
		}
	} },
	steeringManifestLoadPolicy: { default: {
		maxTimeToFirstByteMs: 1e4,
		maxLoadTimeMs: 2e4,
		timeoutRetry: {
			maxNumRetry: 2,
			retryDelayMs: 0,
			maxRetryDelayMs: 0
		},
		errorRetry: {
			maxNumRetry: 1,
			retryDelayMs: 1e3,
			maxRetryDelayMs: 8e3
		}
	} },
	manifestLoadingTimeOut: 1e4,
	manifestLoadingMaxRetry: 1,
	manifestLoadingRetryDelay: 1e3,
	manifestLoadingMaxRetryTimeout: 64e3,
	levelLoadingTimeOut: 1e4,
	levelLoadingMaxRetry: 4,
	levelLoadingRetryDelay: 1e3,
	levelLoadingMaxRetryTimeout: 64e3,
	fragLoadingTimeOut: 2e4,
	fragLoadingMaxRetry: 6,
	fragLoadingRetryDelay: 1e3,
	fragLoadingMaxRetryTimeout: 64e3
}, timelineConfig()), {}, {
	subtitleStreamController: SubtitleStreamController,
	subtitleTrackController: SubtitleTrackController,
	timelineController: TimelineController,
	audioStreamController: AudioStreamController,
	audioTrackController: AudioTrackController,
	emeController: tt,
	cmcdController: CMCDController,
	contentSteeringController: ContentSteeringController
});
function timelineConfig() {
	return {
		cueHandler: St,
		enableWebVTT: !0,
		enableIMSC1: !0,
		enableCEA708Captions: !0,
		captionsTextTrack1Label: "English",
		captionsTextTrack1LanguageCode: "en",
		captionsTextTrack2Label: "Spanish",
		captionsTextTrack2LanguageCode: "es",
		captionsTextTrack3Label: "Unknown CC",
		captionsTextTrack3LanguageCode: "",
		captionsTextTrack4Label: "Unknown CC",
		captionsTextTrack4LanguageCode: "",
		renderTextTracksNatively: !0
	};
}
function mergeConfig(e, t) {
	if ((t.liveSyncDurationCount || t.liveMaxLatencyDurationCount) && (t.liveSyncDuration || t.liveMaxLatencyDuration)) throw Error("Illegal hls.js config: don't mix up liveSyncDurationCount/liveMaxLatencyDurationCount and liveSyncDuration/liveMaxLatencyDuration");
	if (t.liveMaxLatencyDurationCount !== void 0 && (t.liveSyncDurationCount === void 0 || t.liveMaxLatencyDurationCount <= t.liveSyncDurationCount)) throw Error("Illegal hls.js config: \"liveMaxLatencyDurationCount\" must be greater than \"liveSyncDurationCount\"");
	if (t.liveMaxLatencyDuration !== void 0 && (t.liveSyncDuration === void 0 || t.liveMaxLatencyDuration <= t.liveSyncDuration)) throw Error("Illegal hls.js config: \"liveMaxLatencyDuration\" must be greater than \"liveSyncDuration\"");
	let n = deepCpy(e), r = [
		"manifest",
		"level",
		"frag"
	], i = [
		"TimeOut",
		"MaxRetry",
		"RetryDelay",
		"MaxRetryTimeout"
	];
	return r.forEach((e) => {
		let r = `${e === "level" ? "playlist" : e}LoadPolicy`, a = t[r] === void 0, o = [];
		i.forEach((i) => {
			let s = `${e}Loading${i}`, c = t[s];
			if (c !== void 0 && a) {
				o.push(s);
				let e = n[r].default;
				switch (t[r] = { default: e }, i) {
					case "TimeOut":
						e.maxLoadTimeMs = c, e.maxTimeToFirstByteMs = c;
						break;
					case "MaxRetry":
						e.errorRetry.maxNumRetry = c, e.timeoutRetry.maxNumRetry = c;
						break;
					case "RetryDelay":
						e.errorRetry.retryDelayMs = c, e.timeoutRetry.retryDelayMs = c;
						break;
					case "MaxRetryTimeout": e.errorRetry.maxRetryDelayMs = c, e.timeoutRetry.maxRetryDelayMs = c;
				}
			}
		}), o.length && d.warn(`hls.js config: "${o.join("\", \"")}" setting(s) are deprecated, use "${r}": ${JSON.stringify(t[r])}`);
	}), _objectSpread2(_objectSpread2({}, n), t);
}
function deepCpy(e) {
	return e && typeof e == "object" ? Array.isArray(e) ? e.map(deepCpy) : Object.keys(e).reduce((t, n) => (t[n] = deepCpy(e[n]), t), {}) : e;
}
function enableStreamingMode(e) {
	let t = e.loader;
	t !== FetchLoader && t !== XhrLoader ? (d.log("[config]: Custom loader detected, cannot enable progressive streaming"), e.progressive = !1) : fetchSupported() && (e.loader = FetchLoader, e.progressive = !0, e.enableSoftwareAES = !0, d.log("[config]: Progressive streaming enabled, using FetchLoader"));
}
var wt, LevelController = class extends BasePlaylistController {
	constructor(e, t) {
		super(e, "[level-controller]"), this._levels = [], this._firstLevel = -1, this._maxAutoLevel = -1, this._startLevel = void 0, this.currentLevel = null, this.currentLevelIndex = -1, this.manualLevelIndex = -1, this.steering = void 0, this.onParsedComplete = void 0, this.steering = t, this._registerListeners();
	}
	_registerListeners() {
		let { hls: e } = this;
		e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_LOADED, this.onManifestLoaded, this), e.on(a.LEVEL_LOADED, this.onLevelLoaded, this), e.on(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.on(a.FRAG_BUFFERED, this.onFragBuffered, this), e.on(a.ERROR, this.onError, this);
	}
	_unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_LOADED, this.onManifestLoaded, this), e.off(a.LEVEL_LOADED, this.onLevelLoaded, this), e.off(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.off(a.FRAG_BUFFERED, this.onFragBuffered, this), e.off(a.ERROR, this.onError, this);
	}
	destroy() {
		this._unregisterListeners(), this.steering = null, this.resetLevels(), super.destroy();
	}
	stopLoad() {
		this._levels.forEach((e) => {
			e.loadError = 0, e.fragmentError = 0;
		}), super.stopLoad();
	}
	resetLevels() {
		this._startLevel = void 0, this.manualLevelIndex = -1, this.currentLevelIndex = -1, this.currentLevel = null, this._levels = [], this._maxAutoLevel = -1;
	}
	onManifestLoading(e, t) {
		this.resetLevels();
	}
	onManifestLoaded(e, t) {
		let n = this.hls.config.preferManagedMediaSource, r = [], i = {}, a = {}, o = !1, s = !1, c = !1;
		t.levels.forEach((e) => {
			let t = e.attrs, { audioCodec: l, videoCodec: u } = e;
			l?.indexOf("mp4a.40.34") !== -1 && (wt ||= /chrome|firefox/i.test(navigator.userAgent), wt && (e.audioCodec = l = void 0)), l && (e.audioCodec = l = getCodecCompatibleName(l, n)), u?.indexOf("avc1") === 0 && (u = e.videoCodec = convertAVC1ToAVCOTI(u));
			let { width: d, height: f, unknownCodecs: p } = e;
			if (o ||= !!(d && f), s ||= !!u, c ||= !!l, p != null && p.length || l && !areCodecsMediaSourceSupported(l, "audio", n) || u && !areCodecsMediaSourceSupported(u, "video", n)) return;
			let { CODECS: m, "FRAME-RATE": h, "HDCP-LEVEL": g, "PATHWAY-ID": _, RESOLUTION: v, "VIDEO-RANGE": y } = t, b = `${`${_ || "."}-`}${e.bitrate}-${v}-${h}-${m}-${y}-${g}`;
			if (!i[b]) {
				let t = new Level(e);
				i[b] = t, a[b] = 1, r.push(t);
			} else if (i[b].uri !== e.url && !e.attrs["PATHWAY-ID"]) {
				let t = a[b] += 1;
				e.attrs["PATHWAY-ID"] = Array(t + 1).join(".");
				let n = new Level(e);
				i[b] = n, r.push(n);
			} else i[b].addGroupId("audio", t.AUDIO), i[b].addGroupId("text", t.SUBTITLES);
		}), this.filterAndSortMediaOptions(r, t, o, s, c);
	}
	filterAndSortMediaOptions(e, t, n, r, i) {
		let c = [], l = [], u = e;
		if ((n || r) && i && (u = u.filter(({ videoCodec: e, videoRange: t, width: n, height: r }) => (!!e || !!(n && r)) && isVideoRange(t))), u.length === 0) {
			Promise.resolve().then(() => {
				if (this.hls) {
					t.levels.length && this.warn(`One or more CODECS in variant not supported: ${JSON.stringify(t.levels[0].attrs)}`);
					let e = /* @__PURE__ */ Error("no level with compatible codecs found in manifest");
					this.hls.trigger(a.ERROR, {
						type: o.MEDIA_ERROR,
						details: s.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
						fatal: !0,
						url: t.url,
						error: e,
						reason: e.message
					});
				}
			});
			return;
		}
		if (t.audioTracks) {
			let { preferManagedMediaSource: e } = this.hls.config;
			c = t.audioTracks.filter((t) => !t.audioCodec || areCodecsMediaSourceSupported(t.audioCodec, "audio", e)), assignTrackIdsByGroup(c);
		}
		t.subtitles && (l = t.subtitles, assignTrackIdsByGroup(l));
		let d = u.slice(0);
		u.sort((e, t) => {
			if (e.attrs["HDCP-LEVEL"] !== t.attrs["HDCP-LEVEL"]) return (e.attrs["HDCP-LEVEL"] || "") > (t.attrs["HDCP-LEVEL"] || "") ? 1 : -1;
			if (n && e.height !== t.height) return e.height - t.height;
			if (e.frameRate !== t.frameRate) return e.frameRate - t.frameRate;
			if (e.videoRange !== t.videoRange) return se.indexOf(e.videoRange) - se.indexOf(t.videoRange);
			if (e.videoCodec !== t.videoCodec) {
				let n = videoCodecPreferenceValue(e.videoCodec), r = videoCodecPreferenceValue(t.videoCodec);
				if (n !== r) return r - n;
			}
			if (e.uri === t.uri && e.codecSet !== t.codecSet) {
				let n = codecsSetSelectionPreferenceValue(e.codecSet), r = codecsSetSelectionPreferenceValue(t.codecSet);
				if (n !== r) return r - n;
			}
			return e.averageBitrate === t.averageBitrate ? 0 : e.averageBitrate - t.averageBitrate;
		});
		let f = d[0];
		if (this.steering && (u = this.steering.filterParsedLevels(u), u.length !== d.length)) {
			for (let e = 0; e < d.length; e++) if (d[e].pathwayId === u[0].pathwayId) {
				f = d[e];
				break;
			}
		}
		this._levels = u;
		for (let e = 0; e < u.length; e++) if (u[e] === f) {
			this._firstLevel = e;
			let t = f.bitrate, n = this.hls.bandwidthEstimate;
			if (this.log(`manifest loaded, ${u.length} level(s) found, first bitrate: ${t}`), this.hls.userConfig?.abrEwmaDefaultEstimate === void 0) {
				let e = Math.min(t, this.hls.config.abrEwmaDefaultEstimateMax);
				e > n && n === Ct.abrEwmaDefaultEstimate && (this.hls.bandwidthEstimate = e);
			}
			break;
		}
		let p = i && !r, m = {
			levels: u,
			audioTracks: c,
			subtitleTracks: l,
			sessionData: t.sessionData,
			sessionKeys: t.sessionKeys,
			firstLevel: this._firstLevel,
			stats: t.stats,
			audio: i,
			video: r,
			altAudio: !p && c.some((e) => !!e.url)
		};
		this.hls.trigger(a.MANIFEST_PARSED, m), (this.hls.config.autoStartLoad || this.hls.forceStartLoad) && this.hls.startLoad(this.hls.config.startPosition);
	}
	get levels() {
		return this._levels.length === 0 ? null : this._levels;
	}
	get level() {
		return this.currentLevelIndex;
	}
	set level(e) {
		let t = this._levels;
		if (t.length === 0) return;
		if (e < 0 || e >= t.length) {
			let n = /* @__PURE__ */ Error("invalid level idx"), r = e < 0;
			if (this.hls.trigger(a.ERROR, {
				type: o.OTHER_ERROR,
				details: s.LEVEL_SWITCH_ERROR,
				level: e,
				fatal: r,
				error: n,
				reason: n.message
			}), r) return;
			e = Math.min(e, t.length - 1);
		}
		let n = this.currentLevelIndex, r = this.currentLevel, i = r ? r.attrs["PATHWAY-ID"] : void 0, c = t[e], l = c.attrs["PATHWAY-ID"];
		if (this.currentLevelIndex = e, this.currentLevel = c, n === e && c.details && r && i === l) return;
		this.log(`Switching to level ${e} (${c.height ? c.height + "p " : ""}${c.videoRange ? c.videoRange + " " : ""}${c.codecSet ? c.codecSet + " " : ""}@${c.bitrate})${l ? " with Pathway " + l : ""} from level ${n}${i ? " with Pathway " + i : ""}`);
		let u = {
			level: e,
			attrs: c.attrs,
			details: c.details,
			bitrate: c.bitrate,
			averageBitrate: c.averageBitrate,
			maxBitrate: c.maxBitrate,
			realBitrate: c.realBitrate,
			width: c.width,
			height: c.height,
			codecSet: c.codecSet,
			audioCodec: c.audioCodec,
			videoCodec: c.videoCodec,
			audioGroups: c.audioGroups,
			subtitleGroups: c.subtitleGroups,
			loaded: c.loaded,
			loadError: c.loadError,
			fragmentError: c.fragmentError,
			name: c.name,
			id: c.id,
			uri: c.uri,
			url: c.url,
			urlId: 0,
			audioGroupIds: c.audioGroupIds,
			textGroupIds: c.textGroupIds
		};
		this.hls.trigger(a.LEVEL_SWITCHING, u);
		let d = c.details;
		if (!d || d.live) {
			let e = this.switchParams(c.uri, r?.details, d);
			this.loadPlaylist(e);
		}
	}
	get manualLevel() {
		return this.manualLevelIndex;
	}
	set manualLevel(e) {
		this.manualLevelIndex = e, this._startLevel === void 0 && (this._startLevel = e), e !== -1 && (this.level = e);
	}
	get firstLevel() {
		return this._firstLevel;
	}
	set firstLevel(e) {
		this._firstLevel = e;
	}
	get startLevel() {
		if (this._startLevel === void 0) {
			let e = this.hls.config.startLevel;
			return e === void 0 ? this.hls.firstAutoLevel : e;
		}
		return this._startLevel;
	}
	set startLevel(e) {
		this._startLevel = e;
	}
	onError(e, t) {
		!t.fatal && t.context && t.context.type === F.LEVEL && t.context.level === this.level && this.checkRetry(t);
	}
	onFragBuffered(e, { frag: t }) {
		if (t !== void 0 && t.type === I.MAIN) {
			let e = t.elementaryStreams;
			if (!Object.keys(e).some((t) => !!e[t])) return;
			let n = this._levels[t.level];
			n != null && n.loadError && (this.log(`Resetting level error count of ${n.loadError} on frag buffered`), n.loadError = 0);
		}
	}
	onLevelLoaded(e, t) {
		var n;
		let { level: r, details: i } = t, a = this._levels[r];
		if (!a) {
			var o;
			this.warn(`Invalid level index ${r}`), (o = t.deliveryDirectives) != null && o.skip && (i.deltaUpdateFailed = !0);
			return;
		}
		r === this.currentLevelIndex ? (a.fragmentError === 0 && (a.loadError = 0), this.playlistLoaded(r, t, a.details)) : (n = t.deliveryDirectives) != null && n.skip && (i.deltaUpdateFailed = !0);
	}
	loadPlaylist(e) {
		super.loadPlaylist();
		let t = this.currentLevelIndex, n = this.currentLevel;
		if (n && this.shouldLoadPlaylist(n)) {
			let r = n.uri;
			if (e) try {
				r = e.addDirectives(r);
			} catch (e) {
				this.warn(`Could not construct new URL with HLS Delivery Directives: ${e}`);
			}
			let i = n.attrs["PATHWAY-ID"];
			this.log(`Loading level index ${t}${e?.msn === void 0 ? "" : " at sn " + e.msn + " part " + e.part} with${i ? " Pathway " + i : ""} ${r}`), this.clearTimer(), this.hls.trigger(a.LEVEL_LOADING, {
				url: r,
				level: t,
				pathwayId: n.attrs["PATHWAY-ID"],
				id: 0,
				deliveryDirectives: e || null
			});
		}
	}
	get nextLoadLevel() {
		return this.manualLevelIndex === -1 ? this.hls.nextAutoLevel : this.manualLevelIndex;
	}
	set nextLoadLevel(e) {
		this.level = e, this.manualLevelIndex === -1 && (this.hls.nextAutoLevel = e);
	}
	removeLevel(e) {
		var t;
		let n = this._levels.filter((t, n) => n !== e || (this.steering && this.steering.removeLevel(t), t === this.currentLevel && (this.currentLevel = null, this.currentLevelIndex = -1, t.details && t.details.fragments.forEach((e) => e.level = -1)), !1));
		reassignFragmentLevelIndexes(n), this._levels = n, this.currentLevelIndex > -1 && (t = this.currentLevel) != null && t.details && (this.currentLevelIndex = this.currentLevel.details.fragments[0].level), this.hls.trigger(a.LEVELS_UPDATED, { levels: n });
	}
	onLevelsUpdated(e, { levels: t }) {
		this._levels = t;
	}
	checkMaxAutoUpdated() {
		let { autoLevelCapping: e, maxAutoLevel: t, maxHdcpLevel: n } = this.hls;
		this._maxAutoLevel !== t && (this._maxAutoLevel = t, this.hls.trigger(a.MAX_AUTO_LEVEL_UPDATED, {
			autoLevelCapping: e,
			levels: this.levels,
			maxAutoLevel: t,
			minAutoLevel: this.hls.minAutoLevel,
			maxHdcpLevel: n
		}));
	}
};
function assignTrackIdsByGroup(e) {
	let t = {};
	e.forEach((e) => {
		let n = e.groupId || "";
		e.id = t[n] = t[n] || 0, t[n]++;
	});
}
var KeyLoader = class {
	constructor(e) {
		this.config = void 0, this.keyUriToKeyInfo = {}, this.emeController = null, this.config = e;
	}
	abort(e) {
		for (let t in this.keyUriToKeyInfo) {
			let n = this.keyUriToKeyInfo[t].loader;
			if (n) {
				if (e && e !== n.context?.frag.type) return;
				n.abort();
			}
		}
	}
	detach() {
		for (let e in this.keyUriToKeyInfo) {
			let t = this.keyUriToKeyInfo[e];
			(t.mediaKeySessionContext || t.decryptdata.isCommonEncryption) && delete this.keyUriToKeyInfo[e];
		}
	}
	destroy() {
		this.detach();
		for (let e in this.keyUriToKeyInfo) {
			let t = this.keyUriToKeyInfo[e].loader;
			t && t.destroy();
		}
		this.keyUriToKeyInfo = {};
	}
	createKeyLoadError(e, t = s.KEY_LOAD_ERROR, n, r, i) {
		return new LoadError({
			type: o.NETWORK_ERROR,
			details: t,
			fatal: !1,
			frag: e,
			response: i,
			error: n,
			networkDetails: r
		});
	}
	loadClear(e, t) {
		if (this.emeController && this.config.emeEnabled) {
			let { sn: n, cc: r } = e;
			for (let e = 0; e < t.length; e++) {
				let i = t[e];
				if (r <= i.cc && (n === "initSegment" || i.sn === "initSegment" || n < i.sn)) {
					this.emeController.selectKeySystemFormat(i).then((e) => {
						i.setKeyFormat(e);
					});
					break;
				}
			}
		}
	}
	load(e) {
		return !e.decryptdata && e.encrypted && this.emeController ? this.emeController.selectKeySystemFormat(e).then((t) => this.loadInternal(e, t)) : this.loadInternal(e);
	}
	loadInternal(e, t) {
		var n, r;
		t && e.setKeyFormat(t);
		let i = e.decryptdata;
		if (!i) {
			let n = /* @__PURE__ */ Error(t ? `Expected frag.decryptdata to be defined after setting format ${t}` : "Missing decryption data on fragment in onKeyLoading");
			return Promise.reject(this.createKeyLoadError(e, s.KEY_LOAD_ERROR, n));
		}
		let a = i.uri;
		if (!a) return Promise.reject(this.createKeyLoadError(e, s.KEY_LOAD_ERROR, /* @__PURE__ */ Error(`Invalid key URI: "${a}"`)));
		let o = this.keyUriToKeyInfo[a];
		if ((n = o) != null && n.decryptdata.key) return i.key = o.decryptdata.key, Promise.resolve({
			frag: e,
			keyInfo: o
		});
		if ((r = o) != null && r.keyLoadPromise) switch (o.mediaKeySessionContext?.keyStatus) {
			case void 0:
			case "status-pending":
			case "usable":
			case "usable-in-future": return o.keyLoadPromise.then((t) => (i.key = t.keyInfo.decryptdata.key, {
				frag: e,
				keyInfo: o
			}));
		}
		switch (o = this.keyUriToKeyInfo[a] = {
			decryptdata: i,
			keyLoadPromise: null,
			loader: null,
			mediaKeySessionContext: null
		}, i.method) {
			case "ISO-23001-7":
			case "SAMPLE-AES":
			case "SAMPLE-AES-CENC":
			case "SAMPLE-AES-CTR": return i.keyFormat === "identity" ? this.loadKeyHTTP(o, e) : this.loadKeyEME(o, e);
			case "AES-128": return this.loadKeyHTTP(o, e);
			default: return Promise.reject(this.createKeyLoadError(e, s.KEY_LOAD_ERROR, /* @__PURE__ */ Error(`Key supplied with unsupported METHOD: "${i.method}"`)));
		}
	}
	loadKeyEME(e, t) {
		let n = {
			frag: t,
			keyInfo: e
		};
		if (this.emeController && this.config.emeEnabled) {
			let t = this.emeController.loadKey(n);
			if (t) return (e.keyLoadPromise = t.then((t) => (e.mediaKeySessionContext = t, n))).catch((t) => {
				throw e.keyLoadPromise = null, t;
			});
		}
		return Promise.resolve(n);
	}
	loadKeyHTTP(e, t) {
		let n = this.config, r = n.loader, i = new r(n);
		return t.keyLoader = e.loader = i, e.keyLoadPromise = new Promise((r, a) => {
			let o = {
				keyInfo: e,
				frag: t,
				responseType: "arraybuffer",
				url: e.decryptdata.uri
			}, c = n.keyLoadPolicy.default, l = {
				loadPolicy: c,
				timeout: c.maxLoadTimeMs,
				maxRetry: 0,
				retryDelay: 0,
				maxRetryDelay: 0
			};
			i.load(o, l, {
				onSuccess: (e, t, n, i) => {
					let { frag: o, keyInfo: c, url: l } = n;
					if (!o.decryptdata || c !== this.keyUriToKeyInfo[l]) return a(this.createKeyLoadError(o, s.KEY_LOAD_ERROR, /* @__PURE__ */ Error("after key load, decryptdata unset or changed"), i));
					c.decryptdata.key = o.decryptdata.key = new Uint8Array(e.data), o.keyLoader = null, c.loader = null, r({
						frag: o,
						keyInfo: c
					});
				},
				onError: (e, n, r, i) => {
					this.resetLoader(n), a(this.createKeyLoadError(t, s.KEY_LOAD_ERROR, /* @__PURE__ */ Error(`HTTP Error ${e.code} loading key ${e.text}`), r, _objectSpread2({
						url: o.url,
						data: void 0
					}, e)));
				},
				onTimeout: (e, n, r) => {
					this.resetLoader(n), a(this.createKeyLoadError(t, s.KEY_LOAD_TIMEOUT, /* @__PURE__ */ Error("key loading timed out"), r));
				},
				onAbort: (e, n, r) => {
					this.resetLoader(n), a(this.createKeyLoadError(t, s.INTERNAL_ABORTED, /* @__PURE__ */ Error("key loading aborted"), r));
				}
			});
		});
	}
	resetLoader(e) {
		let { frag: t, keyInfo: n, url: r } = e, i = n.loader;
		t.keyLoader === i && (t.keyLoader = null, n.loader = null), delete this.keyUriToKeyInfo[r], i && i.destroy();
	}
};
function getSourceBuffer() {
	return self.SourceBuffer || self.WebKitSourceBuffer;
}
function isMSESupported() {
	if (!getMediaSource()) return !1;
	let e = getSourceBuffer();
	return !e || e.prototype && typeof e.prototype.appendBuffer == "function" && typeof e.prototype.remove == "function";
}
function isSupported() {
	if (!isMSESupported()) return !1;
	let e = getMediaSource();
	return typeof e?.isTypeSupported == "function" && ([
		"avc1.42E01E,mp4a.40.2",
		"av01.0.01M.08",
		"vp09.00.50.08"
	].some((t) => e.isTypeSupported(mimeTypeForCodec(t, "video"))) || ["mp4a.40.2", "fLaC"].some((t) => e.isTypeSupported(mimeTypeForCodec(t, "audio"))));
}
function changeTypeSupported() {
	return typeof getSourceBuffer()?.prototype?.changeType == "function";
}
var Tt = 250, Et = 2, Dt = .1, Ot = .05, GapController = class {
	constructor(e, t, n, r) {
		this.config = void 0, this.media = null, this.fragmentTracker = void 0, this.hls = void 0, this.nudgeRetry = 0, this.stallReported = !1, this.stalled = null, this.moved = !1, this.seeking = !1, this.config = e, this.media = t, this.fragmentTracker = n, this.hls = r;
	}
	destroy() {
		this.media = null, this.hls = this.fragmentTracker = null;
	}
	poll(e, t) {
		let { config: n, media: r, stalled: i } = this;
		if (r === null) return;
		let { currentTime: a, seeking: o } = r, s = this.seeking && !o, c = !this.seeking && o;
		if (this.seeking = o, a !== e) {
			if (this.moved = !0, o || (this.nudgeRetry = 0), i !== null) {
				if (this.stallReported) {
					let e = self.performance.now() - i;
					d.warn(`playback not stuck anymore @${a}, after ${Math.round(e)}ms`), this.stallReported = !1;
				}
				this.stalled = null;
			}
			return;
		}
		if (c || s) {
			this.stalled = null;
			return;
		}
		if (r.paused && !o || r.ended || r.playbackRate === 0 || !H.getBuffered(r).length) {
			this.nudgeRetry = 0;
			return;
		}
		let l = H.bufferInfo(r, a, 0), u = l.nextStart || 0;
		if (o) {
			let e = l.len > Et, n = !u || t && t.start <= a || u - a > Et && !this.fragmentTracker.getPartialFragment(a);
			if (e || n) return;
			this.moved = !1;
		}
		if (!this.moved && this.stalled !== null) {
			if (!(l.len > 0) && !u) return;
			let e = Math.max(u, l.start || 0) - a, t = this.hls.levels ? this.hls.levels[this.hls.currentLevel] : null, n = t != null && t.details?.live ? t.details.targetduration * 2 : Et, i = this.fragmentTracker.getPartialFragment(a);
			if (e > 0 && (e <= n || i)) {
				r.paused || this._trySkipBufferHole(i);
				return;
			}
		}
		let f = self.performance.now();
		if (i === null) {
			this.stalled = f;
			return;
		}
		let p = f - i;
		if (!o && p >= Tt && (this._reportStall(l), !this.media)) return;
		let m = H.bufferInfo(r, a, n.maxBufferHole);
		this._tryFixBufferStall(m, p);
	}
	_tryFixBufferStall(e, t) {
		let { config: n, fragmentTracker: r, media: i } = this;
		if (i === null) return;
		let a = i.currentTime, o = r.getPartialFragment(a);
		(!o || !this._trySkipBufferHole(o) && this.media) && (e.len > n.maxBufferHole || e.nextStart && e.nextStart - a < n.maxBufferHole) && t > n.highBufferWatchdogPeriod * 1e3 && (d.warn("Trying to nudge playhead over buffer-hole"), this.stalled = null, this._tryNudgeBuffer());
	}
	_reportStall(e) {
		let { hls: t, media: n, stallReported: r } = this;
		if (!r && n) {
			this.stallReported = !0;
			let r = /* @__PURE__ */ Error(`Playback stalling at @${n.currentTime} due to low buffer (${JSON.stringify(e)})`);
			d.warn(r.message), t.trigger(a.ERROR, {
				type: o.MEDIA_ERROR,
				details: s.BUFFER_STALLED_ERROR,
				fatal: !1,
				error: r,
				buffer: e.len
			});
		}
	}
	_trySkipBufferHole(e) {
		let { config: t, hls: n, media: r } = this;
		if (r === null) return 0;
		let i = r.currentTime, c = H.bufferInfo(r, i, 0), l = i < c.start ? c.start : c.nextStart;
		if (l) {
			let u = c.len <= t.maxBufferHole, f = c.len > 0 && c.len < 1 && r.readyState < 3, p = l - i;
			if (p > 0 && (u || f)) {
				if (p > t.maxBufferHole) {
					let { fragmentTracker: t } = this, n = !1;
					if (i === 0) {
						let e = t.getAppendedFrag(0, I.MAIN);
						e && l < e.end && (n = !0);
					}
					if (!n) {
						let n = e || t.getAppendedFrag(i, I.MAIN);
						if (n) {
							let e = !1, r = n.end;
							for (; r < l;) {
								let n = t.getPartialFragment(r);
								if (n) r += n.duration;
								else {
									e = !0;
									break;
								}
							}
							if (e) return 0;
						}
					}
				}
				let c = Math.max(l + Ot, i + Dt);
				if (d.warn(`skipping hole, adjusting currentTime from ${i} to ${c}`), this.moved = !0, this.stalled = null, r.currentTime = c, e && !e.gap) {
					let t = /* @__PURE__ */ Error(`fragment loaded with buffer holes, seeking from ${i} to ${c}`);
					n.trigger(a.ERROR, {
						type: o.MEDIA_ERROR,
						details: s.BUFFER_SEEK_OVER_HOLE,
						fatal: !1,
						error: t,
						reason: t.message,
						frag: e
					});
				}
				return c;
			}
		}
		return 0;
	}
	_tryNudgeBuffer() {
		let { config: e, hls: t, media: n, nudgeRetry: r } = this;
		if (n === null) return;
		let i = n.currentTime;
		if (this.nudgeRetry++, r < e.nudgeMaxRetry) {
			let c = i + (r + 1) * e.nudgeOffset, l = /* @__PURE__ */ Error(`Nudging 'currentTime' from ${i} to ${c}`);
			d.warn(l.message), n.currentTime = c, t.trigger(a.ERROR, {
				type: o.MEDIA_ERROR,
				details: s.BUFFER_NUDGE_ON_STALL,
				error: l,
				fatal: !1
			});
		} else {
			let n = /* @__PURE__ */ Error(`Playhead still not moving while enough data buffered @${i} after ${e.nudgeMaxRetry} nudges`);
			d.error(n.message), t.trigger(a.ERROR, {
				type: o.MEDIA_ERROR,
				details: s.BUFFER_STALLED_ERROR,
				error: n,
				fatal: !0
			});
		}
	}
}, kt = 100, StreamController = class extends BaseStreamController {
	constructor(e, t, n) {
		super(e, t, n, "[stream-controller]", I.MAIN), this.audioCodecSwap = !1, this.gapController = null, this.level = -1, this._forceStartLoad = !1, this.altAudio = !1, this.audioOnly = !1, this.fragPlaying = null, this.onvplaying = null, this.onvseeked = null, this.fragLastKbps = 0, this.couldBacktrack = !1, this.backtrackFragment = null, this.audioCodecSwitch = !1, this.videoBuffer = null, this._registerListeners();
	}
	_registerListeners() {
		let { hls: e } = this;
		e.on(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.on(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.on(a.MANIFEST_LOADING, this.onManifestLoading, this), e.on(a.MANIFEST_PARSED, this.onManifestParsed, this), e.on(a.LEVEL_LOADING, this.onLevelLoading, this), e.on(a.LEVEL_LOADED, this.onLevelLoaded, this), e.on(a.FRAG_LOAD_EMERGENCY_ABORTED, this.onFragLoadEmergencyAborted, this), e.on(a.ERROR, this.onError, this), e.on(a.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this), e.on(a.AUDIO_TRACK_SWITCHED, this.onAudioTrackSwitched, this), e.on(a.BUFFER_CREATED, this.onBufferCreated, this), e.on(a.BUFFER_FLUSHED, this.onBufferFlushed, this), e.on(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.on(a.FRAG_BUFFERED, this.onFragBuffered, this);
	}
	_unregisterListeners() {
		let { hls: e } = this;
		e.off(a.MEDIA_ATTACHED, this.onMediaAttached, this), e.off(a.MEDIA_DETACHING, this.onMediaDetaching, this), e.off(a.MANIFEST_LOADING, this.onManifestLoading, this), e.off(a.MANIFEST_PARSED, this.onManifestParsed, this), e.off(a.LEVEL_LOADED, this.onLevelLoaded, this), e.off(a.FRAG_LOAD_EMERGENCY_ABORTED, this.onFragLoadEmergencyAborted, this), e.off(a.ERROR, this.onError, this), e.off(a.AUDIO_TRACK_SWITCHING, this.onAudioTrackSwitching, this), e.off(a.AUDIO_TRACK_SWITCHED, this.onAudioTrackSwitched, this), e.off(a.BUFFER_CREATED, this.onBufferCreated, this), e.off(a.BUFFER_FLUSHED, this.onBufferFlushed, this), e.off(a.LEVELS_UPDATED, this.onLevelsUpdated, this), e.off(a.FRAG_BUFFERED, this.onFragBuffered, this);
	}
	onHandlerDestroying() {
		this._unregisterListeners(), super.onHandlerDestroying();
	}
	startLoad(e) {
		if (this.levels) {
			let { lastCurrentTime: t, hls: n } = this;
			if (this.stopLoad(), this.setInterval(kt), this.level = -1, !this.startFragRequested) {
				let e = n.startLevel;
				e === -1 && (n.config.testBandwidth && this.levels.length > 1 ? (e = 0, this.bitrateTest = !0) : e = n.firstAutoLevel), n.nextLoadLevel = e, this.level = n.loadLevel, this.loadedmetadata = !1;
			}
			t > 0 && e === -1 && (this.log(`Override startPosition with lastCurrentTime @${t.toFixed(3)}`), e = t), this.state = U.IDLE, this.nextLoadPosition = this.startPosition = this.lastCurrentTime = e, this.tick();
		} else this._forceStartLoad = !0, this.state = U.STOPPED;
	}
	stopLoad() {
		this._forceStartLoad = !1, super.stopLoad();
	}
	doTick() {
		switch (this.state) {
			case U.WAITING_LEVEL: {
				let { levels: e, level: t } = this, n = e?.[t], r = n?.details;
				if (r && (!r.live || this.levelLastLoaded === n)) {
					if (this.waitForCdnTuneIn(r)) break;
					this.state = U.IDLE;
					break;
				}
				if (this.hls.nextLoadLevel !== this.level) {
					this.state = U.IDLE;
					break;
				}
				break;
			}
			case U.FRAG_LOADING_WAITING_RETRY: {
				var e;
				let t = self.performance.now(), n = this.retryDate;
				if (!n || t >= n || (e = this.media) != null && e.seeking) {
					let { levels: e, level: t } = this, n = e?.[t];
					this.resetStartWhenNotLoaded(n || null), this.state = U.IDLE;
				}
			}
		}
		this.state === U.IDLE && this.doTickIdle(), this.onTickEnd();
	}
	onTickEnd() {
		super.onTickEnd(), this.checkBuffer(), this.checkFragmentChanged();
	}
	doTickIdle() {
		let { hls: e, levelLastLoaded: t, levels: n, media: r } = this;
		if (t === null || !r && (this.startFragRequested || !e.config.startFragPrefetch) || this.altAudio && this.audioOnly) return;
		let i = e.nextLoadLevel;
		if (!(n != null && n[i])) return;
		let o = n[i], s = this.getMainFwdBufferInfo();
		if (s === null) return;
		let c = this.getLevelDetails();
		if (c && this._streamEnded(s, c)) {
			let e = {};
			this.altAudio && (e.type = "video"), this.hls.trigger(a.BUFFER_EOS, e), this.state = U.ENDED;
			return;
		}
		e.loadLevel !== i && e.manualLevel === -1 && this.log(`Adapting to level ${i} from level ${this.level}`), this.level = e.nextLoadLevel = i;
		let l = o.details;
		if (!l || this.state === U.WAITING_LEVEL || l.live && this.levelLastLoaded !== o) {
			this.level = i, this.state = U.WAITING_LEVEL;
			return;
		}
		let u = s.len, d = this.getMaxBufferLength(o.maxBitrate);
		if (u >= d) return;
		this.backtrackFragment && this.backtrackFragment.start > s.end && (this.backtrackFragment = null);
		let f = this.backtrackFragment ? this.backtrackFragment.start : s.end, p = this.getNextFragment(f, l);
		if (this.couldBacktrack && !this.fragPrevious && p && p.sn !== "initSegment" && this.fragmentTracker.getState(p) !== V.OK) {
			let e = (this.backtrackFragment ?? p).sn - l.startSN, t = l.fragments[e - 1];
			t && p.cc === t.cc && (p = t, this.fragmentTracker.removeFragment(t));
		} else this.backtrackFragment && s.len && (this.backtrackFragment = null);
		if (p && this.isLoopLoading(p, f)) {
			if (!p.gap) {
				let e = this.audioOnly && !this.altAudio ? h.AUDIO : h.VIDEO, t = (e === h.VIDEO ? this.videoBuffer : this.mediaBuffer) || this.media;
				t && this.afterBufferFlushed(t, e, I.MAIN);
			}
			p = this.getNextFragmentLoopLoading(p, l, s, I.MAIN, d);
		}
		p && (p.initSegment && !p.initSegment.data && !this.bitrateTest && (p = p.initSegment), this.loadFragment(p, o, f));
	}
	loadFragment(e, t, n) {
		let r = this.fragmentTracker.getState(e);
		this.fragCurrent = e, r === V.NOT_LOADED || r === V.PARTIAL ? e.sn === "initSegment" ? this._loadInitSegment(e, t) : this.bitrateTest ? (this.log(`Fragment ${e.sn} of level ${e.level} is being downloaded to test bitrate and will not be buffered`), this._loadBitrateTestFrag(e, t)) : (this.startFragRequested = !0, super.loadFragment(e, t, n)) : this.clearTrackerIfNeeded(e);
	}
	getBufferedFrag(e) {
		return this.fragmentTracker.getBufferedFrag(e, I.MAIN);
	}
	followingBufferedFrag(e) {
		return e ? this.getBufferedFrag(e.end + .5) : null;
	}
	immediateLevelSwitch() {
		this.abortCurrentFrag(), this.flushMainBuffer(0, Infinity);
	}
	nextLevelSwitch() {
		let { levels: e, media: t } = this;
		if (t != null && t.readyState) {
			let n, r = this.getAppendedFrag(t.currentTime);
			r && r.start > 1 && this.flushMainBuffer(0, r.start - 1);
			let i = this.getLevelDetails();
			if (i != null && i.live) {
				let e = this.getMainFwdBufferInfo();
				if (!e || e.len < i.targetduration * 2) return;
			}
			if (!t.paused && e) {
				let t = e[this.hls.nextLoadLevel], r = this.fragLastKbps;
				n = r && this.fragCurrent ? this.fragCurrent.duration * t.maxBitrate / (1e3 * r) + 1 : 0;
			} else n = 0;
			let a = this.getBufferedFrag(t.currentTime + n);
			if (a) {
				let e = this.followingBufferedFrag(a);
				if (e) {
					this.abortCurrentFrag();
					let t = e.maxStartPTS ? e.maxStartPTS : e.start, n = e.duration, r = Math.max(a.end, t + Math.min(Math.max(n - this.config.maxFragLookUpTolerance, n * (this.couldBacktrack ? .5 : .125)), n * (this.couldBacktrack ? .75 : .25)));
					this.flushMainBuffer(r, Infinity);
				}
			}
		}
	}
	abortCurrentFrag() {
		let e = this.fragCurrent;
		switch (this.fragCurrent = null, this.backtrackFragment = null, e && (e.abortRequests(), this.fragmentTracker.removeFragment(e)), this.state) {
			case U.KEY_LOADING:
			case U.FRAG_LOADING:
			case U.FRAG_LOADING_WAITING_RETRY:
			case U.PARSING:
			case U.PARSED: this.state = U.IDLE;
		}
		this.nextLoadPosition = this.getLoadPosition();
	}
	flushMainBuffer(e, t) {
		super.flushMainBuffer(e, t, this.altAudio ? "video" : null);
	}
	onMediaAttached(e, t) {
		super.onMediaAttached(e, t);
		let n = t.media;
		this.onvplaying = this.onMediaPlaying.bind(this), this.onvseeked = this.onMediaSeeked.bind(this), n.addEventListener("playing", this.onvplaying), n.addEventListener("seeked", this.onvseeked), this.gapController = new GapController(this.config, n, this.fragmentTracker, this.hls);
	}
	onMediaDetaching() {
		let { media: e } = this;
		e && this.onvplaying && this.onvseeked && (e.removeEventListener("playing", this.onvplaying), e.removeEventListener("seeked", this.onvseeked), this.onvplaying = this.onvseeked = null, this.videoBuffer = null), this.fragPlaying = null, this.gapController &&= (this.gapController.destroy(), null), super.onMediaDetaching();
	}
	onMediaPlaying() {
		this.tick();
	}
	onMediaSeeked() {
		let e = this.media, t = e ? e.currentTime : null;
		n(t) && this.log(`Media seeked to ${t.toFixed(3)}`);
		let r = this.getMainFwdBufferInfo();
		if (r === null || r.len === 0) {
			this.warn(`Main forward buffer length on "seeked" event ${r ? r.len : "empty"})`);
			return;
		}
		this.tick();
	}
	onManifestLoading() {
		this.log("Trigger BUFFER_RESET"), this.hls.trigger(a.BUFFER_RESET, void 0), this.fragmentTracker.removeAllFragments(), this.couldBacktrack = !1, this.startPosition = this.lastCurrentTime = this.fragLastKbps = 0, this.levels = this.fragPlaying = this.backtrackFragment = this.levelLastLoaded = null, this.altAudio = this.audioOnly = this.startFragRequested = !1;
	}
	onManifestParsed(e, t) {
		let n = !1, r = !1;
		t.levels.forEach((e) => {
			let t = e.audioCodec;
			t && (n ||= t.indexOf("mp4a.40.2") !== -1, r ||= t.indexOf("mp4a.40.5") !== -1);
		}), this.audioCodecSwitch = n && r && !changeTypeSupported(), this.audioCodecSwitch && this.log("Both AAC/HE-AAC audio found in levels; declaring level codec as HE-AAC"), this.levels = t.levels, this.startFragRequested = !1;
	}
	onLevelLoading(e, t) {
		let { levels: n } = this;
		if (!n || this.state !== U.IDLE) return;
		let r = n[t.level];
		(!r.details || r.details.live && this.levelLastLoaded !== r || this.waitForCdnTuneIn(r.details)) && (this.state = U.WAITING_LEVEL);
	}
	onLevelLoaded(e, t) {
		var n;
		let { levels: r } = this, i = t.level, o = t.details, s = o.totalduration;
		if (!r) {
			this.warn(`Levels were reset while loading level ${i}`);
			return;
		}
		this.log(`Level ${i} loaded [${o.startSN},${o.endSN}]${o.lastPartSn ? `[part-${o.lastPartSn}-${o.lastPartIndex}]` : ""}, cc [${o.startCC}, ${o.endCC}] duration:${s}`);
		let c = r[i], l = this.fragCurrent;
		l && (this.state === U.FRAG_LOADING || this.state === U.FRAG_LOADING_WAITING_RETRY) && l.level !== t.level && l.loader && this.abortCurrentFrag();
		let u = 0;
		if (o.live || (n = c.details) != null && n.live) {
			if (this.checkLiveUpdate(o), o.deltaUpdateFailed) return;
			u = this.alignPlaylists(o, c.details, this.levelLastLoaded?.details);
		}
		if (c.details = o, this.levelLastLoaded = c, this.hls.trigger(a.LEVEL_UPDATED, {
			details: o,
			level: i
		}), this.state === U.WAITING_LEVEL) {
			if (this.waitForCdnTuneIn(o)) return;
			this.state = U.IDLE;
		}
		this.startFragRequested ? o.live && this.synchronizeToLiveEdge(o) : this.setStartPosition(o, u), this.tick();
	}
	_handleFragmentLoadProgress(e) {
		let { frag: t, part: n, payload: r } = e, { levels: i } = this;
		if (!i) {
			this.warn(`Levels were reset while fragment load was in progress. Fragment ${t.sn} of level ${t.level} will not be buffered`);
			return;
		}
		let a = i[t.level], o = a.details;
		if (!o) {
			this.warn(`Dropping fragment ${t.sn} of level ${t.level} after level details were reset`), this.fragmentTracker.removeFragment(t);
			return;
		}
		let s = a.videoCodec, c = o.PTSKnown || !o.live, l = t.initSegment?.data, u = this._getAudioCodec(a), d = this.transmuxer = this.transmuxer || new TransmuxerInterface(this.hls, I.MAIN, this._handleTransmuxComplete.bind(this), this._handleTransmuxerFlush.bind(this)), f = n ? n.index : -1, p = f !== -1, m = new ChunkMetadata(t.level, t.sn, t.stats.chunkCount, r.byteLength, f, p), h = this.initPTS[t.cc];
		d.push(r, l, u, s, t, n, o.totalduration, c, m, h);
	}
	onAudioTrackSwitching(e, t) {
		let n = this.altAudio;
		if (!t.url) {
			if (this.mediaBuffer !== this.media) {
				this.log("Switching on main audio, use media.buffered to schedule main fragment loading"), this.mediaBuffer = this.media;
				let e = this.fragCurrent;
				e && (this.log("Switching to main audio track, cancel main fragment load"), e.abortRequests(), this.fragmentTracker.removeFragment(e)), this.resetTransmuxer(), this.resetLoadingState();
			} else this.audioOnly && this.resetTransmuxer();
			let e = this.hls;
			n && (e.trigger(a.BUFFER_FLUSHING, {
				startOffset: 0,
				endOffset: Infinity,
				type: null
			}), this.fragmentTracker.removeAllFragments()), e.trigger(a.AUDIO_TRACK_SWITCHED, t);
		}
	}
	onAudioTrackSwitched(e, t) {
		let n = t.id, r = !!this.hls.audioTracks[n].url;
		if (r) {
			let e = this.videoBuffer;
			e && this.mediaBuffer !== e && (this.log("Switching on alternate audio, use video.buffered to schedule main fragment loading"), this.mediaBuffer = e);
		}
		this.altAudio = r, this.tick();
	}
	onBufferCreated(e, t) {
		let n = t.tracks, r, i, a = !1;
		for (let e in n) {
			let t = n[e];
			if (t.id === "main") {
				if (i = e, r = t, e === "video") {
					let t = n[e];
					t && (this.videoBuffer = t.buffer);
				}
			} else a = !0;
		}
		a && r ? (this.log(`Alternate track found, use ${i}.buffered to schedule main fragment loading`), this.mediaBuffer = r.buffer) : this.mediaBuffer = this.media;
	}
	onFragBuffered(e, t) {
		let { frag: n, part: r } = t;
		if (n && n.type !== I.MAIN) return;
		if (this.fragContextChanged(n)) {
			this.warn(`Fragment ${n.sn}${r ? " p: " + r.index : ""} of level ${n.level} finished buffering, but was aborted. state: ${this.state}`), this.state === U.PARSED && (this.state = U.IDLE);
			return;
		}
		let i = r ? r.stats : n.stats;
		this.fragLastKbps = Math.round(8 * i.total / (i.buffering.end - i.loading.first)), n.sn !== "initSegment" && (this.fragPrevious = n), this.fragBufferedComplete(n, r);
	}
	onError(e, t) {
		if (t.fatal) {
			this.state = U.ERROR;
			return;
		}
		switch (t.details) {
			case s.FRAG_GAP:
			case s.FRAG_PARSING_ERROR:
			case s.FRAG_DECRYPT_ERROR:
			case s.FRAG_LOAD_ERROR:
			case s.FRAG_LOAD_TIMEOUT:
			case s.KEY_LOAD_ERROR:
			case s.KEY_LOAD_TIMEOUT:
				this.onFragmentOrKeyLoadError(I.MAIN, t);
				break;
			case s.LEVEL_LOAD_ERROR:
			case s.LEVEL_LOAD_TIMEOUT:
			case s.LEVEL_PARSING_ERROR:
				!t.levelRetry && this.state === U.WAITING_LEVEL && t.context?.type === F.LEVEL && (this.state = U.IDLE);
				break;
			case s.BUFFER_APPEND_ERROR:
			case s.BUFFER_FULL_ERROR:
				if (!t.parent || t.parent !== "main") return;
				if (t.details === s.BUFFER_APPEND_ERROR) {
					this.resetLoadingState();
					return;
				}
				this.reduceLengthAndFlushBuffer(t) && this.flushMainBuffer(0, Infinity);
				break;
			case s.INTERNAL_EXCEPTION: this.recoverWorkerError(t);
		}
	}
	checkBuffer() {
		let { media: e, gapController: t } = this;
		if (e && t && e.readyState) {
			if (this.loadedmetadata || !H.getBuffered(e).length) {
				let e = this.state === U.IDLE ? null : this.fragCurrent;
				t.poll(this.lastCurrentTime, e);
			}
			this.lastCurrentTime = e.currentTime;
		}
	}
	onFragLoadEmergencyAborted() {
		this.state = U.IDLE, this.loadedmetadata || (this.startFragRequested = !1, this.nextLoadPosition = this.startPosition), this.tickImmediate();
	}
	onBufferFlushed(e, { type: t }) {
		if (t !== h.AUDIO || this.audioOnly && !this.altAudio) {
			let e = (t === h.VIDEO ? this.videoBuffer : this.mediaBuffer) || this.media;
			this.afterBufferFlushed(e, t, I.MAIN), this.tick();
		}
	}
	onLevelsUpdated(e, t) {
		this.level > -1 && this.fragCurrent && (this.level = this.fragCurrent.level), this.levels = t.levels;
	}
	swapAudioCodec() {
		this.audioCodecSwap = !this.audioCodecSwap;
	}
	seekToStartPos() {
		let { media: e } = this;
		if (!e) return;
		let t = e.currentTime, n = this.startPosition;
		if (n >= 0 && t < n) {
			if (e.seeking) {
				this.log(`could not seek to ${n}, already seeking at ${t}`);
				return;
			}
			let r = H.getBuffered(e), i = (r.length ? r.start(0) : 0) - n;
			i > 0 && (i < this.config.maxBufferHole || i < this.config.maxFragLookUpTolerance) && (this.log(`adjusting start position by ${i} to match buffer start`), n += i, this.startPosition = n), this.log(`seek to target start position ${n} from current time ${t}`), e.currentTime = n;
		}
	}
	_getAudioCodec(e) {
		let t = this.config.defaultAudioCodec || e.audioCodec;
		return this.audioCodecSwap && t && (this.log("Swapping audio codec"), t = t.indexOf("mp4a.40.5") === -1 ? "mp4a.40.5" : "mp4a.40.2"), t;
	}
	_loadBitrateTestFrag(e, t) {
		e.bitrateTest = !0, this._doFragLoad(e, t).then((n) => {
			let { hls: r } = this;
			if (!n || this.fragContextChanged(e)) return;
			t.fragmentError = 0, this.state = U.IDLE, this.startFragRequested = !1, this.bitrateTest = !1;
			let i = e.stats;
			i.parsing.start = i.parsing.end = i.buffering.start = i.buffering.end = self.performance.now(), r.trigger(a.FRAG_LOADED, n), e.bitrateTest = !1;
		});
	}
	_handleTransmuxComplete(e) {
		var t;
		let r = "main", { hls: i } = this, { remuxResult: o, chunkMeta: s } = e, c = this.getCurrentContext(s);
		if (!c) {
			this.resetWhenMissingContext(s);
			return;
		}
		let { frag: l, part: u, level: d } = c, { video: f, text: p, id3: m, initSegment: g } = o, { details: _ } = d, v = this.altAudio ? void 0 : o.audio;
		if (this.fragContextChanged(l)) {
			this.fragmentTracker.removeFragment(l);
			return;
		}
		if (this.state = U.PARSING, g) {
			if (g != null && g.tracks) {
				let e = l.initSegment || l;
				this._bufferInitSegment(d, g.tracks, e, s), i.trigger(a.FRAG_PARSING_INIT_SEGMENT, {
					frag: e,
					id: r,
					tracks: g.tracks
				});
			}
			let e = g.initPTS, t = g.timescale;
			n(e) && (this.initPTS[l.cc] = {
				baseTime: e,
				timescale: t
			}, i.trigger(a.INIT_PTS_FOUND, {
				frag: l,
				id: r,
				initPTS: e,
				timescale: t
			}));
		}
		if (f && _ && l.sn !== "initSegment") {
			let e = _.fragments[l.sn - 1 - _.startSN], t = l.sn === _.startSN, n = !e || l.cc > e.cc;
			if (o.independent !== !1) {
				let { startPTS: e, endPTS: r, startDTS: i, endDTS: a } = f;
				if (u) u.elementaryStreams[f.type] = {
					startPTS: e,
					endPTS: r,
					startDTS: i,
					endDTS: a
				};
				else if (f.firstKeyFrame && f.independent && s.id === 1 && !n && (this.couldBacktrack = !0), f.dropped && f.independent) {
					let i = this.getMainFwdBufferInfo(), o = (i ? i.end : this.getLoadPosition()) + this.config.maxBufferHole, s = f.firstKeyFramePTS ? f.firstKeyFramePTS : e;
					if (!t && o < s - this.config.maxBufferHole && !n) {
						this.backtrack(l);
						return;
					}
					n && (l.gap = !0), l.setElementaryStreamInfo(f.type, l.start, r, l.start, a, !0);
				} else t && e > Et && (l.gap = !0);
				l.setElementaryStreamInfo(f.type, e, r, i, a), this.backtrackFragment &&= l, this.bufferFragmentData(f, l, u, s, t || n);
			} else if (t || n) l.gap = !0;
			else {
				this.backtrack(l);
				return;
			}
		}
		if (v) {
			let { startPTS: e, endPTS: t, startDTS: n, endDTS: r } = v;
			u && (u.elementaryStreams[h.AUDIO] = {
				startPTS: e,
				endPTS: t,
				startDTS: n,
				endDTS: r
			}), l.setElementaryStreamInfo(h.AUDIO, e, t, n, r), this.bufferFragmentData(v, l, u, s);
		}
		if (_ && m != null && (t = m.samples) != null && t.length) {
			let e = {
				id: r,
				frag: l,
				details: _,
				samples: m.samples
			};
			i.trigger(a.FRAG_PARSING_METADATA, e);
		}
		if (_ && p) {
			let e = {
				id: r,
				frag: l,
				details: _,
				samples: p.samples
			};
			i.trigger(a.FRAG_PARSING_USERDATA, e);
		}
	}
	_bufferInitSegment(e, t, n, r) {
		if (this.state !== U.PARSING) return;
		this.audioOnly = !!t.audio && !t.video, this.altAudio && !this.audioOnly && delete t.audio;
		let { audio: i, video: o, audiovideo: s } = t;
		if (i) {
			let t = e.audioCodec, n = navigator.userAgent.toLowerCase();
			if (this.audioCodecSwitch) {
				t &&= t.indexOf("mp4a.40.5") === -1 ? "mp4a.40.5" : "mp4a.40.2";
				let e = i.metadata;
				e && "channelCount" in e && (e.channelCount || 1) !== 1 && n.indexOf("firefox") === -1 && (t = "mp4a.40.5");
			}
			t && t.indexOf("mp4a.40.5") !== -1 && n.indexOf("android") !== -1 && i.container !== "audio/mpeg" && (t = "mp4a.40.2", this.log(`Android: force audio codec to ${t}`)), e.audioCodec && e.audioCodec !== t && this.log(`Swapping manifest audio codec "${e.audioCodec}" for "${t}"`), i.levelCodec = t, i.id = "main", this.log(`Init audio buffer, container:${i.container}, codecs[selected/level/parsed]=[${t || ""}/${e.audioCodec || ""}/${i.codec}]`);
		}
		o && (o.levelCodec = e.videoCodec, o.id = "main", this.log(`Init video buffer, container:${o.container}, codecs[level/parsed]=[${e.videoCodec || ""}/${o.codec}]`)), s && this.log(`Init audiovideo buffer, container:${s.container}, codecs[level/parsed]=[${e.codecs}/${s.codec}]`), this.hls.trigger(a.BUFFER_CODECS, t), Object.keys(t).forEach((e) => {
			let i = t[e].initSegment;
			i != null && i.byteLength && this.hls.trigger(a.BUFFER_APPENDING, {
				type: e,
				data: i,
				frag: n,
				part: null,
				chunkMeta: r,
				parent: n.type
			});
		}), this.tickImmediate();
	}
	getMainFwdBufferInfo() {
		return this.getFwdBufferInfo(this.mediaBuffer ? this.mediaBuffer : this.media, I.MAIN);
	}
	backtrack(e) {
		this.couldBacktrack = !0, this.backtrackFragment = e, this.resetTransmuxer(), this.flushBufferGap(e), this.fragmentTracker.removeFragment(e), this.fragPrevious = null, this.nextLoadPosition = e.start, this.state = U.IDLE;
	}
	checkFragmentChanged() {
		let e = this.media, t = null;
		if (e && e.readyState > 1 && e.seeking === !1) {
			let n = e.currentTime;
			if (H.isBuffered(e, n) ? t = this.getAppendedFrag(n) : H.isBuffered(e, n + .1) && (t = this.getAppendedFrag(n + .1)), t) {
				this.backtrackFragment = null;
				let e = this.fragPlaying, n = t.level;
				(!e || t.sn !== e.sn || e.level !== n) && (this.fragPlaying = t, this.hls.trigger(a.FRAG_CHANGED, { frag: t }), (!e || e.level !== n) && this.hls.trigger(a.LEVEL_SWITCHED, { level: n }));
			}
		}
	}
	get nextLevel() {
		let e = this.nextBufferedFrag;
		return e ? e.level : -1;
	}
	get currentFrag() {
		let e = this.media;
		return e ? this.fragPlaying || this.getAppendedFrag(e.currentTime) : null;
	}
	get currentProgramDateTime() {
		let e = this.media;
		if (e) {
			let t = e.currentTime, r = this.currentFrag;
			if (r && n(t) && n(r.programDateTime)) {
				let e = r.programDateTime + (t - r.start) * 1e3;
				return new Date(e);
			}
		}
		return null;
	}
	get currentLevel() {
		let e = this.currentFrag;
		return e ? e.level : -1;
	}
	get nextBufferedFrag() {
		let e = this.currentFrag;
		return e ? this.followingBufferedFrag(e) : null;
	}
	get forceStartLoad() {
		return this._forceStartLoad;
	}
}, At = class Hls {
	static get version() {
		return "1.5.13";
	}
	static isMSESupported() {
		return isMSESupported();
	}
	static isSupported() {
		return isSupported();
	}
	static getMediaSource() {
		return getMediaSource();
	}
	static get Events() {
		return a;
	}
	static get ErrorTypes() {
		return o;
	}
	static get ErrorDetails() {
		return s;
	}
	static get DefaultConfig() {
		return Hls.defaultConfig ? Hls.defaultConfig : Ct;
	}
	static set DefaultConfig(e) {
		Hls.defaultConfig = e;
	}
	constructor(e = {}) {
		this.config = void 0, this.userConfig = void 0, this.coreComponents = void 0, this.networkControllers = void 0, this.started = !1, this._emitter = new je(), this._autoLevelCapping = -1, this._maxHdcpLevel = null, this.abrController = void 0, this.bufferController = void 0, this.capLevelController = void 0, this.latencyController = void 0, this.levelController = void 0, this.streamController = void 0, this.audioTrackController = void 0, this.subtitleTrackController = void 0, this.emeController = void 0, this.cmcdController = void 0, this._media = null, this.url = null, this.triggeringException = void 0, enableLogs(e.debug || !1, "Hls instance");
		let t = this.config = mergeConfig(Hls.DefaultConfig, e);
		this.userConfig = e, t.progressive && enableStreamingMode(t);
		let { abrController: n, bufferController: r, capLevelController: i, errorController: o, fpsController: s } = t, c = new o(this), l = this.abrController = new n(this), u = this.bufferController = new r(this), d = this.capLevelController = new i(this), f = new s(this), p = new PlaylistLoader(this), m = new ID3TrackController(this), h = t.contentSteeringController, g = h ? new h(this) : null, _ = this.levelController = new LevelController(this, g), v = new FragmentTracker(this), y = new KeyLoader(this.config), b = this.streamController = new StreamController(this, v, y);
		d.setStreamController(b), f.setStreamController(b);
		let x = [
			p,
			_,
			b
		];
		g && x.splice(1, 0, g), this.networkControllers = x;
		let S = [
			l,
			u,
			d,
			f,
			m,
			v
		];
		this.audioTrackController = this.createController(t.audioTrackController, x);
		let C = t.audioStreamController;
		C && x.push(new C(this, v, y)), this.subtitleTrackController = this.createController(t.subtitleTrackController, x);
		let w = t.subtitleStreamController;
		w && x.push(new w(this, v, y)), this.createController(t.timelineController, S), y.emeController = this.emeController = this.createController(t.emeController, S), this.cmcdController = this.createController(t.cmcdController, S), this.latencyController = this.createController(LatencyController, S), this.coreComponents = S, x.push(c);
		let T = c.onErrorOut;
		typeof T == "function" && this.on(a.ERROR, T, c);
	}
	createController(e, t) {
		if (e) {
			let n = new e(this);
			return t && t.push(n), n;
		}
		return null;
	}
	on(e, t, n = this) {
		this._emitter.on(e, t, n);
	}
	once(e, t, n = this) {
		this._emitter.once(e, t, n);
	}
	removeAllListeners(e) {
		this._emitter.removeAllListeners(e);
	}
	off(e, t, n = this, r) {
		this._emitter.off(e, t, n, r);
	}
	listeners(e) {
		return this._emitter.listeners(e);
	}
	emit(e, t, n) {
		return this._emitter.emit(e, t, n);
	}
	trigger(e, t) {
		if (this.config.debug) return this.emit(e, e, t);
		try {
			return this.emit(e, e, t);
		} catch (t) {
			if (d.error("An internal error happened while handling event " + e + ". Error message: \"" + t.message + "\". Here is a stacktrace:", t), !this.triggeringException) {
				this.triggeringException = !0;
				let n = e === a.ERROR;
				this.trigger(a.ERROR, {
					type: o.OTHER_ERROR,
					details: s.INTERNAL_EXCEPTION,
					fatal: n,
					event: e,
					error: t
				}), this.triggeringException = !1;
			}
		}
		return !1;
	}
	listenerCount(e) {
		return this._emitter.listenerCount(e);
	}
	destroy() {
		d.log("destroy"), this.trigger(a.DESTROYING, void 0), this.detachMedia(), this.removeAllListeners(), this._autoLevelCapping = -1, this.url = null, this.networkControllers.forEach((e) => e.destroy()), this.networkControllers.length = 0, this.coreComponents.forEach((e) => e.destroy()), this.coreComponents.length = 0;
		let e = this.config;
		e.xhrSetup = e.fetchSetup = void 0, this.userConfig = null;
	}
	attachMedia(e) {
		d.log("attachMedia"), this._media = e, this.trigger(a.MEDIA_ATTACHING, { media: e });
	}
	detachMedia() {
		d.log("detachMedia"), this.trigger(a.MEDIA_DETACHING, void 0), this._media = null;
	}
	loadSource(e) {
		this.stopLoad();
		let n = this.media, r = this.url, i = this.url = t.buildAbsoluteURL(self.location.href, e, { alwaysNormalize: !0 });
		this._autoLevelCapping = -1, this._maxHdcpLevel = null, d.log(`loadSource:${i}`), n && r && (r !== i || this.bufferController.hasSourceTypes()) && (this.detachMedia(), this.attachMedia(n)), this.trigger(a.MANIFEST_LOADING, { url: e });
	}
	startLoad(e = -1) {
		d.log(`startLoad(${e})`), this.started = !0, this.networkControllers.forEach((t) => {
			t.startLoad(e);
		});
	}
	stopLoad() {
		d.log("stopLoad"), this.started = !1, this.networkControllers.forEach((e) => {
			e.stopLoad();
		});
	}
	resumeBuffering() {
		this.started && this.networkControllers.forEach((e) => {
			"fragmentLoader" in e && e.startLoad(-1);
		});
	}
	pauseBuffering() {
		this.networkControllers.forEach((e) => {
			"fragmentLoader" in e && e.stopLoad();
		});
	}
	swapAudioCodec() {
		d.log("swapAudioCodec"), this.streamController.swapAudioCodec();
	}
	recoverMediaError() {
		d.log("recoverMediaError");
		let e = this._media;
		this.detachMedia(), e && this.attachMedia(e);
	}
	removeLevel(e) {
		this.levelController.removeLevel(e);
	}
	get levels() {
		return this.levelController.levels || [];
	}
	get currentLevel() {
		return this.streamController.currentLevel;
	}
	set currentLevel(e) {
		d.log(`set currentLevel:${e}`), this.levelController.manualLevel = e, this.streamController.immediateLevelSwitch();
	}
	get nextLevel() {
		return this.streamController.nextLevel;
	}
	set nextLevel(e) {
		d.log(`set nextLevel:${e}`), this.levelController.manualLevel = e, this.streamController.nextLevelSwitch();
	}
	get loadLevel() {
		return this.levelController.level;
	}
	set loadLevel(e) {
		d.log(`set loadLevel:${e}`), this.levelController.manualLevel = e;
	}
	get nextLoadLevel() {
		return this.levelController.nextLoadLevel;
	}
	set nextLoadLevel(e) {
		this.levelController.nextLoadLevel = e;
	}
	get firstLevel() {
		return Math.max(this.levelController.firstLevel, this.minAutoLevel);
	}
	set firstLevel(e) {
		d.log(`set firstLevel:${e}`), this.levelController.firstLevel = e;
	}
	get startLevel() {
		let e = this.levelController.startLevel;
		return e === -1 && this.abrController.forcedAutoLevel > -1 ? this.abrController.forcedAutoLevel : e;
	}
	set startLevel(e) {
		d.log(`set startLevel:${e}`), e !== -1 && (e = Math.max(e, this.minAutoLevel)), this.levelController.startLevel = e;
	}
	get capLevelToPlayerSize() {
		return this.config.capLevelToPlayerSize;
	}
	set capLevelToPlayerSize(e) {
		let t = !!e;
		t !== this.config.capLevelToPlayerSize && (t ? this.capLevelController.startCapping() : (this.capLevelController.stopCapping(), this.autoLevelCapping = -1, this.streamController.nextLevelSwitch()), this.config.capLevelToPlayerSize = t);
	}
	get autoLevelCapping() {
		return this._autoLevelCapping;
	}
	get bandwidthEstimate() {
		let { bwEstimator: e } = this.abrController;
		return e ? e.getEstimate() : NaN;
	}
	set bandwidthEstimate(e) {
		this.abrController.resetEstimator(e);
	}
	get ttfbEstimate() {
		let { bwEstimator: e } = this.abrController;
		return e ? e.getEstimateTTFB() : NaN;
	}
	set autoLevelCapping(e) {
		this._autoLevelCapping !== e && (d.log(`set autoLevelCapping:${e}`), this._autoLevelCapping = e, this.levelController.checkMaxAutoUpdated());
	}
	get maxHdcpLevel() {
		return this._maxHdcpLevel;
	}
	set maxHdcpLevel(e) {
		isHdcpLevel(e) && this._maxHdcpLevel !== e && (this._maxHdcpLevel = e, this.levelController.checkMaxAutoUpdated());
	}
	get autoLevelEnabled() {
		return this.levelController.manualLevel === -1;
	}
	get manualLevel() {
		return this.levelController.manualLevel;
	}
	get minAutoLevel() {
		let { levels: e, config: { minAutoBitrate: t } } = this;
		if (!e) return 0;
		let n = e.length;
		for (let r = 0; r < n; r++) if (e[r].maxBitrate >= t) return r;
		return 0;
	}
	get maxAutoLevel() {
		let { levels: e, autoLevelCapping: t, maxHdcpLevel: n } = this, r;
		if (r = t === -1 && e != null && e.length ? e.length - 1 : t, n) for (let t = r; t--;) {
			let r = e[t].attrs["HDCP-LEVEL"];
			if (r && r <= n) return t;
		}
		return r;
	}
	get firstAutoLevel() {
		return this.abrController.firstAutoLevel;
	}
	get nextAutoLevel() {
		return this.abrController.nextAutoLevel;
	}
	set nextAutoLevel(e) {
		this.abrController.nextAutoLevel = e;
	}
	get playingDate() {
		return this.streamController.currentProgramDateTime;
	}
	get mainForwardBufferInfo() {
		return this.streamController.getMainFwdBufferInfo();
	}
	setAudioOption(e) {
		return this.audioTrackController?.setAudioOption(e);
	}
	setSubtitleOption(e) {
		var t;
		return (t = this.subtitleTrackController) == null || t.setSubtitleOption(e), null;
	}
	get allAudioTracks() {
		let e = this.audioTrackController;
		return e ? e.allAudioTracks : [];
	}
	get audioTracks() {
		let e = this.audioTrackController;
		return e ? e.audioTracks : [];
	}
	get audioTrack() {
		let e = this.audioTrackController;
		return e ? e.audioTrack : -1;
	}
	set audioTrack(e) {
		let t = this.audioTrackController;
		t && (t.audioTrack = e);
	}
	get allSubtitleTracks() {
		let e = this.subtitleTrackController;
		return e ? e.allSubtitleTracks : [];
	}
	get subtitleTracks() {
		let e = this.subtitleTrackController;
		return e ? e.subtitleTracks : [];
	}
	get subtitleTrack() {
		let e = this.subtitleTrackController;
		return e ? e.subtitleTrack : -1;
	}
	get media() {
		return this._media;
	}
	set subtitleTrack(e) {
		let t = this.subtitleTrackController;
		t && (t.subtitleTrack = e);
	}
	get subtitleDisplay() {
		let e = this.subtitleTrackController;
		return e ? e.subtitleDisplay : !1;
	}
	set subtitleDisplay(e) {
		let t = this.subtitleTrackController;
		t && (t.subtitleDisplay = e);
	}
	get lowLatencyMode() {
		return this.config.lowLatencyMode;
	}
	set lowLatencyMode(e) {
		this.config.lowLatencyMode = e;
	}
	get liveSyncPosition() {
		return this.latencyController.liveSyncPosition;
	}
	get latency() {
		return this.latencyController.latency;
	}
	get maxLatency() {
		return this.latencyController.maxLatency;
	}
	get targetLatency() {
		return this.latencyController.targetLatency;
	}
	get drift() {
		return this.latencyController.drift;
	}
	get forceStartLoad() {
		return this.streamController.forceStartLoad;
	}
};
At.defaultConfig = void 0;
//#endregion
export { AbrController, m as AttrList, AudioStreamController, AudioTrackController, BasePlaylistController, BaseSegment, BaseStreamController, BufferController, CMCDController, $e as CapLevelController, ChunkMetadata, ContentSteeringController, DateRange, tt as EMEController, B as ErrorActionFlags, ErrorController, s as ErrorDetails, o as ErrorTypes, a as Events, FPSController, Fragment, At as Hls, At as default, R as HlsSkip, HlsUrlParameters, y as KeySystemFormats, v as KeySystems, Level, LevelDetails, O as LevelKey, LoadStats, L as MetadataSchema, z as NetworkErrorAction, Part, I as PlaylistLevelType, SubtitleStreamController, SubtitleTrackController, TimelineController, getMediaSource, isMSESupported, isSupported };
