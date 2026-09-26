// Builds dist/ for Cloudflare Pages: only the files the site serves.
// Worker sources, tests, docs, scripts and the local Apps Script copies
// (google_apps_script/live, which hold colleague names) are never copied.
//   node scripts/build-pages.mjs && npx wrangler pages deploy dist --project-name rg-minka
import { cp, mkdir, rm, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const FILES = ['index.html', 'mobile.html', 'sw.js', 'manifest.json', 'manifest-mobile.json', 'manifest-rad.json', 'manifest-mobile-rad.json'];
const DIRS = ['css', 'js', 'data', 'assets', 'vendor', 'kalendars', 'integrations/lacitis/player', 'rad'];
// Never published, even when they sit inside a copied folder.
const SKIP = [/\/test(\/|$)/, /\/tests(\/|$)/, /\.test\.m?js$/, /\/\.[^/]+$/, /\.md$/];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of FILES) await cp(path.join(root, file), path.join(dist, file));
for (const dir of DIRS) {
  await cp(path.join(root, dir), path.join(dist, dir), {
    recursive: true,
    filter: (src) => !SKIP.some((re) => re.test(src.slice(root.length).split(path.sep).join('/')))
  });
}

// HTML and the service worker must always be revalidated; versioned assets
// (?v=…) may be cached, the service worker already controls their freshness.
await writeFile(path.join(dist, '_headers'), [
  '/*.html',
  '  Cache-Control: no-cache',
  '/',
  '  Cache-Control: no-cache',
  '/sw.js',
  '  Cache-Control: no-cache',
  '/kalendars/',
  '  Cache-Control: no-cache',
  '/rad/',
  '  Cache-Control: no-cache',
  ''
].join('\n'));

let files = 0, bytes = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p);
    else { files++; bytes += (await stat(p)).size; }
  }
}
await walk(dist);
console.log(`dist: ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
