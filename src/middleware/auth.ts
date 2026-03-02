import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: number;
    };
  }
}

const authMiddleware: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (request) => {
    request.user = { id: 1 };
  });
};

export default fp(authMiddleware, { name: "demo-auth-middleware" });
