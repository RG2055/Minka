#!/bin/bash
# vendor/material-web/md-web-mood.js: Material Web's ripple and focus ring in one small file (IIFE, minified).
#   scripts/build-md-web.sh /path/to/a/folder/with/node_modules   (npm i --ignore-scripts @material/web@2.5.0 esbuild)
# The packages are not kept in the repo; the built file and its licences are.
set -e
cd "$(dirname "$0")/.." || exit 1
PKG="${1:?a folder holding node_modules with @material/web and esbuild}"
mkdir -p vendor/material-web
NODE_PATH="$PKG/node_modules" "$PKG/node_modules/.bin/esbuild" scripts/vendor-src/md-web-mood.entry.js --bundle --minify --format=iife --target=es2020 \
  --legal-comments=none --outfile=vendor/material-web/md-web-mood.js
cp "$PKG/node_modules/@material/web/LICENSE" vendor/material-web/material-web.LICENSE.txt
cp "$PKG/node_modules/lit/LICENSE" vendor/material-web/lit.LICENSE.txt
ls -la vendor/material-web/
