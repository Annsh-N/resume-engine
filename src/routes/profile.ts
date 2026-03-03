import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import {
  createProfileLinkSchema,
  createProfileSchema,
  updateProfileLinkSchema,
  updateProfileSchema,
} from "../schemas/profile";
import { notFound, parseBody, parseParams } from "../utils/http";

type HttpError = Error & {
  statusCode?: number;
};

const badRequest = (message: string): never => {
  const error: HttpError = new Error(message);
  error.statusCode = 400;
  throw error;
};

const linksOrderBy = [{ priority: "desc" as const }, { created_at: "asc" as const }];

const profileRoutes: FastifyPluginAsync = async (app) => {
  app.get("/profile", async (request) => {
    return prisma.userProfile.findUnique({
      where: { user_id: request.user.id },
      include: {
        links: {
          orderBy: linksOrderBy,
        },
      },
    });
  });

  app.post("/profile", async (request, reply) => {
    const body = parseBody(createProfileSchema, request.body);

    const existing = await prisma.userProfile.findUnique({
      where: { user_id: request.user.id },
      select: { id: true },
    });

    if (existing) {
      badRequest("Profile already exists for this user");
    }

    const profile = await prisma.userProfile.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
      include: {
        links: {
          orderBy: linksOrderBy,
        },
      },
    });

    return reply.code(201).send(profile);
  });

  app.put("/profile", async (request) => {
    const body = parseBody(updateProfileSchema, request.body);

    const existing = await prisma.userProfile.findUnique({
      where: { user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Profile not found");
    }

    return prisma.userProfile.update({
      where: { user_id: request.user.id },
      data: body,
      include: {
        links: {
          orderBy: linksOrderBy,
        },
      },
    });
  });

  app.delete("/profile", async (_request, reply) => {
    const result = await prisma.userProfile.deleteMany({
      where: { user_id: _request.user.id },
    });

    if (result.count === 0) {
      notFound("Profile not found");
    }

    return reply.code(204).send();
  });

  app.post("/profile/links", async (request, reply) => {
    const body = parseBody(createProfileLinkSchema, request.body);

    const profile = await prisma.userProfile.findUnique({
      where: { user_id: request.user.id },
      select: { id: true },
    });

    if (!profile) {
      notFound("Profile not found");
    }
    const profileId = profile!.id;

    const link = await prisma.userLink.create({
      data: {
        ...body,
        profile_id: profileId,
      },
    });

    return reply.code(201).send(link);
  });

  app.put("/profile/links/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateProfileLinkSchema, request.body);

    const profile = await prisma.userProfile.findUnique({
      where: { user_id: request.user.id },
      select: { id: true },
    });

    if (!profile) {
      notFound("Profile not found");
    }
    const profileId = profile!.id;

    const existingLink = await prisma.userLink.findFirst({
      where: { id, profile_id: profileId },
      select: { id: true },
    });

    if (!existingLink) {
      notFound("Profile link not found");
    }

    return prisma.userLink.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/profile/links/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const profile = await prisma.userProfile.findUnique({
      where: { user_id: request.user.id },
      select: { id: true },
    });

    if (!profile) {
      notFound("Profile not found");
    }
    const profileId = profile!.id;

    const result = await prisma.userLink.deleteMany({
      where: { id, profile_id: profileId },
    });

    if (result.count === 0) {
      notFound("Profile link not found");
    }

    return reply.code(204).send();
  });
};

export default profileRoutes;
