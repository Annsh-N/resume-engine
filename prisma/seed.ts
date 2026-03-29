import { EmploymentType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  await prisma.$transaction([
    prisma.userProfile.deleteMany({ where: { user_id: 1 } }),
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
      start_date: new Date("2024-05-20"),
      end_date: new Date("2024-08-16"),
      employment_type: EmploymentType.INTERNSHIP,
      tags: ["backend", "api", "platform", "reliability"],
      tech_stack: ["Node.js", "TypeScript", "Fastify", "PostgreSQL", "Redis"],
      priority: 1,
      context: "Worked on recruiter tooling and shared platform APIs used across internal hiring products.",
      facts: {
        system_context: [
          "Internal platform serving candidate and recruiter workflows",
          "Legacy endpoints were inconsistent and under-instrumented",
        ],
        actions: [
          "Designed new APIs",
          "Added telemetry",
          "Introduced schema validation",
        ],
        metrics: ["Reduced p95 latency by 22%", "Cut onboarding time for new integrations by 40%"],
      },
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Designed and shipped a TypeScript Fastify API that centralized candidate profile ingestion across recruiter workflows, reducing p95 latency by 22%.",
            bullet_medium:
              "Shipped Fastify ingestion API that reduced recruiter workflow latency by 22%.",
            bullet_short: "Shipped recruiter ingestion API with 22% lower latency.",
            skills_tags: ["Fastify", "TypeScript", "API Design", "PostgreSQL"],
            metrics: { latency_reduction_pct: 22 },
          },
          {
            order_index: 2,
            bullet_long:
              "Modeled normalized PostgreSQL entities and authored Prisma migrations for profile, link, and resume-content records powering downstream generation services.",
            bullet_medium:
              "Modeled PostgreSQL schema and Prisma migrations for generation-ready profile data.",
            bullet_short: "Modeled generation-ready PostgreSQL schema.",
            skills_tags: ["Prisma", "PostgreSQL", "Schema Design"],
            metrics: { tables_added: 12 },
          },
          {
            order_index: 3,
            bullet_long:
              "Added structured error boundaries, request logging, and Redis-backed request tracing to improve diagnosis for API consumers and support teams.",
            bullet_medium:
              "Added logging, tracing, and error handling for platform APIs.",
            bullet_short: "Improved API observability with tracing and logging.",
            skills_tags: ["Logging", "Tracing", "Redis", "Reliability"],
          },
          {
            order_index: 4,
            bullet_long:
              "Partnered with frontend engineers to define response contracts and validation rules, cutting integration rework during rollout.",
            bullet_medium:
              "Defined API contracts with frontend partners to reduce rollout rework.",
            bullet_short: "Defined API contracts that reduced rollout rework.",
            skills_tags: ["Cross-functional", "API Contracts"],
          },
        ],
      },
    },
  });

  await prisma.experience.create({
    data: {
      user_id: 1,
      title: "Platform Engineering Intern",
      company: "Nimbus Labs",
      location: "San Francisco, CA",
      start_date: new Date("2023-06-01"),
      end_date: new Date("2023-08-25"),
      employment_type: EmploymentType.INTERNSHIP,
      tags: ["infra", "platform", "cloud", "kubernetes", "observability"],
      tech_stack: ["Go", "AWS", "Terraform", "Kubernetes", "Grafana", "Prometheus"],
      priority: 2,
      context: "Worked on deployment tooling and observability for internal services on AWS.",
      facts: {
        actions: [
          "Automated Terraform modules",
          "Improved service dashboards",
          "Built deployment safety checks",
        ],
        metrics: ["Cut service rollout time by 31%", "Reduced noisy alerts by 45%"],
      },
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Automated reusable Terraform modules for ECS and IAM provisioning, reducing service rollout time for new teams by 31%.",
            bullet_medium:
              "Built Terraform modules that cut new-service rollout time by 31%.",
            bullet_short: "Built Terraform modules that sped up service rollout by 31%.",
            skills_tags: ["Terraform", "AWS", "Infrastructure"],
            metrics: { rollout_time_reduction_pct: 31 },
          },
          {
            order_index: 2,
            bullet_long:
              "Created Kubernetes deployment guardrails and health-check automation that blocked unsafe releases before production traffic was shifted.",
            bullet_medium:
              "Built Kubernetes deployment guardrails to block unsafe releases.",
            bullet_short: "Added Kubernetes deployment guardrails.",
            skills_tags: ["Kubernetes", "Reliability", "CI/CD"],
          },
          {
            order_index: 3,
            bullet_long:
              "Redesigned Prometheus alerts and Grafana dashboards for shared services, reducing noisy pages by 45% while preserving incident coverage.",
            bullet_medium:
              "Improved Prometheus alerts and Grafana dashboards, cutting noisy pages by 45%.",
            bullet_short: "Reduced noisy alerts by 45% with better observability.",
            skills_tags: ["Prometheus", "Grafana", "Observability"],
            metrics: { noisy_alert_reduction_pct: 45 },
          },
          {
            order_index: 4,
            bullet_long:
              "Documented production runbooks and escalation paths for platform services used by eight engineering teams.",
            bullet_medium:
              "Wrote runbooks and escalation docs for shared platform services.",
            bullet_short: "Wrote runbooks for shared platform services.",
            skills_tags: ["Runbooks", "Platform"],
          },
        ],
      },
    },
  });

  await prisma.experience.create({
    data: {
      user_id: 1,
      title: "Full Stack Engineer Co-op",
      company: "Meridian Payments",
      location: "Chicago, IL",
      start_date: new Date("2022-01-10"),
      end_date: new Date("2022-08-12"),
      employment_type: EmploymentType.CONTRACT,
      tags: ["fullstack", "fintech", "payments", "frontend", "backend"],
      tech_stack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Stripe"],
      priority: 3,
      context: "Built merchant onboarding and transaction support workflows for a payments product.",
      facts: {
        actions: [
          "Built onboarding flows",
          "Integrated payment APIs",
          "Improved analytics instrumentation",
        ],
        metrics: ["Raised conversion by 12%", "Reduced support tickets by 18%"],
      },
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Built React and TypeScript onboarding flows for merchant verification, increasing activation conversion by 12% for small-business customers.",
            bullet_medium:
              "Built React onboarding flows that increased merchant activation by 12%.",
            bullet_short: "Built onboarding flows that improved activation by 12%.",
            skills_tags: ["React", "TypeScript", "Frontend"],
            metrics: { activation_lift_pct: 12 },
          },
          {
            order_index: 2,
            bullet_long:
              "Implemented Node.js services and PostgreSQL queries for payment status, dispute history, and merchant support workflows.",
            bullet_medium:
              "Implemented Node.js and PostgreSQL services for payment support workflows.",
            bullet_short: "Built payment support services with Node.js and PostgreSQL.",
            skills_tags: ["Node.js", "PostgreSQL", "Payments"],
          },
          {
            order_index: 3,
            bullet_long:
              "Integrated Stripe webhooks and reconciliation checks to reduce failed-payment support tickets by 18%.",
            bullet_medium:
              "Integrated Stripe webhooks and reconciliation checks, cutting support tickets by 18%.",
            bullet_short: "Integrated Stripe webhooks that cut support tickets by 18%.",
            skills_tags: ["Stripe", "Webhooks", "Payments"],
            metrics: { support_ticket_reduction_pct: 18 },
          },
          {
            order_index: 4,
            bullet_long:
              "Added dashboard instrumentation for onboarding and payout events to help product managers identify drop-off points.",
            bullet_medium:
              "Added analytics instrumentation for onboarding and payout events.",
            bullet_short: "Added analytics for onboarding and payout events.",
            skills_tags: ["Analytics", "Dashboards"],
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      user_id: 1,
      name: "Resume Compiler",
      description: "Structured resume inventory with JD-aware generation and LaTeX export.",
      start_date: new Date("2025-01-01"),
      end_date: null,
      tags: ["resume", "backend", "api", "llm"],
      tech_stack: ["Fastify", "Prisma", "PostgreSQL", "TypeScript"],
      priority: 1,
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Built a section-based backend that stores structured resume facts, bullets, and metadata for deterministic resume generation workflows.",
            bullet_medium:
              "Built backend for structured resume facts and deterministic generation workflows.",
            bullet_short: "Built structured backend for deterministic resume generation.",
            skills_tags: ["Fastify", "Prisma", "PostgreSQL"],
          },
          {
            order_index: 2,
            bullet_long:
              "Implemented normalized bank export and template-driven LaTeX rendering to generate multiple SWE resume variants from the same source of truth.",
            bullet_medium:
              "Implemented export and template-driven LaTeX rendering for SWE resume variants.",
            bullet_short: "Implemented template-driven LaTeX resume rendering.",
            skills_tags: ["LaTeX", "API", "TypeScript"],
          },
          {
            order_index: 3,
            bullet_long:
              "Added section templates, ordered optional sections, and density controls to keep generated resumes within strict formatting constraints.",
            bullet_medium:
              "Added templates and layout controls for strict resume formatting.",
            bullet_short: "Added templates and layout controls for strict formatting.",
            skills_tags: ["Rendering", "Template Design"],
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      user_id: 1,
      name: "Service Health Console",
      description: "Platform dashboard for service rollout, alerting, and reliability signals.",
      start_date: new Date("2024-01-15"),
      end_date: new Date("2024-04-30"),
      tags: ["infra", "platform", "observability", "reliability"],
      tech_stack: ["React", "Go", "Prometheus", "Grafana", "Docker"],
      priority: 2,
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Built a reliability dashboard that surfaced deployment health, error budgets, and alert volume for platform services used by multiple teams.",
            bullet_medium:
              "Built reliability dashboard for deployment health and error-budget tracking.",
            bullet_short: "Built dashboard for deployment health and error budgets.",
            skills_tags: ["Observability", "React", "Grafana"],
          },
          {
            order_index: 2,
            bullet_long:
              "Aggregated Prometheus metrics and deployment metadata into summary views that sped up incident triage during rollout windows.",
            bullet_medium:
              "Aggregated metrics and deployment metadata to improve incident triage.",
            bullet_short: "Improved incident triage with aggregated metrics views.",
            skills_tags: ["Prometheus", "Metrics", "Go"],
          },
          {
            order_index: 3,
            bullet_long:
              "Packaged the console in Docker and documented local development workflows for platform engineers.",
            bullet_medium:
              "Containerized the console and documented local development workflows.",
            bullet_short: "Containerized the console and documented setup.",
            skills_tags: ["Docker", "Developer Experience"],
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      user_id: 1,
      name: "Support Copilot",
      description: "Retrieval-augmented support assistant for internal knowledge and ticket summaries.",
      start_date: new Date("2024-08-01"),
      end_date: new Date("2024-12-10"),
      tags: ["ml", "llm", "python", "rag"],
      tech_stack: ["Python", "FastAPI", "OpenAI API", "PostgreSQL"],
      priority: 3,
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Built a FastAPI service that generated support-response drafts from indexed internal docs and prior ticket summaries.",
            bullet_medium:
              "Built FastAPI service for support-response drafts using indexed docs.",
            bullet_short: "Built FastAPI service for support-response drafts.",
            skills_tags: ["Python", "FastAPI", "LLM"],
          },
          {
            order_index: 2,
            bullet_long:
              "Designed retrieval and prompt-assembly logic to ground responses in approved knowledge sources instead of free-form generation.",
            bullet_medium:
              "Designed retrieval and prompt logic grounded in approved knowledge sources.",
            bullet_short: "Grounded generated responses in approved knowledge sources.",
            skills_tags: ["RAG", "Prompting", "Search"],
          },
          {
            order_index: 3,
            bullet_long:
              "Added evaluation fixtures and tracing to compare draft quality across prompt versions and document retrieval settings.",
            bullet_medium:
              "Added evaluation fixtures and tracing for prompt and retrieval experiments.",
            bullet_short: "Added evaluation fixtures for prompt experiments.",
            skills_tags: ["Evaluation", "Tracing", "OpenAI API"],
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      user_id: 1,
      name: "Campus Marketplace",
      description: "Student marketplace for listings, chat, and transaction handoff.",
      start_date: new Date("2023-02-01"),
      end_date: new Date("2023-05-20"),
      tags: ["fullstack", "web", "frontend", "backend"],
      tech_stack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
      priority: 4,
      bullets: {
        create: [
          {
            order_index: 1,
            bullet_long:
              "Built listing, search, and seller profile flows in Next.js and TypeScript for a student-to-student marketplace.",
            bullet_medium:
              "Built listing and search flows in Next.js for a student marketplace.",
            bullet_short: "Built listing and search flows in Next.js.",
            skills_tags: ["Next.js", "TypeScript", "Frontend"],
          },
          {
            order_index: 2,
            bullet_long:
              "Implemented PostgreSQL-backed listing APIs and moderation tooling to keep marketplace records consistent and searchable.",
            bullet_medium:
              "Implemented PostgreSQL-backed listing APIs and moderation tooling.",
            bullet_short: "Built listing APIs and moderation tooling.",
            skills_tags: ["PostgreSQL", "API Design", "Moderation"],
          },
          {
            order_index: 3,
            bullet_long:
              "Added responsive UI states and accessibility checks for common search, messaging, and checkout interactions.",
            bullet_medium:
              "Added responsive UI states and accessibility checks.",
            bullet_short: "Improved responsive UI and accessibility coverage.",
            skills_tags: ["Accessibility", "UI", "Tailwind CSS"],
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
        items: ["TypeScript", "Python", "SQL", "Go", "Java"],
        priority: 5,
      },
      {
        user_id: 1,
        group_name: "Backend",
        items: ["Node.js", "Fastify", "Express", "FastAPI", "Prisma"],
        priority: 4,
      },
      {
        user_id: 1,
        group_name: "Cloud & Infra",
        items: ["AWS", "Docker", "Kubernetes", "Terraform", "Grafana", "Prometheus"],
        priority: 3,
      },
      {
        user_id: 1,
        group_name: "Frontend",
        items: ["React", "Next.js", "Tailwind CSS"],
        priority: 2,
      },
      {
        user_id: 1,
        group_name: "Data & AI",
        items: ["PostgreSQL", "Redis", "OpenAI API", "Pandas"],
        priority: 1,
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

  await prisma.certificate.create({
    data: {
      user_id: 1,
      name: "HashiCorp Terraform Associate",
      issuer: "HashiCorp",
      issued_date: new Date("2024-10-01"),
      credential_url: "https://example.com/cert/terraform-associate",
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

  await prisma.award.create({
    data: {
      user_id: 1,
      title: "Engineering Dean's List",
      issuer: "State University",
      date: new Date("2024-05-01"),
      notes: "Recognized for top academic performance in the engineering cohort",
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

  await prisma.leadership.create({
    data: {
      user_id: 1,
      role: "Teaching Assistant",
      org: "Computer Science Department",
      location: "Bloomington, IN",
      start_date: new Date("2023-01-09"),
      end_date: new Date("2024-05-01"),
      bullets: [
        "Led debugging labs for data structures and systems courses serving 60+ students.",
        "Wrote review material and office-hour exercises for SQL, concurrency, and API design topics.",
      ],
    },
  });

  await prisma.userProfile.create({
    data: {
      user_id: 1,
      full_name: "Jane Doe",
      location: "Indianapolis, IN",
      phone: "+1-555-555-5555",
      email: "jane@example.com",
      headline: "Backend Engineer",
      links: {
        create: [
          {
            label: "LinkedIn",
            url: "https://linkedin.com/in/jane-doe",
            priority: 2,
          },
          {
            label: "GitHub",
            url: "https://github.com/janedoe",
            priority: 1,
          },
          {
            label: "Portfolio",
            url: "https://janedoe.dev",
            priority: 0,
          },
        ],
      },
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
