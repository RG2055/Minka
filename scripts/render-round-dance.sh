#!/bin/bash
# The three original Nogurumiņi's group dance (scripts/blender/dance/choreo.py -> rg_master.py --scene round), every
# frame of the four phrases; frames already there are kept (a stopped run goes on).
cd "$(dirname "$0")/.." || exit 1
B="$HOME/Applications/Blender.app/Contents/MacOS/Blender"; O=scripts/blender/rg-mascot-round2
for kl in "pufs low" "koro high" "antenas mid"; do   # (scripts/render-round-dance.sh E: only koro's close-up)
  [ "$1" = E ] && break
  set -- $kl
  mkdir -p "$O/$1"
  "$B" -b -P scripts/blender/rg_master.py -- "$O/$1" --kind $1 --scene round --moves scripts/blender/dance/choreo-$1.json --level $2 --layer body --size 224 --samples 24 --fur MEDIUM 2>&1 | grep -E "Error|Traceback" | head -3
  echo "$1 $(ls "$O/$1" | wc -l)"
done
# koro's close-up (phrase E): the page shows it up to 1.85 times as big, so twice the pixels and the original's dense
# fur; the grin (its grillz) is built into the creature, so the grinning frames and the others are two runs
E=$(python3 -c "print(','.join('r%03d' % i for i in list(range(0, 24)) + list(range(72, 96))))")
G=$(python3 -c "print(','.join('r%03d' % i for i in range(24, 72)))")
mkdir -p "$O/koroE"
for only in "$E" "$G"; do
  "$B" -b -P scripts/blender/rg_master.py -- "$O/koroE" --kind koro --scene round --moves scripts/blender/dance/choreo-koro-E.json --level high --layer body --size 448 --samples 32 --fur HIGH --only "$only" 2>&1 | grep -E "Error|Traceback" | head -3
done
echo "koroE $(ls "$O/koroE" | wc -l)"
