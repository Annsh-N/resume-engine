import Fastify from "fastify";
import prisma from "./db";
import authMiddleware from "./middleware/auth";
import awardsRoutes from "./routes/awards";
import bankRoutes from "./routes/bank";
import certificatesRoutes from "./routes/certificates";
import educationRoutes from "./routes/education";
import experiencesRoutes from "./routes/experiences";
import generateRoutes from "./routes/generate";
import interestsRoutes from "./routes/interests";
import leadershipRoutes from "./routes/leadership";
import profileRoutes from "./routes/profile";
import projectsRoutes from "./routes/projects";
import renderRoutes from "./routes/render";
import resumeVariantsRoutes from "./routes/resumeVariants";
import skillsRoutes from "./routes/skills";

const server = Fastify({ logger: true });

server.setErrorHandler((error: Error & { statusCode?: number; details?: unknown }, request, reply) => {
  const statusCode =
    typeof error.statusCode === "number"
      ? (error.statusCode ?? 500)
      : 500;

  if (statusCode >= 500) {
    request.log.error(error);
  }

  reply.code(statusCode).send({
    error: {
      message: statusCode >= 500 ? "Internal Server Error" : error.message,
      details: error.details,
    },
  });
});

server.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({
    error: {
      message: "Route not found",
    },
  });
});

server.get("/health", async () => ({ status: "ok" }));

server.register(authMiddleware);
server.register(educationRoutes);
server.register(experiencesRoutes);
server.register(projectsRoutes);
server.register(skillsRoutes);
server.register(interestsRoutes);
server.register(certificatesRoutes);
server.register(awardsRoutes);
server.register(leadershipRoutes);
server.register(profileRoutes);
server.register(bankRoutes);
server.register(renderRoutes);
server.register(generateRoutes);
server.register(resumeVariantsRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? "0.0.0.0";
    await server.listen({ port, host });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

const shutdown = async () => {
  await server.close();
  await prisma.$disconnect();
};

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

void start();
