import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateRoomCode, isValidRoomCode } from "../rooms/codes.js";

const CreateRoomBody = z.object({
  maxPlayers: z.number().int().min(2).max(4).default(4),
});

const JoinRoomBody = z.object({
  role: z.enum(["player", "spectator"]).default("player"),
});

const CODE_COLLISION_RETRIES = 10;

export async function roomRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/rooms", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const parsed = CreateRoomBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid body", issues: parsed.error.issues });
    }
    const { maxPlayers } = parsed.data;

    let code: string | null = null;
    for (let i = 0; i < CODE_COLLISION_RETRIES; i++) {
      const candidate = generateRoomCode();
      const exists = await fastify.prisma.room.findUnique({ where: { code: candidate } });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) return reply.code(503).send({ error: "could not generate room code" });

    const rngSeed = randomBytes(16).toString("hex");

    const room = await fastify.prisma.room.create({
      data: {
        code,
        adminId: req.auth.userId,
        maxPlayers,
        rngSeed,
        memberships: {
          create: {
            userId: req.auth.userId,
            role: "PLAYER",
            playerId: `p${randomBytes(4).toString("hex")}`,
          },
        },
      },
      include: { memberships: { include: { user: true } } },
    });

    return reply.code(201).send(serializeRoom(room));
  });

  fastify.get(
    "/rooms/:code",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const { code } = req.params as { code: string };
      if (!isValidRoomCode(code)) return reply.code(400).send({ error: "invalid code" });
      const room = await fastify.prisma.room.findUnique({
        where: { code },
        include: { memberships: { include: { user: true } } },
      });
      if (!room) return reply.code(404).send({ error: "not found" });
      return serializeRoom(room);
    },
  );

  fastify.post(
    "/rooms/:code/join",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const { code } = req.params as { code: string };
      if (!isValidRoomCode(code)) return reply.code(400).send({ error: "invalid code" });
      const parsed = JoinRoomBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid body", issues: parsed.error.issues });
      }

      const room = await fastify.prisma.room.findUnique({
        where: { code },
        include: { memberships: true },
      });
      if (!room) return reply.code(404).send({ error: "room not found" });

      const existing = room.memberships.find(
        (m: { userId: string }) => m.userId === req.auth.userId,
      );
      if (existing) {
        const full = await fastify.prisma.room.findUnique({
          where: { id: room.id },
          include: { memberships: { include: { user: true } } },
        });
        return serializeRoom(full!);
      }

      if (room.status !== "LOBBY" && parsed.data.role === "player") {
        return reply.code(409).send({ error: "room already started" });
      }

      const currentPlayers = room.memberships.filter(
        (m: { role: string }) => m.role === "PLAYER",
      ).length;
      if (parsed.data.role === "player" && currentPlayers >= room.maxPlayers) {
        return reply.code(409).send({ error: "room full" });
      }

      await fastify.prisma.roomMembership.create({
        data: {
          roomId: room.id,
          userId: req.auth.userId,
          role: parsed.data.role === "spectator" ? "SPECTATOR" : "PLAYER",
          playerId: `p${randomBytes(4).toString("hex")}`,
        },
      });

      const full = await fastify.prisma.room.findUnique({
        where: { id: room.id },
        include: { memberships: { include: { user: true } } },
      });
      return serializeRoom(full!);
    },
  );

  fastify.post(
    "/rooms/:code/leave",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const { code } = req.params as { code: string };
      const room = await fastify.prisma.room.findUnique({
        where: { code },
        include: { memberships: true },
      });
      if (!room) return reply.code(404).send({ error: "not found" });
      await fastify.prisma.roomMembership.deleteMany({
        where: { roomId: room.id, userId: req.auth.userId },
      });
      return { ok: true };
    },
  );
}

type RoomWithMemberships = {
  id: string;
  code: string;
  status: string;
  adminId: string;
  maxPlayers: number;
  createdAt: Date;
  memberships: Array<{
    id: string;
    userId: string;
    playerId: string;
    role: string;
    joinedAt: Date;
    user: { id: string; displayName: string };
  }>;
};

function serializeRoom(room: RoomWithMemberships) {
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    adminId: room.adminId,
    maxPlayers: room.maxPlayers,
    createdAt: room.createdAt,
    members: room.memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      playerId: m.playerId,
      role: m.role,
      displayName: m.user.displayName,
      joinedAt: m.joinedAt,
    })),
  };
}
