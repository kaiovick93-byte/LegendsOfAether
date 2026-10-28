# Legends of Aether — v0.3.2 — Performance e limpeza de código

Revisão de performance em tempo de execução e remoção de código morto, **sem alteração de comportamento nem de arte**. Nenhum asset foi criado, alterado ou removido.

## Base utilizada

`legends-of-aether-v0.3.2-round03-e-coletar-base-round02_1.zip`

SHA-256: `ee102780e46adcd700c8f60865d648d8ff38af84b7e7ed13b3bc3db71e04d4a8`

Este pacote é um **patch**: contém somente os 15 arquivos alterados, com os mesmos caminhos relativos do projeto, mais este relatório e `perf-cleanup.diff`. Para aplicar, extraia sobre a raiz do projeto, substituindo os arquivos. Nenhum arquivo foi adicionado ou removido de `src/`.

## 1. Performance

**1.1 `src/ui/BottomActionBar.ts`.** O `update()` roda todo frame e chamava `setColor()` em 10 textos dos slots (2 das poções e 8 de habilidades). No Phaser 3.90 (versão do `assets/vendor/phaser.min.js`), `Text.setColor` sempre redesenha o canvas do texto e reenvia a textura à GPU, mesmo com a mesma cor. `setText` e `setFontSize` já só agem quando o valor muda. Foi criado `setTextColor(text,color)`, que só chama `setColor` quando a cor difere da atual. Estado final dos textos idêntico ao anterior.

**1.2 Alocações por frame.**
- `CaveScene`, `CastleScene` e `GreenWoodsScene`: a lista de alvos (`[...enemies, ...]`) só é montada quando uma das teclas de ataque/habilidade foi pressionada. Os quatro `JustDown` continuam sendo avaliados uma vez por frame e as ações continuam na mesma ordem.
- `AetherCityScene.updateNpcPrompts`: troca de `cityActors.filter(Boolean)` (array novo por frame) por laço com `if(!npc)continue`.
- `AetherCityScene.update`: `registry.set('aetherActiveSector')` só é chamado quando o valor muda. No Phaser, `registry.set` emite dois eventos a cada chamada, mesmo sem mudança, e nenhum código escuta esse evento. O valor continua sendo definido por `AetherTerritory.update`, como antes.

## 2. Código morto removido (-526 linhas líquidas)

Critério: identificador com uma única ocorrência no projeto (a própria definição), confirmado em `src/` e `tests/`, sem acesso dinâmico (`this[...]`). Depois de cada remoção, a checagem foi repetida até não restar nada novo sem uso.

- `Npc.ts` (-170): `setRole`, `ensureIdleFacing`, `addIdleDecor`, os 12 métodos `play*Idle` por papel (o despacho atual usa a tabela de perfis em `playIdleAction`) e `spawnIsoSparkles`, `resetIsometricPose`, `spawnForgeSparks`, que só eram chamados por eles.
- `OldRoadAncientForestVisualExtension.ts` (-284): `buildDeadTreeLayer`, `buildFloorTextureLayer`, `buildOrganicGroundDetails`, mais `addGroundDecal`, `addDeadTree`, `isInsideVisualRoadCorridor`, `distancePointToSegment`, `worldBoundsFromPolygons`, as tabelas `SURFACE_KEYS`, `DEAD_TREE_*`, `SWAMP_PATCHES`, `DEBRIS_PATCHES`, `LEAF_PILES`, `ROOT_ACCENTS` e o import `SINISTER_FOREST_ASSETS`, todos órfãos depois da remoção.
- `AetherCityScene.ts` (-50): `addSouthWallLongSection`, `addSideCornerPillar` e as variáveis locais `C` e `home`.
- `Player.ts` (-6): `getVisualFrame`, `getVisualFrameNumber`, `setSkillBonuses`.
- `OldAetherPrologue.ts` (-4): `STAGES`, `prior`, `next`. `project()` é função pura, então remover as chamadas não tem efeito.
- `AetherTerritoryMap.ts` (-10): `ellipseFromLogical`.
- `config.ts` (-3): exports `WORLD`, `COLORS`, `SCENES`.
- `OldRoadSinisterForest.ts` (-3): `ROAD_CLEARANCE`, o alias `SINISTER_FOREST_ASSETS` e o import `OLD_ROAD_ANCIENT_FOREST_ASSETS`.
- `ControlsPanel.ts`, `CharacterInventoryPanel.ts`, `QuestManager.ts`: propriedade `scene` e imports `rarityColor` e `getItemDefinition` sem uso.

### Mantido de propósito (sem referência, mas não removido)
- `Npc.facePlayer`: tem comentário explícito de compatibilidade com código externo antigo.
- `QuestManager.accept`, `QuestManager.turnIn`, `SaveManager.hasSave`: parecem API reservada. Decisão do dono do projeto.
- `AETHER_GATE_APPROACHES` (`AetherTerritoryLayout.ts`): dado de coordenadas de mapa sem uso; não removido por ser geometria do mapa.

## Testes realmente executados

Ambiente: Node 22, TypeScript 5, Chromium 141 via Playwright (headless, WebGL por software). Sem rede, então `npm install` e `vite build` **não** foram executados.

- `tsc --noEmit` com o `tsconfig` do projeto: 5 erros na base e 5 depois, todos `TS2307 Cannot find module 'phaser'` em `import type` (Phaser não instalado aqui). Nenhum erro novo.
- Checagem completa de tipos (cópia sem `@ts-nocheck`, com stub de `Phaser`): 2718 erros na base, 2650 depois; 0 mensagens de erro novas e 0 itens declarados sem uso.
- Testes unitários (com assets), base e depois, idênticos: `quest-tracker` 6/6, `south-bridge` 6/6, `world-clock` 13/13, `world-fog` 6/6, `city-walls` 1/9. A falha de `city-walls` já existe na base (`getSourceImage` indefinido no ambiente de teste) e não muda.
- Navegador (o `src` foi transpilado com `ts.transpileModule` e servido sem bundler), nas cenas AetherCityScene, GreenWoodsScene, CaveScene e CastleScene:
  - 0 erros de console ou de página, na base e depois.
  - 9 estados da barra inferior idênticos entre base e depois (zona segura, habilidade bloqueada, habilidade liberada, cooldown ligado e desligado, zona segura ligada e desligada, poções com e sem estoque), incluindo todos os textos, cores, posições e preenchimentos.
  - Troca de setor na cidade: mesma sequência de 6 setores.
  - Espaço, Q, 1 e 2 em cada cena: mesmas chamadas e mesma quantidade de alvos (19 na Floresta, 4 na Caverna, 5 no Castelo).

### Medições (headless, renderização por software: indicativas, não absolutas)

| Métrica | Base | Depois |
| --- | --- | --- |
| Redesenhos de texto por frame (barra inferior) | 10 | ~0 (0,03) |
| `BottomActionBar.update()` na Floresta | 0,38–0,60 ms | 0,06 ms |
| `scene.update` completo na Floresta | 1,2 ms | 0,29 ms |
| Eventos de `registry` por frame na cidade | 1,9 | 0,97 (o restante vem de `AetherTerritory.update`, que já é limitado a cada 180 ms) |

Na cidade, o `scene.update` completo ficou em ~7–10 ms nas duas versões, dominado por outros sistemas; a diferença ficou dentro do ruído e não é atribuída a esta entrega.

## Limitações de validação

- Não houve comparação visual por captura de tela. A equivalência da barra inferior foi verificada pelos valores dos objetos do Phaser, não por pixels.
- Não foram exercitados nesta validação: fluxo completo do prólogo, save/load, loja, diálogos de NPC e os gestos de idle dos NPCs (`Npc.ts`). As remoções nesses arquivos são de métodos sem nenhuma chamada, mas isso não substitui um teste no jogo.
- O build de produção do Vite não foi executado.

## Não aplicado (recomendações, exigem sua decisão e teste visual)

- **Memória de textura**: pela conta largura × altura × 4, cerca de 600 MB de GPU se tudo for carregado no boot pelo `PreloadScene`. Maiores: `old_road_b4d_start_run_01` (3216×1296), `isometric_city_grass` (2688×1344), folhas 8dir do lobo e do goblin (2048×1280). Sugestão: carregar por cena e/ou reduzir resolução.
- **8 `GeometryMask`** (minimapa, cidade ×2, território, rio, escarpa, floresta ×2): custosas em WebGL; trocar por textura pré-mascarada muda a renderização.
- **Assets sem uso em runtime que vão para o `dist`** (o `vite.config.ts` copia `assets/` inteiro): `ancient_forest_approved_master_sheet.png` (3,8 MB) e `old_road_sign_lantern_01.png` (1,2 MB).
