#!/usr/bin/env python3
"""Generate the Nelson Agentic co-branded PNG icons — standard library only.

Design: charcoal outer ring, inner disc split into the four muted colors of
the Nelson Agentic badge (red / green / blue / yellow quadrants), crossed by
the white 'block' slash. Rendered with 4x supersampling for smooth edges.

Run:  python3 scripts/gen_icons.py
"""
import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(os.path.dirname(HERE), "icons")

# Nelson Agentic palette (sampled from the brand badge).
CHARCOAL = (63, 63, 63)
RED = (201, 79, 61)
GREEN = (91, 140, 90)
BLUE = (74, 123, 166)
YELLOW = (217, 178, 61)
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def png(width, height, pixels):
    """pixels: list of rows, each row a list of (r,g,b,a) tuples."""
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filter type 0
        for (r, g, b, a) in row:
            raw += bytes((r, g, b, a))
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def sample(x, y, S):
    """Color of one supersampled pixel at (x, y) on an S x S canvas."""
    cx = cy = (S - 1) / 2
    dx, dy = x - cx, y - cy
    dist = (dx * dx + dy * dy) ** 0.5
    r_outer = S * 0.48
    ring = S * 0.075
    if dist > r_outer:
        return TRANSPARENT
    if dist > r_outer - ring:
        return CHARCOAL + (255,)
    # White diagonal slash (top-right to bottom-left, like a 'no' sign).
    if abs(dx + dy) < S * 0.085:
        return WHITE + (255,)
    # Badge-style quadrants.
    if dx < 0 and dy < 0:
        c = RED
    elif dx >= 0 and dy < 0:
        c = GREEN
    elif dx < 0:
        c = BLUE
    else:
        c = YELLOW
    return c + (255,)


def make(size, ss=4):
    S = size * ss
    rows = []
    for py in range(size):
        row = []
        for px in range(size):
            # Average an ss x ss block of subsamples.
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    sr, sg, sb, sa = sample(px * ss + sx, py * ss + sy, S)
                    r += sr; g += sg; b += sb; a += sa
            n = ss * ss
            row.append((r // n, g // n, b // n, a // n))
        rows.append(row)
    return png(size, size, rows)


def main():
    os.makedirs(ICONS, exist_ok=True)
    for size in (16, 48, 128):
        with open(os.path.join(ICONS, "icon{}.png".format(size)), "wb") as fh:
            fh.write(make(size))
        print("Wrote icons/icon{}.png".format(size))


if __name__ == "__main__":
    main()
