#!/bin/bash
# preview-group.sh frames_dir x0 y0 w h  ->  frames_dir/preview.mp4 (the group as the page plays it)
set -e
T=$(mktemp -d)
python3 "$(dirname "$0")/preview_group.py" "$1" "$2" "$3" "$4" "$5" "$T"
ffmpeg -v error -y -framerate 24 -i "$T/p%04d.png" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" "$1/preview.mp4"
rm -r "$T"
