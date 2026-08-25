# Round 58 — Fundação Visual da Cidade

## Base

O Round 58 foi construído sobre o Round 57, preservando a planta urbana, a Fazenda de Rowan e os demais Arredores. Esta revisão corrige os problemas observados em jogo na fundação visual da Cidade de Aether.

## Casa residencial verde

- o sprite estreito de `212 × 373 px` foi substituído por uma construção proporcional de `320 × 415 px`;
- telhado, paredes, porta, banner, plantas, iluminação e identidade verde foram preservados;
- a nova razão largura/altura elimina o aspecto verticalmente esticado;
- o footprint foi recalibrado para a base mais larga.

## Muralhas e colisões

- colisores norte, sul, leste e oeste foram movidos para a face interna visível dos muros;
- espessura física padronizada em `36 px`, com recuo de `18 px`;
- o jogador para antes de sobrepor a arte do muro superior ou inferior;
- a placa cinza opaca que aparecia atrás dos muros laterais foi removida;
- margens transparentes dos módulos horizontal e vertical foram aparadas;
- segmentos mantêm sobreposição visual, eliminando frestas verdes.

## Piso urbano contínuo

- o preenchimento antigo usava quadros de borda do atlas como se fossem piso, causando arcos e desenhos repetidos;
- a cidade agora possui uma textura contínua de pavimentação de `1400 × 1040 px`;
- ruas, praça e calçadas compartilham a mesma malha de pedras;
- jardins usam uma segunda textura contínua de grama, recortada somente nos lotes;
- a paleta foi aproximada à referência enviada: pedra quente em cinza e bege, juntas discretas e variação natural;
- não há reinício da textura em cada rua ou cruzamento.

## Portão Leste

- o antigo sprite lateral foi substituído por um módulo vertical transparente;
- a muralha corre no eixo norte–sul e o corredor de saída permanece no centro;
- torres superior e inferior enquadram a passagem;
- os colisores continuam bloqueando as torres e liberando somente o vão real.

## Galinheiro

- escala aumentada de `0.30` para `0.52`;
- terreno ampliado para `235 × 220 px`;
- cerca simples dos Arredores substituída por módulos urbanos de madeira, ferragens e base de pedra;
- cercas são compostas por segmentos, sem deformar um único sprite pela extensão inteira;
- galinhas e pintinhos receberam novas rotas dentro do terreno ampliado;
- a abertura frontal do cercado permanece livre.

## Velhinho e gato

- os quatro quadros do velhinho usam a mesma escala;
- o agachamento é estabilizado pela linha inferior real de cada quadro;
- foi removido o redimensionamento vertical que fazia o corpo subir durante a animação;
- o gato deixou a rota vertical junto ao muro oeste;
- sua nova rota é integralmente horizontal na rua diante do setor comercial.

## Nomes permanentes dos assets

Os assets ativos não contêm mais número de round no nome:

- `assets/images/environment/city/city_pavement.png`;
- `assets/images/environment/city/city_grass.png`;
- `assets/images/environment/city/gate_east.png`;
- `assets/images/environment/city/props/city_fountain.png`;
- `assets/images/environment/city/props/city_tree.png`;
- `assets/images/environment/city/props/city_chicken_fence.png`;
- `assets/images/environment/buildings/residential_house_green.png`;
- `assets/images/environment/buildings/residential_house_orange.png`.

O diretório `assets` foi auditado e não contém arquivos com `roundNN` no nome. O preload referencia somente os nomes permanentes.

## Validação

- TypeScript sem emissão: aprovado;
- build de produção Vite: aprovado;
- 90 referências de preload verificadas, sem arquivo ausente;
- 10 construções auditadas;
- 30 posições e pontos de rota de NPCs auditados;
- 23 pontos de fauna auditados;
- dois corredores de portão auditados;
- quatro residências com altura visual uniforme;
- revisão visual integral da cidade em `1560 × 1200 px`.
