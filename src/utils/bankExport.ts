import prisma from "../db";
import { BankExport } from "../latex/types";

export const getBankExport = async (userId: number): Promise<BankExport> => {
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
      where: { user_id: userId },
      orderBy: [
        { end_date: "desc" },
        { start_date: "desc" },
        { created_at: "desc" },
      ],
    }),
    prisma.experience.findMany({
      where: { user_id: userId },
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
      where: { user_id: userId },
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
      where: { user_id: userId },
      orderBy: [{ priority: "desc" }, { created_at: "desc" }],
    }),
    prisma.interests.findFirst({
      where: { user_id: userId },
    }),
    prisma.userProfile.findUnique({
      where: { user_id: userId },
      include: {
        links: {
          orderBy: [{ priority: "desc" }, { created_at: "asc" }],
        },
      },
    }),
    prisma.certificate.findMany({
      where: { user_id: userId },
      orderBy: [
        { issued_date: { sort: "desc", nulls: "last" } },
        { created_at: "desc" },
      ],
    }),
    prisma.award.findMany({
      where: { user_id: userId },
      orderBy: [{ date: "desc" }, { created_at: "desc" }],
    }),
    prisma.leadership.findMany({
      where: { user_id: userId },
      orderBy: [
        { end_date: { sort: "desc", nulls: "first" } },
        { start_date: "desc" },
        { created_at: "desc" },
      ],
    }),
  ]);

  return {
    user: { id: userId },
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
};
