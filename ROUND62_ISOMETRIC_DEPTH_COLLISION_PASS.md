# Round 62 — Profundidade, Colisão e NPCs 2,5D

## Planta urbana

- Loja do Mercador, Casa de Estudos, Ferraria, Botica e Taverna foram afastadas das muralhas.
- A árvore da taverna e a árvore atrás da Erudita foram removidas.
- Uma única árvore permanece no jardim próximo ao Marco de Senda.
- As quatro residências continuam agrupadas no mesmo distrito.
- Fonte central, Marco de Senda, portões, Fazenda de Rowan e Arredores foram preservados.

## Colisão e profundidade

- Os antigos retângulos de colisão dos edifícios foram substituídos por leitura do canal alpha.
- Somente pixels opacos da faixa inferior, onde a construção toca o chão, bloqueiam o jogador.
- Transparências do canvas, telhados e espaço vazio ao redor da arte não criam colisões antecipadas.
- As residências usam a mesma máscara e não podem mais ser atravessadas como plataformas.
- Árvores bloqueiam apenas pelo tronco; a copa participa somente da ordenação por profundidade.
- Quando o jogador passa atrás da copa, surge um contorno dourado proporcional à oclusão.

## Personagens e animações

- Aldren, Borin, Elara, Garrick, Lysandra, Maelis, Mira, Kael e Bren receberam recortes isométricos em três quartos.
- A altura visual foi normalizada pela silhueta real e pela linha dos pés.
- Cada profissional executa uma ação periódica própria.
- Borin troca para um estado sem martelo, lança o martelo real do asset, gira e o recolhe.
- O velhinho usa a base verdadeira dos sapatos em cada quadro; as sementes não deslocam mais o corpo ao agachar.

## Vida urbana e transições

- Um único rato aparece, corre horizontalmente diante da taverna, desaparece e retorna após uma pausa aleatória.
- Gato e cachorro permanecem ativos em rotas livres.
- Ao retornar pelo Portão Leste, o jogador surge olhando para dentro da cidade à esquerda.
- Ao retornar pelo Portão Sul, o jogador surge olhando para dentro da cidade para cima.

## Validação

- TypeScript: aprovado.
- Build de produção: aprovado.
- Auditoria Round 62: 10 edifícios, 10 máscaras de opacidade, nove NPCs 2,5D, seis ações profissionais, cinco rotas e dois portões.
- Composição visual: `ROUND62_CITY_VISUAL_QA.png`.
