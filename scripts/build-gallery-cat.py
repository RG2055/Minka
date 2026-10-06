#!/usr/bin/env python3
"""The gallery cats' atlas (kalendars/assets/gallery/cats3d.webp), Doom's way: every frame from the
side you look at it from.

- Rudais, Melnais (and Klibais), Pelēkais: the Nakts cats themselves (kalendars/assets/rooms/pets,
  the 2x sheets, pets.json), at the size they had in the gallery: walking from the front, the side
  and the back; sitting and washing from the front and the side.
- Špricētājs: the procedural black cat scripts/build-gallery-cat.mjs rendered from 8 sides on a green
  key (the green taken out, and off the fur's edge), a sitting cat as tall as the others.

Layout: per cat 15 rows (row = (walk | sit | groom) * 5 + side, side 0 = its face, 1..4 round by its
left side to its back, 45° a step; the right side is the left one mirrored, as Doom's), 8 frames
across; every frame the same size, the ground under the cat on one line. The alpha hard (the sheets'
soft floor shadows out). Prints the frame size and how far under the frame's bottom the ground lies
(px; 48 px = CAT_H), for mood-gallery-3d.js.

    python3 scripts/build-gallery-cat.py
"""
import json
import os
import tempfile

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PETS = os.path.join(ROOT, 'kalendars/assets/rooms/pets')
SRC = os.path.join(tempfile.gettempdir(), 'minka-cat-frames')
OUT = os.path.join(ROOT, 'kalendars/assets/gallery/cats3d.webp')
ROWS = ['walk', 'sit', 'groom']
PET_COATS = ['ginger', 'black', 'grey']
SIT_H = 44                # a sitting cat in the gallery, px


def solid(f):
    return f.getchannel('A').point(lambda v: 255 if v > 140 else 0).getbbox()


def unkey(img):
    """green key → alpha: a blended pixel is a·fur + (1 − a)·green"""
    img = img.convert('RGB')
    out = Image.new('RGBA', img.size)
    src, dst = img.load(), out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b = src[x, y]
            a = 1 - max(0, g - max(r, b)) / 255
            if a < 0.04:
                dst[x, y] = (0, 0, 0, 0)
                continue
            g2 = (g - (1 - a) * 255) / a          # the green that showed through, taken off
            dst[x, y] = (r, max(0, min(255, round(min(g2, max(r, b) + 12)))), b, round(a * 255))
    return out


# ---- the Nakts cats: which row of their sheet shows each side (the sheets' side views face right,
# the cat's right side; its left side is that mirrored)
pets = json.load(open(os.path.join(PETS, 'pets.json')))['cat']
S = pets['frame'] * 2
AX = round(pets['anchor'][0] * S)
VIEWS = {'walk': ('walk-front', 'walk-side', 'walk-back'), 'sit': ('sit-front', 'sit-side', 'sit-side'), 'groom': ('groom-front', 'groom-side', 'groom-side')}
sheets = {c: Image.open(os.path.join(PETS, 'cat-%s-2x.webp' % c)).convert('RGBA') for c in PET_COATS}


def pet(coat, name, f):
    r = pets['rows'][name]['row']
    return sheets[coat].crop((f * S, r * S, f * S + S, r * S + S))


# their size and their floor as in the old gallery atlas (build-gallery-assets.py: one box round the
# side views, 48 px tall, the paws on its bottom edge)
y0, y1 = S, 0
for c in PET_COATS:
    for name in ('walk-side', 'sit-side', 'groom-side'):
        for f in range(8):
            bb = solid(pet(c, name, f))
            if bb:
                y0, y1 = min(y0, bb[1]), max(y1, bb[3])
pk = 48 / (y1 - (y0 - 2))
sources = []              # (coat, row, frame, side, image, anchor x, ground y, scale)
for ci, c in enumerate(PET_COATS):
    for row in ROWS:
        front, side, back = VIEWS[row]
        for f in range(8):
            sv = ImageOps.mirror(pet(c, side, f))
            for s, img in ((0, pet(c, front, f)), (1, sv), (2, sv), (3, sv), (4, pet(c, back, f) if row == 'walk' else sv)):
                sources.append((ci, row, f, s, img, AX, y1, pk))

# ---- Špricētājs
meta = json.load(open(os.path.join(SRC, 'meta.json')))
CW, CH = meta['W'], meta['H']
spric = {}
for row in ROWS:
    for f in range(8):
        for s in range(5):
            spric[row, f, s] = unkey(Image.open(os.path.join(SRC, '0-%s-%d-%d.png' % (row, f, s))))
sk = SIT_H / max(solid(spric['sit', f, 2])[3] - solid(spric['sit', f, 2])[1] for f in range(8))
for (row, f, s), img in spric.items():
    sources.append((3, row, f, s, img, CW / 2, meta['coats'][0]['groundY'], sk))

# ---- one frame for all: as wide as the widest either side of its middle, as tall as the tallest
# above the floor plus the deepest below it
half = up = down = 0
for (_c, _r, _f, _s, img, ax, gy, k) in sources:
    bb = solid(img)
    if bb:
        half = max(half, (ax - bb[0]) * k, (bb[2] - ax) * k)
        up, down = max(up, (gy - bb[1]) * k), max(down, (bb[3] - gy) * k)
FW, FH, DROP = int(half * 2) + 2, int(up + down) + 2, int(down) + 1
atlas = Image.new('RGBA', (FW * 8, FH * 15 * 4), (0, 0, 0, 0))
for (c, row, f, s, img, ax, gy, k) in sources:
    w, h = round(img.width * k), round(img.height * k)
    t = img.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
    t.putalpha(t.getchannel('A').point(lambda v: 255 if v > 150 else 0))
    ox, oy = round(FW / 2 - ax * k), round(FH - DROP - gy * k)
    tile = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    tile.paste(t, (ox, oy), t)
    atlas.alpha_composite(tile, (f * FW, (c * 15 + ROWS.index(row) * 5 + s) * FH))
atlas.save(OUT, 'WEBP', quality=88, method=6)
print(OUT, atlas.size, os.path.getsize(OUT) // 1024, 'KB')
print('CAT3D fw', FW, 'fh', FH, 'drop', DROP, 'Špricētājs stride px', round(meta['coats'][0]['stridePx'] * sk, 1))
