"""Pack the rendered creatures (scripts/blender/rg_master.py -> scripts/blender/rg-mascot-3/*.png) for the app.

For each kind: its five faces (the first frame of each step's film: <kind>-<step>-f00.png) and the five pictures
where it holds a drink (the last frame: -f37), all cut by one box (the kind's own: what holds all ten, the same
margin left and right, so the creature stays centred over its buttons and the pictures swap in place), 256 px wide
WebP in kalendars/assets/butnes/: <kind>-<expression>.webp and <kind>-hold-<step>.webp.
The drinks (dz-<drink>-<pose>-f37.png, rendered alone and already cut by the paw in front of them) are cut by one box
of their own, and for each kind the place of that box on the kind's picture is printed (KIND_DZ, for
kalendars/js/page/mk-side-faces.js), with the kinds' shapes (KIND_AR). A kind whose frame stands higher (RISE in
rg_master.py) sees the drink that much lower. Needs Pillow and cwebp.

    python3 scripts/build-butnes.py [--sheet OUT.png] [--write]

--write puts the printed KIND_AR and KIND_DZ into mk-side-faces.js (the kinds built now; the others' entries stay).
"""
import glob
import os
import re
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('BUTNES_SRC') or os.path.join(ROOT, 'scripts', 'blender', 'rg-mascot-3')   # BUTNES_SRC: another folder of renders, for a part of them
OUT = os.path.join(ROOT, 'kalendars', 'assets', 'butnes')
STEPS = {'low': 'happy', 'mid': 'normal', 'high': 'tired', 'crit': 'very-tired', 'exh': 'exhausted'}
master = open(os.path.join(ROOT, 'scripts', 'blender', 'rg_master.py')).read()
RISE = eval(re.search(r'^RISE = (\{.*?\})', master, re.M).group(1))
ORTHO = float(re.search(r"cam\.data\.type, cam\.data\.ortho_scale = 'ORTHO', ([0-9.]+)", master).group(1))


def bbox(path):
    return Image.open(path).getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()


def union(a, b):
    return b if a is None else a if b is None else (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def webp(src, box, width, out):
    subprocess.run(['cwebp', '-quiet', '-q', '84', '-alpha_q', '90', '-m', '6', '-crop', str(box[0]), str(box[1]), str(box[2] - box[0]), str(box[3] - box[1]),
                    '-resize', str(width), '0', src, '-o', out], check=True)
    return os.path.getsize(out)


files = sorted(f for f in glob.glob(os.path.join(SRC, '*-f[0-9][0-9].png')) if os.path.getsize(f) > 1000)   # an empty file is a frame being rendered
kinds = sorted({os.path.basename(f).split('-')[0] for f in files} - {'dz'})
kinds = [k for k in kinds if sum(1 for f in files if os.path.basename(f).startswith(k + '-')) == 2 * len(STEPS)]   # only kinds that are whole
assert kinds, 'no renders in ' + SRC
os.makedirs(OUT, exist_ok=True)
total, pad, ar, boxes = 0, 4, {}, {}

# the drinks: one box for all of them
drinks = sorted(f for f in files if os.path.basename(f).startswith('dz-') and f.endswith('-f37.png'))
dbox = None
for f in drinks:
    dbox = union(dbox, bbox(f))
if dbox:
    dbox = (max(0, dbox[0] - 2), max(0, dbox[1] - 2), dbox[2] + 2, dbox[3] + 2)

for kind in kinds:
    mine = [f for f in files if os.path.basename(f).startswith(kind + '-')]
    side = Image.open(mine[0]).size[0]
    down = RISE.get(kind, 0.0) * side / ORTHO   # this kind's frame stands higher: the drink is that many px lower in it
    box = None
    for f in mine:
        box = union(box, bbox(f))
    if dbox:   # the drink is part of the picture too
        box = union(box, (dbox[0], int(dbox[1] + down), dbox[2], int(dbox[3] + down + 1)))
    m = max(0, min(box[0], side - box[2]) - pad)   # the same margin left and right
    box = (m, max(0, box[1] - pad), side - m, min(side, box[3] + pad))
    w, h = box[2] - box[0], box[3] - box[1]
    for f in mine:
        _, step, frame = os.path.basename(f)[:-4].split('-')
        name = '%s-%s.webp' % (kind, STEPS[step]) if frame == 'f00' else '%s-hold-%s.webp' % (kind, step)
        total += webp(f, box, 256, os.path.join(OUT, name))
    ar[kind] = round(w / h, 2)
    if dbox:
        boxes[kind] = [round((dbox[0] - box[0]) / w * 100, 2), round((dbox[1] + down - box[1]) / h * 100, 2), round((dbox[2] - dbox[0]) / w * 100, 2)]
    print('butnes: %-8s crop %s of %d, aspect %.2f (w/h)' % (kind, box, side, w / h))

for f in drinks:
    _, drink, pose, _ = os.path.basename(f)[:-4].split('-')
    total += webp(f, dbox, 64, os.path.join(OUT, 'dz-%s-%s.webp' % (drink, pose)))
print('butnes: %d pictures of %d kinds, %d drink pictures, %d KB in all' % (sum(1 for f in files if not os.path.basename(f).startswith('dz-')), len(kinds), len(drinks), total // 1024))
print('KIND_AR = { ' + ', '.join('%s: %s' % (k, ('%.2f' % ar[k]).lstrip('0') if ar[k] < 1 else '%.2f' % ar[k]) for k in ar) + ' };')
print('KIND_DZ = { ' + ', '.join('%s: [%s]' % (k, ', '.join(str(v) for v in boxes[k])) for k in boxes) + ' };')

if '--write' in sys.argv:
    js = os.path.join(ROOT, 'kalendars', 'js', 'page', 'mk-side-faces.js')
    src = open(js, encoding='utf-8').read()
    for name, new, fmt in (('KIND_AR', ar, lambda v: ('%.2f' % v).lstrip('0') if v < 1 else '%.2f' % v), ('KIND_DZ', boxes, lambda v: '[' + ', '.join(str(x) for x in v) + ']')):
        m = re.search(r'var %s = \{(.*?)\};' % name, src)
        old = dict(re.findall(r'(\w+): (\[[^\]]*\]|[0-9.]+)', m.group(1)))
        old.update({k: fmt(v) for k, v in new.items()})
        src = src[:m.start()] + 'var %s = { %s };' % (name, ', '.join('%s: %s' % kv for kv in old.items())) + src[m.end():]
    open(js, 'w', encoding='utf-8').write(src)
    print('butnes: wrote KIND_AR and KIND_DZ into', os.path.relpath(js, ROOT))

if '--sheet' in sys.argv:   # every kind in a row: its five faces, then the five held ones with a drink on; for looking them over
    cols = [(e, None) for e in STEPS.values()] + [('hold-' + s, s) for s in STEPS]
    sheet = Image.new('RGB', (200 * len(cols), 180 * len(kinds)), (10, 10, 12))
    for r, k in enumerate(kinds):
        for c, (e, step) in enumerate(cols):
            im = Image.open(os.path.join(OUT, '%s-%s.webp' % (k, e))).convert('RGBA')
            if step and k in boxes:
                dz = os.path.join(OUT, 'dz-monsterultra-%s.webp' % (step if step in ('crit', 'exh') else 'low'))
                if os.path.exists(dz):
                    d = Image.open(dz).convert('RGBA')
                    dw = round(boxes[k][2] / 100 * im.size[0])
                    d = d.resize((dw, round(dw * d.size[1] / d.size[0])), Image.LANCZOS)
                    im.alpha_composite(d, (round(boxes[k][0] / 100 * im.size[0]), round(boxes[k][1] / 100 * im.size[1])))
            im = im.resize((190, round(190 * im.size[1] / im.size[0])), Image.LANCZOS)
            sheet.paste(im, (c * 200 + 5, r * 180 + 175 - im.size[1]), im)
    sheet.save(sys.argv[sys.argv.index('--sheet') + 1])
