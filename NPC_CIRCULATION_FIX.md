# Round 29 — NPC circulation fix

Correções aplicadas sobre o Round 28 com praça, poço e detalhamento urbano:

- Elder Mira movida para `(820, 292)`, fora da colisão da Taverna e próxima ao eixo do Portão Leste.
- Artesã adicionada às listas de proximidade e conversa (`updateNpcPrompts` e `tryTalk`).
- Morador deixou de usar deslocamento aleatório e agora percorre uma rota segura ao redor da praça.
- Viajante deixou de nascer dentro do prédio da Erudita e agora percorre uma rota segura pelo corredor leste e ligação com a praça.
- `WanderingNpc` agora aceita rotas predefinidas, velocidade e pausas por ponto.
- Ao aproximar-se para conversar, o NPC ambulante pausa sua rota, olha para o jogador e retoma o percurso quando o jogador se afasta.
- As animações direcionais são preservadas durante a caminhada.

## Validação

- Rotas do Morador e do Viajante verificadas contra as colisões atuais de prédios, casas, poço e props urbanos com margem de segurança de 12 px.
- Nova posição da Elder Mira verificada contra as colisões atuais.
- `tsc --noEmit` concluído sem erros.
