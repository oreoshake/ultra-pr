# Ultra PR

A Chrome extension that keeps a GitHub pull request's **Conversation** and **Files changed** views open side by side in Chrome [split view](https://support.google.com/chrome/answer/16971124).

- Open a PR's Conversation and its Files changed opens on the right.
- Open a PR's Files changed and its Conversation opens on the left.

While the split is open, the two sides stay together:

- Follow a link to another PR in either pane and the other pane switches to that PR's other view.
- Follow a link anywhere else (including a PR's Commits or Checks tabs) and the other pane closes.

Each tab is paired once per PR. If you separate the split, the extension won't reopen it until that tab navigates to a different PR.

## Requirements

Chrome 155+ (for `chrome.tabs.create({ splitWithTabId })`).

## Install (unpacked)

1. Go to `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this directory.

## Privacy

Ultra PR doesn't collect or transmit any data. See the [privacy policy](PRIVACY.md).

## Tests

`npm test` (Node version in `.node-version`).

## Building for the Chrome Web Store

- `scripts/render-assets.sh` renders `icons/` and `store/` from the sources in `assets/` using headless Chrome.
- `scripts/package.sh` writes the upload zip to `dist/`.
- `store/listing.md` has the listing copy and privacy answers for the dashboard.

## License

[MIT](LICENSE)
