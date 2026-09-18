#!/usr/bin/env python3
"""
Generate the static Open Graph image for the portfolio.

Why a static file instead of Next.js `opengraph-image.tsx`:
  The site deploys to Cloudflare Workers, where runtime image rendering
  (satori / @vercel/og) needs a WASM font pipeline and adds weight to the
  Worker bundle. A pre-rendered PNG is zero runtime cost and renders
  identically everywhere.

Usage:
  python3 scripts/generate-og.py

Output:
  public/og.png   (1200x630 — the size every major platform expects)

The fonts are read from the same self-hosted woff2 files the site uses, so
the card always matches the site's typography. Requires `woff2_decompress`
(part of the woff2 package) and Pillow.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
TMP = ROOT / ".ogtmp"
OUT = ROOT / "public" / "og.png"

# Brand tokens — keep in sync with src/app/globals.css
INK = (13, 14, 19)          # dark background
ACCENT = (235, 89, 57)      # --color-accent (#eb5939)
GREEN = (34, 197, 94)       # availability badge
WHITE = (255, 255, 255)
GRAY = (154, 156, 164)
GRAY_DIM = (110, 112, 120)
HAIRLINE = (255, 255, 255)

W, H = 1200, 630
MARGIN = 72

# Vertical layout budget (all in px from the top of the canvas)
TOP_ROW_Y = 70            # availability pill + wordmark
KICKER_Y = 206            # "FULLSTACK DEVELOPER / INDONESIA"
NAME_TOP = 250            # top of the two-line display name
NAME_BOTTOM = 496         # display name must not extend past this
RULE_Y = 528              # hairline separator
FOOTER_Y = 560            # url + call-to-action row


def ttf(woff2_name: str) -> Path:
    """Decompress a woff2 from public/fonts into .ogtmp and return the TTF path.

    Note: `woff2_decompress` writes the .ttf next to its *input* file, not in
    the current working directory, so we move it and keep public/fonts clean.
    """
    TMP.mkdir(exist_ok=True)
    src = FONTS / woff2_name
    dst = TMP / (Path(woff2_name).stem + ".ttf")
    if dst.exists():
        return dst

    if not src.exists():
        sys.exit(f"missing font: {src}")

    subprocess.run(
        ["woff2_decompress", str(src)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    produced = src.with_suffix(".ttf")
    if not produced.exists():
        sys.exit(f"woff2_decompress produced nothing for {src}")
    produced.replace(dst)
    return dst


def tracked_width(draw: ImageDraw.ImageDraw, text: str, font, tracking: float = 0) -> float:
    """Width of `text` including manual letter-spacing."""
    if not text:
        return 0.0
    return sum(draw.textlength(c, font=font) for c in text) + tracking * (len(text) - 1)


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    font,
    fill,
    tracking: float = 0,
) -> float:
    """Draw text with manual letter-spacing. `xy` is the baseline-left anchor.

    Returns the x position just past the last glyph.
    """
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill, anchor="ls")
        x += draw.textlength(ch, font=font) + tracking
    return x - tracking if text else x


def fit_size(draw, text: str, path: Path, max_width: float, start: int, tracking=0) -> int:
    """Largest font size at which `text` fits within max_width."""
    size = start
    while size > 8:
        font = ImageFont.truetype(str(path), size)
        if tracked_width(draw, text, font, tracking) <= max_width:
            return size
        size -= 1
    return 8


def main() -> None:
    tanker = ttf("Tanker-Regular.woff2")
    switzer_400 = ttf("Switzer-400.woff2")
    switzer_600 = ttf("Switzer-600.woff2")

    img = Image.new("RGB", (W, H), INK)

    # --- accent glow, bottom-right (mirrors the site's warm accent wash) ---
    glow = Image.new("RGB", (W, H), INK)
    gdraw = ImageDraw.Draw(glow)
    cx, cy = W - 40, H + 40
    steps = 260
    for i in range(steps, 0, -1):
        t = i / steps
        r = int(620 * t)
        weight = (1 - t) ** 3 * 0.5
        color = tuple(int(INK[c] + (ACCENT[c] - INK[c]) * weight) for c in range(3))
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    img = Image.blend(img, glow, 0.8)

    draw = ImageDraw.Draw(img)

    # --- hairline separator ---
    draw.line([(MARGIN, RULE_Y), (W - MARGIN, RULE_Y)], fill=(48, 50, 58), width=1)

    # --- availability pill (left) — drawn on an RGBA layer so the fill is
    #     genuinely translucent instead of a solid block over the text. ---
    pill_font = ImageFont.truetype(str(switzer_600), 19)
    pill_text = "AVAILABLE FOR FREELANCE"
    ptrack = 1.5
    pw = tracked_width(draw, pill_text, pill_font, ptrack)
    pill_h = 46
    pad_x = 22
    dot_r = 4
    pill_w = pad_x * 2 + dot_r * 2 + 12 + pw

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.rounded_rectangle(
        [MARGIN, TOP_ROW_Y, MARGIN + pill_w, TOP_ROW_Y + pill_h],
        radius=pill_h / 2,
        fill=(*GREEN, 26),
        outline=(*GREEN, 150),
        width=2,
    )
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # pill contents: pulsing dot + label, both vertically centred
    mid_y = TOP_ROW_Y + pill_h / 2
    dot_cx = MARGIN + pad_x + dot_r
    draw.ellipse([dot_cx - dot_r, mid_y - dot_r, dot_cx + dot_r, mid_y + dot_r], fill=GREEN)
    # baseline for vertically centred text: cap-height/2 below the midline
    pill_baseline = mid_y + 7
    draw_tracked(
        draw, (dot_cx + dot_r + 12, pill_baseline), pill_text, pill_font, GREEN, tracking=ptrack
    )

    # --- wordmark (right) ---
    mark_font = ImageFont.truetype(str(switzer_600), 21)
    mark = "AURA AUVAROSE"
    mtrack = 3.0
    mw = tracked_width(draw, mark, mark_font, mtrack)
    draw_tracked(
        draw, (W - MARGIN - mw, TOP_ROW_Y + 33), mark, mark_font, WHITE, tracking=mtrack
    )

    # --- kicker ---
    kicker_font = ImageFont.truetype(str(switzer_400), 25)
    draw_tracked(
        draw,
        (MARGIN, KICKER_Y + 18),
        "FULLSTACK DEVELOPER  /  INDONESIA",
        kicker_font,
        GRAY,
        tracking=3.6,
    )

    # --- display name: pick ONE size for both lines that satisfies
    #     (a) horizontal fit and (b) the vertical block budget. ---
    max_text_w = W - MARGIN * 2
    line1, line2 = "AURA", "AUVAROSE"
    name_track = 2.0

    by_width = min(
        fit_size(draw, line1, tanker, max_text_w, 200, name_track),
        # leave room for the accent period after line 2
        fit_size(draw, line2, tanker, max_text_w - 46, 200, name_track),
    )

    # Vertical: two baselines inside NAME_TOP..NAME_BOTTOM.
    # line_height is the baseline-to-baseline distance.
    block_h = NAME_BOTTOM - NAME_TOP
    by_height = int(block_h / 1.82)  # 2 lines + small leading, in font units

    size = max(40, min(by_width, by_height))
    name_font = ImageFont.truetype(str(tanker), size)
    ascent, _ = name_font.getmetrics()

    line_height = int(size * 0.91)
    baseline1 = NAME_TOP + ascent
    baseline2 = baseline1 + line_height

    draw_tracked(draw, (MARGIN, baseline1), line1, name_font, WHITE, tracking=name_track)
    x_end = draw_tracked(draw, (MARGIN, baseline2), line2, name_font, ACCENT, tracking=name_track)
    draw.text((x_end + 8, baseline2), ".", font=name_font, fill=ACCENT, anchor="ls")

    # --- footer row ---
    foot_font = ImageFont.truetype(str(switzer_400), 23)
    foot_bold = ImageFont.truetype(str(switzer_600), 23)
    draw_tracked(
        draw, (MARGIN, FOOTER_Y + 22), "portofolio.auraauvarose.workers.dev", foot_font, GRAY_DIM
    )

    tag = "Available for projects"
    tw = tracked_width(draw, tag, foot_bold)
    draw_tracked(draw, (W - MARGIN - tw, FOOTER_Y + 22), tag, foot_bold, WHITE)

    # --- sanity checks: fail loudly rather than shipping a broken card ---
    problems = []
    if x_end + 8 > W - MARGIN:
        problems.append(f"name overflows right edge (x={x_end + 8:.0f})")
    if baseline2 > RULE_Y - 8:
        problems.append(f"name baseline {baseline2} collides with rule {RULE_Y}")
    if baseline2 > FOOTER_Y:
        problems.append(f"name baseline {baseline2} collides with footer {FOOTER_Y}")
    if MARGIN + pill_w > W - MARGIN:
        problems.append("pill wider than content box")
    if problems:
        sys.exit("layout check failed: " + "; ".join(problems))

    img.save(OUT, "PNG", optimize=True)
    print(
        f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size / 1024:.0f} KB, "
        f"name size {size}px, baseline2 {baseline2})"
    )


if __name__ == "__main__":
    main()
