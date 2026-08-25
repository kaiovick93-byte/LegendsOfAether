# Round 52 — Calibração visual da fauna e do velhinho da Cidade de Aether

## Objetivo
Revisar escala e leitura visual dos elementos ambientais recém-refeitos para garantir que funcionem dentro da cidade com proporções coerentes entre si.

## Ajustes realizados

### Cachorro
- O novo desenho estava no estilo correto, porém ocupava pouco espaço dentro do frame 64×48.
- O spritesheet foi recalibrado para utilizar melhor o frame, mantendo as proporções do animal.
- A escala configurada no código (`.92`) foi preservada.

### Gato
- O novo desenho também ocupava pouco espaço útil do frame 64×48.
- O conteúdo visual foi ampliado dentro do próprio spritesheet para manter nitidez e proporção adequada no jogo.
- A escala configurada no código (`.90`) foi preservada.

### Pássaro
- O novo pássaro foi recalibrado dentro dos frames 32×24.
- Agora ele mantém leitura semelhante à dimensão visual anterior, mas com o novo padrão artístico.
- As escalas já usadas nos pássaros de chão, ombro e poleiros continuam válidas.

### Velhinho alimentando pássaros
- O spritesheet gerado incluía pássaros dentro das próprias poses.
- Como `AmbientCityLife` já possui pássaros independentes ao redor do velhinho, esses elementos embutidos gerariam duplicação.
- O asset foi limpo para manter apenas o personagem e sua animação de braço/postura.
- A escala `.78` foi mantida, pois o corpo exibido fica aproximadamente na mesma altura visual dos NPCs principais da cidade.

## Revisão de posicionamento
- Cachorro: rota sul continua livre e bem afastada dos principais colliders.
- Gato: rota oeste permanece sem conflito com construções ou circulação do jogador.
- Pássaros: poleiros e grupo do velhinho continuam coerentes com a arquitetura e props existentes.
- Velhinho: posição `(724, 584)` foi mantida. Ele permanece entre a área da erudita e a praça sem criar bloqueios físicos ou sobreposição crítica com NPCs.

## Arquivos alterados
- `assets/images/characters/ambient/city_dog.png`
- `assets/images/characters/ambient/city_cat.png`
- `assets/images/characters/ambient/city_bird.png`
- `assets/images/characters/ambient/elder_feeder.png`
