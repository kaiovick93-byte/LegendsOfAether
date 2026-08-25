# Round 43 — Refinamento do galinheiro e do terreiro das galinhas

## Objetivo
Fazer um refino fino da área do galinheiro, aproximando visualmente as galinhas dele e enriquecendo o espaço com pequenos detalhes ambientais sem criar nova interação.

## Ajustes implementados

### 1) Reposicionamento do galinheiro
- posição anterior: `x: 418`, `y: 810`, `scale: 0.42`
- nova posição: `x: 432`, `y: 804`, `scale: 0.40`

### 2) Colisão revisada
A colisão continua apenas na base, mas foi refinada para combinar com a nova posição/escala:
- largura: `62`
- altura: `26`
- `offsetY: 11`

### 3) Quintal visual ao redor do galinheiro
Foi criado um pequeno conjunto decorativo em `WorldScene.ts` com:
- cercas floridas decorativas reaproveitadas do kit urbano;
- um pequeno comedouro de madeira;
- dois pequenos volumes baixos (caixotes/fardos);
- grãos espalhados próximos ao comedouro.

Tudo isso é puramente visual e não interfere na circulação.

### 4) Rotas das galinhas refinadas
Em `AmbientCityLife.ts` as rotas foram redesenhadas para:
- formar um pequeno terreiro em volta do galinheiro;
- manter as galinhas mais próximas do novo ponto focal;
- evitar a passagem principal do sul;
- preservar a coerência de escala com a fauna urbana.

## Arquivos alterados
- `src/scenes/WorldScene.ts`
- `src/world/AmbientCityLife.ts`
- `CHICKEN_COOP_REFINEMENT_ROUND43.md`

## Resultado esperado
A área das galinhas passa a parecer um pequeno quintal orgânico da cidade, com o galinheiro servindo de âncora visual e as galinhas mais conectadas ao cenário.
