export const GOD_IDS = [
  "zeus",
  "hephaestus",
  "aphrodite",
  "athena",
  "hades",
  "poseidon",
] as const;

export type GodId = (typeof GOD_IDS)[number];

export const STAT_KEYS = [
  "health",
  "strength",
  "defense",
  "speed",
  "charm",
  "affinity",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type StatBlock = Record<StatKey, number>;

export type GodDef = {
  id: GodId;
  baseStats: StatBlock;
  maxHealth: number;
};

export const GODS: Record<GodId, GodDef> = {
  zeus: {
    id: "zeus",
    maxHealth: 325,
    baseStats: { health: 325, strength: 138, defense: 100, speed: 110, charm: 10, affinity: -10 },
  },
  hephaestus: {
    id: "hephaestus",
    maxHealth: 320,
    baseStats: { health: 320, strength: 105, defense: 140, speed: 100, charm: -40, affinity: 0 },
  },
  aphrodite: {
    id: "aphrodite",
    maxHealth: 318,
    baseStats: { health: 318, strength: 102, defense: 100, speed: 110, charm: 50, affinity: 30 },
  },
  athena: {
    id: "athena",
    maxHealth: 308,
    baseStats: { health: 308, strength: 142, defense: 105, speed: 130, charm: 0, affinity: 20 },
  },
  hades: {
    id: "hades",
    maxHealth: 325,
    baseStats: { health: 325, strength: 138, defense: 110, speed: 140, charm: 40, affinity: 0 },
  },
  poseidon: {
    id: "poseidon",
    maxHealth: 300,
    baseStats: { health: 300, strength: 102, defense: 125, speed: 100, charm: 0, affinity: 40 },
  },
};

export function getGod(id: GodId): GodDef {
  return GODS[id];
}
