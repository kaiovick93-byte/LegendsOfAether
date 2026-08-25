# Legends of Aether 0.1.9 — Round 59: Protótipo Isométrico

O menu principal agora oferece **PROTÓTIPO ISOMÉTRICO**, uma cena separada e jogável para validar a futura conversão 2.5D sem alterar a campanha nem o save. Consulte `ROUND59_ISOMETRIC_PROTOTYPE.md` para detalhes técnicos e controles.

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
- T: loja quando estiver perto do Ferreiro
- C: controles
- P: pausa
- Esc: fechar interface atual

## Progressão

Cada nível concede:
- 1 ponto de habilidade
- 3 pontos de atributo

Atributos disponíveis: HP, MANA, ATAQUE e DEFESA.

Cada habilidade ativa começa bloqueada e precisa de 1 ponto para aprender. Pontos adicionais aumentam dano e consumo de mana.
