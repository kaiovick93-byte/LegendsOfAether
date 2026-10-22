# Legends of Aether — v0.3.2-round02 — F — Examinar

Implementação exclusiva do painel contextual na Placa da Estrada Velha e no Marco de Senda da Estrada Velha.

## Base utilizada

`legends-of-aether-v0.3.2-round01-correcao-floresta-sinistra-base-round39.zip`

SHA-256 da base: `925f7f1492be1fe424890dce3fde88bcba925fd05b14af8e300920d52955c940`

O estado atual do Round01, derivado do Round39, foi preservado. A comparação byte a byte encontrou somente os dois arquivos existentes alterados abaixo; nenhum arquivo original foi removido. Os outros 419 arquivos originais permanecem idênticos à base, incluindo os assets e os sistemas fora do escopo.

## Arquivos alterados

1. `src/scenes/PreloadScene.ts` — carregamento dos quatro PNGs.
2. `src/prologue/OldAetherPrologue.ts` — integração da apresentação nos dois alvos existentes, ocultação do aviso anterior nesses alvos e limpeza do novo painel ao encerrar a cena.

## Arquivos adicionados

1. `src/ui/ExamineInteractionPanel.ts` — componente visual, textos dinâmicos, escolha da moldura e posicionamento dentro da tela.
2. `assets/images/ui/interaction/examinar/interacao_moldura_dourada.png`
3. `assets/images/ui/interaction/examinar/interacao_moldura_azul_ativada.png`
4. `assets/images/ui/interaction/examinar/interacao_icone_olho_dourado.png`
5. `assets/images/ui/interaction/examinar/interacao_tecla_vazia.png`
6. `RELATORIO_v0.3.2-round02.md` — este relatório.

Nenhum arquivo removido. Nenhum outro tipo de interação recebeu o novo painel.

## Assets originais

Os quatro PNGs fornecidos foram copiados sem alteração de bytes. Não houve redesenho, recoloração, recorte ou geração de arte. Molduras, olho e fundo da tecla usam escala uniforme, preservando as proporções. O olho dourado é o mesmo nos dois estados. A letra F, a ação e o nome do objeto são textos separados, renderizados pelo jogo.

| Arquivo | Dimensões originais | SHA-256 |
| --- | --- | --- |
| `interacao_moldura_dourada.png` | 960 × 285 | `681d916e43d25e958c17c93505ad7aef3238ee30f4862f675e9e9790c70d1e93` |
| `interacao_moldura_azul_ativada.png` | 960 × 285 | `8f8c6151208e4b67ed222c1a2df07085831aca3bd22c3e8a0230c4907eae983b` |
| `interacao_icone_olho_dourado.png` | 107 × 68 | `8f0abe69941458ab706901a480501c72c18710ea5f267d5244e4cd1baa71fb30` |
| `interacao_tecla_vazia.png` | 148 × 158 | `59918952e7da09127c0c18eca1bc83dbc120d82af07db5c8556903708cea6728` |

## Integração e comportamento

- A placa mostra a moldura dourada, olho dourado, F, “Examinar” e “Placa da Estrada Velha”.
- O marco mostra os mesmos componentes, com o subtítulo “Marco de Senda”. A moldura é dourada antes da ativação e azul depois dela.
- A moldura lê o estado persistente já existente `waystone.ruinedExamined`. O painel não escreve flags e não ativa o marco.
- A ativação continua acontecendo ao concluir o diálogo pelo fluxo existente. A aproximação ou a abertura do diálogo, isoladamente, não ativa o marco.
- O alvo, a elegibilidade e o alcance continuam vindo de `getInteractionTarget()` e dos testes de proximidade existentes. As condições originais do prólogo foram mantidas, inclusive a liberação do primeiro exame do marco após o encontro com o lobo.
- Nenhum listener de teclado ou área clicável foi adicionado. `tryInteract()` e a captura de F permanecem inalterados.
- O painel desaparece fora do alcance, durante diálogos e menus, e é removido ao encerrar a cena. Não se acumula ao voltar pelo menu Continuar.
- O posicionamento acompanha a câmera, busca espaço perto do objeto e evita os limites da tela, o personagem, o alvo, os props próximos e a HUD visível. Somente o novo painel é reposicionado.
- Estrada Velha, Floresta Ancestral, Floresta Sinistra, névoa, iluminação, WorldClock, HUD, minimapa, Quest Tracker, diálogos, quests, triggers, colisões e código de save/load não foram alterados.

## Validação executada

O jogo foi executado em Chromium com teclado real automatizado. Para reduzir o tempo de deslocamento, o teste posicionou o personagem em pontos livres de colisão próximos aos objetos e consultou os predicados de alcance do próprio jogo. Não injetou flags de ativação nem pulou a conclusão dos diálogos: a placa, o encontro e combate com o lobo e a ativação do marco seguiram o fluxo existente.

| Cenário obrigatório | Resultado observado |
| --- | --- |
| 1. Aproximar da placa | Painel dourado visível, textos e olho corretos; aviso anterior oculto. |
| 2. Pressionar F na placa | Exame original aberto; manter F pressionado não duplicou o diálogo; conclusão original preservada. |
| 3. Afastar da placa | Painel oculto fora do alcance existente. |
| 4. Aproximar do marco não ativado | Painel dourado visível; aproximação não ativou o marco. |
| 5. Ativar pelo fluxo existente | Abrir o diálogo manteve o marco inativo; concluir o diálogo ativou o marco e mudou a moldura para azul. |
| 6. Pressionar F no marco ativado | Exame continuou funcionando; repetição preservou a etapa da quest. |
| 7. Salvar e carregar | Estado dourado restaurado pelo menu Continuar antes da ativação; estado azul restaurado após salvar, recarregar a página e continuar. F continuou funcionando. |
| 8. Console | Nenhum erro de console ou exceção de página durante a execução. |

Foram aprovados 25 pontos de verificação no navegador. Além dos cenários acima, foram conferidos:

- Resoluções 960 × 540, 1280 × 720, 1600 × 1000 e 390 × 844: painel inteiro na tela, proporções preservadas e nenhuma interseção com personagem, alvo ou HUD nas posições testadas.
- Abertura e fechamento do mapa: ocultação e reapresentação sem sobreposição.
- Afastamento do marco: ocultação fora do alcance.
- Saída da cena e retorno pelo menu Continuar: uma única instância do painel, com o estado visual correto.
- Câmera com o alvo próximo de cada uma das quatro bordas: painel dentro da tela e sem sobreposição com personagem, alvo ou HUD nas posições testadas.
- Inspeção visual das capturas da placa dourada, marco azul e formato estreito.
- `node --test tests/quest-tracker.test.mjs`: 6 testes aprovados, 0 falhas.
- `npm run build`: TypeScript e build de produção Vite concluídos com sucesso.

A validação cobre esses fluxos e posições. Não foi executada uma nova campanha completa; a preservação dos sistemas fora do escopo foi conferida pela comparação com a base.

## Conteúdo da entrega

ZIP completo do projeto com os 421 arquivos da base, incluindo as duas alterações, mais os seis arquivos adicionados: 427 arquivos no total. Dependências locais, resultados temporários de teste e o diretório de build não fazem parte do pacote, seguindo a estrutura da base. O ZIP foi verificado por CRC e comparado arquivo a arquivo com a versão de trabalho antes da entrega.
