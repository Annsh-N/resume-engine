import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { idParamSchema } from "../schemas/common";
import {
  createCertificateSchema,
  updateCertificateSchema,
} from "../schemas/certificates";
import { notFound, parseBody, parseParams } from "../utils/http";

const certificatesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/certificates", async (request) => {
    return prisma.certificate.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ issued_date: "desc" }, { created_at: "desc" }],
    });
  });

  app.post("/certificates", async (request, reply) => {
    const body = parseBody(createCertificateSchema, request.body);

    const certificate = await prisma.certificate.create({
      data: {
        ...body,
        user_id: request.user.id,
      },
    });

    return reply.code(201).send(certificate);
  });

  app.put("/certificates/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateCertificateSchema, request.body);

    const existing = await prisma.certificate.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Certificate not found");
    }

    return prisma.certificate.update({
      where: { id },
      data: body,
    });
  });

  app.delete("/certificates/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.certificate.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Certificate not found");
    }

    return reply.code(204).send();
  });
};

export default certificatesRoutes;
