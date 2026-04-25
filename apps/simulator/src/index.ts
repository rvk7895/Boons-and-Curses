import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { RandomStrategy } from "./strategies/random.js";
import { GreedyStrategy } from "./strategies/greedy.js";
import { aggregate, formatRollup } from "./report.js";
import { runGame, type GameResult } from "./runGame.js";
import type { Strategy } from "./strategy.js";

type Opts = {
  games: number;
  seed: string;
  players: number;
  strategies: string[];
  out: string | undefined;
  quiet: boolean;
};

function parseOpts(): Opts {
  const { values } = parseArgs({
    options: {
      games: { type: "string", default: "1000" },
      seed: { type: "string", default: "sim" },
      players: { type: "string", default: "2" },
      strategies: { type: "string", default: "random,greedy" },
      out: { type: "string" },
      quiet: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });
  return {
    games: parseInt(values.games!, 10),
    seed: values.seed!,
    players: parseInt(values.players!, 10),
    strategies: values.strategies!.split(",").map((s) => s.trim()),
    out: values.out,
    quiet: values.quiet ?? false,
  };
}

function makeStrategy(name: string, seed: string): Strategy {
  switch (name) {
    case "random":
      return new RandomStrategy(seed);
    case "greedy":
      return new GreedyStrategy(seed);
    default:
      throw new Error(`unknown strategy: ${name}`);
  }
}

function main(): void {
  const opts = parseOpts();
  if (opts.players < 2 || opts.players > 4) {
    throw new Error("players must be 2-4");
  }
  if (opts.games < 1) throw new Error("games must be >= 1");

  const results: GameResult[] = [];
  const start = performance.now();

  for (let i = 0; i < opts.games; i++) {
    const gameSeed = `${opts.seed}-${i}`;
    const playerStrategies = [];
    for (let p = 0; p < opts.players; p++) {
      const stratName = opts.strategies[p % opts.strategies.length]!;
      playerStrategies.push({
        id: `p${p + 1}`,
        name: `P${p + 1}`,
        strategy: makeStrategy(stratName, `${gameSeed}-strat-${p}`),
      });
    }
    const result = runGame({ seed: gameSeed, playerStrategies });
    results.push(result);
  }

  const elapsed = performance.now() - start;
  const agg = aggregate(results);

  if (opts.out) {
    const lines = results.map((r) => JSON.stringify(r));
    writeFileSync(opts.out, lines.join("\n") + "\n");
    if (!opts.quiet) console.log(`Wrote ${results.length} games to ${opts.out}`);
  }

  if (!opts.quiet) {
    console.log(formatRollup(agg));
    console.log("");
  }
  console.log(`Completed ${opts.games} games in ${elapsed.toFixed(0)}ms (${((opts.games / elapsed) * 1000).toFixed(0)} games/sec)`);
}

main();
