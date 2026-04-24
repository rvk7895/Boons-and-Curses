import { Rng } from "@bc/engine";
import type { Action, GameState, PlayerId } from "@bc/shared";
import type { Strategy } from "../strategy.js";

export class RandomStrategy implements Strategy {
  public readonly name = "random";
  private rng: Rng;

  constructor(seed: string) {
    this.rng = new Rng(seed);
  }

  pickAction(_state: GameState, _playerId: PlayerId, legal: Action[]): Action {
    if (legal.length === 0) {
      throw new Error("RandomStrategy: no legal actions");
    }
    return this.rng.pick(legal);
  }
}
