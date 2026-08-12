#!/usr/bin/env python3
"""Convert ship-able art to WebP in place.

Rules:
- Has alpha (RGBA with real transparency) -> LOSSLESS WebP.
  Pixel-exact: safe for 9-slice border-image plates and pixelated UI sprites.
- RGB scenes (bg-*, hero-bg) -> lossy WebP q=90.
  Gradient-heavy pixel scenes; q90 is visually indistinguishable at ~10x smaller.

PNGs are moved to art-scratch/png-masters/ (kept as masters, gitignored).
Re-run after process-art.py regenerates finals.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "public" / "art"
MASTERS = ROOT / "art-scratch" / "png-masters"


def has_real_alpha(im: Image.Image) -> bool:
    if im.mode not in ("RGBA", "LA", "PA"):
        return False
    lo, _hi = im.getchannel("A").getextrema()
    return lo < 255


def convert(png: Path) -> None:
    im = Image.open(png)
    out = png.with_suffix(".webp")
    if has_real_alpha(im):
        im.convert("RGBA").save(out, lossless=True, quality=100, method=6)
        kind = "lossless"
    else:
        im.convert("RGB").save(out, quality=90, method=6)
        kind = "q90"
    old = png.stat().st_size
    new = out.stat().st_size
    print(f"{png.relative_to(ART)} {old//1024}KB -> {new//1024}KB ({kind})")
    master = MASTERS / png.relative_to(ART)
    master.parent.mkdir(parents=True, exist_ok=True)
    png.rename(master)


def main() -> None:
    targets = sorted(ART.glob("*.png")) + sorted((ART / "ui").glob("*.png"))
    for png in targets:
        convert(png)
    print(f"\n{len(targets)} files converted; masters -> {MASTERS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
