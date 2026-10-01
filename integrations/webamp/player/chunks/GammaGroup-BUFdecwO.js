import { n as e } from "./rolldown-runtime-ly0BBW_k.js";
//#region src/vendor/webamp-modern/_snowpack/pkg/common/_commonjsHelpers-4f955397.js
var t = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function getDefaultExportFromCjs(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function createCommonjsModule(e, t, m) {
	return m = {
		path: t,
		exports: {},
		require: function(e, t) {
			return commonjsRequire(e, t ?? m.path);
		}
	}, e(m, m.exports), m.exports;
}
function commonjsRequire() {
	throw Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
}
//#endregion
//#region src/vendor/webamp-modern/_snowpack/pkg/jszip.js
function defaultSetTimout() {
	throw Error("setTimeout has not been defined");
}
function defaultClearTimeout() {
	throw Error("clearTimeout has not been defined");
}
var m = defaultSetTimout, v = defaultClearTimeout, y = typeof window < "u" ? window : typeof self < "u" ? self : {};
typeof y.setTimeout == "function" && (m = setTimeout), typeof y.clearTimeout == "function" && (v = clearTimeout);
function runTimeout(e) {
	if (m === setTimeout) return setTimeout(e, 0);
	if ((m === defaultSetTimout || !m) && setTimeout) return m = setTimeout, setTimeout(e, 0);
	try {
		return m(e, 0);
	} catch {
		try {
			return m.call(null, e, 0);
		} catch {
			return m.call(this, e, 0);
		}
	}
}
function runClearTimeout(e) {
	if (v === clearTimeout) return clearTimeout(e);
	if ((v === defaultClearTimeout || !v) && clearTimeout) return v = clearTimeout, clearTimeout(e);
	try {
		return v(e);
	} catch {
		try {
			return v.call(null, e);
		} catch {
			return v.call(this, e);
		}
	}
}
var x = [], S = !1, C, w = -1;
function cleanUpNextTick() {
	S && C && (S = !1, C.length ? x = C.concat(x) : w = -1, x.length && drainQueue());
}
function drainQueue() {
	if (!S) {
		var e = runTimeout(cleanUpNextTick);
		S = !0;
		for (var t = x.length; t;) {
			for (C = x, x = []; ++w < t;) C && C[w].run();
			w = -1, t = x.length;
		}
		C = null, S = !1, runClearTimeout(e);
	}
}
function nextTick(e) {
	var t = Array(arguments.length - 1);
	if (arguments.length > 1) for (var m = 1; m < arguments.length; m++) t[m - 1] = arguments[m];
	x.push(new Item(e, t)), x.length === 1 && !S && runTimeout(drainQueue);
}
function Item(e, t) {
	this.fun = e, this.array = t;
}
Item.prototype.run = function() {
	this.fun.apply(null, this.array);
};
var E = "browser", O = "browser", k = !0, ee = [], I = "", z = {}, te = {}, ne = {};
function noop() {}
var B = noop, re = noop, q = noop, Q = noop, ie = noop, ae = noop, $ = noop;
function binding(e) {
	throw Error("process.binding is not supported");
}
function cwd() {
	return "/";
}
function chdir(e) {
	throw Error("process.chdir is not supported");
}
function umask() {
	return 0;
}
var oe = y.performance || {}, se = oe.now || oe.mozNow || oe.msNow || oe.oNow || oe.webkitNow || function() {
	return (/* @__PURE__ */ new Date()).getTime();
};
function hrtime(e) {
	var t = se.call(oe) * .001, m = Math.floor(t), v = Math.floor(t % 1 * 1e9);
	return e && (m -= e[0], v -= e[1], v < 0 && (m--, v += 1e9)), [m, v];
}
var ce = /* @__PURE__ */ new Date();
function uptime() {
	return (/* @__PURE__ */ new Date() - ce) / 1e3;
}
var le = {
	nextTick,
	title: E,
	browser: k,
	env: { NODE_ENV: "production" },
	argv: ee,
	version: I,
	versions: z,
	on: B,
	addListener: re,
	once: q,
	off: Q,
	removeListener: ie,
	removeAllListeners: ae,
	emit: $,
	binding,
	cwd,
	chdir,
	umask,
	hrtime,
	platform: O,
	release: te,
	config: ne,
	uptime
}, ue = createCommonjsModule(function(e, m) {
	(function(t) {
		e.exports = t();
	})(function() {
		return function s(e, t, m) {
			function u(y, x) {
				if (!t[y]) {
					if (!e[y]) {
						var S = typeof commonjsRequire == "function" && commonjsRequire;
						if (!x && S) return S(y, !0);
						if (v) return v(y, !0);
						var C = /* @__PURE__ */ Error("Cannot find module '" + y + "'");
						throw C.code = "MODULE_NOT_FOUND", C;
					}
					var w = t[y] = { exports: {} };
					e[y][0].call(w.exports, function(t) {
						var m = e[y][1][t];
						return u(m || t);
					}, w, w.exports, s, e, t, m);
				}
				return t[y].exports;
			}
			for (var v = typeof commonjsRequire == "function" && commonjsRequire, y = 0; y < m.length; y++) u(m[y]);
			return u;
		}({
			1: [function(e, t, m) {
				var v = e("./utils"), y = e("./support"), x = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
				m.encode = function(e) {
					for (var t, m, y, S, C, w, E, O = [], k = 0, ee = e.length, I = ee, z = v.getTypeOf(e) !== "string"; k < e.length;) I = ee - k, y = z ? (t = e[k++], m = k < ee ? e[k++] : 0, k < ee ? e[k++] : 0) : (t = e.charCodeAt(k++), m = k < ee ? e.charCodeAt(k++) : 0, k < ee ? e.charCodeAt(k++) : 0), S = t >> 2, C = (3 & t) << 4 | m >> 4, w = 1 < I ? (15 & m) << 2 | y >> 6 : 64, E = 2 < I ? 63 & y : 64, O.push(x.charAt(S) + x.charAt(C) + x.charAt(w) + x.charAt(E));
					return O.join("");
				}, m.decode = function(e) {
					var t, m, v, S, C, w, E = 0, O = 0, k = "data:";
					if (e.substr(0, k.length) === k) throw Error("Invalid base64 input, it looks like a data url.");
					var ee, I = 3 * (e = e.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
					if (e.charAt(e.length - 1) === x.charAt(64) && I--, e.charAt(e.length - 2) === x.charAt(64) && I--, I % 1 != 0) throw Error("Invalid base64 input, bad content length.");
					for (ee = y.uint8array ? new Uint8Array(0 | I) : Array(0 | I); E < e.length;) t = x.indexOf(e.charAt(E++)) << 2 | (S = x.indexOf(e.charAt(E++))) >> 4, m = (15 & S) << 4 | (C = x.indexOf(e.charAt(E++))) >> 2, v = (3 & C) << 6 | (w = x.indexOf(e.charAt(E++))), ee[O++] = t, C !== 64 && (ee[O++] = m), w !== 64 && (ee[O++] = v);
					return ee;
				};
			}, {
				"./support": 30,
				"./utils": 32
			}],
			2: [function(e, t, m) {
				var v = e("./external"), y = e("./stream/DataWorker"), x = e("./stream/Crc32Probe"), S = e("./stream/DataLengthProbe");
				function o(e, t, m, v, y) {
					this.compressedSize = e, this.uncompressedSize = t, this.crc32 = m, this.compression = v, this.compressedContent = y;
				}
				o.prototype = {
					getContentWorker: function() {
						var e = new y(v.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new S("data_length")), t = this;
						return e.on("end", function() {
							if (this.streamInfo.data_length !== t.uncompressedSize) throw Error("Bug : uncompressed data size mismatch");
						}), e;
					},
					getCompressedWorker: function() {
						return new y(v.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
					}
				}, o.createWorkerFrom = function(e, t, m) {
					return e.pipe(new x()).pipe(new S("uncompressedSize")).pipe(t.compressWorker(m)).pipe(new S("compressedSize")).withStreamInfo("compression", t);
				}, t.exports = o;
			}, {
				"./external": 6,
				"./stream/Crc32Probe": 25,
				"./stream/DataLengthProbe": 26,
				"./stream/DataWorker": 27
			}],
			3: [function(e, t, m) {
				var v = e("./stream/GenericWorker");
				m.STORE = {
					magic: "\0\0",
					compressWorker: function() {
						return new v("STORE compression");
					},
					uncompressWorker: function() {
						return new v("STORE decompression");
					}
				}, m.DEFLATE = e("./flate");
			}, {
				"./flate": 7,
				"./stream/GenericWorker": 28
			}],
			4: [function(e, t, m) {
				var v = e("./utils"), y = function() {
					for (var e, t = [], m = 0; m < 256; m++) {
						e = m;
						for (var v = 0; v < 8; v++) e = 1 & e ? 3988292384 ^ e >>> 1 : e >>> 1;
						t[m] = e;
					}
					return t;
				}();
				t.exports = function(e, t) {
					return e !== void 0 && e.length ? v.getTypeOf(e) === "string" ? function(e, t, m, v) {
						var x = y, S = v + m;
						e ^= -1;
						for (var C = v; C < S; C++) e = e >>> 8 ^ x[255 & (e ^ t.charCodeAt(C))];
						return -1 ^ e;
					}(0 | t, e, e.length, 0) : function(e, t, m, v) {
						var x = y, S = v + m;
						e ^= -1;
						for (var C = v; C < S; C++) e = e >>> 8 ^ x[255 & (e ^ t[C])];
						return -1 ^ e;
					}(0 | t, e, e.length, 0) : 0;
				};
			}, { "./utils": 32 }],
			5: [function(e, t, m) {
				m.base64 = !1, m.binary = !1, m.dir = !1, m.createFolders = !0, m.date = null, m.compression = null, m.compressionOptions = null, m.comment = null, m.unixPermissions = null, m.dosPermissions = null;
			}, {}],
			6: [function(e, t, m) {
				var v = null;
				v = typeof Promise < "u" ? Promise : e("lie"), t.exports = { Promise: v };
			}, { lie: 37 }],
			7: [function(e, t, m) {
				var v = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", y = e("pako"), x = e("./utils"), S = e("./stream/GenericWorker"), C = v ? "uint8array" : "array";
				function h(e, t) {
					S.call(this, "FlateWorker/" + e), this._pako = null, this._pakoAction = e, this._pakoOptions = t, this.meta = {};
				}
				m.magic = "\b\0", x.inherits(h, S), h.prototype.processChunk = function(e) {
					this.meta = e.meta, this._pako === null && this._createPako(), this._pako.push(x.transformTo(C, e.data), !1);
				}, h.prototype.flush = function() {
					S.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
				}, h.prototype.cleanUp = function() {
					S.prototype.cleanUp.call(this), this._pako = null;
				}, h.prototype._createPako = function() {
					this._pako = new y[this._pakoAction]({
						raw: !0,
						level: this._pakoOptions.level || -1
					});
					var e = this;
					this._pako.onData = function(t) {
						e.push({
							data: t,
							meta: e.meta
						});
					};
				}, m.compressWorker = function(e) {
					return new h("Deflate", e);
				}, m.uncompressWorker = function() {
					return new h("Inflate", {});
				};
			}, {
				"./stream/GenericWorker": 28,
				"./utils": 32,
				pako: 38
			}],
			8: [function(e, t, m) {
				function A(e, t) {
					var m, v = "";
					for (m = 0; m < t; m++) v += String.fromCharCode(255 & e), e >>>= 8;
					return v;
				}
				function n(e, t, m, y, w, E) {
					var O, k, ee = e.file, I = e.compression, z = E !== x.utf8encode, te = v.transformTo("string", E(ee.name)), ne = v.transformTo("string", x.utf8encode(ee.name)), B = ee.comment, re = v.transformTo("string", E(B)), q = v.transformTo("string", x.utf8encode(B)), Q = ne.length !== ee.name.length, ie = q.length !== B.length, ae = "", $ = "", oe = "", se = ee.dir, ce = ee.date, le = {
						crc32: 0,
						compressedSize: 0,
						uncompressedSize: 0
					};
					t && !m || (le.crc32 = e.crc32, le.compressedSize = e.compressedSize, le.uncompressedSize = e.uncompressedSize);
					var ue = 0;
					t && (ue |= 8), z || !Q && !ie || (ue |= 2048);
					var de = 0, fe = 0;
					se && (de |= 16), w === "UNIX" ? (fe = 798, de |= function(e, t) {
						var m = e;
						return e || (m = t ? 16893 : 33204), (65535 & m) << 16;
					}(ee.unixPermissions, se)) : (fe = 20, de |= function(e) {
						return 63 & (e || 0);
					}(ee.dosPermissions)), O = ce.getUTCHours(), O <<= 6, O |= ce.getUTCMinutes(), O <<= 5, O |= ce.getUTCSeconds() / 2, k = ce.getUTCFullYear() - 1980, k <<= 4, k |= ce.getUTCMonth() + 1, k <<= 5, k |= ce.getUTCDate(), Q && ($ = A(1, 1) + A(S(te), 4) + ne, ae += "up" + A($.length, 2) + $), ie && (oe = A(1, 1) + A(S(re), 4) + q, ae += "uc" + A(oe.length, 2) + oe);
					var pe = "";
					return pe += "\n\0", pe += A(ue, 2), pe += I.magic, pe += A(O, 2), pe += A(k, 2), pe += A(le.crc32, 4), pe += A(le.compressedSize, 4), pe += A(le.uncompressedSize, 4), pe += A(te.length, 2), pe += A(ae.length, 2), {
						fileRecord: C.LOCAL_FILE_HEADER + pe + te + ae,
						dirRecord: C.CENTRAL_FILE_HEADER + A(fe, 2) + pe + A(re.length, 2) + "\0\0\0\0" + A(de, 4) + A(y, 4) + te + ae + re
					};
				}
				var v = e("../utils"), y = e("../stream/GenericWorker"), x = e("../utf8"), S = e("../crc32"), C = e("../signature");
				function s(e, t, m, v) {
					y.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t, this.zipPlatform = m, this.encodeFileName = v, this.streamFiles = e, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
				}
				v.inherits(s, y), s.prototype.push = function(e) {
					var t = e.meta.percent || 0, m = this.entriesCount, v = this._sources.length;
					this.accumulate ? this.contentBuffer.push(e) : (this.bytesWritten += e.data.length, y.prototype.push.call(this, {
						data: e.data,
						meta: {
							currentFile: this.currentFile,
							percent: m ? (t + 100 * (m - v - 1)) / m : 100
						}
					}));
				}, s.prototype.openedSource = function(e) {
					this.currentSourceOffset = this.bytesWritten, this.currentFile = e.file.name;
					var t = this.streamFiles && !e.file.dir;
					if (t) {
						var m = n(e, t, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
						this.push({
							data: m.fileRecord,
							meta: { percent: 0 }
						});
					} else this.accumulate = !0;
				}, s.prototype.closedSource = function(e) {
					this.accumulate = !1;
					var t = this.streamFiles && !e.file.dir, m = n(e, t, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
					if (this.dirRecords.push(m.dirRecord), t) this.push({
						data: function(e) {
							return C.DATA_DESCRIPTOR + A(e.crc32, 4) + A(e.compressedSize, 4) + A(e.uncompressedSize, 4);
						}(e),
						meta: { percent: 100 }
					});
					else for (this.push({
						data: m.fileRecord,
						meta: { percent: 0 }
					}); this.contentBuffer.length;) this.push(this.contentBuffer.shift());
					this.currentFile = null;
				}, s.prototype.flush = function() {
					for (var e = this.bytesWritten, t = 0; t < this.dirRecords.length; t++) this.push({
						data: this.dirRecords[t],
						meta: { percent: 100 }
					});
					var m = this.bytesWritten - e, y = function(e, t, m, y, x) {
						var S = v.transformTo("string", x(y));
						return C.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e, 2) + A(e, 2) + A(t, 4) + A(m, 4) + A(S.length, 2) + S;
					}(this.dirRecords.length, m, e, this.zipComment, this.encodeFileName);
					this.push({
						data: y,
						meta: { percent: 100 }
					});
				}, s.prototype.prepareNextSource = function() {
					this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
				}, s.prototype.registerPrevious = function(e) {
					this._sources.push(e);
					var t = this;
					return e.on("data", function(e) {
						t.processChunk(e);
					}), e.on("end", function() {
						t.closedSource(t.previous.streamInfo), t._sources.length ? t.prepareNextSource() : t.end();
					}), e.on("error", function(e) {
						t.error(e);
					}), this;
				}, s.prototype.resume = function() {
					return !!y.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
				}, s.prototype.error = function(e) {
					var t = this._sources;
					if (!y.prototype.error.call(this, e)) return !1;
					for (var m = 0; m < t.length; m++) try {
						t[m].error(e);
					} catch {}
					return !0;
				}, s.prototype.lock = function() {
					y.prototype.lock.call(this);
					for (var e = this._sources, t = 0; t < e.length; t++) e[t].lock();
				}, t.exports = s;
			}, {
				"../crc32": 4,
				"../signature": 23,
				"../stream/GenericWorker": 28,
				"../utf8": 31,
				"../utils": 32
			}],
			9: [function(e, t, m) {
				var v = e("../compressions"), y = e("./ZipFileWorker");
				m.generateWorker = function(e, t, m) {
					var x = new y(t.streamFiles, m, t.platform, t.encodeFileName), S = 0;
					try {
						e.forEach(function(e, m) {
							S++;
							var y = function(e, t) {
								var m = e || t, y = v[m];
								if (!y) throw Error(m + " is not a valid compression method !");
								return y;
							}(m.options.compression, t.compression), C = m.options.compressionOptions || t.compressionOptions || {}, w = m.dir, E = m.date;
							m._compressWorker(y, C).withStreamInfo("file", {
								name: e,
								dir: w,
								date: E,
								comment: m.comment || "",
								unixPermissions: m.unixPermissions,
								dosPermissions: m.dosPermissions
							}).pipe(x);
						}), x.entriesCount = S;
					} catch (e) {
						x.error(e);
					}
					return x;
				};
			}, {
				"../compressions": 3,
				"./ZipFileWorker": 8
			}],
			10: [function(e, t, m) {
				function n() {
					if (!(this instanceof n)) return new n();
					if (arguments.length) throw Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
					this.files = Object.create(null), this.comment = null, this.root = "", this.clone = function() {
						var e = new n();
						for (var t in this) typeof this[t] != "function" && (e[t] = this[t]);
						return e;
					};
				}
				(n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e, t) {
					return new n().loadAsync(e, t);
				}, n.external = e("./external"), t.exports = n;
			}, {
				"./defaults": 5,
				"./external": 6,
				"./load": 11,
				"./object": 15,
				"./support": 30
			}],
			11: [function(e, t, m) {
				var v = e("./utils"), y = e("./external"), x = e("./utf8"), S = e("./zipEntries"), C = e("./stream/Crc32Probe"), w = e("./nodejsUtils");
				function f(e) {
					return new y.Promise(function(t, m) {
						var v = e.decompressed.getContentWorker().pipe(new C());
						v.on("error", function(e) {
							m(e);
						}).on("end", function() {
							v.streamInfo.crc32 === e.decompressed.crc32 ? t() : m(/* @__PURE__ */ Error("Corrupted zip : CRC32 mismatch"));
						}).resume();
					});
				}
				t.exports = function(e, t) {
					var m = this;
					return t = v.extend(t || {}, {
						base64: !1,
						checkCRC32: !1,
						optimizedBinaryString: !1,
						createFolders: !1,
						decodeFileName: x.utf8decode
					}), w.isNode && w.isStream(e) ? y.Promise.reject(/* @__PURE__ */ Error("JSZip can't accept a stream when loading a zip file.")) : v.prepareContent("the loaded zip file", e, !0, t.optimizedBinaryString, t.base64).then(function(e) {
						var m = new S(t);
						return m.load(e), m;
					}).then(function(e) {
						var m = [y.Promise.resolve(e)], v = e.files;
						if (t.checkCRC32) for (var x = 0; x < v.length; x++) m.push(f(v[x]));
						return y.Promise.all(m);
					}).then(function(e) {
						for (var y = e.shift(), x = y.files, S = 0; S < x.length; S++) {
							var C = x[S], w = C.fileNameStr, E = v.resolve(C.fileNameStr);
							m.file(E, C.decompressed, {
								binary: !0,
								optimizedBinaryString: !0,
								date: C.date,
								dir: C.dir,
								comment: C.fileCommentStr.length ? C.fileCommentStr : null,
								unixPermissions: C.unixPermissions,
								dosPermissions: C.dosPermissions,
								createFolders: t.createFolders
							}), C.dir || (m.file(E).unsafeOriginalName = w);
						}
						return y.zipComment.length && (m.comment = y.zipComment), m;
					});
				};
			}, {
				"./external": 6,
				"./nodejsUtils": 14,
				"./stream/Crc32Probe": 25,
				"./utf8": 31,
				"./utils": 32,
				"./zipEntries": 33
			}],
			12: [function(e, t, m) {
				var v = e("../utils"), y = e("../stream/GenericWorker");
				function s(e, t) {
					y.call(this, "Nodejs stream input adapter for " + e), this._upstreamEnded = !1, this._bindStream(t);
				}
				v.inherits(s, y), s.prototype._bindStream = function(e) {
					var t = this;
					(this._stream = e).pause(), e.on("data", function(e) {
						t.push({
							data: e,
							meta: { percent: 0 }
						});
					}).on("error", function(e) {
						t.isPaused ? this.generatedError = e : t.error(e);
					}).on("end", function() {
						t.isPaused ? t._upstreamEnded = !0 : t.end();
					});
				}, s.prototype.pause = function() {
					return !!y.prototype.pause.call(this) && (this._stream.pause(), !0);
				}, s.prototype.resume = function() {
					return !!y.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
				}, t.exports = s;
			}, {
				"../stream/GenericWorker": 28,
				"../utils": 32
			}],
			13: [function(e, t, m) {
				var v = e("readable-stream").Readable;
				function n(e, t, m) {
					v.call(this, t), this._helper = e;
					var y = this;
					e.on("data", function(e, t) {
						y.push(e) || y._helper.pause(), m && m(t);
					}).on("error", function(e) {
						y.emit("error", e);
					}).on("end", function() {
						y.push(null);
					});
				}
				e("../utils").inherits(n, v), n.prototype._read = function() {
					this._helper.resume();
				}, t.exports = n;
			}, {
				"../utils": 32,
				"readable-stream": 16
			}],
			14: [function(e, t, m) {
				t.exports = {
					isNode: typeof Buffer < "u",
					newBufferFrom: function(e, t) {
						if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e, t);
						if (typeof e == "number") throw Error("The \"data\" argument must not be a number");
						return new Buffer(e, t);
					},
					allocBuffer: function(e) {
						if (Buffer.alloc) return Buffer.alloc(e);
						var t = new Buffer(e);
						return t.fill(0), t;
					},
					isBuffer: function(e) {
						return Buffer.isBuffer(e);
					},
					isStream: function(e) {
						return e && typeof e.on == "function" && typeof e.pause == "function" && typeof e.resume == "function";
					}
				};
			}, {}],
			15: [function(e, t, m) {
				function s(e, t, m) {
					var v, S = y.getTypeOf(t), O = y.extend(m || {}, C);
					O.date = O.date || /* @__PURE__ */ new Date(), O.compression !== null && (O.compression = O.compression.toUpperCase()), typeof O.unixPermissions == "string" && (O.unixPermissions = parseInt(O.unixPermissions, 8)), O.unixPermissions && 16384 & O.unixPermissions && (O.dir = !0), O.dosPermissions && 16 & O.dosPermissions && (O.dir = !0), O.dir && (e = g(e)), O.createFolders && (v = _(e)) && b.call(this, v, !0);
					var I = S === "string" && !1 === O.binary && !1 === O.base64;
					m && m.binary !== void 0 || (O.binary = !I), (t instanceof w && t.uncompressedSize === 0 || O.dir || !t || t.length === 0) && (O.base64 = !1, O.binary = !0, t = "", O.compression = "STORE", S = "string");
					var z = null;
					z = t instanceof w || t instanceof x ? t : k.isNode && k.isStream(t) ? new ee(e, t) : y.prepareContent(e, t, O.binary, O.optimizedBinaryString, O.base64);
					var te = new E(e, z, O);
					this.files[e] = te;
				}
				var v = e("./utf8"), y = e("./utils"), x = e("./stream/GenericWorker"), S = e("./stream/StreamHelper"), C = e("./defaults"), w = e("./compressedObject"), E = e("./zipObject"), O = e("./generate"), k = e("./nodejsUtils"), ee = e("./nodejs/NodejsStreamInputAdapter"), _ = function(e) {
					e.slice(-1) === "/" && (e = e.substring(0, e.length - 1));
					var t = e.lastIndexOf("/");
					return 0 < t ? e.substring(0, t) : "";
				}, g = function(e) {
					return e.slice(-1) !== "/" && (e += "/"), e;
				}, b = function(e, t) {
					return t = t === void 0 ? C.createFolders : t, e = g(e), this.files[e] || s.call(this, e, null, {
						dir: !0,
						createFolders: t
					}), this.files[e];
				};
				function h(e) {
					return Object.prototype.toString.call(e) === "[object RegExp]";
				}
				t.exports = {
					load: function() {
						throw Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					forEach: function(e) {
						var t, m, v;
						for (t in this.files) v = this.files[t], (m = t.slice(this.root.length, t.length)) && t.slice(0, this.root.length) === this.root && e(m, v);
					},
					filter: function(e) {
						var t = [];
						return this.forEach(function(m, v) {
							e(m, v) && t.push(v);
						}), t;
					},
					file: function(e, t, m) {
						if (arguments.length !== 1) return e = this.root + e, s.call(this, e, t, m), this;
						if (h(e)) {
							var v = e;
							return this.filter(function(e, t) {
								return !t.dir && v.test(e);
							});
						}
						var y = this.files[this.root + e];
						return y && !y.dir ? y : null;
					},
					folder: function(e) {
						if (!e) return this;
						if (h(e)) return this.filter(function(t, m) {
							return m.dir && e.test(t);
						});
						var t = this.root + e, m = b.call(this, t), v = this.clone();
						return v.root = m.name, v;
					},
					remove: function(e) {
						e = this.root + e;
						var t = this.files[e];
						if (t ||= (e.slice(-1) !== "/" && (e += "/"), this.files[e]), t && !t.dir) delete this.files[e];
						else for (var m = this.filter(function(t, m) {
							return m.name.slice(0, e.length) === e;
						}), v = 0; v < m.length; v++) delete this.files[m[v].name];
						return this;
					},
					generate: function() {
						throw Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					generateInternalStream: function(e) {
						var t, m = {};
						try {
							if ((m = y.extend(e || {}, {
								streamFiles: !1,
								compression: "STORE",
								compressionOptions: null,
								type: "",
								platform: "DOS",
								comment: null,
								mimeType: "application/zip",
								encodeFileName: v.utf8encode
							})).type = m.type.toLowerCase(), m.compression = m.compression.toUpperCase(), m.type === "binarystring" && (m.type = "string"), !m.type) throw Error("No output type specified.");
							y.checkSupport(m.type), m.platform !== "darwin" && m.platform !== "freebsd" && m.platform !== "linux" && m.platform !== "sunos" || (m.platform = "UNIX"), m.platform === "win32" && (m.platform = "DOS");
							var C = m.comment || this.comment || "";
							t = O.generateWorker(this, m, C);
						} catch (e) {
							(t = new x("error")).error(e);
						}
						return new S(t, m.type || "string", m.mimeType);
					},
					generateAsync: function(e, t) {
						return this.generateInternalStream(e).accumulate(t);
					},
					generateNodeStream: function(e, t) {
						return (e ||= {}).type || (e.type = "nodebuffer"), this.generateInternalStream(e).toNodejsStream(t);
					}
				};
			}, {
				"./compressedObject": 2,
				"./defaults": 5,
				"./generate": 9,
				"./nodejs/NodejsStreamInputAdapter": 12,
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31,
				"./utils": 32,
				"./zipObject": 35
			}],
			16: [function(e, t, m) {
				t.exports = e("stream");
			}, { stream: void 0 }],
			17: [function(e, t, m) {
				var v = e("./DataReader");
				function i(e) {
					v.call(this, e);
					for (var t = 0; t < this.data.length; t++) e[t] = 255 & e[t];
				}
				e("../utils").inherits(i, v), i.prototype.byteAt = function(e) {
					return this.data[this.zero + e];
				}, i.prototype.lastIndexOfSignature = function(e) {
					for (var t = e.charCodeAt(0), m = e.charCodeAt(1), v = e.charCodeAt(2), y = e.charCodeAt(3), x = this.length - 4; 0 <= x; --x) if (this.data[x] === t && this.data[x + 1] === m && this.data[x + 2] === v && this.data[x + 3] === y) return x - this.zero;
					return -1;
				}, i.prototype.readAndCheckSignature = function(e) {
					var t = e.charCodeAt(0), m = e.charCodeAt(1), v = e.charCodeAt(2), y = e.charCodeAt(3), x = this.readData(4);
					return t === x[0] && m === x[1] && v === x[2] && y === x[3];
				}, i.prototype.readData = function(e) {
					if (this.checkOffset(e), e === 0) return [];
					var t = this.data.slice(this.zero + this.index, this.zero + this.index + e);
					return this.index += e, t;
				}, t.exports = i;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			18: [function(e, t, m) {
				var v = e("../utils");
				function i(e) {
					this.data = e, this.length = e.length, this.index = 0, this.zero = 0;
				}
				i.prototype = {
					checkOffset: function(e) {
						this.checkIndex(this.index + e);
					},
					checkIndex: function(e) {
						if (this.length < this.zero + e || e < 0) throw Error("End of data reached (data length = " + this.length + ", asked index = " + e + "). Corrupted zip ?");
					},
					setIndex: function(e) {
						this.checkIndex(e), this.index = e;
					},
					skip: function(e) {
						this.setIndex(this.index + e);
					},
					byteAt: function() {},
					readInt: function(e) {
						var t, m = 0;
						for (this.checkOffset(e), t = this.index + e - 1; t >= this.index; t--) m = (m << 8) + this.byteAt(t);
						return this.index += e, m;
					},
					readString: function(e) {
						return v.transformTo("string", this.readData(e));
					},
					readData: function() {},
					lastIndexOfSignature: function() {},
					readAndCheckSignature: function() {},
					readDate: function() {
						var e = this.readInt(4);
						return new Date(Date.UTC(1980 + (e >> 25 & 127), (e >> 21 & 15) - 1, e >> 16 & 31, e >> 11 & 31, e >> 5 & 63, (31 & e) << 1));
					}
				}, t.exports = i;
			}, { "../utils": 32 }],
			19: [function(e, t, m) {
				var v = e("./Uint8ArrayReader");
				function i(e) {
					v.call(this, e);
				}
				e("../utils").inherits(i, v), i.prototype.readData = function(e) {
					this.checkOffset(e);
					var t = this.data.slice(this.zero + this.index, this.zero + this.index + e);
					return this.index += e, t;
				}, t.exports = i;
			}, {
				"../utils": 32,
				"./Uint8ArrayReader": 21
			}],
			20: [function(e, t, m) {
				var v = e("./DataReader");
				function i(e) {
					v.call(this, e);
				}
				e("../utils").inherits(i, v), i.prototype.byteAt = function(e) {
					return this.data.charCodeAt(this.zero + e);
				}, i.prototype.lastIndexOfSignature = function(e) {
					return this.data.lastIndexOf(e) - this.zero;
				}, i.prototype.readAndCheckSignature = function(e) {
					return e === this.readData(4);
				}, i.prototype.readData = function(e) {
					this.checkOffset(e);
					var t = this.data.slice(this.zero + this.index, this.zero + this.index + e);
					return this.index += e, t;
				}, t.exports = i;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			21: [function(e, t, m) {
				var v = e("./ArrayReader");
				function i(e) {
					v.call(this, e);
				}
				e("../utils").inherits(i, v), i.prototype.readData = function(e) {
					if (this.checkOffset(e), e === 0) return /* @__PURE__ */ new Uint8Array();
					var t = this.data.subarray(this.zero + this.index, this.zero + this.index + e);
					return this.index += e, t;
				}, t.exports = i;
			}, {
				"../utils": 32,
				"./ArrayReader": 17
			}],
			22: [function(e, t, m) {
				var v = e("../utils"), y = e("../support"), x = e("./ArrayReader"), S = e("./StringReader"), C = e("./NodeBufferReader"), w = e("./Uint8ArrayReader");
				t.exports = function(e) {
					var t = v.getTypeOf(e);
					return v.checkSupport(t), t !== "string" || y.uint8array ? t === "nodebuffer" ? new C(e) : y.uint8array ? new w(v.transformTo("uint8array", e)) : new x(v.transformTo("array", e)) : new S(e);
				};
			}, {
				"../support": 30,
				"../utils": 32,
				"./ArrayReader": 17,
				"./NodeBufferReader": 19,
				"./StringReader": 20,
				"./Uint8ArrayReader": 21
			}],
			23: [function(e, t, m) {
				m.LOCAL_FILE_HEADER = "PK", m.CENTRAL_FILE_HEADER = "PK", m.CENTRAL_DIRECTORY_END = "PK", m.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", m.ZIP64_CENTRAL_DIRECTORY_END = "PK", m.DATA_DESCRIPTOR = "PK\x07\b";
			}, {}],
			24: [function(e, t, m) {
				var v = e("./GenericWorker"), y = e("../utils");
				function s(e) {
					v.call(this, "ConvertWorker to " + e), this.destType = e;
				}
				y.inherits(s, v), s.prototype.processChunk = function(e) {
					this.push({
						data: y.transformTo(this.destType, e.data),
						meta: e.meta
					});
				}, t.exports = s;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			25: [function(e, t, m) {
				var v = e("./GenericWorker"), y = e("../crc32");
				function s() {
					v.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
				}
				e("../utils").inherits(s, v), s.prototype.processChunk = function(e) {
					this.streamInfo.crc32 = y(e.data, this.streamInfo.crc32 || 0), this.push(e);
				}, t.exports = s;
			}, {
				"../crc32": 4,
				"../utils": 32,
				"./GenericWorker": 28
			}],
			26: [function(e, t, m) {
				var v = e("../utils"), y = e("./GenericWorker");
				function s(e) {
					y.call(this, "DataLengthProbe for " + e), this.propName = e, this.withStreamInfo(e, 0);
				}
				v.inherits(s, y), s.prototype.processChunk = function(e) {
					if (e) {
						var t = this.streamInfo[this.propName] || 0;
						this.streamInfo[this.propName] = t + e.data.length;
					}
					y.prototype.processChunk.call(this, e);
				}, t.exports = s;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			27: [function(e, t, m) {
				var v = e("../utils"), y = e("./GenericWorker");
				function s(e) {
					y.call(this, "DataWorker");
					var t = this;
					this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, e.then(function(e) {
						t.dataIsReady = !0, t.data = e, t.max = e && e.length || 0, t.type = v.getTypeOf(e), t.isPaused || t._tickAndRepeat();
					}, function(e) {
						t.error(e);
					});
				}
				v.inherits(s, y), s.prototype.cleanUp = function() {
					y.prototype.cleanUp.call(this), this.data = null;
				}, s.prototype.resume = function() {
					return !!y.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, v.delay(this._tickAndRepeat, [], this)), !0);
				}, s.prototype._tickAndRepeat = function() {
					this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (v.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
				}, s.prototype._tick = function() {
					if (this.isPaused || this.isFinished) return !1;
					var e = null, t = Math.min(this.max, this.index + 16384);
					if (this.index >= this.max) return this.end();
					switch (this.type) {
						case "string":
							e = this.data.substring(this.index, t);
							break;
						case "uint8array":
							e = this.data.subarray(this.index, t);
							break;
						case "array":
						case "nodebuffer": e = this.data.slice(this.index, t);
					}
					return this.index = t, this.push({
						data: e,
						meta: { percent: this.max ? this.index / this.max * 100 : 0 }
					});
				}, t.exports = s;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			28: [function(e, t, m) {
				function n(e) {
					this.name = e || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = {
						data: [],
						end: [],
						error: []
					}, this.previous = null;
				}
				n.prototype = {
					push: function(e) {
						this.emit("data", e);
					},
					end: function() {
						if (this.isFinished) return !1;
						this.flush();
						try {
							this.emit("end"), this.cleanUp(), this.isFinished = !0;
						} catch (e) {
							this.emit("error", e);
						}
						return !0;
					},
					error: function(e) {
						return !this.isFinished && (this.isPaused ? this.generatedError = e : (this.isFinished = !0, this.emit("error", e), this.previous && this.previous.error(e), this.cleanUp()), !0);
					},
					on: function(e, t) {
						return this._listeners[e].push(t), this;
					},
					cleanUp: function() {
						this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
					},
					emit: function(e, t) {
						if (this._listeners[e]) for (var m = 0; m < this._listeners[e].length; m++) this._listeners[e][m].call(this, t);
					},
					pipe: function(e) {
						return e.registerPrevious(this);
					},
					registerPrevious: function(e) {
						if (this.isLocked) throw Error("The stream '" + this + "' has already been used.");
						this.streamInfo = e.streamInfo, this.mergeStreamInfo(), this.previous = e;
						var t = this;
						return e.on("data", function(e) {
							t.processChunk(e);
						}), e.on("end", function() {
							t.end();
						}), e.on("error", function(e) {
							t.error(e);
						}), this;
					},
					pause: function() {
						return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
					},
					resume: function() {
						if (!this.isPaused || this.isFinished) return !1;
						var e = this.isPaused = !1;
						return this.generatedError && (this.error(this.generatedError), e = !0), this.previous && this.previous.resume(), !e;
					},
					flush: function() {},
					processChunk: function(e) {
						this.push(e);
					},
					withStreamInfo: function(e, t) {
						return this.extraStreamInfo[e] = t, this.mergeStreamInfo(), this;
					},
					mergeStreamInfo: function() {
						for (var e in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e) && (this.streamInfo[e] = this.extraStreamInfo[e]);
					},
					lock: function() {
						if (this.isLocked) throw Error("The stream '" + this + "' has already been used.");
						this.isLocked = !0, this.previous && this.previous.lock();
					},
					toString: function() {
						var e = "Worker " + this.name;
						return this.previous ? this.previous + " -> " + e : e;
					}
				}, t.exports = n;
			}, {}],
			29: [function(e, t, m) {
				var v = e("../utils"), y = e("./ConvertWorker"), x = e("./GenericWorker"), S = e("../base64"), C = e("../support"), w = e("../external"), E = null;
				if (C.nodestream) try {
					E = e("../nodejs/NodejsStreamOutputAdapter");
				} catch {}
				function l(e, t) {
					return new w.Promise(function(m, y) {
						var x = [], C = e._internalType, w = e._outputType, E = e._mimeType;
						e.on("data", function(e, m) {
							x.push(e), t && t(m);
						}).on("error", function(e) {
							x = [], y(e);
						}).on("end", function() {
							try {
								m(function(e, t, m) {
									switch (e) {
										case "blob": return v.newBlob(v.transformTo("arraybuffer", t), m);
										case "base64": return S.encode(t);
										default: return v.transformTo(e, t);
									}
								}(w, function(e, t) {
									var m, v = 0, y = null, x = 0;
									for (m = 0; m < t.length; m++) x += t[m].length;
									switch (e) {
										case "string": return t.join("");
										case "array": return Array.prototype.concat.apply([], t);
										case "uint8array":
											for (y = new Uint8Array(x), m = 0; m < t.length; m++) y.set(t[m], v), v += t[m].length;
											return y;
										case "nodebuffer": return Buffer.concat(t);
										default: throw Error("concat : unsupported type '" + e + "'");
									}
								}(C, x), E));
							} catch (e) {
								y(e);
							}
							x = [];
						}).resume();
					});
				}
				function f(e, t, m) {
					var S = t;
					switch (t) {
						case "blob":
						case "arraybuffer":
							S = "uint8array";
							break;
						case "base64": S = "string";
					}
					try {
						this._internalType = S, this._outputType = t, this._mimeType = m, v.checkSupport(S), this._worker = e.pipe(new y(S)), e.lock();
					} catch (e) {
						this._worker = new x("error"), this._worker.error(e);
					}
				}
				f.prototype = {
					accumulate: function(e) {
						return l(this, e);
					},
					on: function(e, t) {
						var m = this;
						return e === "data" ? this._worker.on(e, function(e) {
							t.call(m, e.data, e.meta);
						}) : this._worker.on(e, function() {
							v.delay(t, arguments, m);
						}), this;
					},
					resume: function() {
						return v.delay(this._worker.resume, [], this._worker), this;
					},
					pause: function() {
						return this._worker.pause(), this;
					},
					toNodejsStream: function(e) {
						if (v.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw Error(this._outputType + " is not supported by this method");
						return new E(this, { objectMode: this._outputType !== "nodebuffer" }, e);
					}
				}, t.exports = f;
			}, {
				"../base64": 1,
				"../external": 6,
				"../nodejs/NodejsStreamOutputAdapter": 13,
				"../support": 30,
				"../utils": 32,
				"./ConvertWorker": 24,
				"./GenericWorker": 28
			}],
			30: [function(e, t, m) {
				if (m.base64 = !0, m.array = !0, m.string = !0, m.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", m.nodebuffer = typeof Buffer < "u", m.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") m.blob = !1;
				else {
					var v = /* @__PURE__ */ new ArrayBuffer(0);
					try {
						m.blob = new Blob([v], { type: "application/zip" }).size === 0;
					} catch {
						try {
							var y = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							y.append(v), m.blob = y.getBlob("application/zip").size === 0;
						} catch {
							m.blob = !1;
						}
					}
				}
				try {
					m.nodestream = !!e("readable-stream").Readable;
				} catch {
					m.nodestream = !1;
				}
			}, { "readable-stream": 16 }],
			31: [function(e, t, m) {
				for (var v = e("./utils"), y = e("./support"), x = e("./nodejsUtils"), S = e("./stream/GenericWorker"), C = Array(256), w = 0; w < 256; w++) C[w] = 252 <= w ? 6 : 248 <= w ? 5 : 240 <= w ? 4 : 224 <= w ? 3 : 192 <= w ? 2 : 1;
				C[254] = C[254] = 1;
				function a() {
					S.call(this, "utf-8 decode"), this.leftOver = null;
				}
				function l() {
					S.call(this, "utf-8 encode");
				}
				m.utf8encode = function(e) {
					return y.nodebuffer ? x.newBufferFrom(e, "utf-8") : function(e) {
						var t, m, v, x, S, C = e.length, w = 0;
						for (x = 0; x < C; x++) (64512 & (m = e.charCodeAt(x))) == 55296 && x + 1 < C && (64512 & (v = e.charCodeAt(x + 1))) == 56320 && (m = 65536 + (m - 55296 << 10) + (v - 56320), x++), w += m < 128 ? 1 : m < 2048 ? 2 : m < 65536 ? 3 : 4;
						for (t = y.uint8array ? new Uint8Array(w) : Array(w), x = S = 0; S < w; x++) (64512 & (m = e.charCodeAt(x))) == 55296 && x + 1 < C && (64512 & (v = e.charCodeAt(x + 1))) == 56320 && (m = 65536 + (m - 55296 << 10) + (v - 56320), x++), m < 128 ? t[S++] = m : (m < 2048 ? t[S++] = 192 | m >>> 6 : (m < 65536 ? t[S++] = 224 | m >>> 12 : (t[S++] = 240 | m >>> 18, t[S++] = 128 | m >>> 12 & 63), t[S++] = 128 | m >>> 6 & 63), t[S++] = 128 | 63 & m);
						return t;
					}(e);
				}, m.utf8decode = function(e) {
					return y.nodebuffer ? v.transformTo("nodebuffer", e).toString("utf-8") : function(e) {
						var t, m, y, x, S = e.length, w = Array(2 * S);
						for (t = m = 0; t < S;) if ((y = e[t++]) < 128) w[m++] = y;
						else if (4 < (x = C[y])) w[m++] = 65533, t += x - 1;
						else {
							for (y &= x === 2 ? 31 : x === 3 ? 15 : 7; 1 < x && t < S;) y = y << 6 | 63 & e[t++], x--;
							1 < x ? w[m++] = 65533 : y < 65536 ? w[m++] = y : (y -= 65536, w[m++] = 55296 | y >> 10 & 1023, w[m++] = 56320 | 1023 & y);
						}
						return w.length !== m && (w.subarray ? w = w.subarray(0, m) : w.length = m), v.applyFromCharCode(w);
					}(e = v.transformTo(y.uint8array ? "uint8array" : "array", e));
				}, v.inherits(a, S), a.prototype.processChunk = function(e) {
					var t = v.transformTo(y.uint8array ? "uint8array" : "array", e.data);
					if (this.leftOver && this.leftOver.length) {
						if (y.uint8array) {
							var x = t;
							(t = new Uint8Array(x.length + this.leftOver.length)).set(this.leftOver, 0), t.set(x, this.leftOver.length);
						} else t = this.leftOver.concat(t);
						this.leftOver = null;
					}
					var S = function(e, t) {
						var m;
						for ((t ||= e.length) > e.length && (t = e.length), m = t - 1; 0 <= m && (192 & e[m]) == 128;) m--;
						return m < 0 || m === 0 ? t : m + C[e[m]] > t ? m : t;
					}(t), w = t;
					S !== t.length && (y.uint8array ? (w = t.subarray(0, S), this.leftOver = t.subarray(S, t.length)) : (w = t.slice(0, S), this.leftOver = t.slice(S, t.length))), this.push({
						data: m.utf8decode(w),
						meta: e.meta
					});
				}, a.prototype.flush = function() {
					this.leftOver && this.leftOver.length && (this.push({
						data: m.utf8decode(this.leftOver),
						meta: {}
					}), this.leftOver = null);
				}, m.Utf8DecodeWorker = a, v.inherits(l, S), l.prototype.processChunk = function(e) {
					this.push({
						data: m.utf8encode(e.data),
						meta: e.meta
					});
				}, m.Utf8EncodeWorker = l;
			}, {
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./support": 30,
				"./utils": 32
			}],
			32: [function(e, t, m) {
				var v = e("./support"), y = e("./base64"), x = e("./nodejsUtils"), S = e("./external");
				function n(e) {
					return e;
				}
				function l(e, t) {
					for (var m = 0; m < e.length; ++m) t[m] = 255 & e.charCodeAt(m);
					return t;
				}
				e("setimmediate"), m.newBlob = function(e, t) {
					m.checkSupport("blob");
					try {
						return new Blob([e], { type: t });
					} catch {
						try {
							var v = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							return v.append(e), v.getBlob(t);
						} catch {
							throw Error("Bug : can't construct the Blob.");
						}
					}
				};
				var C = {
					stringifyByChunk: function(e, t, m) {
						var v = [], y = 0, x = e.length;
						if (x <= m) return String.fromCharCode.apply(null, e);
						for (; y < x;) t === "array" || t === "nodebuffer" ? v.push(String.fromCharCode.apply(null, e.slice(y, Math.min(y + m, x)))) : v.push(String.fromCharCode.apply(null, e.subarray(y, Math.min(y + m, x)))), y += m;
						return v.join("");
					},
					stringifyByChar: function(e) {
						for (var t = "", m = 0; m < e.length; m++) t += String.fromCharCode(e[m]);
						return t;
					},
					applyCanBeUsed: {
						uint8array: function() {
							try {
								return v.uint8array && String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1)).length === 1;
							} catch {
								return !1;
							}
						}(),
						nodebuffer: function() {
							try {
								return v.nodebuffer && String.fromCharCode.apply(null, x.allocBuffer(1)).length === 1;
							} catch {
								return !1;
							}
						}()
					}
				};
				function s(e) {
					var t = 65536, v = m.getTypeOf(e), y = !0;
					if (v === "uint8array" ? y = C.applyCanBeUsed.uint8array : v === "nodebuffer" && (y = C.applyCanBeUsed.nodebuffer), y) for (; 1 < t;) try {
						return C.stringifyByChunk(e, v, t);
					} catch {
						t = Math.floor(t / 2);
					}
					return C.stringifyByChar(e);
				}
				function f(e, t) {
					for (var m = 0; m < e.length; m++) t[m] = e[m];
					return t;
				}
				m.applyFromCharCode = s;
				var w = {};
				w.string = {
					string: n,
					array: function(e) {
						return l(e, Array(e.length));
					},
					arraybuffer: function(e) {
						return w.string.uint8array(e).buffer;
					},
					uint8array: function(e) {
						return l(e, new Uint8Array(e.length));
					},
					nodebuffer: function(e) {
						return l(e, x.allocBuffer(e.length));
					}
				}, w.array = {
					string: s,
					array: n,
					arraybuffer: function(e) {
						return new Uint8Array(e).buffer;
					},
					uint8array: function(e) {
						return new Uint8Array(e);
					},
					nodebuffer: function(e) {
						return x.newBufferFrom(e);
					}
				}, w.arraybuffer = {
					string: function(e) {
						return s(new Uint8Array(e));
					},
					array: function(e) {
						return f(new Uint8Array(e), Array(e.byteLength));
					},
					arraybuffer: n,
					uint8array: function(e) {
						return new Uint8Array(e);
					},
					nodebuffer: function(e) {
						return x.newBufferFrom(new Uint8Array(e));
					}
				}, w.uint8array = {
					string: s,
					array: function(e) {
						return f(e, Array(e.length));
					},
					arraybuffer: function(e) {
						return e.buffer;
					},
					uint8array: n,
					nodebuffer: function(e) {
						return x.newBufferFrom(e);
					}
				}, w.nodebuffer = {
					string: s,
					array: function(e) {
						return f(e, Array(e.length));
					},
					arraybuffer: function(e) {
						return w.nodebuffer.uint8array(e).buffer;
					},
					uint8array: function(e) {
						return f(e, new Uint8Array(e.length));
					},
					nodebuffer: n
				}, m.transformTo = function(e, t) {
					return t ||= "", e ? (m.checkSupport(e), w[m.getTypeOf(t)][e](t)) : t;
				}, m.resolve = function(e) {
					for (var t = e.split("/"), m = [], v = 0; v < t.length; v++) {
						var y = t[v];
						y === "." || y === "" && v !== 0 && v !== t.length - 1 || (y === ".." ? m.pop() : m.push(y));
					}
					return m.join("/");
				}, m.getTypeOf = function(e) {
					return typeof e == "string" ? "string" : Object.prototype.toString.call(e) === "[object Array]" ? "array" : v.nodebuffer && x.isBuffer(e) ? "nodebuffer" : v.uint8array && e instanceof Uint8Array ? "uint8array" : v.arraybuffer && e instanceof ArrayBuffer ? "arraybuffer" : void 0;
				}, m.checkSupport = function(e) {
					if (!v[e.toLowerCase()]) throw Error(e + " is not supported by this platform");
				}, m.MAX_VALUE_16BITS = 65535, m.MAX_VALUE_32BITS = -1, m.pretty = function(e) {
					var t, m, v = "";
					for (m = 0; m < (e || "").length; m++) v += "\\x" + ((t = e.charCodeAt(m)) < 16 ? "0" : "") + t.toString(16).toUpperCase();
					return v;
				}, m.delay = function(e, t, m) {
					setImmediate(function() {
						e.apply(m || null, t || []);
					});
				}, m.inherits = function(e, t) {
					function r() {}
					r.prototype = t.prototype, e.prototype = new r();
				}, m.extend = function() {
					var e, t, m = {};
					for (e = 0; e < arguments.length; e++) for (t in arguments[e]) Object.prototype.hasOwnProperty.call(arguments[e], t) && m[t] === void 0 && (m[t] = arguments[e][t]);
					return m;
				}, m.prepareContent = function(e, t, x, C, w) {
					return S.Promise.resolve(t).then(function(e) {
						return v.blob && (e instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(e)) !== -1) && typeof FileReader < "u" ? new S.Promise(function(t, m) {
							var v = new FileReader();
							v.onload = function(e) {
								t(e.target.result);
							}, v.onerror = function(e) {
								m(e.target.error);
							}, v.readAsArrayBuffer(e);
						}) : e;
					}).then(function(t) {
						var E = m.getTypeOf(t);
						return E ? (E === "arraybuffer" ? t = m.transformTo("uint8array", t) : E === "string" && (w ? t = y.decode(t) : x && !0 !== C && (t = function(e) {
							return l(e, v.uint8array ? new Uint8Array(e.length) : Array(e.length));
						}(t))), t) : S.Promise.reject(/* @__PURE__ */ Error("Can't read the data of '" + e + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
					});
				};
			}, {
				"./base64": 1,
				"./external": 6,
				"./nodejsUtils": 14,
				"./support": 30,
				setimmediate: 54
			}],
			33: [function(e, t, m) {
				var v = e("./reader/readerFor"), y = e("./utils"), x = e("./signature"), S = e("./zipEntry"), C = e("./support");
				function h(e) {
					this.files = [], this.loadOptions = e;
				}
				h.prototype = {
					checkSignature: function(e) {
						if (!this.reader.readAndCheckSignature(e)) {
							this.reader.index -= 4;
							var t = this.reader.readString(4);
							throw Error("Corrupted zip or bug: unexpected signature (" + y.pretty(t) + ", expected " + y.pretty(e) + ")");
						}
					},
					isSignature: function(e, t) {
						var m = this.reader.index;
						this.reader.setIndex(e);
						var v = this.reader.readString(4) === t;
						return this.reader.setIndex(m), v;
					},
					readBlockEndOfCentral: function() {
						this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
						var e = this.reader.readData(this.zipCommentLength), t = C.uint8array ? "uint8array" : "array", m = y.transformTo(t, e);
						this.zipComment = this.loadOptions.decodeFileName(m);
					},
					readBlockZip64EndOfCentral: function() {
						this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
						for (var e, t, m, v = this.zip64EndOfCentralSize - 44; 0 < v;) e = this.reader.readInt(2), t = this.reader.readInt(4), m = this.reader.readData(t), this.zip64ExtensibleData[e] = {
							id: e,
							length: t,
							value: m
						};
					},
					readBlockZip64EndOfCentralLocator: function() {
						if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw Error("Multi-volumes zip are not supported");
					},
					readLocalFiles: function() {
						for (var e = 0, t; e < this.files.length; e++) t = this.files[e], this.reader.setIndex(t.localHeaderOffset), this.checkSignature(x.LOCAL_FILE_HEADER), t.readLocalPart(this.reader), t.handleUTF8(), t.processAttributes();
					},
					readCentralDir: function() {
						var e;
						for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(x.CENTRAL_FILE_HEADER);) (e = new S({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e);
						if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
					},
					readEndOfCentral: function() {
						var e = this.reader.lastIndexOfSignature(x.CENTRAL_DIRECTORY_END);
						if (e < 0) throw this.isSignature(0, x.LOCAL_FILE_HEADER) ? /* @__PURE__ */ Error("Corrupted zip: can't find end of central directory") : /* @__PURE__ */ Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
						this.reader.setIndex(e);
						var t = e;
						if (this.checkSignature(x.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === y.MAX_VALUE_16BITS || this.diskWithCentralDirStart === y.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === y.MAX_VALUE_16BITS || this.centralDirRecords === y.MAX_VALUE_16BITS || this.centralDirSize === y.MAX_VALUE_32BITS || this.centralDirOffset === y.MAX_VALUE_32BITS) {
							if (this.zip64 = !0, (e = this.reader.lastIndexOfSignature(x.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
							if (this.reader.setIndex(e), this.checkSignature(x.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, x.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(x.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw Error("Corrupted zip: can't find the ZIP64 end of central directory");
							this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(x.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
						}
						var m = this.centralDirOffset + this.centralDirSize;
						this.zip64 && (m += 20, m += 12 + this.zip64EndOfCentralSize);
						var v = t - m;
						if (0 < v) this.isSignature(t, x.CENTRAL_FILE_HEADER) || (this.reader.zero = v);
						else if (v < 0) throw Error("Corrupted zip: missing " + Math.abs(v) + " bytes.");
					},
					prepareReader: function(e) {
						this.reader = v(e);
					},
					load: function(e) {
						this.prepareReader(e), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
					}
				}, t.exports = h;
			}, {
				"./reader/readerFor": 22,
				"./signature": 23,
				"./support": 30,
				"./utils": 32,
				"./zipEntry": 34
			}],
			34: [function(e, t, m) {
				var v = e("./reader/readerFor"), y = e("./utils"), x = e("./compressedObject"), S = e("./crc32"), C = e("./utf8"), w = e("./compressions"), E = e("./support");
				function l(e, t) {
					this.options = e, this.loadOptions = t;
				}
				l.prototype = {
					isEncrypted: function() {
						return (1 & this.bitFlag) == 1;
					},
					useUTF8: function() {
						return (2048 & this.bitFlag) == 2048;
					},
					readLocalPart: function(e) {
						var t, m;
						if (e.skip(22), this.fileNameLength = e.readInt(2), m = e.readInt(2), this.fileName = e.readData(this.fileNameLength), e.skip(m), this.compressedSize === -1 || this.uncompressedSize === -1) throw Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
						if ((t = function(e) {
							for (var t in w) if (Object.prototype.hasOwnProperty.call(w, t) && w[t].magic === e) return w[t];
							return null;
						}(this.compressionMethod)) === null) throw Error("Corrupted zip : compression " + y.pretty(this.compressionMethod) + " unknown (inner file : " + y.transformTo("string", this.fileName) + ")");
						this.decompressed = new x(this.compressedSize, this.uncompressedSize, this.crc32, t, e.readData(this.compressedSize));
					},
					readCentralPart: function(e) {
						this.versionMadeBy = e.readInt(2), e.skip(2), this.bitFlag = e.readInt(2), this.compressionMethod = e.readString(2), this.date = e.readDate(), this.crc32 = e.readInt(4), this.compressedSize = e.readInt(4), this.uncompressedSize = e.readInt(4);
						var t = e.readInt(2);
						if (this.extraFieldsLength = e.readInt(2), this.fileCommentLength = e.readInt(2), this.diskNumberStart = e.readInt(2), this.internalFileAttributes = e.readInt(2), this.externalFileAttributes = e.readInt(4), this.localHeaderOffset = e.readInt(4), this.isEncrypted()) throw Error("Encrypted zip are not supported");
						e.skip(t), this.readExtraFields(e), this.parseZIP64ExtraField(e), this.fileComment = e.readData(this.fileCommentLength);
					},
					processAttributes: function() {
						this.unixPermissions = null, this.dosPermissions = null;
						var e = this.versionMadeBy >> 8;
						this.dir = !!(16 & this.externalFileAttributes), e == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), e == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
					},
					parseZIP64ExtraField: function() {
						if (this.extraFields[1]) {
							var e = v(this.extraFields[1].value);
							this.uncompressedSize === y.MAX_VALUE_32BITS && (this.uncompressedSize = e.readInt(8)), this.compressedSize === y.MAX_VALUE_32BITS && (this.compressedSize = e.readInt(8)), this.localHeaderOffset === y.MAX_VALUE_32BITS && (this.localHeaderOffset = e.readInt(8)), this.diskNumberStart === y.MAX_VALUE_32BITS && (this.diskNumberStart = e.readInt(4));
						}
					},
					readExtraFields: function(e) {
						var t, m, v, y = e.index + this.extraFieldsLength;
						for (this.extraFields ||= {}; e.index + 4 < y;) t = e.readInt(2), m = e.readInt(2), v = e.readData(m), this.extraFields[t] = {
							id: t,
							length: m,
							value: v
						};
						e.setIndex(y);
					},
					handleUTF8: function() {
						var e = E.uint8array ? "uint8array" : "array";
						if (this.useUTF8()) this.fileNameStr = C.utf8decode(this.fileName), this.fileCommentStr = C.utf8decode(this.fileComment);
						else {
							var t = this.findExtraFieldUnicodePath();
							if (t !== null) this.fileNameStr = t;
							else {
								var m = y.transformTo(e, this.fileName);
								this.fileNameStr = this.loadOptions.decodeFileName(m);
							}
							var v = this.findExtraFieldUnicodeComment();
							if (v !== null) this.fileCommentStr = v;
							else {
								var x = y.transformTo(e, this.fileComment);
								this.fileCommentStr = this.loadOptions.decodeFileName(x);
							}
						}
					},
					findExtraFieldUnicodePath: function() {
						var e = this.extraFields[28789];
						if (e) {
							var t = v(e.value);
							return t.readInt(1) === 1 && S(this.fileName) === t.readInt(4) ? C.utf8decode(t.readData(e.length - 5)) : null;
						}
						return null;
					},
					findExtraFieldUnicodeComment: function() {
						var e = this.extraFields[25461];
						if (e) {
							var t = v(e.value);
							return t.readInt(1) === 1 && S(this.fileComment) === t.readInt(4) ? C.utf8decode(t.readData(e.length - 5)) : null;
						}
						return null;
					}
				}, t.exports = l;
			}, {
				"./compressedObject": 2,
				"./compressions": 3,
				"./crc32": 4,
				"./reader/readerFor": 22,
				"./support": 30,
				"./utf8": 31,
				"./utils": 32
			}],
			35: [function(e, t, m) {
				function n(e, t, m) {
					this.name = e, this.dir = m.dir, this.date = m.date, this.comment = m.comment, this.unixPermissions = m.unixPermissions, this.dosPermissions = m.dosPermissions, this._data = t, this._dataBinary = m.binary, this.options = {
						compression: m.compression,
						compressionOptions: m.compressionOptions
					};
				}
				var v = e("./stream/StreamHelper"), y = e("./stream/DataWorker"), x = e("./utf8"), S = e("./compressedObject"), C = e("./stream/GenericWorker");
				n.prototype = {
					internalStream: function(e) {
						var t = null, m = "string";
						try {
							if (!e) throw Error("No output type specified.");
							var y = (m = e.toLowerCase()) === "string" || m === "text";
							m !== "binarystring" && m !== "text" || (m = "string"), t = this._decompressWorker();
							var S = !this._dataBinary;
							S && !y && (t = t.pipe(new x.Utf8EncodeWorker())), !S && y && (t = t.pipe(new x.Utf8DecodeWorker()));
						} catch (e) {
							(t = new C("error")).error(e);
						}
						return new v(t, m, "");
					},
					async: function(e, t) {
						return this.internalStream(e).accumulate(t);
					},
					nodeStream: function(e, t) {
						return this.internalStream(e || "nodebuffer").toNodejsStream(t);
					},
					_compressWorker: function(e, t) {
						if (this._data instanceof S && this._data.compression.magic === e.magic) return this._data.getCompressedWorker();
						var m = this._decompressWorker();
						return this._dataBinary || (m = m.pipe(new x.Utf8EncodeWorker())), S.createWorkerFrom(m, e, t);
					},
					_decompressWorker: function() {
						return this._data instanceof S ? this._data.getContentWorker() : this._data instanceof C ? this._data : new y(this._data);
					}
				};
				for (var w = [
					"asText",
					"asBinary",
					"asNodeBuffer",
					"asUint8Array",
					"asArrayBuffer"
				], l = function() {
					throw Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
				}, E = 0; E < w.length; E++) n.prototype[w[E]] = l;
				t.exports = n;
			}, {
				"./compressedObject": 2,
				"./stream/DataWorker": 27,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31
			}],
			36: [function(e, m, v) {
				(function(e) {
					var r, t, v = e.MutationObserver || e.WebKitMutationObserver;
					if (v) {
						var y = 0, x = new v(u), S = e.document.createTextNode("");
						x.observe(S, { characterData: !0 }), r = function() {
							S.data = y = ++y % 2;
						};
					} else if (e.setImmediate || e.MessageChannel === void 0) r = "document" in e && "onreadystatechange" in e.document.createElement("script") ? function() {
						var t = e.document.createElement("script");
						t.onreadystatechange = function() {
							u(), t.onreadystatechange = null, t.parentNode.removeChild(t), t = null;
						}, e.document.documentElement.appendChild(t);
					} : function() {
						setTimeout(u, 0);
					};
					else {
						var C = new e.MessageChannel();
						C.port1.onmessage = u, r = function() {
							C.port2.postMessage(0);
						};
					}
					var w = [];
					function u() {
						var e, m;
						t = !0;
						for (var v = w.length; v;) {
							for (m = w, w = [], e = -1; ++e < v;) m[e]();
							v = w.length;
						}
						t = !1;
					}
					m.exports = function(e) {
						w.push(e) !== 1 || t || r();
					};
				}).call(this, t === void 0 ? typeof self < "u" ? self : typeof window < "u" ? window : {} : t);
			}, {}],
			37: [function(e, t, m) {
				var v = e("immediate");
				function u() {}
				var y = {}, x = ["REJECTED"], S = ["FULFILLED"], C = ["PENDING"];
				function o(e) {
					if (typeof e != "function") throw TypeError("resolver must be a function");
					this.state = C, this.queue = [], this.outcome = void 0, e !== u && d(this, e);
				}
				function h(e, t, m) {
					this.promise = e, typeof t == "function" && (this.onFulfilled = t, this.callFulfilled = this.otherCallFulfilled), typeof m == "function" && (this.onRejected = m, this.callRejected = this.otherCallRejected);
				}
				function f(e, t, m) {
					v(function() {
						var v;
						try {
							v = t(m);
						} catch (t) {
							return y.reject(e, t);
						}
						v === e ? y.reject(e, /* @__PURE__ */ TypeError("Cannot resolve promise with itself")) : y.resolve(e, v);
					});
				}
				function c(e) {
					var t = e && e.then;
					if (e && (typeof e == "object" || typeof e == "function") && typeof t == "function") return function() {
						t.apply(e, arguments);
					};
				}
				function d(e, t) {
					var m = !1;
					function n(t) {
						m || (m = !0, y.reject(e, t));
					}
					function i(t) {
						m || (m = !0, y.resolve(e, t));
					}
					var v = p(function() {
						t(i, n);
					});
					v.status === "error" && n(v.value);
				}
				function p(e, t) {
					var m = {};
					try {
						m.value = e(t), m.status = "success";
					} catch (e) {
						m.status = "error", m.value = e;
					}
					return m;
				}
				(t.exports = o).prototype.finally = function(e) {
					if (typeof e != "function") return this;
					var t = this.constructor;
					return this.then(function(m) {
						return t.resolve(e()).then(function() {
							return m;
						});
					}, function(m) {
						return t.resolve(e()).then(function() {
							throw m;
						});
					});
				}, o.prototype.catch = function(e) {
					return this.then(null, e);
				}, o.prototype.then = function(e, t) {
					if (typeof e != "function" && this.state === S || typeof t != "function" && this.state === x) return this;
					var m = new this.constructor(u);
					return this.state === C ? this.queue.push(new h(m, e, t)) : f(m, this.state === S ? e : t, this.outcome), m;
				}, h.prototype.callFulfilled = function(e) {
					y.resolve(this.promise, e);
				}, h.prototype.otherCallFulfilled = function(e) {
					f(this.promise, this.onFulfilled, e);
				}, h.prototype.callRejected = function(e) {
					y.reject(this.promise, e);
				}, h.prototype.otherCallRejected = function(e) {
					f(this.promise, this.onRejected, e);
				}, y.resolve = function(e, t) {
					var m = p(c, t);
					if (m.status === "error") return y.reject(e, m.value);
					var v = m.value;
					if (v) d(e, v);
					else {
						e.state = S, e.outcome = t;
						for (var x = -1, C = e.queue.length; ++x < C;) e.queue[x].callFulfilled(t);
					}
					return e;
				}, y.reject = function(e, t) {
					e.state = x, e.outcome = t;
					for (var m = -1, v = e.queue.length; ++m < v;) e.queue[m].callRejected(t);
					return e;
				}, o.resolve = function(e) {
					return e instanceof this ? e : y.resolve(new this(u), e);
				}, o.reject = function(e) {
					var t = new this(u);
					return y.reject(t, e);
				}, o.all = function(e) {
					var t = this;
					if (Object.prototype.toString.call(e) !== "[object Array]") return this.reject(/* @__PURE__ */ TypeError("must be an array"));
					var m = e.length, v = !1;
					if (!m) return this.resolve([]);
					for (var x = Array(m), S = 0, C = -1, w = new this(u); ++C < m;) h(e[C], C);
					return w;
					function h(e, C) {
						t.resolve(e).then(function(e) {
							x[C] = e, ++S !== m || v || (v = !0, y.resolve(w, x));
						}, function(e) {
							v || (v = !0, y.reject(w, e));
						});
					}
				}, o.race = function(e) {
					var t = this;
					if (Object.prototype.toString.call(e) !== "[object Array]") return this.reject(/* @__PURE__ */ TypeError("must be an array"));
					var m = e.length, v = !1;
					if (!m) return this.resolve([]);
					for (var x = -1, S = new this(u); ++x < m;) C = e[x], t.resolve(C).then(function(e) {
						v || (v = !0, y.resolve(S, e));
					}, function(e) {
						v || (v = !0, y.reject(S, e));
					});
					var C;
					return S;
				};
			}, { immediate: 36 }],
			38: [function(e, t, m) {
				var v = {};
				(0, e("./lib/utils/common").assign)(v, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = v;
			}, {
				"./lib/deflate": 39,
				"./lib/inflate": 40,
				"./lib/utils/common": 41,
				"./lib/zlib/constants": 44
			}],
			39: [function(e, t, m) {
				var v = e("./zlib/deflate"), y = e("./utils/common"), x = e("./utils/strings"), S = e("./zlib/messages"), C = e("./zlib/zstream"), w = Object.prototype.toString, E = 0, O = -1, k = 0, ee = 8;
				function p(e) {
					if (!(this instanceof p)) return new p(e);
					this.options = y.assign({
						level: O,
						method: ee,
						chunkSize: 16384,
						windowBits: 15,
						memLevel: 8,
						strategy: k,
						to: ""
					}, e || {});
					var t = this.options;
					t.raw && 0 < t.windowBits ? t.windowBits = -t.windowBits : t.gzip && 0 < t.windowBits && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new C(), this.strm.avail_out = 0;
					var m = v.deflateInit2(this.strm, t.level, t.method, t.windowBits, t.memLevel, t.strategy);
					if (m !== E) throw Error(S[m]);
					if (t.header && v.deflateSetHeader(this.strm, t.header), t.dictionary) {
						var I = typeof t.dictionary == "string" ? x.string2buf(t.dictionary) : w.call(t.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(t.dictionary) : t.dictionary;
						if ((m = v.deflateSetDictionary(this.strm, I)) !== E) throw Error(S[m]);
						this._dict_set = !0;
					}
				}
				function n(e, t) {
					var m = new p(t);
					if (m.push(e, !0), m.err) throw m.msg || S[m.err];
					return m.result;
				}
				p.prototype.push = function(e, t) {
					var m, S, C = this.strm, O = this.options.chunkSize;
					if (this.ended) return !1;
					S = t === ~~t ? t : !0 === t ? 4 : 0, C.input = typeof e == "string" ? x.string2buf(e) : w.call(e) === "[object ArrayBuffer]" ? new Uint8Array(e) : e, C.next_in = 0, C.avail_in = C.input.length;
					do {
						if (C.avail_out === 0 && (C.output = new y.Buf8(O), C.next_out = 0, C.avail_out = O), (m = v.deflate(C, S)) !== 1 && m !== E) return this.onEnd(m), !(this.ended = !0);
						C.avail_out !== 0 && (C.avail_in !== 0 || S !== 4 && S !== 2) || (this.options.to === "string" ? this.onData(x.buf2binstring(y.shrinkBuf(C.output, C.next_out))) : this.onData(y.shrinkBuf(C.output, C.next_out)));
					} while ((0 < C.avail_in || C.avail_out === 0) && m !== 1);
					return S === 4 ? (m = v.deflateEnd(this.strm), this.onEnd(m), this.ended = !0, m === E) : S !== 2 || (this.onEnd(E), !(C.avail_out = 0));
				}, p.prototype.onData = function(e) {
					this.chunks.push(e);
				}, p.prototype.onEnd = function(e) {
					e === E && (this.result = this.options.to === "string" ? this.chunks.join("") : y.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
				}, m.Deflate = p, m.deflate = n, m.deflateRaw = function(e, t) {
					return (t ||= {}).raw = !0, n(e, t);
				}, m.gzip = function(e, t) {
					return (t ||= {}).gzip = !0, n(e, t);
				};
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/deflate": 46,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			40: [function(e, t, m) {
				var v = e("./zlib/inflate"), y = e("./utils/common"), x = e("./utils/strings"), S = e("./zlib/constants"), C = e("./zlib/messages"), w = e("./zlib/zstream"), E = e("./zlib/gzheader"), O = Object.prototype.toString;
				function a(e) {
					if (!(this instanceof a)) return new a(e);
					this.options = y.assign({
						chunkSize: 16384,
						windowBits: 0,
						to: ""
					}, e || {});
					var t = this.options;
					t.raw && 0 <= t.windowBits && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), !(0 <= t.windowBits && t.windowBits < 16) || e && e.windowBits || (t.windowBits += 32), 15 < t.windowBits && t.windowBits < 48 && !(15 & t.windowBits) && (t.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new w(), this.strm.avail_out = 0;
					var m = v.inflateInit2(this.strm, t.windowBits);
					if (m !== S.Z_OK) throw Error(C[m]);
					this.header = new E(), v.inflateGetHeader(this.strm, this.header);
				}
				function o(e, t) {
					var m = new a(t);
					if (m.push(e, !0), m.err) throw m.msg || C[m.err];
					return m.result;
				}
				a.prototype.push = function(e, t) {
					var m, C, w, E, k, ee, I = this.strm, z = this.options.chunkSize, te = this.options.dictionary, ne = !1;
					if (this.ended) return !1;
					C = t === ~~t ? t : !0 === t ? S.Z_FINISH : S.Z_NO_FLUSH, I.input = typeof e == "string" ? x.binstring2buf(e) : O.call(e) === "[object ArrayBuffer]" ? new Uint8Array(e) : e, I.next_in = 0, I.avail_in = I.input.length;
					do {
						if (I.avail_out === 0 && (I.output = new y.Buf8(z), I.next_out = 0, I.avail_out = z), (m = v.inflate(I, S.Z_NO_FLUSH)) === S.Z_NEED_DICT && te && (ee = typeof te == "string" ? x.string2buf(te) : O.call(te) === "[object ArrayBuffer]" ? new Uint8Array(te) : te, m = v.inflateSetDictionary(this.strm, ee)), m === S.Z_BUF_ERROR && !0 === ne && (m = S.Z_OK, ne = !1), m !== S.Z_STREAM_END && m !== S.Z_OK) return this.onEnd(m), !(this.ended = !0);
						I.next_out && (I.avail_out !== 0 && m !== S.Z_STREAM_END && (I.avail_in !== 0 || C !== S.Z_FINISH && C !== S.Z_SYNC_FLUSH) || (this.options.to === "string" ? (w = x.utf8border(I.output, I.next_out), E = I.next_out - w, k = x.buf2string(I.output, w), I.next_out = E, I.avail_out = z - E, E && y.arraySet(I.output, I.output, w, E, 0), this.onData(k)) : this.onData(y.shrinkBuf(I.output, I.next_out)))), I.avail_in === 0 && I.avail_out === 0 && (ne = !0);
					} while ((0 < I.avail_in || I.avail_out === 0) && m !== S.Z_STREAM_END);
					return m === S.Z_STREAM_END && (C = S.Z_FINISH), C === S.Z_FINISH ? (m = v.inflateEnd(this.strm), this.onEnd(m), this.ended = !0, m === S.Z_OK) : C !== S.Z_SYNC_FLUSH || (this.onEnd(S.Z_OK), !(I.avail_out = 0));
				}, a.prototype.onData = function(e) {
					this.chunks.push(e);
				}, a.prototype.onEnd = function(e) {
					e === S.Z_OK && (this.result = this.options.to === "string" ? this.chunks.join("") : y.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
				}, m.Inflate = a, m.inflate = o, m.inflateRaw = function(e, t) {
					return (t ||= {}).raw = !0, o(e, t);
				}, m.ungzip = o;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/constants": 44,
				"./zlib/gzheader": 47,
				"./zlib/inflate": 49,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			41: [function(e, t, m) {
				var v = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
				m.assign = function(e) {
					for (var t = Array.prototype.slice.call(arguments, 1); t.length;) {
						var m = t.shift();
						if (m) {
							if (typeof m != "object") throw TypeError(m + "must be non-object");
							for (var v in m) m.hasOwnProperty(v) && (e[v] = m[v]);
						}
					}
					return e;
				}, m.shrinkBuf = function(e, t) {
					return e.length === t ? e : e.subarray ? e.subarray(0, t) : (e.length = t, e);
				};
				var y = {
					arraySet: function(e, t, m, v, y) {
						if (t.subarray && e.subarray) e.set(t.subarray(m, m + v), y);
						else for (var x = 0; x < v; x++) e[y + x] = t[m + x];
					},
					flattenChunks: function(e) {
						for (var t = v = 0, m = e.length, v, y, x, S; t < m; t++) v += e[t].length;
						for (S = new Uint8Array(v), t = y = 0, m = e.length; t < m; t++) x = e[t], S.set(x, y), y += x.length;
						return S;
					}
				}, x = {
					arraySet: function(e, t, m, v, y) {
						for (var x = 0; x < v; x++) e[y + x] = t[m + x];
					},
					flattenChunks: function(e) {
						return [].concat.apply([], e);
					}
				};
				m.setTyped = function(e) {
					e ? (m.Buf8 = Uint8Array, m.Buf16 = Uint16Array, m.Buf32 = Int32Array, m.assign(m, y)) : (m.Buf8 = Array, m.Buf16 = Array, m.Buf32 = Array, m.assign(m, x));
				}, m.setTyped(v);
			}, {}],
			42: [function(e, t, m) {
				var v = e("./common"), y = !0, x = !0;
				try {
					String.fromCharCode.apply(null, [0]);
				} catch {
					y = !1;
				}
				try {
					String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
				} catch {
					x = !1;
				}
				for (var S = new v.Buf8(256), C = 0; C < 256; C++) S[C] = 252 <= C ? 6 : 248 <= C ? 5 : 240 <= C ? 4 : 224 <= C ? 3 : 192 <= C ? 2 : 1;
				function l(e, t) {
					if (t < 65537 && (e.subarray && x || !e.subarray && y)) return String.fromCharCode.apply(null, v.shrinkBuf(e, t));
					for (var m = "", S = 0; S < t; S++) m += String.fromCharCode(e[S]);
					return m;
				}
				S[254] = S[254] = 1, m.string2buf = function(e) {
					var t, m, y, x, S, C = e.length, w = 0;
					for (x = 0; x < C; x++) (64512 & (m = e.charCodeAt(x))) == 55296 && x + 1 < C && (64512 & (y = e.charCodeAt(x + 1))) == 56320 && (m = 65536 + (m - 55296 << 10) + (y - 56320), x++), w += m < 128 ? 1 : m < 2048 ? 2 : m < 65536 ? 3 : 4;
					for (t = new v.Buf8(w), x = S = 0; S < w; x++) (64512 & (m = e.charCodeAt(x))) == 55296 && x + 1 < C && (64512 & (y = e.charCodeAt(x + 1))) == 56320 && (m = 65536 + (m - 55296 << 10) + (y - 56320), x++), m < 128 ? t[S++] = m : (m < 2048 ? t[S++] = 192 | m >>> 6 : (m < 65536 ? t[S++] = 224 | m >>> 12 : (t[S++] = 240 | m >>> 18, t[S++] = 128 | m >>> 12 & 63), t[S++] = 128 | m >>> 6 & 63), t[S++] = 128 | 63 & m);
					return t;
				}, m.buf2binstring = function(e) {
					return l(e, e.length);
				}, m.binstring2buf = function(e) {
					for (var t = new v.Buf8(e.length), m = 0, y = t.length; m < y; m++) t[m] = e.charCodeAt(m);
					return t;
				}, m.buf2string = function(e, t) {
					var m, v, y, x, C = t || e.length, w = Array(2 * C);
					for (m = v = 0; m < C;) if ((y = e[m++]) < 128) w[v++] = y;
					else if (4 < (x = S[y])) w[v++] = 65533, m += x - 1;
					else {
						for (y &= x === 2 ? 31 : x === 3 ? 15 : 7; 1 < x && m < C;) y = y << 6 | 63 & e[m++], x--;
						1 < x ? w[v++] = 65533 : y < 65536 ? w[v++] = y : (y -= 65536, w[v++] = 55296 | y >> 10 & 1023, w[v++] = 56320 | 1023 & y);
					}
					return l(w, v);
				}, m.utf8border = function(e, t) {
					var m;
					for ((t ||= e.length) > e.length && (t = e.length), m = t - 1; 0 <= m && (192 & e[m]) == 128;) m--;
					return m < 0 || m === 0 ? t : m + S[e[m]] > t ? m : t;
				};
			}, { "./common": 41 }],
			43: [function(e, t, m) {
				t.exports = function(e, t, m, v) {
					for (var y = 65535 & e | 0, x = e >>> 16 & 65535 | 0, S = 0; m !== 0;) {
						for (m -= S = 2e3 < m ? 2e3 : m; x = x + (y = y + t[v++] | 0) | 0, --S;);
						y %= 65521, x %= 65521;
					}
					return y | x << 16 | 0;
				};
			}, {}],
			44: [function(e, t, m) {
				t.exports = {
					Z_NO_FLUSH: 0,
					Z_PARTIAL_FLUSH: 1,
					Z_SYNC_FLUSH: 2,
					Z_FULL_FLUSH: 3,
					Z_FINISH: 4,
					Z_BLOCK: 5,
					Z_TREES: 6,
					Z_OK: 0,
					Z_STREAM_END: 1,
					Z_NEED_DICT: 2,
					Z_ERRNO: -1,
					Z_STREAM_ERROR: -2,
					Z_DATA_ERROR: -3,
					Z_BUF_ERROR: -5,
					Z_NO_COMPRESSION: 0,
					Z_BEST_SPEED: 1,
					Z_BEST_COMPRESSION: 9,
					Z_DEFAULT_COMPRESSION: -1,
					Z_FILTERED: 1,
					Z_HUFFMAN_ONLY: 2,
					Z_RLE: 3,
					Z_FIXED: 4,
					Z_DEFAULT_STRATEGY: 0,
					Z_BINARY: 0,
					Z_TEXT: 1,
					Z_UNKNOWN: 2,
					Z_DEFLATED: 8
				};
			}, {}],
			45: [function(e, t, m) {
				var v = function() {
					for (var e, t = [], m = 0; m < 256; m++) {
						e = m;
						for (var v = 0; v < 8; v++) e = 1 & e ? 3988292384 ^ e >>> 1 : e >>> 1;
						t[m] = e;
					}
					return t;
				}();
				t.exports = function(e, t, m, y) {
					var x = v, S = y + m;
					e ^= -1;
					for (var C = y; C < S; C++) e = e >>> 8 ^ x[255 & (e ^ t[C])];
					return -1 ^ e;
				};
			}, {}],
			46: [function(e, t, m) {
				var v, y = e("../utils/common"), x = e("./trees"), S = e("./adler32"), C = e("./crc32"), w = e("./messages"), E = 0, O = 4, k = 0, ee = -2, I = -1, z = 4, te = 2, ne = 8, B = 9, re = 286, q = 30, Q = 19, ie = 2 * re + 1, ae = 15, $ = 3, oe = 258, se = oe + $ + 1, ce = 42, le = 113, ue = 1, de = 2, fe = 3, pe = 4;
				function R(e, t) {
					return e.msg = w[t], t;
				}
				function T(e) {
					return (e << 1) - (4 < e ? 9 : 0);
				}
				function D(e) {
					for (var t = e.length; 0 <= --t;) e[t] = 0;
				}
				function F(e) {
					var t = e.state, m = t.pending;
					m > e.avail_out && (m = e.avail_out), m !== 0 && (y.arraySet(e.output, t.pending_buf, t.pending_out, m, e.next_out), e.next_out += m, t.pending_out += m, e.total_out += m, e.avail_out -= m, t.pending -= m, t.pending === 0 && (t.pending_out = 0));
				}
				function N(e, t) {
					x._tr_flush_block(e, 0 <= e.block_start ? e.block_start : -1, e.strstart - e.block_start, t), e.block_start = e.strstart, F(e.strm);
				}
				function U(e, t) {
					e.pending_buf[e.pending++] = t;
				}
				function P(e, t) {
					e.pending_buf[e.pending++] = t >>> 8 & 255, e.pending_buf[e.pending++] = 255 & t;
				}
				function L(e, t) {
					var m, v, y = e.max_chain_length, x = e.strstart, S = e.prev_length, C = e.nice_match, w = e.strstart > e.w_size - se ? e.strstart - (e.w_size - se) : 0, E = e.window, O = e.w_mask, k = e.prev, ee = e.strstart + oe, I = E[x + S - 1], z = E[x + S];
					e.prev_length >= e.good_match && (y >>= 2), C > e.lookahead && (C = e.lookahead);
					do
						if (E[(m = t) + S] === z && E[m + S - 1] === I && E[m] === E[x] && E[++m] === E[x + 1]) {
							x += 2, m++;
							do							;
while (E[++x] === E[++m] && E[++x] === E[++m] && E[++x] === E[++m] && E[++x] === E[++m] && E[++x] === E[++m] && E[++x] === E[++m] && E[++x] === E[++m] && E[++x] === E[++m] && x < ee);
							if (v = oe - (ee - x), x = ee - oe, S < v) {
								if (e.match_start = t, C <= (S = v)) break;
								I = E[x + S - 1], z = E[x + S];
							}
						}
					while ((t = k[t & O]) > w && --y != 0);
					return S <= e.lookahead ? S : e.lookahead;
				}
				function j(e) {
					var t, m, v, x, w, E, O, k, ee, I, z = e.w_size;
					do {
						if (x = e.window_size - e.lookahead - e.strstart, e.strstart >= z + (z - se)) {
							for (y.arraySet(e.window, e.window, z, z, 0), e.match_start -= z, e.strstart -= z, e.block_start -= z, t = m = e.hash_size; v = e.head[--t], e.head[t] = z <= v ? v - z : 0, --m;);
							for (t = m = z; v = e.prev[--t], e.prev[t] = z <= v ? v - z : 0, --m;);
							x += z;
						}
						if (e.strm.avail_in === 0) break;
						if (E = e.strm, O = e.window, k = e.strstart + e.lookahead, ee = x, I = void 0, I = E.avail_in, ee < I && (I = ee), m = I === 0 ? 0 : (E.avail_in -= I, y.arraySet(O, E.input, E.next_in, I, k), E.state.wrap === 1 ? E.adler = S(E.adler, O, I, k) : E.state.wrap === 2 && (E.adler = C(E.adler, O, I, k)), E.next_in += I, E.total_in += I, I), e.lookahead += m, e.lookahead + e.insert >= $) for (w = e.strstart - e.insert, e.ins_h = e.window[w], e.ins_h = (e.ins_h << e.hash_shift ^ e.window[w + 1]) & e.hash_mask; e.insert && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[w + $ - 1]) & e.hash_mask, e.prev[w & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = w, w++, e.insert--, !(e.lookahead + e.insert < $)););
					} while (e.lookahead < se && e.strm.avail_in !== 0);
				}
				function Z(e, t) {
					for (var m, v;;) {
						if (e.lookahead < se) {
							if (j(e), e.lookahead < se && t === E) return ue;
							if (e.lookahead === 0) break;
						}
						if (m = 0, e.lookahead >= $ && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + $ - 1]) & e.hash_mask, m = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), m !== 0 && e.strstart - m <= e.w_size - se && (e.match_length = L(e, m)), e.match_length >= $) {
							if (v = x._tr_tally(e, e.strstart - e.match_start, e.match_length - $), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= $) {
								for (e.match_length--; e.strstart++, e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + $ - 1]) & e.hash_mask, m = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart, --e.match_length != 0;);
								e.strstart++;
							} else e.strstart += e.match_length, e.match_length = 0, e.ins_h = e.window[e.strstart], e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + 1]) & e.hash_mask;
						} else v = x._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
						if (v && (N(e, !1), e.strm.avail_out === 0)) return ue;
					}
					return e.insert = e.strstart < $ - 1 ? e.strstart : $ - 1, t === O ? (N(e, !0), e.strm.avail_out === 0 ? fe : pe) : e.last_lit && (N(e, !1), e.strm.avail_out === 0) ? ue : de;
				}
				function W(e, t) {
					for (var m, v, y;;) {
						if (e.lookahead < se) {
							if (j(e), e.lookahead < se && t === E) return ue;
							if (e.lookahead === 0) break;
						}
						if (m = 0, e.lookahead >= $ && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + $ - 1]) & e.hash_mask, m = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = $ - 1, m !== 0 && e.prev_length < e.max_lazy_match && e.strstart - m <= e.w_size - se && (e.match_length = L(e, m), e.match_length <= 5 && (e.strategy === 1 || e.match_length === $ && 4096 < e.strstart - e.match_start) && (e.match_length = $ - 1)), e.prev_length >= $ && e.match_length <= e.prev_length) {
							for (y = e.strstart + e.lookahead - $, v = x._tr_tally(e, e.strstart - 1 - e.prev_match, e.prev_length - $), e.lookahead -= e.prev_length - 1, e.prev_length -= 2; ++e.strstart <= y && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + $ - 1]) & e.hash_mask, m = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), --e.prev_length != 0;);
							if (e.match_available = 0, e.match_length = $ - 1, e.strstart++, v && (N(e, !1), e.strm.avail_out === 0)) return ue;
						} else if (e.match_available) {
							if ((v = x._tr_tally(e, 0, e.window[e.strstart - 1])) && N(e, !1), e.strstart++, e.lookahead--, e.strm.avail_out === 0) return ue;
						} else e.match_available = 1, e.strstart++, e.lookahead--;
					}
					return e.match_available &&= (v = x._tr_tally(e, 0, e.window[e.strstart - 1]), 0), e.insert = e.strstart < $ - 1 ? e.strstart : $ - 1, t === O ? (N(e, !0), e.strm.avail_out === 0 ? fe : pe) : e.last_lit && (N(e, !1), e.strm.avail_out === 0) ? ue : de;
				}
				function M(e, t, m, v, y) {
					this.good_length = e, this.max_lazy = t, this.nice_length = m, this.max_chain = v, this.func = y;
				}
				function H() {
					this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = ne, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new y.Buf16(2 * ie), this.dyn_dtree = new y.Buf16(2 * (2 * q + 1)), this.bl_tree = new y.Buf16(2 * (2 * Q + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new y.Buf16(ae + 1), this.heap = new y.Buf16(2 * re + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new y.Buf16(2 * re + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
				}
				function G(e) {
					var t;
					return e && e.state ? (e.total_in = e.total_out = 0, e.data_type = te, (t = e.state).pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap ? ce : le, e.adler = t.wrap === 2 ? 0 : 1, t.last_flush = E, x._tr_init(t), k) : R(e, ee);
				}
				function K(e) {
					var t = G(e);
					return t === k && function(e) {
						e.window_size = 2 * e.w_size, D(e.head), e.max_lazy_match = v[e.level].max_lazy, e.good_match = v[e.level].good_length, e.nice_match = v[e.level].nice_length, e.max_chain_length = v[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = $ - 1, e.match_available = 0, e.ins_h = 0;
					}(e.state), t;
				}
				function Y(e, t, m, v, x, S) {
					if (!e) return ee;
					var C = 1;
					if (t === I && (t = 6), v < 0 ? (C = 0, v = -v) : 15 < v && (C = 2, v -= 16), x < 1 || B < x || m !== ne || v < 8 || 15 < v || t < 0 || 9 < t || S < 0 || z < S) return R(e, ee);
					v === 8 && (v = 9);
					var w = new H();
					return (e.state = w).strm = e, w.wrap = C, w.gzhead = null, w.w_bits = v, w.w_size = 1 << w.w_bits, w.w_mask = w.w_size - 1, w.hash_bits = x + 7, w.hash_size = 1 << w.hash_bits, w.hash_mask = w.hash_size - 1, w.hash_shift = ~~((w.hash_bits + $ - 1) / $), w.window = new y.Buf8(2 * w.w_size), w.head = new y.Buf16(w.hash_size), w.prev = new y.Buf16(w.w_size), w.lit_bufsize = 1 << x + 6, w.pending_buf_size = 4 * w.lit_bufsize, w.pending_buf = new y.Buf8(w.pending_buf_size), w.d_buf = 1 * w.lit_bufsize, w.l_buf = 3 * w.lit_bufsize, w.level = t, w.strategy = S, w.method = m, K(e);
				}
				v = [
					new M(0, 0, 0, 0, function(e, t) {
						var m = 65535;
						for (m > e.pending_buf_size - 5 && (m = e.pending_buf_size - 5);;) {
							if (e.lookahead <= 1) {
								if (j(e), e.lookahead === 0 && t === E) return ue;
								if (e.lookahead === 0) break;
							}
							e.strstart += e.lookahead, e.lookahead = 0;
							var v = e.block_start + m;
							if ((e.strstart === 0 || e.strstart >= v) && (e.lookahead = e.strstart - v, e.strstart = v, N(e, !1), e.strm.avail_out === 0) || e.strstart - e.block_start >= e.w_size - se && (N(e, !1), e.strm.avail_out === 0)) return ue;
						}
						return e.insert = 0, t === O ? (N(e, !0), e.strm.avail_out === 0 ? fe : pe) : (e.strstart > e.block_start && (N(e, !1), e.strm.avail_out), ue);
					}),
					new M(4, 4, 8, 4, Z),
					new M(4, 5, 16, 8, Z),
					new M(4, 6, 32, 32, Z),
					new M(4, 4, 16, 16, W),
					new M(8, 16, 32, 32, W),
					new M(8, 16, 128, 128, W),
					new M(8, 32, 128, 256, W),
					new M(32, 128, 258, 1024, W),
					new M(32, 258, 258, 4096, W)
				], m.deflateInit = function(e, t) {
					return Y(e, t, ne, 15, 8, 0);
				}, m.deflateInit2 = Y, m.deflateReset = K, m.deflateResetKeep = G, m.deflateSetHeader = function(e, t) {
					return e && e.state && e.state.wrap === 2 ? (e.state.gzhead = t, k) : ee;
				}, m.deflate = function(e, t) {
					var m, y, S, w;
					if (!e || !e.state || 5 < t || t < 0) return e ? R(e, ee) : ee;
					if (y = e.state, !e.output || !e.input && e.avail_in !== 0 || y.status === 666 && t !== O) return R(e, e.avail_out === 0 ? -5 : ee);
					if (y.strm = e, m = y.last_flush, y.last_flush = t, y.status === ce) {
						if (y.wrap === 2) e.adler = 0, U(y, 31), U(y, 139), U(y, 8), y.gzhead ? (U(y, +!!y.gzhead.text + (y.gzhead.hcrc ? 2 : 0) + (y.gzhead.extra ? 4 : 0) + (y.gzhead.name ? 8 : 0) + (y.gzhead.comment ? 16 : 0)), U(y, 255 & y.gzhead.time), U(y, y.gzhead.time >> 8 & 255), U(y, y.gzhead.time >> 16 & 255), U(y, y.gzhead.time >> 24 & 255), U(y, y.level === 9 ? 2 : 2 <= y.strategy || y.level < 2 ? 4 : 0), U(y, 255 & y.gzhead.os), y.gzhead.extra && y.gzhead.extra.length && (U(y, 255 & y.gzhead.extra.length), U(y, y.gzhead.extra.length >> 8 & 255)), y.gzhead.hcrc && (e.adler = C(e.adler, y.pending_buf, y.pending, 0)), y.gzindex = 0, y.status = 69) : (U(y, 0), U(y, 0), U(y, 0), U(y, 0), U(y, 0), U(y, y.level === 9 ? 2 : 2 <= y.strategy || y.level < 2 ? 4 : 0), U(y, 3), y.status = le);
						else {
							var I = ne + (y.w_bits - 8 << 4) << 8;
							I |= (2 <= y.strategy || y.level < 2 ? 0 : y.level < 6 ? 1 : y.level === 6 ? 2 : 3) << 6, y.strstart !== 0 && (I |= 32), I += 31 - I % 31, y.status = le, P(y, I), y.strstart !== 0 && (P(y, e.adler >>> 16), P(y, 65535 & e.adler)), e.adler = 1;
						}
					}
					if (y.status === 69) {
						if (y.gzhead.extra) {
							for (S = y.pending; y.gzindex < (65535 & y.gzhead.extra.length) && (y.pending !== y.pending_buf_size || (y.gzhead.hcrc && y.pending > S && (e.adler = C(e.adler, y.pending_buf, y.pending - S, S)), F(e), S = y.pending, y.pending !== y.pending_buf_size));) U(y, 255 & y.gzhead.extra[y.gzindex]), y.gzindex++;
							y.gzhead.hcrc && y.pending > S && (e.adler = C(e.adler, y.pending_buf, y.pending - S, S)), y.gzindex === y.gzhead.extra.length && (y.gzindex = 0, y.status = 73);
						} else y.status = 73;
					}
					if (y.status === 73) {
						if (y.gzhead.name) {
							S = y.pending;
							do {
								if (y.pending === y.pending_buf_size && (y.gzhead.hcrc && y.pending > S && (e.adler = C(e.adler, y.pending_buf, y.pending - S, S)), F(e), S = y.pending, y.pending === y.pending_buf_size)) {
									w = 1;
									break;
								}
								w = y.gzindex < y.gzhead.name.length ? 255 & y.gzhead.name.charCodeAt(y.gzindex++) : 0, U(y, w);
							} while (w !== 0);
							y.gzhead.hcrc && y.pending > S && (e.adler = C(e.adler, y.pending_buf, y.pending - S, S)), w === 0 && (y.gzindex = 0, y.status = 91);
						} else y.status = 91;
					}
					if (y.status === 91) {
						if (y.gzhead.comment) {
							S = y.pending;
							do {
								if (y.pending === y.pending_buf_size && (y.gzhead.hcrc && y.pending > S && (e.adler = C(e.adler, y.pending_buf, y.pending - S, S)), F(e), S = y.pending, y.pending === y.pending_buf_size)) {
									w = 1;
									break;
								}
								w = y.gzindex < y.gzhead.comment.length ? 255 & y.gzhead.comment.charCodeAt(y.gzindex++) : 0, U(y, w);
							} while (w !== 0);
							y.gzhead.hcrc && y.pending > S && (e.adler = C(e.adler, y.pending_buf, y.pending - S, S)), w === 0 && (y.status = 103);
						} else y.status = 103;
					}
					if (y.status === 103 && (y.gzhead.hcrc ? (y.pending + 2 > y.pending_buf_size && F(e), y.pending + 2 <= y.pending_buf_size && (U(y, 255 & e.adler), U(y, e.adler >> 8 & 255), e.adler = 0, y.status = le)) : y.status = le), y.pending !== 0) {
						if (F(e), e.avail_out === 0) return y.last_flush = -1, k;
					} else if (e.avail_in === 0 && T(t) <= T(m) && t !== O) return R(e, -5);
					if (y.status === 666 && e.avail_in !== 0) return R(e, -5);
					if (e.avail_in !== 0 || y.lookahead !== 0 || t !== E && y.status !== 666) {
						var z = y.strategy === 2 ? function(e, t) {
							for (var m;;) {
								if (e.lookahead === 0 && (j(e), e.lookahead === 0)) {
									if (t === E) return ue;
									break;
								}
								if (e.match_length = 0, m = x._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, m && (N(e, !1), e.strm.avail_out === 0)) return ue;
							}
							return e.insert = 0, t === O ? (N(e, !0), e.strm.avail_out === 0 ? fe : pe) : e.last_lit && (N(e, !1), e.strm.avail_out === 0) ? ue : de;
						}(y, t) : y.strategy === 3 ? function(e, t) {
							for (var m, v, y, S, C = e.window;;) {
								if (e.lookahead <= oe) {
									if (j(e), e.lookahead <= oe && t === E) return ue;
									if (e.lookahead === 0) break;
								}
								if (e.match_length = 0, e.lookahead >= $ && 0 < e.strstart && (v = C[y = e.strstart - 1]) === C[++y] && v === C[++y] && v === C[++y]) {
									S = e.strstart + oe;
									do									;
while (v === C[++y] && v === C[++y] && v === C[++y] && v === C[++y] && v === C[++y] && v === C[++y] && v === C[++y] && v === C[++y] && y < S);
									e.match_length = oe - (S - y), e.match_length > e.lookahead && (e.match_length = e.lookahead);
								}
								if (e.match_length >= $ ? (m = x._tr_tally(e, 1, e.match_length - $), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (m = x._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), m && (N(e, !1), e.strm.avail_out === 0)) return ue;
							}
							return e.insert = 0, t === O ? (N(e, !0), e.strm.avail_out === 0 ? fe : pe) : e.last_lit && (N(e, !1), e.strm.avail_out === 0) ? ue : de;
						}(y, t) : v[y.level].func(y, t);
						if (z !== fe && z !== pe || (y.status = 666), z === ue || z === fe) return e.avail_out === 0 && (y.last_flush = -1), k;
						if (z === de && (t === 1 ? x._tr_align(y) : t !== 5 && (x._tr_stored_block(y, 0, 0, !1), t === 3 && (D(y.head), y.lookahead === 0 && (y.strstart = 0, y.block_start = 0, y.insert = 0))), F(e), e.avail_out === 0)) return y.last_flush = -1, k;
					}
					return t === O ? y.wrap <= 0 ? 1 : (y.wrap === 2 ? (U(y, 255 & e.adler), U(y, e.adler >> 8 & 255), U(y, e.adler >> 16 & 255), U(y, e.adler >> 24 & 255), U(y, 255 & e.total_in), U(y, e.total_in >> 8 & 255), U(y, e.total_in >> 16 & 255), U(y, e.total_in >> 24 & 255)) : (P(y, e.adler >>> 16), P(y, 65535 & e.adler)), F(e), 0 < y.wrap && (y.wrap = -y.wrap), y.pending === 0 ? 1 : k) : k;
				}, m.deflateEnd = function(e) {
					var t;
					return e && e.state ? (t = e.state.status) !== ce && t !== 69 && t !== 73 && t !== 91 && t !== 103 && t !== le && t !== 666 ? R(e, ee) : (e.state = null, t === le ? R(e, -3) : k) : ee;
				}, m.deflateSetDictionary = function(e, t) {
					var m, v, x, C, w, E, O, I, z = t.length;
					if (!e || !e.state || (C = (m = e.state).wrap) === 2 || C === 1 && m.status !== ce || m.lookahead) return ee;
					for (C === 1 && (e.adler = S(e.adler, t, z, 0)), m.wrap = 0, z >= m.w_size && (C === 0 && (D(m.head), m.strstart = 0, m.block_start = 0, m.insert = 0), I = new y.Buf8(m.w_size), y.arraySet(I, t, z - m.w_size, m.w_size, 0), t = I, z = m.w_size), w = e.avail_in, E = e.next_in, O = e.input, e.avail_in = z, e.next_in = 0, e.input = t, j(m); m.lookahead >= $;) {
						for (v = m.strstart, x = m.lookahead - ($ - 1); m.ins_h = (m.ins_h << m.hash_shift ^ m.window[v + $ - 1]) & m.hash_mask, m.prev[v & m.w_mask] = m.head[m.ins_h], m.head[m.ins_h] = v, v++, --x;);
						m.strstart = v, m.lookahead = $ - 1, j(m);
					}
					return m.strstart += m.lookahead, m.block_start = m.strstart, m.insert = m.lookahead, m.lookahead = 0, m.match_length = m.prev_length = $ - 1, m.match_available = 0, e.next_in = E, e.input = O, e.avail_in = w, m.wrap = C, k;
				}, m.deflateInfo = "pako deflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./messages": 51,
				"./trees": 52
			}],
			47: [function(e, t, m) {
				t.exports = function() {
					this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
				};
			}, {}],
			48: [function(e, t, m) {
				t.exports = function(e, t) {
					var m = e.state, v = e.next_in, y, x, S, C, w, E, O, k, ee, I, z, te, ne, B, re, q, Q, ie, ae, $, oe, se = e.input, ce;
					y = v + (e.avail_in - 5), x = e.next_out, ce = e.output, S = x - (t - e.avail_out), C = x + (e.avail_out - 257), w = m.dmax, E = m.wsize, O = m.whave, k = m.wnext, ee = m.window, I = m.hold, z = m.bits, te = m.lencode, ne = m.distcode, B = (1 << m.lenbits) - 1, re = (1 << m.distbits) - 1;
					e: do {
						z < 15 && (I += se[v++] << z, z += 8, I += se[v++] << z, z += 8), q = te[I & B];
						t: for (;;) {
							if (I >>>= Q = q >>> 24, z -= Q, (Q = q >>> 16 & 255) == 0) ce[x++] = 65535 & q;
							else {
								if (!(16 & Q)) {
									if (!(64 & Q)) {
										q = te[(65535 & q) + (I & (1 << Q) - 1)];
										continue t;
									}
									if (32 & Q) {
										m.mode = 12;
										break e;
									}
									e.msg = "invalid literal/length code", m.mode = 30;
									break e;
								}
								ie = 65535 & q, (Q &= 15) && (z < Q && (I += se[v++] << z, z += 8), ie += I & (1 << Q) - 1, I >>>= Q, z -= Q), z < 15 && (I += se[v++] << z, z += 8, I += se[v++] << z, z += 8), q = ne[I & re];
								r: for (;;) {
									if (I >>>= Q = q >>> 24, z -= Q, !(16 & (Q = q >>> 16 & 255))) {
										if (!(64 & Q)) {
											q = ne[(65535 & q) + (I & (1 << Q) - 1)];
											continue r;
										}
										e.msg = "invalid distance code", m.mode = 30;
										break e;
									}
									if (ae = 65535 & q, z < (Q &= 15) && (I += se[v++] << z, (z += 8) < Q && (I += se[v++] << z, z += 8)), w < (ae += I & (1 << Q) - 1)) {
										e.msg = "invalid distance too far back", m.mode = 30;
										break e;
									}
									if (I >>>= Q, z -= Q, (Q = x - S) < ae) {
										if (O < (Q = ae - Q) && m.sane) {
											e.msg = "invalid distance too far back", m.mode = 30;
											break e;
										}
										if (oe = ee, ($ = 0) === k) {
											if ($ += E - Q, Q < ie) {
												for (ie -= Q; ce[x++] = ee[$++], --Q;);
												$ = x - ae, oe = ce;
											}
										} else if (k < Q) {
											if ($ += E + k - Q, (Q -= k) < ie) {
												for (ie -= Q; ce[x++] = ee[$++], --Q;);
												if ($ = 0, k < ie) {
													for (ie -= Q = k; ce[x++] = ee[$++], --Q;);
													$ = x - ae, oe = ce;
												}
											}
										} else if ($ += k - Q, Q < ie) {
											for (ie -= Q; ce[x++] = ee[$++], --Q;);
											$ = x - ae, oe = ce;
										}
										for (; 2 < ie;) ce[x++] = oe[$++], ce[x++] = oe[$++], ce[x++] = oe[$++], ie -= 3;
										ie && (ce[x++] = oe[$++], 1 < ie && (ce[x++] = oe[$++]));
									} else {
										for ($ = x - ae; ce[x++] = ce[$++], ce[x++] = ce[$++], ce[x++] = ce[$++], 2 < (ie -= 3););
										ie && (ce[x++] = ce[$++], 1 < ie && (ce[x++] = ce[$++]));
									}
									break;
								}
							}
							break;
						}
					} while (v < y && x < C);
					v -= ie = z >> 3, I &= (1 << (z -= ie << 3)) - 1, e.next_in = v, e.next_out = x, e.avail_in = v < y ? y - v + 5 : 5 - (v - y), e.avail_out = x < C ? C - x + 257 : 257 - (x - C), m.hold = I, m.bits = z;
				};
			}, {}],
			49: [function(e, t, m) {
				var v = e("../utils/common"), y = e("./adler32"), x = e("./crc32"), S = e("./inffast"), C = e("./inftrees"), w = 1, E = 2, O = 0, k = -2, ee = 1, I = 852, z = 592;
				function L(e) {
					return (e >>> 24 & 255) + (e >>> 8 & 65280) + ((65280 & e) << 8) + ((255 & e) << 24);
				}
				function s() {
					this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new v.Buf16(320), this.work = new v.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
				}
				function a(e) {
					var t;
					return e && e.state ? (t = e.state, e.total_in = e.total_out = t.total = 0, e.msg = "", t.wrap && (e.adler = 1 & t.wrap), t.mode = ee, t.last = 0, t.havedict = 0, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new v.Buf32(I), t.distcode = t.distdyn = new v.Buf32(z), t.sane = 1, t.back = -1, O) : k;
				}
				function o(e) {
					var t;
					return e && e.state ? ((t = e.state).wsize = 0, t.whave = 0, t.wnext = 0, a(e)) : k;
				}
				function h(e, t) {
					var m, v;
					return e && e.state ? (v = e.state, t < 0 ? (m = 0, t = -t) : (m = 1 + (t >> 4), t < 48 && (t &= 15)), t && (t < 8 || 15 < t) ? k : (v.window !== null && v.wbits !== t && (v.window = null), v.wrap = m, v.wbits = t, o(e))) : k;
				}
				function u(e, t) {
					var m, v;
					return e ? (v = new s(), (e.state = v).window = null, (m = h(e, t)) !== O && (e.state = null), m) : k;
				}
				var te, ne, B = !0;
				function j(e) {
					if (B) {
						var t;
						for (te = new v.Buf32(512), ne = new v.Buf32(32), t = 0; t < 144;) e.lens[t++] = 8;
						for (; t < 256;) e.lens[t++] = 9;
						for (; t < 280;) e.lens[t++] = 7;
						for (; t < 288;) e.lens[t++] = 8;
						for (C(w, e.lens, 0, 288, te, 0, e.work, { bits: 9 }), t = 0; t < 32;) e.lens[t++] = 5;
						C(E, e.lens, 0, 32, ne, 0, e.work, { bits: 5 }), B = !1;
					}
					e.lencode = te, e.lenbits = 9, e.distcode = ne, e.distbits = 5;
				}
				function Z(e, t, m, y) {
					var x, S = e.state;
					return S.window === null && (S.wsize = 1 << S.wbits, S.wnext = 0, S.whave = 0, S.window = new v.Buf8(S.wsize)), y >= S.wsize ? (v.arraySet(S.window, t, m - S.wsize, S.wsize, 0), S.wnext = 0, S.whave = S.wsize) : (y < (x = S.wsize - S.wnext) && (x = y), v.arraySet(S.window, t, m - y, x, S.wnext), (y -= x) ? (v.arraySet(S.window, t, m - y, y, 0), S.wnext = y, S.whave = S.wsize) : (S.wnext += x, S.wnext === S.wsize && (S.wnext = 0), S.whave < S.wsize && (S.whave += x))), 0;
				}
				m.inflateReset = o, m.inflateReset2 = h, m.inflateResetKeep = a, m.inflateInit = function(e) {
					return u(e, 15);
				}, m.inflateInit2 = u, m.inflate = function(e, t) {
					var m, I, z, te, ne, B, re, q, Q, ie, ae, $, oe, se, ce, le, ue, de, fe, pe, me, he, ge, _e, ve = 0, ye = new v.Buf8(4), be = [
						16,
						17,
						18,
						0,
						8,
						7,
						9,
						6,
						10,
						5,
						11,
						4,
						12,
						3,
						13,
						2,
						14,
						1,
						15
					];
					if (!e || !e.state || !e.output || !e.input && e.avail_in !== 0) return k;
					(m = e.state).mode === 12 && (m.mode = 13), ne = e.next_out, z = e.output, re = e.avail_out, te = e.next_in, I = e.input, B = e.avail_in, q = m.hold, Q = m.bits, ie = B, ae = re, he = O;
					e: for (;;) switch (m.mode) {
						case ee:
							if (m.wrap === 0) {
								m.mode = 13;
								break;
							}
							for (; Q < 16;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							if (2 & m.wrap && q === 35615) {
								ye[m.check = 0] = 255 & q, ye[1] = q >>> 8 & 255, m.check = x(m.check, ye, 2, 0), Q = q = 0, m.mode = 2;
								break;
							}
							if (m.flags = 0, m.head && (m.head.done = !1), !(1 & m.wrap) || (((255 & q) << 8) + (q >> 8)) % 31) {
								e.msg = "incorrect header check", m.mode = 30;
								break;
							}
							if ((15 & q) != 8) {
								e.msg = "unknown compression method", m.mode = 30;
								break;
							}
							if (Q -= 4, me = 8 + (15 & (q >>>= 4)), m.wbits === 0) m.wbits = me;
							else if (me > m.wbits) {
								e.msg = "invalid window size", m.mode = 30;
								break;
							}
							m.dmax = 1 << me, e.adler = m.check = 1, m.mode = 512 & q ? 10 : 12, Q = q = 0;
							break;
						case 2:
							for (; Q < 16;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							if (m.flags = q, (255 & m.flags) != 8) {
								e.msg = "unknown compression method", m.mode = 30;
								break;
							}
							if (57344 & m.flags) {
								e.msg = "unknown header flags set", m.mode = 30;
								break;
							}
							m.head && (m.head.text = q >> 8 & 1), 512 & m.flags && (ye[0] = 255 & q, ye[1] = q >>> 8 & 255, m.check = x(m.check, ye, 2, 0)), Q = q = 0, m.mode = 3;
						case 3:
							for (; Q < 32;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							m.head && (m.head.time = q), 512 & m.flags && (ye[0] = 255 & q, ye[1] = q >>> 8 & 255, ye[2] = q >>> 16 & 255, ye[3] = q >>> 24 & 255, m.check = x(m.check, ye, 4, 0)), Q = q = 0, m.mode = 4;
						case 4:
							for (; Q < 16;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							m.head && (m.head.xflags = 255 & q, m.head.os = q >> 8), 512 & m.flags && (ye[0] = 255 & q, ye[1] = q >>> 8 & 255, m.check = x(m.check, ye, 2, 0)), Q = q = 0, m.mode = 5;
						case 5:
							if (1024 & m.flags) {
								for (; Q < 16;) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								m.length = q, m.head && (m.head.extra_len = q), 512 & m.flags && (ye[0] = 255 & q, ye[1] = q >>> 8 & 255, m.check = x(m.check, ye, 2, 0)), Q = q = 0;
							} else m.head && (m.head.extra = null);
							m.mode = 6;
						case 6:
							if (1024 & m.flags && (B < ($ = m.length) && ($ = B), $ && (m.head && (me = m.head.extra_len - m.length, m.head.extra || (m.head.extra = Array(m.head.extra_len)), v.arraySet(m.head.extra, I, te, $, me)), 512 & m.flags && (m.check = x(m.check, I, $, te)), B -= $, te += $, m.length -= $), m.length)) break e;
							m.length = 0, m.mode = 7;
						case 7:
							if (2048 & m.flags) {
								if (B === 0) break e;
								for ($ = 0; me = I[te + $++], m.head && me && m.length < 65536 && (m.head.name += String.fromCharCode(me)), me && $ < B;);
								if (512 & m.flags && (m.check = x(m.check, I, $, te)), B -= $, te += $, me) break e;
							} else m.head && (m.head.name = null);
							m.length = 0, m.mode = 8;
						case 8:
							if (4096 & m.flags) {
								if (B === 0) break e;
								for ($ = 0; me = I[te + $++], m.head && me && m.length < 65536 && (m.head.comment += String.fromCharCode(me)), me && $ < B;);
								if (512 & m.flags && (m.check = x(m.check, I, $, te)), B -= $, te += $, me) break e;
							} else m.head && (m.head.comment = null);
							m.mode = 9;
						case 9:
							if (512 & m.flags) {
								for (; Q < 16;) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								if (q !== (65535 & m.check)) {
									e.msg = "header crc mismatch", m.mode = 30;
									break;
								}
								Q = q = 0;
							}
							m.head && (m.head.hcrc = m.flags >> 9 & 1, m.head.done = !0), e.adler = m.check = 0, m.mode = 12;
							break;
						case 10:
							for (; Q < 32;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							e.adler = m.check = L(q), Q = q = 0, m.mode = 11;
						case 11:
							if (m.havedict === 0) return e.next_out = ne, e.avail_out = re, e.next_in = te, e.avail_in = B, m.hold = q, m.bits = Q, 2;
							e.adler = m.check = 1, m.mode = 12;
						case 12: if (t === 5 || t === 6) break e;
						case 13:
							if (m.last) {
								q >>>= 7 & Q, Q -= 7 & Q, m.mode = 27;
								break;
							}
							for (; Q < 3;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							switch (m.last = 1 & q, --Q, 3 & (q >>>= 1)) {
								case 0:
									m.mode = 14;
									break;
								case 1:
									if (j(m), m.mode = 20, t !== 6) break;
									q >>>= 2, Q -= 2;
									break e;
								case 2:
									m.mode = 17;
									break;
								case 3: e.msg = "invalid block type", m.mode = 30;
							}
							q >>>= 2, Q -= 2;
							break;
						case 14:
							for (q >>>= 7 & Q, Q -= 7 & Q; Q < 32;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							if ((65535 & q) != (q >>> 16 ^ 65535)) {
								e.msg = "invalid stored block lengths", m.mode = 30;
								break;
							}
							if (m.length = 65535 & q, Q = q = 0, m.mode = 15, t === 6) break e;
						case 15: m.mode = 16;
						case 16:
							if ($ = m.length) {
								if (B < $ && ($ = B), re < $ && ($ = re), $ === 0) break e;
								v.arraySet(z, I, te, $, ne), B -= $, te += $, re -= $, ne += $, m.length -= $;
								break;
							}
							m.mode = 12;
							break;
						case 17:
							for (; Q < 14;) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							if (m.nlen = 257 + (31 & q), q >>>= 5, Q -= 5, m.ndist = 1 + (31 & q), q >>>= 5, Q -= 5, m.ncode = 4 + (15 & q), q >>>= 4, Q -= 4, 286 < m.nlen || 30 < m.ndist) {
								e.msg = "too many length or distance symbols", m.mode = 30;
								break;
							}
							m.have = 0, m.mode = 18;
						case 18:
							for (; m.have < m.ncode;) {
								for (; Q < 3;) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								m.lens[be[m.have++]] = 7 & q, q >>>= 3, Q -= 3;
							}
							for (; m.have < 19;) m.lens[be[m.have++]] = 0;
							if (m.lencode = m.lendyn, m.lenbits = 7, ge = { bits: m.lenbits }, he = C(0, m.lens, 0, 19, m.lencode, 0, m.work, ge), m.lenbits = ge.bits, he) {
								e.msg = "invalid code lengths set", m.mode = 30;
								break;
							}
							m.have = 0, m.mode = 19;
						case 19:
							for (; m.have < m.nlen + m.ndist;) {
								for (; le = (ve = m.lencode[q & (1 << m.lenbits) - 1]) >>> 16 & 255, ue = 65535 & ve, !((ce = ve >>> 24) <= Q);) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								if (ue < 16) q >>>= ce, Q -= ce, m.lens[m.have++] = ue;
								else {
									if (ue === 16) {
										for (_e = ce + 2; Q < _e;) {
											if (B === 0) break e;
											B--, q += I[te++] << Q, Q += 8;
										}
										if (q >>>= ce, Q -= ce, m.have === 0) {
											e.msg = "invalid bit length repeat", m.mode = 30;
											break;
										}
										me = m.lens[m.have - 1], $ = 3 + (3 & q), q >>>= 2, Q -= 2;
									} else if (ue === 17) {
										for (_e = ce + 3; Q < _e;) {
											if (B === 0) break e;
											B--, q += I[te++] << Q, Q += 8;
										}
										Q -= ce, me = 0, $ = 3 + (7 & (q >>>= ce)), q >>>= 3, Q -= 3;
									} else {
										for (_e = ce + 7; Q < _e;) {
											if (B === 0) break e;
											B--, q += I[te++] << Q, Q += 8;
										}
										Q -= ce, me = 0, $ = 11 + (127 & (q >>>= ce)), q >>>= 7, Q -= 7;
									}
									if (m.have + $ > m.nlen + m.ndist) {
										e.msg = "invalid bit length repeat", m.mode = 30;
										break;
									}
									for (; $--;) m.lens[m.have++] = me;
								}
							}
							if (m.mode === 30) break;
							if (m.lens[256] === 0) {
								e.msg = "invalid code -- missing end-of-block", m.mode = 30;
								break;
							}
							if (m.lenbits = 9, ge = { bits: m.lenbits }, he = C(w, m.lens, 0, m.nlen, m.lencode, 0, m.work, ge), m.lenbits = ge.bits, he) {
								e.msg = "invalid literal/lengths set", m.mode = 30;
								break;
							}
							if (m.distbits = 6, m.distcode = m.distdyn, ge = { bits: m.distbits }, he = C(E, m.lens, m.nlen, m.ndist, m.distcode, 0, m.work, ge), m.distbits = ge.bits, he) {
								e.msg = "invalid distances set", m.mode = 30;
								break;
							}
							if (m.mode = 20, t === 6) break e;
						case 20: m.mode = 21;
						case 21:
							if (6 <= B && 258 <= re) {
								e.next_out = ne, e.avail_out = re, e.next_in = te, e.avail_in = B, m.hold = q, m.bits = Q, S(e, ae), ne = e.next_out, z = e.output, re = e.avail_out, te = e.next_in, I = e.input, B = e.avail_in, q = m.hold, Q = m.bits, m.mode === 12 && (m.back = -1);
								break;
							}
							for (m.back = 0; le = (ve = m.lencode[q & (1 << m.lenbits) - 1]) >>> 16 & 255, ue = 65535 & ve, !((ce = ve >>> 24) <= Q);) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							if (le && !(240 & le)) {
								for (de = ce, fe = le, pe = ue; le = (ve = m.lencode[pe + ((q & (1 << de + fe) - 1) >> de)]) >>> 16 & 255, ue = 65535 & ve, !(de + (ce = ve >>> 24) <= Q);) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								q >>>= de, Q -= de, m.back += de;
							}
							if (q >>>= ce, Q -= ce, m.back += ce, m.length = ue, le === 0) {
								m.mode = 26;
								break;
							}
							if (32 & le) {
								m.back = -1, m.mode = 12;
								break;
							}
							if (64 & le) {
								e.msg = "invalid literal/length code", m.mode = 30;
								break;
							}
							m.extra = 15 & le, m.mode = 22;
						case 22:
							if (m.extra) {
								for (_e = m.extra; Q < _e;) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								m.length += q & (1 << m.extra) - 1, q >>>= m.extra, Q -= m.extra, m.back += m.extra;
							}
							m.was = m.length, m.mode = 23;
						case 23:
							for (; le = (ve = m.distcode[q & (1 << m.distbits) - 1]) >>> 16 & 255, ue = 65535 & ve, !((ce = ve >>> 24) <= Q);) {
								if (B === 0) break e;
								B--, q += I[te++] << Q, Q += 8;
							}
							if (!(240 & le)) {
								for (de = ce, fe = le, pe = ue; le = (ve = m.distcode[pe + ((q & (1 << de + fe) - 1) >> de)]) >>> 16 & 255, ue = 65535 & ve, !(de + (ce = ve >>> 24) <= Q);) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								q >>>= de, Q -= de, m.back += de;
							}
							if (q >>>= ce, Q -= ce, m.back += ce, 64 & le) {
								e.msg = "invalid distance code", m.mode = 30;
								break;
							}
							m.offset = ue, m.extra = 15 & le, m.mode = 24;
						case 24:
							if (m.extra) {
								for (_e = m.extra; Q < _e;) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								m.offset += q & (1 << m.extra) - 1, q >>>= m.extra, Q -= m.extra, m.back += m.extra;
							}
							if (m.offset > m.dmax) {
								e.msg = "invalid distance too far back", m.mode = 30;
								break;
							}
							m.mode = 25;
						case 25:
							if (re === 0) break e;
							if ($ = ae - re, m.offset > $) {
								if (($ = m.offset - $) > m.whave && m.sane) {
									e.msg = "invalid distance too far back", m.mode = 30;
									break;
								}
								oe = $ > m.wnext ? ($ -= m.wnext, m.wsize - $) : m.wnext - $, $ > m.length && ($ = m.length), se = m.window;
							} else se = z, oe = ne - m.offset, $ = m.length;
							for (re < $ && ($ = re), re -= $, m.length -= $; z[ne++] = se[oe++], --$;);
							m.length === 0 && (m.mode = 21);
							break;
						case 26:
							if (re === 0) break e;
							z[ne++] = m.length, re--, m.mode = 21;
							break;
						case 27:
							if (m.wrap) {
								for (; Q < 32;) {
									if (B === 0) break e;
									B--, q |= I[te++] << Q, Q += 8;
								}
								if (ae -= re, e.total_out += ae, m.total += ae, ae && (e.adler = m.check = m.flags ? x(m.check, z, ae, ne - ae) : y(m.check, z, ae, ne - ae)), ae = re, (m.flags ? q : L(q)) !== m.check) {
									e.msg = "incorrect data check", m.mode = 30;
									break;
								}
								Q = q = 0;
							}
							m.mode = 28;
						case 28:
							if (m.wrap && m.flags) {
								for (; Q < 32;) {
									if (B === 0) break e;
									B--, q += I[te++] << Q, Q += 8;
								}
								if (q !== (4294967295 & m.total)) {
									e.msg = "incorrect length check", m.mode = 30;
									break;
								}
								Q = q = 0;
							}
							m.mode = 29;
						case 29:
							he = 1;
							break e;
						case 30:
							he = -3;
							break e;
						case 31: return -4;
						default: return k;
					}
					return e.next_out = ne, e.avail_out = re, e.next_in = te, e.avail_in = B, m.hold = q, m.bits = Q, (m.wsize || ae !== e.avail_out && m.mode < 30 && (m.mode < 27 || t !== 4)) && Z(e, e.output, e.next_out, ae - e.avail_out) ? (m.mode = 31, -4) : (ie -= e.avail_in, ae -= e.avail_out, e.total_in += ie, e.total_out += ae, m.total += ae, m.wrap && ae && (e.adler = m.check = m.flags ? x(m.check, z, ae, e.next_out - ae) : y(m.check, z, ae, e.next_out - ae)), e.data_type = m.bits + (m.last ? 64 : 0) + (m.mode === 12 ? 128 : 0) + (m.mode === 20 || m.mode === 15 ? 256 : 0), (ie == 0 && ae === 0 || t === 4) && he === O && (he = -5), he);
				}, m.inflateEnd = function(e) {
					if (!e || !e.state) return k;
					var t = e.state;
					return t.window &&= null, e.state = null, O;
				}, m.inflateGetHeader = function(e, t) {
					var m;
					return e && e.state && 2 & (m = e.state).wrap ? ((m.head = t).done = !1, O) : k;
				}, m.inflateSetDictionary = function(e, t) {
					var m, v = t.length;
					return e && e.state ? (m = e.state).wrap !== 0 && m.mode !== 11 ? k : m.mode === 11 && y(1, t, v, 0) !== m.check ? -3 : Z(e, t, v, v) ? (m.mode = 31, -4) : (m.havedict = 1, O) : k;
				}, m.inflateInfo = "pako inflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./inffast": 48,
				"./inftrees": 50
			}],
			50: [function(e, t, m) {
				var v = e("../utils/common"), y = [
					3,
					4,
					5,
					6,
					7,
					8,
					9,
					10,
					11,
					13,
					15,
					17,
					19,
					23,
					27,
					31,
					35,
					43,
					51,
					59,
					67,
					83,
					99,
					115,
					131,
					163,
					195,
					227,
					258,
					0,
					0
				], x = [
					16,
					16,
					16,
					16,
					16,
					16,
					16,
					16,
					17,
					17,
					17,
					17,
					18,
					18,
					18,
					18,
					19,
					19,
					19,
					19,
					20,
					20,
					20,
					20,
					21,
					21,
					21,
					21,
					16,
					72,
					78
				], S = [
					1,
					2,
					3,
					4,
					5,
					7,
					9,
					13,
					17,
					25,
					33,
					49,
					65,
					97,
					129,
					193,
					257,
					385,
					513,
					769,
					1025,
					1537,
					2049,
					3073,
					4097,
					6145,
					8193,
					12289,
					16385,
					24577,
					0,
					0
				], C = [
					16,
					16,
					16,
					16,
					17,
					17,
					18,
					18,
					19,
					19,
					20,
					20,
					21,
					21,
					22,
					22,
					23,
					23,
					24,
					24,
					25,
					25,
					26,
					26,
					27,
					27,
					28,
					28,
					29,
					29,
					64,
					64
				];
				t.exports = function(e, t, m, w, E, O, k, ee) {
					var I, z, te, ne, B, re, q, Q, ie, ae = ee.bits, $ = 0, oe = 0, se = 0, ce = 0, le = 0, ue = 0, de = 0, fe = 0, pe = 0, me = 0, he = null, ge = 0, _e = new v.Buf16(16), ve = new v.Buf16(16), ye = null, be = 0;
					for ($ = 0; $ <= 15; $++) _e[$] = 0;
					for (oe = 0; oe < w; oe++) _e[t[m + oe]]++;
					for (le = ae, ce = 15; 1 <= ce && _e[ce] === 0; ce--);
					if (ce < le && (le = ce), ce === 0) return E[O++] = 20971520, E[O++] = 20971520, ee.bits = 1, 0;
					for (se = 1; se < ce && _e[se] === 0; se++);
					for (le < se && (le = se), $ = fe = 1; $ <= 15; $++) if (fe <<= 1, (fe -= _e[$]) < 0) return -1;
					if (0 < fe && (e === 0 || ce !== 1)) return -1;
					for (ve[1] = 0, $ = 1; $ < 15; $++) ve[$ + 1] = ve[$] + _e[$];
					for (oe = 0; oe < w; oe++) t[m + oe] !== 0 && (k[ve[t[m + oe]]++] = oe);
					if (re = e === 0 ? (he = ye = k, 19) : e === 1 ? (he = y, ge -= 257, ye = x, be -= 257, 256) : (he = S, ye = C, -1), $ = se, B = O, de = oe = me = 0, te = -1, ne = (pe = 1 << (ue = le)) - 1, e === 1 && 852 < pe || e === 2 && 592 < pe) return 1;
					for (;;) {
						for (q = $ - de, ie = k[oe] < re ? (Q = 0, k[oe]) : k[oe] > re ? (Q = ye[be + k[oe]], he[ge + k[oe]]) : (Q = 96, 0), I = 1 << $ - de, se = z = 1 << ue; E[B + (me >> de) + (z -= I)] = q << 24 | Q << 16 | ie | 0, z !== 0;);
						for (I = 1 << $ - 1; me & I;) I >>= 1;
						if (I === 0 ? me = 0 : (me &= I - 1, me += I), oe++, --_e[$] == 0) {
							if ($ === ce) break;
							$ = t[m + k[oe]];
						}
						if (le < $ && (me & ne) !== te) {
							for (de === 0 && (de = le), B += se, fe = 1 << (ue = $ - de); ue + de < ce && !((fe -= _e[ue + de]) <= 0);) ue++, fe <<= 1;
							if (pe += 1 << ue, e === 1 && 852 < pe || e === 2 && 592 < pe) return 1;
							E[te = me & ne] = le << 24 | ue << 16 | B - O | 0;
						}
					}
					return me !== 0 && (E[B + me] = $ - de << 24 | 4194304), ee.bits = le, 0;
				};
			}, { "../utils/common": 41 }],
			51: [function(e, t, m) {
				t.exports = {
					2: "need dictionary",
					1: "stream end",
					0: "",
					"-1": "file error",
					"-2": "stream error",
					"-3": "data error",
					"-4": "insufficient memory",
					"-5": "buffer error",
					"-6": "incompatible version"
				};
			}, {}],
			52: [function(e, t, m) {
				var v = e("../utils/common"), y = 0, x = 1;
				function n(e) {
					for (var t = e.length; 0 <= --t;) e[t] = 0;
				}
				var S = 0, C = 29, w = 256, E = w + 1 + C, O = 30, k = 19, ee = 2 * E + 1, I = 15, z = 16, te = 7, ne = 256, B = 16, re = 17, q = 18, Q = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1,
					1,
					1,
					1,
					2,
					2,
					2,
					2,
					3,
					3,
					3,
					3,
					4,
					4,
					4,
					4,
					5,
					5,
					5,
					5,
					0
				], ie = [
					0,
					0,
					0,
					0,
					1,
					1,
					2,
					2,
					3,
					3,
					4,
					4,
					5,
					5,
					6,
					6,
					7,
					7,
					8,
					8,
					9,
					9,
					10,
					10,
					11,
					11,
					12,
					12,
					13,
					13
				], ae = [
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
					2,
					3,
					7
				], $ = [
					16,
					17,
					18,
					0,
					8,
					7,
					9,
					6,
					10,
					5,
					11,
					4,
					12,
					3,
					13,
					2,
					14,
					1,
					15
				], oe = Array(2 * (E + 2));
				n(oe);
				var se = Array(2 * O);
				n(se);
				var ce = Array(512);
				n(ce);
				var le = Array(256);
				n(le);
				var ue = Array(C);
				n(ue);
				var de, fe, pe, me = Array(O);
				function D(e, t, m, v, y) {
					this.static_tree = e, this.extra_bits = t, this.extra_base = m, this.elems = v, this.max_length = y, this.has_stree = e && e.length;
				}
				function F(e, t) {
					this.dyn_tree = e, this.max_code = 0, this.stat_desc = t;
				}
				function N(e) {
					return e < 256 ? ce[e] : ce[256 + (e >>> 7)];
				}
				function U(e, t) {
					e.pending_buf[e.pending++] = 255 & t, e.pending_buf[e.pending++] = t >>> 8 & 255;
				}
				function P(e, t, m) {
					e.bi_valid > z - m ? (e.bi_buf |= t << e.bi_valid & 65535, U(e, e.bi_buf), e.bi_buf = t >> z - e.bi_valid, e.bi_valid += m - z) : (e.bi_buf |= t << e.bi_valid & 65535, e.bi_valid += m);
				}
				function L(e, t, m) {
					P(e, m[2 * t], m[2 * t + 1]);
				}
				function j(e, t) {
					for (var m = 0; m |= 1 & e, e >>>= 1, m <<= 1, 0 < --t;);
					return m >>> 1;
				}
				function Z(e, t, m) {
					var v, y, x = Array(I + 1), S = 0;
					for (v = 1; v <= I; v++) x[v] = S = S + m[v - 1] << 1;
					for (y = 0; y <= t; y++) {
						var C = e[2 * y + 1];
						C !== 0 && (e[2 * y] = j(x[C]++, C));
					}
				}
				function W(e) {
					for (var t = 0; t < E; t++) e.dyn_ltree[2 * t] = 0;
					for (t = 0; t < O; t++) e.dyn_dtree[2 * t] = 0;
					for (t = 0; t < k; t++) e.bl_tree[2 * t] = 0;
					e.dyn_ltree[2 * ne] = 1, e.opt_len = e.static_len = 0, e.last_lit = e.matches = 0;
				}
				function M(e) {
					8 < e.bi_valid ? U(e, e.bi_buf) : 0 < e.bi_valid && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
				}
				function H(e, t, m, v) {
					var y = 2 * t, x = 2 * m;
					return e[y] < e[x] || e[y] === e[x] && v[t] <= v[m];
				}
				function G(e, t, m) {
					for (var v = e.heap[m], y = m << 1; y <= e.heap_len && (y < e.heap_len && H(t, e.heap[y + 1], e.heap[y], e.depth) && y++, !H(t, v, e.heap[y], e.depth));) e.heap[m] = e.heap[y], m = y, y <<= 1;
					e.heap[m] = v;
				}
				function K(e, t, m) {
					var v, y, x, S, C = 0;
					if (e.last_lit !== 0) for (; v = e.pending_buf[e.d_buf + 2 * C] << 8 | e.pending_buf[e.d_buf + 2 * C + 1], y = e.pending_buf[e.l_buf + C], C++, v === 0 ? L(e, y, t) : (L(e, (x = le[y]) + w + 1, t), (S = Q[x]) !== 0 && P(e, y -= ue[x], S), L(e, x = N(--v), m), (S = ie[x]) !== 0 && P(e, v -= me[x], S)), C < e.last_lit;);
					L(e, ne, t);
				}
				function Y(e, t) {
					var m, v, y, x = t.dyn_tree, S = t.stat_desc.static_tree, C = t.stat_desc.has_stree, w = t.stat_desc.elems, E = -1;
					for (e.heap_len = 0, e.heap_max = ee, m = 0; m < w; m++) x[2 * m] === 0 ? x[2 * m + 1] = 0 : (e.heap[++e.heap_len] = E = m, e.depth[m] = 0);
					for (; e.heap_len < 2;) x[2 * (y = e.heap[++e.heap_len] = E < 2 ? ++E : 0)] = 1, e.depth[y] = 0, e.opt_len--, C && (e.static_len -= S[2 * y + 1]);
					for (t.max_code = E, m = e.heap_len >> 1; 1 <= m; m--) G(e, x, m);
					for (y = w; m = e.heap[1], e.heap[1] = e.heap[e.heap_len--], G(e, x, 1), v = e.heap[1], e.heap[--e.heap_max] = m, e.heap[--e.heap_max] = v, x[2 * y] = x[2 * m] + x[2 * v], e.depth[y] = (e.depth[m] >= e.depth[v] ? e.depth[m] : e.depth[v]) + 1, x[2 * m + 1] = x[2 * v + 1] = y, e.heap[1] = y++, G(e, x, 1), 2 <= e.heap_len;);
					e.heap[--e.heap_max] = e.heap[1], function(e, t) {
						var m, v, y, x, S, C, w = t.dyn_tree, E = t.max_code, O = t.stat_desc.static_tree, k = t.stat_desc.has_stree, z = t.stat_desc.extra_bits, te = t.stat_desc.extra_base, ne = t.stat_desc.max_length, B = 0;
						for (x = 0; x <= I; x++) e.bl_count[x] = 0;
						for (w[2 * e.heap[e.heap_max] + 1] = 0, m = e.heap_max + 1; m < ee; m++) ne < (x = w[2 * w[2 * (v = e.heap[m]) + 1] + 1] + 1) && (x = ne, B++), w[2 * v + 1] = x, E < v || (e.bl_count[x]++, S = 0, te <= v && (S = z[v - te]), C = w[2 * v], e.opt_len += C * (x + S), k && (e.static_len += C * (O[2 * v + 1] + S)));
						if (B !== 0) {
							do {
								for (x = ne - 1; e.bl_count[x] === 0;) x--;
								e.bl_count[x]--, e.bl_count[x + 1] += 2, e.bl_count[ne]--, B -= 2;
							} while (0 < B);
							for (x = ne; x !== 0; x--) for (v = e.bl_count[x]; v !== 0;) E < (y = e.heap[--m]) || (w[2 * y + 1] !== x && (e.opt_len += (x - w[2 * y + 1]) * w[2 * y], w[2 * y + 1] = x), v--);
						}
					}(e, t), Z(x, E, e.bl_count);
				}
				function X(e, t, m) {
					var v, y, x = -1, S = t[1], C = 0, w = 7, E = 4;
					for (S === 0 && (w = 138, E = 3), t[2 * (m + 1) + 1] = 65535, v = 0; v <= m; v++) y = S, S = t[2 * (v + 1) + 1], ++C < w && y === S || (C < E ? e.bl_tree[2 * y] += C : y === 0 ? C <= 10 ? e.bl_tree[2 * re]++ : e.bl_tree[2 * q]++ : (y !== x && e.bl_tree[2 * y]++, e.bl_tree[2 * B]++), x = y, E = (C = 0) === S ? (w = 138, 3) : y === S ? (w = 6, 3) : (w = 7, 4));
				}
				function V(e, t, m) {
					var v, y, x = -1, S = t[1], C = 0, w = 7, E = 4;
					for (S === 0 && (w = 138, E = 3), v = 0; v <= m; v++) if (y = S, S = t[2 * (v + 1) + 1], !(++C < w && y === S)) {
						if (C < E) for (; L(e, y, e.bl_tree), --C != 0;);
						else y === 0 ? C <= 10 ? (L(e, re, e.bl_tree), P(e, C - 3, 3)) : (L(e, q, e.bl_tree), P(e, C - 11, 7)) : (y !== x && (L(e, y, e.bl_tree), C--), L(e, B, e.bl_tree), P(e, C - 3, 2));
						x = y, E = (C = 0) === S ? (w = 138, 3) : y === S ? (w = 6, 3) : (w = 7, 4);
					}
				}
				n(me);
				var he = !1;
				function J(e, t, m, y) {
					P(e, (S << 1) + +!!y, 3), function(e, t, m, y) {
						M(e), y && (U(e, m), U(e, ~m)), v.arraySet(e.pending_buf, e.window, t, m, e.pending), e.pending += m;
					}(e, t, m, !0);
				}
				m._tr_init = function(e) {
					he ||= (function() {
						var e, t, m, v, y, x = Array(I + 1);
						for (v = m = 0; v < C - 1; v++) for (ue[v] = m, e = 0; e < 1 << Q[v]; e++) le[m++] = v;
						for (le[m - 1] = v, v = y = 0; v < 16; v++) for (me[v] = y, e = 0; e < 1 << ie[v]; e++) ce[y++] = v;
						for (y >>= 7; v < O; v++) for (me[v] = y << 7, e = 0; e < 1 << ie[v] - 7; e++) ce[256 + y++] = v;
						for (t = 0; t <= I; t++) x[t] = 0;
						for (e = 0; e <= 143;) oe[2 * e + 1] = 8, e++, x[8]++;
						for (; e <= 255;) oe[2 * e + 1] = 9, e++, x[9]++;
						for (; e <= 279;) oe[2 * e + 1] = 7, e++, x[7]++;
						for (; e <= 287;) oe[2 * e + 1] = 8, e++, x[8]++;
						for (Z(oe, E + 1, x), e = 0; e < O; e++) se[2 * e + 1] = 5, se[2 * e] = j(e, 5);
						de = new D(oe, Q, w + 1, E, I), fe = new D(se, ie, 0, O, I), pe = new D([], ae, 0, k, te);
					}(), !0), e.l_desc = new F(e.dyn_ltree, de), e.d_desc = new F(e.dyn_dtree, fe), e.bl_desc = new F(e.bl_tree, pe), e.bi_buf = 0, e.bi_valid = 0, W(e);
				}, m._tr_stored_block = J, m._tr_flush_block = function(e, t, m, v) {
					var S, C, E = 0;
					0 < e.level ? (e.strm.data_type === 2 && (e.strm.data_type = function(e) {
						var t, m = 4093624447;
						for (t = 0; t <= 31; t++, m >>>= 1) if (1 & m && e.dyn_ltree[2 * t] !== 0) return y;
						if (e.dyn_ltree[18] !== 0 || e.dyn_ltree[20] !== 0 || e.dyn_ltree[26] !== 0) return x;
						for (t = 32; t < w; t++) if (e.dyn_ltree[2 * t] !== 0) return x;
						return y;
					}(e)), Y(e, e.l_desc), Y(e, e.d_desc), E = function(e) {
						var t;
						for (X(e, e.dyn_ltree, e.l_desc.max_code), X(e, e.dyn_dtree, e.d_desc.max_code), Y(e, e.bl_desc), t = k - 1; 3 <= t && e.bl_tree[2 * $[t] + 1] === 0; t--);
						return e.opt_len += 3 * (t + 1) + 5 + 5 + 4, t;
					}(e), S = e.opt_len + 3 + 7 >>> 3, (C = e.static_len + 3 + 7 >>> 3) <= S && (S = C)) : S = C = m + 5, m + 4 <= S && t !== -1 ? J(e, t, m, v) : e.strategy === 4 || C === S ? (P(e, 2 + +!!v, 3), K(e, oe, se)) : (P(e, 4 + +!!v, 3), function(e, t, m, v) {
						var y;
						for (P(e, t - 257, 5), P(e, m - 1, 5), P(e, v - 4, 4), y = 0; y < v; y++) P(e, e.bl_tree[2 * $[y] + 1], 3);
						V(e, e.dyn_ltree, t - 1), V(e, e.dyn_dtree, m - 1);
					}(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, E + 1), K(e, e.dyn_ltree, e.dyn_dtree)), W(e), v && M(e);
				}, m._tr_tally = function(e, t, m) {
					return e.pending_buf[e.d_buf + 2 * e.last_lit] = t >>> 8 & 255, e.pending_buf[e.d_buf + 2 * e.last_lit + 1] = 255 & t, e.pending_buf[e.l_buf + e.last_lit] = 255 & m, e.last_lit++, t === 0 ? e.dyn_ltree[2 * m]++ : (e.matches++, t--, e.dyn_ltree[2 * (le[m] + w + 1)]++, e.dyn_dtree[2 * N(t)]++), e.last_lit === e.lit_bufsize - 1;
				}, m._tr_align = function(e) {
					P(e, 2, 3), L(e, ne, oe), function(e) {
						e.bi_valid === 16 ? (U(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : 8 <= e.bi_valid && (e.pending_buf[e.pending++] = 255 & e.bi_buf, e.bi_buf >>= 8, e.bi_valid -= 8);
					}(e);
				};
			}, { "../utils/common": 41 }],
			53: [function(e, t, m) {
				t.exports = function() {
					this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
				};
			}, {}],
			54: [function(e, m, v) {
				(function(e) {
					(function(e, t) {
						if (!e.setImmediate) {
							var m, v, y, x, S = 1, C = {}, w = !1, E = e.document, O = Object.getPrototypeOf && Object.getPrototypeOf(e);
							O = O && O.setTimeout ? O : e, m = {}.toString.call(e.process) === "[object process]" ? function(e) {
								le.nextTick(function() {
									c(e);
								});
							} : function() {
								if (e.postMessage && !e.importScripts) {
									var t = !0, m = e.onmessage;
									return e.onmessage = function() {
										t = !1;
									}, e.postMessage("", "*"), e.onmessage = m, t;
								}
							}() ? (x = "setImmediate$" + Math.random() + "$", e.addEventListener ? e.addEventListener("message", d, !1) : e.attachEvent("onmessage", d), function(t) {
								e.postMessage(x + t, "*");
							}) : e.MessageChannel ? ((y = new MessageChannel()).port1.onmessage = function(e) {
								c(e.data);
							}, function(e) {
								y.port2.postMessage(e);
							}) : E && "onreadystatechange" in E.createElement("script") ? (v = E.documentElement, function(e) {
								var t = E.createElement("script");
								t.onreadystatechange = function() {
									c(e), t.onreadystatechange = null, v.removeChild(t), t = null;
								}, v.appendChild(t);
							}) : function(e) {
								setTimeout(c, 0, e);
							}, O.setImmediate = function(e) {
								typeof e != "function" && (e = Function("" + e));
								for (var t = Array(arguments.length - 1), v = 0; v < t.length; v++) t[v] = arguments[v + 1];
								return C[S] = {
									callback: e,
									args: t
								}, m(S), S++;
							}, O.clearImmediate = f;
						}
						function f(e) {
							delete C[e];
						}
						function c(e) {
							if (w) setTimeout(c, 0, e);
							else {
								var m = C[e];
								if (m) {
									w = !0;
									try {
										(function(e) {
											var m = e.callback, v = e.args;
											switch (v.length) {
												case 0:
													m();
													break;
												case 1:
													m(v[0]);
													break;
												case 2:
													m(v[0], v[1]);
													break;
												case 3:
													m(v[0], v[1], v[2]);
													break;
												default: m.apply(t, v);
											}
										})(m);
									} finally {
										f(e), w = !1;
									}
								}
							}
						}
						function d(t) {
							t.source === e && typeof t.data == "string" && t.data.indexOf(x) === 0 && c(+t.data.slice(x.length));
						}
					})(typeof self > "u" ? e === void 0 ? this : e : self);
				}).call(this, t === void 0 ? typeof self < "u" ? self : typeof window < "u" ? window : {} : t);
			}, {}]
		}, {}, [10])(10);
	});
});
//#endregion
//#region src/vendor/webamp-modern/utils.js
function assert(e, t) {
	if (!e) throw Error(t);
}
function assume(e, t) {
	return e || console.warn(t), e;
}
function normalizeSkinPath(e, t = "") {
	let m;
	if (/^@SKINSPATH@[\\/]/i.test(e)) {
		let v = e.replace(/^@SKINSPATH@[\\/]/i, "");
		m = t ? v : v.replace(/^[^\\/]+[\\/]/, "");
	} else m = /^@SKINPATH@[\\/]/i.test(e) ? t + e.replace(/^@SKINPATH@[\\/]/i, "") : t + e;
	let v = [];
	for (let e of m.split(/[\\/]/)) e === ".." ? v.length && v.pop() : e !== "." && e !== "" && v.push(e);
	return v.join("/");
}
function getCaseInsensitiveFile(e, t, m = "") {
	t = normalizeSkinPath(t, m);
	let v = t.replace(/[\/\\]/g, "[/\\\\]"), y = e.file(new RegExp(v, "i"));
	if (y && y.length > 1) {
		let m = t.split("/").pop().toLowerCase();
		for (let e = 0; e < y.length; e++) if (y[e].name.split("/").pop().toLowerCase() == m) return y[e];
		return e.file(RegExp(`^${v}$`, "i"))[0] ?? null;
	}
	return y[0] ?? null;
}
function num(e) {
	return e == null ? null : Number(e);
}
function px(e) {
	return `${e}px`;
}
function relative(e) {
	return e === 0 ? "100%" : `calc(100% + ${e}px)`;
}
function toBool(e) {
	return e = e.toLowerCase(), assume(e === "0" || e === "1" || e === "false" || e === "true", `Expected bool value to be "0" or "1", but it was "${e}".`), isNaN(parseInt(e)) ? e === "1" || e === "true" : parseInt(e) > 0;
}
var de = 0;
function getId() {
	return de++;
}
function ensureVmInt(e) {
	return Math.floor(e);
}
function clamp(e, t, m) {
	return Math.max(t, Math.min(e, m));
}
function circular(e, t, m) {
	for (assert(t < m, "illegal circular parameter."); e < t;) e = m + e;
	for (; e > m;) e -= m;
	return assert(e >= t && e <= m, "stupid in math, boss?"), e;
}
function normalizeDomId(e) {
	return e.replace(/[^a-zA-Z0-9]/g, "-");
}
function removeAllChildNodes(e) {
	for (; e.firstChild;) e.removeChild(e.firstChild);
}
function integerToTime(e) {
	return `${Math.floor(e / 60)}:${String(Math.abs(Math.floor(e % 60))).padStart(2, "0")}`;
}
function findLast(e, t) {
	for (let m = e.length - 1; m >= 0; m--) {
		let v = e[m];
		if (t(v)) return v;
	}
}
function debounce(e, t) {
	let m;
	return (...v) => {
		clearTimeout(m), m = setTimeout(() => {
			e(...v);
		}, t);
	};
}
var throttle = (e, t = 300) => {
	let m, v, y;
	return function() {
		let x = this, S = arguments;
		m ? (clearTimeout(v), v = setTimeout(() => {
			Date.now() - y >= t && (e.apply(x, S), y = Date.now());
		}, Math.max(t - (Date.now() - y), 0))) : (m = !0, e.apply(x, S), y = Date.now());
	};
};
function unimplemented(e) {
	return e;
}
function hexToRgb(e) {
	var t = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
	return {
		r: parseInt(t[1], 16),
		g: parseInt(t[2], 16),
		b: parseInt(t[3], 16)
	};
}
var Emitter = class {
	constructor() {
		this._cbs = {};
	}
	on(e, t) {
		return this._cbs[e] ?? (this._cbs[e] = []), this._cbs[e].push(t), () => {
			this._cbs[e] = this._cbs[e].filter((e) => e !== t);
		};
	}
	off(e, t) {
		if (this._cbs[e] == null) return;
		let m = this._cbs[e], v = m.indexOf(t, 0);
		v > -1 && m.splice(v, 1);
	}
	trigger(e, ...t) {
		let m = this._cbs[e];
		if (m != null) for (let e of m) e(...t);
	}
}, ZipFileExtractor = class {
	constructor() {
		this._root = "";
	}
	async prepare(e, t) {
		let m = await t.blob();
		this._zip = await ue.loadAsync(m);
	}
	setRoot(e) {
		this._root = e ? e.replace(/\\/g, "/").replace(/\/?$/, "/") : "";
	}
	listSkinRoots() {
		return this._zip ? Object.keys(this._zip.files).filter((e) => !this._zip.files[e].dir && /(^|\/)skin\.xml$/i.test(e)).map((e) => e.slice(0, e.length - 8)).sort((e, t) => e.split("/").length - t.split("/").length || e.localeCompare(t)) : [];
	}
	async getFileAsString(e) {
		if (!e) return null;
		let t = getCaseInsensitiveFile(this._zip, e, this._root);
		return t ? await t.async("text") : null;
	}
	async getFileAsBytes(e) {
		if (!e) return null;
		let t = getCaseInsensitiveFile(this._zip, e, this._root);
		return t ? await t.async("arraybuffer") : null;
	}
	async getFileAsBlob(e) {
		if (!e) return null;
		let t = getCaseInsensitiveFile(this._zip, e, this._root);
		return t ? await t.async("blob") : null;
	}
}, PathFileExtractor = class {
	async prepare(e, t) {
		e.endsWith("/") || (e += "/"), this._skinDir = e;
	}
	async getFileAsString(e) {
		return await (await fetch(this._skinDir + normalizeSkinPath(e))).text();
	}
	async getFileAsBytes(e) {
		return await (await fetch(this._skinDir + normalizeSkinPath(e))).arrayBuffer();
	}
	async getFileAsBlob(e) {
		return await (await fetch(this._skinDir + normalizeSkinPath(e))).blob();
	}
}, fe = {
	"516549710D874a5191E3A6B53235F3E7": {
		parent: "@{00000000-0000-0000-0000-000000000000}@",
		name: "Object",
		deprecated: !1,
		functions: [
			{
				name: "getClassName",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getId",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "onNotify",
				parameters: [
					["String", "command"],
					["String", "param"],
					["int", "a"],
					["int", "b"]
				],
				result: "Int",
				deprecated: !1
			}
		]
	},
	D6F50F6493FA49b793F1BA66EFAE3E98: {
		parent: "Object",
		name: "System",
		deprecated: !1,
		functions: [
			{
				name: "onScriptLoaded",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onScriptUnloading",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onQuit",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onSetXuiParam",
				parameters: [["String", "param"], ["String", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onKeyDown",
				parameters: [["String", "key"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onAccelerator",
				parameters: [
					["String", "action"],
					["String", "section"],
					["String", "key"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "onCreateLayout",
				parameters: [["Layout", "_layout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onShowLayout",
				parameters: [["Layout", "_layout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onHideLayout",
				parameters: [["Layout", "_layout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onViewPortChanged",
				parameters: [["int", "width"], ["int", "height"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onStop",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onPlay",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onPause",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onResume",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onTitleChange",
				parameters: [["String", "newtitle"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onTitle2Change",
				parameters: [["String", "newtitle2"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onUrlChange",
				parameters: [["String", "url"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onInfoChange",
				parameters: [["String", "info"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onStatusMsg",
				parameters: [["String", "msg"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onEqBandChanged",
				parameters: [["int", "band"], ["int", "newvalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onEqPreampChanged",
				parameters: [["int", "newvalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onEqChanged",
				parameters: [["int", "newstatus"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onEqFreqChanged",
				parameters: [["int", "isiso"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onVolumeChanged",
				parameters: [["int", "newvol"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onSeek",
				parameters: [["int", "newpos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getContainer",
				parameters: [["String", "container_id"]],
				result: "Container",
				deprecated: !1
			},
			{
				name: "newDynamicContainer",
				parameters: [["String", "container_id"]],
				result: "Container",
				deprecated: !1
			},
			{
				name: "newGroup",
				parameters: [["String", "group_id"]],
				result: "Group",
				deprecated: !1
			},
			{
				name: "newGroupAsLayout",
				parameters: [["String", "group_id"]],
				result: "Layout",
				deprecated: !1
			},
			{
				name: "getNumContainers",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumContainer",
				parameters: [["Int", "num"]],
				result: "Container",
				deprecated: !1
			},
			{
				name: "enumEmbedGUID",
				parameters: [["int", "num"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getWac",
				parameters: [["String", "wac_guid"]],
				result: "Wac",
				deprecated: !0
			},
			{
				name: "messageBox",
				parameters: [
					["String", "message"],
					["String", "msgtitle"],
					["Int", "flag"],
					["String", "notanymore_id"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getPlayItemString",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getPlayItemLength",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getPlayItemMetaDataString",
				parameters: [["String", "metadataname"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getMetaDataString",
				parameters: [["String", "filename"], ["String", "metadataname"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getPlayItemDisplayTitle",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getCurrentTrackRating",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onCurrentTrackRated",
				parameters: [["int", "rating"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setCurrentTrackRating",
				parameters: [["int", "rating"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getExtFamily",
				parameters: [["String", "ext"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getDecoderName",
				parameters: [["string", "playitem"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "playFile",
				parameters: [["String", "playitem"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getAlbumArt",
				parameters: [["String", "playitem"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "downloadMedia",
				parameters: [
					["String", "url"],
					["String", "destinationPath"],
					["boolean", "wantAddToML"],
					["boolean", "notifyDownloadsList"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "downloadURL",
				parameters: [
					["String", "url"],
					["String", "destination_filename"],
					["String", "progress_dialog_title"]
				],
				result: "",
				deprecated: !0
			},
			{
				name: "onDownloadFinished",
				parameters: [
					["String", "url"],
					["boolean", "success"],
					["String", "filename"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "getDownloadPath",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "setDownloadPath",
				parameters: [["String", "new_path"]],
				result: "",
				deprecated: !1
			},
			{
				name: "enqueueFile",
				parameters: [["String", "playitem"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getLeftVuMeter",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getRightVuMeter",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getVolume",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setVolume",
				parameters: [["Int", "vol"]],
				result: "",
				deprecated: !1
			},
			{
				name: "play",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "stop",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "pause",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "next",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "previous",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "eject",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "seekTo",
				parameters: [["Int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getPosition",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setEqBand",
				parameters: [["int", "band"], ["Int", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setEqPreamp",
				parameters: [["Int", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setEq",
				parameters: [["Int", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getEqBand",
				parameters: [["int", "band"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getEqPreamp",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getEq",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getMousePosX",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getMousePosY",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "integerToString",
				parameters: [["Int", "value"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "StringToInteger",
				parameters: [["String", "str"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "floatToString",
				parameters: [["float", "value"], ["int", "ndigits"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "stringToFloat",
				parameters: [["String", "str"]],
				result: "Float",
				deprecated: !1
			},
			{
				name: "integerToLongTime",
				parameters: [["Int", "value"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "integerToTime",
				parameters: [["Int", "value"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "dateToTime",
				parameters: [["Int", "datetime"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "dateToLongTime",
				parameters: [["Int", "datetime"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "formatDate",
				parameters: [["Int", "datetime"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "formatLongDate",
				parameters: [["Int", "datetime"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getDateYear",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateMonth",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateDay",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateDow",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateDoy",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateHour",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateMin",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateSec",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDateDst",
				parameters: [["Int", "datetime"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDate",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "strmid",
				parameters: [
					["String", "str"],
					["Int", "start"],
					["Int", "len"]
				],
				result: "String",
				deprecated: !1
			},
			{
				name: "strleft",
				parameters: [["string", "str"], ["int", "nchars"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "strright",
				parameters: [["string", "str"], ["int", "nchars"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "strsearch",
				parameters: [["string", "str"], ["string", "substr"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "strlen",
				parameters: [["string", "str"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "strupper",
				parameters: [["string", "str"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "strlower",
				parameters: [["string", "str"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "urlEncode",
				parameters: [["string", "url"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "urlDecode",
				parameters: [["string", "url"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "parseATF",
				parameters: [["string", "topass"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "removePath",
				parameters: [["string", "str"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "getPath",
				parameters: [["string", "str"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "getExtension",
				parameters: [["string", "str"]],
				result: "string",
				deprecated: !1
			},
			{
				name: "getToken",
				parameters: [
					["string", "str"],
					["string", "separator"],
					["int", "tokennum"]
				],
				result: "string",
				deprecated: !1
			},
			{
				name: "sin",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "cos",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "tan",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "asin",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "acos",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "atan",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "atan2",
				parameters: [["double", "y"], ["double", "x"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "pow",
				parameters: [["double", "value"], ["double", "pvalue"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "sqr",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "log10",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "ln",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "sqrt",
				parameters: [["double", "value"]],
				result: "double",
				deprecated: !1
			},
			{
				name: "random",
				parameters: [["int", "max"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "setPrivateString",
				parameters: [
					["string", "section"],
					["string", "item"],
					["string", "value"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "setPrivateInt",
				parameters: [
					["string", "section"],
					["string", "item"],
					["int", "value"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "getPrivateString",
				parameters: [
					["String", "section"],
					["String", "item"],
					["String", "defvalue"]
				],
				result: "String",
				deprecated: !1
			},
			{
				name: "getPrivateInt",
				parameters: [
					["String", "section"],
					["String", "item"],
					["Int", "defvalue"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setPublicString",
				parameters: [["String", "item"], ["String", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setPublicInt",
				parameters: [["String", "item"], ["Int", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getPublicString",
				parameters: [["String", "item"], ["String", "defvalue"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getPublicInt",
				parameters: [["String", "item"], ["Int", "defvalue"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getParam",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getScriptGroup",
				parameters: [],
				result: "Group",
				deprecated: !1
			},
			{
				name: "getViewportWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportWidthFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportWidthFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorWidthFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorWidthFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onMouseMove",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getViewportHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportHeightFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportHeightFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorHeightFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorHeightFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorLeft",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorLeftFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorLeftFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorTop",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorTopFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMonitorTopFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportLeft",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportLeftFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportLeftFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportTop",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportTopFromGuiObject",
				parameters: [["GuiObject", "g"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getViewportTopFromPoint",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "debugString",
				parameters: [["String", "str"], ["Int", "severity"]],
				result: "",
				deprecated: !1
			},
			{
				name: "ddeSend",
				parameters: [
					["String", "application"],
					["String", "command"],
					["Int", "mininterval"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "onLookForComponent",
				parameters: [["String", "guid"]],
				result: "WindowHolder",
				deprecated: !1
			},
			{
				name: "getCurAppLeft",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getCurAppTop",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getCurAppWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getCurAppHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isAppActive",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getSkinName",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "switchSkin",
				parameters: [["String", "skinname"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isLoadingSkin",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "lockUI",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "unlockUI",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getMainBrowser",
				parameters: [],
				result: "Browser",
				deprecated: !1
			},
			{
				name: "popMainBrowser",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "navigateUrl",
				parameters: [["String", "url"]],
				result: "",
				deprecated: !1
			},
			{
				name: "navigateUrlBrowser",
				parameters: [["String", "url"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onOpenURL",
				parameters: [["string", "url"]],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "isObjectValid",
				parameters: [["Object", "o"]],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "integer",
				parameters: [["Double", "d"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "frac",
				parameters: [["Double", "d"]],
				result: "Double",
				deprecated: !1
			},
			{
				name: "getTimeOfDay",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setMenuTransparency",
				parameters: [["int", "alphavalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onGetCancelComponent",
				parameters: [["String", "guid"], ["boolean", "goingvisible"]],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getStatus",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isKeyDown",
				parameters: [["int", "vk_code"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setClipboardText",
				parameters: [["String", "_text"]],
				result: "",
				deprecated: !1
			},
			{
				name: "Chr",
				parameters: [["Int", "charnum"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "translate",
				parameters: [["String", "str"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getString",
				parameters: [["String", "table"], ["int", "id"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getLanguageId",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "selectFile",
				parameters: [
					["String", "extlist"],
					["String", "id"],
					["String", "prev_filename"]
				],
				result: "String",
				deprecated: !0
			},
			{
				name: "selectFolder",
				parameters: [
					["String", "wnd_title"],
					["String", "wnd_info"],
					["String", "default_path"]
				],
				result: "String",
				deprecated: !1
			},
			{
				name: "systemMenu",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "windowMenu",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "triggerAction",
				parameters: [
					["GuiObject", "context"],
					["String", "actionname"],
					["String", "actionparam"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "showWindow",
				parameters: [
					["String", "guidorgroupid"],
					["String", "preferedcontainer"],
					["Boolean", "transient"]
				],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "hideWindow",
				parameters: [["GuiObject", "hw"]],
				result: "",
				deprecated: !1
			},
			{
				name: "hideNamedWindow",
				parameters: [["String", "guidorgroup"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isNamedWindowVisible",
				parameters: [["String", "guidorgroup"]],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "setAtom",
				parameters: [["String", "atomname"], ["Object", "object"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getAtom",
				parameters: [["String", "atomname"]],
				result: "Object",
				deprecated: !1
			},
			{
				name: "invokeDebugger",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "hasVideoSupport",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "isVideo",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isVideoFullscreen",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setVideoFullscreen",
				parameters: [["Boolean", "fullscreen"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getIdealVideoWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getIdealVideoHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isMinimized",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "minimizeApplication",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "restoreApplication",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "activateApplication",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getPlaylistLength",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getPlaylistIndex",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "clearPlaylist",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isDesktopAlphaAvailable",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "isTransparencyAvailable",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "onShowNotification",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getSongInfoText",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getSongInfoTextTranslated",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getVisBand",
				parameters: [["int", "channel"], ["int", "band"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getRuntimeVersion",
				parameters: [],
				result: "Double",
				deprecated: !1
			},
			{
				name: "isWa2ComponentVisible",
				parameters: [["String", "guid"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "hideWa2Component",
				parameters: [["String", "guid"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isProVersion",
				parameters: [],
				result: "boolean",
				deprecated: !1
			},
			{
				name: "getWinampVersion",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getBuildNumber",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getFileSize",
				parameters: [["String", "fullfilename"]],
				result: "int",
				deprecated: !1
			}
		]
	},
	E90DC47B840D4ae7B02C040BD275F7FC: {
		parent: "Object",
		name: "Container",
		deprecated: !1,
		functions: [
			{
				name: "onSwitchToLayout",
				parameters: [["Layout", "newlayout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onBeforeSwitchToLayout",
				parameters: [["Layout", "oldlayout"], ["Layout", "newlayout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setXmlParam",
				parameters: [["String", "param"], ["String", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onHideLayout",
				parameters: [["Layout", "_layout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onShowLayout",
				parameters: [["Layout", "_layout"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getLayout",
				parameters: [["String", "layout_id"]],
				result: "Layout",
				deprecated: !1
			},
			{
				name: "getNumLayouts",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumLayout",
				parameters: [["Int", "num"]],
				result: "Layout",
				deprecated: !1
			},
			{
				name: "switchToLayout",
				parameters: [["String", "layout_id"]],
				result: "",
				deprecated: !1
			},
			{
				name: "show",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "hide",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "close",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "toggle",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isDynamic",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setName",
				parameters: [["String", "name"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getName",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getGuid",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getCurLayout",
				parameters: [],
				result: "Layout",
				deprecated: !1
			},
			{
				name: "onAddContent",
				parameters: [
					["GuiObject", "wnd"],
					["String", "id"],
					["String", "guid"]
				],
				result: "",
				deprecated: !1
			}
		]
	},
	"00C074A0FEA249a0BE8DFABBDB161640": {
		parent: "Object",
		name: "Wac",
		deprecated: !0,
		functions: [
			{
				name: "getGuid",
				parameters: [],
				result: "String",
				deprecated: !0
			},
			{
				name: "getName",
				parameters: [],
				result: "String",
				deprecated: !0
			},
			{
				name: "sendCommand",
				parameters: [
					["String", "cmd"],
					["Int", "param1"],
					["Int", "param2"],
					["String", "param3"]
				],
				result: "Int",
				deprecated: !0
			},
			{
				name: "show",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "hide",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "isVisible",
				parameters: [],
				result: "Boolean",
				deprecated: !0
			},
			{
				name: "onNotify",
				parameters: [
					["String", "notifstr"],
					["Int", "a"],
					["Int", "b"]
				],
				result: "",
				deprecated: !0
			},
			{
				name: "onShow",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "onHide",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "setStatusBar",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !0
			},
			{
				name: "getStatusBar",
				parameters: [],
				result: "Boolean",
				deprecated: !0
			}
		]
	},
	B2023AB5434D4ba1BEAE59637503F3C6: {
		parent: "Object",
		name: "List",
		deprecated: !1,
		functions: [
			{
				name: "addItem",
				parameters: [["Any", "_object"]],
				result: "",
				deprecated: !1
			},
			{
				name: "removeItem",
				parameters: [["int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "enumItem",
				parameters: [["int", "pos"]],
				result: "Any",
				deprecated: !1
			},
			{
				name: "findItem",
				parameters: [["Any", "_object"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "findItem2",
				parameters: [["Any", "_object"], ["int", "startItem"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumItems",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "removeAll",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	},
	"87C65778E74349fe85F909CC532AFD56": {
		parent: "Object",
		name: "BitList",
		deprecated: !1,
		functions: [
			{
				name: "getItem",
				parameters: [["int", "n"]],
				result: "boolean",
				deprecated: !1
			},
			{
				name: "setItem",
				parameters: [["int", "n"], ["boolean", "val"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setSize",
				parameters: [["int", "s"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getSize",
				parameters: [],
				result: "int",
				deprecated: !1
			}
		]
	},
	"38603665461B42a7AA75D83F6667BF73": {
		parent: "Object",
		name: "Map",
		deprecated: !1,
		functions: [
			{
				name: "getValue",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getARGBValue",
				parameters: [
					["int", "x"],
					["int", "y"],
					["int", "channel"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "inRegion",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "loadMap",
				parameters: [["String", "bitmapid"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getRegion",
				parameters: [],
				result: "Region",
				deprecated: !1
			}
		]
	},
	F4787AF4B2BB4ef79CFBE74BA9BEA88D: {
		parent: "Object",
		name: "PopupMenu",
		deprecated: !1,
		functions: [
			{
				name: "addSubMenu",
				parameters: [["PopupMenu", "submenu"], ["String", "submenutext"]],
				result: "",
				deprecated: !1
			},
			{
				name: "addCommand",
				parameters: [
					["String", "cmdtxt"],
					["Int", "cmd_id"],
					["Boolean", "checked"],
					["Boolean", "disabled"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "addSeparator",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "popAtXY",
				parameters: [["int", "x"], ["int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "popAtMouse",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumCommands",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "checkCommand",
				parameters: [["int", "cmd_id"], ["boolean", "check"]],
				result: "",
				deprecated: !1
			},
			{
				name: "disableCommand",
				parameters: [["int", "cmd_id"], ["boolean", "disable"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"3A370C023CBF439f84F186885BCF1E36": {
		parent: "Object",
		name: "Region",
		deprecated: !1,
		functions: [
			{
				name: "add",
				parameters: [["Region", "reg"]],
				result: "",
				deprecated: !1
			},
			{
				name: "sub",
				parameters: [["Region", "reg"]],
				result: "",
				deprecated: !1
			},
			{
				name: "offset",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "stretch",
				parameters: [["double", "r"]],
				result: "",
				deprecated: !1
			},
			{
				name: "copy",
				parameters: [["Region", "reg"]],
				result: "",
				deprecated: !1
			},
			{
				name: "loadFromMap",
				parameters: [
					["Map", "regionmap"],
					["Int", "threshold"],
					["Boolean", "reversed"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "loadFromBitmap",
				parameters: [["String", "bitmapid"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getBoundingBoxX",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getBoundingBoxY",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getBoundingBoxW",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getBoundingBoxH",
				parameters: [],
				result: "Int",
				deprecated: !1
			}
		]
	},
	"5D0C5BB67DE14b1fA70F8D1659941941": {
		parent: "Object",
		name: "Timer",
		deprecated: !1,
		functions: [
			{
				name: "onTimer",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setDelay",
				parameters: [["int", "millisec"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getDelay",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "start",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "stop",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isRunning",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getSkipped",
				parameters: [],
				result: "Int",
				deprecated: !1
			}
		]
	},
	A5376FA14E94411a83F605EC5EEA5F0A: {
		parent: "Object",
		name: "FeedWatcher",
		deprecated: !0,
		functions: [
			{
				name: "setFeed",
				parameters: [["String", "feed_id"]],
				result: "Int",
				deprecated: !0
			},
			{
				name: "releaseFeed",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "onFeedChange",
				parameters: [["String", "new_feeddata"]],
				result: "",
				deprecated: !0
			}
		]
	},
	"4EE3E199C6364bec97CD78BC9C8628B0": {
		parent: "Object",
		name: "GuiObject",
		deprecated: !1,
		functions: [
			{
				name: "show",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "hide",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isVisible",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "onSetVisible",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setAlpha",
				parameters: [["int", "alpha"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getAlpha",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "onLeftButtonUp",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onLeftButtonDown",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onRightButtonUp",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onRightButtonDown",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onRightButtonDblClk",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onLeftButtonDblClk",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onMouseWheelUp",
				parameters: [["int", "clicked"], ["int", "lines"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "onMouseWheelDown",
				parameters: [["int", "clicked"], ["int", "lines"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "onMouseMove",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onEnterArea",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onLeaveArea",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setEnabled",
				parameters: [["boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getEnabled",
				parameters: [],
				result: "boolean",
				deprecated: !1
			},
			{
				name: "onEnable",
				parameters: [["boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "resize",
				parameters: [
					["int", "x"],
					["int", "y"],
					["int", "w"],
					["int", "h"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "onResize",
				parameters: [
					["int", "x"],
					["int", "y"],
					["int", "w"],
					["int", "h"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "isMouseOver",
				parameters: [["int", "x"], ["int", "y"]],
				result: "boolean",
				deprecated: !1
			},
			{
				name: "getLeft",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getTop",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getWidth",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getHeight",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "setTargetX",
				parameters: [["int", "x"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setTargetY",
				parameters: [["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setTargetW",
				parameters: [["int", "w"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setTargetH",
				parameters: [["int", "r"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setTargetA",
				parameters: [["int", "alpha"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setTargetSpeed",
				parameters: [["float", "insecond"]],
				result: "",
				deprecated: !1
			},
			{
				name: "gotoTarget",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onTargetReached",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "cancelTarget",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "reverseTarget",
				parameters: [["int", "reverse"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onStartup",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isGoingToTarget",
				parameters: [],
				result: "boolean",
				deprecated: !1
			},
			{
				name: "setXmlParam",
				parameters: [["String", "param"], ["String", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getXmlParam",
				parameters: [["String", "param"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "init",
				parameters: [["Group", "parent"]],
				result: "",
				deprecated: !1
			},
			{
				name: "bringToFront",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "bringToBack",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "bringAbove",
				parameters: [["GuiObject", "guiobj"]],
				result: "",
				deprecated: !1
			},
			{
				name: "bringBelow",
				parameters: [["GuiObject", "guiobj"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getGuiX",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiY",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiW",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiH",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiRelatX",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiRelatY",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiRelatW",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getGuiRelatH",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isActive",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getParent",
				parameters: [],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "getParentLayout",
				parameters: [],
				result: "Layout",
				deprecated: !1
			},
			{
				name: "getTopParent",
				parameters: [],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "runModal",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "endModal",
				parameters: [["int", "retcode"]],
				result: "",
				deprecated: !1
			},
			{
				name: "findObject",
				parameters: [["String", "id"]],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "findObjectXY",
				parameters: [["int", "x"], ["int", "y"]],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "getName",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "clientToScreenX",
				parameters: [["int", "x"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "clientToScreenY",
				parameters: [["int", "y"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "clientToScreenW",
				parameters: [["int", "w"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "clientToScreenH",
				parameters: [["int", "h"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "screenToClientX",
				parameters: [["int", "x"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "screenToClientY",
				parameters: [["int", "y"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "screenToClientW",
				parameters: [["int", "w"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "screenToClientH",
				parameters: [["int", "h"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "getAutoWidth",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getAutoHeight",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "setFocus",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onChar",
				parameters: [["String", "c"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onAccelerator",
				parameters: [["String", "accel"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isMouseOverRect",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getInterface",
				parameters: [["String", "interface_guid"]],
				result: "Object",
				deprecated: !1
			},
			{
				name: "onDragEnter",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onDragOver",
				parameters: [["int", "x"], ["int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onDragLeave",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onKeyDown",
				parameters: [["int", "vk_code"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onKeyUp",
				parameters: [["int", "vk_code"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onGetFocus",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onKillFocus",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "sendAction",
				parameters: [
					["String", "action"],
					["String", "param"],
					["Int", "x"],
					["int", "y"],
					["int", "p1"],
					["int", "p2"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onAction",
				parameters: [
					["String", "action"],
					["String", "param"],
					["Int", "x"],
					["int", "y"],
					["int", "p1"],
					["int", "p2"],
					["GuiObject", "source"]
				],
				result: "Int",
				deprecated: !1
			}
		]
	},
	"45BE95E520724191935CBB5FF9F117FD": {
		parent: "GuiObject",
		name: "Group",
		deprecated: !1,
		functions: [
			{
				name: "getObject",
				parameters: [["String", "object_id"]],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "getNumObjects",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumObject",
				parameters: [["Int", "num"]],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "onCreateObject",
				parameters: [["GuiObject", "newobj"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getMousePosX",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMousePosY",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isLayout",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			}
		]
	},
	"60906D4E537E482eB004CC9461885672": {
		parent: "Group",
		name: "Layout",
		deprecated: !1,
		functions: [
			{
				name: "onDock",
				parameters: [["int", "side"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onUndock",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onScale",
				parameters: [["Double", "newscalevalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getScale",
				parameters: [],
				result: "Double",
				deprecated: !1
			},
			{
				name: "setScale",
				parameters: [["Double", "scalevalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setDesktopAlpha",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getDesktopAlpha",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getContainer",
				parameters: [],
				result: "Container",
				deprecated: !1
			},
			{
				name: "center",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onMove",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onEndMove",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onUserResize",
				parameters: [
					["int", "x"],
					["int", "y"],
					["int", "w"],
					["int", "h"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "snapAdjust",
				parameters: [
					["int", "left"],
					["int", "top"],
					["int", "right"],
					["int", "bottom"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "getSnapAdjustTop",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getSnapAdjustRight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getSnapAdjustLeft",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getSnapAdjustBottom",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setRedrawOnResize",
				parameters: [["int", "wantredrawonresize"]],
				result: "",
				deprecated: !1
			},
			{
				name: "beforeRedock",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "redock",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isTransparencySafe",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "isLayoutAnimationSafe",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "onMouseEnterLayout",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onMouseLeaveLayout",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onSnapAdjustChanged",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	},
	"403ABCC06F224bd68BA410C829932547": {
		parent: "GuiObject",
		name: "WindowHolder",
		deprecated: !1,
		functions: [
			{
				name: "setRegionFromMap",
				parameters: [
					["Map", "regionmap"],
					["Int", "threshold"],
					["Boolean", "reverse"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "setRegion",
				parameters: [["Region", "reg"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getContent",
				parameters: [],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "getGuid",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getComponentName",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "onGetWac",
				parameters: [["Wac", "wacobj"]],
				result: "",
				deprecated: !0
			},
			{
				name: "onGiveUpWac",
				parameters: [["Wac", "wacobj"]],
				result: "",
				deprecated: !0
			},
			{
				name: "getWac",
				parameters: [],
				result: "Wac",
				deprecated: !0
			},
			{
				name: "setAcceptWac",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !0
			}
		]
	},
	"97AA3E4DF4D04fa8817B0AF22A454983": {
		parent: "GuiObject",
		name: "ComponentBucket",
		deprecated: !1,
		functions: [
			{
				name: "getMaxHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getMaxWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setScroll",
				parameters: [["int", "x"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getScroll",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumChildren",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumChildren",
				parameters: [["int", "n"]],
				result: "GuiObject",
				deprecated: !1
			}
		]
	},
	"64E4BBFA81F449d9B0C0A85B2EC3BCFD": {
		parent: "GuiObject",
		name: "Edit",
		deprecated: !1,
		functions: [
			{
				name: "onEnter",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onAbort",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onIdleEditUpdate",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onEditUpdate",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setText",
				parameters: [["String", "txt"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setAutoEnter",
				parameters: [["boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getAutoEnter",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getText",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "selectAll",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "enter",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setIdleEnabled",
				parameters: [["boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getIdleEnabled",
				parameters: [],
				result: "Int",
				deprecated: !1
			}
		]
	},
	"62B65E3F375E408d8DEA76814AB91B77": {
		parent: "GuiObject",
		name: "Slider",
		deprecated: !1,
		functions: [
			{
				name: "onSetPosition",
				parameters: [["int", "newpos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onPostedPosition",
				parameters: [["int", "newpos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onSetFinalPosition",
				parameters: [["int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setPosition",
				parameters: [["int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getPosition",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "lock",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "unlock",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	},
	CE4F97BE77B04e199956D49833C96C27: {
		parent: "GuiObject",
		name: "Vis",
		deprecated: !1,
		functions: [
			{
				name: "onFrame",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setRealtime",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getRealtime",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getMode",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setMode",
				parameters: [["Int", "mode"]],
				result: "",
				deprecated: !1
			},
			{
				name: "nextMode",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	},
	A8C2200D51EB4b2aBA7F5D4BC65D4C71: {
		parent: "GuiObject",
		name: "Browser",
		deprecated: !1,
		functions: [
			{
				name: "navigateUrl",
				parameters: [["String", "url"]],
				result: "",
				deprecated: !1
			},
			{
				name: "back",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "forward",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "stop",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "refresh",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "home",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setTargetName",
				parameters: [["String", "targetname"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onBeforeNavigate",
				parameters: [
					["String", "url"],
					["Int", "flags"],
					["String", "targetframename"]
				],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "onDocumentComplete",
				parameters: [["String", "url"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onDocumentReady",
				parameters: [["String", "url"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getDocumentTitle",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "onNavigateError",
				parameters: [["String", "url"], ["int", "code"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setCancelIEErrorPage",
				parameters: [["boolean", "cancel"]],
				result: "",
				deprecated: !1
			},
			{
				name: "scrape",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onMediaLink",
				parameters: [["string", "url"]],
				result: "string",
				deprecated: !1
			}
		]
	},
	"8D1EBA38489E483eB9608D1F43C5C405": {
		parent: "GuiObject",
		name: "EqVis",
		deprecated: !1,
		functions: []
	},
	"0F08C940AF394b2380F3B8C48F7EBB59": {
		parent: "GuiObject",
		name: "Status",
		deprecated: !1,
		functions: []
	},
	EFAA8672310E41faB7DC85A9525BCB4B: {
		parent: "GuiObject",
		name: "Text",
		deprecated: !1,
		functions: [
			{
				name: "setText",
				parameters: [["String", "txt"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setAlternateText",
				parameters: [["String", "txt"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getText",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getTextWidth",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "onTextChanged",
				parameters: [["String", "newtxt"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"7DFD324437514e7cBF4082AE5F3ADC33": {
		parent: "GuiObject",
		name: "Title",
		deprecated: !1,
		functions: []
	},
	"5AB9FA159A7D4557ABC86557A6C67CA9": {
		parent: "GuiObject",
		name: "Layer",
		deprecated: !1,
		functions: [
			{
				name: "onBeginResize",
				parameters: [
					["int", "x"],
					["int", "y"],
					["int", "w"],
					["int", "h"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "onEndResize",
				parameters: [
					["int", "x"],
					["int", "y"],
					["int", "w"],
					["int", "h"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_onInit",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_onFrame",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_onGetPixelR",
				parameters: [
					["double", "r"],
					["double", "d"],
					["double", "x"],
					["double", "y"]
				],
				result: "Double",
				deprecated: !1
			},
			{
				name: "fx_onGetPixelD",
				parameters: [
					["double", "r"],
					["double", "d"],
					["double", "x"],
					["double", "y"]
				],
				result: "Double",
				deprecated: !1
			},
			{
				name: "fx_onGetPixelX",
				parameters: [
					["double", "r"],
					["double", "d"],
					["double", "x"],
					["double", "y"]
				],
				result: "Double",
				deprecated: !1
			},
			{
				name: "fx_onGetPixelY",
				parameters: [
					["double", "r"],
					["double", "d"],
					["double", "x"],
					["double", "y"]
				],
				result: "Double",
				deprecated: !1
			},
			{
				name: "fx_onGetPixelA",
				parameters: [
					["double", "r"],
					["double", "d"],
					["double", "x"],
					["double", "y"]
				],
				result: "Double",
				deprecated: !1
			},
			{
				name: "setRegionFromMap",
				parameters: [
					["Map", "regionmap"],
					["int", "threshold"],
					["boolean", "reverse"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "setRegion",
				parameters: [["Region", "reg"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_setEnabled",
				parameters: [["boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getEnabled",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setWrap",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getWrap",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setRect",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getRect",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setBgFx",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getBgFx",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setClear",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getClear",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setSpeed",
				parameters: [["Int", "msperframe"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getSpeed",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "fx_setRealtime",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getRealtime",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setLocalized",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getLocalized",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setBilinear",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getBilinear",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setAlphaMode",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_getAlphaMode",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "fx_setGridSize",
				parameters: [["Int", "x"], ["Int", "y"]],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_update",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "fx_restart",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isInvalid",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			}
		]
	},
	"698EDDCD8F1E4fec9B12F944F909FF45": {
		parent: "GuiObject",
		name: "Button",
		deprecated: !1,
		functions: [
			{
				name: "onActivate",
				parameters: [["int", "activated"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onLeftClick",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onRightClick",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setActivated",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setActivatedNoCallback",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getActivated",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "leftClick",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "rightClick",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	},
	"6B64CD275A264c4b8C59E6A70CF6493A": {
		parent: "Layer",
		name: "AnimatedLayer",
		deprecated: !1,
		functions: [
			{
				name: "onPlay",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onPause",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onResume",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onStop",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onFrame",
				parameters: [["Int", "framenum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setSpeed",
				parameters: [["Int", "msperframe"]],
				result: "",
				deprecated: !1
			},
			{
				name: "gotoFrame",
				parameters: [["int", "framenum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setStartFrame",
				parameters: [["Int", "framenum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setEndFrame",
				parameters: [["int", "framenum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setAutoReplay",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			},
			{
				name: "play",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "stop",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "pause",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isPlaying",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "isPaused",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "isStopped",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getStartFrame",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getEndFrame",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getLength",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getDirection",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getAutoReplay",
				parameters: [],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "getCurFrame",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setRealtime",
				parameters: [["Boolean", "onoff"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"6DCB05E48AC448c2B19349F0910EF54A": {
		parent: "Layer",
		name: "AlbumArtLayer",
		deprecated: !1,
		functions: [
			{
				name: "refresh",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isLoading",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onAlbumArtLoaded",
				parameters: [["boolean", "success"]],
				result: "",
				deprecated: !1
			}
		]
	},
	B4DCCFFF81FE4bcc961B720FD5BE0FFF: {
		parent: "Button",
		name: "ToggleButton",
		deprecated: !1,
		functions: [{
			name: "onToggle",
			parameters: [["Boolean", "onoff"]],
			result: "",
			deprecated: !1
		}, {
			name: "getCurCfgVal",
			parameters: [],
			result: "int",
			deprecated: !1
		}]
	},
	"01E28CE1B05911d5979FE4DE6F51760A": {
		parent: "GuiObject",
		name: "GroupList",
		deprecated: !1,
		functions: [
			{
				name: "instantiate",
				parameters: [["String", "group_id"], ["int", "num_groups"]],
				result: "Group",
				deprecated: !1
			},
			{
				name: "getNumItems",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumItem",
				parameters: [["int", "num"]],
				result: "Group",
				deprecated: !1
			},
			{
				name: "removeAll",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "scrollToPercent",
				parameters: [["Int", "percent"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setRedraw",
				parameters: [["int", "redraw"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"80F0F8BD1BA542a6A0933236A00C8D4A": {
		parent: "Group",
		name: "CfgGroup",
		deprecated: !1,
		functions: [
			{
				name: "cfgGetInt",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "cfgSetInt",
				parameters: [["Int", "intvalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "cfgGetString",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "cfgGetFloat",
				parameters: [],
				result: "Float",
				deprecated: !1
			},
			{
				name: "cfgSetFloat",
				parameters: [["Float", "floatvalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "cfgSetString",
				parameters: [["String", "strvalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onCfgChanged",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "cfgGetGuid",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "cfgGetName",
				parameters: [],
				result: "String",
				deprecated: !1
			}
		]
	},
	CDCB785D81F242538F0561B872283CFA: {
		parent: "GuiObject",
		name: "QueryList",
		deprecated: !0,
		functions: [{
			name: "onResetQuery",
			parameters: [],
			result: "",
			deprecated: !0
		}]
	},
	"9B2E341B6C9840fa8B850C1B6EE89405": {
		parent: "GuiObject",
		name: "MouseRedir",
		deprecated: !1,
		functions: [
			{
				name: "setRedirection",
				parameters: [["GuiObject", "o"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getRedirection",
				parameters: [],
				result: "GuiObject",
				deprecated: !1
			},
			{
				name: "setRegionFromMap",
				parameters: [
					["Map", "regionmap"],
					["Int", "threshold"],
					["Boolean", "reverse"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "setRegion",
				parameters: [["Region", "reg"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"36D59B7103FD4af897950502B7DB267A": {
		parent: "GuiObject",
		name: "DropDownList",
		deprecated: !1,
		functions: [
			{
				name: "getItemSelected",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "onSelect",
				parameters: [["Int", "id"], ["Int", "hover"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setListHeight",
				parameters: [["Int", "h"]],
				result: "",
				deprecated: !1
			},
			{
				name: "openList",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "closeList",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setItems",
				parameters: [["String", "lotsofitems"]],
				result: "",
				deprecated: !1
			},
			{
				name: "addItem",
				parameters: [["String", "_text"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "delItem",
				parameters: [["Int", "id"]],
				result: "",
				deprecated: !1
			},
			{
				name: "findItem",
				parameters: [["String", "_text"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumItems",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "selectItem",
				parameters: [["Int", "id"], ["Int", "hover"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getItemText",
				parameters: [["Int", "id"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getSelected",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getSelectedText",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "getCustomText",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "deleteAllItems",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setNoItemText",
				parameters: [["String", "txt"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"7FD5F210ACC448dfA6A05451576CDC76": {
		parent: "GuiObject",
		name: "LayoutStatus",
		deprecated: !1,
		functions: [{
			name: "callme",
			parameters: [["String", "str"]],
			result: "",
			deprecated: !1
		}]
	},
	B5BAA53505B34dcbADC1E618D28F6896: {
		parent: "GuiObject",
		name: "TabSheet",
		deprecated: !1,
		functions: [{
			name: "getCurPage",
			parameters: [],
			result: "Int",
			deprecated: !1
		}, {
			name: "setCurPage",
			parameters: [["Int", "a"]],
			result: "",
			deprecated: !1
		}]
	},
	"6129FEC1DAB74d51916501CA0C1B70DB": {
		parent: "GuiObject",
		name: "GuiList",
		deprecated: !1,
		functions: [
			{
				name: "addColumn",
				parameters: [
					["String", "name"],
					["Int", "width"],
					["Int", "numeric"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumColumns",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getColumnWidth",
				parameters: [["Int", "column"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setColumnWidth",
				parameters: [["Int", "column"], ["Int", "newwidth"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getColumnLabel",
				parameters: [["Int", "column"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "setColumnLabel",
				parameters: [["Int", "column"], ["String", "newlabel"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getColumnNumeric",
				parameters: [["Int", "column"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setColumnDynamic",
				parameters: [["Int", "column"], ["Int", "isdynamic"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isColumnDynamic",
				parameters: [["Int", "column"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "invalidateColumns",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getNumItems",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemCount",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "addItem",
				parameters: [["String", "label"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "insertItem",
				parameters: [["Int", "pos"], ["String", "label"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getLastAddedItemPos",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setSubItem",
				parameters: [
					["Int", "pos"],
					["Int", "subpos"],
					["String", "txt"]
				],
				result: "",
				deprecated: !1
			},
			{
				name: "deleteAllItems",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "deleteByPos",
				parameters: [["Int", "pos"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemLabel",
				parameters: [["Int", "pos"], ["Int", "subpos"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getSubitemText",
				parameters: [["Int", "pos"], ["Int", "subpos"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "setItemLabel",
				parameters: [["Int", "pos"], ["String", "_text"]],
				result: "",
				deprecated: !1
			},
			{
				name: "invalidateItem",
				parameters: [["Int", "pos"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getFirstItemVisible",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getLastItemVisible",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setItemIcon",
				parameters: [["Int", "pos"], ["String", "bitmapId"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getItemIcon",
				parameters: [["Int", "pos"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "setMinimumSize",
				parameters: [["Int", "size"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getWantAutoDeselect",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setWantAutoDeselect",
				parameters: [["Int", "want"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onSetVisible",
				parameters: [["Int", "show"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setAutoSort",
				parameters: [["Int", "dosort"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setFontSize",
				parameters: [["Int", "size"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getFontSize",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getHeaderHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getPreventMultipleSelection",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setPreventMultipleSelection",
				parameters: [["Int", "val"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setShowIcons",
				parameters: [["int", "showThem"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getShowIcons",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setIconWidth",
				parameters: [["int", "width"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setIconHeight",
				parameters: [["int", "width"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getIconWidth",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getIconHeight",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "next",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "previous",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "pagedown",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "pageup",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "home",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "end",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "reset",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "ensureItemVisible",
				parameters: [["Int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "scrollAbsolute",
				parameters: [["Int", "x"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "scrollRelative",
				parameters: [["Int", "x"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "scrollLeft",
				parameters: [["Int", "lines"]],
				result: "",
				deprecated: !1
			},
			{
				name: "scrollRight",
				parameters: [["Int", "lines"]],
				result: "",
				deprecated: !1
			},
			{
				name: "scrollUp",
				parameters: [["Int", "lines"]],
				result: "",
				deprecated: !1
			},
			{
				name: "scrollDown",
				parameters: [["Int", "lines"]],
				result: "",
				deprecated: !1
			},
			{
				name: "jumpToNext",
				parameters: [["Int", "c"]],
				result: "",
				deprecated: !1
			},
			{
				name: "scrollToItem",
				parameters: [["Int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "selectCurrent",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "selectFirstEntry",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getItemSelected",
				parameters: [["Int", "pos"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isItemFocused",
				parameters: [["Int", "pos"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemFocused",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setItemFocused",
				parameters: [["Int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getFirstItemSelected",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNextItemSelected",
				parameters: [["Int", "lastpos"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "selectAll",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "deselectAll",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "invertSelection",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setSelectionStart",
				parameters: [["Int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setSelectionEnd",
				parameters: [["Int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setSelected",
				parameters: [["Int", "pos"], ["Int", "selected"]],
				result: "",
				deprecated: !1
			},
			{
				name: "toggleSelection",
				parameters: [["Int", "pos"], ["Int", "setfocus"]],
				result: "",
				deprecated: !1
			},
			{
				name: "resort",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getSortDirection",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getSortColumn",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setSortColumn",
				parameters: [["Int", "col"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setSortDirection",
				parameters: [["Int", "dir"]],
				result: "",
				deprecated: !1
			},
			{
				name: "moveItem",
				parameters: [["Int", "from"], ["Int", "to"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onSelectAll",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onDelete",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onDoubleClick",
				parameters: [["Int", "itemnum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onLeftClick",
				parameters: [["Int", "itemnum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onSecondLeftClick",
				parameters: [["Int", "itemnum"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onRightClick",
				parameters: [["Int", "itemnum"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onColumnDblClick",
				parameters: [
					["Int", "col"],
					["Int", "x"],
					["Int", "y"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onColumnLabelClick",
				parameters: [
					["Int", "col"],
					["Int", "x"],
					["Int", "y"]
				],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onItemSelection",
				parameters: [["Int", "itemnum"], ["Int", "selected"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onIconLeftClick",
				parameters: [
					["int", "itemnum"],
					["int", "x"],
					["int", "y"]
				],
				result: "Int",
				deprecated: !1
			}
		]
	},
	D59514F7ED3645e8980F3F4EA0522CD9: {
		parent: "GuiObject",
		name: "GuiTree",
		deprecated: !1,
		functions: [
			{
				name: "onWantAutoContextMenu",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onMouseWheelUp",
				parameters: [["Int", "clicked"], ["Int", "lines"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onMouseWheelDown",
				parameters: [["Int", "clicked"], ["Int", "lines"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onContextMenu",
				parameters: [["Int", "x"], ["Int", "y"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onChar",
				parameters: [["Int", "c"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onItemRecvDrop",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onLabelChange",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onItemSelected",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onItemDeselected",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getNumRootItems",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumRootItem",
				parameters: [["Int", "which"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "jumpToNext",
				parameters: [["Int", "c"]],
				result: "",
				deprecated: !1
			},
			{
				name: "ensureItemVisible",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getContentsWidth",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getContentsHeight",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "addTreeItem",
				parameters: [
					["TreeItem", "item"],
					["TreeItem", "par"],
					["Int", "sorted"],
					["Int", "haschildtab"]
				],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "removeTreeItem",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "moveTreeItem",
				parameters: [["TreeItem", "item"], ["TreeItem", "newparent"]],
				result: "",
				deprecated: !1
			},
			{
				name: "deleteAllItems",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "expandItem",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "expandItemDeferred",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "collapseItem",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "collapseItemDeferred",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "selectItem",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "selectItemDeferred",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "delItemDeferred",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "hiliteItem",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "unhiliteItem",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getCurItem",
				parameters: [],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "hitTest",
				parameters: [["Int", "x"], ["Int", "y"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "editItemLabel",
				parameters: [["TreeItem", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "cancelEditLabel",
				parameters: [["Int", "destroyit"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setAutoEdit",
				parameters: [["Int", "ae"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getAutoEdit",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getByLabel",
				parameters: [["TreeItem", "item"], ["String", "name"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "setSorted",
				parameters: [["Int", "dosort"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getSorted",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "sortTreeItems",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getSibling",
				parameters: [["TreeItem", "item"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "setAutoCollapse",
				parameters: [["Int", "doautocollapse"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setFontSize",
				parameters: [["Int", "newsize"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getFontSize",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumVisibleChildItems",
				parameters: [["TreeItem", "c"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getNumVisibleItems",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "enumVisibleItems",
				parameters: [["Int", "n"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "enumVisibleChildItems",
				parameters: [["TreeItem", "c"], ["Int", "n"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "enumAllItems",
				parameters: [["Int", "n"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "getItemRectX",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemRectY",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemRectW",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemRectH",
				parameters: [["TreeItem", "item"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getItemFromPoint",
				parameters: [["Int", "x"], ["Int", "y"]],
				result: "TreeItem",
				deprecated: !1
			}
		]
	},
	"9B3B4B82667A420e8FFC794115809C02": {
		parent: "Object",
		name: "TreeItem",
		deprecated: !1,
		functions: [
			{
				name: "getNumChildren",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setLabel",
				parameters: [["String", "label"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getLabel",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "ensureVisible",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getNthChild",
				parameters: [["Int", "nth"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "getChild",
				parameters: [],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "getChildSibling",
				parameters: [["TreeItem", "_item"]],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "getSibling",
				parameters: [],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "getParent",
				parameters: [],
				result: "TreeItem",
				deprecated: !1
			},
			{
				name: "editLabel",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "hasSubItems",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setSorted",
				parameters: [["Int", "issorted"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setChildTab",
				parameters: [["Int", "haschildtab"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isSorted",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isCollapsed",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isExpanded",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "invalidate",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "isSelected",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "isHilited",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setHilited",
				parameters: [["Int", "ishilited"]],
				result: "",
				deprecated: !1
			},
			{
				name: "collapse",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "expand",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "getTree",
				parameters: [],
				result: "GuiTree",
				deprecated: !1
			},
			{
				name: "onTreeAdd",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onTreeRemove",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onSelect",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onDeselect",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onLeftDoubleClick",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onRightDoubleClick",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onChar",
				parameters: [["Int", "key"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onExpand",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onCollapse",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onBeginLabelEdit",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onEndLabelEdit",
				parameters: [["String", "newlabel"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "onContextMenu",
				parameters: [["Int", "x"], ["Int", "y"]],
				result: "Int",
				deprecated: !1
			}
		]
	},
	"1D8631C880D047929F98BD5D36B49136": {
		parent: "GuiObject",
		name: "MenuButton",
		deprecated: !0,
		functions: [
			{
				name: "onOpenMenu",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "onCloseMenu",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "onSelectItem",
				parameters: [["String", "item"]],
				result: "",
				deprecated: !0
			},
			{
				name: "openMenu",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "closeMenu",
				parameters: [],
				result: "",
				deprecated: !0
			}
		]
	},
	C7ED319953194798986360B15A298CAA: {
		parent: "GuiObject",
		name: "CheckBox",
		deprecated: !1,
		functions: [
			{
				name: "onToggle",
				parameters: [["int", "newstate"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setChecked",
				parameters: [["int", "checked"]],
				result: "",
				deprecated: !1
			},
			{
				name: "isChecked",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setText",
				parameters: [["String", "txt"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getText",
				parameters: [],
				result: "String",
				deprecated: !1
			}
		]
	},
	"2D2D1376BE0A4CB9BC0C57E6E4C999F5": {
		parent: "GuiObject",
		name: "Form",
		deprecated: !0,
		functions: [
			{
				name: "getContentsHeight",
				parameters: [],
				result: "Int",
				deprecated: !0
			},
			{
				name: "newCell",
				parameters: [["String", "groupname"]],
				result: "",
				deprecated: !0
			},
			{
				name: "nextRow",
				parameters: [],
				result: "",
				deprecated: !0
			},
			{
				name: "deleteAll",
				parameters: [],
				result: "",
				deprecated: !0
			}
		]
	},
	E2BBC14D84F64173BDB3B2EB2F665550: {
		parent: "GuiObject",
		name: "Frame",
		deprecated: !1,
		functions: [
			{
				name: "getPosition",
				parameters: [],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setPosition",
				parameters: [["Int", "position"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onSetPosition",
				parameters: [["Int", "position"]],
				result: "",
				deprecated: !1
			}
		]
	},
	"73C00594961F401B9B1B672427AC4165": {
		parent: "GuiObject",
		name: "Menu",
		deprecated: !1,
		functions: [
			{
				name: "setMenuGroup",
				parameters: [["String", "groupId"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getMenuGroup",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "setMenu",
				parameters: [["String", "menuId"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getMenu",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "spawnMenu",
				parameters: [["int", "monitor"]],
				result: "",
				deprecated: !1
			},
			{
				name: "cancelMenu",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "setNormalId",
				parameters: [["String", "id"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setDownId",
				parameters: [["String", "id"]],
				result: "",
				deprecated: !1
			},
			{
				name: "setHoverId",
				parameters: [["String", "id"]],
				result: "",
				deprecated: !1
			},
			{
				name: "onOpenMenu",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "onCloseMenu",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "nextMenu",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "previousMenu",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	}
}, pe = {};
Object.values(fe).forEach((e) => {
	pe[e.name] = e;
});
function getMethod$1(e, t) {
	return pe[e].functions.find(({ name: e }) => e === t);
}
e(getMethod$1, "getMethod"), getMethod$1("Timer", "isRunning").result = "boolean", getMethod$1("ToggleButton", "onToggle").parameters[0][1] = "onoff", getMethod$1("GuiTree", "onChar").parameters[0][0] = "string", getMethod$1("GuiList", "onSetVisible").parameters[0][0] = "boolean", getMethod$1("Wac", "onNotify").parameters = getMethod$1("Object", "onNotify").parameters, getMethod$1("Wac", "onNotify").result = "int";
var me = fe, he = {
	"345BEEBC0229492190BE6CB6A49A79D9": {
		parent: "Object",
		name: "PlEdit",
		deprecated: !1,
		functions: [
			{
				name: "getNumTracks",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getCurrentIndex",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getNumSelectedTracks",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getNextSelectedTrack",
				parameters: [["int", "i"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "showCurrentlyPlayingTrack",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "showTrack",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "enqueueFile",
				parameters: [["string", "file"]],
				result: "",
				deprecated: !1
			},
			{
				name: "clear",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "removeTrack",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "swapTracks",
				parameters: [["int", "item1"], ["int", "item2"]],
				result: "",
				deprecated: !1
			},
			{
				name: "moveUp",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "moveDown",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "moveTo",
				parameters: [["int", "item"], ["int", "pos"]],
				result: "",
				deprecated: !1
			},
			{
				name: "playTrack",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getRating",
				parameters: [["int", "item"]],
				result: "int",
				deprecated: !1
			},
			{
				name: "setRating",
				parameters: [["int", "item"], ["int", "rating"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getTitle",
				parameters: [["int", "item"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getLength",
				parameters: [["int", "item"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getMetaData",
				parameters: [["int", "item"], ["String", "metadatastring"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getFileName",
				parameters: [["int", "item"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "onPleditModified",
				parameters: [],
				result: "",
				deprecated: !1
			}
		]
	},
	"61A7ABAD7D7941f6B1D0E1808603A4F4": {
		parent: "Object",
		name: "PlDir",
		deprecated: !1,
		functions: [
			{
				name: "getNumItems",
				parameters: [],
				result: "int",
				deprecated: !1
			},
			{
				name: "getItemName",
				parameters: [["int", "item"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "showCurrentlyPlayingEntry",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "refresh",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "renameItem",
				parameters: [["int", "item"], ["String", "name"]],
				result: "",
				deprecated: !1
			},
			{
				name: "enqueueItem",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			},
			{
				name: "playItem",
				parameters: [["int", "item"]],
				result: "",
				deprecated: !1
			}
		]
	}
}, ge = {
	"593DBA22D0774976B952F4713655400B": {
		parent: "Object",
		name: "Config",
		deprecated: !1,
		functions: [
			{
				name: "getItem",
				parameters: [["String", "item_name"]],
				result: "ConfigItem",
				deprecated: !1
			},
			{
				name: "getItemByGuid",
				parameters: [["String", "item_guid"]],
				result: "ConfigItem",
				deprecated: !1
			},
			{
				name: "newItem",
				parameters: [["String", "item_name"], ["String", "item_guid"]],
				result: "ConfigItem",
				deprecated: !1
			}
		]
	},
	D40302823AAB4d87878D12326FADFCD5: {
		parent: "Object",
		name: "ConfigItem",
		deprecated: !1,
		functions: [
			{
				name: "getAttribute",
				parameters: [["String", "attr_name"]],
				result: "ConfigAttribute",
				deprecated: !1
			},
			{
				name: "newAttribute",
				parameters: [["String", "attr_name"], ["String", "default_value"]],
				result: "ConfigAttribute",
				deprecated: !1
			},
			{
				name: "getGuid",
				parameters: [["String", "attr_name"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "getName",
				parameters: [],
				result: "String",
				deprecated: !1
			}
		]
	},
	"24DEC283B76E4a368CCC9E24C46B6C73": {
		parent: "Object",
		name: "ConfigAttribute",
		deprecated: !1,
		functions: [
			{
				name: "setData",
				parameters: [["String", "value"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getData",
				parameters: [],
				result: "String",
				deprecated: !1
			},
			{
				name: "onDataChanged",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "getParentItem",
				parameters: [],
				result: "ConfigItem",
				deprecated: !1
			},
			{
				name: "getAttributeName",
				parameters: [],
				result: "String",
				deprecated: !1
			}
		]
	}
}, _e = {
	B2AD3F2B31ED4e31BC6DE9951CD555BB: {
		parent: "Object",
		name: "WinampConfig",
		deprecated: !1,
		functions: [{
			name: "getGroup",
			parameters: [["String", "config_group_guid"]],
			result: "WinampConfigGroup",
			deprecated: !1
		}]
	},
	FC17844EC72B4518A068A8F930A5BA80: {
		parent: "Object",
		name: "WinampConfigGroup",
		deprecated: !1,
		functions: [
			{
				name: "getBool",
				parameters: [["String", "itemname"]],
				result: "Boolean",
				deprecated: !1
			},
			{
				name: "setBool",
				parameters: [["String", "itemname"], ["Boolean", "itemvalue"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getInt",
				parameters: [["String", "itemname"]],
				result: "Int",
				deprecated: !1
			},
			{
				name: "setInt",
				parameters: [["String", "itemname"]],
				result: "",
				deprecated: !1
			},
			{
				name: "getString",
				parameters: [["String", "itemname"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "setString",
				parameters: [["String", "itemname"]],
				result: "",
				deprecated: !1
			}
		]
	}
}, ve = { B8E867B027154da7A5BA53DBA1FCFEAC: {
	parent: "Object",
	name: "Application",
	deprecated: !1,
	functions: [
		{
			name: "GetApplicationName",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "GetVersionString",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "GetVersionNumberString",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "GetBuildNumber",
			parameters: [],
			result: "int",
			deprecated: !1
		},
		{
			name: "GetGUID",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "GetCommandLine",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "Shutdown",
			parameters: [],
			result: "",
			deprecated: !1
		},
		{
			name: "CancelShutdown",
			parameters: [],
			result: "",
			deprecated: !1
		},
		{
			name: "IsShuttingDown",
			parameters: [],
			result: "boolean",
			deprecated: !1
		},
		{
			name: "GetApplicationPath",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "GetSettingsPath",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "GetWorkingPath",
			parameters: [],
			result: "String",
			deprecated: !1
		},
		{
			name: "SetWorkingPath",
			parameters: [["String", "working_path"]],
			result: "",
			deprecated: !1
		}
	]
} }, ye = {
	"836F8B2EE0D14db4937F0D0A04C8DCD1": {
		parent: "Object",
		name: "File",
		deprecated: !1,
		functions: [
			{
				name: "load",
				parameters: [["String", "path"]],
				result: "",
				deprecated: !1
			},
			{
				name: "exists",
				parameters: [],
				result: "boolean",
				deprecated: !1
			},
			{
				name: "getSize",
				parameters: [],
				result: "int",
				deprecated: !1
			}
		]
	},
	"417FFB69987F4be88D87D9965EEEC868": {
		parent: "File",
		name: "XmlDoc",
		deprecated: !1,
		functions: [
			{
				name: "parser_addCallback",
				parameters: [["String", "section"]],
				result: "",
				deprecated: !1
			},
			{
				name: "parser_start",
				parameters: [],
				result: "",
				deprecated: !1
			},
			{
				name: "parser_onCallback",
				parameters: [
					["String", "xmlpath"],
					["String", "xmltag"],
					["list", "paramname"],
					["list", "paramvalue"]
				],
				result: "String",
				deprecated: !1
			},
			{
				name: "parser_onCloseCallback",
				parameters: [["String", "xmlpath"], ["String", "xmltag"]],
				result: "String",
				deprecated: !1
			},
			{
				name: "parser_onError",
				parameters: [
					["String", "filename"],
					["int", "linenum"],
					["String", "incpath"],
					["int", "errcode"],
					["String", "errstr"]
				],
				result: "String",
				deprecated: !1
			},
			{
				name: "parser_destroy",
				parameters: [],
				result: "String",
				deprecated: !1
			}
		]
	}
}, be = {
	...me,
	...he,
	...ge,
	..._e,
	...ve,
	...ye
};
function getClass(e) {
	return xe[getFormattedId(e)];
}
function getReturnType(e, t) {
	let m = getMethod(e, t).result.toUpperCase();
	switch (m) {
		case "INT":
		case "DOUBLE":
		case "STRING":
		case "FLOAT":
		case "BOOLEAN":
		case "ANY": return m;
		case "": return "NULL";
		default: return "OBJECT";
	}
}
function getMethod(e, t) {
	let m = getClass(e);
	return assert(m != null, `Could not find class matching id: ${e}`), getObjectFunction(m, t);
}
var xe = {};
Object.keys(be).forEach((e) => {
	xe[e.toLowerCase()] = be[e];
});
var Se = {};
Object.values(be).forEach((e) => {
	Se[e.name] = e;
}), Object.values(xe).forEach((e) => {
	let t = Se[e.parent];
	if (t == null && e.parent !== "@{00000000-0000-0000-0000-000000000000}@") throw Error(`Could not find parent class named ${e.parent}`);
	e.parentClass = t;
});
function getFormattedId(e) {
	return e.replace(/(........)(....)(....)(..)(..)(..)(..)(..)(..)(..)(..)/, "$1$3$2$7$6$5$4$11$10$9$8").toLowerCase();
}
function getObjectFunction(e, t) {
	let m = t.toLowerCase(), v = e.functions.find((e) => e.name.toLowerCase() === m);
	if (v != null) return v;
	if (e.parentClass == null) throw Error(`Could not find method ${t} on ${e.name}.`);
	return getObjectFunction(e.parentClass, t);
}
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/BaseObject.js
var BaseObject = class {
	getclassname() {
		return this.constructor.name;
	}
	getid() {
		return this.getId();
	}
	getId() {
		return this._id;
	}
	dispose() {}
};
BaseObject.GUID = "516549714a510d87b5a6e391e7f33532";
//#endregion
//#region src/vendor/webamp-modern/maki/v.js
var Ce = {
	newInt(e) {
		return {
			type: "INT",
			value: Number(e)
		};
	},
	newBool(e) {
		return {
			type: "BOOLEAN",
			value: +!!e
		};
	}
}, we = [
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
], Te = "paused", Ee = "stopped", De = "playing", AudioPlayer = class {
	constructor() {
		if (this._audio = document.createElement("audio"), this._bands = [], this._balance = 0, this._eqEnabled = !0, this._eqValues = {}, this._eqNodes = {}, this._eqEmitter = new Emitter(), this._isStop = !0, this._albumArtUrl = null, this._timeRemaining = !1, this._eventListener = new Emitter(), this._vuMeter = 0, this._last_itime = 0, this._context = this._context = new (window.AudioContext || window.webkitAudioContext)(), this._context.state === "suspended") {
			let resume = async () => {
				await this._context.resume(), this._context.state === "running" && (document.body.removeEventListener("touchend", resume, !1), document.body.removeEventListener("click", resume, !1), document.body.removeEventListener("keydown", resume, !1));
			};
			document.body.addEventListener("touchend", resume, !1), document.body.addEventListener("click", resume, !1), document.body.addEventListener("keydown", resume, !1);
		}
		this._source = this._context.createMediaElementSource(this._audio), this.__preamp = this._context.createGain(), this._volumeNode = this._context.createGain(), this._analyser = this._context.createAnalyser(), this._analyser.fftSize = 1024, this._analyser.smoothingTimeConstant = 0, this._balanceNode = new StereoPannerNode(this._context, { pan: 0 });
		let e = [this._source, this.__preamp], t = this._analyser, m = new Float32Array(t.fftSize), onFrame = () => {
			t.getFloatTimeDomainData(m);
			let e = 0;
			for (let t = 0; t < m.length; t++) {
				let v = m[t];
				e += v * v;
			}
			this._vuMeter = Math.sqrt(e / m.length), window.requestAnimationFrame(onFrame);
		};
		window.requestAnimationFrame(onFrame), we.forEach((t, m) => {
			let v = this._context.createBiquadFilter();
			this._bands.push(v), v.type = m === 0 ? "lowshelf" : m === we.length - 1 ? "highshelf" : "peaking", v.frequency.value = t, v.gain.value = 0, e.push(v);
		}), e.push(this._balanceNode), e.push(this._volumeNode), e.push(this._context.destination);
		let v = e[0];
		for (let t = 1; t < e.length; t++) {
			let m = e[t];
			v.connect(m), v = m;
		}
		this._balanceNode.connect(this._analyser), this._audio.addEventListener("ended", () => this.stop()), this._audio.addEventListener("timeupdate", () => this.doTimeUpdate());
	}
	doTimeUpdate() {
		let e = this._audio.currentTime << 0;
		e != this._last_itime && (this._last_itime = e, this.trigger("timeupdate"));
	}
	setEqEnabled(e) {
		this._eqEnabled = e, this._source.disconnect(), e ? this._source.connect(this.__preamp) : this._source.connect(this._balanceNode);
	}
	getEqEnabled() {
		return this._eqEnabled;
	}
	getAnalyser() {
		return this._analyser;
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
	setAudioSource(e) {
		this._audio.src = e;
	}
	getVolume() {
		return this._volumeNode.gain.value;
	}
	setVolume(e) {
		e != this._volumeNode.gain.value && (this._volumeNode.gain.value = e, this.trigger("volumechanged"));
	}
	getBalance() {
		return this._balance;
	}
	setBalance(e) {
		this._balanceNode.pan.value = e, this._balance = e, this.trigger("balancechange");
	}
	getPlaybackRate() {
		return this._audio.playbackRate;
	}
	setPlaybackRate(e) {
		this._audio.playbackRate = clamp(e, .5, 4), this.trigger("playbackratechange");
	}
	play() {
		this._isStop = !1, this.trigger("timeupdate"), this._audio.play(), this.trigger("play"), this.trigger("statchanged");
	}
	stop() {
		this._isStop = !0, this._audio.paused && this._audio.play(), this._audio.pause(), this._audio.currentTime = 0, this.trigger("stop"), this.trigger("statchanged");
	}
	pause() {
		this._isStop = !1, this._audio.pause(), this.trigger("pause"), this.trigger("statchanged");
	}
	seekTo(e) {
		this._audio.currentTime = e;
	}
	seekToPercent(e) {
		this._audio.currentTime = this._audio.duration * e;
	}
	toggleRemainingTime() {
		this._timeRemaining = !this._timeRemaining;
	}
	getCurrentTime() {
		return this._timeRemaining ? this._audio.currentTime - this._audio.duration : this._audio.currentTime;
	}
	getCurrentTimePercent() {
		return this._audio.currentTime / this._audio.duration;
	}
	getState() {
		if (this._isStop) return Ee;
		let e = this._audio;
		if (!e.ended && !e.paused) return De;
		if (e.ended) return Ee;
		if (e.paused) return Te;
	}
	getEq(e) {
		switch (e = String(e).toLowerCase(), e) {
			case "preamp":
				let t = this.__preamp.gain.value;
				return (Math.log(t) / Math.log(10) * 20 + 12) / 24;
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
			case "10":
				let m = Number(e) - 1;
				return (this._bands[m].gain.value + 12) / 24;
			default: return console.warn(`Tried to get unknown EQ kind: ${e}`), 0;
		}
	}
	setEq(e, t) {
		e = String(e).toLowerCase();
		let m = t * 24 - 12;
		switch (e) {
			case "preamp":
				this.__preamp.gain.value = 10 ** (m / 20), this._eqValues[e] = m, this._eqEmitter.trigger(e);
				break;
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
			case "10":
				let t = Number(e) - 1, v = this._bands[t];
				v.gain.value = m, this._eqEmitter.trigger(e);
				break;
			default: console.warn(`Tried to set unknown EQ kind: ${e}`);
		}
	}
	onEqChange(e, t) {
		switch (e = String(e).toLowerCase(), e) {
			case "preamp":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
			case "10": return this._eqEmitter.on(e, t);
			default: console.warn(`Tried to bind to an unknown EQ kind: ${e}`);
		}
	}
	onCurrentTimeChange(e) {
		return this.on("timeupdate", e);
	}
	onSeek(e) {
		let handler = () => e();
		this._audio.addEventListener("seeked", handler);
		let dispose = () => {
			this._audio.removeEventListener("seeked", handler);
		};
		return dispose;
	}
	onVolumeChanged(e) {
		return this.on("volumechanged", e);
	}
	onAlbumArtChange(e) {
		return this.on("albumartchanged", e);
	}
	onBalanceChanged(e) {
		let handler = () => e();
		return this.on("balancechange", handler);
	}
	getLength() {
		return this._audio.duration;
	}
	getTrackInfo() {
		return {};
	}
}, Oe = null;
function getDefaultAudioPlayer() {
	return Oe ??= new AudioPlayer(), Oe;
}
//#endregion
//#region src/vendor/webamp-modern/skin/XmlObj.js
var XmlObj = class extends BaseObject {
	setXmlAttributes(e) {
		for (let [t, m] of Object.entries(e)) this.setXmlAttr(t, m);
	}
	setXmlAttr(e, t) {
		return !1;
	}
	setxmlparam(e, t) {
		this.setXmlAttr(e, t);
	}
}, ke = -1, Ae = 1, je = [], installGlobalMouseDown = (e) => {
	je.includes(e) || je.push(e);
}, uninstallGlobalMouseDown = (e) => {
	let t = je.indexOf(e);
	t != -1 && je.splice(t, 1);
}, GuiObj = class extends XmlObj {
	constructor(e) {
		super(), this._children = [], this._w = 0, this._h = 0, this._x = 0, this._y = 0, this._minimumHeight = 0, this._maximumHeight = 0, this._minimumWidth = 0, this._maximumWidth = 0, this._relatw = "0", this._relath = "0", this._visible = !0, this._alpha = 255, this._ghost = !1, this._sysregion = 0, this._tooltip = "", this._targetX = null, this._targetY = null, this._targetWidth = null, this._targetHeight = null, this._targetAlpha = null, this._targetSpeed = null, this._goingToTarget = !1, this._backgroundBitmap = null, this._metaCommands = [], this.__cfgAttribChanged = () => {
			let e = this._configAttrib.getdata();
			this._cfgAttribChanged(e);
		}, this._uiRoot = e, this._div = document.createElement(this.getElTag().toLowerCase().replace("_", ""));
	}
	getElTag() {
		return this.constructor.name;
	}
	setParent(e) {
		this._parent = e;
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		switch (m) {
			case "id":
				this._originalId = t, this._id = t.toLowerCase();
				break;
			case "name":
				this._name = t;
				break;
			case "autowidthsource":
				this._autowidthsource = t.toLowerCase();
				break;
			case "fitparent":
				this._relatw = "1", this._relath = "1", this._renderWidth(), this._renderHeight();
				break;
			case "w":
			case "default_w":
				this._w = num(t), this._renderWidth();
				break;
			case "h":
			case "default_h":
				this._h = num(t), this._renderHeight();
				break;
			case "x":
			case "default_x":
				this._x = num(t) ?? 0, this._renderX();
				break;
			case "y":
			case "default_y":
				this._y = num(t) ?? 0, this._renderY();
				break;
			case "minimum_h":
				this._minimumHeight = num(t);
				break;
			case "minimum_w":
				this._minimumWidth = num(t);
				break;
			case "maximum_h":
				this._maximumHeight = num(t);
				break;
			case "maximum_w":
				this._maximumWidth = num(t);
				break;
			case "relatw":
				this._relatw = t, this._renderWidth();
				break;
			case "relath":
				this._relath = t, this._renderHeight();
				break;
			case "relatx":
				this._relatx = t, this._renderX();
				break;
			case "relaty":
				this._relaty = t, this._renderY();
				break;
			case "droptarget":
				this._droptarget = t;
				break;
			case "dblclickaction":
				let [e, v, y] = t.split(";");
				this._div.addEventListener("dblclick", (t) => {
					this.dispatchAction(e, v, y);
				});
				break;
			case "ghost":
				this._ghost = toBool(t);
				break;
			case "visible":
				this._visible = toBool(t), this._renderVisibility();
				break;
			case "activealpha":
			case "inactivealpha":
				this._div.setAttribute(m, t);
				break;
			case "tooltip":
				this._tooltip = t;
				break;
			case "alpha": this.setalpha(num(t));
			case "sysregion":
				this._sysregion = num(t);
				break;
			case "cfgattrib":
				this._setConfigAttrib(t);
				break;
			default: return !1;
		}
		return !0;
	}
	setxmlparam(e, t) {
		this.setXmlAttr(e, t);
	}
	_setConfigAttrib(e) {
		let [t, m] = e.split(";"), v = this._uiRoot.CONFIG.getitem(t);
		this._configAttrib = v.getattribute(m), this._configAttrib.on("datachanged", this.__cfgAttribChanged.bind(this));
	}
	_cfgAttribChanged(e) {}
	updateCfgAttib(e) {
		this._configAttrib != null && this._configAttrib.setdata(e);
	}
	setSize(e, t) {}
	init() {
		for (let e of this._metaCommands) {
			let t = e.name.toLowerCase(), m = e.attributes.group ? this.findobject(e.attributes.group) : this, v = e.attributes.target.split(";");
			for (let y of v) {
				let v = m.findobjectF(y, `<${t}(${y})=notfound. @${this.getId()}`);
				if (v != null) {
					if (t == "sendparams") for (let t in e.attributes) v && t != "target" && v.setxmlparam(t, e.attributes[t]);
					else t == "hideobject" && y != "close" && v.hide();
				}
			}
		}
		this._configAttrib && this._cfgAttribChanged(this._configAttrib.getdata()), this._div.addEventListener("mousedown", (e) => {
			e.stopPropagation(), console.log("mouse-down!");
			let t = this._eventToLocal(e);
			this.onLeftButtonDown(t.x + this.getleft(), t.y + this.gettop());
			let mouseUpHandler = (e) => {
				console.log("mouse-up!");
				let t = this._eventToLocal(e);
				this.onLeftButtonUp(t.x + this.getleft(), t.y + this.gettop()), this._div.removeEventListener("mouseup", mouseUpHandler);
			};
			this._div.addEventListener("mouseup", mouseUpHandler);
		}), this._div.addEventListener("mouseenter", (e) => {
			this.onEnterArea();
		}), this._div.addEventListener("mouseleave", (e) => {
			this.onLeaveArea();
		});
	}
	dispose() {}
	_eventToLocal(e) {
		let t = this._div.getBoundingClientRect(), m = this._div.offsetWidth ? t.width / this._div.offsetWidth : 1, v = this._div.offsetHeight ? t.height / this._div.offsetHeight : 1;
		return {
			x: (e.clientX - t.left) / (m || 1),
			y: (e.clientY - t.top) / (v || 1)
		};
	}
	getDiv() {
		return this._div;
	}
	getId() {
		return this._id || "";
	}
	getOriginalId() {
		return this._originalId;
	}
	show() {
		this._visible = !0, this._renderVisibility(), this.onsetvisible(!0);
	}
	hide() {
		this._visible = !1, this._renderVisibility(), this.onsetvisible(!1);
	}
	isvisible() {
		return this._visible;
	}
	isEffectivelyVisible() {
		if (!this._visible) return !1;
		let e = this._parent;
		return typeof e?.isEffectivelyVisible != "function" || e.isEffectivelyVisible();
	}
	get visible() {
		return this._visible;
	}
	set visible(e) {
		e ? this.show() : this.hide();
	}
	gettop() {
		return this._y;
	}
	getleft() {
		return this._x;
	}
	getheight() {
		if (this._relath == "1" && this._parent && !this._parent._measuring) {
			let e = this._parent.getheight?.() ?? 0;
			if (e > 0) return Math.max(0, e + (this._h || 0));
		}
		if (this._h || this._minimumHeight || this._maximumHeight) {
			let e = Math.max(this._h || 0, this._minimumHeight);
			return e = Math.min(e, this._maximumHeight || e), e;
		}
		return this._h;
	}
	get height() {
		return this.getheight();
	}
	set height(e) {
		this._h = e, this._renderDimensions();
	}
	getwidth() {
		if (this._relatw == "1" && this._parent && !this._parent._measuring) {
			let e = this._parent.getwidth?.() ?? 0;
			if (e > 0) return Math.max(0, e + (this._w || 0));
		}
		if (this._w || this._minimumWidth || this._maximumWidth) {
			let e = Math.max(this._w || 0, this._minimumWidth);
			return this._maximumHeight && (e = Math.min(e, this._maximumWidth || e)), e;
		}
		return this._w;
	}
	get width() {
		return this.getwidth();
	}
	set width(e) {
		this._w = e, this._renderDimensions();
	}
	resize(e, t, m, v) {
		this._x = e, this._y = t, this._w = m, this._h = v, this._renderDimensions();
	}
	getxmlparam(e) {
		e = e.toLowerCase();
		let t = this["_" + e];
		return t == null ? null : t.toString();
	}
	getguiw() {
		return this._w;
	}
	getguih() {
		return this._h;
	}
	getguix() {
		return this._x;
	}
	getguiy() {
		return this._y;
	}
	getguirelatw() {
		return +(this._relatw == "1");
	}
	getguirelath() {
		return +(this._relath == "1");
	}
	getguirelatx() {
		return +(this._relatx == "1");
	}
	getguirelaty() {
		return +(this._relaty == "1");
	}
	getautowidth() {
		let e = this._autowidthsource ? findLast(this._children, (e) => e._id.toLowerCase() == this._autowidthsource) : this;
		if (e) {
			let t = e.getwidth();
			return t > 0 ? t : e._div.getBoundingClientRect().width;
		}
		return 1;
	}
	getautoheight() {
		return this._div.getBoundingClientRect().height;
	}
	findobject(e) {
		if (e.toLowerCase() == this.getId().toLowerCase()) return this;
		let t = this._findobject(e);
		if (!t) {
			let m = this.getparentlayout();
			m && (t = m._findobject(e));
		}
		return !t && e != "sysmenu" && console.warn(`findObject(${e}) failed, @${this.getId()}`), t;
	}
	findobjectF(e, t) {
		return this._findobject(e);
	}
	_findobject(e) {
		let t = e.toLowerCase();
		for (let e of this._children) if ((e.getId() || "").toLowerCase() === t) return e;
		for (let t of this._children) {
			let m = t._findobject(e);
			if (m != null) return m;
		}
		return null;
	}
	isActive() {
		return this._div.matches(":focus");
	}
	setregion(e) {}
	ismouseoverrect() {
		let e = this._uiRoot.getLastPointer();
		if (!e) return !1;
		let t = this._div.getBoundingClientRect();
		return e.x >= t.left && e.x <= t.right && e.y >= t.top && e.y <= t.bottom;
	}
	onresize(e, t, m, v) {
		this._uiRoot.vm.dispatch(this, "onresize", [
			{
				type: "INT",
				value: e
			},
			{
				type: "INT",
				value: t
			},
			{
				type: "INT",
				value: this.getwidth()
			},
			{
				type: "INT",
				value: this.getheight()
			}
		]);
	}
	onLeftButtonUp(e, t) {
		this._uiRoot.vm.dispatch(this, "onleftbuttonup", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]);
	}
	onLeftButtonDown(e, t) {
		assert(e >= this.getleft(), `Expected click to be to the right of the component's left. x:${e} left:${this.getleft()}`), assert(t >= this.gettop(), `Expected click to be below the component's top. y:${t} top:${this.gettop()}`), this.getparentlayout().bringtofront(), this._uiRoot.vm.dispatch(this, "onleftbuttondown", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]);
	}
	onRightButtonUp(e, t) {
		this._uiRoot.vm.dispatch(this, "onrightbuttonup", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]);
	}
	onRightButtonDown(e, t) {
		this._uiRoot.vm.dispatch(this, "onrightbuttondown", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]);
	}
	onEnterArea() {
		this._uiRoot.vm.dispatch(this, "onenterarea");
	}
	onLeaveArea() {
		this._uiRoot.vm.dispatch(this, "onleavearea");
	}
	settargetx(e) {
		this._targetX = e;
	}
	settargety(e) {
		this._targetY = e;
	}
	settargetw(e) {
		this._targetWidth = e;
	}
	settargeth(e) {
		this._targetHeight = e;
	}
	settargeta(e) {
		this._targetAlpha = e;
	}
	settargetspeed(e) {
		this._targetSpeed = e;
	}
	gototarget() {
		this._goingToTarget = !0;
		let e = this._targetSpeed * 1e3, t = performance.now(), m = [
			[
				"_x",
				"_targetX",
				"_renderX"
			],
			[
				"_y",
				"_targetY",
				"_renderY"
			],
			[
				"_w",
				"_targetWidth",
				"_renderWidth"
			],
			[
				"_h",
				"_targetHeight",
				"_renderHeight"
			],
			[
				"_alpha",
				"_targetAlpha",
				"_renderAlpha"
			]
		], v = {};
		for (let [e, t, y] of m) {
			let m = this[t];
			if (m != null) {
				let t = this[e], x = m > t;
				v[e] = {
					start: t,
					delta: m - t,
					renderKey: y,
					target: m,
					positive: x
				};
			}
		}
		let clamp = (e, t, m) => m ? Math.min(e, t) : Math.max(e, t), update = (m) => {
			let y = m - t, x = y / e;
			for (let [e, { start: t, delta: m, renderKey: y, target: S, positive: C }] of Object.entries(v)) this[e] = clamp(t + m * x, S, C), this[y]();
			y < e && this._goingToTarget ? window.requestAnimationFrame(update) : (this._goingToTarget = !1, this.ontargetreached());
		};
		window.requestAnimationFrame(update);
	}
	isgoingtotarget() {
		return this._goingToTarget;
	}
	__gototargetWebAnimationApi() {
		let e = this._targetSpeed * 1e3, t = [{
			left: px(this._x ?? 0),
			top: px(this._y ?? 0),
			width: px(this._w),
			height: px(this._h),
			opacity: this._alpha / 255
		}, {
			left: px(this._targetX ?? this._x ?? 0),
			top: px(this._targetY ?? this._y ?? 0),
			width: px(this._targetWidth ?? this._w),
			height: px(this._targetHeight ?? this._h),
			opacity: (this._targetAlpha ?? this._alpha) / 255
		}];
		this._div.animate(t, { duration: e }).addEventListener("finish", () => {
			this._x = this._targetX ?? this._x, this._y = this._targetY ?? this._y, this._w = this._targetWidth ?? this._w, this._h = this._targetHeight ?? this._h, this._alpha = this._targetAlpha ?? this._alpha, this._renderDimensions(), this._renderAlpha(), this._uiRoot.vm.dispatch(this, "ontargetreached");
		});
	}
	ontargetreached() {
		this._uiRoot.vm.dispatch(this, "ontargetreached");
	}
	canceltarget() {
		this._goingToTarget = !0;
	}
	reversetarget(e) {
		assume(!1, "Unimplemented: reverseTarget");
	}
	onsetvisible(e) {
		this._uiRoot.vm.dispatch(this, "onsetvisible", [{
			type: "BOOLEAN",
			value: +!!e
		}]);
	}
	onstartup() {
		this._uiRoot.vm.dispatch(this, "onstartup");
	}
	setalpha(e) {
		this._alpha = e, this._renderAlpha();
	}
	getalpha() {
		return this._alpha;
	}
	_windowBox() {
		let e = (this.getparentlayout?.() ?? this).getDiv(), t = e.getBoundingClientRect(), m = e.offsetWidth ? t.width / e.offsetWidth : 1;
		return {
			left: t.left,
			top: t.top,
			scale: m || 1
		};
	}
	clienttoscreenx(e) {
		let t = this._windowBox();
		return window.screenX + t.left + e * t.scale;
	}
	clienttoscreeny(e) {
		let t = this._windowBox();
		return window.screenY + t.top + e * t.scale;
	}
	clienttoscreenw(e) {
		return e * this._windowBox().scale;
	}
	clienttoscreenh(e) {
		return e * this._windowBox().scale;
	}
	screentoclientx(e) {
		let t = this._windowBox();
		return (e - (window.screenX + t.left)) / t.scale;
	}
	screentoclienty(e) {
		let t = this._windowBox();
		return (e - (window.screenY + t.top)) / t.scale;
	}
	screentoclientw(e) {
		return e / this._windowBox().scale;
	}
	screentoclienth(e) {
		return e / this._windowBox().scale;
	}
	getparent() {
		return this._parent;
	}
	getparentlayout() {
		if (this._parent) return this._parent.getparentlayout();
	}
	bringtofront() {
		Ae += 1, this._div.style.zIndex = String(Ae);
	}
	bringtoback() {
		--ke, this._div.style.zIndex = String(ke);
	}
	setenabled(e) {}
	handleAction(e, t = null, m = null, v = null) {
		return !1;
	}
	dispatchAction(e, t, m) {
		!this.handleAction(e, t, m) && this._parent != null && this._parent.dispatchAction(e, t, m);
	}
	sendaction(e, t, m, v, y, x) {
		return this._uiRoot.vm.dispatch(this, "onaction", [
			{
				type: "STRING",
				value: e
			},
			{
				type: "STRING",
				value: t
			},
			{
				type: "INT",
				value: m
			},
			{
				type: "INT",
				value: v
			},
			{
				type: "INT",
				value: y
			},
			{
				type: "INT",
				value: x
			},
			{
				type: "OBJECT",
				value: this
			}
		]);
	}
	_renderAlpha() {
		this._alpha == 255 ? this._div.style.removeProperty("opacity") : this._div.style.opacity = `${this._alpha / 255}`;
	}
	_renderVisibility() {
		this._visible ? this._div.style.removeProperty("display") : this._div.style.display = "none", this._visibilityChanged();
	}
	_visibilityChanged() {}
	_renderTransate() {
		this._div.style.transform = `translate(${px(this._x ?? 0)}, ${px(this._y ?? 0)})`;
	}
	_renderX() {
		this._div.style.left = this._relatx == "1" ? relative(this._x ?? 0) : px(this._x ?? 0);
	}
	_renderY() {
		this._div.style.top = this._relaty == "1" ? relative(this._y ?? 0) : px(this._y ?? 0);
	}
	_renderWidth() {
		this._div.style.width = this._relatw == "1" ? relative(this._w ?? 0) : px(this.getwidth());
	}
	_renderHeight() {
		this._div.style.height = this._relath == "1" ? relative(this._h ?? 0) : px(this.getheight());
	}
	_renderDimensions() {
		this._renderX(), this._renderY(), this._renderWidth(), this._renderHeight();
	}
	_renderLocation() {
		this._renderX(), this._renderY();
	}
	_renderSize() {
		this._renderWidth(), this._renderHeight();
	}
	doResize() {
		this._uiRoot.vm.dispatch(this, "onresize", [
			{
				type: "INT",
				value: 0
			},
			{
				type: "INT",
				value: 0
			},
			{
				type: "INT",
				value: this.getwidth()
			},
			{
				type: "INT",
				value: this.getheight()
			}
		]);
	}
	setBackgroundImage(e) {
		this._backgroundBitmap = e, e == null ? this._div.style.setProperty("--background-image", "none") : e.setAsBackground(this._div);
	}
	setDownBackgroundImage(e) {
		e?.setAsDownBackground(this._div);
	}
	setHoverBackgroundImage(e) {
		e?.setAsHoverBackground(this._div);
	}
	setActiveBackgroundImage(e) {
		e?.setAsActiveBackground(this._div);
	}
	setInactiveBackgroundImage(e) {
		e?.setAsInactiveBackground(this._div);
	}
	setDisabledBackgroundImage(e) {
		e?.setAsDisabledBackground(this._div);
	}
	draw() {
		this.getId() && this._div.setAttribute("id", this.getId()), this._renderVisibility(), this._renderAlpha(), this._tooltip && this._div.setAttribute("title", this._tooltip), this._ghost || this._sysregion == -2 ? this._div.style.pointerEvents = "none" : this._div.style.pointerEvents = "auto", this._renderDimensions();
	}
};
GuiObj.GUID = "4ee3e1994becc636bc78cd97b028869c";
//#endregion
//#region src/vendor/webamp-modern/skin/AudioEventedGui.js
var AudioEventedGui = class extends GuiObj {
	constructor() {
		super(...arguments), this._propEvent = {};
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		return t.startsWith("allowed-to:") || t.startsWith("audio:") ? (this._propEvent[m] = t, !0) : !!super.setXmlAttr(e, t);
	}
	init() {
		super.init(), this._registerAudioEvents();
	}
	_registerAudioEvents() {
		Object.keys(this._propEvent).length > 0 && (this._audioEventListeners != null && this._audioEventListeners(), this._audioEventListeners = this._uiRoot.audio.on("statchanged", () => this._updatePropsByAudioState()), this._updatePropsByAudioState());
	}
	_updatePropsByAudioState() {
		let e = this._uiRoot.playlist, t = e.getnumtracks(), m = e.getcurrentindex(), v = m < t - 1, y = m > 0, x = {
			[De]: {
				play: !1,
				pause: !0,
				stop: !0,
				next: v,
				prev: y
			},
			[Te]: {
				play: !0,
				pause: !1,
				stop: !0,
				next: v,
				prev: y
			},
			[Ee]: {
				play: !0,
				pause: !1,
				stop: !1,
				next: v,
				prev: y
			}
		}, S = {
			[De]: "play",
			[Te]: "pause",
			[Ee]: "stop"
		}, C = this._uiRoot.audio.getState();
		if (!x[C]) {
			console.warn("unknown audio state:", C);
			return;
		}
		for (let [e, t] of Object.entries(this._propEvent)) {
			let [m, v] = t.split(":");
			m == "allowed-to" ? this[e] = x[C][v] : m == "audio" && (this[e] = v == S[C]);
		}
	}
}, Button = class extends AudioEventedGui {
	constructor(e) {
		super(e), this._active = !1, this._action = null, this._param = null, this._actionTarget = null, this._div.addEventListener("mousedown", this._handleMouseDown.bind(this)), this._div.addEventListener("click", (e) => {
			e.button == 0 && (e.stopPropagation(), e.preventDefault(), this.leftclick());
		});
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "image":
				this._image = t, this._renderBackground();
				break;
			case "downimage":
				this._downimage = t, this._renderBackground();
				break;
			case "hoverimage":
				this._hoverimage = t, this._renderBackground();
				break;
			case "activeimage":
				this._activeimage = t, this._renderBackground();
				break;
			case "action":
				this._action = t;
				break;
			case "param":
				this._param = t;
				break;
			case "action_target":
			case "cbtarget":
				this._actionTarget = t;
				break;
			default: return !1;
		}
		return !0;
	}
	getheight() {
		if (this._h) return this._h;
		if (this._image != null) {
			let e = this._uiRoot.getBitmap(this._image);
			if (e) return e.getHeight();
		}
		return super.getheight();
	}
	getwidth() {
		if (this._w) return this._w;
		if (this._image != null) {
			let e = this._uiRoot.getBitmap(this._image);
			if (e) return e.getWidth();
		}
		return super.getwidth();
	}
	getactivated() {
		return !!this._active;
	}
	setactivated(e) {
		e = !!e, e !== this._active && (this._active = e, this._renderActive()), this._uiRoot.vm.dispatch(this, "onactivate", [Ce.newBool(e)]);
	}
	setactivatednocallback(e) {
		e !== this._active && (this._active = e, this._renderActive());
	}
	leftclick() {
		this._action && (this.dispatchAction(this._action, this._param, this._actionTarget), this.invalidateActionState()), this.onLeftClick();
	}
	onLeftClick() {
		this._uiRoot.vm.dispatch(this, "onleftclick", []);
	}
	handleAction(e, t = null, m = null, v = null) {
		if (m) {
			let v = this.findobject(m);
			if (v) return v.handleAction(e, t, null, this), !0;
		}
		return !1;
	}
	invalidateActionState() {
		let e = this._uiRoot.getActionState(this._action, this._param, this._actionTarget);
		e != null && this.setactivatednocallback(e);
	}
	init() {
		super.init(), this._action != null && this._uiRoot.on(this._action.toLowerCase(), () => this.invalidateActionState()), this.invalidateActionState();
	}
	_renderActive() {
		this._active ? this._div.classList.add("active") : this._div.classList.remove("active");
	}
	_renderBackground() {
		if (this._image != null && this._uiRoot.hasBitmap(this._image)) {
			let e = this._uiRoot.getBitmap(this._image);
			this.setBackgroundImage(e);
		} else this.setBackgroundImage(null);
		if (this._downimage != null && this._uiRoot.hasBitmap(this._downimage)) {
			let e = this._uiRoot.getBitmap(this._downimage);
			this.setDownBackgroundImage(e);
		} else this.setDownBackgroundImage(null);
		if (this._hoverimage != null && this._uiRoot.hasBitmap(this._hoverimage)) {
			let e = this._uiRoot.getBitmap(this._hoverimage);
			this.setHoverBackgroundImage(e);
		} else this.setHoverBackgroundImage(null);
		if (this._activeimage != null && this._uiRoot.hasBitmap(this._activeimage)) {
			let e = this._uiRoot.getBitmap(this._activeimage);
			this.setActiveBackgroundImage(e);
		} else this.setActiveBackgroundImage(null);
	}
	_handleMouseDown(e) {
		e.stopPropagation();
	}
	draw() {
		super.draw(), this._div.classList.add("webamp--img"), this._div.style.pointerEvents = "auto", this._renderBackground();
	}
	hide() {
		document.activeElement == this._div && this.getparentlayout()._parent._div.focus(), super.hide();
	}
};
Button.GUID = "698eddcd4fec8f1e44f9129b45ff09f9";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/ConfigPersistent.js
var ConfigPersistent = class extends BaseObject {
	constructor() {
		super(), this._saveState = debounce(() => {
			window.localStorage.setItem(this.getStorageName(), JSON.stringify(this._configTree));
		}, 2e3), this.loadStorage();
	}
	getStorageName() {
		return `${this.getclassname()}.${this.getId() || "~"}`;
	}
	loadStorage() {
		let e = window.localStorage.getItem(this.getStorageName());
		this._configTree = e ? JSON.parse(e) : {};
	}
	getSectionValues(e) {
		return this._configTree[e] ?? (this._configTree[e] = {}), this._configTree[e];
	}
	getValue(e, t) {
		return t = t.toLowerCase(), this.getSectionValues(e)[t];
	}
	setValue(e, t, m) {
		if (t = t.toLowerCase(), this.getValue(e, t) != m) {
			let v = this.getSectionValues(e);
			v[t] = m, this._saveState();
		}
		return m;
	}
}, PrivateConfig = class extends ConfigPersistent {
	getStorageName() {
		return "_PRIVATE-CONFIG_";
	}
	setDefaults(e) {
		for (let [t, m] of Object.entries(e ?? {})) for (let [e, v] of Object.entries(m ?? {})) this.getValue(t, e) ?? this.setValue(t, e, String(v));
	}
	getPrivateInt(e, t, m) {
		let v = this.getValue(e, t);
		return v ??= this.setValue(e, t, String(m)), Number(v);
	}
	setPrivateInt(e, t, m) {
		let v = this.setValue(e, t, String(m));
		return Number(v);
	}
	getPrivateString(e, t, m) {
		let v = this.getValue(e, t);
		return v ??= this.setValue(e, t, m), v;
	}
	setPrivateString(e, t, m) {
		return this.setValue(e, t, String(m));
	}
}, Me = new PrivateConfig(), ConfigAttribute = class extends BaseObject {
	constructor(e, t) {
		super(), this._configItem = e, this._id = t, this._eventListener = new Emitter();
	}
	getparentitem() {
		return this._configItem;
	}
	getattributename() {
		return this._id;
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
	getdata() {
		return this._configItem.getValue(this._id);
	}
	setdata(e) {
		this._configItem.setValue(this._id, e), this.trigger("datachanged"), this.ondatachanged();
	}
	ondatachanged() {
		this._configItem._uiRoot.vm.dispatch(this, "ondatachanged");
	}
};
ConfigAttribute.GUID = "24dec2834a36b76e249ecc8c736c6bc4";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/ConfigItem.js
var ConfigItem = class extends BaseObject {
	constructor(e, t, m, v) {
		super(), this._attributes = {}, this._uiRoot = e, this._config = t, this._id = m, this._guid = v.toLowerCase();
	}
	getname() {
		return this._id;
	}
	getguid(e) {
		return this._guid;
	}
	getValue(e) {
		return this._config.getValue(this._guid, e);
	}
	setValue(e, t) {
		return this._config.setValue(this._guid, e, t);
	}
	newattribute(e, t) {
		e = e.toLowerCase(), this.getValue(e) ?? this.setValue(e, t);
		let m = this._attributes[e] || new ConfigAttribute(this, e);
		return this._attributes[e] = m, m;
	}
	getattribute(e) {
		return e = e.toLowerCase(), this._attributes[e] || this.newattribute(e, "0");
	}
};
ConfigItem.GUID = "d40302824d873aab32128d87d5fcad6f";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Config.js
var Config = class extends ConfigPersistent {
	constructor(e) {
		super(), this._id = "CONFIG", this._items = {}, this._uiRoot = e, this._aliases = this.getSectionValues("_alias_");
	}
	getStorageName() {
		return "_CONFIG_";
	}
	newitem(e, t) {
		t = t.toLowerCase();
		let m = this._items[t];
		return m || (m = new ConfigItem(this._uiRoot, this, e, t), this._items[t] = m), e.toLowerCase() == t && (e = t), this._aliases[e] = t, this._saveState(), m;
	}
	getitem(e) {
		let t = this._aliases[e] || e;
		return this._items[t.toLowerCase()] || this.newitem(e, t);
	}
	getitembyguid(e) {
		e = e.toLowerCase();
		let t = this._items[e];
		if (!t) {
			let t = Object.keys(this._aliases).find((t) => this._aliases[t] === e) || e;
			return this.newitem(t, e);
		}
		return t;
	}
};
Config.GUID = "593dba224976d07771f452b90b405536";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/WinampConfig.js
var WinampConfig = class extends BaseObject {
	constructor(e) {
		super(), this._uiRoot = e;
	}
	getgroup(e) {
		return new WinampConfigGroup(this._uiRoot.CONFIG.getitembyguid(e));
	}
};
WinampConfig.GUID = "b2ad3f2b4e3131ed95e96dbcbb55d51c";
var WinampConfigGroup = class {
	constructor(e) {
		this._cfg = e;
	}
	getstring(e) {
		return this._cfg.getValue(e);
	}
	getbool(e) {
		return this.getstring(e) == "1";
	}
	getint(e) {
		return parseInt(this.getstring(e) || "0");
	}
	setstring(e, t) {
		this._cfg.setValue(e, t);
	}
	setbool(e, t) {
		this._cfg.setValue(e, t ? "1" : "0");
	}
	setint(e) {}
};
WinampConfigGroup.GUID = "fc17844e4518c72bf9a868a080baa530";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Application.js
var Application = class extends BaseObject {
	constructor(e) {
		super(), this._uiRoot = e;
	}
	getapplicationname() {
		return "WebAmp Modern";
	}
	getversionstring() {
		return unimplemented("5.66");
	}
	getsettingspath() {
		return unimplemented("./");
	}
	getapplicationpath() {
		return unimplemented("./");
	}
};
Application.GUID = "b8e867b04da72715db53baa5acfefca1";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/SystemObject.js
var Ne = {
	x: 0,
	y: 0
};
document.addEventListener("mousemove", (e) => {
	Ne.x = e.pageX, Ne.y = e.pageY;
});
var SystemObject = class extends BaseObject {
	constructor(e, t, m, v) {
		super(), this._uiRoot = e, this._parsedScript = t, this._param = m, this._id = v, this._uiRoot.audio.onSeek(() => {
			this._uiRoot.vm.dispatch(this, "onseek", [{
				type: "INT",
				value: this._uiRoot.audio.getCurrentTimePercent() * 255
			}]);
		}), this._uiRoot.audio.on("play", () => this._uiRoot.vm.dispatch(this, "onplay", [])), this._uiRoot.audio.on("pause", () => this._uiRoot.vm.dispatch(this, "onpause", [])), this._uiRoot.audio.on("stop", () => this._uiRoot.vm.dispatch(this, "onstop", [])), this._uiRoot.audio.onVolumeChanged(() => {
			this._uiRoot.vm.dispatch(this, "onvolumechanged", [{
				type: "INT",
				value: this._uiRoot.audio.getVolume() * 255
			}]);
		});
		let EqBandHandle = (e) => {
			this._uiRoot.vm.dispatch(this, "oneqbandchanged", [{
				type: "INT",
				value: e - 1
			}, {
				type: "INT",
				value: this._uiRoot.audio.getEq(String(e)) * 255 - 127
			}]);
		};
		this._uiRoot.audio.onEqChange("1", () => EqBandHandle(1)), this._uiRoot.audio.onEqChange("2", () => EqBandHandle(2)), this._uiRoot.audio.onEqChange("3", () => EqBandHandle(3)), this._uiRoot.audio.onEqChange("4", () => EqBandHandle(4)), this._uiRoot.audio.onEqChange("5", () => EqBandHandle(5)), this._uiRoot.audio.onEqChange("6", () => EqBandHandle(6)), this._uiRoot.audio.onEqChange("7", () => EqBandHandle(7)), this._uiRoot.audio.onEqChange("8", () => EqBandHandle(8)), this._uiRoot.audio.onEqChange("9", () => EqBandHandle(9)), this._uiRoot.audio.onEqChange("10", () => EqBandHandle(10)), this._uiRoot.audio.onEqChange("preamp", () => {
			this._uiRoot.vm.dispatch(this, "oneqpreampchanged", [{
				type: "INT",
				value: this._uiRoot.audio.getEq("preamp") * 255 - 127
			}]);
		});
	}
	init() {
		let e = this._parsedScript.variables[0];
		if (e.type !== "OBJECT") throw Error("First variable was not SystemObject.");
		e.value = this;
		for (let e of this._parsedScript.variables) e.type == "OBJECT" && (e.guid == Config.GUID ? e.value = this._uiRoot.CONFIG : e.guid == WinampConfig.GUID ? e.value = this._uiRoot.WINAMP_CONFIG : e.guid == Application.GUID && (e.value = this._uiRoot.APPLICATION));
		this._uiRoot.vm.addScript(this._parsedScript), this._uiRoot.vm.dispatch(this, "onscriptloaded");
	}
	dispose() {
		this._uiRoot.vm.dispatch(this, "onscriptunloading");
	}
	setParentGroup(e) {
		this._parentGroup = e;
	}
	hasvideosupport() {
		return unimplemented(0);
	}
	getruntimeversion() {
		return 5.666;
	}
	getskinname() {
		return this._uiRoot.getSkinName();
	}
	getwinampversion() {
		return this._uiRoot.APPLICATION.getversionstring();
	}
	getmouseposx() {
		return unimplemented(Ne.x);
	}
	getmouseposy() {
		return unimplemented(Ne.y);
	}
	getprivateint(e, t, m) {
		return Me.getPrivateInt(e, t, m);
	}
	stringtointeger(e) {
		return e == "" ? 0 : Math.floor(parseFloat(e));
	}
	floattostring(e, t) {
		return e.toFixed(t);
	}
	stringtofloat(e) {
		return Number(e);
	}
	integertolongtime(e) {}
	datetotime(e) {}
	datetolongtime(e) {}
	formatdate(e) {}
	formatlongdate(e) {}
	getdateyear(e) {}
	getdatemonth(e) {}
	getdateday(e) {}
	getdatedow(e) {}
	getdatedoy(e) {}
	getdatehour(e) {}
	getdatemin(e) {}
	getdatesec(e) {}
	getdatedst(e) {}
	getdate() {}
	strmid(e, t, m) {
		return e.slice(t, t + m);
	}
	strleft(e, t) {
		return e.slice(0, t);
	}
	strright(e, t) {
		return e.slice(e.length - t);
	}
	strsearch(e, t) {
		return e.indexOf(t);
	}
	strlen(e) {
		return e ? e.length : 0;
	}
	strupper(e) {
		return e.toUpperCase();
	}
	strlower(e) {
		return e.toLowerCase();
	}
	urlencode(e) {}
	urldecode(e) {}
	setprivatestring(e, t, m) {}
	setprivateint(e, t, m) {
		Me.setPrivateInt(e, t, m);
	}
	getprivatestring(e, t, m) {
		return Me.getPrivateString(e, t, m);
	}
	setpublicstring(e, t) {
		Me.setPrivateString("_public_", e, t);
	}
	setpublicint(e, t) {
		Me.setPrivateInt("_public_", e, t);
	}
	getpublicstring(e, t) {
		return Me.getPrivateString("_public_", e, t);
	}
	getpublicint(e, t) {
		return Me.getPrivateInt("_public_", e, t);
	}
	getparam() {
		return this._param;
	}
	getscriptgroup() {
		return this._parentGroup;
	}
	gettimeofday() {
		let e = (/* @__PURE__ */ new Date()).getTime();
		return e - new Date(e).setHours(0, 0, 0, 0);
	}
	getcontainer(e) {
		let t = e.toLowerCase();
		for (let e of this._uiRoot.getContainers()) if (e.getId() === t) return e;
		throw Error(`Could not find a container with the id; "${e}"`);
	}
	newdynamiccontainer(e) {
		return unimplemented(null);
	}
	newgroup(e) {
		return this._parentGroup.findobject(e);
	}
	newgroupaslayout(e) {}
	getnumcontainers() {
		return this._uiRoot.getContainers().length;
	}
	enumcontainer(e) {
		return this._uiRoot._containers[e];
	}
	enumembedguid(e) {}
	getwac(e) {}
	getleftvumeter() {
		return this._uiRoot.audio._vuMeter * 255;
	}
	getrightvumeter() {
		return this._uiRoot.audio._vuMeter * 255;
	}
	getvolume() {
		return this._uiRoot.audio.getVolume() * 255;
	}
	setvolume(e) {
		let t = clamp(e, 0, 255);
		this._uiRoot.audio.setVolume(t / 255);
	}
	play() {
		this._uiRoot.audio.play();
	}
	stop() {
		this._uiRoot.audio.stop();
	}
	pause() {
		this._uiRoot.audio.pause();
	}
	next() {
		this._uiRoot.next();
	}
	previous() {
		this._uiRoot.previous();
	}
	eject() {
		this._uiRoot.eject();
	}
	messagebox(e, t, m, v) {}
	_currentTrack() {
		return this._uiRoot.playlist.currentTrack();
	}
	getplayitemstring() {
		return unimplemented("Niente da Caprie");
	}
	getplaylistlength() {
		return this._uiRoot.playlist.getnumtracks();
	}
	getplaylistindex() {
		return this._uiRoot.playlist.getcurrentindex();
	}
	getplayitemmetadatastring(e) {
		let t = this._uiRoot.audio.getTrackInfo?.() ?? {}, m = this._uiRoot.audio;
		switch (String(e).toLowerCase()) {
			case "title": return t.title ?? "";
			case "artist": return t.artist ?? "";
			case "album": return t.album ?? "";
			case "albumartist": return t.albumArtist ?? "";
			case "genre": return t.genre ?? "";
			case "year": return t.year == null ? "" : String(t.year);
			case "track": return t.track == null ? "" : String(t.track);
			case "disc": return t.disc == null ? "" : String(t.disc);
			case "comment": return t.comment ?? "";
			case "publisher": return t.publisher ?? "";
			case "composer": return t.composer ?? "";
			case "length": {
				let e = m.getLength?.() ?? 0;
				return e > 0 ? String(Math.round(e * 1e3)) : "";
			}
			case "bitrate": return t.bitrate ? String(Math.round(t.bitrate)) : "";
			case "srate": return t.sampleRate ? String(Math.round(t.sampleRate)) : "";
			case "streamtype": return t.isStream ? "1" : "0";
			case "streamname": return t.streamName ?? "";
			case "streamtitle": return t.streamTitle ?? "";
			case "type": return t.isStream, "0";
			default: return "";
		}
	}
	getmetadatastring(e, t) {
		return this.getplayitemmetadatastring(t);
	}
	getplayitemdisplaytitle() {
		return unimplemented("playitemdisplaytitle");
	}
	getcurrenttrackrating() {
		return unimplemented(1);
	}
	oncurrenttrackrated(e) {}
	setcurrenttrackrating(e) {}
	getextfamily(e) {
		return unimplemented("Audio");
	}
	getdecodername(e) {
		return "Nullsoft MPEG Decoder v4.103";
	}
	downloadmedia(e, t, m, v) {}
	downloadurl(e, t, m) {}
	ondownloadfinished(e, t, m) {}
	getdownloadpath() {
		return unimplemented("C:\\CD Rips");
	}
	setdownloadpath(e) {}
	enqueuefile(e) {}
	playfile(e) {}
	getfilesize(e) {
		return unimplemented(100);
	}
	getalbumart(e) {
		return unimplemented(1);
	}
	getplayitemlength() {
		return this._uiRoot.audio.getLength();
	}
	seekto(e) {
		this._uiRoot.audio.seekTo(e);
	}
	chr(e) {
		return String.fromCharCode(e);
	}
	integer(e) {
		return Math.round(Number(e));
	}
	frac(e) {
		return e - Math.floor(e);
	}
	integertostring(e) {
		return String(Math.round(e));
	}
	integertotime(e) {
		return integerToTime(e);
	}
	getviewportwidth() {
		return this._uiRoot.getDesktopRect().width;
	}
	getviewportwidthfromguiobject(e) {
		return this._uiRoot.getDesktopRect().width;
	}
	getviewportwidthfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().width;
	}
	getmonitorwidth() {
		return this._uiRoot.getDesktopRect().width;
	}
	getmonitorwidthfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().width;
	}
	getmonitorwidthfromguiobject(e) {
		return this._uiRoot.getDesktopRect().width;
	}
	getextension(e) {
		return unimplemented("mp3");
	}
	gettoken(e, t, m) {
		return e.split(t)[m] || "";
	}
	removepath(e) {
		return unimplemented("test.mp3");
	}
	getpath(e) {
		return unimplemented("c:\\music\\mp3");
	}
	getposition() {
		return String(this._uiRoot.audio.getCurrentTime() * 1e3);
	}
	getstatus() {
		let e = this._uiRoot.audio.getState();
		switch (e) {
			case De: return 1;
			case Te: return -1;
			case Ee: return 0;
			default: console.warn("Unknown audio state:", e);
		}
	}
	getviewportheight() {
		return this._uiRoot.getDesktopRect().height;
	}
	getviewportheightfromguiobject(e) {
		return this._uiRoot.getDesktopRect().height;
	}
	getviewportheightfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().height;
	}
	getmonitorheight() {
		return this._uiRoot.getDesktopRect().height;
	}
	getmonitorheightfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().height;
	}
	getmonitorheightfromguiobject(e) {
		return this._uiRoot.getDesktopRect().height;
	}
	getmonitorleft() {
		return this._uiRoot.getDesktopRect().left;
	}
	getmonitorleftfromguiobject(e) {
		return this._uiRoot.getDesktopRect().left;
	}
	getmonitorleftfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().left;
	}
	getmonitortop() {
		return this._uiRoot.getDesktopRect().top;
	}
	getviewporttop() {
		return this._uiRoot.getDesktopRect().top;
	}
	getmonitortopfromguiobject(e) {
		return this._uiRoot.getDesktopRect().top;
	}
	getmonitortopfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().top;
	}
	getviewportleft() {
		return this._uiRoot.getDesktopRect().left;
	}
	getviewportleftfromguiobject(e) {
		return this._uiRoot.getDesktopRect().left;
	}
	getviewportleftfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().left;
	}
	getviewporttopfromguiobject(e) {
		return this._uiRoot.getDesktopRect().top;
	}
	getviewporttopfrompoint(e, t) {
		return this._uiRoot.getDesktopRect().top;
	}
	debugstring(e, t) {
		console.log("Wasabi Console:", e);
	}
	ddesend(e, t, m) {}
	getcurappleft() {
		return 0;
	}
	getcurapptop() {
		return 0;
	}
	getcurappwidth() {
		return 1e3;
	}
	getcurappheight() {
		return unimplemented(100);
	}
	geteq() {
		return unimplemented(1);
	}
	geteqpreamp() {
		return unimplemented(0);
	}
	seteq(e) {}
	seteqpreamp(e) {
		this._uiRoot.audio.setEq("preamp", (e + 127) / 255);
	}
	seteqband(e, t) {
		this._uiRoot.audio.setEq(String(e + 1), (t + 127) / 255);
	}
	geteqband(e) {
		return this._uiRoot.audio.getEq(String(e + 1)) * 255 - 127;
	}
	oneqbandchanged(e, t) {
		this._uiRoot.vm.dispatch(this, "oneqbandchanged", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]);
	}
	getvisband(e, t) {
		return unimplemented(0);
	}
	tan(e) {
		return Math.tan(e);
	}
	sin(e) {
		return Math.sin(e);
	}
	cos(e) {
		return Math.cos(e);
	}
	asin(e) {
		return Math.asin(e);
	}
	acos(e) {
		return Math.acos(e);
	}
	atan(e) {
		return Math.atan(e);
	}
	atan2(e, t) {
		return Math.atan2(e, t);
	}
	pow(e, t) {
		return e ** +t;
	}
	sqr(e) {
		return e * e;
	}
	log10(e) {
		return Math.log10(e);
	}
	ln(e) {
		throw Error("Unimplemented");
	}
	sqrt(e) {
		return Math.sqrt(e);
	}
	random(e) {
		return Math.random() * e;
	}
	oneqfreqchanged(e) {}
	getsonginfotext() {
		return this._uiRoot.getSongInfoText();
	}
	getsonginfotexttranslated() {
		return this.getplayitemstring();
	}
	lockui() {}
	unlockui() {}
	isobjectvalid(e) {
		return e != null;
	}
	istransparencyavailable() {
		return !0;
	}
	translate(e) {
		return unimplemented(e);
	}
	isvideo() {
		return unimplemented(0);
	}
	isvideofullscreen() {
		return unimplemented(0);
	}
	setvideofullscreen(e) {}
	iskeydown(e) {
		return unimplemented(0);
	}
	isminimized() {
		return unimplemented(0);
	}
	isdesktopalphaavailable() {
		return !0;
	}
	isproversion() {
		return !0;
	}
};
SystemObject.GUID = "d6f50f6449b793fa66baf193983eaeef";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Container.js
var Container = class extends XmlObj {
	constructor(e) {
		super(), this._layouts = [], this._activeLayout = null, this._visible = !1, this._dynamic = !1, this._x = 0, this._y = 0, this._div = document.createElement("container"), this._uiRoot = e;
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "name":
				this.setname(t);
				break;
			case "id":
				this._originalId = t, this._id = t.toLowerCase();
				break;
			case "dynamic":
				this._dynamic = toBool(t);
				break;
			case "component":
				this._componentGuid = t.toLowerCase().split(":")[1], this.resolveAlias();
				break;
			case "default_visible":
				this._visible = t == "1" && !this._dynamic;
				break;
			case "x":
			case "default_x":
				this._x = num(t) ?? 0, this._renderDimensions();
				break;
			case "y":
			case "default_y":
				this._y = num(t) ?? 0, this._renderDimensions();
				break;
			default: return !1;
		}
		return !0;
	}
	init() {
		for (let e of this._layouts) e.init();
		for (let e of this._layouts) e.afterInited();
		this._uiRoot.vm.dispatch(this, "onswitchtolayout", [{
			type: "OBJECT",
			value: this.getcurlayout()
		}]);
	}
	dispose() {
		for (let e of this._layouts) e.dispose();
	}
	setname(e) {
		this._name = e;
	}
	getname() {
		return this._name;
	}
	getguid() {
		return this._componentGuid;
	}
	resolveAlias() {
		let e = this._componentGuid;
		this._componentAlias = this._uiRoot.guid2alias(e), this._componentGuid && !this._componentAlias && console.warn(`unknown component alias for guid:${this._componentGuid}`, `for id:${this.getId()}`);
	}
	hasId(e) {
		return e ? (e = e.toLowerCase(), e.startsWith("guid:") ? (e = e.substring(5), this._componentGuid == e || this._componentAlias == e) : this._id == e) : !1;
	}
	getId() {
		return this._id;
	}
	getOriginalId() {
		return this._originalId;
	}
	getDiv() {
		return this._div;
	}
	getWidth() {
		return this._activeLayout.getwidth();
	}
	getHeight() {
		return this._activeLayout.getheight();
	}
	getVisibleWidth() {
		return this._activeLayout?.getVisibleWidth?.() ?? this.getWidth();
	}
	getVisibleHeight() {
		return this._activeLayout?.getVisibleHeight?.() ?? this.getHeight();
	}
	setWidth(e) {
		this._activeLayout.setXmlAttr("w", String(e));
	}
	setHeight(e) {
		this._activeLayout.setXmlAttr("h", String(e));
	}
	gettop() {
		return this._y;
	}
	getleft() {
		return this._x;
	}
	center() {
		let e = document.documentElement.clientHeight, t = document.documentElement.clientWidth;
		this._div.style.top = px((e - this.getHeight()) / 2), this._div.style.left = px((t - this.getWidth()) / 2);
	}
	setLocation(e, t) {
		(e != this._x || t != this._y) && (this._x = e, this._y = t, this._renderDimensions());
	}
	show() {
		this._activeLayout || this.switchtolayout(this._layouts[0]._id), this._visible = !0, this._renderLayout();
	}
	hide() {
		this._visible = !1, this._renderLayout();
	}
	toggle() {
		this._visible ? this.hide() : this.show();
	}
	close() {
		this._activeLayout = null, this.hide();
	}
	getVisible() {
		return this._visible;
	}
	getlayout(e) {
		let t = e.toLowerCase();
		for (let e of this._layouts) if (e.getId() === t) return e;
		throw Error(`Could not find a container with the id; "${e}"`);
	}
	isdynamic() {
		return +!!this._dynamic;
	}
	getcurlayout() {
		return this._activeLayout;
	}
	addLayout(e) {
		e.setParent(this), this._layouts.push(e), this._activeLayout ??= e;
	}
	getnumlayouts() {
		return this._layouts.length;
	}
	enumlayout(e) {
		return this._layouts[e];
	}
	addChild(e) {
		this.addLayout(e);
	}
	_clearCurrentLayout() {
		removeAllChildNodes(this._div);
	}
	switchtolayout(e) {
		let t = this.getlayout(e);
		assert(t != null, `Could not find layout with id "${e}".`), this._uiRoot.vm.dispatch(this, "onswitchtolayout", [{
			type: "OBJECT",
			value: t
		}]), this._clearCurrentLayout(), this._activeLayout = t, this._renderLayout();
	}
	dispatchAction(e, t, m) {
		switch (e) {
			case "SWITCH":
				this.switchtolayout(t);
				break;
			default: this._uiRoot.dispatch(e, t, m);
		}
	}
	_renderDimensions() {
		this._div.style.left = px(this._x), this._div.style.top = px(this._y);
	}
	_renderLayout() {
		this._visible && this._activeLayout ? this._div.appendChild(this._activeLayout.getDiv()) : this._clearCurrentLayout();
	}
	_renderLayouts() {
		for (let e of this._layouts) e.draw();
	}
	draw() {
		this.getId() && this._div.setAttribute("id", this.getId()), this._div.setAttribute("tabindex", "1"), this._renderDimensions(), this._renderLayouts(), this._renderLayout();
	}
};
Container.GUID = "e90dc47b4ae7840d0b042cb0fcf775d2";
//#endregion
//#region src/vendor/webamp-modern/skin/Cursor.js
var Pe = 1 << 31, Movable = class extends GuiObj {
	constructor() {
		super(...arguments), this._movable = !1, this._canResize = 0, this._resizingEventsRegistered = !1, this._movingEventsRegistered = !1, this._handleResizing = (e) => {
			if (e.stopPropagation(), e.button != 0) return;
			let t = this.getparentlayout();
			t.setResizing("constraint", this._canResize, 0), t.setResizing("start", 0, 0), t.setResizing(this._div.style.getPropertyValue("cursor"), Pe, Pe);
			let m = e.pageX, v = e.pageY, handleMove = (e) => {
				let y = e.pageX, x = e.pageY - v, S = y - m;
				t.setResizing("move", S, x);
			}, y = throttle(handleMove, 5), handleMouseUp = (e) => {
				if (e.stopPropagation(), e.button != 0) return;
				document.removeEventListener("mousemove", y), document.removeEventListener("mouseup", handleMouseUp);
				let x = e.pageX, S = e.pageY - v, C = x - m;
				t.setResizing("final", C, S);
			};
			document.addEventListener("mousemove", y), document.addEventListener("mouseup", handleMouseUp);
		}, this._handleMoving = (e) => {
			if (e.stopPropagation(), e.button != 0) return;
			let t = this.getparentlayout();
			t.setMoving("start", 0, 0);
			let m = e.pageX, v = e.pageY, handleMove = (e) => {
				let y = e.pageX, x = e.pageY - v, S = y - m;
				t.setMoving("move", S, x);
			}, y = throttle(handleMove, 5), handleMouseUp = (e) => {
				if (e.button != 0) return;
				e.stopPropagation(), document.removeEventListener("mousemove", y), document.removeEventListener("mouseup", handleMouseUp);
				let x = e.pageX, S = e.pageY - v, C = x - m;
				t.setMoving("final", C, S);
			};
			document.addEventListener("mousemove", y), document.addEventListener("mouseup", handleMouseUp);
		};
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "move":
				this._movable = toBool(t), this._renderCssCursor();
				break;
			case "resize":
				this._resize = t == "0" ? "" : t, this._renderCssCursor();
				break;
			default: return !1;
		}
		return !0;
	}
	_renderCssCursor() {
		if (this._movable) this._unregisterResizingEvents(), this._div.style.removeProperty("cursor"), this._canResize = 11, this._registerMovingEvents();
		else {
			switch (this._unregisterMovingEvents(), this._resize) {
				case "right":
					this._div.style.cursor = "e-resize", this._canResize = 4;
					break;
				case "left":
					this._div.style.cursor = "w-resize", this._canResize = 2;
					break;
				case "top":
					this._div.style.cursor = "n-resize", this._canResize = 8;
					break;
				case "bottom":
					this._div.style.cursor = "s-resize", this._canResize = 16;
					break;
				case "topleft":
					this._div.style.cursor = "nw-resize", this._canResize = 10;
					break;
				case "topright":
					this._div.style.cursor = "ne-resize", this._canResize = 12;
					break;
				case "bottomleft":
					this._div.style.cursor = "sw-resize", this._canResize = 18;
					break;
				case "bottomright":
					this._div.style.cursor = "se-resize", this._canResize = 20;
					break;
				default: this._div.style.removeProperty("cursor"), this._canResize = 0;
			}
			this._canResize == 0 ? this._unregisterResizingEvents() : this._registerResizingEvents();
		}
	}
	_registerResizingEvents() {
		this._resizingEventsRegistered || (this._resizingEventsRegistered = !0, this._div.addEventListener("mousedown", this._handleResizing));
	}
	_unregisterResizingEvents() {
		this._resizingEventsRegistered &&= (this._div.removeEventListener("mousedown", this._handleResizing), !1);
	}
	_registerMovingEvents() {
		this._movingEventsRegistered || (this._movingEventsRegistered = !0, this._div.addEventListener("mousedown", this._handleMoving));
	}
	_unregisterMovingEvents() {
		this._movingEventsRegistered &&= (this._div.removeEventListener("mousedown", this._handleMoving), !1);
	}
	draw() {
		super.draw(), this._ghost || this._sysregion == -2 ? this._div.style.pointerEvents = "none" : this._movable || this._canResize ? this._div.style.pointerEvents = "auto" : this._ghost && (this._div.style.pointerEvents = "none");
	}
}, _Group = class extends Movable {
	constructor() {
		super(...arguments), this._inited = !1, this._drawBackground = !0, this._isLayout = !1, this._systemObjects = [], this._allowZeroSize = !1, this._measuring = !1;
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "instance_id":
				this._instanceId = t;
				break;
			case "background":
				this._background = t, this._renderBackground();
				break;
			case "drawbackground":
				this._drawBackground = toBool(t), this._renderBackground();
				break;
			case "allowzerosize":
				this._allowZeroSize = toBool(t);
				break;
			default: return !1;
		}
		return !0;
	}
	_visibilityChanged() {
		for (let e of this._children) e._visibilityChanged();
	}
	init() {
		if (!this._inited) {
			this._inited = !0, super.init();
			for (let e of this._children) e.init();
			for (let e of this._systemObjects) e.init();
		}
	}
	dispose() {
		for (let e of this._systemObjects) e.dispose();
		for (let e of this._children) e.dispose();
	}
	getId() {
		return this._instanceId || this._id;
	}
	addSystemObject(e) {
		e.setParentGroup(this), this._systemObjects.push(e);
	}
	addChild(e) {
		e.setParent(this), this._children.push(e);
	}
	getobject(e) {
		let t = e.toLowerCase();
		for (let e of this._children) if (e.getId() === t) return e;
		let m = this._children.map((e) => e.getId()).join(", ");
		throw Error(`Could not find an object with the id: "${e}" within object "${this.getId()}". Only found: ${m}`);
	}
	enumobject(e) {
		return this._children[e];
	}
	getnumobjects() {
		return this._children.length;
	}
	getparentlayout() {
		let e = this;
		for (; e._parent && !e._isLayout;) e = e._parent;
		return e || console.warn("getParentLayout", this.getId(), "failed!"), e;
	}
	islayout() {
		return this._isLayout;
	}
	getheight() {
		let e = super.getheight();
		if (e == 0 && this._allowZeroSize) return e;
		if (!e && this._background != null) {
			let e = this._uiRoot.getBitmap(this._background);
			if (e) return e.getHeight();
		}
		return e || this._measureChildren().height;
	}
	getwidth() {
		if (this._autowidthsource) {
			let e = this.findobject(this._autowidthsource);
			if (e) return e.getautowidth();
		}
		let e = super.getwidth();
		if (e == 0 && this._allowZeroSize) return e;
		if (e < 0) return this._div.getBoundingClientRect().width || 0;
		if (!e && this._background != null) {
			let e = this._uiRoot.getBitmap(this._background);
			if (e) return e.getWidth();
		}
		return e || this._div.getBoundingClientRect().width || this._measureChildren().width;
	}
	_measureChildren() {
		if (this._measuring) return {
			width: 0,
			height: 0
		};
		this._measuring = !0;
		try {
			return this._measureChildrenInner();
		} finally {
			this._measuring = !1;
		}
	}
	_measureChildrenInner() {
		let e = 0, t = 0;
		for (let m of this._children ?? []) {
			let v = typeof m.getwidth == "function" ? m.getwidth() : 0, y = typeof m.getheight == "function" ? m.getheight() : 0, x = m._x ?? 0, S = m._y ?? 0;
			(v || y) && (e = Math.max(e, (x ?? 0) + (v ?? 0)), t = Math.max(t, (S ?? 0) + (y ?? 0)));
		}
		return {
			width: e,
			height: t
		};
	}
	_renderBackground() {
		if (this._background != null && this._drawBackground) {
			let e = this._uiRoot.getBitmap(this._background);
			this.setBackgroundImage(e);
		} else this.setBackgroundImage(null);
	}
	async doResize() {
		this._uiRoot.vm.dispatch(this, "onresize", [
			{
				type: "INT",
				value: 0
			},
			{
				type: "INT",
				value: 0
			},
			{
				type: "INT",
				value: this.getwidth()
			},
			{
				type: "INT",
				value: this.getheight()
			}
		]);
	}
	async _invalidateSize() {
		let e = this._div.getBoundingClientRect();
		(e.width != this._actualWidth || e.height != this._actualHeight) && (this._actualWidth = e.width, this._actualHeight = e.height, this.doResize(), this.applyRegions());
		for (let e of this._children) e instanceof _Group && e._invalidateSize();
	}
	applyRegions() {
		this._regionCanvas = null;
		let e = !1;
		for (let t of this._children) (t._sysregion == -1 || t._sysregion == -2) && (this.putAsRegion(t), e = !0);
		e && this.setRegion(), this._regionCanvas = null;
	}
	putAsRegion(e) {
		if (this._regionCanvas == null || this._regionCanvas.width == 0 || this._regionCanvas.height == 0) {
			let e = this._regionCanvas = document.createElement("canvas"), t = this._div.getBoundingClientRect();
			e.width = t.width, e.height = t.height;
			let m = e.getContext("2d");
			m.fillStyle = "white", m.fillRect(0, 0, t.width, t.height);
		}
		if (this._regionCanvas.width == 0 || this._regionCanvas.height == 0) return;
		let t = this._regionCanvas.getContext("2d"), m = e._div.getBoundingClientRect(), v = e._backgroundBitmap;
		if (v && v.loaded()) {
			let y = v.getImg();
			t.drawImage(y, v._x, v._y, m.width, m.height, e._div.offsetLeft, e._div.offsetTop, m.width, m.height);
		}
	}
	setRegion() {
		if (this._regionCanvas.width == 0 || this._regionCanvas.height == 0) return;
		let e = this._regionCanvas.getContext("2d"), t = e.getImageData(0, 0, this._regionCanvas.width, this._regionCanvas.height), m = t.data;
		for (var v = 0; v < m.length; v += 4) m[v + 3] = m[v + 0];
		e.putImageData(t, 0, 0), this._regionCanvas.toBlob((e) => {
			let t = URL.createObjectURL(e);
			this._div.style.setProperty("mask-image", `url(${t})`), this._div.style.setProperty("-webkit-mask-image", `url(${t})`);
		});
	}
	appendChildrenDiv() {
		this._appendChildrenToDiv(this._div);
	}
	_appendChildrenToDiv(e) {
		for (let t of this._children) t.draw(), e.appendChild(t.getDiv());
	}
	_hasDeclaredSize() {
		let e = this._background == null ? null : this._uiRoot.getBitmap(this._background), t = this._relatw == "1" || GuiObj.prototype.getwidth.call(this) > 0 || !!this._autowidthsource || e != null && e.getWidth() > 0, m = this._relath == "1" || GuiObj.prototype.getheight.call(this) > 0 || e != null && e.getHeight() > 0;
		return t && m;
	}
	_renderClipping() {
		this._div.style.overflow = this._hasDeclaredSize() ? "hidden" : "";
	}
	_renderWidth() {
		super._renderWidth(), this._renderClipping();
	}
	_renderHeight() {
		super._renderHeight(), this._renderClipping();
	}
	draw() {
		super.draw(), this._div.classList.add("webamp--img"), this._renderClipping(), this._movable || this._canResize ? this._div.style.pointerEvents = "auto" : this._div.style.pointerEvents = "none", this._div.style.pointerEvents = "none", this._renderBackground(), this.appendChildrenDiv(), this._autowidthsource && this._div.classList.add("autowidthsource");
	}
}, Fe = _Group;
Fe.GUID = "45be95e5419120725fbb5c93fd17f1f9";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/MenuItem.js
var Ie = null;
function destroyActivePopup() {
	console.log("globalWindowClick"), Ie?.doClosePopup(), uninstallGlobalClickListener();
}
function setActivePopup(e) {
	Ie = e, e ? installGlobalClickListener() : uninstallGlobalClickListener();
}
function deactivePopup(e) {
	e == Ie && setActivePopup(null);
}
var Le = !1;
function installGlobalClickListener() {
	setTimeout(() => {
		Le ||= (installGlobalMouseDown(destroyActivePopup), document.addEventListener("mousedown", destroyActivePopup), !0);
	}, 500);
}
function uninstallGlobalClickListener() {
	Le && (document.removeEventListener("mousedown", destroyActivePopup), Le = !1, uninstallGlobalMouseDown(destroyActivePopup));
}
function forEachMenuItem(e, t) {
	for (let m of e.children) m.type == "menuitem" ? t(m) : m.type == "popup" && forEachMenuItem(m.popup, t);
}
function extractCaption(e) {
	let [t, m] = e.split("	");
	return {
		caption: t,
		shortcut: m,
		keychar: t.includes("&") ? t[t.indexOf("&") + 1].toLowerCase() : ""
	};
}
function generatePopupDiv(e, t) {
	let m = document.createElement("ul");
	m.className = "popup-menu-container";
	for (let v of e.children) {
		let e;
		switch (v.type) {
			case "menuitem":
				if (v.invisible === !0) continue;
				e = generatePopupItem(v), e.addEventListener("mousedown", (e) => t(v.id));
				break;
			case "popup":
				e = generatePopupItem(v);
				let m = generatePopupDiv(v.popup, t);
				e.appendChild(m);
				break;
			case "separator": e = document.createElement("hr");
		}
		m.appendChild(e);
	}
	return m;
}
function generatePopupItem(e) {
	let t = document.createElement("li"), m = document.createElement("span");
	m.classList.add("checkmark"), m.textContent = e.checked ? "✓" : " ", t.appendChild(m);
	let v = generateCaption(e.caption);
	v.classList.add("caption"), t.appendChild(v);
	let y = document.createElement("span");
	y.classList.add("keystroke"), y.textContent = e.type == "menuitem" ? e.shortcut : "", t.appendChild(y);
	let x = document.createElement("span");
	return x.classList.add("chevron"), x.textContent = e.type == "popup" ? "🞂" : " ", t.appendChild(x), t;
}
function generateCaption(e) {
	e = e.replace(/(&(\w))/gm, "<u>$2</u>");
	let t = document.createElement("span");
	return t.classList.add("caption"), t.innerHTML = e, t;
}
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/menuWa5actions.js
var Re = {
	onUpdate: (e) => {},
	onExecute: (e) => !1
}, ze = {}, findAction = (e) => {
	let t = ze[e] || {};
	return {
		...Re,
		...t
	};
};
async function updateActions(e, t) {
	return await Promise.all(e.children.map(async (e) => {
		e.type == "menuitem" ? findAction(e.id).onUpdate(e, t) : e.type == "popup" && await updateActions(e.popup, t);
	}));
}
var registerAction = (e, t) => {
	ze[e] = t;
};
registerAction(40037, {
	onUpdate: (e, t) => {
		e.checked = !t.audio._timeRemaining;
	},
	onExecute: (e) => (e.audio._timeRemaining = !1, !0)
}), registerAction(40038, {
	onUpdate: (e, t) => {
		e.checked = t.audio._timeRemaining;
	},
	onExecute: (e) => (e.audio._timeRemaining = !0, !0)
}), registerAction(40039, { onExecute: (e) => (e.audio.toggleRemainingTime(), !0) }), registerAction(40044, { onExecute: (e) => e.dispatch("prev") }), registerAction(40045, { onExecute: (e) => e.dispatch("play") }), registerAction(40046, { onExecute: (e) => e.dispatch("pause") }), registerAction(40047, { onExecute: (e) => e.dispatch("stop") }), registerAction(40048, { onExecute: (e) => e.dispatch("next") }), registerAction(11111140038, { onUpdate: (e) => {} }), registerAction(40244, {
	onUpdate: (e, t) => {
		e.checked = t.audio._eqEnabled;
	},
	onExecute: (e) => (e.eq_toggle(), !0)
}), registerAction(40040, {
	onUpdate: (e, t) => {
		e.checked = t.getActionState("toggle", "guid:pl");
	},
	onExecute: (e) => (e.dispatch("toggle", "guid:pl"), !0)
});
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Layout.js
var Layout = class extends Fe {
	constructor(e) {
		super(e), this._resizingDiv = null, this._resizing = !1, this._resizing_start = null, this._canResize = 0, this._scale = 1, this._opacity = 1, this._desktopalpha = !1, this._moving = !1, this._snap = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0
		}, this._shortcuts = {}, this._resizeScale = 1, this._resizeLocal = null, this._isLayout = !0;
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e) {
			case "desktopalpha":
				this._desktopAlpha = toBool(t);
				break;
			case "snapadjustleft":
				this._snap.left = Number(t) || 0;
				break;
			case "snapadjusttop":
				this._snap.top = Number(t) || 0;
				break;
			case "snapadjustright":
				this._snap.right = Number(t) || 0;
				break;
			case "snapadjustbottom":
				this._snap.bottom = Number(t) || 0;
				break;
			default: return !1;
		}
		return !0;
	}
	getSnapAdjust() {
		return { ...this._snap };
	}
	getVisibleWidth() {
		return Math.max(0, this.getwidth() - this._snap.left - this._snap.right);
	}
	getVisibleHeight() {
		return Math.max(0, this.getheight() - this._snap.top - this._snap.bottom);
	}
	_renderBackground() {
		if (super._renderBackground(), this._background != null && this._w == 0 && this._h == 0) {
			let e = this._uiRoot.getBitmap(this._background);
			e != null && (this._w = e.getWidth(), this._h = e.getHeight(), this._renderSize());
		}
	}
	getcontainer() {
		return this._parent;
	}
	gettop() {
		return this._parent._y;
	}
	getleft() {
		return this._parent._x;
	}
	resize(e, t, m, v) {
		let y = this._parent;
		y.setXmlAttr("x", String(e)), y.setXmlAttr("y", String(t)), this._w = m, this._h = v, this._renderDimensions();
	}
	dispatchAction(e, t, m) {
		if (m != null) {
			this.findobject(m)?.handleAction(e, t, m);
			return;
		}
		this._parent != null && this._parent.dispatchAction(e, t, m);
	}
	snapadjust(e, t, m, v) {
		let y = this._snap.left !== e || this._snap.top !== t || this._snap.right !== m || this._snap.bottom !== v;
		this._snap.left = e, this._snap.top = t, this._snap.right = m, this._snap.bottom = v, y && (this.onsnapadjustchanged(), this._uiRoot.onLayoutSnapAdjustChanged?.(this));
	}
	onsnapadjustchanged() {
		this._uiRoot.vm.dispatch(this, "onsnapadjustchanged", []);
	}
	getsnapadjusttop() {
		return this._snap.top;
	}
	getsnapadjustleft() {
		return this._snap.left;
	}
	getsnapadjustright() {
		return this._snap.right;
	}
	beforeredock() {}
	redock() {}
	getsnapadjustbottom() {
		return this._snap.bottom;
	}
	clienttoscreenh(e) {
		return unimplemented(e);
	}
	islayoutanimationsafe() {
		return !0;
	}
	istransparencysafe() {
		return !0;
	}
	getscale() {
		return this._scale;
	}
	setscale(e) {
		this._scale = e, this.getDiv().style.transform = `scale(${this._scale})`;
	}
	setdesktopalpha(e) {
		this._desktopalpha = unimplemented(e);
	}
	getdesktopalpha() {
		return this._desktopalpha;
	}
	init() {
		super.init();
	}
	afterInited() {
		this._invalidateSize(), this._uiRoot.vm.dispatch(this, "onstartup");
	}
	_screenScale() {
		let e = this._div.offsetWidth;
		return e ? this._div.getBoundingClientRect().width / e : 1;
	}
	setResizing(e, t, m) {
		let clampW = (e) => (e = this._maximumWidth ? Math.min(e, this._maximumWidth) : e, e = this._minimumWidth ? Math.max(e, this._minimumWidth) : e, e), clampH = (e) => (e = this._maximumHeight ? Math.min(e, this._maximumHeight) : e, e = this._minimumHeight ? Math.max(e, this._minimumHeight) : e, e), drawGhost = (e) => {
			let t = this._resizing_start, m = this._resizeScale;
			this._resizingDiv.style.cssText = `
        width: ${px(e.width * m)};
        height: ${px(e.height * m)};
        left: ${px(t.left + e.left * m)};
        top: ${px(t.top + e.top * m)};
        `;
		};
		if (e == "constraint") this._canResize = t;
		else if (e == "start") {
			this.bringtofront();
			let e = this._div.getBoundingClientRect();
			this._resizing_start = e, this._resizeScale = this._screenScale(), this._resizeLocal = {
				left: 0,
				top: 0,
				width: this.getwidth(),
				height: this.getheight()
			}, this._resizing = !0, this._resizingDiv = document.createElement("div"), this._resizingDiv.className = "resizing", drawGhost(this._resizeLocal), document.body.appendChild(this._resizingDiv);
		} else if (t == -2147483648 && m == -2147483648) this._resizingDiv.style.cursor = e;
		else if (e == "move") {
			if (!this._resizing) return;
			let e = this._resizeScale, v = t / e, y = m / e, x = this.getwidth(), S = this.getheight(), C = 0, w = 0, E = x, O = S;
			this._canResize & 4 && (E = clampW(x + v)), this._canResize & 16 && (O = clampH(S + y)), this._canResize & 2 && (E = clampW(x - v), C = x - E), this._canResize & 8 && (O = clampH(S - y), w = S - O), this._resizeLocal = {
				left: C,
				top: w,
				width: E,
				height: O
			}, drawGhost(this._resizeLocal);
		} else if (e == "final") {
			if (!this._resizing) return;
			this._resizing = !1;
			let e = this._resizeLocal, t = this._parent;
			this.setXmlAttr("w", String(Math.round(e.width))), this.setXmlAttr("h", String(Math.round(e.height))), t.setXmlAttr("x", String(Math.round(t._x + e.left))), t.setXmlAttr("y", String(Math.round(t._y + e.top))), this._resizingDiv.remove(), this._resizingDiv = null, this._resizeLocal = null, this._invalidateSize();
		}
	}
	setMoving(e, t, m) {
		let v = this._parent;
		if (e == "start") this._moving = !0, this._movingStartX = v._x, this._movingStartY = v._y, this.bringtofront();
		else if (t != -2147483648 || m != -2147483648) {
			if (e == "move") {
				if (!this._moving) return;
				let e = this._screenScale();
				v.setLocation(Math.round(this._movingStartX + t / e), Math.round(this._movingStartY + m / e));
			} else if (e == "final") {
				if (!this._moving) return;
				this._invalidateSize(), this._moving = !1;
			}
		}
	}
	registerShortcuts(e) {
		forEachMenuItem(e, (e) => {
			e.shortcut && (this._shortcuts[e.shortcut] = e.id);
		});
	}
	executeShorcut(e) {
		let t = this._shortcuts[e];
		findAction(t).onExecute(this._uiRoot);
	}
};
Layout.GUID = "60906d4e482e537e94cc04b072568861";
//#endregion
//#region src/vendor/webamp-modern/skin/Clippath.js
var Edges = class {
	constructor() {
		this._top = [], this._right = [], this._bottom = [], this._left = [], this.simplify = !0;
	}
	opaqueByTransparent(e, t) {
		return this._data.data[(e + t * this._w) * 4 + 3] != 0;
	}
	parseCanvasTransparency(e, t = null, m = null) {
		this.opaque = this.opaqueByTransparent, this._parseCanvasTransparency(e, t, m);
	}
	parseCanvasTransparencyByNonColor(e, t) {
		let m = hexToRgb(t);
		this.opaque = (e, t) => this._data.data[(e + t * this._w) * 4 + 0] == m.r && this._data.data[(e + t * this._w) * 4 + 1] == m.g && this._data.data[(e + t * this._w) * 4 + 2] == m.b, this._parseCanvasTransparency(e, null, null);
	}
	parseCanvasTransparencyByColor(e, t) {
		let sum = (e, t, m) => e | t << 8 | m << 16, m = hexToRgb(t), v = sum(m.r, m.g, m.b);
		this.opaque = (e, t) => {
			let m = (e + t * this._w) * 4, y = this._data.data.slice(m, m + 4);
			return sum(y[0], y[1], y[2]) != v;
		}, this._parseCanvasTransparency(e, null, null);
	}
	_parseCanvasTransparency(e, t = null, m = null) {
		let v = t || e.width, y = m || e.height;
		this._w = v;
		let x = e.getContext("2d");
		this._data = x.getImageData(0, 0, v, y);
		let S = [];
		var C, w, E, O;
		function post(e, t, m, v) {
			S.push([m, v]), E = e, O = t;
		}
		for (S = [], C = 0; C < v; C++) for (w = 0; w < y; w++) if (this.opaque(C, w)) {
			post(C, w, C, w), post(C, w, C + 1, w);
			break;
		}
		this._top = S;
		let k = O, ee = S.length > 0 ? S[0][1] : 0;
		for (S = [], w = k; w < y; w++) for (C = v - 1; C >= 0; C--) if (this.opaque(C, w)) {
			post(C, w, C + 1, w), post(C, w, C + 1, w + 1);
			break;
		}
		this._right = S;
		let I = E;
		for (S = [], C = I; C >= 0; C--) for (w = y - 1; w >= 0; w--) if (this.opaque(C, w)) {
			post(C, w, C + 1, w + 1), post(C, w, C, w + 1);
			break;
		}
		this._bottom = S;
		let z = O;
		for (S = [], w = z; w >= ee; w--) for (C = 0; C < v; C++) if (this.opaque(C, w)) {
			post(C, w, C, w + 1), post(C, w, C, w);
			break;
		}
		this._left = S;
	}
	_buildPoint(e) {
		return (this.simplify ? simplifyPoints(e) : e).map((e) => `${e[0]}px ${e[1]}px`).join(", ");
	}
	gettop() {
		return this._buildPoint(this._top);
	}
	getright() {
		return this._buildPoint(this._right);
	}
	getbottom() {
		return this._buildPoint(this._bottom);
	}
	getleft() {
		return this._buildPoint(this._left);
	}
	isSimpleRect() {
		return this._top.length == 2 && this._bottom.length == 2;
	}
	getPolygon() {
		let e = [
			...this._top,
			...this._right,
			...this._bottom,
			...this._left
		];
		return `polygon(${this._buildPoint(e)})`;
	}
};
function simplifyPoints(e) {
	let t = [], m = 0, [v, y] = [-1, -1], [x, S] = [-2, -2];
	for (; m < e.length;) {
		let next = () => {
			x = v, S = y, v = C, y = w, m++;
		}, [C, w] = e[m];
		if (C == v && w == y) {
			next();
			continue;
		}
		if (t.length >= 2) {
			let [e, m] = t[t.length - 1], [v, y] = t[t.length - 2];
			if (C == e && (m != y || e == v)) {
				let [e, m] = t.pop();
				t.push([e, w]), next();
				continue;
			}
			if (w == m && (e != v || m == y)) {
				let [e, m] = t.pop();
				t.push([C, m]), next();
				continue;
			}
		}
		t.push([C, w]), next();
	}
	return t;
}
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Layer.js
var Layer = class extends Movable {
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return e == "sysregion" && this._renderRegion(), !0;
		switch (e) {
			case "image":
				this._image = t, this._renderBackground(), this._renderRegion();
				break;
			case "inactiveimage":
				this._inactiveImage = t, this._renderBackground();
				break;
			case "tile":
				this._div.classList.toggle("tile", toBool(t));
				break;
			default: return !1;
		}
		return !0;
	}
	getheight() {
		if (this._h) return this._h;
		if (this._image != null) {
			let e = this._uiRoot.getBitmap(this._image);
			if (e) return e.getHeight();
		}
		return super.getheight();
	}
	getwidth() {
		if (this._w) return this._w;
		if (this._image != null) {
			let e = this._uiRoot.getBitmap(this._image);
			if (e) return e.getWidth();
		}
		return super.getwidth();
	}
	_renderBackground() {
		let e = this._image == null ? null : this._uiRoot.getBitmap(this._image);
		this.setBackgroundImage(e), this.setInactiveBackgroundImage(e), this._inactiveImage && (this.setInactiveBackgroundImage(this._uiRoot.getBitmap(this._inactiveImage)), this._div.classList.add("inactivable"));
	}
	_renderRegion() {
		if (this._sysregion == 1 && this._image) {
			let e = this._uiRoot.getBitmap(this._image);
			if (e && e.getImg()) {
				let t = e.getCanvas(), m = new Edges();
				if (m.parseCanvasTransparency(t, this.getwidth(), this.getheight()), !m.isSimpleRect()) {
					this._div.style.clipPath = m.getPolygon();
					return;
				}
			}
			this.setXmlAttr("sysregion", "0");
		}
	}
	draw() {
		super.draw(), this._div.classList.add("webamp--img"), this._renderBackground();
	}
};
Layer.GUID = "5ab9fa1545579a7d5765c8aba97cc6a6";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/AnimatedLayer.js
var AnimatedLayer = class extends Layer {
	constructor() {
		super(...arguments), this._vertical = !0, this._currentFrame = 0, this._startFrame = 0, this._endFrame = 0, this._speed = 200, this._autoReplay = !0, this._autoPlay = !1, this._animationInterval = null, this._paused = !1, this._geometryKnown = !1;
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (m == "image" && /\%[0-9]*d/.test(t)) return this._imageFormat = t, !0;
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "speed":
				this._speed = num(t);
				break;
			case "start":
				this._startFrame = num(t);
				break;
			case "end":
				this._endFrame = num(t);
				break;
			case "frameheight":
				this._frameHeight = num(t), this._vertical = !0;
				break;
			case "framewidth":
				this._frameWidth = num(t), this._vertical = !1;
				break;
			case "autoplay":
				this._autoPlay = toBool(t);
				break;
			case "autoreplay":
				this._autoReplay = toBool(t);
				break;
			default: return !1;
		}
		return !0;
	}
	_getImageHeight() {
		return this._uiRoot.getBitmap(this._image).getHeight();
	}
	getdirection() {
		return unimplemented(+!!this._vertical);
	}
	getlength() {
		let e = this._uiRoot.getBitmap(this._image);
		return !e || !e.getImg() ? 0 : this._vertical ? e.getHeight() / (this._frameHeight || this.getheight()) : e.getWidth() / (this._frameWidth || this.getwidth());
	}
	gotoframe(e) {
		let t = ensureVmInt(e);
		if (!this._geometryKnown) {
			this._currentFrame = t;
			return;
		}
		let m = this.getlength();
		t < 0 || m > 0 && t >= m || (this._currentFrame = t, this._renderFrame(), this._uiRoot.vm.dispatch(this, "onframe", [{
			type: "INT",
			value: this._currentFrame
		}]));
	}
	getcurframe() {
		return this._currentFrame;
	}
	setstartframe(e) {
		this._startFrame = ensureVmInt(e);
	}
	setendframe(e) {
		this._endFrame = ensureVmInt(e);
	}
	setspeed(e) {
		this._speed = e;
	}
	play() {
		this._animationInterval != null && (clearInterval(this._animationInterval), this._animationInterval = null), this._paused = !1;
		let e = this._endFrame, t = this._startFrame, m = e > t ? 1 : -1, v = e < t, y = this._startFrame;
		if (this.gotoframe(y), this._uiRoot.vm.dispatch(this, "onplay"), y === e && !this._autoReplay) {
			this.stop();
			return;
		}
		this._animationInterval = setInterval(() => {
			this._paused || (this.gotoframe(y), y === e && (this._autoReplay || this.stop()), v ? (--y, y < e ? y = t : y > t && (y = e)) : (y += m, y < t ? y = e : y > e && (y = t)));
		}, this._speed);
	}
	pause() {
		this._paused = !0, this._uiRoot.vm.dispatch(this, "onpause");
	}
	stop() {
		this._animationInterval != null && (clearInterval(this._animationInterval), this._animationInterval = null), this._uiRoot.vm.dispatch(this, "onstop");
	}
	isplaying() {
		return this._animationInterval != null;
	}
	ispaused() {
		return this._animationInterval != null && this._paused;
	}
	isstopped() {
		return this.isplaying() && !this._paused;
	}
	setautoreplay(e) {
		this._autoReplay = e;
	}
	getautoreplay() {
		return this._autoReplay;
	}
	getstartframe() {
		return this._startFrame;
	}
	getendframe() {
		return this._endFrame;
	}
	setrealtime(e) {}
	_getActualHeight() {
		return this._h || this._div.getBoundingClientRect().height;
	}
	init() {
		if (super.init(), !this._frameHeight && !this._frameWidth) {
			let e = this._uiRoot.getBitmap(this._image), t = this.getwidth(), m = this.getheight();
			e && e.getImg() && e.getHeight() <= m && e.getWidth() > t ? (this._vertical = !1, this._frameWidth = t) : (this._vertical = !0, this._frameHeight = m);
		} else this._vertical && !this._frameHeight ? this._frameHeight = this.getheight() : !this._vertical && !this._frameWidth && (this._frameWidth = this.getwidth());
		this._geometryKnown = !0, this._endFrame == 0 && this.getlength() > 0 && (this._endFrame = this.getlength() - 1), this._startFrame == 0 ? this._renderFrame() : this.gotoframe(this._startFrame), this._autoPlay && this.play();
	}
	_renderFrame() {
		this._vertical ? this._div.style.backgroundPositionY = px(-(this._currentFrame * this._frameHeight)) : this._div.style.backgroundPositionX = px(-(this._currentFrame * this._frameWidth));
	}
	draw() {
		super.draw(), this._renderFrame(), this._div.setAttribute("data-obj-name", "AnimatedLayer");
	}
};
AnimatedLayer.GUID = "6b64cd274c4b5a26a7e6598c3a49f60c";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/PopupMenu.js
function popupLayer() {
	let e = document.getElementById("webamp-modern-popups");
	return e || (e = document.createElement("div"), e.id = "webamp-modern-popups", e.className = "webamp-modern-host webamp-modern-popups", e.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:var(--webamp-overlay-z, 100000);", document.body.appendChild(e)), e;
}
function waitPopup(e, t = 0, m = 0) {
	return new Promise((v) => {
		let itemClick = (e) => {
			closePopup(), v(e);
		}, y = generatePopupDiv(e, itemClick);
		(t || m) && (y.style.left = px(t), y.style.top = px(m)), popupLayer().appendChild(y);
		let closePopup = () => {
			y.remove(), e._successPromise = null;
		}, outsideClick = (e) => {
			closePopup(), v(e);
		};
		e._successPromise = outsideClick;
		function handleClick() {
			document.removeEventListener("click", handleClick), closePopup(), v(-1);
		}
		document.addEventListener("click", handleClick);
	});
}
var PopupMenu = class extends BaseObject {
	constructor(e) {
		super(), this.children = [], this._successPromise = null, this._uiRoot = e;
	}
	_addcommand(e, t, m = !1, v = !1, y = {}) {
		this.children.push({
			type: "menuitem",
			...extractCaption(e),
			id: t,
			checked: m,
			disabled: v,
			data: y
		});
	}
	addcommand(e, t, m, v) {
		if (t == 32767) {
			this._loadSkins();
			return;
		}
		this._addcommand(e, t, m, v);
	}
	addseparator() {
		this.children.push({ type: "separator" });
	}
	addsubmenu(e, t) {
		this.children.push({
			type: "popup",
			popup: e,
			...extractCaption(t)
		});
	}
	checkcommand(e, t) {
		let m = this.children.find((t) => t.type === "menuitem" && t.id === e);
		if (assume(m != null, `Could not find item with id "${e}"`), m.type !== "menuitem") throw Error("Expected item to be an item.");
		m.checked = t;
	}
	disablecommand(e, t) {
		for (let m of this.children) if (m.type == "menuitem" && m.id == e) {
			m.disabled = t;
			break;
		}
	}
	async popatmouse() {
		console.log("popAtMouse.start...:");
		let e = this._uiRoot._mousePos, t = await this.popatxy(e.x, e.y);
		return console.log("popAtMouse.return:", t), t;
	}
	async popatxy(e, t) {
		destroyActivePopup(), setActivePopup(this);
		let m = await waitPopup(this, e, t);
		return deactivePopup(this), m;
	}
	doClosePopup() {
		this._successPromise && this._successPromise(-1);
	}
	_loadSkins() {
		let e = 32767;
		this._uiRoot._skins.forEach((t) => {
			let m = typeof t == "string" ? t : t.name, v = {
				name: m,
				url: typeof t == "string" ? t : t.url
			};
			e++, registerAction(e, {
				onUpdate: (e, t) => {
					e.checked = t.getSkinName() == e.caption || t.getSkinUrl() == e.data.url;
				},
				onExecute: (e) => (e.switchSkin(v), !0)
			}), this._addcommand(m, e, !1, !1, v);
		});
	}
	getnumcommands() {
		return this.children.length;
	}
	hideMenu(e) {
		for (let t of this.children) if (t.type == "menuitem" && t.id == e) {
			t.invisible = !0;
			break;
		}
	}
};
PopupMenu.GUID = "f4787af44ef7b2bb4be7fb9c8da8bea9";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/ToggleButton.js
var ToggleButton = class extends Button {
	getElTag() {
		return "button";
	}
	getcurcfgval() {
		return +!!this._active;
	}
	_cfgAttribChanged(e) {
		this.setactivated(e != "0"), this.ontoggle(this._active);
	}
	_handleMouseDown(e) {
		e.stopPropagation(), this.setactivated(!this._active), this.updateCfgAttib(this._active ? "1" : "0"), this.ontoggle(this._active);
	}
	ontoggle(e) {
		this._uiRoot.vm.dispatch(this, "ontoggle", [Ce.newBool(e)]);
	}
	onactivate(e) {
		this._uiRoot.vm.dispatch(this, "onactivate", [{
			type: "INT",
			value: e
		}]);
	}
	draw() {
		super.draw(), this._div.setAttribute("data-obj-name", "ToggleButton");
	}
};
ToggleButton.GUID = "b4dccfff4bcc81fe0f721b96ff0fbed5";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Status.js
var Status = class extends GuiObj {
	constructor(e) {
		super(e), this._state = Ee, this._uiRoot.audio.on("statchanged", () => this._updateStatus());
	}
	_updateStatus() {
		this._state = this._uiRoot.audio.getState(), this._renderBackground();
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "stopbitmap":
				this._stopbitmap = t, this._renderBackground();
				break;
			case "playbitmap":
				this._playbitmap = t, this._renderBackground();
				break;
			case "pausebitmap":
				this._pausebitmap = t, this._renderBackground();
				break;
			default: return !1;
		}
		return !0;
	}
	getheight() {
		if (this._h) return this._h;
		if (this._stopbitmap != null) {
			let e = this._uiRoot.getBitmap(this._stopbitmap);
			return e ? e.getHeight() : 15;
		}
		return super.getheight();
	}
	getwidth() {
		if (this._w) return this._w;
		if (this._stopbitmap != null) {
			let e = this._uiRoot.getBitmap(this._stopbitmap);
			return e ? e.getWidth() : 15;
		}
		return super.getwidth();
	}
	_renderBackground() {
		let e;
		switch (this._state) {
			case De:
				e = this._playbitmap;
				break;
			case Te:
				e = this._pausebitmap;
				break;
			case Ee:
			default: e = this._stopbitmap;
		}
		let t = this._uiRoot.getBitmap(e);
		t == null ? this.setBackgroundImage(null) : this.setBackgroundImage(t);
	}
	draw() {
		super.draw(), this._div.classList.add("webamp--img"), this._renderBackground();
	}
};
Status.GUID = "0f08c9404b23af39c4b8f38059bb7e8f";
//#endregion
//#region src/vendor/webamp-modern/skin/TrueTypeFont.js
var TrueTypeFont = class {
	setXmlAttributes(e) {
		for (let [t, m] of Object.entries(e)) this.setXmlAttr(t, m);
	}
	setXmlAttr(e, t) {
		switch (e.toLowerCase()) {
			case "id":
				this._id = t;
				break;
			case "family":
				this._inlineFamily = t;
				break;
			case "file":
				this._file = t;
				break;
			default: return !1;
		}
		return !0;
	}
	getId() {
		return this._id || "";
	}
	getFontFamily() {
		let e = this._inlineFamily || this._fontFace?.family || this.getId();
		return /[,'"]/.test(e) ? e : `'${e}'`;
	}
	dispose() {
		this._fontFace && document.fonts.delete(this._fontFace);
	}
	getBase64() {
		return console.log("getting Base64. me:", this.getId()), this._imageManager.getCachedUrl(this._file);
	}
	hasUrl() {
		return this._imageManager != null;
	}
	async ensureFontLoaded(e) {
		if (!this._file) return;
		assert(this._fontFace == null, "Tried to ensure a TrueTypeFont was laoded more than once."), this._imageManager = e;
		let t = await e.getUrl(this._file);
		if (!t) {
			console.warn(`TrueType font file not found in skin: ${this._file}`), this._imageManager = null;
			return;
		}
		let m = `font-${getId()}-${this.getId()}-${this._file}`.replace(/[^a-zA-Z0-9_-]/g, "_"), v = new FontFace(m, `url(${t})`);
		this._fontFace = await v.load(), document.fonts.add(this._fontFace);
	}
};
//#endregion
//#region src/vendor/webamp-modern/skin/Bitmap.js
function genCssVar(e) {
	return `--bitmap-${e.replace(/[^a-zA-Z0-9]/g, "-")}`;
}
var Bitmap = class {
	constructor(e = null) {
		this._x = 0, this._y = 0, this._uiRoot = e;
	}
	setUiRoot(e) {
		this._uiRoot = e;
	}
	setXmlAttributes(e) {
		for (let [t, m] of Object.entries(e)) this.setXmlAttr(t, m);
	}
	setXmlAttr(e, t) {
		switch (e.toLowerCase()) {
			case "id":
				this._id = t, this._cssVar = genCssVar(this.getId());
				break;
			case "x":
				this._x = num(t) ?? 0;
				break;
			case "y":
				this._y = num(t) ?? 0;
				break;
			case "w":
				this._w = num(t);
				break;
			case "h":
				this._h = num(t);
				break;
			case "file":
				this._file = t;
				break;
			case "gammagroup":
				this._gammagroup = t;
				break;
			case "transparentcolor":
				this._transparentColor = t;
				break;
			default: return !1;
		}
		return !0;
	}
	getId() {
		return this._id || "";
	}
	getFile() {
		return this._file || "";
	}
	getWidth() {
		return this._w;
	}
	getHeight() {
		return this._h;
	}
	getLeft() {
		return this._x;
	}
	getTop() {
		return this._y;
	}
	getCSSVar() {
		return this._cssVar;
	}
	getGammaGroup() {
		return this._gammagroup;
	}
	getImg() {
		return this._img;
	}
	setImage(e) {
		this._img = e;
	}
	loaded() {
		return this._img != null;
	}
	async ensureImageLoaded(e) {
		assert(this._url == null, "Tried to ensure a Bitmap was laoded more than once."), this._img = await e.getImage(this._file), this._img && this._w == null && this._h == null && (this.setXmlAttr("w", String(this._img.width)), this.setXmlAttr("h", String(this._img.height)));
	}
	_getBackgrondImageCSSAttribute() {
		return `var(${this.getCSSVar()})`;
	}
	_getBackgrondPositionCSSAttribute() {
		return `${px(-(this._x ?? 0))} ${px(-(this._y ?? 0))}`;
	}
	_getBackgrondSizeCSSAttribute() {
		return `${px(this._w)} ${px(this._h)}`;
	}
	_setAsBackground(e, t) {
		e.style.setProperty(`--${t}background-image`, this._getBackgrondImageCSSAttribute());
	}
	setAsBackground(e) {
		this._setAsBackground(e, "");
	}
	setAsDownBackground(e) {
		this._setAsBackground(e, "down-");
	}
	setAsActiveBackground(e) {
		this._setAsBackground(e, "active-");
	}
	setAsInactiveBackground(e) {
		this._setAsBackground(e, "inactive-");
	}
	setAsHoverBackground(e) {
		this._setAsBackground(e, "hover-");
	}
	setAsHoverDownBackground(e) {
		this._setAsBackground(e, "hover-down-");
	}
	setAsDisabledBackground(e) {
		this._setAsBackground(e, "disabled-");
	}
	async getGammaTransformedUrl(e) {
		let buildCssProp = (e) => `  ${this.getCSSVar()}: url(${e});`, t = this.getImg();
		if (!t) return console.warn(`Bitmap/font ${this.getId()} has no img. skipped.`), "";
		let m = this.getGammaGroup(), v = e._getGammaGroup(m);
		return v._value == "0,0,0" && v._gray == 0 ? buildCssProp(await this.toDataURL(e)) : buildCssProp(v.transformImage(t, this._x, this._y, this._w, this._h));
	}
	async toDataURL(e) {
		return this._file.endsWith(".gif") ? await e.getImageManager().getUrl(this._file) : this.getCanvas().toDataURL();
	}
	getCanvas(e = !1) {
		let t;
		if (this._canvas == null || !e) {
			if (assert(this._img != null, `Expected bitmap image to be loaded: ${this.getId()}`), this._img instanceof HTMLCanvasElement) t = this._img;
			else {
				t = document.createElement("canvas"), t.width = this.getWidth(), t.height = this.getHeight();
				let e = t.getContext("2d");
				if (e.drawImage(this._img, -this._x, -this._y), this._transparentColor != null) {
					let x = hexToRgb(this._transparentColor);
					var m = e.getImageData(0, 0, t.width, t.height), v = m.data;
					let S = v.length;
					for (var y = 0; y < S; y += 4) v[y + 0] == x.r && v[y + 1] == x.g && v[y + 2] == x.b && (v[y + 3] = 0);
					e.putImageData(m, 0, 0);
				}
			}
			e && (this._canvas = t);
		}
		return e && (t = this._canvas), t;
	}
}, Be = ["abcdefghijklmnopqrstuvwxyz\"@  ", "0123456789….:()-'!_+\\/[]^&%,=$#\nâöä?*"], Ve = {};
Be.forEach((e, t) => {
	e.split("").forEach((e, m) => {
		Ve[e] = [m, t];
	});
}), console.log("CHAR_MAP:", Ve);
var BitmapFont = class extends Bitmap {
	constructor() {
		super(...arguments), this._horizontalSpacing = 0, this._externalBitmap = !1, this._bitmap = null, this._wa2bignum = 0;
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e.toLowerCase()) {
			case "charwidth":
				this._charWidth = num(t);
				break;
			case "charheight":
				this._charHeight = num(t);
				break;
			case "hspacing":
				this._horizontalSpacing = num(t);
				break;
			case "vspacing":
				this._verticalSpacing = num(t);
				break;
			case "wa2bignum":
				this._wa2bignum = num(t);
				break;
			default: return !1;
		}
		return !0;
	}
	getHorizontalSpacing() {
		return this._horizontalSpacing;
	}
	_setAsBackground(e, t) {
		this._externalBitmap ? (!this._bitmap && this._uiRoot != null && (this._bitmap = this._uiRoot.getBitmap(this._file)), this._bitmap != null && this._bitmap._setAsBackground(e, t)) : super._setAsBackground(e, t);
	}
	renderLetter(e) {
		if (e == "-" && this._wa2bignum != 0) {
			if (this._wa2bignum == 1) e = ".";
			else return this.renderWa2MinusChar();
		}
		let t = document.createElement("span"), [m, v] = Ve[e.toLocaleLowerCase()] ?? Ve[" "];
		return t.innerText = e, t.style.setProperty("--x", px(-(this._charWidth * m))), t.style.setProperty("--y", px(-(this._charHeight * v))), t;
	}
	renderWa2MinusChar() {
		let e = document.createElement("span");
		return e.innerText = "-", e.classList.add("minus", "bignum"), e;
	}
	useExternalBitmap() {
		return this._externalBitmap;
	}
	setExternalBitmap(e) {
		this._externalBitmap = e;
	}
}, He = 0, Timer = class extends BaseObject {
	constructor(e) {
		super(), this._delay = 5e3, this._timeout = null, this._onTimer = null, this._uiRoot = e, He += 1, this._id = `timer_${He}`;
	}
	setdelay(e) {
		let t = this.isrunning();
		t && this.stop(), this._delay = e, t && this.start();
	}
	stop() {
		this._timeout != null && (clearTimeout(this._timeout), this._timeout = null);
	}
	start() {
		if (!this._delay) return !1;
		let e = this;
		try {
			return assume(this._delay != null, "Tried to start a timer without a delay"), this.isrunning() && this.stop(), this._timeout = setInterval(() => {
				e.doTimer();
			}, this._delay), !0;
		} catch {
			return !1;
		}
	}
	doTimer() {
		this._onTimer == null ? this._uiRoot.vm.dispatch(this, "ontimer") : this._onTimer();
	}
	ontimer() {
		this._uiRoot.vm.dispatch(this, "ontimer");
	}
	setOnTimer(e) {
		let handler = () => {
			e();
		};
		this._onTimer = handler;
	}
	isrunning() {
		return this._timeout != null;
	}
	getdelay() {
		return this._delay;
	}
	getskipped() {
		return 0;
	}
};
Timer.GUID = "5d0c5bb64b1f7de1168d0fa741199459";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Text.js
function timeToSeconds(e) {
	if (!e) return null;
	let t = e.split(":").map((e) => Number.parseInt(e, 10));
	return t.some((e) => !Number.isFinite(e)) ? null : t.reduce((e, t) => e * 60 + t, 0);
}
var Text = class extends GuiObj {
	constructor(e) {
		super(e), this._displayValue = "", this._altTextTimer = null, this._align = "left", this._valign = "center", this._ticker = "off", this._paddingX = 2, this._timeColonWidth = null, this._timeroffstyle = 0, this._scrollPaused = !1, this._scrollLeft = 0, this._shadowX = 0, this._shadowY = 0, this._drawn = !1, this._onClick = () => {
			this._display.toLowerCase() == "time" && (this._uiRoot.audio.toggleRemainingTime(), this.setDisplayTime());
		}, this._uiRoot = e, this._textWrapper = document.createElement("wrap"), this._div.appendChild(this._textWrapper);
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e.toLowerCase()) {
			case "display":
				this._setDisplay(t);
				break;
			case "text":
			case "default":
				this._text = t, this._renderText();
				break;
			case "bold":
				this._bold = toBool(t), this._prepareCss();
				break;
			case "forceupcase":
			case "forceuppercase":
				this._forceuppercase = toBool(t), this._prepareCss(), this._renderText();
				break;
			case "font":
				this._font_id = t, this._autoDetectFontType(), this.ensureFontSize(), this._prepareCss();
				break;
			case "align":
				this._align = t, this._prepareCss();
				break;
			case "valign":
				this._valign = t, this._prepareCss();
				break;
			case "fontsize":
				this._fontSize = num(t), this.ensureFontSize(), this._invalidateFullWidth(), this._prepareCss();
				break;
			case "color":
				this._color = t, this._prepareCss();
				break;
			case "ticker":
				t == "0" && (t = "off"), this._ticker = t.toLowerCase();
				break;
			case "timecolonwidth":
				this._timeColonWidth = num(t), this._prepareCss(), this._renderText();
				break;
			case "timeroffstyle":
				this._timeroffstyle = num(t), this._setDisplay(this._display);
				break;
			case "shadowcolor":
				this._shadowColor = t, this._prepareCss();
				break;
			case "shadowx":
				this._shadowX = num(t), this._prepareCss();
				break;
			case "shadowy":
				this._shadowY = num(t), this._prepareCss();
				break;
			default: return !1;
		}
		return !0;
	}
	_autoDetectFontType() {
		if (this._font_id && (this._font_obj = this._uiRoot.getFont(this._font_id), !this._font_obj)) {
			let e = new TrueTypeFont();
			e._inlineFamily = this._font_id, this._uiRoot.addFont(e), this._font_obj = e;
		}
	}
	_autoDetectColor() {
		if (this._color) {
			if (this._color.split(",").length == 3) {
				this._div.style.color = `rgb(${this._color})`;
				return;
			}
			let e = this._uiRoot.getColor(this._color);
			e && (this._div.style.color = `var(${e.getCSSVar()}, ${e.getRgb()})`);
		}
	}
	ensureFontSize() {}
	init() {
		super.init(), this._ticker && this._ticker != "off" && this._prepareScrolling(), this._div.addEventListener("click", this._onClick), this._displayHandler != null && this._displayHandler.init();
	}
	_setDisplay(e) {
		if (e != null) {
			switch (this._disposeDisplaySubscription != null && this._disposeDisplaySubscription(), this._disposeTrackChangedSubscription != null && this._disposeTrackChangedSubscription(), this._display = e, this._display.toLowerCase()) {
				case "":
					this._displayValue = "";
					break;
				case "pe_info": {
					let update = () => this.setDisplayValue(this._peInfoText());
					update(), this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", update);
					break;
				}
				case "vid_info":
					this._displayValue = "";
					break;
				case "time":
					this._disposeDisplaySubscription = this._uiRoot.audio.onCurrentTimeChange(() => {
						this.setDisplayTime();
					}), console.log("in changing display = time. by:", e), this.setDisplayTime();
					break;
				case "songlength": {
					let update = () => {
						let e = this._uiRoot.audio.getLength();
						this.setDisplayValue(e > 0 ? integerToTime(e) : "");
					};
					update(), this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", update);
					break;
				}
				case "songname":
				case "songtitle":
					this._displayValue = this._uiRoot.playlist.getCurrentTrackTitle(), this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", () => {
						this._displayValue = this._uiRoot.playlist.getCurrentTrackTitle(), this._renderText();
					});
					break;
				case "songbitrate":
				case "songsamplerate":
				case "songinfo": {
					let e = this._display.toLowerCase(), update = () => {
						let t = this._uiRoot.getSongInfoText();
						e === "songbitrate" ? this.setDisplayValue(/(\d+)kbps/.exec(t)?.[1] ?? "") : e === "songsamplerate" ? this.setDisplayValue(/(\d+)khz/.exec(t)?.[1] ?? "") : this.setDisplayValue(t);
					};
					update(), this._disposeTrackChangedSubscription = this._uiRoot.playlist.on("trackchange", update);
					break;
				}
				case "componentbucket":
					this._displayValue = "componentbucket";
					break;
				case "custom": break;
				default: throw Error(`Unknown text display name: "${this._display}".`);
			}
			this._renderText();
		}
	}
	setDisplayValue(e) {
		e !== this._displayValue && (this._displayValue = e, this._renderText(), this._uiRoot.vm.dispatch(this, "ontextchanged", [{
			type: "STRING",
			value: this.gettext()
		}]));
	}
	setDisplayTime() {
		if (this._uiRoot.audio._isStop) {
			switch (this._timeroffstyle) {
				case 0:
					this.setDisplayValue("  : ");
					break;
				case 1:
					this.setDisplayValue("00:00");
					break;
				case 2: this.setDisplayValue("");
			}
			return;
		}
		this.setDisplayValue(integerToTime(this._uiRoot.audio.getCurrentTime()));
	}
	ontextchanged(e) {
		this._uiRoot.vm.dispatch(this, "ontextchanged", [{
			type: "STRING",
			value: this.gettext()
		}]);
	}
	_interpolateText(e) {
		if (e.toLowerCase() === ":componentname") {
			let t = this.getparentlayout();
			if (t) try {
				return t.getcontainer()._name || e;
			} catch {
				return e;
			}
		}
		return e;
	}
	gettext() {
		if (this._alternateText) return this._alternateText;
		if ((this._text || "").startsWith(":") && this._drawn) {
			let e = this.getparentlayout();
			if (e) return e.getcontainer()._name || this._text;
		}
		return this._display ? this._displayValue : this._text ?? "";
	}
	settext(e) {
		this._text != e && (this._text = e, this._renderText(), this.ontextchanged(this.gettext()));
	}
	_peInfoText() {
		let e = this._uiRoot.playlist, t = e.getnumtracks(), m = 0, v = !1;
		for (let y = 0; y < t; y++) {
			let t = timeToSeconds(e.getlength(y));
			t == null ? v = !0 : m += t;
		}
		let y = e.getcurrentindex();
		return `${integerToTime(y >= 0 ? timeToSeconds(e.getlength(y)) ?? 0 : 0)}/${integerToTime(m)}${v ? "+" : ""}`;
	}
	setalternatetext(e) {
		let t = e ?? "";
		t !== (this._alternateText ?? "") && (this._altTextTimer != null && (clearTimeout(this._altTextTimer), this._altTextTimer = null), this._alternateText = t, this._renderText(), this.ontextchanged(this.gettext()), t && (this._altTextTimer = setTimeout(() => {
			this._altTextTimer = null, this.setalternatetext("");
		}, 1e3)));
	}
	_prepareCss() {
		!this._font_obj && this._font_id && (this._font_obj = this._uiRoot.getFont(this._font_id)), !this._font_obj && !this._font_id && (this._font_obj = this._uiRoot.getFont("Arial") ?? null);
		let e = this._font_obj;
		if (e instanceof BitmapFont) this._textWrapper.setAttribute("font", "BitmapFont"), this._div.style.setProperty("--fontSize", (this._fontSize || "~").toString()), this._align == "center" ? this._div.style.removeProperty("--align") : this._div.style.setProperty("--align", this._align), this._valign == "center" ? this._div.style.removeProperty("--valign") : this._div.style.setProperty("--valign", this._valign == "top" ? "flex-start" : "flex-end"), this._div.style.setProperty("--hspacing", px(e.getHorizontalSpacing())), this.setBackgroundImage(e), this._div.style.backgroundSize = "0", this._div.style.lineHeight = px(this._div.getBoundingClientRect().height), this._div.style.setProperty("--charwidth", px(e._charWidth)), this._div.style.setProperty("--charheight", px(e._charHeight));
		else if (this._autoDetectColor(), this._shadowColor && (this._div.style.textShadow = `${this._shadowX}px ${this._shadowY}px rgb(${this._shadowColor})`), e instanceof TrueTypeFont) this._textWrapper.setAttribute("font", "TrueType"), this._div.style.fontFamily = e.getFontFamily(), this._div.style.fontSize = px(this._fontSize ?? 11), this._div.style.lineHeight = "1", this._div.style.textTransform = this._forceuppercase ? "uppercase" : "none", this._bold && (this._div.style.fontWeight = "bold"), this._align && (this._div.style.textAlign = this._align), this._align && this._align != "center" ? this._div.style.setProperty("--align", this._align) : this._div.style.removeProperty("--align"), this._valign == "center" ? this._div.style.removeProperty("--valign") : this._div.style.setProperty("--valign", this._valign == "top" ? "flex-start" : "flex-end");
		else if (e == null) this._div.style.setProperty("--fontMode", "Null"), this._div.style.fontFamily = "Arial";
		else throw Error("Unexpected font");
	}
	_renderText() {
		this._ticker != "off" && this._invalidateFullWidth();
		let e = this._font_obj;
		e instanceof BitmapFont ? this._renderBitmapFont(e) : this._textWrapper.innerText = this.gettext();
	}
	_useColonWidth() {
		if (this._timeColonWidth == null || this._display == null) return !1;
		switch (this._display.toLowerCase()) {
			case "time":
			case "timeelapsed":
			case "timeremaining": return !0;
		}
		return !1;
	}
	_renderBitmapFont(e) {
		removeAllChildNodes(this._textWrapper), this._div.style.whiteSpace = "nowrap";
		let t = this._useColonWidth();
		if (this.gettext() != null) for (let m of this.gettext().split("")) {
			let v = e.renderLetter(m);
			m === ":" && t && (v.style.width = px(this._timeColonWidth), v.style.marginRight = "0"), this._textWrapper.appendChild(v);
		}
	}
	_renderBitmapFont1(e) {
		this._div.style.whiteSpace = "nowrap";
		let t = "";
		for (let e of this.gettext().split("")) t += `<i>${e}</i>`;
		this._div.innerHTML = t;
	}
	_invalidateFullWidth() {
		let e = this._font_obj;
		this._textFullWidth = e instanceof BitmapFont ? this._getBitmapFontTextWidth(e) : this._getTrueTypeTextWidth(e), this._div.style.setProperty("--full-width", px(this._textFullWidth));
	}
	getautowidth() {
		this._invalidateFullWidth();
		let e = this._textFullWidth;
		return this._relatw == "1" && (e += this._w * -1), e;
	}
	gettextwidth() {
		return this.getautowidth();
	}
	_getBitmapFontTextWidth(e) {
		let t = e._charWidth;
		return this.gettext().length * t;
	}
	_getTrueTypeTextWidth(e) {
		let t = this.gettext();
		this._forceuppercase ? t = t.toUpperCase() : this._forcelowercase && (t = t.toLowerCase());
		let m = e && e.getFontFamily() || "\"Liberation Sans\", \"DejaVu Sans\", Arial", v = document.createElement("canvas").getContext("2d");
		v.font = `${this._bold ? "700" : ""} ${this._fontSize || 11}px ${m}`;
		let y = v.measureText(t);
		return Math.ceil(y.width);
	}
	draw() {
		this._drawn = !0, super.draw(), this._renderText(), this._div.classList.add("webamp--img");
	}
	_prepareScrolling() {
		this._scrollDirection = -1;
		let e = this._scrollTimer = new Timer(this._uiRoot);
		e.setdelay(50), e.setOnTimer(() => {
			this.doScrollText();
		}), e.start();
	}
	doScrollText() {
		let e = this._scrollLeft, t = this._div.getBoundingClientRect(), m = this._textFullWidth;
		if (!(m <= t.width)) {
			var v = e + 1 * this._scrollDirection;
			(v + m < t.width - 20 || v > 20) && (this._scrollDirection *= -1, v = e + 1 * this._scrollDirection), this._scrollLeft = v, v = clamp(v, -(m - t.width), 0), this._textWrapper.style.left = px(Math.round(v));
		}
	}
	dispose() {
		this._altTextTimer != null && (clearTimeout(this._altTextTimer), this._altTextTimer = null), this._disposeDisplaySubscription != null && this._disposeDisplaySubscription(), this._displayHandler != null && this._displayHandler.dispose();
	}
	setDisplayHandler(e) {
		this._displayHandler != null && this._displayHandler.dispose(), this._displayHandler = new e(this);
	}
};
Text.GUID = "efaa867241fa310ea985dcb74bcb5b52";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/menuWa5.js
function getWa5Popup(e, t) {
	["PE_Help", "ML_Help"].includes(e) ? e = "Help" : e.toLowerCase() == "presets" && (e = "EQpresets");
	let m = `POPUP "${e}"`, v = Ue.includes(m) ? Ue : We.includes(m) ? We : Ge, y = getPopupJson(e, v, t);
	return console.log("FOUND", e, y), y;
}
function getPopupJson(e, t, m) {
	let v, y = null, x = [], S = !1;
	for (let C of t.split("\n")) {
		if (C = C.trim(), !S && !C.startsWith("POPUP") || !C || C.startsWith("//")) continue;
		let t = C.match(/\s*(POPUP|MENUITEM)\s+(SEPARATOR|"([^"]*)")(?:\s*,\s*(\w+)[\s,]*(.*))?/i);
		if (t) {
			let [, C, w, E, O, k] = t, ee = C == "POPUP" ? "popup" : w == "SEPARATOR" || (k || "").indexOf("MFT_SEPARATOR") >= 0 ? "separator" : "menuitem", I = parseInt(O);
			if (!S) {
				if (ee == "popup" && E == e) S = !0;
				else continue;
			}
			k ||= "";
			let z = { type: ee };
			switch (z.type) {
				case "popup":
					let e = new PopupMenu(m);
					y ? y.addsubmenu(e, E) : v = e, y = e, x.push(y), z.popup = y, z.caption = E, k.indexOf("GRAYED") >= 0 && (z.disabled = !0);
					break;
				case "menuitem":
					z.caption = E, z.id = I, z.disabled = k.indexOf("GRAYED") >= 0, y.addcommand(E, I, !1, z.disabled);
					break;
				case "separator": y.addseparator();
			}
		} else if (["}", "END"].includes(C.trim()) && S) {
			if (y == v) break;
			x.pop(), y = x[x.length - 1];
		}
	}
	return v;
}
var Ue = "256 MENUEX\nLANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\n{\n  POPUP \"File\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"Play &file...   	L\", 40029, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Play &URL...	Ctrl+L\", 40185, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Play &folder...	Shift+L\", 40187, MFT_STRING, MFS_ENABLED\n    POPUP \"Play &bookmark\", 65535, MFT_STRING, MFS_ENABLED, 0\n    {\n      MENUITEM \"&Edit bookmarks...	Ctrl+Alt+I\", 40320, MFT_STRING, MFS_ENABLED\n      MENUITEM \"&Add current as bookmark	Ctrl+Alt+B\", 40321, MFT_STRING, MFS_ENABLED\n      MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    }\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"Open &playlist	Ctrl+O\", 40202, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Save playlist	Ctrl+S\", 40204, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Add media to Library...\", 40344, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Add current playlist to Library\", 40466, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&View file info...	Alt+3\", 40188, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"E&xit	Alt+F4\", 40001, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"Play\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"P&revious	Z\", 40044, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Play	X\", 40045, MFT_STRING, MFS_ENABLED\n    MENUITEM \"P&ause	C\", 40046, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Stop	V\", 40047, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Next              	B\", 40048, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    POPUP \"&Advanced Playback\", 65535, MFT_STRING, MFS_ENABLED, 0\n    {\n      MENUITEM \"&Start of list	Ctrl+Z\", 40154, MFT_STRING, MFS_ENABLED\n      MENUITEM \"Stop w/ fa&deout	Shift+V\", 40147, MFT_STRING, MFS_ENABLED\n      MENUITEM \"Stop after &current	Ctrl+V\", 40157, MFT_STRING, MFS_ENABLED\n    }\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    POPUP \"&Jump to\", 65535, MFT_STRING, MFS_ENABLED, 0\n    {\n      MENUITEM \"Ju&mp to track	J\", 40194, MFT_STRING, MFS_ENABLED\n      MENUITEM \"Jump 10 t&racks back	Num. 1\", 40197, MFT_STRING, MFS_ENABLED\n      MENUITEM \"Jump 10 &tracks fwd	Num. 3\", 40195, MFT_STRING, MFS_ENABLED\n      MENUITEM \"&Jump to time	Ctrl+J\", 40193, MFT_STRING, MFS_ENABLED\n      MENUITEM \"&Start of list	Ctrl+Z\", 40154, MFT_STRING, MFS_ENABLED\n      MENUITEM \"&End of list	Ctrl+B\", 40158, MFT_STRING, MFS_ENABLED\n    }\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Back 5 seconds	Left\", 40144, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Fwd 5 seconds	Right\", 40148, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Repeat	R\", 40022, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Shuffle	S\", 40023, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"Volume &Up	Up\", 40351, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Volume &Down	Down\", 40352, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"Options\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    POPUP \"&Skins\", 65535, MFT_STRING, MFS_ENABLED, 0\n    {\n      MENUITEM \"S&kin Browser...	Alt+S\", 40219, MFT_STRING, MFS_ENABLED\n      MENUITEM \"<< Get more skins! >>\", 40316, MFT_STRING, MFS_ENABLED\n      MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n      MENUITEM \"Winamp Classic\", 32767, MFT_STRING, MFS_ENABLED\n    }\n    POPUP \"&Visualization\", 65535, MFT_STRING, MFS_ENABLED, 0\n    {\n      MENUITEM \"Start/Stop &plug-in	Ctrl+Shift+K\", 40192, MFT_STRING, MFS_ENABLED\n      MENUITEM \"&Configure plug-in... 	Alt+K\", 40221, MFT_STRING, MFS_ENABLED\n      MENUITEM \"&Select plug-in...	Ctrl+K\", 40191, MFT_STRING, MFS_ENABLED\n    }\n    POPUP \"&Equalizer\", 65535, MFT_STRING, MFS_ENABLED, 0\n    {\n      MENUITEM \"&EQ enabled\", 40244, MFT_STRING, MFS_ENABLED\n      POPUP \"&Load Preset\", 65535, MFT_STRING, MFS_ENABLED, 0\n      {\n        MENUITEM \"&Preset...\", 40172, MFT_STRING, MFS_ENABLED\n        MENUITEM \"&Auto-load preset...\", 40173, MFT_STRING, MFS_ENABLED\n        MENUITEM \"&Default\", 40174, MFT_STRING, MFS_ENABLED\n        MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n        MENUITEM \"From &EQF...\", 40253, MFT_STRING, MFS_ENABLED\n      }\n      POPUP \"&Save Preset\", 65535, MFT_STRING, MFS_ENABLED, 0\n      {\n        MENUITEM \"&Preset...\", 40175, MFT_STRING, MFS_ENABLED\n        MENUITEM \"&Auto-load preset...\", 40176, MFT_STRING, MFS_ENABLED\n        MENUITEM \"&Default\", 40177, MFT_STRING, MFS_ENABLED\n        MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n        MENUITEM \"To &EQF...\", 40254, MFT_STRING, MFS_ENABLED\n      }\n      POPUP \"&Delete Preset\", 65535, MFT_STRING, MFS_ENABLED, 0\n      {\n        MENUITEM \"&Preset...\", 40178, MFT_STRING, MFS_ENABLED\n        MENUITEM \"&Auto-load preset...\", 40180, MFT_STRING, MFS_ENABLED\n      }\n    }\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Time elapsed	Alt+T toggles\", 40037, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Time re&maining	Alt+T toggles\", 40038, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Time remaining toggle	Alt+T\", 40039, MFT_STRING, WEBAMP_HIDDEN\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Always On Top	Ctrl+A\", 40019, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Double Size	Ctrl+D\", 40165, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Preferences...    	Ctrl+P\", 40012, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"Windows\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"Playlist &Editor	Alt+E\", 40040, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Video	Alt+V\", 40328, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Visualizations	Ctrl+Shift+K\", 40192, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"Help\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"Winamp Help	F1\", 40347, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Send &Feedback\", 40464, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Register Winamp Pro\", 40394, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"About &Winamp...\", 40041, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"PE_File\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"&New playlist (clear)	Ctrl+N\", 40214, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Open playlist	Ctrl+O\", 40202, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Add file(s)	L\", 1032, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Add &folder	Shift+L\", 1036, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Add UR&L	Ctrl+L\", 1039, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Save playlist	Ctrl+S\", 40204, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"File &info	Alt+3\", 40188, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Playlist &entry	Ctrl+E\", 40255, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Close playlist editor	Alt+E\", 40224, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"PE_Playlist\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"Select &all	Ctrl+Alt+A\", 40205, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Select &none\", 40207, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Invert selection	Ctrl+I\", 40171, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Remove selected	Delete\", 1034, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Crop selected	Ctrl+Delete\", 1035, MFT_STRING, MFS_ENABLED\n    MENUITEM \"C&lear playlist	Ctrl+Shift+Delete\", 40214, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"Remove &missing files from playlist	Alt+Delete\", 40222, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Physically remove selected file(s)\", 40223, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"Playlist pre&ferences...\", 40358, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"PE_Sort\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"Sort list by &title	Ctrl+Shift+1\", 40209, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Sort list by &filename	Ctrl+Shift+2\", 40210, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Sort list by &path and filename	Ctrl+Shift+3\", 40211, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"R&everse list	Ctrl+R\", 40213, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Randomize list	Ctrl+Shift+R\", 40212, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"ML_File\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"&New playlist	Shift+Ins\", 40359, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Import &current playlist\", 40374, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Import playlist from file\", 40360, MFT_STRING, MFS_ENABLED\n    MENUITEM \"&Export playlist\", 40361, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Add media to Library...\", 40344, MFT_STRING, MFS_ENABLED\n    MENUITEM \"Add current playlist to Library\", 40466, MFT_STRING, MFS_ENABLED\n    MENUITEM \"\", 0, MFT_SEPARATOR, MFS_ENABLED\n    MENUITEM \"&Close Media Library	Alt+L\", 40380, MFT_STRING, MFS_ENABLED\n  }\n  POPUP \"ML_View\", 65535, MFT_STRING, MFS_ENABLED, 0\n  {\n    MENUITEM \"Media Library &Preferences...\", 40372, MFT_STRING | MFT_RIGHTJUSTIFY, MFS_ENABLED\n  }\n}\n", We = "101 MENU\nLANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\n{\n  POPUP \"Main\"\n  {\n    MENUITEM \"Nullsoft &Winamp...\",  40041\n    MENUITEM SEPARATOR\n    POPUP \"&Play\"\n    {\n      MENUITEM \"&File...   	L\",  40029\n      MENUITEM \"&URL...	Ctrl+L\",  40185\n      MENUITEM \"&Folder...	Shift+L\",  40187\n      MENUITEM SEPARATOR\n      POPUP \"&Bookmark\"\n      {\n        MENUITEM \"(no bookmarks)\",  40322,  INACTIVE\n      }\n    }\n    MENUITEM \"View &file info...	Alt+3\",  40188\n    POPUP \"&Bookmarks\"\n    {\n      MENUITEM \"&Edit bookmarks...	Ctrl+Alt+I\",  40320\n      MENUITEM \"&Add current as bookmark	Ctrl+Alt+B\",  40321\n      MENUITEM SEPARATOR\n    }\n    MENUITEM SEPARATOR\n    MENUITEM \"&Main Window	Alt+W\",  40258\n    MENUITEM \"Playlist &Editor	Alt+E\",  40040\n    MENUITEM \"E&qualizer     	Alt+G\",  40036\n    MENUITEM \"&Video	Alt+V\",  40328\n    MENUITEM SEPARATOR\n    POPUP \"&Options\"\n    {\n      MENUITEM \"&Preferences...    	Ctrl+P\",  40012\n      POPUP \"Skins\"\n      {\n        MENUITEM \"S&kin Browser...	Alt+S\",  40219\n        MENUITEM \"<< Get more skins! >>\",  40316\n        MENUITEM SEPARATOR\n        MENUITEM \"Winamp Classic\",  32767\n      }\n      MENUITEM SEPARATOR\n      MENUITEM \"Time &elapsed	Ctrl+T toggles\",  40037\n      MENUITEM \"Time re&maining	Ctrl+T toggles\",  40038\n      MENUITEM SEPARATOR\n      MENUITEM \"&Always On Top	Ctrl+A\",  40019\n      MENUITEM \"&Double Size	Ctrl+D\",  40165\n      MENUITEM \"&EasyMove	Ctrl+E\",  40186\n      MENUITEM SEPARATOR\n      MENUITEM \"&Repeat	R\",  40022\n      MENUITEM \"&Shuffle	S\",  40023\n    }\n    POPUP \"Play&back\"\n    {\n      MENUITEM \"P&revious	Z\",  40044\n      MENUITEM \"&Play	X\",  40045\n      MENUITEM \"P&ause	C\",  40046\n      MENUITEM \"&Stop	V\",  40047\n      MENUITEM \"&Next              	B\",  40048\n      MENUITEM SEPARATOR\n      MENUITEM \"Stop w/ fa&deout	Shift+V\",  40147\n      MENUITEM \"Stop after &current	Ctrl+V\",  40157\n      MENUITEM \"&Back 5 seconds	Left\",  40144\n      MENUITEM \"&Fwd 5 seconds	Right\",  40148\n      MENUITEM \"&Start of list	Ctrl+Z\",  40154\n      MENUITEM \"&End of list	Ctrl+B\",  40158\n      MENUITEM \"10 t&racks back	Num. 1\",  40197\n      MENUITEM \"10 &tracks fwd	Num. 3\",  40195\n      MENUITEM SEPARATOR\n      MENUITEM \"&Jump to time	Ctrl+J\",  40193\n      MENUITEM \"Ju&mp to file	J\",  40194\n    }\n    POPUP \"&Visualization\"\n    {\n      MENUITEM \"Start/Stop &plug-in	Ctrl+Shift+K\",  40192\n      MENUITEM \"&Configure plug-in... 	Alt+K\",  40221\n      MENUITEM \"&Select plug-in...	Ctrl+K\",  40191\n    }\n    POPUP \"&Skins\"\n    {\n      MENUITEM \"S&kin Browser...	Alt+S\",  40219\n      MENUITEM \"<< Get more skins! >>\",  40316\n      MENUITEM SEPARATOR\n      MENUITEM \"Winamp Classic\",  32767\n    }\n    MENUITEM SEPARATOR\n    MENUITEM \"Winamp &Help	F1\",  40347\n    MENUITEM SEPARATOR\n    MENUITEM \"E&xit	Alt+F4\",  40001\n  }\n  POPUP \"EQpresets\"\n  {\n    POPUP \"Load\"\n    {\n      MENUITEM \"&Preset...\",  40172\n      MENUITEM \"&Auto-load preset...\",  40173\n      MENUITEM \"&Default\",  40174\n      MENUITEM SEPARATOR\n      MENUITEM \"From &EQF...\",  40253\n    }\n    POPUP \"Save\"\n    {\n      MENUITEM \"&Preset...\",  40175\n      MENUITEM \"&Auto-load preset...\",  40176\n      MENUITEM \"&Default\",  40177\n      MENUITEM SEPARATOR\n      MENUITEM \"To &EQF...\",  40254\n    }\n    POPUP \"Delete\"\n    {\n      MENUITEM \"&Preset...\",  40178\n      MENUITEM \"&Auto-load preset...\",  40180\n    }\n  }\n  POPUP \"PLContextMenu\"\n  {\n    POPUP \"MiscOpt\"\n    {\n      POPUP \"File info\"\n      {\n        MENUITEM \"F&ile info...	Alt+3\",  40208\n        MENUITEM \"Playlist &entry...	Ctrl+E\",  40255\n      }\n      POPUP \"Sort\"\n      {\n        MENUITEM \"Sort list by &title	Ctrl+Shift+1\",  40209\n        MENUITEM \"Sort list by &filename	Ctrl+Shift+2\",  40210\n        MENUITEM \"Sort list by &path and filename	Ctrl+Shift+3\",  40211\n        MENUITEM SEPARATOR\n        MENUITEM \"R&everse list	Ctrl+R\",  40213\n        MENUITEM \"&Randomize list	Ctrl+Shift+R\",  40212\n      }\n      POPUP \"Misc\"\n      {\n        MENUITEM \"&Generate HTML playlist	Ctrl+Alt+G\",  40292\n        MENUITEM SEPARATOR\n        MENUITEM \"&Read extended info on selection	Ctrl+Alt+E\",  40293\n      }\n    }\n    POPUP \"Add\"\n    {\n      MENUITEM \"Add &file(s)	L\",  1032\n      MENUITEM \"Add f&older	Shift+L\",  1036\n      MENUITEM \"Add &URL	Ctrl+L\",  1039\n    }\n    POPUP \"Remove\"\n    {\n      MENUITEM \"&Remove selected	Delete\",  1034\n      MENUITEM \"Crop &selected	Ctrl+Delete\",  1035\n      MENUITEM \"&Clear playlist	Ctrl+Shift+Delete\",  40214\n      POPUP \"Remove...\"\n      {\n        MENUITEM \"Remove &missing files from playlist	Alt+Delete\",  40222\n        MENUITEM \"&Physically remove selected file(s)\",  40223\n      }\n    }\n    POPUP \"Select\"\n    {\n      MENUITEM \"Select &all	Ctrl+A\",  40205\n      MENUITEM \"Select &none\",  40207\n      MENUITEM \"&Invert selection	Ctrl+I\",  40171\n    }\n    POPUP \"Playlist\"\n    {\n      MENUITEM \"&Open playlist...	Ctrl+O\",  40202\n      MENUITEM \"&Save playlist...	Ctrl+S\",  40204\n      MENUITEM \"&New playlist (clear)	Ctrl+N\",  40214\n    }\n    POPUP \"Context\"\n    {\n      MENUITEM \"&Play item(s)	Enter\",  40184\n      MENUITEM SEPARATOR\n      MENUITEM \"&Remove item(s)	Delete\",  1034\n      MENUITEM \"&Crop files	Ctrl+Delete\",  1035\n      MENUITEM SEPARATOR\n      MENUITEM \"Edit &metadata for selection...	Shift+E\",  40470\n      MENUITEM \"&View file info...	Alt+3\",  40208\n      MENUITEM \"Playlist &entry	Ctrl+E\",  40255\n      MENUITEM \"&Bookmark item(s)	Ctrl+Alt+B\",  40319\n      MENUITEM SEPARATOR\n      POPUP \"Rate &items\"\n      {\n        MENUITEM \"*****\",  40402\n        MENUITEM \"****\",  40403\n        MENUITEM \"***\",  40404\n        MENUITEM \"**\",  40405\n        MENUITEM \"*\",  40406\n        MENUITEM \"No rating\",  40407\n      }\n      MENUITEM SEPARATOR\n      MENUITEM \"Explore item(s) &folder	Ctrl+F\",  40468\n    }\n  }\n  POPUP \"Context menus\"\n  {\n    POPUP \"Song title\"\n    {\n      MENUITEM \"View &file info...	Alt+3 or Dblclick\",  40188\n      MENUITEM \"&Jump to file...	J\",  40194\n      MENUITEM \"Jump to &time...	Ctrl+J\",  40193\n      MENUITEM \"&Autoscroll songname\",  40189\n      MENUITEM SEPARATOR\n      POPUP \"&Rating\"\n      {\n        MENUITEM \"*****\",  40396\n        MENUITEM \"****\",  40397\n        MENUITEM \"***\",  40398\n        MENUITEM \"**\",  40399\n        MENUITEM \"*\",  40400\n        MENUITEM \"No rating\",  40401\n      }\n    }\n    POPUP \"Time display\"\n    {\n      MENUITEM \"Time &elapsed	Ctrl+T toggles\",  40037\n      MENUITEM \"Time re&maining	Ctrl+T toggles\",  40038\n    }\n    POPUP \"Previous button\"\n    {\n      MENUITEM \"&Previous	Click\",  40044\n      MENUITEM \"&Start of list	Ctrl+Click\",  40154\n      MENUITEM \"&Rewind 5 seconds	Shift+Click\",  40144\n    }\n    POPUP \"Play Button\"\n    {\n      MENUITEM \"&Play/restart	Click\",  40045\n      MENUITEM \"Open &URL...	Ctrl+Click\",  40155\n      MENUITEM \"Open &file...	Shift+Click\",  40145\n    }\n    POPUP \"Pause button\"\n    {\n      MENUITEM \"&Pause/Unpause	Click\",  40046\n    }\n    POPUP \"Stop button\"\n    {\n      MENUITEM \"&Stop	Click\",  40047\n      MENUITEM \"Stop w/&fadeout	Shift+Click\",  40147\n      MENUITEM \"Stop after &current	Ctrl+Click\",  40157\n    }\n    POPUP \"Next button\"\n    {\n      MENUITEM \"&Next	Click\",  40048\n      MENUITEM \"&Fastforward 5 seconds	Shift+Click\",  40148\n      MENUITEM \"&End of list	Ctrl+Click\",  40158\n    }\n    POPUP \"Eject button\"\n    {\n      MENUITEM \"Open &file...	Click\",  40029\n      MENUITEM \"Open f&older...	Shift+Click\",  40187\n      MENUITEM \"Open &URL...	Ctrl+Click\",  40185\n    }\n    POPUP \"Seek bar\"\n    {\n      MENUITEM \"&Jump to time	Ctrl+J\",  40193\n      MENUITEM \"&Rewind 5 seconds	Left Arrow\",  40061\n      MENUITEM \"&Forward 5 seconds	Right Arrow\",  40060\n    }\n    POPUP \"Shuffle\"\n    {\n      MENUITEM \"&Shuffle	S\",  40023\n    }\n    POPUP \"Repeat\"\n    {\n      MENUITEM \"&Repeat	R\",  40022\n      MENUITEM \"&Manual Playlist Advance	Shift+R\",  40395\n    }\n    POPUP \"EQ button\"\n    {\n      MENUITEM \"Graphical E&qualizer	Alt+G\",  40036\n    }\n    POPUP \"PE button\"\n    {\n      MENUITEM \"Playlist &Editor	Alt+E\",  40040\n    }\n    POPUP \"VideoWnd\"\n    {\n      MENUITEM \"&Fullscreen	Alt+Enter\",  40329\n      MENUITEM SEPARATOR\n      MENUITEM \"&Normal size	1\",  40330\n      MENUITEM \"&Half size	&tilde; or 3\",  40332\n      MENUITEM \"&Double size	2\",  40331\n      MENUITEM SEPARATOR\n      MENUITEM \"Vertically &flip	Shift+F\",  40465\n      MENUITEM SEPARATOR\n      POPUP \"&Audio track\"\n      {\n        MENUITEM \"Track 1\",  40408\n      }\n      POPUP \"&Video track\"\n      {\n        MENUITEM \"Track 1\",  40424\n      }\n      MENUITEM SEPARATOR\n      MENUITEM \"Video &options...\",  40333\n    }\n  }\n  POPUP \"EQContext\"\n  {\n    POPUP \"enbut\"\n    {\n      MENUITEM \"&EQ enabled	N\",  40244\n    }\n    POPUP \"albut\"\n    {\n      MENUITEM \"&EQ autoloading enabled	A\",  40245\n    }\n  }\n  POPUP \"Prefs\"\n  {\n    POPUP \"Skin\"\n    {\n      MENUITEM \"&Switch to skin\",  40386\n      MENUITEM SEPARATOR\n\n      MENUITEM \"&Rename skin...\",  40388\n      MENUITEM \"&Delete skin...\",  40387\n    }\n    POPUP \"Lang\"\n    {\n      MENUITEM \"&Switch to language pack\",  40458\n      MENUITEM SEPARATOR\n      MENUITEM \"&Rename language pack...\",  40459\n      MENUITEM \"&Delete language pack...\",  40460\n    }\n  }\n}\n", Ge = "1281 MENU\nLANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\n{\n  POPUP \"ControlMenu\"\n  {\n    POPUP \"&Opacity\"\n    {\n      MENUITEM \"1&00%\",  42211\n      MENUITEM \"&90%\",  42210\n      MENUITEM \"&80%\",  42209\n      MENUITEM \"&70%\",  42208\n      MENUITEM \"&60%\",  42207\n      MENUITEM \"&50%\",  42206\n      MENUITEM \"&40%\",  42205\n      MENUITEM \"&30%\",  42204\n      MENUITEM \"&20%\",  42203\n      MENUITEM \"&10%\",  42202\n      MENUITEM \"&Custom\",  42227\n      MENUITEM SEPARATOR\n      MENUITEM \"Opaque on &Focus\",  42228\n      MENUITEM \"Opaque on &Hover\",  42226\n    }\n    POPUP \"&Scaling\"\n    {\n      MENUITEM \"&50%\",  42214\n      MENUITEM \"&75%\",  42215\n      MENUITEM \"&100%\",  42216\n      MENUITEM \"150%\",  42222\n      MENUITEM \"&200%\",  42217\n      MENUITEM \"250%\",  42218\n      MENUITEM \"&300%\",  42219\n      MENUITEM \"&Custom\",  42224\n      MENUITEM SEPARATOR\n      MENUITEM \"&Locked\",  42223\n      MENUITEM \"&Temporary\",  42225\n    }\n    POPUP \"Docked Toolbar\", 65535, MFT_STRING, MFS_GRAYED, 0\n    {\n      MENUITEM \"Auto-&Hide\",  42235\n      MENUITEM \"&Always On Top\",  42234\n      MENUITEM SEPARATOR\n      MENUITEM \"Top\",  42229\n      MENUITEM \"Left\",  42236\n      MENUITEM \"Right\",  42231\n      MENUITEM \"Bottom\",  42232\n      MENUITEM \"Not docked\",  42233\n      MENUITEM SEPARATOR\n      MENUITEM \"Dock/Undock Windows by Dragging\",  42237\n    }\n  }\n}", Ke = "", Menu = class extends Fe {
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m.toLowerCase()) {
			case "normal":
				this.setnormalid(t);
				break;
			case "hover":
				this.sethoverid(t);
				break;
			case "down":
				this.setdownid(t);
				break;
			case "next":
				this._nextMenuId = t.toLowerCase();
				break;
			case "prev":
				this._prevMenuId = t.toLowerCase();
				break;
			case "menu":
				this.setmenu(t);
				break;
			case "menugroup":
				this.setmenugroup(t);
				break;
			default: return !1;
		}
		return !0;
	}
	getmenu() {
		return this._menuId;
	}
	setmenu(e) {
		this._menuId = e;
	}
	getmenugroup() {
		return this._menuGroupId;
	}
	setmenugroup(e) {
		this._menuGroupId = e;
	}
	setnormalid(e) {
		this._normalId = e.toLowerCase();
	}
	setdownid(e) {
		this._downId = e.toLowerCase();
	}
	sethoverid(e) {
		this._hoverId = e.toLowerCase();
	}
	_showButton(e) {
		for (let t of [
			this._elNormal,
			this._elHover,
			this._elDown
		]) t && (t == e ? t.show() : t.hide());
	}
	_setButtonWidth(e) {
		for (let t of [
			this._elNormal,
			this._elHover,
			this._elDown
		]) t && t.setXmlAttr("w", e);
	}
	doClosePopup() {
		this._showButton(this._elNormal), this._div.classList.remove("open"), this._placePopup(!1);
	}
	onLeftButtonDown(e, t) {
		Ke == this._menuGroupId ? (Ke = null, destroyActivePopup()) : (Ke = this._menuGroupId, destroyActivePopup(), setActivePopup(this)), this.onEnterArea();
	}
	onEnterArea() {
		Ke == this._menuGroupId ? (destroyActivePopup(), this._showButton(this._elDown), this._div.classList.add("open"), this._placePopup(!0), setActivePopup(this)) : this._showButton(this._elHover);
	}
	onLeaveArea() {
		Ke != this._menuGroupId && this._showButton(this._elNormal);
	}
	setup() {
		super.setup(), this.getparentlayout().registerShortcuts(this._popup);
	}
	resolveButtonsAction() {
		for (let e of this.getparent()._children) if (e._id == this._normalId) this._elNormal = e;
		else if (e._id == this._hoverId) this._elHover = e;
		else if (e._id == this._downId) this._elDown = e;
		else if (e instanceof Layer && e._image && !this._w) {
			this._elImage = e, this.setXmlAttr("relatw", "0");
			let t = this._elImage.getwidth().toString();
			this.setXmlAttr("w", t), this._setButtonWidth(t);
		}
	}
	draw() {
		if (this.resolveButtonsAction(), super.draw(), this._div.style.pointerEvents = "all", this._menuId.startsWith("WA5:")) {
			let [, e] = this._menuId.split(":");
			this._popup = getWa5Popup(e, this._uiRoot), this.invalidatePopup();
		}
	}
	invalidatePopup() {
		let e = this;
		if (this._popup) {
			this._popupDiv && this._popupDiv.remove(), updateActions(this._popup, this._uiRoot);
			let menuItemClick = (t) => {
				console.log("menu clicked:", t), findAction(t).onExecute(e._uiRoot) && e.invalidatePopup();
			};
			this._popupDiv = generatePopupDiv(this._popup, menuItemClick), this._popupDiv.classList.add("popup"), popupLayer().appendChild(this._popupDiv), this._placePopup(this._div.classList.contains("open"));
		}
	}
	_placePopup(e) {
		let t = this._popupDiv;
		if (!t) return;
		if (!e) {
			t.style.display = "none";
			return;
		}
		let m = this._div.getBoundingClientRect();
		t.style.display = "block", t.style.left = px(m.left + window.scrollX), t.style.top = px(m.bottom + window.scrollY);
	}
};
Menu.GUID = "73c00594401b961f24671b9b6541ac27";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Frame.js
var Frame = class extends Fe {
	constructor() {
		super(...arguments), this._position = 0, this._orientation = "h", this._resizable = !0;
	}
	getElTag() {
		return "frame2";
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m.toLowerCase()) {
			case "width":
				this._position = num(t);
				break;
			case "height":
				this._position = num(t);
				break;
			case "minwidth":
				this._minwidth = num(t) || 0;
				break;
			case "maxwidth":
				this._maxwidth = num(t) || 0;
				break;
			case "orientation":
				this._orientation = t.toLowerCase()[0];
				break;
			case "from":
				this.setFrom(t.toLowerCase()[0]);
				break;
			case "left":
				this._leftId = t.toLowerCase();
				break;
			case "right":
				this._rightId = t.toLowerCase();
				break;
			case "top":
				this._topId = t.toLowerCase();
				break;
			case "bottom":
				this._bottomId = t.toLowerCase();
				break;
			default: return !1;
		}
		return !0;
	}
	getposition() {
		return this._position;
	}
	setposition(e) {
		this._position = e, this.alignChildren();
	}
	setFrom(e) {
		let t = {
			l: "left",
			r: "right",
			b: "bottom",
			t: "top"
		};
		this._from = t[e];
	}
	init() {
		super.init();
	}
	_getEl(e) {
		let t = [this.findobject(this[`_${e[0]}Id`]), this.findobject(this[`_${e[1]}Id`])];
		return assume(t[0] != null, "Frame." + e[0] + " NOT FOUND!"), assume(t[1] != null, "Frame." + e[1] + " NOT FOUND!"), t;
	}
	alignChildren() {
		this.getDiv().style.setProperty("--position", `${this._position}`), this._width = this._position, this._height = this._position, console.log("FRAME:" + this._id, this);
		let e = this._orientation == "v" ? {
			h: "0",
			relath: "1"
		} : {
			w: "0",
			relatw: "1"
		};
		if (this._from == "left") {
			let [t, m] = this._getEl(["left", "right"]);
			t.setXmlAttributes({
				...e,
				w: `${this._width - 4}`
			}), m.setXmlAttributes({
				...e,
				x: `${this._width + 4}`,
				w: `-${this._width + 4}`,
				relatw: "1"
			});
		} else if (this._from == "right") {
			let [t, m] = this._getEl(["left", "right"]);
			t.setXmlAttributes({
				...e,
				w: `-${this._width + 4}`,
				relatw: "1"
			}), m.setXmlAttributes({
				...e,
				x: `-${this._width - 4}`,
				relatx: "1",
				w: `${this._width - 8}`
			});
		} else if (this._from == "bottom") {
			let [t, m] = this._getEl(["top", "bottom"]);
			t.setXmlAttributes({
				...e,
				h: `-${this._height + 4}`,
				relath: "1"
			}), m.setXmlAttributes({
				...e,
				y: `-${this._height - 4}`,
				relaty: "1",
				h: `${this._height - 8}`
			});
		} else console.log("frame not implemented: from=", this._from);
	}
	draw() {
		this.alignChildren(), super.draw();
	}
};
Frame.GUID = "e2bbc14d417384f6ebb2b3bd5055662f";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Slider.js
var ActionHandler = class {
	constructor(e) {
		this._subscription = () => {}, this._slider = e, this._uiRoot = e._uiRoot;
	}
	onsetposition(e) {}
	onLeftMouseDown(e, t) {}
	onLeftMouseUp(e, t) {}
	onMouseMove(e, t) {
		this._slider._setPositionXY(e, t);
	}
	onFreeMouseMove(e, t) {}
	dispose() {
		this._subscription();
	}
}, Slider = class extends GuiObj {
	constructor() {
		super(...arguments), this._vertical = !1, this._action = null, this._low = 0, this._high = 255, this._thumbWidth = 0, this._thumbHeight = 0, this._thumbLeft = 0, this._thumbTop = 0, this._position = 0, this._param = null, this._mouseDx = 0, this._mouseDy = 0;
	}
	_getActualSize() {
		let e = {
			width: this._div.offsetWidth,
			height: this._div.offsetHeight
		};
		return (!this.getguirelatw() || !e.width) && (e.width = this.getwidth()), (!this.getguirelath() || !e.height) && (e.height = this.getheight()), e;
	}
	_getScreenScale() {
		let e = this._div.offsetWidth;
		return e ? this._div.getBoundingClientRect().width / e : 1;
	}
	_setPositionXY(e, t) {
		this._vertical ? t = t - this._thumbHeight / 2 - this._mouseDy : e = e - this._thumbWidth / 2 - this._mouseDx;
		let m = this._getActualSize(), v = m.width - this._thumbWidth, y = m.height - this._thumbHeight, x = this._vertical ? (y - t) / y : e / v;
		this._position = clamp(x, 0, 1), this._renderThumbPosition(), this.doSetPosition(this.getposition());
	}
	_checkMouseDownInThumb(e, t) {
		if (this._vertical) {
			let e = t - parseInt(this._div.style.getPropertyValue("--thumb-top"));
			this._mouseDy = e >= 0 && e <= this._thumbHeight ? e - this._thumbHeight / 2 : 0;
		} else {
			let t = e - parseInt(this._div.style.getPropertyValue("--thumb-left"));
			this._mouseDx = t >= 0 && t <= this._thumbWidth ? t - this._thumbWidth / 2 : 0;
		}
	}
	_registerDragEvents() {
		this._div.addEventListener("mousedown", (e) => {
			if (e.stopPropagation(), e.button != 0) return;
			let t = e.clientX, m = e.clientY, v = this._eventToLocal(e), y = v.x, x = v.y, S = this._getScreenScale();
			this._checkMouseDownInThumb(y, x), this.doLeftMouseDown(y, x);
			let handleMove = (e) => {
				e.stopPropagation();
				let v = e.clientX, C = e.clientY, w = (v - t) / S, E = (C - m) / S;
				this.doMouseMove(y + w, x + E);
			}, C = throttle(handleMove, 50), handleMouseUp = (e) => {
				if (e.stopPropagation(), e.button != 0) return;
				document.removeEventListener("mousemove", C), document.removeEventListener("mouseup", handleMouseUp);
				let t = this._eventToLocal(e);
				this.doLeftMouseUp(t.x, t.y);
			};
			document.addEventListener("mousemove", C), document.addEventListener("mouseup", handleMouseUp);
		}), this._div.addEventListener("mousemove", (e) => {
			let t = this._eventToLocal(e);
			this.doFreeMouseMove(t.x, t.y);
		});
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return m == "action" && this._setAction(t), !0;
		switch (m.toLowerCase()) {
			case "thumb":
				this._thumb = t;
				let e = this._uiRoot.getBitmap(this._thumb);
				e && (this._thumbWidth = e.getWidth(), this._thumbHeight = e.getHeight());
				break;
			case "downthumb":
				this._downThumb = t;
				break;
			case "hoverthumb":
				this._hoverThumb = t;
				break;
			case "barmiddle":
				this._barMiddle = t;
				break;
			case "barleft":
				this._barLeft = t;
				break;
			case "barright":
				this._barRight = t;
				break;
			case "orientation":
				let m = t.toLowerCase();
				this._vertical = m === "v" || m === "vertical";
				break;
			case "low":
				this._low = num(t);
				break;
			case "high":
				this._high = num(t);
				break;
			case "action":
				this._setAction(t);
				break;
			case "param":
				this._param = t;
				break;
			default: return !1;
		}
		return !0;
	}
	init() {
		super.init(), this._initializeActionHandler(), this._registerDragEvents();
	}
	_initializeActionHandler() {
		let e = this._actionHandler;
		switch (this._action) {
			case "seek":
				this._actionHandler = new SeekActionHandler(this);
				break;
			case "eq_band":
				this._low === 0 && this._high === 255 && (this._low = -127, this._high = 127), this._actionHandler = this._param == "preamp" ? new PreampActionHandler(this, this._param) : new EqActionHandler(this, this._param);
				break;
			case "eq_preamp": break;
			case "pan":
				this._low === 0 && this._high === 255 && (this._high = 254), this._actionHandler = new PanActionHandler(this);
				break;
			case "volume":
				this._actionHandler = new VolumeActionHandler(this);
				break;
			case null:
				this._actionHandler ||= new ActionHandler(this);
				break;
			default: assume(!1, `Unhandled slider action: ${this._action}`);
		}
		e != null && e != this._actionHandler && e.dispose();
	}
	_setAction(e) {
		this._actionHandler != null && (this._actionHandler.dispose(), this._actionHandler = null), this._action = e.toLowerCase(), this._actionHandler != null && (this._actionHandler.dispose(), this._initializeActionHandler());
	}
	setActionHandler(e) {
		this._actionHandler != null && (this._actionHandler.dispose(), this._actionHandler = null), this._actionHandler = e;
	}
	setThumbSize(e, t) {
		this._thumbWidth = e, this._thumbHeight = t;
	}
	_cfgAttribChanged(e) {
		let t = parseInt(e);
		t != this.getposition() && this.setposition(t);
	}
	getposition() {
		return Math.round(this._low + this._position * (this._high - this._low));
	}
	_toPercent(e) {
		return (e - this._low) / (this._high - this._low);
	}
	setposition(e) {
		this._position = this._toPercent(e), this._renderThumbPosition(), this.doSetPosition(this.getposition());
	}
	onsetposition(e) {
		this._onSetPositionEvenEaten = this._uiRoot.vm.dispatch(this, "onsetposition", [{
			type: "INT",
			value: e
		}]);
	}
	_notifyExternalPosition() {
		this._uiRoot.vm && (this.onsetposition(this.getposition()), this.updateCfgAttib(String(this.getposition())));
	}
	doSetPosition(e) {
		this.onsetposition(e), this._actionHandler != null && this._actionHandler.onsetposition(e), this.updateCfgAttib(String(this.getposition()));
	}
	doLeftMouseDown(e, t) {
		this._setPositionXY(e, t), this._uiRoot.vm.dispatch(this, "onleftbuttondown", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]), this._actionHandler != null && this._actionHandler.onLeftMouseDown(e, t);
	}
	doMouseMove(e, t) {
		this._actionHandler != null && this._actionHandler.onMouseMove(e, t);
	}
	doLeftMouseUp(e, t) {
		this._uiRoot.vm.dispatch(this, "onleftbuttonup", [{
			type: "INT",
			value: e
		}, {
			type: "INT",
			value: t
		}]), this._uiRoot.vm.dispatch(this, "onsetfinalposition", [{
			type: "INT",
			value: this.getposition()
		}]), this._uiRoot.vm.dispatch(this, "onpostedposition", [{
			type: "INT",
			value: this.getposition()
		}]), this._actionHandler != null && this._actionHandler.onLeftMouseUp(e, t);
	}
	doFreeMouseMove(e, t) {
		this._actionHandler != null && this._actionHandler.onFreeMouseMove(e, t);
	}
	_prepareThumbBitmaps() {
		if (this._thumb != null) {
			let e = this._uiRoot.getBitmap(this._thumb);
			e && e.loaded() && e._setAsBackground(this._div, "thumb-");
		}
		if (this._div.style.setProperty("--thumb-width", px(this._thumbWidth)), this._div.style.setProperty("--thumb-height", px(this._thumbHeight)), this._downThumb != null) {
			let e = this._uiRoot.getBitmap(this._downThumb);
			e && e.loaded() && e._setAsBackground(this._div, "thumb-down-");
		}
		if (this._hoverThumb != null) {
			let e = this._uiRoot.getBitmap(this._hoverThumb);
			e && e.loaded() && e._setAsBackground(this._div, "thumb-hover-");
		}
	}
	_renderThumbPosition() {
		let e = this._getActualSize();
		if (this._vertical) {
			let t = Math.floor(Math.max(0, (1 - this._position) * (e.height - this._thumbHeight)));
			this._thumbTop != t && (this._thumbTop = t, this._div.style.setProperty("--thumb-top", px(t)));
		} else {
			let t = Math.floor(this._position * (e.width - this._thumbWidth));
			this._thumbLeft != t && (this._thumbLeft = t, this._div.style.setProperty("--thumb-left", px(t)));
		}
	}
	draw() {
		super.draw(), this._div.setAttribute("data-obj-name", "Slider"), assume(this._barLeft == null, "Need to handle Slider barleft"), assume(this._barRight == null, "Need to handle Slider barright"), assume(this._barMiddle == null, "Need to handle Slider barmiddle"), this._prepareThumbBitmaps(), this._renderThumbPosition();
	}
	dispose() {
		this._actionHandler && this._actionHandler.dispose(), super.dispose();
	}
};
Slider.GUID = "62b65e3f408d375e8176ea8d771bb94a";
var SeekActionHandler = class extends ActionHandler {
	constructor(e) {
		super(e), this._onAudioProgres = () => {
			this._pendingChange || (this._slider._position = this._uiRoot.audio.getCurrentTimePercent(), this._slider._renderThumbPosition());
		}, this._registerOnAudioProgress();
	}
	isPendingChange() {
		return !0;
	}
	_registerOnAudioProgress() {
		this._subscription = this._uiRoot.audio.onCurrentTimeChange(this._onAudioProgres);
	}
	onsetposition(e) {
		this._pendingChange = this._slider._onSetPositionEvenEaten != 0, this._pendingChange || this._uiRoot.audio.seekToPercent(this._slider._toPercent(e));
	}
	onLeftMouseUp(e, t) {
		this._pendingChange && (this._pendingChange = !1, this._uiRoot.audio.seekToPercent(this._slider._toPercent(this._slider.getposition())));
	}
}, qe = {
	eqMouseDown: !1,
	targetSlider: null
}, EqActionHandler = class extends ActionHandler {
	constructor(e, t) {
		super(e), this._kind = t;
		let update = () => {
			e._position = this._uiRoot.audio.getEq(t), e._renderThumbPosition(), e._notifyExternalPosition();
		};
		update(), this._subscription = this._uiRoot.audio.onEqChange(t, update);
	}
	onLeftMouseDown(e, t) {
		qe.eqMouseDown = !0, this._slider.getparent().getDiv().classList.add("eq-surf"), this._slider.getDiv().tabIndex = -1, this._slider.getDiv().focus();
	}
	onLeftMouseUp(e, t) {
		qe.eqMouseDown = !1, this._slider.getparent().getDiv().classList.remove("eq-surf");
	}
	onFreeMouseMove(e, t) {
		qe.eqMouseDown && (qe.targetSlider = this._slider, this._slider.getDiv().tabIndex = -1, this._slider.getDiv().focus(), this._slider._setPositionXY(e, t));
	}
	onMouseMove(e, t) {
		qe.eqMouseDown && qe.targetSlider && qe.targetSlider._setPositionXY(e, t);
	}
	onsetposition(e) {
		this._uiRoot.audio.setEq(this._kind, this._slider._toPercent(e));
	}
}, PreampActionHandler = class extends ActionHandler {
	constructor(e, t) {
		super(e), this._kind = t;
		let update = () => {
			e._position = this._uiRoot.audio.getEq(t), e._renderThumbPosition(), e._notifyExternalPosition();
		};
		update(), this._subscription = this._uiRoot.audio.onEqChange(t, update);
	}
	onsetposition(e) {
		this._uiRoot.audio.setEq(this._kind, this._slider._toPercent(e));
	}
}, PanActionHandler = class extends ActionHandler {
	constructor(e) {
		super(e), this._changing = !1;
		let sync = () => {
			e._position = (this._uiRoot.audio.getBalance() + 1) / 2, e._renderThumbPosition(), e._notifyExternalPosition();
		};
		sync(), this._subscription = this._uiRoot.audio.onBalanceChanged(() => {
			this._changing || sync();
		});
	}
	onsetposition(e) {
		this._uiRoot.audio.setBalance(this._slider._toPercent(e) * 2 - 1);
	}
	onLeftMouseDown(e, t) {
		this._changing = !0;
	}
	onLeftMouseUp(e, t) {
		this._changing = !1;
	}
}, VolumeActionHandler = class extends ActionHandler {
	constructor(e) {
		super(e), this._changing = !1, e._position = this._uiRoot.audio.getVolume(), e._renderThumbPosition(), e._notifyExternalPosition(), this._subscription = this._uiRoot.audio.onVolumeChanged(() => {
			this._changing || (e._position = this._uiRoot.audio.getVolume(), e._renderThumbPosition(), e._notifyExternalPosition());
		});
	}
	onsetposition(e) {
		this._uiRoot.audio.setVolume(this._slider._toPercent(e));
	}
	onLeftMouseDown(e, t) {
		this._changing = !0;
	}
	onLeftMouseUp(e, t) {
		this._changing = !1;
	}
}, VisPaintHandler = class {
	constructor(e) {
		this._vis = e;
	}
	prepare() {}
	paintFrame() {}
	dispose() {}
	doAction(e, t) {}
}, Je = {};
function registerPainter(e, t) {
	Je[e] = t;
}
var Vis = class extends GuiObj {
	constructor(e) {
		super(e), this._canvas = document.createElement("canvas"), this._displayCanvas = document.createElement("canvas"), this._dpr = 1, this._animationRequest = null, this._mode = "1", this._colorBands = [], this._colorBandPeak = "255,255,255", this._colorOsc = [], this._coloring = "normal", this._peaks = !0, this._bandwidth = "wide", this._realtime = !0, this._rebuildPainter = debounce(() => {
			this._painter && (this._painter.prepare(), this._painter.paintFrame(), this._blit());
		}, 100), this._colorThemeChanged = (e) => {
			this._rebuildPainter();
		}, this.audioStatusChanged = () => {
			this._stopVisualizer(), this._uiRoot.audio.getState() == "playing" && this._startVisualizer();
		}, this._colorBands = Ye.slice(2, 18), this._colorOsc = Ye.slice(18, 23), this._colorBandPeak = Ye[23], this._painter = new NoVisualizerHandler(this), this._uiRoot.audio.on("statchanged", this.audioStatusChanged), this._uiRoot.on("colorthemechanged", this._colorThemeChanged);
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (t = t.toLowerCase(), m) {
			case "mode":
				this.setmode(t);
				break;
			case "gammagroup":
				this._gammagroup = t;
				break;
			case "colorband1":
			case "colorband2":
			case "colorband3":
			case "colorband4":
			case "colorband5":
			case "colorband6":
			case "colorband7":
			case "colorband8":
			case "colorband9":
			case "colorband10":
			case "colorband11":
			case "colorband12":
			case "colorband13":
			case "colorband14":
			case "colorband15":
			case "colorband16":
				let e = parseInt(m.substring(9)) - 1;
				this._colorBands[e] = t;
				break;
			case "colorallbands":
				for (var v = 0; v < 16; v++) this._colorBands[v] = t;
				break;
			case "coloring":
				this._coloring = t;
				break;
			case "colorbandpeak":
				this._colorBandPeak = t;
				break;
			case "peaks":
				this._peaks = toBool(t);
				break;
			case "bandwidth":
				this._bandwidth = t;
				break;
			case "colorosc1":
			case "colorosc2":
			case "colorosc3":
			case "colorosc4":
			case "colorosc5":
				let y = parseInt(m.substring(8)) - 1;
				this._colorOsc[y] = t;
				break;
			case "colorallosc":
				for (var v = 0; v < 5; v++) this._colorOsc[v] = t;
				break;
			case "oscstyle":
				this._oscStyle = t;
				break;
			case "others": break;
			default: return !1;
		}
		return this._rebuildPainter(), !0;
	}
	init() {
		this.setmode(this._mode), super.init(), this.audioStatusChanged();
	}
	dispose() {
		super.dispose(), this._stopVisualizer();
	}
	setmode(e) {
		this._mode = e;
		let t = Je[e] || Je[0];
		this._setPainter(t);
	}
	getmode() {
		return parseInt("0" + this._mode);
	}
	nextmode() {
		let e = this.getmode() + 1;
		e > 2 && (e = 0), this.setmode(String(e));
	}
	_setPainter(e) {
		let t = this._painter;
		this._painter = new e(this), this.audioStatusChanged(), t && t.dispose();
	}
	_startVisualizer() {
		this._rebuildPainter();
		let loop = () => {
			this._painter.paintFrame(), this._blit(), this._animationRequest = window.requestAnimationFrame(loop);
		};
		loop();
	}
	_syncDisplayCanvas() {
		this._dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
		let e = this._canvas.width, t = this._canvas.height;
		(this._displayCanvas.width !== e * this._dpr || this._displayCanvas.height !== t * this._dpr) && (this._displayCanvas.width = e * this._dpr, this._displayCanvas.height = t * this._dpr), this._displayCanvas.style.width = this._canvas.style.width, this._displayCanvas.style.height = this._canvas.style.height;
	}
	_blit() {
		let e = this._displayCanvas.getContext("2d");
		e && (this._displayCanvas.width !== this._canvas.width * this._dpr && this._syncDisplayCanvas(), e.imageSmoothingEnabled = !1, e.clearRect(0, 0, this._displayCanvas.width, this._displayCanvas.height), e.drawImage(this._canvas, 0, 0, this._displayCanvas.width, this._displayCanvas.height));
	}
	_stopVisualizer() {
		this._animationRequest != null && (window.cancelAnimationFrame(this._animationRequest), this._animationRequest = null);
	}
	setrealtime(e) {
		this._realtime = unimplemented(e);
	}
	getrealtime() {
		return this._realtime;
	}
	_renderWidth() {
		super._renderWidth(), this._canvas.style.width = this._div.style.width, this._canvas.setAttribute("width", `${parseInt(this._div.style.width)}`), this._syncDisplayCanvas();
	}
	_renderHeight() {
		super._renderHeight(), this._canvas.style.height = this._div.style.height, this._canvas.setAttribute("height", `${parseInt(this._div.style.height)}`), this._syncDisplayCanvas();
	}
	draw() {
		super.draw(), this._displayCanvas.setAttribute("id", this.getId() + "-canvas"), this._syncDisplayCanvas(), this._div.appendChild(this._displayCanvas);
	}
};
Vis.GUID = "ce4f97be4e1977b098d45699276cc933";
var NoVisualizerHandler = class extends VisPaintHandler {
	prepare() {
		let e = this._vis._canvas.getContext("2d");
		e.clearRect(0, 0, e.canvas.width, e.canvas.height);
	}
};
registerPainter("0", NoVisualizerHandler);
var Ye = [
	"0,0,0",
	"24,33,41",
	"239,49,16",
	"206,41,16",
	"214,90,0",
	"214,102,0",
	"214,115,0",
	"198,123,8",
	"222,165,24",
	"214,181,33",
	"189,222,41",
	"148,222,33",
	"41,206,16",
	"50,190,16",
	"57,181,16",
	"49,156,8",
	"41,148,0",
	"24,132,8",
	"255,255,255",
	"214,214,222",
	"181,189,189",
	"160,170,175",
	"148,156,165",
	"150,150,150"
], Xe = 19, Ze = 2, Qe = 1, $e = .01;
function octaveBucketsForBufferLength(e, t = Xe) {
	let m = Array(t).fill(0), v = 22050, y = (v / 200) ** (1 / t);
	m[0] = 0, m[1] = 200;
	for (let e = 2; e < t - 1; e++) m[e] = m[e - 1] * y;
	m[t - 1] = v;
	for (let y = 0; y < t; y++) {
		let t = Math.floor(m[y] / v * e);
		m[y] = t;
	}
	return m;
}
var BarPaintHandler = class extends VisPaintHandler {
	constructor(e) {
		super(e), this._color = "rgb(255,255,255)", this._colorPeak = "rgb(255,255,255)", this._bar = document.createElement("canvas"), this._peak = document.createElement("canvas"), this._barPeaks = Array(Xe).fill(-1), this._barPeakFrames = Array(Xe).fill(0), this._analyser = this._vis._uiRoot.audio.getAnalyser(), this._bufferLength = this._analyser.frequencyBinCount, this._octaveBuckets = octaveBucketsForBufferLength(this._bufferLength), this._dataArray = new Uint8Array(this._bufferLength);
	}
	prepare() {
		let e = this._vis, t = e._gammagroup, m = this._vis._uiRoot._getGammaGroup(t);
		this._barWidth = e._canvas.width / Xe, this._peak.height = 1, this._peak.width = 1;
		var v = this._peak.getContext("2d");
		v.fillStyle = `rgb(${this._vis._colorBandPeak})`, v.fillRect(0, 0, 1, 1), this._bar.height = e._canvas.height, this._bar.width = 1;
		var v = this._bar.getContext("2d");
		let y = v.createLinearGradient(0, 0, 0, e._canvas.height), x = e._colorBands.length;
		for (let t = 0; t < x; t++) {
			let v = m.transformColor(e._colorBands[t]);
			y.addColorStop(t / x, v), y.addColorStop(Math.max(t / x, (t + 1) / x - 1e-4), v);
		}
		if (v.strokeStyle = this._color, v.fillStyle = y, v.fillRect(0, 0, 1, e._canvas.height), v.imageSmoothingEnabled = !1, this._ctx = this._vis._canvas.getContext("2d"), this._vis._bandwidth == "wide") this.paintFrame = this.paintFrameWide.bind(this), this._octaveBuckets = octaveBucketsForBufferLength(this._bufferLength, 20), this._barPeaks = Array(Xe).fill(-1), this._barPeakFrames = Array(Xe).fill(0);
		else {
			let e = this._vis._canvas.width;
			this._barPeaks = Array(e).fill(-1), this._barPeakFrames = Array(e).fill(0), this._octaveBuckets = octaveBucketsForBufferLength(this._bufferLength, e), this.paintFrame = this.paintFrameThin.bind(this);
		}
		this.paintBar = this._vis._coloring == "fire" ? this.paintBarFire.bind(this) : this.paintBarNormal.bind(this);
	}
	paintFrameWide() {
		if (!this._ctx) return;
		let e = this._ctx, t = e.canvas.width, m = e.canvas.height;
		e.clearRect(0, 0, t, m), e.fillStyle = this._color, this._analyser.getByteFrequencyData(this._dataArray);
		let v = m / 256;
		for (let t = 0; t < Xe; t++) {
			let m = this._octaveBuckets[t], S = this._octaveBuckets[t + 1], C = 0;
			for (let e = m; e < S; e++) C = Math.max(C, this._dataArray[e]);
			this._advancePeak(t, C);
			let w = this._barPeaks[t];
			var y = Math.round(this._barWidth * t), x = Math.round(this._barWidth * (t + 1)) - Ze;
			this.paintBar(e, y, x, C * v, w * v);
		}
	}
	paintFrameThin() {
		if (!this._ctx) return;
		let e = this._ctx, t = e.canvas.width, m = e.canvas.height;
		e.clearRect(0, 0, t, m), e.fillStyle = this._color, this._analyser.getByteFrequencyData(this._dataArray);
		let v = m / 256;
		for (let m = 0; m < t - 1; m++) {
			let t = this._octaveBuckets[m], y = this._octaveBuckets[m + 1], x = 0;
			x /= y - t;
			for (let e = t; e < y; e++) x = Math.max(x, this._dataArray[e]);
			this._advancePeak(m, x);
			let S = this._barPeaks[m];
			this.paintBar(e, m, m, x * v, S * v);
		}
	}
	_advancePeak(e, t) {
		if (this._barPeaks[e] < 0) {
			this._barPeaks[e] = t, this._barPeakFrames[e] = 0;
			return;
		}
		let m = this._barPeaks[e] - $e * this._barPeakFrames[e] ** 2;
		m < t ? (m = t, this._barPeakFrames[e] = 0) : this._barPeakFrames[e] += 1, this._barPeaks[e] = Math.max(0, m);
	}
	paintBarNormal(e, t, m, v, y) {
		let x = e.canvas.height;
		var S = x - v;
		if (e.drawImage(this._bar, 0, S, 1, x - S, t, S, m - t + 1, x - S), this._vis._peaks && y > 0) {
			let v = Math.max(0, Math.round(x - y) - 1);
			e.drawImage(this._peak, 0, 0, 1, 1, t, v, m - t + 1, 1);
		}
	}
	paintBarFire(e, t, m, v, y) {
		let x = e.canvas.height;
		var S = x - v;
		if (e.drawImage(this._bar, 0, 0, this._bar.width, x - S, t, S, m - t + 1, x - S), this._vis._peaks && y > 0) {
			let v = Math.max(0, Math.round(x - y) - 1);
			e.drawImage(this._peak, 0, 0, 1, 1, t, v, m - t + 1, 1);
		}
	}
};
registerPainter("1", BarPaintHandler);
function slice1st(e, t, m) {
	return e[t * m];
}
var WavePaintHandler = class extends VisPaintHandler {
	constructor(e) {
		super(e), this._lastX = 0, this._lastY = 0, this._bar = document.createElement("canvas"), this._16h = document.createElement("canvas"), this._datafetched = !1, this._analyser = this._vis._uiRoot.audio.getAnalyser(), this._bufferLength = this._analyser.fftSize, this._dataArray = new Uint8Array(this._bufferLength), this._pixelRatio = window.devicePixelRatio || 1;
	}
	prepare() {
		let e = this._vis, t = e._gammagroup, m = this._vis._uiRoot._getGammaGroup(t);
		this._16h.width = 1, this._16h.height = 16, this._16h.setAttribute("width", "72"), this._16h.setAttribute("height", "16"), this._bar.width = 1, this._bar.height = 5, this._bar.setAttribute("width", "1"), this._bar.setAttribute("height", "5");
		var v = this._bar.getContext("2d");
		for (let t = 0; t < 5; t++) v.fillStyle = m.transformColor(e._colorOsc[t]), v.fillRect(0, t, 1, t + 1);
		this._ctx = e._canvas.getContext("2d"), this._ctx.imageSmoothingEnabled = !1, this._ctx.mozImageSmoothingEnabled = !1, this._ctx.webkitImageSmoothingEnabled = !1, this._ctx.msImageSmoothingEnabled = !1, this.paintWav = this._vis._oscStyle == "dots" ? this.paintWavDot.bind(this) : this._vis._oscStyle == "solid" ? this.paintWavSolid.bind(this) : this.paintWavLine.bind(this), this._datafetched = !1;
	}
	paintFrame() {
		if (!this._ctx) return;
		this._analyser.getByteTimeDomainData(this._dataArray), this._dataArray = this._dataArray.slice(0, 576);
		let e = this._dataArray.length;
		this._datafetched ||= !0;
		let t = this._vis._canvas.height != 16;
		t && (this._ctx = this._16h.getContext("2d"));
		let m = this._ctx.canvas.width, v = this._ctx.canvas.height;
		this._ctx.clearRect(0, 0, m, v);
		let y = Math.floor(e / m);
		for (let e = 0; e <= m; e++) {
			let t = slice1st(this._dataArray, y, e), [m, v] = this.rangeByAmplitude(t), x = e * Qe;
			this.paintWav(x, m, v);
		}
		if (t) {
			let e = this._vis._canvas, t = e.getContext("2d");
			t.clearRect(0, 0, e.width, e.height), t.drawImage(this._16h, 0, 0, 72, 16, 0, 0, e.width, e.height);
		}
	}
	rangeByAmplitude(e) {
		return e >= 184 ? [0, 3] : e >= 176 ? [1, 3] : e >= 168 ? [2, 2] : e >= 160 ? [3, 2] : e >= 152 ? [4, 1] : e >= 144 ? [5, 1] : e >= 136 ? [6, 0] : e >= 128 ? [7, 0] : e >= 120 ? [8, 1] : e >= 112 ? [9, 1] : e >= 104 ? [10, 2] : e >= 96 ? [11, 2] : e >= 88 ? [12, 3] : e >= 80 ? [13, 3] : e >= 72 ? [14, 4] : [15, 4];
	}
	paintWavLine(e, t, m) {
		e === 0 && (this._lastY = t);
		let v = t, y = this._lastY;
		for (this._lastY = t, y < v && ([y, v] = [v, y]), t = v; t <= y; t++) this._ctx.drawImage(this._bar, 0, m, 1, 1, e, t, 1, 1);
	}
	paintWavDot(e, t, m) {
		this._ctx.drawImage(this._bar, 0, m, 1, 1, e, t, 1, 1);
	}
	paintWavSolid(e, t, m) {
		var v, y;
		for (t >= 8 ? (v = 8, y = t) : (v = t, y = 7), t = v; t <= y; t++) this._ctx.drawImage(this._bar, 0, m, 1, 1, e, t, 1, 1);
	}
};
registerPainter("2", WavePaintHandler);
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/EqVis.js
var EqVis = class extends GuiObj {
	constructor(e) {
		super(e), this._canvas = document.createElement("canvas"), this._preampImg = document.createElement("canvas"), this._colorTop = "255,255,255", this._colorMiddle = "255,255,255", this._colorBotttom = "255,255,255", this._colorPreamp = "186,203,221", this.update = () => {
			let e = this._canvas.getContext("2d"), t = e.canvas.width, m = e.canvas.height;
			e.clearRect(0, 0, t, m);
			let v = [];
			for (let e = 1; e <= 10; e++) v.push(this._uiRoot.audio.getEq(String(e)));
			let y = percentToRange(this._uiRoot.audio.getEq("preamp"), 0, m - 1);
			e.drawImage(this._getPreampImg(), 0, y), e.fillStyle = this._getFillStyle();
			let x = m - 1, S = [], C = [];
			v.forEach((e, m) => {
				let v = 1 - e;
				S.push(m * ((t - 4) / 9)), C.push(percentToRange(v, 0, x));
			});
			let w = spline(S, C), E = S[S.length - 1], O = C[0];
			for (let t = 0; t <= E; t++) {
				let v = clamp(Math.round(w[t]), 0, m - 1), y = Math.min(v, O), x = 1 + Math.abs(O - v);
				e.fillRect(2 + t, y, 1, x), O = v;
			}
		}, this.registerEqChanges(), this._preampImg.width = 0;
	}
	registerEqChanges() {
		for (let e = 1; e <= 10; e++) this._uiRoot.audio.onEqChange(String(e), this.update);
		this._uiRoot.audio.onEqChange("preamp", this.update);
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e) {
			case "colortop":
				this._colorTop = t;
				break;
			case "colormiddle":
				this._colorMiddle = t;
				break;
			case "colorbottom":
				this._colorBotttom = t;
				break;
			case "colorpreamp":
				this._colorPreamp = t;
				break;
			case "colors":
				this._colorBitmapName = t;
				break;
			case "preamp":
				this._preampBitmapName = t;
				break;
			default: return !1;
		}
		return !0;
	}
	_getFillStyle() {
		if (!this._fillStyle) {
			let e = this._canvas.getContext("2d");
			if (this._colorBitmapName) {
				let t = this._uiRoot.getBitmap(this._colorBitmapName);
				this._fillStyle = e.createPattern(t.getCanvas(), "repeat-x");
			} else {
				let t = e.createLinearGradient(0, 0, 0, this._canvas.height);
				t.addColorStop(0, `rgb(${this._colorTop})`), t.addColorStop(.5, `rgb(${this._colorMiddle})`), t.addColorStop(1, `rgb(${this._colorBotttom})`), this._fillStyle = t;
			}
		}
		return this._fillStyle;
	}
	_getPreampImg() {
		if (!this._preampImg.width) {
			this._preampImg.width = this.getwidth(), this._preampImg.height = 1;
			let e = this._preampImg.getContext("2d");
			if (e.fillStyle = `rgba(${this._colorPreamp},1)`, e.fillRect(0, 0, this.getwidth(), 1), this._preampBitmapName) {
				let t = this._uiRoot.getBitmap(this._preampBitmapName);
				this._preampImg.height = t.getHeight(), e.drawImage(t.getImg(), -t.getLeft(), -t.getTop());
			}
		}
		return this._preampImg;
	}
	_renderWidth() {
		super._renderWidth(), this._canvas.style.width = this._div.style.width, this._canvas.setAttribute("width", `${parseInt(this._div.style.width)}`);
	}
	_renderHeight() {
		super._renderHeight(), this._canvas.style.height = this._div.style.height, this._canvas.setAttribute("height", `${parseInt(this._div.style.height)}`);
	}
	draw() {
		super.draw(), this._div.appendChild(this._canvas), this.update();
	}
	isinvalid() {
		return !1;
	}
};
EqVis.GUID = "8d1eba38483e489e1f8d60b905c4c543";
var percentToRange = (e, t, m) => t + Math.round(e * (m - t));
function spline(e, t) {
	let m = getNaturalKs(e, t), v = e[e.length - 1], y = [], x = 1;
	for (let S = 0; S <= v; S++) {
		for (; e[x] < S;) x++;
		let v = (S - e[x - 1]) / (e[x] - e[x - 1]), C = m[x - 1] * (e[x] - e[x - 1]) - (t[x] - t[x - 1]), w = -m[x] * (e[x] - e[x - 1]) + (t[x] - t[x - 1]), E = (1 - v) * t[x - 1] + v * t[x] + v * (1 - v) * (C * (1 - v) + w * v);
		y.push(E);
	}
	return y;
}
function getNaturalKs(e, t) {
	let m = e.map(() => 0), v = e.length - 1, y = zerosMatrix(v + 1, v + 2);
	for (let m = 1; m < v; m++) y[m][m - 1] = 1 / (e[m] - e[m - 1]), y[m][m] = 2 * (1 / (e[m] - e[m - 1]) + 1 / (e[m + 1] - e[m])), y[m][m + 1] = 1 / (e[m + 1] - e[m]), y[m][v + 1] = 3 * ((t[m] - t[m - 1]) / ((e[m] - e[m - 1]) * (e[m] - e[m - 1])) + (t[m + 1] - t[m]) / ((e[m + 1] - e[m]) * (e[m + 1] - e[m])));
	return y[0][0] = 2 / (e[1] - e[0]), y[0][1] = 1 / (e[1] - e[0]), y[0][v + 1] = 3 * (t[1] - t[0]) / ((e[1] - e[0]) * (e[1] - e[0])), y[v][v - 1] = 1 / (e[v] - e[v - 1]), y[v][v] = 2 / (e[v] - e[v - 1]), y[v][v + 1] = 3 * (t[v] - t[v - 1]) / ((e[v] - e[v - 1]) * (e[v] - e[v - 1])), solve(y, m);
}
function solve(e, t) {
	let m = e.length;
	for (let t = 0; t < m; t++) {
		let v = 0, y = -Infinity;
		for (let x = t; x < m; x++) e[x][t] > y && (v = x, y = e[x][t]);
		swapRows(e, t, v);
		for (let v = t + 1; v < m; v++) {
			for (let y = t + 1; y < m + 1; y++) e[v][y] = e[v][y] - e[t][y] * (e[v][t] / e[t][t]);
			e[v][t] = 0;
		}
	}
	for (let v = m - 1; v >= 0; v--) {
		let y = e[v][m] / e[v][v];
		t[v] = y;
		for (let t = v - 1; t >= 0; t--) e[t][m] -= e[t][v] * y, e[t][v] = 0;
	}
	return t;
}
function zerosMatrix(e, t) {
	let m = [];
	for (let v = 0; v < e; v++) {
		m.push([]);
		for (let e = 0; e < t; e++) m[v].push(0);
	}
	return m;
}
function swapRows(e, t, m) {
	let v = e[t];
	e[t] = e[m], e[m] = v;
}
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/ComponentBucket.js
var ComponentBucket = class extends Fe {
	constructor(e) {
		super(e), this._vertical = !1, this._page = 0, this._leftmargin = 0, this._rightmargin = 0, this._spacing = 0, this._wrapper = document.createElement("wrapper");
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m.toLowerCase()) {
			case "wndtype":
				this._wndType = t.toLowerCase();
				break;
			case "vertical":
				this._vertical = toBool(t);
				break;
			case "leftmargin":
				this._leftmargin = num(t);
				break;
			case "rightmargin":
				this._rightmargin = num(t);
				break;
			case "spacing":
				this._spacing = num(t);
				break;
			default: return !1;
		}
		return !0;
	}
	getWindowType() {
		return this._wndType;
	}
	getmaxheight() {
		return this._maximumHeight;
	}
	getmaxwidth() {
		return this._maximumWidth;
	}
	setscroll(e) {
		let t = this._vertical ? "top" : "left";
		return this._wrapper.style.setProperty(t, px(e)), e;
	}
	getscroll() {
		let e = this._vertical ? "top" : "left";
		return parseInt(this._wrapper.style.getPropertyValue(e));
	}
	getnumchildren() {
		return this._children.length;
	}
	enumchildren(e) {
		return this._children[e];
	}
	handleAction(e, t = null, m = null, v = null) {
		switch (e.toLowerCase()) {
			case "cb_prev":
			case "cb_prevpage": return this._scrollPage(1), !0;
			case "cb_next":
			case "cb_nextpage": return this._scrollPage(-1), !0;
		}
		return !1;
	}
	init() {
		this.resolveButtonsAction(), super.init(), this._uiRoot.vm.dispatch(this, "onstartup", []);
	}
	resolveButtonsAction() {
		for (let e of this.getparent()._children) e instanceof Button && (e._actionTarget == null || e._actionTarget == "bucket") && e._action && e._action.toLowerCase().startsWith("cb_") && (e._actionTarget = this.getId());
	}
	_scrollPage(e) {
		if (!this._children.length) return;
		let t = this._children[0], m = this._vertical ? t.getheight() : t.getwidth(), v = this._vertical ? "top" : "left", y = this._vertical ? this._wrapper.offsetTop : this._wrapper.offsetLeft, x = this._div.getBoundingClientRect(), S = this._vertical ? x.height : x.width, C = Math.ceil(S / m), w = this._wrapper.getBoundingClientRect(), E = this._vertical ? w.height - x.height : w.width - x.width, O = clamp(y + m * C * e, -(E + (this._leftmargin + this._rightmargin)), 0);
		this._wrapper.style.setProperty(v, px(O));
	}
	appendChildrenDiv() {
		this._div.appendChild(this._wrapper), this._appendChildrenToDiv(this._wrapper);
	}
	draw() {
		super.draw(), this._vertical ? (this._div.classList.add("vertical"), this._wrapper.style.marginTop = px(this._leftmargin), this._wrapper.style.marginBottom = px(this._rightmargin)) : (this._div.classList.remove("vertical"), this._wrapper.style.marginLeft = px(this._leftmargin), this._wrapper.style.marginRight = px(this._rightmargin)), this._wrapper.style.gap = px(this._spacing);
	}
};
ComponentBucket.GUID = "97aa3e4d4fa8f4d0f20a7b818349452a";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/AlbumArt.js
var AlbumArt = class extends Layer {
	constructor(e) {
		super(e), this._trackId = -1, this._hasPicture = !1, this._albumArtSubscription = null, this._trackChanged = () => {
			let e;
			if ((e = this._uiRoot.playlist.currentTrack()) && (this._trackId != e.id || !this._hasPicture && e.metadata && e.metadata.image)) {
				if (this._trackId = e.id, e.metadata && e.metadata.image) {
					let t = e.metadata.image;
					this._hasPicture = t != null;
					let m = URL.createObjectURL(new Blob([t.data], { type: t.mime }));
					this._div.style.backgroundImage = `url(${m})`;
				} else this._hasPicture = !1, this._div.style.removeProperty("background-image");
			}
		}, this._w = 0, this._h = 0, this._relatw = "1", this._relath = "1";
	}
	init() {
		super.init(), this._uiRoot.playlist.on("trackchange", this._trackChanged), this._albumArtSubscription = this._uiRoot.audio.onAlbumArtChange(this.refresh.bind(this));
	}
	dispose() {
		this._albumArtSubscription?.(), this._albumArtSubscription = null, super.dispose();
	}
	draw() {
		super.draw();
	}
	refresh() {
		let e = this._uiRoot.audio._albumArtUrl;
		e == null ? this._div.style.removeProperty("background-image") : (this._div.style.pointerEvents = "all", this._div.style.backgroundImage = `url(${e})`, this._div.style.backgroundSize = "cover");
	}
	isloading() {
		return 1;
	}
	onAlbumArtLoaded(e) {
		return !0;
	}
	isinvalid() {
		return !this._hasPicture;
	}
};
AlbumArt.GUID = "6dcb05e448c28ac4f04993b14af50e91";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/PlayListGui.js
var et = "Arial", tt = 13, PlayListGui = class extends Fe {
	constructor() {
		super(...arguments), this._selectedIndex = -1, this._contentPanel = document.createElement("div"), this._slider = new Slider(this._uiRoot), this._plFont = null, this._plFontSize = null, this._plLineSpacing = null, this._plColor = null, this._plPlayColor = null, this._plSelColor = null, this._plSelBgColor = null, this._plBgColor = null, this._contentScrolled = () => {
			let e = this._contentPanel, t = e.scrollTop / (e.scrollHeight - e.clientHeight);
			this._slider.setposition((1 - t) * 255);
		}, this.refresh = () => {
			removeAllChildNodes(this._contentPanel);
			let e = this._uiRoot.playlist, t = e.getcurrentindex();
			for (let m = 0; m < e.getnumtracks(); m++) {
				let v = document.createElement("div");
				m == t && v.classList.add("current"), m == this._selectedIndex && v.classList.add("selected"), v.addEventListener("click", (e) => {
					this._selectedIndex = m, this.refresh();
				}), v.addEventListener("dblclick", (e) => {
					this._uiRoot.playlist.playtrack(m), this._uiRoot.audio.play(), this.refresh();
				}), v.append(Object.assign(document.createElement("span"), { textContent: `${m + 1}. ${e.gettitle(m)}` }), Object.assign(document.createElement("span"), { textContent: `${e.getlength(m)}` })), this._contentPanel.appendChild(v);
			}
		}, this.itemClick = () => {};
	}
	getElTag() {
		return "group";
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "font":
				this._plFont = t;
				break;
			case "fontsize":
				this._plFontSize = num(t);
				break;
			case "linespacing":
				this._plLineSpacing = num(t);
				break;
			case "color":
				this._plColor = t;
				break;
			case "playcolor":
				this._plPlayColor = t;
				break;
			case "selcolor":
				this._plSelColor = t;
				break;
			case "selbgcolor":
				this._plSelBgColor = t;
				break;
			case "bgcolor":
				this._plBgColor = t;
				break;
			default: return !1;
		}
		return !0;
	}
	_cssColor(e) {
		if (!e) return null;
		if (/^\d+\s*,\s*\d+\s*,\s*\d+/.test(e)) return `rgb(${e})`;
		let t = this._uiRoot.findColor(e);
		return t ? `var(${t.getCSSVar()}, ${t.getRgb()})` : null;
	}
	_applyTextStyle() {
		let e = this._plFont ? null : this._uiRoot.getSkinPlaylistFont(), t = this._plFont ?? e?.font ?? null, m = this._plFontSize ?? e?.fontsize ?? tt, v = this._plLineSpacing ?? e?.linespacing ?? 0, y = et;
		if (t) {
			let e = this._uiRoot.getFont(t);
			y = e instanceof TrueTypeFont ? e.getFontFamily() : t;
		}
		let x = this._div.style;
		x.setProperty("--pl-font-family", y), x.setProperty("--pl-font-size", `${m}px`), x.setProperty("--pl-line-height", `${m + 1 + v}px`);
		let setColor = (e, t) => {
			let m = this._cssColor(t);
			m ? x.setProperty(e, m) : x.removeProperty(e);
		};
		setColor("--pl-color", this._plColor), setColor("--pl-play-color", this._plPlayColor), setColor("--pl-sel-color", this._plSelColor), setColor("--pl-sel-bg-color", this._plSelBgColor), setColor("--pl-bg-color", this._plBgColor);
	}
	init() {
		super.init(), this._uiRoot.playlist.on("trackchange", this.refresh), this._contentPanel.addEventListener("scroll", this._contentScrolled), this.refresh();
	}
	_prepareScrollbar() {
		this._slider.setXmlAttributes({
			orientation: "v",
			x: "-10",
			relatx: "1",
			y: "0",
			w: "8",
			h: "0",
			relath: "1"
		}), this._slider.setThumbSize(8, 18);
		let e = new PlaylistScrollActionHandler(this._slider, this);
		this._slider.setActionHandler(e), this._slider.getDiv().classList.add("scrollbar"), this.addChild(this._slider);
	}
	_scrollTo(e) {
		let t = this._contentPanel;
		t.scrollTop = e * (t.scrollHeight - t.clientHeight);
	}
	draw() {
		this._prepareScrollbar(), super.draw(), this._applyTextStyle(), this._div.appendChild(this._contentPanel), this._contentPanel.classList.add("content-list"), this._div.setAttribute("tabindex", "0"), this._div.classList.add("pl"), this._div.classList.add("list"), this._div.style.pointerEvents = "auto";
	}
};
PlayListGui.GUID = "45f3f7c14ee6a6f35e125ea18d3ffc92";
var PlaylistScrollActionHandler = class extends ActionHandler {
	constructor(e, t) {
		super(e), this._scrolling = !1, this._pl = t;
	}
	onLeftMouseDown(e, t) {
		this._scrolling = !0;
	}
	onLeftMouseUp(e, t) {
		this._scrolling = !1;
	}
	onsetposition(e) {
		this._scrolling && this._pl._scrollTo(1 - e / 255);
	}
}, XuiElement = class extends Fe {
	constructor() {
		super(...arguments), this.__inited = !1, this._unhandledXuiParams = [];
	}
	getElTag() {
		return "group";
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		return super.setXmlAttr(m, t) || this._unhandledXuiParams.push({
			key: m,
			value: t
		}), !0;
	}
	init() {
		if (!this.__inited) {
			this.__inited = !0, super.init();
			for (let e of this._systemObjects) this._unhandledXuiParams.forEach(({ key: t, value: m }) => {
				this._uiRoot.vm.dispatch(e, "onsetxuiparam", [{
					type: "STRING",
					value: t
				}, {
					type: "STRING",
					value: m
				}]);
			});
			this._unhandledXuiParams = [];
		}
	}
}, WasabiTitleBar = class extends XuiElement {};
WasabiTitleBar.GUID = "7DFD32444e7c3751AE8240BF33DC3A5F";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Avs.js
var nt = null;
function loadButterchurn() {
	return nt ||= Promise.all([import("./butterchurn-DSzMWieF.js").then((e) => e.default), import("./butterchurn-presets-Dfci7Mcc.js").then((e) => e.default)]), nt;
}
var Avs = class extends Vis {
	init() {
		this._mode = "milkdrop", super.init(), this._uiRoot._avss.push(this);
	}
	handleAction(e, t = null, m = null, v = null) {
		return e = e.toLowerCase(), [
			"vis_prev",
			"vis_next",
			"vis_f5"
		].includes(e) ? (this._painter.doAction(e, t), !0) : !1;
	}
};
Avs.GUID = "OFFICIALLY-NO-GUID";
var ButterchurnPaintHandler = class extends VisPaintHandler {
	constructor() {
		super(...arguments), this._visualizer = null, this._butterchurn = null, this._presets = null, this._loading = !1, this._presetIndex = 10;
	}
	prepare() {}
	_buildButterchurn() {
		let e = this._vis._uiRoot.audio, t = this._vis._canvas, m = t.width, v = t.height;
		this._visualizer = this._butterchurn.createVisualizer(e._context, t, {
			width: m,
			height: v
		}), this._visualizer.connectAudio(e._analyser), this._visualizer.setRendererSize(m, v), this.loadPreset();
	}
	paintFrame() {
		if (!this._visualizer) {
			if (!document.getElementById(this._vis._canvas.id) || this._vis._uiRoot.audio.getState() != "playing") return;
			if (!this._butterchurn) {
				this._loading || (this._loading = !0, loadButterchurn().then(([e, t]) => {
					this._butterchurn = e, this._presets = t;
				}));
				return;
			}
			this._buildButterchurn();
		}
		this._visualizer.render();
	}
	doAction(e, t) {
		switch (e) {
			case "vis_prev":
				this._presetIndex--, this.loadPreset();
				break;
			case "vis_next": this._presetIndex++, this.loadPreset();
		}
	}
	loadPreset() {
		if (!this._visualizer) return;
		let e = this._presets.getPresets(), t = Object.keys(e);
		this._presetIndex = circular(this._presetIndex, 0, t.length - 1);
		let m = this._presetIndex == 0 ? "Flexi, martin + geiss - dedicated to the sherwin maxawow" : t[this._presetIndex], v = e[m];
		this._visualizer.loadPreset(v, 1);
		let y = this._vis._canvas, x = y.getBoundingClientRect(), S = Math.max(x.width, 10), C = Math.max(x.height, 10);
		y.width = S, y.height = C, this._visualizer.setRendererSize(S, C), this._visualizer.launchSongTitleAnim(`Preset:[${this._presetIndex}] : ${m}`), this._visualizer.renderer.supertext.duration = 7, this._visualizer.render();
	}
};
registerPainter("milkdrop", ButterchurnPaintHandler);
//#endregion
//#region src/vendor/webamp-modern/_snowpack/pkg/common/Parser-b534446c.js
var rt = "", StringScanner = class {
	constructor(e) {
		this.chars = [...e], this.charCount = this.chars.length, this.charIndex = 0, this.charsToBytes = Array(this.charCount), this.multiByteMode = !1, this.string = e;
		let { chars: t, charCount: m, charsToBytes: v } = this;
		if (m === e.length) for (let e = 0; e < m; ++e) v[e] = e;
		else {
			for (let e = 0, y = 0; y < m; ++y) v[y] = e, e += t[y].length;
			this.multiByteMode = !0;
		}
	}
	get isEnd() {
		return this.charIndex >= this.charCount;
	}
	_charLength(e) {
		let { length: t } = e;
		return t < 2 || !this.multiByteMode ? t : e.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "_").length;
	}
	advance(e = 1) {
		this.charIndex = Math.min(this.charCount, this.charIndex + e);
	}
	consume(e = 1) {
		let t = this.peek(e);
		return this.advance(e), t;
	}
	consumeMatch(e) {
		if (!e.sticky) throw Error("`regex` must have a sticky flag (\"y\")");
		e.lastIndex = this.charsToBytes[this.charIndex];
		let t = e.exec(this.string);
		if (t === null) return rt;
		let m = t[0];
		return this.advance(this._charLength(m)), m;
	}
	consumeMatchFn(e) {
		let t = this.charIndex;
		for (; !this.isEnd && e(this.peek());) this.advance();
		return this.charIndex > t ? this.string.slice(this.charsToBytes[t], this.charsToBytes[this.charIndex]) : rt;
	}
	consumeString(e) {
		if (this.consumeStringFast(e)) return e;
		if (!this.multiByteMode) return rt;
		let { length: t } = e, m = this._charLength(e);
		return m !== t && e === this.peek(m) ? (this.advance(m), e) : rt;
	}
	consumeStringFast(e) {
		if (this.peek() === e[0]) {
			let { length: t } = e;
			if (t === 1) return this.advance(), e;
			if (this.peek(t) === e) return this.advance(t), e;
		}
		return rt;
	}
	consumeUntilMatch(e) {
		if (!e.global) throw Error("`regex` must have a global flag (\"g\")");
		let t = this.charsToBytes[this.charIndex];
		e.lastIndex = t;
		let m = e.exec(this.string);
		if (m === null || m.index === t) return rt;
		let v = this.string.slice(t, m.index);
		return this.advance(this._charLength(v)), v;
	}
	consumeUntilString(e) {
		let { charIndex: t, charsToBytes: m, string: v } = this, y = m[t], x = v.indexOf(e, y);
		if (x <= 0) return rt;
		let S = v.slice(y, x);
		return this.advance(this._charLength(S)), S;
	}
	peek(e = 1) {
		if (this.charIndex >= this.charCount) return rt;
		if (e === 1) return this.chars[this.charIndex];
		let { charsToBytes: t, charIndex: m } = this;
		return this.string.slice(t[m], t[m + e]);
	}
	reset(e = 0) {
		this.charIndex = e >= 0 ? Math.min(this.charCount, e) : Math.max(0, this.charIndex + e);
	}
}, it = StringScanner, at = Object.freeze(Object.assign(Object.create(null), {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	quot: "\""
}));
function isNameChar(e) {
	if (isNameStartChar(e)) return !0;
	let t = getCodePoint(e);
	return t === 45 || t === 46 || t >= 48 && t <= 57 || t === 183 || t >= 768 && t <= 879 || t >= 8255 && t <= 8256;
}
var ot = isNameChar;
function isNameStartChar(e) {
	let t = getCodePoint(e);
	return t === 58 || t === 95 || t >= 65 && t <= 90 || t >= 97 && t <= 122 || t >= 192 && t <= 214 || t >= 216 && t <= 246 || t >= 248 && t <= 767 || t >= 880 && t <= 893 || t >= 895 && t <= 8191 || t >= 8204 && t <= 8205 || t >= 8304 && t <= 8591 || t >= 11264 && t <= 12271 || t >= 12289 && t <= 55295 || t >= 63744 && t <= 64975 || t >= 65008 && t <= 65533 || t >= 65536 && t <= 983039;
}
var st = isNameStartChar;
function isNotXmlChar(e) {
	return !isXmlChar(e);
}
var ct = isNotXmlChar;
function isReferenceChar(e) {
	return e === "#" || isNameChar(e);
}
var lt = isReferenceChar;
function isWhitespace(e) {
	let t = getCodePoint(e);
	return t === 32 || t === 9 || t === 10 || t === 13;
}
var ut = isWhitespace;
function isXmlChar(e) {
	let t = getCodePoint(e);
	return t === 9 || t === 10 || t === 13 || t >= 32 && t <= 55295 || t >= 57344 && t <= 65533 || t >= 65536 && t <= 1114111;
}
var dt = isXmlChar;
function getCodePoint(e) {
	return e.codePointAt(0) || -1;
}
var ft = {
	predefinedEntities: at,
	isNameChar: ot,
	isNameStartChar: st,
	isNotXmlChar: ct,
	isReferenceChar: lt,
	isWhitespace: ut,
	isXmlChar: dt
}, XmlNode = class {
	constructor() {
		this.parent = null;
	}
	get document() {
		return this.parent ? this.parent.document : null;
	}
	get isRootNode() {
		return this.parent ? this.parent === this.document : !1;
	}
	get preserveWhitespace() {
		return !!(this.parent && this.parent.preserveWhitespace);
	}
	get type() {
		return "";
	}
	toJSON() {
		let e = { type: this.type };
		return this.isRootNode && (e.isRootNode = !0), this.preserveWhitespace && (e.preserveWhitespace = !0), e;
	}
};
XmlNode.TYPE_CDATA = "cdata", XmlNode.TYPE_COMMENT = "comment", XmlNode.TYPE_DOCUMENT = "document", XmlNode.TYPE_ELEMENT = "element", XmlNode.TYPE_PROCESSING_INSTRUCTION = "pi", XmlNode.TYPE_TEXT = "text";
var pt = XmlNode, XmlText = class extends pt {
	constructor(e = "") {
		super(), this.text = e;
	}
	get type() {
		return pt.TYPE_TEXT;
	}
	toJSON() {
		return Object.assign(pt.prototype.toJSON.call(this), { text: this.text });
	}
}, mt = XmlText, XmlCdata = class extends mt {
	get type() {
		return pt.TYPE_CDATA;
	}
}, ht = XmlCdata, XmlComment = class extends pt {
	constructor(e = "") {
		super(), this.content = e;
	}
	get type() {
		return pt.TYPE_COMMENT;
	}
	toJSON() {
		return Object.assign(pt.prototype.toJSON.call(this), { content: this.content });
	}
}, gt = XmlComment, _t = class XmlElement$1 extends pt {
	static {
		e(this, "XmlElement");
	}
	constructor(e, t = Object.create(null), m = []) {
		super(), this.name = e, this.attributes = t, this.children = m;
	}
	get isEmpty() {
		return this.children.length === 0;
	}
	get preserveWhitespace() {
		let e = this;
		for (; e instanceof XmlElement$1;) {
			if ("xml:space" in e.attributes) return e.attributes["xml:space"] === "preserve";
			e = e.parent;
		}
		return !1;
	}
	get text() {
		return this.children.map((e) => "text" in e ? e.text : "").join("");
	}
	get type() {
		return pt.TYPE_ELEMENT;
	}
	toJSON() {
		return Object.assign(pt.prototype.toJSON.call(this), {
			name: this.name,
			attributes: this.attributes,
			children: this.children.map((e) => e.toJSON())
		});
	}
}, XmlDocument$1 = class extends pt {
	static {
		e(this, "XmlDocument");
	}
	constructor(e = []) {
		super(), this.children = e;
	}
	get document() {
		return this;
	}
	get root() {
		return this.children.find((e) => e instanceof _t) || null;
	}
	get text() {
		return this.children.map((e) => "text" in e ? e.text : "").join("");
	}
	get type() {
		return pt.TYPE_DOCUMENT;
	}
	toJSON() {
		return Object.assign(pt.prototype.toJSON.call(this), { children: this.children.map((e) => e.toJSON()) });
	}
}, vt = XmlDocument$1, XmlProcessingInstruction = class extends pt {
	constructor(e, t = "") {
		super(), this.name = e, this.content = t;
	}
	get type() {
		return pt.TYPE_PROCESSING_INSTRUCTION;
	}
	toJSON() {
		return Object.assign(pt.prototype.toJSON.call(this), {
			name: this.name,
			content: this.content
		});
	}
}, yt = XmlProcessingInstruction, bt = "", Parser = class {
	constructor(e, t = {}) {
		for (this.document = new vt(), this.currentNode = this.document, this.options = t, this.scanner = new it(normalizeXmlString(e)), this.consumeProlog(), this.consumeElement() || this.error("Root element is missing or invalid"); this.consumeMisc(););
		this.scanner.isEnd || this.error("Extra content at the end of the document");
	}
	addNode(e) {
		e.parent = this.currentNode, this.currentNode.children.push(e);
	}
	addText(e) {
		let { children: t } = this.currentNode;
		if (t.length > 0) {
			let m = t[t.length - 1];
			if (m instanceof mt) {
				m.text += e;
				return;
			}
		}
		this.addNode(new mt(e));
	}
	consumeAttributeValue() {
		let { scanner: e } = this, t = e.peek();
		if (t !== "\"" && t !== "'") return !1;
		e.advance();
		let m, v = !1, y = bt, x = t === "\"" ? /[^"&<]+/y : /[^'&<]+/y;
		matchLoop: for (; !e.isEnd;) switch (m = e.consumeMatch(x), m && (this.validateChars(m), y += m.replace(/[\t\r\n]/g, " ")), e.peek()) {
			case t:
				v = !0;
				break matchLoop;
			case "&":
				y += this.consumeReference();
				continue;
			case "<":
				this.error("Unescaped `<` is not allowed in an attribute value");
				break;
			case bt: this.error("Unclosed attribute");
		}
		return v || this.error("Unclosed attribute"), e.advance(), y;
	}
	consumeCdataSection() {
		let { scanner: e } = this;
		if (!e.consumeStringFast("<![CDATA[")) return !1;
		let t = e.consumeUntilString("]]>");
		return this.validateChars(t), e.consumeStringFast("]]>") || this.error("Unclosed CDATA section"), this.options.preserveCdata ? this.addNode(new ht(t)) : this.addText(t), !0;
	}
	consumeCharData() {
		let { scanner: e } = this, t = e.consumeUntilMatch(/<|&|]]>/g);
		return t ? (this.validateChars(t), e.peek() === "]" && e.peek(3) === "]]>" && this.error("Element content may not contain the CDATA section close delimiter `]]>`"), this.addText(t), !0) : !1;
	}
	consumeComment() {
		let { scanner: e } = this;
		if (!e.consumeStringFast("<!--")) return !1;
		let t = e.consumeUntilString("--");
		return this.validateChars(t), e.consumeStringFast("-->") || (e.peek(2) === "--" ? this.error("The string `--` isn't allowed inside a comment") : this.error("Unclosed comment")), this.options.preserveComments && this.addNode(new gt(t.trim())), !0;
	}
	consumeContentReference() {
		let e = this.consumeReference();
		return e ? (this.addText(e), !0) : !1;
	}
	consumeDoctypeDeclaration() {
		let { scanner: e } = this;
		return !e.consumeStringFast("<!DOCTYPE") || !this.consumeWhitespace() ? !1 : (e.consumeMatch(/[^[>]+/y), e.consumeMatch(/\[[\s\S]+?\][\x20\t\r\n]*>/y) || e.consumeStringFast(">") || this.error("Unclosed doctype declaration"), !0);
	}
	consumeElement() {
		let { scanner: e } = this, t = e.charIndex;
		if (e.peek() !== "<") return !1;
		e.advance();
		let m = this.consumeName();
		if (!m) return e.reset(t), !1;
		let v = Object.create(null);
		for (; this.consumeWhitespace();) {
			let e = this.consumeName();
			if (!e) continue;
			let t = this.consumeEqual() && this.consumeAttributeValue();
			t === !1 && this.error("Attribute value expected"), e in v && this.error(`Duplicate attribute: ${e}`), e === "xml:space" && t !== "default" && t !== "preserve" && this.error("Value of the `xml:space` attribute must be \"default\" or \"preserve\""), v[e] = t;
		}
		if (this.options.sortAttributes) {
			let e = Object.keys(v).sort(), t = Object.create(null);
			for (let m = 0; m < e.length; ++m) {
				let y = e[m];
				t[y] = v[y];
			}
			v = t;
		}
		let y = !!e.consumeStringFast("/>"), x = new _t(m, v);
		if (x.parent = this.currentNode, !y) {
			for (e.consumeStringFast(">") || this.error(`Unclosed start tag for element \`${m}\``), this.currentNode = x, this.consumeCharData(); this.consumeElement() || this.consumeContentReference() || this.consumeCdataSection() || this.consumeProcessingInstruction() || this.consumeComment();) this.consumeCharData();
			let t = e.charIndex, v;
			(!e.consumeStringFast("</") || !(v = this.consumeName()) || v !== m) && (e.reset(t), this.error(`Missing end tag for element ${m}`)), this.consumeWhitespace(), e.consumeStringFast(">") || this.error(`Unclosed end tag for element ${m}`), this.currentNode = x.parent;
		}
		return this.addNode(x), !0;
	}
	consumeEqual() {
		return this.consumeWhitespace(), this.scanner.consumeStringFast("=") ? (this.consumeWhitespace(), !0) : !1;
	}
	consumeMisc() {
		return this.consumeComment() || this.consumeProcessingInstruction() || this.consumeWhitespace();
	}
	consumeName() {
		return ft.isNameStartChar(this.scanner.peek()) ? this.scanner.consumeMatchFn(ft.isNameChar) : bt;
	}
	consumeProcessingInstruction() {
		let { scanner: e } = this, t = e.charIndex;
		if (!e.consumeStringFast("<?")) return !1;
		let m = this.consumeName();
		if (m ? m.toLowerCase() === "xml" && (e.reset(t), this.error("XML declaration isn't allowed here")) : this.error("Invalid processing instruction"), !this.consumeWhitespace()) {
			if (e.consumeStringFast("?>")) return this.addNode(new yt(m)), !0;
			this.error("Whitespace is required after a processing instruction name");
		}
		let v = e.consumeUntilString("?>");
		return this.validateChars(v), e.consumeStringFast("?>") || this.error("Unterminated processing instruction"), this.addNode(new yt(m, v)), !0;
	}
	consumeProlog() {
		let { scanner: e } = this, t = e.charIndex;
		for (this.consumeXmlDeclaration(); this.consumeMisc(););
		if (this.consumeDoctypeDeclaration()) for (; this.consumeMisc(););
		return t < e.charIndex;
	}
	consumeReference() {
		let { scanner: e } = this;
		if (e.peek() !== "&") return !1;
		e.advance();
		let t = e.consumeMatchFn(ft.isReferenceChar);
		e.consume() !== ";" && this.error("Unterminated reference (a reference must end with `;`)");
		let m;
		if (t[0] === "#") {
			let e = t[1] === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
			isNaN(e) && this.error("Invalid character reference"), m = String.fromCodePoint(e), ft.isXmlChar(m) || this.error("Character reference resolves to an invalid character");
		} else if (m = ft.predefinedEntities[t], m === void 0) {
			let { ignoreUndefinedEntities: m, resolveUndefinedEntity: v } = this.options, y = `&${t};`;
			if (v) {
				let e = v(y);
				if (e != null) {
					let t = typeof e;
					if (t !== "string") throw TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${t}`);
					return e;
				}
			}
			if (m) return y;
			e.reset(-y.length), this.error(`Named entity isn't defined: ${y}`);
		}
		return m;
	}
	consumeSystemLiteral() {
		let { scanner: e } = this, t = e.consumeStringFast("\"") || e.consumeStringFast("'");
		if (!t) return !1;
		let m = e.consumeUntilString(t);
		return this.validateChars(m), e.consumeStringFast(t) || this.error("Missing end quote"), m;
	}
	consumeWhitespace() {
		return !!this.scanner.consumeMatchFn(ft.isWhitespace);
	}
	consumeXmlDeclaration() {
		let { scanner: e } = this;
		if (!e.consumeStringFast("<?xml")) return !1;
		this.consumeWhitespace() || this.error("Invalid XML declaration");
		let t = !!e.consumeStringFast("version") && this.consumeEqual() && this.consumeSystemLiteral();
		if (t === !1 ? this.error("XML version is missing or invalid") : /^1\.[0-9]+$/.test(t) || this.error("Invalid character in version number"), this.consumeWhitespace()) {
			e.consumeStringFast("encoding") && this.consumeEqual() && this.consumeSystemLiteral() && this.consumeWhitespace();
			let t = !!e.consumeStringFast("standalone") && this.consumeEqual() && this.consumeSystemLiteral();
			t && (t !== "yes" && t !== "no" && this.error("Only \"yes\" and \"no\" are permitted as values of `standalone`"), this.consumeWhitespace());
		}
		return e.consumeStringFast("?>") || this.error("Invalid or unclosed XML declaration"), !0;
	}
	error(e) {
		let { charIndex: t, string: m } = this.scanner, v = 1, y = "", x = 1;
		for (let e = 0; e < t; ++e) {
			let t = m[e];
			t === "\n" ? (v = 1, y = "", x += 1) : (v += 1, y += t);
		}
		let S = m.indexOf("\n", t);
		y += S === -1 ? m.slice(t) : m.slice(t, S);
		let C = 0;
		y.length > 50 && (v < 40 ? y = y.slice(0, 50) : (C = v - 20, y = y.slice(C, v + 30)));
		let w = /* @__PURE__ */ Error(`${e} (line ${x}, column ${v})\n  ${y}\n` + " ".repeat(v - C + 1) + "^\n");
		throw Object.assign(w, {
			column: v,
			excerpt: y,
			line: x,
			pos: t
		}), w;
	}
	validateChars(e) {
		let t = 0;
		for (let m of e) ft.isNotXmlChar(m) && (this.scanner.reset(-([...e].length - t)), this.error("Invalid character")), t += 1;
	}
}, xt = Parser;
function normalizeXmlString(e) {
	return e[0] === "﻿" && (e = e.slice(1)), e.replace(/\r\n?/g, "\n");
}
//#endregion
//#region src/vendor/webamp-modern/_snowpack/pkg/@rgrove/parse-xml.js
function parseXml(e, t) {
	return new xt(e, t).document;
}
parseXml.XmlCdata = ht, parseXml.XmlComment = gt, parseXml.XmlDocument = vt, parseXml.XmlElement = _t, parseXml.XmlNode = pt, parseXml.XmlProcessingInstruction = yt, parseXml.XmlText = mt;
var St = parseXml, Ct = St.XmlDocument, wt = St.XmlElement, WindowHolder = class extends Fe {
	constructor() {
		super(...arguments), this._hostEl = null, this._hostAsked = !1;
	}
	setXmlAttr(e, t) {
		let m = e.toLowerCase();
		if (super.setXmlAttr(m, t)) return !0;
		switch (m) {
			case "hold":
				this._hold = t.toLowerCase(), this._buildConent();
				break;
			default: return !1;
		}
		return !0;
	}
	getguid() {
		return this._hold;
	}
	getcontent() {
		return this._heldObj;
	}
	_syncHold() {
		if (!this._hold) return;
		let e = this.isEffectivelyVisible();
		if (e && !this._hostEl) {
			let e = this._uiRoot.guid2alias(this._hold), t = this._uiRoot.holdWindow?.(e, this._hold, this);
			this._hostAsked = !0, t instanceof HTMLElement && (this._hostEl = t, t.classList.add("webamp-modern-hosted-window"), t.style.position = "absolute", t.style.inset = "0", this._div.appendChild(t));
		} else !e && this._hostEl && (this._uiRoot.releaseWindow?.(this._hold, this._hostEl), this._hostEl.remove(), this._hostEl = null);
	}
	_visibilityChanged() {
		super._visibilityChanged(), this._inited && this._syncHold();
	}
	init() {
		super.init(), this._syncHold();
	}
	_buildConent() {
		switch (this._uiRoot.guid2alias(this._hold)) {
			case "avs":
			case "vis":
				let e = new Avs(this._uiRoot), t = new wt("dummy", { fitparent: "1" });
				e.setXmlAttributes(t.attributes), this.addChild(e), this._heldObj = e;
		}
	}
	dispose() {
		this._hostEl &&= (this._uiRoot.releaseWindow?.(this._hold, this._hostEl), null), super.dispose?.();
	}
	getcomponentname() {
		return this._heldObj ? this._heldObj._name : "";
	}
};
WindowHolder.GUID = "403abcc04bd66f22c810a48b47259329";
//#endregion
//#region src/vendor/webamp-modern/skin/SkinEngine.js
var SkinEngine = class {
	constructor(e) {
		this._uiRoot = e, this._imageManager = e.getImageManager();
	}
	getFileExtractor() {
		return null;
	}
	async buildUI() {
		let e = this._uiRoot;
		this._uiRoot.logMessage("Parsing XML and initializing images..."), await this.parseSkin(), e.loadTrueTypeFonts(), e.enableDefaultGammaSet(), e.logMessage("Rendering skin for the first time..."), e.draw(), e.init(), e.logMessage("");
	}
	async parseSkin() {}
	addToGroup(e, t) {
		try {
			t.addChild(e);
		} catch {
			console.warn("addToGroup failed. child:", e, "pareng:", t);
		}
	}
	async newGui(e, t, m) {
		let v = new e(this._uiRoot);
		return v.setXmlAttributes(t.attributes), m != null && this.addToGroup(v, m), v;
	}
	async newGroup(e, t, m) {
		return await this.newGui(e, t, m);
	}
	async bitmap(e) {
		let t = new Bitmap();
		return t.setXmlAttributes(e.attributes), this._uiRoot.addBitmap(t), await t.ensureImageLoaded(this._imageManager), t;
	}
	async bitmapFont(e) {
		let t = new BitmapFont(this._uiRoot);
		return t.setXmlAttributes(e.attributes), this._uiRoot.addFont(t), await t.ensureImageLoaded(this._imageManager), t;
	}
	async text(e, t) {
		return this.newGui(Text, e, t);
	}
	async button(e, t) {
		return await this.newGui(Button, e, t);
	}
	async animatedLayer(e, t) {
		return this.newGui(AnimatedLayer, e, t);
	}
	async layer(e, t) {
		return this.newGui(Layer, e, t);
	}
	async group(e, t) {
		return await this.newGroup(Fe, e, t);
	}
	async layout(e, t) {
		return this.newGroup(Layout, e, t);
	}
	async container(e) {
		let t = new Container(this._uiRoot);
		return t.setXmlAttributes(e.attributes), this._uiRoot.addContainers(t), t;
	}
};
SkinEngine.canProcess = (e) => !1, SkinEngine.identifyByFile = (e) => "skin.xml", SkinEngine.priority = 100;
var Tt = [], registerSkinEngine = (e) => {
	Tt.push(e);
};
async function getSkinEngineClass(e) {
	let t = [];
	if (Tt.sort((e, t) => e.priority - t.priority), e.endsWith("/")) for (let t of Tt) {
		let m = t.identifyByFile(e);
		if (m && (await fetch(e + m)).status == 200) return [t];
	}
	for (let m of Tt) m.canProcess(e) && t.push(m);
	return t;
}
async function getSkinEngineClassByContent(e, t, m) {
	for (let v of e) {
		let e = v.identifyByFile(t);
		if (await m.getFileAsString(e) != null) return v;
	}
}
//#endregion
//#region src/vendor/webamp-modern/skin/GammaGroup.js
var GammaGroup = class {
	constructor() {
		this._boost = 0, this._gray = 0;
	}
	setXmlAttributes(e) {
		for (let [t, m] of Object.entries(e)) this.setXmlAttr(t, m);
	}
	setXmlAttr(e, t) {
		switch (e.toLowerCase()) {
			case "id":
				this._id = t;
				break;
			case "value":
				this._value = t;
				break;
			case "boost":
				this._boost = num(t);
				break;
			case "gray": this._gray = num(t);
			default: return !1;
		}
		return !0;
	}
	getId() {
		return this._id;
	}
	getDomId() {
		return normalizeDomId(this._id);
	}
	getRgb() {
		return `rgb(${this._value})`;
	}
	transformImage(e, t, m, v, y) {
		let [x, S, C] = this._value.split(",").map((e) => Number(e) / 4096 + 1), w = v || e.width, E = y || e.height, O = t ? -t : 0, k = m ? -m : 0, ee = document.createElement("canvas");
		ee.width = w, ee.height = E;
		let I = ee.getContext("2d");
		I.clearRect(0, 0, ee.width, ee.height), I.drawImage(e, O, k);
		let z = I.getImageData(0, 0, w, E), te = z.data;
		for (var ne = 0; ne < te.length; ne += 4) {
			let [e, t, m] = [
				te[ne],
				te[ne + 1],
				te[ne + 2]
			];
			this._gray != 0 && (this._gray == 2 && (e = (e + t + m) / 3), this._gray == 1 && (e = Math.max(e, t, m)), t = e, m = e);
			let v = this._boost == 2 ? 4 : 1, y = this._boost == 1 ? 128 : this._boost == 2 ? 32 : 0;
			te[ne + 0] = clamp((e + y) * v * x, 0, 255), te[ne + 1] = clamp((t + y) * v * S, 0, 255), te[ne + 2] = clamp((m + y) * v * C, 0, 255);
		}
		return I.putImageData(z, 0, 0), ee.toDataURL();
	}
	transformColor2rgb(e) {
		let [t, m, v] = this._value.split(",").map((e) => Number(e) / 4096 + 1), [y, x, S] = e.split(",").map((e) => parseInt(e));
		this._gray != 0 && (this._gray == 2 && (y = (y + x + S) / 3), this._gray == 1 && (y = Math.max(y, x, S)), x = y, S = y);
		let C = this._boost == 2 ? 4 : 1, w = this._boost == 1 ? 128 : this._boost == 2 ? 32 : 0;
		return y = clamp((y + w) * C * t, 0, 255), x = clamp((x + w) * C * m, 0, 255), S = clamp((S + w) * C * v, 0, 255), [
			y,
			x,
			S
		];
	}
	transformColor(e) {
		let [t, m, v] = this.transformColor2rgb(e);
		return `rgb(${t}, ${m}, ${v})`;
	}
};
//#endregion
export { ZipFileExtractor as $, PopupMenu as A, Config as B, Timer as C, TrueTypeFont as D, genCssVar as E, Container as F, GuiObj as G, ConfigAttribute as H, SystemObject as I, BaseObject as J, getDefaultAudioPlayer as K, Application as L, Layer as M, Layout as N, Status as O, Fe as P, PathFileExtractor as Q, WinampConfig as R, Text as S, Bitmap as T, Me as U, ConfigItem as V, Button as W, getMethod as X, getClass as Y, getReturnType as Z, Vis as _, registerSkinEngine as a, num as at, Menu as b, wt as c, toBool as ct, WasabiTitleBar as d, getDefaultExportFromCjs as dt, Emitter as et, XuiElement as f, EqVis as g, ComponentBucket as h, getSkinEngineClassByContent as i, integerToTime as it, AnimatedLayer as j, ToggleButton as k, St as l, t as lt, AlbumArt as m, SkinEngine as n, assume as nt, WindowHolder as o, px as ot, PlayListGui as p, Ce as q, getSkinEngineClass as r, findLast as rt, Ct as s, removeAllChildNodes as st, GammaGroup as t, assert as tt, Avs as u, createCommonjsModule as ut, Slider as v, BitmapFont as w, getWa5Popup as x, Frame as y, WinampConfigGroup as z };
