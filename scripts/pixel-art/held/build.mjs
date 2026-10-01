// Renders the held drinks (scene.html) and writes the game's sprites:
//   kalendars/assets/gallery/hand-coffee.webp, hand-can.webp
// and prints each one's bottom row (HELD_SHOW in mood-gallery-3d.js).
//
//   node scripts/pixel-art/held/build.mjs [THREE_DIR]
// three.js comes from THREE_DIR (a three package folder) or jsDelivr.
// Needs the e2e Playwright (tests/e2e) and python3 with Pillow for WebP.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const { chromium } = await import(path.join(ROOT, 'tests/e2e/node_modules/playwright/index.mjs'));
const THREE_DIR = process.argv[2] || '';
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.186.1/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.webp': 'image/webp' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (url.startsWith('/three/')) {
    const rest = url.slice('/three/'.length);
    if (!THREE_DIR) { res.writeHead(302, { Location: THREE_CDN + rest }); res.end(); return; }
    const file = path.join(THREE_DIR, rest);
    if (!file.startsWith(path.resolve(THREE_DIR)) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res); return;
  }
  const file = path.join(HERE, path.basename(url) || 'scene.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ headless: true });
const SIZE = 1200;
for (const [name, out] of [['cup', 'hand-coffee'], ['can', 'hand-can']]) {
  const P = JSON.parse(fs.readFileSync(path.join(HERE, name + '.json'), 'utf8'));
  P.size = SIZE;
  const page = await browser.newPage({ viewport: { width: SIZE, height: Math.round(SIZE * (P.tall || 1)) } });
  page.on('pageerror', e => console.error(name, e.message));
  await page.goto(`http://127.0.0.1:${port}/scene.html#` + encodeURIComponent(JSON.stringify(P)));
  await page.waitForFunction(() => window.__out !== undefined, null, { timeout: 60000 });
  const r = await page.evaluate(() => ({ out: window.__out, map: window.__map }));
  const png = path.join(HERE, out + '.png'), webp = path.join(ROOT, 'kalendars/assets/gallery', out + '.webp');
  fs.writeFileSync(png, Buffer.from(r.out.split(',')[1], 'base64'));
  execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).save(sys.argv[2], "WEBP", lossless=True, method=6)', png, webp]);
  fs.unlinkSync(png);
  console.log(out + '.webp', r.map.w + '×' + r.map.H, 'drink bottom row', r.map.itemBottom);
  await page.close();
}
await browser.close();
server.close();
