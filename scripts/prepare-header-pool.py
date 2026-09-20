#!/usr/bin/env python3
"""Header collection: crop each source photo to a wide band and encode WebP.

    python3 scripts/prepare-header-pool.py <source-dir> [--quality 80] [--width 2000]

The mapping below names each source file (any extension) by the id the header
uses (MIX_POOL in kalendars/js/calendar.js) and gives the focal point (x, y as
fractions of the source) the 3:1 band is centred on, so a portrait photo keeps
its subject in the strip the header shows. Output goes to
kalendars/data/header-backgrounds/pool/<id>.webp.
"""
import sys, os, argparse
from PIL import Image, ImageOps

# id -> (source file stem, focal x, focal y)
MAPPING = {
    'hummingbird':      ('hummingbird', 0.60, 0.44),
    'daffodils-glass':  ('daffodils', 0.50, 0.42),
    'bellflowers':      ('bellflowers', 0.50, 0.40),
    'blossom-orange':   ('blossom', 0.45, 0.35),
    'riga-aerial-dusk': ('riga-aerial', 0.55, 0.52),
    'cat-ghost':        ('cat', 0.50, 0.32),
    'glass-wave':       ('glass-wave', 0.55, 0.45),
    'moon-eclipse':     ('moon', 0.52, 0.50),
    'tree-dusk':        ('tree', 0.35, 0.45),
}
# The 2026-09-20 set was already composed as 2951x533 bands (wider than 3:1),
# so it was only resized to 2400px and encoded (17-187 KB each); crop only
# applies to sources taller than the band.
ASPECT = 3.0
MAX_ASPECT_KEEP = 6.0   # already-wide sources keep their full frame


def find_source(src_dir, stem):
    for name in sorted(os.listdir(src_dir)):
        base, ext = os.path.splitext(name)
        if base.lower() == stem and ext.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic'):
            return os.path.join(src_dir, name)
    return None


def band(im, fx, fy):
    w, h = im.size
    if ASPECT <= w / h <= MAX_ASPECT_KEEP:
        return im
    if w / h >= ASPECT:
        bh, bw = h, int(round(h * ASPECT))
    else:
        bw, bh = w, int(round(w / ASPECT))
    cx, cy = fx * w, fy * h
    left = min(max(0, cx - bw / 2), w - bw)
    top = min(max(0, cy - bh / 2), h - bh)
    return im.crop((int(left), int(top), int(left) + bw, int(top) + bh))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('--quality', type=int, default=80)
    ap.add_argument('--width', type=int, default=2000)
    args = ap.parse_args()
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'kalendars', 'data', 'header-backgrounds', 'pool')
    os.makedirs(out_dir, exist_ok=True)
    missing = []
    for ident, (stem, fx, fy) in MAPPING.items():
        path = find_source(args.source, stem)
        if not path:
            missing.append(stem)
            continue
        im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        strip = band(im, fx, fy)
        if strip.width > args.width:
            strip = strip.resize((args.width, int(round(strip.height * args.width / strip.width))), Image.LANCZOS)
        out = os.path.join(out_dir, ident + '.webp')
        strip.save(out, 'WEBP', quality=args.quality, method=6)
        print(f'{ident:18} {im.size[0]}x{im.size[1]} -> {strip.width}x{strip.height}  {os.path.getsize(out) // 1024} KB')
    if missing:
        print('missing sources:', ', '.join(missing), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
