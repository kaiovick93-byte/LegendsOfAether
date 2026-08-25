# Round 56 — Reconstrução Integral da Cidade de Aether

## Base utilizada

O Round 56 foi aplicado sobre o pacote completo do **Round 55 — Fazenda Definitiva de Rowan**. A Fazenda de Rowan, o lago, as ruínas, a caverna inativa e o Portal da Floresta foram preservados.

## Nova fundação urbana

- área interna anterior: `1040 × 760 px`;
- nova área interna: `1400 × 1040 px`;
- aumento aproximado de área útil: **84%**;
- muralhas norte/oeste contínuas;
- única abertura leste no Portão Leste;
- única abertura sul no Portão Sul;
- corredores físicos dos dois portões mantidos livres.

## Planta e circulação

A cidade foi reconstruída sobre uma malha única de coordenadas:

- avenida Leste–Oeste;
- eixo Portão Sul–praça;
- rua de fachada do distrito norte;
- rua residencial sul;
- duas ruas laterais de serviço;
- praça oval com anel integralmente circulável;
- pátios próprios para comércio, ferraria, botica, taverna, erudita e artesã.

## Edifícios

Dez construções receberam lotes e footprints independentes:

1. Loja de Aldren;
2. Ferraria de Borin;
3. Botica de Elara;
4. casa residencial laranja;
5. Taverna de Garrick;
6. Casa de Lysandra;
7. Oficina de Maelis;
8. casa residencial vermelha;
9. casa residencial verde;
10. casa residencial azul.

Nenhum footprint ou retângulo visual de construção se sobrepõe a outro, e nenhuma construção fica fora das muralhas.

## Poço central

O antigo poço foi substituído por um asset próprio e mais detalhado:

- `assets/images/environment/city/props/city_well_round56.png`;
- pixel art isométrica/top-down;
- pedra, madeira e telhas vermelhas compatíveis com os edifícios da cidade;
- fundo transparente;
- collider compacto apenas na base.

## Profundidade e personagens

- jogador, NPCs, fauna, construções e props agora usam profundidade baseada na coordenada `Y` dentro da cidade;
- o jogador fica atrás da construção ao passar ao norte dela e à frente ao passar ao sul;
- footprints físicos impedem o jogador de entrar no corpo dos edifícios;
- NPCs oficiais mantêm o padrão de aproximadamente `64 px` de altura;
- o ancião ambiental foi reduzido para aproximadamente `65 px`, eliminando a diferença de escala;
- guardas foram colocados ao lado dos portões, fora das passagens;
- NPCs ambulantes continuam suas rotas e só pausam quando o diálogo é aberto.

## Fauna ambiental

- cão: rota própria no setor sul da praça;
- gato: rota própria junto à muralha oeste;
- galinhas e pintinhos: terreiro fechado e separado de edifícios;
- ratos: aparições abaixo da fachada da taverna;
- ancião e pássaros: recanto próprio no sudeste da praça;
- pássaros empoleirados: posições próprias na taverna e no galinheiro.

As rotas não atravessam retângulos visuais de edifícios.

## Compatibilidade com saves

Saves originados na planta antiga recebem migração única para o novo ponto seguro da cidade. Posições salvas nos Arredores, Floresta, Caverna e Castelo são preservadas.

## Arquivos alterados

- `src/scenes/WorldScene.ts`;
- `src/scenes/PreloadScene.ts`;
- `src/world/AmbientCityLife.ts`;
- `assets/images/environment/city/props/city_well_round56.png`;
- `package.json`;
- `package-lock.json`;
- `validate-city-round56.mjs`.

## Validação

- auditoria geométrica: `CITY_ROUND56_AUDIT_OK`;
- 10 edifícios verificados;
- 23 pontos/rotas de NPCs verificados;
- 22 pontos de fauna verificados;
- 2 corredores de portão verificados;
- `tsc --noEmit`: aprovado;
- build de produção do Vite: aprovado.
