# Legends of Aether 0.2.7 — Round 67: Acabamento da Cidade Isométrica

A Cidade de Aether preserva a conversão 2,5D e agora possui muralhas modulares cujos quatro cantos são formados pelo mesmo encontro natural dos módulos, sem imagens adicionais. O ateliê de Maelis ocupa o espaço entre a taverna e o Portão Leste na mesma linha dos demais estabelecimentos; Kael olha para dentro da cidade sem espelhamento. A casa azul foi recuada do encontro lateral e as ruas residenciais continuam livres. O gramado foi repintado e recebeu dezesseis tufos com animação sutil. Aldren continua voltado para a praça; Mira e o General Cassian Vhal ficam em lados opostos da fonte e possuem ações próprias; Tomas e Darian caminham em oito direções; e as nove chaminés visíveis têm fumaça animada. Elara começa devastada diante de sua botica abandonada, com o estado restaurado preservado para a futura missão.

O herói usa a mesma escala corporal dos NPCs urbanos. As colisões da cidade são derivadas dos pixels opacos de muralhas, portões, edifícios, fonte, Marco de Senda, árvore e NPCs fixos, ignorando o padding transparente. O contato físico do herói consulta somente a faixa opaca de pernas e pés; cabeça, cabelo e equipamentos continuam na oclusão, mas não podem mais prendê-lo ao nascer ao lado de um guarda. O centro dos dois arcos permanece caminhável, enquanto os pilares não permitem saída. Tomas foi refeito sem fragmentos e os dois andarilhos foram normalizados para a escala comum.

O novo jogo permite escolher seis protagonistas — aparência masculina e feminina para Guerreiro, Mago e Caçador — com diversidade visual sem rótulos étnicos no menu e caminhada real em oito direções. Todos começam com roupas simples, sem arma e sem armadura; espada, cajado, arco e proteção corporal aparecem somente depois de equipados e respeitam a classe escolhida. Armas e armaduras foram desenhadas junto às mãos e ao corpo em cada pose, sem camadas flutuantes. Os estados apontados de Maga, Caçador e Guerreiros foram reexportados com transparência real, sem halos grossos, preservando escala e linha dos pés. Cada uma das 24 combinações de aparência/equipamento possui também sua própria folha de contorno dourado para a oclusão.

O canvas agora acompanha a largura e a altura reais do navegador em escala `1:1`: a janela maior revela mais mapa, sem ampliar um quadro fixo nem reamostrar paredes, personagens ou textos. As pinturas usam antialiasing, os textos são gerados em alta resolução e a barra inferior conserva os `960×154 px` nativos, centralizada sem esticar. A câmera possui margem além da borda norte para manter o personagem em uma zona de leitura confortável, o inventário sempre mostra a aparência atual de frente e nome, função e comando dos NPCs foram reunidos numa única placa branca discreta sobre cada personagem.

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
- H / M: poções de HP / mana
- E: coletar/interagir
- F: conversar com NPCs / examinar o Marco de Senda
- I: inventário/equipamentos
- K: Skills
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
