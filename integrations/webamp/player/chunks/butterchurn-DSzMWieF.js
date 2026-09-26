import "./rolldown-runtime-ly0BBW_k.js";
import { dt as e, ut as t } from "./GammaGroup-BUFdecwO.js";
//#region src/vendor/webamp-modern/_snowpack/pkg/butterchurn.js
var n = t(function(e, t) {
	(function webpackUniversalModuleDefinition(t, n) {
		e.exports = n();
	})(window, function() {
		return (function(e) {
			var t = {};
			function __webpack_require__(n) {
				if (t[n]) return t[n].exports;
				var r = t[n] = {
					i: n,
					l: !1,
					exports: {}
				};
				return e[n].call(r.exports, r, r.exports, __webpack_require__), r.l = !0, r.exports;
			}
			return __webpack_require__.m = e, __webpack_require__.c = t, __webpack_require__.d = function(e, t, n) {
				__webpack_require__.o(e, t) || Object.defineProperty(e, t, {
					enumerable: !0,
					get: n
				});
			}, __webpack_require__.r = function(e) {
				typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e, "__esModule", { value: !0 });
			}, __webpack_require__.t = function(e, t) {
				if (t & 1 && (e = __webpack_require__(e)), t & 8 || t & 4 && typeof e == "object" && e && e.__esModule) return e;
				var n = Object.create(null);
				if (__webpack_require__.r(n), Object.defineProperty(n, "default", {
					enumerable: !0,
					value: e
				}), t & 2 && typeof e != "string") for (var r in e) __webpack_require__.d(n, r, function(t) {
					return e[t];
				}.bind(null, r));
				return n;
			}, __webpack_require__.n = function(e) {
				var t = e && e.__esModule ? function getDefault() {
					return e.default;
				} : function getModuleExports() {
					return e;
				};
				return __webpack_require__.d(t, "a", t), t;
			}, __webpack_require__.o = function(e, t) {
				return Object.prototype.hasOwnProperty.call(e, t);
			}, __webpack_require__.p = "", __webpack_require__(__webpack_require__.s = "./src/index.js");
		})({
			"./node_modules/ecma-proposal-math-extensions/reference-implementation/index.js": (function(e, t, n) {
				{
					let defineMath = (e, t) => {
						Object.defineProperty(Math, e, {
							configurable: typeof t == "function",
							enumerable: typeof t == "function",
							writable: typeof t == "function",
							value: t
						});
					};
					defineMath("DEG_PER_RAD", Math.PI / 180), defineMath("RAD_PER_DEG", 180 / Math.PI);
					let e = /* @__PURE__ */ new Float32Array(1);
					defineMath("scale", function scale(e, t, n, r, i) {
						return arguments.length === 0 || Number.isNaN(e) || Number.isNaN(t) || Number.isNaN(n) || Number.isNaN(r) || Number.isNaN(i) ? NaN : e === Infinity || e === -Infinity ? e : (e - t) * (i - r) / (n - t) + r;
					}), defineMath("fscale", function fscale(t, n, r, i, a) {
						return e[0] = Math.scale(t, n, r, i, a), e[0];
					}), defineMath("clamp", function clamp(e, t, n) {
						return Math.min(n, Math.max(t, e));
					}), defineMath("radians", function radians(e) {
						return e * Math.DEG_PER_RAD;
					}), defineMath("degrees", function degrees(e) {
						return e * Math.RAD_PER_DEG;
					});
				}
			}),
			"./src/audio/audioLevels.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function AudioLevels(e) {
						_classCallCheck(this, AudioLevels), this.audio = e;
						var t = (this.audio.audioContext ? this.audio.audioContext.sampleRate : 44100) / this.audio.fftSize, n = Math.clamp(Math.round(20 / t) - 1, 0, this.audio.numSamps - 1), r = Math.clamp(Math.round(320 / t) - 1, 0, this.audio.numSamps - 1), i = Math.clamp(Math.round(2800 / t) - 1, 0, this.audio.numSamps - 1), a = Math.clamp(Math.round(11025 / t) - 1, 0, this.audio.numSamps - 1);
						this.starts = [
							n,
							r,
							i
						], this.stops = [
							r,
							i,
							a
						], this.val = /* @__PURE__ */ new Float32Array(3), this.imm = /* @__PURE__ */ new Float32Array(3), this.att = /* @__PURE__ */ new Float32Array(3), this.avg = /* @__PURE__ */ new Float32Array(3), this.longAvg = /* @__PURE__ */ new Float32Array(3), this.att.fill(1), this.avg.fill(1), this.longAvg.fill(1);
					}
					return _createClass(AudioLevels, [
						{
							key: "updateAudioLevels",
							value: function updateAudioLevels(e, t) {
								if (this.audio.freqArray.length > 0) {
									var n = e;
									!AudioLevels.isFiniteNumber(n) || n < 15 ? n = 15 : n > 144 && (n = 144), this.imm.fill(0);
									for (var r = 0; r < 3; r++) for (var i = this.starts[r]; i < this.stops[r]; i++) this.imm[r] += this.audio.freqArray[i];
									for (var a = 0; a < 3; a++) {
										var o = void 0;
										o = this.imm[a] > this.avg[a] ? .2 : .5, o = AudioLevels.adjustRateToFPS(o, 30, n), this.avg[a] = this.avg[a] * o + this.imm[a] * (1 - o), o = t < 50 ? .9 : .992, o = AudioLevels.adjustRateToFPS(o, 30, n), this.longAvg[a] = this.longAvg[a] * o + this.imm[a] * (1 - o), this.longAvg[a] < .001 ? (this.val[a] = 1, this.att[a] = 1) : (this.val[a] = this.imm[a] / this.longAvg[a], this.att[a] = this.avg[a] / this.longAvg[a]);
									}
								}
							}
						},
						{
							key: "bass",
							get: function get() {
								return this.val[0];
							}
						},
						{
							key: "bass_att",
							get: function get() {
								return this.att[0];
							}
						},
						{
							key: "mid",
							get: function get() {
								return this.val[1];
							}
						},
						{
							key: "mid_att",
							get: function get() {
								return this.att[1];
							}
						},
						{
							key: "treb",
							get: function get() {
								return this.val[2];
							}
						},
						{
							key: "treb_att",
							get: function get() {
								return this.att[2];
							}
						}
					], [{
						key: "isFiniteNumber",
						value: function isFiniteNumber(e) {
							return Number.isFinite(e) && !Number.isNaN(e);
						}
					}, {
						key: "adjustRateToFPS",
						value: function adjustRateToFPS(e, t, n) {
							return e ** +(t / n);
						}
					}]), AudioLevels;
				}();
			}),
			"./src/audio/audioProcessor.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/audio/fft.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function AudioProcessor(e) {
						_classCallCheck(this, AudioProcessor), this.numSamps = 512, this.fftSize = this.numSamps * 2, this.fft = new r.default(this.fftSize, 512, !0), e && (this.audioContext = e, this.audible = e.createDelay(), this.analyser = e.createAnalyser(), this.analyser.smoothingTimeConstant = 0, this.analyser.fftSize = this.fftSize, this.audible.connect(this.analyser), this.analyserL = e.createAnalyser(), this.analyserL.smoothingTimeConstant = 0, this.analyserL.fftSize = this.fftSize, this.analyserR = e.createAnalyser(), this.analyserR.smoothingTimeConstant = 0, this.analyserR.fftSize = this.fftSize, this.splitter = e.createChannelSplitter(2), this.audible.connect(this.splitter), this.splitter.connect(this.analyserL, 0), this.splitter.connect(this.analyserR, 1)), this.timeByteArray = new Uint8Array(this.fftSize), this.timeByteArrayL = new Uint8Array(this.fftSize), this.timeByteArrayR = new Uint8Array(this.fftSize), this.timeArray = new Int8Array(this.fftSize), this.timeByteArraySignedL = new Int8Array(this.fftSize), this.timeByteArraySignedR = new Int8Array(this.fftSize), this.tempTimeArrayL = new Int8Array(this.fftSize), this.tempTimeArrayR = new Int8Array(this.fftSize), this.timeArrayL = new Int8Array(this.numSamps), this.timeArrayR = new Int8Array(this.numSamps);
					}
					return _createClass(AudioProcessor, [
						{
							key: "sampleAudio",
							value: function sampleAudio() {
								this.analyser.getByteTimeDomainData(this.timeByteArray), this.analyserL.getByteTimeDomainData(this.timeByteArrayL), this.analyserR.getByteTimeDomainData(this.timeByteArrayR), this.processAudio();
							}
						},
						{
							key: "updateAudio",
							value: function updateAudio(e, t, n) {
								this.timeByteArray.set(e), this.timeByteArrayL.set(t), this.timeByteArrayR.set(n), this.processAudio();
							}
						},
						{
							key: "processAudio",
							value: function processAudio() {
								for (var e = 0, t = 0, n = 0; e < this.fftSize; e++) this.timeArray[e] = this.timeByteArray[e] - 128, this.timeByteArraySignedL[e] = this.timeByteArrayL[e] - 128, this.timeByteArraySignedR[e] = this.timeByteArrayR[e] - 128, this.tempTimeArrayL[e] = .5 * (this.timeByteArraySignedL[e] + this.timeByteArraySignedL[n]), this.tempTimeArrayR[e] = .5 * (this.timeByteArraySignedR[e] + this.timeByteArraySignedR[n]), e % 2 == 0 && (this.timeArrayL[t] = this.tempTimeArrayL[e], this.timeArrayR[t] = this.tempTimeArrayR[e], t += 1), n = e;
								this.freqArray = this.fft.timeToFrequencyDomain(this.timeArray), this.freqArrayL = this.fft.timeToFrequencyDomain(this.timeByteArraySignedL), this.freqArrayR = this.fft.timeToFrequencyDomain(this.timeByteArraySignedR);
							}
						},
						{
							key: "connectAudio",
							value: function connectAudio(e) {
								e.connect(this.audible);
							}
						},
						{
							key: "disconnectAudio",
							value: function disconnectAudio(e) {
								e.disconnect(this.audible);
							}
						}
					]), AudioProcessor;
				}();
			}),
			"./src/audio/fft.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function FFT(e, t) {
						var n = arguments.length > 2 && arguments[2] !== void 0 && arguments[2];
						_classCallCheck(this, FFT), this.samplesIn = e, this.samplesOut = t, this.equalize = n, this.NFREQ = t * 2, this.equalize && this.initEqualizeTable(), this.initBitRevTable(), this.initCosSinTable();
					}
					return _createClass(FFT, [
						{
							key: "initEqualizeTable",
							value: function initEqualizeTable() {
								this.equalizeArr = new Float32Array(this.samplesOut);
								for (var e = 1 / this.samplesOut, t = 0; t < this.samplesOut; t++) this.equalizeArr[t] = -.02 * Math.log((this.samplesOut - t) * e);
							}
						},
						{
							key: "initBitRevTable",
							value: function initBitRevTable() {
								this.bitrevtable = new Uint16Array(this.NFREQ);
								for (var e = 0; e < this.NFREQ; e++) this.bitrevtable[e] = e;
								for (var t = 0, n = 0; n < this.NFREQ; n++) {
									if (t > n) {
										var r = this.bitrevtable[n];
										this.bitrevtable[n] = this.bitrevtable[t], this.bitrevtable[t] = r;
									}
									for (var i = this.NFREQ >> 1; i >= 1 && t >= i;) t -= i, i >>= 1;
									t += i;
								}
							}
						},
						{
							key: "initCosSinTable",
							value: function initCosSinTable() {
								for (var e = 2, t = 0; e <= this.NFREQ;) t += 1, e <<= 1;
								this.cossintable = [new Float32Array(t), new Float32Array(t)], e = 2;
								for (var n = 0; e <= this.NFREQ;) {
									var r = -2 * Math.PI / e;
									this.cossintable[0][n] = Math.cos(r), this.cossintable[1][n] = Math.sin(r), n += 1, e <<= 1;
								}
							}
						},
						{
							key: "timeToFrequencyDomain",
							value: function timeToFrequencyDomain(e) {
								for (var t = new Float32Array(this.NFREQ), n = new Float32Array(this.NFREQ), r = 0; r < this.NFREQ; r++) {
									var i = this.bitrevtable[r];
									i < this.samplesIn ? t[r] = e[i] : t[r] = 0, n[r] = 0;
								}
								for (var a = 2, o = 0; a <= this.NFREQ;) {
									for (var s = this.cossintable[0][o], c = this.cossintable[1][o], l = 1, u = 0, d = a >> 1, f = 0; f < d; f++) {
										for (var p = f; p < this.NFREQ; p += a) {
											var m = p + d, h = l * t[m] - u * n[m], g = l * n[m] + u * t[m];
											t[m] = t[p] - h, n[m] = n[p] - g, t[p] += h, n[p] += g;
										}
										var _ = l;
										l = _ * s - u * c, u = u * s + _ * c;
									}
									a <<= 1, o += 1;
								}
								var v = new Float32Array(this.samplesOut);
								if (this.equalize) for (var y = 0; y < this.samplesOut; y++) v[y] = this.equalizeArr[y] * Math.sqrt(t[y] * t[y] + n[y] * n[y]);
								else for (var b = 0; b < this.samplesOut; b++) v[b] = Math.sqrt(t[b] * t[b] + n[b] * n[b]);
								return v;
							}
						}
					]), FFT;
				}();
			}),
			"./src/blankPreset.js": (function(e, t, n) {
				var r = (function() {
					"use strict;";
					return {
						baseVals: {
							gammaadj: 1.25,
							wave_g: .5,
							mv_x: 12,
							warpscale: 1,
							brighten: 0,
							mv_y: 9,
							wave_scale: 1,
							echo_alpha: 0,
							additivewave: 0,
							sx: 1,
							sy: 1,
							warp: .01,
							red_blue: 0,
							wave_mode: 0,
							wave_brighten: 0,
							wrap: 0,
							zoomexp: 1,
							fshader: 0,
							wave_r: .5,
							echo_zoom: 1,
							wave_smoothing: .75,
							warpanimspeed: 1,
							wave_dots: 0,
							wave_x: .5,
							wave_y: .5,
							zoom: 1,
							solarize: 0,
							modwavealphabyvolume: 0,
							dx: 0,
							cx: .5,
							dy: 0,
							darken_center: 0,
							cy: .5,
							invert: 0,
							bmotionvectorson: 0,
							rot: 0,
							modwavealphaend: .95,
							wave_mystery: -.2,
							decay: .9,
							wave_a: 1,
							wave_b: .5,
							rating: 5,
							modwavealphastart: .75,
							darken: 0,
							echo_orient: 0,
							ib_r: .5,
							ib_g: .5,
							ib_b: .5,
							ib_a: 0,
							ib_size: 0,
							ob_r: .5,
							ob_g: .5,
							ob_b: .5,
							ob_a: 0,
							ob_size: 0,
							mv_dx: 0,
							mv_dy: 0,
							mv_a: 0,
							mv_r: .5,
							mv_g: .5,
							mv_b: .5,
							mv_l: 0
						},
						init_eqs: function init_eqs() {
							return {};
						},
						frame_eqs: function frame_eqs(e) {
							return e.rkeys = ["warp"], e.zoom = 1.01 + .02 * e.treb_att, e.warp = .15 + .25 * e.bass_att, e;
						},
						pixel_eqs: function pixel_eqs(e) {
							return e.warp += e.rad * .15, e;
						},
						waves: [
							{
								baseVals: {
									a: 1,
									enabled: 0,
									b: 1,
									g: 1,
									scaling: 1,
									samples: 512,
									additive: 0,
									usedots: 0,
									spectrum: 0,
									r: 1,
									smoothing: .5,
									thick: 0,
									sep: 0
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								},
								point_eqs: ""
							},
							{
								baseVals: {
									a: 1,
									enabled: 0,
									b: 1,
									g: 1,
									scaling: 1,
									samples: 512,
									additive: 0,
									usedots: 0,
									spectrum: 0,
									r: 1,
									smoothing: .5,
									thick: 0,
									sep: 0
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								},
								point_eqs: ""
							},
							{
								baseVals: {
									a: 1,
									enabled: 0,
									b: 1,
									g: 1,
									scaling: 1,
									samples: 512,
									additive: 0,
									usedots: 0,
									spectrum: 0,
									r: 1,
									smoothing: .5,
									thick: 0,
									sep: 0
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								},
								point_eqs: ""
							},
							{
								baseVals: {
									a: 1,
									enabled: 0,
									b: 1,
									g: 1,
									scaling: 1,
									samples: 512,
									additive: 0,
									usedots: 0,
									spectrum: 0,
									r: 1,
									smoothing: .5,
									thick: 0,
									sep: 0
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								},
								point_eqs: ""
							}
						],
						shapes: [
							{
								baseVals: {
									r2: 0,
									a: 1,
									enabled: 0,
									b: 0,
									tex_ang: 0,
									thickoutline: 0,
									g: 0,
									textured: 0,
									g2: 1,
									tex_zoom: 1,
									additive: 0,
									border_a: .1,
									border_b: 1,
									b2: 0,
									a2: 0,
									r: 1,
									border_g: 1,
									rad: .1,
									x: .5,
									y: .5,
									ang: 0,
									sides: 4,
									border_r: 1
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								}
							},
							{
								baseVals: {
									r2: 0,
									a: 1,
									enabled: 0,
									b: 0,
									tex_ang: 0,
									thickoutline: 0,
									g: 0,
									textured: 0,
									g2: 1,
									tex_zoom: 1,
									additive: 0,
									border_a: .1,
									border_b: 1,
									b2: 0,
									a2: 0,
									r: 1,
									border_g: 1,
									rad: .1,
									x: .5,
									y: .5,
									ang: 0,
									sides: 4,
									border_r: 1
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								}
							},
							{
								baseVals: {
									r2: 0,
									a: 1,
									enabled: 0,
									b: 0,
									tex_ang: 0,
									thickoutline: 0,
									g: 0,
									textured: 0,
									g2: 1,
									tex_zoom: 1,
									additive: 0,
									border_a: .1,
									border_b: 1,
									b2: 0,
									a2: 0,
									r: 1,
									border_g: 1,
									rad: .1,
									x: .5,
									y: .5,
									ang: 0,
									sides: 4,
									border_r: 1
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								}
							},
							{
								baseVals: {
									r2: 0,
									a: 1,
									enabled: 0,
									b: 0,
									tex_ang: 0,
									thickoutline: 0,
									g: 0,
									textured: 0,
									g2: 1,
									tex_zoom: 1,
									additive: 0,
									border_a: .1,
									border_b: 1,
									b2: 0,
									a2: 0,
									r: 1,
									border_g: 1,
									rad: .1,
									x: .5,
									y: .5,
									ang: 0,
									sides: 4,
									border_r: 1
								},
								init_eqs: function init_eqs(e) {
									return e.rkeys = [], e;
								},
								frame_eqs: function frame_eqs(e) {
									return e;
								}
							}
						],
						warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb;\nret -= 0.004;\n}\n",
						comp: "shader_body {\nret = texture2D(sampler_main, uv).rgb;\nret *= hue_shader;\n}\n"
					};
				}).apply(t, []);
				r !== void 0 && (e.exports = r);
			}),
			"./src/equations/presetEquationRunner.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/utils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function PresetEquationRunner(e, t, n) {
						_classCallCheck(this, PresetEquationRunner), this.preset = e, this.texsizeX = n.texsizeX, this.texsizeY = n.texsizeY, this.mesh_width = n.mesh_width, this.mesh_height = n.mesh_height, this.aspectx = n.aspectx, this.aspecty = n.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.qs = r.default.range(1, 33).map(function(e) {
							return `q${e}`;
						}), this.ts = r.default.range(1, 9).map(function(e) {
							return `t${e}`;
						}), this.regs = r.default.range(100).map(function(e) {
							return e < 10 ? `reg0${e}` : `reg${e}`;
						}), this.initializeEquations(t);
					}
					return _createClass(PresetEquationRunner, [
						{
							key: "initializeEquations",
							value: function initializeEquations(e) {
								this.runVertEQs = this.preset.pixel_eqs !== "", this.mdVSQInit = null, this.mdVSRegs = null, this.mdVSFrame = null, this.mdVSUserKeys = null, this.mdVSFrameMap = null, this.mdVSShapes = null, this.mdVSUserKeysShapes = null, this.mdVSFrameMapShapes = null, this.mdVSWaves = null, this.mdVSUserKeysWaves = null, this.mdVSFrameMapWaves = null, this.mdVSQAfterFrame = null, this.gmegabuf = Array(1048576).fill(0);
								var t = {
									frame: e.frame,
									time: e.time,
									fps: e.fps,
									bass: e.bass,
									bass_att: e.bass_att,
									mid: e.mid,
									mid_att: e.mid_att,
									treb: e.treb,
									treb_att: e.treb_att,
									meshx: this.mesh_width,
									meshy: this.mesh_height,
									aspectx: this.invAspectx,
									aspecty: this.invAspecty,
									pixelsx: this.texsizeX,
									pixelsy: this.texsizeY,
									gmegabuf: this.gmegabuf
								};
								this.mdVS = Object.assign({}, this.preset.baseVals, t), this.mdVS.megabuf = Array(1048576).fill(0), this.mdVS.rand_start = new Float32Array([
									Math.random(),
									Math.random(),
									Math.random(),
									Math.random()
								]), this.mdVS.rand_preset = new Float32Array([
									Math.random(),
									Math.random(),
									Math.random(),
									Math.random()
								]);
								var n = this.qs.concat(this.regs, Object.keys(this.mdVS)), i = this.preset.init_eqs(r.default.cloneVars(this.mdVS));
								this.mdVSQInit = r.default.pick(i, this.qs), this.mdVSRegs = r.default.pick(i, this.regs);
								var a = r.default.pick(i, Object.keys(r.default.omit(i, n)));
								if (a.megabuf = i.megabuf, a.gmegabuf = i.gmegabuf, this.mdVSFrame = this.preset.frame_eqs(Object.assign({}, this.mdVS, this.mdVSQInit, this.mdVSRegs, a)), this.mdVSUserKeys = Object.keys(r.default.omit(this.mdVSFrame, n)), this.mdVSFrameMap = r.default.pick(this.mdVSFrame, this.mdVSUserKeys), this.mdVSQAfterFrame = r.default.pick(this.mdVSFrame, this.qs), this.mdVSRegs = r.default.pick(this.mdVSFrame, this.regs), this.mdVSWaves = [], this.mdVSTWaveInits = [], this.mdVSUserKeysWaves = [], this.mdVSFrameMapWaves = [], this.preset.waves && this.preset.waves.length > 0) for (var o = 0; o < this.preset.waves.length; o++) {
									var s = this.preset.waves[o], c = s.baseVals;
									if (c.enabled !== 0) {
										var l = Object.assign({}, c, t), u = this.qs.concat(this.ts, this.regs, Object.keys(l));
										Object.assign(l, this.mdVSQAfterFrame, this.mdVSRegs), l.megabuf = Array(1048576).fill(0), s.init_eqs && (l = s.init_eqs(l), this.mdVSRegs = r.default.pick(l, this.regs), Object.assign(l, c)), this.mdVSWaves.push(l), this.mdVSTWaveInits.push(r.default.pick(l, this.ts)), this.mdVSUserKeysWaves.push(Object.keys(r.default.omit(l, u))), this.mdVSFrameMapWaves.push(r.default.pick(l, this.mdVSUserKeysWaves[o]));
									} else this.mdVSWaves.push({}), this.mdVSTWaveInits.push({}), this.mdVSUserKeysWaves.push([]), this.mdVSFrameMapWaves.push({});
								}
								if (this.mdVSShapes = [], this.mdVSTShapeInits = [], this.mdVSUserKeysShapes = [], this.mdVSFrameMapShapes = [], this.preset.shapes && this.preset.shapes.length > 0) for (var d = 0; d < this.preset.shapes.length; d++) {
									var f = this.preset.shapes[d], p = f.baseVals;
									if (p.enabled !== 0) {
										var m = Object.assign({}, p, t), h = this.qs.concat(this.ts, this.regs, Object.keys(m));
										Object.assign(m, this.mdVSQAfterFrame, this.mdVSRegs), m.megabuf = Array(1048576).fill(0), f.init_eqs && (m = f.init_eqs(m), this.mdVSRegs = r.default.pick(m, this.regs), Object.assign(m, p)), this.mdVSShapes.push(m), this.mdVSTShapeInits.push(r.default.pick(m, this.ts)), this.mdVSUserKeysShapes.push(Object.keys(r.default.omit(m, h))), this.mdVSFrameMapShapes.push(r.default.pick(m, this.mdVSUserKeysShapes[d]));
									} else this.mdVSShapes.push({}), this.mdVSTShapeInits.push({}), this.mdVSUserKeysShapes.push([]), this.mdVSFrameMapShapes.push({});
								}
							}
						},
						{
							key: "updatePreset",
							value: function updatePreset(e, t) {
								this.preset = e, this.initializeEquations(t);
							}
						},
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty;
							}
						},
						{
							key: "runFrameEquations",
							value: function runFrameEquations(e) {
								this.mdVSFrame = Object.assign({}, this.mdVS, this.mdVSQInit, this.mdVSFrameMap, e), this.mdVSFrame = this.preset.frame_eqs(this.mdVSFrame), this.mdVSFrameMap = r.default.pick(this.mdVSFrame, this.mdVSUserKeys), this.mdVSQAfterFrame = r.default.pick(this.mdVSFrame, this.qs);
							}
						}
					]), PresetEquationRunner;
				}();
			}),
			"./src/image/imageTextures.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function ImageTextures(e) {
						var t = this;
						_classCallCheck(this, ImageTextures), this.gl = e, this.anisoExt = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"), this.samplers = {}, this.clouds2Image = new Image(), this.clouds2Image.onload = function() {
							t.samplers.clouds2 = t.gl.createTexture(), t.bindTexture(t.samplers.clouds2, t.clouds2Image, 128, 128);
						}, this.clouds2Image.src = "data:image/jpeg;base64,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", this.emptyImage = new Image(), this.emptyImage.onload = function() {
							t.samplers.empty = t.gl.createTexture(), t.bindTexture(t.samplers.empty, t.emptyImage, 1, 1);
						}, this.emptyImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
					}
					return _createClass(ImageTextures, [
						{
							key: "bindTexture",
							value: function bindTexture(e, t, n, r) {
								if (this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1), this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, n, r, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, t), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR), this.anisoExt) {
									var i = this.gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
									this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, i);
								}
							}
						},
						{
							key: "loadExtraImages",
							value: function loadExtraImages(e) {
								var t = this;
								Object.keys(e).forEach(function(n) {
									var r = e[n], i = r.data, a = r.width, o = r.height;
									if (!t.samplers[n]) {
										var s = new Image();
										s.onload = function() {
											t.samplers[n] = t.gl.createTexture(), t.bindTexture(t.samplers[n], s, a, o);
										}, s.src = i;
									}
								});
							}
						},
						{
							key: "getTexture",
							value: function getTexture(e) {
								return this.samplers[e] || this.samplers.clouds2;
							}
						}
					]), ImageTextures;
				}();
			}),
			"./src/index.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				}), n("./node_modules/ecma-proposal-math-extensions/reference-implementation/index.js"), n("./src/presetBase.js");
				var r = n("./src/visualizer.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function Butterchurn() {
						_classCallCheck(this, Butterchurn);
					}
					return _createClass(Butterchurn, null, [{
						key: "createVisualizer",
						value: function createVisualizer(e, t, n) {
							return new r.default(e, t, n);
						}
					}]), Butterchurn;
				}();
			}),
			"./src/noise/noise.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function Noise(e) {
						_classCallCheck(this, Noise), this.gl = e, this.anisoExt = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"), this.noiseTexLQ = this.gl.createTexture(), this.noiseTexLQLite = this.gl.createTexture(), this.noiseTexMQ = this.gl.createTexture(), this.noiseTexHQ = this.gl.createTexture(), this.noiseTexVolLQ = this.gl.createTexture(), this.noiseTexVolHQ = this.gl.createTexture(), this.nTexArrLQ = Noise.createNoiseTex(256, 1), this.nTexArrLQLite = Noise.createNoiseTex(32, 1), this.nTexArrMQ = Noise.createNoiseTex(256, 4), this.nTexArrHQ = Noise.createNoiseTex(256, 8), this.nTexArrVolLQ = Noise.createNoiseVolTex(32, 1), this.nTexArrVolHQ = Noise.createNoiseVolTex(32, 4), this.bindTexture(this.noiseTexLQ, this.nTexArrLQ, 256, 256), this.bindTexture(this.noiseTexLQLite, this.nTexArrLQLite, 32, 32), this.bindTexture(this.noiseTexMQ, this.nTexArrMQ, 256, 256), this.bindTexture(this.noiseTexHQ, this.nTexArrHQ, 256, 256), this.bindTexture3D(this.noiseTexVolLQ, this.nTexArrVolLQ, 32, 32, 32), this.bindTexture3D(this.noiseTexVolHQ, this.nTexArrVolHQ, 32, 32, 32), this.noiseTexPointLQ = this.gl.createSampler(), e.samplerParameteri(this.noiseTexPointLQ, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_NEAREST), e.samplerParameteri(this.noiseTexPointLQ, e.TEXTURE_MAG_FILTER, e.NEAREST), e.samplerParameteri(this.noiseTexPointLQ, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.noiseTexPointLQ, e.TEXTURE_WRAP_T, e.REPEAT);
					}
					return _createClass(Noise, [{
						key: "bindTexture",
						value: function bindTexture(e, t, n, r) {
							if (this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1), this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, n, r, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, t), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR), this.anisoExt) {
								var i = this.gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
								this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, i);
							}
						}
					}, {
						key: "bindTexture3D",
						value: function bindTexture3D(e, t, n, r, i) {
							if (this.gl.bindTexture(this.gl.TEXTURE_3D, e), this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1), this.gl.texImage3D(this.gl.TEXTURE_3D, 0, this.gl.RGBA, n, r, i, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, t), this.gl.generateMipmap(this.gl.TEXTURE_3D), this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_R, this.gl.REPEAT), this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR), this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR), this.anisoExt) {
								var a = this.gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
								this.gl.texParameterf(this.gl.TEXTURE_3D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, a);
							}
						}
					}], [
						{
							key: "fCubicInterpolate",
							value: function fCubicInterpolate(e, t, n, r, i) {
								var a = i * i, o = i * a, s = r - n - e + t, c = e - t - s, l = n - e, u = t;
								return s * o + c * a + l * i + u;
							}
						},
						{
							key: "dwCubicInterpolate",
							value: function dwCubicInterpolate(e, t, n, r, i) {
								for (var a = [], o = 0; o < 4; o++) {
									var s = Noise.fCubicInterpolate(e[o] / 255, t[o] / 255, n[o] / 255, r[o] / 255, i);
									s = Math.clamp(s, 0, 1), a[o] = s * 255;
								}
								return a;
							}
						},
						{
							key: "createNoiseVolTex",
							value: function createNoiseVolTex(e, t) {
								for (var n = e * e * e, r = new Uint8Array(n * 4), i = t > 1 ? 216 : 256, a = i * .5, o = 0; o < n; o++) r[o * 4 + 0] = Math.floor(Math.random() * i + a), r[o * 4 + 1] = Math.floor(Math.random() * i + a), r[o * 4 + 2] = Math.floor(Math.random() * i + a), r[o * 4 + 3] = Math.floor(Math.random() * i + a);
								var s = e * e, c = e;
								if (t > 1) {
									for (var l = 0; l < e; l += t) for (var u = 0; u < e; u += t) for (var d = 0; d < e; d++) if (d % t !== 0) {
										for (var f = Math.floor(d / t) * t + e, p = l * s + u * c, m = [], h = [], g = [], _ = [], v = 0; v < 4; v++) m[v] = r[p * 4 + (f - t) % e * 4 + v], h[v] = r[p * 4 + f % e * 4 + v], g[v] = r[p * 4 + (f + t) % e * 4 + v], _[v] = r[p * 4 + (f + t * 2) % e * 4 + v];
										for (var y = d % t / t, b = Noise.dwCubicInterpolate(m, h, g, _, y), x = 0; x < 4; x++) {
											var S = d * 4 + x;
											r[l * s * 4 + u * c * 4 + S] = b[x];
										}
									}
									for (var C = 0; C < e; C += t) for (var w = 0; w < e; w++) for (var T = 0; T < e; T++) if (T % t !== 0) {
										for (var E = Math.floor(T / t) * t + e, D = C * s, O = [], k = [], A = [], j = [], M = 0; M < 4; M++) {
											var N = w * 4 + D * 4 + M;
											O[M] = r[(E - t) % e * c * 4 + N], k[M] = r[E % e * c * 4 + N], A[M] = r[(E + t) % e * c * 4 + N], j[M] = r[(E + t * 2) % e * c * 4 + N];
										}
										for (var P = T % t / t, F = Noise.dwCubicInterpolate(O, k, A, j, P), I = 0; I < 4; I++) {
											var L = w * 4 + D * 4 + I;
											r[T * c * 4 + L] = F[I];
										}
									}
									for (var R = 0; R < e; R++) for (var z = 0; z < e; z++) for (var B = 0; B < e; B++) if (B % t !== 0) {
										for (var V = z * c, H = Math.floor(B / t) * t + e, U = [], W = [], G = [], ee = [], K = 0; K < 4; K++) {
											var q = R * 4 + V * 4 + K;
											U[K] = r[(H - t) % e * s * 4 + q], W[K] = r[H % e * s * 4 + q], G[K] = r[(H + t) % e * s * 4 + q], ee[K] = r[(H + t * 2) % e * s * 4 + q];
										}
										for (var te = z % t / t, ne = Noise.dwCubicInterpolate(U, W, G, ee, te), re = 0; re < 4; re++) {
											var ie = R * 4 + V * 4 + re;
											r[B * s * 4 + ie] = ne[re];
										}
									}
								}
								return r;
							}
						},
						{
							key: "createNoiseTex",
							value: function createNoiseTex(e, t) {
								for (var n = e * e, r = new Uint8Array(n * 4), i = t > 1 ? 216 : 256, a = i * .5, o = 0; o < n; o++) r[o * 4 + 0] = Math.floor(Math.random() * i + a), r[o * 4 + 1] = Math.floor(Math.random() * i + a), r[o * 4 + 2] = Math.floor(Math.random() * i + a), r[o * 4 + 3] = Math.floor(Math.random() * i + a);
								if (t > 1) {
									for (var s = 0; s < e; s += t) for (var c = 0; c < e; c++) if (c % t !== 0) {
										for (var l = Math.floor(c / t) * t + e, u = s * e, d = [], f = [], p = [], m = [], h = 0; h < 4; h++) d[h] = r[u * 4 + (l - t) % e * 4 + h], f[h] = r[u * 4 + l % e * 4 + h], p[h] = r[u * 4 + (l + t) % e * 4 + h], m[h] = r[u * 4 + (l + t * 2) % e * 4 + h];
										for (var g = c % t / t, _ = Noise.dwCubicInterpolate(d, f, p, m, g), v = 0; v < 4; v++) r[s * e * 4 + c * 4 + v] = _[v];
									}
									for (var y = 0; y < e; y++) for (var b = 0; b < e; b++) if (b % t !== 0) {
										for (var x = Math.floor(b / t) * t + e, S = [], C = [], w = [], T = [], E = 0; E < 4; E++) S[E] = r[(x - t) % e * e * 4 + y * 4 + E], C[E] = r[x % e * e * 4 + y * 4 + E], w[E] = r[(x + t) % e * e * 4 + y * 4 + E], T[E] = r[(x + t * 2) % e * e * 4 + y * 4 + E];
										for (var D = b % t / t, O = Noise.dwCubicInterpolate(S, C, w, T, D), k = 0; k < 4; k++) r[b * e * 4 + y * 4 + k] = O[k];
									}
								}
								return r;
							}
						}
					]), Noise;
				}();
			}),
			"./src/presetBase.js": (function(e, t) {
				var n = 1e-5;
				window.sqr = function sqr(e) {
					return e * e;
				}, window.sqrt = function sqrt(e) {
					return Math.sqrt(Math.abs(e));
				}, window.log10 = function log10(e) {
					return Math.log(e) * Math.LOG10E;
				}, window.sign = function sign(e) {
					return e > 0 ? 1 : e < 0 ? -1 : 0;
				}, window.rand = function rand(e) {
					var t = Math.floor(e);
					return t < 1 ? Math.random() : Math.random() * t;
				}, window.randint = function randint(e) {
					return Math.floor(rand(e));
				}, window.bnot = function bnot(e) {
					return +(Math.abs(e) < n);
				};
				function isFiniteNumber(e) {
					return isFinite(e) && !isNaN(e);
				}
				window.pow = function pow(e, t) {
					var n = e ** +t;
					return isFiniteNumber(n) ? n : 0;
				}, window.div = function div(e, t) {
					return t === 0 ? 0 : e / t;
				}, window.mod = function mod(e, t) {
					return t === 0 ? 0 : Math.floor(e) % Math.floor(t);
				}, window.bitor = function bitor(e, t) {
					return Math.floor(e) | Math.floor(t);
				}, window.bitand = function bitand(e, t) {
					return Math.floor(e) & Math.floor(t);
				}, window.sigmoid = function sigmoid(e, t) {
					var r = 1 + Math.exp(-e * t);
					return Math.abs(r) > n ? 1 / r : 0;
				}, window.bor = function bor(e, t) {
					return +(Math.abs(e) > n || Math.abs(t) > n);
				}, window.band = function band(e, t) {
					return +(Math.abs(e) > n && Math.abs(t) > n);
				}, window.equal = function equal(e, t) {
					return +(Math.abs(e - t) < n);
				}, window.above = function above(e, t) {
					return +(e > t);
				}, window.below = function below(e, t) {
					return +(e < t);
				}, window.ifcond = function ifcond(e, t, r) {
					return Math.abs(e) > n ? t : r;
				}, window.memcpy = function memcpy(e, t, n, r) {
					var i = t, a = n, o = r;
					return a < 0 && (o += a, i -= a, a = 0), i < 0 && (o += i, a -= i, i = 0), o > 0 && e.copyWithin(i, a, o), t;
				};
			}),
			"./src/rendering/blendPattern.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function BlendPattern(e) {
						_classCallCheck(this, BlendPattern), this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.vertInfoA = new Float32Array((this.mesh_width + 1) * (this.mesh_height + 1)), this.vertInfoC = new Float32Array((this.mesh_width + 1) * (this.mesh_height + 1)), this.createBlendPattern();
					}
					return _createClass(BlendPattern, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								var t = this.mesh_width, n = this.mesh_height;
								this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.aspectx = e.aspectx, this.aspecty = e.aspecty, (this.mesh_width !== t || this.mesh_height !== n) && (this.vertInfoA = BlendPattern.resizeMatrixValues(this.vertInfoA, t, n, this.mesh_width, this.mesh_height), this.vertInfoC = BlendPattern.resizeMatrixValues(this.vertInfoC, t, n, this.mesh_width, this.mesh_height));
							}
						},
						{
							key: "genPlasma",
							value: function genPlasma(e, t, n, r, i) {
								var a = Math.floor((e + t) / 2), o = Math.floor((n + r) / 2), s = this.vertInfoC[n * (this.mesh_width + 1) + e], c = this.vertInfoC[n * (this.mesh_width + 1) + t], l = this.vertInfoC[r * (this.mesh_width + 1) + e], u = this.vertInfoC[r * (this.mesh_width + 1) + t];
								r - n >= 2 && (e === 0 && (this.vertInfoC[o * (this.mesh_width + 1) + e] = .5 * (s + l) + (Math.random() * 2 - 1) * i * this.aspecty), this.vertInfoC[o * (this.mesh_width + 1) + t] = .5 * (c + u) + (Math.random() * 2 - 1) * i * this.aspecty), t - e >= 2 && (n === 0 && (this.vertInfoC[n * (this.mesh_width + 1) + a] = .5 * (s + c) + (Math.random() * 2 - 1) * i * this.aspectx), this.vertInfoC[r * (this.mesh_width + 1) + a] = .5 * (l + u) + (Math.random() * 2 - 1) * i * this.aspectx), r - n >= 2 && t - e >= 2 && (s = this.vertInfoC[o * (this.mesh_width + 1) + e], c = this.vertInfoC[o * (this.mesh_width + 1) + t], l = this.vertInfoC[n * (this.mesh_width + 1) + a], u = this.vertInfoC[r * (this.mesh_width + 1) + a], this.vertInfoC[o * (this.mesh_width + 1) + a] = .25 * (l + u + s + c) + (Math.random() * 2 - 1) * i, this.genPlasma(e, a, n, o, i * .5), this.genPlasma(a, t, n, o, i * .5), this.genPlasma(e, a, o, r, i * .5), this.genPlasma(a, t, o, r, i * .5));
							}
						},
						{
							key: "createBlendPattern",
							value: function createBlendPattern() {
								var e = 1 + Math.floor(Math.random() * 3);
								if (e === 0) for (var t = 0, n = 0; n <= this.mesh_height; n++) for (var r = 0; r <= this.mesh_width; r++) this.vertInfoA[t] = 1, this.vertInfoC[t] = 0, t += 1;
								else if (e === 1) for (var i = Math.random() * 6.28, a = Math.cos(i), o = Math.sin(i), s = .1 + .2 * Math.random(), c = 1 / s, l = 0, u = 0; u <= this.mesh_height; u++) for (var d = u / this.mesh_height * this.aspecty, f = 0; f <= this.mesh_width; f++) {
									var p = (f / this.mesh_width * this.aspectx - .5) * a + (d - .5) * o + .5;
									p = (p - .5) / Math.sqrt(2) + .5, this.vertInfoA[l] = c * (1 + s), this.vertInfoC[l] = -c + c * p, l += 1;
								}
								else if (e === 2) {
									var m = .12 + .13 * Math.random(), h = 1 / m;
									this.vertInfoC[0] = Math.random(), this.vertInfoC[this.mesh_width] = Math.random(), this.vertInfoC[this.mesh_height * (this.mesh_width + 1)] = Math.random(), this.vertInfoC[this.mesh_height * (this.mesh_width + 1) + this.mesh_width] = Math.random(), this.genPlasma(0, this.mesh_width, 0, this.mesh_height, .25);
									for (var g = this.vertInfoC[0], _ = this.vertInfoC[0], v = 0, y = 0; y <= this.mesh_height; y++) for (var b = 0; b <= this.mesh_width; b++) g > this.vertInfoC[v] && (g = this.vertInfoC[v]), _ < this.vertInfoC[v] && (_ = this.vertInfoC[v]), v += 1;
									var x = 1 / (_ - g);
									v = 0;
									for (var S = 0; S <= this.mesh_height; S++) for (var C = 0; C <= this.mesh_width; C++) {
										var w = (this.vertInfoC[v] - g) * x;
										this.vertInfoA[v] = h * (1 + m), this.vertInfoC[v] = -h + h * w, v += 1;
									}
								} else if (e === 3) for (var T = .02 + .14 * Math.random() + .34 * Math.random(), E = 1 / T, D = Math.floor(Math.random() * 2) * 2 - 1, O = 0, k = 0; k <= this.mesh_height; k++) for (var A = (k / this.mesh_height - .5) * this.aspecty, j = 0; j <= this.mesh_width; j++) {
									var M = (j / this.mesh_width - .5) * this.aspectx, N = Math.sqrt(M * M + A * A) * 1.41421;
									D === -1 && (N = 1 - N), this.vertInfoA[O] = E * (1 + T), this.vertInfoC[O] = -E + E * N, O += 1;
								}
							}
						}
					], [{
						key: "resizeMatrixValues",
						value: function resizeMatrixValues(e, t, n, r, i) {
							for (var a = new Float32Array((r + 1) * (i + 1)), o = 0, s = 0; s < i + 1; s++) for (var c = 0; c < r + 1; c++) {
								var l = c / i, u = s / r;
								l *= t + 1, u *= n + 1, l = Math.clamp(l, 0, t - 1), u = Math.clamp(u, 0, n - 1);
								var d = Math.floor(l), f = Math.floor(u), p = l - d, m = u - f, h = e[f * (t + 1) + d], g = e[f * (t + 1) + (d + 1)], _ = e[(f + 1) * (t + 1) + d], v = e[(f + 1) * (t + 1) + (d + 1)];
								a[o] = h * (1 - p) * (1 - m) + g * p * (1 - m) + _ * (1 - p) * m + v * p * m, o += 1;
							}
							return a;
						}
					}]), BlendPattern;
				}();
			}),
			"./src/rendering/motionVectors/motionVectors.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function MotionVectors(e, t) {
						_classCallCheck(this, MotionVectors), this.gl = e, this.maxX = 64, this.maxY = 48, this.positions = new Float32Array(this.maxX * this.maxY * 2 * 3), this.texsizeX = t.texsizeX, this.texsizeY = t.texsizeY, this.mesh_width = t.mesh_width, this.mesh_height = t.mesh_height, this.positionVertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(MotionVectors, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height;
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      in vec3 aPos;\n                                      void main(void) {\n                                        gl_Position = vec4(aPos, 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      out vec4 fragColor;
                                      uniform vec4 u_color;
                                      void main(void) {
                                        fragColor = u_color;
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.aPosLoc = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.colorLoc = this.gl.getUniformLocation(this.shaderProgram, "u_color");
							}
						},
						{
							key: "getMotionDir",
							value: function getMotionDir(e, t, n) {
								var r = Math.floor(n * this.mesh_height), i = n * this.mesh_height - r, a = Math.floor(t * this.mesh_width), o = t * this.mesh_width - a, s = a + 1, c = r + 1, l = this.mesh_width + 1, u = e[(r * l + a) * 2 + 0] * (1 - o) * (1 - i), d = e[(r * l + a) * 2 + 1] * (1 - o) * (1 - i);
								return u += e[(r * l + s) * 2 + 0] * o * (1 - i), d += e[(r * l + s) * 2 + 1] * o * (1 - i), u += e[(c * l + a) * 2 + 0] * (1 - o) * i, d += e[(c * l + a) * 2 + 1] * (1 - o) * i, u += e[(c * l + s) * 2 + 0] * o * i, d += e[(c * l + s) * 2 + 1] * o * i, [u, 1 - d];
							}
						},
						{
							key: "generateMotionVectors",
							value: function generateMotionVectors(e, t) {
								var n = e.mv_a, r = Math.floor(e.mv_x), i = Math.floor(e.mv_y);
								if (n > .001 && r > 0 && i > 0) {
									var a = e.mv_x - r, o = e.mv_y - i;
									r > this.maxX && (r = this.maxX, a = 0), i > this.maxY && (i = this.maxY, o = 0);
									var s = e.mv_dx, c = e.mv_dy, l = e.mv_l, u = 1 / this.texsizeX;
									this.numVecVerts = 0;
									for (var d = 0; d < i; d++) {
										var f = (d + .25) / (i + o + .25 - 1);
										if (f -= c, f > 1e-4 && f < .9999) for (var p = 0; p < r; p++) {
											var m = (p + .25) / (r + a + .25 - 1);
											if (m += s, m > 1e-4 && m < .9999) {
												var h = this.getMotionDir(t, m, f), g = h[0], _ = h[1], v = g - m, y = _ - f;
												v *= l, y *= l;
												var b = Math.sqrt(v * v + y * y);
												b < u && b > 1e-8 ? (b = u / b, v *= b, y *= b) : (v = u, v = u), g = m + v, _ = f + y;
												var x = 2 * m - 1, S = 2 * f - 1, C = 2 * g - 1, w = 2 * _ - 1;
												this.positions[this.numVecVerts * 3 + 0] = x, this.positions[this.numVecVerts * 3 + 1] = S, this.positions[this.numVecVerts * 3 + 2] = 0, this.positions[(this.numVecVerts + 1) * 3 + 0] = C, this.positions[(this.numVecVerts + 1) * 3 + 1] = w, this.positions[(this.numVecVerts + 1) * 3 + 2] = 0, this.numVecVerts += 2;
											}
										}
									}
									if (this.numVecVerts > 0) return this.color = [
										e.mv_r,
										e.mv_g,
										e.mv_b,
										n
									], !0;
								}
								return !1;
							}
						},
						{
							key: "drawMotionVectors",
							value: function drawMotionVectors(e, t) {
								this.generateMotionVectors(e, t) && (this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aPosLoc, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLoc), this.gl.uniform4fv(this.colorLoc, this.color), this.gl.lineWidth(1), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.LINES, 0, this.numVecVerts));
							}
						}
					]), MotionVectors;
				}();
			}),
			"./src/rendering/renderer.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return C;
				});
				var r = n("./src/audio/audioLevels.js"), i = n("./src/blankPreset.js"), a = /*#__PURE__*/ n.n(i), o = n("./src/equations/presetEquationRunner.js"), s = n("./src/rendering/waves/basicWaveform.js"), c = n("./src/rendering/waves/customWaveform.js"), l = n("./src/rendering/shapes/customShape.js"), u = n("./src/rendering/sprites/border.js"), d = n("./src/rendering/sprites/darkenCenter.js"), f = n("./src/rendering/motionVectors/motionVectors.js"), p = n("./src/rendering/shaders/warp.js"), m = n("./src/rendering/shaders/comp.js"), h = n("./src/rendering/shaders/output.js"), g = n("./src/rendering/shaders/resample.js"), _ = n("./src/rendering/shaders/blur/blur.js"), v = n("./src/noise/noise.js"), y = n("./src/image/imageTextures.js"), b = n("./src/rendering/text/titleText.js"), x = n("./src/rendering/blendPattern.js"), S = n("./src/utils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var C = /*#__PURE__*/ function() {
					function Renderer(e, t, n) {
						_classCallCheck(this, Renderer), this.gl = e, this.audio = t, this.frameNum = 0, this.fps = 30, this.time = 0, this.presetTime = 0, this.lastTime = performance.now(), this.timeHist = [0], this.timeHistMax = 120, this.blending = !1, this.blendStartTime = 0, this.blendProgress = 0, this.blendDuration = 0, this.width = n.width || 1200, this.height = n.height || 900, this.mesh_width = n.meshWidth || 48, this.mesh_height = n.meshHeight || 36, this.pixelRatio = n.pixelRatio || window.devicePixelRatio || 1, this.textureRatio = n.textureRatio || 1, this.outputFXAA = n.outputFXAA || !1, this.texsizeX = this.width * this.pixelRatio * this.textureRatio, this.texsizeY = this.height * this.pixelRatio * this.textureRatio, this.aspectx = this.texsizeY > this.texsizeX ? this.texsizeX / this.texsizeY : 1, this.aspecty = this.texsizeX > this.texsizeY ? this.texsizeY / this.texsizeX : 1, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.qs = S.default.range(1, 33).map(function(e) {
							return `q${e}`;
						}), this.ts = S.default.range(1, 9).map(function(e) {
							return `t${e}`;
						}), this.regs = S.default.range(0, 100).map(function(e) {
							return e < 10 ? `reg0${e}` : `reg${e}`;
						}), this.blurRatios = [
							[.5, .25],
							[.125, .125],
							[.0625, .0625]
						], this.audioLevels = new r.default(this.audio), this.prevFrameBuffer = this.gl.createFramebuffer(), this.targetFrameBuffer = this.gl.createFramebuffer(), this.prevTexture = this.gl.createTexture(), this.targetTexture = this.gl.createTexture(), this.compFrameBuffer = this.gl.createFramebuffer(), this.compTexture = this.gl.createTexture(), this.anisoExt = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"), this.bindFrameBufferTexture(this.prevFrameBuffer, this.prevTexture), this.bindFrameBufferTexture(this.targetFrameBuffer, this.targetTexture), this.bindFrameBufferTexture(this.compFrameBuffer, this.compTexture);
						var i = {
							pixelRatio: this.pixelRatio,
							textureRatio: this.textureRatio,
							texsizeX: this.texsizeX,
							texsizeY: this.texsizeY,
							mesh_width: this.mesh_width,
							mesh_height: this.mesh_height,
							aspectx: this.aspectx,
							aspecty: this.aspecty
						};
						this.noise = new v.default(e), this.image = new y.default(e), this.warpShader = new p.default(e, this.noise, this.image, i), this.compShader = new m.default(e, this.noise, this.image, i), this.outputShader = new h.default(e, i), this.prevWarpShader = new p.default(e, this.noise, this.image, i), this.prevCompShader = new m.default(e, this.noise, this.image, i), this.numBlurPasses = 0, this.blurShader1 = new _.default(0, this.blurRatios, e, i), this.blurShader2 = new _.default(1, this.blurRatios, e, i), this.blurShader3 = new _.default(2, this.blurRatios, e, i), this.blurTexture1 = this.blurShader1.blurVerticalTexture, this.blurTexture2 = this.blurShader2.blurVerticalTexture, this.blurTexture3 = this.blurShader3.blurVerticalTexture, this.basicWaveform = new s.default(e, i), this.customWaveforms = S.default.range(4).map(function(t) {
							return new c.default(t, e, i);
						}), this.customShapes = S.default.range(4).map(function(t) {
							return new l.default(t, e, i);
						}), this.prevCustomWaveforms = S.default.range(4).map(function(t) {
							return new c.default(t, e, i);
						}), this.prevCustomShapes = S.default.range(4).map(function(t) {
							return new l.default(t, e, i);
						}), this.darkenCenter = new d.default(e, i), this.innerBorder = new u.default(e, i), this.outerBorder = new u.default(e, i), this.motionVectors = new f.default(e, i), this.titleText = new b.default(e, i), this.blendPattern = new x.default(i), this.resampleShader = new g.default(e), this.supertext = { startTime: -1 }, this.warpUVs = new Float32Array((this.mesh_width + 1) * (this.mesh_height + 1) * 2), this.warpColor = new Float32Array((this.mesh_width + 1) * (this.mesh_height + 1) * 4), this.gl.clearColor(0, 0, 0, 1), this.blankPreset = a.a;
						var C = {
							frame: 0,
							time: 0,
							fps: 45,
							bass: 1,
							bass_att: 1,
							mid: 1,
							mid_att: 1,
							treb: 1,
							treb_att: 1
						};
						this.preset = a.a, this.prevPreset = this.preset, this.presetEquationRunner = new o.default(this.preset, C, i), this.prevPresetEquationRunner = new o.default(this.prevPreset, C, i), this.regVars = this.presetEquationRunner.mdVSRegs;
					}
					return _createClass(Renderer, [
						{
							key: "loadPreset",
							value: function loadPreset(e, t) {
								this.blendPattern.createBlendPattern(), this.blending = !0, this.blendStartTime = this.time, this.blendDuration = t, this.blendProgress = 0, this.prevPresetEquationRunner = this.presetEquationRunner, this.prevPreset = this.preset, this.preset = e, this.preset.baseVals.old_wave_mode = this.prevPreset.baseVals.wave_mode, this.presetTime = this.time;
								var n = {
									frame: this.frameNum,
									time: this.time,
									fps: this.fps,
									bass: this.audioLevels.bass,
									bass_att: this.audioLevels.bass_att,
									mid: this.audioLevels.mid,
									mid_att: this.audioLevels.mid_att,
									treb: this.audioLevels.treb,
									treb_att: this.audioLevels.treb_att
								}, r = {
									pixelRatio: this.pixelRatio,
									textureRatio: this.textureRatio,
									texsizeX: this.texsizeX,
									texsizeY: this.texsizeY,
									mesh_width: this.mesh_width,
									mesh_height: this.mesh_height,
									aspectx: this.aspectx,
									aspecty: this.aspecty
								};
								this.presetEquationRunner = new o.default(this.preset, n, r), this.regVars = this.presetEquationRunner.mdVSRegs;
								var i = this.prevWarpShader;
								this.prevWarpShader = this.warpShader, this.warpShader = i;
								var a = this.prevCompShader;
								this.prevCompShader = this.compShader, this.compShader = a;
								var s = this.preset.warp.trim(), c = this.preset.comp.trim();
								this.warpShader.updateShader(s), this.compShader.updateShader(c), this.numBlurPasses = s.length === 0 ? 0 : Renderer.getHighestBlur(s), c.length !== 0 && (this.numBlurPasses = Math.max(this.numBlurPasses, Renderer.getHighestBlur(c)));
							}
						},
						{
							key: "loadExtraImages",
							value: function loadExtraImages(e) {
								this.image.loadExtraImages(e);
							}
						},
						{
							key: "setRendererSize",
							value: function setRendererSize(e, t, n) {
								var r = this.texsizeX, i = this.texsizeY;
								if (this.width = e, this.height = t, this.mesh_width = n.meshWidth || this.mesh_width, this.mesh_height = n.meshHeight || this.mesh_height, this.pixelRatio = n.pixelRatio || this.pixelRatio, this.textureRatio = n.textureRatio || this.textureRatio, this.texsizeX = e * this.pixelRatio * this.textureRatio, this.texsizeY = t * this.pixelRatio * this.textureRatio, this.aspectx = this.texsizeY > this.texsizeX ? this.texsizeX / this.texsizeY : 1, this.aspecty = this.texsizeX > this.texsizeY ? this.texsizeY / this.texsizeX : 1, this.texsizeX !== r || this.texsizeY !== i) {
									var a = this.gl.createTexture();
									this.bindFrameBufferTexture(this.targetFrameBuffer, a), this.bindFrambufferAndSetViewport(this.targetFrameBuffer, this.texsizeX, this.texsizeY), this.resampleShader.renderQuadTexture(this.targetTexture), this.targetTexture = a, this.bindFrameBufferTexture(this.prevFrameBuffer, this.prevTexture), this.bindFrameBufferTexture(this.compFrameBuffer, this.compTexture);
								}
								this.updateGlobals(), this.frameNum > 0 && this.renderToScreen();
							}
						},
						{
							key: "setInternalMeshSize",
							value: function setInternalMeshSize(e, t) {
								this.mesh_width = e, this.mesh_height = t, this.updateGlobals();
							}
						},
						{
							key: "setOutputAA",
							value: function setOutputAA(e) {
								this.outputFXAA = e;
							}
						},
						{
							key: "updateGlobals",
							value: function updateGlobals() {
								var e = {
									pixelRatio: this.pixelRatio,
									textureRatio: this.textureRatio,
									texsizeX: this.texsizeX,
									texsizeY: this.texsizeY,
									mesh_width: this.mesh_width,
									mesh_height: this.mesh_height,
									aspectx: this.aspectx,
									aspecty: this.aspecty
								};
								this.presetEquationRunner.updateGlobals(e), this.prevPresetEquationRunner.updateGlobals(e), this.warpShader.updateGlobals(e), this.prevWarpShader.updateGlobals(e), this.compShader.updateGlobals(e), this.prevCompShader.updateGlobals(e), this.outputShader.updateGlobals(e), this.blurShader1.updateGlobals(e), this.blurShader2.updateGlobals(e), this.blurShader3.updateGlobals(e), this.basicWaveform.updateGlobals(e), this.customWaveforms.forEach(function(t) {
									return t.updateGlobals(e);
								}), this.customShapes.forEach(function(t) {
									return t.updateGlobals(e);
								}), this.prevCustomWaveforms.forEach(function(t) {
									return t.updateGlobals(e);
								}), this.prevCustomShapes.forEach(function(t) {
									return t.updateGlobals(e);
								}), this.darkenCenter.updateGlobals(e), this.innerBorder.updateGlobals(e), this.outerBorder.updateGlobals(e), this.motionVectors.updateGlobals(e), this.titleText.updateGlobals(e), this.blendPattern.updateGlobals(e), this.warpUVs = new Float32Array((this.mesh_width + 1) * (this.mesh_height + 1) * 2), this.warpColor = new Float32Array((this.mesh_width + 1) * (this.mesh_height + 1) * 4);
							}
						},
						{
							key: "calcTimeAndFPS",
							value: function calcTimeAndFPS(e) {
								var t;
								if (e) t = e;
								else {
									var n = performance.now();
									t = (n - this.lastTime) / 1e3, (t > 1 || t < 0 || this.frame < 2) && (t = 1 / 30), this.lastTime = n;
								}
								this.time += 1 / this.fps, this.blending && (this.blendProgress = (this.time - this.blendStartTime) / this.blendDuration, this.blendProgress > 1 && (this.blending = !1));
								var r = this.timeHist[this.timeHist.length - 1] + t;
								this.timeHist.push(r), this.timeHist.length > this.timeHistMax && this.timeHist.shift();
								var i = this.timeHist.length / (r - this.timeHist[0]);
								if (Math.abs(i - this.fps) > 3 && this.frame > this.timeHistMax) this.fps = i;
								else {
									var a = .93;
									this.fps = a * this.fps + (1 - a) * i;
								}
							}
						},
						{
							key: "runPixelEquations",
							value: function runPixelEquations(e, t, n, r) {
								for (var i = this.mesh_width, a = this.mesh_height, o = i + 1, s = a + 1, c = this.time * t.warpanimspeed, l = 1 / t.warpscale, u = 11.68 + 4 * Math.cos(c * 1.413 + 10), d = 8.77 + 3 * Math.cos(c * 1.113 + 7), f = 10.54 + 3 * Math.cos(c * 1.233 + 3), p = 11.49 + 4 * Math.cos(c * .933 + 5), m = 0 / this.texsizeX, h = 0 / this.texsizeY, g = this.aspectx, _ = this.aspecty, v = S.default.cloneVars(t), y = 0, b = 0, x = 0; x < s; x++) for (var C = 0; C < o; C++) {
									var w = C / i * 2 - 1, T = x / a * 2 - 1, E = Math.sqrt(w * w * g * g + T * T * _ * _);
									if (n) {
										var D = void 0;
										D = x === a / 2 && C === i / 2 ? 0 : S.default.atan2(T * _, w * g), v.x = w * .5 * g + .5, v.y = T * -.5 * _ + .5, v.rad = E, v.ang = D, v.zoom = t.zoom, v.zoomexp = t.zoomexp, v.rot = t.rot, v.warp = t.warp, v.cx = t.cx, v.cy = t.cy, v.dx = t.dx, v.dy = t.dy, v.sx = t.sx, v.sy = t.sy, v = e.pixel_eqs(v);
									}
									var O = v.warp, k = v.zoom, A = v.zoomexp, j = v.cx, M = v.cy, N = v.sx, P = v.sy, F = v.dx, I = v.dy, L = v.rot, R = 1 / k ** A ** (E * 2 - 1), z = w * .5 * g * R + .5, B = -T * .5 * _ * R + .5;
									z = (z - j) / N + j, B = (B - M) / P + M, O !== 0 && (z += O * .0035 * Math.sin(c * .333 + l * (w * u - T * p)), B += O * .0035 * Math.cos(c * .375 - l * (w * f + T * d)), z += O * .0035 * Math.cos(c * .753 - l * (w * d - T * f)), B += O * .0035 * Math.sin(c * .825 + l * (w * u + T * p)));
									var V = z - j, H = B - M, U = Math.cos(L), W = Math.sin(L);
									if (z = V * U - H * W + j, B = V * W + H * U + M, z -= F, B -= I, z = (z - .5) / g + .5, B = (B - .5) / _ + .5, z += m, B += h, !r) this.warpUVs[y] = z, this.warpUVs[y + 1] = B, this.warpColor[b + 0] = 1, this.warpColor[b + 1] = 1, this.warpColor[b + 2] = 1, this.warpColor[b + 3] = 1;
									else {
										var G = this.blendPattern.vertInfoA[y / 2] * this.blendProgress + this.blendPattern.vertInfoC[y / 2];
										G = Math.clamp(G, 0, 1), this.warpUVs[y] = this.warpUVs[y] * G + z * (1 - G), this.warpUVs[y + 1] = this.warpUVs[y + 1] * G + B * (1 - G), this.warpColor[b + 0] = 1, this.warpColor[b + 1] = 1, this.warpColor[b + 2] = 1, this.warpColor[b + 3] = G;
									}
									y += 2, b += 4;
								}
								this.mdVSVertex = v;
							}
						},
						{
							key: "bindFrambufferAndSetViewport",
							value: function bindFrambufferAndSetViewport(e, t, n) {
								this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, e), this.gl.viewport(0, 0, t, n);
							}
						},
						{
							key: "bindFrameBufferTexture",
							value: function bindFrameBufferTexture(e, t) {
								if (this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1), this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.texsizeX, this.texsizeY, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(this.texsizeX * this.texsizeY * 4)), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR), this.anisoExt) {
									var n = this.gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
									this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, n);
								}
								this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, e), this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, t, 0);
							}
						},
						{
							key: "render",
							value: function render() {
								var e = this, t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, n = t.audioLevels, r = t.elapsedTime;
								this.calcTimeAndFPS(r), this.frameNum += 1, n ? this.audio.updateAudio(n.timeByteArray, n.timeByteArrayL, n.timeByteArrayR) : this.audio.sampleAudio(), this.audioLevels.updateAudioLevels(this.fps, this.frameNum);
								var i = {
									frame: this.frameNum,
									time: this.time,
									fps: this.fps,
									bass: this.audioLevels.bass,
									bass_att: this.audioLevels.bass_att,
									mid: this.audioLevels.mid,
									mid_att: this.audioLevels.mid_att,
									treb: this.audioLevels.treb,
									treb_att: this.audioLevels.treb_att,
									meshx: this.mesh_width,
									meshy: this.mesh_height,
									aspectx: this.invAspectx,
									aspecty: this.invAspecty,
									pixelsx: this.texsizeX,
									pixelsy: this.texsizeY
								}, a = Object.assign({}, i);
								a.gmegabuf = this.prevPresetEquationRunner.gmegabuf, i.gmegabuf = this.presetEquationRunner.gmegabuf, Object.assign(i, this.regVars), this.presetEquationRunner.runFrameEquations(i);
								var o = this.presetEquationRunner.mdVSFrame;
								this.runPixelEquations(this.presetEquationRunner.preset, o, this.presetEquationRunner.runVertEQs, !1), Object.assign(this.regVars, S.default.pick(this.mdVSVertex, this.regs)), Object.assign(i, this.regVars);
								var s;
								this.blending ? (this.prevPresetEquationRunner.runFrameEquations(a), this.runPixelEquations(this.prevPresetEquationRunner.preset, this.prevPresetEquationRunner.mdVSFrame, this.prevPresetEquationRunner.runVertEQs, !0), s = Renderer.mixFrameEquations(this.blendProgress, o, this.prevPresetEquationRunner.mdVSFrame)) : s = o;
								var c = this.targetTexture;
								this.targetTexture = this.prevTexture, this.prevTexture = c;
								var l = this.targetFrameBuffer;
								this.targetFrameBuffer = this.prevFrameBuffer, this.prevFrameBuffer = l, this.gl.bindTexture(this.gl.TEXTURE_2D, this.prevTexture), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.bindFrambufferAndSetViewport(this.targetFrameBuffer, this.texsizeX, this.texsizeY), this.gl.clear(this.gl.COLOR_BUFFER_BIT), this.gl.enable(this.gl.BLEND), this.gl.blendEquation(this.gl.FUNC_ADD), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
								var u = Renderer.getBlurValues(s), d = u.blurMins, f = u.blurMaxs;
								this.blending ? (this.prevWarpShader.renderQuadTexture(!1, this.prevTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, d, f, this.prevPresetEquationRunner.mdVSFrame, this.warpUVs, this.warpColor), this.warpShader.renderQuadTexture(!0, this.prevTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, d, f, s, this.warpUVs, this.warpColor)) : this.warpShader.renderQuadTexture(!1, this.prevTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, d, f, o, this.warpUVs, this.warpColor), this.numBlurPasses > 0 && (this.blurShader1.renderBlurTexture(this.targetTexture, o, d, f), this.numBlurPasses > 1 && (this.blurShader2.renderBlurTexture(this.blurTexture1, o, d, f), this.numBlurPasses > 2 && this.blurShader3.renderBlurTexture(this.blurTexture2, o, d, f)), this.bindFrambufferAndSetViewport(this.targetFrameBuffer, this.texsizeX, this.texsizeY)), this.motionVectors.drawMotionVectors(s, this.warpUVs), this.preset.shapes && this.preset.shapes.length > 0 && this.customShapes.forEach(function(t, n) {
									t.drawCustomShape(e.blending ? e.blendProgress : 1, i, e.presetEquationRunner, e.preset.shapes[n], e.prevTexture);
								}), this.preset.waves && this.preset.waves.length > 0 && this.customWaveforms.forEach(function(t, n) {
									t.drawCustomWaveform(e.blending ? e.blendProgress : 1, e.audio.timeArrayL, e.audio.timeArrayR, e.audio.freqArrayL, e.audio.freqArrayR, i, e.presetEquationRunner, e.preset.waves[n]);
								}), this.blending && (this.prevPreset.shapes && this.prevPreset.shapes.length > 0 && this.prevCustomShapes.forEach(function(t, n) {
									t.drawCustomShape(1 - e.blendProgress, a, e.prevPresetEquationRunner, e.prevPreset.shapes[n], e.prevTexture);
								}), this.prevPreset.waves && this.prevPreset.waves.length > 0 && this.prevCustomWaveforms.forEach(function(t, n) {
									t.drawCustomWaveform(1 - e.blendProgress, e.audio.timeArrayL, e.audio.timeArrayR, e.audio.freqArrayL, e.audio.freqArrayR, a, e.prevPresetEquationRunner, e.prevPreset.waves[n]);
								})), this.basicWaveform.drawBasicWaveform(this.blending, this.blendProgress, this.audio.timeArrayL, this.audio.timeArrayR, s), this.darkenCenter.drawDarkenCenter(s);
								var p = [
									s.ob_r,
									s.ob_g,
									s.ob_b,
									s.ob_a
								];
								this.outerBorder.drawBorder(p, s.ob_size, 0);
								var m = [
									s.ib_r,
									s.ib_g,
									s.ib_b,
									s.ib_a
								];
								if (this.innerBorder.drawBorder(m, s.ib_size, s.ob_size), this.supertext.startTime >= 0) {
									var h = (this.time - this.supertext.startTime) / this.supertext.duration;
									h >= 1 && this.titleText.renderTitle(h, !0, i);
								}
								this.globalVars = i, this.mdVSFrame = o, this.mdVSFrameMixed = s, this.renderToScreen();
							}
						},
						{
							key: "renderToScreen",
							value: function renderToScreen() {
								this.outputFXAA ? this.bindFrambufferAndSetViewport(this.compFrameBuffer, this.texsizeX, this.texsizeY) : this.bindFrambufferAndSetViewport(null, this.width, this.height), this.gl.clear(this.gl.COLOR_BUFFER_BIT), this.gl.enable(this.gl.BLEND), this.gl.blendEquation(this.gl.FUNC_ADD), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
								var e = Renderer.getBlurValues(this.mdVSFrameMixed), t = e.blurMins, n = e.blurMaxs;
								if (this.blending ? (this.prevCompShader.renderQuadTexture(!1, this.targetTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, t, n, this.prevPresetEquationRunner.mdVSFrame, this.warpColor), this.compShader.renderQuadTexture(!0, this.targetTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, t, n, this.mdVSFrameMixed, this.warpColor)) : this.compShader.renderQuadTexture(!1, this.targetTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, t, n, this.mdVSFrame, this.warpColor), this.supertext.startTime >= 0) {
									var r = (this.time - this.supertext.startTime) / this.supertext.duration;
									this.titleText.renderTitle(r, !1, this.globalVars), r >= 1 && (this.supertext.startTime = -1);
								}
								this.outputFXAA && (this.gl.bindTexture(this.gl.TEXTURE_2D, this.compTexture), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.bindFrambufferAndSetViewport(null, this.width, this.height), this.outputShader.renderQuadTexture(this.compTexture));
							}
						},
						{
							key: "launchSongTitleAnim",
							value: function launchSongTitleAnim(e) {
								this.supertext = {
									startTime: this.time,
									duration: 1.7
								}, this.titleText.generateTitleTexture(e);
							}
						},
						{
							key: "toDataURL",
							value: function toDataURL() {
								var e = this, t = new Uint8Array(this.texsizeX * this.texsizeY * 4), n = this.gl.createFramebuffer(), r = this.gl.createTexture();
								this.bindFrameBufferTexture(n, r);
								var i = Renderer.getBlurValues(this.mdVSFrameMixed), a = i.blurMins, o = i.blurMaxs;
								this.compShader.renderQuadTexture(!1, this.targetTexture, this.blurTexture1, this.blurTexture2, this.blurTexture3, a, o, this.mdVSFrame, this.warpColor), this.gl.readPixels(0, 0, this.texsizeX, this.texsizeY, this.gl.RGBA, this.gl.UNSIGNED_BYTE, t), Array.from({ length: this.texsizeY }, function(n, r) {
									return t.slice(r * e.texsizeX * 4, (r + 1) * e.texsizeX * 4);
								}).forEach(function(n, r) {
									return t.set(n, (e.texsizeY - r - 1) * e.texsizeX * 4);
								});
								var s = document.createElement("canvas");
								s.width = this.texsizeX, s.height = this.texsizeY;
								var c = s.getContext("2d"), l = c.createImageData(this.texsizeX, this.texsizeY);
								return l.data.set(t), c.putImageData(l, 0, 0), this.gl.deleteTexture(r), this.gl.deleteFramebuffer(n), s.toDataURL();
							}
						},
						{
							key: "warpBufferToDataURL",
							value: function warpBufferToDataURL() {
								var e = new Uint8Array(this.texsizeX * this.texsizeY * 4);
								this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.targetFrameBuffer), this.gl.readPixels(0, 0, this.texsizeX, this.texsizeY, this.gl.RGBA, this.gl.UNSIGNED_BYTE, e);
								var t = document.createElement("canvas");
								t.width = this.texsizeX, t.height = this.texsizeY;
								var n = t.getContext("2d"), r = n.createImageData(this.texsizeX, this.texsizeY);
								return r.data.set(e), n.putImageData(r, 0, 0), t.toDataURL();
							}
						}
					], [
						{
							key: "getHighestBlur",
							value: function getHighestBlur(e) {
								return /sampler_blur3/.test(e) ? 3 : /sampler_blur2/.test(e) ? 2 : +!!/sampler_blur1/.test(e);
							}
						},
						{
							key: "mixFrameEquations",
							value: function mixFrameEquations(e, t, n) {
								var r = .5 - .5 * Math.cos(e * Math.PI), i = 1 - r, a = .5, o = S.default.cloneVars(t);
								return o.decay = r * t.decay + i * n.decay, o.wave_a = r * t.wave_a + i * n.wave_a, o.wave_r = r * t.wave_r + i * n.wave_r, o.wave_g = r * t.wave_g + i * n.wave_g, o.wave_b = r * t.wave_b + i * n.wave_b, o.wave_x = r * t.wave_x + i * n.wave_x, o.wave_y = r * t.wave_y + i * n.wave_y, o.wave_mystery = r * t.wave_mystery + i * n.wave_mystery, o.ob_size = r * t.ob_size + i * n.ob_size, o.ob_r = r * t.ob_r + i * n.ob_r, o.ob_g = r * t.ob_g + i * n.ob_g, o.ob_b = r * t.ob_b + i * n.ob_b, o.ob_a = r * t.ob_a + i * n.ob_a, o.ib_size = r * t.ib_size + i * n.ib_size, o.ib_r = r * t.ib_r + i * n.ib_r, o.ib_g = r * t.ib_g + i * n.ib_g, o.ib_b = r * t.ib_b + i * n.ib_b, o.ib_a = r * t.ib_a + i * n.ib_a, o.mv_x = r * t.mv_x + i * n.mv_x, o.mv_y = r * t.mv_y + i * n.mv_y, o.mv_dx = r * t.mv_dx + i * n.mv_dx, o.mv_dy = r * t.mv_dy + i * n.mv_dy, o.mv_l = r * t.mv_l + i * n.mv_l, o.mv_r = r * t.mv_r + i * n.mv_r, o.mv_g = r * t.mv_g + i * n.mv_g, o.mv_b = r * t.mv_b + i * n.mv_b, o.mv_a = r * t.mv_a + i * n.mv_a, o.echo_zoom = r * t.echo_zoom + i * n.echo_zoom, o.echo_alpha = r * t.echo_alpha + i * n.echo_alpha, o.echo_orient = r * t.echo_orient + i * n.echo_orient, o.wave_dots = r < a ? n.wave_dots : t.wave_dots, o.wave_thick = r < a ? n.wave_thick : t.wave_thick, o.additivewave = r < a ? n.additivewave : t.additivewave, o.wave_brighten = r < a ? n.wave_brighten : t.wave_brighten, o.darken_center = r < a ? n.darken_center : t.darken_center, o.gammaadj = r < a ? n.gammaadj : t.gammaadj, o.wrap = r < a ? n.wrap : t.wrap, o.invert = r < a ? n.invert : t.invert, o.brighten = r < a ? n.brighten : t.brighten, o.darken = r < a ? n.darken : t.darken, o.solarize = r < a ? n.brighten : t.solarize, o.b1n = r * t.b1n + i * n.b1n, o.b2n = r * t.b2n + i * n.b2n, o.b3n = r * t.b3n + i * n.b3n, o.b1x = r * t.b1x + i * n.b1x, o.b2x = r * t.b2x + i * n.b2x, o.b3x = r * t.b3x + i * n.b3x, o.b1ed = r * t.b1ed + i * n.b1ed, o;
							}
						},
						{
							key: "getBlurValues",
							value: function getBlurValues(e) {
								var t = e.b1n, n = e.b2n, r = e.b3n, i = e.b1x, a = e.b2x, o = e.b3x, s = .1;
								if (i - t < s) {
									var c = (t + i) * .5;
									t = c - s * .5, i = c - s * .5;
								}
								if (a = Math.min(i, a), n = Math.max(t, n), a - n < s) {
									var l = (n + a) * .5;
									n = l - s * .5, a = l - s * .5;
								}
								if (o = Math.min(a, o), r = Math.max(n, r), o - r < s) {
									var u = (r + o) * .5;
									r = u - s * .5, o = u - s * .5;
								}
								return {
									blurMins: [
										t,
										n,
										r
									],
									blurMaxs: [
										i,
										a,
										o
									]
								};
							}
						}
					]), Renderer;
				}();
			}),
			"./src/rendering/shaders/blur/blur.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return a;
				});
				var r = n("./src/rendering/shaders/blur/blurVertical.js"), i = n("./src/rendering/shaders/blur/blurHorizontal.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var a = /*#__PURE__*/ function() {
					function BlurShader(e, t, n) {
						var a = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
						_classCallCheck(this, BlurShader), this.blurLevel = e, this.blurRatios = t, this.gl = n, this.texsizeX = a.texsizeX, this.texsizeY = a.texsizeY, this.anisoExt = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"), this.blurHorizontalFrameBuffer = this.gl.createFramebuffer(), this.blurVerticalFrameBuffer = this.gl.createFramebuffer(), this.blurHorizontalTexture = this.gl.createTexture(), this.blurVerticalTexture = this.gl.createTexture(), this.setupFrameBufferTextures(), this.blurHorizontal = new i.default(n, this.blurLevel, a), this.blurVertical = new r.default(n, this.blurLevel, a);
					}
					return _createClass(BlurShader, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.setupFrameBufferTextures();
							}
						},
						{
							key: "getTextureSize",
							value: function getTextureSize(e) {
								var t = Math.max(this.texsizeX * e, 16);
								t = Math.floor((t + 3) / 16) * 16;
								var n = Math.max(this.texsizeY * e, 16);
								return n = Math.floor((n + 3) / 4) * 4, [t, n];
							}
						},
						{
							key: "setupFrameBufferTextures",
							value: function setupFrameBufferTextures() {
								var e = this.blurLevel > 0 ? this.blurRatios[this.blurLevel - 1] : [1, 1], t = this.blurRatios[this.blurLevel], n = this.getTextureSize(e[1]), r = this.getTextureSize(t[0]);
								this.bindFrameBufferTexture(this.blurHorizontalFrameBuffer, this.blurHorizontalTexture, r);
								var i = r, a = this.getTextureSize(t[1]);
								this.bindFrameBufferTexture(this.blurVerticalFrameBuffer, this.blurVerticalTexture, a), this.horizontalTexsizes = [n, r], this.verticalTexsizes = [i, a];
							}
						},
						{
							key: "bindFrambufferAndSetViewport",
							value: function bindFrambufferAndSetViewport(e, t) {
								this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, e), this.gl.viewport(0, 0, t[0], t[1]);
							}
						},
						{
							key: "bindFrameBufferTexture",
							value: function bindFrameBufferTexture(e, t, n) {
								if (this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1), this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, n[0], n[1], 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(n[0] * n[1] * 4)), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR), this.anisoExt) {
									var r = this.gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
									this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, r);
								}
								this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, e), this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, t, 0);
							}
						},
						{
							key: "renderBlurTexture",
							value: function renderBlurTexture(e, t, n, r) {
								this.bindFrambufferAndSetViewport(this.blurHorizontalFrameBuffer, this.horizontalTexsizes[1]), this.blurHorizontal.renderQuadTexture(e, t, n, r, this.horizontalTexsizes[0]), this.gl.bindTexture(this.gl.TEXTURE_2D, this.blurHorizontalTexture), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.bindFrambufferAndSetViewport(this.blurVerticalFrameBuffer, this.verticalTexsizes[1]), this.blurVertical.renderQuadTexture(this.blurHorizontalTexture, t, this.verticalTexsizes[0]), this.gl.bindTexture(this.gl.TEXTURE_2D, this.blurVerticalTexture), this.gl.generateMipmap(this.gl.TEXTURE_2D);
							}
						}
					]), BlurShader;
				}();
			}),
			"./src/rendering/shaders/blur/blurHorizontal.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function BlurHorizontal(e, t) {
						_classCallCheck(this, BlurHorizontal), this.gl = e, this.blurLevel = t;
						var n = [
							4,
							3.8,
							3.5,
							2.9,
							1.9,
							1.2,
							.7,
							.3
						], i = n[0] + n[1], a = n[2] + n[3], o = n[4] + n[5], s = n[6] + n[7], c = 0 + 2 * n[1] / i, l = 2 + 2 * n[3] / a, u = 4 + 2 * n[5] / o, d = 6 + 2 * n[7] / s;
						this.ws = new Float32Array([
							i,
							a,
							o,
							s
						]), this.ds = new Float32Array([
							c,
							l,
							u,
							d
						]), this.wDiv = .5 / (i + a + o + s), this.positions = new Float32Array([
							-1,
							-1,
							1,
							-1,
							-1,
							1,
							1,
							1
						]), this.vertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(BlurHorizontal, [
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      const vec2 halfmad = vec2(0.5);\n                                      in vec2 aPos;\n                                      out vec2 uv;\n                                      void main(void) {\n                                        gl_Position = vec4(aPos, 0.0, 1.0);\n                                        uv = aPos * halfmad + halfmad;\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
       precision ${this.floatPrecision} float;
       precision highp int;
       precision mediump sampler2D;

       in vec2 uv;
       out vec4 fragColor;
       uniform sampler2D uTexture;
       uniform vec4 texsize;
       uniform float scale;
       uniform float bias;
       uniform vec4 ws;
       uniform vec4 ds;
       uniform float wdiv;

       void main(void) {
         float w1 = ws[0];
         float w2 = ws[1];
         float w3 = ws[2];
         float w4 = ws[3];
         float d1 = ds[0];
         float d2 = ds[1];
         float d3 = ds[2];
         float d4 = ds[3];

         vec2 uv2 = uv.xy;

         vec3 blur =
           ( texture(uTexture, uv2 + vec2( d1 * texsize.z,0.0) ).xyz
           + texture(uTexture, uv2 + vec2(-d1 * texsize.z,0.0) ).xyz) * w1 +
           ( texture(uTexture, uv2 + vec2( d2 * texsize.z,0.0) ).xyz
           + texture(uTexture, uv2 + vec2(-d2 * texsize.z,0.0) ).xyz) * w2 +
           ( texture(uTexture, uv2 + vec2( d3 * texsize.z,0.0) ).xyz
           + texture(uTexture, uv2 + vec2(-d3 * texsize.z,0.0) ).xyz) * w3 +
           ( texture(uTexture, uv2 + vec2( d4 * texsize.z,0.0) ).xyz
           + texture(uTexture, uv2 + vec2(-d4 * texsize.z,0.0) ).xyz) * w4;

         blur.xyz *= wdiv;
         blur.xyz = blur.xyz * scale + bias;

         fragColor = vec4(blur, 1.0);
       }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture"), this.texsizeLocation = this.gl.getUniformLocation(this.shaderProgram, "texsize"), this.scaleLoc = this.gl.getUniformLocation(this.shaderProgram, "scale"), this.biasLoc = this.gl.getUniformLocation(this.shaderProgram, "bias"), this.wsLoc = this.gl.getUniformLocation(this.shaderProgram, "ws"), this.dsLocation = this.gl.getUniformLocation(this.shaderProgram, "ds"), this.wdivLoc = this.gl.getUniformLocation(this.shaderProgram, "wdiv");
							}
						},
						{
							key: "getScaleAndBias",
							value: function getScaleAndBias(e, t) {
								var n = [
									1,
									1,
									1
								], r = [
									0,
									0,
									0
								], i, a;
								return n[0] = 1 / (t[0] - e[0]), r[0] = -e[0] * n[0], i = (e[1] - e[0]) / (t[0] - e[0]), a = (t[1] - e[0]) / (t[0] - e[0]), n[1] = 1 / (a - i), r[1] = -i * n[1], i = (e[2] - e[1]) / (t[1] - e[1]), a = (t[2] - e[1]) / (t[1] - e[1]), n[2] = 1 / (a - i), r[2] = -i * n[2], {
									scale: n[this.blurLevel],
									bias: r[this.blurLevel]
								};
							}
						},
						{
							key: "renderQuadTexture",
							value: function renderQuadTexture(e, t, n, r, i) {
								this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.uniform1i(this.textureLoc, 0);
								var a = this.getScaleAndBias(n, r), o = a.scale, s = a.bias;
								this.gl.uniform4fv(this.texsizeLocation, [
									i[0],
									i[1],
									1 / i[0],
									1 / i[1]
								]), this.gl.uniform1f(this.scaleLoc, o), this.gl.uniform1f(this.biasLoc, s), this.gl.uniform4fv(this.wsLoc, this.ws), this.gl.uniform4fv(this.dsLocation, this.ds), this.gl.uniform1f(this.wdivLoc, this.wDiv), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
							}
						}
					]), BlurHorizontal;
				}();
			}),
			"./src/rendering/shaders/blur/blurVertical.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function BlurVertical(e, t) {
						_classCallCheck(this, BlurVertical), this.gl = e, this.blurLevel = t;
						var n = [
							4,
							3.8,
							3.5,
							2.9,
							1.9,
							1.2,
							.7,
							.3
						], i = n[0] + n[1] + n[2] + n[3], a = n[4] + n[5] + n[6] + n[7], o = 0 + 2 * ((n[2] + n[3]) / i), s = 2 + 2 * ((n[6] + n[7]) / a);
						this.wds = new Float32Array([
							i,
							a,
							o,
							s
						]), this.wDiv = 1 / ((i + a) * 2), this.positions = new Float32Array([
							-1,
							-1,
							1,
							-1,
							-1,
							1,
							1,
							1
						]), this.vertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(BlurVertical, [{
						key: "createShader",
						value: function createShader() {
							this.shaderProgram = this.gl.createProgram();
							var e = this.gl.createShader(this.gl.VERTEX_SHADER);
							this.gl.shaderSource(e, "#version 300 es\n                                      const vec2 halfmad = vec2(0.5);\n                                      in vec2 aPos;\n                                      out vec2 uv;\n                                      void main(void) {\n                                        gl_Position = vec4(aPos, 0.0, 1.0);\n                                        uv = aPos * halfmad + halfmad;\n                                      }"), this.gl.compileShader(e);
							var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
							this.gl.shaderSource(t, `#version 300 es
       precision ${this.floatPrecision} float;
       precision highp int;
       precision mediump sampler2D;

       in vec2 uv;
       out vec4 fragColor;
       uniform sampler2D uTexture;
       uniform vec4 texsize;
       uniform float ed1;
       uniform float ed2;
       uniform float ed3;
       uniform vec4 wds;
       uniform float wdiv;

       void main(void) {
         float w1 = wds[0];
         float w2 = wds[1];
         float d1 = wds[2];
         float d2 = wds[3];

         vec2 uv2 = uv.xy;

         vec3 blur =
           ( texture(uTexture, uv2 + vec2(0.0, d1 * texsize.w) ).xyz
           + texture(uTexture, uv2 + vec2(0.0,-d1 * texsize.w) ).xyz) * w1 +
           ( texture(uTexture, uv2 + vec2(0.0, d2 * texsize.w) ).xyz
           + texture(uTexture, uv2 + vec2(0.0,-d2 * texsize.w) ).xyz) * w2;

         blur.xyz *= wdiv;

         float t = min(min(uv.x, uv.y), 1.0 - max(uv.x, uv.y));
         t = sqrt(t);
         t = ed1 + ed2 * clamp(t * ed3, 0.0, 1.0);
         blur.xyz *= t;

         fragColor = vec4(blur, 1.0);
       }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture"), this.texsizeLocation = this.gl.getUniformLocation(this.shaderProgram, "texsize"), this.ed1Loc = this.gl.getUniformLocation(this.shaderProgram, "ed1"), this.ed2Loc = this.gl.getUniformLocation(this.shaderProgram, "ed2"), this.ed3Loc = this.gl.getUniformLocation(this.shaderProgram, "ed3"), this.wdsLocation = this.gl.getUniformLocation(this.shaderProgram, "wds"), this.wdivLoc = this.gl.getUniformLocation(this.shaderProgram, "wdiv");
						}
					}, {
						key: "renderQuadTexture",
						value: function renderQuadTexture(e, t, n) {
							this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.uniform1i(this.textureLoc, 0);
							var r = this.blurLevel === 0 ? t.b1ed : 0;
							this.gl.uniform4fv(this.texsizeLocation, [
								n[0],
								n[1],
								1 / n[0],
								1 / n[1]
							]), this.gl.uniform1f(this.ed1Loc, 1 - r), this.gl.uniform1f(this.ed2Loc, r), this.gl.uniform1f(this.ed3Loc, 5), this.gl.uniform4fv(this.wdsLocation, this.wds), this.gl.uniform1f(this.wdivLoc, this.wDiv), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
						}
					}]), BlurVertical;
				}();
			}),
			"./src/rendering/shaders/comp.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function CompShader(e, t, n) {
						var i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
						_classCallCheck(this, CompShader), this.gl = e, this.noise = t, this.image = n, this.mesh_width = i.mesh_width, this.mesh_height = i.mesh_height, this.texsizeX = i.texsizeX, this.texsizeY = i.texsizeY, this.aspectx = i.aspectx, this.aspecty = i.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.compWidth = 32, this.compHeight = 24, this.buildPositions(), this.indexBuf = e.createBuffer(), this.positionVertexBuf = this.gl.createBuffer(), this.compColorVertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader(), this.mainSampler = this.gl.createSampler(), this.mainSamplerFW = this.gl.createSampler(), this.mainSamplerFC = this.gl.createSampler(), this.mainSamplerPW = this.gl.createSampler(), this.mainSamplerPC = this.gl.createSampler(), e.samplerParameteri(this.mainSampler, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR), e.samplerParameteri(this.mainSampler, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(this.mainSampler, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.mainSampler, e.TEXTURE_WRAP_T, e.REPEAT), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_WRAP_T, e.REPEAT), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_NEAREST), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_MAG_FILTER, e.NEAREST), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_WRAP_T, e.REPEAT), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_NEAREST), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_MAG_FILTER, e.NEAREST), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
					}
					return _createClass(CompShader, [
						{
							key: "buildPositions",
							value: function buildPositions() {
								for (var e = 2, t = 2, n = e / 2, r = t / 2, i = this.compWidth, a = this.compHeight, o = i + 1, s = a + 1, c = e / i, l = t / a, u = [], d = 0; d < s; d++) for (var f = d * l - r, p = 0; p < o; p++) {
									var m = p * c - n;
									u.push(m, -f, 0);
								}
								for (var h = [], g = 0; g < a; g++) for (var _ = 0; _ < i; _++) {
									var v = _ + o * g, y = _ + o * (g + 1), b = _ + 1 + o * (g + 1), x = _ + 1 + o * g;
									h.push(v, y, x), h.push(y, b, x);
								}
								this.vertices = new Float32Array(u), this.indices = new Uint16Array(h);
							}
						},
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.buildPositions();
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t, n;
								if (e.length === 0) t = "float orient_horiz = mod(echo_orientation, 2.0);\n                        float orient_x = (orient_horiz != 0.0) ? -1.0 : 1.0;\n                        float orient_y = (echo_orientation >= 2.0) ? -1.0 : 1.0;\n                        vec2 uv_echo = ((uv - 0.5) *\n                                        (1.0 / echo_zoom) *\n                                        vec2(orient_x, orient_y)) + 0.5;\n\n                        ret = mix(texture(sampler_main, uv).rgb,\n                                  texture(sampler_main, uv_echo).rgb,\n                                  echo_alpha);\n\n                        ret *= gammaAdj;\n\n                        if(fShader >= 1.0) {\n                          ret *= hue_shader;\n                        } else if(fShader > 0.001) {\n                          ret *= (1.0 - fShader) + (fShader * hue_shader);\n                        }\n\n                        if(brighten != 0) ret = sqrt(ret);\n                        if(darken != 0) ret = ret*ret;\n                        if(solarize != 0) ret = ret * (1.0 - ret) * 4.0;\n                        if(invert != 0) ret = 1.0 - ret;", n = "";
								else {
									var i = r.default.getShaderParts(e);
									n = i[0], t = i[1];
								}
								t = t.replace(/texture2D/g, "texture"), t = t.replace(/texture3D/g, "texture"), this.userTextures = r.default.getUserSamplers(n), this.shaderProgram = this.gl.createProgram();
								var a = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(a, "#version 300 es\n                                      const vec2 halfmad = vec2(0.5);\n                                      in vec2 aPos;\n                                      in vec4 aCompColor;\n                                      out vec2 vUv;\n                                      out vec4 vColor;\n                                      void main(void) {\n                                        gl_Position = vec4(aPos, 0.0, 1.0);\n                                        vUv = aPos * halfmad + halfmad;\n                                        vColor = aCompColor;\n                                      }"), this.gl.compileShader(a);
								var o = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(o, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      precision mediump sampler3D;

                                      vec3 lum(vec3 v){
                                          return vec3(dot(v, vec3(0.32,0.49,0.29)));
                                      }

                                      in vec2 vUv;
                                      in vec4 vColor;
                                      out vec4 fragColor;
                                      uniform sampler2D sampler_main;
                                      uniform sampler2D sampler_fw_main;
                                      uniform sampler2D sampler_fc_main;
                                      uniform sampler2D sampler_pw_main;
                                      uniform sampler2D sampler_pc_main;
                                      uniform sampler2D sampler_blur1;
                                      uniform sampler2D sampler_blur2;
                                      uniform sampler2D sampler_blur3;
                                      uniform sampler2D sampler_noise_lq;
                                      uniform sampler2D sampler_noise_lq_lite;
                                      uniform sampler2D sampler_noise_mq;
                                      uniform sampler2D sampler_noise_hq;
                                      uniform sampler2D sampler_pw_noise_lq;
                                      uniform sampler3D sampler_noisevol_lq;
                                      uniform sampler3D sampler_noisevol_hq;

                                      uniform float time;
                                      uniform float gammaAdj;
                                      uniform float echo_zoom;
                                      uniform float echo_alpha;
                                      uniform float echo_orientation;
                                      uniform int invert;
                                      uniform int brighten;
                                      uniform int darken;
                                      uniform int solarize;
                                      uniform vec2 resolution;
                                      uniform vec4 aspect;
                                      uniform vec4 texsize;
                                      uniform vec4 texsize_noise_lq;
                                      uniform vec4 texsize_noise_mq;
                                      uniform vec4 texsize_noise_hq;
                                      uniform vec4 texsize_noise_lq_lite;
                                      uniform vec4 texsize_noisevol_lq;
                                      uniform vec4 texsize_noisevol_hq;

                                      uniform float bass;
                                      uniform float mid;
                                      uniform float treb;
                                      uniform float vol;
                                      uniform float bass_att;
                                      uniform float mid_att;
                                      uniform float treb_att;
                                      uniform float vol_att;

                                      uniform float frame;
                                      uniform float fps;

                                      uniform vec4 _qa;
                                      uniform vec4 _qb;
                                      uniform vec4 _qc;
                                      uniform vec4 _qd;
                                      uniform vec4 _qe;
                                      uniform vec4 _qf;
                                      uniform vec4 _qg;
                                      uniform vec4 _qh;

                                      #define q1 _qa.x
                                      #define q2 _qa.y
                                      #define q3 _qa.z
                                      #define q4 _qa.w
                                      #define q5 _qb.x
                                      #define q6 _qb.y
                                      #define q7 _qb.z
                                      #define q8 _qb.w
                                      #define q9 _qc.x
                                      #define q10 _qc.y
                                      #define q11 _qc.z
                                      #define q12 _qc.w
                                      #define q13 _qd.x
                                      #define q14 _qd.y
                                      #define q15 _qd.z
                                      #define q16 _qd.w
                                      #define q17 _qe.x
                                      #define q18 _qe.y
                                      #define q19 _qe.z
                                      #define q20 _qe.w
                                      #define q21 _qf.x
                                      #define q22 _qf.y
                                      #define q23 _qf.z
                                      #define q24 _qf.w
                                      #define q25 _qg.x
                                      #define q26 _qg.y
                                      #define q27 _qg.z
                                      #define q28 _qg.w
                                      #define q29 _qh.x
                                      #define q30 _qh.y
                                      #define q31 _qh.z
                                      #define q32 _qh.w

                                      uniform vec4 slow_roam_cos;
                                      uniform vec4 roam_cos;
                                      uniform vec4 slow_roam_sin;
                                      uniform vec4 roam_sin;

                                      uniform float blur1_min;
                                      uniform float blur1_max;
                                      uniform float blur2_min;
                                      uniform float blur2_max;
                                      uniform float blur3_min;
                                      uniform float blur3_max;

                                      uniform float scale1;
                                      uniform float scale2;
                                      uniform float scale3;
                                      uniform float bias1;
                                      uniform float bias2;
                                      uniform float bias3;

                                      uniform vec4 rand_frame;
                                      uniform vec4 rand_preset;

                                      uniform float fShader;

                                      float PI = ${Math.PI};

                                      ${n}

                                      void main(void) {
                                        vec3 ret;
                                        vec2 uv = vUv;
                                        vec2 uv_orig = vUv;
                                        uv.y = 1.0 - uv.y;
                                        uv_orig.y = 1.0 - uv_orig.y;
                                        float rad = length(uv - 0.5);
                                        float ang = atan(uv.x - 0.5, uv.y - 0.5);
                                        vec3 hue_shader = vColor.rgb;

                                        ${t}

                                        fragColor = vec4(ret, vColor.a);
                                      }`), this.gl.compileShader(o), this.gl.attachShader(this.shaderProgram, a), this.gl.attachShader(this.shaderProgram, o), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.compColorLocation = this.gl.getAttribLocation(this.shaderProgram, "aCompColor"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_main"), this.textureFWLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_fw_main"), this.textureFCLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_fc_main"), this.texturePWLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_pw_main"), this.texturePCLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_pc_main"), this.blurTexture1Loc = this.gl.getUniformLocation(this.shaderProgram, "sampler_blur1"), this.blurTexture2Loc = this.gl.getUniformLocation(this.shaderProgram, "sampler_blur2"), this.blurTexture3Loc = this.gl.getUniformLocation(this.shaderProgram, "sampler_blur3"), this.noiseLQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_lq"), this.noiseMQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_mq"), this.noiseHQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_hq"), this.noiseLQLiteLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_lq_lite"), this.noisePointLQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_pw_noise_lq"), this.noiseVolLQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noisevol_lq"), this.noiseVolHQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noisevol_hq"), this.timeLoc = this.gl.getUniformLocation(this.shaderProgram, "time"), this.gammaAdjLoc = this.gl.getUniformLocation(this.shaderProgram, "gammaAdj"), this.echoZoomLoc = this.gl.getUniformLocation(this.shaderProgram, "echo_zoom"), this.echoAlphaLoc = this.gl.getUniformLocation(this.shaderProgram, "echo_alpha"), this.echoOrientationLoc = this.gl.getUniformLocation(this.shaderProgram, "echo_orientation"), this.invertLoc = this.gl.getUniformLocation(this.shaderProgram, "invert"), this.brightenLoc = this.gl.getUniformLocation(this.shaderProgram, "brighten"), this.darkenLoc = this.gl.getUniformLocation(this.shaderProgram, "darken"), this.solarizeLoc = this.gl.getUniformLocation(this.shaderProgram, "solarize"), this.texsizeLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize"), this.texsizeNoiseLQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_lq"), this.texsizeNoiseMQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_mq"), this.texsizeNoiseHQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_hq"), this.texsizeNoiseLQLiteLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_lq_lite"), this.texsizeNoiseVolLQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noisevol_lq"), this.texsizeNoiseVolHQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noisevol_hq"), this.resolutionLoc = this.gl.getUniformLocation(this.shaderProgram, "resolution"), this.aspectLoc = this.gl.getUniformLocation(this.shaderProgram, "aspect"), this.bassLoc = this.gl.getUniformLocation(this.shaderProgram, "bass"), this.midLoc = this.gl.getUniformLocation(this.shaderProgram, "mid"), this.trebLoc = this.gl.getUniformLocation(this.shaderProgram, "treb"), this.volLoc = this.gl.getUniformLocation(this.shaderProgram, "vol"), this.bassAttLoc = this.gl.getUniformLocation(this.shaderProgram, "bass_att"), this.midAttLoc = this.gl.getUniformLocation(this.shaderProgram, "mid_att"), this.trebAttLoc = this.gl.getUniformLocation(this.shaderProgram, "treb_att"), this.volAttLoc = this.gl.getUniformLocation(this.shaderProgram, "vol_att"), this.frameLoc = this.gl.getUniformLocation(this.shaderProgram, "frame"), this.fpsLoc = this.gl.getUniformLocation(this.shaderProgram, "fps"), this.blur1MinLoc = this.gl.getUniformLocation(this.shaderProgram, "blur1_min"), this.blur1MaxLoc = this.gl.getUniformLocation(this.shaderProgram, "blur1_max"), this.blur2MinLoc = this.gl.getUniformLocation(this.shaderProgram, "blur2_min"), this.blur2MaxLoc = this.gl.getUniformLocation(this.shaderProgram, "blur2_max"), this.blur3MinLoc = this.gl.getUniformLocation(this.shaderProgram, "blur3_min"), this.blur3MaxLoc = this.gl.getUniformLocation(this.shaderProgram, "blur3_max"), this.scale1Loc = this.gl.getUniformLocation(this.shaderProgram, "scale1"), this.scale2Loc = this.gl.getUniformLocation(this.shaderProgram, "scale2"), this.scale3Loc = this.gl.getUniformLocation(this.shaderProgram, "scale3"), this.bias1Loc = this.gl.getUniformLocation(this.shaderProgram, "bias1"), this.bias2Loc = this.gl.getUniformLocation(this.shaderProgram, "bias2"), this.bias3Loc = this.gl.getUniformLocation(this.shaderProgram, "bias3"), this.randPresetLoc = this.gl.getUniformLocation(this.shaderProgram, "rand_preset"), this.randFrameLoc = this.gl.getUniformLocation(this.shaderProgram, "rand_frame"), this.fShaderLoc = this.gl.getUniformLocation(this.shaderProgram, "fShader"), this.qaLoc = this.gl.getUniformLocation(this.shaderProgram, "_qa"), this.qbLoc = this.gl.getUniformLocation(this.shaderProgram, "_qb"), this.qcLoc = this.gl.getUniformLocation(this.shaderProgram, "_qc"), this.qdLoc = this.gl.getUniformLocation(this.shaderProgram, "_qd"), this.qeLoc = this.gl.getUniformLocation(this.shaderProgram, "_qe"), this.qfLoc = this.gl.getUniformLocation(this.shaderProgram, "_qf"), this.qgLoc = this.gl.getUniformLocation(this.shaderProgram, "_qg"), this.qhLoc = this.gl.getUniformLocation(this.shaderProgram, "_qh"), this.slowRoamCosLoc = this.gl.getUniformLocation(this.shaderProgram, "slow_roam_cos"), this.roamCosLoc = this.gl.getUniformLocation(this.shaderProgram, "roam_cos"), this.slowRoamSinLoc = this.gl.getUniformLocation(this.shaderProgram, "slow_roam_sin"), this.roamSinLoc = this.gl.getUniformLocation(this.shaderProgram, "roam_sin");
								for (var s = 0; s < this.userTextures.length; s++) {
									var c = this.userTextures[s];
									c.textureLoc = this.gl.getUniformLocation(this.shaderProgram, `sampler_${c.sampler}`);
								}
							}
						},
						{
							key: "updateShader",
							value: function updateShader(e) {
								this.createShader(e);
							}
						},
						{
							key: "bindBlurVals",
							value: function bindBlurVals(e, t) {
								var n = e[0], r = e[1], i = e[2], a = t[0], o = t[1], s = t[2], c = a - n, l = n, u = o - r, d = r, f = s - i, p = i;
								this.gl.uniform1f(this.blur1MinLoc, n), this.gl.uniform1f(this.blur1MaxLoc, a), this.gl.uniform1f(this.blur2MinLoc, r), this.gl.uniform1f(this.blur2MaxLoc, o), this.gl.uniform1f(this.blur3MinLoc, i), this.gl.uniform1f(this.blur3MaxLoc, s), this.gl.uniform1f(this.scale1Loc, c), this.gl.uniform1f(this.scale2Loc, u), this.gl.uniform1f(this.scale3Loc, f), this.gl.uniform1f(this.bias1Loc, l), this.gl.uniform1f(this.bias2Loc, d), this.gl.uniform1f(this.bias3Loc, p);
							}
						},
						{
							key: "generateCompColors",
							value: function generateCompColors(e, t, n) {
								for (var r = CompShader.generateHueBase(t), i = this.compWidth + 1, a = this.compHeight + 1, o = new Float32Array(i * a * 4), s = 0, c = 0; c < a; c++) for (var l = 0; l < i; l++) {
									for (var u = l / this.compWidth, d = c / this.compHeight, f = [
										1,
										1,
										1
									], p = 0; p < 3; p++) f[p] = r[0 + p] * u * d + r[3 + p] * (1 - u) * d + r[6 + p] * u * (1 - d) + r[9 + p] * (1 - u) * (1 - d);
									var m = 1;
									if (e) {
										u *= this.mesh_width + 1, d *= this.mesh_height + 1, u = Math.clamp(u, 0, this.mesh_width - 1), d = Math.clamp(d, 0, this.mesh_height - 1);
										var h = Math.floor(u), g = Math.floor(d), _ = u - h, v = d - g, y = n[(g * (this.mesh_width + 1) + h) * 4 + 3], b = n[(g * (this.mesh_width + 1) + (h + 1)) * 4 + 3], x = n[((g + 1) * (this.mesh_width + 1) + h) * 4 + 3], S = n[((g + 1) * (this.mesh_width + 1) + (h + 1)) * 4 + 3];
										m = y * (1 - _) * (1 - v) + b * _ * (1 - v) + x * (1 - _) * v + S * _ * v;
									}
									o[s + 0] = f[0], o[s + 1] = f[1], o[s + 2] = f[2], o[s + 3] = m, s += 4;
								}
								return o;
							}
						},
						{
							key: "renderQuadTexture",
							value: function renderQuadTexture(e, t, n, r, i, a, o, s, c) {
								var l = this.generateCompColors(e, s, c);
								this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuf), this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.compColorVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, l, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.compColorLocation, 4, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.compColorLocation);
								var u = s.wrap === 0 ? this.gl.CLAMP_TO_EDGE : this.gl.REPEAT;
								this.gl.samplerParameteri(this.mainSampler, this.gl.TEXTURE_WRAP_S, u), this.gl.samplerParameteri(this.mainSampler, this.gl.TEXTURE_WRAP_T, u), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(0, this.mainSampler), this.gl.uniform1i(this.textureLoc, 0), this.gl.activeTexture(this.gl.TEXTURE1), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(1, this.mainSamplerFW), this.gl.uniform1i(this.textureFWLoc, 1), this.gl.activeTexture(this.gl.TEXTURE2), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(2, this.mainSamplerFC), this.gl.uniform1i(this.textureFCLoc, 2), this.gl.activeTexture(this.gl.TEXTURE3), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(3, this.mainSamplerPW), this.gl.uniform1i(this.texturePWLoc, 3), this.gl.activeTexture(this.gl.TEXTURE4), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(4, this.mainSamplerPC), this.gl.uniform1i(this.texturePCLoc, 4), this.gl.activeTexture(this.gl.TEXTURE5), this.gl.bindTexture(this.gl.TEXTURE_2D, n), this.gl.uniform1i(this.blurTexture1Loc, 5), this.gl.activeTexture(this.gl.TEXTURE6), this.gl.bindTexture(this.gl.TEXTURE_2D, r), this.gl.uniform1i(this.blurTexture2Loc, 6), this.gl.activeTexture(this.gl.TEXTURE7), this.gl.bindTexture(this.gl.TEXTURE_2D, i), this.gl.uniform1i(this.blurTexture3Loc, 7), this.gl.activeTexture(this.gl.TEXTURE8), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexLQ), this.gl.uniform1i(this.noiseLQLoc, 8), this.gl.activeTexture(this.gl.TEXTURE9), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexMQ), this.gl.uniform1i(this.noiseMQLoc, 9), this.gl.activeTexture(this.gl.TEXTURE10), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexHQ), this.gl.uniform1i(this.noiseHQLoc, 10), this.gl.activeTexture(this.gl.TEXTURE11), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexLQLite), this.gl.uniform1i(this.noiseLQLiteLoc, 11), this.gl.activeTexture(this.gl.TEXTURE12), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexLQ), this.gl.bindSampler(12, this.noise.noiseTexPointLQ), this.gl.uniform1i(this.noisePointLQLoc, 12), this.gl.activeTexture(this.gl.TEXTURE13), this.gl.bindTexture(this.gl.TEXTURE_3D, this.noise.noiseTexVolLQ), this.gl.uniform1i(this.noiseVolLQLoc, 13), this.gl.activeTexture(this.gl.TEXTURE14), this.gl.bindTexture(this.gl.TEXTURE_3D, this.noise.noiseTexVolHQ), this.gl.uniform1i(this.noiseVolHQLoc, 14);
								for (var d = 0; d < this.userTextures.length; d++) {
									var f = this.userTextures[d];
									this.gl.activeTexture(this.gl.TEXTURE15 + d), this.gl.bindTexture(this.gl.TEXTURE_2D, this.image.getTexture(f.sampler)), this.gl.uniform1i(f.textureLoc, 15 + d);
								}
								this.gl.uniform1f(this.timeLoc, s.time), this.gl.uniform1f(this.gammaAdjLoc, s.gammaadj), this.gl.uniform1f(this.echoZoomLoc, s.echo_zoom), this.gl.uniform1f(this.echoAlphaLoc, s.echo_alpha), this.gl.uniform1f(this.echoOrientationLoc, s.echo_orient), this.gl.uniform1i(this.invertLoc, s.invert), this.gl.uniform1i(this.brightenLoc, s.brighten), this.gl.uniform1i(this.darkenLoc, s.darken), this.gl.uniform1i(this.solarizeLoc, s.solarize), this.gl.uniform2fv(this.resolutionLoc, [this.texsizeX, this.texsizeY]), this.gl.uniform4fv(this.aspectLoc, [
									this.aspectx,
									this.aspecty,
									this.invAspectx,
									this.invAspecty
								]), this.gl.uniform4fv(this.texsizeLoc, new Float32Array([
									this.texsizeX,
									this.texsizeY,
									1 / this.texsizeX,
									1 / this.texsizeY
								])), this.gl.uniform4fv(this.texsizeNoiseLQLoc, [
									256,
									256,
									1 / 256,
									1 / 256
								]), this.gl.uniform4fv(this.texsizeNoiseMQLoc, [
									256,
									256,
									1 / 256,
									1 / 256
								]), this.gl.uniform4fv(this.texsizeNoiseHQLoc, [
									256,
									256,
									1 / 256,
									1 / 256
								]), this.gl.uniform4fv(this.texsizeNoiseLQLiteLoc, [
									32,
									32,
									1 / 32,
									1 / 32
								]), this.gl.uniform4fv(this.texsizeNoiseVolLQLoc, [
									32,
									32,
									1 / 32,
									1 / 32
								]), this.gl.uniform4fv(this.texsizeNoiseVolHQLoc, [
									32,
									32,
									1 / 32,
									1 / 32
								]), this.gl.uniform1f(this.bassLoc, s.bass), this.gl.uniform1f(this.midLoc, s.mid), this.gl.uniform1f(this.trebLoc, s.treb), this.gl.uniform1f(this.volLoc, (s.bass + s.mid + s.treb) / 3), this.gl.uniform1f(this.bassAttLoc, s.bass_att), this.gl.uniform1f(this.midAttLoc, s.mid_att), this.gl.uniform1f(this.trebAttLoc, s.treb_att), this.gl.uniform1f(this.volAttLoc, (s.bass_att + s.mid_att + s.treb_att) / 3), this.gl.uniform1f(this.frameLoc, s.frame), this.gl.uniform1f(this.fpsLoc, s.fps), this.gl.uniform4fv(this.randPresetLoc, s.rand_preset), this.gl.uniform4fv(this.randFrameLoc, new Float32Array([
									Math.random(),
									Math.random(),
									Math.random(),
									Math.random()
								])), this.gl.uniform1f(this.fShaderLoc, s.fshader), this.gl.uniform4fv(this.qaLoc, new Float32Array([
									s.q1 || 0,
									s.q2 || 0,
									s.q3 || 0,
									s.q4 || 0
								])), this.gl.uniform4fv(this.qbLoc, new Float32Array([
									s.q5 || 0,
									s.q6 || 0,
									s.q7 || 0,
									s.q8 || 0
								])), this.gl.uniform4fv(this.qcLoc, new Float32Array([
									s.q9 || 0,
									s.q10 || 0,
									s.q11 || 0,
									s.q12 || 0
								])), this.gl.uniform4fv(this.qdLoc, new Float32Array([
									s.q13 || 0,
									s.q14 || 0,
									s.q15 || 0,
									s.q16 || 0
								])), this.gl.uniform4fv(this.qeLoc, new Float32Array([
									s.q17 || 0,
									s.q18 || 0,
									s.q19 || 0,
									s.q20 || 0
								])), this.gl.uniform4fv(this.qfLoc, new Float32Array([
									s.q21 || 0,
									s.q22 || 0,
									s.q23 || 0,
									s.q24 || 0
								])), this.gl.uniform4fv(this.qgLoc, new Float32Array([
									s.q25 || 0,
									s.q26 || 0,
									s.q27 || 0,
									s.q28 || 0
								])), this.gl.uniform4fv(this.qhLoc, new Float32Array([
									s.q29 || 0,
									s.q30 || 0,
									s.q31 || 0,
									s.q32 || 0
								])), this.gl.uniform4fv(this.slowRoamCosLoc, [
									.5 + .5 * Math.cos(s.time * .005),
									.5 + .5 * Math.cos(s.time * .008),
									.5 + .5 * Math.cos(s.time * .013),
									.5 + .5 * Math.cos(s.time * .022)
								]), this.gl.uniform4fv(this.roamCosLoc, [
									.5 + .5 * Math.cos(s.time * .3),
									.5 + .5 * Math.cos(s.time * 1.3),
									.5 + .5 * Math.cos(s.time * 5),
									.5 + .5 * Math.cos(s.time * 20)
								]), this.gl.uniform4fv(this.slowRoamSinLoc, [
									.5 + .5 * Math.sin(s.time * .005),
									.5 + .5 * Math.sin(s.time * .008),
									.5 + .5 * Math.sin(s.time * .013),
									.5 + .5 * Math.sin(s.time * .022)
								]), this.gl.uniform4fv(this.roamSinLoc, [
									.5 + .5 * Math.sin(s.time * .3),
									.5 + .5 * Math.sin(s.time * 1.3),
									.5 + .5 * Math.sin(s.time * 5),
									.5 + .5 * Math.sin(s.time * 20)
								]), this.bindBlurVals(a, o), e ? this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA) : this.gl.disable(this.gl.BLEND), this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0), e || this.gl.enable(this.gl.BLEND);
							}
						}
					], [{
						key: "generateHueBase",
						value: function generateHueBase(e) {
							for (var t = new Float32Array([
								1,
								1,
								1,
								1,
								1,
								1,
								1,
								1,
								1,
								1,
								1,
								1
							]), n = 0; n < 4; n++) {
								t[n * 3 + 0] = .6 + .3 * Math.sin(e.time * 30 * .0143 + 3 + n * 21 + e.rand_start[3]), t[n * 3 + 1] = .6 + .3 * Math.sin(e.time * 30 * .0107 + 1 + n * 13 + e.rand_start[1]), t[n * 3 + 2] = .6 + .3 * Math.sin(e.time * 30 * .0129 + 6 + n * 9 + e.rand_start[2]);
								for (var r = Math.max(t[n * 3], t[n * 3 + 1], t[n * 3 + 2]), i = 0; i < 3; i++) t[n * 3 + i] = t[n * 3 + i] / r, t[n * 3 + i] = .5 + .5 * t[n * 3 + i];
							}
							return t;
						}
					}]), CompShader;
				}();
			}),
			"./src/rendering/shaders/output.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function OutputShader(e, t) {
						_classCallCheck(this, OutputShader), this.gl = e, this.textureRatio = t.textureRatio, this.texsizeX = t.texsizeX, this.texsizeY = t.texsizeY, this.positions = new Float32Array([
							-1,
							-1,
							1,
							-1,
							-1,
							1,
							1,
							1
						]), this.vertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.useFXAA() ? this.createFXAAShader() : this.createShader();
					}
					return _createClass(OutputShader, [
						{
							key: "useFXAA",
							value: function useFXAA() {
								return this.textureRatio <= 1;
							}
						},
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.textureRatio = e.textureRatio, this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.gl.deleteProgram(this.shaderProgram), this.useFXAA() ? this.createFXAAShader() : this.createShader();
							}
						},
						{
							key: "createFXAAShader",
							value: function createFXAAShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n       const vec2 halfmad = vec2(0.5);\n       in vec2 aPos;\n       out vec2 v_rgbM;\n       out vec2 v_rgbNW;\n       out vec2 v_rgbNE;\n       out vec2 v_rgbSW;\n       out vec2 v_rgbSE;\n       uniform vec4 texsize;\n       void main(void) {\n         gl_Position = vec4(aPos, 0.0, 1.0);\n\n         v_rgbM = aPos * halfmad + halfmad;\n         v_rgbNW = v_rgbM + (vec2(-1.0, -1.0) * texsize.zx);\n         v_rgbNE = v_rgbM + (vec2(1.0, -1.0) * texsize.zx);\n         v_rgbSW = v_rgbM + (vec2(-1.0, 1.0) * texsize.zx);\n         v_rgbSE = v_rgbM + (vec2(1.0, 1.0) * texsize.zx);\n       }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
       precision ${this.floatPrecision} float;
       precision highp int;
       precision mediump sampler2D;

       in vec2 v_rgbM;
       in vec2 v_rgbNW;
       in vec2 v_rgbNE;
       in vec2 v_rgbSW;
       in vec2 v_rgbSE;
       out vec4 fragColor;
       uniform vec4 texsize;
       uniform sampler2D uTexture;

       #ifndef FXAA_REDUCE_MIN
         #define FXAA_REDUCE_MIN   (1.0/ 128.0)
       #endif
       #ifndef FXAA_REDUCE_MUL
         #define FXAA_REDUCE_MUL   (1.0 / 8.0)
       #endif
       #ifndef FXAA_SPAN_MAX
         #define FXAA_SPAN_MAX     8.0
       #endif

       void main(void) {
         vec4 color;
         vec3 rgbNW = textureLod(uTexture, v_rgbNW, 0.0).xyz;
         vec3 rgbNE = textureLod(uTexture, v_rgbNE, 0.0).xyz;
         vec3 rgbSW = textureLod(uTexture, v_rgbSW, 0.0).xyz;
         vec3 rgbSE = textureLod(uTexture, v_rgbSE, 0.0).xyz;
         vec3 rgbM  = textureLod(uTexture, v_rgbM, 0.0).xyz;
         vec3 luma = vec3(0.299, 0.587, 0.114);
         float lumaNW = dot(rgbNW, luma);
         float lumaNE = dot(rgbNE, luma);
         float lumaSW = dot(rgbSW, luma);
         float lumaSE = dot(rgbSE, luma);
         float lumaM  = dot(rgbM,  luma);
         float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
         float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

         mediump vec2 dir;
         dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
         dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

         float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                               (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

         float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
         dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
                   max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
                   dir * rcpDirMin)) * texsize.zw;

         vec3 rgbA = 0.5 * (
             textureLod(uTexture, v_rgbM + dir * (1.0 / 3.0 - 0.5), 0.0).xyz +
             textureLod(uTexture, v_rgbM + dir * (2.0 / 3.0 - 0.5), 0.0).xyz);
         vec3 rgbB = rgbA * 0.5 + 0.25 * (
             textureLod(uTexture, v_rgbM + dir * -0.5, 0.0).xyz +
             textureLod(uTexture, v_rgbM + dir * 0.5, 0.0).xyz);

         float lumaB = dot(rgbB, luma);
         if ((lumaB < lumaMin) || (lumaB > lumaMax))
           color = vec4(rgbA, 1.0);
         else
           color = vec4(rgbB, 1.0);

         fragColor = color;
       }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture"), this.texsizeLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize");
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n       const vec2 halfmad = vec2(0.5);\n       in vec2 aPos;\n       out vec2 uv;\n       void main(void) {\n         gl_Position = vec4(aPos, 0.0, 1.0);\n         uv = aPos * halfmad + halfmad;\n       }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
       precision ${this.floatPrecision} float;
       precision highp int;
       precision mediump sampler2D;

       in vec2 uv;
       out vec4 fragColor;
       uniform sampler2D uTexture;

       void main(void) {
         fragColor = vec4(texture(uTexture, uv).rgb, 1.0);
       }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture");
							}
						},
						{
							key: "renderQuadTexture",
							value: function renderQuadTexture(e) {
								this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.uniform1i(this.textureLoc, 0), this.useFXAA() && this.gl.uniform4fv(this.texsizeLoc, new Float32Array([
									this.texsizeX,
									this.texsizeY,
									1 / this.texsizeX,
									1 / this.texsizeY
								])), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
							}
						}
					]), OutputShader;
				}();
			}),
			"./src/rendering/shaders/resample.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function ResampleShader(e) {
						_classCallCheck(this, ResampleShader), this.gl = e, this.positions = new Float32Array([
							-1,
							-1,
							1,
							-1,
							-1,
							1,
							1,
							1
						]), this.vertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(ResampleShader, [{
						key: "createShader",
						value: function createShader() {
							this.shaderProgram = this.gl.createProgram();
							var e = this.gl.createShader(this.gl.VERTEX_SHADER);
							this.gl.shaderSource(e, "#version 300 es\n       const vec2 halfmad = vec2(0.5);\n       in vec2 aPos;\n       out vec2 uv;\n       void main(void) {\n         gl_Position = vec4(aPos, 0.0, 1.0);\n         uv = aPos * halfmad + halfmad;\n       }"), this.gl.compileShader(e);
							var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
							this.gl.shaderSource(t, `#version 300 es
       precision ${this.floatPrecision} float;
       precision highp int;
       precision mediump sampler2D;

       in vec2 uv;
       out vec4 fragColor;
       uniform sampler2D uTexture;

       void main(void) {
         fragColor = vec4(texture(uTexture, uv).rgb, 1.0);
       }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture");
						}
					}, {
						key: "renderQuadTexture",
						value: function renderQuadTexture(e) {
							this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.gl.uniform1i(this.textureLoc, 0), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
						}
					}]), ResampleShader;
				}();
			}),
			"./src/rendering/shaders/shaderUtils.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return a;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /uniform sampler2D sampler_(?:.+?);/g, i = /uniform sampler2D sampler_(.+?);/, a = /*#__PURE__*/ function() {
					function ShaderUtils() {
						_classCallCheck(this, ShaderUtils);
					}
					return _createClass(ShaderUtils, null, [
						{
							key: "getShaderParts",
							value: function getShaderParts(e) {
								var t = e.indexOf("shader_body");
								if (e && t > -1) {
									var n = e.substring(0, t), r = e.substring(t), i = r.indexOf("{"), a = r.lastIndexOf("}");
									return [n, r.substring(i + 1, a)];
								}
								return ["", e];
							}
						},
						{
							key: "getFragmentFloatPrecision",
							value: function getFragmentFloatPrecision(e) {
								return e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).precision > 0 ? "highp" : e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_FLOAT).precision > 0 ? "mediump" : "lowp";
							}
						},
						{
							key: "getUserSamplers",
							value: function getUserSamplers(e) {
								var t = [], n = e.match(r);
								if (n && n.length > 0) for (var a = 0; a < n.length; a++) {
									var o = n[a].match(i);
									if (o && o.length > 0) {
										var s = o[1];
										t.push({ sampler: s });
									}
								}
								return t;
							}
						}
					]), ShaderUtils;
				}();
			}),
			"./src/rendering/shaders/warp.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function WarpShader(e, t, n) {
						var i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
						_classCallCheck(this, WarpShader), this.gl = e, this.noise = t, this.image = n, this.texsizeX = i.texsizeX, this.texsizeY = i.texsizeY, this.mesh_width = i.mesh_width, this.mesh_height = i.mesh_height, this.aspectx = i.aspectx, this.aspecty = i.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.buildPositions(), this.indexBuf = e.createBuffer(), this.positionVertexBuf = this.gl.createBuffer(), this.warpUvVertexBuf = this.gl.createBuffer(), this.warpColorVertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader(), this.mainSampler = this.gl.createSampler(), this.mainSamplerFW = this.gl.createSampler(), this.mainSamplerFC = this.gl.createSampler(), this.mainSamplerPW = this.gl.createSampler(), this.mainSamplerPC = this.gl.createSampler(), e.samplerParameteri(this.mainSampler, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR), e.samplerParameteri(this.mainSampler, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(this.mainSampler, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.mainSampler, e.TEXTURE_WRAP_T, e.REPEAT), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.mainSamplerFW, e.TEXTURE_WRAP_T, e.REPEAT), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_MIN_FILTER, e.LINEAR_MIPMAP_LINEAR), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_MAG_FILTER, e.LINEAR), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.samplerParameteri(this.mainSamplerFC, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_NEAREST), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_MAG_FILTER, e.NEAREST), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_WRAP_S, e.REPEAT), e.samplerParameteri(this.mainSamplerPW, e.TEXTURE_WRAP_T, e.REPEAT), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_MIN_FILTER, e.NEAREST_MIPMAP_NEAREST), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_MAG_FILTER, e.NEAREST), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.samplerParameteri(this.mainSamplerPC, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
					}
					return _createClass(WarpShader, [
						{
							key: "buildPositions",
							value: function buildPositions() {
								for (var e = 2, t = 2, n = e / 2, r = t / 2, i = this.mesh_width, a = this.mesh_height, o = i + 1, s = a + 1, c = e / i, l = t / a, u = [], d = 0; d < s; d++) for (var f = d * l - r, p = 0; p < o; p++) {
									var m = p * c - n;
									u.push(m, -f, 0);
								}
								for (var h = [], g = 0; g < a; g++) for (var _ = 0; _ < i; _++) {
									var v = _ + o * g, y = _ + o * (g + 1), b = _ + 1 + o * (g + 1), x = _ + 1 + o * g;
									h.push(v, y, x), h.push(y, b, x);
								}
								this.vertices = new Float32Array(u), this.indices = new Uint16Array(h);
							}
						},
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.buildPositions();
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", t, n;
								if (e.length === 0) t = "ret = texture(sampler_main, uv).rgb * decay;", n = "";
								else {
									var i = r.default.getShaderParts(e);
									n = i[0], t = i[1];
								}
								t = t.replace(/texture2D/g, "texture"), t = t.replace(/texture3D/g, "texture"), this.userTextures = r.default.getUserSamplers(n), this.shaderProgram = this.gl.createProgram();
								var a = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(a, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      const vec2 halfmad = vec2(0.5);
                                      in vec2 aPos;
                                      in vec2 aWarpUv;
                                      in vec4 aWarpColor;
                                      out vec2 uv;
                                      out vec2 uv_orig;
                                      out vec4 vColor;
                                      void main(void) {
                                        gl_Position = vec4(aPos, 0.0, 1.0);
                                        uv_orig = aPos * halfmad + halfmad;
                                        uv = aWarpUv;
                                        vColor = aWarpColor;
                                      }`), this.gl.compileShader(a);
								var o = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(o, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      precision mediump sampler3D;

                                      in vec2 uv;
                                      in vec2 uv_orig;
                                      in vec4 vColor;
                                      out vec4 fragColor;
                                      uniform sampler2D sampler_main;
                                      uniform sampler2D sampler_fw_main;
                                      uniform sampler2D sampler_fc_main;
                                      uniform sampler2D sampler_pw_main;
                                      uniform sampler2D sampler_pc_main;
                                      uniform sampler2D sampler_blur1;
                                      uniform sampler2D sampler_blur2;
                                      uniform sampler2D sampler_blur3;
                                      uniform sampler2D sampler_noise_lq;
                                      uniform sampler2D sampler_noise_lq_lite;
                                      uniform sampler2D sampler_noise_mq;
                                      uniform sampler2D sampler_noise_hq;
                                      uniform sampler2D sampler_pw_noise_lq;
                                      uniform sampler3D sampler_noisevol_lq;
                                      uniform sampler3D sampler_noisevol_hq;
                                      uniform float time;
                                      uniform float decay;
                                      uniform vec2 resolution;
                                      uniform vec4 aspect;
                                      uniform vec4 texsize;
                                      uniform vec4 texsize_noise_lq;
                                      uniform vec4 texsize_noise_mq;
                                      uniform vec4 texsize_noise_hq;
                                      uniform vec4 texsize_noise_lq_lite;
                                      uniform vec4 texsize_noisevol_lq;
                                      uniform vec4 texsize_noisevol_hq;

                                      uniform float bass;
                                      uniform float mid;
                                      uniform float treb;
                                      uniform float vol;
                                      uniform float bass_att;
                                      uniform float mid_att;
                                      uniform float treb_att;
                                      uniform float vol_att;

                                      uniform float frame;
                                      uniform float fps;

                                      uniform vec4 _qa;
                                      uniform vec4 _qb;
                                      uniform vec4 _qc;
                                      uniform vec4 _qd;
                                      uniform vec4 _qe;
                                      uniform vec4 _qf;
                                      uniform vec4 _qg;
                                      uniform vec4 _qh;

                                      #define q1 _qa.x
                                      #define q2 _qa.y
                                      #define q3 _qa.z
                                      #define q4 _qa.w
                                      #define q5 _qb.x
                                      #define q6 _qb.y
                                      #define q7 _qb.z
                                      #define q8 _qb.w
                                      #define q9 _qc.x
                                      #define q10 _qc.y
                                      #define q11 _qc.z
                                      #define q12 _qc.w
                                      #define q13 _qd.x
                                      #define q14 _qd.y
                                      #define q15 _qd.z
                                      #define q16 _qd.w
                                      #define q17 _qe.x
                                      #define q18 _qe.y
                                      #define q19 _qe.z
                                      #define q20 _qe.w
                                      #define q21 _qf.x
                                      #define q22 _qf.y
                                      #define q23 _qf.z
                                      #define q24 _qf.w
                                      #define q25 _qg.x
                                      #define q26 _qg.y
                                      #define q27 _qg.z
                                      #define q28 _qg.w
                                      #define q29 _qh.x
                                      #define q30 _qh.y
                                      #define q31 _qh.z
                                      #define q32 _qh.w

                                      uniform vec4 slow_roam_cos;
                                      uniform vec4 roam_cos;
                                      uniform vec4 slow_roam_sin;
                                      uniform vec4 roam_sin;

                                      uniform float blur1_min;
                                      uniform float blur1_max;
                                      uniform float blur2_min;
                                      uniform float blur2_max;
                                      uniform float blur3_min;
                                      uniform float blur3_max;

                                      uniform float scale1;
                                      uniform float scale2;
                                      uniform float scale3;
                                      uniform float bias1;
                                      uniform float bias2;
                                      uniform float bias3;

                                      uniform vec4 rand_frame;
                                      uniform vec4 rand_preset;

                                      float PI = ${Math.PI};

                                      ${n}

                                      void main(void) {
                                        vec3 ret;
                                        float rad = length(uv_orig - 0.5);
                                        float ang = atan(uv_orig.x - 0.5, uv_orig.y - 0.5);

                                        ${t}

                                        fragColor = vec4(ret, 1.0) * vColor;
                                      }`), this.gl.compileShader(o), this.gl.attachShader(this.shaderProgram, a), this.gl.attachShader(this.shaderProgram, o), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.warpUvLocation = this.gl.getAttribLocation(this.shaderProgram, "aWarpUv"), this.warpColorLocation = this.gl.getAttribLocation(this.shaderProgram, "aWarpColor"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_main"), this.textureFWLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_fw_main"), this.textureFCLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_fc_main"), this.texturePWLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_pw_main"), this.texturePCLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_pc_main"), this.blurTexture1Loc = this.gl.getUniformLocation(this.shaderProgram, "sampler_blur1"), this.blurTexture2Loc = this.gl.getUniformLocation(this.shaderProgram, "sampler_blur2"), this.blurTexture3Loc = this.gl.getUniformLocation(this.shaderProgram, "sampler_blur3"), this.noiseLQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_lq"), this.noiseMQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_mq"), this.noiseHQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_hq"), this.noiseLQLiteLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noise_lq_lite"), this.noisePointLQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_pw_noise_lq"), this.noiseVolLQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noisevol_lq"), this.noiseVolHQLoc = this.gl.getUniformLocation(this.shaderProgram, "sampler_noisevol_hq"), this.decayLoc = this.gl.getUniformLocation(this.shaderProgram, "decay"), this.texsizeLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize"), this.texsizeNoiseLQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_lq"), this.texsizeNoiseMQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_mq"), this.texsizeNoiseHQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_hq"), this.texsizeNoiseLQLiteLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noise_lq_lite"), this.texsizeNoiseVolLQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noisevol_lq"), this.texsizeNoiseVolHQLoc = this.gl.getUniformLocation(this.shaderProgram, "texsize_noisevol_hq"), this.resolutionLoc = this.gl.getUniformLocation(this.shaderProgram, "resolution"), this.aspectLoc = this.gl.getUniformLocation(this.shaderProgram, "aspect"), this.bassLoc = this.gl.getUniformLocation(this.shaderProgram, "bass"), this.midLoc = this.gl.getUniformLocation(this.shaderProgram, "mid"), this.trebLoc = this.gl.getUniformLocation(this.shaderProgram, "treb"), this.volLoc = this.gl.getUniformLocation(this.shaderProgram, "vol"), this.bassAttLoc = this.gl.getUniformLocation(this.shaderProgram, "bass_att"), this.midAttLoc = this.gl.getUniformLocation(this.shaderProgram, "mid_att"), this.trebAttLoc = this.gl.getUniformLocation(this.shaderProgram, "treb_att"), this.volAttLoc = this.gl.getUniformLocation(this.shaderProgram, "vol_att"), this.timeLoc = this.gl.getUniformLocation(this.shaderProgram, "time"), this.frameLoc = this.gl.getUniformLocation(this.shaderProgram, "frame"), this.fpsLoc = this.gl.getUniformLocation(this.shaderProgram, "fps"), this.blur1MinLoc = this.gl.getUniformLocation(this.shaderProgram, "blur1_min"), this.blur1MaxLoc = this.gl.getUniformLocation(this.shaderProgram, "blur1_max"), this.blur2MinLoc = this.gl.getUniformLocation(this.shaderProgram, "blur2_min"), this.blur2MaxLoc = this.gl.getUniformLocation(this.shaderProgram, "blur2_max"), this.blur3MinLoc = this.gl.getUniformLocation(this.shaderProgram, "blur3_min"), this.blur3MaxLoc = this.gl.getUniformLocation(this.shaderProgram, "blur3_max"), this.scale1Loc = this.gl.getUniformLocation(this.shaderProgram, "scale1"), this.scale2Loc = this.gl.getUniformLocation(this.shaderProgram, "scale2"), this.scale3Loc = this.gl.getUniformLocation(this.shaderProgram, "scale3"), this.bias1Loc = this.gl.getUniformLocation(this.shaderProgram, "bias1"), this.bias2Loc = this.gl.getUniformLocation(this.shaderProgram, "bias2"), this.bias3Loc = this.gl.getUniformLocation(this.shaderProgram, "bias3"), this.randPresetLoc = this.gl.getUniformLocation(this.shaderProgram, "rand_preset"), this.randFrameLoc = this.gl.getUniformLocation(this.shaderProgram, "rand_frame"), this.qaLoc = this.gl.getUniformLocation(this.shaderProgram, "_qa"), this.qbLoc = this.gl.getUniformLocation(this.shaderProgram, "_qb"), this.qcLoc = this.gl.getUniformLocation(this.shaderProgram, "_qc"), this.qdLoc = this.gl.getUniformLocation(this.shaderProgram, "_qd"), this.qeLoc = this.gl.getUniformLocation(this.shaderProgram, "_qe"), this.qfLoc = this.gl.getUniformLocation(this.shaderProgram, "_qf"), this.qgLoc = this.gl.getUniformLocation(this.shaderProgram, "_qg"), this.qhLoc = this.gl.getUniformLocation(this.shaderProgram, "_qh"), this.slowRoamCosLoc = this.gl.getUniformLocation(this.shaderProgram, "slow_roam_cos"), this.roamCosLoc = this.gl.getUniformLocation(this.shaderProgram, "roam_cos"), this.slowRoamSinLoc = this.gl.getUniformLocation(this.shaderProgram, "slow_roam_sin"), this.roamSinLoc = this.gl.getUniformLocation(this.shaderProgram, "roam_sin");
								for (var s = 0; s < this.userTextures.length; s++) {
									var c = this.userTextures[s];
									c.textureLoc = this.gl.getUniformLocation(this.shaderProgram, `sampler_${c.sampler}`);
								}
							}
						},
						{
							key: "updateShader",
							value: function updateShader(e) {
								this.createShader(e);
							}
						},
						{
							key: "bindBlurVals",
							value: function bindBlurVals(e, t) {
								var n = e[0], r = e[1], i = e[2], a = t[0], o = t[1], s = t[2], c = a - n, l = n, u = o - r, d = r, f = s - i, p = i;
								this.gl.uniform1f(this.blur1MinLoc, n), this.gl.uniform1f(this.blur1MaxLoc, a), this.gl.uniform1f(this.blur2MinLoc, r), this.gl.uniform1f(this.blur2MaxLoc, o), this.gl.uniform1f(this.blur3MinLoc, i), this.gl.uniform1f(this.blur3MaxLoc, s), this.gl.uniform1f(this.scale1Loc, c), this.gl.uniform1f(this.scale2Loc, u), this.gl.uniform1f(this.scale3Loc, f), this.gl.uniform1f(this.bias1Loc, l), this.gl.uniform1f(this.bias2Loc, d), this.gl.uniform1f(this.bias3Loc, p);
							}
						},
						{
							key: "renderQuadTexture",
							value: function renderQuadTexture(e, t, n, r, i, a, o, s, c, l) {
								this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuf), this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.warpUvVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, c, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.warpUvLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.warpUvLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.warpColorVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, l, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.warpColorLocation, 4, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.warpColorLocation);
								var u = s.wrap === 0 ? this.gl.CLAMP_TO_EDGE : this.gl.REPEAT;
								this.gl.samplerParameteri(this.mainSampler, this.gl.TEXTURE_WRAP_S, u), this.gl.samplerParameteri(this.mainSampler, this.gl.TEXTURE_WRAP_T, u), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(0, this.mainSampler), this.gl.uniform1i(this.textureLoc, 0), this.gl.activeTexture(this.gl.TEXTURE1), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(1, this.mainSamplerFW), this.gl.uniform1i(this.textureFWLoc, 1), this.gl.activeTexture(this.gl.TEXTURE2), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(2, this.mainSamplerFC), this.gl.uniform1i(this.textureFCLoc, 2), this.gl.activeTexture(this.gl.TEXTURE3), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(3, this.mainSamplerPW), this.gl.uniform1i(this.texturePWLoc, 3), this.gl.activeTexture(this.gl.TEXTURE4), this.gl.bindTexture(this.gl.TEXTURE_2D, t), this.gl.bindSampler(4, this.mainSamplerPC), this.gl.uniform1i(this.texturePCLoc, 4), this.gl.activeTexture(this.gl.TEXTURE5), this.gl.bindTexture(this.gl.TEXTURE_2D, n), this.gl.uniform1i(this.blurTexture1Loc, 5), this.gl.activeTexture(this.gl.TEXTURE6), this.gl.bindTexture(this.gl.TEXTURE_2D, r), this.gl.uniform1i(this.blurTexture2Loc, 6), this.gl.activeTexture(this.gl.TEXTURE7), this.gl.bindTexture(this.gl.TEXTURE_2D, i), this.gl.uniform1i(this.blurTexture3Loc, 7), this.gl.activeTexture(this.gl.TEXTURE8), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexLQ), this.gl.uniform1i(this.noiseLQLoc, 8), this.gl.activeTexture(this.gl.TEXTURE9), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexMQ), this.gl.uniform1i(this.noiseMQLoc, 9), this.gl.activeTexture(this.gl.TEXTURE10), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexHQ), this.gl.uniform1i(this.noiseHQLoc, 10), this.gl.activeTexture(this.gl.TEXTURE11), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexLQLite), this.gl.uniform1i(this.noiseLQLiteLoc, 11), this.gl.activeTexture(this.gl.TEXTURE12), this.gl.bindTexture(this.gl.TEXTURE_2D, this.noise.noiseTexLQ), this.gl.bindSampler(12, this.noise.noiseTexPointLQ), this.gl.uniform1i(this.noisePointLQLoc, 12), this.gl.activeTexture(this.gl.TEXTURE13), this.gl.bindTexture(this.gl.TEXTURE_3D, this.noise.noiseTexVolLQ), this.gl.uniform1i(this.noiseVolLQLoc, 13), this.gl.activeTexture(this.gl.TEXTURE14), this.gl.bindTexture(this.gl.TEXTURE_3D, this.noise.noiseTexVolHQ), this.gl.uniform1i(this.noiseVolHQLoc, 14);
								for (var d = 0; d < this.userTextures.length; d++) {
									var f = this.userTextures[d];
									this.gl.activeTexture(this.gl.TEXTURE15 + d), this.gl.bindTexture(this.gl.TEXTURE_2D, this.image.getTexture(f.sampler)), this.gl.uniform1i(f.textureLoc, 15 + d);
								}
								this.gl.uniform1f(this.decayLoc, s.decay), this.gl.uniform2fv(this.resolutionLoc, [this.texsizeX, this.texsizeY]), this.gl.uniform4fv(this.aspectLoc, [
									this.aspectx,
									this.aspecty,
									this.invAspectx,
									this.invAspecty
								]), this.gl.uniform4fv(this.texsizeLoc, [
									this.texsizeX,
									this.texsizeY,
									1 / this.texsizeX,
									1 / this.texsizeY
								]), this.gl.uniform4fv(this.texsizeNoiseLQLoc, [
									256,
									256,
									1 / 256,
									1 / 256
								]), this.gl.uniform4fv(this.texsizeNoiseMQLoc, [
									256,
									256,
									1 / 256,
									1 / 256
								]), this.gl.uniform4fv(this.texsizeNoiseHQLoc, [
									256,
									256,
									1 / 256,
									1 / 256
								]), this.gl.uniform4fv(this.texsizeNoiseLQLiteLoc, [
									32,
									32,
									1 / 32,
									1 / 32
								]), this.gl.uniform4fv(this.texsizeNoiseVolLQLoc, [
									32,
									32,
									1 / 32,
									1 / 32
								]), this.gl.uniform4fv(this.texsizeNoiseVolHQLoc, [
									32,
									32,
									1 / 32,
									1 / 32
								]), this.gl.uniform1f(this.bassLoc, s.bass), this.gl.uniform1f(this.midLoc, s.mid), this.gl.uniform1f(this.trebLoc, s.treb), this.gl.uniform1f(this.volLoc, (s.bass + s.mid + s.treb) / 3), this.gl.uniform1f(this.bassAttLoc, s.bass_att), this.gl.uniform1f(this.midAttLoc, s.mid_att), this.gl.uniform1f(this.trebAttLoc, s.treb_att), this.gl.uniform1f(this.volAttLoc, (s.bass_att + s.mid_att + s.treb_att) / 3), this.gl.uniform1f(this.timeLoc, s.time), this.gl.uniform1f(this.frameLoc, s.frame), this.gl.uniform1f(this.fpsLoc, s.fps), this.gl.uniform4fv(this.randPresetLoc, s.rand_preset), this.gl.uniform4fv(this.randFrameLoc, new Float32Array([
									Math.random(),
									Math.random(),
									Math.random(),
									Math.random()
								])), this.gl.uniform4fv(this.qaLoc, new Float32Array([
									s.q1 || 0,
									s.q2 || 0,
									s.q3 || 0,
									s.q4 || 0
								])), this.gl.uniform4fv(this.qbLoc, new Float32Array([
									s.q5 || 0,
									s.q6 || 0,
									s.q7 || 0,
									s.q8 || 0
								])), this.gl.uniform4fv(this.qcLoc, new Float32Array([
									s.q9 || 0,
									s.q10 || 0,
									s.q11 || 0,
									s.q12 || 0
								])), this.gl.uniform4fv(this.qdLoc, new Float32Array([
									s.q13 || 0,
									s.q14 || 0,
									s.q15 || 0,
									s.q16 || 0
								])), this.gl.uniform4fv(this.qeLoc, new Float32Array([
									s.q17 || 0,
									s.q18 || 0,
									s.q19 || 0,
									s.q20 || 0
								])), this.gl.uniform4fv(this.qfLoc, new Float32Array([
									s.q21 || 0,
									s.q22 || 0,
									s.q23 || 0,
									s.q24 || 0
								])), this.gl.uniform4fv(this.qgLoc, new Float32Array([
									s.q25 || 0,
									s.q26 || 0,
									s.q27 || 0,
									s.q28 || 0
								])), this.gl.uniform4fv(this.qhLoc, new Float32Array([
									s.q29 || 0,
									s.q30 || 0,
									s.q31 || 0,
									s.q32 || 0
								])), this.gl.uniform4fv(this.slowRoamCosLoc, [
									.5 + .5 * Math.cos(s.time * .005),
									.5 + .5 * Math.cos(s.time * .008),
									.5 + .5 * Math.cos(s.time * .013),
									.5 + .5 * Math.cos(s.time * .022)
								]), this.gl.uniform4fv(this.roamCosLoc, [
									.5 + .5 * Math.cos(s.time * .3),
									.5 + .5 * Math.cos(s.time * 1.3),
									.5 + .5 * Math.cos(s.time * 5),
									.5 + .5 * Math.cos(s.time * 20)
								]), this.gl.uniform4fv(this.slowRoamSinLoc, [
									.5 + .5 * Math.sin(s.time * .005),
									.5 + .5 * Math.sin(s.time * .008),
									.5 + .5 * Math.sin(s.time * .013),
									.5 + .5 * Math.sin(s.time * .022)
								]), this.gl.uniform4fv(this.roamSinLoc, [
									.5 + .5 * Math.sin(s.time * .3),
									.5 + .5 * Math.sin(s.time * 1.3),
									.5 + .5 * Math.sin(s.time * 5),
									.5 + .5 * Math.sin(s.time * 20)
								]), this.bindBlurVals(a, o), e ? this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA) : this.gl.disable(this.gl.BLEND), this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0), e || this.gl.enable(this.gl.BLEND);
							}
						}
					]), WarpShader;
				}();
			}),
			"./src/rendering/shapes/customShape.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return a;
				});
				var r = n("./src/utils.js"), i = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var a = /*#__PURE__*/ function() {
					function CustomShape(e, t, n) {
						_classCallCheck(this, CustomShape), this.index = e, this.gl = t;
						var r = 101;
						this.positions = new Float32Array((r + 2) * 3), this.colors = new Float32Array((r + 2) * 4), this.uvs = new Float32Array((r + 2) * 2), this.borderPositions = new Float32Array((r + 1) * 3), this.texsizeX = n.texsizeX, this.texsizeY = n.texsizeY, this.mesh_width = n.mesh_width, this.mesh_height = n.mesh_height, this.aspectx = n.aspectx, this.aspecty = n.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.positionVertexBuf = this.gl.createBuffer(), this.colorVertexBuf = this.gl.createBuffer(), this.uvVertexBuf = this.gl.createBuffer(), this.borderPositionVertexBuf = this.gl.createBuffer(), this.floatPrecision = i.default.getFragmentFloatPrecision(this.gl), this.createShader(), this.createBorderShader(), this.mainSampler = this.gl.createSampler(), t.samplerParameteri(this.mainSampler, t.TEXTURE_MIN_FILTER, t.LINEAR_MIPMAP_LINEAR), t.samplerParameteri(this.mainSampler, t.TEXTURE_MAG_FILTER, t.LINEAR), t.samplerParameteri(this.mainSampler, t.TEXTURE_WRAP_S, t.REPEAT), t.samplerParameteri(this.mainSampler, t.TEXTURE_WRAP_T, t.REPEAT);
					}
					return _createClass(CustomShape, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty;
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      in vec3 aPos;\n                                      in vec4 aColor;\n                                      in vec2 aUv;\n                                      out vec4 vColor;\n                                      out vec2 vUv;\n                                      void main(void) {\n                                        vColor = aColor;\n                                        vUv = aUv;\n                                        gl_Position = vec4(aPos, 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      uniform sampler2D uTexture;
                                      uniform float uTextured;
                                      in vec4 vColor;
                                      in vec2 vUv;
                                      out vec4 fragColor;
                                      void main(void) {
                                        if (uTextured != 0.0) {
                                          fragColor = texture(uTexture, vUv) * vColor;
                                        } else {
                                          fragColor = vColor;
                                        }
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.aPosLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.aColorLocation = this.gl.getAttribLocation(this.shaderProgram, "aColor"), this.aUvLocation = this.gl.getAttribLocation(this.shaderProgram, "aUv"), this.texturedLoc = this.gl.getUniformLocation(this.shaderProgram, "uTextured"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture");
							}
						},
						{
							key: "createBorderShader",
							value: function createBorderShader() {
								this.borderShaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      in vec3 aBorderPos;\n                                      uniform vec2 thickOffset;\n                                      void main(void) {\n                                        gl_Position = vec4(aBorderPos +\n                                                           vec3(thickOffset, 0.0), 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      out vec4 fragColor;
                                      uniform vec4 uBorderColor;
                                      void main(void) {
                                        fragColor = uBorderColor;
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.borderShaderProgram, e), this.gl.attachShader(this.borderShaderProgram, t), this.gl.linkProgram(this.borderShaderProgram), this.aBorderPosLoc = this.gl.getAttribLocation(this.borderShaderProgram, "aBorderPos"), this.uBorderColorLoc = this.gl.getUniformLocation(this.borderShaderProgram, "uBorderColor"), this.thickOffsetLoc = this.gl.getUniformLocation(this.shaderProgram, "thickOffset");
							}
						},
						{
							key: "drawCustomShape",
							value: function drawCustomShape(e, t, n, i, a) {
								if (i.baseVals.enabled !== 0) {
									this.setupShapeBuffers(n.mdVSFrame);
									for (var o = Object.assign({}, n.mdVSShapes[this.index], n.mdVSFrameMapShapes[this.index], n.mdVSQAfterFrame, n.mdVSTShapeInits[this.index], t), s = r.default.cloneVars(o), c = Math.clamp(o.num_inst, 1, 1024), l = 0; l < c; l++) {
										o.instance = l, o.x = s.x, o.y = s.y, o.rad = s.rad, o.ang = s.ang, o.r = s.r, o.g = s.g, o.b = s.b, o.a = s.a, o.r2 = s.r2, o.g2 = s.g2, o.b2 = s.b2, o.a2 = s.a2, o.border_r = s.border_r, o.border_g = s.border_g, o.border_b = s.border_b, o.border_a = s.border_a, o.thickoutline = s.thickoutline, o.textured = s.textured, o.tex_zoom = s.tex_zoom, o.tex_ang = s.tex_ang, o.additive = s.additive;
										var u = i.frame_eqs(o), d = u.sides;
										d = Math.clamp(d, 3, 100), d = Math.floor(d);
										var f = u.rad, p = u.ang, m = u.x * 2 - 1, h = u.y * -2 + 1, g = u.r, _ = u.g, v = u.b, y = u.a, b = u.r2, x = u.g2, S = u.b2, C = u.a2, w = u.border_r, T = u.border_g, E = u.border_b, D = u.border_a;
										this.borderColor = [
											w,
											T,
											E,
											D * e
										];
										var O = u.thickoutline, k = u.textured, A = u.tex_zoom, j = u.tex_ang, M = u.additive, N = this.borderColor[3] > 0, P = Math.abs(k) >= 1, F = Math.abs(O) >= 1, I = Math.abs(M) >= 1;
										this.positions[0] = m, this.positions[1] = h, this.positions[2] = 0, this.colors[0] = g, this.colors[1] = _, this.colors[2] = v, this.colors[3] = y * e, P && (this.uvs[0] = .5, this.uvs[1] = .5);
										for (var L = Math.PI * .25, R = 1; R <= d + 1; R++) {
											var z = (R - 1) / d * 2 * Math.PI, B = z + p + L;
											if (this.positions[R * 3 + 0] = m + f * Math.cos(B) * this.aspecty, this.positions[R * 3 + 1] = h + f * Math.sin(B), this.positions[R * 3 + 2] = 0, this.colors[R * 4 + 0] = b, this.colors[R * 4 + 1] = x, this.colors[R * 4 + 2] = S, this.colors[R * 4 + 3] = C * e, P) {
												var V = z + j + L;
												this.uvs[R * 2 + 0] = .5 + .5 * Math.cos(V) / A * this.aspecty, this.uvs[R * 2 + 1] = .5 + .5 * Math.sin(V) / A;
											}
											N && (this.borderPositions[(R - 1) * 3 + 0] = this.positions[R * 3 + 0], this.borderPositions[(R - 1) * 3 + 1] = this.positions[R * 3 + 1], this.borderPositions[(R - 1) * 3 + 2] = this.positions[R * 3 + 2]);
										}
										this.mdVSShapeFrame = u, this.drawCustomShapeInstance(a, d, P, N, F, I);
									}
									var H = n.mdVSUserKeysShapes[this.index], U = r.default.pick(this.mdVSShapeFrame, H);
									n.mdVSFrameMapShapes[this.index] = U;
								}
							}
						},
						{
							key: "setupShapeBuffers",
							value: function setupShapeBuffers(e) {
								this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.DYNAMIC_DRAW), this.gl.vertexAttribPointer(this.aPosLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colors, this.gl.DYNAMIC_DRAW), this.gl.vertexAttribPointer(this.aColorLocation, 4, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aColorLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.uvs, this.gl.DYNAMIC_DRAW), this.gl.vertexAttribPointer(this.aUvLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aUvLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderPositionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.borderPositions, this.gl.DYNAMIC_DRAW), this.gl.vertexAttribPointer(this.aBorderPosLoc, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aBorderPosLoc);
								var t = e.wrap === 0 ? this.gl.CLAMP_TO_EDGE : this.gl.REPEAT;
								this.gl.samplerParameteri(this.mainSampler, this.gl.TEXTURE_WRAP_S, t), this.gl.samplerParameteri(this.mainSampler, this.gl.TEXTURE_WRAP_T, t);
							}
						},
						{
							key: "drawCustomShapeInstance",
							value: function drawCustomShapeInstance(e, t, n, r, i, a) {
								this.gl.useProgram(this.shaderProgram);
								var o = new Float32Array(this.positions.buffer, 0, (t + 2) * 3);
								this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, o), this.gl.vertexAttribPointer(this.aPosLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLocation);
								var s = new Float32Array(this.colors.buffer, 0, (t + 2) * 4);
								if (this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorVertexBuf), this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, s), this.gl.vertexAttribPointer(this.aColorLocation, 4, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aColorLocation), n) {
									var c = new Float32Array(this.uvs.buffer, 0, (t + 2) * 2);
									this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvVertexBuf), this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, c), this.gl.vertexAttribPointer(this.aUvLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aUvLocation);
								}
								if (this.gl.uniform1f(this.texturedLoc, +!!n), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, e), this.gl.bindSampler(0, this.mainSampler), this.gl.uniform1i(this.textureLoc, 0), a ? this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE) : this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, t + 2), r) {
									this.gl.useProgram(this.borderShaderProgram);
									var l = new Float32Array(this.borderPositions.buffer, 0, (t + 1) * 3);
									this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderPositionVertexBuf), this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, l), this.gl.vertexAttribPointer(this.aBorderPosLoc, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aBorderPosLoc), this.gl.uniform4fv(this.uBorderColorLoc, this.borderColor);
									for (var u = i ? 4 : 1, d = 0; d < u; d++) {
										var f = 2;
										d === 0 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, 0]) : d === 1 ? this.gl.uniform2fv(this.thickOffsetLoc, [f / this.texsizeX, 0]) : d === 2 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, f / this.texsizeY]) : d === 3 && this.gl.uniform2fv(this.thickOffsetLoc, [f / this.texsizeX, f / this.texsizeY]), this.gl.drawArrays(this.gl.LINE_STRIP, 0, t + 1);
									}
								}
							}
						}
					]), CustomShape;
				}();
			}),
			"./src/rendering/sprites/border.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function Border(e) {
						var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
						_classCallCheck(this, Border), this.gl = e, this.positions = /* @__PURE__ */ new Float32Array(72), this.aspectx = t.aspectx, this.aspecty = t.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader(), this.vertexBuf = this.gl.createBuffer();
					}
					return _createClass(Border, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty;
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      in vec3 aPos;\n                                      void main(void) {\n                                        gl_Position = vec4(aPos, 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      out vec4 fragColor;
                                      uniform vec4 u_color;
                                      void main(void) {
                                        fragColor = u_color;
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.aPosLoc = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.colorLoc = this.gl.getUniformLocation(this.shaderProgram, "u_color");
							}
						},
						{
							key: "addTriangle",
							value: function addTriangle(e, t, n, r) {
								this.positions[e + 0] = t[0], this.positions[e + 1] = t[1], this.positions[e + 2] = t[2], this.positions[e + 3] = n[0], this.positions[e + 4] = n[1], this.positions[e + 5] = n[2], this.positions[e + 6] = r[0], this.positions[e + 7] = r[1], this.positions[e + 8] = r[2];
							}
						},
						{
							key: "generateBorder",
							value: function generateBorder(e, t, n) {
								if (t > 0 && e[3] > 0) {
									var r = 2, i = 2, a = r / 2, o = i / 2, s = n / 2, c = t / 2 + s, l = s * r, u = s * i, d = c * r, f = c * i, p = [
										-a + l,
										-o + f,
										0
									], m = [
										-a + l,
										o - f,
										0
									], h = [
										-a + d,
										o - f,
										0
									], g = [
										-a + d,
										-o + f,
										0
									];
									return this.addTriangle(0, g, m, p), this.addTriangle(9, g, h, m), p = [
										a - l,
										-o + f,
										0
									], m = [
										a - l,
										o - f,
										0
									], h = [
										a - d,
										o - f,
										0
									], g = [
										a - d,
										-o + f,
										0
									], this.addTriangle(18, p, m, g), this.addTriangle(27, m, h, g), p = [
										-a + l,
										-o + u,
										0
									], m = [
										-a + l,
										f - o,
										0
									], h = [
										a - l,
										f - o,
										0
									], g = [
										a - l,
										-o + u,
										0
									], this.addTriangle(36, g, m, p), this.addTriangle(45, g, h, m), p = [
										-a + l,
										o - u,
										0
									], m = [
										-a + l,
										o - f,
										0
									], h = [
										a - l,
										o - f,
										0
									], g = [
										a - l,
										o - u,
										0
									], this.addTriangle(54, p, m, g), this.addTriangle(63, m, h, g), !0;
								}
								return !1;
							}
						},
						{
							key: "drawBorder",
							value: function drawBorder(e, t, n) {
								this.generateBorder(e, t, n) && (this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aPosLoc, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLoc), this.gl.uniform4fv(this.colorLoc, e), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLES, 0, this.positions.length / 3));
							}
						}
					]), Border;
				}();
			}),
			"./src/rendering/sprites/darkenCenter.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function CustomShape(e, t) {
						_classCallCheck(this, CustomShape), this.gl = e, this.aspectx = t.aspectx, this.aspecty = t.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.generatePositions(), this.colors = new Float32Array([
							0,
							0,
							0,
							3 / 32,
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
							0
						]), this.positionVertexBuf = this.gl.createBuffer(), this.colorVertexBuf = this.gl.createBuffer(), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(CustomShape, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.generatePositions();
							}
						},
						{
							key: "generatePositions",
							value: function generatePositions() {
								var e = .05;
								this.positions = new Float32Array([
									0,
									0,
									0,
									-e * this.aspecty,
									0,
									0,
									0,
									-e,
									0,
									e * this.aspecty,
									0,
									0,
									0,
									e,
									0,
									-e * this.aspecty,
									0,
									0
								]);
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      in vec3 aPos;\n                                      in vec4 aColor;\n                                      out vec4 vColor;\n                                      void main(void) {\n                                        vColor = aColor;\n                                        gl_Position = vec4(aPos, 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      in vec4 vColor;
                                      out vec4 fragColor;
                                      void main(void) {
                                        fragColor = vColor;
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.aPosLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.aColorLocation = this.gl.getAttribLocation(this.shaderProgram, "aColor");
							}
						},
						{
							key: "drawDarkenCenter",
							value: function drawDarkenCenter(e) {
								e.darken_center !== 0 && (this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aPosLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.colors, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aColorLocation, 4, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aColorLocation), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.positions.length / 3));
							}
						}
					]), CustomShape;
				}();
			}),
			"./src/rendering/text/titleText.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return i;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var i = /*#__PURE__*/ function() {
					function TitleText(e) {
						var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
						_classCallCheck(this, TitleText), this.gl = e, this.texsizeX = t.texsizeX, this.texsizeY = t.texsizeY, this.aspectx = t.aspectx, this.aspecty = t.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.buildPositions(), this.textTexture = this.gl.createTexture(), this.indexBuf = e.createBuffer(), this.positionVertexBuf = this.gl.createBuffer(), this.vertexBuf = this.gl.createBuffer(), this.canvas = document.createElement("canvas"), this.canvas.width = this.texsizeX, this.canvas.height = this.texsizeY, this.context2D = this.canvas.getContext("2d"), this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(TitleText, [
						{
							key: "generateTitleTexture",
							value: function generateTitleTexture(e) {
								this.context2D.clearRect(0, 0, this.texsizeX, this.texsizeY), this.fontSize = Math.floor(16 * (this.texsizeX / 256)), this.fontSize = Math.max(this.fontSize, 6), this.context2D.font = `italic ${this.fontSize}px Times New Roman`;
								var t = e, n = this.context2D.measureText(t).width;
								if (n > this.texsizeX) {
									var r = .91 * (this.texsizeX / n);
									t = `${t.substring(0, Math.floor(t.length * r))}...`, n = this.context2D.measureText(t).width;
								}
								this.context2D.fillStyle = "#FFFFFF", this.context2D.fillText(t, (this.texsizeX - n) / 2, this.texsizeY / 2);
								var i = new Uint8Array(this.context2D.getImageData(0, 0, this.texsizeX, this.texsizeY).data.buffer);
								this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, !0), this.gl.bindTexture(this.gl.TEXTURE_2D, this.textTexture), this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.texsizeX, this.texsizeY, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, i), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE), this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE), this.gl.generateMipmap(this.gl.TEXTURE_2D), this.gl.bindTexture(this.gl.TEXTURE_2D, null);
							}
						},
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.canvas.width = this.texsizeX, this.canvas.height = this.texsizeY;
							}
						},
						{
							key: "buildPositions",
							value: function buildPositions() {
								for (var e = 2, t = 2, n = e / 2, r = t / 2, i = 15, a = 7, o = i + 1, s = a + 1, c = e / i, l = t / a, u = [], d = 0; d < s; d++) for (var f = d * l - r, p = 0; p < o; p++) {
									var m = p * c - n;
									u.push(m, -f, 0);
								}
								for (var h = [], g = 0; g < a; g++) for (var _ = 0; _ < i; _++) {
									var v = _ + o * g, y = _ + o * (g + 1), b = _ + 1 + o * (g + 1), x = _ + 1 + o * g;
									h.push(v, y, x), h.push(y, b, x);
								}
								this.vertices = new Float32Array(u), this.indices = new Uint16Array(h);
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n       const vec2 halfmad = vec2(0.5);\n       in vec2 aPos;\n       in vec2 aUv;\n       out vec2 uv_orig;\n       out vec2 uv;\n       void main(void) {\n         gl_Position = vec4(aPos, 0.0, 1.0);\n         uv_orig = aPos * halfmad + halfmad;\n         uv = aUv;\n       }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
       precision ${this.floatPrecision} float;
       precision highp int;
       precision mediump sampler2D;

       in vec2 uv_orig;
       in vec2 uv;
       out vec4 fragColor;
       uniform sampler2D uTexture;
       uniform float textColor;

       void main(void) {
         fragColor = texture(uTexture, uv) * vec4(textColor);
       }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.positionLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.uvLocation = this.gl.getAttribLocation(this.shaderProgram, "aUv"), this.textureLoc = this.gl.getUniformLocation(this.shaderProgram, "uTexture"), this.textColorLoc = this.gl.getUniformLocation(this.shaderProgram, "textColor");
							}
						},
						{
							key: "generateUvs",
							value: function generateUvs(e, t, n) {
								for (var r = 15, i = 7, a = r + 1, o = i + 1, s = [], c = .75, l = 0; l < o; l++) for (var u = 0; u < a; u++) {
									var d = u / r, f = (l / i - .5) * c + .5, p = d * 2 - 1, m = f * 2 - 1;
									e >= 1 && (m += 1 / this.texsizeY), s.push(p, t ? m : -m);
								}
								for (var h = Math.max(0, 1 - e * 1.5) ** 1.8 * 1.3, g = 0; g < o; g++) for (var _ = 0; _ < a; _++) {
									var v = g * a + _;
									s[v] += h * .07 * Math.sin(n.time * .31 + s[v] * .39 - s[v + 1] * 1.94), s[v] += h * .044 * Math.sin(n.time * .81 - s[v] * 1.91 + s[v + 1] * .27), s[v] += h * .061 * Math.sin(n.time * 1.31 + s[v] * .61 + s[v + 1] * .74), s[v + 1] += h * .061 * Math.sin(n.time * .37 + s[v] * 1.83 + s[v + 1] * .69), s[v + 1] += h * .07 * Math.sin(n.time * .67 + s[v] * .42 - s[v + 1] * 1.39), s[v + 1] += h * .087 * Math.sin(n.time * 1.07 + s[v] * 3.55 + s[v + 1] * .89);
								}
								for (var y = 1.01 / (e ** .21 + .01), b = 0; b < s.length / 2; b++) s[b * 2] *= y, s[b * 2 + 1] *= y * this.invAspecty, s[b * 2] = (s[b * 2] + 1) / 2, s[b * 2 + 1] = (s[b * 2 + 1] + 1) / 2;
								return new Float32Array(s);
							}
						},
						{
							key: "renderTitle",
							value: function renderTitle(e, t, n) {
								this.gl.useProgram(this.shaderProgram);
								var r = this.generateUvs(e, t, n);
								this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuf), this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.positionLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, r, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.uvLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.uvLocation), this.gl.activeTexture(this.gl.TEXTURE0), this.gl.bindTexture(this.gl.TEXTURE_2D, this.textTexture), this.gl.uniform1i(this.textureLoc, 0), this.gl.uniform1f(this.textColorLoc, e ** .3), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
							}
						}
					]), TitleText;
				}();
			}),
			"./src/rendering/waves/basicWaveform.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return a;
				});
				var r = n("./src/rendering/shaders/shaderUtils.js"), i = n("./src/rendering/waves/waveUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var a = /*#__PURE__*/ function() {
					function BasicWaveform(e) {
						var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
						_classCallCheck(this, BasicWaveform), this.gl = e;
						var n = 512;
						this.positions = new Float32Array(n * 3), this.positions2 = new Float32Array(n * 3), this.oldPositions = new Float32Array(n * 3), this.oldPositions2 = new Float32Array(n * 3), this.smoothedPositions = new Float32Array((n * 2 - 1) * 3), this.smoothedPositions2 = new Float32Array((n * 2 - 1) * 3), this.color = [
							0,
							0,
							0,
							1
						], this.texsizeX = t.texsizeX, this.texsizeY = t.texsizeY, this.aspectx = t.aspectx, this.aspecty = t.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.floatPrecision = r.default.getFragmentFloatPrecision(this.gl), this.createShader(), this.vertexBuf = this.gl.createBuffer();
					}
					return _createClass(BasicWaveform, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty;
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      in vec3 aPos;\n                                      uniform vec2 thickOffset;\n                                      void main(void) {\n                                        gl_Position = vec4(aPos + vec3(thickOffset, 0.0), 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      out vec4 fragColor;
                                      uniform vec4 u_color;
                                      void main(void) {
                                        fragColor = u_color;
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.aPosLoc = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.colorLoc = this.gl.getUniformLocation(this.shaderProgram, "u_color"), this.thickOffsetLoc = this.gl.getUniformLocation(this.shaderProgram, "thickOffset");
							}
						},
						{
							key: "generateWaveform",
							value: function generateWaveform(e, t, n, r, a) {
								var o = a.wave_a, s = (a.bass + a.mid + a.treb) / 3;
								if (s > -.01 && o > .001 && n.length > 0) {
									var c = BasicWaveform.processWaveform(n, a), l = BasicWaveform.processWaveform(r, a), u = Math.floor(a.wave_mode) % 8, d = Math.floor(a.old_wave_mode) % 8, f = a.wave_x * 2 - 1, p = a.wave_y * 2 - 1;
									this.numVert = 0, this.oldNumVert = 0;
									for (var m = e && u !== d ? 2 : 1, h = 0; h < m; h++) {
										var g = h === 0 ? u : d, _ = a.wave_mystery;
										(g === 0 || g === 1 || g === 4) && (_ < -1 || _ > 1) && (_ = _ * .5 + .5, _ -= Math.floor(_), _ = Math.abs(_), _ = _ * 2 - 1);
										var v = void 0, y = void 0, b = void 0;
										if (h === 0 ? (y = this.positions, b = this.positions2) : (y = this.oldPositions, b = this.oldPositions2), o = a.wave_a, g === 0) {
											if (a.modwavealphabyvolume > 0) {
												var x = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / x;
											}
											o = Math.clamp(o, 0, 1), v = Math.floor(c.length / 2) + 1;
											for (var S = 1 / (v - 1), C = Math.floor((c.length - v) / 2), w = 0; w < v - 1; w++) {
												var T = .5 + .4 * l[w + C] + _, E = w * S * 2 * Math.PI + a.time * .2;
												if (w < v / 10) {
													var D = w / (v * .1);
													D = .5 - .5 * Math.cos(D * Math.PI);
													var O = .5 + .4 * l[w + v + C] + _;
													T = (1 - D) * O + T * D;
												}
												y[w * 3 + 0] = T * Math.cos(E) * this.aspecty + f, y[w * 3 + 1] = T * Math.sin(E) * this.aspectx + p, y[w * 3 + 2] = 0;
											}
											y[(v - 1) * 3 + 0] = y[0], y[(v - 1) * 3 + 1] = y[1], y[(v - 1) * 3 + 2] = 0;
										} else if (g === 1) {
											if (o *= 1.25, a.modwavealphabyvolume > 0) {
												var k = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / k;
											}
											o = Math.clamp(o, 0, 1), v = Math.floor(c.length / 2);
											for (var A = 0; A < v; A++) {
												var j = .53 + .43 * l[A] + _, M = c[A + 32] * .5 * Math.PI + a.time * 2.3;
												y[A * 3 + 0] = j * Math.cos(M) * this.aspecty + f, y[A * 3 + 1] = j * Math.sin(M) * this.aspectx + p, y[A * 3 + 2] = 0;
											}
										} else if (g === 2) {
											if (this.texsizeX < 1024 ? o *= .09 : this.texsizeX >= 1024 && this.texsizeX < 2048 ? o *= .11 : o *= .13, a.modwavealphabyvolume > 0) {
												var N = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / N;
											}
											o = Math.clamp(o, 0, 1), v = c.length;
											for (var P = 0; P < c.length; P++) y[P * 3 + 0] = l[P] * this.aspecty + f, y[P * 3 + 1] = c[(P + 32) % c.length] * this.aspectx + p, y[P * 3 + 2] = 0;
										} else if (g === 3) {
											if (this.texsizeX < 1024 ? o *= .15 : this.texsizeX >= 1024 && this.texsizeX < 2048 ? o *= .22 : o *= .33, o *= 1.3, o *= a.treb * a.treb, a.modwavealphabyvolume > 0) {
												var F = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / F;
											}
											o = Math.clamp(o, 0, 1), v = c.length;
											for (var I = 0; I < c.length; I++) y[I * 3 + 0] = l[I] * this.aspecty + f, y[I * 3 + 1] = c[(I + 32) % c.length] * this.aspectx + p, y[I * 3 + 2] = 0;
										} else if (g === 4) {
											if (a.modwavealphabyvolume > 0) {
												var L = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / L;
											}
											o = Math.clamp(o, 0, 1), v = c.length, v > this.texsizeX / 3 && (v = Math.floor(this.texsizeX / 3));
											for (var R = 1 / v, z = Math.floor((c.length - v) / 2), B = .45 + .5 * (_ * .5 + .5), V = 1 - B, H = 0; H < v; H++) {
												var U = 2 * H * R + (f - 1) + l[(H + 25 + z) % c.length] * .44, W = c[H + z] * .47 + p;
												H > 1 && (U = U * V + B * (y[(H - 1) * 3 + 0] * 2 - y[(H - 2) * 3 + 0]), W = W * V + B * (y[(H - 1) * 3 + 1] * 2 - y[(H - 2) * 3 + 1])), y[H * 3 + 0] = U, y[H * 3 + 1] = W, y[H * 3 + 2] = 0;
											}
										} else if (g === 5) {
											if (this.texsizeX < 1024 ? o *= .09 : this.texsizeX >= 1024 && this.texsizeX < 2048 ? o *= .11 : o *= .13, a.modwavealphabyvolume > 0) {
												var G = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / G;
											}
											o = Math.clamp(o, 0, 1);
											var ee = Math.cos(a.time * .3), K = Math.sin(a.time * .3);
											v = c.length;
											for (var q = 0; q < c.length; q++) {
												var te = (q + 32) % c.length, ne = l[q] * c[te] + c[q] * l[te], re = l[q] * l[q] - c[te] * c[te];
												y[q * 3 + 0] = (ne * ee - re * K) * (this.aspecty + f), y[q * 3 + 1] = (ne * K + re * ee) * (this.aspectx + p), y[q * 3 + 2] = 0;
											}
										} else if (g === 6 || g === 7) {
											if (a.modwavealphabyvolume > 0) {
												var ie = a.modwavealphaend - a.modwavealphastart;
												o *= (s - a.modwavealphastart) / ie;
											}
											o = Math.clamp(o, 0, 1), v = Math.floor(c.length / 2), v > this.texsizeX / 3 && (v = Math.floor(this.texsizeX / 3));
											for (var ae = Math.floor((c.length - v) / 2), oe = Math.PI * .5 * _, se = Math.cos(oe), ce = Math.sin(oe), J = [f * Math.cos(oe + Math.PI * .5) - se * 3, f * Math.cos(oe + Math.PI * .5) + se * 3], Y = [f * Math.sin(oe + Math.PI * .5) - ce * 3, f * Math.sin(oe + Math.PI * .5) + ce * 3], X = 0; X < 2; X++) for (var le = 0; le < 4; le++) {
												var ue = void 0, de = !1;
												switch (le) {
													case 0:
														J[X] > 1.1 && (ue = (1.1 - J[1 - X]) / (J[X] - J[1 - X]), de = !0);
														break;
													case 1:
														J[X] < -1.1 && (ue = (-1.1 - J[1 - X]) / (J[X] - J[1 - X]), de = !0);
														break;
													case 2:
														Y[X] > 1.1 && (ue = (1.1 - Y[1 - X]) / (Y[X] - Y[1 - X]), de = !0);
														break;
													case 3: Y[X] < -1.1 && (ue = (-1.1 - Y[1 - X]) / (Y[X] - Y[1 - X]), de = !0);
												}
												if (de) {
													var fe = J[X] - J[1 - X], pe = Y[X] - Y[1 - X];
													J[X] = J[1 - X] + fe * ue, Y[X] = Y[1 - X] + pe * ue;
												}
											}
											se = (J[1] - J[0]) / v, ce = (Y[1] - Y[0]) / v;
											var me = Math.atan2(ce, se), he = Math.cos(me + Math.PI * .5), ge = Math.sin(me + Math.PI * .5);
											if (g === 6) for (var Z = 0; Z < v; Z++) {
												var _e = c[Z + ae];
												y[Z * 3 + 0] = J[0] + se * Z + he * .25 * _e, y[Z * 3 + 1] = Y[0] + ce * Z + ge * .25 * _e, y[Z * 3 + 2] = 0;
											}
											else if (g === 7) {
												for (var ve = (p * .5 + .5) ** 2, ye = 0; ye < v; ye++) {
													var be = c[ye + ae];
													y[ye * 3 + 0] = J[0] + se * ye + he * (.25 * be + ve), y[ye * 3 + 1] = Y[0] + ce * ye + ge * (.25 * be + ve), y[ye * 3 + 2] = 0;
												}
												for (var xe = 0; xe < v; xe++) {
													var Se = l[xe + ae];
													b[xe * 3 + 0] = J[0] + se * xe + he * (.25 * Se - ve), b[xe * 3 + 1] = Y[0] + ce * xe + ge * (.25 * Se - ve), b[xe * 3 + 2] = 0;
												}
											}
										}
										h === 0 ? (this.positions = y, this.positions2 = b, this.numVert = v, this.alpha = o) : (this.oldPositions = y, this.oldPositions2 = b, this.oldNumVert = v, this.oldAlpha = o);
									}
									var Q = .5 - .5 * Math.cos(t * Math.PI), $ = 1 - Q;
									this.oldNumVert > 0 && (o = Q * this.alpha + $ * this.oldAlpha);
									var Ce = Math.clamp(a.wave_r, 0, 1), we = Math.clamp(a.wave_g, 0, 1), Te = Math.clamp(a.wave_b, 0, 1);
									if (a.wave_brighten !== 0) {
										var Ee = Math.max(Ce, we, Te);
										Ee > .01 && (Ce /= Ee, we /= Ee, Te /= Ee);
									}
									if (this.color = [
										Ce,
										we,
										Te,
										o
									], this.oldNumVert > 0) {
										if (u === 7) {
											for (var De = (this.oldNumVert - 1) / (this.numVert * 2), Oe = 0; Oe < this.numVert; Oe++) {
												var ke = Oe * De, Ae = Math.floor(ke), je = ke - Ae, Me = this.oldPositions[Ae * 3 + 0] * (1 - je) + this.oldPositions[(Ae + 1) * 3 + 0] * je, Ne = this.oldPositions[Ae * 3 + 1] * (1 - je) + this.oldPositions[(Ae + 1) * 3 + 1] * je;
												this.positions[Oe * 3 + 0] = this.positions[Oe * 3 + 0] * Q + Me * $, this.positions[Oe * 3 + 1] = this.positions[Oe * 3 + 1] * Q + Ne * $, this.positions[Oe * 3 + 2] = 0;
											}
											for (var Pe = 0; Pe < this.numVert; Pe++) {
												var Fe = (Pe + this.numVert) * De, Ie = Math.floor(Fe), Le = Fe - Ie, Re = this.oldPositions[Ie * 3 + 0] * (1 - Le) + this.oldPositions[(Ie + 1) * 3 + 0] * Le, ze = this.oldPositions[Ie * 3 + 1] * (1 - Le) + this.oldPositions[(Ie + 1) * 3 + 1] * Le;
												this.positions2[Pe * 3 + 0] = this.positions2[Pe * 3 + 0] * Q + Re * $, this.positions2[Pe * 3 + 1] = this.positions2[Pe * 3 + 1] * Q + ze * $, this.positions2[Pe * 3 + 2] = 0;
											}
										} else if (d === 7) {
											for (var Be = this.numVert / 2, Ve = (this.oldNumVert - 1) / Be, He = 0; He < Be; He++) {
												var Ue = He * Ve, We = Math.floor(Ue), Ge = Ue - We, Ke = this.oldPositions[We * 3 + 0] * (1 - Ge) + this.oldPositions[(We + 1) * 3 + 0] * Ge, qe = this.oldPositions[We * 3 + 1] * (1 - Ge) + this.oldPositions[(We + 1) * 3 + 1] * Ge;
												this.positions[He * 3 + 0] = this.positions[He * 3 + 0] * Q + Ke * $, this.positions[He * 3 + 1] = this.positions[He * 3 + 1] * Q + qe * $, this.positions[He * 3 + 2] = 0;
											}
											for (var Je = 0; Je < Be; Je++) {
												var Ye = Je * Ve, Xe = Math.floor(Ye), Ze = Ye - Xe, Qe = this.oldPositions2[Xe * 3 + 0] * (1 - Ze) + this.oldPositions2[(Xe + 1) * 3 + 0] * Ze, $e = this.oldPositions2[Xe * 3 + 1] * (1 - Ze) + this.oldPositions2[(Xe + 1) * 3 + 1] * Ze;
												this.positions2[Je * 3 + 0] = this.positions[(Je + Be) * 3 + 0] * Q + Qe * $, this.positions2[Je * 3 + 1] = this.positions[(Je + Be) * 3 + 1] * Q + $e * $, this.positions2[Je * 3 + 2] = 0;
											}
										} else for (var et = (this.oldNumVert - 1) / this.numVert, tt = 0; tt < this.numVert; tt++) {
											var nt = tt * et, rt = Math.floor(nt), it = nt - rt, at = this.oldPositions[rt * 3 + 0] * (1 - it) + this.oldPositions[(rt + 1) * 3 + 0] * it, ot = this.oldPositions[rt * 3 + 1] * (1 - it) + this.oldPositions[(rt + 1) * 3 + 1] * it;
											this.positions[tt * 3 + 0] = this.positions[tt * 3 + 0] * Q + at * $, this.positions[tt * 3 + 1] = this.positions[tt * 3 + 1] * Q + ot * $, this.positions[tt * 3 + 2] = 0;
										}
									}
									for (var st = 0; st < this.numVert; st++) this.positions[st * 3 + 1] = -this.positions[st * 3 + 1];
									if (this.smoothedNumVert = this.numVert * 2 - 1, i.default.smoothWave(this.positions, this.smoothedPositions, this.numVert), u === 7 || d === 7) {
										for (var ct = 0; ct < this.numVert; ct++) this.positions2[ct * 3 + 1] = -this.positions2[ct * 3 + 1];
										i.default.smoothWave(this.positions2, this.smoothedPositions2, this.numVert);
									}
									return !0;
								}
								return !1;
							}
						},
						{
							key: "drawBasicWaveform",
							value: function drawBasicWaveform(e, t, n, r, i) {
								if (this.generateWaveform(e, t, n, r, i)) {
									this.gl.useProgram(this.shaderProgram), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.smoothedPositions, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aPosLoc, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLoc), this.gl.uniform4fv(this.colorLoc, this.color);
									var a = 1;
									(i.wave_thick !== 0 || i.wave_dots !== 0) && (a = 4), i.additivewave === 0 ? this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA) : this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
									for (var o = i.wave_dots === 0 ? this.gl.LINE_STRIP : this.gl.POINTS, s = 0; s < a; s++) {
										var c = 2;
										s === 0 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, 0]) : s === 1 ? this.gl.uniform2fv(this.thickOffsetLoc, [c / this.texsizeX, 0]) : s === 2 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, c / this.texsizeY]) : s === 3 && this.gl.uniform2fv(this.thickOffsetLoc, [c / this.texsizeX, c / this.texsizeY]), this.gl.drawArrays(o, 0, this.smoothedNumVert);
									}
									if (Math.floor(i.wave_mode) % 8 == 7) {
										this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, this.smoothedPositions2, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aPosLoc, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLoc);
										for (var l = 0; l < a; l++) {
											var u = 2;
											l === 0 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, 0]) : l === 1 ? this.gl.uniform2fv(this.thickOffsetLoc, [u / this.texsizeX, 0]) : l === 2 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, u / this.texsizeY]) : l === 3 && this.gl.uniform2fv(this.thickOffsetLoc, [u / this.texsizeX, u / this.texsizeY]), this.gl.drawArrays(o, 0, this.smoothedNumVert);
										}
									}
								}
							}
						}
					], [{
						key: "processWaveform",
						value: function processWaveform(e, t) {
							var n = [], r = t.wave_scale / 128, i = t.wave_smoothing, a = r * (1 - i);
							n.push(e[0] * r);
							for (var o = 1; o < e.length; o++) n.push(e[o] * a + n[o - 1] * i);
							return n;
						}
					}]), BasicWaveform;
				}();
			}),
			"./src/rendering/waves/customWaveform.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return o;
				});
				var r = n("./src/utils.js"), i = n("./src/rendering/shaders/shaderUtils.js"), a = n("./src/rendering/waves/waveUtils.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var o = /*#__PURE__*/ function() {
					function CustomWaveform(e, t, n) {
						_classCallCheck(this, CustomWaveform), this.index = e, this.gl = t;
						var r = 512;
						this.pointsData = [new Float32Array(r), new Float32Array(r)], this.positions = new Float32Array(r * 3), this.colors = new Float32Array(r * 4), this.smoothedPositions = new Float32Array((r * 2 - 1) * 3), this.smoothedColors = new Float32Array((r * 2 - 1) * 4), this.texsizeX = n.texsizeX, this.texsizeY = n.texsizeY, this.mesh_width = n.mesh_width, this.mesh_height = n.mesh_height, this.aspectx = n.aspectx, this.aspecty = n.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty, this.positionVertexBuf = this.gl.createBuffer(), this.colorVertexBuf = this.gl.createBuffer(), this.floatPrecision = i.default.getFragmentFloatPrecision(this.gl), this.createShader();
					}
					return _createClass(CustomWaveform, [
						{
							key: "updateGlobals",
							value: function updateGlobals(e) {
								this.texsizeX = e.texsizeX, this.texsizeY = e.texsizeY, this.mesh_width = e.mesh_width, this.mesh_height = e.mesh_height, this.aspectx = e.aspectx, this.aspecty = e.aspecty, this.invAspectx = 1 / this.aspectx, this.invAspecty = 1 / this.aspecty;
							}
						},
						{
							key: "createShader",
							value: function createShader() {
								this.shaderProgram = this.gl.createProgram();
								var e = this.gl.createShader(this.gl.VERTEX_SHADER);
								this.gl.shaderSource(e, "#version 300 es\n                                      uniform float uSize;\n                                      uniform vec2 thickOffset;\n                                      in vec3 aPos;\n                                      in vec4 aColor;\n                                      out vec4 vColor;\n                                      void main(void) {\n                                        vColor = aColor;\n                                        gl_PointSize = uSize;\n                                        gl_Position = vec4(aPos + vec3(thickOffset, 0.0), 1.0);\n                                      }"), this.gl.compileShader(e);
								var t = this.gl.createShader(this.gl.FRAGMENT_SHADER);
								this.gl.shaderSource(t, `#version 300 es
                                      precision ${this.floatPrecision} float;
                                      precision highp int;
                                      precision mediump sampler2D;
                                      in vec4 vColor;
                                      out vec4 fragColor;
                                      void main(void) {
                                        fragColor = vColor;
                                      }`), this.gl.compileShader(t), this.gl.attachShader(this.shaderProgram, e), this.gl.attachShader(this.shaderProgram, t), this.gl.linkProgram(this.shaderProgram), this.aPosLocation = this.gl.getAttribLocation(this.shaderProgram, "aPos"), this.aColorLocation = this.gl.getAttribLocation(this.shaderProgram, "aColor"), this.sizeLoc = this.gl.getUniformLocation(this.shaderProgram, "uSize"), this.thickOffsetLoc = this.gl.getUniformLocation(this.shaderProgram, "thickOffset");
							}
						},
						{
							key: "generateWaveform",
							value: function generateWaveform(e, t, n, i, o, s, c, l) {
								if (c.baseVals.enabled !== 0 && e.length > 0) {
									var u = Object.assign({}, s.mdVSWaves[this.index], s.mdVSFrameMapWaves[this.index], s.mdVSQAfterFrame, s.mdVSTWaveInits[this.index], o), d = c.frame_eqs(u), f = 512;
									this.samples = Object.prototype.hasOwnProperty.call(d, "samples") ? d.samples : f, this.samples > f && (this.samples = f), this.samples = Math.floor(this.samples);
									var p = Math.floor(d.sep), m = d.scaling, h = d.spectrum, g = d.smoothing, _ = d.usedots, v = d.r, y = d.g, b = d.b, x = d.a, S = s.mdVS.wave_scale;
									if (this.samples -= p, this.samples >= 2 || _ !== 0 && this.samples >= 1) {
										var C = h !== 0, w = (C ? .15 : .004) * m * S, T = C ? n : e, E = C ? i : t, D = C ? 0 : Math.floor((f - this.samples) / 2 - p / 2), O = C ? 0 : Math.floor((f - this.samples) / 2 + p / 2), k = C ? (f - p) / this.samples : 1, A = (g * .98) ** .5, j = 1 - A;
										this.pointsData[0][0] = T[D], this.pointsData[1][0] = E[O];
										for (var M = 1; M < this.samples; M++) {
											var N = T[Math.floor(M * k + D)], P = E[Math.floor(M * k + O)];
											this.pointsData[0][M] = N * j + this.pointsData[0][M - 1] * A, this.pointsData[1][M] = P * j + this.pointsData[1][M - 1] * A;
										}
										for (var F = this.samples - 2; F >= 0; F--) this.pointsData[0][F] = this.pointsData[0][F] * j + this.pointsData[0][F + 1] * A, this.pointsData[1][F] = this.pointsData[1][F] * j + this.pointsData[1][F + 1] * A;
										for (var I = 0; I < this.samples; I++) this.pointsData[0][I] *= w, this.pointsData[1][I] *= w;
										for (var L = 0; L < this.samples; L++) {
											var R = this.pointsData[0][L], z = this.pointsData[1][L];
											d.sample = L / (this.samples - 1), d.value1 = R, d.value2 = z, d.x = .5 + R, d.y = .5 + z, d.r = v, d.g = y, d.b = b, d.a = x, c.point_eqs !== "" && (d = c.point_eqs(d));
											var B = (d.x * 2 - 1) * this.invAspectx, V = (d.y * -2 + 1) * this.invAspecty, H = d.r, U = d.g, W = d.b, G = d.a;
											this.positions[L * 3 + 0] = B, this.positions[L * 3 + 1] = V, this.positions[L * 3 + 2] = 0, this.colors[L * 4 + 0] = H, this.colors[L * 4 + 1] = U, this.colors[L * 4 + 2] = W, this.colors[L * 4 + 3] = G * l;
										}
										var ee = s.mdVSUserKeysWaves[this.index], K = r.default.pick(d, ee);
										return s.mdVSFrameMapWaves[this.index] = K, this.mdVSWaveFrame = d, _ === 0 && a.default.smoothWaveAndColor(this.positions, this.colors, this.smoothedPositions, this.smoothedColors, this.samples), !0;
									}
								}
								return !1;
							}
						},
						{
							key: "drawCustomWaveform",
							value: function drawCustomWaveform(e, t, n, r, i, a, o, s) {
								if (s && this.generateWaveform(t, n, r, i, a, o, s, e)) {
									this.gl.useProgram(this.shaderProgram);
									var c = this.mdVSWaveFrame.usedots !== 0, l = this.mdVSWaveFrame.thick !== 0, u = this.mdVSWaveFrame.additive !== 0, d, f, p;
									c ? (d = this.positions, f = this.colors, p = this.samples) : (d = this.smoothedPositions, f = this.smoothedColors, p = this.samples * 2 - 1), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, d, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aPosLocation, 3, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPosLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorVertexBuf), this.gl.bufferData(this.gl.ARRAY_BUFFER, f, this.gl.STATIC_DRAW), this.gl.vertexAttribPointer(this.aColorLocation, 4, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aColorLocation);
									var m = 1;
									c ? l ? this.gl.uniform1f(this.sizeLoc, 2 + +(this.texsizeX >= 1024)) : this.gl.uniform1f(this.sizeLoc, 1 + +(this.texsizeX >= 1024)) : (this.gl.uniform1f(this.sizeLoc, 1), l && (m = 4)), u ? this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE) : this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
									for (var h = c ? this.gl.POINTS : this.gl.LINE_STRIP, g = 0; g < m; g++) {
										var _ = 2;
										g === 0 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, 0]) : g === 1 ? this.gl.uniform2fv(this.thickOffsetLoc, [_ / this.texsizeX, 0]) : g === 2 ? this.gl.uniform2fv(this.thickOffsetLoc, [0, _ / this.texsizeY]) : g === 3 && this.gl.uniform2fv(this.thickOffsetLoc, [_ / this.texsizeX, _ / this.texsizeY]), this.gl.drawArrays(h, 0, p);
									}
								}
							}
						}
					]), CustomWaveform;
				}();
			}),
			"./src/rendering/waves/waveUtils.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function WaveUtils() {
						_classCallCheck(this, WaveUtils);
					}
					return _createClass(WaveUtils, null, [{
						key: "smoothWave",
						value: function smoothWave(e, t, n) {
							for (var r = arguments.length > 3 && arguments[3] !== void 0 && arguments[3], i = -.15, a = 1.15, o = 1.15, s = -.15, c = 1 / (i + a + o + s), l = 0, u = 0, d, f = 1, p = 0; p < n - 1; p++) {
								d = f, f = Math.min(n - 1, p + 2);
								for (var m = 0; m < 3; m++) t[l * 3 + m] = e[p * 3 + m];
								if (r) for (var h = 0; h < 3; h++) t[(l + 1) * 3 + h] = (i * e[u * 3 + h] + a * e[p * 3 + h] + o * e[d * 3 + h] + s * e[f * 3 + h]) * c;
								else {
									for (var g = 0; g < 2; g++) t[(l + 1) * 3 + g] = (i * e[u * 3 + g] + a * e[p * 3 + g] + o * e[d * 3 + g] + s * e[f * 3 + g]) * c;
									t[(l + 1) * 3 + 2] = 0;
								}
								u = p, l += 2;
							}
							for (var _ = 0; _ < 3; _++) t[l * 3 + _] = e[(n - 1) * 3 + _];
						}
					}, {
						key: "smoothWaveAndColor",
						value: function smoothWaveAndColor(e, t, n, r, i) {
							for (var a = arguments.length > 5 && arguments[5] !== void 0 && arguments[5], o = -.15, s = 1.15, c = 1.15, l = -.15, u = 1 / (o + s + c + l), d = 0, f = 0, p, m = 1, h = 0; h < i - 1; h++) {
								p = m, m = Math.min(i - 1, h + 2);
								for (var g = 0; g < 3; g++) n[d * 3 + g] = e[h * 3 + g];
								if (a) for (var _ = 0; _ < 3; _++) n[(d + 1) * 3 + _] = (o * e[f * 3 + _] + s * e[h * 3 + _] + c * e[p * 3 + _] + l * e[m * 3 + _]) * u;
								else {
									for (var v = 0; v < 2; v++) n[(d + 1) * 3 + v] = (o * e[f * 3 + v] + s * e[h * 3 + v] + c * e[p * 3 + v] + l * e[m * 3 + v]) * u;
									n[(d + 1) * 3 + 2] = 0;
								}
								for (var y = 0; y < 4; y++) r[d * 4 + y] = t[h * 4 + y], r[(d + 1) * 4 + y] = t[h * 4 + y];
								f = h, d += 2;
							}
							for (var b = 0; b < 3; b++) n[d * 3 + b] = e[(i - 1) * 3 + b];
							for (var x = 0; x < 4; x++) r[d * 4 + x] = t[(i - 1) * 4 + x];
						}
					}]), WaveUtils;
				}();
			}),
			"./src/utils.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return r;
				});
				function _toConsumableArray(e) {
					return _arrayWithoutHoles(e) || _iterableToArray(e) || _nonIterableSpread();
				}
				function _nonIterableSpread() {
					throw TypeError("Invalid attempt to spread non-iterable instance");
				}
				function _iterableToArray(e) {
					if (Symbol.iterator in Object(e) || Object.prototype.toString.call(e) === "[object Arguments]") return Array.from(e);
				}
				function _arrayWithoutHoles(e) {
					if (Array.isArray(e)) {
						for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
						return n;
					}
				}
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var r = /*#__PURE__*/ function() {
					function Utils() {
						_classCallCheck(this, Utils);
					}
					return _createClass(Utils, null, [
						{
							key: "atan2",
							value: function atan2(e, t) {
								var n = Math.atan2(e, t);
								return n < 0 && (n += 2 * Math.PI), n;
							}
						},
						{
							key: "cloneVars",
							value: function cloneVars(e) {
								return Object.assign({}, e);
							}
						},
						{
							key: "range",
							value: function range(e, t) {
								return t === void 0 ? _toConsumableArray(Array(e).keys()) : Array.from({ length: t - e }, function(t, n) {
									return n + e;
								});
							}
						},
						{
							key: "pick",
							value: function pick(e, t) {
								for (var n = {}, r = 0; r < t.length; r++) {
									var i = t[r];
									n[i] = e[i];
								}
								return n;
							}
						},
						{
							key: "omit",
							value: function omit(e, t) {
								for (var n = Object.assign({}, e), r = 0; r < t.length; r++) {
									var i = t[r];
									delete n[i];
								}
								return n;
							}
						}
					]), Utils;
				}();
			}),
			"./src/visualizer.js": (function(e, t, n) {
				n.r(t), n.d(t, "default", function() {
					return a;
				});
				var r = n("./src/audio/audioProcessor.js"), i = n("./src/rendering/renderer.js");
				function _classCallCheck(e, t) {
					if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
				}
				function _defineProperties(e, t) {
					for (var n = 0; n < t.length; n++) {
						var r = t[n];
						r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				}
				function _createClass(e, t, n) {
					return t && _defineProperties(e.prototype, t), n && _defineProperties(e, n), e;
				}
				var a = /*#__PURE__*/ function() {
					function Visualizer(e, t, n) {
						_classCallCheck(this, Visualizer), this.audio = new r.default(e);
						var a = t.getContext("webgl2", {
							alpha: !1,
							antialias: !1,
							depth: !1,
							stencil: !1,
							premultipliedAlpha: !1
						});
						this.baseValsDefaults = {
							decay: .98,
							gammaadj: 2,
							echo_zoom: 2,
							echo_alpha: 0,
							echo_orient: 0,
							red_blue: 0,
							brighten: 0,
							darken: 0,
							wrap: 1,
							darken_center: 0,
							solarize: 0,
							invert: 0,
							fshader: 0,
							b1n: 0,
							b2n: 0,
							b3n: 0,
							b1x: 1,
							b2x: 1,
							b3x: 1,
							b1ed: .25,
							wave_mode: 0,
							additivewave: 0,
							wave_dots: 0,
							wave_thick: 0,
							wave_a: .8,
							wave_scale: 1,
							wave_smoothing: .75,
							wave_mystery: 0,
							modwavealphabyvolume: 0,
							modwavealphastart: .75,
							modwavealphaend: .95,
							wave_r: 1,
							wave_g: 1,
							wave_b: 1,
							wave_x: .5,
							wave_y: .5,
							wave_brighten: 1,
							mv_x: 12,
							mv_y: 9,
							mv_dx: 0,
							mv_dy: 0,
							mv_l: .9,
							mv_r: 1,
							mv_g: 1,
							mv_b: 1,
							mv_a: 1,
							warpanimspeed: 1,
							warpscale: 1,
							zoomexp: 1,
							zoom: 1,
							rot: 0,
							cx: .5,
							cy: .5,
							dx: 0,
							dy: 0,
							warp: 1,
							sx: 1,
							sy: 1,
							ob_size: .01,
							ob_r: 0,
							ob_g: 0,
							ob_b: 0,
							ob_a: 0,
							ib_size: .01,
							ib_r: .25,
							ib_g: .25,
							ib_b: .25,
							ib_a: 0
						}, this.shapeBaseValsDefaults = {
							enabled: 0,
							sides: 4,
							additive: 0,
							thickoutline: 0,
							textured: 0,
							num_inst: 1,
							tex_zoom: 1,
							tex_ang: 0,
							x: .5,
							y: .5,
							rad: .1,
							ang: 0,
							r: 1,
							g: 0,
							b: 0,
							a: 1,
							r2: 0,
							g2: 1,
							b2: 0,
							a2: 0,
							border_r: 1,
							border_g: 1,
							border_b: 1,
							border_a: .1
						}, this.waveBaseValsDefaults = {
							enabled: 0,
							samples: 512,
							sep: 0,
							scaling: 1,
							smoothing: .5,
							r: 1,
							g: 1,
							b: 1,
							a: 1,
							spectrum: 0,
							usedots: 0,
							thick: 0,
							additive: 0
						}, this.renderer = new i.default(a, this.audio, n);
					}
					return _createClass(Visualizer, [
						{
							key: "connectAudio",
							value: function connectAudio(e) {
								this.audioNode = e, this.audio.connectAudio(e);
							}
						},
						{
							key: "disconnectAudio",
							value: function disconnectAudio(e) {
								this.audio.disconnectAudio(e);
							}
						},
						{
							key: "loadPreset",
							value: function loadPreset(e) {
								var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, n = Object.assign({}, e);
								n.baseVals = Object.assign({}, this.baseValsDefaults, n.baseVals);
								for (var r = 0; r < n.shapes.length; r++) n.shapes[r].baseVals = Object.assign({}, this.shapeBaseValsDefaults, n.shapes[r].baseVals);
								for (var i = 0; i < n.waves.length; i++) n.waves[i].baseVals = Object.assign({}, this.waveBaseValsDefaults, n.waves[i].baseVals);
								if (typeof n.init_eqs != "function") {
									n.init_eqs = Function("a", `${n.init_eqs_str} return a;`), n.frame_eqs = Function("a", `${n.frame_eqs_str} return a;`), n.pixel_eqs = n.pixel_eqs_str && n.pixel_eqs_str !== "" ? Function("a", `${n.pixel_eqs_str} return a;`) : "";
									for (var a = 0; a < n.shapes.length; a++) n.shapes[a].baseVals.enabled !== 0 && (n.shapes[a] = Object.assign({}, n.shapes[a], {
										init_eqs: Function("a", `${n.shapes[a].init_eqs_str} return a;`),
										frame_eqs: Function("a", `${n.shapes[a].frame_eqs_str} return a;`)
									}));
									for (var o = 0; o < n.waves.length; o++) if (n.waves[o].baseVals.enabled !== 0) {
										var s = {
											init_eqs: Function("a", `${n.waves[o].init_eqs_str} return a;`),
											frame_eqs: Function("a", `${n.waves[o].frame_eqs_str} return a;`)
										};
										s.point_eqs = n.waves[o].point_eqs_str && n.waves[o].point_eqs_str !== "" ? Function("a", `${n.waves[o].point_eqs_str} return a;`) : "", n.waves[o] = Object.assign({}, n.waves[o], s);
									}
								}
								this.renderer.loadPreset(n, t);
							}
						},
						{
							key: "loadExtraImages",
							value: function loadExtraImages(e) {
								this.renderer.loadExtraImages(e);
							}
						},
						{
							key: "setRendererSize",
							value: function setRendererSize(e, t) {
								var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
								this.renderer.setRendererSize(e, t, n);
							}
						},
						{
							key: "setInternalMeshSize",
							value: function setInternalMeshSize(e, t) {
								this.renderer.setInternalMeshSize(e, t);
							}
						},
						{
							key: "setOutputAA",
							value: function setOutputAA(e) {
								this.renderer.setOutputAA(e);
							}
						},
						{
							key: "render",
							value: function render(e) {
								this.renderer.render(e);
							}
						},
						{
							key: "launchSongTitleAnim",
							value: function launchSongTitleAnim(e) {
								this.renderer.launchSongTitleAnim(e);
							}
						},
						{
							key: "toDataURL",
							value: function toDataURL() {
								return this.renderer.toDataURL();
							}
						},
						{
							key: "warpBufferToDataURL",
							value: function warpBufferToDataURL() {
								return this.renderer.warpBufferToDataURL();
							}
						}
					]), Visualizer;
				}();
			})
		});
	});
}), r = /*@__PURE__*/ e(n);
n.butterchurn;
//#endregion
export { r as default };
