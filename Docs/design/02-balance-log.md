# Balance log

Append-only record of god + card tuning iterations. New entries go at the **top**. Each entry should record: what changed, the data that motivated it, and the result.

---

## v2 — 2026-04-25 — data-driven god + card tune

**Context**: First pass landed god win rates at 43.7%–55.5% under forced-pairing 1v1. Rotated random matchups still showed Hephaestus dominant (~74% pre-tune). Built per-card-win-contribution analyzer (`pnpm --filter @bc/simulator run analyze`) to drive card-level decisions.

**Engine fix (most impactful)**:

`lastStand` was implemented as a 5 HP/turn bleed — i.e., a *curse*, not a buff. ZS2 (which grants lastStand) had 45.9% WR because picking it actively hurt the player. Changed to a one-shot revive: when a player is about to drop to 0 HP and `lastStand > 0`, set HP to 1 and consume the status.

```diff
- if (player.statuses.lastStand > 0) {
-   healthDelta -= LAST_STAND_BLEED;
-   player.statuses.lastStand -= 1;
- }
+ // tickStartOfTurn no longer touches lastStand
+ // checkEliminations() now calls consumeLastStandIfLethal() before marking dead
```

**Card tuning** (5k-game per-card win contribution):

| Card | Pre WR | Post WR | Change | Why |
|---|---|---|---|---|
| PS2 | 77.6% | 66.6% | AoE 90 power / 100% prob → 50 / 80%; points 30 → 25 | Best card by 7pp |
| HP2 | 71.0% | 57.8% | invulnerable 3 turns → 1 turn; points 20 → 15 | 3 turns of 90% damage block warped fights |
| AT2 | 66.2% | 69.8% | prob 100% → 90% | Marginal tuning, accepted |
| HD3 | 64.8% | 64.6% | tier powers 25/25/25 → 20/20/20 | Tier-3 hit too hard |
| HP3 | 44.3% | 48.6% | non-STAB path -10 stats → +5 stats | Was a bait card |
| AT4 | 45.3% | 50.6% | added +affinity alongside +charm | Was useless on most builds |
| HD4 | 33.4% | 46.1% | removed -50 HP self-cost | Worst card, cost > benefit |

**God tuning** (rotated 10k-game runs, after 7 sub-iterations):

| God | Original | v1 (post-iter) | v2 final | Net change |
|---|---|---|---|---|
| Zeus | 340 / 150 / 100 | 340 / 150 / 100 | 325 / 138 / 100 | -15 HP, -12 STR |
| Hephaestus | **360 / 100 / 170** | 320 / 100 / 135 | 320 / 105 / 140 | -40 HP, +5 STR, -30 DEF |
| Aphrodite | 320 / 100 / 100 | 320 / 100 / 100 | 318 / 102 / 100 | flat |
| Athena | **260** / 150 / 100 | 310 / 150 / 110 | 308 / 142 / 105 | +48 HP, -8 STR |
| Hades | 300 / 120 / **90** | 320 / 130 / 105 | 325 / 138 / 110 | +25 HP, +18 STR, +20 DEF |
| Poseidon | 300 / 100 / 140 | 300 / 100 / 140 | 300 / 102 / 125 | -15 DEF, +2 STR |

(Format: HP / STR / DEF.)

**Why so many sub-iterations:** the rivalry graph creates rival pairs (Zeus↔Hephaestus, Aphrodite↔Athena, Hades↔Poseidon) where buffing one nerfs the other. Hit ~45/55 → 55/45 oscillation 4 times before dampening to within ±2pp.

**Final convergence (rotated 10k):**
```
zeus       50.9%
hephaestus 49.1%
aphrodite  49.2%
athena     50.8%
hades      50.1%
poseidon   49.9%
```

Spread: **1.8pp** across all gods.

**Caveat**: head-to-head 1500-game forced matrix still shows 8.5pp spread (Zeus 44.9 ↔ Athena 53.4) because individual rivalries don't average. This is structural to the rule and not fixable by stat tuning.

---

## v1 — 2026-04-25 — initial god-stat tune

**Context**: First simulator run (5k games, 2 players, mixed strategies) showed:
```
Hephaestus  74.7%
Zeus        53.1%
Poseidon    52.3%
Aphrodite   50.0%
Athena      35.3%
Hades       34.5%
```
40.2pp spread. Hephaestus's 360 HP / 170 DEF tank was untouchable; Athena's 260 HP and Hades's 90 DEF were too fragile.

**Changes**:
- Hephaestus: 360→320 HP, 170→135 DEF
- Athena: 260→310 HP, 100→110 DEF, 120→130 SPD
- Hades: 300→320 HP, 90→105 DEF, 120→130 STR

**Result**: 43.7%–55.5% range (11.8pp). Within target band but had several problem matchups (Athena vs Hades 60.4/39.6, Hades vs Poseidon 40.8/59.2). Set up v2 for finer tuning.

---

## v0 — 2026-04-25 — port from server.js

**Context**: Initial engine port from the original `server.js` reference implementation. Preserved card values as-is except for a few obvious bugs:

| Issue | Original | Ported as |
|---|---|---|
| AT1 computed damage but never applied it | no-op | applies damage |
| AT4 empty | no effect | minor +charm buff |
| HD2 empty | no effect | minor +strength buff |
| AP3 set selectedGod=-1 | corrupted state | no-op (flagged TODO_GDD) |
| HP/AT rivalCards self-rivalry typos | `HP: [0,1]`, `AT: [3,5]` | `HP: [zeus, aphrodite]`, `AT: [aphrodite, poseidon]` (per GDD lore) |
| AT2/PS2 client-supplied damage | exploit | server-computed |
