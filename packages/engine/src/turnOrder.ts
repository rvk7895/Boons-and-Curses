import type { GameState, PlayerId, PlayerState } from "@bc/shared";

export function computeFightingTurnOrder(players: PlayerState[]): PlayerId[] {
  return players
    .filter((p) => p.alive)
    .slice()
    .sort((a, b) => {
      if (b.stats.speed !== a.stats.speed) return b.stats.speed - a.stats.speed;
      return a.id.localeCompare(b.id);
    })
    .map((p) => p.id);
}

export function advanceTurn(state: GameState): void {
  state.activePlayerIdx = (state.activePlayerIdx + 1) % state.turnOrder.length;
  if (state.activePlayerIdx === 0) state.round += 1;
}

export function getActivePlayer(state: GameState): PlayerState | null {
  const id = state.turnOrder[state.activePlayerIdx];
  if (!id) return null;
  return state.players.find((p) => p.id === id) ?? null;
}
