# Round 67 — City Polish Pass

Versão: `0.2.7`

## Resultado

O Round 67 fecha a etapa de acabamento da Cidade de Aether isométrica com foco em contato visual, continuidade dos muros, portões, animações estáveis, linguagem de interação e coerência do cenário.

## Cidade e circulação

- câmera afastada discretamente para ampliar a leitura das ruas;
- ateliê de Maelis transferido para o alinhamento marcado entre a taverna e o Portão Leste, encostado visualmente ao corredor da muralha e com Maelis diante da fachada;
- árvore e Marco de Senda centralizados visualmente em seus jardins;
- muralhas refeitas como módulos periódicos com conectores isométricos exatos em `2:1`, mantendo profundidade própria por segmento;
- encontros esquerdo e direito receberam uma peça de canto isométrica única, com coroamento contínuo e sem as duas terminações abertas que antes se cruzavam;
- portões Sul e Leste derivados do mesmo desenho, espelhados e corrigidos para o eixo `2:1` da muralha;
- extensões laterais embutidas nos dois sprites dos portões foram removidas; o canvas original foi preservado, mas somente arco, torres e bandeiras permanecem visíveis;
- os módulos comuns terminam diretamente nas torres dos portões, sem conectores baixos, pilares duplicados ou sobreposição de coroamentos;
- faixa interna dos muros do fundo ampliada para impedir entrada na pedra atrás da ferraria e do mercado;
- corredores dos portões Leste e Sul limitados ao vão real dos arcos;
- retorno dos Arredores no limite interno do mesmo portão usado, preservando a direção de entrada.

## Colisão e oclusão

- edifícios usam máscara alfa na base e amostras de cabeça/tronco somente na aproximação frontal;
- atrás dos objetos, o herói continua livre para ser ocultado e exibir apenas o contorno dourado;
- fonte usa elipse calibrada na base desenhada, ignorando transparência do canvas;
- árvore bloqueia somente no tronco, inclusive em aproximações laterais;
- Marco de Senda usa contato compacto na base visível.

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
- velhinho reduzido e normalizado, com agachamento mais gradual e apoio fixo;
- Mira Edevane reconstruída em câmera e proporções 2,5D coerentes com os demais NPCs e recebeu um gesto próprio de alerta com cajado;
- General Cassian Vhal ocupa o lado oposto ao de Mira junto à fonte e recebeu uma ação própria de comando, além do retrato e diálogo sobre a dificuldade de defender Aether dos monstros;
- os guardas ficam próximos aos cantos internos dos portões e olham para dentro da cidade; o guarda Leste deixou de receber o espelhamento que o fazia olhar para fora;
- Tomas e Darian possuem 32 quadros reais cada: quatro poses de caminhada para cada uma das oito direções, sem simular direção por espelhamento;
- bairro residencial reconstruído com quatro casas isométricas compactas, quatro pátios pavimentados e duas ruas internas; o piso agora alcança a base de cada casa e restam somente bordas estreitas de jardim;
- a casa azul foi recuada para dentro do pátio, sem cruzar as ruas residenciais nem compartilhar profundidade com o fechamento lateral da muralha;
- ratos ampliados, desacelerados e mantidos no ciclo de entrada/saída atrás da taverna.

## Protagonistas e equipamentos

- tela de novo jogo reconstruída com seis escolhas: aparência masculina e feminina para Guerreiro, Mago e Caçador;
- o conjunto inclui protagonistas negros, asiáticos e caucasianos, mantendo câmera, escala, linha dos pés e linguagem 2,5D comuns aos NPCs;
- cada protagonista possui 32 quadros reais: quatro poses de caminhada para Sul, Sudeste, Leste, Nordeste, Norte, Noroeste, Oeste e Sudoeste;
- o estado inicial usa somente roupas simples, sem arma e sem armadura visíveis;
- Guerreiro aceita apenas espadas, Mago apenas cajados e Caçador apenas arcos; itens incompatíveis não podem ser equipados;
- arma e armadura alteram imediatamente a folha usada pelo personagem, inclusive quando os dois itens estão equipados ao mesmo tempo;
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
- documentação histórica anterior consolidada em `HISTORICO_E_REFERENCIAS_ATE_ROUND66.md`;
- apenas este relatório do round atual permanece separado do histórico;
- `dist/` e `node_modules/` não fazem parte do pacote-fonte final.

## Validação

Execute:

```bash
npm install
npm run check
npm run validate:isometric-city
npm run build
```

O validador do Round 67 verifica planta, dois fechamentos laterais únicos, portões compactos sem extensões sobrepostas, pontos de retorno, colisões calibradas, dez ações em quatro quadros, duas folhas ambulantes em oito direções, seis protagonistas em oito direções, quatro estados de equipamento por aparência, 48 folhas de oclusão, restrições de arma por classe, migração de saves, nove perfis de fumaça, dezesseis tufos animados, gramado refinado, quatro pátios residenciais, telhados distintos, transparência, orientação de Aldren, alinhamento do ateliê, guardas voltados para dentro, Mira, General Cassian, mercado aberto, escala compacta do Arquivo de Lysandra, interface de interação, remoção do protótipo e nomenclatura dos assets.
