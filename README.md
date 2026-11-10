# Ultra PR

A Chrome extension that keeps a GitHub pull request's **Conversation** and **Files changed** views open side by side in Chrome [split view](https://support.google.com/chrome/answer/16971124).

- Open a PR's Conversation and its Files changed opens on the right.
- Open a PR's Files changed and its Conversation opens on the left.

While the split is open, the two sides stay together:

- Follow a link to another PR in either pane and the other pane switches to that PR's other view.
- Follow a link anywhere else (including a PR's Commits or Checks tabs) and the other pane closes.
- Close either pane and the other one closes too. If you separate the split first, the tabs are left alone.

Each tab is paired once per PR. If you separate the split, the extension won't reopen it until that tab navigates to a different PR.

## Requirements

Chrome 155+ (for `chrome.tabs.create({ splitWithTabId })`).

## Install (unpacked)

1. Go to `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this directory.

## Changes

See the [changelog](CHANGELOG.md).

## Privacy

Ultra PR doesn't collect or transmit any data. See the [privacy policy](PRIVACY.md).

## Tests

`npm test` (Node version in `.node-version`).

## Building for the Chrome Web Store

- `scripts/render-assets.sh` renders `icons/` and `store/` from the sources in `assets/` using headless Chrome.
- `scripts/package.sh` writes an unsigned zip to `dist/`.
- `scripts/package-crx.sh "op://Private/google chrome web store/private key"` writes the signed `.crx` to `dist/`. Uploads must be signed: the store uses verified CRX uploads. The key lives in 1Password, so set `OP_ACCOUNT` if it isn't your default account. The script prints the public key's SHA-256 so you can check it's the key the dashboard expects.
- `store/listing.md` has the listing copy and privacy answers for the dashboard.
- Before a release, bump `version` in `manifest.json` and add an entry to `CHANGELOG.md`.

## License

[MIT](LICENSE)
