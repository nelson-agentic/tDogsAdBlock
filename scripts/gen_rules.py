#!/usr/bin/env python3
#
# Copyright (C) 2026 Benjamin Nelson (Nelson Agentic)
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or (at your option) any later
# version. This program is distributed WITHOUT ANY WARRANTY; see the GNU General
# Public License for more details. You should have received a copy of the
# license with this program; if not, see <https://www.gnu.org/licenses/>.
#
# Developed with assistance from Anthropic's Claude.
#
# SPDX-License-Identifier: GPL-3.0-or-later
#
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
