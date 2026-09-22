# Legends of Aether — v0.3.0 Round 4

Base exclusiva: `legends-of-aether-v0.3.0-round3-aether-sign-sprite-swap.zip`.
SHA-256 da base anexada: `3b5d70323fd05ba5a42f518f4f1c3cc629aaecf686c33c399f89d589483565ba`.

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

## Animação da água — Round 4

`src/world/SouthRiver.ts` movimenta somente os pixels de água do material já
existente. Uma máscara fixa protege as margens, pedras e vegetação. O avanço é
compartilhado pelos nove módulos e segue a distância ao longo do rio, inclusive
nas curvas, sem mover os sprites. As texturas são atualizadas até 30 vezes por
segundo, apenas nos módulos visíveis; a fase continua compartilhada fora da tela.

Não foram criados ou alterados assets. Traçado, largura, posição, escala, estrada,
mapas, colisões, props e demais sistemas permanecem como na base anexada.

## Rio da marcação vermelha — implementação herdada

O novo rio acompanha o exterior da muralha sul e faz a curva após a torre frontal,
conforme a referência RIO VERMELHO. Não há ponte nem novos props.

`src/world/SouthRiver.ts` monta nove módulos de chão a partir de um novo material
pintado, com conectores compartilhados, coordenadas isométricas, margens suaves
e correnteza discreta. Os módulos são criados pelo Canvas 2D e carregados como
texturas Phaser, funcionando nos renderizadores Canvas e WebGL. A lâmina de água
passa sobre o acesso existente ao Portão Sul; a estrada não é movida ou reconstruída.
A colisão e o gameplay da base não foram alterados.

Integração: `src/scenes/PreloadScene.ts` e `src/scenes/AetherCityScene.ts`.
Novo material: `assets/images/environment/outskirts/south-river/river_channel_material_01.png`,
gerado com a ferramenta de imagens integrada, usando a referência para direção visual.
Os sete PNGs do antigo `river-kit` foram removidos após verificar que não há mais
referências a eles no código. Os demais assets são os da base.

## Validação da Round 4

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
