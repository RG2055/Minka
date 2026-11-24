#!/bin/bash
# The group dance's sheets for the page (js/radio-dancers.js): per creature one WebP sheet of its frames, 16 to a row,
# every frame cropped alike: 384 (4 phrases x 8 beats x 12 steps). koro's close-up (E, 96 frames, rendered twice as
# big: the page grows it up to 1.6 times) is a sheet of its own, cropped tight round it; where that crop sits in the
# common frame is written into the page (EBOX), with the frame's own size (FRAME). And a preview made as the page plays it.
# Each sheet in two sizes, for what a screen can show (the page draws a dancer about 69 x 59 px): -1x at half the
# rendered frame for ordinary screens and weak computers, -2x at three quarters for dense ones. At the full size the
# four sheets were 163 MB of pixels once decoded, and Chrome held them several times over (measured 2026-11-24:
# the tab +350 MB and the GPU process +500 MB while they danced); these are 41 and 92 MB.
#   scripts/render-round-dance.sh   (frames)   then   scripts/build-dance.sh
set -e
cd "$(dirname "$0")/.." || exit 1
O=scripts/blender/rg-mascot-round2
TMPD=$(mktemp -d)
bbox() { for d in "$@"; do ffmpeg -v info -pattern_type glob -i "$O/$d/*.png" -vf alphaextract,bbox=min_val=8 -f null - 2>&1; done \
  | grep -o "x1:[0-9]* x2:[0-9]* y1:[0-9]* y2:[0-9]*" | awk -F'[: ]' 'BEGIN{a=9999;b=9999;c=0;d=0} {if($2<a)a=$2; if($6<b)b=$6; if($4>c)c=$4; if($8>d)d=$8} END{print a, b, c, d}'; }
read X0 Y0 X1 Y1 < <(bbox pufs koro antenas)
X0=$((X0 - 2)); Y0=$((Y0 - 2)); W=$(((X1 + 2 - X0 + 1) / 2 * 2)); H=$(((Y1 + 2 - Y0 + 1) / 2 * 2))
echo "frame ${W}x${H} (crop at $X0,$Y0)"
# frames, their crop, a frame's size on the sheet, the tiling, the quality, the file: every frame scaled by itself
# (never across two) and on premultiplied colour (no dark edge round the fur)
sheet() {
  ffmpeg -v error -y -start_number 0 -i "$1" -vf "crop=$2,format=gbrap,premultiply=inplace=1,scale=$3:flags=lanczos,unpremultiply=inplace=1,tile=$4" -frames:v 1 -pix_fmt rgba "$TMPD/s.png"
  cwebp -quiet -q "$5" -alpha_q 90 -m 6 "$TMPD/s.png" -o "$6"
}
for kl in "pufs low" "koro high" "antenas mid"; do   # three dance (the user)
  set -- $kl
  sheet "$O/$1/$1-$2-r%03d.png" "$W:$H:$X0:$Y0" "$((W / 2)):$((H / 2))" 16x24 74 "kalendars/assets/butnes/dance-$1-1x.webp"
  sheet "$O/$1/$1-$2-r%03d.png" "$W:$H:$X0:$Y0" "$(((W * 3 + 2) / 4)):$((H * 3 / 4))" 16x24 74 "kalendars/assets/butnes/dance-$1-2x.webp"
done
# the close-up: its own tight box (even, so it is whole pixels of the common frame); coming near the camera it may
# reach past the common frame: the page shows it in a box of its own
read A B C D < <(bbox koroE)
EX=$(( A > 2 ? (A - 2) / 2 : 0 )); EY=$(( B > 2 ? (B - 2) / 2 : 0 ))
EW=$(( (C + 3) / 2 - EX )); EH=$(( (D + 3) / 2 - EY ))
echo "close-up ${EW}x${EH} at $((EX - X0)),$((EY - Y0)) of the frame (twice the pixels)"
sheet "$O/koroE/koro-high-r%03d.png" "$((EW * 2)):$((EH * 2)):$((EX * 2)):$((EY * 2))" "$EW:$EH" 16x6 76 "kalendars/assets/butnes/dance-koro-e-1x.webp"
sheet "$O/koroE/koro-high-r%03d.png" "$((EW * 2)):$((EH * 2)):$((EX * 2)):$((EY * 2))" "$((EW * 3 / 2)):$(((EH * 3 + 1) / 2))" 16x6 76 "kalendars/assets/butnes/dance-koro-e-2x.webp"
# where the grillz are (for the page's glints): the white of the teeth below the eyes, the middle of the grinning frames
read TX TY TW TH < <(python3 "$(dirname "$0")/blender/dance/teeth_box.py" "$O/koroE" "$X0" "$Y0")
echo "teeth ${TW}x${TH} at $TX,$TY"
sed -i '' -E "s/var FRAME = \\[[0-9, ]*\\]/var FRAME = [$W, $H]/" js/radio-dancers.js
sed -i '' -E "s/var EBOX = \[[-0-9, ]*\], TEETH = \[[-0-9, ]*\]/var EBOX = [$((EX - X0)), $((EY - Y0)), $EW, $EH], TEETH = [$TX, $TY, $TW, $TH]/" js/radio-dancers.js
rm -r "$TMPD"
"$(dirname "$0")/blender/dance/preview-group.sh" "$O" "$X0" "$Y0" "$W" "$H"
ls -la kalendars/assets/butnes/dance-*.webp "$O/preview.mp4"
