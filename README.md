# Legends of Aether 0.2.7 — Round 67: Acabamento da Cidade Isométrica

A Cidade de Aether preserva a conversão 2,5D e agora possui muralhas modulares com encontros superior e inferior naturais e pilares próprios nos vértices esquerdo e direito, eliminando as duas emendas laterais. Os dois muros inferiores recebem seis pequenas cenas de cerco contínuo: arqueiros defendem as ameias e goblins atacam pelo lado externo, sem interferir no combate ou nas interações do jogador. O ateliê de Maelis ocupa o espaço entre a taverna e o Portão Leste na mesma linha dos demais estabelecimentos; Kael olha para dentro da cidade sem espelhamento. A casa azul foi recuada do encontro lateral e as ruas residenciais continuam livres. O gramado foi repintado e recebeu dezesseis tufos com animação sutil. Aldren continua voltado para a praça; Mira e o General Cassian Vhal ficam em lados opostos da fonte e possuem ações próprias; Tomas e Darian caminham em oito direções; e as nove chaminés visíveis têm fumaça animada. Elara começa devastada diante de sua botica abandonada, com o estado restaurado preservado para a futura missão.

O herói usa a mesma escala corporal dos NPCs urbanos. As colisões da cidade são derivadas dos pixels opacos de muralhas, portões, edifícios, fonte, Marco de Senda, árvore e NPCs fixos, ignorando o padding transparente. O contato físico consulta apenas os últimos `14 px` opacos das pernas e dos pés. Se um save começar tocando uma máscara, o movimento que reduz ou mantém a interseção continua permitido, evitando travamentos e preservando o deslizamento junto às fachadas. O centro dos dois arcos permanece caminhável, enquanto os pilares não permitem saída. Tomas foi refeito sem fragmentos e os dois andarilhos foram normalizados para a escala comum.

O novo jogo permite escolher seis protagonistas — aparência masculina e feminina para Guerreiro, Mago e Caçador — com diversidade visual sem rótulos étnicos no menu e caminhada real em oito direções. Todos começam com roupas simples, sem arma e sem armadura; espada, cajado, arco e proteção corporal aparecem somente depois de equipados e respeitam a classe escolhida. As 24 folhas visuais foram alinhadas na linha `y=95`; não existe mais a elipse de sombra que sugeria flutuação. As direções direita, sudeste e nordeste são espelhos quadro a quadro das respectivas direções esquerdas, mantendo tamanho, fase do passo e sentido corretos. Cada combinação possui uma folha vazada de contorno dourado: quando o herói passa atrás de um objeto, o corpo real fica oculto e somente esse contorno aparece, sem clarear muralhas ou estabelecimentos.

O canvas agora acompanha a largura e a altura reais do navegador em escala `1:1`: a janela maior revela mais mapa, sem ampliar um quadro fixo nem reamostrar paredes, personagens ou textos. As pinturas usam antialiasing, os textos são gerados em alta resolução e a barra inferior usa uma única moldura nativa de `1320×200 px`, reduzindo todo o conjunto pela mesma escala X/Y somente em janelas menores. Ela apresenta dois quadrados de consumíveis, oito espaços de habilidades e, à direita, quadrados ilustrados para `K`, `I`, `M`, `C` e `P`. A câmera possui margem além da borda norte, o inventário sempre mostra a aparência atual de frente e nome, função e comando dos NPCs permanecem numa única placa branca discreta sobre cada personagem.

### Atualização v12.0

- os encontros esquerdo e direito da muralha receberam pilares isométricos próprios, na mesma pedra, luz e escala dos módulos; eles cobrem simultaneamente as duas pontas de profundidade diferente e também aparecem no mapa da cidade;
- quatro estações no muro Sul e duas no muro Leste formam um cerco visual infinito: goblins avançam, golpeiam a estrutura, recebem flechas dos arqueiros, caem e retornam em ondas;
- goblins e arqueiros são elementos exclusivamente cenográficos: não têm corpo físico, vida, alvo de combate, prompt ou interação e nunca entram nas listas de NPCs ou inimigos;
- uma barreira lógica contínua fecha a face interna dos dois muros do cerco, mantendo livres apenas os vãos centrais dos Portões Sul e Leste, que transferem de cena antes da área externa;
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

A Cidade de Aether adota `IsoSprite`/`IsoContainer` como fonte única de posição. Movimento altera `isoX`, `isoY` e `isoZ`, chama `updateIsoPosition()` e calcula a profundidade por `(isoX + isoY) × 100`, com origem dos sprites em `(0.5, 1)`. O controle aplica a transformação diagonal `2:1` do arquivo de colisão, o corpo Arcade fica restrito aos pés (`32×16`) e `IsoOcclusionManager` registra os elementos altos para transparência dinâmica. Consulte `ROUND67_CITY_POLISH_PASS.md` para o passe atual e `HISTORICO_E_REFERENCIAS_ATE_ROUND66.md` para todos os documentos anteriores.

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
