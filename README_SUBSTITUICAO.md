# Round 67 v11.3 — arquivos alterados

Copie os arquivos deste pacote sobre o projeto, preservando exatamente os caminhos:

- `src/isometric/IsoOcclusion.ts`
- `validate-project.mjs`

O arquivo de execução corrigido é `src/isometric/IsoOcclusion.ts`. Ele adiciona
ao `IsoPhysicsSprite` a API encadeável `setCollideWorldBounds`, delegando a
configuração ao `Phaser.Physics.Arcade.Body` e retornando o próprio sprite.

`validate-project.mjs` contém o teste de regressão que impede que essa API seja
removida novamente.

Depois da substituição, execute:

```bash
npm run check
npm run validate
npm run build
```
