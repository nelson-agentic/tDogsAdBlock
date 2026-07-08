---
name: T-Dog's Ad Blocker - BlockList Removal
about: Blocklist Removal Request Rules
title: ''
labels: ''
assignees: ''

---

Blocklist Removal Request Rules

T-Dog's AdBlocker List is a merge of curated lists maintained by Nelson Agentic and OISD Big (oisd.nl), a widely used community blocklist.                      

To prevent unauthorized or fraudulent removal requests, you must prove ownership of the domain before it will be removed from T-Dog's Ad Blocker list. 

Verification Step:
Add the following TXT record to your domain's DNS configuration:

Type: TXT
Name / Host:  `@` (or leave blank/root)
Value: `tdogs-removal-verification=[Your-GitHub-Username]`
TTL:  3600 (or default)

How to Submit:
Once the DNS record is live, open a removal request issue and provide:
1. The domain name to be removed.
2. Your GitHub username (matching the verification value).
