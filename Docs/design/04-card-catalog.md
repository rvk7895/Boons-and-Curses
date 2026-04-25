# Card catalog

Authoritative reference for the 24 cards as currently tuned (post v2 balance). Numbers here mirror `packages/shared/src/cards.ts` — update both together.

Format:
- **kind**: `attack` (used in fighting phase, needs target) | `buff` (used in building phase, self-effect)
- **points**: contribution toward end-of-building threshold
- **WR%**: per-card win contribution from a 10k-game rotated simulation. ~50% is neutral; >60% means the card disproportionately appears in winning hands.

---

## Zeus (ZS) — sky / thunder generalist

| ID | Kind | Pts | Effect | WR% | Notes |
|---|---|---|---|---|---|
| **ZS1** | attack | 20 | 30 dmg @ 100% | 63.4% | Reliable single-target finisher |
| **ZS2** | buff  | 15 | Last Stand: survive lethal once | 46.3% | Was bugged as -5HP/turn; fixed v2 |
| **ZS3** | buff  | 20 | +20 STR / +20 DEF / -10 SPD (STAB-scaled) | 54.4% | Build-shaping defensive buff |
| **ZS4** | buff  | 15 | Heal 30 (STAB-scaled) | 47.7% | Underused; deep-build recovery |

## Hephaestus (HP) — forge / fire tank

| ID | Kind | Pts | Effect | WR% | Notes |
|---|---|---|---|---|---|
| **HP1** | attack | 15 | 10 dmg @ 100% + 50% chance burn (3t) | 58.0% | DoT setup |
| **HP2** | buff  | 15 | Invulnerable 1 turn | 57.8% | Was 3t pre-v2 (71% WR — overpowered) |
| **HP3** | buff  | 20 | If STAB: +10 STR/DEF; else +5 STR/DEF | 48.6% | Was a bait card pre-v2 |
| **HP4** | buff  | 20 | +10 DEF + Blacksmith (10% burn proc per attack) | 51.8% | Synergy bait for HP1 |

## Aphrodite (AP) — charm / control

| ID | Kind | Pts | Effect | WR% | Notes |
|---|---|---|---|---|---|
| **AP1** | attack | 25 | 30 dmg @ 90% + lifesteal 50% of dmg dealt | 65.5% | Best Aphrodite card |
| **AP2** | attack | 20 | +10 SPD self / -10 DEF + -10 AFF opp | 51.0% | Multi-stat disrupt |
| **AP3** | buff  | 10 | Clear self god (intentionally weird per GDD) | 46.2% | TODO_GDD: reinterpret? |
| **AP4** | buff  | 15 | +30 AFF (no scale) | 58.1% | Damage scaling enabler |

## Athena (AT) — strategist

| ID | Kind | Pts | Effect | WR% | Notes |
|---|---|---|---|---|---|
| **AT1** | attack | 25 | 40 dmg @ 90% | 64.9% | Was a no-op pre-v2 (damage computed but never applied) |
| **AT2** | attack | 25 | 50 dmg @ 90% | 69.8% | Highest single WR — flat heavy hit |
| **AT3** | buff  | 15 | +10 DEF / +10 SPD (STAB-scaled) | 47.0% | Generic prep |
| **AT4** | buff  | 10 | +20 CHM / +10 AFF | 50.6% | Was empty pre-port |

## Hades (HD) — gambler

| ID | Kind | Pts | Effect | WR% | Notes |
|---|---|---|---|---|---|
| **HD1** | attack | 25 | 35 dmg @ 95% | 65.0% | Stable damage |
| **HD2** | buff  | 15 | +15 STR (STAB-scaled) | 51.0% | Was empty pre-port |
| **HD3** | attack | 25 | 20 dmg @ 100% + 20 @ 50% + 20 @ 25% | 64.6% | Variable; expected ~35 dmg |
| **HD4** | buff  | 15 | +20 CHM / +20 SPD (STAB-scaled) | 46.1% | Pre-v2 had -50 HP cost (33% WR) |

## Poseidon (PS) — sea / area-control

| ID | Kind | Pts | Effect | WR% | Notes |
|---|---|---|---|---|---|
| **PS1** | attack | 25 | 50 dmg @ 80% | 68.2% | High variance, high ceiling |
| **PS2** | attack | 25 | AoE 50 power / 80% prob, divided by alive opponents + clears their statuses | 66.6% | Pre-v2 was 90/100% (77.6% WR — overpowered) |
| **PS3** | buff  | 15 | +30 SPD (STAB-scaled) | 46.0% | Build SPD lead |
| **PS4** | buff  | 15 | +30 SPD (STAB-scaled) | 45.9% | **Duplicate of PS3 — needs differentiation** |

---

## Known design issues

1. **PS3 / PS4 are identical** — preserved from `server.js` original. Top P1 fix: differentiate (e.g., PS3 +SPD self / PS4 -SPD opponent).
2. **AP3 ("clears self god") is intentionally weird per GDD** but lands as confusing in play. Reinterpretation candidates: "set self god to neutral for one round" (lose STAB but also lose rivalry penalty).
3. **AT4 / HD2 / AT1** were broken/empty in the source `server.js`. Current implementations are best-guess — original team should sanity-check.
4. **PS2** is the AoE finisher; even at 50/80% it's the second-strongest card. May still want a small cooldown / "once-per-game" constraint if it dominates skilled play.

## Authoring guidelines (for future card design)

- **Buff target WR**: 45–55%. Higher means the card is build-warping; lower means it's filler.
- **Attack target WR**: 55–65%. Damage cards naturally win more (they reduce opponents' HP, which trends toward winning), but >70% means the card is too efficient.
- **Pick rate** (`plays / games / players`): all cards should land between 18–22% with random play. <15% means the card is being culled too often; >25% means players never discard.
- **Effect distinctness**: avoid "card X is card Y but with bigger numbers." Each card should have one unique mechanic.
