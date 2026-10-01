/* Galerija kā Doom (2026-10-01): pastaiga pa zāli, kur uz sienām karājas
   komandas zīmējumi — katrai dežūrai savs posms, jaunākā pirmā. Zāles sākumā
   aiz stikla ir Nakts istaba: tie, kas šajā dienā strādā un guļ (Nakts
   sadalījuma plāns), guļ savās gultās, un arī tur pie sienas ir gleznas.
   Apakšā Doom statusa josla ar tavu dienas anonīmo dzīvnieku sejas vietā,
   rokā kafijas krūze.

   Dzinējs ir mazs "raycaster" (Wolfenstein/Doom princips): kanva 512×269 +
   josla 512×51, palielināta ar asiem pikseļiem. Sienas, grīda un griesti
   tiek zīmēti pa pikseļiem Uint32 buferī, gultas kā Doom spraiti, stikls kā
   caurspīdīga siena virs tiem. Tekstūras (128 px) uzģenerētas uz vietas, bez
   failiem. Kadru zīmē tikai, ja kaut kas mainās (kustība, ziņa, bilde
   ielādēta) un ne biežāk kā 35 reizes sekundē (Doom ritms); stāvot un
   paslēptā cilnē nedarbojas nekas. Fails ielādējas tikai pirmajā atvēršanā
   (mood-feedback.js), aizverot viss tiek atlaists.

   window.MinkaGallery3D.open({ items, sleepers, me, stats, origin, onDraw, onComments, dayTitle })
     items: [{ day, art, url, authorName, authorEmoji, at }]   (jaunākie pirmie)
     sleepers: [{ name, first, emoji, color, from, to, now }]
     me: { name, emoji, short }   stats: { today, coffee, comments } */
(function () {
  'use strict';
  var W = 512, VIEW_H = 269, HUD_H = 51, K = W / 320;      // K: the HUD is laid out at 320
  var TB = 7, TEX = 1 << TB, TM = TEX - 1;                 // 128 px textures
  var FOV = 0.66, MOVE = 2.6, RUN = 4.4, TURN = 2.4, RADIUS = 0.22;
  var HALL = 5;                                            // the hall's inner width, cells
  var ROOM_X0 = 7, ROOM_X1 = 10, ROOM_Y0 = 1, ROOM_Y1 = 5; // the night room, behind glass
  var EMPTY = 0, WALL = 1, PILLAR = 2, GLASS = 3, NIGHT = 4;
  var root = null, state = null;

  /* ── Tekstūras ────────────────────────────────────────────────────────── */
  function rnd(seed) { seed = seed >>> 0 || 1; return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  // Painted into ImageData directly (a fillRect a pixel would be slow at 128 px).
  function pixels(fn) {
    var c = canvas(TEX), ctx = c.getContext('2d'), img = ctx.createImageData(TEX, TEX), d = img.data;
    fn(function (x, y, r, g, b, a) { var i = (y * TEX + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a == null ? 255 : a; });
    ctx.putImageData(img, 0, 0);
    return c;
  }
  function data(c) { return new Uint32Array(c.getContext('2d').getImageData(0, 0, TEX, TEX).data.buffer.slice(0)); }
  function plasterCanvas() {
    var r = rnd(7);
    var c = pixels(function (set) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var n = (r() - 0.5) * 12 + Math.sin(x * 0.21 + y * 0.07) * 2;
        set(x, y, 216 + n, 212 + n, 204 + n);
      }
    });
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#3d3935'; ctx.fillRect(0, TEX - 11, TEX, 11);        // skirting board
    ctx.fillStyle = '#5b554f'; ctx.fillRect(0, TEX - 11, TEX, 2);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, TEX - 14, TEX, 3);
    return c;
  }
  function stoneCanvas() {
    var r = rnd(23);
    var c = pixels(function (set) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) { var n = (r() - 0.5) * 22; set(x, y, 136 + n, 131 + n, 124 + n); }
    });
    var ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(40,38,36,.5)';
    for (var y = 0; y < TEX; y += 32) { ctx.fillRect(0, y, TEX, 2); for (var x = (y / 32) % 2 ? 32 : 0; x < TEX; x += 64) ctx.fillRect(x, y, 2, 32); }
    return c;
  }
  function woodCanvas() {
    var r = rnd(5);
    return pixels(function (set) {
      for (var y = 0; y < TEX; y++) {
        var plank = (y / 16) | 0, tone = 0.86 + ((plank * 37) % 11) / 40;
        for (var x = 0; x < TEX; x++) {
          var g = Math.sin((x + plank * 23) * 0.18) * 7 + (r() - 0.5) * 9;
          var seam = y % 16 === 0 || (x + plank * 41) % TEX === 0;
          if (seam) set(x, y, 58, 35, 18);
          else set(x, y, (132 + g) * tone, (82 + g * 0.6) * tone, (44 + g * 0.4) * tone);
        }
      }
    });
  }
  function ceilingCanvas() {
    var r = rnd(31);
    return pixels(function (set) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var n = (r() - 0.5) * 10, edge = x % 64 < 3 || y % 64 < 3, lit = x % 64 === 3 || y % 64 === 3;
        if (edge) set(x, y, 44, 44, 47); else if (lit) set(x, y, 128, 128, 132); else set(x, y, 74 + n, 74 + n, 77 + n);
      }
    });
  }
  // the night room: the night panel's navy and its cyan edge
  function nightWallCanvas() {
    var r = rnd(17);
    var c = pixels(function (set) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) { var n = (r() - 0.5) * 6; set(x, y, 18 + n, 26 + n, 44 + n); }
    });
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#5fd0ff'; ctx.fillRect(0, TEX - 9, TEX, 2);
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, TEX - 7, TEX, 7);
    return c;
  }
  function nightFloorCanvas() {
    var r = rnd(19);
    return pixels(function (set) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var n = (r() - 0.5) * 5, seam = x % 64 === 0 || y % 64 === 0;
        set(x, y, seam ? 30 : 13 + n, seam ? 40 : 18 + n, seam ? 58 : 30 + n);
      }
    });
  }
  // A window into the night room: a metal frame and the glass (see-through,
  // a cool tint and a couple of streaks).
  function glassCanvas() {
    return pixels(function (set) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var frame = x < 6 || x >= TEX - 6 || y < 10 || y >= TEX - 22;
        if (frame) { var s = (x < 2 || x >= TEX - 2 || y < 2) ? 190 : 120; set(x, y, s, s + 4, s + 10, 255); continue; }
        var streak = Math.abs((x + y * 0.55) % 46 - 6) < 2 || Math.abs((x + y * 0.55 + 21) % 61 - 4) < 1;
        if (streak) set(x, y, 235, 246, 255, 70); else set(x, y, 150, 205, 235, 26);
      }
    });
  }
  // A drawing in a thin gilt frame, filling most of the wall, as in a gallery.
  function framedCanvas(img, base) {
    var c = canvas(TEX), ctx = c.getContext('2d');
    ctx.drawImage(base, 0, 0);
    var x = 18, y = 12, w = TEX - 36, h = 82;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = '#7a5418'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e2bd56'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#b48a2c'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = '#4a3410'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    var g = ctx.createLinearGradient(0, y + 5, 0, y + h - 5);
    g.addColorStop(0, '#13283f'); g.addColorStop(1, '#070c16');
    ctx.fillStyle = g; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    if (img) {
      var iw = w - 10, ih = h - 10, side = Math.min(iw, ih);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x + 5 + (iw - side) / 2, y + 5 + (ih - side) / 2, side, side);
    }
    return c;
  }
  // A bed seen from its foot, as in the night panel: pillow, the sleeper's
  // emoji, the blanket and the name plate. Built once, drawn as a sprite.
  function bedSprite(person) {
    var c = canvas(128, 96), ctx = c.getContext('2d');
    ctx.fillStyle = '#d9dde3'; roundRect(ctx, 14, 6, 100, 26, 10); ctx.fill();          // headboard
    ctx.fillStyle = '#f4f6f8'; roundRect(ctx, 22, 22, 84, 22, 9); ctx.fill();           // pillow
    ctx.font = '26px "Fluent Emoji Gaps", "Fluent Emoji Color", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(person.emoji || '🙂', 64, 31);
    var blanket = ctx.createLinearGradient(0, 40, 0, 76);
    blanket.addColorStop(0, person.color || '#6c7fc9'); blanket.addColorStop(1, shade(person.color || '#6c7fc9', -40));
    ctx.fillStyle = blanket; roundRect(ctx, 16, 40, 96, 36, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(18, 44, 92, 4);
    ctx.fillStyle = '#c9ced6'; roundRect(ctx, 8, 70, 112, 24, 9); ctx.fill();           // foot board
    ctx.fillStyle = '#2b3036'; roundRect(ctx, 26, 74, 76, 16, 6); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.fillText(String(person.first || '').toUpperCase().slice(0, 12), 64, 82.5);
    if (person.now) { ctx.fillStyle = '#cfe6ff'; ctx.font = '800 13px Inter, system-ui, sans-serif'; ctx.fillText('z', 104, 14); ctx.font = '800 9px Inter, system-ui, sans-serif'; ctx.fillText('z', 112, 6); }
    var d = ctx.getImageData(0, 0, 128, 96).data;
    return { w: 128, h: 96, px: new Uint32Array(d.buffer.slice(0)) };
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function shade(hex, d) {
    var v = parseInt(String(hex).replace('#', ''), 16);
    if (!isFinite(v)) return hex;
    var f = function (c) { return Math.max(0, Math.min(255, c + d)); };
    return 'rgb(' + f(v >> 16 & 255) + ',' + f(v >> 8 & 255) + ',' + f(v & 255) + ')';
  }

  /* ── Karte ────────────────────────────────────────────────────────────── */
  // The hall runs north (y up); each dežūra is a stretch of it with its
  // drawings on both walls and a row of pillars where it ends. By the lobby,
  // the night room lies east behind a glass wall.
  function buildMap(items, sleepers) {
    var days = [], byDay = {};
    items.forEach(function (it) { if (!byDay[it.day]) { byDay[it.day] = []; days.push(it.day); } byDay[it.day].push(it); });
    var segs = [], y = ROOM_Y1 + 2, slots = [];
    days.forEach(function (day) {
      var list = byDay[day], perSide = Math.ceil(list.length / 2), len = Math.max(4, perSide * 2 + 1);
      segs.push({ day: day, y0: y, y1: y + len, count: list.length });
      list.forEach(function (it, i) {
        var side = i % 2, row = y + 1 + Math.floor(i / 2) * 2;
        slots.push({ x: side ? HALL + 1 : 0, y: row, face: side ? 'w' : 'e', item: it });
      });
      y += len + 1;
    });
    var H = Math.max(y + 2, ROOM_Y1 + 6), Wm = ROOM_X1 + 2;
    var grid = new Uint8Array(Wm * H);
    for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < Wm; xx++) {
      var inHall = xx >= 1 && xx <= HALL && yy >= 1 && yy <= H - 2;
      var inRoom = xx >= ROOM_X0 && xx <= ROOM_X1 && yy >= ROOM_Y0 && yy <= ROOM_Y1;
      grid[yy * Wm + xx] = inHall ? EMPTY : inRoom ? EMPTY : (xx > HALL + 1 ? NIGHT : WALL);
    }
    // the glass between the lobby and the night room
    for (yy = ROOM_Y0; yy <= ROOM_Y1; yy++) grid[yy * Wm + HALL + 1] = GLASS;
    segs.forEach(function (s) {
      if (s.y1 < H - 1) { grid[s.y1 * Wm + 1] = PILLAR; grid[s.y1 * Wm + HALL] = PILLAR; }
    });
    // beds along the room's far wall; the newest drawings on its back wall
    var beds = (sleepers || []).slice(0, 5).map(function (p, i, all) {
      var span = ROOM_Y1 - ROOM_Y0 + 1, step = span / Math.max(1, all.length);
      return { x: ROOM_X1 - 0.15, y: ROOM_Y0 + step * (i + 0.5), person: p };
    });
    items.slice(0, 2).forEach(function (it, i) {
      slots.push({ x: ROOM_X0 + 1 + i * 2, y: ROOM_Y0 - 1, face: 's', item: it, night: true });
    });
    return { w: Wm, h: H, grid: grid, segs: segs, slots: slots, beds: beds };
  }

  /* ── Zīmēšana ─────────────────────────────────────────────────────────── */
  var SHADES = 32, luts = null;
  function makeLuts() {
    luts = [];
    for (var l = 0; l < SHADES; l++) {
      var f = 0.3 + 0.7 * (1 - l / (SHADES - 1)), lut = new Uint8Array(256);
      for (var i = 0; i < 256; i++) lut[i] = Math.min(255, Math.round(i * f));
      luts.push(lut);
    }
  }
  function shadeLevel(dist, side) { return Math.min(SHADES - 1, ((dist * 2.1) | 0) + (side ? 3 : 0)); }
  function px(c, lut) { return (255 << 24 | lut[(c >> 16) & 255] << 16 | lut[(c >> 8) & 255] << 8 | lut[c & 255]) >>> 0; }

  function render(st) {
    var buf = st.buf, H = VIEW_H, half = H / 2, map = st.map, mw = map.w, T = st.tex;
    var dirX = Math.cos(st.a), dirY = Math.sin(st.a), plX = -dirY * FOV, plY = dirX * FOV;
    // floor and ceiling, one row at a time (the night room has its own)
    for (var y = (half | 0) + 1; y < H; y++) {
      var rowDist = (0.5 * H) / (y - half);
      var sx = rowDist * 2 * plX / W, sy = rowDist * 2 * plY / W;
      var fx = st.x + rowDist * (dirX - plX), fy = st.y + rowDist * (dirY - plY);
      var lut = luts[shadeLevel(rowDist, 0)];
      var fo = y * W, co = (H - 1 - y) * W;
      for (var x = 0; x < W; x++) {
        var cx = Math.floor(fx), cy = Math.floor(fy);
        var ti = ((((fy - cy) * TEX) & TM) << TB) | (((fx - cx) * TEX) & TM);
        fx += sx; fy += sy;
        if (cx >= ROOM_X0) { buf[fo + x] = px(T.nightFloor[ti], lut); buf[co + x] = px(T.nightWall[ti], lut); }
        else { buf[fo + x] = px(T.floor[ti], lut); buf[co + x] = px(T.ceil[ti], lut); }
      }
    }
    // walls; a glass wall is remembered and the ray goes on through it
    st.aim = null;
    var glassCols = st.glassCols;
    for (x = 0; x < W; x++) {
      var cam = 2 * x / W - 1, rx = dirX + plX * cam, ry = dirY + plY * cam;
      var mx = st.x | 0, my = st.y | 0;
      var ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), stepX, stepY, sdx, sdy, side = 0, cell = 0, glass = -1, gside = 0, gwall = 0;
      if (rx < 0) { stepX = -1; sdx = (st.x - mx) * ddx; } else { stepX = 1; sdx = (mx + 1 - st.x) * ddx; }
      if (ry < 0) { stepY = -1; sdy = (st.y - my) * ddy; } else { stepY = 1; sdy = (my + 1 - st.y) * ddy; }
      for (var guard = 0; guard < 160; guard++) {
        if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; } else { sdy += ddy; my += stepY; side = 1; }
        cell = map.grid[my * mw + mx];
        if (cell === GLASS) {
          if (glass < 0) { glass = side ? sdy - ddy : sdx - ddx; gside = side; gwall = side === 0 ? st.y + glass * ry : st.x + glass * rx; }
          continue;
        }
        if (cell) break;
      }
      var perp = side ? sdy - ddy : sdx - ddx;
      if (perp < 0.0001) perp = 0.0001;
      st.zbuf[x] = perp;
      glassCols[x] = glass;
      st.glassX[x] = gwall - Math.floor(gwall);
      st.glassSide[x] = gside;
      var face = side === 0 ? (stepX > 0 ? 'w' : 'e') : (stepY > 0 ? 'n' : 's');
      var art = st.arts[mx + ',' + my + ',' + face] || null;
      var tex = art ? art.tex : cell === PILLAR ? T.stone : cell === NIGHT ? T.nightWall : T.plaster;
      var wallX = side === 0 ? st.y + perp * ry : st.x + perp * rx;
      wallX -= Math.floor(wallX);
      var tx = (wallX * TEX) | 0;
      if ((side === 0 && rx > 0) || (side === 1 && ry < 0)) tx = TM - tx;
      var lineH = H / perp, start = -lineH / 2 + half, end = lineH / 2 + half;
      var y0 = Math.max(0, start | 0), y1 = Math.min(H - 1, end | 0);
      var step = TEX / lineH, tpos = (y0 - start) * step;
      lut = luts[shadeLevel(perp, side)];
      for (y = y0; y <= y1; y++) {
        buf[y * W + x] = px(tex[((tpos & TM) << TB) | tx], lut);
        tpos += step;
      }
      if (x === W >> 1 && art && perp < 3.4 && glass < 0) st.aim = { kind: 'art', art: art };
    }
    drawBeds(st, dirX, dirY, plX, plY);
    drawGlass(st);
    st.ctx.putImageData(st.img, 0, 0);
    // the hand with the coffee, bobbing as you walk
    if (st.cup) {
      var bob = st.walk, cw = st.cup.width;
      st.ctx.drawImage(st.cup, (W / 2 - cw / 2 + Math.sin(bob) * 10) | 0, (VIEW_H - st.cup.height + 22 + Math.abs(Math.cos(bob)) * 7) | 0);
    }
    // crosshair, warm over something to look at
    var c = st.ctx, mid = VIEW_H / 2;
    c.fillStyle = st.aim ? '#ffd166' : 'rgba(255,255,255,.55)';
    c.fillRect(W / 2 - 1, mid - 6, 2, 4); c.fillRect(W / 2 - 1, mid + 3, 2, 4);
    c.fillRect(W / 2 - 6, mid - 1, 4, 2); c.fillRect(W / 2 + 3, mid - 1, 4, 2);
    // the message line, top left, as in Doom
    var msg = '';
    if (st.aim && st.aim.kind === 'art') msg = (st.aim.art.item.authorName ? st.aim.art.item.authorName + '. ' : '') + 'Klikšķis vai E: apskatīt';
    else if (st.aim && st.aim.kind === 'bed') msg = st.aim.bed.person.name + (st.aim.bed.person.from ? ' guļ ' + st.aim.bed.person.from + '–' + st.aim.bed.person.to : '') + (st.aim.bed.person.now ? ', tagad' : '');
    else if (st.msg && performance.now() < st.msgUntil) msg = st.msg;
    if (msg) {
      c.font = '700 12px Inter, system-ui, sans-serif';
      c.textBaseline = 'top';
      c.fillStyle = '#000'; c.fillText(msg, 8, 8);
      c.fillStyle = '#e8d07a'; c.fillText(msg, 7, 7);
    }
  }
  // the sleepers' beds, Doom sprites behind the glass
  function drawBeds(st, dirX, dirY, plX, plY) {
    var beds = st.map.beds;
    if (!beds.length) return;
    var inv = 1 / (plX * dirY - dirX * plY), H = VIEW_H, half = H / 2, buf = st.buf;
    var order = beds.map(function (b) { var dx = b.x - st.x, dy = b.y - st.y; return { b: b, d: dx * dx + dy * dy }; })
      .sort(function (a, b) { return b.d - a.d; });
    order.forEach(function (o) {
      var b = o.b, spr = b.spr;
      if (!spr) return;
      var sx = b.x - st.x, sy = b.y - st.y;
      var tX = inv * (dirY * sx - dirX * sy), tY = inv * (-plY * sx + plX * sy);
      if (tY <= 0.2) return;
      var screenX = (W / 2) * (1 + tX / tY);
      var worldW = 0.92, worldH = worldW * spr.h / spr.w;
      var sw = Math.abs(H / tY) * worldW, sh = Math.abs(H / tY) * worldH;
      var floorY = half + (0.5 * H) / tY;                     // the floor under it
      var top = floorY - sh, x0 = Math.max(0, (screenX - sw / 2) | 0), x1 = Math.min(W - 1, (screenX + sw / 2) | 0);
      var lut = luts[shadeLevel(tY, 0)];
      for (var x = x0; x <= x1; x++) {
        if (tY >= st.zbuf[x]) continue;
        var u = (((x - (screenX - sw / 2)) / sw) * spr.w) | 0;
        if (u < 0 || u >= spr.w) continue;
        if (x === W >> 1 && tY < 4.5) st.aim = st.aim || { kind: 'bed', bed: b };
        for (var y = Math.max(0, top | 0); y < Math.min(H, floorY | 0); y++) {
          var v = (((y - top) / sh) * spr.h) | 0;
          var c = spr.px[v * spr.w + u];
          if ((c >>> 24) < 128) continue;
          buf[y * W + x] = px(c, lut);
        }
      }
    });
  }
  // the glass over whatever lies behind it: frame opaque, pane tinted
  function drawGlass(st) {
    var H = VIEW_H, half = H / 2, buf = st.buf, g = st.tex.glassPx;
    for (var x = 0; x < W; x++) {
      var d = st.glassCols[x];
      if (d < 0) continue;
      var lineH = H / d, start = -lineH / 2 + half;
      var y0 = Math.max(0, start | 0), y1 = Math.min(H - 1, (lineH / 2 + half) | 0);
      var step = TEX / lineH, tpos = (y0 - start) * step, tx = (st.glassX[x] * TEX) | 0;
      var lut = luts[shadeLevel(d, st.glassSide[x])];
      for (var y = y0; y <= y1; y++) {
        var c = g[((tpos & TM) << TB) | tx];
        tpos += step;
        var a = c >>> 24;
        if (!a) continue;
        var i = y * W + x, o = buf[i];
        if (a === 255) { buf[i] = px(c, lut); continue; }
        var r = ((o & 255) * (255 - a) + lut[c & 255] * a) >> 8;
        var gg = (((o >> 8) & 255) * (255 - a) + lut[(c >> 8) & 255] * a) >> 8;
        var bb = (((o >> 16) & 255) * (255 - a) + lut[(c >> 16) & 255] * a) >> 8;
        buf[i] = (255 << 24 | bb << 16 | gg << 8 | r) >>> 0;
      }
    }
  }

  /* ── Statusa josla ────────────────────────────────────────────────────── */
  function drawHud(st) {
    var ctx = st.hctx, s = st.stats;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, HUD_H);
    var r = rnd(41), img = ctx.createImageData(W, HUD_H), d = img.data;
    for (var i = 0; i < W * HUD_H; i++) { var n = 92 + (r() - 0.5) * 26; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = n; d[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    ctx.setTransform(K, 0, 0, HUD_H / 32, 0, 0);          // laid out at 320×32
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, 320, 1);
    // number panels; the face sits on the bar itself, no box behind it
    [[0, 64], [64, 64], [192, 58], [250, 70]].forEach(function (p) {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(p[0] + 2, 3, p[1] - 4, 26);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(p[0] + 2, 28, p[1] - 4, 1);
    });
    function big(n, x, label) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = '900 17px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#3a0000'; ctx.fillText(String(n), x + 1, 20);
      ctx.fillStyle = '#d4231c'; ctx.fillText(String(n), x, 19);
      ctx.font = '800 6.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#d8d8d8'; ctx.fillText(label, x, 28);
    }
    big(s.total, 32, 'ZĪMĒJUMI');
    big(s.days, 96, 'DEŽŪRAS');
    ctx.font = '26px "Fluent Emoji Gaps", "Fluent Emoji Color", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.me.emoji || '🐱', 160, 27);
    big(s.sleeping, 221, 'GUĻ');
    ctx.textAlign = 'left';
    ctx.font = '800 6.5px Inter, system-ui, sans-serif';
    [['KAFIJA', s.coffee], ['KOMENT.', s.comments], ['ŠODIEN', s.today]].forEach(function (row, i) {
      ctx.fillStyle = '#d8d8d8'; ctx.fillText(row[0], 256, 10 + i * 8);
      ctx.fillStyle = '#f2c94c'; ctx.textAlign = 'right'; ctx.fillText(String(row[1] == null ? '' : row[1]), 314, 10 + i * 8); ctx.textAlign = 'left';
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ── Kustība un ievade ────────────────────────────────────────────────── */
  function free(map, x, y) { return map.grid[(y | 0) * map.w + (x | 0)] === EMPTY && (x | 0) <= HALL; }
  function tryMove(st, nx, ny) {
    var r = RADIUS, map = st.map;
    if (free(map, nx + (nx > st.x ? r : -r), st.y) && free(map, nx, st.y + r) && free(map, nx, st.y - r)) st.x = nx;
    if (free(map, st.x, ny + (ny > st.y ? r : -r)) && free(map, st.x + r, ny) && free(map, st.x - r, ny)) st.y = ny;
  }
  function segmentAt(st) {
    if (st.y < ROOM_Y1 + 1.5 && st.x > HALL - 1.5 && st.map.beds.length) return 'night';
    for (var i = 0; i < st.map.segs.length; i++) { var s = st.map.segs[i]; if (st.y >= s.y0 && st.y < s.y1 + 1) return s; }
    return null;
  }
  function frame(now) {
    var st = state;
    if (!st || st.closed) return;
    st.raf = requestAnimationFrame(frame);
    if (document.hidden || st.viewing) { st.last = now; return; }
    var dt = Math.min(0.05, (now - (st.last || now)) / 1000);
    st.last = now;
    var k = st.keys, moved = false;
    var turn = (k.ArrowLeft || k.KeyQ ? -1 : 0) + (k.ArrowRight ? 1 : 0);
    if (turn) { st.a += turn * TURN * dt; moved = true; }
    if (st.dragTurn) { st.a += st.dragTurn; st.dragTurn = 0; moved = true; }
    var fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    var strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (fwd || strafe) {
      var sp = (k.ShiftLeft || k.ShiftRight ? RUN : MOVE) * dt, ca = Math.cos(st.a), sa = Math.sin(st.a);
      var len = Math.hypot(fwd, strafe) || 1;
      tryMove(st, st.x + (ca * fwd - sa * strafe) / len * sp, st.y + (sa * fwd + ca * strafe) / len * sp);
      st.walk += dt * 9;
      moved = true;
      var seg = segmentAt(st);
      if (seg !== st.seg) {
        st.seg = seg;
        if (seg === 'night') say(st, 'Nakts istaba: ' + st.map.beds.map(function (b) { return b.person.first; }).join(', ') + ' guļ');
        else if (seg) say(st, st.dayTitle(seg.day) + ': ' + seg.count + (seg.count % 10 === 1 && seg.count % 100 !== 11 ? ' zīmējums' : ' zīmējumi'));
      }
    }
    var showingMsg = st.msg && now < st.msgUntil + 50;
    // nothing changed: nothing is drawn (35 frames a second at most)
    if (!moved && !st.dirty && !showingMsg) return;
    if (now - (st.drawnAt || 0) < 28 && !st.dirty) return;
    st.drawnAt = now;
    st.dirty = false;
    render(st);
  }
  function say(st, text) { st.msg = text; st.msgUntil = performance.now() + 3400; st.dirty = true; }

  /* ── Atvēršana ────────────────────────────────────────────────────────── */
  function cupSprite() {
    var c = canvas(104, 104), ctx = c.getContext('2d');
    ctx.font = '88px "Fluent Emoji Gaps", "Fluent Emoji Color", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('☕', 52, 56);
    return c;
  }
  function build() {
    root = document.createElement('div');
    root.id = 'mxDoom';
    root.hidden = true;
    root.innerHTML = '<section class="mx-doom" role="dialog" aria-modal="true" aria-label="Galerija">'
      + '<div class="mx-doom-bar"><strong>Galerija</strong><span class="mx-doom-help">W A S D: iet, velc ar peli: skaties, E vai klikšķis: apskatīt, Esc: iziet</span>'
      + '<button type="button" class="mx-doom-draw">Uzzīmēt</button><button type="button" class="mx-doom-close" aria-label="Iziet no galerijas">×</button></div>'
      + '<div class="mx-doom-screen"><canvas class="mx-doom-view" width="' + W + '" height="' + VIEW_H + '"></canvas>'
      + '<canvas class="mx-doom-hud" width="' + W + '" height="' + HUD_H + '"></canvas>'
      + '<div class="mx-doom-look" hidden><figure><img alt=""><figcaption></figcaption></figure>'
      + '<div class="mx-doom-look-actions"><button type="button" class="mx-doom-back">Atpakaļ</button><button type="button" class="mx-doom-chat">Komentāros</button></div></div>'
      + '</div></section>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) {
      if (e.target === root || e.target.closest('.mx-doom-close')) { close(); return; }
      if (e.target.closest('.mx-doom-draw')) { if (state && state.onDraw) state.onDraw(); return; }
      if (e.target.closest('.mx-doom-back')) { look(null); return; }
      if (e.target.closest('.mx-doom-chat')) { var cb = state && state.onComments; close(); if (cb) cb(); }
    });
    var view = root.querySelector('.mx-doom-view');
    var drag = null;
    view.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, moved: false }; view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', function (e) {
      if (!drag || !state) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 2) drag.moved = true;
      drag.x = e.clientX;
      state.dragTurn += dx * 0.0055;
    });
    view.addEventListener('pointerup', function () {
      if (drag && !drag.moved && state && state.aim) interact(state.aim);
      drag = null;
    });
    window.addEventListener('keydown', function (e) {
      if (!state || state.closed || root.hidden) return;
      if (document.querySelector('.mk-draw-overlay')) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (state.viewing) look(null); else close(); return; }
      if (state.viewing) return;
      if (e.code === 'KeyE' && state.aim) { interact(state.aim); e.preventDefault(); return; }
      if (e.code === 'KeyZ' && state.onDraw) { state.onDraw(); e.preventDefault(); return; }
      if (/^(Arrow|Key[WASDQ]|Shift)/.test(e.code)) { state.keys[e.code] = true; e.preventDefault(); }
    }, true);
    window.addEventListener('keyup', function (e) { if (state) state.keys[e.code] = false; }, true);
    window.addEventListener('blur', function () { if (state) state.keys = {}; });
  }
  function interact(aim) {
    if (aim.kind === 'art') look(aim.art);
    else if (aim.kind === 'bed') say(state, aim.bed.person.name + (aim.bed.person.from ? ' guļ ' + aim.bed.person.from + '–' + aim.bed.person.to : '') + '. Lai labi atpūšas!');
  }
  function look(art) {
    var st = state, box = root.querySelector('.mx-doom-look');
    if (!st) return;
    st.viewing = !!art;
    box.hidden = !art;
    if (!art) { st.dirty = true; return; }
    box.querySelector('img').src = art.item.url;
    box.querySelector('figcaption').textContent = (art.item.authorEmoji ? art.item.authorEmoji + ' ' : '') + (art.item.authorName || 'Anonīms') + ', ' + st.dayTitle(art.item.day).toLowerCase();
    st.keys = {};
  }
  function loadArt(st, slot) {
    var key = slot.x + ',' + slot.y + ',' + slot.face, base = slot.night ? st.tex.nightWallCanvas : st.tex.plasterCanvas;
    var rec = { item: slot.item, tex: data(framedCanvas(null, base)) };
    st.arts[key] = rec;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = function () {
      if (st.closed) return;
      try { rec.tex = data(framedCanvas(img, base)); } catch (_e) {}   // a picture from a host without CORS stays an empty frame
      st.dirty = true;
    };
    img.src = slot.item.url;
  }
  function open(opts) {
    if (!root) build();
    if (!luts) makeLuts();
    var origin = opts.origin;
    if (state) close(true);
    var items = (opts.items || []).slice(), sleepers = (opts.sleepers || []).slice();
    var map = buildMap(items, sleepers);
    var view = root.querySelector('.mx-doom-view'), hud = root.querySelector('.mx-doom-hud');
    var ctx = view.getContext('2d', { alpha: false });
    var img = ctx.createImageData(W, VIEW_H);
    var plasterC = plasterCanvas(), nightWallC = nightWallCanvas(), glassC = glassCanvas();
    var st = state = {
      map: map, x: 2.6, y: 2.2, a: 0.15, keys: {}, dragTurn: 0, walk: 0,
      ctx: ctx, img: img, buf: new Uint32Array(img.data.buffer), zbuf: new Float32Array(W),
      glassCols: new Float32Array(W), glassX: new Float32Array(W), glassSide: new Uint8Array(W),
      hud: hud, hctx: hud.getContext('2d'), arts: {}, aim: null, dirty: true, closed: false,
      me: opts.me || {},
      stats: Object.assign({ total: items.length, days: map.segs.length, sleeping: sleepers.length, today: 0, coffee: '', comments: '' }, opts.stats || {}),
      onDraw: opts.onDraw, onComments: opts.onComments, dayTitle: opts.dayTitle || function (d) { return d; },
      tex: {
        plaster: data(plasterC), plasterCanvas: plasterC, stone: data(stoneCanvas()), floor: data(woodCanvas()), ceil: data(ceilingCanvas()),
        nightWall: data(nightWallC), nightWallCanvas: nightWallC, nightFloor: data(nightFloorCanvas()), glassPx: data(glassC)
      },
      cup: cupSprite(), seg: null, originEl: origin || null
    };
    map.beds.forEach(function (b) { b.spr = bedSprite(b.person); });
    map.slots.forEach(function (slot) { loadArt(st, slot); });
    drawHud(st);
    say(st, sleepers.length
      ? 'Laipni lūgti galerijā. Pa labi aiz stikla Nakts istaba, priekšā ' + (map.segs[0] ? st.dayTitle(map.segs[0].day).toLowerCase() : 'zāle') + '.'
      : items.length ? 'Laipni lūgti galerijā. ' + (map.segs[0] ? st.dayTitle(map.segs[0].day) + ' ir priekšā.' : '') : 'Vēl nav neviena zīmējuma. Spied Uzzīmēt vai Z.');
    root.hidden = false;
    var screen = root.querySelector('.mx-doom');
    if (window.MinkaMotion && origin) window.MinkaMotion.openSurface(screen, { key: 'doom', origin: origin, scrim: root });
    st.raf = requestAnimationFrame(frame);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      if (state !== st || st.closed) return;
      st.cup = cupSprite();
      map.beds.forEach(function (b) { b.spr = bedSprite(b.person); });
      drawHud(st);
      st.dirty = true;
    });
  }
  function close(now) {
    var st = state;
    if (!st) return;
    st.closed = true;
    cancelAnimationFrame(st.raf);
    state = null;
    var box = root.querySelector('.mx-doom-look');
    box.hidden = true;
    box.querySelector('img').removeAttribute('src');
    var screen = root.querySelector('.mx-doom');
    var done = function () { root.hidden = true; root.classList.remove('is-closing'); };
    if (now !== true && window.MinkaMotion && st.originEl) {
      root.classList.add('is-closing');
      window.MinkaMotion.closeSurface(screen, { key: 'doom', origin: st.originEl, scrim: root }, done);
    } else done();
  }
  // new drawings while the gallery is open: rebuild the hall, keep the pose
  function refresh(opts) {
    if (!state) return;
    var keep = { a: state.a, x: state.x, y: state.y, origin: state.originEl };
    open(Object.assign({}, opts, { origin: null }));
    if (state) { state.a = keep.a; state.x = keep.x; state.y = keep.y; state.originEl = keep.origin; state.dirty = true; }
  }
  // For measuring: draws n frames turning on the spot, returns ms a frame.
  function bench(n) {
    if (!state) return null;
    var t = performance.now();
    for (var i = 0; i < (n || 60); i++) { state.a += 0.02; render(state); }
    return +((performance.now() - t) / (n || 60)).toFixed(2);
  }
  // For checks: where the drawings hang; stand somewhere.
  function pose(x, y, a) { if (!state) return null; state.x = x; state.y = y; state.a = a; state.dirty = true; return state.map.slots.map(function (s) { return [s.x, s.y, s.face]; }); }
  window.MinkaGallery3D = { open: open, close: close, refresh: refresh, bench: bench, pose: pose, isOpen: function () { return !!state; } };
})();
