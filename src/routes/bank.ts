import { FastifyPluginAsync } from "fastify";
import prisma from "../db";

type BankExportResponse = {
  user: { id: number };
  profile: {
    full_name: string;
    location: string;
    phone: string | null;
    email: string;
    headline: string | null;
    links: Array<{
      label: string;
      url: string;
      priority: number;
    }>;
  } | null;
  education: unknown[];
  experiences: unknown[];
  projects: unknown[];
  skills: { groups: unknown[] };
  interests: { items: string[] };
  certificates: unknown[];
  awards: unknown[];
  leadership: unknown[];
  meta: {
    exported_at: string;
    schema_version: 1;
  };
};

const bankRoutes: FastifyPluginAsync = async (app) => {
  app.get("/bank/export", async (request): Promise<BankExportResponse> => {
    const [
      education,
      experiences,
      projects,
      skillsGroups,
      interests,
      profile,
      certificates,
      awards,
      leadership,
    ] = await prisma.$transaction([
      prisma.education.findMany({
        where: { user_id: request.user.id },
        orderBy: [
          { end_date: "desc" },
          { start_date: "desc" },
          { created_at: "desc" },
        ],
      }),
      prisma.experience.findMany({
        where: { user_id: request.user.id },
        orderBy: [
          { end_date: { sort: "desc", nulls: "first" } },
          { start_date: "desc" },
          { created_at: "desc" },
        ],
        include: {
          bullets: {
            orderBy: { order_index: "asc" },
          },
        },
      }),
      prisma.project.findMany({
        where: { user_id: request.user.id },
        orderBy: [
          { end_date: { sort: "desc", nulls: "first" } },
          { start_date: "desc" },
          { created_at: "desc" },
        ],
        include: {
          bullets: {
            orderBy: { order_index: "asc" },
          },
        },
      }),
      prisma.skillsGroup.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ priority: "desc" }, { created_at: "desc" }],
      }),
      prisma.interests.findFirst({
        where: { user_id: request.user.id },
      }),
      prisma.userProfile.findUnique({
        where: { user_id: request.user.id },
        include: {
          links: {
            orderBy: [{ priority: "desc" }, { created_at: "asc" }],
          },
        },
      }),
      prisma.certificate.findMany({
        where: { user_id: request.user.id },
        orderBy: [
          { issued_date: { sort: "desc", nulls: "last" } },
          { created_at: "desc" },
        ],
      }),
      prisma.award.findMany({
        where: { user_id: request.user.id },
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
      }),
      prisma.leadership.findMany({
        where: { user_id: request.user.id },
        orderBy: [
          { end_date: { sort: "desc", nulls: "first" } },
          { start_date: "desc" },
          { created_at: "desc" },
        ],
      }),
    ]);

    return {
      user: { id: request.user.id },
      profile: profile
        ? {
            full_name: profile.full_name,
            location: profile.location,
            phone: profile.phone,
            email: profile.email,
            headline: profile.headline,
            links: profile.links.map((link) => ({
              label: link.label,
              url: link.url,
              priority: link.priority,
            })),
          }
        : null,
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
