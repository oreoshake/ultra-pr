#!/usr/bin/env bash
# Zips the files Chrome needs into dist/ for upload to the Chrome Web Store.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$ROOT/manifest.json")"
OUT="$ROOT/dist/ultra-pr-$VERSION.zip"

mkdir -p "$ROOT/dist"
rm -f "$OUT"
cd "$ROOT"
zip -qr "$OUT" manifest.json src icons LICENSE -x '.*'
echo "$OUT"
