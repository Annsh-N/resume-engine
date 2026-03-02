import { EmploymentType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.$transaction([
    prisma.education.deleteMany({ where: { user_id: 1 } }),
    prisma.experience.deleteMany({ where: { user_id: 1 } }),
    prisma.project.deleteMany({ where: { user_id: 1 } }),
    prisma.skillsGroup.deleteMany({ where: { user_id: 1 } }),
    prisma.interests.deleteMany({ where: { user_id: 1 } }),
    prisma.certificate.deleteMany({ where: { user_id: 1 } }),
    prisma.award.deleteMany({ where: { user_id: 1 } }),
    prisma.leadership.deleteMany({ where: { user_id: 1 } }),
  ]);

  await prisma.education.create({
    data: {
      user_id: 1,
      school: "State University",
      degree: "B.S. Computer Science",
      majors: ["Computer Science"],
      location: "Bloomington, IN",
      start_date: new Date("2020-08-15"),
      end_date: new Date("2024-05-10"),
      gpa: 3.8,
      notes: "Dean's List",
      relevant_coursework: [
        "Distributed Systems",
        "Database Systems",
        "Operating Systems",
      ],
    },
  });

  await prisma.experience.create({
    data: {
      user_id: 1,
      title: "Software Engineer Intern",
      company: "Acme Tech",
      location: "Remote",
      start_date: new Date("2023-06-01"),
      end_date: new Date("2023-08-31"),
      employment_type: EmploymentType.INTERNSHIP,
      tags: ["backend", "api"],
      tech_stack: ["Node.js", "TypeScript", "PostgreSQL"],
      priority: 1,
      context: "Worked on internal tooling APIs.",
      facts: {
        system_context: ["Monolith to service extraction"],
        actions: ["Built CRUD APIs", "Added telemetry"],
        metrics: ["Reduced request latency by 22%"],
        constraints: ["No production downtime"],
      },
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Designed and shipped a TypeScript Fastify API to centralize candidate profile ingestion for recruiters.",
            bullet_medium:
              "Shipped Fastify API for profile ingestion used by recruiting.",
            bullet_short: "Shipped profile ingestion API.",
            skills_tags: ["Fastify", "TypeScript", "PostgreSQL"],
            metrics: { latency_ms_p95: 180 },
          },
          {
            order_index: 2,
            bullet_long:
              "Modeled normalized PostgreSQL entities and wrote Prisma migrations for structured resume content.",
            bullet_medium: "Modeled PostgreSQL schema with Prisma migrations.",
            bullet_short: "Modeled resume schema.",
            skills_tags: ["Prisma", "PostgreSQL"],
            metrics: { tables_added: 10 },
          },
          {
            order_index: 3,
            bullet_long:
              "Instrumented error handling and request logging to improve diagnosis for API consumers.",
            bullet_medium: "Added API error boundaries and logging.",
            bullet_short: "Improved API observability.",
            skills_tags: ["Logging", "API Design"],
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      user_id: 1,
      name: "Resume Bank",
      description: "Structured resume inventory with JSON export for generation.",
      start_date: new Date("2025-01-01"),
      end_date: null,
      tags: ["resume", "backend"],
      tech_stack: ["Fastify", "Prisma", "PostgreSQL"],
      priority: 1,
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Built a CRUD backend that stores resume content by section with strict user ownership checks.",
            bullet_medium: "Built section-based CRUD backend with ownership checks.",
            bullet_short: "Built CRUD backend.",
            skills_tags: ["Fastify", "Prisma"],
          },
          {
            order_index: 2,
            bullet_long:
              "Implemented normalized export endpoint to provide generation-ready JSON from relational data.",
            bullet_medium: "Implemented generation-ready export endpoint.",
            bullet_short: "Added export endpoint.",
            skills_tags: ["JSON", "API"],
          },
        ],
      },
    },
  });

  await prisma.skillsGroup.createMany({
    data: [
      {
        user_id: 1,
        group_name: "Languages",
        items: ["TypeScript", "Python", "SQL"],
        priority: 1,
      },
      {
        user_id: 1,
        group_name: "Frameworks",
        items: ["Fastify", "Express", "React"],
        priority: 2,
      },
      {
        user_id: 1,
        group_name: "Tools",
        items: ["Prisma", "PostgreSQL", "Docker"],
        priority: 3,
      },
    ],
  });

  await prisma.interests.create({
    data: {
      user_id: 1,
      items: ["Hiking", "Open-source contribution", "Mentoring"],
    },
  });

  await prisma.certificate.create({
    data: {
      user_id: 1,
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      issued_date: new Date("2024-04-15"),
      credential_url: "https://example.com/cert/aws-cloud-practitioner",
    },
  });

  await prisma.award.create({
    data: {
      user_id: 1,
      title: "Hackathon Winner",
      issuer: "Midwest Dev Conference",
      date: new Date("2023-11-10"),
      notes: "1st place in backend systems track",
    },
  });

  await prisma.leadership.create({
    data: {
      user_id: 1,
      role: "Engineering Club President",
      org: "University Engineering Club",
      location: "Bloomington, IN",
      start_date: new Date("2022-09-01"),
      end_date: new Date("2024-05-01"),
      bullets: [
        "Organized weekly technical workshops for 80+ students.",
        "Launched peer mentorship program for incoming members.",
      ],
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
