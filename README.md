# Legends of Aether — v0.3.1 Round 31

## Base exclusiva
`legends-of-aether-v0.3.1-round27-ajuste-final-integracao-chao(1).zip`.
Nenhum código, composição ou distribuição dos Rounds 28/29/30 foi utilizado.

## Escopo: somente Etapa 2
Massa baixa contínua nas duas bordas da continuação visual da Estrada Velha.
Raízes, espinhos, galhos secos e folhas se sobrepõem numa composição consolidada
em uma única camada. A faixa fica mais densa voltada para a mata e mais leve
voltada para a estrada. Quatro teias pequenas entram como detalhe secundário.

O posicionamento acompanha os conectores originais da estrada. A camada nova
é limitada por pixel à cobertura aprovada do Round 27 e deixa livre toda a
largura das imagens da estrada, inclusive suas margens. Não há props novos
espalhados pelo interior da floresta. Escala, rotação, espelhamento e ordem de
sobreposição variam para misturar as peças. Os PNGs originais não foram editados.

A Etapa 1 permanece intacta. As árvores que já existiam no Round 27 também
permanecem intactas; nenhuma árvore foi adicionada. A Etapa 3 não foi iniciada.

## Arquivos alterados
- `src/scenes/PreloadScene.ts` — carregar os quatro PNGs necessários que não estavam no ZIP; reutilizar a textura de folhas já carregada.
- `src/world/OldRoadAncientForestVisualExtension.ts`
  — somente importar, construir e destruir a camada independente da Etapa 2.
- `README.md` — registro desta entrega.

## Arquivos adicionados
- `src/world/OldRoadSinisterRoadside.ts`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/raízes_retorcidas_da_floresta_assombrada.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/teia_antiga_entre_galhos_mortos.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/arbusto_espinhoso_ressecadoaco.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/amontoado_de_raízes_e_espinhos_assombrados.png`

Nenhum arquivo foi removido.

## Os cinco assets utilizados
Os quatro PNGs adicionados acima são as imagens originais de raízes baixas,
teia, arbusto espinhoso e amontoado de raízes/espinhos, copiadas sem edição.
O `montinho_de_folhas_secas_da_floresta.png` é reutilizado pela versão já
presente no Round 27:
`assets/images/environment/outskirts/old-road-ancient-forest/generated-ground/sinister_ground_leaf_pile_01.png`.
Nenhum sexto asset é usado na camada da Etapa 2.

## Regras preservadas
- Chão e transições aprovados na Etapa 1 do Round 27.
- Posição, largura, escala, rotação e conectores da estrada.
- Floresta verde e árvores existentes.
- Colisões, bounds, navegação, triggers, quests e gameplay.
- Geometria aprovada do Round 13, já presente no Round 27.

## Verificação
- `npm run check` e `npm run build`: aprovados.
- Jogo renderizado em Chromium: inspeção do conjunto, entrada, meio e final da estrada.
- Comparação com o Round 27: os 56 elementos de chão, 245 detalhes de solo das
  bordas, 121 árvores existentes e sete módulos da estrada mantêm os mesmos
  parâmetros visuais. Identificadores aleatórios de texturas internas do Phaser
  são desconsiderados nessa comparação.
- `node --test tests/*.test.mjs`: 18 testes aprovados e oito falhas na suíte
  de muralhas. As mesmas oito falhas foram reproduzidas no ZIP Round 27 intacto:
  a simulação de texturas dessa suíte lança `getSourceImage` sobre uma textura
  ausente. Esses testes e os sistemas de muralhas não foram alterados.
- ZIP conferido por comparação de conteúdo com a base e teste de integridade.
