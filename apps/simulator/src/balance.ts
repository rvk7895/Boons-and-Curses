import { parseArgs } from "node:util";
import { formatBalanceReport, runBalanceMatrix } from "./balanceBench.js";

function parseOpts() {
  const { values } = parseArgs({
    options: {
      games: { type: "string", default: "400" },
      seed: { type: "string", default: "balance" },
    },
    allowPositionals: false,
  });
  return {
    games: parseInt(values.games!, 10),
    seed: values.seed!,
  };
}

function main(): void {
  const opts = parseOpts();
  const start = performance.now();
  const matrix = runBalanceMatrix(opts.games, opts.seed);
  const elapsed = performance.now() - start;
  console.log(formatBalanceReport(matrix));
  const totalGames = Object.values(matrix.playCount).reduce((a, b) => a + b, 0) / 2;
  console.log(
    `\n${totalGames} games in ${elapsed.toFixed(0)}ms (${((totalGames / elapsed) * 1000).toFixed(0)} games/sec)`,
  );
}

main();
