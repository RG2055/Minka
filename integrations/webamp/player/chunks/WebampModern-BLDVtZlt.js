import "./rolldown-runtime-ly0BBW_k.js";
import { $ as e, A as t, B as n, C as r, D as i, E as a, F as o, G as s, H as c, I as l, J as u, K as d, L as f, M as p, N as m, O as h, P as g, Q as _, R as v, S as y, U as b, V as ee, W as te, X as ne, Y as x, _ as S, at as C, b as w, ct as T, d as E, et as D, g as re, h as ie, i as O, it as ae, j as oe, k as se, lt as k, m as ce, nt as A, o as le, p as j, q as M, r as N, rt as P, st as F, t as I, tt as L, ut as R, v as z, w as B, x as V, y as H, z as U } from "./GammaGroup-BUFdecwO.js";
//#region src/vendor/webamp-modern/skin/makiClasses/LayoutStatus.js
var LayoutStatus = class extends s {
	setXmlAttr(e, t) {
		return !!super.setXmlAttr(e, t);
	}
	callme(e) {
		console.log("callme:", e);
	}
};
LayoutStatus.GUID = "7fd5f21048dfacc45154a0a676dc6c57";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/MakiMap.js
var MakiMap = class extends u {
	constructor(e) {
		super(), this._uiRoot = e;
	}
	loadmap(e) {
		this._bitmap = this._uiRoot.getBitmap(e);
	}
	inregion(e, t) {
		return !0;
	}
	getvalue(e, t) {
		A(e >= 0, `Expected x to be positive but it was ${e}`), A(t >= 0, `Expected y to be positive but it was ${t}`);
		let { data: n } = this._bitmap.getCanvas(!0).getContext("2d").getImageData(e, t, 1, 1);
		return L(n[0] === n[1] && n[0] === n[2], "Expected map image to be grey scale"), A(n[3] === 255, "Expected map image not have transparency"), n[0];
	}
	getUnsafeValue(e, t) {
		let n = this._bitmap.getCanvas(!0);
		if (e < 0 || t < 0 || e >= n.width || t >= n.height) return null;
		let { data: r } = n.getContext("2d").getImageData(e, t, 1, 1);
		return r[0] !== r[1] || r[0] !== r[2] || r[3] != 255 ? null : r[0];
	}
	getwidth() {
		return this._bitmap.getWidth();
	}
	getheight() {
		return this._bitmap.getHeight();
	}
};
MakiMap.GUID = "3860366542a7461b3fd875aa73bf6766";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/List.js
var MakiList = class extends u {
	constructor(e) {
		super(), this._list = [], this._uiRoot = e;
	}
	additem(e) {
		this._list.push(e);
	}
	removeitem(e) {
		this._list[e] && this._list.splice(e, 1);
	}
	finditem(e) {
		return this._list.indexOf(e);
	}
	finditem2(e, t) {
		return this._list.indexOf(e, t);
	}
	enumitem(e) {
		return this._list[e];
	}
	getnumitems() {
		return this._list.length;
	}
	removeall() {
		this._list = [];
	}
};
MakiList.GUID = "b2023ab54ba1434d6359aebec6f30375";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/BitList.js
var BitList = class extends u {
	constructor(e) {
		super(), this._items = [], this._uiRoot = e;
	}
	getitem(e) {
		return this._items[e];
	}
	setitem(e, t) {
		this.setsize(e), this._items[e] = t;
	}
	setsize(e) {
		for (; this._items.length < e;) this._items.push(!1);
	}
	getsize() {
		return this._items.length;
	}
};
BitList.GUID = "87c6577849fee743cc09f98556fd2a53";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/GroupList.js
var GroupList = class extends s {};
GroupList.GUID = "01e28ce111d5b059dee49f970a76516f";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/CfgGroup.js
var CfgGroup = class extends g {};
CfgGroup.GUID = "80f0f8bd42a61ba5363293a04a8d0ca0";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/TabSheet.js
var TabSheet = class extends s {};
TabSheet.GUID = "b5baa5354dcb05b318e6c1ad96688fd2";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/MouseRedir.js
var MouseRedir = class extends s {};
MouseRedir.GUID = "9b2e341b40fa6c981b0c858b0594e86e";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/DropDownList.js
var DropDownList = class extends s {};
DropDownList.GUID = "36d59b714af803fd020595977a26dbb7";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Edit.js
var Edit = class extends s {};
Edit.GUID = "64e4bbfa49d981f45ba8c0b0fdbcc32e";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Browser.js
var Browser = class extends s {};
Browser.GUID = "a8c2200d4b2a51eb4b5d7fba714c5dc6";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Wac.js
var Wac = class extends u {
	constructor(e) {
		super(), this._uiRoot = e;
	}
};
Wac.GUID = "00c074a049a0fea2bbfa8dbe401616db";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/QueryList.js
var QueryList = class extends s {};
QueryList.GUID = "cdcb785d425381f2b861058ffa3c2872";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/GuiList.js
var GuiList = class extends s {};
GuiList.GUID = "6129fec14d51dab7ca016591db701b0c";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/GuiTree.js
var GuiTree = class extends s {};
GuiTree.GUID = "d59514f745e8ed364e3f0f98d92c52a0";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/TreeItem.js
var TreeItem = class extends u {
	constructor(e) {
		super(), this._uiRoot = e;
	}
};
TreeItem.GUID = "9b3b4b82420e667a4179fc8f029c8015";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/CheckBox.js
var CheckBox = class extends s {};
CheckBox.GUID = "c7ed319947985319b1606398aa8c295a";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Region.js
var Region = class {
	loadfrommap(e, t, n) {}
};
Region.GUID = "3a370c02439f3cbf8886f184361ecf5b";
//#endregion
//#region src/vendor/webamp-modern/_snowpack/pkg/common/v2parser-3944e9de.js
var W = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 }), t.default = /* @__PURE__ */ "Blues.Classic Rock.Country.Dance.Disco.Funk.Grunge.Hip-Hop.Jazz.Metal.New Age.Oldies.Other.Pop.R&B.Rap.Reggae.Rock.Techno.Industrial.Alternative.Ska.Death Metal.Pranks.Soundtrack.Euro-Techno.Ambient.Trip-Hop.Vocal.Jazz+Funk.Fusion.Trance.Classical.Instrumental.Acid.House.Game.Sound Clip.Gospel.Noise.AlternRock.Bass.Soul.Punk.Space.Meditative.Instrumental Pop.Instrumental Rock.Ethnic.Gothic.Darkwave.Techno-Industrial.Electronic.Pop-Folk.Eurodance.Dream.Southern Rock.Comedy.Cult.Gangsta Rap.Top 40.Christian Rap.Pop / Funk.Jungle.Native American.Cabaret.New Wave.Psychedelic.Rave.Showtunes.Trailer.Lo-Fi.Tribal.Acid Punk.Acid Jazz.Polka.Retro.Musical.Rock & Roll.Hard Rock.Folk.Folk-Rock.National Folk.Swing.Fast  Fusion.Bebob.Latin.Revival.Celtic.Bluegrass.Avantgarde.Gothic Rock.Progressive Rock.Psychedelic Rock.Symphonic Rock.Slow Rock.Big Band.Chorus.Easy Listening.Acoustic.Humour.Speech.Chanson.Opera.Chamber Music.Sonata.Symphony.Booty Bass.Primus.Porn Groove.Satire.Slow Jam.Club.Tango.Samba.Folklore.Ballad.Power Ballad.Rhythmic Soul.Freestyle.Duet.Punk Rock.Drum Solo.A Cappella.Euro-House.Dance Hall.Goa.Drum & Bass.Club-House.Hardcore.Terror.Indie.BritPop.Negerpunk.Polsk Punk.Beat.Christian Gangsta Rap.Heavy Metal.Black Metal.Crossover.Contemporary Christian.Christian Rock.Merengue.Salsa.Thrash Metal.Anime.JPop.Synthpop.Rock/Pop".split(".");
}), G = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 });
	var n = String.fromCharCode;
	function readBytesToUTF8(e, t) {
		t = t == null || t < 0 ? e.length : Math.min(t, e.length);
		var r = 0;
		e[0] === 239 && e[1] === 187 && e[2] === 191 && (r = 3);
		for (var i = [], a = 0; r < t; a++) {
			var o = e[r++], s = void 0, c = void 0, l = void 0, u = void 0;
			if (o === 0) break;
			o < 128 ? i[a] = n(o) : o >= 194 && o < 224 ? (s = e[r++], i[a] = n(((o & 31) << 6) + (s & 63))) : o >= 224 && o < 240 ? (s = e[r++], c = e[r++], i[a] = n(((o & 15) << 12) + ((s & 63) << 6) + (c & 63))) : o >= 240 && o < 245 && (s = e[r++], c = e[r++], l = e[r++], u = ((o & 7) << 18) + ((s & 63) << 12) + ((c & 63) << 6) + (l & 63) - 65536, i[a] = n((u >> 10) + 55296, (u & 1023) + 56320));
		}
		return i.join("");
	}
	t.readBytesToUTF8 = readBytesToUTF8;
	function readBytesToUTF16(e, t, r) {
		r = r == null || r < 0 ? e.length : Math.min(r, e.length);
		var i = 0, a = 1, o = 0;
		e[0] === 254 && e[1] === 255 ? (t = !0, i = 2) : e[0] === 255 && e[1] === 254 && (t = !1, i = 2), t && (a = 0, o = 1);
		for (var s = [], c, l, u, d, f, p, m = 0; i < r && (c = e[i + a], l = e[i + o], u = (c << 8) + l, i += 2, u !== 0); m++) c < 216 || c >= 224 ? s[m] = n(u) : (f = e[i + a], p = e[i + o], d = (f << 8) + p, i += 2, s[m] = n(u, d));
		return s.join("");
	}
	t.readBytesToUTF16 = readBytesToUTF16;
	function readBytesToISO8859(e, t) {
		t = t == null || t < 0 ? e.length : Math.min(t, e.length);
		for (var r = [], i = 0; i < t; i++) r.push(n(e[i]));
		return r.join("");
	}
	t.readBytesToISO8859 = readBytesToISO8859;
	function readBytesToString(e, t, n) {
		return t === 0 ? readBytesToISO8859(e, n) : t === 3 ? readBytesToUTF8(e, n) : t === 1 || t === 2 ? readBytesToUTF16(e, void 0, n) : null;
	}
	t.readBytesToString = readBytesToString;
	function getEndpointOfBytes(e, t, n) {
		n === void 0 && (n = 0);
		for (var r = t === 0 ? function(t) {
			return e[t] === 0;
		} : function(t) {
			return e[t] === 0 && e[t + 1] === 0;
		}, i = n; i < e.length && !r(i); i++);
		return i;
	}
	t.getEndpointOfBytes = getEndpointOfBytes;
	function skipPaddingZeros(e, t) {
		for (var n = t; e[n] === 0; n++) t++;
		return t;
	}
	t.skipPaddingZeros = skipPaddingZeros;
}), K = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 }), t.default = {
		TALB: "album",
		TBPM: "bpm",
		TCOM: "composer",
		TCON: "genre",
		TCOP: "copyright",
		TDEN: "encoding-time",
		TDLY: "playlist-delay",
		TDOR: "original-release-time",
		TDRC: "recording-time",
		TDRL: "release-time",
		TDTG: "tagging-time",
		TENC: "encoder",
		TEXT: "writer",
		TFLT: "file-type",
		TIPL: "involved-people",
		TIT1: "content-group",
		TIT2: "title",
		TIT3: "subtitle",
		TKEY: "initial-key",
		TLAN: "language",
		TLEN: "length",
		TMCL: "credits",
		TMED: "media-type",
		TMOO: "mood",
		TOAL: "original-album",
		TOFN: "original-filename",
		TOLY: "original-writer",
		TOPE: "original-artist",
		TOWN: "owner",
		TPE1: "artist",
		TPE2: "band",
		TPE3: "conductor",
		TPE4: "remixer",
		TPOS: "set-part",
		TPRO: "produced-notice",
		TPUB: "publisher",
		TRCK: "track",
		TRSN: "radio-name",
		TRSO: "radio-owner",
		TSOA: "album-sort",
		TSOP: "performer-sort",
		TSOT: "title-sort",
		TSRC: "isrc",
		TSSE: "encoder-settings",
		TSST: "set-subtitle",
		TXXX: "user-defined-text-information",
		TYER: "year",
		WCOM: "url-commercial",
		WCOP: "url-legal",
		WOAF: "url-file",
		WOAR: "url-artist",
		WOAS: "url-source",
		WORS: "url-radio",
		WPAY: "url-payment",
		WPUB: "url-publisher",
		WAF: "url-file",
		WAR: "url-artist",
		WAS: "url-source",
		WCM: "url-commercial",
		WCP: "url-copyright",
		WPB: "url-publisher",
		COMM: "comments",
		USLT: "lyrics",
		APIC: "image",
		PIC: "image",
		IPLS: "involved-people-list",
		OWNE: "ownership"
	}, t.FrameTypeValueMap = {
		TXXX: "array",
		COMM: "array",
		USLT: "array"
	};
}), ue = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 }), t.default = [
		"other",
		"file-icon",
		"icon",
		"cover-front",
		"cover-back",
		"leaflet",
		"media",
		"artist-lead",
		"artist",
		"conductor",
		"band",
		"composer",
		"lyricist-writer",
		"recording-location",
		"during-recording",
		"during-performance",
		"screen",
		"fish",
		"illustration",
		"logo-band",
		"logo-publisher"
	];
}), q = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 });
	var n = 20;
	function parseV2Data(e) {
		if (!e || e.length < n) return !1;
		var t = parseV2Header(e.slice(0, 10));
		if (!t) return !1;
		var r = t.version.flags;
		if (r.unsync) throw Error("no support for unsynchronisation");
		var i = 10;
		r.xheader && (i += calcTagSize(e.slice(10, 14)));
		var a = calcTagSize(e.slice(6, 10));
		return parseV2Frames(e.slice(i, a + i), t), t;
	}
	t.default = parseV2Data;
	function parseV2Header(e) {
		if (!e || e.length < 10 || G.readBytesToUTF8(e, 3) !== "ID3") return !1;
		var t = e[5];
		return { version: {
			major: 2,
			minor: e[3],
			revision: e[4],
			flags: {
				unsync: !!(t & 128),
				xheader: !!(t & 64),
				experimental: !!(t & 32)
			}
		} };
	}
	function calcTagSize(e) {
		return (e[0] & 127) * 2097152 + (e[1] & 127) * 16384 + (e[2] & 127) * 128 + (e[3] & 127);
	}
	t.calcTagSize = calcTagSize;
	function calcFrameSize(e) {
		return e.length < 4 ? 0 : e[0] * 16777216 + e[1] * 65536 + e[2] * 256 + e[3];
	}
	t.calcFrameSize = calcFrameSize;
	function parseV2Frames(e, t) {
		for (var n = 0, r = t.version; n < e.length;) {
			var i = calcFrameSize(e.slice(n + 4));
			if (i === 0) break;
			var a = e.slice(n, n + 10 + i);
			if (!a.length) break;
			var o = parseFrame(a, r.minor, i);
			o.tag && (K.FrameTypeValueMap[o.id] === "array" ? t[o.tag] ? t[o.tag].push(o.value) : t[o.tag] = [o.value] : t[o.tag] = o.value), n += a.length;
		}
	}
	function parseFrame(e, t, n) {
		var r = {
			id: null,
			tag: null,
			value: null
		}, i = {
			id: G.readBytesToUTF8(e, 4),
			type: null,
			size: n,
			flags: [e[8], e[9]]
		};
		if (i.type = i.id[0], r.id = i.id, i.flags[1] !== 0 || !(i.id in K.default)) return r;
		r.tag = K.default[i.id];
		var a = 0, o = 0, s = 0, c = 0;
		if (i.type === "T") {
			if (a = e[10], i.id === "TXXX") {
				o = 11, s = G.getEndpointOfBytes(e, a, o) - o;
				var l = {
					description: G.readBytesToString(e.slice(o), a, s),
					value: ""
				};
				o += s + 1, o = G.skipPaddingZeros(e, o), l.value = G.readBytesToString(e.slice(o), a), r.value = l;
			} else if (r.value = G.readBytesToString(e.slice(11), a), i.id === "TCON" && r.value !== null) {
				if (r.value[0] === "(") {
					var u = r.value.match(/\(\d+\)/g);
					u && (r.value = u.map(function(e) {
						return W.default[+e.slice(1, -1)];
					}).join(","));
				} else {
					var d = parseInt(r.value, 10);
					isNaN(d) || (r.value = W.default[d]);
				}
			}
		} else if (i.type === "W") r.value = i.id === "WXXX" && e[10] === 0 ? G.readBytesToISO8859(e.slice(11)) : G.readBytesToISO8859(e.slice(10));
		else if (i.id === "COMM" || i.id === "USLT") {
			a = e[10], o = 14, s = 0;
			var f = G.readBytesToISO8859(e.slice(11), 3);
			s = G.getEndpointOfBytes(e, a, o) - o;
			var p = G.readBytesToString(e.slice(o), a, s);
			o = G.skipPaddingZeros(e, o + s + 1), r.value = {
				language: f,
				description: p,
				value: G.readBytesToString(e.slice(o), a)
			};
		} else if (i.id === "APIC") {
			a = e[10];
			var m = {
				type: null,
				mime: null,
				description: null,
				data: null
			};
			for (o = 11, s = G.getEndpointOfBytes(e, 0, o) - o, m.mime = G.readBytesToString(e.slice(o), 0, s), m.type = ue.default[e[o + s + 1]] || "other", o += s + 2, s = 0, c = o;; c++) if (e[c] === 0) {
				s = c - o;
				break;
			}
			m.description = s === 0 ? null : G.readBytesToString(e.slice(o), a, s), o = G.skipPaddingZeros(e, o + s + 1), m.data = e.slice(o), r.value = m;
		} else if (i.id === "IPLS") a = e[10], r.value = G.readBytesToString(e.slice(11), a);
		else if (i.id === "OWNE") {
			a = e[10], o = 11, s = G.getEndpointOfBytes(e, a, o);
			var h = G.readBytesToISO8859(e.slice(o), s);
			o += s + 1;
			var g = G.readBytesToISO8859(e.slice(o), 8);
			o += 8, r.value = {
				pricePayed: h,
				dateOfPurch: g,
				seller: G.readBytesToString(e.slice(o), a)
			};
		}
		return r;
	}
}), J = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 });
	var n = 128;
	function parseV1Data(e) {
		if (!e || e.length < n) return !1;
		e = e.slice(e.length - n);
		var t = { version: {
			major: 1,
			minor: 0
		} };
		if (G.readBytesToUTF8(e, 3) !== "TAG") return !1;
		var r = /(^[\s0]+|[\s0]+$)/;
		return t.title = G.readBytesToUTF8(e.slice(3), 30).replace(r, ""), t.artist = G.readBytesToUTF8(e.slice(33), 30).replace(r, ""), t.album = G.readBytesToUTF8(e.slice(63), 30).replace(r, ""), t.year = G.readBytesToUTF8(e.slice(93), 4).replace(r, ""), e[125] === 0 ? (t.comments = G.readBytesToUTF8(e.slice(97), 28).replace(r, ""), t.version.minor = 1, t.track = e[126]) : t.comments = G.readBytesToUTF8(e.slice(97), 30).replace(r, ""), t.genre = W.default[e[127]] || "", t;
	}
	t.default = parseV1Data;
}), de = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 });
	function polyfill() {
		typeof Uint8Array == "function" && !Uint8Array.prototype.slice && Object.defineProperty(Uint8Array.prototype, "slice", { value: Array.prototype.slice });
	}
	t.default = polyfill;
}), Y = R(function(e, t) {
	var n = k && k.__assign || Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, r = k && k.__rest || function(e, t) {
		var n = {};
		for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
		if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && (n[r[i]] = e[r[i]]);
		return n;
	};
	Object.defineProperty(t, "__esModule", { value: !0 }), t.parseV1Tag = J.default, t.parseV2Tag = q.default, de.default();
	function parse(e) {
		var t = J.default(e), i = q.default(e);
		if (!i && !t) return !1;
		var a = { version: !1 }, o = i || a, s = o.version, c = r(o, ["version"]), l = t || a, u = l.version, d = r(l, ["version"]), f = n({ version: {
			v1: u,
			v2: s
		} }, d, c);
		return d.comments && (f.comments = [{ value: d.comments }].concat(c && c.comments ? c.comments : [])), f;
	}
	t.parse = parse;
}), fe = Y.parseV1Tag, X = Y.parseV2Tag, Z = q.calcTagSize, pe = R(function(e, t) {
	Object.defineProperty(t, "__esModule", { value: !0 });
	function convertFileToBuffer(e) {
		var t = new FileReader(), n, r, i = new Promise(function(e, t) {
			n = e, r = t;
		});
		return t.onload = function() {
			return n(new Uint8Array(t.result));
		}, t.onerror = function(e) {
			return r(e);
		}, t.readAsArrayBuffer(e), i;
	}
	t.convertFileToBuffer = convertFileToBuffer;
	function fetchFileAsBuffer(e) {
		if (!e) throw Error("Argument should be valid url string.");
		var t, n, r = new Promise(function(e, r) {
			t = e, n = r;
		}), i = new XMLHttpRequest();
		return i.open("GET", e, !0), i.responseType = "arraybuffer", i.onload = function() {
			i.response ? t(new Uint8Array(i.response)) : n("Empty response or other exceptions.");
		}, i.onerror = function(e) {
			return n(e);
		}, i.send(), r;
	}
	t.fetchFileAsBuffer = fetchFileAsBuffer;
}).fetchFileAsBuffer;
//#endregion
//#region src/vendor/webamp-modern/skin/AudioMetadata.js
async function parseMetaData(e, t) {
	try {
		let n = e.file ? URL.createObjectURL(e.file) : e.filename;
		genMediaDuration(n).then((n) => {
			e.duration = n, t();
		}), genMetadata(e, n, t);
	} catch (e) {
		console.warn("ERROR:", e);
	}
}
async function genMetadata(e, t, n) {
	let r = await pe(t), i, a = X(r);
	i = a ? { ...a } : { ...fe(r) }, e.metadata = i, n();
	let o = 0;
	a && (o = 10, a.version.flags.xheader && (o += Z(r.slice(10, 14))), o += Z(r.slice(6, 10)));
	let s = [
		2.5,
		null,
		2,
		1
	], c = [
		0,
		3,
		2,
		1
	], l = [
		"stereo",
		"joint_stereo",
		"dual_channel",
		"mono"
	], u = {
		1: {
			0: 44100,
			1: 48e3,
			2: 32e3
		},
		2: {
			0: 22050,
			1: 24e3,
			2: 16e3
		},
		2.5: {
			0: 11025,
			1: 12e3,
			2: 8e3
		}
	};
	var d = r[o] << 24 | r[o + 1] << 16 | r[o + 2] << 8 | r[o + 3];
	let f = s[readBits(d, 11, 2)], p = c[readBits(d, 13, 2)];
	readBits(d, 15, 1);
	var m = readBits(d, 16, 4), h = readBits(d, 20, 2);
	let g = {
		1: {
			11: 32,
			12: 32,
			13: 32,
			21: 32,
			22: 8,
			23: 8
		},
		2: {
			11: 64,
			12: 48,
			13: 40,
			21: 48,
			22: 16,
			23: 16
		},
		3: {
			11: 96,
			12: 56,
			13: 48,
			21: 56,
			22: 24,
			23: 24
		},
		4: {
			11: 128,
			12: 64,
			13: 56,
			21: 64,
			22: 32,
			23: 32
		},
		5: {
			11: 160,
			12: 80,
			13: 64,
			21: 80,
			22: 40,
			23: 40
		},
		6: {
			11: 192,
			12: 96,
			13: 80,
			21: 96,
			22: 48,
			23: 48
		},
		7: {
			11: 224,
			12: 112,
			13: 96,
			21: 112,
			22: 56,
			23: 56
		},
		8: {
			11: 256,
			12: 128,
			13: 112,
			21: 128,
			22: 64,
			23: 64
		},
		9: {
			11: 288,
			12: 160,
			13: 128,
			21: 144,
			22: 80,
			23: 80
		},
		10: {
			11: 320,
			12: 192,
			13: 160,
			21: 160,
			22: 96,
			23: 96
		},
		11: {
			11: 352,
			12: 224,
			13: 192,
			21: 176,
			22: 112,
			23: 112
		},
		12: {
			11: 384,
			12: 256,
			13: 224,
			21: 192,
			22: 128,
			23: 128
		},
		13: {
			11: 416,
			12: 320,
			13: 256,
			21: 224,
			22: 144,
			23: 144
		},
		14: {
			11: 448,
			12: 384,
			13: 320,
			21: 256,
			22: 160,
			23: 160
		}
	}, _ = `${Math.floor(f)}${p}`;
	i.bitrate = g[m][_], i.sampleRate = u[f][h];
	let v = readBits(d, 24, 2);
	i.channelMode = l[v], e.metadata = i, n();
}
function readBits(e, t, n) {
	return (e & 4294967295 >>> 32 - n << 32 - n - t) >>> 32 - n - t;
}
function genMediaDuration(e) {
	return A(typeof e == "string", "Attempted to get the duration of media file without passing a url"), new Promise((t, n) => {
		let r = document.createElement("audio");
		r.crossOrigin = "anonymous";
		let durationChange = () => {
			t(r.duration), r.removeEventListener("durationchange", durationChange), r.src = "";
		};
		r.addEventListener("durationchange", durationChange), r.addEventListener("error", (e) => {
			n(e);
		}), r.src = e;
	});
}
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/PlayList.js
var PlEdit = class {
	constructor(e, t = null) {
		this._tracks = [], this._trackCounter = 1, this._currentIndex = -1, this._selection = [], this._repeat = 0, this._eventListener = new D(), this._provider = null, this._shuffleChanged = () => {
			let e = this._shuffleAttrib.getdata();
			this._shuffle = T(e), console.log("shuffle:", this._shuffle);
		}, this._repeatChanged = () => {
			let e = this._repeatAttrib.getdata();
			this._repeat = C(e), console.log("repeat:", this._repeat);
		}, this._uiRoot = e, this._listenShuffleRepeat(), t && this.setProvider(t);
	}
	setProvider(e) {
		this._provider = e, e && e.onChange(() => this.trigger("trackchange")), this.trigger("trackchange");
	}
	init() {
		this._shuffleChanged(), this._repeatChanged();
	}
	on(e, t) {
		return this._eventListener.on(e, t);
	}
	trigger(e, ...t) {
		this._eventListener.trigger(e, ...t);
	}
	off(e, t) {
		this._eventListener.off(e, t);
	}
	_listenShuffleRepeat() {
		let e = this._uiRoot.CONFIG.getitem("{45F3F7C1-A6F3-4EE6-A15E-125E92FC3F8D}");
		this._shuffleAttrib = e.getattribute("shuffle"), this._repeatAttrib = e.getattribute("repeat"), this._shuffleAttrib.on("datachanged", this._shuffleChanged), this._repeatAttrib.on("datachanged", this._repeatChanged);
	}
	getnumtracks() {
		return this._provider ? this._provider.getNumTracks() : this._tracks.length;
	}
	getcurrentindex() {
		return this._provider ? this._provider.getCurrentIndex() : this._currentIndex;
	}
	getnumselectedtracks() {
		return this._selection.length;
	}
	getnextselectedtrack(e) {
		let t = this._selection.indexOf(e);
		return this._selection[t + 1];
	}
	showcurrentlyplayingtrack() {}
	showtrack(e) {}
	addTrack(e) {
		e.id ||= (this._trackCounter++, this._trackCounter), this._tracks.push(e), this._tracks.length == 1 && this.playtrack(0), this.trigger("trackchange"), e.metadata || parseMetaData(e, () => {
			this.trigger("trackchange");
		});
	}
	enqueuefile(e) {
		let t = { filename: e };
		this.addTrack(t);
	}
	clear() {
		this._selection = [], this._tracks = [], this._currentIndex = null;
	}
	removetrack(e) {}
	swaptracks(e, t) {}
	moveup(e) {}
	movedown(e) {}
	moveto(e, t) {}
	currentTrack() {
		if (this._provider) {
			let e = this._provider.getCurrentIndex();
			return e < 0 ? null : {
				filename: "",
				title: this._provider.getTitle(e)
			};
		}
		return this._currentIndex < 0 ? null : this._tracks[this._currentIndex];
	}
	playtrack(e) {
		if (this._provider) {
			this._provider.playTrack(e);
			return;
		}
		this._currentIndex = e;
		let t = this._tracks[e], n = t.file ? URL.createObjectURL(t.file) : t.filename;
		this._uiRoot.audio.setAudioSource(n), this.trigger("trackchange");
	}
	getCurrentTrackTitle() {
		let e = this.getcurrentindex();
		return e == null || e < 0 || e >= this.getnumtracks() ? "" : this.gettitle(e);
	}
	getrating(e) {
		return this._tracks[e].rating ?? 0;
	}
	setrating(e, t) {
		this._tracks[e].rating = t;
	}
	gettitle(e) {
		if (this._provider) return this._provider.getTitle(e) ?? "";
		let t = this._tracks[e];
		return t.metadata ? `${t.metadata.artist} - ${t.metadata.title}` : this._tracks[e].filename.split("/").pop();
	}
	getlength(e) {
		return this._provider ? this._provider.getLength(e) ?? "" : ae(this._tracks[e].duration || 0);
	}
	onpleditmodified() {}
};
PlEdit.GUID = "345beebc49210229b66cbe90d9799aa4", PlEdit.guid = "{345BEEBC-0229-4921-90BE-6CB6A49A79D9}";
var PlDir = class {
	showcurrentlyplayingentry() {}
	refresh() {}
	renameitem(e, t) {}
	enqueueitem(e) {}
	playitem(e) {}
};
PlDir.GUID = "61a7abad41f67d7980e1d0b1f4a40386";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/File.js
var File = class extends u {
	constructor(e) {
		super(), this._uiRoot = e;
	}
	load(e) {
		this._path = e;
	}
	exists() {
		return !1;
	}
	getsize() {
		let e = new XMLHttpRequest();
		return e.open("GET", this._path, !1), e.send(null), Number(e.getResponseHeader("content-length"));
	}
};
File.GUID = "836f8b2e4db4e0d10a0d7f93d1dcc804";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/XmlDoc.js
var XmlDoc = class extends File {};
XmlDoc.GUID = "417ffb694be8987f96d9878d68c8ee5e";
//#endregion
//#region src/vendor/webamp-modern/skin/resolver.js
var me = [
	u,
	n,
	ee,
	c,
	v,
	U,
	ie,
	Region,
	ce,
	te,
	l,
	o,
	m,
	p,
	oe,
	t,
	se,
	h,
	LayoutStatus,
	y,
	w,
	H,
	g,
	MakiMap,
	MakiList,
	BitList,
	GroupList,
	CfgGroup,
	TabSheet,
	MouseRedir,
	DropDownList,
	Edit,
	Browser,
	Wac,
	QueryList,
	GuiList,
	GuiTree,
	TreeItem,
	CheckBox,
	r,
	z,
	S,
	re,
	PlEdit,
	PlDir,
	j,
	s,
	E,
	le,
	f,
	File,
	XmlDoc
], Q = {};
for (let e of me) {
	if (e.GUID == null) throw Error("Expected GUID on class.");
	Q[e.GUID.toLowerCase()] = e;
}
function classResolver(e) {
	let t = Q[e];
	if (t == null) throw Error(`Unresolvable class "${x(e).name}" (guid: ${e})`);
	return t;
}
//#endregion
//#region src/vendor/webamp-modern/maki/interpreter.js
async function interpret(e, t, n, r, i, a) {
	let o = new Interpreter(t, r, i, a);
	o.stack = n;
	try {
		return await o.interpret(e);
	} catch (e) {
		console.warn(`Stopped executing ${t.maki_id}.
`, e);
	}
}
function validateVariable(e) {
	if (e.type === "OBJECT" && typeof e.value != "object" && e.value !== 0) debugger;
}
var Interpreter = class {
	constructor(e, t, n, r) {
		this.debug = !1;
		let { commands: i, methods: a, variables: o, classes: s, maki_id: c } = e;
		this.classResolver = t, this.commands = i, this.methods = a, this.variables = o, this.classes = s, this.maki_id = c, this.eventName = n, this._uiRoot = r, this.stack = [], this.callStack = [];
	}
	push(e) {
		this.stack.push(e);
	}
	async interpret(e) {
		for (let e of this.variables) validateVariable(e);
		let t = e;
		for (; t < this.commands.length;) {
			let e = this.commands[t];
			switch (this.debug && console.log(e), e.opcode) {
				case 1: {
					let t = e.arg;
					this.push(this.variables[t]);
					break;
				}
				case 2:
					this.stack.pop();
					break;
				case 3: {
					let t = this.stack.pop(), n = e.arg, r = this.variables[n];
					A(t != null, `Assigning from invalid object into: ${r.value}. #${this.maki_id}. @${this.eventName} 
 (see next error)`), A(typeof t.value == typeof r.value || r.value == null, `Assigned from one type to a different type ${typeof t.value}, ${typeof r.value}. #${this.maki_id}`), r.value = t.value;
					break;
				}
				case 8: {
					let e = this.stack.pop(), t = this.stack.pop(), n;
					n = e.type == "STRING" && t.type == "STRING" ? M.newInt(t.value.toLowerCase() == e.value.toLowerCase()) : M.newInt(t.value === e.value), this.push(n);
					break;
				}
				case 9: {
					let e = this.stack.pop(), t = this.stack.pop(), n;
					n = e.type == "STRING" && t.type == "STRING" ? M.newInt(t.value.toLowerCase() != e.value.toLowerCase()) : M.newInt(t.value !== e.value), this.push(n);
					break;
				}
				case 10: {
					let e = this.stack.pop(), t = this.stack.pop();
					if (!(e.type == t.type && [
						"INT",
						"FLOAT",
						"DOUBLE",
						"STRING"
					].includes(e.type))) {
						switch (e.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.10a");
						}
						switch (t.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.10b");
						}
					}
					this.debug && console.log(`${t.value} > ${e.value}`), this.push(M.newInt(t.value > e.value));
					break;
				}
				case 11: {
					let e = this.stack.pop(), t = this.stack.pop();
					if (!(e.type == t.type && [
						"INT",
						"FLOAT",
						"DOUBLE",
						"STRING"
					].includes(e.type))) {
						switch (e.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.11a. " + this.maki_id);
						}
						switch (t.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.11b");
						}
					}
					this.debug && console.log(`${t.value} >= ${e.value}`), this.push(M.newInt(t.value >= e.value));
					break;
				}
				case 12: {
					let e = this.stack.pop(), t = this.stack.pop();
					if (!(e.type == t.type && [
						"INT",
						"FLOAT",
						"DOUBLE",
						"STRING"
					].includes(e.type))) {
						switch (e.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.12a");
						}
						switch (t.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.12b");
						}
					}
					this.debug && console.log(`${t.value} < ${e.value}`), this.push(M.newInt(t.value < e.value));
					break;
				}
				case 13: {
					let e = this.stack.pop(), t = this.stack.pop();
					if (!(e.type == t.type && [
						"INT",
						"FLOAT",
						"DOUBLE",
						"STRING"
					].includes(e.type))) {
						switch (e.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.13a");
						}
						switch (t.type) {
							case "STRING":
							case "OBJECT":
							case "BOOLEAN":
							case "NULL": throw Error("Tried to add non-numbers.13b");
						}
					}
					this.debug && console.log(`${t.value} < ${e.value}`), this.push(M.newInt(t.value <= e.value));
					break;
				}
				case 16:
					if (this.stack.pop().value) break;
					t = e.arg - 1;
					break;
				case 17:
					if (!this.stack.pop().value) break;
					t = e.arg - 1;
					break;
				case 18:
					t = e.arg - 1;
					break;
				case 24:
				case 112: {
					let t = e.arg, n = this.methods[t], r = n.name, i = n.returnType, a = n.typeOffset;
					r = r.toLowerCase();
					let o = this.classes[a], s = this.classResolver(o);
					if (!s) throw Error("Need to add a missing class to runtime");
					if (!s.prototype[r]) throw Error(`Need to add missing method: ${s.name}.${r}: ${i}`);
					let c = s.prototype[r].length, l = ne(o, r);
					r.toLowerCase() != "init" && L(c === (l.parameters.length ?? 0), `Arg count mismatch. Expected ${l.parameters.length ?? 0} arguments, but found ${c} for ${s.name}.${r}`);
					let u = [];
					for (; c--;) {
						let e = this.stack.pop();
						u.push(e.value);
					}
					let d = this.stack.pop();
					L((d.type === "OBJECT" && typeof d.value) === "object" && d.value != null, `Guru Meditation: Tried to call method ${s.name}.${r} on null object. #${this.maki_id}`);
					let f = null;
					try {
						let e = d.value[r];
						e.constructor.name === "AsyncFunction" ? (console.log("calling fun type:", e.constructor.name, `@${s.name}.${r}`), f = await d.value[r](...u)) : f = d.value[r](...u);
					} catch (e) {
						let t = JSON.stringify(u).replace("[", "").replace("]", "");
						console.warn(`error call: ${s.name}.${r}(${t})`, `err: ${e.message} obj:`, d), f = null;
					}
					if (f === void 0 && i !== "NULL") throw Error(`Did not expect ${s.name}.${r}: ${i} to return undefined`);
					f === null && (f = this.variables[1]), i === "BOOLEAN" && (L(typeof f == "boolean", `${s.name}.${r} should return a boolean, but "${JSON.stringify(f)}"`), f = +!!f), i === "OBJECT" && L(typeof f == "object", `Expected the returned value of ${s.name}.${r} to be an object, but it was "${f}"`), this.debug && console.log(`Calling method ${r}`), this.push({
						type: i,
						value: f
					});
					break;
				}
				case 25:
					this.callStack.push(t), t = e.arg - 1;
					break;
				case 33:
					t = this.callStack.pop();
					break;
				case 40: break;
				case 48: {
					let e = this.stack.pop(), t = this.stack.pop();
					if (e.type == "OBJECT" && t.type, t == null) {
						let n = e.value instanceof u ? e.value.getId() : "!noid";
						console.log(n, ":=", "dest:", t, "src:", e), console.warn("Hey, can't move: b.value=a.value with b==nul;a=", e);
					}
					t != null && (t.value = e.value), this.push(e);
					break;
				}
				case 56: {
					let e = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to increment a non-number.");
					}
					let t = e.value;
					e.value = t + 1, this.push({
						type: e.type,
						value: t
					});
					break;
				}
				case 57: {
					let e = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to decrement a non-number.");
					}
					let t = e.value;
					e.value = t - 1, this.push({
						type: e.type,
						value: t
					});
					break;
				}
				case 58: {
					let e = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to increment a non-number.");
					}
					e.value++, this.push(e);
					break;
				}
				case 59: {
					let e = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to increment a non-number.");
					}
					e.value--, this.push(e);
					break;
				}
				case 64: {
					let e = this.stack.pop(), t = this.stack.pop(), n = e.value, r = t.value;
					switch (e.type) {
						case "BOOLEAN":
							n = n == 0 ? 0 : 1;
							break;
						case "OBJECT":
						case "NULL": throw Error(`Tried to add non-numbers: ${t.type} + ${e.type}.64a`);
						case "STRING": if (t.type !== "STRING") throw Error(`Tried to add string and a non-string: ${t.type} + ${e.type}.`);
					}
					switch (t.type) {
						case "OBJECT": throw Error(`Tried to add non-numbers.64b.A:${e.type}=${e.value}B:${t.type}=${t.value}`);
						case "BOOLEAN": r = r == 0 ? 0 : 1;
					}
					this.push({
						type: e.type,
						value: r + n
					});
					break;
				}
				case 65: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.65a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.65b");
					}
					this.push({
						type: e.type,
						value: t.value - e.value
					});
					break;
				}
				case 66: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.66a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.66b");
					}
					this.push({
						type: e.type,
						value: t.value * e.value
					});
					break;
				}
				case 67: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.67a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN": throw Error("Tried to add non-numbers.67b");
					}
					this.push({
						type: e.type,
						value: t.value / e.value
					});
					break;
				}
				case 68: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.68a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN": throw Error("Tried to add non-numbers.68b");
						case "FLOAT":
						case "DOUBLE":
							let n = Math.floor(t.value) % e.value;
							this.push({
								type: e.type,
								value: n
							});
							break;
						case "INT": this.push({
							type: e.type,
							value: t.value % e.value
						});
					}
					break;
				}
				case 72:
					A(!1, "Unimplimented & operator");
					break;
				case 73:
					A(!1, "Unimplimented | operator");
					break;
				case 74: {
					let e = this.stack.pop();
					this.push(M.newInt(!e.value));
					break;
				}
				case 76: {
					let e = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to add non-numbers.76a");
					}
					this.push({
						type: e.type,
						value: -e.value
					});
					break;
				}
				case 80: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "NULL": throw Error("Tried to add non-numbers.80a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "NULL": throw Error("Tried to add non-numbers.80b");
					}
					t.value && e.value ? this.push(e) : this.push(t);
					break;
				}
				case 81: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "NULL": throw Error("Tried to add non-numbers.81a :" + e.type);
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "NULL": throw Error("Tried to add non-numbers.81b");
					}
					t.value ? this.push(t) : this.push(e);
					break;
				}
				case 88: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to left shift non-numbers.88a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN": throw Error("Tried to left shift non-numbers.88b");
						case "FLOAT":
						case "DOUBLE":
						case "INT": this.push({
							type: e.type,
							value: t.value << e.value
						});
					}
					break;
				}
				case 89: {
					let e = this.stack.pop(), t = this.stack.pop();
					switch (e.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN":
						case "NULL": throw Error("Tried to right shift non-numbers.89a");
					}
					switch (t.type) {
						case "STRING":
						case "OBJECT":
						case "BOOLEAN": throw Error("Tried to right shift non-numbers.89b");
						case "FLOAT":
						case "DOUBLE":
						case "INT": this.push({
							type: e.type,
							value: t.value >> e.value
						});
					}
					break;
				}
				case 96: {
					let t = e.arg, n = this.classes[t], r = new (this.classResolver(n))(this._uiRoot);
					this.push({
						type: "OBJECT",
						value: r
					});
					break;
				}
				case 104: {
					let t = this.stack.pop(), n = this.stack.pop()?.value;
					if (typeof n != "object" || !n) throw Error("Member variable access on a non-object");
					let r = `${this.maki_id}:${String(t.value).toLowerCase()}`, i = n.__makiMembers;
					i || (i = /* @__PURE__ */ new Map(), n.__makiMembers = i);
					let a = i.get(r);
					if (!a) {
						let t = {
							2: "INT",
							3: "FLOAT",
							4: "DOUBLE",
							5: "BOOLEAN",
							6: "STRING"
						}[e.arg];
						a = {
							type: t ?? "OBJECT",
							value: t === "STRING" ? "" : t ? 0 : null
						}, i.set(r, a);
					}
					this.push(a);
					break;
				}
				case 97:
					this.stack.pop();
					break;
				default: throw Error(`Unhandled opcode ${e.opcode}`);
			}
			t++;
		}
	}
}, Vm = class {
	constructor(e) {
		this._scripts = [], this._uiRoot = e;
	}
	dispatch1(e, t, n = []) {
		let r = [...n].reverse(), i = 0;
		for (let n of this._scripts) for (let a of n.bindings) n.methods[a.methodOffset].name === t && (n.variables[a.variableOffset].value === e || n.variables[a.variableOffset].isClass && n.variables[a.variableOffset].members.find((t) => n.variables[t].value == e)) && (t.startsWith("onleftbu") && console.log("EXEC EVENT:", t, a), this.interpret(n, a.commandOffset, t, r), i++);
		return t.startsWith("onleft") && console.log("dispatched", i, "x :", t, e._id), 0;
	}
	async dispatch(e, t, n = []) {
		let r = [...n].reverse(), i = 0;
		for (let n of this._scripts) for (let a of n.bindings) if (n.methods[a.methodOffset].name === t) {
			let o = !1, s = n.variables[a.variableOffset];
			s.isClass ? s.members.find((t) => n.variables[t].value == e) != null && (s.value = e, o = !0) : s.type === "OBJECT" && s.value === e && (o = !0), o && (await this.interpret(n, a.commandOffset, t, r), i++);
		}
		return i;
	}
	addScript(e) {
		let t = this._scripts.length;
		return this._scripts.push(e), t;
	}
	async interpret(e, t, n, r) {
		await interpret(t, e, r, classResolver, n, this._uiRoot);
	}
}, he = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==", ImageManager = class {
	constructor(e) {
		this._imagePlaceholder = !1, this._urlCache = {}, this._imgCache = {}, this._uiRoot = e;
	}
	dispose() {}
	async getUrl(e) {
		if (!this._urlCache.hasOwnProperty(e)) {
			let t = await this.getBlob(e);
			if (t == null) return this._urlCache[e] = null, null;
			let n = await getUrlFromBlob(t);
			this._urlCache[e] = n;
		}
		return this._urlCache[e];
	}
	getCachedUrl(e) {
		return this._urlCache[e];
	}
	async getBlob(e) {
		return await this._uiRoot.getFileAsBlob(e);
	}
	async loadUniquePaths() {
		let e = [], t = [];
		for (let n of Object.values(this._uiRoot.getBitmaps())) n.loaded() || t.includes(n.getFile()) || (t.push(n.getFile()), e.push(n));
		let n = this._uiRoot.getFonts();
		for (let r = n.length - 1; r >= 0; r--) {
			let i = n[r];
			i instanceof B && !i.useExternalBitmap() && !i.getImg() && (t.includes(i.getFile()) || (t.push(i.getFile()), e.push(i)));
		}
		return await Promise.all(t.map(async (e) => await this.getImage(e))), e;
	}
	async ensureBitmapsLoaded() {
		let e = await this.loadUniquePaths();
		return await Promise.all(e.map(async (e) => e.ensureImageLoaded(this)));
	}
	async getImage(e) {
		if (!this._imgCache.hasOwnProperty(e)) {
			let t = await this.getUrl(e);
			if (t != null) {
				let n = await loadImage(t);
				this._imgCache[e] = n;
			} else if (this._imagePlaceholder) {
				let t = await loadImage(he);
				this._imgCache[e] = t;
			} else this._imgCache[e] = null;
		}
		return this._imgCache[e];
	}
};
async function getUrlFromBlob(e) {
	return new Promise((t, n) => {
		let r = new FileReader();
		r.onload = function(e) {
			t(e.target.result);
		}, r.onerror = n, r.readAsDataURL(e);
	});
}
async function loadImage(e) {
	return new Promise((t, n) => {
		let r = new Image();
		r.addEventListener("load", () => {
			t(r);
		}), r.addEventListener("error", (t) => {
			console.warn("cant load empty image:", e), n(t);
		}), r.src = e;
	});
}
//#endregion
//#region src/vendor/webamp-modern/UIRoot.js
var UIRoot = class {
	constructor(e = "ui-root", t = {}) {
		this._avss = [], this._div = document.createElement("div"), this._mousePos = {
			x: 0,
			y: 0
		}, this._bitmaps = {}, this._fonts = [], this._colors = [], this._elementAlias = {}, this._dimensions = {}, this._groupDefs = {}, this._gammaSets = /* @__PURE__ */ new Map(), this._gammaNames = {}, this._dummyGammaGroup = null, this._activeGammaSetName = "", this._xuiGroupDefs = {}, this._activeGammaSet = [], this._containers = [], this._systemObjects = [], this._buckets = [], this._bucketEntries = {}, this._xFades = [], this._input = document.createElement("input"), this._skinInfo = {}, this._skin = {
			name: "",
			url: ""
		}, this._skins = [], this._eventListener = new D(), this._additionalCss = [], this._objects = [], this._inputChanged = () => {
			this.playlist.clear();
			for (var e = 0; e < this._input.files.length; e++) {
				let t = {
					filename: this._input.files[e].name,
					file: this._input.files[e]
				};
				this.playlist.addTrack(t);
			}
			this.audio.play();
		}, this._lastPointer = null, this._pointerListener = (e) => {
			this._lastPointer = {
				x: e.clientX,
				y: e.clientY
			};
		}, this._pointerListening = !1, this._desktop = null, this._assetsBase = "assets/", this._onAction = null, this.holdWindow = null, this.onLayoutSnapAdjustChanged = null, this.releaseWindow = null, this._isActionActive = null, this._id = e, this.audio = t.audio ?? d(), this._desktop = t.desktop ?? null, this._assetsBase = t.assetsBase ?? "assets/", t.privateDefaults && b.setDefaults(t.privateDefaults), this._onAction = t.onAction ?? null, this._isActionActive = t.isActionActive ?? null, this.holdWindow = t.holdWindow ?? null, this.releaseWindow = t.releaseWindow ?? null, this.onLayoutSnapAdjustChanged = t.onLayoutSnapAdjustChanged ?? null, this._input.type = "file", this._input.setAttribute("multiple", "true"), this._input.onchange = this._inputChanged, this._imageManager = new ImageManager(this), this._config = new n(this), this._application = new f(this), this._winampConfig = new v(this), this.playlist = new PlEdit(this, t.playlistProvider ?? null), this.vm = new Vm(this), this.setlistenMouseMove(!0);
	}
	getId() {
		return this._id;
	}
	guid2alias(e) {
		return e.includes(":") && (e = e.split(":")[1]), e = e.toLowerCase(), {
			"{0000000a-000c-0010-ff7b-01014263450c}": "vis",
			"{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}": "pl",
			"{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}": "ml",
			"{7383a6fb-1d01-413b-a99a-7e6f655f4591}": "con",
			"{7a8b2d76-9531-43b9-91a1-ac455a7c8242}": "lir",
			"{a3ef47bd-39eb-435a-9fb3-a5d87f6f17a5}": "dl",
			"{f0816d7b-fffc-4343-80f2-e8199aa15cc3}": "video"
		}[e] || e;
	}
	on(e, t) {
		return this._eventListener.on(e, t);
	}
	trigger(e, ...t) {
		this._eventListener.trigger(e, ...t);
	}
	off(e, t) {
		this._eventListener.off(e, t);
	}
	reset() {
		this.deinitSkin(), this.dispose(), this._bitmaps = {}, this._imageManager.dispose(), this._imageManager = new ImageManager(this), this._fonts = [], this._colors = [], this._groupDefs = {}, this._gammaSets = /* @__PURE__ */ new Map(), this._xuiGroupDefs = {}, this._activeGammaSet = [], this._containers = [], this._systemObjects = [], this._gammaNames = {}, this._buckets = [], this._bucketEntries = {}, this._xFades = [], this._additionalCss = [], F(this._div), this._objects = [];
	}
	destroy() {
		this._pointerListening &&= (window.document.removeEventListener("pointermove", this._pointerListener), window.document.removeEventListener("pointerdown", this._pointerListener), !1), this.reset(), document.getElementById(`${this._id}-bitmap-css`)?.remove(), this._div.remove();
	}
	deinitSkin() {
		for (let e of this._containers) e.dispose();
		for (let e of this._systemObjects) e.dispose();
	}
	getRootDiv() {
		return this._div;
	}
	getImageManager() {
		return this._imageManager;
	}
	setImageManager(e) {
		this._imageManager = e;
	}
	addObject(e) {
		this._objects.push(e);
	}
	addBitmap(e) {
		let t = e.getId().toLowerCase();
		this._bitmaps[t] = e;
	}
	getBitmap(e) {
		let t = e.toLowerCase();
		this.hasBitmap(t) || (t = this._elementAlias[t]);
		let n = this._bitmaps[t];
		return A(n != null, `Could not find bitmap with id ${e}.`), n;
	}
	removeBitmap(e) {
		delete this._bitmaps[e.toLowerCase()];
	}
	getBitmaps() {
		return this._bitmaps;
	}
	hasBitmapFilepath(e) {
		for (let t of Object.values(this._bitmaps)) if (t.getFile() == e) return !0;
		return !1;
	}
	hasBitmap(e) {
		let t = e.toLowerCase();
		return !!this._bitmaps[t];
	}
	addFont(e) {
		this._fonts.push(e);
	}
	getFont(e) {
		let t = P(this._fonts, (t) => t.getId().toLowerCase() === e.toLowerCase());
		return t ?? console.warn(`Could not find true type font with id ${e}.`), t ?? null;
	}
	getFonts() {
		return this._fonts;
	}
	addColor(e) {
		e.setResolver((e) => this.findColor(e)), this._colors.push(e);
	}
	findColor(e) {
		let t = e.toLowerCase();
		return P(this._colors, (e) => e._id.toLowerCase() === t) ?? null;
	}
	getSkinPlaylistFont() {
		let visit = (e) => {
			if (!e) return null;
			if (e.name?.toLowerCase() === "playlistplus" && e.attributes?.font) return {
				font: e.attributes.font,
				fontsize: Number(e.attributes.fontsize) || 0,
				linespacing: Number(e.attributes.linespacing) || 0
			};
			for (let t of e.children ?? []) {
				let e = visit(t);
				if (e) return e;
			}
			return null;
		};
		for (let e of Object.values(this._groupDefs)) {
			let t = visit(e);
			if (t) return t;
		}
		return null;
	}
	addAlias(e, t) {
		this._elementAlias[e.toLowerCase()] = t.toLowerCase();
	}
	getAlias(e) {
		return this._elementAlias[e.toLowerCase()];
	}
	addDimension(e, t) {
		this._dimensions[e] = t;
	}
	addWidth(e, t) {
		let n = this.getBitmap(t);
		n && this.addDimension(e, n.getWidth());
	}
	addHeight(e, t) {
		let n = this.getBitmap(t);
		n && this.addDimension(e, n.getHeight());
	}
	getColor(e) {
		let t = e.toLowerCase(), n = P(this._colors, (e) => e._id.toLowerCase() === t);
		return A(n != null, `Could not find color with id ${e}.`), n;
	}
	addComponentBucket(e) {
		this._buckets.push(e);
	}
	addBucketEntry(e, t) {
		this._bucketEntries[e] || (this._bucketEntries[e] = []), this._bucketEntries[e].push(t);
	}
	getBucketEntries(e) {
		return this._bucketEntries[e] || [];
	}
	addXFade(e) {
		this._xFades.push(e);
	}
	getXFades() {
		return this._xFades;
	}
	addGroupDef(e) {
		let t = e.attributes.id.toLowerCase();
		this._groupDefs[t] = e, e.attributes.xuitag && this.addXuitagGroupDefId(e.attributes.xuitag, t);
	}
	addXuitagGroupDefId(e, t) {
		this._xuiGroupDefs[e.toLowerCase()] = t.toLowerCase();
	}
	getGroupDef(e) {
		if (!e) return null;
		let t = e.toLowerCase();
		return this._groupDefs[t];
	}
	addContainers(e) {
		return this._containers.push(e), e;
	}
	getContainers() {
		return this._containers;
	}
	iterContainers(e) {
		for (let t of this._containers) if (e(t)) return t;
	}
	findContainer(e) {
		return this.iterContainers((t) => t.hasId(e));
	}
	addGammaSet(e, t) {
		let n = e.toLowerCase();
		this._gammaNames[n] = e, this._gammaSets.set(n, t);
	}
	enableGammaSet(e) {
		if (e) {
			console.log(`Enabling gammaset: '${e}'`);
			let t = this._gammaSets.get(e.toLowerCase());
			A(t != null, `Could not find gammaset for id "${e}" from set of ${Array.from(this._gammaSets.keys()).join(", ")}`), this._activeGammaSetName = e, this._activeGammaSet = t || [], b.setPrivateString(this.getSkinName(), "_gammagroup_", e);
		}
		this.trigger("colorthemechanged", e || ""), this._setCssVars();
	}
	enableDefaultGammaSet() {
		let e = performance.now(), t = Array.from(this._gammaSets.keys())[0] || "", n = b.getPrivateString(this.getSkinName(), "_gammagroup_", t);
		this.enableGammaSet(n);
		let r = performance.now();
		console.log(`Loading initial gamma took: ${(r - e) / 1e3}s`);
	}
	_getGammaGroup(e) {
		if (!e) return this._getGammaGroupDummy();
		let t = e.toLowerCase();
		return P(this._activeGammaSet, (e) => e.getId().toLowerCase() === t) ?? this._getGammaGroupDummy();
	}
	_getGammaGroupDummy() {
		return this._dummyGammaGroup || (this._dummyGammaGroup = new I(), this._dummyGammaGroup.setXmlAttributes({
			id: "dummy",
			value: "0,0,0"
		})), this._dummyGammaGroup;
	}
	_getBitmapAliases() {
		let e = {};
		for (let [t, n] of Object.entries(this._elementAlias)) this.hasBitmap(n) && (e[n] || (e[n] = []), e[n].push(t));
		return e;
	}
	async _setCssVars() {
		let e = [], t = this._getBitmapAliases(), maybeBitmapAliases = (n) => {
			let r = t[n.getId().toLowerCase()];
			if (r != null) for (let t of r) e.push(`${a(t)}: var(${n.getCSSVar()});`);
		}, n = this._fonts.filter((e) => e instanceof B && !e.useExternalBitmap());
		for (let t of [...Object.values(this._bitmaps), ...n]) e.push(await t.getGammaTransformedUrl(this)), maybeBitmapAliases(t);
		for (let t of this._colors) {
			let n = t.getGammaGroup(), r = this._getGammaGroup(n).transformColor(t.getValue());
			e.push(`  ${t.getCSSVar()}: ${r};`);
		}
		for (let [t, n] of Object.entries(this._dimensions)) e.push(`  --dim-${t}: ${n}px;`);
		for (let t of this._additionalCss) e.push(t);
		let r = `${this._id}-bitmap-css`, i = document.querySelector(`style#${r}`);
		i || (i = document.createElement("style"), i.setAttribute("type", "text/css"), i.setAttribute("id", r), document.head.appendChild(i)), i.textContent = `#${this._id} {${e.join("\n")}}`;
	}
	addAdditionalCss(e) {
		this._additionalCss.push(e);
	}
	getXuiElement(e) {
		let t = e.toLowerCase(), n = this._xuiGroupDefs[t];
		return this.getGroupDef(n);
	}
	loadTrueTypeFonts() {
		let e = [], t = this._fonts.filter((e) => e instanceof i);
		for (let n of t) n.hasUrl() && e.push(`@font-face {
        font-family: '${n.getId()}';
        src: url(${n.getBase64()}) format('truetype');
        font-weight: normal;
        font-style: normal;
      }`);
		let n = document.getElementById("truetypefont-css");
		n.textContent = e.join("\n");
	}
	dispatch(e, t, n) {
		if (!(this._onAction && this._onAction(e.toLowerCase(), t ?? null, n ?? null) === !0)) switch (e.toLowerCase()) {
			case "play":
				this.audio.play();
				break;
			case "pause":
				this.audio.pause();
				break;
			case "stop":
				this.audio.stop();
				break;
			case "next":
				this.next();
				break;
			case "prev":
				this.previous();
				break;
			case "eject":
				this.eject();
				break;
			case "vis_next":
			case "vis_prev":
			case "vis_f5":
				if (this._avss.length) for (let r of this._avss) r.dispatchAction(e, t, n);
				break;
			case "eq_toggle":
				this.eq_toggle(), this.trigger("eq_toggle");
				break;
			case "toggle":
				this.toggleContainer(t), this.trigger("toggle");
				break;
			case "close":
				this.closeContainer();
				break;
			case "menu":
				V(t, this).popatmouse();
				break;
			case "controlmenu":
				V("ControlMenu", this).popatmouse();
				break;
			case "sysmenu":
				V("Main", this).popatmouse();
				break;
			case "pe_add":
				V("Add", this).popatmouse();
				break;
			case "pe_rem":
				V("Remove", this).popatmouse();
				break;
			case "pe_sel":
				V("Select", this).popatmouse();
				break;
			case "pe_misc":
				V("MiscOpt", this).popatmouse();
				break;
			case "pe_list":
				V("Playlist", this).popatmouse();
				break;
			default: A(!1, `Unknown global action: ${e}`);
		}
	}
	getActionState(e, t, n = "") {
		if (e != null) {
			let r = this._isActionActive?.(e.toLowerCase(), t ?? null, n ?? null);
			if (r === !0 || r === !1) return r;
			switch (e.toLowerCase()) {
				case "eq_toggle": return this.audio.getEqEnabled();
				case "toggle": return this.getContainerVisible(t);
			}
		}
		return null;
	}
	next() {
		let e = this.playlist.getcurrentindex();
		e < this.playlist.getnumtracks() - 1 && this.playlist.playtrack(e + 1), this.audio.play();
	}
	previous() {
		let e = this.playlist.getcurrentindex();
		e > 0 && this.playlist.playtrack(e - 1), this.audio.play();
	}
	eject() {
		this._input.click();
	}
	eq_toggle() {
		this.audio.setEqEnabled(!this.audio.getEqEnabled());
	}
	toggleContainer(e) {
		let t = this.findContainer(e);
		A(t != null, `Can not toggle on unknown container: ${e}`), t.toggle();
	}
	getContainerVisible(e) {
		let t = this.findContainer(e);
		if (t != null) return t.getVisible();
	}
	closeContainer() {
		let e = document.activeElement.closest("container").getAttribute("id").toLowerCase();
		for (let t of this._containers) t._id.toLowerCase() == e && t.close();
	}
	draw() {
		this._div.setAttribute("id", this._id), this._div.style.imageRendering = "pixelated";
		for (let e of this.getContainers()) e.draw(), this._div.appendChild(e.getDiv());
	}
	dispose() {
		this._div.remove();
		for (let e of this._objects) e.dispose();
	}
	setlistenMouseMove(e) {
		let update = (e) => {
			this._mousePos = {
				x: e.pageX,
				y: e.pageY
			};
		};
		window.document[`${e ? "add" : "remove"}EventListener`]("mousemove", update);
	}
	getLastPointer() {
		return this._pointerListening || (this._pointerListening = !0, window.document.addEventListener("pointermove", this._pointerListener, { passive: !0 }), window.document.addEventListener("pointerdown", this._pointerListener, { passive: !0 })), this._lastPointer;
	}
	setZip(e) {
		this._zip = e, this._preferZip = e != null;
	}
	getZip() {
		return this._zip;
	}
	setPreferZip(e) {
		this._preferZip = e;
	}
	setSkinDir(e) {
		this._skinPath = e;
	}
	getSkinDir() {
		return this._skinPath;
	}
	setFileExtractor(e) {
		this._fileExtractor = e;
	}
	async getFileAsString(e) {
		return await this._fileExtractor.getFileAsString(e);
	}
	async getFileAsBytes(e) {
		return await this._fileExtractor.getFileAsBytes(e);
	}
	async getFileAsBlob(e) {
		return await this._fileExtractor.getFileAsBlob(e);
	}
	getSongInfoText() {
		let e = this.audio.getTrackInfo?.();
		if (e && (e.bitrate || e.sampleRate || e.channels)) {
			let t = [];
			return e.bitrate && t.push(`${Math.round(e.bitrate)}kbps`), e.channels && t.push(e.channels === 1 ? "mono" : e.channels === 2 ? "stereo" : `${e.channels}channels`), e.sampleRate && t.push(`${Math.floor(e.sampleRate / 1e3)}khz`), t.join(" ");
		}
		let t = this.playlist.currentTrack()?.metadata;
		return t && (t.bitrate || t.sampleRate) ? `${t.bitrate}kbps ${t.channelMode} ${Math.floor(t.sampleRate / 1e3)}khz` : "";
	}
	getAssetsBase() {
		return this._assetsBase.endsWith("/") ? this._assetsBase : `${this._assetsBase}/`;
	}
	getDesktopRect() {
		if (this._desktop) return typeof this._desktop == "function" ? this._desktop() : this._desktop;
		let e = this.getRootDiv()?.parentElement;
		if (e && e.clientWidth > 0 && e.clientHeight > 0) return {
			left: 0,
			top: 0,
			width: e.clientWidth,
			height: e.clientHeight
		};
		let t = document.documentElement;
		return {
			left: 0,
			top: 0,
			width: t.clientWidth,
			height: t.clientHeight
		};
	}
	addSystemObject(e) {
		this._systemObjects.push(e);
	}
	init() {
		this.logMessage("Initializing Maki...");
		for (let e of this.getContainers()) e.init();
		for (let e of this._systemObjects) e.init();
		this.playlist.init();
	}
	setSkinInfo(e) {
		let t = this._skinInfo.url;
		this._skinInfo = {
			...e,
			url: t
		};
	}
	setSkinUrl(e) {
		this._skinInfo.url = e;
	}
	getSkinUrl() {
		return this._skinInfo.url;
	}
	getSkinInfo() {
		return this._skinInfo;
	}
	getSkinName() {
		return this.getSkinInfo().name;
	}
	async switchSkin(e) {
		let t = this.getRootDiv().parentElement;
		this.reset(), t.appendChild(this.getRootDiv()), typeof e == "string" || e.name;
		let n = typeof e == "string" ? e : e.url;
		this.setSkinUrl(n);
		let r = !1, i = null, a = await N(n);
		if (a.length > 1 ? (await this._loadSkinPathToUiroot(n, null), r = !0, i = await O(a, n, this)) : i = a[0], i == null) throw Error("Skin not supported");
		this.SkinEngineClass = i;
		let o = new i(this);
		r || await this._loadSkinPathToUiroot(n, o), await o.buildUI();
	}
	async _loadSkinPathToUiroot(t, n) {
		let r, i;
		if (t.endsWith("/")) i = new _();
		else {
			if (r = await fetch(t), r.status == 404) throw Error("Skin does not exist");
			n != null && (i = n.getFileExtractor());
		}
		i ??= r.headers.get("content-type").startsWith("application/") ? new e() : new _(), await i.prepare(t, r), this.setFileExtractor(i);
	}
	set SkinEngineClass(e) {
		this._skinEngineClass = e;
	}
	get SkinEngineClass() {
		return this._skinEngineClass;
	}
	get APPLICATION() {
		return this._application;
	}
	get CONFIG() {
		return this._config;
	}
	get WINAMP_CONFIG() {
		return this._winampConfig;
	}
	logMessage(e) {
		this.trigger("onlogmessage", e);
	}
}, WebAmpModern = class {
	constructor(e, t = {}) {}
	switchSkin(e) {}
	playSong(e) {}
	onLogMessage(e) {}
}, ge = {
	skin: "assets/WinampModern566.wal",
	tracks: []
}, $ = 0, Webamp5 = class extends WebAmpModern {
	constructor(e, t = {}) {
		super(e, t), this._parent = e || document.body, this._options = {
			...ge,
			...t
		}, $++, this._uiRoot = new UIRoot(`ui-root-${$}`, {
			audio: this._options.audio,
			playlistProvider: this._options.playlistProvider,
			desktop: this._options.desktop,
			assetsBase: this._options.assetsBase,
			privateDefaults: this._options.privateDefaults,
			onAction: this._options.onAction,
			isActionActive: this._options.isActionActive,
			holdWindow: this._options.holdWindow,
			releaseWindow: this._options.releaseWindow,
			onLayoutSnapAdjustChanged: this._options.onLayoutSnapAdjustChanged
		}), e.appendChild(this._uiRoot.getRootDiv()), this._ready = this.switchSkin(this._options.skin);
		for (let e of this._options.tracks) this._uiRoot.playlist.enqueuefile(e);
	}
	ready() {
		return this._ready;
	}
	getUIRoot() {
		return this._uiRoot;
	}
	dispose() {
		this._uiRoot.destroy();
	}
	async switchSkin(e) {
		let t = typeof Blob < "u" && e instanceof Blob, n = t ? URL.createObjectURL(e) : e;
		try {
			await this._switchSkinPath(n, t);
		} finally {
			t && URL.revokeObjectURL(n);
		}
		this._applyContainerFilter();
	}
	_applyContainerFilter() {
		let e = this._options.containers;
		if (!e) return;
		let t = e.map((e) => e.toLowerCase());
		for (let e of this._uiRoot.getContainers()) {
			let n = (e.getId() || "").toLowerCase();
			t.includes(n) ? e.getVisible() || e.show() : e.getVisible() && e.hide();
		}
	}
	async _switchSkinPath(e, t) {
		this._uiRoot.reset(), this._parent.appendChild(this._uiRoot.getRootDiv());
		let n = !1, r = null, i = await N(t ? "skin.wal" : e);
		if (i.length > 1 ? (await this._loadSkinPathToUiroot(e, this._uiRoot, null), n = !0, r = await O(i, e, this._uiRoot)) : r = i[0], r == null) throw Error("Skin not supported");
		this._uiRoot.SkinEngineClass = r;
		let a = new r(this._uiRoot);
		n || await this._loadSkinPathToUiroot(e, this._uiRoot, a), await a.buildUI();
	}
	async _loadSkinPathToUiroot(t, n, r) {
		let i, a;
		if (t.endsWith("/")) a = new _();
		else {
			if (i = await fetch(t), i.status == 404) throw Error("Skin does not exist");
			r != null && (a = r.getFileExtractor());
		}
		if (a ??= (i.headers.get("content-type") || "").startsWith("application/") || t.startsWith("blob:") || /\.(wal|wmz|wsz|zip|kjofol|face|acs5|uib)$/i.test(t) ? new e() : new _(), await a.prepare(t, i), a instanceof e) {
			let e = a.listSkinRoots(), t = this._options.skinRoot;
			if (t) {
				let n = e.find((e) => e.replace(/\/$/, "").toLowerCase() === t.replace(/[\\/]$/, "").toLowerCase());
				a.setRoot(n ?? t);
			} else e.length && e[0] !== "" && a.setRoot(e[0]);
		}
		n.setFileExtractor(a);
	}
	playSong(e) {}
	onLogMessage(e) {
		this._uiRoot.on("onlogmessage", e);
	}
};
async function main() {
	window.WebampModern = Webamp5;
}
main();
//#endregion
export { Webamp5 };
