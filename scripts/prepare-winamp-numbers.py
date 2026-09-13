#!/usr/bin/env python3
"""Build the Winamp time-display sprite the player card face masks its digits
with:

  kalendars/assets/winamp/numbers.png   11 cells of 9x13, digits in the alpha
                                        channel, unlit LCD dots kept faint

Source is NUMBERS.BMP from the classic Winamp 2.91 base skin, the same file
Webamp ships (webamp/packages/webamp/assets/skins/base-2.91.wsz). The sprite
keeps its original pixels; only the colours move into alpha so the card can
tint the digits and so the mask never depends on `mask-mode: luminance`, which
older Windows browsers ignore — that is what used to turn the timer into pale
mush.

Usage: python3 scripts/prepare-winamp-numbers.py path/to/base-2.91.wsz
"""
import io
import sys
import zipfile
from pathlib import Path
from PIL import Image

LIT = (0, 248, 0)        # a lit LCD pixel in the original sprite
GRID = (24, 33, 41)      # unlit cells: Winamp draws them as a faint dot grid
GRID_ALPHA = 46          # enough to read as an LCD, too little to fight the digits

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'base-2.91.wsz')
out = Path('kalendars/assets/winamp/numbers.png')

if src.suffix.lower() in ('.wsz', '.zip'):
    with zipfile.ZipFile(src) as skin:
        name = next(n for n in skin.namelist() if n.upper().endswith('NUMBERS.BMP'))
        img = Image.open(io.BytesIO(skin.read(name)))
else:
    img = Image.open(src)
img = img.convert('RGBA')
if img.size != (99, 13):
    raise SystemExit('NUMBERS.BMP should be 99x13 (11 cells of 9x13), got %sx%s' % img.size)

pixels = img.load()
mask = Image.new('RGBA', img.size, (255, 255, 255, 0))
target = mask.load()
for y in range(img.height):
    for x in range(img.width):
        rgb = pixels[x, y][:3]
        if rgb == LIT:
            target[x, y] = (255, 255, 255, 255)
        elif rgb == GRID:
            target[x, y] = (255, 255, 255, GRID_ALPHA)

out.parent.mkdir(parents=True, exist_ok=True)
mask.save(out, optimize=True)
print('wrote %s (%sx%s)' % (out, mask.width, mask.height))
