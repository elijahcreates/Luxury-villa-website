#!/usr/bin/env python3
"""
Natural real-estate photo enhancement.

Global, photographic corrections ONLY - nothing is generated, added, removed,
warped or retouched locally. The same parameters are applied to every photo so
the set has a consistent look.

  1. White balance  - neutralises colour casts using the image's own near-white
                      surfaces (walls / ceilings), applied partially so the room
                      keeps a natural, slightly warm feel.
  2. Exposure       - a midtone (gamma) lift toward a target brightness, with a
                      soft highlight shoulder so windows / lamps don't clip.
  3. Shadows        - small lift of the deepest tones (like a "shadows +" slider).
  4. Contrast       - a gentle S-curve on luminance.
  5. Noise          - very light chroma-noise reduction (colour speckle only).
  6. Sharpening     - mild unsharp mask, applied after resizing.

Usage:
  python3 tools/enhance.py INPUT.jpg OUTPUT.jpg [--max 2400] [--quality 88]
"""
import argparse

import numpy as np
from PIL import Image, ImageFilter, ImageOps

# ---- shared style parameters (one look for the whole set) -------------------
WB_STRENGTH = 0.85        # 0 = leave as shot, 1 = fully neutral
WB_WARM_BIAS = (1.012, 1.0, 0.985)  # keep a hint of warmth (R, G, B multipliers)
TARGET_MEDIAN = 0.54      # target median luminance (display-referred 0..1)
MAX_GAMMA_SHIFT = 0.30    # cap on how far exposure can be pushed either way
SHADOW_LIFT = 0.035
CONTRAST = 0.16           # S-curve strength
SHOULDER_START = 0.86     # highlights above this roll off softly
CHROMA_DENOISE_RADIUS = 1.2
SHARPEN = dict(radius=1.1, percent=45, threshold=3)


def luminance(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def white_balance(a):
    """Estimate the scene illuminant from the brightest non-clipped surfaces
    (painted ceilings / walls / trim - "white patch"), blended with a little
    grey-world so strongly tinted interiors are pulled back toward neutral.
    Applied partially so rooms keep a natural, slightly warm feel."""
    L = luminance(a)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    mask = (L > np.percentile(L, 80)) & (L < 0.97) & (sat < 0.35)
    if mask.sum() < 500:
        mask = L > np.percentile(L, 80)
    white_patch = a[mask].mean(axis=0)
    grey_world = a.reshape(-1, 3).mean(axis=0)
    ref = np.exp(0.75 * np.log(white_patch) + 0.25 * np.log(grey_world))
    gains = ref[1] / np.maximum(ref, 1e-4)
    gains = np.exp(np.log(gains) * WB_STRENGTH) * np.array(WB_WARM_BIAS)
    gains = np.clip(gains, 0.85, 1.20)
    gains = gains / luminance(gains[None, None, :])[0, 0]  # keep brightness
    return a * gains, gains


def tone(a):
    L = luminance(a)
    med = float(np.median(L))
    # gamma that maps current median -> target median
    g = np.log(TARGET_MEDIAN) / np.log(max(min(med, 0.95), 0.05))
    g = float(np.clip(g, 1 - MAX_GAMMA_SHIFT, 1 + MAX_GAMMA_SHIFT))
    Ln = np.clip(L, 0, None) ** g
    # shadow lift (fades out by mid-grey)
    Ln = Ln + SHADOW_LIFT * (1 - Ln) * np.exp(-Ln * 6)
    # gentle S-curve around the midpoint
    Ln = Ln + CONTRAST * Ln * (1 - Ln) * (Ln - 0.5) * 2
    # soft highlight shoulder
    s = SHOULDER_START
    over = Ln > s
    Ln[over] = s + (1 - s) * np.tanh((Ln[over] - s) / (1 - s))
    ratio = Ln / np.maximum(L, 1e-4)
    out = a * ratio[..., None]
    # protect against channel clipping by compressing toward luminance
    peak = out.max(axis=2, keepdims=True)
    k = np.where(peak > 1.0, (1.0 - Ln[..., None]) / np.maximum(peak - Ln[..., None], 1e-4), 1.0)
    out = Ln[..., None] + (out - Ln[..., None]) * np.clip(k, 0, 1)
    return out, g, med


def chroma_denoise(img):
    ycc = img.convert("YCbCr")
    y, cb, cr = ycc.split()
    cb = cb.filter(ImageFilter.GaussianBlur(CHROMA_DENOISE_RADIUS))
    cr = cr.filter(ImageFilter.GaussianBlur(CHROMA_DENOISE_RADIUS))
    return Image.merge("YCbCr", (y, cb, cr)).convert("RGB")


def enhance(src, dst, max_side=2400, quality=88, verbose=True):
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    a = np.asarray(img).astype(np.float32) / 255.0
    a, gains = white_balance(a)
    a, g, med = tone(a)
    out = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
    out = chroma_denoise(out)
    if max(out.size) > max_side:
        out.thumbnail((max_side, max_side), Image.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(**SHARPEN))
    out.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
    if verbose:
        print(f"{src} -> {dst}  wb={np.round(gains, 3)}  median {med:.3f}  gamma {g:.3f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--max", type=int, default=2400)
    p.add_argument("--quality", type=int, default=88)
    args = p.parse_args()
    enhance(args.src, args.dst, args.max, args.quality)
