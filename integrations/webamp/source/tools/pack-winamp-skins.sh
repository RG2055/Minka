#!/usr/bin/env sh
# Packs the Winamp 5 skins from the Winamp source tree
# (Src/resources/skins: Winamp Modern, Bento, Big Bento, Nokia) into
# public/skins/modern/ so the player can offer them as built-in Modern skins.
#
#   WINAMP_SRC=~/.vibearound/workspaces/winamp-src sh tools/pack-winamp-skins.sh
#
# Bento borrows XML, scripts and art from "Big Bento" (../Big Bento/...), so
# both folders go into one archive; the player picks the folder (variant).
set -eu
SRC="${WINAMP_SRC:-$HOME/.vibearound/workspaces/winamp-src}/Src/resources/skins"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/skins/modern"
mkdir -p "$OUT"
rm -f "$OUT"/*.wal "$OUT"/*.zip
( cd "$SRC/Winamp Modern" && zip -qr -X "$OUT/winamp-modern.wal" . -x '.*' )
( cd "$SRC" && zip -qr -X "$OUT/bento.zip" Bento "Big Bento" -x '*/.*' )
cp "$SRC/Nokia/Nokia_Edition.wal" "$OUT/nokia-edition.wal"
ls -la "$OUT"
