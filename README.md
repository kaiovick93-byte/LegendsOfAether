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
