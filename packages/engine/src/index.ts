export { Rng } from "./rng.js";
export { computeDamage } from "./damage.js";
export { computeStab, type StabResult } from "./stab.js";
export { applyEffects, type EffectContext } from "./effects.js";
export {
  BURN_DAMAGE_PER_TURN,
  BLACKSMITH_BURN_CHANCE,
  tickStartOfTurn,
  consumeLastStandIfLethal,
  maybeProcBlacksmith,
} from "./statuses.js";
export {
  advanceTurn,
  computeFightingTurnOrder,
  getActivePlayer,
} from "./turnOrder.js";
export { createGame, buildDeck, type PlayerSeed } from "./createGame.js";
export {
  applyAction,
  legalActions,
  IllegalActionError,
  type ReduceResult,
} from "./reducer.js";
