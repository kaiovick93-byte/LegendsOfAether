# Round 54 — Kit Visual Base dos Arredores

## Objetivo
Começar a substituição dos placeholders gráficos dos Arredores da Cidade por assets próprios, preservando a mesma lógica de pixel art, cores terrosas, materiais e leitura isométrica/top-down usada em Cidade de Aether.

## Assets adicionados
Todos em `assets/images/environment/outskirts/`:

- `outskirts_dirt_path.png` — estrada/trilha de terra irregular.
- `outskirts_water_patch.png` — água com margem natural.
- `outskirts_rock_cluster.png` — conjunto de rochas com musgo.
- `outskirts_wood_bridge.png` — ponte rural de madeira.
- `outskirts_fence_segment.png` — segmento de cerca rural.
- `outskirts_reeds.png` — vegetação de margem/juncos.
- `outskirts_bush_cluster.png` — arbustos baixos.
- `outskirts_grass_patch.png` — detalhes de grama/solo.

## Integração no mapa
### Estradas
`stampPath()` agora utiliza `outskirts_dirt_path` em vez de elipses do Phaser.

### Riacho e lago
`waterNode()` agora usa `outskirts_water_patch` e recebeu juncos/arbustos em pontos de margem. As colisões do Round 49 foram preservadas.

### Pontes
As duas travessias oficiais do riacho agora usam o asset `outskirts_wood_bridge`.

### Rochas
Os afloramentos passaram a usar `outskirts_rock_cluster`, mantendo colliders compactos na base.

### Fazenda — cercas
Os currais passaram a usar segmentos gráficos de `outskirts_fence_segment`, mantendo as aberturas e colliders definidos no Round 49.

### Vegetação
Pontos de vegetação genérica foram substituídos/reforçados com `outskirts_grass_patch`, `outskirts_reeds` e `outskirts_bush_cluster`.

## Arquivos de código alterados
- `src/scenes/PreloadScene.ts`
- `src/scenes/WorldScene.ts`

## Validação
- `npx tsc --noEmit`: aprovado sem erros.
- A estrutura de colisões e circulação do Round 49 foi mantida.

## Próxima etapa sugerida
**Round 55 — Fazenda Definitiva dos Arredores**

Criar e integrar assets próprios para:
- casa rural;
- celeiro/depósito;
- carroça vazia;
- cavalo;
- vacas;
- porcos;
- trabalhadores rurais;
- plantação e pequenos equipamentos agrícolas.
