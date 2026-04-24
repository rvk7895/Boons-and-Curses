import { create } from "zustand";
import type { Room } from "../net/api";

export type VisibleGameState = {
  version: number;
  phase: "lobby" | "godSelect" | "building" | "fighting" | "ended";
  turnOrder: string[];
  activePlayerIdx: number;
  round: number;
  winner: string | null;
  deckSize: number;
  config: unknown;
  log: unknown[];
  discard: string[];
  players: Array<{
    id: string;
    name: string;
    god: string | null;
    stats: Record<string, number>;
    maxHealth: number;
    statuses: Record<string, number>;
    hand: string[] | null;
    handSize: number;
    points: number;
    alive: boolean;
    eliminatedAt: number | null;
    pendingDraw: { cardId: string; diceRoll: number } | null;
  }>;
};

type GameStore = {
  room: Room | null;
  myPlayerId: string | null;
  myRole: "PLAYER" | "SPECTATOR" | null;
  state: VisibleGameState | null;
  setRoom: (room: Room | null) => void;
  setYouAre: (playerId: string | null, role: "PLAYER" | "SPECTATOR" | null) => void;
  setState: (s: VisibleGameState | null) => void;
  reset: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  myPlayerId: null,
  myRole: null,
  state: null,
  setRoom: (room) => set({ room }),
  setYouAre: (myPlayerId, myRole) => set({ myPlayerId, myRole }),
  setState: (state) => set({ state }),
  reset: () => set({ room: null, myPlayerId: null, myRole: null, state: null }),
}));
