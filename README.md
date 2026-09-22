# Legends of Aether — v0.3.0 Round 3

Base exclusiva: `legends-of-aether-v0.3.0-round2-red-river-github.zip`.
SHA-256 da base anexada: `f2d7435af741a80ca845916207f0053a9847e2f5d64ee883b107b5ab48f07e13`.

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

## Rio da marcação vermelha — preservado da Round 2

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

## Validação

Build de produção, verificação TypeScript e 11 testes automatizados concluídos.
Os testes cobrem passagem do tempo/meia-noite, morte/respawn, save/load, saves
antigos, pausas, troca de mapa, instalação única e arquivos pedidos pelo preloader.
São testes de lógica e integração com IO simulado, não uma partida no navegador.
O teste interativo de carregamento e HUD permanece pendente: o ambiente bloqueou
o acesso do navegador ao servidor local.

O ZIP contém fonte, assets, configurações, lockfile, testes e este README. Não inclui
`docs`, `dist`, `scripts`, `node_modules`, prévias nem relatórios históricos.
