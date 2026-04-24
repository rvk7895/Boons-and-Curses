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
    maxHealth: 340,
    baseStats: { health: 340, strength: 150, defense: 100, speed: 110, charm: 10, affinity: -10 },
  },
  hephaestus: {
    id: "hephaestus",
    maxHealth: 360,
    baseStats: { health: 360, strength: 100, defense: 170, speed: 100, charm: -40, affinity: 0 },
  },
  aphrodite: {
    id: "aphrodite",
    maxHealth: 320,
    baseStats: { health: 320, strength: 100, defense: 100, speed: 110, charm: 50, affinity: 30 },
  },
  athena: {
    id: "athena",
    maxHealth: 260,
    baseStats: { health: 260, strength: 150, defense: 100, speed: 120, charm: 0, affinity: 20 },
  },
  hades: {
    id: "hades",
    maxHealth: 300,
    baseStats: { health: 300, strength: 120, defense: 90, speed: 140, charm: 40, affinity: 0 },
  },
  poseidon: {
    id: "poseidon",
    maxHealth: 300,
    baseStats: { health: 300, strength: 100, defense: 140, speed: 100, charm: 0, affinity: 50 },
  },
};

export function getGod(id: GodId): GodDef {
  return GODS[id];
}
