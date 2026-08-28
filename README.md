# Legends of Aether 0.2.7 — Round 67: Acabamento da Cidade Isométrica

A Cidade de Aether preserva a conversão 2,5D e agora possui muralhas modulares cujos quatro cantos são formados pelo mesmo encontro natural dos módulos, sem imagens adicionais. Os Portões Sul e Leste foram recortados até suas torres, eliminando as extensões duplicadas que apareciam sobre os módulos adjacentes. O ateliê de Maelis ocupa o espaço entre a taverna e o Portão Leste na mesma linha dos demais estabelecimentos; Kael olha para dentro da cidade sem espelhamento. A casa azul foi recuada do encontro lateral e as ruas residenciais continuam livres. O gramado foi repintado e recebeu dezesseis tufos com animação sutil. Aldren continua voltado para a praça; Mira e o General Cassian Vhal ficam em lados opostos da fonte e possuem ações próprias; Tomas e Darian caminham em oito direções; e as nove chaminés visíveis têm fumaça animada. Elara começa devastada diante de sua botica abandonada, com o estado restaurado preservado para a futura missão.

O novo jogo permite escolher seis protagonistas — aparência masculina e feminina para Guerreiro, Mago e Caçador — com diversidade visual sem rótulos étnicos no menu e caminhada real em oito direções. Todos começam com roupas simples, sem arma e sem armadura; espada, cajado, arco e proteção corporal aparecem somente depois de equipados e respeitam a classe escolhida. Armas e armaduras foram desenhadas junto às mãos e ao corpo em cada pose, sem camadas flutuantes. Cada uma das 24 combinações de aparência/equipamento possui também sua própria folha de contorno dourado para a oclusão. Consulte `ROUND67_CITY_POLISH_PASS.md` para o passe atual e `HISTORICO_E_REFERENCIAS_ATE_ROUND66.md` para todos os documentos anteriores.

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
