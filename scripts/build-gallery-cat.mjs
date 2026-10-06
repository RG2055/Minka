#!/usr/bin/env node
// Špricētājs, the gallery's black cat from Majid Manzarpour's procedural cat (three.js Procedural
// Animals, MIT: https://github.com/majidmanzarpour/threejs-procedural-animals), drawn as Doom drew its
// monsters: every frame seen from 8 sides (0 = its face, then round by its left side, 45° a step), so
// it looks right whichever way it walks. Rows walk (one stride), sit, groom (one lick and wipe);
// 8 frames each. Rendered on a green key with the library's own test studio, one framing for every
// frame (one size), and put in the cats' atlas by scripts/build-gallery-cat.py (the other cats are
// the Nakts cats' own sheets).
//
//   git clone https://github.com/majidmanzarpour/threejs-procedural-animals LIB && (cd LIB && npm install)
//   node scripts/build-gallery-cat.mjs LIB
//   python3 scripts/build-gallery-cat.py
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const COATS = [['black', 2]];
const LIB = path.resolve(process.argv[2] || die('the library checkout?'));
const OUT = path.join(os.tmpdir(), 'minka-cat-frames');
const { launchPage, openHarness, evalT, writeDataUrl, mkdirp } = await import(pathToFileURL(path.join(LIB, 'tools/lib/common.mjs')).href);
function die(m) { console.error(m); process.exit(2); }

fs.rmSync(OUT, { recursive: true, force: true });
mkdirp(OUT);
const W = 512, H = 384, VIEW = { elevation: 14, fov: 16, fit: 1.5 };
const meta = [];
const ctx = await launchPage({ width: W, height: H });
try {
  await openHarness(ctx, { rebuild: true });
  for (const [ci, [variant, seed]] of COATS.entries()) {
    await evalT(ctx, (o) => window.__animals.spawn(o), { species: 'cat', seed, quality: 'high', variant, terrain: 'flat' }, 300000, 'spawn');
    // each step of the animal shot from the 8 sides before it moves on
    const run = (row) => evalT(ctx, async ({ row, W, H, VIEW }) => {
      const B = window.__animals, a = B.H.animal, T3 = B.THREE;
      const ring = () => {
        const out = [];
        for (let k = 0; k < 8; k++) {
          B.view({ azimuth: k * 45, ...VIEW, w: W, h: H, track: true });
          out.push(B.render({ w: W, h: H, silhouette: true }).url);
        }
        return out;
      };
      const frames = [];
      let info = {};
      if (row === 'walk') {
        B.H.track = null;
        await B.ensureStanding();
        a.move({ speed: a.gears.walk, heading: 0 });
        await B.stepAsync(4);
        B.view({ azimuth: 90, ...VIEW, w: W, h: H, track: true });   // the framing for every row
        const T = 1 / B.strideFreq(), sub = Math.max(1, Math.ceil(T / 8 * 60)), dt = T / 8 / sub;
        // how far one stride carries it, and the ground under the framing's middle, on the picture
        const c = B.H.lastView.center, d = B.H.lastView.d, pxPerM = H / (2 * d * Math.tan(VIEW.fov / 2 * Math.PI / 180));
        const g = new T3.Vector3(c.x, a.state.position.y, c.z).project(B.camera);
        info = { stridePx: a.state.speed * T * pxPerM, groundY: (1 - g.y) / 2 * H };
        for (let i = 0; i < 8; i++) { frames.push(ring()); B.step(sub, dt); }
        a.stop(); await B.stepAsync(1.5);
      } else if (row === 'sit') {
        B.play('sit'); await B.stepAsync(3);
        const sit = [];                                            // there and back: the loop never jumps
        for (let i = 0; i < 5; i++) { sit.push(ring()); await B.stepAsync(0.4); }
        [0, 1, 2, 3, 4, 3, 2, 1].forEach((i) => frames.push(sit[i]));
        B.play('stand'); await B.stepAsync(2);
      } else {
        B.play('groom', { duration: 30, side: -1 }); await B.stepAsync(1.6);   // (loop: true leaves the cat out of the picture)
        for (let i = 0; i < 8; i++) { frames.push(ring()); await B.stepAsync(2.6 / 8); }
      }
      return { frames, info };
    }, { row, W, H, VIEW }, 900000, row);
    for (const row of ['walk', 'sit', 'groom']) {
      const r = await run(row);
      r.frames.forEach((ring, f) => ring.forEach((u, k) => writeDataUrl(path.join(OUT, `${ci}-${row}-${f}-${k}.png`), u)));
      if (row === 'walk') meta.push({ variant, seed, ...r.info });
      console.log(variant, seed, row, 'done');
    }
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ W, H, coats: meta }));
  console.log('frames in', OUT, ctx.errors.length ? ctx.errors : '');
} finally { await ctx.close(); }
