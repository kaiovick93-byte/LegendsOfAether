# Mercador — asset integrado

Asset: `assets/images/characters/npcs/merchant.png`

Sprite sheet: 5 colunas x 4 direções, 128x160 px por frame, fundo transparente.

Linhas:
1. baixo
2. cima
3. esquerda
4. direita

Integração:
- PreloadScene carrega a sprite sheet.
- Npc.ts suporta `setRealSprite('merchant')`.
- WorldScene aplica a sprite real ao Mercador.

Controles mantidos:
- F: conversar
- T: loja
