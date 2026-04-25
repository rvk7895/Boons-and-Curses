import { describe, expect, it } from "vitest";
import { runGame } from "../src/runGame.js";
import { RandomStrategy } from "../src/strategies/random.js";
import { GreedyStrategy } from "../src/strategies/greedy.js";
import { aggregate } from "../src/report.js";

describe("runGame", () => {
  it("completes a 2-player random game", () => {
    const result = runGame({
      seed: "t1",
      playerStrategies: [
        { id: "p1", name: "A", strategy: new RandomStrategy("s1") },
        { id: "p2", name: "B", strategy: new RandomStrategy("s2") },
      ],
    });
    expect(["natural", "fightingCap"]).toContain(result.terminatedBy);
    expect(result.players).toHaveLength(2);
  });

  it("is reproducible with the same seed", () => {
    const opts = () => ({
      seed: "repeat",
      playerStrategies: [
        { id: "p1", name: "A", strategy: new GreedyStrategy("s1") },
        { id: "p2", name: "B", strategy: new RandomStrategy("s2") },
      ],
    });
    const a = runGame(opts());
    const b = runGame(opts());
    expect(a.winner).toBe(b.winner);
    expect(a.rounds).toBe(b.rounds);
  });

  it("aggregates multiple games into rollup metrics", () => {
    const results = [];
    for (let i = 0; i < 30; i++) {
      results.push(
        runGame({
          seed: `g-${i}`,
          playerStrategies: [
            { id: "p1", name: "A", strategy: new GreedyStrategy(`sa-${i}`) },
            { id: "p2", name: "B", strategy: new RandomStrategy(`sb-${i}`) },
          ],
        }),
      );
    }
    const agg = aggregate(results);
    expect(agg.totalGames).toBe(30);
    const totalWins = Object.values(agg.winsByStrategy).reduce((a, b) => a + b, 0);
    expect(totalWins).toBeGreaterThan(0);
  });
});
