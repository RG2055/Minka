#!/usr/bin/env python3
"""Turn a (dithered or plain) video GIF into a small loader background.

The source is reduced to 480x270, 12.5 fps, its mid-grey ground is pushed to
black, and it is dithered again as 1-bit (Bayer 8x8), so it stays crisp when
the page scales it up with `image-rendering: pixelated`. The clip plays
forward and back, so the loop has no jump.

  python3 scripts/build-loader-gif.py SOURCE.gif data/loader-NAME.gif \
      [--start 40] [--end 240] [--black .50] [--white .97]

Chrome animates GIFs off the main thread, so the loader keeps moving while
the schedule is being built behind it.
"""
import argparse
import os
from PIL import Image, ImageFilter

W, H = 480, 270
B8 = [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]]


def dither(frame, black, white):
    g = frame.convert('L').filter(ImageFilter.BoxBlur(1)).resize((W, H), Image.BOX)
    lut = [max(0, min(255, int((v / 255 - black) / (white - black) * 255))) for v in range(256)]
    px = g.point(lut).load()
    out = Image.new('1', (W, H))
    op = out.load()
    for y in range(H):
        row = B8[y & 7]
        for x in range(W):
            op[x, y] = 255 if px[x, y] > (row[x & 7] + .5) * 4 else 0
    return out.convert('P')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('out')
    ap.add_argument('--start', type=int, default=40)
    ap.add_argument('--end', type=int, default=240)
    ap.add_argument('--step', type=int, default=2, help='source frames per output frame (25 fps -> 12.5)')
    ap.add_argument('--black', type=float, default=.50, help='grey level that becomes black')
    ap.add_argument('--white', type=float, default=.97)
    a = ap.parse_args()
    src = Image.open(a.source)
    seq = list(range(a.start, min(a.end, src.n_frames), a.step))
    seq = seq + seq[-2:0:-1]                      # forward, then back: seamless
    frames = []
    for i in seq:
        src.seek(i)
        frames.append(dither(src, a.black, a.white))
    frames[0].save(a.out, save_all=True, append_images=frames[1:], duration=80 * a.step // 2,
                   loop=0, optimize=True, disposal=1)
    print(a.out, len(frames), 'frames', round(os.path.getsize(a.out) / 1024), 'KB')


if __name__ == '__main__':
    main()
