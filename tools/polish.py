#!/usr/bin/env python3
"""
Second, light "polish" pass for the web photos in assets/img.

Global, photographic adjustments only (nothing is added, removed or moved):
  - midtone lift so rooms read a little brighter and airier (never darkens)
  - vibrance for muted colours (skin-safe, rich colours barely change)
  - gentle clarity for depth

Reads the largest WebP of each photo, applies the polish, and rewrites every
responsive size (WebP) plus the JPEG fallback with the same settings as
tools/build_images.py.

  python3 tools/polish.py                 # all photos in the manifest
  python3 tools/polish.py --src slug=path  # use another source for one photo
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
WIDTHS = [640, 1024, 1600, 2200]
FALLBACK_WIDTH = 1280

TARGET_MEDIAN = 0.58
MIN_GAMMA = 0.86          # cap on how much brighter a photo can get
VIBRANCE = 0.12
CLARITY = 10


def lum(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def polish(img):
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255
    L = lum(a)
    med = float(np.median(L))
    g = np.log(TARGET_MEDIAN) / np.log(min(max(med, 0.05), 0.95))
    g = float(np.clip(g, MIN_GAMMA, 1.0))  # brighten only
    Ln = np.clip(L, 0, 1) ** g
    out = a * (Ln / np.maximum(L, 1e-4))[..., None]
    peak = out.max(axis=2, keepdims=True)
    k = np.where(peak > 1, (1 - Ln[..., None]) / np.maximum(peak - Ln[..., None], 1e-4), 1)
    out = Ln[..., None] + (out - Ln[..., None]) * np.clip(k, 0, 1)
    # vibrance
    Lo = lum(out)[..., None]
    mx, mn = out.max(axis=2, keepdims=True), out.min(axis=2, keepdims=True)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    out = np.clip(Lo + (out - Lo) * (1 + VIBRANCE * (1 - sat) ** 2), 0, 1)
    res = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
    radius = max(res.size) / 70
    return res.filter(ImageFilter.UnsharpMask(radius=radius, percent=CLARITY, threshold=2)), g, med


def write_sizes(slug, img):
    w, h = img.size
    widths = sorted({min(x, w) for x in WIDTHS})
    for tw in widths:
        im = img if tw == w else img.resize((tw, round(h * tw / w)), Image.LANCZOS)
        im.save(IMG / f"{slug}-{tw}.webp", "WEBP", quality=80, method=6)
    fw = min(FALLBACK_WIDTH, w)
    fb = img if fw == w else img.resize((fw, round(h * fw / w)), Image.LANCZOS)
    fb.save(IMG / f"{slug}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
    return widths


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", action="append", default=[], help="slug=path to use instead of the largest WebP")
    p.add_argument("--only", nargs="*", help="limit to these slugs")
    args = p.parse_args()
    overrides = dict(s.split("=", 1) for s in args.src)
    manifest = json.loads((IMG / "manifest.json").read_text())
    for slug, info in manifest.items():
        if args.only and slug not in args.only:
            continue
        src = overrides.get(slug) or IMG / f"{slug}-{info['widths'][-1]}.webp"
        img, g, med = polish(Image.open(src))
        write_sizes(slug, img)
        print(f"{slug:26s} median {med:.2f}  gamma {g:.2f}")


if __name__ == "__main__":
    main()
