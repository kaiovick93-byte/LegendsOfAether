# Round 41 — Ajuste de quantidade, rotas e escala das galinhas

## Objetivo
Refinar a microfauna urbana de Aether ajustando:
- quantidade de galinhas ativas;
- rotas de circulação;
- proporção visual em relação ao restante da fauna urbana.

## Revisão visual
A escala anterior deixava as galinhas um pouco discretas demais perto de gato, cachorro e até da leitura visual dos ratos.

### Nova leitura de escala
- cachorro: permanece como o maior animal urbano;
- gato: abaixo do cachorro;
- galinhas: agora ocupam um nível intermediário coerente;
- ratos: menores e mais furtivos;
- pássaros: continuam sendo os menores.

Para isso, as galinhas passaram a usar escalas variadas:
- branca: `0.38`
- marrom: `0.36`
- creme: `0.35`
- marrom menor: `0.33`

Isso cria variedade sem quebrar o padrão estético.

## Ajuste de quantidade
- Antes: 3 galinhas
- Agora: 4 galinhas

## Ajuste de rotas
As rotas foram redesenhadas para:
- parecerem mais naturais;
- permanecerem concentradas no setor residencial sudeste;
- evitar corredores principais do jogador;
- dar sensação de pequeno terreiro doméstico.

## Arquivo alterado
- `src/world/AmbientCityLife.ts`

## Observação
Continua tudo sem interação, sem prompt, sem colisão dedicada e sem impacto na lógica dos NPCs principais.
