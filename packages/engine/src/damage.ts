import type { Rng } from "./rng.js";

export function computeDamage(
  rng: Rng,
  power: number,
  probability: number,
  stab: number,
  strength: number,
  defense: number,
  plAffinity: number,
  oppAffinity: number,
): number {
  const roll = Math.floor(rng.next() * 100);
  if (roll >= probability) return 0;
  const oppMult = (oppAffinity + 100) / 100;
  const safeDefense = Math.max(1, defense * oppMult);
  const plMult = (plAffinity + 100) / 100;
  const raw = (power * stab * strength * plMult) / safeDefense;
  return Math.max(0, Math.floor(raw));
}
