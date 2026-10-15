# Legends of Aether — v0.3.1 Round 25 — Polimento do chão sinistro ao redor da estrada

Base exclusiva: `legends-of-aether-v0.3.1-round24-etapa1-chao-sinistro-ao-redor-da-estrada.zip`.

## Objetivo

Polir **somente o chão** da Floresta Sinistra ao redor da continuação visual da Estrada Velha, usando apenas os assets já existentes no projeto.

## O que foi feito

- densificado o chão sombrio ao longo dos dois lados da estrada visual;
- ampliada a variação com raízes, folhas, detritos e manchas úmidas usando apenas assets já existentes;
- criada uma costura mais suave rente à estrada com os assets de transição já existentes;
- reforçada a transição externa para a mata/terreno sem criar árvore nova, osso, caveira ou colisão;
- preservada integralmente a geometria, a estrada visual e a área jogável.

## Regras preservadas

- nenhum asset novo foi criado nesta etapa;
- nenhuma árvore nova foi adicionada nesta etapa;
- nenhum osso ou crânio foi adicionado nesta etapa;
- nenhuma colisão, navegação, trigger, quest ou bounds jogável foi alterado;
- a continuação visual da Estrada Velha do Round 23 permanece na mesma posição.

## Arquivos alterados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `README.md`

---

# Legends of Aether — v0.3.1 Round 24 — Floresta Sinistra ao redor da Estrada — Etapa 1

Base exclusiva: `legends-of-aether-v0.3.1-round23-continuacao-visual-estrada-completa.zip`.

## Objetivo

Implementar **somente a Etapa 1** da Floresta Sinistra ao redor da continuação visual da Estrada Velha, usando a referência aprovada `aether_caminho_na_floresta_assombrada.png`.

Nesta etapa entram apenas elementos de chão junto à estrada:

- solo escuro;
- folhas secas;
- detritos orgânicos;
- raízes rasas;
- costura local entre o terreno já existente e a nova área sombria.

## Regras preservadas

- a Estrada Velha visual do Round 23 não foi reposicionada, redimensionada ou redesenhada;
- nenhuma árvore nova foi adicionada nesta etapa;
- nenhum osso ou crânio foi adicionado nesta etapa;
- nenhuma colisão, navegação, trigger, quest ou bounds jogável foi alterado;
- a composição usa somente assets de solo já existentes no projeto;
- a Etapa 1 é uma camada visual de acabamento ao longo dos dois lados da estrada.

## Arquivos alterados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `README.md`

---

# Legends of Aether — v0.3.1 Round 23 — Continuação visual completa da Estrada Velha

Base exclusiva: `legends-of-aether-v0.3.1-round22-continuacao-visual-estrada.zip` (derivada do Round 21 aprovado).

## Objetivo

Completar **somente o trecho restante da continuação visual da Estrada Velha** indicado pela marcação vermelha do usuário, levando a estrada até a borda esquerda da área visual.

## Implementação

- preservada toda a estrada já aprovada do Round 22;
- acrescentados somente os módulos finais necessários para atravessar o corredor marcado em vermelho;
- o prolongamento termina além da borda esquerda para não deixar corte/gap visível;
- continua sendo **100% visual**: sem colisão, navegação, triggers, quests ou expansão dos bounds jogáveis;
- o corredor de exclusão das árvores acompanha automaticamente o caminho visual completo.

## Arquivos alterados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `README.md`

---

# Legends of Aether — v0.3.1 Round 22 — Continuidade visual da Estrada Velha

Base exclusiva: `legends-of-aether-v0.3.1-round21-preenchimento-total-arvores-mortas.zip`.

## Objetivo

Implementar **somente a continuidade visual** da Estrada Velha para dentro da área
da futura Floresta Sinistra, seguindo a referência `refe.png`.

## Implementação

- o encaixe começa no conector inicial real da Estrada Velha já existente;
- a continuação usa 4 módulos `straightLong` + 1 `straightShort` do kit B4D já aprovado;
- as rotações formam a curva progressiva para cima/esquerda vista na referência;
- a estrada é puramente visual: sem colisão, navegação, trigger, quest ou expansão de bounds;
- a massa de árvores do Round 21 apenas respeita um corredor visual local para não nascer sobre a estrada;
- nenhum asset novo foi criado e nenhuma geometria aprovada do mapa foi alterada.

## Arquivos alterados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `README.md`

---

# Legends of Aether — v0.3.1 Round 21 — preenchimento total com árvores mortas

Base exclusiva: `legends-of-aether-v0.3.1-round20-massa-principal-arvores-mortas.zip`.

## Objetivo

Preencher visualmente **toda a área aprovada da floresta sinistra** com uma massa densa
contínua de árvores mortas, em vez de apenas algumas unidades isoladas.

## O que foi feito

- mantida a mesma geometria aprovada da cobertura visual;
- preservados chão, transições de borda, estrada e props do mapa;
- substituída a distribuição esparsa por uma **malha densa de árvores mortas**;
- adicionada uma faixa extra de reforço na lateral esquerda para ler melhor a parede de árvores;
- sem colisão nova e sem expansão da área jogável.

## Arquivos alterados

- `src/world/OldRoadAncientForestVisualExtension.ts`
- `README.md`

---

# Legends of Aether — v0.3.1 Round 20 — Massa principal de árvores mortas

Base exclusiva: `legends-of-aether-v0.3.1-round19-transicoes-borda-invertidas.zip`.

## Escopo desta etapa

Aplicar a **massa principal de árvores mortas** apenas dentro da cobertura visual
já aprovada da floresta sinistra, preservando:

- a geometria aprovada da cobertura;
- o chão e as transições de borda já existentes;
- a estrada, a placa, a lanterna, a cerca, a escarpa e o restante do mapa;
- a ausência de colisão nova e a ausência de expansão da área jogável.

## Implementação

A densidade visual foi adicionada em `src/world/OldRoadAncientForestVisualExtension.ts`
com uma nova etapa puramente visual de árvores mortas. As bases dos sprites ficam
somente dentro da geometria aprovada da cobertura visual, enquanto copas e galhos
continuam livres para avançar visualmente sobre a área externa, sem máscara.

Foram usados apenas os três assets já existentes de árvores mortas:

- `ancient_forest_tree_dead_01`
- `ancient_forest_tree_dead_02`
- `ancient_forest_tree_dead_03`

Nenhum asset novo foi criado nesta etapa.

## Verificação

A alteração foi feita de forma localizada e sem mexer em colisão. A validação de build
permanece pendente neste ambiente porque `npm ci` não concluiu aqui a tempo. Assim,
a checagem entregue nesta etapa é estrutural/cirúrgica no código, partindo da última
base aprovada.

Arquivos alterados: `src/world/OldRoadAncientForestVisualExtension.ts`, `README.md`.

---

> **REGRAS OBRIGATÓRIAS DO PROJETO:** antes de qualquer alteração, leia `AGENTS.md` e `PROJECT_RULES.md`. Marcações visuais do usuário são geometria exata, nunca aproximada.

# Legends of Aether — v0.3.0 Round 7 — Apoio da muralha quebrada e Portão Sul

Base exclusiva: `legends-of-aether-v0.3.0-round6-river-bank-props-integration.zip`.
SHA-256 da base anexada: `865c7f6cdb875deeff878b658dabe937be0a780f5fd3531cba1376e38da6e562`.

## Executar

Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm run preview
```

## Correções pontuais — Round 7

A muralha quebrada usa os dois pontos de apoio da arte aprovada para encaixar
no trecho Leste existente. A projeção alinha os pés ao chão e mantém o pilar
íntegro com aproximadamente 124 pixels de altura, compatível com os módulos
normais. A brecha e os destroços pertencem ao mesmo PNG, sem peças adicionadas.
O aríete não foi movido. O ajuste é geométrico em uma textura de execução;
nenhum arquivo de imagem foi editado ou substituído.

O trecho de dois módulos à direita do Portão Sul foi assentado 0,35 tile ao
longo da própria muralha, mantendo escala, altura e inclinação da base. A
extremidade oposta continua atrás da torre existente. No encontro com o
portão, apenas os pixels cobertos pelo próprio pilar ficam ocultos, sem
módulos duplicados e sem mudar a profundidade global do portão.

A colisão adicional segue o contorno inferior opaco dos pés do Portão Sul.
Ela não usa a silhueta elevada do arco nem se estende para a grama à frente
da pedra. O caminho central alinhado à ponte continua livre. Portões, torres,
muralhas restantes, rio, ponte, Estrada Velha e decoração das margens estão
preservados, assim como todos os assets da base anexada.

### Verificação

```sh
node --test tests/city-walls.test.mjs tests/south-bridge.test.mjs
node --test --test-name-pattern=preloader tests/world-clock.test.mjs
npm run build
```

Os testes usam os métodos reais de movimento, as amostras de contato de
`Player` e o alpha do PNG aprovado do portão. Cobrem pontos antes penetráveis,
aproximação por dentro/fora, retorno após bloqueio e travessia da ponte/arco nos
dois sentidos, sem sobreposição com a pedra. Também verificam os apoios da
muralha quebrada, a escala dos muros, preservação dos portões/torres e descarte
das texturas temporárias ao encerrar a cena.

A conferência visual dos dois pontos usa o código de criação da cena e os
assets reais em Canvas 2D nativo. **A validação interativa em uma partida real
continua pendente:** o navegador do ambiente bloqueou o servidor local com
`ERR_BLOCKED_BY_CLIENT`. Os testes e a renderização assistida não substituem
essa verificação final no navegador do jogo.

Alterados: `src/scenes/AetherCityScene.ts`, `tests/city-walls.test.mjs`, `README.md`.
Criado: `src/world/CityWallGrounding.ts`. Nenhum asset adicionado ou removido.

## Revisão das muralhas — Round 6

Correções aplicadas somente em `AetherCityScene`:

- Os dois módulos do muro Sul entre o portão e a torre frontal usam a mesma
  escala uniforme e o mesmo pivô dos outros 16 módulos. A ampliação vertical
  isolada de 17% alterava a inclinação da base e o encaixe entre os módulos.
- A torre Norte conserva arte e escala, mas seu pé frontal agora fica à frente
  da quina, sobre o terreno. O sinal invertido do deslocamento colocava a base
  acima do encontro dos muros. A colisão da torre acompanha sua posição visual.
- A profundidade de três torres considera os módulos adjacentes para que as
  pontas das muralhas fiquem atrás delas. A torre frontal já tinha essa ordem.

Nenhum asset foi criado, substituído ou editado. Os portões Sul e Leste mantêm
arte, escala, posição e passagens. A muralha quebrada, destroços, aríete, rio,
ponte, Estrada Velha, demais construções, terreno e sistemas foram preservados.
As diferenças arquitetônicas desenhadas nos portões e na seção quebrada não
foram remodeladas.

### Verificação desta revisão

```sh
node --test tests/city-walls.test.mjs tests/south-bridge.test.mjs
node --test --test-name-pattern=preloader tests/world-clock.test.mjs
npm run build
```

A conferência visual usa os métodos reais de criação da cena e os assets
aprovados em um adaptador Canvas 2D, cobrindo os quatro cantos, ambos os
portões, os trechos retos e a seção quebrada. Os testes verificam o passo 2:1
e a escala dos 18 módulos, apoio/ordenação das torres, preservação dos portões
e da seção quebrada, contenção do perímetro e travessia nos dois sentidos.

A validação interativa em uma partida real permanece **pendente**: o navegador
deste ambiente bloqueou o servidor local com `ERR_BLOCKED_BY_CLIENT`.
O adaptador e os testes não substituem a inspeção final dentro do jogo.

Arquivos alterados nesta revisão: `src/scenes/AetherCityScene.ts` e `README.md`.
Arquivo criado: `tests/city-walls.test.mjs`.

## Ponte do Portão Sul — Round 5

Uma ponte antiga de pedra ocupa a travessia marcada em vermelho na referência,
entre a Estrada Velha e o acesso existente ao portão. A arte é carregada pelo
preloader e integrada em `AetherCityScene`; o piso, os apoios e o parapeito
compartilham os mesmos pontos de encaixe usados pela colisão. O parapeito da
frente recebe ordenação de profundidade por trecho, preservando a leitura do
personagem sobre o piso.

A água passa sob o arco e continua com a animação da base. O rio, margens,
estrada, placas, escarpa, muros, portão e demais assets existentes não foram
editados. A água bloqueia a travessia fora da ponte, inclusive nas curvas;
as margens secas continuam acessíveis. Apenas saves antigos que posicionem o
personagem na água ou no novo parapeito recebem um ajuste para a margem ou
passagem livre mais próxima. Posições já válidas são preservadas.

Novo asset: `assets/images/environment/outskirts/south-bridge/old_stone_bridge_01.png`.
Arte criada com o gerador de imagens integrado, orientada por: ponte antiga
baixa de pedra cinza envelhecida, piso largo, arco único, musgo discreto,
perspectiva isométrica e fundo transparente, combinando com os muros da referência.

## Validação da Round 5

```sh
node --test tests/south-bridge.test.mjs
node --test --test-name-pattern=preloader tests/world-clock.test.mjs
```

Build de produção e seis testes da ponte concluídos: travessia nos dois sentidos
usando o método real de movimento, bloqueio da água e das laterais, preservação
das regras de terreno/muralha, recuperação de posições antigas e alinhamento dos
pontos da arte com o piso funcional. O preloader também resolve o novo asset.
O desenho dos módulos reais foi conferido com Canvas 2D nativo e interface de
cena simulada, incluindo o descarte/recriação das texturas da ponte.

O teste interativo em uma partida real permanece pendente: o navegador do
ambiente bloqueou o servidor local com `ERR_BLOCKED_BY_CLIENT`. A renderização
de conferência e os testes automatizados não substituem essa validação.

Arquivos alterados: `src/scenes/AetherCityScene.ts`, `src/scenes/PreloadScene.ts`
e `README.md`. Arquivos criados: `src/world/SouthRiverBridge.ts`,
`tests/south-bridge.test.mjs` e o PNG da ponte listado acima.

## World Clock

Um relógio global exibe `Dia N • HH:MM` discretamente no canto superior esquerdo.
Um dia dura 72 minutos reais. Novo jogo e saves antigos sem relógio começam no
Dia 1 às 08:00. Morte, menus, diálogos e pausas existentes congelam o relógio;
reviver ou trocar de mapa preserva o mesmo estado. O save inclui a fração do
minuto e não aplica tempo decorrido enquanto o jogo estiver fechado.

Não há ciclo visual, alteração de iluminação, rotinas ou mudanças nos mapas/assets.
Para verificar a lógica e a integração com os métodos existentes:

```sh
npm run test:world-clock
```

## Animação da água — herdada da Round 4

`src/world/SouthRiver.ts` movimenta somente os pixels de água do material já
existente. Uma máscara fixa protege as margens, pedras e vegetação. O avanço é
compartilhado pelos nove módulos e segue a distância ao longo do rio, inclusive
nas curvas, sem mover os sprites. As texturas são atualizadas até 30 vezes por
segundo, apenas nos módulos visíveis; a fase continua compartilhada fora da tela.

Essa animação é preservada sem alterações na Round 5.

## Rio da marcação vermelha — implementação herdada

O novo rio acompanha o exterior da muralha sul e faz a curva após a torre frontal,
conforme a referência RIO VERMELHO. A Round 5 acrescenta apenas a ponte descrita acima.

`src/world/SouthRiver.ts` monta nove módulos de chão a partir de um novo material
pintado, com conectores compartilhados, coordenadas isométricas, margens suaves
e correnteza discreta. Os módulos são criados pelo Canvas 2D e carregados como
texturas Phaser, funcionando nos renderizadores Canvas e WebGL. A lâmina de água
passa sobre o acesso existente ao Portão Sul; a estrada não é movida ou reconstruída.
A Round 5 acrescenta a colisão da água e a travessia pela ponte.

Integração: `src/scenes/PreloadScene.ts` e `src/scenes/AetherCityScene.ts`.
Novo material: `assets/images/environment/outskirts/south-river/river_channel_material_01.png`,
gerado com a ferramenta de imagens integrada, usando a referência para direção visual.
Os sete PNGs do antigo `river-kit` foram removidos após verificar que não há mais
referências a eles no código. Os demais assets são os da base.

## Histórico de validação da Round 4

Build de produção, verificação TypeScript e teste dos arquivos pedidos pelo
preloader concluídos. A comparação da renderização Canvas 2D confirmou a arte
inicial idêntica à base, movimento nos nove módulos, pixels fora da máscara
inalterados, continuidade na repetição da correnteza e liberação dos recursos
ao encerrar a cena. A geometria e as transformações dos sprites foram preservadas.

Essa validação utiliza o código do rio e o material real com a interface de cena
simulada. A inicialização e a animação em uma partida real ainda precisam de
verificação: o navegador do ambiente bloqueou o acesso ao servidor local
(`ERR_BLOCKED_BY_CLIENT`). Os testes de World Clock são herdados e não foram
executados novamente nesta alteração.

O ZIP contém fonte, assets, configurações, lockfile, testes e este README. Não inclui
`docs`, `dist`, `scripts`, `node_modules`, prévias nem relatórios históricos.
