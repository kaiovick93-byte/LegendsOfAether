# Legends of Aether — v0.3.2-round03 — E — Coletar

Implementação exclusiva do painel contextual da Caixa de Suprimentos do prólogo e das poções coletáveis existentes, compartilhando a apresentação do F — Examinar.

## Base utilizada

`legends-of-aether-v0.3.2-round02-f-examinar-base-round01.zip`

SHA-256: `84501ce5b2407fad748556e31599160f95322b4a2464650617d456372ab4fb68`

O Round02 contém o F — Examinar e continua o Round01, derivado do Round39. A comparação com seus 427 arquivos encontrou quatro arquivos existentes alterados, descritos abaixo. Os outros 423 arquivos permanecem idênticos byte a byte. Nenhum arquivo original foi removido e nenhum asset foi criado, alterado ou removido.

## Arquivos alterados

1. `src/ui/ExamineInteractionPanel.ts` — adaptador dos dois alvos F para a apresentação compartilhada; preserva os assets exportados, nomes dos componentes, aparência, estado de ativação e interação.
2. `src/ui/MapHud.ts` — criação e destruição do painel de coleta junto da HUD existente. A captura de E e seus encaminhamentos não foram modificados.
3. `src/prologue/OldAetherPrologue.ts` — acrescenta sprite, nome e ícone ao alvo de suprimentos já existente; oculta o aviso antigo quando o painel contextual apresenta esse alvo. Condições de disponibilidade e alcance mantidas.
4. `src/loot/LootManager.ts` — expõe a seleção já usada por `collectNear` para a apresentação consultá-la. A mesma seleção é compartilhada, sem mudar ordem, distância, inventário ou remoção do drop.

## Arquivos adicionados

1. `src/ui/ContextualInteractionPanel.ts` — apresentação compartilhada de moldura, ícone, tecla e textos; posicionamento e ocultação.
2. `src/ui/CollectInteractionPanel.ts` — adaptação somente da caixa e dos identificadores existentes `healing_potion` e `mana_potion`.
3. `RELATORIO_v0.3.2-round03.md` — este relatório.

## Assets reutilizados

Os três ícones foram inspecionados antes da implementação. A caixa original representa suprimentos; os ícones originais da HUD representam as poções vermelha e azul. Todos são utilizados sem edição, recorte ou recoloração e com escala uniforme.

| Uso | Arquivo existente | Textura existente |
| --- | --- | --- |
| Caixa de Suprimentos | `assets/images/environment/city/props/street_crates.png` | `street_crates` |
| Poção de Vida | `assets/images/ui/hud/actions/healing.png` | `hud_action_healing` |
| Poção de Mana | `assets/images/ui/hud/actions/mana.png` | `hud_action_mana` |
| Moldura dourada | `assets/images/ui/interaction/examinar/interacao_moldura_dourada.png` | `interacao_moldura_dourada` |
| Fundo da tecla | `assets/images/ui/interaction/examinar/interacao_tecla_vazia.png` | `interacao_tecla_vazia` |

Os quatro PNGs do Examinar continuam em `assets/images/ui/interaction/examinar/`, inclusive a moldura azul e o olho dourado. Não foi necessário adicionar arquivos de imagem nem alterar o carregamento.

O item `healing_potion` tem o nome “Poção de Cura” no catálogo e “Poção de Vida” na HUD existente. O novo painel usa “Poção de Vida”, conforme solicitado e já usado na HUD, sem renomear o item no catálogo, inventário ou drop. `mana_potion` conserva o nome “Poção de Mana” lido do catálogo.

Hashes dos ícones preservados:

- `street_crates.png`: `bbb793b564e6da3b262cacd9370a587e56d71d1d110aa2607bf898b2e288c306`
- `healing.png`: `b9dca8df6bb9cd078a507bd446c9e2f0a30303dab13bb708df069e2df661c1c1`
- `mana.png`: `28a59e747794aeda7710b8376f871e9491f1daadae8335255a0426573cdd54e6`

## Comportamento e preservação

- O painel usa moldura dourada, ícone do alvo à esquerda, E centralizado no fundo da tecla, “Coletar” em marfim e nome abaixo. Letras e textos são renderizados separadamente dos PNGs. A poção de vida tem nome vermelho; a de mana, azul.
- Caixa: consulta o alvo original do prólogo, sua etapa e seu alcance lógico de 1,0. O painel não chama a coleta e não escreve progresso. A interação continua concedendo a recompensa original de uma `healing_potion` e avançando para a orientação de poção pelo mesmo código.
- Poções: consulta o mesmo primeiro drop dentro de 36 pixels selecionado pela coleta existente. Não procura uma poção por trás de outro item que tenha prioridade na seleção. Não altera a ordem dos drops, probabilidades ou recompensas.
- A coleta de poções usa somente as cenas que já oferecem `collect()` e `LootManager.collectNear`, como GreenWoodsScene, CaveScene e CastleScene. Não foi acrescentada coleta de drops a AetherCityScene, cujo fluxo existente de E atende aos suprimentos do prólogo.
- Inventário cheio: a apresentação não contorna a capacidade. Se a coleta original falhar, o drop continua disponível e o painel permanece. Se houver espaço na pilha existente, a coleta original adiciona uma unidade e remove o drop. Os drops originais são unitários; não existe quantidade parcial a implementar nesse caminho.
- O painel oculta fora do alcance, sem alvo válido, após coleta, em diálogos, mapas e menus. Eventos de renderização são liberados ao encerrar a cena. Não foram adicionados listeners de teclado, áreas clicáveis ou chamadas extras de recompensa.
- A apresentação deriva do F aprovado e preserva sua fonte, hierarquia e proporções. Só o painel E pode reduzir sua escala uniformemente quando não há espaço livre no tamanho padrão, para acomodar a caixa sem cobrir a HUD ou o personagem. A política de escala e posicionamento do F permanece a mesma.
- Placa e Marco de Senda continuam com F, olho dourado e molduras originais. O azul continua lendo `waystone.ruinedExamined`; a apresentação não ativa o marco nem grava flags.
- Estrada, florestas, névoa, iluminação, WorldClock, minimapa, Quest Tracker, inventário, quests, diálogos, colisões, bounds e save/load não receberam alterações de código.

## Validação dentro do jogo

O jogo foi executado em Chromium, com teclado automatizado e renderização real. Foram aprovados **35 pontos de verificação: 24 na cidade/prólogo e 11 nas poções**. Nenhum erro de console ou exceção de página foi registrado nesses fluxos.

| Cenário | Resultado observado |
| --- | --- |
| Aproximar da caixa disponível | Painel E dourado, nome “Caixa de Suprimentos”, ícone original e aviso anterior oculto. |
| Afastar da caixa | Painel oculto fora do alcance existente. |
| Pressionar e manter E na caixa | Uma única poção de vida adicionada; mana e ouro preservados; etapa original e orientação de poção mantidas; caixa e painel desaparecem. |
| Repetir E após a caixa | Nenhuma recompensa duplicada. |
| Salvar e recarregar antes da coleta | Caixa e painel voltam disponíveis; ativação real do marco preservada. |
| Salvar e recarregar depois da coleta | Caixa continua ausente, sem nova recompensa. |
| Abrir e fechar o mapa perto da caixa | Painel oculta e retorna corretamente. |
| Caixa em 1280 × 720, 390 × 844 e 960 × 540 | Painel dentro da tela, escalas uniformes e sem interseção com personagem ou HUD nas posições testadas. |
| Aproximar de `healing_potion` e `mana_potion` reais | Ícones originais, E, “Coletar” e respectivos nomes/cores corretos. |
| Afastar das duas poções | Painel oculto fora do alcance original. |
| E com inventário cheio e sem pilha do item | Coleta bloqueada; inventário e drop preservados; painel permanece para ambos os tipos. |
| E com inventário cheio e pilha do item existente | Exatamente uma unidade adicionada à pilha; drop removido; painel oculto para ambos os tipos, inclusive mantendo E pressionado. |
| Sem drop válido e após sair/continuar a cena | Painel oculto, sem instância duplicada. |
| F na Placa da Estrada Velha | Moldura dourada e olho originais; exame abre uma vez e mantém o progresso existente; afastamento oculta o painel. |
| F no Marco de Senda não ativado | Moldura dourada; aproximação, E e abertura do diálogo não o ativam automaticamente. |
| Ativação pelo fluxo existente | Concluir o diálogo ativa o marco e muda a moldura para azul; F continua funcionando. |
| F após coletar a caixa e recarregar o save | Marco continua azul e funcional; placa continua dourada e funcional. |

Para reduzir o tempo de deslocamento, os testes posicionaram o personagem em pontos livres próximos aos objetos. Placa, combate do prólogo, diálogo do marco e passagem pelo trigger da estrada seguiram as interações e condições originais; flags de ativação e etapas não foram forçadas. Os saves usados nas recargas foram produzidos pelo fluxo do próprio jogo.

As duas poções foram obtidas de inimigos reais na CaveScene, derrotados com a tecla de ataque e com o sorteio original de drops. Nenhum drop ou identificador artificial foi criado. A navegação até a cena e a recuperação de vida entre combates foram preparações isoladas do teste. Para testar capacidade cheia de forma controlada, a capacidade e as pilhas do inventário foram ajustadas apenas na sessão de teste e restauradas ao final; o código de inventário e a capacidade padrão de 24 permanecem intactos na entrega.

Foram inspecionadas capturas renderizadas da caixa e das duas poções. A verificação funcional de poções ocorreu na CaveScene; não foi repetida uma campanha inteira nem cada mapa. A preservação dos sistemas fora do escopo foi conferida pela comparação dos arquivos com a base.

## Verificações de código e pacote

- `npm run build`: TypeScript e build de produção Vite aprovados.
- `node --test tests/quest-tracker.test.mjs`: seis testes aprovados, zero falhas.
- Comparação estrutural: `tryCollect`, `tryInteract`, `updateProgressTriggers`, `isNear`, `isNearNarrativeProp` e `normalizeState` do prólogo permanecem idênticos à base.
- O corpo original de `LootManager.collectNear` foi preservado, salvo a extração do mesmo predicado de seleção, agora consultado também pela apresentação.
- Nenhum asset ou arquivo de dependências foi alterado.

O ZIP completo contém os 427 arquivos originais, incluindo as quatro alterações, mais os três arquivos novos: **430 arquivos**. Dependências instaladas, build local, ferramentas, saves e capturas de teste ficam fora do pacote, seguindo a estrutura da base. A integridade foi conferida por CRC e por comparação SHA-256 de cada entrada com o projeto de trabalho antes da entrega.
