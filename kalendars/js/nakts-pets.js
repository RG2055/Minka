/* Nakts pets: cats and mice living in the Nakts rooms.

   The cats are 3D renders of the intro's rigged cat (scripts/blender/nakts_cats.py),
   the mouse, the fight cloud and the box come from nakts_props.py; all are
   sprite sheets (scripts/build-nakts-pets.py). Each cat has its own temper
   (what it likes to do, how long). A small director in each room lets only
   one big event happen at a time: a fight under a bed (the bed shakes, a dust
   cloud with stars), or the duvet: one cat pulls a bed's own duvet off onto
   the floor, later another cat drags it back up. Cats walk in straight lines
   (along or across the room, turning at corners), never through beds or walls;
   they like the box in the corner. Click a cat: it answers; click a mouse: it
   runs and a cat gives chase.

   Cheap: only while the Nakts panel is open and the tab is visible; a few
   absolutely placed elements moved with transform (compositor only); sprite
   frames change 12 times a second. Reduced motion: the cats just sleep. */
(function () {
  'use strict';
  var BASE = 'assets/rooms/pets/', REV = '?v=20260927pets5';
  // The rendered rooms (scripts/blender/nakts_rooms.py): floor corners as fractions of the picture.
  var GEO = {
    main: { W: 440, H: 332, back: 0.1046, front: 0.9143, bx: [0.1072, 0.8928], fx: [0.0534, 0.9466], box: 'right' },
    nmp: { W: 232, H: 332, back: 0.1044, front: 0.9145, bx: [0.1364, 0.8636], fx: [0.0866, 0.9134], box: null }
  };
  var Y_MIN = 0.2, Y_MAX = 0.855;      // feet stay on the visible floor (the front wall's top is at 0.858)
  var SIDE_M = 34;                     // a cat is about 70 px long: keep it inside the side walls
  var CAT_SCALE = 1.0, BOX_SCALE = 0.9;
  // Frames a second per motion: calm ones slow (no twitching), a run quick.
  var ANIM_FPS = { walk: 12, run: 16, sit: 6, groom: 8, loaf: 5, sleep: 4, belly: 5, jump: 12, pounce: 12, bat: 10, hiss: 8, scratch: 10, tug: 10 };
  // Speeds matching the stride in the pictures (feet do not slide): px a second.
  var WALK_V = 23, RUN_V = 70;
  // Who lives where, and their tempers (weights of what they choose to do next).
  var CAST = {
    main: [
      { coat: 'ginger', name: 'Rudais', likes: { wander: 5, zoom: 2, sit: 3, groom: 2, nap: 2, belly: 2, hop: 3, box: 3, scratch: 2, chase: 5, play: 3 } },
      { coat: 'black', name: 'Melnais', likes: { wander: 3, zoom: 1, sit: 3, groom: 3, nap: 5, belly: 1, hop: 4, box: 4, scratch: 3, chase: 2, play: 1 } }
    ],
    nmp: [
      { coat: 'grey', name: 'Pelēkais', likes: { wander: 3, zoom: 1, sit: 4, groom: 4, nap: 4, belly: 2, hop: 3, box: 4, scratch: 2, chase: 3, play: 2 } }
    ]
  };
  var M = null, loading = null, rooms = {}, raf = 0, lastT = 0, running = false;

  function now() { return performance.now() / 1000; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function level() { return document.documentElement.getAttribute('data-motion') || 'full'; }
  function weighted(w) {
    var sum = 0, k; for (k in w) sum += w[k];
    var r = Math.random() * sum; for (k in w) { r -= w[k]; if (r <= 0) return k; }
    return k;
  }
  function load() {
    if (M) return Promise.resolve(M);
    if (!loading) loading = fetch(BASE + 'pets.json' + REV).then(function (r) { return r.json(); }).then(function (j) { M = j; return j; });
    return loading;
  }
  function hiDpi() { return (window.devicePixelRatio || 1) > 1.2; }
  function sheetUrl(name) { return 'url("' + BASE + name + (hiDpi() ? '-2x' : '-1x') + '.webp' + REV + '")'; }

  // ── the floor ──
  function floorX(g, y, m) {           // left and right edge of the floor at height y (px), m inside
    var k = (y / g.H - g.back) / (g.front - g.back);
    return [(g.bx[0] + (g.fx[0] - g.bx[0]) * k) * g.W + m, (g.bx[1] + (g.fx[1] - g.bx[1]) * k) * g.W - m];
  }
  function clampFloor(g, p, m) {
    var y = Math.max(Y_MIN * g.H, Math.min(Y_MAX * g.H, p.y)), xs = floorX(g, y, m == null ? SIDE_M : m);
    return { x: Math.max(xs[0], Math.min(xs[1], p.x)), y: y };
  }
  function obstacles(room) { return room.beds.concat(room.box ? [room.box.rect] : []); }
  function inside(r, x, y, m) { return x > r.x0 - m && x < r.x1 + m && y > r.y0 - m && y < r.y1 + m; }
  function blocked(room, p, m) { return obstacles(room).some(function (r) { return inside(r, p.x, p.y, m); }); }
  function freePoint(room) {
    for (var i = 0; i < 50; i++) {
      var g = room.g, p = clampFloor(g, { x: rnd(0, g.W), y: rnd(Y_MIN * g.H, Y_MAX * g.H) });
      if (!blocked(room, p, 16)) return p;
    }
    return clampFloor(room.g, { x: room.g.W * 0.6, y: room.g.H * 0.8 });
  }
  // A straight, axis-aligned leg a-b crosses an obstacle (grown by m)?
  function legHits(room, a, b, m) {
    return obstacles(room).some(function (r) {
      if (Math.abs(a.y - b.y) < 0.5) return a.y > r.y0 - m && a.y < r.y1 + m && Math.max(a.x, b.x) > r.x0 - m && Math.min(a.x, b.x) < r.x1 + m;
      return a.x > r.x0 - m && a.x < r.x1 + m && Math.max(a.y, b.y) > r.y0 - m && Math.min(a.y, b.y) < r.y1 + m;
    });
  }
  /* Straight legs only (a side view moves across, a front or back view moves
     up and down), found on a grid of 8 px cells over the floor (its sides narrow
     to the back wall), round the beds and the box, with as few turns as can be. */
  var CELL = 8;
  // Which cells are floor a pet can walk on: worked out once per room and side margin
  // (again when the beds are measured or the box is placed).
  function floorGrid(room, m) {
    var key = m + '|' + room.gridRev, G = room.grids && room.grids[key];
    if (G) return G;
    var g = room.g, cols = Math.ceil(g.W / CELL), rows = Math.ceil(g.H / CELL), ok = new Uint8Array(cols * rows);
    for (var cy = 0; cy < rows; cy++) {
      var y = (cy + 0.5) * CELL;
      if (y < Y_MIN * g.H - CELL / 2 || y > Y_MAX * g.H + CELL / 2) continue;
      var xs = floorX(g, y, m);
      for (var cx = 0; cx < cols; cx++) {
        var x = (cx + 0.5) * CELL;
        if (x >= xs[0] - CELL / 2 && x <= xs[1] + CELL / 2 && !blocked(room, { x: x, y: y }, 8)) ok[cy * cols + cx] = 1;
      }
    }
    room.grids = {}; room.grids[key] = G = { cols: cols, rows: rows, ok: ok };
    return G;
  }
  // A small binary heap of states by distance.
  function Heap() { this.k = []; this.d = []; }
  Heap.prototype.push = function (key, dist) {
    var k = this.k, d = this.d, i = k.length; k.push(key); d.push(dist);
    while (i > 0) { var p = (i - 1) >> 1; if (d[p] <= dist) break; k[i] = k[p]; d[i] = d[p]; i = p; }
    k[i] = key; d[i] = dist;
  };
  Heap.prototype.pop = function () {
    var k = this.k, d = this.d, top = k[0], lk = k.pop(), ld = d.pop(), n = k.length, i = 0;
    if (n) {
      while (true) {
        var l = 2 * i + 1, r = l + 1, m = i, md = ld;
        if (l < n && d[l] < md) { m = l; md = d[l]; }
        if (r < n && d[r] < md) { m = r; md = d[r]; }
        if (m === i) break;
        k[i] = k[m]; d[i] = d[m]; i = m;
      }
      k[i] = lk; d[i] = ld;
    }
    return top;
  };
  function route(room, a, b, side) {
    var G = floorGrid(room, side == null ? SIDE_M : side), cols = G.cols, rows = G.rows, n = cols * rows, grid = G.ok;
    function cell(p) { return Math.max(0, Math.min(rows - 1, Math.floor(p.y / CELL))) * cols + Math.max(0, Math.min(cols - 1, Math.floor(p.x / CELL))); }
    var s0 = cell(a), s1 = cell(b);
    function ok(c) { return grid[c] || c === s0 || c === s1; }   // wherever the pet is and wherever it goes
    // Dijkstra over (cell, heading): a step costs 1, a turn 6
    var dist = new Float32Array(n * 4).fill(1e9), prev = new Int32Array(n * 4).fill(-1), done = new Uint8Array(n * 4);
    var DX = [1, -1, 0, 0], DY = [0, 0, 1, -1], open = new Heap();
    for (var d = 0; d < 4; d++) { dist[s0 * 4 + d] = 0; open.push(s0 * 4 + d, 0); }
    var end = -1;
    while (open.k.length) {
      var st = open.pop();
      if (done[st]) continue; done[st] = 1;
      var c = st >> 2, h = st & 3;
      if (c === s1) { end = st; break; }
      var ccx = c % cols, ccy = (c / cols) | 0;
      for (var k = 0; k < 4; k++) {
        var nx = ccx + DX[k], ny = ccy + DY[k];
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        var nc = ny * cols + nx; if (!ok(nc)) continue;
        var ns = nc * 4 + k, nd = dist[st] + 1 + (k === h ? 0 : 6);
        if (nd < dist[ns]) { dist[ns] = nd; prev[ns] = st; open.push(ns, nd); }
      }
    }
    if (end < 0) return [{ x: b.x, y: a.y }, b];
    var cells = [];
    for (var q = end; q >= 0; q = prev[q]) cells.push(q);
    cells.reverse();
    // the corners, as points: the first leg runs from the pet, the last to the goal
    var pts = [], hd = -1;
    for (var j = 1; j < cells.length; j++) {
      var hj = cells[j] & 3;
      if (hd >= 0 && hj !== hd) { var cc = cells[j - 1] >> 2; pts.push({ x: (cc % cols + 0.5) * CELL, y: (((cc / cols) | 0) + 0.5) * CELL, h: hd }); }
      hd = hj;
    }
    if (pts.length) {
      var f = pts[0]; if (f.h < 2) f.y = a.y; else f.x = a.x;
      var l = pts[pts.length - 1]; if (hd < 2) l.y = b.y; else l.x = b.x;
    }
    var out = pts.map(function (p) { return { x: p.x, y: p.y }; });
    var last = out.length ? out[out.length - 1] : a;
    if (Math.abs(last.x - b.x) > 0.5 && Math.abs(last.y - b.y) > 0.5) out.push(hd < 2 ? { x: b.x, y: last.y } : { x: last.x, y: b.y });
    out.push({ x: b.x, y: b.y });
    return out;
  }
  function depthScale(g, y) { return 0.9 + 0.1 * Math.max(0, Math.min(1, (y / g.H - g.back) / (g.front - g.back))); }
  function zAt(g, y) { return 20 + Math.round(y / g.H * 100); }

  // ── sprites ──
  function Sprite(room, kind, sheet) {
    var el = document.createElement('div'), d = M[kind];
    el.className = 'ns-pet ns-pet-' + kind;
    el.style.width = el.style.height = d.frame + 'px';
    el.style.backgroundImage = sheetUrl(sheet);
    if (d.cols) el.style.backgroundSize = (d.cols * d.frame) + 'px auto';
    else el.style.backgroundSize = d.frame + 'px ' + d.frame + 'px';
    el.style.transformOrigin = (d.anchor[0] * d.frame) + 'px ' + (d.anchor[1] * d.frame) + 'px';
    room.layer.appendChild(el);
    return { el: el, kind: kind, d: d, row: -1, col: -1 };
  }
  function show(s, key, col) {
    var r = s.d.rows[key]; if (!r) return;
    if (s.row === r.row && s.col === col) return;
    s.row = r.row; s.col = col;
    s.el.style.backgroundPosition = (-col * s.d.frame) + 'px ' + (-r.row * s.d.frame) + 'px';
  }
  function put(s, g, x, y, lift, flip, z, scale) {
    var d = s.d, k = (scale || 1) * depthScale(g, y);
    var tx = x - d.anchor[0] * d.frame, ty = y - d.anchor[1] * d.frame - (lift || 0);
    var t = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(' + (flip ? -k : k).toFixed(3) + ',' + k.toFixed(3) + ')';
    if (s.t !== t) { s.t = t; s.el.style.transform = t; }
    if (s.z !== z) { s.z = z; s.el.style.zIndex = z; }
  }

  // ── a cat ──
  function Cat(room, cast) {
    this.room = room; this.cast = cast;
    this.s = Sprite(room, 'cat', 'cat-' + cast.coat);
    this.s.el.setAttribute('role', 'button');
    this.s.el.setAttribute('aria-label', cast.name);
    var p = freePoint(room);
    this.x = p.x; this.y = p.y; this.flip = Math.random() < 0.5; this.dir = 'side';
    this.anim = 'sit'; this.t = 0; this.lift = 0; this.path = []; this.speed = 0;
    this.bed = null; this.box = null; this.busy = false; this.hidden = false;
    this.until = now() + rnd(1, 4); this.next = null;
  }
  Cat.prototype.play = function (anim, dir, secs, next) {
    this.anim = anim; this.dir = dir || this.dir; this.t = 0; this.path = [];
    this.until = now() + (secs || 3); this.next = next || null;
  };
  Cat.prototype.goTo = function (p, run, then) {
    if (run && level() === 'reduced') run = false;      // calm: a walk, never a run
    p = clampFloor(this.room.g, p, Math.min(SIDE_M, p.m == null ? SIDE_M : p.m));
    this.path = route(this.room, { x: this.x, y: this.y }, p);
    this.run = !!run; this.speed = run ? RUN_V : WALK_V; this.anim = run ? 'run' : 'walk'; this.next = then || null; this.until = Infinity;
  };
  Cat.prototype.poked = function () {
    var r = Math.random();
    bubble(this, r < 0.5 ? 'mjau' : '♥');
    if (this.busy || this.jump) return;
    if (this.box) { this.play('loaf', 'front', 3); return; }
    if (this.anim === 'sleep') { this.play('sit', 'front', 2.5); return; }
    if (r < 0.3) this.play('belly', 'front', 3.5);
    else if (r < 0.55) this.play('hiss', 'side', 1.2);
    else if (r < 0.8 && !this.bed) this.goTo(freePoint(this.room), true);
    else this.play('groom', 'front', 3);
  };
  Cat.prototype.decide = function () {
    var room = this.room, self = this, what = weighted(this.cast.likes);
    if (this.box) { this.leaveBox(); return; }
    if (this.bed) {                                   // on a bed: rest, then get down
      if (Math.random() < 0.55 && this.anim !== 'sleep') { this.play(pick(['sleep', 'sit', 'groom', 'belly']), 'front', rnd(6, 16)); return; }
      this.jumpDown(); return;
    }
    if (what === 'chase' && room.mice.some(function (m) { return !m.hidden; })) { this.chase(); return; }
    if (what === 'hop' && room.beds.length) { this.hop(pick(room.beds)); return; }
    if (what === 'box' && room.box && !room.box.cat) { this.intoBox(room.box); return; }
    if (what === 'scratch' && room.beds.length) { this.scratch(pick(room.beds)); return; }
    if (what === 'zoom') {                              // a mad dash round the room
      var pts = [freePoint(room), freePoint(room), freePoint(room)];
      this.goTo(pts[0], true, function () { self.goTo(pts[1], true, function () { self.goTo(pts[2], true); }); });
      return;
    }
    if (what === 'sit') { this.play('sit', pick(['side', 'front']), rnd(3, 7)); return; }
    if (what === 'groom') { this.play('groom', pick(['front', 'side']), rnd(3, 6)); return; }
    if (what === 'nap') { this.play('sleep', 'front', rnd(14, 36)); return; }
    if (what === 'belly') { this.play('belly', 'front', rnd(3, 5)); return; }
    if (what === 'play') { this.play('bat', 'side', rnd(1.6, 3)); return; }
    this.goTo(freePoint(room), Math.random() < 0.3);   // mostly a walk, now and then a run
  };
  Cat.prototype.hop = function (bed, then, on) {
    var self = this, g = this.room.g;
    var from = clampFloor(g, { x: bed.x1 - bed.w * 0.25, y: bed.y1 + 12 });
    this.goTo(from, false, function () {
      self.leap(on || { x: bed.cx + bed.w * 0.06, y: bed.y0 + bed.h * 0.58 }, 30, function () { self.bed = bed; if (then) then(); else self.play('sit', 'front', rnd(2, 4)); });
    });
  };
  Cat.prototype.leapOnto = function (bed, on, then) {    // from beside the bed, straight up onto it
    var self = this;
    this.leap(on, 30, function () { self.bed = bed; if (then) then(); });
  };
  Cat.prototype.jumpDown = function (then, side) {
    var self = this, bed = this.bed, g = this.room.g;
    var to = clampFloor(g, side < 0 ? { x: bed.x0 - 30, y: bed.y1 + 14 } : { x: bed.x1 + 30, y: bed.y1 + 14 });
    this.leap(to, 24, function () { self.bed = null; if (then) then(); else self.play('sit', 'side', rnd(1, 3)); });
  };
  Cat.prototype.leap = function (to, height, then) {
    this.jump = { x0: this.x, y0: this.y, x1: to.x, y1: to.y, h: height, t0: now(), dur: 0.55 };
    this.flip = to.x < this.x; this.anim = 'jump'; this.dir = 'side'; this.t = 0; this.path = [];
    this.next = then; this.until = Infinity;
  };
  Cat.prototype.scratch = function (bed) {
    var g = this.room.g, y = bed.y0 + bed.h * 0.62, right = floorX(g, y, SIDE_M)[1] > bed.x1 + 16, self = this;
    var spot = { x: right ? bed.x1 + 4 : bed.x0 - 4, y: Math.max(Y_MIN * g.H, Math.min(Y_MAX * g.H, y)), m: 0 };
    if (blocked(this.room, spot, 4)) { this.goTo(freePoint(this.room), false); return; }
    this.goTo(spot, false, function () { self.flip = right; self.play('scratch', 'side', rnd(2, 3.2)); });
  };
  Cat.prototype.intoBox = function (box) {
    var self = this; box.cat = this;
    this.goTo(clampFloor(this.room.g, { x: box.x, y: box.y + 26 }), false, function () {
      self.leap({ x: box.x, y: box.y - 2 }, 20, function () { self.box = box; self.play('loaf', 'front', rnd(8, 22)); });
    });
  };
  Cat.prototype.leaveBox = function () {
    var self = this, box = this.box;
    this.leap(clampFloor(this.room.g, { x: box.x + (Math.random() < 0.5 ? -40 : 40), y: box.y + 28 }), 20, function () { self.box = null; box.cat = null; self.play('sit', 'side', rnd(1, 3)); });
  };
  Cat.prototype.chase = function () {
    var mice = this.room.mice.filter(function (m) { return !m.hidden; });
    if (!mice.length) { this.play('sit', 'front', 2); return; }
    var m = mice[0], self = this;
    this.chasing = m; m.flee();
    this.goTo({ x: m.x, y: m.y }, true, function () { self.chasing = null; self.play('pounce', 'side', 0.6, function () { self.play('sit', 'front', rnd(2, 4)); }); });
  };
  Cat.prototype.step = function (dt, T) {
    this.t += dt;
    var g = this.room.g;
    if (this.jump) {
      var J = this.jump, k = Math.min(1, (T - J.t0) / J.dur);
      this.x = J.x0 + (J.x1 - J.x0) * k; this.y = J.y0 + (J.y1 - J.y0) * k;
      this.lift = Math.sin(Math.PI * k) * J.h;
      this.frame = Math.min(5, Math.floor(k * 6));
      if (k >= 1) { this.jump = null; this.lift = 0; var n = this.next; this.next = null; if (n) n(); else this.play('sit', 'front', 2); }
    } else if (this.path.length) {
      if (this.chasing && !this.chasing.hidden && T - (this.rerouted || 0) > 0.5) {
        this.rerouted = T; this.path = route(this.room, { x: this.x, y: this.y }, clampFloor(g, { x: this.chasing.x, y: this.chasing.y }));
      }
      var p = this.path[0], dx = p.x - this.x, dy = p.y - this.y, dist = Math.abs(dx) + Math.abs(dy), v = this.speed * dt;
      if (Math.abs(dx) >= Math.abs(dy)) { this.dir = 'side'; this.flip = dx < 0; } else { this.dir = dy > 0 ? 'front' : 'back'; }
      if (dist <= v) {
        this.x = p.x; this.y = p.y; this.path.shift();
        if (!this.path.length) { var nx = this.next; this.next = null; if (nx) nx(); else this.play('sit', pick(['side', 'front']), rnd(2, 5)); }
      } else if (Math.abs(dx) >= Math.abs(dy)) this.x += Math.sign(dx) * Math.min(v, Math.abs(dx));
      else this.y += Math.sign(dy) * Math.min(v, Math.abs(dy));
    } else if (T > this.until) {
      var nn = this.next; this.next = null;
      if (nn) nn(); else if (!this.busy) this.decide();
    }
    this.draw(g);
  };
  Cat.prototype.draw = function (g) {
    if (this.hidden) { if (this.s.el.style.visibility !== 'hidden') this.s.el.style.visibility = 'hidden'; return; }
    if (this.s.el.style.visibility) this.s.el.style.visibility = '';
    var key = this.anim + '-' + this.dir;
    if (!this.s.d.rows[key]) { this.dir = this.s.d.rows[this.anim + '-side'] ? 'side' : 'front'; key = this.anim + '-' + this.dir; }
    var n = this.s.d.rows[key].frames;
    var col = this.anim === 'jump' ? (this.frame || 0) : Math.floor(this.t * (ANIM_FPS[this.anim] || 12)) % n;
    show(this.s, key, col);
    var z = this.box ? this.box.z : this.bed ? this.bed.z + 2 : (this.jump ? zAt(g, Math.max(this.jump.y0, this.jump.y1)) + 1 : zAt(g, this.y));
    put(this.s, g, this.x, this.y, this.lift, this.dir === 'side' && this.flip, z, CAT_SCALE);
    // In the box only what is between its sides shows (the front wall covers the rest).
    var fr = this.s.d.frame, sideCut = Math.max(0, fr / 2 - 21), below = Math.max(0, fr * (1 - this.s.d.anchor[1]) - 3);
    var clip = this.box && !this.jump ? 'inset(0 ' + sideCut + 'px ' + below.toFixed(1) + 'px ' + sideCut + 'px)' : '';
    if (this.clip !== clip) { this.clip = clip; this.s.el.style.clipPath = clip; }
  };

  // ── a mouse ──
  function Mouse(room) {
    this.room = room; this.s = Sprite(room, 'mouse', 'mouse');
    var p = freePoint(room); this.x = p.x; this.y = p.y; this.dir = 'side'; this.flip = false;
    this.anim = 'sit'; this.t = 0; this.path = []; this.until = now() + rnd(2, 5); this.hidden = false;
    this.s.el.setAttribute('aria-label', 'Pele');
  }
  Mouse.prototype.poked = function () {
    this.flee();
    var cats = this.room.cats.filter(function (c) { return !c.busy && !c.bed && !c.box && !c.jump; });
    if (cats.length) pick(cats).chase();
  };
  Mouse.prototype.hole = function () {      // a corner by the back wall
    var g = this.room.g, y = Y_MIN * g.H, xs = floorX(g, y, 14);
    return { x: Math.random() < 0.5 ? xs[0] : xs[1], y: y };
  };
  Mouse.prototype.flee = function () {
    if (this.hidden) return;
    var self = this; this.anim = 'run'; this.speed = 140;
    this.path = route(this.room, { x: this.x, y: this.y }, this.hole(), 12);
    this.onArrive = function () { self.hidden = true; self.until = now() + rnd(10, 22); };
  };
  Mouse.prototype.step = function (dt, T) {
    this.t += dt; var g = this.room.g;
    if (this.hidden) {
      if (this.s.el.style.visibility !== 'hidden') this.s.el.style.visibility = 'hidden';
      if (T > this.until) { var p = this.hole(); this.x = p.x; this.y = p.y + 6; this.hidden = false; this.anim = 'sit'; this.until = T + rnd(2, 4); }
      return;
    }
    if (this.s.el.style.visibility) this.s.el.style.visibility = '';
    if (this.path.length) {
      var q = this.path[0], dx = q.x - this.x, dy = q.y - this.y, dist = Math.abs(dx) + Math.abs(dy), v = this.speed * dt;
      if (Math.abs(dx) >= Math.abs(dy)) { this.dir = 'side'; this.flip = dx < 0; } else this.dir = dy > 0 ? 'front' : 'back';
      if (dist <= v) {
        this.x = q.x; this.y = q.y; this.path.shift();
        if (!this.path.length) { this.anim = 'sit'; this.until = T + rnd(2, 6); if (this.onArrive) { var a = this.onArrive; this.onArrive = null; a(); } }
      } else if (Math.abs(dx) >= Math.abs(dy)) this.x += Math.sign(dx) * Math.min(v, Math.abs(dx));
      else this.y += Math.sign(dy) * Math.min(v, Math.abs(dy));
    } else if (T > this.until) {
      // along the walls, now and then across
      var y = Math.random() < 0.5 ? Y_MIN * g.H : rnd(0.5, Y_MAX) * g.H, xs = floorX(g, y, 12);
      var to = { x: Math.random() < 0.6 ? (Math.random() < 0.5 ? xs[0] : xs[1]) : rnd(xs[0], xs[1]), y: y };
      if (!blocked(this.room, to, 6)) { this.anim = 'run'; this.speed = 80; this.path = route(this.room, { x: this.x, y: this.y }, to, 12); }
      else this.until = T + 1;
    }
    var key = this.anim === 'sit' ? 'sit-front' : 'run-' + this.dir;
    show(this.s, key, Math.floor(this.t * 10) % this.s.d.rows[key].frames);
    put(this.s, g, this.x, this.y, 0, this.anim !== 'sit' && this.dir === 'side' && this.flip, zAt(g, this.y));
  };

  // ── a room ──
  function measureBeds(room) {
    var shell = room.shell, sr = shell.getBoundingClientRect(), k = sr.width / room.g.W || 1;
    function rel(r) { return { x0: (r.left - sr.left) / k, x1: (r.right - sr.left) / k, y0: (r.top - sr.top) / k, y1: (r.bottom - sr.top) / k }; }
    room.beds = [].slice.call(shell.querySelectorAll('.ns-room-bed[data-i]')).map(function (el) {
      var pic = el.querySelector('.ns-room-bed-picture') || el, b = rel(pic.getBoundingClientRect());
      b.el = el; b.w = b.x1 - b.x0; b.h = b.y1 - b.y0; b.cx = (b.x0 + b.x1) / 2;
      b.z = zAt(room.g, b.y1);
      var dr = el.querySelector('.ns-bed-dream'); b.dream = dr ? rel(dr.getBoundingClientRect()) : null;
      el.style.setProperty('--room-bed-z', String(b.z));   // beds and pets drawn by their feet
      return b;
    }).filter(function (b) { return b.w > 4; });
    room.gridRev = (room.gridRev || 0) + 1;
  }
  function makeBox(room) {
    var g = room.g, y = 0.8 * g.H, xs = floorX(g, y, 30), x = g.box === 'right' ? xs[1] : xs[0];
    var box = { x: x, y: y, z: zAt(g, y), cat: null };
    box.back = Sprite(room, 'box', 'box-back'); box.front = Sprite(room, 'box', 'box-front');
    box.back.el.style.pointerEvents = box.front.el.style.pointerEvents = 'none';
    put(box.back, g, x, y, 0, false, box.z - 1, BOX_SCALE);
    put(box.front, g, x, y, 0, false, box.z + 1, BOX_SCALE);
    box.rect = { x0: x - 22, x1: x + 22, y0: y - 19, y1: y + 6 };
    room.box = box;
    room.gridRev = (room.gridRev || 0) + 1;
  }
  /* A click (not a drag) over a pet: the pet answers. The pets take no pointer
     events themselves, so a bed next to a cat still drags as always. */
  var downAt = null;
  function hitPet(room, e) {
    if (!downAt || Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 6) return;
    var hit = null;
    room.cats.concat(room.mice).forEach(function (p) {
      if (hit || p.hidden) return;
      var r = p.s.el.getBoundingClientRect(), ix = r.width * 0.3, iy = r.height * 0.25;
      if (e.clientX > r.left + ix && e.clientX < r.right - ix && e.clientY > r.top + iy && e.clientY < r.bottom - iy * 0.6) hit = p;
    });
    if (hit) hit.poked();
  }
  function listen(room) {
    if (room.shell.__petsClick) return;
    room.shell.__petsClick = true;
    room.shell.addEventListener('pointerdown', function (e) { downAt = [e.clientX, e.clientY]; }, true);
    room.shell.addEventListener('click', function (e) { hitPet(room, e); }, true);
  }
  function Room(kind, shell) {
    var content = shell.querySelector('.ns-room-scene-content'); if (!content) return null;
    var room = { kind: kind, shell: shell, g: GEO[kind], cats: [], mice: [], beds: [], layer: document.createElement('div'), director: { next: now() + rnd(35, 70), fightAt: now() + rnd(150, 260) } };
    room.layer.className = 'ns-pets';
    content.appendChild(room.layer);
    measureBeds(room);
    if (M.box && room.g.box) makeBox(room);          // the box is in the main room only
    CAST[kind].forEach(function (c) { room.cats.push(new Cat(room, c)); });
    room.mice.push(new Mouse(room));
    listen(room);
    return room;
  }
  function reattach(room) {           // the panel was drawn again: same pets, new room
    var shell = document.querySelector('#nsPanel .ns-room-' + room.kind + ' .ns-room-shell');
    if (!shell) return false;
    var content = shell.querySelector('.ns-room-scene-content'); if (!content) return false;
    room.shell = shell; content.appendChild(room.layer); listen(room);
    if (room.duvet) { if (room.duvet.heap) room.duvet.heap.remove(); room.duvet = null; }   // the new beds are whole again
    if (room.carry) { room.carry.el.remove(); room.carry = null; }
    [].slice.call(room.layer.querySelectorAll('.ns-pet-duvet,.ns-pet-slide,.ns-pet-drag')).forEach(function (el) { el.remove(); });
    measureBeds(room);
    room.cats.forEach(function (c) { if (c.bed) { c.bed = null; c.play('sit', 'front', 1); } c.hidden = false; c.busy = false; });
    return true;
  }

  // ── bubbles over a cat ──
  function bubble(cat, text) {
    var el = document.createElement('span'); el.className = 'ns-pet-bubble'; el.textContent = text;
    el.style.transform = 'translate(' + cat.x.toFixed(0) + 'px,' + (cat.y - 62 - (cat.lift || 0)).toFixed(0) + 'px)';
    el.style.zIndex = 250;
    cat.room.layer.appendChild(el);
    setTimeout(function () { el.remove(); }, 1300);
  }

  // ── the director: one big event at a time ──
  function freeCats(room) { return room.cats.filter(function (c) { return !c.busy && !c.jump && !c.bed && !c.box; }); }
  function fight(room) {
    var cats = freeCats(room);
    if (cats.length < 2 || !room.beds.length) return false;
    var a = cats[0], b = cats[1], bed = pick(room.beds), g = room.g;
    var spot = clampFloor(g, { x: bed.cx, y: bed.y1 - 6 }, 0);
    a.busy = b.busy = true;
    var arrived = 0, started = false;
    function begin() {
      if (started) return; started = true;
      a.hidden = b.hidden = true;
      var cloud = Sprite(room, 'fight', 'fight'); cloud.el.style.pointerEvents = 'none';
      var t0 = now();
      bed.el.classList.add('ns-bed-rumble');
      room.fx = { step: function (T) {
        show(cloud, 'fight', Math.floor((T - t0) * 12) % cloud.d.rows.fight.frames);
        put(cloud, g, spot.x, spot.y + 6, 0, false, bed.z + 3, 0.85);
        if (T - t0 > 3.2) {
          cloud.el.remove(); bed.el.classList.remove('ns-bed-rumble'); room.fx = null;
          a.hidden = b.hidden = false; a.x = b.x = spot.x; a.y = b.y = clampFloor(g, { x: spot.x, y: bed.y1 + 12 }).y;
          a.flip = true; b.flip = false;
          a.play('hiss', 'side', 0.7, function () { a.busy = false; a.goTo(freePoint(room), true); });
          b.play('hiss', 'side', 0.7, function () { b.busy = false; b.goTo(freePoint(room), true); });
        }
      } };
    }
    [a, b].forEach(function (c, i) {
      c.goTo(clampFloor(g, { x: spot.x + (i ? 12 : -12), y: bed.y1 + 12 }), true, function () { arrived++; c.play('hiss', 'side', 9); if (arrived === 2) begin(); });
    });
    setTimeout(begin, 7000);          // never wait for ever
    return true;
  }
  /* The duvet: the bed's own (nightsplit.js nsBedParts). A cat on the bed takes
     it in its teeth and pulls it off the bed's side: it slides down (rendered) and
     lies crumpled on the floor, and the sleeper shows in the bed (.ns-duvet-off).
     Later another cat takes a corner in its teeth, carries it back dragging it
     along the floor, jumps up and pulls it over the sleeper again. */
  var HEAP = { w: 150, h: 110 };                       // the heap's picture (css px), the heap at its middle
  var DRAG = { w: 200, h: 100, pin: [180, 50] };       // the carried duvet; its corner at pin
  var MOUTH = [28, -9.5];                              // a walking cat's mouth from its feet (css px, facing right)
  function piece(room, cls, url, w, h) {
    var el = document.createElement('div'); el.className = 'ns-pet ' + cls;
    el.style.cssText = 'width:' + w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;background-image:url("' + url + '");opacity:0';
    room.layer.appendChild(el);
    return el;
  }
  function fade(el, to, secs) { el.style.transition = (el.style.transition ? el.style.transition + ', ' : '') + 'opacity ' + secs + 's ease'; el.style.opacity = String(to); }
  function heapAt(el, x, y, scale, rot, z, secs) {
    el.style.transition = 'transform ' + (secs || 0) + 's cubic-bezier(.3,.7,.3,1), opacity .3s ease';
    el.style.transform = 'translate3d(' + (x - HEAP.w / 2).toFixed(1) + 'px,' + (y - HEAP.h / 2).toFixed(1) + 'px,0) rotate(' + (rot || 0) + 'deg) scale(' + scale + ')';
    el.style.zIndex = z;
  }
  function flatDuvet(room, bed, url) {
    var el = piece(room, 'ns-pet-duvet', url, bed.w, bed.h);
    el.style.transform = 'translate3d(' + bed.x0.toFixed(1) + 'px,' + bed.y0.toFixed(1) + 'px,0)'; el.style.zIndex = bed.z + 1; el.style.opacity = '1';
    return el;
  }
  // Sliding off the bed's side: rendered off its right, mirrored for its left.
  function slideDuvet(room, bed, url, side) {
    var w = bed.w * 400 / 256, h = bed.h * 380 / 364, el = piece(room, 'ns-pet-slide', url, w, h);
    el.style.transform = side > 0 ? 'translate3d(' + bed.x0.toFixed(1) + 'px,' + bed.y0.toFixed(1) + 'px,0)'
      : 'translate3d(' + (bed.x1 - w).toFixed(1) + 'px,' + bed.y0.toFixed(1) + 'px,0) scaleX(-1)';
    el.style.zIndex = bed.z + 1;
    return el;
  }
  function sideOf(room, bed) {                          // the side of the bed with more floor
    var xs = floorX(room.g, bed.y0 + bed.h * 0.7, 0);
    return xs[1] - bed.x1 >= bed.x0 - xs[0] ? 1 : -1;
  }
  function carry(room) {                                // the carried duvet follows the cat's mouth
    var C = room.carry; if (!C) return;
    var cat = C.cat, g = room.g, k = CAT_SCALE * depthScale(g, cat.y), left = cat.flip;
    var mx = cat.x + (left ? -MOUTH[0] : MOUTH[0]) * k, my = cat.y + MOUTH[1] * k - (cat.lift || 0);
    var t = 'translate3d(' + (mx - DRAG.pin[0]).toFixed(1) + 'px,' + (my - DRAG.pin[1]).toFixed(1) + 'px,0) scale(' + (left ? -k : k).toFixed(3) + ',' + k.toFixed(3) + ')';
    if (C.t !== t) { C.t = t; C.el.style.transform = t; }
    var f = Math.floor(now() * 6) % 4;
    if (C.f !== f) { C.f = f; C.el.style.backgroundPosition = '0 ' + (f * 100 / 3).toFixed(3) + '%'; }
    var z = zAt(g, cat.y) - 1; if (C.z !== z) { C.z = z; C.el.style.zIndex = z; }
  }
  function duvetOff(room) {
    if (room.duvet || !room.beds.length || typeof window.nsBedParts !== 'function') return false;
    var cats = freeCats(room); if (!cats.length) return false;
    var beds = room.beds.filter(function (b) { return b.el.hasAttribute('data-worker'); }); if (!beds.length) return false;
    var bed = pick(beds), cat = pick(cats), g = room.g, side = sideOf(room, bed);
    var img = bed.el.querySelector('.ns-room-bed-picture img'); if (!img) return false;
    cat.busy = true; room.lastPuller = cat;
    var hold = room.duvet = { pending: true };           // one duvet off at a time, from now on
    window.nsBedParts(bed.el).then(function (parts) {
      if (room.duvet !== hold) { cat.busy = false; return; }
      var on = { x: side > 0 ? bed.x1 - bed.w * 0.2 : bed.x0 + bed.w * 0.2, y: bed.y0 + bed.h * 0.6 };
      cat.hop(bed, function () {
        cat.flip = side > 0;                             // facing the duvet, pulling it backwards off the side
        cat.play('tug', 'side', 1.4, function () {
          var flat = flatDuvet(room, bed, parts.duvet), slide = slideDuvet(room, bed, parts.slide, side), heap = piece(room, 'ns-pet-heap', parts.heap, HEAP.w, HEAP.h);
          if (room.duvet !== hold) { flat.remove(); slide.remove(); heap.remove(); cat.busy = false; return; }
          var D = room.duvet = { bed: bed, side: side, heap: heap, img: img, orig: img.src, origSet: img.getAttribute('srcset'), origKey: img.__tintKey, parts: parts };
          img.removeAttribute('srcset'); img.src = parts.bare; img.__tintKey = 'pets-bare';
          bed.el.classList.add('ns-duvet-off');
          D.floor = clampFloor(g, { x: side > 0 ? bed.x1 + HEAP.w * 0.3 : bed.x0 - HEAP.w * 0.3, y: bed.y0 + bed.h * 0.72 }, 40);
          var edge = { x: side > 0 ? bed.x1 - 4 : bed.x0 + 4, y: bed.y0 + bed.h * 0.62 };
          heapAt(heap, edge.x, edge.y, 0.75, 0, bed.z + 3, 0);
          requestAnimationFrame(function () {
            fade(flat, 0, 0.25); fade(slide, 1, 0.25);
            setTimeout(function () {
              fade(slide, 0, 0.35); heap.style.opacity = '1';
              heapAt(heap, D.floor.x, D.floor.y, 1, side * 6, bed.z + 3, 0.6);
              setTimeout(function () { flat.remove(); slide.remove(); if (room.duvet === D) heap.style.zIndex = zAt(g, D.floor.y) - 1; }, 700);
            }, 380);
          });
          cat.jumpDown(function () { cat.busy = false; cat.goTo(freePoint(room), false); }, side);
          room.director.backAt = now() + rnd(20, 40);
        });
      }, on);
    }).catch(function () { cat.busy = false; if (room.duvet === hold) room.duvet = null; });
    return true;
  }
  // The beds were moved (dragged to other places): the game stops, the duvet is back on its bed.
  function cancelDuvet(room) {
    var D = room.duvet; if (!D) return;
    room.duvet = null;
    if (room.carry) { room.carry.el.remove(); room.carry = null; }
    [].slice.call(room.layer.querySelectorAll('.ns-pet-duvet,.ns-pet-slide,.ns-pet-drag,.ns-pet-heap')).forEach(function (el) { el.remove(); });
    if (!D.pending) {
      var img = D.img, dressed = img.__dressed; img.__dressed = null; img.__dressedKey = null;
      if (dressed) { img.src = dressed.src; img.__tintKey = dressed.key; }
      else { img.src = D.orig; if (D.origSet) img.setAttribute('srcset', D.origSet); img.__tintKey = D.origKey; }
      D.bed.el.classList.remove('ns-duvet-off');
    }
    room.cats.forEach(function (c) { if (c.busy) { c.busy = false; c.path = []; c.next = null; if (!c.jump && !c.bed) c.play('sit', 'front', 1); } });
  }
  function duvetBack(room) {
    var D = room.duvet; if (!D || D.pending || D.back) return false;
    var cats = freeCats(room); if (!cats.length) return false;
    var cat = cats.filter(function (c) { return c !== room.lastPuller; })[0] || cats[0], g = room.g, bed = D.bed, side = D.side;
    D.back = true; cat.busy = true;
    // by the heap, on its bed side, facing the bed; then along the floor to the bed's side
    var grab = clampFloor(g, { x: D.floor.x - side * 22, y: D.floor.y, m: 0 }, 20);
    var at = clampFloor(g, { x: side > 0 ? bed.x1 + 18 : bed.x0 - 18, y: D.floor.y, m: 0 }, 20);
    function gone() { if (room.duvet === D) return false; cat.busy = false; return true; }
    cat.goTo(grab, false, function () {
      if (gone()) return;
      cat.flip = side > 0;
      cat.play('tug', 'side', 0.8, function () {
        if (gone()) return;
        var drag = piece(room, 'ns-pet-drag', D.parts.drag, DRAG.w, DRAG.h);
        room.carry = { el: drag, cat: cat }; carry(room);
        fade(D.heap, 0, 0.2); fade(drag, 1, 0.2);
        cat.goTo(at, false, function () {
          if (gone()) { drag.remove(); if (room.carry && room.carry.el === drag) room.carry = null; return; }
          cat.flip = side > 0;
          var slide = slideDuvet(room, bed, D.parts.slide, side);
          cat.leapOnto(bed, { x: side > 0 ? bed.x1 - bed.w * 0.2 : bed.x0 + bed.w * 0.2, y: bed.y0 + bed.h * 0.6 }, function () {
            if (gone()) { slide.remove(); return; }
            cat.flip = side < 0;                         // on the bed, facing the duvet hanging down, pulling it up
            cat.play('tug', 'side', 1.0, function () {
              if (gone()) { slide.remove(); return; }
              var flat = flatDuvet(room, bed, D.parts.duvet); flat.style.opacity = '0';
              requestAnimationFrame(function () { fade(flat, 1, 0.45); fade(slide, 0, 0.45); });
              setTimeout(function () {
                var dressed = D.img.__dressed; D.img.__dressed = null; D.img.__dressedKey = null;   // its look changed while the duvet was off
                if (dressed) { D.img.src = dressed.src; D.img.__tintKey = dressed.key; }
                else { D.img.src = D.orig; if (D.origSet) D.img.setAttribute('srcset', D.origSet); D.img.__tintKey = D.origKey; }
                bed.el.classList.remove('ns-duvet-off');
                flat.remove(); slide.remove(); D.heap.remove(); room.duvet = null;
                var card = bed.el.querySelector('.ns-room-bed-card');
                if (card) { card.classList.remove('ns-bed-made'); void card.offsetWidth; card.classList.add('ns-bed-made'); }
              }, 520);
              cat.play('sit', 'front', 2.5, function () { cat.busy = false; cat.jumpDown(null, side); });
            });
          });
          // as it jumps, the dragged duvet goes up over the bed's side
          setTimeout(function () {
            if (room.duvet !== D) { drag.remove(); slide.remove(); return; }
            if (room.carry && room.carry.el === drag) room.carry = null;
            fade(drag, 0, 0.25); fade(slide, 1, 0.25);
            setTimeout(function () { drag.remove(); }, 300);
          }, 250);
        });
        cat.speed = WALK_V * 0.8;
      });
    });
    return true;
  }
  function direct(room, T) {
    var D = room.director;
    if (room.fx) return;
    if (room.duvet && D.backAt && T > D.backAt) { D.backAt = duvetBack(room) ? 0 : T + 5; return; }
    if (T < D.next) return;
    D.next = T + rnd(60, 120);
    var ok = false;
    if (T > D.fightAt && room.cats.length > 1) { ok = fight(room); if (ok) D.fightAt = T + rnd(180, 300); }
    if (!ok) duvetOff(room);
  }
  // A bed's dream is hidden while a cat is at that bed (on it, beside it, under its dream).
  function quietDreams(room) {
    room.beds.forEach(function (b) {
      if (!b.dream) return;
      var near = room.cats.some(function (c) {
        if (c.hidden) return false;
        if (c.bed === b) return true;
        var y = c.y - (c.lift || 0);
        return inside(b, c.x, y, 26) || inside(b.dream, c.x, y - 30, 22);
      });
      if (near !== b.quiet) { b.quiet = near; b.el.classList.toggle('ns-dream-quiet', near); }
    });
  }

  // ── the loop ──
  function sync() {
    if (window.__nsOverlayOpen !== true) return;
    if (document.documentElement.classList.contains('mk-mobile-shell')) return;
    load().then(function () {
      ['main', 'nmp'].forEach(function (kind) {
        var shell = document.querySelector('#nsPanel .ns-room-' + kind + ' .ns-room-shell');
        if (!shell) return;
        if (!rooms[kind]) { var r = Room(kind, shell); if (r) rooms[kind] = r; }
        else if (!rooms[kind].layer.isConnected || rooms[kind].shell !== shell) reattach(rooms[kind]);
        else measureBeds(rooms[kind]);
      });
      start();
    }).catch(function (e) { if (window.console) console.warn('Nakts pets:', e); });
  }
  function start() {
    if (running) return;
    running = true; lastT = now();
    raf = requestAnimationFrame(tick);
  }
  var quietAt = 0;
  function tick() {
    if (window.__nsOverlayOpen !== true) { running = false; return; }
    raf = requestAnimationFrame(tick);
    if (document.hidden) { lastT = now(); return; }
    var T = now(), dt = Math.min(0.1, T - lastT);
    // Old PCs (lite) and animations turned off (reduced, as work PCs often have it) take
    // 30 steps a second, the screen's own rate otherwise; with reduced the cats stay calm
    // (no running, no rattling beds). A step is a transform and a sprite frame: cheap.
    var lv = level();
    if (lv !== 'full' && dt < 1 / 30) return;
    lastT = T;
    var q = T - quietAt > 0.25; if (q) quietAt = T;
    Object.keys(rooms).forEach(function (k) {
      var room = rooms[k];
      if (!room.layer.isConnected) { if (!reattach(room)) return; }
      if (room.fx) room.fx.step(T);
      direct(room, T);
      room.cats.forEach(function (c) { c.step(dt, T); });
      carry(room);
      room.mice.forEach(function (m) { m.step(dt, T); });
      if (q) quietDreams(room);
    });
  }

  window.NaktsPets = {
    sync: sync,
    // for checking by hand: NaktsPets.act('main', 'duvet' | 'back' | 'fight')
    state: function () {
      return Object.keys(rooms).map(function (k) { return k + ': ' + rooms[k].cats.map(function (c) { return c.cast.coat + ' ' + c.anim + '-' + c.dir + ' busy=' + c.busy + ' bed=' + !!c.bed + ' box=' + !!c.box + ' path=' + c.path.length + ' at ' + Math.round(c.x) + ',' + Math.round(c.y); }).join(' | ') + (rooms[k].duvet ? ' duvet' : ''); });
    },
    // the beds were dragged to other places (nightsplit.js swapRoom)
    bedsMoved: function () {
      Object.keys(rooms).forEach(function (k) {
        var r = rooms[k];
        cancelDuvet(r);
        r.cats.forEach(function (c) { if (c.bed && !c.jump) c.jumpDown(); });
      });
      setTimeout(function () { Object.keys(rooms).forEach(function (k) { if (rooms[k].layer.isConnected) measureBeds(rooms[k]); }); }, 520);
    },
    act: function (kind, what) {
      var r = rooms[kind]; if (!r) return false;
      return what === 'fight' ? fight(r) : what === 'back' ? duvetBack(r) : duvetOff(r);
    }
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden) lastT = now(); });
})();
