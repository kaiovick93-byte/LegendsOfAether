# Legends of Aether — v0.3.1 Round 28 — Floresta Sinistra ao redor da Estrada — Etapa 2

Base exclusiva: `legends-of-aether-v0.3.1-round27-ajuste-final-integracao-chao.zip`.

## Objetivo

Iniciar a **Etapa 2 — massa baixa nas bordas da estrada**, preservando integralmente a Etapa 1 aprovada no Round 27.

## Implementação

Foram adicionados, de forma gradual e somente visual:

- raízes maiores nas bordas da estrada;
- galhos/troncos baixos;
- tocos;
- vegetação morta baixa;
- teias próximas ao chão.

A distribuição é deliberadamente moderada nesta primeira passagem da Etapa 2. Ainda **não** foi criada a parede densa de árvores da Etapa 3.

## Assets

Nenhum asset novo foi gerado. Foi integrado ao projeto um asset já criado anteriormente:

- `sinister_low_web_roots_01.png`

Os demais elementos reutilizam assets já presentes no projeto (`ancient_forest_root_*`, `ancient_forest_stump_*`, `ancient_forest_log_*`, `ancient_forest_thorn_*` e `ancient_forest_underbrush_*`), com ajuste de escala, rotação, opacidade e tonalidade.

## Regras preservadas

- Etapa 1 do Round 27 congelada;
- estrada visual sem alteração;
- sem colisão nova;
- sem mudança de bounds;
- sem triggers/quests/gameplay;
- sem ossos ou crânios nesta etapa;
- sem árvores grandes novas nesta etapa.

## Arquivos alterados/adicionados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `src/scenes/PreloadScene.ts`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-stage2/sinister_low_web_roots_01.png`
- `README.md`

---

# Legends of Aether — v0.3.1 Round 27

## Objetivo
Fechar a Etapa 1 do chão sinistro ao redor da continuação visual da Estrada Velha com o ajuste final de integração, preservando integralmente a estrada, a geometria aprovada e todos os sistemas de gameplay.

## O que foi ajustado
- suavizada a transição inferior/direita entre o chão sinistro e o gramado usando somente o asset de transição já existente;
- aplicada essa suavização exatamente nas duas arestas externas já aprovadas do `bottom wedge`, sem alterar a geometria;
- quebrada a repetição perceptível da textura na parte superior/esquerda usando as mesmas superfícies existentes com escalas e deslocamentos desencontrados;
- aumentada de forma sutil a variação tonal do chão com manchas de baixa opacidade já geradas pelo próprio sistema;
- preservada a largura, posição e traçado da estrada visual;
- nenhuma árvore, osso, crânio ou prop novo foi adicionado.

## Arquivos alterados
- `src/world/OldRoadAncientForestVisualExtension.ts`
- `README.md`

## Regras preservadas
- nenhum asset novo foi criado;
- nenhuma colisão foi alterada;
- nenhum bounds jogável foi alterado;
- nenhuma navegação, trigger, quest ou lógica de gameplay foi alterada;
- a geometria aprovada do Round 13 continua congelada;
- a continuação visual da estrada permanece exatamente onde estava no Round 26.
