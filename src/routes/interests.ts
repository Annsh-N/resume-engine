import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import {
  createInterestsSchema,
  updateInterestsSchema,
} from "../schemas/interests";
import { conflict, notFound, parseBody, parseParams } from "../utils/http";

const interestsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/interests", async (request) => {
    const interests = await prisma.interests.findFirst({
      where: { user_id: request.user.id },
    });

    return interests ?? { items: [] };
  });

  app.post("/interests", async (request, reply) => {
    const body = parseBody(createInterestsSchema, request.body);

    const existing = await prisma.interests.findUnique({
      where: { user_id: request.user.id },
      select: { id: true },
    });

    if (existing) {
      conflict("Interests already exist for this user. Use PUT to update.");
    }

    const interests = await prisma.interests.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(interests);
  });

  app.put("/interests/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateInterestsSchema, request.body);

    const existing = await prisma.interests.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Interests record not found");
    }

    return prisma.interests.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/interests/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.interests.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Interests record not found");
    }

    return reply.code(204).send();
  });
};

export default interestsRoutes;
