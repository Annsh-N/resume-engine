import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema, nestedIdParamSchema } from "../schemas/common";
import {
  createProjectBulletSchema,
  createProjectSchema,
  updateProjectBulletSchema,
  updateProjectSchema,
} from "../schemas/projects";
import { notFound, parseBody, parseParams } from "../utils/http";

const projectsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects", async (request) => {
    return prisma.project.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ priority: "asc" }, { start_date: "desc" }],
      include: {
        bullets: {
          orderBy: { order_index: "asc" },
        },
      },
    });
  });

  app.post("/projects", async (request, reply) => {
    const body = parseBody(createProjectSchema, request.body);

    const project = await prisma.project.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(project);
  });

  app.put("/projects/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateProjectSchema, request.body);

    const existing = await prisma.project.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Project record not found");
    }

    return prisma.project.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/projects/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.project.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Project record not found");
    }

    return reply.code(204).send();
  });

  app.post("/projects/:id/bullets", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(createProjectBulletSchema, request.body);

    const existing = await prisma.project.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Project record not found");
    }

    const bullet = await prisma.projectBullet.create({
      data: {
        ...body,
        project_id: id,
      },
    });

    return reply.code(201).send(bullet);
  });

  app.put("/projects/:id/bullets/:bulletId", async (request) => {
    const { id, bulletId } = parseParams(nestedIdParamSchema, request.params);
    const body = parseBody(updateProjectBulletSchema, request.body);

    const project = await prisma.project.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!project) {
      notFound("Project record not found");
    }

    const bullet = await prisma.projectBullet.findFirst({
      where: { id: bulletId, project_id: id },
      select: { id: true },
    });

    if (!bullet) {
      notFound("Project bullet not found");
    }

    return prisma.projectBullet.update({
      where: { id: bulletId },
      data: body,
    });
  });

  app.delete("/projects/:id/bullets/:bulletId", async (request, reply) => {
    const { id, bulletId } = parseParams(nestedIdParamSchema, request.params);

    const project = await prisma.project.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!project) {
      notFound("Project record not found");
    }

    const result = await prisma.projectBullet.deleteMany({
      where: { id: bulletId, project_id: id },
    });

    if (result.count === 0) {
      notFound("Project bullet not found");
    }

    return reply.code(204).send();
  });
};

export default projectsRoutes;
