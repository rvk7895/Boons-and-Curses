import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySensible from "@fastify/sensible";
import { loadEnv, type Env } from "./env.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { roomRoutes } from "./routes/rooms.js";
import { RoomRegistry } from "./rooms/RoomRegistry.js";
import { attachSocketIO } from "./sockets/gameNamespace.js";
import type { Server as IOServer } from "socket.io";

declare module "fastify" {
  interface FastifyInstance {
    rooms: RoomRegistry;
    io: IOServer;
  }
}

export type BuildOptions = {
  env?: Env;
};

export async function buildServer(options: BuildOptions = {}) {
  const env = options.env ?? loadEnv();
  const loggerOpts: Record<string, unknown> = { level: env.LOG_LEVEL };
  if (env.NODE_ENV === "development") {
    loggerOpts.transport = {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss" },
    };
  }
  const app = Fastify({ logger: loggerOpts });

  await app.register(fastifyCors, { origin: env.CORS_ORIGIN });
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: env.NODE_ENV === "production",
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
  await app.register(fastifyRateLimit, {
    max: env.NODE_ENV === "test" ? 10000 : 120,
    timeWindow: "1 minute",
    skipOnError: false,
  });
  await app.register(fastifySensible);
  await app.register(prismaPlugin, { databaseUrl: env.DATABASE_URL });
  await app.register(authPlugin, { secret: env.JWT_SECRET });

  app.decorate("rooms", new RoomRegistry());

  app.get("/health", async () => ({ ok: true, rooms: app.rooms.count() }));

  await app.register(authRoutes);
  await app.register(roomRoutes);

  app.addHook("onReady", async () => {
    const io = attachSocketIO(app, app.server);
    app.decorate("io", io);
    app.addHook("onClose", async () => {
      io.close();
    });
  });

  return app;
}
