#!/usr/bin/env python3
"""Normaliza os pisos e a vegetação animada da revisão do Round 67."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parent
ISO_DIR = ROOT / "assets/images/environment/isometric"


def save_atomic(image: Image.Image, destination: Path) -> None:
    temporary = destination.with_name(destination.name + ".tmp.png")
    image.save(temporary, "PNG", optimize=True)
    os.replace(temporary, destination)


def diamond_mask(size: tuple[int, int]) -> Image.Image:
    width, height = size
    scale = 2
    mask = Image.new("L", (width * scale, height * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(
        [
            (width * scale // 2, 0),
            (width * scale - 1, height * scale // 2),
            (width * scale // 2, height * scale - 1),
            (0, height * scale // 2),
        ],
        fill=255,
    )
    return mask.resize(size, Image.Resampling.LANCZOS)


def normalize_diamond(
    source: Path,
    size: tuple[int, int],
    color: float,
    brightness: float,
    contrast: float,
    overscan: tuple[int, int] = (0, 0),
    edge_color: tuple[int, int, int] = (0, 0, 0),
    source_crop: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    if source_crop:
        image = image.crop(source_crop)
    inset_x, inset_y = overscan
    if inset_x or inset_y:
        image = image.crop((inset_x, inset_y, image.width - inset_x, image.height - inset_y))
    image = image.resize(size, Image.Resampling.LANCZOS)
    image = ImageEnhance.Color(image).enhance(color)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    mask = diamond_mask(size)
    # Pixels totalmente transparentes também recebem uma cor compatível com
    # o piso. Isso impede que filtros de escala puxem branco do antigo fundo
    # quadriculado e formem um halo nas diagonais do losango.
    rgb = Image.composite(image.convert("RGB"), Image.new("RGB", size, edge_color), mask)
    output = rgb.convert("RGBA")
    output.putalpha(mask)
    return output


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("quadro sem pixels opacos")
    return bbox


def normalize_tufts(source: Path) -> Image.Image:
    sheet = Image.open(source).convert("RGBA")
    cell_width = sheet.width / 4
    output = Image.new("RGBA", (384, 96), (0, 0, 0, 0))
    for index in range(4):
        left = round(index * cell_width)
        right = round((index + 1) * cell_width)
        frame = sheet.crop((left, 0, right, sheet.height))
        crop = frame.crop(alpha_bbox(frame))
        crop = ImageEnhance.Color(crop).enhance(.72)
        crop = ImageEnhance.Brightness(crop).enhance(.76)
        crop = ImageEnhance.Contrast(crop).enhance(.94)
        scale = min(58 / crop.height, 88 / crop.width)
        width = max(1, round(crop.width * scale))
        height = max(1, round(crop.height * scale))
        crop = crop.resize((width, height), Image.Resampling.LANCZOS)
        alpha = crop.getchannel("A").point(lambda value: 0 if value < 8 else value)
        crop.putalpha(alpha)
        x = index * 96 + (96 - width) // 2
        y = 92 - height
        output.alpha_composite(crop, (x, y))
    return output


def make_matching_patch(city_grass: Image.Image) -> Image.Image:
    crop = city_grass.crop((960, 480, 1728, 864)).resize((384, 192), Image.Resampling.LANCZOS)
    crop.putalpha(diamond_mask(crop.size))
    return crop


def clean_light_background(image: Image.Image) -> Image.Image:
    cleaned = image.convert("RGBA")
    for seed in ((0, 0), (cleaned.width - 1, 0), (0, cleaned.height - 1), (cleaned.width - 1, cleaned.height - 1)):
        ImageDraw.floodfill(cleaned, seed, (0, 0, 0, 0), thresh=48)
    return cleaned


def make_gate_join(source: Path) -> Image.Image:
    wall = clean_light_background(Image.open(source))
    if wall.size != (1052, 1494):
        raise ValueError(f"conector liso inesperado: {wall.size}")
    # Recorte central com parapeito contínuo, parede inteira e vegetação de
    # base. A proporção 490:700 coincide com o canvas final 250:357.
    wall = wall.crop((280, 280, 770, 980)).resize((250, 357), Image.Resampling.LANCZOS)
    wall = ImageEnhance.Color(wall).enhance(.82)
    wall = ImageEnhance.Brightness(wall).enhance(.86)
    wall = ImageEnhance.Contrast(wall).enhance(.96)
    return wall


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--city-grass", type=Path, required=True)
    parser.add_argument("--residential", type=Path, required=True)
    parser.add_argument("--tufts", type=Path, required=True)
    parser.add_argument("--gate-join", type=Path, required=True)
    args = parser.parse_args()

    # O recorte fica integralmente dentro do losango gerado, portanto nenhum
    # pixel do antigo quadriculado pode alcançar as bordas após a escala.
    city_grass = normalize_diamond(
        args.city_grass, (2688, 1344), .58, .66, .92,
        edge_color=(48, 61, 24), source_crop=(470, 230, 1306, 648),
    )
    residential = normalize_diamond(args.residential, (768, 384), .82, 1.04, .96, (4, 2), (78, 69, 45))
    tufts = normalize_tufts(args.tufts)

    save_atomic(city_grass, ISO_DIR / "isometric_city_grass.png")
    save_atomic(make_matching_patch(city_grass), ISO_DIR / "isometric_grass_patch.png")
    save_atomic(residential, ISO_DIR / "isometric_residential_ground.png")
    save_atomic(tufts, ISO_DIR / "isometric_grass_tufts.png")
    save_atomic(make_gate_join(args.gate_join), ISO_DIR / "isometric_city_wall_gate_join.png")


if __name__ == "__main__":
    main()
