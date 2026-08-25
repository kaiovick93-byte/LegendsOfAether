# Round 37 — Ratos ambientais da Taverna

## Objetivo
Adicionar microfauna urbana discreta ao entorno da Taverna de Aether sem criar interação, colisão ou novas mecânicas de gameplay.

## Implementação
- 3 ratos ambientais com variações visuais:
  - cinza
  - marrom
  - cinza-escuro
- Spritesheets compactas de 2 frames para corrida.
- Cada rato corre em um pequeno percurso próprio ao redor da taverna.
- Movimentos em rajadas rápidas com pausas e reaparecimento em tempos diferentes.
- Os ratos desaparecem em pontos de esconderijo para simular entrada atrás de barris, caixas e cantos do prédio.

## Regras de ambientação
- Sem nome flutuante.
- Sem prompt de F.
- Sem diálogo.
- Sem quest.
- Sem collider físico.
- Sem interferência na rota do jogador, Morador, Viajante, cachorro ou gato.
- Mantidos fora da praça central e do Marco de Senda.

## Arquivos alterados
- `src/scenes/PreloadScene.ts`
- `src/world/AmbientCityLife.ts`

## Novos assets
- `assets/images/characters/ambient/city_rat_gray.png`
- `assets/images/characters/ambient/city_rat_brown.png`
- `assets/images/characters/ambient/city_rat_dark.png`
