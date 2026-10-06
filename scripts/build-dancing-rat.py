#!/usr/bin/env python3
"""Deju žurka's atlas (kalendars/assets/gallery/dancing-rat.webp) from the frames
scripts/blender/dancing_rat.py rendered: one box round every frame (its middle on the rat's middle,
the camera went round it; its bottom on the soles), 8 rows (sides, 0 = its face, round by its left,
45° a step) by 40 frames (the dance's 32, then standing 8), the alpha hard as the cats'. Prints the frame size and how tall the
picture stands in the gallery's units (the rat, ears up, HEIGHT_U of them).

    Blender -b -P scripts/blender/dancing_rat.py -- Flair.fbx "$TMPDIR/minka-dancing-rat"
    python3 scripts/build-dancing-rat.py ["$TMPDIR/minka-dancing-rat"]
"""
import os
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(tempfile.gettempdir(), 'minka-dancing-rat')
OUT = os.path.join(ROOT, 'kalendars/assets/gallery/dancing-rat.webp')
RES, ORTHO = 144, 7.4                 # render size, its metres across (as the Blender script)
RAT_M, HEIGHT_U = 5.92, 0.3           # the rat standing, ears up, in the model's metres; in the gallery's units
NF = 40                               # the dance's 32, then standing 8

frames = {(f, k): Image.open(os.path.join(SRC, 'rat-%d-%d.png' % (f, k))).convert('RGBA') for f in range(NF) for k in range(8)}
half, top, bottom = 0, RES, 0
for im in frames.values():
    bb = im.getchannel('A').point(lambda v: 255 if v > 100 else 0).getbbox()
    half = max(half, RES / 2 - bb[0], bb[2] - RES / 2)
    top, bottom = min(top, bb[1]), max(bottom, bb[3])
box = (round(RES / 2 - half) - 1, top - 1, round(RES / 2 + half) + 1, bottom)
FW, FH = box[2] - box[0], box[3] - box[1]
atlas = Image.new('RGBA', (FW * NF, FH * 8), (0, 0, 0, 0))
for (f, k), im in frames.items():
    fr = im.crop(box)
    r, g, b, a = fr.split()
    fr = Image.merge('RGBA', (r, g, b, a.point(lambda v: 255 if v > 110 else 0)))
    atlas.paste(fr, (f * FW, k * FH))
atlas.save(OUT, 'WEBP', quality=74, method=6, alpha_quality=100)
hu = FH / (RES / ORTHO) / RAT_M * HEIGHT_U
print('frame %dx%d, %d frames x 8 sides, atlas %dx%d, %d KB, hu %.3f' % (FW, FH, NF, FW * NF, FH * 8, os.path.getsize(OUT) // 1024, hu))
