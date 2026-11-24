# Level 3 "Café Dourado" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third playable level ("Café Dourado") following the exact pattern levels 1→2 already established: new theme, more customers, tighter timing, one new topping station with two new combo recipes.

**Architecture:** Pure data additions to `model/recipes.js` and `model/levels.js` (arrays already indexed by level, so a third entry is additive); a new station built by a function shared with the existing Chocolate station, parameterized by color; one visibility-gating bug fix (`level === 2` → `level >= 2`) that would otherwise hide level-2 content on level 3; a small amount of new `view`/`controller` wiring for the new station, following the Chocolate station's existing code shape line-for-line.

**Tech Stack:** Vite + Three.js, vanilla ES modules, no test framework (this project has none — see Review Focus below for how each task is verified instead).

**Spec:** `docs/superpowers/specs/2026-11-24-level-3-cafe-dourado-design.md`

## Global Constraints

- New station key: `doceleite`. New item/recipe type strings: `doceleitelatte`, `doceleitecroissant` — used verbatim and identically in `RECIPES`, `makeItem`, `interact()`, `setHeld`'s name maps, and `ORDER_POOLS`.
- Processing time for the new station: 2.5s, no burn timer (matches Chocolate).
- Level 3 numbers: 7 customers, 45s patience, 3–5s spawn interval, `SLOT_SETS[2] = [-3, -2, -1, 0, 1, 2, 3]`.
- Theme hex values (exact, from the spec): `bg 0x3a2a1a, floor 0x8a6d4a, wall 0x2e2420, brick 0x6b4226, counter 0x1c1410, top 0xe8d9b5, rug 0x7a1f2b`.
- New station position: `x = -5.3`, same `z = SZ` row as the others, `hw = 0.35`. Kitchen counter widens to `box(11.0, 1.2, 1.2, …, -0.3, 0.6, -5.3)` / `box(11.2, 0.12, 1.4, …, -0.3, 1.26, -5.3)`.
- Fancy station skins and the Chocolate station become visible for `level >= 2` (not `=== 2`); the new station is `level >= 3`.
- No automated test runner exists in this project. "Test" steps below are: (a) real Node assertions for the two pure-data files (`model/recipes.js`, `model/levels.js` — no DOM dependency, genuinely importable under plain Node), and (b) `node --check` syntax validation for every other touched file (they depend on `document`/WebGL and cannot run outside a browser). The final task is a manual browser smoke test the human runs, since this environment cannot `npm install`.

## Review Focus

- A chef picks up a finished `doceleitelatte`/`doceleitecroissant` — does the held-item name tag (`setHeld`'s hardcoded `names` maps in `controller/game.js`) have an entry for both new types, in both languages? (Task 6, Step 3.)
- Switching levels mid-session via the debug `<select>` (e.g. 3 → 1 → 3) — does `resetGame()`'s per-station data-reset loop include the new station, so a leftover item/timer doesn't survive the switch? (Task 6, Step 2.)
- `spawnCustomer()` indexes `ORDER_POOLS[level - 1]` — does `ORDER_POOLS.length` match `LEVELS.length` (3), so level 3 never reads `undefined`? (Task 1, Step 2.)
- The station name-tag loop does a chained PT→EN `.replace()` that already mis-translates any new label containing the substring "Leite" (the new station's name does). Fixed by giving tags explicit per-language text instead of string substitution. (Task 4, Step 1.)
- Two-glyph recipe icons (`🥛🍮`, `🥐🍮`) in the speech bubble — already handled by the existing `Array.from(icon).length > 1` font-shrink in `makeBubble` (no new code needed); confirmed by reusing that exact path, not reimplementing it. (Task 1, Step 1, note only.)

---

### Task 1: Recipe and order-pool data

**Files:**
- Modify: `src/model/recipes.js`

**Interfaces:**
- Produces: `RECIPES.doceleitelatte`, `RECIPES.doceleitecroissant` (same `{label, icon}` shape as existing entries); `export const ORDER_POOLS` — an array of 3 arrays of recipe-key strings, one per level, replacing the ternary currently inline in `controller/game.js`'s `spawnCustomer`.

- [ ] **Step 1: Add the two new recipes**

In `RECIPES`, add:
```js
doceleitelatte: { label: 'Doce de Leite Latte', icon: '🥛🍮' },
doceleitecroissant: { label: 'Doce de Leite Croissant', icon: '🥐🍮' },
```

- [ ] **Step 2: Add `ORDER_POOLS` and verify it**

```js
export const ORDER_POOLS = [
  ['espresso', 'espresso', 'latte', 'croissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant'],
  ['espresso', 'latte', 'croissant', 'mocha', 'mochalatte', 'chococroissant', 'doceleitelatte', 'doceleitecroissant'],
];
```
(Pool 1 and 2 are copied verbatim from the current `spawnCustomer` ternary branches — no behavior change for levels 1–2.)

Run from the repo root:
```bash
node --input-type=module -e "
import { RECIPES, ORDER_POOLS } from './src/model/recipes.js';
console.assert(RECIPES.doceleitelatte?.label === 'Doce de Leite Latte', 'doceleitelatte label');
console.assert(RECIPES.doceleitecroissant?.label === 'Doce de Leite Croissant', 'doceleitecroissant label');
console.assert(ORDER_POOLS.length === 3, 'three pools');
console.assert(ORDER_POOLS[2].includes('doceleitelatte') && ORDER_POOLS[2].includes('doceleitecroissant'), 'pool 3 has new items');
console.assert(ORDER_POOLS[0].length === 4 && ORDER_POOLS[1].length === 6, 'pools 1-2 unchanged length');
console.log('OK');
"
```
Expected: prints `OK` with no assertion errors.

- [ ] **Step 3: Commit**

```bash
git add src/model/recipes.js
git commit -m "feat: add doce de leite recipes and per-level order pools"
```

---

### Task 2: Level data (theme, level, slots)

**Files:**
- Modify: `src/model/levels.js`

**Interfaces:**
- Produces: `THEMES[2]`, `LEVELS[2]`, `SLOT_SETS[2]` — same shapes as the existing two entries in each array.

- [ ] **Step 1: Append the third theme, level, and slot set**

```js
// THEMES, third entry:
{ bg: 0x3a2a1a, floor: 0x8a6d4a, wall: 0x2e2420, brick: 0x6b4226, counter: 0x1c1410, top: 0xe8d9b5, rug: 0x7a1f2b }

// LEVELS, third entry:
{ slots: 2, spawn: [3, 5], patience: 45 }

// SLOT_SETS, third entry:
[-3, -2, -1, 0, 1, 2, 3]
```

- [ ] **Step 2: Verify**

```bash
node --input-type=module -e "
import { THEMES, LEVELS, SLOT_SETS } from './src/model/levels.js';
console.assert(THEMES.length === 3 && LEVELS.length === 3 && SLOT_SETS.length === 3, 'three of each');
console.assert(LEVELS[2].slots === 2 && LEVELS[2].patience === 45 && JSON.stringify(LEVELS[2].spawn) === '[3,5]', 'level 3 numbers');
console.assert(SLOT_SETS[2].length === 7 && SLOT_SETS[LEVELS[2].slots].length === 7, 'level 3 has 7 slots');
console.log('OK');
"
```
Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/model/levels.js
git commit -m "feat: add level 3 theme, timing, and 7-customer slot layout"
```

---

### Task 3: Item visuals

**Files:**
- Modify: `src/view/items.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `makeItem('doceleitelatte')` and `makeItem('doceleitecroissant')` render without throwing and follow the existing `mochalatte`/`chococroissant` shape families.

- [ ] **Step 1: Extend the cup-topping branch**

Add `'doceleitelatte'` to the type-list `includes(...)` array that routes to the cup-rendering branch. In that branch's topping-disc color ternary, add a `doceleitelatte` case using `0xc68642` (caramel). In the mocha/mochalatte foam-swirl condition, add `|| type === 'doceleitelatte'`, and make that swirl's top-stripe color vary by type too (chocolate-brown `0x4a2512` for mocha/mochalatte, caramel `0xc68642` for doceleitelatte) instead of the current hardcoded single color.

- [ ] **Step 2: Extend the croissant/torus branch**

In the torus-color ternary (`burnt` / `chococroissant` / default), add a `doceleitecroissant` case using `0xc68642`.

- [ ] **Step 3: Syntax-check**

```bash
node --check src/view/items.js
```
Expected: no output (pass).

- [ ] **Step 4: Commit**

```bash
git add src/view/items.js
git commit -m "feat: add doce de leite item meshes"
```

---

### Task 4: Station visuals — new station, visibility fix, tag i18n fix

**Files:**
- Modify: `src/view/stations.js`

**Interfaces:**
- Consumes: `LEVELS`, `SLOT_SETS` (already imported).
- Produces: `doceLeiteSt` (same shape as other station objects: `.g`, `.cupSlot`, `.bar`, `.data`, `.hidden`, `.pos`), exported alongside the existing named stations and added to `applyStationLevel`.

- [ ] **Step 1: Fix the TAGS i18n hack before adding a colliding label**

Replace the `TAGS` tuples' reliance on `txt.replace('Leite', 'Milk')`-style chained substitution (which would corrupt a new label containing "Leite") with explicit per-language text: change each `TAGS` entry to `[station, ptLabel, enLabel, y, dx]` and call `makeTag(lang === 'pt' ? ptLabel : enLabel)`. Also make `makeTag`'s font size shrink for labels longer than ~10 characters (same pattern as the existing `Array.from(icon).length > 1` shrink in `makeBubble`, `src/view/hud.js`), since "Doce de Leite" / "Dulce de Leche" won't fit the tag canvas at the current fixed 40px.

- [ ] **Step 2: Fix the level-gating bug**

Change `st.fancy.visible = n === 2` to `n >= 2`, and `chocoSt.g.visible = n === 2` / `chocoSt.hidden = n !== 2` to `n >= 2` / `n < 2`, inside `applyStationLevel`.

- [ ] **Step 3: Add a shared dip-station builder and build `doceLeiteSt` with it**

Extract the existing `chocoSt` disc/cylinder/sphere construction (the `disc(...)` calls plus the final sphere) into a small function `buildDipStation(g, toppingColor)` taking the group to build into and the topping material's color, and call it for both Chocolate (`0x3a1a0c`, existing emissive `0x1a0a04`) and the new station (`0x8a5a2b`, emissive `0x2a1a08`). Build `doceLeiteSt = makeStation('doceleite', -5.3, SZ, 0.35, 'Doce de Leite')` the same way `chocoSt` is built (own `cupSlot`, `bar.position.y`, `hidden = true` initially), then call `buildDipStation(doceLeiteSt.g, 0x8a5a2b)`; set `doceLeiteSt.g.visible = false` initially.

- [ ] **Step 4: Add its tag and its `applyStationLevel` visibility**

Add a `TAGS`-style tag for it (`'Doce de Leite'` / `'Dulce de Leche'`) positioned at `(doceLeiteSt.pos.x, TAG_Y, doceLeiteSt.pos.z)`, added to the `extras3` group from Task 5 (so it only shows with the level-3 decor) rather than `scene` directly — mirrors how the Chocolate tag is added to `extras` rather than `scene`. In `applyStationLevel(n)`, add `doceLeiteSt.g.visible = n >= 3; doceLeiteSt.hidden = n < 3;`.

- [ ] **Step 5: Export it**

Add `doceLeiteSt` to the file's exports (alongside `machineSt`, `milkSt`, etc.) — `controller/game.js` needs it for the reset loop, `updateStation` call, and `interact()` case in Task 6.

- [ ] **Step 6: Syntax-check**

```bash
node --check src/view/stations.js
```
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/view/stations.js
git commit -m "feat: add doce de leite station; fix level>=2 visibility gating; fix tag i18n"
```

---

### Task 5: Room visuals — wider counter, Café Dourado decor

**Files:**
- Modify: `src/view/room.js`

**Interfaces:**
- Consumes: `THEMES` (already imported; Task 2's third entry is picked up automatically by the existing `THEMES[n - 1]` lookup in `applyRoomTheme` — no change needed there besides the new `extras3` line).
- Produces: `export const extras3` (new `THREE.Group`, same shape/role as the existing `extras` group), and `applyRoomTheme` additionally sets `extras3.visible = n === 3`.

- [ ] **Step 1: Widen the kitchen counter**

Change the two kitchen-counter `box(...)` calls from `(10.4, …, 0, 0.6, -5.3)` / `(10.6, …, 0, 1.26, -5.3)` to `(11.0, …, -0.3, 0.6, -5.3)` / `(11.2, …, -0.3, 1.26, -5.3)`.

- [ ] **Step 2: Build the Café Dourado decor group**

Add `export const extras3 = new THREE.Group(); extras3.visible = false; scene.add(extras3);` plus a sign ("CAFÉ DOURADO", warm gold glow/cream fill, same canvas-sign technique as the existing "CAFÉ NOIR" sign) and a floor lamp + two stools recolored to the gold palette, following the existing `extras` block's structure and world positions (same anchors, different group/colors — they're never visible at the same time).

- [ ] **Step 3: Wire it into `applyRoomTheme`**

Add `extras3.visible = n === 3;` to `applyRoomTheme(n)`.

- [ ] **Step 4: Syntax-check**

```bash
node --check src/view/room.js
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/view/room.js
git commit -m "feat: widen kitchen counter and add Café Dourado decor for level 3"
```

---

### Task 6: Controller wiring

**Files:**
- Modify: `src/controller/game.js`

**Interfaces:**
- Consumes: `ORDER_POOLS` from `src/model/recipes.js`; `doceLeiteSt` from `src/view/stations.js`.
- Produces: a working `doceleite` station interaction (latte/croissant in → done → doce-de-leite item out, with symmetric "put it back" per the existing pattern at every other station), correct held-item name tags, and level-aware spawning via `ORDER_POOLS`.

- [ ] **Step 1: Add the `interact()` case**

Add a `case 'doceleite':` block shaped exactly like the existing `case 'choco':` block: starts on `h === 'latte' || h === 'croissant'`, produces via `updateStation`'s mapping (Step 4 below) on completion, and includes the same "put a finished item back" branch (`h === 'doceleitelatte' || h === 'doceleitecroissant'`) already present for the other four stations.

- [ ] **Step 2: Add it to the reset loop**

Add `doceLeiteSt` to the array in `resetGame()`: `for (const s of [machineSt, ovenSt, milkSt, chocoSt, doceLeiteSt]) { … }`.

- [ ] **Step 3: Add its name-tag entries**

In `setHeld`'s two `names` maps (PT and EN), add `doceleitelatte: 'Doce de Leite Latte'` and `doceleitecroissant: 'Doce de Leite Croissant'` to both (same string both languages, matching how `mochalatte`'s label is handled).

- [ ] **Step 4: Add it to `updateStation`'s production mapping and its `tick()` call**

In `updateStation`'s `s.key === 'choco' ? {...} : …` ternary chain (both the produced-item line and the `say(...)` message line), add a `s.key === 'doceleite' ? { latte: 'doceleitelatte', croissant: 'doceleitecroissant' }[d.item] : …` branch, reusing the Chocolate branch's message strings. In `tick()`, add `updateStation(doceLeiteSt, dt, t, 2.5, 0);` next to the existing four calls.

- [ ] **Step 5: Replace the inline order-pool ternary**

In `spawnCustomer()`, replace `pick(level === 1 ? [...] : [...])` with `pick(ORDER_POOLS[level - 1])`.

- [ ] **Step 6: Syntax-check**

```bash
node --check src/controller/game.js
```
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/controller/game.js
git commit -m "feat: wire up doce de leite station and level-indexed order pools"
```

---

### Task 7: Docs and manual verification

**Files:**
- Modify: `DOCUMENTACAO.md`
- Modify: `CLAUDE.md` (only if it needs the 5-level goal noted — check first, it may not)

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update `DOCUMENTACAO.md`**

Add level 3 to the levels table/section (customers 7, spawn 3–5s, patience 45s, Doce de Leite station/recipes, Café Dourado theme) and note the overall 5-level goal next to the existing level 1/2 description.

- [ ] **Step 2: Commit the docs**

```bash
git add DOCUMENTACAO.md
git commit -m "docs: document level 3 and the 5-level roadmap"
```

- [ ] **Step 3: Manual browser smoke test (human, outside this environment)**

Run `npm install && npx vite` (this sandbox's npm registry currently 401s on install — see prior session note — so this step cannot be completed here), open with `?debug`, and check: level 3 is reachable from the debug level `<select>`, the Doce de Leite station appears and doesn't visually clip into the Cups station, both new recipes can be made/served/returned, 7 customers can appear at once, and switching levels back and forth via the `<select>` doesn't leave stale items/timers on the new station.
