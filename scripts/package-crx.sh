#!/usr/bin/env bash
# Builds a signed .crx in dist/ for Chrome Web Store verified uploads.
#
# Usage: scripts/package-crx.sh "op://<vault>/<item>/<field>"
#
# The private key is read from 1Password with `op read`. It's written to a
# temporary file only you can read, used to sign, and deleted on exit. Set
# OP_ACCOUNT if the key isn't in your default 1Password account.
# Set CHROME to use a Chrome other than /Applications/Google Chrome.app.
set -euo pipefail

if [ $# -ne 1 ] || [[ "$1" != op://* ]]; then
  echo "Usage: $0 \"op://<vault>/<item>/<field>\"" >&2
  exit 2
fi
KEY_REF="$1"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$ROOT/manifest.json")"
OUT="$ROOT/dist/ultra-pr-$VERSION.crx"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

umask 077
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Fetch the key, then normalize it to the PKCS#8 PEM Chrome expects. Only RSA
# keys work for verified uploads.
op read --out-file "$WORK/raw-key" "$KEY_REF" >/dev/null
if ! openssl rsa -in "$WORK/raw-key" -check -noout >/dev/null 2>&1; then
  echo "The key at $KEY_REF isn't a valid RSA private key. Verified uploads need RSA." >&2
  exit 1
fi
openssl pkey -in "$WORK/raw-key" -out "$WORK/key.pem"
rm -f "$WORK/raw-key"

# Pack only the files the extension ships, the same set as package.sh.
STAGE="$WORK/ultra-pr"
mkdir "$STAGE"
(cd "$ROOT" && cp -R manifest.json src icons LICENSE "$STAGE")
find "$STAGE" -name '.*' -delete

# A throwaway profile keeps this from handing off to a Chrome that's already open.
"$CHROME" --pack-extension="$STAGE" --pack-extension-key="$WORK/key.pem" \
  --user-data-dir="$WORK/profile" --no-message-box >/dev/null 2>&1 || true
if [ ! -s "$WORK/ultra-pr.crx" ]; then
  echo "Chrome didn't produce a .crx. Check that Chrome is at: $CHROME" >&2
  exit 1
fi

mkdir -p "$ROOT/dist"
mv "$WORK/ultra-pr.crx" "$OUT"
umask 022 && chmod 644 "$OUT"

# The public key's fingerprint, to compare with the key you gave the dashboard.
FINGERPRINT="$(openssl pkey -in "$WORK/key.pem" -pubout -outform DER | openssl dgst -sha256 | awk '{print $NF}')"
echo "$OUT"
echo "Public key SHA-256: $FINGERPRINT"
