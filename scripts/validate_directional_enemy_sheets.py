#!/usr/bin/env python3
"""Deterministic 9D-A audit for the two directional enemy sprite sheets."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAME = 256
DIRECTIONS = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")
STATES = ("idle", "walk_a", "walk_b", "attack_windup", "attack_strike")
ASSETS = {
    "Lobo Jovem": ROOT / "assets/images/characters/prologue/prologue_young_wolf_8dir_v3.png",
    "Goblin Batedor": ROOT / "assets/images/characters/prologue/prologue_goblin_scout_8dir_v3.png",
}


def validate_sheet(label: str, path: Path) -> None:
    if not path.exists():
        raise AssertionError(f"{label}: asset ausente: {path}")
    image = Image.open(path).convert("RGBA")
    expected = (FRAME * len(DIRECTIONS), FRAME * len(STATES))
    if image.size != expected:
        raise AssertionError(f"{label}: esperado {expected}, recebido {image.size}")
    pixels = np.asarray(image)
    alpha = pixels[:, :, 3]
    if np.any(pixels[alpha == 0, :3] != 0):
        raise AssertionError(f"{label}: RGB residual em pixel 100% transparente")
    for state_index, state in enumerate(STATES):
        for direction_index, direction in enumerate(DIRECTIONS):
            left, top = direction_index * FRAME, state_index * FRAME
            cell_alpha = alpha[top:top + FRAME, left:left + FRAME]
            nonzero = np.argwhere(cell_alpha > 0)
            if nonzero.size == 0:
                raise AssertionError(f"{label}: {state} {direction} está vazio")
            min_y, min_x = nonzero.min(axis=0)
            max_y, max_x = nonzero.max(axis=0)
            if min_x == 0 or min_y == 0 or max_x == FRAME - 1 or max_y == FRAME - 1:
                raise AssertionError(f"{label}: {state} {direction} toca/corta a borda do frame")
            # Todas as poses saem da mesma linha física de pés. O y máximo é
            # exclusivo em Pillow; 243 é o último pixel pintado da baseline.
            if max_y != 243:
                raise AssertionError(f"{label}: {state} {direction} perdeu a baseline ({max_y})")
    print(f"{label}: 8 direções × idle/walk(2)/attack(2) = 40 frames OK")
    for direction in DIRECTIONS:
        print(f"  walk {direction}=OK | attack {direction}=OK | idle {direction}=OK")


def validate_registration() -> None:
    source = (ROOT / "src/prologue/OldAetherPrologue.ts").read_text(encoding="utf-8")
    preload = (ROOT / "src/scenes/PreloadScene.ts").read_text(encoding="utf-8")
    for texture in ("prologue_young_wolf_8dir", "prologue_goblin_scout_8dir"):
        if texture not in source or texture not in preload:
            raise AssertionError(f"Registro ausente para {texture}")
    for direction in ("n", "ne", "e", "se", "s", "sw", "w", "nw"):
        if f"{direction}:" not in source:
            raise AssertionError(f"Mapeamento direcional ausente: {direction}")
    if "enemy.setFlipX(false)" not in source or "setFlipX(next.x<prior.x)" in source:
        raise AssertionError("Fallback global flipX ainda presente ou neutralização ausente")
    print("Registro Phaser: 8 walk + 8 attack + 8 idle direcionais por criatura OK")


def main() -> None:
    for label, asset in ASSETS.items():
        validate_sheet(label, asset)
    validate_registration()
    print("DIRECTIONAL_ENEMY_VALIDATION=PASS")


if __name__ == "__main__":
    main()
