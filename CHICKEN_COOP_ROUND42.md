# Round 42 — Galinheiro integrado à cidade

## Objetivo
Adicionar um pequeno galinheiro ao setor residencial sudeste de Aether para dar mais contexto visual à presença das galinhas urbanas.

## Implementado
- novo asset `chicken_coop.png` adicionado em:
  - `assets/images/environment/city/props/chicken_coop.png`
- preload do novo asset em:
  - `src/scenes/PreloadScene.ts`
- posicionamento do galinheiro na cidade em:
  - `src/scenes/WorldScene.ts`

## Decisão de layout
O galinheiro foi colocado próximo à área das galinhas, no setor residencial sudeste, longe dos corredores principais e sem criar qualquer interação nova.

### Posição usada
- `x: 418`
- `y: 810`
- `scale: 0.42`

### Colisão
Foi aplicada uma colisão compacta apenas na base visual do galinheiro:
- largura: `66`
- altura: `28`
- offsetY: `12`

Isso preserva a leitura física do objeto sem bloquear o fluxo do jogador na cidade.

## Observações
- o galinheiro é apenas ambiental;
- não possui prompt de interação;
- serve como contexto visual para a fauna urbana já adicionada;
- mantém a linguagem visual medieval/isométrica da cidade.
