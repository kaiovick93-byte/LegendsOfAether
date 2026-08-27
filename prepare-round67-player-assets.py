#!/usr/bin/env python3
"""Build the Round 67 selectable-player atlases from the six visual anchors.

Each anchor is segmented into a 4x8 walk grid, cleaned, normalized to 96px
cells and expanded into base/weapon/armor/weapon+armor variants.  Gold outline
atlases are derived cell-by-cell so city occlusion works for every option.
"""

from __future__ import annotations

from collections import Counter, deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets/source/player-generation"
OUTPUT = ROOT / "assets/images/characters/player"
CELL = 96
COLS = 4
ROWS = 8
BASELINE = 91
TARGET_HEIGHT = 84

HEROES = {
    "warrior_m": ("warrior_m.png", "warrior"),
    "warrior_f": ("warrior_f.png", "warrior"),
    "mage_m": ("mage_m.png", "mage"),
    "mage_f": ("mage_f.png", "mage"),
    "ranger_m": ("ranger_m.png", "ranger"),
    "ranger_f": ("ranger_f.png", "ranger"),
}
NORTH_OVERRIDES = {"warrior_f": "warrior_f_north.png"}


def clean_source(source: Image.Image) -> Image.Image:
    """Remove real alpha or a baked checkerboard without cutting the actors."""
    rgba = np.asarray(source.convert("RGBA")).copy()
    alpha = rgba[:, :, 3]
    if np.count_nonzero(alpha < 245) < alpha.size * 0.08:
        rgb = rgba[:, :, :3]
        flat = rgb.reshape(-1, 3)
        neutral = flat[(flat.min(axis=1) > 150) & ((flat.max(axis=1) - flat.min(axis=1)) < 30)]
        palette = [np.array(c, dtype=np.int32) for c, _ in Counter(map(tuple, neutral)).most_common(24)]
        px = rgb.astype(np.int32)
        distance2 = np.full(alpha.shape, 255 * 255 * 3, dtype=np.int32)
        for color in palette:
            delta = px - color
            distance2 = np.minimum(distance2, (delta * delta).sum(axis=2))
        distance = np.sqrt(distance2.astype(np.float32))
        # Soft matte keeps antialiased edges while exact checker colors vanish.
        alpha = np.clip((distance - 8.0) * 15.0, 0, 255).astype(np.uint8)
    else:
        alpha = np.where(alpha < 18, 0, alpha)
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def crop_main_actor(crop: Image.Image, label: str) -> Image.Image:
    alpha = np.asarray(crop.getchannel("A"))
    grown = ndimage.binary_dilation(alpha > 48, iterations=3)
    labels, count = ndimage.label(grown)
    if not count:
        raise RuntimeError(f"{label}: no actor pixels")
    scores = []
    for idx in range(1, count + 1):
        scores.append(int(np.count_nonzero((labels == idx) & (alpha > 18))))
    main = int(np.argmax(scores)) + 1
    ys, xs = np.where((labels == main) & (alpha > 18))
    if not len(xs):
        raise RuntimeError(f"{label}: empty actor component")
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    return crop.crop((max(0, x0 - 4), max(0, y0 - 4), min(crop.width, x1 + 4), min(crop.height, y1 + 4)))


def segment_anchor(path: Path) -> list[Image.Image]:
    source = clean_source(Image.open(path))
    rgba = np.asarray(source)
    alpha = rgba[:, :, 3]
    mask = alpha > 72

    def projection_centers(counts: np.ndarray, groups: int) -> list[float]:
        coords = np.arange(len(counts), dtype=np.float64)
        centers = np.linspace(len(counts) / (groups * 2), len(counts) - len(counts) / (groups * 2), groups)
        for _ in range(30):
            assignment = np.argmin(np.abs(coords[:, None] - centers[None, :]), axis=1)
            updated = centers.copy()
            for index in range(groups):
                selected = assignment == index
                weight = counts[selected].astype(np.float64)
                if weight.sum() > 0:
                    updated[index] = float((coords[selected] * weight).sum() / weight.sum())
            if np.max(np.abs(updated - centers)) < .01:
                break
            centers = updated
        return sorted(map(float, centers))

    source_rows = 7 if path.stem in NORTH_OVERRIDES else ROWS
    x_centers = projection_centers(mask.sum(axis=0), COLS)
    y_centers = projection_centers(mask.sum(axis=1), source_rows)
    x_bounds = [0] + [round((a + b) / 2) for a, b in zip(x_centers, x_centers[1:])] + [source.width]
    y_bounds = [0] + [round((a + b) / 2) for a, b in zip(y_centers, y_centers[1:])] + [source.height]

    frames: list[Image.Image] = []
    for row in range(source_rows):
        for col in range(COLS):
            x0, x1 = x_bounds[col], x_bounds[col + 1]
            y0, y1 = y_bounds[row], y_bounds[row + 1]
            crop = source.crop((x0, y0, x1, y1))
            frames.append(crop_main_actor(crop, f"{path.name} row={row} col={col}"))
    if source_rows == 7:
        # Insert the separately generated direct-back NORTH cycle between the
        # two rear diagonals; the original anchor genuinely contained 7 rows.
        north = segment_strip(SOURCE / NORTH_OVERRIDES[path.stem])
        frames = frames[:4 * 4] + north + frames[4 * 4:]
    return frames


def segment_strip(path: Path) -> list[Image.Image]:
    source = clean_source(Image.open(path))
    alpha = np.asarray(source)[:, :, 3]
    counts = (alpha > 72).sum(axis=0)
    coords = np.arange(source.width, dtype=np.float64)
    centers = np.linspace(source.width / 8, source.width - source.width / 8, COLS)
    for _ in range(30):
        assignment = np.argmin(np.abs(coords[:, None] - centers[None, :]), axis=1)
        updated = centers.copy()
        for index in range(COLS):
            selected = assignment == index
            weight = counts[selected].astype(np.float64)
            if weight.sum() > 0:
                updated[index] = float((coords[selected] * weight).sum() / weight.sum())
        if np.max(np.abs(updated - centers)) < .01:
            break
        centers = updated
    centers = sorted(map(float, centers))
    bounds = [0] + [round((a + b) / 2) for a, b in zip(centers, centers[1:])] + [source.width]
    frames = []
    for col in range(COLS):
        crop = source.crop((bounds[col], 0, bounds[col + 1], source.height))
        frames.append(crop_main_actor(crop, f"{path.name} strip col={col}"))
    return frames


def normalize_frames(frames: list[Image.Image]) -> list[Image.Image]:
    median_height = float(np.median([frame.height for frame in frames]))
    balanced: list[Image.Image] = []
    for frame in frames:
        if frame.height > median_height * 1.35 or frame.height < median_height * .72:
            ratio = median_height / frame.height
            frame = frame.resize((max(1, round(frame.width * ratio)), max(1, round(frame.height * ratio))), Image.Resampling.LANCZOS)
        balanced.append(frame)
    frames = balanced
    # One shared scale per hero prevents apparent size changes between frames.
    heights = np.array([frame.height for frame in frames], dtype=float)
    widths = np.array([frame.width for frame in frames], dtype=float)
    shared_scale = min(TARGET_HEIGHT / np.percentile(heights, 93), 78 / np.percentile(widths, 93))
    normalized: list[Image.Image] = []
    for frame in frames:
        w = max(1, round(frame.width * shared_scale))
        h = max(1, round(frame.height * shared_scale))
        resized = frame.resize((w, h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CELL, CELL))
        canvas.alpha_composite(resized, ((CELL - w) // 2, BASELINE - h))
        normalized.append(canvas)
    return normalized


def draw_armor(frame: Image.Image, hero_class: str, row: int) -> Image.Image:
    out = frame.copy()
    d = ImageDraw.Draw(out, "RGBA")
    # Chest placement follows the normalized torso. Back rows use a smaller
    # visible plate/mantle; profile rows shift it slightly with the body.
    side = row in (1, 2, 3, 5, 6, 7)
    back = row in (3, 4, 5)
    cx = 47 + (-2 if row in (1, 2, 3) else 2 if row in (5, 6, 7) else 0)
    if hero_class == "warrior":
        fill, edge, light = (93, 107, 119, 238), (38, 46, 55, 255), (188, 202, 205, 220)
    elif hero_class == "mage":
        fill, edge, light = (64, 77, 130, 232), (31, 30, 66, 255), (185, 155, 88, 220)
    else:
        fill, edge, light = (91, 67, 43, 236), (49, 37, 27, 255), (156, 117, 65, 220)
    top = 48 if back else 47
    width = 15 if side else 20
    d.rounded_rectangle((cx - width // 2, top, cx + width // 2, 65), radius=3, fill=fill, outline=edge, width=2)
    d.line((cx - width // 2 + 2, top + 3, cx + width // 2 - 2, top + 3), fill=light, width=2)
    if hero_class == "warrior":
        d.ellipse((cx - width // 2 - 4, top - 1, cx - width // 2 + 3, top + 7), fill=fill, outline=edge)
        d.ellipse((cx + width // 2 - 3, top - 1, cx + width // 2 + 4, top + 7), fill=fill, outline=edge)
    elif hero_class == "mage":
        d.polygon([(cx, top + 3), (cx + 4, top + 8), (cx, top + 12), (cx - 4, top + 8)], fill=light)
    else:
        d.line((cx - width // 2 + 2, top + 2, cx + width // 2 - 2, top + 14), fill=light, width=2)
        d.line((cx + width // 2 - 2, top + 2, cx - width // 2 + 2, top + 14), fill=light, width=2)
    return out


def draw_weapon(frame: Image.Image, hero_class: str, row: int, phase: int) -> Image.Image:
    out = frame.copy()
    # Draw at 3x and downsample for clean pixel-art diagonals.
    overlay = Image.new("RGBA", (CELL * 3, CELL * 3))
    d = ImageDraw.Draw(overlay, "RGBA")
    flip = row in (5, 6, 7)
    sway = (-1, 0, 1, 0)[phase]
    x = (35 if not flip else 61) * 3
    y = (45 + sway) * 3
    sign = 1 if not flip else -1
    if hero_class == "warrior":
        # Sword remains sheathed diagonally when walking.
        d.line((x, y, x + sign * 19 * 3, y - 25 * 3), fill=(42, 31, 24, 255), width=4 * 3)
        d.line((x, y, x + sign * 19 * 3, y - 25 * 3), fill=(190, 201, 206, 255), width=2 * 3)
        d.line((x + sign * 15 * 3, y - 21 * 3, x + sign * 23 * 3, y - 17 * 3), fill=(181, 128, 44, 255), width=3 * 3)
        d.ellipse((x + sign * 17 * 3 - 3, y - 29 * 3, x + sign * 17 * 3 + 5, y - 25 * 3), fill=(108, 63, 31, 255))
    elif hero_class == "mage":
        staff_x = (31 if not flip else 65) * 3
        d.line((staff_x, 30 * 3, staff_x + sign * 4 * 3, 87 * 3), fill=(52, 35, 24, 255), width=5 * 3)
        d.line((staff_x, 30 * 3, staff_x + sign * 4 * 3, 87 * 3), fill=(128, 85, 42, 255), width=2 * 3)
        d.ellipse((staff_x - 6 * 3, 23 * 3, staff_x + 6 * 3, 35 * 3), fill=(54, 155, 204, 235), outline=(205, 223, 235, 255), width=2 * 3)
    else:
        bow_x = (33 if not flip else 63) * 3
        top_y, bot_y = 34 * 3, 78 * 3
        d.arc((bow_x - 9 * 3, top_y, bow_x + 9 * 3, bot_y), 80 if not flip else 100, 280 if not flip else 260, fill=(150, 99, 46, 255), width=3 * 3)
        d.line((bow_x, top_y + 2 * 3, bow_x, bot_y - 2 * 3), fill=(222, 213, 176, 220), width=1 * 3)
        # Quiver and arrow feathers make the equipped bow readable at game size.
        qx = (57 if not flip else 39) * 3
        d.line((qx, 39 * 3, qx - sign * 5 * 3, 66 * 3), fill=(91, 56, 31, 255), width=5 * 3)
        for offset in (-3, 0, 3):
            d.line((qx + offset * 3, 37 * 3, qx - sign * 3 * 3 + offset * 3, 55 * 3), fill=(188, 153, 83, 255), width=1 * 3)
    overlay = overlay.resize((CELL, CELL), Image.Resampling.LANCZOS)
    out.alpha_composite(overlay)
    return out


def make_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL))
    for idx, frame in enumerate(frames):
        row, col = divmod(idx, COLS)
        sheet.alpha_composite(frame, (col * CELL, row * CELL))
    return sheet


def make_outline(sheet: Image.Image) -> Image.Image:
    outline = Image.new("RGBA", sheet.size)
    for row in range(ROWS):
        for col in range(COLS):
            cell = sheet.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            alpha = cell.getchannel("A")
            expanded = alpha.filter(ImageFilter.MaxFilter(7))
            border = np.maximum(np.asarray(expanded, dtype=np.int16) - np.asarray(alpha, dtype=np.int16), 0).astype(np.uint8)
            gold = Image.new("RGBA", (CELL, CELL), (255, 205, 72, 0))
            gold.putalpha(Image.fromarray(border, "L"))
            outline.alpha_composite(gold, (col * CELL, row * CELL))
    return outline


def save_png(image: Image.Image, path: Path) -> None:
    temporary = path.with_suffix(".tmp.png")
    image.save(temporary, format="PNG", optimize=True)
    temporary.replace(path)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Uma execução interrompida não pode deixar um PNG temporário ser copiado
    # pelo Vite ou incluído no pacote-fonte seguinte.
    for stale in OUTPUT.glob("*.tmp.png"):
        stale.unlink()
    for hero_id, (filename, hero_class) in HEROES.items():
        frames = normalize_frames(segment_anchor(SOURCE / filename))
        variants = {
            "base": frames,
            "weapon": [draw_weapon(frame, hero_class, idx // COLS, idx % COLS) for idx, frame in enumerate(frames)],
            "armor": [draw_armor(frame, hero_class, idx // COLS) for idx, frame in enumerate(frames)],
        }
        variants["weapon_armor"] = [
            draw_weapon(draw_armor(frame, hero_class, idx // COLS), hero_class, idx // COLS, idx % COLS)
            for idx, frame in enumerate(frames)
        ]
        for state, state_frames in variants.items():
            sheet = make_sheet(state_frames)
            save_png(sheet, OUTPUT / f"{hero_id}_{state}.png")
            save_png(make_outline(sheet), OUTPUT / f"{hero_id}_{state}_outline.png")
    for stale in OUTPUT.glob("*.tmp.png"):
        stale.unlink()
    print(f"PLAYER_ATLASES_OK heroes={len(HEROES)} variants=4 directions=8 frames=4 outlines=24")


if __name__ == "__main__":
    main()
