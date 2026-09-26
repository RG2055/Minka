import "./rolldown-runtime-ly0BBW_k.js";
import { D as e, F as t, G as n, I as r, M as i, N as a, O as o, P as s, Q as c, S as l, T as u, W as d, Z as f, _ as p, a as m, at as h, b as g, c as _, ct as v, d as y, f as b, g as x, h as S, j as C, k as w, l as T, m as E, n as D, nt as O, o as k, ot as A, p as j, rt as M, s as N, st as P, t as F, tt as I, u as L, v as R, w as z, y as B } from "./GammaGroup-BUFdecwO.js";
//#region src/vendor/webamp-modern/maki/constants.js
var V = {
	1: {
		name: "push",
		short: "",
		arg: "var",
		in: "0",
		out: "1"
	},
	2: {
		name: "pop",
		short: "pop",
		in: "1",
		out: "0"
	},
	3: {
		name: "popTo",
		short: "popTo",
		arg: "var",
		in: "0",
		out: "0"
	},
	8: {
		name: "eq",
		short: "==",
		in: "2",
		out: "1"
	},
	9: {
		name: "heq",
		short: "!=",
		in: "2",
		out: "1"
	},
	10: {
		name: "gt",
		short: ">",
		in: "2",
		out: "1"
	},
	11: {
		name: "gtq",
		short: ">=",
		in: "2",
		out: "1"
	},
	12: {
		name: "le",
		short: "<",
		in: "2",
		out: "1"
	},
	13: {
		name: "leq",
		short: "<=",
		in: "2",
		out: "1"
	},
	16: {
		name: "jumpIf",
		short: "if",
		arg: "line",
		in: "1",
		out: "0"
	},
	17: {
		name: "jumpIfNot",
		arg: "line",
		in: "1",
		out: "0"
	},
	18: {
		name: "jump",
		arg: "line",
		in: "0",
		out: "0"
	},
	24: {
		name: "call",
		arg: "objFunc",
		in: "0",
		out: "1"
	},
	25: {
		name: "callGlobal",
		arg: "func",
		in: "0",
		out: "1"
	},
	33: {
		name: "ret",
		short: "return",
		in: "1",
		out: "0"
	},
	40: {
		name: "complete",
		short: "complete",
		in: "0",
		out: "0"
	},
	48: {
		name: "mov",
		short: "=",
		in: "2",
		out: "1"
	},
	56: {
		name: "postinc",
		short: "++",
		post: 1,
		in: "1",
		out: "1"
	},
	57: {
		name: "postdec",
		short: "--",
		post: 1,
		in: "1",
		out: "1"
	},
	58: {
		name: "preinc",
		short: "++",
		in: "1",
		out: "1"
	},
	59: {
		name: "predec",
		short: "--",
		in: "1",
		out: "1"
	},
	64: {
		name: "add",
		short: "+",
		in: "2",
		out: "1"
	},
	65: {
		name: "sub",
		short: "-",
		in: "2",
		out: "1"
	},
	66: {
		name: "mul",
		short: "*",
		in: "2",
		out: "1"
	},
	67: {
		name: "div",
		short: "/",
		in: "2",
		out: "1"
	},
	68: {
		name: "mod",
		short: "%",
		in: "2",
		out: "1"
	},
	72: {
		name: "and",
		short: "&",
		in: "2",
		out: "1"
	},
	73: {
		name: "or",
		short: "|",
		in: "2",
		out: "1"
	},
	74: {
		name: "not",
		short: "!",
		in: "1",
		out: "1"
	},
	76: {
		name: "negative",
		short: "-",
		in: "1",
		out: "1"
	},
	80: {
		name: "logAnd",
		short: "&&",
		in: "2",
		out: "1"
	},
	81: {
		name: "logOr",
		short: "||",
		in: "2",
		out: "1"
	},
	88: {
		name: "lshift",
		short: "<<",
		in: "2",
		out: "1"
	},
	89: {
		name: "rshift",
		short: ">>",
		in: "2",
		out: "1"
	},
	90: {
		name: "lshift",
		short: "<<",
		in: "2",
		out: "1"
	},
	91: {
		name: "rshift",
		short: ">>",
		in: "2",
		out: "1"
	},
	96: {
		name: "new",
		arg: "obj",
		in: "0",
		out: "1"
	},
	97: {
		name: "delete",
		short: "delete",
		in: "1",
		out: "1"
	},
	104: {
		name: "memberVar",
		arg: "int",
		in: "2",
		out: "1"
	},
	112: {
		name: "strangeCall",
		arg: "objFunc",
		in: "0",
		out: "1"
	},
	300: {
		name: "blockStart",
		short: "{",
		in: "0",
		out: "0"
	},
	301: {
		name: "blockEnd",
		short: "}",
		in: "0",
		out: "0"
	}
}, MakiFile = class {
	constructor(e) {
		this._arr = new Uint8Array(e), this._i = 0;
	}
	isEof() {
		return this._i == this._arr.length;
	}
	readInt32LE() {
		let e = this._i >>> 0;
		return this._i += 4, this._arr[e] | this._arr[e + 1] << 8 | this._arr[e + 2] << 16 | this._arr[e + 3] << 24;
	}
	readUInt32LE() {
		let e = this.peekUInt32LE();
		return this._i += 4, e;
	}
	peekUInt32LE() {
		let e = this._i >>> 0;
		return (this._arr[e] | this._arr[e + 1] << 8 | this._arr[e + 2] << 16) + this._arr[e + 3] * 16777216;
	}
	readUInt16LE() {
		let e = this._i >>> 0;
		return this._i += 2, this._arr[e] | this._arr[e + 1] << 8;
	}
	readUInt8() {
		let e = this._arr[this._i];
		return this._i++, e;
	}
	readStringOfLength(e) {
		let t = "", n = Math.min(this._arr.length, this._i + e), r = this._arr.slice(this._i, n);
		return t = new TextDecoder().decode(r), this._i += e, t;
	}
	readString() {
		return this.readStringOfLength(this.readUInt16LE());
	}
	getPosition() {
		return this._i;
	}
}, H = "FG", U = {
	5: "BOOLEAN",
	2: "INT",
	3: "FLOAT",
	4: "DOUBLE",
	6: "STRING"
};
function parse(e, t) {
	let n = new MakiFile(e);
	readMagic(n);
	let r = readVersion(n);
	n.readUInt32LE();
	let i = readClasses(n), a = readMethods(n, i), o = readVariables({
		makiFile: n,
		classes: i
	});
	readConstants({
		makiFile: n,
		variables: o
	});
	let s = readBindings(n, o), c = decodeCode({ makiFile: n });
	n.isEof() || console.warn("EOF not reached!");
	let l = {};
	return c.forEach((e, t) => {
		e.offset != null && (l[e.offset] = t);
	}), {
		classes: i,
		methods: a,
		variables: o,
		bindings: s.map((e) => Object.assign({}, e, { commandOffset: l[e.binaryOffset] })),
		commands: c.map((e) => e.argType === "COMMAND_OFFSET" ? Object.assign({}, e, { arg: l[e.arg] }) : e),
		version: r,
		maki_id: t
	};
}
function opcodeToArgType(e) {
	let t = V[e];
	if (t == null) throw Error(`Unknown opcode ${e}`);
	switch (t.arg) {
		case "func":
		case "line": return "COMMAND_OFFSET";
		case "var":
		case "objFunc":
		case "obj": return "VARIABLE_OFFSET";
		case "int": return "INT";
		default: return "NONE";
	}
}
function readMagic(e) {
	let t = e.readStringOfLength(2);
	if (t !== H) throw Error(`Magic "${t}" does not mach "${H}". Is this a maki file?`);
	return t;
}
function readVersion(e) {
	return e.readUInt16LE();
}
function readClasses(e) {
	let t = e.readUInt32LE(), n = [];
	for (; t--;) {
		let t = "", r = 4;
		for (; r--;) t += e.readUInt32LE().toString(16).padStart(8, "0");
		n.push(t);
	}
	return n;
}
function readMethods(e, t) {
	let n = e.readUInt32LE(), r = [];
	for (; n--;) {
		let n = e.readUInt16LE() & 255;
		e.readUInt16LE();
		let i = e.readString().toLowerCase(), a = t[n], o = f(a, i);
		r.push({
			name: i,
			typeOffset: n,
			returnType: o
		});
	}
	return r;
}
function readVariables({ makiFile: e, classes: t }) {
	let n = e.readUInt32LE(), r = [];
	for (; n--;) {
		let n = e.readUInt8(), i = e.readUInt8(), a = e.readUInt16LE(), o = e.readUInt16LE(), s = e.readUInt16LE();
		e.readUInt16LE(), e.readUInt16LE();
		let c = e.readUInt8();
		if (e.readUInt8(), a) {
			let e = r[n];
			if (e == null) throw Error("Invalid type");
			e.members || (e.isClass = !0, e.members = [], e.events = []), r.push({
				type: "OBJECT",
				value: null,
				global: c,
				guid: e.guid
			});
			let t = r.length - 1;
			e.members.includes(t) || e.members.push(t);
		} else if (i) {
			let e = t[n];
			if (e == null) throw Error("Invalid type");
			r.push({
				type: "OBJECT",
				value: null,
				global: c,
				guid: e
			});
		} else {
			let e = U[n];
			if (e == null) throw Error("Invalid type");
			let t = null;
			switch (e) {
				case U[5]:
					t = o, I(t === 1 || t === 0, "Expected boolean value to be initialized as zero or one");
					break;
				case U[2]:
					t = o;
					break;
				case U[3]:
				case U[4]:
					let e = (s & 65408) >> 7;
					t = ((128 | s & 127) << 16 | o) * 2 ** (e - 150);
					break;
				case U[6]: break;
				default: throw Error("Invalid primitive type");
			}
			let i = {
				global: c,
				type: e,
				value: t
			};
			r.push(i);
		}
	}
	return r;
}
function readConstants({ makiFile: e, variables: t }) {
	let n = e.readUInt32LE();
	for (; n--;) {
		let n = t[e.readUInt32LE()];
		n.value = e.readString();
	}
}
function readBindings(e, t) {
	let n = e.readUInt32LE(), r = [];
	for (; n--;) {
		let n = e.readUInt32LE(), i = e.readUInt32LE(), a = e.readUInt32LE();
		r.push({
			variableOffset: n,
			binaryOffset: a,
			methodOffset: i
		});
		let o = t[n];
		o.events ||= [], o.events.push(r.length - 1);
	}
	return r;
}
function decodeCode({ makiFile: e }) {
	let t = e.readUInt32LE(), n = e.getPosition(), r = [];
	for (; e.getPosition() < n + t;) r.push(parseComand({
		start: n,
		makiFile: e,
		length: t
	}));
	return r;
}
function parseComand({ start: e, makiFile: t, length: n }) {
	let r = t.getPosition() - e, i = t.readUInt8(), a = {
		offset: r,
		start: e,
		opcode: i,
		arg: null,
		argType: opcodeToArgType(i)
	};
	if (a.argType === "NONE") return a;
	let o = null;
	switch (a.argType) {
		case "COMMAND_OFFSET":
			o = t.readInt32LE() + 5 + r;
			break;
		case "VARIABLE_OFFSET":
			o = t.readUInt32LE();
			break;
		case "INT":
			o = t.readInt32LE();
			break;
		default: throw Error("Invalid argType");
	}
	return a.arg = o, n > r + 5 + 4 && t.peekUInt32LE() >= 4294901760 && t.peekUInt32LE() <= 4294901775 && t.readUInt32LE(), i === 112 && t.readUInt8(), a;
}
//#endregion
//#region src/vendor/webamp-modern/skin/Color.js
var W = class Color {
	constructor() {
		this._resolver = () => null;
	}
	setResolver(e) {
		this._resolver = e;
	}
	static isRgb(e) {
		return /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,?\s*$/.test(e ?? "");
	}
	setXmlAttributes(e) {
		for (let [t, n] of Object.entries(e)) this.setXmlAttr(t, n);
	}
	setXmlAttr(e, t) {
		switch (e.toLowerCase()) {
			case "id":
				this._id = t, this._cssVar = `--color-${this.getId().replace(/[^a-zA-Z0-9]/g, "-")}`;
				break;
			case "value":
				this._value = t;
				break;
			case "gammagroup":
				this._gammagroup = t;
				break;
			default: return !1;
		}
		return !0;
	}
	getId() {
		return this._id;
	}
	getGammaGroup() {
		return this._gammagroup;
	}
	getValue() {
		let e = this._value, t = /* @__PURE__ */ new Set([this.getId()?.toLowerCase()]);
		for (let n = 0; n < 8 && e && !Color.isRgb(e); n++) {
			let n = this._resolver(e.trim());
			if (!n || t.has(n.getId()?.toLowerCase())) break;
			t.add(n.getId()?.toLowerCase()), e = n._value;
		}
		return e && e.replace(/,\s*$/, "");
	}
	getCSSVar() {
		return this._cssVar;
	}
	getRgb() {
		return `rgb(${this.getValue()})`;
	}
}, ColorThemesList = class extends n {
	constructor(e) {
		super(e), this._select = document.createElement("select"), this._nohscroll = !1, this._nocolheader = !1, this._div.appendChild(this._select), this._registerEvents();
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e.toLowerCase()) {
			case "nocolheader":
				this._nocolheader = v(t);
				break;
			case "nohscroll":
				this._nohscroll = v(t);
				break;
			default: return !1;
		}
		return !0;
	}
	_registerEvents() {
		this._select.addEventListener("dblclick", () => {
			this.handleAction("colorthemes_switch");
		});
	}
	_renderGammaSets() {
		P(this._select), this._select.setAttribute("multiple", "1"), this._select.style.position = "absolute", this._select.style.width = "100%", this._select.style.height = "100%";
		for (let e of this._uiRoot._gammaSets.keys()) {
			let t = document.createElement("option");
			t.value = e, t.innerText = this._uiRoot._gammaNames[e], this._select.appendChild(t);
		}
		this._select.style.overflowY = "scroll", this._nohscroll ? this._select.style.overflowX = "hidden" : this._select.style.overflowX = "scroll", this._nocolheader ? this._select.style.setProperty("--colheader", null) : this._select.style.setProperty("--colheader", "'Theme'"), this._select.value = this._uiRoot._activeGammaSetName, this._renderBoldSelection();
	}
	_renderBoldSelection() {
		Array.from(this._select.options).forEach((e) => {
			e.value === this._uiRoot._activeGammaSetName ? e.setAttribute("selected", "selected") : e.removeAttribute("selected");
		});
	}
	handleAction(e, t = null, n = null) {
		switch (e) {
			case "colorthemes_switch":
				let e = this._select.value;
				return e != null && (this._uiRoot.enableGammaSet(e), this._renderBoldSelection()), !0;
			case "colorthemes_previous":
				if (this._select.selectedIndex > 0) return this._select.selectedIndex--, this.handleAction("colorthemes_switch");
				break;
			case "colorthemes_next": if (this._select.selectedIndex < this._select.options.length) return this._select.selectedIndex++, this.handleAction("colorthemes_switch");
		}
		return !1;
	}
	draw() {
		super.draw(), this._div.classList.add("list"), this._div.setAttribute("data-obj-name", "ColorThemes:List"), this._renderGammaSets();
	}
}, Grid = class extends n {
	constructor(e) {
		super(e), this._left = document.createElement("left"), this._middle = document.createElement("middle"), this._right = document.createElement("right"), this._div.appendChild(this._left), this._div.appendChild(this._middle), this._div.appendChild(this._right);
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e) {
			case "middle":
				this._setBitmap(this._middle, t);
				break;
			case "left":
				this._setBitmap(this._left, t);
				break;
			case "right":
				this._setBitmap(this._right, t);
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
		this.setBackgroundImage(e);
	}
	_setBitmap(e, t) {
		let n = this._uiRoot.getBitmap(t);
		n && (n.setAsBackground(e), e.style.width = A(n.getWidth()));
	}
	draw() {
		super.draw(), this._div.style.pointerEvents = "none", this._renderVisibility(), this._div.classList.add("webamp--img"), this._renderBackground();
	}
	isinvalid() {
		return !1;
	}
};
Grid.GUID = "OFFICIALLY-NO-GUID";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/ProgressGrid.js
var ProgressGrid = class extends Grid {
	constructor(e) {
		super(e), this._disposeDisplaySubscription = this._uiRoot.audio.onCurrentTimeChange(() => {
			this._middle.style.width = `${this._uiRoot.audio.getCurrentTimePercent() * 100}%`;
		});
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e) {
			case "orientation": break;
			default: return !1;
		}
		return !0;
	}
	draw() {
		super.draw(), this._div.style.removeProperty("display");
	}
};
ProgressGrid.GUID = "OFFICIALLY-NO-GUID";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/GroupXFade.js
var GroupXFade = class extends s {
	constructor() {
		super(...arguments), this._speed = null, this._activeChild = null;
	}
	getElTag() {
		return "group";
	}
	setXmlAttr(e, t) {
		let n = e.toLowerCase();
		if (super.setXmlAttr(n, t)) return !0;
		switch (n) {
			case "speed":
				this._speed = h(t);
				break;
			case "groupid":
				console.log("xFade new groupid", t), this._switchTo(t.toLowerCase());
				break;
			default: return !1;
		}
		return !0;
	}
	handleAction(e, t = null, n = null, r = null) {
		return e.toLowerCase().startsWith("switchto;") ? (this._uiRoot.vm.dispatch(this, "onaction", [
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
				value: 0
			},
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
				value: 0
			},
			{
				type: "OBJECT",
				value: r
			}
		]), !0) : e.toLowerCase() === "groupid";
	}
	init() {
		super.init();
	}
	async _switchTo(e) {
		this._activeChild && this._fadeOut(this._activeChild);
		let t = M(this._children, (t) => t.getId() == e);
		if (t == null) {
			let n = new _("dummy", {
				id: e,
				w: "0",
				h: "0",
				relatw: "1",
				relath: "1",
				alpha: "0"
			});
			t = await new SkinEngineWAL(this._uiRoot).group(n, this), t.draw(), t.init(), this._div.appendChild(t.getDiv());
		}
		await this._fadeIn(t), this._activeChild = t;
	}
	async _fadeOut(e) {
		e._div.classList.add("fading-out"), e.setalpha(0), setTimeout(() => {
			e._div.classList.remove("fading-out"), e.hide();
		}, this._speed * 1500);
	}
	async _fadeIn(e) {
		e.show(), e.setalpha(255);
	}
	draw() {
		super.draw(), this._div.classList.add("x-fade"), this._div.style.setProperty("--fade-in-speed", `${this._speed}s`), this._div.style.setProperty("--fade-out-speed", `${this._speed / 2}s`);
	}
};
GroupXFade.GUID = "OFFICIALLY-NO-GUID";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/WasabiButton.js
var WasabiButton = class extends d {
	getElTag() {
		return "button";
	}
	constructor(e) {
		super(e), this.registerDimensions();
	}
	setXmlAttr(e, t) {
		if (super.setXmlAttr(e, t)) return !0;
		switch (e) {
			case "text":
				this._div.innerText = t;
				break;
			default: return !1;
		}
		return !0;
	}
	registerDimensions() {
		this._uiRoot.addHeight("button-border-top", "wasabi.button.top"), this._uiRoot.addHeight("button-border-bottom", "wasabi.button.bottom"), this._uiRoot.addWidth("button-border-left", "wasabi.button.left"), this._uiRoot.addWidth("button-border-right", "wasabi.button.right");
	}
	draw() {
		super.draw(), this._div.classList.remove("webamp--img"), this._div.classList.add("wasabi"), this._div.setAttribute("data-obj-name", "WasabiButton");
	}
};
WasabiButton.GUID = "OFFICIALLY-NO-GUID";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/NStateButton.js
var NStateButton = class extends w {
	constructor() {
		super(...arguments), this._statesCount = 2, this._states = [0, 1], this._stateIndex = 0, this._plainImages = {};
	}
	setXmlAttr(e, t) {
		let n = e.toLowerCase();
		if (n.endsWith("image") && (this._plainImages[n] = t.toLowerCase()), super.setXmlAttr(n, t)) return !0;
		switch (n) {
			case "nstates":
				this._statesCount = h(t);
				break;
			case "cfgvals":
				this._states = t.split(";").map((e) => h(e));
				break;
			default: return !1;
		}
		return !0;
	}
	getcurcfgval() {
		return console.log("getCurCfgVal:", this._states[this._stateIndex]), this._states[this._stateIndex];
	}
	_cfgAttribChanged(e) {
		let t = parseInt(e), n = this._states.indexOf(t);
		n != this._stateIndex && (this._stateIndex = n, this._updateBitmaps()), this.setactivated(n != 0);
	}
	_handleMouseDown(e) {
		e.stopPropagation(), this._cycleState(), this.updateCfgAttib(String(this._states[this._stateIndex])), this.setactivated(this._states[this._stateIndex] != 0);
	}
	_cycleState() {
		this._stateIndex++, this._stateIndex >= this._statesCount && (this._stateIndex = 0), this._updateBitmaps(), this.ontoggle(this._states[this._stateIndex] != 0);
	}
	_updateBitmaps() {
		let e = String(this._stateIndex);
		[
			"image",
			"downimage",
			"hoverimage",
			"activeimage"
		].forEach((t) => {
			this._plainImages[t] && (this._uiRoot.hasBitmap(this._plainImages[t] + e) ? super.setXmlAttr(t, this._plainImages[t] + e) : super.setXmlAttr(t, this._plainImages[t]));
		});
	}
	draw() {
		this._updateBitmaps(), super.draw(), this._div.setAttribute("data-obj-name", "NStateButton");
	}
};
NStateButton.GUID = "OFFICIALLY-NO-GUID";
//#endregion
//#region src/vendor/webamp-modern/skin/makiClasses/Images.js
var Images = class extends i {
	constructor() {
		super(...arguments), this._currentFrame = 0, this.updateVolume = () => {
			let e = this._uiRoot.audio.getVolume();
			this.gotoFrame(e * this._frameCount);
		}, this.updateBalance = () => {
			let e = this._uiRoot.audio.getBalance();
			this.gotoFrame(e * this._frameCount);
		};
	}
	getElTag() {
		return "animatedlayer";
	}
	setXmlAttr(e, t) {
		let n = e.toLowerCase();
		if (super.setXmlAttr(n, t)) return !0;
		switch (n) {
			case "source":
				this._source = t.toLowerCase();
				break;
			case "images":
				this._image = t, this._renderBackground();
				break;
			case "imagesspacing":
				this._frameHeight = h(t);
				break;
			default: return !1;
		}
		return !0;
	}
	init() {
		super.init(), this._frameCount = Math.ceil(this._getImageHeight() / this._frameHeight) - 1, this._source == "volume" ? (this._uiRoot.audio.onVolumeChanged(this.updateVolume), this.updateVolume()) : this._source == "balance" && (this._uiRoot.audio.onBalanceChanged(this.updateBalance), this.updateBalance());
	}
	_getImageHeight() {
		let e = this._uiRoot.getBitmap(this._image);
		return e ? e.getHeight() : null;
	}
	gotoFrame(e) {
		this._currentFrame = Math.ceil(e), this._renderFrame();
	}
	_renderFrame() {
		this._div.style.backgroundPositionY = A(-(this._currentFrame * this._frameHeight));
	}
	draw() {
		super.draw(), this._renderFrame(), this._div.setAttribute("data-obj-name", "AnimatedLayer");
	}
};
Images.GUID = "OFFICIALLY-NO-GUID";
var G = [
	"color",
	"bitmap",
	"bitmapfont",
	"truetypefont",
	"skininfo",
	"accelerators"
];
function substituteSkinTokens(e) {
	return e.replace(/@HAVE_LIBRARY@/g, "1");
}
var SkinEngineWAL = class extends D {
	constructor() {
		super(...arguments), this._path = [], this._includedXml = {}, this._scripts = {}, this._phase = 0, this._res = {
			bitmaps: {
				"studio.button": !1,
				"studio.button.pressed": !1,
				"studio.scrollbar.vertical.background": !1,
				"studio.scrollbar.vertical.left": !1,
				"studio.scrollbar.vertical.right": !1,
				"studio.scrollbar.vertical.button": !1,
				"studio.scrollbar.horizontal.background": !1,
				"studio.scrollbar.horizontal.left": !1,
				"studio.scrollbar.horizontal.right": !1,
				"studio.scrollbar.horizontal.button": !1
			},
			colors: {}
		};
	}
	async prepareArial() {
		let e = new _("truetypefont", {
			id: "Arial",
			family: "Arial, 'Liberation Sans', 'DejaVu Sans'"
		});
		await this.trueTypeFont(e, null);
	}
	async parseSkin() {
		console.log("RESOURCE_PHASE #################"), this._phase = 1, await this.prepareArial(), this.prepareXuiTags();
		let e = await this._uiRoot.getFileAsString("skin.xml"), t = T(e);
		await this.traverseChildren(t), await this._loadBitmaps(), console.log("GROUP_PHASE #################"), this._phase = 2, await this.traverseChildren(t), console.log("BUCKET_PHASE #################"), await this.rebuildBuckets();
	}
	prepareXuiTags() {
		this._uiRoot.addXuitagGroupDefId("wasabi:mainframe:nostatus", "wasabi.mainframe.nostatusbar"), this._uiRoot.addXuitagGroupDefId("wasabi:medialibraryframe:nostatus", "wasabi.medialibraryframe.nostatusbar"), this._uiRoot.addXuitagGroupDefId("wasabi:playlistframe:nostatus", "wasabi.playlistframe.nostatusbar"), this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:modal", "wasabi.standardframe.modal"), this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:nostatus", "wasabi.standardframe.nostatusbar"), this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:static", "wasabi.standardframe.static"), this._uiRoot.addXuitagGroupDefId("wasabi:standardframe:status", "wasabi.standardframe.statusbar"), this._uiRoot.addXuitagGroupDefId("wasabi:visframe:nostatus", "wasabi.visframe.nostatusbar");
	}
	async _loadBitmaps() {
		await this._solveMissingBitmaps(), await this._imageManager.ensureBitmapsLoaded();
	}
	async parseFromUrl(e) {
		let t = await (await fetch(e)).text(), n = this.parseXmlFragment(t);
		await this.traverseChildren(n);
	}
	_scanRes(e) {
		e.attributes.background && (this._res.bitmaps[e.attributes.background.toLowerCase()] = !1);
	}
	async _solveMissingBitmaps() {
		for (let e of Object.keys(this._uiRoot.getBitmaps())) this._res.bitmaps[e] = !0;
	}
	async traverseChildren(e, t = null) {
		if (this._phase == 1) return await Promise.all(e.children.map((e) => {
			if (e instanceof _) return this._scanRes(e), this.traverseChild(e, t);
		}));
		for (let n of e.children) n instanceof _ && (this._scanRes(n), await this.traverseChild(n, t));
	}
	async traverseChild(e, t) {
		let n = e.name.toLowerCase();
		switch (n) {
			case "albumart": return this.albumart(e, t);
			case "wasabixml": return this.wasabiXml(e, t);
			case "winampabstractionlayer": return this.winampAbstractionLayer(e, t);
			case "include": return this.include(e, t);
			case "skininfo": return this.skininfo(e, t);
			case "elements": return this.elements(e, t);
			case "bitmap": return this.bitmap(e);
			case "bitmapfont": return await this.bitmapFont(e);
			case "color": return await this.color(e, t);
			case "groupdef": return this.groupdef(e, t);
			case "animatedlayer": return this.animatedLayer(e, t);
			case "images": return this.images(e, t);
			case "layer": return this.layer(e, t);
			case "container": return this.container(e);
			case "layoutstatus": return this.layoutStatus(e, t);
			case "grid": return this.grid(e, t);
			case "progressgrid": return this.progressGrid(e, t);
			case "button": return this.button(e, t);
			case "togglebutton": return this.toggleButton(e, t);
			case "nstatesbutton": return this.nStateButton(e, t);
			case "rect":
			case "group": return this.group(e, t);
			case "groupxfade": return this.groupXFade(e, t);
			case "layout": return this.layout(e, t);
			case "windowholder": return this.windowholder(e, t);
			case "component": return this.component(e, t);
			case "gammaset": return this.gammaset(e, t);
			case "gammagroup": return this.gammagroup(e, t);
			case "slider": return this.slider(e, t);
			case "script": return this.script(e, t);
			case "scripts": return this.scripts(e, t);
			case "text": return this.text(e, t);
			case "menu": return this.menu(e, t);
			case "wasabi:frame":
			case "frame": return this.frame(e, t);
			case "songticker": return this.songticker(e, t);
			case "hideobject":
			case "sendparams": return this.sendparams(e, t);
			case "wasabi:titlebar": return this.wasabiTitleBar(e, t);
			case "wasabi:button": return this.wasabiButton(e, t);
			case "truetypefont": return this.trueTypeFont(e, t);
			case "eqvis": return this.eqvis(e, t);
			case "colorthemes:mgr":
			case "colorthemes:list": return this.colorThemesList(e, t);
			case "status": return this.status(e, t);
			case "elementalias": return this.elementalias(e);
			case "componentbucket": return this.componentBucket(e, t);
			case "playlisteditor":
			case "wasabi:tabsheet":
			case "snappoint":
			case "accelerators":
			case "browser":
			case "syscmds": return;
			case "vis": return this.vis(e, t);
			case "wrapper": return this.traverseChildren(e, t);
			default:
				if (this._uiRoot.getXuiElement(n) || this._predefinedXuiNode(n)) return this.dynamicXuiElement(e, t);
				console.warn(`Unhandled XML node type: ${e.name}`);
				return;
		}
	}
	async _predefinedXuiNode(e) {
		let t = `${this._uiRoot.getAssetsBase()}freeform/xml/`, n = null;
		switch (e) {
			case "wasabi:text":
				t += "wasabi/", n = "xml/xui/text/text.xml";
				break;
			case "wasabi:standardframe:status":
			case "wasabi:standardframe:nostatus":
			case "wasabi:standardframe:modal":
			case "wasabi:standardframe:static":
				t += "wasabi/", n = "xml/xui/standardframe/standardframe.xml";
				break;
			default: return !1;
		}
		console.log("handling _predefinedXuiNode", e);
		let r = this._uiRoot.getZip(), i = this._uiRoot.getSkinDir();
		this._uiRoot.setZip(null), this._uiRoot.setSkinDir(t);
		let a = new _("include", { file: n });
		return await this.include(a, null), this._uiRoot.setSkinDir(i), this._uiRoot.setZip(r), !0;
	}
	addToGroup(e, t) {
		try {
			t.addChild(e);
		} catch {
			console.warn("addToGroup failed. child:", e, "pareng:", t);
		}
	}
	async newGui(e, t, n) {
		let r = new e(this._uiRoot);
		return r.setXmlAttributes(t.attributes), this.addToGroup(r, n), r;
	}
	async newGroup(e, t, n) {
		let r = new e(this._uiRoot);
		return await this.maybeApplyGroupDef(r, t), r.setXmlAttributes(t.attributes), await this.traverseChildren(t, r), this.addToGroup(r, n), t.attributes.instanceid && r.setxmlparam("id", t.attributes.instanceid), r;
	}
	async wasabiXml(e, t) {
		await this.traverseChildren(e, t);
	}
	async winampAbstractionLayer(e, t) {
		await this.traverseChildren(e, t);
	}
	async elements(e, t) {
		await this.traverseChildren(e, t);
	}
	async group(e, t) {
		return await this.newGroup(s, e, t);
	}
	async groupXFade(e, t) {
		let n = await this.newGroup(GroupXFade, e, t);
		this._uiRoot.addXFade(n);
	}
	async componentBucket(e, t) {
		let n = await this.newGroup(S, e, t);
		this._uiRoot.addComponentBucket(n);
	}
	async _loadThinger(e) {
		this._uiRoot._fileExtractor;
		let t = new c();
		this._uiRoot.setFileExtractor(t);
	}
	async dynamicXuiElement(e, t) {
		let n = e.name, r = this._uiRoot.getXuiElement(n);
		if (r) {
			let n = new _("dummy", { id: r.attributes.id }), i = await this.newGroup(b, n, t);
			if (i.setXmlAttributes(e.attributes), e.attributes.content) {
				let t = await this.group(new _("group", {
					id: e.attributes.content,
					w: "0",
					h: "0",
					relatw: "1",
					relath: "1"
				}), i);
				i.addChild(t);
			}
		}
	}
	async bitmap(e) {
		O(e.children.length === 0, "Unexpected children in <bitmap> XML node.");
		let t = new u();
		return t.setXmlAttributes(e.attributes), this._uiRoot.addBitmap(t), this._res.bitmaps[e.attributes.id] = !0, await t.ensureImageLoaded(this._imageManager), t;
	}
	async bitmapFont(e) {
		O(e.children.length === 0, "Unexpected children in <bitmapFont> XML node.");
		let t = new z(this._uiRoot);
		return t.setXmlAttributes(e.attributes), this._isExternalBitmapFont(t) && t.setExternalBitmap(!0), this._uiRoot.addFont(t), t;
	}
	_isExternalBitmapFont(e) {
		return e._file.indexOf("/") < 0;
	}
	async text(e, t) {
		return this.newGui(l, e, t);
	}
	async menu(e, t) {
		return this.newGui(g, e, t);
	}
	async frame(e, t) {
		let n = await this.newGui(B, e, t), r = 0;
		for (let t of [
			"left",
			"top",
			"right",
			"bottom"
		]) {
			let i = e.attributes[t];
			i != null && (await this.group(new _("group", { id: i }), n), r++);
		}
		return n;
	}
	async songticker(e, t) {
		let n = await this.text(e, t);
		return n.setxmlparam("display", "songtitle"), n.setxmlparam("ticker", "1"), n;
	}
	async wasabiTitleBar(e, t) {
		let n = await this.newGroup(y, e, t), r = null, i = e.name, a = this._uiRoot.getXuiElement(i);
		if (a && e.attributes.id != a.attributes.id) {
			let e = new _("groupdev", { id: a.attributes.id });
			await this.maybeApplyGroupDef(n, e), r = n.findobject(a.attributes.embed_xui);
		} else r = n.findobject("window.titlebar.title");
		return r && r.setxmlparam("text", ":componentname"), r;
	}
	async script(e, t) {
		O(e.children.length === 0, "Unexpected children in <script> XML node.");
		let { file: n, id: i, param: a } = e.attributes;
		I(n != null, "Script element missing `file` attribute"), n.startsWith("../Winamp Modern/") && (n = n.replace("../Winamp Modern/", ""), e.attributes.file = n);
		let o = this._scripts[n];
		if (!o) {
			this._scripts[n] = !0;
			let e = await this._uiRoot.getFileAsBytes(n);
			I(e != null, `ScriptFile file not found at path ${n}`), this._scripts[n] = e;
			return;
		}
		if (this._phase == 1) return;
		let c = `${n} (id=${i || "''"})`;
		console.log("parsing.maki:", c);
		let l = o == 1 ? this._scripts[n] : parse(o, c), u = new r(this._uiRoot, l, a, c);
		t instanceof s ? t.addSystemObject(u) : (console.log(">>ScriptLoad at non group: ", `@${n}`, typeof t), this._uiRoot.addSystemObject(u));
	}
	async scripts(e, t) {
		await this.traverseChildren(e, t);
	}
	async sendparams(e, t) {
		O(e.children.length === 0, "Unexpected children in <sendparams> XML node."), t instanceof n && t._metaCommands.push(e);
	}
	async button(e, t) {
		return await this.newGui(d, e, t);
	}
	async wasabiButton(e, t) {
		return this._res.bitmaps["studio.button"] = !1, this._res.bitmaps["studio.button.pressed"] = !1, this._res.bitmaps["studio.button.upperLeft"] = !1, this._res.bitmaps["studio.button.top"] = !1, this._res.bitmaps["studio.button.upperRight"] = !1, this._res.bitmaps["studio.button.left"] = !1, this._res.bitmaps["studio.button.middle"] = !1, this._res.bitmaps["studio.button.right"] = !1, this._res.bitmaps["studio.button.lowerLeft"] = !1, this._res.bitmaps["studio.button.bottom"] = !1, this._res.bitmaps["studio.button.lowerRight"] = !1, this._res.bitmaps["studio.button.pressed.upperLeft"] = !1, this._res.bitmaps["studio.button.pressed.top"] = !1, this._res.bitmaps["studio.button.pressed.upperRight"] = !1, this._res.bitmaps["studio.button.pressed.left"] = !1, this._res.bitmaps["studio.button.pressed.middle"] = !1, this._res.bitmaps["studio.button.pressed.right"] = !1, this._res.bitmaps["studio.button.pressed.lowerLeft"] = !1, this._res.bitmaps["studio.button.pressed.bottom"] = !1, this._res.bitmaps["studio.button.pressed.lowerRight"] = !1, await this.buildWasabiButtonFace(), this.newGui(WasabiButton, e, t);
	}
	async buildWasabiButtonFace() {
		if (!this._uiRoot.getBitmap("studio.button")) {
			let e = this._uiRoot.getBitmap("studio.button.upperLeft");
			if (e) {
				let t = this._uiRoot.getBitmap("studio.button.lowerRight"), n = {
					id: "studio.button",
					file: e.getFile(),
					x: String(e.getLeft()),
					y: String(e.getTop()),
					w: String(t.getLeft() - e.getLeft() + t.getWidth()),
					h: String(t.getTop() - e.getTop() + t.getHeight())
				}, r = new _("bitmap", { ...n });
				await this.bitmap(r), e = this._uiRoot.getBitmap("studio.button.pressed.upperLeft"), t = this._uiRoot.getBitmap("studio.button.pressed.lowerRight"), n = {
					id: "studio.button.pressed",
					file: e.getFile(),
					x: String(e.getLeft()),
					y: String(e.getTop()),
					w: String(t.getLeft() - e.getLeft() + t.getWidth()),
					h: String(t.getTop() - e.getTop() + t.getHeight())
				};
				let i = new _("bitmap", { ...n });
				await this.bitmap(i);
			} else {
				if (!this._uiRoot.hasBitmapFilepath("window/window-elements.png")) return;
				let e = {
					id: "studio.button",
					file: "window/window-elements.png",
					x: "1",
					y: "135",
					w: "31",
					h: "31"
				}, t = new _("bitmap", { ...e });
				await this.bitmap(t), e = {
					id: "studio.button.pressed",
					file: "window/window-elements.png",
					x: "67",
					y: "135",
					w: "31",
					h: "31"
				};
				let n = new _("bitmap", { ...e });
				await this.bitmap(n);
			}
			await this._imageManager.ensureBitmapsLoaded();
		}
	}
	async toggleButton(e, t) {
		return this.newGui(w, e, t);
	}
	async nStateButton(e, t) {
		return this.newGui(NStateButton, e, t);
	}
	async color(e, t) {
		O(e.children.length === 0, "Unexpected children in <color> XML node.");
		let n = new W();
		n.setXmlAttributes(e.attributes), this._uiRoot.addColor(n);
	}
	async elementalias(e) {
		O(e.children.length === 0, "Unexpected children in <elementalias> XML node."), this._uiRoot.addAlias(e.attributes.id, e.attributes.target);
	}
	async slider(e, t) {
		return this.newGui(R, e, t);
	}
	async groupdef(e, t) {
		this._uiRoot.addGroupDef(e), e.attributes.windowtype && await this.appendToBucket(e);
	}
	async appendToBucket(e) {
		let t = e.attributes.windowtype;
		e.attributes.attached = "0", this._uiRoot.addBucketEntry(t, e);
	}
	async rebuildBuckets() {
		for (let e of this._uiRoot._buckets) {
			let t = e._wndType;
			console.log(`rebuild Bucket "${t}"`, e);
			for (let n of this._uiRoot.getBucketEntries(t)) {
				let t = new _("dummy", { id: n.attributes.id });
				await this.group(t, e);
			}
		}
	}
	async rebuildBuckets0() {
		for (let [e, t] of Object.entries(this._uiRoot._buckets)) {
			console.log(`rebuild Bucket "${e}"`, t);
			for (let n of this._uiRoot.getBucketEntries(e)) if (n.attributes.attached == "0") {
				let e = new _("dummy", { id: n.attributes.id });
				await this.group(e, t);
			}
		}
	}
	async albumart(e, t) {
		return this.newGui(E, e, t);
	}
	async layer(e, t) {
		return this.newGui(i, e, t);
	}
	async grid(e, t) {
		return this.newGui(Grid, e, t);
	}
	async progressGrid(e, t) {
		return this.newGui(ProgressGrid, e, t);
	}
	async animatedLayer(e, t) {
		return this.newGui(C, e, t);
	}
	async images(e, t) {
		return this.newGui(Images, e, t);
	}
	async maybeApplyGroupDef(e, t) {
		let n = t.attributes.id;
		await this.maybeApplyGroupDefId(e, n);
	}
	async maybeApplyGroupDefId(e, t) {
		let n = this._uiRoot.getGroupDef(t);
		n != null && (e.setXmlAttributes(n.attributes), n.attributes.inherit_group && await this.maybeApplyGroupDefId(e, n.attributes.inherit_group), await this.traverseChildren(n, e));
	}
	async layout(e, t) {
		return this.newGroup(a, e, t);
	}
	async gammaset(e, t) {
		let n = [];
		await this.traverseChildren(e, n), this._uiRoot.addGammaSet(e.attributes.id, n);
	}
	async gammagroup(e, t) {
		O(e.children.length === 0, "Unexpected children in <gammagroup> XML node.");
		let n = new F();
		n.setXmlAttributes(e.attributes), t.push(n);
	}
	async component(e, t) {
		let n = e.attributes.param ?? e.attributes.hold ?? "", r = this._uiRoot.guid2alias(n);
		if (r === "vis") return this.newGui(L, e, t);
		if (r == "pl") return await this.buildWasabiButtonFace(), this.newGui(j, e, t);
		await this.traverseChildren(e, t);
	}
	async windowholder(e, t) {
		let n = await this.newGroup(k, e, t), r = e.attributes.hold;
		if (r && r.toLowerCase() == "guid:{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}") {
			await this.buildWasabiButtonFace();
			let e = new _("component", { fitparent: "1" });
			await this.newGui(j, e, n);
		}
		return n;
	}
	async container(e) {
		let n = new t(this._uiRoot);
		return n.setXmlAttributes(e.attributes), this._uiRoot.addContainers(n), await this.traverseChildren(e, n), n;
	}
	async colorThemesList(e, t) {
		return this.buildWasabiScrollbarDimension(), this.newGui(ColorThemesList, e, t);
	}
	buildWasabiScrollbarDimension() {
		this._uiRoot.addWidth("vscrollbar-width", "wasabi.scrollbar.vertical.left"), this._uiRoot.addHeight("vscrollbar-btn-height", "wasabi.scrollbar.vertical.left"), this._uiRoot.addHeight("vscrollbar-thumb-height", "wasabi.scrollbar.vertical.button"), this._uiRoot.addHeight("vscrollbar-thumb-height2", "studio.scrollbar.vertical.button"), this._uiRoot.addHeight("hscrollbar-height", "wasabi.scrollbar.horizontal.left"), this._uiRoot.addWidth("hscrollbar-btn-width", "wasabi.scrollbar.horizontal.left"), this._uiRoot.addWidth("hscrollbar-thumb-width", "wasabi.scrollbar.horizontal.button"), this._uiRoot.addWidth("hscrollbar-thumb-width2", "studio.scrollbar.horizontal.button");
	}
	async layoutStatus(e, t) {
		O(e.children.length === 0, "Unexpected children in <layoutStatus> XML node.");
	}
	async xuiElement(e, t) {
		O(e.children.length === 0, "Unexpected children in XUI XML node.");
	}
	async status(e, t) {
		return this.newGui(o, e, t);
	}
	async eqvis(e, t) {
		return O(e.children.length === 0, "Unexpected children in <eqvis> XML node."), await this.newGui(x, e, t);
	}
	async vis(e, t) {
		return this.newGui(p, e, t);
	}
	async trueTypeFont(t, n) {
		O(t.children.length === 0, "Unexpected children in <truetypefont> XML node.");
		let r = new e();
		r.setXmlAttributes(t.attributes), await r.ensureFontLoaded(this._imageManager), this._uiRoot.addFont(r);
	}
	async include(e, t) {
		let { file: n, parent_path: r } = e.attributes;
		I(n != null, "Include element missing `file` attribute");
		let i = [], a = [], o = this._includedXml[n];
		if (!o) {
			this._includedXml[n] = !0;
			let e = r ? r.split("/") : [], c = n.replace("@DEFAULTSKINPATH@", "").split("/"), l = c.pop(), u = [
				...e,
				...c,
				l
			].join("/"), d;
			try {
				d = await this._uiRoot.getFileAsString(u);
			} catch {
				console.warn(`botFailed to load: ${u}. par:${r}`);
			}
			if (d == null) {
				console.warn(`Zip file not found: ${u} out of: `);
				return;
			}
			let f = [...e, ...c].join("/");
			var s = this;
			let recursiveScanChildren = (e) => {
				var n = [];
				for (let r of e.children) if (r instanceof _) {
					let e = r.name.toLowerCase();
					if (e == "groupdef") {
						recursiveScanChildren(r), s.groupdef(r, null);
						continue;
					}
					if (G.indexOf(e) >= 0) {
						i.push(s.traverseChild(r, t));
						continue;
					}
					e == "script" ? i.push(s.script(r, t)) : e == "include" && (r.attributes.parent_path = f, r.attributes.parent_path = f, a.push(r)), recursiveScanChildren(r), n.push(r);
				}
				e.children.splice(0, e.children.length, ...n);
			};
			o = this.parseXmlFragment(d), recursiveScanChildren(o), this._includedXml[n] = o;
			for (let e of a) i.push(s.include(e, t));
			return Promise.all(i);
		}
		this._phase != 1 && (o instanceof _ || o instanceof N) && await this.traverseChildren(o, t);
	}
	async scanIncludes(e, t) {
		return await Promise.all(e.children.map((e) => {
			if (e instanceof _ && e.name.toLowerCase() == "include") return this.include(e, t);
		}));
	}
	skininfo(e, t) {
		let n = {};
		for (let t of e.children) if (t instanceof _) {
			let e = t.name.toLowerCase();
			n[e] = t.text;
		}
		this._uiRoot.setSkinInfo(n);
	}
	parseXmlFragment(e) {
		return T(`<wrapper>${substituteSkinTokens(e)}</wrapper>`);
	}
};
SkinEngineWAL.canProcess = (e) => e.endsWith(".wal") || e.endsWith(".zip") || e.endsWith("/"), SkinEngineWAL.identifyByFile = (e) => "skin.xml", SkinEngineWAL.priority = 1, m(SkinEngineWAL);
//#endregion
