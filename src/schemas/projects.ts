import { z } from "zod";
import {
  jsonObjectSchema,
  nonEmptyArrayOfStrings,
  nonEmptyUpdate,
} from "./common";

const projectBase = {
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  tags: nonEmptyArrayOfStrings.default([]),
  tech_stack: nonEmptyArrayOfStrings.default([]),
  priority: z.number().int().min(1).max(10).default(5),
};

const bulletBase = {
  order_index: z.number().int().min(0),
  bullet_long: z.string().min(1),
  bullet_medium: z.string().nullable().optional(),
  bullet_short: z.string().nullable().optional(),
  skills_tags: nonEmptyArrayOfStrings.default([]),
  metrics: jsonObjectSchema.optional(),
};

export const createProjectSchema = z.object(projectBase);
export const updateProjectSchema = nonEmptyUpdate(projectBase);
export const createProjectBulletSchema = z.object(bulletBase);
export const updateProjectBulletSchema = nonEmptyUpdate(bulletBase);
