# Ultra PR Privacy Policy

Effective November 25, 2026

Ultra PR is a Chrome extension that opens a GitHub pull request's Conversation and Files changed views together in Chrome split view, and can optionally mark test files as viewed. This policy describes what the extension accesses and what it does with it.

## What the extension accesses

- **URLs of github.com tabs.** Ultra PR reads the address of tabs on github.com to tell whether a tab is showing a pull request and which view it's on. It doesn't access tabs on any other site.
- **Tab IDs and split view state.** Ultra PR reads these from Chrome to decide where to open the paired tab, to keep the two tabs of a split it opened in step, and to avoid reopening a split you've separated.
- **File names on Files changed pages, if you turn on "Mark test files as viewed".** Ultra PR reads the names of the files in a pull request to find test files, and clicks GitHub's own Viewed checkbox for them. GitHub records that the same way as if you had clicked it.

Ultra PR doesn't read any other page content, and it doesn't access your GitHub account, cookies or credentials.

## What the extension stores

Ultra PR keeps a short list that maps tab IDs to the pull request each tab was paired for (for example, `acme/widgets#42`), and which two tabs it paired together. The list is kept in Chrome's session storage, on your device only, and Chrome deletes it when you close the browser.

If "Mark test files as viewed" is on, Ultra PR also remembers, for the current tab session, which files in each pull request it has already handled, so it doesn't re-check a file you unchecked. This list is kept in the github.com page's session storage and is deleted when you close the tab.

Your two on/off settings are kept in Chrome's synced storage, so they follow your Chrome profile if you use Chrome sync.

## What the extension shares

Nothing. Ultra PR makes no network requests of its own (clicking Viewed is handled by GitHub's page, as if you clicked it) and has no analytics, tracking or advertising. No data is sent to the developer or to any third party, and no data is sold or transferred.

## Changes to this policy

If this policy changes, the updated version will be published at this location with a new effective date.

## Contact

Questions about this policy can be raised as an issue at https://github.com/oreoshake/ultra-pr/issues.
