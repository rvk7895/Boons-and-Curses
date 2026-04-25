import type { CardId } from "./cards.js";
import type { GodId, StatKey } from "./gods.js";
import type { StatusKey } from "./effects.js";

export type PlayerId = string;

export type Phase = "lobby" | "godSelect" | "building" | "fighting" | "ended";

export type StatusState = Record<StatusKey, number>;

export type PendingDraw = {
  cardId: CardId;
  diceRoll: number;
};

export type PlayerState = {
  id: PlayerId;
  name: string;
  god: GodId | null;
  stats: Record<StatKey, number>;
  maxHealth: number;
  statuses: StatusState;
  hand: CardId[];
  buffsPlayed: CardId[];
  points: number;
  alive: boolean;
  eliminatedAt: number | null;
  pendingDraw: PendingDraw | null;
};

export type GameConfig = {
  pointThreshold: number;
  maxAttackCardsInHand: number;
  maxHiddenCards: number;
  buildingRoundCap: number;
  fightingRoundCap: number;
  deckMultiplier: number;
};

export const DEFAULT_CONFIG: GameConfig = {
  pointThreshold: 120,
  maxAttackCardsInHand: 4,
  maxHiddenCards: 4,
  buildingRoundCap: 60,
  fightingRoundCap: 60,
  deckMultiplier: 2,
};

export type GameState = {
  version: number;
  phase: Phase;
  players: PlayerState[];
  turnOrder: PlayerId[];
  activePlayerIdx: number;
  round: number;
  deck: CardId[];
  discard: CardId[];
  rngSeed: string;
  rngState: string;
  config: GameConfig;
  winner: PlayerId | null;
  log: GameEvent[];
};

export type GameEvent =
  | { kind: "phaseChanged"; phase: Phase; round: number }
  | { kind: "godSelected"; playerId: PlayerId; god: GodId }
  | { kind: "cardDrawn"; playerId: PlayerId; cardId: CardId }
  | { kind: "buffPlayed"; playerId: PlayerId; cardId: CardId; diceRoll: number }
  | { kind: "attackPlayed"; playerId: PlayerId; cardId: CardId; targetId: PlayerId | null; damage: number }
  | { kind: "statusTick"; playerId: PlayerId; status: StatusKey; delta: number }
  | { kind: "playerEliminated"; playerId: PlayerId }
  | { kind: "thresholdReached"; playerId: PlayerId; points: number }
  | { kind: "gameEnded"; winner: PlayerId | null };
