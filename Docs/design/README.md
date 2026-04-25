# Design notes

Living design artifacts for **Boons & Curses**. This is the sibling of the codebase, kept under version control so design changes have history and rationale.

The GDD in the parent `Docs/` directory describes the *original* tabletop design. These files describe what we **learned** while implementing it — what holds up, what doesn't, and what to change.

## Files

| File | What it is | Refresh cadence |
|---|---|---|
| `01-honest-assessment.md` | A frank critique of the game design, written after building the engine and running ~50k simulated games. Strengths, weaknesses, and the comparison to other genres. | Manual; revisit after major design changes. |
| `02-balance-log.md` | Chronological record of every god/card tuning iteration with the data that drove it. Future tuners read this before touching numbers. | Append-only; one entry per balance pass. |
| `03-roadmap.md` | Prioritized list of design and implementation work, with rationale linked to the assessment and balance log. | Manual; reorder when priorities change. |
| `04-card-catalog.md` | Current cards with their numbers, schools, intended role, and known issues. Authoritative reference for tuners. | Update when a card changes. |
| `05-current-metrics.md` | Auto-generated. Per-god win rate (rotated random matchups) and per-card win contribution from a fresh 10k-game simulation. | `./run.sh report` regenerates. Don't hand-edit. |

## Refreshing the metrics

```bash
./run.sh report                    # 10k games, default seed
./run.sh report --games 50000      # higher fidelity
./run.sh report --seed 2026-01     # version a snapshot
```

The report writes to `Docs/design/05-current-metrics.md`. Commit the regenerated file when you ship a balance change so the history captures the "before" and "after."

## Why this directory exists

Game balance is a long-running negotiation between rules and reality. Without a paper trail, future contributors will re-run the same tuning experiments and re-discover the same things. The docs here exist to preserve the reasoning behind every number, so the next person can either build on it or dismiss it knowingly — but not blindly.
