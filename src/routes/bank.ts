import { FastifyPluginAsync } from "fastify";
import prisma from "../db";

const bankRoutes: FastifyPluginAsync = async (app) => {
  app.get("/bank/export", async (request) => {
    const [
      education,
      experiences,
      projects,
      skillsGroups,
      interests,
      certificates,
      awards,
      leadership,
    ] = await prisma.$transaction([
      prisma.education.findMany({
        where: { user_id: request.user.id },
        orderBy: { start_date: "desc" },
      }),
      prisma.experience.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ priority: "asc" }, { start_date: "desc" }],
        include: {
          bullets: {
            orderBy: { order_index: "asc" },
          },
        },
      }),
      prisma.project.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ priority: "asc" }, { start_date: "desc" }],
        include: {
          bullets: {
            orderBy: { order_index: "asc" },
          },
        },
      }),
      prisma.skillsGroup.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ priority: "asc" }, { group_name: "asc" }],
      }),
      prisma.interests.findFirst({
        where: { user_id: request.user.id },
      }),
      prisma.certificate.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ issued_date: "desc" }, { created_at: "desc" }],
      }),
      prisma.award.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
      }),
      prisma.leadership.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ start_date: "desc" }, { created_at: "desc" }],
      }),
    ]);

    return {
      user: { id: request.user.id },
      education,
      experiences,
      projects,
      skills: {
        groups: skillsGroups,
      },
      interests: {
        items: interests?.items ?? [],
      },
      certificates,
      awards,
      leadership,
      meta: {
        exported_at: new Date().toISOString(),
        schema_version: 1,
      },
    };
  });
};

export default bankRoutes;
