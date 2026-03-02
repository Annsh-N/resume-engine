import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import {
  createSkillsGroupSchema,
  updateSkillsGroupSchema,
} from "../schemas/skills";
import { notFound, parseBody, parseParams } from "../utils/http";

const skillsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/skills", async (request) => {
    return prisma.skillsGroup.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ priority: "asc" }, { group_name: "asc" }],
    });
  });

  app.post("/skills", async (request, reply) => {
    const body = parseBody(createSkillsGroupSchema, request.body);

    const group = await prisma.skillsGroup.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(group);
  });

  app.put("/skills/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateSkillsGroupSchema, request.body);

    const existing = await prisma.skillsGroup.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Skills group not found");
    }

    return prisma.skillsGroup.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/skills/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.skillsGroup.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Skills group not found");
    }

    return reply.code(204).send();
  });
};

export default skillsRoutes;
