#!/usr/bin/env python3
"""Radiology pictures for /rad resident cards from reference images
(scripts/rad-src/*.png, greyscale crops): each is centred in the 16:9 card
picture, its background pushed to black, contrast stretched, then dithered
in fine 2×2 dots (Atkinson) in the same six inks as the drawn scenes
(build-dither-skins.py RTG_INKS) → kalendars/data/skins/skin-dither-rtg-<name>-<ink>.webp.
Run: python3 scripts/build-rad-photo-skins.py   (needs Pillow only)
"""
import importlib.util
from pathlib import Path
from PIL import Image, ImageOps

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
}
# Cards are about square and show the middle ~56 % of the 16:9 picture, so
# every object fits a 125×127-dot box in the centre.
BOX_W, BOX_H = 125, 127


def field_of(src, floor, gamma):
    im = Image.open(SRC / src).convert('L')
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


def main():
    for name, (src, floor, gamma) in PICS.items():
        field = field_of(src, floor, gamma)
        for tone, ink, paper in dsk.RTG_INKS:
            sid = 'rtg-' + name + '-' + tone
            dsk.save_fine(sid, lambda x, y, f=field: f[min(H - 1, int(y * H))][min(W - 1, int(x * W))], ink, paper)


if __name__ == '__main__':
    main()
