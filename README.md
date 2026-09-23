# Legends of Aether — v0.3.0 Round 6 — Alinhamento das muralhas

Base exclusiva: `legends-of-aether-v0.3.0-round5-south-gate-bridge-github.zip`.
SHA-256 da base anexada: `bfc28bca5a95cc2c0bcb54aa2f729df234484adeaf8827c6592c2002c899b650`.

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
