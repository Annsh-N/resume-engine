import { z } from "zod";
import { OPTIONAL_SECTION_KEYS, RESUME_TEMPLATE_KEYS } from "../latex/assemble";
import { nonEmptyUpdate } from "./common";

const uuidArraySchema = z.array(z.string().uuid()).default([]);

export const resumeVariantPlanSchema = z.object({
  template: z.enum(RESUME_TEMPLATE_KEYS),
  includeSections: z.array(z.enum(OPTIONAL_SECTION_KEYS)).default([]),
  selectedEducationIds: uuidArraySchema,
  selectedSkillGroupIds: uuidArraySchema,
  selectedExperienceIds: uuidArraySchema,
  selectedProjectIds: uuidArraySchema,
  selectedCertificationIds: uuidArraySchema,
  selectedAwardIds: uuidArraySchema,
  selectedLeadershipIds: uuidArraySchema,
});

const resumeVariantBase = {
  name: z.string().min(1),
  jobTitle: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  jobUrl: z.string().min(1).optional(),
};

export const createResumeVariantSchema = z.object({
  ...resumeVariantBase,
  jobDescription: z.string().min(20),
  template: z.enum(RESUME_TEMPLATE_KEYS),
  density: z.enum(["normal", "tight"]),
  latex: z.string().min(1),
  pdfBase64: z.string().min(1).optional(),
  pageCount: z.number().int().min(1),
  fitsOnOnePage: z.boolean(),
  compiler: z.string().min(1).optional(),
  trimPasses: z.number().int().min(0).default(0),
  estimatedLineBudget: z.number().int().min(1).optional(),
  estimatedLinesUsed: z.number().int().min(0).optional(),
  plan: resumeVariantPlanSchema,
});

export const generateResumeVariantSchema = z.object({
  ...resumeVariantBase,
  jobDescription: z.string().min(20),
  template: z.enum(RESUME_TEMPLATE_KEYS).optional(),
  density: z.enum(["normal", "tight"]).optional(),
  includePdf: z.boolean().optional(),
});

export const updateResumeVariantSchema = nonEmptyUpdate({
  name: z.string().min(1),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  jobUrl: z.string().min(1),
});

export const resumeVariantDetailQuerySchema = z.object({
  includePdf: z.coerce.boolean().optional(),
});
