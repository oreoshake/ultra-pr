#!/usr/bin/env bash
# Renders extension icons and Chrome Web Store images from assets/ using headless Chrome.
# Usage: scripts/render-assets.sh   (set CHROME to override the browser binary)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# render <url> <width> <height> <out.png> [transparent]
render() {
  local bg=()
  [[ "${5:-}" == transparent ]] && bg=(--default-background-color=00000000)
  "$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=1 --user-data-dir="$TMP/profile" ${bg[@]+"${bg[@]}"} \
    --window-size="$2,$3" --screenshot="$4" "$1" >/dev/null 2>&1
}

# Icons: render the SVG through an <img> wrapper so it fills the viewport at exact size.
for size in 16 32 48 128; do
  svg="$ROOT/assets/icon.svg"
  (( size <= 32 )) && svg="$ROOT/assets/icon-small.svg"
  cat > "$TMP/icon-$size.html" <<EOF
<!doctype html><html><body style="margin:0;background:transparent"><img src="file://$svg" width="$size" height="$size" style="display:block"></body></html>
EOF
  render "file://$TMP/icon-$size.html" "$size" "$size" "$ROOT/icons/icon$size.png" transparent
done

# Store images must be opaque (no alpha), so these are written as JPEG.
store() {
  render "file://$ROOT/assets/$1.html" "$2" "$3" "$TMP/$1.png"
  sips -s format jpeg -s formatOptions 92 "$TMP/$1.png" --out "$ROOT/store/$1.jpg" >/dev/null
}
store promo-small 440 280
store promo-marquee 1400 560
store screenshot-1 1280 800

echo "Rendered icons/ and store/"
