 # Round 40 — Ambient Chickens Integrated

## Objetivo
Substituir as galinhas ambientais provisórias por sprites derivados da folha aprovada pelo usuário, mantendo o padrão estético do restante da fauna urbana de Aether.

## Implementado
- Conversão da folha `folha_de_sprites_de_galinhas_pixel_art.png` em 3 spritesheets transparentes:
  - `city_chicken_white.png`
  - `city_chicken_brown.png`
  - `city_chicken_cream.png`
- Cada spritesheet possui 4 frames (parada/caminhada/caminhada/peckando).
- `PreloadScene.ts` atualizado para carregar os três novos assets.
- `AmbientCityLife.ts` atualizado para:
  - registrar animações de caminhada das galinhas;
  - criar 3 galinhas ambientais na área residencial sudeste;
  - usar peck/idle entre deslocamentos;
  - manter comportamento totalmente não interativo.

## Comportamento
- As galinhas continuam sem prompt, sem diálogo, sem colisão e sem quest.
- Permanecem apenas como microvida urbana.
- As rotas foram mantidas próximas da área onde já estavam ambientadas.

## Arquivos alterados
- `src/scenes/PreloadScene.ts`
- `src/world/AmbientCityLife.ts`
- `assets/images/characters/ambient/city_chicken_white.png`
- `assets/images/characters/ambient/city_chicken_brown.png`
- `assets/images/characters/ambient/city_chicken_cream.png`
