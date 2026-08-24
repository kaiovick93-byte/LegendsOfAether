# Round 38 — Ambientação urbana extra (aves urbanas + microvida da cidade)

## Objetivo
Adicionar mais um pequeno nível de vida urbana visual em **Cidade de Aether**, sem criar novas interações, prompts, diálogos, colisões ou impacto nas rotas principais do jogador.

## Implementado

### 1) Ave urbana extra no telhado da taverna
- Um pássaro adicional foi posicionado no telhado da taverna.
- Ele alterna entre dois pontos próximos do telhado.
- Em repouso, usa animação de bicadas/observação.
- Na troca de posição, usa animação de voo curto.
- Serve como detalhe de ambientação visual para reforçar a sensação de cidade viva.

### 2) Ave urbana extra em cerca decorativa
- Um segundo pássaro adicional foi colocado sobre uma pequena cerca decorativa.
- Também alterna entre dois pontos próximos.
- Usa o mesmo comportamento de repouso + voo curto.
- Não interfere com circulação do player nem com os canteiros/plaza.

### 3) Microrefino de vida urbana sem interação
- Ambos os pássaros foram tratados como **ambient fauna**.
- Eles não possuem:
  - nome;
  - prompt;
  - tecla de ação;
  - diálogo;
  - quest;
  - colisão.
- Os tempos de espera são variáveis para evitar comportamento excessivamente mecânico.

## Arquivo alterado
- `src/world/AmbientCityLife.ts`

## Observações de design
- O pássaro do telhado ajuda a dar leitura vertical ao cenário.
- O pássaro da cerca reforça a ambientação do espaço urbano próximo à praça/taverna.
- Ambos reaproveitam o asset já existente `city_bird`, sem necessidade de novos sprites.
- As novas aves foram mantidas em escala e linguagem visual consistentes com os demais elementos ambientais já presentes (senhor alimentando aves, pássaros no chão, cachorro, gato e ratos).
