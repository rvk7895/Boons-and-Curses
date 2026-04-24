import { applyAction, createGame, legalActions } from "@bc/engine";
import type { CardId, GameEvent, GodId, PlayerId } from "@bc/shared";
import type { Strategy } from "./strategy.js";

export type GameResult = {
  seed: string;
  winner: PlayerId | null;
  rounds: number;
  phases: { godSelect: number; building: number; fighting: number };
  players: Array<{
    id: PlayerId;
    god: GodId | null;
    strategy: string;
    finalHealth: number;
    eliminatedAt: number | null;
    cardsPlayed: number;
    handAtEndOfBuilding: CardId[];
  }>;
  cardsPlayedTally: Record<string, number>;
  totalEvents: number;
  terminatedBy: "natural" | "fightingCap" | "buildingCap" | "deadlock";
};

export type RunInput = {
  seed: string;
  playerStrategies: Array<{ id: PlayerId; name: string; strategy: Strategy }>;
  maxActions?: number;
};

export function runGame(input: RunInput): GameResult {
  const state = createGame(
    input.seed,
    input.playerStrategies.map((p) => ({ id: p.id, name: p.name })),
  );

  const strategyById: Record<PlayerId, Strategy> = {};
  for (const p of input.playerStrategies) strategyById[p.id] = p.strategy;

  const phaseRounds = { godSelect: 0, building: 0, fighting: 0 };
  const tally: Record<string, number> = {};
  const handsAtBuildingEnd: Record<PlayerId, CardId[]> = {};
  let totalEvents = 0;
  let terminatedBy: GameResult["terminatedBy"] = "natural";
  const cap = input.maxActions ?? 5000;

  let prevPhase = state.phase;
  let actions = 0;
  while (state.phase !== "ended" && actions < cap) {
    const activeId = state.turnOrder[state.activePlayerIdx];
    let action;
    if (state.phase === "godSelect") {
      const chooser = state.players.find((p) => p.god === null);
      if (!chooser) break;
      const legal = legalActions(state, chooser.id);
      if (legal.length === 0) break;
      action = strategyById[chooser.id]!.pickAction(state, chooser.id, legal);
    } else {
      if (!activeId) {
        terminatedBy = "deadlock";
        break;
      }
      const legal = legalActions(state, activeId);
      if (legal.length === 0) {
        terminatedBy = "deadlock";
        break;
      }
      action = strategyById[activeId]!.pickAction(state, activeId, legal);
    }

    const { events } = applyAction(state, action);
    actions += 1;
    totalEvents += events.length;

    for (const ev of events) trackEvent(ev, tally);

    if (prevPhase !== state.phase) {
      if (prevPhase === "building") {
        for (const p of state.players) handsAtBuildingEnd[p.id] = p.hand.slice();
      }
      prevPhase = state.phase;
    }
    if (state.phase === "godSelect" || state.phase === "building" || state.phase === "fighting") {
      phaseRounds[state.phase] = state.round;
    }
  }

  if (actions >= cap && state.phase !== "ended") {
    terminatedBy = state.phase === "fighting" ? "fightingCap" : "buildingCap";
  }

  return {
    seed: input.seed,
    winner: state.winner,
    rounds: state.round,
    phases: phaseRounds,
    players: input.playerStrategies.map((p) => {
      const ps = state.players.find((pp) => pp.id === p.id)!;
      return {
        id: p.id,
        god: ps.god,
        strategy: p.strategy.name,
        finalHealth: ps.stats.health,
        eliminatedAt: ps.eliminatedAt,
        cardsPlayed: ps.buffsPlayed.length,
        handAtEndOfBuilding: handsAtBuildingEnd[p.id] ?? [],
      };
    }),
    cardsPlayedTally: tally,
    totalEvents,
    terminatedBy,
  };
}

function trackEvent(ev: GameEvent, tally: Record<string, number>): void {
  if (ev.kind === "buffPlayed" || ev.kind === "attackPlayed") {
    tally[ev.cardId] = (tally[ev.cardId] ?? 0) + 1;
  }
}
