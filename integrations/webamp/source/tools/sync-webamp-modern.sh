#!/usr/bin/env sh
# Builds webamp-modern (the x5066 fork) and copies what the player needs:
#   src/vendor/webamp-modern/   the engine's ES modules + CSS (bundled by Vite,
#                               lazily, on the first Modern skin)
#   public/modern/assets/freeform/  the engine's runtime assets (built-in
#                               Wasabi XUI fallbacks), served as files
#
#   WEBAMP_MODERN=~/.vibearound/workspaces/x5066/packages/webamp-modern sh tools/sync-webamp-modern.sh
set -eu
ENGINE="${WEBAMP_MODERN:-$HOME/.vibearound/workspaces/x5066/packages/webamp-modern}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
( cd "$ENGINE" && npx snowpack build >/dev/null 2>&1 )
rm -rf "$ROOT/src/vendor/webamp-modern"
mkdir -p "$ROOT/src/vendor/webamp-modern"
rsync -a --exclude 'assets' --exclude '*.html' --exclude 'index.js' --exclude 'tests.js' \
  --exclude 'maxplore.js' --exclude 'progress.js' --exclude 'clip_path.js' --exclude 'dropTarget.js' \
  --exclude 'xp' --exclude '*.map' --exclude 'test.html.disabled' \
  "$ENGINE/build/" "$ROOT/src/vendor/webamp-modern/"
rm -rf "$ROOT/public/modern"
mkdir -p "$ROOT/public/modern/assets"
rsync -a "$ENGINE/build/assets/freeform/" "$ROOT/public/modern/assets/freeform/"
du -sh "$ROOT/src/vendor/webamp-modern" "$ROOT/public/modern"
