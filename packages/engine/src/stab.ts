import type { CardDef, GodId } from "@bc/shared";
import { RIVAL_MAP } from "@bc/shared";

export type StabResult = {
  stab: number;
  invStab: number;
  matched: boolean;
  rivaled: boolean;
};

export function computeStab(
  card: CardDef,
  playerGod: GodId | null,
  oppGod: GodId | null,
): StabResult {
  if (playerGod && card.god === playerGod) {
    return { stab: 1.25, invStab: 0.75, matched: true, rivaled: false };
  }
  if (oppGod && RIVAL_MAP[card.prefix].includes(oppGod)) {
    return { stab: 0.75, invStab: 1.25, matched: false, rivaled: true };
  }
  return { stab: 1.0, invStab: 1.0, matched: false, rivaled: false };
}
