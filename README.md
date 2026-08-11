# Legends of Aether 0.1.0

Protótipo jogável de RPG 2D para navegador com visual de fantasia desenhada, inspirado na estrutura de exploração de RPGs clássicos e no ritmo de ARPGs.

## Rodar

A pasta é estática. Basta servir por HTTP:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

## Controles

WASD/setas: mover · Espaço: ataque · Q: habilidade principal · 1: habilidade secundária · 2: mobilidade · F: falar · K: skills · I: inventário · E: interagir

## Estrutura

- `src/`: código do jogo, separado por sistemas
- `assets/images/characters/player.png`: sprite sheet 16 frames
- `assets/audio/`: reservado para música e efeitos

## Observação

A versão 0.1 é propositalmente autocontida em JavaScript + Phaser CDN para facilitar testes e publicação estática.
