#!/usr/bin/env python3
"""Small pictures for the Doom gallery (kalendars/js/page/mood-gallery-3d.js).

cats.webp: the Nakts cats (kalendars/assets/rooms/pets, the 2x sheets) seen
from the side only (walking, sitting, washing), cut to the cat itself so its
paws stand on the sprite's bottom edge. Rows: per coat (ginger, black, grey)
walk, sit, groom; 8 frames each. The page reads the frame size from the
constants printed at the end.

venus-milo.webp: "Venus de Milo" (Aphrodite of Melos), the head, a cut-out
photo by Jastrow (2007), public domain:
https://commons.wikimedia.org/wiki/File:Venere_di_Milo.png

The music (kalendars/assets/gallery/music/*.m4a) is the same as in DOOM: The
Gallery Experience: PM Music, conducted by Philip Milman, CC BY 3.0
(https://pmmusic.pro/downloads/), made smaller on a Mac with
    afconvert -f m4af -d aach -b 48000 IN.mp3 OUT.m4a      (HE-AAC, 48 kbit/s)

backdrops (the dithered art round the game, one ink on blue; the page dithers
them, these are only their light): adam-left.webp / adam-right.webp, the two
hands of Michelangelo's "Creation of Adam" (Sistine Chapel, public domain:
https://commons.wikimedia.org/wiki/File:Creation_of_Adam_(Michelangelo)_Detail.jpg,
the 1280 px copy, cut out first with scripts/cutout.swift, the Mac's own
Vision); moonrise.webp, Caspar David Friedrich, "Mondaufgang am Meer" (1822,
public domain: https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_Mondaufgang_am_Meer_-_Google_Art_Project.jpg,
the 1000 px copy). Grey is how dense the dots are, alpha where there is any.

The White Monster corner (monster-can.webp, monster-box.webp) from the photo
"Monster Energy Zero Ultra (China Version)" (TurnOnTheNight, CC0:
https://commons.wikimedia.org/wiki/File:Monster_Energy_Zero_Ultra_(China_Version)_330ml_20260628130320.jpg),
cut out with scripts/cutout.swift, a light ordered dither (Bayer 4×4, six steps
a channel). The hand that holds a drink is pixel art: scripts/pixel-art/held/build.py.

    python3 scripts/build-gallery-assets.py VENUS_PNG [ADAM_CUT_PNG MOON_JPG [CAN_CUT_PNG]]
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import colorsys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PETS = os.path.join(ROOT, 'kalendars/assets/rooms/pets')
OUT = os.path.join(ROOT, 'kalendars/assets/gallery')
COATS = ['ginger', 'black', 'grey']
ROWS = [0, 6, 9]          # walk-side, sit-side, groom-side (pets.json)
SRC = 192                 # 2x frame
FRAME_H = 48              # the cat's height in the atlas

sheets = {c: Image.open(os.path.join(PETS, 'cat-%s-2x.webp' % c)).convert('RGBA') for c in COATS}
# one box for every frame, so the cat does not jump between frames
x0 = y0 = SRC
x1 = y1 = 0
for img in sheets.values():
    for r in ROWS:
        for c in range(8):
            f = img.crop((c * SRC, r * SRC, c * SRC + SRC, r * SRC + SRC))
            bb = f.getchannel('A').point(lambda a: 255 if a > 140 else 0).getbbox()
            if not bb:
                continue
            x0, y0, x1, y1 = min(x0, bb[0]), min(y0, bb[1]), max(x1, bb[2]), max(y1, bb[3])
box = (x0 - 2, y0 - 2, x1 + 2, y1)          # the paws stay on the bottom edge
bw, bh = box[2] - box[0], box[3] - box[1]
FRAME_W = round(bw * FRAME_H / bh)
atlas = Image.new('RGBA', (FRAME_W * 8, FRAME_H * len(COATS) * len(ROWS)), (0, 0, 0, 0))
for ci, coat in enumerate(COATS):
    for ri, r in enumerate(ROWS):
        for c in range(8):
            f = sheets[coat].crop((c * SRC + box[0], r * SRC + box[1], c * SRC + box[2], r * SRC + box[3]))
            f = f.resize((FRAME_W, FRAME_H), Image.LANCZOS)
            # the soft floor shadow would come out as grey specks: keep the cat only
            a = f.getchannel('A').point(lambda v: 255 if v > 150 else 0)
            f.putalpha(a)
            atlas.alpha_composite(f, (c * FRAME_W, (ci * len(ROWS) + ri) * FRAME_H))
os.makedirs(OUT, exist_ok=True)
atlas.save(os.path.join(OUT, 'cats.webp'), 'WEBP', quality=90, method=6)
print('cats.webp', atlas.size, 'FRAME_W', FRAME_W, 'FRAME_H', FRAME_H)

if len(sys.argv) > 1:
    v = Image.open(sys.argv[1]).convert('RGBA')
    v = v.crop(v.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox())
    h = 360
    v = v.resize((round(v.width * h / v.height), h), Image.LANCZOS)
    v.save(os.path.join(OUT, 'venus-milo.webp'), 'WEBP', quality=84, method=6)
    print('venus-milo.webp', v.size)

if len(sys.argv) > 3:
    # ADAM_PNG: the fresco detail already cut out by the Mac's Vision
    # (swift scripts/cutout.swift Detail.jpg adam-cut.png); split between the fingers
    adam = Image.open(sys.argv[2]).convert('RGBA')
    sw = adam.width / 1280
    for box, name in [((0, 0, int(612 * sw), adam.height), 'adam-left.webp'), ((int(612 * sw), 0, adam.width, adam.height), 'adam-right.webp')]:
        im = adam.crop(box)
        im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox())
        r, g, b, a = im.split()
        light = Image.merge('RGB', (r, g, b)).convert('L').point(lambda v: max(0, min(255, int((v / 255 - 0.22) / 0.62 * 255))))
        out = Image.merge('RGBA', (light, light, light, a))
        out.thumbnail((520, 520), Image.LANCZOS)
        out.save(os.path.join(OUT, name), 'WEBP', quality=80, method=6)
        print(name, out.size)
    moon = Image.open(sys.argv[3]).convert('L')
    moon = moon.resize((800, round(800 * moon.height / moon.width)), Image.LANCZOS)
    moon.save(os.path.join(OUT, 'moonrise.webp'), 'WEBP', quality=78, method=6)
    print('moonrise.webp', moon.size)

BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]


def dither(im, levels=6):
    """A light ordered dither: each channel to `levels` steps, Bayer 4×4."""
    im = im.convert('RGBA')
    px = im.load()
    step = 255 / (levels - 1)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            t = (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5
            q = lambda v: int(max(0, min(levels - 1, round(v / step + t))) * step)
            px[x, y] = (q(r), q(g), q(b), 255 if a > 127 else 0)
    return im


if len(sys.argv) > 4:
    SUP = '/System/Library/Fonts/Supplemental/'
    # the White Monster corner: one can, and a tray of them (the hand that
    # holds one is pixel art: scripts/pixel-art/held/build.py)
    can = Image.open(sys.argv[4]).convert('RGBA')
    can = can.crop(can.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox())
    one = can.resize((64, int(64 * can.height / can.width)), Image.LANCZOS)
    dither(one).save(os.path.join(OUT, 'monster-can.webp'), 'WEBP', lossless=True, method=6)
    small = can.resize((40, int(40 * can.height / can.width)), Image.LANCZOS)
    bw, bh = 5 * 42 + 12, small.height + 40
    box = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    dark = small.copy()
    dark.putdata([(int(r * .82), int(g * .82), int(b * .84), a) for r, g, b, a in dark.getdata()])
    for i in range(5):
        box.alpha_composite(dark, (10 + i * 42, 0))                 # the row behind
    for i in range(5):
        box.alpha_composite(small, (6 + i * 42, 12))                # the front row
    bd = ImageDraw.Draw(box)
    ty = bh - 34
    bd.rectangle([0, ty, bw - 1, bh - 1], fill=(244, 245, 244, 255))
    bd.rectangle([0, ty, bw - 1, ty + 2], fill=(196, 201, 196, 255))
    f2 = ImageFont.truetype(SUP + 'Impact.ttf', 20)
    bd.text((bw // 2, ty + 18), 'MONSTER  ULTRA', font=f2, fill=(30, 31, 33, 255), anchor='mm')
    dither(box).save(os.path.join(OUT, 'monster-box.webp'), 'WEBP', lossless=True, method=6)
    print('monster-box.webp', box.size, 'monster-can.webp', one.size)
