# Chrome Web Store listing

Copy these into the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) when submitting.

## Store listing

**Name:** Ultra PR

**Summary** (132 characters max):
> Opens GitHub pull requests in Chrome split view, with Conversation on the left and Files changed on the right.

**Category:** Developer Tools

**Language:** English

**Description:**
> Reviewing a pull request means switching back and forth between the discussion and the diff. Ultra PR uses Chrome's split view to keep both on screen.
>
> - Open a pull request's Conversation and its Files changed opens on the right.
> - Open a pull request's Files changed and its Conversation opens on the left.
> - Focus stays on the view you opened.
> - Follow a link to another pull request in either pane and the other pane follows it.
> - Follow a link anywhere else and the other pane closes.
> - Close either pane and the other closes with it.
> - If you separate the split, Ultra PR leaves that tab alone until it moves to a different pull request.
>
> Ultra PR also collapses test files: on Files changed, every .test.ts and .test.tsx file is collapsed so you can focus on the code. Test files you expand yourself stay open.
>
> Each feature can be turned on or off in the extension's options. Ultra PR only runs on github.com and doesn't collect or send any data.
>
> Requires Chrome 155 or later.
>
> What's new in each version: https://github.com/oreoshake/ultra-pr/blob/main/CHANGELOG.md

**Graphics:**

| Asset | File | Size |
|---|---|---|
| Store icon | `icons/icon128.png` | 128×128 |
| Screenshot | `store/screenshot-1.jpg` | 1280×800 |
| Small promo tile | `store/promo-small.jpg` | 440×280 |
| Marquee promo tile | `store/promo-marquee.jpg` | 1400×560 |

## Privacy practices

**Single purpose:**
> Make reviewing GitHub pull requests faster: open a pull request's Conversation and Files changed views together in Chrome split view, and collapse test files.

**Permission justifications:**
- `storage`: Saves the two on/off settings, and remembers, for the current browser session only, which tabs have already been paired, so the two tabs of a split stay in step and a split you separate isn't reopened.
- Host permission `https://github.com/*`: Reads the URL of GitHub tabs to detect pull request pages and work out which view (Conversation or Files changed) to open alongside, and to notice when a paired tab moves to another pull request or leaves one. When "Collapse test files" is on (the default), a content script on github.com reads file names on Files changed pages and collapses test files on the page.

**Remote code:** No, the extension doesn't use remote code.

**Data usage:** The extension doesn't collect or use any user data. Tick none of the data categories, then certify the three disclosures.

**Privacy policy URL:** https://github.com/oreoshake/ultra-pr/blob/main/PRIVACY.md
