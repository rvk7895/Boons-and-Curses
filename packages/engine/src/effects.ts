import type { Effect, PlayerState } from "@bc/shared";
import { computeDamage } from "./damage.js";
import type { Rng } from "./rng.js";
import type { StabResult } from "./stab.js";

export type EffectContext = {
  rng: Rng;
  self: PlayerState;
  opp: PlayerState | null;
  allOpponents: PlayerState[];
  stab: StabResult;
  scale: number;
  damageDealt: number;
};

export function applyEffects(effects: Effect[], ctx: EffectContext): void {
  for (const e of effects) applyOne(e, ctx);
}

function dealDamage(ctx: EffectContext, target: PlayerState, raw: number): number {
  if (!target.alive) return 0;
  let dmg = raw;
  if (target.statuses.invulnerable > 0) {
    const reflectRoll = Math.floor(ctx.rng.next() * 100);
    if (reflectRoll < 10) {
      dmg = raw * 2;
    } else {
      return 0;
    }
  }
  target.stats.health -= dmg;
  return dmg;
}

function applyOne(e: Effect, ctx: EffectContext): void {
  switch (e.kind) {
    case "damage": {
      if (!ctx.opp) return;
      const raw = computeDamage(
        ctx.rng,
        e.power * ctx.scale,
        e.probability,
        ctx.stab.stab,
        ctx.self.stats.strength,
        ctx.opp.stats.defense,
        ctx.self.stats.affinity,
        ctx.opp.stats.affinity,
      );
      ctx.damageDealt += dealDamage(ctx, ctx.opp, raw);
      return;
    }
    case "aoeDamage": {
      const aliveOpps = ctx.allOpponents.filter((p) => p.alive);
      if (aliveOpps.length === 0) return;
      const perTargetPower = (e.powerDividedByOpponents * ctx.scale) / aliveOpps.length;
      for (const target of aliveOpps) {
        const raw = computeDamage(
          ctx.rng,
          perTargetPower,
          e.probability,
          ctx.stab.stab,
          ctx.self.stats.strength,
          target.stats.defense,
          ctx.self.stats.affinity,
          target.stats.affinity,
        );
        ctx.damageDealt += dealDamage(ctx, target, raw);
      }
      return;
    }
    case "selfHeal": {
      const healed = Math.floor(e.amount * ctx.scale);
      ctx.self.stats.health = Math.min(ctx.self.maxHealth, ctx.self.stats.health + healed);
      return;
    }
    case "lifesteal": {
      const heal = Math.floor(ctx.damageDealt * e.fraction);
      ctx.self.stats.health = Math.min(ctx.self.maxHealth, ctx.self.stats.health + heal);
      return;
    }
    case "selfStat": {
      const mult = e.stabScale ? ctx.stab.stab : e.invStabScale ? ctx.stab.invStab : 1;
      ctx.self.stats[e.stat] += Math.floor(e.delta * mult * ctx.scale);
      return;
    }
    case "oppStat": {
      if (!ctx.opp) return;
      const mult = e.stabScale ? ctx.stab.stab : e.invStabScale ? ctx.stab.invStab : 1;
      ctx.opp.stats[e.stat] += Math.floor(e.delta * mult * ctx.scale);
      return;
    }
    case "applyStatusSelf": {
      const current = ctx.self.statuses[e.status];
      ctx.self.statuses[e.status] = Math.max(current, e.turns);
      return;
    }
    case "applyStatusOpp": {
      if (!ctx.opp) return;
      if (Math.floor(ctx.rng.next() * 100) < e.chance) {
        const current = ctx.opp.statuses[e.status];
        ctx.opp.statuses[e.status] = Math.max(current, e.turns);
      }
      return;
    }
    case "clearOppStatuses": {
      if (!ctx.opp) return;
      ctx.opp.statuses.burn = 0;
      ctx.opp.statuses.invulnerable = 0;
      return;
    }
    case "clearSelfGod": {
      return;
    }
    case "conditionalStab": {
      if (ctx.stab.matched) applyEffects(e.whenStab, ctx);
      else applyEffects(e.otherwise, ctx);
      return;
    }
  }
}
