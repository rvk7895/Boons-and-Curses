import type { GameResult } from "./runGame.js";

export type Aggregate = {
  totalGames: number;
  winsByGod: Record<string, number>;
  winsByStrategy: Record<string, number>;
  avgRounds: number;
  avgFightingRounds: number;
  terminatedBy: Record<string, number>;
  cardUsage: Record<string, number>;
  godParticipation: Record<string, number>;
};

export function aggregate(results: GameResult[]): Aggregate {
  const agg: Aggregate = {
    totalGames: results.length,
    winsByGod: {},
    winsByStrategy: {},
    avgRounds: 0,
    avgFightingRounds: 0,
    terminatedBy: {},
    cardUsage: {},
    godParticipation: {},
  };
  let roundSum = 0;
  let fightSum = 0;
  for (const r of results) {
    roundSum += r.rounds;
    fightSum += r.phases.fighting;
    agg.terminatedBy[r.terminatedBy] = (agg.terminatedBy[r.terminatedBy] ?? 0) + 1;
    for (const [k, v] of Object.entries(r.cardsPlayedTally)) {
      agg.cardUsage[k] = (agg.cardUsage[k] ?? 0) + v;
    }
    const winner = r.players.find((p) => p.id === r.winner);
    if (winner?.god) agg.winsByGod[winner.god] = (agg.winsByGod[winner.god] ?? 0) + 1;
    if (winner) agg.winsByStrategy[winner.strategy] = (agg.winsByStrategy[winner.strategy] ?? 0) + 1;
    for (const p of r.players) {
      if (p.god) agg.godParticipation[p.god] = (agg.godParticipation[p.god] ?? 0) + 1;
    }
  }
  agg.avgRounds = results.length > 0 ? roundSum / results.length : 0;
  agg.avgFightingRounds = results.length > 0 ? fightSum / results.length : 0;
  return agg;
}

export function formatRollup(agg: Aggregate): string {
  const lines: string[] = [];
  lines.push(`=== Boons & Curses simulation ===`);
  lines.push(`Games: ${agg.totalGames}`);
  lines.push(`Avg rounds: ${agg.avgRounds.toFixed(2)} (fighting avg: ${agg.avgFightingRounds.toFixed(2)})`);
  lines.push(`Terminated by: ${JSON.stringify(agg.terminatedBy)}`);
  lines.push("");
  lines.push("Wins by god (vs participation-normalized):");
  const gods = Object.keys(agg.godParticipation).sort();
  for (const g of gods) {
    const wins = agg.winsByGod[g] ?? 0;
    const plays = agg.godParticipation[g] ?? 1;
    const rate = plays > 0 ? ((wins / plays) * 100).toFixed(1) : "0.0";
    lines.push(`  ${g.padEnd(12)} wins=${wins.toString().padStart(5)} plays=${plays.toString().padStart(5)} winrate=${rate}%`);
  }
  lines.push("");
  lines.push("Wins by strategy:");
  for (const [k, v] of Object.entries(agg.winsByStrategy).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${k.padEnd(12)} ${v}`);
  }
  lines.push("");
  lines.push("Top cards played:");
  const cards = Object.entries(agg.cardUsage).sort((a, b) => b[1] - a[1]);
  for (const [id, n] of cards) {
    lines.push(`  ${id.padEnd(6)} ${n}`);
  }
  return lines.join("\n");
}
