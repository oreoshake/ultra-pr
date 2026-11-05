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
> - If you separate the split, Ultra PR leaves that tab alone until it moves to a different pull request.
>
> Ultra PR only runs on github.com, doesn't change GitHub pages, and doesn't collect or send any data.
>
> Requires Chrome 155 or later.

**Graphics:**

| Asset | File | Size |
|---|---|---|
| Store icon | `icons/icon128.png` | 128×128 |
| Screenshot | `store/screenshot-1.jpg` | 1280×800 |
| Small promo tile | `store/promo-small.jpg` | 440×280 |
| Marquee promo tile | `store/promo-marquee.jpg` | 1400×560 |

## Privacy practices

**Single purpose:**
> Open a GitHub pull request's Conversation and Files changed views together in Chrome split view.

**Permission justifications:**
- `storage`: Remembers, for the current browser session only, which tabs have already been paired so a split you separate isn't reopened.
- Host permission `https://github.com/*`: Reads the URL of GitHub tabs to detect pull request pages and work out which view (Conversation or Files changed) to open alongside.

**Remote code:** No, the extension doesn't use remote code.

**Data usage:** The extension doesn't collect or use any user data. Tick none of the data categories, then certify the three disclosures.

**Privacy policy URL:** Not required when no user data is collected. If the dashboard asks for one anyway, link the README section "Privacy".
