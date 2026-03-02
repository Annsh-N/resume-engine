import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema, nestedIdParamSchema } from "../schemas/common";
import {
  createExperienceBulletSchema,
  createExperienceSchema,
  updateExperienceBulletSchema,
  updateExperienceSchema,
} from "../schemas/experiences";
import { notFound, parseBody, parseParams } from "../utils/http";

const experiencesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/experiences", async (request) => {
    return prisma.experience.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ priority: "asc" }, { start_date: "desc" }],
      include: {
        bullets: {
          orderBy: { order_index: "asc" },
        },
      },
    });
  });

  app.post("/experiences", async (request, reply) => {
    const body = parseBody(createExperienceSchema, request.body);

    const experience = await prisma.experience.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(experience);
  });

  app.put("/experiences/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateExperienceSchema, request.body);

    const existing = await prisma.experience.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Experience record not found");
    }

    return prisma.experience.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/experiences/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.experience.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Experience record not found");
    }

    return reply.code(204).send();
  });

  app.post("/experiences/:id/bullets", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(createExperienceBulletSchema, request.body);

    const existing = await prisma.experience.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Experience record not found");
    }

    const bullet = await prisma.experienceBullet.create({
      data: {
        ...body,
        experience_id: id,
      },
    });

    return reply.code(201).send(bullet);
  });

  app.put("/experiences/:id/bullets/:bulletId", async (request) => {
    const { id, bulletId } = parseParams(nestedIdParamSchema, request.params);
    const body = parseBody(updateExperienceBulletSchema, request.body);

    const experience = await prisma.experience.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!experience) {
      notFound("Experience record not found");
    }

    const bullet = await prisma.experienceBullet.findFirst({
      where: { id: bulletId, experience_id: id },
      select: { id: true },
    });

    if (!bullet) {
      notFound("Experience bullet not found");
    }

    return prisma.experienceBullet.update({
      where: { id: bulletId },
      data: body,
    });
  });

  app.delete("/experiences/:id/bullets/:bulletId", async (request, reply) => {
    const { id, bulletId } = parseParams(nestedIdParamSchema, request.params);

    const experience = await prisma.experience.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!experience) {
      notFound("Experience record not found");
    }

    const result = await prisma.experienceBullet.deleteMany({
      where: { id: bulletId, experience_id: id },
    });

    if (result.count === 0) {
      notFound("Experience bullet not found");
    }

    return reply.code(204).send();
  });
};

export default experiencesRoutes;
