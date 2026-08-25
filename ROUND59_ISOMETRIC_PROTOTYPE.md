# Round 59 — Protótipo isométrico jogável

Este round introduz uma cena independente para validar a conversão visual de **Legends of Aether** antes de migrar a campanha. Ela pode ser aberta por **PROTÓTIPO ISOMÉTRICO** no menu principal e não grava, apaga ou migra o save atual.

## Conteúdo da cena

- grade lógica isométrica 2:1 de `22×22` células;
- projeção visual com módulo-base de `96×48 px`;
- piso contínuo de pedra e entorno contínuo de grama;
- praça com Marco de Senda, fonte, árvores, jardins e postes de luz;
- uma residência e um estabelecimento com NPC à frente;
- muralha em dois eixos, torres e um portão realmente aberto;
- jogador animado, NPC fixo olhando para frente e interação com `F`;
- colisões calculadas na grade lógica, separadas do tamanho da arte;
- ordenação de profundidade pela coordenada projetada dos pés.
- runtime local do Phaser e assets copiados para `dist`, sem dependência de CDN.

## Controles do protótipo

- `WASD` ou setas: mover;
- `F`: conversar com Aldren;
- `Esc`: fechar conversa ou voltar ao menu.

Os controles e sistemas da campanha original continuam inalterados.

## Direção visual

Os novos pisos foram derivados das texturas contínuas aprovadas no Round 58 e reprojetados como losangos completos, evitando a repetição visível por tile. A muralha e o portão foram criados como novos módulos isométricos de pedra, com nomes permanentes:

- `isometric_city_wall.png`;
- `isometric_city_gate.png`;
- `isometric_pavement_ground.png`;
- `isometric_grass_ground.png`;
- `isometric_grass_patch.png`.

Nenhum asset novo usa o número do round no nome.

## Validação

```bash
npm run check
npm run validate:city
npm run validate:isometric
npm run build
```

O protótipo é deliberadamente pequeno: sua função é aprovar câmera, escala, leitura das ruas, profundidade, colisão e linguagem dos novos assets antes da reconstrução isométrica de toda Aether.
