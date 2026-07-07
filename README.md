# T-Dog's AdBlocker

An ultra-lightweight, dependency-free ad & tracker blocker for Chrome, from
**Nelson Agentic**. Brand palette: charcoal `#3F3F3F` + amber `#D99A2B`; the
icon echoes the Nelson Agentic badge (red/green/blue/yellow quadrants) crossed
by the white "block" slash.

Blocking is done **natively** by Chrome's `declarativeNetRequest` engine — the
rules are matched in the browser's C++ network stack, so there is **zero
per-request JavaScript** and no runtime overhead. There are no libraries, no
build step, and no external dependencies.

## Features

- **Auto-updating blocklist** — fetches the [Nelson Agentic blocklist](publish/nelson-agentic-blocklist.txt)
  (~330k domains: our curated list merged with [OISD Big](https://oisd.nl),
  tuned for broad coverage with very low false positives)
  once a day via `chrome.alarms` and packs it into a few dynamic rules
  (`requestDomains`), still matched natively. The list is rebuilt daily in this
  repo by a GitHub Action and served from `raw.githubusercontent.com`, which
  sends CORS headers, so **no host permission is required**. "Update now"
  button in the popup for manual refreshes.
- **Manual domain blocking** — add any annoying domain from the popup
  (pastes like `https://sub.example.com/path` are normalized automatically);
  remove with one click.
- **Popup/popunder ad networks** — the static list includes the major
  popunder, redirect, and push-notification ad networks, so their scripts
  never load. (Chrome's built-in blocker already stops unsolicited
  `window.open` popups.)
- **Trusted sites (per-site allowlist)** — if blocking ever breaks something
  (e.g. "Log in with Facebook" on a checkout page), hit **Trust site** in the
  popup. A single high-priority `allowAllRequests` rule exempts the whole
  frame hierarchy of pages on that domain, without pausing the blocker
  anywhere else. One click to undo.
- **Pause switch** — one toggle disables the static ruleset and dynamic rules.
- **Per-tab blocked counter** — badge count handled natively by Chrome
  (`displayActionCountAsBadgeText`), shown in the popup too.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select this folder

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3 extension definition |
| `rules.json` | Static block rules (generated — do not edit by hand) |
| `background.js` | Service worker: list updater, dynamic-rule sync, toggle, badge |
| `popup.html` / `popup.js` | Popup: pause switch, blocked count, manual domains, update status |
| `icons/` | Toolbar icons |
| `scripts/blocklist.txt` | The human-editable curated domain list |
| `scripts/gen_rules.py` | Regenerates `rules.json` from the curated list |
| `scripts/gen_icons.py` | Regenerates the PNG icons |
| `scripts/build_published_list.py` | Merges the curated list + upstream lists into the published list |
| `publish/nelson-agentic-blocklist.txt` | The published list the extension fetches at runtime (generated) |
| `.github/workflows/update-blocklist.yml` | Daily GitHub Action that rebuilds and commits the published list |

## Updating the static blocklist

Edit `scripts/blocklist.txt` (one domain per line — subdomains are matched
automatically), then regenerate:

```bash
python3 scripts/gen_rules.py
```

Reload the extension in `chrome://extensions` to pick up the changes. The
scripts use only the Python standard library.

## The published (auto-fetched) blocklist

Installed extensions don't wait for a store update to get new domains: once a
day (and on the popup's **Update now**) they fetch
`publish/nelson-agentic-blocklist.txt` from this repo's `main` branch via
`raw.githubusercontent.com` (the `LIST_URL` constant in `background.js`).

That file is generated — don't edit it by hand. It merges
`scripts/blocklist.txt` (curated, always included) with the upstream lists in
`scripts/build_published_list.py`, and the GitHub Action in
`.github/workflows/update-blocklist.yml` rebuilds and commits it daily at
06:00 UTC (only when the domain set actually changed). To rebuild locally:

```bash
python3 scripts/build_published_list.py
```

## How it stays fast & light

- **`declarativeNetRequest`** — declarative rules, matched natively; no request
  ever passes through JavaScript.
- **One rule per list** — the entire remote list lives in a single dynamic
  rule via `requestDomains`; user domains in a second one.
- **Idle service worker** — wakes only on install, browser startup, the daily
  alarm, or popup interactions; never per-request or per-page.
- **Native badge count** — Chrome counts blocked requests itself.
- **Minimal permissions** — `declarativeNetRequest`, `activeTab`, `storage`,
  `alarms`. **No host permissions at all** — the blocklist is fetched from a
  CORS-enabled URL, and DNR blocking rules need no host access. The extension
  never requests "read and change data on" any site and cannot read page
  content anywhere.
