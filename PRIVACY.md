# Privacy Policy — T-Dog's AdBlocker

**Effective date:** 2026-07-08

T-Dog's AdBlocker ("the extension") is developed by Nelson Agentic. This
policy explains what data the extension does — and does not — collect.

## Summary

T-Dog's AdBlocker does not collect, store, transmit, or sell any personal
or sensitive user data. It does not read, log, or have access to the
content of any page you visit.

## What the extension does

- **Blocks ads and trackers natively.** All blocking is performed by
  Chrome's built-in `declarativeNetRequest` engine, matching request URLs
  against a domain list entirely within the browser. No request content,
  browsing history, or page content is read, inspected, or sent anywhere
  by the extension.
- **Fetches a public blocklist once a day.** The extension downloads a
  static, plain-text domain list from a public GitHub URL
  (`raw.githubusercontent.com/nelson-agentic/tDogsAdBlock`) so its
  blocking rules stay current. This is a one-way download of public data —
  no information about you, your browser, or your browsing is sent as
  part of this request beyond the standard, unavoidable network metadata
  (e.g. IP address) that any HTTP request includes, which the extension
  itself does not access, log, or use.
- **Stores your settings locally.** Your pause/enable state, manually
  added blocked domains, and trusted-site list are stored using Chrome's
  local `storage` API, on your device only. This data is never
  transmitted anywhere and is deleted if you remove the extension.

## What the extension does not do

- It requests no host permissions and cannot read or modify the content
  of any website you visit.
- It does not use analytics, tracking, or advertising SDKs.
- It does not collect personally identifiable information, health
  information, financial information, authentication credentials,
  location data, web history, or personal communications.
- It does not sell or transfer any data to third parties, for any
  purpose.
- It does not execute any remotely fetched code. The daily list update is
  static data (a domain list), not executable code.

## Third-party data sources

The extension's blocklist merges a list curated by Nelson Agentic with
[OISD Big](https://oisd.nl), a third-party, community-maintained
blocklist used under its free-use terms. This is a one-way inbound data
source only — no data about you is sent to OISD.

## Changes to this policy

If this policy changes, the updated version will be posted at this same
location with a revised effective date.

## Contact

Questions about this policy or the extension can be sent via
[Ko-fi](https://ko-fi.com/nelsonagentic) or through the
[GitHub repository](https://github.com/nelson-agentic/tDogsAdBlock).

---
Copyright © 2026 Benjamin Nelson (Nelson Agentic).
