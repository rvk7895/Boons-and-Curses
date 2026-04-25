import { Server as IOServer, type Socket } from "socket.io";
import type { FastifyInstance } from "fastify";
import type { Server as HttpServer } from "node:http";
import { applyAction, createGame, IllegalActionError } from "@bc/engine";
import { ActionSchema, type Action, type PlayerId } from "@bc/shared";
import { filterStateFor, type VisibleGameState } from "./visibility.js";

export type SocketAuth = {
  userId: string;
  deviceId: string;
  displayName: string;
};

type SocketData = {
  auth: SocketAuth;
  roomCode: string | null;
  playerId: PlayerId | null;
  role: "PLAYER" | "SPECTATOR" | null;
};

export function attachSocketIO(app: FastifyInstance, httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    cors: { origin: "*" },
  });

  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, "") ?? undefined);
    if (!token) return next(new Error("unauthorized"));
    try {
      const decoded = app.jwt.verify<SocketAuth>(token);
      (socket.data as SocketData) = {
        auth: decoded,
        roomCode: null,
        playerId: null,
        role: null,
      };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", async (payload: { code: string }, ack?: (res: unknown) => void) => {
      try {
        await handleJoinRoom(app, io, socket, payload.code, ack);
      } catch (err) {
        respond(ack, { ok: false, error: errMsg(err) });
      }
    });

    socket.on("startGame", async (_payload: unknown, ack?: (res: unknown) => void) => {
      try {
        await handleStartGame(app, io, socket, ack);
      } catch (err) {
        respond(ack, { ok: false, error: errMsg(err) });
      }
    });

    socket.on("action", async (payload: { action: Action }, ack?: (res: unknown) => void) => {
      try {
        await handleAction(app, io, socket, payload.action, ack);
      } catch (err) {
        respond(ack, { ok: false, error: errMsg(err) });
      }
    });

    socket.on("disconnect", () => {
      const data = socket.data as SocketData;
      if (data.roomCode) {
        const rt = app.rooms.getByCode(data.roomCode);
        if (rt) rt.connectedSockets.delete(socket.id);
      }
    });
  });

  return io;
}

async function handleJoinRoom(
  app: FastifyInstance,
  io: IOServer,
  socket: Socket,
  code: string,
  ack: ((res: unknown) => void) | undefined,
): Promise<void> {
  const data = socket.data as SocketData;
  const room = await app.prisma.room.findUnique({
    where: { code },
    include: { memberships: { include: { user: true } }, snapshots: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!room) return respond(ack, { ok: false, error: "room not found" });
  const membership = room.memberships.find((m: { userId: string }) => m.userId === data.auth.userId);
  if (!membership) return respond(ack, { ok: false, error: "not a member" });

  data.roomCode = code;
  data.playerId = membership.playerId;
  data.role = membership.role as "PLAYER" | "SPECTATOR";

  await socket.join(roomChannel(code));

  const rt = app.rooms.upsert(room.id, room.code);
  rt.connectedSockets.add(socket.id);

  if (!rt.state && room.snapshots[0]) {
    rt.state = room.snapshots[0].state as unknown as Parameters<typeof filterStateFor>[0];
  }

  const roomShape = serializeRoomShape(room);

  respond(ack, {
    ok: true,
    youAre: { playerId: membership.playerId, role: membership.role },
    room: roomShape,
    state: rt.state ? filterStateFor(rt.state, membership.playerId) : null,
  });

  io.to(roomChannel(code)).emit("roomUpdate", { room: roomShape });
}

type SerializableRoom = {
  id: string;
  code: string;
  status: string;
  adminId: string;
  maxPlayers: number;
  memberships: Array<{
    id: string;
    userId: string;
    playerId: string;
    role: string;
    user: { displayName: string };
  }>;
};

function serializeRoomShape(room: SerializableRoom) {
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    adminId: room.adminId,
    maxPlayers: room.maxPlayers,
    members: room.memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      playerId: m.playerId,
      role: m.role,
      displayName: m.user.displayName,
    })),
  };
}

async function handleStartGame(
  app: FastifyInstance,
  io: IOServer,
  socket: Socket,
  ack: ((res: unknown) => void) | undefined,
): Promise<void> {
  const data = socket.data as SocketData;
  if (!data.roomCode) return respond(ack, { ok: false, error: "not in a room" });
  const room = await app.prisma.room.findUnique({
    where: { code: data.roomCode },
    include: { memberships: { include: { user: true } } },
  });
  if (!room) return respond(ack, { ok: false, error: "room not found" });
  if (room.adminId !== data.auth.userId) return respond(ack, { ok: false, error: "not admin" });
  if (room.status !== "LOBBY") return respond(ack, { ok: false, error: "already started" });

  const playerMembers = room.memberships.filter((m: { role: string }) => m.role === "PLAYER");
  if (playerMembers.length < 2 || playerMembers.length > 4) {
    return respond(ack, { ok: false, error: "need 2-4 players" });
  }

  const state = createGame(
    room.rngSeed,
    playerMembers.map((m: { playerId: string; user: { displayName: string } }) => ({
      id: m.playerId,
      name: m.user.displayName,
    })),
  );

  const rt = app.rooms.upsert(room.id, room.code);
  rt.state = state;

  await app.prisma.$transaction([
    app.prisma.room.update({ where: { id: room.id }, data: { status: "PLAYING" } }),
    app.prisma.gameSnapshot.create({
      data: { roomId: room.id, version: state.version, state: state as object },
    }),
  ]);

  broadcastState(io, room.code, rt, room.memberships);
  respond(ack, { ok: true });
}

async function handleAction(
  app: FastifyInstance,
  io: IOServer,
  socket: Socket,
  action: Action,
  ack: ((res: unknown) => void) | undefined,
): Promise<void> {
  const data = socket.data as SocketData;
  if (!data.roomCode || !data.playerId) {
    return respond(ack, { ok: false, error: "not in a room" });
  }
  if (data.role !== "PLAYER") {
    return respond(ack, { ok: false, error: "spectators cannot act" });
  }

  const parsed = ActionSchema.safeParse(action);
  if (!parsed.success) {
    return respond(ack, { ok: false, error: "invalid action schema" });
  }
  if (parsed.data.playerId !== data.playerId) {
    return respond(ack, { ok: false, error: "action playerId mismatch" });
  }

  const rt = app.rooms.getByCode(data.roomCode);
  if (!rt || !rt.state) {
    return respond(ack, { ok: false, error: "game not started" });
  }

  let result;
  try {
    result = applyAction(rt.state, parsed.data);
  } catch (err) {
    if (err instanceof IllegalActionError) {
      return respond(ack, { ok: false, error: err.message });
    }
    throw err;
  }
  rt.state = result.state;

  const room = await app.prisma.room.findUnique({
    where: { id: rt.id },
    include: { memberships: { include: { user: true } } },
  });
  if (!room) return;

  await app.prisma.$transaction([
    app.prisma.gameSnapshot.create({
      data: { roomId: rt.id, version: result.state.version, state: result.state as object },
    }),
    app.prisma.actionLog.create({
      data: {
        roomId: rt.id,
        version: result.state.version,
        playerId: data.playerId,
        action: parsed.data as object,
        events: result.events as object,
      },
    }),
    ...(result.state.phase === "ended"
      ? [app.prisma.room.update({ where: { id: rt.id }, data: { status: "ENDED" } })]
      : []),
  ]);

  broadcastState(io, data.roomCode, rt, room.memberships);
  respond(ack, { ok: true, version: result.state.version });
}

function broadcastState(
  io: IOServer,
  roomCode: string,
  rt: { state: VisibleGameState["players"] extends unknown ? Parameters<typeof filterStateFor>[0] | null : never },
  memberships: Array<{ userId: string; playerId: string; role: string }>,
): void {
  if (!rt.state) return;
  const sockets = io.of("/").adapter.rooms.get(roomChannel(roomCode));
  if (!sockets) return;
  for (const sid of sockets) {
    const s = io.sockets.sockets.get(sid);
    if (!s) continue;
    const sd = s.data as SocketData;
    const state = filterStateFor(rt.state, sd.playerId);
    s.emit("stateUpdate", { state });
  }
}

function roomChannel(code: string): string {
  return `room:${code}`;
}

function respond(ack: ((res: unknown) => void) | undefined, payload: unknown): void {
  if (typeof ack === "function") ack(payload);
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
