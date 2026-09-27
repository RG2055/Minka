#!/usr/bin/env python3
"""Sprite sheets for the Nakts cats, mice, the fight cloud and the box, from
the frames rendered by scripts/blender/nakts_cats.py and nakts_props.py
(the box is two pictures: its back and its front wall, a cat sits between).

One sheet per cat coat (a row per motion and direction, a frame per column),
at 2x and 1x, plus pets.json that tells the page where each row is.

    python3 scripts/build-nakts-pets.py CATS_DIR PROPS_DIR
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'kalendars/assets/rooms/pets')
os.makedirs(OUT, exist_ok=True)
cats_dir, props_dir = sys.argv[1], sys.argv[2]
cats = json.load(open(os.path.join(cats_dir, 'cats.json')))
props = json.load(open(os.path.join(props_dir, 'props.json')))


def sheet(frames_by_row, size, name):
    """frames_by_row: [(key, [paths])]; saves name-2x/1x.webp; returns rows."""
    cols = max(len(p) for _, p in frames_by_row)
    img = Image.new('RGBA', (cols * size, len(frames_by_row) * size), (0, 0, 0, 0))
    rows = {}
    for r, (key, paths) in enumerate(frames_by_row):
        for c, p in enumerate(paths):
            img.alpha_composite(Image.open(p).convert('RGBA'), (c * size, r * size))
        rows[key] = {'row': r, 'frames': len(paths)}
    img.save(os.path.join(OUT, name + '-2x.webp'), 'WEBP', quality=86, method=6)
    img.resize((img.width // 2, img.height // 2), Image.LANCZOS).save(os.path.join(OUT, name + '-1x.webp'), 'WEBP', quality=88, method=6)
    return rows, cols


manifest = {'fps': cats['fps']}
# cats: every coat has the same rows
order = []
for anim, info in cats['anims'].items():
    for d in info['dirs']:
        order.append((anim, d, info['frames']))
coats = sorted(d for d in os.listdir(cats_dir) if os.path.isdir(os.path.join(cats_dir, d)))
cat_rows = None
for coat in coats:
    rows = [('%s-%s' % (a, d), [os.path.join(cats_dir, coat, '%s-%s-%02d.png' % (a, d, f)) for f in range(n)]) for a, d, n in order]
    cat_rows, cols = sheet(rows, cats['frame'], 'cat-' + coat)
    print('cat', coat, len(rows), 'rows')
manifest['cat'] = {'frame': cats['frame'] // 2, 'anchor': cats['anchor'], 'cols': cols, 'rows': cat_rows, 'coats': coats}

m = props['mouse']
rows = []
for anim, info in m['anims'].items():
    for d in info['dirs']:
        rows.append(('%s-%s' % (anim, d), [os.path.join(props_dir, 'mouse', '%s-%s-%02d.png' % (anim, d, f)) for f in range(info['frames'])]))
mrows, mcols = sheet(rows, m['frame'], 'mouse')
manifest['mouse'] = {'frame': m['frame'] // 2, 'anchor': m['anchor'], 'cols': mcols, 'rows': mrows}

fg = props['fight']
frows, fcols = sheet([('fight', [os.path.join(props_dir, 'fight', 'fight-%02d.png' % f) for f in range(fg['frames'])])], fg['frame'], 'fight')
manifest['fight'] = {'frame': fg['frame'] // 2, 'anchor': fg['anchor'], 'cols': fcols, 'rows': frows}

bx = props['box']
for k in ('back', 'front'):
    im = Image.open(os.path.join(props_dir, 'box', 'box-%s.png' % k)).convert('RGBA')
    im.save(os.path.join(OUT, 'box-%s-2x.webp' % k), 'WEBP', quality=88, method=6)
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(os.path.join(OUT, 'box-%s-1x.webp' % k), 'WEBP', quality=90, method=6)
manifest['box'] = {'frame': bx['frame'] // 2, 'anchor': bx['anchor']}

json.dump(manifest, open(os.path.join(OUT, 'pets.json'), 'w'), indent=1)
print(json.dumps(manifest)[:400])
