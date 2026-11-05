# Ultra PR

A Chrome extension that keeps a GitHub pull request's **Conversation** and **Files changed** views open side by side in Chrome [split view](https://support.google.com/chrome/answer/16971124).

- Open a PR's Conversation and its Files changed opens on the right.
- Open a PR's Files changed and its Conversation opens on the left.

Each tab is paired once per PR. If you separate the split, the extension won't reopen it until that tab navigates to a different PR.

## Requirements

Chrome 155+ (for `chrome.tabs.create({ splitWithTabId })`).

## Install (unpacked)

1. Go to `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this directory.
