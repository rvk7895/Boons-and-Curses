import { CARD_IDS, GOD_IDS, type CardId, type GodId } from "@bc/shared";
import { parseArgs } from "node:util";
import { RandomStrategy } from "./strategies/random.js";
import { runGame, type GameResult } from "./runGame.js";

type Opts = { games: number; seed: string; players: number };

function parseOpts(): Opts {
  const { values } = parseArgs({
    options: {
      games: { type: "string", default: "5000" },
      seed: { type: "string", default: "analyze" },
      players: { type: "string", default: "2" },
    },
    allowPositionals: false,
  });
  return {
    games: parseInt(values.games!, 10),
    seed: values.seed!,
    players: parseInt(values.players!, 10),
  };
}

function main(): void {
  const opts = parseOpts();
  const start = performance.now();
  const results: GameResult[] = [];
  const godRotation = GOD_IDS;

  for (let g = 0; g < opts.games; g++) {
    const seed = `${opts.seed}-${g}`;
    const playerStrategies = [];
    for (let p = 0; p < opts.players; p++) {
      const god = godRotation[(g * opts.players + p) % godRotation.length]!;
      playerStrategies.push({
        id: `p${p + 1}`,
        name: `P${p + 1}-${god}`,
        strategy: new RandomStrategy(`${seed}-${p}`),
        forceGod: god,
      });
    }
    results.push(runGame({ seed, playerStrategies }));
  }
  const elapsed = performance.now() - start;

  const cardPlays: Record<CardId, number> = empty();
  const cardWins: Record<CardId, number> = empty();
  const godPlays: Record<GodId, number> = emptyGod();
  const godWins: Record<GodId, number> = emptyGod();

  for (const r of results) {
    for (const p of r.players) {
      if (p.god) {
        godPlays[p.god] += 1;
        if (p.id === r.winner) godWins[p.god] += 1;
      }
      const seen = new Set<CardId>();
      for (const c of p.cardsPlayedList) {
        if (seen.has(c)) continue;
        seen.add(c);
        cardPlays[c] += 1;
        if (p.id === r.winner) cardWins[c] += 1;
      }
    }
  }

  console.log(`=== Per-card win contribution (player who played card won the game) ===\n`);
  console.log(
    `${"card".padEnd(6)} ${"plays".padStart(6)} ${"wins".padStart(6)} ${"win%".padStart(7)}  ${"pick%".padStart(7)}`,
  );
  const totalGames = results.length;
  const rows = (CARD_IDS as readonly CardId[])
    .map((c) => ({
      card: c,
      plays: cardPlays[c],
      wins: cardWins[c],
      winRate: cardPlays[c] > 0 ? cardWins[c] / cardPlays[c] : 0,
      pickRate: cardPlays[c] / Math.max(1, totalGames * opts.players),
    }))
    .sort((a, b) => b.winRate - a.winRate);

  for (const r of rows) {
    console.log(
      `${r.card.padEnd(6)} ${String(r.plays).padStart(6)} ${String(r.wins).padStart(6)} ${(r.winRate * 100).toFixed(1).padStart(6)}%  ${(r.pickRate * 100).toFixed(1).padStart(6)}%`,
    );
  }

  console.log(`\n=== God win rates (rotated assignment) ===`);
  for (const g of GOD_IDS) {
    const wr = godPlays[g] > 0 ? godWins[g] / godPlays[g] : 0;
    console.log(
      `  ${g.padEnd(12)} ${(wr * 100).toFixed(1).padStart(5)}%  (plays=${godPlays[g]})`,
    );
  }

  console.log(
    `\n${results.length} games in ${elapsed.toFixed(0)}ms (${((results.length / elapsed) * 1000).toFixed(0)} g/s)`,
  );
}

function empty(): Record<CardId, number> {
  const r = {} as Record<CardId, number>;
  for (const c of CARD_IDS) r[c] = 0;
  return r;
}

function emptyGod(): Record<GodId, number> {
  const r = {} as Record<GodId, number>;
  for (const g of GOD_IDS) r[g] = 0;
  return r;
}

main();
