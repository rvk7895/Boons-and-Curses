import {
  CARDS,
  GODS,
  STATUS_KEYS,
  STAT_KEYS,
  type Action,
  type CardDef,
  type CardId,
  type GameEvent,
  type GameState,
  type PlayerId,
  type PlayerState,
} from "@bc/shared";
import { applyEffects, type EffectContext } from "./effects.js";
import { Rng } from "./rng.js";
import { computeStab } from "./stab.js";
import {
  consumeLastStandIfLethal,
  maybeProcBlacksmith,
  tickStartOfTurn,
} from "./statuses.js";
import { advanceTurn, computeFightingTurnOrder, getActivePlayer } from "./turnOrder.js";

export type ReduceResult = {
  state: GameState;
  events: GameEvent[];
};

export class IllegalActionError extends Error {
  constructor(
    public readonly action: Action,
    public readonly reason: string,
  ) {
    super(`Illegal action ${action.kind} by ${action.playerId}: ${reason}`);
  }
}

export function applyAction(state: GameState, action: Action): ReduceResult {
  const rng = new Rng(0);
  rng.setState(state.rngState);
  const events: GameEvent[] = [];

  validate(state, action);

  switch (action.kind) {
    case "selectGod": {
      const player = mustPlayer(state, action.playerId);
      const god = GODS[action.god];
      player.god = action.god;
      player.maxHealth = god.maxHealth;
      for (const k of STAT_KEYS) {
        player.stats[k] = god.baseStats[k];
      }
      events.push({ kind: "godSelected", playerId: player.id, god: action.god });
      if (state.players.every((p) => p.god !== null)) {
        enterBuilding(state, rng, events);
      }
      break;
    }
    case "resolveDraw": {
      resolveDraw(state, rng, action.playerId, action.keep, events);
      break;
    }
    case "playAttack": {
      resolvePlayAttack(state, rng, action.playerId, action.cardId, action.targetId, events);
      break;
    }
    case "passFightingTurn": {
      advanceFighting(state, rng, events);
      break;
    }
  }

  state.rngState = rng.getState();
  state.version += 1;
  state.log.push(...events);
  return { state, events };
}

function validate(state: GameState, action: Action): void {
  if (state.phase === "ended") {
    throw new IllegalActionError(action, "game already ended");
  }
  switch (action.kind) {
    case "selectGod": {
      if (state.phase !== "godSelect") throw new IllegalActionError(action, "not in godSelect phase");
      const p = mustPlayer(state, action.playerId);
      if (p.god !== null) throw new IllegalActionError(action, "already selected a god");
      return;
    }
    case "resolveDraw": {
      if (state.phase !== "building") throw new IllegalActionError(action, "not in building phase");
      const active = getActivePlayer(state);
      if (!active || active.id !== action.playerId)
        throw new IllegalActionError(action, "not your turn");
      if (!active.pendingDraw) throw new IllegalActionError(action, "no pending draw");
      return;
    }
    case "playAttack": {
      if (state.phase !== "fighting") throw new IllegalActionError(action, "not in fighting phase");
      const active = getActivePlayer(state);
      if (!active || active.id !== action.playerId)
        throw new IllegalActionError(action, "not your turn");
      if (!active.hand.includes(action.cardId))
        throw new IllegalActionError(action, `card ${action.cardId} not in hand`);
      const card = CARDS[action.cardId];
      if (card.kind !== "attack") throw new IllegalActionError(action, "card is not an attack");
      if (card.needsOpponent) {
        if (!action.targetId) throw new IllegalActionError(action, "target required");
        const target = state.players.find((p) => p.id === action.targetId);
        if (!target) throw new IllegalActionError(action, "target not found");
        if (!target.alive) throw new IllegalActionError(action, "target not alive");
        if (target.id === active.id) throw new IllegalActionError(action, "cannot target self");
      }
      return;
    }
    case "passFightingTurn": {
      if (state.phase !== "fighting") throw new IllegalActionError(action, "not in fighting phase");
      const active = getActivePlayer(state);
      if (!active || active.id !== action.playerId)
        throw new IllegalActionError(action, "not your turn");
      if (active.hand.length > 0) throw new IllegalActionError(action, "hand not empty");
      return;
    }
  }
}

function enterBuilding(state: GameState, rng: Rng, events: GameEvent[]): void {
  state.phase = "building";
  state.round = 1;
  state.activePlayerIdx = 0;
  state.turnOrder = state.players.map((p) => p.id);
  events.push({ kind: "phaseChanged", phase: "building", round: 1 });
  autoDraw(state, rng, events);
}

function autoDraw(state: GameState, rng: Rng, events: GameEvent[]): void {
  const active = getActivePlayer(state);
  if (!active) return;
  if (active.pendingDraw) return;
  if (state.deck.length === 0) {
    enterFighting(state, rng, events);
    return;
  }
  const cardId = state.deck.shift()!;
  const dice = rng.rollD(4);
  active.pendingDraw = { cardId, diceRoll: dice };
  events.push({ kind: "cardDrawn", playerId: active.id, cardId });
}

function resolveDraw(
  state: GameState,
  rng: Rng,
  playerId: PlayerId,
  keep: boolean,
  events: GameEvent[],
): void {
  const player = mustPlayer(state, playerId);
  const pending = player.pendingDraw;
  if (!pending) return;
  const card = CARDS[pending.cardId];

  if (!keep) {
    state.discard.push(pending.cardId);
    player.pendingDraw = null;
    player.points += Math.floor(card.points / 4);
    afterBuildingAction(state, rng, player, events);
    return;
  }

  if (card.kind === "buff") {
    const scale = diceScale(pending.diceRoll);
    const stab = computeStab(card, player.god, null);
    const ctx: EffectContext = {
      rng,
      self: player,
      opp: null,
      allOpponents: state.players.filter((p) => p.id !== player.id),
      stab,
      scale,
      damageDealt: 0,
    };
    applyEffects(card.effects, ctx);
    clampStats(player);
    player.buffsPlayed.push(card.id);
    player.points += Math.floor(card.points * scale);
    state.discard.push(card.id);
    events.push({
      kind: "buffPlayed",
      playerId: player.id,
      cardId: card.id,
      diceRoll: pending.diceRoll,
    });
  } else {
    if (player.hand.length >= state.config.maxAttackCardsInHand) {
      const dropped = player.hand.shift()!;
      state.discard.push(dropped);
    }
    player.hand.push(card.id);
    player.points += card.points;
  }

  player.pendingDraw = null;
  afterBuildingAction(state, rng, player, events);
}

function afterBuildingAction(
  state: GameState,
  rng: Rng,
  player: PlayerState,
  events: GameEvent[],
): void {
  if (player.points >= state.config.pointThreshold) {
    events.push({ kind: "thresholdReached", playerId: player.id, points: player.points });
    enterFighting(state, rng, events);
    return;
  }
  if (state.deck.length === 0) {
    enterFighting(state, rng, events);
    return;
  }
  advanceTurn(state);
  if (state.round > state.config.buildingRoundCap) {
    enterFighting(state, rng, events);
    return;
  }
  autoDraw(state, rng, events);
}

function enterFighting(state: GameState, rng: Rng, events: GameEvent[]): void {
  for (const p of state.players) p.pendingDraw = null;
  state.phase = "fighting";
  state.round = 1;
  state.turnOrder = computeFightingTurnOrder(state.players);
  state.activePlayerIdx = 0;
  events.push({ kind: "phaseChanged", phase: "fighting", round: 1 });
  if (allAliveHandsEmpty(state)) {
    finalizeByHealth(state, events);
    return;
  }
  advanceToActionableFighter(state, rng, events, true);
}

function resolvePlayAttack(
  state: GameState,
  rng: Rng,
  playerId: PlayerId,
  cardId: CardId,
  targetId: PlayerId | null,
  events: GameEvent[],
): void {
  const player = mustPlayer(state, playerId);
  const card = CARDS[cardId];
  const target = targetId ? state.players.find((p) => p.id === targetId) ?? null : null;

  const stab = computeStab(card, player.god, target?.god ?? null);
  const ctx: EffectContext = {
    rng,
    self: player,
    opp: target,
    allOpponents: state.players.filter((p) => p.id !== player.id && p.alive),
    stab,
    scale: 1,
    damageDealt: 0,
  };
  applyEffects(card.effects, ctx);
  maybeProcBlacksmith(rng, player, target);

  clampStats(player);
  for (const p of state.players) clampStats(p);

  const idx = player.hand.indexOf(cardId);
  if (idx !== -1) player.hand.splice(idx, 1);
  state.discard.push(cardId);

  events.push({
    kind: "attackPlayed",
    playerId: player.id,
    cardId,
    targetId: target?.id ?? null,
    damage: ctx.damageDealt,
  });

  checkEliminations(state, events);

  if (checkWinCondition(state, events)) return;
  advanceFighting(state, rng, events);
}

function advanceFighting(state: GameState, rng: Rng, events: GameEvent[]): void {
  advanceTurn(state);
  if (state.activePlayerIdx === 0) {
    state.turnOrder = computeFightingTurnOrder(state.players);
    if (state.turnOrder.length > 0) state.activePlayerIdx = 0;
  }
  if (state.round > state.config.fightingRoundCap) {
    finalizeByHealth(state, events);
    return;
  }
  if (allAliveHandsEmpty(state)) {
    finalizeByHealth(state, events);
    return;
  }
  advanceToActionableFighter(state, rng, events, false);
}

function allAliveHandsEmpty(state: GameState): boolean {
  const alive = state.players.filter((p) => p.alive);
  if (alive.length === 0) return true;
  return alive.every((p) => p.hand.length === 0);
}

function advanceToActionableFighter(
  state: GameState,
  rng: Rng,
  events: GameEvent[],
  firstRound: boolean,
): void {
  let safety = state.players.length * 3;
  while (safety-- > 0) {
    const active = getActivePlayer(state);
    if (!active) {
      finalizeByHealth(state, events);
      return;
    }
    if (!active.alive) {
      advanceTurn(state);
      continue;
    }
    if (!firstRound) {
      tickStartOfTurn(active);
      checkEliminations(state, events);
      if (checkWinCondition(state, events)) return;
      if (!active.alive) {
        advanceTurn(state);
        continue;
      }
    }
    return;
  }
  finalizeByHealth(state, events);
}

function checkEliminations(state: GameState, events: GameEvent[]): void {
  const eliminatedThisTick: PlayerState[] = [];
  for (const p of state.players) {
    if (!p.alive) continue;
    if (p.stats.health <= 0) {
      if (consumeLastStandIfLethal(p)) {
        continue;
      }
      p.alive = false;
      p.eliminatedAt = state.round;
      eliminatedThisTick.push(p);
    }
  }
  for (const p of eliminatedThisTick) {
    events.push({ kind: "playerEliminated", playerId: p.id });
  }
}

function checkWinCondition(state: GameState, events: GameEvent[]): boolean {
  const alive = state.players.filter((p) => p.alive);
  if (alive.length <= 1) {
    state.phase = "ended";
    state.winner = alive[0]?.id ?? null;
    events.push({ kind: "gameEnded", winner: state.winner });
    return true;
  }
  return false;
}

function finalizeByHealth(state: GameState, events: GameEvent[]): void {
  const alive = state.players.filter((p) => p.alive);
  if (alive.length === 0) {
    state.phase = "ended";
    state.winner = null;
    events.push({ kind: "gameEnded", winner: null });
    return;
  }
  const best = alive.slice().sort((a, b) => b.stats.health - a.stats.health)[0]!;
  state.phase = "ended";
  state.winner = best.id;
  events.push({ kind: "gameEnded", winner: best.id });
}

function diceScale(roll: number): number {
  switch (roll) {
    case 1: return 0.5;
    case 2: return 0.75;
    case 3: return 1.0;
    case 4: return 1.25;
    default: return 1.0;
  }
}

function clampStats(p: PlayerState): void {
  p.stats.health = Math.min(p.stats.health, p.maxHealth);
  for (const k of STATUS_KEYS) {
    if (p.statuses[k] < 0) p.statuses[k] = 0;
  }
  if (p.stats.strength < 0) p.stats.strength = 0;
  if (p.stats.defense < 1) p.stats.defense = 1;
  if (p.stats.speed < 0) p.stats.speed = 0;
  if (p.stats.charm < -100) p.stats.charm = -100;
  if (p.stats.charm > 100) p.stats.charm = 100;
  if (p.stats.affinity < -100) p.stats.affinity = -100;
  if (p.stats.affinity > 100) p.stats.affinity = 100;
}

function mustPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const p = state.players.find((pp) => pp.id === playerId);
  if (!p) throw new Error(`player ${playerId} not found`);
  return p;
}

export function legalActions(state: GameState, playerId: PlayerId): Action[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];
  if (state.phase === "ended") return [];

  if (state.phase === "godSelect") {
    if (player.god !== null) return [];
    return Object.keys(GODS).map((g) => ({
      kind: "selectGod" as const,
      playerId,
      god: g as (typeof GODS)[keyof typeof GODS]["id"],
    }));
  }

  const activeId = state.turnOrder[state.activePlayerIdx];
  if (activeId !== playerId) return [];

  if (state.phase === "building") {
    if (!player.pendingDraw) return [];
    return [
      { kind: "resolveDraw", playerId, keep: true },
      { kind: "resolveDraw", playerId, keep: false },
    ];
  }

  if (state.phase === "fighting") {
    if (!player.alive) return [];
    if (player.hand.length === 0) return [{ kind: "passFightingTurn", playerId }];
    const alivePool = state.players.filter((p) => p.alive && p.id !== playerId);
    const actions: Action[] = [];
    for (const cardId of player.hand) {
      const card: CardDef = CARDS[cardId];
      if (card.needsOpponent) {
        for (const target of alivePool) {
          actions.push({ kind: "playAttack", playerId, cardId, targetId: target.id });
        }
      } else {
        actions.push({ kind: "playAttack", playerId, cardId, targetId: null });
      }
    }
    return actions;
  }
  return [];
}
