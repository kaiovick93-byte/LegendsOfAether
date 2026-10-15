# Legends of Aether — v0.3.1 Round 26

## Objetivo
Aplicar o microajuste de integração do chão sinistro ao redor da continuação visual da estrada, preservando a estrada e sem criar assets novos.

## O que foi ajustado
- reduziu a largura visual da faixa escura ao redor da estrada, com foco maior no lado superior;
- quebrou a borda externa para evitar leitura de corredor reto/repetitivo;
- suavizou a costura perto da placa/entrada da floresta;
- preservou a geometria aprovada, a estrada e a ausência de colisão nova.

## Arquivos alterados
- src/world/OldRoadAncientForestVisualExtension.ts
- README.md

## Observações
- Nenhum asset novo foi criado.
- Nenhuma colisão, bounds, props ou lógica de gameplay foi alterada.
- O ajuste foi feito apenas com reequilíbrio dos offsets, alpha, jitter e distribuição dos sprites de chão já existentes.
