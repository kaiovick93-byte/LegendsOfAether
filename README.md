# Legends of Aether 0.2.0 — Round 60: Conversão Isométrica da Cidade

A Cidade de Aether da campanha agora usa a projeção isométrica 2.5D aprovada no protótipo. O herói, NPCs, fauna, colisões, praça, estabelecimentos e os portões Leste/Sul foram migrados para uma grade lógica própria. Os Arredores, a Fazenda de Rowan, a Floresta, a Caverna e o Castelo continuam preservados. Consulte `ROUND60_ISOMETRIC_CITY_CONVERSION.md` para os detalhes.

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
