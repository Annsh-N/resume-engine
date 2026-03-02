import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import { createAwardSchema, updateAwardSchema } from "../schemas/awards";
import { notFound, parseBody, parseParams } from "../utils/http";

const awardsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/awards", async (request) => {
    return prisma.award.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ date: "desc" }, { created_at: "desc" }],
    });
  });

  app.post("/awards", async (request, reply) => {
    const body = parseBody(createAwardSchema, request.body);

    const award = await prisma.award.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(award);
  });

  app.put("/awards/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateAwardSchema, request.body);

    const existing = await prisma.award.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Award not found");
    }

    return prisma.award.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/awards/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.award.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Award not found");
    }

    return reply.code(204).send();
  });
};

export default awardsRoutes;
