import { Rng } from "@bc/engine";
import { CARDS, type Action, type GameState, type PlayerId, type PlayerState } from "@bc/shared";
import type { Strategy } from "../strategy.js";

export class GreedyStrategy implements Strategy {
  public readonly name = "greedy";
  private rng: Rng;

  constructor(seed: string) {
    this.rng = new Rng(seed);
  }

  pickAction(state: GameState, playerId: PlayerId, legal: Action[]): Action {
    if (legal.length === 0) throw new Error("GreedyStrategy: no legal actions");

    if (state.phase === "godSelect") {
      const prefer: Record<string, number> = {
        hephaestus: 5,
        zeus: 4,
        poseidon: 4,
        aphrodite: 3,
        hades: 3,
        athena: 2,
      };
      const scored = legal
        .filter((a) => a.kind === "selectGod")
        .map((a) => ({ a, score: prefer[a.kind === "selectGod" ? a.god : ""] ?? 0 }));
      scored.sort((x, y) => y.score - x.score);
      return scored[0]?.a ?? this.rng.pick(legal);
    }

    if (state.phase === "building") {
      const resolveActions = legal.filter((a) => a.kind === "resolveDraw");
      if (resolveActions.length === 0) return this.rng.pick(legal);
      const self = state.players.find((p) => p.id === playerId);
      if (!self?.pendingDraw) return this.rng.pick(legal);
      const card = CARDS[self.pendingDraw.cardId];
      const diceGood = self.pendingDraw.diceRoll >= 3;
      const handFull = self.hand.length >= state.config.maxAttackCardsInHand;
      const keep = card.kind === "attack" ? !handFull : diceGood || card.points >= 20;
      return keep
        ? resolveActions.find((a) => a.kind === "resolveDraw" && a.keep) ?? resolveActions[0]!
        : resolveActions.find((a) => a.kind === "resolveDraw" && !a.keep) ?? resolveActions[0]!;
    }

    if (state.phase === "fighting") {
      const self = state.players.find((p) => p.id === playerId);
      if (!self) return this.rng.pick(legal);
      const attackActions = legal.filter((a) => a.kind === "playAttack");
      if (attackActions.length === 0) return legal[0]!;

      const scored = attackActions.map((a) => {
        if (a.kind !== "playAttack") return { a, score: 0 };
        const card = CARDS[a.cardId];
        let score = 0;
        for (const e of card.effects) {
          if (e.kind === "damage") score += e.power * (e.probability / 100);
          if (e.kind === "aoeDamage") score += e.powerDividedByOpponents * 0.5;
          if (e.kind === "lifesteal") score += 10;
          if (e.kind === "applyStatusOpp" && e.status === "burn") score += 15;
          if (e.kind === "selfHeal") score += e.amount * 0.5;
        }
        if (card.god === self.god) score *= 1.25;
        if (a.targetId) {
          const target = state.players.find((p) => p.id === a.targetId);
          if (target) {
            const hpFrac = target.stats.health / Math.max(1, target.maxHealth);
            score += (1 - hpFrac) * 30;
          }
        }
        return { a, score };
      });
      scored.sort((x, y) => y.score - x.score);
      return scored[0]?.a ?? this.rng.pick(legal);
    }

    return this.rng.pick(legal);
  }
}

export function strongestTarget(state: GameState, self: PlayerState): PlayerState | null {
  const opponents = state.players.filter((p) => p.alive && p.id !== self.id);
  if (opponents.length === 0) return null;
  return opponents.slice().sort((a, b) => b.stats.health - a.stats.health)[0] ?? null;
}
