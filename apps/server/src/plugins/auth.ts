import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

export type AuthPayload = {
  userId: string;
  deviceId: string;
  displayName: string;
};

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    auth: AuthPayload;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthPayload;
  }
}

export const authPlugin = fp<{ secret: string }>(async (fastify, opts) => {
  await fastify.register(fjwt, { secret: opts.secret });

  fastify.decorateRequest("auth", null as unknown as AuthPayload);

  fastify.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      req.auth = req.user;
    } catch {
      reply.code(401).send({ error: "unauthorized" });
    }
  });
});
