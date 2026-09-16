# Legends of Aether — Round 86 / v14.10

Prompt **9D-B4.2D**. Base exclusiva: `legends-of-aether-round85-v14.9-prompt9d-b4.2c-github.zip`, SHA-256 `6449c05bbbb61fc646c7c5ac0d5dbee4138e59db0074886b21b9b3d18fb2daa9`.

## Executar

Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm run preview
```

## Estado atual

B4.2D faz somente microacabamento nas bordas da junção em Y e no acesso ao Portão Sul: seis tufos baixos e três pequenos grupos de pedrinhas, usando as texturas já carregadas `iso_grass_tufts` e `old_road_rocks_cluster_01`.

Os detalhes são planos, pequenos, sem interação, colisão ou oclusão de atores. Quebram pontualmente as bordas mais rígidas; não substituem, deslocam ou redimensionam nenhum módulo da estrada. Nenhum detalhe foi colocado fora da junção/acesso.

Todos os props aprovados — placas Aether e Y, marco arruinado, primeira cerca e demais cercas — permanecem idênticos. Traçados, larguras, escarpa e vegetação, Cidade, muralhas, Portão Sul, campo aberto, gameplay, colisões, NPCs, player, escalas e animações preservados.

Arquivos alterados: `src/world/AetherTerritory.ts` e este `README.md`. Nenhum asset criado, alterado ou removido. O ZIP não inclui `docs`, `dist`, `scripts`, `qa` ou `node_modules`.

## Validação

Comparação estática dos construtores e assets reais com a base B4.2C. Dois closes: junção em Y e ligação com o Portão Sul. Sem build completo ou teste interativo neste ambiente.
