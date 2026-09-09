#!/usr/bin/env python3
"""Normalize a generated 8-direction / 5-state creature atlas for Phaser.

The built-in image generator can render its transparent preview as a pale
checkerboard.  This tool removes only that neutral, near-white backing, keeps
the painted creature pixels, aligns every cell to a single feet baseline and
re-packs the result as 8 x 5 fixed 256 px frames.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


DIRECTIONS = ("n", "ne", "e", "se", "s", "sw", "w", "nw")
STATES = ("idle", "walk_a", "walk_b", "attack_windup", "attack_strike")
FRAME_SIZE = 256
BASELINE = 244


def is_neutral_backdrop(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    if alpha == 0:
        return True
    high = max(red, green, blue)
    low = min(red, green, blue)
    # The generator preview uses pale, nearly neutral #DBDDE1..#FFFFFF tiles.
    # Legitimate wolf fur, leather, steel and skin are either darker or more
    # chromatic, so this does not erase white details wholesale.
    return low >= 205 and high - low <= 18


def keep_character_components(image: Image.Image) -> Image.Image:
    """Return a clean alpha image, retaining meaningful painted components."""
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    foreground = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            if not is_neutral_backdrop(pixels[x, y]):
                foreground[y * width + x] = 1

    # Separate any tiny neutral-preview remnants from actual creature parts.
    seen = bytearray(width * height)
    retained = bytearray(width * height)
    for start in range(width * height):
        if not foreground[start] or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        component: list[int] = []
        while queue:
            current = queue.popleft()
            component.append(current)
            cx, cy = current % width, current // width
            for oy in (-1, 0, 1):
                for ox in (-1, 0, 1):
                    if ox == 0 and oy == 0:
                        continue
                    nx, ny = cx + ox, cy + oy
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    neighbour = ny * width + nx
                    if foreground[neighbour] and not seen[neighbour]:
                        seen[neighbour] = 1
                        queue.append(neighbour)
        if len(component) >= 18:
            for index in component:
                retained[index] = 1

    output = Image.new("RGBA", (width, height))
    out = output.load()
    for y in range(height):
        for x in range(width):
            source = pixels[x, y]
            if retained[y * width + x]:
                # Remove only a pale, neutral outer rim left from the preview
                # checkerboard. Interior white details are protected because
                # they do not touch a transparent pixel.
                is_outer_edge = any(
                    nx < 0
                    or ny < 0
                    or nx >= width
                    or ny >= height
                    or not retained[ny * width + nx]
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                )
                red, green, blue, _ = source
                if is_outer_edge and min(red, green, blue) >= 178 and max(red, green, blue) - min(red, green, blue) <= 24:
                    out[x, y] = (0, 0, 0, 0)
                else:
                    out[x, y] = source[:3] + (255,)
            else:
                out[x, y] = (0, 0, 0, 0)
    return output


def grid_bounds(cleaned: Image.Image, count: int, horizontal: bool) -> list[int]:
    """Find real transparent gutters instead of assuming generator spacing."""
    alpha = cleaned.getchannel("A")
    width, height = cleaned.size
    size = width if horizontal else height
    other = height if horizontal else width

    def density(index: int) -> int:
        if horizontal:
            return sum(alpha.getpixel((index, y)) > 0 for y in range(other))
        return sum(alpha.getpixel((x, index)) > 0 for x in range(other))

    bounds = [0]
    interval = size / count
    # The generation is deliberately regular, but visual cells can overlap the
    # mathematical fifth or eighth by a few pixels.  Pick the least populated
    # line near every expected gutter.
    margin = max(8, round(interval * 0.28))
    for part in range(1, count):
        expected = round(part * interval)
        start = max(bounds[-1] + 1, expected - margin)
        end = min(size - 1, expected + margin)
        bounds.append(min(range(start, end + 1), key=density))
    bounds.append(size)
    return bounds


def split_cells(source: Image.Image) -> list[Image.Image]:
    width, height = source.size
    cleaned_source = keep_character_components(source)
    column_bounds = grid_bounds(cleaned_source, len(DIRECTIONS), horizontal=True)
    row_bounds = grid_bounds(cleaned_source, len(STATES), horizontal=False)
    cells: list[Image.Image] = []
    for row in range(len(STATES)):
        top, bottom = row_bounds[row], row_bounds[row + 1]
        for column in range(len(DIRECTIONS)):
            left, right = column_bounds[column], column_bounds[column + 1]
            cleaned = keep_character_components(source.crop((left, top, right, bottom)))
            bbox = cleaned.getbbox()
            if bbox is None:
                raise ValueError(f"Empty cell at row={row}, column={column}")
            cells.append(cleaned.crop(bbox))
    print(f"grid: columns={column_bounds}; rows={row_bounds}")
    return cells


def repack(cells: list[Image.Image]) -> Image.Image:
    max_width = max(cell.width for cell in cells)
    max_height = max(cell.height for cell in cells)
    scale = min(224 / max_width, 224 / max_height)
    sheet = Image.new("RGBA", (FRAME_SIZE * len(DIRECTIONS), FRAME_SIZE * len(STATES)))
    for index, cell in enumerate(cells):
        target_size = (max(1, round(cell.width * scale)), max(1, round(cell.height * scale)))
        # Resize premultiplied RGB and alpha separately.  A regular RGBA
        # Lanczos resize mixes transparent black into painted edge pixels and
        # produces the exact pale/dark fringe this pass is meant to prevent.
        values = np.asarray(cell.convert("RGBA"), dtype=np.float32) / 255.0
        alpha_values = values[:, :, 3:4]
        premultiplied = values[:, :, :3] * alpha_values
        rgb_image = Image.fromarray(np.rint(premultiplied * 255).astype(np.uint8), "RGB")
        alpha_image = Image.fromarray(np.rint(alpha_values[:, :, 0] * 255).astype(np.uint8), "L")
        rgb_resized = np.asarray(rgb_image.resize(target_size, Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
        alpha_resized = np.asarray(alpha_image.resize(target_size, Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
        restored = np.zeros((target_size[1], target_size[0], 4), dtype=np.uint8)
        nonzero = alpha_resized > 1e-4
        restored[:, :, :3][nonzero] = np.rint(
            np.clip(rgb_resized[nonzero] / alpha_resized[nonzero][:, None], 0.0, 1.0) * 255
        ).astype(np.uint8)
        restored[:, :, 3] = np.rint(np.clip(alpha_resized, 0.0, 1.0) * 255).astype(np.uint8)
        scaled = Image.fromarray(restored, "RGBA")
        row, column = divmod(index, len(DIRECTIONS))
        left = column * FRAME_SIZE + (FRAME_SIZE - scaled.width) // 2
        top = row * FRAME_SIZE + BASELINE - scaled.height
        sheet.alpha_composite(scaled, (left, top))
    return sheet


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    arguments = parser.parse_args()
    cells = split_cells(Image.open(arguments.input))
    result = repack(cells)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(arguments.output, "PNG", optimize=True)
    print(
        f"{arguments.output}: {result.width}x{result.height}; "
        f"frame={FRAME_SIZE}x{FRAME_SIZE}; directions={','.join(DIRECTIONS)}; "
        f"states={','.join(STATES)}"
    )


if __name__ == "__main__":
    main()
