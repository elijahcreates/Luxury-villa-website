#!/usr/bin/env python3
"""Build the tall (4:5) pool photo used in the amenities section, as clear as the source allows.

The source (03.jpg) is only 1206x722, so the tall crop is about 578 px wide. Instead of letting
the browser stretch it (soft, blocky), this script:
  1. cleans compression blocking (edge-aware, flat areas only),
  2. crops the 4:5 frame,
  3. enlarges 2.5x with Lanczos in two steps,
  4. sharpens only real edges (threshold keeps sky and water smooth).
Usage: python3 tools/pool_tall.py SOURCE_03.jpg
"""
import sys, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
src = sys.argv[1]
tmp = OUT / "_pool_clean.png"
subprocess.run([sys.executable, str(ROOT / "tools" / "clean_photo.py"), src, str(tmp)], check=True)
im = Image.open(tmp).convert("RGB"); tmp.unlink()
w, h = im.size
cw = round(h * 4 / 5); x0 = round((w - cw) * 0.38)
im = im.crop((x0, 0, x0 + cw, h))
# two-step Lanczos enlargement (smoother than one big jump)
im = im.resize((round(cw * 1.6), round(h * 1.6)), Image.LANCZOS)
im = im.resize((round(cw * 2.5), round(h * 2.5)), Image.LANCZOS)
# edge-only sharpening, two radii: fine detail + edge definition
im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=55, threshold=5))
im = im.filter(ImageFilter.UnsharpMask(radius=0.9, percent=35, threshold=6))
W, H = im.size
for tw in (640, 1024, W):
    o = im if tw == W else im.resize((tw, round(H * tw / W)), Image.LANCZOS)
    o.save(OUT / f"pool-deck-tall-{tw}.webp", "WEBP", quality=90, method=6)
im.resize((900, round(H * 900 / W)), Image.LANCZOS).save(OUT / "pool-deck-tall.jpg", "JPEG", quality=90, optimize=True, progressive=True)
print("pool-deck-tall", W, H)
