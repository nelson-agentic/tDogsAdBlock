#!/usr/bin/env python3
"""Generate rules.json for declarativeNetRequest from a plain domain blocklist.

Run:  python3 scripts/gen_rules.py
Edit the DOMAINS list (or scripts/blocklist.txt) and re-run to update rules.json.
No third-party dependencies — standard library only.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BLOCKLIST = os.path.join(HERE, "blocklist.txt")
OUT = os.path.join(ROOT, "rules.json")


def load_domains():
    domains = []
    seen = set()
    with open(BLOCKLIST, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            d = line.lower()
            if d not in seen:
                seen.add(d)
                domains.append(d)
    return domains


def build_rules(domains):
    rules = []
    for i, d in enumerate(domains, start=1):
        rules.append({
            "id": i,
            "priority": 1,
            "action": {"type": "block"},
            "condition": {
                # Anchored domain match (host + all subdomains), any request type.
                "urlFilter": "||{}^".format(d),
                "isUrlFilterCaseSensitive": False
            }
        })
    return rules


def main():
    domains = load_domains()
    rules = build_rules(domains)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(rules, fh, indent=2)
        fh.write("\n")
    print("Wrote {} rules to {}".format(len(rules), OUT))


if __name__ == "__main__":
    main()
