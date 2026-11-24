# Level 3 — "Café Dourado" — Design Spec

**Status:** approved, not yet implemented. **Depends on:** the base game design (`2026-11-24-cozy-cafe-design.md`).

## Intent

The project's goal is 5 total levels; this spec covers level 3, the next step in that progression. Each level so far has added: a new room theme, more simultaneous customers, tighter patience/spawn timing, and (from level 2 onward) one new topping station with new combo recipes. Level 3 continues that exact pattern rather than introducing a new kind of mechanic.

## Decided

- **Theme:** "Café Dourado" — a warmer, more upscale look than "Café Noir". Palette (hex): `bg 0x3a2a1a, floor 0x8a6d4a, wall 0x2e2420, brick 0x6b4226, counter 0x1c1410, top 0xe8d9b5, rug 0x7a1f2b`. Decor: a wall sign reading "CAFÉ DOURADO" (gold glow, cream text) plus a small gold-toned floor lamp and two stools, visible only on level 3 (mirrors the existing "Café Noir" `extras` group, as a new `extras3` group).
- **Station visuals:** levels 2 and 3 both use the existing chrome/gold "fancy" station skins — no third visual tier is built. This fixes a latent bug: fancy skins and the Chocolate station are currently gated to `level === 2` exactly, so they'd disappear on level 3. They become `level >= 2`.
- **New station — Doce de Leite:** combines with **Latte → Doce de Leite Latte**, and **Croissant → Doce de Leite Croissant**. Processing time 2.5s (same as Chocolate). Visually it's the same "dipping fountain" shape as the Chocolate station, recolored caramel (shared builder, parameterized by color), gated to `level >= 3`.
- **Layout:** the new station sits left of the Cups station, at `x = -5.3` (same row, `z = SZ`). The kitchen counter widens from 10.4/10.6 to 11.0/11.2 (recentered to `x = -0.3`) to seat it; every other station keeps its exact current position.
- **New items (`view/items.js`):** `doceleitelatte` (cup + caramel topping disc, same shape family as `mochalatte`) and `doceleitecroissant` (croissant torus recolored caramel, same shape family as `chococroissant`).
- **New recipe icons:** `doceleitelatte` → `🥛🍮`, `doceleitecroissant` → `🥐🍮` (base-drink icon + a custard/caramel marker, matching the base+topping icon convention already used for the level-2 recipes).
- **Level 3 numbers**, continuing the level 1→2 trend: 7 simultaneous customers (`SLOT_SETS` entry of 7 evenly spaced x positions, `[-3,-2,-1,0,1,2,3]`), 45s patience (−5 from level 2), spawn every 3–5s.
- **Order pool:** level 3 customers can order any of the 8 recipes from levels 1–3, not just the 2 new ones (replaces the inline level-1/level-2 ternary in `spawnCustomer` with a `ORDER_POOLS` array indexed by level).

## Non-goals

- No new 3D visual tier for existing stations.
- No changes to levels 1 or 2's own content, beyond the `level >= 2` visibility fix (which makes level 2 behave as originally intended once level 3 exists).
- Levels 4 and 5 are out of scope for this spec.

## What's left to the builder

- Exact pixel/geometry tuning of the new station and widened counter once visible in the running game (the numbers above are a reasonable first placement, not visually verified).
- Exact English wording for any new on-screen strings beyond what's listed here (follow the existing phrasing style in `model/i18n.js`).
