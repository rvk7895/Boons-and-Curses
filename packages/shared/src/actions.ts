import { z } from "zod";
import { CARD_IDS } from "./cards.js";
import { GOD_IDS } from "./gods.js";

export const ActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("selectGod"),
    playerId: z.string(),
    god: z.enum(GOD_IDS),
  }),
  z.object({
    kind: z.literal("resolveDraw"),
    playerId: z.string(),
    keep: z.boolean(),
  }),
  z.object({
    kind: z.literal("playAttack"),
    playerId: z.string(),
    cardId: z.enum(CARD_IDS),
    targetId: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("passFightingTurn"),
    playerId: z.string(),
  }),
]);

export type Action = z.infer<typeof ActionSchema>;
export type ActionKind = Action["kind"];
