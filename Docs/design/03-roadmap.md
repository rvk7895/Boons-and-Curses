# Roadmap

Prioritized work list for the next iteration. Each item links to the assessment that justifies it. Order is from highest leverage on game quality to lowest.

Legend: **S/M/L** = effort, ★/★★/★★★ = expected impact on game feel.

---

## P0 — Boon/curse pair mechanic per GDD ★★★ L

**Source**: [01-honest-assessment.md § The dice-pick decision in building is barely a decision](./01-honest-assessment.md#the-dice-pick-decision-in-building-is-barely-a-decision).

The GDD specifies each buff card carries **two boons and two curses**; the d4 roll picks one boon-curse pair (4 outcomes from 2×2). Currently every buff card has a single effect with the dice scaling magnitude. This is the highest-leverage design change available.

**What needs to happen:**
1. Author 2 boon effects + 2 curse effects per buff card (13 buff cards × 4 = 52 new effect rows).
2. Extend `CardDef` to optionally carry `boons: Effect[][]` + `curses: Effect[][]` for buffs.
3. Engine: building phase already rolls a d4. Add mapping `roll → (boonIdx, curseIdx)` and apply both effects.
4. UI: `BuildingView` shows the rolled boon + curse before the keep/discard decision.
5. Author content needs to feel distinct (not just "+5 vs +10"). Keep bonuses + drawbacks asymmetric.

**Why now**: makes building decisions actually interesting. Current building turns are mechanical.

---

## P1 — Card design pass with fantasy lens ★★★ L

**Source**: [01-honest-assessment.md § Card design is under-baked relative to the system around it](./01-honest-assessment.md#card-design-is-under-baked-relative-to-the-system-around-it).

Most cards are "+N to stat X" or "deal N damage with P% probability." There are 24 cards but only ~5 distinct effect shapes. Each card should have a small fantasy.

**Examples to aim for**:
- ZS3 ("Thunderbolt"): instead of generic +str/+def, "your next attack chains to a second target at 50% power"
- AP4 ("Charm"): instead of +30 affinity, "next opponent attack against you is redirected to a random other player"
- HD1 ("Veil of Death"): instead of damage, "remove a random card from target's hand"

**Process**: pair-design with someone fluent in the source mythology. Each card gets a one-sentence flavor line that drives its mechanic.

**Why P1**: makes the game feel premium rather than placeholder.

---

## P2 — Replace point-threshold with deck-exhaustion ★★ S

**Source**: [01-honest-assessment.md § The point-threshold pacing has a feel-bad mode](./01-honest-assessment.md#the-point-threshold-pacing-has-a-feel-bad-mode).

Building phase currently ends when the first player hits a point threshold. This rewards rushing or stall-hovering. Cleaner: end when the shared deck is exhausted (everyone gets the same number of build turns).

**Engine change**: in `reducer.ts:afterBuildingAction`, drop the threshold check, keep the deck-empty check.
**Config change**: `pointThreshold` becomes a soft signal for UI (progress toward end-of-deck), not a phase trigger.
**Tradeoff**: building phase becomes deterministic-length. That's a feature.

---

## P3 — Simplify combat math (flat integers) ★★ M

**Source**: [01-honest-assessment.md § Companion-app dependency is friction](./01-honest-assessment.md#companion-app-dependency-is-friction).

Affinity-as-percentage forces every damage calc through a multiply. Replace with flat ±10 modifier. Eliminates the strongest argument for needing the app.

**Resulting damage formula**: `damage = max(0, power × stab + strength_mod − defense_mod + affinity_diff)`.

**Effect**: a paper-only variant of the game becomes feasible (one die + a notepad). The app stays optional for richer animations and validation.

---

## P4 — Card-combo synergies ★★ M

**Source**: [01-honest-assessment.md § Combat has shallow agency](./01-honest-assessment.md#combat-has-shallow-agency).

Add 4–6 cards whose effect *depends on what's in your hand or buffs played*. Examples:

- "Phalanx" (HP): if you have Blacksmith active, deal 30 damage; otherwise, gain +20 def
- "Wisdom" (AT): if you have ≥3 buff cards played, draw an extra card next building turn
- "Dominion" (PS): if your speed > target's speed, attack ignores invulnerable

**Effect**: rewards build coherence over generic stacking. Combat decisions get richer.

---

## P5 — Mobile gameplay polish ★★ M

**Source**: implementation notes.

Now that the gameplay views work, several touch-ups would lift feel:
- Reanimated 3 for dice-roll animation, card-flip, damage-number tween
- Sound effects: card-play, dice-tick, hit, victory (need royalty-free pack)
- Haptics on critical actions (attack landed, you got hit)
- A "log feed" panel showing the last 10 events (current `state.log` is hidden)
- Better card art (real god illustrations, not just text labels)

---

## P6 — Spectator features ★ S

**Source**: present in the model but not surfaced in UI.

Spectator role is wired through the server (hand-hiding is correctly applied); the mobile app handles spectator state in `GodSelectView` only. Add:
- Spectator-friendly building view (show cards drawn but not whose hand)
- Spectator-friendly fighting view (no target picker, full board visibility)
- Spectator chat / reactions

---

## P7 — Reconnect UX ★ S

**Source**: implementation notes.

Server supports reconnect (snapshots persist; `joinRoom` re-fetches state). Client doesn't surface "you were disconnected, reconnecting…" or "lost connection, retrying." Add a connection-status indicator and graceful reconnect screens.

---

## P8 — Smarter strategies in simulator ★ M

**Source**: [01-honest-assessment.md § Combat has shallow agency](./01-honest-assessment.md#combat-has-shallow-agency).

Current strategies: random, greedy. Greedy beats random ~60/40 — too narrow a gap to confidently say "this is balanced for skilled play."

Add:
- **Lookahead-1**: simulate every legal action one ply deep, pick best
- **MCTS** (~1000 rollouts per decision): proper game-tree search
- **Heuristic**: encodes a play style (aggressive, defensive, control)

Re-run the balance pass with these. If random ≪ heuristic ≪ MCTS, the game has skill depth. If they cluster, it doesn't.

---

## P9 — Sentry + load test ★ S

**Source**: deferred from Phase 10 hardening.

Server has rate-limit and helmet but no error-tracking integration and no load-test data. Add:
- `@sentry/node` with `SENTRY_DSN` env var (no-op if absent)
- `@sentry/react-native` mobile-side
- Artillery script in `apps/server/loadtest/` simulating 500 concurrent rooms
- CI nightly job running the load test

---

## Discontinued / explicitly not doing

- **Live god re-pick mid-game** — adds complexity for a niche use case.
- **Public matchmaking lobby** — out of scope per user; private invite codes only.
- **Persistent accounts** — guest JWT serves the use case; can revisit.
- **NFT / on-chain anything** — no.
