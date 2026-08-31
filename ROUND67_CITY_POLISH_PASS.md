# Round 67 — City Polish Pass

Versão: `0.2.7`

## Resultado

O Round 67 fecha a etapa de acabamento da Cidade de Aether isométrica com foco em contato visual, continuidade dos muros, portões, animações estáveis, linguagem de interação e coerência do cenário.

## Cidade e circulação

- câmera afastada discretamente para ampliar a leitura das ruas;
- ateliê de Maelis transferido para o espaço entre a taverna e o Portão Leste, na mesma linha de implantação de ferraria, curandeira e taverna, com Maelis diante da fachada;
- árvore e Marco de Senda centralizados visualmente em seus jardins;
- muralhas refeitas como módulos periódicos com conectores isométricos exatos em `2:1`, mantendo profundidade própria por segmento;
- os encontros esquerdo e direito agora usam somente os dois últimos módulos da muralha, exatamente como os encontros superior e inferior, sem peça de canto sobreposta;
- portões Sul e Leste derivados do mesmo desenho, espelhados e corrigidos para o eixo `2:1` da muralha;
- extensões laterais embutidas nos dois sprites dos portões foram removidas; o canvas original foi preservado, mas somente arco, torres e bandeiras permanecem visíveis;
- os módulos comuns terminam diretamente nas torres dos portões, sem conectores baixos, pilares duplicados ou sobreposição de coroamentos;
- faixa interna dos muros do fundo ampliada para impedir entrada na pedra atrás da ferraria e do mercado;
- corredores dos portões Leste e Sul limitados ao vão real dos arcos;
- retorno dos Arredores no limite interno do mesmo portão usado, preservando a direção de entrada.

## Colisão e oclusão

- o herói usa escala `1,28×` na cidade; a altura opaca das seis aparências fica na mesma faixa de `98–107 px` dos NPCs;
- muralhas, pilares dos portões, edifícios, fonte, Marco de Senda, árvore e NPCs fixos usam máscaras extraídas do canal alfa das próprias texturas;
- pixels transparentes dos canvases não bloqueiam o movimento; as máscaras são pré-calculadas uma vez e reutilizadas durante a cena;
- edifícios usam a faixa opaca da base e o corpo completo somente na aproximação frontal;
- atrás dos objetos, o herói continua livre para ser ocultado e exibir apenas o contorno dourado;
- fonte deixa de possuir a antiga elipse invisível à direita;
- árvore bloqueia somente os pixels opacos da faixa do tronco;
- Marco de Senda não cria o retângulo físico adicional na cidade e impede a entrada do corpo pela própria silhueta;
- o movimento é subdividido em passos de até `0,035` tile para não atravessar detalhes finos entre dois quadros;
- o vão lógico dos portões foi reduzido para `13,42–14,58`; a faixa inferior das texturas fecha os pilares e deixa aberto somente o centro dos arcos.

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
- todas as nove chaminés visíveis usam fumaça separada e animada em quatro quadros, com tamanho, cor e fase próprios por edifício;
- ferraria usa ardósia de carvão, Arquivo de Lysandra usa telhado ameixa envelhecido e a taverna usa telhas marrons rústicas, evitando três coberturas azuis semelhantes;
- seis ações profissionais realinhadas pela posição dos pés;
- fragmento indevido removido da ação da curandeira;
- áreas brancas indevidas da taverna convertidas em transparência real;
- guardas Leste e Sul receberam ações próprias em quatro quadros;
- velhinho reduzido e normalizado, com agachamento mais gradual, apoio fixo, PNG reexportado em RGBA conservador e fallback que impede uma textura ambiente ausente de interromper a cidade;
- Mira Edevane reconstruída em câmera e proporções 2,5D coerentes com os demais NPCs e recebeu um gesto próprio de alerta com cajado;
- General Cassian Vhal ocupa o lado oposto ao de Mira junto à fonte e recebeu uma ação própria de comando, além do retrato e diálogo sobre a dificuldade de defender Aether dos monstros;
- os guardas ficam próximos aos cantos internos dos portões e olham para dentro da cidade; o guarda Leste deixou de receber o espelhamento que o fazia olhar para fora;
- Tomas foi refeito com 32 corpos completos, sem o fragmento acima da cabeça e com ciclo de pernas renovado; Tomas e Darian mantêm quatro poses em cada uma das oito direções, sem simular direção por espelhamento;
- Tomas e Darian foram normalizados para aproximadamente `97–98 px` opacos em tela, deixando de parecer maiores que os NPCs fixos;
- bairro residencial reconstruído com quatro casas isométricas compactas, quatro pátios pavimentados e duas ruas internas; o piso agora alcança a base de cada casa e restam somente bordas estreitas de jardim;
- a casa azul foi recuada para dentro do pátio, sem cruzar as ruas residenciais nem compartilhar profundidade com o fechamento lateral da muralha;
- ratos ampliados, desacelerados e mantidos no ciclo de entrada/saída atrás da taverna.

## Protagonistas e equipamentos

- tela de novo jogo reconstruída com seis escolhas: aparência masculina e feminina para Guerreiro, Mago e Caçador;
- o conjunto preserva diversidade visual sem exibir rótulos étnicos na seleção, mantendo câmera, escala, linha dos pés e linguagem 2,5D comuns aos NPCs;
- cada protagonista possui 32 quadros reais: quatro poses de caminhada para Sul, Sudeste, Leste, Nordeste, Norte, Noroeste, Oeste e Sudoeste;
- o estado inicial usa somente roupas simples, sem arma e sem armadura visíveis;
- Guerreiro aceita apenas espadas, Mago apenas cajados e Caçador apenas arcos; itens incompatíveis não podem ser equipados;
- arma e armadura alteram imediatamente a folha usada pelo personagem, inclusive quando os dois itens estão equipados ao mesmo tempo; cada equipamento foi integrado à anatomia das 32 poses, com espada baixa, cajado ligado à pegada e arco acompanhado de aljava;
- os estados `cajado` e `cajado + armadura` da maga feminina foram refeitos: cajado preso à mão, borda preta removida e identidade feminina preservada nas 32 células;
- saves registram a aparência selecionada e migram saves antigos para a aparência masculina da classe já salva;
- as 24 combinações visuais (`6 aparências × 4 estados`) possuem folhas normais e folhas vazadas de contorno dourado, totalizando 48 spritesheets compatíveis com a oclusão universal.

## Interação

- aproximação de NPCs apresenta o nome e a função em um cabeçalho compacto;
- cada comando aparece em seu próprio cartão escuro, com tecla branca e texto legível (`F · Conversar` e, para Aldren, `T · Loja`);
- o Marco de Senda usa a mesma linguagem visual, mas mostra corretamente `F · Examinar`;
- ao iniciar uma conversa, um balão branco com reticências aparece sobre o NPC e acompanha personagens ambulantes;
- o indicador desaparece ao encerrar a conversa, abrir a loja ou ocultar o NPC.

## Limpeza do projeto

- botão, cena, validador e texturas exclusivas do protótipo isométrico do Round 59 removidos;
- NPCs e limites urbanos 2D substituídos por versões isométricas foram removidos; `resident.png` e `traveler.png` permanecem porque ainda representam trabalhadores da fazenda nos Arredores;
- `assets/source`, `ROUND8_MANIFEST.txt`, imagens de QA e scripts históricos de preparação/render/validação foram removidos do pacote executável;
- a validação foi consolidada em `validate-project.mjs`;
- documentação histórica anterior consolidada em `HISTORICO_E_REFERENCIAS_ATE_ROUND66.md`;
- apenas este relatório do round atual permanece separado do histórico;
- `dist/` e `node_modules/` não fazem parte do pacote-fonte final.

## Validação

Execute:

```bash
npm install
npm run check
npm run validate
npm run build
```

O validador consolidado verifica planta, quatro encontros naturais de muralha, centro exclusivo dos portões, pontos de retorno, máscaras alfa pré-calculadas, escala opaca do herói/NPCs, subpassos de movimento, células contínuas sem fragmentos, tolerância a falhas de recursos ambientes, dez ações em quatro quadros, duas folhas ambulantes em oito direções, seis protagonistas em oito direções, quatro estados distintos de equipamento por aparência, 48 folhas de oclusão, restrições de arma por classe, migração de saves, nove perfis de fumaça, dezesseis tufos animados, gramado refinado, quatro pátios residenciais, telhados distintos, transparência, alinhamento do ateliê, guardas voltados para dentro, limpeza de assets/scripts legados e ausência de arquivos de QA no pacote.
