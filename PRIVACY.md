# Ultra PR Privacy Policy

Effective November 5, 2026

Ultra PR is a Chrome extension that opens a GitHub pull request's Conversation and Files changed views together in Chrome split view. This policy describes what the extension accesses and what it does with it.

## What the extension accesses

- **URLs of github.com tabs.** Ultra PR reads the address of tabs on github.com to tell whether a tab is showing a pull request and which view it's on. It doesn't access tabs on any other site.
- **Tab IDs and split view state.** Ultra PR reads these from Chrome to decide where to open the paired tab and to avoid reopening a split you've separated.

Ultra PR doesn't read page content, and it doesn't access your GitHub account, cookies or credentials.

## What the extension stores

Ultra PR keeps a short list that maps tab IDs to the pull request each tab was paired for (for example, `acme/widgets#42`). The list is kept in Chrome's session storage, on your device only, and Chrome deletes it when you close the browser.

## What the extension shares

Nothing. Ultra PR makes no network requests of its own and has no analytics, tracking or advertising. No data is sent to the developer or to any third party, and no data is sold or transferred.

## Changes to this policy

If this policy changes, the updated version will be published at this location with a new effective date.

## Contact

Questions about this policy can be raised as an issue at https://github.com/oreoshake/ultra-pr/issues.
