#!/usr/bin/env python3
"""The mood card's sky picture (Noskaņa X, kalendars/js/page/mood-trend.js).

Source: a generated picture made for this card (1918 x 820): black sky
above, a cyan ribbon of light through the middle, cream-lit cumulus at both
sides and below, dark under them. Its colours are already the card's (blue,
cyan, cream, no purple), so it is only resized and re-encoded here.
mood-trend.js places it so the ribbon runs behind the face and the dark
bottom lies behind the curve, and writes the ASCII characters over it.

  kalendars/assets/mood-sky-v1.webp   1440 px wide

Run: python3 scripts/build-mood-sky.py path/to/source.webp   (needs Pillow only)
"""
import sys
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / 'kalendars' / 'assets' / 'mood-sky-v1.webp'


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Image.open(sys.argv[1]).convert('RGB')
    w = 1440
    img = src.resize((w, round(src.height * w / src.width)), Image.LANCZOS)
    img.save(OUT, 'WEBP', quality=82, method=6)
    print(OUT, img.size, OUT.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
