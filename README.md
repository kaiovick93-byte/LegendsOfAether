# Legends of Aether 0.2.6 — Round 66: Contato e Profundidade da Cidade

A Cidade de Aether preserva a conversão 2,5D e a identidade visual dos estabelecimentos. Este passe sela toda a base das muralhas, uniformiza suas emendas, restringe o contorno dourado aos momentos em que o jogador está realmente atrás de um objeto, aproxima os seis NPCs profissionais de suas fachadas e transfere o ateliê de Maelis para um lote próprio. As seis ações profissionais também foram normalizadas em escala e linha dos pés. Consulte `ROUND66_CITY_CONTACT_DEPTH_PASS.md` para os detalhes e `ROUND66_CITY_VISUAL_QA.png` para a auditoria da planta.

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
