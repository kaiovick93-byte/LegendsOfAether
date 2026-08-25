# Import convention

The TypeScript source uses extensionless local imports, for example:

```ts
import { WorldScene } from './scenes/WorldScene';
import { Player } from '../entities/Player';
```

This is intentional for Vite + TypeScript with `moduleResolution: Bundler`.
Vite resolves the source `.ts` files and emits browser-ready JavaScript during the build.
