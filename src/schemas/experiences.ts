import { z } from "zod";
import {
  jsonObjectSchema,
  nonEmptyArrayOfStrings,
  nonEmptyUpdate,
} from "./common";

const employmentType = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
  "TEMPORARY",
  "APPRENTICESHIP",
]);

const experienceBase = {
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  employment_type: employmentType.optional(),
  tags: nonEmptyArrayOfStrings.default([]),
  tech_stack: nonEmptyArrayOfStrings.default([]),
  priority: z.number().int().min(1).max(10).default(5),
  context: z.string().optional(),
  facts: jsonObjectSchema.optional(),
};

const bulletBase = {
  order_index: z.number().int().min(0),
  bullet_long: z.string().min(1),
  bullet_medium: z.string().nullable().optional(),
  bullet_short: z.string().nullable().optional(),
  skills_tags: nonEmptyArrayOfStrings.default([]),
  metrics: jsonObjectSchema.optional(),
};

export const createExperienceSchema = z.object(experienceBase);
export const updateExperienceSchema = nonEmptyUpdate(experienceBase);
export const createExperienceBulletSchema = z.object(bulletBase);
export const updateExperienceBulletSchema = nonEmptyUpdate(bulletBase);
