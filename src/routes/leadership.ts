import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import {
  createLeadershipSchema,
  updateLeadershipSchema,
} from "../schemas/leadership";
import { notFound, parseBody, parseParams } from "../utils/http";

const leadershipRoutes: FastifyPluginAsync = async (app) => {
  app.get("/leadership", async (request) => {
    return prisma.leadership.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ start_date: "desc" }, { created_at: "desc" }],
    });
  });

  app.post("/leadership", async (request, reply) => {
    const body = parseBody(createLeadershipSchema, request.body);

    const leadership = await prisma.leadership.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(leadership);
  });

  app.put("/leadership/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateLeadershipSchema, request.body);

    const existing = await prisma.leadership.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Leadership record not found");
    }

    return prisma.leadership.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/leadership/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.leadership.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Leadership record not found");
    }

    return reply.code(204).send();
  });
};

export default leadershipRoutes;
