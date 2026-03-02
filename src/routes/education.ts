import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import {
  createEducationSchema,
  updateEducationSchema,
} from "../schemas/education";
import { notFound, parseBody, parseParams } from "../utils/http";

const educationRoutes: FastifyPluginAsync = async (app) => {
  app.get("/education", async (request) => {
    return prisma.education.findMany({
      where: { user_id: request.user.id },
      orderBy: { start_date: "desc" },
    });
  });

  app.post("/education", async (request, reply) => {
    const body = parseBody(createEducationSchema, request.body);
    const education = await prisma.education.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(education);
  });

  app.put("/education/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateEducationSchema, request.body);

    const existing = await prisma.education.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Education record not found");
    }

    return prisma.education.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/education/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.education.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Education record not found");
    }

    return reply.code(204).send();
  });
};

export default educationRoutes;
