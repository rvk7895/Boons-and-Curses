import { CARDS, RIVAL_MAP } from "@bc/shared";
import { describe, expect, it } from "vitest";
import { computeStab } from "../src/stab.js";

describe("computeStab", () => {
  it("gives 1.25 when card god matches player god", () => {
    const result = computeStab(CARDS.ZS1, "zeus", "hades");
    expect(result.stab).toBe(1.25);
    expect(result.invStab).toBe(0.75);
    expect(result.matched).toBe(true);
  });

  it("gives 0.75 when opp god is in card's rivals", () => {
    const rivalsOfZS = RIVAL_MAP.ZS;
    expect(rivalsOfZS).toContain("hades");
    const result = computeStab(CARDS.ZS1, "aphrodite", "hades");
    expect(result.stab).toBe(0.75);
    expect(result.invStab).toBe(1.25);
    expect(result.rivaled).toBe(true);
  });

  it("gives 1.0 otherwise", () => {
    const result = computeStab(CARDS.ZS1, "aphrodite", "athena");
    expect(result.stab).toBe(1);
    expect(result.invStab).toBe(1);
  });

  it("handles null player god", () => {
    const result = computeStab(CARDS.ZS1, null, "hades");
    expect(result.stab).toBe(0.75);
  });
});
