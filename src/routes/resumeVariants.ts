import { Prisma } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import prisma from "../db";
import { generateResume } from "../generate/service";
import {
  createResumeVariantSchema,
  generateResumeVariantSchema,
  resumeVariantDetailQuerySchema,
  updateResumeVariantSchema,
} from "../schemas/resumeVariants";
import { getBankExport } from "../utils/bankExport";
import { notFound, parseBody, parseParams, parseQuery } from "../utils/http";
import { idParamSchema } from "../schemas/common";

type ResumeVariantRecord = Prisma.ResumeVariantGetPayload<{
  select: {
    id: true;
    name: true;
    job_title: true;
    company: true;
    job_url: true;
    job_description: true;
    template: true;
    density: true;
    latex: true;
    pdf_data: true;
    page_count: true;
    fits_on_one_page: true;
    compiler: true;
    trim_passes: true;
    estimated_line_budget: true;
    estimated_lines_used: true;
    include_sections: true;
    selected_education_ids: true;
    selected_skill_group_ids: true;
    selected_experience_ids: true;
    selected_project_ids: true;
    selected_certification_ids: true;
    selected_award_ids: true;
    selected_leadership_ids: true;
    plan: true;
    created_at: true;
    updated_at: true;
  };
}>;

const variantSelect = {
  id: true,
  name: true,
  job_title: true,
  company: true,
  job_url: true,
  job_description: true,
  template: true,
  density: true,
  latex: true,
  pdf_data: true,
  page_count: true,
  fits_on_one_page: true,
  compiler: true,
  trim_passes: true,
  estimated_line_budget: true,
  estimated_lines_used: true,
  include_sections: true,
  selected_education_ids: true,
  selected_skill_group_ids: true,
  selected_experience_ids: true,
  selected_project_ids: true,
  selected_certification_ids: true,
  selected_award_ids: true,
  selected_leadership_ids: true,
  plan: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ResumeVariantSelect;

const toPdfBase64 = (pdfData: Uint8Array | null): string | undefined => {
  if (!pdfData) {
    return undefined;
  }

  return Buffer.from(pdfData).toString("base64");
};

const requireRecord = <T>(value: T, message: string): NonNullable<T> => {
  if (value === null || value === undefined) {
    notFound(message);
  }

  return value as NonNullable<T>;
};

const serializeVariantSummary = (variant: ResumeVariantRecord) => {
  return {
    id: variant.id,
    name: variant.name,
    jobTitle: variant.job_title,
    company: variant.company,
    jobUrl: variant.job_url,
    template: variant.template,
    density: variant.density,
    pageCount: variant.page_count,
    fitsOnOnePage: variant.fits_on_one_page,
    compiler: variant.compiler,
    trimPasses: variant.trim_passes,
    estimatedLineBudget: variant.estimated_line_budget,
    estimatedLinesUsed: variant.estimated_lines_used,
    includeSections: variant.include_sections,
    selectedEducationIds: variant.selected_education_ids,
    selectedSkillGroupIds: variant.selected_skill_group_ids,
    selectedExperienceIds: variant.selected_experience_ids,
    selectedProjectIds: variant.selected_project_ids,
    selectedCertificationIds: variant.selected_certification_ids,
    selectedAwardIds: variant.selected_award_ids,
    selectedLeadershipIds: variant.selected_leadership_ids,
    hasPdf: Boolean(variant.pdf_data),
    createdAt: variant.created_at,
    updatedAt: variant.updated_at,
  };
};

const serializeVariantDetail = (
  variant: ResumeVariantRecord,
  includePdf: boolean,
) => {
  return {
    ...serializeVariantSummary(variant),
    jobDescription: variant.job_description,
    latex: variant.latex,
    plan: variant.plan,
    pdfBase64: includePdf ? toPdfBase64(variant.pdf_data) : undefined,
  };
};

const buildVariantCreateData = ({
  userId,
  name,
  jobTitle,
  company,
  jobUrl,
  jobDescription,
  template,
  density,
  latex,
  pdfBase64,
  pageCount,
  fitsOnOnePage,
  compiler,
  trimPasses,
  estimatedLineBudget,
  estimatedLinesUsed,
  plan,
}: {
  userId: number;
  name: string;
  jobTitle?: string;
  company?: string;
  jobUrl?: string;
  jobDescription: string;
  template: string;
  density: string;
  latex: string;
  pdfBase64?: string;
  pageCount: number;
  fitsOnOnePage: boolean;
  compiler?: string;
  trimPasses: number;
  estimatedLineBudget?: number;
  estimatedLinesUsed?: number;
  plan: {
    template: string;
    includeSections: string[];
    selectedEducationIds: string[];
    selectedSkillGroupIds: string[];
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
    selectedCertificationIds: string[];
    selectedAwardIds: string[];
    selectedLeadershipIds: string[];
  };
}): Prisma.ResumeVariantUncheckedCreateInput => {
  return {
    user_id: userId,
    name,
    job_title: jobTitle,
    company,
    job_url: jobUrl,
    job_description: jobDescription,
    template,
    density,
    latex,
    pdf_data: pdfBase64 ? Buffer.from(pdfBase64, "base64") : undefined,
    page_count: pageCount,
    fits_on_one_page: fitsOnOnePage,
    compiler,
    trim_passes: trimPasses,
    estimated_line_budget: estimatedLineBudget,
    estimated_lines_used: estimatedLinesUsed,
    include_sections: plan.includeSections,
    selected_education_ids: plan.selectedEducationIds,
    selected_skill_group_ids: plan.selectedSkillGroupIds,
    selected_experience_ids: plan.selectedExperienceIds,
    selected_project_ids: plan.selectedProjectIds,
    selected_certification_ids: plan.selectedCertificationIds,
    selected_award_ids: plan.selectedAwardIds,
    selected_leadership_ids: plan.selectedLeadershipIds,
    plan,
  };
};

const normalizePlan = (plan: {
  template: string;
  includeSections?: string[];
  selectedEducationIds?: string[];
  selectedSkillGroupIds?: string[];
  selectedExperienceIds?: string[];
  selectedProjectIds?: string[];
  selectedCertificationIds?: string[];
  selectedAwardIds?: string[];
  selectedLeadershipIds?: string[];
}) => {
  return {
    template: plan.template,
    includeSections: plan.includeSections ?? [],
    selectedEducationIds: plan.selectedEducationIds ?? [],
    selectedSkillGroupIds: plan.selectedSkillGroupIds ?? [],
    selectedExperienceIds: plan.selectedExperienceIds ?? [],
    selectedProjectIds: plan.selectedProjectIds ?? [],
    selectedCertificationIds: plan.selectedCertificationIds ?? [],
    selectedAwardIds: plan.selectedAwardIds ?? [],
    selectedLeadershipIds: plan.selectedLeadershipIds ?? [],
  };
};

const resumeVariantsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/resume-variants/generate", async (request, reply) => {
    const body = parseBody(generateResumeVariantSchema, request.body);
    const bank = await getBankExport(request.user.id);
    const generated = await generateResume({
      bank,
      jobDescription: body.jobDescription,
      template: body.template ?? "standard_swe",
      density: body.density ?? "normal",
      includePdf: body.includePdf ?? true,
    });

    const variant = await prisma.resumeVariant.create({
      data: buildVariantCreateData({
        userId: request.user.id,
        name: body.name,
        jobTitle: body.jobTitle,
        company: body.company,
        jobUrl: body.jobUrl,
        jobDescription: body.jobDescription,
        template: body.template ?? "standard_swe",
        density: body.density ?? "normal",
        latex: generated.latex,
        pdfBase64: generated.pdfBase64,
        pageCount: generated.pageCount,
        fitsOnOnePage: generated.fitsOnOnePage,
        compiler: generated.compiler,
        trimPasses: generated.trimPasses,
        estimatedLineBudget: generated.estimatedLineBudget,
        estimatedLinesUsed: generated.estimatedLinesUsed,
        plan: generated.plan,
      }),
      select: variantSelect,
    });

    return reply.code(201).send(serializeVariantDetail(variant, false));
  });

  app.get("/resume-variants", async (request) => {
    const variants = await prisma.resumeVariant.findMany({
      where: { user_id: request.user.id },
      orderBy: [{ updated_at: "desc" }, { created_at: "desc" }],
      select: variantSelect,
    });

    return variants.map(serializeVariantSummary);
  });

  app.post("/resume-variants", async (request, reply) => {
    const body = parseBody(createResumeVariantSchema, request.body);

    const variant = await prisma.resumeVariant.create({
      data: buildVariantCreateData({
        userId: request.user.id,
        name: body.name,
        jobTitle: body.jobTitle,
        company: body.company,
        jobUrl: body.jobUrl,
        jobDescription: body.jobDescription,
        template: body.template,
        density: body.density,
        latex: body.latex,
        pdfBase64: body.pdfBase64,
        pageCount: body.pageCount,
        fitsOnOnePage: body.fitsOnOnePage,
        compiler: body.compiler,
        trimPasses: body.trimPasses ?? 0,
        estimatedLineBudget: body.estimatedLineBudget,
        estimatedLinesUsed: body.estimatedLinesUsed,
        plan: normalizePlan(body.plan),
      }),
      select: variantSelect,
    });

    return reply.code(201).send(serializeVariantDetail(variant, false));
  });

  app.get("/resume-variants/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const query = parseQuery(resumeVariantDetailQuerySchema, request.query);

    const variant = requireRecord(await prisma.resumeVariant.findFirst({
      where: { id, user_id: request.user.id },
      select: variantSelect,
    }), "Resume variant not found");

    return serializeVariantDetail(variant, query.includePdf ?? false);
  });

  app.get("/resume-variants/:id/pdf", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const variant = requireRecord(await prisma.resumeVariant.findFirst({
      where: { id, user_id: request.user.id },
      select: {
        name: true,
        pdf_data: true,
      },
    }), "Resume variant not found");

    const pdfData = requireRecord(variant.pdf_data, "Saved PDF not found for this resume variant");

    const fileName = `${variant.name.replace(/[^a-z0-9-_]+/gi, "_") || "resume-variant"}.pdf`;
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `inline; filename="${fileName}"`);

    return reply.send(Buffer.from(pdfData));
  });

  app.put("/resume-variants/:id", async (request) => {
    const { id } = parseParams(idParamSchema, request.params);
    const body = parseBody(updateResumeVariantSchema, request.body);

    const existing = await prisma.resumeVariant.findFirst({
      where: { id, user_id: request.user.id },
      select: { id: true },
    });

    if (!existing) {
      notFound("Resume variant not found");
    }

    const variant = await prisma.resumeVariant.update({
      where: { id },
      data: {
        name: body.name,
        job_title: body.jobTitle,
        company: body.company,
        job_url: body.jobUrl,
      },
      select: variantSelect,
    });

    return serializeVariantDetail(variant, false);
  });

  app.delete("/resume-variants/:id", async (request, reply) => {
    const { id } = parseParams(idParamSchema, request.params);

    const result = await prisma.resumeVariant.deleteMany({
      where: { id, user_id: request.user.id },
    });

    if (result.count === 0) {
      notFound("Resume variant not found");
    }

    return reply.code(204).send();
  });
};

export default resumeVariantsRoutes;
