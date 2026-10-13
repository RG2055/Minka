// Builds dist/ for Cloudflare Pages: only the files the site serves.
// Worker sources, tests, docs, scripts and the local Apps Script copies
// (google_apps_script/live, which hold colleague names) are never copied.
//   node scripts/build-pages.mjs && npx wrangler pages deploy dist --project-name rg-minka
import { cp, mkdir, rm, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

// Content hashes: every literal ?v= in shipped CSS url() and HTML src/href gets
// the target file's hash appended (?v=20261012rd1 → ?v=20261012rd1.3f9a0c2e),
// so a file changed without bumping its ?v= still gets a new URL. Cloudflare
// keeps ?v= files for a year, so a forgotten bump used to mean stale code.
// The date prefix stays (theme.js shows it). CSS goes first: its own bytes
// change here before the HTML hashes it. Refs built in JS ('…?v=' + V) are untouched.
const isLocal = (ref) => ref && !/^(?:[a-z][\w+.-]*:|\/\/|#|%23)/i.test(ref) && !/['"+`{}$<>\s]/.test(ref) && !ref.startsWith('/.well-known/');
const hashes = new Map();
const hashOf = async (file) => {
  if (!hashes.has(file)) hashes.set(file, createHash('sha1').update(await readFile(file)).digest('hex').slice(0, 8));
  return hashes.get(file);
};
async function stampVersions(file, pattern) {
  const text = await readFile(file, 'utf8');
  const stamps = new Map();
  for (const m of text.matchAll(pattern)) {
    const ref = m.groups.ref, target = path.resolve(ref.startsWith('/') ? dist : path.dirname(file), '.' + (ref.startsWith('/') ? '' : '/') + decodeURIComponent(ref.split('?')[0]));
    if (isLocal(ref) && existsSync(target)) stamps.set(ref, `${ref.replace(/\?v=[\w.-]*/, (v) => v.split('.')[0])}.${await hashOf(target)}`);
  }
  if (stamps.size) await writeFile(file, text.replace(pattern, (all, ...args) => {
    const { ref } = args.at(-1);
    return stamps.has(ref) ? all.replace(ref, stamps.get(ref)) : all;
  }));
  return stamps.size;
}
let stamped = 0;
for (const file of shipped.filter((f) => f.endsWith('.css'))) stamped += await stampVersions(file, /url\(\s*["']?(?<ref>[^"')\s]+\?v=[\w.-]+)/g);
for (const file of shipped.filter((f) => f.endsWith('.html'))) stamped += await stampVersions(file, /\s(?:src|href)=["'](?<ref>[^"']+\?v=[\w.-]+)/g);

// Every literal local src/href in shipped HTML and url() in shipped CSS must
// exist in dist/, and so must the service worker's precache list. Refs built
// at runtime ('…' + v) are not visible here and stay the author's job.
const missing = [];
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

// Size budget: the JS and CSS each page links at startup (literal refs only;
// lazily loaded features are not counted). Growing past it stops the build —
// raise scripts/size-budget.json on purpose, in the same commit, with a reason.
const budget = JSON.parse(await readFile(path.join(root, 'scripts/size-budget.json'), 'utf8'));
const over = [], sizes = {};
for (const [page, limit] of Object.entries(budget.pages)) {
  const file = path.join(dist, page), html = await readFile(file, 'utf8'), seen = new Set();
  let js = 0, css = 0;
  for (const m of html.matchAll(/<(script|link)\b[^>]*>/g)) {
    const tag = m[0], ref = (tag.match(/\s(?:src|href)=["']([^"']+)["']/) || [])[1];
    const isCss = m[1] === 'link' && /rel=["'](stylesheet|preload)["']/.test(tag) && /\.css(\?|$)/.test(ref || '');
    if (!ref || !isLocal(ref) || (m[1] === 'link' && !isCss)) continue;
    const target = path.resolve(ref.startsWith('/') ? dist : path.dirname(file), '.' + (ref.startsWith('/') ? '' : '/') + decodeURIComponent(ref.split('?')[0]));
    if (seen.has(target) || !existsSync(target)) continue;
    seen.add(target);
    const size = (await stat(target)).size;
    if (isCss) css += size; else js += size;
  }
  sizes[page] = { jsKB: Math.round(js / 1024), cssKB: Math.round(css / 1024) };
  if (sizes[page].jsKB > limit.jsKB) over.push(`${page}: JS ${sizes[page].jsKB} KB > ${limit.jsKB} KB`);
  if (sizes[page].cssKB > limit.cssKB) over.push(`${page}: CSS ${sizes[page].cssKB} KB > ${limit.cssKB} KB`);
}
if (over.length) {
  console.error(`Startup size budget exceeded (scripts/size-budget.json):\n  ${over.join('\n  ')}`);
  process.exit(1);
}
console.log(`dist: ${files} files, ${(bytes / 1048576).toFixed(1)} MB, ${stamped} refs content-hashed, all literal refs present`);
console.log('startup JS/CSS within budget: ' + Object.entries(sizes).map(([p, s]) => `${p} ${s.jsKB}/${s.cssKB} KB`).join(', '));
