#!/usr/bin/env python3
"""Remove gate wall extensions so regular modules meet the gate towers once."""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets/source/city-gates"
OUTPUT = ROOT / "assets/images/environment/isometric"

FILES = {
    "isometric_city_gate_full.png": "isometric_city_gate.png",
    "isometric_city_gate_east_full.png": "isometric_city_gate_east.png",
}


def compact_gate(source_path: Path, output_path: Path) -> None:
    image = Image.open(source_path).convert("RGBA")
    rgba = np.asarray(image).copy()
    # The original 1285px image contains roughly 205px of complete wall on
    # each side.  Those stretches repeated the normal wall and exposed their
    # end faces.  Keep the arch and both banner towers on the original canvas.
    left, right = 205, 1080
    rgba[:, :left, 3] = 0
    rgba[:, right:, 3] = 0
    result = Image.fromarray(rgba, "RGBA")
    temporary = output_path.with_suffix(".tmp.png")
    result.save(temporary, format="PNG", optimize=True)
    temporary.replace(output_path)


def main() -> None:
    for source_name, output_name in FILES.items():
        compact_gate(SOURCE / source_name, OUTPUT / output_name)
    print("COMPACT_GATE_ASSETS_OK gates=2 extensions=removed canvas=preserved")


if __name__ == "__main__":
    main()
