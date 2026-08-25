# ROUND 35B — South Guard portrait fidelity integration

## Objective
Replace the South Guard dialogue portrait with a portrait that is visually grounded on the actual in-game `south_guard` sprite asset.

## What was integrated
- Replaced: `assets/images/ui/dialogue/portraits/portrait_bren.png`
- Kept existing wiring intact in code:
  - `WorldScene.ts` uses `portrait_bren` for **Bren Harrow**
  - `PreloadScene.ts` already preloads `portrait_bren`
- No logic changes were required.

## Result
When the player interacts with **Bren Harrow** (Guarda do Sul), the stylized dialogue window now displays a portrait aligned with the sprite sheet visual identity:
- dark-skinned young guard
- short curly black hair
- teal scarf/tabard
- silver armor
- teal shield with fortress emblem
- halberd / southern gate guard presentation

## Files changed
- `assets/images/ui/dialogue/portraits/portrait_bren.png`

## Compatibility
- Safe with Round 34 dialogue UI
- Safe with Round 35A portrait-fidelity structure
- No impact on collisions, NPC circulation, or interaction triggers
