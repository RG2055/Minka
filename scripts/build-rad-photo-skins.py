#!/usr/bin/env python3
"""Radiology pictures for /rad resident cards from reference images
(scripts/rad-src/*.png, greyscale crops): each is centred in the 16:9 card
picture, its background pushed to black, contrast stretched, then dithered
in fine 2×2 dots (Atkinson) in the same six inks as the drawn scenes
(build-dither-skins.py RTG_INKS) → kalendars/data/skins/skin-dither-rtg-<name>-<ink>.webp.
Run: python3 scripts/build-rad-photo-skins.py   (needs Pillow only)
"""
import importlib.util
import math
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'rad-src'
spec = importlib.util.spec_from_file_location('dsk', ROOT / 'scripts' / 'build-dither-skins.py')
dsk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dsk)

W, H = 240, 135
# name: (source file, background floor 0..255, gamma)
PICS = {
    'galvaskauss': ('galvaskauss.png', 28, 1.15),
    'galvaskauss-sanis': ('galvaskauss-sanis.png', 95, 1.1),
    'skelets': ('skelets.png', 40, 1.0),
    # Real radiographs and CT slices (CC0 / public domain, see rad-src/SOURCES.md).
    'krutis': ('rtg-krutis.png', 40, 1.25, 'sharp'),
    'ctkrutis': ('ct-krutis.png', 30, 1.1),
    'ct': ('ct-vederis.png', 30, 1.1),
    'ctgalva': ('ct-galva.png', 30, 1.2),
    'plauksta': ('rtg-plauksta.png', 70, 1.2, 'sharp'),
}
# Cards are about square and show the middle ~56 % of the 16:9 picture, so
# every object fits a 125×127-dot box in the centre.
BOX_W, BOX_H = 125, 127


def field_of(src, floor, gamma, prep=''):
    im = Image.open(SRC / src).convert('L')
    if prep == 'sharp':          # radiographs: bring out ribs/bones before the dots eat them
        im = im.filter(ImageFilter.UnsharpMask(radius=6, percent=260, threshold=1))
    im = ImageOps.autocontrast(im, cutoff=1)
    f = min(BOX_W / im.width, BOX_H / im.height)
    w, h = max(1, round(im.width * f)), max(1, round(im.height * f))
    im = im.resize((w, h), Image.LANCZOS)
    canvas = Image.new('L', (W, H), 0)
    canvas.paste(im, ((W - w) // 2, (H - h) // 2))
    px = canvas.load()
    out = []
    for y in range(H):
        row = []
        for x in range(W):
            v = max(0.0, (px[x, y] - floor) / (255 - floor)) ** gamma
            row.append(max(0.0, min(1.0, v * dsk.card_mask((x + .5) / W, (y + .5) / H))))
        out.append(row)
    return out


# CT perfusion maps from the real head CT slice: the anatomy (skull, cortex,
# ventricles) comes from the slice, the colours from a jet map as in the
# perfusion software; dithered between neighbouring colours (Bayer 4×4).
JET = ['#0b1f8f', '#1f6bff', '#22d3ee', '#35d05a', '#f5e042', '#ff3b2f']


def save_perf(kind):
    im = Image.open(SRC / 'ct-galva.png').convert('L')
    im = ImageOps.autocontrast(im, cutoff=1)
    f = min(BOX_W / im.width, BOX_H / im.height)
    w, h = max(1, round(im.width * f)), max(1, round(im.height * f))
    im = im.resize((w, h), Image.LANCZOS)
    ox, oy = (W - w) // 2, (H - h) // 2
    src = im.load()
    pal = [dsk.hexrgb(c) for c in JET]
    img = Image.new('RGB', (W, H), (4, 5, 9))
    px = img.load()
    for y in range(h):
        for x in range(w):
            g = src[x, y] / 255
            X, Y = (x / w - .5), (y / h - .5)
            if g > .8:                                   # skull: only its outer edge, thin
                outer = any(src[min(w - 1, max(0, x + dx)), min(h - 1, max(0, y + dy))] / 255 < .12 for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)))
                if outer:
                    px[x + ox, y + oy] = pal[2]
                continue
            if g < .36:                                  # air, CSF, ventricles stay dark
                continue
            noise = (math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
            if kind == 'cbf':                            # flow: grey matter bright, a low territory on the viewer's left
                v = .25 + 1.2 * max(0.0, g - .42) + .15 * noise
                territory = ((X + .2) / .2) ** 2 + ((Y + .05) / .28) ** 2    # a soft low-flow territory, viewer's left
                if territory < 1:
                    v *= .35 + .65 * territory
            elif kind == 'tmax':                         # delayed perfusion: one hemisphere red
                v = .88 + .1 * noise if X < 0 else .3 + .25 * noise + .3 * max(0.0, g - .45)
            else:                                        # volume: blue, cortex and vessels light up
                v = .12 + .3 * noise + (.6 if g > .62 else 0)
            v = max(0.0, min(.999, v))
            lvl = v * (len(pal) - 1)
            lo = int(lvl)
            pick = lo + 1 if (lvl - lo) * 16 > dsk.BAYER4[y % 4][x % 4] + .5 else lo
            if pick == 0 and (x + y) % 2:
                continue
            px[x + ox, y + oy] = pal[min(pick, len(pal) - 1)]
    img = img.resize((480, 270), Image.NEAREST)
    path = dsk.OUT / f'skin-dither-rtg-perf-{kind}.webp'
    img.save(path, 'WEBP', lossless=True, method=6)
    print(path.relative_to(ROOT), path.stat().st_size, 'bytes')


def main():
    for kind in ('cbf', 'tmax', 'cbv'):
        save_perf(kind)
    for name, spec in PICS.items():
        field = field_of(*spec)
        for tone, ink, paper in dsk.RTG_INKS:
            sid = 'rtg-' + name + '-' + tone
            dsk.save_fine(sid, lambda x, y, f=field: f[min(H - 1, int(y * H))][min(W - 1, int(x * W))], ink, paper)


if __name__ == '__main__':
    main()
