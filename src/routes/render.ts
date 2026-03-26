import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import {
  OPTIONAL_SECTION_KEYS,
  RESUME_TEMPLATE_KEYS,
  assembleResumeTex,
} from "../latex/assemble";
import { getBankExport } from "../utils/bankExport";
import { parseBody } from "../utils/http";

const renderRequestSchema = z.object({
  density: z.enum(["normal", "tight"]).optional(),
  template: z.enum(RESUME_TEMPLATE_KEYS).optional(),
  includeSections: z.array(z.enum(OPTIONAL_SECTION_KEYS)).optional(),
});

const renderRoutes: FastifyPluginAsync = async (app) => {
  app.post("/render", async (request) => {
    const body = parseBody(renderRequestSchema, request.body);
    const bank = await getBankExport(request.user.id);

    const latex = assembleResumeTex({
      bank,
      template: body.template,
      includeSections: body.includeSections,
      density: body.density,
    });

    return { latex };
  });
};

export default renderRoutes;
