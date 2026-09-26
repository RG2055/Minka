import { i as m, n as _ } from "./chunks/rolldown-runtime-ly0BBW_k.js";
import { a as x, c as S, i as C, l as D, n as O, o as F, r as I, s as L, t as H, u as U } from "./chunks/radio-Bv3-HvbG.js";
//#region src/themes.js
var W = "spotify", q = {
	spotify: {
		id: "spotify",
		label: "Spotify",
		skin: "skins/spotify.wsz",
		className: "webamp-theme-spotify"
	},
	classic: {
		id: "classic",
		label: "Classic Winamp",
		skin: null,
		className: null
	}
};
function themeById(m) {
	return m == null ? null : q[m] ?? null;
}
function themeList() {
	return Object.values(q).filter((m) => m.id !== "classic");
}
function themeSkinUrl(m, _) {
	return m?.skin ? new URL(m.skin, _).href : null;
}
//#endregion
//#region node_modules/webamp/built/webamp.lazy-bundle.min.mjs
var ee = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function e(m) {
	return m && m.__esModule && Object.prototype.hasOwnProperty.call(m, "default") ? m.default : m;
}
var te = { exports: {} }, J = {}, ne = Symbol.for("react.transitional.element"), re = Symbol.for("react.fragment");
function r(m, _, x) {
	var S = null;
	if (x !== void 0 && (S = "" + x), _.key !== void 0 && (S = "" + _.key), "key" in _) for (var C in x = {}, _) C !== "key" && (x[C] = _[C]);
	else x = _;
	return _ = x.ref, {
		$$typeof: ne,
		type: m,
		key: S,
		ref: _ === void 0 ? null : _,
		props: x
	};
}
J.Fragment = re, J.jsx = r, J.jsxs = r, te.exports = J;
var Q = te.exports, ie = { exports: {} }, ae = {}, oe = { exports: {} }, se = {};
(function(m) {
	function e(m, _) {
		var x = m.length;
		m.push(_);
		A: for (; 0 < x;) {
			var S = x - 1 >>> 1, C = m[S];
			if (!(0 < a(C, _))) break A;
			m[S] = _, m[x] = C, x = S;
		}
	}
	function t(m) {
		return m.length === 0 ? null : m[0];
	}
	function n(m) {
		if (m.length === 0) return null;
		var _ = m[0], x = m.pop();
		if (x !== _) {
			m[0] = x;
			A: for (var S = 0, C = m.length, D = C >>> 1; S < D;) {
				var O = 2 * (S + 1) - 1, F = m[O], I = O + 1, L = m[I];
				if (0 > a(F, x)) I < C && 0 > a(L, F) ? (m[S] = L, m[I] = x, S = I) : (m[S] = F, m[O] = x, S = O);
				else {
					if (!(I < C && 0 > a(L, x))) break A;
					m[S] = L, m[I] = x, S = I;
				}
			}
		}
		return _;
	}
	function a(m, _) {
		var x = m.sortIndex - _.sortIndex;
		return x === 0 ? m.id - _.id : x;
	}
	if (m.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var _ = performance;
		m.unstable_now = function() {
			return _.now();
		};
	} else {
		var x = Date, S = x.now();
		m.unstable_now = function() {
			return x.now() - S;
		};
	}
	var C = [], D = [], O = 1, F = null, I = 3, L = !1, H = !1, U = !1, W = !1, q = typeof setTimeout == "function" ? setTimeout : null, ee = typeof clearTimeout == "function" ? clearTimeout : null, te = typeof setImmediate < "u" ? setImmediate : null;
	function b(m) {
		for (var _ = t(D); _ !== null;) {
			if (_.callback === null) n(D);
			else {
				if (!(_.startTime <= m)) break;
				n(D), _.sortIndex = _.expirationTime, e(C, _);
			}
			_ = t(D);
		}
	}
	function k(m) {
		if (U = !1, b(m), !H) {
			if (t(C) !== null) H = !0, J || (J = !0, y());
			else {
				var _ = t(D);
				_ !== null && N(k, _.startTime - m);
			}
		}
	}
	var y, J = !1, ne = -1, re = 5, Q = -1;
	function v() {
		return !(!W && m.unstable_now() - Q < re);
	}
	function B() {
		if (W = !1, J) {
			var _ = m.unstable_now();
			Q = _;
			var x = !0;
			try {
				A: {
					H = !1, U && (U = !1, ee(ne), ne = -1), L = !0;
					var S = I;
					try {
						e: {
							for (b(_), F = t(C); F !== null && !(F.expirationTime > _ && v());) {
								var O = F.callback;
								if (typeof O == "function") {
									F.callback = null, I = F.priorityLevel;
									var q = O(F.expirationTime <= _);
									if (_ = m.unstable_now(), typeof q == "function") {
										F.callback = q, b(_), x = !0;
										break e;
									}
									F === t(C) && n(C), b(_);
								} else n(C);
								F = t(C);
							}
							if (F !== null) x = !0;
							else {
								var te = t(D);
								te !== null && N(k, te.startTime - _), x = !1;
							}
						}
						break A;
					} finally {
						F = null, I = S, L = !1;
					}
					x = void 0;
				}
			} finally {
				x ? y() : J = !1;
			}
		}
	}
	if (typeof te == "function") y = function() {
		te(B);
	};
	else if (typeof MessageChannel < "u") {
		var ie = new MessageChannel(), ae = ie.port2;
		ie.port1.onmessage = B, y = function() {
			ae.postMessage(null);
		};
	} else y = function() {
		q(B, 0);
	};
	function N(_, x) {
		ne = q(function() {
			_(m.unstable_now());
		}, x);
	}
	m.unstable_IdlePriority = 5, m.unstable_ImmediatePriority = 1, m.unstable_LowPriority = 4, m.unstable_NormalPriority = 3, m.unstable_Profiling = null, m.unstable_UserBlockingPriority = 2, m.unstable_cancelCallback = function(m) {
		m.callback = null;
	}, m.unstable_forceFrameRate = function(m) {
		0 > m || 125 < m || (re = 0 < m ? Math.floor(1e3 / m) : 5);
	}, m.unstable_getCurrentPriorityLevel = function() {
		return I;
	}, m.unstable_next = function(m) {
		switch (I) {
			case 1:
			case 2:
			case 3:
				var _ = 3;
				break;
			default: _ = I;
		}
		var x = I;
		I = _;
		try {
			return m();
		} finally {
			I = x;
		}
	}, m.unstable_requestPaint = function() {
		W = !0;
	}, m.unstable_runWithPriority = function(m, _) {
		switch (m) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: m = 3;
		}
		var x = I;
		I = m;
		try {
			return _();
		} finally {
			I = x;
		}
	}, m.unstable_scheduleCallback = function(_, x, S) {
		var F = m.unstable_now();
		switch (S = typeof S == "object" && S && typeof (S = S.delay) == "number" && 0 < S ? F + S : F, _) {
			case 1:
				var I = -1;
				break;
			case 2:
				I = 250;
				break;
			case 5:
				I = 1073741823;
				break;
			case 4:
				I = 1e4;
				break;
			default: I = 5e3;
		}
		return _ = {
			id: O++,
			callback: x,
			priorityLevel: _,
			startTime: S,
			expirationTime: I = S + I,
			sortIndex: -1
		}, S > F ? (_.sortIndex = S, e(D, _), t(C) === null && _ === t(D) && (U ? (ee(ne), ne = -1) : U = !0, N(k, S - F))) : (_.sortIndex = I, e(C, _), H || L || (H = !0, J || (J = !0, y()))), _;
	}, m.unstable_shouldYield = v, m.unstable_wrapCallback = function(m) {
		var _ = I;
		return function() {
			var x = I;
			I = _;
			try {
				return m.apply(this, arguments);
			} finally {
				I = x;
			}
		};
	};
})(se), oe.exports = se;
var ce = oe.exports, le = { exports: {} }, ue = {}, de = Symbol.for("react.transitional.element"), fe = Symbol.for("react.portal"), me = Symbol.for("react.fragment"), he = Symbol.for("react.strict_mode"), ge = Symbol.for("react.profiler"), we = Symbol.for("react.consumer"), Ee = Symbol.for("react.context"), De = Symbol.for("react.forward_ref"), Oe = Symbol.for("react.suspense"), Ae = Symbol.for("react.memo"), Fe = Symbol.for("react.lazy"), Le = Symbol.iterator, Re = {
	isMounted: function() {
		return !1;
	},
	enqueueForceUpdate: function() {},
	enqueueReplaceState: function() {},
	enqueueSetState: function() {}
}, ze = Object.assign, Ve = {};
function M(m, _, x) {
	this.props = m, this.context = _, this.refs = Ve, this.updater = x || Re;
}
function N() {}
function T(m, _, x) {
	this.props = m, this.context = _, this.refs = Ve, this.updater = x || Re;
}
M.prototype.isReactComponent = {}, M.prototype.setState = function(m, _) {
	if (typeof m != "object" && typeof m != "function" && m != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
	this.updater.enqueueSetState(this, m, _, "setState");
}, M.prototype.forceUpdate = function(m) {
	this.updater.enqueueForceUpdate(this, m, "forceUpdate");
}, N.prototype = M.prototype;
var Ge = T.prototype = new N();
Ge.constructor = T, ze(Ge, M.prototype), Ge.isPureReactComponent = !0;
var qe = Array.isArray, Je = {
	H: null,
	A: null,
	T: null,
	S: null,
	V: null
}, Xe = Object.prototype.hasOwnProperty;
function V(m, _, x, S, C, D) {
	return x = D.ref, {
		$$typeof: de,
		type: m,
		key: _,
		ref: x === void 0 ? null : x,
		props: D
	};
}
function R(m) {
	return typeof m == "object" && !!m && m.$$typeof === de;
}
var Qe = /\/+/g;
function G(m, _) {
	return typeof m == "object" && m && m.key != null ? (x = "" + m.key, S = {
		"=": "=0",
		":": "=2"
	}, "$" + x.replace(/[=:]/g, function(m) {
		return S[m];
	})) : _.toString(36);
	var x, S;
}
function z() {}
function K(m, _, x, S, C) {
	var D = typeof m;
	D !== "undefined" && D !== "boolean" || (m = null);
	var O, F, I = !1;
	if (m === null) I = !0;
	else switch (D) {
		case "bigint":
		case "string":
		case "number":
			I = !0;
			break;
		case "object": switch (m.$$typeof) {
			case de:
			case fe:
				I = !0;
				break;
			case Fe: return K((I = m._init)(m._payload), _, x, S, C);
		}
	}
	if (I) return C = C(m), I = S === "" ? "." + G(m, 0) : S, qe(C) ? (x = "", I != null && (x = I.replace(Qe, "$&/") + "/"), K(C, _, x, "", function(m) {
		return m;
	})) : C != null && (R(C) && (O = C, F = x + (C.key == null || m && m.key === C.key ? "" : ("" + C.key).replace(Qe, "$&/") + "/") + I, C = V(O.type, F, void 0, 0, 0, O.props)), _.push(C)), 1;
	I = 0;
	var L, H = S === "" ? "." : S + ":";
	if (qe(m)) for (var U = 0; U < m.length; U++) I += K(S = m[U], _, x, D = H + G(S, U), C);
	else if (typeof (U = (L = m) === null || typeof L != "object" ? null : typeof (L = Le && L[Le] || L["@@iterator"]) == "function" ? L : null) == "function") for (m = U.call(m), U = 0; !(S = m.next()).done;) I += K(S = S.value, _, x, D = H + G(S, U++), C);
	else if (D === "object") {
		if (typeof m.then == "function") return K(function(m) {
			switch (m.status) {
				case "fulfilled": return m.value;
				case "rejected": throw m.reason;
				default: switch (typeof m.status == "string" ? m.then(z, z) : (m.status = "pending", m.then(function(_) {
					m.status === "pending" && (m.status = "fulfilled", m.value = _);
				}, function(_) {
					m.status === "pending" && (m.status = "rejected", m.reason = _);
				})), m.status) {
					case "fulfilled": return m.value;
					case "rejected": throw m.reason;
				}
			}
			throw m;
		}(m), _, x, S, C);
		throw _ = String(m), Error("Objects are not valid as a React child (found: " + (_ === "[object Object]" ? "object with keys {" + Object.keys(m).join(", ") + "}" : _) + "). If you meant to render a collection of children, use an array instead.");
	}
	return I;
}
function P(m, _, x) {
	if (m == null) return m;
	var S = [], C = 0;
	return K(m, S, "", "", function(m) {
		return _.call(x, m, C++);
	}), S;
}
function Y(m) {
	if (m._status === -1) {
		var _ = m._result;
		(_ = _()).then(function(_) {
			m._status !== 0 && m._status !== -1 || (m._status = 1, m._result = _);
		}, function(_) {
			m._status !== 0 && m._status !== -1 || (m._status = 2, m._result = _);
		}), m._status === -1 && (m._status = 0, m._result = _);
	}
	if (m._status === 1) return m._result.default;
	throw m._result;
}
var $e = typeof reportError == "function" ? reportError : function(m) {
	if (typeof window == "object" && typeof window.ErrorEvent == "function") {
		var _ = new window.ErrorEvent("error", {
			bubbles: !0,
			cancelable: !0,
			message: typeof m == "object" && m && typeof m.message == "string" ? String(m.message) : String(m),
			error: m
		});
		if (!window.dispatchEvent(_)) return;
	} else if (typeof process == "object" && typeof process.emit == "function") return void process.emit("uncaughtException", m);
};
function j() {}
ue.Children = {
	map: P,
	forEach: function(m, _, x) {
		P(m, function() {
			_.apply(this, arguments);
		}, x);
	},
	count: function(m) {
		var _ = 0;
		return P(m, function() {
			_++;
		}), _;
	},
	toArray: function(m) {
		return P(m, function(m) {
			return m;
		}) || [];
	},
	only: function(m) {
		if (!R(m)) throw Error("React.Children.only expected to receive a single React element child.");
		return m;
	}
}, ue.Component = M, ue.Fragment = me, ue.Profiler = ge, ue.PureComponent = T, ue.StrictMode = he, ue.Suspense = Oe, ue.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Je, ue.__COMPILER_RUNTIME = {
	__proto__: null,
	c: function(m) {
		return Je.H.useMemoCache(m);
	}
}, ue.cache = function(m) {
	return function() {
		return m.apply(null, arguments);
	};
}, ue.cloneElement = function(m, _, x) {
	if (m == null) throw Error("The argument must be a React element, but you passed " + m + ".");
	var S = ze({}, m.props), C = m.key;
	if (_ != null) for (D in _.ref, _.key !== void 0 && (C = "" + _.key), _) !Xe.call(_, D) || D === "key" || D === "__self" || D === "__source" || D === "ref" && _.ref === void 0 || (S[D] = _[D]);
	var D = arguments.length - 2;
	if (D === 1) S.children = x;
	else if (1 < D) {
		for (var O = Array(D), F = 0; F < D; F++) O[F] = arguments[F + 2];
		S.children = O;
	}
	return V(m.type, C, void 0, 0, 0, S);
}, ue.createContext = function(m) {
	return (m = {
		$$typeof: Ee,
		_currentValue: m,
		_currentValue2: m,
		_threadCount: 0,
		Provider: null,
		Consumer: null
	}).Provider = m, m.Consumer = {
		$$typeof: we,
		_context: m
	}, m;
}, ue.createElement = function(m, _, x) {
	var S, C = {}, D = null;
	if (_ != null) for (S in _.key !== void 0 && (D = "" + _.key), _) Xe.call(_, S) && S !== "key" && S !== "__self" && S !== "__source" && (C[S] = _[S]);
	var O = arguments.length - 2;
	if (O === 1) C.children = x;
	else if (1 < O) {
		for (var F = Array(O), I = 0; I < O; I++) F[I] = arguments[I + 2];
		C.children = F;
	}
	if (m && m.defaultProps) for (S in O = m.defaultProps) C[S] === void 0 && (C[S] = O[S]);
	return V(m, D, void 0, 0, 0, C);
}, ue.createRef = function() {
	return { current: null };
}, ue.forwardRef = function(m) {
	return {
		$$typeof: De,
		render: m
	};
}, ue.isValidElement = R, ue.lazy = function(m) {
	return {
		$$typeof: Fe,
		_payload: {
			_status: -1,
			_result: m
		},
		_init: Y
	};
}, ue.memo = function(m, _) {
	return {
		$$typeof: Ae,
		type: m,
		compare: _ === void 0 ? null : _
	};
}, ue.startTransition = function(m) {
	var _ = Je.T, x = {};
	Je.T = x;
	try {
		var S = m(), C = Je.S;
		C !== null && C(x, S), typeof S == "object" && S && typeof S.then == "function" && S.then(j, $e);
	} catch (m) {
		$e(m);
	} finally {
		Je.T = _;
	}
}, ue.unstable_useCacheRefresh = function() {
	return Je.H.useCacheRefresh();
}, ue.use = function(m) {
	return Je.H.use(m);
}, ue.useActionState = function(m, _, x) {
	return Je.H.useActionState(m, _, x);
}, ue.useCallback = function(m, _) {
	return Je.H.useCallback(m, _);
}, ue.useContext = function(m) {
	return Je.H.useContext(m);
}, ue.useDebugValue = function() {}, ue.useDeferredValue = function(m, _) {
	return Je.H.useDeferredValue(m, _);
}, ue.useEffect = function(m, _, x) {
	var S = Je.H;
	if (typeof x == "function") throw Error("useEffect CRUD overload is not enabled in this build of React.");
	return S.useEffect(m, _);
}, ue.useId = function() {
	return Je.H.useId();
}, ue.useImperativeHandle = function(m, _, x) {
	return Je.H.useImperativeHandle(m, _, x);
}, ue.useInsertionEffect = function(m, _) {
	return Je.H.useInsertionEffect(m, _);
}, ue.useLayoutEffect = function(m, _) {
	return Je.H.useLayoutEffect(m, _);
}, ue.useMemo = function(m, _) {
	return Je.H.useMemo(m, _);
}, ue.useOptimistic = function(m, _) {
	return Je.H.useOptimistic(m, _);
}, ue.useReducer = function(m, _, x) {
	return Je.H.useReducer(m, _, x);
}, ue.useRef = function(m) {
	return Je.H.useRef(m);
}, ue.useState = function(m) {
	return Je.H.useState(m);
}, ue.useSyncExternalStore = function(m, _, x) {
	return Je.H.useSyncExternalStore(m, _, x);
}, ue.useTransition = function() {
	return Je.H.useTransition();
}, ue.version = "19.1.0", le.exports = ue;
var $ = le.exports, et = { exports: {} }, tt = {}, lt = $;
function Z(m) {
	var _ = "https://react.dev/errors/" + m;
	if (1 < arguments.length) {
		_ += "?args[]=" + encodeURIComponent(arguments[1]);
		for (var x = 2; x < arguments.length; x++) _ += "&args[]=" + encodeURIComponent(arguments[x]);
	}
	return "Minified React error #" + m + "; visit " + _ + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
function X() {}
var mt = {
	d: {
		f: X,
		r: function() {
			throw Error(Z(522));
		},
		D: X,
		C: X,
		L: X,
		m: X,
		X,
		S: X,
		M: X
	},
	p: 0,
	findDOMNode: null
}, xt = Symbol.for("react.portal"), Tt = lt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
function tA(m, _) {
	return m === "font" ? "" : typeof _ == "string" ? _ === "use-credentials" ? _ : "" : void 0;
}
tt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = mt, tt.createPortal = function(m, _) {
	var x = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
	if (!_ || _.nodeType !== 1 && _.nodeType !== 9 && _.nodeType !== 11) throw Error(Z(299));
	return function(m, _, x) {
		var S = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: xt,
			key: S == null ? null : "" + S,
			children: m,
			containerInfo: _,
			implementation: x
		};
	}(m, _, null, x);
}, tt.flushSync = function(m) {
	var _ = Tt.T, x = mt.p;
	try {
		if (Tt.T = null, mt.p = 2, m) return m();
	} finally {
		Tt.T = _, mt.p = x, mt.d.f();
	}
}, tt.preconnect = function(m, _) {
	typeof m == "string" && (_ = _ ? typeof (_ = _.crossOrigin) == "string" ? _ === "use-credentials" ? _ : "" : void 0 : null, mt.d.C(m, _));
}, tt.prefetchDNS = function(m) {
	typeof m == "string" && mt.d.D(m);
}, tt.preinit = function(m, _) {
	if (typeof m == "string" && _ && typeof _.as == "string") {
		var x = _.as, S = tA(x, _.crossOrigin), C = typeof _.integrity == "string" ? _.integrity : void 0, D = typeof _.fetchPriority == "string" ? _.fetchPriority : void 0;
		x === "style" ? mt.d.S(m, typeof _.precedence == "string" ? _.precedence : void 0, {
			crossOrigin: S,
			integrity: C,
			fetchPriority: D
		}) : x === "script" && mt.d.X(m, {
			crossOrigin: S,
			integrity: C,
			fetchPriority: D,
			nonce: typeof _.nonce == "string" ? _.nonce : void 0
		});
	}
}, tt.preinitModule = function(m, _) {
	if (typeof m == "string") {
		if (typeof _ == "object" && _) {
			if (_.as == null || _.as === "script") {
				var x = tA(_.as, _.crossOrigin);
				mt.d.M(m, {
					crossOrigin: x,
					integrity: typeof _.integrity == "string" ? _.integrity : void 0,
					nonce: typeof _.nonce == "string" ? _.nonce : void 0
				});
			}
		} else _ ?? mt.d.M(m);
	}
}, tt.preload = function(m, _) {
	if (typeof m == "string" && typeof _ == "object" && _ && typeof _.as == "string") {
		var x = _.as, S = tA(x, _.crossOrigin);
		mt.d.L(m, x, {
			crossOrigin: S,
			integrity: typeof _.integrity == "string" ? _.integrity : void 0,
			nonce: typeof _.nonce == "string" ? _.nonce : void 0,
			type: typeof _.type == "string" ? _.type : void 0,
			fetchPriority: typeof _.fetchPriority == "string" ? _.fetchPriority : void 0,
			referrerPolicy: typeof _.referrerPolicy == "string" ? _.referrerPolicy : void 0,
			imageSrcSet: typeof _.imageSrcSet == "string" ? _.imageSrcSet : void 0,
			imageSizes: typeof _.imageSizes == "string" ? _.imageSizes : void 0,
			media: typeof _.media == "string" ? _.media : void 0
		});
	}
}, tt.preloadModule = function(m, _) {
	if (typeof m == "string") {
		if (_) {
			var x = tA(_.as, _.crossOrigin);
			mt.d.m(m, {
				as: typeof _.as == "string" && _.as !== "script" ? _.as : void 0,
				crossOrigin: x,
				integrity: typeof _.integrity == "string" ? _.integrity : void 0
			});
		} else mt.d.m(m);
	}
}, tt.requestFormReset = function(m) {
	mt.d.r(m);
}, tt.unstable_batchedUpdates = function(m, _) {
	return m(_);
}, tt.useFormState = function(m, _, x) {
	return Tt.H.useFormState(m, _, x);
}, tt.useFormStatus = function() {
	return Tt.H.useHostTransitionStatus();
}, tt.version = "19.1.0", function A() {
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
		__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(A);
	} catch {}
}(), et.exports = tt;
var Dt = et.exports, At = e(Dt), Mt = ce, Pt = $, Lt = Dt;
function oA(m) {
	var _ = "https://react.dev/errors/" + m;
	if (1 < arguments.length) {
		_ += "?args[]=" + encodeURIComponent(arguments[1]);
		for (var x = 2; x < arguments.length; x++) _ += "&args[]=" + encodeURIComponent(arguments[x]);
	}
	return "Minified React error #" + m + "; visit " + _ + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
function sA(m) {
	return !(!m || m.nodeType !== 1 && m.nodeType !== 9 && m.nodeType !== 11);
}
function uA(m) {
	var _ = m, x = m;
	if (m.alternate) for (; _.return;) _ = _.return;
	else {
		m = _;
		do
			4098 & (_ = m).flags && (x = _.return), m = _.return;
		while (m);
	}
	return _.tag === 3 ? x : null;
}
function cA(m) {
	if (m.tag === 13) {
		var _ = m.memoizedState;
		if (_ === null && (m = m.alternate) !== null && (_ = m.memoizedState), _ !== null) return _.dehydrated;
	}
	return null;
}
function dA(m) {
	if (uA(m) !== m) throw Error(oA(188));
}
function gA(m) {
	var _ = m.tag;
	if (_ === 5 || _ === 26 || _ === 27 || _ === 6) return m;
	for (m = m.child; m !== null;) {
		if ((_ = gA(m)) !== null) return _;
		m = m.sibling;
	}
	return null;
}
var zt = Object.assign, Vt = Symbol.for("react.element"), Ht = Symbol.for("react.transitional.element"), Ut = Symbol.for("react.portal"), Gt = Symbol.for("react.fragment"), Kt = Symbol.for("react.strict_mode"), Yt = Symbol.for("react.profiler"), Xt = Symbol.for("react.provider"), Zt = Symbol.for("react.consumer"), $t = Symbol.for("react.context"), en = Symbol.for("react.forward_ref"), tn = Symbol.for("react.suspense"), nn = Symbol.for("react.suspense_list"), rn = Symbol.for("react.memo"), an = Symbol.for("react.lazy"), on = Symbol.for("react.activity"), sn = Symbol.for("react.memo_cache_sentinel"), cn = Symbol.iterator;
function TA(m) {
	return typeof m != "object" || !m ? null : typeof (m = cn && m[cn] || m["@@iterator"]) == "function" ? m : null;
}
var ln = Symbol.for("react.client.reference");
function LA(m) {
	if (m == null) return null;
	if (typeof m == "function") return m.$$typeof === ln ? null : m.displayName || m.name || null;
	if (typeof m == "string") return m;
	switch (m) {
		case Gt: return "Fragment";
		case Yt: return "Profiler";
		case Kt: return "StrictMode";
		case tn: return "Suspense";
		case nn: return "SuspenseList";
		case on: return "Activity";
	}
	if (typeof m == "object") switch (m.$$typeof) {
		case Ut: return "Portal";
		case $t: return (m.displayName || "Context") + ".Provider";
		case Zt: return (m._context.displayName || "Context") + ".Consumer";
		case en:
			var _ = m.render;
			return (m = m.displayName) || (m = (m = _.displayName || _.name || "") === "" ? "ForwardRef" : "ForwardRef(" + m + ")"), m;
		case rn: return (_ = m.displayName || null) === null ? LA(m.type) || "Memo" : _;
		case an:
			_ = m._payload, m = m._init;
			try {
				return LA(m(_));
			} catch {}
	}
	return null;
}
var un = Array.isArray, dn = Pt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, fn = Lt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, pn = {
	pending: !1,
	data: null,
	method: null,
	action: null
}, gn = [], vn = -1;
function zA(m) {
	return { current: m };
}
function KA(m) {
	0 > vn || (m.current = gn[vn], gn[vn] = null, vn--);
}
function PA(m, _) {
	vn++, gn[vn] = m.current, m.current = _;
}
var yn = zA(null), bn = zA(null), xn = zA(null), Sn = zA(null);
function JA(m, _) {
	switch (PA(xn, _), PA(bn, m), PA(yn, null), _.nodeType) {
		case 9:
		case 11:
			m = (m = _.documentElement) && (m = m.namespaceURI) ? rd(m) : 0;
			break;
		default: if (m = _.tagName, _ = _.namespaceURI) m = ld(_ = rd(_), m);
		else switch (m) {
			case "svg":
				m = 1;
				break;
			case "math":
				m = 2;
				break;
			default: m = 0;
		}
	}
	KA(yn), PA(yn, m);
}
function qA() {
	KA(yn), KA(bn), KA(xn);
}
function WA(m) {
	m.memoizedState !== null && PA(Sn, m);
	var _ = yn.current, x = ld(_, m.type);
	_ !== x && (PA(bn, m), PA(yn, x));
}
function ZA(m) {
	bn.current === m && (KA(yn), KA(bn)), Sn.current === m && (KA(Sn), qp._currentValue = pn);
}
var Cn = Object.prototype.hasOwnProperty, wn = Mt.unstable_scheduleCallback, Tn = Mt.unstable_cancelCallback, En = Mt.unstable_shouldYield, On = Mt.unstable_requestPaint, kn = Mt.unstable_now, An = Mt.unstable_getCurrentPriorityLevel, Pn = Mt.unstable_ImmediatePriority, In = Mt.unstable_UserBlockingPriority, zn = Mt.unstable_NormalPriority, Bn = Mt.unstable_LowPriority, Vn = Mt.unstable_IdlePriority, Un = Mt.log, Kn = Mt.unstable_setDisableYieldValue, Yn = null, Zn = null;
function pe(m) {
	if (typeof Un == "function" && Kn(m), Zn && typeof Zn.setStrictMode == "function") try {
		Zn.setStrictMode(Yn, m);
	} catch {}
}
var Qn = Math.clz32 ? Math.clz32 : function(m) {
	return (m >>>= 0) == 0 ? 32 : 31 - (nr(m) / ur | 0) | 0;
}, nr = Math.log, ur = Math.LN2, mr = 256, hr = 4194304;
function be(m) {
	var _ = 42 & m;
	if (_ !== 0) return _;
	switch (m & -m) {
		case 1: return 1;
		case 2: return 2;
		case 4: return 4;
		case 8: return 8;
		case 16: return 16;
		case 32: return 32;
		case 64: return 64;
		case 128: return 128;
		case 256:
		case 512:
		case 1024:
		case 2048:
		case 4096:
		case 8192:
		case 16384:
		case 32768:
		case 65536:
		case 131072:
		case 262144:
		case 524288:
		case 1048576:
		case 2097152: return 4194048 & m;
		case 4194304:
		case 8388608:
		case 16777216:
		case 33554432: return 62914560 & m;
		case 67108864: return 67108864;
		case 134217728: return 134217728;
		case 268435456: return 268435456;
		case 536870912: return 536870912;
		case 1073741824: return 0;
		default: return m;
	}
}
function ke(m, _, x) {
	var S = m.pendingLanes;
	if (S === 0) return 0;
	var C = 0, D = m.suspendedLanes, O = m.pingedLanes;
	m = m.warmLanes;
	var F = 134217727 & S;
	return F === 0 ? (F = S & ~D) === 0 ? O === 0 ? x || (x = S & ~m) !== 0 && (C = be(x)) : C = be(O) : C = be(F) : (S = F & ~D) === 0 ? (O &= F) === 0 ? x || (x = F & ~m) !== 0 && (C = be(x)) : C = be(O) : C = be(S), C === 0 ? 0 : _ !== 0 && _ !== C && (_ & D) === 0 && ((D = C & -C) >= (x = _ & -_) || D === 32 && 4194048 & x) ? _ : C;
}
function ye(m, _) {
	return (m.pendingLanes & ~(m.suspendedLanes & ~m.pingedLanes) & _) === 0;
}
function Se(m, _) {
	switch (m) {
		case 1:
		case 2:
		case 4:
		case 8:
		case 64: return _ + 250;
		case 16:
		case 32:
		case 128:
		case 256:
		case 512:
		case 1024:
		case 2048:
		case 4096:
		case 8192:
		case 16384:
		case 32768:
		case 65536:
		case 131072:
		case 262144:
		case 524288:
		case 1048576:
		case 2097152: return _ + 5e3;
		default: return -1;
	}
}
function Ie() {
	var m = mr;
	return !(4194048 & (mr <<= 1)) && (mr = 256), m;
}
function Ue() {
	var m = hr;
	return !(62914560 & (hr <<= 1)) && (hr = 4194304), m;
}
function Ce(m) {
	for (var _ = [], x = 0; 31 > x; x++) _.push(m);
	return _;
}
function ve(m, _) {
	m.pendingLanes |= _, _ !== 268435456 && (m.suspendedLanes = 0, m.pingedLanes = 0, m.warmLanes = 0);
}
function Be(m, _, x) {
	m.pendingLanes |= _, m.suspendedLanes &= ~_;
	var S = 31 - Qn(_);
	m.entangledLanes |= _, m.entanglements[S] = 1073741824 | m.entanglements[S] | 4194090 & x;
}
function xe(m, _) {
	var x = m.entangledLanes |= _;
	for (m = m.entanglements; x;) {
		var S = 31 - Qn(x), C = 1 << S;
		C & _ | m[S] & _ && (m[S] |= _), x &= ~C;
	}
}
function Me(m) {
	switch (m) {
		case 2:
			m = 1;
			break;
		case 8:
			m = 4;
			break;
		case 32:
			m = 16;
			break;
		case 256:
		case 512:
		case 1024:
		case 2048:
		case 4096:
		case 8192:
		case 16384:
		case 32768:
		case 65536:
		case 131072:
		case 262144:
		case 524288:
		case 1048576:
		case 2097152:
		case 4194304:
		case 8388608:
		case 16777216:
		case 33554432:
			m = 128;
			break;
		case 268435456:
			m = 134217728;
			break;
		default: m = 0;
	}
	return m;
}
function Ne(m) {
	return 2 < (m &= -m) ? 8 < m ? 134217727 & m ? 32 : 268435456 : 8 : 2;
}
function Te() {
	var m = fn.p;
	return m === 0 ? (m = window.event) === void 0 ? 32 : cg(m.type) : m;
}
var vr = Math.random().toString(36).slice(2), yr = "__reactFiber$" + vr, br = "__reactProps$" + vr, xr = "__reactContainer$" + vr, Sr = "__reactEvents$" + vr, Cr = "__reactListeners$" + vr, kr = "__reactHandles$" + vr, Ar = "__reactResources$" + vr, Mr = "__reactMarker$" + vr;
function Ke(m) {
	delete m[yr], delete m[br], delete m[Sr], delete m[Cr], delete m[kr];
}
function Pe(m) {
	var _ = m[yr];
	if (_) return _;
	for (var x = m.parentNode; x;) {
		if (_ = x[xr] || x[yr]) {
			if (x = _.alternate, _.child !== null || x !== null && x.child !== null) for (m = kd(m); m !== null;) {
				if (x = m[yr]) return x;
				m = kd(m);
			}
			return _;
		}
		x = (m = x).parentNode;
	}
	return null;
}
function Ye(m) {
	if (m = m[yr] || m[xr]) {
		var _ = m.tag;
		if (_ === 5 || _ === 6 || _ === 13 || _ === 26 || _ === 27 || _ === 3) return m;
	}
	return null;
}
function He(m) {
	var _ = m.tag;
	if (_ === 5 || _ === 26 || _ === 27 || _ === 6) return m.stateNode;
	throw Error(oA(33));
}
function je(m) {
	var _ = m[Ar];
	return _ ||= m[Ar] = {
		hoistableStyles: /* @__PURE__ */ new Map(),
		hoistableScripts: /* @__PURE__ */ new Map()
	}, _;
}
function _e(m) {
	m[Mr] = !0;
}
var Ir = /* @__PURE__ */ new Set(), Br = {};
function We(m, _) {
	Ze(m, _), Ze(m + "Capture", _);
}
function Ze(m, _) {
	for (Br[m] = _, m = 0; m < _.length; m++) Ir.add(_[m]);
}
var Ur, ri, ii = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), oi = {}, si = {};
function nt(m, _, x) {
	if (C = _, Cn.call(si, C) || !Cn.call(oi, C) && (ii.test(C) ? si[C] = !0 : (oi[C] = !0, 0))) {
		if (x === null) m.removeAttribute(_);
		else {
			switch (typeof x) {
				case "undefined":
				case "function":
				case "symbol":
					m.removeAttribute(_);
					return;
				case "boolean":
					var S = _.toLowerCase().slice(0, 5);
					if (S !== "data-" && S !== "aria-") return void m.removeAttribute(_);
			}
			m.setAttribute(_, "" + x);
		}
	}
	var C;
}
function at(m, _, x) {
	if (x === null) m.removeAttribute(_);
	else {
		switch (typeof x) {
			case "undefined":
			case "function":
			case "symbol":
			case "boolean":
				m.removeAttribute(_);
				return;
		}
		m.setAttribute(_, "" + x);
	}
}
function it(m, _, x, S) {
	if (S === null) m.removeAttribute(x);
	else {
		switch (typeof S) {
			case "undefined":
			case "function":
			case "symbol":
			case "boolean":
				m.removeAttribute(x);
				return;
		}
		m.setAttributeNS(_, x, "" + S);
	}
}
function rt(m) {
	if (Ur === void 0) try {
		throw Error();
	} catch (m) {
		var _ = m.stack.trim().match(/\n( *(at )?)/);
		Ur = _ && _[1] || "", ri = -1 < m.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < m.stack.indexOf("@") ? "@unknown:0:0" : "";
	}
	return "\n" + Ur + m + ri;
}
var li = !1;
function ot(m, _) {
	if (!m || li) return "";
	li = !0;
	var x = Error.prepareStackTrace;
	Error.prepareStackTrace = void 0;
	try {
		var S = { DetermineComponentFrameRoot: function() {
			try {
				if (_) {
					var t = function() {
						throw Error();
					};
					if (Object.defineProperty(t.prototype, "props", { set: function() {
						throw Error();
					} }), typeof Reflect == "object" && Reflect.construct) {
						try {
							Reflect.construct(t, []);
						} catch (m) {
							var x = m;
						}
						Reflect.construct(m, [], t);
					} else {
						try {
							t.call();
						} catch (m) {
							x = m;
						}
						m.call(t.prototype);
					}
				} else {
					try {
						throw Error();
					} catch (m) {
						x = m;
					}
					(t = m()) && typeof t.catch == "function" && t.catch(function() {});
				}
			} catch (m) {
				if (m && x && typeof m.stack == "string") return [m.stack, x.stack];
			}
			return [null, null];
		} };
		S.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
		var C = Object.getOwnPropertyDescriptor(S.DetermineComponentFrameRoot, "name");
		C && C.configurable && Object.defineProperty(S.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
		var D = S.DetermineComponentFrameRoot(), O = D[0], F = D[1];
		if (O && F) {
			var I = O.split("\n"), L = F.split("\n");
			for (C = S = 0; S < I.length && !I[S].includes("DetermineComponentFrameRoot");) S++;
			for (; C < L.length && !L[C].includes("DetermineComponentFrameRoot");) C++;
			if (S === I.length || C === L.length) for (S = I.length - 1, C = L.length - 1; 1 <= S && 0 <= C && I[S] !== L[C];) C--;
			for (; 1 <= S && 0 <= C; S--, C--) if (I[S] !== L[C]) {
				if (S !== 1 || C !== 1) do
					if (S--, 0 > --C || I[S] !== L[C]) {
						var H = "\n" + I[S].replace(" at new ", " at ");
						return m.displayName && H.includes("<anonymous>") && (H = H.replace("<anonymous>", m.displayName)), H;
					}
				while (1 <= S && 0 <= C);
				break;
			}
		}
	} finally {
		li = !1, Error.prepareStackTrace = x;
	}
	return (x = m ? m.displayName || m.name : "") ? rt(x) : "";
}
function st(m) {
	switch (m.tag) {
		case 26:
		case 27:
		case 5: return rt(m.type);
		case 16: return rt("Lazy");
		case 13: return rt("Suspense");
		case 19: return rt("SuspenseList");
		case 0:
		case 15: return ot(m.type, !1);
		case 11: return ot(m.type.render, !1);
		case 1: return ot(m.type, !0);
		case 31: return rt("Activity");
		default: return "";
	}
}
function ut(m) {
	try {
		var _ = "";
		do
			_ += st(m), m = m.return;
		while (m);
		return _;
	} catch (m) {
		return "\nError generating stack: " + m.message + "\n" + m.stack;
	}
}
function ct(m) {
	switch (typeof m) {
		case "bigint":
		case "boolean":
		case "number":
		case "string":
		case "undefined":
		case "object": return m;
		default: return "";
	}
}
function dt(m) {
	var _ = m.type;
	return (m = m.nodeName) && m.toLowerCase() === "input" && (_ === "checkbox" || _ === "radio");
}
function gt(m) {
	m._valueTracker ||= function(m) {
		var _ = dt(m) ? "checked" : "value", x = Object.getOwnPropertyDescriptor(m.constructor.prototype, _), S = "" + m[_];
		if (!m.hasOwnProperty(_) && x !== void 0 && typeof x.get == "function" && typeof x.set == "function") {
			var C = x.get, D = x.set;
			return Object.defineProperty(m, _, {
				configurable: !0,
				get: function() {
					return C.call(this);
				},
				set: function(m) {
					S = "" + m, D.call(this, m);
				}
			}), Object.defineProperty(m, _, { enumerable: x.enumerable }), {
				getValue: function() {
					return S;
				},
				setValue: function(m) {
					S = "" + m;
				},
				stopTracking: function() {
					m._valueTracker = null, delete m[_];
				}
			};
		}
	}(m);
}
function pt(m) {
	if (!m) return !1;
	var _ = m._valueTracker;
	if (!_) return !0;
	var x = _.getValue(), S = "";
	return m && (S = dt(m) ? m.checked ? "true" : "false" : m.value), (m = S) !== x && (_.setValue(m), !0);
}
function ht(m) {
	if ((m ||= typeof document < "u" ? document : void 0) === void 0) return null;
	try {
		return m.activeElement || m.body;
	} catch {
		return m.body;
	}
}
var ui = /[\n"\\]/g;
function ft(m) {
	return m.replace(ui, function(m) {
		return "\\" + m.charCodeAt(0).toString(16) + " ";
	});
}
function Et(m, _, x, S, C, D, O, F) {
	m.name = "", O != null && typeof O != "function" && typeof O != "symbol" && typeof O != "boolean" ? m.type = O : m.removeAttribute("type"), _ == null ? O !== "submit" && O !== "reset" || m.removeAttribute("value") : O === "number" ? (_ === 0 && m.value === "" || m.value != _) && (m.value = "" + ct(_)) : m.value !== "" + ct(_) && (m.value = "" + ct(_)), _ == null ? x == null ? S != null && m.removeAttribute("value") : bt(m, O, ct(x)) : bt(m, O, ct(_)), C == null && D != null && (m.defaultChecked = !!D), C != null && (m.checked = C && typeof C != "function" && typeof C != "symbol"), F != null && typeof F != "function" && typeof F != "symbol" && typeof F != "boolean" ? m.name = "" + ct(F) : m.removeAttribute("name");
}
function wt(m, _, x, S, C, D, O, F) {
	if (D != null && typeof D != "function" && typeof D != "symbol" && typeof D != "boolean" && (m.type = D), _ != null || x != null) {
		if ((D === "submit" || D === "reset") && _ == null) return;
		x = x == null ? "" : "" + ct(x), _ = _ == null ? x : "" + ct(_), F || _ === m.value || (m.value = _), m.defaultValue = _;
	}
	S = typeof (S ??= C) != "function" && typeof S != "symbol" && !!S, m.checked = F ? m.checked : !!S, m.defaultChecked = !!S, O != null && typeof O != "function" && typeof O != "symbol" && typeof O != "boolean" && (m.name = O);
}
function bt(m, _, x) {
	_ === "number" && ht(m.ownerDocument) === m || m.defaultValue === "" + x || (m.defaultValue = "" + x);
}
function kt(m, _, x, S) {
	if (m = m.options, _) {
		_ = {};
		for (var C = 0; C < x.length; C++) _["$" + x[C]] = !0;
		for (x = 0; x < m.length; x++) C = _.hasOwnProperty("$" + m[x].value), m[x].selected !== C && (m[x].selected = C), C && S && (m[x].defaultSelected = !0);
	} else {
		for (x = "" + ct(x), _ = null, C = 0; C < m.length; C++) {
			if (m[C].value === x) return m[C].selected = !0, void (S && (m[C].defaultSelected = !0));
			_ !== null || m[C].disabled || (_ = m[C]);
		}
		_ !== null && (_.selected = !0);
	}
}
function yt(m, _, x) {
	_ == null || ((_ = "" + ct(_)) !== m.value && (m.value = _), x != null) ? m.defaultValue = x == null ? "" : "" + ct(x) : m.defaultValue !== _ && (m.defaultValue = _);
}
function St(m, _, x, S) {
	if (_ == null) {
		if (S != null) {
			if (x != null) throw Error(oA(92));
			if (un(S)) {
				if (1 < S.length) throw Error(oA(93));
				S = S[0];
			}
			x = S;
		}
		x ??= "", _ = x;
	}
	x = ct(_), m.defaultValue = x, (S = m.textContent) === x && S !== "" && S !== null && (m.value = S);
}
function It(m, _) {
	if (_) {
		var x = m.firstChild;
		if (x && x === m.lastChild && x.nodeType === 3) return void (x.nodeValue = _);
	}
	m.textContent = _;
}
var _i = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
function Ct(m, _, x) {
	var S = _.indexOf("--") === 0;
	x == null || typeof x == "boolean" || x === "" ? S ? m.setProperty(_, "") : _ === "float" ? m.cssFloat = "" : m[_] = "" : S ? m.setProperty(_, x) : typeof x != "number" || x === 0 || _i.has(_) ? _ === "float" ? m.cssFloat = x : m[_] = ("" + x).trim() : m[_] = x + "px";
}
function vt(m, _, x) {
	if (_ != null && typeof _ != "object") throw Error(oA(62));
	if (m = m.style, x != null) {
		for (var S in x) !x.hasOwnProperty(S) || _ != null && _.hasOwnProperty(S) || (S.indexOf("--") === 0 ? m.setProperty(S, "") : S === "float" ? m.cssFloat = "" : m[S] = "");
		for (var C in _) S = _[C], _.hasOwnProperty(C) && x[C] !== S && Ct(m, C, S);
	} else for (var D in _) _.hasOwnProperty(D) && Ct(m, D, _[D]);
}
function Bt(m) {
	if (m.indexOf("-") === -1) return !1;
	switch (m) {
		case "annotation-xml":
		case "color-profile":
		case "font-face":
		case "font-face-src":
		case "font-face-uri":
		case "font-face-format":
		case "font-face-name":
		case "missing-glyph": return !1;
		default: return !0;
	}
}
var bi = /* @__PURE__ */ new Map([
	["acceptCharset", "accept-charset"],
	["htmlFor", "for"],
	["httpEquiv", "http-equiv"],
	["crossOrigin", "crossorigin"],
	["accentHeight", "accent-height"],
	["alignmentBaseline", "alignment-baseline"],
	["arabicForm", "arabic-form"],
	["baselineShift", "baseline-shift"],
	["capHeight", "cap-height"],
	["clipPath", "clip-path"],
	["clipRule", "clip-rule"],
	["colorInterpolation", "color-interpolation"],
	["colorInterpolationFilters", "color-interpolation-filters"],
	["colorProfile", "color-profile"],
	["colorRendering", "color-rendering"],
	["dominantBaseline", "dominant-baseline"],
	["enableBackground", "enable-background"],
	["fillOpacity", "fill-opacity"],
	["fillRule", "fill-rule"],
	["floodColor", "flood-color"],
	["floodOpacity", "flood-opacity"],
	["fontFamily", "font-family"],
	["fontSize", "font-size"],
	["fontSizeAdjust", "font-size-adjust"],
	["fontStretch", "font-stretch"],
	["fontStyle", "font-style"],
	["fontVariant", "font-variant"],
	["fontWeight", "font-weight"],
	["glyphName", "glyph-name"],
	["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
	["glyphOrientationVertical", "glyph-orientation-vertical"],
	["horizAdvX", "horiz-adv-x"],
	["horizOriginX", "horiz-origin-x"],
	["imageRendering", "image-rendering"],
	["letterSpacing", "letter-spacing"],
	["lightingColor", "lighting-color"],
	["markerEnd", "marker-end"],
	["markerMid", "marker-mid"],
	["markerStart", "marker-start"],
	["overlinePosition", "overline-position"],
	["overlineThickness", "overline-thickness"],
	["paintOrder", "paint-order"],
	["panose-1", "panose-1"],
	["pointerEvents", "pointer-events"],
	["renderingIntent", "rendering-intent"],
	["shapeRendering", "shape-rendering"],
	["stopColor", "stop-color"],
	["stopOpacity", "stop-opacity"],
	["strikethroughPosition", "strikethrough-position"],
	["strikethroughThickness", "strikethrough-thickness"],
	["strokeDasharray", "stroke-dasharray"],
	["strokeDashoffset", "stroke-dashoffset"],
	["strokeLinecap", "stroke-linecap"],
	["strokeLinejoin", "stroke-linejoin"],
	["strokeMiterlimit", "stroke-miterlimit"],
	["strokeOpacity", "stroke-opacity"],
	["strokeWidth", "stroke-width"],
	["textAnchor", "text-anchor"],
	["textDecoration", "text-decoration"],
	["textRendering", "text-rendering"],
	["transformOrigin", "transform-origin"],
	["underlinePosition", "underline-position"],
	["underlineThickness", "underline-thickness"],
	["unicodeBidi", "unicode-bidi"],
	["unicodeRange", "unicode-range"],
	["unitsPerEm", "units-per-em"],
	["vAlphabetic", "v-alphabetic"],
	["vHanging", "v-hanging"],
	["vIdeographic", "v-ideographic"],
	["vMathematical", "v-mathematical"],
	["vectorEffect", "vector-effect"],
	["vertAdvY", "vert-adv-y"],
	["vertOriginX", "vert-origin-x"],
	["vertOriginY", "vert-origin-y"],
	["wordSpacing", "word-spacing"],
	["writingMode", "writing-mode"],
	["xmlnsXlink", "xmlns:xlink"],
	["xHeight", "x-height"]
]), wi = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function Nt(m) {
	return wi.test("" + m) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : m;
}
var Ti = null;
function Qt(m) {
	return (m = m.target || m.srcElement || window).correspondingUseElement && (m = m.correspondingUseElement), m.nodeType === 3 ? m.parentNode : m;
}
var Ei = null, Ai = null;
function Ot(m) {
	var _ = Ye(m);
	if (_ && (m = _.stateNode)) {
		var x = m[br] || null;
		A: switch (m = _.stateNode, _.type) {
			case "input":
				if (Et(m, x.value, x.defaultValue, x.defaultValue, x.checked, x.defaultChecked, x.type, x.name), _ = x.name, x.type === "radio" && _ != null) {
					for (x = m; x.parentNode;) x = x.parentNode;
					for (x = x.querySelectorAll("input[name=\"" + ft("" + _) + "\"][type=\"radio\"]"), _ = 0; _ < x.length; _++) {
						var S = x[_];
						if (S !== m && S.form === m.form) {
							var C = S[br] || null;
							if (!C) throw Error(oA(90));
							Et(S, C.value, C.defaultValue, C.defaultValue, C.checked, C.defaultChecked, C.type, C.name);
						}
					}
					for (_ = 0; _ < x.length; _++) (S = x[_]).form === m.form && pt(S);
				}
				break A;
			case "textarea":
				yt(m, x.value, x.defaultValue);
				break A;
			case "select": (_ = x.value) != null && kt(m, !!x.multiple, _, !1);
		}
	}
}
var Ni = !1;
function Rt(m, _, x) {
	if (Ni) return m(_, x);
	Ni = !0;
	try {
		return m(_);
	} finally {
		if (Ni = !1, (Ei !== null || Ai !== null) && (Pu(), Ei && (_ = Ei, m = Ai, Ai = Ei = null, Ot(_), m))) for (_ = 0; _ < m.length; _++) Ot(m[_]);
	}
}
function Ft(m, _) {
	var x = m.stateNode;
	if (x === null) return null;
	var S = x[br] || null;
	if (S === null) return null;
	x = S[_];
	A: switch (_) {
		case "onClick":
		case "onClickCapture":
		case "onDoubleClick":
		case "onDoubleClickCapture":
		case "onMouseDown":
		case "onMouseDownCapture":
		case "onMouseMove":
		case "onMouseMoveCapture":
		case "onMouseUp":
		case "onMouseUpCapture":
		case "onMouseEnter":
			(S = !S.disabled) || (S = (m = m.type) !== "button" && m !== "input" && m !== "select" && m !== "textarea"), m = !S;
			break A;
		default: m = !1;
	}
	if (m) return null;
	if (x && typeof x != "function") throw Error(oA(231, _, typeof x));
	return x;
}
var Pi = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), Fi = !1;
if (Pi) try {
	var Li = {};
	Object.defineProperty(Li, "passive", { get: function() {
		Fi = !0;
	} }), window.addEventListener("test", Li, Li), window.removeEventListener("test", Li, Li);
} catch {
	Fi = !1;
}
var Ri = null, Vi = null, Wi = null;
function jt() {
	if (Wi) return Wi;
	var m, _, x = Vi, S = x.length, C = "value" in Ri ? Ri.value : Ri.textContent, D = C.length;
	for (m = 0; m < S && x[m] === C[m]; m++);
	var O = S - m;
	for (_ = 1; _ <= O && x[S - _] === C[D - _]; _++);
	return Wi = C.slice(m, 1 < _ ? 1 - _ : void 0);
}
function _t(m) {
	var _ = m.keyCode;
	return "charCode" in m ? (m = m.charCode) === 0 && _ === 13 && (m = 13) : m = _, m === 10 && (m = 13), 32 <= m || m === 13 ? m : 0;
}
function Jt() {
	return !0;
}
function qt() {
	return !1;
}
function Wt(m) {
	function e(_, x, S, C, D) {
		for (var O in this._reactName = _, this._targetInst = S, this.type = x, this.nativeEvent = C, this.target = D, this.currentTarget = null, m) m.hasOwnProperty(O) && (_ = m[O], this[O] = _ ? _(C) : C[O]);
		return this.isDefaultPrevented = (C.defaultPrevented == null ? !1 === C.returnValue : C.defaultPrevented) ? Jt : qt, this.isPropagationStopped = qt, this;
	}
	return zt(e.prototype, {
		preventDefault: function() {
			this.defaultPrevented = !0;
			var m = this.nativeEvent;
			m && (m.preventDefault ? m.preventDefault() : typeof m.returnValue != "unknown" && (m.returnValue = !1), this.isDefaultPrevented = Jt);
		},
		stopPropagation: function() {
			var m = this.nativeEvent;
			m && (m.stopPropagation ? m.stopPropagation() : typeof m.cancelBubble != "unknown" && (m.cancelBubble = !0), this.isPropagationStopped = Jt);
		},
		persist: function() {},
		isPersistent: Jt
	}), e;
}
var Gi, Ki, qi, Ji = {
	eventPhase: 0,
	bubbles: 0,
	cancelable: 0,
	timeStamp: function(m) {
		return m.timeStamp || Date.now();
	},
	defaultPrevented: 0,
	isTrusted: 0
}, Qi = Wt(Ji), ra = zt({}, Ji, {
	view: 0,
	detail: 0
}), ia = Wt(ra), aa = zt({}, ra, {
	screenX: 0,
	screenY: 0,
	clientX: 0,
	clientY: 0,
	pageX: 0,
	pageY: 0,
	ctrlKey: 0,
	shiftKey: 0,
	altKey: 0,
	metaKey: 0,
	getModifierState: mn,
	button: 0,
	buttons: 0,
	relatedTarget: function(m) {
		return m.relatedTarget === void 0 ? m.fromElement === m.srcElement ? m.toElement : m.fromElement : m.relatedTarget;
	},
	movementX: function(m) {
		return "movementX" in m ? m.movementX : (m !== qi && (qi && m.type === "mousemove" ? (Gi = m.screenX - qi.screenX, Ki = m.screenY - qi.screenY) : Ki = Gi = 0, qi = m), Gi);
	},
	movementY: function(m) {
		return "movementY" in m ? m.movementY : Ki;
	}
}), oa = Wt(aa), ca = Wt(zt({}, aa, { dataTransfer: 0 })), la = Wt(zt({}, ra, { relatedTarget: 0 })), da = Wt(zt({}, Ji, {
	animationName: 0,
	elapsedTime: 0,
	pseudoElement: 0
})), fa = Wt(zt({}, Ji, { clipboardData: function(m) {
	return "clipboardData" in m ? m.clipboardData : window.clipboardData;
} })), ma = Wt(zt({}, Ji, { data: 0 })), ha = {
	Esc: "Escape",
	Spacebar: " ",
	Left: "ArrowLeft",
	Up: "ArrowUp",
	Right: "ArrowRight",
	Down: "ArrowDown",
	Del: "Delete",
	Win: "OS",
	Menu: "ContextMenu",
	Apps: "ContextMenu",
	Scroll: "ScrollLock",
	MozPrintableKey: "Unidentified"
}, ga = {
	8: "Backspace",
	9: "Tab",
	12: "Clear",
	13: "Enter",
	16: "Shift",
	17: "Control",
	18: "Alt",
	19: "Pause",
	20: "CapsLock",
	27: "Escape",
	32: " ",
	33: "PageUp",
	34: "PageDown",
	35: "End",
	36: "Home",
	37: "ArrowLeft",
	38: "ArrowUp",
	39: "ArrowRight",
	40: "ArrowDown",
	45: "Insert",
	46: "Delete",
	112: "F1",
	113: "F2",
	114: "F3",
	115: "F4",
	116: "F5",
	117: "F6",
	118: "F7",
	119: "F8",
	120: "F9",
	121: "F10",
	122: "F11",
	123: "F12",
	144: "NumLock",
	145: "ScrollLock",
	224: "Meta"
}, _a = {
	Alt: "altKey",
	Control: "ctrlKey",
	Meta: "metaKey",
	Shift: "shiftKey"
};
function hn(m) {
	var _ = this.nativeEvent;
	return _.getModifierState ? _.getModifierState(m) : !!(m = _a[m]) && !!_[m];
}
function mn() {
	return hn;
}
var va = Wt(zt({}, ra, {
	key: function(m) {
		if (m.key) {
			var _ = ha[m.key] || m.key;
			if (_ !== "Unidentified") return _;
		}
		return m.type === "keypress" ? (m = _t(m)) === 13 ? "Enter" : String.fromCharCode(m) : m.type === "keydown" || m.type === "keyup" ? ga[m.keyCode] || "Unidentified" : "";
	},
	code: 0,
	location: 0,
	ctrlKey: 0,
	shiftKey: 0,
	altKey: 0,
	metaKey: 0,
	repeat: 0,
	locale: 0,
	getModifierState: mn,
	charCode: function(m) {
		return m.type === "keypress" ? _t(m) : 0;
	},
	keyCode: function(m) {
		return m.type === "keydown" || m.type === "keyup" ? m.keyCode : 0;
	},
	which: function(m) {
		return m.type === "keypress" ? _t(m) : m.type === "keydown" || m.type === "keyup" ? m.keyCode : 0;
	}
})), ya = Wt(zt({}, aa, {
	pointerId: 0,
	width: 0,
	height: 0,
	pressure: 0,
	tangentialPressure: 0,
	tiltX: 0,
	tiltY: 0,
	twist: 0,
	pointerType: 0,
	isPrimary: 0
})), ba = Wt(zt({}, ra, {
	touches: 0,
	targetTouches: 0,
	changedTouches: 0,
	altKey: 0,
	metaKey: 0,
	ctrlKey: 0,
	shiftKey: 0,
	getModifierState: mn
})), xa = Wt(zt({}, Ji, {
	propertyName: 0,
	elapsedTime: 0,
	pseudoElement: 0
})), Sa = Wt(zt({}, aa, {
	deltaX: function(m) {
		return "deltaX" in m ? m.deltaX : "wheelDeltaX" in m ? -m.wheelDeltaX : 0;
	},
	deltaY: function(m) {
		return "deltaY" in m ? m.deltaY : "wheelDeltaY" in m ? -m.wheelDeltaY : "wheelDelta" in m ? -m.wheelDelta : 0;
	},
	deltaZ: 0,
	deltaMode: 0
})), wa = Wt(zt({}, Ji, {
	newState: 0,
	oldState: 0
})), Ea = [
	9,
	13,
	27,
	32
], Oa = Pi && "CompositionEvent" in window, ka = null;
Pi && "documentMode" in document && (ka = document.documentMode);
var ja = Pi && "TextEvent" in window && !ka, Ba = Pi && (!Oa || ka && 8 < ka && 11 >= ka), Ua = " ", Wa = !1;
function Mn(m, _) {
	switch (m) {
		case "keyup": return Ea.indexOf(_.keyCode) !== -1;
		case "keydown": return _.keyCode !== 229;
		case "keypress":
		case "mousedown":
		case "focusout": return !0;
		default: return !1;
	}
}
function Nn(m) {
	return typeof (m = m.detail) == "object" && "data" in m ? m.data : null;
}
var qa = !1, Ja = {
	color: !0,
	date: !0,
	datetime: !0,
	"datetime-local": !0,
	email: !0,
	month: !0,
	number: !0,
	password: !0,
	range: !0,
	search: !0,
	tel: !0,
	text: !0,
	time: !0,
	url: !0,
	week: !0
};
function Ln(m) {
	var _ = m && m.nodeName && m.nodeName.toLowerCase();
	return _ === "input" ? !!Ja[m.type] : _ === "textarea";
}
function Dn(m, _, x, S) {
	Ei ? Ai ? Ai.push(S) : Ai = [S] : Ei = S, 0 < (_ = jc(_, "onChange")).length && (x = new Qi("onChange", "change", null, x, S), m.push({
		event: x,
		listeners: _
	}));
}
var Xa = null, Za = null;
function Rn(m) {
	Rc(m, 0);
}
function Fn(m) {
	if (pt(He(m))) return m;
}
function Gn(m, _) {
	if (m === "change") return _;
}
var $a = !1;
if (Pi) {
	var no;
	if (Pi) {
		var ro = "oninput" in document;
		if (!ro) {
			var io = document.createElement("div");
			io.setAttribute("oninput", "return;"), ro = typeof io.oninput == "function";
		}
		no = ro;
	} else no = !1;
	$a = no && (!document.documentMode || 9 < document.documentMode);
}
function Hn() {
	Xa && (Xa.detachEvent("onpropertychange", jn), Za = Xa = null);
}
function jn(m) {
	if (m.propertyName === "value" && Fn(Za)) {
		var _ = [];
		Dn(_, Za, m, Qt(m)), Rt(Rn, _);
	}
}
function _n(m, _, x) {
	m === "focusin" ? (Hn(), Za = x, (Xa = _).attachEvent("onpropertychange", jn)) : m === "focusout" && Hn();
}
function Jn(m) {
	if (m === "selectionchange" || m === "keyup" || m === "keydown") return Fn(Za);
}
function qn(m, _) {
	if (m === "click") return Fn(_);
}
function Wn(m, _) {
	if (m === "input" || m === "change") return Fn(_);
}
var ao = typeof Object.is == "function" ? Object.is : function(m, _) {
	return m === _ && (m !== 0 || 1 / m == 1 / _) || m != m && _ != _;
};
function Xn(m, _) {
	if (ao(m, _)) return !0;
	if (typeof m != "object" || !m || typeof _ != "object" || !_) return !1;
	var x = Object.keys(m), S = Object.keys(_);
	if (x.length !== S.length) return !1;
	for (S = 0; S < x.length; S++) {
		var C = x[S];
		if (!Cn.call(_, C) || !ao(m[C], _[C])) return !1;
	}
	return !0;
}
function $n(m) {
	for (; m && m.firstChild;) m = m.firstChild;
	return m;
}
function Aa(m, _) {
	var x, S = $n(m);
	for (m = 0; S;) {
		if (S.nodeType === 3) {
			if (x = m + S.textContent.length, m <= _ && x >= _) return {
				node: S,
				offset: _ - m
			};
			m = x;
		}
		A: {
			for (; S;) {
				if (S.nextSibling) {
					S = S.nextSibling;
					break A;
				}
				S = S.parentNode;
			}
			S = void 0;
		}
		S = $n(S);
	}
}
function ea(m, _) {
	return !(!m || !_) && (m === _ || (!m || m.nodeType !== 3) && (_ && _.nodeType === 3 ? ea(m, _.parentNode) : "contains" in m ? m.contains(_) : !!m.compareDocumentPosition && !!(16 & m.compareDocumentPosition(_))));
}
function ta(m) {
	for (var _ = ht((m = m != null && m.ownerDocument != null && m.ownerDocument.defaultView != null ? m.ownerDocument.defaultView : window).document); _ instanceof m.HTMLIFrameElement;) {
		try {
			var x = typeof _.contentWindow.location.href == "string";
		} catch {
			x = !1;
		}
		if (!x) break;
		_ = ht((m = _.contentWindow).document);
	}
	return _;
}
function na(m) {
	var _ = m && m.nodeName && m.nodeName.toLowerCase();
	return _ && (_ === "input" && (m.type === "text" || m.type === "search" || m.type === "tel" || m.type === "url" || m.type === "password") || _ === "textarea" || m.contentEditable === "true");
}
var co = Pi && "documentMode" in document && 11 >= document.documentMode, ho = null, xo = null, wo = null, zo = !1;
function sa(m, _, x) {
	var S = x.window === x ? x.document : x.nodeType === 9 ? x : x.ownerDocument;
	zo || ho == null || ho !== ht(S) || (S = "selectionStart" in (S = ho) && na(S) ? {
		start: S.selectionStart,
		end: S.selectionEnd
	} : {
		anchorNode: (S = (S.ownerDocument && S.ownerDocument.defaultView || window).getSelection()).anchorNode,
		anchorOffset: S.anchorOffset,
		focusNode: S.focusNode,
		focusOffset: S.focusOffset
	}, wo && Xn(wo, S) || (wo = S, 0 < (S = jc(xo, "onSelect")).length && (_ = new Qi("onSelect", "select", null, _, x), m.push({
		event: _,
		listeners: S
	}), _.target = ho)));
}
function ua(m, _) {
	var x = {};
	return x[m.toLowerCase()] = _.toLowerCase(), x["Webkit" + m] = "webkit" + _, x["Moz" + m] = "moz" + _, x;
}
var Bo = {
	animationend: ua("Animation", "AnimationEnd"),
	animationiteration: ua("Animation", "AnimationIteration"),
	animationstart: ua("Animation", "AnimationStart"),
	transitionrun: ua("Transition", "TransitionRun"),
	transitionstart: ua("Transition", "TransitionStart"),
	transitioncancel: ua("Transition", "TransitionCancel"),
	transitionend: ua("Transition", "TransitionEnd")
}, ys = {}, xs = {};
function pa(m) {
	if (ys[m]) return ys[m];
	if (!Bo[m]) return m;
	var _, x = Bo[m];
	for (_ in x) if (x.hasOwnProperty(_) && _ in xs) return ys[m] = x[_];
	return m;
}
Pi && (xs = document.createElement("div").style, "AnimationEvent" in window || (delete Bo.animationend.animation, delete Bo.animationiteration.animation, delete Bo.animationstart.animation), "TransitionEvent" in window || delete Bo.transitionend.transition);
var Ss = pa("animationend"), Ds = pa("animationiteration"), ks = pa("animationstart"), Is = pa("transitionrun"), Bs = pa("transitionstart"), Us = pa("transitioncancel"), Js = pa("transitionend"), yc = /* @__PURE__ */ new Map(), bc = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Ia(m, _) {
	yc.set(m, _), We(_, [m]);
}
bc.push("scrollEnd");
var Sc = /* @__PURE__ */ new WeakMap();
function Ca(m, _) {
	if (typeof m == "object" && m) {
		var x = Sc.get(m);
		return x === void 0 ? (_ = {
			value: m,
			source: _,
			stack: ut(_)
		}, Sc.set(m, _), _) : x;
	}
	return {
		value: m,
		source: _,
		stack: ut(_)
	};
}
var wc = [], Ec = 0, Dc = 0;
function Ma() {
	for (var m = Ec, _ = Dc = Ec = 0; _ < m;) {
		var x = wc[_];
		wc[_++] = null;
		var S = wc[_];
		wc[_++] = null;
		var C = wc[_];
		wc[_++] = null;
		var D = wc[_];
		if (wc[_++] = null, S !== null && C !== null) {
			var O = S.pending;
			O === null ? C.next = C : (C.next = O.next, O.next = C), S.pending = C;
		}
		D !== 0 && La(x, C, D);
	}
}
function Na(m, _, x, S) {
	wc[Ec++] = m, wc[Ec++] = _, wc[Ec++] = x, wc[Ec++] = S, Dc |= S, m.lanes |= S, (m = m.alternate) !== null && (m.lanes |= S);
}
function Ta(m, _, x, S) {
	return Na(m, _, x, S), Da(m);
}
function Qa(m, _) {
	return Na(m, null, null, _), Da(m);
}
function La(m, _, x) {
	m.lanes |= x;
	var S = m.alternate;
	S !== null && (S.lanes |= x);
	for (var C = !1, D = m.return; D !== null;) D.childLanes |= x, (S = D.alternate) !== null && (S.childLanes |= x), D.tag === 22 && ((m = D.stateNode) === null || 1 & m._visibility || (C = !0)), m = D, D = D.return;
	return m.tag === 3 ? (D = m.stateNode, C && _ !== null && (C = 31 - Qn(x), (S = (m = D.hiddenUpdates)[C]) === null ? m[C] = [_] : S.push(_), _.lane = 536870912 | x), D) : null;
}
function Da(m) {
	if (50 < _p) throw _p = 0, vp = null, Error(oA(185));
	for (var _ = m.return; _ !== null;) _ = (m = _).return;
	return m.tag === 3 ? m.stateNode : null;
}
var Oc = {};
function Va(m, _, x, S) {
	this.tag = m, this.key = x, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = _, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = S, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function Ra(m, _, x, S) {
	return new Va(m, _, x, S);
}
function Fa(m) {
	return !(!(m = m.prototype) || !m.isReactComponent);
}
function Ga(m, _) {
	var x = m.alternate;
	return x === null ? ((x = Ra(m.tag, _, m.key, m.mode)).elementType = m.elementType, x.type = m.type, x.stateNode = m.stateNode, x.alternate = m, m.alternate = x) : (x.pendingProps = _, x.type = m.type, x.flags = 0, x.subtreeFlags = 0, x.deletions = null), x.flags = 65011712 & m.flags, x.childLanes = m.childLanes, x.lanes = m.lanes, x.child = m.child, x.memoizedProps = m.memoizedProps, x.memoizedState = m.memoizedState, x.updateQueue = m.updateQueue, _ = m.dependencies, x.dependencies = _ === null ? null : {
		lanes: _.lanes,
		firstContext: _.firstContext
	}, x.sibling = m.sibling, x.index = m.index, x.ref = m.ref, x.refCleanup = m.refCleanup, x;
}
function za(m, _) {
	m.flags &= 65011714;
	var x = m.alternate;
	return x === null ? (m.childLanes = 0, m.lanes = _, m.child = null, m.subtreeFlags = 0, m.memoizedProps = null, m.memoizedState = null, m.updateQueue = null, m.dependencies = null, m.stateNode = null) : (m.childLanes = x.childLanes, m.lanes = x.lanes, m.child = x.child, m.subtreeFlags = 0, m.deletions = null, m.memoizedProps = x.memoizedProps, m.memoizedState = x.memoizedState, m.updateQueue = x.updateQueue, m.type = x.type, _ = x.dependencies, m.dependencies = _ === null ? null : {
		lanes: _.lanes,
		firstContext: _.firstContext
	}), m;
}
function Ka(m, _, x, S, C, D) {
	var O = 0;
	if (S = m, typeof m == "function") Fa(m) && (O = 1);
	else if (typeof m == "string") O = function(m, _) {
		if (yn.current === 1 || _.itemProp != null) return !1;
		switch (m) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof _.precedence != "string" || typeof _.href != "string" || _.href === "") break;
				return !0;
			case "link":
				if (typeof _.rel != "string" || typeof _.href != "string" || _.href === "" || _.onLoad || _.onError) break;
				return _.rel !== "stylesheet" || (m = _.disabled, typeof _.precedence == "string" && m == null);
			case "script": if (_.async && typeof _.async != "function" && typeof _.async != "symbol" && !_.onLoad && !_.onError && _.src && typeof _.src == "string") return !0;
		}
		return !1;
	}(m, x) ? 26 : m === "html" || m === "head" || m === "body" ? 27 : 5;
	else A: switch (m) {
		case on: return (m = Ra(31, x, _, C)).elementType = on, m.lanes = D, m;
		case Gt: return Pa(x.children, C, D, _);
		case Kt:
			O = 8, C |= 24;
			break;
		case Yt: return (m = Ra(12, x, _, 2 | C)).elementType = Yt, m.lanes = D, m;
		case tn: return (m = Ra(13, x, _, C)).elementType = tn, m.lanes = D, m;
		case nn: return (m = Ra(19, x, _, C)).elementType = nn, m.lanes = D, m;
		default:
			if (typeof m == "object" && m) switch (m.$$typeof) {
				case Xt:
				case $t:
					O = 10;
					break A;
				case Zt:
					O = 9;
					break A;
				case en:
					O = 11;
					break A;
				case rn:
					O = 14;
					break A;
				case an:
					O = 16, S = null;
					break A;
			}
			O = 29, x = Error(oA(130, m === null ? "null" : typeof m, "")), S = null;
	}
	return (_ = Ra(O, x, _, C)).elementType = m, _.type = S, _.lanes = D, _;
}
function Pa(m, _, x, S) {
	return (m = Ra(7, m, S, _)).lanes = x, m;
}
function Ya(m, _, x) {
	return (m = Ra(6, m, null, _)).lanes = x, m;
}
function Ha(m, _, x) {
	return (_ = Ra(4, m.children === null ? [] : m.children, m.key, _)).lanes = x, _.stateNode = {
		containerInfo: m.containerInfo,
		pendingChildren: null,
		implementation: m.implementation
	}, _;
}
var kc = [], Lc = 0, zc = null, Vc = 0, Wc = [], qc = 0, _l = null, jl = 1, Wl = "";
function ei(m, _) {
	kc[Lc++] = Vc, kc[Lc++] = zc, zc = m, Vc = _;
}
function ti(m, _, x) {
	Wc[qc++] = jl, Wc[qc++] = Wl, Wc[qc++] = _l, _l = m;
	var S = jl;
	m = Wl;
	var C = 32 - Qn(S) - 1;
	S &= ~(1 << C), x += 1;
	var D = 32 - Qn(_) + C;
	if (30 < D) {
		var O = C - C % 5;
		D = (S & (1 << O) - 1).toString(32), S >>= O, C -= O, jl = 1 << 32 - Qn(_) + C | x << C | S, Wl = D + m;
	} else jl = 1 << D | x << C | S, Wl = m;
}
function ni(m) {
	m.return !== null && (ei(m, 1), ti(m, 1, 0));
}
function ai(m) {
	for (; m === zc;) zc = kc[--Lc], kc[Lc] = null, Vc = kc[--Lc], kc[Lc] = null;
	for (; m === _l;) _l = Wc[--qc], Wc[qc] = null, Wl = Wc[--qc], Wc[qc] = null, jl = Wc[--qc], Wc[qc] = null;
}
var ql = null, Jl = null, Zl = !1, tu = null, nu = !1, ru = Error(oA(519));
function ci(m) {
	throw fi(Ca(Error(oA(418, "")), m)), ru;
}
function di(m) {
	var _ = m.stateNode, x = m.type, S = m.memoizedProps;
	switch (_[yr] = m, _[br] = S, x) {
		case "dialog":
			Fc("cancel", _), Fc("close", _);
			break;
		case "iframe":
		case "object":
		case "embed":
			Fc("load", _);
			break;
		case "video":
		case "audio":
			for (x = 0; x < Dp.length; x++) Fc(Dp[x], _);
			break;
		case "source":
			Fc("error", _);
			break;
		case "img":
		case "image":
		case "link":
			Fc("error", _), Fc("load", _);
			break;
		case "details":
			Fc("toggle", _);
			break;
		case "input":
			Fc("invalid", _), wt(_, S.value, S.defaultValue, S.checked, S.defaultChecked, S.type, S.name, !0), gt(_);
			break;
		case "select":
			Fc("invalid", _);
			break;
		case "textarea": Fc("invalid", _), St(_, S.value, S.defaultValue, S.children), gt(_);
	}
	typeof (x = S.children) != "string" && typeof x != "number" && typeof x != "bigint" || _.textContent === "" + x || !0 === S.suppressHydrationWarning || Xc(_.textContent, x) ? (S.popover != null && (Fc("beforetoggle", _), Fc("toggle", _)), S.onScroll != null && Fc("scroll", _), S.onScrollEnd != null && Fc("scrollend", _), S.onClick != null && (_.onclick = $c), _ = !0) : _ = !1, _ || ci(m);
}
function gi(m) {
	for (ql = m.return; ql;) switch (ql.tag) {
		case 5:
		case 13:
			nu = !1;
			return;
		case 27:
		case 3:
			nu = !0;
			return;
		default: ql = ql.return;
	}
}
function pi(m) {
	if (m !== ql) return !1;
	if (!Zl) return gi(m), Zl = !0, !1;
	var _, x = m.tag;
	if ((_ = x !== 3 && x !== 27) && ((_ = x === 5) && (_ = (_ = m.type) === "form" || _ === "button" || od(m.type, m.memoizedProps)), _ = !_), _ && Jl && ci(m), gi(m), x === 13) {
		if (!(m = (m = m.memoizedState) === null ? null : m.dehydrated)) throw Error(oA(317));
		A: {
			for (m = m.nextSibling, x = 0; m;) {
				if (m.nodeType === 8) {
					if ((_ = m.data) === "/$") {
						if (x === 0) {
							Jl = wd(m.nextSibling);
							break A;
						}
						x--;
					} else _ !== "$" && _ !== "$!" && _ !== "$?" || x++;
				}
				m = m.nextSibling;
			}
			Jl = null;
		}
	} else x === 27 ? (x = Jl, hd(m.type) ? (m = zp, zp = null, Jl = m) : Jl = x) : Jl = ql ? wd(m.stateNode.nextSibling) : null;
	return !0;
}
function hi() {
	Jl = ql = null, Zl = !1;
}
function mi() {
	var m = tu;
	return m !== null && (Jf === null ? Jf = m : Jf.push.apply(Jf, m), tu = null), m;
}
function fi(m) {
	tu === null ? tu = [m] : tu.push(m);
}
var iu = zA(null), au = null, ou = null;
function ki(m, _, x) {
	PA(iu, _._currentValue), _._currentValue = x;
}
function yi(m) {
	m._currentValue = iu.current, KA(iu);
}
function Si(m, _, x) {
	for (; m !== null;) {
		var S = m.alternate;
		if ((m.childLanes & _) === _ ? S !== null && (S.childLanes & _) !== _ && (S.childLanes |= _) : (m.childLanes |= _, S !== null && (S.childLanes |= _)), m === x) break;
		m = m.return;
	}
}
function Ii(m, _, x, S) {
	var C = m.child;
	for (C !== null && (C.return = m); C !== null;) {
		var D = C.dependencies;
		if (D !== null) {
			var O = C.child;
			D = D.firstContext;
			A: for (; D !== null;) {
				var F = D;
				D = C;
				for (var I = 0; I < _.length; I++) if (F.context === _[I]) {
					D.lanes |= x, (F = D.alternate) !== null && (F.lanes |= x), Si(D.return, x, m), S || (O = null);
					break A;
				}
				D = F.next;
			}
		} else if (C.tag === 18) {
			if ((O = C.return) === null) throw Error(oA(341));
			O.lanes |= x, (D = O.alternate) !== null && (D.lanes |= x), Si(O, x, m), O = null;
		} else O = C.child;
		if (O !== null) O.return = C;
		else for (O = C; O !== null;) {
			if (O === m) {
				O = null;
				break;
			}
			if ((C = O.sibling) !== null) {
				C.return = O.return, O = C;
				break;
			}
			O = O.return;
		}
		C = O;
	}
}
function Ui(m, _, x, S) {
	m = null;
	for (var C = _, D = !1; C !== null;) {
		if (!D) {
			if (524288 & C.flags) D = !0;
			else if (262144 & C.flags) break;
		}
		if (C.tag === 10) {
			var O = C.alternate;
			if (O === null) throw Error(oA(387));
			if ((O = O.memoizedProps) !== null) {
				var F = C.type;
				ao(C.pendingProps.value, O.value) || (m === null ? m = [F] : m.push(F));
			}
		} else if (C === Sn.current) {
			if ((O = C.alternate) === null) throw Error(oA(387));
			O.memoizedState.memoizedState !== C.memoizedState.memoizedState && (m === null ? m = [qp] : m.push(qp));
		}
		C = C.return;
	}
	m !== null && Ii(_, m, x, S), _.flags |= 262144;
}
function Ci(m) {
	for (m = m.firstContext; m !== null;) {
		if (!ao(m.context._currentValue, m.memoizedValue)) return !0;
		m = m.next;
	}
	return !1;
}
function vi(m) {
	au = m, ou = null, (m = m.dependencies) !== null && (m.firstContext = null);
}
function Bi(m) {
	return Mi(au, m);
}
function xi(m, _) {
	return au === null && vi(m), Mi(m, _);
}
function Mi(m, _) {
	var x = _._currentValue;
	if (_ = {
		context: _,
		memoizedValue: x,
		next: null
	}, ou === null) {
		if (m === null) throw Error(oA(308));
		ou = _, m.dependencies = {
			lanes: 0,
			firstContext: _
		}, m.flags |= 524288;
	} else ou = ou.next = _;
	return x;
}
var su = typeof AbortController < "u" ? AbortController : function() {
	var m = [], _ = this.signal = {
		aborted: !1,
		addEventListener: function(_, x) {
			m.push(x);
		}
	};
	this.abort = function() {
		_.aborted = !0, m.forEach(function(m) {
			return m();
		});
	};
}, cu = Mt.unstable_scheduleCallback, lu = Mt.unstable_NormalPriority, uu = {
	$$typeof: $t,
	Consumer: null,
	Provider: null,
	_currentValue: null,
	_currentValue2: null,
	_threadCount: 0
};
function Di() {
	return {
		controller: new su(),
		data: /* @__PURE__ */ new Map(),
		refCount: 0
	};
}
function Oi(m) {
	m.refCount--, m.refCount === 0 && cu(lu, function() {
		m.controller.abort();
	});
}
var du = null, fu = 0, pu = 0, mu = null;
function zi() {
	if (--fu === 0 && du !== null) {
		mu !== null && (mu.status = "fulfilled");
		var m = du;
		du = null, pu = 0, mu = null;
		for (var _ = 0; _ < m.length; _++) (0, m[_])();
	}
}
var hu = dn.S;
dn.S = function(m, _) {
	typeof _ == "object" && _ && typeof _.then == "function" && function(m, _) {
		if (du === null) {
			var x = du = [];
			fu = 0, pu = Nc(), mu = {
				status: "pending",
				value: void 0,
				then: function(m) {
					x.push(m);
				}
			};
		}
		fu++, _.then(zi, zi);
	}(0, _), hu !== null && hu(m, _);
};
var gu = zA(null);
function Yi() {
	var m = gu.current;
	return m === null ? Sf.pooledCache : m;
}
function Hi(m, _) {
	PA(gu, _ === null ? gu.current : _.pool);
}
function ji() {
	var m = Yi();
	return m === null ? null : {
		parent: uu._currentValue,
		pool: m
	};
}
var vu = Error(oA(460)), yu = Error(oA(474)), bu = Error(oA(542)), xu = { then: function() {} };
function Zi(m) {
	return (m = m.status) === "fulfilled" || m === "rejected";
}
function Xi() {}
function $i(m, _, x) {
	switch ((x = m[x]) === void 0 ? m.push(_) : x !== _ && (_.then(Xi, Xi), _ = x), _.status) {
		case "fulfilled": return _.value;
		case "rejected": throw tr(m = _.reason), m;
		default:
			if (typeof _.status == "string") _.then(Xi, Xi);
			else {
				if ((m = Sf) !== null && 100 < m.shellSuspendCounter) throw Error(oA(482));
				(m = _).status = "pending", m.then(function(m) {
					if (_.status === "pending") {
						var x = _;
						x.status = "fulfilled", x.value = m;
					}
				}, function(m) {
					if (_.status === "pending") {
						var x = _;
						x.status = "rejected", x.reason = m;
					}
				});
			}
			switch (_.status) {
				case "fulfilled": return _.value;
				case "rejected": throw tr(m = _.reason), m;
			}
			throw Su = _, vu;
	}
}
var Su = null;
function er() {
	if (Su === null) throw Error(oA(459));
	var m = Su;
	return Su = null, m;
}
function tr(m) {
	if (m === vu || m === bu) throw Error(oA(483));
}
var Cu = !1;
function ar(m) {
	m.updateQueue = {
		baseState: m.memoizedState,
		firstBaseUpdate: null,
		lastBaseUpdate: null,
		shared: {
			pending: null,
			lanes: 0,
			hiddenCallbacks: null
		},
		callbacks: null
	};
}
function ir(m, _) {
	m = m.updateQueue, _.updateQueue === m && (_.updateQueue = {
		baseState: m.baseState,
		firstBaseUpdate: m.firstBaseUpdate,
		lastBaseUpdate: m.lastBaseUpdate,
		shared: m.shared,
		callbacks: null
	});
}
function rr(m) {
	return {
		lane: m,
		tag: 0,
		payload: null,
		callback: null,
		next: null
	};
}
function lr(m, _, x) {
	var S = m.updateQueue;
	if (S === null) return null;
	if (S = S.shared, 2 & bf) {
		var C = S.pending;
		return C === null ? _.next = _ : (_.next = C.next, C.next = _), S.pending = _, _ = Da(m), La(m, null, x), _;
	}
	return Na(m, S, _, x), Da(m);
}
function or(m, _, x) {
	if ((_ = _.updateQueue) !== null && (_ = _.shared, 4194048 & x)) {
		var S = _.lanes;
		x |= S &= m.pendingLanes, _.lanes = x, xe(m, x);
	}
}
function sr(m, _) {
	var x = m.updateQueue, S = m.alternate;
	if (S !== null && x === (S = S.updateQueue)) {
		var C = null, D = null;
		if ((x = x.firstBaseUpdate) !== null) {
			do {
				var O = {
					lane: x.lane,
					tag: x.tag,
					payload: x.payload,
					callback: null,
					next: null
				};
				D === null ? C = D = O : D = D.next = O, x = x.next;
			} while (x !== null);
			D === null ? C = D = _ : D = D.next = _;
		} else C = D = _;
		x = {
			baseState: S.baseState,
			firstBaseUpdate: C,
			lastBaseUpdate: D,
			shared: S.shared,
			callbacks: S.callbacks
		}, m.updateQueue = x;
		return;
	}
	(m = x.lastBaseUpdate) === null ? x.firstBaseUpdate = _ : m.next = _, x.lastBaseUpdate = _;
}
var wu = !1;
function cr() {
	if (wu && mu !== null) throw mu;
}
function dr(m, _, x, S) {
	wu = !1;
	var C = m.updateQueue;
	Cu = !1;
	var D = C.firstBaseUpdate, O = C.lastBaseUpdate, F = C.shared.pending;
	if (F !== null) {
		C.shared.pending = null;
		var I = F, L = I.next;
		I.next = null, O === null ? D = L : O.next = L, O = I;
		var H = m.alternate;
		H !== null && (F = (H = H.updateQueue).lastBaseUpdate) !== O && (F === null ? H.firstBaseUpdate = L : F.next = L, H.lastBaseUpdate = I);
	}
	if (D !== null) {
		var U = C.baseState;
		for (O = 0, H = L = I = null, F = D;;) {
			var W = -536870913 & F.lane, q = W !== F.lane;
			if (q ? (wf & W) === W : (S & W) === W) {
				W !== 0 && W === pu && (wu = !0), H !== null && (H = H.next = {
					lane: 0,
					tag: F.tag,
					payload: F.payload,
					callback: null,
					next: null
				});
				A: {
					var ee = m, te = F;
					W = _;
					var J = x;
					switch (te.tag) {
						case 1:
							if (typeof (ee = te.payload) == "function") {
								U = ee.call(J, U, W);
								break A;
							}
							U = ee;
							break A;
						case 3: ee.flags = -65537 & ee.flags | 128;
						case 0:
							if ((W = typeof (ee = te.payload) == "function" ? ee.call(J, U, W) : ee) == null) break A;
							U = zt({}, U, W);
							break A;
						case 2: Cu = !0;
					}
				}
				(W = F.callback) !== null && (m.flags |= 64, q && (m.flags |= 8192), (q = C.callbacks) === null ? C.callbacks = [W] : q.push(W));
			} else q = {
				lane: W,
				tag: F.tag,
				payload: F.payload,
				callback: F.callback,
				next: null
			}, H === null ? (L = H = q, I = U) : H = H.next = q, O |= W;
			if ((F = F.next) === null) {
				if ((F = C.shared.pending) === null) break;
				F = (q = F).next, q.next = null, C.lastBaseUpdate = q, C.shared.pending = null;
			}
		}
		H === null && (I = U), C.baseState = I, C.firstBaseUpdate = L, C.lastBaseUpdate = H, D === null && (C.shared.lanes = 0), Pf |= O, m.lanes = O, m.memoizedState = U;
	}
}
function gr(m, _) {
	if (typeof m != "function") throw Error(oA(191, m));
	m.call(_);
}
function pr(m, _) {
	var x = m.callbacks;
	if (x !== null) for (m.callbacks = null, m = 0; m < x.length; m++) gr(x[m], _);
}
var Tu = zA(null), Eu = zA(0);
function fr(m, _) {
	PA(Eu, m = Mf), PA(Tu, _), Mf = m | _.baseLanes;
}
function Er() {
	PA(Eu, Mf), PA(Tu, Tu.current);
}
function wr() {
	Mf = Eu.current, KA(Tu), KA(Eu);
}
var Du = 0, ku = null, Mu = null, Nu = null, Iu = !1, Lu = !1, Bu = !1, Uu = 0, Qu = 0, nd = null, ad = 0;
function Nr() {
	throw Error(oA(321));
}
function Tr(m, _) {
	if (_ === null) return !1;
	for (var x = 0; x < _.length && x < m.length; x++) if (!ao(m[x], _[x])) return !1;
	return !0;
}
function Qr(m, _, x, S, C, D) {
	return Du = D, ku = _, _.memoizedState = null, _.updateQueue = null, _.lanes = 0, dn.H = m === null || m.memoizedState === null ? cd : ud, Bu = !1, D = x(S, C), Bu = !1, Lu && (D = Dr(_, x, S, C)), Lr(m), D;
}
function Lr(m) {
	dn.H = sd;
	var _ = Mu !== null && Mu.next !== null;
	if (Du = 0, Nu = Mu = ku = null, Iu = !1, Qu = 0, nd = null, _) throw Error(oA(300));
	m === null || ef || (m = m.dependencies) !== null && Ci(m) && (ef = !0);
}
function Dr(m, _, x, S) {
	ku = m;
	var C = 0;
	do {
		if (Lu && (nd = null), Qu = 0, Lu = !1, 25 <= C) throw Error(oA(301));
		if (C += 1, Nu = Mu = null, m.updateQueue != null) {
			var D = m.updateQueue;
			D.lastEffect = null, D.events = null, D.stores = null, D.memoCache != null && (D.memoCache.index = 0);
		}
		dn.H = dd, D = _(x, S);
	} while (Lu);
	return D;
}
function Or() {
	var m = dn.H, _ = m.useState()[0];
	return _ = typeof _.then == "function" ? Kr(_) : _, m = m.useState()[0], (Mu === null ? null : Mu.memoizedState) !== m && (ku.flags |= 1024), _;
}
function Vr() {
	var m = Uu !== 0;
	return Uu = 0, m;
}
function Rr(m, _, x) {
	_.updateQueue = m.updateQueue, _.flags &= -2053, m.lanes &= ~x;
}
function Fr(m) {
	if (Iu) {
		for (m = m.memoizedState; m !== null;) {
			var _ = m.queue;
			_ !== null && (_.pending = null), m = m.next;
		}
		Iu = !1;
	}
	Du = 0, Nu = Mu = ku = null, Lu = !1, Qu = Uu = 0, nd = null;
}
function Gr() {
	var m = {
		memoizedState: null,
		baseState: null,
		baseQueue: null,
		queue: null,
		next: null
	};
	return Nu === null ? ku.memoizedState = Nu = m : Nu = Nu.next = m, Nu;
}
function zr() {
	if (Mu === null) {
		var m = ku.alternate;
		m = m === null ? null : m.memoizedState;
	} else m = Mu.next;
	var _ = Nu === null ? ku.memoizedState : Nu.next;
	if (_ !== null) Nu = _, Mu = m;
	else {
		if (m === null) throw ku.alternate === null ? Error(oA(467)) : Error(oA(310));
		m = {
			memoizedState: (Mu = m).memoizedState,
			baseState: Mu.baseState,
			baseQueue: Mu.baseQueue,
			queue: Mu.queue,
			next: null
		}, Nu === null ? ku.memoizedState = Nu = m : Nu = Nu.next = m;
	}
	return Nu;
}
function Kr(m) {
	var _ = Qu;
	return Qu += 1, nd === null && (nd = []), m = $i(nd, m, _), _ = ku, (Nu === null ? _.memoizedState : Nu.next) === null && (_ = _.alternate, dn.H = _ === null || _.memoizedState === null ? cd : ud), m;
}
function Pr(m) {
	if (typeof m == "object" && m) {
		if (typeof m.then == "function") return Kr(m);
		if (m.$$typeof === $t) return Bi(m);
	}
	throw Error(oA(438, String(m)));
}
function Yr(m) {
	var _ = null, x = ku.updateQueue;
	if (x !== null && (_ = x.memoCache), _ == null) {
		var S = ku.alternate;
		S !== null && (S = S.updateQueue) !== null && (S = S.memoCache) != null && (_ = {
			data: S.data.map(function(m) {
				return m.slice();
			}),
			index: 0
		});
	}
	if (_ ??= {
		data: [],
		index: 0
	}, x === null && (x = {
		lastEffect: null,
		events: null,
		stores: null,
		memoCache: null
	}, ku.updateQueue = x), x.memoCache = _, (x = _.data[_.index]) === void 0) for (x = _.data[_.index] = Array(m), S = 0; S < m; S++) x[S] = sn;
	return _.index++, x;
}
function Hr(m, _) {
	return typeof _ == "function" ? _(m) : _;
}
function jr(m) {
	return _r(zr(), Mu, m);
}
function _r(m, _, x) {
	var S = m.queue;
	if (S === null) throw Error(oA(311));
	S.lastRenderedReducer = x;
	var C = m.baseQueue, D = S.pending;
	if (D !== null) {
		if (C !== null) {
			var O = C.next;
			C.next = D.next, D.next = O;
		}
		_.baseQueue = C = D, S.pending = null;
	}
	if (D = m.baseState, C === null) m.memoizedState = D;
	else {
		var F = O = null, I = null, L = _ = C.next, H = !1;
		do {
			var U = -536870913 & L.lane;
			if (U === L.lane ? (Du & U) === U : (wf & U) === U) {
				var W = L.revertLane;
				if (W === 0) I !== null && (I = I.next = {
					lane: 0,
					revertLane: 0,
					action: L.action,
					hasEagerState: L.hasEagerState,
					eagerState: L.eagerState,
					next: null
				}), U === pu && (H = !0);
				else {
					if ((Du & W) === W) {
						L = L.next, W === pu && (H = !0);
						continue;
					}
					U = {
						lane: 0,
						revertLane: L.revertLane,
						action: L.action,
						hasEagerState: L.hasEagerState,
						eagerState: L.eagerState,
						next: null
					}, I === null ? (F = I = U, O = D) : I = I.next = U, ku.lanes |= W, Pf |= W;
				}
				U = L.action, Bu && x(D, U), D = L.hasEagerState ? L.eagerState : x(D, U);
			} else W = {
				lane: U,
				revertLane: L.revertLane,
				action: L.action,
				hasEagerState: L.hasEagerState,
				eagerState: L.eagerState,
				next: null
			}, I === null ? (F = I = W, O = D) : I = I.next = W, ku.lanes |= U, Pf |= U;
			L = L.next;
		} while (L !== null && L !== _);
		if (I === null ? O = D : I.next = F, !ao(D, m.memoizedState) && (ef = !0, H && (x = mu) !== null)) throw x;
		m.memoizedState = D, m.baseState = O, m.baseQueue = I, S.lastRenderedState = D;
	}
	return C === null && (S.lanes = 0), [m.memoizedState, S.dispatch];
}
function Jr(m) {
	var _ = zr(), x = _.queue;
	if (x === null) throw Error(oA(311));
	x.lastRenderedReducer = m;
	var S = x.dispatch, C = x.pending, D = _.memoizedState;
	if (C !== null) {
		x.pending = null;
		var O = C = C.next;
		do
			D = m(D, O.action), O = O.next;
		while (O !== C);
		ao(D, _.memoizedState) || (ef = !0), _.memoizedState = D, _.baseQueue === null && (_.baseState = D), x.lastRenderedState = D;
	}
	return [D, S];
}
function qr(m, _, x) {
	var S = ku, C = zr(), D = Zl;
	if (D) {
		if (x === void 0) throw Error(oA(407));
		x = x();
	} else x = _();
	var O = !ao((Mu || C).memoizedState, x);
	if (O && (C.memoizedState = x, ef = !0), C = C.queue, El(2048, 8, Xr.bind(null, S, C, m), [m]), C.getSnapshot !== _ || O || Nu !== null && 1 & Nu.memoizedState.tag) {
		if (S.flags |= 2048, hl(9, {
			destroy: void 0,
			resource: void 0
		}, Zr.bind(null, S, C, x, _), null), Sf === null) throw Error(oA(349));
		D || 124 & Du || Wr(S, _, x);
	}
	return x;
}
function Wr(m, _, x) {
	m.flags |= 16384, m = {
		getSnapshot: _,
		value: x
	}, (_ = ku.updateQueue) === null ? (_ = {
		lastEffect: null,
		events: null,
		stores: null,
		memoCache: null
	}, ku.updateQueue = _, _.stores = [m]) : (x = _.stores) === null ? _.stores = [m] : x.push(m);
}
function Zr(m, _, x, S) {
	_.value = x, _.getSnapshot = S, $r(_) && Al(m);
}
function Xr(m, _, x) {
	return x(function() {
		$r(_) && Al(m);
	});
}
function $r(m) {
	var _ = m.getSnapshot;
	m = m.value;
	try {
		var x = _();
		return !ao(m, x);
	} catch {
		return !0;
	}
}
function Al(m) {
	var _ = Qa(m, 2);
	_ !== null && Ru(_, 0, 2);
}
function el$3(m) {
	var _ = Gr();
	if (typeof m == "function") {
		var x = m;
		if (m = x(), Bu) {
			pe(!0);
			try {
				x();
			} finally {
				pe(!1);
			}
		}
	}
	return _.memoizedState = _.baseState = m, _.queue = {
		pending: null,
		lanes: 0,
		dispatch: null,
		lastRenderedReducer: Hr,
		lastRenderedState: m
	}, _;
}
_(el$3, "el");
function tl(m, _, x, S) {
	return m.baseState = x, _r(m, Mu, typeof S == "function" ? S : Hr);
}
function nl(m, _, x, S, C) {
	if (Pl(m)) throw Error(oA(485));
	if ((m = _.action) !== null) {
		var D = {
			payload: C,
			action: m,
			next: null,
			isTransition: !0,
			status: "pending",
			value: null,
			reason: null,
			listeners: [],
			then: function(m) {
				D.listeners.push(m);
			}
		};
		dn.T === null ? D.isTransition = !1 : x(!0), S(D), (x = _.pending) === null ? (D.next = _.pending = D, al(_, D)) : (D.next = x.next, _.pending = x.next = D);
	}
}
function al(m, _) {
	var x = _.action, S = _.payload, C = m.state;
	if (_.isTransition) {
		var D = dn.T, O = {};
		dn.T = O;
		try {
			var F = x(C, S), I = dn.S;
			I !== null && I(O, F), il(m, _, F);
		} catch (x) {
			ll(m, _, x);
		} finally {
			dn.T = D;
		}
	} else try {
		il(m, _, D = x(C, S));
	} catch (x) {
		ll(m, _, x);
	}
}
function il(m, _, x) {
	typeof x == "object" && x && typeof x.then == "function" ? x.then(function(x) {
		rl(m, _, x);
	}, function(x) {
		return ll(m, _, x);
	}) : rl(m, _, x);
}
function rl(m, _, x) {
	_.status = "fulfilled", _.value = x, ol(_), m.state = x, (_ = m.pending) !== null && ((x = _.next) === _ ? m.pending = null : (x = x.next, _.next = x, al(m, x)));
}
function ll(m, _, x) {
	var S = m.pending;
	if (m.pending = null, S !== null) {
		S = S.next;
		do
			_.status = "rejected", _.reason = x, ol(_), _ = _.next;
		while (_ !== S);
	}
	m.action = null;
}
function ol(m) {
	m = m.listeners;
	for (var _ = 0; _ < m.length; _++) (0, m[_])();
}
function sl(m, _) {
	return _;
}
function ul(m, _) {
	if (Zl) {
		var x = Sf.formState;
		if (x !== null) {
			A: {
				var S = ku;
				if (Zl) {
					if (Jl) {
						e: {
							for (var C = Jl, D = nu; C.nodeType !== 8;) {
								if (!D) {
									C = null;
									break e;
								}
								if ((C = wd(C.nextSibling)) === null) {
									C = null;
									break e;
								}
							}
							C = (D = C.data) === "F!" || D === "F" ? C : null;
						}
						if (C) {
							Jl = wd(C.nextSibling), S = C.data === "F!";
							break A;
						}
					}
					ci(S);
				}
				S = !1;
			}
			S && (_ = x[0]);
		}
	}
	return (x = Gr()).memoizedState = x.baseState = _, S = {
		pending: null,
		lanes: 0,
		dispatch: null,
		lastRenderedReducer: sl,
		lastRenderedState: _
	}, x.queue = S, x = Gl.bind(null, ku, S), S.dispatch = x, S = el$3(!1), D = Kl.bind(null, ku, !1, S.queue), C = {
		state: _,
		dispatch: null,
		action: m,
		pending: null
	}, (S = Gr()).queue = C, x = nl.bind(null, ku, C, D, x), C.dispatch = x, S.memoizedState = m, [
		_,
		x,
		!1
	];
}
function cl(m) {
	return dl(zr(), Mu, m);
}
function dl(m, _, x) {
	if (_ = _r(m, _, sl)[0], m = jr(Hr)[0], typeof _ == "object" && _ && typeof _.then == "function") try {
		var S = Kr(_);
	} catch (m) {
		throw m === vu ? bu : m;
	}
	else S = _;
	var C = (_ = zr()).queue, D = C.dispatch;
	return x !== _.memoizedState && (ku.flags |= 2048, hl(9, {
		destroy: void 0,
		resource: void 0
	}, gl.bind(null, C, x), null)), [
		S,
		D,
		m
	];
}
function gl(m, _) {
	m.action = _;
}
function pl(m) {
	var _ = zr(), x = Mu;
	if (x !== null) return dl(_, x, m);
	zr(), _ = _.memoizedState;
	var S = (x = zr()).queue.dispatch;
	return x.memoizedState = m, [
		_,
		S,
		!1
	];
}
function hl(m, _, x, S) {
	return m = {
		tag: m,
		create: x,
		deps: S,
		inst: _,
		next: null
	}, (_ = ku.updateQueue) === null && (_ = {
		lastEffect: null,
		events: null,
		stores: null,
		memoCache: null
	}, ku.updateQueue = _), (x = _.lastEffect) === null ? _.lastEffect = m.next = m : (S = x.next, x.next = m, m.next = S, _.lastEffect = m), m;
}
function ml() {
	return zr().memoizedState;
}
function fl(m, _, x, S) {
	var C = Gr();
	S = S === void 0 ? null : S, ku.flags |= m, C.memoizedState = hl(1 | _, {
		destroy: void 0,
		resource: void 0
	}, x, S);
}
function El(m, _, x, S) {
	var C = zr();
	S = S === void 0 ? null : S;
	var D = C.memoizedState.inst;
	Mu !== null && S !== null && Tr(S, Mu.memoizedState.deps) ? C.memoizedState = hl(_, D, x, S) : (ku.flags |= m, C.memoizedState = hl(1 | _, D, x, S));
}
function wl(m, _) {
	fl(8390656, 8, m, _);
}
function bl(m, _) {
	El(2048, 8, m, _);
}
function kl(m, _) {
	return El(4, 2, m, _);
}
function yl(m, _) {
	return El(4, 4, m, _);
}
function Sl(m, _) {
	if (typeof _ == "function") {
		m = m();
		var x = _(m);
		return function() {
			typeof x == "function" ? x() : _(null);
		};
	}
	if (_ != null) return m = m(), _.current = m, function() {
		_.current = null;
	};
}
function Il(m, _, x) {
	x = x == null ? null : x.concat([m]), El(4, 4, Sl.bind(null, _, m), x);
}
function Ul() {}
function Cl(m, _) {
	var x = zr();
	_ = _ === void 0 ? null : _;
	var S = x.memoizedState;
	return _ !== null && Tr(_, S[1]) ? S[0] : (x.memoizedState = [m, _], m);
}
function vl(m, _) {
	var x = zr();
	_ = _ === void 0 ? null : _;
	var S = x.memoizedState;
	if (_ !== null && Tr(_, S[1])) return S[0];
	if (S = m(), Bu) {
		pe(!0);
		try {
			m();
		} finally {
			pe(!1);
		}
	}
	return x.memoizedState = [S, _], S;
}
function Bl(m, _, x) {
	return x === void 0 || 1073741824 & Du ? m.memoizedState = _ : (m.memoizedState = x, m = Vu(), ku.lanes |= m, Pf |= m, x);
}
function xl(m, _, x, S) {
	return ao(x, _) ? x : Tu.current === null ? 42 & Du ? (m = Vu(), ku.lanes |= m, Pf |= m, _) : (ef = !0, m.memoizedState = x) : (m = Bl(m, x, S), ao(m, _) || (ef = !0), m);
}
function Ml(m, _, x, S, C) {
	var D = fn.p;
	fn.p = D !== 0 && 8 > D ? D : 8;
	var O, F, I, L = dn.T, H = {};
	dn.T = H, Kl(m, !1, _, x);
	try {
		var U = C(), W = dn.S;
		W !== null && W(H, U), typeof U == "object" && U && typeof U.then == "function" ? zl(m, _, (O = S, F = [], I = {
			status: "pending",
			value: null,
			reason: null,
			then: function(m) {
				F.push(m);
			}
		}, U.then(function() {
			I.status = "fulfilled", I.value = O;
			for (var m = 0; m < F.length; m++) (0, F[m])(O);
		}, function(m) {
			for (I.status = "rejected", I.reason = m, m = 0; m < F.length; m++) (0, F[m])(void 0);
		}), I), Ou()) : zl(m, _, S, Ou());
	} catch (x) {
		zl(m, _, {
			then: function() {},
			status: "rejected",
			reason: x
		}, Ou());
	} finally {
		fn.p = D, dn.T = L;
	}
}
function Nl() {}
function Tl(m, _, x, S) {
	if (m.tag !== 5) throw Error(oA(476));
	var C = Ql(m).queue;
	Ml(m, C, _, pn, x === null ? Nl : function() {
		return Ll(m), x(S);
	});
}
function Ql(m) {
	var _ = m.memoizedState;
	if (_ !== null) return _;
	var x = {};
	return (_ = {
		memoizedState: pn,
		baseState: pn,
		baseQueue: null,
		queue: {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Hr,
			lastRenderedState: pn
		},
		next: null
	}).next = {
		memoizedState: x,
		baseState: x,
		baseQueue: null,
		queue: {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Hr,
			lastRenderedState: x
		},
		next: null
	}, m.memoizedState = _, (m = m.alternate) !== null && (m.memoizedState = _), _;
}
function Ll(m) {
	zl(m, Ql(m).next.queue, {}, Ou());
}
function Dl() {
	return Bi(qp);
}
function Ol() {
	return zr().memoizedState;
}
function Vl() {
	return zr().memoizedState;
}
function Rl(m) {
	for (var _ = m.return; _ !== null;) {
		switch (_.tag) {
			case 24:
			case 3:
				var x = Ou(), S = lr(_, m = rr(x), x);
				S !== null && (Ru(S, 0, x), or(S, _, x)), _ = { cache: Di() }, m.payload = _;
				return;
		}
		_ = _.return;
	}
}
function Fl(m, _, x) {
	var S = Ou();
	x = {
		lane: S,
		revertLane: 0,
		action: x,
		hasEagerState: !1,
		eagerState: null,
		next: null
	}, Pl(m) ? Yl(_, x) : (x = Ta(m, _, x, S)) !== null && (Ru(x, 0, S), Hl(x, _, S));
}
function Gl(m, _, x) {
	zl(m, _, x, Ou());
}
function zl(m, _, x, S) {
	var C = {
		lane: S,
		revertLane: 0,
		action: x,
		hasEagerState: !1,
		eagerState: null,
		next: null
	};
	if (Pl(m)) Yl(_, C);
	else {
		var D = m.alternate;
		if (m.lanes === 0 && (D === null || D.lanes === 0) && (D = _.lastRenderedReducer) !== null) try {
			var O = _.lastRenderedState, F = D(O, x);
			if (C.hasEagerState = !0, C.eagerState = F, ao(F, O)) return Na(m, _, C, 0), Sf === null && Ma(), !1;
		} catch {}
		if ((x = Ta(m, _, C, S)) !== null) return Ru(x, 0, S), Hl(x, _, S), !0;
	}
	return !1;
}
function Kl(m, _, x, S) {
	if (S = {
		lane: 2,
		revertLane: Nc(),
		action: S,
		hasEagerState: !1,
		eagerState: null,
		next: null
	}, Pl(m)) {
		if (_) throw Error(oA(479));
	} else (_ = Ta(m, x, S, 2)) !== null && Ru(_, 0, 2);
}
function Pl(m) {
	var _ = m.alternate;
	return m === ku || _ !== null && _ === ku;
}
function Yl(m, _) {
	Lu = Iu = !0;
	var x = m.pending;
	x === null ? _.next = _ : (_.next = x.next, x.next = _), m.pending = _;
}
function Hl(m, _, x) {
	if (4194048 & x) {
		var S = _.lanes;
		x |= S &= m.pendingLanes, _.lanes = x, xe(m, x);
	}
}
var sd = {
	readContext: Bi,
	use: Pr,
	useCallback: Nr,
	useContext: Nr,
	useEffect: Nr,
	useImperativeHandle: Nr,
	useLayoutEffect: Nr,
	useInsertionEffect: Nr,
	useMemo: Nr,
	useReducer: Nr,
	useRef: Nr,
	useState: Nr,
	useDebugValue: Nr,
	useDeferredValue: Nr,
	useTransition: Nr,
	useSyncExternalStore: Nr,
	useId: Nr,
	useHostTransitionStatus: Nr,
	useFormState: Nr,
	useActionState: Nr,
	useOptimistic: Nr,
	useMemoCache: Nr,
	useCacheRefresh: Nr
}, cd = {
	readContext: Bi,
	use: Pr,
	useCallback: function(m, _) {
		return Gr().memoizedState = [m, _ === void 0 ? null : _], m;
	},
	useContext: Bi,
	useEffect: wl,
	useImperativeHandle: function(m, _, x) {
		x = x == null ? null : x.concat([m]), fl(4194308, 4, Sl.bind(null, _, m), x);
	},
	useLayoutEffect: function(m, _) {
		return fl(4194308, 4, m, _);
	},
	useInsertionEffect: function(m, _) {
		fl(4, 2, m, _);
	},
	useMemo: function(m, _) {
		var x = Gr();
		_ = _ === void 0 ? null : _;
		var S = m();
		if (Bu) {
			pe(!0);
			try {
				m();
			} finally {
				pe(!1);
			}
		}
		return x.memoizedState = [S, _], S;
	},
	useReducer: function(m, _, x) {
		var S = Gr();
		if (x !== void 0) {
			var C = x(_);
			if (Bu) {
				pe(!0);
				try {
					x(_);
				} finally {
					pe(!1);
				}
			}
		} else C = _;
		return S.memoizedState = S.baseState = C, m = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: m,
			lastRenderedState: C
		}, S.queue = m, m = m.dispatch = Fl.bind(null, ku, m), [S.memoizedState, m];
	},
	useRef: function(m) {
		return m = { current: m }, Gr().memoizedState = m;
	},
	useState: function(m) {
		var _ = (m = el$3(m)).queue, x = Gl.bind(null, ku, _);
		return _.dispatch = x, [m.memoizedState, x];
	},
	useDebugValue: Ul,
	useDeferredValue: function(m, _) {
		return Bl(Gr(), m, _);
	},
	useTransition: function() {
		var m = el$3(!1);
		return m = Ml.bind(null, ku, m.queue, !0, !1), Gr().memoizedState = m, [!1, m];
	},
	useSyncExternalStore: function(m, _, x) {
		var S = ku, C = Gr();
		if (Zl) {
			if (x === void 0) throw Error(oA(407));
			x = x();
		} else {
			if (x = _(), Sf === null) throw Error(oA(349));
			124 & wf || Wr(S, _, x);
		}
		C.memoizedState = x;
		var D = {
			value: x,
			getSnapshot: _
		};
		return C.queue = D, wl(Xr.bind(null, S, D, m), [m]), S.flags |= 2048, hl(9, {
			destroy: void 0,
			resource: void 0
		}, Zr.bind(null, S, D, x, _), null), x;
	},
	useId: function() {
		var m = Gr(), _ = Sf.identifierPrefix;
		if (Zl) {
			var x = Wl;
			_ = "«" + _ + "R" + (x = (jl & ~(1 << 32 - Qn(jl) - 1)).toString(32) + x), 0 < (x = Uu++) && (_ += "H" + x.toString(32)), _ += "»";
		} else _ = "«" + _ + "r" + (x = ad++).toString(32) + "»";
		return m.memoizedState = _;
	},
	useHostTransitionStatus: Dl,
	useFormState: ul,
	useActionState: ul,
	useOptimistic: function(m) {
		var _ = Gr();
		_.memoizedState = _.baseState = m;
		var x = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: null,
			lastRenderedState: null
		};
		return _.queue = x, _ = Kl.bind(null, ku, !0, x), x.dispatch = _, [m, _];
	},
	useMemoCache: Yr,
	useCacheRefresh: function() {
		return Gr().memoizedState = Rl.bind(null, ku);
	}
}, ud = {
	readContext: Bi,
	use: Pr,
	useCallback: Cl,
	useContext: Bi,
	useEffect: bl,
	useImperativeHandle: Il,
	useInsertionEffect: kl,
	useLayoutEffect: yl,
	useMemo: vl,
	useReducer: jr,
	useRef: ml,
	useState: function() {
		return jr(Hr);
	},
	useDebugValue: Ul,
	useDeferredValue: function(m, _) {
		return xl(zr(), Mu.memoizedState, m, _);
	},
	useTransition: function() {
		var m = jr(Hr)[0], _ = zr().memoizedState;
		return [typeof m == "boolean" ? m : Kr(m), _];
	},
	useSyncExternalStore: qr,
	useId: Ol,
	useHostTransitionStatus: Dl,
	useFormState: cl,
	useActionState: cl,
	useOptimistic: function(m, _) {
		return tl(zr(), 0, m, _);
	},
	useMemoCache: Yr,
	useCacheRefresh: Vl
}, dd = {
	readContext: Bi,
	use: Pr,
	useCallback: Cl,
	useContext: Bi,
	useEffect: bl,
	useImperativeHandle: Il,
	useInsertionEffect: kl,
	useLayoutEffect: yl,
	useMemo: vl,
	useReducer: Jr,
	useRef: ml,
	useState: function() {
		return Jr(Hr);
	},
	useDebugValue: Ul,
	useDeferredValue: function(m, _) {
		var x = zr();
		return Mu === null ? Bl(x, m, _) : xl(x, Mu.memoizedState, m, _);
	},
	useTransition: function() {
		var m = Jr(Hr)[0], _ = zr().memoizedState;
		return [typeof m == "boolean" ? m : Kr(m), _];
	},
	useSyncExternalStore: qr,
	useId: Ol,
	useHostTransitionStatus: Dl,
	useFormState: pl,
	useActionState: pl,
	useOptimistic: function(m, _) {
		var x = zr();
		return Mu === null ? (x.baseState = m, [m, x.queue.dispatch]) : tl(x, 0, m, _);
	},
	useMemoCache: Yr,
	useCacheRefresh: Vl
}, gd = null, _d = 0;
function Xl(m) {
	var _ = _d;
	return _d += 1, gd === null && (gd = []), $i(gd, m, _);
}
function $l(m, _) {
	_ = _.props.ref, m.ref = _ === void 0 ? null : _;
}
function Ao(m, _) {
	throw _.$$typeof === Vt ? Error(oA(525)) : (m = Object.prototype.toString.call(_), Error(oA(31, m === "[object Object]" ? "object with keys {" + Object.keys(_).join(", ") + "}" : m)));
}
function eo(m) {
	return (0, m._init)(m._payload);
}
function to(m) {
	function e(_, x) {
		if (m) {
			var S = _.deletions;
			S === null ? (_.deletions = [x], _.flags |= 16) : S.push(x);
		}
	}
	function t(_, x) {
		if (!m) return null;
		for (; x !== null;) e(_, x), x = x.sibling;
		return null;
	}
	function n(m) {
		for (var _ = /* @__PURE__ */ new Map(); m !== null;) m.key === null ? _.set(m.index, m) : _.set(m.key, m), m = m.sibling;
		return _;
	}
	function a(m, _) {
		return (m = Ga(m, _)).index = 0, m.sibling = null, m;
	}
	function i(_, x, S) {
		return _.index = S, m ? (S = _.alternate) === null || (S = S.index) < x ? (_.flags |= 67108866, x) : S : (_.flags |= 1048576, x);
	}
	function r(_) {
		return m && _.alternate === null && (_.flags |= 67108866), _;
	}
	function l(m, _, x, S) {
		return _ === null || _.tag !== 6 ? ((_ = Ya(x, m.mode, S)).return = m, _) : ((_ = a(_, x)).return = m, _);
	}
	function o(m, _, x, S) {
		var C = x.type;
		return C === Gt ? u(m, _, x.props.children, S, x.key) : _ !== null && (_.elementType === C || typeof C == "object" && C && C.$$typeof === an && eo(C) === _.type) ? ($l(_ = a(_, x.props), x), _.return = m, _) : ($l(_ = Ka(x.type, x.key, x.props, null, m.mode, S), x), _.return = m, _);
	}
	function s(m, _, x, S) {
		return _ === null || _.tag !== 4 || _.stateNode.containerInfo !== x.containerInfo || _.stateNode.implementation !== x.implementation ? ((_ = Ha(x, m.mode, S)).return = m, _) : ((_ = a(_, x.children || [])).return = m, _);
	}
	function u(m, _, x, S, C) {
		return _ === null || _.tag !== 7 ? ((_ = Pa(x, m.mode, S, C)).return = m, _) : ((_ = a(_, x)).return = m, _);
	}
	function c(m, _, x) {
		if (typeof _ == "string" && _ !== "" || typeof _ == "number" || typeof _ == "bigint") return (_ = Ya("" + _, m.mode, x)).return = m, _;
		if (typeof _ == "object" && _) {
			switch (_.$$typeof) {
				case Ht: return $l(x = Ka(_.type, _.key, _.props, null, m.mode, x), _), x.return = m, x;
				case Ut: return (_ = Ha(_, m.mode, x)).return = m, _;
				case an: return c(m, _ = (0, _._init)(_._payload), x);
			}
			if (un(_) || TA(_)) return (_ = Pa(_, m.mode, x, null)).return = m, _;
			if (typeof _.then == "function") return c(m, Xl(_), x);
			if (_.$$typeof === $t) return c(m, xi(m, _), x);
			Ao(m, _);
		}
		return null;
	}
	function d(m, _, x, S) {
		var C = _ === null ? null : _.key;
		if (typeof x == "string" && x !== "" || typeof x == "number" || typeof x == "bigint") return C === null ? l(m, _, "" + x, S) : null;
		if (typeof x == "object" && x) {
			switch (x.$$typeof) {
				case Ht: return x.key === C ? o(m, _, x, S) : null;
				case Ut: return x.key === C ? s(m, _, x, S) : null;
				case an: return d(m, _, x = (C = x._init)(x._payload), S);
			}
			if (un(x) || TA(x)) return C === null ? u(m, _, x, S, null) : null;
			if (typeof x.then == "function") return d(m, _, Xl(x), S);
			if (x.$$typeof === $t) return d(m, _, xi(m, x), S);
			Ao(m, x);
		}
		return null;
	}
	function g(m, _, x, S, C) {
		if (typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint") return l(_, m = m.get(x) || null, "" + S, C);
		if (typeof S == "object" && S) {
			switch (S.$$typeof) {
				case Ht: return o(_, m = m.get(S.key === null ? x : S.key) || null, S, C);
				case Ut: return s(_, m = m.get(S.key === null ? x : S.key) || null, S, C);
				case an: return g(m, _, x, S = (0, S._init)(S._payload), C);
			}
			if (un(S) || TA(S)) return u(_, m = m.get(x) || null, S, C, null);
			if (typeof S.then == "function") return g(m, _, x, Xl(S), C);
			if (S.$$typeof === $t) return g(m, _, x, xi(_, S), C);
			Ao(_, S);
		}
		return null;
	}
	function p(_, x, S, C) {
		if (typeof S == "object" && S && S.type === Gt && S.key === null && (S = S.props.children), typeof S == "object" && S) {
			switch (S.$$typeof) {
				case Ht:
					A: {
						for (var D = S.key; x !== null;) {
							if (x.key === D) {
								if ((D = S.type) === Gt) {
									if (x.tag === 7) {
										t(_, x.sibling), (C = a(x, S.props.children)).return = _, _ = C;
										break A;
									}
								} else if (x.elementType === D || typeof D == "object" && D && D.$$typeof === an && eo(D) === x.type) {
									t(_, x.sibling), $l(C = a(x, S.props), S), C.return = _, _ = C;
									break A;
								}
								t(_, x);
								break;
							}
							e(_, x), x = x.sibling;
						}
						S.type === Gt ? ((C = Pa(S.props.children, _.mode, C, S.key)).return = _, _ = C) : ($l(C = Ka(S.type, S.key, S.props, null, _.mode, C), S), C.return = _, _ = C);
					}
					return r(_);
				case Ut:
					A: {
						for (D = S.key; x !== null;) {
							if (x.key === D) {
								if (x.tag === 4 && x.stateNode.containerInfo === S.containerInfo && x.stateNode.implementation === S.implementation) {
									t(_, x.sibling), (C = a(x, S.children || [])).return = _, _ = C;
									break A;
								}
								t(_, x);
								break;
							}
							e(_, x), x = x.sibling;
						}
						(C = Ha(S, _.mode, C)).return = _, _ = C;
					}
					return r(_);
				case an: return p(_, x, S = (D = S._init)(S._payload), C);
			}
			if (un(S)) return function(_, x, S, C) {
				for (var D = null, O = null, F = x, I = x = 0, L = null; F !== null && I < S.length; I++) {
					F.index > I ? (L = F, F = null) : L = F.sibling;
					var H = d(_, F, S[I], C);
					if (H === null) {
						F === null && (F = L);
						break;
					}
					m && F && H.alternate === null && e(_, F), x = i(H, x, I), O === null ? D = H : O.sibling = H, O = H, F = L;
				}
				if (I === S.length) return t(_, F), Zl && ei(_, I), D;
				if (F === null) {
					for (; I < S.length; I++) (F = c(_, S[I], C)) !== null && (x = i(F, x, I), O === null ? D = F : O.sibling = F, O = F);
					return Zl && ei(_, I), D;
				}
				for (F = n(F); I < S.length; I++) (L = g(F, _, I, S[I], C)) !== null && (m && L.alternate !== null && F.delete(L.key === null ? I : L.key), x = i(L, x, I), O === null ? D = L : O.sibling = L, O = L);
				return m && F.forEach(function(m) {
					return e(_, m);
				}), Zl && ei(_, I), D;
			}(_, x, S, C);
			if (TA(S)) {
				if (typeof (D = TA(S)) != "function") throw Error(oA(150));
				return function(_, x, S, C) {
					if (S == null) throw Error(oA(151));
					for (var D = null, O = null, F = x, I = x = 0, L = null, H = S.next(); F !== null && !H.done; I++, H = S.next()) {
						F.index > I ? (L = F, F = null) : L = F.sibling;
						var U = d(_, F, H.value, C);
						if (U === null) {
							F === null && (F = L);
							break;
						}
						m && F && U.alternate === null && e(_, F), x = i(U, x, I), O === null ? D = U : O.sibling = U, O = U, F = L;
					}
					if (H.done) return t(_, F), Zl && ei(_, I), D;
					if (F === null) {
						for (; !H.done; I++, H = S.next()) (H = c(_, H.value, C)) !== null && (x = i(H, x, I), O === null ? D = H : O.sibling = H, O = H);
						return Zl && ei(_, I), D;
					}
					for (F = n(F); !H.done; I++, H = S.next()) (H = g(F, _, I, H.value, C)) !== null && (m && H.alternate !== null && F.delete(H.key === null ? I : H.key), x = i(H, x, I), O === null ? D = H : O.sibling = H, O = H);
					return m && F.forEach(function(m) {
						return e(_, m);
					}), Zl && ei(_, I), D;
				}(_, x, S = D.call(S), C);
			}
			if (typeof S.then == "function") return p(_, x, Xl(S), C);
			if (S.$$typeof === $t) return p(_, x, xi(_, S), C);
			Ao(_, S);
		}
		return typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint" ? (S = "" + S, x !== null && x.tag === 6 ? (t(_, x.sibling), (C = a(x, S)).return = _, _ = C) : (t(_, x), (C = Ya(S, _.mode, C)).return = _, _ = C), r(_)) : t(_, x);
	}
	return function(m, _, x, S) {
		try {
			_d = 0;
			var C = p(m, _, x, S);
			return gd = null, C;
		} catch (_) {
			if (_ === vu || _ === bu) throw _;
			var D = Ra(29, _, null, m.mode);
			return D.lanes = S, D.return = m, D;
		}
	};
}
var vd = to(!0), bd = to(!1), Id = zA(null), Bd = null;
function lo(m) {
	var _ = m.alternate;
	PA(Ud, 1 & Ud.current), PA(Id, m), Bd === null && (_ === null || Tu.current !== null || _.memoizedState !== null) && (Bd = m);
}
function oo(m) {
	if (m.tag === 22) {
		if (PA(Ud, Ud.current), PA(Id, m), Bd === null) {
			var _ = m.alternate;
			_ !== null && _.memoizedState !== null && (Bd = m);
		}
	} else so();
}
function so() {
	PA(Ud, Ud.current), PA(Id, Id.current);
}
function uo(m) {
	KA(Id), Bd === m && (Bd = null), KA(Ud);
}
var Ud = zA(0);
function go(m) {
	for (var _ = m; _ !== null;) {
		if (_.tag === 13) {
			var x = _.memoizedState;
			if (x !== null && ((x = x.dehydrated) === null || x.data === "$?" || Ed(x))) return _;
		} else if (_.tag === 19 && _.memoizedProps.revealOrder !== void 0) {
			if (128 & _.flags) return _;
		} else if (_.child !== null) {
			_.child.return = _, _ = _.child;
			continue;
		}
		if (_ === m) break;
		for (; _.sibling === null;) {
			if (_.return === null || _.return === m) return null;
			_ = _.return;
		}
		_.sibling.return = _.return, _ = _.sibling;
	}
	return null;
}
function po(m, _, x, S) {
	x = (x = x(S, _ = m.memoizedState)) == null ? _ : zt({}, _, x), m.memoizedState = x, m.lanes === 0 && (m.updateQueue.baseState = x);
}
var Wd = {
	enqueueSetState: function(m, _, x) {
		m = m._reactInternals;
		var S = Ou(), C = rr(S);
		C.payload = _, x != null && (C.callback = x), (_ = lr(m, C, S)) !== null && (Ru(_, 0, S), or(_, m, S));
	},
	enqueueReplaceState: function(m, _, x) {
		m = m._reactInternals;
		var S = Ou(), C = rr(S);
		C.tag = 1, C.payload = _, x != null && (C.callback = x), (_ = lr(m, C, S)) !== null && (Ru(_, 0, S), or(_, m, S));
	},
	enqueueForceUpdate: function(m, _) {
		m = m._reactInternals;
		var x = Ou(), S = rr(x);
		S.tag = 2, _ != null && (S.callback = _), (_ = lr(m, S, x)) !== null && (Ru(_, 0, x), or(_, m, x));
	}
};
function mo(m, _, x, S, C, D, O) {
	return typeof (m = m.stateNode).shouldComponentUpdate == "function" ? m.shouldComponentUpdate(S, D, O) : !(_.prototype && _.prototype.isPureReactComponent && Xn(x, S) && Xn(C, D));
}
function fo(m, _, x, S) {
	m = _.state, typeof _.componentWillReceiveProps == "function" && _.componentWillReceiveProps(x, S), typeof _.UNSAFE_componentWillReceiveProps == "function" && _.UNSAFE_componentWillReceiveProps(x, S), _.state !== m && Wd.enqueueReplaceState(_, _.state, null);
}
function Eo(m, _) {
	var x = _;
	if ("ref" in _) for (var S in x = {}, _) S !== "ref" && (x[S] = _[S]);
	if (m = m.defaultProps) for (var C in x === _ && (x = zt({}, x)), m) x[C] === void 0 && (x[C] = m[C]);
	return x;
}
var Gd = typeof reportError == "function" ? reportError : function(m) {
	if (typeof window == "object" && typeof window.ErrorEvent == "function") {
		var _ = new window.ErrorEvent("error", {
			bubbles: !0,
			cancelable: !0,
			message: typeof m == "object" && m && typeof m.message == "string" ? String(m.message) : String(m),
			error: m
		});
		if (!window.dispatchEvent(_)) return;
	} else if (typeof process == "object" && typeof process.emit == "function") return void process.emit("uncaughtException", m);
};
function bo(m) {
	Gd(m);
}
function ko(m) {}
function yo(m) {
	Gd(m);
}
function So(m, _) {
	try {
		(0, m.onUncaughtError)(_.value, { componentStack: _.stack });
	} catch (m) {
		setTimeout(function() {
			throw m;
		});
	}
}
function Io(m, _, x) {
	try {
		(0, m.onCaughtError)(x.value, {
			componentStack: x.stack,
			errorBoundary: _.tag === 1 ? _.stateNode : null
		});
	} catch (m) {
		setTimeout(function() {
			throw m;
		});
	}
}
function Uo(m, _, x) {
	return (x = rr(x)).tag = 3, x.payload = { element: null }, x.callback = function() {
		So(m, _);
	}, x;
}
function Co(m) {
	return (m = rr(m)).tag = 3, m;
}
function vo(m, _, x, S) {
	var C = x.type.getDerivedStateFromError;
	if (typeof C == "function") {
		var D = S.value;
		m.payload = function() {
			return C(D);
		}, m.callback = function() {
			Io(_, x, S);
		};
	}
	var O = x.stateNode;
	O !== null && typeof O.componentDidCatch == "function" && (m.callback = function() {
		Io(_, x, S), typeof C != "function" && (np === null ? np = /* @__PURE__ */ new Set([this]) : np.add(this));
		var m = S.stack;
		this.componentDidCatch(S.value, { componentStack: m === null ? "" : m });
	});
}
var Yd = Error(oA(461)), ef = !1;
function Mo(m, _, x, S) {
	_.child = m === null ? bd(_, null, x, S) : vd(_, m.child, x, S);
}
function No(m, _, x, S, C) {
	x = x.render;
	var D = _.ref;
	if ("ref" in S) {
		var O = {};
		for (var F in S) F !== "ref" && (O[F] = S[F]);
	} else O = S;
	return vi(_), S = Qr(m, _, x, O, D, C), F = Vr(), m === null || ef ? (Zl && F && ni(_), _.flags |= 1, Mo(m, _, S, C), _.child) : (Rr(m, _, C), Zo(m, _, C));
}
function To(m, _, x, S, C) {
	if (m === null) {
		var D = x.type;
		return typeof D != "function" || Fa(D) || D.defaultProps !== void 0 || x.compare !== null ? ((m = Ka(x.type, null, S, _, _.mode, C)).ref = _.ref, m.return = _, _.child = m) : (_.tag = 15, _.type = D, Qo(m, _, D, S, C));
	}
	if (D = m.child, !Xo(m, C)) {
		var O = D.memoizedProps;
		if ((x = (x = x.compare) === null ? Xn : x)(O, S) && m.ref === _.ref) return Zo(m, _, C);
	}
	return _.flags |= 1, (m = Ga(D, S)).ref = _.ref, m.return = _, _.child = m;
}
function Qo(m, _, x, S, C) {
	if (m !== null) {
		var D = m.memoizedProps;
		if (Xn(D, S) && m.ref === _.ref) {
			if (ef = !1, _.pendingProps = S = D, !Xo(m, C)) return _.lanes = m.lanes, Zo(m, _, C);
			131072 & m.flags && (ef = !0);
		}
	}
	return Vo(m, _, x, S, C);
}
function Lo(m, _, x) {
	var S = _.pendingProps, C = S.children, D = m === null ? null : m.memoizedState;
	if (S.mode === "hidden") {
		if (128 & _.flags) {
			if (S = D === null ? x : D.baseLanes | x, m !== null) {
				for (C = _.child = m.child, D = 0; C !== null;) D = D | C.lanes | C.childLanes, C = C.sibling;
				_.childLanes = D & ~S;
			} else _.childLanes = 0, _.child = null;
			return Do(m, _, S, x);
		}
		if (!(536870912 & x)) return _.lanes = _.childLanes = 536870912, Do(m, _, D === null ? x : D.baseLanes | x, x);
		_.memoizedState = {
			baseLanes: 0,
			cachePool: null
		}, m !== null && Hi(0, D === null ? null : D.cachePool), D === null ? Er() : fr(_, D), oo(_);
	} else D === null ? (m !== null && Hi(0, null), Er(), so()) : (Hi(0, D.cachePool), fr(_, D), so(), _.memoizedState = null);
	return Mo(m, _, C, x), _.child;
}
function Do(m, _, x, S) {
	var C = Yi();
	return C = C === null ? null : {
		parent: uu._currentValue,
		pool: C
	}, _.memoizedState = {
		baseLanes: x,
		cachePool: C
	}, m !== null && Hi(0, null), Er(), oo(_), m !== null && Ui(m, _, S, !0), null;
}
function Oo(m, _) {
	var x = _.ref;
	if (x === null) m !== null && m.ref !== null && (_.flags |= 4194816);
	else {
		if (typeof x != "function" && typeof x != "object") throw Error(oA(284));
		m !== null && m.ref === x || (_.flags |= 4194816);
	}
}
function Vo(m, _, x, S, C) {
	return vi(_), x = Qr(m, _, x, S, void 0, C), S = Vr(), m === null || ef ? (Zl && S && ni(_), _.flags |= 1, Mo(m, _, x, C), _.child) : (Rr(m, _, C), Zo(m, _, C));
}
function Ro(m, _, x, S, C, D) {
	return vi(_), _.updateQueue = null, x = Dr(_, S, x, C), Lr(m), S = Vr(), m === null || ef ? (Zl && S && ni(_), _.flags |= 1, Mo(m, _, x, D), _.child) : (Rr(m, _, D), Zo(m, _, D));
}
function Fo(m, _, x, S, C) {
	if (vi(_), _.stateNode === null) {
		var D = Oc, O = x.contextType;
		typeof O == "object" && O && (D = Bi(O)), D = new x(S, D), _.memoizedState = D.state !== null && D.state !== void 0 ? D.state : null, D.updater = Wd, _.stateNode = D, D._reactInternals = _, (D = _.stateNode).props = S, D.state = _.memoizedState, D.refs = {}, ar(_), O = x.contextType, D.context = typeof O == "object" && O ? Bi(O) : Oc, D.state = _.memoizedState, typeof (O = x.getDerivedStateFromProps) == "function" && (po(_, x, O, S), D.state = _.memoizedState), typeof x.getDerivedStateFromProps == "function" || typeof D.getSnapshotBeforeUpdate == "function" || typeof D.UNSAFE_componentWillMount != "function" && typeof D.componentWillMount != "function" || (O = D.state, typeof D.componentWillMount == "function" && D.componentWillMount(), typeof D.UNSAFE_componentWillMount == "function" && D.UNSAFE_componentWillMount(), O !== D.state && Wd.enqueueReplaceState(D, D.state, null), dr(_, S, D, C), cr(), D.state = _.memoizedState), typeof D.componentDidMount == "function" && (_.flags |= 4194308), S = !0;
	} else if (m === null) {
		D = _.stateNode;
		var F = _.memoizedProps, I = Eo(x, F);
		D.props = I;
		var L = D.context, H = x.contextType;
		O = Oc, typeof H == "object" && H && (O = Bi(H));
		var U = x.getDerivedStateFromProps;
		H = typeof U == "function" || typeof D.getSnapshotBeforeUpdate == "function", F = _.pendingProps !== F, H || typeof D.UNSAFE_componentWillReceiveProps != "function" && typeof D.componentWillReceiveProps != "function" || (F || L !== O) && fo(_, D, S, O), Cu = !1;
		var W = _.memoizedState;
		D.state = W, dr(_, S, D, C), cr(), L = _.memoizedState, F || W !== L || Cu ? (typeof U == "function" && (po(_, x, U, S), L = _.memoizedState), (I = Cu || mo(_, x, I, S, W, L, O)) ? (H || typeof D.UNSAFE_componentWillMount != "function" && typeof D.componentWillMount != "function" || (typeof D.componentWillMount == "function" && D.componentWillMount(), typeof D.UNSAFE_componentWillMount == "function" && D.UNSAFE_componentWillMount()), typeof D.componentDidMount == "function" && (_.flags |= 4194308)) : (typeof D.componentDidMount == "function" && (_.flags |= 4194308), _.memoizedProps = S, _.memoizedState = L), D.props = S, D.state = L, D.context = O, S = I) : (typeof D.componentDidMount == "function" && (_.flags |= 4194308), S = !1);
	} else {
		D = _.stateNode, ir(m, _), H = Eo(x, O = _.memoizedProps), D.props = H, U = _.pendingProps, W = D.context, L = x.contextType, I = Oc, typeof L == "object" && L && (I = Bi(L)), (L = typeof (F = x.getDerivedStateFromProps) == "function" || typeof D.getSnapshotBeforeUpdate == "function") || typeof D.UNSAFE_componentWillReceiveProps != "function" && typeof D.componentWillReceiveProps != "function" || (O !== U || W !== I) && fo(_, D, S, I), Cu = !1, W = _.memoizedState, D.state = W, dr(_, S, D, C), cr();
		var q = _.memoizedState;
		O !== U || W !== q || Cu || m !== null && m.dependencies !== null && Ci(m.dependencies) ? (typeof F == "function" && (po(_, x, F, S), q = _.memoizedState), (H = Cu || mo(_, x, H, S, W, q, I) || m !== null && m.dependencies !== null && Ci(m.dependencies)) ? (L || typeof D.UNSAFE_componentWillUpdate != "function" && typeof D.componentWillUpdate != "function" || (typeof D.componentWillUpdate == "function" && D.componentWillUpdate(S, q, I), typeof D.UNSAFE_componentWillUpdate == "function" && D.UNSAFE_componentWillUpdate(S, q, I)), typeof D.componentDidUpdate == "function" && (_.flags |= 4), typeof D.getSnapshotBeforeUpdate == "function" && (_.flags |= 1024)) : (typeof D.componentDidUpdate != "function" || O === m.memoizedProps && W === m.memoizedState || (_.flags |= 4), typeof D.getSnapshotBeforeUpdate != "function" || O === m.memoizedProps && W === m.memoizedState || (_.flags |= 1024), _.memoizedProps = S, _.memoizedState = q), D.props = S, D.state = q, D.context = I, S = H) : (typeof D.componentDidUpdate != "function" || O === m.memoizedProps && W === m.memoizedState || (_.flags |= 4), typeof D.getSnapshotBeforeUpdate != "function" || O === m.memoizedProps && W === m.memoizedState || (_.flags |= 1024), S = !1);
	}
	return D = S, Oo(m, _), S = !!(128 & _.flags), D || S ? (D = _.stateNode, x = S && typeof x.getDerivedStateFromError != "function" ? null : D.render(), _.flags |= 1, m !== null && S ? (_.child = vd(_, m.child, null, C), _.child = vd(_, null, x, C)) : Mo(m, _, x, C), _.memoizedState = D.state, m = _.child) : m = Zo(m, _, C), m;
}
function Go(m, _, x, S) {
	return hi(), _.flags |= 256, Mo(m, _, x, S), _.child;
}
var nf = {
	dehydrated: null,
	treeContext: null,
	retryLane: 0,
	hydrationErrors: null
};
function Ko(m) {
	return {
		baseLanes: m,
		cachePool: ji()
	};
}
function Po(m, _, x) {
	return m = m === null ? 0 : m.childLanes & ~x, _ && (m |= Vf), m;
}
function Yo(m, _, x) {
	var S, C = _.pendingProps, D = !1, O = !!(128 & _.flags);
	if ((S = O) || (S = (m === null || m.memoizedState !== null) && !!(2 & Ud.current)), S && (D = !0, _.flags &= -129), S = !!(32 & _.flags), _.flags &= -33, m === null) {
		if (Zl) {
			if (D ? lo(_) : so(), Zl) {
				var F, I = Jl;
				if (F = I) {
					A: {
						for (F = I, I = nu; F.nodeType !== 8;) {
							if (!I) {
								I = null;
								break A;
							}
							if ((F = wd(F.nextSibling)) === null) {
								I = null;
								break A;
							}
						}
						I = F;
					}
					I === null ? F = !1 : (_.memoizedState = {
						dehydrated: I,
						treeContext: _l === null ? null : {
							id: jl,
							overflow: Wl
						},
						retryLane: 536870912,
						hydrationErrors: null
					}, (F = Ra(18, null, null, 0)).stateNode = I, F.return = _, _.child = F, ql = _, Jl = null, F = !0);
				}
				F || ci(_);
			}
			if ((I = _.memoizedState) !== null && (I = I.dehydrated) !== null) return Ed(I) ? _.lanes = 32 : _.lanes = 536870912, null;
			uo(_);
		}
		return I = C.children, C = C.fallback, D ? (so(), I = jo({
			mode: "hidden",
			children: I
		}, D = _.mode), C = Pa(C, D, x, null), I.return = _, C.return = _, I.sibling = C, _.child = I, (D = _.child).memoizedState = Ko(x), D.childLanes = Po(m, S, x), _.memoizedState = nf, C) : (lo(_), Ho(_, I));
	}
	if ((F = m.memoizedState) !== null && (I = F.dehydrated) !== null) {
		if (O) 256 & _.flags ? (lo(_), _.flags &= -257, _ = _o(m, _, x)) : _.memoizedState === null ? (so(), D = C.fallback, I = _.mode, C = jo({
			mode: "visible",
			children: C.children
		}, I), (D = Pa(D, I, x, null)).flags |= 2, C.return = _, D.return = _, C.sibling = D, _.child = C, vd(_, m.child, null, x), (C = _.child).memoizedState = Ko(x), C.childLanes = Po(m, S, x), _.memoizedState = nf, _ = D) : (so(), _.child = m.child, _.flags |= 128, _ = null);
		else if (lo(_), Ed(I)) {
			if (S = I.nextSibling && I.nextSibling.dataset) var L = S.dgst;
			S = L, (C = Error(oA(419))).stack = "", C.digest = S, fi({
				value: C,
				source: null,
				stack: null
			}), _ = _o(m, _, x);
		} else if (ef || Ui(m, _, x, !1), S = (x & m.childLanes) !== 0, ef || S) {
			if ((S = Sf) !== null && (C = ((C = 42 & (C = x & -x) ? 1 : Me(C)) & (S.suspendedLanes | x)) === 0 ? C : 0) !== 0 && C !== F.retryLane) throw F.retryLane = C, Qa(m, C), Ru(S, 0, C), Yd;
			I.data === "$?" || qu(), _ = _o(m, _, x);
		} else I.data === "$?" ? (_.flags |= 192, _.child = m.child, _ = null) : (m = F.treeContext, Jl = wd(I.nextSibling), ql = _, Zl = !0, tu = null, nu = !1, m !== null && (Wc[qc++] = jl, Wc[qc++] = Wl, Wc[qc++] = _l, jl = m.id, Wl = m.overflow, _l = _), (_ = Ho(_, C.children)).flags |= 4096);
		return _;
	}
	return D ? (so(), D = C.fallback, I = _.mode, L = (F = m.child).sibling, (C = Ga(F, {
		mode: "hidden",
		children: C.children
	})).subtreeFlags = 65011712 & F.subtreeFlags, L === null ? (D = Pa(D, I, x, null)).flags |= 2 : D = Ga(L, D), D.return = _, C.return = _, C.sibling = D, _.child = C, C = D, D = _.child, (I = m.child.memoizedState) === null ? I = Ko(x) : ((F = I.cachePool) === null ? F = ji() : (L = uu._currentValue, F = F.parent === L ? F : {
		parent: L,
		pool: L
	}), I = {
		baseLanes: I.baseLanes | x,
		cachePool: F
	}), D.memoizedState = I, D.childLanes = Po(m, S, x), _.memoizedState = nf, C) : (lo(_), m = (x = m.child).sibling, (x = Ga(x, {
		mode: "visible",
		children: C.children
	})).return = _, x.sibling = null, m !== null && ((S = _.deletions) === null ? (_.deletions = [m], _.flags |= 16) : S.push(m)), _.child = x, _.memoizedState = null, x);
}
function Ho(m, _) {
	return (_ = jo({
		mode: "visible",
		children: _
	}, m.mode)).return = m, m.child = _;
}
function jo(m, _) {
	return (m = Ra(22, m, null, _)).lanes = 0, m.stateNode = {
		_visibility: 1,
		_pendingMarkers: null,
		_retryCache: null,
		_transitions: null
	}, m;
}
function _o(m, _, x) {
	return vd(_, m.child, null, x), (m = Ho(_, _.pendingProps.children)).flags |= 2, _.memoizedState = null, m;
}
function Jo(m, _, x) {
	m.lanes |= _;
	var S = m.alternate;
	S !== null && (S.lanes |= _), Si(m.return, _, x);
}
function qo(m, _, x, S, C) {
	var D = m.memoizedState;
	D === null ? m.memoizedState = {
		isBackwards: _,
		rendering: null,
		renderingStartTime: 0,
		last: S,
		tail: x,
		tailMode: C
	} : (D.isBackwards = _, D.rendering = null, D.renderingStartTime = 0, D.last = S, D.tail = x, D.tailMode = C);
}
function Wo(m, _, x) {
	var S = _.pendingProps, C = S.revealOrder, D = S.tail;
	if (Mo(m, _, S.children, x), 2 & (S = Ud.current)) S = 1 & S | 2, _.flags |= 128;
	else {
		if (m !== null && 128 & m.flags) A: for (m = _.child; m !== null;) {
			if (m.tag === 13) m.memoizedState !== null && Jo(m, x, _);
			else if (m.tag === 19) Jo(m, x, _);
			else if (m.child !== null) {
				m.child.return = m, m = m.child;
				continue;
			}
			if (m === _) break A;
			for (; m.sibling === null;) {
				if (m.return === null || m.return === _) break A;
				m = m.return;
			}
			m.sibling.return = m.return, m = m.sibling;
		}
		S &= 1;
	}
	switch (PA(Ud, S), C) {
		case "forwards":
			for (x = _.child, C = null; x !== null;) (m = x.alternate) !== null && go(m) === null && (C = x), x = x.sibling;
			(x = C) === null ? (C = _.child, _.child = null) : (C = x.sibling, x.sibling = null), qo(_, !1, C, x, D);
			break;
		case "backwards":
			for (x = null, C = _.child, _.child = null; C !== null;) {
				if ((m = C.alternate) !== null && go(m) === null) {
					_.child = C;
					break;
				}
				m = C.sibling, C.sibling = x, x = C, C = m;
			}
			qo(_, !0, x, null, D);
			break;
		case "together":
			qo(_, !1, null, null, void 0);
			break;
		default: _.memoizedState = null;
	}
	return _.child;
}
function Zo(m, _, x) {
	if (m !== null && (_.dependencies = m.dependencies), Pf |= _.lanes, (x & _.childLanes) === 0 && (m === null || (Ui(m, _, x, !1), (x & _.childLanes) === 0))) return null;
	if (m !== null && _.child !== m.child) throw Error(oA(153));
	if (_.child !== null) {
		for (x = Ga(m = _.child, m.pendingProps), _.child = x, x.return = _; m.sibling !== null;) m = m.sibling, (x = x.sibling = Ga(m, m.pendingProps)).return = _;
		x.sibling = null;
	}
	return _.child;
}
function Xo(m, _) {
	return (m.lanes & _) !== 0 || !((m = m.dependencies) === null || !Ci(m));
}
function $o(m, _, x) {
	if (m !== null) {
		if (m.memoizedProps !== _.pendingProps) ef = !0;
		else {
			if (!(Xo(m, x) || 128 & _.flags)) return ef = !1, function(m, _, x) {
				switch (_.tag) {
					case 3:
						JA(_, _.stateNode.containerInfo), ki(0, uu, m.memoizedState.cache), hi();
						break;
					case 27:
					case 5:
						WA(_);
						break;
					case 4:
						JA(_, _.stateNode.containerInfo);
						break;
					case 10:
						ki(0, _.type, _.memoizedProps.value);
						break;
					case 13:
						var S = _.memoizedState;
						if (S !== null) return S.dehydrated === null ? (x & _.child.childLanes) === 0 ? (lo(_), (m = Zo(m, _, x)) === null ? null : m.sibling) : Yo(m, _, x) : (lo(_), _.flags |= 128, null);
						lo(_);
						break;
					case 19:
						var C = !!(128 & m.flags);
						if ((S = (x & _.childLanes) !== 0) || (Ui(m, _, x, !1), S = (x & _.childLanes) !== 0), C) {
							if (S) return Wo(m, _, x);
							_.flags |= 128;
						}
						if ((C = _.memoizedState) !== null && (C.rendering = null, C.tail = null, C.lastEffect = null), PA(Ud, Ud.current), S) break;
						return null;
					case 22:
					case 23: return _.lanes = 0, Lo(m, _, x);
					case 24: ki(0, uu, m.memoizedState.cache);
				}
				return Zo(m, _, x);
			}(m, _, x);
			ef = !!(131072 & m.flags);
		}
	} else ef = !1, Zl && 1048576 & _.flags && ti(_, Vc, _.index);
	switch (_.lanes = 0, _.tag) {
		case 16:
			A: {
				m = _.pendingProps;
				var S = _.elementType, C = S._init;
				if (S = C(S._payload), _.type = S, typeof S != "function") {
					if (S != null) {
						if ((C = S.$$typeof) === en) {
							_.tag = 11, _ = No(null, _, S, m, x);
							break A;
						}
						if (C === rn) {
							_.tag = 14, _ = To(null, _, S, m, x);
							break A;
						}
					}
					throw _ = LA(S) || S, Error(oA(306, _, ""));
				}
				Fa(S) ? (m = Eo(S, m), _.tag = 1, _ = Fo(null, _, S, m, x)) : (_.tag = 0, _ = Vo(null, _, S, m, x));
			}
			return _;
		case 0: return Vo(m, _, _.type, _.pendingProps, x);
		case 1: return Fo(m, _, S = _.type, C = Eo(S, _.pendingProps), x);
		case 3:
			A: {
				if (JA(_, _.stateNode.containerInfo), m === null) throw Error(oA(387));
				S = _.pendingProps;
				var D = _.memoizedState;
				C = D.element, ir(m, _), dr(_, S, null, x);
				var O = _.memoizedState;
				if (S = O.cache, ki(0, uu, S), S !== D.cache && Ii(_, [uu], x, !0), cr(), S = O.element, D.isDehydrated) {
					if (D = {
						element: S,
						isDehydrated: !1,
						cache: O.cache
					}, _.updateQueue.baseState = D, _.memoizedState = D, 256 & _.flags) {
						_ = Go(m, _, S, x);
						break A;
					}
					if (S !== C) {
						fi(C = Ca(Error(oA(424)), _)), _ = Go(m, _, S, x);
						break A;
					}
					for (m = (m = _.stateNode.containerInfo).nodeType === 9 ? m.body : m.nodeName === "HTML" ? m.ownerDocument.body : m, Jl = wd(m.firstChild), ql = _, Zl = !0, tu = null, nu = !0, x = bd(_, null, S, x), _.child = x; x;) x.flags = -3 & x.flags | 4096, x = x.sibling;
				} else {
					if (hi(), S === C) {
						_ = Zo(m, _, x);
						break A;
					}
					Mo(m, _, S, x);
				}
				_ = _.child;
			}
			return _;
		case 26: return Oo(m, _), m === null ? (x = Md(_.type, null, _.pendingProps, null)) ? _.memoizedState = x : Zl || (x = _.type, m = _.pendingProps, (S = id(xn.current).createElement(x))[yr] = _, S[br] = m, td(S, x, m), _e(S), _.stateNode = S) : _.memoizedState = Md(_.type, m.memoizedProps, _.pendingProps, m.memoizedState), null;
		case 27: return WA(_), m === null && Zl && (S = _.stateNode = yd(_.type, _.pendingProps, xn.current), ql = _, nu = !0, C = Jl, hd(_.type) ? (zp = C, Jl = wd(S.firstChild)) : Jl = C), Mo(m, _, _.pendingProps.children, x), Oo(m, _), m === null && (_.flags |= 4194304), _.child;
		case 5: return m === null && Zl && ((C = S = Jl) && ((S = function(m, _, x, S) {
			for (; m.nodeType === 1;) {
				var C = x;
				if (m.nodeName.toLowerCase() !== _.toLowerCase()) {
					if (!S && (m.nodeName !== "INPUT" || m.type !== "hidden")) break;
				} else if (S) {
					if (!m[Mr]) switch (_) {
						case "meta":
							if (!m.hasAttribute("itemprop")) break;
							return m;
						case "link":
							if ((D = m.getAttribute("rel")) === "stylesheet" && m.hasAttribute("data-precedence") || D !== C.rel || m.getAttribute("href") !== (C.href == null || C.href === "" ? null : C.href) || m.getAttribute("crossorigin") !== (C.crossOrigin == null ? null : C.crossOrigin) || m.getAttribute("title") !== (C.title == null ? null : C.title)) break;
							return m;
						case "style":
							if (m.hasAttribute("data-precedence")) break;
							return m;
						case "script":
							if (((D = m.getAttribute("src")) !== (C.src == null ? null : C.src) || m.getAttribute("type") !== (C.type == null ? null : C.type) || m.getAttribute("crossorigin") !== (C.crossOrigin == null ? null : C.crossOrigin)) && D && m.hasAttribute("async") && !m.hasAttribute("itemprop")) break;
							return m;
						default: return m;
					}
				} else {
					if (_ !== "input" || m.type !== "hidden") return m;
					var D = C.name == null ? null : "" + C.name;
					if (C.type === "hidden" && m.getAttribute("name") === D) return m;
				}
				if ((m = wd(m.nextSibling)) === null) break;
			}
			return null;
		}(S, _.type, _.pendingProps, nu)) === null ? C = !1 : (_.stateNode = S, ql = _, Jl = wd(S.firstChild), nu = !1, C = !0)), C || ci(_)), WA(_), C = _.type, D = _.pendingProps, O = m === null ? null : m.memoizedProps, S = D.children, od(C, D) ? S = null : O !== null && od(C, O) && (_.flags |= 32), _.memoizedState !== null && (C = Qr(m, _, Or, null, null, x), qp._currentValue = C), Oo(m, _), Mo(m, _, S, x), _.child;
		case 6: return m === null && Zl && ((m = x = Jl) && ((x = function(m, _, x) {
			if (_ === "") return null;
			for (; m.nodeType !== 3;) if ((m.nodeType !== 1 || m.nodeName !== "INPUT" || m.type !== "hidden") && !x || (m = wd(m.nextSibling)) === null) return null;
			return m;
		}(x, _.pendingProps, nu)) === null ? m = !1 : (_.stateNode = x, ql = _, Jl = null, m = !0)), m || ci(_)), null;
		case 13: return Yo(m, _, x);
		case 4: return JA(_, _.stateNode.containerInfo), S = _.pendingProps, m === null ? _.child = vd(_, null, S, x) : Mo(m, _, S, x), _.child;
		case 11: return No(m, _, _.type, _.pendingProps, x);
		case 7: return Mo(m, _, _.pendingProps, x), _.child;
		case 8:
		case 12: return Mo(m, _, _.pendingProps.children, x), _.child;
		case 10: return S = _.pendingProps, ki(0, _.type, S.value), Mo(m, _, S.children, x), _.child;
		case 9: return C = _.type._context, S = _.pendingProps.children, vi(_), S = S(C = Bi(C)), _.flags |= 1, Mo(m, _, S, x), _.child;
		case 14: return To(m, _, _.type, _.pendingProps, x);
		case 15: return Qo(m, _, _.type, _.pendingProps, x);
		case 19: return Wo(m, _, x);
		case 31: return S = _.pendingProps, x = _.mode, S = {
			mode: S.mode,
			children: S.children
		}, m === null ? ((x = jo(S, x)).ref = _.ref, _.child = x, x.return = _, _ = x) : ((x = Ga(m.child, S)).ref = _.ref, _.child = x, x.return = _, _ = x), _;
		case 22: return Lo(m, _, x);
		case 24: return vi(_), S = Bi(uu), m === null ? ((C = Yi()) === null && (C = Sf, D = Di(), C.pooledCache = D, D.refCount++, D !== null && (C.pooledCacheLanes |= x), C = D), _.memoizedState = {
			parent: S,
			cache: C
		}, ar(_), ki(0, uu, C)) : ((m.lanes & x) !== 0 && (ir(m, _), dr(_, null, null, x), cr()), C = m.memoizedState, D = _.memoizedState, C.parent === S ? (S = D.cache, ki(0, uu, S), S !== C.cache && Ii(_, [uu], x, !0)) : (C = {
			parent: S,
			cache: S
		}, _.memoizedState = C, _.lanes === 0 && (_.memoizedState = _.updateQueue.baseState = C), ki(0, uu, S))), Mo(m, _, _.pendingProps.children, x), _.child;
		case 29: throw _.pendingProps;
	}
	throw Error(oA(156, _.tag));
}
function As(m) {
	m.flags |= 4;
}
function es(m, _) {
	if (_.type !== "stylesheet" || 4 & _.state.loading) m.flags &= -16777217;
	else if (m.flags |= 16777216, !Pd(_)) {
		if ((_ = Id.current) !== null && ((4194048 & wf) === wf ? Bd !== null : (62914560 & wf) !== wf && !(536870912 & wf) || _ !== Bd)) throw Su = xu, yu;
		m.flags |= 8192;
	}
}
function ts(m, _) {
	_ !== null && (m.flags |= 4), 16384 & m.flags && (_ = m.tag === 22 ? 536870912 : Ue(), m.lanes |= _, Hf |= _);
}
function ns(m, _) {
	if (!Zl) switch (m.tailMode) {
		case "hidden":
			_ = m.tail;
			for (var x = null; _ !== null;) _.alternate !== null && (x = _), _ = _.sibling;
			x === null ? m.tail = null : x.sibling = null;
			break;
		case "collapsed":
			x = m.tail;
			for (var S = null; x !== null;) x.alternate !== null && (S = x), x = x.sibling;
			S === null ? _ || m.tail === null ? m.tail = null : m.tail.sibling = null : S.sibling = null;
	}
}
function as(m) {
	var _ = m.alternate !== null && m.alternate.child === m.child, x = 0, S = 0;
	if (_) for (var C = m.child; C !== null;) x |= C.lanes | C.childLanes, S |= 65011712 & C.subtreeFlags, S |= 65011712 & C.flags, C.return = m, C = C.sibling;
	else for (C = m.child; C !== null;) x |= C.lanes | C.childLanes, S |= C.subtreeFlags, S |= C.flags, C.return = m, C = C.sibling;
	return m.subtreeFlags |= S, m.childLanes = x, _;
}
function is(m, _, x) {
	var S = _.pendingProps;
	switch (ai(_), _.tag) {
		case 31:
		case 16:
		case 15:
		case 0:
		case 11:
		case 7:
		case 8:
		case 12:
		case 9:
		case 14:
		case 1: return as(_), null;
		case 3: return x = _.stateNode, S = null, m !== null && (S = m.memoizedState.cache), _.memoizedState.cache !== S && (_.flags |= 2048), yi(uu), qA(), x.pendingContext && (x.context = x.pendingContext, x.pendingContext = null), m !== null && m.child !== null || (pi(_) ? As(_) : m === null || m.memoizedState.isDehydrated && !(256 & _.flags) || (_.flags |= 1024, mi())), as(_), null;
		case 26: return x = _.memoizedState, m === null ? (As(_), x === null ? (as(_), _.flags &= -16777217) : (as(_), es(_, x))) : x ? x === m.memoizedState ? (as(_), _.flags &= -16777217) : (As(_), as(_), es(_, x)) : (m.memoizedProps !== S && As(_), as(_), _.flags &= -16777217), null;
		case 27:
			ZA(_), x = xn.current;
			var C = _.type;
			if (m !== null && _.stateNode != null) m.memoizedProps !== S && As(_);
			else {
				if (!S) {
					if (_.stateNode === null) throw Error(oA(166));
					return as(_), null;
				}
				m = yn.current, pi(_) ? di(_) : (m = yd(C, S, x), _.stateNode = m, As(_));
			}
			return as(_), null;
		case 5:
			if (ZA(_), x = _.type, m !== null && _.stateNode != null) m.memoizedProps !== S && As(_);
			else {
				if (!S) {
					if (_.stateNode === null) throw Error(oA(166));
					return as(_), null;
				}
				if (m = yn.current, pi(_)) di(_);
				else {
					switch (C = id(xn.current), m) {
						case 1:
							m = C.createElementNS("http://www.w3.org/2000/svg", x);
							break;
						case 2:
							m = C.createElementNS("http://www.w3.org/1998/Math/MathML", x);
							break;
						default: switch (x) {
							case "svg":
								m = C.createElementNS("http://www.w3.org/2000/svg", x);
								break;
							case "math":
								m = C.createElementNS("http://www.w3.org/1998/Math/MathML", x);
								break;
							case "script":
								(m = C.createElement("div")).innerHTML = "<script><\/script>", m = m.removeChild(m.firstChild);
								break;
							case "select":
								m = typeof S.is == "string" ? C.createElement("select", { is: S.is }) : C.createElement("select"), S.multiple ? m.multiple = !0 : S.size && (m.size = S.size);
								break;
							default: m = typeof S.is == "string" ? C.createElement(x, { is: S.is }) : C.createElement(x);
						}
					}
					m[yr] = _, m[br] = S;
					A: for (C = _.child; C !== null;) {
						if (C.tag === 5 || C.tag === 6) m.appendChild(C.stateNode);
						else if (C.tag !== 4 && C.tag !== 27 && C.child !== null) {
							C.child.return = C, C = C.child;
							continue;
						}
						if (C === _) break A;
						for (; C.sibling === null;) {
							if (C.return === null || C.return === _) break A;
							C = C.return;
						}
						C.sibling.return = C.return, C = C.sibling;
					}
					_.stateNode = m;
					A: switch (td(m, x, S), x) {
						case "button":
						case "input":
						case "select":
						case "textarea":
							m = !!S.autoFocus;
							break A;
						case "img":
							m = !0;
							break A;
						default: m = !1;
					}
					m && As(_);
				}
			}
			return as(_), _.flags &= -16777217, null;
		case 6:
			if (m && _.stateNode != null) m.memoizedProps !== S && As(_);
			else {
				if (typeof S != "string" && _.stateNode === null) throw Error(oA(166));
				if (m = xn.current, pi(_)) {
					if (m = _.stateNode, x = _.memoizedProps, S = null, (C = ql) !== null) switch (C.tag) {
						case 27:
						case 5: S = C.memoizedProps;
					}
					m[yr] = _, (m = !!(m.nodeValue === x || S !== null && !0 === S.suppressHydrationWarning || Xc(m.nodeValue, x))) || ci(_);
				} else (m = id(m).createTextNode(S))[yr] = _, _.stateNode = m;
			}
			return as(_), null;
		case 13:
			if (S = _.memoizedState, m === null || m.memoizedState !== null && m.memoizedState.dehydrated !== null) {
				if (C = pi(_), S !== null && S.dehydrated !== null) {
					if (m === null) {
						if (!C) throw Error(oA(318));
						if (!(C = (C = _.memoizedState) === null ? null : C.dehydrated)) throw Error(oA(317));
						C[yr] = _;
					} else hi(), !(128 & _.flags) && (_.memoizedState = null), _.flags |= 4;
					as(_), C = !1;
				} else C = mi(), m !== null && m.memoizedState !== null && (m.memoizedState.hydrationErrors = C), C = !0;
				if (!C) return 256 & _.flags ? (uo(_), _) : (uo(_), null);
			}
			if (uo(_), 128 & _.flags) return _.lanes = x, _;
			if (x = S !== null, m = m !== null && m.memoizedState !== null, x) {
				C = null, (S = _.child).alternate !== null && S.alternate.memoizedState !== null && S.alternate.memoizedState.cachePool !== null && (C = S.alternate.memoizedState.cachePool.pool);
				var D = null;
				S.memoizedState !== null && S.memoizedState.cachePool !== null && (D = S.memoizedState.cachePool.pool), D !== C && (S.flags |= 2048);
			}
			return x !== m && x && (_.child.flags |= 8192), ts(_, _.updateQueue), as(_), null;
		case 4: return qA(), m === null && Kc(_.stateNode.containerInfo), as(_), null;
		case 10: return yi(_.type), as(_), null;
		case 19:
			if (KA(Ud), (C = _.memoizedState) === null) return as(_), null;
			if (S = !!(128 & _.flags), (D = C.rendering) === null) {
				if (S) ns(C, !1);
				else {
					if (Nf !== 0 || m !== null && 128 & m.flags) for (m = _.child; m !== null;) {
						if ((D = go(m)) !== null) {
							for (_.flags |= 128, ns(C, !1), m = D.updateQueue, _.updateQueue = m, ts(_, m), _.subtreeFlags = 0, m = x, x = _.child; x !== null;) za(x, m), x = x.sibling;
							return PA(Ud, 1 & Ud.current | 2), _.child;
						}
						m = m.sibling;
					}
					C.tail !== null && kn() > ep && (_.flags |= 128, S = !0, ns(C, !1), _.lanes = 4194304);
				}
			} else {
				if (!S) {
					if ((m = go(D)) !== null) {
						if (_.flags |= 128, S = !0, m = m.updateQueue, _.updateQueue = m, ts(_, m), ns(C, !0), C.tail === null && C.tailMode === "hidden" && !D.alternate && !Zl) return as(_), null;
					} else 2 * kn() - C.renderingStartTime > ep && x !== 536870912 && (_.flags |= 128, S = !0, ns(C, !1), _.lanes = 4194304);
				}
				C.isBackwards ? (D.sibling = _.child, _.child = D) : ((m = C.last) === null ? _.child = D : m.sibling = D, C.last = D);
			}
			return C.tail === null ? (as(_), null) : (_ = C.tail, C.rendering = _, C.tail = _.sibling, C.renderingStartTime = kn(), _.sibling = null, m = Ud.current, PA(Ud, S ? 1 & m | 2 : 1 & m), _);
		case 22:
		case 23: return uo(_), wr(), S = _.memoizedState !== null, m === null ? S && (_.flags |= 8192) : m.memoizedState !== null !== S && (_.flags |= 8192), S ? 536870912 & x && !(128 & _.flags) && (as(_), 6 & _.subtreeFlags && (_.flags |= 8192)) : as(_), (x = _.updateQueue) !== null && ts(_, x.retryQueue), x = null, m !== null && m.memoizedState !== null && m.memoizedState.cachePool !== null && (x = m.memoizedState.cachePool.pool), S = null, _.memoizedState !== null && _.memoizedState.cachePool !== null && (S = _.memoizedState.cachePool.pool), S !== x && (_.flags |= 2048), m !== null && KA(gu), null;
		case 24: return x = null, m !== null && (x = m.memoizedState.cache), _.memoizedState.cache !== x && (_.flags |= 2048), yi(uu), as(_), null;
		case 25:
		case 30: return null;
	}
	throw Error(oA(156, _.tag));
}
function rs(m, _) {
	switch (ai(_), _.tag) {
		case 1: return 65536 & (m = _.flags) ? (_.flags = -65537 & m | 128, _) : null;
		case 3: return yi(uu), qA(), 65536 & (m = _.flags) && !(128 & m) ? (_.flags = -65537 & m | 128, _) : null;
		case 26:
		case 27:
		case 5: return ZA(_), null;
		case 13:
			if (uo(_), (m = _.memoizedState) !== null && m.dehydrated !== null) {
				if (_.alternate === null) throw Error(oA(340));
				hi();
			}
			return 65536 & (m = _.flags) ? (_.flags = -65537 & m | 128, _) : null;
		case 19: return KA(Ud), null;
		case 4: return qA(), null;
		case 10: return yi(_.type), null;
		case 22:
		case 23: return uo(_), wr(), m !== null && KA(gu), 65536 & (m = _.flags) ? (_.flags = -65537 & m | 128, _) : null;
		case 24: return yi(uu), null;
		default: return null;
	}
}
function ls(m, _) {
	switch (ai(_), _.tag) {
		case 3:
			yi(uu), qA();
			break;
		case 26:
		case 27:
		case 5:
			ZA(_);
			break;
		case 4:
			qA();
			break;
		case 13:
			uo(_);
			break;
		case 19:
			KA(Ud);
			break;
		case 10:
			yi(_.type);
			break;
		case 22:
		case 23:
			uo(_), wr(), m !== null && KA(gu);
			break;
		case 24: yi(uu);
	}
}
function os(m, _) {
	try {
		var x = _.updateQueue, S = x === null ? null : x.lastEffect;
		if (S !== null) {
			var C = S.next;
			x = C;
			do {
				if ((x.tag & m) === m) {
					S = void 0;
					var D = x.create, O = x.inst;
					S = D(), O.destroy = S;
				}
				x = x.next;
			} while (x !== C);
		}
	} catch (m) {
		dc(_, _.return, m);
	}
}
function ss(m, _, x) {
	try {
		var S = _.updateQueue, C = S === null ? null : S.lastEffect;
		if (C !== null) {
			var D = C.next;
			S = D;
			do {
				if ((S.tag & m) === m) {
					var O = S.inst, F = O.destroy;
					if (F !== void 0) {
						O.destroy = void 0, C = _;
						var I = x, L = F;
						try {
							L();
						} catch (m) {
							dc(C, I, m);
						}
					}
				}
				S = S.next;
			} while (S !== D);
		}
	} catch (m) {
		dc(_, _.return, m);
	}
}
function us(m) {
	var _ = m.updateQueue;
	if (_ !== null) {
		var x = m.stateNode;
		try {
			pr(_, x);
		} catch (_) {
			dc(m, m.return, _);
		}
	}
}
function cs(m, _, x) {
	x.props = Eo(m.type, m.memoizedProps), x.state = m.memoizedState;
	try {
		x.componentWillUnmount();
	} catch (x) {
		dc(m, _, x);
	}
}
function ds(m, _) {
	try {
		var x = m.ref;
		if (x !== null) {
			switch (m.tag) {
				case 26:
				case 27:
				case 5:
					var S = m.stateNode;
					break;
				default: S = m.stateNode;
			}
			typeof x == "function" ? m.refCleanup = x(S) : x.current = S;
		}
	} catch (x) {
		dc(m, _, x);
	}
}
function gs(m, _) {
	var x = m.ref, S = m.refCleanup;
	if (x !== null) {
		if (typeof S == "function") try {
			S();
		} catch (x) {
			dc(m, _, x);
		} finally {
			m.refCleanup = null, (m = m.alternate) != null && (m.refCleanup = null);
		}
		else if (typeof x == "function") try {
			x(null);
		} catch (x) {
			dc(m, _, x);
		}
		else x.current = null;
	}
}
function ps(m) {
	var _ = m.type, x = m.memoizedProps, S = m.stateNode;
	try {
		A: switch (_) {
			case "button":
			case "input":
			case "select":
			case "textarea":
				x.autoFocus && S.focus();
				break A;
			case "img": x.src ? S.src = x.src : x.srcSet && (S.srcset = x.srcSet);
		}
	} catch (_) {
		dc(m, m.return, _);
	}
}
function hs(m, _, x) {
	try {
		var S = m.stateNode;
		(function(m, _, x, S) {
			switch (_) {
				case "div":
				case "span":
				case "svg":
				case "path":
				case "a":
				case "g":
				case "p":
				case "li": break;
				case "input":
					var C = null, D = null, O = null, F = null, I = null, L = null, H = null;
					for (q in x) {
						var U = x[q];
						if (x.hasOwnProperty(q) && U != null) switch (q) {
							case "checked":
							case "value": break;
							case "defaultValue": I = U;
							default: S.hasOwnProperty(q) || Ad(m, _, q, null, S, U);
						}
					}
					for (var W in S) {
						var q = S[W];
						if (U = x[W], S.hasOwnProperty(W) && (q != null || U != null)) switch (W) {
							case "type":
								D = q;
								break;
							case "name":
								C = q;
								break;
							case "checked":
								L = q;
								break;
							case "defaultChecked":
								H = q;
								break;
							case "value":
								O = q;
								break;
							case "defaultValue":
								F = q;
								break;
							case "children":
							case "dangerouslySetInnerHTML":
								if (q != null) throw Error(oA(137, _));
								break;
							default: q !== U && Ad(m, _, W, q, S, U);
						}
					}
					Et(m, O, F, I, L, H, D, C);
					return;
				case "select":
					for (D in q = O = F = W = null, x) if (I = x[D], x.hasOwnProperty(D) && I != null) switch (D) {
						case "value": break;
						case "multiple": q = I;
						default: S.hasOwnProperty(D) || Ad(m, _, D, null, S, I);
					}
					for (C in S) if (D = S[C], I = x[C], S.hasOwnProperty(C) && (D != null || I != null)) switch (C) {
						case "value":
							W = D;
							break;
						case "defaultValue":
							F = D;
							break;
						case "multiple": O = D;
						default: D !== I && Ad(m, _, C, D, S, I);
					}
					_ = F, x = O, S = q, W == null ? !!S != !!x && (_ == null ? kt(m, !!x, x ? [] : "", !1) : kt(m, !!x, _, !0)) : kt(m, !!x, W, !1);
					return;
				case "textarea":
					for (F in q = W = null, x) if (C = x[F], x.hasOwnProperty(F) && C != null && !S.hasOwnProperty(F)) switch (F) {
						case "value":
						case "children": break;
						default: Ad(m, _, F, null, S, C);
					}
					for (O in S) if (C = S[O], D = x[O], S.hasOwnProperty(O) && (C != null || D != null)) switch (O) {
						case "value":
							W = C;
							break;
						case "defaultValue":
							q = C;
							break;
						case "children": break;
						case "dangerouslySetInnerHTML":
							if (C != null) throw Error(oA(91));
							break;
						default: C !== D && Ad(m, _, O, C, S, D);
					}
					yt(m, W, q);
					return;
				case "option":
					for (var ee in x) W = x[ee], x.hasOwnProperty(ee) && W != null && !S.hasOwnProperty(ee) && (ee === "selected" ? m.selected = !1 : Ad(m, _, ee, null, S, W));
					for (I in S) W = S[I], q = x[I], !S.hasOwnProperty(I) || W === q || W == null && q == null || (I === "selected" ? m.selected = W && typeof W != "function" && typeof W != "symbol" : Ad(m, _, I, W, S, q));
					return;
				case "img":
				case "link":
				case "area":
				case "base":
				case "br":
				case "col":
				case "embed":
				case "hr":
				case "keygen":
				case "meta":
				case "param":
				case "source":
				case "track":
				case "wbr":
				case "menuitem":
					for (var te in x) W = x[te], x.hasOwnProperty(te) && W != null && !S.hasOwnProperty(te) && Ad(m, _, te, null, S, W);
					for (L in S) if (W = S[L], q = x[L], S.hasOwnProperty(L) && W !== q && (W != null || q != null)) switch (L) {
						case "children":
						case "dangerouslySetInnerHTML":
							if (W != null) throw Error(oA(137, _));
							break;
						default: Ad(m, _, L, W, S, q);
					}
					return;
				default: if (Bt(_)) {
					for (var J in x) W = x[J], x.hasOwnProperty(J) && W !== void 0 && !S.hasOwnProperty(J) && ed(m, _, J, void 0, S, W);
					for (H in S) W = S[H], q = x[H], !S.hasOwnProperty(H) || W === q || W === void 0 && q === void 0 || ed(m, _, H, W, S, q);
					return;
				}
			}
			for (var ne in x) W = x[ne], x.hasOwnProperty(ne) && W != null && !S.hasOwnProperty(ne) && Ad(m, _, ne, null, S, W);
			for (U in S) W = S[U], q = x[U], !S.hasOwnProperty(U) || W === q || W == null && q == null || Ad(m, _, U, W, S, q);
		})(S, m.type, x, _), S[br] = _;
	} catch (_) {
		dc(m, m.return, _);
	}
}
function ms(m) {
	return m.tag === 5 || m.tag === 3 || m.tag === 26 || m.tag === 27 && hd(m.type) || m.tag === 4;
}
function fs(m) {
	A: for (;;) {
		for (; m.sibling === null;) {
			if (m.return === null || ms(m.return)) return null;
			m = m.return;
		}
		for (m.sibling.return = m.return, m = m.sibling; m.tag !== 5 && m.tag !== 6 && m.tag !== 18;) {
			if (m.tag === 27 && hd(m.type) || 2 & m.flags || m.child === null || m.tag === 4) continue A;
			m.child.return = m, m = m.child;
		}
		if (!(2 & m.flags)) return m.stateNode;
	}
}
function Es(m, _, x) {
	var S = m.tag;
	if (S === 5 || S === 6) m = m.stateNode, _ ? (x.nodeType === 9 ? x.body : x.nodeName === "HTML" ? x.ownerDocument.body : x).insertBefore(m, _) : ((_ = x.nodeType === 9 ? x.body : x.nodeName === "HTML" ? x.ownerDocument.body : x).appendChild(m), (x = x._reactRootContainer) != null || _.onclick !== null || (_.onclick = $c));
	else if (S !== 4 && (S === 27 && hd(m.type) && (x = m.stateNode, _ = null), (m = m.child) !== null)) for (Es(m, _, x), m = m.sibling; m !== null;) Es(m, _, x), m = m.sibling;
}
function ws(m, _, x) {
	var S = m.tag;
	if (S === 5 || S === 6) m = m.stateNode, _ ? x.insertBefore(m, _) : x.appendChild(m);
	else if (S !== 4 && (S === 27 && hd(m.type) && (x = m.stateNode), (m = m.child) !== null)) for (ws(m, _, x), m = m.sibling; m !== null;) ws(m, _, x), m = m.sibling;
}
function bs(m) {
	var _ = m.stateNode, x = m.memoizedProps;
	try {
		for (var S = m.type, C = _.attributes; C.length;) _.removeAttributeNode(C[0]);
		td(_, S, x), _[yr] = m, _[br] = x;
	} catch (_) {
		dc(m, m.return, _);
	}
}
var rf = !1, af = !1, of = !1, cf = typeof WeakSet == "function" ? WeakSet : Set, df = null;
function Cs(m, _, x) {
	var S = x.flags;
	switch (x.tag) {
		case 0:
		case 11:
		case 15:
			Fs(m, x), 4 & S && os(5, x);
			break;
		case 1:
			if (Fs(m, x), 4 & S) {
				if (m = x.stateNode, _ === null) try {
					m.componentDidMount();
				} catch (m) {
					dc(x, x.return, m);
				}
				else {
					var C = Eo(x.type, _.memoizedProps);
					_ = _.memoizedState;
					try {
						m.componentDidUpdate(C, _, m.__reactInternalSnapshotBeforeUpdate);
					} catch (m) {
						dc(x, x.return, m);
					}
				}
			}
			64 & S && us(x), 512 & S && ds(x, x.return);
			break;
		case 3:
			if (Fs(m, x), 64 & S && (m = x.updateQueue) !== null) {
				if (_ = null, x.child !== null) switch (x.child.tag) {
					case 27:
					case 5:
					case 1: _ = x.child.stateNode;
				}
				try {
					pr(m, _);
				} catch (m) {
					dc(x, x.return, m);
				}
			}
			break;
		case 27: _ === null && 4 & S && bs(x);
		case 26:
		case 5:
			Fs(m, x), _ === null && 4 & S && ps(x), 512 & S && ds(x, x.return);
			break;
		case 12:
			Fs(m, x);
			break;
		case 13:
			Fs(m, x), 4 & S && Ts(m, x), 64 & S && (m = x.memoizedState) !== null && (m = m.dehydrated) !== null && function(m, _) {
				var x = m.ownerDocument;
				if (m.data !== "$?" || x.readyState === "complete") _();
				else {
					var n = function() {
						_(), x.removeEventListener("DOMContentLoaded", n);
					};
					x.addEventListener("DOMContentLoaded", n), m._reactRetry = n;
				}
			}(m, x = mc.bind(null, x));
			break;
		case 22:
			if (!(S = x.memoizedState !== null || rf)) {
				_ = _ !== null && _.memoizedState !== null || af, C = rf;
				var D = af;
				rf = S, (af = _) && !D ? zs(m, x, !!(8772 & x.subtreeFlags)) : Fs(m, x), rf = C, af = D;
			}
			break;
		case 30: break;
		default: Fs(m, x);
	}
}
function vs(m) {
	var _ = m.alternate;
	_ !== null && (m.alternate = null, vs(_)), m.child = null, m.deletions = null, m.sibling = null, m.tag === 5 && (_ = m.stateNode) !== null && Ke(_), m.stateNode = null, m.return = null, m.dependencies = null, m.memoizedProps = null, m.memoizedState = null, m.pendingProps = null, m.stateNode = null, m.updateQueue = null;
}
var ff = null, pf = !1;
function Ms(m, _, x) {
	for (x = x.child; x !== null;) Ns(m, _, x), x = x.sibling;
}
function Ns(m, _, x) {
	if (Zn && typeof Zn.onCommitFiberUnmount == "function") try {
		Zn.onCommitFiberUnmount(Yn, x);
	} catch {}
	switch (x.tag) {
		case 26:
			af || gs(x, _), Ms(m, _, x), x.memoizedState ? x.memoizedState.count-- : x.stateNode && (x = x.stateNode).parentNode.removeChild(x);
			break;
		case 27:
			af || gs(x, _);
			var S = ff, C = pf;
			hd(x.type) && (ff = x.stateNode, pf = !1), Ms(m, _, x), Sd(x.stateNode), ff = S, pf = C;
			break;
		case 5: af || gs(x, _);
		case 6:
			if (S = ff, C = pf, ff = null, Ms(m, _, x), pf = C, (ff = S) !== null) {
				if (pf) try {
					(ff.nodeType === 9 ? ff.body : ff.nodeName === "HTML" ? ff.ownerDocument.body : ff).removeChild(x.stateNode);
				} catch (m) {
					dc(x, _, m);
				}
				else try {
					ff.removeChild(x.stateNode);
				} catch (m) {
					dc(x, _, m);
				}
			}
			break;
		case 18:
			ff !== null && (pf ? (md((m = ff).nodeType === 9 ? m.body : m.nodeName === "HTML" ? m.ownerDocument.body : m, x.stateNode), xg(m)) : md(ff, x.stateNode));
			break;
		case 4:
			S = ff, C = pf, ff = x.stateNode.containerInfo, pf = !0, Ms(m, _, x), ff = S, pf = C;
			break;
		case 0:
		case 11:
		case 14:
		case 15:
			af || ss(2, x, _), af || ss(4, x, _), Ms(m, _, x);
			break;
		case 1:
			af || (gs(x, _), typeof (S = x.stateNode).componentWillUnmount == "function" && cs(x, _, S)), Ms(m, _, x);
			break;
		case 21:
			Ms(m, _, x);
			break;
		case 22:
			af = (S = af) || x.memoizedState !== null, Ms(m, _, x), af = S;
			break;
		default: Ms(m, _, x);
	}
}
function Ts(m, _) {
	if (_.memoizedState === null && (m = _.alternate) !== null && (m = m.memoizedState) !== null && (m = m.dehydrated) !== null) try {
		xg(m);
	} catch (m) {
		dc(_, _.return, m);
	}
}
function Qs(m, _) {
	var x = function(m) {
		switch (m.tag) {
			case 13:
			case 19:
				var _ = m.stateNode;
				return _ === null && (_ = m.stateNode = new cf()), _;
			case 22: return (_ = (m = m.stateNode)._retryCache) === null && (_ = m._retryCache = new cf()), _;
			default: throw Error(oA(435, m.tag));
		}
	}(m);
	_.forEach(function(_) {
		var S = fc.bind(null, m, _);
		x.has(_) || (x.add(_), _.then(S, S));
	});
}
function Ls(m, _) {
	var x = _.deletions;
	if (x !== null) for (var S = 0; S < x.length; S++) {
		var C = x[S], D = m, O = _, F = O;
		A: for (; F !== null;) {
			switch (F.tag) {
				case 27:
					if (hd(F.type)) {
						ff = F.stateNode, pf = !1;
						break A;
					}
					break;
				case 5:
					ff = F.stateNode, pf = !1;
					break A;
				case 3:
				case 4:
					ff = F.stateNode.containerInfo, pf = !0;
					break A;
			}
			F = F.return;
		}
		if (ff === null) throw Error(oA(160));
		Ns(D, O, C), ff = null, pf = !1, (D = C.alternate) !== null && (D.return = null), C.return = null;
	}
	if (13878 & _.subtreeFlags) for (_ = _.child; _ !== null;) Os(_, m), _ = _.sibling;
}
var mf = null;
function Os(m, _) {
	var x = m.alternate, S = m.flags;
	switch (m.tag) {
		case 0:
		case 11:
		case 14:
		case 15:
			Ls(_, m), Vs(m), 4 & S && (ss(3, m, m.return), os(3, m), ss(5, m, m.return));
			break;
		case 1:
			Ls(_, m), Vs(m), 512 & S && (af || x === null || gs(x, x.return)), 64 & S && rf && (m = m.updateQueue) !== null && (S = m.callbacks) !== null && (x = m.shared.hiddenCallbacks, m.shared.hiddenCallbacks = x === null ? S : x.concat(S));
			break;
		case 26:
			var C = mf;
			if (Ls(_, m), Vs(m), 512 & S && (af || x === null || gs(x, x.return)), 4 & S) {
				var D = x === null ? null : x.memoizedState;
				if (S = m.memoizedState, x === null) {
					if (S === null) {
						if (m.stateNode === null) {
							A: {
								S = m.type, x = m.memoizedProps, C = C.ownerDocument || C;
								e: switch (S) {
									case "title":
										(!(D = C.getElementsByTagName("title")[0]) || D[Mr] || D[yr] || D.namespaceURI === "http://www.w3.org/2000/svg" || D.hasAttribute("itemprop")) && (D = C.createElement(S), C.head.insertBefore(D, C.querySelector("head > title"))), td(D, S, x), D[yr] = m, _e(D), S = D;
										break A;
									case "link":
										var O = zd("link", "href", C).get(S + (x.href || ""));
										if (O) {
											for (var F = 0; F < O.length; F++) if ((D = O[F]).getAttribute("href") === (x.href == null || x.href === "" ? null : x.href) && D.getAttribute("rel") === (x.rel == null ? null : x.rel) && D.getAttribute("title") === (x.title == null ? null : x.title) && D.getAttribute("crossorigin") === (x.crossOrigin == null ? null : x.crossOrigin)) {
												O.splice(F, 1);
												break e;
											}
										}
										td(D = C.createElement(S), S, x), C.head.appendChild(D);
										break;
									case "meta":
										if (O = zd("meta", "content", C).get(S + (x.content || ""))) {
											for (F = 0; F < O.length; F++) if ((D = O[F]).getAttribute("content") === (x.content == null ? null : "" + x.content) && D.getAttribute("name") === (x.name == null ? null : x.name) && D.getAttribute("property") === (x.property == null ? null : x.property) && D.getAttribute("http-equiv") === (x.httpEquiv == null ? null : x.httpEquiv) && D.getAttribute("charset") === (x.charSet == null ? null : x.charSet)) {
												O.splice(F, 1);
												break e;
											}
										}
										td(D = C.createElement(S), S, x), C.head.appendChild(D);
										break;
									default: throw Error(oA(468, S));
								}
								D[yr] = m, _e(D), S = D;
							}
							m.stateNode = S;
						} else Kd(C, m.type, m.stateNode);
					} else m.stateNode = Od(C, S, m.memoizedProps);
				} else D === S ? S === null && m.stateNode !== null && hs(m, m.memoizedProps, x.memoizedProps) : (D === null ? x.stateNode !== null && (x = x.stateNode).parentNode.removeChild(x) : D.count--, S === null ? Kd(C, m.type, m.stateNode) : Od(C, S, m.memoizedProps));
			}
			break;
		case 27:
			Ls(_, m), Vs(m), 512 & S && (af || x === null || gs(x, x.return)), x !== null && 4 & S && hs(m, m.memoizedProps, x.memoizedProps);
			break;
		case 5:
			if (Ls(_, m), Vs(m), 512 & S && (af || x === null || gs(x, x.return)), 32 & m.flags) {
				C = m.stateNode;
				try {
					It(C, "");
				} catch (_) {
					dc(m, m.return, _);
				}
			}
			4 & S && m.stateNode != null && hs(m, C = m.memoizedProps, x === null ? C : x.memoizedProps), 1024 & S && (of = !0);
			break;
		case 6:
			if (Ls(_, m), Vs(m), 4 & S) {
				if (m.stateNode === null) throw Error(oA(162));
				S = m.memoizedProps, x = m.stateNode;
				try {
					x.nodeValue = S;
				} catch (_) {
					dc(m, m.return, _);
				}
			}
			break;
		case 3:
			if (Wp = null, C = mf, mf = Cd(_.containerInfo), Ls(_, m), mf = C, Vs(m), 4 & S && x !== null && x.memoizedState.isDehydrated) try {
				xg(_.containerInfo);
			} catch (_) {
				dc(m, m.return, _);
			}
			of && (of = !1, Rs(m));
			break;
		case 4:
			S = mf, mf = Cd(m.stateNode.containerInfo), Ls(_, m), Vs(m), mf = S;
			break;
		case 12:
		default:
			Ls(_, m), Vs(m);
			break;
		case 13:
			Ls(_, m), Vs(m), 8192 & m.child.flags && m.memoizedState !== null != (x !== null && x.memoizedState !== null) && (Qf = kn()), 4 & S && (S = m.updateQueue) !== null && (m.updateQueue = null, Qs(m, S));
			break;
		case 22:
			C = m.memoizedState !== null;
			var I = x !== null && x.memoizedState !== null, L = rf, H = af;
			if (rf = L || C, af = H || I, Ls(_, m), af = H, rf = L, Vs(m), 8192 & S) A: for (_ = m.stateNode, _._visibility = C ? -2 & _._visibility : 1 | _._visibility, C && (x === null || I || rf || af || Gs(m)), x = null, _ = m;;) {
				if (_.tag === 5 || _.tag === 26) {
					if (x === null) {
						I = x = _;
						try {
							if (D = I.stateNode, C) typeof (O = D.style).setProperty == "function" ? O.setProperty("display", "none", "important") : O.display = "none";
							else {
								F = I.stateNode;
								var U = I.memoizedProps.style, W = U != null && U.hasOwnProperty("display") ? U.display : null;
								F.style.display = W == null || typeof W == "boolean" ? "" : ("" + W).trim();
							}
						} catch (m) {
							dc(I, I.return, m);
						}
					}
				} else if (_.tag === 6) {
					if (x === null) {
						I = _;
						try {
							I.stateNode.nodeValue = C ? "" : I.memoizedProps;
						} catch (m) {
							dc(I, I.return, m);
						}
					}
				} else if ((_.tag !== 22 && _.tag !== 23 || _.memoizedState === null || _ === m) && _.child !== null) {
					_.child.return = _, _ = _.child;
					continue;
				}
				if (_ === m) break A;
				for (; _.sibling === null;) {
					if (_.return === null || _.return === m) break A;
					x === _ && (x = null), _ = _.return;
				}
				x === _ && (x = null), _.sibling.return = _.return, _ = _.sibling;
			}
			4 & S && (S = m.updateQueue) !== null && (x = S.retryQueue) !== null && (S.retryQueue = null, Qs(m, x));
			break;
		case 19: Ls(_, m), Vs(m), 4 & S && (S = m.updateQueue) !== null && (m.updateQueue = null, Qs(m, S));
		case 30:
		case 21:
	}
}
function Vs(m) {
	var _ = m.flags;
	if (2 & _) {
		try {
			for (var x, S = m.return; S !== null;) {
				if (ms(S)) {
					x = S;
					break;
				}
				S = S.return;
			}
			if (x == null) throw Error(oA(160));
			switch (x.tag) {
				case 27:
					var C = x.stateNode;
					ws(m, fs(m), C);
					break;
				case 5:
					var D = x.stateNode;
					32 & x.flags && (It(D, ""), x.flags &= -33), ws(m, fs(m), D);
					break;
				case 3:
				case 4:
					var O = x.stateNode.containerInfo;
					Es(m, fs(m), O);
					break;
				default: throw Error(oA(161));
			}
		} catch (_) {
			dc(m, m.return, _);
		}
		m.flags &= -3;
	}
	4096 & _ && (m.flags &= -4097);
}
function Rs(m) {
	if (1024 & m.subtreeFlags) for (m = m.child; m !== null;) {
		var _ = m;
		Rs(_), _.tag === 5 && 1024 & _.flags && _.stateNode.reset(), m = m.sibling;
	}
}
function Fs(m, _) {
	if (8772 & _.subtreeFlags) for (_ = _.child; _ !== null;) Cs(m, _.alternate, _), _ = _.sibling;
}
function Gs(m) {
	for (m = m.child; m !== null;) {
		var _ = m;
		switch (_.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				ss(4, _, _.return), Gs(_);
				break;
			case 1:
				gs(_, _.return);
				var x = _.stateNode;
				typeof x.componentWillUnmount == "function" && cs(_, _.return, x), Gs(_);
				break;
			case 27: Sd(_.stateNode);
			case 26:
			case 5:
				gs(_, _.return), Gs(_);
				break;
			case 22:
				_.memoizedState === null && Gs(_);
				break;
			default: Gs(_);
		}
		m = m.sibling;
	}
}
function zs(m, _, x) {
	for (x &&= !!(8772 & _.subtreeFlags), _ = _.child; _ !== null;) {
		var S = _.alternate, C = m, D = _, O = D.flags;
		switch (D.tag) {
			case 0:
			case 11:
			case 15:
				zs(C, D, x), os(4, D);
				break;
			case 1:
				if (zs(C, D, x), typeof (C = (S = D).stateNode).componentDidMount == "function") try {
					C.componentDidMount();
				} catch (m) {
					dc(S, S.return, m);
				}
				if ((C = (S = D).updateQueue) !== null) {
					var F = S.stateNode;
					try {
						var I = C.shared.hiddenCallbacks;
						if (I !== null) for (C.shared.hiddenCallbacks = null, C = 0; C < I.length; C++) gr(I[C], F);
					} catch (m) {
						dc(S, S.return, m);
					}
				}
				x && 64 & O && us(D), ds(D, D.return);
				break;
			case 27: bs(D);
			case 26:
			case 5:
				zs(C, D, x), x && S === null && 4 & O && ps(D), ds(D, D.return);
				break;
			case 12:
				zs(C, D, x);
				break;
			case 13:
				zs(C, D, x), x && 4 & O && Ts(C, D);
				break;
			case 22:
				D.memoizedState === null && zs(C, D, x), ds(D, D.return);
				break;
			case 30: break;
			default: zs(C, D, x);
		}
		_ = _.sibling;
	}
}
function Ks(m, _) {
	var x = null;
	m !== null && m.memoizedState !== null && m.memoizedState.cachePool !== null && (x = m.memoizedState.cachePool.pool), m = null, _.memoizedState !== null && _.memoizedState.cachePool !== null && (m = _.memoizedState.cachePool.pool), m !== x && (m != null && m.refCount++, x != null && Oi(x));
}
function Ps(m, _) {
	m = null, _.alternate !== null && (m = _.alternate.memoizedState.cache), (_ = _.memoizedState.cache) !== m && (_.refCount++, m != null && Oi(m));
}
function Ys(m, _, x, S) {
	if (10256 & _.subtreeFlags) for (_ = _.child; _ !== null;) Hs(m, _, x, S), _ = _.sibling;
}
function Hs(m, _, x, S) {
	var C = _.flags;
	switch (_.tag) {
		case 0:
		case 11:
		case 15:
			Ys(m, _, x, S), 2048 & C && os(9, _);
			break;
		case 1:
		case 13:
		default:
			Ys(m, _, x, S);
			break;
		case 3:
			Ys(m, _, x, S), 2048 & C && (m = null, _.alternate !== null && (m = _.alternate.memoizedState.cache), (_ = _.memoizedState.cache) !== m && (_.refCount++, m != null && Oi(m)));
			break;
		case 12:
			if (2048 & C) {
				Ys(m, _, x, S), m = _.stateNode;
				try {
					var D = _.memoizedProps, O = D.id, F = D.onPostCommit;
					typeof F == "function" && F(O, _.alternate === null ? "mount" : "update", m.passiveEffectDuration, -0);
				} catch (m) {
					dc(_, _.return, m);
				}
			} else Ys(m, _, x, S);
			break;
		case 23: break;
		case 22:
			D = _.stateNode, O = _.alternate, _.memoizedState === null ? 2 & D._visibility ? Ys(m, _, x, S) : (D._visibility |= 2, js(m, _, x, S, !!(10256 & _.subtreeFlags))) : 2 & D._visibility ? Ys(m, _, x, S) : _s(m, _), 2048 & C && Ks(O, _);
			break;
		case 24: Ys(m, _, x, S), 2048 & C && Ps(_.alternate, _);
	}
}
function js(m, _, x, S, C) {
	for (C &&= !!(10256 & _.subtreeFlags), _ = _.child; _ !== null;) {
		var D = m, O = _, F = x, I = S, L = O.flags;
		switch (O.tag) {
			case 0:
			case 11:
			case 15:
				js(D, O, F, I, C), os(8, O);
				break;
			case 23: break;
			case 22:
				var H = O.stateNode;
				O.memoizedState === null ? (H._visibility |= 2, js(D, O, F, I, C)) : 2 & H._visibility ? js(D, O, F, I, C) : _s(D, O), C && 2048 & L && Ks(O.alternate, O);
				break;
			case 24:
				js(D, O, F, I, C), C && 2048 & L && Ps(O.alternate, O);
				break;
			default: js(D, O, F, I, C);
		}
		_ = _.sibling;
	}
}
function _s(m, _) {
	if (10256 & _.subtreeFlags) for (_ = _.child; _ !== null;) {
		var x = m, S = _, C = S.flags;
		switch (S.tag) {
			case 22:
				_s(x, S), 2048 & C && Ks(S.alternate, S);
				break;
			case 24:
				_s(x, S), 2048 & C && Ps(S.alternate, S);
				break;
			default: _s(x, S);
		}
		_ = _.sibling;
	}
}
var hf = 8192;
function qs(m) {
	if (m.subtreeFlags & hf) for (m = m.child; m !== null;) Ws(m), m = m.sibling;
}
function Ws(m) {
	switch (m.tag) {
		case 26:
			qs(m), m.flags & hf && m.memoizedState !== null && function(m, _, x) {
				if (Gp === null) throw Error(oA(475));
				var S = Gp;
				if (!(_.type !== "stylesheet" || typeof x.media == "string" && !1 === matchMedia(x.media).matches || 4 & _.state.loading)) {
					if (_.instance === null) {
						var C = Nd(x.href), D = m.querySelector(Td(C));
						if (D) return (m = D._p) !== null && typeof m == "object" && typeof m.then == "function" && (S.count++, S = jd.bind(S), m.then(S, S)), _.state.loading |= 4, _.instance = D, void _e(D);
						D = m.ownerDocument || m, x = Qd(x), (C = Bp.get(C)) && Rd(x, C), _e(D = D.createElement("link"));
						var O = D;
						O._p = new Promise(function(m, _) {
							O.onload = m, O.onerror = _;
						}), td(D, "link", x), _.instance = D;
					}
					S.stylesheets === null && (S.stylesheets = /* @__PURE__ */ new Map()), S.stylesheets.set(_, m), (m = _.state.preload) && !(3 & _.state.loading) && (S.count++, _ = jd.bind(S), m.addEventListener("load", _), m.addEventListener("error", _));
				}
			}(mf, m.memoizedState, m.memoizedProps);
			break;
		case 5:
		default:
			qs(m);
			break;
		case 3:
		case 4:
			var _ = mf;
			mf = Cd(m.stateNode.containerInfo), qs(m), mf = _;
			break;
		case 22: m.memoizedState === null && ((_ = m.alternate) !== null && _.memoizedState !== null ? (_ = hf, hf = 16777216, qs(m), hf = _) : qs(m));
	}
}
function Zs(m) {
	var _ = m.alternate;
	if (_ !== null && (m = _.child) !== null) {
		_.child = null;
		do
			_ = m.sibling, m.sibling = null, m = _;
		while (m !== null);
	}
}
function Xs(m) {
	var _ = m.deletions;
	if (16 & m.flags) {
		if (_ !== null) for (var x = 0; x < _.length; x++) {
			var S = _[x];
			df = S, eu(S, m);
		}
		Zs(m);
	}
	if (10256 & m.subtreeFlags) for (m = m.child; m !== null;) $s(m), m = m.sibling;
}
function $s(m) {
	switch (m.tag) {
		case 0:
		case 11:
		case 15:
			Xs(m), 2048 & m.flags && ss(9, m, m.return);
			break;
		case 3:
		case 12:
		default:
			Xs(m);
			break;
		case 22:
			var _ = m.stateNode;
			m.memoizedState !== null && 2 & _._visibility && (m.return === null || m.return.tag !== 13) ? (_._visibility &= -3, Au(m)) : Xs(m);
	}
}
function Au(m) {
	var _ = m.deletions;
	if (16 & m.flags) {
		if (_ !== null) for (var x = 0; x < _.length; x++) {
			var S = _[x];
			df = S, eu(S, m);
		}
		Zs(m);
	}
	for (m = m.child; m !== null;) {
		switch ((_ = m).tag) {
			case 0:
			case 11:
			case 15:
				ss(8, _, _.return), Au(_);
				break;
			case 22:
				2 & (x = _.stateNode)._visibility && (x._visibility &= -3, Au(_));
				break;
			default: Au(_);
		}
		m = m.sibling;
	}
}
function eu(m, _) {
	for (; df !== null;) {
		var x = df;
		switch (x.tag) {
			case 0:
			case 11:
			case 15:
				ss(8, x, _);
				break;
			case 23:
			case 22:
				if (x.memoizedState !== null && x.memoizedState.cachePool !== null) {
					var S = x.memoizedState.cachePool.pool;
					S != null && S.refCount++;
				}
				break;
			case 24: Oi(x.memoizedState.cache);
		}
		if ((S = x.child) !== null) S.return = x, df = S;
		else A: for (x = m; df !== null;) {
			var C = (S = df).sibling, D = S.return;
			if (vs(S), S === x) {
				df = null;
				break A;
			}
			if (C !== null) {
				C.return = D, df = C;
				break A;
			}
			df = D;
		}
	}
}
var gf = { getCacheForType: function(m) {
	var _ = Bi(uu), x = _.data.get(m);
	return x === void 0 && (x = m(), _.data.set(m, x)), x;
} }, _f = typeof WeakMap == "function" ? WeakMap : Map, bf = 0, Sf = null, Cf = null, wf = 0, Tf = 0, Of = null, kf = !1, Af = !1, jf = !1, Mf = 0, Nf = 0, Pf = 0, Lf = 0, Bf = 0, Vf = 0, Hf = 0, Uf = null, Jf = null, Yf = !1, Qf = 0, ep = 1 / 0, tp = null, np = null, ap = 0, op = null, lp = null, up = 0, dp = 0, fp = null, mp = null, _p = 0, vp = null;
function Ou() {
	return 2 & bf && wf !== 0 ? wf & -wf : dn.T === null ? Te() : pu === 0 ? Nc() : pu;
}
function Vu() {
	Vf === 0 && (Vf = 536870912 & wf && !Zl ? 536870912 : Ie());
	var m = Id.current;
	return m !== null && (m.flags |= 32), Vf;
}
function Ru(m, _, x) {
	(m !== Sf || Tf !== 2 && Tf !== 9) && m.cancelPendingCommit === null || (Hu(m, 0), Ku(m, wf, Vf, !1)), ve(m, x), 2 & bf && m === Sf || (m === Sf && (!(2 & bf) && (Lf |= x), Nf === 4 && Ku(m, wf, Vf, !1)), Ic(m));
}
function Fu(m, _, x) {
	if (6 & bf) throw Error(oA(327));
	for (var S = !x && !(124 & _) && (_ & m.expiredLanes) === 0 || ye(m, _), C = S ? function(m, e) {
		var _ = bf;
		bf |= 2;
		var x = _u(), S = Ju();
		Sf !== m || wf !== e ? (tp = null, ep = kn() + 500, Hu(m, e)) : Af = ye(m, e);
		A: for (;;) try {
			if (Tf !== 0 && Cf !== null) {
				e = Cf;
				var C = Of;
				e: switch (Tf) {
					case 1:
						Tf = 0, Of = null, ec(m, e, C, 1);
						break;
					case 2:
					case 9:
						if (Zi(C)) {
							Tf = 0, Of = null, Ac(e);
							break;
						}
						e = function() {
							Tf !== 2 && Tf !== 9 || Sf !== m || (Tf = 7), Ic(m);
						}, C.then(e, e);
						break A;
					case 3:
						Tf = 7;
						break A;
					case 4:
						Tf = 5;
						break A;
					case 7:
						Zi(C) ? (Tf = 0, Of = null, Ac(e)) : (Tf = 0, Of = null, ec(m, e, C, 7));
						break;
					case 5:
						var D = null;
						switch (Cf.tag) {
							case 26: D = Cf.memoizedState;
							case 5:
							case 27:
								var O = Cf;
								if (!D || Pd(D)) {
									Tf = 0, Of = null;
									var F = O.sibling;
									if (F !== null) Cf = F;
									else {
										var I = O.return;
										I === null ? Cf = null : (Cf = I, tc(I));
									}
									break e;
								}
						}
						Tf = 0, Of = null, ec(m, e, C, 5);
						break;
					case 6:
						Tf = 0, Of = null, ec(m, e, C, 6);
						break;
					case 8:
						Yu(), Nf = 6;
						break A;
					default: throw Error(oA(462));
				}
			}
			Xu();
			break;
		} catch (_) {
			ju(m, _);
		}
		return ou = au = null, dn.H = x, dn.A = S, bf = _, Cf === null ? (Sf = null, wf = 0, Ma(), Nf) : 0;
	}(m, _) : Wu(m, _, !0), D = S;;) {
		if (C === 0) {
			Af && !S && Ku(m, _, 0, !1);
			break;
		}
		if (x = m.current.alternate, !D || zu(x)) {
			if (C === 2) {
				if (D = _, m.errorRecoveryDisabledLanes & D) var O = 0;
				else O = (O = -536870913 & m.pendingLanes) == 0 ? 536870912 & O ? 536870912 : 0 : O;
				if (O !== 0) {
					_ = O;
					A: {
						var F = m;
						C = Uf;
						var I = F.current.memoizedState.isDehydrated;
						if (I && (Hu(F, O).flags |= 256), (O = Wu(F, O, !1)) !== 2) {
							if (jf && !I) {
								F.errorRecoveryDisabledLanes |= D, Lf |= D, C = 4;
								break A;
							}
							D = Jf, Jf = C, D !== null && (Jf === null ? Jf = D : Jf.push.apply(Jf, D));
						}
						C = O;
					}
					if (D = !1, C !== 2) continue;
				}
			}
			if (C === 1) {
				Hu(m, 0), Ku(m, _, 0, !0);
				break;
			}
			A: {
				switch (S = m, D = C) {
					case 0:
					case 1: throw Error(oA(345));
					case 4: if ((4194048 & _) !== _) break;
					case 6:
						Ku(S, _, Vf, !kf);
						break A;
					case 2:
						Jf = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(oA(329));
				}
				if ((62914560 & _) === _ && 10 < (C = Qf + 300 - kn())) {
					if (Ku(S, _, Vf, !kf), ke(S, 0, !0) !== 0) break A;
					S.timeoutHandle = Fp(Gu.bind(null, S, x, Jf, tp, Yf, _, Vf, Lf, Hf, kf, D, 2, -0, 0), C);
				} else Gu(S, x, Jf, tp, Yf, _, Vf, Lf, Hf, kf, D, 0, -0, 0);
			}
			break;
		}
		C = Wu(m, _, !1), D = !1;
	}
	Ic(m);
}
function Gu(m, _, x, S, C, D, O, F, I, L, H, U, W, q) {
	if (m.timeoutHandle = -1, (8192 & (U = _.subtreeFlags) || !(16785408 & ~U)) && (Gp = {
		stylesheets: null,
		count: 0,
		unsuspend: Hd
	}, Ws(_), (U = function() {
		if (Gp === null) throw Error(oA(475));
		var m = Gp;
		return m.stylesheets && m.count === 0 && Jd(m, m.stylesheets), 0 < m.count ? function(_) {
			var x = setTimeout(function() {
				if (m.stylesheets && Jd(m, m.stylesheets), m.unsuspend) {
					var _ = m.unsuspend;
					m.unsuspend = null, _();
				}
			}, 6e4);
			return m.unsuspend = _, function() {
				m.unsuspend = null, clearTimeout(x);
			};
		} : null;
	}()) !== null)) return m.cancelPendingCommit = U(ac.bind(null, m, _, D, x, S, C, O, F, I, H, 1, W, q)), void Ku(m, D, O, !L);
	ac(m, _, D, x, S, C, O, F, I);
}
function zu(m) {
	for (var _ = m;;) {
		var x = _.tag;
		if ((x === 0 || x === 11 || x === 15) && 16384 & _.flags && (x = _.updateQueue) !== null && (x = x.stores) !== null) for (var S = 0; S < x.length; S++) {
			var C = x[S], D = C.getSnapshot;
			C = C.value;
			try {
				if (!ao(D(), C)) return !1;
			} catch {
				return !1;
			}
		}
		if (x = _.child, 16384 & _.subtreeFlags && x !== null) x.return = _, _ = x;
		else {
			if (_ === m) break;
			for (; _.sibling === null;) {
				if (_.return === null || _.return === m) return !0;
				_ = _.return;
			}
			_.sibling.return = _.return, _ = _.sibling;
		}
	}
	return !0;
}
function Ku(m, _, x, S) {
	_ &= ~Bf, _ &= ~Lf, m.suspendedLanes |= _, m.pingedLanes &= ~_, S && (m.warmLanes |= _), S = m.expirationTimes;
	for (var C = _; 0 < C;) {
		var D = 31 - Qn(C), O = 1 << D;
		S[D] = -1, C &= ~O;
	}
	x !== 0 && Be(m, x, _);
}
function Pu() {
	return !!(6 & bf) || (Uc(0), !1);
}
function Yu() {
	if (Cf !== null) {
		if (Tf === 0) var m = Cf.return;
		else ou = au = null, Fr(m = Cf), gd = null, _d = 0, m = Cf;
		for (; m !== null;) ls(m.alternate, m), m = m.return;
		Cf = null;
	}
}
function Hu(m, _) {
	var x = m.timeoutHandle;
	x !== -1 && (m.timeoutHandle = -1, Ip(x)), (x = m.cancelPendingCommit) !== null && (m.cancelPendingCommit = null, x()), Yu(), Sf = m, Cf = x = Ga(m.current, null), wf = _, Tf = 0, Of = null, kf = !1, Af = ye(m, _), jf = !1, Hf = Vf = Bf = Lf = Pf = Nf = 0, Jf = Uf = null, Yf = !1, 8 & _ && (_ |= 32 & _);
	var S = m.entangledLanes;
	if (S !== 0) for (m = m.entanglements, S &= _; 0 < S;) {
		var C = 31 - Qn(S), D = 1 << C;
		_ |= m[C], S &= ~D;
	}
	return Mf = _, Ma(), x;
}
function ju(m, _) {
	ku = null, dn.H = sd, _ === vu || _ === bu ? (_ = er(), Tf = 3) : _ === yu ? (_ = er(), Tf = 4) : Tf = _ === Yd ? 8 : typeof _ == "object" && _ && typeof _.then == "function" ? 6 : 1, Of = _, Cf === null && (Nf = 1, So(m, Ca(_, m.current)));
}
function _u() {
	var m = dn.H;
	return dn.H = sd, m === null ? sd : m;
}
function Ju() {
	var m = dn.A;
	return dn.A = gf, m;
}
function qu() {
	Nf = 4, kf || (4194048 & wf) !== wf && Id.current !== null || (Af = !0), !(134217727 & Pf) && !(134217727 & Lf) || Sf === null || Ku(Sf, wf, Vf, !1);
}
function Wu(m, _, x) {
	var S = bf;
	bf |= 2;
	var C = _u(), D = Ju();
	Sf === m && wf === _ || (tp = null, Hu(m, _)), _ = !1;
	var O = Nf;
	A: for (;;) try {
		if (Tf !== 0 && Cf !== null) {
			var F = Cf, I = Of;
			switch (Tf) {
				case 8:
					Yu(), O = 6;
					break A;
				case 3:
				case 2:
				case 9:
				case 6:
					Id.current === null && (_ = !0);
					var L = Tf;
					if (Tf = 0, Of = null, ec(m, F, I, L), x && Af) {
						O = 0;
						break A;
					}
					break;
				default: L = Tf, Tf = 0, Of = null, ec(m, F, I, L);
			}
		}
		Zu(), O = Nf;
		break;
	} catch (_) {
		ju(m, _);
	}
	return _ && m.shellSuspendCounter++, ou = au = null, bf = S, dn.H = C, dn.A = D, Cf === null && (Sf = null, wf = 0, Ma()), O;
}
function Zu() {
	for (; Cf !== null;) $u(Cf);
}
function Xu() {
	for (; Cf !== null && !En();) $u(Cf);
}
function $u(m) {
	var _ = $o(m.alternate, m, Mf);
	m.memoizedProps = m.pendingProps, _ === null ? tc(m) : Cf = _;
}
function Ac(m) {
	var _ = m, x = _.alternate;
	switch (_.tag) {
		case 15:
		case 0:
			_ = Ro(x, _, _.pendingProps, _.type, void 0, wf);
			break;
		case 11:
			_ = Ro(x, _, _.pendingProps, _.type.render, _.ref, wf);
			break;
		case 5: Fr(_);
		default: ls(x, _), _ = $o(x, _ = Cf = za(_, Mf), Mf);
	}
	m.memoizedProps = m.pendingProps, _ === null ? tc(m) : Cf = _;
}
function ec(m, _, x, S) {
	ou = au = null, Fr(_), gd = null, _d = 0;
	var C = _.return;
	try {
		if (function(m, _, x, S, C) {
			if (x.flags |= 32768, typeof S == "object" && S && typeof S.then == "function") {
				if ((_ = x.alternate) !== null && Ui(_, x, C, !0), (x = Id.current) !== null) {
					switch (x.tag) {
						case 13: return Bd === null ? qu() : x.alternate === null && Nf === 0 && (Nf = 3), x.flags &= -257, x.flags |= 65536, x.lanes = C, S === xu ? x.flags |= 16384 : ((_ = x.updateQueue) === null ? x.updateQueue = /* @__PURE__ */ new Set([S]) : _.add(S), gc(m, S, C)), !1;
						case 22: return x.flags |= 65536, S === xu ? x.flags |= 16384 : ((_ = x.updateQueue) === null ? (_ = {
							transitions: null,
							markerInstances: null,
							retryQueue: /* @__PURE__ */ new Set([S])
						}, x.updateQueue = _) : (x = _.retryQueue) === null ? _.retryQueue = /* @__PURE__ */ new Set([S]) : x.add(S), gc(m, S, C)), !1;
					}
					throw Error(oA(435, x.tag));
				}
				return gc(m, S, C), qu(), !1;
			}
			if (Zl) return (_ = Id.current) === null ? (S !== ru && fi(Ca(_ = Error(oA(423), { cause: S }), x)), (m = m.current.alternate).flags |= 65536, C &= -C, m.lanes |= C, S = Ca(S, x), sr(m, C = Uo(m.stateNode, S, C)), Nf !== 4 && (Nf = 2)) : (!(65536 & _.flags) && (_.flags |= 256), _.flags |= 65536, _.lanes = C, S !== ru && fi(Ca(m = Error(oA(422), { cause: S }), x))), !1;
			var D = Error(oA(520), { cause: S });
			if (D = Ca(D, x), Uf === null ? Uf = [D] : Uf.push(D), Nf !== 4 && (Nf = 2), _ === null) return !0;
			S = Ca(S, x), x = _;
			do {
				switch (x.tag) {
					case 3: return x.flags |= 65536, m = C & -C, x.lanes |= m, sr(x, m = Uo(x.stateNode, S, m)), !1;
					case 1: if (_ = x.type, D = x.stateNode, !(128 & x.flags || typeof _.getDerivedStateFromError != "function" && (D === null || typeof D.componentDidCatch != "function" || np !== null && np.has(D)))) return x.flags |= 65536, C &= -C, x.lanes |= C, vo(C = Co(C), m, x, S), sr(x, C), !1;
				}
				x = x.return;
			} while (x !== null);
			return !1;
		}(m, C, _, x, wf)) return Nf = 1, So(m, Ca(x, m.current)), void (Cf = null);
	} catch (_) {
		if (C !== null) throw Cf = C, _;
		Nf = 1, So(m, Ca(x, m.current)), Cf = null;
		return;
	}
	32768 & _.flags ? (Zl || S === 1 ? m = !0 : Af || 536870912 & wf ? m = !1 : (kf = m = !0, (S === 2 || S === 9 || S === 3 || S === 6) && (S = Id.current) !== null && S.tag === 13 && (S.flags |= 16384)), nc(_, m)) : tc(_);
}
function tc(m) {
	var _ = m;
	do {
		if (32768 & _.flags) return void nc(_, kf);
		m = _.return;
		var x = is(_.alternate, _, Mf);
		if (x !== null) return void (Cf = x);
		if ((_ = _.sibling) !== null) return void (Cf = _);
		Cf = _ = m;
	} while (_ !== null);
	Nf === 0 && (Nf = 5);
}
function nc(m, _) {
	do {
		var x = rs(m.alternate, m);
		if (x !== null) return x.flags &= 32767, void (Cf = x);
		if ((x = m.return) !== null && (x.flags |= 32768, x.subtreeFlags = 0, x.deletions = null), !_ && (m = m.sibling) !== null) return void (Cf = m);
		Cf = m = x;
	} while (m !== null);
	Nf = 6, Cf = null;
}
function ac(m, _, x, S, C, D, O, F, I) {
	m.cancelPendingCommit = null;
	do
		sc();
	while (ap !== 0);
	if (6 & bf) throw Error(oA(327));
	if (_ !== null) {
		if (_ === m.current) throw Error(oA(177));
		if (D = _.lanes | _.childLanes, function(m, _, x, S, C, D) {
			var O = m.pendingLanes;
			m.pendingLanes = x, m.suspendedLanes = 0, m.pingedLanes = 0, m.warmLanes = 0, m.expiredLanes &= x, m.entangledLanes &= x, m.errorRecoveryDisabledLanes &= x, m.shellSuspendCounter = 0;
			var F = m.entanglements, I = m.expirationTimes, L = m.hiddenUpdates;
			for (x = O & ~x; 0 < x;) {
				var H = 31 - Qn(x), U = 1 << H;
				F[H] = 0, I[H] = -1;
				var W = L[H];
				if (W !== null) for (L[H] = null, H = 0; H < W.length; H++) {
					var q = W[H];
					q !== null && (q.lane &= -536870913);
				}
				x &= ~U;
			}
			S !== 0 && Be(m, S, 0), D !== 0 && C === 0 && m.tag !== 0 && (m.suspendedLanes |= D & ~(O & ~_));
		}(m, x, D |= Dc, O, F, I), m === Sf && (Cf = Sf = null, wf = 0), lp = _, op = m, up = x, dp = D, fp = C, mp = S, 10256 & _.subtreeFlags || 10256 & _.flags ? (m.callbackNode = null, m.callbackPriority = 0, wn(zn, function() {
			return uc(), null;
		})) : (m.callbackNode = null, m.callbackPriority = 0), S = !!(13878 & _.flags), 13878 & _.subtreeFlags || S) {
			S = dn.T, dn.T = null, C = fn.p, fn.p = 2, O = bf, bf |= 4;
			try {
				(function(m, _) {
					if (m = m.containerInfo, Mp = Jp, na(m = ta(m))) {
						if ("selectionStart" in m) var x = {
							start: m.selectionStart,
							end: m.selectionEnd
						};
						else {
							var S = (x = (x = m.ownerDocument) && x.defaultView || window).getSelection && x.getSelection();
							if (S && S.rangeCount !== 0) {
								x = S.anchorNode;
								var C = S.anchorOffset, D = S.focusNode;
								S = S.focusOffset;
								var O = 0, F = -1, I = -1, L = 0, H = 0, U = m, W = null;
								A: for (;;) {
									for (var q; U !== x || C !== 0 && U.nodeType !== 3 || (F = O + C), U !== D || S !== 0 && U.nodeType !== 3 || (I = O + S), U.nodeType === 3 && (O += U.nodeValue.length), (q = U.firstChild) !== null;) W = U, U = q;
									for (;;) {
										if (U === m) break A;
										if (W === x && ++L === C && (F = O), W === D && ++H === S && (I = O), (q = U.nextSibling) !== null) break;
										W = (U = W).parentNode;
									}
									U = q;
								}
								x = F === -1 || I === -1 ? null : {
									start: F,
									end: I
								};
							} else x = null;
						}
						x ||= {
							start: 0,
							end: 0
						};
					} else x = null;
					for (Np = {
						focusedElem: m,
						selectionRange: x
					}, Jp = !1, df = _; df !== null;) if (m = (_ = df).child, 1024 & _.subtreeFlags && m !== null) m.return = _, df = m;
					else for (; df !== null;) {
						switch (D = (_ = df).alternate, m = _.flags, _.tag) {
							case 0:
							case 11:
							case 15:
							case 5:
							case 26:
							case 27:
							case 6:
							case 4:
							case 17: break;
							case 1:
								if (1024 & m && D !== null) {
									m = void 0, x = _, C = D.memoizedProps, D = D.memoizedState, S = x.stateNode;
									try {
										var ee = Eo(x.type, C);
										m = S.getSnapshotBeforeUpdate(ee, D), S.__reactInternalSnapshotBeforeUpdate = m;
									} catch (m) {
										dc(x, x.return, m);
									}
								}
								break;
							case 3:
								if (1024 & m) {
									if ((x = (m = _.stateNode.containerInfo).nodeType) === 9) fd(m);
									else if (x === 1) switch (m.nodeName) {
										case "HEAD":
										case "HTML":
										case "BODY":
											fd(m);
											break;
										default: m.textContent = "";
									}
								}
								break;
							default: if (1024 & m) throw Error(oA(163));
						}
						if ((m = _.sibling) !== null) {
							m.return = _.return, df = m;
							break;
						}
						df = _.return;
					}
				})(m, _);
			} finally {
				bf = O, fn.p = C, dn.T = S;
			}
		}
		ap = 1, ic(), rc(), lc();
	}
}
function ic() {
	if (ap === 1) {
		ap = 0;
		var m = op, _ = lp, x = !!(13878 & _.flags);
		if (13878 & _.subtreeFlags || x) {
			x = dn.T, dn.T = null;
			var S = fn.p;
			fn.p = 2;
			var C = bf;
			bf |= 4;
			try {
				Os(_, m);
				var D = Np, O = ta(m.containerInfo), F = D.focusedElem, I = D.selectionRange;
				if (O !== F && F && F.ownerDocument && ea(F.ownerDocument.documentElement, F)) {
					if (I !== null && na(F)) {
						var L = I.start, H = I.end;
						if (H === void 0 && (H = L), "selectionStart" in F) F.selectionStart = L, F.selectionEnd = Math.min(H, F.value.length);
						else {
							var U = F.ownerDocument || document, W = U && U.defaultView || window;
							if (W.getSelection) {
								var q = W.getSelection(), ee = F.textContent.length, te = Math.min(I.start, ee), J = I.end === void 0 ? te : Math.min(I.end, ee);
								!q.extend && te > J && (O = J, J = te, te = O);
								var ne = Aa(F, te), re = Aa(F, J);
								if (ne && re && (q.rangeCount !== 1 || q.anchorNode !== ne.node || q.anchorOffset !== ne.offset || q.focusNode !== re.node || q.focusOffset !== re.offset)) {
									var Q = U.createRange();
									Q.setStart(ne.node, ne.offset), q.removeAllRanges(), te > J ? (q.addRange(Q), q.extend(re.node, re.offset)) : (Q.setEnd(re.node, re.offset), q.addRange(Q));
								}
							}
						}
					}
					for (U = [], q = F; q = q.parentNode;) q.nodeType === 1 && U.push({
						element: q,
						left: q.scrollLeft,
						top: q.scrollTop
					});
					for (typeof F.focus == "function" && F.focus(), F = 0; F < U.length; F++) {
						var ie = U[F];
						ie.element.scrollLeft = ie.left, ie.element.scrollTop = ie.top;
					}
				}
				Jp = !!Mp, Np = Mp = null;
			} finally {
				bf = C, fn.p = S, dn.T = x;
			}
		}
		m.current = _, ap = 2;
	}
}
function rc() {
	if (ap === 2) {
		ap = 0;
		var m = op, _ = lp, x = !!(8772 & _.flags);
		if (8772 & _.subtreeFlags || x) {
			x = dn.T, dn.T = null;
			var S = fn.p;
			fn.p = 2;
			var C = bf;
			bf |= 4;
			try {
				Cs(m, _.alternate, _);
			} finally {
				bf = C, fn.p = S, dn.T = x;
			}
		}
		ap = 3;
	}
}
function lc() {
	if (ap === 4 || ap === 3) {
		ap = 0, On();
		var m = op, _ = lp, x = up, S = mp;
		10256 & _.subtreeFlags || 10256 & _.flags ? ap = 5 : (ap = 0, lp = op = null, oc(m, m.pendingLanes));
		var C = m.pendingLanes;
		if (C === 0 && (np = null), Ne(x), _ = _.stateNode, Zn && typeof Zn.onCommitFiberRoot == "function") try {
			Zn.onCommitFiberRoot(Yn, _, void 0, !(128 & ~_.current.flags));
		} catch {}
		if (S !== null) {
			_ = dn.T, C = fn.p, fn.p = 2, dn.T = null;
			try {
				for (var D = m.onRecoverableError, O = 0; O < S.length; O++) {
					var F = S[O];
					D(F.value, { componentStack: F.stack });
				}
			} finally {
				dn.T = _, fn.p = C;
			}
		}
		3 & up && sc(), Ic(m), C = m.pendingLanes, 4194090 & x && 42 & C ? m === vp ? _p++ : (_p = 0, vp = m) : _p = 0, Uc(0);
	}
}
function oc(m, _) {
	(m.pooledCacheLanes &= _) === 0 && (_ = m.pooledCache) != null && (m.pooledCache = null, Oi(_));
}
function sc(m) {
	return ic(), rc(), lc(), uc();
}
function uc() {
	if (ap !== 5) return !1;
	var m = op, _ = dp;
	dp = 0;
	var x = Ne(up), S = dn.T, C = fn.p;
	try {
		fn.p = 32 > x ? 32 : x, dn.T = null, x = fp, fp = null;
		var D = op, O = up;
		if (ap = 0, lp = op = null, up = 0, 6 & bf) throw Error(oA(331));
		var F = bf;
		if (bf |= 4, $s(D.current), Hs(D, D.current, O, x), bf = F, Uc(0), Zn && typeof Zn.onPostCommitFiberRoot == "function") try {
			Zn.onPostCommitFiberRoot(Yn, D);
		} catch {}
		return !0;
	} finally {
		fn.p = C, dn.T = S, oc(m, _);
	}
}
function cc(m, _, x) {
	_ = Ca(x, _), (m = lr(m, _ = Uo(m.stateNode, _, 2), 2)) !== null && (ve(m, 2), Ic(m));
}
function dc(m, _, x) {
	if (m.tag === 3) cc(m, m, x);
	else for (; _ !== null;) {
		if (_.tag === 3) {
			cc(_, m, x);
			break;
		}
		if (_.tag === 1) {
			var S = _.stateNode;
			if (typeof _.type.getDerivedStateFromError == "function" || typeof S.componentDidCatch == "function" && (np === null || !np.has(S))) {
				m = Ca(x, m), (S = lr(_, x = Co(2), 2)) !== null && (vo(x, S, _, m), ve(S, 2), Ic(S));
				break;
			}
		}
		_ = _.return;
	}
}
function gc(m, _, x) {
	var S = m.pingCache;
	if (S === null) {
		S = m.pingCache = new _f();
		var C = /* @__PURE__ */ new Set();
		S.set(_, C);
	} else (C = S.get(_)) === void 0 && (C = /* @__PURE__ */ new Set(), S.set(_, C));
	C.has(x) || (jf = !0, C.add(x), m = pc.bind(null, m, _, x), _.then(m, m));
}
function pc(m, _, x) {
	var S = m.pingCache;
	S !== null && S.delete(_), m.pingedLanes |= m.suspendedLanes & x, m.warmLanes &= ~x, Sf === m && (wf & x) === x && (Nf === 4 || Nf === 3 && (62914560 & wf) === wf && 300 > kn() - Qf ? !(2 & bf) && Hu(m, 0) : Bf |= x, Hf === wf && (Hf = 0)), Ic(m);
}
function hc(m, _) {
	_ === 0 && (_ = Ue()), (m = Qa(m, _)) !== null && (ve(m, _), Ic(m));
}
function mc(m) {
	var _ = m.memoizedState, x = 0;
	_ !== null && (x = _.retryLane), hc(m, x);
}
function fc(m, _) {
	var x = 0;
	switch (m.tag) {
		case 13:
			var S = m.stateNode, C = m.memoizedState;
			C !== null && (x = C.retryLane);
			break;
		case 19:
			S = m.stateNode;
			break;
		case 22:
			S = m.stateNode._retryCache;
			break;
		default: throw Error(oA(314));
	}
	S !== null && S.delete(_), hc(m, x);
}
var yp = null, bp = null, xp = !1, Sp = !1, Cp = !1, wp = 0;
function Ic(m) {
	m !== bp && m.next === null && (bp === null ? yp = bp = m : bp = bp.next = m), Sp = !0, xp || (xp = !0, Rp(function() {
		6 & bf ? wn(Pn, Cc) : vc();
	}));
}
function Uc(m, _) {
	if (!Cp && Sp) {
		Cp = !0;
		do
			for (var x = !1, S = yp; S !== null;) {
				if (m !== 0) {
					var C = S.pendingLanes;
					if (C === 0) var D = 0;
					else {
						var O = S.suspendedLanes, F = S.pingedLanes;
						D = (1 << 31 - Qn(42 | m) + 1) - 1, D = 201326741 & (D &= C & ~(O & ~F)) ? 201326741 & D | 1 : D ? 2 | D : 0;
					}
					D !== 0 && (x = !0, Mc(S, D));
				} else D = wf, !(3 & (D = ke(S, S === Sf ? D : 0, S.cancelPendingCommit !== null || S.timeoutHandle !== -1))) || ye(S, D) || (x = !0, Mc(S, D));
				S = S.next;
			}
		while (x);
		Cp = !1;
	}
}
function Cc() {
	vc();
}
function vc() {
	Sp = xp = !1;
	var m, _ = 0;
	wp !== 0 && (((m = window.event) && m.type === "popstate" ? m !== Pp && (Pp = m, 1) : (Pp = null, 0)) && (_ = wp), wp = 0);
	for (var x = kn(), S = null, C = yp; C !== null;) {
		var D = C.next, O = Bc(C, x);
		O === 0 ? (C.next = null, S === null ? yp = D : S.next = D, D === null && (bp = S)) : (S = C, (_ !== 0 || 3 & O) && (Sp = !0)), C = D;
	}
	Uc(_);
}
function Bc(m, _) {
	for (var x = m.suspendedLanes, S = m.pingedLanes, C = m.expirationTimes, D = -62914561 & m.pendingLanes; 0 < D;) {
		var O = 31 - Qn(D), F = 1 << O, I = C[O];
		I === -1 ? (F & x) !== 0 && (F & S) === 0 || (C[O] = Se(F, _)) : I <= _ && (m.expiredLanes |= F), D &= ~F;
	}
	if (x = wf, x = ke(m, m === (_ = Sf) ? x : 0, m.cancelPendingCommit !== null || m.timeoutHandle !== -1), S = m.callbackNode, x === 0 || m === _ && (Tf === 2 || Tf === 9) || m.cancelPendingCommit !== null) return S !== null && S !== null && Tn(S), m.callbackNode = null, m.callbackPriority = 0;
	if (!(3 & x) || ye(m, x)) {
		if ((_ = x & -x) === m.callbackPriority) return _;
		switch (S !== null && Tn(S), Ne(x)) {
			case 2:
			case 8:
				x = In;
				break;
			case 32:
			default:
				x = zn;
				break;
			case 268435456: x = Vn;
		}
		return S = xc.bind(null, m), x = wn(x, S), m.callbackPriority = _, m.callbackNode = x, _;
	}
	return S !== null && S !== null && Tn(S), m.callbackPriority = 2, m.callbackNode = null, 2;
}
function xc(m, _) {
	if (ap !== 0 && ap !== 5) return m.callbackNode = null, m.callbackPriority = 0, null;
	var x = m.callbackNode;
	if (sc() && m.callbackNode !== x) return null;
	var S = wf;
	return (S = ke(m, m === Sf ? S : 0, m.cancelPendingCommit !== null || m.timeoutHandle !== -1)) === 0 ? null : (Fu(m, S, _), Bc(m, kn()), m.callbackNode != null && m.callbackNode === x ? xc.bind(null, m) : null);
}
function Mc(m, _) {
	if (sc()) return null;
	Fu(m, _, !0);
}
function Nc() {
	return wp === 0 && (wp = Ie()), wp;
}
function Tc(m) {
	return m == null || typeof m == "symbol" || typeof m == "boolean" ? null : typeof m == "function" ? m : Nt("" + m);
}
function Qc(m, _) {
	var x = _.ownerDocument.createElement("input");
	return x.name = _.name, x.value = _.value, m.id && x.setAttribute("form", m.id), _.parentNode.insertBefore(x, _), m = new FormData(m), x.parentNode.removeChild(x), m;
}
for (var Tp = 0; Tp < bc.length; Tp++) {
	var Ep = bc[Tp];
	Ia(Ep.toLowerCase(), "on" + (Ep[0].toUpperCase() + Ep.slice(1)));
}
Ia(Ss, "onAnimationEnd"), Ia(Ds, "onAnimationIteration"), Ia(ks, "onAnimationStart"), Ia("dblclick", "onDoubleClick"), Ia("focusin", "onFocus"), Ia("focusout", "onBlur"), Ia(Is, "onTransitionRun"), Ia(Bs, "onTransitionStart"), Ia(Us, "onTransitionCancel"), Ia(Js, "onTransitionEnd"), Ze("onMouseEnter", ["mouseout", "mouseover"]), Ze("onMouseLeave", ["mouseout", "mouseover"]), Ze("onPointerEnter", ["pointerout", "pointerover"]), Ze("onPointerLeave", ["pointerout", "pointerover"]), We("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), We("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), We("onBeforeInput", [
	"compositionend",
	"keypress",
	"textInput",
	"paste"
]), We("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), We("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), We("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Dp = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Op = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Dp));
function Rc(m, _) {
	_ = !!(4 & _);
	for (var x = 0; x < m.length; x++) {
		var S = m[x], C = S.event;
		S = S.listeners;
		A: {
			var D = void 0;
			if (_) for (var O = S.length - 1; 0 <= O; O--) {
				var F = S[O], I = F.instance, L = F.currentTarget;
				if (F = F.listener, I !== D && C.isPropagationStopped()) break A;
				D = F, C.currentTarget = L;
				try {
					D(C);
				} catch (m) {
					Gd(m);
				}
				C.currentTarget = null, D = I;
			}
			else for (O = 0; O < S.length; O++) {
				if (I = (F = S[O]).instance, L = F.currentTarget, F = F.listener, I !== D && C.isPropagationStopped()) break A;
				D = F, C.currentTarget = L;
				try {
					D(C);
				} catch (m) {
					Gd(m);
				}
				C.currentTarget = null, D = I;
			}
		}
	}
}
function Fc(m, _) {
	var x = _[Sr];
	x === void 0 && (x = _[Sr] = /* @__PURE__ */ new Set());
	var S = m + "__bubble";
	x.has(S) || (Pc(_, m, 2, !1), x.add(S));
}
function Gc(m, _, x) {
	var S = 0;
	_ && (S |= 4), Pc(x, m, S, _);
}
var kp = "_reactListening" + Math.random().toString(36).slice(2);
function Kc(m) {
	if (!m[kp]) {
		m[kp] = !0, Ir.forEach(function(_) {
			_ !== "selectionchange" && (Op.has(_) || Gc(_, !1, m), Gc(_, !0, m));
		});
		var _ = m.nodeType === 9 ? m : m.ownerDocument;
		_ === null || _[kp] || (_[kp] = !0, Gc("selectionchange", !1, _));
	}
}
function Pc(m, _, x, S) {
	switch (cg(_)) {
		case 2:
			var C = ig;
			break;
		case 8:
			C = rg;
			break;
		default: C = lg;
	}
	x = C.bind(null, _, x, m), C = void 0, !Fi || _ !== "touchstart" && _ !== "touchmove" && _ !== "wheel" || (C = !0), S ? C === void 0 ? m.addEventListener(_, x, !0) : m.addEventListener(_, x, {
		capture: !0,
		passive: C
	}) : C === void 0 ? m.addEventListener(_, x, !1) : m.addEventListener(_, x, { passive: C });
}
function Yc(m, _, x, S, C) {
	var D = S;
	if (!(1 & _ || 2 & _ || S === null)) A: for (;;) {
		if (S === null) return;
		var O = S.tag;
		if (O === 3 || O === 4) {
			var F = S.stateNode.containerInfo;
			if (F === C) break;
			if (O === 4) for (O = S.return; O !== null;) {
				var I = O.tag;
				if ((I === 3 || I === 4) && O.stateNode.containerInfo === C) return;
				O = O.return;
			}
			for (; F !== null;) {
				if ((O = Pe(F)) === null) return;
				if ((I = O.tag) === 5 || I === 6 || I === 26 || I === 27) {
					S = D = O;
					continue A;
				}
				F = F.parentNode;
			}
		}
		S = S.return;
	}
	Rt(function() {
		var S = D, C = Qt(x), O = [];
		A: {
			var F = yc.get(m);
			if (F !== void 0) {
				var I = Qi, L = m;
				switch (m) {
					case "keypress": if (_t(x) === 0) break A;
					case "keydown":
					case "keyup":
						I = va;
						break;
					case "focusin":
						L = "focus", I = la;
						break;
					case "focusout":
						L = "blur", I = la;
						break;
					case "beforeblur":
					case "afterblur":
						I = la;
						break;
					case "click": if (x.button === 2) break A;
					case "auxclick":
					case "dblclick":
					case "mousedown":
					case "mousemove":
					case "mouseup":
					case "mouseout":
					case "mouseover":
					case "contextmenu":
						I = oa;
						break;
					case "drag":
					case "dragend":
					case "dragenter":
					case "dragexit":
					case "dragleave":
					case "dragover":
					case "dragstart":
					case "drop":
						I = ca;
						break;
					case "touchcancel":
					case "touchend":
					case "touchmove":
					case "touchstart":
						I = ba;
						break;
					case Ss:
					case Ds:
					case ks:
						I = da;
						break;
					case Js:
						I = xa;
						break;
					case "scroll":
					case "scrollend":
						I = ia;
						break;
					case "wheel":
						I = Sa;
						break;
					case "copy":
					case "cut":
					case "paste":
						I = fa;
						break;
					case "gotpointercapture":
					case "lostpointercapture":
					case "pointercancel":
					case "pointerdown":
					case "pointermove":
					case "pointerout":
					case "pointerover":
					case "pointerup":
						I = ya;
						break;
					case "toggle":
					case "beforetoggle": I = wa;
				}
				var H = !!(4 & _), U = !H && (m === "scroll" || m === "scrollend"), W = H ? F === null ? null : F + "Capture" : F;
				H = [];
				for (var q, ee = S; ee !== null;) {
					var te = ee;
					if (q = te.stateNode, (te = te.tag) !== 5 && te !== 26 && te !== 27 || q === null || W === null || (te = Ft(ee, W)) != null && H.push(Hc(ee, te, q)), U) break;
					ee = ee.return;
				}
				0 < H.length && (F = new I(F, L, null, x, C), O.push({
					event: F,
					listeners: H
				}));
			}
		}
		if (!(7 & _)) {
			if (I = m === "mouseout" || m === "pointerout", (!(F = m === "mouseover" || m === "pointerover") || x === Ti || !(L = x.relatedTarget || x.fromElement) || !Pe(L) && !L[xr]) && (I || F) && (F = C.window === C ? C : (F = C.ownerDocument) ? F.defaultView || F.parentWindow : window, I ? (I = S, (L = (L = x.relatedTarget || x.toElement) ? Pe(L) : null) !== null && (U = uA(L), H = L.tag, L !== U || H !== 5 && H !== 27 && H !== 6) && (L = null)) : (I = null, L = S), I !== L)) {
				if (H = oa, te = "onMouseLeave", W = "onMouseEnter", ee = "mouse", m !== "pointerout" && m !== "pointerover" || (H = ya, te = "onPointerLeave", W = "onPointerEnter", ee = "pointer"), U = I == null ? F : He(I), q = L == null ? F : He(L), (F = new H(te, ee + "leave", I, x, C)).target = U, F.relatedTarget = q, te = null, Pe(C) === S && ((H = new H(W, ee + "enter", L, x, C)).target = q, H.relatedTarget = U, te = H), U = te, I && L) A: {
					for (W = L, ee = 0, q = H = I; q; q = _c(q)) ee++;
					for (q = 0, te = W; te; te = _c(te)) q++;
					for (; 0 < ee - q;) H = _c(H), ee--;
					for (; 0 < q - ee;) W = _c(W), q--;
					for (; ee--;) {
						if (H === W || W !== null && H === W.alternate) break A;
						H = _c(H), W = _c(W);
					}
					H = null;
				}
				else H = null;
				I !== null && Jc(O, F, I, H, !1), L !== null && U !== null && Jc(O, U, L, H, !0);
			}
			if ((I = (F = S ? He(S) : window).nodeName && F.nodeName.toLowerCase()) === "select" || I === "input" && F.type === "file") var J = Gn;
			else if (Ln(F)) {
				if ($a) J = Wn;
				else {
					J = Jn;
					var ne = _n;
				}
			} else !(I = F.nodeName) || I.toLowerCase() !== "input" || F.type !== "checkbox" && F.type !== "radio" ? S && Bt(S.elementType) && (J = Gn) : J = qn;
			switch ((J &&= J(m, S)) ? Dn(O, J, x, C) : (ne && ne(m, F, S), m === "focusout" && S && F.type === "number" && S.memoizedProps.value != null && bt(F, "number", F.value)), ne = S ? He(S) : window, m) {
				case "focusin":
					(Ln(ne) || ne.contentEditable === "true") && (ho = ne, xo = S, wo = null);
					break;
				case "focusout":
					wo = xo = ho = null;
					break;
				case "mousedown":
					zo = !0;
					break;
				case "contextmenu":
				case "mouseup":
				case "dragend":
					zo = !1, sa(O, x, C);
					break;
				case "selectionchange": if (co) break;
				case "keydown":
				case "keyup": sa(O, x, C);
			}
			var re;
			if (Oa) A: {
				switch (m) {
					case "compositionstart":
						var Q = "onCompositionStart";
						break A;
					case "compositionend":
						Q = "onCompositionEnd";
						break A;
					case "compositionupdate":
						Q = "onCompositionUpdate";
						break A;
				}
				Q = void 0;
			}
			else qa ? Mn(m, x) && (Q = "onCompositionEnd") : m === "keydown" && x.keyCode === 229 && (Q = "onCompositionStart");
			Q && (Ba && x.locale !== "ko" && (qa || Q !== "onCompositionStart" ? Q === "onCompositionEnd" && qa && (re = jt()) : (Vi = "value" in (Ri = C) ? Ri.value : Ri.textContent, qa = !0)), 0 < (ne = jc(S, Q)).length && (Q = new ma(Q, m, null, x, C), O.push({
				event: Q,
				listeners: ne
			}), (re || (re = Nn(x)) !== null) && (Q.data = re))), (re = ja ? function(m, _) {
				switch (m) {
					case "compositionend": return Nn(_);
					case "keypress": return _.which === 32 ? (Wa = !0, Ua) : null;
					case "textInput": return (m = _.data) === Ua && Wa ? null : m;
					default: return null;
				}
			}(m, x) : function(m, _) {
				if (qa) return m === "compositionend" || !Oa && Mn(m, _) ? (m = jt(), Wi = Vi = Ri = null, qa = !1, m) : null;
				switch (m) {
					case "paste":
					default: return null;
					case "keypress":
						if (!(_.ctrlKey || _.altKey || _.metaKey) || _.ctrlKey && _.altKey) {
							if (_.char && 1 < _.char.length) return _.char;
							if (_.which) return String.fromCharCode(_.which);
						}
						return null;
					case "compositionend": return Ba && _.locale !== "ko" ? null : _.data;
				}
			}(m, x)) && 0 < (Q = jc(S, "onBeforeInput")).length && (ne = new ma("onBeforeInput", "beforeinput", null, x, C), O.push({
				event: ne,
				listeners: Q
			}), ne.data = re), function(m, _, x, S, C) {
				if (_ === "submit" && x && x.stateNode === C) {
					var D = Tc((C[br] || null).action), O = S.submitter;
					O && (_ = (_ = O[br] || null) ? Tc(_.formAction) : O.getAttribute("formAction")) !== null && (D = _, O = null);
					var F = new Qi("action", "action", null, S, C);
					m.push({
						event: F,
						listeners: [{
							instance: null,
							listener: function() {
								if (S.defaultPrevented) {
									if (wp !== 0) {
										var m = O ? Qc(C, O) : new FormData(C);
										Tl(x, {
											pending: !0,
											data: m,
											method: C.method,
											action: D
										}, null, m);
									}
								} else typeof D == "function" && (F.preventDefault(), m = O ? Qc(C, O) : new FormData(C), Tl(x, {
									pending: !0,
									data: m,
									method: C.method,
									action: D
								}, D, m));
							},
							currentTarget: C
						}]
					});
				}
			}(O, m, S, x, C);
		}
		Rc(O, _);
	});
}
function Hc(m, _, x) {
	return {
		instance: m,
		listener: _,
		currentTarget: x
	};
}
function jc(m, _) {
	for (var x = _ + "Capture", S = []; m !== null;) {
		var C = m, D = C.stateNode;
		if ((C = C.tag) !== 5 && C !== 26 && C !== 27 || D === null || ((C = Ft(m, x)) != null && S.unshift(Hc(m, C, D)), (C = Ft(m, _)) != null && S.push(Hc(m, C, D))), m.tag === 3) return S;
		m = m.return;
	}
	return [];
}
function _c(m) {
	if (m === null) return null;
	do
		m = m.return;
	while (m && m.tag !== 5 && m.tag !== 27);
	return m || null;
}
function Jc(m, _, x, S, C) {
	for (var D = _._reactName, O = []; x !== null && x !== S;) {
		var F = x, I = F.alternate, L = F.stateNode;
		if (F = F.tag, I !== null && I === S) break;
		F !== 5 && F !== 26 && F !== 27 || L === null || (I = L, C ? (L = Ft(x, D)) != null && O.unshift(Hc(x, L, I)) : C || (L = Ft(x, D)) != null && O.push(Hc(x, L, I))), x = x.return;
	}
	O.length !== 0 && m.push({
		event: _,
		listeners: O
	});
}
var Ap = /\r\n?/g, jp = /\u0000|\uFFFD/g;
function Zc(m) {
	return (typeof m == "string" ? m : "" + m).replace(Ap, "\n").replace(jp, "");
}
function Xc(m, _) {
	return _ = Zc(_), Zc(m) === _;
}
function $c() {}
function Ad(m, _, x, S, C, D) {
	switch (x) {
		case "children":
			typeof S == "string" ? _ === "body" || _ === "textarea" && S === "" || It(m, S) : (typeof S == "number" || typeof S == "bigint") && _ !== "body" && It(m, "" + S);
			break;
		case "className":
			at(m, "class", S);
			break;
		case "tabIndex":
			at(m, "tabindex", S);
			break;
		case "dir":
		case "role":
		case "viewBox":
		case "width":
		case "height":
			at(m, x, S);
			break;
		case "style":
			vt(m, S, D);
			break;
		case "data": if (_ !== "object") {
			at(m, "data", S);
			break;
		}
		case "src":
		case "href":
			if (S === "" && (_ !== "a" || x !== "href")) {
				m.removeAttribute(x);
				break;
			}
			if (S == null || typeof S == "function" || typeof S == "symbol" || typeof S == "boolean") {
				m.removeAttribute(x);
				break;
			}
			S = Nt("" + S), m.setAttribute(x, S);
			break;
		case "action":
		case "formAction":
			if (typeof S == "function") {
				m.setAttribute(x, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
				break;
			}
			if (typeof D == "function" && (x === "formAction" ? (_ !== "input" && Ad(m, _, "name", C.name, C, null), Ad(m, _, "formEncType", C.formEncType, C, null), Ad(m, _, "formMethod", C.formMethod, C, null), Ad(m, _, "formTarget", C.formTarget, C, null)) : (Ad(m, _, "encType", C.encType, C, null), Ad(m, _, "method", C.method, C, null), Ad(m, _, "target", C.target, C, null))), S == null || typeof S == "symbol" || typeof S == "boolean") {
				m.removeAttribute(x);
				break;
			}
			S = Nt("" + S), m.setAttribute(x, S);
			break;
		case "onClick":
			S != null && (m.onclick = $c);
			break;
		case "onScroll":
			S != null && Fc("scroll", m);
			break;
		case "onScrollEnd":
			S != null && Fc("scrollend", m);
			break;
		case "dangerouslySetInnerHTML":
			if (S != null) {
				if (typeof S != "object" || !("__html" in S)) throw Error(oA(61));
				if ((x = S.__html) != null) {
					if (C.children != null) throw Error(oA(60));
					m.innerHTML = x;
				}
			}
			break;
		case "multiple":
			m.multiple = S && typeof S != "function" && typeof S != "symbol";
			break;
		case "muted":
			m.muted = S && typeof S != "function" && typeof S != "symbol";
			break;
		case "suppressContentEditableWarning":
		case "suppressHydrationWarning":
		case "defaultValue":
		case "defaultChecked":
		case "innerHTML":
		case "ref":
		case "autoFocus": break;
		case "xlinkHref":
			if (S == null || typeof S == "function" || typeof S == "boolean" || typeof S == "symbol") {
				m.removeAttribute("xlink:href");
				break;
			}
			x = Nt("" + S), m.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", x);
			break;
		case "contentEditable":
		case "spellCheck":
		case "draggable":
		case "value":
		case "autoReverse":
		case "externalResourcesRequired":
		case "focusable":
		case "preserveAlpha":
			S != null && typeof S != "function" && typeof S != "symbol" ? m.setAttribute(x, "" + S) : m.removeAttribute(x);
			break;
		case "inert":
		case "allowFullScreen":
		case "async":
		case "autoPlay":
		case "controls":
		case "default":
		case "defer":
		case "disabled":
		case "disablePictureInPicture":
		case "disableRemotePlayback":
		case "formNoValidate":
		case "hidden":
		case "loop":
		case "noModule":
		case "noValidate":
		case "open":
		case "playsInline":
		case "readOnly":
		case "required":
		case "reversed":
		case "scoped":
		case "seamless":
		case "itemScope":
			S && typeof S != "function" && typeof S != "symbol" ? m.setAttribute(x, "") : m.removeAttribute(x);
			break;
		case "capture":
		case "download":
			!0 === S ? m.setAttribute(x, "") : !1 !== S && S != null && typeof S != "function" && typeof S != "symbol" ? m.setAttribute(x, S) : m.removeAttribute(x);
			break;
		case "cols":
		case "rows":
		case "size":
		case "span":
			S != null && typeof S != "function" && typeof S != "symbol" && !isNaN(S) && 1 <= S ? m.setAttribute(x, S) : m.removeAttribute(x);
			break;
		case "rowSpan":
		case "start":
			S == null || typeof S == "function" || typeof S == "symbol" || isNaN(S) ? m.removeAttribute(x) : m.setAttribute(x, S);
			break;
		case "popover":
			Fc("beforetoggle", m), Fc("toggle", m), nt(m, "popover", S);
			break;
		case "xlinkActuate":
			it(m, "http://www.w3.org/1999/xlink", "xlink:actuate", S);
			break;
		case "xlinkArcrole":
			it(m, "http://www.w3.org/1999/xlink", "xlink:arcrole", S);
			break;
		case "xlinkRole":
			it(m, "http://www.w3.org/1999/xlink", "xlink:role", S);
			break;
		case "xlinkShow":
			it(m, "http://www.w3.org/1999/xlink", "xlink:show", S);
			break;
		case "xlinkTitle":
			it(m, "http://www.w3.org/1999/xlink", "xlink:title", S);
			break;
		case "xlinkType":
			it(m, "http://www.w3.org/1999/xlink", "xlink:type", S);
			break;
		case "xmlBase":
			it(m, "http://www.w3.org/XML/1998/namespace", "xml:base", S);
			break;
		case "xmlLang":
			it(m, "http://www.w3.org/XML/1998/namespace", "xml:lang", S);
			break;
		case "xmlSpace":
			it(m, "http://www.w3.org/XML/1998/namespace", "xml:space", S);
			break;
		case "is":
			nt(m, "is", S);
			break;
		case "innerText":
		case "textContent": break;
		default: (!(2 < x.length) || x[0] !== "o" && x[0] !== "O" || x[1] !== "n" && x[1] !== "N") && nt(m, x = bi.get(x) || x, S);
	}
}
function ed(m, _, x, S, C, D) {
	switch (x) {
		case "style":
			vt(m, S, D);
			break;
		case "dangerouslySetInnerHTML":
			if (S != null) {
				if (typeof S != "object" || !("__html" in S)) throw Error(oA(61));
				if ((x = S.__html) != null) {
					if (C.children != null) throw Error(oA(60));
					m.innerHTML = x;
				}
			}
			break;
		case "children":
			typeof S == "string" ? It(m, S) : (typeof S == "number" || typeof S == "bigint") && It(m, "" + S);
			break;
		case "onScroll":
			S != null && Fc("scroll", m);
			break;
		case "onScrollEnd":
			S != null && Fc("scrollend", m);
			break;
		case "onClick":
			S != null && (m.onclick = $c);
			break;
		case "suppressContentEditableWarning":
		case "suppressHydrationWarning":
		case "innerHTML":
		case "ref":
		case "innerText":
		case "textContent": break;
		default: Br.hasOwnProperty(x) || (x[0] !== "o" || x[1] !== "n" || (C = x.endsWith("Capture"), _ = x.slice(2, C ? x.length - 7 : void 0), typeof (D = (D = m[br] || null) == null ? null : D[x]) == "function" && m.removeEventListener(_, D, C), typeof S != "function") ? x in m ? m[x] = S : !0 === S ? m.setAttribute(x, "") : nt(m, x, S) : (typeof D != "function" && D !== null && (x in m ? m[x] = null : m.hasAttribute(x) && m.removeAttribute(x)), m.addEventListener(_, S, C)));
	}
}
function td(m, _, x) {
	switch (_) {
		case "div":
		case "span":
		case "svg":
		case "path":
		case "a":
		case "g":
		case "p":
		case "li": break;
		case "img":
			Fc("error", m), Fc("load", m);
			var S, C = !1, D = !1;
			for (S in x) if (x.hasOwnProperty(S)) {
				var O = x[S];
				if (O != null) switch (S) {
					case "src":
						C = !0;
						break;
					case "srcSet":
						D = !0;
						break;
					case "children":
					case "dangerouslySetInnerHTML": throw Error(oA(137, _));
					default: Ad(m, _, S, O, x, null);
				}
			}
			D && Ad(m, _, "srcSet", x.srcSet, x, null), C && Ad(m, _, "src", x.src, x, null);
			return;
		case "input":
			Fc("invalid", m);
			var F = S = O = D = null, I = null, L = null;
			for (C in x) if (x.hasOwnProperty(C)) {
				var H = x[C];
				if (H != null) switch (C) {
					case "name":
						D = H;
						break;
					case "type":
						O = H;
						break;
					case "checked":
						I = H;
						break;
					case "defaultChecked":
						L = H;
						break;
					case "value":
						S = H;
						break;
					case "defaultValue":
						F = H;
						break;
					case "children":
					case "dangerouslySetInnerHTML":
						if (H != null) throw Error(oA(137, _));
						break;
					default: Ad(m, _, C, H, x, null);
				}
			}
			wt(m, S, F, I, L, O, D, !1), gt(m);
			return;
		case "select":
			for (D in Fc("invalid", m), C = O = S = null, x) if (x.hasOwnProperty(D) && (F = x[D]) != null) switch (D) {
				case "value":
					S = F;
					break;
				case "defaultValue":
					O = F;
					break;
				case "multiple": C = F;
				default: Ad(m, _, D, F, x, null);
			}
			_ = S, x = O, m.multiple = !!C, _ == null ? x != null && kt(m, !!C, x, !0) : kt(m, !!C, _, !1);
			return;
		case "textarea":
			for (O in Fc("invalid", m), S = D = C = null, x) if (x.hasOwnProperty(O) && (F = x[O]) != null) switch (O) {
				case "value":
					C = F;
					break;
				case "defaultValue":
					D = F;
					break;
				case "children":
					S = F;
					break;
				case "dangerouslySetInnerHTML":
					if (F != null) throw Error(oA(91));
					break;
				default: Ad(m, _, O, F, x, null);
			}
			St(m, C, D, S), gt(m);
			return;
		case "option":
			for (I in x) x.hasOwnProperty(I) && (C = x[I]) != null && (I === "selected" ? m.selected = C && typeof C != "function" && typeof C != "symbol" : Ad(m, _, I, C, x, null));
			return;
		case "dialog":
			Fc("beforetoggle", m), Fc("toggle", m), Fc("cancel", m), Fc("close", m);
			break;
		case "iframe":
		case "object":
			Fc("load", m);
			break;
		case "video":
		case "audio":
			for (C = 0; C < Dp.length; C++) Fc(Dp[C], m);
			break;
		case "image":
			Fc("error", m), Fc("load", m);
			break;
		case "details":
			Fc("toggle", m);
			break;
		case "embed":
		case "source":
		case "link": Fc("error", m), Fc("load", m);
		case "area":
		case "base":
		case "br":
		case "col":
		case "hr":
		case "keygen":
		case "meta":
		case "param":
		case "track":
		case "wbr":
		case "menuitem":
			for (L in x) if (x.hasOwnProperty(L) && (C = x[L]) != null) switch (L) {
				case "children":
				case "dangerouslySetInnerHTML": throw Error(oA(137, _));
				default: Ad(m, _, L, C, x, null);
			}
			return;
		default: if (Bt(_)) {
			for (H in x) x.hasOwnProperty(H) && (C = x[H]) !== void 0 && ed(m, _, H, C, x, void 0);
			return;
		}
	}
	for (F in x) x.hasOwnProperty(F) && (C = x[F]) != null && Ad(m, _, F, C, x, null);
}
var Mp = null, Np = null;
function id(m) {
	return m.nodeType === 9 ? m : m.ownerDocument;
}
function rd(m) {
	switch (m) {
		case "http://www.w3.org/2000/svg": return 1;
		case "http://www.w3.org/1998/Math/MathML": return 2;
		default: return 0;
	}
}
function ld(m, _) {
	if (m === 0) switch (_) {
		case "svg": return 1;
		case "math": return 2;
		default: return 0;
	}
	return m === 1 && _ === "foreignObject" ? 0 : m;
}
function od(m, _) {
	return m === "textarea" || m === "noscript" || typeof _.children == "string" || typeof _.children == "number" || typeof _.children == "bigint" || typeof _.dangerouslySetInnerHTML == "object" && _.dangerouslySetInnerHTML !== null && _.dangerouslySetInnerHTML.__html != null;
}
var Pp = null, Fp = typeof setTimeout == "function" ? setTimeout : void 0, Ip = typeof clearTimeout == "function" ? clearTimeout : void 0, Lp = typeof Promise == "function" ? Promise : void 0, Rp = typeof queueMicrotask == "function" ? queueMicrotask : Lp === void 0 ? Fp : function(m) {
	return Lp.resolve(null).then(m).catch(pd);
};
function pd(m) {
	setTimeout(function() {
		throw m;
	});
}
function hd(m) {
	return m === "head";
}
function md(m, _) {
	var x = _, S = 0, C = 0;
	do {
		var D = x.nextSibling;
		if (m.removeChild(x), D && D.nodeType === 8) {
			if ((x = D.data) === "/$") {
				if (0 < S && 8 > S) {
					x = S;
					var O = m.ownerDocument;
					if (1 & x && Sd(O.documentElement), 2 & x && Sd(O.body), 4 & x) for (Sd(x = O.head), O = x.firstChild; O;) {
						var F = O.nextSibling, I = O.nodeName;
						O[Mr] || I === "SCRIPT" || I === "STYLE" || I === "LINK" && O.rel.toLowerCase() === "stylesheet" || x.removeChild(O), O = F;
					}
				}
				if (C === 0) return m.removeChild(D), void xg(_);
				C--;
			} else x === "$" || x === "$?" || x === "$!" ? C++ : S = x.charCodeAt(0) - 48;
		} else S = 0;
		x = D;
	} while (x);
	xg(_);
}
function fd(m) {
	var _ = m.firstChild;
	for (_ && _.nodeType === 10 && (_ = _.nextSibling); _;) {
		var x = _;
		switch (_ = _.nextSibling, x.nodeName) {
			case "HTML":
			case "HEAD":
			case "BODY":
				fd(x), Ke(x);
				continue;
			case "SCRIPT":
			case "STYLE": continue;
			case "LINK": if (x.rel.toLowerCase() === "stylesheet") continue;
		}
		m.removeChild(x);
	}
}
function Ed(m) {
	return m.data === "$!" || m.data === "$?" && m.ownerDocument.readyState === "complete";
}
function wd(m) {
	for (; m != null; m = m.nextSibling) {
		var _ = m.nodeType;
		if (_ === 1 || _ === 3) break;
		if (_ === 8) {
			if ((_ = m.data) === "$" || _ === "$!" || _ === "$?" || _ === "F!" || _ === "F") break;
			if (_ === "/$") return null;
		}
	}
	return m;
}
var zp = null;
function kd(m) {
	m = m.previousSibling;
	for (var _ = 0; m;) {
		if (m.nodeType === 8) {
			var x = m.data;
			if (x === "$" || x === "$!" || x === "$?") {
				if (_ === 0) return m;
				_--;
			} else x === "/$" && _++;
		}
		m = m.previousSibling;
	}
	return null;
}
function yd(m, _, x) {
	switch (_ = id(x), m) {
		case "html":
			if (!(m = _.documentElement)) throw Error(oA(452));
			return m;
		case "head":
			if (!(m = _.head)) throw Error(oA(453));
			return m;
		case "body":
			if (!(m = _.body)) throw Error(oA(454));
			return m;
		default: throw Error(oA(451));
	}
}
function Sd(m) {
	for (var _ = m.attributes; _.length;) m.removeAttributeNode(_[0]);
	Ke(m);
}
var Bp = /* @__PURE__ */ new Map(), Vp = /* @__PURE__ */ new Set();
function Cd(m) {
	return typeof m.getRootNode == "function" ? m.getRootNode() : m.nodeType === 9 ? m : m.ownerDocument;
}
var Hp = fn.d;
fn.d = {
	f: function() {
		var m = Hp.f(), _ = Pu();
		return m || _;
	},
	r: function(m) {
		var _ = Ye(m);
		_ !== null && _.tag === 5 && _.type === "form" ? Ll(_) : Hp.r(m);
	},
	D: function(m) {
		Hp.D(m), xd("dns-prefetch", m, null);
	},
	C: function(m, _) {
		Hp.C(m, _), xd("preconnect", m, _);
	},
	L: function(m, _, x) {
		Hp.L(m, _, x);
		var S = Up;
		if (S && m && _) {
			var C = "link[rel=\"preload\"][as=\"" + ft(_) + "\"]";
			_ === "image" && x && x.imageSrcSet ? (C += "[imagesrcset=\"" + ft(x.imageSrcSet) + "\"]", typeof x.imageSizes == "string" && (C += "[imagesizes=\"" + ft(x.imageSizes) + "\"]")) : C += "[href=\"" + ft(m) + "\"]";
			var D = C;
			switch (_) {
				case "style":
					D = Nd(m);
					break;
				case "script": D = Ld(m);
			}
			Bp.has(D) || (m = zt({
				rel: "preload",
				href: _ === "image" && x && x.imageSrcSet ? void 0 : m,
				as: _
			}, x), Bp.set(D, m), S.querySelector(C) !== null || _ === "style" && S.querySelector(Td(D)) || _ === "script" && S.querySelector(Dd(D)) || (td(_ = S.createElement("link"), "link", m), _e(_), S.head.appendChild(_)));
		}
	},
	m: function(m, _) {
		Hp.m(m, _);
		var x = Up;
		if (x && m) {
			var S = _ && typeof _.as == "string" ? _.as : "script", C = "link[rel=\"modulepreload\"][as=\"" + ft(S) + "\"][href=\"" + ft(m) + "\"]", D = C;
			switch (S) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": D = Ld(m);
			}
			if (!Bp.has(D) && (m = zt({
				rel: "modulepreload",
				href: m
			}, _), Bp.set(D, m), x.querySelector(C) === null)) {
				switch (S) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (x.querySelector(Dd(D))) return;
				}
				td(S = x.createElement("link"), "link", m), _e(S), x.head.appendChild(S);
			}
		}
	},
	X: function(m, _) {
		Hp.X(m, _);
		var x = Up;
		if (x && m) {
			var S = je(x).hoistableScripts, C = Ld(m), D = S.get(C);
			D || ((D = x.querySelector(Dd(C))) || (m = zt({
				src: m,
				async: !0
			}, _), (_ = Bp.get(C)) && Fd(m, _), _e(D = x.createElement("script")), td(D, "link", m), x.head.appendChild(D)), D = {
				type: "script",
				instance: D,
				count: 1,
				state: null
			}, S.set(C, D));
		}
	},
	S: function(m, _, x) {
		Hp.S(m, _, x);
		var S = Up;
		if (S && m) {
			var C = je(S).hoistableStyles, D = Nd(m);
			_ ||= "default";
			var O = C.get(D);
			if (!O) {
				var F = {
					loading: 0,
					preload: null
				};
				if (O = S.querySelector(Td(D))) F.loading = 5;
				else {
					m = zt({
						rel: "stylesheet",
						href: m,
						"data-precedence": _
					}, x), (x = Bp.get(D)) && Rd(m, x);
					var I = O = S.createElement("link");
					_e(I), td(I, "link", m), I._p = new Promise(function(m, _) {
						I.onload = m, I.onerror = _;
					}), I.addEventListener("load", function() {
						F.loading |= 1;
					}), I.addEventListener("error", function() {
						F.loading |= 2;
					}), F.loading |= 4, Vd(O, _, S);
				}
				O = {
					type: "stylesheet",
					instance: O,
					count: 1,
					state: F
				}, C.set(D, O);
			}
		}
	},
	M: function(m, _) {
		Hp.M(m, _);
		var x = Up;
		if (x && m) {
			var S = je(x).hoistableScripts, C = Ld(m), D = S.get(C);
			D || ((D = x.querySelector(Dd(C))) || (m = zt({
				src: m,
				async: !0,
				type: "module"
			}, _), (_ = Bp.get(C)) && Fd(m, _), _e(D = x.createElement("script")), td(D, "link", m), x.head.appendChild(D)), D = {
				type: "script",
				instance: D,
				count: 1,
				state: null
			}, S.set(C, D));
		}
	}
};
var Up = typeof document > "u" ? null : document;
function xd(m, _, x) {
	var S = Up;
	if (S && typeof _ == "string" && _) {
		var C = ft(_);
		C = "link[rel=\"" + m + "\"][href=\"" + C + "\"]", typeof x == "string" && (C += "[crossorigin=\"" + x + "\"]"), Vp.has(C) || (Vp.add(C), m = {
			rel: m,
			crossOrigin: x,
			href: _
		}, S.querySelector(C) === null && (td(_ = S.createElement("link"), "link", m), _e(_), S.head.appendChild(_)));
	}
}
function Md(m, _, x, S) {
	var C, D, O, F, I = (I = xn.current) ? Cd(I) : null;
	if (!I) throw Error(oA(446));
	switch (m) {
		case "meta":
		case "title": return null;
		case "style": return typeof x.precedence == "string" && typeof x.href == "string" ? (_ = Nd(x.href), (S = (x = je(I).hoistableStyles).get(_)) || (S = {
			type: "style",
			instance: null,
			count: 0,
			state: null
		}, x.set(_, S)), S) : {
			type: "void",
			instance: null,
			count: 0,
			state: null
		};
		case "link":
			if (x.rel === "stylesheet" && typeof x.href == "string" && typeof x.precedence == "string") {
				m = Nd(x.href);
				var L = je(I).hoistableStyles, H = L.get(m);
				if (H || (I = I.ownerDocument || I, H = {
					type: "stylesheet",
					instance: null,
					count: 0,
					state: {
						loading: 0,
						preload: null
					}
				}, L.set(m, H), (L = I.querySelector(Td(m))) && !L._p && (H.instance = L, H.state.loading = 5), Bp.has(m) || (x = {
					rel: "preload",
					as: "style",
					href: x.href,
					crossOrigin: x.crossOrigin,
					integrity: x.integrity,
					media: x.media,
					hrefLang: x.hrefLang,
					referrerPolicy: x.referrerPolicy
				}, Bp.set(m, x), L || (C = I, D = m, O = x, F = H.state, C.querySelector("link[rel=\"preload\"][as=\"style\"][" + D + "]") ? F.loading = 1 : (D = C.createElement("link"), F.preload = D, D.addEventListener("load", function() {
					return F.loading |= 1;
				}), D.addEventListener("error", function() {
					return F.loading |= 2;
				}), td(D, "link", O), _e(D), C.head.appendChild(D))))), _ && S === null) throw Error(oA(528, ""));
				return H;
			}
			if (_ && S !== null) throw Error(oA(529, ""));
			return null;
		case "script": return _ = x.async, typeof (x = x.src) == "string" && _ && typeof _ != "function" && typeof _ != "symbol" ? (_ = Ld(x), (S = (x = je(I).hoistableScripts).get(_)) || (S = {
			type: "script",
			instance: null,
			count: 0,
			state: null
		}, x.set(_, S)), S) : {
			type: "void",
			instance: null,
			count: 0,
			state: null
		};
		default: throw Error(oA(444, m));
	}
}
function Nd(m) {
	return "href=\"" + ft(m) + "\"";
}
function Td(m) {
	return "link[rel=\"stylesheet\"][" + m + "]";
}
function Qd(m) {
	return zt({}, m, {
		"data-precedence": m.precedence,
		precedence: null
	});
}
function Ld(m) {
	return "[src=\"" + ft(m) + "\"]";
}
function Dd(m) {
	return "script[async]" + m;
}
function Od(m, _, x) {
	if (_.count++, _.instance === null) switch (_.type) {
		case "style":
			var S = m.querySelector("style[data-href~=\"" + ft(x.href) + "\"]");
			if (S) return _.instance = S, _e(S), S;
			var C = zt({}, x, {
				"data-href": x.href,
				"data-precedence": x.precedence,
				href: null,
				precedence: null
			});
			return _e(S = (m.ownerDocument || m).createElement("style")), td(S, "style", C), Vd(S, x.precedence, m), _.instance = S;
		case "stylesheet":
			C = Nd(x.href);
			var D = m.querySelector(Td(C));
			if (D) return _.state.loading |= 4, _.instance = D, _e(D), D;
			S = Qd(x), (C = Bp.get(C)) && Rd(S, C), _e(D = (m.ownerDocument || m).createElement("link"));
			var O = D;
			return O._p = new Promise(function(m, _) {
				O.onload = m, O.onerror = _;
			}), td(D, "link", S), _.state.loading |= 4, Vd(D, x.precedence, m), _.instance = D;
		case "script": return D = Ld(x.src), (C = m.querySelector(Dd(D))) ? (_.instance = C, _e(C), C) : (S = x, (C = Bp.get(D)) && Fd(S = zt({}, x), C), _e(C = (m = m.ownerDocument || m).createElement("script")), td(C, "link", S), m.head.appendChild(C), _.instance = C);
		case "void": return null;
		default: throw Error(oA(443, _.type));
	}
	else _.type === "stylesheet" && !(4 & _.state.loading) && (S = _.instance, _.state.loading |= 4, Vd(S, x.precedence, m));
	return _.instance;
}
function Vd(m, _, x) {
	for (var S = x.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), C = S.length ? S[S.length - 1] : null, D = C, O = 0; O < S.length; O++) {
		var F = S[O];
		if (F.dataset.precedence === _) D = F;
		else if (D !== C) break;
	}
	D ? D.parentNode.insertBefore(m, D.nextSibling) : (_ = x.nodeType === 9 ? x.head : x).insertBefore(m, _.firstChild);
}
function Rd(m, _) {
	m.crossOrigin ??= _.crossOrigin, m.referrerPolicy ??= _.referrerPolicy, m.title ??= _.title;
}
function Fd(m, _) {
	m.crossOrigin ??= _.crossOrigin, m.referrerPolicy ??= _.referrerPolicy, m.integrity ??= _.integrity;
}
var Wp = null;
function zd(m, _, x) {
	if (Wp === null) {
		var S = /* @__PURE__ */ new Map(), C = Wp = /* @__PURE__ */ new Map();
		C.set(x, S);
	} else (S = (C = Wp).get(x)) || (S = /* @__PURE__ */ new Map(), C.set(x, S));
	if (S.has(m)) return S;
	for (S.set(m, null), x = x.getElementsByTagName(m), C = 0; C < x.length; C++) {
		var D = x[C];
		if (!(D[Mr] || D[yr] || m === "link" && D.getAttribute("rel") === "stylesheet") && D.namespaceURI !== "http://www.w3.org/2000/svg") {
			var O = D.getAttribute(_) || "";
			O = m + O;
			var F = S.get(O);
			F ? F.push(D) : S.set(O, [D]);
		}
	}
	return S;
}
function Kd(m, _, x) {
	(m = m.ownerDocument || m).head.insertBefore(x, _ === "title" ? m.querySelector("head > title") : null);
}
function Pd(m) {
	return !!(m.type !== "stylesheet" || 3 & m.state.loading);
}
var Gp = null;
function Hd() {}
function jd() {
	if (this.count--, this.count === 0) {
		if (this.stylesheets) Jd(this, this.stylesheets);
		else if (this.unsuspend) {
			var m = this.unsuspend;
			this.unsuspend = null, m();
		}
	}
}
var Kp = null;
function Jd(m, _) {
	m.stylesheets = null, m.unsuspend !== null && (m.count++, Kp = /* @__PURE__ */ new Map(), _.forEach(qd, m), Kp = null, jd.call(m));
}
function qd(m, _) {
	if (!(4 & _.state.loading)) {
		var x = Kp.get(m);
		if (x) var S = x.get(null);
		else {
			x = /* @__PURE__ */ new Map(), Kp.set(m, x);
			for (var C = m.querySelectorAll("link[data-precedence],style[data-precedence]"), D = 0; D < C.length; D++) {
				var O = C[D];
				O.nodeName !== "LINK" && O.getAttribute("media") === "not all" || (x.set(O.dataset.precedence, O), S = O);
			}
			S && x.set(null, S);
		}
		O = (C = _.instance).getAttribute("data-precedence"), (D = x.get(O) || S) === S && x.set(null, C), x.set(O, C), this.count++, S = jd.bind(this), C.addEventListener("load", S), C.addEventListener("error", S), D ? D.parentNode.insertBefore(C, D.nextSibling) : (m = m.nodeType === 9 ? m.head : m).insertBefore(C, m.firstChild), _.state.loading |= 4;
	}
}
var qp = {
	$$typeof: $t,
	Provider: null,
	Consumer: null,
	_currentValue: pn,
	_currentValue2: pn,
	_threadCount: 0
};
function Zd(m, _, x, S, C, D, O, F) {
	this.tag = 1, this.containerInfo = m, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ce(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ce(0), this.hiddenUpdates = Ce(null), this.identifierPrefix = S, this.onUncaughtError = C, this.onCaughtError = D, this.onRecoverableError = O, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = F, this.incompleteTransitions = /* @__PURE__ */ new Map();
}
function Xd(m, _, x, S, C, D, O, F, I, L, H, U) {
	return m = new Zd(m, _, x, O, F, I, L, U), _ = 1, !0 === D && (_ |= 24), D = Ra(3, null, null, _), m.current = D, D.stateNode = m, (_ = Di()).refCount++, m.pooledCache = _, _.refCount++, D.memoizedState = {
		element: S,
		isDehydrated: x,
		cache: _
	}, ar(D), m;
}
function $d(m) {
	return m ? m = Oc : Oc;
}
function Ag(m, _, x, S, C, D) {
	C = $d(C), S.context === null ? S.context = C : S.pendingContext = C, (S = rr(_)).payload = { element: x }, (D = D === void 0 ? null : D) !== null && (S.callback = D), (x = lr(m, S, _)) !== null && (Ru(x, 0, _), or(x, m, _));
}
function eg(m, _) {
	if ((m = m.memoizedState) !== null && m.dehydrated !== null) {
		var x = m.retryLane;
		m.retryLane = x !== 0 && x < _ ? x : _;
	}
}
function tg(m, _) {
	eg(m, _), (m = m.alternate) && eg(m, _);
}
function ng(m) {
	if (m.tag === 13) {
		var _ = Qa(m, 67108864);
		_ !== null && Ru(_, 0, 67108864), tg(m, 67108864);
	}
}
var Jp = !0;
function ig(m, _, x, S) {
	var C = dn.T;
	dn.T = null;
	var D = fn.p;
	try {
		fn.p = 2, lg(m, _, x, S);
	} finally {
		fn.p = D, dn.T = C;
	}
}
function rg(m, _, x, S) {
	var C = dn.T;
	dn.T = null;
	var D = fn.p;
	try {
		fn.p = 8, lg(m, _, x, S);
	} finally {
		fn.p = D, dn.T = C;
	}
}
function lg(m, _, x, S) {
	if (Jp) {
		var C = og(S);
		if (C === null) Yc(m, _, S, Yp, x), bg(m, S);
		else if (function(m, _, x, S, C) {
			switch (_) {
				case "focusin": return Zp = kg(Zp, m, _, x, S, C), !0;
				case "dragenter": return Qp = kg(Qp, m, _, x, S, C), !0;
				case "mouseover": return $p = kg($p, m, _, x, S, C), !0;
				case "pointerover":
					var D = C.pointerId;
					return im.set(D, kg(im.get(D) || null, m, _, x, S, C)), !0;
				case "gotpointercapture": return D = C.pointerId, pm.set(D, kg(pm.get(D) || null, m, _, x, S, C)), !0;
			}
			return !1;
		}(C, m, _, x, S)) S.stopPropagation();
		else if (bg(m, S), 4 & _ && -1 < hm.indexOf(m)) {
			for (; C !== null;) {
				var D = Ye(C);
				if (D !== null) switch (D.tag) {
					case 3:
						if ((D = D.stateNode).current.memoizedState.isDehydrated) {
							var O = be(D.pendingLanes);
							if (O !== 0) {
								var F = D;
								for (F.pendingLanes |= 2, F.entangledLanes |= 2; O;) {
									var I = 1 << 31 - Qn(O);
									F.entanglements[1] |= I, O &= ~I;
								}
								Ic(D), !(6 & bf) && (ep = kn() + 500, Uc(0));
							}
						}
						break;
					case 13: (F = Qa(D, 2)) !== null && Ru(F, 0, 2), Pu(), tg(D, 2);
				}
				if ((D = og(S)) === null && Yc(m, _, S, Yp, x), D === C) break;
				C = D;
			}
			C !== null && S.stopPropagation();
		} else Yc(m, _, S, null, x);
	}
}
function og(m) {
	return ug(m = Qt(m));
}
var Yp = null;
function ug(m) {
	if (Yp = null, (m = Pe(m)) !== null) {
		var _ = uA(m);
		if (_ === null) m = null;
		else {
			var x = _.tag;
			if (x === 13) {
				if ((m = cA(_)) !== null) return m;
				m = null;
			} else if (x === 3) {
				if (_.stateNode.current.memoizedState.isDehydrated) return _.tag === 3 ? _.stateNode.containerInfo : null;
				m = null;
			} else _ !== m && (m = null);
		}
	}
	return Yp = m, null;
}
function cg(m) {
	switch (m) {
		case "beforetoggle":
		case "cancel":
		case "click":
		case "close":
		case "contextmenu":
		case "copy":
		case "cut":
		case "auxclick":
		case "dblclick":
		case "dragend":
		case "dragstart":
		case "drop":
		case "focusin":
		case "focusout":
		case "input":
		case "invalid":
		case "keydown":
		case "keypress":
		case "keyup":
		case "mousedown":
		case "mouseup":
		case "paste":
		case "pause":
		case "play":
		case "pointercancel":
		case "pointerdown":
		case "pointerup":
		case "ratechange":
		case "reset":
		case "resize":
		case "seeked":
		case "submit":
		case "toggle":
		case "touchcancel":
		case "touchend":
		case "touchstart":
		case "volumechange":
		case "change":
		case "selectionchange":
		case "textInput":
		case "compositionstart":
		case "compositionend":
		case "compositionupdate":
		case "beforeblur":
		case "afterblur":
		case "beforeinput":
		case "blur":
		case "fullscreenchange":
		case "focus":
		case "hashchange":
		case "popstate":
		case "select":
		case "selectstart": return 2;
		case "drag":
		case "dragenter":
		case "dragexit":
		case "dragleave":
		case "dragover":
		case "mousemove":
		case "mouseout":
		case "mouseover":
		case "pointermove":
		case "pointerout":
		case "pointerover":
		case "scroll":
		case "touchmove":
		case "wheel":
		case "mouseenter":
		case "mouseleave":
		case "pointerenter":
		case "pointerleave": return 8;
		case "message": switch (An()) {
			case Pn: return 2;
			case In: return 8;
			case zn:
			case Bn: return 32;
			case Vn: return 268435456;
			default: return 32;
		}
		default: return 32;
	}
}
var Xp = !1, Zp = null, Qp = null, $p = null, im = /* @__PURE__ */ new Map(), pm = /* @__PURE__ */ new Map(), mm = [], hm = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
function bg(m, _) {
	switch (m) {
		case "focusin":
		case "focusout":
			Zp = null;
			break;
		case "dragenter":
		case "dragleave":
			Qp = null;
			break;
		case "mouseover":
		case "mouseout":
			$p = null;
			break;
		case "pointerover":
		case "pointerout":
			im.delete(_.pointerId);
			break;
		case "gotpointercapture":
		case "lostpointercapture": pm.delete(_.pointerId);
	}
}
function kg(m, _, x, S, C, D) {
	return m === null || m.nativeEvent !== D ? (m = {
		blockedOn: _,
		domEventName: x,
		eventSystemFlags: S,
		nativeEvent: D,
		targetContainers: [C]
	}, _ !== null && (_ = Ye(_)) !== null && ng(_), m) : (m.eventSystemFlags |= S, _ = m.targetContainers, C !== null && _.indexOf(C) === -1 && _.push(C), m);
}
function yg(m) {
	var _ = Pe(m.target);
	if (_ !== null) {
		var x = uA(_);
		if (x !== null) {
			if ((_ = x.tag) === 13) {
				if ((_ = cA(x)) !== null) return m.blockedOn = _, void function(m) {
					var _ = fn.p;
					try {
						return fn.p = m, function() {
							if (x.tag === 13) {
								var m = Ou();
								m = Me(m);
								var _ = Qa(x, m);
								_ !== null && Ru(_, 0, m), tg(x, m);
							}
						}();
					} finally {
						fn.p = _;
					}
				}(m.priority);
			} else if (_ === 3 && x.stateNode.current.memoizedState.isDehydrated) return void (m.blockedOn = x.tag === 3 ? x.stateNode.containerInfo : null);
		}
	}
	m.blockedOn = null;
}
function Sg(m) {
	if (m.blockedOn !== null) return !1;
	for (var _ = m.targetContainers; 0 < _.length;) {
		var x = og(m.nativeEvent);
		if (x !== null) return (_ = Ye(x)) !== null && ng(_), m.blockedOn = x, !1;
		var S = new (x = m.nativeEvent).constructor(x.type, x);
		Ti = S, x.target.dispatchEvent(S), Ti = null, _.shift();
	}
	return !0;
}
function Ig(m, _, x) {
	Sg(m) && x.delete(_);
}
function Ug() {
	Xp = !1, Zp !== null && Sg(Zp) && (Zp = null), Qp !== null && Sg(Qp) && (Qp = null), $p !== null && Sg($p) && ($p = null), im.forEach(Ig), pm.forEach(Ig);
}
function Cg(m, _) {
	m.blockedOn === _ && (m.blockedOn = null, Xp || (Xp = !0, Mt.unstable_scheduleCallback(Mt.unstable_NormalPriority, Ug)));
}
var gm = null;
function Bg(m) {
	gm !== m && (gm = m, Mt.unstable_scheduleCallback(Mt.unstable_NormalPriority, function() {
		gm === m && (gm = null);
		for (var _ = 0; _ < m.length; _ += 3) {
			var x = m[_], S = m[_ + 1], C = m[_ + 2];
			if (typeof S != "function") {
				if (ug(S || x) === null) continue;
				break;
			}
			var D = Ye(x);
			D !== null && (m.splice(_, 3), _ -= 3, Tl(D, {
				pending: !0,
				data: C,
				method: x.method,
				action: S
			}, S, C));
		}
	}));
}
function xg(m) {
	function e(_) {
		return Cg(_, m);
	}
	Zp !== null && Cg(Zp, m), Qp !== null && Cg(Qp, m), $p !== null && Cg($p, m), im.forEach(e), pm.forEach(e);
	for (var _ = 0; _ < mm.length; _++) {
		var x = mm[_];
		x.blockedOn === m && (x.blockedOn = null);
	}
	for (; 0 < mm.length && (_ = mm[0]).blockedOn === null;) yg(_), _.blockedOn === null && mm.shift();
	if ((_ = (m.ownerDocument || m).$$reactFormReplay) != null) for (x = 0; x < _.length; x += 3) {
		var S = _[x], C = _[x + 1], D = S[br] || null;
		if (typeof C == "function") D || Bg(_);
		else if (D) {
			var O = null;
			if (C && C.hasAttribute("formAction")) {
				if (S = C, D = C[br] || null) O = D.formAction;
				else if (ug(S) !== null) continue;
			} else O = D.action;
			typeof O == "function" ? _[x + 1] = O : (_.splice(x, 3), x -= 3), Bg(_);
		}
	}
}
function Mg(m) {
	this._internalRoot = m;
}
function Ng(m) {
	this._internalRoot = m;
}
Ng.prototype.render = Mg.prototype.render = function(m) {
	var _ = this._internalRoot;
	if (_ === null) throw Error(oA(409));
	Ag(_.current, Ou(), m, _, null, null);
}, Ng.prototype.unmount = Mg.prototype.unmount = function() {
	var m = this._internalRoot;
	if (m !== null) {
		this._internalRoot = null;
		var _ = m.containerInfo;
		Ag(m.current, 2, null, m, null, null), Pu(), _[xr] = null;
	}
}, Ng.prototype.unstable_scheduleHydration = function(m) {
	if (m) {
		var _ = Te();
		m = {
			blockedOn: null,
			target: m,
			priority: _
		};
		for (var x = 0; x < mm.length && _ !== 0 && _ < mm[x].priority; x++);
		mm.splice(x, 0, m), x === 0 && yg(m);
	}
};
var ym = Pt.version;
if (ym !== "19.1.0") throw Error(oA(527, ym, "19.1.0"));
fn.findDOMNode = function(m) {
	var _ = m._reactInternals;
	if (_ === void 0) throw typeof m.render == "function" ? Error(oA(188)) : (m = Object.keys(m).join(","), Error(oA(268, m)));
	return m = function(m) {
		var _ = m.alternate;
		if (!_) {
			if ((_ = uA(m)) === null) throw Error(oA(188));
			return _ === m ? m : null;
		}
		for (var x = m, S = _;;) {
			var C = x.return;
			if (C === null) break;
			var D = C.alternate;
			if (D === null) {
				if ((S = C.return) !== null) {
					x = S;
					continue;
				}
				break;
			}
			if (C.child === D.child) {
				for (D = C.child; D;) {
					if (D === x) return dA(C), m;
					if (D === S) return dA(C), _;
					D = D.sibling;
				}
				throw Error(oA(188));
			}
			if (x.return !== S.return) x = C, S = D;
			else {
				for (var O = !1, F = C.child; F;) {
					if (F === x) {
						O = !0, x = C, S = D;
						break;
					}
					if (F === S) {
						O = !0, S = C, x = D;
						break;
					}
					F = F.sibling;
				}
				if (!O) {
					for (F = D.child; F;) {
						if (F === x) {
							O = !0, x = D, S = C;
							break;
						}
						if (F === S) {
							O = !0, S = D, x = C;
							break;
						}
						F = F.sibling;
					}
					if (!O) throw Error(oA(189));
				}
			}
			if (x.alternate !== S) throw Error(oA(190));
		}
		if (x.tag !== 3) throw Error(oA(188));
		return x.stateNode.current === x ? m : _;
	}(_), (m = m === null ? null : gA(m)) === null ? null : m.stateNode;
};
var bm = {
	bundleType: 0,
	version: "19.1.0",
	rendererPackageName: "react-dom",
	currentDispatcherRef: dn,
	reconcilerVersion: "19.1.0"
};
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
	var Sm = __REACT_DEVTOOLS_GLOBAL_HOOK__;
	if (!Sm.isDisabled && Sm.supportsFiber) try {
		Yn = Sm.inject(bm), Zn = Sm;
	} catch {}
}
ae.createRoot = function(m, _) {
	if (!sA(m)) throw Error(oA(299));
	var x = !1, S = "", C = bo, D = ko, O = yo;
	return _ != null && (!0 === _.unstable_strictMode && (x = !0), _.identifierPrefix !== void 0 && (S = _.identifierPrefix), _.onUncaughtError !== void 0 && (C = _.onUncaughtError), _.onCaughtError !== void 0 && (D = _.onCaughtError), _.onRecoverableError !== void 0 && (O = _.onRecoverableError), _.unstable_transitionCallbacks !== void 0 && _.unstable_transitionCallbacks), _ = Xd(m, 1, !1, null, 0, x, S, C, D, O, 0, null), m[xr] = _.current, Kc(m), new Mg(_);
}, ae.hydrateRoot = function(m, _, x) {
	if (!sA(m)) throw Error(oA(299));
	var S = !1, C = "", D = bo, O = ko, F = yo, I = null;
	return x != null && (!0 === x.unstable_strictMode && (S = !0), x.identifierPrefix !== void 0 && (C = x.identifierPrefix), x.onUncaughtError !== void 0 && (D = x.onUncaughtError), x.onCaughtError !== void 0 && (O = x.onCaughtError), x.onRecoverableError !== void 0 && (F = x.onRecoverableError), x.unstable_transitionCallbacks !== void 0 && x.unstable_transitionCallbacks, x.formState !== void 0 && (I = x.formState)), (_ = Xd(m, 1, !0, _, 0, S, C, D, O, F, 0, I)).context = $d(null), x = _.current, (C = rr(S = Me(S = Ou()))).callback = null, lr(x, C, S), x = S, _.current.lanes = x, ve(_, x), Ic(_), m[xr] = _.current, Kc(m), new Ng(_);
}, ae.version = "19.1.0", function A() {
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
		__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(A);
	} catch {}
}(), ie.exports = ae;
var Cm = ie.exports, wm = e(Cm), Dm = { exports: {} }, Om = {}, km = $, Mm = typeof Object.is == "function" ? Object.is : function(m, _) {
	return m === _ && (m !== 0 || 1 / m == 1 / _) || m != m && _ != _;
}, Im = km.useState, Lm = km.useEffect, Vm = km.useLayoutEffect, Wm = km.useDebugValue;
function Hg(m) {
	var _ = m.getSnapshot;
	m = m.value;
	try {
		var x = _();
		return !Mm(m, x);
	} catch {
		return !0;
	}
}
var qm = typeof window > "u" || window.document === void 0 || window.document.createElement === void 0 ? function(m, _) {
	return _();
} : function(m, _) {
	var x = _(), S = Im({ inst: {
		value: x,
		getSnapshot: _
	} }), C = S[0].inst, D = S[1];
	return Vm(function() {
		C.value = x, C.getSnapshot = _, Hg(C) && D({ inst: C });
	}, [
		m,
		x,
		_
	]), Lm(function() {
		return Hg(C) && D({ inst: C }), m(function() {
			Hg(C) && D({ inst: C });
		});
	}, [m]), Wm(x), x;
};
Om.useSyncExternalStore = km.useSyncExternalStore === void 0 ? qm : km.useSyncExternalStore, Dm.exports = Om;
var Jm = Dm.exports, Ym = { exports: {} }, Xm = {}, Zm = $, Qm = Jm, eh = typeof Object.is == "function" ? Object.is : function(m, _) {
	return m === _ && (m !== 0 || 1 / m == 1 / _) || m != m && _ != _;
}, th = Qm.useSyncExternalStore, nh = Zm.useRef, rh = Zm.useEffect, oh = Zm.useMemo, sh = Zm.useDebugValue;
Xm.useSyncExternalStoreWithSelector = function(m, _, x, S, C) {
	var D = nh(null);
	if (D.current === null) {
		var O = {
			hasValue: !1,
			value: null
		};
		D.current = O;
	} else O = D.current;
	D = oh(function() {
		function A(_) {
			if (!F) {
				if (F = !0, m = _, _ = S(_), C !== void 0 && O.hasValue) {
					var x = O.value;
					if (C(x, _)) return D = x;
				}
				return D = _;
			}
			if (x = D, eh(m, _)) return x;
			var I = S(_);
			return C !== void 0 && C(x, I) ? x : (m = _, D = I);
		}
		var m, D, F = !1, I = x === void 0 ? null : x;
		return [function() {
			return A(_());
		}, I === null ? void 0 : function() {
			return A(I());
		}];
	}, [
		_,
		x,
		S,
		C
	]);
	var F = th(m, D[0], D[1]);
	return rh(function() {
		O.hasValue = !0, O.value = F;
	}, [F]), sh(F), F;
}, Ym.exports = Xm;
var uh = Ym.exports, ip = function(m) {
	m();
}, rp = () => ip, dh = Symbol.for("react-redux-context"), fh = typeof globalThis < "u" ? globalThis : {};
function sp() {
	if (!$.createContext) return {};
	let m = fh[dh] ?? (fh[dh] = /* @__PURE__ */ new Map()), _ = m.get($.createContext);
	return _ || (_ = $.createContext(null), m.set($.createContext, _)), _;
}
var ph = sp();
function cp(m = ph) {
	return function() {
		return $.useContext(m);
	};
}
var vh = cp(), gp = () => {
	throw Error("uSES not initialized!");
}, pp = (m, _) => m === _;
function hp(m = ph) {
	let _ = m === ph ? vh : cp(m);
	return function(m, x = {}) {
		let { equalityFn: S = pp, stabilityCheck: C, noopCheck: D } = typeof x == "function" ? { equalityFn: x } : x, { store: O, subscription: F, getServerState: I, stabilityCheck: L, noopCheck: H } = _();
		$.useRef(!0);
		let U = $.useCallback({ [m.name]: (_) => m(_) }[m.name], [
			m,
			L,
			C
		]), W = gp(F.addNestedSub, O.getState, I || O.getState, U, S);
		return $.useDebugValue(W), W;
	};
}
var yh = hp();
typeof Symbol == "function" && Symbol.for;
var bh = {
	notify() {},
	get: () => []
}, xh = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0 ? $.useLayoutEffect : $.useEffect;
function ah({ store: m, context: _, children: x, serverState: S, stabilityCheck: C = "once", noopCheck: D = "once" }) {
	let O = $.useMemo(() => ({
		store: m,
		subscription: function(m) {
			let _, x = bh, S = 0, C = !1;
			function i() {
				D.onStateChange && D.onStateChange();
			}
			function r() {
				S++, _ || (_ = m.subscribe(i), x = function() {
					let m = rp(), _ = null, x = null;
					return {
						clear() {
							_ = null, x = null;
						},
						notify() {
							m(() => {
								let m = _;
								for (; m;) m.callback(), m = m.next;
							});
						},
						get() {
							let m = [], x = _;
							for (; x;) m.push(x), x = x.next;
							return m;
						},
						subscribe(m) {
							let S = !0, C = x = {
								callback: m,
								next: null,
								prev: x
							};
							return C.prev ? C.prev.next = C : _ = C, function() {
								S && _ !== null && (S = !1, C.next ? C.next.prev = C.prev : x = C.prev, C.prev ? C.prev.next = C.next : _ = C.next);
							};
						}
					};
				}());
			}
			function l() {
				S--, _ && S === 0 && (_(), _ = void 0, x.clear(), x = bh);
			}
			let D = {
				addNestedSub: function(m) {
					r();
					let _ = x.subscribe(m), S = !1;
					return () => {
						S || (S = !0, _(), l());
					};
				},
				notifyNestedSubs: function() {
					x.notify();
				},
				handleChangeWrapper: i,
				isSubscribed: function() {
					return C;
				},
				trySubscribe: function() {
					C || (C = !0, r());
				},
				tryUnsubscribe: function() {
					C && (C = !1, l());
				},
				getListeners: () => x
			};
			return D;
		}(m),
		getServerState: S ? () => S : void 0,
		stabilityCheck: C,
		noopCheck: D
	}), [
		m,
		S,
		C,
		D
	]), F = $.useMemo(() => m.getState(), [m]);
	xh(() => {
		let { subscription: _ } = O;
		return _.onStateChange = _.notifyNestedSubs, _.trySubscribe(), F !== m.getState() && _.notifyNestedSubs(), () => {
			_.tryUnsubscribe(), _.onStateChange = void 0;
		};
	}, [O, F]);
	let I = _ || ph;
	return $.createElement(I.Provider, { value: O }, x);
}
function ih(m = ph) {
	let _ = m === ph ? vh : cp(m);
	return function() {
		let { store: m } = _();
		return m;
	};
}
var Sh = ih();
function lh(m = ph) {
	let _ = m === ph ? Sh : ih(m);
	return function() {
		return _().dispatch;
	};
}
var Ch = lh(), wh, Th;
function ch(m) {
	return `Minified Redux error #${m}; visit https://redux.js.org/Errors?code=${m} for the full message or use the non-minified dev environment for full errors. `;
}
wh = uh.useSyncExternalStoreWithSelector, gp = wh, Th = Dt.unstable_batchedUpdates, ip = Th;
var Eh = typeof Symbol == "function" && Symbol.observable || "@@observable", gh = () => Math.random().toString(36).substring(7).split("").join("."), Dh = {
	INIT: `@@redux/INIT${gh()}`,
	REPLACE: `@@redux/REPLACE${gh()}`,
	PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${gh()}`
};
function hh(m, _, x) {
	if (typeof m != "function") throw Error(ch(2));
	if (typeof _ == "function" && typeof x == "function" || typeof x == "function" && typeof arguments[3] == "function") throw Error(ch(0));
	if (typeof _ == "function" && x === void 0 && (x = _, _ = void 0), x !== void 0) {
		if (typeof x != "function") throw Error(ch(1));
		return x(hh)(m, _);
	}
	let S = m, C = _, D = /* @__PURE__ */ new Map(), O = D, F = 0, I = !1;
	function s() {
		O === D && (O = /* @__PURE__ */ new Map(), D.forEach((m, _) => {
			O.set(_, m);
		}));
	}
	function u() {
		if (I) throw Error(ch(3));
		return C;
	}
	function c(m) {
		if (typeof m != "function") throw Error(ch(4));
		if (I) throw Error(ch(5));
		let _ = !0;
		s();
		let x = F++;
		return O.set(x, m), function() {
			if (_) {
				if (I) throw Error(ch(6));
				_ = !1, s(), O.delete(x), D = null;
			}
		};
	}
	function d(m) {
		if (!function(m) {
			if (typeof m != "object" || !m) return !1;
			let _ = m;
			for (; Object.getPrototypeOf(_) !== null;) _ = Object.getPrototypeOf(_);
			return Object.getPrototypeOf(m) === _ || Object.getPrototypeOf(m) === null;
		}(m)) throw Error(ch(7));
		if (m.type === void 0) throw Error(ch(8));
		if (typeof m.type != "string") throw Error(ch(17));
		if (I) throw Error(ch(9));
		try {
			I = !0, C = S(C, m);
		} finally {
			I = !1;
		}
		return (D = O).forEach((m) => {
			m();
		}), m;
	}
	return d({ type: Dh.INIT }), {
		dispatch: d,
		subscribe: c,
		getState: u,
		replaceReducer: function(m) {
			if (typeof m != "function") throw Error(ch(10));
			S = m, d({ type: Dh.REPLACE });
		},
		[Eh]: function() {
			let m = c;
			return {
				subscribe(_) {
					if (typeof _ != "object" || !_) throw Error(ch(11));
					function t() {
						let m = _;
						m.next && m.next(u());
					}
					return t(), { unsubscribe: m(t) };
				},
				[Eh]() {
					return this;
				}
			};
		}
	};
}
function mh(...m) {
	return m.length === 0 ? (m) => m : m.length === 1 ? m[0] : m.reduce((m, _) => (...x) => m(_(...x)));
}
var Oh = [
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
], kh = "main", Ah = "playlist", Mh = "equalizer", Nh = "milkdrop", Ph = "BUFFER", Ih = "PLAY", Lh = "NONE", Rh = "INITIALIZED", Bh = "…", Vh = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), Uh = {
	images: {
		EQ_PREAMP_LINE: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAAABCAYAAADpXEERAAAAE0lEQVQoU2Pcdfruf4ZRMKRDAAD1lwNjTqcaUQAAAABJRU5ErkJggg==",
		EQ_GRAPH_LINE_COLORS: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAATCAYAAABRC2cZAAAAR0lEQVQYV2O4rCT9n+F9kOJ/hvfViv8ZHkzSQCE2afxneH/HEJm49Nr0PwOYWPLIAkp0PjL4z1B41uQ/Q9QGnf8MWrPEIAQANWYwvnlToNIAAAAASUVORK5CYII="
	},
	colors: [
		"rgb(0,0,0)",
		"rgb(24,33,41)",
		"rgb(239,49,16)",
		"rgb(206,41,16)",
		"rgb(214,90,0)",
		"rgb(214,102,0)",
		"rgb(214,115,0)",
		"rgb(198,123,8)",
		"rgb(222,165,24)",
		"rgb(214,181,33)",
		"rgb(189,222,41)",
		"rgb(148,222,33)",
		"rgb(41,206,16)",
		"rgb(50,190,16)",
		"rgb(57,181,16)",
		"rgb(49,156,8)",
		"rgb(41,148,0)",
		"rgb(24,132,8)",
		"rgb(255,255,255)",
		"rgb(214,214,222)",
		"rgb(181,189,189)",
		"rgb(160,170,175)",
		"rgb(148,156,165)",
		"rgb(150,150,150)"
	],
	playlistStyle: {
		normal: "#00FF00",
		current: "#FFFFFF",
		normalbg: "#000000",
		selectedbg: "#0000FF",
		font: "Arial"
	}
}, Kh = "OSCILLOSCOPE", Xh = "NONE", Qh = "MILKDROP", $h = [
	"BAR",
	Kh,
	Xh
], ag = "ELAPSED", sg = "REMAINING", dg = "PLAYING", fg = "STOPPED", pg = "PAUSED", mg = "STOPPED";
function Fh(m) {
	return new Promise((_, x) => {
		let S = new Image();
		S.onload = () => {
			_(S);
		}, S.onerror = x, S.src = m;
	});
}
var Gh = (m) => {
	if (m == null) return {
		minutesFirstDigit: " ",
		minutesSecondDigit: " ",
		secondsFirstDigit: " ",
		secondsSecondDigit: " "
	};
	let _ = Math.floor(m / 60), x = m % 60, [S, C, D, O] = m == null ? [
		" ",
		" ",
		" ",
		" "
	] : [
		String(Math.floor(_ / 10)),
		String(Math.floor(_ % 10)),
		String(Math.floor(x / 10)),
		String(Math.floor(x % 10))
	];
	return {
		minutesFirstDigit: S,
		minutesSecondDigit: C,
		secondsFirstDigit: D,
		secondsSecondDigit: O
	};
}, zh = (m, _ = !0) => {
	if (m == null) return "";
	let { minutesFirstDigit: x, minutesSecondDigit: S, secondsFirstDigit: C, secondsSecondDigit: D } = Gh(m);
	return [
		_ && x === "0" ? "" : x,
		S,
		":",
		C,
		D
	].join("");
}, hg = /^\s*\[(.+?)\]\s*$/, gg = /^\s*([^;][^=]*)\s*=\s*(.*)\s*$/, Yh = (m) => {
	let _, x;
	return m.split(/[\r\n]+/g).reduce((m, S) => {
		if ((x = S.match(gg)) && _ != null) {
			let S = x[1].trim().toLowerCase(), C = x[2].replace(/\=.*$/g, "").trim().replace(/(^")|("$)|(^')|('$)/g, "");
			m[_][S] = C;
		} else (x = S.match(hg)) && (_ = x[1].trim().toLowerCase(), m[_] = {});
		return m;
	}, {});
}, Hh = (m, _, x) => Math.min(Math.max(m, _), x);
function jh(m) {
	return window.btoa(Array.from(m).map((m) => String.fromCharCode(m)).join(""));
}
function _h(m, _) {
	let x = document.createElement("a");
	x.download = _, x.href = m, window.document.body.appendChild(x), x.click(), window.document.body.removeChild(x);
}
var Jh = (m, _, x) => (x - m) / (_ - m), qh = (m, _, x) => _ + Math.round(m * (x - _)), Wh = (m, _) => qh(m, 0, _ - 1), Zh = (m, _, x, S) => (C) => qh(Jh(m, _, C), x, S), _g = Zh(1, 64, 0, 100), vg = Zh(0, 100, 1, 64);
function Am(m, _) {
	let x = _, S = m;
	for (let m of Object.keys(x)) x[m] instanceof Object && Object.assign(x[m], Am(S[m], x[m]));
	return Object.assign(m || {}, _), m;
}
function em(m, _, x, S) {
	return S[Wh(Jh(m, _, x), S.length)];
}
function tm(m) {
	let _ = [...m], x = _.length;
	for (; x;) {
		let m = Math.floor(Math.random() * x--), S = _[x];
		_[x] = _[m], _[m] = S;
	}
	return _;
}
function nm(m, _, x) {
	let S = Array(m.length), C = 0;
	for (let D = 0; D < S.length; D++) {
		let O = D - x;
		if (O >= 0 && O < m.length && _(O)) S[D] = m[O];
		else {
			for (; C < m.length && _(C);) C++;
			S[D] = m[C], C++;
		}
	}
	return S;
}
function am(m, _, x) {
	return [
		...m.slice(0, _),
		x,
		...m.slice(_ + 1)
	];
}
var wg = 0;
function rm(m, _) {
	let x = {};
	return Object.keys(m).forEach((S) => x[S] = _(m[S], S)), x;
}
var lm = (m) => m.length === 0 ? null : m.map((m) => ({
	left: m.x,
	top: m.y,
	bottom: m.y + m.height,
	right: m.x + m.width
})).reduce((m, _) => ({
	left: Math.min(m.left, _.left),
	top: Math.min(m.top, _.top),
	bottom: Math.max(m.bottom, _.bottom),
	right: Math.max(m.right, _.right)
}));
function om(m) {
	return {
		width: Math.max(m.scrollWidth, m.offsetWidth),
		height: Math.max(m.scrollHeight, m.offsetHeight)
	};
}
function sm() {
	return {
		width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth),
		height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
	};
}
function um(m) {
	switch (m.type) {
		case "touchstart":
		case "touchmove": {
			let _ = m.targetTouches[0] ?? m.touches[0];
			if (_ == null) throw Error("Unexpected touch event with zero touch targets.");
			return _;
		}
		case "mousedown":
		case "mousemove":
		case "pointerdown": return m;
		default: throw Error(`Unexpected event type: ${m.type}`);
	}
}
function cm(m) {
	return um(m).clientX;
}
function dm(m) {
	return um(m).clientY;
}
var Tg = {
	trackOrder: [],
	currentTrack: null,
	lastSelectedIndex: null,
	selectedTracks: []
}, Eg = {
	focused: kh,
	positionsAreRelative: !0,
	genWindows: {
		[kh]: {
			title: "Main Window",
			size: [0, 0],
			open: !0,
			shade: !1,
			canResize: !1,
			canShade: !0,
			canDouble: !0,
			hotkey: "Alt+W",
			position: {
				x: 0,
				y: 0
			}
		},
		[Mh]: {
			title: "Equalizer",
			size: [0, 0],
			open: !0,
			shade: !1,
			canResize: !1,
			canShade: !0,
			canDouble: !0,
			hotkey: "Alt+G",
			position: {
				x: 0,
				y: 0
			}
		},
		[Ah]: {
			title: "Playlist Editor",
			size: [0, 0],
			open: !0,
			shade: !1,
			canResize: !0,
			canShade: !0,
			canDouble: !1,
			hotkey: "Alt+E",
			position: {
				x: 0,
				y: 0
			}
		},
		[Nh]: {
			title: "Milkdrop",
			size: [0, 0],
			open: !1,
			shade: !1,
			canResize: !0,
			canShade: !1,
			canDouble: !1,
			position: {
				x: 0,
				y: 0
			}
		}
	},
	browserWindowSize: {
		width: 0,
		height: 0
	},
	windowOrder: [
		Ah,
		Mh,
		Nh,
		kh
	],
	milkdropEnabled: !1
}, Dg = {
	timeMode: ag,
	timeElapsed: 0,
	volume: 78,
	balance: 0,
	shuffle: !1,
	repeat: !1,
	status: mg
}, Og;
function fm(m, _) {
	return m === _;
}
function Em(m) {
	var _ = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : fm, x = null, S = null;
	return function() {
		return function(m, _, x) {
			if (_ === null || x === null || _.length !== x.length) return !1;
			for (var S = _.length, C = 0; C < S; C++) if (!m(_[C], x[C])) return !1;
			return !0;
		}(_, x, arguments) || (S = m.apply(null, arguments)), x = arguments, S;
	};
}
Og = function(m) {
	var _ = [...arguments].slice(1);
	return function() {
		var x = [...arguments], S = 0, C = x.pop(), D = function(m) {
			var _ = Array.isArray(m[0]) ? m[0] : m;
			if (!_.every(function(m) {
				return typeof m == "function";
			})) {
				var x = _.map(function(m) {
					return typeof m;
				}).join(", ");
				throw Error("Selector creators expect all input-selectors to be functions, instead received the following types: [" + x + "]");
			}
			return _;
		}(x), O = m.apply(void 0, [function() {
			return S++, C.apply(null, arguments);
		}].concat(_)), F = Em(function() {
			for (var m = [], _ = D.length, x = 0; x < _; x++) m.push(D[x].apply(null, arguments));
			return O.apply(null, m);
		});
		return F.resultFunc = C, F.recomputations = function() {
			return S;
		}, F.resetRecomputations = function() {
			return S = 0;
		}, F;
	};
}(Em);
var jg = {
	itemBackground: "rgb(0,0,0)",
	itemForeground: "rgb(0,255,0)",
	windowBackground: "rgb(56,55,87)",
	buttonText: "rgb(57,57,66)",
	windowText: "rgb(255,255,255)",
	divider: "rgb(117,116,139)",
	playlistSelection: "rgb(0,0,198)",
	listHeaderBackground: "rgb(72,72,120)",
	listHeaderText: "rgb(255,255,255)",
	listHeaderFrameTopAndLeft: "rgb(108,108,180)",
	listHeaderFrameBottomAndRight: "rgb(36,36,60)",
	listHeaderFramePressed: "rgb(18,18,30)",
	listHeaderDeadArea: "rgb(36,36,60)",
	scrollbarOne: "rgb(36,36,60)",
	scrollbarTwo: "rgb(36,36,60)",
	pressedScrollbarOne: "rgb(121,130,150)",
	pressedScrollbarTwo: "rgb(78,88,110)",
	scrollbarDeadArea: "rgb(36,36,60)",
	listTextHighlighted: "rgb(0,198,255)",
	listTextHighlightedBackground: "rgb(0,198,255)",
	listTextSelected: "rgb(0,198,255)",
	listTextSelectedBackground: "rgb(0,198,255)"
}, Pg = {
	doubled: !1,
	marqueeStep: 0,
	disableMarquee: !1,
	loading: !0,
	llama: !1,
	closed: !1,
	working: !1,
	skinImages: Uh.images,
	skinColors: Uh.colors,
	skinCursors: null,
	skinPlaylistStyle: null,
	skinRegion: {},
	visualizerStyle: 0,
	dummyVizData: null,
	playlistScrollPosition: 0,
	skinGenLetterWidths: null,
	skinGenExColors: jg,
	additionalVisualizers: [],
	zIndex: 0
}, Fg = Og((m) => m.visualizerStyle, (m) => $h[m]), Lg = {
	focus: null,
	bandFocused: null,
	scrubPosition: 0,
	userMessage: null
}, Rg = {
	on: !0,
	auto: !1,
	sliders: {
		preamp: 50,
		60: 50,
		170: 50,
		310: 50,
		600: 50,
		1e3: 50,
		3e3: 50,
		6e3: 50,
		12e3: 50,
		14e3: 50,
		16e3: 50
	}
}, zg = { availableSkins: [] }, Um = function(m, _, x, S, C, D, O, F) {
	if (!m) {
		var I;
		if (_ === void 0) I = /* @__PURE__ */ Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
		else {
			var L = [
				x,
				S,
				C,
				D,
				O,
				F
			], H = 0;
			(I = Error(_.replace(/%s/g, function() {
				return L[H++];
			}))).name = "Invariant Violation";
		}
		throw I.framesToPop = 1, I;
	}
}, Vg = e(Um);
async function vm(m) {
	return new Promise((_, x) => {
		let S = new FileReader();
		S.onload = () => {
			_(S.result);
		}, S.onerror = x, S.readAsText(m);
	});
}
async function Bm({ accept: m, directory: _ = !1 } = {
	accept: null,
	directory: !1
}) {
	return new Promise((x) => {
		let S = document.createElement("input");
		m && S.setAttribute("accept", m), S.type = "file", S.multiple = !0, S.webkitdirectory = _, S.directory = _, S.mozdirectory = _, S.value = null, S.addEventListener("change", (m) => {
			let _ = m.target.files;
			x(_);
		}), S.click();
	});
}
function xm(m) {
	return `data:image/x-win-bitmap;base64,${jh(m)}`;
}
var Wg = function() {
	let m = /* @__PURE__ */ new WeakMap();
	return (_) => (m.has(_) || m.set(_, ((m) => {
		let { artist: _, title: x, defaultName: S, url: C } = m;
		if (_ && x) return `${_} - ${x}`;
		if (x) return x;
		if (S) return S;
		if (C) {
			let m = function(m) {
				if (function(m) {
					return /^blob:/.test(m);
				}(m)) return null;
				let _ = m.split("/").pop();
				return _ == null ? null : _.split("#")[0].split("?")[0];
			}(C);
			if (m) return m;
		}
		return "???";
	})(_)), m.get(_));
}();
function Nm(m) {
	let _, x = Math.round(m / 1e3);
	return _ = String(x), x <= 10 && (_ = String(x).slice(0, 1).padStart(2, " ")), x >= 100 && (_ = String(x).slice(1, 3)), _;
}
function Tm(m) {
	let _, x = Math.round(m / 1e3);
	return _ = String(x), x <= 100 && (_ = String(x).padStart(3, " ")), x <= 10 && (_ = String(x).padStart(3, " ")), x >= 1e3 && (_ = `${String(x).slice(0, 2)}H`), x >= 1e4 && (_ = `${String(x).slice(0, 1).padStart(2, " ")}C`), _;
}
var Gg = {}, Kg;
(function(m) {
	m[m.IMMEDIATE = 0] = "IMMEDIATE", m[m.DEFAULT = 1] = "DEFAULT", m[m.USER_PRESET = 2] = "USER_PRESET";
})(Kg ||= {});
var qg = {
	display: "WINDOW",
	overlay: !1,
	presetHistory: [],
	presets: [],
	currentPresetIndex: null,
	butterchurn: null,
	transitionType: Kg.DEFAULT,
	randomize: !0,
	cycling: !0,
	message: null
}, Jg = function(m) {
	let _ = Object.keys(m), x = {};
	for (let S = 0; S < _.length; S++) {
		let C = _[S];
		typeof m[C] == "function" && (x[C] = m[C]);
	}
	let S = Object.keys(x), C;
	try {
		(function(m) {
			Object.keys(m).forEach((_) => {
				let x = m[_];
				if (x(void 0, { type: Dh.INIT }) === void 0) throw Error(ch(12));
				if (x(void 0, { type: Dh.PROBE_UNKNOWN_ACTION() }) === void 0) throw Error(ch(13));
			});
		})(x);
	} catch (m) {
		C = m;
	}
	return function(m = {}, _) {
		if (C) throw C;
		let D = !1, O = {};
		for (let C = 0; C < S.length; C++) {
			let F = S[C], I = x[F], L = m[F], H = I(L, _);
			if (H === void 0) throw Error(ch(14));
			O[F] = H, D ||= H !== L;
		}
		return D ||= S.length !== Object.keys(m).length, D ? O : m;
	};
}({
	userInput: (m = Lg, _) => {
		switch (_.type) {
			case "SET_FOCUS": return {
				...m,
				focus: _.input,
				bandFocused: null
			};
			case "SET_BAND_FOCUS": return {
				...m,
				focus: _.input,
				bandFocused: _.bandFocused
			};
			case "UNSET_FOCUS": return {
				...m,
				focus: null,
				bandFocused: null
			};
			case "SET_SCRUB_POSITION": return {
				...m,
				scrubPosition: _.position
			};
			case "SET_USER_MESSAGE": return {
				...m,
				userMessage: _.message
			};
			case "UNSET_USER_MESSAGE": return {
				...m,
				userMessage: null
			};
			default: return m;
		}
	},
	windows: (m = Eg, _) => {
		switch (_.type) {
			case "ENABLE_MILKDROP": return {
				...m,
				milkdropEnabled: !0,
				genWindows: {
					...m.genWindows,
					[Nh]: {
						...m.genWindows[Nh],
						open: _.open
					}
				}
			};
			case "SET_FOCUSED_WINDOW":
				let x = m.windowOrder;
				return _.window != null && (x = [...m.windowOrder.filter((m) => m !== _.window), _.window]), {
					...m,
					focused: _.window,
					windowOrder: x
				};
			case "TOGGLE_WINDOW_SHADE_MODE":
				let { canShade: S } = m.genWindows[_.windowId];
				if (!S) throw Error(`Tried to shade/unshade a window that cannot be shaded: ${_.windowId}`);
				return {
					...m,
					genWindows: {
						...m.genWindows,
						[_.windowId]: {
							...m.genWindows[_.windowId],
							shade: !m.genWindows[_.windowId].shade
						}
					}
				};
			case "TOGGLE_WINDOW":
				let C = m.genWindows[_.windowId];
				return {
					...m,
					genWindows: {
						...m.genWindows,
						[_.windowId]: {
							...C,
							open: !C.open
						}
					}
				};
			case "CLOSE_WINDOW": return {
				...m,
				genWindows: {
					...m.genWindows,
					[_.windowId]: {
						...m.genWindows[_.windowId],
						open: !1
					}
				}
			};
			case "WINDOW_SIZE_CHANGED":
				let { canResize: D } = m.genWindows[_.windowId];
				if (!D) throw Error(`Tried to resize a window that cannot be resized: ${_.windowId}`);
				return {
					...m,
					genWindows: {
						...m.genWindows,
						[_.windowId]: {
							...m.genWindows[_.windowId],
							size: _.size
						}
					}
				};
			case "UPDATE_WINDOW_POSITIONS": return {
				...m,
				positionsAreRelative: !0 !== _.absolute && m.positionsAreRelative,
				genWindows: rm(m.genWindows, (m, x) => {
					let S = _.positions[x];
					return S == null ? m : {
						...m,
						position: S
					};
				})
			};
			case "RESET_WINDOW_SIZES": return {
				...m,
				genWindows: rm(m.genWindows, (m) => ({
					...m,
					size: [0, 0]
				}))
			};
			case "BROWSER_WINDOW_SIZE_CHANGED": return {
				...m,
				browserWindowSize: {
					height: _.height,
					width: _.width
				}
			};
			default: return m;
		}
	},
	display: (m = Pg, _) => {
		switch (_.type) {
			case "LOAD_DEFAULT_SKIN": {
				let { skinImages: _, skinColors: x, skinCursors: S, skinPlaylistStyle: C, skinRegion: D, skinGenLetterWidths: O, skinGenExColors: F } = Pg;
				return {
					...m,
					skinImages: _,
					skinColors: x,
					skinCursors: S,
					skinPlaylistStyle: C,
					skinRegion: D,
					skinGenLetterWidths: O,
					skinGenExColors: F
				};
			}
			case "TOGGLE_DOUBLESIZE_MODE": return {
				...m,
				doubled: !m.doubled
			};
			case "TOGGLE_LLAMA_MODE": return {
				...m,
				llama: !m.llama
			};
			case "STEP_MARQUEE": return m.disableMarquee ? m : {
				...m,
				marqueeStep: m.marqueeStep + 1
			};
			case "DISABLE_MARQUEE": return {
				...m,
				disableMarquee: !0
			};
			case "STOP_WORKING": return {
				...m,
				working: !1
			};
			case "START_WORKING": return {
				...m,
				working: !0
			};
			case "CLOSE_WINAMP": return {
				...m,
				closed: !0
			};
			case "OPEN_WINAMP": return {
				...m,
				closed: !1
			};
			case "LOADING": return {
				...m,
				loading: !0
			};
			case "LOADED": return {
				...m,
				loading: !1
			};
			case "SET_SKIN_DATA":
				let { data: x } = _;
				return {
					...m,
					loading: !1,
					skinImages: x.skinImages,
					skinColors: x.skinColors,
					skinPlaylistStyle: x.skinPlaylistStyle,
					skinCursors: x.skinCursors,
					skinRegion: x.skinRegion,
					skinGenLetterWidths: x.skinGenLetterWidths,
					skinGenExColors: x.skinGenExColors || jg
				};
			case "TOGGLE_VISUALIZER_STYLE": return {
				...m,
				visualizerStyle: (m.visualizerStyle + 1) % $h.length
			};
			case "SET_PLAYLIST_SCROLL_POSITION": return {
				...m,
				playlistScrollPosition: _.position
			};
			case "SET_Z_INDEX": return {
				...m,
				zIndex: _.zIndex
			};
			case "SET_DUMMY_VIZ_DATA": return {
				...m,
				dummyVizData: _.data
			};
			default: return m;
		}
	},
	settings: (m = zg, _) => _.type === "SET_AVAILABLE_SKINS" ? {
		...m,
		availableSkins: _.skins
	} : m,
	equalizer: (m = Rg, _) => {
		switch (_.type) {
			case "SET_BAND_VALUE":
				let x = {
					...m.sliders,
					[_.band]: _.value
				};
				return {
					...m,
					sliders: x
				};
			case "SET_EQ_ON": return {
				...m,
				on: !0
			};
			case "SET_EQ_OFF": return {
				...m,
				on: !1
			};
			case "SET_EQ_AUTO": return {
				...m,
				auto: _.value
			};
			default: return m;
		}
	},
	playlist: (m = Tg, _) => {
		switch (_.type) {
			case "CLICKED_TRACK": return {
				...m,
				selectedTracks: [m.trackOrder[_.index]],
				lastSelectedIndex: _.index
			};
			case "CTRL_CLICKED_TRACK": {
				let x = m.trackOrder[_.index], S = m.selectedTracks.indexOf(x), C = [...m.selectedTracks];
				return S === -1 ? C.push(x) : C.splice(S, 1), {
					...m,
					selectedTracks: C,
					lastSelectedIndex: _.index
				};
			}
			case "SHIFT_CLICKED_TRACK":
				if (m.lastSelectedIndex == null) return m;
				let x = _.index, S = Math.min(x, m.lastSelectedIndex), C = Math.max(x, m.lastSelectedIndex), D = m.trackOrder.slice(S, C + 1);
				return {
					...m,
					selectedTracks: D
				};
			case "SELECT_ALL": return {
				...m,
				selectedTracks: [...m.trackOrder]
			};
			case "SELECT_ZERO": return {
				...m,
				selectedTracks: []
			};
			case "INVERT_SELECTION": return {
				...m,
				selectedTracks: m.trackOrder.filter((_) => !m.selectedTracks.includes(_))
			};
			case "REMOVE_ALL_TRACKS": return {
				...m,
				trackOrder: [],
				currentTrack: null,
				selectedTracks: [],
				lastSelectedIndex: null
			};
			case "REMOVE_TRACKS":
				let O = new Set(_.ids.map(Number)), { currentTrack: F } = m;
				return {
					...m,
					trackOrder: m.trackOrder.filter((m) => !O.has(m)),
					currentTrack: O.has(Number(F)) ? null : F,
					selectedTracks: Array.from(m.selectedTracks).filter((m) => O.has(m)),
					lastSelectedIndex: null
				};
			case "REVERSE_LIST": return {
				...m,
				trackOrder: [...m.trackOrder].reverse(),
				lastSelectedIndex: null
			};
			case "RANDOMIZE_LIST": return {
				...m,
				trackOrder: tm(m.trackOrder)
			};
			case "SET_TRACK_ORDER":
				let { trackOrder: I } = _;
				return {
					...m,
					trackOrder: I
				};
			case "ADD_TRACK_FROM_URL":
				let L = _.atIndex == null ? m.trackOrder.length : _.atIndex;
				return {
					...m,
					trackOrder: [
						...m.trackOrder.slice(0, L),
						Number(_.id),
						...m.trackOrder.slice(L)
					],
					lastSelectedIndex: null
				};
			case "PLAY_TRACK":
			case "BUFFER_TRACK": return {
				...m,
				currentTrack: _.id
			};
			case "DRAG_SELECTED": return {
				...m,
				trackOrder: nm(m.trackOrder, (_) => m.selectedTracks.includes(m.trackOrder[_]), _.offset),
				lastSelectedIndex: null
			};
			default: return m;
		}
	},
	media: (m = Dg, _) => {
		switch (_.type) {
			case "PLAY":
			case "IS_PLAYING": return {
				...m,
				status: "PLAYING"
			};
			case "PAUSE": return {
				...m,
				status: "PAUSED"
			};
			case "STOP":
			case "OPEN_WINAMP": return {
				...m,
				status: mg
			};
			case "IS_STOPPED": return {
				...m,
				status: "ENDED"
			};
			case "CLOSE_WINAMP": return {
				...m,
				status: "CLOSED"
			};
			case "TOGGLE_TIME_MODE":
				let x = m.timeMode === sg ? ag : sg;
				return {
					...m,
					timeMode: x
				};
			case "UPDATE_TIME_ELAPSED": return {
				...m,
				timeElapsed: _.elapsed
			};
			case "SET_MEDIA": return { ...m };
			case "SET_VOLUME": return {
				...m,
				volume: _.volume
			};
			case "SET_BALANCE": return {
				...m,
				balance: _.balance
			};
			case "TOGGLE_REPEAT": return {
				...m,
				repeat: !m.repeat
			};
			case "TOGGLE_SHUFFLE": return {
				...m,
				shuffle: !m.shuffle
			};
			default: return m;
		}
	},
	network: (m = { connected: !0 }, _) => {
		switch (_.type) {
			case "NETWORK_CONNECTED": return {
				...m,
				connected: !0
			};
			case "NETWORK_DISCONNECTED": return {
				...m,
				connected: !1
			};
			default: return m;
		}
	},
	tracks: (m = Gg, _) => {
		switch (_.type) {
			case "ADD_TRACK_FROM_URL": return {
				...m,
				[_.id]: {
					id: _.id,
					defaultName: _.defaultName || null,
					duration: _.duration ?? null,
					url: _.url,
					mediaTagsRequestStatus: Rh
				}
			};
			case "SET_MEDIA": {
				let x = {
					...m[_.id],
					duration: _.length
				};
				return {
					...m,
					[_.id]: x
				};
			}
			case "MEDIA_TAG_REQUEST_INITIALIZED": return {
				...m,
				[_.id]: {
					...m[_.id],
					mediaTagsRequestStatus: Rh
				}
			};
			case "MEDIA_TAG_REQUEST_FAILED": return {
				...m,
				[_.id]: {
					...m[_.id],
					mediaTagsRequestStatus: "FAILED"
				}
			};
			case "SET_MEDIA_DURATION": return {
				...m,
				[_.id]: {
					...m[_.id],
					duration: _.duration
				}
			};
			case "SET_MEDIA_TAGS":
				let x = m[_.id], { sampleRate: S, bitrate: C, numberOfChannels: D, title: O, artist: F, album: I, albumArtUrl: L } = _, { kbps: H, khz: U, channels: W } = x;
				return {
					...m,
					[_.id]: {
						...x,
						mediaTagsRequestStatus: "COMPLETE",
						title: O,
						artist: F,
						album: I,
						albumArtUrl: L,
						kbps: C == null ? H : Tm(C),
						khz: S == null ? U : Nm(S),
						channels: D ?? W
					}
				};
			default: return m;
		}
	},
	milkdrop: (m = qg, _) => {
		switch (_.type) {
			case "SET_MILKDROP_DESKTOP": return {
				...m,
				display: _.enabled ? "DESKTOP" : "WINDOW"
			};
			case "SET_MILKDROP_FULLSCREEN": return {
				...m,
				display: _.enabled ? "FULLSCREEN" : "WINDOW"
			};
			case "GOT_BUTTERCHURN": return {
				...m,
				butterchurn: _.butterchurn
			};
			case "GOT_BUTTERCHURN_PRESETS": return {
				...m,
				presets: m.presets.concat(_.presets)
			};
			case "PRESET_REQUESTED": return _.addToHistory ? {
				...m,
				presetHistory: [...m.presetHistory, _.index]
			} : {
				...m,
				presetHistory: m.presetHistory.slice(0, -1)
			};
			case "RESOLVE_PRESET_AT_INDEX":
				let x = m.presets[_.index];
				return {
					...m,
					presets: am(m.presets, _.index, {
						type: "RESOLVED",
						name: x.name,
						preset: _.json
					})
				};
			case "SELECT_PRESET_AT_INDEX": return {
				...m,
				currentPresetIndex: _.index,
				transitionType: _.transitionType
			};
			case "TOGGLE_PRESET_OVERLAY": return {
				...m,
				overlay: !m.overlay
			};
			case "TOGGLE_RANDOMIZE_PRESETS": return {
				...m,
				randomize: !m.randomize
			};
			case "TOGGLE_PRESET_CYCLING": return {
				...m,
				cycling: !m.cycling
			};
			case "SCHEDULE_MILKDROP_MESSAGE": return {
				...m,
				message: {
					text: _.message,
					time: Date.now()
				}
			};
			default: return m;
		}
	}
}), Yg = {
	height: "2px",
	borderWidth: 0,
	color: "gray",
	backgroundColor: "gray"
}, Rm = (m) => Q.jsx("font", { ...m }), Fm = (m) => Q.jsx("hr", { ...m }), Gm = (m) => Q.jsx("div", { ...m }), zm = (m) => Q.jsx("table", { ...m }), Km = (m) => Q.jsxs(Q.Fragment, { children: [
	Q.jsxs(Gm, {
		align: "center",
		children: [Q.jsx(Gm, {
			className: "para2",
			align: "center",
			children: Q.jsx("p", { children: "WINAMP" })
		}), Q.jsx(Gm, {
			className: "para1",
			align: "center",
			children: Q.jsx("p", { children: "playlist" })
		})]
	}),
	Q.jsx(Fm, {
		align: "left",
		width: "90%",
		size: "1",
		color: "#FFBF00",
		style: Yg
	}),
	Q.jsx(Gm, {
		align: "right",
		children: Q.jsx(zm, {
			border: "0",
			cellSpacing: "0",
			cellPadding: "0",
			width: "98%",
			children: Q.jsx("tbody", { children: Q.jsx("tr", { children: Q.jsxs("td", { children: [
				Q.jsx("small", { children: Q.jsxs("small", { children: [
					Q.jsx(Rm, {
						face: "Arial",
						color: "#FFBF00",
						children: m.numberOfTracks
					}),
					Q.jsx(Rm, {
						color: "#409FFF",
						face: "Arial",
						children: " track in playlist, average track length: "
					}),
					Q.jsx(Rm, {
						face: "Arial",
						color: "#FFBF00",
						children: m.averageTrackLength
					})
				] }) }),
				Q.jsx("br", {}),
				Q.jsx("small", { children: Q.jsxs("small", { children: [
					Q.jsx(Rm, {
						color: "#409FFF",
						face: "Arial",
						children: "Playlist length: "
					}),
					Q.jsx(Rm, {
						face: "Arial",
						color: "#FFBF00",
						children: m.playlistLengthMinutes
					}),
					Q.jsx(Rm, {
						color: "#409FFF",
						face: "Arial",
						children: " minutes "
					}),
					Q.jsx(Rm, {
						face: "Arial",
						color: "#FFBF00",
						children: m.playlistLengthSeconds
					}),
					Q.jsx(Rm, {
						color: "#409FFF",
						face: "Arial",
						children: " second "
					}),
					Q.jsx("br", {}),
					Q.jsxs(Rm, {
						color: "#409FFF",
						face: "Arial",
						children: [
							"Right-click ",
							Q.jsx("a", {
								href: "./",
								children: "here"
							}),
							" to save this HTML file."
						]
					})
				] }) })
			] }) }) })
		})
	}),
	Q.jsxs("blockquote", { children: [Q.jsx("p", { children: Q.jsx(Rm, {
		color: "#FFBF00",
		face: "Arial",
		children: Q.jsx("big", { children: "Playlist files:" })
	}) }), Q.jsx("ul", { children: Q.jsx(Rm, {
		face: "Arial",
		color: "#FFFFFF",
		children: Q.jsx("small", { children: m.tracks.map((m) => Q.jsxs("span", { children: [m, Q.jsx("br", {})] }, m)) })
	}) })] }),
	Q.jsx(Fm, {
		align: "left",
		width: "90%",
		size: "1",
		color: "#FFBF00",
		style: Yg
	})
] }), Pm = (m) => m.equalizer.sliders, Xg = Og(Pm, (m) => ({
	presets: [{
		name: "Entry1",
		preamp: vg(m.preamp),
		hz60: vg(m[60]),
		hz170: vg(m[170]),
		hz310: vg(m[310]),
		hz600: vg(m[600]),
		hz1000: vg(m[1e3]),
		hz3000: vg(m[3e3]),
		hz6000: vg(m[6e3]),
		hz12000: vg(m[12e3]),
		hz14000: vg(m[14e3]),
		hz16000: vg(m[16e3])
	}],
	type: "Winamp EQ library file v1.1"
})), Hm = (m) => m.tracks, jm = (m) => (_) => m.tracks[_]?.url, _m = (m) => m.playlist.trackOrder, Zg = Og(_m, (m) => m.length), Qg = Og(Hm, _m, (m, _) => _.filter((_) => m[_])), $g = Og(Hm, _m, (m, _) => _.map((_) => m[_]).filter(Boolean)), e_ = Og(Hm, _m, (m, _) => _.map((_) => {
	let x = m[_];
	return {
		url: x.url,
		metaData: {
			artist: x.artist || "",
			title: x.title || "",
			album: x.album,
			albumArtUrl: x.albumArtUrl || ""
		}
	};
})), t_ = Og(Hm, Qg, (m, _) => _.map((_) => m[_])), $m = (m) => m.playlist.selectedTracks, n_ = Og($m, (m) => new Set(m)), r_ = Og(t_, n_, (m, _) => m.filter((m) => _.has(m.id))), tf = (m) => m.reduce((m, _) => m + Number(_.duration), 0), i_ = Og(t_, tf), a_ = Og(r_, tf), o_ = Og(i_, a_, (m, _) => `${zh(_)}/${zh(m)}`), lf = (m) => {
	let { playlist: _ } = m;
	return _.currentTrack == null ? -1 : _.trackOrder.indexOf(_.currentTrack);
}, s_ = Og(lf, (m) => m + 1), sf = (m) => m.playlist.currentTrack, uf = (m) => m.windows.genWindows, c_ = Og(uf, (m) => (_) => m[_].open), l_ = Og(function(m) {
	return m.milkdrop.display === "WINDOW";
}, (m) => (_) => _ === Nh && !m), u_ = Og(uf, (m) => (_) => m[_].shade), d_ = Og(uf, (m) => (_) => m[_].size), f_ = Og(uf, (m) => rm(m, (m) => m.position)), p_ = Og(d_, (m) => {
	let _ = m("playlist");
	return Math.floor((58 + 29 * _[1]) / 13);
}), m_ = Og(Zg, p_, (m, _) => Math.max(0, m - _)), Ef = (m) => m.display.playlistScrollPosition, h_ = Og(m_, Ef, (m, _) => m === 0 ? 0 : Math.round(Math.round(m * _ / 100) / m * 100)), g_ = Og(Ef, Zg, p_, (m, _, x) => {
	let S = Math.max(0, _ - x);
	return Wh(m / 100, S + 1);
}), __ = Og(g_, _m, p_, (m, _, x) => _.slice(m, m + x));
function yf(m) {
	return __(m).length === m.playlist.trackOrder.length;
}
var v_ = Og(__, (m) => (_) => m.includes(_));
Og(__, Hm, (m, _) => m.map((m) => _[m]));
var If = (m) => {
	let { playlist: _, tracks: x } = m;
	if (_.currentTrack == null) return null;
	let S = x[_.currentTrack];
	return S && S.duration;
}, y_ = Og(Hm, (m) => {
	let _, x;
	return (S) => (S !== _ && (_ = S, x = ((m, _ = null) => {
		if (_ == null) return null;
		let x = m[_];
		return x == null ? null : Wg(x);
	})(m, S)), x);
}), b_ = Og(sf, y_, (m, _) => _(m)), vf = (m) => m.media.status, x_ = Og(vf, (m) => {
	switch (m) {
		case "PLAYING":
		case "PAUSED": return m;
		case "STOPPED":
		case "ENDED":
		case "CLOSED": return "STOPPED";
		default: throw Error(`Unknown media status: ${m}`);
	}
}), xf = (m) => m.media.status === dg, S_ = Og(sf, Hm, (m, _) => m == null ? null : _[m]), C_ = Og(xf, S_, (m, _) => m && _ && _.mediaTagsRequestStatus !== Rh ? _.id : null), w_ = Og(S_, (m) => m == null ? null : {
	url: m.url,
	metaData: {
		title: m.title || null,
		artist: m.artist || null,
		album: m.album || null,
		albumArtUrl: m.albumArtUrl || null
	}
}), T_ = Og(s_, b_, (m, _) => _ == null ? null : `${m}. ${_}`), E_ = Og(T_, If, (m, _) => m == null ? null : `${m} (${zh(_)})`), Df = (m) => _m(m).length, D_ = Og(Hm, (m) => Object.values(m).reduce((m, _) => m + (_.duration || 0), 0)), O_ = Og(Df, D_, _m, Hm, y_, (m, _, x, S, C) => {
	return D = {
		numberOfTracks: m,
		averageTrackLength: zh(_ / m),
		playlistLengthMinutes: Math.floor(_ / 60),
		playlistLengthSeconds: Math.floor(_ % 60),
		tracks: x.map((m, _) => `${_ + 1}. ${C(m)} (${zh(S[m].duration)})`)
	}, O = ((m) => {
		let _ = document.createElement("div"), x = Cm.createRoot(_);
		return Dt.flushSync(() => {
			x.render(Q.jsx(Km, { ...m }));
		}), `\n  <html>\n      <head>\n      <link rel="stylesheet" href="null" />\n      <style type="text/css">\n        body { background: #000040; }\n        .para1 { margin-top: -42px; margin-left: 145px; margin-right: 10px; font-family: "font2, Arial"; font-size: 30px; line-height: 35px; text-align: left; color: #E1E1E1; }\n        .para2 { margin-top: 15px; margin-left: 15px; margin-right: 50px; font-family: "font1, Arial Black"; font-size: 50px; line-height: 40px; text-align: left; color: #004080; }\n      </style>\n      <title>Winamp Generated PlayList</title>\n    </head>\n     <body bgcolor="#000080" topmargin="0" leftmargin="0" text="#FFFFFF">\n    ${_.innerHTML}\n    </body\n  </html>`;
	})(D), `data:text/html;base64,${window.btoa(O)}`;
	var D, O;
});
function Rf(m, _) {
	let [x, S] = m.size, C = _ && m.canDouble ? 2 : 1, D = 116 + 29 * S, O = 275 + 25 * x;
	return {
		height: (m.shade ? 14 : D) * C,
		width: O * C
	};
}
function Ff(m) {
	return m.windows.focused;
}
function Gf(m) {
	return m.display.doubled;
}
function zf(m) {
	return m.display.llama;
}
function Kf(m) {
	return m.display.zIndex;
}
var k_ = Og(uf, Gf, (m, _) => rm(m, (m) => Rf(m, _))), A_ = Og(k_, (m) => (_) => m[_]), j_ = Og((m) => m.windows.windowOrder, uf, (m, _) => [kh, ...m.filter((m) => m !== kh && _[m] != null)]), M_ = Og(k_, f_, j_, (m, _, x) => x.map((x) => ({
	key: x,
	...m[x],
	..._[x]
}))), N_ = Og(M_, function(m) {
	let _ = {}, x = {};
	for (let S of m) {
		let m = S.y + S.height;
		_[m] ? _[m].push(S) : _[m] = [S];
		let C = S.x + S.width;
		x[C] ? x[C].push(S) : x[C] = [S];
	}
	let S = {};
	for (let C of m) {
		let m = {}, D = C.y, O = C.x, F = _[D], I = x[O];
		if (F) for (let _ of F) {
			let x = _.x + _.width < C.x, S = _.x > C.x + C.width;
			if (!x && !S) {
				m.below = _.key;
				break;
			}
		}
		if (I) for (let _ of I) {
			let x = _.y + _.height < C.y, S = _.y > C.y + C.height;
			if (!x && !S) {
				m.right = _.key;
				break;
			}
		}
		S[C.key] = m;
	}
	return S;
}), P_ = {
	normal: "#00FF00",
	current: "#FFFFFF",
	normalbg: "#000000",
	selectedbg: "#0000C6",
	font: "Arial"
};
function qf(m) {
	return m.display.skinColors;
}
var Wf = (m) => m.display.skinPlaylistStyle || P_, Zf = (m) => {
	let _ = m.windows.genWindows[Nh];
	return _ != null && _.open ? Qh : Fg(m.display);
}, Xf = (m) => m.media.volume, $f = (m) => m.media.balance, AE = (m) => m.media.shuffle, eE = (m) => m.media.repeat, F_ = Og(S_, (m) => m != null && m.channels || null), nE = (m) => m.media.timeElapsed;
function aE(m) {
	return m.equalizer.on;
}
function iE(m) {
	return m.windows.browserWindowSize;
}
var I_ = Og(uf, (m) => {
	return _ = m, t = (m) => m.open, Object.keys(_).reduce((m, x) => (t(_[x]) && (m[x] = _[x]), m), {});
	var _, t;
}), L_ = Og(I_, Gf, (m, _) => {
	let x = 0;
	return rm(m, (m) => {
		let S = {
			x: 0,
			y: x
		};
		return x += Rf(m, _).height, S;
	});
}), oE = (m) => m.userInput.focus, sE = (m) => m.userInput.scrubPosition, uE = (m) => {
	let _ = "Winamp 2.91";
	if (m.userInput.userMessage != null) return m.userInput.userMessage;
	switch (oE(m)) {
		case "balance": return ((m) => m === 0 ? "Balance: Center" : `Balance: ${Math.abs(m)}% ${m > 0 ? "Right" : "Left"}`)(m.media.balance);
		case "volume": return `Volume: ${m.media.volume}%`;
		case "position":
			let x = If(m);
			return x == null ? _ : ((m, _) => `Seek to: ${zh(m * _ / 100, !1)}/${zh(m, !1)} (${_}%)`)(x, sE(m));
		case "double": return (m.display.doubled ? "Disable" : "Enable") + " doublesize mode";
		case "eq":
			let S = m.userInput.bandFocused;
			return S == null ? _ : ((m, _) => {
				let x = (S = (_ - 50) / 50 * 12, (Math.round(10 * S) / 10).toFixed(1));
				var S, C;
				return `EQ: ${m === "preamp" ? "Preamp" : (C = m) < 1e3 ? `${C}HZ` : C / 1e3 + "KHZ"} ${((m) => m > 0 ? `+${m}` : m.toString())(Number(x))} DB`;
			})(S, m.equalizer.sliders[S]);
	}
	return m.playlist.currentTrack == null ? _ : E_(m) ?? _;
}, R_ = Og(S_, (m) => m == null ? null : m.kbps || "0".padStart(3, " ")), z_ = Og(S_, (m) => m == null ? null : m.khz || "0".padStart(2, " "));
function gE(m) {
	return m.milkdrop.message;
}
function pE(m) {
	return m.windows.milkdropEnabled;
}
function hE(m) {
	return m.milkdrop.display === "DESKTOP";
}
function mE(m) {
	return m.milkdrop.display === "FULLSCREEN";
}
function fE(m) {
	return m.milkdrop.butterchurn;
}
function EE(m) {
	return m.milkdrop.transitionType;
}
function wE(m) {
	return m.milkdrop.currentPresetIndex;
}
function bE(m) {
	let _ = wE(m);
	if (_ == null) return null;
	let x = m.milkdrop.presets[_];
	return x == null || x.type === "UNRESOLVED" ? null : x.preset;
}
function kE(m) {
	return m.milkdrop.presets.map((m) => m.name);
}
function yE(m) {
	return m.milkdrop.overlay;
}
function SE(m) {
	return m.milkdrop.cycling;
}
function IE(m) {
	return m.milkdrop.randomize;
}
function UE(m) {
	return m.display.closed;
}
function CE(m) {
	return m.display.skinRegion;
}
var B_ = Og(function(m) {
	return m.display.skinImages.EQ_PREAMP_LINE;
}, async (m) => m == null ? null : Fh(m)), V_ = Og(function(m) {
	return m.display.skinImages.EQ_GRAPH_LINE_COLORS;
}, async (m) => m == null ? null : Fh(m));
function xE(m) {
	return m.display.marqueeStep;
}
function ME(m) {
	return m.network.connected;
}
function NE(m) {
	return m.media.timeMode;
}
function TE(m) {
	return m.display.loading;
}
function QE(m) {
	return m.display.working;
}
function LE(m) {
	return m.settings.availableSkins;
}
var H_ = 15, OE = (m) => m.y, VE = (m) => m.y + m.height, RE = (m) => m.x, FE = (m) => m.x + m.width, GE = (m, _) => Math.abs(m - _) < H_, zE = (m, _) => {
	let x, S;
	return ((m, _) => OE(m) <= VE(_) + H_ && OE(_) <= VE(m) + H_)(m, _) && (GE(RE(m), FE(_)) ? x = FE(_) : GE(FE(m), RE(_)) ? x = RE(_) - m.width : GE(RE(m), RE(_)) ? x = RE(_) : GE(FE(m), FE(_)) && (x = FE(_) - m.width)), ((m, _) => RE(m) <= FE(_) + H_ && RE(_) <= FE(m) + H_)(m, _) && (GE(OE(m), VE(_)) ? S = VE(_) : GE(VE(m), OE(_)) ? S = OE(_) - m.height : GE(OE(m), OE(_)) ? S = OE(_) : GE(VE(m), VE(_)) && (S = VE(_) - m.height)), {
		x,
		y: S
	};
}, KE = (m, _) => {
	let x = zE(m, _);
	return {
		x: x.x === void 0 ? 0 : x.x - m.x,
		y: x.y === void 0 ? 0 : x.y - m.y
	};
}, PE = (m, _) => {
	let x = 0, S = 0;
	for (let C of m) for (let m of _) {
		let _ = KE(C, m);
		if (x ||= _.x, S ||= _.y, x !== void 0 && x > 0 && S !== void 0 && S > 0) break;
	}
	return {
		x,
		y: S
	};
}, YE = (m, _) => ({
	x: m.x + _.x,
	y: m.y + _.y
});
function HE(m) {
	return (_, x) => {
		let S = x(), C = N_(S), D = k_(S);
		_(m);
		let O = k_(x()), F = {};
		for (let m of Object.keys(O)) {
			let _ = D[m], x = O[m];
			F[m] = {
				height: x.height - _.height,
				width: x.width - _.width
			};
		}
		let I = function(m, _) {
			let x = {}, S = {};
			for (let _ of Object.keys(m)) x[_] = {
				above: [],
				left: []
			}, S[_] = {
				x: 0,
				y: 0
			};
			for (let [_, S] of Object.entries(m)) {
				let { below: m, right: C } = S;
				C != null && x[C].left.push(_), m != null && x[m].above.push(_);
			}
			function a(m) {
				let C = x[m], D = _[m];
				C.left.forEach((_) => {
					S[_].x += D.width + S[m].x, a(_);
				});
			}
			function i(m) {
				let C = x[m], D = _[m];
				C.above.forEach((_) => {
					S[_].y += D.height + S[m].y, i(_);
				});
			}
			for (let [_, x] of Object.entries(m)) x.below ?? i(_), x.right ?? a(_);
			return S;
		}(C, F);
		_(Aw(rm(f_(S), (m, _) => YE(m, I[_]))));
	};
}
function jE() {
	return HE({ type: "TOGGLE_DOUBLESIZE_MODE" });
}
function _E() {
	return HE({
		type: "TOGGLE_WINDOW_SHADE_MODE",
		windowId: "equalizer"
	});
}
function JE() {
	return HE({
		type: "TOGGLE_WINDOW_SHADE_MODE",
		windowId: "main"
	});
}
function qE() {
	return HE({
		type: "TOGGLE_WINDOW_SHADE_MODE",
		windowId: "playlist"
	});
}
function WE(m) {
	return {
		type: "CLOSE_WINDOW",
		windowId: m
	};
}
function ZE(m) {
	return {
		type: "SET_FOCUSED_WINDOW",
		window: m
	};
}
function XE(m, _) {
	return {
		type: "WINDOW_SIZE_CHANGED",
		windowId: m,
		size: _
	};
}
function $E(m) {
	return {
		type: "TOGGLE_WINDOW",
		windowId: m
	};
}
function Aw(m, _) {
	return {
		type: "UPDATE_WINDOW_POSITIONS",
		positions: m,
		absolute: _
	};
}
function ew({ left: m, top: _, width: x, height: S }) {
	return (C, D) => {
		let O = D(), F = M_(O), I = c_(O), L = lm(F.filter((m) => I(m.key)));
		if (L == null) return;
		let H = L.bottom - L.top, U = L.right - L.left, W = Math.ceil(m - L.left + (x - U) / 2), q = Math.ceil(_ - L.top + (S - H) / 2);
		C(Aw(F.reduce((m, _) => ({
			...m,
			[_.key]: {
				x: W + _.x,
				y: q + _.y
			}
		}), {}), !0));
	};
}
function tw(m, _) {
	return (x) => {
		x({
			type: "BROWSER_WINDOW_SIZE_CHANGED",
			...m
		}), x(function(m) {
			return (_, x) => {
				let S = x(), C = M_(S), D = c_(S), { height: O, width: F } = m === document.body ? sm() : om(m), I = lm(C.filter((m) => D(m.key)));
				if (I == null) return;
				let L = f_(S);
				if (I.left >= 0 && I.top >= 0 && I.right <= F && I.bottom <= O) return;
				let H = I.bottom - I.top;
				if (I.right - I.left <= F && H <= O) {
					let m = 0, x = 0;
					I.top <= 0 ? m = I.top : I.bottom > O && (m = I.bottom - O), I.left <= 0 ? x = I.left : I.right > F && (x = I.right - F), _(Aw(rm(L, (_) => ({
						x: _.x - x,
						y: _.y - m
					}))));
				} else _({ type: "RESET_WINDOW_SIZES" }), _(nw()), _(function(m) {
					let _ = m === document.body, { width: x, height: S } = _ ? {
						width: window.innerWidth,
						height: window.innerHeight
					} : om(m);
					return ew({
						left: _ ? window.scrollX : 0,
						top: _ ? window.scrollY : 0,
						width: x,
						height: S
					});
				}(m));
			};
		}(_));
	};
}
function nw() {
	return (m, _) => {
		m(Aw(L_(_())));
	};
}
var U_ = [
	"hz60",
	"hz170",
	"hz310",
	"hz600",
	"hz1000",
	"hz3000",
	"hz6000",
	"hz12000",
	"hz14000",
	"hz16000",
	"preamp"
], W_ = "Winamp EQ library file v1.1", G_ = {
	a: [0, 0],
	b: [0, 1],
	c: [0, 2],
	d: [0, 3],
	e: [0, 4],
	f: [0, 5],
	g: [0, 6],
	h: [0, 7],
	i: [0, 8],
	j: [0, 9],
	k: [0, 10],
	l: [0, 11],
	m: [0, 12],
	n: [0, 13],
	o: [0, 14],
	p: [0, 15],
	q: [0, 16],
	r: [0, 17],
	s: [0, 18],
	t: [0, 19],
	u: [0, 20],
	v: [0, 21],
	w: [0, 22],
	x: [0, 23],
	y: [0, 24],
	z: [0, 25],
	"\"": [0, 26],
	"@": [0, 27],
	" ": [0, 30],
	0: [1, 0],
	1: [1, 1],
	2: [1, 2],
	3: [1, 3],
	4: [1, 4],
	5: [1, 5],
	6: [1, 6],
	7: [1, 7],
	8: [1, 8],
	9: [1, 9],
	[Bh]: [1, 10],
	".": [1, 11],
	":": [1, 12],
	"(": [1, 13],
	")": [1, 14],
	"-": [1, 15],
	"'": [1, 16],
	"!": [1, 17],
	_: [1, 18],
	"+": [1, 19],
	"\\": [1, 20],
	"/": [1, 21],
	"[": [1, 22],
	"]": [1, 23],
	"^": [1, 24],
	"&": [1, 25],
	"%": [1, 26],
	",": [1, 27],
	"=": [1, 28],
	$: [1, 29],
	"#": [1, 30],
	Å: [2, 0],
	Ö: [2, 1],
	Ä: [2, 2],
	"?": [2, 3],
	"*": [2, 4],
	"<": [1, 22],
	">": [1, 23],
	"{": [1, 22],
	"}": [1, 23]
}, lw = (m) => `CHARACTER_${m.charCodeAt(0)}`, K_ = [];
for (let m in G_) if (G_.hasOwnProperty(m)) {
	let _ = G_[m];
	K_.push({
		name: lw(m),
		y: 6 * _[0],
		x: 5 * _[1],
		width: 5,
		height: 6
	});
}
var q_ = {
	BALANCE: [
		{
			name: "MAIN_BALANCE_BACKGROUND",
			x: 9,
			y: 0,
			width: 38,
			height: 420
		},
		{
			name: "MAIN_BALANCE_THUMB",
			x: 15,
			y: 422,
			width: 14,
			height: 11
		},
		{
			name: "MAIN_BALANCE_THUMB_ACTIVE",
			x: 0,
			y: 422,
			width: 14,
			height: 11
		}
	],
	CBUTTONS: [
		{
			name: "MAIN_PREVIOUS_BUTTON",
			x: 0,
			y: 0,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_PREVIOUS_BUTTON_ACTIVE",
			x: 0,
			y: 18,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_PLAY_BUTTON",
			x: 23,
			y: 0,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_PLAY_BUTTON_ACTIVE",
			x: 23,
			y: 18,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_PAUSE_BUTTON",
			x: 46,
			y: 0,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_PAUSE_BUTTON_ACTIVE",
			x: 46,
			y: 18,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_STOP_BUTTON",
			x: 69,
			y: 0,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_STOP_BUTTON_ACTIVE",
			x: 69,
			y: 18,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_NEXT_BUTTON",
			x: 92,
			y: 0,
			width: 23,
			height: 18
		},
		{
			name: "MAIN_NEXT_BUTTON_ACTIVE",
			x: 92,
			y: 18,
			width: 22,
			height: 18
		},
		{
			name: "MAIN_EJECT_BUTTON",
			x: 114,
			y: 0,
			width: 22,
			height: 16
		},
		{
			name: "MAIN_EJECT_BUTTON_ACTIVE",
			x: 114,
			y: 16,
			width: 22,
			height: 16
		}
	],
	MAIN: [{
		name: "MAIN_WINDOW_BACKGROUND",
		x: 0,
		y: 0,
		width: 275,
		height: 116
	}],
	MONOSTER: [
		{
			name: "MAIN_STEREO",
			x: 0,
			y: 12,
			width: 29,
			height: 12
		},
		{
			name: "MAIN_STEREO_SELECTED",
			x: 0,
			y: 0,
			width: 29,
			height: 12
		},
		{
			name: "MAIN_MONO",
			x: 29,
			y: 12,
			width: 27,
			height: 12
		},
		{
			name: "MAIN_MONO_SELECTED",
			x: 29,
			y: 0,
			width: 27,
			height: 12
		}
	],
	NUMBERS: [
		{
			name: "NO_MINUS_SIGN",
			x: 9,
			y: 6,
			width: 5,
			height: 1
		},
		{
			name: "MINUS_SIGN",
			x: 20,
			y: 6,
			width: 5,
			height: 1
		},
		{
			name: "DIGIT_0",
			x: 0,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_1",
			x: 9,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_2",
			x: 18,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_3",
			x: 27,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_4",
			x: 36,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_5",
			x: 45,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_6",
			x: 54,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_7",
			x: 63,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_8",
			x: 72,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_9",
			x: 81,
			y: 0,
			width: 9,
			height: 13
		}
	],
	NUMS_EX: [
		{
			name: "NO_MINUS_SIGN_EX",
			x: 90,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "MINUS_SIGN_EX",
			x: 99,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_0_EX",
			x: 0,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_1_EX",
			x: 9,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_2_EX",
			x: 18,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_3_EX",
			x: 27,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_4_EX",
			x: 36,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_5_EX",
			x: 45,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_6_EX",
			x: 54,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_7_EX",
			x: 63,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_8_EX",
			x: 72,
			y: 0,
			width: 9,
			height: 13
		},
		{
			name: "DIGIT_9_EX",
			x: 81,
			y: 0,
			width: 9,
			height: 13
		}
	],
	PLAYPAUS: [
		{
			name: "MAIN_PLAYING_INDICATOR",
			x: 0,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_PAUSED_INDICATOR",
			x: 9,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_STOPPED_INDICATOR",
			x: 18,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_NOT_WORKING_INDICATOR",
			x: 36,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_WORKING_INDICATOR",
			x: 39,
			y: 0,
			width: 9,
			height: 9
		}
	],
	PLEDIT: [
		{
			name: "PLAYLIST_TOP_TILE",
			x: 127,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "PLAYLIST_TOP_LEFT_CORNER",
			x: 0,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "PLAYLIST_TITLE_BAR",
			x: 26,
			y: 21,
			width: 100,
			height: 20
		},
		{
			name: "PLAYLIST_TOP_RIGHT_CORNER",
			x: 153,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "PLAYLIST_TOP_TILE_SELECTED",
			x: 127,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "PLAYLIST_TOP_LEFT_SELECTED",
			x: 0,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "PLAYLIST_TITLE_BAR_SELECTED",
			x: 26,
			y: 0,
			width: 100,
			height: 20
		},
		{
			name: "PLAYLIST_TOP_RIGHT_CORNER_SELECTED",
			x: 153,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "PLAYLIST_LEFT_TILE",
			x: 0,
			y: 42,
			width: 12,
			height: 29
		},
		{
			name: "PLAYLIST_RIGHT_TILE",
			x: 31,
			y: 42,
			width: 20,
			height: 29
		},
		{
			name: "PLAYLIST_BOTTOM_TILE",
			x: 179,
			y: 0,
			width: 25,
			height: 38
		},
		{
			name: "PLAYLIST_BOTTOM_LEFT_CORNER",
			x: 0,
			y: 72,
			width: 125,
			height: 38
		},
		{
			name: "PLAYLIST_BOTTOM_RIGHT_CORNER",
			x: 126,
			y: 72,
			width: 150,
			height: 38
		},
		{
			name: "PLAYLIST_VISUALIZER_BACKGROUND",
			x: 205,
			y: 0,
			width: 75,
			height: 38
		},
		{
			name: "PLAYLIST_SHADE_BACKGROUND",
			x: 72,
			y: 57,
			width: 25,
			height: 14
		},
		{
			name: "PLAYLIST_SHADE_BACKGROUND_LEFT",
			x: 72,
			y: 42,
			width: 25,
			height: 14
		},
		{
			name: "PLAYLIST_SHADE_BACKGROUND_RIGHT",
			x: 99,
			y: 57,
			width: 50,
			height: 14
		},
		{
			name: "PLAYLIST_SHADE_BACKGROUND_RIGHT_SELECTED",
			x: 99,
			y: 42,
			width: 50,
			height: 14
		},
		{
			name: "PLAYLIST_SCROLL_HANDLE_SELECTED",
			x: 61,
			y: 53,
			width: 8,
			height: 18
		},
		{
			name: "PLAYLIST_SCROLL_HANDLE",
			x: 52,
			y: 53,
			width: 8,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_URL",
			x: 0,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_URL_SELECTED",
			x: 23,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_DIR",
			x: 0,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_DIR_SELECTED",
			x: 23,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_FILE",
			x: 0,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_FILE_SELECTED",
			x: 23,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_REMOVE_ALL",
			x: 54,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_REMOVE_ALL_SELECTED",
			x: 77,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_CROP",
			x: 54,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_CROP_SELECTED",
			x: 77,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_REMOVE_SELECTED",
			x: 54,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_REMOVE_SELECTED_SELECTED",
			x: 77,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_REMOVE_MISC",
			x: 54,
			y: 168,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_REMOVE_MISC_SELECTED",
			x: 77,
			y: 168,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_INVERT_SELECTION",
			x: 104,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_INVERT_SELECTION_SELECTED",
			x: 127,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SELECT_ZERO",
			x: 104,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SELECT_ZERO_SELECTED",
			x: 127,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SELECT_ALL",
			x: 104,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SELECT_ALL_SELECTED",
			x: 127,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SORT_LIST",
			x: 154,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SORT_LIST_SELECTED",
			x: 177,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_FILE_INFO",
			x: 154,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_FILE_INFO_SELECTED",
			x: 177,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_MISC_OPTIONS",
			x: 154,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_MISC_OPTIONS_SELECTED",
			x: 177,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_NEW_LIST",
			x: 204,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_NEW_LIST_SELECTED",
			x: 227,
			y: 111,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SAVE_LIST",
			x: 204,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_SAVE_LIST_SELECTED",
			x: 227,
			y: 130,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_LOAD_LIST",
			x: 204,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_LOAD_LIST_SELECTED",
			x: 227,
			y: 149,
			width: 22,
			height: 18
		},
		{
			name: "PLAYLIST_ADD_MENU_BAR",
			x: 48,
			y: 111,
			width: 3,
			height: 54
		},
		{
			name: "PLAYLIST_REMOVE_MENU_BAR",
			x: 100,
			y: 111,
			width: 3,
			height: 72
		},
		{
			name: "PLAYLIST_SELECT_MENU_BAR",
			x: 150,
			y: 111,
			width: 3,
			height: 54
		},
		{
			name: "PLAYLIST_MISC_MENU_BAR",
			x: 200,
			y: 111,
			width: 3,
			height: 54
		},
		{
			name: "PLAYLIST_LIST_BAR",
			x: 250,
			y: 111,
			width: 3,
			height: 54
		},
		{
			name: "PLAYLIST_CLOSE_SELECTED",
			x: 52,
			y: 42,
			width: 9,
			height: 9
		},
		{
			name: "PLAYLIST_COLLAPSE_SELECTED",
			x: 62,
			y: 42,
			width: 9,
			height: 9
		},
		{
			name: "PLAYLIST_EXPAND_SELECTED",
			x: 150,
			y: 42,
			width: 9,
			height: 9
		}
	],
	EQ_EX: [
		{
			name: "EQ_SHADE_BACKGROUND_SELECTED",
			x: 0,
			y: 0,
			width: 275,
			height: 14
		},
		{
			name: "EQ_SHADE_BACKGROUND",
			x: 0,
			y: 15,
			width: 275,
			height: 14
		},
		{
			name: "EQ_SHADE_VOLUME_SLIDER_LEFT",
			x: 1,
			y: 30,
			width: 3,
			height: 7
		},
		{
			name: "EQ_SHADE_VOLUME_SLIDER_CENTER",
			x: 4,
			y: 30,
			width: 3,
			height: 7
		},
		{
			name: "EQ_SHADE_VOLUME_SLIDER_RIGHT",
			x: 7,
			y: 30,
			width: 3,
			height: 7
		},
		{
			name: "EQ_SHADE_BALANCE_SLIDER_LEFT",
			x: 11,
			y: 30,
			width: 3,
			height: 7
		},
		{
			name: "EQ_SHADE_BALANCE_SLIDER_CENTER",
			x: 14,
			y: 30,
			width: 3,
			height: 7
		},
		{
			name: "EQ_SHADE_BALANCE_SLIDER_RIGHT",
			x: 17,
			y: 30,
			width: 3,
			height: 7
		},
		{
			name: "EQ_MAXIMIZE_BUTTON_ACTIVE",
			x: 1,
			y: 38,
			width: 9,
			height: 9
		},
		{
			name: "EQ_MINIMIZE_BUTTON_ACTIVE",
			x: 1,
			y: 47,
			width: 9,
			height: 9
		},
		{
			name: "EQ_SHADE_CLOSE_BUTTON",
			x: 11,
			y: 38,
			width: 9,
			height: 9
		},
		{
			name: "EQ_SHADE_CLOSE_BUTTON_ACTIVE",
			x: 11,
			y: 47,
			width: 9,
			height: 9
		}
	],
	EQMAIN: [
		{
			name: "EQ_WINDOW_BACKGROUND",
			x: 0,
			y: 0,
			width: 275,
			height: 116
		},
		{
			name: "EQ_TITLE_BAR",
			x: 0,
			y: 149,
			width: 275,
			height: 14
		},
		{
			name: "EQ_TITLE_BAR_SELECTED",
			x: 0,
			y: 134,
			width: 275,
			height: 14
		},
		{
			name: "EQ_SLIDER_BACKGROUND",
			x: 13,
			y: 164,
			width: 209,
			height: 129
		},
		{
			name: "EQ_SLIDER_THUMB",
			x: 0,
			y: 164,
			width: 11,
			height: 11
		},
		{
			name: "EQ_SLIDER_THUMB_SELECTED",
			x: 0,
			y: 176,
			width: 11,
			height: 11
		},
		{
			name: "EQ_CLOSE_BUTTON",
			x: 0,
			y: 116,
			width: 9,
			height: 9
		},
		{
			name: "EQ_CLOSE_BUTTON_ACTIVE",
			x: 0,
			y: 125,
			width: 9,
			height: 9
		},
		{
			name: "EQ_MAXIMIZE_BUTTON_ACTIVE_FALLBACK",
			x: 254,
			y: 152,
			width: 9,
			height: 9
		},
		{
			name: "EQ_ON_BUTTON",
			x: 10,
			y: 119,
			width: 26,
			height: 12
		},
		{
			name: "EQ_ON_BUTTON_DEPRESSED",
			x: 128,
			y: 119,
			width: 26,
			height: 12
		},
		{
			name: "EQ_ON_BUTTON_SELECTED",
			x: 69,
			y: 119,
			width: 26,
			height: 12
		},
		{
			name: "EQ_ON_BUTTON_SELECTED_DEPRESSED",
			x: 187,
			y: 119,
			width: 26,
			height: 12
		},
		{
			name: "EQ_AUTO_BUTTON",
			x: 36,
			y: 119,
			width: 32,
			height: 12
		},
		{
			name: "EQ_AUTO_BUTTON_DEPRESSED",
			x: 154,
			y: 119,
			width: 32,
			height: 12
		},
		{
			name: "EQ_AUTO_BUTTON_SELECTED",
			x: 95,
			y: 119,
			width: 32,
			height: 12
		},
		{
			name: "EQ_AUTO_BUTTON_SELECTED_DEPRESSED",
			x: 213,
			y: 119,
			width: 32,
			height: 12
		},
		{
			name: "EQ_GRAPH_BACKGROUND",
			x: 0,
			y: 294,
			width: 113,
			height: 19
		},
		{
			name: "EQ_GRAPH_LINE_COLORS",
			x: 115,
			y: 294,
			width: 1,
			height: 19
		},
		{
			name: "EQ_PRESETS_BUTTON",
			x: 224,
			y: 164,
			width: 44,
			height: 12
		},
		{
			name: "EQ_PRESETS_BUTTON_SELECTED",
			x: 224,
			y: 176,
			width: 44,
			height: 12
		},
		{
			name: "EQ_PREAMP_LINE",
			x: 0,
			y: 314,
			width: 113,
			height: 1
		}
	],
	POSBAR: [
		{
			name: "MAIN_POSITION_SLIDER_BACKGROUND",
			x: 0,
			y: 0,
			width: 248,
			height: 10
		},
		{
			name: "MAIN_POSITION_SLIDER_THUMB",
			x: 248,
			y: 0,
			width: 29,
			height: 10
		},
		{
			name: "MAIN_POSITION_SLIDER_THUMB_SELECTED",
			x: 278,
			y: 0,
			width: 29,
			height: 10
		}
	],
	SHUFREP: [
		{
			name: "MAIN_SHUFFLE_BUTTON",
			x: 28,
			y: 0,
			width: 47,
			height: 15
		},
		{
			name: "MAIN_SHUFFLE_BUTTON_DEPRESSED",
			x: 28,
			y: 15,
			width: 47,
			height: 15
		},
		{
			name: "MAIN_SHUFFLE_BUTTON_SELECTED",
			x: 28,
			y: 30,
			width: 47,
			height: 15
		},
		{
			name: "MAIN_SHUFFLE_BUTTON_SELECTED_DEPRESSED",
			x: 28,
			y: 45,
			width: 47,
			height: 15
		},
		{
			name: "MAIN_REPEAT_BUTTON",
			x: 0,
			y: 0,
			width: 28,
			height: 15
		},
		{
			name: "MAIN_REPEAT_BUTTON_DEPRESSED",
			x: 0,
			y: 15,
			width: 28,
			height: 15
		},
		{
			name: "MAIN_REPEAT_BUTTON_SELECTED",
			x: 0,
			y: 30,
			width: 28,
			height: 15
		},
		{
			name: "MAIN_REPEAT_BUTTON_SELECTED_DEPRESSED",
			x: 0,
			y: 45,
			width: 28,
			height: 15
		},
		{
			name: "MAIN_EQ_BUTTON",
			x: 0,
			y: 61,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_EQ_BUTTON_SELECTED",
			x: 0,
			y: 73,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_EQ_BUTTON_DEPRESSED",
			x: 46,
			y: 61,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_EQ_BUTTON_DEPRESSED_SELECTED",
			x: 46,
			y: 73,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_PLAYLIST_BUTTON",
			x: 23,
			y: 61,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_PLAYLIST_BUTTON_SELECTED",
			x: 23,
			y: 73,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_PLAYLIST_BUTTON_DEPRESSED",
			x: 69,
			y: 61,
			width: 23,
			height: 12
		},
		{
			name: "MAIN_PLAYLIST_BUTTON_DEPRESSED_SELECTED",
			x: 69,
			y: 73,
			width: 23,
			height: 12
		}
	],
	TEXT: K_,
	TITLEBAR: [
		{
			name: "MAIN_TITLE_BAR",
			x: 27,
			y: 15,
			width: 275,
			height: 14
		},
		{
			name: "MAIN_TITLE_BAR_SELECTED",
			x: 27,
			y: 0,
			width: 275,
			height: 14
		},
		{
			name: "MAIN_EASTER_EGG_TITLE_BAR",
			x: 27,
			y: 72,
			width: 275,
			height: 14
		},
		{
			name: "MAIN_EASTER_EGG_TITLE_BAR_SELECTED",
			x: 27,
			y: 57,
			width: 275,
			height: 14
		},
		{
			name: "MAIN_OPTIONS_BUTTON",
			x: 0,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_OPTIONS_BUTTON_DEPRESSED",
			x: 0,
			y: 9,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_MINIMIZE_BUTTON",
			x: 9,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_MINIMIZE_BUTTON_DEPRESSED",
			x: 9,
			y: 9,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_SHADE_BUTTON",
			x: 0,
			y: 18,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_SHADE_BUTTON_DEPRESSED",
			x: 9,
			y: 18,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_CLOSE_BUTTON",
			x: 18,
			y: 0,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_CLOSE_BUTTON_DEPRESSED",
			x: 18,
			y: 9,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_CLUTTER_BAR_BACKGROUND",
			x: 304,
			y: 0,
			width: 8,
			height: 43
		},
		{
			name: "MAIN_CLUTTER_BAR_BACKGROUND_DISABLED",
			x: 312,
			y: 0,
			width: 8,
			height: 43
		},
		{
			name: "MAIN_CLUTTER_BAR_BUTTON_O_SELECTED",
			x: 304,
			y: 47,
			width: 8,
			height: 8
		},
		{
			name: "MAIN_CLUTTER_BAR_BUTTON_A_SELECTED",
			x: 312,
			y: 55,
			width: 8,
			height: 7
		},
		{
			name: "MAIN_CLUTTER_BAR_BUTTON_I_SELECTED",
			x: 320,
			y: 62,
			width: 8,
			height: 7
		},
		{
			name: "MAIN_CLUTTER_BAR_BUTTON_D_SELECTED",
			x: 328,
			y: 69,
			width: 8,
			height: 8
		},
		{
			name: "MAIN_CLUTTER_BAR_BUTTON_V_SELECTED",
			x: 336,
			y: 77,
			width: 8,
			height: 7
		},
		{
			name: "MAIN_SHADE_BACKGROUND",
			x: 27,
			y: 42,
			width: 275,
			height: 14
		},
		{
			name: "MAIN_SHADE_BACKGROUND_SELECTED",
			x: 27,
			y: 29,
			width: 275,
			height: 14
		},
		{
			name: "MAIN_SHADE_BUTTON_SELECTED",
			x: 0,
			y: 27,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_SHADE_BUTTON_SELECTED_DEPRESSED",
			x: 9,
			y: 27,
			width: 9,
			height: 9
		},
		{
			name: "MAIN_SHADE_POSITION_BACKGROUND",
			x: 0,
			y: 36,
			width: 17,
			height: 7
		},
		{
			name: "MAIN_SHADE_POSITION_THUMB",
			x: 20,
			y: 36,
			width: 3,
			height: 7
		},
		{
			name: "MAIN_SHADE_POSITION_THUMB_LEFT",
			x: 17,
			y: 36,
			width: 3,
			height: 7
		},
		{
			name: "MAIN_SHADE_POSITION_THUMB_RIGHT",
			x: 23,
			y: 36,
			width: 3,
			height: 7
		}
	],
	VOLUME: [
		{
			name: "MAIN_VOLUME_BACKGROUND",
			x: 0,
			y: 0,
			width: 68,
			height: 420
		},
		{
			name: "MAIN_VOLUME_THUMB",
			x: 15,
			y: 422,
			width: 14,
			height: 11
		},
		{
			name: "MAIN_VOLUME_THUMB_SELECTED",
			x: 0,
			y: 422,
			width: 14,
			height: 11
		}
	],
	GEN: [
		{
			name: "GEN_TOP_LEFT_SELECTED",
			x: 0,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_LEFT_END_SELECTED",
			x: 26,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_CENTER_FILL_SELECTED",
			x: 52,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_RIGHT_END_SELECTED",
			x: 78,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_LEFT_RIGHT_FILL_SELECTED",
			x: 104,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_RIGHT_SELECTED",
			x: 130,
			y: 0,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_LEFT",
			x: 0,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_LEFT_END",
			x: 26,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_CENTER_FILL",
			x: 52,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_RIGHT_END",
			x: 78,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_LEFT_RIGHT_FILL",
			x: 104,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "GEN_TOP_RIGHT",
			x: 130,
			y: 21,
			width: 25,
			height: 20
		},
		{
			name: "GEN_BOTTOM_LEFT",
			x: 0,
			y: 42,
			width: 125,
			height: 14
		},
		{
			name: "GEN_BOTTOM_RIGHT",
			x: 0,
			y: 57,
			width: 125,
			height: 14
		},
		{
			name: "GEN_BOTTOM_FILL",
			x: 127,
			y: 72,
			width: 25,
			height: 14
		},
		{
			name: "GEN_MIDDLE_LEFT",
			x: 127,
			y: 42,
			width: 11,
			height: 29
		},
		{
			name: "GEN_MIDDLE_LEFT_BOTTOM",
			x: 158,
			y: 42,
			width: 11,
			height: 24
		},
		{
			name: "GEN_MIDDLE_RIGHT",
			x: 139,
			y: 42,
			width: 8,
			height: 29
		},
		{
			name: "GEN_MIDDLE_RIGHT_BOTTOM",
			x: 170,
			y: 42,
			width: 8,
			height: 24
		},
		{
			name: "GEN_CLOSE_SELECTED",
			x: 148,
			y: 42,
			width: 9,
			height: 9
		}
	]
};
function uw(m, _) {
	return RegExp(`^(.*[/\\\\])?${m}.(${_})$`, "i");
}
async function cw(m, _, x, S) {
	let C = m.file(uw(_, x));
	if (!C.length) return null;
	let D = C[C.length - 1];
	try {
		return {
			contents: await D.async(S),
			name: D.name
		};
	} catch {
		return null;
	}
}
function dw(m, _) {
	let x = document.createElement("canvas"), S = x.getContext("2d", { willReadFrequently: !0 });
	if (S == null) throw Error("Failed to get canvas context");
	let C = {};
	return _.forEach((_) => {
		x.height = _.height, x.width = _.width, S.drawImage(m, -_.x, -_.y);
		let D = x.toDataURL();
		C[_.name] = D;
	}), C;
}
async function gw(m, _) {
	let x = await cw(m, _, "(png|bmp)", "blob");
	if (!x) return null;
	let S = `image/${((m) => {
		let _ = /\.([a-z]{3,4})$/i.exec(m);
		return _ ? _[1].toLowerCase() : null;
	})(x.name) || "*"}`;
	return async function(m) {
		try {
			return await window.createImageBitmap(m);
		} catch {
			try {
				return await function(m) {
					return Fh(URL.createObjectURL(m));
				}(m);
			} catch {
				return null;
			}
		}
	}(new Blob([x.contents], { type: S }));
}
var J_ = "RIFF".split("").map((m) => m.charCodeAt(0));
async function hw(m, _) {
	let x = await cw(m, _, "CUR", "uint8array");
	if (x == null) return null;
	let S = x.contents;
	return C = S, J_.every((m, _) => C[_] === m) ? {
		type: "ani",
		aniData: S
	} : {
		type: "cur",
		url: xm(S)
	};
	var C;
}
async function mw(m) {
	let _ = m.file(uw("PLEDIT", "txt"))[0];
	if (_ == null) return Uh.playlistStyle;
	let x = await _.async("text");
	if (x == null) return Uh.playlistStyle;
	let S = x && Yh(x).text;
	return S ? ([
		"normal",
		"current",
		"normalbg",
		"selectedbg",
		"mbFG",
		"mbBG"
	].forEach((m) => {
		let _ = S[m];
		_ && (_[0] !== "#" && (_ = `#${_}`), S[m] = _.slice(0, 7));
	}), {
		...Uh.playlistStyle,
		...S
	}) : Uh.playlistStyle;
}
async function fw(m) {
	let _ = await gw(m, "GENEX");
	if (_ == null) return null;
	let x = document.createElement("canvas"), S = x.getContext("2d", { willReadFrequently: !0 });
	if (S == null) return null;
	x.width = _.width, x.height = _.height, S.drawImage(_, 0, 0);
	let a = (m) => `rgb(${S.getImageData(m, 0, 1, 1).data.slice(0, 3).join(",")})`;
	return {
		itemBackground: a(48),
		itemForeground: a(50),
		windowBackground: a(52),
		buttonText: a(54),
		windowText: a(56),
		divider: a(58),
		playlistSelection: a(60),
		listHeaderBackground: a(62),
		listHeaderText: a(64),
		listHeaderFrameTopAndLeft: a(66),
		listHeaderFrameBottomAndRight: a(68),
		listHeaderFramePressed: a(70),
		listHeaderDeadArea: a(72),
		scrollbarOne: a(74),
		scrollbarTwo: a(76),
		pressedScrollbarOne: a(78),
		pressedScrollbarTwo: a(80),
		scrollbarDeadArea: a(82),
		listTextHighlighted: a(84),
		listTextHighlightedBackground: a(86),
		listTextSelected: a(88),
		listTextSelectedBackground: a(90)
	};
}
var Ew = (m) => m.reduce((m, _) => Object.assign(m, _), {}), Y_ = [
	"CLOSE",
	"EQCLOSE",
	"EQNORMAL",
	"EQSLID",
	"EQTITLE",
	"MAINMENU",
	"MMENU",
	"MIN",
	"NORMAL",
	"PCLOSE",
	"PNORMAL",
	"POSBAR",
	"PSIZE",
	"PTBAR",
	"PVSCROLL",
	"PWINBUT",
	"PWSNORM",
	"PWSSIZE",
	"SONGNAME",
	"TITLEBAR",
	"VOLBAL",
	"WINBUT",
	"WSNORMAL",
	"WSPOSBAR"
];
async function bw(m) {
	let _ = await cw(m, "VISCOLOR", "txt", "text");
	return _ ? ((m) => {
		let _ = m.split("\n"), x = /^\s*(\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)/, S = [...Uh.colors];
		return _.map((m) => x.exec(m)).filter(Boolean).map((m) => m.slice(1, 4).join(",")).forEach((m, _) => {
			S[_] = `rgb(${m})`;
		}), S;
	})(_.contents) : Uh.colors;
}
async function kw(m) {
	return Ew(await Promise.all(Object.keys(q_).map((_) => async function(m, _) {
		let x = await gw(m, _);
		return x == null ? {} : dw(x, q_[_]);
	}(m, _))));
}
async function yw(m) {
	return Ew(await Promise.all(Y_.map(async (_) => ({ [_]: await hw(m, _) }))));
}
async function Sw(m) {
	let _ = await cw(m, "REGION", "txt", "text");
	return _ ? function(m) {
		let _ = Yh(m), x = {};
		return Object.keys(_).forEach((m) => {
			let { numpoints: S, pointlist: C } = _[m];
			if (!S || !C) return;
			let D = S.split(/\s*,\s*/).filter((m) => m !== ""), O = function(m) {
				let _ = [];
				for (let x = 0; x < m.length; x += 2) _.push(`${m[x]},${m[x + 1]}`);
				return _;
			}(C.split(/\s*[, ]\s*/).filter((m) => m !== "")), F = 0, I = D.map((m) => {
				let _ = Number(m);
				if (_ < 3) return F += _, null;
				let x = O.slice(F, F + _).join(" ");
				return x.length ? (F += _, x) : null;
			}).filter((m) => m != null);
			I.length && (x[m] = I);
		}), x;
	}(_.contents) : {};
}
async function Iw(m) {
	let _ = await gw(m, "GEN");
	if (_ == null) return null;
	let x = document.createElement("canvas"), S = x.getContext("2d", { willReadFrequently: !0 });
	x.width = _.width, x.height = _.height, S.drawImage(_, 0, 0);
	let a = (m, _) => {
		let a = (_) => S.getImageData(_, m, 1, 1).data.join(","), C = 1, D = a(0);
		return Vh.map((S) => {
			let O = C;
			for (; a(O) !== D && O < x.width;) O++;
			let F = {
				x: C,
				y: m,
				height: 7,
				width: O - C,
				name: `${_}_${S}`
			};
			return C = O + 1, F;
		});
	}, C = {}, D = [...a(88, "GEN_TEXT_SELECTED"), ...a(96, "GEN_TEXT")];
	return D.forEach((m) => {
		C[m.name] = m.width;
	}), [C, dw(_, D)];
}
var Uw = class {
	constructor(m = [], _ = (m, _) => m < _ ? -1 : +(m > _)) {
		if (this.data = m, this.length = this.data.length, this.compare = _, this.length > 0) for (let m = (this.length >> 1) - 1; m >= 0; m--) this._down(m);
	}
	push(m) {
		this.data.push(m), this._up(this.length++);
	}
	pop() {
		if (this.length === 0) return;
		let m = this.data[0], _ = this.data.pop();
		return --this.length > 0 && (this.data[0] = _, this._down(0)), m;
	}
	peek() {
		return this.data[0];
	}
	_up(m) {
		let { data: _, compare: x } = this, S = _[m];
		for (; m > 0;) {
			let C = m - 1 >> 1, D = _[C];
			if (x(S, D) >= 0) break;
			_[m] = D, m = C;
		}
		_[m] = S;
	}
	_down(m) {
		let { data: _, compare: x } = this, S = this.length >> 1, C = _[m];
		for (; m < S;) {
			let S = 1 + (m << 1), D = S + 1;
			if (D < this.length && x(_[D], _[S]) < 0 && (S = D), x(_[S], C) >= 0) break;
			_[m] = _[S], m = S;
		}
		_[m] = C;
	}
};
function Cw() {
	return (m, _) => {
		let x = _();
		if (r_(x).length === 0) return;
		let S = $m(x), { playlist: { trackOrder: C } } = x;
		m({
			type: "REMOVE_TRACKS",
			ids: C.filter((m) => !S.has(m))
		});
	};
}
function vw() {
	return (m, _) => {
		m({
			type: "REMOVE_TRACKS",
			ids: Array.from($m(_()))
		});
	};
}
function Bw() {
	return (m) => {
		m({ type: "STOP" }), m({ type: "REMOVE_ALL_TRACKS" });
	};
}
function xw() {
	return { type: "REVERSE_LIST" };
}
function Mw() {
	return { type: "RANDOMIZE_LIST" };
}
function Nw() {
	return (m, _) => {
		let x = _(), S = Hm(x), C = (D = _m(x), r = (m) => `${S[m].title}`.toLowerCase(), [...D].sort((m, _) => {
			let x = r(m), S = r(_);
			return x < S ? -1 : +(x > S);
		}));
		var D, r;
		return m({
			type: "SET_TRACK_ORDER",
			trackOrder: C
		});
	};
}
function Tw(m) {
	return {
		type: "SET_PLAYLIST_SCROLL_POSITION",
		position: m
	};
}
function Qw(m) {
	return (_, x) => {
		let S = x(), C = m_(S), D = g_(S);
		return _({
			type: "SET_PLAYLIST_SCROLL_POSITION",
			position: 100 * (C ? Hh((D + m) / C, 0, 1) : 0)
		});
	};
}
function Lw(m) {
	return m.preventDefault(), (_, x) => {
		let S = x();
		m_(S) && m.stopPropagation();
		let C = 13 * S.playlist.trackOrder.length, D = m.deltaY / C * 100;
		_({
			type: "SET_PLAYLIST_SCROLL_POSITION",
			position: Hh(S.display.playlistScrollPosition + D, 0, 100)
		});
	};
}
function Dw() {
	return Qw(-4);
}
function Ow() {
	return Qw(4);
}
function Vw(m) {
	return (_, x) => {
		let S = x(), C = Hm(S), D = _m(S), O = n_(S), F = D.findIndex((m) => C[m] && O.has(m));
		if (F === -1) return;
		let I = function(m, _) {
			for (let x = m.length - 1; x >= 0; x--) if (_(m[x])) return x;
			return -1;
		}(D, (m) => C[m] && O.has(m));
		if (I === -1) throw Error("We found a first selected, but not a last selected.");
		let L = Hh(m, -F, D.length - 1 - I);
		L !== 0 && _({
			type: "DRAG_SELECTED",
			offset: L
		});
	};
}
function Rw() {
	return { type: "INVERT_SELECTION" };
}
function Fw() {
	return { type: "SELECT_ZERO" };
}
function Gw() {
	return { type: "SELECT_ALL" };
}
function zw(m) {
	return m < 55 && m > 45 ? 50 : m;
}
function Kw(m, _) {
	return {
		type: "SET_BAND_VALUE",
		band: m,
		value: zw(_)
	};
}
function Pw(m) {
	return (_) => {
		Object.values(Oh).forEach((x) => {
			_({
				type: "SET_BAND_VALUE",
				value: m,
				band: x
			});
		});
	};
}
function Yw() {
	return Pw(100);
}
function Hw() {
	return Pw(50);
}
function jw() {
	return Pw(0);
}
function _w(m) {
	return {
		type: "SET_BAND_VALUE",
		band: "preamp",
		value: zw(m)
	};
}
function Jw() {
	return (m, _) => {
		_().equalizer.on ? m({ type: "SET_EQ_OFF" }) : m({ type: "SET_EQ_ON" });
	};
}
function qw() {
	return (m) => {
		m({
			type: "SET_EQ_AUTO",
			value: !1
		});
	};
}
var X_ = new class {
	constructor({ threads: m }) {
		this._queue = new Uw([], (m, _) => m.priority() - _.priority()), this._availableThreads = m;
	}
	push(m, _) {
		let x = {
			task: m,
			priority: _
		};
		return this._queue.push(x), setTimeout(() => {
			this._run();
		}, 0), () => {
			this._queue = this._queue.filter((m) => m !== x);
		};
	}
	_run() {
		for (; this._availableThreads > 0;) {
			if (this._queue.length === 0) return;
			this._availableThreads--;
			let m = this._queue.pop().task();
			Vg(typeof m.then == "function", `LoadQueue only supports loading Promises. Got ${m}`), m.then(() => {
				this._availableThreads++, this._run();
			});
		}
	}
}({ threads: 4 });
function Zw(m, _, x) {
	return ob(Array.from(m).map((m) => ({
		blob: m,
		defaultName: m.name
	})), _, x);
}
var Z_ = /* @__PURE__ */ RegExp("(wsz|zip)$", "i"), Q_ = /* @__PURE__ */ RegExp("eqf$", "i");
function Ab(m, _ = Ih, x = void 0) {
	return (S) => {
		if (!(m.length < 1)) {
			if (m.length === 1) {
				let _ = m[0];
				if (Z_.test(_.name)) return void S(eb(_));
				if (Q_.test(_.name)) return void S(function(m) {
					return async (_) => {
						_(ub(function(m) {
							let _ = {
								type: "",
								presets: []
							}, x = 0, S = new Int8Array(m);
							if (_.type = String.fromCharCode.apply(null, Array.from(S.slice(x, 27))), _.type !== W_) throw Error("Invalid .eqf file.");
							for (x += 27, x += 4; x < S.length;) {
								let m = {}, C = x, D = C + 257;
								for (; S[x] !== 0 && x <= D;) x++;
								m.name = String.fromCharCode.apply(null, Array.from(S.slice(C, x))), x = D, U_.forEach((_) => {
									m[_] = 64 - S[x++];
								}), _.presets.push(m);
							}
							return _;
						}(await async function(m) {
							return Vg(m != null, "Attempt to get an ArrayBuffer without assigning a fileReference"), new Promise((_, x) => {
								let S = new FileReader();
								S.onload = () => {
									_(S.result);
								}, S.onerror = x, S.readAsArrayBuffer(m);
							});
						}(m)).presets[0]));
					};
				}(_));
			}
			S(Zw(m, _, x));
		}
	};
}
function eb(m) {
	return async (_, x, { requireJSZip: S }) => {
		if (!S) return void alert("Webamp has not been configured to support custom skins.");
		let C;
		_({ type: "LOADING" });
		try {
			C = await S();
		} catch {
			_({ type: "LOADED" }), alert("Failed to load the skin parser.");
			return;
		}
		try {
			let x = await async function(m, _) {
				let x = await _.loadAsync(m), [S, C, D, O, F, I, L] = await Promise.all([
					bw(x),
					mw(x),
					kw(x),
					yw(x),
					Sw(x),
					Iw(x),
					fw(x)
				]), [H, U] = I || [null, {}];
				return {
					colors: S,
					playlistStyle: C,
					images: {
						...D,
						...U
					},
					genLetterWidths: H,
					cursors: O,
					region: F,
					genExColors: L
				};
			}(m, C);
			_({
				type: "SET_SKIN_DATA",
				data: {
					skinImages: x.images,
					skinColors: x.colors,
					skinPlaylistStyle: x.playlistStyle,
					skinCursors: x.cursors,
					skinRegion: x.region,
					skinGenLetterWidths: x.genLetterWidths,
					skinGenExColors: x.genExColors
				}
			});
		} catch {
			_({ type: "LOADED" }), alert("Failed to parse skin");
		}
	};
}
function tb(m) {
	return async (_) => {
		_({ type: "LOADING" });
		try {
			let x = await fetch(m);
			if (!x.ok) throw Error(x.statusText);
			_(eb(x.blob()));
		} catch {
			_({ type: "LOADED" }), alert(`Failed to download skin from ${m}`);
		}
	};
}
function nb(m, _) {
	return async (x) => {
		let S = await Bm({ accept: m });
		x({
			type: "OPENED_FILES",
			expectedType: _,
			count: S.length,
			firstFileName: S[0]?.name
		}), x(Ab(S));
	};
}
function ab() {
	return nb(".eqf", "EQ");
}
function ib() {
	return nb(null, "MEDIA");
}
function rb() {
	return nb(".zip, .wsz", "SKIN");
}
function lb(m, _ = Lh, x = 0) {
	let { files: S } = m.dataTransfer;
	return async (C, D, { handleTrackDropEvent: O }) => {
		if (O) {
			let S = await O(m);
			if (S != null) return void C(ob(S, _, x));
		}
		C(Ab(S, _, x));
	};
}
function ob(m, _ = Lh, x = 0) {
	return (S) => {
		_ === Ih && S((m) => {
			m({ type: "STOP" }), m({ type: "REMOVE_ALL_TRACKS" });
		}), m.forEach((m, C) => {
			S(function(m, _ = Lh, x = 0) {
				return (S) => {
					let C = wg++, { defaultName: D, metaData: O, duration: F } = m, I;
					if ("url" in m) I = m.url.toString();
					else {
						if (!("blob" in m)) throw Error("Expected track to have either a blob or a url");
						I = URL.createObjectURL(m.blob);
					}
					switch (S({
						type: "ADD_TRACK_FROM_URL",
						url: I,
						duration: m.duration,
						defaultName: D,
						id: C,
						atIndex: x
					}), _) {
						case Ph:
							S({
								type: "BUFFER_TRACK",
								id: C
							});
							break;
						case Ih:
							S({
								type: "PLAY_TRACK",
								id: C
							});
							break;
						default: S(F == null ? function(m, _) {
							return (x, S) => {
								X_.push(async () => {
									try {
										x({
											type: "SET_MEDIA_DURATION",
											duration: await function(m) {
												return Vg(typeof m == "string", "Attempted to get the duration of media file without passing a url"), new Promise((_, x) => {
													let S = document.createElement("audio");
													S.crossOrigin = "anonymous";
													let a = () => {
														_(S.duration), S.removeEventListener("durationchange", a), S.removeEventListener("error", i), S.src = "";
													}, i = (m) => {
														S.removeEventListener("durationchange", a), S.removeEventListener("error", i), x(m);
													};
													S.addEventListener("durationchange", a), S.addEventListener("error", i), S.src = m;
												});
											}(m),
											id: _
										});
									} catch {}
								}, () => v_(S())(_) ? 5 : 15);
							};
						}(I, C) : {
							type: "SET_MEDIA_DURATION",
							duration: F,
							id: C
						});
					}
					if (O != null) {
						let { artist: m, title: _, album: x } = O;
						S({
							type: "SET_MEDIA_TAGS",
							artist: m,
							title: _,
							album: x,
							sampleRate: 44e3,
							bitrate: 192e3,
							numberOfChannels: 2,
							id: C
						});
					} else S("blob" in m ? sb(m.blob, C) : function(m) {
						return (_, x) => {
							let S = Hm(x())[m];
							X_.push(() => _(sb(S.url, m)), () => v_(x())(m) ? 10 : 20);
						};
					}(C));
				};
			}(m, C === 0 ? _ : Lh, x + C));
		});
	};
}
function sb(m, _) {
	return async (x, S, { requireMusicMetadata: C }) => {
		x({
			type: "MEDIA_TAG_REQUEST_INITIALIZED",
			id: _
		});
		try {
			let S = await async function(m, _) {
				Vg(m != null, "Attempted to get the tags of media file without passing a file");
				let x = {
					duration: !0,
					skipPostHeaders: !0
				};
				if (typeof m == "string") {
					if ("parseWebStream" in _ && typeof _.parseWebStream == "function") {
						let S = await fetch(m);
						if (!S.ok) throw Error(`Failed to fetch URL: ${m}, status: ${S.status}`);
						let C = S.body;
						if (C == null) throw Error("Response body is null, cannot parse metadata.");
						return _.parseWebStream(C, void 0, x);
					}
					if ("fetchFromUrl" in _ && typeof _.fetchFromUrl == "function") return _.fetchFromUrl(m, x);
					throw Error("No suitable method available to parse URL");
				}
				return _.parseBlob(m, x);
			}(m, await C()), { artist: D, title: O, album: F, picture: I } = S.common, { numberOfChannels: L, bitrate: H, sampleRate: U } = S.format, W = null;
			if (I && I.length >= 1) {
				let m = new Uint8Array(I[0].data), _ = new Blob([m], { type: I[0].format });
				W = URL.createObjectURL(_);
			}
			x({
				type: "SET_MEDIA_TAGS",
				artist: D || "",
				title: O || "",
				album: F,
				albumArtUrl: W,
				numberOfChannels: L,
				bitrate: H,
				sampleRate: U,
				id: _
			});
		} catch {
			x({
				type: "MEDIA_TAG_REQUEST_FAILED",
				id: _
			});
		}
	};
}
function ub(m) {
	return (_) => {
		_(_w(_g(m.preamp))), Oh.forEach((x) => {
			_(Kw(x, _g(m[`hz${x}`])));
		});
	};
}
function cb() {
	return (m, _) => {
		_h(`data:application/zip;base64,${((m) => jh(new Uint8Array(m)))(function(m) {
			let _ = [];
			for (let m = 0; m < 27; m++) _.push(W_.charCodeAt(m));
			_.push(26);
			for (let m = 0; m < 3; m++) _.push("!--".charCodeAt(m));
			if (!m.presets) throw Error("Eqf data is missing presets");
			return m.presets.forEach((m) => {
				let x = 0;
				for (; x < m.name.length; x++) _.push(m.name.charCodeAt(x));
				for (; x < 257; x++) _.push(0);
				U_.forEach((x) => {
					_.push(64 - m[x]);
				});
			}), new Uint8Array(_).buffer;
		}(Xg(_())))}`, "entry.eqf");
	};
}
function db() {
	return (m, _) => {
		_h(O_(_()), "Winamp Playlist.html");
	};
}
var $_ = document.createElement("input");
$_.type = "file";
var ev = $_.webkitdirectory !== void 0 || $_.mozdirectory !== void 0 || $_.directory !== void 0;
function hb(m) {
	return async (_) => {
		_(Zw(await Bm(), Lh, m));
	};
}
function mb(m) {
	return async (_) => {
		ev ? _(Zw(await Bm({ directory: !0 }), Lh, m)) : alert("Not supported in your browser");
	};
}
function fb(m = 0) {
	return async (_, x, { handleAddUrlEvent: S }) => {
		if (S) {
			let x = await S();
			if (x != null) return void _(ob(x, Lh, m));
		} else alert("Not supported in Webamp");
	};
}
function Eb() {
	return async (m, _, { handleLoadListEvent: x }) => {
		if (x) {
			let _ = await x();
			if (_ != null) return m((m) => {
				m({ type: "STOP" }), m({ type: "REMOVE_ALL_TRACKS" });
			}), void m(ob(_, Lh, 0));
		} else alert("Not supported in Webamp");
	};
}
function wb() {
	return (m, _, { handleSaveListEvent: x }) => {
		x ? x(e_(_())) : alert("Not supported in Webamp");
	};
}
function bb(m, _) {
	return (x) => x({
		type: "DROPPED_FILES",
		count: m.dataTransfer.files.length,
		firstFileName: m.dataTransfer.files[0]?.name,
		windowId: _
	});
}
function kb(m) {
	return (_, x) => {
		_(x_(x()) === fg ? {
			type: "BUFFER_TRACK",
			id: m
		} : {
			type: "PLAY_TRACK",
			id: m
		});
	};
}
function yb(m) {
	return {
		type: "PLAY_TRACK",
		id: m
	};
}
function Sb() {
	return (m, _) => {
		let x = _();
		x.media.status === fg && x.playlist.currentTrack == null && x.playlist.trackOrder.length === 0 ? m(ib()) : m({ type: "PLAY" });
	};
}
function Ib() {
	return (m, _) => {
		let { status: x } = _().media;
		m(x === dg ? { type: "PAUSE" } : { type: "PLAY" });
	};
}
function Ub() {
	return { type: "STOP" };
}
function Cb(m) {
	return (_, x) => {
		let S = ((m, _ = 1) => {
			let { playlist: { trackOrder: x }, media: { repeat: S, shuffle: C } } = m;
			if (C) return ((m) => {
				let { playlist: { trackOrder: _, currentTrack: x } } = m;
				if (_.length === 0) return null;
				let S;
				do
					S = _[Math.floor(_.length * Math.random())];
				while (S === x && _.length > 1);
				return S;
			})(m);
			let D = Zg(m);
			if (D === 0) return null;
			let O = lf(m), F = O + _;
			return S ? (F %= D, F < 0 && (F += D), x[F]) : O === D - 1 && _ > 0 || O === 0 && _ < 0 ? null : (F = Hh(F, 0, D - 1), x[F]);
		})(x(), m);
		_(S == null ? { type: "IS_STOPPED" } : kb(S));
	};
}
function vb() {
	return Cb(1);
}
function Bb() {
	return Cb(-1);
}
function xb(m) {
	return function(_, x) {
		let S = If(x());
		S != null && _({
			type: "SEEK_TO_PERCENT_COMPLETE",
			percent: m / S * 100
		});
	};
}
function Mb(m) {
	return function(_, x) {
		_(xb(nE(x()) + m));
	};
}
function Nb(m) {
	return Mb(-m);
}
function Tb(m) {
	return {
		type: "SET_VOLUME",
		volume: Hh(m, 0, 100)
	};
}
function Qb(m) {
	return (_, x) => _(Tb(x().media.volume + m));
}
function Lb(m) {
	return m.preventDefault(), (_, x) => _(Tb(x().media.volume + m.deltaY));
}
function Db(m) {
	return m = Hh(m, -100, 100), Math.abs(m) < 25 && (m = 0), {
		type: "SET_BALANCE",
		balance: m
	};
}
function Ob() {
	return { type: "TOGGLE_REPEAT" };
}
function Vb() {
	return { type: "TOGGLE_SHUFFLE" };
}
function Rb() {
	return { type: "TOGGLE_TIME_MODE" };
}
function Fb(m) {
	let { name: _ } = m;
	if ("butterchurnPresetObject" in m) return {
		type: "RESOLVED",
		name: _,
		preset: m.butterchurnPresetObject
	};
	if ("getButterchrunPresetObject" in m) return {
		type: "UNRESOLVED",
		name: _,
		getPreset: m.getButterchrunPresetObject
	};
	if ("butterchurnPresetUrl" in m) return {
		type: "UNRESOLVED",
		name: _,
		getPreset: async () => (await fetch(m.butterchurnPresetUrl)).json()
	};
	throw Error("Invalid preset object");
}
function Gb(m) {
	return (_, x) => {
		let S = x(), C = S.milkdrop.presets.length;
		_({
			type: "GOT_BUTTERCHURN_PRESETS",
			presets: m
		}), C === 0 && IE(S) ? _(Yb()) : _(Hb(C, Kg.IMMEDIATE, !0));
	};
}
function zb(m) {
	return async (_, x, { convertPreset: S }) => {
		_(Gb(Array.from(m).map((m) => {
			let _ = m.name.toLowerCase();
			if (_.endsWith(".milk")) {
				if (S == null) throw Error("Invalid type");
				return {
					type: "UNRESOLVED",
					name: m.name.slice(0, m.name.length - 5),
					getPreset: () => S(m)
				};
			}
			return _.endsWith(".json") ? {
				type: "UNRESOLVED",
				name: m.name.slice(0, m.name.length - 5),
				getPreset: async () => {
					let _ = await vm(m);
					return JSON.parse(_);
				}
			} : null;
		}).filter(Boolean)));
	};
}
function Kb(m = Kg.DEFAULT) {
	return (_, x) => {
		let S = x();
		if (IE(S)) return _(Yb(m));
		let C = wE(S);
		C != null && _(Hb(C + 1, m, !0));
	};
}
function Pb(m = Kg.DEFAULT) {
	return (_, x) => {
		let { presetHistory: S } = x().milkdrop;
		S.length < 1 || _(Hb(S[S.length - 2], m, !1));
	};
}
function Yb(m = Kg.DEFAULT) {
	return (_, x) => {
		let S = x();
		_(Hb(Math.floor(Math.random() * S.milkdrop.presets.length), m, !0));
	};
}
function Hb(m, _, x) {
	return async (S, C) => {
		let D = C().milkdrop.presets[m];
		if (D != null) switch (S({
			type: "PRESET_REQUESTED",
			index: m,
			addToHistory: x
		}), D.type) {
			case "RESOLVED":
				S({
					type: "SELECT_PRESET_AT_INDEX",
					index: m,
					transitionType: _
				});
				return;
			case "UNRESOLVED":
				S({
					type: "RESOLVE_PRESET_AT_INDEX",
					index: m,
					json: await D.getPreset()
				}), S({
					type: "SELECT_PRESET_AT_INDEX",
					index: m,
					transitionType: _
				});
				return;
		}
	};
}
function jb(m) {
	return zb(m.dataTransfer.files);
}
function _b() {
	return { type: "TOGGLE_RANDOMIZE_PRESETS" };
}
function Jb() {
	return { type: "TOGGLE_PRESET_CYCLING" };
}
function qb(m) {
	return {
		type: "SCHEDULE_MILKDROP_MESSAGE",
		message: m
	};
}
function Wb() {
	return (m) => {
		let _ = !1;
		m({
			type: "CLOSE_REQUESTED",
			cancel: () => {
				_ = !0;
			}
		}), _ || (m({ type: "STOP" }), m({ type: "CLOSE_WINAMP" }));
	};
}
function Zb() {
	return { type: "TOGGLE_VISUALIZER_STYLE" };
}
function Xb() {
	return { type: "MINIMIZE_WINAMP" };
}
function $b(m) {
	return {
		type: "SET_FOCUS",
		input: m
	};
}
function Ak() {
	return { type: "UNSET_FOCUS" };
}
function ek(m) {
	return {
		type: "SET_BAND_FOCUS",
		input: "eq",
		bandFocused: m
	};
}
function tk() {
	return { type: "LOAD_DEFAULT_SKIN" };
}
function nk() {
	return (m, _) => {
		hE(_()) ? m({
			type: "SET_MILKDROP_DESKTOP",
			enabled: !1
		}) : m({
			type: "SET_MILKDROP_DESKTOP",
			enabled: !0
		});
	};
}
function ak(m) {
	return {
		type: "SET_MILKDROP_FULLSCREEN",
		enabled: m
	};
}
function ik() {
	return (m, _) => {
		m(ak(!mE(_())));
	};
}
function rk() {
	return (m, _) => {
		yE(_()) && m(ZE(Nh)), m({ type: "TOGGLE_PRESET_OVERLAY" });
	};
}
function lk() {
	return { type: "STEP_MARQUEE" };
}
$_ = null;
var ok = (m) => (_) => {
	let { media: { volume: x, balance: S }, equalizer: { sliders: C } } = _.getState();
	return m.setVolume(x), m.setBalance(S), m.setPreamp(C.preamp), m.on("timeupdate", () => {
		_.dispatch({
			type: "UPDATE_TIME_ELAPSED",
			elapsed: m.timeElapsed()
		});
	}), m.on("ended", () => {
		_.dispatch(vb());
	}), m.on("playing", () => {
		_.dispatch({ type: "IS_PLAYING" });
	}), m.on("waiting", () => {
		_.dispatch({ type: "START_WORKING" });
	}), m.on("stopWaiting", () => {
		_.dispatch({ type: "STOP_WORKING" });
	}), m.on("fileLoaded", () => {
		let x = sf(_.getState());
		x != null && _.dispatch({
			id: x,
			type: "SET_MEDIA",
			kbps: "128",
			khz: "44",
			channels: 2,
			length: m.duration()
		});
	}), (x) => (S) => {
		let C = x(S), D = _.getState();
		switch (S.type) {
			case "PLAY":
				m.play();
				break;
			case "PAUSE":
				m.pause();
				break;
			case "STOP":
				m.stop();
				break;
			case "SET_VOLUME":
				m.setVolume(Xf(D));
				break;
			case "SET_BALANCE":
				m.setBalance($f(D));
				break;
			case "SEEK_TO_PERCENT_COMPLETE":
				m.seekToPercentComplete(S.percent);
				break;
			case "PLAY_TRACK": {
				let x = jm(_.getState())(S.id);
				x != null && m.loadFromUrl(x, !0);
				break;
			}
			case "BUFFER_TRACK": {
				let x = jm(_.getState())(S.id);
				x != null && m.loadFromUrl(x, !1);
				break;
			}
			case "SET_BAND_VALUE":
				S.band === "preamp" ? m.setPreamp(S.value) : m.setEqBand(S.band, S.value);
				break;
			case "SET_EQ_OFF":
				m.disableEq();
				break;
			case "SET_EQ_ON": m.enableEq();
		}
		return C;
	};
}, tv = typeof window < "u" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.({ actionsDenylist: ["UPDATE_TIME_ELAPSED", "STEP_MARQUEE"] }) || mh;
function uk(m, _, x = [], S, C) {
	let D;
	S && (D = Am(Jg(void 0, { type: "@@init" }), S));
	let O = tv(function(...m) {
		return (_) => (x, S) => {
			let C = _(x, S), i = () => {
				throw Error(ch(15));
			}, D = {
				getState: C.getState,
				dispatch: (m, ..._) => i(m, ..._)
			};
			return i = mh(...m.map((m) => m(D)))(C.dispatch), {
				...C,
				dispatch: i
			};
		};
	}((F = C, ({ dispatch: m, getState: _ }) => (x) => (S) => typeof S == "function" ? S(m, _, F) : x(S)), ok(m), () => (m) => (x) => (_.trigger(x.type, x), m(x)), ...x));
	var F;
	return function(m, _, x) {
		return hh(m, _, x);
	}(Jg, D, O);
}
function ck(m) {
	let { onChange: _, enabled: x } = m, S = $.useRef(null);
	return $.useEffect(() => {
		function A() {
			_ && _(document.fullscreenElement === S.current);
		}
		return document.addEventListener("fullscreenchange", A), () => {
			document.removeEventListener("fullscreenchange", A);
		};
	}, [_]), $.useLayoutEffect(() => {
		let m = document.fullscreenElement === S.current;
		var _;
		m && !x ? document.fullscreenEnabled && document.exitFullscreen() : !m && x && S.current != null && (_ = S.current, document.fullscreenEnabled && _.requestFullscreen());
	}, [x]), Q.jsx("div", {
		ref: S,
		style: m.enabled ? {
			height: "100%",
			width: "100%"
		} : void 0,
		children: m.children
	});
}
function dk(m) {
	let [_, x] = $.useState(null);
	return $.useEffect(() => {
		let _ = !1;
		return m.then((m) => {
			_ || x(m);
		}), () => {
			_ = !0;
		};
	}, [m]), _;
}
var nv = { current: {
	pageX: 0,
	pageY: 0
} }, rv = 0, hk = ({ pageX: m, pageY: _ }) => {
	nv.current = {
		pageX: m,
		pageY: _
	};
};
function mk(m) {
	return yh(m);
}
function fk(m) {
	let _ = Ek();
	return $.useCallback((...x) => _(m(...x)), [_, m]);
}
function Ek() {
	return Ch();
}
var iv, av = { exports: {} };
iv = av, function() {
	var m = {}.hasOwnProperty;
	function e() {
		for (var m = "", _ = 0; _ < arguments.length; _++) {
			var x = arguments[_];
			x && (m = n(m, t(x)));
		}
		return m;
	}
	function t(_) {
		if (typeof _ == "string" || typeof _ == "number") return _;
		if (typeof _ != "object") return "";
		if (Array.isArray(_)) return e.apply(null, _);
		if (_.toString !== Object.prototype.toString && !_.toString.toString().includes("[native code]")) return _.toString();
		var x = "";
		for (var S in _) m.call(_, S) && _[S] && (x = n(x, S));
		return x;
	}
	function n(m, _) {
		return _ ? m ? m + " " + _ : m + _ : m;
	}
	iv.exports ? (e.default = e, iv.exports = e) : window.classNames = e;
}();
var ov = e(av.exports), sv = $.memo(function(m) {
	let { currentSize: _, setWindowSize: x, widthOnly: S, ...C } = m, [D, O] = $.useState(!1), [F, I] = $.useState(null);
	$.useEffect(() => {
		if (!1 === D || F == null) return;
		let [x, C] = _, l = (_) => {
			let D = cm(_) - F.x, O = dm(_) - F.y, I = [Math.max(0, x + Math.round(D / 25)), S ? x : Math.max(0, C + Math.round(O / 29))];
			m.setWindowSize(I);
		};
		window.addEventListener("mousemove", l), window.addEventListener("touchmove", l);
		let s = () => O(!1);
		return window.addEventListener("mouseup", s), window.addEventListener("touchend", s), () => {
			window.removeEventListener("mousemove", l), window.removeEventListener("touchmove", l), window.removeEventListener("mouseup", s), window.removeEventListener("touchend", s);
		};
	}, [F, D]);
	let u = (m) => {
		I({
			x: cm(m),
			y: dm(m)
		}), O(!0);
	};
	return Q.jsx("div", {
		onMouseDown: u,
		onTouchStart: u,
		...C
	});
});
function Sk({ onKeyDown: m, windowId: _, children: x }) {
	let S = mk(Ff), C = fk(ZE), D = $.useCallback(() => {
		_ !== S && C(_);
	}, [
		_,
		S,
		C
	]), [O, F] = $.useState(null);
	return $.useEffect(() => {
		if (O != null && m != null) return O.addEventListener("keydown", m), () => O.removeEventListener("keydown", m);
	}, [
		m,
		_,
		S,
		O
	]), $.useEffect(() => {
		if (O == null || _ !== S) return;
		let m = new MutationObserver((m) => {
			document.activeElement === document.body && m.some((m) => m.removedNodes.length > 0) && O.focus();
		});
		return m.observe(O, {
			subtree: !0,
			attributes: !1,
			childList: !0
		}), () => m.disconnect();
	}, [
		_,
		S,
		O
	]), Q.jsx("div", {
		ref: F,
		onPointerDown: D,
		onFocus: D,
		tabIndex: -1,
		style: {
			height: "100%",
			width: "100%"
		},
		children: x
	});
}
var cv = "winamp-active";
function Uk({ requireClicksOriginateLocally: m = !0, onPointerDown: _, className: x, ...S }) {
	let [C, D] = $.useState(!1), O = $.useCallback((x) => {
		_?.(x), m || x.target.releasePointerCapture(x.pointerId), x.nativeEvent.button !== -1 && x.nativeEvent.button !== 0 || (D(!0), document.addEventListener("pointerup", function A(m) {
			D(!1), document.removeEventListener("pointerup", A);
		}));
	}, [_, m]);
	return Q.jsx("div", {
		...S,
		className: ov(x, { [cv]: C }),
		onPointerDown: O,
		onPointerEnter: m ? void 0 : (m) => {
			m.buttons === 1 && (document.dispatchEvent(new CustomEvent("pointerup", { detail: -42 })), O(m));
		}
	});
}
var Ck = ({ children: m }) => {
	let _ = m.split("");
	return Q.jsx($.Fragment, { children: _.map((m, _) => Q.jsx("div", { className: `draggable gen-text-letter gen-text-${m === " " ? "space" : m.toLowerCase()}` }, _)) });
}, vk = ({ children: m, title: _, windowId: x, onKeyDown: S }) => {
	let C = fk(XE), D = fk(WE), O = mk(A_), F = mk(Ff), I = mk(d_)(x), L = F === x, { width: H, height: U } = O(x);
	return Q.jsx(Sk, {
		windowId: x,
		onKeyDown: S,
		children: Q.jsxs("div", {
			className: ov("gen-window", "window", { selected: L }),
			style: {
				width: H,
				height: U
			},
			children: [
				Q.jsxs("div", {
					className: "gen-top draggable",
					children: [
						Q.jsx("div", { className: "gen-top-left draggable" }),
						Q.jsx("div", { className: "gen-top-left-fill draggable" }),
						Q.jsx("div", { className: "gen-top-left-end draggable" }),
						Q.jsx("div", {
							className: "gen-top-title draggable",
							children: Q.jsx(Ck, { children: _ })
						}),
						Q.jsx("div", { className: "gen-top-right-end draggable" }),
						Q.jsx("div", { className: "gen-top-right-fill draggable" }),
						Q.jsx("div", {
							className: "gen-top-right draggable",
							children: Q.jsx(Uk, {
								className: "gen-close selected",
								onClick: () => D(x)
							})
						})
					]
				}),
				Q.jsxs("div", {
					className: "gen-middle",
					children: [
						Q.jsx("div", {
							className: "gen-middle-left draggable",
							children: Q.jsx("div", { className: "gen-middle-left-bottom draggable" })
						}),
						Q.jsx("div", {
							className: "gen-middle-center",
							children: m({
								width: H - 19,
								height: U - 34
							})
						}),
						Q.jsx("div", {
							className: "gen-middle-right draggable",
							children: Q.jsx("div", { className: "gen-middle-right-bottom draggable" })
						})
					]
				}),
				Q.jsxs("div", {
					className: "gen-bottom draggable",
					children: [Q.jsx("div", { className: "gen-bottom-left draggable" }), Q.jsx("div", {
						className: "gen-bottom-right draggable",
						children: Q.jsx(sv, {
							currentSize: I,
							setWindowSize: (m) => C(x, m),
							id: "gen-resize-target"
						})
					})]
				})
			]
		})
	});
}, lv = {
	[Kg.DEFAULT]: 2.7,
	[Kg.IMMEDIATE]: 0,
	[Kg.USER_PRESET]: 5.7
};
function xk({ analyser: m, width: _, height: x }) {
	let S = mk(Zf), C = mk(xf), D = mk(fE), O = mk(b_), F = mk(bE), I = mk(EE), L = mk(gE), H = S === Qh, U = $.useRef(null), [W, q] = $.useState(null);
	$.useEffect(() => {
		if (U.current == null || D == null || W != null) return;
		let S = D.createVisualizer(m.context, U.current, {
			width: _,
			height: x,
			meshWidth: 32,
			meshHeight: 24,
			pixelRatio: window.devicePixelRatio || 1,
			onlyUseWASM: !0
		});
		S.connectAudio(m), q(S);
	}, [
		D,
		m,
		x,
		_,
		W
	]), $.useEffect(() => {
		W?.setRendererSize(_, x);
	}, [
		W,
		_,
		x
	]);
	let ee = $.useRef(!1);
	$.useEffect(() => {
		W != null && F != null && (ee.current ? W.loadPreset(F, lv[I]) : (W.loadPreset(F, lv[Kg.IMMEDIATE]), ee.current = !0));
	}, [W, F]), $.useEffect(() => {
		W != null && O && W.launchSongTitleAnim(O);
	}, [W, O]);
	let te = $.useRef(null);
	$.useEffect(() => {
		W != null && L != null && (te.current == null || L.time > te.current) && (te.current = Date.now(), W.launchSongTitleAnim(L.text));
	}, [W, L]);
	let J = C && H;
	return $.useEffect(() => {
		if (!J || W == null) return;
		let m = null, e = () => {
			W.render(), m = window.requestAnimationFrame(e);
		};
		return e(), () => {
			m != null && window.cancelAnimationFrame(m);
		};
	}, [W, J]), Q.jsx("canvas", {
		height: x,
		width: _,
		style: {
			height: "100%",
			width: "100%",
			display: H ? "block" : "none"
		},
		ref: U
	});
}
var Mk = (m) => {
	let { innerRef: _ } = m;
	return Q.jsx("div", {
		ref: _,
		className: "draggable",
		style: {
			backgroundColor: "#000",
			position: "absolute",
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			height: "100%",
			width: "100%"
		},
		tabIndex: 0,
		children: m.children
	});
}, uv = {
	position: "absolute",
	top: 0,
	left: 0,
	color: "white",
	background: "rgba(0.33, 0.33, 0.33, 0.33)"
}, dv = {
	position: "absolute",
	top: 0,
	left: 0,
	padding: "15px 10px 0 10px"
}, fv = {
	display: "inline-block",
	whiteSpace: "nowrap",
	overflow: "hidden",
	background: "rgba(0, 0, 0, 0.815)",
	fontSize: "12px"
};
function Lk(m) {
	return m - 1;
}
function Dk({ height: m, width: _ }) {
	let x = mk(kE), S = mk(wE), C = fk(Hb), D = fk(rk), O = fk(zb), F = function() {
		let m = $.useRef(!1);
		return $.useEffect(() => () => {
			m.current = !0;
		}, []), m;
	}(), [I, L] = $.useState(() => S == null ? 0 : S + 1), H = x.length, U = $.useCallback(() => {
		let _ = Math.floor((m - 15) / 14), C = Math.floor(.75 * _), [D, O] = function(m, _, x) {
			let S = Math.min(m, _), C = Hh(x - Math.floor(S / 2), 0, m - S);
			return [C, C + S - 1];
		}(H + 1, C, I), F = [];
		for (let m = D; m <= O; m++) {
			let _ = Lk(m), C = _ === S, D;
			D = m === I ? C ? "#FFCC22" : "#FF5050" : C ? "#CCFF03" : "#CCCCCC", F.push(Q.jsx("li", {
				style: {
					color: D,
					lineHeight: "14px"
				},
				children: m === 0 ? "Load Local Directory" : x[_]
			}, m));
		}
		return F;
	}, [
		S,
		m,
		H,
		x,
		I
	]), W = $.useCallback(async () => {
		let m = await Bm({ directory: !0 });
		F.current || O(m);
	}, [O, F]), q = $.useCallback((m) => {
		switch (m.keyCode) {
			case 38:
				L((m) => Math.max(m - 1, 0)), m.stopPropagation();
				break;
			case 40:
				L((m) => Math.min(m + 1, H)), m.stopPropagation();
				break;
			case 13:
				I === 0 ? W() : C(Lk(I), Kg.DEFAULT, !0), m.stopPropagation();
				break;
			case 27: D(), m.stopPropagation();
		}
	}, [
		W,
		H,
		C,
		I,
		D
	]), ee = $.useCallback((m) => {
		m != null && document.activeElement !== m && m.focus();
	}, []);
	return x == null ? Q.jsx("div", {
		style: uv,
		children: Q.jsx("span", { children: "Loading presets" })
	}) : Q.jsx("div", {
		ref: ee,
		tabIndex: -1,
		style: dv,
		onKeyDown: q,
		children: Q.jsx("div", {
			style: {
				...fv,
				width: _ - 20 - 20,
				maxHeight: m - 15
			},
			children: Q.jsx("ul", {
				style: {
					listStyleType: "none",
					padding: 0,
					margin: 0
				},
				children: U()
			})
		})
	});
}
function Ok(m) {
	m.stopPropagation(), m.preventDefault(), m.dataTransfer.dropEffect = "link", m.dataTransfer.effectAllowed = "link";
}
function Vk(m) {
	let { handleDrop: _, windowId: x, onWheelActive: S, ...C } = m, D = $.useRef(null), O = fk(bb);
	$.useEffect(() => {
		let m = D.current;
		if (!m || !S) return;
		let e = (m) => {
			S(m);
		};
		return m.addEventListener("wheel", e, { passive: !1 }), () => {
			m.removeEventListener("wheel", e);
		};
	}, [S]);
	let F = $.useCallback((m) => {
		Ok(m), O(m, x);
		let { currentTarget: S } = m;
		if (!(S instanceof Element)) return;
		let { left: C, top: D } = S.getBoundingClientRect();
		_(m, {
			x: C,
			y: D
		});
	}, [
		_,
		O,
		x
	]);
	return Q.jsx("div", {
		ref: D,
		...C,
		onDragStart: Ok,
		onDragEnter: Ok,
		onDragOver: Ok,
		onDrop: F
	});
}
var Rk = (m) => {
	let _ = $.useMemo(() => {
		let _ = document.createElement("div");
		return _.id = "webamp-context-menu", _.style.position = "absolute", _.style.top = "0", _.style.left = "0", _.style.zIndex = String(m.zIndex + 1), _;
	}, [m.zIndex]);
	$.useEffect(() => (document.body.appendChild(_), () => {
		document.body.removeChild(_);
	}), [_]);
	let x = {
		top: m.top,
		left: m.left,
		position: "absolute"
	};
	return Dt.createPortal(Q.jsx("div", {
		style: x,
		children: m.children
	}), _);
}, Fk = () => Q.jsx("li", {
	className: "hr",
	children: Q.jsx("hr", {})
}), Gk = ({ children: m, label: _ }) => Q.jsxs("li", {
	className: "parent",
	children: [Q.jsx("ul", { children: m }), _]
}), zk = (m) => Q.jsx("li", { children: Q.jsx("a", {
	...m,
	children: m.label
}) }), Kk = (m) => {
	let { label: _, checked: x, className: S = "", ...C } = m;
	return Q.jsx("li", {
		className: ov(S, { checked: x }),
		...C,
		children: _
	});
};
function Pk({ children: m, offsetTop: _, offsetLeft: x, top: S, bottom: C, selected: D }) {
	let O = mk(Kf);
	return D ? Q.jsx(Rk, {
		top: _,
		left: x,
		zIndex: O,
		children: Q.jsx("ul", {
			className: ov("context-menu", {
				top: S,
				bottom: C
			}),
			children: m
		})
	}) : null;
}
function Yk({ children: m, renderContents: _, ...x }) {
	let [S, C] = $.useState(null), D = $.useCallback(() => {
		C(null);
	}, []), O = $.useCallback((m) => {
		m.button !== 2 && D();
	}, [D]), F = $.useCallback((m) => {
		let { pageX: _, pageY: x } = m;
		C({
			x: _,
			y: x
		}), m.preventDefault(), m.stopPropagation();
	}, []);
	return $.useEffect(() => {
		if (S != null) return document.addEventListener("click", O), document.body.addEventListener("contextmenu", D), () => {
			document.removeEventListener("click", O), document.body.removeEventListener("contextmenu", D);
		};
	}, [
		S,
		D,
		O
	]), Q.jsxs("div", {
		onContextMenu: F,
		style: {
			width: "100%",
			height: "100%"
		},
		...x,
		children: [Q.jsx(Pk, {
			selected: S != null,
			offsetTop: S?.y ?? 0,
			offsetLeft: S?.x ?? 0,
			children: _()
		}), m]
	});
}
var Hk = (m) => {
	let _ = mk(hE), x = fk(WE), S = fk(nk), C = fk(ik);
	return Q.jsx(Yk, {
		renderContents: () => Q.jsxs(Q.Fragment, { children: [
			document.fullscreenEnabled && Q.jsx(Kk, {
				onClick: C,
				label: "Fullscreen",
				hotkey: "Alt+Enter"
			}),
			Q.jsx(Kk, {
				onClick: S,
				checked: _,
				label: "Desktop Mode",
				hotkey: "Alt+D"
			}),
			Q.jsx(Fk, {}),
			Q.jsx(Kk, {
				onClick: () => x(Nh),
				label: "Quit"
			})
		] }),
		children: m.children
	});
}, pv = $.memo(({ children: m }) => {
	let [_] = $.useState(() => document.createElement("div"));
	return $.useEffect(() => (_.classList.add("webamp-desktop"), document.body.appendChild(_), () => {
		document.body.removeChild(_);
	}), [_]), At.createPortal(m, _);
});
function _k({ analyser: m }) {
	let _ = mk(hE), x = mk(mE), S = mk(yE), C = mk(SE), D = mk(wE), O = mk(xf), F = fk(ik), I = fk(Kb), L = fk(jb), H = fk(ak), U = function() {
		let m = mk(b_), _ = fk(Kb), x = fk(Pb), S = fk(_b), C = fk(rk), D = fk(qb), O = fk(Jb);
		return $.useCallback((F) => {
			switch (F.keyCode) {
				case 32:
					_();
					break;
				case 8:
					x(Kg.IMMEDIATE);
					break;
				case 72:
					_(Kg.IMMEDIATE);
					break;
				case 82:
					S();
					break;
				case 76:
					C(), F.stopPropagation();
					break;
				case 84:
					m != null && D(m), F.stopPropagation();
					break;
				case 145:
				case 125: O();
			}
		}, [
			D,
			_,
			x,
			O,
			C,
			S,
			m
		]);
	}();
	$.useEffect(() => {
		if (!C || !O) return;
		let m = setInterval(I, 15e3);
		return () => clearInterval(m);
	}, [
		C,
		D,
		O,
		I
	]);
	let W = function() {
		let [m] = $.useState({
			width: window.screen.width,
			height: window.screen.height
		});
		return m;
	}(), q = function() {
		let [m, _] = $.useState(sm()), x = $.useCallback(() => {}, []);
		return $.useEffect(() => (window.addEventListener("resize", x), () => {
			window.removeEventListener("resize", x);
		}), [x]), m;
	}(), ee = $.useCallback(() => {
		document.fullscreenEnabled && F();
	}, [F]);
	return _ ? Q.jsx(pv, { children: Q.jsx(Hk, { children: Q.jsx(xk, {
		...q,
		analyser: m
	}) }) }) : Q.jsx(vk, {
		title: "Milkdrop",
		windowId: Nh,
		onKeyDown: U,
		children: (_) => {
			let C = x ? W : _;
			return Q.jsx(Hk, { children: Q.jsx(Mk, { children: Q.jsxs(Vk, {
				windowId: Nh,
				handleDrop: L,
				children: [S && Q.jsx(Dk, { ...C }), Q.jsx(ck, {
					enabled: x,
					onChange: H,
					children: Q.jsx("div", {
						onDoubleClick: ee,
						children: Q.jsx(xk, {
							...C,
							analyser: m
						})
					})
				})]
			}) }) });
		}
	});
}
var Jk = () => {
	let m = fk(Bb), _ = fk(Sb), x = fk(Ib), S = fk(Ub), C = fk(vb), D = fk(Mb), O = fk(Nb), F = fk(Cb);
	return Q.jsxs($.Fragment, { children: [
		Q.jsx(Kk, {
			label: "Previous",
			hotkey: "Z",
			onClick: m
		}),
		Q.jsx(Kk, {
			label: "Play",
			hotkey: "X",
			onClick: _
		}),
		Q.jsx(Kk, {
			label: "Pause",
			hotkey: "C",
			onClick: x
		}),
		Q.jsx(Kk, {
			label: "Stop",
			hotkey: "V",
			onClick: S
		}),
		Q.jsx(Kk, {
			label: "Next",
			hotkey: "B",
			onClick: C
		}),
		Q.jsx(Fk, {}),
		Q.jsx(Kk, {
			label: "Back 5 seconds",
			hotkey: "Left",
			onClick: () => O(5)
		}),
		Q.jsx(Kk, {
			label: "Fwd 5 seconds",
			hotkey: "Right",
			onClick: () => D(5)
		}),
		Q.jsx(Kk, {
			label: "10 tracks back",
			hotkey: "Num. 1",
			onClick: () => F(-10)
		}),
		Q.jsx(Kk, {
			label: "10 tracks fwd",
			hotkey: "Num. 3",
			onClick: () => F(10)
		})
	] });
}, qk = () => {
	let m = fk(tk), _ = fk(rb), x = fk(tb), S = mk(LE);
	return Q.jsxs(Gk, {
		label: "Skins",
		children: [
			Q.jsx(Kk, {
				onClick: _,
				label: "Load Skin..."
			}),
			Q.jsx(Fk, {}),
			Q.jsx(Kk, {
				onClick: m,
				label: "<Base Skin>"
			}),
			S.map((m) => Q.jsx(Kk, {
				onClick: () => x(m.url),
				label: m.name
			}, m.url))
		]
	});
}, Wk = () => {
	let m = fk(Rb), _ = fk(jE), x = fk(Ob), S = fk(Vb), C = mk(Gf), D = mk(NE), O = mk(eE), F = mk(AE);
	return Q.jsxs(Q.Fragment, { children: [
		Q.jsx(qk, {}),
		Q.jsx(Fk, {}),
		Q.jsx(Kk, {
			label: "Time elapsed",
			hotkey: "(Ctrl+T toggles)",
			onClick: m,
			checked: D === ag
		}),
		Q.jsx(Kk, {
			label: "Time remaining",
			hotkey: "(Ctrl+T toggles)",
			onClick: m,
			checked: D === sg
		}),
		Q.jsx(Kk, {
			label: "Double Size",
			hotkey: "Ctrl+D",
			onClick: _,
			checked: C
		}),
		Q.jsx(Fk, {}),
		Q.jsx(Kk, {
			label: "Repeat",
			hotkey: "R",
			onClick: x,
			checked: O
		}),
		Q.jsx(Kk, {
			label: "Shuffle",
			hotkey: "S",
			onClick: S,
			checked: F
		})
	] });
}, mv = $.memo(({ filePickers: m }) => {
	let _ = mk(ME), x = mk(uf), S = fk(Wb), C = fk(ib), D = fk(ob), O = fk($E), F = fk(() => ({ type: "MAIN_CONTEXT_MENU_OPENED" })), I = mk(pE);
	return $.useEffect(() => {
		F();
	}, [F]), Q.jsxs($.Fragment, { children: [
		Q.jsx(zk, {
			href: "https://webamp.org/about",
			target: "_blank",
			label: "Webamp..."
		}),
		Q.jsx(Fk, {}),
		Q.jsxs(Gk, {
			label: "Play",
			children: [Q.jsx(Kk, {
				onClick: C,
				label: "File...",
				hotkey: "L"
			}), m != null && m.map((m, x) => (_ || !m.requiresNetwork) && Q.jsx(Kk, {
				onClick: async () => {
					let _;
					try {
						_ = await m.filePicker();
					} catch {}
					D(_ || [], Ih);
				},
				label: m.contextMenuName
			}, x))]
		}),
		Q.jsx(Fk, {}),
		Object.keys(x).map((m) => m !== Nh || I ? Q.jsx(Kk, {
			label: x[m].title,
			checked: x[m].open,
			onClick: () => O(m),
			hotkey: x[m].hotkey
		}, m) : null),
		Q.jsx(Fk, {}),
		Q.jsx(qk, {}),
		Q.jsx(Fk, {}),
		Q.jsx(Gk, {
			label: "Options",
			children: Q.jsx(Wk, {})
		}),
		Q.jsx(Gk, {
			label: "Playback",
			children: Q.jsx(Jk, {})
		}),
		Q.jsx(Fk, {}),
		Q.jsx(Kk, {
			onClick: S,
			label: "Exit"
		})
	] });
}), Xk = (m, _) => {
	let x = zE(m, _);
	return x.x !== void 0 || x.y !== void 0;
};
function $k(m, _) {
	let x = mk(M_), S = mk(l_), C = mk(iE), D = fk(Aw), [O, F] = $.useState(null);
	return $.useEffect(() => {
		if (O == null) return;
		let { boundingBox: m, moving: x, stationary: S, mouseStart: I } = O, s = (O) => {
			let F = {
				x: cm(O) - I.x,
				y: dm(O) - I.y
			}, L = x.map((m) => ({
				...m,
				...YE(m, F)
			})), H = {
				...m,
				...YE(m, F)
			}, U = ((m, ..._) => YE(m, _.reduce((m, _) => ({
				x: m.x === 0 || _.x === 0 ? m.x + _.x : Math.min(m.x, _.x),
				y: m.y === 0 || _.y === 0 ? m.y + _.y : Math.min(m.y, _.y)
			}))))(F, PE(L, S), ((m, _) => {
				let x = ((m, _) => {
					let x, S;
					return m.x - H_ < 0 ? x = 0 : m.x + m.width + H_ > _.width && (x = _.width - m.width), m.y - H_ < 0 ? S = 0 : m.y + m.height + H_ > _.height && (S = _.height - m.height), {
						x,
						y: S
					};
				})(m, _);
				return {
					x: x.x === void 0 ? 0 : x.x - m.x,
					y: x.y === void 0 ? 0 : x.y - m.y
				};
			})(H, _ !== document.body && _ ? om(_) : C)), W = {};
			x.forEach((m) => {
				W[m.key] = YE(m, U);
			}), D(W, !1);
		};
		function u() {
			F(null);
		}
		return window.addEventListener("mouseup", u), window.addEventListener("touchend", u), window.addEventListener("mousemove", s, { passive: !1 }), window.addEventListener("touchmove", s, { passive: !1 }), () => {
			window.removeEventListener("mousemove", s), window.removeEventListener("touchmove", s), window.removeEventListener("mouseup", u), window.removeEventListener("touchend", u);
		};
	}, [
		_,
		C,
		O,
		D
	]), $.useCallback((_, C) => {
		if (!C.target.classList.contains("draggable")) return;
		let D = cm(C), O = dm(C);
		if (S(_)) return;
		let I = x.filter((_) => m[_.key] != null && !S(_.key)), L = I.find((m) => m.key === _);
		if (L == null) throw Error(`Tried to move a node that does not exist: ${_}`);
		let H = /* @__PURE__ */ new Set([L]);
		_ === "main" && (H = (U = Xk, (m, _) => {
			let x = /* @__PURE__ */ new Set(), n = (_) => {
				for (let S of m) !x.has(S) && U(S, _) && (x.add(S), n(S));
			};
			return n(_), x;
		})(I, L));
		var U;
		let W = I.filter((m) => !H.has(m)), q = Array.from(H), ee = {
			x: D,
			y: O
		}, te = ((m) => {
			let _ = m.slice(), x = _.pop();
			if (x == null) throw Error("boundingBox must be called with at least one node");
			let S = {
				top: OE(x),
				right: FE(x),
				bottom: VE(x),
				left: RE(x)
			};
			return _.forEach((m) => {
				S.top = Math.min(S.top, OE(m)), S.right = Math.max(S.right, FE(m)), S.bottom = Math.max(S.bottom, VE(m)), S.left = Math.min(S.left, RE(m));
			}), {
				x: S.left,
				y: S.top,
				width: S.right - S.left,
				height: S.bottom - S.top
			};
		})(q);
		F({
			boundingBox: te,
			moving: q,
			stationary: W,
			mouseStart: ee
		});
	}, [
		S,
		m,
		x
	]);
}
function Ay({ windows: m, parentDomNode: _ }) {
	let x = mk(M_), S = fk(ZE), C = $k(m, _), D = x.filter((_) => m[_.key]), O = $.useCallback((m) => {
		let { currentTarget: _, relatedTarget: x } = m;
		_ === x || _.contains(x) || S(null);
	}, [S]);
	return Q.jsx(Q.Fragment, { children: D.map((_) => Q.jsx("div", {
		onBlur: O,
		onMouseDown: (m) => {
			C(_.key, m);
		},
		onTouchStart: (m) => {
			C(_.key, m);
		},
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			transform: `translate(${_.x}px, ${_.y}px)`,
			touchAction: "none"
		},
		children: m[_.key]
	}, _.key)) });
}
var hv = {
	À: "A",
	Á: "A",
	Â: "A",
	Ã: "A",
	Ä: "A",
	Å: "A",
	à: "a",
	á: "a",
	â: "a",
	ã: "a",
	ä: "a",
	å: "a",
	Ç: "C",
	ç: "c",
	Ð: "D",
	ð: "d",
	È: "E",
	É: "E",
	Ê: "E",
	Ë: "E",
	è: "e",
	é: "e",
	ê: "e",
	ë: "e",
	Ì: "I",
	Í: "I",
	Î: "I",
	Ï: "I",
	ì: "i",
	í: "i",
	î: "i",
	ï: "i",
	Ñ: "N",
	ñ: "n",
	Ò: "O",
	Ó: "O",
	Ô: "O",
	Õ: "O",
	Ö: "O",
	Ø: "O",
	ò: "o",
	ó: "o",
	ô: "o",
	õ: "o",
	ö: "o",
	ø: "o",
	Ù: "U",
	Ú: "U",
	Û: "U",
	Ü: "U",
	ù: "u",
	ú: "u",
	û: "u",
	ü: "u",
	Ý: "Y",
	ý: "y",
	ÿ: "y",
	Æ: "Ae",
	æ: "ae",
	Þ: "Th",
	þ: "th",
	ß: "ss",
	Ā: "A",
	Ă: "A",
	Ą: "A",
	ā: "a",
	ă: "a",
	ą: "a",
	Ć: "C",
	Ĉ: "C",
	Ċ: "C",
	Č: "C",
	ć: "c",
	ĉ: "c",
	ċ: "c",
	č: "c",
	Ď: "D",
	Đ: "D",
	ď: "d",
	đ: "d",
	Ē: "E",
	Ĕ: "E",
	Ė: "E",
	Ę: "E",
	Ě: "E",
	ē: "e",
	ĕ: "e",
	ė: "e",
	ę: "e",
	ě: "e",
	Ĝ: "G",
	Ğ: "G",
	Ġ: "G",
	Ģ: "G",
	ĝ: "g",
	ğ: "g",
	ġ: "g",
	ģ: "g",
	Ĥ: "H",
	Ħ: "H",
	ĥ: "h",
	ħ: "h",
	Ĩ: "I",
	Ī: "I",
	Ĭ: "I",
	Į: "I",
	İ: "I",
	ĩ: "i",
	ī: "i",
	ĭ: "i",
	į: "i",
	ı: "i",
	Ĵ: "J",
	ĵ: "j",
	Ķ: "K",
	ķ: "k",
	ĸ: "k",
	Ĺ: "L",
	Ļ: "L",
	Ľ: "L",
	Ŀ: "L",
	Ł: "L",
	ĺ: "l",
	ļ: "l",
	ľ: "l",
	ŀ: "l",
	ł: "l",
	Ń: "N",
	Ņ: "N",
	Ň: "N",
	Ŋ: "N",
	ń: "n",
	ņ: "n",
	ň: "n",
	ŋ: "n",
	Ō: "O",
	Ŏ: "O",
	Ő: "O",
	ō: "o",
	ŏ: "o",
	ő: "o",
	Ŕ: "R",
	Ŗ: "R",
	Ř: "R",
	ŕ: "r",
	ŗ: "r",
	ř: "r",
	Ś: "S",
	Ŝ: "S",
	Ş: "S",
	Š: "S",
	ś: "s",
	ŝ: "s",
	ş: "s",
	š: "s",
	Ţ: "T",
	Ť: "T",
	Ŧ: "T",
	ţ: "t",
	ť: "t",
	ŧ: "t",
	Ũ: "U",
	Ū: "U",
	Ŭ: "U",
	Ů: "U",
	Ű: "U",
	Ų: "U",
	ũ: "u",
	ū: "u",
	ŭ: "u",
	ů: "u",
	ű: "u",
	ų: "u",
	Ŵ: "W",
	ŵ: "w",
	Ŷ: "Y",
	ŷ: "y",
	Ÿ: "Y",
	Ź: "Z",
	Ż: "Z",
	Ž: "Z",
	ź: "z",
	ż: "z",
	ž: "z",
	Ĳ: "IJ",
	ĳ: "ij",
	Œ: "Oe",
	œ: "oe",
	ŉ: "'n",
	ſ: "s"
}, ty = function(m) {
	return hv?.[m];
}, gv = typeof ee == "object" && ee && ee.Object === Object && ee, _v = typeof self == "object" && self && self.Object === Object && self, vv = (gv || _v || Function("return this")()).Symbol, yv = Array.isArray, bv = vv, xv = Object.prototype, Sv = xv.hasOwnProperty, Cv = xv.toString, wv = bv ? bv.toStringTag : void 0, Tv = Object.prototype.toString, gy = function(m) {
	var _ = Sv.call(m, wv), x = m[wv];
	try {
		m[wv] = void 0;
		var S = !0;
	} catch {}
	var C = Cv.call(m);
	return S && (_ ? m[wv] = x : delete m[wv]), C;
}, Ev = vv ? vv.toStringTag : void 0, hy = function(m) {
	return m == null ? m === void 0 ? "[object Undefined]" : "[object Null]" : Ev && Ev in Object(m) ? gy(m) : function(m) {
		return Tv.call(m);
	}(m);
}, my = function(m, _) {
	for (var x = -1, S = m == null ? 0 : m.length, C = Array(S); ++x < S;) C[x] = _(m[x], x, m);
	return C;
}, Dv = yv, Ov = vv ? vv.prototype : void 0, kv = Ov ? Ov.toString : void 0, Av = function A(m) {
	if (typeof m == "string") return m;
	if (Dv(m)) return my(m, A) + "";
	if (function(m) {
		return typeof m == "symbol" || function(m) {
			return typeof m == "object" && !!m;
		}(m) && hy(m) == "[object Symbol]";
	}(m)) return kv ? kv.call(m) : "";
	var _ = m + "";
	return _ == "0" && 1 / m == -1 / 0 ? "-0" : _;
}, jv = ty, Mv = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Nv = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]", "g"), Pv = e(function(m) {
	return (m = (_ = m) == null ? "" : Av(_)) && m.replace(Mv, jv).replace(Nv, "");
	var _;
}), Uy = (m) => `character-${Pv(m.toString()).toLowerCase().charCodeAt(0)}`, Fv = $.memo(({ children: m, className: _, ...x }) => Q.jsx("span", {
	...x,
	className: `${_ || ""} character ${Uy(m)}`,
	children: m
})), vy = () => Q.jsx($.Fragment, { children: [
	1,
	7,
	12,
	20,
	25
].map((m, _) => Q.jsx(Fv, {
	style: { left: m },
	className: "background-character",
	children: " "
}, _)) }), By = () => {
	let m = mk(x_), _ = mk(If), x = mk(nE), S = mk(NE), C = fk(Rb), D = null;
	m !== fg && _ != null && (D = S === ag ? x : _ - x);
	let O = Gh(D), F = S === sg && m !== fg;
	return Q.jsxs("div", {
		onClick: C,
		className: ov("mini-time", "countdown", { blinking: m === pg }),
		children: [
			Q.jsx(vy, {}),
			Q.jsx(Fv, {
				style: { left: 1 },
				children: F ? "-" : " "
			}),
			Q.jsx(Fv, {
				style: { left: 7 },
				children: O.minutesFirstDigit
			}),
			Q.jsx(Fv, {
				style: { left: 12 },
				children: O.minutesSecondDigit
			}),
			Q.jsx(Fv, {
				style: { left: 20 },
				children: O.secondsFirstDigit
			}),
			Q.jsx(Fv, {
				style: { left: 25 },
				children: O.secondsSecondDigit
			})
		]
	});
};
function xy(m) {
	let [_, x] = $.useState(!1);
	return Q.jsx(Uk, {
		...m,
		className: ov(m.className, { clicked: _ }),
		onPointerDown: function(_) {
			x(!0), m.onPointerDown && m.onPointerDown(_);
		}
	});
}
function My(m) {
	let _ = $.useRef(null), [x, S] = $.useState(!1);
	$.useEffect(() => {
		if (x) return document.addEventListener("click", A), () => {
			document.removeEventListener("click", A);
		};
		function A(m) {
			x && m.target instanceof Element && x && _.current && !_.current.contains(m.target) && S(!1);
		}
	}, [x]);
	let C = $.useMemo(() => x ? function(m) {
		if (m == null) return {
			top: 0,
			left: 0
		};
		let _ = m.getBoundingClientRect(), x = window.pageXOffset || document.documentElement.scrollLeft, S = window.pageYOffset || document.documentElement.scrollTop;
		return {
			top: _.top + S,
			left: _.left + x
		};
	}(_.current) : {
		top: 0,
		left: 0
	}, [x]), { renderMenu: D, children: O, top: F, bottom: I, ...L } = m;
	return Q.jsxs("div", {
		...L,
		children: [Q.jsx("div", {
			className: "handle",
			style: {
				width: "100%",
				height: "100%"
			},
			ref: _,
			onClick: () => S(!x),
			children: O
		}), Q.jsx(Pk, {
			selected: x,
			offsetTop: C.top,
			offsetLeft: C.left,
			top: F,
			bottom: I,
			children: D()
		})]
	});
}
var Iv = class Ny {
	bitrevtable;
	envelope;
	equalize;
	temp1;
	temp2;
	cossintable;
	static TWO_PI = 6.2831853;
	static HALF_PI = 1.5707963268;
	constructor() {
		let m = 1024;
		this.bitrevtable = this.initBitRevTable(m), this.cossintable = this.initCosSinTable(m), this.envelope = this.initEnvelopeTable(1024, 1), this.equalize = this.initEqualizeTable(m, !1), this.temp1 = new Float32Array(m), this.temp2 = new Float32Array(m);
	}
	initEqualizeTable(m, _) {
		let x = new Float32Array(m / 2), S = .04;
		for (let _ = 0; _ < m / 2; _++) {
			let C = (9 - S) / (m / 2);
			x[_] = Math.log10(1 + S + (_ + 1) * C), S /= 1.0025;
		}
		return x;
	}
	initEnvelopeTable(m, _) {
		let x = 1 / m * Ny.TWO_PI, S = new Float32Array(m);
		for (let C = 0; C < m; C++) S[C] = (.5 + .5 * Math.sin(C * x - Ny.HALF_PI)) ** _;
		return S;
	}
	initBitRevTable(m) {
		let _ = Array(m);
		for (let x = 0; x < m; x++) _[x] = x;
		for (let x = 0, S = 0; x < m; x++) {
			if (S > x) {
				let m = _[x];
				_[x] = _[S], _[S] = m;
			}
			let C = m >> 1;
			for (; C >= 1 && S >= C;) S -= C, C >>= 1;
			S += C;
		}
		return _;
	}
	initCosSinTable(m) {
		let _ = [], x = 2;
		for (; x <= m;) {
			let m = -2 * Math.PI / x;
			_.push(new Float32Array([Math.cos(m), Math.sin(m)])), x <<= 1;
		}
		return _;
	}
	timeToFrequencyDomain(m, _) {
		if (!this.temp1 || !this.temp2 || !this.cossintable) return;
		for (let _ = 0; _ < this.temp1.length; _++) {
			let x = this.bitrevtable[_];
			x < m.length ? this.temp1[_] = m[x] * (this.envelope ? this.envelope[x] : 1) : this.temp1[_] = 0;
		}
		this.temp2.fill(0);
		let x = this.temp1, S = this.temp2, C = 2, D = 0;
		for (; C <= this.temp1.length;) {
			let m = this.cossintable[D][0], _ = this.cossintable[D][1], O = 1, F = 0, I = C >> 1;
			for (let D = 0; D < I; D += 1) {
				for (let m = D; m < this.temp1.length; m += C) {
					let _ = m + I, C = O * x[_] - F * S[_], D = O * S[_] + F * x[_];
					x[_] = x[m] - C, S[_] = S[m] - D, x[m] += C, S[m] += D;
				}
				let L = O;
				O = O * m - F * _, F = F * m + L * _;
			}
			C <<= 1, ++D;
		}
		for (let m = 0; m < _.length; m++) _[m] = Math.sqrt(x[m] * x[m] + S[m] * S[m]) * (this.equalize ? this.equalize[m] : 1);
	}
}, Ty = class {
	_vis;
	_ctx;
	constructor(m) {
		this._vis = m, this._ctx = m.canvas.getContext("2d");
	}
	prepare() {}
	paintFrame() {}
	dispose() {}
}, Qy = class extends Ty {
	saPeaks;
	saData2;
	saData;
	saFalloff;
	sample;
	barPeak;
	chunk;
	uVar12;
	falloff;
	peakFalloff;
	pushDown;
	inWaveData = /* @__PURE__ */ new Float32Array(1024);
	outSpectralData = /* @__PURE__ */ new Float32Array(512);
	_analyser;
	_fft;
	_color = "rgb(255,255,255)";
	_colorPeak = "rgb(255,255,255)";
	_bar = document.createElement("canvas");
	_peak = document.createElement("canvas");
	_16h = document.createElement("canvas");
	_bufferLength;
	_dataArray;
	colorssmall;
	colorssmall2;
	_renderHeight;
	_smallVis;
	_pixelDensity;
	_doubled;
	_isMWOpen;
	paintBar;
	paintFrame;
	constructor(m) {
		switch (super(m), this._analyser = this._vis.analyser, this._fft = new Iv(), this._bufferLength = this._analyser.frequencyBinCount, this._dataArray = new Uint8Array(this._bufferLength), this._renderHeight = m.renderHeight, this._smallVis = m.smallVis, this._pixelDensity = m.pixelDensity, this._doubled = m.doubled, this._isMWOpen = m.isMWOpen, this.colorssmall = [
			m.colors[17],
			m.colors[14],
			m.colors[11],
			m.colors[8],
			m.colors[4]
		], this.colorssmall2 = [
			m.colors[17],
			m.colors[16],
			m.colors[14],
			m.colors[13],
			m.colors[11],
			m.colors[10],
			m.colors[8],
			m.colors[7],
			m.colors[5],
			m.colors[4]
		], this._16h.width = 1, this._16h.height = 16, this._16h.setAttribute("width", "75"), this._16h.setAttribute("height", "16"), this.paintFrame = this.paintAnalyzer.bind(this), this.saPeaks = (/* @__PURE__ */ new Int16Array(76)).fill(0), this.saData2 = (/* @__PURE__ */ new Float32Array(76)).fill(0), this.saData = (/* @__PURE__ */ new Int16Array(76)).fill(0), this.saFalloff = (/* @__PURE__ */ new Float32Array(76)).fill(0), this.sample = (/* @__PURE__ */ new Float32Array(76)).fill(0), this.barPeak = (/* @__PURE__ */ new Int16Array(76)).fill(0), this.chunk = 0, this.uVar12 = 0, this.pushDown = 0, this._vis.coloring) {
			case "fire":
				this.paintBar = this.paintBarFire.bind(this);
				break;
			case "line":
				this.paintBar = this.paintBarLine.bind(this);
				break;
			default: this.paintBar = this.paintBarNormal.bind(this);
		}
		switch (this._vis.saFalloff) {
			case "slower":
				this.falloff = 3;
				break;
			case "slow":
				this.falloff = 6;
				break;
			case "moderate":
			default:
				this.falloff = 12;
				break;
			case "fast":
				this.falloff = 16;
				break;
			case "faster": this.falloff = 32;
		}
		switch (this._vis.saPeakFalloff) {
			case "slower":
				this.peakFalloff = 1.05;
				break;
			case "slow":
			default:
				this.peakFalloff = 1.1;
				break;
			case "moderate":
				this.peakFalloff = 1.2;
				break;
			case "fast":
				this.peakFalloff = 1.4;
				break;
			case "faster": this.peakFalloff = 1.6;
		}
	}
	prepare() {
		let m = this._vis;
		this._peak.height = 1, this._peak.width = 1;
		let _ = this._peak.getContext("2d");
		_.fillStyle = m.colors[23], _.fillRect(0, 0, 1, 1), this.pushDown = this._vis.smallVis ? 0 : this._vis.doubled && !this._vis.isMWOpen ? 2 : this._vis.doubled ? 0 : 2, this._bar.height = 16, this._bar.width = 1, this._bar.setAttribute("width", "1"), this._bar.setAttribute("height", "16"), _ = this._bar.getContext("2d");
		for (let x = 0; x < 16; x++) this._vis.pixelDensity === 2 && this._vis.smallVis ? _.fillStyle = this.colorssmall2[9 - x] : _.fillStyle = this._vis.smallVis ? this.colorssmall[4 - x] : m.colors[2 - this.pushDown - -x], _.fillRect(0, x, 1, x + 1);
	}
	paintAnalyzer() {
		if (!this._ctx) return;
		let m = this._ctx;
		m.fillStyle = this._color;
		let _ = Math.log10(512), x, S, C;
		this._vis.pixelDensity === 2 ? (x = 75, S = 10) : (x = this._vis.smallVis ? 40 : 75, S = this._vis.smallVis ? 5 : 15), function(m, _, x, S) {
			let C = /* @__PURE__ */ new Uint8Array(1024);
			m.getByteTimeDomainData(C);
			for (let m = 0; m < C.length; m++) x[m] = (C[m] - 128) / 24;
			_.timeToFrequencyDomain(x, S);
		}(this._analyser, this._fft, this.inWaveData, this.outSpectralData), C = this._vis.smallVis ? this._vis.pixelDensity === 2 ? 75 : 37 : 75;
		for (let m = 0; m < x; m++) {
			let S = 0 + (_ - 0) * m / (x - 1), C = m / (x - 1) * 511 * (1 - .91) + .91 * 10 ** S, D = Math.floor(C), O = Math.ceil(C);
			if (D >= 512 && (D = 511), O >= 512 && (O = 511), D === O) this.sample[m] = this.outSpectralData[D];
			else {
				let _ = C - D, x = 1 - _;
				this.sample[m] = x * this.outSpectralData[D] + _ * this.outSpectralData[O];
			}
		}
		for (let _ = 0; _ < C; _++) this._vis.bandwidth === "wide" ? (this.chunk = this.chunk = 4294967292 & _, this.uVar12 = (this.sample[this.chunk + 3] + this.sample[this.chunk + 2] + this.sample[this.chunk + 1] + this.sample[this.chunk]) / 4, this.saData[_] = this.uVar12) : (this.chunk = 0, this.saData[_] = this.sample[_]), this.saData[_] >= S && (this.saData[_] = S), this.saPeaks[_] >= 256 * S && (this.saPeaks[_] = 256 * S), this.saFalloff[_] -= this.falloff / 16, this.saFalloff[_] <= this.saData[_] && (this.saFalloff[_] = this.saData[_]), this.saPeaks[_] <= Math.round(256 * this.saFalloff[_]) && (this.saPeaks[_] = 256 * this.saFalloff[_], this.saData2[_] = 3), this.barPeak[_] = this.saPeaks[_] / 256, this.saPeaks[_] -= Math.round(this.saData2[_]), this.saData2[_] *= this.peakFalloff, this.saPeaks[_] <= 0 && (this.saPeaks[_] = 0), this._vis.smallVis || Math.round(this.barPeak[_]) < 1 && (this.barPeak[_] = -3), _ === this.chunk + 3 && this._vis.bandwidth === "wide" || this.paintBar(m, _, _, Math.round(this.saFalloff[_]) - this.pushDown, this.barPeak[_] + 1 - this.pushDown);
	}
	paintBarNormal(m, _, x, S, C) {
		let D = m.canvas.height, O = D - S;
		if (m.drawImage(this._bar, 0, O, 1, D - O, _, O, x - _ + 1, D - O), this._vis.peaks) {
			let S = D - C;
			m.drawImage(this._peak, 0, 0, 1, 1, _, S, x - _ + 1, 1);
		}
	}
	paintBarFire(m, _, x, S, C) {
		let D = m.canvas.height, O = D - S;
		if (m.drawImage(this._bar, 0, 0, this._bar.width, D - O, _, O, x - _ + 1, D - O), this._vis.peaks) {
			let S = D - C;
			m.drawImage(this._peak, 0, 0, 1, 1, _, S, x - _ + 1, 1);
		}
	}
	paintBarLine(m, _, x, S, C) {
		let D = m.canvas.height, O = D - S;
		if (m.drawImage(this._bar, 0, 0, this._bar.width, D - O, _, O, x - _ + 1, D - O), this._vis.peaks) {
			let S = D - C;
			m.drawImage(this._peak, 0, 0, 1, 1, _, S, x - _ + 1, 1);
		}
	}
};
function Ly(m, _, x) {
	return m[_ * x];
}
var Dy = class extends Ty {
	pushDown;
	_analyser;
	_bufferLength;
	_lastX = 0;
	_lastY = 0;
	_dataArray;
	_pixelRatio;
	_bar = document.createElement("canvas");
	_16h = document.createElement("canvas");
	paintWav;
	constructor(m) {
		super(m), this._analyser = this._vis.analyser, this._bufferLength = this._analyser.fftSize, this._dataArray = new Uint8Array(this._bufferLength), this._16h.width = 1, this._16h.height = 16, this._16h.setAttribute("width", "75"), this._16h.setAttribute("height", "16"), this._pixelRatio = window.devicePixelRatio || 1, this.paintWav = this.paintOscilloscope.bind(this), this.pushDown = 0;
	}
	prepare() {
		let m = this._vis;
		this._bar.width = 1, this._bar.height = 5, this._bar.setAttribute("width", "1"), this._bar.setAttribute("height", "5");
		let _ = this._bar.getContext("2d");
		if (_) for (let x = 0; x < 5; x++) _.fillStyle = m.colors[18 + x], _.fillRect(0, x, 1, x + 1);
		this._ctx.imageSmoothingEnabled = !1, this._ctx.mozImageSmoothingEnabled = !1, this._ctx.webkitImageSmoothingEnabled = !1, this._ctx.msImageSmoothingEnabled = !1;
	}
	paintFrame() {
		if (!this._ctx) return;
		this._analyser.getByteTimeDomainData(this._dataArray), this._dataArray = this._dataArray.slice(0, 576);
		let m = this._dataArray.length, _ = Math.floor(m / 75);
		for (let m = 0; m <= 75; m++) {
			let x = Ly(this._dataArray, _, m);
			this.paintWav(m, x);
		}
	}
	colorIndex(m) {
		return this._vis.smallVis ? 0 : m >= 14 ? 4 : m >= 12 ? 3 : m >= 10 ? 2 : m >= 8 ? 1 : m >= 6 ? 0 : m >= 4 ? 1 : m >= 2 ? 2 : 3;
	}
	paintOscilloscope(m, _) {
		if (this._vis.smallVis && this._vis.doubled) {
			if (m >= 75) return;
		} else if (m >= (this._vis.smallVis ? 38 : 75)) return;
		let x;
		this.pushDown = this._vis.smallVis ? 0 : this._vis.doubled && !this._vis.isMWOpen ? 2 : this._vis.doubled ? 0 : 2, _ = Math.round(_ / 16 * 2) - 9, x = this._vis.pixelDensity === 2 ? 3 : 5, _ = this._vis.smallVis ? _ - x : _, this._vis.smallVis && this._vis.pixelDensity === 2 ? _ = Math.round((_ + 11) / 16 * 10) - 5 : this._vis.smallVis && (_ = Math.round((_ + 11) / 16 * 5) - 2);
		let S = _ = this._vis.smallVis && this._vis.pixelDensity === 2 ? Math.max(0, Math.min(9, _)) : Math.max(0, Math.min(this._vis.renderHeight - 1, _));
		m === 0 && (this._lastY = _);
		let C = _, D = this._lastY;
		for (this._lastY = _, this._vis.oscStyle === "solid" ? this._vis.pixelDensity === 2 ? (_ >= (this._vis.smallVis ? 5 : 8) ? (C = this._vis.smallVis ? 5 : 8, D = _) : (C = _, D = this._vis.smallVis ? 5 : 7), m === 0 && this._vis.smallVis && (C = _, D = _)) : (_ >= (this._vis.smallVis ? 2 : 8) ? (C = this._vis.smallVis ? 2 : 8, D = _) : (C = _, D = this._vis.smallVis ? 2 : 7), m === 0 && this._vis.smallVis && (C = _, D = _)) : this._vis.oscStyle === "dots" ? (C = _, D = _) : D < C && ([D, C] = [C, D], this._vis.smallVis || C++), _ = C; _ <= D; _++) this._ctx.drawImage(this._bar, 0, this.colorIndex(S), 1, 1, m, _ + this.pushDown, 1, 1);
	}
}, Oy = class extends Ty {
	cleared = !1;
	prepare() {
		this.cleared = !1;
	}
	paintFrame() {
		this._ctx && (this.cleared = !0);
	}
};
function Vy({ analyser: m }) {
	$.useLayoutEffect(() => {
		m.fftSize = 1024;
	}, [m, m.fftSize]);
	let _ = mk(qf), x = mk(Zf), S = mk(x_), C = mk(u_), D = mk(c_)("main"), O = mk(Gf), F = fk(Zb), I = C("main"), L = I && D, H = L ? 5 : 16, U = O && L ? 2 : 1, W;
	W = D ? I ? O ? 76 : 38 : 76 * U : 76;
	let q = 76 * U, ee = H * U, te = $.useMemo(() => function(m) {
		let { width: _, height: x, bgColor: S, fgColor: C, windowShade: D, pixelDensity: O } = m, F = document.createElement("canvas");
		F.width = _, F.height = x;
		let I = 2 * O, L = F.getContext("2d");
		if (L == null) throw Error("Could not construct canvas context");
		if (L.fillStyle = S, L.fillRect(0, 0, _, x), !D) {
			L.fillStyle = C;
			for (let m = 0; m < _; m += I) for (let _ = O; _ < x; _ += I) L.fillRect(m, _, O, O);
		}
		return F;
	}({
		width: W,
		height: ee,
		bgColor: _[0],
		fgColor: _[1],
		windowShade: !!I,
		pixelDensity: U
	}), [
		_,
		ee,
		W,
		I,
		U
	]), [J, ne] = $.useState(null), re = $.useMemo(() => {
		if (!J) return null;
		let S = {
			canvas: J,
			colors: _,
			analyser: m,
			oscStyle: "lines",
			bandwidth: "wide",
			coloring: "normal",
			peaks: !0,
			saFalloff: "moderate",
			saPeakFalloff: "slow",
			sa: "analyzer",
			renderHeight: H,
			smallVis: L,
			pixelDensity: U,
			doubled: O,
			isMWOpen: D
		};
		switch (x) {
			case Kh: return new Dy(S);
			case "BAR": return new Qy(S);
			default: return new Oy(S);
		}
	}, [
		m,
		J,
		x,
		_,
		H,
		L,
		U,
		O,
		D
	]);
	return $.useEffect(() => {
		if (J && re) {
			let m = J.getContext("2d");
			m && (re.prepare(), S === pg && m.clearRect(0, 0, J.width, J.height));
		}
	}, [
		O,
		J,
		re
	]), $.useEffect(() => {
		if (J == null || re == null) return;
		let m = J.getContext("2d");
		if (m == null) return;
		m.imageSmoothingEnabled = !1;
		let _ = null, a = () => {
			m.drawImage(te, 0, 0), re.paintFrame(), _ = window.requestAnimationFrame(a);
		};
		return S === dg && (x === Xh ? m.clearRect(0, 0, W, ee) : a()), () => {
			_ !== null && window.cancelAnimationFrame(_);
		};
	}, [
		S,
		J,
		re,
		te,
		W,
		ee,
		x
	]), S === fg ? null : Q.jsx("canvas", {
		id: "visualizer",
		ref: ne,
		style: {
			width: 76,
			height: H
		},
		width: q,
		height: ee,
		onClick: F
	});
}
var Lv = $.memo(() => {
	let m = fk(Bb), _ = fk(Sb), x = fk(Ib), S = fk(vb), C = fk(Ub);
	return Q.jsxs("div", {
		className: "actions",
		children: [
			Q.jsx(Uk, {
				id: "previous",
				onClick: m,
				title: "Previous Track"
			}),
			Q.jsx(Uk, {
				id: "play",
				onClick: _,
				title: "Play"
			}),
			Q.jsx(Uk, {
				id: "pause",
				onClick: x,
				title: "Pause"
			}),
			Q.jsx(Uk, {
				id: "stop",
				onClick: C,
				title: "Stop"
			}),
			Q.jsx(Uk, {
				id: "next",
				onClick: S,
				title: "Next Track"
			})
		]
	});
});
function Fy({ style: m, className: _, id: x }) {
	let S = mk($f), C = fk(Db), D = fk($b), O = fk(Ak);
	return Q.jsx("input", {
		id: x,
		className: _,
		type: "range",
		min: "-100",
		max: "100",
		step: "1",
		value: S,
		style: {
			...m,
			touchAction: "none"
		},
		onChange: (m) => C(Number(m.target.value)),
		onPointerDown: () => D("balance"),
		onPointerUp: O,
		title: "Balance"
	});
}
var Gy = (m) => {
	let _ = Math.abs(m) / 100;
	return 15 * Math.floor(27 * _);
}, Rv = $.memo(() => {
	let m = mk($f);
	return Q.jsx(Fy, {
		id: "balance",
		style: { backgroundPosition: `0 -${Gy(m)}px` }
	});
}), zv = $.memo(() => {
	let m = fk(Wb);
	return Q.jsx(xy, {
		id: "close",
		onClick: m,
		title: "Close"
	});
});
function Py() {
	return $b("double");
}
function Yy() {
	return (m) => {
		m(jE()), m({ type: "UNSET_FOCUS" });
	};
}
var Bv = $.memo(() => {
	let m = fk(Py), _ = fk(Yy), x = mk(Gf);
	return Q.jsxs("div", {
		id: "clutter-bar",
		children: [
			Q.jsx(My, {
				bottom: !0,
				renderMenu: () => Q.jsx(Wk, {}),
				children: Q.jsx("div", { id: "button-o" })
			}),
			Q.jsx("div", { id: "button-a" }),
			Q.jsx("div", { id: "button-i" }),
			Q.jsx("div", {
				title: "Toggle Doublesize Mode",
				id: "button-d",
				className: ov({ selected: x }),
				onPointerUp: _,
				onPointerDown: (_) => {
					_.preventDefault(), m();
				}
			}),
			Q.jsx("div", { id: "button-v" })
		]
	});
}), Vv = $.memo(() => {
	let m = fk(ib);
	return Q.jsx(Uk, {
		id: "eject",
		onClick: m,
		title: "Open File(s)"
	});
});
function _y() {
	return $E("equalizer");
}
var Hv = $.memo(() => {
	let m = fk(_y), _ = mk(c_)("equalizer");
	return Q.jsx(Uk, {
		id: "equalizer-button",
		className: ov({ selected: _ }),
		onClick: m,
		title: "Toggle Graphical Equalizer"
	});
});
function qy() {
	return $E("playlist");
}
var Uv = $.memo(() => {
	let m = mk(c_)("playlist"), _ = fk(qy);
	return Q.jsx(Uk, {
		id: "playlist-button",
		className: ov({ selected: m }),
		onClick: _,
		title: "Toggle Playlist Editor"
	});
}), Wv = $.memo((m) => {
	let _ = (`${m.children}` || "").split("");
	return Q.jsx($.Fragment, { children: _.map((m, _) => Q.jsx(Fv, { children: m }, _ + m)) });
}), Gv = $.memo(() => {
	let m = mk(R_);
	return Q.jsx("div", {
		id: "kbps",
		children: Q.jsx(Wv, { children: m || "" })
	});
}), Kv = $.memo(() => {
	let m = mk(z_);
	return Q.jsx("div", {
		id: "khz",
		children: Q.jsx(Wv, { children: m || "" })
	});
}), AS = (m) => m.length >= 31, eS = (m) => AS(m) ? `${m}  ***  ${m}` : m.padEnd(31, " "), qv = $.memo(() => {
	let m = mk(uE), _ = mk(Gf), x = mk(xE), S = fk(lk), { handleMouseDown: C, dragOffset: D, dragging: O } = function() {
		let [m, _] = $.useState(null), [x, S] = $.useState(0);
		return $.useEffect(() => {
			if (m == null) return;
			let x = m, a = (m) => {
				let _ = cm(m) - x;
				S(-_);
			}, C = !1, r = () => {
				C ||= (document.removeEventListener("mousemove", a), document.removeEventListener("touchmove", a), document.removeEventListener("mouseup", r), document.removeEventListener("touchend", r), _(null), !0);
			};
			return document.addEventListener("mousemove", a), document.addEventListener("touchmove", a), document.addEventListener("mouseup", r), document.addEventListener("touchend", r), r;
		}, [m]), {
			handleMouseDown: $.useCallback((m) => {
				_(cm(m));
			}, []),
			dragOffset: x,
			dragging: m != null
		};
	}(), F = -((m, _, x) => AS(m) ? ((m, _) => (m % _ + _) % _)(5 * _ + x, 5 * (m.length + 7)) : 0)(m, x, D) + "px";
	return function({ step: m, dragging: _ }) {
		let [x, S] = $.useState(!0);
		$.useEffect(() => {
			if (!1 === x) return;
			let _ = setInterval(m, 220);
			return () => clearInterval(_);
		}, [m, x]), $.useEffect(() => {
			if (_) return void S(!1);
			let m = window.setTimeout(() => {
				S(!0);
			}, 1e3);
			return () => {
				window.clearTimeout(m);
			};
		}, [_]);
	}({
		step: S,
		dragging: O
	}), Q.jsx("div", {
		id: "marquee",
		className: "text",
		onPointerDown: C,
		title: "Song Title",
		children: Q.jsx("div", {
			style: {
				whiteSpace: "nowrap",
				willChange: "transform",
				transform: `translateX(${F})`
			},
			children: Q.jsx(Wv, { children: eS(m) })
		}, _ ? "doubled" : "not-doubled")
	});
}), Jv = $.memo(() => {
	let m = mk(F_);
	return Q.jsxs("div", {
		className: "mono-stereo",
		children: [Q.jsx("div", {
			id: "stereo",
			className: ov({ selected: m === 2 })
		}), Q.jsx("div", {
			id: "mono",
			className: ov({ selected: m === 1 })
		})]
	});
}), Yv = $.memo(() => {
	let [m, _] = function() {
		let m = mk(If), _ = mk(nE), x = m ? Math.floor(_) / m * 100 : 0, S = mk(sE);
		return [x, mk(oE) === "position" ? S : x];
	}(), x = Ek(), S = $.useCallback((m) => {
		x({
			type: "SEEK_TO_PERCENT_COMPLETE",
			percent: Number(m.target.value)
		}), x({ type: "UNSET_FOCUS" });
	}, [x]), C = $.useCallback((m) => {
		x({
			type: "SET_FOCUS",
			input: "position"
		}), x({
			type: "SET_SCRUB_POSITION",
			position: Number(m.target.value)
		});
	}, [x]), D = "";
	return m <= 33 ? D = "left" : m >= 66 && (D = "right"), Q.jsx("input", {
		id: "position",
		className: D,
		type: "range",
		min: "0",
		max: "100",
		step: "1",
		style: { touchAction: "none" },
		value: _,
		onInput: C,
		onChange: () => {},
		onPointerUp: S,
		onPointerDown: C,
		title: "Seeking Bar"
	});
}), Xv = $.memo(() => {
	let m = mk(eE), _ = fk(Ob);
	return Q.jsx(Yk, {
		renderContents: () => Q.jsx(Kk, {
			checked: m,
			label: "Repeat",
			onClick: _,
			hotkey: "(R)"
		}),
		children: Q.jsx(Uk, {
			id: "repeat",
			className: ov({ selected: m }),
			onClick: _,
			title: "Toggle Repeat"
		})
	});
}), Zv = $.memo(() => {
	let m = fk(JE);
	return Q.jsx(xy, {
		id: "shade",
		onClick: m,
		onDoubleClick: (m) => m.stopPropagation(),
		title: "Toggle Windowshade Mode"
	});
}), Qv = $.memo(() => {
	let m = fk(Xb);
	return Q.jsx(xy, {
		id: "minimize",
		title: "Minimize",
		onClick: m
	});
}), $v = $.memo(() => {
	let m = mk(AE), _ = fk(Vb);
	return Q.jsx(Yk, {
		renderContents: () => Q.jsx(Kk, {
			checked: m,
			label: "Shuffle",
			onClick: _,
			hotkey: "(S)"
		}),
		children: Q.jsx(Uk, {
			id: "shuffle",
			className: ov({ selected: m }),
			onClick: _,
			title: "Toggle Shuffle"
		})
	});
}), ey = $.memo(() => {
	let m = fk(Rb), _ = mk(nE), x = mk(If) || 0, S = mk(NE), C = Gh(S === ag ? _ : x - _);
	return Q.jsxs("div", {
		id: "time",
		onClick: m,
		className: "countdown",
		children: [
			S === sg && Q.jsx("div", { id: "minus-sign" }),
			Q.jsx("div", {
				id: "minute-first-digit",
				className: `digit digit-${C.minutesFirstDigit}`
			}),
			Q.jsx("div", {
				id: "minute-second-digit",
				className: `digit digit-${C.minutesSecondDigit}`
			}),
			Q.jsx("div", {
				id: "second-first-digit",
				className: `digit digit-${C.secondsFirstDigit}`
			}),
			Q.jsx("div", {
				id: "second-second-digit",
				className: `digit digit-${C.secondsSecondDigit}`
			})
		]
	});
});
function uS({ id: m, style: _, className: x }) {
	let S = mk(Xf), C = fk($b), D = fk(Ak), O = fk(Tb);
	return Q.jsx("input", {
		id: m,
		type: "range",
		min: "0",
		max: "100",
		step: "1",
		value: S,
		style: {
			..._,
			touchAction: "none"
		},
		className: x,
		onChange: (m) => O(Number(m.target.value)),
		onPointerDown: () => C("volume"),
		onPointerUp: D,
		title: "Volume Bar"
	});
}
var ny = $.memo(() => {
	let m = mk(Xf) / 100, _ = { backgroundPosition: `0 -${15 * (Math.round(28 * m) - 1)}px` };
	return Q.jsx("div", {
		id: "volume",
		style: _,
		children: Q.jsx(uS, {})
	});
});
function dS(m) {
	return lb(m, Ih);
}
var ry = $.memo(({ analyser: m, filePickers: _ }) => {
	let x = mk(u_)("main"), S = mk(x_), C = mk(Ff), D = mk(TE), O = mk(Gf), F = mk(zf), I = mk(QE), L = ov({
		window: !0,
		play: S === dg,
		stop: S === fg,
		pause: S === pg,
		selected: C === kh,
		shade: x,
		draggable: !0,
		loading: D,
		doubled: O,
		llama: F
	}), H = fk(JE), U = fk(Lb), W = fk(dS);
	return Q.jsx(Vk, {
		id: "main-window",
		windowId: kh,
		className: L,
		handleDrop: W,
		onWheelActive: U,
		children: Q.jsxs(Sk, {
			windowId: kh,
			children: [
				Q.jsxs("div", {
					id: "title-bar",
					className: "selected draggable",
					onDoubleClick: H,
					children: [
						Q.jsx(My, {
							id: "option-context",
							bottom: !0,
							renderMenu: () => Q.jsx(mv, { filePickers: _ }),
							children: Q.jsx(xy, {
								id: "option",
								title: "Winamp Menu"
							})
						}),
						x && Q.jsx(By, {}),
						Q.jsx(Qv, {}),
						Q.jsx(Zv, {}),
						Q.jsx(zv, {})
					]
				}),
				Q.jsxs("div", {
					className: "webamp-status",
					children: [
						Q.jsx(Bv, {}),
						!I && Q.jsx("div", { id: "play-pause" }),
						Q.jsx("div", {
							id: "work-indicator",
							className: ov({ selected: I })
						}),
						Q.jsx(ey, {})
					]
				}),
				Q.jsx(Vy, { analyser: m }),
				Q.jsxs("div", {
					className: "media-info",
					children: [
						Q.jsx(qv, {}),
						Q.jsx(Gv, {}),
						Q.jsx(Kv, {}),
						Q.jsx(Jv, {})
					]
				}),
				Q.jsx(ny, {}),
				Q.jsx(Rv, {}),
				Q.jsxs("div", {
					className: "windows",
					children: [Q.jsx(Hv, {}), Q.jsx(Uv, {})]
				}),
				Q.jsx(Yv, {}),
				Q.jsx(Lv, {}),
				Q.jsx(Vv, {}),
				Q.jsxs("div", {
					className: "shuffle-repeat",
					children: [Q.jsx($v, {}), Q.jsx(Xv, {})]
				}),
				Q.jsx("a", {
					id: "about",
					target: "_blank",
					href: "https://webamp.org/about",
					title: "About"
				})
			]
		})
	});
});
function pS({ widthOnly: m }) {
	let _ = mk(d_), x = fk(XE), S = _("playlist");
	return Q.jsx(sv, {
		currentSize: S,
		id: "playlist-resize-target",
		setWindowSize: (m) => {
			x("playlist", m);
		},
		widthOnly: m
	});
}
function hS() {
	let m = mk(Ff), _ = mk(d_)("playlist"), x = mk(If), S = mk(T_), C = fk(WE), D = fk(qE), O = fk(ZE), F = 25 * _[0], I = $.useMemo(() => {
		if (S == null) return "[No file]";
		let m = (205 + F) / 5;
		return S.length > m ? S.slice(0, m - 1) + "…" : S;
	}, [F, S]), L = $.useMemo(() => S == null ? "" : zh(x), [x, S]);
	return Q.jsx("div", {
		id: "playlist-window-shade",
		className: ov("window", "draggable", { selected: m === Ah }),
		style: { width: `${275 + F}px` },
		onPointerDown: () => O("playlist"),
		onDoubleClick: D,
		children: Q.jsx("div", {
			className: "left",
			children: Q.jsxs("div", {
				className: "right draggable",
				children: [
					Q.jsx("div", {
						id: "playlist-shade-track-title",
						children: Q.jsx(Wv, { children: I })
					}),
					Q.jsx("div", {
						id: "playlist-shade-time",
						children: Q.jsx(Wv, { children: L })
					}),
					Q.jsx(pS, { widthOnly: !0 }),
					Q.jsx(Uk, {
						id: "playlist-shade-button",
						onClick: D
					}),
					Q.jsx(Uk, {
						id: "playlist-close-button",
						onClick: () => C("playlist")
					})
				]
			})
		})
	});
}
var iy = $.memo(function({ children: m }) {
	let { ref: _, hover: x } = function() {
		let m = ($.useEffect(() => (rv === 0 && window.document.addEventListener("mousemove", hk), rv++, () => {
			rv--, rv === 0 && window.document.removeEventListener("mousemove", hk);
		}), []), nv), [_, x] = $.useState(!1), [S, C] = $.useState(null);
		return $.useLayoutEffect(() => {
			if (S == null) return void x(!1);
			let _ = S.getBoundingClientRect(), { pageX: C, pageY: D } = m.current;
			x(C >= _.left && C <= _.right && D >= _.top && D <= _.bottom);
			let r = () => x(!0), l = () => x(!1);
			return S.addEventListener("mouseenter", r), S.addEventListener("mouseleave", l), () => {
				S.removeEventListener("mouseenter", r), S.removeEventListener("mouseleave", l);
			};
		}, [S, m]), {
			ref: C,
			hover: _
		};
	}();
	return Q.jsx("li", {
		ref: _,
		className: ov({ hover: x }),
		children: m
	});
}), ay = $.memo(function(m) {
	let [_, x] = $.useState(!1), [S, C] = $.useState(null), D = $.useCallback(() => {
		setTimeout(() => {
			x(!1);
		}, 0);
	}, []);
	return function(m, _) {
		$.useEffect(() => {
			if (m == null || _ == null) return;
			let t = (x) => {
				let S = x.target;
				S instanceof Element && (m.contains(S) || (_(), window.document.removeEventListener("click", t, { capture: !0 })));
			};
			return window.document.addEventListener("click", t, { capture: !0 }), () => {
				window.document.removeEventListener("click", t, { capture: !0 });
			};
		}, [m, _]);
	}(S, _ ? D : null), Q.jsxs("div", {
		id: m.id,
		className: ov("playlist-menu", { selected: _ }),
		ref: C,
		onClick: () => x((m) => !m),
		children: [Q.jsx("div", { className: "bar" }), _ && Q.jsx("ul", { children: $.Children.map(m.children, (m, _) => Q.jsx(iy, { children: m }, _)) })]
	});
}), ES = () => {
	let m = mk(Zg), _ = fk(mb), x = fk(hb), S = fk(fb);
	return Q.jsxs(ay, {
		id: "playlist-add-menu",
		children: [
			Q.jsx("div", {
				className: "add-url",
				onClick: () => S(m)
			}),
			Q.jsx("div", {
				className: "add-dir",
				onClick: () => _(m)
			}),
			Q.jsx("div", {
				className: "add-file",
				onClick: () => x(m)
			})
		]
	});
}, wS = () => {
	let m = fk(vw), _ = fk(Bw), x = fk(Cw);
	return Q.jsxs(ay, {
		id: "playlist-remove-menu",
		children: [
			Q.jsx("div", {
				className: "remove-misc",
				onClick: () => alert("Not supported in Webamp")
			}),
			Q.jsx("div", {
				className: "remove-all",
				onClick: _
			}),
			Q.jsx("div", {
				className: "crop",
				onClick: x
			}),
			Q.jsx("div", {
				className: "remove-selected",
				onClick: m
			})
		]
	});
};
function bS() {
	let m = fk(Rw), _ = fk(Fw), x = fk(Gw);
	return Q.jsxs(ay, {
		id: "playlist-selection-menu",
		children: [
			Q.jsx("div", {
				className: "invert-selection",
				onClick: m
			}),
			Q.jsx("div", {
				className: "select-zero",
				onClick: _
			}),
			Q.jsx("div", {
				className: "select-all",
				onClick: x
			})
		]
	});
}
function kS() {
	let m = fk(xw), _ = fk(Mw), x = fk(Nw);
	return Q.jsx(My, {
		style: {
			width: "100%",
			height: "100%"
		},
		top: !0,
		renderMenu: () => Q.jsxs(Q.Fragment, { children: [
			Q.jsx(Kk, {
				label: "Sort list by title",
				onClick: x
			}),
			Q.jsx(Fk, {}),
			Q.jsx(Kk, {
				label: "Reverse list",
				onClick: m
			}),
			Q.jsx(Kk, {
				label: "Randomize list",
				onClick: _
			})
		] }),
		children: Q.jsx("div", {})
	});
}
var yS = () => {
	let m = fk(db);
	return Q.jsx(My, {
		style: {
			width: "100%",
			height: "100%"
		},
		top: !0,
		renderMenu: () => Q.jsx(Kk, {
			onClick: m,
			label: "Generate HTML playlist"
		}),
		children: Q.jsx("div", {})
	});
}, SS = () => Q.jsxs(ay, {
	id: "playlist-misc-menu",
	children: [
		Q.jsx("div", {
			className: "sort-list",
			onClick: (m) => m.stopPropagation(),
			children: Q.jsx(kS, {})
		}),
		Q.jsx("div", {
			className: "file-info",
			onClick: () => alert("Not supported in Webamp")
		}),
		Q.jsx("div", {
			className: "misc-options",
			onClick: (m) => m.stopPropagation(),
			children: Q.jsx(yS, {})
		})
	]
});
function IS() {
	let m = fk(Bw), _ = fk(Eb), x = fk(wb);
	return Q.jsxs(ay, {
		id: "playlist-list-menu",
		children: [
			Q.jsx("div", {
				className: "new-list",
				onClick: m
			}),
			Q.jsx("div", {
				className: "save-list",
				onClick: x
			}),
			Q.jsx("div", {
				className: "load-list",
				onClick: _
			})
		]
	});
}
var US = () => {
	let m = mk(o_), _ = $.useMemo(() => function(m) {
		for (; m.length < 18;) m += " ";
		return m;
	}(m), [m]);
	return Q.jsx("div", {
		className: "playlist-running-time-display draggable",
		children: Q.jsx("div", { children: Q.jsx(Wv, { children: _ }) })
	});
}, CS = () => {
	let m = fk(Sb), _ = fk(Ib), x = fk(Ub), S = fk(ib), C = fk(vb), D = fk(Bb);
	return Q.jsxs($.Fragment, { children: [
		Q.jsx(US, {}),
		Q.jsxs("div", {
			className: "playlist-action-buttons",
			children: [
				Q.jsx("div", {
					className: "playlist-previous-button",
					onClick: D
				}),
				Q.jsx("div", {
					className: "playlist-play-button",
					onClick: m
				}),
				Q.jsx("div", {
					className: "playlist-pause-button",
					onClick: _
				}),
				Q.jsx("div", {
					className: "playlist-stop-button",
					onClick: x
				}),
				Q.jsx("div", {
					className: "playlist-next-button",
					onClick: C
				}),
				Q.jsx("div", {
					className: "playlist-eject-button",
					onClick: S
				})
			]
		}),
		Q.jsx(By, {})
	] });
};
function vS({ children: m, handleMoveClick: _, index: x, id: S }) {
	let C = mk(Wf), D = mk(n_), O = mk(sf), F = D.has(S), I = O === S, L = Ek(), H = fk(yb), U = $.useCallback((m) => m.shiftKey ? (m.preventDefault(), void L({
		type: "SHIFT_CLICKED_TRACK",
		index: x
	})) : m.metaKey || m.ctrlKey ? (m.preventDefault(), void L({
		type: "CTRL_CLICKED_TRACK",
		index: x
	})) : (F || L({
		type: "CLICKED_TRACK",
		index: x
	}), void _(m)), [
		L,
		_,
		x,
		F
	]), W = $.useCallback((m) => {
		function a() {
			H(S);
		}
		F || L({
			type: "CLICKED_TRACK",
			index: x
		}), _(m), m.target.addEventListener("touchstart", a), setTimeout(() => {
			m.target.removeEventListener("touchstart", a);
		}, 250);
	}, [
		L,
		_,
		S,
		x,
		H,
		F
	]), q = {
		backgroundColor: F ? C.selectedbg : void 0,
		color: I ? C.current : void 0
	};
	return Q.jsx("div", {
		className: ov("track-cell", {
			selected: F,
			current: I
		}),
		style: q,
		onClick: (m) => m.stopPropagation(),
		onMouseDown: U,
		onTouchStart: W,
		onContextMenu: (m) => m.preventDefault(),
		onDoubleClick: () => H(S),
		children: m
	});
}
var BS = ({ id: m, paddedTrackNumber: _ }) => {
	let x = mk(y_)(m);
	return Q.jsxs("span", { children: [
		_,
		". ",
		x
	] });
};
function xS() {
	let m = mk(g_), _ = mk(__), x = mk(Hm), S = mk(Df), C = fk(Fw), D = fk(Vw), O = fk(Lw), [F, I] = $.useState(null), [L, H] = $.useState(!1), [U, W] = $.useState(null), p = (m) => {
		H(!0), W(dm(m));
	};
	function h(x) {
		return _.map((_, S) => Q.jsx(vS, {
			id: _,
			index: m + S,
			handleMoveClick: p,
			children: x(_, S)
		}, _));
	}
	$.useEffect(() => {
		if (F == null || U == null || !1 === L) return;
		let { top: m, bottom: _, left: x, right: S } = F.getBoundingClientRect(), C = 0, r = (O) => {
			let F = cm(O), I = dm(O);
			if (I < m || I > _ || F < x || F > S) return;
			let L = Math.floor((I - U) / 13);
			L !== C && (D(L - C), C = L);
		}, l = () => H(!1);
		return window.addEventListener("mouseup", l), window.addEventListener("mousemove", r), window.addEventListener("touchend", l), window.addEventListener("touchmove", r), () => {
			window.removeEventListener("mousemove", r), window.removeEventListener("touchmove", r), window.removeEventListener("mouseup", l), window.removeEventListener("touchend", l);
		};
	}, [L]);
	let q = S.toString().length, f = (_) => (_ + 1 + m).toString().padStart(q, "\xA0");
	return $.useEffect(() => {
		if (F != null) return F.addEventListener("wheel", O, { passive: !1 }), () => {
			F.removeEventListener("wheel", O);
		};
	}, [F, O]), Q.jsxs("div", {
		ref: I,
		className: "playlist-tracks",
		style: {
			height: "100%",
			userSelect: "none"
		},
		onClick: C,
		children: [Q.jsx("div", {
			className: "playlist-track-titles",
			children: h((m, _) => Q.jsx(BS, {
				id: m,
				paddedTrackNumber: f(_)
			}))
		}), Q.jsx("div", {
			className: "playlist-track-durations",
			children: h((m) => zh(x[m].duration))
		})]
	});
}
function MS({ value: m, height: _, width: x, handle: S, handleHeight: C, onBeforeChange: D, onChange: O, onAfterChange: F, requireClicksOriginateLocally: I = !0, disabled: L }) {
	let H = $.useRef(null), U = $.useRef(null);
	function g(m) {
		m.preventDefault(), function({ target: m, clientY: _ }) {
			let x = H.current, S = U.current;
			if (x == null || S == null) return null;
			let C = x.getBoundingClientRect(), I = S.getBoundingClientRect(), { top: L, height: W } = C, { top: q, height: ee } = I, te = L + (S.contains(m) ? _ - q : ee / 2), J = W - ee;
			function f(m) {
				O(Hh((m - te) / J, 0, 1));
			}
			let E = (m) => {
				m.preventDefault(), f(m.clientY);
			}, w = () => {
				F?.(), document.removeEventListener("pointermove", E), document.removeEventListener("pointerup", w);
			};
			document.addEventListener("pointermove", E), document.addEventListener("pointerup", w), D?.(), f(_);
		}({
			target: m.target,
			clientY: m.clientY
		});
	}
	let W = Math.floor((_ - C) * m);
	return Q.jsx("div", {
		style: {
			height: _,
			width: x
		},
		onPointerDown: L ? void 0 : g,
		onPointerEnter: L || I ? void 0 : function(m) {
			m.buttons === 1 && g(m);
		},
		ref: H,
		children: Q.jsx("div", {
			style: { transform: `translateY(${W}px)` },
			ref: U,
			children: S
		})
	});
}
var NS = () => Q.jsx("div", {
	className: "playlist-scrollbar-handle",
	style: { height: 18 }
});
function TS() {
	let m = mk(A_)(Ah).height, _ = mk(h_), x = mk(yf), S = fk(Tw);
	return Q.jsx("div", {
		className: "playlist-scrollbar",
		style: { marginLeft: 5 },
		children: Q.jsx(MS, {
			height: m - 58,
			handleHeight: 18,
			width: 8,
			value: _ / 100,
			onChange: (m) => S(100 * m),
			handle: Q.jsx(NS, {}),
			disabled: x
		})
	});
}
function QS(m) {
	return m.playlist.trackOrder.length - 1;
}
function LS({ analyser: m }) {
	let _ = mk(g_), x = mk(d_), S = mk(Ff), C = mk(u_), D = mk(c_), O = mk(QS), F = mk(Wf), I = mk(A_), L = S === Ah, H = !!C(Ah), U = x(Ah), W = I(Ah), q = fk(WE), ee = fk(qE), te = fk(Dw), J = fk(Ow), ne = fk(Lw), re = fk(lb), ie = U[0] > 2, ae = !D(kh), oe = $.useCallback((m, x) => {
		let S = m.clientY - x.y, C = Hh(_ + Math.round((S - 23) / 13), 0, O + 1);
		re(m, Lh, C);
	}, [
		re,
		O,
		_
	]);
	if (H) return Q.jsx(hS, {});
	let se = {
		color: F.normal,
		backgroundColor: F.normalbg,
		fontFamily: `${F.font}, Arial, sans-serif`,
		height: `${W.height}px`,
		width: `${W.width}px`
	}, ce = ov("window", "draggable", { selected: L }), le = U[0] % 2 == 0;
	return Q.jsx(Sk, {
		windowId: Ah,
		children: Q.jsxs(Vk, {
			id: "playlist-window",
			windowId: Ah,
			className: ce,
			style: se,
			handleDrop: oe,
			onWheelActive: ne,
			children: [
				Q.jsxs("div", {
					className: "playlist-top draggable",
					onDoubleClick: ee,
					children: [
						Q.jsx("div", { className: "playlist-top-left draggable" }),
						le && Q.jsx("div", { className: "playlist-top-left-spacer draggable" }),
						Q.jsx("div", { className: "playlist-top-left-fill draggable" }),
						Q.jsx("div", { className: "playlist-top-title draggable" }),
						le && Q.jsx("div", { className: "playlist-top-right-spacer draggable" }),
						Q.jsx("div", { className: "playlist-top-right-fill draggable" }),
						Q.jsxs("div", {
							className: "playlist-top-right draggable",
							children: [Q.jsx(Uk, {
								id: "playlist-shade-button",
								onClick: ee
							}), Q.jsx(Uk, {
								id: "playlist-close-button",
								onClick: () => q(Ah)
							})]
						})
					]
				}),
				Q.jsxs("div", {
					className: "playlist-middle draggable",
					children: [
						Q.jsx("div", { className: "playlist-middle-left draggable" }),
						Q.jsx("div", {
							className: "playlist-middle-center",
							children: Q.jsx(xS, {})
						}),
						Q.jsx(Uk, {
							className: "playlist-middle-right draggable",
							children: Q.jsx(TS, {})
						})
					]
				}),
				Q.jsxs("div", {
					className: "playlist-bottom draggable",
					children: [
						Q.jsxs("div", {
							className: "playlist-bottom-left draggable",
							children: [
								Q.jsx(ES, {}),
								Q.jsx(wS, {}),
								Q.jsx(bS, {}),
								Q.jsx(SS, {})
							]
						}),
						Q.jsx("div", { className: "playlist-bottom-center draggable" }),
						Q.jsxs("div", {
							className: "playlist-bottom-right draggable",
							children: [
								ie && Q.jsx("div", {
									className: "playlist-visualizer",
									children: ae && Q.jsx("div", {
										className: "visualizer-wrapper",
										children: Q.jsx(Vy, { analyser: m })
									})
								}),
								Q.jsx(CS, {}),
								Q.jsx(IS, {}),
								Q.jsx("div", {
									id: "playlist-scroll-up-button",
									onClick: te
								}),
								Q.jsx("div", {
									id: "playlist-scroll-down-button",
									onClick: J
								}),
								Q.jsx(pS, {})
							]
						})
					]
				})
			]
		})
	});
}
var DS = () => Q.jsx("div", {
	style: {
		width: 11,
		height: 11,
		marginLeft: 1
	},
	className: "slider-handle"
});
function OS({ id: m, onChange: _, band: x, clickOriginatedInEq: S }) {
	let C = mk(Pm)[x], D = $.useMemo(() => {
		let { x: m, y: _ } = (x = ((m) => {
			let _ = m / 100;
			return Math.round(27 * _);
		})(C), {
			x: x % 14,
			y: Math.floor(x / 14)
		});
		var x;
		return `-${15 * m}px -${65 * _}px`;
	}, [C]), O = fk(ek), F = fk(Ak);
	return Q.jsx(Uk, {
		id: m,
		className: "band",
		style: {
			backgroundPosition: D,
			height: 63
		},
		requireClicksOriginateLocally: !(x !== "preamp" && S),
		children: Q.jsx(MS, {
			height: 62,
			width: 14,
			handleHeight: 11,
			value: 1 - C / 100,
			onBeforeChange: () => O(x),
			onChange: (m) => _(100 * (1 - m)),
			onAfterChange: F,
			requireClicksOriginateLocally: !(x !== "preamp" && S),
			handle: Q.jsx(DS, {})
		})
	});
}
var VS = () => {
	let m = fk(Jw), _ = mk(aE);
	return Q.jsx(Uk, {
		id: "on",
		className: ov({ selected: _ }),
		onClick: m
	});
}, oy = $.memo(() => {
	let m = mk((m) => m.equalizer.auto), _ = fk(qw);
	return Q.jsx(Uk, {
		id: "auto",
		className: ov({ selected: m }),
		onClick: _
	});
});
function FS(m, _, x) {
	let S = m[_];
	m[_] = m[x], m[x] = S;
}
function GS() {
	let m = mk(Pm), _ = dk(mk(B_)), [x, S] = $.useState(null), C = $.useMemo(() => x?.getContext("2d") ?? null, [x]), D = function(m) {
		let _ = dk(mk(V_));
		return $.useMemo(() => m == null || _ == null ? null : m.createPattern(_, "repeat-x"), [m, _]);
	}(C);
	return $.useLayoutEffect(() => {
		if (C == null || x == null || _ == null || D == null) return;
		let S = Number(x.width), O = Number(x.height);
		C.clearRect(0, 0, S, O), function({ colorPattern: m, sliders: _, canvasCtx: x, preampLineImage: S }) {
			let C = qh(_.preamp / 100, 0, 18);
			x.drawImage(S, 0, C, S.width, S.height);
			let D = Oh.map((m) => _[m]);
			x.fillStyle = m;
			let O = [], F = [];
			D.forEach((m, _) => {
				let x = (100 - m) / 100;
				O.push(12 * _), F.push(qh(x, 0, 18));
			});
			let I = function(m, _) {
				let x = function(m, _) {
					let x = m.map(() => 0), S = m.length - 1, C = function(m, _) {
						let x = [];
						for (let S = 0; S < m; S++) {
							x.push([]);
							for (let m = 0; m < _; m++) x[S].push(0);
						}
						return x;
					}(S + 1, S + 2);
					for (let x = 1; x < S; x++) C[x][x - 1] = 1 / (m[x] - m[x - 1]), C[x][x] = 2 * (1 / (m[x] - m[x - 1]) + 1 / (m[x + 1] - m[x])), C[x][x + 1] = 1 / (m[x + 1] - m[x]), C[x][S + 1] = 3 * ((_[x] - _[x - 1]) / ((m[x] - m[x - 1]) * (m[x] - m[x - 1])) + (_[x + 1] - _[x]) / ((m[x + 1] - m[x]) * (m[x + 1] - m[x])));
					return C[0][0] = 2 / (m[1] - m[0]), C[0][1] = 1 / (m[1] - m[0]), C[0][S + 1] = 3 * (_[1] - _[0]) / ((m[1] - m[0]) * (m[1] - m[0])), C[S][S - 1] = 1 / (m[S] - m[S - 1]), C[S][S] = 2 / (m[S] - m[S - 1]), C[S][S + 1] = 3 * (_[S] - _[S - 1]) / ((m[S] - m[S - 1]) * (m[S] - m[S - 1])), function(m, _) {
						let x = m.length;
						for (let _ = 0; _ < x; _++) {
							let S = 0, C = -Infinity;
							for (let D = _; D < x; D++) m[D][_] > C && (S = D, C = m[D][_]);
							FS(m, _, S);
							for (let S = _ + 1; S < x; S++) {
								for (let C = _ + 1; C < x + 1; C++) m[S][C] = m[S][C] - m[_][C] * (m[S][_] / m[_][_]);
								m[S][_] = 0;
							}
						}
						for (let S = x - 1; S >= 0; S--) {
							let C = m[S][x] / m[S][S];
							_[S] = C;
							for (let _ = S - 1; _ >= 0; _--) m[_][x] -= m[_][S] * C, m[_][S] = 0;
						}
						return _;
					}(C, x);
				}(m, _), S = m[m.length - 1], C = [], D = 1;
				for (let O = 0; O <= S; O++) {
					for (; m[D] < O;) D++;
					let S = (O - m[D - 1]) / (m[D] - m[D - 1]), F = x[D - 1] * (m[D] - m[D - 1]) - (_[D] - _[D - 1]), I = -x[D] * (m[D] - m[D - 1]) + (_[D] - _[D - 1]), L = (1 - S) * _[D - 1] + S * _[D] + S * (1 - S) * (F * (1 - S) + I * S);
					C.push(L);
				}
				return C;
			}(O, F), L = O[O.length - 1], H = F[0];
			for (let m = 0; m <= L; m++) {
				let _ = Hh(Math.round(I[m]), 0, 18), S = Math.min(_, H), C = 1 + Math.abs(H - _);
				x.fillRect(2 + m, S, 1, C), H = _;
			}
		}({
			colorPattern: D,
			sliders: m,
			canvasCtx: C,
			preampLineImage: _
		});
	}, [
		C,
		x,
		D,
		_,
		m
	]), Q.jsx("canvas", {
		id: "eqGraph",
		ref: S,
		width: 113,
		height: 19
	});
}
var sy = {
	type: "Winamp EQ library file v1.1",
	presets: [
		{
			name: "Classical",
			hz60: 33,
			hz170: 33,
			hz310: 33,
			hz600: 33,
			hz1000: 33,
			hz3000: 33,
			hz6000: 20,
			hz12000: 20,
			hz14000: 20,
			hz16000: 16,
			preamp: 33
		},
		{
			name: "Club",
			hz60: 33,
			hz170: 33,
			hz310: 38,
			hz600: 42,
			hz1000: 42,
			hz3000: 42,
			hz6000: 38,
			hz12000: 33,
			hz14000: 33,
			hz16000: 33,
			preamp: 33
		},
		{
			name: "Dance",
			hz60: 48,
			hz170: 44,
			hz310: 36,
			hz600: 32,
			hz1000: 32,
			hz3000: 22,
			hz6000: 20,
			hz12000: 20,
			hz14000: 32,
			hz16000: 32,
			preamp: 33
		},
		{
			name: "Laptop speakers/headphones",
			hz60: 40,
			hz170: 50,
			hz310: 41,
			hz600: 26,
			hz1000: 28,
			hz3000: 35,
			hz6000: 40,
			hz12000: 48,
			hz14000: 53,
			hz16000: 56,
			preamp: 33
		},
		{
			name: "Large hall",
			hz60: 49,
			hz170: 49,
			hz310: 42,
			hz600: 42,
			hz1000: 33,
			hz3000: 24,
			hz6000: 24,
			hz12000: 24,
			hz14000: 33,
			hz16000: 33,
			preamp: 33
		},
		{
			name: "Party",
			hz60: 44,
			hz170: 44,
			hz310: 33,
			hz600: 33,
			hz1000: 33,
			hz3000: 33,
			hz6000: 33,
			hz12000: 33,
			hz14000: 44,
			hz16000: 44,
			preamp: 33
		},
		{
			name: "Pop",
			hz60: 29,
			hz170: 40,
			hz310: 44,
			hz600: 45,
			hz1000: 41,
			hz3000: 30,
			hz6000: 28,
			hz12000: 28,
			hz14000: 29,
			hz16000: 29,
			preamp: 33
		},
		{
			name: "Reggae",
			hz60: 33,
			hz170: 33,
			hz310: 31,
			hz600: 22,
			hz1000: 33,
			hz3000: 43,
			hz6000: 43,
			hz12000: 33,
			hz14000: 33,
			hz16000: 33,
			preamp: 33
		},
		{
			name: "Rock",
			hz60: 45,
			hz170: 40,
			hz310: 23,
			hz600: 19,
			hz1000: 26,
			hz3000: 39,
			hz6000: 47,
			hz12000: 50,
			hz14000: 50,
			hz16000: 50,
			preamp: 33
		},
		{
			name: "Soft",
			hz60: 40,
			hz170: 35,
			hz310: 30,
			hz600: 28,
			hz1000: 30,
			hz3000: 39,
			hz6000: 46,
			hz12000: 48,
			hz14000: 50,
			hz16000: 52,
			preamp: 33
		},
		{
			name: "Ska",
			hz60: 28,
			hz170: 24,
			hz310: 25,
			hz600: 31,
			hz1000: 39,
			hz3000: 42,
			hz6000: 47,
			hz12000: 48,
			hz14000: 50,
			hz16000: 48,
			preamp: 33
		},
		{
			name: "Full Bass",
			hz60: 48,
			hz170: 48,
			hz310: 48,
			hz600: 42,
			hz1000: 35,
			hz3000: 25,
			hz6000: 18,
			hz12000: 15,
			hz14000: 14,
			hz16000: 14,
			preamp: 33
		},
		{
			name: "Soft Rock",
			hz60: 39,
			hz170: 39,
			hz310: 36,
			hz600: 31,
			hz1000: 25,
			hz3000: 23,
			hz6000: 26,
			hz12000: 31,
			hz14000: 37,
			hz16000: 47,
			preamp: 33
		},
		{
			name: "Full Treble",
			hz60: 16,
			hz170: 16,
			hz310: 16,
			hz600: 25,
			hz1000: 37,
			hz3000: 50,
			hz6000: 58,
			hz12000: 58,
			hz14000: 58,
			hz16000: 60,
			preamp: 33
		},
		{
			name: "Full Bass & Treble",
			hz60: 44,
			hz170: 42,
			hz310: 33,
			hz600: 20,
			hz1000: 24,
			hz3000: 35,
			hz6000: 46,
			hz12000: 50,
			hz14000: 52,
			hz16000: 52,
			preamp: 33
		},
		{
			name: "Live",
			hz60: 24,
			hz170: 33,
			hz310: 39,
			hz600: 41,
			hz1000: 42,
			hz3000: 42,
			hz6000: 39,
			hz12000: 37,
			hz14000: 37,
			hz16000: 36,
			preamp: 33
		},
		{
			name: "Techno",
			hz60: 45,
			hz170: 42,
			hz310: 33,
			hz600: 23,
			hz1000: 24,
			hz3000: 33,
			hz6000: 45,
			hz12000: 48,
			hz14000: 48,
			hz16000: 47,
			preamp: 33
		}
	]
}, KS = () => {
	let m = fk(ab), _ = fk(cb), x = fk(ub);
	return Q.jsx(My, {
		top: !0,
		id: "presets-context",
		renderMenu: () => Q.jsxs(Q.Fragment, { children: [Q.jsxs(Gk, {
			label: "Load",
			children: [
				sy.presets.map((m) => Q.jsx(Kk, {
					onClick: () => x(m),
					label: m.name
				}, m.name)),
				Q.jsx(Fk, {}),
				Q.jsx(Kk, {
					onClick: m,
					label: "From Eqf..."
				})
			]
		}), Q.jsx(Kk, {
			onClick: _,
			label: "Save"
		})] }),
		children: Q.jsx(Uk, { id: "presets" })
	});
};
function PS() {
	let m = mk(Ff) === Mh, _ = fk(WE), x = fk(_E);
	return Q.jsxs(xy, {
		id: "eq-buttons",
		children: [Q.jsx(Uk, {
			id: "equalizer-shade",
			onClick: x
		}), Q.jsx(Uk, {
			id: "equalizer-close",
			onClick: () => _(Mh)
		})]
	}, m ? "selected" : "unselected");
}
var YS = () => {
	let m = mk(Xf), _ = mk($f), x = fk(_E), S = [
		"left",
		"center",
		"right"
	], C = em(0, 100, m, S), D = em(-100, 100, _, S);
	return Q.jsxs("div", {
		className: "draggable",
		onDoubleClick: x,
		style: {
			width: "100%",
			height: "100%"
		},
		children: [
			Q.jsx(PS, {}),
			Q.jsx(uS, {
				id: "equalizer-volume",
				className: C
			}),
			Q.jsx(Fy, {
				id: "equalizer-balance",
				className: D
			})
		]
	});
}, HS = () => {
	let m = mk(Gf), _ = mk(Ff), x = mk(u_), S = _ === Mh, C = x(Mh), D = fk(_w), O = fk(jw), F = fk(Hw), I = fk(Yw), L = fk(Kw), H = fk(_E), U = ov({
		selected: S,
		doubled: m,
		shade: C,
		window: !0,
		draggable: !0
	}), [W, q] = $.useState(!1);
	return Q.jsx("div", {
		id: "equalizer-window",
		className: U,
		children: Q.jsx(Sk, {
			windowId: Mh,
			children: C ? Q.jsx(YS, {}) : Q.jsxs("div", { children: [
				Q.jsx("div", {
					className: "equalizer-top title-bar draggable",
					onDoubleClick: H,
					children: Q.jsx(PS, {})
				}),
				Q.jsx(VS, {}),
				Q.jsx(oy, {}),
				Q.jsx(GS, {}),
				Q.jsx(KS, {}),
				Q.jsx(OS, {
					id: "preamp",
					band: "preamp",
					onChange: D
				}),
				Q.jsx("div", {
					id: "plus12db",
					onClick: I
				}),
				Q.jsx("div", {
					id: "zerodb",
					onClick: F
				}),
				Q.jsx("div", {
					id: "minus12db",
					onClick: O
				}),
				Q.jsx("div", {
					onPointerDown: (m) => {
						m.stopPropagation(), m.target.releasePointerCapture(m.pointerId), q(!0), document.addEventListener("pointerup", function A(m) {
							m.detail === 0 && (q(!1), document.removeEventListener("pointerup", A));
						});
					},
					children: Oh.map((m) => {
						return Q.jsx(OS, {
							id: (_ = m, `band-${_}`),
							band: m,
							onChange: (_) => L(m, _),
							clickOriginatedInEq: W
						}, m);
						var _;
					})
				})
			] })
		})
	});
}, cy = {
	MAIN_BALANCE_BACKGROUND: ["#balance"],
	MAIN_BALANCE_THUMB: ["#balance::-webkit-slider-thumb", "#balance::-moz-range-thumb"],
	MAIN_BALANCE_THUMB_ACTIVE: ["#balance:active::-webkit-slider-thumb", "#balance:active::-moz-range-thumb"],
	MAIN_PREVIOUS_BUTTON: [".actions #previous"],
	MAIN_PREVIOUS_BUTTON_ACTIVE: [".actions #previous.winamp-active"],
	MAIN_PLAY_BUTTON: [".actions #play"],
	MAIN_PLAY_BUTTON_ACTIVE: [".actions #play.winamp-active"],
	MAIN_PAUSE_BUTTON: [".actions #pause"],
	MAIN_PAUSE_BUTTON_ACTIVE: [".actions #pause.winamp-active"],
	MAIN_STOP_BUTTON: [".actions #stop"],
	MAIN_STOP_BUTTON_ACTIVE: [".actions #stop.winamp-active"],
	MAIN_NEXT_BUTTON: [".actions #next"],
	MAIN_NEXT_BUTTON_ACTIVE: [".actions #next.winamp-active"],
	MAIN_EJECT_BUTTON: ["#eject"],
	MAIN_EJECT_BUTTON_ACTIVE: ["#eject.winamp-active"],
	MAIN_WINDOW_BACKGROUND: ["#main-window"],
	MAIN_STEREO: [".media-info #stereo", ".stop .media-info #stereo.selected"],
	MAIN_STEREO_SELECTED: [".media-info #stereo.selected"],
	MAIN_MONO: [".media-info #mono", ".stop .media-info #mono.selected"],
	MAIN_MONO_SELECTED: [".media-info #mono.selected"],
	NO_MINUS_SIGN: ["#time #minus-sign"],
	MINUS_SIGN: ["#time.countdown #minus-sign"],
	DIGIT_0: [".digit-0"],
	DIGIT_1: [".digit-1"],
	DIGIT_2: [".digit-2"],
	DIGIT_3: [".digit-3"],
	DIGIT_4: [".digit-4"],
	DIGIT_5: [".digit-5"],
	DIGIT_6: [".digit-6"],
	DIGIT_7: [".digit-7"],
	DIGIT_8: [".digit-8"],
	DIGIT_9: [".digit-9"],
	NO_MINUS_SIGN_EX: ["#time #minus-sign"],
	MINUS_SIGN_EX: ["#time.countdown #minus-sign"],
	DIGIT_0_EX: [".digit-0"],
	DIGIT_1_EX: [".digit-1"],
	DIGIT_2_EX: [".digit-2"],
	DIGIT_3_EX: [".digit-3"],
	DIGIT_4_EX: [".digit-4"],
	DIGIT_5_EX: [".digit-5"],
	DIGIT_6_EX: [".digit-6"],
	DIGIT_7_EX: [".digit-7"],
	DIGIT_8_EX: [".digit-8"],
	DIGIT_9_EX: [".digit-9"],
	MAIN_PLAYING_INDICATOR: [".play #play-pause"],
	MAIN_PAUSED_INDICATOR: [".pause #play-pause"],
	MAIN_STOPPED_INDICATOR: [".stop #play-pause"],
	MAIN_NOT_WORKING_INDICATOR: ["#work-indicator"],
	MAIN_WORKING_INDICATOR: ["#work-indicator.selected"],
	PLAYLIST_TOP_TILE: [
		".playlist-top-left-fill",
		".playlist-top-left-spacer",
		".playlist-top-right-fill",
		".playlist-top-right-spacer"
	],
	PLAYLIST_TOP_LEFT_CORNER: [".playlist-top-left"],
	PLAYLIST_TITLE_BAR: [".playlist-top-title"],
	PLAYLIST_TOP_RIGHT_CORNER: [".playlist-top-right"],
	PLAYLIST_TOP_TILE_SELECTED: [
		".selected .playlist-top-left-fill",
		".selected .playlist-top-left-spacer",
		".selected .playlist-top-right-fill",
		".selected .playlist-top-right-spacer"
	],
	PLAYLIST_TOP_LEFT_SELECTED: [".selected .playlist-top-left"],
	PLAYLIST_TITLE_BAR_SELECTED: [".selected .playlist-top-title"],
	PLAYLIST_TOP_RIGHT_CORNER_SELECTED: [".selected .playlist-top-right"],
	PLAYLIST_LEFT_TILE: [".playlist-middle-left"],
	PLAYLIST_RIGHT_TILE: [".playlist-middle-right"],
	PLAYLIST_SCROLL_HANDLE: [".playlist-scrollbar-handle"],
	PLAYLIST_SCROLL_HANDLE_SELECTED: [".playlist-middle-right.winamp-active .playlist-scrollbar-handle"],
	PLAYLIST_BOTTOM_TILE: [".playlist-bottom"],
	PLAYLIST_BOTTOM_LEFT_CORNER: [".playlist-bottom-left"],
	PLAYLIST_BOTTOM_RIGHT_CORNER: [".playlist-bottom-right"],
	PLAYLIST_VISUALIZER_BACKGROUND: [".playlist-visualizer"],
	PLAYLIST_SHADE_BACKGROUND: ["#playlist-window-shade"],
	PLAYLIST_SHADE_BACKGROUND_LEFT: ["#playlist-window-shade .left"],
	PLAYLIST_SHADE_BACKGROUND_RIGHT: ["#playlist-window-shade .right"],
	PLAYLIST_SHADE_BACKGROUND_RIGHT_SELECTED: ["#playlist-window-shade.selected .right"],
	PLAYLIST_ADD_MENU_BAR: ["#playlist-add-menu.selected .bar"],
	PLAYLIST_ADD_URL: ["#playlist-add-menu .add-url"],
	PLAYLIST_ADD_URL_SELECTED: ["#playlist-add-menu .hover .add-url"],
	PLAYLIST_ADD_DIR: ["#playlist-add-menu .add-dir"],
	PLAYLIST_ADD_DIR_SELECTED: ["#playlist-add-menu .hover .add-dir"],
	PLAYLIST_ADD_FILE: ["#playlist-add-menu .add-file"],
	PLAYLIST_ADD_FILE_SELECTED: ["#playlist-add-menu .hover .add-file"],
	PLAYLIST_REMOVE_MENU_BAR: ["#playlist-remove-menu.selected .bar"],
	PLAYLIST_REMOVE_ALL: ["#playlist-remove-menu .remove-all"],
	PLAYLIST_REMOVE_ALL_SELECTED: ["#playlist-remove-menu .hover .remove-all"],
	PLAYLIST_CROP: ["#playlist-remove-menu .crop"],
	PLAYLIST_CROP_SELECTED: ["#playlist-remove-menu .hover .crop"],
	PLAYLIST_REMOVE_SELECTED: ["#playlist-remove-menu .remove-selected"],
	PLAYLIST_REMOVE_SELECTED_SELECTED: ["#playlist-remove-menu .hover .remove-selected"],
	PLAYLIST_REMOVE_MISC: ["#playlist-remove-menu .remove-misc"],
	PLAYLIST_REMOVE_MISC_SELECTED: ["#playlist-remove-menu .hover .remove-misc"],
	PLAYLIST_SELECT_MENU_BAR: ["#playlist-selection-menu.selected .bar"],
	PLAYLIST_INVERT_SELECTION: ["#playlist-selection-menu .invert-selection"],
	PLAYLIST_INVERT_SELECTION_SELECTED: ["#playlist-selection-menu .hover .invert-selection"],
	PLAYLIST_SELECT_ZERO: ["#playlist-selection-menu .select-zero"],
	PLAYLIST_SELECT_ZERO_SELECTED: ["#playlist-selection-menu .hover .select-zero"],
	PLAYLIST_SELECT_ALL: ["#playlist-selection-menu .select-all"],
	PLAYLIST_SELECT_ALL_SELECTED: ["#playlist-selection-menu .hover .select-all"],
	PLAYLIST_CLOSE_SELECTED: ["#playlist-close-button.winamp-active"],
	PLAYLIST_COLLAPSE_SELECTED: ["#playlist-window #playlist-shade-button.winamp-active"],
	PLAYLIST_EXPAND_SELECTED: ["#playlist-window-shade #playlist-shade-button.winamp-active"],
	PLAYLIST_MISC_MENU_BAR: ["#playlist-misc-menu.selected .bar"],
	PLAYLIST_MISC_OPTIONS: ["#playlist-misc-menu .misc-options"],
	PLAYLIST_MISC_OPTIONS_SELECTED: ["#playlist-misc-menu .hover .misc-options"],
	PLAYLIST_FILE_INFO: ["#playlist-misc-menu .file-info"],
	PLAYLIST_FILE_INFO_SELECTED: ["#playlist-misc-menu .hover .file-info"],
	PLAYLIST_SORT_LIST: ["#playlist-misc-menu .sort-list"],
	PLAYLIST_SORT_LIST_SELECTED: ["#playlist-misc-menu .hover .sort-list"],
	PLAYLIST_LIST_BAR: ["#playlist-list-menu.selected .bar"],
	PLAYLIST_NEW_LIST: ["#playlist-list-menu .new-list"],
	PLAYLIST_NEW_LIST_SELECTED: ["#playlist-list-menu .hover .new-list"],
	PLAYLIST_LOAD_LIST: ["#playlist-list-menu .load-list"],
	PLAYLIST_LOAD_LIST_SELECTED: ["#playlist-list-menu .hover .load-list"],
	PLAYLIST_SAVE_LIST: ["#playlist-list-menu .save-list"],
	PLAYLIST_SAVE_LIST_SELECTED: ["#playlist-list-menu .hover .save-list"],
	EQ_WINDOW_BACKGROUND: ["#equalizer-window:not(.shade)"],
	EQ_TITLE_BAR: [".equalizer-top"],
	EQ_TITLE_BAR_SELECTED: [".selected .equalizer-top"],
	EQ_SLIDER_BACKGROUND: [".band"],
	EQ_SLIDER_THUMB: [".band .slider-handle"],
	EQ_SLIDER_THUMB_SELECTED: [".band.winamp-active .slider-handle"],
	EQ_ON_BUTTON: ["#on"],
	EQ_ON_BUTTON_DEPRESSED: ["#on.winamp-active"],
	EQ_ON_BUTTON_SELECTED: ["#on.selected"],
	EQ_ON_BUTTON_SELECTED_DEPRESSED: ["#on.selected.winamp-active"],
	EQ_AUTO_BUTTON: ["#auto"],
	EQ_AUTO_BUTTON_DEPRESSED: ["#auto.winamp-active"],
	EQ_AUTO_BUTTON_SELECTED: ["#auto.selected"],
	EQ_AUTO_BUTTON_SELECTED_DEPRESSED: ["#auto.selected.winamp-active"],
	EQ_GRAPH_BACKGROUND: ["#eqGraph"],
	EQ_PRESETS_BUTTON: ["#presets"],
	EQ_PRESETS_BUTTON_SELECTED: ["#presets.winamp-active"],
	EQ_PREAMP_LINE: ["#preamp-line"],
	EQ_SHADE_BACKGROUND: ["#equalizer-window.shade"],
	EQ_SHADE_BACKGROUND_SELECTED: ["#equalizer-window.shade.selected"],
	EQ_SHADE_VOLUME_SLIDER_LEFT: ["#equalizer-volume.left::-webkit-slider-thumb", "#equalizer-volume.left::-moz-range-thumb"],
	EQ_SHADE_VOLUME_SLIDER_CENTER: ["#equalizer-volume.center::-webkit-slider-thumb", "#equalizer-volume.center::-moz-range-thumb"],
	EQ_SHADE_VOLUME_SLIDER_RIGHT: ["#equalizer-volume.right::-webkit-slider-thumb", "#equalizer-volume.right::-moz-range-thumb"],
	EQ_SHADE_BALANCE_SLIDER_LEFT: ["#equalizer-balance.left::-webkit-slider-thumb", "#equalizer-balance.left::-moz-range-thumb"],
	EQ_SHADE_BALANCE_SLIDER_CENTER: ["#equalizer-balance.center::-webkit-slider-thumb", "#equalizer-balance.center::-moz-range-thumb"],
	EQ_SHADE_BALANCE_SLIDER_RIGHT: ["#equalizer-balance.right::-webkit-slider-thumb", "#equalizer-balance.right::-moz-range-thumb"],
	EQ_MAXIMIZE_BUTTON_ACTIVE: ["#equalizer-shade.winamp-active"],
	EQ_MINIMIZE_BUTTON_ACTIVE: ["#equalizer-window.shade #equalizer-shade.winamp-active"],
	EQ_CLOSE_BUTTON: ["#equalizer-window.selected #eq-buttons.clicked #equalizer-close"],
	EQ_CLOSE_BUTTON_ACTIVE: ["#equalizer-window.selected #eq-buttons.clicked #equalizer-close.winamp-active"],
	EQ_SHADE_CLOSE_BUTTON: ["#equalizer-window.shade.selected #eq-buttons.clicked #equalizer-close"],
	EQ_SHADE_CLOSE_BUTTON_ACTIVE: ["#equalizer-window.shade.selected #eq-buttons.clicked #equalizer-close.winamp-active"],
	MAIN_POSITION_SLIDER_BACKGROUND: ["#position"],
	MAIN_POSITION_SLIDER_THUMB: ["#position::-webkit-slider-thumb", "#position::-moz-range-thumb"],
	MAIN_POSITION_SLIDER_THUMB_SELECTED: ["#position:active::-webkit-slider-thumb", "#position:active::-moz-range-thumb"],
	MAIN_SHUFFLE_BUTTON: ["#shuffle"],
	MAIN_SHUFFLE_BUTTON_DEPRESSED: ["#shuffle.winamp-active"],
	MAIN_SHUFFLE_BUTTON_SELECTED: ["#shuffle.selected"],
	MAIN_SHUFFLE_BUTTON_SELECTED_DEPRESSED: ["#shuffle.selected.winamp-active"],
	MAIN_REPEAT_BUTTON: ["#repeat"],
	MAIN_REPEAT_BUTTON_DEPRESSED: ["#repeat.winamp-active"],
	MAIN_REPEAT_BUTTON_SELECTED: ["#repeat.selected"],
	MAIN_REPEAT_BUTTON_SELECTED_DEPRESSED: ["#repeat.selected.winamp-active"],
	MAIN_EQ_BUTTON: ["#equalizer-button"],
	MAIN_EQ_BUTTON_SELECTED: ["#equalizer-button.selected"],
	MAIN_EQ_BUTTON_DEPRESSED: ["#equalizer-button.winamp-active"],
	MAIN_EQ_BUTTON_DEPRESSED_SELECTED: ["#equalizer-button.selected.winamp-button"],
	MAIN_PLAYLIST_BUTTON: ["#playlist-button"],
	MAIN_PLAYLIST_BUTTON_SELECTED: ["#playlist-button.selected"],
	MAIN_PLAYLIST_BUTTON_DEPRESSED: ["#playlist-button.winamp-active"],
	MAIN_PLAYLIST_BUTTON_DEPRESSED_SELECTED: ["#playlist-button.selected.winamp-active"],
	MAIN_TITLE_BAR: ["#title-bar"],
	MAIN_TITLE_BAR_SELECTED: [".selected #title-bar"],
	MAIN_EASTER_EGG_TITLE_BAR: [".llama #title-bar"],
	MAIN_EASTER_EGG_TITLE_BAR_SELECTED: [".llama.selected #title-bar"],
	MAIN_OPTIONS_BUTTON: [".selected #title-bar #option.clicked"],
	MAIN_OPTIONS_BUTTON_DEPRESSED: [".selected #title-bar #option:active", ".selected #title-bar #option.selected"],
	MAIN_MINIMIZE_BUTTON: [".selected #title-bar #minimize.clicked"],
	MAIN_MINIMIZE_BUTTON_DEPRESSED: [".selected #title-bar #minimize.winamp-active"],
	MAIN_SHADE_BUTTON: [".selected #title-bar #shade.clicked"],
	MAIN_SHADE_BUTTON_DEPRESSED: [".selected #title-bar #shade.winamp-active"],
	MAIN_CLOSE_BUTTON: [".selected #title-bar #close.clicked"],
	MAIN_CLOSE_BUTTON_DEPRESSED: [".selected #title-bar #close.winamp-active"],
	MAIN_CLUTTER_BAR_BACKGROUND: ["#clutter-bar"],
	MAIN_CLUTTER_BAR_BACKGROUND_DISABLED: ["#clutter-bar.disabled"],
	MAIN_CLUTTER_BAR_BUTTON_O_SELECTED: ["#button-o:active", "#button-0.selected"],
	MAIN_CLUTTER_BAR_BUTTON_A_SELECTED: ["#button-a:active", "#button-a.selected"],
	MAIN_CLUTTER_BAR_BUTTON_I_SELECTED: ["#button-i:active", "#button-i.selected"],
	MAIN_CLUTTER_BAR_BUTTON_D_SELECTED: ["#button-d:active", "#button-d.selected"],
	MAIN_CLUTTER_BAR_BUTTON_V_SELECTED: ["#button-v:active", "#button-v.selected"],
	MAIN_SHADE_BACKGROUND: [".shade #title-bar"],
	MAIN_SHADE_BACKGROUND_SELECTED: [".shade.selected #title-bar"],
	MAIN_SHADE_BUTTON_SELECTED: [".shade.selected #title-bar #shade"],
	MAIN_SHADE_BUTTON_SELECTED_DEPRESSED: [".shade #title-bar #shade.winamp-active"],
	MAIN_SHADE_POSITION_BACKGROUND: [".shade #position"],
	MAIN_SHADE_POSITION_THUMB: [".shade #position::-moz-range-thumb", ".shade #position::-webkit-slider-thumb"],
	MAIN_SHADE_POSITION_THUMB_LEFT: [".shade #position.left::-moz-range-thumb", ".shade #position.left::-webkit-slider-thumb"],
	MAIN_SHADE_POSITION_THUMB_RIGHT: [".shade #position.right::-moz-range-thumb", ".shade #position.right::-webkit-slider-thumb"],
	MAIN_VOLUME_BACKGROUND: ["#volume"],
	MAIN_VOLUME_THUMB: ["#volume input::-webkit-slider-thumb", "#volume input::-moz-range-thumb"],
	MAIN_VOLUME_THUMB_SELECTED: ["#volume input:active::-webkit-slider-thumb", "#volume input:active::-moz-range-thumb"],
	GEN_TOP_CENTER_FILL: [".gen-window .gen-top"],
	GEN_TOP_LEFT: [".gen-window .gen-top-left"],
	GEN_TOP_LEFT_END: [".gen-window .gen-top-left-end"],
	GEN_TOP_RIGHT: [".gen-window .gen-top-right"],
	GEN_TOP_RIGHT_END: [".gen-window .gen-top-right-end"],
	GEN_TOP_LEFT_RIGHT_FILL: [".gen-window .gen-top-left-fill", ".gen-window .gen-top-right-fill"],
	GEN_TOP_CENTER_FILL_SELECTED: [".gen-window.selected .gen-top"],
	GEN_TOP_LEFT_SELECTED: [".gen-window.selected .gen-top-left"],
	GEN_TOP_LEFT_END_SELECTED: [".gen-window.selected .gen-top-left-end"],
	GEN_TOP_RIGHT_SELECTED: [".gen-window.selected .gen-top-right"],
	GEN_TOP_RIGHT_END_SELECTED: [".gen-window.selected .gen-top-right-end"],
	GEN_TOP_LEFT_RIGHT_FILL_SELECTED: [".gen-window.selected .gen-top-left-fill", ".gen-window.selected .gen-top-right-fill"],
	GEN_BOTTOM_LEFT: [".gen-window .gen-bottom-left"],
	GEN_BOTTOM_RIGHT: [".gen-window .gen-bottom-right"],
	GEN_BOTTOM_FILL: [".gen-window .gen-bottom"],
	GEN_MIDDLE_LEFT: [".gen-window .gen-middle-left"],
	GEN_MIDDLE_LEFT_BOTTOM: [".gen-window .gen-middle-left-bottom"],
	GEN_MIDDLE_RIGHT: [".gen-window .gen-middle-right"],
	GEN_MIDDLE_RIGHT_BOTTOM: [".gen-window .gen-middle-right-bottom"],
	GEN_CLOSE_SELECTED: [".gen-window .gen-close.winamp-active"]
};
Object.keys(G_).forEach((m) => {
	let _ = lw(m);
	cy[_] = [`.character-${m.charCodeAt(0)}`];
}), Vh.forEach((m) => {
	cy[`GEN_TEXT_${m}`] = [`.gen-text-${m.toLowerCase()}`], cy[`GEN_TEXT_SELECTED_${m}`] = [`.gen-window.selected .gen-text-${m.toLowerCase()}`];
});
var ly = {
	CLOSE: ["#title-bar #close"],
	EQSLID: ["#equalizer-window .band"],
	EQNORMAL: ["#equalizer-window"],
	EQCLOSE: ["#equalizer-window #equalizer-close"],
	EQTITLE: [
		"#equalizer-window .title-bar",
		"#equalizer-window.shade",
		"#equalizer-window.shade input"
	],
	MAINMENU: ["#main-window #option", "#webamp-context-menu .context-menu"],
	MIN: ["#main-window #minimize"],
	NORMAL: [
		".window",
		".window input",
		"#main-window",
		"#main-window.shade #title-bar"
	],
	MMENU: ["#main-window.shade #option"],
	PNORMAL: ["#playlist-window"],
	PTBAR: ["#playlist-window .playlist-top"],
	PCLOSE: ["#playlist-window #playlist-close-button", "#playlist-window-shade #playlist-close-button"],
	PWINBUT: ["#playlist-window #playlist-shade-button", "#playlist-window-shade #playlist-shade-button"],
	POSBAR: ["#main-window #position"],
	PSIZE: ["#playlist-window #playlist-resize-target"],
	PWSSIZE: ["#playlist-window-shade #playlist-resize-target"],
	PWSNORM: ["#playlist-window-shade"],
	PVSCROLL: ["#playlist-window .playlist-scrollbar"],
	SONGNAME: ["#main-window #marquee"],
	TITLEBAR: ["#main-window #title-bar"],
	VOLBAL: [
		"#volume",
		"#volume input",
		"#balance"
	],
	WINBUT: ["#main-window #shade"],
	WSNORMAL: ["#main-window.shade #title-bar"],
	WSPOSBAR: ["#main-window.shade #position"]
};
function JS({ children: m, id: _ }) {
	let x = $.useMemo(() => {
		let m = document.createElement("style");
		return m.type = "text/css", _ != null && (m.id = _), m;
	}, [_]);
	return $.useLayoutEffect(() => (document.head.appendChild(x), () => x.remove()), [x]), Dt.createPortal(m, x);
}
function qS({ children: m }) {
	let _ = $.useMemo(() => document.createElement("div"), []);
	return $.useLayoutEffect(() => (document.body.appendChild(_), () => _.remove()), [_]), Dt.createPortal(Q.jsx("svg", {
		height: 0,
		width: 0,
		children: Q.jsx("defs", { children: Object.keys(m).map((_) => Q.jsx("clipPath", {
			id: _,
			children: m[_].map((m, _) => Q.jsx("polygon", { points: m }, _))
		}, _)) })
	}), _);
}
function WS(m, _, x = 0, S = m.length) {
	if (S % _) throw Error("Bad buffer length.");
	for (let C = x; C < S; C += _) ZS(m, _, C);
}
function ZS(m, _, x) {
	_--;
	for (let S = 0; S < _; S++) {
		let C = m[x + S];
		m[x + S] = m[x + _], m[x + _] = C, _--;
	}
}
var XS = class {
	constructor(m, _ = !1, x = !1) {
		this.bits = m, this.bytes = m < 8 ? 1 : Math.ceil(m / 8), this.max = 2 ** m - 1, this.min = 0;
		let S = 8 - (1 + (m - 1 | 7) - m);
		this.lastByteMask_ = 2 ** (S > 0 ? S : 8) - 1, this.unpack = this.unpackUnsigned_, _ && (this.max = 2 ** m / 2 - 1, this.min = -this.max - 1, this.unpack = this.unpackSigned_), x && (this.overflow_ = this.overflowClamp_);
	}
	pack(m, _, x = 0) {
		if (_ != _ || _.constructor != Number) throw TypeError();
		_ = this.overflow_(_), m[x] = 255 & (_ < 0 ? _ + 2 ** this.bits : _), x++;
		for (let S = 2, C = this.bytes; S < C; S++) m[x] = 255 & Math.floor(_ / 2 ** (8 * (S - 1))), x++;
		return this.bits > 8 && (m[x] = Math.floor(_ / 2 ** (8 * (this.bytes - 1))) & this.lastByteMask_, x++), x;
	}
	unpack_(m, _ = 0) {
		let x = 0;
		for (let S = 0; S < this.bytes; S++) x += m[_ + S] * 256 ** S;
		return x;
	}
	unpackUnsigned_(m, _ = 0) {
		return this.overflow_(this.unpack_(m, _));
	}
	unpackSigned_(m, _ = 0) {
		return this.overflow_(this.sign_(this.unpack_(m, _)));
	}
	overflow_(m) {
		if (m > this.max || m < this.min) throw RangeError();
		return m;
	}
	overflowClamp_(m) {
		return m > this.max ? this.max : m < this.min ? this.min : m;
	}
	sign_(m) {
		return m > this.max && (m -= 2 * this.max + 2), m;
	}
}, $S = class {
	constructor(m, _) {
		this.ebits = m, this.fbits = _, this.bias = (1 << m - 1) - 1, this.numBytes = Math.ceil((m + _) / 8), this.biasP2 = 2 ** (this.bias + 1), this.ebitsFbits = m + _, this.fbias = 2 ** -(8 * this.numBytes - 1 - m);
	}
	pack(m, _, x) {
		if (typeof _ != "number") throw TypeError();
		Math.abs(_) > this.biasP2 - 2 * this.ebitsFbits && (_ = _ < 0 ? -1 / 0 : 1 / 0);
		let S = +(((_ = +_) || 1 / _) < 0 || _ < 0);
		_ = Math.abs(_);
		let C = Math.min(Math.floor(Math.log(_) / Math.LN2), 1023), D = AI(_ / 2 ** C * 2 ** this.fbits);
		return _ == _ ? _ !== 0 && (_ >= 2 ** (1 - this.bias) ? (D / 2 ** this.fbits >= 2 && (C += 1, D = 1), C > this.bias ? (C = (1 << this.ebits) - 1, D = 0) : (C += this.bias, D = AI(D) - 2 ** this.fbits)) : (D = AI(_ / 2 ** (1 - this.bias - this.fbits)), C = 0)) : (D = 2 ** (this.fbits - 1), C = (1 << this.ebits) - 1), this.packFloatBits_(m, x, S, C, D);
	}
	unpack(m, _) {
		let x, S = (1 << this.ebits) - 1, C = "";
		for (let x = this.numBytes - 1; x >= 0; x--) {
			let S = m[x + _].toString(2);
			C += "00000000".substring(S.length) + S;
		}
		let D = C.charAt(0) == "1" ? -1 : 1;
		C = C.substring(1);
		let O = parseInt(C.substring(0, this.ebits), 2);
		return C = C.substring(this.ebits), O == S ? parseInt(C, 2) === 0 ? 1 / 0 * D : NaN : (O === 0 ? (O += 1, x = parseInt(C, 2)) : x = parseInt("1" + C, 2), D * x * this.fbias * 2 ** (O - this.bias));
	}
	packFloatBits_(m, _, x, S, C) {
		let D = [];
		D.push(x);
		for (let m = this.ebits; m > 0; --m) D[m] = S % 2 ? 1 : 0, S = Math.floor(S / 2);
		let O = D.length;
		for (let m = this.fbits; m > 0; --m) D[O + m] = C % 2 ? 1 : 0, C = Math.floor(C / 2);
		let F = D.join(""), I = this.numBytes + _ - 1, L = _;
		for (; I >= _;) m[I] = parseInt(F.substring(0, 8), 2), F = F.substring(8), I--, L++;
		return L;
	}
};
function AI(m) {
	let _ = Math.floor(m), x = m - _;
	return x < .5 ? _ : x > .5 || _ % 2 ? _ + 1 : _;
}
function eI(m, _ = 0, x = m.length) {
	return function(m, _ = 0, x = m.length) {
		let S = "";
		for (let C = _; C < x;) {
			let _ = 128, x = 191, D = !1, O = m[C++];
			if (O >= 0 && O <= 127) S += String.fromCharCode(O);
			else {
				let F = 0;
				O >= 194 && O <= 223 ? F = 1 : O >= 224 && O <= 239 ? (F = 2, m[C] === 224 && (_ = 160), m[C] === 237 && (x = 159)) : O >= 240 && O <= 244 ? (F = 3, m[C] === 240 && (_ = 144), m[C] === 244 && (x = 143)) : D = !0, O &= (1 << 8 - F - 1) - 1;
				for (let S = 0; S < F; S++) (m[C] < _ || m[C] > x) && (D = !0), O = O << 6 | 63 & m[C], C++;
				D ? S += "�" : O <= 65535 ? S += String.fromCharCode(O) : (O -= 65536, S += String.fromCharCode(55296 + (O >> 10 & 1023), 56320 + (1023 & O)));
			}
		}
		return S;
	}(m, _, x);
}
function tI(m, _, x = 0, S = m.length, C = !1, D = !1) {
	let O = [];
	return function(m, _, x, S = 0, C = m.length, D = !1, O = !1) {
		let F = function(m, _, x, S) {
			return _ ? function(m) {
				if (!m || m !== 16 && m !== 32 && m !== 64) throw Error(uy + ": float, bits: " + m);
			}(m) : function(m) {
				if (!m || m < 1 || m > 53) throw Error(uy + ": int, bits: " + m);
			}(m), _ && m === 16 ? new $S(5, 11) : _ && m == 32 ? new $S(8, 23) : _ && m == 64 ? new $S(11, 52) : new XS(m, x, S);
		}((_ ||= {}).bits, _.fp, _.signed, O), I = Math.ceil(_.bits / 8);
		C = function(m, _, x, S, C) {
			let D = (x - _) % S;
			if (C && (D || m.length < S)) throw Error("Bad buffer length");
			return x - D;
		}(m, S, C, I, D);
		let L = 0, H = S;
		try {
			for (_.be && WS(m, I, S, C); H < C; H += I, L++) x[L] = F.unpack(m, H);
			_.be && WS(m, I, S, C);
		} catch (_) {
			(function(m, _, x) {
				throw m.message = m.constructor.name + " at index " + x + ": " + _, m;
			})(_, m.slice(H, H + I), H);
		}
	}(m, _, O, x, S, C, D), O;
}
function nI(m, _, x = 0, S = !1) {
	return tI(m, _, x, x + Math.ceil(_.bits / 8), !0, S)[0];
}
var uy = "Unsupported type", iI = class {
	constructor() {
		this.container = "", this.chunkSize = 0, this.format = "", this.signature = null, this.head = 0, this.uInt32 = {
			bits: 32,
			be: !1,
			signed: !1,
			fp: !1
		}, this.supported_containers = ["RIFF", "RIFX"];
	}
	setSignature(m) {
		if (this.head = 0, this.container = this.readString(m, 4), this.supported_containers.indexOf(this.container) === -1) throw Error("Not a supported format.");
		this.uInt32.be = this.container === "RIFX", this.chunkSize = this.readUInt32(m), this.format = this.readString(m, 4), this.signature = {
			chunkId: this.container,
			chunkSize: this.chunkSize,
			format: this.format,
			subChunks: this.getSubChunksIndex_(m),
			chunkData: {
				start: 0,
				end: this.chunkSize
			}
		};
	}
	findChunk(m, _ = !1) {
		let x = this.signature.subChunks, S = [];
		for (let C = 0; C < x.length; C++) if (x[C].chunkId == m) {
			if (!_) return x[C];
			S.push(x[C]);
		}
		return m == "LIST" && S.length ? S : null;
	}
	readString(m, _) {
		let x = "";
		return x = eI(m, this.head, this.head + _), this.head += _, x;
	}
	readUInt32(m) {
		let _ = nI(m, this.uInt32, this.head);
		return this.head += 4, _;
	}
	getSubChunksIndex_(m) {
		let _ = [], x = this.head;
		for (; x <= m.length - 8;) _.push(this.getSubChunkIndex_(m, x)), x += 8 + _[_.length - 1].chunkSize, x = x % 2 ? x + 1 : x;
		return _;
	}
	getSubChunkIndex_(m, _) {
		let x = {
			chunkId: this.getChunkId_(m, _),
			chunkSize: this.getChunkSize_(m, _)
		};
		if (x.chunkId == "LIST") x.format = eI(m, _ + 8, _ + 12), this.head += 4, x.subChunks = this.getSubChunksIndex_(m);
		else {
			let m = x.chunkSize % 2 ? x.chunkSize + 1 : x.chunkSize;
			this.head = _ + 8 + m, x.chunkData = {
				start: _ + 8,
				end: this.head
			};
		}
		return x;
	}
	getChunkId_(m, _) {
		return this.head += 4, eI(m, _, _ + 4);
	}
	getChunkSize_(m, _) {
		return this.head += 4, nI(m, this.uInt32, _ + 4);
	}
}, dy = {
	bits: 32,
	be: !1,
	signed: !1,
	fp: !1
}, fy = 1e3 / 60, py = 0, sI = () => py++, yy = "#webamp", by = {
	normal: "mainWindowClipPath",
	windowshade: "shadeMainWindowClipPath",
	equalizer: "equalizerWindowClipPath",
	equalizerws: "shadeEqualizerWindowClipPath"
}, Sy = {
	normal: "#main-window:not(.shade)",
	windowshade: "#main-window.shade",
	equalizer: "#equalizer-window:not(.shade)",
	equalizerws: "#equalizer-window.shade"
}, Cy = {
	MAIN_BALANCE_BACKGROUND: "MAIN_VOLUME_BACKGROUND",
	MAIN_BALANCE_THUMB: "MAIN_VOLUME_THUMB",
	MAIN_BALANCE_THUMB_ACTIVE: "MAIN_VOLUME_THUMB_SELECTED",
	EQ_MAXIMIZE_BUTTON_ACTIVE: "EQ_MAXIMIZE_BUTTON_ACTIVE_FALLBACK"
};
function pI(m) {
	return `${m.startsWith("#webamp-context-menu") ? "" : yy} ${m}`;
}
var wy = Og(function(m) {
	return m.display.skinImages;
}, function(m) {
	return m.display.skinCursors;
}, function(m) {
	return m.display.skinGenLetterWidths;
}, CE, (m, _, x, S) => {
	if (!m || !_) return null;
	let C = [];
	Object.keys(cy).forEach((_) => {
		let x = m[_] || m[Cy[_]];
		x && cy[_].forEach((m) => {
			let _ = m;
			C.push(`${yy} ${_} {background-image: url(${x})}`);
		});
	}), x != null && Vh.forEach((m) => {
		let _ = x[`GEN_TEXT_${m}`], S = x[`GEN_TEXT_SELECTED_${m}`];
		C.push(`${yy} .gen-text-${m.toLowerCase()} {width: ${_}px;}`), C.push(`${yy} .selected .gen-text-${m.toLowerCase()} {width: ${S}px;}`);
	}), Object.entries(ly).forEach(([m, x]) => {
		let S = _[m];
		if (S == null) return;
		let D = x.map(pI).map((m) => {
			switch (S.type) {
				case "cur": return `${m} {cursor: url(${S.url}), auto}`;
				case "ani": try {
					return function(m, _) {
						let x = function(m) {
							let _ = function(m) {
								let _ = new iI();
								_.setSignature(m);
								let x = _.signature;
								if (x.format !== "ACON") throw Error(`Expected format. Expected "ACON", got "${x.format}"`);
								function n(m, x) {
									let S = _.findChunk(m);
									return S == null ? null : x(S);
								}
								function a(_, x) {
									return _.subChunks.slice(0, x).map((_) => {
										if (_.chunkId !== "icon") throw Error(`Unexpected chunk type in fram: ${_.chunkId}`);
										return m.slice(_.chunkData.start, _.chunkData.end);
									});
								}
								let S = n("anih", (_) => {
									let x = tI(m, dy, _.chunkData.start, _.chunkData.end);
									return {
										cbSize: x[0],
										nFrames: x[1],
										nSteps: x[2],
										iWidth: x[3],
										iHeight: x[4],
										iBitCount: x[5],
										nPlanes: x[6],
										iDispRate: x[7],
										bfAttributes: x[8]
									};
								});
								if (S == null) throw Error("Did not find anih");
								let C = n("rate", (_) => tI(m, dy, _.chunkData.start, _.chunkData.end)), D = n("seq ", (_) => tI(m, dy, _.chunkData.start, _.chunkData.end)), O = _.findChunk("LIST", !0), F = O?.find((m) => m.format === "fram");
								if (F == null) throw Error("Did not find fram LIST");
								let I = a(F, S.nFrames), L = null, H = null;
								return (O?.find((m) => m.format === "INFO"))?.subChunks.forEach((_) => {
									switch (_.chunkId) {
										case "INAM":
											L = eI(m, _.chunkData.start, _.chunkData.end);
											break;
										case "IART":
											H = eI(m, _.chunkData.start, _.chunkData.end);
											break;
										case "LIST": _.format === "fram" && (I = a(_, S.nFrames));
									}
								}), {
									images: I,
									rate: C,
									seq: D,
									metadata: S,
									artist: H,
									title: L
								};
							}(m), x = _.rate ?? _.images.map(() => _.metadata.iDispRate), S = x.reduce((m, _) => m + _, 0), C = _.images.map((m) => {
								return {
									url: (_ = m, `data:image/x-win-bitmap;base64,${x = _, window.btoa(Array.from(x).map((m) => String.fromCharCode(m)).join(""))}`),
									percents: []
								};
								var _, x;
							}), D = 0;
							return x.forEach((m, x) => {
								let O = _.seq ? _.seq[x] : x;
								C[O].percents.push(D / S * 100), D += m;
							}), {
								duration: S * fy,
								frames: C
							};
						}(_), S = `ani-cursor-${sI()}`;
						return `\n    @keyframes ${S} {\n        ${x.frames.map(({ url: m, percents: _ }) => `${_.map((m) => `${m}%`).join(", ")} { cursor: url(${m}), auto; }`).join("\n")}\n    }\n    ${m}:hover {\n        animation: ${S} ${x.duration}ms step-end infinite;\n    }\n   `;
					}(m, S.aniData);
				} catch {
					return null;
				}
				default: return null;
			}
		}).filter(Boolean);
		C.push(...D);
	}), ((m) => !!m.DIGIT_0_EX)(m) && C.push(`${yy} .webamp-status #time #minus-sign { top: 0px; left: -1px; width: 9px; height: 13px; }`);
	for (let [m, _] of Object.entries(S)) if (_) {
		let _ = Sy[m], x = by[m];
		C.push(`${yy} ${_} { clip-path: url(#${x}); }`);
	}
	return C.join("\n");
}), Ey = Og(CE, (m) => {
	let _ = {};
	for (let [x, S] of Object.entries(m)) S && (_[by[x]] = S);
	return _;
});
function fI() {
	let m = mk(wy), _ = mk(Ey);
	return m == null ? null : Q.jsxs(Q.Fragment, { children: [Q.jsx(JS, {
		id: "webamp-skin",
		children: m
	}), Q.jsx(qS, { children: _ })] });
}
function EI({ media: m, filePickers: _, onMount: x, parentDomNode: S }) {
	let C = mk(UE), D = mk(uf), O = mk(Kf), F = fk(tw), I = fk(ZE), [L] = $.useState(() => {
		let m = document.createElement("div");
		return m.id = "webamp", m.role = "application", m;
	});
	$.useLayoutEffect(() => {
		L.style.zIndex = String(O);
	}, [L, O]), $.useLayoutEffect(() => (S.appendChild(L), () => {
		S.removeChild(L);
	}), [L, S]), $.useEffect(() => {
		let A = () => {
			L != null && (L.style.right = "0", L.style.bottom = "0", L.style.overflow = "hidden", F(sm(), S), L.style.right = "auto", L.style.bottom = "auto", L.style.overflow = "visible");
		};
		return A(), window.addEventListener("resize", A), () => {
			window.removeEventListener("resize", A);
		};
	}, [
		S,
		F,
		L
	]), $.useEffect(() => {
		x?.();
	}, [x]);
	let H = $.useCallback(() => rm(D, (x, S) => {
		if (!x.open) return null;
		switch (S) {
			case kh: return Q.jsx(ry, {
				analyser: m.getAnalyser(),
				filePickers: _
			});
			case Mh: return Q.jsx(HS, {});
			case Ah: return Q.jsx(LS, { analyser: m.getAnalyser() });
			case Nh: return Q.jsx(_k, { analyser: m.getAnalyser() });
			default: throw Error(`Tried to render an unknown window: ${S}`);
		}
	}), [
		m,
		_,
		D
	]);
	return C ? null : At.createPortal(Q.jsxs($.StrictMode, { children: [Q.jsx(JS, { children: "#webamp #balance {background-image: url(data:image/png;base64,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)}\n#webamp #balance::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYvL0RKWmt7hJStvMTa5+opTTwbAAAAMUlEQVQI12NQFAQBIQaxNBBIZGALBYIQAyAtKiqKlwapM2RgcwEBQwZhYxAwZICaBwCdgQ6Jd297uQAAAABJRU5ErkJggg==)}\n#webamp #balance::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYvL0RKWmt7hJStvMTa5+opTTwbAAAAMUlEQVQI12NQFAQBIQaxNBBIZGALBYIQAyAtKiqKlwapM2RgcwEBQwZhYxAwZICaBwCdgQ6Jd297uQAAAABJRU5ErkJggg==)}\n#webamp #balance:active::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYZICovL0RKWmva5+r///+U4Y9MAAAAMUlEQVQI12MwFAQBYQbRUBAQZGBlAAIWBiQ6ISEBKw2SV4TTIi4gIMhgJKQopCgoDAB2aAh/NddRQgAAAABJRU5ErkJggg==)}\n#webamp #balance:active::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYZICovL0RKWmva5+r///+U4Y9MAAAAMUlEQVQI12MwFAQBYQbRUBAQZGBlAAIWBiQ6ISEBKw2SV4TTIi4gIMhgJKQopCgoDAB2aAh/NddRQgAAAABJRU5ErkJggg==)}\n#webamp .actions #previous {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAMAAACHObUhAAAASFBMVEUfHzEgHzIgIDMhITQiITMiITQiIjUjIzYjJDgkIzckIzgkJDklJTolJjsmJTsmJjtKWmtSY3N7hJSElKWXqLmttca9ztbv//8qmLzOAAAAcklEQVQY022QMQ7DMAwDj7KQvqD/f2UXD2YGN43cWAuNo0wI1JvNjE8SGzwiwf/Ywwr2k1M6HFMPwDgvvxnoU2DN6fl7xh7X/YJx4a/yte67FaPmV2O5pxi5ZN/Gt5+rI998DD/ridxiLAQiHBKEJYGaT1TOJE+BDpf2AAAAAElFTkSuQmCC)}\n#webamp .actions #previous.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASBAMAAABCyVggAAAAElBMVEUICBBKWmtSa3Nje4R7jJytvcYAUCbCAAAAS0lEQVQI12NgwA1MXKDACMhxDYWCEBAHJuOChcPAAsQwDmOIi4MoEocRieMgiMRhROYEInNckTkugcgcVzgnNASIwRxTZOcoIHwDAI4lI4lOrG7eAAAAAElFTkSuQmCC)}\n#webamp .actions #play {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAMAAACHObUhAAAARVBMVEUmJTsmJTwnJz0nKD4oJz4oKD8pKUAqKUEqKUIqKkMrK0QrLEQsK0MsK0QsK0ZKWmtSY3N7hJSElKWXqLmttca9ztbv//93JWkaAAAAcElEQVQY022QQQ7FIAhEHzJpL/Dvf8y/MBG70VZbYEPeAIGxH0nEX5QEB4L+xj26CnkMXus2QJv92hXXrETluHnT07MqrnV6UbSfcY6rY+N+/1KUUTBl9Nl/vtxow5+PRyKif+1xpZhmmIEZMxFh+AXgtiNLLYv6agAAAABJRU5ErkJggg==)}\n#webamp .actions #play.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASBAMAAABCyVggAAAAElBMVEUICBBKWmtSa3Nje4R7jJytvcYAUCbCAAAARUlEQVQI12NgwA1MXKDACMhxDYWCEBAHJuOChcOAzGFkQOYIMiBzwDw4B8RDcEKROKFIykKRDAhFMjoUbqkpsnMUEL4BAGRUIvLymjxCAAAAAElFTkSuQmCC)}\n#webamp .actions #pause {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAMAAACHObUhAAAARVBMVEUsLEUsLEYtLUctLkguLUguLkkvL0ovMEswL0swL0wwMEsxMU0xMU4xMk0yMU5KWmtSY3N7hJSElKWXqLmttca9ztbv//90IK75AAAAY0lEQVQYGW3BwQ3DQAwDwRVPsBtI/3UGfpCBDfiT00x9GPjbiI2dhvAnjsSsuV3AARdwAMHNo1kBmhVuEjMxEyOLkcRMzMRIze3kcfJyQyA8wqsaO2zSdtitogqqqEoJIgTLP/lyHlITiB2JAAAAAElFTkSuQmCC)}\n#webamp .actions #pause.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASBAMAAABCyVggAAAAElBMVEUICBBKWmtSa3Nje4R7jJytvcYAUCbCAAAAOUlEQVQI12NgwA1MXKDACMhxDYWCEBAHJuOCyXFgYAEyYBzBEBdGUdpzXENDXEJDwRxTZOcoIHwDAEquItl9JSARAAAAAElFTkSuQmCC)}\n#webamp .actions #stop {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAMAAACHObUhAAAAP1BMVEUyMU4yMk8zM1AzNFE0M1E0M1I0NFE0NFM1NVQ1NlQ2NVM2NVQ2NlVKWmtSY3N7hJSElKWXqLmttca9ztbv//8mgTHJAAAAXElEQVQYGW3BQQ7DMAwDwRUttPf+/6FFD2SBBLnYmqkPA38bcbBpCJs4ErPm8uPxAgLNrbmtcBGjiFHETIyWGFmMIkarubzZNAQIm8YOB7cdTqsooERWkEXJheoPfCIcRKB1vkQAAAAASUVORK5CYII=)}\n#webamp .actions #stop.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASBAMAAABCyVggAAAAElBMVEUICBBKWmtSa3Nje4R7jJytvcYAUCbCAAAAMklEQVQI12NgwA1MXKDACMhxDYWCEBAHJuOChQPWC+MwCgoKitKBA3YamGOK7BwFhG8A34IfFkPmwnYAAAAASUVORK5CYII=)}\n#webamp .actions #next {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASBAMAAABCyVggAAAALVBMVEUICBA2NlU2NlY3N1c4N1g4OFk4OFpKWmtSY3N7hJSElKWXqLmttca9ztbv//8TuYuxAAAAaUlEQVQI12M4AwenDjCcewcDJ4Ccu1BwZzkmp/zu3evld+9MB3Oqa+9e3wfnbEfm7K5F5mxH5uxD5rxF4uxDNuAtEufd3bv33kE4cFcDOWdWzoSC6QkMK8rhgIFB0MjY2NjFxSU0NJQBAK7vnSRnYMknAAAAAElFTkSuQmCC)}\n#webamp .actions #next.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAElBMVEUICBBKWmtSa3Nje4R7jJytvcYAUCbCAAAATElEQVQI12NgwAVMXCDAWYGBwTUUChyAbKi4CyabAcSAshlZXBxEYWwBJLYgCxJbAIktisQOQbBFkfSGINihLi6uoSC2KZIbFOCuBwDE5iIH3QcLbQAAAABJRU5ErkJggg==)}\n#webamp #eject {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAQBAMAAADgw5IVAAAAIVBMVEU4OFk4OFo5OVpKWmtSY3N7hJSElKWXqLmttca9ztbv//8Mnk1wAAAAVUlEQVQI12PogIM2hq5VMNDC0DUTCmYEQ9iWCPbkYgTbvNwSxp5cXl4MY5uXlwMlwOxZYBPh5sDNnGwMAlA2UHl5FYZ6uNuCGTpSQ6EgmEGISQkKmAB+iFckwoyJQwAAAABJRU5ErkJggg==)}\n#webamp #eject.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAQBAMAAADgw5IVAAAAElBMVEUICBBKWmtSa3Nje4R7jJytvcYAUCbCAAAATUlEQVQI12NgwAVMXCDAWYGBwTUUChyAbJAgCxBD2Q4CCDajIAuM7SAoKABjMwoKAiXAbIhJMPVgAGY7gO2EsoHKBUXR1ZsiqVeAuxIAu8seNVNafDwAAAAASUVORK5CYII=)}\n#webamp #main-window {background-image: url(data:image/png;base64,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)}\n#webamp .media-info #stereo {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAMCAMAAACpx0YDAAAAk1BMVEUlJTklJTolJjsmJTsmJjsnJz0nJz4oJz4oKD8pKUApKkEqKUEqKUIqKkEqKkIrK0MrK0QsK0QsLEUtLUYtLUguLUcuLUguLkcvL0U8PFNDQ1hJSWFQUGNaWm9lZXZpaXpvcH5wcX9xcYF3d4Z5eYh8e4x+fpCBgY+Dg5KKipaLi5mMi5mRkZ2bmqaioqypqbKqqrTexa8FAAAAvUlEQVQYGQXBQW4aURAFwOrPIJCjEY5Hytq73P9giCj2YBTy+7mqfkUTiURmtUiqRY8eJBJRFAGULIemEipBQySka0xQL+9Bz4FEwbBUj9PP+ffF22P1cXbc1+fnsv7br5ExRr9mz911M99Op+d2P1+22/yRitHttr9eUPP5cH+w/3ftQ4cFx9VX93a7nD+ObufVn/nbdSRqk4qWSCfERHS1USq6ggwkKTCMLBERpCuoVAQdYyAl4dASNJjKN1/Kh0LDHtt2AAAAAElFTkSuQmCC)}\n#webamp .stop .media-info #stereo.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAMCAMAAACpx0YDAAAAk1BMVEUlJTklJTolJjsmJTsmJjsnJz0nJz4oJz4oKD8pKUApKkEqKUEqKUIqKkEqKkIrK0MrK0QsK0QsLEUtLUYtLUguLUcuLUguLkcvL0U8PFNDQ1hJSWFQUGNaWm9lZXZpaXpvcH5wcX9xcYF3d4Z5eYh8e4x+fpCBgY+Dg5KKipaLi5mMi5mRkZ2bmqaioqypqbKqqrTexa8FAAAAvUlEQVQYGQXBQW4aURAFwOrPIJCjEY5Hytq73P9giCj2YBTy+7mqfkUTiURmtUiqRY8eJBJRFAGULIemEipBQySka0xQL+9Bz4FEwbBUj9PP+ffF22P1cXbc1+fnsv7br5ExRr9mz911M99Op+d2P1+22/yRitHttr9eUPP5cH+w/3ftQ4cFx9VX93a7nD+ObufVn/nbdSRqk4qWSCfERHS1USq6ggwkKTCMLBERpCuoVAQdYyAl4dASNJjKN1/Kh0LDHtt2AAAAAElFTkSuQmCC)}\n#webamp .media-info #stereo.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAMCAMAAACpx0YDAAABXFBMVEUA/wAD+AQG7gkG8QkH4wwI6A0K2g8K3xAL2xIL4hIM2RMN2BUN3RUOxRYO1RUQ0xkSxh0SzBwS0RwTuR0VvCEVxSEapCkbnyscrSwfczAgpzIhkzQinDUlJTklJTolJjslJzklKDolLjslkzomJjsmKTsmKzsmLDomMjsmMjwmNjsmOjsmRjsmWjwmdzsmiDwnJz0nKT0nLT0nNT0nOj0nQjwnTj0nYj0oKz4oLT8oND4oOT8oRz4oSz4oZT8pL0ApO0ApTEApTkApZkApZ0EqMEIqMkMqPEEqTEMqT0IqUEIqZUIqZkMqa0IrLkIrL0UrNEQrPEQrPUQrQEMrSkUrYkQrfUQsMUQsNkUsQkQsS0MsTkYsVEQsWEUsYEYsZ0UtLkUtLkctL0gtMEYtM0YtM0gtNEgtNUctNkctOUYtP0YtQkctR0YtS0Yti0cuLUguLkcuMUcuM0cuN0c2LFEQAAABDklEQVQYGQXBvVHDQBCA0W/3TrJkBBhmPAQkBATUQA+0QEROT9RBwtADCQQkDMaBLIOk8+nnlvfkUfYq0HKgtzIMMIBBxNpR/+Qsy+pcxLnj46iFiKrquJeuw/xp51QvayeuxkSikk+YHuFmxLdetRH//HXnCIuoxiSxpzS1hFfRlw+/DrxWO1YdqdgXV9vd4mrZmWgl9UdaUnD/LX4bo9ue9O8/N/lnkFG0g+tquwGSy5dUR1BlABio2fmmoVzL00XfZMluV027WL3tK8DkIWtUJRBMJGCMQKQve5vT4C2tRDd5LSaS2wEDcjqz2cbZM0l7Nh/KHiPCCERIKfjR8EmnEApqAGMASDD9uiHBP3bmjPqWVRjwAAAAAElFTkSuQmCC)}\n#webamp .media-info #mono {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAMCAMAAACk2TZEAAAAclBMVEUtLUguLkcuLkgvL0ovMEswL0swMEsxMU0xMU4xMk0xMk4yMU4yMk8zM1AzNFE0M1E0M1I0NFE0NFI0NVM3N1E8PFNJSWFQUGdSUmtaWm9gYHZuboJ2dol8e4x+fpCGhpeOjp2VlaOdnaqlpbKsrLetrbnuzsEEAAAAp0lEQVQYGQXBQU4bURQEwOrvkcA4iRS4/+VYwI6VEyTPzGuq8ppyrjHKIVPQsSnnGpReZkQnQzfImKJUU8saWUEWQZyV0g7dqs6X349tf7qfN3uf6t/N/imLDL7WY1/Xx8d1m/+X6+P9+U1XSADNH8Xkr9aqmTW7fY5+r9v9OHp859f9i7z2vJwZpUdUjWpqSZQytlYJUrOpWaR1FhhgbcLQRiEFTH4AmtR0pKKbMGAAAAAASUVORK5CYII=)}\n#webamp .stop .media-info #mono.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAMCAMAAACk2TZEAAAAclBMVEUtLUguLkcuLkgvL0ovMEswL0swMEsxMU0xMU4xMk0xMk4yMU4yMk8zM1AzNFE0M1E0M1I0NFE0NFI0NVM3N1E8PFNJSWFQUGdSUmtaWm9gYHZuboJ2dol8e4x+fpCGhpeOjp2VlaOdnaqlpbKsrLetrbnuzsEEAAAAp0lEQVQYGQXBQU4bURQEwOrvkcA4iRS4/+VYwI6VEyTPzGuq8ppyrjHKIVPQsSnnGpReZkQnQzfImKJUU8saWUEWQZyV0g7dqs6X349tf7qfN3uf6t/N/imLDL7WY1/Xx8d1m/+X6+P9+U1XSADNH8Xkr9aqmTW7fY5+r9v9OHp859f9i7z2vJwZpUdUjWpqSZQytlYJUrOpWaR1FhhgbcLQRiEFTH4AmtR0pKKbMGAAAAAASUVORK5CYII=)}\n#webamp .media-info #mono.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAMCAMAAACk2TZEAAABJlBMVEUA/wAD9wUG8QkI6A0J5g4L4hIM2RMM3xMN2BUN3RUP2hgQ0xkSzBwS0RwVvCEVxSEWySIZwicZwigcrSwgpzIhkzQkpzkmdzsmiDwnmD0olD8qa0IrfUQtL0gtMUgtQkcti0cuLkcuMEguMUcuNkguOkkuR0ovL0ovMEsvM0ovNEkvNEovNkovOkovPUovUUkvXEovZkswMEswM0swNUswNkwwP0swQkowTEswT0swUEwwVkswZkswaksxNU0xN04xP04xRE0xZk4xbk0yNU8yNk4yNlAyOE8yQ00yTk4yU04yVk4yY04yaU8ybE8yek4zNFEzOVEzPVAzQ1EzRlEzTFEzU1AzXlE0M1E0NFE0NFI0NVM0NlE0NlI0OlE0PlI0QVI0RlJbMtAUAAAA50lEQVQYGQXBTW7CMBCA0W9mrJKEAKr4WXXTu3TXG3Dc7nuOIiohKLHjGJzpe3IUreZ6BxJkIIHjnlxxbDBVs7EXaVV1u1UtpehDAdloNB3Xo6p1XbF7CN2kj0YFEYmasmUz05yb3KjmfW5LcBnEvk7L1N8P4UwvN+HwS/c+iqIrAT68XTyvq7frZNt6W33+nUAFHADAHAyw+ZsA6tXx0AxtaHTz/Nm9dGGxqef9bkKOntdRUh8BIFGIOD42KSBLn6WtFQAWN7zBL68plYDXQVwYASABGTy6h4DMOHEOyATMOHWmJh7hH8HfcsJFco7ZAAAAAElFTkSuQmCC)}\n#webamp #time #minus-sign {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAABCAYAAAAW/mTzAAAAF0lEQVQYV2OUUNT8/+L+dQYJRU0GGA0AVz4HY4h207oAAAAASUVORK5CYII=)}\n#webamp #time.countdown #minus-sign {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAABCAYAAAAW/mTzAAAAEElEQVQYV2Nk+MHwnwENAAAjgQH5sdp7TQAAAABJRU5ErkJggg==)}\n#webamp .digit-0 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAFklEQVQI12OYGtrA4ACEHh0ORNFA9QAiPQsl393R7gAAAABJRU5ErkJggg==)}\n#webamp .digit-1 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAE0lEQVQI12PsYNjBwMDgwEgCDQAItwpIh/66WgAAAABJRU5ErkJggg==)}\n#webamp .digit-2 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAH0lEQVQI12OYGtrAwMDgwNDR4YBCg8RBLI8OVBooDgAebgr//9NFIgAAAABJRU5ErkJggg==)}\n#webamp .digit-3 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAGElEQVQI12OYGtrAwMDgwNDR4YBC4xEHAB3uCv9NUBWtAAAAAElFTkSuQmCC)}\n#webamp .digit-4 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAGklEQVQI12Pw6HBgAEF0emqoAwMDkO7owKABD8wKi451feQAAAAASUVORK5CYII=)}\n#webamp .digit-5 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAIElEQVQI12OYGtrA4MDAwODRgUqDxBmArI4OBxQaKA4AHm4K/5vyk78AAAAASUVORK5CYII=)}\n#webamp .digit-6 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAH0lEQVQI12OYGtrA4MDAwODRgUqHgsUdgHwHFBqoHgAbbgr/DdfRzgAAAABJRU5ErkJggg==)}\n#webamp .digit-7 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAFklEQVQI12MMZdBmYGBwYOxg2EEsDQDjggmI1L+I9wAAAABJRU5ErkJggg==)}\n#webamp .digit-8 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAFklEQVQI12OYGtrA4ACEHh0OKDQecQArbgt/wD0r9gAAAABJRU5ErkJggg==)}\n#webamp .digit-9 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAANAgMAAAAGbqyVAAAACVBMVEUAAAAA+AAYISknP40bAAAAIUlEQVQI12OYGtrA4ACEHh0OKPTUUAcGBiDd0YFKA9UDACFuCv9mR03UAAAAAElFTkSuQmCC)}\n#webamp .play #play-pause {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJAgMAAACd/+6DAAAACVBMVEUAAAAA6AAYISlH3xqZAAAAH0lEQVQI12Po8GhgYAhgYOgIAdKhQDrUAUKHQMU9GgCL+gfA1jUO8AAAAABJRU5ErkJggg==)}\n#webamp .pause #play-pause {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJAgMAAACd/+6DAAAACVBMVEUAAAAA6AAYISlH3xqZAAAAGklEQVQI12Po6GhgAIGQVgeGEFYHFBoEgPIAiaIHnsCfw8kAAAAASUVORK5CYII=)}\n#webamp .stop #play-pause {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJAgMAAACd/+6DAAAACVBMVEUAAAAA6AAYISlH3xqZAAAAGUlEQVQI12Po6GhgAIHWkAYG1hBUGgSA8gCN1wfe41RVhgAAAABJRU5ErkJggg==)}\n#webamp #work-indicator {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAFVBMVEUAAAAAAAAA6AARQDMYISlODwD/KDN/MQZsAAAAAXRSTlMAQObYZgAAAB9JREFUCNdjUFI2ZmBgQCYFBQWBpKOLCJwdGpaGSgIAfI8Fm6vX5/8AAAAASUVORK5CYII=)}\n#webamp #work-indicator.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEUAAAAAAAARQDMYISn/KDPWqFE6AAAAAXRSTlMAQObYZgAAABpJREFUCNdjUFJgAAJkUlAARBoaINguDmgkAEabAvbVxDW5AAAAAElFTkSuQmCC)}\n#webamp .playlist-top-left-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWUlEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TllWjvk7ZyX9pb0jeRDhFvYqBDe5+kxzjR3hK6xImKqibtfUKXzEiXsosulowWkKRUQYx0SV10sYQeqQsAf0Ul/5LwY0QAAAAASUVORK5CYII=)}\n#webamp .playlist-top-left-spacer {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWUlEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TllWjvk7ZyX9pb0jeRDhFvYqBDe5+kxzjR3hK6xImKqibtfUKXzEiXsosulowWkKRUQYx0SV10sYQeqQsAf0Ul/5LwY0QAAAAASUVORK5CYII=)}\n#webamp .playlist-top-right-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWUlEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TllWjvk7ZyX9pb0jeRDhFvYqBDe5+kxzjR3hK6xImKqibtfUKXzEiXsosulowWkKRUQYx0SV10sYQeqQsAf0Ul/5LwY0QAAAAASUVORK5CYII=)}\n#webamp .playlist-top-right-spacer {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWUlEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TllWjvk7ZyX9pb0jeRDhFvYqBDe5+kxzjR3hK6xImKqibtfUKXzEiXsosulowWkKRUQYx0SV10sYQeqQsAf0Ul/5LwY0QAAAAASUVORK5CYII=)}\n#webamp .playlist-top-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAAA/FBMVEUdHS0dHS4eHi8fHyIfHzAfHzIgHzIgITMhITQiITQiIjUjIzYkIzckIzgkJDckJDkkJSklJTomJTsmJjsmJjwnJz0oJz4oKD8pKUApKUEqKUEqKkEqKkIrKUIrKkMrK0QsK0MsK0QsLEMsLEUtLUYuLUcuLUguLkcuLkkvL0owMEsxMEwyMU0yMU4yMk8zM1A0MCw0MlA0NFE1NFM2NVM2NVQ2NlU3NVY3N1Y4N1c4N1g4OFg5OFk6OVo7Olw8O109O149PF9FQTtnXEJqanpra3xsbHxsbH1tbX9uboFwb4NxcYZzcoh0c4p0dIp1dYx4do54d5CGd02OkZDLe86vAAAAvUlEQVQYGQXBMUodUBQFwDnnXdMq2LuWQFy/nYVFQAIu47+bmSDSpFFtmyRp452oiIhIIjJ8Nr/2nD1Nc5ppJS3idhVqIRii93wDABiC79/PAACDdbwAABju8fAXAMBg7/EKAGBYu/YFAGAg9+0DAMDgNo/XSdLm5JxW0sH+JE2TJm1a9aQI2NiSYD0Mlj9JEiKSkAzY/XrKnPQkpydJUoDrXnvFQlIAu67aLVDAfbAgu4k1gHX/pZ2cJKme/xmiNhnfUYYUAAAAAElFTkSuQmCC)}\n#webamp .playlist-top-title {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAMAAABMHminAAABd1BMVEUdHS0dHS4eHS4eHi8fHyIfHzAfHzIgHzIgITMhITQiITQiIjUjIzYkIzckIzgkJDkkJSklJTomJTsmJjsmJjwnJz0oJz4oKD8pJ0ApKUApKUEpKkEqKUEqKkEqKkIrKUIrKkMrK0QrLEQsK0MsK0QsLEUtLUYtLkctLkguLUcuLUguLkcuLkkvL0ovMEsvMSUwL0swMEsxMEwyMU0yMU4yMk8zM1A0MCw0MlA0M1E0NFE1NFM2NVM2NVQ2Nk82NlU3NVY3N1Y4N1c4N1g4OFg5OFM5OFk6OVo7Olo7Olw8O109O149O2A9PFs9PF89PGA+PGBAQFhCQV9FQTtIR2ZMTGFVVG1WVmNbWnZfYGpgX3dlZXdlZnRnXEJnaHZoaHhpaXtqanpraoBra3xsbHxsbH1tbX9uboFwb4NxcYZzcohzc4p0c4p0dIp1dYZ1dYx4do54d5B5eIl9fY6FhJSGd02LjJqOkZCQj6CXlqeioq+srbettMQFH6KtAAADiklEQVQYGQXBTa8VVhkG0PW8+1zuRYuN4gfgpV4q3PpRNTFGw8Q4MlaJsUPjr/D3OHJgjANnNR2hxA6MNW00mKJAC0YSSZu2SkmBnrP361o5gsY09UL3Ymrd3bq7073obgAQSoUYJJKoqIgoY0DYvAgaaFbr1tA0mrawAABKQghBEIkBQXTY3AG7mrpZbfYylzVr123ZrWx199TLWsBYo6vYJEYqoySxFzV6qEqhGIUCGmKJXlqoKRoaWbozWwKzDYvVDYDRmFmAAGTDFVZtdbN69WQuvey6Lbu1stOzrc4uC1ClspkjGTGGSmKjkhpJRUnsbfdeYvNz9399xXze354/8dqFT7z+rfGnb9fNunTr3/393H3Djzz53Qsn/ea7h6x//Hnxs32eXL14fPeVTD8++ejlH+7fvPXC9vc/2P5Bff7SuzeOT5tv1UXsro+XfnpGVZ1DPqqTJzz99AOQI8zz6bPB/pcOSLv5cj1rwC9v738F9Djog/VqX7ycN8PQ+Nzp7Y23//f+a++5fV2cq9pc85iu/1w44my9B+yfpc6s7f7pd8xxyXavpxMXbWvC5T0LJd/MvcNv/P3uhU/d/1dYo8Hel7cPPwDaNer4+OvEEwe7+XHvB+aTp3Dqow99Ju733mMW559555UZ+MKZu3/E0odz69Bfp9ehFN6+M+0dLcHg+Ph4c8Zb8GiOD058bAuLf34tzmc85dwNHp+8d6R481WrFvyKcPo7/nKwDvsgWYMYz3iAz5697Tk05p4Pn7X5hYdXiAeffNcXH2qK/9694OyTa763/2nuXbx+JBu6uxZgcOqU+G0uH371DWh1yS08Gs+ZtwtYV65elZ8AW61ZbfYyl6V3utc0s9U9Wy89QWpupMgoNoY9STKSUpWNFAmbLnIENHNaTbduk2XRemltsRoARFEiBokkKpJEijEgFOgGQNC0poGGBQBIWokINAgJLABsXgQ0DaZumoamad1YAEChCCEIIWFAkA6bO2CZui169uq1dPeu25q92k6bbWXtohlzswbJJjJkZCTJiCqjYkRJ2IMC5gTFAugpFhB2pa01emCOXVplQ0iNClAMelDAahTYjQHoDkEIMaJmM2Z3d7cFU2CubtoEWExMAAkKbOYEizRTLLSYbQ0SCd0WkvRCNVitgVAI0OwgR9CYJqvp7ja17tZtac3S3QCQiJJIIpLEEBWkjAHh/7B25tuthDwsAAAAAElFTkSuQmCC)}\n#webamp .playlist-top-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAABNVBMVEULDxYMDAwOFQsUFBQdHS0dHS4eHS4eHi8fEQofHyIfHzAfHzIgHzIhITQhIjQiITQiIjUjIzYkIzckIzgkJDklJTomJjsmJjwnJz0oJz4oKD8pKUApKUEpKkEqKUEqKkEqKkIrKUIrKkMrK0QsK0QsLEUtLUYtLkguLUcuLUguLkcuLkkvL0ovMSUwL0swMEsxMEwyMU0yMU4yMk0yMk8zM1A0LhA0MlA0NFE1NFM2NVM2NVQ2NlU3NVY3N1Y4N1c4OFg5OFk5OVc6OVo7Olo7Olw8O109O149PFs9PF89PGA+PGBFQTtGQh9ORDBQPx5YVjxnXEJqanpra3xsbHxsbH1tbX9uboFwTyxwb4NxcYZzcohzk5p0c4p0dIp1dYx4do54d5B4h4yGd02LjJqNcTiOkZC/uXdbAAABJElEQVQYGQXBsWpTYRyH4ff7cig5a8FCKAge2slNqFvoBai4e5d26h0UrCnYpaCSrbV2cA0k5/97fZ42WYVR1ZCgZWC4REGDSEAVuRpeUoayyiqddU6IdIGeDkCHBQFgpo2s1dXR/mj/66BvHm/h4vSunocv/67XrpYsWb69L5yAadsaw+IV8hMAAl8/Tbtxe/tahhtAAKAXuBt30KCfnUEHAAL8HXcnQKcfH2huAPje4fO0/fNjujC0kbXMNwds75ydHr/B+9NNntuHlJZWYpWpOcb4NDxYpUTVSAzzx03RoQECIAQomGG4RESDSFCuABheUv2AVTFV2ScamnRCNYiYKAsUhA5g0pqNRpgVADq01gCaxNIgAMODVZJz+F2WWisA+A8o2vB09xIFIgAAAABJRU5ErkJggg==)}\n#webamp .selected .playlist-top-left-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TkVWnvkzfnqmhvyf///2lviaujNe0tWTcplfaW0CVOVFQ1ae8TumRGupRddLFktIAkpQpipEvqoosl9EhdAAvFKfTd8tQbAAAAAElFTkSuQmCC)}\n#webamp .selected .playlist-top-left-spacer {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TkVWnvkzfnqmhvyf///2lviaujNe0tWTcplfaW0CVOVFQ1ae8TumRGupRddLFktIAkpQpipEvqoosl9EhdAAvFKfTd8tQbAAAAAElFTkSuQmCC)}\n#webamp .selected .playlist-top-right-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TkVWnvkzfnqmhvyf///2lviaujNe0tWTcplfaW0CVOVFQ1ae8TumRGupRddLFktIAkpQpipEvqoosl9EhdAAvFKfTd8tQbAAAAAElFTkSuQmCC)}\n#webamp .selected .playlist-top-right-spacer {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU1nL+z0BjwFhRPoH2ltjZJAwTS+TkVWnvkzfnqmhvyf///2lviaujNe0tWTcplfaW0CVOVFQ1ae8TumRGupRddLFktIAkpQpipEvqoosl9EhdAAvFKfTd8tQbAAAAAElFTkSuQmCC)}\n#webamp .selected .playlist-top-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAAA/FBMVEUdHS0dHS4eHi8eHyUfHzAfHzIgHzIgITMhITQiITQiIjUjIzYkIzckIzgkJDckJDkkJSklJTomJTsmJjsmJjwnJz0oJz4oKD8pKUApKUEqKUEqKkEqKkIrKUIrKkMrK0QsK0MsK0QsLEMsLEUtLUYuLUcuLUguLkcuLkkvL0owMEsxMEwyMU0yMU4yMk8zM1A0MlA0NFE1NFM2NVM2NVQ2NlU3NVY3N1Y4N1c4N1g4OFg5OFk6OVo7Olw8O109O149PF9FQTtqanpra3xsbHxsbH1tbX9uboFwb4NxcYZzbFJzcoh0c4p0dIp1dYx4do54d5CukmXsznr///9ua7yBAAAAvklEQVQYGQXBsU0dQBAFwHnvFsshErl7MQVQtlsgIEGWSMkd/FvPBJEmjWrbJEkbr0RFRFQSkeG9+bHn7GmaNtNKWsTtKsRCMETv+QQAMASfbwEAGKyjAACGezx8AwAY7D2eAQAMa9e/nwAAA7m//gAAGNzm8TJJ2jTntJIO9itpmjRp06onRcDGlgTrYbD8TpIQlYRkwO7HU+akTU5PkqQA1712xUJSALuu2C1QwH2wILuJNYB1/6adnCSpnv/+0TYBQOmyqAAAAABJRU5ErkJggg==)}\n#webamp .selected .playlist-top-title {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAMAAABMHminAAABd1BMVEUdHS0dHS4eHS4eHi8eHyUfHzAfHzIgHzIgITMhITQiITQiIjUjIzYkIzckIzgkJDkkJSklJTomJTsmJjsmJjwnJz0oJz4oKD8pJ0ApKUApKUEpKkEqKUEqKkEqKkIrKUIrKkMrK0QrLEQsK0MsK0QsLEUtLUYtLkctLkguLUcuLUguLkcuLkkvL0ovMEswL0swMEsxMEwyMU0yMU4yMk8zM1A0MlA0M1E0NFE1NFM2NVM2NVQ2NlU3NVY3N1Y4N1c4N1g4OE44OFg5OFM5OFk6OVo7Olw8O109O149O2A9PF89PGA+PGA/QitAQFhCQV9FQTtIR2ZMTGFVVG1WVmNbWnZgX3djY3BlZXdlZnRqanpraoBra3xsbHxsbH1tbX9uboFwb4NxcYZzbFJzcohzc4p0c4p0dIp1dYZ1dYx4do54d5B9fY6FhJSLjJqQj6CXlqeioq+srbettMSukmW8u8XHx83KydLW1tzk5Ojsznry8vT////NCpc8AAADfklEQVQYGQXBS6tfBxUH0PXb5+Q+Y2oFI5ZoknpLiU8cCELopANJG+M38Ds48nM4ciw4cVJ0INhBK5T6KPVRChVFIzHUB4IQvYbEe+//7O1auQGDzWYaM81mzMyYmclMMzMAIJQKsZBIoqIioiwLhPUuGGDoMaNhGAyj0QAAJSGEICiJBYKYsD4EW9oMM3bTunVnm9G2zoWZ2UzrBpZepoo1saRSJYk1qmaxVIKiCgUMxIhpI6TFwCBtJttIYBuLpmcAUINOAwKQlTt07cww073Rbdo2o23d2Zlt9GSXBlSprNuSLLGUSmJRSZZURSTW3fo667edf+eO/pL3vrj/7mf3f/OVS29/df3Dwc0H9+dry3/eds/Zj1858oN7V9j+9Ivmm3uc/+rqC6c/yuYbR09+cnf//u9f3b3x6sWb6vmbj3/95eNcPLj8HC7er9e/taeqDpDz5XjftYMzkOfR15c5CPZvHRLu/3y5aYHv/XXvC2CWwzns387Nl+vPoQyeu3z+u6ePPnz3sb+/Lw6q1g9sTM4Ob/DMegpm/yq5ttv2P/XQbj1xvjdcPbTVBrevaJS8lNMrt985feb4vw/CZMD+586e/TcwPqBOTl4k/ubwYnc8HwZ2Z8c4ON+5Hk9n7ynN0ccfv7cFrh+c/hBtnt21j3pz5y2Iwj8eXdi/PqA4OTlZ9/wTnu7Ws6zn0Pzx83F9ucQBnh49uaL4yy91NXyflPX2vHO4Hc1h0oi84DE+uX/fLUCvHn3C+l2P7xD/u3zq+MJQ/OvRx1w7+6mX9z/Nk8O37glmphqwtKPPOPRaXvnISz+Dsd70AGfLLRf3A/Sd18jXgZ0xzNhN69ZmM9Nty4WZbUybDaS2VYosxWqxSpJKSiqXJCQsU+QGMGybHmbM2GjNmDZG0wMAoigRC4kkKpJEimWBUGAGAMEwhgEGGgCQjBIRGBASaACsdwHDgM0MzcAwjBk0AFAoQghCkbBAkAnrQ9DajGF20zNtZrYZ3dNjZ2yj07sYlm3thWSNLLKkkqSiSlWsEQkrFNANQgNMiwbCrozuZRZsyy6jshJSlQBFMSsBelBgqwJMF0EIUVHbsGwzMzMaNoGtZxgN0DR2ABIUWLrBUE2LxogevZBImNFIMo0a0GOAEBQwbJAbMNhs9DAzYzNmxow2hjYzAJCIkkgiksQiKkhZFgj/B6KI5O4cXV8dAAAAAElFTkSuQmCC)}\n#webamp .selected .playlist-top-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAABI1BMVEUdHS0dHS4eHS4eHi8eHyUfHzAfHzIgHzIhITQhIjQiITQiIjUjIzYkIzckIzgkJDklJTomJjsmJjwnJz0oJz4oKD8pKUApKUEpKkEqKUEqKkEqKkIrKUIrKkMrK0QsK0QsLEUtLUYtLkguLUcuLUguLkcuLkkvL0owL0swMEsxMEwyMU0yMU4yMk0yMk8zM1A0LhA0MlA0NFE1NFM2NVM2NVQ2NlU3NVY3N1Y4N1c4OFg4QlY5OFk5OVc6OVo7Olo7Olw8O109O149PFs9PF89PGA+PGA/QitFQTtYVjxnXEJqanpra3xsbHxsbH1tbX9uboFwb4NxcYZzbFJzcoh0c4p0dIp1dYx4do54d5CNcTisrbeukmWwmV7O4tDsznr////5EmU+AAABC0lEQVQYGQXBMUpcYRiG0ef7708qu4mgxYCFVdbgtIGsIesLZAOuQ0GIlfXFMEMgTOXc7308p/Z2Y1Q1JGgMzAcUVIIIqsjjPKUNm912a+uWEBkCIwsAAwYBYKMmB3UP8Oeid65wW8/9Pn/274P7BeDbS+PXsnbHKmZN5B8ABNba9XJalbkCWgCOBvvLhxTMa2BggQSo5WMpGMzlTMUS+D+a293J2vk3zF8crPMVwBmt4wqWUN/T2rETu022GOM6X+1Womokhv7x1AwoQACEAIEN5gMiKkFEeQRgntLjglvHdOeSaCgZhC6ImCgLCsIAMF1lUcimADCgqgBKYmsQgPlqt8R73tpWcwMAn2oG882E0Lr4AAAAAElFTkSuQmCC)}\n#webamp .playlist-middle-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAdAgMAAADjkWVKAAAADFBMVEUAAAAdHS0pKUBqano8VvpZAAAAD0lEQVQI12OoilvCQGcMALzxKw1EtyFgAAAAAElFTkSuQmCC)}\n#webamp .playlist-middle-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAdAgMAAADX6KRWAAAADFBMVEUAAAAdHS0pKUBqano8VvpZAAAAEklEQVQI12OwmrXq1UuGIUICAIEjYC7HaOXEAAAAAElFTkSuQmCC)}\n#webamp .playlist-scrollbar-handle {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAASBAMAAACUbIJFAAAAG1BMVEUJAgJ1XCKNcTibgkmwmV6+sX3aypzy8vT06sbDyd/kAAAAKElEQVQI12NIAwKGJCWlAoakiHYHhqRGD/KJimYHhnQXFwEGBQYGBgB4dhfwKIryTQAAAABJRU5ErkJggg==)}\n#webamp .playlist-middle-right.winamp-active .playlist-scrollbar-handle {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAASBAMAAACUbIJFAAAAGFBMVEUgDABsURh1XCKNcTihhkuwmV7DrnXaypzxKekLAAAAKklEQVQI12MIDQ0NYAgUFCxgCHRLN2AITDQjnyhLMmAINzYWYFBgYGAAAIGKEsehmtv8AAAAAElFTkSuQmCC)}\n#webamp .playlist-bottom {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAmAgMAAABMq9iIAAAACVBMVEUnJz04OFh0dIo98+79AAAAGUlEQVQY02NYBQYNDKFg4DDiaHSAKzygAADHT1L3iexI4AAAAABJRU5ErkJggg==)}\n#webamp .playlist-bottom-left {background-image: url(data:image/png;base64,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)}\n#webamp .playlist-bottom-right {background-image: url(data:image/png;base64,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)}\n#webamp .playlist-visualizer {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmBAMAAAB+CntdAAAAIVBMVEUAAAAAAAwAABAACCEAa7UYGCkZGSMnJz04OFhjnPd0dIrCNSsmAAAAW0lEQVQ4y2NYRQxYwNBBDGgYDsrKiQELGIgCCxhYiQFEm8aiSpRpTMSZxkmcaYxEus2MmqaNum0Yuk1FU0VTRFPF0sQSOwZBovNCFXEFF1HZuYBYZQNSWhLnNgDqVFE4O/Zo0wAAAABJRU5ErkJggg==)}\n#webamp #playlist-window-shade {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAOAgMAAACnVF/TAAAADFBMVEUAAAAdHS0pKUBqano8VvpZAAAAHUlEQVQI12MIBQMHhv9gcIBhFRg0MFALwMyD2gMAcRoULw29bBMAAAAASUVORK5CYII=)}\n#webamp #playlist-window-shade .left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAOAgMAAACnVF/TAAAADFBMVEUAAAAdHS0pKUBqano8VvpZAAAAIklEQVQI12MIBQMHhvr/IHCAoWoVCDQwVDFAAMU01DyoPQAU7xeZEgCs6QAAAABJRU5ErkJggg==)}\n#webamp #playlist-window-shade .right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAOCAMAAABaWb9VAAAANlBMVEUAAAALDxYMDAwdHS0fEQopKUA0LhBGQh9ORDBQPx5YVjxnXEJqanpwTyxzk5p5ip6NcTiOkZBJ6prXAAAAbUlEQVQoz6XSORaAIAxFUQjyFTEO+9+sBI82ajT6KgpukYAL5txgLbhoLbjLfpFGkkMGESHfk2kXGEtiegbA0MiGUEm5GKnjxCCdCMJykDZxekdKqASc5idSZ6nk5SznjXnvtY2p7/Lh9e3fcgVRHAwq+Kdj5gAAAABJRU5ErkJggg==)}\n#webamp #playlist-window-shade.selected .right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAOCAMAAABaWb9VAAAAM1BMVEUAAAAdHS0pKUA0LhBFQTtPSThYVjxnXEJqanpzk5p5ip6NcTiOkZCsrbewmV7O4tD///+ogWxMAAAAbElEQVQoz52SSQ7AIAgAsQjU3f+/tpIup9ZI58SBCSs4M7BbcbBZcfDKHyXeCV7RQBgRWb6VfkmeQilBHa7CUnmmnBJRGdCIUGqqgnNFJWqPwqknXlIGtFxFG/O5tUyLs0TrxuLsLj+ub3/LA63jB8yJpQTsAAAAAElFTkSuQmCC)}\n#webamp #playlist-add-menu.selected .bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAA2AgMAAAB/8csyAAAADFBMVEUvL0RGUF2BkqXt//98VqXeAAAAFklEQVQI12NgYTBhKGHYQmNYArSFBQBn5SMZFZ1KogAAAABJRU5ErkJggg==)}\n#webamp #playlist-add-menu .add-url {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAWElEQVQI14WOsQ2AMAwEv3LPKBYTABsgorTfxCtkfRyUOIiGq04v62Sk4EKugxPZOmVzpxAGKeoupInwcWD6e3eP+9FpTnppOvm3g6307cTPinSsHcW+BDd3RTueo3YTtwAAAABJRU5ErkJggg==)}\n#webamp #playlist-add-menu .hover .add-url {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAV0lEQVQI14WOyQ2AMAwE9+MCEEkDdEAnGwmXACWQ9skFmx/zGq2skbEJLALBB8eOmF8S4n11zupOIxzW3Eg3Y3NAPu/Fv/tB77CU5OTfDtZSQpg6q/5/AGMtMU3PzLN0AAAAAElFTkSuQmCC)}\n#webamp #playlist-add-menu .add-dir {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAWUlEQVQI122OsQ2AMAwEv/qeUSwmADZARG6/iVdgfRrHScFVp5d1MlrxwN/BDY+kH/AQhQC7wYNSkOoGD2D6ulPzfnQsO2K6gtLifzuF4Uunfja0a08M51Z82fg51vPZ5kgAAAAASUVORK5CYII=)}\n#webamp #playlist-add-menu .hover .add-dir {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAV0lEQVQI12NQQgAGQQRgEAmFghBDBtFyGAhkEC1Lg4BUEDs0gDWAIZSBFcxmDQgIZWUNALMZGBBsZHEgG64eCuDmBLBC2QFgLQg2NnGQehBbBMkcYYT7AQVAL9EsAFyYAAAAAElFTkSuQmCC)}\n#webamp #playlist-add-menu .add-file {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAXklEQVQI12WOsQ2AMAwEv3LPKBYTABsgorTfxCuwPpZJDIJzc3q9LaMkB+o52FGt0xZ3CmGQpu5CmgjDgcffuXv2xx13wseIcPOW8c4lXH65xQa+d/JnRdnmjmKdkguiDDkEOAftpAAAAABJRU5ErkJggg==)}\n#webamp #playlist-add-menu .hover .add-file {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAXUlEQVQI12WOwQ2AMAwD/ckAiHYBNmATI+ERYARYnzQttBKXz8lyomDpYOogqbGvyPfLhnydlaO4aIRg4UbKjOFA9zF3//qN4oSPiHB5S6y5hdsvV2x4Pw135v7/A+euLyJ1PQpNAAAAAElFTkSuQmCC)}\n#webamp #playlist-remove-menu.selected .bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAABIAgMAAABO2aeDAAAADFBMVEUvL0RGUF2BkqXt//98VqXeAAAAFklEQVQI12NgYTBhKGHYMghgCdAlLABvUy/BqCAQTQAAAABJRU5ErkJggg==)}\n#webamp #playlist-remove-menu .remove-all {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAWklEQVQI13WOMQqAQBADp0rvUw5foP5AlG23MV/w+xbenSI41RBCCHtnI87GSrhyTIQxknUUwpJM3o4xPLnU/Om3nULYSmf1zJfzk2eS+LvTPxf2ZawU5qFzAa7rOIxN5zmHAAAAAElFTkSuQmCC)}\n#webamp #playlist-remove-menu .hover .remove-all {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAWElEQVQI13WO0QmAMAxE7ycDiO0CbuAmJ3gj6Ai6vtGmpD8+CDwuIRyWBFOComBfUe/OhnqdjeN1QTCTfW5uoPVcQOY+4XkfNDeK4eTg+MnpG7iX4c+c/R8m4y6+oJDkfgAAAABJRU5ErkJggg==)}\n#webamp #playlist-remove-menu .crop {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAR0lEQVQI12MIhYMQhvByGAhiCE+DglRHJLYhHjZDAlsCEIPYCWkJYABlswGZyOIw9QlA9fjNxMGGu9mQIdTZGAoMGZwE4QAAjAZBLD2pp6oAAAAASUVORK5CYII=)}\n#webamp #playlist-remove-menu .hover .crop {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAASElEQVQI12NQQgAGQQRgEAmFghBDBtFyGAhkEC1Lg4BUEBumCC+bIYA1AIhB7IDQADCAslmBTGRxmPoAoPpQ4swXQWILI9wPAIC4Ne4ZKh5qAAAAAElFTkSuQmCC)}\n#webamp #playlist-remove-menu .remove-selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAXUlEQVQI112OvQnDUBgDr1KfUR6ZIMkGxuZr1VgreP0Ufj/gqw4hhDgmO3UNNiqd80OFIEVnoyIp+HZCYOXS8NUfO41KMO7uOMMja7pXbhmT58783Dh+707j+5r8AVpzN34SgZTJAAAAAElFTkSuQmCC)}\n#webamp #playlist-remove-menu .hover .remove-selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAWklEQVQI102O0QmAMAwF388bQGwXcAM3iWBG0BF0fWOb+rxSOI40FIvAJFA82VfUe7ChXmfneN3hIJ3NGQbj6A6ox03XfNIdBku3drLT+LmpR40X4eW3Z9b/H/ZpLd3ACl8TAAAAAElFTkSuQmCC)}\n#webamp #playlist-remove-menu .remove-misc {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAYUlEQVQI102Ouw0CQRQDJ3JOKSsqADpAd3qpk3ULtE+wn7uJLGtkmXNzUL/Fl8qkv6gQpKg3KpKCRyYErl5a+fLXTqMcO4TeKIs4Hj04mtl27O1bw7/v7M+N8/OcNN6PzR8ABzaO5fDK/gAAAABJRU5ErkJggg==)}\n#webamp #playlist-remove-menu .hover .remove-misc {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAXklEQVQI102O7QmAMAxE788NILYLuIGbRPBG0BF0fZN+EB8UXo9LCLYES4KiwbmjvpMD9bk7V7ggkGJzusE4cwGZ+xue/UG4ySwmmhPyf88BE4c7UZt9Y/TLb8+a93++ly0VHemPIgAAAABJRU5ErkJggg==)}\n#webamp #playlist-selection-menu.selected .bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAA2AgMAAAB/8csyAAAADFBMVEUvL0RGUF2BkqXt//98VqXeAAAAFklEQVQI12NgYTBhKGHYQmNYArSFBQBn5SMZFZ1KogAAAABJRU5ErkJggg==)}\n#webamp #playlist-selection-menu .invert-selection {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAXUlEQVQI113OsQ3DQAwEwY0udymEK7DdgSCBKZO/FtS+k39K0EYDgiDI0e3kudpIz8aHNFKVNYJ0mbu5LIxHzP3ldSdIu4Q0LcvLZdrWNccIPe/0z8Hxe8+C76v7A5OQN+oVjwHMAAAAAElFTkSuQmCC)}\n#webamp #playlist-selection-menu .hover .invert-selection {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAXUlEQVQI103OwQ2AMAxDUV88AIIswAZs4kh4BBihrM+BhvafnqooKfYRlhE2984D8VSJaPfXlYgmyKSciGaKkzFZFP3Pd9eBRDSLgrppuSyLZXO8w4LgxDbtWcf/X0qvMI9I7cp+AAAAAElFTkSuQmCC)}\n#webamp #playlist-selection-menu .select-zero {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAYElEQVQI102OwQ2AMAwD/cqfUSomADZAVHz9oSuwPm4aAtfPyXKtoCYHzvtlx9mCa+kOgvIip7/hzWjp/HKl+hF57Mh7SGs2OqoL9z5jw30+cu8z+r+dvLmgbnNQsE7JAyOvPXLeVffRAAAAAElFTkSuQmCC)}\n#webamp #playlist-selection-menu .hover .select-zero {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAX0lEQVQI102Oyw2AMAxDc8kAiHYBNmATI+ERYARYn3wK4fXyZLlWZClkKqRxsK/S75dN+nUmhzspEJDhiJdOhX6Oyi21HyNP3D2EUrNjdSPcZzQ95kcefXi//Xbmuv8BohAy09WnmqwAAAAASUVORK5CYII=)}\n#webamp #playlist-selection-menu .select-all {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAUklEQVQI12MIhYMQhvByGAhiCE+DglRHEJshgSEByDYEshPAEMJOY0tgg7MTEOJAUaAOqDjUHKh6hBpk9Qw4xBOwmgN3syFDqLMxFBgyOAnCAQD0WT/cwFbKdgAAAABJRU5ErkJggg==)}\n#webamp #playlist-selection-menu .hover .select-all {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAVElEQVQI12NQQgAGQQRgEAmFghBDBtFyGAhkEC1Lg4BUEDs0lCGAISA0FMwOAEMIO5Q1gBXODkCIA0WBOqDiEABTj1CDrJ4Bh3gA1BwRJHOEEe4HAB23NNar7KHYAAAAAElFTkSuQmCC)}\n#webamp #playlist-close-button.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEU0MCxnXEKGd02ukmX///8tdlhEAAAAKElEQVQI12MwBgIDBkMBBkEgySjIaMBgIKAgACSFnARgbIg4RA1YPQCfwgXpyvsxsgAAAABJRU5ErkJggg==)}\n#webamp #playlist-window #playlist-shade-button.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAFVBMVEVFQTtPSThYVjxnXEKukmW0r4e+sX1mGpZYAAAANklEQVQI12NwAQIHBpe0tBQHBrfUtDAHBmdjY2MHBidjYyMgqWys5MDgqKSkCFQjKCACJEHqAT9eCss1JzHfAAAAAElFTkSuQmCC)}\n#webamp #playlist-window-shade #playlist-shade-button.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAFVBMVEVFQTtPSThYVjyukmW0r4e+sX3BsGNteY1yAAAAMUlEQVQI12MwBgIDBmMBAWEDBkORkEADBiPV0CAgmQom09KUgOJpaYogNYLMQBKkHgD8fwlqtoGUgQAAAABJRU5ErkJggg==)}\n#webamp #playlist-misc-menu.selected .bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAA2AgMAAAB/8csyAAAADFBMVEUvL0RGUF2BkqXt//98VqXeAAAAFklEQVQI12NgYTBhKGHYQmNYArSFBQBn5SMZFZ1KogAAAABJRU5ErkJggg==)}\n#webamp #playlist-misc-menu .misc-options {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAYElEQVQI112OsQ0CQQwEN9qcUiwqADpAvJxOctsC7RPgPyEmmmA9so7NS/0+eaozrJuaQBStUmOFkFVqJOJxIIwH8He/O6VGmLMDv7eO4/HEYfaJ8X9n/1w6HtehdL9sPlWoO+DkW3+GAAAAAElFTkSuQmCC)}\n#webamp #playlist-misc-menu .hover .misc-options {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAYElEQVQI102O2xGAIAwE7ycFOEIDdmAn54xXgpag7Rsembj8LMwSwJZgSVA0OXfUNzhQn3twNadIQehukO/VHaBsutOy6GmjjwdGT2PMaX3eNfmaLnfO3p1+Xn5z1vz/BxcjMYQLzDa1AAAAAElFTkSuQmCC)}\n#webamp #playlist-misc-menu .file-info {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAX0lEQVQI12WOsQ2AMAwEv/qeUSwmADZARGndxCuwPomJTcGlOb0+L6MkF+odnKg2aRuqoj9TNOluxu7mTnf+cvMf3s+d4WOG4JtTSVo4iHSN3PvR+XbyZkE51olgX5IHU8k5In6uSFkAAAAASUVORK5CYII=)}\n#webamp #playlist-misc-menu .hover .file-info {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAXUlEQVQI12WOyw2AMAxDffEAiHYBNmCTIJERYAS6Pq1LKBIvlycrPywDTAMkf9hX5BJsyNfZOZobarlB7s7qLqecv9w1of44IG9rCPacRtLDQbxukau/efrsmcf/N3ldLzugWMN5AAAAAElFTkSuQmCC)}\n#webamp #playlist-misc-menu .sort-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAXklEQVQI102OsQ2AQAwDXaVnlIgJgA0Qr7Ru3iuwPgVJ4Corsk/BaC7EXZwIJXNDCASNmI6gSFI2HSEjaZn53WlEd8rzbiGUR0ZlXzLZL5cHRPt/nv7ZMY41cexL8wCXGToqpM1dFQAAAABJRU5ErkJggg==)}\n#webamp #playlist-misc-menu .hover .sort-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAXUlEQVQI102O0Q2AMAhE74cBjO0CbuAmZyIj6Ai6vtBS6fvpCzmOYkuwJCganDvqOzhQn7tzuSsICuFOpaHS5mIq4cy5Z/9MELvwru62rZG3V2Xy0dPuupepZ83/f5v5MBfSedE0AAAAAElFTkSuQmCC)}\n#webamp #playlist-list-menu.selected .bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAA2AgMAAAB/8csyAAAADFBMVEUvL0RGUF2BkqXt//98VqXeAAAAFklEQVQI12NgYTBhKGHYQmNYArSFBQBn5SMZFZ1KogAAAABJRU5ErkJggg==)}\n#webamp #playlist-list-menu .new-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAYElEQVQI123OsQ2DQBBE0R9NTiknKgB3YIE2nYRpgfYd3PlEwI9esBot5+yg7n9fKqNroxwhRVejLClSNyLQbSm4+3E/dxrlmGC6I2dsJooe9jDGLzvz58b5WUeNfZn9AKbQNSZ12uygAAAAAElFTkSuQmCC)}\n#webamp #playlist-list-menu .hover .new-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAXklEQVQI112O0QmAMAxE7+cGENsF3MBNIngj6Ai6vk3T0uKDwCM5kmAbYBkgqXHuyG/nQH7u4HI3EaRYnW4MByEgvAwE4z/fD0TfSt4QLnp1Fye35iVrtZ+mPev4/wORlyvp1GfF2gAAAABJRU5ErkJggg==)}\n#webamp #playlist-list-menu .load-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAWklEQVQI12MIhYMQhvByGAhiCE+DglRHhvCEtAQGIGRLNQSzwQDOZkBiw8RBqhMg6uHmQNQwpAHlIOw0NhCGsUEQzk6AssG2pmGYA3ezIUOoszEUGDI4CcIBAJZqO86fMyFaAAAAAElFTkSuQmCC)}\n#webamp #playlist-list-menu .hover .load-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAV0lEQVQI12NQQgAGQQRgEAmFghBDBtFyGAhkEC1Lg4BUEDsgNIABCFmhbDCAsxmQ2DBxkOoAiHqYBTBzQoFyEHYoKwjD2CAIZwdA2WBbQWwRJHOEEe4HAE6RMXWXqbP6AAAAAElFTkSuQmCC)}\n#webamp #playlist-list-menu .save-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUvN01OWG5XZHZ5gpaBkqWttMS/zdPt//9STElyAAAAYklEQVQI102OuQ3EQAwDGSl3KYIrsK+Dwy2UTrJswe1fsA880YCgCKltfqpn8VV50i+VhQD1VGEA3FPlQED0VBlAIyfAMfp7Z9zKWjsO7FjueDnThZj5e2f/nGqfc5K6j80fAQw6zDOWMCAAAAAASUVORK5CYII=)}\n#webamp #playlist-list-menu .hover .save-list {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASBAMAAACtCzMeAAAAGFBMVEUAAAALDxYZICpXZHZneYZ5ip6Jmq2tvMRwzsuHAAAAYElEQVQI102O0Q2AIAxE76cDGHEBN3CTM7Ej6Ai6vlwL4iMkL5ejBesA0wDFG8eG5ensWO4rOeUOgiTkdAqP3CK3cKXInFYLlv2+oL2FZqXXRr3ddT5nc+2NvPzmzOP/L+cIMJ5Oo2aQAAAAAElFTkSuQmCC)}\n#webamp #equalizer-window:not(.shade) {background-image: url(data:image/png;base64,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)}\n#webamp .equalizer-top {background-image: url(data:image/png;base64,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)}\n#webamp .selected .equalizer-top {background-image: url(data:image/png;base64,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)}\n#webamp .band {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANEAAACBCAMAAABpaq8qAAABEVBMVEUAxv8SEh0SWwQTEx4XFyQaGigcGysdMBwfIDEhITQqKUIqKkEqmhYsK0MuLUcuLkgvL0ovL0svMiQwMEsxMC0xMU0xMU4yMU4yMk8yMlAzM1AzNFE0M1E0NFE0NFM1NVQ1NlQ2IRs2NVM2NlQ2NlU3N1Y3N1c3N1g4N1g4OFg4OFk5OFk5OVk9dCpCQl1EQTxNTWZYWHJZVjxasCxlmUVoaHhrcC1xzTR3QyiDg5WHd0yJ4jCNjp2QkJCQxz2SkqKTk6OTk6WWrI+ZmaidpDWfn62k4jipmGWrrZCtLSOvk4yvwziwcR3DcCrE2zLFVCrFhzDGeA/GszXOxtbTIhvTSR/cdx/gVB7gkijgsijgzTBk+3VYAAADm0lEQVR42u3bX09bNxjH8a8fP/lTombrhEC01TSkSuNik/Ym9q73XnKxqVs6VnUbNIFzbPcikNiIk4ZCIY4eXyB98OGIn+JjB4Wf+0aZN0l1KL5p4q+/VU91wqW0YXR0qsEnnHApPyJpUz5/dRe+4eJrU70nBjgaeG2jw3viyYTjYUaIOfs4t+KrtXwTSo75cBd+bO5OFSH+NAHtBfEREeIEJj+v2KeY7UPqZVTabjoFWXF4yV7TyfGAb88L8gVU8TCByS+hl5wgHgB8N5U2o4Lm1OLiQcDH7GeHzH0nB57B/N4U59zid+459Y7PU0E3vvgJqKpcDRdEqJ8iIVwJxVE/ld51QInaUj9l9Yo5glA/ZRlv+aVySlh+A6dQPxV3lfJqH6+esnyqHJDtE9VScRSjekoxFaifslOvz+qRupajfkqRTqmf4rxfPlIO6me5M+zC2MFEu3Yc2aqzRJbIElkiS2SJLJElskSWyBJZIktUT6JUun7u9KqL5UytFGIswlVPTalYjvVTs+crpET9LHaG1FI/7YTd/qHF+eSpn7JchiFBS/3UlJbHVFrshJXz+l8CiZAaqJ/Slu/56qcsT9wU8In6qeH6E7LkUhupn5r84kxypJZI/ZTUtg7AN8kHqJ8SQ9BjOBFPmwK38BJcxgCDjfkR2JgX0N6fGhMix4Nns1ZjhJgQOWGc0xVs2NNuxou1nLN31sn3eDe7NzW2DKZHvXYW274/Y8HhbB2bpptvP8Phv2uYhtyfGgQNfwBeIFA/Nfv7opXEDnDnhtvNRtUDNpteHzJ7Wuo9uksLHvA+4+H+3XgaunnINOcL2IQqQnwN4z+zdtK4LCut5UvhYLrivvLdP910JWG/nM15CIfvMvbpZ3wxgg+3UW9pNo2HMN+UDJjljaryVjfonhUX06NZM3ujfsW6ntcIRv9/YaPqBgXkcTpTIjlHMLJGlTWqrFH1lWiNqu2nNaq2n9ao2n5ao2r7aY0qa1TZJ8sPkMgaVbbqLJElskSWyBJZIktkiSyRJbJElsgSPVUia1TVtOqsUYU1qh6H1qjaftoJu/3DGlXbT2tUbT+tUWWNqsenNaq2hg5cd6PqPzjP2kl34l8l38GsmwkuM55C0z07LZtclzHGjGflxefLW+mijjQo2kmezTn/u2g2zeczf97J30fPc86mB8Xs976YnceQ3fntDyVf9ptbqQ9XZdqA06NUclpQhg9Aa1RtPz8But0Pz3B64+AAAAAASUVORK5CYII=)}\n#webamp .band .slider-handle {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALBAMAAABbgmoVAAAAGFBMVEUAAAAICBApKUJKWmt7hJSLm6etvcbd5ukLNggsAAAAMElEQVQI12NQZGBgYFRgEC8vLy8WYBBPS0tzRqIExXDyQlxcQJQxEAgwAE1hFFQAAB9KDSykox1vAAAAAElFTkSuQmCC)}\n#webamp .band.winamp-active .slider-handle {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALBAMAAABbgmoVAAAAD1BMVEUAAAApKUJKWmvd5un5/v8UiEZ+AAAAJ0lEQVQI12MQYAACAQZmY2NjIwYGZiCHCYlyccDNg1BKQAAyAGQKAHJPAsUS1KniAAAAAElFTkSuQmCC)}\n#webamp #on {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAMBAMAAACO67B7AAAAIVBMVEUAAAASWwQvN01KWmtSZnN7hJSLm6ettca9ztbV3vL5/v8M+RL1AAAATklEQVQI12MoRwIJDFWr4GC5A0NVBxyUGjBUNRsbdzRpNHVoQHiCkh0aTU0aKDwlKG/mTBCvCcID6UfoQzUTYTmQV54aCgcGDCnGCGAAAPUyQLvRdOj2AAAAAElFTkSuQmCC)}\n#webamp #on.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAMBAMAAACO67B7AAAAFVBMVEUICBASWwRSZnNje4R7jJyLm6etvcYvdU+XAAAAQElEQVQI12NgwAdMXODAgYHBLQ0OEoA8VDkgdnFgcXBhgfAERV1YHBxYUHgMUF5oKIjnAOGB9cP0maGYqYDkEgAFZxmn+1/+wgAAAABJRU5ErkJggg==)}\n#webamp #on.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAMBAMAAACO67B7AAAAIVBMVEUAAAAA1gAvN01KWmtSZnN7hJSLm6ettca9ztbV3vL5/v911B9qAAAATklEQVQI12MoRwIJDFWr4GC5A0NVBxyUGjBUNRsbdzRpNHVoQHiCkh0aTU0aKDwlKG/mTBCvCcID6UfoQzUTYTmQV54aCgcGDCnGCGAAAPUyQLvRdOj2AAAAAElFTkSuQmCC)}\n#webamp #on.selected.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAMBAMAAACO67B7AAAAFVBMVEUA1gAICBBSZnNje4R7jJyLm6etvcapTzEQAAAARElEQVQI12MQRAYMaDwTFzhwZBB0S4ODRCAPVc5RUNDFUcTRRQTCY2B1EXF0FEHhCUJ5oaEgniOEB9YP02eGYqYiklsAdNMdgDKFw2kAAAAASUVORK5CYII=)}\n#webamp #auto {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAMBAMAAADxOqKKAAAAHlBMVEUSWwQvN01KWmtSZnN7hJSLm6ettca9ztbV3vL5/v/WADVeAAAAV0lEQVQI12NIQwWpDJkzUUAyQ2Y5MihzYsgsUlIqLxQvLBcXFC8UBwswcJSLFwIFQAgmICiILNDRgaoCZBaQI1heWA4xA8MWVIc5MaSFuCADJ4ZgJVQAABsNRRhxaDvQAAAAAElFTkSuQmCC)}\n#webamp #auto.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAMBAMAAADxOqKKAAAAFVBMVEUICBASWwRSZnNje4R7jJyLm6etvcYvdU+XAAAAS0lEQVQI14WOsQ2AQBDDAh8GYKMUHgF6ihP7j0CFxF+DS8tSIv0ymIh8T1xy9aIkI5wIEbmW/Qh2cPAr9BXb2QogOMaIaPSVtR19ACp1H3+cU6+ZAAAAAElFTkSuQmCC)}\n#webamp #auto.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAMBAMAAADxOqKKAAAAHlBMVEUA1gAvN01KWmtSZnN7hJSLm6ettca9ztbV3vL5/v+vLTjBAAAAV0lEQVQI12NIQwWpDJkzUUAyQ2Y5MihzYsgsUlIqLxQvLBcXFC8UBwswcJSLFwIFQAgmICiILNDRgaoCZBaQI1heWA4xA8MWVIc5MaSFuCADJ4ZgJVQAABsNRRhxaDvQAAAAAElFTkSuQmCC)}\n#webamp #auto.selected.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAMBAMAAADxOqKKAAAAFVBMVEUA1gAICBBSZnNje4R7jJyLm6etvcapTzEQAAAATElEQVQI12WOwQmAQBADtwSjsaDAlKAFCIf9l+BL8NZ5DgNJqVE/sTGR8j1xlUcvhmSEEyFSHksdwQ4OfoW+Yj9bAQTHGJHa+sranj59DSTnUdDwigAAAABJRU5ErkJggg==)}\n#webamp #eqGraph {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAAATCAMAAACQnBKzAAAAw1BMVEUqKUEqKUIqKkMrK0QrLEQsK0MsK0QsLEUtLUYtLUgtLkctLkguLUcuLUguLkcuLkgvL0ovL0swL0owMEsxMU0xMU4xMk0xMk4yMU0yMU4yMk0yMk8yMlAzM1AzM1IzNFE0M1E0NFE0NFM1NVQ1NVY1NlM1NlQ2NVM2NVQ2NlQ2NlU3N1Y3N1c3N1g3OFc3OFg4N1c4N1g4OFc4OFg4OFk4OFo5OFk5OVk5OVpsbH5vb4JxcYZzc4hzc4p0c4p0dIt1dYwbWqB2AAAC2klEQVQYGQXBIQ9lSRkFwDpf930zCQqBxaLQ/H+PRuDXrCQkbObd7kNVzD/+qSay+fu/BDL87d/MMtL5628iiP2X31cQ5M//6cp3nrJ//u+upgM//2gAfv7BO6aOP/33ndQx4HVJMQGeXnSgB0/V/lWicJvObrKOrDNJCwJQ1XVzz1F3DxYTsaHBBbx7MIhsfDNHfwSNlE8vuCO8V7QAEJGzTnSlYxL3nojNJkVC+NRLGtoC8wjSIOl9Z2NJ3syeugkAwLvjyFtMl6FaGhoGyK/HZ1SX20D2CzQN+nn3vK8eOoaxAFC0vKxplMlx14qEucCdC10XJquy4/Ho/gKmbO/Mu5/sGQZcAAhN7tr1Jk3cWcu6EM4rGCbBXNdwouX72M0DgXizjh19T6S9twBASU1a+632nn2wiPIgCLDfTViHDV52oFHo+4Oy35M6Ww0KEBXlOilu9uKs6AMCHYH3McpZdQe29gshzE17tlSWZLkDAkCKhnV4wxwW8t4ZCqUAZC8xeL5yLihY6Xx3NGfclqEAgLg30dPcW3dcNzBCigBAigvI95kPSMp36Udti+be6kkBoK0knVTXJzKLwnYgzBAea8Y0hwGery9I2vjkheSMe5iJjABwG5G0Rm6v27ksCXNfEMDXoLHSAq/nM0grfDs+r46LIUgLwKRoj1wd5TOzSG2ZLUgFmCu1dALPd7sFSVDXO3L1rDWARAElTmXuEe5qf8290uDdUqZDyHJnJAfwePrc7wtVsz+SPdou5xwKCCDK0pNFuehkkaI0dC7YXDe6kzP4ft/j+bGJ4J5fH4WIZSnXBYBGxDrvgt2MPRW2hhB30nDHIHTw4OXXD9BBn3yCNF3W62aNAYA7Dtfc4867j2sOxBkCiWIGUsrw5bXyA9FRJj0SzVJZ9qK3ANqRvWql7crWMitq27OBlNAro0E6+OKeF6Sy7XOPNhk3CmQCIORWVk/inPcO/g8Gk8tpHAw47gAAAABJRU5ErkJggg==)}\n#webamp #presets {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAMBAMAAADrBkIEAAAAGFBMVEUvN01KWmtSZnN7hJSLm6ettca9ztb5/v8/TtPPAAAAXUlEQVQY022PsQ2AQAwDXblnlBcbwAYI9K0bbgXWpwAEErnSuii2topV/ShY1PmzN3UiZOQIWY7uGDsBEwj+2pHjyCF+bJwACdfBGyNfD9Bt102qOU3bPP5pmoaKE9BgTHfswQ68AAAAAElFTkSuQmCC)}\n#webamp #presets.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAMBAMAAADrBkIEAAAAElBMVEUAAAAICBBSZnNje4R7jJytvcYlh7IyAAAAW0lEQVQY03WPsQ2AMAwEv/gFMgI7QP+RLgNQsP8qFAGBlOTK01m2VaZopXdGqkq7Rk6VtqiJkJEjZDl6NHYCJhD8ryPHkUP81jgBEvrAp5H7AmSqyjG/ZJt9eQMWOi9EkrQa+gAAAABJRU5ErkJggg==)}\n#webamp #preamp-line {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAAABCAYAAADpXEERAAAAE0lEQVQoU2Pcdfruf4ZRMKRDAAD1lwNjTqcaUQAAAABJRU5ErkJggg==)}\n#webamp #equalizer-window.shade {background-image: url(data:image/png;base64,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)}\n#webamp #equalizer-window.shade.selected {background-image: url(data:image/png;base64,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)}\n#webamp #equalizer-volume.left::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAE0lEQVQI12PYwPCF4QcYfmHYAAArXgYxq2vCDQAAAABJRU5ErkJggg==)}\n#webamp #equalizer-volume.left::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAE0lEQVQI12PYwPCF4QcYfmHYAAArXgYxq2vCDQAAAABJRU5ErkJggg==)}\n#webamp #equalizer-volume.center::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAQMAAAD3d2XqAAAABlBMVEWjlGrsznoPowceAAAADklEQVQI12NwYHgAhw4AIi4E4a+iLsYAAAAASUVORK5CYII=)}\n#webamp #equalizer-volume.center::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAQMAAAD3d2XqAAAABlBMVEWjlGrsznoPowceAAAADklEQVQI12NwYHgAhw4AIi4E4a+iLsYAAAAASUVORK5CYII=)}\n#webamp #equalizer-volume.right::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAEklEQVQI12OwYKhh2AOGNQwWABlSA52dOQTnAAAAAElFTkSuQmCC)}\n#webamp #equalizer-volume.right::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAEklEQVQI12OwYKhh2AOGNQwWABlSA52dOQTnAAAAAElFTkSuQmCC)}\n#webamp #equalizer-balance.left::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAE0lEQVQI12PYwPCF4QcYfmHYAAArXgYxq2vCDQAAAABJRU5ErkJggg==)}\n#webamp #equalizer-balance.left::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAE0lEQVQI12PYwPCF4QcYfmHYAAArXgYxq2vCDQAAAABJRU5ErkJggg==)}\n#webamp #equalizer-balance.center::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAQMAAAD3d2XqAAAABlBMVEWjlGrsznoPowceAAAADklEQVQI12NwYHgAhw4AIi4E4a+iLsYAAAAASUVORK5CYII=)}\n#webamp #equalizer-balance.center::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAQMAAAD3d2XqAAAABlBMVEWjlGrsznoPowceAAAADklEQVQI12NwYHgAhw4AIi4E4a+iLsYAAAAASUVORK5CYII=)}\n#webamp #equalizer-balance.right::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAEklEQVQI12OwYKhh2AOGNQwWABlSA52dOQTnAAAAAElFTkSuQmCC)}\n#webamp #equalizer-balance.right::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU5QE1jXjujlGrsznokh70QAAAAEklEQVQI12OwYKhh2AOGNQwWABlSA52dOQTnAAAAAElFTkSuQmCC)}\n#webamp #equalizer-shade.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEVKQT5SSj1sXUO0kWO/uX6z+JYEAAAAM0lEQVQIHQXBwRGAIAwAsLT07Z2zsP8qbuDBAliTmDjl1m8Gob6HK5uWti27V6uxDDFxfn1PDx8P0VYSAAAAAElFTkSuQmCC)}\n#webamp #equalizer-window.shade #equalizer-shade.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEVKQT5SSj20kWO/uX7CsWHebnl7AAAALUlEQVQI12NQAgIFBiUGBiYFBgVhYwMFBkVhY0Mg6QwmXVwEgeIuLgIwNWD1AJzCBeFqt4OOAAAAAElFTkSuQmCC)}\n#webamp #equalizer-window.selected #eq-buttons.clicked #equalizer-close {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAFVBMVEUpKUI1LxJZVjxkW0SHd0ypmGX5/v9OYEDlAAAAJ0lEQVQI12NgAANmRUFlBgamYOUgBgZGU1dDIKmSoghjQ8QhasAAAHO7BEc0qEt/AAAAAElFTkSuQmCC)}\n#webamp #equalizer-window.selected #eq-buttons.clicked #equalizer-close.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAElBMVEUxMC1ZVjxkW0SHd0ypmGX5/v/v3/6CAAAAKUlEQVQI12NwAQIHBicBBiEHBkcmIUYHBgcFAwUgKRwsAGNDxCFqwOoB1gEH67W94+0AAAAASUVORK5CYII=)}\n#webamp #equalizer-window.shade.selected #eq-buttons.clicked #equalizer-close {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAALVBMVEUoJz4oKD8pKUAqKUEqKUIqKkMrK0Q6MSljXjtsXUORbkq0h2O0kWPCsWH///8vo79mAAAAO0lEQVQI12NIdTFWUmDIbC/vFGCI2Nl5QoAhfM6a6UCy61U7A4P7nLVAdsTJzhsMDJ5ANQwMLkaKCgwA6D4RaTQt0CAAAAAASUVORK5CYII=)}\n#webamp #equalizer-window.shade.selected #eq-buttons.clicked #equalizer-close.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAElBMVEU6MSljXjtsXUORbkq0kWP////9IyyfAAAAKUlEQVQI12NwAQIHBicBBiEHBkcmIUYHBgcFAwUgKRwsAGNDxCFqwOoB1gEH67W94+0AAAAASUVORK5CYII=)}\n#webamp #position {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAAAKCAMAAACuVWMrAAAByFBMVEUPDxgPEBkQDxgQEBkRERoREhsSERsSEhsTEx0TEx4TFB4UEx8UFB8VFSEVFSIVFiEVFiIWFSEWFiIXFyMXFyQXGCUYFyUYGCUZGSYZGSgZGicZGigaGSYaGSgaGicaGikbGyobGywbHCsbHCwcGyscGywcHCsdHSwdHS4dHi0dHi4eHS0eHS4eHi0eHi8fHzAfHzEfHzIfIDEfIDIgHzEgHzIgIDEgIDMhITQhIjUiITUiIjUiIzYjIzcjJDgkIzckIzgkJDckJTklJTolJTwlJjslJjwmJTsmJTwmJjwnJz0nJz4nKD4oJz4oKD8pKUApKUIpKkEpKkIqKUEqKUIqKkErK0IrK0QrK0YrLEUrLEYsK0UsK0YsLEUtLUctLUgtLkctLkguLUcuLUguLkcuLkkvL0ovMEswL0swL0wwMEswMEwxMUwxMU1hYm1iYW1jY29jY3BjZHFkY3FlZHFlZXNmZXRmZnNnZnVnZ3ZoZ3VoaHVoaHdpaXhpaXppanlpanpqanlqanpra3xrbHxsbH1sbH9tbYBuboBvboFvb4NvcINwcINwcYVxcYZxcoZycYdycodzc4hzc4pzdIp0c4p0dIt1dYwExkcuAAACuklEQVQYGQXBAWEANxADMPmSFsOAjT+QNX+eFEYgZicIBCMQMBlphNGBIJgZQLjId3bmPtcHfncAkIZoAAAAAECBAuy7Hsfb2dnuwEPB7qKawjer1OYBhR0jAFMAFQIAQRJsAjSBnQUJF74aHp+DuQAgDVEAAAAA0EIVAPvgy7BSeLTgWUChFhr5QAsS/jFumXD3NrlkiGDOkNnJbGJigksiOHuIuyYmFdzxMmaH3/9+GHvAqKPTkMKgAQCbziLV77xZCiv/AZY+qB2bv/Oofmn5+1mPWnm0fPieUjVG5pZJMZJ9aqXB75nFTm3qxgAsxZ5SxrBNcN/uGQz256vdKdg5+aRBMSAAAFlorc0OCQtg11sXYnbtobUU7nJJ1FA+1D3QmNQZjHKXmptFA3+LmAzGK3D1OyAjxDo1swV0Abc95UQZY4toTBKjAAqgE1qdo5YW/HFh/OSBMuBiBLx97+GTtxrf0NVHpSbxHki4w65eI8GECWoGluBxP0gg7iQwgTdmAF9nx6iwmeecpNK0aVdQEKWKLch+MxB4zvVgAbCr3vewCp+5QKpU6FKASaQM7oWZ3y9vBPTMgtCMeyjoOzBN4fGZ3YDfmWVA7zcmpTjvWpVSVkYRQAiTgXxfp4uqrJt92KUPAJun+FJwAkpHFAsvoLuD81MLrLqSSwOHCRM2jBnhXi7iGxH3rmEGWH8H4P4NKglchgoTkwUA0M3aqJ67pgt8w9+MNcjlgcV3oaelLA/7bSgahUfBrBkMnlHoR1LMM0Ew7HQFfDcgi3pzQYB1i+HKDxbg+8yXENasqQAASbNa5c1OhjRr/d3HWNiF2tHOg1ShO6hxPCld4S8IuOPfCIjpIJiaHdMDaXL2QJAQEAYEGCKAEQRpgLGGaBoBAABomkIrWkAVbIFSNkVhU4raFMWbLYV2WcX/K67c097eK2wAAAAASUVORK5CYII=)}\n#webamp #position::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAKBAMAAAC6bkgfAAAAJ1BMVEUJAgJlZXNlZnN1WyKDaTCNdTqcgkqvmGHFsn7by57u4rv06sf19fW6wGFFAAAARElEQVQI12PQnIkMAhgkXZDAUQYGSY/dcLCnFMj3PgMHp8F8YziwBvPL4aAaxPdB6N8G4p9CyJebAvmhyICBQYABBQAALnc7YhsUgeUAAAAASUVORK5CYII=)}\n#webamp #position::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAKBAMAAAC6bkgfAAAAJ1BMVEUJAgJlZXNlZnN1WyKDaTCNdTqcgkqvmGHFsn7by57u4rv06sf19fW6wGFFAAAARElEQVQI12PQnIkMAhgkXZDAUQYGSY/dcLCnFMj3PgMHp8F8YziwBvPL4aAaxPdB6N8G4p9CyJebAvmhyICBQYABBQAALnc7YhsUgeUAAAAASUVORK5CYII=)}\n#webamp #position:active::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAKBAMAAAC6bkgfAAAAJ1BMVEUgDABhRhBmSxNsUBdwVRt4XSGBZyqPdTmhhkuwmF6+qG/DrnXYxZOv4MtwAAAAR0lEQVQI12PwnIkMAhg8XZDAUQYGT4/dcLCnlIHB0vsMHJwG85XgQBvML4eDaiBf0wehfxuIfwohX67KwCAZigwYGAQYUAAAXWI7mESGeYIAAAAASUVORK5CYII=)}\n#webamp #position:active::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAKBAMAAAC6bkgfAAAAJ1BMVEUgDABhRhBmSxNsUBdwVRt4XSGBZyqPdTmhhkuwmF6+qG/DrnXYxZOv4MtwAAAAR0lEQVQI12PwnIkMAhg8XZDAUQYGT4/dcLCnlIHB0vsMHJwG85XgQBvML4eDaiBf0wehfxuIfwohX67KwCAZigwYGAQYUAAAXWI7mESGeYIAAAAASUVORK5CYII=)}\n#webamp #shuffle {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAPCAMAAABDVWaoAAAAilBMVEUQWgAqKUIqKkEqKkMrK0QsK0MsK0QsLEUsLEYtLUcuLUcuLUguLkkvL0ovN00wL0swL0wwMEsxMU0xMU4yMU4yMk8zM1A0M1E0M1I0NFE0NFM1NVQ1NlQ2NVM2NlU2NlY3N1c3N1g3OFc4N1g4OFk5OVpKWmtSY3N7hJSElKWttca9ztbV3vLv///LbncEAAAAqklEQVQoz5WSsQ7CMBBD37WpGPgDpJtY+/8fAxLLfUbVM0OiNgKG4CGKL45jRbYbiSUIkBAiMZJEqI2EMjGYynVhHHoWmIfle1IEOeqeogCwAQwFq3oesIoADyfaAt4mBHivb/Av5h8nRQCslQVOHPrK/Nif/ouaSdDd+OlvXYDD2qOP1r9j98s8/p/5KlarMIoCu/SPXvmf/yb2SQJkotZD087Z2VrcBIM3KB9V4lGQbMMAAAAASUVORK5CYII=)}\n#webamp #shuffle.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAPBAMAAACGpYupAAAAGFBMVEUAAAAICBAQWgBSa3Nje4R7jJyPn6itvca8iDuFAAAAY0lEQVQY02MQxA4EGHBLuIZighBDoER4ORYQCJLAoiMUIiEoKIpdQkgpNYAhIJSVNQBIARkBDEgSoRCJUAiESoilgXQwYOoAgQBsOkDiIDsCWMHCDCg6sLoKh4Q7LglD7IEIAKjwVurEkbm9AAAAAElFTkSuQmCC)}\n#webamp #shuffle.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAPCAMAAABDVWaoAAAAilBMVEUA1gAqKUIqKkEqKkMrK0QsK0MsK0QsLEUsLEYtLUcuLUcuLUguLkkvL0ovN00wL0swL0wwMEsxMU0xMU4yMU4yMk8zM1A0M1E0M1I0NFE0NFM1NVQ1NlQ2NVM2NlU2NlY3N1c3N1g3OFc4N1g4OFk5OVpKWmtSY3N7hJSElKWttca9ztbV3vLv//8gEwg9AAAAqklEQVQoz5WSsQ7CMBBD37WpGPgDpJtY+/8fAxLLfUbVM0OiNgKG4CGKL45jRbYbiSUIkBAiMZJEqI2EMjGYynVhHHoWmIfle1IEOeqeogCwAQwFq3oesIoADyfaAt4mBHivb/Av5h8nRQCslQVOHPrK/Nif/ouaSdDd+OlvXYDD2qOP1r9j98s8/p/5KlarMIoCu/SPXvmf/yb2SQJkotZD087Z2VrcBIM3KB9V4lGQbMMAAAAASUVORK5CYII=)}\n#webamp #shuffle.selected.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAPBAMAAACGpYupAAAAGFBMVEUAAAAA1gAICBBSa3Nje4R7jJyPn6itvcZs8alFAAAAY0lEQVQY02NQwg4UGHBLuIZighAjoER4ORYQBJLAoiMUIqGkpIpdQlEwNYAhIJSVNQBIARkBDEgSoRCJUAiESqilgXQwYOoAgQBsOkDiIDsCWMHCDCg6sLoKh4Q7Lgkj7IEIAGMfXXXsp3orAAAAAElFTkSuQmCC)}\n#webamp #repeat {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAMAAADAkV+TAAAAeFBMVEUQWgAoKD8pKUApKkEqKUEqKkEqKkMrK0QsK0MsK0QsLEUsLEYtLUcuLUcuLUguLkkvL0ovN00wL0swL0wwMEsxMU01NlQ2NVM2NVQ2NlU2NlY3N1c3N1g3OFg4N1g4OFlKWmtSY3N7hJSElKWttca9ztbV3vLv//8ki4GoAAAAgUlEQVQYGQXBMQ7CUAwFMP+SzkgoO1vvfyQOgJBYWKB52OsOQpIVSJaZTdTnCgAAIDUuAACAcwoDAAAyKfCFHQBAAQ+OyO8NGlAAkL3Bs4Fa4AAvGgAqsAfQAKAWAPQTNKACgNYAoBYBAAAozgQAAFAyAQAAWLeRNSQRmS3j3GTCH4ZgNtlEi15VAAAAAElFTkSuQmCC)}\n#webamp #repeat.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPBAMAAAAFYbKSAAAAFVBMVEUICBAQWgBSa3Nje4R7jJyPn6itvcb4vicLAAAASElEQVQI12NgwA9MXODAWYGBwS0NARyAXISsC5jLwMCCzGUUDAHpYkFwnUBSUC5raIgDA4ILkmFB5Tog9KJZhMI1Q+UqIHsAAPs1JqMDCtK2AAAAAElFTkSuQmCC)}\n#webamp #repeat.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAMAAADAkV+TAAAAeFBMVEUA1gAoKD8pKUApKkEqKUEqKkEqKkMrK0QsK0MsK0QsLEUsLEYtLUcuLUcuLUguLkkvL0ovN00wL0swL0wwMEsxMU01NlQ2NVM2NVQ2NlU2NlY3N1c3N1g3OFg4N1g4OFlKWmtSY3N7hJSElKWttca9ztbV3vLv///lInoXAAAAgUlEQVQYGQXBMQ7CUAwFMP+SzkgoO1vvfyQOgJBYWKB52OsOQpIVSJaZTdTnCgAAIDUuAACAcwoDAAAyKfCFHQBAAQ+OyO8NGlAAkL3Bs4Fa4AAvGgAqsAfQAKAWAPQTNKACgNYAoBYBAAAozgQAAFAyAQAAWLeRNSQRmS3j3GTCH4ZgNtlEi15VAAAAAElFTkSuQmCC)}\n#webamp #repeat.selected.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAPBAMAAAAFYbKSAAAAFVBMVEUA1gAICBBSa3Nje4R7jJyPn6itvcYox7XLAAAATElEQVQI12MQRAEM6FwTFzhwVmQQdEtDAEcgFyHrAuYKCoogcwUYQpwVwWIwrhNICsoVDQ1xFERwQTIiqFxHhF40i1C4ZqhcRWQvAAA51isA/VWazgAAAABJRU5ErkJggg==)}\n#webamp #equalizer-button {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMCAMAAAC+5dbKAAAAUVBMVEUQWgAqKUIqKkMrK0QrLEQsK0MsK0QsK0YsLEUsLEYtLUcuLUcuLUguLkkvL0ovN00wL0wwMEsxMU1KWmtSY3N7hJSElKWttca9ztbV3vLv//9O4LHRAAAAaUlEQVQYGQXBwQ2DUAwFMEODRCao2H++HnrKofBf7e0NAAD5lhcAAM+6iwUAkJVXwQ8Ho42GVeDjimmmTSM7AGYAKHCBhmmww5GEntHTAykCcIozZ6A8CQAAqawAAEDda/NgbZFErMfuD041NCuZPULmAAAAAElFTkSuQmCC)}\n#webamp #equalizer-button.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMBAMAAAB7FTvLAAAAIVBMVEUA1gArK0QvN01KWmtSY3N7hJSElKWttca9ztbV3vLv//9R/wqlAAAAT0lEQVQI12Moh4MyAYaqVTBQAuR0QEF7MIhjbNzRpNGkAeEYcHZodGg0wTlKGjCO5UyQDFQZEAD1QGTg9gA55amhUADkpBjDgQCDIAIIAAAWsDNHmvvPEQAAAABJRU5ErkJggg==)}\n#webamp #equalizer-button.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMBAMAAAB7FTvLAAAAGFBMVEUAAAAICBAQWgBSa3Nje4R7jJyPn6itvca8iDuFAAAASElEQVQI12MQRAABBhSOgGsoFAQDOeHlUFAK4sBkQsEcQcHQANYAVghHSC2UNZQ1AM5hYIVxxNJAMlBlQADUA5ZxRzbNEOECAM5YHW8MP5O/AAAAAElFTkSuQmCC)}\n#webamp #equalizer-button.selected.winamp-button {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMBAMAAAB7FTvLAAAAGFBMVEUAAAAA1gAICBBSa3Nje4R7jJyPn6itvcZs8alFAAAAR0lEQVQI12NQUIIDBQZUjmsoFAQDOeHlUFAK4sBkQsEcJaXQANYAVghHUSyUNZQ1AM5hYIVx1NJAMlBlQADUA5ZxRzYNyQUAEUAg+7nvOG8AAAAASUVORK5CYII=)}\n#webamp #playlist-button {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMCAMAAAC+5dbKAAAAUVBMVEUQWgAjIzgkIzckIzgkJDklJTolJjsmJTwmJjsnJz0nKD4oJz0oJz4oKD8pKUAqKUEqKUIqKkEvN01KWmtSY3N7hJSElKWttca9ztbV3vLv//+EzjHeAAAAXklEQVQYGQXBgRHCMAwEMLk4WYFj//nKAOHqR6o3AADk214AADyjGQCATKrhh+WwzwZygfve2ADUBYADwDT4gA2AhhUAxwZNACssAtqTAACgMwEAwPRRI5GpmTIhUX81UygSftVjhQAAAABJRU5ErkJggg==)}\n#webamp #playlist-button.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMBAMAAAB7FTvLAAAAIVBMVEUA1gArK0QvN01KWmtSY3N7hJSElKWttca9ztbV3vLv//9R/wqlAAAASklEQVQI12Moh4MyAYaqVTBQAuR0QEF7MIhjbNyhpKEB5RhwdmggcxAyljM7NDpgHCDQAMqBOXB7gJzy1FAoAHJSjOFAgEEQAQQAwMcyRToQk0kAAAAASUVORK5CYII=)}\n#webamp #playlist-button.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMBAMAAAB7FTvLAAAAGFBMVEUAAAAICBAQWgBSa3Nje4R7jJyPn6itvca8iDuFAAAARElEQVQI12MQRAABBhQOo2soFDgDOeHlUFAK4sBkQsEcQcFQBlZWKEdILZQVmYOQEUsLZQ2FcYCAFSgH4rgjm2aIcAEAbLsb8tZoQy8AAAAASUVORK5CYII=)}\n#webamp #playlist-button.selected.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMBAMAAAB7FTvLAAAAGFBMVEUAAAAA1gAICBBSa3Nje4R7jJyPn6itvcZs8alFAAAARElEQVQI12NgUoIDBQZUjmsoFDgDOeHlUFAK4sBkQsEcJaVQBlZWKEdRLJQVmYOQUUsLZQ2FcYCAFSgH4rgjm2aEcAEAZCcevKaFFFgAAAAASUVORK5CYII=)}\n#webamp #title-bar {background-image: url(data:image/png;base64,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)}\n#webamp .selected #title-bar {background-image: url(data:image/png;base64,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)}\n#webamp .llama #title-bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARMAAAAOCAMAAAA7SAh7AAACW1BMVEULFRIMDAwNDRQOFQsPDxcQEBkRERsTEh0TEx4TFB4UFBQUFB0UFB8VFSAVFSIVFiEWFSAWFiEWFiIXFyQXGCQYFyUYGCUZGSYZGicaGScaGSgaGicaGigbGyobHCscGyscHCsdHS0dHS4dHi0dHi4eEQoeHS0eHS8eHi8fHyIfHzAfHzIfIDEgIDEgIDMhITQhIjQiITQiIjUiIyYjIzYjIzgjJDcjJDgkGwkkIzckIzgkJDklJTclJTolJjsmJTsmJjsmJj0nJz4nKD4oJz4oKD8pKUApKUIpKkEpKkIqKUEqKUIqKkEqKkMrK0QrLEQsIx8sK0QsLEUtLD0tLUctLUgtLkctLkguLUcuLUguLkcuLkkvL0ovMEsvMSUwL0swMEswMEwwMUAxMU0xMk0xMk4yMU0yMU4yMk8zM1AzNFI0MCw0M1E0NFE0NFI1LRA1NVM1NVQ1NlQ2NVU2Nkk2Nk82NlU3N1Y3N1g3OFc3OFg4N1c4N1g4OEw4OFk5OUc5OVo7O1U9P0w+PlpAQF5CNhtDQ1NDQ2BFQTxGQh9HR2RJSVlOTl9PTmdRPhtRUWxSSj1VVW9ZWXNaVzpbW2JdUCldXWdgYGpgYHliWkViYm5kZHJmZnVnZ3xoWTVpaHdqanpqaoBqe3trXUNra3xsbH5uboFuboZwcINwgY9xcYZzc31zc4hzc4pzk5p0dIt1dYh1dYx3d4F4eIt6eo9+fo+AgJSBl42EhI2Gd02IiJeJlZqPj5+QkJCUlJ6VlaaZc0KdnaiggTSgoK+lpauoqLOtrbivr7y2nFRq7ap0AAAHC0lEQVQYGQXBbayehVkA4Ou+n+ct7U7LaUGggOfs4FpwdKUZ/eDDoJjRLCtm0x9+TX9pTPxhkDDnTPzh/GGyRKPYGGPUmAwzk63JEhHIMkYmiFgOlYrYoptCoaOUMvpJ21PO+9631xUJkAAEECCAMILoNALBABiiIxGSjiAgmERWCjAQZEdAEqMgQMoydLRAAIQOIahBEwCgo+nOAh0NoFHZigKtsVpZaJWlMYtuFNNhtcFoPwAgAQABwACAAIAADAABGEEACCABSABIQACyEpAqS1IJAKCyskBlZQEdDQUABVCABmgwBV8e+ZLoQBAiBSE7hayxMgIGAlchRdaAIMPQExGychAYCMKalgRDJIyRwSCENHbUQBigRlJkG6cjghHdkUhSJZUAAChZUDQdpuNUg9VGUZh1tFaltFnOtKpqxSyroktPacl0Ni2AIQVBJ8hZhEYUSEAnQiJ7UkgZhYgqBBVKGMZQZZwE3cygzGYSzMgcgWpGIowjRSSyqEokAIACAKLCtKfATEaoVBVmtNapiDbTmAVJ6+jSoEYw8NQ+oitS9PUAAGCFHAARQAZk6EohQAaMXSGApMRYGQyCNAAMoZLEZBXAdFQZgRoBUAkAKlPJIkuWrsRk2hE96y5NlnwGAPdmtRdgz7Qnq59fnaxO/n7GLxzaz0O7HpMj42zkO1956kFCiL7h4SUAABx7dEX/ye9+4av7fvI/f2w9nvu6+M1tXHn+nx7F0cd2/5xv/etn7j36Db4494d+a+O/PfeFD/427Nj7/lcfvvR3v3b87D2vffdX1v/1/VtfvGYrqy++fvuOyeor3+/Kz85hedvcNz6655glPEH+9Nw/jq7ffexIyltunT7t40sOrt7n+FF7Np1Z9unjR29bzIuvnsH06vv8y7lY3DZOj7yxeftcvXX45j3HTu1Z3vPGQU8/vATg2KN3i+evheVdPf38Bvilr+mzOx5ixyF6ZIbvfOV/MECHLQAAsAW/s/YXP3Yrvth/9cGXZDTP/vsje77lwh/htum4+Dw6gjEP/PrOm/IQXrn/6nty/cL6swDw4vm9n3h95/TpHz2jRo/75YtP2ibA8okRMwYwlrqxxk3nBrZeAvM1z0XzSxeWF85BLlQunO/t9cyNP7Rt7oVxOjvv1KXpdIW2BYAtcO1d8KKcPgtoD/3ZjrMbX9n/QPfIAHv3evJ/2fKzgm/CBQAA0keuWrMFlaCCXbu809b9/utf71uOL9wSCI1677/u+OhrLyfeWbyVnV6+05aFjwhwzaCY7L1y8f0ENPsGuGPb00YIgDUbji9sXWZlfv7CBjbn8YXNJz88Om/Dpy6cPoPafGbT5iNh/NTK6nnunf7g3QtMTx/fflD4JlwA5Czuun4dl+86NQWAK2c3nqXFyGxgb4cn//i2Rz4ncAcAAHiJPx09lr9KBD10hD625cpfTlx59d26a93lyxt+AqB6fGLruseHGuS7i9e+tbh4FleOb0lgcXbiiIPb567a+b0kiw7em1+Lk6eMKqmEkgtO3jyfMyeXvLOBxZXLFk8u17lXtsxt2PZCcfXak2vnrj69vG1u7fbXl+/cMC6dOHHh/OnveoJyBwBequhb1i1x7OpTWQDFiR1n73xTtBE16IBHBDjzSQAAHDaZDWShEZWIH2666adewA2fuW66MFo864ZP+zYPuHioqKR+sNvb1699Jzj13MIE+I+jgxt//LXv//xYkgQO37wH3Hz+cjebrTD/I07fOL29xvnB8aWVc5j/8OaaJ+cXX3afUhbqusHCh7f999s/kz527p/v3+SG98eG6eDMJwEc1lxzXXGdWPU3vwF/8WDaP/eKN3c8dKSMjAh89vHPETh14AAuAQCsWBNUYoCsAZM3b/rEC+budWH83j/48i2HXXuPb3OP15YxzAb5xgfrD238+OnmCgCDOLm6a/fqwRGVALC05KXLWex27D2bdntmw8Fz83dvveTSynvY7Fm3L2w+6eJ4n4vLpM1vHakHN78627l7uuzSrUt19MTi0imK9MCBA7gE3N36mX0THGj2PfW2K1c92GXjoT/nt3cdSZH7f4/oYIhAECEExkAQSRBrkIaKJCSRE9MxQjIIARkxSp1BDB1JjrNMQQyCZCRExyACSZADBCMdASRIAAAABZWlowKmmpmaTEuhmWp05ZTqNtPUdFxVTKM7ZvRUR6n/G2EFQHSAAARkjyAYIkAQCQxEIpCIgGDNdCQFDEQHSYCcrE7C6iRAQhIIAAiiJdE6AjqAjo7uHrqioaMBHV2iu7KAjjJtCnQ3jRm0Qq9q6D/4GgkAAAIAxowZaNEzEDBrAEWA6Aa69UgC0NACMierkzCbBEhkdmuAgIhAh6ouMkAAiI5QlREQAhAtIiKzEtAlJgARwAwaulc1NK3+HwQZGF3RS6s/AAAAAElFTkSuQmCC)}\n#webamp .llama.selected #title-bar {background-image: url(data:image/png;base64,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)}\n#webamp .selected #title-bar #option.clicked {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAHlBMVEUUFB8VFSAVFSIVFiEWFSAWFiEWFiI0MCyah13sznoaG8L5AAAAPElEQVQI12NgYBAUCmBgmCCoaMDAWSmoZMAwvVIwNIBhRueMjgkMAoLTKwMYGAWnz0xgEBT0DAWxXdMSACxMDDJsyBoOAAAAAElFTkSuQmCC)}\n#webamp .selected #title-bar #option:active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEUhKDU0MCyah12jlGrsznoe/O3VAAAAMklEQVQI12MwBgIDBgMHBgYDBhMRASDpKCIIJJ1UnJQcGAwEHUWAsoyOLkCSgQWIweoBtzQG0TH1VqcAAAAASUVORK5CYII=)}\n#webamp .selected #title-bar #option.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEUhKDU0MCyah12jlGrsznoe/O3VAAAAMklEQVQI12MwBgIDBgMHBgYDBhMRASDpKCIIJJ1UnJQcGAwEHUWAsoyOLkCSgQWIweoBtzQG0TH1VqcAAAAASUVORK5CYII=)}\n#webamp .selected #title-bar #minimize.clicked {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAMAAADXT/YiAAAASFBMVEUqKUIqKkMrK0QrLEQsK0QsLEUtLUctLUgtLkcuLUhFQTxSSj1aVzpoWTVrXUNzbFKId0mckXWqurG71tm/uX7AwcbE3+HO4c5KSa+JAAAAPElEQVQIHQXBwQHAMAjEMJvQfLv/lJ0ArpK3FsLQZxogW9uqXjqlkKQphYTmcGBI4wPU6OVd4FtvYEzyA+cLGDTjuSw1AAAAAElFTkSuQmCC)}\n#webamp .selected #title-bar #minimize.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAIVBMVEVFQTxSSj1aVzpoWTVrXUNzbFKId0mRbkqckXWjlGq/uX4Hs2WWAAAAOUlEQVQI12OYCQQTGKYzMLBPYJggKCgwgWGSiYvRBIYpYWkhExhmdK3qAJKrVq0AqunoaJ/AAFYPAAQVFS+2qihdAAAAAElFTkSuQmCC)}\n#webamp .selected #title-bar #shade.clicked {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAMFBMVEUtLUgtLkguLUcuLUguLkcuLkkvL0ovMEswL0swMEswMExFQTxSSj1rXUOqurHO4c6W/ePHAAAAQUlEQVQIHQE2AMn/AKqHZlVQAJnu7uUQAK7///4wAK3d3d0wAKzd3dwwAJzN3cwwAJvMzMNAAIi7u7MgAIZlVTAwDDgbUKzozR4AAAAASUVORK5CYII=)}\n#webamp .selected #title-bar #shade.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEVFQTxSSj1rXUOjlGq/uX5Idn/CAAAAM0lEQVQIHQXBwRGAIAwAsLT07Z2zsP8qbuDBAliTmDjl1m8Gob6HK5uWti27V6uxDDFxfn1PDx8P0VYSAAAAAElFTkSuQmCC)}\n#webamp .selected #title-bar #close.clicked {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAALVBMVEUoJz4oKD8pKUAqKUEqKUIqKkMrK0Q0MCxoWTVrXUORbkqjlGq0h2PCsWH///9ex0i3AAAAO0lEQVQI12NIdTFWUmDIbC/vFGCIONm5Q4AhfPbq6UCy61U7A4P77LVAdsTOzhsMDJ5ANQwMLkaKCgwA5wURVkMAFf0AAAAASUVORK5CYII=)}\n#webamp .selected #title-bar #close.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAElBMVEU0MCxoWTVrXUORbkqjlGr///+HjTObAAAAKUlEQVQI12NwAQIHBicBBiEHBkcmIUYHBgcFAwUgKRwsAGNDxCFqwOoB1gEH67W94+0AAAAASUVORK5CYII=)}\n#webamp #clutter-bar {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAArBAMAAAC3GdQgAAAAElBMVEUAAAAAAAgQECEYGCkzPElgYGraVCJcAAAAVElEQVQI132NsQ2AQAwDr8gCv0FGMNLTu8gKv/8qFCAgQqI7WWebbYyBACQJEUbyRDgaTf95Va3xeGWkKUTQqPz12m9eyyYB8s7eVEUSJs8VIPe1DmVJGRTmaMgdAAAAAElFTkSuQmCC)}\n#webamp #clutter-bar.disabled {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAArBAMAAAC3GdQgAAAAD1BMVEUAAAAAAAgQECEYGClgYGoHCnLLAAAAIklEQVQI12MwFBQUZDBgAAIDIBhULAVUlgJhFlivgomLCwA8qROh1kJ8awAAAABJRU5ErkJggg==)}\n#webamp #button-o:active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAgMAAAC5YVYYAAAACVBMVEUAAAAYGClwgY/qIgoqAAAAGUlEQVQI12Nw0GBwaWNwaIKRGQwODAwuLgA+SAT1jbNsAAAAAABJRU5ErkJggg==)}\n#webamp #button-0.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAgMAAAC5YVYYAAAACVBMVEUAAAAYGClwgY/qIgoqAAAAGUlEQVQI12Nw0GBwaWNwaIKRGQwODAwuLgA+SAT1jbNsAAAAAABJRU5ErkJggg==)}\n#webamp #button-a:active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHAgMAAABIN+TNAAAACVBMVEUAAAAYGClwgY/qIgoqAAAAGElEQVQI12Nw0GBwaWNwaGJwWQUmgWwGADIVBK9/og4OAAAAAElFTkSuQmCC)}\n#webamp #button-a.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHAgMAAABIN+TNAAAACVBMVEUAAAAYGClwgY/qIgoqAAAAGElEQVQI12Nw0GBwaWNwaGJwWQUmgWwGADIVBK9/og4OAAAAAElFTkSuQmCC)}\n#webamp #button-i:active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHAgMAAABIN+TNAAAACVBMVEUAAAAYGClwgY/qIgoqAAAAF0lEQVQI12NwcWFwWMHgksLgoAAjVwAALckEbUwsrjEAAAAASUVORK5CYII=)}\n#webamp #button-i.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHAgMAAABIN+TNAAAACVBMVEUAAAAYGClwgY/qIgoqAAAAF0lEQVQI12NwcWFwWMHgksLgoAAjVwAALckEbUwsrjEAAAAASUVORK5CYII=)}\n#webamp #button-d:active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAgMAAAC5YVYYAAAADFBMVEUAAAAQECEYGClwgY/lGZUOAAAAHElEQVQI12NoYGDo6GBo+MPQcZqh4TCIdACSfwBnkgl9KMHv2wAAAABJRU5ErkJggg==)}\n#webamp #button-d.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAgMAAAC5YVYYAAAADFBMVEUAAAAQECEYGClwgY/lGZUOAAAAHElEQVQI12NoYGDo6GBo+MPQcZqh4TCIdACSfwBnkgl9KMHv2wAAAABJRU5ErkJggg==)}\n#webamp #button-v:active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHAgMAAABIN+TNAAAADFBMVEUAAAAQECEYGClwgY/lGZUOAAAAF0lEQVQI12NwYGDwOM3gcBhG/mdwsAEAPG8GMJvxEOEAAAAASUVORK5CYII=)}\n#webamp #button-v.selected {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHAgMAAABIN+TNAAAADFBMVEUAAAAQECEYGClwgY/lGZUOAAAAF0lEQVQI12NwYGDwOM3gcBhG/mdwsAEAPG8GMJvxEOEAAAAASUVORK5CYII=)}\n#webamp .shade #title-bar {background-image: url(data:image/png;base64,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)}\n#webamp .shade.selected #title-bar {background-image: url(data:image/png;base64,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)}\n#webamp .shade.selected #title-bar #shade {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAMAAADXT/YiAAAAM1BMVEUtLUgtLkguLUcuLUguLkcuLkkvL0ovMEswL0swMEswMExFQTxSSj1zk5qBl42qurHO4c7FV37rAAAAOklEQVQIHQXBwQ2EQAwEMCdEPK7/YhFiM2fXzybCxAXvN1VVbe9tpenSDDCh+GhZVmpyHDwZu2HP9QfI+BkLtDdVPQAAAABJRU5ErkJggg==)}\n#webamp .shade #title-bar #shade.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAD1BMVEVFQTxSSj2jlGq/uX7CsWH/Y2uiAAAALUlEQVQI12NQAgIFBiUGBiYFBgVhYwMFBkVhY0Mg6QwmXVwEgeIuLgIwNWD1AJzCBeFqt4OOAAAAAElFTkSuQmCC)}\n#webamp .shade #position {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAHAgMAAACTjE7vAAAADFBMVEUAABAwMEsxMUJaa3u9OGBkAAAAIklEQVQI12NgAIIDDFqrVq06wCAaBiZDQ8PAZCiM/A8EBwAZeBBhq+F40QAAAABJRU5ErkJggg==)}\n#webamp .shade #position::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAQMAAAD3d2XqAAAABlBMVEWjlGrsznoPowceAAAADklEQVQI12NwYHgAhw4AIi4E4a+iLsYAAAAASUVORK5CYII=)}\n#webamp .shade #position::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAQMAAAD3d2XqAAAABlBMVEWjlGrsznoPowceAAAADklEQVQI12NwYHgAhw4AIi4E4a+iLsYAAAAASUVORK5CYII=)}\n#webamp .shade #position.left::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU9P0xoWTWjlGrsznp9Nqf9AAAAE0lEQVQI12PYwPCF4QcYfmHYAAArXgYxq2vCDQAAAABJRU5ErkJggg==)}\n#webamp .shade #position.left::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU9P0xoWTWjlGrsznp9Nqf9AAAAE0lEQVQI12PYwPCF4QcYfmHYAAArXgYxq2vCDQAAAABJRU5ErkJggg==)}\n#webamp .shade #position.right::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU9P0xoWTWjlGrsznp9Nqf9AAAAEklEQVQI12OwYKhh2AOGNQwWABlSA52dOQTnAAAAAElFTkSuQmCC)}\n#webamp .shade #position.right::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAHAgMAAACw1x86AAAADFBMVEU9P0xoWTWjlGrsznp9Nqf9AAAAEklEQVQI12OwYKhh2AOGNQwWABlSA52dOQTnAAAAAElFTkSuQmCC)}\n#webamp #volume {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAGkCAMAAAC//nO2AAAC5VBMVEUVFSEVFSIVgAoWFiMXFyQYFyUYGCUYGCYYkgsZGSgZdhAcHC0cbBQchRIeHi8fHzEfMh0fVR0omRwpKUArYyIsLEYujhYunBIvfhsvgRswSD4xMUoxMU0yMk8zM1AzM1IzNFEzNh80M1E0M1I0NFE0NFM0shU1NVQ1NlQ2NVM2NVQ2NlU3Ihw3N1c3N1g3OFc3OFg4N1c4N1g4OFc4OFk5OVo5bSw6OltAUkRCtiZHhidKSmhMlSVOeC9PpCNQT2lQUkRRmyxTO0BTU29WqypXjEFauihcmyxcwCphoCxixDFkritlvjdpdy9p2jBquCtrwCpsa4FtoCxvRB9woEtw1T5xcYlyxypz3D50xzF1TSd3iDd3oDF3tCt30zB4bi14eIx6IiN62jB7OCd7fI98e498fI59Vyp9fJB9fZJ+fpJ/f5R/1T6BxyqB4jCC3D6EtDGEwF6FnDGGYzmIoDGJQyyJYjGJrVqKxDCK4z6LfjiLjkiLmCyMpI2NmiyOWxeOjqGOmyyQxzGSRz2SVj+SkqSS4jCUyjiWlqiXXCGXaECaaSma4z6bXSGbfiebjSybw2Gb2jmdryydsJOeYhKeayafFhufKhufMzefPiGfSSGfVyGfbCefgSefkCyfmyyhok6j4Tik20Wk4jimxzGndkip40atrZKuV0auag2uwCqvlI6wYh+yERayKBayRx6ydiWynCqyriuywF+yxDG1hVK3RUy94ji/bRu/dRC/uyq/0zDB40bCcFTClFnCsV3Cv17DciPD1T7FDBLFJxLFQxvFURvFZRvFgCPFnCPFsSrFwCrF2TDGeA/G2jDIxdPI2z7JVyLJgSDJhSnJoCnJtDHJxDHJ3D7ZSh7ZWh7Zbx7ZfB/ZjifZlDfZrCfZsTfZwzDZxj7Z1DfbhC/fsSjgDhXgLBXgTB7gXB7gch7gkijgsijgyTDg2jDhHybhPCbhWC7hZy7hfC7hmTfhtjfhzD7h3D7eIOpxAAAEo0lEQVR42u3WeVRUZRjH8VuKpWZFkpjlWLN0uTMNMNOdycwpM0ZLIyjHSkoJyLBSMdvITGk1pVRMyzZTw4JSEVNLbVMgqCw1l9RcyfZ9/bv3vfd971jgP7/6o3Pe58vM4cA585z3zn3mc0brzXK5vW6Px+Pz+XRd9+sBqyArK5SZFQ6HTf4TMc2I9Wyb1tvFZrjPtIYYPsPQ9YAYw6dkhsLhbDaCT7Fqb4apuVwuNkIcxDAMvzOCTwkF2QxW5GgD7JOc2rWDdkyHZB3tUjqm8Dp1sn6lHNdunU/s7j6PD+l6cuoJeKm9LmBvltY5tcuxeF2iV7Or1E5K63Y8Xrf4w/wk3XtFT8GL31fB35MzXBddecNNN44eM3oM72b2sLpFdit7HK2KRysu4UPYHXa7vR6PwW+wnhEIOKsWCgbP5fdXLAi/w6b1+NuOWLfY5XZ5PV6PwRctQw9k+JP7aq2JvbDmES822y5bH34Sj4+tq274dT+fERTbmsU2LVtMiVhz2iyc/V+NrbzXWlfDxy7GWlf7FMGsYMi+Gv785xUc8YcZYUO87j585X3sJH75jvBB2eHM7HDyU2O2cyHiMNrpm/99GlHQHgVpPU9D65kmKEjrkY7XI2ZTEE0/Gy9dUtDvfLwEUUAUKExBtB9etK9NQbT/hXj94zYFsZxBeDkJm4K+8cvxiAKiQGkKLsaLCQrYp/hStEE5goL4kCvwhkgKEsOvRRt+2xNEAVGgLgWxwXgOBUPz8tHyhkoKRowqRhs14m5JwdgytLFEAVGgNgWXoSUpyMu/Bi0/LyEpKB6PVpykoOwetDKigChQmIKzYlfhORSMHIc3UlJQ/gheuUNB1WNoVbOJAqJAZQqux8sVFOROKH8ArXyCoOC6aVWLXsRaVDVNUDAgsfgltMVEAVFAFBAFRAFRoDgFuRPvQJuYO0BQMKcab869goLq1/GqJQUL38R77WWigChQmILJU+7HmjI5ScEreA4Fq9Zv+hhr0/pVCyUFG7d8irVlI1FAFBAFRAFRQBQQBUQBUUAUEAVEAVFAFBAFjILCF/AKBQWFK9d9iLZupaBg0s7WH9BadzoUtP6J1vouUUAUqEzBrAVosxwK6j/Aq5cU7Dj4PdrBHQ4Fh/5AO/QOUUAUEAVEAVFAFBAFRAFRQBQoT0HpzOfRZiYpeB+vfpKgYPv+w99hHd6/XVKw4MDvaAeIAqJAYQrOKaic9xzWvMrSgTYFpSta8FbMsCm4a9veb9H2blttUzBwyb7f0Pa9/SpRQBQQBUQBUUAUKE3BsOmPo00vEBQULH0Db6mgoHTDZ3gblggKZnyOt5ooIApUpmAqnqRg2NxavLm3Cwpq136EtrZWUlDZ8glaC1FAFChNwbN4yW8FzXjOt4LmPd+g7Wl2vhX8ikcUEAUqU1DyDF6JoKCk7j28uodsCu7cuvtrtN1bJQU1v+C9RRQQBSpT8DRekoImvLoHBQVNu75C29VUIyn4GY8oIApUpqDoKbwiQUHR8ka85YKCksYv8RolBfN/wqshCogClSl4Es+hYFkD3rL5NgVFDV/gNayRFPyIt4Yo+P9T8B9IsPkvQxJ1ta+jwcEAAAAASUVORK5CYII=)}\n#webamp #volume input::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYvL0RKWmt7hJStvMTa5+opTTwbAAAAMUlEQVQI12NQFAQBIQaxNBBIZGALBYIQAyAtKiqKlwapM2RgcwEBQwZhYxAwZICaBwCdgQ6Jd297uQAAAABJRU5ErkJggg==)}\n#webamp #volume input::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYvL0RKWmt7hJStvMTa5+opTTwbAAAAMUlEQVQI12NQFAQBIQaxNBBIZGALBYIQAyAtKiqKlwapM2RgcwEBQwZhYxAwZICaBwCdgQ6Jd297uQAAAABJRU5ErkJggg==)}\n#webamp #volume input:active::-webkit-slider-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYZICovL0RKWmva5+r///+U4Y9MAAAAMUlEQVQI12MwFAQBYQbRUBAQZGBlAAIWBiQ6ISEBKw2SV4TTIi4gIMhgJKQopCgoDAB2aAh/NddRQgAAAABJRU5ErkJggg==)}\n#webamp #volume input:active::-moz-range-thumb {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALBAMAAAC9q6FRAAAAFVBMVEUAAAALDxYZICovL0RKWmva5+r///+U4Y9MAAAAMUlEQVQI12MwFAQBYQbRUBAQZGBlAAIWBiQ6ISEBKw2SV4TTIi4gIMhgJKQopCgoDAB2aAh/NddRQgAAAABJRU5ErkJggg==)}\n#webamp .gen-window .gen-top {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUAgMAAAAFGX4uAAAACVBMVEUeHi8rK0Rra3zjkZV/AAAAG0lEQVQI12NggIJVYNDAEAoGDlSj0QGx9kABAFXxKF3wQT+3AAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-top-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAB4ElEQVRIS61Vu04DMRDc3WuQqEBIVKlAQkKioEZU1PkVpHzhXZX8RUCiTpUjojs04/XrcjyUxFF09p3t8c7OjnU2exikaiqqmt6wryY6iLCrxg5+aGp4Wh77WszjDMwFyHw+r2GwEb9jmm+GycXmEYhgFjaM8/fWRZCuXYaj8kweTbExI4gbqYpxnIFThFxj+UBlJG27DFQ4DE9anb4Y+yYJhNSoqMWD/ATSrSIxKZJtv67TdeAo5SREoqJD4Ljv1/LydCO3s7MDt87LEsg4J/3nmywWr0cDkP6U+G4l0LKnXQByeXF+YhCoC1lxmQIEdJ2iTdAlzEu/e5f7u2t5frw6GqcG8QrFA3Ww+/o4GqDOCeny5iqD7vkP9ZzrZqJOyDTs5bdipLpEZNtv9guSi8MBcuXnwvMP2SmSE4y8awwyrnzaSGmMlc2MDTLazR8gMM1sM7Rb5im4cuHCUZFuQdlQs9ftJT7SBZCOVuNUaSNmOGEjhnfsF5R5Tho1GSpjLax+TBdB2pWXTsPUmzXBYV0M6JvfN3R8CZTGdxRM6cLTIMH+UTe8nCJl1jh1iDJSmNVVglBt1X1SqCtE4rIeSdpIHaIK9FF4BmKjOAA88Nv/InHgcJXmeyJTN3X91ur6BrqJo0MRJOhhAAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-top-left-end {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAABxklEQVRIS7WVvUoDQRDHZ/r4DIEThCiCtn4UCpa+gIiF76DmCWwv+D5WYm0nCFpZCSKWKZIdmY//Zu/CxSaXQPZuM7v/md2Z3/DO6FSEhESE9COSbCSbjUdKpC9qY7Nmu7wGa5MQsVn6Djy+qWMpRHwD1+nazIXwdVGTtfkU7+EZ8dHBpVnoD5tBcglsoqNGZ2Nsi7nCGbWx/+EYIhUhPj68Et/EpVTCDIsNTVznUyJhIUouZh7H8apzcIQ4HApRHg4rHH3cwHqHwaAivr87703k/XNKj88fxJPJpDcRPZO6fiDe39vtTSTxlH5/5sTXF2e9iWgkdlx93snTyze9vn0RV5tbvUUyn81osFGVdeJalu9R7VbBKVmN2JzWSVQ1UASUoBiBJq96rxdeF7u8lt3BJXZtj06CIisA2Y6uzbQcnQs5uhYI4vFtLZmuK6CIYyi5lsFYOBGYzAxTmwKQosjpZlcAEPfWuAtEUrQL3ImJAJDGOu0bIPAShb3XLHqP09lhGmgFqdVbPDdE0LDQrAoROwLNrPZcRn5k5X+o7+4nqXGMubdEerZT2BxpR+Ip7BlRpiHaL5pQo3aK7MpNOqLKTbHIrj9doofFD8vqAQAAAABJRU5ErkJggg==)}\n#webamp .gen-window .gen-top-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAABYlBMVEULFRIMDAweHS4eHi8fHyIfHzAfHzIgHzEgHzIhIDIhITMhITQiITQiIjUiIyYjIjYkIzckIzgkJDklJDomJTkmJTsmJTwmJjsnJj0oJj0oJz4oKD8oKEApKEApKUApKkEqKUAqKUEqKkEqKkIrKUIrKkMrK0QsK0QsLEMsLEUsLEYtLUYuLUcuLUguLkcvJwgvLkkvL0ovMSUwL0kwL0owMEsxL0wxMC0xMEwxMU4yMU0yMU4zMk8zMlA0MlA0M1E1M1I1NFM2NFM2NVQ2Nhg3KxA3NlU3NlY4NVU4NlU4N1c5N1g5OFo6OFk6OVo7OVw7Ols7Olw8OVs8Olw8O11GQh9JRjlORDBQPx5dVztiWkVqanprXUFra3xsa3xsbH5tbX9tboBubX9vboFvb4JwTyxwb4Nxb4RxcIVxcYZycYZzcodzcoh0c4l0c4p1dIt1dIx2dY13dY6Gd02QkJCZc0LWhhB9AAABJUlEQVQYGT3BvWqUYRRG0X2++bRSGxsVhBls0oidP3W8gYCFXoW3JV6DVgmxslBbIQELJRAQA0Kc9zzbmcBkrVrZrTEaYuylEXs+EK/EEKNo4HA+SVf0n2mTMTqJcc00TTeBoGwUBZMINXPteTL2fn2E/XvHg/ktOz/fP4Ve7ZerU2Cqaw/YePdndXd1+qEWzIfsrKGbXNy+OCPN/IhrX1nI7+XFw3OqnO+z8wOa17dOz86XL79L3WHn7zMz9r59gSePP62pgxrG0bG1L23TraRWI24kRGNilv3iqJiaAgQRtEAomF+JIYRotPGIrfkki3UcncTkcqQHsjEtGEBRVeRymIBsTBYb3lCaqTqJbE0lG5WqVHrEyJX586A12omj45tj2foP9wDyBsXxPvcAAAAASUVORK5CYII=)}\n#webamp .gen-window .gen-top-right-end {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAByUlEQVRIS7VVPUsDQRCdWRvBShGszoAKYg4C1mJj8m8Cgr2/1cLfENBu5b352D1NY7GXhLvszc57MzvzRqdpU1VV8MOlolJFpeCvFuEq3uMDGyxU3Ls1mrit22MvfWDffv9e7dGccfGXg3CYd5o6KS1GrtsbPoK0zuttNXtjh3thZG0zWaYTY8z3ngGVIlosMiMS0cNGhCBprCq1ihTEWVW0mPNMlRNAKrC5SAAZoRLA/uzsRed5Vw+HDxqNunS1uqnbp1u5m05HYQhB3t5ehwHweABycX42HgTpGnkxkvX9lTw/Xg7DYXV9fX8OA+CZzA8vVbwfotYhK9Zw3iuhAtmgaEhvvGhIykqoABq6UJ74vZ422YwhAyYLTbOsgTv5iOdOz9j1qVve/a5UekwgE2ThfAnSVMCpdXLS5MlOIQWyZ2tpa/q1EMbQOAV3k5c/kaYqe/r+L5AOvtAuW4voeKY8DmhfJ5BkXzwlfOksUBR5oFhvotkLa4BYVKHGATLvcp5AdS3DHYinrZ8XrQgccDEa4MMjCQVnCZ+oaEy7fkZ0g2kBQp1HfA3E5lArDpawF0OWcIaJ4/TDzPF7tMpatNYOffX5hPUW/wFZNjaZ4b4luAAAAABJRU5ErkJggg==)}\n#webamp .gen-window .gen-top-left-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU0nT8z0BjwFhe1kd7S2ysY4eJJfLySrT3SVu5L+0tmTBhAu0tMTTQpb0lSVGutLeELnGipKxGe5/QJTPSpeyiiyWjBSQpVRAjXVIXXSyhR+oCAGL8JbEqBdscAAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-top-right-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU0nT8z0BjwFhe1kd7S2ysY4eJJfLySrT3SVu5L+0tmTBhAu0tMTTQpb0lSVGutLeELnGipKxGe5/QJTPSpeyiiyWjBSQpVRAjXVIXXSyhR+oCAGL8JbEqBdscAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-top {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUAgMAAAAFGX4uAAAACVBMVEUeHi8rK0Rra3zjkZV/AAAAG0lEQVQI12NggIJVYNDAEAoGDlSj0QGx9kABAFXxKF3wQT+3AAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-top-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAABHVBMVEUdHS0dHS4dHi4eHS4eHi8eHyUfHzAfHzIfIDIgHzEgHzIhIDIhITMiITQiIjUjIjYkIzckIzgkJDckJDklJDolJiwmJTsmJTwnJj0oJj0oJz4pKUApKkEqKUAqKUEqKkEqKkIrKUIrKkMrK0QsK0MsK0QsLEUsLEYtLUYuLUcuLUgvLkkvL0owL0owMEsxL0wxMEwyMU0yMU4zMk8zMlA0Mk80MlA0M1E0NFE1M1I1NFM2NFM2NVQ3NVY3NlY4NVU4NlU4N1c5N1g5OFk6OFlCQTtqanpra3xrbHxsa3xsbH1sbH5tbX9ubYBuboBvboFvb4Jwb4Nxb4RxcIVxcYZycYZzbFJzcodzcoh0c4l0c4p1dIujlGrsznr///9wBmqFAAAAvklEQVQYGQXBwQlVSQBFwTq33+DWnUuj0RQmXMNwMzAKgjkI/7dVQYdtrZwyq3xFTlqqtUoP39dOa9apc9pOjXe8cRky8NDN/gcA8HDVj38DAHiYew0AwMNeD78BADy8hk8AAB4W/nwAAHh4nXz+BgDgoejjqXaqp22nHs79lZ0yM2tVgze8BHcBD68zX0yt1Jbp4XrPf6fqbJ72zz1tsN7e6N47eo07eFvBcrnQIPdyXbjyuu7DdOlnZk5Z1V/Roy8hK3ODtwAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-top-left-end {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAByUlEQVRIS7WVPU4DQQyF7Z5cgaVJpAAnIFAk50AcgB4UwQEoKNJQp6GkpKCgp6ShoUFcgCJtkBgj/7zZ2Y0WmmwiZXcnXj97xv7MB+OZCAmJCOlHJNmVbDVuKZE+qI2tmu3mO3g3CRGbpXvg+cUiXoWIO3CdLmcuhK+Lmqytp3iOyIiPj07NQn/YDJJLwIleNTu7hlusFcGojf2PwJCpCPHJ5EzciUuphBkWDk1c11MiYSFKLmYRx/ZqcAiEOAIKUd6thtj6OIHtXgY7FfHX61VvIk8vK7q+fdZjyKe03RTCW7U3Ip5NJ71l8sMr+vz4Jr6/O+9NRJOx7erzTG6W7/Tw+EY8HB32lsl6vabBoCr7xLWs3qPbrYNTsh6xNe2T6GqgCChBMwJN3vXeL7wtdnkve4Ab7NofT4MifwCynV2baTk7F/KmqBHE88uFtQqI2QVFbEPJtQzGIojAZGaY2hSAFEVON7sCgDi3xlkgk2Jc4ExMBIA01uncAIE3KOyzpp49TmeHaaAVpNZocd8QwcDCsCpEbAu0stprGflRlf+hvnuepMY25tkS5dkuYQuknYmXsFdEWYYYvyiERu8U1ZWHdGRV47aurl8JSofPjXVkWwAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-top-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAMAAABPqWaPAAABO1BMVEUeHyUfHzAfHzIgHzEgHzIhIDIhITMhITQiITQiIjUjIjYkIzckIzgkJDklJDolJiwmJTsmJTwmJjsnJj0oJj0oJz4oKD8oKEApKEApKUApKkEqKUAqKUEqKkEqKkIrKUIrKkMrK0QsK0QsLEUsLEYtLUYuLUcuLUguLkcvLkkvL0owL0owMEsxMEwyMU0yMU4zMk8zMlA0MlA0M1E1M1I1NFM2NFM2NVQ2Nhg3NlU3NlY4NVU4NlU4N1c5N1g5OFo6OFk6OVo7OVw7Ols7Olw8OVs8Olw8O10/QitCQTtdVztqanprXUFra3xsa3xsbH5tbX9tboBubYBvboFvb4Jwb4Nxb4RxcIVxcYZycYZzbFJzcodzcoh0c4l0c4p1dIt1dIx2dY13dY6Zc0KjlGqxnVm2nF7sznr///+ZhXPBAAABBUlEQVQYGQXBwYmUURBG0Vv1P90KvWtnQCcBxyBEEAMxKWMSWjQAB2V2DeKyX33Xc+reGY3RoHHeGHHWR1HVMWgUDXxbT5mK3swYkyQab3T3SyAoQFFQIhQAAPA+5iFXOPVls74AADBf30HuOn3+A6wCAGABXPucfr7WMesXAICAkry4hQzrDgAAoIru29FUuQ4AAP6BnM7P6df5LfUKAOAvj5qHXOHU32/Uh9rGnTiaMSapza77HdWEqCbm7Txetj0UIIigJRBkfRJDGKJq5EID6ynHLe4kMTpxAKEPNlBUFRiQAhZtAbgUqgqqJDV0CVCpEqHAojesn5vRyBh0/PyD5tj8B5vM5TGngJW4AAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-top-right-end {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAABzUlEQVRIS7VVu04DQQy0lx+gokuQEEjAiXwAJYSCgpIfoE1NgUTLT1KRjh4qKBbN+LF7kIZiL4nusuf1jL32WBeLVVVVwQ+XikoVlYK/WoSreI8PbLBQce/WaOK2bo+99IF9m81ztUdzxsVfDsJh3mnqpLQYuW5v+AjSOp1fV7M3drgXRtY2k2U6McZ87xlQKaLFIjMiET1sRAiSxqpSq0hBnFVFiznPVDkBpAKbiwSQESoB7M/OXnSa1vXjc0ujUZcuD0/qy+ON3F7uj8IQgmzfXocB8HgAcnx0MB4E6Rp5MZL7uwt5ejgdhsPq+vp+HwbAM5nOrqp4P0StQ1as4bxXQgWyQdGQ3njRkJSVUAE0dKE88btcrLIZQwZMFppmWQN38hHPnZ6x61O3vPtdqXSXQCbIzPkcpKmAU+vkpMmTnUIKZM/W0tb0ayaMoXEK7iYvfyJNVfb0/V8gHXymXbYW0fFMeRzQvk4gyb54SvjSWaAo8kCx3kSzF9YAsahCjQNkWuc8gepahjsQT1s/L1oROOBsNMCHRxIKzhLeU9GYdv2M6AbTDIQ6j/gaiM2hVhwsYS+GLOEME8fph5njd2eVtWitHfrq8wnrLf4D9zg6mAHJo5AAAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-top-left-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU0nT8z0BjwFhe1kd7S2ysY4eJJXLyqrT3yZtzVbS35P///7S3xMnRmvaWLJ6SRXtL6BInqmo6tPcJXTIjXcouulgyWkCSUgUx0iV10cUSeqQuABQNKbDZQyxmAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-top-right-fill {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAAAWklEQVRIS2PU0nT8z0BjwFhe1kd7S2ysY4eJJXLyqrT3yZtzVbS35P///7S3xMnRmvaWLJ6SRXtL6BInqmo6tPcJXTIjXcouulgyWkCSUgUx0iV10cUSeqQuABQNKbDZQyxmAAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-bottom-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH0AAAAOCAMAAAA16ON4AAABfVBMVEUdHS0dHS4dHi4eHS4eHi8fHzAfHzIgHzEgHzIhIDIhITMhITQiITQiIjUjIjYkIzckIzgkJDckJDklJDomJTsmJTwmJjsnJj0oJj0oJz4oKD8oKEApKEApKUApKkEqKUAqKUEqKkEqKkIrKUIrKkMrK0QrLEQsK0MsK0QsLEUsLEYtLUYtLUgtLkctLkguLUcuLUguLkcvLkkvL0ovMEowL0kwL0owMEsxL0wxMEwxMU4yMU0yMU4zMk8zMlA0MlA0M1E0NFE1M1I1NFM1NFQ2NFM2NFQ2NVQ3NlU3NlY4NVU4NlU4N1c5N1g5OFk5OFo6N1k6OFk6OVo7OVw7Ols7Olw8OVs8OVw8Olw8O109O149O2A9PF89PGA+O18+O2A+PF8+PGBqanpra3xsa3xsbH1sbH5tbX9ubX9ubYBuboBvboFvb4Jwb4Nxb4RxcIVxcYZycYZzcYhzcodzcoh0c4l0c4p1dIt1dIx2dY13dY53do54dY94do94d5Ap3ahhAAACBUlEQVQYGQXBAQEYNRAEwNlLig3E4KTCcFK81AZ8bpmJn7/89vOX3z+BgBAEgQyBNARCIEHS2YEICIEAIR0BUsEF8OcvxhhwKxiXKQNxZDCBMGJ0mL3OmhpJwxHBfacmzA4u333+gAGAMQk6PqlkL7tYrnOSWca2CaCb1g5vqESDReG8+koHcOdcHwYAI6SVPWcL+RgMvmA6kEQLdOrMDHYAOHaFxxl3Hxafz6Y9ywAQEZWKTEgVwQB9igVJqkbtpkA84Jl56tjNiaM78F1mtsMAaLSrxWjKTgIB4DQs1Wg13U5p0W3nALrS7TPd/x4MYHZzggGIBmlEvUrYizwLfWvBCAVNNB3zhMYDTo5xfpzPMQ4Bxk7+/f77GEDfiYyXYh3RrO+z3xgcqmWsgkjaRuweNSbn0VIv+rmM82jB4vtxzuUCf5OKQUBgEAiSgATSIBiCwGww0hAkHRyEA0BgAFSwAsDA7iaQAECRYUYCMDvMUBJoAp51AARw4c+/AASIRgTSmEYCIkAIIQ1iEAQEIg0CqVMBBBfrn67rHZEBmWCa+913YcLhwAghaSJx1umI2RwBZ08a15c5zyGBS3NoDGtekTFMmXNm26i6TsyMOk+2BkAlgjUZTM+8tiV7FJ9rzXlPAZv0CQGAMDUNBIaOkCbSEAIiMAEERo1UCCSB67vOOwBR8T8KSRhI0bzb7AAAAABJRU5ErkJggg==)}\n#webamp .gen-window .gen-bottom-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH0AAAAOCAMAAAA16ON4AAABfVBMVEUdHS0dHS4dHi4eHS4eHi8fHzAfHzIgHzEgHzIhIDIhITMhITQiITQiIjUjIjYkIzckIzgkJDklJDomJTkmJTsmJTwmJjsnJj0oJj0oJz4oKD8oKEApKEApKUApKkEqKUAqKUEqKkEqKkIrKUIrKkMrK0QrLEQsK0MsK0QsLEMsLEUsLEYtLUYuLUcuLUguLkcvLkkvL0ovMEowL0owMEsxL0wxMEwyMU0yMU4zMk8zMlA0Mk80MlA0M1E0NFE1M1I1NFM1NFQ2NFM2NFQ2NVQ3NlU3NlY4NVU4NlU4N1c5N1g5OFk5OFo6N1k6OFk6OVo7OVw7Ols7Olw8OVs8OVw8Olw8O109O149O2A9PF89PGA+O18+O2A+PF8+PGBAP1BAQFFAQFJfX3Fqanpra3xrbHxsa3xsbH1sbH5tbX9ubYBuboBvboFvb4Jwb4Nxb4RxcIVxcYZycYZzcYhzcodzcoh0c4l0c4p1dIt1dIx2dY13dY54dY94do94d5CUuEDKAAACKUlEQVQYGQXBwZFdRRAEwKyev3ZwwQ8gFisgdMIPzFlhhLhih2THvukiM3+jqRRolgIKpUAV2KZoU6WgaQGrKQoK3VQBvvH7Nz9e39nZ7ezsPJoFrni8PvOgNNUV91y7s21xqaaqWM2dy5qVLS12Ps3q1sL7v2Awd/u6Y56XmHB7N4960mOKVDO1uSwlSgsKjNQeZuhKStg9lkwM3i8wcPblwIOGfbzdFy6bfQFbaXtqZg+ROxEqBJ0ai91AUTvjhZox3u8HMKg8l31AlrfxibfXMHPQclzJubnWbTasVChFsFPQQXTgU6GM9/vxBRikk6zxAuHOcfAElAjS7dUTkxjOGBBgl1nAYjMLbxYhftt/vlxgIIfBA8rJTXa9WstC3UwS4s6dAl2ECjS7xI6Kxk6wDcT+0q9/7gcwwNnxvEAHV9t5PkPbCeFYHfSsG6gUGEV0UGMiomkhCeLXfvzZr1+A/ExTAFw8xwVdKIU1XdhZilIKFKWxpdGdsqBA2Ub565sfgzQAwHMu0AIKTAErSAMAKNJt0AoMAHsVLeD1B1QKaNEoqIJCUWiVpkpTTaEFbKooFLUACsDrO2zhARaXDg+3zNWUS+fiZnVn6ZaiTVk2FyzZplqWO4srzTaes2NgZ7AvUNyj1kOHc0mDmTjIIo2aCTQpRrOCDSvbbcApbaapcd2s13/QFMDlOXmgNtqURq1Ys3aWRosWUAW1qaZZDQuF7qkt+Gke/wNCVMxEPwTsWgAAAABJRU5ErkJggg==)}\n#webamp .gen-window .gen-bottom {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAOAgMAAACnVF/TAAAACVBMVEUrKkM+PGB4d5A1hmUAAAAAGElEQVQI12NYBQYNDKFg4EAyjQ5wmQcFAFaEHSfLt0cNAAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-middle-left {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAdAgMAAAABTX4zAAAACVBMVEUdHS0qKUBqanoMSFahAAAAD0lEQVQI12NQ5QxhoDMGAFFyDru7vcmtAAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-middle-left-bottom {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAYAgMAAABRgO+AAAAACVBMVEUdHS0qKUBqanoMSFahAAAAD0lEQVQI12NQ5QxhoCEGAEUWDDHkAu/CAAAAAElFTkSuQmCC)}\n#webamp .gen-window .gen-middle-right {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAdAgMAAADqesUwAAAACVBMVEUdHS0qKUBqanoMSFahAAAADklEQVQI12OYOoWBBggAuDohplXr188AAAAASUVORK5CYII=)}\n#webamp .gen-window .gen-middle-right-bottom {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAYAgMAAAC6t1SDAAAACVBMVEUdHS0qKUBqanoMSFahAAAADklEQVQI12OYOoWBGggA6uEb2fBejlkAAAAASUVORK5CYII=)}\n#webamp .gen-window .gen-close.winamp-active {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJBAMAAAASvxsjAAAAElBMVEU6MSljXjtsXUORbkq0kWP////9IyyfAAAAKUlEQVQI12NwAQIHBicBBiEHBkcmIUYHBgcFAwUgKRwsAGNDxCFqwOoB1gEH67W94+0AAAAASUVORK5CYII=)}\n#webamp .character-48 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAE0lEQVQI12NIYJjAsIHhApBMAAAULANhy/alSwAAAABJRU5ErkJggg==)}\n#webamp .character-49 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAD0lEQVQI12NQYEhgUIBAAAbMAQE/4OmzAAAAAElFTkSuQmCC)}\n#webamp .character-50 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12N4wCAAhAkMDQwfAA78AtFOxm3MAAAAAElFTkSuQmCC)}\n#webamp .character-51 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWP4wKDAkMAgwDCBIQEAEHwCcej/ubUAAAAASUVORK5CYII=)}\n#webamp .character-52 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWNQYEhgWMDwgUGBQQEADlwCUbptSVYAAAAASUVORK5CYII=)}\n#webamp .character-53 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAE0lEQVQI12P4wNDA8IBBAAgfAAAWXANRkouswAAAAABJRU5ErkJggg==)}\n#webamp .character-54 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NIYGhgeMAwAQgTABOsA0E/JWQ/AAAAAElFTkSuQmCC)}\n#webamp .character-55 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEUlEQVQI12P4wCDAoMDgAIIADgwB4bVklkQAAAAASUVORK5CYII=)}\n#webamp .character-56 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEElEQVQI12NIYJjAAMJAEgAQvALRax9yugAAAABJRU5ErkJggg==)}\n#webamp .character-57 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NIYJgAhAUMAgwJAA/sAmFIDiRPAAAAAElFTkSuQmCC)}\n#webamp .character-97 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEUlEQVQI12NIYJjA8AGIgRAAFNwDkUdAkdwAAAAASUVORK5CYII=)}\n#webamp .character-98 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEElEQVQI12N4wDCBAYSBJAAaPARRW/xs+gAAAABJRU5ErkJggg==)}\n#webamp .character-99 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NIYJjA0ACEExgSABFMAuEl/r42AAAAAElFTkSuQmCC)}\n#webamp .character-100 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAIUlEQVQYV2NkeMTwnwEG5CAMRrAglMPwiIEBxKaKIJpFADZCEAGAIkAWAAAAAElFTkSuQmCC)}\n#webamp .character-101 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAE0lEQVQI12P4wNDA8ACIGxg+AAAZ7ARBle8LfgAAAABJRU5ErkJggg==)}\n#webamp .character-102 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEUlEQVQI12P4wNDA8ACIgRAAGXwD0QArRQgAAAAASUVORK5CYII=)}\n#webamp .character-103 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12MoYGhg2MAwAQgTABMMAyEYrKesAAAAAElFTkSuQmCC)}\n#webamp .character-104 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAIklEQVQYV2NkeMTwn0GOAQIeMTCA2Iy4BaEKwRR+lcSYCQBnQhEB2omL+AAAAABJRU5ErkJggg==)}\n#webamp .character-105 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAADklEQVQI12MoYFCAwgIACEwBYXIvChIAAAAASUVORK5CYII=)}\n#webamp .character-106 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEElEQVQI12MQYADBCUCYAAAGnAGx9K9L/wAAAABJRU5ErkJggg==)}\n#webamp .character-107 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAE0lEQVQI12OYwLCA4QAQLmCYAAAXTAPhR2cHZQAAAABJRU5ErkJggg==)}\n#webamp .character-108 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAGUlEQVQYV2NkeMTwn0GOAQUw0kwQ2RqgpQBKiwwB5wSvgwAAAABJRU5ErkJggg==)}\n#webamp .character-109 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAIUlEQVQYV2NkeMTwn0GOAQIeMTCA2IxgQWSAXxCrdmIEAQtSEAH0ktA/AAAAAElFTkSuQmCC)}\n#webamp .character-110 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAE0lEQVQI12OYwMTAcIHpARAyAAATGAMpx84ilAAAAABJRU5ErkJggg==)}\n#webamp .character-111 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAADklEQVQI12NIYJgAhQkAEgwDAakOOnUAAAAASUVORK5CYII=)}\n#webamp .character-112 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12N4wDCB4QFDAwgCABlcA9Fh/HqiAAAAAElFTkSuQmCC)}\n#webamp .character-113 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAE0lEQVQI12NIYJgAhBcYNjAUAAATvANxqBzBZwAAAABJRU5ErkJggg==)}\n#webamp .character-114 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12N4wKzA8IAJBD8AABkSBJqXbNZ9AAAAAElFTkSuQmCC)}\n#webamp .character-115 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12MoYGhgSGAQAMIHAA1cAlFD9hA9AAAAAElFTkSuQmCC)}\n#webamp .character-116 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAADUlEQVQI12MoYFCAQQAH/AERspkQDgAAAABJRU5ErkJggg==)}\n#webamp .character-117 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAADUlEQVQI12OYwACDCQAUHAMxvRgSGgAAAABJRU5ErkJggg==)}\n#webamp .character-118 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAD0lEQVQI12OYwACBCQwJABOMAwEw9lTJAAAAAElFTkSuQmCC)}\n#webamp .character-119 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEElEQVQI12OYwACCH4BwAgAXTAQhMxLiQgAAAABJRU5ErkJggg==)}\n#webamp .character-120 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEUlEQVQI12OYwDCBIQEIgTQAEgwDAb4oAK0AAAAASUVORK5CYII=)}\n#webamp .character-121 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEUlEQVQI12OYwDCBIYFBAQQBDwwB4W/sEnMAAAAASUVORK5CYII=)}\n#webamp .character-122 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWP4wCDAoMDgwNDA8AEAD3wC0QyxJxkAAAAASUVORK5CYII=)}\n#webamp .character-34 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAADUlEQVQIHWMIYGKAAQADkABTwIHJLQAAAABJRU5ErkJggg==)}\n#webamp .character-64 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12OQYFBgiABCBQYJAAbMASFkTTvgAAAAAElFTkSuQmCC)}\n#webamp .character-32 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAE0lEQVQYV2NkYGD4z4AGGOklCAChpQYBD5K5XgAAAABJRU5ErkJggg==)}\n#webamp .character-8230 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAC0lEQVQIHWNAgBUAALQAqf6ZnokAAAAASUVORK5CYII=)}\n#webamp .character-46 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAGUlEQVQYV2NkYGD4z4AGGGki+AhqkRzCNgCztQcBQ/F5qwAAAABJRU5ErkJggg==)}\n#webamp .character-58 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAG0lEQVQYV2NkYGD4z4AGGHELPoIqlYPQFKoEABHUCAEa7xBFAAAAAElFTkSuQmCC)}\n#webamp .character-40 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NgYBBgUABCAQYGAAJMAGFQC8mLAAAAAElFTkSuQmCC)}\n#webamp .character-41 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NgYGhgcADCBgYGAAkMAYFEejkbAAAAAElFTkSuQmCC)}\n#webamp .character-45 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAG0lEQVQYV2NkYGD4z4AGGEkQfISmXY6BgXjtANzFBwGYHC/oAAAAAElFTkSuQmCC)}\n#webamp .character-39 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAADUlEQVQIHWNQYGKAAQABgAAjjGgVVgAAAABJRU5ErkJggg==)}\n#webamp .character-33 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAH0lEQVQYV2NkYGD4z/CIgYFBjgEOGKkhiDAOzMJqJgAQawsBnvEUjAAAAABJRU5ErkJggg==)}\n#webamp .character-95 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAFklEQVQYV2NkYGD4z4AGGGki+AjTIgCyawbjsVUKxAAAAABJRU5ErkJggg==)}\n#webamp .character-43 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEUlEQVQI12NQYGJg+MEAIhkACPABPfEgkLEAAAAASUVORK5CYII=)}\n#webamp .character-92 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAD0lEQVQI12NgYGhgZoBAAATIAI13IxiAAAAAAElFTkSuQmCC)}\n#webamp .character-47 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWNgYOBgEGBQYHBgaAAAAqQA+cACQKYAAAAASUVORK5CYII=)}\n#webamp .character-91 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAHUlEQVQYV2NkYGD4z/CIAQLkIBQjXBAqQFVBJIsAMwMMAVy4DMAAAAAASUVORK5CYII=)}\n#webamp .character-93 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAIElEQVQYV2NkYGD4zwACj8AkA4McAwMjXBAmQU1BJIsACwMMAZBptUcAAAAASUVORK5CYII=)}\n#webamp .character-94 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEElEQVQIHWNQYAhg6GAAAwAH9AD5R+QUOwAAAABJRU5ErkJggg==)}\n#webamp .character-38 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NQYAhgUGCIAJIaAAfsAWHaIpwJAAAAAElFTkSuQmCC)}\n#webamp .character-37 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWNIYMhgEGBQYIhgkAAACgQBacCaDW0AAAAASUVORK5CYII=)}\n#webamp .character-44 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAHklEQVQYV2NkYGD4z4AGGKkl+IiBgUEOYjjCTCRBAMu1CAHlOP+DAAAAAElFTkSuQmCC)}\n#webamp .character-61 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAH0lEQVQYV2NkYGD4z4AGGMGCj5BE5RgYIIIUqkTTDgA65AgBoymWoAAAAABJRU5ErkJggg==)}\n#webamp .character-36 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NQYChgSGAwAJIKAApcAbE85GZ1AAAAAElFTkSuQmCC)}\n#webamp .character-35 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAD0lEQVQI12NIYPjAAMEMABUMAwFxUzDLAAAAAElFTkSuQmCC)}\n#webamp .character-197 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEklEQVQI12NIYJjAAMIfGCYAABIMA2Fjj6V0AAAAAElFTkSuQmCC)}\n#webamp .character-214 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAEElEQVQI12OYwJDAMAEMEwASbAMBKm1nAQAAAABJRU5ErkJggg==)}\n#webamp .character-196 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWOYwMDAkMAwgeEDwwQADwwDAcWvnbkAAAAASUVORK5CYII=)}\n#webamp .character-63 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWNIYJjAIMCQwMDAkAAAC+wBwX8tiscAAAAASUVORK5CYII=)}\n#webamp .character-42 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGAQMAAAAxNcYIAAAABlBMVEUAAAAA4gDJLyihAAAAFElEQVQIHWNgYFBgeMBQwODAwAAACjwBsYRIp8kAAAAASUVORK5CYII=)}\n#webamp .character-60 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAHUlEQVQYV2NkYGD4z/CIAQLkIBQjXBAqQFVBJIsAMwMMAVy4DMAAAAAASUVORK5CYII=)}\n#webamp .character-62 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAIElEQVQYV2NkYGD4zwACj8AkA4McAwMjXBAmQU1BJIsACwMMAZBptUcAAAAASUVORK5CYII=)}\n#webamp .character-123 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAHUlEQVQYV2NkYGD4z/CIAQLkIBQjXBAqQFVBJIsAMwMMAVy4DMAAAAAASUVORK5CYII=)}\n#webamp .character-125 {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAGCAYAAAAL+1RLAAAAIElEQVQYV2NkYGD4zwACj8AkA4McAwMjXBAmQU1BJIsACwMMAZBptUcAAAAASUVORK5CYII=)}\n#webamp .gen-text-a {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAGFBMVEUpKUA3N01bW21iYnN4eIZ/f4yNjZmUlKDQ9WnQAAAAIUlEQVQIHWMAAcZyAQamdAUGVrMABnGVQgY11yKGIIZUACkrA92ildtqAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-a {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAGFBMVEUpKUBGRlmNjZmbm6bGxszU1Nnx8fL///8iRh7bAAAAIUlEQVQIHWMAAcZyAQamdAUGVrMABnGVQgY11yKGIIZUACkrA92ildtqAAAAAElFTkSuQmCC)}\n#webamp .gen-text-b {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAHlBMVEUpKUAxMUdGRlliYnNqanpwcIB4eIZ/f4yNjZmUlKBMQpI+AAAAIUlEQVQI12NgAAHOmVOARIKlAgNnWyuQVRQuAOXOnMoAAFkvBehWf7S3AAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-b {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAHlBMVEUpKUA3N01iYnObm6apqbO4uL/GxszU1Nnx8fL////s2d+PAAAAIUlEQVQI12NgAAHOmVOARIKlAgNnWyuQVRQuAOXOnMoAAFkvBehWf7S3AAAAAElFTkSuQmCC)}\n#webamp .gen-text-c {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJ1BMVEUpKUAxMUc3N00/P1NGRllUVGZbW21qanpwcIB4eIaGhpONjZmUlKBrx3tvAAAAJUlEQVQI12NgAAHWNZMZGHQSdzAw5DgwgAgFBgabgk6gxJ7JDABjoQaLYu6ObAAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-c {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJ1BMVEUpKUA3N01GRllUVGZiYnN/f4yNjZmpqbO4uL/Gxszi4ubx8fL///9AK9zxAAAAJUlEQVQI12NgAAHWNZMZGHQSdzAw5DgwgAgFBgabgk6gxJ7JDABjoQaLYu6ObAAAAABJRU5ErkJggg==)}\n#webamp .gen-text-d {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAElBMVEUpKUBUVGZbW214eIaNjZmUlKBPxwelAAAAG0lEQVQI12NgAALTEAUGU6ZABlOGYAgGsUMUACkqA3OelxceAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-d {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAElBMVEUpKUB/f4yNjZnGxszx8fL///90u0SbAAAAG0lEQVQI12NgAALTEAUGU6ZABlOGYAgGsUMUACkqA3OelxceAAAAAElFTkSuQmCC)}\n#webamp .gen-text-e {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAHlBMVEUpKUA3N00/P1NGRllUVGZbW214eIZ/f4yNjZmUlKBpF6uKAAAAH0lEQVQI12NgAALOmVMZOBOAdJsDA2exABAbAcWmAQA4DwTidXJmqwAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-e {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAHlBMVEUpKUBGRllUVGZiYnN/f4yNjZnGxszU1Nnx8fL///+DgC81AAAAH0lEQVQI12NgAALOmVMZOBOAdJsDA2exABAbAcWmAQA4DwTidXJmqwAAAABJRU5ErkJggg==)}\n#webamp .gen-text-f {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAElBMVEUpKUA3N01GRllbW21qanqUlKC2H8YaAAAAGklEQVQI12NgAALT0CAGUwUg7SwAwSC2AgMAKTIC7Ms0rr0AAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-text-f {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAElBMVEUpKUBGRlliYnONjZmpqbP///9D5gpdAAAAGklEQVQI12NgAALT0CAGUwUg7SwAwSC2AgMAKTIC7Ms0rr0AAAAASUVORK5CYII=)}\n#webamp .gen-text-g {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAIVBMVEUpKUA/P1NGRllUVGZbW21wcIB4eIZ/f4yGhpONjZmUlKCnwN9hAAAAJ0lEQVQIHWMAA8aqZgYGzoQoAQYtBwYGBi2XVQoMnAVeCgyMXa0KAE4GBYcb4B3nAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-g {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAIVBMVEUpKUBUVGZiYnN/f4yNjZm4uL/GxszU1Nni4ubx8fL///+LwSrlAAAAJ0lEQVQIHWMAA8aqZgYGzoQoAQYtBwYGBi2XVQoMnAVeCgyMXa0KAE4GBYcb4B3nAAAAAElFTkSuQmCC)}\n#webamp .gen-text-h {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJFBMVEUpKUBwcIBycoGCgo+hoauqqrO3t767u8O8vMPDw8nGxszKytD26YaTAAAAGElEQVQI12NgAAJphQoITl3BIO08A8YHADj6BOvV9DaxAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-h {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAFVBMVEUpKUCrq7TDw8no6Ovw8PH5+fr///9e3zXEAAAAFklEQVQI12NgAAIxgTQIDgFiozQYHwAqqAOv6ufnjgAAAABJRU5ErkJggg==)}\n#webamp .gen-text-i {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAHBAMAAADdS/HjAAAAFVBMVEUhITkkJDxra3xwcIBycoF6eoiCgo8pCsaXAAAAFUlEQVQI12MQEGQQCoQi4UQGERACABeTAqlm5PZ5AAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-i {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAHBAMAAADdS/HjAAAAFVBMVEUkJDwxMULAwMfDw8ne3uHh4eXl5ehBk9l/AAAAFUlEQVQI12NgFGBgcgCjAAZmCEoAABAKAfHk6DTHAAAAAElFTkSuQmCC)}\n#webamp .gen-text-j {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAGFBMVEUpKUAxMUdGRllNTWBUVGZ4eIaNjZmUlKAAywzwAAAAE0lEQVQI12NgAIFSVCwCxOrJDAAh4QLodMJ9awAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-j {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAGFBMVEUpKUA3N01iYnNwcIB/f4zGxszx8fL///+/0FlwAAAAE0lEQVQI12NgAIFSVCwCxOrJDAAh4QLodMJ9awAAAABJRU5ErkJggg==)}\n#webamp .gen-text-k {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAHlBMVEUpKUAxMUc/P1NGRllNTWBUVGZbW22GhpONjZmUlKC0yuawAAAAIklEQVQI12NgAIFM00lAIiMBSHQGAImKAiDhNhVIGLYzAABxtgda2evVPQAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-k {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAHlBMVEUpKUA3N01UVGZiYnNwcIB/f4yNjZni4ubx8fL////1B4EGAAAAIklEQVQI12NgAIFM00lAIiMBSHQGAImKAiDhNhVIGLYzAABxtgda2evVPQAAAABJRU5ErkJggg==)}\n#webamp .gen-text-l {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAHBAMAAAAyiZrdAAAAElBMVEUpKUAxMUdGRll4eIZ/f4yUlKDDTNTnAAAAFUlEQVQI12NgAIJgNByiJMAQGqoAABtZAp1Ff+GZAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-l {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAHCAYAAADAp4fuAAAAMklEQVQYV2PU1HT4z4AGGP//////+PGzDMnJJXApaghevXqLoa9vFthMEBtsJrLlIAsBN0svzTt3mzcAAAAASUVORK5CYII=)}\n#webamp .gen-text-m {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHBAMAAADHdxFtAAAAIVBMVEUpKUAxMUdGRllUVGZbW21iYnNwcIB4eIZ/f4yGhpOUlKBZcblpAAAAI0lEQVQI12NgAAGtJZzLGbRWaAGJrjIg4bUYSGguBBKqCcsBjp0JorkYhMsAAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-text-m {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHBAMAAADHdxFtAAAAIVBMVEUpKUA3N01iYnN/f4yNjZmbm6a4uL/GxszU1Nni4ub////cS6NmAAAAI0lEQVQI12NgAAGtJZzLGbRWaAGJrjIg4bUYSGguBBKqCcsBjp0JorkYhMsAAAAASUVORK5CYII=)}\n#webamp .gen-text-n {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAHlBMVEUpKUAxMUc3N01GRllNTWBiYnNwcIB4eIaNjZmUlKCfa5y8AAAAIElEQVQI12NgAIIK5clMjA4MTP+NgPgKAxPDeiB+wwAASdwGGeDXGZQAAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-text-n {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAHlBMVEUpKUA3N01GRlliYnNwcICbm6a4uL/Gxszx8fL///8Fv7lnAAAAIElEQVQI12NgAIIK5clMjA4MTP+NgPgKAxPDeiB+wwAASdwGGeDXGZQAAAAASUVORK5CYII=)}\n#webamp .gen-text-o {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAHlBMVEUpKUA/P1NGRllUVGZbW214eIZ/f4yGhpONjZmUlKDmamWaAAAAHElEQVQI12NgAAKx6QYMrSwTGaYwTQFjEBsoBgBK6AZDMgIWOQAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-o {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAHlBMVEUpKUBUVGZiYnN/f4yNjZnGxszU1Nni4ubx8fL////xzWRAAAAAHElEQVQI12NgAAKx6QYMrSwTGaYwTQFjEBsoBgBK6AZDMgIWOQAAAABJRU5ErkJggg==)}\n#webamp .gen-text-p {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJ1BMVEUpKUAxMUc/P1NGRllNTWBbW21iYnNqanpwcIB4eIZ/f4yGhpOUlKBLTaK7AAAAIElEQVQI12NgAIKYM5sYYgxPMMSEHGeIWZnIEGPAAMIAZzYHJUki1qIAAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-text-p {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJ1BMVEUpKUA3N01UVGZiYnNwcICNjZmbm6apqbO4uL/GxszU1Nni4ub////2OqNjAAAAIElEQVQI12NgAIKYM5sYYgxPMMSEHGeIWZnIEGPAAMIAZzYHJUki1qIAAAAASUVORK5CYII=)}\n#webamp .gen-text-q {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJFBMVEUpKUA3N00/P1NGRllUVGZbW214eIZ/f4yGhpONjZmSkp6UlKAHPYNOAAAAI0lEQVQI12NgAAGm6hYGBs6EaAEG6wDrAAjBmdBtAJTY1QAAWmwG3UPBF3oAAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-text-q {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJ1BMVEUpKUBGRllUVGZiYnN/f4yNjZm4uMDGxszU1Nni4ubx8fL7+/v////Rx7x8AAAAI0lEQVQI12NgAAGmnikMDFwFMQIMNgE2ARCCq2COAVDidAIAYQkHOMhnyMoAAAAASUVORK5CYII=)}\n#webamp .gen-text-r {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJ1BMVEUpKUAxMUc3N01GRllUVGZbW21qanpwcIB4eIZ/f4yGhpONjZmUlKDditvQAAAAIklEQVQI12NgAAGbM1uARMAcILHiJJBIPwQkQo4AicCTDACHOAih1LnoFgAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-r {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJ1BMVEUpKUA3N01GRlliYnN/f4yNjZmpqbO4uL/GxszU1Nni4ubx8fL///9vCc2uAAAAIklEQVQI12NgAAGbM1uARMAcILHiJJBIPwQkQo4AicCTDACHOAih1LnoFgAAAABJRU5ErkJggg==)}\n#webamp .gen-text-s {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJFBMVEUpKUAxMUc/P1NGRllUVGZbW21qanpwcIB4eIaGhpONjZmUlKCHjnJIAAAAIklEQVQIHWMAAY1dAQzVygoM1TsDGMRmb2IIZdvE4LnLAQBTHAco/pVKOwAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-s {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJFBMVEUpKUA3N01UVGZiYnN/f4yNjZmpqbO4uL/Gxszi4ubx8fL///+qJyS0AAAAIklEQVQIHWMAAY1dAQzVygoM1TsDGMRmb2IIZdvE4LnLAQBTHAco/pVKOwAAAABJRU5ErkJggg==)}\n#webamp .gen-text-t {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAHCAYAAADAp4fuAAAALklEQVQYV2PU0XH+z4AGGCdMmIMpqKZq819FVZHBzc2eYfXqLQyvX71hYKSBIACnryn7i49aBgAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-t {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAHAgMAAAC9yW99AAAADFBMVEUpKUBUVGZycoH///9VDRy9AAAAE0lEQVQI12NgYGD4f4BBlwEZAQAkDAKhcYNEwQAAAABJRU5ErkJggg==)}\n#webamp .gen-text-u {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAFVBMVEUpKUAxMUdGRllUVGZbW21qanqUlKDA77WeAAAAFklEQVQI12NgAAI3hRRUHJLMIJoWAAA5UATxAlDxBQAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-u {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAFVBMVEUpKUA3N01iYnN/f4yNjZmpqbP///8SF7O4AAAAFklEQVQI12NgAAI3hRRUHJLMIJoWAAA5UATxAlDxBQAAAABJRU5ErkJggg==)}\n#webamp .gen-text-v {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAKlBMVEUpKUAxMUc/P1NGRllNTWBUVGZbW21iYnNqanpwcIB4eIaGhpONjZmUlKDthvA2AAAAIklEQVQIHWMAAd8EWQaeDTEMHJeWMzDfvMTAsHcDA0NtAgBSrAdcNQnv8gAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-v {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAKlBMVEUpKUA3N01UVGZiYnNwcIB/f4yNjZmbm6apqbO4uL/Gxszi4ubx8fL///81zHafAAAAIklEQVQIHWMAAd8EWQaeDTEMHJeWMzDfvMTAsHcDA0NtAgBSrAdcNQnv8gAAAABJRU5ErkJggg==)}\n#webamp .gen-text-w {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHBAMAAADHdxFtAAAALVBMVEUpKUAxMUc3N00/P1NGRllNTWBUVGZbW21iYnNqanpwcIB4eIZ/f4yNjZmUlKD3PA89AAAAKUlEQVQIHWMAg3nqT/wY8rKfdzPIzXt9nIHnXd9jBo7XcRcYWJ7zLQAAwo4M1uKKXVEAAAAASUVORK5CYII=)}\n#webamp .gen-window.selected .gen-text-w {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHBAMAAADHdxFtAAAALVBMVEUpKUA3N01GRllUVGZiYnNwcIB/f4yNjZmbm6apqbO4uL/GxszU1Nnx8fL///+8HCoLAAAAKUlEQVQIHWMAg3nqT/wY8rKfdzPIzXt9nIHnXd9jBo7XcRcYWJ7zLQAAwo4M1uKKXVEAAAAASUVORK5CYII=)}\n#webamp .gen-text-x {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJFBMVEUpKUAxMUc3N01GRllNTWBbW21iYnNwcIB4eIaGhpONjZmUlKDqWCJLAAAAJElEQVQI12NgAAHJiVECDMzbtwCZ2Q0gYhEDA/PWHUCJhOwAAGilBx+T4WwNAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-x {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHBAMAAAA2fErgAAAAJFBMVEUpKUA3N01GRlliYnNwcICNjZmbm6a4uL/Gxszi4ubx8fL///+x/boCAAAAJElEQVQI12NgAAHJiVECDMzbtwCZ2Q0gYhEDA/PWHUCJhOwAAGilBx+T4WwNAAAAAElFTkSuQmCC)}\n#webamp .gen-text-y {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJFBMVEUpKUAxMUc/P1NGRllNTWBUVGZbW21iYnN4eIaGhpONjZmUlKAsqFJVAAAAHklEQVQI12NgAIIdrJsYsrMKGDh3CTCwbGNgYIZgAE8aBbSrMTxDAAAAAElFTkSuQmCC)}\n#webamp .gen-window.selected .gen-text-y {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAHBAMAAADZviHeAAAAJFBMVEUpKUA3N01UVGZiYnNwcIB/f4yNjZmbm6bGxszi4ubx8fL///+UuWJCAAAAHklEQVQI12NgAIIdrJsYsrMKGDh3CTCwbGNgYIZgAE8aBbSrMTxDAAAAAElFTkSuQmCC)}\n#webamp .gen-text-z {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAHBAMAAAAsQKpuAAAAIVBMVEUAAAApKUAxMUc/P1NGRllbW21qanp4eIZ/f4yGhpOUlKAeeVtyAAAAAXRSTlMAQObYZgAAACdJREFUCNdjEBQUYACCqlULQJRgVgCIElkBFtRcDKaiShxA1CqwEgClfwdsfnJFGQAAAABJRU5ErkJggg==)}\n#webamp .gen-window.selected .gen-text-z {background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAHBAMAAAAsQKpuAAAAIVBMVEUAAAApKUA3N01UVGZiYnONjZmpqbPGxszU1Nni4ub///8EpbEBAAAAAXRSTlMAQObYZgAAACdJREFUCNdjEBQUYACCqlULQJRgVgCIElkBFtRcDKaiShxA1CqwEgClfwdsfnJFGQAAAABJRU5ErkJggg==)}\n#webamp .gen-text-a {width: 6px;}\n#webamp .selected .gen-text-a {width: 6px;}\n#webamp .gen-text-b {width: 7px;}\n#webamp .selected .gen-text-b {width: 7px;}\n#webamp .gen-text-c {width: 7px;}\n#webamp .selected .gen-text-c {width: 7px;}\n#webamp .gen-text-d {width: 6px;}\n#webamp .selected .gen-text-d {width: 6px;}\n#webamp .gen-text-e {width: 6px;}\n#webamp .selected .gen-text-e {width: 6px;}\n#webamp .gen-text-f {width: 6px;}\n#webamp .selected .gen-text-f {width: 6px;}\n#webamp .gen-text-g {width: 7px;}\n#webamp .selected .gen-text-g {width: 7px;}\n#webamp .gen-text-h {width: 6px;}\n#webamp .selected .gen-text-h {width: 6px;}\n#webamp .gen-text-i {width: 4px;}\n#webamp .selected .gen-text-i {width: 4px;}\n#webamp .gen-text-j {width: 6px;}\n#webamp .selected .gen-text-j {width: 6px;}\n#webamp .gen-text-k {width: 7px;}\n#webamp .selected .gen-text-k {width: 7px;}\n#webamp .gen-text-l {width: 5px;}\n#webamp .selected .gen-text-l {width: 5px;}\n#webamp .gen-text-m {width: 8px;}\n#webamp .selected .gen-text-m {width: 8px;}\n#webamp .gen-text-n {width: 6px;}\n#webamp .selected .gen-text-n {width: 6px;}\n#webamp .gen-text-o {width: 6px;}\n#webamp .selected .gen-text-o {width: 6px;}\n#webamp .gen-text-p {width: 6px;}\n#webamp .selected .gen-text-p {width: 6px;}\n#webamp .gen-text-q {width: 7px;}\n#webamp .selected .gen-text-q {width: 7px;}\n#webamp .gen-text-r {width: 7px;}\n#webamp .selected .gen-text-r {width: 7px;}\n#webamp .gen-text-s {width: 6px;}\n#webamp .selected .gen-text-s {width: 6px;}\n#webamp .gen-text-t {width: 5px;}\n#webamp .selected .gen-text-t {width: 5px;}\n#webamp .gen-text-u {width: 6px;}\n#webamp .selected .gen-text-u {width: 6px;}\n#webamp .gen-text-v {width: 6px;}\n#webamp .selected .gen-text-v {width: 6px;}\n#webamp .gen-text-w {width: 8px;}\n#webamp .selected .gen-text-w {width: 8px;}\n#webamp .gen-text-x {width: 7px;}\n#webamp .selected .gen-text-x {width: 7px;}\n#webamp .gen-text-y {width: 6px;}\n#webamp .selected .gen-text-y {width: 6px;}\n#webamp .gen-text-z {width: 11px;}\n#webamp .selected .gen-text-z {width: 11px;}\n#webamp #title-bar #close {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAgICAAMDAwAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAB/gAAIgAAAAAAAAAAAAAAAf4AACAAAAAAAAAAAAAcAB/gAAAAAAAAAAAAAAAAHgAf4AAAAAAAAAAAAAAAAB/gPgAAADwAAAAAAAAAAAAf/gAAAAA8AAAAAAAAAAAAH//iIiAAPAAAAAAAAAAAAB//4iIAADwAAAAAAAAAAAAf/iIgAAA8AAAAAAAAAAAAH/4iAAAAAAAAAAAAAAAAAB/iIAAAAAAAAAAAAAAAAAAf4gAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8P///+HP//3hz//8w8///EP///wHz//8AE///ADP//wBz//8A8///AfP//wP///8H////D////x////8/////f////w==), auto}\n#webamp #equalizer-window .band {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPcAAAAAAAAAAAAAAAAAAA/3cAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAAAAAAAAAAAAAAAAAAj3AAAA9wAAAAAAAAAAgACPcAAAAPcAAAAAAAAAAIcAj3AAAAAAAAAAAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAA/3cAAAAAAAAACP/3d3AAAA9wAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////////////////////////////////////////8////+H///jA///wwP//8P///+Hz//3h4f/8w+H//EPz//wH///8AED//ADA//wB4f/8A/P//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #equalizer-window .title-bar {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3AAAAAAAAAAAAAAAAAAAP93AAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAP93AAAAAAAACP/3d3AAAAAPcAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////P////h///jwP//w8D//8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AHA//ADwP/wB+H/8A/z//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #equalizer-window.shade {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3AAAAAAAAAAAAAAAAAAAP93AAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAP93AAAAAAAACP/3d3AAAAAPcAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////P////h///jwP//w8D//8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AHA//ADwP/wB+H/8A/z//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #equalizer-window.shade input {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3AAAAAAAAAAAAAAAAAAAP93AAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAP93AAAAAAAACP/3d3AAAAAPcAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////P////h///jwP//w8D//8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AHA//ADwP/wB+H/8A/z//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp .window {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAgICAAMDAwAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAcAB/gAAAAAAAAAAAAAAAAHgAf4AAAAAAAAAAAAAAAAB/gPgAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAH//iIiAAAAAAAAAAAAAAAB//4iIAAAAAAAAAAAAAAAAf/iIgAAAAAAAAAAAAAAAAH/4iAAAAAAAAAAAAAAAAAB/iIAAAAAAAAAAAAAAAAAAf4gAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8P///+H///3h///8w////EP///wH///8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp .window input {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAgICAAMDAwAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAcAB/gAAAAAAAAAAAAAAAAHgAf4AAAAAAAAAAAAAAAAB/gPgAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAH//iIiAAAAAAAAAAAAAAAB//4iIAAAAAAAAAAAAAAAAf/iIgAAAAAAAAAAAAAAAAH/4iAAAAAAAAAAAAAAAAAB/iIAAAAAAAAAAAAAAAAAAf4gAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8P///+H///3h///8w////EP///wH///8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #main-window {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAgICAAMDAwAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAcAB/gAAAAAAAAAAAAAAAAHgAf4AAAAAAAAAAAAAAAAB/gPgAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAH//iIiAAAAAAAAAAAAAAAB//4iIAAAAAAAAAAAAAAAAf/iIgAAAAAAAAAAAAAAAAH/4iAAAAAAAAAAAAAAAAAB/iIAAAAAAAAAAAAAAAAAAf4gAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8P///+H///3h///8w////EP///wH///8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #main-window.shade #title-bar {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAgICAAMDAwAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAcAB/gAAAAAAAAAAAAAAAAHgAf4AAAAAAAAAAAAAAAAB/gPgAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAH//iIiAAAAAAAAAAAAAAAB//4iIAAAAAAAAAAAAAAAAf/iIgAAAAAAAAAAAAAAAAH/4iAAAAAAAAAAAAAAAAAB/iIAAAAAAAAAAAAAAAAAAf4gAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8P///+H///3h///8w////EP///wH///8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #playlist-window {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAgICAAMDAwAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAf4AAAAAAAAAAAAAAAAcAB/gAAAAAAAAAAAAAAAAHgAf4AAAAAAAAAAAAAAAAB/gPgAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAH//iIiAAAAAAAAAAAAAAAB//4iIAAAAAAAAAAAAAAAAf/iIgAAAAAAAAAAAAAAAAH/4iAAAAAAAAAAAAAAAAAB/iIAAAAAAAAAAAAAAAAAAf4gAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8P///+H///3h///8w////EP///wH///8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #playlist-window .playlist-top {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3AAAAAAAAAAAAAAAAAAAP93AAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAP93AAAAAAAACP/3d3AAAAAPcAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////P////h///jwP//w8D//8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AHA//ADwP/wB+H/8A/z//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #main-window #position {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAAAAAAAAAAAACP/3d3AAAAAAAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #playlist-window #playlist-resize-target {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPcAAAAAAAAAAAAAAAAAAA/3cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAcAAAAAAAAAAACPcAAAdwAHcAAAAAAAAAAAj3AAAP8AD/AAAAAAAAgACPcAAAAAAA8AAAAAAAAIcAj3AAAAAAAAAAAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAAAAAAAAAAAACP/3d3AAAAAAAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////n////w////4H///iB///w/n//8OY//+HCH/3hwh/8w+Y//EP+f/wH///8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #playlist-window .playlist-scrollbar {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPcAAAAAAAAAAAAAAAAAAA/3cAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAAAAAAAAAAAAAAAAAAj3AAAA9wAAAAAAAAAAgACPcAAAAPcAAAAAAAAAAIcAj3AAAAAAAAAAAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAA/3cAAAAAAAAACP/3d3AAAA9wAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////////////////////////////////////////8////+H///jA///wwP//8P///+Hz//3h4f/8w+H//EPz//wH///8AED//ADA//wB4f/8A/P//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #main-window #title-bar {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3AAAAAAAAAAAAAAAAAAAP93AAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAP93AAAAAAAACP/3d3AAAAAPcAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////////////////////////////////////////////////P////h///jwP//w8D//8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AHA//ADwP/wB+H/8A/z//Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #volume {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAAAAAAAAAAAACP/3d3AAAAAAAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #volume input {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAAAAAAAAAAAACP/3d3AAAAAAAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp #balance {cursor: url(data:image/x-win-bitmap;base64,AAACAAEAICAAAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAgAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACAAAAAgIAAgAAAAIAAgACAgAAAwMDAAICAgAAAAP8AAP8AAAD//wD/AAAA/wD/AP//AAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHcAAAAAAAAAAAAAAAAAAAj3AAAAAAAAAAAAAAAAAACPcAAHAAAAAHAAAAAAAAAAj3AAdwAHcAB3AAAAAAgACPcAAP8AD/AA/wAAAAAIcAj3AAAPAAAAAPAAAAAACPcPcAAAAAAAAAAAAAAAAAj/cAAAAAAAAAAAAAAAAAAI//d3dwAAAAAAAAAAAAAACP/3d3AAAAAAAAAAAAAAAAj/d3cAAAAAAAAAAAAAAAAI/3dwAAAAAAAAAAAAAAAACPd3AAAAAAAAAAAAAAAAAAj3cAAAAAAAAAAAAAAAAAAIdwAAAAAAAAAAAAAAAAAACHAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////j////w////8M/P/+GMx/3hCEP8wwhD/EOMx/wHz8/8AH///AD///wB///8A////Af///wP///8H////D////x////8/////f////w==), auto}\n#webamp-context-menu .context-menu {\n  left: 0px;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n  cursor: default;\n}\n#webamp-context-menu .context-menu.bottom {\n  top: 12px;\n}\n#webamp-context-menu .context-menu.top {\n  top: 0px;\n}\n#webamp-context-menu .context-menu,\n#webamp-context-menu .context-menu ul {\n  z-index: 50; /* Gross */\n  background-color: #ffffff;\n  position: absolute;\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  border: 1px solid #a7a394;\n  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\n}\n#webamp-context-menu .context-menu li {\n  position: relative;\n  font-family: \"Tahoma\";\n  font-size: 11px;\n  color: black;\n  white-space: nowrap;\n  margin: 2px;\n  padding: 1px 18px 3px 18px;\n  display: block;\n}\n#webamp-context-menu .context-menu li.checked:before {\n  float: left;\n  /* TODO: Use an image */\n  content: \"\\2713\";\n  margin-left: -12px;\n}\n#webamp-context-menu .context-menu li.parent:after {\n  float: right;\n  content: \"\\25b8\";\n  margin-right: -12px;\n}\n#webamp-context-menu .context-menu li a {\n  text-decoration: none;\n  color: black;\n  cursor: default;\n}\n#webamp-context-menu .context-menu li:hover,\n#webamp-context-menu .context-menu li:hover a {\n  background-color: #224eb7;\n  color: #ffffff;\n}\n#webamp-context-menu .context-menu li.hr {\n  padding: 2px 0;\n}\n#webamp-context-menu .context-menu li.hr:hover {\n  background-color: #ffffff;\n}\n#webamp-context-menu .context-menu li.hr hr {\n  border: none;\n  height: 1px;\n  background-color: #a7a394;\n  margin: 0;\n  padding: 0;\n}\n#webamp-context-menu .context-menu ul {\n  display: none;\n  left: 100%;\n  margin-left: -3px;\n}\n#webamp-context-menu .context-menu li:hover > ul {\n  display: block;\n}\n/* Styles */\n#webamp #equalizer-window {\n  height: 116px;\n  width: 275px;\n}\n#webamp #equalizer-window.shade {\n  height: 14px;\n}\n#webamp #equalizer-volume {\n  position: absolute;\n  left: 61px;\n  top: 4px;\n  height: 6px;\n  width: 97px;\n  background-position: 0 0;\n}\n#webamp #equalizer-volume::-webkit-slider-thumb {\n  height: 7px;\n  width: 3px;\n}\n#webamp #equalizer-volume::-moz-range-thumb {\n  height: 7px;\n  width: 3px;\n}\n#webamp #equalizer-balance {\n  position: absolute;\n  left: 164px;\n  top: 4px;\n  height: 6px;\n  width: 43px;\n  background-position: 0 0;\n}\n#webamp #equalizer-balance::-webkit-slider-thumb {\n  height: 7px;\n  width: 3px;\n}\n#webamp #equalizer-balance::-moz-range-thumb {\n  height: 7px;\n  width: 3px;\n}\n#webamp .equalizer-top {\n  height: 14px;\n  width: 275px;\n  position: relative;\n}\n#webamp #equalizer-close {\n  position: absolute;\n  height: 9px;\n  width: 9px;\n  left: 264px;\n  top: 3px;\n}\n#webamp #equalizer-shade {\n  position: absolute;\n  height: 9px;\n  width: 9px;\n  left: 254px;\n  top: 3px;\n}\n#webamp #on {\n  position: absolute;\n  width: 26px;\n  height: 12px;\n  top: 18px;\n  left: 14px;\n}\n#webamp #auto {\n  position: absolute;\n  width: 32px;\n  height: 12px;\n  top: 18px;\n  left: 40px;\n}\n#webamp #presets-context {\n  position: absolute;\n  width: 44px;\n  height: 12px;\n  top: 18px;\n  left: 217px;\n}\n#webamp #presets {\n  width: 100%;\n  height: 100%;\n}\n#webamp #eqGraph {\n  position: absolute;\n  width: 113px;\n  height: 19px;\n  top: 17px;\n  left: 86px;\n}\n#webamp #preamp {\n  position: absolute;\n  left: 21px;\n  top: 38px;\n}\n#webamp #plus12db {\n  position: absolute;\n  left: 45px;\n  top: 36px;\n  width: 22px;\n  height: 8px;\n}\n#webamp #zerodb {\n  position: absolute;\n  left: 45px;\n  top: 64px;\n  width: 22px;\n  height: 8px;\n}\n#webamp #minus12db {\n  position: absolute;\n  left: 45px;\n  top: 95px;\n  width: 22px;\n  height: 8px;\n}\n#webamp #band-60 {\n  position: absolute;\n  left: 78px;\n  top: 38px;\n}\n#webamp #band-170 {\n  position: absolute;\n  left: 96px;\n  top: 38px;\n}\n#webamp #band-310 {\n  position: absolute;\n  left: 114px;\n  top: 38px;\n}\n#webamp #band-600 {\n  position: absolute;\n  left: 132px;\n  top: 38px;\n}\n#webamp #band-1000 {\n  position: absolute;\n  left: 150px;\n  top: 38px;\n}\n#webamp #band-3000 {\n  position: absolute;\n  left: 168px;\n  top: 38px;\n}\n#webamp #band-6000 {\n  position: absolute;\n  left: 186px;\n  top: 38px;\n}\n#webamp #band-12000 {\n  position: absolute;\n  left: 204px;\n  top: 38px;\n}\n#webamp #band-14000 {\n  position: absolute;\n  left: 222px;\n  top: 38px;\n}\n#webamp #band-16000 {\n  position: absolute;\n  left: 240px;\n  top: 38px;\n}\n#webamp .gen-text-space {\n  width: 5px;\n}\n#webamp .gen-text-letter {\n  height: 7px;\n  display: inline-block;\n}\n#webamp .gen-window {\n  /* Default size */\n  width: 275px;\n  height: 116px;\n  display: flex;\n  flex-direction: column;\n}\n#webamp .gen-top {\n  height: 20px;\n  display: flex;\n  flex-direction: row;\n}\n#webamp .gen-top-left {\n  width: 25px;\n  height: 20px;\n}\n#webamp .gen-top-title {\n  line-height: 7px;\n  margin-top: 2px;\n  /* TODO: This should be a conciquence of the repeating tiles, not hard coded */\n  padding: 0 3px 0 4px;\n}\n#webamp .gen-top-left-fill {\n  flex-grow: 1;\n  height: 20px;\n  background-position: left;\n}\n#webamp .gen-top-right-fill {\n  flex-grow: 1;\n  height: 20px;\n  background-position: right;\n}\n#webamp .gen-top-left-end {\n  width: 25px;\n  height: 20px;\n}\n#webamp .gen-top-right {\n  width: 25px;\n  height: 20px;\n}\n#webamp .gen-top-right-end {\n  width: 25px;\n  height: 20px;\n}\n#webamp .gen-close {\n  width: 9px;\n  height: 9px;\n  position: absolute;\n  right: 2px;\n  top: 3px;\n}\n#webamp .gen-middle {\n  flex-grow: 1;\n  display: flex;\n  flex-direction: row;\n  position: relative;\n}\n#webamp .gen-middle-left {\n  width: 11px;\n}\n#webamp .gen-middle-left-bottom {\n  width: 11px;\n  height: 24px;\n  bottom: 0;\n  position: absolute;\n}\n#webamp .gen-middle-center {\n  flex-grow: 1;\n  position: relative;\n}\n#webamp .gen-middle-right {\n  width: 8px;\n}\n#webamp .gen-middle-right-bottom {\n  width: 8px;\n  height: 24px;\n  bottom: 0;\n  position: absolute;\n}\n#webamp .gen-bottom {\n  height: 14px;\n  background-repeat: repeat-x;\n}\n#webamp .gen-bottom-left {\n  position: absolute;\n  left: 0;\n  width: 125px;\n  height: 14px;\n}\n#webamp .gen-bottom-right {\n  position: absolute;\n  right: 0;\n  width: 125px;\n  height: 14px;\n}\n#webamp .gen-bottom-right #gen-resize-target {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  height: 20px;\n  width: 20px;\n}\n/* Styles */\n#webamp #main-window {\n  position: absolute;\n  height: 116px;\n  width: 275px;\n  /* Ask the browser to scale showing large pixels if possible */\n  image-rendering: -moz-crisp-edges; /* Firefox */\n  image-rendering: -o-crisp-edges; /* Opera */\n  image-rendering: -webkit-optimize-contrast; /* Safari */\n  image-rendering: pixelated; /* Only in Chrome > 40 */\n  -ms-interpolation-mode: nearest-neighbor; /* IE (non-standard property) */\n}\n#webamp #title-bar {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 14px;\n  width: 275px;\n}\n#webamp #option-context,\n#webamp #minimize,\n#webamp #shade,\n#webamp #close {\n  position: absolute;\n  height: 9px;\n  width: 9px;\n  top: 3px;\n}\n#webamp #title-bar #option {\n  width: 100%;\n  height: 100%;\n}\n#webamp #title-bar #option-context {\n  left: 6px;\n}\n#webamp #title-bar #minimize {\n  left: 244px;\n}\n#webamp #title-bar #shade {\n  left: 254px;\n}\n#webamp #title-bar #close {\n  left: 264px;\n}\n#webamp #clutter-bar {\n  position: absolute;\n  top: 22px;\n  left: 10px;\n  height: 43px;\n  width: 8px;\n}\n#webamp #clutter-bar div {\n  position: absolute;\n  height: 7px;\n  width: 8px;\n  left: 0px;\n}\n#webamp #clutter-bar #button-o {\n  top: 3px;\n  height: 8px;\n}\n#webamp #clutter-bar #button-a {\n  top: 11px;\n}\n#webamp #clutter-bar #button-i {\n  top: 18px;\n}\n#webamp #clutter-bar #button-d {\n  top: 25px;\n  height: 8px;\n}\n#webamp #clutter-bar #button-v {\n  top: 33px;\n}\n#webamp #play-pause {\n  position: absolute;\n  top: 28px;\n  left: 26px;\n  height: 9px;\n  width: 9px;\n  background-repeat: no-repeat;\n}\n#webamp .play #work-indicator,\n#webamp #work-indicator.selected {\n  position: absolute;\n  top: 28px;\n  left: 24px;\n  height: 9px;\n  width: 3px;\n}\n#webamp .webamp-status #time {\n  position: absolute;\n  left: 39px;\n  top: 26px;\n  /* Just to make it clickable */\n  height: 13px;\n  width: 59px;\n}\n#webamp .stop .webamp-status #time {\n  display: none;\n}\n#webamp .pause .webamp-status #time {\n  animation: blink 2s step-start 1s infinite;\n  -webkit-animation: blink 2s step-start 1s infinite;\n}\n#webamp .webamp-status #time #minus-sign {\n  /* Note that this get's augmented by the skin CSS if NUM_EX.BMP is present */\n  position: absolute;\n  top: 6px;\n  left: -1px;\n  width: 5px;\n  height: 1px;\n}\n#webamp .webamp-status #time #minute-first-digit {\n  position: absolute;\n  pointer-events: none;\n  left: 9px;\n  height: 13px;\n  width: 9px;\n}\n#webamp .webamp-status #time #minute-second-digit {\n  position: absolute;\n  pointer-events: none;\n  left: 21px;\n  height: 13px;\n  width: 9px;\n}\n#webamp .webamp-status #time #second-first-digit {\n  position: absolute;\n  pointer-events: none;\n  left: 39px;\n  height: 13px;\n  width: 9px;\n}\n#webamp .webamp-status #time #second-second-digit {\n  position: absolute;\n  pointer-events: none;\n  left: 51px;\n  height: 13px;\n  width: 9px;\n}\n#webamp #main-window #visualizer {\n  position: absolute;\n  top: 43px;\n  left: 24px;\n}\n#webamp #main-window.shade #visualizer {\n  top: 5px;\n  left: 79px;\n}\n#webamp .text {\n  display: none;\n}\n#webamp #marquee {\n  position: absolute;\n  left: 111px;\n  top: 24px;\n  width: 154px;\n  height: 6px;\n  overflow: hidden;\n  display: block;\n  padding: 3px 0px; /* Ensure the target is correct for the cursor */\n}\n#webamp .media-info #kbps {\n  position: absolute;\n  left: 111px;\n  top: 43px;\n  width: 15px;\n  height: 6px;\n  overflow: hidden;\n}\n#webamp .stop .media-info #kbps {\n  display: none;\n}\n#webamp .media-info #khz {\n  position: absolute;\n  left: 156px;\n  top: 43px;\n  width: 10px;\n  height: 6px;\n  overflow: hidden;\n}\n#webamp .stop .media-info #khz {\n  display: none;\n}\n#webamp .media-info .mono-stereo {\n  position: absolute;\n  left: 212px;\n  top: 41px;\n  width: 57px;\n  height: 12px;\n}\n#webamp .media-info .mono-stereo div {\n  position: absolute;\n  height: 12px;\n}\n#webamp .media-info .mono-stereo #mono {\n  width: 27px;\n}\n#webamp .media-info .mono-stereo #stereo {\n  left: 27px;\n  width: 29px;\n}\n#webamp #volume {\n  position: absolute;\n  left: 107px;\n  top: 57px;\n  height: 13px;\n  width: 68px;\n  background-position: 0 0;\n}\n#webamp #volume input {\n  height: 13px;\n  /* The input itself, is actually 3px shorter than the background\n     * https://twitter.com/LuigiHann/status/959275940688867328\n     */\n  width: 65px;\n  display: block;\n}\n#webamp #volume input::-webkit-slider-thumb {\n  top: 1px;\n  height: 11px;\n  width: 14px;\n}\n#webamp #volume input::-moz-range-thumb {\n  top: 1px;\n  height: 11px;\n  width: 14px;\n}\n#webamp #balance {\n  position: absolute;\n  left: 177px;\n  top: 57px;\n  height: 13px;\n  width: 38px;\n  background-position: 0 0;\n}\n#webamp #balance::-webkit-slider-thumb {\n  top: 1px;\n  height: 11px;\n  width: 14px;\n}\n#webamp #balance::-moz-range-thumb {\n  top: 1px;\n  height: 11px;\n  width: 14px;\n}\n#webamp .windows {\n  position: absolute;\n  left: 219px;\n  top: 58px;\n  width: 46px;\n  height: 12px;\n}\n#webamp .windows div {\n  position: absolute;\n  width: 23px;\n  height: 12px;\n}\n#webamp .windows #equalizer-button {\n  left: 0;\n}\n#webamp .windows #playlist-button {\n  left: 23px;\n}\n#webamp #position {\n  position: absolute;\n  left: 16px;\n  top: 72px;\n  width: 248px;\n  height: 10px;\n}\n#webamp #position::-webkit-slider-thumb {\n  height: 10px;\n  width: 29px;\n  /*\n     * Fix the strange bug in Safair/mobile-chrome\n     * http://stackoverflow.com/questions/26727769/rendering-glitch-when-manipulating-range-input-value-via-javascript-in-webkit\n     */\n  -webkit-box-sizing: border-box;\n  position: relative;\n}\n#webamp #position::-moz-range-thumb {\n  height: 10px;\n  width: 29px;\n}\n/* For some reason, we can't use display: none here */\n#webamp .stop #position::-webkit-slider-thumb {\n  visibility: hidden;\n}\n#webamp .stop #position::-moz-range-thumb {\n  visibility: hidden;\n}\n/* For some reason this is needed for the position slider to show up now that\n * we are using React.\n */\n#webamp .play #position::-webkit-slider-thumb {\n  visibility: visible;\n}\n#webamp .actions div {\n  height: 18px;\n  width: 23px;\n  position: absolute;\n}\n#webamp .actions #previous {\n  top: 88px;\n  left: 16px;\n}\n#webamp .actions #play {\n  top: 88px;\n  left: 39px;\n}\n#webamp .actions #pause {\n  top: 88px;\n  left: 62px;\n}\n#webamp .actions #stop {\n  top: 88px;\n  left: 85px;\n}\n#webamp .actions #next {\n  top: 88px;\n  left: 108px;\n  width: 22px;\n}\n#webamp #eject {\n  position: absolute;\n  top: 89px;\n  left: 136px;\n  height: 16px;\n  width: 22px;\n}\n#webamp .shuffle-repeat {\n  position: absolute;\n  top: 89px;\n  left: 164px;\n  width: 74px;\n}\n#webamp .shuffle-repeat div {\n  position: absolute;\n  height: 15px;\n}\n#webamp .shuffle-repeat #shuffle {\n  width: 47px;\n}\n#webamp .shuffle-repeat #repeat {\n  left: 46px;\n  width: 28px;\n}\n#webamp #about {\n  position: absolute;\n  top: 91px;\n  left: 253px;\n  height: 15px;\n  width: 13px;\n}\n#webamp .digit {\n  position: absolute;\n  display: inline-block;\n  width: 9px;\n  height: 13px;\n  background-repeat: no-repeat;\n  text-indent: -9999px;\n}\n/* Shade View */\n#webamp #main-window.shade {\n  height: 14px;\n}\n#webamp .shade .media-info,\n#webamp .shade .windows,\n#webamp .shade #volume,\n#webamp .shade #balance,\n#webamp .shade .shuffle-repeat,\n#webamp .shade .webamp-status {\n  display: none;\n}\n#webamp .shade #title-bar {\n}\n#webamp .shade .actions div {\n  position: absolute;\n}\n#webamp .shade .actions #previous,\n#webamp .shade .actions #previous.winamp-active {\n  background: none;\n  height: 10px;\n  width: 7px;\n  top: 2px;\n  left: 169px;\n}\n#webamp .shade .actions #play,\n#webamp .shade .actions #play.winamp-active {\n  background: none;\n  height: 10px;\n  width: 10px;\n  top: 2px;\n  left: 176px;\n}\n#webamp .shade .actions #pause,\n#webamp .shade .actions #pause.winamp-active {\n  background: none;\n  height: 10px;\n  width: 9px;\n  top: 2px;\n  left: 186px;\n}\n#webamp .shade .actions #stop,\n#webamp .shade .actions #stop.winamp-active {\n  background: none;\n  height: 10px;\n  width: 9px;\n  top: 2px;\n  left: 195px;\n}\n#webamp .shade .actions #next,\n#webamp .shade .actions #next.winamp-active {\n  background: none;\n  height: 10px;\n  width: 10px;\n  top: 2px;\n  left: 204px;\n}\n#webamp .shade #eject,\n#webamp .shade #eject.winamp-active {\n  height: 10px;\n  width: 10px;\n  top: 2px;\n  left: 215px;\n  background: none;\n}\n#webamp .shade #position {\n  position: absolute;\n  left: 226px;\n  top: 4px;\n  width: 17px;\n  height: 7px;\n}\n#webamp .shade #position::-webkit-slider-thumb {\n  height: 7px;\n  width: 3px;\n  /* This make it appear. Not sure why */\n  background: none;\n}\n#webamp .shade #position::-moz-range-thumb {\n  height: 7px;\n  width: 3px;\n  /* This make it appear. Not sure why */\n  background: none;\n}\n#webamp #main-window .mini-time {\n  position: absolute;\n  top: 4px;\n  left: 127px;\n}\n.webamp-desktop {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: -1;\n}\n#webamp .mini-time {\n  display: block;\n  height: 6px;\n  width: 25px;\n}\n#webamp .mini-time.blinking .character:not(.background-character) {\n  animation: blink 2s step-start 1s infinite;\n  -webkit-animation: blink 2s step-start 1s infinite;\n}\n#webamp .mini-time .background-character {\n  z-index: 1;\n}\n#webamp .mini-time .character {\n  position: absolute;\n  top: 0;\n  z-index: 2;\n}\n/* Styles */\n#webamp #playlist-window {\n  display: flex;\n  flex-direction: column;\n}\n#webamp .playlist-top {\n  width: 100%;\n  min-height: 20px;\n  max-height: 20px;\n  position: relative;\n  display: flex;\n}\n#webamp .playlist-top-left {\n  width: 25px;\n}\n#webamp .playlist-top-left-spacer {\n  width: 12px;\n}\n#webamp .playlist-top-left-fill {\n  flex-grow: 1;\n  background-position: right;\n}\n#webamp .playlist-top-right-spacer {\n  /* This goes to the right of the center */\n  width: 13px;\n}\n#webamp .playlist-top-right-fill {\n  flex-grow: 1;\n  background-position: right;\n}\n#webamp .playlist-top-title {\n  width: 100px;\n}\n#webamp .playlist-top-right {\n  width: 25px;\n}\n#webamp .playlist-middle {\n  flex-grow: 1;\n  display: flex;\n  flex-direction: row;\n  overflow: hidden;\n}\n#webamp .playlist-middle-left {\n  background-repeat: repeat-y;\n  width: 12px;\n  min-width: 12px;\n}\n#webamp .playlist-middle-center {\n  flex-grow: 1;\n  padding: 3px 0;\n  min-width: 0; /* Not sure why this is needed */\n}\n#webamp .playlist-tracks {\n  display: flex;\n  flex: 1 0 auto;\n}\n#webamp .playlist-tracks .track-cell {\n  height: 13px;\n  line-height: 13px;\n  font-size: 9px;\n  letter-spacing: 0.5px;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n}\n#webamp .playlist-track-durations > div {\n  padding-right: 3px;\n  text-align: right;\n}\n#webamp .playlist-track-titles {\n  flex: 1 1 auto;\n  overflow: hidden;\n}\n#webamp .playlist-track-titles > div {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n}\n#webamp .playlist-middle-right {\n  background-repeat: repeat-y;\n  background-position: top right;\n  width: 20px;\n  min-width: 20px;\n  position: relative;\n  padding-bottom: 18px;\n}\n#webamp .playlist-bottom {\n  width: 100%;\n  height: 38px;\n  min-height: 38px;\n  max-height: 38px;\n  position: relative;\n}\n#webamp .playlist-bottom-left {\n  width: 125px;\n  height: 100%;\n  position: absolute;\n}\n#webamp .playlist-menu li {\n  list-style: none;\n  display: none;\n  width: 22px;\n  height: 18px;\n  padding: 0;\n  margin: 0;\n}\n#webamp .playlist-menu li > div {\n  height: 100%;\n}\n#webamp .playlist-menu ul {\n  padding: 0;\n  margin: 0;\n  position: absolute;\n  bottom: 0;\n}\n#webamp .playlist-menu.selected li {\n  display: block;\n}\n#webamp .playlist-menu .bar {\n  position: absolute;\n  bottom: 0;\n  left: -3px;\n  width: 3px;\n  height: 54px;\n}\n#webamp #playlist-add-menu {\n  position: absolute;\n  bottom: 12px;\n  left: 14px;\n  width: 22px;\n  height: 18px;\n}\n#webamp #playlist-remove-menu.playlist-menu .bar {\n  height: 72px;\n}\n#webamp #playlist-remove-menu {\n  position: absolute;\n  bottom: 12px;\n  left: 43px;\n  width: 22px;\n  height: 18px;\n}\n#webamp #playlist-selection-menu {\n  position: absolute;\n  bottom: 12px;\n  left: 72px;\n  width: 22px;\n  height: 18px;\n}\n#webamp #playlist-misc-menu {\n  position: absolute;\n  bottom: 12px;\n  left: 101px;\n  width: 22px;\n  height: 18px;\n}\n#webamp #playlist-list-menu {\n  position: absolute;\n  bottom: 12px;\n  right: 22px;\n  width: 22px;\n  height: 18px;\n}\n#webamp .playlist-bottom-right {\n  width: 150px;\n  height: 100%;\n  position: absolute;\n  right: 0;\n}\n#webamp .playlist-running-time-display {\n  position: absolute;\n  top: 10px;\n  left: 7px;\n  height: 10px;\n}\n#webamp .playlist-action-buttons {\n  position: absolute;\n  top: 22px;\n  left: 3px;\n  display: flex;\n}\n#webamp .playlist-action-buttons > div {\n  height: 10px;\n  width: 10px;\n}\n#webamp #playlist-window .playlist-visualizer {\n  width: 75px;\n  height: 100%;\n  position: absolute;\n  right: 150px;\n}\n#webamp #playlist-window .mini-time {\n  position: absolute;\n  top: 23px;\n  left: 66px;\n}\n#webamp #playlist-window #playlist-resize-target {\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  height: 20px;\n  width: 20px;\n}\n#webamp #playlist-close-button {\n  position: absolute;\n  right: 2px;\n  height: 9px;\n  width: 9px;\n  top: 3px;\n}\n#webamp #playlist-shade-button {\n  position: absolute;\n  right: 12px;\n  height: 9px;\n  width: 9px;\n  top: 3px;\n}\n#webamp #playlist-window-shade {\n  height: 14px;\n}\n#webamp #playlist-window-shade .left {\n  height: 14px;\n  background-repeat: no-repeat;\n}\n#webamp #playlist-window-shade .right {\n  height: 14px;\n  background-repeat: no-repeat;\n  background-position-x: right;\n}\n#webamp #playlist-window #playlist-scroll-up-button,\n#webamp #playlist-window #playlist-scroll-down-button {\n  position: absolute;\n  width: 8px;\n  height: 5px;\n  right: 7px;\n}\n#webamp #playlist-window #playlist-scroll-up-button {\n  top: 2px;\n}\n#webamp #playlist-window #playlist-scroll-down-button {\n  top: 8px;\n}\n#webamp #playlist-window-shade #playlist-resize-target {\n  position: absolute;\n  right: 20px;\n  top: 3px;\n  height: 9px;\n  width: 9px;\n}\n#webamp #playlist-shade-track-title {\n  position: absolute;\n  top: 4px;\n  left: 5px;\n}\n#webamp #playlist-shade-time {\n  position: absolute;\n  top: 4px;\n  right: 30px;\n}\n#webamp #playlist-window .visualizer-wrapper {\n  position: absolute;\n  top: 12px;\n  left: 2px;\n  width: 72px;\n  overflow: hidden;\n}\n/* Rules used by all windows */\n#webamp {\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n/* Prevent accidental highlighting */\n#webamp canvas {\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n}\n#webamp * {\n  /* Some environments globably change the box-sizing */\n  box-sizing: content-box;\n  -webkit-box-sizing: content-box;\n}\n#webamp *:focus {\n  outline: 0;\n}\n/* Range input css reset */\n#webamp input[type=\"range\"] {\n  -webkit-appearance: none;\n  margin: 0;\n  padding: 0;\n  background: none;\n  border: none;\n}\n#webamp input[type=\"range\"]::-webkit-slider-thumb {\n  -webkit-appearance: none;\n  border: none;\n  border-radius: 0;\n  background: none;\n}\n#webamp input[type=\"range\"]::-moz-range-thumb {\n  border: none;\n  border-radius: 0;\n  background: none;\n}\n#webamp input[type=\"range\"]::-moz-range-track {\n  border: none;\n  background: none;\n}\n#webamp input[type=\"range\"]:focus {\n  outline: none;\n}\n#webamp input[type=\"range\"]::-moz-focus-outer {\n  border: 0;\n}\n#webamp a:focus {\n  outline: none;\n}\n/* Animation */\n@keyframes blink {\n  0% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n@-webkit-keyframes blink {\n  0% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n#webamp .character {\n  display: inline-block;\n  vertical-align: top;\n  width: 5px;\n  height: 6px;\n  /* background-image: TEXT.BMP via Javascript */\n  text-indent: -9999px;\n}\n#webamp .window {\n  position: absolute;\n  /* Ask the browser to scale showing large pixels if possible */\n  image-rendering: -moz-crisp-edges; /* Firefox */\n  image-rendering: -o-crisp-edges; /* Opera */\n  image-rendering: -webkit-optimize-contrast; /* Safari */\n  image-rendering: pixelated; /* Only in Chrome > 40 */\n  -ms-interpolation-mode: nearest-neighbor; /* IE (non-standard property) */\n}\n#webamp .window {\n  /* Work around rendering bug with clip-path */\n  -webkit-transform: translateZ(0);\n}\n#webamp .window.doubled {\n  -moz-transform: translateZ(0) scale(2);\n  -moz-transform-origin: top left;\n  -webkit-transform: translateZ(0) scale(2);\n  -webkit-transform-origin: top left;\n}\n" }), Q.jsxs("div", {
		onBlur: (m) => {
			m.currentTarget.contains(m.relatedTarget) || I(null);
		},
		children: [Q.jsx(fI, {}), Q.jsx(Yk, {
			renderContents: () => Q.jsx(mv, { filePickers: _ }),
			children: Q.jsx(Ay, {
				windows: H(),
				parentDomNode: S
			})
		})]
	})] }), L);
}
var ky = /* @__PURE__ */ new Set([
	"input",
	"textarea",
	"select"
]), bI = class {
	_listeners;
	constructor() {
		this._listeners = {};
	}
	on(m, _) {
		let x = this._listeners[m] || [];
		return x.push(_), this._listeners[m] = x, () => {
			this._listeners[m] = x.filter((m) => m !== _);
		};
	}
	trigger(m, ..._) {
		let x = this._listeners[m];
		x && x.forEach((m) => m(..._));
	}
	dispose() {
		this._listeners = {};
	}
}, kI = class {
	_teardowns = [];
	disposed;
	constructor() {
		this.disposed = !1;
	}
	add(...m) {
		if (this.disposed) throw Error("Attempted to add a new teardown to a disposed disposable.");
		this._teardowns.push(...m);
	}
	dispose() {
		if (this.disposed) throw Error("Attempted to dispose disposable which is already disposed.");
		this._teardowns.forEach((m) => {
			typeof m == "function" ? m() : typeof m.dispose == "function" && m.dispose();
		}), this._teardowns = [], this.disposed = !0;
	}
};
function yI(m, _ = { balance: 0 }) {
	let x = 0, S = m.createGain();
	S.channelCount = 2, S.channelCountMode = "explicit", S.channelInterpretation = "speakers";
	let C = m.createChannelSplitter(2), D = m.createGain(), O = m.createGain(), F = m.createChannelMerger(2);
	function o(m) {
		let _ = Number(m);
		D.gain.value = _ > 0 ? 1 - _ : 1, O.gain.value = _ > 0 ? 1 : 1 + _, x = _;
	}
	S.connect(C), C.connect(D, 0), C.connect(O, 1), D.connect(F, 0, 0), O.connect(F, 0, 1);
	let I = {};
	return Object.defineProperties(I, { value: {
		get: function() {
			return x;
		},
		set: o,
		enumerable: !0,
		configurable: !0
	} }), Object.defineProperties(S, {
		balance: {
			value: I,
			enumerable: !0,
			writable: !1,
			configurable: !0
		},
		connect: {
			value: AudioNode.prototype.connect.bind(F),
			enumerable: !1,
			writable: !1,
			configurable: !0
		},
		disconnect: {
			value: AudioNode.prototype.disconnect.bind(F),
			enumerable: !1,
			writable: !1,
			configurable: !0
		}
	}), x !== _.balance && o(_.balance), S;
}
var SI = class {
	_emitter;
	_context;
	_source;
	_destination;
	_audio;
	_stalled;
	_status;
	_disposable;
	on(m, _) {
		return this._emitter.on(m, _);
	}
	constructor(m, _) {
		this._emitter = new bI(), this._context = m, this._destination = _, this._audio = document.createElement("audio"), this._audio.crossOrigin = "anonymous", this._stalled = !1, this._status = fg, this._disposable = new kI();
		let t = () => {
			this._setStalled(!0);
		};
		this._audio.addEventListener("suspend", t), this._disposable.add(() => this._audio.removeEventListener("suspend", t));
		let n = () => {
			this._emitter.trigger("loaded"), this._setStalled(!1);
		};
		this._audio.addEventListener("durationchange", n), this._disposable.add(() => this._audio.removeEventListener("durationchange", n));
		let a = () => {
			this._emitter.trigger("ended"), this._setStatus(fg);
		};
		this._audio.addEventListener("ended", a), this._disposable.add(() => this._audio.removeEventListener("ended", a));
		let i = () => {
			this._emitter.trigger("positionChange");
		};
		this._audio.addEventListener("timeupdate", i), this._disposable.add(() => this._audio.removeEventListener("timeupdate", i));
		let r = (m) => {
			this._audio.error.code, this._emitter.trigger("ended"), this._setStatus(fg);
		};
		this._audio.addEventListener("error", r), this._disposable.add(() => this._audio.removeEventListener("error", r)), this._source = this._context.createMediaElementSource(this._audio), this._source.connect(_);
	}
	_setStalled(m) {
		this._stalled = m, this._emitter.trigger("stallChanged");
	}
	disconnect() {
		this._source.disconnect();
	}
	async loadUrl(m) {
		this._audio.src = m;
	}
	async play() {
		this._status !== pg && this.seekToTime(0);
		try {
			await this._audio.play();
		} catch {}
		this._setStatus(dg);
	}
	pause() {
		this._audio.pause(), this._setStatus(pg);
	}
	stop() {
		this._audio.pause(), this._audio.currentTime = 0, this._setStatus(fg);
	}
	seekToTime(m) {
		this._audio.currentTime = Hh(m, 0, this.getDuration()), this._emitter.trigger("positionChange");
	}
	getStalled() {
		return this._stalled;
	}
	getStatus() {
		return this._status;
	}
	getDuration() {
		let { duration: m } = this._audio;
		return isNaN(m) || m === 1 / 0 ? 0 : m;
	}
	getTimeElapsed() {
		return this._audio.currentTime;
	}
	_setStatus(m) {
		this._status = m, this._emitter.trigger("statusChange");
	}
	dispose() {
		this._disposable.dispose(), this.stop(), this._emitter.dispose();
	}
}, II = class {
	_emitter;
	_context;
	_balance;
	_staticSource;
	_preamp;
	_analyser;
	_gainNode;
	_source;
	_bands;
	_disposable;
	constructor() {
		if (this._emitter = new bI(), this._disposable = new kI(), this._context = new (window.AudioContext || window.webkitAudioContext)(), this._context.state === "suspended") {
			let A = async () => {
				await this._context.resume(), this._context.state === "running" && (document.body.removeEventListener("touchend", A, !1), document.body.removeEventListener("click", A, !1), document.body.removeEventListener("keydown", A, !1));
			};
			document.body.addEventListener("touchend", A, !1), document.body.addEventListener("click", A, !1), document.body.addEventListener("keydown", A, !1), this._disposable.add(() => {
				document.body.removeEventListener("touchend", A, !1), document.body.removeEventListener("click", A, !1), document.body.removeEventListener("keydown", A, !1);
			});
		}
		this._staticSource = this._context.createGain(), this._balance = new yI(this._context), this._preamp = this._context.createGain(), this._analyser = this._context.createAnalyser(), this._analyser.fftSize = 2048, this._analyser.smoothingTimeConstant = 0, this._gainNode = this._context.createGain(), this._source = new SI(this._context, this._staticSource), this._source.on("positionChange", () => {
			this._emitter.trigger("timeupdate");
		}), this._source.on("ended", () => {
			this._emitter.trigger("ended");
		}), this._source.on("statusChange", () => {
			this._source.getStatus() === dg && this._emitter.trigger("playing"), this._emitter.trigger("timeupdate");
		}), this._source.on("loaded", () => {
			this._emitter.trigger("fileLoaded");
		}), this._staticSource.connect(this._preamp);
		let m = this._preamp;
		this._bands = {}, Oh.forEach((_, x) => {
			let S = this._context.createBiquadFilter();
			this._bands[_] = S, S.type = x === 0 ? "lowshelf" : x === Oh.length - 1 ? "highshelf" : "peaking", S.frequency.value = _, S.gain.value = 0, m.connect(S), m = S;
		}), m.connect(this._balance), this._balance.connect(this._gainNode), this._balance.connect(this._analyser), this._gainNode.connect(this._context.destination);
	}
	getAnalyser() {
		return this._analyser;
	}
	duration() {
		return this._source.getDuration();
	}
	timeElapsed() {
		return this._source.getTimeElapsed();
	}
	timeRemaining() {
		return this.duration() - this.timeElapsed();
	}
	percentComplete() {
		return this.timeElapsed() / this.duration() * 100;
	}
	async play() {
		await this._source.play();
	}
	pause() {
		this._source.pause();
	}
	stop() {
		this._source.stop();
	}
	seekToPercentComplete(m) {
		let _ = this.duration() * (m / 100);
		this.seekToTime(_);
	}
	setVolume(m) {
		this._gainNode.gain.value = m / 100;
	}
	setPreamp(m) {
		let _ = m / 100 * 24 - 12;
		this._preamp.gain.value = 10 ** (_ / 20);
	}
	setBalance(m) {
		this._balance.balance.value = m / 100;
	}
	setEqBand(m, _) {
		let x = _ / 100 * 24 - 12;
		this._bands[m].gain.value = x;
	}
	disableEq() {
		this._staticSource.disconnect(), this._staticSource.connect(this._balance);
	}
	enableEq() {
		this._staticSource.disconnect(), this._staticSource.connect(this._preamp);
	}
	on(m, _) {
		this._emitter.on(m, _);
	}
	seekToTime(m) {
		this._source.seekToTime(m);
	}
	async loadFromUrl(m, _) {
		this._emitter.trigger("waiting"), await this._source.loadUrl(m), this._emitter.trigger("stopWaiting"), _ && this.play();
	}
	dispose() {
		this._disposable.dispose(), this._source.dispose(), this._emitter.dispose();
	}
}, UI = class {
	static VERSION = "2.3.1";
	_actionEmitter;
	_root;
	_disposable;
	options;
	media;
	store;
	static browserIsSupported() {
		let m = !(!window.AudioContext && !window.webkitAudioContext), _ = !!window.document.createElement("canvas").getContext;
		return m && _ && typeof Promise < "u";
	}
	constructor(m) {
		this._root = null, this._disposable = new kI(), this._actionEmitter = new bI(), this.options = m;
		let { initialTracks: _, initialSkin: x, availableSkins: S, enableHotkeys: C = !1, zIndex: D, requireJSZip: O, requireMusicMetadata: F, requireButterchurnPresets: I, handleTrackDropEvent: L, handleAddUrlEvent: H, handleLoadListEvent: U, handleSaveListEvent: W, enableDoubleSizeMode: q, __butterchurnOptions: ee, __customMediaClass: te } = this.options, J = ee;
		if (I != null) {
			if (J == null) throw Error("You must pass `__butterchurnOptions` if you are using `requireButterchurnPresets`.");
			J.getPresets = I;
		}
		let f = null;
		if (J != null) {
			let { importConvertPreset: m, presetConverterEndpoint: _ } = J;
			m != null && _ != null && (f = async (x) => {
				let { convertPreset: S } = await m();
				return S(await vm(x), _);
			});
		}
		var ne, re;
		this.media = new (te || II)(), this.store = uk(this.media, this._actionEmitter, this.options.__customMiddlewares, this.options.__initialState, {
			requireJSZip: O,
			requireMusicMetadata: F,
			convertPreset: f,
			handleTrackDropEvent: L,
			handleAddUrlEvent: H,
			handleLoadListEvent: U,
			handleSaveListEvent: W
		}), m.enableMediaSession && (ne = this, "mediaSession" in navigator && (ne.onTrackDidChange((m) => {
			if (m == null) return;
			let { metaData: { title: _, artist: x, album: S, albumArtUrl: C } } = m;
			navigator.mediaSession.metadata = new MediaMetadata({
				title: _ ?? void 0,
				artist: x ?? void 0,
				album: S ?? void 0,
				artwork: C ? [{ src: C }] : []
			});
		}), navigator.mediaSession.setActionHandler("play", () => {
			ne.play();
		}), navigator.mediaSession.setActionHandler("pause", () => {
			ne.pause();
		}), navigator.mediaSession.setActionHandler("seekbackward", () => {
			ne.seekBackward(10);
		}), navigator.mediaSession.setActionHandler("seekforward", () => {
			ne.seekForward(10);
		}), navigator.mediaSession.setActionHandler("previoustrack", () => {
			ne.previousTrack();
		}), navigator.mediaSession.setActionHandler("nexttrack", () => {
			ne.nextTrack();
		}))), q && this.store.dispatch(jE()), navigator.onLine ? this.store.dispatch({ type: "NETWORK_CONNECTED" }) : this.store.dispatch({ type: "NETWORK_DISCONNECTED" }), D != null && this.store.dispatch({
			type: "SET_Z_INDEX",
			zIndex: D
		}), J && (this.store.dispatch({
			type: "ENABLE_MILKDROP",
			open: J.butterchurnOpen
		}), this.store.dispatch((re = J, async (m) => {
			let { getPresets: _, importButterchurn: x } = re;
			x().then((_) => {
				m({
					type: "GOT_BUTTERCHURN",
					butterchurn: _.default ?? _
				});
			}), m(Gb((await _()).map(Fb)));
		})));
		let b = () => this.store.dispatch({ type: "NETWORK_CONNECTED" }), k = () => this.store.dispatch({ type: "NETWORK_DISCONNECTED" });
		var Q;
		window.addEventListener("online", b), window.addEventListener("offline", k), this._disposable.add(() => {
			window.removeEventListener("online", b), window.removeEventListener("offline", k);
		}), x ? this.store.dispatch(tb(x.url)) : this.store.dispatch({ type: "LOADED" }), _ && this._bufferTracks(_), m.avaliableSkins == null ? S != null && this.store.dispatch({
			type: "SET_AVAILABLE_SKINS",
			skins: S
		}) : this.store.dispatch({
			type: "SET_AVAILABLE_SKINS",
			skins: m.avaliableSkins
		}), this.store.dispatch((Q = m.windowLayout, (m) => {
			if (Q != null) {
				for (let _ of ["playlist", "milkdrop"]) {
					let x = Q[_];
					if (x != null && x.size != null) {
						let { extraHeight: S, extraWidth: C } = x.size;
						m(XE(_, [C, S]));
					}
				}
				for (let _ of [
					"main",
					"playlist",
					"equalizer",
					"milkdrop"
				]) {
					let x = Q[_];
					(x == null || x.closed) && m(WE(_));
				}
				for (let _ of [
					"main",
					"playlist",
					"equalizer"
				]) Q[_]?.shadeMode && m({
					type: "TOGGLE_WINDOW_SHADE_MODE",
					windowId: _
				});
				m(Aw(rm(Q, (m) => {
					if (m == null) throw Error("w is null");
					return {
						x: m.position.left,
						y: m.position.top
					};
				}), !1));
			} else m(nw());
		})), C && this._disposable.add(function(m) {
			let _ = 0, x = [
				78,
				85,
				76,
				76,
				83,
				79,
				70,
				84
			], n = (S) => {
				if (!(S.target instanceof Element && ky.has(S.target.tagName.toLowerCase()))) {
					if (S.ctrlKey) switch (S.keyCode) {
						case 68:
							m(jE()), S.preventDefault();
							break;
						case 76: break;
						case 82:
							m({ type: "REVERSE_LIST" });
							break;
						case 84: m({ type: "TOGGLE_TIME_MODE" });
					}
					else if (S.altKey) switch (S.keyCode) {
						case 87:
							m($E("main"));
							break;
						case 69:
							m($E("playlist"));
							break;
						case 71: m($E("equalizer"));
					}
					else switch (S.keyCode) {
						case 37:
						case 103:
							m(Nb(5));
							break;
						case 38:
						case 104:
							m(Qb(1));
							break;
						case 39:
						case 105:
							m(Mb(5));
							break;
						case 40:
						case 98:
							m(Qb(-1));
							break;
						case 66:
						case 102:
							m(vb());
							break;
						case 67:
							m(Ib());
							break;
						case 76:
						case 96:
							m(ib());
							break;
						case 82:
							m({ type: "TOGGLE_REPEAT" });
							break;
						case 83:
							m({ type: "TOGGLE_SHUFFLE" });
							break;
						case 86:
							m({ type: "STOP" });
							break;
						case 88:
						case 101:
							m(Sb());
							break;
						case 90:
						case 100:
							m(Bb());
							break;
						case 97:
							m(Cb(-10));
							break;
						case 99: m(Cb(10));
					}
					S.keyCode !== 27 && (_ = S.keyCode === x[_] ? _ + 1 : 0, _ === x.length && m({ type: "TOGGLE_LLAMA_MODE" }));
				}
			};
			return document.addEventListener("keydown", n), () => {
				document.removeEventListener("keydown", n);
			};
		}(this.store.dispatch));
	}
	play() {
		this.store.dispatch(Sb());
	}
	pause() {
		this.store.dispatch(Ib());
	}
	stop() {
		this.store.dispatch({ type: "STOP" });
	}
	setVolume(m) {
		this.store.dispatch(Tb(m));
	}
	seekBackward(m) {
		this.store.dispatch(Nb(m));
	}
	seekForward(m) {
		this.store.dispatch(Mb(m));
	}
	seekToTime(m) {
		this.store.dispatch(xb(m));
	}
	isShuffleEnabled() {
		return AE(this.store.getState());
	}
	toggleShuffle() {
		this.store.dispatch({ type: "TOGGLE_SHUFFLE" });
	}
	isRepeatEnabled() {
		return eE(this.store.getState());
	}
	toggleRepeat() {
		this.store.dispatch({ type: "TOGGLE_REPEAT" });
	}
	nextTrack() {
		this.store.dispatch(vb());
	}
	previousTrack() {
		this.store.dispatch(Bb());
	}
	setCurrentTrack(m) {
		this.store.dispatch(kb(m));
	}
	appendTracks(m) {
		let _ = Zg(this.store.getState());
		this.store.dispatch(ob(m, Lh, _));
	}
	setTracksToPlay(m) {
		this.store.dispatch(ob(m, Ih));
	}
	getPlaylistTracks() {
		return $g(this.store.getState());
	}
	getMediaStatus() {
		return x_(this.store.getState());
	}
	getPlayerMediaStatus() {
		return vf(this.store.getState());
	}
	onWillClose(m) {
		return this._actionEmitter.on("CLOSE_REQUESTED", (_) => {
			m(_.cancel);
		});
	}
	onClose(m) {
		return this._actionEmitter.on("CLOSE_WINAMP", m);
	}
	close() {
		this.store.dispatch((m) => {
			let _ = !1;
			m({
				type: "CLOSE_REQUESTED",
				cancel: () => {
					_ = !0;
				}
			}), _ || (m({ type: "STOP" }), m({ type: "CLOSE_WINAMP" }));
		});
	}
	reopen() {
		this.store.dispatch({ type: "OPEN_WINAMP" });
	}
	onTrackDidChange(m) {
		let _ = null, x = this.store.subscribe(() => {
			let x = this.store.getState(), S = C_(x);
			S !== _ && (_ = S, m(S == null ? null : w_(x)));
		});
		return this._disposable.add(x), x;
	}
	onMinimize(m) {
		return this._actionEmitter.on("MINIMIZE_WINAMP", m);
	}
	setSkinFromUrl(m) {
		this.store.dispatch(tb(m));
	}
	async skinIsLoaded() {
		await this.storeHas((m) => !m.display.loading), await Promise.all([B_(this.store.getState()), V_(this.store.getState())]);
	}
	async renderWhenReady(m) {
		return this._render(m, !1);
	}
	async renderInto(m) {
		if (getComputedStyle(m)?.position === "static") throw Error("Webamp Error: The DOM node passed to renderInto must have a non-static position.");
		return this._render(m, !0);
	}
	async _render(m, _) {
		if (this.store.dispatch(function(m, _) {
			return (x, S) => {
				if (!S().windows.positionsAreRelative) return;
				let C = 0, D = 0;
				if (!_) {
					let _ = m.getBoundingClientRect();
					C = _.left + window.scrollX, D = _.top + window.scrollY;
				}
				let { scrollWidth: O, scrollHeight: F } = m;
				x(ew({
					left: C,
					top: D,
					width: O,
					height: F
				}));
			};
		}(m, _)), await this.skinIsLoaded(), this._disposable.disposed) return;
		if (this._root != null) throw Error("Cannot render a Webamp instance twice");
		let x;
		this._root = wm.createRoot(m), this._disposable.add(() => {
			this._root != null && (this._root.unmount(), this._root = null);
		});
		let S = new Promise((m) => {
			x = m;
		});
		this._root.render(Q.jsx(ah, {
			store: this.store,
			children: Q.jsx(EI, {
				media: this.media,
				filePickers: this.options.filePickers || [],
				onMount: x,
				parentDomNode: _ ? m : document.body
			})
		})), await S;
	}
	dispose() {
		this.media.dispose(), this._actionEmitter.dispose(), this._disposable.dispose();
	}
	__onStateChange(m) {
		let _ = this.store.subscribe(m);
		return this._disposable.add(_), _;
	}
	storeHas(m) {
		let _ = !1;
		return new Promise((x, S) => {
			if (m(this.store.getState())) return void x();
			let C = this.store.subscribe(() => {
				m(this.store.getState()) && (_ = !0, C(), x());
			});
			this._disposable.add(() => {
				_ || (C(), S(/* @__PURE__ */ Error("Store was disposed before condition was met.")));
			});
		});
	}
	_bufferTracks(m) {
		let _ = Zg(this.store.getState());
		this.store.dispatch(ob(m, Ph, _));
	}
};
window.Webamp = UI;
//#endregion
//#region src/radioBrowser.js
var jy = [
	"https://all.api.radio-browser.info",
	"https://de1.api.radio-browser.info",
	"https://nl1.api.radio-browser.info",
	"https://at1.api.radio-browser.info"
], Iy = 3e5, Ry = /* @__PURE__ */ new Map(), zy = 0;
async function request$1(m) {
	let _ = Ry.get(m);
	if (_ && Date.now() - _.time < Iy) return _.data;
	let x = null;
	for (let _ = 0; _ < jy.length; _ += 1) {
		let S = (zy + _) % jy.length, C = jy[S];
		try {
			let _ = await fetch(C + m, {
				headers: { accept: "application/json" },
				signal: AbortSignal.timeout(8e3)
			});
			if (!_.ok) throw Error(`HTTP ${_.status}`);
			let x = await _.json();
			return zy = S, Ry.set(m, {
				time: Date.now(),
				data: x
			}), Ry.size > 24 && Ry.delete(Ry.keys().next().value), x;
		} catch (m) {
			x = m;
		}
	}
	throw Error(x?.message || "Radio Browser is unavailable");
}
_(request$1, "request");
var isUuid = (m) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(m ?? "");
function normalize(m) {
	let _ = m.url_resolved || m.url || "";
	if (!_.startsWith("https:")) return null;
	let x = String(m.name || "").trim();
	if (!x) return null;
	let S = String(m.tags || "").split(",").map((m) => m.trim()).filter(Boolean).slice(0, 6);
	return {
		uuid: isUuid(m.stationuuid) ? m.stationuuid : "",
		title: x.slice(0, 180),
		url: _,
		homepage: String(m.homepage || "").startsWith("http") ? String(m.homepage).slice(0, 300) : "",
		favicon: /^https:\/\//i.test(m.favicon || "") ? String(m.favicon).slice(0, 300) : "",
		country: /^[A-Z]{2}$/.test(m.countrycode) ? m.countrycode : "",
		countryName: String(m.country || "").slice(0, 60),
		language: String(m.language || "").split(",")[0].trim().slice(0, 30),
		genre: (S[0] || "Radio").slice(0, 40),
		tags: S,
		bitrate: Number(m.bitrate) || 0,
		codec: String(m.codec || "").slice(0, 12),
		votes: Number(m.votes) || 0,
		clicks: Number(m.clickcount) || 0,
		https: !0,
		source: "radio-browser"
	};
}
async function searchStations({ query: m = "", country: _ = "", language: x = "", tag: S = "", bitrateMin: C = 0, codec: D = "", order: O = "clickcount", offset: F = 0, limit: I = 60 } = {}) {
	let L = new URLSearchParams({
		limit: String(I),
		offset: String(Math.max(0, F)),
		hidebroken: "true",
		is_https: "true",
		order: O,
		reverse: O === "name" ? "false" : "true"
	});
	m.trim() && L.set("name", m.trim().slice(0, 80)), _ && L.set("countrycode", _), x && L.set("language", x), S && L.set("tag", S), C > 0 && L.set("bitrateMin", String(C)), D && L.set("codec", D);
	let H = await request$1(`/json/stations/search?${L}`), U = /* @__PURE__ */ new Set(), W = [];
	for (let m of H) {
		let _ = normalize(m);
		_ && !U.has(_.url) && (U.add(_.url), W.push(_));
	}
	return {
		items: W,
		hasMore: H.length >= I
	};
}
async function countries() {
	return (await request$1("/json/countrycodes")).filter((m) => /^[A-Z]{2}$/.test(m.name) && Number(m.stationcount) > 0).map((m) => ({
		code: m.name,
		count: Number(m.stationcount)
	})).sort((m, _) => _.count - m.count).slice(0, 40);
}
async function languages(m = 60) {
	return (await request$1(`/json/languages?order=stationcount&reverse=true&hidebroken=true&limit=${m}`)).map((m) => ({
		name: String(m.name || "").trim(),
		count: Number(m.stationcount) || 0
	})).filter((m) => m.name && m.count > 50);
}
function reportPlay(m) {
	m?.uuid && fetch(`${jy[zy]}/json/url/${m.uuid}`, { method: "GET" }).catch(() => {});
}
//#endregion
//#region src/genres.js
var Hy = [
	["Alternative", [
		"Adult Alternative",
		"Britpop",
		"Classic Alternative",
		"College",
		"Dancepunk",
		"Dream Pop",
		"Emo",
		"Goth",
		"Grunge",
		"Indie Pop",
		"Indie Rock",
		"Industrial",
		"Lo-Fi",
		"Modern Rock",
		"New Wave",
		"Noise Pop",
		"Post-Punk",
		"Power Pop",
		"Punk",
		"Ska",
		"Xtreme"
	]],
	["Blues", [
		"Acoustic Blues",
		"Cajun/Zydeco",
		"Chicago Blues",
		"Contemporary Blues",
		"Country Blues",
		"Delta Blues",
		"Electric Blues"
	]],
	["Classical", [
		"Baroque",
		"Chamber",
		"Choral",
		"Classical Period",
		"Early Classical",
		"Impressionist",
		"Modern",
		"Opera",
		"Piano",
		"Romantic",
		"Symphony"
	]],
	["Country", [
		"Alt-Country",
		"Americana",
		"Bluegrass",
		"Classic Country",
		"Contemporary Bluegrass",
		"Contemporary Country",
		"Honky Tonk",
		"Hot Country Hits",
		"Western"
	]],
	["Decades", [
		"30s",
		"40s",
		"50s",
		"60s",
		"70s",
		"80s",
		"90s",
		"00s"
	]],
	["Easy Listening", [
		"Exotica",
		"Light Rock",
		"Lounge",
		"Orchestral Pop",
		"Polka",
		"Space Age Pop"
	]],
	["Electronic", [
		"Acid House",
		"Ambient",
		"Big Beat",
		"Breakbeat",
		"Dance",
		"Demo",
		"Disco",
		"Downtempo",
		"Drum and Bass",
		"Dubstep",
		"Electro",
		"Garage",
		"Hard House",
		"House",
		"IDM",
		"Jungle",
		"Progressive",
		"Remixes",
		"Techno",
		"Trance",
		"Tribal",
		"Trip Hop"
	]],
	["Folk", [
		"Alternative Folk",
		"Contemporary Folk",
		"Folk Rock",
		"New Acoustic",
		"Traditional Folk",
		"World Folk"
	]],
	["Inspirational", [
		"Christian",
		"Christian Metal",
		"Christian Rap",
		"Christian Rock",
		"Classic Christian",
		"Contemporary Gospel",
		"Gospel",
		"Praise/Worship",
		"Sermons/Services",
		"Southern Gospel",
		"Traditional Gospel"
	]],
	["International", [
		"African",
		"Afrikaans",
		"Arabic",
		"Asian",
		"Brazilian",
		"Caribbean",
		"Celtic",
		"European",
		"Filipino",
		"Greek",
		"Hawaiian/Pacific",
		"Hindi",
		"Indian",
		"Japanese",
		"Jewish",
		"Klezmer",
		"Mediterranean",
		"Middle Eastern",
		"North American",
		"Polskie",
		"Soca",
		"South American",
		"Tamil",
		"Worldbeat",
		"Zouk"
	]],
	["Jazz", [
		"Acid Jazz",
		"Avant Garde",
		"Big Band",
		"Bop",
		"Classic Jazz",
		"Cool Jazz",
		"Fusion",
		"Hard Bop",
		"Latin Jazz",
		"Smooth Jazz",
		"Swing",
		"Vocal Jazz",
		"World Fusion"
	]],
	["Latin", [
		"Bachata",
		"Banda",
		"Bossa Nova",
		"Cumbia",
		"Latin Dance",
		"Latin Pop",
		"Latin Rap/Hip-Hop",
		"Latin Rock",
		"Mariachi",
		"Merengue",
		"Ranchera",
		"Reggaeton",
		"Regional Mexican",
		"Salsa",
		"Tango",
		"Tejano",
		"Tropicalia"
	]],
	["Metal", [
		"Black Metal",
		"Classic Metal",
		"Extreme Metal",
		"Grindcore",
		"Hair Metal",
		"Heavy Metal",
		"Metalcore",
		"Power Metal",
		"Progressive Metal",
		"Rap Metal"
	]],
	["Misc", []],
	["New Age", [
		"Environmental",
		"Ethnic Fusion",
		"Healing",
		"Meditation",
		"Spiritual"
	]],
	["Pop", [
		"Adult Contemporary",
		"Barbershop",
		"Bubblegum Pop",
		"Dance Pop",
		"Idols",
		"JPOP",
		"K-Pop",
		"Oldies",
		"Soft Rock",
		"Teen Pop",
		"Top 40",
		"World Pop"
	]],
	["Public Radio", [
		"College",
		"News",
		"Sports",
		"Talk"
	]],
	["R&B/Urban", [
		"Classic R&B",
		"Contemporary R&B",
		"Doo Wop",
		"Funk",
		"Motown",
		"Neo-Soul",
		"Quiet Storm",
		"Soul",
		"Urban Contemporary"
	]],
	["Rap", [
		"Alternative Rap",
		"Dirty South",
		"East Coast Rap",
		"Freestyle",
		"Gangsta Rap",
		"Hip Hop",
		"Mixtapes",
		"Old School",
		"Turntablism",
		"Underground Hip-Hop",
		"West Coast Rap"
	]],
	["Reggae", [
		"Contemporary Reggae",
		"Dancehall",
		"Dub",
		"Pop-Reggae",
		"Ragga",
		"Reggae Roots",
		"Rock Steady"
	]],
	["Rock", [
		"Adult Album Alternative",
		"British Invasion",
		"Classic Rock",
		"Garage Rock",
		"Glam",
		"Hard Rock",
		"Jam Bands",
		"Piano Rock",
		"Prog Rock",
		"Psychedelic",
		"Rock & Roll",
		"Rockabilly",
		"Singer/Songwriter",
		"Surf"
	]],
	["Seasonal/Holiday", [
		"Anniversary",
		"Birthday",
		"Christmas",
		"Halloween",
		"Hanukkah",
		"Honeymoon",
		"Valentine",
		"Wedding",
		"Winter"
	]],
	["Soundtracks", [
		"Anime",
		"Bollywood",
		"Kids",
		"Original Score",
		"Showtunes",
		"Video Game Music"
	]],
	["Talk", [
		"Comedy",
		"Community",
		"Educational",
		"Government",
		"News",
		"Old Time Radio",
		"Other Talk",
		"Political",
		"Public Radio",
		"Scanner",
		"Spoken Word",
		"Sports",
		"Technology"
	]],
	["Themes", [
		"Adult",
		"Best Of",
		"Chill",
		"Eclectic",
		"Experimental",
		"Female",
		"Hardcore",
		"Heartache",
		"Instrumental",
		"LGBT",
		"Love/Romance",
		"Party Mix",
		"Patriotic",
		"Rainy Day Mix",
		"Reality",
		"Sexy",
		"Shuffle",
		"Travel Mix",
		"Tribute",
		"Trippy",
		"Work Mix"
	]]
], Wy = /* @__PURE__ */ new Map([
	["R&B/Urban", "rnb"],
	["Classic R&B", "classic rnb"],
	["Contemporary R&B", "rnb"],
	["Rap", "hip hop"],
	["Hip Hop", "hip hop"],
	["Underground Hip-Hop", "underground hip hop"],
	["Latin Rap/Hip-Hop", "latin hip hop"],
	["Seasonal/Holiday", "holiday"],
	["Praise/Worship", "worship"],
	["Sermons/Services", "sermons"],
	["Cajun/Zydeco", "zydeco"],
	["Hawaiian/Pacific", "hawaiian"],
	["Love/Romance", "love"],
	["Singer/Songwriter", "singer-songwriter"],
	["Rock & Roll", "rock n roll"],
	["Drum and Bass", "drum and bass"],
	["Trip Hop", "trip-hop"],
	["Lo-Fi", "lofi"],
	["JPOP", "jpop"],
	["K-Pop", "kpop"],
	["Video Game Music", "video game"],
	["Old Time Radio", "old time radio"],
	["Misc", ""],
	["Public Radio", "public radio"],
	["Polskie", "polish"],
	["Decades", "oldies"],
	["Themes", ""],
	["Talk", "talk"],
	["International", "world music"],
	["Inspirational", "christian"],
	["Easy Listening", "easy listening"],
	["Electronic", "electronic"],
	["Alternative", "alternative"],
	["Classical", "classical"],
	["Soundtracks", "soundtrack"],
	["Modern", "contemporary classical"],
	["Progressive", "progressive house"],
	["Demo", "demoscene"],
	["Xtreme", "extreme"],
	["Idols", "idol"],
	["Remixes", "remix"],
	["Sports", "sports"],
	["News", "news"]
]);
function tagFor(m) {
	return Wy.has(m) ? Wy.get(m) : m.toLowerCase().replace(/\s*\/.*$/, "").trim();
}
var Ky = Hy.map(([m, _]) => ({
	name: m,
	tag: tagFor(m),
	children: _.map((m) => ({
		name: m,
		tag: tagFor(m)
	}))
})), titleCase = (m) => m.split(/(\s+|-)/).map((m) => m && m[0].toLocaleUpperCase() + m.slice(1)).join("");
function genreLabel(m) {
	let _ = String(m ?? "").trim().toLowerCase();
	if (!_) return "";
	for (let m of Ky) {
		if (m.tag === _) return m.name;
		let x = m.children.find((m) => m.tag === _);
		if (x) return x.name;
	}
	return titleCase(_);
}
//#endregion
//#region src/radioMenu.js
var Jy = "webamp.radio.view.v1", Xy = /* @__PURE__ */ _((m, _, x) => {
	let S = document.createElement(m);
	return _ && (S.className = _), x != null && (S.textContent = x), S;
}, "el"), button = (m, _, x) => {
	let S = Xy("button", m, _);
	return S.type = "button", x && (S.setAttribute("aria-label", x), S.title = x), S;
}, Zy = [
	{
		id: "bookmarks",
		name: "Bookmarks",
		icon: "bookmark"
	},
	{
		id: "online",
		name: "Online Services",
		icon: "list",
		parent: !0,
		invariantPrefix: "om_svc_",
		children: []
	},
	{
		id: "music",
		name: "Online Music",
		icon: "list",
		parent: !0,
		children: []
	},
	{
		id: "history",
		name: "History",
		icon: "history"
	}
], $y = [
	{
		id: "name",
		label: "Name",
		sort: (m) => m.title.toLowerCase()
	},
	{
		id: "genre",
		label: "Genre",
		sort: (m) => genreAt(m, 0).toLowerCase()
	},
	{
		id: "nowplaying",
		label: "Now Playing",
		sort: (m) => (m.nowPlaying || "").toLowerCase()
	},
	{
		id: "bitrate",
		label: "Bitrate",
		sort: (m) => m.bitrate || 0,
		numeric: !0
	},
	{
		id: "format",
		label: "Type",
		sort: (m) => D(m)
	},
	{
		id: "fav",
		label: "★",
		sort: (m) => +!!m.isFavorite,
		numeric: !0
	}
], pb = [
	{
		id: "name",
		label: "Song",
		sort: (m) => (m.title || "").toLowerCase()
	},
	{
		id: "artist",
		label: "Artist",
		sort: (m) => (m.artist || "").toLowerCase()
	},
	{
		id: "station",
		label: "Station",
		sort: (m) => (m.station || "").toLowerCase()
	},
	{
		id: "when",
		label: "When",
		sort: (m) => m.at || 0,
		numeric: !0
	}
], gb = [
	["Most popular", "clickcount"],
	["Most voted", "votes"],
	["Name", "name"],
	["Bitrate", "bitrate"]
];
function formatWhen(m) {
	let _ = Date.now() - m;
	if (_ < 6e4) return "just now";
	if (_ < 36e5) return `${Math.round(_ / 6e4)} min ago`;
	if (_ < 864e5) return `${Math.round(_ / 36e5)} h ago`;
	let x = new Date(m);
	return `${x.toLocaleDateString()} ${x.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	})}`;
}
var ex = [
	["Any bitrate", 0],
	["64 kbps and up", 64],
	["96 kbps and up", 96],
	["128 kbps and up", 128],
	["192 kbps and up", 192],
	["320 kbps", 320]
], nx = [
	["Any format", ""],
	["MP3", "MP3"],
	["AAC", "AAC"],
	["AAC+", "AAC+"],
	["OGG", "OGG"]
];
function stationGenres(m) {
	let _ = Array.isArray(m.tags) && m.tags.length > 0 ? m.tags : [m.genre], x = /* @__PURE__ */ new Set(), S = [];
	for (let m of _) {
		let _ = genreLabel(m);
		_ && !x.has(_.toLowerCase()) && (x.add(_.toLowerCase()), S.push(_));
	}
	return S;
}
function genreAt(m, _) {
	return stationGenres(m)[_] ?? "";
}
function stationTooltip(m) {
	let _ = [m.title];
	m.note && _.push(m.note);
	let x = stationGenres(m).join(", ");
	x && _.push(`Genre: ${x}`), (m.countryName || m.country) && _.push(`Country: ${m.countryName || m.country}`), m.language && _.push(`Language: ${m.language}`), m.bitrate && _.push(`Bitrate: ${m.bitrate} kbps`);
	let S = D(m);
	S && _.push(`Format: ${S}`), m.votes && _.push(`Votes: ${m.votes}`), m.clicks && _.push(`Popularity (clicks): ${m.clicks}`), m.homepage && _.push(m.homepage), _.push(m.url);
	let C = H(m);
	return C && _.push(C), _.join("\n");
}
function readView() {
	try {
		return JSON.parse(localStorage.getItem(Jy) ?? "null") ?? {};
	} catch {
		return {};
	}
}
function writeView(m) {
	try {
		localStorage.setItem(Jy, JSON.stringify(m));
	} catch {}
}
function createRadioLibrary({ onPlay: m, onEnqueue: _, favorites: x, history: S, getNowPlaying: C = () => null, getDefaultPosition: O, overlayHost: I = null, sources: L = [], musicSources: U = [], title: W = "MEDIA LIBRARY", nodes: q = Zy.map((m) => m.id) }) {
	let ee = new Map(L.map((m) => [m.id, m]));
	function mergeSource(m) {
		let _ = ee.get(m.id);
		return _ ? {
			...m,
			getStations: _.getStations
		} : m;
	}
	let te = Zy.filter((m) => m.id === "music" ? U.length > 0 : q.includes(m.id)).map((m) => mergeSource({
		...m,
		children: m.id === "online" ? L.map((m) => ({
			id: m.id,
			name: m.name,
			icon: m.icon ?? "radio",
			getStations: m.getStations
		})) : m.id === "music" ? U.map((m) => ({
			id: m.id,
			name: m.name,
			icon: m.icon ?? "list",
			load: m.load,
			search: m.search
		})) : m.children?.map((m) => mergeSource(m))
	})), J = /* @__PURE__ */ new Map(), ne = /* @__PURE__ */ new Map(), collectSources = (m) => {
		for (let _ of m) (_.getStations || _.load) && J.set(_.id, _), _.children && collectSources(_.children);
	};
	collectSources(te);
	let re = Xy("div", "ml-overlay");
	re.hidden = !0;
	let Q = Xy("div", "gen-window window ml-window"), ie = Xy("div", "gen-top draggable"), ae = Xy("div", "gen-top-right draggable"), oe = Xy("div", "gen-close winamp-active");
	oe.setAttribute("role", "button"), oe.setAttribute("aria-label", "Close media library"), oe.tabIndex = 0, ae.append(oe);
	let se = Xy("div", "gen-top-title draggable");
	for (let m of String(W).toUpperCase()) {
		let _ = /[a-z0-9]/i.test(m) ? m.toLowerCase() : "space";
		se.append(Xy("div", `draggable gen-text-letter gen-text-${_}`));
	}
	ie.append(Xy("div", "gen-top-left draggable"), Xy("div", "gen-top-left-fill draggable"), Xy("div", "gen-top-left-end draggable"), se, Xy("div", "gen-top-right-end draggable"), Xy("div", "gen-top-right-fill draggable"), ae);
	let ce = Xy("div", "gen-middle"), le = Xy("div", "gen-middle-left draggable");
	le.append(Xy("div", "gen-middle-left-bottom draggable"));
	let ue = Xy("div", "gen-middle-center"), de = Xy("div", "gen-middle-right draggable");
	de.append(Xy("div", "gen-middle-right-bottom draggable")), ce.append(le, ue, de);
	let fe = Xy("div", "gen-bottom");
	fe.append(Xy("div", "gen-bottom-left draggable"), Xy("div", "gen-bottom-fill draggable"), Xy("div", "gen-bottom-right draggable"));
	let me = Xy("div", "ml-body"), he = [
		"play",
		"enqueue",
		"bookmark"
	];
	function readDoubleClickAction() {
		try {
			let m = localStorage.getItem("webamp.radio.doubleclick.v1");
			return he.includes(m) ? m : "play";
		} catch {
			return "play";
		}
	}
	let ge = readDoubleClickAction(), we = "webamp.radio.nav.collapsed.v1";
	function readCollapsed() {
		try {
			let m = localStorage.getItem(we), _ = m ? JSON.parse(m) : [];
			return new Set(Array.isArray(_) ? _ : []);
		} catch {
			return /* @__PURE__ */ new Set();
		}
	}
	function writeCollapsed(m) {
		try {
			localStorage.setItem(we, JSON.stringify([...m]));
		} catch {}
	}
	let Ee = readCollapsed(), De = Xy("div", "ml-nav");
	De.setAttribute("role", "tree"), De.setAttribute("aria-label", "Library");
	let Oe = /* @__PURE__ */ new Map();
	function addNavNode(m, _) {
		let x = Xy("div", "ml-nav-row");
		if (x.style.setProperty("--depth", String(_)), m.parent || m.children) {
			let _ = Xy("div", "ml-genre-toggle"), S = Ee.has(m.id);
			_.classList.add(S ? "is-collapsed" : "is-expanded"), _.setAttribute("role", "button"), _.setAttribute("aria-label", S ? `Expand ${m.name}` : `Collapse ${m.name}`), _.addEventListener("click", (x) => {
				x.stopPropagation();
				let S = !Ee.has(m.id);
				S ? Ee.add(m.id) : Ee.delete(m.id), writeCollapsed(Ee), _.classList.toggle("is-collapsed", S), _.classList.toggle("is-expanded", !S), renderChildren(m);
			}), x.append(_);
		} else x.append(Xy("div", "ml-nav-spacer"));
		let S = Xy("div", `ml-nav-item ml-icon-${m.icon}`, m.name);
		S.setAttribute("role", "treeitem"), S.dataset.id = m.id, S.tabIndex = -1, m.invariantPrefix && (S.dataset.invariant = `${m.invariantPrefix}${m.id}`), S.addEventListener("click", () => selectNav(m.id)), x.append(S), De.append(x), Oe.set(m.id, S);
	}
	function renderChildren(m) {
		for (let _ of m.children ?? []) Oe.get(_.id)?.parentElement?.remove(), Oe.delete(_.id);
		if (Ee.has(m.id)) return;
		let _ = Oe.get(m.id)?.parentElement;
		for (let x of m.children ?? []) {
			let S = buildChildRow(x, (m.__depth ?? 0) + 1);
			_.after(S), _ = S;
		}
	}
	function buildChildRow(m, _) {
		let x = Xy("div", "ml-nav-row");
		x.style.setProperty("--depth", String(_)), x.append(Xy("div", "ml-nav-spacer"));
		let S = Xy("div", `ml-nav-item ml-icon-${m.icon}`, m.name);
		return S.setAttribute("role", "treeitem"), S.dataset.id = m.id, S.tabIndex = -1, S.addEventListener("click", () => selectNav(m.id)), x.append(S), Oe.set(m.id, S), x;
	}
	let Ae = /* @__PURE__ */ new Map();
	function walk(m, _) {
		for (let x of m) if (x.__depth = _, Ae.set(x.id, _), addNavNode(x, _), x.children && !Ee.has(x.id)) for (let m of x.children) {
			Ae.set(m.id, _ + 1);
			let x = buildChildRow(m, _ + 1);
			De.append(x);
		}
	}
	walk(te, 0);
	let Fe = Xy("div", "ml-search-bar"), Le = Xy("label", "ml-search-label", "Search:"), Re = Xy("input", "ml-input ml-search");
	Re.type = "search", Re.id = "ml-radio-search", Re.setAttribute("aria-label", "Search stations"), Re.autocomplete = "off", Le.htmlFor = Re.id, Fe.append(Le, Re);
	let ze = Xy("div", "ml-genres");
	ze.setAttribute("role", "tree"), ze.setAttribute("aria-label", "Genres");
	let Ve = Xy("div", "ml-table"), Ge = Xy("div", "ml-thead");
	Ge.setAttribute("role", "row");
	let qe = /* @__PURE__ */ new Map();
	function buildHead(m) {
		Ge.replaceChildren(), qe.clear();
		for (let _ of m) {
			let m = Xy("div", `ml-th ml-col-${_.id}`);
			m.setAttribute("role", "columnheader"), m.append(Xy("span", "ml-th-label", _.label), Xy("span", "ml-th-arrow")), m.addEventListener("click", () => sortBy(_.id)), Ge.append(m), qe.set(_.id, m);
		}
	}
	buildHead($y);
	let Je = Xy("div", "ml-rows");
	Je.tabIndex = 0, Je.setAttribute("role", "listbox"), Je.setAttribute("aria-multiselectable", "true"), Je.setAttribute("aria-label", "Stations");
	let Xe = Xy("div", "ml-message");
	Ve.append(Ge, Je, Xe);
	let Qe = Xy("div", "ml-panes");
	Qe.append(De, ze, Ve);
	let $e = Xy("div", "ml-footer"), $ = button("ml-button", "Play"), et = button("ml-button", "Enqueue"), tt = button("ml-button ml-bookmark", "Bookmark"), lt = button("ml-button ml-filter", "Filter ▾");
	lt.setAttribute("aria-haspopup", "true");
	let mt = button("ml-button ml-more", "More");
	mt.hidden = !0;
	let xt = button("ml-button", "Clear");
	xt.hidden = !0;
	let Tt = Xy("span", "ml-status");
	Tt.setAttribute("role", "status"), $e.append($, et, tt, lt, mt, xt, Tt);
	let Dt = Xy("div", "ml-popup ml-filter-panel");
	Dt.hidden = !0;
	let At = Xy("select", "ml-select");
	At.setAttribute("aria-label", "Minimum bitrate"), At.append(...ex.map(([m, _]) => new Option(m, String(_))));
	let Mt = Xy("select", "ml-select");
	Mt.setAttribute("aria-label", "Stream format"), Mt.append(...nx.map(([m, _]) => new Option(m, _)));
	let Pt = Xy("select", "ml-select");
	Pt.setAttribute("aria-label", "Country"), Pt.append(new Option("Any country", ""));
	let Lt = Xy("select", "ml-select");
	Lt.setAttribute("aria-label", "Language"), Lt.append(new Option("Any language", ""));
	let zt = Xy("select", "ml-select");
	zt.setAttribute("aria-label", "Order"), zt.append(...gb.map(([m, _]) => new Option(m, _)));
	let Vt = button("ml-button", "Reset");
	Dt.append(Xy("div", "ml-popup-title", "Filter stations"), zt, At, Mt, Pt, Lt, Vt);
	let Ht = Xy("div", "ml-popup ml-context");
	Ht.hidden = !0, Ht.setAttribute("role", "menu"), me.append(Fe, Qe, $e, Dt, Ht), ue.append(me), Q.append(ie, ce, fe), re.append(Q);
	function mount() {
		let m = I ?? document.querySelector("#webamp");
		m && re.parentElement !== m ? m.append(re) : !m && !re.parentElement && document.body.append(re);
	}
	let Ut = te[0].id, Gt = null, Kt = /* @__PURE__ */ new Set(), Yt = [], Xt = /* @__PURE__ */ new Set(), Zt = -1, $t = {
		url: null,
		at: 0
	}, en = null, tn = !1, nn = !1, rn = !1, an = null, on = 0, sn = null, cn = null, ln = null, un = !1, dn = {
		bitrateMin: 0,
		format: "",
		country: "",
		language: "",
		order: "clickcount"
	}, fn = [], pn = [], isSongsView = () => Ut === "songs", columnsFor = () => isSongsView() ? pb : $y, selectedItems = () => Yt.filter((m) => Xt.has(rowKey(m))), selectedStations = () => isSongsView() ? [...new Map(selectedItems().map((m) => [m.stationUrl, songStation(m)])).values()] : selectedItems(), songStation = (m) => fn.find((_) => _.url === m.stationUrl) ?? x.get(m.stationUrl) ?? {
		url: m.stationUrl,
		title: m.station,
		favicon: m.favicon,
		https: m.stationUrl.startsWith("https:")
	};
	function selectNav(m) {
		Oe.has(m) || (m = te[0].id), Ut = m;
		for (let [_, x] of Oe) x.classList.toggle("is-selected", _ === m), x.setAttribute("aria-selected", _ === m ? "true" : "false");
		Gt = null, en = m === "online" || J.has(m) ? null : "name", tn = !1, xt.hidden = m !== "history", buildHead(columnsFor());
		let _ = m === "online" || J.has(m);
		ze.hidden = !_, Qe.classList.toggle("is-two-pane", !_), renderGenres(), load(), persistView();
	}
	function persistView() {
		let { left: m, top: _ } = readView();
		writeView({
			nav: Ut,
			genre: Gt?.name ?? null,
			expanded: [...Kt],
			left: m,
			top: _
		});
	}
	function genreNode(m, _, x, { expandable: S = !1, isExpanded: C = !1 } = {}) {
		let D = Xy("div", "ml-genre");
		D.setAttribute("role", "treeitem"), D.style.setProperty("--depth", String(x));
		let O = Xy("span", "ml-genre-toggle", S ? C ? "−" : "+" : ""), F = Xy("span", "ml-genre-label", m);
		D.append(O, F);
		let I = Gt ? Gt.name === m && Gt.tag === _ : m === "All Stations";
		return D.classList.toggle("is-selected", I), D.setAttribute("aria-selected", I ? "true" : "false"), S && (D.setAttribute("aria-expanded", C ? "true" : "false"), O.addEventListener("click", (_) => {
			_.stopPropagation(), Kt.has(m) ? Kt.delete(m) : Kt.add(m), renderGenres(), persistView();
		})), D.addEventListener("click", () => {
			Gt = m === "All Stations" ? null : {
				name: m,
				tag: _
			}, S && !Kt.has(m) && Kt.add(m), renderGenres(), load(), persistView();
		}), D.addEventListener("dblclick", () => {
			S && O.click();
		}), D;
	}
	function renderGenres() {
		let m = [genreNode("All Stations", "", 0)];
		if (Ut === "online") for (let _ of Ky) {
			let x = Kt.has(_.name);
			if (m.push(genreNode(_.name, _.tag, 0, {
				expandable: _.children.length > 0,
				isExpanded: x
			})), x) for (let x of _.children) m.push(genreNode(x.name, x.tag, 1));
		}
		else {
			let _ = /* @__PURE__ */ new Map();
			for (let m of sourceStations()) for (let x of stationGenres(m)) _.set(x, (_.get(x) ?? 0) + 1);
			for (let x of [..._.keys()].sort((m, _) => m.localeCompare(_))) m.push(genreNode(x, x.toLowerCase(), 0));
		}
		ze.replaceChildren(...m), ze.querySelector(".is-selected")?.scrollIntoView({ block: "nearest" });
	}
	function sourceStations() {
		if (J.has(Ut)) {
			let m = J.get(Ut);
			return m.load ? ne.get(Ut) ?? [] : m.getStations() ?? [];
		}
		switch (Ut) {
			case "featured": return cn ?? [];
			case "bookmarks": return x.list();
			case "history": return fn;
			case "songs": return pn;
			default: return [];
		}
	}
	function matchesFilters(m) {
		return !(dn.bitrateMin && (m.bitrate || 0) < dn.bitrateMin || dn.format && D(m) !== dn.format || dn.country && m.country !== dn.country);
	}
	function matchesGenre(m) {
		if (!Gt) return !0;
		let _ = Gt.name.toLowerCase();
		return stationGenres(m).some((m) => m.toLowerCase() === _);
	}
	function matchesSongSearch(m) {
		let _ = Re.value.trim().toLowerCase();
		if (!_) return !0;
		let x = `${m.title} ${m.artist} ${m.station}`.toLowerCase();
		return _.split(/\s+/).every((m) => x.includes(m));
	}
	function matchesSearch(m) {
		let _ = Re.value.trim().toLowerCase();
		if (!_) return !0;
		let x = `${m.title} ${m.country} ${m.countryName ?? ""} ${stationGenres(m).join(" ")} ${m.url}`.toLowerCase();
		return _.split(/\s+/).every((m) => x.includes(m));
	}
	async function load({ append: m = !1 } = {}) {
		let _ = ++on;
		if (mt.hidden = !0, Ut !== "online") {
			if (Ut === "featured") {
				if (await ensureLocal(), _ !== on) return;
			} else if (Ut === "history") {
				if (fn = await S.listStations(), _ !== on) return;
			} else if (Ut === "songs") {
				if (pn = await S.listSongs(), _ !== on) return;
			} else if (J.get(Ut)?.search && Re.value.trim()) {
				let x = J.get(Ut), S = Re.value.trim();
				sn?.abort();
				let C = new AbortController();
				sn = C, setMessage("Meklē...");
				try {
					let m = await x.search(S, { signal: C.signal });
					if (_ !== on) return;
					ne.set(Ut, m), setMessage(m.length === 0 ? "Nekas netika atrasts." : "");
				} catch (m) {
					if (_ !== on || C.signal.aborted) return;
					ne.set(Ut, []), setMessage(m?.message || "Meklēšana neizdevās.");
				}
				Yt = sourceStations(), rn = !1, m || Xt.clear(), renderRows(), setStatus();
				return;
			} else if (J.get(Ut)?.load) {
				let m = J.get(Ut);
				ne.has(Ut) || setMessage("Loading playlist...");
				try {
					let x = await m.load({ onRefresh: (_) => {
						ne.set(Ut, _), J.get(Ut) === m && load();
					} });
					if (_ !== on) return;
					ne.set(Ut, x), setMessage(x.length === 0 ? "This playlist is empty or unavailable." : "");
				} catch (m) {
					if (_ !== on) return;
					setMessage(m?.message || "The playlist could not be loaded.");
				}
			}
			Yt = isSongsView() ? sourceStations().filter((m) => matchesSongSearch(m)) : sourceStations().filter((m) => matchesGenre(m) && matchesFilters(m) && matchesSearch(m)), rn = !1, m || Xt.clear(), renderRows(), setStatus();
			return;
		}
		nn = !0, setMessage(m ? "" : "Searching the directory..."), m || Je.replaceChildren();
		try {
			let x = await searchStations({
				query: Re.value,
				country: dn.country,
				language: dn.language,
				tag: Gt?.tag ?? "",
				bitrateMin: dn.bitrateMin,
				codec: dn.format,
				order: dn.order,
				offset: m ? Yt.length : 0,
				limit: 60
			});
			if (_ !== on) return;
			Yt = m ? [...Yt, ...x.items] : x.items, rn = x.hasMore, nn = !1, m || Xt.clear(), setMessage(Yt.length === 0 ? "No streams found. Try a different search or genre." : ""), renderRows(), setStatus();
		} catch (x) {
			if (_ !== on) return;
			Yt = m ? Yt : [], rn = !1, nn = !1, renderRows(), setMessage(x?.message || "The directory is unavailable."), setStatus();
		} finally {
			_ === on && (nn = !1);
		}
	}
	async function ensureLocal() {
		return cn || (ln ||= (setMessage("Loading stations..."), F().then((m) => (cn = m, setMessage(""), m)).catch((m) => (setMessage(m?.message || "The station list could not be loaded."), cn = [], cn))), ln);
	}
	async function loadCountries() {
		if (!un) {
			un = !0;
			try {
				let [m, _] = await Promise.all([countries(), languages()]), x = Pt.value;
				Pt.replaceChildren(new Option("Any country", ""), ...m.map((m) => new Option(`${m.code} (${m.count})`, m.code))), Pt.value = x;
				let S = Lt.value;
				Lt.replaceChildren(new Option("Any language", ""), ..._.map((m) => new Option(`${m.name} (${m.count})`, m.name))), Lt.value = S;
			} catch {
				un = !1;
			}
		}
	}
	function sortedStations() {
		let m = Yt;
		if (!en) return m;
		let _ = columnsFor().find((m) => m.id === en);
		if (!_) return m;
		let x = tn ? -1 : 1;
		return [...m].sort((m, S) => {
			let C = _.sort(m), D = _.sort(S);
			return _.numeric ? (C - D) * x : String(C).localeCompare(String(D)) * x;
		});
	}
	function sortBy(m) {
		en === m ? tn = !tn : (en = m, tn = m === "bitrate"), renderRows();
	}
	function logoCell(m) {
		let _ = Xy("span", `ml-station-icon${x.has(m.url) ? " is-bookmarked" : ""}`), S = m.favicon || m.logo || "";
		if (!S) return _;
		let C = Xy("img", "ml-logo");
		return C.loading = "lazy", C.decoding = "async", C.alt = "", C.referrerPolicy = "no-referrer", C.src = S, C.addEventListener("error", () => C.replaceWith(_), { once: !0 }), C;
	}
	function songRow(m, _, x) {
		let S = Xy("div", "ml-row is-song");
		S.setAttribute("role", "option"), S.dataset.url = m.stationUrl, S.dataset.index = String(_), S.title = `${m.streamTitle}\n${m.station}\n${new Date(m.at).toLocaleString()}`, _ % 2 == 1 && S.classList.add("is-alt");
		let C = Xt.has(rowKey(m));
		S.classList.toggle("is-selected", C);
		let D = Xy("div", "ml-td ml-col-name");
		return D.append(Xy("span", "ml-station-icon is-song"), Xy("span", "ml-station-name", m.title || m.streamTitle)), S.append(D, Xy("div", "ml-td ml-col-artist", m.artist || ""), Xy("div", "ml-td ml-col-station", m.station || ""), Xy("div", "ml-td ml-col-when", formatWhen(m.at))), attachRowEvents(S, m, _, x), S;
	}
	let rowKey = (m) => isSongsView() ? `song:${m.id ?? m.at}` : m.url;
	function row(m, _, S) {
		if (isSongsView()) return songRow(m, _, S);
		let O = Xy("div", "ml-row");
		O.setAttribute("role", "option"), O.dataset.url = m.url, O.dataset.index = String(_), O.title = stationTooltip(m), _ % 2 == 1 && O.classList.add("is-alt"), H(m) && O.classList.add("is-blocked");
		let F = Xt.has(m.url);
		O.classList.toggle("is-selected", F), O.setAttribute("aria-selected", F ? "true" : "false");
		let I = stationGenres(m), L = Xy("div", "ml-td ml-col-name");
		L.append(logoCell(m), Xy("span", "ml-station-name", m.title));
		let U = C(), W = U && U.station?.url === m.url ? U.streamTitle : "";
		W && O.classList.add("is-playing");
		let q = Xy("button", `ml-fav${x.has(m.url) ? " is-on" : ""}`, x.has(m.url) ? "★" : "☆");
		return q.type = "button", q.title = x.has(m.url) ? "Remove bookmark" : "Bookmark", q.addEventListener("mousedown", (m) => m.stopPropagation()), q.addEventListener("click", (_) => {
			_.stopPropagation(), x.toggle(m), Ut === "bookmarks" ? load() : renderRows();
		}), O.append(L, Xy("div", "ml-td ml-col-genre", I[0] ?? ""), Xy("div", "ml-td ml-col-nowplaying", W), Xy("div", "ml-td ml-col-bitrate", m.bitrate ? `${m.bitrate} kbps` : ""), Xy("div", "ml-td ml-col-format", D(m)), (() => {
			let m = Xy("div", "ml-td ml-col-fav");
			return m.append(q), m;
		})()), O.dataset.index = String(_), O.dataset.key = rowKey(m), O;
	}
	function rowFromEvent(m) {
		let _ = m.target instanceof Element ? m.target.closest(".ml-row") : null;
		return _ && Je.contains(_) ? _ : null;
	}
	let gn = null;
	Je.addEventListener("mousedown", (m) => {
		let _ = rowFromEvent(m);
		if (!_) return;
		let x = _.dataset.key;
		if (m.button === 2 && Xt.has(x)) {
			gn = null;
			return;
		}
		gn = {
			index: Number(_.dataset.index),
			event: m
		};
	}), Je.addEventListener("mouseup", (m) => {
		if (!gn || m.button !== 0) {
			gn = null;
			return;
		}
		let { index: _ } = gn;
		gn = null, applySelection(_, sortedStations(), m);
	}), Je.addEventListener("dblclick", (m) => {
		let _ = rowFromEvent(m);
		_ && (Xt = /* @__PURE__ */ new Set([_.dataset.key]), ge === "enqueue" ? enqueueSelected() : ge === "bookmark" ? bookmarkSelected() : playSelected());
	}), Je.addEventListener("touchend", (m) => {
		let _ = rowFromEvent(m);
		if (!_) return;
		let x = _.dataset.key, S = Date.now();
		if ($t.url === x && S - $t.at < 500) {
			m.preventDefault(), $t = {
				url: null,
				at: 0
			}, Xt = /* @__PURE__ */ new Set([x]), ge === "enqueue" ? enqueueSelected() : ge === "bookmark" ? bookmarkSelected() : playSelected();
			return;
		}
		$t = {
			url: x,
			at: S
		};
	}, { passive: !1 }), Je.addEventListener("contextmenu", (m) => {
		let _ = rowFromEvent(m);
		if (!_) return;
		m.preventDefault();
		let x = Number(_.dataset.index), S = _.dataset.key;
		Xt.has(S) || (Xt = /* @__PURE__ */ new Set([S]), Zt = x, renderRows()), openContextMenu(m.clientX, m.clientY);
	});
	function renderRows() {
		let m = sortedStations();
		Je.replaceChildren(...m.map((_, x) => row(_, x, m)));
		for (let [m, _] of qe) {
			let x = m === en;
			_.classList.toggle("is-sorted", x), _.querySelector(".ml-th-arrow").textContent = x ? tn ? "△" : "▽" : "", _.setAttribute("aria-sort", x ? tn ? "descending" : "ascending" : "none");
		}
		mt.hidden = !(Ut === "online" && rn), updateButtons();
	}
	function applySelection(m, _, x) {
		let S = rowKey(_[m]);
		if (x.shiftKey && Zt >= 0) {
			let [x, S] = [Math.min(Zt, m), Math.max(Zt, m)];
			Xt = new Set(_.slice(x, S + 1).map(rowKey));
		} else x.ctrlKey || x.metaKey ? (Xt.has(S) ? Xt.delete(S) : Xt.add(S), Zt = m) : (Xt = /* @__PURE__ */ new Set([S]), Zt = m);
		Je.focus({ preventScroll: !0 }), scheduleRender();
	}
	let vn = !1;
	function scheduleRender() {
		vn || (vn = !0, setTimeout(() => {
			vn = !1, renderRows();
		}, 0));
	}
	function moveSelection(m, _) {
		let x = sortedStations();
		if (x.length === 0) return;
		let S = Zt >= 0 ? Zt : -1, C = Math.max(0, Math.min(x.length - 1, S + m));
		if (_ && S >= 0) {
			let [m, _] = [Math.min(S, C), Math.max(S, C)];
			for (let S of x.slice(m, _ + 1)) Xt.add(rowKey(S));
		} else Xt = /* @__PURE__ */ new Set([rowKey(x[C])]);
		Zt = C, renderRows(), Je.querySelector(`[data-index="${C}"]`)?.scrollIntoView({ block: "nearest" });
	}
	function setMessage(m) {
		Xe.textContent = m ?? "", Xe.hidden = !m;
	}
	function setStatus() {
		let m = Yt.length, _ = isSongsView() ? m === 1 ? "song" : "songs" : J.get(Ut)?.load ? m === 1 ? "track" : "tracks" : m === 1 ? "stream" : "streams";
		Tt.textContent = nn ? "Searching..." : `Found ${m} ${_}`, updateButtons();
	}
	function updateButtons() {
		let m = selectedStations(), _ = m.filter((m) => !H(m));
		$.disabled = _.length === 0, et.disabled = _.length === 0, tt.disabled = m.length === 0;
		let S = m.length > 0 && m.every((m) => x.has(m.url));
		tt.textContent = S ? "Unbookmark" : "Bookmark";
	}
	function playSelected() {
		let x = selectedStations().filter((m) => !H(m));
		if (x.length === 0) return;
		let [S, ...C] = x;
		S.source === "radio-browser" && reportPlay(S), m(S);
		for (let m of C) _(m);
		hide();
	}
	function enqueueSelected() {
		for (let m of selectedStations()) H(m) || _(m);
		setMessage(""), Tt.textContent = `Enqueued ${selectedStations().length} ${selectedStations().length === 1 ? "stream" : "streams"}`;
	}
	function bookmarkSelected() {
		let m = selectedStations(), _ = m.every((m) => x.has(m.url));
		for (let S of m) x.has(S.url) === _ && x.toggle(S);
		Ut === "bookmarks" ? load() : renderRows();
	}
	function copySelectedUrls() {
		let m = selectedStations().map((m) => m.url).join("\n");
		m && navigator.clipboard?.writeText && navigator.clipboard.writeText(m).catch(() => {});
	}
	function closePopups() {
		Dt.hidden = !0, Ht.hidden = !0, lt.setAttribute("aria-expanded", "false");
	}
	function placePopup(m, _, x) {
		let S = me.getBoundingClientRect();
		m.hidden = !1;
		let C = m.offsetWidth, D = m.offsetHeight, O = Math.max(0, Math.min(_ - S.left, S.width - C - 2)), F = Math.max(0, Math.min(x - S.top, S.height - D - 2));
		m.style.left = `${O}px`, m.style.top = `${F}px`;
	}
	function openContextMenu(m, _) {
		let S = selectedStations();
		if (S.length === 0) return;
		let C = S.every((m) => x.has(m.url)), D = [
			[
				"Play",
				playSelected,
				S.some((m) => !H(m))
			],
			[
				"Enqueue",
				enqueueSelected,
				S.some((m) => !H(m))
			],
			[
				C ? "Remove bookmark" : "Bookmark",
				bookmarkSelected,
				!0
			],
			[
				"Copy stream address",
				copySelectedUrls,
				!0
			]
		];
		if (Ut === "bookmarks" && S.length === 1) {
			let [m] = S;
			D.push([
				"Rename...",
				() => {
					let _ = window.prompt("Bookmark name", m.title);
					_ != null && (x.rename(m.url, _), load());
				},
				!0
			], [
				"Move up",
				() => {
					x.move(m.url, -1), load();
				},
				!0
			], [
				"Move down",
				() => {
					x.move(m.url, 1), load();
				},
				!0
			]);
		}
		S.length === 1 && S[0].homepage && D.push([
			"Open station website",
			() => window.open(S[0].homepage, "_blank", "noopener"),
			!0
		]), Ht.replaceChildren(...D.map(([m, _, x]) => {
			let S = button("ml-menu-item", m);
			return S.setAttribute("role", "menuitem"), S.disabled = !x, S.addEventListener("click", () => {
				closePopups(), _();
			}), S;
		})), Dt.hidden = !0, placePopup(Ht, m, _);
	}
	function toggleFilterPanel() {
		if (!Dt.hidden) {
			closePopups();
			return;
		}
		if (Ht.hidden = !0, Ut === "online") loadCountries();
		else {
			let m = [...new Set(sourceStations().map((m) => m.country).filter(Boolean))].sort(), _ = Pt.value;
			Pt.replaceChildren(new Option("Any country", ""), ...m.map((m) => new Option(m, m))), Pt.value = m.includes(_) ? _ : "", un = !1;
		}
		let m = lt.getBoundingClientRect();
		placePopup(Dt, m.left, m.top - 4), Dt.style.top = `${m.top - me.getBoundingClientRect().top - Dt.offsetHeight - 4}px`, lt.setAttribute("aria-expanded", "true");
	}
	function updateFilterLabel() {
		let m = [
			dn.bitrateMin ? `${dn.bitrateMin}k+` : "",
			dn.format,
			dn.country,
			dn.language
		].filter(Boolean);
		lt.textContent = m.length > 0 ? `Filter: ${m.join(" ")} ▾` : "Filter ▾";
	}
	function applyFilters() {
		dn.bitrateMin = Number(At.value) || 0, dn.format = Mt.value, dn.country = Pt.value, dn.language = Lt.value, dn.order = zt.value, updateFilterLabel(), load();
	}
	function hide() {
		closePopups(), re.hidden = !0;
	}
	let yn = null, bn = !1;
	function embedInto(m) {
		yn = m, hide(), m.classList.add("ml-embed"), m.append(me), bn || restoreView().then(() => load());
	}
	function unembed() {
		yn && (yn.classList.remove("ml-embed"), yn = null, closePopups(), ue.append(me));
	}
	async function restoreView() {
		bn = !0;
		let m = readView();
		Kt = new Set(Array.isArray(m.expanded) ? m.expanded : ["Electronic"]), Ut = te.some((_) => _.id === m.nav) ? m.nav : te[0].id;
		for (let [m, _] of Oe) _.classList.toggle("is-selected", m === Ut), _.setAttribute("aria-selected", m === Ut ? "true" : "false");
		if (Ut === "online" && m.genre) for (let _ of Ky) {
			_.name === m.genre && (Gt = {
				name: _.name,
				tag: _.tag
			});
			let x = _.children.find((_) => _.name === m.genre);
			x && (Gt = {
				name: x.name,
				tag: x.tag
			});
		}
		else Gt = null;
		en = Ut === "online" || J.has(Ut) ? null : "name", xt.hidden = Ut !== "history" && Ut !== "songs", buildHead(columnsFor()), Ut === "featured" && await ensureLocal(), renderGenres();
	}
	async function show() {
		yn || (mount(), re.hidden = !1, restoreWindowPosition(), await restoreView(), await load(), Re.focus());
	}
	Re.addEventListener("input", () => {
		clearTimeout(an);
		let m = Ut === "online" || !!J.get(Ut)?.search;
		an = setTimeout(() => void load(), m ? 450 : 100);
	}), Re.addEventListener("keydown", (m) => {
		m.key === "Enter" ? (m.preventDefault(), clearTimeout(an), load()) : m.key === "ArrowDown" && (m.preventDefault(), Je.focus(), moveSelection(1, !1));
	}), Je.addEventListener("keydown", (m) => {
		switch (m.key) {
			case "ArrowDown":
				m.preventDefault(), moveSelection(1, m.shiftKey);
				break;
			case "ArrowUp":
				m.preventDefault(), moveSelection(-1, m.shiftKey);
				break;
			case "PageDown":
				m.preventDefault(), moveSelection(12, m.shiftKey);
				break;
			case "PageUp":
				m.preventDefault(), moveSelection(-12, m.shiftKey);
				break;
			case "Home":
				m.preventDefault(), moveSelection(-Yt.length, m.shiftKey);
				break;
			case "End":
				m.preventDefault(), moveSelection(Yt.length, m.shiftKey);
				break;
			case "Enter":
				m.preventDefault(), m.shiftKey ? enqueueSelected() : playSelected();
				break;
			case "a":
			case "A":
				(m.ctrlKey || m.metaKey) && (m.preventDefault(), Xt = new Set(Yt.map((m) => m.url)), renderRows());
				break;
			case "Delete":
			case "Backspace": Ut === "bookmarks" && selectedStations().length > 0 && (m.preventDefault(), bookmarkSelected());
		}
	}), $.addEventListener("click", playSelected), et.addEventListener("click", enqueueSelected), tt.addEventListener("click", bookmarkSelected), mt.addEventListener("click", () => void load({ append: !0 })), lt.addEventListener("click", toggleFilterPanel), xt.addEventListener("click", async () => {
		await S.clear(Ut === "songs" ? "songs" : "stations"), load();
	}), Lt.addEventListener("change", applyFilters), zt.addEventListener("change", applyFilters), At.addEventListener("change", applyFilters), Mt.addEventListener("change", applyFilters), Pt.addEventListener("change", applyFilters), Vt.addEventListener("click", () => {
		At.value = "0", Mt.value = "", Pt.value = "", Lt.value = "", zt.value = "clickcount", applyFilters(), closePopups();
	}), oe.addEventListener("click", hide), oe.addEventListener("keydown", (m) => {
		(m.key === "Enter" || m.key === " ") && (m.preventDefault(), hide());
	}), re.addEventListener("keydown", (m) => {
		m.key === "Escape" && (m.preventDefault(), !Dt.hidden || !Ht.hidden ? closePopups() : hide());
	}), re.addEventListener("mousedown", (m) => {
		!Dt.hidden && !Dt.contains(m.target) && m.target !== lt && (Dt.hidden = !0, lt.setAttribute("aria-expanded", "false")), !Ht.hidden && !Ht.contains(m.target) && (Ht.hidden = !0);
	});
	let xn = null;
	ie.addEventListener("mousedown", (m) => {
		if (m.button !== 0 || oe.contains(m.target)) return;
		m.preventDefault();
		let _ = Q.getBoundingClientRect();
		xn = {
			dx: m.clientX - _.left,
			dy: m.clientY - _.top
		}, Q.classList.add("is-dragging");
	}), window.addEventListener("mousemove", (m) => {
		xn && placeWindow(m.clientX - xn.dx, m.clientY - xn.dy);
	}), window.addEventListener("mouseup", () => {
		xn && (xn = null, Q.classList.remove("is-dragging"), writeView({
			...readView(),
			left: Q.offsetLeft,
			top: Q.offsetTop
		}));
	}), window.addEventListener("resize", () => {
		!re.hidden && Q.classList.contains("is-placed") && placeWindow(Q.offsetLeft, Q.offsetTop);
	});
	function placeWindow(m, _) {
		let x = Math.max(0, re.clientWidth - Q.offsetWidth), S = Math.max(0, re.clientHeight - Q.offsetHeight);
		Q.style.left = `${Math.round(Math.min(Math.max(0, m), x))}px`, Q.style.top = `${Math.round(Math.min(Math.max(0, _), S))}px`, Q.classList.add("is-placed");
	}
	function restoreWindowPosition() {
		let m = readView();
		if (Number.isFinite(m.left) && Number.isFinite(m.top)) {
			placeWindow(m.left, m.top);
			return;
		}
		let _ = re.getBoundingClientRect(), x = O?.({
			width: Q.offsetWidth,
			height: Q.offsetHeight,
			overlay: _
		});
		if (x) {
			placeWindow(x.left, x.top);
			return;
		}
		let S = document.querySelector("#main-window")?.getBoundingClientRect();
		S && S.right + Q.offsetWidth + 8 <= _.width ? placeWindow(S.right - _.left + 8, S.top - _.top) : placeWindow((_.width - Q.offsetWidth) / 2, (_.height - Q.offsetHeight) / 2);
	}
	function refreshNowPlaying() {
		if (re.hidden || isSongsView()) return;
		let m = C();
		for (let _ of Je.querySelectorAll(".ml-row")) {
			let x = m && _.dataset.url === m.station?.url;
			_.classList.toggle("is-playing", !!x);
			let S = _.querySelector(".ml-col-nowplaying");
			S && (S.textContent = x ? m.streamTitle : "");
		}
	}
	async function showNode(m, _) {
		await show(), m && Oe.has(m) && Ut !== m && selectNav(m), typeof _ == "string" && (Re.value = _), await load(), Re.focus(), Re.select?.();
	}
	return {
		show,
		showNode,
		hide,
		embedInto,
		unembed,
		isEmbedded: () => !!yn,
		get body() {
			return me;
		},
		isVisible: () => !!yn || !!re && !re.hidden,
		refreshNowPlaying,
		render: () => void load(),
		get element() {
			return re;
		}
	};
}
//#endregion
//#region src/playbackController.js
var rx = [
	1e3,
	2e3,
	4e3,
	8e3,
	15e3,
	3e4,
	3e4,
	3e4
], ix = 5e3, ax = 15e3, ox = 3e4, sx = 4e3;
function createPlaybackController({ webamp: m, onEvent: _ }) {
	let x = m.media?._source?._audio ?? null, emit = (m, x = {}) => _?.({
		type: m,
		...x
	}), C = null, D = "stopped", O = 0, F = 0, I = null, L = null, H = 0, W = 0, q = 0, ee = 0, te = null, J = !1, isLive = (m) => !!m && m.live !== !1;
	function currentTrackId() {
		return m.store.getState().playlist.currentTrack;
	}
	function clearTimers() {
		clearTimeout(I), I = null, clearInterval(L), L = null;
	}
	function startStallCheck() {
		clearInterval(L), L = setInterval(() => {
			D === "playing" && x && !x.paused && Date.now() - H > ax && (emit("stalled", { station: C }), reload("stalled"));
		}, ix);
	}
	function reload(_, { useNextUrl: x = !1 } = {}) {
		if (C && !J) {
			J = !0;
			try {
				let D = Array.isArray(C.urls) && C.urls.length > 1 ? C.urls : [C.url];
				x && D.length > 1 && (F = (F + 1) % D.length);
				let I = D[F] ?? C.url, L = currentTrackId(), W = L == null ? null : m.store.getState().tracks[L];
				if (W && S(W.url)?.url === C.url && I === C.url) m.store.dispatch({
					type: "PLAY_TRACK",
					id: L
				});
				else {
					let _ = {
						...C,
						url: I,
						urls: D,
						originalTitle: C.originalTitle ?? C.title
					};
					C = _, m.setTracksToPlay(U([_]));
				}
				ee = Date.now(), H = Date.now(), emit("reconnecting", {
					station: C,
					attempt: O,
					reason: _,
					url: I
				});
			} finally {
				J = !1;
			}
		}
	}
	function scheduleRetry(m) {
		if (!C || D !== "playing" || I) return;
		if (O >= rx.length) {
			D = "stopped", emit("failed", {
				station: C,
				reason: m
			});
			return;
		}
		let _ = navigator.onLine === !1 ? null : rx[O];
		if (O += 1, _ == null) {
			emit("waiting-for-network", { station: C });
			return;
		}
		I = setTimeout(() => {
			I = null, reload(m, { useNextUrl: O > 2 && O % 2 == 1 });
		}, _);
	}
	function markFailure() {
		W = Date.now();
	}
	let onError = () => {
		markFailure(), C && D === "playing" && scheduleRetry("error");
	}, onEnded = () => {
		C && isLive(C) && D === "playing" && (markFailure(), scheduleRetry("ended"));
	}, onProgress = () => {
		H = Date.now(), O > 0 && D === "playing" && !x.paused && Date.now() - ee > 1500 && (O = 0, F = 0, emit("recovered", { station: C }));
	};
	x && (x.addEventListener("error", onError, !0), x.addEventListener("ended", onEnded, !0), x.addEventListener("timeupdate", onProgress), x.addEventListener("playing", onProgress));
	let ne = m.store.subscribe(() => {
		let _ = m.store.getState().media.status;
		if (_ === te) return;
		let x = te;
		te = _, C && (_ === "PLAYING" ? (x === "PAUSED" && Date.now() - q > ox && isLive(C) ? (D = "playing", reload("live-edge")) : x === "STOPPED" && Date.now() - W > 200 && Date.now() - ee > sx ? (D = "playing", reload("play-after-stop")) : D = "playing", H = Date.now(), startStallCheck()) : _ === "PAUSED" ? (D = "paused", q = Date.now(), clearTimers()) : _ === "STOPPED" && (Date.now() - W < 200 || (D = "stopped", O = 0, clearTimers())), emit("status", {
			status: _,
			intent: D
		}));
	}), onOnline = () => {
		C && D === "playing" && (clearTimeout(I), I = null, O = 0, reload("online"));
	}, onWake = () => {
		!document.hidden && C && D === "playing" && x && (x.paused || Date.now() - H > ax) && reload("wake");
	};
	return window.addEventListener("online", onOnline), document.addEventListener("visibilitychange", onWake), window.addEventListener("pageshow", onWake), {
		noteStation(m) {
			C = m, D = "playing", O = 0, F = Math.max(0, (m?.urls ?? []).indexOf(m?.url)), ee = Date.now(), H = Date.now(), W = 0, clearTimers(), startStallCheck();
		},
		clearStation() {
			C = null, D = "stopped", clearTimers();
		},
		getStation: () => C,
		getIntent: () => D,
		getState: () => ({
			attempt: O,
			urlIndex: F,
			intent: D,
			urls: C?.urls ?? null,
			url: C?.url ?? null
		}),
		reconnect: () => {
			O = 0, reload("manual");
		},
		dispose() {
			clearTimers(), ne(), window.removeEventListener("online", onOnline), document.removeEventListener("visibilitychange", onWake), window.removeEventListener("pageshow", onWake), x && (x.removeEventListener("error", onError, !0), x.removeEventListener("ended", onEnded, !0), x.removeEventListener("timeupdate", onProgress), x.removeEventListener("playing", onProgress));
		}
	};
}
//#endregion
//#region src/radioRecord.js
var cx = "https://ancient-bush-28d0.gamernr1elite.workers.dev/api", lx = `${cx}/stations/`, ux = `${cx}/stations/now/`, dx = /hostingradio\.ru\/([^/?]+)\//i;
function deriveRRPrefix(m) {
	let _ = String(m?.url ?? m?.hls ?? "").match(dx);
	return _ ? _[1] : "";
}
function isRadioRecord(m) {
	return deriveRRPrefix(m) !== "";
}
var fx = null, px = null;
async function ensureMap() {
	return fx || px || (px = (async () => {
		try {
			let m = await fetch(lx, { cache: "no-store" });
			if (!m.ok) throw Error(`stations ${m.status}`);
			let _ = await m.json(), x = _?.result ?? _?.data ?? _, S = Array.isArray(x) ? x : x?.stations ?? [], C = {};
			for (let m of S) {
				let _ = String(m?.id ?? m?.station_id ?? "").trim();
				if (!_) continue;
				let x = String(m?.prefix ?? m?.code ?? "").trim();
				x && (C[x] = _);
				for (let x of [
					m?.stream_hls,
					m?.hls,
					m?.url
				]) {
					let m = deriveRRPrefix({ url: x });
					m && (C[m] = _);
				}
			}
			return fx = Object.keys(C).length > 0 ? C : null, fx;
		} catch {
			return null;
		} finally {
			px = null;
		}
	})(), px);
}
function pickCover(m) {
	return m?.image600 || m?.image200 || m?.image100 || m?.cover || "";
}
async function fetchRadioRecordNowPlaying(m) {
	let _ = deriveRRPrefix(m);
	if (!_) return null;
	let x = (await ensureMap())?.[_];
	if (!x) return null;
	let S = await fetch(ux, { cache: "no-store" });
	if (!S.ok) return null;
	let C = await S.json(), D = C?.result ?? C?.data ?? C, O = (Array.isArray(D) ? D : D?.stations ?? []).find((m) => String(m?.id ?? m?.station_id ?? "") === String(x))?.track;
	if (!O) return null;
	let F = String(O.artist ?? "").trim(), I = String(O.song ?? O.title ?? "").trim();
	return !F && !I ? null : {
		artist: F,
		title: I,
		cover: pickCover(O)
	};
}
//#endregion
//#region src/radioMetadata.js
var mx = 1e4, hx = 2e4, gx = 7e3, _x = 98304;
function splitStreamTitle(m, _) {
	let x = String(m ?? "").trim(), S = x.indexOf(" - ");
	return S > 0 ? {
		artist: x.slice(0, S).trim(),
		title: x.slice(S + 3).trim()
	} : {
		artist: _?.originalTitle ?? _?.title ?? "",
		title: x
	};
}
async function probeIcy(m) {
	let _ = new AbortController(), x = setTimeout(() => _.abort(), gx);
	try {
		let x = await fetch(m, {
			headers: { "Icy-MetaData": "1" },
			cache: "no-store",
			credentials: "omit",
			signal: _.signal
		}), S = Number(x.headers.get("icy-metaint"));
		if (!x.ok || !x.body || !Number.isInteger(S) || S <= 0) return _.abort(), null;
		let C = x.body.getReader(), D = [], O = 0;
		for (; O < Math.min(_x, S + 4097);) {
			let { done: m, value: _ } = await C.read();
			if (m) break;
			D.push(_), O += _.length;
		}
		_.abort();
		let F = new Uint8Array(O), I = 0;
		for (let m of D) F.set(m, I), I += m.length;
		if (F.length <= S) return null;
		let L = F[S] * 16, H = new TextDecoder().decode(F.subarray(S + 1, S + 1 + L)).replace(/\0+$/, ""), U = /StreamTitle='((?:[^'\\]|\\.|'(?!;))*)';/.exec(H);
		return U ? {
			title: U[1].replace(/\\'/g, "'").trim(),
			name: x.headers.get("icy-name") ?? ""
		} : null;
	} catch {
		return null;
	} finally {
		clearTimeout(x);
	}
}
function parseId3Text(m) {
	if (!m || m.length < 10 || m[0] !== 73 || m[1] !== 68 || m[2] !== 51) return null;
	let _ = m[3], syncsafe = (_) => (m[_] & 127) << 21 | (m[_ + 1] & 127) << 14 | (m[_ + 2] & 127) << 7 | m[_ + 3] & 127, x = syncsafe(6), S = 10;
	m[5] & 64 && (S += _ === 4 ? syncsafe(10) : (m[10] << 24 | m[11] << 16 | m[12] << 8 | m[13]) + 4);
	let C = Math.min(m.length, 10 + x), D = {}, decode = (m, _) => {
		let x = m === 1 ? "utf-16" : m === 2 ? "utf-16be" : m === 3 ? "utf-8" : "windows-1252";
		try {
			return new TextDecoder(x).decode(_).replace(/\0+$/g, "").trim();
		} catch {
			return "";
		}
	};
	for (; S + 10 <= C;) {
		let x = String.fromCharCode(m[S], m[S + 1], m[S + 2], m[S + 3]);
		if (!/^[A-Z0-9]{4}$/.test(x)) break;
		let C = _ === 4 ? syncsafe(S + 4) : m[S + 4] << 24 | m[S + 5] << 16 | m[S + 6] << 8 | m[S + 7], O = m.subarray(S + 10, S + 10 + C);
		if (S += 10 + C, !(C <= 1 || O.length === 0) && x[0] === "T") {
			let m = decode(O[0], O.subarray(1));
			if (x === "TXXX") {
				let [_, x] = m.split("\0");
				D[`TXXX:${_}`] = x ?? "";
			} else D[x] = m;
		}
	}
	return Object.keys(D).length > 0 ? D : null;
}
function createRadioMetadata({ onNowPlaying: m }) {
	let _ = null, x = null, S = "", O = !1, F = !1;
	function publish(x, C, D = "") {
		let O = String(x ?? "").trim();
		O && O !== S && _ && (S = O, m({
			station: _,
			streamTitle: O,
			...splitStreamTitle(O, _),
			artwork: D || "",
			source: C
		}));
	}
	async function poll() {
		if (_ && !O) {
			O = !0;
			try {
				if (isRadioRecord(_)) {
					let m = await fetchRadioRecordNowPlaying(_);
					m && publish(m.artist && m.title ? `${m.artist} - ${m.title}` : m.title || m.artist, "radiorecord", m.cover);
				} else if (C() && D(_) !== "HLS") publish((await I(_))?.title, "proxy");
				else if (!F && D(_) !== "HLS") {
					let m = await probeIcy(_.url);
					m ? publish(m.title, "icy") : (F = !0, stopTimer());
				}
			} finally {
				O = !1;
			}
		}
	}
	function schedule() {
		stopTimer(), !(!_ || F && !C()) && (D(_) !== "HLS" || isRadioRecord(_)) && (x = setTimeout(async () => {
			await poll(), schedule();
		}, document.hidden ? hx : mx));
	}
	function stopTimer() {
		clearTimeout(x), x = null;
	}
	let onVisibility = () => {
		x && schedule();
	};
	return document.addEventListener("visibilitychange", onVisibility), {
		start(m) {
			_ = m, S = "", F = !1, stopTimer(), _ && (x = setTimeout(async () => {
				await poll(), schedule();
			}, 2500));
		},
		stop() {
			stopTimer(), _ = null, S = "";
		},
		pushId3(m) {
			let _ = parseId3Text(m);
			if (!_) return;
			let x = _.TIT2 || _["TXXX:title"] || "", S = _.TPE1 || _["TXXX:artist"] || "";
			publish(S && x ? `${S} - ${x}` : x || S || _["TXXX:StreamTitle"] || "", "id3");
		},
		push(m) {
			publish(m, "push");
		},
		dispose() {
			stopTimer(), document.removeEventListener("visibilitychange", onVisibility);
		}
	};
}
//#endregion
//#region src/mediaSession.js
function createMediaSessionBridge({ webamp: m, isLive: _ }) {
	let x = "mediaSession" in navigator ? navigator.mediaSession : null, S = {
		station: null,
		artist: "",
		title: "",
		artwork: "",
		logo: ""
	};
	function setHandler(m, _) {
		if (x) try {
			x.setActionHandler(m, _);
		} catch {}
	}
	function apply() {
		if (!x) return;
		let { station: C, artist: D, title: O, artwork: F, logo: I } = S, L = [];
		F && L.push({
			src: F,
			sizes: "600x600",
			type: "image/jpeg"
		}), I && L.push({
			src: I,
			sizes: "128x128"
		});
		try {
			x.metadata = new MediaMetadata({
				title: O || C?.title || "",
				artist: D || (O ? C?.title ?? "" : ""),
				album: C?.title ?? "",
				artwork: L
			});
		} catch {}
		let H = C ? _(C) : !1;
		setHandler("play", () => m.play()), setHandler("pause", () => m.pause()), setHandler("stop", () => m.stop());
		let U = m.getPlaylistTracks().length;
		if (setHandler("seekbackward", H ? null : () => m.seekBackward(10)), setHandler("seekforward", H ? null : () => m.seekForward(10)), setHandler("seekto", null), setHandler("previoustrack", U > 1 ? () => m.previousTrack() : null), setHandler("nexttrack", U > 1 ? () => m.nextTrack() : null), H && "setPositionState" in x) try {
			x.setPositionState();
		} catch {}
	}
	function setPlaybackState(m) {
		x && (x.playbackState = m === "PLAYING" ? "playing" : m === "PAUSED" ? "paused" : "none");
	}
	return {
		setStation(m) {
			S = {
				station: m,
				artist: "",
				title: "",
				artwork: "",
				logo: m?.favicon || m?.logo || ""
			}, apply();
		},
		setNowPlaying({ artist: m, title: _, artwork: x }) {
			S = {
				...S,
				artist: m ?? "",
				title: _ ?? "",
				artwork: x ?? S.artwork
			}, apply();
		},
		setArtwork(m) {
			S = {
				...S,
				artwork: m ?? ""
			}, apply();
		},
		setPlaybackState,
		clear() {
			S = {
				station: null,
				artist: "",
				title: "",
				artwork: "",
				logo: ""
			}, x && (x.metadata = null, x.playbackState = "none");
		}
	};
}
//#endregion
//#region src/artworkResolver.js
var vx = "https://itunes.apple.com/search", yx = "webamp.artwork.v1", bx = 200, xx = 4e3, Sx = null, Cx = 0;
function readCache$1() {
	if (!Sx) try {
		Sx = JSON.parse(localStorage.getItem(yx) ?? "{}") ?? {};
	} catch {
		Sx = {};
	}
	return Sx;
}
_(readCache$1, "readCache");
function remember(m, _) {
	let x = readCache$1();
	x[m] = {
		url: _,
		at: Date.now()
	};
	let S = Object.keys(x);
	S.length > bx && S.sort((m, _) => x[m].at - x[_].at).slice(0, S.length - bx).forEach((m) => delete x[m]);
	try {
		localStorage.setItem(yx, JSON.stringify(x));
	} catch {}
}
function normalizeName(m) {
	return String(m ?? "").toLowerCase().replace(/\((feat|ft|with)\.?[^)]*\)|\[[^\]]*\]/g, "").replace(/\b(feat|ft)\.?\s.*$/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function looksLikeSong(m, _) {
	let x = normalizeName(m), S = normalizeName(_);
	return !(!x || !S || x === S || /\b(radio|fm|live|jingle|advert|reklama|station|news|ziņas|top ?40)\b/.test(x) && !/\b(radio)head\b/.test(x) || S.length < 2 || x.length < 2);
}
async function resolveArtwork(m, _) {
	if (!looksLikeSong(m, _)) return;
	let x = `${normalizeName(m)}|${normalizeName(_)}`, S = readCache$1()[x];
	if (S) return S.url;
	let C = xx - (Date.now() - Cx);
	C > 0 && await new Promise((m) => setTimeout(m, C)), Cx = Date.now();
	try {
		let S = new URLSearchParams({
			term: `${m} ${_}`,
			entity: "song",
			limit: "5",
			media: "music"
		}), C = await fetch(`${vx}?${S}`, {
			cache: "force-cache",
			signal: AbortSignal.timeout(6e3)
		});
		if (!C.ok) return "";
		let D = await C.json(), O = normalizeName(m), F = normalizeName(_), I = (D.results ?? []).find((m) => {
			let _ = normalizeName(m.artistName);
			return normalizeName(m.trackName) === F && (_ === O || _.includes(O) || O.includes(_));
		}), L = I?.artworkUrl100 ? I.artworkUrl100.replace(/100x100bb/, "600x600bb") : "";
		return remember(x, L), L;
	} catch {
		return "";
	}
}
//#endregion
//#region src/favoritesStore.js
var wx = "webamp.radio.bookmarks.v1", Tx = /* @__PURE__ */ new Set(), Ex = null;
function read() {
	if (Ex) return Ex;
	try {
		let m = localStorage.getItem(wx);
		if (!m) Ex = [];
		else if (m.trimStart().startsWith("[")) Ex = JSON.parse(m) ?? [];
		else {
			let _ = m.split("\n");
			Ex = [];
			for (let m = 0; m + 1 < _.length; m += 2) {
				let x = _[m].trim(), S = _[m + 1].trim();
				x && S && Ex.push({
					url: x,
					title: S,
					https: x.startsWith("https:")
				});
			}
		}
	} catch {
		Ex = [];
	}
	return Ex;
}
function write(m) {
	Ex = m;
	try {
		localStorage.setItem(wx, JSON.stringify(m));
	} catch {}
	for (let _ of Tx) try {
		_(m);
	} catch (m) {
		console.error(m);
	}
}
function toEntry(m) {
	return {
		url: m.url,
		urls: Array.isArray(m.urls) ? m.urls : void 0,
		title: m.title,
		originalTitle: m.originalTitle ?? m.title,
		country: m.country || "",
		countryName: m.countryName || "",
		language: m.language || "",
		genre: m.genre || "",
		tags: m.tags ?? [],
		bitrate: m.bitrate || 0,
		codec: m.codec || "",
		homepage: m.homepage || "",
		favicon: m.favicon || m.logo || "",
		note: m.note || "",
		uuid: m.uuid || "",
		hostKey: m.hostKey || "",
		https: m.https === void 0 ? String(m.url).startsWith("https:") : m.https,
		addedAt: Date.now()
	};
}
var Dx = {
	list: () => read().slice(),
	has: (m) => read().some((_) => _.url === m),
	get: (m) => read().find((_) => _.url === m) ?? null,
	add(m) {
		return !m?.url || this.has(m.url) ? !1 : (write([...read(), toEntry(m)]), !0);
	},
	remove(m) {
		write(read().filter((_) => _.url !== m));
	},
	toggle(m) {
		return this.has(m.url) ? (this.remove(m.url), !1) : this.add(m);
	},
	rename(m, _) {
		let x = String(_ ?? "").trim();
		x && write(read().map((_) => _.url === m ? {
			..._,
			title: x
		} : _));
	},
	move(m, _) {
		let x = read().slice(), S = x.findIndex((_) => _.url === m);
		if (S === -1) return;
		let C = Math.max(0, Math.min(x.length - 1, S + _)), [D] = x.splice(S, 1);
		x.splice(C, 0, D), write(x);
	},
	reorder(m) {
		let _ = new Map(read().map((m) => [m.url, m])), x = m.map((m) => _.get(m)).filter(Boolean);
		for (let m of _.values()) x.includes(m) || x.push(m);
		write(x);
	},
	subscribe(m) {
		return Tx.add(m), () => Tx.delete(m);
	}
}, Ox = "https://www.googleapis.com/youtube/v3/", kx = 50, YouTubeApiError = class extends Error {
	constructor(m, { status: _ = 0, reason: x = "" } = {}) {
		super(m), this.name = "YouTubeApiError", this.status = _, this.reason = x;
	}
};
function parseDuration$1(m) {
	let _ = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(m ?? ""));
	if (!_) return 0;
	let [, x, S, C, D] = _.map((m) => Number(m) || 0);
	return x * 86400 + S * 3600 + C * 60 + D;
}
_(parseDuration$1, "parseDuration");
function pickThumbnail(m) {
	let _ = m ?? {};
	return (_.medium ?? _.high ?? _.default ?? _.standard ?? _.maxres)?.url ?? "";
}
function createYouTubeApi({ apiKey: m, fetchImpl: _ = (...m) => fetch(...m) } = {}) {
	if (!m) throw new YouTubeApiError("YouTube API key is not configured", { reason: "noKey" });
	async function request(x, S, { signal: C } = {}) {
		let D = new URL(x, Ox);
		for (let [m, _] of Object.entries(S)) _ != null && _ !== "" && D.searchParams.set(m, String(_));
		D.searchParams.set("key", m);
		let O;
		try {
			O = await _(D, {
				signal: C,
				cache: "no-store"
			});
		} catch (m) {
			throw m?.name === "AbortError" ? m : new YouTubeApiError("YouTube is unreachable", { reason: "network" });
		}
		let F = null;
		try {
			F = await O.json();
		} catch {
			F = null;
		}
		if (!O.ok) {
			let m = F?.error?.errors?.[0]?.reason ?? "";
			throw new YouTubeApiError(F?.error?.message ?? `YouTube API error ${O.status}`, {
				status: O.status,
				reason: m
			});
		}
		return F ?? {};
	}
	async function playlistItems(m, { max: _ = kx, pageToken: x, signal: S } = {}) {
		let C = await request("playlistItems", {
			part: "snippet",
			playlistId: m,
			maxResults: Math.min(kx, _),
			pageToken: x
		}, { signal: S }), D = [];
		for (let m of C.items ?? []) {
			let _ = m.snippet ?? {}, x = _.resourceId?.videoId;
			x && _.title !== "Deleted video" && _.title !== "Private video" && D.push({
				videoId: x,
				title: _.title ?? "",
				channelTitle: _.videoOwnerChannelTitle ?? _.channelTitle ?? "",
				thumbnail: pickThumbnail(_.thumbnails),
				position: _.position ?? D.length
			});
		}
		return {
			items: D,
			nextPageToken: C.nextPageToken ?? null
		};
	}
	async function videos(m, { signal: _ } = {}) {
		let x = /* @__PURE__ */ new Map(), S = [...new Set(m.filter(Boolean))];
		for (let m = 0; m < S.length; m += kx) {
			let C = await request("videos", {
				part: "snippet,contentDetails,status",
				id: S.slice(m, m + kx).join(","),
				maxResults: kx
			}, { signal: _ });
			for (let m of C.items ?? []) {
				let _ = m.snippet ?? {}, S = m.status ?? {};
				x.set(m.id, {
					id: m.id,
					title: _.title ?? "",
					channelTitle: _.channelTitle ?? "",
					duration: parseDuration$1(m.contentDetails?.duration),
					thumbnail: pickThumbnail(_.thumbnails),
					embeddable: S.embeddable !== !1,
					playable: S.privacyStatus !== "private" && S.uploadStatus !== "rejected" && S.uploadStatus !== "failed"
				});
			}
		}
		return x;
	}
	return {
		request,
		playlistItems,
		videos
	};
}
//#endregion
//#region src/youtube/cache.js
var Ax = "webamp.yt.v1:", jx = 40, Mx = 36e5, cacheKey = (m, ..._) => `${Ax}${m}:${_.map((m) => String(m ?? "")).join(":")}`;
function readRaw(m) {
	try {
		let _ = localStorage.getItem(m);
		if (!_) return null;
		let x = JSON.parse(_);
		return x && typeof x.at == "number" && "data" in x ? x : null;
	} catch {
		return null;
	}
}
function writeRaw(m, _) {
	try {
		localStorage.setItem(m, JSON.stringify(_)), evict();
	} catch {}
}
function evict() {
	let m = [];
	for (let _ = 0; _ < localStorage.length; _++) {
		let x = localStorage.key(_);
		x?.startsWith(Ax) && m.push(x);
	}
	if (!(m.length <= jx)) {
		m.sort((m, _) => (readRaw(m)?.at ?? 0) - (readRaw(_)?.at ?? 0));
		for (let _ of m.slice(0, m.length - jx)) localStorage.removeItem(_);
	}
}
function readCache(m) {
	let _ = readRaw(m);
	return _ ? {
		data: _.data,
		fresh: Date.now() - _.at < (_.ttl ?? 0)
	} : null;
}
function writeCache(m, _, x) {
	writeRaw(m, {
		at: Date.now(),
		ttl: x,
		data: _
	});
}
async function cached(m, _, x, { onRefresh: S, allowStale: C = !0 } = {}) {
	let D = readCache(m);
	if (D?.fresh) return D.data;
	if (D && C) return Promise.resolve().then(x).then((x) => {
		writeCache(m, x, _), S?.(x);
	}).catch(() => {}), D.data;
	let O = await x();
	return writeCache(m, O, _), O;
}
//#endregion
//#region src/youtube/tracks.js
var Nx = /* @__PURE__ */ new Map(), Px = "youtube:", isYouTubeUrl = (m) => typeof m == "string" && m.startsWith("youtube:"), youtubeIdFromUrl = (m) => isYouTubeUrl(m) ? m.slice(8) : "", Fx = /\s*[([](?:official\s*(?:music\s*)?(?:video|audio|visuali[sz]er|lyric\s*video)|lyrics?|hd|hq|4k|audio|visuali[sz]er|explicit|clean|out now|remaster(?:ed)?(?:\s*\d{4})?)[)\]]\s*/gi, Ix = /\s*-\s*topic$|vevo$/i;
function splitArtistTitle(m, _ = "") {
	let x = String(m ?? "").replace(Fx, " ").replace(/\s{2,}/g, " ").trim(), S = /^(.+?)\s+[-–—]\s+(.+)$/.exec(x);
	return S ? {
		artist: S[1].trim(),
		title: S[2].trim()
	} : {
		artist: String(_ ?? "").replace(Ix, "").trim(),
		title: x
	};
}
function toYouTubeRows(m) {
	let _ = [];
	for (let x of m) {
		if (!x?.id || x.playable === !1 || x.embeddable === !1) continue;
		let { artist: m, title: S } = splitArtistTitle(x.title, x.channelTitle), C = `${Px}${x.id}`;
		_.push({
			source: "youtube",
			url: C,
			youtubeId: x.id,
			title: S,
			artist: m,
			originalTitle: x.title,
			genre: x.channelTitle || "",
			tags: x.channelTitle ? [x.channelTitle] : [],
			codec: "YouTube",
			bitrate: 0,
			duration: x.duration || 0,
			favicon: x.thumbnail || "",
			logo: x.thumbnail || "",
			homepage: `https://www.youtube.com/watch?v=${x.id}`,
			https: !0
		});
	}
	return _;
}
function toYouTubeTracks(m) {
	return m.map((m) => (Nx.set(m.url, {
		id: m.youtubeId,
		thumbnail: m.favicon,
		channelTitle: m.genre,
		duration: m.duration
	}), L(m.url, m), {
		url: m.url,
		defaultName: m.artist ? `${m.artist} - ${m.title}` : m.title,
		metaData: {
			artist: m.artist,
			title: m.title
		},
		duration: m.duration
	}));
}
//#endregion
//#region src/youtube/sources.js
var Lx = 8 * Mx;
async function fetchPlaylistRows(m, _, { signal: x } = {}) {
	let { items: S } = await m.playlistItems(_, {
		max: 50,
		signal: x
	}), C = await m.videos(S.map((m) => m.videoId), { signal: x });
	return toYouTubeRows(S.map((m) => C.get(m.videoId)).filter(Boolean));
}
function createYouTubeSources({ apiKey: m = "", defaultPlaylistId: _ = "", defaultPlaylistTitle: x = "WORK", fallbackUrl: S = new URL("data/youtube-fallback.json", document.baseURI).href } = {}) {
	let C = null, getApi = () => (C ||= createYouTubeApi({ apiKey: m }), C), D = null;
	async function loadFallback() {
		if (D) return D;
		try {
			let m = await fetch(S, { cache: "force-cache" }), _ = m.ok ? await m.json() : [];
			D = toYouTubeRows(Array.isArray(_) ? _ : []);
		} catch {
			D = [];
		}
		return D;
	}
	async function loadPlaylist(m, { onRefresh: _, signal: x } = {}) {
		if (!m) return loadFallback();
		try {
			return await cached(cacheKey("playlist", m), Lx, () => fetchPlaylistRows(getApi(), m, { signal: x }), { onRefresh: _ });
		} catch (m) {
			if (m?.name === "AbortError") throw m;
			return console.warn("YouTube playlist unavailable:", m instanceof YouTubeApiError ? `${m.reason || m.status} ${m.message}` : m), loadFallback();
		}
	}
	let loadDefault = (m) => loadPlaylist(_, m);
	return {
		sources: [{
			id: `youtube-playlist-${_ || "fallback"}`,
			name: x,
			icon: "list",
			load: (m) => loadDefault(m)
		}],
		loadDefault,
		loadPlaylist,
		isConfigured: () => !!(m && _)
	};
}
//#endregion
//#region src/youtube/engine.js
var Rx = "https://www.youtube.com/iframe_api", zx = {
	"-1": "unstarted",
	0: "ended",
	1: "playing",
	2: "paused",
	3: "buffering",
	5: "cued"
}, Bx = null;
function loadIframeApi() {
	return window.YT?.Player ? Promise.resolve(window.YT) : (Bx ||= new Promise((m, _) => {
		let x = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			x?.(), m(window.YT);
		};
		let S = document.createElement("script");
		S.src = Rx, S.async = !0, S.onerror = () => {
			Bx = null, S.remove(), _(/* @__PURE__ */ Error("YouTube player script could not be loaded"));
		}, document.head.append(S);
	}), Bx);
}
var Vx = null;
function getYouTubeEngine() {
	return Vx ||= createYouTubeEngine(), Vx;
}
function createYouTubeEngine() {
	let m = null, _ = null, x = null, S = null, C = "idle", D = 100, O = /* @__PURE__ */ new Set(), emit = (m, _) => {
		for (let x of O) try {
			x(m, _);
		} catch (m) {
			console.error(m);
		}
	};
	function ensurePlayer(S) {
		return _ || (_ = (async () => {
			let _ = await loadIframeApi();
			return x = document.createElement("div"), S.replaceChildren(x), await new Promise((S) => {
				m = new _.Player(x, {
					width: "100%",
					height: "100%",
					playerVars: {
						controls: 0,
						disablekb: 1,
						rel: 0,
						playsinline: 1,
						iv_load_policy: 3,
						origin: window.location.origin
					},
					events: {
						onReady: () => {
							m.setVolume(D), S(), emit("ready");
						},
						onStateChange: (m) => {
							C = zx[m.data] ?? "idle", emit("state", C);
						},
						onError: (m) => {
							emit("error", m.data);
						}
					}
				});
			}), m;
		})(), _.catch(() => {
			_ = null;
		}), _);
	}
	let iframe = () => m?.getIframe?.() ?? null;
	return {
		on(m) {
			return O.add(m), () => O.delete(m);
		},
		hasPlayer: () => !!m,
		getState: () => C,
		getCurrentId: () => S,
		ensurePlayer,
		getIframe: iframe,
		async load(_, { autoplay: x = !1, host: C } = {}) {
			await ensurePlayer(C), S = _, x ? m.loadVideoById(_) : m.cueVideoById(_);
		},
		play() {
			m?.playVideo();
		},
		pause() {
			m?.pauseVideo();
		},
		stop() {
			if (m) {
				m.pauseVideo();
				try {
					m.seekTo(0, !0);
				} catch {}
			}
		},
		seekTo(_) {
			m?.seekTo(Math.max(0, _), !0);
		},
		getCurrentTime: () => m?.getCurrentTime && m.getCurrentTime() || 0,
		getDuration: () => m?.getDuration && m.getDuration() || 0,
		setVolume(_) {
			D = Math.max(0, Math.min(100, Math.round(_))), m?.setVolume?.(D);
		},
		getVolume: () => D,
		destroy() {
			try {
				m?.destroy();
			} catch {}
			x?.remove(), m = null, _ = null, x = null, S = null, C = "idle", O.clear(), Vx === this && (Vx = null);
		}
	};
}
//#endregion
//#region src/youtube/source.js
var Hx = "PLAYING", Ux = "PAUSED", Wx = "STOPPED", Gx = 500;
function installYouTubeSource(m, { engine: _, getHost: x, onActive: S, resolveStream: C = null, onStreamMode: D = null } = {}) {
	let O = m.media, F = O?._source, I = F?._audio;
	if (!F || !I || F.__youtubeInstalled) return F?.__youtubeSource ?? null;
	F.__youtubeInstalled = !0;
	let L = {
		loadUrl: F.loadUrl.bind(F),
		play: F.play.bind(F),
		pause: F.pause.bind(F),
		stop: F.stop.bind(F),
		seekToTime: F.seekToTime.bind(F),
		getDuration: F.getDuration.bind(F),
		getTimeElapsed: F.getTimeElapsed.bind(F),
		setVolume: O.setVolume.bind(O),
		loadFromUrl: O.loadFromUrl.bind(O)
	}, H = null, U = null, W = null, q = 0, ee = 0, te = !1, J = "idle", ne = null, re = null, trigger = (m) => F._emitter.trigger(m), setStatus = (m) => F._setStatus(m);
	function startTimer() {
		ne ||= setInterval(() => trigger("positionChange"), Gx);
	}
	function stopTimer() {
		ne && clearInterval(ne), ne = null;
	}
	function clearPauseCheck() {
		re && clearTimeout(re), re = null;
	}
	function ended() {
		stopTimer(), clearPauseCheck(), J = "stopped", trigger("ended"), setStatus(Wx);
	}
	function detachAudio() {
		I.pause(), F.__dropHls?.(), I.hasAttribute("src") && (I.removeAttribute("src"), I.load());
	}
	function deactivate() {
		stopTimer(), clearPauseCheck(), _.hasPlayer() && _.stop(), J = "stopped", H = null, U = null, W = null, q = 0, S?.(!1);
	}
	let Q = /* @__PURE__ */ new Set(), ie = 0, ae = null;
	async function findStream(m) {
		ae?.abort();
		let _ = new AbortController();
		ae = _;
		let x = setTimeout(() => _.abort(), 7e3);
		try {
			return await C(m, { signal: _.signal });
		} catch {
			return null;
		} finally {
			clearTimeout(x), ae === _ && (ae = null);
		}
	}
	let onStreamError = (m) => {
		if (H !== "stream" || !W) return;
		m.stopImmediatePropagation();
		let _ = W, x = J === "playing" || F.getStatus() === Hx;
		Q.add(youtubeIdFromUrl(_)), D?.(!1, { url: _ }), console.warn("Lācītis stream failed, switching to the YouTube player:", youtubeIdFromUrl(_)), H = null, (async () => {
			te = x, await F.loadUrl(_), x && W === _ && await F.play();
		})();
	};
	I.addEventListener("error", onStreamError, !0), O.loadFromUrl = async (m, _) => {
		te = !!_;
		let x = O._emitter;
		if (!x) return L.loadFromUrl(m, _);
		let S = ie + 1;
		x.trigger("waiting"), await F.loadUrl(m), x.trigger("stopWaiting"), _ && S === ie && O.play();
	}, F.loadUrl = async (m) => {
		let x = ++ie;
		if (!isYouTubeUrl(m)) return ae?.abort(), H === "youtube" && deactivate(), H = null, L.loadUrl(m);
		let O = youtubeIdFromUrl(m);
		if (C && !Q.has(O)) {
			let _ = await findStream(O);
			if (x !== ie) return;
			if (_) return H === "youtube" && deactivate(), H = "stream", W = m, U = O, J = te ? "playing" : "stopped", D?.(!0, {
				url: m,
				stream: _
			}), L.loadUrl(_.url);
		}
		H === "stream" && D?.(!1, { url: m }), H !== "youtube" && detachAudio(), stopTimer(), clearPauseCheck(), H = "youtube", W = m, U = youtubeIdFromUrl(m), q = Nx.get(m)?.duration ?? 0, ee = q, J = "stopped", S?.(!0), _.hasPlayer() && !te && _.getCurrentId() !== U && await _.load(U, { autoplay: !1 }), trigger("loaded");
	}, F.play = async () => {
		if (H === "stream" && (J = "playing"), H !== "youtube") return L.play();
		let m = F.getStatus() !== Ux, S = U;
		J = "playing";
		try {
			let C = x?.();
			_.getCurrentId() !== S || _.getState() === "idle" || _.getState() === "ended" ? await _.load(S, {
				autoplay: !0,
				host: C
			}) : (await _.ensurePlayer(C), m && _.getState() !== "cued" && _.seekTo(0), _.play());
		} catch (m) {
			console.warn("YouTube playback failed:", m), J = "stopped", trigger("ended"), setStatus(Wx);
			return;
		}
		U === S && setStatus(Hx);
	}, F.pause = () => {
		if (H === "stream" && (J = "paused"), H !== "youtube") return L.pause();
		J = "paused", stopTimer(), clearPauseCheck(), _.pause(), setStatus(Ux);
	}, F.stop = () => {
		if (H === "stream" && (J = "stopped"), H !== "youtube") return L.stop();
		J = "stopped", stopTimer(), clearPauseCheck(), _.stop(), setStatus(Wx);
	}, F.seekToTime = (m) => {
		if (H !== "youtube") return L.seekToTime(m);
		let x = F.getDuration();
		_.seekTo(Math.max(0, Math.min(Number(m) || 0, x || Infinity))), trigger("positionChange");
	};
	let playerHasTrack = () => _.hasPlayer() && _.getCurrentId() === U;
	F.getDuration = () => H === "youtube" ? playerHasTrack() && _.getDuration() || q : L.getDuration(), F.getTimeElapsed = () => H === "youtube" ? playerHasTrack() ? _.getCurrentTime() : 0 : L.getTimeElapsed(), O.setVolume = (m) => {
		L.setVolume(m), _.setVolume(m);
	}, _.setVolume(m.store.getState().media.volume);
	let oe = _.on((x, S) => {
		if (H === "youtube") {
			if (x === "state") switch (S) {
				case "playing": {
					J === "playing" && startTimer();
					let m = _.getDuration();
					m && Math.round(m) !== Math.round(ee) && (q = m, ee = m, trigger("loaded"));
					break;
				}
				case "buffering":
					stopTimer();
					break;
				case "paused":
					stopTimer(), J === "playing" && !re && (re = setTimeout(() => {
						if (re = null, H !== "youtube" || J !== "playing" || _.getState() !== "paused") return;
						let x = _.getDuration();
						x && _.getCurrentTime() >= x - 1 ? ended() : m.pause();
					}, 400));
					break;
				case "ended": J === "playing" ? ended() : stopTimer();
			}
			else x === "error" && J === "playing" && (console.warn(`YouTube player error ${S} for ${U}`), ended());
		}
	}), se = {
		engine: _,
		isActive: () => H === "youtube",
		isStream: () => H === "stream",
		getActiveUrl: () => W,
		hasTimer: () => ne != null,
		uninstall() {
			stopTimer(), clearPauseCheck(), oe(), ae?.abort(), I.removeEventListener("error", onStreamError, !0), F.loadUrl = L.loadUrl, F.play = L.play, F.pause = L.pause, F.stop = L.stop, F.seekToTime = L.seekToTime, F.getDuration = L.getDuration, F.getTimeElapsed = L.getTimeElapsed, O.setVolume = L.setVolume, O.loadFromUrl = L.loadFromUrl, F.__youtubeInstalled = !1, F.__youtubeSource = null, H = null;
		}
	};
	return F.__youtubeSource = se, se;
}
//#endregion
//#region src/lacitis/meta.js
var Kx = /^(?:worldstar(?:hiphop)?|wshh|lyrical lemonade|trap nation|chill nation|rap nation|wave music|cloudkid|7clouds|proximity|majestic casual|mrsuicidesheep|selected|various artists)$/i;
function cleanMusicMeta(m, _ = "") {
	let x = String(m || "").replace(/\s+/g, " ").trim(), S = String(_ || "").replace(/\s+/g, " ").trim(), C = x, D = /VEVO\s*$/i.test(S), O = S.replace(/\s+-\s+Topic\s*$/i, "").replace(/\s*VEVO\s*$/i, "").trim();
	D && !/\s/.test(O) && (O = O.replace(/([a-zāčēģīķļņšūž])([A-ZĀČĒĢĪĶĻŅŠŪŽ])/g, "$1 $2")), C = C.replace(/\b(?:official(?:\s+music)?\s+video|music\s+video|official\s+audio|lyrics?\s+video|visuali[sz]er)\b/gi, " "), C = C.replace(/\s*[[(][^\])]{0,180}(?:official|music\s+video|lyrics?|visuali[sz]er|wshh\s+exclusive|audio\s+only|premiere|\b(?:audio|video|4k|hd|hq)\b)[^\])]{0,180}[\])]\s*/gi, " "), C = C.replace(/\s*(?:[-–—|•]\s*)?(?:official(?:\s+music)?\s+(?:video|audio)|music\s+video|official\s+(?:video|audio)|lyrics?(?:\s+video)?|visuali[sz]er|wshh\s+exclusive|audio\s+only|premiere|\b(?:4k|hd|hq)\b)\s*$/gi, " "), C = C.replace(/\s*[[(]\s*[\])]\s*/g, " "), C = C.replace(/\s+(?:featuring|ft\.?|feat\.?)\s+([^()[\]]+)$/i, " (feat. $1)"), C = C.replace(/\s+/g, " ").trim();
	let F = C.match(/^(.{2,80}?)\s+["“”]([^"“”]{1,180})["“”](?:\s|$)/);
	if (F) O = F[1].trim(), C = F[2].trim();
	else {
		let m = C.match(/^(.{2,90}?)\s*\|\s*(.{1,200})$/), _ = m || C.match(/^(.{2,90}?)\s+[-–—]\s+(.{1,200})$/);
		if (_) {
			let x = _[1].trim();
			C = _[2].trim(), (m || !O || Kx.test(O) || O.toLowerCase().includes(x.toLowerCase())) && (O = x);
		}
	}
	if (C = C.replace(/\s*[[(]\s*[\])]\s*$/, "").replace(/^[\s"“”]+|[\s"“”]+$/g, "").replace(/\s+/g, " ").trim(), Kx.test(O)) {
		let m = x.match(/^(.{2,90}?)\s+[-–—]\s+/);
		m && (O = m[1].trim());
	}
	return /^(?:unknown|unknown artist|nezināms)$/i.test(O) && (O = "Nezināms izpildītājs"), {
		title: C || x || "Nezināma dziesma",
		artist: O || S
	};
}
function parseDuration(m) {
	if (typeof m == "number") return m;
	let _ = String(m || "").split(":").map(Number).filter((m) => Number.isFinite(m));
	return _.length === 3 ? _[0] * 3600 + _[1] * 60 + _[2] : _.length === 2 ? _[0] * 60 + _[1] : _.length === 1 && _[0] || 0;
}
var thumbnailFor = (m, _ = "mqdefault") => `https://i.ytimg.com/vi/${m}/${_}.jpg`;
function trackIdentity(m, _) {
	let clean = (m) => String(m || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), x = clean(m), S = clean(_);
	return x && S ? `${x}\u0000${S}` : "";
}
//#endregion
//#region src/lacitis/search.js
var qx = "https://lacitis-api.gamernr1elite.workers.dev", Jx = [
	"https://invidious.schenkel.eti.br",
	"https://yt.omada.cafe",
	"https://echostreamz.com"
], Yx = /\b(?:reaction|interview|review|behind\s+the\s+scenes|tutorial)\b/i, Xx = /* @__PURE__ */ new Map(), Zx = 48;
function withTimeout$1(m, _) {
	let x = new AbortController(), S = setTimeout(() => x.abort(), m), onAbort = () => x.abort();
	return _?.addEventListener("abort", onAbort, { once: !0 }), {
		signal: x.signal,
		done: () => {
			clearTimeout(S), _?.removeEventListener("abort", onAbort);
		}
	};
}
_(withTimeout$1, "withTimeout");
function toMusicRow({ id: m, title: _, author: x, lengthSeconds: S = 0, thumbnail: C = "" }) {
	let D = cleanMusicMeta(_, x), O = `youtube:${m}`, F = C || thumbnailFor(m);
	return {
		source: "youtube",
		url: O,
		youtubeId: m,
		title: D.title,
		artist: D.artist,
		originalTitle: _,
		genre: D.artist,
		tags: D.artist ? [D.artist] : [],
		codec: "Lācītis",
		bitrate: 0,
		duration: S || 0,
		favicon: F,
		logo: F,
		homepage: `https://www.youtube.com/watch?v=${m}`,
		https: !0
	};
}
async function searchMusic(m, { signal: _, api: x = qx, fallbacks: S = Jx } = {}) {
	let C = String(m || "").trim();
	if (!C) return [];
	let D = C.toLocaleLowerCase("lv-LV");
	if (Xx.has(D)) return Xx.get(D);
	let O = Yx.test(C), F = [
		{
			url: `${x}/search?q=${encodeURIComponent(C)}&f=song`,
			kind: "lacitis"
		},
		{
			url: `${x}/search?q=${encodeURIComponent(C)}&f=relevance`,
			kind: "lacitis"
		},
		...S.map((m) => ({
			url: `${m}/api/v1/search?q=${encodeURIComponent(C)}&type=video`,
			kind: "invidious"
		}))
	];
	for (let m of F) {
		let x = withTimeout$1(5e3, _);
		try {
			let _ = await fetch(m.url, {
				headers: { Accept: "application/json" },
				signal: x.signal
			});
			if (!_.ok) throw Error(`HTTP ${_.status}`);
			let S = await _.json();
			if (!Array.isArray(S)) throw Error("Invalid response");
			let C = /* @__PURE__ */ new Set(), F = /* @__PURE__ */ new Set(), I = [];
			for (let _ of S) {
				let x = m.kind === "invidious" ? _.videoId : _.id;
				if (!x || C.has(x)) continue;
				let S = typeof _.lengthSeconds == "number" ? _.lengthSeconds : parseDuration(_.duration);
				if (S && S <= 30 || !O && Yx.test(_.title || "")) continue;
				let D = toMusicRow({
					id: x,
					title: _.title || "Nezināma dziesma",
					author: _.author || "",
					lengthSeconds: S
				}), L = trackIdentity(D.artist, D.title);
				L && F.has(L) || (C.add(x), L && F.add(L), I.push(D));
			}
			if (!I.length) throw Error("No usable results");
			return Xx.set(D, I), Xx.size > Zx && Xx.delete(Xx.keys().next().value), I;
		} catch (x) {
			if (_?.aborted) throw x;
			console.warn("Lācītis search:", m.url, x?.message);
		} finally {
			x.done();
		}
	}
	throw Error("Meklēšana neizdevās. Pamēģini vēlreiz.");
}
var Qx = 432e5;
async function fetchPlaylist(m, { signal: _, api: x = qx, fallbacks: S = Jx } = {}) {
	let C = `webamp.lacitis.playlist.v1:${m}`;
	try {
		let m = JSON.parse(localStorage.getItem(C) || "null");
		if (m && Date.now() - m.at < Qx && Array.isArray(m.rows) && m.rows.length) return m;
	} catch {}
	let D = [...S.slice(0, 2).map((_) => ({
		url: `${_}/api/v1/playlists/${encodeURIComponent(m)}`,
		kind: "invidious"
	})), {
		url: `${x}/playlist?id=${encodeURIComponent(m)}&all=true`,
		kind: "lacitis"
	}];
	for (let m of D) {
		let x = withTimeout$1(8e3, _);
		try {
			let _ = await fetch(m.url, {
				headers: { Accept: "application/json" },
				signal: x.signal
			});
			if (!_.ok) throw Error(`HTTP ${_.status}`);
			let S = await _.json(), D = m.kind === "lacitis" ? S?.items : S?.videos;
			if (!Array.isArray(D) || !D.length) throw Error("empty");
			let O = [], F = /* @__PURE__ */ new Set();
			for (let _ of D) {
				let x = m.kind === "lacitis" ? _.id : _.videoId;
				if (!x || F.has(x)) continue;
				F.add(x);
				let S = /^youtube music$/i.test(_.author || "") ? "" : _.author || "", C = typeof _.lengthSeconds == "number" ? _.lengthSeconds : parseDuration(_.duration);
				O.push(toMusicRow({
					id: x,
					title: _.title || "Nezināma dziesma",
					author: S,
					lengthSeconds: C
				}));
			}
			let I = {
				at: Date.now(),
				name: S?.name || S?.title || "Playlist",
				rows: O
			};
			try {
				localStorage.setItem(C, JSON.stringify(I));
			} catch {}
			return I;
		} catch (x) {
			if (_?.aborted) throw x;
			console.warn("Lācītis playlist:", m.url, x?.message);
		} finally {
			x.done();
		}
	}
	return null;
}
//#endregion
//#region src/lacitis/resolver.js
var $x = [
	"https://invidious.schenkel.eti.br",
	"https://yt.omada.cafe",
	"https://invidious.kemonomimi.nl"
], tS = "webamp.lacitis.instance.v1", nS = /* @__PURE__ */ new Map(), rS = /* @__PURE__ */ new Map();
function audio() {
	return document.createElement("audio");
}
var iS = null;
function itags() {
	return iS ||= audio().canPlayType("audio/webm; codecs=\"opus\"") === "" ? [140, 139] : [
		251,
		250,
		249,
		140,
		139
	], iS;
}
function withTimeout(m, _) {
	let x = new AbortController(), S = setTimeout(() => x.abort(), m), onAbort = () => x.abort();
	return _?.addEventListener("abort", onAbort, { once: !0 }), {
		signal: x.signal,
		done: () => {
			clearTimeout(S), _?.removeEventListener("abort", onAbort);
		}
	};
}
function orderedInstances(m) {
	let _ = "";
	try {
		_ = localStorage.getItem(tS) || "";
	} catch {}
	let x = Date.now();
	return [...m].sort((m, S) => {
		let C = x - (rS.get(m) || 0) < 6e5;
		return C === x - (rS.get(S) || 0) < 6e5 ? (S === _) - (m === _) : C ? 1 : -1;
	});
}
async function probe(m, _) {
	let x = withTimeout(5e3, _);
	try {
		let _ = await fetch(m, {
			headers: { Range: "bytes=0-1" },
			signal: x.signal,
			cache: "no-store"
		});
		return _.status === 206 || _.status === 200;
	} catch {
		return !1;
	} finally {
		x.done();
	}
}
function expiresOf(m) {
	let _ = Number(new URL(m).searchParams.get("expire"));
	return Number.isFinite(_) && _ > 0 ? _ * 1e3 - 6e4 : Date.now() + 18e5;
}
async function resolveStream(m, { signal: _, instances: x = $x } = {}) {
	let S = nS.get(m);
	if (S && S.expires > Date.now()) return S;
	nS.delete(m);
	for (let S of orderedInstances(x)) {
		if (_?.aborted) return null;
		let x = withTimeout(6e3, _);
		try {
			let C = await fetch(`${S}/api/v1/videos/${encodeURIComponent(m)}?fields=adaptiveFormats,lengthSeconds`, {
				headers: { Accept: "application/json" },
				signal: x.signal
			});
			if (!C.ok) throw Error(`HTTP ${C.status}`);
			let D = await C.json(), O = (D?.adaptiveFormats || []).filter((m) => String(m.type || "").startsWith("audio") && m.url), F = new Map(O.map((m) => [Number(m.itag), m])), I = [...itags().map((m) => F.get(m)).filter(Boolean), ...O], L = /* @__PURE__ */ new Set();
			for (let x of I) {
				if (L.has(x.url)) continue;
				L.add(x.url);
				let C = `${S}/videoplayback?${new URL(x.url).search.slice(1)}`;
				if (await probe(C, _)) {
					let _ = {
						url: C,
						instance: S,
						duration: Number(D.lengthSeconds) || 0,
						expires: expiresOf(x.url)
					};
					nS.set(m, _), nS.size > 40 && nS.delete(nS.keys().next().value);
					try {
						localStorage.setItem(tS, S);
					} catch {}
					return rS.delete(S), _;
				}
				if (L.size >= 2) break;
			}
			throw Error("no playable audio");
		} catch (m) {
			if (_?.aborted) return null;
			rS.set(S, Date.now()), console.warn("Lācītis stream:", S, m?.message);
		} finally {
			x.done();
		}
	}
	return null;
}
//#endregion
//#region src/youtube/videoWindow.js
var aS = "webamp.video.window.v2", oS = {
	width: 213,
	height: 234
}, sS = /* @__PURE__ */ _((m, _, x) => {
	let S = document.createElement(m);
	return _ && (S.className = _), x != null && (S.textContent = x), S;
}, "el");
function createVideoWindow({ overlayHost: m = null, getDefaultPosition: _, onClose: x } = {}) {
	let S = sS("div", "video-overlay");
	S.hidden = !0;
	let C = sS("div", "gen-window window video-window"), D = sS("div", "gen-top draggable"), O = sS("div", "gen-top-right draggable"), F = sS("div", "gen-close winamp-active");
	F.setAttribute("role", "button"), F.setAttribute("aria-label", "Close video window"), F.tabIndex = 0, O.append(F);
	let I = sS("div", "gen-top-title draggable");
	for (let m of "VIDEO") I.append(sS("div", `draggable gen-text-letter gen-text-${m.toLowerCase()}`));
	D.append(sS("div", "gen-top-left draggable"), sS("div", "gen-top-left-fill draggable"), sS("div", "gen-top-left-end draggable"), I, sS("div", "gen-top-right-end draggable"), sS("div", "gen-top-right-fill draggable"), O);
	let L = sS("div", "gen-middle"), H = sS("div", "gen-middle-left draggable");
	H.append(sS("div", "gen-middle-left-bottom draggable"));
	let U = sS("div", "gen-middle-center"), W = sS("div", "gen-middle-right draggable");
	W.append(sS("div", "gen-middle-right-bottom draggable")), L.append(H, U, W);
	let q = sS("div", "gen-bottom");
	q.append(sS("div", "gen-bottom-left draggable"), sS("div", "gen-bottom-fill draggable"), sS("div", "gen-bottom-right draggable"));
	let ee = sS("div", "video-body"), te = sS("img", "video-thumb");
	te.alt = "", te.decoding = "async", te.loading = "lazy", te.referrerPolicy = "no-referrer", te.hidden = !0;
	let J = sS("div", "video-player");
	J.style.minWidth = "200px", J.style.minHeight = "200px", J.hidden = !0, ee.append(te, J), U.append(ee), C.append(D, L, q), S.append(C);
	let ne = "idle";
	function mount() {
		let _ = m ?? document.querySelector("#webamp");
		_ && S.parentElement !== _ ? _.append(S) : !_ && !S.parentElement && document.body.append(S);
	}
	function setSize(m, _) {
		C.style.setProperty("width", `${Math.max(oS.width, Math.round(m || 0))}px`, "important"), C.style.setProperty("height", `${Math.max(oS.height, Math.round(_ || 0))}px`, "important");
	}
	setSize(oS.width, oS.height);
	function placeWindow(m, _) {
		let x = Math.max(0, S.clientWidth - C.offsetWidth), D = Math.max(0, S.clientHeight - C.offsetHeight);
		C.style.left = `${Math.round(Math.min(Math.max(0, m), x))}px`, C.style.top = `${Math.round(Math.min(Math.max(0, _), D))}px`, C.classList.add("is-placed");
	}
	function readPosition() {
		try {
			return JSON.parse(localStorage.getItem(aS) ?? "null") ?? null;
		} catch {
			return null;
		}
	}
	function restorePosition() {
		let m = readPosition();
		if (m && Number.isFinite(m.left) && Number.isFinite(m.top)) {
			placeWindow(m.left, m.top);
			return;
		}
		let x = S.getBoundingClientRect(), D = _?.({
			width: C.offsetWidth,
			height: C.offsetHeight,
			min: oS,
			overlay: x
		});
		if (D) {
			(D.height || D.width) && setSize(D.width ?? C.offsetWidth, D.height ?? C.offsetHeight), placeWindow(D.left, D.top);
			return;
		}
		let O = document.querySelector("#playlist-window")?.getBoundingClientRect();
		O ? placeWindow(O.left - x.left, O.top - x.top - C.offsetHeight - 8) : placeWindow((x.width - C.offsetWidth) / 2, (x.height - C.offsetHeight) / 2);
	}
	let re = null, onMouseDown = (m) => {
		if (m.button !== 0 || F.contains(m.target)) return;
		m.preventDefault();
		let _ = C.getBoundingClientRect();
		re = {
			dx: m.clientX - _.left,
			dy: m.clientY - _.top
		}, C.classList.add("is-dragging");
	}, onMouseMove = (m) => {
		re && placeWindow(m.clientX - re.dx, m.clientY - re.dy);
	}, onMouseUp = () => {
		if (re) {
			re = null, C.classList.remove("is-dragging");
			try {
				localStorage.setItem(aS, JSON.stringify({
					left: C.offsetLeft,
					top: C.offsetTop
				}));
			} catch {}
		}
	}, onResize = () => {
		!S.hidden && C.classList.contains("is-placed") && placeWindow(C.offsetLeft, C.offsetTop);
	};
	D.addEventListener("mousedown", onMouseDown), D.addEventListener("dblclick", (m) => {
		F.contains(m.target) || redock();
	}), window.addEventListener("mousemove", onMouseMove), window.addEventListener("mouseup", onMouseUp), window.addEventListener("resize", onResize);
	let close = () => {
		hide(), x?.();
	};
	F.addEventListener("click", close), F.addEventListener("keydown", (m) => {
		(m.key === "Enter" || m.key === " ") && (m.preventDefault(), close());
	});
	function show() {
		mount(), S.hidden, S.hidden = !1, C.classList.contains("is-placed") || restorePosition();
	}
	function redock() {
		try {
			localStorage.removeItem(aS);
		} catch {}
		C.classList.remove("is-placed"), S.hidden || restorePosition();
	}
	function hide() {
		S.hidden = !0;
	}
	function showThumbnail(m, { force: _ = !1 } = {}) {
		(ne !== "player" || _) && (ne = "thumbnail", J.hidden = !0, m ? (te.getAttribute("src") !== m && (te.src = m), te.hidden = !1) : (te.removeAttribute("src"), te.hidden = !0));
	}
	function playerHost() {
		return ne = "player", te.hidden = !0, J.hidden = !1, show(), J;
	}
	function showIdle(m = "") {
		ne = "idle", J.hidden = !0, showThumbnail(m);
	}
	return {
		element: S,
		show,
		hide,
		redock,
		setSize,
		isVisible: () => !S.hidden,
		getMode: () => ne,
		showThumbnail,
		playerHost,
		showIdle,
		dispose() {
			window.removeEventListener("mousemove", onMouseMove), window.removeEventListener("mouseup", onMouseUp), window.removeEventListener("resize", onResize), S.remove();
		}
	};
}
//#endregion
//#region src/historyStore.js
var cS = "webamp-radio", lS = 1, fS = "webamp.radio.history.v1", mS = 200, gS = 1e3, _S = null, jS = {
	stations: [],
	songs: []
}, RS = !1, zS = /* @__PURE__ */ new Set();
function emit(m) {
	for (let _ of zS) try {
		_(m);
	} catch (m) {
		console.error(m);
	}
}
function openDb$1() {
	return _S || (_S = new Promise((m) => {
		if (!("indexedDB" in window)) {
			RS = !0, m(null);
			return;
		}
		let _;
		try {
			_ = indexedDB.open(cS, lS);
		} catch {
			RS = !0, m(null);
			return;
		}
		_.onupgradeneeded = () => {
			let m = _.result;
			m.objectStoreNames.contains("stations") || m.createObjectStore("stations", { keyPath: "url" }).createIndex("playedAt", "playedAt"), m.objectStoreNames.contains("songs") || m.createObjectStore("songs", {
				keyPath: "id",
				autoIncrement: !0
			}).createIndex("at", "at");
		}, _.onsuccess = () => {
			let x = _.result;
			x.onversionchange = () => x.close(), m(x), importLegacy(x);
		}, _.onerror = () => {
			RS = !0, m(null);
		}, _.onblocked = () => {
			RS = !0, m(null);
		};
	}), _S);
}
_(openDb$1, "openDb");
function tx(m, _, x, S) {
	return new Promise((C, D) => {
		let O = m.transaction(_, x), F = S(O.objectStore(_));
		O.oncomplete = () => C(F?.result ?? F), O.onerror = () => D(O.error), O.onabort = () => D(O.error);
	});
}
function readAllByIndex(m, _, x, S) {
	return new Promise((C, D) => {
		let O = [], F = m.transaction(_, "readonly").objectStore(_).index(x).openCursor(null, "prev");
		F.onsuccess = () => {
			let m = F.result;
			m && O.length < S ? (O.push(m.value), m.continue()) : C(O);
		}, F.onerror = () => D(F.error);
	});
}
function trim(m, _, x, S) {
	return new Promise((C) => {
		let D = m.transaction(_, "readwrite"), O = D.objectStore(_), F = O.count();
		F.onsuccess = () => {
			let m = F.result - S;
			if (m <= 0) {
				C();
				return;
			}
			let _ = O.index(x).openCursor(null, "next");
			_.onsuccess = () => {
				let x = _.result;
				x && m > 0 && (x.delete(), --m, x.continue());
			};
		}, D.oncomplete = () => C(), D.onerror = () => C();
	});
}
async function importLegacy(m) {
	let _ = [];
	try {
		_ = JSON.parse(localStorage.getItem(fS) ?? "[]") ?? [];
	} catch {
		_ = [];
	}
	if (Array.isArray(_) && _.length !== 0) try {
		await tx(m, "stations", "readwrite", (m) => {
			for (let x of _) x?.url && m.put({
				...stationRecord(x),
				playedAt: x.playedAt ?? Date.now()
			});
		}), localStorage.removeItem(fS), emit("stations");
	} catch {}
}
function stationRecord(m) {
	return {
		url: m.url,
		urls: Array.isArray(m.urls) ? m.urls : void 0,
		title: m.originalTitle ?? m.title,
		country: m.country || "",
		countryName: m.countryName || "",
		language: m.language || "",
		genre: m.genre || "",
		tags: m.tags ?? [],
		bitrate: m.bitrate || 0,
		codec: m.codec || "",
		homepage: m.homepage || "",
		favicon: m.favicon || m.logo || "",
		uuid: m.uuid || "",
		https: m.https === void 0 ? String(m.url).startsWith("https:") : m.https,
		playedAt: Date.now()
	};
}
var eC = {
	async recordStation(m) {
		if (!m?.url) return;
		let _ = stationRecord(m), x = await openDb$1();
		if (!x || RS) {
			jS.stations = [_, ...jS.stations.filter((m) => m.url !== _.url)].slice(0, mS), emit("stations");
			return;
		}
		try {
			await tx(x, "stations", "readwrite", (m) => m.put(_)), await trim(x, "stations", "playedAt", mS);
		} catch {}
		emit("stations");
	},
	async recordSong({ station: m, artist: _ = "", title: x = "", streamTitle: S = "", artwork: C = "" }) {
		let D = S || [_, x].filter(Boolean).join(" - ");
		if (!m?.url || !D) return;
		let O = {
			stationUrl: m.url,
			station: m.originalTitle ?? m.title,
			favicon: m.favicon || m.logo || "",
			artist: _,
			title: x || D,
			streamTitle: D,
			artwork: C || "",
			at: Date.now()
		}, [F] = await this.listSongs(1);
		if (F && F.stationUrl === O.stationUrl && F.streamTitle === O.streamTitle) return;
		let I = await openDb$1();
		if (!I || RS) {
			jS.songs = [O, ...jS.songs].slice(0, gS), emit("songs");
			return;
		}
		try {
			await tx(I, "songs", "readwrite", (m) => m.add(O)), await trim(I, "songs", "at", gS);
		} catch {}
		emit("songs");
	},
	async listStations(m = mS) {
		let _ = await openDb$1();
		if (!_ || RS) return jS.stations.slice(0, m);
		try {
			return await readAllByIndex(_, "stations", "playedAt", m);
		} catch {
			return [];
		}
	},
	async listSongs(m = gS) {
		let _ = await openDb$1();
		if (!_ || RS) return jS.songs.slice(0, m);
		try {
			return await readAllByIndex(_, "songs", "at", m);
		} catch {
			return [];
		}
	},
	async clear(m = "all") {
		let _ = await openDb$1(), x = m === "all" ? ["stations", "songs"] : [m];
		for (let m of x) {
			if (!_ || RS) jS[m] = [];
			else try {
				await tx(_, m, "readwrite", (m) => m.clear());
			} catch {}
			emit(m);
		}
	},
	subscribe(m) {
		return zS.add(m), () => zS.delete(m);
	}
}, tC = [
	{
		name: "Classical",
		hz60: 33,
		hz170: 33,
		hz310: 33,
		hz600: 33,
		hz1000: 33,
		hz3000: 33,
		hz6000: 20,
		hz12000: 20,
		hz14000: 20,
		hz16000: 16,
		preamp: 33
	},
	{
		name: "Club",
		hz60: 33,
		hz170: 33,
		hz310: 38,
		hz600: 42,
		hz1000: 42,
		hz3000: 42,
		hz6000: 38,
		hz12000: 33,
		hz14000: 33,
		hz16000: 33,
		preamp: 33
	},
	{
		name: "Dance",
		hz60: 48,
		hz170: 44,
		hz310: 36,
		hz600: 32,
		hz1000: 32,
		hz3000: 22,
		hz6000: 20,
		hz12000: 20,
		hz14000: 32,
		hz16000: 32,
		preamp: 33
	},
	{
		name: "Laptop speakers/headphones",
		hz60: 40,
		hz170: 50,
		hz310: 41,
		hz600: 26,
		hz1000: 28,
		hz3000: 35,
		hz6000: 40,
		hz12000: 48,
		hz14000: 53,
		hz16000: 56,
		preamp: 33
	},
	{
		name: "Large hall",
		hz60: 49,
		hz170: 49,
		hz310: 42,
		hz600: 42,
		hz1000: 33,
		hz3000: 24,
		hz6000: 24,
		hz12000: 24,
		hz14000: 33,
		hz16000: 33,
		preamp: 33
	},
	{
		name: "Party",
		hz60: 44,
		hz170: 44,
		hz310: 33,
		hz600: 33,
		hz1000: 33,
		hz3000: 33,
		hz6000: 33,
		hz12000: 33,
		hz14000: 44,
		hz16000: 44,
		preamp: 33
	},
	{
		name: "Pop",
		hz60: 29,
		hz170: 40,
		hz310: 44,
		hz600: 45,
		hz1000: 41,
		hz3000: 30,
		hz6000: 28,
		hz12000: 28,
		hz14000: 29,
		hz16000: 29,
		preamp: 33
	},
	{
		name: "Reggae",
		hz60: 33,
		hz170: 33,
		hz310: 31,
		hz600: 22,
		hz1000: 33,
		hz3000: 43,
		hz6000: 43,
		hz12000: 33,
		hz14000: 33,
		hz16000: 33,
		preamp: 33
	},
	{
		name: "Rock",
		hz60: 45,
		hz170: 40,
		hz310: 23,
		hz600: 19,
		hz1000: 26,
		hz3000: 39,
		hz6000: 47,
		hz12000: 50,
		hz14000: 50,
		hz16000: 50,
		preamp: 33
	},
	{
		name: "Soft",
		hz60: 40,
		hz170: 35,
		hz310: 30,
		hz600: 28,
		hz1000: 30,
		hz3000: 39,
		hz6000: 46,
		hz12000: 48,
		hz14000: 50,
		hz16000: 52,
		preamp: 33
	},
	{
		name: "Ska",
		hz60: 28,
		hz170: 24,
		hz310: 25,
		hz600: 31,
		hz1000: 39,
		hz3000: 42,
		hz6000: 47,
		hz12000: 48,
		hz14000: 50,
		hz16000: 48,
		preamp: 33
	},
	{
		name: "Full Bass",
		hz60: 48,
		hz170: 48,
		hz310: 48,
		hz600: 42,
		hz1000: 35,
		hz3000: 25,
		hz6000: 18,
		hz12000: 15,
		hz14000: 14,
		hz16000: 14,
		preamp: 33
	},
	{
		name: "Soft Rock",
		hz60: 39,
		hz170: 39,
		hz310: 36,
		hz600: 31,
		hz1000: 25,
		hz3000: 23,
		hz6000: 26,
		hz12000: 31,
		hz14000: 37,
		hz16000: 47,
		preamp: 33
	},
	{
		name: "Full Treble",
		hz60: 16,
		hz170: 16,
		hz310: 16,
		hz600: 25,
		hz1000: 37,
		hz3000: 50,
		hz6000: 58,
		hz12000: 58,
		hz14000: 58,
		hz16000: 60,
		preamp: 33
	},
	{
		name: "Full Bass & Treble",
		hz60: 44,
		hz170: 42,
		hz310: 33,
		hz600: 20,
		hz1000: 24,
		hz3000: 35,
		hz6000: 46,
		hz12000: 50,
		hz14000: 52,
		hz16000: 52,
		preamp: 33
	},
	{
		name: "Live",
		hz60: 24,
		hz170: 33,
		hz310: 39,
		hz600: 41,
		hz1000: 42,
		hz3000: 42,
		hz6000: 39,
		hz12000: 37,
		hz14000: 37,
		hz16000: 36,
		preamp: 33
	},
	{
		name: "Techno",
		hz60: 45,
		hz170: 42,
		hz310: 33,
		hz600: 23,
		hz1000: 24,
		hz3000: 33,
		hz6000: 45,
		hz12000: 48,
		hz14000: 48,
		hz16000: 47,
		preamp: 33
	},
	{
		name: "Flat",
		hz60: 33,
		hz170: 33,
		hz310: 33,
		hz600: 33,
		hz1000: 33,
		hz3000: 33,
		hz6000: 33,
		hz12000: 33,
		hz14000: 33,
		hz16000: 33,
		preamp: 33
	},
	{
		name: "Preamp +12dB (Flat)",
		hz60: 33,
		hz170: 33,
		hz310: 33,
		hz600: 33,
		hz1000: 33,
		hz3000: 33,
		hz6000: 33,
		hz12000: 33,
		hz14000: 33,
		hz16000: 33,
		preamp: 64
	},
	{
		name: "Preamp -12dB (Flat)",
		hz60: 33,
		hz170: 33,
		hz310: 33,
		hz600: 33,
		hz1000: 33,
		hz3000: 33,
		hz6000: 33,
		hz12000: 33,
		hz14000: 33,
		hz16000: 33,
		preamp: 1
	}
], nC = "webamp.eq.auto.v1", rC = [
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
], iC = 50, aC = [
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
function presetForGenres(m) {
	let _ = m.filter(Boolean).join(" ");
	for (let [m, x] of aC) if (m.test(_)) return tC.find((m) => m.name === x) ?? null;
	return null;
}
function createEqAuto({ webamp: m, onApplied: _ }) {
	let x = !1;
	try {
		x = localStorage.getItem(nC) === "1";
	} catch {}
	function setEnabled(_) {
		x = _, m.store.dispatch({
			type: "SET_EQ_AUTO",
			value: _
		});
		try {
			localStorage.setItem(nC, _ ? "1" : "0");
		} catch {}
		_ && applyForCurrentTrack();
	}
	let toStore = (m) => Math.round((m - 1) / 63 * 100);
	function applyPreset(x) {
		for (let _ of rC) m.store.dispatch({
			type: "SET_BAND_VALUE",
			band: _,
			value: x ? toStore(x[`hz${_}`]) : iC
		});
		m.store.dispatch({
			type: "SET_BAND_VALUE",
			band: "preamp",
			value: x ? toStore(x.preamp) : iC
		}), m.store.getState().equalizer.on || m.store.dispatch({ type: "SET_EQ_ON" }), _?.(x);
	}
	function applyForCurrentTrack() {
		if (!x) return;
		let _ = m.store.getState(), C = _.playlist.currentTrack, D = C == null ? null : _.tracks[C];
		if (!D) return;
		let O = S(D.url);
		applyPreset(presetForGenres(O ? [
			O.genre,
			...O.tags ?? [],
			O.title
		] : [
			D.title,
			D.artist,
			D.album
		]));
	}
	return document.addEventListener("click", (m) => {
		m.target instanceof Element && m.target.closest("#equalizer-window #auto") && (m.preventDefault(), m.stopImmediatePropagation(), setEnabled(!x));
	}, !0), m.onTrackDidChange(() => applyForCurrentTrack()), x && m.store.dispatch({
		type: "SET_EQ_AUTO",
		value: !0
	}), {
		isEnabled: () => x,
		setEnabled,
		apply: applyForCurrentTrack
	};
}
//#endregion
//#region src/hls.js
var isHlsUrl = (m) => /\.m3u8(?:[?#]|$)|\.isml\//i.test(String(m ?? "")), oC = null;
function loadHls() {
	return window.Hls ? Promise.resolve(window.Hls) : (oC ||= import("./chunks/hls-Dmf4JSVg.js").then((m) => m.default ?? m.Hls ?? m).catch((m) => {
		throw oC = null, m;
	}), oC);
}
function installHlsSupport(m, { onMetadata: _ } = {}) {
	let x = m.media?._source, S = x?._audio;
	if (!x || !S || x.__hlsInstalled) return;
	x.__hlsInstalled = !0;
	let C = x.loadUrl.bind(x), D = x.seekToTime.bind(x), O = !!S.canPlayType("application/vnd.apple.mpegurl"), F = null, dropHls = () => {
		F &&= (F.destroy(), null);
	};
	x.__dropHls = dropHls, x.loadUrl = async (m) => {
		if (dropHls(), !isHlsUrl(m) || O) return C(m);
		let x;
		try {
			x = await loadHls();
		} catch {
			return C(m);
		}
		if (!x?.isSupported()) return C(m);
		F = new x({
			enableWorker: !0,
			lowLatencyMode: !0,
			backBufferLength: 0
		}), _ && F.on(x.Events.FRAG_PARSING_METADATA, (m, x) => {
			for (let m of x?.samples ?? []) m?.data && _(m.data);
		}), await new Promise((_) => {
			F.once(x.Events.MANIFEST_PARSED, _), F.once(x.Events.ERROR, (m, x) => {
				x?.fatal && _();
			}), F.attachMedia(S), F.loadSource(m);
		});
	}, x.seekToTime = (m) => {
		S.duration === Infinity || F || D(m);
	};
}
//#endregion
//#region src/stations.js
var sC = [
	"stream_320",
	"stream_128",
	"stream_64",
	"url",
	"stream_hls",
	"hls"
];
function collectUrls(m) {
	let _ = [], x = [...sC.map((_) => m?.[_]), ...Array.isArray(m?.urls) ? m.urls : []];
	for (let m of x) {
		let x = String(m ?? "").trim();
		/^https?:\/\//i.test(x) && !_.includes(x) && _.push(x);
	}
	return _;
}
function pickUrl(m) {
	return collectUrls(m)[0] ?? "";
}
function bitrateFromKeys(m, _) {
	return Number(m?.bitrate) > 0 ? Number(m.bitrate) : _ && _ === String(m?.stream_320 ?? "").trim() ? 320 : _ && _ === String(m?.stream_128 ?? "").trim() ? 128 : _ && _ === String(m?.stream_64 ?? "").trim() ? 64 : 0;
}
var cC = {
	radiorecord: {
		genre: "Radio Record",
		country: "RU"
	},
	record: {
		genre: "Radio Record",
		country: "RU"
	},
	latvija: {
		genre: "Latvija",
		country: "LV"
	},
	world: {
		genre: "World",
		country: ""
	},
	featured: {
		genre: "Featured",
		country: ""
	}
};
function fromMinkaStation(m) {
	if (!m || m.group === "separator") return null;
	let _ = pickUrl(m), x = String(m.title ?? "").trim();
	if (!_ || !x) return null;
	let S = String(m.group ?? "").toLowerCase(), C = cC[S] ?? {
		genre: S ? S[0].toUpperCase() + S.slice(1) : "",
		country: ""
	}, D = [C.genre, ...Array.isArray(m.tags) ? m.tags : String(m.genre ?? "").split(",").map((m) => m.trim())].filter(Boolean), O = String(m.codec ?? "").trim() || (/\.m3u8/i.test(_) ? "HLS" : "");
	return {
		title: x,
		url: _,
		urls: collectUrls(m),
		group: S,
		hostKey: String(m.catalogKey ?? "") || (S === "latvija" ? "lv:" : "record:") + x.normalize("NFC").toLocaleLowerCase("lv-LV"),
		country: String(m.country ?? C.country ?? "").toUpperCase().slice(0, 2),
		genre: D[0] ?? "",
		tags: D,
		bitrate: bitrateFromKeys(m, _),
		codec: O === "HLS" ? "" : O,
		homepage: String(m.homepage ?? m.site ?? ""),
		note: String(m.note ?? m.description ?? ""),
		logo: String(m.logo ?? m.image ?? m.cover ?? ""),
		favicon: String(m.favicon ?? m.logo ?? m.image ?? m.cover ?? ""),
		https: _.startsWith("https:"),
		source: "host"
	};
}
function normalizeStations(m) {
	let _ = Array.isArray(m) ? m : [], x = [], S = /* @__PURE__ */ new Set();
	for (let m of _) {
		let _ = m && [
			"group",
			"hls",
			"stream_128",
			"stream_320",
			"stream_64",
			"stream_hls",
			"prefix"
		].some((_) => _ in m), C = m && !_ && typeof m.url == "string" ? {
			...m,
			tags: m.tags ?? (m.genre ? [m.genre] : []),
			https: m.https ?? m.url.startsWith("https:"),
			urls: Array.isArray(m.urls) && m.urls.length ? m.urls : [m.url]
		} : fromMinkaStation(m);
		C && C.url && !S.has(C.url) && (S.add(C.url), x.push(C));
	}
	return x;
}
//#endregion
//#region src/resize.js
var lC = [
	"#playlist-resize-target",
	"#gen-resize-target",
	"[id$='-resize-target']"
].join(","), uC = "\n  /* The grips are painted by the skin; make their intent obvious. */\n  #playlist-resize-target,\n  #gen-resize-target {\n    position: relative;\n    z-index: 1;\n  }\n";
function attachGrip(m) {
	return m.dataset.resizeReady !== "1" && (m.dataset.resizeReady = "1", m.addEventListener("pointerdown", (m) => {
		m.stopPropagation();
	}, !0), m.addEventListener("touchstart", (m) => {
		m.stopPropagation();
	}, {
		capture: !0,
		passive: !0
	}), !0);
}
function scan() {
	let m = 0;
	for (let _ of document.querySelectorAll(lC)) attachGrip(_) && (m += 1);
	return m;
}
function initResize(m = document.body) {
	let _ = !1;
	new MutationObserver(() => {
		_ || (_ = !0, requestAnimationFrame(() => {
			_ = !1, scan();
		}));
	}).observe(m, {
		childList: !0,
		subtree: !0
	}), scan();
	let x = document.createElement("style");
	return x.textContent = uC, document.head.append(x), { scan };
}
//#endregion
//#region src/skins.js
var dC = "https://skins.webamp.org/graphql", fC = "https://r2.webampskins.org", pC = "\n  query Browse($first: Int!, $offset: Int!, $sort: SkinsSortOption) {\n    skins(first: $first, offset: $offset, sort: $sort) {\n      count\n      nodes { md5 filename download_url screenshot_url webamp_url nsfw }\n    }\n  }\n", mC = "\n  query Search($query: String!, $first: Int!, $offset: Int!) {\n    search_classic_skins(query: $query, first: $first, offset: $offset) {\n      md5 filename download_url screenshot_url webamp_url nsfw\n    }\n  }\n";
function downloadUrl(m) {
	return m.download_url || `${fC}/skins/${m.md5}.wsz`;
}
function screenshotUrl(m) {
	return m.screenshot_url || `${fC}/screenshots/${m.md5}.png`;
}
function skinName(m) {
	return (m.filename || m.md5).replace(/\.(wsz|zip)$/i, "").replace(/[[\]()]/g, " ").replace(/\s+/g, " ").trim() || m.md5;
}
var hC = [{
	id: "MUSEUM",
	label: "Curated"
}, {
	id: "TWEETED",
	label: "Most shared"
}];
async function request(m, _) {
	let x = await fetch(dC, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			query: m,
			variables: _
		})
	});
	if (!x.ok) throw Error(`Skin Museum returned HTTP ${x.status}`);
	let S = await x.json();
	if (S.errors?.length) throw Error(S.errors[0].message || "Skin Museum query failed");
	return S.data;
}
async function fetchSkins({ offset: m = 0, first: _ = 24, sort: x = "MUSEUM" } = {}) {
	let S = (await request(pC, {
		first: _,
		offset: m,
		sort: x === "MUSEUM" ? null : x
	}))?.skins;
	return {
		total: S?.count ?? 0,
		items: (S?.nodes ?? []).filter((m) => !m.nsfw)
	};
}
async function searchSkins({ query: m, offset: _ = 0, first: x = 24 }) {
	return {
		total: null,
		items: ((await request(mC, {
			query: m,
			first: x,
			offset: _
		}))?.search_classic_skins ?? []).filter((m) => !m.nsfw)
	};
}
async function applySkin(m, _) {
	let x = downloadUrl(_);
	return await m.setSkinFromUrl(x), x;
}
function storeSkin(m) {
	try {
		localStorage.setItem("webamp.skin", JSON.stringify({
			md5: m.md5,
			name: skinName(m),
			url: downloadUrl(m)
		}));
	} catch {}
}
function readStoredSkin() {
	try {
		return JSON.parse(localStorage.getItem("webamp.skin") || "null");
	} catch {
		return null;
	}
}
//#endregion
//#region src/skinBrowser.js
var el = (m, _, x) => {
	let S = document.createElement(m);
	return _ && (S.className = _), x != null && (S.textContent = x), S;
};
function createSkinBrowser({ onApply: m, overlayHost: _ = null }) {
	let notifyPicked = () => {}, x = el("div", "skins-overlay");
	x.hidden = !0;
	let S = el("div", "gen-window window skins-window"), C = el("div", "gen-top draggable"), D = el("div", "gen-top-right draggable"), O = el("div", "gen-close winamp-active");
	O.setAttribute("role", "button"), O.setAttribute("aria-label", "Close skin browser"), O.tabIndex = 0, D.append(O);
	let F = el("div", "gen-top-title draggable");
	for (let m of "SKIN MUSEUM") F.append(el("div", `draggable gen-text-letter gen-text-${m === " " ? "space" : m.toLowerCase()}`));
	C.append(el("div", "gen-top-left draggable"), el("div", "gen-top-left-fill draggable"), el("div", "gen-top-left-end draggable"), F, el("div", "gen-top-right-end draggable"), el("div", "gen-top-right-fill draggable"), D);
	let I = el("div", "gen-middle"), L = el("div", "gen-middle-left draggable");
	L.append(el("div", "gen-middle-left-bottom draggable"));
	let H = el("div", "gen-middle-center"), U = el("div", "gen-middle-right draggable");
	U.append(el("div", "gen-middle-right-bottom draggable")), I.append(L, H, U);
	let W = el("div", "gen-bottom");
	W.append(el("div", "gen-bottom-left draggable"), el("div", "gen-bottom-fill draggable"), el("div", "gen-bottom-right draggable"));
	let q = el("div", "skins-body"), ee = el("div", "skins-toolbar"), te = el("input", "skins-input");
	te.type = "search", te.placeholder = "Search skins...", te.setAttribute("aria-label", "Search skins");
	let J = el("select", "skins-select");
	J.setAttribute("aria-label", "Sort skins");
	for (let m of hC) J.append(new Option(m.label, m.id));
	let ne = el("span", "skins-status", "Loading...");
	ee.append(te, J, ne);
	let re = el("div", "skins-grid"), Q = el("div", "skins-footer"), ie = el("button", "skins-button", "Prev"), ae = el("span", "skins-page"), oe = el("button", "skins-button", "Next");
	ie.type = "button", oe.type = "button", Q.append(ie, ae, oe), q.append(ee, re, Q), H.append(q), S.append(C, I, W), x.append(S);
	let se = 0, ce = 0, le = !1;
	function mount() {
		let m = _ ?? document.querySelector("#webamp");
		m && x.parentElement !== m ? m.append(x) : !m && !x.parentElement && document.body.append(x);
	}
	function tile(_) {
		let x = el("div", "skins-tile"), S = el("button", "skins-pick");
		S.type = "button", S.title = `Apply ${skinName(_)}`;
		let C = el("img", "skins-thumb");
		C.loading = "lazy", C.decoding = "async", C.alt = "", C.src = screenshotUrl(_), S.append(C);
		let D = el("span", "skins-name", skinName(_));
		return S.append(D), S.addEventListener("click", async () => {
			let S = skinName(_);
			ne.textContent = `Applying ${S}...`;
			try {
				await m(_), storeSkin(_), notifyPicked(_), ne.textContent = `${S} applied`;
				for (let m of re.querySelectorAll(".skins-tile.is-active")) m.classList.remove("is-active");
				x.classList.add("is-active");
			} catch {
				ne.textContent = `${S} is not a classic Winamp 2 skin`;
			}
		}), x.append(S), x;
	}
	async function load() {
		if (le) return;
		le = !0;
		let m = te.value.trim();
		ne.textContent = m ? "Searching..." : "Loading...";
		try {
			let _ = m ? await searchSkins({
				query: m,
				offset: se,
				first: 24
			}) : await fetchSkins({
				offset: se,
				first: 24,
				sort: J.value
			});
			if (m || (ce = _.total), re.replaceChildren(..._.items.map(tile)), m) ne.textContent = _.items.length === 0 ? `No skins match "${m}"` : `${_.items.length} result${_.items.length === 1 ? "" : "s"} for "${m}"`, ae.textContent = `page ${Math.floor(se / 24) + 1}`, ie.disabled = se === 0, oe.disabled = _.items.length < 24;
			else {
				let m = Math.floor(se / 24) + 1, _ = Math.max(1, Math.ceil(ce / 24));
				ae.textContent = `${m} / ${_}`, ne.textContent = `${ce.toLocaleString()} skins`, ie.disabled = se === 0, oe.disabled = se + 24 >= ce;
			}
			markStored(_.items);
		} catch (m) {
			ne.textContent = m?.message || "Skin Museum is unavailable";
		} finally {
			le = !1;
		}
	}
	function markStored(m) {
		let _ = readStoredSkin();
		if (!_) return;
		let x = m.findIndex((m) => m.md5 === _.md5);
		x >= 0 && re.children[x]?.classList.add("is-active");
	}
	let ue = null;
	te.addEventListener("input", () => {
		clearTimeout(ue), ue = setTimeout(() => {
			se = 0, load();
		}, 350);
	}), te.addEventListener("keydown", (m) => {
		m.key === "Enter" && (clearTimeout(ue), se = 0, load());
	}), J.addEventListener("change", () => {
		se = 0, load();
	}), ie.addEventListener("click", () => {
		se = Math.max(0, se - 24), load();
	}), oe.addEventListener("click", () => {
		se + 24 < ce && (se += 24, load());
	}), O.addEventListener("click", () => {
		x.hidden = !0;
	}), O.addEventListener("keydown", (m) => {
		(m.key === "Enter" || m.key === " ") && (x.hidden = !0);
	}), x.addEventListener("click", (m) => {
		m.target === x && (x.hidden = !0);
	}), document.addEventListener("keydown", (m) => {
		m.key === "Escape" && !x.hidden && (x.hidden = !0);
	});
	async function show() {
		mount(), x.hidden = !1, re.childElementCount === 0 && await load(), te.focus();
	}
	return {
		show,
		load,
		element: x,
		set onSkinPicked(m) {
			notifyPicked = typeof m == "function" ? m : () => {};
		},
		get downloadUrl() {
			return downloadUrl;
		}
	};
}
//#endregion
//#region src/contextMenu.js
var gC = /* @__PURE__ */ new Set(), _C = null, vC = null, yC = null;
function notify() {
	let m = document.querySelector("#webamp-context-menu ul.context-menu");
	if (m) for (let _ of gC) try {
		_(m);
	} catch (m) {
		console.error(m);
	}
}
function attachRoot() {
	let m = document.getElementById("webamp-context-menu");
	m !== yC && (_C?.disconnect(), yC = m, m && (_C = new MutationObserver(notify), _C.observe(m, {
		childList: !0,
		subtree: !0
	}), notify()));
}
function onContextMenu(m) {
	return gC.add(m), vC || (vC = new MutationObserver(attachRoot), vC.observe(document.body, { childList: !0 }), attachRoot()), () => {
		gC.delete(m), gC.size === 0 && (vC?.disconnect(), _C?.disconnect(), vC = null, _C = null, yC = null);
	};
}
//#endregion
//#region src/skinMenu.js
var bC = "webamp.skinList", xC = 12;
function readFavourites() {
	try {
		return JSON.parse(localStorage.getItem(bC) || "[]");
	} catch {
		return [];
	}
}
function writeFavourites(m) {
	try {
		localStorage.setItem(bC, JSON.stringify(m));
	} catch {}
}
function findSkinsSubmenu() {
	return [...document.querySelectorAll("#webamp-context-menu li.parent")].find((m) => /^Skins/.test(m.lastChild?.textContent?.trim() ?? "")) ?? null;
}
function installSkinMenu({ webamp: m, restore: _ = !0, onSkinChange: x, overlayHost: S = null, onLoadSkinFile: C, getSkinMode: D, onBackToClassic: O, getRecentModernSkins: F, onPickRecentModernSkin: I, onPickBuiltinModernSkin: L, getBuiltinModernSkins: H = () => [] }) {
	let U = createSkinBrowser({
		overlayHost: S,
		onApply: async (_) => {
			await applySkin(m, _), storeSkin(_), x?.({
				url: downloadUrl(_),
				name: skinName(_)
			});
		}
	});
	function dispatchSkins() {
		m.store.dispatch({
			type: "SET_AVAILABLE_SKINS",
			skins: readFavourites()
		});
	}
	U.onSkinPicked = (m) => {
		let _ = skinName(m), x = downloadUrl(m), S = readFavourites().filter((m) => m.url !== x);
		S.unshift({
			url: x,
			name: _
		}), writeFavourites(S.slice(0, xC)), dispatchSkins();
	};
	function attachSkinMenuItem() {
		let m = findSkinsSubmenu(), _ = m?.querySelector("ul");
		if (_) {
			if (!m.querySelector(".webamp-skin-museum-entry")) {
				let m = document.createElement("li");
				m.className = "webamp-skin-museum-entry", m.textContent = "Browse Skin Museum...", m.addEventListener("click", (m) => {
					m.stopPropagation(), document.body.click(), U.show();
				}), _.insertBefore(m, _.children[1] ?? null);
			}
			if (C && !m.querySelector(".webamp-skin-file-entry")) {
				let m = document.createElement("li");
				m.className = "webamp-skin-file-entry", m.textContent = "Load skin file (.wsz / .wal)...", m.addEventListener("click", (m) => {
					m.stopPropagation(), document.body.click(), C();
				}), _.insertBefore(m, _.children[2] ?? null);
			}
			if (L && !m.querySelector(".webamp-skin-builtin-entry")) {
				let x = m.querySelector(".webamp-skin-file-entry");
				for (let m of H()) {
					let S = document.createElement("li");
					S.className = "webamp-skin-builtin-entry", S.textContent = m.label, S.addEventListener("click", (_) => {
						_.stopPropagation(), document.body.click(), L(m);
					}), x ? x.after(S) : _.append(S), x = S;
				}
			}
			if (F && I && !m.querySelector(".webamp-skin-recent-entry")) {
				let x = [...m.querySelectorAll(".webamp-skin-builtin-entry")].pop() ?? m.querySelector(".webamp-skin-file-entry"), S = new Set(H().map((m) => m.label));
				for (let m of F().filter((m) => !S.has(m))) {
					let S = document.createElement("li");
					S.className = "webamp-skin-recent-entry", S.textContent = `Modern: ${m}`, S.addEventListener("click", (_) => {
						_.stopPropagation(), document.body.click(), I(m);
					}), x ? x.after(S) : _.append(S), x = S;
				}
			}
			if (O && D?.() === "modern" && !m.querySelector(".webamp-skin-classic-entry")) {
				let m = document.createElement("li");
				m.className = "webamp-skin-classic-entry", m.textContent = "Back to classic skin", m.addEventListener("click", (m) => {
					m.stopPropagation(), document.body.click(), O();
				}), _.insertBefore(m, _.children[3] ?? null);
			}
		}
	}
	let W = onContextMenu(attachSkinMenuItem);
	if (dispatchSkins(), _) {
		let _ = readStoredSkin();
		_?.url && Promise.resolve(m.setSkinFromUrl(_.url)).catch(() => {});
	}
	return {
		skinBrowser: U,
		openSkinBrowser: () => U.show(),
		setSkin: async (_, S = "") => {
			await m.setSkinFromUrl(_);
			try {
				localStorage.setItem("webamp.skin", JSON.stringify({
					md5: "",
					name: S,
					url: _
				}));
			} catch {}
			x?.({
				url: _,
				name: S
			});
		},
		favourites: readFavourites,
		dispose: () => W()
	};
}
var SC = null;
function requireJSZip() {
	return window.JSZip ? Promise.resolve(window.JSZip) : (SC ||= import("./chunks/jszip.min-Dk1X5e3d.js").then((_) => /* @__PURE__ */ m(_.default, 1)).then((m) => m.default ?? m).catch((m) => {
		throw SC = null, m;
	}), SC);
}
var requireMusicMetadata = () => Promise.reject(/* @__PURE__ */ Error("Tag reading is not bundled in the radio build"));
function detectLowSpec() {
	if (window.__mkPerfProfile?.lowSpec != null) return !!window.__mkPerfProfile.lowSpec;
	let m = navigator.hardwareConcurrency ?? 4, _ = navigator.deviceMemory ?? 4;
	return m <= 2 || _ <= 2;
}
function throttleVisualizer(m) {
	let _ = window.requestAnimationFrame.bind(window), x = /* @__PURE__ */ new WeakMap(), S = Math.max(1, Math.round(60 / m));
	return window.requestAnimationFrame = (m) => {
		let C = x.get(m);
		if (C === void 0 && (C = typeof m == "function" && /paintFrame/.test(Function.prototype.toString.call(m)), x.set(m, C)), !C) return _(m);
		let D = S, step = (x) => (--D, D <= 0 ? m(x) : _(step));
		return _(step);
	}, () => {
		window.requestAnimationFrame = _;
	};
}
function applyLowSpec(m, { visualizerFps: _ }) {
	let { store: x } = m, S = throttleVisualizer(_), C = x.dispatch, D = 0;
	return x.dispatch = (m) => {
		if (m?.type === "STEP_MARQUEE") {
			let _ = performance.now();
			if (_ - D < 1e3) return m;
			D = _;
		}
		return C(m);
	}, S;
}
function createEmitter() {
	let m = /* @__PURE__ */ new Map();
	return {
		on(_, x) {
			return m.has(_) || m.set(_, /* @__PURE__ */ new Set()), m.get(_).add(x), () => m.get(_)?.delete(x);
		},
		emit(_, x) {
			for (let S of m.get(_) ?? []) try {
				S(x);
			} catch (m) {
				console.error(m);
			}
		},
		clear() {
			m.clear();
		}
	};
}
async function createRadioPlayer(m) {
	let { host: _, layout: F = "stack", proxy: I = "auto", stations: L = [], stationsName: W = "My Stations", skins: q = !0, skinFileHooks: ee = null, availableSkins: te = readFavourites(), skinUrl: J = null, libraryTitle: ne = "MEDIA LIBRARY", getLibraryPosition: re = null, overlayHost: Q = null, getVideoPosition: ie = null, libraryNodes: ae = [
		"online",
		"featured",
		"bookmarks",
		"history",
		"songs"
	], enableHotkeys: oe = !0, extraFilePickers: se = [], artwork: ce = !0, lowSpec: le = "auto", lowSpecVisualizerFps: ue = 20, contained: de = F === "row", youtube: fe = null, lacitis: me = null } = m, he = createEmitter(), ge = normalizeStations(L), we = [
		{
			id: "latvija",
			name: "Latvijas radio",
			icon: "radio"
		},
		{
			id: "radiorecord",
			name: "Radio Record",
			icon: "radio"
		},
		{
			id: "featured",
			name: "Featured",
			icon: "star"
		}
	], groupOf = (m) => {
		let _ = String(m.group ?? "").toLowerCase();
		return _ === "record" ? "radiorecord" : _ === "world" ? "featured" : _;
	}, Ee = fe ? createYouTubeSources(fe) : null, De = null, lacitisStartRows = async () => {
		if (me?.playlistId) {
			De ??= fetchPlaylist(me.playlistId, me.api ? { api: me.api } : {}).catch(() => null);
			let m = await De;
			if (m?.rows?.length) return m.rows;
		}
		return await me?.starter?.() ?? [];
	}, Oe = me ? {
		id: "lacitis",
		name: me.name ?? "Lācītis",
		icon: "list",
		load: lacitisStartRows,
		search: (m, _) => searchMusic(m, {
			..._,
			...me.api ? { api: me.api } : {}
		})
	} : null, Ae = !!(Ee || Oe), Fe = null, Le = null, Re = null, ze = null, Ve = null;
	I !== !1 && await O(I === "auto" ? void 0 : I);
	function play(m) {
		let _ = normalizeStations([m])[0] ?? m;
		return !_ || x(_) ? (he.emit("error", {
			station: _,
			reason: H(_ ?? {}) ?? "Not playable"
		}), !1) : (Fe.setTracksToPlay(toTracks([_])), !0);
	}
	let toTracks = (m) => m[0]?.source === "youtube" ? toYouTubeTracks(m) : U(m);
	function stationStarted(m) {
		Ve = null, Le?.noteStation(m), Re?.start(m), ze?.setStation(m), eC.recordStation(m), he.emit("station", m);
	}
	async function onNowPlaying(m) {
		Ve = {
			...m,
			artwork: m.artwork || ""
		}, he.emit("nowplaying", Ve), Ge.refreshNowPlaying();
		let _ = Fe.store.getState().playlist.currentTrack;
		if (_ != null && S(Fe.store.getState().tracks[_]?.url)?.url === m.station.url && Fe.store.dispatch({
			type: "SET_MEDIA_TAGS",
			id: _,
			artist: m.artist,
			title: m.title,
			album: m.station.originalTitle ?? m.station.title,
			albumArtUrl: m.artwork || null,
			bitrate: m.station.bitrate ? m.station.bitrate * 1e3 : void 0,
			sampleRate: void 0,
			numberOfChannels: void 0
		}), ze?.setNowPlaying({
			artist: m.artist,
			title: m.title,
			artwork: m.artwork || ""
		}), eC.recordSong({
			station: m.station,
			artist: m.artist,
			title: m.title,
			streamTitle: m.streamTitle
		}), ce && !m.artwork) {
			let _ = await resolveArtwork(m.artist, m.title);
			if (_ && Ve?.streamTitle === m.streamTitle) {
				Ve = {
					...Ve,
					artwork: _
				}, ze?.setArtwork(_), he.emit("artwork", { ...Ve });
				let x = Fe.store.getState().playlist.currentTrack;
				x != null && S(Fe.store.getState().tracks[x]?.url)?.url === m.station.url && Fe.store.dispatch({
					type: "SET_MEDIA_TAGS",
					id: x,
					artist: m.artist,
					title: m.title,
					album: m.station.originalTitle ?? m.station.title,
					albumArtUrl: _,
					bitrate: m.station.bitrate ? m.station.bitrate * 1e3 : void 0,
					sampleRate: void 0,
					numberOfChannels: void 0
				});
			}
		}
	}
	function enqueue(m) {
		let _ = normalizeStations([m])[0] ?? m;
		if (!_ || x(_)) return !1;
		let S = Fe.store.getState().playlist.trackOrder.length;
		if (Fe.appendTracks(toTracks([_])), S === 0) {
			let m = Fe.store.getState().playlist.trackOrder[0];
			m != null && Fe.store.dispatch({
				type: "PLAY_TRACK",
				id: m
			});
		}
		return !0;
	}
	let Ge = createRadioLibrary({
		title: ne,
		onPlay: play,
		onEnqueue: enqueue,
		favorites: Dx,
		history: eC,
		getNowPlaying: () => Ve,
		getDefaultPosition: re ?? void 0,
		overlayHost: Q,
		nodes: ae,
		sources: we.map((m) => ({
			...m,
			getStations: () => ge.filter((_) => groupOf(_) === m.id)
		})),
		musicSources: [Oe, ...Ee?.sources ?? []].filter(Boolean)
	});
	Fe = new UI({
		enableHotkeys: oe,
		requireJSZip,
		requireMusicMetadata,
		filePickers: [{
			contextMenuName: "Internet radio (Media Library)...",
			requiresNetwork: !0,
			filePicker: async () => (await Ge.show(), [])
		}, ...se],
		availableSkins: te,
		...J ? { initialSkin: { url: J } } : {},
		...F === "row" ? { windowLayout: {
			main: { position: {
				top: 0,
				left: 0
			} },
			equalizer: { position: {
				top: 0,
				left: 275
			} },
			playlist: {
				position: {
					top: 0,
					left: 550
				},
				size: {
					width: 275,
					height: 116
				}
			}
		} } : {}
	}), de ? (getComputedStyle(_).position === "static" && (_.style.position = "relative"), await Fe.renderInto(_)) : await Fe.renderWhenReady(_), Re = createRadioMetadata({ onNowPlaying: (m) => void onNowPlaying(m) }), installHlsSupport(Fe, { onMetadata: (m) => Re.pushId3(m) });
	let qe = Ae ? getYouTubeEngine() : null, Je = Ae ? createVideoWindow({
		overlayHost: Q,
		getDefaultPosition: ie ?? void 0,
		onClose: () => {
			Xe?.isActive() && Fe.getMediaStatus() === "PLAYING" && Fe.pause();
		}
	}) : null, Xe = Ae ? installYouTubeSource(Fe, {
		engine: qe,
		getHost: () => Je.playerHost(),
		resolveStream: Oe && me.streams !== !1 ? resolveStream : null,
		onStreamMode: (m, _) => he.emit("streammode", {
			on: m,
			..._
		}),
		onActive: (m) => {
			m && Je.show(), m || (Je.showIdle(), Je.hide());
		}
	}) : null;
	initResize(de ? _ : document.body);
	let Qe = le === "auto" ? detectLowSpec() : !!le, $e = Qe ? applyLowSpec(Fe, { visualizerFps: ue }) : null;
	ze = createMediaSessionBridge({
		webamp: Fe,
		isLive: (m) => m.live !== !1
	}), Le = createPlaybackController({
		webamp: Fe,
		onEvent: (m) => {
			switch (m.type) {
				case "status":
					ze?.setPlaybackState(m.status), m.status === "PLAYING" ? Re?.start(m.station ?? Le.getStation()) : Re?.stop();
					break;
				case "failed": Re?.stop(), he.emit("error", {
					station: m.station,
					reason: C() ? "The stream could not be opened." : "The stream could not be opened (offline, or no CORS headers)."
				});
			}
			he.emit("playback", m);
		}
	});
	let $ = createEqAuto({
		webamp: Fe,
		onApplied: (m) => he.emit("eqpreset", m?.name ?? "Flat")
	}), et = q ? installSkinMenu({
		webamp: Fe,
		overlayHost: Q,
		restore: !J,
		onSkinChange: (m) => he.emit("skin", {
			type: "classic",
			...m
		}),
		onLoadSkinFile: ee ? () => ee.pickFile?.() : void 0,
		getSkinMode: ee ? () => ee.getMode?.() ?? "classic" : void 0,
		onBackToClassic: ee ? () => ee.showClassic?.() : void 0,
		getRecentModernSkins: ee ? () => ee.getRecent?.() ?? [] : void 0,
		onPickRecentModernSkin: ee ? (m) => ee.pickRecent?.(m) : void 0,
		onPickBuiltinModernSkin: ee ? (m) => ee.pickBuiltin?.(m) : void 0,
		getBuiltinModernSkins: ee ? () => ee.getBuiltin?.() ?? [] : void 0
	}) : null, tt = null, lt = null;
	function keepMusicTags(m) {
		let _ = m.playlist.currentTrack, x = _ == null ? null : m.tracks[_];
		if (!x || !isYouTubeUrl(x.url) || x.albumArtUrl) return;
		let C = Nx.get(x.url);
		if (!C?.id) return;
		let D = S(x.url);
		Fe.store.dispatch({
			type: "SET_MEDIA_TAGS",
			id: _,
			artist: D?.artist || x.artist || "",
			title: D?.title || x.title || "",
			album: C.channelTitle || "",
			albumArtUrl: `https://i.ytimg.com/vi/${C.id}/hqdefault.jpg`,
			bitrate: void 0,
			sampleRate: void 0,
			numberOfChannels: void 0
		});
	}
	let mt = Fe.store.subscribe(() => {
		let m = Fe.store.getState();
		if (keepMusicTags(m), m.media.status !== tt && (tt = m.media.status, he.emit("status", tt)), m.playlist.currentTrack !== lt) {
			lt = m.playlist.currentTrack;
			let _ = lt == null ? null : m.tracks[lt], x = _ ? S(_.url) : null, C = x && x.source !== "youtube" ? x : null;
			Je && (_ && isYouTubeUrl(_.url) ? Je.showThumbnail(Nx.get(_.url)?.thumbnail ?? "", { force: m.media.status !== "PLAYING" }) : Je.getMode() !== "player" && Je.hide()), C && Le.getStation()?.url !== C.url ? stationStarted(C) : C || (Le.clearStation(), Re.stop(), ze.clear()), he.emit("track", _ ? {
				track: _,
				station: C
			} : null);
		}
	}), xt = F === "row" ? {
		main: {
			x: 0,
			y: 0
		},
		equalizer: {
			x: 275,
			y: 0
		},
		playlist: {
			x: 550,
			y: 0
		}
	} : {
		main: {
			x: 0,
			y: 0
		},
		equalizer: {
			x: 0,
			y: 116
		},
		playlist: {
			x: 0,
			y: 232
		}
	};
	return Fe.store.dispatch({
		type: "UPDATE_WINDOW_POSITIONS",
		absolute: !0,
		positions: xt
	}), Oe && lacitisStartRows().then((m) => {
		m.length > 0 && Fe.store.getState().playlist.trackOrder.length === 0 && Fe.appendTracks(toYouTubeTracks(m));
	}).catch((m) => console.warn("Lācītis playlist:", m)), Ee && Ee.loadDefault().then((m) => {
		m.length > 0 && Fe.store.getState().playlist.trackOrder.length === 0 && Fe.appendTracks(toYouTubeTracks(m));
	}).catch((m) => console.warn("Startup playlist:", m)), {
		webamp: Fe,
		library: Ge,
		eqAuto: $,
		play,
		enqueue,
		pause: () => Fe.pause(),
		resume: () => Fe.play(),
		stop: () => Fe.stop(),
		next: () => Fe.nextTrack(),
		previous: () => Fe.previousTrack(),
		setVolume: (m) => Fe.setVolume(m),
		setSkin: (m, _) => et ? et.setSkin(m, _) : Fe.setSkinFromUrl(m),
		openSkinBrowser: () => et?.openSkinBrowser(),
		skinBrowser: et?.skinBrowser ?? null,
		openLibrary: (m, _) => m ? Ge.showNode(m, _) : Ge.show(),
		closeLibrary: () => Ge.hide(),
		setStations: (m) => {
			ge = normalizeStations(m), Ge.render();
		},
		getStations: () => ge,
		getAnalyser: () => Fe.media.getAnalyser(),
		getStatus: () => Fe.getMediaStatus(),
		getCurrentStation: () => {
			let m = Fe.store.getState(), _ = m.playlist.currentTrack == null ? null : m.tracks[m.playlist.currentTrack];
			return _ ? S(_.url) : null;
		},
		hasStreamProxy: C,
		isLowSpec: () => Qe,
		favorites: Dx,
		history: eC,
		youtube: Ee,
		lacitis: Oe,
		isStreamPlayback: () => !!Xe?.isStream?.(),
		openVideoWindow: () => Je?.show(),
		closeVideoWindow: () => Je?.hide(),
		redockVideoWindow: () => Je?.redock(),
		getNowPlaying: () => Ve,
		reconnect: () => Le.reconnect(),
		getPlaybackState: () => Le.getState(),
		streamFormat: D,
		on: he.on,
		emit: he.emit,
		layoutWindows: (m = {
			x: 0,
			y: 0
		}, _ = xt) => Fe.store.dispatch({
			type: "UPDATE_WINDOW_POSITIONS",
			absolute: !0,
			positions: Object.fromEntries(Object.entries(_).map(([_, x]) => [_, {
				x: x.x + m.x,
				y: x.y + m.y
			}]))
		}),
		dispose: () => {
			mt(), Xe?.uninstall(), qe?.destroy(), Je?.dispose(), $e?.(), et?.dispose(), Le.dispose(), Re.dispose(), ze.clear(), Ge.hide(), he.clear(), Fe.dispose();
		}
	};
}
//#endregion
//#region src/skinSurface.js
var CC = "webamp-radio-skins", wC = "modernSkin", TC = 8, EC = "webamp.skin.mode.v1";
async function inspectSkinArchive(m) {
	let _ = await requireJSZip(), x;
	try {
		x = await _.loadAsync(m);
	} catch {
		return {
			type: null,
			variants: [],
			zip: null
		};
	}
	let S = Object.keys(x.files).filter((m) => !x.files[m].dir), roots = (m) => S.filter((_) => m.test(_.toLowerCase())).map((m) => m.slice(0, m.length - m.split("/").pop().length)).sort((m, _) => m.split("/").length - _.split("/").length || m.localeCompare(_)), C = roots(/(^|\/)skin\.xml$/), D = roots(/(^|\/)main\.bmp$/), O = C.length ? C : D;
	if (!O.length) {
		let m = S.filter((m) => /\.(wal|wsz)$/i.test(m));
		if (m.length) return {
			type: /\.wal$/i.test(m[0]) ? "modern" : "classic",
			variants: m.map((m) => ({
				path: m,
				name: m.split("/").pop().replace(/\.(wal|wsz)$/i, ""),
				nested: !0
			})),
			zip: x
		};
	}
	return {
		type: C.length ? "modern" : D.length ? "classic" : null,
		variants: O.map((m) => ({
			path: m,
			name: m ? m.replace(/\/$/, "").split("/").pop() : ""
		})),
		zip: x
	};
}
async function repackFolder(m, _) {
	let x = new (await (requireJSZip()))(), S = [];
	m.folder(_).forEach((m, _) => {
		_.dir || S.push([m, _]);
	});
	for (let [m, _] of S) x.file(m, await _.async("uint8array"));
	return x.generateAsync({ type: "blob" });
}
function openDb() {
	return new Promise((m, _) => {
		let x = indexedDB.open(CC, 1);
		x.onupgradeneeded = () => {
			let m = x.result;
			m.objectStoreNames.contains(wC) || m.createObjectStore(wC);
		}, x.onsuccess = () => m(x.result), x.onerror = () => _(x.error), x.onblocked = () => _(/* @__PURE__ */ Error("skin store blocked"));
	});
}
function skinLabel(m, _) {
	return _ ? _.replace(/\/$/, "").split("/").pop() : (m.name || "skin").replace(/\.(wal|zip)$/i, "");
}
async function storeModernSkin(m, _ = "") {
	try {
		let x = await openDb(), S = skinLabel(m, _), C = {
			file: m,
			skinRoot: _,
			name: m.name,
			label: S,
			at: Date.now()
		};
		await new Promise((m, _) => {
			let D = x.transaction(wC, "readwrite"), O = D.objectStore(wC);
			O.put(C, "current"), O.put(C, `recent:${S}`), D.oncomplete = m, D.onerror = () => _(D.error);
		});
		let D = await readRecentModernSkins();
		D.length > TC && await new Promise((m) => {
			let _ = x.transaction(wC, "readwrite");
			for (let m of D.slice(TC)) _.objectStore(wC).delete(`recent:${m.label}`);
			_.oncomplete = m, _.onerror = m;
		}), x.close();
	} catch {}
}
async function readRecentModernSkins() {
	try {
		let m = await openDb(), _ = await new Promise((_, x) => {
			let S = [], C = m.transaction(wC, "readonly").objectStore(wC).openCursor();
			C.onsuccess = () => {
				let m = C.result;
				if (!m) return _(S);
				String(m.key).startsWith("recent:") && S.push(m.value), m.continue();
			}, C.onerror = () => x(C.error);
		});
		return m.close(), _.sort((m, _) => (_.at || 0) - (m.at || 0));
	} catch {
		return [];
	}
}
async function readModernSkin() {
	try {
		let m = await openDb(), _ = await new Promise((_, x) => {
			let S = m.transaction(wC, "readonly").objectStore(wC).get("current");
			S.onsuccess = () => _(S.result ?? null), S.onerror = () => x(S.error);
		});
		return m.close(), _?.file ? {
			file: _.file,
			skinRoot: _.skinRoot || ""
		} : null;
	} catch {
		return null;
	}
}
function defaultChooseVariant(m) {
	let _ = window.prompt(`This archive holds several skins:\n${m.map((m, _) => `${_ + 1}. ${m}`).join("\n")}\n\nWhich one? (1-${m.length})`, "1");
	if (_ == null) return null;
	let x = Number.parseInt(_, 10) - 1;
	return Number.isInteger(x) && x >= 0 && x < m.length ? x : 0;
}
function readMode() {
	try {
		return localStorage.getItem(EC) || "classic";
	} catch {
		return "classic";
	}
}
function writeMode(m) {
	try {
		localStorage.setItem(EC, m);
	} catch {}
}
function createSkinSurface({ webamp: m, dock: _, classicStage: x, library: S, openSkinBrowser: C, getBox: D, seedTracks: O, defaultModern: F = null, modernAssetsBase: I = void 0, modernPrivateDefaults: L = void 0, switchButton: H = !0, barHeight: U = { max: "70vh" }, getStationInfo: W = null, emit: q = () => {} }) {
	let ee = null, te = null, J = null, ne = [], refreshRecent = () => readRecentModernSkins().then((m) => {
		ne = m;
	});
	refreshRecent();
	let re = null;
	H && (re = document.createElement("button"), re.type = "button", re.className = "webamp-dock-switch", re.title = "Switch between the classic and the Modern skin (right-click: Skins menu)", re.addEventListener("click", (m) => {
		m.stopPropagation(), toggle().catch((m) => q("error", { reason: m?.message ?? String(m) }));
	}), re.addEventListener("contextmenu", (m) => {
		m.preventDefault(), m.stopPropagation(), openClassicMenu(m.clientX, m.clientY);
	}), _.append(re));
	function updateSwitch() {
		re && (re.textContent = ee ? "CLASSIC" : "MODERN", re.setAttribute("aria-label", ee ? "Switch to the classic skin" : "Switch to the Modern skin"));
	}
	updateSwitch();
	function ensureModernHost() {
		return te || (te = document.createElement("div"), te.className = "webamp-dock-modern", _.append(te)), te;
	}
	function onAction(m, _) {
		let x = (_ || "").toLowerCase();
		return m === "toggle" && (x === "guid:ml" || x === "guid:{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}" || x === "ml") ? (S.isVisible() ? S.hide() : S.show(), !0) : m === "eject" ? (S.show(), !0) : m === "sysmenu" || m === "controlmenu" || m === "menu" && !_ ? (openClassicMenu(), !0) : m === "menu" && x === "presets" && (openClassicPresets(), !0);
	}
	let Q = null, ie = onContextMenu((m) => {
		if (!Q) return;
		let _ = m.parentElement;
		if (!_) return;
		let { x, y: S } = Q;
		Q = null, _.style.position = "fixed";
		let C = m.getBoundingClientRect();
		_.style.left = `${Math.max(0, Math.min(x, window.innerWidth - C.width - 4))}px`, _.style.top = `${Math.max(0, Math.min(S, window.innerHeight - C.height - 4))}px`;
	});
	function openClassicPresets(m = ae.x, _ = ae.y) {
		let S = x.querySelector("#equalizer-window #presets");
		S && (Q = {
			x: m,
			y: _
		}, S.click());
	}
	function holdWindow(m) {
		if (m === "ml") {
			let m = document.createElement("div");
			return S.embedInto(m), m;
		}
		return null;
	}
	function releaseWindow() {
		S.isEmbedded() && S.unembed();
	}
	function isActionActive(m, _) {
		let x = (_ || "").toLowerCase();
		return m === "toggle" && (x === "guid:ml" || x === "ml") ? S.isVisible() : null;
	}
	let ae = {
		x: 0,
		y: 0
	}, trackPointer = (m) => {
		ae = {
			x: m.clientX,
			y: m.clientY
		};
	};
	function openClassicMenu(m = ae.x, _ = ae.y) {
		(x.querySelector("#main-window") ?? x).dispatchEvent(new MouseEvent("contextmenu", {
			bubbles: !0,
			cancelable: !0,
			clientX: m,
			clientY: _,
			button: 2
		}));
	}
	let maxBarPx = () => {
		let m = U?.max;
		if (m == null) return 0;
		if (typeof m == "number") return m;
		let _ = /^([\d.]+)(vh|px)$/.exec(String(m).trim());
		return _ ? _[2] === "vh" ? Number(_[1]) / 100 * window.innerHeight : Number(_[1]) : 0;
	}, oe = null, potentialBox = () => {
		let m = D();
		return {
			width: m.width,
			height: Math.max(m.height, maxBarPx())
		};
	};
	function applyBarHeight() {
		if (!ee) return;
		oe ??= (_.style.height = "", _.clientHeight);
		let m = Math.min(maxBarPx() || 0, ee.bounds.height), x = Math.max(oe, Math.round(m));
		_.style.height = x > oe ? `${x}px` : "";
	}
	function resetBarHeight() {
		_.style.height = "", oe = null;
	}
	let se = !1;
	function fit() {
		if (ee && !se) {
			se = !0;
			try {
				let m = ee.arrange();
				applyBarHeight();
				let _ = D();
				if (!m.width || !m.height) return;
				let x = Math.min(_.width / m.width, _.height / m.height), S = x >= 1 ? Math.min(2, Math.floor(x + .01)) : x;
				te.style.zoom = S === 1 ? "" : String(S);
				let C = Math.round(m.width * S), O = Math.round(m.height * S);
				te.style.left = `${Math.max(0, Math.round((_.width - C) / 2))}px`, te.style.top = `${Math.max(0, Math.round((_.height - O) / 2))}px`, q("layout", {
					mode: "modern",
					width: C,
					height: O,
					scale: S
				});
			} finally {
				se = !1;
			}
		}
	}
	let ce = null;
	function watchSkinSize() {
		if (ce?.disconnect(), !ee || typeof ResizeObserver > "u") return;
		let m = !1;
		ce = new ResizeObserver(() => {
			m || (m = !0, requestAnimationFrame(() => {
				m = !1, fit();
			}));
		});
		for (let m of ee.uiRoot.getContainers()) {
			let _ = m.getDiv()?.firstElementChild;
			_ && ce.observe(_), ce.observe(m.getDiv());
		}
	}
	async function showModern(x, { remember: S = !0, skinRoot: C = "" } = {}) {
		return J && await J.catch(() => {}), J = (async () => {
			let { mountModernSkin: F } = await import("./chunks/modernSkin-GTROSuAl.js"), H = ensureModernHost();
			ee?.dispose(), ee = null, H.replaceChildren(), H.hidden = !1, _.classList.add("modern-active");
			try {
				ee = await F({
					webamp: m,
					host: H,
					skin: x,
					layout: "row",
					desktop: potentialBox,
					bar: D,
					skinRoot: C,
					getStationInfo: W,
					onAction,
					isActionActive,
					holdWindow,
					releaseWindow,
					assetsBase: I,
					privateDefaults: L,
					onLayoutChanged: () => requestAnimationFrame(fit),
					seedTracks: O
				});
			} catch (m) {
				throw _.classList.remove("modern-active"), H.hidden = !0, m;
			}
			H.addEventListener("pointermove", trackPointer), H.addEventListener("contextmenu", onModernContextMenu), applyBarHeight(), fit(), watchSkinSize(), updateSwitch(), writeMode("modern"), S && (await storeModernSkin(x, C), await refreshRecent()), q("skin", {
				type: "modern",
				name: C ? C.replace(/\/$/, "").split("/").pop() : x.name
			});
		})(), J;
	}
	function onModernContextMenu(m) {
		m.defaultPrevented || (m.preventDefault(), openClassicMenu(m.clientX, m.clientY));
	}
	function showClassic() {
		ce?.disconnect(), ce = null, resetBarHeight(), ee && (te.removeEventListener("pointermove", trackPointer), te.removeEventListener("contextmenu", onModernContextMenu), ee.dispose(), ee = null, S.isEmbedded() && S.unembed(), te.replaceChildren(), te.hidden = !0, te.style.zoom = ""), _.classList.remove("modern-active"), updateSwitch(), writeMode("classic"), q("layout", { mode: "classic" });
	}
	async function setSkin(_, x = "", { variant: S, chooseVariant: C = defaultChooseVariant } = {}) {
		let D = _;
		if (typeof _ == "string") {
			let m = await fetch(_);
			if (!m.ok) throw Error(`Skin could not be loaded: ${_}`);
			D = await m.blob(), x ||= _.split("/").pop();
		}
		let O = await inspectSkinArchive(D), F = O.type, I = "";
		if (F && O.variants.length && O.variants[0].path) {
			let m = 0;
			if (S != null) m = typeof S == "number" ? S : O.variants.findIndex((m) => m.name === S);
			else if (O.variants.length > 1 && C && (m = await C(O.variants.map((m) => m.name)), m == null || m < 0)) return null;
			let _ = O.variants[m] ?? O.variants[0];
			if (_.nested) {
				let m = await O.zip.file(_.path).async("blob"), x = _.path.split("/").pop();
				return setSkin(new File([m], x), x, {
					variant: S,
					chooseVariant: C
				});
			}
			I = _.path;
		}
		if (F === "modern") return await showModern(D instanceof File ? D : new File([D], x || "skin.wal"), { skinRoot: I }), "modern";
		if (F === "classic" && I && (D = await repackFolder(O.zip, I)), F === "classic") {
			showClassic();
			let _ = URL.createObjectURL(D);
			try {
				m.setSkinFromUrl(_), await m.skinIsLoaded();
			} finally {
				URL.revokeObjectURL(_);
			}
			return q("skin", {
				type: "classic",
				name: x || D.name || ""
			}), "classic";
		}
		throw Error("Not a Winamp skin (no main.bmp or skin.xml in the archive)");
	}
	async function toggle() {
		if (ee) return showClassic(), "classic";
		let m = await readModernSkin();
		return m ? (await showModern(m.file, {
			remember: !1,
			skinRoot: m.skinRoot
		}), "modern") : F ? (await setSkin(F.url, F.label, { variant: F.variant }), "modern") : (pickFile(), "classic");
	}
	async function restore() {
		if (readMode() !== "modern") return !1;
		let m = await readModernSkin();
		try {
			if (m) await showModern(m.file, {
				remember: !1,
				skinRoot: m.skinRoot
			});
			else if (F) await setSkin(F.url, F.label, { variant: F.variant });
			else return !1;
			return !0;
		} catch (m) {
			return console.warn("Stored Modern skin could not be restored:", m), showClassic(), !1;
		}
	}
	function pickFile() {
		let m = document.createElement("input");
		m.type = "file", m.accept = ".wal,.wsz,.zip,application/zip", m.addEventListener("change", () => {
			let [_] = m.files ?? [];
			_ && setSkin(_).catch((m) => {
				console.error(m), q("error", { reason: m?.message ?? String(m) });
			});
		}), m.click();
	}
	return {
		setSkin,
		showClassic,
		toggle,
		pickFile,
		restore,
		hasModernSkin: async () => !!await readModernSkin(),
		getRecentModernSkins: () => ne.map((m) => m.label),
		showRecentModernSkin: async (m) => {
			let _ = ne.find((_) => _.label === m);
			return _ ? (await showModern(_.file, {
				remember: !0,
				skinRoot: _.skinRoot
			}), !0) : !1;
		},
		fit,
		getMode: () => ee ? "modern" : "classic",
		getModern: () => ee,
		openClassicMenu,
		dispose: () => {
			ie(), showClassic(), re?.remove(), te?.remove(), te = null;
		}
	};
}
//#endregion
//#region src/builtinSkins.js
function builtinModernSkins(m = document.baseURI) {
	let _ = new URL("skins/modern/", m).href;
	return [
		{
			id: "winamp-modern",
			label: "Winamp Modern",
			url: `${_}winamp-modern.wal`
		},
		{
			id: "bento",
			label: "Bento",
			url: `${_}bento.zip`,
			variant: "Bento",
			privateDefaults: { Bento: {
				Component: "Hidden",
				"Hidden Component": "Media Library",
				nomax_h: 492
			} }
		},
		{
			id: "big-bento",
			label: "Big Bento",
			url: `${_}bento.zip`,
			variant: "Big Bento",
			privateDefaults: { "Big Bento": {
				Component: "Hidden",
				"Hidden Component": "Media Library",
				nomax_h: 492
			} }
		},
		{
			id: "nokia-edition",
			label: "Nokia Edition",
			url: `${_}nokia-edition.wal`
		}
	];
}
//#endregion
//#region src/embed.js
var DC = 825, OC = 213;
async function mountWebampRadio(m, _ = {}) {
	if (!(m instanceof HTMLElement)) throw Error("mountWebampRadio: pass the element the player should fill");
	let { scale: x = "auto", maxScale: S = 2, lockWindows: C = !0, align: D = "center", overlayZIndex: O = 1e4, libraryNodes: F = [
		"online",
		"bookmarks",
		"history",
		"songs"
	], assetsBase: I = document.baseURI, theme: L = W, forceTheme: H = !1, ...ee } = _, te = new URL(I, document.baseURI).href, J = builtinModernSkins(te);
	m.classList.add("webamp-dock");
	let ne = document.createElement("div");
	ne.className = "webamp-dock-stage", ne.style.width = `${DC}px`, ne.style.height = "116px", m.append(ne);
	let re = document.createElement("div");
	re.id = "webamp", re.className = "webamp-dock-overlays", re.style.zIndex = String(O), document.body.append(re), document.documentElement.style.setProperty("--webamp-overlay-z", String(O + 1));
	let Q = onContextMenu((m) => {
		let _ = m.parentElement;
		if (!_ || _.dataset.dockAdjusted === "1") return;
		_.dataset.dockAdjusted = "1";
		let x = m.getBoundingClientRect(), S = x.bottom - window.innerHeight + 8, C = x.right - window.innerWidth + 8;
		S > 0 && (_.style.top = `${Math.max(0, parseFloat(_.style.top || "0") - S)}px`), C > 0 && (_.style.left = `${Math.max(0, parseFloat(_.style.left || "0") - C)}px`);
	}), ie = {}, ae = await createRadioPlayer({
		...ee,
		skinFileHooks: ie,
		host: ne,
		layout: "row",
		contained: !0,
		overlayHost: re,
		libraryNodes: F,
		enableHotkeys: ee.enableHotkeys ?? !1,
		getVideoPosition: ee.getVideoPosition ?? (({ width: _, min: x, overlay: S }) => {
			if (!C && !m.classList.contains("modern-active")) {
				let m = ne.querySelector("#main-window")?.getBoundingClientRect();
				if (m && m.width > 0) {
					let _ = Math.max(x.height, Math.round(232 * le));
					return {
						left: m.right - S.left,
						top: m.bottom - S.top - _,
						height: _,
						width: x.width
					};
				}
			}
			let D = null;
			if (m.classList.contains("modern-active")) D = m.querySelector(".webamp-dock-modern")?.getBoundingClientRect() ?? null;
			else {
				let m = [
					"#main-window",
					"#equalizer-window",
					"#playlist-window"
				].map((m) => ne.querySelector(m)?.getBoundingClientRect()).filter((m) => m && m.width > 0);
				if (m.length) {
					let _ = Math.min(...m.map((m) => m.left)), x = Math.min(...m.map((m) => m.top)), S = Math.max(...m.map((m) => m.right)), C = Math.max(...m.map((m) => m.bottom));
					D = {
						left: _,
						top: x,
						right: S,
						bottom: C,
						width: S - _,
						height: C - x
					};
				}
			}
			let O = D && D.width > 0 ? D : m.getBoundingClientRect(), F = Math.max(x.height, Math.round(O.height)), I = O.right - S.left;
			return I + _ <= S.width ? {
				left: I,
				top: Math.max(0, O.bottom - S.top - F),
				height: F
			} : {
				left: Math.max(0, O.right - S.left - x.width),
				top: Math.max(0, O.top - S.top - x.height),
				height: x.height
			};
		}),
		getLibraryPosition: ee.getLibraryPosition ?? (({ width: _, height: x, overlay: S }) => {
			let C = m.getBoundingClientRect();
			return {
				left: Math.max(0, Math.min(C.left - S.left, S.width - _)),
				top: Math.max(0, C.top - S.top - x - 8)
			};
		})
	}), stopDrag = (m) => {
		(m.target instanceof Element ? m.target : null)?.classList.contains("draggable") && m.stopPropagation();
	};
	C && (ne.addEventListener("mousedown", stopDrag, !0), ne.addEventListener("touchstart", stopDrag, !0));
	let oe = "webamp.classic.windows.v1";
	C || m.classList.add("webamp-dock-free");
	let se = !1, readArrangement = () => {
		try {
			return JSON.parse(localStorage.getItem(oe) ?? "null");
		} catch {
			return null;
		}
	};
	if (!C) {
		let m = readArrangement();
		m && typeof m == "object" && (se = !0, ae.webamp.store.dispatch({
			type: "UPDATE_WINDOW_POSITIONS",
			absolute: !0,
			positions: m
		}));
		let _ = !1;
		ne.addEventListener("mousedown", (m) => {
			(m.target instanceof Element ? m.target : null)?.classList.contains("draggable") && (_ = !0);
		}, !0), window.addEventListener("mouseup", () => {
			setTimeout(() => {
				_ = !1;
			}, 0);
		}, !0);
		let x = ae.webamp.store.getState().windows.genWindows;
		ae.webamp.store.subscribe(() => {
			let m = ae.webamp.store.getState();
			if (m.windows.genWindows === x) return;
			let S = Object.entries(m.windows.genWindows).some(([m, _]) => x[m] && (_.position.x !== x[m].position.x || _.position.y !== x[m].position.y));
			if (x = m.windows.genWindows, !S || ce || !_) return;
			se = !0;
			let C = Object.fromEntries([
				"main",
				"equalizer",
				"playlist"
			].map((_) => [_, m.windows.genWindows[_]?.position]).filter(([, m]) => m));
			try {
				localStorage.setItem(oe, JSON.stringify(C));
			} catch {}
		});
	}
	let ce = !1, le = 1;
	function fit() {
		let _ = m.clientWidth || DC, O = m.clientHeight || 116, F = Math.min(_ / DC, O / 116, S), I = x === "auto" ? F >= 1 ? Math.floor(F) : F : x === "fit" ? F : Number(x) || 1;
		le = Math.max(.5, Math.round(I * 100) / 100), m.style.setProperty("--dock-scale", String(le));
		let L = DC * le, H = 116 * le;
		if (!C) {
			if (ne.style.left = "0px", ne.style.top = "0px", ne.style.width = `${Math.ceil(window.innerWidth / le)}px`, ne.style.height = `${Math.ceil(window.innerHeight / le)}px`, !se) {
				let x = (275 + OC + 275) * le, S = m.getBoundingClientRect(), C = D === "left" ? S.left : D === "right" ? S.right - x : S.left + (_ - x) / 2, F = S.bottom - Math.max(0, (O - H) / 2), I = Math.max(0, Math.round(C / le)), L = Math.max(0, Math.round(F / le) - 116);
				ce = !0, ae.layoutWindows({
					x: I,
					y: L
				}, {
					equalizer: {
						x: 0,
						y: -116
					},
					main: {
						x: 0,
						y: 0
					},
					playlist: {
						x: 275 + OC,
						y: 0
					}
				}), ce = !1;
			}
			return;
		}
		let U = D === "left" ? 0 : D === "right" ? _ - L : (_ - L) / 2;
		ne.style.left = `${Math.max(0, Math.round(U / le))}px`, ne.style.top = `${Math.max(0, Math.round((O - H) / 2 / le))}px`, (C || !se) && (ce = !0, ae.layoutWindows(), ce = !1);
	}
	let ue = createSkinSurface({
		webamp: ae.webamp,
		seedTracks: () => ae.youtube || ae.lacitis ? [] : U(ae.getStations?.() ?? []),
		dock: m,
		classicStage: ne,
		library: ae.library,
		getBox: () => ({
			width: m.clientWidth || DC,
			height: m.clientHeight || 116
		}),
		defaultModern: J[0],
		modernAssetsBase: new URL("modern/assets/", te).href,
		modernPrivateDefaults: Object.assign({}, ...J.map((m) => m.privateDefaults ?? {}), ee.modernPrivateDefaults ?? {}),
		switchButton: ee.switchButton ?? !0,
		barHeight: ee.barHeight ?? { max: "70vh" },
		getStationInfo: () => {
			let m = ae.getCurrentStation?.();
			if (!m) return null;
			let _ = ae.getNowPlaying?.();
			return {
				title: m.title,
				genre: m.genre ?? "",
				streamTitle: _?.streamTitle ?? ""
			};
		},
		emit: (m, _) => ae.emit?.(m, _)
	});
	ie.pickFile = () => ue.pickFile(), ie.getBuiltin = () => J, ie.getMode = () => ue.getMode(), ie.showClassic = () => ue.showClassic(), ie.getRecent = () => ue.getRecentModernSkins(), ie.pickRecent = (m) => ue.showRecentModernSkin(m).catch((m) => ae.emit?.("error", { reason: m?.message ?? String(m) })), ie.pickBuiltin = (m) => ue.setSkin(m.url, m.label, { variant: m.variant }).catch((m) => ae.emit?.("error", { reason: m?.message ?? String(m) }));
	let refit = () => {
		fit(), ue.fit();
	};
	refit();
	let de = new ResizeObserver(refit);
	de.observe(m), window.addEventListener("resize", refit), ee.restoreSkin !== !1 && await ue.restore();
	let themedElements = () => [ne, re].filter(Boolean), fe = null;
	function paintTheme() {
		for (let m of themedElements()) for (let _ of Object.values(q)) _.className && m.classList.toggle(_.className, _ === fe);
	}
	async function applyTheme(m) {
		let _ = themeById(m);
		if (fe = _, paintTheme(), !_?.skin) return _?.id ?? null;
		ue.showClassic();
		let x = themeSkinUrl(_, te);
		return await ae.setSkin(x, _.label), _.id;
	}
	let me = ee.restoreSkin === !1 ? null : readStoredSkin(), he = !H && me ? null : L;
	if (he) try {
		await applyTheme(he);
	} catch (m) {
		ae.emit?.("error", { reason: `Theme "${he}" did not load: ${m?.message ?? m}` });
	}
	else fe = null, paintTheme();
	return {
		...ae,
		container: m,
		stage: ne,
		getScale: () => le,
		refit,
		overlays: re,
		setSkin: async (m, _, x) => typeof m == "string" && /\.wsz(\?|$)/i.test(m) ? (ue.showClassic(), await ae.setSkin(m, _), "classic") : ue.setSkin(m, _, x),
		pickSkinFile: () => ue.pickFile(),
		showClassicSkin: () => ue.showClassic(),
		toggleSkinMode: () => ue.toggle(),
		getSkinMode: () => ue.getMode(),
		getRecentModernSkins: () => ue.getRecentModernSkins(),
		setTheme: (m) => applyTheme(m),
		getTheme: () => fe?.id ?? null,
		getThemes: () => themeList(),
		getBuiltinModernSkins: () => J,
		setBuiltinModernSkin: (m) => {
			let _ = J.find((_) => _.id === m);
			if (!_) throw Error(`Unknown built-in skin: ${m}`);
			return ue.setSkin(_.url, _.label, { variant: _.variant });
		},
		showRecentModernSkin: (m) => ue.showRecentModernSkin(m),
		getModernSkin: () => ue.getModern(),
		dispose: () => {
			ue.dispose(), de.disconnect(), Q(), window.removeEventListener("resize", refit), ne.removeEventListener("mousedown", stopDrag, !0), ne.removeEventListener("touchstart", stopDrag, !0), ae.dispose(), ne.remove(), re.remove(), m.classList.remove("webamp-dock");
		}
	};
}
//#endregion
//#region src/minka.js
var kC = "media-profile-change", AC = "rg-stations-ready";
function readMinkaStations() {
	try {
		if (typeof stationsList < "u" && Array.isArray(stationsList)) return stationsList;
	} catch {}
	return Array.isArray(window.stationsList) ? window.stationsList : null;
}
function stationKey(m) {
	return m ? m.hostKey ? m.hostKey : m.uuid ? `rb:${m.uuid}` : "" : "";
}
async function mountMinkaRadio(m, _ = {}) {
	let { stations: x = readMinkaStations() ?? [], syncStations: S = !0, syncFavorites: C = !0, emitNowPlaying: D = !0, takeOverRgStations: O = !0, ...F } = _, I = await mountWebampRadio(m, {
		stationsName: "Minka stations",
		libraryNodes: [
			"online",
			"featured",
			"bookmarks",
			"history",
			"songs"
		],
		...F,
		stations: x
	}), L = [], applyStations = () => {
		let m = readMinkaStations();
		m && I.setStations(m);
	};
	S && (window.addEventListener(AC, applyStations), L.push(() => window.removeEventListener(AC, applyStations)));
	let findByKey = (m) => (I.getStations?.() ?? []).find((_) => stationKey(_) === m) ?? null, profile = () => window.__mkUnifiedMedia ?? null, profileReady = () => !!(profile()?.getSession?.() && profile()?.isLoaded?.()), H = !1, pullFavorites = () => {
		if (!profileReady()) return;
		let m = profile().getRadio?.()?.favorites ?? [], _ = I.favorites.list();
		H = !0;
		try {
			for (let x of _) {
				let _ = stationKey(x);
				_ && !m.includes(_) && I.favorites.remove(x.url);
			}
			for (let _ of m) {
				if (I.favorites.list().some((m) => stationKey(m) === _)) continue;
				let m = findByKey(_);
				m && I.favorites.add(m);
			}
			let x = new Map(I.favorites.list().map((m) => [stationKey(m), m.url]));
			I.favorites.reorder(m.map((m) => x.get(m)).filter(Boolean));
		} finally {
			H = !1;
		}
	}, pushFavorites = (m) => {
		if (H || !profileReady()) return;
		let _ = profile(), x = _.getRadio?.()?.favorites ?? [], S = m.map(stationKey).filter(Boolean);
		for (let m of S) x.includes(m) || _.change?.({
			type: "favorite-add",
			id: m
		});
		for (let m of x) S.includes(m) || _.change?.({
			type: "favorite-remove",
			id: m
		});
	};
	if (C && (document.addEventListener(kC, pullFavorites), window.addEventListener(AC, pullFavorites), L.push(() => document.removeEventListener(kC, pullFavorites)), L.push(() => window.removeEventListener(AC, pullFavorites)), L.push(I.favorites.subscribe(pushFavorites)), pullFavorites()), D) {
		let announce = (m) => {
			let _ = I.getCurrentStation?.();
			document.dispatchEvent(new CustomEvent("rg-now-playing-art", { detail: {
				artist: m?.artist ?? "",
				title: m?.title ?? m?.streamTitle ?? _?.title ?? "",
				coverUrl: m?.artwork ?? m?.cover ?? _?.logo ?? "",
				stationKey: stationKey(_)
			} }));
		};
		L.push(I.on("nowplaying", announce)), L.push(I.on("artwork", announce));
	}
	let play = (m) => {
		let _ = findByKey(m);
		return _ ? (I.play(_), !0) : !1;
	};
	if (O) {
		let m = window.rgStations;
		window.rgStations = {
			...m ?? {},
			list: () => (I.getStations?.() ?? []).map((m) => ({
				key: stationKey(m),
				title: m.title
			})),
			play,
			startInitial: () => {
				if (I.getCurrentStation?.()) return I.resume?.(), !0;
				let m = I.getStations?.() ?? [], _ = m.find((m) => m.group !== "world" && m.group !== "latvija" && String(m.title).trim().toLowerCase() === "remix") ?? m[0];
				return _ ? (I.play(_), !0) : !1;
			},
			startFavorite: (m) => {
				for (let _ of m ?? []) if (play(_)) return !0;
				return !1;
			}
		}, L.push(() => {
			window.rgStations && window.rgStations.play === play && (window.rgStations = m);
		});
	}
	return {
		...I,
		stationKey,
		playKey: play,
		syncFavorites: pullFavorites,
		dispose: () => {
			for (let m of L.splice(0)) try {
				m();
			} catch (m) {
				console.error(m);
			}
			I.dispose();
		}
	};
}
//#endregion
export { createRadioPlayer, fromMinkaStation, mountWebampRadio as mount, mountWebampRadio, mountMinkaRadio, normalizeStations, searchMusic, stationKey, toMusicRow };
