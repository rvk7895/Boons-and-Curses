import { describe, expect, it } from "vitest";
import { Rng } from "../src/rng.js";

describe("Rng", () => {
  it("is deterministic with identical seeds", () => {
    const a = new Rng("seed1");
    const b = new Rng("seed1");
    for (let i = 0; i < 1000; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("differs across seeds", () => {
    const a = new Rng("alpha");
    const b = new Rng("beta");
    const aVals = Array.from({ length: 20 }, () => a.next());
    const bVals = Array.from({ length: 20 }, () => b.next());
    expect(aVals).not.toEqual(bVals);
  });

  it("round-trips state", () => {
    const rng = new Rng("s");
    for (let i = 0; i < 10; i++) rng.next();
    const saved = rng.getState();
    const vals = Array.from({ length: 5 }, () => rng.next());
    const clone = new Rng(0);
    clone.setState(saved);
    const clonedVals = Array.from({ length: 5 }, () => clone.next());
    expect(clonedVals).toEqual(vals);
  });

  it("rollD(4) stays in [1,4]", () => {
    const rng = new Rng("dice");
    for (let i = 0; i < 100; i++) {
      const r = rng.rollD(4);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(4);
    }
  });

  it("shuffle preserves contents", () => {
    const rng = new Rng("sh");
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(out.sort()).toEqual(input.sort());
  });
});
