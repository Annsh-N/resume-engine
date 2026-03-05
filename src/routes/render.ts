import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { SECTION_KEYS, SectionKey, assembleResumeTex } from "../latex/assemble";
import { getBankExport } from "../utils/bankExport";
import { parseBody } from "../utils/http";

const renderRequestSchema = z
  .object({
    density: z.enum(["normal", "tight"]).optional(),
    sectionOrder: z.array(z.enum(SECTION_KEYS)).optional(),
    enabled: z.record(z.boolean()).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) {
      return;
    }

    for (const key of Object.keys(value.enabled)) {
      if (!SECTION_KEYS.includes(key as SectionKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown section in enabled map: ${key}`,
          path: ["enabled", key],
        });
      }
    }
  });

const renderRoutes: FastifyPluginAsync = async (app) => {
  app.post("/render", async (request) => {
    const body = parseBody(renderRequestSchema, request.body);
    const bank = await getBankExport(request.user.id);

    const latex = assembleResumeTex({
      bank,
      density: body.density,
      sectionOrder: body.sectionOrder,
      enabled: body.enabled,
    });

    return { latex };
  });
};

export default renderRoutes;
