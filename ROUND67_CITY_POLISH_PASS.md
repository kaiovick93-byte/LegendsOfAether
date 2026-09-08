# Round 67 — Cidade de Aether e Território Contínuo

Versão: `0.2.7`

## Resultado

O Round 67 preserva o acabamento da Cidade de Aether e estabelece a base estrutural contínua da Cidade, dos Arredores e da Estrada Velha, mantendo um único corpo lógico, uma única cena isométrica e uma única geografia persistente.

## Extensão v12.9 — Arredores e Estrada Velha de Aether

- `AetherCityScene` passou a representar todo o território lógico `0…82 × 0…82`; os bounds de tela são `x=-2700`, `y=-420`, `8700×5000` e o depth-base foi reservado em `-20000`;
- os Portões Sul e Leste são aberturas físicas na muralha: o jogador atravessa e retorna caminhando, sem trocar cena, desaparecer, sofrer fade ou reaparecer em outra coordenada;
- `WorldScene` permanece registrado somente como shim de compatibilidade para migrar saves cartesianos e encaminhá-los à posição lógica correspondente;
- quatorze setores distinguem centro, residencial, dois portões, Estrada Velha, zona próxima, estrada principal, Fazenda, riacho, lago, Santuário, ruínas, caverna e Entrada de Greenwoods;
- `TerritorySectorManager` atualiza setor e descobertas e aplica culling/ativação por distância sem destruir flags, landmarks ou objetos persistentes;
- Estrada Velha, estrada principal e quatro ramais conectam Portão Sul, Fazenda, lago, Santuário, ruínas, caverna e Greenwoods; pavimento urbano, pedra gasta e terra formam uma transição gradual;
- a Estrada Velha possui spawn futuro seguro `(7,7; 73,2)`, ponto de vista da cidade `(13,1; 34,5)`, placas, marcos, cercas quebradas, vegetação, troncos e carroça abandonada;
- Fazenda foi reservada com casa, celeiro, carroça, campos e cercado, sem ocupação goblin, quest, Grukk ou conteúdo definitivo;
- o riacho possui duas travessias físicas planejadas; água e lago bloqueiam o corpo lógico fora delas;
- Santuário Antigo, pequenas ruínas e caverna/fenda possuem arte, terreno, base física e oclusão; não foram convertidos em dungeon ou quest;
- a entrada de Greenwoods é visível como grande landmark e bloqueada simultaneamente pela pintura de raízes/vinhas e por volume lógico removível no futuro;
- dez módulos RGBA 2,5D foram preparados em escala uniforme, sem esticar terreno, estrada, água, ponte, lago ou landmarks;
- minimapa e mapa completo usam a projeção compartilhada do território; o minimapa mantém zoom local e o mapa `M` só revela landmarks externos depois da descoberta.

## Extensão v12.7 — Reforma urbana

- a malha urbana deixa de desenhar os grandes recortes de pavimento e passa a montar ruas, calçadas, esquinas, curvas, cruzamentos, entradas, praça e contorno da fonte por losangos modulares de pedra 2,5D;
- as peças usam o mesmo acabamento quente de pedra/musgo do jardim do Marco de Senda, mas bordas de transição são de pedra fria e vegetação discreta, não as antigas faixas marrons de contorno;
- a avenida comercial, as soleiras dos estabelecimentos, a praça, os Portões Leste e Sul e a área residencial pertencem à mesma malha e preservam o jardim do Marco como camada superior;
- as quatro residências foram substituídas por tipologias arquitetônicas reais: ardósia/varanda de entrada, enxaimel com musgo, chalé térreo com lenha e casa de varanda com venezianas;
- a rota de Tomas usa a espinha e a cruz do bairro e evita todas as fundações das casas;
- oito chaminés visíveis possuem fumaça 2,5D em três volumes, com emissão, vento, subida e dissipação não sincronizados; a Casa da Ardósia foi projetada sem chaminé.

## Cidade e circulação

- canvas configurado em `RESIZE`, com correspondência `1:1` entre pixels lógicos e a área real do navegador; uma janela maior revela mais mapa em vez de esticar um quadro `960×540`;
- pinturas renderizadas com antialiasing, sem `pixelArt` ou arredondamento de câmera; textos usam texturas internas ajustadas à densidade da tela;
- câmera em zoom nativo `1`, com margem responsiva além do limite norte; o mapa continua descendo quando o herói avança para cima e ele não termina colado ao topo da tela;
- ateliê de Maelis transferido para o espaço entre a taverna e o Portão Leste, na mesma linha de implantação de ferraria, curandeira e taverna, com Maelis diante da fachada;
- os dois lotes verdes separados foram substituídos por um único parque `768×384 px`; o Marco ocupa a clareira circular inferior esquerda e a árvore fica na clareira superior direita, reproduzindo a composição aprovada no mapa;
- piso urbano aquecido e contrastado, com ruas, calçadas e meios-fios desenhados sobre a mesma malha lógica `96×48` dos estabelecimentos e portões;
- muralhas refeitas como módulos periódicos com conectores isométricos exatos em `2:1`, mantendo profundidade própria por segmento;
- os encontros superior e inferior continuam naturais; os vértices esquerdo e direito usam pilares isométricos compactos na mesma pedra e escala dos módulos, cobrindo as duas pontas que chegam em profundidades diferentes;
- portões Sul e Leste derivados do mesmo desenho, espelhados e corrigidos para o eixo `2:1` da muralha;
- extensões laterais embutidas nos dois sprites dos portões foram removidas; o canvas original foi preservado, mas somente arco, torres e bandeiras permanecem visíveis;
- os módulos comuns terminam diretamente nas torres dos portões, sem conectores baixos, pilares duplicados ou sobreposição de coroamentos;
- faixa interna dos muros do fundo ampliada para impedir entrada na pedra atrás da ferraria e do mercado;
- corredores dos portões Leste e Sul limitados ao vão real dos arcos;
- continuidade de ida e volta pelos mesmos arcos, preservando o corpo, a câmera e a direção sem transição de cena.

## Colisão e oclusão

- o herói usa escala `1,28×` na cidade; a altura opaca das seis aparências fica na mesma faixa de `98–107 px` dos NPCs;
- os dois guardas usam `124 px` de canvas exibido, resultando em aproximadamente `113 px` opacos e eliminando a diferença percebida para Mira, Cassian e os demais NPCs;
- o jogador herda de `IsoSprite` por meio de `IsoPhysicsSprite`; esse objeto invisível é o corpo lógico autoritativo para posição, colisão, interação, profundidade e ponto dos pés, enquanto `PlayerVisual` apenas o representa;
- a posição autoritativa permanece em `isoX`, `isoY` e `isoZ`, e toda alteração urbana termina em `updateIsoPosition()`; o sprite visual sincroniza posição e profundidade sem poder alterar o corpo;
- a ordenação automática usa `(isoX + isoY) × 100 + isoZ × 0,01`, reservando apenas um `depthBase` para manter a interface acima do mundo;
- todos os sprites isométricos usam origem `(0.5, 1)`, fixando projeção, colisão e ordenação na linha dos pés;
- WASD e Setas produzem o mesmo vetor cartesiano; ele é normalizado uma única vez e convertido pela inversa exata da projeção isométrica `2:1`, preservando a velocidade em retas e diagonais e fazendo `A+W` corresponder a noroeste;
- o corpo Arcade do herói mede sempre `32×16 px` e fica centralizado na base; uma elipse lógica fixa fornece as amostras de contato e não consulta textura, classe, sexo, direção, quadro ou equipamento;
- aparência, arma e armadura são trocadas somente em `PlayerVisual`; cabeça, cabelos, capas e armas continuam sendo renderizados/ocultados, mas jamais redimensionam ou deslocam a hitbox;
- quando uma posição antiga começa tocando uma máscara, movimentos que reduzem ou mantêm a quantidade de pixels em contato são aceitos; o herói consegue escapar e deslizar junto ao obstáculo sem atravessá-lo;
- muralhas, pilares dos portões, Marco de Senda e árvore usam máscaras extraídas do canal alfa das próprias texturas;
- pixels transparentes externos dos canvases não bloqueiam o movimento; as máscaras são pré-calculadas uma vez e reutilizadas durante a cena;
- edifícios e fonte usam somente a faixa de fundação: o intervalo entre os primeiros e últimos pixels físicos de cada linha fecha portas, frestas e quinas internas sem incluir o padding transparente externo;
- atrás dos objetos, o sprite real permanece em seu depth lógico: o renderer cobre naturalmente apenas a interseção opaca e uma textura dinâmica `96×96 px` desenha acima do objeto somente os pixels correspondentes da folha dourada;
- a caixa externa de cada objeto serve apenas como broad phase; a oclusão exige pés atrás do plano frontal, depth do jogador inferior ao objeto e coincidência pixel a pixel com o canal alfa real;
- se fonte ou fachada esconder apenas pernas/quadril, cabeça e tronco continuam normais; nenhuma parte descoberta é substituída por contorno;
- uma histerese subpixel no plano de profundidade e o limiar de entrada/saída do fragmento impedem flicker ao atravessar bordas ou caminhar diagonalmente;
- muralhas, portões, edifícios e demais elementos altos permanecem totalmente opacos; `IsoOcclusionManager` não altera mais o alpha do cenário;
- fonte deixa de possuir a antiga elipse invisível à direita;
- árvore bloqueia somente os pixels opacos da faixa do tronco;
- Marco de Senda não cria o retângulo físico adicional na cidade e impede a entrada do corpo pela própria silhueta larga;
- NPCs, guardas e velhinho usam pequenas elipses lógicas na base, sem incorporar lanças, cabelos ou roupas; cachorro e gato possuem footprints menores próprios e impedem que o herói os atravesse;
- as rotas do cachorro e do gato verificam limites e pixels sólidos em pequenos intervalos, revertem ao encontrar bloqueio e não atravessam estabelecimentos, objetos ou outros atores sólidos;
- o movimento é subdividido em passos de até `0,035` tile para não atravessar detalhes finos entre dois quadros; quando o vetor diagonal é bloqueado, seus componentes horizontal e vertical de tela são testados separadamente para preservar o eixo ainda livre;
- o vão lógico dos portões foi reduzido para `13,42–14,58`; a faixa inferior das texturas fecha os pilares e deixa aberto somente o centro dos arcos.
- a faixa física das muralhas bloqueia somente a pedra, e pequenas zonas locais impedem alcançar as seis estações cenográficas; os corredores centrais seguem livres para caminhar aos Arredores.

## Arte e animação

- piso integral da cidade repintado com pedras maiores, irregulares e contínuas, sem aparência de uma textura pequena repetida;
- cores e acabamento do pavimento aproximados da pintura 2,5D dos personagens e estabelecimentos;
- gramado geral repintado com camadas de folhas, clover e variação orgânica em linguagem 2,5D, sem o ruído uniforme do antigo tapete verde;
- dezesseis pequenos tufos distribuídos no perímetro e no bairro residencial possuem um ciclo sutil de quatro quadros, sem criar novas colisões;
- mercado de Aldren reconstruído como um pavilhão aberto, girado para a praça, com Aldren diante do balcão;
- Aldren e seus quatro quadros de ação também foram orientados para a praça;
- Arquivo de Lysandra reconstruído como um estabelecimento compacto de um pavimento e sótão discreto, com sala de leitura aberta e um pequeno instrumento astronômico, sem torre ou alas extensas;
- Elara e sua botica usam inicialmente um estado devastado e abandonado, sem luz ou magia;
- os assets atuais e luminosos de Elara e da botica permanecem preservados como estado futuro da missão, acionado por `worldFlags.healerFaithRestored`;
- todas as oito chaminés visíveis usam três camadas da nova fumaça pintada 2,5D, com subida, deriva, expansão, dissipação, tamanho, cor e fase próprios por edifício;
- ferraria usa ardósia de carvão, Arquivo de Lysandra usa telhado ameixa envelhecido e a taverna usa telhas marrons rústicas, evitando três coberturas azuis semelhantes;
- seis ações profissionais realinhadas pela posição dos pés;
- fragmento indevido removido da ação da curandeira;
- áreas brancas indevidas da taverna convertidas em transparência real;
- guardas Leste e Sul receberam ações próprias em quatro quadros, duas repetições por ciclo e pausas curtas o bastante para que ambos permaneçam visivelmente vivos;
- velhinho reconstruído no mesmo acabamento pintado 2,5D dos demais NPCs, com quatro gestos de alimentação, apoio fixo, escala comum e PNG RGBA;
- Mira Edevane reconstruída em câmera e proporções 2,5D coerentes com os demais NPCs e recebeu um gesto próprio de alerta com cajado;
- General Cassian Vhal ocupa o lado oposto ao de Mira junto à fonte e recebeu uma ação própria de comando, além do retrato e diálogo sobre a dificuldade de defender Aether dos monstros;
- o guarda Leste foi levado para cima/direita junto à torre e o guarda Sul para cima/esquerda junto à torre; ambos olham para dentro da cidade e deixam livre o centro dos arcos;
- Tomas preserva 32 corpos completos; Darian foi reconstruído com alternância natural de pernas e sem o fragmento entre os pés; ambos mantêm quatro poses em cada uma das oito direções, sem simular direção por espelhamento;
- Elara devastada recebeu uma ação sutil própria; os quatro quadros de Mira e Cassian foram realinhados sem deslocamento da linha dos pés ou mudança de altura corporal;
- Tomas e Darian foram normalizados para aproximadamente `97–98 px` opacos em tela, deixando de parecer maiores que os NPCs fixos;
- bairro residencial reconstruído com quatro casas isométricas compactas, quatro pátios pavimentados e duas ruas internas; o piso agora alcança a base de cada casa e restam somente bordas estreitas de jardim;
- a casa azul foi recuada para dentro do pátio, sem cruzar as ruas residenciais nem compartilhar profundidade com o fechamento lateral da muralha;
- ratos ampliados, desacelerados e mantidos no ciclo de entrada/saída atrás da taverna.
- quatro estações no muro Sul e duas no muro Leste criam um cerco cenográfico contínuo, com goblins avançando e golpeando a pedra, poeira de impacto, arqueiros disparando e ondas reiniciadas após cada queda;
- goblins e arqueiros foram pintados no mesmo acabamento 2,5D dos NPCs urbanos e usam linha dos pés, luz, contraste e transparência coerentes com o restante da cidade;
- todos os atores do cerco são imagens sem física, vida, prompts ou registro de combate; flechas e partículas também são somente efeitos visuais;
- arqueiros usam posição elevada nas ameias, goblins permanecem fora do muro e a profundidade de cada ator e flecha é calculada na malha isométrica.

## Protagonistas e equipamentos

- tela de novo jogo reconstruída com seis escolhas: aparência masculina e feminina para Guerreiro, Mago e Caçador;
- o conjunto preserva diversidade visual sem exibir rótulos étnicos na seleção, mantendo câmera, escala, linha dos pés e linguagem 2,5D comuns aos NPCs;
- cada protagonista possui 32 quadros reais: quatro poses de caminhada para Sul, Sudeste, Leste, Nordeste, Norte, Noroeste, Oeste e Sudoeste;
- as 24 combinações normais usam a mesma linha de chão (`y=95`) e a sombra circular gerada pelo Phaser foi removida;
- Leste, Sudeste e Nordeste são espelhos quadro a quadro de Oeste, Sudoeste e Noroeste, preservando tamanho, fase e sentido da caminhada;
- o estado inicial usa somente roupas simples, sem arma e sem armadura visíveis;
- Guerreiro aceita apenas espadas, Mago apenas cajados e Caçador apenas arcos; itens incompatíveis não podem ser equipados;
- arma e armadura alteram imediatamente a folha usada pelo personagem, inclusive quando os dois itens estão equipados ao mesmo tempo; cada equipamento foi integrado à anatomia das 32 poses, com espada baixa, cajado ligado à pegada e arco acompanhado de aljava;
- os estados `cajado` e `cajado + armadura` da maga feminina foram refeitos: cajado preso à mão, borda preta removida e identidade feminina preservada nas 32 células;
- Maga feminina (`armadura`, `cajado` e `cajado + armadura`), Caçador masculino (`base`, `armadura` e `arco`), Guerreira com armadura e Guerreiro com espada foram normalizados novamente; halos, resíduos opacos e contornos grossos foram removidos sem alterar as 32 poses ou a linha dos pés;
- o inventário sempre apresenta o estado visual atual no quadro frontal Sul, independentemente da direção em que o herói estava andando no mapa;
- saves registram a aparência selecionada e migram saves antigos para a aparência masculina da classe já salva;
- as 24 combinações visuais (`6 aparências × 4 estados`) possuem folhas normais e folhas vazadas de contorno dourado, totalizando 48 spritesheets compatíveis com a oclusão universal.

## Interação

- aproximação de NPCs apresenta nome, função e comandos dentro de uma única moldura branca compacta, centralizada diretamente sobre a cabeça;
- `F · Conversar` e, para Aldren, `T · Loja` compartilham essa mesma placa, sem um cabeçalho ou segundo cartão separado;
- o Marco de Senda usa a mesma linguagem visual, mas mostra corretamente `F · Examinar`;
- ao iniciar uma conversa, um balão branco com reticências aparece sobre o NPC e acompanha personagens ambulantes;
- a conversa completa escurece o mapa e usa um painel branco responsivo em toda a faixa inferior, com identificação e fala à esquerda;
- a imagem do NPC vem do sprite transparente canônico, aparece grande à direita, sem fundo ou borda e ultrapassa a parte superior da área de texto;
- `F · Examinar` no Marco de Senda abre esse mesmo painel branco responsivo, escurece o mapa e exibe a relíquia 2,5D à direita;
- o indicador desaparece ao encerrar a conversa, abrir a loja ou ocultar o NPC.

## Mapa e minimapa

- a bússola que estava associada a Controles passa a representar corretamente o botão `M · Mapa`;
- `C · Controles` recebeu um ícone próprio em teclado e engrenagem, no mesmo acabamento pintado 2,5D dos demais comandos;
- `M` abre uma pintura isométrica `1024×768 px` do território inteiro; a planta aprovada da Cidade é recortada no losango urbano por escala uniforme e as estradas, água e reservas externas usam as mesmas coordenadas do jogo;
- painel e minimapa aplicam a projeção lógica `x=.5+(u-v)/82×.41`, `y=.22+(u+v)/164×.56`, mantendo jogador e marcadores na posição correta;
- o minimapa superior mostra somente a vizinhança do jogador com zoom local; os pontos externos do mapa grande possuem visibilidade vinculada a `discoveredLandmarks`;
- a poção de mana foi remapeada para `J`, deixando `M` exclusivamente para o mapa.

## Limpeza do projeto

- botão, cena, validador e texturas exclusivas do protótipo isométrico do Round 59 removidos;
- NPCs e limites urbanos 2D substituídos por versões isométricas foram removidos; `resident.png` e `traveler.png` permanecem porque ainda representam trabalhadores da fazenda nos Arredores;
- conector e meias-muralhas não referenciados, dois poços 2D obsoletos, o antigo jogador/contorno genérico e a fumaça exclusiva da ferraria foram retirados; somente as peças e folhas carregadas em execução permanecem;
- painel escuro e ícones coloridos substituídos da interação foram removidos; somente as teclas ainda usadas no diálogo completo permanecem;
- `assets/source`, `ROUND8_MANIFEST.txt`, imagens de QA e scripts históricos de preparação/render/validação foram removidos do pacote executável;
- a validação foi consolidada em `validate-project.mjs`;
- documentação histórica anterior consolidada em `HISTORICO_E_REFERENCIAS_ATE_ROUND66.md`;
- apenas este relatório do round atual permanece separado do histórico;
- `dist/` e `node_modules/` não fazem parte do pacote-fonte final.

## Interface inferior

- nova moldura 2,5D refeita do zero em aço azul-escuro e ouro envelhecido, com transparência real e canvas nativo de `1320×200 px`;
- a moldura é uma única pintura frontal e bilateralmente simétrica; os dois recortes dos orbes medem exatamente `132×132 px` e recebem círculos Phaser idênticos de raio `58 px`;
- em telas menores, todo o conjunto é reduzido uniformemente, considerando ao mesmo tempo a largura e a altura visíveis;
- escala X e Y são sempre idênticas, com teto de `1×`, portanto a HUD não é esticada nem ampliada além dos pixels nativos;
- orbes de HP e Mana são preenchidos pelo Phaser e diminuem proporcionalmente aos valores atuais;
- os ícones dos dois consumíveis ficam escurecidos quando a contagem correspondente chega a zero;
- quinze espaços exatos: poções de HP e Mana, oito habilidades/ações e cinco comandos;
- após as oito habilidades, `K` Skills, `I` Inventário, `M` Mapa, `C` Controles e `P` Menu possuem ícones próprios e podem ser clicados;
- nível, ouro e experiência continuam visíveis sem ocupar a área do mapa.

## Validação

Execute:

```bash
npm install
npm run check
npm run validate
npm run build
```

O validador consolidado verifica os bounds `82×82`, os quatorze setores, culling e descoberta persistente, os dois percursos de ida/volta pelos portões sem troca de cena, conexão da Estrada Velha, spawn futuro, vista de Aether, reservas de Fazenda/riacho/lago/Santuário/ruínas/caverna/Greenwoods, duas travessias e bloqueio da água, mapa completo e minimapa local, escala uniforme dos dez módulos novos e migração do antigo `WorldScene`. Também preserva todas as auditorias urbanas: oito entradas com regressão específica de `A+W`, equivalência Setas/WASD, `Player`/`PlayerVisual`, corpo `32×16`, fundações e footprints, deslizamento, profundidade, oclusão parcial para `768` combinações visuais, muralhas/portões, seis estações de cerco cenográfico, HUD proporcional, diálogos, fauna, chaminés, pavimento, residências e limpeza do pacote.
