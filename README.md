# Legends of Aether — v0.3.1 Round 33

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
