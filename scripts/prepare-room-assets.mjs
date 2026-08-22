#!/usr/bin/env node

/**
 * One-time room asset preparation.
 *
 * Usage:
 *   NODE_PATH=/path/to/node_modules node scripts/prepare-room-assets.mjs \
 *     --main /path/to/main-room.png --nmp /path/to/nmp-room.png \
 *     [--bed /path/to/bed.png]
 *
 * Sharp is intentionally development-only. None of this code is loaded by the
 * PWA; generated AVIF/WebP files are committed under kalendars/assets/rooms.
 */
import { createRequire } from 'node:module';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DEFAULT_OUT = path.join(ROOT, 'kalendars', 'assets', 'rooms');

function argsToObject(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    out[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return out;
}

const args = argsToObject(process.argv.slice(2));
if (!args.main || !args.nmp) {
  console.error('Required: --main <png> --nmp <png> [--bed <png>] [--out <dir>]');
  process.exit(1);
}

const OUT = path.resolve(args.out || DEFAULT_OUT);
await mkdir(OUT, { recursive: true });

const BED_TONES = {
  neutral: null,
  orange: '#ffa032',
  cyan: '#1ec8ff',
  steel: '#55aaf5',
  green: '#00f064',
  pink: '#ff3c6e',
  yellow: '#ffe628',
  teal: '#00ebd7',
  copper: '#dc915a',
};

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function smoothstep(edge0, edge1, value) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

/**
 * The supplied source has a near-black studio background and a light neutral
 * bed. Build alpha once, decontaminate antialiased edge pixels against the
 * sampled background, then crop with transparent padding for the soft shadow.
 */
async function extractBed(input) {
  const image = sharp(input).removeAlpha().toColourspace('srgb');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const corners = [
    0,
    (width - 1) * 3,
    (height - 1) * width * 3,
    ((height * width) - 1) * 3,
  ];
  const bg = [0, 1, 2].map(channel => Math.round(
    corners.reduce((sum, offset) => sum + data[offset + channel], 0) / corners.length,
  ));

  const rgba = Buffer.alloc(width * height * 4);
  const core = new Uint8Array(width * height);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const src = pixel * 3;
    const dst = pixel * 4;
    const r = data[src];
    const g = data[src + 1];
    const b = data[src + 2];
    const brightness = Math.max(r, g, b);
    const alpha = Math.round(255 * smoothstep(30, 82, brightness));
    const a = alpha / 255;
    rgba[dst + 3] = alpha;
    for (let channel = 0; channel < 3; channel += 1) {
      const observed = data[src + channel];
      const clean = a > 0.035
        ? (observed - bg[channel] * (1 - a)) / a
        : 0;
      rgba[dst + channel] = Math.round(Math.max(0, Math.min(255, clean)));
    }
    if (alpha >= 56) core[pixel] = 1;
  }

  // Keep only the largest connected opaque component. It removes background
  // speckles without touching the connected bed silhouette.
  const seen = new Uint8Array(width * height);
  let largest = [];
  const queue = new Int32Array(width * height);
  for (let start = 0; start < core.length; start += 1) {
    if (!core[start] || seen[start]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    const component = [];
    while (head < tail) {
      const current = queue[head++];
      component.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbours = [
        x > 0 ? current - 1 : -1,
        x + 1 < width ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y + 1 < height ? current + width : -1,
      ];
      for (const next of neighbours) {
        if (next >= 0 && core[next] && !seen[next]) {
          seen[next] = 1;
          queue[tail++] = next;
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }

  let keep = new Uint8Array(width * height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const pixel of largest) {
    keep[pixel] = 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  // Grow the selected silhouette by a few pixels so its antialiased edge and
  // contact shadow survive. A rectangular keep-area would also retain the
  // studio background gradient, which creates visible "wings" after tinting.
  for (let pass = 0; pass < 10; pass += 1) {
    const grown = keep.slice();
    for (let pixel = 0; pixel < keep.length; pixel += 1) {
      if (!keep[pixel]) continue;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      if (x > 0) grown[pixel - 1] = 1;
      if (x + 1 < width) grown[pixel + 1] = 1;
      if (y > 0) grown[pixel - width] = 1;
      if (y + 1 < height) grown[pixel + width] = 1;
    }
    keep = grown;
  }
  for (let pixel = 0; pixel < keep.length; pixel += 1) {
    if (!keep[pixel]) rgba[pixel * 4 + 3] = 0;
  }

  const cropPad = 18;
  const left = Math.max(0, minX - cropPad);
  const top = Math.max(0, minY - cropPad);
  const cropWidth = Math.min(width - left, maxX - minX + 1 + cropPad * 2);
  const cropHeight = Math.min(height - top, maxY - minY + 1 + cropPad * 2);
  const buffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();
  return { buffer, width: cropWidth, height: cropHeight };
}

async function tintBed(input, tone) {
  if (!tone) return input;
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const target = hexToRgb(tone);
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const luminance = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const base = 0.16 + 0.84 * Math.pow(luminance, 0.88);
    const highlight = 0.46 * smoothstep(0.67, 0.99, luminance);
    for (let channel = 0; channel < 3; channel += 1) {
      const coloured = target[channel] * base;
      data[i + channel] = Math.round(Math.max(0, Math.min(255,
        coloured * (1 - highlight) + 255 * highlight,
      )));
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function writeBedVariants(source) {
  const extracted = await extractBed(source);
  const generated = [];
  for (const [name, colour] of Object.entries(BED_TONES)) {
    const tinted = await tintBed(extracted.buffer, colour);
    for (const width of [256, 512]) {
      const filename = `bed-${name}-${width}.webp`;
      const output = path.join(OUT, filename);
      await sharp(tinted)
        .resize({ width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
        .webp({ quality: 82, alphaQuality: 92, smartSubsample: true, effort: 6 })
        .toFile(output);
      generated.push(output);
    }
  }
  return generated;
}

async function writeRoomSet(source, kind) {
  const isMain = kind === 'main';
  // Room plates are supplied as RGBA cut-outs. Trim from the alpha channel,
  // then contain the complete silhouette in the exact ratios used by the UI.
  // This avoids both the old studio-background rectangle and object-fit
  // stretching while keeping enough transparent breathing room for shadows.
  const sizes = isMain
    ? [{ width: 600, height: 381 }, { width: 1200, height: 762 }]
    : [{ width: 320, height: 392 }, { width: 640, height: 784 }];
  const generated = [];
  for (const { width, height } of sizes) {
    for (const format of ['avif', 'webp']) {
      const filename = `room-${kind}-${width}.${format}`;
      const output = path.join(OUT, filename);
      let pipeline = sharp(source)
        .ensureAlpha()
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
        .resize({
          width,
          height,
          fit: 'contain',
          position: 'centre',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          withoutEnlargement: false,
          kernel: sharp.kernel.lanczos3,
        });
      pipeline = format === 'avif'
        ? pipeline.avif({ quality: 56, effort: 6, chromaSubsampling: '4:4:4' })
        : pipeline.webp({ quality: 82, alphaQuality: 95, smartSubsample: true, effort: 6 });
      await pipeline.toFile(output);
      generated.push(output);
    }
  }
  return generated;
}

const generated = [
  ...(args.bed ? await writeBedVariants(path.resolve(args.bed)) : []),
  ...await writeRoomSet(path.resolve(args.main), 'main'),
  ...await writeRoomSet(path.resolve(args.nmp), 'nmp'),
];

console.log(`Generated ${generated.length} assets in ${OUT}`);
for (const file of generated) {
  const fileStat = await stat(file);
  const metadata = await sharp(file).metadata();
  console.log(`${path.basename(file)}\t${metadata.width}x${metadata.height}\t${fileStat.size} bytes`);
}
