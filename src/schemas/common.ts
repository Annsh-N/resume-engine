import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const nestedIdParamSchema = z.object({
  id: z.string().uuid(),
  bulletId: z.string().uuid(),
});

export const jsonObjectSchema = z
  .any()
  .refine(
    (value) => value !== null && typeof value === "object" && !Array.isArray(value),
    "Expected a JSON object",
  );

export const nonEmptyArrayOfStrings = z.array(z.string().min(1));

export const nonEmptyUpdate = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .partial()
    .refine((value) => Object.keys(value).length > 0, "At least one field is required");
