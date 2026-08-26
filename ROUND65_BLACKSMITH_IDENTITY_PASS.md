# Round 65 — Ferraria 2,5D de Borin

Este passe continua diretamente sobre o Round 64 e substitui somente a arte da ferraria. A planta aprovada, o NPC Borin, a interação, as rotas, a profundidade dinâmica e a colisão por opacidade permanecem inalterados.

## Reconstrução visual

- Arquitetura isométrica de três quartos com duas fachadas visíveis.
- Silhueta assimétrica em L, compatível com a identidade própria dos demais estabelecimentos.
- Vários planos de telhado em ardósia azul, todos recuando em perspectiva.
- Estrutura pesada de pedra, madeira escura, travessas e reforços metálicos.
- Chaminé alta de pedra com fumaça e oficina lateral aberta.
- Forja incandescente, bigorna, fole, carvão, ferramentas e suporte de armas.
- Placa de martelo e bigorna e estandarte azul com estrela dourada, preservando a linguagem visual de Borin.
- Entrada frontal livre para manter o NPC legível diante do prédio.

## Integração

- O arquivo continua se chamando `blacksmith_shop.png`; não existe número de Round no nome do asset.
- A nova imagem possui transparência real e resolução `501×528`.
- A coordenada, altura-alvo, footprint, faixa de colisão e posição do NPC não foram modificados.
- O sistema existente calcula escala, colisão e oclusão a partir da imagem nova sem retângulos transparentes extras.

## Validação

Execute:

```bash
npm run check
npm run build
npm run validate:isometric-city
node render-isometric-city-round65-qa.mjs
```
