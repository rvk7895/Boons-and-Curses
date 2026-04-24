import { GOD_IDS, type GodId } from "@bc/shared";
import { RandomStrategy } from "./strategies/random.js";
import { runGame } from "./runGame.js";

export type PairResult = {
  godA: GodId;
  godB: GodId;
  games: number;
  winsA: number;
  winsB: number;
  draws: number;
  avgRounds: number;
};

export function runBalanceMatrix(
  gamesPerPair: number,
  seed: string,
): { pairs: PairResult[]; winRate: Record<GodId, number>; playCount: Record<GodId, number> } {
  const pairs: PairResult[] = [];
  const wins: Record<GodId, number> = emptyRecord();
  const plays: Record<GodId, number> = emptyRecord();

  for (let i = 0; i < GOD_IDS.length; i++) {
    for (let j = i + 1; j < GOD_IDS.length; j++) {
      const godA = GOD_IDS[i]!;
      const godB = GOD_IDS[j]!;
      let winsA = 0;
      let winsB = 0;
      let draws = 0;
      let totalRounds = 0;
      for (let g = 0; g < gamesPerPair; g++) {
        const gameSeed = `${seed}-${godA}-${godB}-${g}`;
        const result = runGame({
          seed: gameSeed,
          playerStrategies: [
            {
              id: "a",
              name: `A-${godA}`,
              strategy: new RandomStrategy(`${gameSeed}-A`),
              forceGod: godA,
            },
            {
              id: "b",
              name: `B-${godB}`,
              strategy: new RandomStrategy(`${gameSeed}-B`),
              forceGod: godB,
            },
          ],
        });
        totalRounds += result.rounds;
        if (result.winner === "a") winsA += 1;
        else if (result.winner === "b") winsB += 1;
        else draws += 1;
        plays[godA] += 1;
        plays[godB] += 1;
        wins[godA] += result.winner === "a" ? 1 : 0;
        wins[godB] += result.winner === "b" ? 1 : 0;
      }
      pairs.push({
        godA,
        godB,
        games: gamesPerPair,
        winsA,
        winsB,
        draws,
        avgRounds: totalRounds / gamesPerPair,
      });
    }
  }

  const winRate: Record<GodId, number> = emptyRecord();
  for (const g of GOD_IDS) {
    winRate[g] = plays[g] > 0 ? wins[g] / plays[g] : 0;
  }
  return { pairs, winRate, playCount: plays };
}

function emptyRecord(): Record<GodId, number> {
  const r = {} as Record<GodId, number>;
  for (const g of GOD_IDS) r[g] = 0;
  return r;
}

export function formatBalanceReport(
  matrix: ReturnType<typeof runBalanceMatrix>,
): string {
  const lines: string[] = [];
  lines.push(`=== God balance matrix (random-vs-random, forced gods) ===`);
  lines.push("");
  lines.push("Win rate by god (balance target: 40-60% in head-to-head):");
  const sorted = Object.entries(matrix.winRate).sort((a, b) => b[1] - a[1]);
  for (const [g, rate] of sorted) {
    const bar = "#".repeat(Math.round(rate * 40));
    lines.push(
      `  ${g.padEnd(12)} ${(rate * 100).toFixed(1).padStart(5)}% ${bar} (${matrix.playCount[g as GodId]} games)`,
    );
  }
  lines.push("");
  lines.push("Head-to-head matchups (A-wins% / B-wins%):");
  lines.push(
    `  ${"godA".padEnd(12)} vs ${"godB".padEnd(12)} ${"A%".padStart(6)} ${"B%".padStart(6)} rounds`,
  );
  for (const p of matrix.pairs) {
    const aPct = ((p.winsA / p.games) * 100).toFixed(1).padStart(5);
    const bPct = ((p.winsB / p.games) * 100).toFixed(1).padStart(5);
    lines.push(
      `  ${p.godA.padEnd(12)} vs ${p.godB.padEnd(12)} ${aPct}% ${bPct}% ${p.avgRounds.toFixed(1)}`,
    );
  }
  return lines.join("\n");
}
