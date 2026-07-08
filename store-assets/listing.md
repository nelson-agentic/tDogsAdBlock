# Chrome Web Store listing text — T-Dog's AdBlocker

## Product name
T-Dog's AdBlocker

## Summary (132 char max — shown in search results; matches manifest.json description)
Lightweight, dependency-free ad & tracker blocker by Nelson Agentic. Native declarativeNetRequest, zero per-request JavaScript.

## Description (Store Listing tab, long-form)

Block ads and trackers automatically — with zero bloat.

T-Dog's AdBlocker is an ultra-lightweight ad & tracker blocker built entirely
on Chrome's native declarativeNetRequest engine. There's no injected
JavaScript, no libraries, no build step, and no per-request overhead —
blocking rules are matched natively in the browser's own network stack.

KEY FEATURES

• 330,000+ blocked domains, auto-updated daily — our curated list merged
with the trusted OISD Big blocklist, refreshed once a day (or on demand
with one click), so new ad and tracker networks get blocked without
waiting on a store update.

• Native, zero-overhead blocking — every rule runs through Chrome's own
declarativeNetRequest C++ network stack. No content scripts, no
per-request JavaScript, no slowdown on the pages you visit.

• Trusted sites — if blocking ever breaks something (like "Log in with
Facebook" on a checkout page), hit Trust site to exempt that one domain
instantly, without pausing protection anywhere else. One click to undo.

• Manual domain blocking — add any annoying domain from the popup and
remove it with one click.

• Popup & popunder ad network coverage — the blocklist includes major
popunder, redirect, and push-notification ad networks.

• Per-tab blocked counter — see exactly how many ads and trackers were
blocked on the page you're viewing, right in the toolbar and popup.

• One-click pause — a single toggle disables blocking instantly if you
ever need to.

PRIVACY BY DESIGN

T-Dog's AdBlocker requests no host permissions at all. It cannot read or
modify the content of any page you visit. The daily blocklist update
fetches a static domain list from a CORS-enabled GitHub URL — no browsing
data, page content, or personal information is ever collected, read, or
transmitted.

CREDITS

The auto-updating blocklist merges a curated Nelson Agentic list with
OISD Big (oisd.nl), a comprehensive, low false-positive blocklist used
under its free-use terms.

---
T-Dog's AdBlocker is developed by Nelson Agentic.
Support: https://ko-fi.com/nelsonagentic

## Category
Privacy & security (Chrome regroups categories periodically — double-check
the current dropdown options in the Developer Dashboard; "Tools" is the
fallback if "Privacy & security" isn't offered).

## Language
English (United States)

## Single purpose description (Privacy practices tab)
T-Dog's AdBlocker blocks advertising and tracking network requests using
Chrome's native declarativeNetRequest API.

## Permission justifications (Privacy practices tab)

**declarativeNetRequest** — Used to block ads and tracker requests
natively via declarative rules. The extension does not read, intercept,
or modify the content of any request or page.

**activeTab** — Used to identify the current tab's site so the popup can
show and manage a per-site "Trust this site" allowlist entry when the
user opens the extension.

**storage** — Used to store the user's manual block list, trusted-sites
list, and extension settings locally in the browser.

**alarms** — Used to schedule a once-daily background fetch of the
auto-updating blocklist file.

## Data usage disclosures (Privacy practices tab)
- Does this extension collect or transmit user data? **No.**
- Remote code: the extension fetches a static blocklist **data** file
  (plain-text domain list) once daily from raw.githubusercontent.com; it
  does not fetch or execute remote code.
