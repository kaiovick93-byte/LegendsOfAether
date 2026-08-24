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
