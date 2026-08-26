# Round 63 — Oclusão Universal e Animações 2,5D

## Correções de profundidade e oclusão

- O jogador voltou ao depth natural da linha dos pés; andar para baixo atrás de uma construção não o coloca sobre o telhado.
- A silhueta de oclusão usa uma folha própria com interior transparente: somente a borda dourada aparece acima do objeto.
- A leitura por pixels opacos vale para estabelecimentos, residências, árvore, fonte, Marco de Senda, muralhas e portões.
- A colisão da árvore continua limitada ao tronco; a copa apenas encobre o personagem.

## Planta dos estabelecimentos

- Os seis lotes comerciais não criam mais quadrados de grama.
- Aldren, Lysandra, Borin, Elara, Garrick e Maelis ficam sobre o pavimento imediatamente diante das respectivas fachadas.
- A grama foi mantida somente no distrito residencial e nos pequenos jardins do Marco de Senda e da árvore.

## Animações refeitas

- Aldren conta uma moeda.
- Borin lança e recupera o martelo.
- Elara ergue o cajado e ativa o cristal.
- Garrick ergue apenas o braço da caneca.
- Lysandra vira uma página.
- Maelis movimenta mão, linha e tesoura.
- Cada ação possui quatro quadros `208×224`, mesma câmera, escala e linha dos pés; não há deslocamento do sprite inteiro.
- Tomas Belmon e Darian Kestrel usam ciclos próprios de caminhada isométrica 2,5D com quatro quadros.
- O velhinho usa uma nova sequência `208×224` com base comum e sem compensações variáveis por quadro.

## Vida ambiente

- Um único rato aparece por ciclo junto à taverna.
- Ele nasce atrás de barris/varanda, atravessa a frente do prédio e desaparece somente depois de voltar para trás da arte.
- Gato, cachorro e pássaros permanecem ativos.

## Validação

- `./node_modules/.bin/tsc --noEmit`
- `./node_modules/.bin/vite build`
- `node validate-isometric-city-round63.mjs`
- Composição visual: `ROUND63_CITY_VISUAL_QA.png`
