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
   ar ēnu uz grīdas; tālums izgaist siltā muzeja krēslā (Nakts istabās
   zilganā), ne melnumā. Izšķirtspēja pēc loga (līdz 640 px, jaudīgā datorā
   800), ekrānā izstiepta vesela skaitļa reizes, lai pikseļi ir vienādi; ja
   dators nevelk, galerija pati zīmē mazāku un, kad atkal velk, lielāku.
   Pele kā spēlē (Pointer Lock): klikšķis to noķer, skats arī augšā un lejā
   (horizonta nobīde, kā Doom), Esc atlaiž. Kadru zīmē tikai, ja kaut kas
   mainās (iet, durvis, redzams kaķis), ne biežāk kā 35 reizes sekundē, bet
   katrā kadrā, kamēr groza skatu ar noķertu peli; paslēptā cilnē nedarbojas
   nekas. Tab: minikarte. Fails, kaķi, statuja un mūzika ielādējas tikai,
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
  // looking up and down as in CS / Half-Life: the horizon moves up to this
  // share of the picture (a raycaster shears the view, it cannot tilt it);
  // LOOK: radians a mouse pixel turns, the same across and up
  var PITCH_MAX = 0.62, LOOK = 0.0024;
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
  // the hall's own monument: two of the team's cats in marble, in Michelangelo's manner
  // (posed from the Nakts cats' rig by scripts/blender/cat_statue.py): in the hall a real
  // 3D mesh with its light baked in (mesh + tex), the picture for the close look
  var CAT_STATUE = { title: 'Špricētājs un Klibais', src: 'cut/cat-statue.webp?v=20261003s1', mesh: 'cat-statue-mesh.json?v=20261003s3', tex: 'cat-statue-tex.webp?v=20261003s3', caption: 'Špricētājs un Klibais. Marmors, Mikelandželo Buonaroti manierē (non finito bluķis), 2026' };
  var VENUS = { title: 'Mīlo Venēra', caption: 'Mīlo Venēra (Afrodīte no Mēlas), ap. 130–100 p.m.ē., Luvra. Foto: Jastrow, publiskais domēns' };
  // "Vairāk par darbu": the work's page (as DOOM: The Gallery Experience links to The Met)
  var WIKI = 'https://en.wikipedia.org/wiki/';
  var MORE = {
    'mona-lisa': 'Mona_Lisa', 'vitruvian': 'Vitruvian_Man', 'ginevra': "Ginevra_de'_Benci", 'lady-ermine': 'Lady_with_an_Ermine',
    'belle-ferronniere': 'La_Belle_Ferronni%C3%A8re', 'benois-madonna': 'Benois_Madonna', 'madonna-litta': 'Madonna_Litta',
    'last-supper': 'The_Last_Supper_(Leonardo)', 'annunciation': 'Annunciation_(Leonardo)', venus: 'Venus_de_Milo'
  };
  /* Medaļas (as DOOM TGE's medals): things to find by walking the whole place,
     kept on this computer. Each says once, at the top, when it is got. */
  var BADGES = [
    ['leo', 'Visi 9 Leonardo darbi'], ['venus', 'Mīlo Venēra'], ['plan', 'Nakts plāns'], ['sit', 'Pie galda'],
    ['fish', 'Pabarotas zivtiņas'], ['cats', 'Visi 3 kaķi noglaudīti'], ['coffee', '3 kafijas izdzertas'],
    ['monster', 'White Monster izdzerts'], ['pc', 'Vecais dators ieslēgts'], ['end', 'Zāles gals']
  ];
  var BADGE_KEY = 'minkaGalleryBadgesV1';
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
  var MUSIC_VOL = 0.3, MUSIC_KEY = 'minkaGalleryMusicV1', QUALITY_KEY = 'minkaGalleryWidthV3';
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
  // round marble columns (where the walls break between the halls): white stone,
  // soft grey veins running up and round
  var PILLAR_R = 0.34;
  function marbleCanvas() {
    var r = rnd(41);
    return pixels(function (set) {
      for (var y = 0; y < HALF; y++) for (var x = 0; x < HALF; x++) {
        var v = Math.sin(x * 0.19 + Math.sin(y * 0.07) * 3.1 + Math.sin(y * 0.031 + x * 0.05) * 2.2);
        var vein = Math.max(0, 1 - Math.abs(v) * 7) * 38, n = (r() - 0.5) * 6;
        var flute = (x % 16 === 0) ? 18 : 0;                 // the fluting's shadow lines
        set(x, y, 226 - vein - flute + n, 222 - vein - flute + n, 214 - vein * 0.8 - flute + n);
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
  function machineSprite(brewing) { return sprite(96, 144, function (ctx) { machineFront(ctx, brewing); }); }
  function machineFront(ctx, brewing, square) {
    {
      var body = ctx.createLinearGradient(4, 0, 92, 0);
      body.addColorStop(0, '#3a1658'); body.addColorStop(0.35, '#4d1f73'); body.addColorStop(1, '#3c175c');
      ctx.fillStyle = body; rr(ctx, 4, 0, 88, 144, square ? 0 : 6); ctx.fill();
      ctx.fillStyle = '#5a2880'; rr(ctx, 4, 0, 88, 22, square ? 0 : 6); ctx.fill(); ctx.fillRect(4, 14, 88, 8);
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
    }
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
  /* ── 3D priekšmeti ─────────────────────────────────────────────────────────
     The furniture stands in the room as real 3D: built from a few simple parts
     (faces with the drawings on them, discs, cylinders, bars, a horn) turned into
     triangles once, and every frame drawn straight into the picture's pixels with
     a depth for every pixel (as Ray's full depth buffer): an easel's legs and its
     board hide each other right, and the statue, the cats and the furniture hide
     one another by how far they are. Upright pictures on them (a sleeper's face,
     the notes) are small sprites standing at their height. Local coordinates: a
     forward (its front faces +a), b to its left, z up. */
  var LIGHT3 = (function () { var v = [0.5, -0.55, 0.67], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  var CYL_N = 10, NEAR = 0.05, BILL_K = 240;
  function paint(w, h, draw) {
    var c = canvas(w * SS, h * SS), ctx = c.getContext('2d');
    ctx.scale(SS, SS);
    draw(ctx, w, h);
    return c;
  }
  function dot3(p, v) { return p[0] * v[0] + p[1] * v[1] + p[2] * v[2]; }
  function abgr(css) { var c = rgbOf(css, [128, 128, 128]); return (255 << 24 | c[2] << 16 | c[1] << 8 | c[0]) >>> 0; }
  var texCache = new Map();
  function texOf(c) { var t = texCache.get(c); if (!t) { t = { levels: mipChain(data(c), c.width, c.height, 5) }; texCache.set(c, t); } return t; }
  // the parts as triangles: corners (local), their place on the picture (0..1), a picture or a colour
  function meshOf(p, parts) {
    var tris = [], bills = [];
    var tri = function (a, b, c, ua, ub, uc, look, n) { tris.push({ v: [a, b, c], uv: [ua, ub, uc], tex: look.tex ? texOf(look.tex) : null, col: look.tex ? 0 : abgr(look.color || '#808080'), n: n, soft: look.soft == null ? 0.5 : look.soft, two: !!look.two }); };
    var quad = function (q, look, n) {
      tri(q[0], q[1], q[3], [0, 0], [1, 0], [0, 1], look, n);
      tri(q[1], q[2], q[3], [1, 0], [1, 1], [0, 1], look, n);
    };
    var ringPts = function (c, r, u, v, n) { var out = []; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; out.push([c[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * r, c[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * r, c[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * r]); } return out; };
    var frame = function (ax) {                                     // two directions across an axis
      var l = Math.hypot(ax[0], ax[1], ax[2]) || 1; ax = [ax[0] / l, ax[1] / l, ax[2] / l];
      var up = Math.abs(ax[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      var u = [ax[1] * up[2] - ax[2] * up[1], ax[2] * up[0] - ax[0] * up[2], ax[0] * up[1] - ax[1] * up[0]], ul = Math.hypot(u[0], u[1], u[2]);
      u = [u[0] / ul, u[1] / ul, u[2] / ul];
      return [u, [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]]];
    };
    var tube = function (a, b, r0, r1, n, look, look2) {           // a bar, a cylinder's side, a horn
      var fr = frame([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), ra = ringPts(a, r0, fr[0], fr[1], n), rb = ringPts(b, r1, fr[0], fr[1], n);
      for (var i = 0; i < n; i++) {
        var j = (i + 1) % n, t = (i + 0.5) / n * Math.PI * 2, nn = [fr[0][0] * Math.cos(t) + fr[1][0] * Math.sin(t), fr[0][1] * Math.cos(t) + fr[1][1] * Math.sin(t), fr[0][2] * Math.cos(t) + fr[1][2] * Math.sin(t)];
        quad([rb[i], rb[j], ra[j], ra[i]], (i % 2 && look2) ? look2 : look, nn);
      }
      return rb;
    };
    var fan = function (pts, look, n) { for (var i = 1; i < pts.length - 1; i++) tri(pts[0], pts[i], pts[i + 1], [0, 0], [0, 0], [0, 0], look, n); };
    parts.forEach(function (pt) {
      if (pt.quad) quad(pt.quad, pt, pt.n);
      else if (pt.disk) fan(ringPts(pt.disk, pt.r, [1, 0, 0], [0, 1, 0], 14), { color: pt.color, soft: 0 }, [0, 0, 1]);
      else if (pt.cyl) {
        var top = [pt.cyl[0], pt.cyl[1], pt.cyl[2] + pt.h];
        var rimTop = tube(pt.cyl, top, pt.r, pt.r, CYL_N, { color: pt.color, soft: 0.45 });
        fan(rimTop.slice().reverse(), { color: pt.top || pt.color, soft: 0 }, [0, 0, 1]);
        if (pt.stripes) pt.stripes.forEach(function (sp) { quad(sp.quad, { color: sp.color, soft: 0.3 }, sp.n); });
      } else if (pt.line) tube(pt.line[0], pt.line[1], pt.w / 2, pt.w / 2, 6, { color: pt.color, soft: 0.4 });
      else if (pt.horn) {
        var mouth = tube(pt.horn[0], pt.horn[1], pt.r0, pt.r1, 14, { color: pt.color, soft: 0.45, two: true }, { color: pt.color2 || pt.color, soft: 0.45, two: true });
        var ax = [pt.horn[1][0] - pt.horn[0][0], pt.horn[1][1] - pt.horn[0][1], pt.horn[1][2] - pt.horn[0][2]];
        fan(mouth, { color: pt.inside || '#7a5418', soft: 0.2, two: true }, ax);
      } else if (pt.bill) {
        var cos = Math.cos(p.facing), sin = Math.sin(p.facing), q = pt.bill;
        var bw = Math.max(2, Math.round(pt.w * BILL_K)), bh = Math.max(2, Math.round(pt.h * BILL_K));
        bills.push({ owner: p, x: p.x + q[0] * cos - q[1] * sin, y: p.y + q[0] * sin + q[1] * cos, lift: q[2] - pt.h / 2, h: pt.h, shade: 0,
          spr: sprite(bw, bh, function (ctx) { pt.draw(ctx, bw, bh); }) });
      }
    });
    return { tris: tris, bills: bills };
  }
  // one triangle into the pixels: depth tested against the walls (per column) and
  // against everything 3D already there (per pixel); its picture corrected for perspective
  function rasterTri(st, A, B, C, t, lut, pp) {
    var buf = st.buf, pd = st.pdepth, zb = st.zbuf, H = VIEW_H;
    var minX = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), maxX = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
    var minY = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), maxY = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
    if (minX > maxX || minY > maxY) return;
    var area = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    if (Math.abs(area) < 1e-6) return;
    var ia = 1 / area, lv = null, lw = 0, lh = 0, lpx = null;
    if (t.tex) {                                                    // the texture level for how many texels fall on a pixel
      var L0 = t.tex.levels[0], uvA = Math.abs((B[3] / B[2] - A[3] / A[2]) * (C[4] / C[2] - A[4] / A[2]) - (B[4] / B[2] - A[4] / A[2]) * (C[3] / C[2] - A[3] / A[2])) * L0.w * L0.h;
      var L = Math.max(0, Math.min(t.tex.levels.length - 1, Math.floor(0.5 * Math.log2(Math.max(1, uvA / Math.max(1, Math.abs(area)))))));
      lv = t.tex.levels[L]; lw = lv.w; lh = lv.h; lpx = lv.px;
    }
    var col = t.col ? px(t.col, lut) : 0;
    for (var y = minY; y <= maxY; y++) {
      var py = y + 0.5, row = y * W;
      for (var x = minX; x <= maxX; x++) {
        var qx = x + 0.5;
        var w0 = ((B[0] - qx) * (C[1] - py) - (B[1] - py) * (C[0] - qx)) * ia;
        if (w0 < -1e-5) continue;
        var w1 = ((C[0] - qx) * (A[1] - py) - (C[1] - py) * (A[0] - qx)) * ia;
        if (w1 < -1e-5) continue;
        var w2 = 1 - w0 - w1;
        if (w2 < -1e-5) continue;
        var iz = w0 * A[2] + w1 * B[2] + w2 * C[2], d = 1 / iz, i = row + x;
        if (d >= zb[x] || d >= pd[i]) continue;
        var c = col;
        if (lpx) {
          var u = (w0 * A[3] + w1 * B[3] + w2 * C[3]) * d, v = (w0 * A[4] + w1 * B[4] + w2 * C[4]) * d;
          var tx = (u * lw) | 0, ty = (v * lh) | 0;
          if (tx < 0) tx = 0; else if (tx >= lw) tx = lw - 1;
          if (ty < 0) ty = 0; else if (ty >= lh) ty = lh - 1;
          var s = lpx[ty * lw + tx];
          if ((s >>> 24) < 128) continue;
          c = px(s, lut);
        }
        buf[i] = c; pd[i] = d;
        if (y < pp.top[x]) pp.top[x] = y;
        if (y > pp.bot[x]) pp.bot[x] = y;
      }
    }
  }
  // a polygon cut at the near plane (so a face you stand right at does not tear)
  function clipNear(poly) {
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length], ina = a[1] >= NEAR, inb = b[1] >= NEAR;
      if (ina) out.push(a);
      if (ina !== inb) { var k = (NEAR - a[1]) / (b[1] - a[1]); out.push(a.map(function (v, j) { return v + (b[j] - v) * k; })); }
    }
    return out;
  }
  var PROP_SPAN = { top: null, bot: null };
  function drawProps3D(st, dirX, dirY, plX, plY) {
    var inv = 1 / (plX * dirY - dirX * plY), half = VIEW_H / 2 + st.pitch, z = st.z;
    if (!PROP_SPAN.top || PROP_SPAN.top.length !== W) { PROP_SPAN.top = new Int16Array(W); PROP_SPAN.bot = new Int16Array(W); }
    st.props.forEach(function (p) {
      if (p.hidden || !p.mesh) return;
      var dx = p.x - st.x, dy = p.y - st.y, tYc = inv * (-plY * dx + plX * dy), rad = p.radius || 0.55;
      if (tYc < -rad || tYc > 24) return;
      var cosF = Math.cos(p.facing), sinF = Math.sin(p.facing);
      var night = !!zoneAt(st.map, p.x, p.y), base = (night ? lampOff : 0) + lightAt(st, p.x, p.y);
      var pp = PROP_SPAN; pp.top.fill(32767); pp.bot.fill(-1);
      p.mesh.tris.forEach(function (t) {
        // to the camera: across (tX), ahead (tY), height over the eye; the picture's place
        var cam = t.v.map(function (q, k) {
          var wx = p.x + q[0] * cosF - q[1] * sinF - st.x, wy = p.y + q[0] * sinF + q[1] * cosF - st.y;
          return [inv * (dirY * wx - dirX * wy), inv * (-plY * wx + plX * wy), q[2] - z, t.uv[k][0], t.uv[k][1], wx, wy];
        });
        var n = [t.n[0] * cosF - t.n[1] * sinF, t.n[0] * sinF + t.n[1] * cosF, t.n[2]];
        var toward = n[0] * (cam[0][5] + cam[1][5] + cam[2][5]) + n[1] * (cam[0][6] + cam[1][6] + cam[2][6]) + n[2] * (cam[0][2] + cam[1][2] + cam[2][2]);
        if (toward >= 0 && !t.two) return;                          // its back to us
        var poly = clipNear(cam);
        if (poly.length < 3) return;
        var dAvg = (cam[0][1] + cam[1][1] + cam[2][1]) / 3;
        var lit = Math.max(0, Math.abs(dot3(n, LIGHT3)) * (toward < 0 ? 1 : 0.7));
        var lut = lutAt(shadeLevel(Math.max(0, dAvg), 0) + base + Math.round((1 - lit) * t.soft * 60), night);
        var scr = poly.map(function (c) { var iz = 1 / c[1]; return [(W / 2) * (1 + c[0] * iz), half - c[2] * P * iz, iz, c[3] * iz, c[4] * iz]; });
        for (var k = 1; k < scr.length - 1; k++) rasterTri(st, scr[0], scr[k], scr[k + 1], t, lut, pp);
      });
      // what the crosshair and a click find: the columns it covers, nearer than what is there
      for (var x = 0; x < W; x++) {
        if (pp.bot[x] < 0) continue;
        if (!st.pickRef[x] || st.pickDist[x] > tYc) {
          st.pickRef[x] = p; st.pickDist[x] = Math.max(0.1, tYc); st.pickY0[x] = pp.top[x]; st.pickY1[x] = pp.bot[x]; st.pickWX[x] = p.x; st.pickWY[x] = p.y;
        }
      }
    });
  }
  // the parts' helpers: an upright face between two floor corners, a box
  // (the game's map runs y down: seen from outside, a0,b0 is the face's left edge)
  function face(a0, b0, a1, b1, z0, z1, look) {
    var n = [b0 - b1, a1 - a0, 0], l = Math.hypot(n[0], n[1]) || 1;
    return Object.assign({ quad: [[a0, b0, z1], [a1, b1, z1], [a1, b1, z0], [a0, b0, z0]], n: [n[0] / l, n[1] / l, 0] }, look);
  }
  function box(a0, a1, b0, b1, z0, z1, looks) {                   // looks: front, back, left, right, top
    var L = looks || {}, all = L.all || {};
    return [
      face(a1, b1, a1, b0, z0, z1, L.front || all),               // front (+a), its left is +b
      face(a0, b0, a0, b1, z0, z1, L.back || all),
      face(a0, b1, a1, b1, z0, z1, L.left || all),                // the +b side
      face(a1, b0, a0, b0, z0, z1, L.right || all),
      Object.assign({ quad: [[a0, b1, z1], [a1, b1, z1], [a1, b0, z1], [a0, b0, z1]], n: [0, 0, 1], soft: 0.25 }, L.top || all)
    ];
  }
  // what is drawn where: a picture on one side, flat colour on the others
  // a thing changed (the music, the coffee brewing): its sides are drawn anew when seen
  function remodel(p, make) { p.parts = make(); p.mesh = propMesh(p, p.parts); if (state) state.dirty = true; }
  /* Props made in Blender with their light baked in (scripts/blender/gallery_props.py), as the cats'
     statue: once their mesh and texture are in, they replace the simple boxes; the model's own parts
     (a cup brewing in the machine) are drawn with them. Loaded once, kept for the next visit. */
  var BAKED_V = '?v=20261005p4', BAKED_KINDS = { arcade: 1, arcademines: 1, pinball: 1, oldpc: 1, machine: 1, chair: 1, table: 1, easel: 1, gramophone: 1, monsterbox: 1, bed: 1 }, baked = {};
  function isBaked(kind) { return !!(baked[kind] && baked[kind].tris); }
  var BAKED_SCALE = { arcade: 0.8, arcademines: 0.62, pinball: 0.56 };  // smaller than built; the pinball's glass under the eye
  function bakedMesh(m, img, sc) {
    var tex = texOf(imgCanvas(img)), q = (sc || 1) / m.q, uq = 1 / m.uq, tris = [];
    for (var i = 0; i < m.f.length; i += 3) {
      var v = [], uv = [];
      for (var k = 0; k < 3; k++) { var j = m.f[i + k]; v.push([m.v[j * 3] * q, m.v[j * 3 + 1] * q, m.v[j * 3 + 2] * q]); uv.push([m.t[j * 2] * uq, m.t[j * 2 + 1] * uq]); }
      var n = [m.n[i] / 127, m.n[i + 1] / 127, m.n[i + 2] / 127], l = Math.hypot(n[0], n[1], n[2]) || 1;
      tris.push({ v: v, uv: uv, tex: tex, col: 0, n: [n[0] / l, n[1] / l, n[2] / l], soft: 0.1, two: false });
    }
    return tris;
  }
  function propMesh(p, parts) {
    var own = meshOf(p, parts), b = baked[p.kind];
    return b && b.tris ? { tris: b.tris.concat(own.tris), bills: own.bills } : own;
  }
  function loadBaked(kind, done) {
    if (baked[kind]) { if (baked[kind].tris) done(); return; }
    baked[kind] = {};
    var base = ART + 'props/' + kind;
    Promise.all([fetch(base + '-mesh.json' + BAKED_V).then(function (r) { return r.json(); }), new Promise(function (ok, no) { var im = loadImage(base + '-tex.webp' + BAKED_V, ok); im.onerror = no; })])
      .then(function (got) { baked[kind].tris = bakedMesh(got[0], got[1], BAKED_SCALE[kind]); done(); }, function () { delete baked[kind]; });
  }
  // the sprite path still lays the thing's shadow on the floor; its picture is the 3D parts
  var SHADOW_ONLY = { w: 1, h: 1, levels: [{ w: 1, h: 1, px: new Uint32Array(1) }] };

  function machineModel(brewing) {
    if (baked.machine && baked.machine.tris) {
      // the model has its own bay (0.10 deep, its tray 0.066 up): only the cup and the coffee's stream are added
      return brewing ? [
        { cyl: [0.06, 0, 0.066], r: 0.024, h: 0.05, color: '#eef2f8', top: '#7a4a24' },
        { line: [[0.06, 0, 0.21], [0.06, 0, 0.116]], w: 0.006, color: '#6b3d1e' }
      ] : [];
    }
    // the front drawing edge to edge on its face (the flat sprite's 4 px margins and
    // rounded corners left a gap at the side and see-through corners)
    var front = paint(88, 144, function (ctx) {
      ctx.fillStyle = '#45196a'; ctx.fillRect(0, 0, 88, 144);
      ctx.save(); ctx.translate(-4, 0); machineFront(ctx, brewing, true); ctx.restore();
    });
    var side = paint(40, 144, function (ctx) {
      var gr = ctx.createLinearGradient(0, 0, 40, 0); gr.addColorStop(0, '#45196a'); gr.addColorStop(1, '#391559');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 40, 144);
      ctx.fillStyle = '#5a2880'; ctx.fillRect(0, 0, 40, 22);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 22, 40, 2); ctx.fillRect(0, 138, 40, 6);
      ctx.fillStyle = 'rgba(255,255,255,.07)'; for (var y = 40; y < 120; y += 8) ctx.fillRect(8, y, 24, 3);   // vents
    });
    var back = paint(96, 144, function (ctx) { ctx.fillStyle = '#331451'; ctx.fillRect(0, 0, 96, 144); ctx.fillStyle = '#4a1f6c'; ctx.fillRect(0, 0, 96, 22); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(10, 30, 76, 100); });
    var h = 0.74, w = h * 88 / 144, d = h * 40 / 144;
    var parts = box(-d / 2, d / 2, -w / 2, w / 2, 0, h, { front: { tex: front, soft: 0.35 }, back: { tex: back }, left: { tex: side }, right: { tex: side }, top: { color: '#5a2880' } });
    return parts;
  }
  function bedModel(person) {
    var rgb = person ? rgbOf(person.color) : [96, 106, 122];
    if (isBaked('bed')) {
      // the model is the frame, the mattress and the pillow; the blanket in the sleeper's colour, the name on the footboard
      var L0 = 1.0, W0 = 0.66, plate = paint(160, 48, function (ctx) {
        ctx.fillStyle = tint(rgb, -0.45); rr(ctx, 0, 0, 160, 48, 10); ctx.fill();
        if (person) {
          ctx.font = '800 17px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff'; ctx.fillText(String(person.first || '').toUpperCase().slice(0, 11), 80, 25);
        }
      });
      var out = box(-0.2, L0 / 2 - 0.03, -W0 / 2 + 0.015, W0 / 2 - 0.015, 0.235, 0.29, { top: { color: tint(rgb, 0.05), soft: 0.25 }, all: { color: tint(rgb, -0.22) } });
      out = out.concat(box(-0.22, -0.13, -W0 / 2 + 0.01, W0 / 2 - 0.01, 0.24, 0.3, { top: { color: tint(rgb, 0.3), soft: 0.25 }, all: { color: tint(rgb, 0.12) } }));
      if (person) {
        out.push({ quad: [[L0 / 2 + 0.042, 0.17, 0.26], [L0 / 2 + 0.042, -0.17, 0.26], [L0 / 2 + 0.042, -0.17, 0.15], [L0 / 2 + 0.042, 0.17, 0.15]], n: [1, 0, 0], tex: plate, soft: 0.2 });
        out.push({ bill: [-L0 / 2 + 0.19, 0, 0.42], w: 0.2, h: 0.2, draw: function (ctx, w, hh) {
          if (person.emoji) { ctx.font = Math.round(hh * 0.9) + 'px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(person.emoji, w / 2, hh / 2); }
          else { ctx.fillStyle = '#f0c7a6'; ctx.beginPath(); ctx.arc(w / 2, hh / 2, w * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a3324'; ctx.beginPath(); ctx.arc(w / 2, hh / 2 - w * 0.1, w * 0.36, Math.PI, 0); ctx.fill(); }
        } });
        if (person.now) out.push({ bill: [-L0 / 2, 0, 0.62], w: 0.12, h: 0.12, draw: function (ctx, w) {
          ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.45, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = tint(rgb, -0.45); ctx.beginPath(); ctx.arc(w * 0.68, w * 0.36, w * 0.4, 0, Math.PI * 2); ctx.fill();
        } });
      }
      return out;
    }
    var L = 1.0, Wd = 0.66, h = 0.2;                              // its foot towards +a
    var foot = paint(160, 48, function (ctx) {
      ctx.fillStyle = tint(rgb, -0.5); rr(ctx, 0, 0, 160, 48, 10); ctx.fill();
      ctx.fillStyle = tint(rgb, -0.3); rr(ctx, 6, 4, 148, 7, 3); ctx.fill();
      if (person) {
        ctx.font = '800 15px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillText(String(person.first || '').toUpperCase().slice(0, 11), 80, 30);
        ctx.fillStyle = '#ffffff'; ctx.fillText(String(person.first || '').toUpperCase().slice(0, 11), 80, 29);
      }
    });
    var head = paint(160, 80, function (ctx) { ctx.fillStyle = tint(rgb, -0.45); rr(ctx, 0, 0, 160, 80, 16); ctx.fill(); ctx.fillStyle = tint(rgb, -0.22); rr(ctx, 8, 8, 144, 60, 12); ctx.fill(); });
    var blanket = paint(80, 160, function (ctx) {
      var b = ctx.createLinearGradient(0, 0, 0, 160); b.addColorStop(0, tint(rgb, 0.1)); b.addColorStop(1, tint(rgb, -0.2));
      ctx.fillStyle = b; ctx.fillRect(0, 0, 80, 160);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(0, 0, 80, 10);
    });
    var side = paint(160, 40, function (ctx) { ctx.fillStyle = tint(rgb, -0.28); ctx.fillRect(0, 0, 160, 40); ctx.fillStyle = tint(rgb, -0.5); ctx.fillRect(0, 32, 160, 8); });
    var parts = [];
    parts = parts.concat(box(-L / 2, L / 2, -Wd / 2, Wd / 2, 0, h, { left: { tex: side }, right: { tex: side }, back: { color: tint(rgb, -0.4) }, front: { color: tint(rgb, -0.4) }, top: { color: tint(rgb, -0.1) } }));
    // the blanket on top, the pillow at the head, the head- and footboards
    parts.push({ quad: [[-L / 2 + 0.3, Wd / 2 - 0.03, h + 0.04], [L / 2 - 0.04, Wd / 2 - 0.03, h + 0.04], [L / 2 - 0.04, -Wd / 2 + 0.03, h + 0.04], [-L / 2 + 0.3, -Wd / 2 + 0.03, h + 0.04]], n: [0, 0, 1], tex: blanket, soft: 0.2 });
    parts = parts.concat(box(-L / 2 + 0.07, -L / 2 + 0.3, -Wd / 2 + 0.1, Wd / 2 - 0.1, h, h + 0.09, { all: { color: '#eef1f5', soft: 0.3 } }));
    parts = parts.concat(box(-L / 2 - 0.04, -L / 2 + 0.02, -Wd / 2 - 0.03, Wd / 2 + 0.03, 0, 0.5, { back: { tex: head }, front: { tex: head }, all: { color: tint(rgb, -0.45) } }));
    parts = parts.concat(box(L / 2 - 0.02, L / 2 + 0.04, -Wd / 2 - 0.03, Wd / 2 + 0.03, 0, 0.3, { front: { tex: foot }, back: { color: tint(rgb, -0.5) }, all: { color: tint(rgb, -0.5) } }));
    if (person) {
      // the sleeper's face on the pillow (it looks at you from any side, as a sprite), the moon over the head
      parts.push({ bill: [-L / 2 + 0.19, 0, h + 0.17], w: 0.2, h: 0.2, draw: function (ctx, w, hh) {
        if (person.emoji) { ctx.font = Math.round(hh * 0.9) + 'px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(person.emoji, w / 2, hh / 2); }
        else { ctx.fillStyle = '#f0c7a6'; ctx.beginPath(); ctx.arc(w / 2, hh / 2, w * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a3324'; ctx.beginPath(); ctx.arc(w / 2, hh / 2 - w * 0.1, w * 0.36, Math.PI, 0); ctx.fill(); }
      } });
      if (person.now) parts.push({ bill: [-L / 2, 0, 0.62], w: 0.12, h: 0.12, draw: function (ctx, w) {
        ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(w / 2, w / 2, w * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = tint(rgb, -0.45); ctx.beginPath(); ctx.arc(w * 0.68, w * 0.36, w * 0.4, 0, Math.PI * 2); ctx.fill();
      } });
    }
    return parts;
  }
  // the old computer: its screen shows the Windows 98 desktop (drawn here), the rest is the model
  var pcScreen = null;
  function oldpcModel() {
    pcScreen = pcScreen || paint(96, 72, function (ctx) {
      var bg = ctx.createLinearGradient(0, 0, 0, 72); bg.addColorStop(0, '#2a3a9a'); bg.addColorStop(1, '#5a4fb8');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 96, 72);
      [['#ff5fb0', 6], ['#ffffff', 22], ['#d8cfb8', 38]].forEach(function (d) { ctx.fillStyle = d[0]; ctx.fillRect(5, d[1], 9, 9); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(3, d[1] + 11, 13, 2); });
      ctx.fillStyle = '#d8c8f0'; ctx.fillRect(26, 12, 56, 40); ctx.fillStyle = '#6a3fd0'; ctx.fillRect(27, 13, 54, 5);
      var cols = ['#ff4f7a', '#ffd23f', '#5aa8ff', '#f5efe6', '#1d1a22', '#eef0ee'];
      for (var y = 0; y < 4; y++) for (var x = 0; x < 6; x++) { ctx.fillStyle = cols[(x * 7 + y * 3) % 6]; ctx.fillRect(30 + x * 8, 21 + y * 7, 6, 5); }
      ctx.fillStyle = '#d8c8f0'; ctx.fillRect(0, 64, 96, 8); ctx.fillStyle = '#6a3fd0'; ctx.fillRect(2, 65, 14, 6);
    });
    var screen = { quad: [[0.0635, 0.103, 0.573], [0.0635, -0.103, 0.573], [0.0635, -0.103, 0.417], [0.0635, 0.103, 0.417]], n: [1, 0, 0], tex: pcScreen, soft: 0 };
    if (isBaked('oldpc')) return [screen];
    return box(-0.17, 0.06, -0.13, 0.13, 0.36, 0.6, { all: { color: '#d8cfb8' } }).concat(box(-0.21, 0.21, -0.31, 0.31, 0.33, 0.36, { all: { color: '#8a6440' } }), [screen]);
  }
  // the Konfektes 98 arcade machine: its screen and its lit sign drawn here, the cabinet is the model
  var arcadeTex = null;
  function arcadeModel() {
    if (!arcadeTex) {
      var cols = ['#ff4f7a', '#ffd23f', '#5aa8ff', '#f5efe6', '#1d1a22', '#eef0ee'];
      arcadeTex = {
        screen: paint(96, 112, function (ctx) {
          ctx.fillStyle = '#efe6fb'; ctx.fillRect(0, 0, 96, 112);
          ctx.fillStyle = '#6a3fd0'; ctx.fillRect(0, 0, 96, 14);
          ctx.fillStyle = '#fff'; ctx.font = '700 9px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KONFEKTES 98', 48, 7);
          for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
            ctx.fillStyle = (x + y) & 1 ? '#e4d8f6' : '#efe6fb'; ctx.fillRect(4 + x * 11, 18 + y * 11, 11, 11);
            ctx.fillStyle = cols[(x * 5 + y * 3 + ((x * y) % 4)) % 6]; ctx.fillRect(6 + x * 11, 20 + y * 11, 7, 7);
          }
          ctx.fillStyle = '#6a3fd0'; ctx.font = '700 8px Tahoma, sans-serif'; ctx.fillText('NOSPIED E', 48, 106);
        }),
        sign: paint(128, 36, function (ctx) {
          var g = ctx.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#ff5fb0'); g.addColorStop(1, '#b07ae0');
          ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 36);
          ctx.fillStyle = '#fff'; ctx.font = '900 15px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#2a1d48'; ctx.fillText('KONFEKTES 98', 65, 20); ctx.fillStyle = '#ffffff'; ctx.fillText('KONFEKTES 98', 64, 18);
        })
      };
    }
    var k = BAKED_SCALE.arcade, S = function (q) { return q.map(function (v) { return [v[0] * k, v[1] * k, v[2] * k]; }); };
    var out = [
      { quad: S([[0.0655, 0.16, 0.965], [0.0655, -0.16, 0.965], [0.0655, -0.16, 0.615], [0.0655, 0.16, 0.615]]), n: [1, 0, 0], tex: arcadeTex.screen, soft: 0 },
      { quad: S([[0.1475, 0.18, 1.155], [0.1475, -0.18, 1.155], [0.1475, -0.18, 1.045], [0.1475, 0.18, 1.045]]), n: [1, 0, 0], tex: arcadeTex.sign, soft: 0 }
    ];
    return isBaked('arcade') ? out : box(-0.2 * k, 0.2 * k, -0.21 * k, 0.21 * k, 0, 1.18 * k, { all: { color: '#8f6ad8' } }).concat(out);
  }
  // Mīnas 98: the same cabinet, smaller, in Windows teal; its screen a minefield half swept
  var minesTex = null;
  function arcadeMinesModel() {
    if (!minesTex) {
      minesTex = {
        screen: paint(96, 112, function (ctx) {
          ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 0, 96, 112);
          ctx.fillStyle = '#000080'; ctx.fillRect(0, 0, 96, 14);
          ctx.fillStyle = '#fff'; ctx.font = '700 9px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MĪNAS 98', 48, 7);
          var nums = ['#0000ff', '#008000', '#ff0000', '#000080'], r = 7;
          for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
            var open = (x * 7 + y * 3 + x * y) % 5 > 1, px = 4 + x * 11, py = 18 + y * 11;
            ctx.fillStyle = open ? '#bdbdbd' : '#ffffff'; ctx.fillRect(px, py, 11, 11);
            ctx.fillStyle = open ? '#9a9a9a' : '#808080'; ctx.fillRect(px + (open ? 0 : 1), py + 10, 11, 1); ctx.fillRect(px + 10, py + (open ? 0 : 1), 1, 11);
            if (!open) { ctx.fillStyle = '#c0c0c0'; ctx.fillRect(px + 1, py + 1, 9, 9); }
            else if ((x + y * 3) % 4 === 0) { ctx.fillStyle = nums[(x + y) % 4]; ctx.font = '700 8px Tahoma, sans-serif'; ctx.fillText(String(1 + (x * y) % 3), px + 5.5, py + 6); }
          }
          ctx.fillStyle = '#000080'; ctx.font = '700 8px Tahoma, sans-serif'; ctx.fillText('NOSPIED E', 48, 106);
          r = r;
        }),
        sign: paint(128, 36, function (ctx) {
          ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 0, 128, 36);
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 2); ctx.fillRect(0, 34, 128, 2);
          ctx.font = '900 15px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#806010'; ctx.fillText('MĪNAS 98', 65, 20); ctx.fillStyle = '#000'; ctx.fillText('MĪNAS 98', 64, 18);
        })
      };
    }
    var k = BAKED_SCALE.arcademines, S = function (q) { return q.map(function (v) { return [v[0] * k, v[1] * k, v[2] * k]; }); };
    var out = [
      { quad: S([[0.0655, 0.16, 0.965], [0.0655, -0.16, 0.965], [0.0655, -0.16, 0.615], [0.0655, 0.16, 0.615]]), n: [1, 0, 0], tex: minesTex.screen, soft: 0 },
      { quad: S([[0.1475, 0.18, 1.155], [0.1475, -0.18, 1.155], [0.1475, -0.18, 1.045], [0.1475, 0.18, 1.045]]), n: [1, 0, 0], tex: minesTex.sign, soft: 0 }
    ];
    return isBaked('arcademines') ? out : box(-0.2 * k, 0.2 * k, -0.21 * k, 0.21 * k, 0, 1.18 * k, { all: { color: '#2f9e98' } }).concat(out);
  }
  // Pinbols 98: the table under its glass and the backglass, drawn here; the machine is the model
  var pinTex = null;
  function pinballModel() {
    if (!pinTex) {
      var R = function (ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      pinTex = {
        field: paint(64, 128, function (ctx) {
          R(ctx, 0, 0, 64, 128, '#0b1030');
          for (var i = 0; i < 40; i++) R(ctx, (i * 37) % 64, (i * 53) % 128, 1, 1, i % 3 ? '#6f80d8' : '#ffffff');
          R(ctx, 2, 4, 60, 1, '#c8ccd4'); R(ctx, 2, 4, 1, 92, '#c8ccd4'); R(ctx, 56, 26, 1, 98, '#c8ccd4'); R(ctx, 61, 4, 1, 120, '#c8ccd4');
          [[20, 34], [36, 34], [28, 46]].forEach(function (b) { R(ctx, b[0] - 3, b[1] - 3, 7, 7, '#ffd23f'); R(ctx, b[0] - 2, b[1] - 2, 5, 5, '#ff8a1f'); R(ctx, b[0], b[1], 1, 1, '#e0303a'); });
          R(ctx, 44, 56, 8, 8, '#3f7af0'); R(ctx, 40, 60, 16, 1, '#ffd23f');
          for (i = 0; i < 10; i++) { R(ctx, 3 + i * 1.4, 96 + i, 2, 1, '#c8ccd4'); R(ctx, 54 - i * 1.4, 96 + i, 2, 1, '#c8ccd4'); }
          for (i = 0; i < 9; i++) { R(ctx, 18 + i, 106 + i * 0.5, 2, 2, '#ff8a1f'); R(ctx, 38 - i, 106 + i * 0.5, 2, 2, '#ff8a1f'); }
          R(ctx, 58, 112, 2, 2, '#c8ccd4');
        }),
        back: paint(96, 96, function (ctx) {
          R(ctx, 0, 0, 96, 96, '#0b1030');
          for (var i = 0; i < 50; i++) R(ctx, (i * 41) % 96, (i * 29) % 96, 1, 1, i % 4 ? '#6f80d8' : '#ffffff');
          for (var y = -16; y <= 16; y++) { var hw = Math.floor(Math.sqrt(256 - y * y)); R(ctx, 48 - hw, 56 + y, hw * 2 + 1, 1, y % 5 ? '#3f7af0' : '#2c5fd0'); }
          for (var x = 0; x < 64; x++) R(ctx, 16 + x, 66 - Math.round(x * 0.3), 1, 1, '#ffd23f');
          R(ctx, 6, 8, 84, 22, '#ff8a1f'); R(ctx, 8, 10, 80, 18, '#0b1030');
          ctx.fillStyle = '#ffd23f'; ctx.font = '900 12px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PINBOLS 98', 48, 19);
        })
      };
    }
    var k = BAKED_SCALE.pinball, S = function (q) { return q.map(function (v) { return [v[0] * k, v[1] * k, v[2] * k]; }); };
    var out = [
      { quad: S([[-0.39, 0.2, 0.772], [-0.39, -0.2, 0.772], [0.43, -0.2, 0.738], [0.43, 0.2, 0.738]]), n: [0.041, 0, 0.999], tex: pinTex.field, soft: 0 },
      { quad: S([[-0.3645, 0.195, 1.37], [-0.3645, -0.195, 1.37], [-0.3645, -0.195, 0.98], [-0.3645, 0.195, 0.98]]), n: [1, 0, 0], tex: pinTex.back, soft: 0 }
    ];
    return isBaked('pinball') ? out : box(-0.45 * k, 0.45 * k, -0.22 * k, 0.22 * k, 0, 0.75 * k, { all: { color: '#1f4fd0' } }).concat(out);
  }
  /* The day's golden cup: hidden somewhere in the hall (the same place for everyone that day,
     another place tomorrow), a reason to walk the whole hall; found, it is gone till tomorrow. */
  var GOLD_KEY = 'minkaGoldCupV1';
  function goldStore() { try { return JSON.parse(localStorage.getItem(GOLD_KEY) || '{}') || {}; } catch (_e) { return {}; } }
  function goldSpot(map, props, day) {
    if (!day || goldStore().last === day) return null;
    var h = 2166136261; for (var i = 0; i < day.length; i++) { h ^= day.charCodeAt(i); h = Math.imul(h, 16777619); }
    var r = function () { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    for (var guard = 0; guard < 200; guard++) {
      var cx = 1 + ((r() * HALL) | 0), cy = LEO_Y0 + 1 + ((r() * (map.h - LEO_Y0 - 3)) | 0), ci = cy * map.w + cx;
      if (map.grid[ci] !== EMPTY || map.zone[ci]) continue;
      var x = cx + 0.25 + r() * 0.5, y = cy + 0.25 + r() * 0.5;
      if (props.some(function (p) { return Math.hypot(p.x - x, p.y - y) < 1.0; })) continue;
      return [x, y];
    }
    return null;
  }
  function goldcupModel() {
    return [
      { disk: [0, 0, 0.004], r: 0.075, color: '#c9a227' },
      { cyl: [0, 0, 0.006], r: 0.045, h: 0.075, color: '#f2c94c', top: '#7a4a24' },
      { line: [[0, 0.045, 0.06], [0, 0.07, 0.045]], w: 0.014, color: '#e0b43c' },
      { line: [[0, 0.07, 0.045], [0, 0.045, 0.022]], w: 0.014, color: '#e0b43c' }
    ];
  }
  function takeGold(st, p) {
    var g = goldStore(), today = st.today || '';
    g.count = (g.count || 0) + 1; g.last = today;
    try { localStorage.setItem(GOLD_KEY, JSON.stringify(g)); } catch (_e) {}
    p.hidden = true; st.dirty = true;
    flash(); sfx(st, 'badge');
    say(st, 'Atradi dienas zelta krūzīti! Tā ir tava ' + g.count + '. Rīt tā būs citur.');
  }
  function chairModel() {
    if (isBaked('chair')) return [];
    var wood = '#4a2f1b', seat = 0.26, r = 0.13, parts = [];
    [[0.09, 0.09], [0.09, -0.09], [-0.09, 0.09], [-0.09, -0.09]].forEach(function (l) { parts.push({ line: [[l[0] * 0.85, l[1] * 0.85, seat], [l[0] * 1.15, l[1] * 1.15, 0]], w: 0.022, color: wood }); });
    // the bentwood back: a hoop behind the seat, two rails
    var hoop = []; for (var i = 0; i <= 10; i++) { var t = i / 10 * Math.PI; hoop.push([-0.12, Math.cos(t) * 0.12, seat + Math.sin(t) * 0.24]); }
    for (i = 0; i < 10; i++) parts.push({ line: [hoop[i], hoop[i + 1]], w: 0.028, color: '#3b2616' });
    parts.push({ line: [[-0.12, 0.09, seat + 0.12], [-0.12, -0.09, seat + 0.12]], w: 0.018, color: '#3b2616' });
    parts.push({ cyl: [0, 0, seat - 0.03], r: r, h: 0.03, color: '#5a3a22', top: '#6e4a2c' });
    return parts;
  }
  function easelModel() {
    if (isBaked('easel')) return [];
    var wood = '#7a5130', apex = [0.02, 0, 0.66], parts = [];
    var canvasF = paint(76, 74, function (ctx) { ctx.fillStyle = '#efe8d8'; ctx.fillRect(0, 0, 76, 74); ctx.strokeStyle = '#c9bea8'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 74, 72); ctx.fillStyle = 'rgba(70,60,45,.35)'; ctx.fillRect(36.5, 25, 3, 24); ctx.fillRect(26, 35.5, 24, 3); });
    var canvasB = paint(76, 74, function (ctx) { ctx.fillStyle = '#d8ccb2'; ctx.fillRect(0, 0, 76, 74); ctx.fillStyle = '#8a6440'; ctx.fillRect(0, 0, 76, 5); ctx.fillRect(0, 69, 76, 5); ctx.fillRect(0, 0, 5, 74); ctx.fillRect(71, 0, 5, 74); ctx.fillRect(35, 0, 5, 74); });
    parts.push({ line: [apex, [0.08, 0.2, 0]], w: 0.03, color: wood });
    parts.push({ line: [apex, [0.08, -0.2, 0]], w: 0.03, color: wood });
    parts.push({ line: [[0, 0, 0.6], [-0.28, 0, 0]], w: 0.03, color: tint(rgbOf(wood), -0.2) });
    var cw = 0.38, ch = 0.37, z0 = 0.23, ac = 0.07;
    parts.push({ quad: [[ac, cw / 2, z0 + ch], [ac, -cw / 2, z0 + ch], [ac, -cw / 2, z0], [ac, cw / 2, z0]], n: [1, 0, 0], tex: canvasF, soft: 0.3 });
    parts.push({ quad: [[ac - 0.01, -cw / 2, z0 + ch], [ac - 0.01, cw / 2, z0 + ch], [ac - 0.01, cw / 2, z0], [ac - 0.01, -cw / 2, z0]], n: [-1, 0, 0], tex: canvasB });
    parts = parts.concat(box(ac - 0.02, ac + 0.06, -0.24, 0.24, z0 - 0.04, z0, { all: { color: '#6b4424' } }));
    parts.push({ disk: [ac + 0.03, 0.08, z0 + 0.005], r: 0.07, color: '#c8a26a' });
    ['#d64541', '#f2c94c', '#3a7bd5', '#4c8a44'].forEach(function (c, i) { parts.push({ disk: [ac + 0.03 + (i % 2) * 0.02, 0.05 + i * 0.022, z0 + 0.007], r: 0.011, color: c }); });
    return parts;
  }
  function gramophoneModel(playing) {
    if (isBaked('gramophone')) return playing ? [{ bill: [0.1, 0.05, 0.75], w: 0.16, h: 0.12, draw: function (ctx, w, h) { ctx.fillStyle = '#ffe28a'; ctx.font = '700 ' + Math.round(h * 0.8) + 'px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('\u266a \u266b', w / 2, h / 2); } }] : [];
    var wood = paint(70, 52, function (ctx) { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(0, 0, 70, 52); ctx.fillStyle = '#7b5230'; rr(ctx, 6, 6, 58, 40, 4); ctx.fill(); });
    var parts = box(-0.14, 0.14, -0.16, 0.16, 0, 0.2, { all: { tex: wood }, top: { color: '#4a2f17' } });
    parts.push({ cyl: [0, 0.02, 0.2], r: 0.13, h: 0.012, color: '#1b1b1b', top: '#232323' });
    parts.push({ disk: [0, 0.02, 0.2135], r: 0.032, color: '#c0392b' });          // the record's label
    parts.push({ line: [[-0.1, -0.12, 0.2], [-0.1, -0.12, 0.42]], w: 0.025, color: '#b8892b' });
    parts.push({ horn: [[-0.1, -0.12, 0.42], [0.12, -0.02, 0.62]], r0: 0.02, r1: 0.13, color: '#f2cf6a', color2: '#a8761e', inside: '#7a5418' });
    if (playing) parts.push({ bill: [0.1, 0.05, 0.75], w: 0.16, h: 0.12, draw: function (ctx, w, h) { ctx.fillStyle = '#ffe28a'; ctx.font = '700 ' + Math.round(h * 0.8) + 'px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪ ♫', w / 2, h / 2); } });
    return parts;
  }
  function monsterBoxModel() {
    if (isBaked('monsterbox')) return [];
    var parts = [], front = paint(112, 30, function (ctx) {
      ctx.fillStyle = '#f4f5f4'; ctx.fillRect(0, 0, 112, 30); ctx.fillStyle = '#c4c9c4'; ctx.fillRect(0, 0, 112, 2); ctx.fillRect(0, 28, 112, 2);
      ctx.fillStyle = '#3a3f3a'; ctx.font = '900 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('ULTRA', 30, 16);
      ctx.fillStyle = '#8f978f'; [8, 13, 18].forEach(function (x) { ctx.fillRect(x, 7, 3, 16); }); ctx.fillRect(8, 7, 13, 3);
    });
    var side = paint(60, 30, function (ctx) { ctx.fillStyle = '#e9ebe9'; ctx.fillRect(0, 0, 60, 30); ctx.fillStyle = '#c4c9c4'; ctx.fillRect(0, 0, 60, 2); ctx.fillRect(0, 28, 60, 2); });
    var Wd = 0.5, D = 0.27, h = 0.09;
    for (var row = 0; row < 3; row++) for (var c = 0; c < 6; c++) {          // 3 rows of 6 white cans
      var ca = -D / 2 + 0.045 + row * 0.09, cb = -Wd / 2 + 0.042 + c * 0.083, cz = h * 0.4;
      parts.push({ cyl: [ca, cb, cz], r: 0.036, h: 0.165, color: '#eef0ee', top: '#d6dbd6' });
      // the claw marks on the front of each can: three grey bars just off its side
      [-0.014, 0, 0.014].forEach(function (o) {
        parts.push({ quad: [[ca + 0.0365, cb + o + 0.004, cz + 0.13], [ca + 0.0365, cb + o - 0.004, cz + 0.13], [ca + 0.0365, cb + o - 0.004, cz + 0.05], [ca + 0.0365, cb + o + 0.004, cz + 0.05]], n: [1, 0, 0], color: '#9aa39a', soft: 0.3 });
      });
    }
    return parts.concat(box(-D / 2, D / 2, -Wd / 2, Wd / 2, 0, h, { front: { tex: front }, back: { tex: front }, left: { tex: side }, right: { tex: side }, top: { color: '#dfe3df' } }));
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
    sfx(st, 'plop');
    earn(st, 'fish');
  }
  function inTank(st, wx) { var a = st.map.aquarium; return wx >= a.x0 && wx <= a.x1; }

  /* ── Kafija rokā ──────────────────────────────────────────────────────── */
  // What you hold, Doom's weapon place: the Löfbergs machine's purple paper
  // cup or a White Monster in your right hand, the thumb across the front.
  // Sprites from a posed 3D hand (scripts/pixel-art/held/build.mjs): one sprite
  // pixel is one picture pixel at 640 wide. HELD_SHOW: two rows above the
  // drink's bottom (build.mjs prints it) and a hand's width more, so the hand
  // holding it shows (it sat too low); the rest of the forearm (~50 rows) stays
  // under the bottom edge, so a step or a sip never shows where the arm ends.
  var HELD_SHOW = { coffee: 146, can: 146 };
  var held = { coffee: null, can: null, monsterCan: null, monsterBox: null };
  function handCanvas(kind) {
    var name = kind.can ? 'can' : 'coffee', img = held[name];
    if (!img) return null;
    var k = W / 640, pw = Math.round(img.naturalWidth * k), ph = Math.round(img.naturalHeight * k), pc = canvas(pw, ph), pctx = pc.getContext('2d');
    pctx.imageSmoothingEnabled = false;                     // pixel art: never blurred, at any width
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
      wall.push(cur === it ? it : Object.assign({}, cur, { day: it.day, slotOf: it.art, frame: it.frame }));
    });
    // the team's walls: this dežūra first, with empty frames to draw on
    var days = [], byDay = {};
    wall.forEach(function (it) { if (!byDay[it.day]) { byDay[it.day] = []; days.push(it.day); } byDay[it.day].push(it); });
    if (today && days.indexOf(today) < 0) days.unshift(today);
    days.sort(function (a, b) { return a === today ? -1 : b === today ? 1 : (a < b ? 1 : -1); });
    var y = LEO_Y1 + 2;
    // A drawing remembers its frame on its day's wall (its number, from the message),
    // so it hangs there for everyone and on later days too; older ones without a
    // number: the frame chosen on this computer, else the next free one.
    days.forEach(function (day) {
      var list = byDay[day] || [], isToday = day === today, top = -1;
      list.forEach(function (it) { if (it.frame > top) top = it.frame; });
      var n = isToday ? Math.max(6, list.length + 2, top + 2) : Math.max(list.length, top + 1);
      if (isToday && n % 2) n++;
      var len = Math.max(4, n + (n % 2) + 1);
      segs.push({ day: day, y0: y, y1: y + len, count: list.length, today: isToday });
      var spots = [];
      for (var i = 0; i < n; i++) spots.push({ idx: i, x: i % 2 ? HALL + 1 : 0, y: y + 1 + Math.floor(i / 2) * 2, face: i % 2 ? 'w' : 'e', day: day });
      var free = spots.slice(), left = [];
      list.forEach(function (it) {
        var at = -1;
        if (it.frame >= 0) at = free.findIndex(function (s) { return s.idx === it.frame; });
        if (at < 0) {
          var want = slotMap && (slotMap[it.art] || (it.slotOf && slotMap[it.slotOf]));
          if (want) at = free.findIndex(function (s) { return s.x + ',' + s.y + ',' + s.face === want; });
        }
        if (at >= 0) { free[at].item = it; free.splice(at, 1); } else left.push(it);
      });
      left.slice().reverse().forEach(function (it) { var s = free.shift(); if (s) s.item = it; });
      // empty frames only on this dežūra's wall (a past day's wall is not drawn on)
      spots.forEach(function (s) { if (s.item) slots.push(s); else if (isToday) { s.empty = true; slots.push(s); } });
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
  // Distance fades into a colour, not into black: the hall's warm museum dusk,
  // the night rooms' blue. One table per channel and level, so it costs the same.
  // LIGHT_UP: levels brighter than the drawing itself (under a lamp, in front of a picture)
  var SHADES = 64, LIGHT_UP = 16, luts = null, lutsNight = null;
  var FOG = [58, 44, 31], FOG_NIGHT = [8, 13, 30];
  function lutSet(fog) {
    var set = [];
    for (var l = -LIGHT_UP; l < SHADES; l++) {
      // the fog starts a few steps away (as untrustedlife's FOG_START_FRAC): near, only a
      // little darker in its own colour; the colour of the fog takes over further off
      var f = l < 0 ? 1 - 0.022 * l : 1 - 0.76 * l / (SHADES - 1), w = l < 10 ? 0 : l > 30 ? 1 : (l - 10) / 20;
      var k = l < 0 ? 0 : (1 - f) * w, t = { r: new Uint8Array(256), g: new Uint8Array(256), b: new Uint8Array(256) };
      for (var i = 0; i < 256; i++) {
        t.r[i] = Math.min(255, Math.round(i * f + fog[0] * k));
        t.g[i] = Math.min(255, Math.round(i * f + fog[1] * k));
        t.b[i] = Math.min(255, Math.round(i * f + fog[2] * k));
      }
      set.push(t);
    }
    return set;
  }
  function makeLuts() { luts = lutSet(FOG); lutsNight = lutSet(FOG_NIGHT); }
  // distance falloff; the walls running along x get a darker side (directional light)
  function shadeLevel(dist, side) { return Math.min(SHADES - 1, ((dist * 5.6) | 0) + (side ? 8 : 0)); }
  // lampOff: the night rooms' light breathes a little (one or two levels, slowly)
  var lampOff = 0;
  function lutAt(l, night) { return (night ? lutsNight : luts)[(l < -LIGHT_UP ? -LIGHT_UP : l > SHADES - 1 ? SHADES - 1 : l) + LIGHT_UP]; }
  // light: the tile light where the surface is (negative brighter, positive darker)
  function shade(dist, side, night, light) { return lutAt(shadeLevel(dist, side) + (night ? lampOff : 0) + (light | 0), night); }
  /* Gaisma pa rūtiņām (as Ray's tile lighting): a light level for every quarter
     of a cell, worked out once (and when a light is switched): a pool of light
     in front of every picture, the aquarium's and the machine's glow, darker
     corners; the night rooms dim, a small lamp by each bed, their own switch by
     the door. Smoothed, so it reads as light, not as tiles. */
  function lightAt(st, x, y) { var L = st.light; return L ? L[((y * 4) | 0) * st.lightW + ((x * 4) | 0)] | 0 : 0; }
  function buildLight(st) {
    var map = st.map, Wl = map.w * 4, Hl = map.h * 4, f = new Float32Array(Wl * Hl), off = st.lightsOff || {};
    var pool = function (cx, cy, r, s) {
      for (var j = Math.max(0, ((cy - r) * 4) | 0); j < Math.min(Hl, Math.ceil((cy + r) * 4)); j++)
        for (var i = Math.max(0, ((cx - r) * 4) | 0); i < Math.min(Wl, Math.ceil((cx + r) * 4)); i++) {
          var d = Math.hypot((i + 0.5) / 4 - cx, (j + 0.5) / 4 - cy);
          if (d < r) f[j * Wl + i] += s * (1 - d / r) * (1 - d / r);
        }
    };
    for (var j = 0; j < Hl; j++) for (var i = 0; i < Wl; i++) {
      var cx = (i / 4) | 0, cy = (j / 4) | 0, ci = cy * map.w + cx;
      if (map.zone[ci]) { var room = roomAt(map, cx + 0.5, cy + 0.5); f[j * Wl + i] = room && off[room === NMP ? 'nmp' : 'main'] ? 24 : -2; }
    }
    // the hall's floor has no pools of light: they came out as pale squares that moved as you walked
    st.props.forEach(function (p) {
      if (p.kind !== 'bed') return;
      var room = p.bed === 3 ? 'nmp' : 'main';
      pool(p.x, p.y, 1.35, off[room] ? -9 : -15);                   // the bedside lamp (a night light when the room is dark)
    });
    // smoothed twice, then whole levels
    for (var pass = 0; pass < 2; pass++) {
      var g2 = new Float32Array(Wl * Hl);
      for (j = 0; j < Hl; j++) for (i = 0; i < Wl; i++) {
        var sum = 0, cnt = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = j + dy, xx = i + dx; if (yy >= 0 && yy < Hl && xx >= 0 && xx < Wl) { sum += f[yy * Wl + xx]; cnt++; } }
        g2[j * Wl + i] = sum / cnt;
      }
      f = g2;
    }
    var L = new Int8Array(Wl * Hl);
    for (i = 0; i < L.length; i++) L[i] = Math.max(-LIGHT_UP, Math.min(40, Math.round(f[i])));
    st.light = L; st.lightW = Wl;
    st.dirty = true;
  }
  // the light switch by a night room's door: a white plate on the wall, the rocker up or down
  function switchTex(st, on) {
    var c = canvas(TEX), g = c.getContext('2d');
    g.drawImage(st.tex.nightWallCanvas, 0, 0);
    var x = TEX / 2 - 15, y = TEX * 0.44;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 2, y + 3, 30, 42);
    g.fillStyle = '#f2f1ec'; g.fillRect(x, y, 30, 42);
    g.fillStyle = '#d8d6cf'; g.fillRect(x + 9, y + 8, 12, 26);
    g.fillStyle = '#ffffff'; g.fillRect(x + 10, on ? y + 9 : y + 21, 10, 12);
    return wallTex(c);
  }
  function px(c, lut) { return (255 << 24 | lut.b[(c >> 16) & 255] << 16 | lut.g[(c >> 8) & 255] << 8 | lut.r[c & 255]) >>> 0; }
  // mip level for how many texels one pixel covers: from 1.5 on the next level
  // (from 2 on, the walls just past 1:1 still shimmered)
  function mipOf(step, max) { if (step < 1.5) return 0; var L = 31 - Math.clz32((step * 1.34) | 0); return L >= max ? max - 1 : L; }

  function render(st) {
    var t0 = performance.now();
    var buf = st.buf, H = VIEW_H, half = H / 2 + st.pitch, map = st.map, mw = map.w, mh = map.h, grid = map.grid, zone = map.zone, T = st.tex;
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
      var glass = -1, gside = 0, gwall = 0, cross = -1, door = null, doorT = 0, doorU = 0, col = -1, colX = 0, colY = 0;
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
        if (cell === PILLAR) {
          // a round column: the ray meets its circle, or passes beside it
          var pox = st.x - mx - 0.5, poy = st.y - my - 0.5, pb = pox * rx + poy * ry, pa = rx * rx + ry * ry;
          var pdisc = pb * pb - pa * (pox * pox + poy * poy - PILLAR_R * PILLAR_R);
          if (pdisc >= 0) { var pt = (-pb - Math.sqrt(pdisc)) / pa; if (pt > 0) { col = pt; colX = pox + pt * rx; colY = poy + pt * ry; break; } }
          continue;
        }
        if (cell) break;
      }
      var perp, tex, tx, art = null;
      if (door) {
        perp = doorT; tex = door.tex;
        tx = (doorU * TEX) | 0;
        if (door.axis === 0 ? st.x > door.x + 0.5 : st.y < door.y + 0.5) tx = TM - tx;   // the plate reads from both sides
      } else if (col >= 0) {
        perp = col; tex = T.marble;
        tx = ((Math.atan2(colY, colX) / (2 * Math.PI) + 0.5) * 2 * TEX) & TM;   // the stone twice round
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
      var step = TEX / lineH, L = mipOf(step, MIPS);
      var lv = tex.mips[L], tpx = lv.px, sb = TB - L, sm = lv.w - 1, txl = tx >> L, tpos = (y0 - top) * step;
      // a column is lit from one side, round: darker the further its face turns away
      var lgt = lightAt(st, st.x + (perp - 0.04) * rx, st.y + (perp - 0.04) * ry);    // the light just in front of the wall
      lut = col >= 0 ? lutAt(shadeLevel(perp, 0) + Math.round((1 - Math.max(0, (colX * 0.55 - colY * 0.83) / PILLAR_R)) * 9) + lgt, pz)
        : shade(perp, door ? 0 : side, door ? pz : zone[pmy * mw + pmx], lgt);
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
      var foot = Math.max(rd * 2 * FOV / W, rd * rd / (eyeH * P)) * TEX, Lf = mipOf(foot, MIPS);
      var own = fl ? (pz ? T.nightFloor : T.floor) : (pz ? T.nightCeil : T.ceil), oth = fl ? (pz ? T.floor : T.nightFloor) : (pz ? T.ceil : T.nightCeil);
      var ol = own.mips[Lf], al = oth.mips[Lf], opx = ol.px, apx = al.px, S = ol.w, m = S - 1, sbf = TB - Lf;
      var lutf = shade(rd, 0, pz), luta = shade(rd, 0, !pz), o = y * W;
      var lvO = shadeLevel(rd, 0) + (pz ? lampOff : 0), lvA = shadeLevel(rd, 0) + (pz ? 0 : lampOff), LG = st.light, LWd = st.lightW;
      for (x = 0; x < W; x++) {
        if (y >= wt[x] && y <= wb[x]) continue;
        var wx = fx0 + x * sx, wy = fy0 + x * sy;
        var ti = ((((wy * S) | 0) & m) << sbf) | (((wx * S) | 0) & m);
        var other = cr[x] >= 0 && rd > cr[x], lg = LG ? LG[((wy * 4) | 0) * LWd + ((wx * 4) | 0)] | 0 : 0;
        buf[o + x] = lg ? (other ? px(apx[ti], lutAt(lvA + lg, !pz)) : px(opx[ti], lutAt(lvO + lg, pz))) : other ? px(apx[ti], luta) : px(opx[ti], lutf);
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
      if (p.mesh) p.mesh.bills.forEach(function (b) { var bx = b.x - st.x, by = b.y - st.y; list.push({ p: b, d: bx * bx + by * by }); });
    });
    list.sort(function (a, b) { return b.d - a.d; });
    st.pdepth.fill(1e9);
    drawProps3D(st, dirX, dirY, plX, plY);
    drawSprites(st, list, dirX, dirY, plX, plY, 0);
    drawGlass(st);
    drawSprites(st, list, dirX, dirY, plX, plY, 1);
    st.ctx.putImageData(st.img, 0, 0);
    drawHand(st);
    var c = st.ctx, mid = VIEW_H / 2, s = W / 512;
    var cx = W >> 1, ref = st.pickRef[cx];
    st.aim = ref && st.pickDist[cx] <= (ref.isArt ? 3.4 : ref.reach || 2.4) ? ref : null;
    // looking up or down: only what the crosshair is on (straight ahead, its column, as before)
    if (st.aim && Math.abs(st.pitch) > VIEW_H * 0.06 && (mid < st.pickY0[cx] - 6 || mid > st.pickY1[cx] + 6)) st.aim = null;
    if (st.aim && st.aim.aquarium) { if (inTank(st, st.pickWX[cx])) st.aim.at = st.pickWX[cx]; else st.aim = null; }
    c.fillStyle = st.aim ? '#ffd166' : 'rgba(255,255,255,.6)';
    c.fillRect(W / 2 - s, mid - 6 * s, 2 * s, 4 * s); c.fillRect(W / 2 - s, mid + 2 * s, 2 * s, 4 * s);
    c.fillRect(W / 2 - 6 * s, mid - s, 4 * s, 2 * s); c.fillRect(W / 2 + 2 * s, mid - s, 4 * s, 2 * s);
    paintPrompt(st);
    drawMinimap(st);
    var ms = performance.now() - t0;
    st.lastMs = ms;
    st.cost = st.cost ? st.cost * 0.9 + ms * 0.1 : ms;
    st.frames++;
  }
  // Doom sprites with a soft shadow on the floor; pass 0 draws what lies
  // behind a window (in those columns), pass 1 everything else.
  function drawSprites(st, list, dirX, dirY, plX, plY, pass) {
    var inv = 1 / (plX * dirY - dirX * plY), H = VIEW_H, half = H / 2 + st.pitch, buf = st.buf, z = st.z, pd = st.pdepth;
    for (var n = 0; n < list.length; n++) {
      var p = list[n].p, spr = p.spr, sx = p.x - st.x, sy = p.y - st.y;
      var tX = inv * (dirY * sx - dirX * sy), tY = inv * (-plY * sx + plX * sy);
      if (tY <= 0.12) continue;
      var screenX = (W / 2) * (1 + tX / tY), sh = (P / tY) * (spr.hu || p.h), sw = sh * spr.w / spr.h;
      var floorY = half + ((z - (p.lift || 0)) * P) / tY, foot = floorY + (spr.drop ? spr.drop * P / tY : 0), top = foot - sh, left = screenX - sw * (spr.cx == null ? 0.5 : spr.cx);
      var x0 = Math.max(0, Math.ceil(left)), x1 = Math.min(W - 1, Math.floor(left + sw)), x;
      if (x1 < x0) continue;
      var lut = shade(tY, 0, zoneAt(st.map, p.x, p.y), lightAt(st, p.x, p.y));
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
          for (var yy = ya; yy <= yb; yy++) { var i = yy * W + x, c0 = buf[i]; if (pd[i] < 1e8) continue; buf[i] = (0xff000000 | ((c0 >> 1) & 0x7f7f7f) + ((c0 >> 2) & 0x3f3f3f) + ((c0 >> 3) & 0x1f1f1f)) >>> 0; }
        }
      }
      if (p.parts) continue;                                      // built of 3D parts: drawn after (drawProps3D)
      var ratio = spr.h / sh, L = spr.levels.length > 1 ? mipOf(ratio, spr.levels.length) : 0;
      var lv = spr.levels[L], lw = lv.w, lh = lv.h, lpx = lv.px, vStep = lh / sh;
      var y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H - 1, Math.floor(foot));
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
          if ((col >>> 24) < 128 || pd[y * W + x] < tY) continue;    // behind a 3D thing there
          buf[y * W + x] = px(col, lut);
          drew = true;
        }
        if (!drew) continue;
        if (p.kind === 'cat') st.catsSeen = true;
        if (!st.pickRef[x] || st.pickDist[x] > tY) {
          st.pickRef[x] = p.owner || p; st.pickDist[x] = tY; st.pickY0[x] = y0; st.pickY1[x] = y1; st.pickWX[x] = p.x; st.pickWY[x] = p.y;
        }
      }
    }
  }
  // the glass over whatever lies behind it: frame opaque, pane tinted
  function drawGlass(st) {
    var H = VIEW_H, half = H / 2 + st.pitch, buf = st.buf, g = st.tex.glass, z = st.z, pz = zoneAt(st.map, st.x, st.y);
    for (var x = 0; x < W; x++) {
      var d = st.glassCols[x];
      if (d < 0) continue;
      var lineH = P / d, top = half - (1 - z) * lineH;
      var y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H - 1, Math.floor(half + z * lineH));
      var step = TEX / lineH, L = mipOf(step, MIPS);
      var lv = g.mips[L], gp = lv.px, sb = TB - L, sm = lv.w - 1, txl = ((st.glassX[x] * TEX) | 0) >> L, tpos = (y0 - top) * step;
      var lut = shade(d, st.glassSide[x], pz);
      for (var y = y0; y <= y1; y++) {
        var c = gp[((((tpos | 0) >> L) & sm) << sb) | txl];
        tpos += step;
        var a = c >>> 24;
        if (!a) continue;
        var i = y * W + x, o = buf[i];
        if (st.pdepth[i] < d) continue;
        if (a > 250) { buf[i] = px(c, lut); continue; }
        var r = ((o & 255) * (255 - a) + lut.r[c & 255] * a) >> 8;
        var gg = (((o >> 8) & 255) * (255 - a) + lut.g[(c >> 8) & 255] * a) >> 8;
        var bb = (((o >> 16) & 255) * (255 - a) + lut.b[(c >> 16) & 255] * a) >> 8;
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
      case 'catstatue': return ['E', 'Apskatīt: ' + CAT_STATUE.title];
      case 'oldpc': return ['E', 'Ieslēgt veco datoru'];
      case 'goldcup': return ['E', 'Paņemt zelta krūzīti'];
      case 'arcade': return ['E', 'Spēlēt Konfektes 98'];
      case 'arcademines': return ['E', 'Spēlēt Mīnas 98'];
      case 'pinball': return ['E', 'Spēlēt Pinbols 98'];
      case 'cat': return ['E', 'Paglaudīt: ' + a.name];
      case 'aquarium': return ['E', 'Pabarot zivtiņas'];
      case 'monster': return ['E', 'Paņemt White Monster'];
      case 'monsterbox': return ['E', 'Paņemt bundžu no kastes'];
      case 'switch': return ['E', st.lightsOff[a.room] ? 'Ieslēgt gaismu' : 'Izslēgt gaismu'];
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
  // the status bar's pictures in the window's one ink (white dither, as the buttons beside it)
  function hudIcons() {
    [['today', 'frame'], ['night', 'night'], ['draw', 'all'], ['cup', 'cup']].forEach(function (pair) {
      var el = root.querySelector('[data-ico="' + pair[0] + '"]');
      if (el) el.innerHTML = '<i class="mx-doom-ico" style="' + iconMask(pair[1]) + '"></i>';
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
    var on = !!(state && state.musicOn), btn = root.querySelector('.mx-doom-music');
    if (!btn) return;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.title = on ? '♪ ' + MUSIC[musicIdx].title : '';
    btn.classList.toggle('is-off', !on);
  }
  function setMusic(st, on) {
    st.musicOn = on;
    musicRemember(on);
    if (on) musicStart(); else musicStop(false);
    var g = st.props.find(function (p) { return p.kind === 'gramophone'; });
    if (g) remodel(g, function () { return gramophoneModel(on); });
    say(st, on ? 'Skan ' + MUSIC[musicIdx].title : 'Mūzika izslēgta. M: ieslēgt');
    paintMusic();
  }

  /* ── Skaņas ───────────────────────────────────────────────────────────── */
  // Short, dry, made right here (Web Audio, no files): the doors, the
  // coffee machine, a sip, the fish food, a medal. Only while the sound is on
  // (the speaker button, M): the same switch as the music.
  var actx = null, noiseBuf = null;
  function audioCtx() {
    if (actx) return actx.state === 'closed' ? null : actx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // made as the gallery opens, with the output's own rate: made later (the first door)
    // it reset the Mac's sound output for a moment and the music stuttered
    try { actx = new AC({ latencyHint: 'playback' }); } catch (_e) { try { actx = new AC(); } catch (_e2) { return null; } }
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.6, actx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return actx;
  }
  function tone(a, t, type, f0, f1, dur, vol) {
    var v = 0.96 + Math.random() * 0.08; f0 *= v; f1 *= v;          // a little different each time (not robotic)
    var o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(a, t, dur, vol, type, f0, f1) {
    var n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    n.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(a.destination); n.start(t, Math.random() * 0.3); n.stop(t + dur + 0.02);
  }
  function sfx(st, kind) {
    if (!st || !st.musicOn || document.hidden) return;
    var a = audioCtx();
    if (!a) return;
    if (a.state === 'suspended') { a.resume().catch(function () {}); return; }
    var t = a.currentTime + 0.005;
    if (kind === 'door') noise(a, t, 0.38, 0.045, 'lowpass', 500, 1800);
    else if (kind === 'brew') { tone(a, t, 'square', 92, 92, BREW_MS / 1000, 0.012); noise(a, t + 0.25, 1.1, 0.025, 'bandpass', 600, 1400); }
    else if (kind === 'sip') tone(a, t, 'sine', 230, 120, 0.09, 0.09);
    else if (kind === 'plop') { tone(a, t, 'sine', 720, 240, 0.06, 0.06); tone(a, t + 0.09, 'sine', 640, 220, 0.05, 0.04); }
    else if (kind === 'click') { tone(a, t, 'square', 2200, 1800, 0.018, 0.03); noise(a, t, 0.025, 0.03, 'highpass', 3000, 3000); }
    else if (kind === 'badge') { tone(a, t, 'square', 880, 880, 0.07, 0.035); tone(a, t + 0.08, 'square', 1320, 1320, 0.09, 0.035); }
  }

  /* ── Ievads ───────────────────────────────────────────────────────────────
     As basement.studio opens, in the gallery's blue: a work of art (Venus de Milo
     first, then Leonardo, one each opening) comes out of the blue sky in fine dots
     from the middle outwards, stays so you can see it, then a wave turns it into
     the hall, first in the hall's own dots, then in its colours (~5 s). Drawn on
     its own layer at the screen's real resolution (not the game's coarse pixels):
     error-diffused dots in three inks on a soft blue, as the sky round the window.
     It never stutters: every pixel is written only two or three times in the
     whole opening (pixels are sorted by the moment they change), and the hall's
     dots are worked out a few rows a frame while the work stands. Skipped for
     reduced motion. */
  var INTRO_IN = 1800, INTRO_HOLD = 1200, INTRO_TURN = 2000, INTRO_MAXW = 1280;
  // only cut-out figures, no frame and no ground round them (as the statue in the
  // reference): Venus de Milo's photo, and Leonardo's sitters lifted from their
  // paintings with the Mac's Vision (scripts/cutout.swift) into assets/gallery/cut, and
  // Michelangelo's two hands from the Creation of Adam reaching for each other
  var INTRO_ART = ['venus-milo', 'adam', 'cut/cat-statue', 'cut/mona-lisa', 'cut/lady-ermine', 'cut/madonna-litta', 'cut/ginevra', 'cut/benois-madonna', 'cut/belle-ferronniere'], introNext = 0, introImgs = {};
  var B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var INK_MID = [150, 162, 255], INK_HI = [244, 246, 255];
  function hash2(x, y) { var h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function introImage() {
    var id = INTRO_ART[introNext++ % INTRO_ART.length];
    if (id === 'adam') {
      var l = introLoad('adam-left'), r = introLoad('adam-right');
      return { pair: [l, r], get complete() { return l.complete && r.complete; }, get naturalWidth() { return l.naturalWidth && r.naturalWidth; } };
    }
    return introLoad(id);
  }
  function introLoad(id) {
    if (!introImgs[id]) { introImgs[id] = new Image(); introImgs[id].decoding = 'async'; introImgs[id].src = ART + id + '.webp' + ART_V; }
    return introImgs[id];
  }
  // the next opening's work fetched ahead: the first already as this file loads, so after a
  // reload it is in by the time the hall is built
  function introPreload() {
    var id = INTRO_ART[introNext % INTRO_ART.length];
    if (id === 'adam') { introLoad('adam-left'); introLoad('adam-right'); } else introLoad(id);
  }
  introPreload();
  // the sky: blue from top to bottom with a few soft lighter patches
  function introSky(IW, IH) {
    var c = canvas(IW, IH), g = c.getContext('2d', { willReadFrequently: true });
    var lin = g.createLinearGradient(0, 0, 0, IH); lin.addColorStop(0, '#1a28dc'); lin.addColorStop(1, '#1c22c8');
    g.fillStyle = lin; g.fillRect(0, 0, IW, IH);
    [[0.72, 0.3, 0.45], [0.25, 0.8, 0.35], [0.9, 0.85, 0.3]].forEach(function (b) {
      var r = b[2] * IW, gr = g.createRadialGradient(b[0] * IW, b[1] * IH, 0, b[0] * IW, b[1] * IH, r);
      gr.addColorStop(0, 'rgba(70,90,250,.55)'); gr.addColorStop(1, 'rgba(70,90,250,0)');
      g.fillStyle = gr; g.fillRect(0, 0, IW, IH);
    });
    // a few fields of dots in a grid over the open sky
    var r = rnd(7 + introNext), sp = Math.max(9, Math.round(IW / 110));
    g.fillStyle = 'rgba(240,244,255,.85)';
    for (var f = 0; f < 6; f++) {
      var fx = IW * (0.5 + r() * 0.42), fy = IH * (0.06 + r() * 0.8), cols = 4 + (r() * 9 | 0), rows = 2 + (r() * 4 | 0);
      for (var a = 0; a < rows; a++) for (var b = 0; b < cols; b++) if (r() > 0.18) g.fillRect(Math.round(fx + b * sp), Math.round(fy + a * sp), 2.2, 2.2);
    }
    return new Uint32Array(g.getImageData(0, 0, IW, IH).data.buffer.slice(0));
  }
  // three inks by error diffusion (Floyd–Steinberg, serpentine): 0 sky, 1 pale blue, 2 white
  function diffuse(lum, IW, IH, y0, y1, err) {
    var lv = err.levels;
    for (var y = y0; y < y1; y++) {
      var cur = err.rows[y & 1], nxt = err.rows[(y + 1) & 1], ltr = !(y & 1);
      nxt.fill(0);
      for (var k = 0; k < IW; k++) {
        var x = ltr ? k : IW - 1 - k, i = y * IW + x, v = lum[i] + cur[x + 1];
        if (lum[i] < 0) { lv[i] = 255; continue; }                    // outside the work: the sky
        var q = v < 0.25 ? 0 : v < 0.72 ? 1 : 2, e = v - [0, 0.5, 1][q], s = ltr ? 1 : -1;
        lv[i] = q;
        cur[x + 1 + s] += e * 7 / 16; nxt[x + 1 - s] += e * 3 / 16; nxt[x + 1] += e * 5 / 16; nxt[x + 1 + s] += e / 16;
      }
    }
  }
  function errState(IW, IH) { return { levels: new Uint8Array(IW * IH), rows: [new Float32Array(IW + 2), new Float32Array(IW + 2)] }; }
  function inkOf(sky, level, mix) {                                 // the ink a level is drawn in over the sky
    if (level === 255 || level === 0) return sky;
    var c = level === 1 ? INK_MID : INK_HI, a = level === 1 ? 0.75 * mix : mix;
    return (255 << 24 | Math.round(((sky >> 16) & 255) * (1 - a) + c[2] * a) << 16 | Math.round(((sky >> 8) & 255) * (1 - a) + c[1] * a) << 8 | Math.round((sky & 255) * (1 - a) + c[0] * a)) >>> 0;
  }
  // every pixel's moment (0..1) into 512 lists, so a frame touches only the pixels whose moment came
  function byMoment(IW, IH, moment) {
    var N = 512, n = IW * IH, at = new Uint16Array(n), counts = new Uint32Array(N + 1);
    for (var i = 0; i < n; i++) { var m = Math.max(0, Math.min(N - 1, (moment(i % IW, (i / IW) | 0) * N) | 0)); at[i] = m; counts[m + 1]++; }
    for (var b = 0; b < N; b++) counts[b + 1] += counts[b];
    var order = new Uint32Array(n), fill = counts.slice(0, N);
    for (i = 0; i < n; i++) order[fill[at[i]]++] = i;
    return { order: order, start: counts, N: N, done: 0 };
  }
  var it_center = [0.3, 0.45];                                      // where the figure stands: its dots come out from there
  function lumOf(img, IW, IH) {                                     // the work fitted in, its light 0..1 (outside: -1)
    var c = canvas(IW, IH), g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high';
    if (img.pair) {
      // Adam's hand from the left edge, God's from the right a little higher, the fingertips
      // nearly touching in the middle
      var L = img.pair[0], R = img.pair[1], wl = IW * 0.5, hl = L.naturalHeight * wl / L.naturalWidth, wr = IW * 0.5, hr = R.naturalHeight * wr / R.naturalWidth;
      g.drawImage(L, IW * 0.005, IH * 0.58 - hl / 2, wl, hl);
      g.drawImage(R, IW * 0.5, IH * 0.42 - hr / 2, wr, hr);
      it_center = [0.5, 0.5];
      return levelsOf(g, IW, IH);
    }
    // large, at the left, the head well inside (a little sky above it), only its very foot
    // cut by the bottom edge, the sky open to its right
    var k = Math.min(IH * 1.0 / img.naturalHeight, IW * 0.58 / img.naturalWidth), w = img.naturalWidth * k, h = img.naturalHeight * k;
    var top = Math.max(IH * 0.05, IH - h * 0.95);
    g.drawImage(img, IW * 0.07, top, w, h);
    it_center = [(IW * 0.07 + w / 2) / IW, Math.min(0.6, (top + h * 0.4) / IH)];
    return levelsOf(g, IW, IH);
  }
  function levelsOf(g, IW, IH) {
    var d = g.getImageData(0, 0, IW, IH).data, out = new Float32Array(IW * IH), hist = new Uint32Array(256), n = 0;
    for (var i = 0, j = 0; i < out.length; i++, j += 4) {
      if (d[j + 3] < 100) { out[i] = -1; continue; }
      var l = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
      out[i] = l; hist[l]++; n++;
    }
    // each work stretched to the full range (a dark old painting reads as bright as the marble):
    // its 4th and 98th percentile become dark and light, then a gentle curve keeps the texture
    var lo = 0, hi = 255, acc = 0;
    for (var v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.04) { lo = v; break; } }
    acc = 0;
    for (v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.02) { hi = v; break; } }
    var span = Math.max(24, hi - lo);
    for (i = 0; i < out.length; i++) {
      if (out[i] < 0) continue;
      var t = Math.max(0, Math.min(1, (out[i] - lo) / span));
      out[i] = Math.max(0, Math.min(1, 0.08 + Math.pow(t, 0.9) * 0.95));
    }
    return out;
  }
  function introStart(st) {
    var view = root.querySelector('.mx-doom-view'), layer = root.querySelector('.mx-doom-intro'), dpr = window.devicePixelRatio || 1;
    var cw = view.offsetWidth, ch = view.offsetHeight;
    if (!cw || !ch) return null;
    var s = Math.min(dpr, INTRO_MAXW / cw), IW = Math.round(cw * s), IH = Math.round(ch * s);
    layer.width = IW; layer.height = IH;
    layer.style.left = view.offsetLeft + 'px'; layer.style.top = view.offsetTop + 'px';
    layer.style.width = cw + 'px'; layer.style.height = ch + 'px';
    layer.hidden = false;
    var g = layer.getContext('2d'), img = g.createImageData(IW, IH), out = new Uint32Array(img.data.buffer), sky = introSky(IW, IH);
    out.set(sky); g.putImageData(img, 0, 0);
    return { t0: performance.now(), IW: IW, IH: IH, g: g, img: img, out: out, sky: sky, pic: introImage(), art: null, inOrder: null, turnOrder: null, hall: null };
  }
  function introStep(st, now) {
    var it = st.intro;
    if (!it.out) { var made = introStart(st); if (!made) { st.intro = null; st.dirty = true; return; } it = st.intro = Object.assign(made, { base: it.base }); }
    var IW = it.IW, IH = it.IH, out = it.out, sky = it.sky;
    // made while the sky stands still, one piece a frame: the work's dots, then the order they come in
    if (it.pic && !it.art) {
      if (it.pic.complete && it.pic.naturalWidth) { var lum = lumOf(it.pic, IW, IH), e = errState(IW, IH); diffuse(lum, IW, IH, 0, IH, e); it.art = e.levels; return; }
      if (now - it.t0 > 6000) { it.pic = null; it.t0 = now - INTRO_IN; }   // never came (offline): straight to the hall
      else return;
    }
    if (it.art && !it.inOrder) {
      it.inOrder = byMoment(IW, IH, function (x, y) { var dx = x / IW - it_center[0], dy = (y / IH - it_center[1]) * IH / IW; return Math.min(0.999, Math.hypot(dx, dy) * 1.05 + hash2(x >> 1, y >> 1) * 0.2); });
      it.t0 = now;
      return;
    }
    var t = now - it.t0, changed = false;
    // 1. the work comes out of the sky
    if (it.art) {
      var o = it.inOrder, upto = Math.min(o.N, Math.floor(Math.min(1, t / INTRO_IN) * o.N));
      for (var b = o.done; b < upto; b++) for (var k = o.start[b]; k < o.start[b + 1]; k++) { var i = o.order[k]; out[i] = inkOf(sky[i], it.art[i], 1); }
      if (upto > o.done) { o.done = upto; changed = true; }
    }
    // 2. while it stands: the hall drawn again (its pictures are in by now), its dots worked out a few rows a frame
    if (t >= INTRO_IN && !it.turnOrder) {
      it.turnOrder = byMoment(IW, IH, function (x, y) { return Math.min(0.999, (x / IW) * 0.72 + (1 - y / IH) * 0.08 + hash2((x >> 2) + 7, y >> 2) * 0.2); });
      if (changed) it.g.putImageData(it.img, 0, 0);
      return;
    }
    if (t >= INTRO_IN && !it.hall) {
      render(st); it.base = new Uint32Array(st.buf);
      var hl = new Float32Array(IW * IH), bw = W, bh = VIEW_H;
      for (var y = 0; y < IH; y++) { var sy = ((y * bh / IH) | 0) * bw; for (var x = 0; x < IW; x++) { var c = it.base[sy + ((x * bw / IW) | 0)]; hl[y * IW + x] = Math.min(1, ((c & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + ((c >> 16) & 255) * 0.11) / 255 * 1.1); } }
      it.hall = { lum: hl, e: errState(IW, IH), row: 0 };
    }
    if (it.hall && it.hall.row < IH) {
      var rows = Math.max(8, Math.ceil(IH / Math.max(1, (INTRO_HOLD - 150) / 16)));
      diffuse(it.hall.lum, IW, IH, it.hall.row, Math.min(IH, it.hall.row + rows), it.hall.e);
      it.hall.row += rows;
    }
    // 3. the wave: the hall's dots first, its colours a moment after
    var tt = t - INTRO_IN - INTRO_HOLD;
    if (tt >= 0 && it.hall) {
      if (it.hall.row < IH) { diffuse(it.hall.lum, IW, IH, it.hall.row, IH, it.hall.e); it.hall.row = IH; }
      var w = it.turnOrder, lv = it.hall.e.levels, base = it.base, bw2 = W, bh2 = VIEW_H;
      var dotsUpto = Math.min(w.N, Math.floor(Math.min(1, tt / (INTRO_TURN * 0.7)) * w.N));
      for (b = w.done; b < dotsUpto; b++) for (k = w.start[b]; k < w.start[b + 1]; k++) { i = w.order[k]; out[i] = inkOf(sky[i], lv[i], 1); }
      if (dotsUpto > w.done) { w.done = dotsUpto; changed = true; }
      w.cdone = w.cdone || 0;
      var colUpto = Math.min(w.N, Math.floor(Math.max(0, Math.min(1, (tt - INTRO_TURN * 0.3) / (INTRO_TURN * 0.7))) * w.N));
      for (b = w.cdone; b < colUpto; b++) for (k = w.start[b]; k < w.start[b + 1]; k++) {
        i = w.order[k]; var px0 = i % IW, py0 = (i / IW) | 0;
        out[i] = base[((py0 * bh2 / IH) | 0) * bw2 + ((px0 * bw2 / IW) | 0)];
      }
      if (colUpto > w.cdone) { w.cdone = colUpto; changed = true; }
      if (colUpto >= w.N) { introEnd(st); return; }
    }
    if (changed) it.g.putImageData(it.img, 0, 0);
  }
  function introEnd(st) {
    st.intro = null; st.dirty = true;
    introPreload();
    var layer = root && root.querySelector('.mx-doom-intro');
    if (layer) { layer.hidden = true; layer.width = layer.height = 1; }
  }

  /* ── Medaļas ──────────────────────────────────────────────────────────── */
  function badgeStore() { try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '{}') || {}; } catch (_e) { return {}; } }
  function badgeSave(b) { try { localStorage.setItem(BADGE_KEY, JSON.stringify(b)); } catch (_e) {} }
  function earn(st, id) {
    var b = badgeStore();
    if (b[id]) return;
    b[id] = Date.now();
    badgeSave(b);
    var label = (BADGES.find(function (x) { return x[0] === id; }) || [id, id])[1];
    say(st, 'Medaļa: ' + label + ' (' + BADGES.filter(function (x) { return b[x[0]]; }).length + '/' + BADGES.length + ')');
    sfx(st, 'badge');
    flash();
    paintBadges();
  }
  // a step towards one that needs several (the Leonardo works seen, the cats stroked)
  function earnPart(st, id, part, need) {
    var b = badgeStore(), key = id + 'Seen', list = Array.isArray(b[key]) ? b[key] : [];
    if (list.indexOf(part) < 0) { list.push(part); b[key] = list; badgeSave(b); }
    if (list.length >= need) earn(st, id);
  }
  function paintBadges() {
    var b = badgeStore(), n = BADGES.filter(function (x) { return b[x[0]]; }).length, btn = root && root.querySelector('.mx-doom-badges-btn');
    if (btn) btn.querySelector('b').textContent = n + '/' + BADGES.length;
    var box = root && root.querySelector('.mx-doom-badges-list');
    if (box) box.innerHTML = BADGES.map(function (x) {
      return '<li class="' + (b[x[0]] ? 'is-got' : '') + '"><i aria-hidden="true">' + (b[x[0]] ? '★' : '☆') + '</i><span>' + esc(x[1]) + '</span></li>';
    }).join('');
  }
  function showBadges(show) {
    var st = state, box = root.querySelector('.mx-doom-badges');
    if (!st) return;
    if (show) { freeMouse(); paintBadges(); }
    box.hidden = !show;
    st.viewing = show || !root.querySelector('.mx-doom-look').hidden || !root.querySelector('.mx-doom-all').hidden;
    st.keys = {};
    st.dirty = true;
  }

  /* ── Kustība ──────────────────────────────────────────────────────────── */
  function free(st, x, y) {
    var map = st.map, mx = Math.floor(x), my = Math.floor(y);
    if (mx < 0 || my < 0 || mx >= map.w || my >= map.h) return false;
    var ci = my * map.w + mx, cell = map.grid[ci];
    if (cell === DOOR) { if (map.doors[map.doorAt[ci]].open < 0.9) return false; }
    else if (cell === PILLAR) { var cdx = x - mx - 0.5, cdy = y - my - 0.5; if (cdx * cdx + cdy * cdy < PILLAR_R * PILLAR_R) return false; }
    else if (cell !== EMPTY) return false;
    for (var i = 0; i < st.props.length; i++) {
      var p = st.props[i];
      if (p.solid && !p.hidden && (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < p.solid * p.solid) return false;
    }
    return true;
  }
  // each axis on its own (sliding along walls); the corners too, so a wall's
  // corner never lets you in to look through it
  function tryMove(st, nx, ny) {
    var r = RADIUS, k = r * 0.8, ox = st.x, oy = st.y;
    var sx = nx > st.x ? r : -r;
    if (free(st, nx + sx, st.y) && free(st, nx, st.y + r) && free(st, nx, st.y - r) && free(st, nx + sx * 0.8, st.y + k) && free(st, nx + sx * 0.8, st.y - k)) st.x = nx;
    var sy = ny > st.y ? r : -r;
    if (free(st, st.x, ny + sy) && free(st, st.x + r, ny) && free(st, st.x - r, ny) && free(st, st.x + k, ny + sy * 0.8) && free(st, st.x - k, ny + sy * 0.8)) st.y = ny;
    return { x: st.x !== ox, y: st.y !== oy };
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
    statsTick(now);
    if (document.hidden || st.viewing || st.paused) {
      st.last = now; st.vx = st.vy = 0; st.dragTurn = st.dPitch = 0;
      if (st.viewing && !st.paused) padRead(st);               // B on the controller closes the view
      return;
    }
    if (st.intro) { introStep(st, now); st.last = now; st.dragTurn = st.dPitch = 0; return; }
    var dt = Math.min(0.05, (now - (st.last || now)) / 1000);
    st.last = now;
    var k = st.keys, moved = false;
    var turn = (k.ArrowLeft ? -1 : 0) + (k.ArrowRight ? 1 : 0);
    var fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    var strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    var clamp1 = function (v) { return Math.max(-1, Math.min(1, v)); };
    // a game controller: left stick walks, right stick looks (A uses, X sips, Y the map, B back)
    var pad = padRead(st);
    if (pad) {
      fwd = clamp1(fwd - pad.ly); strafe = clamp1(strafe + pad.lx); st.padRun = pad.run;
      if (pad.rx) st.dragTurn += pad.rx * TURN * 1.25 * dt;
      if (pad.ry) st.dPitch -= pad.ry * VIEW_H * 1.1 * dt;
    }
    // the thumb's stick on a phone (bottom left of the picture)
    if (st.joy) { fwd = clamp1(fwd - st.joy.y); strafe = clamp1(strafe + st.joy.x); }
    // gliding to a picture before it opens big: nothing else moves the view meanwhile
    if (st.glide) {
      var gl = st.glide, gt = Math.min(1, (now - gl.t0) / gl.ms), ge = ease(gt), dA = Math.atan2(Math.sin(gl.to.a - gl.from.a), Math.cos(gl.to.a - gl.from.a));
      st.x = gl.from.x + (gl.to.x - gl.from.x) * ge; st.y = gl.from.y + (gl.to.y - gl.from.y) * ge;
      st.a = gl.from.a + dA * ge; st.pitch = gl.from.p * (1 - ge);
      fwd = strafe = 0; st.dragTurn = st.dPitch = 0;
      moved = true;
      if (gt >= 1) { st.glide = null; gl.then(); }
    }
    var looked = false;
    if (turn || fwd || strafe) st.goal = null;
    if (turn) { st.a += turn * TURN * dt; moved = true; }
    if (st.dragTurn) { st.a += st.dragTurn; st.dragTurn = 0; moved = looked = true; }
    if (st.dPitch) {
      var lim = VIEW_H * PITCH_MAX, np = Math.max(-lim, Math.min(lim, st.pitch + st.dPitch));
      st.dPitch = 0;
      if (np !== st.pitch) { st.pitch = np; moved = looked = true; }
    }
    if ((fwd || strafe || st.goal) && st.seated) standUp(st);
    st.moving = !!(fwd || strafe || st.goal);
    // speed builds up and settles over ~0.1 s instead of jumping on and off
    var tvx = 0, tvy = 0;
    if (fwd || strafe) {
      var spd = k.ShiftLeft || k.ShiftRight || st.padRun ? RUN : MOVE, ca = Math.cos(st.a), sa = Math.sin(st.a), len = Math.max(1, Math.hypot(fwd, strafe));
      tvx = (ca * fwd - sa * strafe) / len * spd; tvy = (sa * fwd + ca * strafe) / len * spd;
    }
    if (st.goal) { st.vx = st.vy = 0; moved = walkGoal(st, dt) || moved; }
    else {
      var acc = 1 - Math.exp(-dt * (fwd || strafe ? 13 : 17));   // the same feel at 30 and at 144 frames a second
      st.vx += (tvx - st.vx) * acc; st.vy += (tvy - st.vy) * acc;
      if (Math.abs(st.vx) + Math.abs(st.vy) > 0.03) {
        var hit = tryMove(st, st.x + st.vx * dt, st.y + st.vy * dt);
        if (!hit.x) st.vx = 0;
        if (!hit.y) st.vy = 0;
        st.walk += dt * 9 * Math.min(1, Math.hypot(st.vx, st.vy) / MOVE);
        if (!st.endSeen && st.y > st.map.h - 4) { st.endSeen = true; earn(st, 'end'); }
        st.moving = true;
        moved = true;
      } else st.vx = st.vy = 0;
    }
    if (moved) {
      var seg = segmentAt(st);
      if (seg !== st.seg) { st.seg = seg; if (seg) say(st, segmentText(st, seg)); }
    }
    // doors slide open when you come near and close behind you
    st.map.doors.forEach(function (d) {
      var near = Math.hypot(st.x - d.x - 0.5, st.y - d.y - 0.5) < 1.8;
      var want = near ? 1 : 0;
      if (d.open !== want) {
        if ((want && d.open === 0) || (!want && d.open === 1)) sfx(st, 'door');
        d.open = want ? Math.min(1, d.open + dt * 2.6) : Math.max(0, d.open - dt * 2); moved = true;
      }
    });
    updateCats(st, dt, now);
    // the night rooms' light is steady (a breathing light read as flicker)
    if (lampOff) { lampOff = 0; moved = true; }
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
    if (st.msgShown && now >= st.msgUntil) { st.msgShown = false; root.querySelector('.mx-doom-msg').hidden = true; }
    // nothing changed: nothing is drawn; a cat in sight is drawn 30 times a second
    var roomy = st.cost && st.cost < 4;                              // a frame costs little here
    var catTick = st.catsSeen && now - st.drawnAt >= (roomy ? 0 : 32);
    if (!moved && !st.dirty && !catTick && !aquaTick) {
      return;
    }
    // turning the view with the caught mouse: every frame (30 a second judders there)
    var smooth = looked || (moved && document.pointerLockElement) || (catTick && roomy);
    if (now - st.drawnAt < 28 && !st.dirty && !smooth) return;
    st.drawnAt = now;
    st.dirty = false;
    render(st);
    statsFrame(st.lastMs || 0);
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
  // a slow computer: draw a smaller picture; once frames are cheap again (a
  // busy moment has passed), a bigger one again. Remembered for next time.
  function keepUp(st) {
    if (st.frames < 24 || st.loweredAt > st.frames - 24) return;
    var next = 0;
    if (st.cost >= 14 && st.cap > 320) next = Math.max(320, st.cap - 80);
    else if (st.cost < 6 && st.cap < maxWidth() && st.frames - st.loweredAt > 240) next = Math.min(maxWidth(), st.cap + 80);
    if (!next) return;
    try { localStorage.setItem(QUALITY_KEY, String(next)); } catch (_e) {}
    st.cap = next;
    setSize(st);
    st.loweredAt = st.frames;
    st.cost = 0;
  }
  function say(st, text) {
    st.msg = text; st.msgUntil = performance.now() + 3600; st.msgShown = true;
    var el = root.querySelector('.mx-doom-msg');
    el.textContent = text; el.hidden = false;
    st.dirty = true;
  }

  // Before a picture opens big, the view turns to it and steps up to it (~0.3 s,
  // as Musewalk): where it stands to look, if that spot is free; else it only turns.
  function glideTo(st, ref, then) {
    var m = /^(\d+),(\d+),([nesw])$/.exec(ref.key || ''), still = document.documentElement.dataset.motion === 'reduced';
    if (!m || still) { then(); return; }
    var x = +m[1], y = +m[2], f = m[3], nx = f === 'e' ? 1 : f === 'w' ? -1 : 0, ny = f === 's' ? 1 : f === 'n' ? -1 : 0;
    var cx = x + 0.5 + nx * 0.5, cy = y + 0.5 + ny * 0.5, tx = cx + nx * 1.55, ty = cy + ny * 1.55;
    if (!free(st, tx, ty)) { tx = st.x; ty = st.y; }
    var ta = Math.atan2(cy - ty, cx - tx);
    if (Math.hypot(tx - st.x, ty - st.y) < 0.05 && Math.abs(Math.atan2(Math.sin(ta - st.a), Math.cos(ta - st.a))) < 0.04 && Math.abs(st.pitch) < 2) { then(); return; }
    st.goal = null; st.vx = st.vy = 0;
    st.glide = { t0: performance.now(), ms: 320, from: { x: st.x, y: st.y, a: st.a, p: st.pitch }, to: { x: tx, y: ty, a: ta }, then: then };
  }
  // what is open inside the game closes: the coffee menu, a picture, all drawings, the medals
  function closeInside() {
    if (!root.querySelector('.mx-doom-menu').hidden) menu(false);
    else if (!root.querySelector('.mx-doom-look').hidden) look(null);
    else if (!root.querySelector('.mx-doom-all').hidden) showAll(false);
    else if (!root.querySelector('.mx-doom-badges').hidden) showBadges(false);
    else return false;
    return true;
  }
  var padSeen = false;
  window.addEventListener('gamepadconnected', function () { padSeen = true; });
  function padRead(st) {
    if (!padSeen || !navigator.getGamepads) return null;
    var list = navigator.getGamepads(), gp = null;
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].connected) { gp = list[i]; break; }
    if (!gp) return null;
    // a round deadzone on each stick (per axis it snapped diagonals to the axes)
    var stick = function (x, y) { x = x || 0; y = y || 0; var m = Math.hypot(x, y); if (m < 0.18) return [0, 0]; var k = Math.min(1, (m - 0.18) / 0.82) / m; return [x * k, y * k]; };
    var b = gp.buttons.map(function (x) { return x.pressed; }), prev = st.padPrev || [];
    var hit = function (n) { return b[n] && !prev[n]; };
    st.padPrev = b;
    if (st.viewing) { if (hit(1)) closeInside(); return null; }
    if (hit(0)) { if (st.aim) interact(st.aim); else if (st.seated) standUp(st); }
    if (hit(2)) sip(st);
    if (hit(3)) toggleMap(st);
    if (hit(9)) setMusic(st, !st.musicOn);
    var L = stick(gp.axes[0], gp.axes[1]), Rs = stick(gp.axes[2], gp.axes[3]);
    return { lx: L[0], ly: L[1], rx: Rs[0], ry: Rs[1], run: !!(b[7] || b[10]) };
  }

  /* ── Darbības ─────────────────────────────────────────────────────────── */
  function sip(st) {
    if (!st.cup || st.cup.outAt) { say(st, st.brew ? 'Kafija vēl top' : 'Vispirms paņem kafiju: Löfbergs aparāts vestibilā'); return; }
    if (!st.sip) { st.sip = performance.now(); st.dirty = true; sfx(st, 'sip'); }
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
        earn(st, 'monster');
      } else {
        say(st, 'Izdzerts! Vēl vienu? Löfbergs aparāts ir vestibilā');
        earnPart(st, 'coffee', String(Date.now()), 3);
      }
    }
    drawHud(st);
  }
  function finishBrew(st) {
    var kind = st.brew.kind;
    st.brew = null;
    var m = st.props.find(function (p) { return p.kind === 'machine'; });
    if (m) remodel(m, function () { return machineModel(false); });
    st.cup = { kind: kind, left: SIPS, canvas: handCanvas(kind), inAt: performance.now() };
    drawHud(st);
    say(st, kind.name + ' rokā. C vai klikšķis uz krūzītes: malks');
    flash();
  }
  function brew(st, i) {
    menu(false);
    var kind = COFFEES[i];
    if (!kind || st.brew) return;
    if (st.cup && !st.cup.outAt) st.cup.outAt = performance.now();
    st.brew = { kind: kind, at: performance.now() };
    drawHud(st);
    var m = st.props.find(function (p) { return p.kind === 'machine'; });
    if (m) remodel(m, function () { return machineModel(true); });
    say(st, 'Löfbergs gatavo: ' + kind.name + ', ' + PRICE);
    sfx(st, 'brew');
  }
  function takeCan(st) {
    if (st.cup && st.cup.kind.can && !st.cup.outAt) { say(st, 'Bundža jau ir rokā. C: malks'); return; }
    if (st.cup && !st.cup.outAt) st.cup.outAt = performance.now();
    var can = st.props.find(function (p) { return p.kind === 'monster'; });
    if (can) can.hidden = true;
    st.cup = { kind: MONSTER, left: MONSTER.sips, canvas: handCanvas(MONSTER), inAt: performance.now() };
    drawHud(st);
    say(st, 'White Monster rokā. C vai klikšķis uz bundžas: malks');
    flash();
  }
  function standUp(st) {
    st.seated = false;
    st.props.forEach(function (p) {
      if (p.kind === 'chair') p.hidden = false;
      if (p.kind === 'table' && !p.mesh) p.spr = tableSprite(false);
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
    if (!table.mesh) table.spr = tableSprite(true);
    earn(st, 'sit');
    say(st, st.cup ? 'Tu apsēdies. C: malks, W: piecelties' : 'Tu apsēdies. W: piecelties');
  }
  function interact(ref) {
    var st = state;
    if (!st || !ref) return;
    if (ref.isArt) {
      if (ref.plan) { glideTo(st, ref, function () { look({ src: st.planUrl || (st.planUrl = planCanvas(st).toDataURL('image/png')), caption: 'Nakts sadalījums: ' + st.dayTitle(st.today || '').toLowerCase() }); earn(st, 'plan'); }); return; }
      if (ref.empty) { if (st.onDraw) st.onDraw({ slot: ref.key, frame: ref.idx, day: ref.day }); return; }
      glideTo(st, ref, function () {
        look(lookSpecFor(st, ref.item, ref));
        if (ref.item.classic) earnPart(st, 'leo', ref.item.id, 9);
      });
      return;
    }
    switch (ref.kind) {
      case 'easel': if (st.onDraw) st.onDraw({}); return;
      case 'table': case 'chair': if (!st.seated) sitDown(st, ref); return;
      case 'gramophone': setMusic(st, !st.musicOn); return;
      case 'machine': if (!st.brew) menu(true); return;
      case 'statue': look({ src: ART + 'venus-milo.webp' + ART_V, caption: VENUS.caption, more: WIKI + MORE.venus }); earn(st, 'venus'); return;
      case 'catstatue': look({ src: ART + CAT_STATUE.src, caption: CAT_STATUE.caption }); return;
      case 'oldpc': openPC(st); return;
      case 'goldcup': takeGold(st, ref); return;
      case 'arcade': openPC(st, 'candy'); return;
      case 'arcademines': openPC(st, 'mines'); return;
      case 'pinball': openPC(st, 'pinball'); return;
      case 'aquarium': feedFish(st, ref.at); return;
      case 'monster': case 'monsterbox': takeCan(st); return;
      case 'cat':
        ref.mode = 'sit'; ref.until = performance.now() + 5000; ref.t = 0;
        say(st, ref.name + ': murr!');
        earnPart(st, 'cats', ref.name, 3);
        return;
      case 'switch':
        st.lightsOff[ref.room] = !st.lightsOff[ref.room];
        ref.tex = switchTex(st, !st.lightsOff[ref.room]);
        buildLight(st);
        sfx(st, 'click');
        st.promptKey = '';
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
    var horizon = VIEW_H / 2 + st.pitch;
    if (cy <= horizon + 2) return;
    var dist = (st.z * P) / (cy - horizon), cam = 2 * cx / W - 1;
    var dirX = Math.cos(st.a), dirY = Math.sin(st.a), gx = st.x + dist * (dirX - dirY * FOV * cam), gy = st.y + dist * (dirY + dirX * FOV * cam);
    st.goal = { x: gx, y: gy, stop: 0.2 };
  }

  // Doom's bonus flash: a short gold wash over the picture as you pick something up
  function flash() {
    var el = root && root.querySelector('.mx-doom-flash');
    if (!el || document.documentElement.dataset.motion === 'reduced') return;
    el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');
  }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mouseCaught() { return !!root && document.pointerLockElement === root.querySelector('.mx-doom-view'); }
  function freeMouse() { if (mouseCaught() && document.exitPointerLock) document.exitPointerLock(); }
  // Catch the mouse without a click on the picture: right as the gallery opens
  // (the click that opened it lets the browser do it) and when a view inside is
  // closed with a click. Only with a mouse; never without the person's click.
  function catchMouse() {
    var st = state, view = root && root.querySelector('.mx-doom-view');
    if (!st || st.closed || st.noLock || st.viewing || !view || !view.requestPointerLock || mouseCaught()) return;
    if (!(window.matchMedia && window.matchMedia('(pointer: fine)').matches)) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    try { var asked = view.requestPointerLock(); if (asked && asked.catch) asked.catch(function () {}); } catch (_e) {}
  }

  /* ── Karte ārpus loga ─────────────────────────────────────────────────── */
  // The plan of the hall from above (Doom's automap), beside the game on the
  // dither sky, in its one ink: Bayer dots for the floors (the night rooms
  // denser), solid walls round them, the frames as bars on their walls (a
  // drawing solid, an empty one hollow), the aquarium's water, you and where
  // you look. Shown where there is room beside the window; Tab hides and shows
  // it (with no room, over the picture). The plan is drawn once.
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function mapRoom(st) {
    // the window's own layout box (not its on-screen one: it may be scaling in)
    var map = st.map, sec = root.querySelector('.mx-doom');
    var box = { left: sec.offsetLeft, top: sec.offsetTop, right: sec.offsetLeft + sec.offsetWidth, height: sec.offsetHeight };
    var side = Math.min(box.left, window.innerWidth - box.right) - (root.classList.contains('is-slim') ? 18 : 34);   // its frame and a little sky round it
    var cs = Math.min(12, Math.floor(side / map.w), Math.floor((window.innerHeight - 96 - KEYS_H * 0.5) / map.h));
    return { cs: cs, box: box, outside: cs >= 3 };
  }
  function toggleMap(st) {
    st.mapOn = root.querySelector('.mx-doom-minimap').hidden;
    st.mmBase = null;
    drawMinimap(st);
  }
  function minimapBase(st, cs) {
    var map = st.map, W2 = map.w * cs, H2 = map.h * cs, b = canvas(W2, H2), g = b.getContext('2d');
    var img = g.createImageData(W2, H2), d = new Uint32Array(img.data.buffer), INK = 0xffffffff;
    var cellAt = function (x, y) { return x < 0 || y < 0 || x >= map.w || y >= map.h ? WALL : map.grid[y * map.w + x]; };
    var open = function (c) { return c === EMPTY || c === DOOR; };
    var dot = function (x, y) { if (x >= 0 && y >= 0 && x < W2 && y < H2) d[y * W2 + x] = INK; };
    for (var cy = 0; cy < map.h; cy++) for (var cx = 0; cx < map.w; cx++) {
      var c = cellAt(cx, cy), x0 = cx * cs, y0 = cy * cs, i, j;
      if (c === EMPTY) {
        var level = map.zone[cy * map.w + cx] ? 6 : 3;          // the night rooms a shade denser
        for (j = 0; j < cs; j++) for (i = 0; i < cs; i++) if (BAYER[((y0 + j) & 3) * 4 + ((x0 + i) & 3)] < level) dot(x0 + i, y0 + j);
      } else if (c === DOOR) {
        for (j = 0; j < cs; j++) dot(x0 + (cs >> 1), y0 + j);
      } else if (c === GLASS) {
        for (j = 0; j < cs; j += 2) { dot(x0 + (cs >> 1), y0 + j); }
      } else if (c === PILLAR) {
        var q = Math.max(1, cs >> 2);
        for (j = q; j < cs - q; j++) for (i = q; i < cs - q; i++) dot(x0 + i, y0 + j);
      } else {
        // a wall: a line on each side that meets a room
        if (open(cellAt(cx - 1, cy))) for (j = 0; j < cs; j++) dot(x0, y0 + j);
        if (open(cellAt(cx + 1, cy))) for (j = 0; j < cs; j++) dot(x0 + cs - 1, y0 + j);
        if (open(cellAt(cx, cy - 1))) for (i = 0; i < cs; i++) dot(x0 + i, y0);
        if (open(cellAt(cx, cy + 1))) for (i = 0; i < cs; i++) dot(x0 + i, y0 + cs - 1);
      }
    }
    // the frames: a bar just inside the wall's line, solid with a drawing, hollow when empty
    map.slots.forEach(function (sl) {
      var t = Math.max(2, cs >> 2), x0 = sl.x * cs, y0 = sl.y * cs, along = sl.face === 'e' || sl.face === 'w';
      var bx = sl.face === 'e' ? x0 + cs : sl.face === 'w' ? x0 - t - 1 : x0 + 2;
      var by = sl.face === 's' ? y0 + cs : sl.face === 'n' ? y0 - t - 1 : y0 + 2;
      var bw = along ? t : cs - 4, bh = along ? cs - 4 : t;
      for (var j = 0; j < bh; j++) for (var i = 0; i < bw; i++) {
        var edge = i === 0 || j === 0 || i === bw - 1 || j === bh - 1;
        if (sl.item || sl.plan || edge) dot(bx + i, by + j);
      }
    });
    // the aquarium: its water as waves along the end wall
    var aq = map.aquarium, ay = aq.y * cs - 2;
    for (var x = (aq.cell1 - 2) * cs + 1; x < (aq.cell1 + 1) * cs - 1; x++) dot(x, ay - ((x >> 1) & 1));
    g.putImageData(img, 0, 0);
    return { canvas: b, cs: cs };
  }
  var ICON_PX = 22, iconCache = {};
  function iconMask(kind) {
    if (!iconCache[kind]) {
      var n = ICON_PX, c = canvas(n, n), g = c.getContext('2d', { willReadFrequently: true }), m = n / 22;
      g.scale(m, m);
      var grad = function (x0, y0, x1, y1, a, b) { var gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,' + b + ')'); return gr; };
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (kind === 'close') { g.strokeStyle = grad(3, 3, 19, 19, 1, 0.75); g.lineWidth = 4; g.beginPath(); g.moveTo(5, 5); g.lineTo(17, 17); g.moveTo(17, 5); g.lineTo(5, 17); g.stroke(); }
      else if (kind === 'draw') {                                    // a pencil, point down-left: solid shapes only (no see-through: the dither turns it to grain)
        g.save(); g.translate(12, 10); g.rotate(Math.PI / 4);
        g.fillStyle = '#fff';
        g.fillRect(-3.5, -10, 7, 3.5);                                              // the rubber end
        g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.strokeRect(-2.7, -5.2, 5.4, 10); // the body, drawn as an outline
        g.fillRect(-3.5, -6.2, 7, 1.6);                                             // the metal band
        g.beginPath(); g.moveTo(-3.5, 5); g.lineTo(3.5, 5); g.lineTo(0, 11.5); g.closePath(); g.fill();   // the point
        g.restore();
      } else if (kind === 'all') {                                   // a wall of four pictures
        [[2, 2], [12, 2], [2, 12], [12, 12]].forEach(function (q, i) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.strokeRect(q[0] + 0.75, q[1] + 0.75, 7.5, 7.5); g.fillStyle = grad(q[0], q[1], q[0] + 8, q[1] + 8, 0.25 + i * 0.15, 0.7); g.fillRect(q[0] + 2, q[1] + 2, 5, 5); });
      } else if (kind === 'music' || kind === 'mute') {             // two notes
        g.fillStyle = '#fff';
        g.beginPath(); g.ellipse(6, 17, 3.4, 2.6, -0.4, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(16, 15, 3.4, 2.6, -0.4, 0, Math.PI * 2); g.fill();
        g.fillRect(8.4, 4, 1.8, 13); g.fillRect(18.4, 2, 1.8, 13);
        g.fillStyle = grad(8, 2, 20, 6, 1, 0.7); g.beginPath(); g.moveTo(8.4, 4); g.lineTo(20.2, 2); g.lineTo(20.2, 5.5); g.lineTo(8.4, 7.5); g.closePath(); g.fill();
        if (kind === 'mute') { g.globalCompositeOperation = 'destination-out'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(2, 2); g.lineTo(20, 20); g.stroke(); g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#fff'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(2, 2); g.lineTo(20, 20); g.stroke(); }
      } else if (kind === 'frame') {                                 // a picture: hills and a sun in a frame
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(2, 3.5, 18, 15);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(4, 17); g.lineTo(9, 9.5); g.lineTo(12, 13.5); g.lineTo(15, 9); g.lineTo(18.5, 17); g.closePath(); g.fill();
        g.beginPath(); g.arc(7, 7.5, 1.8, 0, Math.PI * 2); g.fill();
      } else if (kind === 'night') {                                 // the moon and a star
        g.fillStyle = '#fff'; g.beginPath(); g.arc(10, 12, 8, 0, Math.PI * 2); g.fill();
        g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(14.5, 9, 7, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#fff'; g.fillRect(17, 2.5, 2, 6); g.fillRect(15, 4.5, 6, 2);
      } else if (kind === 'cup') {                                   // a cup, its steam
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(3, 9); g.lineTo(15, 9); g.lineTo(14, 19); g.quadraticCurveTo(9, 21, 4, 19); g.closePath(); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(16, 13, 2.8, -Math.PI / 2, Math.PI / 2); g.stroke();
        g.lineWidth = 1.6; g.beginPath(); g.moveTo(6.5, 7); g.quadraticCurveTo(5, 5, 6.5, 2.5); g.moveTo(10.5, 7); g.quadraticCurveTo(9, 5, 10.5, 2.5); g.stroke();
      } else if (kind === 'mouse') {                                 // a computer mouse: its outline, the two buttons, the wheel, the left one lit
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(11, 2); g.bezierCurveTo(17.5, 2, 18, 6, 18, 10); g.lineTo(18, 14); g.bezierCurveTo(18, 19, 15, 21, 11, 21); g.bezierCurveTo(7, 21, 4, 19, 4, 14); g.lineTo(4, 10); g.bezierCurveTo(4, 6, 4.5, 2, 11, 2); g.closePath(); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(10, 3); g.bezierCurveTo(5.5, 3.2, 5, 6, 5, 10); g.lineTo(10, 10); g.closePath(); g.fill();   // the left button, lit
        g.beginPath(); g.moveTo(4, 10.5); g.lineTo(18, 10.5); g.stroke();                                                                          // where the buttons end
        g.beginPath(); g.moveTo(11, 2.5); g.lineTo(11, 10.5); g.stroke();                                                                          // between them
        g.fillRect(10, 5, 2, 3.5);                                                                                                                  // the wheel
      } else if (kind === 'star') {
        var rg = g.createRadialGradient(11, 11, 1, 11, 11, 10); rg.addColorStop(0, '#fff'); rg.addColorStop(1, 'rgba(255,255,255,.45)');
        g.fillStyle = rg; g.beginPath();
        for (var k = 0; k < 10; k++) { var r = k % 2 ? 4.2 : 10, an = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(11 + Math.cos(an) * r, 11.5 + Math.sin(an) * r); }
        g.closePath(); g.fill();
      } else if (kind === 'full') {                                  // the four corners, a picture in between
        g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(2, 7); g.lineTo(2, 2); g.lineTo(7, 2); g.moveTo(15, 2); g.lineTo(20, 2); g.lineTo(20, 7); g.moveTo(20, 15); g.lineTo(20, 20); g.lineTo(15, 20); g.moveTo(7, 20); g.lineTo(2, 20); g.lineTo(2, 15); g.stroke();
        g.fillStyle = grad(6, 6, 16, 16, 0.65, 0.2); g.fillRect(6, 6, 10, 10);
      }
      var img = g.getImageData(0, 0, n, n), d = img.data;
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        var i = (y * n + x) * 4, l = d[i + 3] / 255;
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = l * 16 > B4[(y & 3) * 4 + (x & 3)] + 0.5 ? 255 : 0;
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.putImageData(img, 0, 0);
      var big = canvas(n * 2, n * 2), bg = big.getContext('2d');      // each dot 2×2: crisp at the button's size
      bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, n * 2, n * 2);
      var url = big.toDataURL('image/png');
      iconCache[kind] = '-webkit-mask-image:url(' + url + ');mask-image:url(' + url + ')';
    }
    return iconCache[kind];
  }
  function placeSide() {
    var side = root.querySelector('.mx-doom-side'), sec = root.querySelector('.mx-doom');
    if (!side || !sec) return;
    // the picture keeps its size; the column of buttons is scaled down to the room beside it
    // (and above the bottom edge), and goes over the picture only when even small it does not fit
    side.style.transform = '';
    // a narrow margin (an installed app's window): small keycaps, icons only (the word on hover), a small map
    root.classList.remove('is-slim');
    var roomFor = function () { return Math.min(1, (sec.offsetLeft - 12) / side.offsetWidth, (window.innerHeight - sec.offsetTop - 10) / side.offsetHeight); };
    var fit = roomFor();
    if (fit < 0.8 && sec.offsetLeft >= 50) { root.classList.add('is-slim'); fit = roomFor(); }
    var outside = fit >= 0.45;
    side.classList.toggle('is-inside', !outside);
    var top = outside ? sec.offsetTop : sec.offsetTop + 12;
    var k = outside ? fit : 1;
    side.style.transformOrigin = '0 0';
    side.style.transform = k < 1 ? 'scale(' + k.toFixed(3) + ')' : '';
    side.style.left = Math.round(outside ? (sec.offsetLeft - side.offsetWidth * k) / 2 : sec.offsetLeft + 14) + 'px';
    side.style.top = Math.round(top) + 'px';
  }
  /* stats.js (mrdoob, MIT) made over in the gallery's one ink: the same three
     panels, a click switches them. FPS: pictures drawn a second (a still
     picture is not drawn again: then it falls to 0), MS: how long one took,
     MB: the page's memory (Chrome). A graph of the last 74 readings, the low and
     high beside the number; written twice a second. */
  var STATS = [['FPS', 100], ['MS', 40], ['MB', 0]];
  var stats = { mode: 0, n: 0, at: 0, ms: 0, msN: 0, hist: [[], [], []], lo: [Infinity, Infinity, Infinity], hi: [0, 0, 0] };
  function statsFrame(ms) { stats.n++; stats.ms += ms; stats.msN++; }
  function statsTick(now) {
    if (!stats.at) { stats.at = now; return; }
    if (now - stats.at < 500) return;
    var mem = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0;
    var vals = [stats.n * 1000 / (now - stats.at), stats.msN ? stats.ms / stats.msN : 0, mem];
    stats.n = 0; stats.ms = 0; stats.msN = 0; stats.at = now;
    vals.forEach(function (v, i) {
      stats.hist[i].push(v); if (stats.hist[i].length > 74) stats.hist[i].shift();
      stats.lo[i] = Math.min(stats.lo[i], v); stats.hi[i] = Math.max(stats.hi[i], v);
    });
    drawStats();
  }
  function drawStats() {
    var c = root && root.querySelector('.mx-doom-stats');
    if (!c) return;
    var g = c.getContext('2d'), m = stats.mode, h = stats.hist[m], top = STATS[m][1] || Math.max(64, stats.hi[m] * 1.1);
    var name = STATS[m][0], v = h.length ? h[h.length - 1] : 0, dec = m === 1 ? 1 : 0;
    g.fillStyle = '#1424d6'; g.fillRect(0, 0, 80, 48);
    g.fillStyle = '#ffffff';
    g.font = '700 9px Inter, system-ui, sans-serif'; g.textBaseline = 'top';
    g.fillText(v.toFixed(dec) + ' ' + name + (h.length ? ' (' + stats.lo[m].toFixed(dec) + '-' + stats.hi[m].toFixed(dec) + ')' : ''), 3, 2);
    // the graph: one column a reading, solid ink up to the value, dotted above
    for (var i = 0; i < 74; i++) {
      var val = h[h.length - 74 + i], x = 3 + i, colH = val == null ? 0 : Math.max(1, Math.round(Math.min(1, val / top) * 30));
      for (var y = 0; y < 30; y++) if (y >= 30 - colH || ((x + y) & 3) === 0) g.fillRect(x, 15 + y, 1, 1);
    }
  }
  function statsReset() { stats.at = 0; stats.n = 0; }

  // The keys, under the map beside the window: W A S D and the others as small keycaps, a word each
  var KEYS_H = 236;
  function placeKeys(room, under) {
    var k = root.querySelector('.mx-doom-keys');
    if (!k) return;
    k.hidden = !room.outside;
    if (!room.outside) return;
    // scaled down when the window is too short for it under the map
    k.style.transform = '';
    var sc = Math.min(1, (window.innerHeight - under - 10) / k.offsetHeight, (window.innerWidth - room.box.right - 12) / k.offsetWidth), w = k.offsetWidth * sc;
    if (sc < 0.4) { k.hidden = true; return; }
    k.style.transformOrigin = '0 0'; k.style.transform = sc < 1 ? 'scale(' + sc.toFixed(3) + ')' : '';
    var left = Math.min(window.innerWidth - w - 8, room.box.right + (window.innerWidth - room.box.right - w) / 2);
    k.style.left = Math.round(left) + 'px'; k.style.top = Math.round(under) + 'px';
  }
  function drawMinimap(st) {
    var c = root.querySelector('.mx-doom-minimap');
    if (!c) return;
    var room = mapRoom(st), show = room.outside ? st.mapOn !== false : st.mapOn === true;
    c.hidden = !show;
    if (!show) { placeKeys(room, room.box.top); return; }
    var cs = room.outside ? room.cs : Math.max(3, Math.min(8, Math.floor(room.box.height * 0.6 / st.map.h)));
    if (!st.mmBase || st.mmBase.cs !== cs || st.mmBase.outside !== room.outside) {
      st.mmBase = minimapBase(st, cs);
      st.mmBase.outside = room.outside;
      c.width = st.mmBase.canvas.width; c.height = st.mmBase.canvas.height;
      c.classList.toggle('is-inside', !room.outside);
      // beside the window on the right, its middle at the window's middle; or over the picture
      var frame = room.outside ? (root.classList.contains('is-slim') ? 10 : 24) : 18;   // its padding and border round the plan
      var left = room.outside ? room.box.right + (window.innerWidth - room.box.right - c.width - frame) / 2 : room.box.right - c.width - frame - 14;
      var top = room.outside ? room.box.top : room.box.top + 64;
      c.style.left = Math.round(left) + 'px'; c.style.top = Math.round(top) + 'px';
      placeKeys(room, top + c.height + frame + 16);
    }
    var g = c.getContext('2d'), px0 = st.x * cs, py0 = st.y * cs;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(st.mmBase.canvas, 0, 0);
    // you: where you look as a dotted cone, then a solid dot
    g.fillStyle = '#ffffff';
    var reach = cs * 2.6;
    for (var k = 1; k <= 6; k++) {
      var r = reach * k / 6;
      [-0.42, 0, 0.42].forEach(function (off) { g.fillRect(Math.round(px0 + Math.cos(st.a + off * k / 6) * r), Math.round(py0 + Math.sin(st.a + off * k / 6) * r), 1, 1); });
    }
    g.beginPath(); g.arc(px0, py0, Math.max(2, cs * 0.45), 0, Math.PI * 2); g.fill();
  }

  /* ── Logs ─────────────────────────────────────────────────────────────── */
  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function build() {
    root = document.createElement('div');
    root.id = 'mxDoom';
    root.hidden = true;
    root.innerHTML = '<section class="mx-doom" role="dialog" aria-modal="true" aria-label="Galerija">'
      + '<div class="mx-doom-screen"><canvas class="mx-doom-view"></canvas>'
      + '<div class="mx-doom-msg" hidden></div><div class="mx-doom-flash" aria-hidden="true"></div><canvas class="mx-doom-intro" hidden aria-hidden="true"></canvas>'

      + '<div class="mx-doom-hud">' + hudCell('draw', 'total', 'ZĪMĒJUMI') + hudCell('today', 'today', 'ŠODIEN')
      + '<div class="mx-hud-face"><b data-hud="face"></b><span>TU</span></div>' + hudCell('night', 'sleeping', 'GUĻ')
      + '<div class="mx-hud-cell mx-hud-coffee"><i class="mx-hud-ico" data-ico="cup"></i><div class="mx-hud-num"><b data-hud="drink"></b><span data-hud="drinkSub"></span></div><span class="mx-hud-meter" hidden></span></div></div>'
      + '<button type="button" class="mx-doom-prompt" hidden><kbd></kbd><span></span></button>'
      + '<div class="mx-doom-menu" hidden><div class="mx-doom-menu-card" role="dialog" aria-label="Löfbergs kafijas aparāts">'
      + '<div class="mx-doom-menu-head"><strong>Löfbergs</strong><span>Izvēlies kafiju</span></div><div class="mx-doom-menu-list">'
      + COFFEES.map(function (c, i) { return '<button type="button" data-coffee="' + i + '"><i class="mx-doom-cup">' + pixelIcon(c.cup, CUP_COLORS) + '</i><span>' + c.name + '<small>' + PRICE + '</small></span><kbd>' + (i + 1) + '</kbd></button>'; }).join('')
      + '</div><button type="button" class="mx-doom-menu-cancel">Atpakaļ</button></div></div>'
      + '<div class="mx-doom-look" hidden><figure><img alt=""><figcaption></figcaption></figure>'
      + '<div class="mx-doom-look-actions"><button type="button" class="mx-doom-back">Atpakaļ</button><button type="button" class="mx-doom-redraw">Pārzīmēt</button><button type="button" class="mx-doom-chat">Komentāros</button><a class="mx-doom-more" target="_blank" rel="noopener noreferrer" hidden>Vairāk par darbu</a></div></div>'
      + '<div class="mx-doom-badges" hidden><div class="mx-doom-all-head"><strong>Medaļas</strong><span></span><button type="button" class="mx-doom-badges-close">Atpakaļ</button></div><ul class="mx-doom-badges-list"></ul></div>'
      + '<div class="mx-doom-joy" hidden aria-hidden="true"><i></i></div>'
      + '<div class="mx-doom-all" hidden><div class="mx-doom-all-head"><strong>Visi zīmējumi</strong><span></span><button type="button" class="mx-doom-all-close">Atpakaļ</button></div><div class="mx-doom-all-grid"></div></div>'
      + '</div></section>';
    var mm = document.createElement('canvas');
    mm.className = 'mx-doom-minimap'; mm.hidden = true; mm.setAttribute('aria-hidden', 'true');
    root.appendChild(mm);
    var keys = document.createElement('div');
    keys.className = 'mx-doom-keys'; keys.hidden = true;
    var key = function (k, word) { return '<div class="mx-key-row"><kbd>' + k + '</kbd><span>' + word + '</span></div>'; };
    keys.innerHTML = '<div class="mx-key-wasd"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>iet</span></div>'
      + '<div class="mx-key-row"><kbd class="mx-key-ico"><i class="mx-doom-ico" style="' + iconMask('mouse') + '"></i></kbd><span>skatīties</span></div>'
      + '<div class="mx-key-row mx-key-esc"><kbd>Esc</kbd><span>atlaist peli</span></div>'
      + key('Shift', 'skriet') + key('E', 'darīt') + key('C', 'malks') + key('M', 'mūzika') + key('Tab', 'karte');
    root.appendChild(keys);
    // left of the window on the dither sky: the Esc key (lit while the mouse is
    // caught: it lets it go) and how many pictures a second are drawn
    var side = document.createElement('div');
    side.className = 'mx-doom-side';
    // the buttons as small pictures in the same one ink, a word under each
    var pic = function (cls, kind, label) { return '<button type="button" class="mx-doom-pic ' + cls + '" title="' + label.charAt(0) + label.slice(1).toLowerCase() + '"><i class="mx-doom-ico" style="' + iconMask(kind) + '"></i><span>' + label + '</span></button>'; };
    side.innerHTML = pic('mx-doom-close', 'close', 'Iziet')
      + '<canvas class="mx-doom-stats" width="80" height="48" aria-label="FPS, MS, MB"></canvas>'
      + pic('mx-doom-draw', 'draw', 'Zīmēt')
      + pic('mx-doom-all-btn', 'all', 'Zīmējumi')
      + '<button type="button" class="mx-doom-pic mx-doom-music"><i class="mx-doom-ico is-on" style="' + iconMask('music') + '"></i><i class="mx-doom-ico is-off" style="' + iconMask('mute') + '"></i><span>Mūzika</span></button>'
      + '<button type="button" class="mx-doom-pic mx-doom-badges-btn"><i class="mx-doom-ico" style="' + iconMask('star') + '"></i><span>Medaļas</span><b></b></button>'
      + pic('mx-doom-full', 'full', 'Pilnekrāns');
    root.appendChild(side);
    document.body.appendChild(root);
    root.addEventListener('click', function (e) {
      var st = state;
      // a button clicked keeps no focus: Space would press it again (the menu keeps it, for the keys)
      var btn = e.target.closest && e.target.closest('button');
      if (btn && !btn.closest('.mx-doom-menu')) setTimeout(function () { btn.blur(); }, 0);
      // only × or Esc leave the game: a click beside it does nothing
      if (e.target.closest('.mx-doom-close')) { close(); return; }
      if (!st) return;
      if (e.target.closest('.mx-doom-draw')) { if (st.onDraw) st.onDraw({}); return; }
      if (e.target.closest('.mx-doom-music')) { setMusic(st, !st.musicOn); return; }
      if (e.target.closest('.mx-doom-back')) { look(null); catchMouse(); return; }
      if (e.target.closest('.mx-doom-redraw')) { var spec = st.lookSpec; if (spec && spec.redraw && st.onDraw) st.onDraw(spec.redraw); return; }
      if (e.target.closest('.mx-doom-all-btn')) { if (st.onAll) st.onAll(e.target.closest('.mx-doom-all-btn')); else showAll(true); return; }
      if (e.target.closest('.mx-doom-all-close')) { showAll(false); catchMouse(); return; }
      if (e.target.closest('.mx-doom-stats')) { stats.mode = (stats.mode + 1) % STATS.length; drawStats(); return; }
      if (e.target.closest('.mx-doom-badges-btn')) { showBadges(root.querySelector('.mx-doom-badges').hidden); return; }
      if (e.target.closest('.mx-doom-badges-close')) { showBadges(false); catchMouse(); return; }
      if (e.target.closest('.mx-doom-full')) {
        if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen().catch(function () {}); }
        else if (root.requestFullscreen) root.requestFullscreen().then(catchMouse, function () {});
        return;
      }
      var tile = e.target.closest('[data-all]');
      if (tile) { var it = st.items[+tile.dataset.all]; if (it) look(lookSpecFor(st, it, null)); return; }
      if (e.target.closest('.mx-doom-chat')) { var cb = st.onComments; close(); if (cb) cb(); return; }
      var pick = e.target.closest('[data-coffee]');
      if (pick) { brew(st, +pick.dataset.coffee); catchMouse(); return; }
      if (e.target.closest('.mx-doom-menu-cancel') || e.target.classList.contains('mx-doom-menu')) { menu(false); catchMouse(); return; }
      if (e.target.closest('.mx-doom-prompt')) { if (st.aim) interact(st.aim); else if (st.seated) standUp(st); }
    });
    var view = root.querySelector('.mx-doom-view');
    var drag = null;
    var toCanvas = function (e) { var r = view.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * VIEW_H]; };
    /* The mouse as in a game (Pointer Lock): a click on the picture catches it,
       moving it turns the view and looks up and down, a click uses what the
       crosshair rests on; Esc lets it go. Touch, and a browser that refuses
       the lock, keep the old way: drag to look, tap to walk or use. */
    view.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // a phone: a thumb on the bottom left of the picture is a stick to walk with
    var joyEl = root.querySelector('.mx-doom-joy');
    var joyMove = function (e) {
      var st = state, j = st && st.joy;
      if (!j) return;
      var dx = (e.clientX - j.cx) / 48, dy = (e.clientY - j.cy) / 48, l = Math.hypot(dx, dy);
      if (l > 1) { dx /= l; dy /= l; }
      j.x = dx; j.y = dy;
      joyEl.firstChild.style.transform = 'translate(' + (dx * 30).toFixed(1) + 'px,' + (dy * 30).toFixed(1) + 'px)';
    };
    var joyEnd = function (e) {
      var st = state;
      if (!st || !st.joy || e.pointerId !== st.joy.id) return false;
      st.joy = null; joyEl.hidden = true; joyEl.firstChild.style.transform = '';
      return true;
    };
    view.addEventListener('pointerdown', function (e) {
      var st = state;
      if (st && st.musicBlocked && st.musicOn) { st.musicBlocked = false; musicStart(); }
      // the mouse caught (as in a shooter): the left button uses what the crosshair is on, or
      // with nothing there takes a sip of what is in your hand; the right button always sips
      if (mouseCaught() && st) {
        if (e.button === 2) { sip(st); return; }
        if (e.button) return;
        if (st.aim) interact(st.aim); else if (st.cup && !st.cup.outAt) sip(st); else if (st.seated) standUp(st);
        return;
      }
      if (e.button) return;                                      // only the main button
      if (e.pointerType === 'touch' && st && !st.joy) {
        var vr = view.getBoundingClientRect(), sr = root.querySelector('.mx-doom-screen').getBoundingClientRect();
        if (e.clientX - vr.left < vr.width * 0.4 && e.clientY - vr.top > vr.height * 0.45) {
          st.joy = { id: e.pointerId, cx: e.clientX, cy: e.clientY, x: 0, y: 0 };
          joyEl.style.left = (e.clientX - sr.left) + 'px'; joyEl.style.top = (e.clientY - sr.top) + 'px';
          joyEl.hidden = false;
          view.setPointerCapture(e.pointerId);
          return;
        }
      }
      // Dragging always turns the view; with a mouse the press also asks to catch
      // it. A browser that says no (or not yet: right after Esc Chrome waits a
      // second) leaves the drag working, so the view never stands still.
      drag = { x: e.clientX, y: e.clientY, moved: false, catching: false };
      view.setPointerCapture(e.pointerId);
      if (e.pointerType === 'mouse' && st && !st.noLock && view.requestPointerLock) {
        drag.catching = true;
        try {
          var asked = view.requestPointerLock();
          if (asked && asked.catch) asked.catch(function () { if (drag) drag.catching = false; });
        } catch (_e) { drag.catching = false; }
      }
    });
    document.addEventListener('pointerlockerror', function () { if (drag) drag.catching = false; if (state) state.lockFails = (state.lockFails || 0) + 1; if (state && state.lockFails >= 3) state.noLock = true; });
    ['pointercancel', 'lostpointercapture'].forEach(function (type) { view.addEventListener(type, function (e) { if (joyEnd(e)) return; if (!mouseCaught()) drag = null; }); });
    document.addEventListener('mousemove', function (e) {
      var st = state;
      if (!st || !mouseCaught()) return;
      var mx = e.movementX || 0, my = e.movementY || 0;
      if (Math.abs(mx) > 300 || Math.abs(my) > 300) return;    // the first event after catching can jump
      st.dragTurn += mx * LOOK;
      st.dPitch -= my * LOOK * P;
      st.goal = null;
    });
    document.addEventListener('pointerlockchange', function () {
      var on = mouseCaught();
      if (on && state) state.lockFails = 0;
      root.querySelector('.mx-doom-keys').classList.toggle('is-caught', on);
      view.classList.toggle('is-caught', on);
      if (!on && state) state.mouseFreedAt = performance.now();
    });
    view.addEventListener('pointermove', function (e) {
      if (!state) return;
      if (state.joy && e.pointerId === state.joy.id) { joyMove(e); return; }
      if (!drag) {                                               // a hand over things you can use
        var p = toCanvas(e), x = Math.max(0, Math.min(W - 1, p[0] | 0)), ref = state.pickRef[x];
        var over = ref && p[1] >= state.pickY0[x] && p[1] <= state.pickY1[x];
        view.classList.toggle('is-over', !!over);
        return;
      }
      if (mouseCaught()) return;                                  // caught: the movement turns it (below)
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
      drag.x = e.clientX; drag.y = e.clientY;
      if (drag.moved) { state.dragTurn += dx * 0.0055; state.dPitch -= dy * 0.0055 * P * VIEW_H / (view.getBoundingClientRect().height || VIEW_H); state.goal = null; }
    });
    view.addEventListener('pointerup', function (e) {
      if (joyEnd(e)) return;
      var was = drag;
      drag = null;
      // the click that caught the mouse does nothing more
      if (!was || was.moved || !state || was.catching || mouseCaught()) return;
      var p = toCanvas(e);
      clickAt(state, p[0], p[1]);
    });
    window.addEventListener('keydown', function (e) {
      var st = state;
      if (!st || st.closed || root.hidden) return;
      if (document.querySelector('.mk-draw-overlay, .gp-root, .pc98-root') || st.paused) return;      // the editor or the hall of fame is on top
      if (st.musicBlocked && st.musicOn) { st.musicBlocked = false; musicStart(); }
      var menuOpen = !root.querySelector('.mx-doom-menu').hidden;
      // Esc lets the mouse go and closes what is open inside; the gallery itself
      // closes only with × (the Esc that freed the mouse does nothing more)
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (mouseCaught()) { freeMouse(); return; }
        if (st.mouseFreedAt && performance.now() - st.mouseFreedAt < 300) return;
        closeInside();
        return;
      }
      if (e.code === 'Tab') { e.preventDefault(); toggleMap(st); return; }
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
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (state && !state.closed) { setSize(state); render(state); } }, 160);
    });
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
    if (it.classic) return { src: it.url, caption: LEONARDO + ', ' + it.title + ' (' + it.year + ')', more: MORE[it.id] ? WIKI + MORE[it.id] : '' };
    var mine = st.items.some(function (o) { return o.parent && o.parent === it.key; });
    return {
      src: it.url,
      caption: (it.name ? '„' + it.name + '”, ' : '') + (it.authorEmoji ? it.authorEmoji + ' ' : '') + (it.authorName || 'Anonīms') + ', ' + st.dayTitle(it.day).toLowerCase() + (mine ? ' (pārzīmēts, rāmī ir jaunais)' : ''),
      chat: true,
      redraw: it.key && it.url && !/^data:/.test(it.url) ? { over: it.key, base: it.url, slot: ref ? ref.key : '', day: it.day } : null
    };
  }
  // every drawing, the covered ones too, newest first
  function showAll(show) {
    var st = state, box = root.querySelector('.mx-doom-all');
    if (!st) return;
    if (show) freeMouse();
    box.hidden = !show;
    st.viewing = show || !root.querySelector('.mx-doom-look').hidden;
    st.keys = {};
    st.dirty = true;
    if (!show) return;
    var grid = box.querySelector('.mx-doom-all-grid'), n = st.items.length;
    box.querySelector('.mx-doom-all-head span').textContent = n ? n + (n % 10 === 1 && n % 100 !== 11 ? ' zīmējums' : ' zīmējumi') : '';
    grid.innerHTML = n ? st.items.map(function (it, i) {
      return '<button type="button" class="mx-doom-all-tile" data-all="' + i + '"><img alt="" loading="lazy" decoding="async" src="' + String(it.url).replace(/"/g, '&quot;') + '">'
        + '<span>' + esc(it.authorEmoji || '') + ' ' + esc(st.dayTitle(it.day)) + '</span></button>';
    }).join('') : '<p class="mx-doom-all-empty">Vēl nav neviena zīmējuma. Uzzīmē pirmo!</p>';
  }
  function menu(show) {
    var st = state, box = root.querySelector('.mx-doom-menu');
    if (show) freeMouse();
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
    freeMouse();
    st.lookSpec = spec;
    box.querySelector('img').src = spec.src;
    box.querySelector('figcaption').textContent = spec.caption;
    box.querySelector('.mx-doom-chat').hidden = !spec.chat;
    box.querySelector('.mx-doom-redraw').hidden = !spec.redraw;
    var more = box.querySelector('.mx-doom-more');
    more.hidden = !spec.more;
    if (spec.more) more.href = spec.more; else more.removeAttribute('href');
    st.keys = {};
  }
  function loadArt(st, slot) {
    var key = slot.x + ',' + slot.y + ',' + slot.face, base = slot.night ? st.tex.nightWallCanvas : st.tex.plasterCanvas;
    var rec = { isArt: true, key: key, idx: slot.idx, day: slot.day, item: slot.item || null, empty: !!slot.empty, plan: !!slot.plan, reach: 3.4 };
    rec.tex = wallTex(slot.plan ? framedCanvas(planCanvas(st), base, false) : framedCanvas(null, base, !!slot.empty));
    st.artAt[(slot.y * st.map.w + slot.x) * 4 + FACES[slot.face]] = rec;
    if (!slot.item) return;
    var cacheKey = slot.item.url + (slot.night ? '|n' : '');
    if (st.artTex[cacheKey]) { rec.tex = st.artTex[cacheKey]; return; }     // already framed (a rebuild): no empty frame meanwhile
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = function () {
      if (st.closed) return;
      try { rec.tex = st.artTex[cacheKey] = wallTex(framedCanvas(img, base, false)); } catch (_e) {}   // a picture from a host without CORS stays an empty frame
      st.dirty = true;
    };
    img.src = slot.item.url;
  }
  // The widest picture: 800 on a strong computer, else 640 (the slow-machine
  // check lowers it further, and raises it again when frames are cheap).
  // one width for every computer (the same picture everywhere, fast on the weak work PCs too);
  // only a frame over 14 ms lowers it for that computer, so a slow moment never sticks
  function maxWidth() { return 800; }
  function savedCap() {
    var cap = 0;
    try { cap = +localStorage.getItem(QUALITY_KEY) || 0; } catch (_e) {}
    return Math.max(320, Math.min(maxWidth(), cap || maxWidth()));
  }
  // The picture is shown a whole number of screen pixels per picture pixel
  // (2× on most screens): every pixel column as wide as the next, so nothing
  // shimmers while you turn. The width is the most that fits at that scale.
  function fitWidth(cap) {
    var screen = root.querySelector('.mx-doom-screen'), dpr = window.devicePixelRatio || 1;
    var avail = (screen && screen.clientWidth) || Math.min(window.innerWidth * 0.96 - 32, 1280);
    var dev = Math.max(320, Math.floor(avail * dpr)), k = Math.max(1, Math.ceil(dev / cap));
    return { w: Math.max(256, Math.floor(dev / k / 8) * 8), k: k, dpr: dpr };
  }
  function setSize(st) {
    var fit = fitWidth(st.cap || savedCap());
    W = fit.w; VIEW_H = Math.round(W * 269 / 512); P = W / (2 * FOV);
    st.pitch = Math.max(-VIEW_H * PITCH_MAX, Math.min(VIEW_H * PITCH_MAX, st.pitch || 0));
    var view = root.querySelector('.mx-doom-view');
    view.width = W; view.height = VIEW_H;
    view.style.width = (W * fit.k / fit.dpr) + 'px';
    view.style.height = (VIEW_H * fit.k / fit.dpr) + 'px';
    st.mmBase = null;
    placeSide();
    st.ctx = view.getContext('2d', { alpha: false });
    st.img = st.ctx.createImageData(W, VIEW_H);
    st.buf = new Uint32Array(st.img.data.buffer);
    ['zbuf', 'glassCols', 'glassX', 'cross', 'pickDist', 'pickWX', 'pickWY'].forEach(function (k) { st[k] = new Float32Array(W); });
    st.glassSide = new Uint8Array(W);
    st.wallTop = new Int32Array(W); st.wallBot = new Int32Array(W); st.pickY0 = new Int32Array(W); st.pickY1 = new Int32Array(W);
    st.pickRef = new Array(W).fill(null);
    st.pdepth = new Float32Array(W * VIEW_H).fill(1e9);
    if (st.intro) introEnd(st);
    st.rowDist = new Float32Array(VIEW_H); st.rowOwn = new Uint32Array(VIEW_H); st.rowOther = new Uint32Array(VIEW_H);
    if (st.cup) st.cup.canvas = handCanvas(st.cup.kind);
    drawHud(st);
    st.dirty = true;
  }
  // cats and the statue: loaded once, kept for the next visit
  var catImg = null, bustImg = null, catStatue = null;
  // the statue's mesh in the parts' triangles (local a, b, z; its front +a), once both files are in
  function catStatueMesh(m, img) {
    var tex = texOf(imgCanvas(img)), q = 1 / m.q, uq = 1 / m.uq, tris = [];
    for (var i = 0; i < m.f.length; i += 3) {
      var v = [], uv = [];
      for (var k = 0; k < 3; k++) { var j = m.f[i + k]; v.push([m.v[j * 3] * q, m.v[j * 3 + 1] * q, m.v[j * 3 + 2] * q]); uv.push([m.t[j * 2] * uq, m.t[j * 2 + 1] * uq]); }
      var n = [m.n[i] / 127, m.n[i + 1] / 127, m.n[i + 2] / 127], l = Math.hypot(n[0], n[1], n[2]) || 1;
      tris.push({ v: v, uv: uv, tex: tex, col: 0, n: [n[0] / l, n[1] / l, n[2] / l], soft: 0.12, two: false });
    }
    return { tris: tris, bills: [] };
  }
  // the old computer's Windows 98 (js/page/mood-gallery-pc.js), loaded the first time it is switched on
  var PC_SRC = 'js/page/mood-gallery-pc.js?v=20261005pb2', pcLoad = null;
  function openPC(st, app) {
    freeMouse();
    if (!pcLoad) pcLoad = new Promise(function (ok, no) {
      if (window.MinkaGalleryPC) { ok(); return; }
      var sc = document.createElement('script'); sc.src = PC_SRC; sc.onload = ok; sc.onerror = function () { pcLoad = null; no(); }; document.head.appendChild(sc);
    });
    pcLoad.then(function () {
      if (state !== st || !window.MinkaGalleryPC) return;
      // the hall's music stops while the computer is on (it has its own sounds), and comes back after
      var wasOn = !!(audio && !audio.paused);
      if (wasOn) audio.pause();
      window.MinkaGalleryPC.open({ me: st.me, app: app || '', solo: !!app, music: MUSIC.map(function (m) { return { title: m.title, src: ART + 'music/' + m.file + MUSIC_V }; }), onClose: function () {
        if (wasOn && state === st && st.musicOn && audio) { var pl = audio.play(); if (pl && pl.catch) pl.catch(function () {}); }
      } });
      earn(st, 'pc');
    }, function () { say(st, 'Dators neieslēdzās. Pamēģini vēlreiz.'); });
  }
  function catStatueOn(p) {
    p.facing = -Math.PI / 2;                                         // its front to the lobby
    p.radius = 0.4;
    if (catStatue && catStatue.mesh) p.mesh = catStatue.mesh;
    return SHADOW_ONLY;
  }
  function imgCanvas(img) { var c = canvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); return c; }
  function loadImage(src, done) { var img = new Image(); img.decoding = 'async'; img.onload = function () { done(img); }; img.src = src; return img; }
  function open(opts, keep) {
    if (!root) build();
    if (!luts) makeLuts();
    var origin = opts.origin;
    if (state) close(true, !!keep);
    var items = (opts.items || []).slice(), sleepers = (opts.sleepers || []).slice();
    var map = buildMap(items, opts.today, opts.slotMap || {});
    // a rebuild (new drawings) keeps what was already made: the textures, the pictures, the aquarium
    var plasterC = keep && keep.tex ? keep.tex.plasterCanvas : plasterCanvas(), nightWallC = keep && keep.tex ? keep.tex.nightWallCanvas : nightWallCanvas();
    map.doors.forEach(function (d) { d.tex = wallTex(doorCanvas(d.label)); });
    // who sleeps in which bed (the night panel's arrangement; else in turn)
    var bedPeople = [null, null, null, null], rest = [];
    sleepers.forEach(function (p) { if (p.bed >= 0 && p.bed < 4 && !bedPeople[p.bed]) bedPeople[p.bed] = p; else rest.push(p); });
    rest.forEach(function (p) { var i = bedPeople.indexOf(null); if (i >= 0) bedPeople[i] = p; });
    var props = BED_SPOTS.map(function (s, i) {
      return { kind: 'bed', bed: i, x: s[0], y: s[1], h: 0.5, solid: 0.42, reach: 2.8, shade: 0.3, person: bedPeople[i] };
    });
    // the Konfektes 98 arcade machine at the Leonardo hall's start, seen as you come in from the lobby
    props.push({ kind: 'arcade', x: 1.36, y: LEO_Y0 + 0.62, h: 0.94, solid: 0.3, reach: 2.6, shade: 0.2 });
    // beside it, smaller, Mīnas 98's cabinet; Pinbols 98 in the far right corner, past the aquarium's end and the last pillar
    props.push({ kind: 'arcademines', x: 1.3, y: LEO_Y0 + 0.1, h: 0.73, solid: 0.24, reach: 2.4, shade: 0.16 });
    props.push({ kind: 'pinball', x: 5.5, y: map.h - 1.55, h: 0.81, solid: 0.28, reach: 2.4, shade: 0.2 });
    // the old computer on its desk in the lobby's corner, turned to the room
    props.push({ kind: 'oldpc', x: 4.62, y: 1.42, h: 0.66, solid: 0.38, reach: 2.6, shade: 0.22 });
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
    // the cats' monument in the middle of the hall, between the pillars at the Leonardo hall's end
    props.push({ kind: 'catstatue', x: 3.5, y: LEO_Y1 + 1.5, h: 0.62, solid: 0.36, reach: 2.6, shade: 0.24 });
    var gold = goldSpot(map, props, opts.today);
    if (gold) props.push({ kind: 'goldcup', x: gold[0], y: gold[1], h: 0.14, reach: 1.8, shade: 0.06 });
    var cats = CATS.map(function (c, i) {
      var way = CAT_WAYS[c[2]][(i * 3) % CAT_WAYS[c[2]].length];
      return { kind: 'cat', name: c[0], coat: c[1], room: c[2], x: way[0], y: way[1], h: CAT_H, reach: 2.2, shade: 0.07, vx: 1, vy: 0, mode: 'sit', until: performance.now() + 800 + i * 900, t: i, flip: i === 1 };
    });
    props = props.concat(cats);
    var st = state = {
      map: map, x: 4.3, y: 4.55, a: -2.75, z: EYE, keys: {}, dragTurn: 0, walk: 0, sips: 0, sip: 0, seated: false,
      pitch: 0, dPitch: 0, vx: 0, vy: 0, cap: 0, mapOn: null, mmBase: null, msgShown: false, mouseFreedAt: 0, noLock: false,
      artAt: new Array(map.w * map.h * 4), aim: null, dirty: true, closed: false, frames: 0, cost: 0, loweredAt: -99, drawnAt: 0,
      props: props, cats: cats, catFrames: null, cup: null, brew: null, goal: null, promptKey: '',
      aqua: null, aquaSeen: true,
      musicOn: false, today: opts.today, sleepers: sleepers, bedPeople: bedPeople, items: items,
      me: opts.me || {},
      stats: Object.assign({ total: items.length, days: map.segs.length - 1, sleeping: sleepers.length, coffee: '', comments: '' }, opts.stats || {}),
      // the editor and the other windows need the mouse: it is let go first
      onDraw: opts.onDraw && function (info) { freeMouse(); opts.onDraw(info); },
      onComments: opts.onComments, onAll: opts.onAll && function (from) { freeMouse(); opts.onAll(from); },
      dayTitle: opts.dayTitle || function (d) { return d; },
      tex: keep && keep.tex ? keep.tex : {
        plaster: wallTex(plasterC), plasterCanvas: plasterC, stone: wallTex(stoneCanvas()), jamb: wallTex(jambCanvas()), marble: wallTex(marbleCanvas()),
        nightWall: wallTex(nightWallC), nightWallCanvas: nightWallC, glass: wallTex(glassCanvas()),
        floor: wallTex(floorCanvas()), ceil: wallTex(ceilCanvas()), nightFloor: wallTex(nightFloorCanvas()), nightCeil: wallTex(nightCeilCanvas())
      },
      artTex: keep && keep.artTex || {},
      seg: null, originEl: origin || null
    };
    // which way each thing faces (the map runs y down): the chairs the table, the
    // machine, the easel and the gramophone the room, the beds their foot to the room
    var FACING = { machine: 0, easel: 0, gramophone: Math.PI / 4, monsterbox: -Math.PI / 4, table: 0, oldpc: Math.PI * 0.72, goldcup: 0.6, arcade: 0, arcademines: 0, pinball: Math.PI };
    var bedFacing = [Math.PI / 2, Math.PI / 2, -Math.PI / 2, Math.PI];
    var makeSprites = function () {
      props.forEach(function (p) {
        if (p.kind === 'cat') return;
        var model = p.kind === 'machine' ? function () { return machineModel(!!st.brew); }
          : p.kind === 'gramophone' ? function () { return gramophoneModel(st.musicOn); }
          : p.kind === 'easel' ? easelModel : p.kind === 'chair' ? chairModel : p.kind === 'monsterbox' ? monsterBoxModel
          : p.kind === 'bed' ? function () { return bedModel(p.person); } : p.kind === 'table' && isBaked('table') ? function () { return []; }
          : p.kind === 'oldpc' ? oldpcModel : p.kind === 'goldcup' ? goldcupModel : p.kind === 'arcade' ? arcadeModel : p.kind === 'arcademines' ? arcadeMinesModel : p.kind === 'pinball' ? pinballModel : null;
        if (model) {
          p.facing = p.kind === 'chair' ? (p.x < 3.1 ? 0 : Math.PI) : p.kind === 'bed' ? bedFacing[p.bed] : FACING[p.kind];
          p.parts = model();
          p.mesh = propMesh(p, p.parts);
          p.spr = SHADOW_ONLY;
          p.radius = p.kind === 'bed' ? 0.6 : p.kind === 'chair' ? 0.25 : 0.45;
          return;
        }
        p.spr = p.kind === 'bed' ? bedSprite(p.person) : p.kind === 'table' ? tableSprite(st.seated) : p.kind === 'chair' ? chairSprite()
          : p.kind === 'easel' ? easelSprite() : p.kind === 'gramophone' ? gramophoneSprite(st.musicOn)
          : p.kind === 'machine' ? machineSprite(!!st.brew)
          : p.kind === 'monsterbox' ? (held.monsterBox ? makeSprite(imgCanvas(held.monsterBox)) : monsterBoxSprite())
          : p.kind === 'monster' ? (held.monsterCan ? makeSprite(imgCanvas(held.monsterCan)) : monsterCanSprite())
          : p.kind === 'catstatue' ? catStatueOn(p)
          : statueSprite(bustImg && bustImg.complete ? bustImg : null);
      });
    };
    root.hidden = false;
    if (!keep) {
      if (window.MinkaDitherBackdrop) window.MinkaDitherBackdrop.attach(root, { box: root.querySelector('.mx-doom') });
      hudIcons();
    }
    st.cap = savedCap();
    setSize(st);
    if (keep) {
      Object.assign(st, { x: keep.x, y: keep.y, a: keep.a, z: keep.z, pitch: keep.pitch || 0, sips: keep.sips, cup: keep.cup, seated: keep.seated, musicOn: keep.musicOn, mapOn: keep.mapOn, originEl: keep.origin });
      if (st.cup) st.cup.canvas = handCanvas(st.cup.kind);
    } else {
      st.musicOn = musicWanted();
      if (st.musicOn) musicStart();
    }
    makeSprites();
    if (st.seated) sitDown(st, props.find(function (p) { return p.kind === 'chair' && Math.hypot(p.x - st.x, p.y - st.y) < 0.05; }) || props.find(function (p) { return p.kind === 'table'; }));
    map.slots.forEach(function (slot) { loadArt(st, slot); });
    // the aquarium's three cells of the end wall (their faces towards the hall)
    st.aqua = keep && keep.aqua ? keep.aqua : makeAquarium(st, map.aquarium);
    st.aqua.rect = map.aquarium;
    st.lightsOff = keep && keep.lightsOff || {};
    [['main', 6, 5], ['nmp', 6, 9]].forEach(function (sw) {
      st.artAt[(sw[2] * map.w + sw[1]) * 4 + FACES.e] = { kind: 'switch', room: sw[0], reach: 2.2, tex: switchTex(st, !st.lightsOff[sw[0]]) };
    });
    st.aqua.cells.forEach(function (tex, i) {
      st.artAt[(map.aquarium.y * map.w + map.aquarium.cell1 - i) * 4 + FACES.n] = { kind: 'aquarium', aquarium: true, reach: 2.6, tex: tex, at: 0 };
    });
    paintAquarium(st.aqua);
    buildLight(st);
    paintMusic();
    paintBadges();
    drawHud(st);
    if (keep && keep.catFrames) st.catFrames = keep.catFrames;
    if (!keep) say(st, props.some(function (p) { return p.kind === 'goldcup'; })
      ? 'Laipni lūgti galerijā! Šodien kaut kur zālē paslēpta zelta krūzīte'
      : 'Laipni lūgti galerijā! Pa kreisi Löfbergs kafija, pa labi durvis uz Nakts istabu');
    // the cats and the statue (cached by the browser and kept here after the first visit)
    var withCats = function (img) { if (state !== st) return; st.catFrames = catFrames(img); updateCats(st, 0, performance.now()); st.dirty = true; };
    if (catImg && catImg.complete && catImg.naturalWidth) withCats(catImg); else catImg = loadImage(ART + 'cats.webp' + CAT_V, withCats);
    var withBust = function (img) { if (state !== st) return; var p = props.find(function (q) { return q.kind === 'statue'; }); p.spr = statueSprite(img); st.dirty = true; };
    if (!(bustImg && bustImg.complete && bustImg.naturalWidth)) bustImg = loadImage(ART + 'venus-milo.webp' + ART_V, withBust);
    Object.keys(BAKED_KINDS).forEach(function (kind) {
      loadBaked(kind, function () {
        if (state !== st) return;
        var make = { machine: function () { return machineModel(!!st.brew); }, chair: chairModel, easel: easelModel, gramophone: function () { return gramophoneModel(st.musicOn); },
          monsterbox: monsterBoxModel, table: function () { return []; }, oldpc: oldpcModel, arcade: arcadeModel, arcademines: arcadeMinesModel, pinball: pinballModel };
        st.props.forEach(function (p) {
          if (p.kind !== kind) return;
          if (kind === 'bed') { var pp = p; remodel(p, function () { return bedModel(pp.person); }); return; }
          if (p.facing == null) p.facing = 0;
          if (!p.radius) p.radius = kind === 'table' ? 0.3 : 0.45;
          p.spr = SHADOW_ONLY;
          remodel(p, make[kind]);
        });
      });
    });
    if (!catStatue) {
      catStatue = {};
      Promise.all([fetch(ART + CAT_STATUE.mesh).then(function (r) { return r.json(); }), new Promise(function (ok, no) { var im = loadImage(ART + CAT_STATUE.tex, ok); im.onerror = no; })])
        .then(function (got) {
          catStatue.mesh = catStatueMesh(got[0], got[1]);
          if (state) { var p = state.props.find(function (q) { return q.kind === 'catstatue'; }); if (p) { catStatueOn(p); state.dirty = true; } }
        }, function () { catStatue = null; });
    }
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
    if (!keep && document.documentElement.dataset.motion !== 'reduced' && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      render(st);
      st.intro = { base: new Uint32Array(st.buf) };
      introStep(st, performance.now());
    }
    st.raf = requestAnimationFrame(frame);
    if (!keep) { catchMouse(); statsReset(); drawStats(); audioCtx(); }
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
    if (!keepMusic) freeMouse();                          // a rebuild (new drawings) keeps the caught mouse
    cancelAnimationFrame(st.raf);
    root.querySelector('.mx-doom-msg').hidden = true;
    introEnd(st);
    if (!keepMusic) root.querySelector('.mx-doom-minimap').hidden = true;
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
      w: W, x: st.x, y: st.y, a: st.a, z: st.z, pitch: st.pitch, tex: st.tex, artTex: st.artTex, aqua: st.aqua, catFrames: st.catFrames, lightsOff: st.lightsOff, sips: st.sips, cup: st.cup, seated: st.seated, musicOn: st.musicOn, mapOn: st.mapOn, origin: st.originEl
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
    var gold = st.props.find(function (p) { return p.kind === 'goldcup' && !p.hidden; });
    return { seated: st.seated, music: st.musicOn, z: +st.z.toFixed(2), cup: st.cup && st.cup.kind.name, left: st.cup && st.cup.left, brewing: !!st.brew, viewing: !!st.viewing, gold: gold ? [+gold.x.toFixed(2), +gold.y.toFixed(2)] : null };
  }
  window.MinkaGallery3D = {
    open: function (opts) { open(opts, null); }, close: function () { close(); }, refresh: refresh, bench: bench, pose: pose, act: act,
    isOpen: function () { return !!state; },
    // another window on top (the hall of fame): the game waits, its keys too
    pause: function (on) { if (state) { state.paused = !!on; state.keys = {}; state.dirty = true; } },
    music: function () { return audio ? { src: audio.getAttribute('src'), paused: audio.paused, volume: +audio.volume.toFixed(2), time: +audio.currentTime.toFixed(1) } : null; }
  };
})();
