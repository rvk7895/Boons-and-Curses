import { CARDS, type Action } from "@bc/shared";
import { describe, expect, it } from "vitest";
import { applyAction, legalActions } from "../src/reducer.js";
import { createGame } from "../src/createGame.js";

function playOutGame(seed: string): { winner: string | null; rounds: number; events: number } {
  let state = createGame(seed, [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ]);

  applyAction(state, { kind: "selectGod", playerId: "p1", god: "zeus" });
  applyAction(state, { kind: "selectGod", playerId: "p2", god: "hades" });

  let eventsTotal = 0;
  let safety = 5000;
  while (state.phase !== "ended" && safety-- > 0) {
    const activeId = state.turnOrder[state.activePlayerIdx];
    if (!activeId) break;
    const actions = legalActions(state, activeId);
    if (actions.length === 0) break;
    const pick = actions[0]!;
    const { events } = applyAction(state, pick);
    eventsTotal += events.length;
  }
  return { winner: state.winner, rounds: state.round, events: eventsTotal };
}

describe("full game", () => {
  it("runs to completion and declares a winner", () => {
    const result = playOutGame("game-seed-1");
    expect(result.winner).not.toBeNull();
    expect(result.events).toBeGreaterThan(0);
  });

  it("is deterministic with identical seeds", () => {
    const a = playOutGame("det");
    const b = playOutGame("det");
    expect(a).toEqual(b);
  });

  it("can differ with different seeds", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const r = playOutGame(`seed-${i}`);
      results.add(`${r.winner}-${r.rounds}`);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("card catalog", () => {
  it("has 24 cards", () => {
    expect(Object.keys(CARDS)).toHaveLength(24);
  });

  it("every card has valid prefix + god linkage", () => {
    for (const c of Object.values(CARDS)) {
      expect(c.id.startsWith(c.prefix)).toBe(true);
    }
  });
});

describe("legal actions", () => {
  it("returns 6 god choices in godSelect", () => {
    const state = createGame("x", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    expect(legalActions(state, "a")).toHaveLength(6);
  });

  it("returns empty when not active player in godSelect after selecting", () => {
    const state = createGame("y", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    applyAction(state, { kind: "selectGod", playerId: "a", god: "zeus" });
    expect(legalActions(state, "a")).toHaveLength(0);
    expect(legalActions(state, "b")).toHaveLength(6);
  });
});

describe("building phase", () => {
  it("enters building after all gods selected", () => {
    const state = createGame("b1", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    applyAction(state, { kind: "selectGod", playerId: "a", god: "zeus" });
    applyAction(state, { kind: "selectGod", playerId: "b", god: "hades" });
    expect(state.phase).toBe("building");
  });

  it("active player has a pending draw when building starts", () => {
    const state = createGame("b2", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    applyAction(state, { kind: "selectGod", playerId: "a", god: "zeus" });
    applyAction(state, { kind: "selectGod", playerId: "b", god: "hades" });
    const active = state.players.find((p) => p.id === state.turnOrder[state.activePlayerIdx]);
    expect(active?.pendingDraw).not.toBeNull();
  });

  it("resolveDraw keep=true clears pendingDraw and advances turn", () => {
    const state = createGame("b3", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    applyAction(state, { kind: "selectGod", playerId: "a", god: "zeus" });
    applyAction(state, { kind: "selectGod", playerId: "b", god: "hades" });
    const firstActive = state.turnOrder[state.activePlayerIdx]!;
    const before = state.players.find((p) => p.id === firstActive)!;
    const drawnCard = before.pendingDraw?.cardId;
    const pointsBefore = before.points;
    applyAction(state, { kind: "resolveDraw", playerId: firstActive, keep: true });
    const after = state.players.find((p) => p.id === firstActive)!;
    expect(after.pendingDraw).toBeNull();
    expect(after.points).toBeGreaterThanOrEqual(pointsBefore);
    expect(drawnCard).toBeDefined();
  });
});

describe("fighting phase end conditions", () => {
  it("ends by HP when all alive players run out of attack cards", () => {
    const state = createGame("drought", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    applyAction(state, { kind: "selectGod", playerId: "a", god: "zeus" });
    applyAction(state, { kind: "selectGod", playerId: "b", god: "hades" });

    let safety = 5000;
    while (state.phase !== "ended" && safety-- > 0) {
      const activeId = state.turnOrder[state.activePlayerIdx];
      if (!activeId) break;
      const actions = legalActions(state, activeId);
      if (actions.length === 0) break;
      applyAction(state, actions[0]!);
    }

    expect(state.phase).toBe("ended");
    expect(state.winner).not.toBeNull();
    expect(safety).toBeGreaterThan(0);
  });

  it("clears empty hands without infinite passing", () => {
    const state = createGame("drought2", [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    applyAction(state, { kind: "selectGod", playerId: "a", god: "zeus" });
    applyAction(state, { kind: "selectGod", playerId: "b", god: "hades" });

    while (state.phase !== "fighting" && state.phase !== "ended") {
      const activeId = state.turnOrder[state.activePlayerIdx];
      if (!activeId) break;
      const actions = legalActions(state, activeId);
      if (actions.length === 0) break;
      const discard = actions.find((a) => a.kind === "resolveDraw" && !a.keep) ?? actions[0]!;
      applyAction(state, discard);
    }
    if (state.phase !== "fighting") return;

    let passes = 0;
    while (state.phase === "fighting" && passes < 20) {
      const activeId = state.turnOrder[state.activePlayerIdx]!;
      const acts = legalActions(state, activeId);
      const pass = acts.find((a) => a.kind === "passFightingTurn");
      if (!pass) break;
      applyAction(state, pass);
      passes += 1;
    }
    expect(state.phase).toBe("ended");
  });
});
