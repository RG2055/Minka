"""Pack the rendered mascots (scripts/blender/rg_mascot.py -> scripts/blender/rg-mascot/*.png) for the app:
one crop per kind (the box that holds its five expressions, so they swap in place and each kind fills its place in
the card), 256 px wide WebP in kalendars/assets/butnes/<kind>-<expression>.webp. Needs Pillow and cwebp.

    python3 scripts/build-butnes.py [--sheet OUT.png]
"""
import glob
import os
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts', 'blender', 'rg-mascot')
OUT = os.path.join(ROOT, 'kalendars', 'assets', 'butnes')

files = sorted(glob.glob(os.path.join(SRC, '*-*.png')))
assert files, 'no renders in ' + SRC
kinds = sorted({os.path.basename(f).split('-')[0] for f in files})
side = Image.open(files[0]).size[0]
os.makedirs(OUT, exist_ok=True)
total, pad = 0, 4
for kind in kinds:
    mine = [f for f in files if os.path.basename(f).startswith(kind + '-')]
    box = None
    for f in mine:
        b = Image.open(f).getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    # the same margin left and right, so the creature stays centred over its buttons
    m = max(0, min(box[0], side - box[2]) - pad)
    box = (m, max(0, box[1] - pad), side - m, min(side, box[3] + pad))
    w, h = box[2] - box[0], box[3] - box[1]
    for f in mine:
        out = os.path.join(OUT, os.path.basename(f)[:-4] + '.webp')
        subprocess.run(['cwebp', '-quiet', '-q', '84', '-alpha_q', '90', '-m', '6', '-crop', str(box[0]), str(box[1]), str(w), str(h),
                        '-resize', '256', '0', f, '-o', out], check=True)
        total += os.path.getsize(out)
    print('butnes: %-8s crop %s of %d, aspect %.2f (w/h)' % (kind, box, side, w / h))
print('butnes: %d pictures, %d KB in all' % (len(files), total // 1024))

if '--sheet' in sys.argv:   # every kind in a row, every expression in a column: for looking them over
    exprs = ['happy', 'normal', 'tired', 'very-tired', 'exhausted']
    sheet = Image.new('RGB', (256 * len(exprs), 256 * len(kinds)), (10, 10, 12))
    for r, k in enumerate(kinds):
        for c, e in enumerate(exprs):
            im = Image.open(os.path.join(OUT, '%s-%s.webp' % (k, e))).convert('RGBA')
            sheet.paste(im, (c * 256, r * 256 + 256 - im.size[1]), im)
    sheet.save(sys.argv[sys.argv.index('--sheet') + 1])
