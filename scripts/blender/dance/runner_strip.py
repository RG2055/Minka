"""The runner game's creature (kalendars/js/page/mk-runner.js): a short strip of frames per Nogurumiņš, cut from
the dance's rendered frames (scripts/render-round-dance.sh): 12 of the bounce (it runs: a hop a step), 12 of the
jump with the arms out, 6 of the deep squash (a landing, a bump). One row, every frame cropped alike, 128 px tall
(the game draws it about 60 px tall; twice that for dense screens). The dock's icon is one bounce frame.

    python3 scripts/blender/dance/runner_strip.py            # writes kalendars/assets/butnes/runner-*.webp
"""
import os
import sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
SRC = os.path.join(ROOT, 'scripts', 'blender', 'rg-mascot-round2')
OUT = os.path.join(ROOT, 'kalendars', 'assets', 'butnes')
KINDS = {'pufs': 'low', 'koro': 'high', 'antenas': 'mid'}
FRAMES = list(range(0, 12)) + list(range(288, 300)) + list(range(326, 332))   # run, jump, squash
TALL = 128


def frame(kind, n):
    return Image.open(os.path.join(SRC, kind, '%s-%s-r%03d.png' % (kind, KINDS[kind], n))).convert('RGBA')


def main():
    # one box for all three kinds and every frame used, so the game needs one set of numbers
    box = None
    for kind in KINDS:
        for n in FRAMES:
            b = frame(kind, n).split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    x0, y0, x1, y1 = box[0] - 2, box[1] - 2, box[2] + 2, box[3] + 2
    w = round((x1 - x0) * TALL / (y1 - y0))
    for kind in KINDS:
        strip = Image.new('RGBA', (w * len(FRAMES), TALL))
        for i, n in enumerate(FRAMES):
            # scaled on premultiplied colour: no dark edge round the fur
            f = frame(kind, n).crop((x0, y0, x1, y1)).convert('RGBa').resize((w, TALL), Image.LANCZOS).convert('RGBA')
            strip.paste(f, (i * w, 0))
        strip.save(os.path.join(OUT, 'runner-%s.webp' % kind), 'WEBP', quality=78, method=6)
    # the dock's icon: koro mid-bounce, 72 px (shown at about 24)
    icon = frame('koro', 4).crop((x0, y0, x1, y1)).convert('RGBa').resize((round(w * 72 / TALL), 72), Image.LANCZOS).convert('RGBA')
    icon.save(os.path.join(OUT, 'runner-icon.webp'), 'WEBP', quality=84, method=6)
    print('frame %dx%d, %d frames (run 0-11, jump 12-23, squash 24-29)' % (w, TALL, len(FRAMES)))


if __name__ == '__main__':
    sys.exit(main())
