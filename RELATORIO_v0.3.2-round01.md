# Legends of Aether — v0.3.2-round01

Correção visual da Floresta Sinistra sobre o Round 39.

## Base

Arquivo enviado: `legends-of-aether-v0.3.1-round39-reforco-nevoa-floresta-ancestral-base-round38(1).zip`.

SHA-256 da base: `73048d54239dfb02c5f47a59d4966feddb967f4dfa6a69148c600d2e0ab46fd3`.

## Alteração executada

A Floresta Sinistra foi recomposta com os 49 PNGs individuais efetivamente utilizados pela Floresta Ancestral do Round 39. As 100 especificações de peças da Ancestral forneceram as variantes, escalas, pivôs e espelhamentos da nova composição. A folha geral de referência não foi usada como substituta dos arquivos individuais.

A montagem contém 635 árvores grandes, médias e mortas; 647 elementos de estrutura (troncos, raízes, tocos e paredes de espinhos); e 2.046 peças de chão e vegetação baixa. As árvores e estruturas são ordenadas pela base, formando uma massa contínua com sobreposição e altura. O solo usa também a mesma imagem original de terreno que já sustenta a Ancestral.

A composição é agrupada em canvases durante a execução. Nenhum PNG foi gerado, redesenhado, recolorido ou sobrescrito. Os 313 arquivos existentes em assets/ permanecem idênticos, conferidos por SHA-256.

## Preservação

- Mesmos polígonos aprovados de base, continuação lateral e ponta inferior.
- Mesmos sete módulos e oito pontos de conexão da estrada visual.
- Corredor de 66 px de cada lado da linha da estrada protegido contra vegetação alta/estruturas; proteção da névoa continua em 74 px.
- Mesmas 100 peças da Ancestral, com posição, escala, pivô, espelhamento, rotação e profundidade intactos.
- Mesmos 52 emissores da Sinistra e sete emissores da Ancestral. Posições, dimensões, cores, densidades, ganhos, opacidades, horários, fases, deriva e profundidades foram comparados com a execução da base.
- `WorldFogSystem.ts`, `WorldClock.ts`, `OldRoadAncientForest.ts`, `AetherTerritory.ts`, arquivos de colisão, jogador, HUD, minimapa, iluminação, quests, inventário, combate e save/load permanecem sem alterações.
- As integrações antigas que já ultrapassavam o limite da Sinistra foram preservadas somente em seus fragmentos externos, para manter o terreno vizinho. Dentro da área corrigida, a máscara invertida exclui esses materiais antigos.

## Elementos antigos retirados da composição da Sinistra

Muralhas de floresta assombrada, árvore hero antiga, teias antigas/nebulosas, mata decomposta, faixa baixa de raízes/arbustos e superfícies pantanosas anteriores. Os arquivos originais permanecem no projeto; sua exibição dentro da Sinistra foi substituída pelo kit ancestral.

Os dados numéricos da composição anterior foram mantidos exclusivamente como referência dos emissores existentes. A montagem visual nova usa uma lista independente; alterar árvores não recalcula nem desloca a névoa do Round 39.

## Arquivos

Alterados:

- `src/scenes/PreloadScene.ts` — reutilização do kit ancestral e carregamento apenas das transições legadas necessárias fora da região corrigida.
- `src/world/OldRoadSinisterForest.ts` — separação entre os dados históricos dos emissores e a montagem visual nova.
- `src/world/OldRoadAncientForestVisualExtension.ts` — ligação da nova composição, preservação dos fragmentos externos e atualização dos metadados do round.

Adicionados:

- `src/world/OldRoadSinisterForestComposition.ts` — composição com o kit original, proteção de silhuetas junto à estrada, recorte pelo polígono aprovado e agrupamento de desenho.
- `RELATORIO_v0.3.2-round01.md` — este relatório.

Arquivos removidos: nenhum.

## Validação executada

- `npm run check`: aprovado.
- `npm run build`: aprovado.
- `node --test tests/world-fog.test.mjs tests/world-clock.test.mjs`: 19 testes aprovados, zero falhas.
- Chromium, execução real do jogo: Jogar → prólogo → seleção do herói → Novo Jogo; sem erros de console ou JavaScript nas capturas finais.
- Comparação visual da junção, da margem ancestral, do interior da Sinistra e da cobertura inteira.
- Comparação dos dados de estrada, limites, peças ancestrais e névoa com o Round 39: idênticos.
- Comparação SHA-256 de todos os arquivos de assets: idênticos.

Validações adicionais no runtime:

- 835.472 amostras de pixels dos lotes de desenho: zero fora dos polígonos aprovados e zero dentro do corredor protegido de 66 px.
- Todas as escalas das peças novas correspondem a escalas do mesmo asset na Ancestral original.
- Pontos de colisão: floresta bloqueada, estrada livre e área externa jogável bloqueada, conforme a base.
- Névoa conferida também em 17:06 e 20:02.
- Reinicialização da cena: 27 texturas de composição e duas zonas de névoa, sem duplicação e sem erros.
- ZIP verificado por CRC e comparação dos conteúdos com os arquivos finais.

## Assets reutilizados

Diretório: `assets/images/environment/outskirts/old-road-ancient-forest/`.

- `ancient_tree_large_01.png`
- `ancient_tree_large_02.png`
- `ancient_tree_large_03.png`
- `ancient_tree_large_04.png`
- `ancient_tree_large_05.png`
- `ancient_tree_large_06.png`
- `ancient_tree_medium_01.png`
- `ancient_tree_medium_02.png`
- `ancient_tree_medium_03.png`
- `ancient_tree_medium_04.png`
- `ancient_tree_dead_01.png`
- `ancient_tree_dead_02.png`
- `ancient_tree_dead_03.png`
- `fallen_ancient_log_01.png`
- `fallen_ancient_log_02.png`
- `fallen_ancient_log_03.png`
- `fallen_ancient_log_04.png`
- `fallen_ancient_log_05.png`
- `ancient_root_cluster_01.png`
- `ancient_root_cluster_02.png`
- `ancient_root_cluster_03.png`
- `ancient_root_cluster_04.png`
- `ancient_root_cluster_05.png`
- `ancient_root_cluster_06.png`
- `ancient_thorn_cluster_01.png`
- `ancient_thorn_cluster_02.png`
- `ancient_thorn_cluster_03.png`
- `ancient_thorn_cluster_04.png`
- `ancient_thorn_cluster_05.png`
- `ancient_thorn_cluster_06.png`
- `ancient_thorn_cluster_07.png`
- `ancient_thorn_cluster_08.png`
- `ancient_forest_floor_01.png`
- `ancient_forest_floor_02.png`
- `ancient_forest_floor_03.png`
- `ancient_forest_floor_04.png`
- `ancient_forest_floor_05.png`
- `ancient_forest_floor_06.png`
- `ancient_forest_floor_07.png`
- `ancient_forest_floor_08.png`
- `ancient_stump_01.png`
- `ancient_stump_02.png`
- `ancient_stump_03.png`
- `ancient_underbrush_01.png`
- `ancient_underbrush_02.png`
- `ancient_underbrush_03.png`
- `ancient_thorn_wall_01.png`
- `ancient_thorn_wall_02.png`
- `ancient_thorn_wall_03.png`

Solo contínuo original adicional: `assets/images/environment/outskirts/terrain-b4/outskirts_ground_b4_surface.png`.
