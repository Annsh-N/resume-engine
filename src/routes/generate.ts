import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { RESUME_TEMPLATE_KEYS } from "../latex/assemble";
import { getBankExport } from "../utils/bankExport";
import { parseBody } from "../utils/http";
import { generateResume } from "../generate/service";

const generateRequestSchema = z.object({
  jobDescription: z.string().min(20),
  template: z.enum(RESUME_TEMPLATE_KEYS).optional(),
  density: z.enum(["normal", "tight"]).optional(),
  includePdf: z.boolean().optional(),
});

const generateRoutes: FastifyPluginAsync = async (app) => {
  app.post("/generate", async (request) => {
    const body = parseBody(generateRequestSchema, request.body);
    const bank = await getBankExport(request.user.id);

    return generateResume({
      bank,
      jobDescription: body.jobDescription,
      template: body.template ?? "standard_swe",
      density: body.density ?? "normal",
      includePdf: body.includePdf ?? false,
    });
  });
};

export default generateRoutes;
