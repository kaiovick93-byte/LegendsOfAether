# Round 39 — Microvida Urbana de Aether

## Objetivo
Adicionar pequenos acontecimentos ambientais à Cidade de Aether para aumentar a sensação de lugar habitado, sem transformar decoração em mecânica e sem interferir em colisões, NPCs ou rotas do jogador.

## Implementado

### Fumaça animada de chaminé
- Taverna: fumaça suave e intermitente.
- Casa da Erudita: fumaça menor e mais lenta.
- Os puffs se dissipam automaticamente e não acumulam objetos permanentes.

### Panos e bandeirolas urbanos
- Dois pequenos varais decorativos foram adicionados em áreas secundárias.
- Os panos balançam levemente com tempos diferentes.
- São puramente visuais e não possuem collider.

### Morador varrendo
- Um morador ambiental foi colocado no setor residencial leste.
- Ele varre continuamente com uma vassoura animada e pequenas partículas de poeira.
- Não pertence ao sistema `Npc` e portanto não possui nome, prompt, diálogo ou quest.
- Não possui collider.

### Galinhas
- Três galinhas circulam em uma pequena área próxima à oficina/residências.
- Elas caminham lentamente, param e ciscam o chão.
- Possuem tempos e rotas diferentes para evitar sincronização artificial.
- Não possuem interação, nome, prompt, quest ou collider.

## Integração técnica
Arquivo principal:
- `src/world/AmbientCityLife.ts`

Não foi necessário alterar o preload: as galinhas são geradas como pequenas texturas pixeladas em runtime, preservando o pacote leve e evitando dependência de novos arquivos externos.

## Compatibilidade
- Mantém cachorro, gato, senhor alimentando pássaros e aves do Round 36.
- Mantém ratos da taverna do Round 37.
- Mantém aves urbanas do Round 38.
- Não altera colisões dos Rounds 30/32.
- Não altera a UI de interação ou diálogo dos NPCs.
