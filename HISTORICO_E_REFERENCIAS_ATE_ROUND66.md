# Histórico e referências — até o Round 66

Este arquivo consolida integralmente os relatórios e referências que antes estavam separados na raiz do projeto. Os títulos abaixo preservam o nome original de cada documento para busca e rastreabilidade.

## Índice de documentos incorporados

- `AMBIENT_CHICKENS_ROUND40.md`
- `AMBIENT_CHICKENS_TUNING_ROUND41.md`
- `AMBIENT_CITY_LIFE_ROUND36.md`
- `AMBIENT_RATS_ROUND37.md`
- `AMBIENT_URBAN_TOUCHES_ROUND38.md`
- `BLACKSMITH_ASSET.md`
- `BLACKSMITH_SHOP_INTEGRATION.md`
- `CHICKEN_COOP_REFINEMENT_ROUND43.md`
- `CHICKEN_COOP_ROUND42.md`
- `CHICKEN_YARD_FINAL_POLISH_ROUND45.md`
- `CHICKS_AND_THEMED_MICRO_FENCE_ROUND44.md`
- `CITY_AMBIENT_VISUAL_CALIBRATION_ROUND52.md`
- `CITY_GLOBAL_POLISH_ROUND46.md`
- `CITY_GROUND_INTEGRATION.md`
- `CITY_STRUCTURES_INTEGRATION.md`
- `COLLISION_CIRCULATION_AUDIT_ROUND32.md`
- `COLLISION_PASS_ROUND30.md`
- `ELDER_FEEDER_STYLE_FIX_ROUND51.md`
- `ELDER_FINAL_VISUAL_CLEANUP_ROUND53.md`
- `ELDER_MIRA_ASSET_INTEGRATION.md`
- `FAUNA_STYLE_UNIFICATION_ROUND50.md`
- `GUARD_ASSET_INTEGRATION.md`
- `HEALER_ASSET_INTEGRATION.md`
- `HEALER_HOUSE_INTEGRATION.md`
- `HEALER_SIZE_FIX.md`
- `HUD_GLOBAL_NOTES.md`
- `MERCHANT_ASSET_INTEGRATION.md`
- `MERCHANT_SHOP_INTEGRATION.md`
- `NPC_CIRCULATION_FIX.md`
- `NPC_DIALOGUE_UI_ROUND34.md`
- `NPC_INTERACTION_UI_ROUND33.md`
- `NPC_NAME_CORRECTION_ROUND35C.md`
- `NPC_NATURAL_IDLE_ANIMATIONS_ROUND47.md`
- `NPC_PORTRAIT_FIDELITY_ROUND35A.md`
- `OUTSKIRTS_BASE_ART_KIT_ROUND54.md`
- `OUTSKIRTS_COLLISION_CIRCULATION_ROUND49.md`
- `PLAZA_REFINEMENT.md`
- `PLAZA_WELL_STREETS_REFINEMENT.md`
- `PROJECT_STRUCTURE.md`
- `README_TS_IMPORTS.md`
- `RESIDENT_ASSET_INTEGRATION.md`
- `RESIDENTIAL_HOUSES_INTEGRATION.md`
- `ROUND48_OUTSKIRTS_EXPANSION.md`
- `ROUND55_DEFINITIVE_ROWAN_FARM.md`
- `ROUND56_CITY_RECONSTRUCTION.md`
- `ROUND57_CITY_ART_AND_COLLISION_PASS.md`
- `ROUND58_CITY_FOUNDATION_PASS.md`
- `ROUND59_ISOMETRIC_PROTOTYPE.md`
- `ROUND60_ISOMETRIC_CITY_CONVERSION.md`
- `ROUND61_ISOMETRIC_CITY_LAYOUT_FIX.md`
- `ROUND62_ISOMETRIC_DEPTH_COLLISION_PASS.md`
- `ROUND63_UNIVERSAL_OCCLUSION_ANIMATION_PASS.md`
- `ROUND64_FAUNA_BUSINESS_IDENTITY_PASS.md`
- `ROUND65_BLACKSMITH_IDENTITY_PASS.md`
- `ROUND66_CITY_CONTACT_DEPTH_PASS.md`
- `SCHOLAR_ASSET_INTEGRATION.md`
- `SCHOLAR_HOUSE_INTEGRATION.md`
- `SHOP_SYSTEM.md`
- `SOUTH_GUARD_ASSET_INTEGRATION.md`
- `SOUTH_GUARD_PORTRAIT_INTEGRATION_ROUND35B.md`
- `SOUTH_GUARD_PORTRAIT_REFINEMENT_ROUND35C.md`
- `STABILITY_0.1.4_ROUND2.md`
- `STABILITY_0.1.4.md`
- `STABILITY_0.1.6_ROUND3.md`
- `STREET_DETAILING_PHASE2_AND_PLAZA_REFINEMENT.md`
- `TAVERN_HOUSE_INTEGRATION.md`
- `TAVERNKEEPER_ASSET_INTEGRATION.md`
- `TRAVELER_ASSET_INTEGRATION.md`
- `URBAN_MICROLIFE_ROUND39.md`
- `WAYSTONE_INTEGRATION.md`

---

## Documento original: AMBIENT_CHICKENS_ROUND40.md

# Round 40 — Ambient Chickens Integrated

## Objetivo
Substituir as galinhas ambientais provisórias por sprites derivados da folha aprovada pelo usuário, mantendo o padrão estético do restante da fauna urbana de Aether.

## Implementado
- Conversão da folha `folha_de_sprites_de_galinhas_pixel_art.png` em 3 spritesheets transparentes:
  - `city_chicken_white.png`
  - `city_chicken_brown.png`
  - `city_chicken_cream.png`
- Cada spritesheet possui 4 frames (parada/caminhada/caminhada/peckando).
- `PreloadScene.ts` atualizado para carregar os três novos assets.
- `AmbientCityLife.ts` atualizado para:
  - registrar animações de caminhada das galinhas;
  - criar 3 galinhas ambientais na área residencial sudeste;
  - usar peck/idle entre deslocamentos;
  - manter comportamento totalmente não interativo.

## Comportamento
- As galinhas continuam sem prompt, sem diálogo, sem colisão e sem quest.
- Permanecem apenas como microvida urbana.
- As rotas foram mantidas próximas da área onde já estavam ambientadas.

## Arquivos alterados
- `src/scenes/PreloadScene.ts`
- `src/world/AmbientCityLife.ts`
- `assets/images/characters/ambient/city_chicken_white.png`
- `assets/images/characters/ambient/city_chicken_brown.png`
- `assets/images/characters/ambient/city_chicken_cream.png`

---

## Documento original: AMBIENT_CHICKENS_TUNING_ROUND41.md

# Round 41 — Ajuste de quantidade, rotas e escala das galinhas

## Objetivo
Refinar a microfauna urbana de Aether ajustando:
- quantidade de galinhas ativas;
- rotas de circulação;
- proporção visual em relação ao restante da fauna urbana.

## Revisão visual
A escala anterior deixava as galinhas um pouco discretas demais perto de gato, cachorro e até da leitura visual dos ratos.

### Nova leitura de escala
- cachorro: permanece como o maior animal urbano;
- gato: abaixo do cachorro;
- galinhas: agora ocupam um nível intermediário coerente;
- ratos: menores e mais furtivos;
- pássaros: continuam sendo os menores.

Para isso, as galinhas passaram a usar escalas variadas:
- branca: `0.38`
- marrom: `0.36`
- creme: `0.35`
- marrom menor: `0.33`

Isso cria variedade sem quebrar o padrão estético.

## Ajuste de quantidade
- Antes: 3 galinhas
- Agora: 4 galinhas

## Ajuste de rotas
As rotas foram redesenhadas para:
- parecerem mais naturais;
- permanecerem concentradas no setor residencial sudeste;
- evitar corredores principais do jogador;
- dar sensação de pequeno terreiro doméstico.

## Arquivo alterado
- `src/world/AmbientCityLife.ts`

## Observação
Continua tudo sem interação, sem prompt, sem colisão dedicada e sem impacto na lógica dos NPCs principais.

---

## Documento original: AMBIENT_CITY_LIFE_ROUND36.md

# Round 36 — Ambientação Viva da Cidade de Aether

## Elementos adicionados
- 1 cachorro ambulante, sem interação.
- 1 gato ambulante, sem interação.
- 1 senhor idoso careca alimentando pássaros próximo à praça, sem interação.
- 5 pássaros ambientais: quatro bicando/movendo-se no chão e um alternando entre o chão e o ombro do senhor.

## Comportamento
- Cachorro e gato usam rotas curtas predefinidas e pausas naturais.
- O senhor possui animação contínua de alimentar os pássaros.
- Os pássaros do chão bicam e dão pequenos saltos.
- Um pássaro voa periodicamente para o ombro do senhor e depois volta ao chão.
- Migalhas discretas reforçam visualmente a cena.

## Regras de jogabilidade
- Nenhum destes elementos possui nome flutuante.
- Nenhum possui prompt `F`/`T`.
- Nenhum abre diálogo ou missão.
- Nenhum possui collider, evitando bloqueios no jogador e nos NPCs funcionais.
- Eles não foram adicionados às listas de `tryTalk()` ou `updateNpcPrompts()`.

## Arquivos principais
- `src/world/AmbientCityLife.ts`
- `src/scenes/WorldScene.ts`
- `src/scenes/PreloadScene.ts`
- `assets/images/characters/ambient/city_dog.png`
- `assets/images/characters/ambient/city_cat.png`
- `assets/images/characters/ambient/elder_feeder.png`
- `assets/images/characters/ambient/city_bird.png`

---

## Documento original: AMBIENT_RATS_ROUND37.md

# Round 37 — Ratos ambientais da Taverna

## Objetivo
Adicionar microfauna urbana discreta ao entorno da Taverna de Aether sem criar interação, colisão ou novas mecânicas de gameplay.

## Implementação
- 3 ratos ambientais com variações visuais:
  - cinza
  - marrom
  - cinza-escuro
- Spritesheets compactas de 2 frames para corrida.
- Cada rato corre em um pequeno percurso próprio ao redor da taverna.
- Movimentos em rajadas rápidas com pausas e reaparecimento em tempos diferentes.
- Os ratos desaparecem em pontos de esconderijo para simular entrada atrás de barris, caixas e cantos do prédio.

## Regras de ambientação
- Sem nome flutuante.
- Sem prompt de F.
- Sem diálogo.
- Sem quest.
- Sem collider físico.
- Sem interferência na rota do jogador, Morador, Viajante, cachorro ou gato.
- Mantidos fora da praça central e do Marco de Senda.

## Arquivos alterados
- `src/scenes/PreloadScene.ts`
- `src/world/AmbientCityLife.ts`

## Novos assets
- `assets/images/characters/ambient/city_rat_gray.png`
- `assets/images/characters/ambient/city_rat_brown.png`
- `assets/images/characters/ambient/city_rat_dark.png`

---

## Documento original: AMBIENT_URBAN_TOUCHES_ROUND38.md

# Round 38 — Ambientação urbana extra (aves urbanas + microvida da cidade)

## Objetivo
Adicionar mais um pequeno nível de vida urbana visual em **Cidade de Aether**, sem criar novas interações, prompts, diálogos, colisões ou impacto nas rotas principais do jogador.

## Implementado

### 1) Ave urbana extra no telhado da taverna
- Um pássaro adicional foi posicionado no telhado da taverna.
- Ele alterna entre dois pontos próximos do telhado.
- Em repouso, usa animação de bicadas/observação.
- Na troca de posição, usa animação de voo curto.
- Serve como detalhe de ambientação visual para reforçar a sensação de cidade viva.

### 2) Ave urbana extra em cerca decorativa
- Um segundo pássaro adicional foi colocado sobre uma pequena cerca decorativa.
- Também alterna entre dois pontos próximos.
- Usa o mesmo comportamento de repouso + voo curto.
- Não interfere com circulação do player nem com os canteiros/plaza.

### 3) Microrefino de vida urbana sem interação
- Ambos os pássaros foram tratados como **ambient fauna**.
- Eles não possuem:
  - nome;
  - prompt;
  - tecla de ação;
  - diálogo;
  - quest;
  - colisão.
- Os tempos de espera são variáveis para evitar comportamento excessivamente mecânico.

## Arquivo alterado
- `src/world/AmbientCityLife.ts`

## Observações de design
- O pássaro do telhado ajuda a dar leitura vertical ao cenário.
- O pássaro da cerca reforça a ambientação do espaço urbano próximo à praça/taverna.
- Ambos reaproveitam o asset já existente `city_bird`, sem necessidade de novos sprites.
- As novas aves foram mantidas em escala e linguagem visual consistentes com os demais elementos ambientais já presentes (senhor alimentando aves, pássaros no chão, cachorro, gato e ratos).

---

## Documento original: BLACKSMITH_ASSET.md

# Ferreiro integrado

Asset: assets/images/characters/npcs/blacksmith.png
Sprite sheet: 5 frames x 4 direções
Frame: 128x160 px
Direções: baixo, cima, esquerda, direita

O WorldScene mantém o Ferreiro como NPC de diálogo, sem liberar serviços ainda.

---

## Documento original: BLACKSMITH_SHOP_INTEGRATION.md

Ferraria integrada com asset real.

Arquivos principais:
- assets/images/environment/buildings/blacksmith_shop.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- prédio da Ferraria adicionado à Cidade de Aether
- Ferreiro reposicionado em frente à ferraria
- colisão do prédio adicionada
- caminho da praça até a ferraria ajustado
- serviços do Ferreiro continuam bloqueados até a futura quest das ferramentas

---

## Documento original: CHICKEN_COOP_REFINEMENT_ROUND43.md

# Round 43 — Refinamento do galinheiro e do terreiro das galinhas

## Objetivo
Fazer um refino fino da área do galinheiro, aproximando visualmente as galinhas dele e enriquecendo o espaço com pequenos detalhes ambientais sem criar nova interação.

## Ajustes implementados

### 1) Reposicionamento do galinheiro
- posição anterior: `x: 418`, `y: 810`, `scale: 0.42`
- nova posição: `x: 432`, `y: 804`, `scale: 0.40`

### 2) Colisão revisada
A colisão continua apenas na base, mas foi refinada para combinar com a nova posição/escala:
- largura: `62`
- altura: `26`
- `offsetY: 11`

### 3) Quintal visual ao redor do galinheiro
Foi criado um pequeno conjunto decorativo em `WorldScene.ts` com:
- cercas floridas decorativas reaproveitadas do kit urbano;
- um pequeno comedouro de madeira;
- dois pequenos volumes baixos (caixotes/fardos);
- grãos espalhados próximos ao comedouro.

Tudo isso é puramente visual e não interfere na circulação.

### 4) Rotas das galinhas refinadas
Em `AmbientCityLife.ts` as rotas foram redesenhadas para:
- formar um pequeno terreiro em volta do galinheiro;
- manter as galinhas mais próximas do novo ponto focal;
- evitar a passagem principal do sul;
- preservar a coerência de escala com a fauna urbana.

## Arquivos alterados
- `src/scenes/WorldScene.ts`
- `src/world/AmbientCityLife.ts`
- `CHICKEN_COOP_REFINEMENT_ROUND43.md`

## Resultado esperado
A área das galinhas passa a parecer um pequeno quintal orgânico da cidade, com o galinheiro servindo de âncora visual e as galinhas mais conectadas ao cenário.

---

## Documento original: CHICKEN_COOP_ROUND42.md

# Round 42 — Galinheiro integrado à cidade

## Objetivo
Adicionar um pequeno galinheiro ao setor residencial sudeste de Aether para dar mais contexto visual à presença das galinhas urbanas.

## Implementado
- novo asset `chicken_coop.png` adicionado em:
  - `assets/images/environment/city/props/chicken_coop.png`
- preload do novo asset em:
  - `src/scenes/PreloadScene.ts`
- posicionamento do galinheiro na cidade em:
  - `src/scenes/WorldScene.ts`

## Decisão de layout
O galinheiro foi colocado próximo à área das galinhas, no setor residencial sudeste, longe dos corredores principais e sem criar qualquer interação nova.

### Posição usada
- `x: 418`
- `y: 810`
- `scale: 0.42`

### Colisão
Foi aplicada uma colisão compacta apenas na base visual do galinheiro:
- largura: `66`
- altura: `28`
- offsetY: `12`

Isso preserva a leitura física do objeto sem bloquear o fluxo do jogador na cidade.

## Observações
- o galinheiro é apenas ambiental;
- não possui prompt de interação;
- serve como contexto visual para a fauna urbana já adicionada;
- mantém a linguagem visual medieval/isométrica da cidade.

---

## Documento original: CHICKEN_YARD_FINAL_POLISH_ROUND45.md

# Round 45 — Polimento final da área do galinheiro

## Objetivo
Aplicar um polimento visual final ao pequeno núcleo do galinheiro, mantendo o padrão estético do jogo e sem criar novas interações.

## O que foi implementado

### 1) Saco de ração
Foi adicionado um **saco de ração** pequeno próximo ao galinheiro.
- função: reforçar a leitura de espaço doméstico/rural;
- abordagem: elemento decorativo discreto, coerente com a escala local.

### 2) Marcas leves de palha/terra no chão
Foram adicionadas **marcas sutis de terra** e pequenos traços de **palha** no terreiro.
- função: quebrar a sensação de chão excessivamente limpo;
- resultado: a área parece mais usada e mais natural.

### 3) Pequeno poleiro/caixote rústico
Foi incluído um **micro poleiro/caixote** junto ao galinheiro.
- função: complementar o canto das aves com um apoio visual temático;
- abordagem: desenho simples usando primitivas, sem destoar do restante da arte.

### 4) Pequeno ajuste no espalhamento de grãos
O espalhamento de grãos foi levemente ampliado para conversar melhor com o saco de ração e com a atividade das aves.

## Arquivo alterado
- `src/scenes/WorldScene.ts`

## Observações
- Nenhum desses elementos possui interação.
- Não foram adicionadas colisões extras.
- O objetivo foi apenas **polir visualmente** a área do galinheiro.

---

## Documento original: CHICKS_AND_THEMED_MICRO_FENCE_ROUND44.md

# Round 44 — Pintinhos e micro cerca temática do galinheiro

## Objetivo
Enriquecer a área do galinheiro com dois detalhes adicionais pedidos:
- 1 ou 2 pintinhos perto do galinheiro;
- uma micro cerca mais temática, no mesmo padrão visual do jogo.

## O que foi implementado

### 1) Dois pintinhos ambientados
Em `src/world/AmbientCityLife.ts` foram adicionados **2 pintinhos** próximos ao galinheiro.

#### Abordagem visual
Para manter o padrão estético do projeto:
- os pintinhos **reaproveitam o mesmo sprite-base das galinhas**;
- foram configurados com **escala menor**;
- utilizam **rotas curtinhas e compactas** perto do galinheiro;
- mantêm comportamento puramente ambiental, sem interação.

#### Resultado
A área agora transmite melhor a leitura de um pequeno núcleo doméstico/rural dentro da cidade, sem quebrar o estilo pixel art já existente.

### 2) Micro cerca temática
Em `src/scenes/WorldScene.ts`, o bloco `chickenYardAccent(...)` foi retrabalhado.

#### Antes
- cerca sugerida apenas com elementos decorativos reaproveitados.

#### Agora
Foi desenhada uma **micro cerca rústica** com:
- postes de madeira;
- travessas horizontais;
- formato em **U** ao redor do galinheiro;
- pequena abertura frontal sugerindo um portão.

### 3) Detalhes adicionais do terreiro
Além da micro cerca, a área passou a ter:
- comedouro de madeira;
- pequeno bebedouro raso;
- fardos/caixotes decorativos;
- grãos espalhados no chão.

## Arquivos alterados
- `src/world/AmbientCityLife.ts`
- `src/scenes/WorldScene.ts`
- `CHICKS_AND_THEMED_MICRO_FENCE_ROUND44.md`

## Resultado esperado no jogo
A região do galinheiro fica mais coerente visualmente e mais viva, com:
- galinhas adultas circulando pelo terreiro;
- pintinhos pequenos próximos ao núcleo do galinheiro;
- cerca temática reforçando a ambientação rural leve dentro da cidade.

---

## Documento original: CITY_AMBIENT_VISUAL_CALIBRATION_ROUND52.md

# Round 52 — Calibração visual da fauna e do velhinho da Cidade de Aether

## Objetivo
Revisar escala e leitura visual dos elementos ambientais recém-refeitos para garantir que funcionem dentro da cidade com proporções coerentes entre si.

## Ajustes realizados

### Cachorro
- O novo desenho estava no estilo correto, porém ocupava pouco espaço dentro do frame 64×48.
- O spritesheet foi recalibrado para utilizar melhor o frame, mantendo as proporções do animal.
- A escala configurada no código (`.92`) foi preservada.

### Gato
- O novo desenho também ocupava pouco espaço útil do frame 64×48.
- O conteúdo visual foi ampliado dentro do próprio spritesheet para manter nitidez e proporção adequada no jogo.
- A escala configurada no código (`.90`) foi preservada.

### Pássaro
- O novo pássaro foi recalibrado dentro dos frames 32×24.
- Agora ele mantém leitura semelhante à dimensão visual anterior, mas com o novo padrão artístico.
- As escalas já usadas nos pássaros de chão, ombro e poleiros continuam válidas.

### Velhinho alimentando pássaros
- O spritesheet gerado incluía pássaros dentro das próprias poses.
- Como `AmbientCityLife` já possui pássaros independentes ao redor do velhinho, esses elementos embutidos gerariam duplicação.
- O asset foi limpo para manter apenas o personagem e sua animação de braço/postura.
- A escala `.78` foi mantida, pois o corpo exibido fica aproximadamente na mesma altura visual dos NPCs principais da cidade.

## Revisão de posicionamento
- Cachorro: rota sul continua livre e bem afastada dos principais colliders.
- Gato: rota oeste permanece sem conflito com construções ou circulação do jogador.
- Pássaros: poleiros e grupo do velhinho continuam coerentes com a arquitetura e props existentes.
- Velhinho: posição `(724, 584)` foi mantida. Ele permanece entre a área da erudita e a praça sem criar bloqueios físicos ou sobreposição crítica com NPCs.

## Arquivos alterados
- `assets/images/characters/ambient/city_dog.png`
- `assets/images/characters/ambient/city_cat.png`
- `assets/images/characters/ambient/city_bird.png`
- `assets/images/characters/ambient/elder_feeder.png`

---

## Documento original: CITY_GLOBAL_POLISH_ROUND46.md

# Round 46 — Polimento global da cidade

## Objetivo
Aplicar um **polimento visual global** em Cidade de Aether para reforçar a **coesão estética e artística** em todo o mapa, sem alterar a identidade central da cidade nem prejudicar circulação, colisões e leitura de gameplay.

## Direção artística aplicada
Foi reforçada uma linguagem visual unificada baseada em:
- **madeira quente** (placas, molduras, tapetes/soleiras visuais, pequenos caixotes);
- **pedra clara** (pequenos “aprons”/soleiras de pedra nas entradas);
- **vegetação contida** (floreiras e pequenos tufos de ervas);
- **tecidos pendentes discretos** (banners curtos em fachadas importantes);
- **desgaste leve de chão** (poeira/uso nas entradas e pontos de passagem);
- **profundidade suave** com sombras pequenas e detalhes não intrusivos.

## O que foi implementado

### 1) Fachadas principais padronizadas
As edificações centrais agora compartilham elementos visuais coerentes:
- mini **banners decorativos**;
- **soleiras/tapetes visuais** nas entradas;
- **floreiras** e/ou pequenos acentos laterais;
- leves **marcas de uso** no chão.

Edifícios contemplados:
- Loja do Mercador
- Ferraria
- Casa da Curandeira
- Taverna
- Casa Arcana / Erudita
- Oficina / Casa da Artesã
- Núcleo residencial (casas principais)

### 2) Entradas com leitura mais nobre
Os acessos mais importantes da cidade receberam leitura visual mais consistente:
- **Portão Sul** com tratamento visual mais integrado ao restante da cidade;
- **Portão Leste** com reforço decorativo sutil.

### 3) Coesão urbana nas ruas
Foram distribuídos pequenos refinamentos urbanos, como:
- tufos de vegetação baixa;
- poeira/desgaste leve em pontos estratégicos;
- pequenos acentos visuais com a mesma paleta do restante da cidade.

## Arquivo alterado
- `src/scenes/WorldScene.ts`

## Garantias do round
- **Sem novas interações**.
- **Sem bloqueios extras relevantes**.
- **Sem comprometer rotas, corredores ou acesso aos NPCs**.
- O foco foi **polimento visual e coesão artística global**.

---

## Documento original: CITY_GROUND_INTEGRATION.md

# City Ground — Round 20

'
Asset técnico: `assets/images/environment/city/city_ground.png`

'
- 320x160 px
- 10 colunas x 5 linhas
- 50 tiles
- 32x32 px por tile

'
WorldScene agora desenha:
- grama com variações dentro da cidade
- avenida horizontal até o Portão Leste
- avenida vertical até o Portão Sul
- praça central de pedra
- caminhos menores para os estabelecimentos

'
Nenhum portão, NPC, colisão ou sistema de combate foi removido.

---

## Documento original: CITY_STRUCTURES_INTEGRATION.md

Cidade de Aether — muros e portões integrados

Assets:
- city_wall_horizontal.png
- city_wall_vertical.png
- city_tower.png
- gate_east.png
- gate_south.png

O mapa mantém somente duas saídas: Portão Leste (lado direito) e Portão Sul (parte inferior). Não existe portão norte. As colisões anteriores foram preservadas e os retângulos amarelos de placeholder dos portões foram removidos.

---

## Documento original: COLLISION_CIRCULATION_AUDIT_ROUND32.md

# Round 32 — Collision & Circulation Audit

Overall static audit: **PASS**

## Static collider overlap check
- Non-intentional direct overlaps: **0**

## Player reachability (58×58 body, 29px obstacle expansion)
- Mercador: PASS
- Ferreiro: PASS
- Curandeira: PASS
- Taverneiro: PASS
- Erudita: PASS
- Artesã: PASS
- Elder Mira: PASS
- Guarda Leste: PASS
- Guarda Sul: PASS
- Marco de Senda: PASS
- Saída Leste: PASS
- Saída Sul: PASS
- Praça norte: PASS
- Praça sul: PASS

## NPC route clearance (12px safety margin)
- Morador: PASS
- Viajante: PASS

## Round 32 corrections
- Plaza bench/planter colliders reduced and redistributed to prevent chained collision walls.
- West-side cart moved to the commercial strip instead of the residential choke point.
- Tavern-side crate/barrel remain visual but no longer create physics blockers in the only southern-west passage.
- Lampposts were moved out of the Morador route and out of building footprints.
- Lower-right props were moved away from the blue residential footprint.
- Red residential collision footprint was reduced to remove overlap with the Artisan workshop.
- Notice board moved away from the main east-west avenue.
- East and south gate access remains reachable with the actual player body size.

---

## Documento original: COLLISION_PASS_ROUND30.md

# Round 30 — Collision pass

Correções realizadas sobre o Round 29:

- Marco de Senda recebeu collider estático compacto na base (Cidade e Floresta).
- Canteiros da praça receberam footprints físicos menores que a arte visual.
- Bancos da praça agora bloqueiam apenas pela base/assento.
- Postes decorativos da praça receberam colliders estreitos.
- NPCs fixos agora bloqueiam o jogador com colliders pequenos, mantendo a distância de interação confortável.
- Morador e Viajante permanecem sem collider físico, evitando empurrões e travamento de rotas.
- A rota do Viajante foi redesenhada para não cruzar a posição física da Erudita.
- Foram preservadas as colisões existentes de muros, portões, prédios, casas residenciais, poço e props das ruas.

Arquivos alterados:
- `src/scenes/WorldScene.ts`
- `src/world/Waystone.ts`

---

## Documento original: ELDER_FEEDER_STYLE_FIX_ROUND51.md

# Round 51 — Elder Feeder Style Fix

## Objective
Integrate the refined `elder_feeder` ambient sprite into the game so the bald old man feeding birds matches the same artistic and aesthetic standard already established by the rats, chickens, cat, dog, and bird assets.

## Changes Applied
- Replaced:
  - `assets/images/characters/ambient/elder_feeder.png`
- Preserved existing game integration:
  - `PreloadScene.ts` continues loading `elder_feeder` as a spritesheet with `frameWidth: 96` and `frameHeight: 112`
  - `AmbientCityLife.ts` keeps the same `elder-feed-birds` looping animation and in-world placement
- The new sheet preserves 4 frames in a horizontal strip and remains compatible with the current runtime configuration.

## Result
The elderly ambient NPC now has a more cohesive pixel-art appearance and visually fits the refined fauna set and the rest of the city ambience.

---

## Documento original: ELDER_FINAL_VISUAL_CLEANUP_ROUND53.md

# Round 53 — Elder Feeder Final Visual Cleanup Integration

## Objective
Integrate the final cleaned elder feeder sprite sheet into the city scene, preserving the existing behavior and keeping the visual language cohesive with the updated ambient fauna.

## What was changed
- Replaced `assets/images/characters/ambient/elder_feeder.png` with the final cleaned 4-frame sprite sheet.
- Kept the existing asset key, frame size, and animation hookup unchanged:
  - key: `elder_feeder`
  - frame size: `96x112`
  - animation: `elder-feed-birds`
- No gameplay logic changes were required.
- No collision, route, or NPC placement changes were made in this round.

## Result
- The elderly bird-feeding ambient character now uses the latest cleaned visual.
- The animated birds around him continue using the already unified `city_bird` style, preserving the city’s overall aesthetic consistency.

## Files affected
- `assets/images/characters/ambient/elder_feeder.png`

## Notes
- This is a visual integration pass only.
- Existing scene references in `PreloadScene.ts` and `AmbientCityLife.ts` remain compatible.

---

## Documento original: ELDER_MIRA_ASSET_INTEGRATION.md

Elder Mira integrada.

- Asset: assets/images/characters/npcs/elder_mira.png
- 640x640, 5x4, 128x160 por frame.
- Linha 1: baixo; linha 2: cima; linha 3: esquerda; linha 4: direita.
- PreloadScene.ts atualizado.
- WorldScene.ts aplica o sprite real em questNpc / Elder Mira.
- A integração anterior da Artesã também foi consolidada para não ser perdida.

---

## Documento original: FAUNA_STYLE_UNIFICATION_ROUND50.md

# Round 50 — Fauna Style Unification (Gato, Cachorro e Pássaro)

## Objetivo
Unificar visualmente os animais urbanos da cidade (`city_dog`, `city_cat` e `city_bird`) para que sigam o mesmo padrão artístico já estabelecido pelos ratos e galinhas.

## O que foi feito
- Substituídos os sprites de:
  - `assets/images/characters/ambient/city_dog.png`
  - `assets/images/characters/ambient/city_cat.png`
  - `assets/images/characters/ambient/city_bird.png`
- Mantidas as dimensões esperadas pelo jogo para evitar quebra de integração:
  - cachorro: `64x48` por frame
  - gato: `64x48` por frame
  - pássaro: `32x24` por frame
- Ajustadas as animações do pássaro em `src/world/AmbientCityLife.ts` para combinar melhor com o novo spritesheet:
  - `frame 0`: idle
  - `frame 1`: passo curto
  - `frame 2`: levantar asas
  - `frame 3`: bicar

## Arquivos alterados
- `assets/images/characters/ambient/city_dog.png`
- `assets/images/characters/ambient/city_cat.png`
- `assets/images/characters/ambient/city_bird.png`
- `src/world/AmbientCityLife.ts`

## Resultado
Agora o cachorro, o gato e o pássaro possuem:
- leitura visual mais próxima dos ratos e galinhas;
- melhor volume e sombreamento;
- silhueta mais coesa com o padrão do jogo;
- integração estética mais consistente com a cidade de Aether.

---

## Documento original: GUARD_ASSET_INTEGRATION.md

Guarda do Portão integrado.

Arquivos principais:
- assets/images/characters/npcs/guard.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- sprite real adicionado ao Guarda do Portão
- Guarda do Portão movido para o lado do portão leste
- Guarda do Sul reposicionado para o lado do portão sul, em vez de ficar no meio do portão

---

## Documento original: HEALER_ASSET_INTEGRATION.md

# Curandeira integrada

Asset: assets/images/characters/npcs/healer.png
Sprite sheet: 5x4, 128x160 por frame, transparente.
Direções: baixo, cima, esquerda, direita.
A Curandeira continua sem serviço de cura até a futura quest.

---

## Documento original: HEALER_HOUSE_INTEGRATION.md

Casa/Posto da Curandeira integrado ao Round 24.

Arquivos principais:
- assets/images/environment/buildings/healer_house.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- prédio real da Curandeira adicionado
- Curandeira posicionada em frente à entrada
- nome visual corrigido de Curandeiro para Curandeira
- colisão do prédio adicionada
- caminho de acesso ajustado
- cura continua bloqueada; diálogo/quest futura preservados

---

## Documento original: HEALER_SIZE_FIX.md

Curandeira corrigida para o mesmo padrão visual/tamanho do Mercador e Ferreiro.
Arquivo substituído: assets/images/characters/npcs/healer.png

---

## Documento original: HUD_GLOBAL_NOTES.md

HUD global patch: BottomActionBar and Minimap are screen-fixed; ControlsPanel uses depth 950; modal dialogue panels were moved above the hotbar. GreenWoodsScene, CaveScene and CastleScene now instantiate MapHud, so C, hotbar and minimap work there as well.

---

## Documento original: MERCHANT_ASSET_INTEGRATION.md

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

---

## Documento original: MERCHANT_SHOP_INTEGRATION.md

Loja do Mercador integrada com asset real.

Arquivos principais:
- assets/images/environment/buildings/merchant_shop.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- loja medieval do mercador com fundo transparente
- Mercador reposicionado em frente ao estabelecimento
- área de colisão adicionada para impedir atravessar o prédio
- caminho de acesso ajustado da praça até a loja

---

## Documento original: NPC_CIRCULATION_FIX.md

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

---

## Documento original: NPC_DIALOGUE_UI_ROUND34.md

# Round 34 — NPC Dialogue UI with Large Portraits

Implemented a new dynamic NPC conversation interface for Cidade de Aether.

## Interface
- Large ornate dialogue window using graphical UI assets instead of the old plain rectangle.
- Text/information area on the left.
- Large NPC portrait area on the right, extending above the dialogue body.
- NPC proper name + profession/role in the header.
- Visual footer buttons/keycaps for F, T and ESC.
- Darkened world backdrop while conversation is open.
- Smooth open/close and page-change animation.

## Dialogue behavior
- F advances through the NPC's dialogue pages.
- On the final page, F closes the conversation.
- ESC always closes the conversation.
- T is shown only when a real secondary action currently exists; Aldren Voss opens the shop with T.
- NPC movement/player movement remains paused while the dialogue is open.
- The old ChoiceDialogueBox remains available for non-NPC interactions such as the Waystone.

## Portrait support
Dedicated large portrait assets were integrated for:
- Aldren Voss — Mercador
- Borin Ferramão — Ferreiro
- Elara Veyn — Curandeira
- Garrick Brenn — Taverneiro
- Lysandra Vael — Erudita
- Maelis Tessara — Artesã
- Mira Edevane — Anciã de Aether
- Kael Dorn — Guarda do Portão Leste
- Bren Harrow — Guarda do Sul
- Tomas Belmon — Morador de Aether
- Darian Kestrel — Viajante

The panel also has a sprite fallback: if a dedicated portrait texture is absent, it can display the NPC's map sprite instead, so dialogue remains functional.

## Main files
- src/ui/NpcDialoguePanel.ts
- src/scenes/WorldScene.ts
- src/scenes/PreloadScene.ts
- src/npc/Npc.ts
- src/npc/WanderingNpc.ts
- assets/images/ui/dialogue/

---

## Documento original: NPC_INTERACTION_UI_ROUND33.md

# Round 33 — NPC Interaction UI + Character Names

## New interaction presentation
The old raw name / `F • Conversar` text was replaced by a themed RPG interaction panel.

Visual assets:
- `assets/images/ui/npc_interaction/npc_prompt_panel.png`
- `assets/images/ui/npc_interaction/keycap_f.png`
- `assets/images/ui/npc_interaction/keycap_t.png`
- `assets/images/ui/npc_interaction/icon_talk.png`
- `assets/images/ui/npc_interaction/icon_shop.png`

Behavior:
- panel fades/slides in only when the player is near the NPC;
- proper character name is shown in gold;
- occupation / function appears as a subtitle;
- F/T are shown with graphical keycaps;
- talking uses a speech icon;
- merchant shop uses a shop icon;
- roaming NPCs still pause and face the player when approached;
- dialogue titles now use the NPC's proper name.

## Cidade de Aether NPC names
- Aldren Voss — Mercador
- Borin Ferramão — Ferreiro
- Elara Veyn — Curandeira
- Garrick Brenn — Taverneiro
- Lysandra Vael — Erudita
- Maelis Tessara — Artesã
- Mira Edevane — Anciã de Aether
- Kael Dorn — Guarda do Portão Leste
- Bren Harrow — Guarda do Sul
- Tomas Belmon — Morador de Aether
- Darian Kestrel — Viajante

## Floresta NPC names
- Aren Valebosque — Ranger
- Edrin Halvek — Construtor da Ponte
- Professor Cael — Erudito das Ruínas

## Validation
- `tsc --noEmit`: PASS
- existing NPC interaction distance and collision logic retained;
- merchant remains the only NPC with the second `[T] Loja` action because that is the only secondary service currently implemented.

---

## Documento original: NPC_NAME_CORRECTION_ROUND35C.md

# Round 35C — Correção de nome no sistema de missões

- A missão **Eco da Floresta** agora usa `Mira Edevane` como `giver`.
- A referência funcional antiga `Elder Mira` foi removida do código-fonte.
- A chave técnica do sprite `elder_mira` foi mantida, pois é um identificador de asset e não o nome exibido do NPC.
- O comentário em `WorldScene.ts` também foi atualizado para `Mira Edevane`.

---

## Documento original: NPC_NATURAL_IDLE_ANIMATIONS_ROUND47.md

# Round 47 — Idles naturais dos NPCs

## Objetivo
Remover o comportamento artificial em que todos os NPCs se viravam automaticamente para o jogador ao se aproximar e substituir isso por uma cidade mais viva, onde cada personagem parece ocupado com sua própria rotina.

## Mudança principal
- NPCs fixos **não acompanham mais o jogador com o olhar/direção**.
- Aproximar-se agora controla apenas a UI de interação.
- Cada NPC mantém uma orientação natural adequada à função/localização.
- Todos recebem um movimento-base de respiração extremamente sutil.

## Idles por NPC

### Aldren Voss — Mercador
- respiração sutil;
- pequeno gesto de contar/manusear moedas.

### Borin Ferramão — Ferreiro
- respiração sutil;
- movimento próprio com martelo;
- pequenas faíscas ocasionais para reforçar a leitura de trabalho na forja.

### Elara Veyn — Curandeira
- respiração sutil;
- manipulação de pequenas ervas/energia herbal.

### Garrick Brenn — Taverneiro
- respiração sutil;
- gesto de limpar/manusear uma caneca com pano.

### Lysandra Vael — Erudita
- mantém um pequeno livro aberto;
- movimento suave de leitura;
- animação ocasional de virar página.

### Maelis Tessara — Artesã
- pequeno tecido em mãos;
- gesto repetido de costura/manuseio de linha.

### Mira Edevane — Anciã de Aether
- postura calma com respiração sutil;
- pequeno brilho ocasional associado ao cajado;
- orientação fixa voltada para o interior da cidade, sem seguir o jogador.

### Kael Dorn — Guarda do Portão Leste
- permanece orientado para o Portão Leste;
- ajuste discreto de postura/peso;
- pequeno brilho ocasional na arma/armadura.

### Bren Harrow — Guarda do Sul
- permanece orientado para o Portão Sul;
- ajuste discreto de postura/peso;
- pequeno brilho ocasional na arma/armadura.

### Tomas Belmon — Morador
- continua seguindo sua rota normalmente;
- não para apenas porque o jogador se aproximou;
- durante pausas da rota executa pequeno movimento de postura/respiração.

### Darian Kestrel — Viajante
- continua seguindo sua rota normalmente;
- não para apenas porque o jogador se aproximou;
- durante pausas da rota executa gesto de ajuste de equipamento/mochila.

## Conversa com NPCs ambulantes
Anteriormente, Tomas e Darian pausavam a rota assim que o jogador entrava na distância de interação.

No Round 47:
- proximidade não interrompe a caminhada;
- a rota só é pausada quando o jogador realmente abre o diálogo;
- ao fechar o diálogo, a caminhada é retomada automaticamente.

## Arquivos alterados
- `src/npc/Npc.ts`
- `src/npc/WanderingNpc.ts`
- `src/scenes/WorldScene.ts`

## Compatibilidade preservada
Não foram alterados:
- nomes dos NPCs;
- posições dos NPCs fixos;
- rotas principais de Tomas e Darian;
- colisões;
- diálogos;
- retratos;
- sistema de loja;
- quests;
- UI de interação;
- fauna/ambientação da cidade.

## Validação
- `tsc --noEmit`: aprovado sem erros.
- busca por `facePlayer`: resta apenas o método vazio de compatibilidade; nenhum NPC o executa automaticamente.

---

## Documento original: NPC_PORTRAIT_FIDELITY_ROUND35A.md

# Round 35A — Fidelidade dos Retratos dos NPCs

Esta atualização parte do Round 34 e substitui os retratos anteriores pelos retratos de alta resolução aprovados, alinhados aos sprites usados no mapa.

Retratos atualizados:
- Aldren Voss / Mercador — turbante vermelho, branco/vermelho/dourado e acessórios de mercador.
- Borin Ferramão / Ferreiro — coque, barba, avental de couro, luvas e ferramentas.
- Elara Veyn / Curandeira — roupa verde e branca, cajado/cristal e identidade herbalista.
- Garrick Brenn / Taverneiro — avental, caneca e aparência correspondente ao sprite.
- Lysandra Vael / Erudita — vestes azuis, livro e acessórios arcanos.
- Maelis Tessara / Artesã — roupa clara/verde, cachecol e ferramentas de costura.
- Mira Edevane / Anciã — cabelos grisalhos, manto verde, cajado/cristal azul.
- Kael Dorn / Guarda do Portão Leste — armadura de aço, tabardo azul e lança.
- Tomas Belmon / Morador — roupa civil marrom e branca, bolsa transversal.
- Darian Kestrel / Viajante — manto vermelho, equipamento de viagem e mochila.

Bren Harrow / Guarda do Sul mantém temporariamente o retrato específico já presente no Round 34, pois o conjunto aprovado desta rodada não contém um novo retrato correspondente ao sprite `south_guard`.

Integração:
- As chaves de preload e `portraitKey` foram mantidas, portanto nenhuma lógica de diálogo precisou ser alterada.
- As novas imagens foram preparadas para a proporção exata da área de retrato da `NpcDialoguePanel` e redimensionadas para 652×880 para manter boa qualidade sem carregar as imagens originais inteiras.
- Fallback por sprite permanece funcionando.

---

## Documento original: OUTSKIRTS_BASE_ART_KIT_ROUND54.md

# Round 54 — Kit Visual Base dos Arredores

## Objetivo
Começar a substituição dos placeholders gráficos dos Arredores da Cidade por assets próprios, preservando a mesma lógica de pixel art, cores terrosas, materiais e leitura isométrica/top-down usada em Cidade de Aether.

## Assets adicionados
Todos em `assets/images/environment/outskirts/`:

- `outskirts_dirt_path.png` — estrada/trilha de terra irregular.
- `outskirts_water_patch.png` — água com margem natural.
- `outskirts_rock_cluster.png` — conjunto de rochas com musgo.
- `outskirts_wood_bridge.png` — ponte rural de madeira.
- `outskirts_fence_segment.png` — segmento de cerca rural.
- `outskirts_reeds.png` — vegetação de margem/juncos.
- `outskirts_bush_cluster.png` — arbustos baixos.
- `outskirts_grass_patch.png` — detalhes de grama/solo.

## Integração no mapa
### Estradas
`stampPath()` agora utiliza `outskirts_dirt_path` em vez de elipses do Phaser.

### Riacho e lago
`waterNode()` agora usa `outskirts_water_patch` e recebeu juncos/arbustos em pontos de margem. As colisões do Round 49 foram preservadas.

### Pontes
As duas travessias oficiais do riacho agora usam o asset `outskirts_wood_bridge`.

### Rochas
Os afloramentos passaram a usar `outskirts_rock_cluster`, mantendo colliders compactos na base.

### Fazenda — cercas
Os currais passaram a usar segmentos gráficos de `outskirts_fence_segment`, mantendo as aberturas e colliders definidos no Round 49.

### Vegetação
Pontos de vegetação genérica foram substituídos/reforçados com `outskirts_grass_patch`, `outskirts_reeds` e `outskirts_bush_cluster`.

## Arquivos de código alterados
- `src/scenes/PreloadScene.ts`
- `src/scenes/WorldScene.ts`

## Validação
- `npx tsc --noEmit`: aprovado sem erros.
- A estrutura de colisões e circulação do Round 49 foi mantida.

## Próxima etapa sugerida
**Round 55 — Fazenda Definitiva dos Arredores**

Criar e integrar assets próprios para:
- casa rural;
- celeiro/depósito;
- carroça vazia;
- cavalo;
- vacas;
- porcos;
- trabalhadores rurais;
- plantação e pequenos equipamentos agrícolas.

---

## Documento original: OUTSKIRTS_COLLISION_CIRCULATION_ROUND49.md

# Round 49 — Auditoria de colisões e circulação dos Arredores

## Objetivo
Refinar colisões e circulação do mapa expandido dos Arredores da Cidade, levando em conta o corpo físico do jogador (`58x58 px`) e garantindo caminhos reais entre os principais pontos de interesse.

## Portões da Cidade
- **Portão Sul**: continua funcionando como saída para os Arredores e é a rota visual mais natural para a Fazenda.
- **Portão Leste**: continua como segunda saída oficial para os Arredores, preservando a estrutura da Cidade de Aether.

## Correções realizadas

### 1. Estrada ao redor do Lago do Salgueiro
No Round 48, a trilha principal passava visualmente pela área do lago.

No Round 49:
- a rota foi desviada para **contornar o lago pela parte sul**;
- foi criado um pequeno acesso secundário até a margem para exploração/contemplação;
- os colliders do lago foram refinados para impedir que o jogador atravesse o núcleo da água.

### 2. Riacho e pontes
- o núcleo do riacho agora possui colisão;
- foram preservadas duas travessias oficiais:
  - travessia do eixo que sai do **Portão Leste**;
  - travessia do eixo que vem do **Portão Sul**;
- ambas receberam leitura visual de ponte.

### 3. Curral e chiqueiro
Os grandes colliders internos do Round 48 foram removidos.

Agora a colisão acompanha as **bordas das cercas**, com entradas reais:
- curral das vacas: abertura frontal de aproximadamente **96 px**;
- chiqueiro: abertura frontal de aproximadamente **90 px**.

Isso permite entrar nos cercados sem atravessar visualmente as cercas.

### 4. Fazenda
- carroça recebeu collider compacto;
- cavalo permanece com collider pequeno;
- casa, galpão e galinheiro continuam sólidos;
- trabalhadores rurais mantêm colliders pequenos sem criar gargalos.

### 5. Caverna
- acesso ao prompt continua livre;
- foi criado um bloqueio discreto mais ao fundo da entrada para impedir que o personagem atravesse a arte da caverna;
- o comando **F - Entrar** foi corrigido para funcionar antes do comando genérico de conversa;
- a caverna continua bloqueada narrativamente, exibindo apenas a mensagem da futura missão.

### 6. Portal da Floresta
- as árvores laterais do portal passaram a ter colisões compactas;
- o corredor central do portal permanece livre;
- o retorno da `GreenWoodsScene` foi atualizado da antiga posição (`2420,380`) para a nova área do portal (`3780,650`), evitando reaparecimento em local incorreto.

## Auditoria de acessibilidade
Foi realizada uma verificação geométrica considerando uma margem equivalente à metade do corpo do jogador.

A partir do **Portão Sul** e do **Portão Leste**, todos os seguintes destinos permaneceram alcançáveis:
- Fazenda
- interior do curral
- interior do chiqueiro
- margem do Lago do Salgueiro
- Totens Musgosos
- Ruínas Antigas
- Boca da Caverna
- Portal da Floresta

## Arquivos alterados
- `src/scenes/WorldScene.ts`
- `src/scenes/GreenWoodsScene.ts`

## Validação
- `npx tsc --noEmit`: sem erros.

---

## Documento original: PLAZA_REFINEMENT.md

# Plaza Refinement - Round 28

Refinamentos aplicados à praça central de Aether:
- ampliação do desenho do piso com anéis visuais de pedra;
- eixo cerimonial ligando a praça ao Marco de Senda;
- adição de fonte/monumento central de baixo perfil;
- inclusão de canteiros, bancos e dois postes decorativos;
- reposicionamento leve de NPCs civis para reforçar o uso social da praça.

---

## Documento original: PLAZA_WELL_STREETS_REFINEMENT.md

# Plaza + Street Refinement — Round 28

## Praça central
- A antiga fonte geométrica foi substituída por um poço medieval próprio.
- O poço possui colisão e permanece no centro da praça.
- Bancos, canteiros e o eixo visual para o Marco de Senda foram preservados.

## Ruas
Foram adicionados os primeiros props urbanos extraídos do kit visual aprovado:
- postes de iluminação;
- caixas;
- barris;
- pilhas de lenha;
- floreiras/cercas baixas.

Os objetos foram distribuídos junto aos estabelecimentos e nos eixos principais sem bloquear as rotas da praça, Portão Leste e Portão Sul.

---

## Documento original: PROJECT_STRUCTURE.md

# Estrutura do projeto — 0.1.2

## Raiz
- index.html
- package.json
- tsconfig.json
- vite.config.ts

## Código
- src/main.ts
- src/config.ts
- src/abilities/
- src/audio/
- src/character/
- src/combat/
- src/entities/
- src/equipment/
- src/inventory/
- src/items/
- src/loot/
- src/npc/
- src/quests/
- src/save/
- src/scenes/
- src/shop/
- src/skills/
- src/ui/
- src/world/

## Arte
- assets/images/characters/player.png

---

## Documento original: README_TS_IMPORTS.md

# Import convention

The TypeScript source uses extensionless local imports, for example:

```ts
import { WorldScene } from './scenes/WorldScene';
import { Player } from '../entities/Player';
```

This is intentional for Vite + TypeScript with `moduleResolution: Bundler`.
Vite resolves the source `.ts` files and emits browser-ready JavaScript during the build.

---

## Documento original: RESIDENT_ASSET_INTEGRATION.md

Morador integrado.

Arquivos principais:
- assets/images/characters/npcs/resident.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts
- src/npc/WanderingNpc.ts

O Morador agora usa sprite real e, por ser WanderingNpc, também toca animação de caminhada enquanto se move.

---

## Documento original: RESIDENTIAL_HOUSES_INTEGRATION.md

# RESIDENTIAL HOUSES INTEGRATION

Round: 28 (complete)

This integration adds residential modular houses to the city of Aether using the approved house kit.

## Added assets
- `assets/images/environment/buildings/residential_house_red.png`
- `assets/images/environment/buildings/residential_house_blue.png`
- `assets/images/environment/buildings/residential_house_green.png`
- `assets/images/environment/buildings/residential_house_orange.png`

## Code changes
- `src/scenes/PreloadScene.ts`
  - Loads the four new residential house assets.
- `src/scenes/WorldScene.ts`
  - Places four residential houses inside the city safe area.
  - Adds invisible collision blocks for each house.

## Placement summary
- Northeast manor near the eastern district
- West-side cottage near the residential lane
- East residential townhouse near the lower square
- Southeast family house near the southern district

## Notes
- The houses are decorative/static for now.
- They already block movement correctly.
- They are compatible with the current Round 28 complete build.


## Visual redistribution update
- Residential houses were repositioned to create a clearer neighborhood layout.
- Added small service/cobblestone paths connecting the houses to the city flow.
- West side now has a smaller cottage cluster; east/southeast side forms the denser residential district.


## Refino de urbanismo
- Reorganizado o bairro residencial para formar um núcleo oeste e um quarteirão leste/sudeste.
- Criada uma malha de caminhos mais contínua ligando praça, waystone, tavern, scholar e residências.
- O Marco de Senda da cidade foi aproximado da área cívica central para destacar sua importância urbana.

---

## Documento original: ROUND48_OUTSKIRTS_EXPANSION.md

# Round 48 — Expansão visual dos Arredores da Cidade

## O que foi feito
- Ampliação do mapa de `WorldScene` para **4200 x 2400**.
- Expansão visual dos **Arredores da Cidade** mantendo a cidade original coesa.
- Novo layout com:
  - **Fazenda** com casa, galpão, coop, plantações, cercas, carroça e cavalo.
  - **Animais de ambientação** na fazenda: vacas, porcos, galinhas e cavalo.
  - **Dois trabalhadores rurais** como ambientação viva.
  - **Riacho sinuoso** e **lago** como marcos visuais do mapa.
  - **Formações rochosas** e afloramentos de pedra.
  - **Totens/estátuas antigas** com musgo.
  - **Ruínas antigas** para reforço de lore e exploração futura.
  - **Entrada de caverna** com prompt visual **"F - Entrar"**; por enquanto exibe mensagem de que a área ainda não está liberada.
  - **Portal da Floresta** reposicionado para o **extremo direito** do mapa, com aparência inspirada na floresta.
- Atualização do **HUD/Minimapa** com novo tamanho de mundo e novos marcadores.
- Redistribuição dos **spawn points** dos inimigos placeholder para o mapa expandido.
- Novos nomes de localidade no HUD:
  - Fazenda dos Arredores
  - Totens Musgosos
  - Ruínas Antigas
  - Lago do Salgueiro
  - Boca da Caverna
  - Portal da Floresta

## Observações
- Os monstros continuam como placeholder, conforme combinado.
- A caverna já possui presença visual e sinalização, mas ainda não leva a outra área.
- Os assets de alguns animais dos arredores foram resolvidos com **texturas geradas em runtime** para já viabilizar o layout e a leitura visual da área.

## Próximos passos sugeridos
1. Refinar **colisão e circulação** nos arredores após o seu teste.
2. Criar a **quest da fazenda** para liberar a taverna.
3. Implementar os **monstros próprios dos arredores**.
4. Abrir a **caverna** como primeira missão externa.
5. Refinar ainda mais lore visual com pontos menores de interesse e objetos colecionáveis.

---

## Documento original: ROUND55_DEFINITIVE_ROWAN_FARM.md

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

---

## Documento original: ROUND56_CITY_RECONSTRUCTION.md

# Round 56 — Reconstrução Integral da Cidade de Aether

## Base utilizada

O Round 56 foi aplicado sobre o pacote completo do **Round 55 — Fazenda Definitiva de Rowan**. A Fazenda de Rowan, o lago, as ruínas, a caverna inativa e o Portal da Floresta foram preservados.

## Nova fundação urbana

- área interna anterior: `1040 × 760 px`;
- nova área interna: `1400 × 1040 px`;
- aumento aproximado de área útil: **84%**;
- muralhas norte/oeste contínuas;
- única abertura leste no Portão Leste;
- única abertura sul no Portão Sul;
- corredores físicos dos dois portões mantidos livres.

## Planta e circulação

A cidade foi reconstruída sobre uma malha única de coordenadas:

- avenida Leste–Oeste;
- eixo Portão Sul–praça;
- rua de fachada do distrito norte;
- rua residencial sul;
- duas ruas laterais de serviço;
- praça oval com anel integralmente circulável;
- pátios próprios para comércio, ferraria, botica, taverna, erudita e artesã.

## Edifícios

Dez construções receberam lotes e footprints independentes:

1. Loja de Aldren;
2. Ferraria de Borin;
3. Botica de Elara;
4. casa residencial laranja;
5. Taverna de Garrick;
6. Casa de Lysandra;
7. Oficina de Maelis;
8. casa residencial vermelha;
9. casa residencial verde;
10. casa residencial azul.

Nenhum footprint ou retângulo visual de construção se sobrepõe a outro, e nenhuma construção fica fora das muralhas.

## Poço central

O antigo poço foi substituído por um asset próprio e mais detalhado:

- `assets/images/environment/city/props/city_well_round56.png`;
- pixel art isométrica/top-down;
- pedra, madeira e telhas vermelhas compatíveis com os edifícios da cidade;
- fundo transparente;
- collider compacto apenas na base.

## Profundidade e personagens

- jogador, NPCs, fauna, construções e props agora usam profundidade baseada na coordenada `Y` dentro da cidade;
- o jogador fica atrás da construção ao passar ao norte dela e à frente ao passar ao sul;
- footprints físicos impedem o jogador de entrar no corpo dos edifícios;
- NPCs oficiais mantêm o padrão de aproximadamente `64 px` de altura;
- o ancião ambiental foi reduzido para aproximadamente `65 px`, eliminando a diferença de escala;
- guardas foram colocados ao lado dos portões, fora das passagens;
- NPCs ambulantes continuam suas rotas e só pausam quando o diálogo é aberto.

## Fauna ambiental

- cão: rota própria no setor sul da praça;
- gato: rota própria junto à muralha oeste;
- galinhas e pintinhos: terreiro fechado e separado de edifícios;
- ratos: aparições abaixo da fachada da taverna;
- ancião e pássaros: recanto próprio no sudeste da praça;
- pássaros empoleirados: posições próprias na taverna e no galinheiro.

As rotas não atravessam retângulos visuais de edifícios.

## Compatibilidade com saves

Saves originados na planta antiga recebem migração única para o novo ponto seguro da cidade. Posições salvas nos Arredores, Floresta, Caverna e Castelo são preservadas.

## Arquivos alterados

- `src/scenes/WorldScene.ts`;
- `src/scenes/PreloadScene.ts`;
- `src/world/AmbientCityLife.ts`;
- `assets/images/environment/city/props/city_well_round56.png`;
- `package.json`;
- `package-lock.json`;
- `validate-city-round56.mjs`.

## Validação

- auditoria geométrica: `CITY_ROUND56_AUDIT_OK`;
- 10 edifícios verificados;
- 23 pontos/rotas de NPCs verificados;
- 22 pontos de fauna verificados;
- 2 corredores de portão verificados;
- `tsc --noEmit`: aprovado;
- build de produção do Vite: aprovado.

---

## Documento original: ROUND57_CITY_ART_AND_COLLISION_PASS.md

# Round 57 — Cidade, Arte e Colisões

## Objetivo

O Round 57 é uma revisão integral da Cidade de Aether construída sobre o Round 56. A Fazenda de Rowan e os demais Arredores permanecem preservados.

## Colisões e circulação

- o colisor do jogador agora ocupa somente os pés (`38 × 22` no sprite-base), eliminando bloqueios antecipados causados pela cabeça, capa e braços;
- construções, fonte, árvores, postes e objetos usam footprints compactos apoiados na base visual;
- as torres dos portões Leste e Sul possuem colisores próprios;
- somente o vão realmente desenhado em cada portão permanece atravessável;
- as muralhas receberam uma camada posterior contínua e sobreposição de `4 px` entre segmentos, removendo frestas verdes;
- os NPCs ambulantes percorrem ciclos fechados nas ruas e pausam apenas durante diálogo.

## Escala e animação dos personagens

- escala-base dos NPCs aumentada de `0.40` para `0.46`;
- NPCs principais usam escalas entre `0.46` e `0.50`, compatíveis com o jogador;
- Bren Harrow, guarda do Portão Sul, recebeu escala `0.50`;
- todos os NPCs fixos, incluindo Mira Edevane, iniciam olhando para a câmera;
- as ações ociosas agora usam somente quadros dos próprios sprites, sem objetos vetoriais fora do estilo;
- o velhinho recebeu compensação vertical individual por quadro, mantendo uma altura aparente constante;
- o morador ambiental duplicado foi removido;
- Tomas e Darian não interrompem mais suas rotas por ações ociosas.

## Fauna e galinheiro

- os ratos da taverna agora percorrem rotas fechadas e permanecem visíveis;
- o galinheiro foi transferido para um terreno cercado no sudoeste da cidade;
- galinhas e pintinhos permanecem dentro do terreiro e fora das ruas;
- cão, gato, pássaros e velhinho foram reposicionados para áreas sem conflito com fachadas ou circulação.

## Nova planta urbana

- rua comercial contínua diante de loja, ferraria, botica e taverna;
- ruas laterais conectam a erudita, a oficina, a praça e os bairros;
- postes de luz ocupam os intervalos entre estabelecimentos e seguem os eixos viários;
- quatro residências foram organizadas lado a lado no distrito sul, com altura visual uniforme;
- a casa laranja recebeu um asset limpo, sem fumaça, animais ou fragmentos soltos;
- placas com textos como `LOJA`, `FORJA`, `TAVERNA`, `BOTICA`, `ARCANA` e `OFICINA` foram removidas do mapa ativo.

## Praça e direção de arte

- o Marco de Senda ocupa exatamente o centro da praça;
- o poço foi removido da cena e substituído por uma fonte própria ao sul do marco;
- árvores urbanas em pixel art foram distribuídas nos canteiros e junto às muralhas;
- chão, grama e ruas agora derivam do mesmo atlas `city_ground`;
- elipses, placas e adereços procedurais que destoavam do conjunto foram substituídos por tiles e assets compatíveis;
- a renderização global usa pixel art, pixels arredondados e antialiasing desativado.

## Novos assets

- `assets/images/environment/city/props/city_fountain_round57.png`;
- `assets/images/environment/city/props/city_tree_round57.png`;
- `assets/images/environment/buildings/residential_house_orange_round57.png`.

Os arquivos anteriores foram preservados; o mapa ativo referencia somente as versões do Round 57.

## Compatibilidade com saves

Saves posicionados na cidade anterior recebem uma migração única para o ponto seguro do Portão Sul. Posições salvas fora da cidade são preservadas.

## Validação

- auditoria geométrica de 10 construções;
- auditoria de 30 posições e pontos de rota de NPCs;
- auditoria de 23 pontos de fauna;
- verificação dos dois corredores de portão;
- verificação da escala residencial, orientação dos NPCs, loop dos ratos, normalização do velhinho, ausência de placas e colisor do jogador;
- TypeScript sem emissão;
- build de produção do Vite.

---

## Documento original: ROUND58_CITY_FOUNDATION_PASS.md

# Round 58 — Fundação Visual da Cidade

## Base

O Round 58 foi construído sobre o Round 57, preservando a planta urbana, a Fazenda de Rowan e os demais Arredores. Esta revisão corrige os problemas observados em jogo na fundação visual da Cidade de Aether.

## Casa residencial verde

- o sprite estreito de `212 × 373 px` foi substituído por uma construção proporcional de `320 × 415 px`;
- telhado, paredes, porta, banner, plantas, iluminação e identidade verde foram preservados;
- a nova razão largura/altura elimina o aspecto verticalmente esticado;
- o footprint foi recalibrado para a base mais larga.

## Muralhas e colisões

- colisores norte, sul, leste e oeste foram movidos para a face interna visível dos muros;
- espessura física padronizada em `36 px`, com recuo de `18 px`;
- o jogador para antes de sobrepor a arte do muro superior ou inferior;
- a placa cinza opaca que aparecia atrás dos muros laterais foi removida;
- margens transparentes dos módulos horizontal e vertical foram aparadas;
- segmentos mantêm sobreposição visual, eliminando frestas verdes.

## Piso urbano contínuo

- o preenchimento antigo usava quadros de borda do atlas como se fossem piso, causando arcos e desenhos repetidos;
- a cidade agora possui uma textura contínua de pavimentação de `1400 × 1040 px`;
- ruas, praça e calçadas compartilham a mesma malha de pedras;
- jardins usam uma segunda textura contínua de grama, recortada somente nos lotes;
- a paleta foi aproximada à referência enviada: pedra quente em cinza e bege, juntas discretas e variação natural;
- não há reinício da textura em cada rua ou cruzamento.

## Portão Leste

- o antigo sprite lateral foi substituído por um módulo vertical transparente;
- a muralha corre no eixo norte–sul e o corredor de saída permanece no centro;
- torres superior e inferior enquadram a passagem;
- os colisores continuam bloqueando as torres e liberando somente o vão real.

## Galinheiro

- escala aumentada de `0.30` para `0.52`;
- terreno ampliado para `235 × 220 px`;
- cerca simples dos Arredores substituída por módulos urbanos de madeira, ferragens e base de pedra;
- cercas são compostas por segmentos, sem deformar um único sprite pela extensão inteira;
- galinhas e pintinhos receberam novas rotas dentro do terreno ampliado;
- a abertura frontal do cercado permanece livre.

## Velhinho e gato

- os quatro quadros do velhinho usam a mesma escala;
- o agachamento é estabilizado pela linha inferior real de cada quadro;
- foi removido o redimensionamento vertical que fazia o corpo subir durante a animação;
- o gato deixou a rota vertical junto ao muro oeste;
- sua nova rota é integralmente horizontal na rua diante do setor comercial.

## Nomes permanentes dos assets

Os assets ativos não contêm mais número de round no nome:

- `assets/images/environment/city/city_pavement.png`;
- `assets/images/environment/city/city_grass.png`;
- `assets/images/environment/city/gate_east.png`;
- `assets/images/environment/city/props/city_fountain.png`;
- `assets/images/environment/city/props/city_tree.png`;
- `assets/images/environment/city/props/city_chicken_fence.png`;
- `assets/images/environment/buildings/residential_house_green.png`;
- `assets/images/environment/buildings/residential_house_orange.png`.

O diretório `assets` foi auditado e não contém arquivos com `roundNN` no nome. O preload referencia somente os nomes permanentes.

## Validação

- TypeScript sem emissão: aprovado;
- build de produção Vite: aprovado;
- 90 referências de preload verificadas, sem arquivo ausente;
- 10 construções auditadas;
- 30 posições e pontos de rota de NPCs auditados;
- 23 pontos de fauna auditados;
- dois corredores de portão auditados;
- quatro residências com altura visual uniforme;
- revisão visual integral da cidade em `1560 × 1200 px`.

---

## Documento original: ROUND59_ISOMETRIC_PROTOTYPE.md

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

---

## Documento original: ROUND60_ISOMETRIC_CITY_CONVERSION.md

# Round 60 — Conversão oficial da Cidade de Aether

O protótipo aprovado no Round 59 tornou-se a cidade oficial da campanha. A cidade agora ocupa uma cena isométrica própria, enquanto os demais mapas continuam cartesianos e preservam sua jogabilidade atual.

## Resultado desta etapa

- cidade completa em projeção isométrica `2:1`, com grade lógica de `28×28` e módulo `96×48 px`;
- herói real da campanha visível desde o primeiro quadro, ancorado pelos pés e com profundidade dinâmica;
- NPCs urbanos ampliados em aproximadamente 30% em relação ao protótipo, todos olhando para frente quando parados;
- duas rotas contínuas para morador e viajante, percorridas em sentidos opostos sem cortar edifícios ou objetos;
- praça central com Marco de Senda, fonte, jardins, árvores e postes de luz;
- estabelecimentos e residências distribuídos ao redor de ruas contínuas;
- galinheiro legível, cercado e com passagem própria;
- gato em percurso horizontal, ratos em ciclos contínuos e velhinho ancorado pela base durante toda a animação;
- muralhas contínuas e dois portões verticais e realmente transitáveis: Leste e Sul;
- colisões calculadas na grade lógica, separadas do volume visual de telhados, torres e muralhas;
- migração automática dos saves anteriores que estavam dentro da antiga cidade plana.

## Integração com a campanha

Ao atravessar um portão, o jogo troca entre `AetherCityScene` e `WorldScene`. Os Arredores mantêm a Fazenda de Rowan, o lago, as ruínas, os totens, a caverna e a passagem para a Floresta. Interiores residenciais retornam diretamente à nova cidade.

Os dados do jogador, classe, habilidades, inventário, equipamentos, missões e posições dos demais mapas continuam no mesmo save. A nova posição urbana é salva também nas coordenadas lógicas `u/v`.

## Assets permanentes

Nenhum asset criado para a conversão contém número de round no nome. Os novos módulos oficiais são:

- `isometric_city_grass.png`;
- `isometric_city_pavement.png`;
- `isometric_city_wall.png`;
- `isometric_city_gate.png`;
- `isometric_city_gate_east.png`;
- `isometric_grass_patch.png`.

## Validação

```bash
npm run check
npm run validate:isometric-city
npm run build
```

A auditoria do Round 60 verifica assets, projeção, escala do herói e dos NPCs, footprints, corredores dos dois portões, circuitos dos NPCs ambulantes, transições de cena e migração de save.

---

## Documento original: ROUND61_ISOMETRIC_CITY_LAYOUT_FIX.md

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

---

## Documento original: ROUND62_ISOMETRIC_DEPTH_COLLISION_PASS.md

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

---

## Documento original: ROUND63_UNIVERSAL_OCCLUSION_ANIMATION_PASS.md

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

---

## Documento original: ROUND64_FAUNA_BUSINESS_IDENTITY_PASS.md

# Round 64 — Fauna 2,5D e identidade dos estabelecimentos

Este passe continua diretamente sobre o Round 63 e preserva a planta isométrica, as colisões por opacidade, o contorno dourado universal, as rotas dos atores e as transições pelos portões.

## Fauna urbana 2,5D

- Cão e gato foram redesenhados em perspectiva isométrica de três quartos.
- Ratos cinza, marrom e escuro usam um ciclo de corrida 2,5D com quatro quadros.
- Os pombos da praça usam quatro quadros de postura e bicada.
- Todas as folhas têm células, escala corporal e linha de chão constantes.
- O rato continua surgindo individualmente atrás da taverna, atravessando a área visível e sumindo novamente atrás dela.
- O galinheiro e as galinhas continuam fora da cidade.

## Identidade arquitetônica

- Mercado de Aldren: salão comercial aberto, toldos em camadas, balanças, moedas e mercadorias.
- Ferraria de Borin: a identidade já aprovada, com forja, bigorna, ferramentas e brilho do fogo, foi preservada.
- Botica e Estufa de Elara: botica de pedra integrada a uma estufa envidraçada de ervas.
- Grande Taverna de Garrick: hospedaria ampla em L, varanda, janelas do salão, barris e chaminé central.
- Arquivo de Lysandra: construção vertical com torre-observatório, astrolábio, biblioteca e varanda de leitura.
- Ateliê de Maelis: oficina assimétrica de tecelagem e tinturaria, com claraboias, tear, tecidos e materiais de trabalho.

Os cinco estabelecimentos refeitos não compartilham imagem-base nem dependem de simples recoloração. Todos mantêm a mesma câmera, iluminação quente, materiais medievais e acabamento 2,5D adotados na Cidade de Aether.

## Compatibilidade

- Os nomes dos assets permanecem estáveis e não contêm número de Round.
- A nova flag `cityRound64Migrated` preserva a continuidade dos saves.
- As dimensões de frame foram atualizadas no preload e nos dois controladores de fauna.
- A planta única continua alimentando imagem, profundidade, NPC de fachada e colisão.

## Validação

Execute:

```bash
npm run check
npm run build
npm run validate:isometric-city
node render-isometric-city-round64-qa.mjs
```

---

## Documento original: ROUND65_BLACKSMITH_IDENTITY_PASS.md

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

---

## Documento original: ROUND66_CITY_CONTACT_DEPTH_PASS.md

# Round 66 — Contato e Profundidade da Cidade

## Correções entregues

- A colisão dos quatro lados da muralha agora cobre a base visível inteira e usa um envelope contínuo, sem frestas entre módulos.
- Os dois corredores de portão permanecem livres, enquanto qualquer tentativa de entrar na pedra fora deles é bloqueada.
- Os módulos visuais de cada trecho do muro têm o mesmo comprimento, altura, sobreposição e alinhamento em pixels.
- O contorno dourado exige que a linha dos pés do jogador esteja atrás da linha de apoio do objeto; contato frontal não ativa mais o efeito.
- Aldren, Lysandra, Borin, Elara, Garrick e Maelis foram alinhados às entradas visíveis, entre 12 e 14 pixels à frente de suas fachadas.
- O ateliê de Maelis foi transferido para um lote a sudoeste da praça, fora da projeção da taverna e da botica.
- As rotas do morador, cachorro e gato foram recalculadas para o novo lote. O gato continua caminhando horizontalmente na tela.
- As seis folhas de ação profissional foram reconstruídas em quatro células de `256x256`, com proporção corporal e apoio dos pés estabilizados. Gestos altos conservam espaço para copo, martelo e cajado.
- Saves anteriores recebem margem segura em relação ao novo envelope dos muros.

## Verificação

```bash
npm run check
npm run validate:isometric-city
npm run build
```

A auditoria também produz e confere a planta em `ROUND66_CITY_VISUAL_QA.png`.

---

## Documento original: SCHOLAR_ASSET_INTEGRATION.md

Erudita integrada.
- Asset: assets/images/characters/npcs/scholar.png
- Adicionado preload em PreloadScene.ts
- WorldScene.ts atualizado para nome Erudita e sprite real.

---

## Documento original: SCHOLAR_HOUSE_INTEGRATION.md

Prédio da Erudita integrado ao projeto.

Arquivos principais:
- assets/images/environment/buildings/scholar_house.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- asset do prédio da Erudita com fundo transparente
- casa/biblioteca arcana posicionada na área urbana inferior direita
- Erudita reposicionada na frente da entrada
- colisão do prédio adicionada
- caminho da praça até o prédio estendido
- mantém o diálogo atual da Erudita

---

## Documento original: SHOP_SYSTEM.md

# Mercador — Loja Comprar/Vender

A loja agora possui duas colunas: Comprar e Vender.
- Comprar: reduz ouro e adiciona ao inventário.
- Vender: remove 1 item e paga 50% do valor.
- Itens de missão (Selo Real) não podem ser vendidos.
- T e Esc fecham a loja.
- O Mercador continua sendo o único NPC que abre a loja.

---

## Documento original: SOUTH_GUARD_ASSET_INTEGRATION.md

Guarda do Sul integrado.

Arquivos principais:
- assets/images/characters/npcs/south_guard.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- sprite real adicionado ao Guarda do Sul
- Guarda do Sul reposicionado ao lado do portão sul
- Mantido o Guarda do Portão Leste já integrado na versão anterior

---

## Documento original: SOUTH_GUARD_PORTRAIT_INTEGRATION_ROUND35B.md

# ROUND 35B — South Guard portrait fidelity integration

## Objective
Replace the South Guard dialogue portrait with a portrait that is visually grounded on the actual in-game `south_guard` sprite asset.

## What was integrated
- Replaced: `assets/images/ui/dialogue/portraits/portrait_bren.png`
- Kept existing wiring intact in code:
  - `WorldScene.ts` uses `portrait_bren` for **Bren Harrow**
  - `PreloadScene.ts` already preloads `portrait_bren`
- No logic changes were required.

## Result
When the player interacts with **Bren Harrow** (Guarda do Sul), the stylized dialogue window now displays a portrait aligned with the sprite sheet visual identity:
- dark-skinned young guard
- short curly black hair
- teal scarf/tabard
- silver armor
- teal shield with fortress emblem
- halberd / southern gate guard presentation

## Files changed
- `assets/images/ui/dialogue/portraits/portrait_bren.png`

## Compatibility
- Safe with Round 34 dialogue UI
- Safe with Round 35A portrait-fidelity structure
- No impact on collisions, NPC circulation, or interaction triggers

---

## Documento original: SOUTH_GUARD_PORTRAIT_REFINEMENT_ROUND35C.md

# Round 35C — Refinamento do retrato do Guarda do Sul

## Objetivo
Substituir o retrato do NPC **Bren Harrow** (Guarda do Sul) por uma versão refinada, coerente com o padrão visual dos demais retratos de NPCs do jogo.

## Alteração aplicada
- Arquivo atualizado:
  - `assets/images/ui/dialogue/portraits/portrait_bren.png`
- Base visual utilizada:
  - retrato refinado do guarda em verde e aço, alinhado ao sprite `south_guard.png`
- Ajuste técnico:
  - retrato exportado no tamanho padrão do conjunto atual: **652x880 px**

## Resultado
O Guarda do Sul agora aparece na interface de diálogo com um retrato maior, mais consistente com os outros NPCs e visualmente alinhado ao asset usado no jogo.

---

## Documento original: STABILITY_0.1.4_ROUND2.md

# Legends of Aether — Stability Round 2

Correções:
- Opções/Sobre agora respeita quebras de linha reais.
- Inventário mostra nome, quantidade e raridade dos itens em cards visíveis.
- Pontos de atributos e botões de distribuição foram separados.
- Equipamentos ficam dentro do painel de equipamentos, com espaço em relação à aparência.
- Cidade segura ampliada.
- Adicionadas Taverneiro, Erudito e dois Guardas dos Portões.
- Arredores da cidade ampliados.
- Câmera com deadzone e deslocamento para manter o personagem fora da sobreposição da hotbar o máximo possível.
- Minimap local alterna entre CIDADE DE AETHER, ARREDORES DA CIDADE e PORTAL DA FLORESTA.
- Inimigos comuns têm respawn automático após 9 segundos em cidade, floresta, caverna e castelo.
- Mini-chefes/chefes não reaparecem automaticamente para preservar progressão.
- Pontos de atributos investidos são persistidos no save.

---

## Documento original: STABILITY_0.1.4.md

# Legends of Aether 0.1.4 – Stability Consolidation

This build consolidates the recent fixes:

- global HUD (hotbar, minimap, controls, pause, inventory, skills) on all gameplay maps
- world bounds on town/forest/cave/castle
- stable transition spawn points
- robust respawn in every map
- local map label
- merchant-only shop
- blacksmith and healer locked behind future quests
- NPC proximity prompts
- pause menu actions
- equipment unequip and inventory visibility fixes
- XP/attribute/skill display
- save/continue class persistence
- options/about/prologue retained

---

## Documento original: STABILITY_0.1.6_ROUND3.md

# Stability 0.1.6 Round 3

Fixes included:
- Options/Sobre scene rendered without relying on a stale modal implementation.
- Player texture is packaged and has a runtime fallback if the PNG is unavailable.
- Player animation uses the same texture key as the runtime player sprite.
- World/forest scene transitions use explicit scene changes and transitionSpawn.
- Latest WorldScene and GreenWoodsScene from 0.1.6 are retained.

---

## Documento original: STREET_DETAILING_PHASE2_AND_PLAZA_REFINEMENT.md

Round 31 — Street Detailing Phase 2 + Plaza Refinement

Implemented in WorldScene.ts:
- Added phase 2 street dressing for Cidade de Aether.
- Added carts (carroças) in non-critical circulation pockets.
- Added establishment signboards: Loja, Forja, Botica, Taverna, Arcana and Oficina.
- Added extra lampposts on primary avenues and secondary streets.
- Added more small fences / flower-fence props in residential/open areas.
- Rebalanced crate, barrel and log placement to reduce repetitive distribution.
- Added urban trees and shrubs in open corners and block edges.
- Added pebbles, herbs and wear patches along street edges and around circulation zones.
- Added a notice board near the plaza.
- Refined the plaza: integrated the well with a stone ring and loose stones, redistributed benches, expanded planters, preserved open circulation and kept the waystone approach readable.

Collision/circulation notes:
- New carts, trees, notice board, benches, planters, lampposts and fences use compact colliders when appropriate.
- Placards/signboards are decorative and do not obstruct the player.
- The open corridor between the plaza and the Waystone was preserved.
- Existing resident/traveler routes remain unobstructed by the new placement.

---

## Documento original: TAVERN_HOUSE_INTEGRATION.md

Taverna integrada ao projeto.

Arquivos principais:
- assets/images/environment/buildings/tavern_house.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

Mudanças:
- asset da taverna rústica com fundo transparente
- prédio adicionado na área urbana inferior esquerda
- Taverneiro reposicionado na frente da entrada
- colisão do prédio adicionada
- caminho de acesso estendido da praça até a taverna
- diálogo permanece indicando que a taverna está fechada por falta de suprimentos

---

## Documento original: TAVERNKEEPER_ASSET_INTEGRATION.md

Taverneiro integrado

- Asset: assets/images/characters/npcs/tavernkeeper.png
- Sprite sheet: 640x640
- Grid: 5x4
- Frame: 128x160
- Linhas: baixo, cima, esquerda, direita
- Comportamento atual preservado: taverna fechada por falta de alimentos e insumos.

Full-project consolidation also keeps the latest corrected assets for Merchant, Blacksmith, Healer, Scholar, and the current Npc.ts idle/look-at-player behavior.

---

## Documento original: TRAVELER_ASSET_INTEGRATION.md

Viajante integrada.

Arquivos principais:
- assets/images/characters/npcs/traveler.png
- src/scenes/PreloadScene.ts
- src/scenes/WorldScene.ts

A Viajante agora usa sprite real e, como WanderingNpc, utiliza animação de caminhada enquanto se move.

---

## Documento original: URBAN_MICROLIFE_ROUND39.md

# Round 39 — Microvida Urbana de Aether

## Objetivo
Adicionar pequenos acontecimentos ambientais à Cidade de Aether para aumentar a sensação de lugar habitado, sem transformar decoração em mecânica e sem interferir em colisões, NPCs ou rotas do jogador.

## Implementado

### Fumaça animada de chaminé
- Taverna: fumaça suave e intermitente.
- Casa da Erudita: fumaça menor e mais lenta.
- Os puffs se dissipam automaticamente e não acumulam objetos permanentes.

### Panos e bandeirolas urbanos
- Dois pequenos varais decorativos foram adicionados em áreas secundárias.
- Os panos balançam levemente com tempos diferentes.
- São puramente visuais e não possuem collider.

### Morador varrendo
- Um morador ambiental foi colocado no setor residencial leste.
- Ele varre continuamente com uma vassoura animada e pequenas partículas de poeira.
- Não pertence ao sistema `Npc` e portanto não possui nome, prompt, diálogo ou quest.
- Não possui collider.

### Galinhas
- Três galinhas circulam em uma pequena área próxima à oficina/residências.
- Elas caminham lentamente, param e ciscam o chão.
- Possuem tempos e rotas diferentes para evitar sincronização artificial.
- Não possuem interação, nome, prompt, quest ou collider.

## Integração técnica
Arquivo principal:
- `src/world/AmbientCityLife.ts`

Não foi necessário alterar o preload: as galinhas são geradas como pequenas texturas pixeladas em runtime, preservando o pacote leve e evitando dependência de novos arquivos externos.

## Compatibilidade
- Mantém cachorro, gato, senhor alimentando pássaros e aves do Round 36.
- Mantém ratos da taverna do Round 37.
- Mantém aves urbanas do Round 38.
- Não altera colisões dos Rounds 30/32.
- Não altera a UI de interação ou diálogo dos NPCs.

---

## Documento original: WAYSTONE_INTEGRATION.md

# WAYSTONE INTEGRATION

Arquivos adicionados/alterados neste patch:

- `assets/images/environment/world/waystone_dormant.png`
- `src/world/Waystone.ts`
- `src/scenes/PreloadScene.ts`

## Resultado
- O Marco de Senda agora usa o novo asset visual `monumento_arcano_adormecido` em versão desativada.
- O marco continua presente na Cidade de Aether e na Floresta.
- A mensagem permanece indicando que o sistema de teletransporte ainda não foi ativado.
- Caso o asset não carregue por algum motivo, o código mantém um fallback visual simples para evitar quebra.

---

