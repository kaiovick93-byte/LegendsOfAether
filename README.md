# Legends of Aether — v0.3.1 Round 36

## Base exclusiva
`legends-of-aether-v0.3.1-round35-minimapa-circular-base-round34.zip`.
SHA-256: `add5e6c96deacb2451e0ada8d9f2c1f2086f0938414554bf5fcd26d3df143ff4`.

## Diagnóstico
O WorldFogSystem era criado e atualizado corretamente. Entretanto, somente os
sete emissores da faixa ancestral verde estavam registrados: a cobertura sinistra
do prolongamento não possuía emissores. Na comparação do prolongamento, ligar ou
desligar a névoa da base produziu imagens idênticas, de dia e à noite.

Além disso, a multiplicação de densidade, intensidade diurna, formação e alfa
reduzia a opacidade dos sprites antigos a no máximo 2,71% no quadro medido, antes
da transparência da própria textura procedural. O polígono registrado servia
apenas como metadata e não limitava a área renderizada dos volumes.

## Correção exclusiva da névoa
- Registro da cobertura sinistra no mesmo WorldFogSystem, com emissores ancorados
  nas bases de árvores e raízes já existentes; nenhuma árvore foi alterada.
- Reutilização das seis texturas procedurais existentes, com opacidade calibrada
  para dia visível, aumento gradual ao entardecer e noite mais densa e fria.
- A intensidade lê a curva de névoa já existente, alimentada pelo WorldClock.
  Nenhum horário, velocidade, estado de tempo ou iluminação foi modificado.
- Movimento lento com fases, deriva e deformação independentes. As três camadas
  usam profundidades compatíveis com os tiles da floresta: fundo atrás da massa,
  camadas média/próxima acima dela, todas abaixo dos atores e da iluminação.
- Dissipação gradual do volume inteiro ao aproximar-se do contorno aprovado ou
  do corredor da estrada. A checagem considera o retângulo completo do sprite,
  sua rotação, deformação e deriva; não produz borda recortada ou película global.
- A zona antiga da faixa verde conserva seus emissores e parâmetros anteriores.
- Liberação dos emissores ao destruir a extensão ou reiniciar a cena.

## Arquivos alterados/adicionados
Alterados:
- `src/render/WorldFogSystem.ts` — visibilidade por zona, tonalidade noturna,
  profundidades e dissipação pela área completa dos volumes.
- `src/world/OldRoadAncientForestVisualExtension.ts` — registro e liberação da
  névoa dentro da cobertura sinistra existente.
- `README.md` — diagnóstico e registro desta entrega.

Adicionado:
- `tests/world-fog.test.mjs` — limites, corredor da estrada, transição de
  intensidade, independência do relógio, movimento e ciclo de vida.

Nenhum asset adicionado, alterado ou removido. Os outros 415 arquivos da base
permanecem idênticos, incluindo HUD, minimapa, Quest Tracker, WorldClock,
iluminação, floresta, estrada, colisões, bounds, quests, gameplay e saves.

## Validação
- `npm run check` e `npm run build` aprovados.
- 22 testes aprovados: névoa, WorldClock e Quest Tracker.
- Jogo executado em Chromium/WebGL a 1920 × 1080; inspeção visual às 12:00,
  18:30 e 22:00, na entrada, no prolongamento e no interior da cobertura.
- Comparações da névoa ligada/desligada nos três períodos: efeito visível,
  zero pixels alterados fora da cobertura sinistra e zero sobre o corredor da estrada.
- Varredura de dois minutos de animação: 340.060 pontos dos retângulos de volumes
  visíveis verificados contra a cobertura e a estrada, sem violações.
- Animação confirmada pela atualização normal da cena e por quadros em instantes
  diferentes; estrada e personagem continuam legíveis.
- Reinício da cena destrói os volumes antigos e recria cada zona uma única vez.
- Dados da floresta, estrada, texturas e emissores verdes comparados com a base.
- Console sem erros durante as verificações.

---

# Histórico — v0.3.1 Round 35

## Base exclusiva
`legends-of-aether-v0.3.1-round34-floresta-sinistra-base-round33.zip`.
SHA-256: `ca0892e8113f4bb7267c5ef2e8e715f480f8feb5933a54872764cb228a5b249e`.

## Escopo
Substituição somente da apresentação do minimapa pela moldura circular enviada.
O conteúdo do mapa, a estrada representada, o jogador e os marcadores existentes
continuam vindo do mesmo sistema do Round 34. Nenhum mapa ilustrado ou POI foi criado.

- Máscara circular real (`GeometryMask` / stencil) aplicada ao conteúdo e a todos
  os marcadores. Não há imagens pretas cobrindo os cantos.
- A janela original de 216 × 162, o zoom 3,25, a projeção, o recorte e a atualização
  dos marcadores permanecem iguais. A apresentação apenas recorta essa janela em círculo.
- `normalized`, `pointOnMap`, `update`, `markerAllowed` e
  `refreshMarkerVisibility` permanecem idênticos aos métodos da base.
- O jogador conserva o marcador, a orientação e o comportamento de centralização
  ou limitação do recorte nas bordas do mapa. A bússola permanece fixa no norte.
- Moldura com 220 px de largura, escala uniforme e sem deformação em 1920 × 1080.
  A placa encaixa sobre o ornamento inferior e termina antes do tracker existente.
- O nome completo da região é recebido pelo fluxo já existente
  `MapHud.setLocalName` / `AetherTerritory.getLocalName`. Não foi necessária
  metadata nova; nenhum nome de região foi fixado no componente ou no PNG.
- Texto marfim, serifado, centralizado, com sombra discreta e quebra de linha.
- Ordem: mapa/conteúdo, marcadores, moldura, bússola, placa e texto da região.
- A máscara acompanha o redimensionamento da HUD e é liberada ao encerrar a cena.
- Os três PNGs enviados são preservados byte a byte. Frames de textura selecionam
  apenas a arte útil, excluindo margens de exportação e o fragmento solto à direita
  da bússola; os ornamentos não foram redesenhados.

Relógio, Quest Tracker, barra inferior, HP/Mana, mapas, estrada, florestas,
iluminação, câmera, coordenadas, movimentação, colisões, bounds, quests, triggers,
WorldClock e save/load permanecem sem alteração.

## Arquivos alterados
- `README.md` — registro desta entrega.
- `src/ui/Minimap.ts` — apresentação circular, assets, máscara e nome na placa.
- `src/scenes/PreloadScene.ts` — importação e carregamento dos três assets.

## Assets adicionados
Pasta: `assets/images/ui/hud/minimap/`.

- `minimapa_moldura.png`
- `minimapa_bussola_n.png`
- `minimapa_placa_regiao.png`

São as cópias originais dos anexos com sufixo `(1)`, usando os nomes solicitados
no projeto. Nenhum arquivo removido.

## Validação
- `npm run check` e `npm run build`.
- 19 testes existentes de relógio e Quest Tracker aprovados.
- Jogo real em Chromium: estrada, centro da cidade e setor residencial; nomes
  dinâmicos completos; movimentação por teclado e oito orientações do jogador.
- Comparação com o Round 34: demais elementos da HUD, câmera, posição inicial,
  estrada, floresta, estados de quests e prólogo idênticos.
- Verificação visual em 1920 × 1080 e redimensionamento em 1366 × 768,
  1280 × 720 e 1024 × 768, sem sobreposição com o Quest Tracker.
- Teste do recorte com moldura e placa ocultas: 20.416 pixels do conteúdo visíveis,
  nenhum fora do círculo. A geometria da máscara permanece independente da arte.
- Abrir/fechar o mapa completo preserva o estado e a visibilidade do minimapa;
  reiniciar a cena libera a máscara anterior e cria apenas um minimapa novo.
- Console sem erros durante as verificações.

---

# Histórico — v0.3.1 Round 34

## Base exclusiva
`legends-of-aether-v0.3.1-round33-quest-tracker-base-round32.zip`.
SHA-256: `ef3fd1a55aff25a738411e22c7ada1cb89de222d2d6ab2c472cb731eceb6ac4e`.

## Escopo e composição
Reconstrução exclusivamente visual da Floresta Sinistra ao redor do prolongamento
existente da Estrada Velha, seguindo `floresta_sinistra_na_estrada_de_aether.png`.
A referência não foi adicionada ao jogo.

- A muralha forma a cobertura principal sobreposta; árvores maiores criam profundidade.
- Raízes, espinhos e folhas ligam essa cobertura à margem da estrada.
- Teias ficam presas à vegetação; mata com cogumelos aparece em apenas dois detalhes.
- A sequência repetitiva de raízes grandes foi reduzida após inspeção no jogo.
- Cada peça preserva sua proporção, com escala uniforme, flip horizontal e pequenas rotações.
- A composição é montada uma vez em texturas de até 1024 × 1024 px. Não há reconstrução por frame.
- O recorte por pixel mantém toda a nova arte dentro da cobertura aprovada e a mais de 66 px da linha central original da estrada.
- As antigas árvores isoladas da extensão foram substituídas pela massa contínua.
  A floresta verde, implementada separadamente, permanece intacta.

Nenhuma alteração em posição, direção, largura, módulos, curvas ou comprimento da
estrada. Chão/transições aprovados, placa, lanterna, escarpa, colisões, bounds,
triggers, navegação, quests, gameplay, iluminação global, WorldClock e HUD preservados.

## Arquivos alterados
- `README.md`
- `src/scenes/PreloadScene.ts` — carregar os quatro PNGs principais adicionados.
- `src/world/OldRoadAncientForestVisualExtension.ts` — construir/destruir a nova
  camada visual no lugar da antiga distribuição de árvores isoladas; atualizar
  somente seus metadados de diagnóstico.

## Arquivos adicionados
- `src/world/OldRoadSinisterForest.ts`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-forest/muralha_de_floresta_assombrada.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-forest/árvore_ancestral_na_floresta_assombrada.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-forest/teia_nebulosa_em_galhos_retorcidos.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/sinister-forest/mata_decomposta_com_raízes_e_cogumelos.png`

Nenhum arquivo removido. Os quatro PNGs adicionados conservam os bytes originais.
Todos os demais arquivos e assets do Round 33 permanecem idênticos.

## Assets usados na composição
Caminhos relativos a `assets/images/environment/outskirts/old-road-ancient-forest/`:

| Asset solicitado | Arquivo no projeto |
| --- | --- |
| `muralha_de_floresta_assombrada.png` | `sinister-forest/muralha_de_floresta_assombrada.png` |
| `árvore_ancestral_na_floresta_assombrada.png` | `sinister-forest/árvore_ancestral_na_floresta_assombrada.png` |
| `raízes_retorcidas_da_floresta_assombrada.png` | `low-roadside/raízes_retorcidas_da_floresta_assombrada.png` |
| `amontoado_de_raízes_e_espinhos_assombrados.png` | `low-roadside/amontoado_de_raízes_e_espinhos_assombrados.png` |
| `arbusto_espinhoso_ressecadoaco.png` | `low-roadside/arbusto_espinhoso_ressecadoaco.png` |
| `teia_antiga_entre_galhos_mortos.png` | `low-roadside/teia_antiga_entre_galhos_mortos.png` |
| `teia_nebulosa_em_galhos_retorcidos.png` | `sinister-forest/teia_nebulosa_em_galhos_retorcidos.png` |
| `montinho_de_folhas_secas_da_floresta.png` | `generated-ground/sinister_ground_leaf_pile_01.png` (versão já integrada) |
| `detritos_florestais_de_outono_em_transparência.png` | `generated-ground/sinister_ground_debris_01.png` (versão já integrada) |
| `mata_decomposta_com_raízes_e_cogumelos.png` | `sinister-forest/mata_decomposta_com_raízes_e_cogumelos.png` |

O chão aprovado continua usando, sem alteração, as folhas e detritos acima e:
- `generated-ground/sinister_ground_surface_dark_01.png`
- `generated-ground/sinister_ground_surface_wet_01.png`
- `generated-ground/sinister_ground_patch_swamp_01.png`
- `generated-ground/sinister_ground_twisted_roots_01.png`
- `generated-ground/sinister_ground_transition_grass_swamp_01.png`
- `generated-ground/sinister_ground_transition_forest_swamp_01.png`
- `generated-ground/sinister_ground_transition_road_swamp_01.png`

As árvores verdes e a transição verde mencionadas como inadequadas não foram
adicionadas à nova massa. Nenhuma imagem inteira de referência foi usada como cenário.

## Verificação
- TypeScript e build de produção aprovados.
- Os 19 testes existentes do Quest Tracker e WorldClock passaram.
- Inspeção visual em Chromium, 1920 × 1080: entrada, meio e extremidade do prolongamento,
  comparados à base e à referência; massa contínua e estrada visível.
- Dados da estrada, geometria aprovada, parâmetros do terreno, HUD, prólogo e quests
  comparados à base Round 33 sem diferenças.
- Conferência dos pixels finais: nenhuma arte nova dentro do corredor protegido
  ou fora da cobertura aprovada.
- Recolher/expandir o tracker preserva o progresso; reentrada da cena limpa e recria
  as texturas da floresta sem duplicações. Console sem erros.
- Comparação de bytes dos arquivos e integridade do ZIP verificadas antes da entrega.

---

# Histórico preservado — v0.3.1 Round 33

## Base exclusiva deste round
`legends-of-aether-v0.3.1-round32-relogio-dia-noite-base-round31.zip`.

## Integração mínima
Uma camada somente de leitura associa o objetivo fornecido por `syncObjective`
ao identificador `prologue`, ao nome definido em `questData.ts` e aos indicadores
de conclusão já existentes, entregando esses dados ao tracker da HUD.

Não foi necessário criar `trackedQuestId` nem modificar o formato de save:
o estágio atual do prólogo identifica automaticamente o objetivo exibido.
`QuestManager`, as três quests já cadastradas, os triggers e a progressão
permanecem intactos. Nenhum Diário de Quests ou seleção manual foi criado.

## Tracker visual
- Painel de 326 px, na mesma região à direita e abaixo do minimapa.
- Cabeçalho `Missões`, ícone da quest, nome e objetivo vindos dos dados.
- Texto com quebra automática e altura do painel calculada pelo conteúdo.
- Moldura composta por nove regiões: ornamentos com escala uniforme, apenas
  trechos retos e fundo ajustados para acomodar a altura.
- Botões `-` e `+` alteram somente a visibilidade do conteúdo do painel.
- Checkbox marcado somente quando o indicador existente daquele objetivo é
  verdadeiro. Concluir o prólogo não marca a nova instrução de falar com o
  General como concluída.
- Quatro PNGs originais preservados byte a byte; os recortes de exibição dos
  ícones/botões retiram apenas margens transparentes do arquivo exportado.

## Arquivos alterados neste round
- `README.md`
- `src/prologue/OldAetherPrologue.ts` — somente apresentação da HUD e passagem
  de um acesso de leitura ao estado; `syncObjective` e toda a lógica do prólogo
  permanecem iguais ao Round 32.
- `src/quests/questData.ts` — metadados visuais do prólogo, separados de `QUESTS`.
- `src/scenes/PreloadScene.ts` — carregar os quatro PNGs do tracker.

## Arquivos adicionados neste round
- `src/quests/PrologueTrackerState.ts`
- `src/ui/QuestTracker.ts`
- `tests/quest-tracker.test.mjs`
- `assets/images/ui/hud/quest-tracker/moldura_ornamental_de_rpg_fantasia.png`
- `assets/images/ui/hud/quest-tracker/ícone_dourado_de_missão_fantástica.png`
- `assets/images/ui/hud/quest-tracker/botão_ornado_de_minimizar.png`
- `assets/images/ui/hud/quest-tracker/botão_dourado_ornamental_com_símbolo_de_expansão.png`

Nenhum arquivo removido. Relógio, minimapa, barra inferior, HP/Mana, mapas,
floresta, estrada, colisões e demais sistemas preservados.

## Validação deste round
- `npm run check` e `npm run build`: aprovados.
- `node --test tests/quest-tracker.test.mjs`: seis testes aprovados.
- `npm run test:world-clock`: 13 testes aprovados.
- Chromium, jogo real em 1920×1080: nome e objetivo atuais, recolher/expandir
  por clique, quebra de linha, mudança de objetivo e checkbox após a ação de
  coleta existente. Nenhum erro no console ou de JavaScript.
- Recolher/expandir preservou exatamente o estado do prólogo, quests e save.
- Save sem `trackedQuestId` recarregado: objetivo detectado automaticamente,
  progresso, inventário, posição, quests e relógio preservados. Somente o
  `savedAt` foi atualizado pelo salvamento de entrada já existente na cena.
- Nome longo fornecido ao componente também quebrou linha dentro do painel.
- Conferência visual de ausência de sobreposição com minimapa e restante da HUD.
- Comparação de bytes com a base exclusiva e integridade do ZIP verificadas.

---

# Histórico preservado — v0.3.1 Round 32

## Base exclusiva deste round
`legends-of-aether-v0.3.1-round31-etapa2-refeita-base-round27.zip`.

## Escopo: somente o relógio da HUD
- Formato dinâmico: `[ícone] Dia X ◆ HH:MM`.
- Moldura fixa de 380 × 74,09 px em (22, 52), com escala uniforme.
- Ícone à esquerda e texto marfim com sombra à direita, ambos com posição fixa.
- A troca sol/lua usa `duskToDawnLightIntensity()` e o mesmo limiar visual
  `> .18` já utilizado pela lanterna de `OldRoadProps`. Não há novo calendário,
  cálculo de horário ou alteração do sistema de iluminação.
- O texto reutiliza `worldClock.format()`, trocando apenas o separador visual.
  Horas e minutos conservam dois dígitos; dia e horário continuam atualizando.
- Os três PNGs fornecidos foram copiados sem alterar seus bytes. Na exibição,
  recortes transparentes ocultam somente fragmentos desconectados que vieram
  nas extremidades dos arquivos de sol e moldura. Nenhum novo asset foi criado.

## Arquivos alterados neste round
- `README.md` — registro da entrega.
- `src/scenes/PreloadScene.ts` — carregar os três assets do relógio.
- `src/world/WorldClockRuntime.ts` — substituir apenas a apresentação e sua
  limpeza por `WorldClockHud`; avanço do tempo e condições de pausa intactos.
- `tests/world-clock.test.mjs` — adaptar o mock visual e validar ícones,
  transições, estabilidade da moldura/texto e atualização na virada do dia.

## Arquivos adicionados neste round
- `src/ui/WorldClockHud.ts`
- `assets/images/ui/hud/clock/relogio_moldura.png`
- `assets/images/ui/hud/clock/relogio_sol.png`
- `assets/images/ui/hud/clock/relogio_lua.png`

Nenhum arquivo removido. Todos os demais arquivos do Round 31 foram preservados,
incluindo `WorldClock.ts`, iluminação, minimapa, objetivo, barra inferior,
HP/Mana, quests, mapas, floresta, estrada, colisões, bounds e gameplay.

## Validação deste round
- `npm run check`: aprovado.
- `npm run build`: aprovado.
- `npm run test:world-clock`: 13 testes aprovados.
- Chromium, jogo real em 1920×1080: 12:07 diurno, 19:23/19:24 na transição,
  22:05 noturno, 05:43/05:44 no amanhecer, com ícones corretos e moldura/texto
  estáveis. Nenhum erro de console ou JavaScript durante o teste.
- Runtime real: `Dia 9 ◆ 23:59` → `Dia 10 ◆ 00:00` → `Dia 10 ◆ 00:01`,
  preservando três segundos reais por minuto de jogo e a pausa existente.
- Comparação da HUD antes/depois: 93 objetos externos ao relógio preservados.
  Desconsiderados apenas IDs aleatórios de texturas de texto e a fase de
  pulsação dos dois indicadores animados de jogador nos mapas.
- Comparação dos arquivos com o ZIP exclusivo e teste de integridade do ZIP.
- Inspeção visual concentrada em `AetherCityScene`; ciclo de troca entre as
  cinco cenas com relógio também coberto pelos testes automatizados existentes.

---

# Histórico preservado — v0.3.1 Round 31

## Base exclusiva
`legends-of-aether-v0.3.1-round27-ajuste-final-integracao-chao(1).zip`.
Nenhum código, composição ou distribuição dos Rounds 28/29/30 foi utilizado.

## Escopo: somente Etapa 2
Massa baixa contínua nas duas bordas da continuação visual da Estrada Velha.
Raízes, espinhos, galhos secos e folhas se sobrepõem numa composição consolidada
em uma única camada. A faixa fica mais densa voltada para a mata e mais leve
voltada para a estrada. Quatro teias pequenas entram como detalhe secundário.

O posicionamento acompanha os conectores originais da estrada. A camada nova
é limitada por pixel à cobertura aprovada do Round 27 e deixa livre toda a
largura das imagens da estrada, inclusive suas margens. Não há props novos
espalhados pelo interior da floresta. Escala, rotação, espelhamento e ordem de
sobreposição variam para misturar as peças. Os PNGs originais não foram editados.

A Etapa 1 permanece intacta. As árvores que já existiam no Round 27 também
permanecem intactas; nenhuma árvore foi adicionada. A Etapa 3 não foi iniciada.

## Arquivos alterados
- `src/scenes/PreloadScene.ts` — carregar os quatro PNGs necessários que não estavam no ZIP; reutilizar a textura de folhas já carregada.
- `src/world/OldRoadAncientForestVisualExtension.ts`
  — somente importar, construir e destruir a camada independente da Etapa 2.
- `README.md` — registro desta entrega.

## Arquivos adicionados
- `src/world/OldRoadSinisterRoadside.ts`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/raízes_retorcidas_da_floresta_assombrada.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/teia_antiga_entre_galhos_mortos.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/arbusto_espinhoso_ressecadoaco.png`
- `assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/amontoado_de_raízes_e_espinhos_assombrados.png`

Nenhum arquivo foi removido.

## Os cinco assets utilizados
Os quatro PNGs adicionados acima são as imagens originais de raízes baixas,
teia, arbusto espinhoso e amontoado de raízes/espinhos, copiadas sem edição.
O `montinho_de_folhas_secas_da_floresta.png` é reutilizado pela versão já
presente no Round 27:
`assets/images/environment/outskirts/old-road-ancient-forest/generated-ground/sinister_ground_leaf_pile_01.png`.
Nenhum sexto asset é usado na camada da Etapa 2.

## Regras preservadas
- Chão e transições aprovados na Etapa 1 do Round 27.
- Posição, largura, escala, rotação e conectores da estrada.
- Floresta verde e árvores existentes.
- Colisões, bounds, navegação, triggers, quests e gameplay.
- Geometria aprovada do Round 13, já presente no Round 27.

## Verificação
- `npm run check` e `npm run build`: aprovados.
- Jogo renderizado em Chromium: inspeção do conjunto, entrada, meio e final da estrada.
- Comparação com o Round 27: os 56 elementos de chão, 245 detalhes de solo das
  bordas, 121 árvores existentes e sete módulos da estrada mantêm os mesmos
  parâmetros visuais. Identificadores aleatórios de texturas internas do Phaser
  são desconsiderados nessa comparação.
- `node --test tests/*.test.mjs`: 18 testes aprovados e oito falhas na suíte
  de muralhas. As mesmas oito falhas foram reproduzidas no ZIP Round 27 intacto:
  a simulação de texturas dessa suíte lança `getSourceImage` sobre uma textura
  ausente. Esses testes e os sistemas de muralhas não foram alterados.
- ZIP conferido por comparação de conteúdo com a base e teste de integridade.
