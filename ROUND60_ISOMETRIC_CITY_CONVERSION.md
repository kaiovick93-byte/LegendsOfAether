# Round 60 — Conversão oficial da Cidade de Aether

O protótipo aprovado no Round 59 tornou-se a cidade oficial da campanha. A cidade agora ocupa uma cena isométrica própria, enquanto os demais mapas continuam cartesianos e preservam sua jogabilidade atual.

## Resultado desta etapa

- cidade completa em projeção isométrica `2:1`, com grade lógica de `28×28` e módulo `96×48 px`;
- herói real da campanha visível desde o primeiro quadro, ancorado pelos pés e com profundidade dinâmica;
- NPCs urbanos ampliados em aproximadamente 30% em relação ao protótipo, todos olhando para frente quando parados;
- duas rotas contínuas para morador e viajante, percorridas em sentidos opostos sem cortar edifícios ou objetos;
- praça central com Marco de Senda, fonte, jardins, árvores e postes de luz;
- estabelecimentos e residências distribuídos ao redor de ruas contínuas;
- galinheiro legível, cercado e com passagem própria;
- gato em percurso horizontal, ratos em ciclos contínuos e velhinho ancorado pela base durante toda a animação;
- muralhas contínuas e dois portões verticais e realmente transitáveis: Leste e Sul;
- colisões calculadas na grade lógica, separadas do volume visual de telhados, torres e muralhas;
- migração automática dos saves anteriores que estavam dentro da antiga cidade plana.

## Integração com a campanha

Ao atravessar um portão, o jogo troca entre `AetherCityScene` e `WorldScene`. Os Arredores mantêm a Fazenda de Rowan, o lago, as ruínas, os totens, a caverna e a passagem para a Floresta. Interiores residenciais retornam diretamente à nova cidade.

Os dados do jogador, classe, habilidades, inventário, equipamentos, missões e posições dos demais mapas continuam no mesmo save. A nova posição urbana é salva também nas coordenadas lógicas `u/v`.

## Assets permanentes

Nenhum asset criado para a conversão contém número de round no nome. Os novos módulos oficiais são:

- `isometric_city_grass.png`;
- `isometric_city_pavement.png`;
- `isometric_city_wall.png`;
- `isometric_city_gate.png`;
- `isometric_city_gate_east.png`;
- `isometric_grass_patch.png`.

## Validação

```bash
npm run check
npm run validate:isometric-city
npm run build
```

A auditoria do Round 60 verifica assets, projeção, escala do herói e dos NPCs, footprints, corredores dos dois portões, circuitos dos NPCs ambulantes, transições de cena e migração de save.
