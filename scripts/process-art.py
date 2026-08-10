# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=11", "numpy>=2", "scipy>=1.14"]
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
import scipy.ndimage as ndi
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
    if KIMI_RAW.exists() and any(KIMI_RAW.iterdir()):
        print("kimi-gen-raw already archived, skipping")
        return
    KIMI_RAW.mkdir(exist_ok=True)
    for f in sorted(ART.glob("*.png")):
        if f.stem == "hero-bg":
            im = delogo_fill(Image.open(f).convert("RGB"))
        else:
            im = erase_rect_alpha(Image.open(f).convert("RGBA"))
        im.save(KIMI_RAW / f.name)
        print(f"archive kimi-gen-raw/{f.name}")


CUTOUT_DIR = ART / "gpt-cutout-homepage"
CUTOUT2_DIR = ART / "gpt-cutout-homepage-2"

# source filename prefix -> (target, keep mode)
# "largest"  = keep only the biggest connected component (subject; kills stray beams)
# "ratio"    = keep components >= 2% of the largest (logo = several legit plates)
# "floor"    = keep components >= 50 px absolute (kills dust specks, keeps parts)
CUTOUT_MAP = {
    "01_标题": ("ui-logo", "ratio"),
    "02_右上角": ("ui-settings", "ratio"),
    "03_精灵_左": ("starter-volt", "largest"),
    "04_精灵_中": ("starter-leaf", "largest"),
    "05_精灵_右": ("starter-cloud", "largest"),
}

CUTOUT2_MAP = {
    "01_41_15": ("ui-plate-blue", None),
    "01_41_16 AM (3)": ("ui-plate-green", None),
    "01_41_16 AM (4)": ("ui-plate-blue-alt", None),
    "01_41_17 AM (5)": ("ui-plate-purple", None),
    "01_41_17 AM (6)": ("ui-plate-gold", None),
    "01_41_18": ("icon-dex", 256),
    "01_41_19 AM (8)": ("icon-study", 256),
    "01_41_19 AM (9)": ("icon-train", 256),
    "01_41_20": ("icon-settings", 256),
    "01_43_47": ("ui-play", None),
    "01_47_05": ("ui-plate-gold-long", None),
}


def clean_components(arr: np.ndarray, mode: str) -> np.ndarray:
    """Remove disconnected cutout residue via connected-component analysis."""
    a = arr[..., 3]
    labels, n = ndi.label(a > 40)
    if n <= 1:
        return arr
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    largest = int(sizes.argmax())
    if mode == "largest":
        keep_ids = [largest]
    elif mode == "floor":
        keep_ids = [i for i in range(1, n + 1) if sizes[i] >= 50]
    else:
        keep_ids = [i for i in range(1, n + 1) if sizes[i] >= sizes[largest] * 0.02]
    keep = np.isin(labels, keep_ids)
    removed = n - len(keep_ids)
    arr[..., 3] = np.where(keep, a, 0)
    print(f"   removed {removed} residue components")
    return arr


def process_cutouts() -> None:
    """Clean GPT-cutout homepage assets (stray fragments) and install them."""
    for f in sorted(CUTOUT_DIR.iterdir()):
        hit = next((v for k, v in CUTOUT_MAP.items() if f.name.startswith(k)), None)
        if not hit:
            continue
        name, mode = hit
        arr = np.array(Image.open(f).convert("RGBA"))
        arr = clean_components(arr, mode)
        im = Image.fromarray(trim(arr, pad=2), "RGBA")
        im.save(ART / f"{name}.png")
        print(f"{name:15s}<- {f.name[:28]} mode={mode:7s} -> {im.size}")


def process_cutouts2() -> None:
    """Clean button plates / icons from batch 2 (dust specks via 50px floor)."""
    for f in sorted(CUTOUT2_DIR.iterdir()):
        if not f.name.endswith(".png"):
            continue
        hit = next((v for k, v in CUTOUT2_MAP.items() if k in f.name), None)
        if not hit:
            continue
        name, max_dim = hit
        arr = np.array(Image.open(f).convert("RGBA"))
        arr = clean_components(arr, "floor")
        im = Image.fromarray(trim(arr, pad=3), "RGBA")
        if max_dim:
            im = resize_max(im, max_dim)
        im.save(ART / f"{name}.png")
        print(f"{name:18s}<- {f.name[26:40]} -> {im.size}")


def process_wide_bg() -> None:
    """Landscape outpainted hero for desktop; copied verbatim (no keying)."""
    src = ART / "bg-16-9-raw.png"
    Image.open(src).convert("RGB").save(ART / "bg-16-9.png")
    print(f"bg-16-9        <- {src.name} {Image.open(src).size}")


if __name__ == "__main__":
    archive_kimi()  # capture kimi originals (cleaned) before overwriting
    process_gpt()
    process_cutouts()
    process_cutouts2()
    process_wide_bg()
    print("done")
