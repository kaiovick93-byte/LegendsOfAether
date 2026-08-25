# Round 61 — Planta e circulação da Cidade de Aether

Este round preserva a conversão isométrica aprovada no Round 60 e corrige a organização urbana observada durante o teste.

## Planta revisada

- a fonte ocupa o centro exato da praça sobre pavimento contínuo;
- o Marco de Senda foi deslocado para um pequeno jardim próprio próximo à praça;
- o velhinho e seus pássaros agora permanecem próximos à fonte;
- as quatro residências formam um único bairro no setor inferior esquerdo;
- cada residência possui grama apenas sob seu lote; o pavimento começa logo após a base e forma as ruas;
- Mercador, Erudita, Ferreiro, Curandeira, Taverneiro e Artesã ficam exatamente diante de seus respectivos estabelecimentos;
- a Erudita e seu estabelecimento foram reposicionados e não existem mais caixotes sob a personagem;
- a Oficina da Artesã foi afastada do Portão Leste;
- árvores foram mantidas apenas em pontos periféricos, fora das fachadas;
- galinheiro, galinhas, cercas, postes, barris, caixotes e toras foram removidos da cidade nesta etapa.

## Circulação e colisões

A mesma planta agora define sprites, gramados, footprints e posições dos NPCs. Isso elimina divergências entre o que aparece na tela e o que bloqueia o jogador.

- footprint do Mercador recalibrado;
- footprint da Oficina ampliado e alinhado à base visual;
- corredores centrais dos portões Leste e Sul permanecem livres;
- guardas ficam ao lado das imagens dos portões, dentro da muralha e fora da passagem;
- Morador e Viajante possuem circuitos próprios sem atravessar construções;
- gato e cachorro continuam andando;
- ratos foram transferidos para uma rua visível, longe da Oficina;
- saves urbanos do Round 60 recebem uma posição inicial segura na primeira abertura do Round 61.

## Retorno dos Arredores

O retorno à cidade não depende mais do quadro exato em que o jogador cruza a antiga borda. Cada portão possui uma zona persistente dos dois lados da fachada; ao se aproximar pelo caminho correto, o jogo retorna à `AetherCityScene` e posiciona o jogador na avenida correspondente.

## Validação

```bash
npm run check
npm run validate:isometric-city
npm run build
```

A auditoria verifica os 10 footprints, as seis fachadas com NPCs, o bairro residencial, a praça, os dois guardas, os corredores dos portões, as rotas de fauna/NPCs e as transições entre cidade e Arredores.
