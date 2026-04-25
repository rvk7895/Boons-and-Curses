import type { Effect } from "./effects.js";
import type { GodId } from "./gods.js";

export const CARD_PREFIXES = {
  ZS: "zeus",
  HP: "hephaestus",
  AP: "aphrodite",
  AT: "athena",
  HD: "hades",
  PS: "poseidon",
} as const satisfies Record<string, GodId>;

export type CardPrefix = keyof typeof CARD_PREFIXES;

export const CARD_IDS = [
  "ZS1", "ZS2", "ZS3", "ZS4",
  "HP1", "HP2", "HP3", "HP4",
  "AP1", "AP2", "AP3", "AP4",
  "AT1", "AT2", "AT3", "AT4",
  "HD1", "HD2", "HD3", "HD4",
  "PS1", "PS2", "PS3", "PS4",
] as const;

export type CardId = (typeof CARD_IDS)[number];

export type CardKind = "attack" | "buff";

export type CardDef = {
  id: CardId;
  prefix: CardPrefix;
  god: GodId;
  kind: CardKind;
  needsOpponent: boolean;
  points: number;
  effects: Effect[];
};

export const RIVAL_MAP: Record<CardPrefix, GodId[]> = {
  ZS: ["hephaestus", "hades"],
  HP: ["zeus", "aphrodite"],
  AP: ["hephaestus", "athena"],
  AT: ["aphrodite", "poseidon"],
  HD: ["zeus", "poseidon"],
  PS: ["athena", "hades"],
};

const attack = (
  id: CardId,
  prefix: CardPrefix,
  points: number,
  effects: Effect[],
  needsOpponent = true,
): CardDef => ({
  id,
  prefix,
  god: CARD_PREFIXES[prefix],
  kind: "attack",
  needsOpponent,
  points,
  effects,
});

const buff = (id: CardId, prefix: CardPrefix, points: number, effects: Effect[]): CardDef => ({
  id,
  prefix,
  god: CARD_PREFIXES[prefix],
  kind: "buff",
  needsOpponent: false,
  points,
  effects,
});

export const CARDS: Record<CardId, CardDef> = {
  ZS1: attack("ZS1", "ZS", 20, [
    { kind: "damage", power: 30, probability: 100 },
  ]),
  ZS2: buff("ZS2", "ZS", 15, [
    { kind: "applyStatusSelf", status: "lastStand", turns: 1 },
  ]),
  ZS3: buff("ZS3", "ZS", 20, [
    { kind: "selfStat", stat: "strength", delta: 20, stabScale: true, invStabScale: false },
    { kind: "selfStat", stat: "defense", delta: 20, stabScale: true, invStabScale: false },
    { kind: "selfStat", stat: "speed", delta: -10, stabScale: false, invStabScale: true },
  ]),
  ZS4: buff("ZS4", "ZS", 15, [
    { kind: "selfHeal", amount: 30 },
  ]),

  HP1: attack("HP1", "HP", 15, [
    { kind: "damage", power: 10, probability: 100 },
    { kind: "applyStatusOpp", status: "burn", turns: 3, chance: 50 },
  ]),
  HP2: buff("HP2", "HP", 15, [
    { kind: "applyStatusSelf", status: "invulnerable", turns: 1 },
  ]),
  HP3: buff("HP3", "HP", 20, [
    {
      kind: "conditionalStab",
      whenStab: [
        { kind: "selfStat", stat: "strength", delta: 10, stabScale: true, invStabScale: false },
        { kind: "selfStat", stat: "defense", delta: 10, stabScale: true, invStabScale: false },
      ],
      otherwise: [
        { kind: "selfStat", stat: "strength", delta: 5, stabScale: false, invStabScale: false },
        { kind: "selfStat", stat: "defense", delta: 5, stabScale: false, invStabScale: false },
      ],
    },
  ]),
  HP4: buff("HP4", "HP", 20, [
    { kind: "selfStat", stat: "defense", delta: 10, stabScale: true, invStabScale: false },
    { kind: "applyStatusSelf", status: "blacksmith", turns: 999 },
  ]),

  AP1: attack("AP1", "AP", 25, [
    { kind: "damage", power: 30, probability: 90 },
    { kind: "lifesteal", fraction: 0.5 },
  ]),
  AP2: attack("AP2", "AP", 20, [
    { kind: "selfStat", stat: "speed", delta: 10, stabScale: true, invStabScale: false },
    { kind: "oppStat", stat: "defense", delta: -10, stabScale: false, invStabScale: true },
    { kind: "oppStat", stat: "affinity", delta: -10, stabScale: false, invStabScale: false },
  ]),
  AP3: buff("AP3", "AP", 10, [
    { kind: "clearSelfGod" },
  ]),
  AP4: buff("AP4", "AP", 15, [
    { kind: "selfStat", stat: "affinity", delta: 30, stabScale: false, invStabScale: false },
  ]),

  AT1: attack("AT1", "AT", 25, [
    { kind: "damage", power: 40, probability: 90 },
  ]),
  AT2: attack("AT2", "AT", 25, [
    { kind: "damage", power: 50, probability: 90 },
  ]),
  AT3: buff("AT3", "AT", 15, [
    { kind: "selfStat", stat: "defense", delta: 10, stabScale: true, invStabScale: false },
    { kind: "selfStat", stat: "speed", delta: 10, stabScale: true, invStabScale: false },
  ]),
  AT4: buff("AT4", "AT", 10, [
    { kind: "selfStat", stat: "charm", delta: 20, stabScale: true, invStabScale: false },
    { kind: "selfStat", stat: "affinity", delta: 10, stabScale: false, invStabScale: false },
  ]),

  HD1: attack("HD1", "HD", 25, [
    { kind: "damage", power: 35, probability: 95 },
  ]),
  HD2: buff("HD2", "HD", 15, [
    { kind: "selfStat", stat: "strength", delta: 15, stabScale: true, invStabScale: false },
  ]),
  HD3: attack("HD3", "HD", 25, [
    { kind: "damage", power: 20, probability: 100 },
    { kind: "damage", power: 20, probability: 50 },
    { kind: "damage", power: 20, probability: 25 },
  ]),
  HD4: buff("HD4", "HD", 15, [
    { kind: "selfStat", stat: "charm", delta: 20, stabScale: true, invStabScale: false },
    { kind: "selfStat", stat: "speed", delta: 20, stabScale: true, invStabScale: false },
  ]),

  PS1: attack("PS1", "PS", 25, [
    { kind: "damage", power: 50, probability: 80 },
  ]),
  PS2: attack("PS2", "PS", 25, [
    { kind: "aoeDamage", powerDividedByOpponents: 50, probability: 80 },
    { kind: "clearOppStatuses" },
  ]),
  PS3: buff("PS3", "PS", 15, [
    { kind: "selfStat", stat: "speed", delta: 30, stabScale: true, invStabScale: false },
  ]),
  PS4: buff("PS4", "PS", 15, [
    { kind: "selfStat", stat: "speed", delta: 30, stabScale: true, invStabScale: false },
  ]),
};

export function getCard(id: CardId): CardDef {
  return CARDS[id];
}

export function isAttackCard(id: CardId): boolean {
  return CARDS[id].kind === "attack";
}

export function isBuffCard(id: CardId): boolean {
  return CARDS[id].kind === "buff";
}

export function cardPrefixOf(id: CardId): CardPrefix {
  return id.slice(0, 2) as CardPrefix;
}
