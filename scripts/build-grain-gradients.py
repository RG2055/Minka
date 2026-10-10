#!/usr/bin/env python3
"""Grain gradients for card pictures: soft "sfumato" colour fields with a
film grain on top, the look of the grainy wallpapers going round in 2026.

Each picture is a few soft colour blobs on a ground, blurred into one field,
then a fine monochrome grain and a light vignette. Drawn here, nothing
downloaded; written as kalendars/data/skins/skin-<id>.webp (640x360).

    python3 scripts/build-grain-gradients.py [--proof OUT.png]
"""
import argparse
import random
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'kalendars' / 'data' / 'skins'
W, H = 640, 360

# id -> ground, [(x, y, radius, colour)] in fractions of the width / height
GRADIENTS = {
    'grain-kapu-ausma':   ('#2a140c', [(.25, .85, .7, '#c2541c'), (.7, .7, .5, '#f0a35a'), (.6, .2, .45, '#4a2416'), (.9, .95, .4, '#ffd9a0')]),
    'grain-sfumato':      ('#0b1f4a', [(.2, .3, .6, '#1f5fd6'), (.75, .75, .5, '#ff8a3d'), (.55, .45, .35, '#9cc8ff'), (.95, .1, .3, '#06122e')]),
    'grain-mints':        ('#0d3b34', [(.3, .7, .6, '#3ee0a0'), (.75, .3, .5, '#e8f5d8'), (.1, .1, .4, '#0a5a4c'), (.85, .9, .35, '#9ff0cc')]),
    'grain-grafits':      ('#141518', [(.35, .35, .55, '#5b6068'), (.7, .6, .35, '#d9dde3'), (.15, .9, .4, '#08090a'), (.85, .15, .3, '#9aa0a8')]),
    'grain-persiks':      ('#f3c9b1', [(.25, .3, .55, '#ff8f70'), (.75, .7, .55, '#ffe6cf'), (.6, .15, .35, '#ffb38a'), (.1, .95, .4, '#e8704f')]),
    'grain-okeans':       ('#03141c', [(.3, .65, .6, '#0b6e83'), (.7, .3, .45, '#27c3c9'), (.85, .85, .4, '#062a3a'), (.2, .1, .3, '#0d4a66')]),
    'grain-citrons':      ('#fff6c9', [(.3, .4, .55, '#f7e04a'), (.75, .75, .5, '#b8e86a'), (.8, .2, .35, '#ffffff'), (.1, .9, .35, '#f2b632')]),
    'grain-ogles':        ('#070504', [(.5, .85, .55, '#e0471c'), (.45, .6, .3, '#ffb347'), (.15, .2, .45, '#1a0b06'), (.85, .4, .3, '#7a1f0b')]),
}


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def field(ground, blobs, seed):
    small = Image.new('RGB', (160, 90), hexrgb(ground))
    for x, y, r, col in blobs:
        layer = Image.new('RGB', small.size, hexrgb(col))
        mask = Image.new('L', small.size, 0)
        d = ImageDraw.Draw(mask)
        rx, ry = r * 160, r * 160 * .8
        d.ellipse((x * 160 - rx, y * 90 - ry, x * 160 + rx, y * 90 + ry), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(r * 60))
        small = Image.composite(layer, small, mask)
    small = small.filter(ImageFilter.GaussianBlur(6))
    return small.resize((W, H), Image.BICUBIC)


def grain(im, seed, amount=22):
    random.seed(seed)
    noise = Image.effect_noise((W, H), amount).convert('RGB')        # grey around 128
    # Overlay-style: lighten and darken around mid grey, keeping the colour.
    lighter = ImageChops.add(im, ImageChops.subtract(noise, Image.new('RGB', (W, H), (128,) * 3)))
    darker = ImageChops.subtract(lighter, ImageChops.subtract(Image.new('RGB', (W, H), (128,) * 3), noise))
    return Image.blend(im, darker, .55)


def vignette(im):
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).ellipse((-W * .25, -H * .35, W * 1.25, H * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(60))
    return Image.composite(im, Image.blend(im, Image.new('RGB', (W, H), (0, 0, 0)), .28), mask)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--proof')
    a = ap.parse_args()
    done = []
    for i, (gid, (ground, blobs)) in enumerate(GRADIENTS.items()):
        im = vignette(grain(field(ground, blobs, i), i))
        done.append(im)
        if not a.proof:
            out = OUT / f'skin-{gid}.webp'
            im.save(out, 'WEBP', quality=82, method=6)
            print(gid, out.stat().st_size // 1024, 'KB')
    if a.proof:
        sheet = Image.new('RGB', (4 * 330, 2 * 190), (30, 30, 30))
        for i, im in enumerate(done):
            sheet.paste(im.resize((320, 180), Image.LANCZOS), ((i % 4) * 330 + 5, (i // 4) * 190 + 5))
        sheet.save(a.proof)


if __name__ == '__main__':
    main()
