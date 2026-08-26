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
