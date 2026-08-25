# Round 36 — Ambientação Viva da Cidade de Aether

## Elementos adicionados
- 1 cachorro ambulante, sem interação.
- 1 gato ambulante, sem interação.
- 1 senhor idoso careca alimentando pássaros próximo à praça, sem interação.
- 5 pássaros ambientais: quatro bicando/movendo-se no chão e um alternando entre o chão e o ombro do senhor.

## Comportamento
- Cachorro e gato usam rotas curtas predefinidas e pausas naturais.
- O senhor possui animação contínua de alimentar os pássaros.
- Os pássaros do chão bicam e dão pequenos saltos.
- Um pássaro voa periodicamente para o ombro do senhor e depois volta ao chão.
- Migalhas discretas reforçam visualmente a cena.

## Regras de jogabilidade
- Nenhum destes elementos possui nome flutuante.
- Nenhum possui prompt `F`/`T`.
- Nenhum abre diálogo ou missão.
- Nenhum possui collider, evitando bloqueios no jogador e nos NPCs funcionais.
- Eles não foram adicionados às listas de `tryTalk()` ou `updateNpcPrompts()`.

## Arquivos principais
- `src/world/AmbientCityLife.ts`
- `src/scenes/WorldScene.ts`
- `src/scenes/PreloadScene.ts`
- `assets/images/characters/ambient/city_dog.png`
- `assets/images/characters/ambient/city_cat.png`
- `assets/images/characters/ambient/elder_feeder.png`
- `assets/images/characters/ambient/city_bird.png`
