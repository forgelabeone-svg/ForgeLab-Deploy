#!/usr/bin/env python3
"""
scripts/generate_icons.py

Generate PNG icons for the Chrome Extension (Smart Tab Manager).
Produces icon-16.png, icon-32.png, icon-48.png, icon-128.png
in the chrome_extension/icons/ directory.

Uses only the Python standard library + optional Pillow.
If Pillow is not installed, falls back to a minimal pure-Python
PPM-to-PNG writer so the script never requires external packages.

BEOCIA Kft. / Trinexus Aqua — internal developer tool.
"""

import os
import struct
import zlib
import math
import sys

# ---------------------------------------------------------------------------
# Output directory
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ICONS_DIR = os.path.join(PROJECT_ROOT, "chrome_extension", "icons")

SIZES = [16, 32, 48, 128]

# ---------------------------------------------------------------------------
# Design constants  (dark tech theme — #1a1a2e bg, #3b82f6 accent)
# ---------------------------------------------------------------------------
BG_COLOR     = (26,  26,  46)   # #1a1a2e
ACCENT_COLOR = (59, 130, 246)   # #3b82f6
LIGHT_COLOR  = (226, 232, 240)  # #e2e8f0  — tab symbol highlight
BORDER_COLOR = (99, 102, 241)   # #6366f1  — ring / border


# ---------------------------------------------------------------------------
# Minimal pure-Python PNG encoder (no external deps)
# ---------------------------------------------------------------------------

def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    """Build a single PNG chunk: length + type + data + CRC."""
    c = chunk_type + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)


def _encode_png(width: int, height: int, pixels: list) -> bytes:
    """
    Encode a raw RGBA pixel list as PNG bytes.
    pixels: flat list of (R, G, B, A) tuples, row-major, top-to-bottom.
    """
    # PNG signature
    sig = b"\x89PNG\r\n\x1a\n"

    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    # colour type 2 = RGB (we'll drop alpha from tuples for simplicity)
    # Actually use colour type 6 = RGBA
    ihdr_data = struct.pack(">II", width, height) + bytes([8, 6, 0, 0, 0])
    ihdr = _png_chunk(b"IHDR", ihdr_data)

    # IDAT — raw image data, one filter byte (0) per scanline
    raw_rows = []
    for row in range(height):
        row_bytes = bytearray()
        row_bytes.append(0)  # filter type None
        for col in range(width):
            r, g, b, a = pixels[row * width + col]
            row_bytes += bytes([r, g, b, a])
        raw_rows.append(bytes(row_bytes))

    compressed = zlib.compress(b"".join(raw_rows), 9)
    idat = _png_chunk(b"IDAT", compressed)

    # IEND
    iend = _png_chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


# ---------------------------------------------------------------------------
# Drawing helpers (operate on a flat RGBA pixel list)
# ---------------------------------------------------------------------------

def _new_canvas(size: int, color=(0, 0, 0, 0)) -> list:
    """Return a flat list of RGBA tuples."""
    return [color] * (size * size)


def _set_pixel(pixels: list, width: int, x: int, y: int, color: tuple):
    if 0 <= x < width and 0 <= y < width:
        pixels[y * width + x] = color


def _fill_rect(pixels: list, width: int, x0, y0, x1, y1, color: tuple):
    for y in range(y0, y1):
        for x in range(x0, x1):
            _set_pixel(pixels, width, x, y, color)


def _fill_rounded_rect(pixels: list, width: int, x0, y0, x1, y1, radius, color: tuple):
    """Fill a rounded rectangle using distance-to-corner circles."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            # Check corners
            in_tl = (x - (x0 + radius)) ** 2 + (y - (y0 + radius)) ** 2
            in_tr = (x - (x1 - 1 - radius)) ** 2 + (y - (y0 + radius)) ** 2
            in_bl = (x - (x0 + radius)) ** 2 + (y - (y1 - 1 - radius)) ** 2
            in_br = (x - (x1 - 1 - radius)) ** 2 + (y - (y1 - 1 - radius)) ** 2
            r2 = radius * radius
            if x < x0 + radius and y < y0 + radius and in_tl > r2:
                continue
            if x >= x1 - radius and y < y0 + radius and in_tr > r2:
                continue
            if x < x0 + radius and y >= y1 - radius and in_bl > r2:
                continue
            if x >= x1 - radius and y >= y1 - radius and in_br > r2:
                continue
            _set_pixel(pixels, width, x, y, color)


def _draw_tab_symbol(pixels: list, size: int):
    """
    Draw a simplified 'tab' symbol: stacked horizontal bars
    representing browser tabs — scaled to the icon size.
    """
    pad   = max(2, size // 8)
    bar_h = max(1, size // 10)
    gap   = max(1, size // 10)

    left  = pad
    right = size - pad

    # Three horizontal tab bars
    positions = [
        pad + gap,
        pad + gap * 2 + bar_h,
        pad + gap * 3 + bar_h * 2,
    ]

    accent_rgba = ACCENT_COLOR + (255,)
    light_rgba  = LIGHT_COLOR  + (230,)

    for i, top in enumerate(positions):
        bottom = top + bar_h
        if bottom > size - pad:
            break
        col = accent_rgba if i == 0 else light_rgba
        _fill_rect(pixels, size, left, top, right, bottom, col)

    # Small "tab cap" on top-left of first bar (wider notch)
    cap_w = (right - left) // 3
    cap_top = positions[0] - max(1, bar_h)
    if cap_top >= pad:
        _fill_rect(pixels, size, left, cap_top, left + cap_w, positions[0], accent_rgba)


# ---------------------------------------------------------------------------
# Icon renderer
# ---------------------------------------------------------------------------

def render_icon(size: int) -> bytes:
    """
    Render a single icon of `size` x `size` pixels and return PNG bytes.

    Visual design:
      - Dark rounded-square background (#1a1a2e)
      - Blue accent border ring (#6366f1)
      - Tab stack symbol in blue/white
    """
    pixels = _new_canvas(size, (0, 0, 0, 0))

    bg_rgba     = BG_COLOR     + (255,)
    border_rgba = BORDER_COLOR + (255,)

    radius = max(2, size // 6)
    border = max(1, size // 16)

    # Outer border rounded rect
    _fill_rounded_rect(pixels, size, 0, 0, size, size, radius, border_rgba)

    # Inner background rounded rect
    _fill_rounded_rect(
        pixels, size,
        border, border, size - border, size - border,
        max(1, radius - border),
        bg_rgba,
    )

    # Tab symbol
    _draw_tab_symbol(pixels, size)

    return _encode_png(size, size, pixels)


# ---------------------------------------------------------------------------
# Pillow-based renderer (higher quality, used if Pillow is available)
# ---------------------------------------------------------------------------

def _render_with_pillow(size: int) -> bytes:
    from PIL import Image, ImageDraw  # type: ignore

    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = max(2, size // 6)
    border = max(1, size // 16)

    # Border rounded rect
    draw.rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=radius,
        fill=BORDER_COLOR + (255,),
    )

    # BG inner
    draw.rounded_rectangle(
        [border, border, size - 1 - border, size - 1 - border],
        radius=max(1, radius - border),
        fill=BG_COLOR + (255,),
    )

    pad   = max(2, size // 8)
    bar_h = max(1, size // 10)
    gap   = max(1, size // 10)
    left  = pad
    right = size - pad

    positions = [
        pad + gap,
        pad + gap * 2 + bar_h,
        pad + gap * 3 + bar_h * 2,
    ]

    for i, top in enumerate(positions):
        bottom = top + bar_h
        if bottom > size - pad:
            break
        col = ACCENT_COLOR + (255,) if i == 0 else LIGHT_COLOR + (230,)
        draw.rectangle([left, top, right - 1, bottom - 1], fill=col)

    cap_w   = (right - left) // 3
    cap_top = positions[0] - max(1, bar_h)
    if cap_top >= pad:
        draw.rectangle(
            [left, cap_top, left + cap_w - 1, positions[0] - 1],
            fill=ACCENT_COLOR + (255,),
        )

    import io
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(ICONS_DIR, exist_ok=True)

    try:
        import PIL  # noqa: F401
        use_pillow = True
        print("[generate_icons] Pillow found — using high-quality renderer.")
    except ImportError:
        use_pillow = False
        print("[generate_icons] Pillow not found — using built-in pure-Python renderer.")
        print("                 Install Pillow for sharper icons: pip install Pillow")

    for size in SIZES:
        out_path = os.path.join(ICONS_DIR, f"icon-{size}.png")

        if use_pillow:
            png_bytes = _render_with_pillow(size)
        else:
            png_bytes = render_icon(size)

        with open(out_path, "wb") as f:
            f.write(png_bytes)

        print(f"[generate_icons] Written {size}x{size} → {out_path}  ({len(png_bytes)} bytes)")

    print(f"\n[generate_icons] Done. {len(SIZES)} icons saved to: {ICONS_DIR}")


if __name__ == "__main__":
    main()
# [FL:DONE]