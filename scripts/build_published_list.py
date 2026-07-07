#!/usr/bin/env python3
"""Compile the Nelson Agentic blocklist that T-Dog's AdBlocker pulls at runtime.

It merges:
  * your curated domains in  scripts/blocklist.txt   (always included), and
  * any UPSTREAM lists below  (optional broad coverage),
then writes one deduped, sorted file:  publish/nelson-agentic-blocklist.txt

You host that file (e.g. a public GitHub repo) and point the extension's
LIST_URL at its raw URL. To ship a lean, fully-hand-curated list instead, just
empty the UPSTREAM list.

Workflow:
  1. Edit scripts/blocklist.txt (your own additions/removals).
  2. python3 scripts/build_published_list.py
  3. Commit / upload publish/nelson-agentic-blocklist.txt to your host.

Standard library only.
"""
import datetime
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "blocklist.txt")
OUT_DIR = os.path.join(ROOT, "publish")
OUT = os.path.join(OUT_DIR, "nelson-agentic-blocklist.txt")

# Upstream lists to fold in (CORS not needed here — this runs at build time).
# Remove entries for a leaner list; add your own trusted sources freely.
UPSTREAM = [
    # OISD Big — comprehensive, tuned for very low false positives
    # ("Block. Don't break."). Free to use; https://oisd.nl. Plain-domain
    # (wildcard-without-*) format, so subdomains are matched automatically.
    "https://raw.githubusercontent.com/sjhgvr/oisd/main/domainswild2_big.txt",
]

DOMAIN_RE = re.compile(r"^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$")


def extract(text, into):
    for line in text.splitlines():
        line = line.strip().lower()
        if not line or line.startswith("#") or line.startswith("!"):
            continue
        token = line.split()[-1]  # tolerate "0.0.0.0 domain" hosts format
        if DOMAIN_RE.match(token):
            into.add(token)


def main():
    domains = set()

    with open(SRC, encoding="utf-8") as fh:
        extract(fh.read(), domains)
    curated = len(domains)
    print("curated domains: {}".format(curated))

    for url in UPSTREAM:
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                before = len(domains)
                extract(resp.read().decode("utf-8", "replace"), domains)
                print("  + {} (total now {})".format(url, len(domains)))
                _ = before
        except Exception as e:  # noqa: BLE001 — build script, keep going
            print("  ! skipped {} ({})".format(url, e))

    ordered = sorted(domains)
    os.makedirs(OUT_DIR, exist_ok=True)
    today = datetime.date.today().isoformat()
    header = [
        "# Nelson Agentic Blocklist — for T-Dog's AdBlocker",
        "# https://www.nelsonagentic.com",
        "# Format: one domain per line (subdomains matched automatically).",
        "# Lines starting with # are comments.",
        "# Sources: curated Nelson Agentic list + OISD Big (https://oisd.nl).",
        "# Updated: {}   Domains: {}   (curated: {})".format(
            today, len(ordered), curated
        ),
        "",
    ]
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(header))
        fh.write("\n".join(ordered))
        fh.write("\n")
    print("Wrote {} domains to {}".format(len(ordered), OUT))


if __name__ == "__main__":
    main()
