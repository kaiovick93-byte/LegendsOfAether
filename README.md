# Legends of Aether 0.2.5 — Round 65: Ferraria 2,5D de Borin

A Cidade de Aether mantém todos os sistemas e assets aprovados no Round 64. A ferraria de Borin foi reconstruída em perspectiva 2,5D real, com duas fachadas visíveis, telhados diagonais em profundidade, oficina lateral, chaminé alta e forja aberta. Planta, posição do NPC, interação, colisão por transparência, rotas e transições não foram alteradas. Consulte `ROUND65_BLACKSMITH_IDENTITY_PASS.md` para os detalhes.

## Instalação

Na raiz do projeto, rode apenas:

```bash
npm install
npm run check
npm run dev
```

O Phaser agora está em `dependencies`, portanto **não é necessário** rodar `npm install phaser` separadamente.

## Controles

- WASD / Setas: mover
- Espaço: ataque básico
- Q / 1 / 2: habilidades da classe (aprendidas com pontos)
- H / M: poções de HP / mana
- E: coletar/interagir
- F: conversar
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
