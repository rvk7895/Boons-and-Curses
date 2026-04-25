import {
  CARD_IDS,
  DEFAULT_CONFIG,
  type CardId,
  type GameConfig,
  type GameState,
  type PlayerId,
  type PlayerState,
  type StatusKey,
} from "@bc/shared";
import { Rng } from "./rng.js";

export type PlayerSeed = {
  id: PlayerId;
  name: string;
};

export function createGame(
  seed: string,
  playerSeeds: PlayerSeed[],
  configOverrides?: Partial<GameConfig>,
): GameState {
  if (playerSeeds.length < 2 || playerSeeds.length > 4) {
    throw new Error("createGame requires 2-4 players");
  }
  const config: GameConfig = { ...DEFAULT_CONFIG, ...configOverrides };
  const rng = new Rng(seed);

  const players: PlayerState[] = playerSeeds.map((p) => ({
    id: p.id,
    name: p.name,
    god: null,
    stats: { health: 0, strength: 0, defense: 0, speed: 0, charm: 0, affinity: 0 },
    maxHealth: 0,
    statuses: emptyStatuses(),
    hand: [],
    buffsPlayed: [],
    points: 0,
    alive: true,
    eliminatedAt: null,
    pendingDraw: null,
  }));

  const deck = buildDeck(rng, config.deckMultiplier);

  return {
    version: 0,
    phase: "godSelect",
    players,
    turnOrder: players.map((p) => p.id),
    activePlayerIdx: 0,
    round: 1,
    deck,
    discard: [],
    rngSeed: seed,
    rngState: rng.getState(),
    config,
    winner: null,
    log: [{ kind: "phaseChanged", phase: "godSelect", round: 1 }],
  };
}

export function buildDeck(rng: Rng, multiplier: number): CardId[] {
  const baseDeck: CardId[] = [];
  for (let i = 0; i < multiplier; i++) {
    for (const id of CARD_IDS) baseDeck.push(id);
  }
  return rng.shuffle(baseDeck);
}

function emptyStatuses(): Record<StatusKey, number> {
  return { burn: 0, invulnerable: 0, lastStand: 0, blacksmith: 0 };
}
