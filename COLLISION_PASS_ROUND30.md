# Round 30 — Collision pass

Correções realizadas sobre o Round 29:

- Marco de Senda recebeu collider estático compacto na base (Cidade e Floresta).
- Canteiros da praça receberam footprints físicos menores que a arte visual.
- Bancos da praça agora bloqueiam apenas pela base/assento.
- Postes decorativos da praça receberam colliders estreitos.
- NPCs fixos agora bloqueiam o jogador com colliders pequenos, mantendo a distância de interação confortável.
- Morador e Viajante permanecem sem collider físico, evitando empurrões e travamento de rotas.
- A rota do Viajante foi redesenhada para não cruzar a posição física da Erudita.
- Foram preservadas as colisões existentes de muros, portões, prédios, casas residenciais, poço e props das ruas.

Arquivos alterados:
- `src/scenes/WorldScene.ts`
- `src/world/Waystone.ts`
