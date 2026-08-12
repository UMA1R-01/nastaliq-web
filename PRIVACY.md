# Privacy Policy — Nastaliq Web

Last updated: August 2026

Nastaliq Web is a Chrome extension that changes the font used to display Urdu-language text on webpages. This policy explains what data the extension does and does not handle.

## What the extension does

Nastaliq Web scans the text of webpages you visit, locally in your browser, to detect Urdu-script characters. When it finds Urdu text, it applies a font, size, and line-height of your choosing to that text. That is the entire function of the extension.

## What data we collect

None. Nastaliq Web does not collect, store, transmit, sell, or share any user data — including browsing history, page content, personally identifiable information, or any other category of data — with us or with any third party. Nothing you do in the extension is sent off your device.

## What data is stored, and where

Your font, size, and line-height preferences are saved using Chrome's built-in `storage` API. This data stays on your device (and syncs across your own signed-in Chrome browsers via your Google account, the same way any Chrome extension setting does) — it is never sent to us or to any server we operate, because we don't operate any server this extension talks to.

## Why the extension needs broad permissions

- **`host_permissions: <all_urls>`** — Urdu text can appear on any website, not a fixed list of sites, so the extension needs to be able to check any page you visit in order to detect and restyle Urdu content there.
- **`scripting`** — used to inject the code that detects Urdu text on a page and applies the selected font to it.
- **`storage`** — used to remember your selected font, size, and line-height preferences.

None of these permissions are used to collect, read out, or transmit page content or personal data anywhere.

## Changes to this policy

If this policy changes, the update will be reflected on this page.

## Contact

Questions can be raised via [GitHub Issues](https://github.com/UMA1R-01/nastaliq-web/issues).
