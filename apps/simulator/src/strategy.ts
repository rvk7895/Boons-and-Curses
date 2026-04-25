import type { Action, GameState, PlayerId } from "@bc/shared";

export interface Strategy {
  name: string;
  pickAction(state: GameState, playerId: PlayerId, legal: Action[]): Action;
}
