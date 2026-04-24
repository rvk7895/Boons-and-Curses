# Boons and Curses

Companion app for the 2–4 player tabletop card + dice game of the same name. Monorepo covering a reusable game engine, a realtime backend, a mobile client, and a balance-tuning simulator.

## Workspaces

```
packages/
├── shared/     Typed card + god catalog, Zod action schemas, state types
└── engine/     Pure, deterministic game engine (phases, turn order, effects, RNG)

apps/
├── server/     Fastify + Socket.io + Prisma (Postgres) — auth, rooms, realtime game loop
├── simulator/  CLI that runs N games through the engine with pluggable strategies + balance tooling
└── mobile/     Expo 51 / React Native / Expo Router client (guest auth, rooms, full gameplay)
```

## Quick start

```bash
# requirements: Node 20+, pnpm 10+, Postgres 14+
pnpm install

# backend (needs Postgres running)
createdb bc_dev && createdb bc_test   # or equivalent
cp apps/server/.env.example apps/server/.env
pnpm --filter @bc/server exec prisma migrate deploy
pnpm --filter @bc/server dev

# simulator
pnpm sim --games 10000 --seed S --strategies random,greedy

# balance matrix (head-to-head win rates per god)
pnpm --filter @bc/simulator run balance --games 500

# mobile (requires Expo Go or a dev build)
pnpm --filter @bc/mobile start
```

## Gameplay flow

1. **Lobby** — any player creates a room; invite code joins others. Up to 4 players and any number of spectators. Admin starts the game.
2. **God select** — each player chooses 1 of 6 patron gods (Zeus, Hephaestus, Aphrodite, Athena, Hades, Poseidon). Gods grant different base stats.
3. **Building phase** — turn-by-turn draw. Engine rolls a d4 per draw; the dice scales the buff's magnitude (0.5× to 1.25×). Buffs apply immediately; attacks go into hand (max 4). Phase ends when any player reaches the point threshold.
4. **Fighting phase** — turn order by Speed, recomputed each round. Players play attacks from hand targeting opponents. STAB (+25%) on matching god; rival opponents flip the modifier. Statuses: burn, invulnerable, lastStand, blacksmith.
5. **End** — last champion standing wins.

## Backend API

Auth:
- `POST /auth/guest` `{ deviceId, displayName }` → `{ token, user }`
- `GET /auth/me` (Bearer) → `{ user }`

Rooms (all Bearer-authed):
- `POST /rooms` `{ maxPlayers? }` → Room
- `GET /rooms/:code` → Room
- `POST /rooms/:code/join` `{ role? }` → Room
- `POST /rooms/:code/leave` → `{ ok: true }`

Socket.io (token via `handshake.auth.token`):
- emit `joinRoom` `{ code }` → ack with room + filtered state
- emit `startGame` → admin-only, ack + `stateUpdate` broadcast
- emit `action` `{ action }` → validated + applied, `stateUpdate` broadcast
- listen `stateUpdate` `{ state }` — hidden-info stripped per recipient

## Testing

```bash
pnpm turbo run typecheck test
```

Currently 47 tests across shared/engine/simulator/server workspaces, plus a balance matrix harness.

## Credits

Designed by the original Boons & Curses team (Aakash Jain, Hemant Suresh, Raghav Raj Dwivedi, Ritvik Aryan Kalra) for IIIT-H CS9.438. This repo is a ground-up rebuild of the companion app around a shared TypeScript game engine.
