#!/usr/bin/env python3
"""Generate the toolbar icons: T-Dog's cutout on a soft amber brand circle.

icons/tdog.png is the background-removed head (transparent). Here we set it on
a soft radial-amber disc so it stays legible even at 16px, and preserve the
transparent corners around the disc. Pillow is a DEV-TIME tool only; the
extension ships no runtime dependencies.

Old badge mark: scripts/gen_icons_badge.py.  Run: python3 scripts/gen_icons.py
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(os.path.dirname(HERE), "icons")
SRC = os.path.join(ICONS, "tdog.png")

SS = 4  # supersample for smooth edges
CENTER = (247, 219, 150)  # soft warm amber (disc center)
EDGE = (216, 154, 43)     # brand amber (disc edge)


def radial_disc(d):
    """A d x d RGBA soft radial-amber circle on transparency."""
    img = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = d / 2
    steps = int(r)
    for i in range(steps, 0, -1):
        t = i / steps  # 1 at edge -> 0 at center
        col = tuple(round(EDGE[c] * t + CENTER[c] * (1 - t)) for c in range(3))
        bb = (r - i, r - i, r + i, r + i)
        draw.ellipse(bb, fill=col + (255,))
    return img


def badge(size):
    d = size * SS
    disc = radial_disc(d)
    dog = Image.open(SRC).convert("RGBA")
    w, h = dog.size
    s = min(w, h)
    dog = dog.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    dog = dog.resize((d, d), Image.LANCZOS)
    disc.alpha_composite(dog)  # dog sits on the disc; its transparent corners keep the amber
    return disc.resize((size, size), Image.LANCZOS)


def main():
    if not os.path.exists(SRC):
        raise SystemExit("Missing " + SRC + " — add T-Dog's cutout there first.")
    for size in (16, 48, 128):
        badge(size).save(os.path.join(ICONS, "icon{}.png".format(size)))
        print("Wrote icons/icon{}.png".format(size))


if __name__ == "__main__":
    main()
