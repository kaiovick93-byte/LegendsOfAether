# Round 32 — Collision & Circulation Audit

Overall static audit: **PASS**

## Static collider overlap check
- Non-intentional direct overlaps: **0**

## Player reachability (58×58 body, 29px obstacle expansion)
- Mercador: PASS
- Ferreiro: PASS
- Curandeira: PASS
- Taverneiro: PASS
- Erudita: PASS
- Artesã: PASS
- Elder Mira: PASS
- Guarda Leste: PASS
- Guarda Sul: PASS
- Marco de Senda: PASS
- Saída Leste: PASS
- Saída Sul: PASS
- Praça norte: PASS
- Praça sul: PASS

## NPC route clearance (12px safety margin)
- Morador: PASS
- Viajante: PASS

## Round 32 corrections
- Plaza bench/planter colliders reduced and redistributed to prevent chained collision walls.
- West-side cart moved to the commercial strip instead of the residential choke point.
- Tavern-side crate/barrel remain visual but no longer create physics blockers in the only southern-west passage.
- Lampposts were moved out of the Morador route and out of building footprints.
- Lower-right props were moved away from the blue residential footprint.
- Red residential collision footprint was reduced to remove overlap with the Artisan workshop.
- Notice board moved away from the main east-west avenue.
- East and south gate access remains reachable with the actual player body size.