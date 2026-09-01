# Round 67 v11.4 — correção de movimento inicial

Substitua estes arquivos no projeto, preservando os mesmos caminhos:

- `src/entities/Player.ts`
- `src/scenes/AetherCityScene.ts`
- `validate-project.mjs`

Esta revisão impede que o corpo Arcade recalcule `x/y` depois do movimento
isométrico, usa uma máscara corporal estável para colisões e atualiza a direção
antes de testar o primeiro passo. O novo jogo também começa voltado para o
interior da cidade pelo Portão Sul.

Depois da substituição, execute:

```bash
npm install
npm run check
npm run validate
npm run build
```

