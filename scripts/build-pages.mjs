// Builds dist/ for Cloudflare Pages: only the files the site serves.
// Worker sources, tests, docs, scripts and the local Apps Script copies
// (google_apps_script/live, which hold colleague names) are never copied.
//   node scripts/build-pages.mjs && npx wrangler pages deploy dist --project-name rg-minka
import { cp, mkdir, rm, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const FILES = ['index.html', 'mobile.html', 'migrate.html', 'privatums.html', 'sw.js', 'manifest.json', 'manifest-mobile.json', 'manifest-rad.json', 'manifest-mobile-rad.json'];
const DIRS = ['css', 'js', 'data', 'assets', 'vendor', 'kalendars', 'integrations/lacitis/player', 'integrations/webamp/player', 'rad'];
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
const shipped = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p);
    else { files++; bytes += (await stat(p)).size; shipped.push(p); }
  }
}
await walk(dist);

// Every literal local src/href in shipped HTML and url() in shipped CSS must
// exist in dist/, and so must the service worker's precache list. Refs built
// at runtime ('…' + v) are not visible here and stay the author's job.
const missing = [];
const isLocal = (ref) => ref && !/^(?:[a-z][\w+.-]*:|\/\/|#|%23)/i.test(ref) && !/['"+`{}$<>\s]/.test(ref) && !ref.startsWith('/.well-known/');
const check = (from, ref, base) => {
  const clean = decodeURIComponent(ref.replace(/[?#].*$/, ''));
  if (!clean) return;
  const target = clean.startsWith('/') ? path.join(dist, clean) : path.resolve(base, clean);
  if (!existsSync(target)) missing.push(`${path.relative(dist, from)} → ${ref}`);
};
for (const file of shipped) {
  if (file.endsWith('.html')) {
    const html = await readFile(file, 'utf8');
    for (const [, ref] of html.matchAll(/\s(?:src|href)=["']([^"']+)["']/g)) if (isLocal(ref)) check(file, ref, path.dirname(file));
  } else if (file.endsWith('.css')) {
    const css = await readFile(file, 'utf8');
    for (const [, , ref] of css.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/g)) if (isLocal(ref)) check(file, ref, path.dirname(file));
  }
}
const sw = await readFile(path.join(dist, 'sw.js'), 'utf8');
for (const [, ref] of sw.matchAll(/appUrl\('([^']+)'\)/g)) check(path.join(dist, 'sw.js'), ref, dist);
if (missing.length) {
  console.error(`Missing files referenced from dist (${missing.length}):\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`dist: ${files} files, ${(bytes / 1048576).toFixed(1)} MB, all literal refs present`);
