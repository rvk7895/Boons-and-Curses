import type { PlayerState } from "@bc/shared";
import type { Rng } from "./rng.js";

export const BURN_DAMAGE_PER_TURN = 10;
export const LAST_STAND_BLEED = 5;
export const BLACKSMITH_BURN_CHANCE = 10;

export function tickStartOfTurn(player: PlayerState): number {
  let healthDelta = 0;
  if (player.statuses.burn > 0) {
    healthDelta -= BURN_DAMAGE_PER_TURN;
    player.statuses.burn -= 1;
  }
  if (player.statuses.lastStand > 0) {
    healthDelta -= LAST_STAND_BLEED;
    player.statuses.lastStand -= 1;
  }
  if (player.statuses.invulnerable > 0) {
    player.statuses.invulnerable -= 1;
  }
  player.stats.health += healthDelta;
  return healthDelta;
}

export function maybeProcBlacksmith(
  rng: Rng,
  attacker: PlayerState,
  target: PlayerState | null,
): boolean {
  if (!target) return false;
  if (attacker.statuses.blacksmith <= 0) return false;
  const roll = Math.floor(rng.next() * 100);
  if (roll < BLACKSMITH_BURN_CHANCE) {
    target.statuses.burn = Math.max(target.statuses.burn, 3);
    return true;
  }
  return false;
}
