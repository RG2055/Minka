#!/usr/bin/env python3
"""Turn a rendered glass ring (on a white background) into the two static
layers the mood card's radio badge uses:

  kalendars/assets/radio-glass-base.webp   glass body, white keyed to alpha
  kalendars/assets/radio-glass-gloss.webp  only the bright reflections

Usage: python3 scripts/prepare-radio-glass.py kalendars/assets/radio-glass-src.png
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'kalendars/assets/radio-glass-src.png')
out_dir = Path('kalendars/assets')
SIZE = 512

img = Image.open(src).convert('RGBA')
# Square crop around the centre, then a fixed working size.
w, h = img.size
side = min(w, h)
img = img.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side)).resize((SIZE, SIZE), Image.LANCZOS)

px = img.load()
base = Image.new('RGBA', (SIZE, SIZE))
gloss = Image.new('RGBA', (SIZE, SIZE))
bp, gp = base.load(), gloss.load()
for y in range(SIZE):
    for x in range(SIZE):
        r, g, b, a = px[x, y]
        lum = (r * 299 + g * 587 + b * 114) / 1000
        mn, mx = min(r, g, b), max(r, g, b)
        sat = mx - mn
        # Body: anything that is not plain white/very light grey. Colour and
        # darkness both count, so the blue rims and grey shading stay while the
        # white interior and background vanish.
        body = max(0.0, (255 - mn) / 255.0)
        body = min(1.0, body * 1.35 + sat / 255.0 * 0.8)
        if body < 0.06:
            body = 0.0
        bp[x, y] = (r, g, b, int(body * 255 * a / 255))
        # Gloss: the pure specular highlights only — bright and unsaturated.
        spec = max(0.0, (lum - 215) / 40.0) * (1.0 - min(1.0, sat / 60.0))
        # ...but not the flat white interior: require a bright neighbourhood edge.
        gp[x, y] = (255, 255, 255, int(min(1.0, spec) * 255 * a / 255))

# The flat white interior also scores as "spec"; keep only highlights that sit
# on the glass body by masking gloss with a blurred body alpha.
mask = base.split()[3].filter(ImageFilter.GaussianBlur(6)).point(lambda v: min(255, v * 3))
g_alpha = Image.composite(gloss.split()[3], Image.new('L', (SIZE, SIZE), 0), mask)
gloss.putalpha(g_alpha)

# Soften the keyed edge a touch so the rim does not look cut out.
base.putalpha(base.split()[3].filter(ImageFilter.GaussianBlur(0.6)))

out_dir.mkdir(parents=True, exist_ok=True)
base.save(out_dir / 'radio-glass-base.webp', 'WEBP', quality=90, method=6)
gloss.save(out_dir / 'radio-glass-gloss.webp', 'WEBP', quality=90, method=6)
print('wrote', out_dir / 'radio-glass-base.webp', out_dir / 'radio-glass-gloss.webp')
