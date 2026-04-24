import type { CardId, GodId, Phase, StatusKey } from "@bc/shared";
import { create } from "zustand";
import type { Room } from "../net/api";

export type VisiblePlayer = {
  id: string;
  name: string;
  god: GodId | null;
  stats: { health: number; strength: number; defense: number; speed: number; charm: number; affinity: number };
  maxHealth: number;
  statuses: Record<StatusKey, number>;
  hand: CardId[] | null;
  handSize: number;
  points: number;
  alive: boolean;
  eliminatedAt: number | null;
  pendingDraw: { cardId: CardId; diceRoll: number } | null;
};

export type VisibleGameState = {
  version: number;
  phase: Phase;
  turnOrder: string[];
  activePlayerIdx: number;
  round: number;
  winner: string | null;
  deckSize: number;
  config: unknown;
  log: unknown[];
  discard: CardId[];
  players: VisiblePlayer[];
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
