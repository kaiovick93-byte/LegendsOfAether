# Round 44 — Pintinhos e micro cerca temática do galinheiro

## Objetivo
Enriquecer a área do galinheiro com dois detalhes adicionais pedidos:
- 1 ou 2 pintinhos perto do galinheiro;
- uma micro cerca mais temática, no mesmo padrão visual do jogo.

## O que foi implementado

### 1) Dois pintinhos ambientados
Em `src/world/AmbientCityLife.ts` foram adicionados **2 pintinhos** próximos ao galinheiro.

#### Abordagem visual
Para manter o padrão estético do projeto:
- os pintinhos **reaproveitam o mesmo sprite-base das galinhas**;
- foram configurados com **escala menor**;
- utilizam **rotas curtinhas e compactas** perto do galinheiro;
- mantêm comportamento puramente ambiental, sem interação.

#### Resultado
A área agora transmite melhor a leitura de um pequeno núcleo doméstico/rural dentro da cidade, sem quebrar o estilo pixel art já existente.

### 2) Micro cerca temática
Em `src/scenes/WorldScene.ts`, o bloco `chickenYardAccent(...)` foi retrabalhado.

#### Antes
- cerca sugerida apenas com elementos decorativos reaproveitados.

#### Agora
Foi desenhada uma **micro cerca rústica** com:
- postes de madeira;
- travessas horizontais;
- formato em **U** ao redor do galinheiro;
- pequena abertura frontal sugerindo um portão.

### 3) Detalhes adicionais do terreiro
Além da micro cerca, a área passou a ter:
- comedouro de madeira;
- pequeno bebedouro raso;
- fardos/caixotes decorativos;
- grãos espalhados no chão.

## Arquivos alterados
- `src/world/AmbientCityLife.ts`
- `src/scenes/WorldScene.ts`
- `CHICKS_AND_THEMED_MICRO_FENCE_ROUND44.md`

## Resultado esperado no jogo
A região do galinheiro fica mais coerente visualmente e mais viva, com:
- galinhas adultas circulando pelo terreiro;
- pintinhos pequenos próximos ao núcleo do galinheiro;
- cerca temática reforçando a ambientação rural leve dentro da cidade.
