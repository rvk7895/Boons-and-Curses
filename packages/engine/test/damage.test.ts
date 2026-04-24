import { describe, expect, it } from "vitest";
import { computeDamage } from "../src/damage.js";
import { Rng } from "../src/rng.js";

describe("computeDamage", () => {
  it("returns 0 when probability is 0", () => {
    const rng = new Rng("d");
    expect(computeDamage(rng, 100, 0, 1, 100, 100, 0, 0)).toBe(0);
  });

  it("returns positive damage at full probability", () => {
    const rng = new Rng("d");
    const result = computeDamage(rng, 30, 100, 1, 150, 100, 0, 0);
    expect(result).toBeGreaterThan(0);
  });

  it("matches server.js formula for zeus vs zeus baseline", () => {
    const rng = new Rng("d");
    const result = computeDamage(rng, 30, 100, 1, 150, 100, -10, -10);
    expect(result).toBe(45);
  });

  it("STAB modifier amplifies damage", () => {
    const rng1 = new Rng("s");
    const rng2 = new Rng("s");
    const noStab = computeDamage(rng1, 30, 100, 1.0, 150, 100, 0, 0);
    const stab = computeDamage(rng2, 30, 100, 1.25, 150, 100, 0, 0);
    expect(stab).toBeGreaterThan(noStab);
  });
});
