# Round 67 v11.5 — arquivos alterados

Copie o conteúdo deste pacote sobre a raiz do projeto, preservando a estrutura de pastas e substituindo os arquivos de mesmo nome.

Esta revisão contém:

- movimento do jogador em oito direções com posição isométrica autoritativa;
- colisão pelos últimos 14 pixels opacos dos pés, com escape e deslizamento ao tocar obstáculos;
- oclusão que mantém cenário opaco e mostra somente o contorno dourado do jogador;
- 24 folhas visuais e 24 folhas de contorno alinhadas ao chão e com direções espelhadas corretamente;
- HUD nativo `1320×154` com dois consumíveis, oito habilidades e quatro comandos ilustrados;
- preload, documentação e auditoria consolidados.

Depois da substituição, execute na raiz do projeto:

```bash
npm install
npm run check
npm run validate
npm run build
```

O projeto completo e este pacote de substituição não incluem `dist/`, `node_modules/` ou arquivos `VISUAL_QA`.
