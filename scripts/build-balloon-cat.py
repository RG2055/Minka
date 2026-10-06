#!/usr/bin/env python3
"""Kaķis ar balonu's atlas (kalendars/assets/gallery/balloon-cat.webp) from the frames
scripts/blender/balloon_cat.py rendered: one box round every frame, its middle on the model's middle
(the camera went round it), 8 rows (sides, 0 = as the drawing shows it, round by the cat's left,
45° a step) by 16 frames, the alpha hard as the other cats'. Prints the frame size and how tall the
picture is in the gallery's units (a metre is 0.48 of them: the cats' scale).

    Blender -b -P scripts/blender/balloon_cat.py -- "$TMPDIR/minka-balloon-cat"
    python3 scripts/build-balloon-cat.py
"""
import os
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(tempfile.gettempdir(), 'minka-balloon-cat')
OUT = os.path.join(ROOT, 'kalendars/assets/gallery/balloon-cat.webp')
RES, ORTHO, UNITS_PER_M, K = 136, 0.95, 0.48, 1         # render size (the atlas's own: lines stay a pixel), its metres across, the scale

NF = 16                   # frames of the loop
frames = {(f, k): Image.open(os.path.join(SRC, 'fc-%d-%d.png' % (f, k))).convert('RGBA') for f in range(NF) for k in range(8)}
half, top, bottom = 0, RES, 0
for im in frames.values():
    bb = im.getchannel('A').point(lambda v: 255 if v > 100 else 0).getbbox()
    half = max(half, RES / 2 - bb[0], bb[2] - RES / 2)
    top, bottom = min(top, bb[1]), max(bottom, bb[3])
box = (round(RES / 2 - half) - 2, top - 2, round(RES / 2 + half) + 2, bottom + 2)
FW, FH = round((box[2] - box[0]) * K), round((box[3] - box[1]) * K)
atlas = Image.new('RGBA', (FW * NF, FH * 8), (0, 0, 0, 0))
for (f, k), im in frames.items():
    t = im.crop(box)
    t.putalpha(t.getchannel('A').point(lambda v: 255 if v > 70 else 0))
    atlas.alpha_composite(t, (f * FW, k * FH))
atlas.save(OUT, 'WEBP', quality=90, method=6)
hu = (box[3] - box[1]) * ORTHO / RES * UNITS_PER_M
print(OUT, atlas.size, os.path.getsize(OUT) // 1024, 'KB', 'frame', FW, FH, 'height units', round(hu, 3))
