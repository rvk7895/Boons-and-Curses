import type { GameState, PlayerId, PlayerState } from "@bc/shared";

export type VisibleGameState = Omit<GameState, "players" | "deck" | "rngState" | "rngSeed"> & {
  players: VisiblePlayer[];
  deckSize: number;
};

export type VisiblePlayer = Omit<PlayerState, "hand" | "pendingDraw"> & {
  hand: string[] | null;
  handSize: number;
  pendingDraw: PlayerState["pendingDraw"];
};

export function filterStateFor(state: GameState, viewerPlayerId: PlayerId | null): VisibleGameState {
  const players: VisiblePlayer[] = state.players.map((p) => {
    const isSelf = p.id === viewerPlayerId;
    return {
      ...p,
      hand: isSelf ? p.hand.slice() : null,
      handSize: p.hand.length,
      pendingDraw: isSelf ? p.pendingDraw : null,
    };
  });
  return {
    version: state.version,
    phase: state.phase,
    turnOrder: state.turnOrder,
    activePlayerIdx: state.activePlayerIdx,
    round: state.round,
    config: state.config,
    winner: state.winner,
    log: state.log,
    discard: state.discard,
    players,
    deckSize: state.deck.length,
  };
}
