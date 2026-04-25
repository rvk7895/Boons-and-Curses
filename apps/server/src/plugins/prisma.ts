import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaPlugin = fp<{ databaseUrl: string }>(async (fastify, opts) => {
  const prisma = new PrismaClient({
    datasources: { db: { url: opts.databaseUrl } },
    log: [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }],
  });
  await prisma.$connect();
  fastify.decorate("prisma", prisma);
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
