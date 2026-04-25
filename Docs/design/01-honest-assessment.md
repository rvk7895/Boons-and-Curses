# Honest design assessment

*Written 2026-04-25, after building the engine and running ~50,000 simulated games across multiple strategies and tuning iterations.*

## TL;DR

Boons & Curses is a **solid casual game with a strong thematic hook**, hampered by **shallow combat agency** and a **dice-as-decoration** building phase. The two-phase structure is its best idea. The companion-app dependency is the cost of the stat-multiplier math; simpler combat math would let it stand on its own. The biggest single design lever is implementing the GDD-spec'd "two boons + two curses, dice picks the pair" buff mechanic, which currently exists only as flavor.

---

## Strengths

### Two-phase structure is genuinely good

Separating deck-building from combat is the rare card-game move that gives both phases real identity. Building rewards anticipation (what champion am I assembling, knowing the deck is shared); fighting rewards execution. Most card games conflate the two and end up with neither feeling distinct.

### Dice as magnitude, not outcome

A d4 that scales an effect (0.5×–1.25×) injects variance without creating "I rolled a 1, my turn is over" moments. The decision is still real — keep at low magnitude or discard — and the floor on a bad roll is "the buff barely matters" rather than "the buff hurts you." This is a more grown-up RNG model than most introductory card games use.

### Mythology + STAB/rivalry gives each god a real identity

The six-god roster is well-chosen: stat archetypes are distinct (Hephaestus tank, Hades glass-cannon, Aphrodite control), the lore-driven rivalries (Zeus exiled Hephaestus; Athena hates Aphrodite) feel earned rather than tacked-on. The STAB system (1.25× for matching schools, 0.75×/1.25× for rival opponents) is a mechanically interesting way to operationalize that flavor.

### Companion-app-as-calculator was the right pivot

The original GDD had the app as a full simulator. Section 9 records the team noticing this conflicted with "card-centric" play and pivoting to a calculator model. That instinct was correct — keeping the cards on the table preserves the social texture of a tabletop game. The GDD team gets credit for noticing this in self-review.

---

## Weaknesses

### Combat has shallow agency

Strategy bake-off (5,000 games, 4 players, all gods rotated):

| Strategy A | Strategy B | A wins |
|---|---|---|
| greedy | random | ~60% |
| greedy | greedy | ~50% |
| random | random | ~50% |

A 60/40 ceiling for a "smart" strategy is low. In Magic: The Gathering it would be 90/10. In chess it's effectively 100/0. With a 4-card hand and most cards being "deal X damage to player Y," combat decisions reduce to "play your highest-EV card at the lowest-HP opponent." There isn't much depth available.

**Why:** combat has no information game. Hands are hidden but the decision space is small. There's no resource curve (all cards are equally playable from turn 1), no positional value, and no way to bait or punish a play.

### The dice-pick decision in building is barely a decision

The GDD specifies each buff card has *two boons and two curses*, with a d4 picking the boon-curse pair. That mechanic has weight: a player with a good build might keep a boon they wanted plus a curse they can absorb; a player on the back foot might discard. Decisions vary by game-state.

In code, we couldn't invent four-faceted content per card without the team's input, so we shipped a single-effect-per-card model with the dice as a magnitude scalar. Result: optimal play is "always keep unless you rolled 1." The dice is decoration. Building turns are mostly mechanical.

**The single highest-value design change** is implementing the GDD-spec'd boon/curse pairs with hand-authored content. That alone would probably lift building from bookkeeping to gameplay.

### STAB + rivalries create structural matchup imbalance

After seven balance iterations, the head-to-head matrix still shows ~8–10pp spread in some pairings (Zeus vs. Athena landed at 42.7/57.3 even at the final tune). The rivalry graph is a fixed power topology — you can move stats around but you can't make every 1v1 fair without gutting the rivalry rule itself.

In **rotated random matchups** (the actual game with 2–4 players drawing random gods) the spread closes to 1.8pp, which is fine. So this is mostly an artifact of forced 1v1 testing rather than a real-game problem. Still worth noting that "X is stronger against Y" is baked in by design, and that's a feature for replay variety, not a bug.

### Card design is under-baked relative to the system around it

The original implementation had:
- **PS3 and PS4 identical** (+30 speed each, no other difference)
- **AT4 and HD2 empty** (no effect at all)
- **AP3 corrupted state** (set selectedGod = -1, broke god-indexing downstream)
- **AT1 computed damage but never applied it** (a no-op in practice)
- **AT2 / PS2 trusted client-supplied damage** (a security hole, not a design issue, but indicative)

Compared to the careful god lore and the system architecture, the cards feel placeholder. A pass with a card-design lens — one that asks "what's the *fantasy* of playing this card?" rather than "what numbers does it modify?" — would help.

### The point-threshold pacing has a feel-bad mode

First-to-threshold ends the building phase. This creates two pacing failure modes:
1. **Rusher**: one player floors the gas to threshold, short-circuiting everyone else's build.
2. **Hover**: everyone notices (1) and stalls just below threshold, dragging the phase.

Either way, the threshold incentivizes a non-fun pacing strategy. Two cleaner alternatives:
- **Deck exhaustion**: phase ends when the shared deck runs out (gives everyone the same build budget).
- **Round-cap**: phase ends after N rounds.

Both are easy to add (the engine already supports a `buildingRoundCap` config).

### Game length is long for the format

Average game with the v2-balanced numbers: ~25 building rounds + ~60 fighting rounds = 85 rounds total, with phone-mediated bookkeeping each turn. Tabletop time estimate: 45–90 minutes. Most casual card games target 20–40. Either trim the deck (fewer building rounds) or simplify combat (faster fighting), or both.

### Companion-app dependency is friction

The companion app exists because the math is too complex for tabletop. That's a real engineering constraint but also a design smell: the math wants simpler. Affinity-as-percentage-modifier is the worst offender — it forces every damage calculation through a non-integer multiply. If affinity were a flat ±10 to damage rolls, the whole game could run with paper and a d20.

---

## Comparison to genre

| Game | Closest in… | Closest not in… |
|---|---|---|
| **Munchkin** | Tone, RNG tolerance, social texture | Build coherence — Munchkin builds are throwaway |
| **Hearthstone** | 2-phase mana ramp + combat | Information structure — Hearthstone is open-board |
| **Magic: the Gathering** | God identity → "color identity" | Card depth — MTG cards have multi-vector decisions |
| **Dominion** | Deckbuilding loop intent | Per-turn meaning — Dominion makes every turn matter |

**Closest single comparable: Munchkin with a Greek-mythology coat of paint and a more interesting build phase.** That's a fine product. The risk is when you market it as deeper than that — it's not. Lean into "30-minute social card game" and it lands; lean into "strategic mythology combat" and the gap shows.

---

## Verdict

- **As a casual game for a friend group?** Solid. Mythology + dice-tactility + companion-app gimmick make it fun for 4 people at a table.
- **As a deep strategy game?** No. Combat agency is too low and the build phase isn't quite engaging enough to support it.
- **As a published product?** Not yet. Implement the boon/curse pair mechanic, do a card-design pass, simplify the math, and it's there.

## What I'd change first, in order

1. **Implement the GDD's boon/curse pair mechanic**. Single biggest leverage point.
2. **Card design pass**. Make each card a small fantasy, not a stat-modifier.
3. **Simplify damage math** (flat integers, ditch affinity-as-percentage). Eliminates app dependency for a smaller-scope variant.
4. **Replace point-threshold with deck-exhaustion or round-cap**. Removes pacing failure mode.
5. **Add card-level depth**: combo synergies, conditional effects, cost-vs-power tradeoffs. The current cards are too one-dimensional.

See [03-roadmap.md](./03-roadmap.md) for the prioritized work list.
