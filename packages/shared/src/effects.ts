import type { StatKey } from "./gods.js";

export const STATUS_KEYS = [
  "burn",
  "invulnerable",
  "lastStand",
  "blacksmith",
] as const;

export type StatusKey = (typeof STATUS_KEYS)[number];

export type Effect =
  | {
      kind: "damage";
      power: number;
      probability: number;
    }
  | {
      kind: "aoeDamage";
      powerDividedByOpponents: number;
      probability: number;
    }
  | {
      kind: "selfHeal";
      amount: number;
    }
  | {
      kind: "lifesteal";
      fraction: number;
    }
  | {
      kind: "selfStat";
      stat: StatKey;
      delta: number;
      stabScale: boolean;
      invStabScale: boolean;
    }
  | {
      kind: "oppStat";
      stat: StatKey;
      delta: number;
      stabScale: boolean;
      invStabScale: boolean;
    }
  | {
      kind: "applyStatusSelf";
      status: StatusKey;
      turns: number;
    }
  | {
      kind: "applyStatusOpp";
      status: StatusKey;
      turns: number;
      chance: number;
    }
  | {
      kind: "clearOppStatuses";
    }
  | {
      kind: "clearSelfGod";
    }
  | {
      kind: "conditionalStab";
      whenStab: Effect[];
      otherwise: Effect[];
    };
