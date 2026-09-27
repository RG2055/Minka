#!/usr/bin/env python3
"""The duvet's and the sleeper's maps for the page, from the renders of
scripts/blender/nakts_duvet.py (OUT_DIR): webp, lossless (the UV maps must keep
their exact values), at the size the page draws them.

- duvet-bed-<m|f>-uv/shade-256, body-bed-<m|f>-zone-256: the duvet over the
  sleeper's figure, and what shows of the figure (the feet out of its end);
- duvet-slide-*: sliding off the bed's side, 400 x 380 (the bed at 256 px);
- duvet-floor-*: the heap on the floor, 300 x 220 (the rooms' 2x);
- duvet-drag-*: four frames carried in a cat's teeth, 400 x 200 each (the cats'
  2x), one under another;
- body-<m|f>-shade/zone-256: the sleeper without the duvet.
Light (shade) maps are lossy at q92, the UV and garment maps lossless.
duvet.json keeps each state's light of the white cloth (so any cloth keeps its
colour) and the figure's.

    python3 scripts/build-duvet-maps.py OUT_DIR
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEDS = os.path.join(ROOT, 'kalendars/assets/rooms/beds')
src = sys.argv[1]
info = json.load(open(os.path.join(BEDS, 'duvet.json')))
info.setdefault('refs', {})


def load(name):
    return Image.open(os.path.join(src, name)).convert('RGBA')


def sized(im, size):
    return im if im.size == size else im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def save(im, name):
    # UV and garment maps must keep their exact values; light maps keep their look at q92
    if '-shade' in name:
        im.save(os.path.join(BEDS, name), 'WEBP', quality=92, alpha_quality=100, method=6)
    else:
        im.save(os.path.join(BEDS, name), 'WEBP', lossless=True, method=6)


def light(shade, cover):
    s = np.asarray(shade).astype(float)[..., 0] / 255
    a = np.asarray(cover).astype(float)[..., 3] / 255
    return round(float(np.median(s[a > 0.9])), 4)


def has(name):
    return os.path.exists(os.path.join(src, name))


# the duvet over each figure, the feet out of its end
for fig in ('m', 'f'):
    if has('bed-%s-uv.png' % fig):
        uv, sh, zn = load('bed-%s-uv.png' % fig), load('bed-%s-shade.png' % fig), load('bed-%s-zone.png' % fig)
        info.setdefault('bed', {})[fig] = light(sh, uv)
        save(sized(uv, (256, 364)), 'duvet-bed-%s-uv-256.webp' % fig)
        save(sized(sh, (256, 364)), 'duvet-bed-%s-shade-256.webp' % fig)
        save(sized(zn, (256, 364)), 'body-bed-%s-zone-256.webp' % fig)
# each state's cloth (m): prints keep their size on all of them
info['sizes'] = {'bed': [1.22, 0.73], 'slide': [1.22, 0.88], 'floor': [1.22, 0.88], 'drag': [0.86, 0.62]}
for state, size in (('slide', (400, 380)), ('floor', (300, 220))):
    if has(state + '-uv.png'):
        uv, sh = load(state + '-uv.png'), load(state + '-shade.png')
        info['refs'][state] = light(sh, uv)
        save(sized(uv, size), 'duvet-%s-uv.webp' % state)
        save(sized(sh, size), 'duvet-%s-shade.webp' % state)
if has('drag-0-uv.png'):
    for kind in ('uv', 'shade'):
        frames = [load('drag-%d-%s.png' % (i, kind)) for i in range(4)]
        strip = Image.new('RGBA', (frames[0].width, frames[0].height * 4), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            strip.paste(f, (0, i * f.height))
        save(strip, 'duvet-drag-%s.webp' % kind)
    info['refs']['drag'] = light(load('drag-0-shade.png'), load('drag-0-uv.png'))
for fig in ('m', 'f'):
    if has('body-%s-zone.png' % fig):
        zone, shade = load('body-%s-zone.png' % fig), load('body-%s-shade.png' % fig)
        info['body'] = light(shade, zone)
        save(sized(zone, (256, 364)), 'body-%s-zone-256.webp' % fig)
        save(sized(shade, (256, 364)), 'body-%s-shade-256.webp' % fig)
json.dump(info, open(os.path.join(BEDS, 'duvet.json'), 'w'))
print(info)
