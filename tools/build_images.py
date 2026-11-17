#!/usr/bin/env python3
"""
Build web-optimised, responsive copies of the villa photos.

  python3 tools/build_images.py SOURCE_DIR

SOURCE_DIR holds the photos named 01.jpg ... 26.jpg (the original Drive files,
or the enhanced versions produced by tools/enhance.py). For every photo this
writes WebP files at several widths plus one JPEG fallback into assets/img/,
using the descriptive slug below. All metadata (including the iPhone GPS
location) is stripped. Images are only resized and compressed here - no tonal
or colour changes.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
WIDTHS = [640, 1024, 1600, 2200]
FALLBACK_WIDTH = 1280

SLUGS = {
    "01": "exterior-front",
    "02": "pool-lanai",
    "03": "pool-deck",
    "04": "home-theater",
    "05": "game-room",
    "06": "kitchen",
    "07": "dining-room",
    "08": "dining-living",
    "09": "sitting-area",
    "10": "living-room",
    "11": "bedroom-patio",
    "12": "bedroom-twin-beds",
    "13": "bathroom-double-vanity",
    "14": "bedroom-navy",
    "15": "bathroom-walk-in-shower",
    "16": "workspace",
    "17": "kids-bedroom",
    "18": "bathroom-kids",
    "19": "bunk-room",
    "20": "bathroom-shower",
    "21": "laundry-room",
    "22": "bedroom-white",
    # "23" bathroom-glass-shower: same bathroom as 26, left out of the gallery
    "24": "bedroom-teal",
    "25": "bedroom-two-beds",
    "26": "bathroom-vanity",
}


def main(src_dir):
    src_dir = Path(src_dir)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for num, slug in SLUGS.items():
        src = src_dir / f"{num}.jpg"
        img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        w, h = img.size
        widths = sorted({min(x, w) for x in WIDTHS})
        for tw in widths:
            im = img if tw == w else img.resize((tw, round(h * tw / w)), Image.LANCZOS)
            im.save(OUT / f"{slug}-{tw}.webp", "WEBP", quality=80, method=6)
        fw = min(FALLBACK_WIDTH, w)
        fb = img if fw == w else img.resize((fw, round(h * fw / w)), Image.LANCZOS)
        fb.save(OUT / f"{slug}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        manifest[slug] = {"w": w, "h": h, "widths": widths}
        print(f"{num} -> {slug}  {w}x{h}  widths={widths}")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "photos/original")
