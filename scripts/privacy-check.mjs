// Private patterns are supplied by local Git configuration or a CI secret.
// Keep this script, its tests and workflow free of real roster identities.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2);
const git = (...argv) => execFileSync('git', argv, { maxBuffer: 32 * 1024 * 1024 });
let raw = process.env.PRIVATE_NAME_PATTERNS;
if (!raw) {
  let file;
  try { file = git('config', '--get', 'privacy.patternsFile').toString().trim(); } catch {}
  if (file) raw = fs.readFileSync(file, 'utf8');
}
if (!raw) {
  console.error('Privacy check requires the private pattern file or CI secret. Publication blocked.');
  process.exit(1);
}
const patterns = JSON.parse(raw).prefixes;
if (!Array.isArray(patterns) || !patterns.length || patterns.some(p => typeof p !== 'string' || !p)) throw new Error('Invalid private pattern configuration');
const normalize = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const matches = text => (normalize(text).match(/[\p{L}\p{N}_]+/gu) || []).some(word => patterns.some(p => word.startsWith(normalize(p))));
let failed = false;
function inspect(label, content) {
  if (content.includes(0)) return;
  content.toString('utf8').split('\n').forEach((line, i) => {
    if (matches(line)) { console.error(`Private identity detected: ${label}:${i + 1}`); failed = true; }
  });
}
if (args[0] === '--message') inspect('commit message', fs.readFileSync(args[1]));
else {
  const staged = args.includes('--staged');
  const treeIndex = args.indexOf('--tree');
  const tree = treeIndex >= 0 ? args[treeIndex + 1] : 'HEAD';
  const paths = git(...(staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-tree', '-r', '--name-only', '-z', tree])).toString().split('\0').filter(Boolean);
  const textFiles = [];
  for (const file of paths) {
    // Public name-day dictionaries are unrelated to the private staff roster.
    if (/(^|\/)(varda\.js|[^/]*nameday[^/]*)$/i.test(file)) continue;
    inspect('file path', Buffer.from(file));
    if (/\.(png|jpe?g|webp|gif|ico|avif|woff2?|ttf|mp3|mp4|wav|ogg|pdf|zip|gz|bundle)$/i.test(file)) continue;
    textFiles.push(file);
  }
  if (textFiles.length) {
    const input = textFiles.map(file => staged ? ':' + file : tree + ':' + file).join('\n') + '\n';
    const blobs = execFileSync('git', ['cat-file', '--batch'], { input, maxBuffer: 128 * 1024 * 1024 });
    let offset = 0;
    for (const file of textFiles) {
      const end = blobs.indexOf(10, offset);
      const fields = blobs.subarray(offset, end).toString().split(' ');
      if (fields[1] !== 'blob') throw new Error('Cannot inspect staged file');
      const size = Number(fields[2]);
      inspect(file, blobs.subarray(end + 1, end + 1 + size));
      offset = end + size + 2;
    }
  }
  if (args[0] === '--range') {
    const messages = git('log', '--format=%H%x00%B%x00', args[1]).toString().split('\0');
    for (let i = 0; i + 1 < messages.length; i += 2) {
      inspect(`commit ${messages[i].trim().slice(0, 8)}`, Buffer.from(messages[i + 1]));
    }
  }
}
if (failed) process.exit(1);
console.log('Privacy check passed.');
