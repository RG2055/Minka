/* Galerija kā Doom (2026-10-01).
   Vestibilā Löfbergs kafijas aparāts (izvēlies kafiju, tā paliek rokā kā
   papīra krūzīte, C: malks), galds ar krēsliem (apsēsties), gramofons
   (klasiskā mūzika sāk skanēt pati, klusi; E pie gramofona vai M: izslēgt),
   molberts (zīmēt), pie sienām Leonardo darbi un pie durvīm Nakts
   sadalījuma plāns. Pa durvīm (atveras pašas, kad pieej) Galvenā istaba un
   no tās Jaunais NMP: gultas tajās vietās, kur Nakts sadalījumā, tajās tās
   nakts gulētāji, pa istabām staigā Nakts kaķi. Tālāk Leonardo zāle ar
   Mīlo Venēru, tad šīs dežūras siena ar tukšiem rāmjiem (zīmē tieši tur)
   un pārējās dežūras. Zāles galā pie White Monster stūra sienas akvārijs
   (E vai klikšķis: pabarot zivtiņas). Apakšā Doom josla ar tavu dienas anonīmo dzīvnieku.

   Dzinējs ir mazs "raycaster" (Wolfenstein princips, kā
   cynicconn/RaycastEngineTechDemo): grīda un griesti katrs vienā tonī ar
   ēnu pēc attāluma (bez graudainas tekstūras, pagriežoties nekas nemirgo),
   sienas ar 256 px tekstūrām un mip līmeņiem, priekšmeti kā Doom spraiti
   ar ēnu uz grīdas. Izšķirtspēja pēc loga (480–960 px platumā); ja dators
   nevelk, galerija pati zīmē mazāku. Kadru zīmē tikai, ja kaut kas mainās
   (iet, durvis, redzams kaķis), ne biežāk kā 35 reizes sekundē; paslēptā
   cilnē nedarbojas nekas. Fails, kaķi, statuja un mūzika ielādējas tikai,
   kad galeriju atver; aizverot mūzika apstājas un viss tiek atlaists.

   Mūzika ir tā pati, kas DOOM: The Gallery Experience: PM Music (diriģents
   Philip Milman, pmmusic.pro), CC BY 3.0, saspiesta HE-AAC 48 kbit/s.
   Leonardo darbi un Mīlo Venēras foto (Jastrow) ir publiskais domēns,
   kaķi no Nakts sadalījuma (scripts/build-gallery-assets.py).

   window.MinkaGallery3D.open({ items, today, sleepers, me, stats, slotMap,
     origin, onDraw, onComments, dayTitle })
     items: [{ day, art, url, authorName, authorEmoji, at }]   (jaunākie pirmie)
     sleepers: [{ name, first, emoji, color, from, to, now, bed }]  bed: Nakts sadalījuma gulta 0–3
     onDraw({ slot })   slotMap: { art: slot } */
(function () {
  'use strict';
  // W × VIEW_H is the picture, set from the window on open; P: pixels per
  // unit at distance 1, the same across and up (square pixels: no stretching)
  var W = 640, VIEW_H = 336, P = 356;
  var TB = 8, TEX = 1 << TB, TM = TEX - 1, MIPS = 6;     // 256 px wall textures, 6 mip levels
  var FOV = 0.9, MOVE = 2.6, RUN = 4.4, TURN = 2.4, RADIUS = 0.22, EYE = 0.5, EYE_SEATED = 0.36;
  var HALL = 5;                                            // the hall's inner width, cells
  var MAIN = { x0: 7, x1: 11, y0: 1, y1: 5, name: 'Galvenā istaba' };
  var NMP = { x0: 7, x1: 9, y0: 7, y1: 9, name: 'Jaunais NMP' };
  var LEO_Y0 = 6, LEO_Y1 = 12;                             // the Leonardo hall
  var EMPTY = 0, WALL = 1, PILLAR = 2, GLASS = 3, DOOR = 4;
  // Nakts sadalījuma gultas (ROOM_BED_KEYS: main_left_top, main_left_bottom,
  // main_right_top, nmp_center), seen from the door as in its picture: two on
  // the left one behind the other, one at the back on the right, NMP's in the
  // middle. Jaunais NMP is a room of its own, its door from the Leonardo hall.
  var BED_SPOTS = [[10.45, 1.62], [8.2, 1.62], [10.45, 5.38], [8.85, 8.5]];
  var CAT_WAYS = {
    main: [[7.6, 3.2], [8.9, 3.1], [9.35, 1.5], [11.4, 3.3], [9.6, 4.4], [7.7, 5.4], [11.5, 2.4], [8.6, 4.8], [10.9, 4.2]],
    nmp: [[7.45, 7.4], [9.6, 7.35], [7.45, 9.6], [9.6, 9.65], [7.5, 8.5]]
  };
  var CATS = [['Rudais', 0, 'main'], ['Melnais', 1, 'main'], ['Pelēkais', 2, 'nmp']];
  var CAT_FW = 85, CAT_FH = 48, CAT_H = 0.17, CAT_SPEED = 0.42;
  var HELD_V = '?v=20261002h3d1';
  var ART = 'assets/gallery/', ART_V = '?v=20261001a', CAT_V = '?v=20261001c1', MUSIC_V = '?v=20261001m1';
  var LEONARDO = 'Leonardo da Vinči';
  var CLASSICS = {
    'mona-lisa': ['Mona Liza', 'ap. 1503–1519'], 'vitruvian': ['Vitrūvija cilvēks', 'ap. 1490'],
    'ginevra': ['Džinevras de Benči portrets', 'ap. 1474–1478'], 'lady-ermine': ['Dāma ar sermuliņu', 'ap. 1489–1491'],
    'belle-ferronniere': ['La Belle Ferronnière', 'ap. 1490–1497'], 'benois-madonna': ['Benuā Madonna', 'ap. 1478–1480'],
    'madonna-litta': ['Madonna Lita', 'ap. 1490'], 'last-supper': ['Svētais vakarēdiens', '1495–1498'],
    'annunciation': ['Pasludināšana', 'ap. 1472–1476']
  };
  var VENUS = { title: 'Mīlo Venēra', caption: 'Mīlo Venēra (Afrodīte no Mēlas), ap. 130–100 p.m.ē., Luvra. Foto: Jastrow, publiskais domēns' };
  // each drink its own little cup (pixel art as the dock's icons), 1,50 € as at the machine
  var COFFEES = [
    { name: 'Espresso', label: 'Espresso', small: true, cup: ['.........', '.........', '..w.w....', '.........', '.cccccc..', '.cbbbbcc.', '.cbbbbc.c', '..cccccc.', '.dddddddd'] },
    { name: 'Melnā kafija', label: 'Kafija', cup: ['..w.w....', '.w.w.....', 'ccccccc..', 'cBBBBBcc.', 'cBBBBBc.c', 'cBBBBBcc.', 'cBBBBBc..', '.ccccc...', '.........'] },
    { name: 'Kapučīno', label: 'Kapučīno', cup: ['.........', '..fff....', '.fffff...', 'cfffffcc.', 'cfmfmfc.c', 'cbbbbbcc.', '.ccccc...', 'ddddddd..', '.........'] },
    { name: 'Late', label: 'Latte', cup: ['..ffff...', '..ffff...', '..gmmg...', '..gmmg...', '..gllg...', '..gllg...', '..gllg...', '..gggg...', '.........'] },
    { name: 'Kafija ar pienu', label: 'Ar pienu', cup: ['..w.w....', '.w.w.....', 'ccccccc..', 'cllllcc..', 'cllllc.c.', 'cllllcc..', 'cllllc...', '.ccccc...', '.........'] },
    { name: 'Kakao', label: 'Kakao', cup: ['..p......', '.pp.w....', 'ccccccc..', 'ckkkkkcc.', 'ckkkkkc.c', 'ckkkkkcc.', 'ckkkkkc..', '.ccccc...', '.........'] }
  ];
  // a White Monster from the box in the corner (as the app's Monster Ultra icon draws it)
  var MONSTER = { name: 'White Monster', label: 'ULTRA', can: true, sips: 10 };
  var CUP_COLORS = { w: '#cbd5e1', c: '#f3eee6', b: '#7a4a24', B: '#2e1a0e', d: '#94a3b8', f: '#f7efe2', m: '#b98d63', g: '#cfe3f2', l: '#c9a27a', k: '#6e4128', p: '#f4c2d1' };
  var PRICE = '1,50 €';
  var SIPS = 8, SIP_MS = 1100, BREW_MS = 1700, HAND_MS = 420;
  var MUSIC = [
    { file: 'winter-vivaldi.m4a', title: 'Vivaldi: Ziema' },
    { file: 'cello-suite-bach.m4a', title: 'Bahs: Čella svīta Nr. 1' },
    { file: 'flower-duet-delibes.m4a', title: 'Delibs: Ziedu duets' },
    { file: 'blue-danube-strauss.m4a', title: 'Štrauss: Zilā Donava' }
  ];
  var MUSIC_CREDIT = 'Ieraksti: PM Music, diriģents Philip Milman (pmmusic.pro), CC BY 3.0';
  var CREDITS = 'Mūzika: PM Music, diriģents Philip Milman, CC BY 3.0. Roka: WebXR rokas modelis (webxr-input-profiles, MIT). '
    + 'White Monster: TurnOnTheNight, CC0. Leonardo, Mikelandželo, Frīdrihs, Mīlo Venēra (foto Jastrow): publiskais domēns.';
  var MUSIC_VOL = 0.3, MUSIC_KEY = 'minkaGalleryMusicV1', QUALITY_KEY = 'minkaGalleryWidthV1';
  var root = null, state = null;

  /* ── Palīgi ───────────────────────────────────────────────────────────── */
  function rnd(seed) { seed = seed >>> 0 || 1; return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  function data(c) { return new Uint32Array(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.buffer.slice(0)); }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function rgbOf(c, fallback) {
    var m = String(c || '').match(/^#([0-9a-f]{6})$/i);
    if (m) { var v = parseInt(m[1], 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
    m = String(c || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    return m ? [+m[1], +m[2], +m[3]] : (fallback || [91, 127, 209]);
  }
  // k < 0 darker, k > 0 towards white
  function tint(rgb, k) {
    var f = function (v) { return Math.round(Math.max(0, Math.min(255, k < 0 ? v * (1 + k) : v + (255 - v) * k))); };
    return 'rgb(' + f(rgb[0]) + ',' + f(rgb[1]) + ',' + f(rgb[2]) + ')';
  }
  var EMOJI_FONT = '"Fluent Emoji Gaps", "Fluent Emoji Color", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  // Smaller copies of a picture (2×2 averages, weighted by alpha so edges do
  // not darken): far away a wall or a sprite reads its smaller copy, so the
  // picture does not sparkle when turning.
  function mipChain(base, w, h, max) {
    var out = [{ w: w, h: h, px: base }], cur = base;
    while (out.length < max && w >= 16 && h >= 16) {
      var nw = w >> 1, nh = h >> 1, next = new Uint32Array(nw * nh);
      for (var y = 0; y < nh; y++) {
        var r0 = y * 2 * w, r1 = r0 + w;
        for (var x = 0; x < nw; x++) {
          var a = cur[r0 + x * 2], b = cur[r0 + x * 2 + 1], c = cur[r1 + x * 2], d = cur[r1 + x * 2 + 1];
          var aa = a >>> 24, ab = b >>> 24, ac = c >>> 24, ad = d >>> 24, sa = aa + ab + ac + ad;
          if (!sa) continue;
          var R = ((a & 255) * aa + (b & 255) * ab + (c & 255) * ac + (d & 255) * ad) / sa | 0;
          var G = (((a >> 8) & 255) * aa + ((b >> 8) & 255) * ab + ((c >> 8) & 255) * ac + ((d >> 8) & 255) * ad) / sa | 0;
          var B = (((a >> 16) & 255) * aa + ((b >> 16) & 255) * ab + ((c >> 16) & 255) * ac + ((d >> 16) & 255) * ad) / sa | 0;
          next[y * nw + x] = ((sa >> 2) << 24 | B << 16 | G << 8 | R) >>> 0;
        }
      }
      out.push({ w: nw, h: nh, px: next });
      cur = next; w = nw; h = nh;
    }
    return out;
  }
  function wallTex(c) { return { mips: mipChain(data(c), TEX, TEX, MIPS) }; }

  /* ── Tekstūras ────────────────────────────────────────────────────────── */
  // Painted as Doom does, at 128 px, then doubled with hard pixels (the
  // chunky look); calm, low in contrast, so nothing sparkles when turning.
  var HALF = TEX >> 1;
  function pixels(fn, after) {
    var c = canvas(HALF), ctx = c.getContext('2d'), img = ctx.createImageData(HALF, HALF), d = img.data;
    fn(function (x, y, r, g, b, a) { var i = (y * HALF + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a == null ? 255 : a; });
    ctx.putImageData(img, 0, 0);
    if (after) after(ctx);
    var big = canvas(TEX), bctx = big.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(c, 0, 0, TEX, TEX);
    return big;
  }
  // the gallery wall: warm plaster, a picture rail, dark wood panelling below
  function plasterCanvas() {
    var r = rnd(7);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var n = (r() - 0.5) * 5;
        if (y >= 96) {                                             // panelling
          var frame = y < 99 || y > HALF - 8 || x % 32 < 2 || (y > 101 && y < 104);
          var g = (r() - 0.5) * 4 + Math.sin(x * 0.4) * 2;
          if (y > HALF - 8) set(x, y, 52 + n, 40 + n, 30 + n);
          else if (frame) set(x, y, 74 + g, 50 + g, 32 + g);
          else set(x, y, 104 + g, 72 + g, 46 + g);
        } else if (y >= 14 && y < 17) set(x, y, y === 14 ? 236 : 168, y === 14 ? 228 : 156, y === 14 ? 214 : 138);   // picture rail
        else set(x, y, 214 + n, 206 + n, 190 + n);
      }
    });
  }
  function stoneCanvas() {
    var r = rnd(23);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var joint = y % 32 === 0 || (x + (((y / 32) | 0) % 2 ? 32 : 0)) % 64 === 0, n = (r() - 0.5) * 8;
        if (joint) set(x, y, 96, 92, 86); else set(x, y, 160 + n, 154 + n, 144 + n);
      }
    });
  }
  // the inside of a doorway: a brushed metal frame
  function jambCanvas() {
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) { var s = 116 + Math.sin(x * 0.8) * 3 + (x % 32 < 2 ? -24 : 0); set(x, y, s, s + 4, s + 10); }
    });
  }
  // the night rooms: the night panel's navy and its cyan edge
  function nightWallCanvas() {
    var r = rnd(17);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var n = (r() - 0.5) * 3;
        if (y >= HALF - 8) set(x, y, 11, 18, 32);
        else if (y >= HALF - 10) set(x, y, 95, 208, 255);
        else set(x, y, 24 + n, 33 + n, 54 + n);
      }
    });
  }
  // a parquet floor: planks in a few close tones, soft seams
  function floorCanvas() {
    var r = rnd(5);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) {
        var row = (y / 8) | 0;
        for (var x = 0; x < HALF; x++) {
          var plank = ((x + row * 23) / 32) | 0, tone = 0.92 + ((plank * 7 + row * 3) % 5) * 0.03;
          var seam = y % 8 === 0 || (x + row * 23) % 32 === 0, g = Math.sin((x + row * 13) * 0.35) * 3 + (r() - 0.5) * 4;
          if (seam) set(x, y, 122, 82, 50);
          else set(x, y, (150 + g) * tone, (104 + g * 0.7) * tone, (62 + g * 0.4) * tone);
        }
      }
    });
  }
  // the ceiling: square tiles, every other one a light panel
  function ceilCanvas() {
    var r = rnd(31);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var tx = x % 32, ty = y % 32, light = ((x >> 5) + (y >> 5)) % 2 === 0 && tx > 7 && tx < 25 && ty > 7 && ty < 25, n = (r() - 0.5) * 4;
        if (tx === 0 || ty === 0) set(x, y, 150, 148, 142);
        else if (light) set(x, y, 250, 248, 238);
        else set(x, y, 204 + n, 202 + n, 194 + n);
      }
    });
  }
  // the night rooms: a soft navy carpet, a dark ceiling with a few stars
  function nightFloorCanvas() {
    var r = rnd(19);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) { var n = (r() - 0.5) * 4 + ((x + y) % 8 < 1 ? 3 : 0); set(x, y, 30 + n, 40 + n, 62 + n); }
    });
  }
  function nightCeilCanvas() {
    var r = rnd(29);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var star = r() < 0.0018;
        if (star) set(x, y, 200, 225, 255); else set(x, y, 13, 19, 34);
      }
    });
  }
  // a window into the night room: a metal frame and the glass (see-through, a cool tint, two streaks)
  function glassCanvas() {
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var frame = x < 6 || x >= HALF - 6 || y < 10 || y >= HALF - 22;
        if (frame) { var s = (x < 2 || x >= HALF - 2 || y < 2) ? 190 : 124; set(x, y, s, s + 4, s + 10, 255); continue; }
        var streak = Math.abs((x + y * 0.55) % 46 - 6) < 1.5 || Math.abs((x + y * 0.55 + 21) % 61 - 4) < 0.8;
        if (streak) set(x, y, 235, 246, 255, 60); else set(x, y, 150, 205, 235, 24);
      }
    });
  }
  // a night room door: navy leaf with the cyan edge, a round window, a name plate
  function doorCanvas(label) {
    var c = canvas(TEX), ctx = c.getContext('2d');
    ctx.fillStyle = '#0d1524'; ctx.fillRect(0, 0, TEX, TEX);
    var g = ctx.createLinearGradient(0, 0, TEX, 0);
    g.addColorStop(0, '#1b2840'); g.addColorStop(0.5, '#24344f'); g.addColorStop(1, '#1a263c');
    ctx.fillStyle = g; rr(ctx, 16, 8, TEX - 32, TEX - 4, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(95,208,255,.9)'; ctx.lineWidth = 3; rr(ctx, 24, 16, TEX - 48, TEX - 26, 6); ctx.stroke();
    ctx.fillStyle = 'rgba(150,205,235,.32)'; ctx.beginPath(); ctx.arc(TEX / 2, 54, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#f2f5f8'; rr(ctx, 40, 104, TEX - 80, 34, 8); ctx.fill();
    ctx.fillStyle = '#16202e'; ctx.font = '800 15px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, TEX / 2, 122);
    ctx.fillStyle = '#c9d2dc'; rr(ctx, TEX - 52, 150, 9, 40, 4); ctx.fill();
    return c;
  }
  // A picture in a thin gilt frame on the wall, its own shape (portrait,
  // landscape or square). No picture: an empty canvas in the frame, waiting.
  function framedCanvas(img, base, empty) {
    var S = TEX / 128, c = canvas(TEX), ctx = c.getContext('2d');
    ctx.drawImage(base, 0, 0);
    var aspect = img ? (img.naturalWidth || img.width) / (img.naturalHeight || img.height) : 1;
    var maxW = 84 * S, maxH = 78 * S, iw = maxW, ih = iw / aspect;
    if (ih > maxH) { ih = maxH; iw = ih * aspect; }
    iw = Math.round(iw); ih = Math.round(ih);
    var b = 5 * S, x = Math.round(TEX / 2 - iw / 2) - b, y = Math.round(51 * S - ih / 2) - b, w = iw + 2 * b, h = ih + 2 * b;
    ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.fillRect(x + 3 * S, y + 3 * S, w, h);
    ctx.fillStyle = '#7a5418'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e2bd56'; ctx.fillRect(x + S, y + S, w - 2 * S, h - 2 * S);
    ctx.fillStyle = '#b48a2c'; ctx.fillRect(x + 3 * S, y + 3 * S, w - 6 * S, h - 6 * S);
    ctx.fillStyle = '#4a3410'; ctx.fillRect(x + 4 * S, y + 4 * S, w - 8 * S, h - 8 * S);
    if (img) {
      var g = ctx.createLinearGradient(0, y + b, 0, y + h - b);
      g.addColorStop(0, '#13283f'); g.addColorStop(1, '#070c16');
      ctx.fillStyle = g; ctx.fillRect(x + b, y + b, iw, ih);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x + b, y + b, iw, ih);
    } else {
      ctx.fillStyle = empty ? '#efe8d8' : '#13283f'; ctx.fillRect(x + b, y + b, iw, ih);
      if (empty) {                                               // a pencil "+": draw here
        ctx.fillStyle = 'rgba(70,60,45,.35)';
        ctx.fillRect(x + b + iw / 2 - 3, y + b + ih / 2 - 20, 6, 40);
        ctx.fillRect(x + b + iw / 2 - 20, y + b + ih / 2 - 3, 40, 6);
      }
    }
    return c;
  }

  /* ── Nakts plāns (uz sienas pie durvīm un apskatei) ────────────────────── */
  // Bed spots as the night panel draws them (nightsplit.js ROOM_SLOTS, %)
  var PLAN_BEDS = [[0.217, 0.293, 0.196], [0.202, 0.669, 0.196], [0.783, 0.293, 0.196], [0.5, 0.48, 0.371]];
  function planCanvas(st) {
    var c = canvas(512, 384), ctx = c.getContext('2d');
    ctx.fillStyle = '#0a111d'; ctx.fillRect(0, 0, 512, 384);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff'; ctx.font = '800 24px Inter, system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Nakts sadalījums', 24, 40);
    ctx.fillStyle = '#9fb0c3'; ctx.font = '600 15px Inter, system-ui, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(st.dayTitle(st.today || ''), 488, 40);
    var rooms = [{ x: 24, y: 58, w: 300, h: 214, name: MAIN.name, beds: [0, 1, 2] }, { x: 340, y: 58, w: 148, h: 214, name: NMP.name, beds: [3] }];
    rooms.forEach(function (room) {
      ctx.fillStyle = '#0f1a2b'; rr(ctx, room.x, room.y, room.w, room.h, 18); ctx.fill();
      ctx.strokeStyle = '#5fd0ff'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#8fd8ff'; ctx.font = '700 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(room.name, room.x + 14, room.y + 22);
      room.beds.forEach(function (i) {
        var spot = PLAN_BEDS[i], person = st.bedPeople[i];
        var bw = Math.round(room.w * spot[2]), bh = Math.round(bw * 1.42);
        var cx = room.x + room.w * spot[0], cy = room.y + 14 + (room.h - 14) * spot[1], bx = cx - bw / 2, by = cy - bh / 2;
        var rgb = person ? rgbOf(person.color) : [52, 64, 84];
        ctx.fillStyle = tint(rgb, -0.35); rr(ctx, bx, by, bw, bh, 10); ctx.fill();
        ctx.fillStyle = tint(rgb, 0); rr(ctx, bx + 4, by + bh * 0.34, bw - 8, bh * 0.62, 8); ctx.fill();
        ctx.fillStyle = '#f4f6f8'; rr(ctx, bx + bw * 0.18, by + 7, bw * 0.64, bh * 0.2, 6); ctx.fill();
        if (!person) return;
        if (person.emoji) {
          ctx.font = Math.round(bw * 0.34) + 'px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(person.emoji, cx, by + 7 + bh * 0.1);
        }
        ctx.fillStyle = '#ffffff'; ctx.font = '800 ' + (bw > 60 ? 13 : 11) + 'px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(person.first || '').slice(0, 9), cx, by + bh * 0.66);
        ctx.textBaseline = 'alphabetic';
      });
    });
    // who sleeps when, in turn
    var list = st.sleepers.slice(0, 8);
    ctx.font = '700 14px Inter, system-ui, sans-serif'; ctx.textAlign = 'left';
    if (!list.length) { ctx.fillStyle = '#9fb0c3'; ctx.fillText('Šai naktij plāna vēl nav', 24, 310); }
    list.forEach(function (p, i) {
      var col = i % 2, row = i >> 1, x = 24 + col * 240, y = 304 + row * 22;
      ctx.fillStyle = 'rgb(' + rgbOf(p.color).join(',') + ')'; ctx.beginPath(); ctx.arc(x + 6, y - 5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.now ? '#ffffff' : '#c9d4e0';
      ctx.fillText(String(p.first || p.name || '').slice(0, 14), x + 20, y);
      ctx.fillStyle = '#8fd8ff'; ctx.textAlign = 'right';
      ctx.fillText((p.from || '') + '–' + (p.to || ''), x + 220, y);
      ctx.textAlign = 'left';
    });
    return c;
  }

  /* ── Priekšmeti (spraiti) ─────────────────────────────────────────────── */
  // Drawn at twice the size they are laid out at, with smaller copies for the distance.
  var SS = 2;
  function makeSprite(c) { return { w: c.width, h: c.height, levels: mipChain(data(c), c.width, c.height, 5) }; }
  function sprite(w, h, draw) {
    var c = canvas(w * SS, h * SS), ctx = c.getContext('2d');
    ctx.scale(SS, SS);
    draw(ctx, w, h);
    return makeSprite(c);
  }
  // a bed seen from its foot, in the sleeper's colour as in Nakts sadalījums
  function bedSprite(person) {
    var rgb = person ? rgbOf(person.color) : [96, 106, 122];
    return sprite(160, 120, function (ctx) {
      ctx.fillStyle = tint(rgb, -0.45); rr(ctx, 12, 4, 136, 56, 16); ctx.fill();          // headboard
      ctx.fillStyle = tint(rgb, -0.22); rr(ctx, 19, 11, 122, 42, 12); ctx.fill();
      var p = ctx.createLinearGradient(0, 30, 0, 60);
      p.addColorStop(0, '#ffffff'); p.addColorStop(1, '#d9dee5');
      ctx.fillStyle = p; rr(ctx, 32, 30, 96, 28, 12); ctx.fill();                       // pillow
      if (person) {
        if (person.emoji) {
          ctx.font = '30px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(person.emoji, 80, 42);
        } else {
          ctx.fillStyle = '#f0c7a6'; ctx.beginPath(); ctx.arc(80, 43, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#4a3324'; ctx.beginPath(); ctx.arc(80, 39, 12, Math.PI, 0); ctx.fill();
          ctx.strokeStyle = '#6b4a36'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(74, 45); ctx.lineTo(78, 45); ctx.moveTo(82, 45); ctx.lineTo(86, 45); ctx.stroke();
        }
        if (person.now) {                                                                  // a little moon: asleep right now
          ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(140, 12, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = tint(rgb, -0.45); ctx.beginPath(); ctx.arc(144, 9, 8, 0, Math.PI * 2); ctx.fill();
        }
      }
      var b = ctx.createLinearGradient(0, 52, 0, 100);
      b.addColorStop(0, tint(rgb, 0.08)); b.addColorStop(1, tint(rgb, -0.28));
      ctx.fillStyle = b; rr(ctx, 14, 52, 132, 48, 14); ctx.fill();                       // blanket
      ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(ctx, 18, 54, 124, 9, 4); ctx.fill();   // its turned-down edge
      if (person) {
        ctx.font = '800 14px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillText(String(person.first || '').toUpperCase().slice(0, 11), 80, 82);
        ctx.fillStyle = '#ffffff'; ctx.fillText(String(person.first || '').toUpperCase().slice(0, 11), 80, 81);
      }
      ctx.fillStyle = tint(rgb, -0.5); rr(ctx, 8, 94, 144, 24, 10); ctx.fill();           // footboard
      ctx.fillStyle = tint(rgb, -0.3); rr(ctx, 14, 97, 132, 6, 3); ctx.fill();
    });
  }
  // a round café table with a marble top, an iron foot and a tulip
  function tableSprite(seated) {
    return sprite(128, 96, function (ctx) {
      ctx.fillStyle = '#2d2e31'; ctx.fillRect(60, 36, 8, 52);                           // foot
      ctx.beginPath(); ctx.ellipse(64, 90, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
      var ry = seated ? 4 : 10, ty = seated ? 34 : 30;
      ctx.fillStyle = '#b3ab9e'; ctx.beginPath(); ctx.ellipse(64, ty + 5, 58, ry, 0, 0, Math.PI * 2); ctx.fill();   // rim
      var g = ctx.createLinearGradient(0, ty - ry, 0, ty + ry);
      g.addColorStop(0, '#fbf8f2'); g.addColorStop(1, '#ddd6ca');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(64, ty, 58, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(190,215,235,.55)'; rr(ctx, 70, ty - 22, 10, 22, 4); ctx.fill();   // a glass vase
      ctx.strokeStyle = '#3f7a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(75, ty - 8); ctx.lineTo(75, ty - 30); ctx.stroke();
      ctx.fillStyle = '#4c8a44'; ctx.beginPath(); ctx.ellipse(70, ty - 20, 5, 2, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d64541'; ctx.beginPath(); ctx.ellipse(75, ty - 34, 5, 7, 0, 0, Math.PI * 2); ctx.fill();   // tulip
      ctx.fillStyle = '#ee6b5f'; ctx.beginPath(); ctx.ellipse(73, ty - 35, 2, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  // a bentwood bistro chair
  function chairSprite() {
    return sprite(64, 112, function (ctx) {
      ctx.strokeStyle = '#3b2616'; ctx.lineCap = 'round';
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(14, 64); ctx.bezierCurveTo(10, 10, 54, 10, 50, 64); ctx.stroke();   // the back's hoop
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, 40); ctx.bezierCurveTo(24, 30, 40, 30, 46, 40); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(14, 70); ctx.lineTo(10, 110); ctx.moveTo(50, 70); ctx.lineTo(54, 110);
      ctx.moveTo(24, 72); ctx.lineTo(22, 108); ctx.moveTo(40, 72); ctx.lineTo(42, 108); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(32, 92, 18, 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(32, 68, 24, 7, 0, 0, Math.PI * 2); ctx.fill();   // seat
      ctx.fillStyle = '#6e4a2c'; ctx.beginPath(); ctx.ellipse(32, 66, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  // an easel with a blank canvas and a palette on its ledge
  function easelSprite() {
    return sprite(112, 176, function (ctx) {
      ctx.strokeStyle = '#7a5130'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(56, 6); ctx.lineTo(20, 172); ctx.moveTo(56, 6); ctx.lineTo(92, 172); ctx.moveTo(56, 20); ctx.lineTo(60, 172); ctx.stroke();
      ctx.fillStyle = '#efe8d8'; ctx.fillRect(18, 24, 76, 74);
      ctx.strokeStyle = '#c9bea8'; ctx.lineWidth = 2; ctx.strokeRect(18, 24, 76, 74);
      ctx.fillStyle = 'rgba(70,60,45,.35)'; ctx.fillRect(54.5, 49, 3, 24); ctx.fillRect(44, 59.5, 24, 3);
      ctx.fillStyle = '#6b4424'; ctx.fillRect(12, 98, 88, 7);
      ctx.fillStyle = '#c8a26a'; ctx.beginPath(); ctx.ellipse(38, 94, 16, 6, -0.2, 0, Math.PI * 2); ctx.fill();   // palette
      ['#d64541', '#f2c94c', '#3a7bd5', '#4c8a44'].forEach(function (c, i) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(30 + i * 6, 93 - (i % 2) * 2, 2.4, 0, Math.PI * 2); ctx.fill(); });
    });
  }
  // a gramophone; notes rise from its horn while it plays
  function gramophoneSprite(playing) {
    return sprite(128, 150, function (ctx) {
      ctx.fillStyle = '#5a3a1e'; rr(ctx, 16, 92, 70, 52, 6); ctx.fill();
      ctx.fillStyle = '#7b5230'; rr(ctx, 22, 98, 58, 40, 4); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(51, 90, 34, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b8892b'; ctx.fillRect(66, 52, 4, 38);
      var horn = ctx.createLinearGradient(60, 0, 128, 60);
      horn.addColorStop(0, '#f2cf6a'); horn.addColorStop(1, '#a8761e');
      ctx.fillStyle = horn;
      ctx.beginPath(); ctx.moveTo(66, 56); ctx.quadraticCurveTo(84, 40, 96, 12); ctx.lineTo(126, 26); ctx.quadraticCurveTo(100, 44, 72, 62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a5418'; ctx.beginPath(); ctx.ellipse(111, 19, 6, 16, 0.45, 0, Math.PI * 2); ctx.fill();
      if (playing) {
        ctx.fillStyle = '#ffe28a'; ctx.font = '700 22px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('♪', 92, 12); ctx.font = '700 16px Inter, system-ui, sans-serif'; ctx.fillText('♫', 118, 8);
      }
    });
  }
  // The Löfbergs machine as the app's coffee icon draws it (calendar.js
  // coffeeIcon): a tall purple vending machine, a lighter head, the white
  // wordmark, a column of cream buttons, a side screen, the cup niche below.
  // Brewing: a paper cup in the niche and the coffee pouring.
  function machineSprite(brewing) {
    return sprite(96, 144, function (ctx) {
      var body = ctx.createLinearGradient(4, 0, 92, 0);
      body.addColorStop(0, '#3a1658'); body.addColorStop(0.35, '#4d1f73'); body.addColorStop(1, '#3c175c');
      ctx.fillStyle = body; rr(ctx, 4, 0, 88, 144, 6); ctx.fill();
      ctx.fillStyle = '#5a2880'; rr(ctx, 4, 0, 88, 22, 6); ctx.fill(); ctx.fillRect(4, 14, 88, 8);
      ctx.fillStyle = '#c79fe0'; ctx.fillRect(70, 6, 10, 10);
      ctx.fillStyle = '#f1ecf6'; ctx.fillRect(12, 28, 72, 14);
      ctx.fillStyle = '#461c69'; ctx.font = 'italic 700 12px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Löfbergs', 48, 35.5);
      for (var i = 0; i < 4; i++) {
        ctx.fillStyle = '#e9d98f'; ctx.fillRect(12, 50 + i * 12, 30, 8);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(12, 50 + i * 12, 30, 2);
      }
      ctx.fillStyle = '#16203a'; ctx.fillRect(54, 50, 28, 26);
      ctx.fillStyle = '#55c7dc'; ctx.fillRect(62, 58, 10, 10);
      ctx.fillStyle = '#2a1340'; ctx.fillRect(28, 98, 40, 36);
      ctx.fillStyle = '#8d939a'; ctx.fillRect(30, 128, 36, 4);
      if (brewing) {
        ctx.fillStyle = '#6b3d1e'; ctx.fillRect(47, 98, 2, 14);
        ctx.fillStyle = '#eef2f8'; ctx.beginPath(); ctx.moveTo(38, 110); ctx.lineTo(58, 110); ctx.lineTo(55, 128); ctx.lineTo(41, 128); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7a4a24'; ctx.fillRect(39, 110, 18, 3);
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(4, 138, 88, 6);
    });
  }
  // a tray of White Monster cans in the corner, one can standing beside it
  function canSide(ctx, x, y, w, h) {
    ctx.fillStyle = '#eef0ee'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#d6dbd6'; ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = '#aab2aa';
    var cw = Math.max(1, w / 7);
    [0.2, 0.45, 0.7].forEach(function (f) { ctx.fillRect(x + w * f, y + h * 0.2, cw, h * 0.45); });
    ctx.fillRect(x + w * 0.2, y + h * 0.2, w * 0.56, cw);
    ctx.fillStyle = '#9aa39a'; ctx.fillRect(x + 1, y + h * 0.82, w - 2, Math.max(1, h * 0.06));
  }
  function monsterBoxSprite() {
    return sprite(112, 72, function (ctx) {
      for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) {                  // the lids of the rows behind
        ctx.fillStyle = '#d6dbd6'; ctx.beginPath(); ctx.ellipse(13 + c * 17 + (r % 2) * 4, 7 + r * 6, 7, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a3f3a'; ctx.fillRect(12 + c * 17 + (r % 2) * 4, 6 + r * 6, 3, 1.5);
      }
      for (c = 0; c < 6; c++) canSide(ctx, 6 + c * 17, 22, 14, 24);             // the front row
      ctx.fillStyle = '#f4f5f4'; ctx.fillRect(2, 40, 108, 30);                  // the tray
      ctx.fillStyle = '#c4c9c4'; ctx.fillRect(2, 40, 108, 2); ctx.fillRect(2, 68, 108, 2);
      ctx.fillStyle = '#3a3f3a'; ctx.font = '900 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('ULTRA', 30, 56);
      ctx.fillStyle = '#8f978f'; [8, 13, 18].forEach(function (x) { ctx.fillRect(x, 47, 3, 16); }); ctx.fillRect(8, 47, 13, 3);
    });
  }
  function monsterCanSprite() {
    return sprite(24, 48, function (ctx) {
      ctx.fillStyle = '#c4c9c4'; ctx.fillRect(7, 0, 10, 2);
      ctx.fillStyle = '#d6dbd6'; ctx.fillRect(4, 2, 16, 3);
      canSide(ctx, 2, 5, 20, 43);
    });
  }
  // a marble bust on a fluted column: Venus de Milo's head (a cut-out photo) once it has loaded
  function statueSprite(bust) {
    return sprite(128, 256, function (ctx) {
      var marble = function (x0, x1) { var g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#bcb19e'); g.addColorStop(0.42, '#f3ede2'); g.addColorStop(1, '#a99e8b'); return g; };
      ctx.fillStyle = marble(32, 96); ctx.fillRect(32, 140, 64, 104);                   // column
      ctx.fillStyle = 'rgba(120,110,95,.28)';
      for (var f = 38; f < 94; f += 8) ctx.fillRect(f, 144, 2, 96);                    // flutes
      ctx.fillStyle = marble(20, 108); ctx.fillRect(20, 130, 88, 12); ctx.fillRect(24, 242, 80, 14);   // capital, base
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(20, 140, 88, 2);
      if (bust) {
        var w = 116, h = Math.round(w * bust.height / bust.width);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bust, 64 - w / 2 + 4, 134 - h, w, h);
      } else {
        ctx.fillStyle = marble(40, 88); ctx.beginPath(); ctx.ellipse(64, 96, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(52, 118, 24, 14);
      }
    });
  }
  // the cats' frames, cut from the atlas (rows per coat: walk, sit, groom)
  function catFrames(img) {
    var c = canvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    c.getContext('2d').drawImage(img, 0, 0);
    var all = data(c), cw = c.width, out = [];
    for (var coat = 0; coat < 3; coat++) {
      var rows = [];
      for (var r = 0; r < 3; r++) {
        var frames = [];
        for (var f = 0; f < 8; f++) {
          var px = new Uint32Array(CAT_FW * CAT_FH), oy = (coat * 3 + r) * CAT_FH, ox = f * CAT_FW;
          for (var y = 0; y < CAT_FH; y++) for (var x = 0; x < CAT_FW; x++) px[y * CAT_FW + x] = all[(oy + y) * cw + ox + x];
          frames.push({ w: CAT_FW, h: CAT_FH, levels: [{ w: CAT_FW, h: CAT_FH, px: px }] });
        }
        rows.push(frames);
      }
      out.push(rows);
    }
    return out;
  }

  /* ── Akvārijs ─────────────────────────────────────────────────────────── */
  // A tank on the hall's end wall by the White Monster corner: sand, plants
  // that sway, an air stone's bubbles and fish seen from the side that turn
  // round in depth (narrowing as they turn), the far ones smaller and bluer.
  // E or a click drops flakes where you look and the fish come up to eat.
  // Three wall cells carry it (their own copies of the plaster); the water is
  // painted on a small canvas only while it is in sight,
  // and only the tank's rows of those textures and their mips are redone
  // (30 times a second while they feed, 20 otherwise).
  var AQ_CELLS = 3, AQ_W = AQ_CELLS * TEX;                 // the strip of wall, cells right to left in x
  var AQ_OUT = [192, 44, 703, 189], AQ_IN = [196, 54, 699, 183];   // texels across the strip: frame, water
  var AQ_TW = AQ_IN[2] - AQ_IN[0] + 1, AQ_TH = AQ_IN[3] - AQ_IN[1] + 1, AQ_SAND = AQ_TH - 16;
  // species: length in texels, height to length, colours back / side / belly, how many
  var FISH = [
    { kind: 'gold', len: 46, hr: 0.42, c: ['#b4470f', '#f28a1e', '#ffd28a'], fin: 'rgba(255,170,80,.75)', n: 2, sp: 24 },
    { kind: 'angel', len: 34, hr: 0.9, c: ['#8d939c', '#dfe3e6', '#f4f6f7'], fin: 'rgba(225,230,235,.6)', n: 1, sp: 16 },
    { kind: 'guppy', len: 22, hr: 0.32, c: ['#6f7d86', '#b9c4c9', '#e4ebee'], fin: 'rgba(255,120,60,.9)', n: 2, sp: 30 },
    { kind: 'neon', len: 18, hr: 0.3, c: ['#3c4a5c', '#9fb2c2', '#e8eef2'], fin: 'rgba(220,235,245,.35)', n: 6, sp: 32 },
    { kind: 'cory', len: 24, hr: 0.38, c: ['#5b5448', '#a39985', '#e2dacb'], fin: 'rgba(170,160,140,.6)', n: 1, sp: 12 }
  ];
  function makeAquarium(st, rect) {
    var r = rnd(19), fish = [];
    FISH.forEach(function (s) {
      for (var i = 0; i < s.n; i++) {
        var f = { s: s, x: 30 + r() * (AQ_TW - 60), y: 20 + r() * (AQ_SAND - 40), z: r(), yaw: r() < 0.5 ? 0 : Math.PI, ph: r() * 6, tx: 0, ty: 0, tz: 0, speed: s.sp * (0.8 + r() * 0.4), wait: 0 };
        if (s.kind === 'cory') f.y = AQ_SAND - 2;
        fish.push(f);
      }
    });
    fish.forEach(function (f) { aimFish(f, r); });
    // the strip's own plaster with the frame on it, cut into the cells' textures
    var strip = canvas(AQ_W, TEX), sc = strip.getContext('2d');
    for (var i = 0; i < AQ_CELLS; i++) sc.drawImage(st.tex.plasterCanvas, i * TEX, 0);
    sc.fillStyle = 'rgba(40,30,20,.18)'; sc.fillRect(AQ_OUT[0] + 4, AQ_OUT[3] + 1, AQ_OUT[2] - AQ_OUT[0] + 1, 2);   // its shadow on the wall
    sc.fillStyle = '#16191d'; sc.fillRect(AQ_OUT[0], AQ_OUT[1], AQ_OUT[2] - AQ_OUT[0] + 1, AQ_OUT[3] - AQ_OUT[1] + 1);
    sc.fillStyle = '#2a2f35'; sc.fillRect(AQ_OUT[0], AQ_OUT[1], AQ_OUT[2] - AQ_OUT[0] + 1, 2);                   // the hood's edge
    sc.fillStyle = '#cfeaff'; sc.fillRect(AQ_IN[0], AQ_IN[1] - 2, AQ_TW, 1);                                     // its light strip
    sc.fillStyle = '#2a2f35'; sc.fillRect(AQ_OUT[0], AQ_OUT[3] - 1, AQ_OUT[2] - AQ_OUT[0] + 1, 1);
    var all = data(strip), cells = [];
    for (i = 0; i < AQ_CELLS; i++) {
      var px0 = new Uint32Array(TEX * TEX);
      for (var y = 0; y < TEX; y++) px0.set(all.subarray(y * AQ_W + i * TEX, y * AQ_W + (i + 1) * TEX), y * TEX);
      cells.push({ mips: mipChain(px0, TEX, TEX, MIPS) });
    }
    var water = canvas(AQ_TW, AQ_TH);
    return { rect: rect, fish: fish, food: [], bubbles: [], t: 0, at: 0, cells: cells, water: water, wctx: water.getContext('2d', { willReadFrequently: true }), back: aquaBack(), plants: aquaPlants(), r: r };
  }
  // where a fish heads next: anywhere for most, the sand for the catfish,
  // round the first neon for the other neons
  function aimFish(f, r, lead) {
    if (f.s.kind === 'cory') { f.tx = 20 + r() * (AQ_TW - 40); f.ty = AQ_SAND - 2; f.tz = r(); return; }
    if (lead) { f.tx = lead.x - Math.cos(lead.yaw) * (10 + r() * 16); f.ty = lead.y + (r() - 0.5) * 14; f.tz = Math.max(0, Math.min(1, lead.z + (r() - 0.5) * 0.3)); return; }
    f.tx = 24 + r() * (AQ_TW - 48); f.ty = 14 + r() * (AQ_SAND - 34); f.tz = r();
  }
  // the still part, painted once: deep water, the back of the tank, sand, stones
  function aquaBack() {
    var c = canvas(AQ_TW, AQ_TH), x = c.getContext('2d'), r = rnd(5);
    var g = x.createLinearGradient(0, 0, 0, AQ_TH);
    g.addColorStop(0, '#5fb3c4'); g.addColorStop(0.55, '#2b7f96'); g.addColorStop(1, '#17566c');
    x.fillStyle = g; x.fillRect(0, 0, AQ_TW, AQ_TH);
    var sg = x.createLinearGradient(0, AQ_SAND - 6, 0, AQ_TH);
    sg.addColorStop(0, '#b9a47c'); sg.addColorStop(1, '#8a7656');
    x.fillStyle = sg;
    x.beginPath(); x.moveTo(0, AQ_SAND - 2);
    for (var i = 0; i <= 12; i++) x.lineTo(i * AQ_TW / 12, AQ_SAND - 3 + Math.sin(i * 1.7) * 2.5);
    x.lineTo(AQ_TW, AQ_TH); x.lineTo(0, AQ_TH); x.fill();
    for (i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? 'rgba(90,72,48,.5)' : 'rgba(235,222,190,.45)'; x.fillRect((r() * AQ_TW) | 0, AQ_SAND - 1 + ((r() * 16) | 0), 1, 1); }
    // smooth river stones: a small pile left of the middle, a few on their own
    [[0.3, 20, 17], [0.355, 15, 12], [0.255, 12, 9], [0.33, 8, 6], [0.62, 9, 11], [0.71, 6, 7], [0.12, 7, 8]].forEach(function (s) {
      var sx = AQ_TW * s[0], sy = AQ_SAND + 1, rg = x.createRadialGradient(sx - s[1] * 0.3, sy - s[2] * 0.7, 1, sx, sy, s[1] * 1.3);
      rg.addColorStop(0, '#9a9a94'); rg.addColorStop(1, '#4b4d4c');
      x.fillStyle = rg; x.beginPath(); x.ellipse(sx, sy, s[1] * 1.4, s[2], 0, Math.PI, 0); x.fill();
    });
    return c;
  }
  function aquaPlants() {
    var r = rnd(29), out = [];
    [0.05, 0.09, 0.15, 0.48, 0.53, 0.8, 0.86, 0.92, 0.97].forEach(function (u, i) {
      var blades = [];
      for (var k = 0; k < 4 + ((r() * 3) | 0); k++) blades.push({ dx: (r() - 0.5) * 8, h: 30 + r() * (AQ_SAND - 50), lean: (r() - 0.5) * 14, ph: r() * 6 });
      out.push({ x: AQ_TW * u, front: i % 3 === 1, blades: blades, c: i % 2 ? ['#2f7d3a', '#57a84a'] : ['#2b6b45', '#4c9a5c'] });
    });
    return out;
  }
  function drawPlants(x, aq, front) {
    x.lineCap = 'round';
    aq.plants.forEach(function (p) {
      if (p.front !== front) return;
      p.blades.forEach(function (b, i) {
        var sway = Math.sin(aq.t * 0.9 + b.ph) * 4, bx = p.x + b.dx, by = AQ_SAND + 1;
        x.strokeStyle = i % 2 ? p.c[0] : p.c[1]; x.lineWidth = front ? 3 : 2.5;
        x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + b.lean * 0.4, by - b.h * 0.55, bx + b.lean + sway, by - b.h); x.stroke();
      });
    });
  }
  // a fish from the side, nose to +x, at the origin; t: its tail's beat
  function drawFish(x, f) {
    var s = f.s, L = s.len, h = L * s.hr, t = Math.sin(f.ph);
    var g = x.createLinearGradient(0, -h * 0.55, 0, h * 0.55);
    g.addColorStop(0, s.c[0]); g.addColorStop(0.45, s.c[1]); g.addColorStop(1, s.c[2]);
    // tail, beating round its root
    x.save(); x.translate(-L * 0.3, 0); x.rotate(t * 0.35);
    x.fillStyle = s.fin;
    var tl = s.kind === 'guppy' ? L * 0.45 : s.kind === 'gold' ? L * 0.36 : L * 0.24, th = s.kind === 'guppy' ? h * 1.5 : s.kind === 'angel' ? h * 0.5 : h * 0.8;
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-tl * 0.6, -th * 0.2, -tl, -th * 0.6); x.quadraticCurveTo(-tl * 0.75, 0, -tl, th * 0.6); x.quadraticCurveTo(-tl * 0.6, th * 0.2, 0, 0); x.fill();
    if (s.kind === 'guppy') { x.fillStyle = 'rgba(80,140,255,.55)'; x.beginPath(); x.moveTo(-tl * 0.35, 0); x.quadraticCurveTo(-tl * 0.8, -th * 0.3, -tl, -th * 0.45); x.lineTo(-tl, -th * 0.1); x.fill(); }
    x.restore();
    // fins: the angelfish's long sails, a small dorsal for the rest
    x.fillStyle = s.fin;
    if (s.kind === 'angel') {
      x.beginPath(); x.moveTo(L * 0.1, -h * 0.4); x.quadraticCurveTo(-L * 0.1, -h * 1.2, -L * 0.25, -h * 1.35); x.quadraticCurveTo(-L * 0.18, -h * 0.6, -L * 0.28, -h * 0.1); x.fill();
      x.beginPath(); x.moveTo(L * 0.1, h * 0.4); x.quadraticCurveTo(-L * 0.1, h * 1.2, -L * 0.25, h * 1.35); x.quadraticCurveTo(-L * 0.18, h * 0.6, -L * 0.28, h * 0.1); x.fill();
    } else {
      x.beginPath(); x.moveTo(L * 0.08, -h * 0.42); x.quadraticCurveTo(-L * 0.05, -h * 0.85, -L * 0.14, -h * 0.4); x.fill();
    }
    // the body
    x.fillStyle = g;
    x.beginPath(); x.moveTo(L * 0.5, 0);
    x.bezierCurveTo(L * 0.44, -h * 0.5, L * 0.05, -h * 0.62, -L * 0.32, -h * 0.12);
    x.lineTo(-L * 0.32, h * 0.12);
    x.bezierCurveTo(L * 0.05, h * 0.62, L * 0.44, h * 0.5, L * 0.5, 0); x.fill();
    // markings
    if (s.kind === 'neon') {
      x.fillStyle = '#2fd0ff'; x.fillRect(-L * 0.28, -h * 0.18, L * 0.68, Math.max(1, h * 0.22));
      x.fillStyle = '#ff3b4e'; x.fillRect(-L * 0.3, h * 0.05, L * 0.42, Math.max(1, h * 0.26));
    } else if (s.kind === 'angel') {
      x.fillStyle = 'rgba(30,30,34,.75)';
      [0.22, -0.02, -0.22].forEach(function (u) { x.fillRect(L * u - 1, -h * 0.55, 2, h * 1.1); });
    } else if (s.kind === 'cory') {
      x.fillStyle = 'rgba(40,36,30,.6)';
      for (var k = 0; k < 6; k++) x.fillRect(-L * 0.25 + k * L * 0.1, -h * 0.15 + (k % 2) * 2, 1.5, 1.5);
    }
    // light along the back, the gill, the eye
    x.fillStyle = 'rgba(255,255,255,.28)';
    x.beginPath(); x.ellipse(L * 0.08, -h * 0.28, L * 0.26, Math.max(1, h * 0.1), -0.08, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(L * 0.26, -h * 0.3); x.quadraticCurveTo(L * 0.2, 0, L * 0.26, h * 0.3); x.stroke();
    var er = Math.max(1.2, L * 0.055);
    x.fillStyle = '#101418'; x.beginPath(); x.arc(L * 0.36, -h * 0.08, er, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(L * 0.36 - er * 0.5, -h * 0.08 - er * 0.6, 1, 1);
  }
  function stepAquarium(aq, dt) {
    var r = aq.r, lead = aq.fish.find(function (f) { return f.s.kind === 'neon'; });
    aq.t += dt;
    aq.food.forEach(function (fd) {
      if (fd.y < AQ_SAND - 1) { fd.y += dt * (5 + fd.k * 3); fd.x += Math.sin(aq.t * 1.6 + fd.k * 9) * dt * 3; }
      else fd.life -= dt;
    });
    aq.fish.forEach(function (f) {
      var food = null, fdd = 1e9;
      aq.food.forEach(function (fd) { var d = Math.hypot(fd.x - f.x, fd.y - f.y); if (d < fdd && (f.s.kind !== 'cory' || fd.y > AQ_SAND - 8)) { fdd = d; food = fd; } });
      var tx = f.tx, ty = f.ty, tz = f.tz, speed = f.speed;
      if (food) { tx = food.x; ty = food.y; tz = 0.85; speed *= 1.7; if (Math.abs(food.x - f.x) < f.s.len * 0.4 && Math.abs(food.y - f.y) < 6) food.eaten = true; }
      else if (Math.hypot(tx - f.x, ty - f.y) < 6) {
        f.wait -= dt;
        if (f.wait <= 0) { aimFish(f, r, f.s.kind === 'neon' && f !== lead ? lead : null); f.wait = 0.5 + r() * 2.5; }
        speed *= 0.25;
      }
      // it turns round only for a target well behind it (a slow half circle
      // through depth), never back and forth for one just above or below
      var dx = tx - f.x;
      if (f.dir == null) f.dir = Math.cos(f.yaw) < 0 ? -1 : 1;
      if (dx * f.dir < -f.s.len) f.dir = -f.dir;
      var want = Math.atan2((tz - f.z) * 90, f.dir * Math.max(Math.abs(dx) * (dx * f.dir > 0 ? 1 : 0), f.s.len)), diff = Math.atan2(Math.sin(want - f.yaw), Math.cos(want - f.yaw));
      f.yaw += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
      var slow = dx * f.dir > 0 ? Math.min(1, 0.25 + Math.abs(dx) / (f.s.len * 2)) : 0.35;   // eases in over the food instead of passing it
      f.x = Math.max(f.s.len * 0.5, Math.min(AQ_TW - f.s.len * 0.5, f.x + Math.cos(f.yaw) * speed * slow * dt));
      f.z = Math.max(0, Math.min(1, f.z + Math.sin(f.yaw) * speed * dt / 90));
      f.y += Math.max(-speed * 0.5 * dt, Math.min(speed * 0.5 * dt, ty - f.y));
      f.y = Math.max(f.s.len * f.s.hr * 0.7 + 3, Math.min(AQ_SAND - (f.s.kind === 'cory' ? 2 : 6), f.y));
      f.ph += dt * (4 + speed * 0.3);
    });
    aq.food = aq.food.filter(function (fd) { return !fd.eaten && fd.life > 0; });
    if (r() < dt * 3) aq.bubbles.push({ x: AQ_TW - 22 + (r() - 0.5) * 4, y: AQ_SAND - 1, rad: 1 + r() * 1.6, ph: r() * 6 });
    aq.bubbles.forEach(function (b) { b.y -= dt * (22 + b.rad * 6); b.x += Math.sin(aq.t * 5 + b.ph) * dt * 4; });
    aq.bubbles = aq.bubbles.filter(function (b) { return b.y > 2; });
  }
  function paintAquarium(aq) {
    var x = aq.wctx, t = aq.t;
    x.drawImage(aq.back, 0, 0);
    // light falling through the surface
    x.fillStyle = 'rgba(220,250,255,.07)';
    for (var i = 0; i < 6; i++) {
      var lx = ((i * 97 + t * 7) % (AQ_TW + 80)) - 40;
      x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx + 22, 0); x.lineTo(lx + 52, AQ_SAND); x.lineTo(lx + 34, AQ_SAND); x.fill();
    }
    drawPlants(x, aq, false);
    aq.fish.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (f) {
      var k = 0.62 + 0.38 * f.z, sx = Math.cos(f.yaw);
      if (Math.abs(sx) < 0.16) sx = sx < 0 ? -0.16 : 0.16;               // head on: a narrow fish, not none
      x.save();
      x.globalAlpha = 0.7 + 0.3 * f.z;                                    // the far ones through more water
      x.translate(f.x, f.y); x.scale(sx * k, k);
      drawFish(x, f);
      x.restore();
    });
    x.globalAlpha = 1;
    x.fillStyle = '#e0b866';
    aq.food.forEach(function (fd) { x.fillRect(fd.x | 0, fd.y | 0, 3, 2); });
    x.strokeStyle = 'rgba(235,250,255,.7)'; x.lineWidth = 1;
    aq.bubbles.forEach(function (b) { x.beginPath(); x.arc(b.x, b.y, b.rad, 0, Math.PI * 2); x.stroke(); });
    drawPlants(x, aq, true);
    x.fillStyle = 'rgba(230,250,255,.45)'; x.fillRect(0, 0, AQ_TW, 2);                // the surface
    x.fillStyle = 'rgba(255,255,255,.06)';                                           // the front glass
    x.beginPath(); x.moveTo(AQ_TW * 0.08, 0); x.lineTo(AQ_TW * 0.16, 0); x.lineTo(AQ_TW * 0.06, AQ_TH); x.lineTo(-AQ_TW * 0.02, AQ_TH); x.fill();
    // into the three cells' textures, then their smaller copies (the tank's rows only)
    var src = new Uint32Array(x.getImageData(0, 0, AQ_TW, AQ_TH).data.buffer);
    for (var ci = 0; ci < AQ_CELLS; ci++) {
      var c0 = Math.max(AQ_IN[0], ci * TEX), c1 = Math.min(AQ_IN[2], ci * TEX + TM);
      if (c0 > c1) continue;
      var dst = aq.cells[ci].mips[0].px, n = c1 - c0 + 1;
      for (var y = 0; y < AQ_TH; y++) dst.set(src.subarray(y * AQ_TW + c0 - AQ_IN[0], y * AQ_TW + c0 - AQ_IN[0] + n), (AQ_IN[1] + y) * TEX + c0 - ci * TEX);
      halveRows(aq.cells[ci].mips, AQ_IN[1], AQ_IN[3]);
    }
  }
  // redo the mips of a texture between two rows of its full size copy
  function halveRows(levels, y0, y1) {
    for (var l = 1; l < levels.length; l++) {
      var a = levels[l - 1], b = levels[l], w = a.w, nw = b.w, cur = a.px, next = b.px;
      y0 >>= 1; y1 = (y1 >> 1);
      for (var y = y0; y <= Math.min(y1, b.h - 1); y++) {
        var r0 = y * 2 * w, r1 = r0 + w;
        for (var xx = 0; xx < nw; xx++) {
          var p = cur[r0 + xx * 2], q = cur[r0 + xx * 2 + 1], s = cur[r1 + xx * 2], u = cur[r1 + xx * 2 + 1];
          next[y * nw + xx] = (255 << 24 | ((((p >> 16) & 255) + ((q >> 16) & 255) + ((s >> 16) & 255) + ((u >> 16) & 255)) >> 2) << 16
            | ((((p >> 8) & 255) + ((q >> 8) & 255) + ((s >> 8) & 255) + ((u >> 8) & 255)) >> 2) << 8
            | (((p & 255) + (q & 255) + (s & 255) + (u & 255)) >> 2)) >>> 0;
        }
      }
    }
  }
  // flakes on the water above where you look (wx: the wall's x there)
  function feedFish(st, wx) {
    var aq = st.aqua, rect = st.map.aquarium;
    var c = (rect.cell1 + 1 - wx) * TEX - AQ_IN[0];
    if (!(c >= 0 && c < AQ_TW)) c = AQ_TW / 2;
    for (var i = 0; i < 8; i++) aq.food.push({ x: Math.max(4, Math.min(AQ_TW - 4, c + (Math.random() - 0.5) * 30)), y: 3 + Math.random() * 3, k: Math.random(), life: 8 });
    say(st, 'Zivtiņas peld ēst');
  }
  function inTank(st, wx) { var a = st.map.aquarium; return wx >= a.x0 && wx <= a.x1; }

  /* ── Kafija rokā ──────────────────────────────────────────────────────── */
  // What you hold, Doom's weapon place: the Löfbergs machine's purple paper
  // cup or a White Monster in your right hand, the thumb across the front.
  // Sprites from a posed 3D hand (scripts/pixel-art/held/build.mjs): one sprite
  // pixel is one picture pixel at 640 wide. HELD_SHOW: two rows above the
  // drink's bottom (build.mjs prints it); the rows below are forearm kept under
  // the bottom edge, so a step or a sip never shows where the arm ends.
  var HELD_SHOW = { coffee: 114, can: 112 };
  var held = { coffee: null, can: null, monsterCan: null, monsterBox: null };
  function handCanvas(kind) {
    var name = kind.can ? 'can' : 'coffee', img = held[name];
    if (!img) return null;
    var k = W / 640, pw = Math.round(img.naturalWidth * k), ph = Math.round(img.naturalHeight * k), pc = canvas(pw, ph), pctx = pc.getContext('2d');
    if (k === 1) pctx.imageSmoothingEnabled = false; else pctx.imageSmoothingQuality = 'high';
    pctx.drawImage(img, 0, 0, pw, ph);
    pc.show = Math.round(HELD_SHOW[name] * k);
    return pc;
  }

  /* ── Karte ────────────────────────────────────────────────────────────── */
  function classic(id) { return { classic: true, id: id, url: ART + id + '.webp' + ART_V, title: CLASSICS[id][0], year: CLASSICS[id][1], authorName: LEONARDO }; }
  var FACES = { n: 0, e: 1, s: 2, w: 3 };
  function buildMap(items, today, slotMap) {
    var slots = [], segs = [];
    // the lobby: Leonardo by the start, the night plan by the night room's door
    slots.push({ x: 1, y: 0, face: 's', item: classic('vitruvian') });
    slots.push({ x: 3, y: 0, face: 's', item: classic('mona-lisa') });
    slots.push({ x: 5, y: 0, face: 's', item: classic('ginevra') });
    slots.push({ x: 0, y: 4, face: 'e', item: classic('annunciation') });
    slots.push({ x: 6, y: 5, face: 'w', plan: true });
    // the Leonardo hall
    var leo = ['lady-ermine', 'benois-madonna', 'last-supper', 'belle-ferronniere', 'madonna-litta'];
    segs.push({ title: 'Leonardo da Vinči', y0: LEO_Y0, y1: LEO_Y1 + 1, count: leo.length });
    leo.forEach(function (id, i) { slots.push({ x: i % 2 ? HALL + 1 : 0, y: LEO_Y0 + 1 + Math.floor(i / 2) * 2, face: i % 2 ? 'w' : 'e', item: classic(id) }); });
    // a drawing drawn over another (posted as its answer) hangs where that one
    // hung, on that day's wall, in that frame; the covered one stays in the chat
    var byKey = {}, over = {}, wall = [];
    items.forEach(function (it) { if (it.key) byKey[it.key] = it; });
    items.forEach(function (it) { if (it.parent && byKey[it.parent] && byKey[it.parent] !== it && !over[it.parent]) over[it.parent] = it; });
    items.forEach(function (it) {
      if (it.parent && over[it.parent] === it) return;
      var cur = it, guard = 0;
      while (cur.key && over[cur.key] && guard++ < 12) cur = over[cur.key];
      wall.push(cur === it ? it : Object.assign({}, cur, { day: it.day, slotOf: it.art }));
    });
    // the team's walls: this dežūra first, with empty frames to draw on
    var days = [], byDay = {};
    wall.forEach(function (it) { if (!byDay[it.day]) { byDay[it.day] = []; days.push(it.day); } byDay[it.day].push(it); });
    if (today && days.indexOf(today) < 0) days.unshift(today);
    days.sort(function (a, b) { return a === today ? -1 : b === today ? 1 : (a < b ? 1 : -1); });
    var y = LEO_Y1 + 2;
    days.forEach(function (day) {
      var list = byDay[day] || [], isToday = day === today;
      var n = isToday ? Math.max(6, list.length + 2) : list.length;
      if (n % 2) n++;
      var len = Math.max(4, n + 1);
      segs.push({ day: day, y0: y, y1: y + len, count: list.length, today: isToday });
      var spots = [];
      for (var i = 0; i < n; i++) spots.push({ x: i % 2 ? HALL + 1 : 0, y: y + 1 + Math.floor(i / 2) * 2, face: i % 2 ? 'w' : 'e', day: day });
      var free = spots.slice(), left = [];
      list.forEach(function (it) {                              // a drawing made in a chosen frame keeps it
        var want = slotMap && (slotMap[it.art] || (it.slotOf && slotMap[it.slotOf])), at = -1;
        if (want) at = free.findIndex(function (s) { return s.x + ',' + s.y + ',' + s.face === want; });
        if (at >= 0) { free[at].item = it; free.splice(at, 1); } else left.push(it);
      });
      left.slice().reverse().forEach(function (it) { var s = free.shift(); if (s) s.item = it; });
      spots.forEach(function (s) { if (!s.item) s.empty = true; slots.push(s); });
      y += len + 1;
    });
    var H = Math.max(y + 2, LEO_Y1 + 6, NMP.y1 + 2), Wm = MAIN.x1 + 2;
    var grid = new Uint8Array(Wm * H), zone = new Uint8Array(Wm * H), doorAt = new Int8Array(Wm * H).fill(-1);
    var inRoom = function (r, xx, yy) { return xx >= r.x0 && xx <= r.x1 && yy >= r.y0 && yy <= r.y1; };
    for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < Wm; xx++) {
      var hall = xx >= 1 && xx <= HALL && yy >= 1 && yy <= H - 2, night = inRoom(MAIN, xx, yy) || inRoom(NMP, xx, yy);
      grid[yy * Wm + xx] = hall || night ? EMPTY : WALL;
      zone[yy * Wm + xx] = night ? 1 : 0;
    }
    // two windows into Galvenā istaba (the floor behind the pane is the night room's)
    [1, 2].forEach(function (gy) { grid[gy * Wm + HALL + 1] = GLASS; zone[gy * Wm + HALL + 1] = 1; });
    var doors = [{ x: HALL + 1, y: 4, axis: 0, open: 0, label: 'GALVENĀ ISTABA' }, { x: HALL + 1, y: 8, axis: 0, open: 0, label: 'JAUNAIS NMP' }];
    doors.forEach(function (d, i) { grid[d.y * Wm + d.x] = DOOR; doorAt[d.y * Wm + d.x] = i; });
    [LEO_Y1 + 1].concat(segs.slice(1).map(function (s) { return s.y1; })).forEach(function (py) {
      if (py < H - 1) { grid[py * Wm + 1] = PILLAR; grid[py * Wm + HALL] = PILLAR; }
    });
    // the two newest drawings hang in the night rooms: Galvenā's back wall, above NMP's bed
    wall.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 2).forEach(function (it, i) {
      slots.push(i ? { x: NMP.x1 + 1, y: 8, face: 'w', item: it, night: true } : { x: MAIN.x1 + 1, y: 3, face: 'w', item: it, night: true });
    });
    // the aquarium on the hall's end wall, by the White Monster corner (cells 4, 3, 2 as you face it)
    var aquarium = { y: H - 1, cell1: 4, x0: 5 - (AQ_IN[2] + 1) / TEX, x1: 5 - AQ_IN[0] / TEX };
    return { w: Wm, h: H, grid: grid, zone: zone, doors: doors, doorAt: doorAt, segs: segs, slots: slots, aquarium: aquarium };
  }
  // which side of a door you are on decides the room
  function zoneAt(map, x, y) {
    var mx = Math.floor(x), my = Math.floor(y);
    if (mx < 0 || my < 0 || mx >= map.w || my >= map.h) return 0;
    var ci = my * map.w + mx;
    if (map.grid[ci] === DOOR) {
      var d = map.doors[map.doorAt[ci]];
      return d.axis === 0 ? map.zone[ci + (x > mx + 0.5 ? 1 : -1)] : map.zone[ci + (y > my + 0.5 ? map.w : -map.w)];
    }
    return map.zone[ci];
  }
  function roomAt(map, x, y) {
    if (!zoneAt(map, x, y)) return null;
    return y >= NMP.y0 - 0.5 ? NMP : MAIN;
  }

  /* ── Zīmēšana ─────────────────────────────────────────────────────────── */
  var SHADES = 64, luts = null;
  function makeLuts() {
    luts = [];
    for (var l = 0; l < SHADES; l++) {
      var f = 1 - 0.76 * l / (SHADES - 1), lut = new Uint8Array(256);
      for (var i = 0; i < 256; i++) lut[i] = Math.min(255, Math.round(i * f));
      luts.push(lut);
    }
  }
  // distance falloff; the walls running along x get a darker side (directional light)
  function shadeLevel(dist, side) { return Math.min(SHADES - 1, ((dist * 5.6) | 0) + (side ? 8 : 0)); }
  function px(c, lut) { return (255 << 24 | lut[(c >> 16) & 255] << 16 | lut[(c >> 8) & 255] << 8 | lut[c & 255]) >>> 0; }

  function render(st) {
    var t0 = performance.now();
    var buf = st.buf, H = VIEW_H, half = H / 2, map = st.map, mw = map.w, mh = map.h, grid = map.grid, zone = map.zone, T = st.tex;
    var z = st.z + (st.seated ? 0 : Math.sin(st.walk * 2) * 0.006);
    var dirX = Math.cos(st.a), dirY = Math.sin(st.a), plX = -dirY * FOV, plY = dirX * FOV;
    var pz = zoneAt(map, st.x, st.y), x, y, lut;
    st.pickRef.fill(null);
    st.aquaSeen = false;
    // walls, column by column; a glass wall is remembered and the ray goes on
    // through it, an open door lets it pass where the leaf has slid away
    for (x = 0; x < W; x++) {
      var cam = 2 * x / W - 1, rx = dirX + plX * cam, ry = dirY + plY * cam;
      var mx = st.x | 0, my = st.y | 0, pmx = mx, pmy = my, ci = 0;
      var ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), stepX, stepY, sdx, sdy, side = 0, cell = 0;
      var glass = -1, gside = 0, gwall = 0, cross = -1, door = null, doorT = 0, doorU = 0;
      if (rx < 0) { stepX = -1; sdx = (st.x - mx) * ddx; } else { stepX = 1; sdx = (mx + 1 - st.x) * ddx; }
      if (ry < 0) { stepY = -1; sdy = (st.y - my) * ddy; } else { stepY = 1; sdy = (my + 1 - st.y) * ddy; }
      for (var guard = 0; guard < 200; guard++) {
        pmx = mx; pmy = my;
        if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; } else { sdy += ddy; my += stepY; side = 1; }
        if (mx < 0 || my < 0 || mx >= mw || my >= mh) { cell = WALL; break; }
        ci = my * mw + mx;
        cell = grid[ci];
        if (cell === DOOR) {
          var d = map.doors[map.doorAt[ci]], t, along, beyond;
          if (d.axis === 0) { t = (mx + 0.5 - st.x) / rx; along = st.y + t * ry - my; beyond = ci + (rx > 0 ? 1 : -1); }
          else { t = (my + 0.5 - st.y) / ry; along = st.x + t * rx - mx; beyond = ci + (ry > 0 ? mw : -mw); }
          if (t > 0 && along >= 0 && along < 1) {
            if (along >= d.open) { door = d; doorT = t; doorU = along - d.open; break; }
            if (cross < 0 && zone[beyond] !== pz) cross = t;
          }
          continue;
        }
        if (cross < 0 && cell !== WALL && cell !== PILLAR && zone[ci] !== pz) cross = side ? sdy - ddy : sdx - ddx;
        if (cell === GLASS) {
          if (glass < 0) { glass = side ? sdy - ddy : sdx - ddx; gside = side; gwall = side === 0 ? st.y + glass * ry : st.x + glass * rx; }
          continue;
        }
        if (cell) break;
      }
      var perp, tex, tx, art = null;
      if (door) {
        perp = doorT; tex = door.tex;
        tx = (doorU * TEX) | 0;
        if (door.axis === 0 ? st.x > door.x + 0.5 : st.y < door.y + 0.5) tx = TM - tx;   // the plate reads from both sides
      } else {
        perp = side ? sdy - ddy : sdx - ddx;
        var wallX = side === 0 ? st.y + perp * ry : st.x + perp * rx;
        wallX -= Math.floor(wallX);
        tx = (wallX * TEX) | 0;
        if ((side === 0 && rx < 0) || (side === 1 && ry > 0)) tx = TM - tx;   // read left to right from either side
        var face = side === 0 ? (stepX > 0 ? 3 : 1) : (stepY > 0 ? 0 : 2);
        art = cell !== WALL && cell !== PILLAR ? null : st.artAt[ci * 4 + face] || null;
        var pc = pmy * mw + pmx;
        if (art && art.aquarium) st.aquaSeen = true;
        tex = art ? art.tex : grid[pc] === DOOR ? T.jamb : cell === PILLAR ? T.stone : zone[pc] ? T.nightWall : T.plaster;
      }
      if (perp < 0.0001) perp = 0.0001;
      st.zbuf[x] = perp;
      st.glassCols[x] = glass;
      st.glassX[x] = gwall - Math.floor(gwall);
      st.glassSide[x] = gside;
      st.cross[x] = cross;
      var lineH = P / perp, top = half - (1 - z) * lineH;
      var y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H - 1, Math.floor(half + z * lineH));
      st.wallTop[x] = y0; st.wallBot[x] = y1;
      var step = TEX / lineH, L = 0;
      if (step >= 2) { L = 31 - Math.clz32(step | 0); if (L >= MIPS) L = MIPS - 1; }
      var lv = tex.mips[L], tpx = lv.px, sb = TB - L, sm = lv.w - 1, txl = tx >> L, tpos = (y0 - top) * step;
      lut = luts[shadeLevel(perp, door ? 0 : side)];
      for (y = y0; y <= y1; y++) {
        buf[y * W + x] = px(tpx[((((tpos | 0) >> L) & sm) << sb) | txl], lut);
        tpos += step;
      }
      if (art && glass < 0) {
        st.pickRef[x] = art; st.pickDist[x] = perp; st.pickY0[x] = y0; st.pickY1[x] = y1;
        st.pickWX[x] = st.x + perp * rx; st.pickWY[x] = st.y + perp * ry;
      }
    }
    // floor and ceiling (Doom's flats): each row reads the texture copy that
    // fits how much floor one pixel covers there, so far rows do not sparkle;
    // past a window or a door the other room's texture
    var wt = st.wallTop, wb = st.wallBot, cr = st.cross;
    for (y = 0; y < H; y++) {
      if (Math.abs(y - half) < 0.5) continue;
      var fl = y > half, eyeH = fl ? z : 1 - z, rd = (eyeH * P) / Math.abs(y - half);
      var fx0 = st.x + rd * (dirX - plX), fy0 = st.y + rd * (dirY - plY), sx = rd * 2 * plX / W, sy = rd * 2 * plY / W;
      var foot = Math.max(rd * 2 * FOV / W, rd * rd / (eyeH * P)) * TEX, Lf = 0;
      if (foot >= 2) { Lf = 31 - Math.clz32(foot | 0); if (Lf >= MIPS) Lf = MIPS - 1; }
      var own = fl ? (pz ? T.nightFloor : T.floor) : (pz ? T.nightCeil : T.ceil), oth = fl ? (pz ? T.floor : T.nightFloor) : (pz ? T.ceil : T.nightCeil);
      var ol = own.mips[Lf], al = oth.mips[Lf], opx = ol.px, apx = al.px, S = ol.w, m = S - 1, sbf = TB - Lf;
      var lutf = luts[shadeLevel(rd, 0)], o = y * W;
      for (x = 0; x < W; x++) {
        if (y >= wt[x] && y <= wb[x]) continue;
        var wx = fx0 + x * sx, wy = fy0 + x * sy;
        var ti = ((((wy * S) | 0) & m) << sbf) | (((wx * S) | 0) & m);
        buf[o + x] = px(cr[x] >= 0 && rd > cr[x] ? apx[ti] : opx[ti], lutf);
      }
    }
    // things: behind the glass first, then the glass, then the rest
    st.catsSeen = false;
    var list = [];
    st.props.forEach(function (p) {
      if (p.hidden || !p.spr) return;
      if (p.kind === 'cat') {
        var s = p.vx * plX + p.vy * plY;                       // walking right or left on the screen
        if (p.mode === 'walk' && Math.abs(s) > 0.02) p.flip = s < 0;
      }
      var dx = p.x - st.x, dy = p.y - st.y;
      list.push({ p: p, d: dx * dx + dy * dy });
    });
    list.sort(function (a, b) { return b.d - a.d; });
    drawSprites(st, list, dirX, dirY, plX, plY, 0);
    drawGlass(st);
    drawSprites(st, list, dirX, dirY, plX, plY, 1);
    st.ctx.putImageData(st.img, 0, 0);
    drawHand(st);
    var c = st.ctx, mid = VIEW_H / 2, s = W / 512;
    var cx = W >> 1, ref = st.pickRef[cx];
    st.aim = ref && st.pickDist[cx] <= (ref.isArt ? 3.4 : ref.reach || 2.4) ? ref : null;
    if (st.aim && st.aim.aquarium) { if (inTank(st, st.pickWX[cx])) st.aim.at = st.pickWX[cx]; else st.aim = null; }
    c.fillStyle = st.aim ? '#ffd166' : 'rgba(255,255,255,.6)';
    c.fillRect(W / 2 - s, mid - 6 * s, 2 * s, 4 * s); c.fillRect(W / 2 - s, mid + 2 * s, 2 * s, 4 * s);
    c.fillRect(W / 2 - 6 * s, mid - s, 4 * s, 2 * s); c.fillRect(W / 2 + 2 * s, mid - s, 4 * s, 2 * s);
    if (st.msg && performance.now() < st.msgUntil) {
      var fs = Math.max(8, Math.round(W / 64));
      c.font = '800 ' + fs + 'px Inter, system-ui, sans-serif';
      c.textBaseline = 'top'; c.textAlign = 'left';
      c.fillStyle = 'rgba(0,0,0,.8)'; c.fillText(st.msg.toUpperCase(), fs * 0.6 + 1, fs * 0.6 + 1);
      c.fillStyle = '#f0d77e'; c.fillText(st.msg.toUpperCase(), fs * 0.6, fs * 0.6);
      st.msgDrawn = true;
    } else st.msgDrawn = false;
    paintPrompt(st);
    var ms = performance.now() - t0;
    st.cost = st.cost ? st.cost * 0.9 + ms * 0.1 : ms;
    st.frames++;
  }
  // Doom sprites with a soft shadow on the floor; pass 0 draws what lies
  // behind a window (in those columns), pass 1 everything else.
  function drawSprites(st, list, dirX, dirY, plX, plY, pass) {
    var inv = 1 / (plX * dirY - dirX * plY), H = VIEW_H, half = H / 2, buf = st.buf, z = st.z;
    for (var n = 0; n < list.length; n++) {
      var p = list[n].p, spr = p.spr, sx = p.x - st.x, sy = p.y - st.y;
      var tX = inv * (dirY * sx - dirX * sy), tY = inv * (-plY * sx + plX * sy);
      if (tY <= 0.12) continue;
      var screenX = (W / 2) * (1 + tX / tY), sh = (P / tY) * p.h, sw = sh * spr.w / spr.h;
      var floorY = half + (z * P) / tY, top = floorY - sh, left = screenX - sw / 2;
      var x0 = Math.max(0, Math.ceil(left)), x1 = Math.min(W - 1, Math.floor(left + sw)), x;
      if (x1 < x0) continue;
      var lut = luts[shadeLevel(tY, 0)];
      // the shadow: an ellipse on the floor round the foot
      var r = p.shade || 0;
      if (r) {
        var near = Math.max(0.15, tY - r), yN = half + (z * P) / near, yF = half + (z * P) / (tY + r);
        var cy = (yN + yF) / 2, hy = (yN - yF) / 2, rxp = P * r / tY;
        var sx0 = Math.max(0, Math.ceil(screenX - rxp)), sx1 = Math.min(W - 1, Math.floor(screenX + rxp));
        for (x = sx0; x <= sx1; x++) {
          if (tY >= st.zbuf[x] || ((pass === 0) !== (st.glassCols[x] >= 0 && tY > st.glassCols[x]))) continue;
          var u = (x - screenX) / rxp, k = 1 - u * u;
          if (k <= 0) continue;
          k = Math.sqrt(k);
          var ya = Math.max(st.wallBot[x] + 1, Math.ceil(cy - hy * k)), yb = Math.min(H - 1, Math.floor(cy + hy * k));
          for (var yy = ya; yy <= yb; yy++) { var i = yy * W + x, c0 = buf[i]; buf[i] = (0xff000000 | ((c0 >> 1) & 0x7f7f7f) + ((c0 >> 2) & 0x3f3f3f) + ((c0 >> 3) & 0x1f1f1f)) >>> 0; }
        }
      }
      var ratio = spr.h / sh, L = 0;
      if (ratio >= 2 && spr.levels.length > 1) L = Math.min(spr.levels.length - 1, 31 - Math.clz32(ratio | 0));
      var lv = spr.levels[L], lw = lv.w, lh = lv.h, lpx = lv.px, vStep = lh / sh;
      var y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H - 1, Math.floor(floorY));
      for (x = x0; x <= x1; x++) {
        if (tY >= st.zbuf[x]) continue;
        if ((pass === 0) !== (st.glassCols[x] >= 0 && tY > st.glassCols[x])) continue;
        var uu = (((x - left) / sw) * lw) | 0;
        if (uu >= lw) uu = lw - 1;
        if (p.flip) uu = lw - 1 - uu;
        var v = (y0 - top) * vStep, drew = false;
        for (var y = y0; y <= y1; y++) {
          var vi = v | 0;
          v += vStep;
          if (vi >= lh) break;
          var col = lpx[vi * lw + uu];
          if ((col >>> 24) < 128) continue;
          buf[y * W + x] = px(col, lut);
          drew = true;
        }
        if (!drew) continue;
        if (p.kind === 'cat') st.catsSeen = true;
        if (!st.pickRef[x] || st.pickDist[x] > tY) {
          st.pickRef[x] = p; st.pickDist[x] = tY; st.pickY0[x] = y0; st.pickY1[x] = y1; st.pickWX[x] = p.x; st.pickWY[x] = p.y;
        }
      }
    }
  }
  // the glass over whatever lies behind it: frame opaque, pane tinted
  function drawGlass(st) {
    var H = VIEW_H, half = H / 2, buf = st.buf, g = st.tex.glass, z = st.z;
    for (var x = 0; x < W; x++) {
      var d = st.glassCols[x];
      if (d < 0) continue;
      var lineH = P / d, top = half - (1 - z) * lineH;
      var y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H - 1, Math.floor(half + z * lineH));
      var step = TEX / lineH, L = 0;
      if (step >= 2) { L = 31 - Math.clz32(step | 0); if (L >= MIPS) L = MIPS - 1; }
      var lv = g.mips[L], gp = lv.px, sb = TB - L, sm = lv.w - 1, txl = ((st.glassX[x] * TEX) | 0) >> L, tpos = (y0 - top) * step;
      var lut = luts[shadeLevel(d, st.glassSide[x])];
      for (var y = y0; y <= y1; y++) {
        var c = gp[((((tpos | 0) >> L) & sm) << sb) | txl];
        tpos += step;
        var a = c >>> 24;
        if (!a) continue;
        var i = y * W + x, o = buf[i];
        if (a > 250) { buf[i] = px(c, lut); continue; }
        var r = ((o & 255) * (255 - a) + lut[c & 255] * a) >> 8;
        var gg = (((o >> 8) & 255) * (255 - a) + lut[(c >> 8) & 255] * a) >> 8;
        var bb = (((o >> 16) & 255) * (255 - a) + lut[(c >> 16) & 255] * a) >> 8;
        buf[i] = (255 << 24 | bb << 16 | gg << 8 | r) >>> 0;
      }
    }
  }
  // the drink in your hand, as RaycastEngineTechDemo's DrawHand: bottom right,
  // bobbing only while you walk; it comes up when taken, goes down when
  // empty, and a sip lifts it towards you (straight up, the arm stays cut off)
  function ease(t) { return t * t * (3 - 2 * t); }
  function drawHand(st) {
    var cup = st.cup;
    if (!cup) return;
    if (!cup.canvas) cup.canvas = handCanvas(cup.kind);
    var cnv = cup.canvas;
    if (!cnv) return;
    var now = performance.now(), show = cnv.show;
    var bx = W - cnv.width, by = VIEW_H - show + (st.moving ? Math.sin(st.walk) * W * 0.008 : 0);
    if (st.seated) by += show * 0.06;
    if (cup.inAt) by += (1 - ease(Math.min(1, (now - cup.inAt) / HAND_MS))) * show;
    if (cup.outAt) by += ease(Math.min(1, (now - cup.outAt) / HAND_MS)) * show;
    if (st.sip) {
      var t = Math.min(1, (now - st.sip) / SIP_MS);
      by -= ease(t < 0.35 ? t / 0.35 : t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35) * VIEW_H * 0.07;
    }
    st.ctx.drawImage(cnv, Math.round(bx), Math.round(by));
  }
  // the hint under the crosshair (also a button): what E does here
  function promptFor(st) {
    var a = st.aim;
    if (!a) return st.seated ? ['W', 'Piecelties'] : null;
    if (a.isArt) {
      if (a.plan) return ['E', 'Apskatīt Nakts plānu'];
      if (a.empty) return ['E', 'Zīmēt šajā rāmī'];
      return ['E', a.item.classic ? 'Apskatīt: ' + a.item.title : 'Apskatīt zīmējumu' + (a.item.authorName ? ': ' + a.item.authorName : '')];
    }
    switch (a.kind) {
      case 'machine': return ['E', st.brew ? 'Kafija top…' : 'Izvēlēties kafiju'];
      case 'table': case 'chair': return st.seated ? ['W', 'Piecelties'] : ['E', 'Apsēsties'];
      case 'gramophone': return ['E', st.musicOn ? 'Izslēgt mūziku' : 'Ieslēgt mūziku'];
      case 'easel': return ['E', 'Zīmēt'];
      case 'statue': return ['E', 'Apskatīt: ' + VENUS.title];
      case 'cat': return ['E', 'Paglaudīt: ' + a.name];
      case 'aquarium': return ['E', 'Pabarot zivtiņas'];
      case 'monster': return ['E', 'Paņemt White Monster'];
      case 'monsterbox': return ['E', 'Paņemt bundžu no kastes'];
      case 'bed': return ['E', a.person ? a.person.first + (a.person.from ? ' guļ ' + a.person.from + '–' + a.person.to : '') : 'Tukša gulta'];
    }
    return null;
  }
  function paintPrompt(st) {
    var p = promptFor(st), key = p ? p.join('|') : '';
    if (key === st.promptKey) return;
    st.promptKey = key;
    var el = root.querySelector('.mx-doom-prompt');
    el.hidden = !p;
    if (!p) return;
    el.querySelector('kbd').textContent = p[0];
    el.querySelector('span').textContent = p[1];
  }

  /* ── Statusa josla ────────────────────────────────────────────────────── */
  // The dock's cells: its own pixel icons (Kalendārs, Nakts) where the shell
  // has them, a palette and a cup drawn the same way.
  function pixelIcon(rows, colors) {
    var out = '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true">';
    rows.forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (colors[row[x]]) out += '<rect x="' + x + '" y="' + y + '" width="1.04" height="1.04" fill="' + colors[row[x]] + '"/>'; });
    return out + '</svg>';
  }
  var ICONS = {
    draw: pixelIcon(['..aaaa...', '.aaaaaa..', 'aarabaaa.', 'aaaaaaaa.', 'aagaa..a.', 'aaaa.....', '.aaaa..a.', '..aaaaa..', '.........'], { a: '#e8c48a', r: '#f87171', b: '#60a5fa', g: '#34d399' }),
    cal: pixelIcon(['.c...c...', 'ccccccccc', 'ccccccccc', 'w.w.w.w.w', 'wwwwwwwww', 'w.w.w.w.w', 'wwwwwwwww', 'w.w.w.w.w', 'wwwwwwwww'], { c: '#7dd3fc', w: '#bae6fd' }),
    night: pixelIcon(['...mm....', '..mm.....', '.mm...s..', '.mm..sss.', '.mm...s..', '.mmm.....', '..mmmm...', '...mmmm..', '.........'], { m: '#c7d2fe', s: '#fbbf24' }),
    today: pixelIcon(['ggggggggg', 'g.......g', 'g.ss..y.g', 'g.ss....g', 'g...m...g', 'g..mmm..g', 'g.mmmmm.g', 'ggggggggg', '.........'], { g: '#e2bd56', s: '#7dd3fc', y: '#fbbf24', m: '#34d399' }),
    cup: pixelIcon(['..w.w....', '.w.w.....', 'ccccccc..', 'cbbbbbcc.', 'cbbbbbc.c', 'cbbbbbcc.', '.ccccc...', 'ddddddd..', '.........'], { w: '#cbd5e1', c: '#f3eee6', b: '#a0673a', d: '#94a3b8' })
  };
  function dockIcon(id) {
    try { var p = window.parent; if (p && p !== window && p.__mkDockIcon) return p.__mkDockIcon(id) || ''; } catch (_e) {}
    return '';
  }
  function hudCell(ico, key, label) {
    return '<div class="mx-hud-cell"><i class="mx-hud-ico" data-ico="' + ico + '"></i><div class="mx-hud-num"><b data-hud="' + key + '"></b><span>' + label + '</span></div></div>';
  }
  // each cell says what it counts: every drawing, this dežūra's, you, who
  // sleeps tonight, and the coffee in your hand (how much is left)
  function drawHud(st) {
    var s = st.stats, set = function (key, v) { var el = root.querySelector('[data-hud="' + key + '"]'); if (el) el.textContent = v == null ? '' : String(v); };
    set('total', s.total); set('today', s.today || 0); set('sleeping', s.sleeping);
    set('face', st.me.emoji || '🐱');
    var cup = st.cup && !st.cup.outAt ? st.cup : null;
    set('drink', cup ? cup.kind.name : st.brew ? 'Top…' : 'Nav');
    set('drinkSub', cup ? (cup.kind.can ? 'BUNDŽA ROKĀ' : 'KAFIJA ROKĀ') : 'PAŅEM PIE LÖFBERGS');
    var meter = root.querySelector('.mx-hud-meter');
    meter.hidden = !cup;
    if (cup) { var bars = '', all = cup.kind.sips || SIPS; for (var k = 0; k < all; k++) bars += k < cup.left ? '<i class="is-full"></i>' : '<i></i>'; meter.innerHTML = bars; }
  }
  function hudIcons() {
    [['today', ''], ['night', 'nsToggleBtnParent'], ['draw', ''], ['cup', '']].forEach(function (pair) {
      var el = root.querySelector('[data-ico="' + pair[0] + '"]');
      if (el) el.innerHTML = (pair[1] && dockIcon(pair[1])) || ICONS[pair[0]];
    });
  }

  /* ── Mūzika ───────────────────────────────────────────────────────────── */
  // Its own quiet player (not the radio): starts with the gallery, the
  // gramophone or M turns it off and on (remembered), closing stops it.
  var audio = null, musicIdx = 0, fadeTimer = 0, musicGen = 0;
  function musicWanted() { try { return localStorage.getItem(MUSIC_KEY) !== 'off'; } catch (_e) { return true; } }
  function musicRemember(on) { try { localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch (_e) {} }
  function fadeTo(v, ms, done) {
    clearInterval(fadeTimer);
    var a = audio, from = a.volume, t0 = performance.now();
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (v - from) * k));
      if (k >= 1) { clearInterval(fadeTimer); fadeTimer = 0; if (done) done(); }
    }, 30);
  }
  function musicStart() {
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('ended', function () {
        musicIdx = (musicIdx + 1) % MUSIC.length;
        if (state && state.musicOn) musicStart();
      });
      audio.addEventListener('error', function () {
        if (state && state.musicOn && audio.getAttribute('src')) say(state, 'Mūzika neielādējās. Pārlādē lapu');
      });
    }
    musicGen++;
    var src = ART + 'music/' + MUSIC[musicIdx].file + MUSIC_V;
    if (audio.getAttribute('src') !== src) audio.src = src;
    audio.volume = 0;
    var p = audio.play();
    // no click or key yet (the browser holds sound back): the first one starts it
    if (p && p.catch) p.catch(function () { if (state) state.musicBlocked = true; });
    fadeTo(MUSIC_VOL, 450);
    paintMusic();
  }
  function musicStop(release) {
    if (!audio) return;
    var a = audio, gen = ++musicGen;
    fadeTo(0, release ? 160 : 260, function () {
      if (gen !== musicGen) return;
      a.pause();
      if (release) { musicIdx = (musicIdx + 1) % MUSIC.length; a.removeAttribute('src'); a.load(); }
    });
    paintMusic();
  }
  function paintMusic() {
    if (!root) return;
    var on = !!(state && state.musicOn), btn = root.querySelector('.mx-doom-music'), now = root.querySelector('.mx-doom-now');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Izslēgt mūziku (M)' : 'Ieslēgt mūziku (M)');
    btn.classList.toggle('is-off', !on);
    now.textContent = on ? '♪ ' + MUSIC[musicIdx].title : 'Mūzika izslēgta';
  }
  function setMusic(st, on) {
    st.musicOn = on;
    musicRemember(on);
    if (on) musicStart(); else musicStop(false);
    var g = st.props.find(function (p) { return p.kind === 'gramophone'; });
    if (g) g.spr = gramophoneSprite(on);
    say(st, on ? 'Skan ' + MUSIC[musicIdx].title : 'Mūzika izslēgta. M: ieslēgt');
    paintMusic();
  }

  /* ── Kustība ──────────────────────────────────────────────────────────── */
  function free(st, x, y) {
    var map = st.map, mx = Math.floor(x), my = Math.floor(y);
    if (mx < 0 || my < 0 || mx >= map.w || my >= map.h) return false;
    var ci = my * map.w + mx, cell = map.grid[ci];
    if (cell === DOOR) { if (map.doors[map.doorAt[ci]].open < 0.9) return false; }
    else if (cell !== EMPTY) return false;
    for (var i = 0; i < st.props.length; i++) {
      var p = st.props[i];
      if (p.solid && !p.hidden && (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < p.solid * p.solid) return false;
    }
    return true;
  }
  function tryMove(st, nx, ny) {
    var r = RADIUS;
    if (free(st, nx + (nx > st.x ? r : -r), st.y) && free(st, nx, st.y + r) && free(st, nx, st.y - r)) st.x = nx;
    if (free(st, st.x, ny + (ny > st.y ? r : -r)) && free(st, st.x + r, ny) && free(st, st.x - r, ny)) st.y = ny;
  }
  function segmentAt(st) {
    var room = roomAt(st.map, st.x, st.y);
    if (room) return room;
    for (var i = 0; i < st.map.segs.length; i++) { var s = st.map.segs[i]; if (st.y >= s.y0 && st.y < s.y1 + 1) return s; }
    return null;
  }
  function segmentText(st, s) {
    if (s === MAIN || s === NMP) {
      var who = st.props.filter(function (p) { return p.kind === 'bed' && p.person && (s === NMP ? p.bed === 3 : p.bed < 3); })
        .map(function (p) { return p.person.first; });
      return s.name + (who.length ? ': ' + who.join(', ') + ' guļ' : '. Šonakt te neviens neguļ');
    }
    if (s.title) return s.title + ': ' + s.count + ' darbi un Mīlo Venēra';
    var title = st.dayTitle(s.day), n = s.count, word = n % 10 === 1 && n % 100 !== 11 ? ' zīmējums' : ' zīmējumi';
    return s.today ? title + ': ' + n + word + '. Tukšajos rāmjos vari zīmēt' : title + ': ' + n + word;
  }
  // cats: walk to a free spot of their room, sit or wash a while, walk on
  function catGo(st, c) {
    var ways = CAT_WAYS[c.room], beds = st.props.filter(function (p) { return p.kind === 'bed'; });
    for (var tries = 0; tries < 10; tries++) {
      var w = ways[(Math.random() * ways.length) | 0], dx = w[0] - c.x, dy = w[1] - c.y, len = Math.hypot(dx, dy);
      if (len < 0.8) continue;
      var blocked = beds.some(function (b) {                  // not over a bed
        var t = Math.max(0, Math.min(1, ((b.x - c.x) * dx + (b.y - c.y) * dy) / (len * len)));
        return Math.hypot(c.x + dx * t - b.x, c.y + dy * t - b.y) < 0.55;
      });
      if (blocked) continue;
      c.tx = w[0]; c.ty = w[1]; c.mode = 'walk';
      return;
    }
    c.mode = 'sit'; c.until = performance.now() + 3000;
  }
  function updateCats(st, dt, now) {
    for (var i = 0; i < st.cats.length; i++) {
      var c = st.cats[i];
      c.t += dt;
      if (c.mode === 'walk') {
        var dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d < 0.04) { c.mode = Math.random() < 0.55 ? 'sit' : 'groom'; c.until = now + 2600 + Math.random() * 4200; c.t = 0; }
        else { var sp = Math.min(d, CAT_SPEED * dt); c.vx = dx / d; c.vy = dy / d; c.x += c.vx * sp; c.y += c.vy * sp; }
      } else if (now > c.until) catGo(st, c);
      if (st.catFrames) {
        var row = c.mode === 'walk' ? 0 : c.mode === 'sit' ? 1 : 2, fps = c.mode === 'walk' ? 11 : c.mode === 'sit' ? 4 : 8;
        c.spr = st.catFrames[c.coat][row][((c.t * fps) | 0) % 8];
      }
    }
  }
  function frame(now) {
    var st = state;
    if (!st || st.closed) return;
    st.raf = requestAnimationFrame(frame);
    if (document.hidden || st.viewing || st.paused) { st.last = now; return; }
    var dt = Math.min(0.05, (now - (st.last || now)) / 1000);
    st.last = now;
    var k = st.keys, moved = false;
    var turn = (k.ArrowLeft ? -1 : 0) + (k.ArrowRight ? 1 : 0);
    var fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    var strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (turn || fwd || strafe) st.goal = null;
    if (turn) { st.a += turn * TURN * dt; moved = true; }
    if (st.dragTurn) { st.a += st.dragTurn; st.dragTurn = 0; moved = true; }
    if ((fwd || strafe || st.goal) && st.seated) standUp(st);
    st.moving = !!(fwd || strafe || st.goal);
    if (fwd || strafe) {
      var sp = (k.ShiftLeft || k.ShiftRight ? RUN : MOVE) * dt, ca = Math.cos(st.a), sa = Math.sin(st.a);
      var len = Math.hypot(fwd, strafe) || 1;
      tryMove(st, st.x + (ca * fwd - sa * strafe) / len * sp, st.y + (sa * fwd + ca * strafe) / len * sp);
      st.walk += dt * 9;
      moved = true;
    } else if (st.goal) moved = walkGoal(st, dt) || moved;
    if (moved) {
      var seg = segmentAt(st);
      if (seg !== st.seg) { st.seg = seg; if (seg) say(st, segmentText(st, seg)); }
    }
    // doors slide open when you come near and close behind you
    st.map.doors.forEach(function (d) {
      var near = Math.hypot(st.x - d.x - 0.5, st.y - d.y - 0.5) < 1.8;
      var want = near ? 1 : 0;
      if (d.open !== want) { d.open = want ? Math.min(1, d.open + dt * 2.6) : Math.max(0, d.open - dt * 2); moved = true; }
    });
    updateCats(st, dt, now);
    var aq = st.aqua, aquaTick = aq && st.aquaSeen && !st.viewing && now - aq.at >= (aq.food.length ? 32 : 48);
    if (aquaTick) { stepAquarium(aq, Math.min(0.1, (now - (aq.at || now)) / 1000)); paintAquarium(aq); aq.at = now; }
    // eye height eases to sitting or standing
    var eye = st.seated ? EYE_SEATED : EYE;
    if (Math.abs(st.z - eye) > 0.002) { st.z += (eye - st.z) * Math.min(1, dt * 9); moved = true; } else st.z = eye;
    if (st.sip) {
      moved = true;
      if (now - st.sip >= SIP_MS) finishSip(st);
    }
    if (st.brew && now - st.brew.at >= BREW_MS) finishBrew(st);
    var cup = st.cup;
    if (cup && ((cup.inAt && now - cup.inAt < HAND_MS + 40) || cup.outAt)) {
      moved = true;
      if (cup.outAt && now - cup.outAt >= HAND_MS) { st.cup = null; drawHud(st); }
    }
    if (st.msgDrawn && now >= st.msgUntil) st.dirty = true;     // the message has run out: clear it
    // nothing changed: nothing is drawn; a cat in sight is drawn 30 times a second
    var catTick = st.catsSeen && now - st.drawnAt >= 32;
    if (!moved && !st.dirty && !catTick && !aquaTick) return;
    if (now - st.drawnAt < 28 && !st.dirty) return;
    st.drawnAt = now;
    st.dirty = false;
    render(st);
    keepUp(st);
  }
  // click-to-walk: turn towards the spot and walk; at a thing, use it on arrival
  function walkGoal(st, dt) {
    var g = st.goal, dx = g.x - st.x, dy = g.y - st.y, d = Math.hypot(dx, dy);
    if (d <= g.stop) { st.goal = null; if (g.then) interact(g.then); return true; }
    var diff = Math.atan2(dy, dx) - st.a;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    var turn = TURN * 1.6 * dt;
    st.a += Math.max(-turn, Math.min(turn, diff));
    if (Math.abs(diff) < 0.6) {
      var ox = st.x, oy = st.y, sp = MOVE * dt * Math.min(1, 0.4 + d);
      tryMove(st, st.x + Math.cos(st.a) * sp, st.y + Math.sin(st.a) * sp);
      st.walk += dt * 9;
      if (Math.hypot(st.x - ox, st.y - oy) < sp * 0.3) {
        g.stuck = (g.stuck || 0) + dt;
        if (g.stuck > 0.35) {
          st.goal = null;
          if (g.then && d <= g.stop + 1) interact(g.then);
        }
      } else g.stuck = 0;
    }
    return true;
  }
  // a slow computer: draw a smaller picture (and remember it for next time)
  function keepUp(st) {
    if (st.frames < 24 || st.cost < 14 || W <= 400 || st.loweredAt > st.frames - 24) return;
    var next = Math.max(400, W - 80);
    try { localStorage.setItem(QUALITY_KEY, String(next)); } catch (_e) {}
    setSize(st, next);
    st.loweredAt = st.frames;
    st.cost = 0;
  }
  function say(st, text) { st.msg = text; st.msgUntil = performance.now() + 3600; st.dirty = true; }

  /* ── Darbības ─────────────────────────────────────────────────────────── */
  function sip(st) {
    if (!st.cup || st.cup.outAt) { say(st, st.brew ? 'Kafija vēl top' : 'Vispirms paņem kafiju: Löfbergs aparāts vestibilā'); return; }
    if (!st.sip) { st.sip = performance.now(); st.dirty = true; }
  }
  function finishSip(st) {
    st.sip = 0;
    st.sips++;
    drawHud(st);
    if (!st.cup) return;
    st.cup.left--;
    if (st.cup.left <= 0) {
      st.cup.outAt = performance.now();
      if (st.cup.kind.can) {
        var can = st.props.find(function (p) { return p.kind === 'monster'; });
        if (can) can.hidden = false;                                     // the next one waits by the box
        say(st, 'Izdzerts! Kastē stūrī ir vēl');
      } else say(st, 'Izdzerts! Vēl vienu? Löfbergs aparāts ir vestibilā');
    }
    drawHud(st);
  }
  function finishBrew(st) {
    var kind = st.brew.kind;
    st.brew = null;
    var m = st.props.find(function (p) { return p.kind === 'machine'; });
    if (m) m.spr = machineSprite(false);
    st.cup = { kind: kind, left: SIPS, canvas: handCanvas(kind), inAt: performance.now() };
    drawHud(st);
    say(st, kind.name + ' rokā. C vai klikšķis uz krūzītes: malks');
  }
  function brew(st, i) {
    menu(false);
    var kind = COFFEES[i];
    if (!kind || st.brew) return;
    if (st.cup && !st.cup.outAt) st.cup.outAt = performance.now();
    st.brew = { kind: kind, at: performance.now() };
    drawHud(st);
    var m = st.props.find(function (p) { return p.kind === 'machine'; });
    if (m) m.spr = machineSprite(true);
    say(st, 'Löfbergs gatavo: ' + kind.name + ', ' + PRICE);
  }
  function takeCan(st) {
    if (st.cup && st.cup.kind.can && !st.cup.outAt) { say(st, 'Bundža jau ir rokā. C: malks'); return; }
    if (st.cup && !st.cup.outAt) st.cup.outAt = performance.now();
    var can = st.props.find(function (p) { return p.kind === 'monster'; });
    if (can) can.hidden = true;
    st.cup = { kind: MONSTER, left: MONSTER.sips, canvas: handCanvas(MONSTER), inAt: performance.now() };
    drawHud(st);
    say(st, 'White Monster rokā. C vai klikšķis uz bundžas: malks');
  }
  function standUp(st) {
    st.seated = false;
    st.props.forEach(function (p) {
      if (p.kind === 'chair') p.hidden = false;
      if (p.kind === 'table') p.spr = tableSprite(false);
    });
    st.dirty = true;
  }
  function sitDown(st, prop) {
    var table = st.props.find(function (p) { return p.kind === 'table'; });
    var chairs = st.props.filter(function (p) { return p.kind === 'chair'; });
    if (!table || !chairs.length) return;
    var chair = prop.kind === 'chair' ? prop : chairs.reduce(function (a, b) { return Math.hypot(a.x - st.x, a.y - st.y) <= Math.hypot(b.x - st.x, b.y - st.y) ? a : b; });
    chairs.forEach(function (c) { c.hidden = c === chair; });
    st.x = chair.x; st.y = chair.y;
    st.a = Math.atan2(table.y - chair.y, table.x - chair.x);
    st.seated = true;
    st.goal = null;
    table.spr = tableSprite(true);
    say(st, st.cup ? 'Tu apsēdies. C: malks, W: piecelties' : 'Tu apsēdies. W: piecelties');
  }
  function interact(ref) {
    var st = state;
    if (!st || !ref) return;
    if (ref.isArt) {
      if (ref.plan) { look({ src: st.planUrl || (st.planUrl = planCanvas(st).toDataURL('image/png')), caption: 'Nakts sadalījums: ' + st.dayTitle(st.today || '').toLowerCase() }); return; }
      if (ref.empty) { if (st.onDraw) st.onDraw({ slot: ref.key, day: ref.day }); return; }
      look(lookSpecFor(st, ref.item, ref));
      return;
    }
    switch (ref.kind) {
      case 'easel': if (st.onDraw) st.onDraw({}); return;
      case 'table': case 'chair': if (!st.seated) sitDown(st, ref); return;
      case 'gramophone': setMusic(st, !st.musicOn); return;
      case 'machine': if (!st.brew) menu(true); return;
      case 'statue': look({ src: ART + 'venus-milo.webp' + ART_V, caption: VENUS.caption }); return;
      case 'aquarium': feedFish(st, ref.at); return;
      case 'monster': case 'monsterbox': takeCan(st); return;
      case 'cat':
        ref.mode = 'sit'; ref.until = performance.now() + 5000; ref.t = 0;
        say(st, ref.name + ': murr!');
        return;
      case 'bed':
        say(st, ref.person ? ref.person.name + (ref.person.from ? ' guļ ' + ref.person.from + '–' + ref.person.to : '') + '. Lai labi atpūšas!' : 'Tukša gulta');
    }
  }
  // what is under a click on the picture; walk there, or use it when near
  function clickAt(st, cx, cy) {
    var hc = st.cup && st.cup.canvas;
    if (hc && !st.cup.outAt && cy > VIEW_H - hc.show && cx > W - hc.width) { sip(st); return; }
    var x = Math.max(0, Math.min(W - 1, cx | 0)), ref = st.pickRef[x];
    if (ref && ref.aquarium && !inTank(st, st.pickWX[x])) ref = null;
    if (ref && ref.aquarium) ref.at = st.pickWX[x];
    if (ref && cy >= st.pickY0[x] - 4 && cy <= st.pickY1[x] + 4) {
      var reach = ref.isArt ? 3.4 : ref.reach || 2.4;
      if (st.pickDist[x] <= reach) { interact(ref); return; }
      st.goal = { x: st.pickWX[x], y: st.pickWY[x], stop: ref.isArt ? 1.4 : (ref.solid || 0.2) + 0.7, then: ref };
      return;
    }
    if (cy <= VIEW_H / 2 + 2) return;
    var dist = (st.z * P) / (cy - VIEW_H / 2), cam = 2 * cx / W - 1;
    var dirX = Math.cos(st.a), dirY = Math.sin(st.a), gx = st.x + dist * (dirX - dirY * FOV * cam), gy = st.y + dist * (dirY + dirX * FOV * cam);
    st.goal = { x: gx, y: gy, stop: 0.2 };
  }

  /* ── Logs ─────────────────────────────────────────────────────────────── */
  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function build() {
    root = document.createElement('div');
    root.id = 'mxDoom';
    root.hidden = true;
    root.innerHTML = '<section class="mx-doom" role="dialog" aria-modal="true" aria-label="Galerija">'
      + '<div class="mx-doom-bar"><strong>Galerija</strong>'
      + '<span class="mx-doom-help" title="' + CREDITS + '">W A S D vai bultas: iet, velc ar peli: skaties, klikšķis: iet vai darīt, E: darīt, C: malks, M: mūzika, Esc: iziet</span>'
      + '<span class="mx-doom-now" title="' + MUSIC_CREDIT + '"></span>'
      + '<button type="button" class="mx-doom-music" aria-pressed="true"><span class="is-on">' + ICON_ON + '</span><span class="is-off">' + ICON_OFF + '</span></button>'
      + '<button type="button" class="mx-doom-all-btn">Visi zīmējumi</button><button type="button" class="mx-doom-draw">Uzzīmēt</button><button type="button" class="mx-doom-close" aria-label="Iziet no galerijas">×</button></div>'
      + '<div class="mx-doom-screen"><canvas class="mx-doom-view"></canvas>'
      + '<div class="mx-doom-hud">' + hudCell('draw', 'total', 'ZĪMĒJUMI') + hudCell('today', 'today', 'ŠODIEN')
      + '<div class="mx-hud-face"><b data-hud="face"></b><span>TU</span></div>' + hudCell('night', 'sleeping', 'GUĻ')
      + '<div class="mx-hud-cell mx-hud-coffee"><i class="mx-hud-ico" data-ico="cup"></i><div class="mx-hud-num"><b data-hud="drink"></b><span data-hud="drinkSub"></span></div><span class="mx-hud-meter" hidden></span></div></div>'
      + '<button type="button" class="mx-doom-prompt" hidden><kbd></kbd><span></span></button>'
      + '<div class="mx-doom-menu" hidden><div class="mx-doom-menu-card" role="dialog" aria-label="Löfbergs kafijas aparāts">'
      + '<div class="mx-doom-menu-head"><strong>Löfbergs</strong><span>Izvēlies kafiju</span></div><div class="mx-doom-menu-list">'
      + COFFEES.map(function (c, i) { return '<button type="button" data-coffee="' + i + '"><i class="mx-doom-cup">' + pixelIcon(c.cup, CUP_COLORS) + '</i><span>' + c.name + '<small>' + PRICE + '</small></span><kbd>' + (i + 1) + '</kbd></button>'; }).join('')
      + '</div><button type="button" class="mx-doom-menu-cancel">Atpakaļ</button></div></div>'
      + '<div class="mx-doom-look" hidden><figure><img alt=""><figcaption></figcaption></figure>'
      + '<div class="mx-doom-look-actions"><button type="button" class="mx-doom-back">Atpakaļ</button><button type="button" class="mx-doom-redraw">Pārzīmēt</button><button type="button" class="mx-doom-chat">Komentāros</button></div></div>'
      + '<div class="mx-doom-all" hidden><div class="mx-doom-all-head"><strong>Visi zīmējumi</strong><span></span><button type="button" class="mx-doom-all-close">Atpakaļ</button></div><div class="mx-doom-all-grid"></div></div>'
      + '</div></section>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) {
      var st = state;
      // only × or Esc leave the game: a click beside it does nothing
      if (e.target.closest('.mx-doom-close')) { close(); return; }
      if (!st) return;
      if (e.target.closest('.mx-doom-draw')) { if (st.onDraw) st.onDraw({}); return; }
      if (e.target.closest('.mx-doom-music')) { setMusic(st, !st.musicOn); return; }
      if (e.target.closest('.mx-doom-back')) { look(null); return; }
      if (e.target.closest('.mx-doom-redraw')) { var spec = st.lookSpec; if (spec && spec.redraw && st.onDraw) st.onDraw(spec.redraw); return; }
      if (e.target.closest('.mx-doom-all-btn')) { if (st.onAll) st.onAll(e.target.closest('.mx-doom-all-btn')); else showAll(true); return; }
      if (e.target.closest('.mx-doom-all-close')) { showAll(false); return; }
      var tile = e.target.closest('[data-all]');
      if (tile) { var it = st.items[+tile.dataset.all]; if (it) look(lookSpecFor(st, it, null)); return; }
      if (e.target.closest('.mx-doom-chat')) { var cb = st.onComments; close(); if (cb) cb(); return; }
      var pick = e.target.closest('[data-coffee]');
      if (pick) { brew(st, +pick.dataset.coffee); return; }
      if (e.target.closest('.mx-doom-menu-cancel') || e.target.classList.contains('mx-doom-menu')) { menu(false); return; }
      if (e.target.closest('.mx-doom-prompt')) { if (st.aim) interact(st.aim); else if (st.seated) standUp(st); }
    });
    var view = root.querySelector('.mx-doom-view');
    var drag = null;
    var toCanvas = function (e) { var r = view.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * VIEW_H]; };
    view.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, moved: false };
      view.setPointerCapture(e.pointerId);
      if (state && state.musicBlocked && state.musicOn) { state.musicBlocked = false; musicStart(); }
    });
    view.addEventListener('pointermove', function (e) {
      if (!state) return;
      if (!drag) {                                               // a hand over things you can use
        var p = toCanvas(e), x = Math.max(0, Math.min(W - 1, p[0] | 0)), ref = state.pickRef[x];
        var over = ref && p[1] >= state.pickY0[x] && p[1] <= state.pickY1[x];
        view.classList.toggle('is-over', !!over);
        return;
      }
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 2) drag.moved = true;
      drag.x = e.clientX;
      if (drag.moved) { state.dragTurn += dx * 0.0055; state.goal = null; }
    });
    view.addEventListener('pointerup', function (e) {
      var was = drag;
      drag = null;
      if (!was || was.moved || !state) return;
      var p = toCanvas(e);
      clickAt(state, p[0], p[1]);
    });
    window.addEventListener('keydown', function (e) {
      var st = state;
      if (!st || st.closed || root.hidden) return;
      if (document.querySelector('.mk-draw-overlay') || st.paused) return;      // the editor or the hall of fame is on top
      if (st.musicBlocked && st.musicOn) { st.musicBlocked = false; musicStart(); }
      var menuOpen = !root.querySelector('.mx-doom-menu').hidden;
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (menuOpen) menu(false); else if (!root.querySelector('.mx-doom-look').hidden) look(null); else if (!root.querySelector('.mx-doom-all').hidden) showAll(false); else close();
        return;
      }
      if (menuOpen) {
        var n = +e.key;
        if (n >= 1 && n <= COFFEES.length) { brew(st, n - 1); e.preventDefault(); }
        return;
      }
      if (st.viewing) return;
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        if (e.target && e.target.closest && e.target.closest('button') && e.code !== 'KeyE') return;
        if (st.aim) interact(st.aim);
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyC') { sip(st); e.preventDefault(); return; }
      if (e.code === 'KeyM') { setMusic(st, !st.musicOn); e.preventDefault(); return; }
      if (/^(Arrow|Key[WASD]|Shift)/.test(e.code)) { st.keys[e.code] = true; e.preventDefault(); }
    }, true);
    window.addEventListener('keyup', function (e) { if (state) state.keys[e.code] = false; }, true);
    window.addEventListener('blur', function () { if (state) state.keys = {}; });
    // another tab: the music waits
    document.addEventListener('visibilitychange', function () {
      var st = state;
      if (!st || !audio) return;
      if (document.hidden) { if (!audio.paused) { audio.pause(); st.musicHidden = true; } }
      else if (st.musicHidden) { st.musicHidden = false; if (st.musicOn) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } }
    });
  }
  // what the big view shows for a picture; the team's drawings can be drawn over
  function lookSpecFor(st, it, ref) {
    if (it.classic) return { src: it.url, caption: LEONARDO + ', ' + it.title + ' (' + it.year + ')' };
    var mine = st.items.some(function (o) { return o.parent && o.parent === it.key; });
    return {
      src: it.url,
      caption: (it.authorEmoji ? it.authorEmoji + ' ' : '') + (it.authorName || 'Anonīms') + ', ' + st.dayTitle(it.day).toLowerCase() + (mine ? ' (pārzīmēts, rāmī ir jaunais)' : ''),
      chat: true,
      redraw: it.key && it.url && !/^data:/.test(it.url) ? { over: it.key, base: it.url, slot: ref ? ref.key : '', day: it.day } : null
    };
  }
  // every drawing, the covered ones too, newest first
  function showAll(show) {
    var st = state, box = root.querySelector('.mx-doom-all');
    if (!st) return;
    box.hidden = !show;
    st.viewing = show || !root.querySelector('.mx-doom-look').hidden;
    st.keys = {};
    st.dirty = true;
    if (!show) return;
    var grid = box.querySelector('.mx-doom-all-grid'), n = st.items.length;
    box.querySelector('.mx-doom-all-head span').textContent = n ? n + (n % 10 === 1 && n % 100 !== 11 ? ' zīmējums' : ' zīmējumi') : '';
    grid.innerHTML = n ? st.items.map(function (it, i) {
      return '<button type="button" class="mx-doom-all-tile" data-all="' + i + '"><img alt="" loading="lazy" decoding="async" src="' + String(it.url).replace(/"/g, '&quot;') + '">'
        + '<span>' + (it.authorEmoji || '') + ' ' + String(st.dayTitle(it.day)).replace(/</g, '&lt;') + '</span></button>';
    }).join('') : '<p class="mx-doom-all-empty">Vēl nav neviena zīmējuma. Uzzīmē pirmo!</p>';
  }
  function menu(show) {
    var st = state, box = root.querySelector('.mx-doom-menu');
    box.hidden = !show;
    if (st) { st.viewing = show || !root.querySelector('.mx-doom-look').hidden; st.keys = {}; st.dirty = true; }
    if (show) { var first = box.querySelector('[data-coffee]'); if (first) first.focus({ preventScroll: true }); }
  }
  function look(spec) {
    var st = state, box = root.querySelector('.mx-doom-look');
    if (!st) return;
    st.viewing = !!spec;
    box.hidden = !spec;
    if (!spec) { st.lookSpec = null; st.viewing = !root.querySelector('.mx-doom-all').hidden; st.dirty = true; return; }
    st.lookSpec = spec;
    box.querySelector('img').src = spec.src;
    box.querySelector('figcaption').textContent = spec.caption;
    box.querySelector('.mx-doom-chat').hidden = !spec.chat;
    box.querySelector('.mx-doom-redraw').hidden = !spec.redraw;
    st.keys = {};
  }
  function loadArt(st, slot) {
    var key = slot.x + ',' + slot.y + ',' + slot.face, base = slot.night ? st.tex.nightWallCanvas : st.tex.plasterCanvas;
    var rec = { isArt: true, key: key, day: slot.day, item: slot.item || null, empty: !!slot.empty, plan: !!slot.plan, reach: 3.4 };
    rec.tex = wallTex(slot.plan ? framedCanvas(planCanvas(st), base, false) : framedCanvas(null, base, !!slot.empty));
    st.artAt[(slot.y * st.map.w + slot.x) * 4 + FACES[slot.face]] = rec;
    if (!slot.item) return;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = function () {
      if (st.closed) return;
      try { rec.tex = wallTex(framedCanvas(img, base, false)); } catch (_e) {}   // a picture from a host without CORS stays an empty frame
      st.dirty = true;
    };
    img.src = slot.item.url;
  }
  // the picture's size from the window (and what this computer managed before)
  function pickWidth() {
    var cssW = Math.min(window.innerWidth * 0.96 - 32, (window.innerHeight * 0.92 - 120) * 512 / 269, 1280);
    var want = Math.round(cssW / 2 / 32) * 32, cap = 640;
    try { cap = +localStorage.getItem(QUALITY_KEY) || 640; } catch (_e) {}
    return Math.max(400, Math.min(cap, 640, Math.max(want, 480)));
  }
  function setSize(st, w) {
    W = w; VIEW_H = Math.round(w * 269 / 512); P = W / (2 * FOV);
    var view = root.querySelector('.mx-doom-view');
    view.width = W; view.height = VIEW_H;
    st.ctx = view.getContext('2d', { alpha: false });
    st.img = st.ctx.createImageData(W, VIEW_H);
    st.buf = new Uint32Array(st.img.data.buffer);
    ['zbuf', 'glassCols', 'glassX', 'cross', 'pickDist', 'pickWX', 'pickWY'].forEach(function (k) { st[k] = new Float32Array(W); });
    st.glassSide = new Uint8Array(W);
    st.wallTop = new Int32Array(W); st.wallBot = new Int32Array(W); st.pickY0 = new Int32Array(W); st.pickY1 = new Int32Array(W);
    st.pickRef = new Array(W).fill(null);
    st.rowDist = new Float32Array(VIEW_H); st.rowOwn = new Uint32Array(VIEW_H); st.rowOther = new Uint32Array(VIEW_H);
    if (st.cup) st.cup.canvas = handCanvas(st.cup.kind);
    drawHud(st);
    st.dirty = true;
  }
  // cats and the statue: loaded once, kept for the next visit
  var catImg = null, bustImg = null;
  function imgCanvas(img) { var c = canvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); return c; }
  function loadImage(src, done) { var img = new Image(); img.decoding = 'async'; img.onload = function () { done(img); }; img.src = src; return img; }
  function open(opts, keep) {
    if (!root) build();
    if (!luts) makeLuts();
    var origin = opts.origin;
    if (state) close(true, !!keep);
    var items = (opts.items || []).slice(), sleepers = (opts.sleepers || []).slice();
    var map = buildMap(items, opts.today, opts.slotMap || {});
    var plasterC = plasterCanvas(), nightWallC = nightWallCanvas();
    map.doors.forEach(function (d) { d.tex = wallTex(doorCanvas(d.label)); });
    // who sleeps in which bed (the night panel's arrangement; else in turn)
    var bedPeople = [null, null, null, null], rest = [];
    sleepers.forEach(function (p) { if (p.bed >= 0 && p.bed < 4 && !bedPeople[p.bed]) bedPeople[p.bed] = p; else rest.push(p); });
    rest.forEach(function (p) { var i = bedPeople.indexOf(null); if (i >= 0) bedPeople[i] = p; });
    var props = BED_SPOTS.map(function (s, i) {
      return { kind: 'bed', bed: i, x: s[0], y: s[1], h: 0.5, solid: 0.42, reach: 2.8, shade: 0.3, person: bedPeople[i] };
    });
    props.push({ kind: 'table', x: 3.1, y: 2.7, h: 0.34, solid: 0.42, reach: 2.6, shade: 0.22 });
    props.push({ kind: 'chair', x: 2.42, y: 2.7, h: 0.42, reach: 2.6, shade: 0.12 });
    props.push({ kind: 'chair', x: 3.78, y: 2.7, h: 0.42, reach: 2.6, shade: 0.12 });
    props.push({ kind: 'gramophone', x: 1.45, y: 1.4, h: 0.5, solid: 0.34, reach: 2.4, shade: 0.2 });
    // the White Monster box in the empty corner at the far end of the hall, a can beside it
    props.push({ kind: 'monsterbox', x: 1.38, y: map.h - 1.38, h: 0.3, solid: 0.32, reach: 2.2, shade: 0.24 });
    props.push({ kind: 'monster', x: 1.98, y: map.h - 1.3, h: 0.17, reach: 2.2, shade: 0.05 });
    props.push({ kind: 'machine', x: 1.32, y: 2.55, h: 0.74, solid: 0.3, reach: 2.4, shade: 0.24 });
    props.push({ kind: 'easel', x: 1.5, y: 5.3, h: 0.62, solid: 0.34, reach: 2.6, shade: 0.18 });
    props.push({ kind: 'statue', x: 3.0, y: (LEO_Y0 + LEO_Y1) / 2 + 0.5, h: 0.82, solid: 0.38, reach: 2.8, shade: 0.2 });
    var cats = CATS.map(function (c, i) {
      var way = CAT_WAYS[c[2]][(i * 3) % CAT_WAYS[c[2]].length];
      return { kind: 'cat', name: c[0], coat: c[1], room: c[2], x: way[0], y: way[1], h: CAT_H, reach: 2.2, shade: 0.07, vx: 1, vy: 0, mode: 'sit', until: performance.now() + 800 + i * 900, t: i, flip: i === 1 };
    });
    props = props.concat(cats);
    var st = state = {
      map: map, x: 4.3, y: 4.55, a: -2.75, z: EYE, keys: {}, dragTurn: 0, walk: 0, sips: 0, sip: 0, seated: false,
      artAt: new Array(map.w * map.h * 4), aim: null, dirty: true, closed: false, frames: 0, cost: 0, loweredAt: -99, drawnAt: 0,
      props: props, cats: cats, catFrames: null, cup: null, brew: null, goal: null, promptKey: '',
      aqua: null, aquaSeen: true,
      musicOn: false, today: opts.today, sleepers: sleepers, bedPeople: bedPeople, items: items,
      me: opts.me || {},
      stats: Object.assign({ total: items.length, days: map.segs.length - 1, sleeping: sleepers.length, coffee: '', comments: '' }, opts.stats || {}),
      onDraw: opts.onDraw, onComments: opts.onComments, onAll: opts.onAll, dayTitle: opts.dayTitle || function (d) { return d; },
      tex: {
        plaster: wallTex(plasterC), plasterCanvas: plasterC, stone: wallTex(stoneCanvas()), jamb: wallTex(jambCanvas()),
        nightWall: wallTex(nightWallC), nightWallCanvas: nightWallC, glass: wallTex(glassCanvas()),
        floor: wallTex(floorCanvas()), ceil: wallTex(ceilCanvas()), nightFloor: wallTex(nightFloorCanvas()), nightCeil: wallTex(nightCeilCanvas())
      },
      seg: null, originEl: origin || null
    };
    var makeSprites = function () {
      props.forEach(function (p) {
        if (p.kind === 'cat') return;
        p.spr = p.kind === 'bed' ? bedSprite(p.person) : p.kind === 'table' ? tableSprite(st.seated) : p.kind === 'chair' ? chairSprite()
          : p.kind === 'easel' ? easelSprite() : p.kind === 'gramophone' ? gramophoneSprite(st.musicOn)
          : p.kind === 'machine' ? machineSprite(!!st.brew)
          : p.kind === 'monsterbox' ? (held.monsterBox ? makeSprite(imgCanvas(held.monsterBox)) : monsterBoxSprite())
          : p.kind === 'monster' ? (held.monsterCan ? makeSprite(imgCanvas(held.monsterCan)) : monsterCanSprite())
          : statueSprite(bustImg && bustImg.complete ? bustImg : null);
      });
    };
    root.hidden = false;
    if (!keep) {
      if (window.MinkaDitherBackdrop) window.MinkaDitherBackdrop.attach(root, { box: root.querySelector('.mx-doom') });
      hudIcons();
    }
    setSize(st, keep ? keep.w : pickWidth());
    if (keep) {
      Object.assign(st, { x: keep.x, y: keep.y, a: keep.a, z: keep.z, sips: keep.sips, cup: keep.cup, seated: keep.seated, musicOn: keep.musicOn, originEl: keep.origin });
      if (st.cup) st.cup.canvas = handCanvas(st.cup.kind);
    } else {
      st.musicOn = musicWanted();
      if (st.musicOn) musicStart();
    }
    makeSprites();
    if (st.seated) sitDown(st, props.find(function (p) { return p.kind === 'chair' && Math.hypot(p.x - st.x, p.y - st.y) < 0.05; }) || props.find(function (p) { return p.kind === 'table'; }));
    map.slots.forEach(function (slot) { loadArt(st, slot); });
    // the aquarium's three cells of the end wall (their faces towards the hall)
    st.aqua = makeAquarium(st, map.aquarium);
    st.aqua.cells.forEach(function (tex, i) {
      st.artAt[(map.aquarium.y * map.w + map.aquarium.cell1 - i) * 4 + FACES.n] = { kind: 'aquarium', aquarium: true, reach: 2.6, tex: tex, at: 0 };
    });
    paintAquarium(st.aqua);
    paintMusic();
    drawHud(st);
    if (!keep) say(st, 'Laipni lūgti galerijā! Pa kreisi Löfbergs kafija, pa labi durvis uz Nakts istabu');
    // the cats and the statue (cached by the browser and kept here after the first visit)
    var withCats = function (img) { if (state !== st) return; st.catFrames = catFrames(img); updateCats(st, 0, performance.now()); st.dirty = true; };
    if (catImg && catImg.complete && catImg.naturalWidth) withCats(catImg); else catImg = loadImage(ART + 'cats.webp' + CAT_V, withCats);
    var withBust = function (img) { if (state !== st) return; var p = props.find(function (q) { return q.kind === 'statue'; }); p.spr = statueSprite(img); st.dirty = true; };
    if (!(bustImg && bustImg.complete && bustImg.naturalWidth)) bustImg = loadImage(ART + 'venus-milo.webp' + ART_V, withBust);
    // the drinks in hand and the Monster corner
    [['coffee', 'hand-coffee'], ['can', 'hand-can'], ['monsterCan', 'monster-can'], ['monsterBox', 'monster-box']].forEach(function (pair) {
      if (held[pair[0]]) return;
      loadImage(ART + pair[1] + '.webp' + HELD_V, function (img) {
        held[pair[0]] = img;
        if (state !== st) return;
        if (st.cup && (pair[0] === 'coffee' || pair[0] === 'can')) st.cup.canvas = handCanvas(st.cup.kind);
        makeSprites();
        st.dirty = true;
      });
    });
    var screen = root.querySelector('.mx-doom');
    if (window.MinkaMotion && origin) window.MinkaMotion.openSurface(screen, { key: 'doom', origin: origin, scrim: root });
    st.raf = requestAnimationFrame(frame);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      if (state !== st || st.closed) return;
      makeSprites();
      if (st.cup) st.cup.canvas = handCanvas(st.cup.kind);
      var plan = map.slots.find(function (s) { return s.plan; });
      if (plan) loadArt(st, plan);
      st.planUrl = '';
      drawHud(st);
      st.dirty = true;
    });
  }
  function close(now, keepMusic) {
    var st = state;
    if (!st) return;
    st.closed = true;
    cancelAnimationFrame(st.raf);
    state = null;
    if (!keepMusic) musicStop(true);
    var box = root.querySelector('.mx-doom-look');
    box.hidden = true;
    box.querySelector('img').removeAttribute('src');
    root.querySelector('.mx-doom-menu').hidden = true;
    root.querySelector('.mx-doom-all').hidden = true;
    root.querySelector('.mx-doom-prompt').hidden = true;
    if (keepMusic) return;
    var screen = root.querySelector('.mx-doom');
    var done = function () { root.hidden = true; root.classList.remove('is-closing'); };
    if (now !== true && window.MinkaMotion && st.originEl) {
      root.classList.add('is-closing');
      window.MinkaMotion.closeSurface(screen, { key: 'doom', origin: st.originEl, scrim: root }, done);
    } else done();
  }
  // new drawings while the gallery is open: rebuild the hall, keep the pose, the cup and the music
  function refresh(opts) {
    var st = state;
    if (!st) return;
    open(Object.assign({}, opts, { origin: null }), {
      w: W, x: st.x, y: st.y, a: st.a, z: st.z, sips: st.sips, cup: st.cup, seated: st.seated, musicOn: st.musicOn, origin: st.originEl
    });
  }
  // For measuring: draws n frames turning on the spot, returns ms a frame.
  function bench(n) {
    if (!state) return null;
    var t = performance.now();
    for (var i = 0; i < (n || 60); i++) { state.a += 0.02; render(state); }
    return { ms: +((performance.now() - t) / (n || 60)).toFixed(2), w: W, h: VIEW_H };
  }
  // For checks: stand somewhere; returns what the crosshair rests on.
  function pose(x, y, a) {
    if (!state) return null;
    state.x = x; state.y = y; state.a = a; state.goal = null; state.dirty = true;
    render(state);
    var p = promptFor(state);
    return { aim: state.aim && (state.aim.isArt ? (state.aim.plan ? 'plan' : state.aim.empty ? 'empty' : 'art') : state.aim.kind), prompt: p && p.join(' '), w: W, mapH: state.map.h };
  }
  function act(what) {
    var st = state;
    if (!st) return null;
    if (what === 'sip') sip(st);
    else if (typeof what === 'number') brew(st, what);
    else if (what !== 'status' && st.aim) interact(st.aim);
    return { seated: st.seated, music: st.musicOn, z: +st.z.toFixed(2), cup: st.cup && st.cup.kind.name, left: st.cup && st.cup.left, brewing: !!st.brew, viewing: !!st.viewing };
  }
  window.MinkaGallery3D = {
    open: function (opts) { open(opts, null); }, close: function () { close(); }, refresh: refresh, bench: bench, pose: pose, act: act,
    isOpen: function () { return !!state; },
    // another window on top (the hall of fame): the game waits, its keys too
    pause: function (on) { if (state) { state.paused = !!on; state.keys = {}; state.dirty = true; } },
    music: function () { return audio ? { src: audio.getAttribute('src'), paused: audio.paused, volume: +audio.volume.toFixed(2), time: +audio.currentTime.toFixed(1) } : null; }
  };
})();
