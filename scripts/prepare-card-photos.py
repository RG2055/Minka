#!/usr/bin/env python3
"""Card photos: crop each source photo to the 16:9 card picture around its
focal point and encode WebP into kalendars/data/skins/skin-<id>.webp.

    python3 scripts/prepare-card-photos.py <source-dir> [--proof OUT.png]

Cards are close to square and draw the picture centre/cover, so only the
middle of a 16:9 file is sure to show: the focal point is put there.
640x360 is sharp on a 2x screen at the largest card size (~250 CSS px).
Sources and licences: kalendars/data/skins/PIXABAY-SOURCES.md.
"""
import argparse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'kalendars' / 'data' / 'skins'
W, H = 640, 360

# id (source file stem) -> focal point (x, y as fractions of the source)
PHOTOS = {
    'daba-paparde': (.45, .5), 'daba-sunas': (.5, .5),
    'daba-lase': (.4, .45), 'daba-lapa': (.5, .45), 'daba-pienene': (.5, .55),
    'daba-sarma': (.55, .5), 'daba-sarmas-lapa': (.5, .5),
    'lv-riga-nakti': (.5, .55), 'lv-vecriga': (.5, .45), 'lv-kapas': (.5, .55),
    'lv-mezs': (.5, .5), 'lv-eglu-migla': (.5, .5), 'lv-ziema': (.5, .5),
    'gaisma-stikla-lode': (.5, .5), 'gaisma-zila-lode': (.5, .5), 'gaisma-bokeh': (.5, .5),
    'gaisma-stari': (.5, .5), 'gaisma-ledus': (.5, .5), 'gaisma-ella': (.5, .5),
    'ilu-meness': (.5, .45), 'ilu-ziemas-koki': (.5, .5), 'ilu-kalni': (.5, .5), 'ilu-ausma': (.5, .5),
    'pils-jugends-seja': (.5, .45), 'pils-jugends-fasade': (.5, .45), 'pils-balta-forma': (.5, .5),
    'pils-betona-loki': (.5, .5), 'pils-apla-logs': (.5, .5), 'pils-zelta-kupols': (.5, .5),
    'pils-vecriga-augsa': (.5, .5), 'pils-nakts-gaismas': (.5, .5),
    'mb-balkoni': (.5, .5), 'mb-vartu-klusums': (.5, .5), 'mb-spirale': (.5, .5),
    'mb-ziedi': (.5, .5),
    'mili-ezis': (.5, .5), 'mili-lapsens': (.45, .5), 'mili-zakis': (.5, .45), 'mili-calis': (.5, .5),
    'mili-vavere': (.5, .4), 'mili-pucite': (.5, .45),
    'spilgti-majas': (.5, .5), 'spilgti-lietussargi': (.5, .5), 'spilgti-tulpes': (.5, .5),
}


def crop(src, fx, fy):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = min(max(0, round(im.width * fx - W / 2)), im.width - W)
    y = min(max(0, round(im.height * fy - H / 2)), im.height - H)
    return im.crop((x, y, x + W, y + H))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src_dir')
    ap.add_argument('--proof')
    a = ap.parse_args()
    done = []
    for pid, (fx, fy) in PHOTOS.items():
        src = next(Path(a.src_dir).glob(pid + '.*'))
        im = crop(src, fx, fy)
        done.append((pid, im))
        if not a.proof:
            out = OUT / f'skin-{pid}.webp'
            im.save(out, 'WEBP', quality=80, method=6)
            print(pid, out.stat().st_size // 1024, 'KB')
    if a.proof:
        # What a square card shows: the middle 360x360 of each picture.
        sheet = Image.new('RGB', (6 * 190, ((len(done) + 5) // 6) * 190), (30, 30, 30))
        for i, (_, im) in enumerate(done):
            sq = im.crop(((W - H) // 2, 0, (W + H) // 2, H)).resize((180, 180), Image.LANCZOS)
            sheet.paste(sq, ((i % 6) * 190 + 5, (i // 6) * 190 + 5))
        sheet.save(a.proof)


if __name__ == '__main__':
    main()
