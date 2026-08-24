# Round 34 — NPC Dialogue UI with Large Portraits

Implemented a new dynamic NPC conversation interface for Cidade de Aether.

## Interface
- Large ornate dialogue window using graphical UI assets instead of the old plain rectangle.
- Text/information area on the left.
- Large NPC portrait area on the right, extending above the dialogue body.
- NPC proper name + profession/role in the header.
- Visual footer buttons/keycaps for F, T and ESC.
- Darkened world backdrop while conversation is open.
- Smooth open/close and page-change animation.

## Dialogue behavior
- F advances through the NPC's dialogue pages.
- On the final page, F closes the conversation.
- ESC always closes the conversation.
- T is shown only when a real secondary action currently exists; Aldren Voss opens the shop with T.
- NPC movement/player movement remains paused while the dialogue is open.
- The old ChoiceDialogueBox remains available for non-NPC interactions such as the Waystone.

## Portrait support
Dedicated large portrait assets were integrated for:
- Aldren Voss — Mercador
- Borin Ferramão — Ferreiro
- Elara Veyn — Curandeira
- Garrick Brenn — Taverneiro
- Lysandra Vael — Erudita
- Maelis Tessara — Artesã
- Mira Edevane — Anciã de Aether
- Kael Dorn — Guarda do Portão Leste
- Bren Harrow — Guarda do Sul
- Tomas Belmon — Morador de Aether
- Darian Kestrel — Viajante

The panel also has a sprite fallback: if a dedicated portrait texture is absent, it can display the NPC's map sprite instead, so dialogue remains functional.

## Main files
- src/ui/NpcDialoguePanel.ts
- src/scenes/WorldScene.ts
- src/scenes/PreloadScene.ts
- src/npc/Npc.ts
- src/npc/WanderingNpc.ts
- assets/images/ui/dialogue/
