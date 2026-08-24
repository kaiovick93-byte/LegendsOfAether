# Round 57 — Cidade, Arte e Colisões

## Objetivo

O Round 57 é uma revisão integral da Cidade de Aether construída sobre o Round 56. A Fazenda de Rowan e os demais Arredores permanecem preservados.

## Colisões e circulação

- o colisor do jogador agora ocupa somente os pés (`38 × 22` no sprite-base), eliminando bloqueios antecipados causados pela cabeça, capa e braços;
- construções, fonte, árvores, postes e objetos usam footprints compactos apoiados na base visual;
- as torres dos portões Leste e Sul possuem colisores próprios;
- somente o vão realmente desenhado em cada portão permanece atravessável;
- as muralhas receberam uma camada posterior contínua e sobreposição de `4 px` entre segmentos, removendo frestas verdes;
- os NPCs ambulantes percorrem ciclos fechados nas ruas e pausam apenas durante diálogo.

## Escala e animação dos personagens

- escala-base dos NPCs aumentada de `0.40` para `0.46`;
- NPCs principais usam escalas entre `0.46` e `0.50`, compatíveis com o jogador;
- Bren Harrow, guarda do Portão Sul, recebeu escala `0.50`;
- todos os NPCs fixos, incluindo Mira Edevane, iniciam olhando para a câmera;
- as ações ociosas agora usam somente quadros dos próprios sprites, sem objetos vetoriais fora do estilo;
- o velhinho recebeu compensação vertical individual por quadro, mantendo uma altura aparente constante;
- o morador ambiental duplicado foi removido;
- Tomas e Darian não interrompem mais suas rotas por ações ociosas.

## Fauna e galinheiro

- os ratos da taverna agora percorrem rotas fechadas e permanecem visíveis;
- o galinheiro foi transferido para um terreno cercado no sudoeste da cidade;
- galinhas e pintinhos permanecem dentro do terreiro e fora das ruas;
- cão, gato, pássaros e velhinho foram reposicionados para áreas sem conflito com fachadas ou circulação.

## Nova planta urbana

- rua comercial contínua diante de loja, ferraria, botica e taverna;
- ruas laterais conectam a erudita, a oficina, a praça e os bairros;
- postes de luz ocupam os intervalos entre estabelecimentos e seguem os eixos viários;
- quatro residências foram organizadas lado a lado no distrito sul, com altura visual uniforme;
- a casa laranja recebeu um asset limpo, sem fumaça, animais ou fragmentos soltos;
- placas com textos como `LOJA`, `FORJA`, `TAVERNA`, `BOTICA`, `ARCANA` e `OFICINA` foram removidas do mapa ativo.

## Praça e direção de arte

- o Marco de Senda ocupa exatamente o centro da praça;
- o poço foi removido da cena e substituído por uma fonte própria ao sul do marco;
- árvores urbanas em pixel art foram distribuídas nos canteiros e junto às muralhas;
- chão, grama e ruas agora derivam do mesmo atlas `city_ground`;
- elipses, placas e adereços procedurais que destoavam do conjunto foram substituídos por tiles e assets compatíveis;
- a renderização global usa pixel art, pixels arredondados e antialiasing desativado.

## Novos assets

- `assets/images/environment/city/props/city_fountain_round57.png`;
- `assets/images/environment/city/props/city_tree_round57.png`;
- `assets/images/environment/buildings/residential_house_orange_round57.png`.

Os arquivos anteriores foram preservados; o mapa ativo referencia somente as versões do Round 57.

## Compatibilidade com saves

Saves posicionados na cidade anterior recebem uma migração única para o ponto seguro do Portão Sul. Posições salvas fora da cidade são preservadas.

## Validação

- auditoria geométrica de 10 construções;
- auditoria de 30 posições e pontos de rota de NPCs;
- auditoria de 23 pontos de fauna;
- verificação dos dois corredores de portão;
- verificação da escala residencial, orientação dos NPCs, loop dos ratos, normalização do velhinho, ausência de placas e colisor do jogador;
- TypeScript sem emissão;
- build de produção do Vite.
