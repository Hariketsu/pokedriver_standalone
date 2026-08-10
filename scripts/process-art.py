# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=11", "numpy>=2"]
# ///
"""Process AI-generated art assets for the homepage.

Usage: uv run scripts/process-art.py

1. GPT raw chroma-keyed sprites (public/art/gpt-image-2-gen-raw/)
   -> keyed (hard cut + despill), trimmed, resized -> public/art/<name>.png
2. hero-bg (full-bleed scene, no chroma bg) -> copied as PNG
3. Kimi archive set -> "AI生成" watermark erased -> public/art/kimi-gen-raw/
   (RGBA files: watermark lives on transparent pixels, alpha is zeroed;
   hero-bg RGB: watermark region filled by iterative blur interpolation)

public/ is git-ignored by repo convention; this script is the reproducible
source of truth for deriving the assets.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "public" / "art"
GPT_RAW = ART / "gpt-image-2-gen-raw"
KIMI_RAW = ART / "kimi-gen-raw"

# uuid prefix -> (target name, key color, max dimension after trim)
GPT_MAP = {
    "0c9d018e": ("icon-settings", "green", 256),
    "46cf0673": ("icon-dex", "green", 256),
    "685f4720": ("icon-train", "green", 256),
    "cba2a0be": ("icon-study", "green", 256),
    "4ae7c1ba": ("starter-cloud", "green", 512),
    "6bdef110": ("starter-leaf", "magenta", 512),
    "b8156005": ("starter-volt", "green", 512),
    "10897ed3": ("logo-badge", "green", 512),
    "f962772c": ("deco-cone", "green", 512),
    "457d552e": ("deco-traffic-light", "green", 512),
    "22034067": ("strip-checkers", "green", 1024),  # width
}
HERO_BG_PREFIX = "cefcdb60"


def key_out(arr: np.ndarray, key: str) -> np.ndarray:
    """Hard chroma cut -> RGBA with despilled edges."""
    r, g, b = arr[..., 0].astype(np.int16), arr[..., 1].astype(np.int16), arr[..., 2].astype(np.int16)
    if key == "green":
        mask = (g > 120) & (g > r + 60) & (g > b + 60)
        # despill: clamp green to the max of the other channels
        g_d = np.minimum(g, np.maximum(r, b))
        out = np.stack([r, g_d, b], axis=-1)
    else:  # magenta
        mask = (r > 150) & (b > 150) & (g < 120) & (np.minimum(r, b) > g + 60)
        # despill: pull red/blue down toward green where they dominate together
        excess = np.clip(np.minimum(r, b) - g, 0, None)
        out = np.stack([r - excess, g, b - excess], axis=-1)
    alpha = np.where(mask, 0, 255).astype(np.uint8)
    return np.dstack([np.clip(out, 0, 255).astype(np.uint8), alpha])


def trim(arr: np.ndarray, pad: int = 4) -> np.ndarray:
    ys, xs = np.nonzero(arr[..., 3] > 8)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, arr.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, arr.shape[1])
    return arr[y0:y1, x0:x1]


def resize_max(im: Image.Image, max_dim: int) -> Image.Image:
    w, h = im.size
    scale = max_dim / max(w, h)
    if scale >= 1:
        return im
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def process_gpt() -> None:
    for f in sorted(GPT_RAW.iterdir()):
        prefix = f.name.removeprefix("exec-")[:8]
        if prefix == HERO_BG_PREFIX:
            im = Image.open(f).convert("RGB")
            im.save(ART / "hero-bg.png")
            print(f"hero-bg        <- {f.name} {im.size}")
            continue
        name, key, max_dim = GPT_MAP[prefix]
        arr = np.array(Image.open(f).convert("RGB"))
        rgba = trim(key_out(arr, key))
        im = Image.fromarray(rgba, "RGBA")
        if name == "strip-checkers":  # resize caps width here
            im = resize_max(im, max_dim)
        else:
            im = resize_max(im, max_dim)
        im.save(ART / f"{name}.png")
        print(f"{name:15s}<- {f.name} key={key:7s} -> {im.size}")


def erase_rect_alpha(im: Image.Image) -> Image.Image:
    """Zero alpha in the bottom-left watermark zone (on transparent pixels)."""
    arr = np.array(im)
    h, w = arr.shape[:2]
    arr[int(h * 0.86):, : int(w * 0.30), 3] = 0
    return Image.fromarray(arr, "RGBA")


def delogo_fill(im: Image.Image) -> Image.Image:
    """Fill the bottom-left watermark rect by iterative blur interpolation."""
    w, h = im.size
    box = (0, int(h * 0.90), int(w * 0.42), h)
    region = im.crop(box)
    # feathered mask so surrounding pixels bleed in over iterations
    border = Image.new("L", region.size, 0)
    border.paste(255, (6, 6, region.width - 6, region.height - 6))
    out = im.copy()
    for _ in range(24):
        blurred = out.filter(ImageFilter.GaussianBlur(9))
        out.paste(blurred.crop(box), box, border)
    return out


def archive_kimi() -> None:
    KIMI_RAW.mkdir(exist_ok=True)
    for f in sorted(ART.glob("*.png")):
        if f.stem == "hero-bg":
            im = delogo_fill(Image.open(f).convert("RGB"))
        else:
            im = erase_rect_alpha(Image.open(f).convert("RGBA"))
        im.save(KIMI_RAW / f.name)
        print(f"archive kimi-gen-raw/{f.name}")


if __name__ == "__main__":
    archive_kimi()  # capture kimi originals (cleaned) before overwriting
    process_gpt()
    print("done")
