# Legends of Aether — Maga Base: nova caminhada em 8 direções

Base utilizada: `legends-of-aether-v0.3.2-round03-e-coletar-base-round02_1.zip` (SHA-256 `ee102780e46adcd700c8f60865d648d8ff38af84b7e7ed13b3bc3db71e04d4a8`).

## O que muda

Somente 2 arquivos, nos mesmos caminhos de antes:

- `assets/images/characters/player/mage_f_base.png`
- `assets/images/characters/player/mage_f_base_outline.png`

Nenhum arquivo de código foi alterado. O formato é idêntico ao anterior: 392×784, 4 quadros por direção × 8 direções, quadros de 96×96 com margem 1 e espaçamento 2 (a configuração especial da `mage_f` no `PreloadScene` continua valendo). A altura e a largura da personagem, o tamanho padrão do jogo, foram mantidos: os pés continuam em y=95 e nenhum quadro ultrapassa 96×96.

`backup_originais/` traz as duas folhas anteriores. Essa pasta fica fora de `assets/` para não ir ao `dist`.

## Diagnóstico da folha anterior

- Frente, costas e diagonais com saia: as botas quase não mudavam entre os 4 quadros (só um pé aparecia) e quem se mexia eram os braços.
- Perfis e diagonais: as pernas ficavam sempre abertas, sem quadro de passagem e sem balanço vertical do corpo.

## Como foi feito

Não há geração de arte nova. É uma reanimação por recorte, com os pixels originais, o que preserva o nível de detalhe já aprovado:

1. A barra da saia define o corte entre corpo e pernas. As botas são extraídas como peças, filtrando os fios dourados da barra.
2. Cada quadro é recomposto com o corpo original daquele quadro (braços e fluxo da saia como já estavam), mais as botas reposicionadas num ciclo de 4 quadros: contato → passagem → contato com os pés trocados → passagem. O pé de trás levanta e passa à frente na passagem.
3. O corpo desce 2 a 3 px nos quadros de contato (3 px na frente, costas e diagonais com um pé só visível; 2 px nos perfis e nas diagonais com dois pés visíveis).
4. A canela entre a bota e a barra é preenchida em sombra para não abrir fresta. Na diagonal frente-esquerda, onde a segunda bota era só um pedaço parcial, a bota distante é a bota principal espelhada e escurecida.
5. O contorno (`_outline`) foi regenerado para os novos quadros: anel de 1 px, cor (241,196,15), em volta da silhueta.

## Quadro de parado (quadro 1 de cada direção)

- Idêntico ao original (0 pixels diferentes): frente, costas, diagonal costas-direita (linha 3 da folha) e diagonal frente-direita.
- Perfil esquerdo: 32 pixels diferentes (recomposição das botas).
- Diagonal frente-esquerda, diagonal costas-esquerda (linha 5 da folha) e perfil direito: o corpo desce 2 px, porque a cabeça já encosta no topo do quadro e não há folga para subir nos quadros de passagem.

## Validação realizada

- Dimensões e layout da folha e do contorno conferem com os originais (392×784, RGBA).
- Nenhum quadro fora de 96×96; nenhum fragmento solto novo (checagem por componentes conectados).
- Jogo carregado no Chromium 141 (Playwright, WebGL por software): textura `player-mage_f-base` 392×784 com 33 quadros, 0 erros de console/página. As animações leem as linhas corretas por direção, inclusive a troca de diagonais já existente para a `mage_f` (frente 0–3, frente-esq. 4–7, esquerda 8–11, costas-dir. 12–15, costas 16–19, costas-esq. 20–23, direita 24–27, frente-dir. 28–31).
- Capturas em jogo dos 32 quadros: renderizam corretamente, mas nomes e barras de vida de inimigos próximos cobriram os pés, então o movimento das pernas foi julgado pela prévia animada.
- O código do jogo é o mesmo da base (nenhuma mudança), então os testes unitários e o `tsc` não são afetados.

## Limitações

- Reanimação por recorte, não arte pintada quadro a quadro. Podem restar pequenos artefatos de borda (por exemplo, pixels escuros isolados perto da barra em alguns quadros de perfil/diagonais). Recomendo revisar a prévia animada antes de aprovar.
- O contorno reproduz o original com cerca de 87% de coincidência pixel a pixel; podem existir diferenças pequenas na borda.
- Não foi verificado o encaixe com a velocidade real de movimento (deslizar de pés).
- Os estados da Maga com arma, armadura e arma+armadura (`mage_f_weapon`, `mage_f_armor`, `mage_f_weapon_armor`) **não foram alterados** e continuam com a caminhada antiga. Ao equipar algo, o problema volta. O mesmo método pode ser aplicado a eles.
- O ciclo continua com 4 quadros a 8 fps. Um ciclo mais longo exigiria mudar o carregamento e as animações, o que não foi feito.

## Como aplicar

Extraia o ZIP sobre a raiz do projeto, substituindo os 2 PNGs. Confirme no jogo com a Maga selecionada.

`preview_antes_depois.gif` mostra as 8 direções, antes e depois, a 8 fps.
