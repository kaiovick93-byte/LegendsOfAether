#!/usr/bin/env python3
"""Normaliza os assets visuais da revisão do Round 67.

O script mantém canvases estáveis para o Phaser, ancora os pés de cada frame,
remove fundos incorporados e aplica variações de telhado sem redesenhar a
arquitetura aprovada.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(__file__).resolve().parent
NPC_DIR = ROOT / "assets/images/characters/npcs/isometric"
BUILDING_DIR = ROOT / "assets/images/environment/buildings"
ISO_DIR = ROOT / "assets/images/environment/isometric"


def save_atomic(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp.png")
    image.save(temporary, "PNG", optimize=True)
    os.replace(temporary, destination)


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    rgba = np.asarray(image.convert("RGBA"))
    ys, xs = np.where(rgba[:, :, 3] > threshold)
    if len(xs) == 0:
        raise ValueError("frame sem pixels opacos")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def clean_connected_light_background(image: Image.Image) -> Image.Image:
    """Remove grades claras conectadas às bordas sem apagar roupas claras."""
    flooded = image.convert("RGBA")
    for seed in ((0, 0), (flooded.width - 1, 0), (0, flooded.height - 1), (flooded.width - 1, flooded.height - 1)):
        ImageDraw.floodfill(flooded, seed, (0, 0, 0, 0), thresh=42)
    rgba = np.array(flooded, copy=True)
    rgb = rgba[:, :, :3]
    candidate = (rgb.min(axis=2) > 210) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 18)
    mask = Image.fromarray(np.where(candidate, 255, 0).astype(np.uint8), "L")
    ImageDraw.floodfill(mask, (0, 0), 128, thresh=0)
    connected = np.asarray(mask) == 128
    rgba[connected, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def fit_foreground(
    image: Image.Image,
    canvas_size: tuple[int, int],
    target_height: int,
    baseline: int,
    max_width: int,
) -> Image.Image:
    image = image.convert("RGBA")
    crop = image.crop(alpha_bbox(image))
    scale = min(target_height / crop.height, max_width / crop.width)
    width = max(1, round(crop.width * scale))
    height = max(1, round(crop.height * scale))
    crop = crop.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    x = (canvas_size[0] - width) // 2
    y = baseline - height
    canvas.alpha_composite(crop, (x, y))
    return canvas


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    rgba = np.array(image.convert("RGBA"), copy=True)
    labels, count = ndimage.label(rgba[:, :, 3] > 8)
    if count <= 1:
        return Image.fromarray(rgba, "RGBA")
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    keep = int(areas.argmax())
    rgba[labels != keep, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def normalize_walk_sheet(source: Path, destination: Path, target_height: int) -> None:
    image = Image.open(source).convert("RGBA")
    alpha = np.asarray(image)[:, :, 3]
    labels, count = ndimage.label(alpha > 250)
    objects = ndimage.find_objects(labels)
    components = []
    for label_index, slices in enumerate(objects, start=1):
        if slices is None or np.count_nonzero(labels[slices] == label_index) <= 300:
            continue
        y_slice, x_slice = slices
        components.append((
            (x_slice.start + x_slice.stop) / 2,
            (y_slice.start + y_slice.stop) / 2,
            max(0, x_slice.start - 10),
            max(0, y_slice.start - 10),
            min(image.width, x_slice.stop + 10),
            min(image.height, y_slice.stop + 10),
        ))
    if len(components) != 32:
        raise ValueError(f"esperados 32 corpos opacos em {source}, encontrados {len(components)} de {count} componentes")
    components.sort(key=lambda item: item[1])
    output = Image.new("RGBA", (208 * 4, 224 * 8), (0, 0, 0, 0))
    for row in range(8):
        row_components = sorted(components[row * 4:(row + 1) * 4], key=lambda item: item[0])
        for column, (_cx, _cy, left, top, right, bottom) in enumerate(row_components):
            frame = keep_largest_alpha_component(image.crop((left, top, right, bottom)))
            fitted = fit_foreground(frame, (208, 224), target_height, 220, 198)
            output.alpha_composite(fitted, (column * 208, row * 224))
    save_atomic(output, destination)


def normalize_action_sheet(source: Path, base_path: Path, destination: Path) -> None:
    generated = Image.open(source)
    if not generated.mode.endswith("A") or generated.getextrema()[-1] == (255, 255):
        generated = clean_connected_light_background(generated)
    else:
        generated = generated.convert("RGBA")
    if generated.width % 4:
        raise ValueError(f"folha horizontal inválida: {source} ({generated.size})")

    base = Image.open(base_path).convert("RGBA")
    base_height = alpha_bbox(base)[3] - alpha_bbox(base)[1]
    base_cell = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    base_cell.alpha_composite(base, (24, 32))

    source_width = generated.width // 4
    output = Image.new("RGBA", (1024, 256), (0, 0, 0, 0))
    output.alpha_composite(base_cell, (0, 0))
    for column in (1, 2):
        frame = generated.crop((column * source_width, 0, (column + 1) * source_width, generated.height))
        fitted = fit_foreground(frame, (256, 256), base_height, 250, 248)
        output.alpha_composite(fitted, (column * 256, 0))
    output.alpha_composite(base_cell, (768, 0))
    save_atomic(output, destination)


def normalize_corner(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    fitted = fit_foreground(image, (256, 320), 292, 308, 238)
    save_atomic(fitted, destination)


def recolor_roof(
    path: Path,
    y_limit: int,
    target_hue: int,
    saturation_factor: float,
    value_factor: float,
    exclusions: tuple[tuple[int, int, int, int], ...] = (),
) -> None:
    image = Image.open(path).convert("RGBA")
    rgba = np.array(image, copy=True)
    hsv = np.array(image.convert("RGB").convert("HSV"), copy=True)
    yy = np.arange(image.height)[:, None]
    hue, saturation, value = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    mask = (
        (rgba[:, :, 3] > 8)
        & (yy < y_limit)
        & (hue >= 135)
        & (hue <= 190)
        & (saturation > 45)
        & (value > 28)
    )
    for x1, y1, x2, y2 in exclusions:
        mask[y1:y2, x1:x2] = False
    hsv[:, :, 0][mask] = target_hue
    hsv[:, :, 1][mask] = np.clip(hsv[:, :, 1][mask] * saturation_factor, 0, 255).astype(np.uint8)
    hsv[:, :, 2][mask] = np.clip(hsv[:, :, 2][mask] * value_factor, 0, 255).astype(np.uint8)
    recolored = np.array(Image.fromarray(hsv, "HSV").convert("RGB"))
    rgba[:, :, :3][mask] = recolored[:, :, :3][mask]
    save_atomic(Image.fromarray(rgba, "RGBA"), path)


def clear_alpha_regions(path: Path, regions: tuple[tuple[int, int, int, int], ...]) -> None:
    image = Image.open(path).convert("RGBA")
    rgba = np.array(image, copy=True)
    for x1, y1, x2, y2 in regions:
        rgba[y1:y2, x1:x2, 3] = 0
    save_atomic(Image.fromarray(rgba, "RGBA"), path)


def make_generic_smoke() -> None:
    source = BUILDING_DIR / "blacksmith_smoke.png"
    image = Image.open(source).convert("RGBA")
    rgba = np.array(image, copy=True)
    rgba[58:, :, 3] = 0
    save_atomic(Image.fromarray(rgba, "RGBA"), BUILDING_DIR / "chimney_smoke.png")


def make_wall_gate_halves() -> None:
    wall = Image.open(ISO_DIR / "isometric_city_wall.png").convert("RGBA")
    if wall.size != (250, 357):
        raise ValueError(f"módulo de muralha inesperado: {wall.size}")
    save_atomic(wall.crop((0, 0, 188, 357)), ISO_DIR / "isometric_city_wall_half_left.png")
    save_atomic(wall.crop((62, 0, 250, 357)), ISO_DIR / "isometric_city_wall_half_right.png")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--resident", type=Path, required=True)
    parser.add_argument("--traveler", type=Path, required=True)
    parser.add_argument("--mira", type=Path, required=True)
    parser.add_argument("--general", type=Path, required=True)
    parser.add_argument("--corner", type=Path, required=True)
    args = parser.parse_args()

    normalize_walk_sheet(args.resident, NPC_DIR / "resident_iso_walk.png", 208)
    normalize_walk_sheet(args.traveler, NPC_DIR / "traveler_iso_walk.png", 216)
    normalize_action_sheet(args.mira, NPC_DIR / "elder_mira_iso.png", NPC_DIR / "elder_mira_iso_action.png")
    normalize_action_sheet(args.general, NPC_DIR / "general_iso.png", NPC_DIR / "general_iso_action.png")
    normalize_corner(args.corner, ISO_DIR / "isometric_city_wall_corner.png")

    # Remove somente a fumaça pintada; chaminés e telhados permanecem intactos.
    clear_alpha_regions(BUILDING_DIR / "blacksmith_shop.png", ((315, 0, 410, 58),))
    clear_alpha_regions(BUILDING_DIR / "artisan_house.png", ((330, 0, 440, 88), (435, 0, 465, 42)))
    clear_alpha_regions(BUILDING_DIR / "healer_house.png", ((35, 0, 145, 70),))

    # Identidades de telhado: forja em ardósia de carvão, arquivo em ameixa
    # envelhecida e taverna em telha marrom rústica.
    recolor_roof(
        BUILDING_DIR / "blacksmith_shop.png", 350, 18, 0.22, 0.72,
        exclusions=((205, 250, 290, 455),),
    )
    recolor_roof(
        BUILDING_DIR / "scholar_house.png", 610, 202, 0.78, 0.88,
        exclusions=((115, 260, 270, 535), (430, 500, 970, 690)),
    )
    recolor_roof(BUILDING_DIR / "tavern_house.png", 335, 20, 0.92, 0.82)
    make_generic_smoke()
    make_wall_gate_halves()


if __name__ == "__main__":
    main()
