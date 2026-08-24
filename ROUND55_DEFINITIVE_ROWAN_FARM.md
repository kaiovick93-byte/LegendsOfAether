# Round 55 — Fazenda Definitiva de Rowan

## Objetivo
Substituir os principais placeholders da Fazenda de Rowan por assets rurais próprios, mantendo a linguagem visual consolidada em Cidade de Aether e no kit base dos Arredores.

## Assets definitivos integrados
### Construções
- `assets/images/environment/outskirts/farm/farmhouse.png`
- `assets/images/environment/outskirts/farm/barn.png`

### Transporte
- `assets/images/environment/outskirts/farm/empty_wagon.png`
- `assets/images/characters/ambient/farm/horse.png`

A carroça permanece **vazia**, como preparação para a futura quest de abastecimento da Taverna.

### Animais
- `assets/images/characters/ambient/farm/cow.png` — 4 frames
- `assets/images/characters/ambient/farm/pig.png` — 4 frames
- `assets/images/characters/ambient/farm/horse.png` — 4 frames

Foram criados loops ambientais próprios:
- `farm-cow-idle`
- `farm-pig-idle`
- `farm-horse-idle`

As galinhas já consolidadas no projeto foram reposicionadas para circular perto do galinheiro rural.

### Plantações
Foram preparados e integrados três módulos definitivos extraídos do kit visual dos Arredores:
- `farm_crop_wheat`
- `farm_crop_cabbage`
- `farm_crop_vegetables`

Eles substituem a antiga plantação desenhada proceduralmente com retângulos/elipses do Phaser.

## Trabalhadores rurais
A fazenda mantém dois trabalhadores ambientais:
- **Tomas Campina — Trabalhador rural**
- **Selene Verdal — Agricultora**

Nesta etapa eles usam sprites de NPCs já consolidados na direção artística da Cidade de Aether, garantindo coesão visual e evitando introduzir personagens com acabamento incompatível. Continuam sem interação/quest ativa por enquanto.

## Detalhamento agrícola
A área também recebeu:
- barris;
- caixas;
- lenha;
- saco de grãos;
- balde;
- pequenas trilhas de serviço entre os canteiros.

## Reorganização da fazenda
- casa rural própria posicionada no núcleo oeste;
- celeiro ao norte/centro;
- carroça e cavalo próximos à casa;
- plantações deslocadas para o setor leste/nordeste;
- galinheiro deslocado para o setor leste;
- galinhas agora circulam ao redor do galinheiro;
- vacas e porcos ocupam currais independentes.

## Colisões e circulação
A revisão considerou o corpo físico do jogador de aproximadamente `58x58 px`.

### Correção importante
Os currais do Round 49 eram visualmente funcionais, mas rasos demais para permitir circulação interna confortável após a integração dos animais definitivos.

No Round 55:
- o **curral das vacas** foi ampliado;
- o **chiqueiro** foi ampliado;
- ambos receberam portões físicos mais largos;
- as cercas continuam com colisão;
- os animais não usam colliders individuais, evitando prender o jogador dentro dos currais;
- casa, celeiro, carroça, cavalo e galinheiro possuem colisões compactas de base.

### Estrada principal
O trecho da estrada que atravessa a fazenda foi levemente redirecionado para passar de forma natural entre construções e currais, sem atravessar os prédios nem fechar os acessos.

### Auditoria geométrica
Partindo do Portão Sul, permanecem alcançáveis:
- pátio da Fazenda;
- interior do curral das vacas;
- interior do chiqueiro;
- plantações;
- galinheiro;
- estrada de continuação para o leste;
- acesso em direção ao lago/restante dos Arredores.

## Arquivos de código alterados
- `src/scenes/PreloadScene.ts`
- `src/scenes/WorldScene.ts`

## Validação
- `npx tsc --noEmit`: aprovado sem erros.

## Próximo passo sugerido
**Round 56 — Lore Antiga dos Arredores**

Substituir os placeholders de:
- totens/estátuas de deuses antigos;
- ruínas;
- colunas quebradas;
- destroços;
- pedras ritualísticas;
- pequenos sinais ambientais de uma civilização anterior a Aether.
