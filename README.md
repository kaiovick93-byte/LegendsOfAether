# Legends of Aether — v0.3.1 Round 29 — Etapa 2 TESTE CONTROLADO

Base exclusiva: `legends-of-aether-v0.3.1-round27-ajuste-final-integracao-chao.zip`.

## Objetivo

Reiniciar a **Etapa 2 — massa baixa nas bordas da estrada** a partir do Round 27 aprovado, descartando totalmente a implementação rejeitada do Round 28.

Nesta rodada, os assets são aplicados **somente em um trecho curto da estrada (~20%)** para validação visual antes de qualquer expansão.

## Implementação

- 5 props apenas, concentrados entre o segmento 3 e o início do segmento 4 da continuação visual;
- nada foi espalhado pela estrada inteira;
- offsets mantêm todos os props fora da faixa da estrada;
- sem colisão, navegação, trigger, quest ou mudança de bounds;
- Etapa 1 do Round 27 permanece congelada;
- nenhum osso ou crânio foi usado;
- nenhuma parede de árvores foi criada.

## Assets usados no teste

- `sinister_low_roots_01.png` — raiz rasteira baixa;
- `sinister_low_thorn_bush_01.png` — arbusto seco/espinhos;
- `ancient_forest_stump_02.png` — toco baixo já existente no kit ancestral;
- `sinister_low_web_01.png` — teia baixa entre raízes/galhos;
- `sinister_low_branch_pile_01.png` — amontoado de raízes/galhos/espinhos.

## Arquivos alterados/adicionados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `src/scenes/PreloadScene.ts`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-stage2-test/sinister_low_roots_01.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-stage2-test/sinister_low_thorn_bush_01.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-stage2-test/sinister_low_web_01.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-stage2-test/sinister_low_branch_pile_01.png`
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
