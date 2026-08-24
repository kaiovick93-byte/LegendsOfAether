# Round 33 — NPC Interaction UI + Character Names

## New interaction presentation
The old raw name / `F • Conversar` text was replaced by a themed RPG interaction panel.

Visual assets:
- `assets/images/ui/npc_interaction/npc_prompt_panel.png`
- `assets/images/ui/npc_interaction/keycap_f.png`
- `assets/images/ui/npc_interaction/keycap_t.png`
- `assets/images/ui/npc_interaction/icon_talk.png`
- `assets/images/ui/npc_interaction/icon_shop.png`

Behavior:
- panel fades/slides in only when the player is near the NPC;
- proper character name is shown in gold;
- occupation / function appears as a subtitle;
- F/T are shown with graphical keycaps;
- talking uses a speech icon;
- merchant shop uses a shop icon;
- roaming NPCs still pause and face the player when approached;
- dialogue titles now use the NPC's proper name.

## Cidade de Aether NPC names
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

## Floresta NPC names
- Aren Valebosque — Ranger
- Edrin Halvek — Construtor da Ponte
- Professor Cael — Erudito das Ruínas

## Validation
- `tsc --noEmit`: PASS
- existing NPC interaction distance and collision logic retained;
- merchant remains the only NPC with the second `[T] Loja` action because that is the only secondary service currently implemented.
