import type { FastifyInstance } from "fastify";
import { z } from "zod";

const GuestBody = z.object({
  deviceId: z.string().min(8).max(128),
  displayName: z.string().min(1).max(40),
});

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/auth/guest", async (req, reply) => {
    const parsed = GuestBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid body", issues: parsed.error.issues });
    }
    const { deviceId, displayName } = parsed.data;

    const user = await fastify.prisma.user.upsert({
      where: { deviceId },
      update: { displayName },
      create: { deviceId, displayName },
    });

    const token = fastify.jwt.sign(
      { userId: user.id, deviceId: user.deviceId, displayName: user.displayName },
      { expiresIn: "90d" },
    );

    return {
      token,
      user: {
        id: user.id,
        deviceId: user.deviceId,
        displayName: user.displayName,
      },
    };
  });

  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, async (req) => {
    const user = await fastify.prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user) return { user: null };
    return {
      user: { id: user.id, deviceId: user.deviceId, displayName: user.displayName },
    };
  });
}
