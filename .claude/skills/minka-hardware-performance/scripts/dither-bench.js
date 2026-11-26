// The initials-dither frame three ways, same input, same output check: A) today's code (a drawImage per lit
// cell), B) JS typed-array blit + one putImageData, C) Rust/WASM blit + one putImageData. Tint and glow stay
// canvas operations in all three. Card 326×441 at DPR 1 (the work PCs' screens), 240 frames along a pointer path.
// Reports ms per frame (median, p90) and pixel differences of B and C against A on every 20th frame.
// WASM: build proto/dither-wasm (cargo build --release --target wasm32-unknown-unknown) and pass WASM=<path>.
const { chromium } = require('playwright');
const fs = require('fs');
const RATE = +(process.env.RATE || 1);
(async () => {
  const wasm = fs.readFileSync(process.env.WASM).toString('base64');
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<canvas id="a" width="326" height="441"></canvas><canvas id="b" width="326" height="441"></canvas><canvas id="c" width="326" height="441"></canvas>');
  const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const r = await p.evaluate(async (wasmB64) => {
    // constants and helpers as card-initials-dither.js on a plain (DPR 1) screen
    const CELL_W = 5, CELL_H = 8, CELL_FONT = 7.5, LO = .16, HI = .9, LEVELS = [.5, .74, 1], RADIUS = 92, FLOOR = .34, FADE = .9;
    const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const W = 326, H = 441, dpr = 1, letters = 'AL';
    function atlasFor() {
      const cw = Math.max(3, Math.round(CELL_W * dpr)), ch = Math.max(5, Math.round(CELL_H * dpr));
      const c = document.createElement('canvas'); c.width = cw * letters.length; c.height = ch * LEVELS.length;
      const x = c.getContext('2d'); x.font = '700 ' + (CELL_FONT * dpr).toFixed(2) + 'px ui-monospace, Consolas, "Liberation Mono", monospace';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      LEVELS.forEach((alpha, row) => { x.fillStyle = 'rgba(255,255,255,' + alpha + ')'; for (let k = 0; k < letters.length; k++) x.fillText(letters[k], k * cw + cw / 2, row * ch + ch / 2 + .5 * dpr); });
      return { img: c, cw, ch };
    }
    const A = atlasFor(), cols = Math.ceil(W / A.cw), rows = Math.ceil(H / A.ch);
    // a photo's light per cell, deterministic
    const light = new Float32Array(cols * rows); for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) light[y * cols + x] = .5 + .4 * Math.sin(x / 5) * Math.cos(y / 7);
    // tint: one pixel per cell, the person's colour mixed with a photo-like colour
    const tint = document.createElement('canvas'); tint.width = cols; tint.height = rows; { const t = tint.getContext('2d'), im = t.createImageData(cols, rows); for (let k = 0; k < cols * rows; k++) { im.data[k * 4] = 80 + (k * 7) % 120; im.data[k * 4 + 1] = 190; im.data[k * 4 + 2] = 240 - (k * 3) % 90; im.data[k * 4 + 3] = 255; } t.putImageData(im, 0, 0); }
    const tintRgb = [79, 195, 247];
    const path = []; for (let i = 0; i < 240; i++) { const a = i / 240 * Math.PI * 6; path.push([W / 2 + Math.cos(a) * W * .3, H / 2 + Math.sin(a * 1.3) * H * .3]); }
    function finish(ctx, st) {
      ctx.globalCompositeOperation = 'source-in'; ctx.imageSmoothingEnabled = true; ctx.drawImage(tint, 0, 0, W, H);
      if (st.glow > .02) { const gx = st.px, gy = st.py, gr = RADIUS * 1.15, c = tintRgb; const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr); g.addColorStop(0, 'rgba(' + c + ',' + (.16 * st.glow).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = g; ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); }
      ctx.globalCompositeOperation = 'source-over';
    }
    function stamp(st, heat) {
      const cw = A.cw / dpr, chh = A.ch / dpr, cx = st.px / cw, cy = st.py / chh;
      for (let i = 0; i < heat.length; i++) heat[i] *= FADE;
      st.glow = Math.min(1, st.glow + .2);
      const rx = Math.ceil(RADIUS / cw), ry = Math.ceil(RADIUS / chh);
      const x0 = Math.max(0, Math.floor(cx) - rx), x1 = Math.min(cols - 1, Math.floor(cx) + rx), y0 = Math.max(0, Math.floor(cy) - ry), y1 = Math.min(rows - 1, Math.floor(cy) + ry);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dx = (x + .5 - cx) * cw, dy = (y + .5 - cy) * chh, d = Math.sqrt(dx * dx + dy * dy); if (d >= RADIUS) continue; const t = 1 - d / RADIUS, v = t * t * (3 - 2 * t), k = y * cols + x; if (v > heat[k]) heat[k] = v; }
    }
    // A: today's
    const ctxA = document.getElementById('a').getContext('2d'), stA = { px: 0, py: 0, glow: 0 }, heatA = new Float32Array(cols * rows);
    function frameA() {
      stamp(stA, heatA); const n = letters.length; let any = false;
      ctxA.clearRect(0, 0, W, H);
      for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) { const kk = yy * cols + xx, hv = heatA[kk]; if (hv < .02) continue; any = true; let v = (light[kk] - LO) / (HI - LO); v = (FLOOR + (1 - FLOOR) * Math.max(0, Math.min(1, v))) * hv; if (v <= 0 || (BAYER4[(yy & 3) * 4 + (xx & 3)] + .5) / 16 >= v * 1.7) continue; const level = v < .38 ? 0 : v < .7 ? 1 : 2; ctxA.drawImage(A.img, ((xx + yy) % n) * A.cw, level * A.ch, A.cw, A.ch, xx * A.cw, yy * A.ch, A.cw, A.ch); }
      if (any) finish(ctxA, stA);
    }
    // B: JS blit
    const atlasData = A.img.getContext('2d').getImageData(0, 0, A.img.width, A.img.height).data, aw = A.img.width;
    const ctxB = document.getElementById('b').getContext('2d'), stB = { px: 0, py: 0, glow: 0 }, heatB = new Float32Array(cols * rows), imB = new ImageData(W, H), outB = imB.data, outB32 = new Uint32Array(outB.buffer), atlas32 = new Uint32Array(atlasData.buffer);
    function frameB() {
      stamp(stB, heatB); const n = letters.length; let any = false; outB32.fill(0);
      for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) { const kk = yy * cols + xx, hv = heatB[kk]; if (hv < .02) continue; any = true; let v = (light[kk] - LO) / (HI - LO); v = (FLOOR + (1 - FLOOR) * Math.max(0, Math.min(1, v))) * hv; if (v <= 0 || (BAYER4[(yy & 3) * 4 + (xx & 3)] + .5) / 16 >= v * 1.7) continue; const level = v < .38 ? 0 : v < .7 ? 1 : 2;
        const sx = ((xx + yy) % n) * A.cw, sy = level * A.ch, dx = xx * A.cw, dy = yy * A.ch, w = Math.min(A.cw, W - dx);
        for (let r = 0; r < A.ch && dy + r < H; r++) outB32.set(atlas32.subarray((sy + r) * aw + sx, (sy + r) * aw + sx + w), (dy + r) * W + dx); }
      ctxB.putImageData(imB, 0, 0);
      if (any) finish(ctxB, stB);
    }
    // C: WASM blit
    const bytes = Uint8Array.from(atob(wasmB64), (c) => c.charCodeAt(0));
    const { instance } = await WebAssembly.instantiate(bytes, {});
    const X = instance.exports;
    const pHeat = X.alloc(cols * rows * 4), pLight = X.alloc(cols * rows * 4), pAtlas = X.alloc(atlasData.length), pOut = X.alloc(W * H * 4);
    const memU8 = () => new Uint8Array(X.memory.buffer);
    new Float32Array(X.memory.buffer, pHeat, cols * rows).fill(0); new Float32Array(X.memory.buffer, pLight, cols * rows).set(light); memU8().set(atlasData, pAtlas);
    const ctxC = document.getElementById('c').getContext('2d'), stC = { px: 0, py: 0, glow: 0 };
    const imC = new ImageData(new Uint8ClampedArray(X.memory.buffer, pOut, W * H * 4), W, H);
    function frameC() {
      stC.glow = Math.min(1, stC.glow + .2);
      const any = X.frame(pHeat, pLight, 1, cols, rows, pAtlas, aw, A.cw, A.ch, letters.length, pOut, W, H, 1, stC.px / (A.cw / dpr), stC.py / (A.ch / dpr), A.cw / dpr, A.ch / dpr, RADIUS);
      ctxC.putImageData(imC, 0, 0);
      if (any) finish(ctxC, stC);
    }
    const diff = (c1, c2) => { const a = c1.getImageData(0, 0, W, H).data, b = c2.getImageData(0, 0, W, H).data; let n = 0, mx = 0; for (let i = 0; i < a.length; i += 4) { let m = 0; for (let j = 0; j < 4; j++) m = Math.max(m, Math.abs(a[i + j] - b[i + j])); if (m) n++; if (m > mx) mx = m; } return [n, mx]; };
    const times = { A: [], B: [], C: [] }, diffs = { B: [0, 0], C: [0, 0] };
    for (let i = 0; i < path.length; i++) {
      for (const st of [stA, stB, stC]) { st.px = path[i][0]; st.py = path[i][1]; }
      let t = performance.now(); frameA(); ctxA.getImageData(0, 0, 1, 1); times.A.push(performance.now() - t);
      t = performance.now(); frameB(); ctxB.getImageData(0, 0, 1, 1); times.B.push(performance.now() - t);
      t = performance.now(); frameC(); ctxC.getImageData(0, 0, 1, 1); times.C.push(performance.now() - t);
      if (i % 20 === 19) for (const [k, c] of [['B', ctxB], ['C', ctxC]]) { const [n, mx] = diff(ctxA, c); diffs[k][0] = Math.max(diffs[k][0], n); diffs[k][1] = Math.max(diffs[k][1], mx); }
    }
    const stat = (a) => { a = a.slice(20).sort((x, y) => x - y); return { median: +a[a.length >> 1].toFixed(3), p90: +a[Math.floor(a.length * .9)].toFixed(3) }; };
    return { cells: cols * rows, A: stat(times.A), B: stat(times.B), C: stat(times.C), maxChangedPx: { B: diffs.B[0], C: diffs.C[0] }, maxChannelDiff: { B: diffs.B[1], C: diffs.C[1] } };
  }, wasm);
  console.log(`CPU x${RATE}:`, JSON.stringify(r));
  await b.close();
})();
