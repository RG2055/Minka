"""Nogurumiņi as bed toys: kalendars/assets/rooms/beds/acc-toy-nb-<kind>-<colour>.webp.
Green/yellow/orange/red are the creatures' own renders (happy/normal/tired/exhausted);
blue is the green one with only its green fur turned blue. Run from the repo root."""
import colorsys
from PIL import Image

KINDS = 'aksi antenas asns astonis cekuls koro lacis lumo mizi pele pufs zakis'.split()
COLOURS = [('g', 'happy'), ('y', 'normal'), ('o', 'tired'), ('r', 'exhausted'), ('b', 'happy')]
W = 128  # file width; the bed draws it at ~60 css px, so 2x


def blue(im):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if .375 < h < .52 and s > .25:  # mint fur only; eyes, blush, horns, leaves stay
                r2, g2, b2 = colorsys.hsv_to_rgb(.56 + (h - .42) * .4, s, v)
                px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return im


for k in KINDS:
    for c, mood in COLOURS:
        im = Image.open(f'kalendars/assets/butnes/{k}-{mood}.webp').convert('RGBA')
        im = im.crop(im.getbbox())
        im = im.resize((W - 8, round(im.height * (W - 8) / im.width)), Image.LANCZOS)
        if c == 'b': im = blue(im)
        out = Image.new('RGBA', (W, im.height + 8), (0, 0, 0, 0))
        out.alpha_composite(im, (4, 4))
        out.save(f'kalendars/assets/rooms/beds/acc-toy-nb-{k}-{c}.webp', 'WEBP', quality=82, method=6)
