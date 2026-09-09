# Legends of Aether 0.2.7 — Round 67: Aether e Arredores Contínuos

### Atualização v12.9 — Cidade + Arredores + Estrada Velha

- Cidade de Aether e Arredores agora vivem na mesma `AetherCityScene`, na mesma malha `(u,v)` e no mesmo corpo lógico; atravessar ou retornar pelos Portões Sul e Leste é caminhada contínua, sem fade, loading, portal ou teleporte;
- o território lógico foi ampliado para `0…82` nos dois eixos, com bounds de tela `(-2700,-420) + 8700×5000` e reserva de depth `-20000`, mantendo câmera, HUD, equipamentos, inventário, colisão e oclusão durante todo o percurso;
- quatorze setores nomeados preparam ativação de NPCs, AI, áudio, iluminação, quests, descoberta e culling; objetos distantes são ocultados/desativados sem apagar flags persistentes;
- a Estrada Velha de Aether conecta-se fisicamente ao Portão Sul e recebeu spawn futuro seguro, ponto de primeira visão da cidade, pavimento gasto, placa, marcos, cercas, vegetação, troncos e restos de carroça;
- estrada principal e caminhos secundários reservam e conectam Fazenda, riacho com duas travessias, lago, Santuário Antigo, pequenas ruínas, caverna/fenda e a Entrada de Greenwoods;
- Greenwoods já existe como landmark, mas permanece bloqueada por raízes e vegetação densas; riacho e lago possuem colisão própria e só permitem as travessias planejadas;
- o antigo `WorldScene` foi reduzido a um migrador de saves cartesianos e não cria jogador, inimigos, HUD ou uma segunda cidade;
- o minimapa continua local e acompanha o jogador sobre a pintura 2,5D completa; `M` mostra Cidade + Arredores, mantendo landmarks externos ocultos até serem descobertos;
- dez novos módulos de ambiente usam PNG RGBA e escala uniforme: chão campestre, estrada, riacho, ponte, lago, placa, santuário, ruínas, caverna e bloqueio de Greenwoods.

A Cidade de Aether preserva a conversão 2,5D e agora possui muralhas modulares com encontros superior e inferior naturais e pilares próprios nos vértices esquerdo e direito, eliminando as duas emendas laterais. Os dois muros inferiores recebem seis pequenas cenas de cerco contínuo: arqueiros defendem as ameias e goblins atacam pelo lado externo, sem interferir no combate ou nas interações do jogador. O ateliê de Maelis ocupa o espaço entre a taverna e o Portão Leste na mesma linha dos demais estabelecimentos; Kael olha para dentro da cidade sem espelhamento. O bairro residencial agora possui quatro casas de arquitetura própria conectadas por ruas e calçadas modulares. O gramado foi repintado e recebeu dezesseis tufos com animação sutil. Aldren continua voltado para a praça; Mira e o General Cassian Vhal ficam em lados opostos da fonte e possuem ações próprias; Tomas e Darian caminham em oito direções; e as oito chaminés presentes têm fumaça animada. Elara começa devastada diante de sua botica abandonada, com o estado restaurado preservado para a futura missão.

O herói usa a mesma escala corporal dos NPCs urbanos, mas essa arte não é mais o objeto físico. Um `Player` lógico invisível mantém posição, ponto dos pés, profundidade, interação e um corpo fixo de `32×16 px`; um `PlayerVisual` separado acompanha a mesma âncora e recebe aparência, animação, arma e armadura. Assim, as 24 combinações visuais compartilham exatamente a mesma colisão. Estabelecimentos e fonte usam a fundação física obtida de suas máscaras alfa, fechando portas e frestas internas sem transformar o padding transparente em parede. Árvores colidem pela base; NPCs, guardas, velhinho, gato e cachorro usam pequenas elipses calibradas no chão. Se um save começar tocando uma máscara, o movimento que reduz ou mantém a interseção continua permitido, evitando travamentos e preservando o deslizamento junto às fachadas.

O novo jogo permite escolher seis protagonistas — aparência masculina e feminina para Guerreiro, Mago e Caçador — com diversidade visual sem rótulos étnicos no menu e caminhada real em oito direções. Todos começam com roupas simples, sem arma e sem armadura; espada, cajado, arco e proteção corporal aparecem somente depois de equipados e respeitam a classe escolhida. As 24 folhas visuais foram alinhadas na linha `y=95`; não existe mais a elipse de sombra que sugeria flutuação. As direções direita, sudeste e nordeste são espelhos quadro a quadro das respectivas direções esquerdas, mantendo tamanho, fase do passo e sentido corretos. Cada combinação possui uma folha vazada de contorno dourado: quando o herói passa atrás de um objeto, o sprite normal continua em seu depth natural e somente a região realmente coberta recebe o fragmento dourado correspondente. Cabeça e tronco continuam normais quando apenas pernas ou quadril estão escondidos; muralhas e estabelecimentos nunca clareiam.

O canvas agora acompanha a largura e a altura reais do navegador em escala `1:1`: a janela maior revela mais mapa, sem ampliar um quadro fixo nem reamostrar paredes, personagens ou textos. As pinturas usam antialiasing, os textos são gerados em alta resolução e a barra inferior usa uma única moldura nativa de `1320×200 px`, reduzindo todo o conjunto pela mesma escala X/Y somente em janelas menores. Ela apresenta dois quadrados de consumíveis, oito espaços de habilidades e, à direita, quadrados ilustrados para `K`, `I`, `M`, `C` e `P`. A câmera possui margem além da borda norte, o inventário sempre mostra a aparência atual de frente e nome, função e comando dos NPCs permanecem numa única placa branca discreta sobre cada personagem.

### Atualização v12.7 — Reforma urbana

- o pavimento passou a ser um kit modular de losangos 2,5D derivados da pedra já aprovada no jardim do Marco de Senda; ele compõe trechos retos, curvas, esquinas, cruzamentos, entradas, praça e anel da fonte sem imagem gigante ou borda marrom periférica;
- comércio, praça/fonte, Marco, Portões Leste e Sul e os quatro lotes residenciais foram ligados pela mesma rede; calçadas de fachada e caminhos de porta terminam na rua lógica mais próxima;
- as residências agora são Casa da Ardósia, Sobrado do Musgo, Chalé da Lenha e Casa da Varanda, com telhados, fachadas, anexos, janelas, portas e volumes próprios;
- Tomas Belmon usa o cruzamento e a espinha da nova malha residencial, sem cruzar a fundação visual das casas;
- cada chaminé existente mantém três volumes de fumaça em deriva, mas duração, direção, expansão e pausa variam a cada emissão para eliminar o loop mecânico. A Casa da Ardósia não possui chaminé.

### Atualização v12.2

- a oclusão deixou de alternar o jogador inteiro entre normal e contorno: o sprite normal permanece no depth lógico e é coberto naturalmente apenas pelos pixels opacos do objeto que está à frente;
- uma textura dinâmica de `96×96 px` recorta, pixel a pixel, somente o trecho da folha dourada que coincide com a área realmente encoberta;
- caixas de contorno são usadas apenas para descartar objetos distantes; a decisão final exige simultaneamente depth inferior do jogador, pés atrás do plano frontal e alpha real do objeto;
- fonte, árvore, estabelecimentos, Marco de Senda, portões e muros permanecem totalmente opacos e não recebem tint, fade ou alteração visual;
- pequenas faixas de histerese no plano frontal e no número de pixels eliminam alternância nas bordas, sem tween de alpha;
- as seis aparências, quatro estados de equipamento, oito direções e quatro fases de caminhada usam o mesmo cálculo lógico, totalizando `768` combinações validadas.

### Atualização v12.1

- a entrada de teclado agora é cartesiana e normalizada uma única vez antes da inversa isométrica `2:1`; W/A/S/D e Setas são equivalentes, as oito direções mantêm velocidade idêntica e `A+W` seleciona corretamente noroeste;
- `Player` passou a ser o corpo lógico autoritativo, invisível e fixo em `32×16 px`; `PlayerVisual` acompanha sua posição, profundidade e ponto dos pés, recebendo exclusivamente textura, quadro, animação e equipamento;
- classe, sexo, direção, quadro, arma e armadura não participam mais do cálculo da hitbox ou das amostras de contato;
- edifícios e fonte colidem pela fundação real da pintura, incluindo cantos e frente, mas continuam ignorando todo o padding transparente; a árvore permanece restrita à faixa da base;
- NPCs e guardas usam footprints pequenos no chão, removendo colisões de cabelo, roupa ou lança; gato e cachorro receberam footprints próprios e continuam bloqueando o jogador;
- o movimento urbano testa o vetor completo em subpassos e, quando ele é bloqueado, tenta seus componentes cartesianos separadamente para produzir deslizamento natural sem atravessar quinas.

### Atualização v12.0

- os encontros esquerdo e direito da muralha receberam pilares isométricos próprios, na mesma pedra, luz e escala dos módulos; eles cobrem simultaneamente as duas pontas de profundidade diferente e também aparecem no mapa da cidade;
- quatro estações no muro Sul e duas no muro Leste formam um cerco visual infinito: goblins avançam, golpeiam a estrutura, recebem flechas dos arqueiros, caem e retornam em ondas;
- goblins e arqueiros são elementos exclusivamente cenográficos: não têm corpo físico, vida, alvo de combate, prompt ou interação e nunca entram nas listas de NPCs ou inimigos;
- pequenas zonas físicas fecham somente as seis estações do cerco; a faixa real da muralha continua sólida e os vãos centrais dos Portões Sul e Leste levam diretamente aos Arredores;
- atores, flechas e partículas seguem a profundidade isométrica de cada posição; arqueiros permanecem encaixados nas ameias e goblins aparecem no lado externo correto.

### Atualização v11.9

- o antigo conjunto inferior foi substituído por uma arte inteiramente nova, frontal e simétrica, com dois encaixes circulares idênticos de `132×132 px`; HP, Mana, moldura, botões e textos são reduzidos somente por escala uniforme, sem qualquer achatamento;
- o piso recebeu uma variação mais quente e contrastada, além de uma camada própria de ruas, calçadas e meios-fios calculada sobre a mesma malha `96×48` usada pelos edifícios;
- os dois pequenos lotes verdes foram substituídos por um único parque `768×384 px`, com clareira circular para o Marco de Senda, caminho interno e espaço superior direito para a árvore;
- o mapa `1024×768 px` agora é renderizado diretamente da planta real: usa os mesmos dez edifícios, muralhas, portões, fonte, parque, árvore e Marco, com as mesmas coordenadas, escalas e espelhamentos da cena;
- mapa grande e minimapa usam a transformação exata do mundo `3200×1900` para a pintura, de modo que jogador e marcadores coincidem com suas posições reais.

### Atualização v11.8

- a moldura inferior deixou de ser uma imagem comprida redimensionada: extremidades e brasão mantêm proporções nativas, enquanto uma faixa de `64 px` é repetida no centro; o conjunto completo só recebe escala uniforme;
- a bússola antes identificada como Controles agora é o botão `M` de Mapa; `C` ganhou uma arte própria e a poção de mana passou para `J`, evitando duas ações na mesma tecla;
- `M` abre um mapa grande da Cidade de Aether com arte 2,5D, portões, bairros, praça, jardim, marcadores e posição atual; o minimapa superior usa a mesma pintura em proporção `4:3`;
- ícones de poção de vida ou mana ficam escuros quando o inventário está sem o respectivo consumível; os botões ilustrados também aceitam clique;
- a árvore do jardim foi movida ligeiramente para baixo e o Marco de Senda agora apresenta sua mensagem no mesmo painel branco responsivo das conversas, com o mapa escurecido e a própria relíquia em destaque.

### Atualização v11.7

- a conversa com NPCs agora escurece o mapa e ocupa toda a faixa inferior com a mesma linguagem branca da placa de proximidade; nome, função e fala ficam à esquerda, enquanto o recorte transparente do NPC aparece grande à direita, sem fundo ou moldura e avançando acima do painel;
- Darian recebeu uma nova caminhada em oito direções com transferência natural de peso e sem o fragmento entre os pés; o velhinho foi reconstruído no acabamento 2,5D dos demais habitantes;
- Elara sem fé possui animação sutil própria; Mira e Cassian mantêm tamanho e linha dos pés fixos; os dois guardas executam ações visíveis com maior frequência;
- Kael foi movido para cima e à direita, junto à torre do Portão Leste; Bren foi movido para cima e à esquerda, junto à torre do Portão Sul, liberando o centro das passagens;
- cachorro e gato validam suas rotas contra as máscaras opacas do cenário; os dois animais e o velhinho também bloqueiam o corpo do jogador;
- todas as chaminés usam três camadas independentes da nova fumaça pintada 2,5D, com subida, deriva, expansão e dissipação;
- o Marco de Senda urbano possui uma plataforma larga própria, ajustada ao losango verde completo sem alterar o Marco menor já usado na floresta.

### Correção v11.6

- `IsoPhysicsSprite` agora expõe corretamente o controle encadeável de limites do corpo Arcade, eliminando a falha ao criar o herói depois da seleção de personagem;
- a barra inferior usa uma única escala para largura e altura, respeita margens do viewport e nunca amplia a moldura acima da resolução nativa;
- o favicon vazio é declarado no próprio HTML para impedir a solicitação automática de um recurso inexistente.

Aether adota `IsoSprite`/`IsoContainer` como fonte única de posição em toda a Cidade e nos Arredores. O corpo lógico altera `isoX`, `isoY` e `isoZ`, chama `updateIsoPosition()` e calcula a profundidade por `(isoX + isoY) × 100`, com a âncora no ponto dos pés. A entrada cartesiana é normalizada uma vez e convertida pela inversa `2:1`; o `PlayerVisual` apenas acompanha o corpo Arcade fixo de `32×16 px`. `IsoOcclusionManager` mantém os elementos altos opacos, enquanto a cena recorta apenas o fragmento dourado realmente escondido. Consulte `ROUND67_CITY_POLISH_PASS.md` para o passe atual e `HISTORICO_E_REFERENCIAS_ATE_ROUND66.md` para todos os documentos anteriores.

## Instalação

Na raiz do projeto, rode apenas:

```bash
npm install
npm run check
npm run validate
npm run dev
```

O Phaser agora está em `dependencies`, portanto **não é necessário** rodar `npm install phaser` separadamente.

## Controles

- WASD / Setas: mover
- Espaço: ataque básico
- Q / 1 / 2: habilidades da classe (aprendidas com pontos)
- H / J: poções de HP / mana
- E: coletar/interagir
- F: conversar com NPCs / examinar o Marco de Senda
- I: inventário/equipamentos
- K: Skills
- M: mapa da região (mapa 2,5D da cidade dentro de Aether)
- R: equipar melhor item
- T: loja quando estiver perto do Mercador
- C: controles
- P: pausa
- Esc: fechar interface atual

## Progressão

Cada nível concede:
- 1 ponto de habilidade
- 3 pontos de atributo

Atributos disponíveis: HP, MANA, ATAQUE e DEFESA.

Cada habilidade ativa começa bloqueada e precisa de 1 ponto para aprender. Pontos adicionais aumentam dano e consumo de mana.
