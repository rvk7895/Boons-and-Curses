import { buildServer } from "../../src/server.js";
import type { Env } from "../../src/env.js";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://bc:bc@127.0.0.1:5432/bc_test?schema=public";

export function testEnv(): Env {
  return {
    DATABASE_URL: TEST_DB_URL,
    JWT_SECRET: "test-secret-test-secret-test-secret",
    PORT: 0,
    HOST: "127.0.0.1",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "error",
    NODE_ENV: "test",
  };
}

export async function buildTestApp() {
  const app = await buildServer({ env: testEnv() });
  return app;
}

export async function resetDb(app: Awaited<ReturnType<typeof buildTestApp>>): Promise<void> {
  await app.prisma.actionLog.deleteMany({});
  await app.prisma.gameSnapshot.deleteMany({});
  await app.prisma.roomMembership.deleteMany({});
  await app.prisma.room.deleteMany({});
  await app.prisma.user.deleteMany({});
}
