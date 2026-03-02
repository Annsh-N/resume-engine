import { z } from "zod";
import { nonEmptyArrayOfStrings, nonEmptyUpdate } from "./common";

const educationBase = {
  school: z.string().min(1),
  degree: z.string().min(1),
  majors: nonEmptyArrayOfStrings.default([]),
  location: z.string().min(1),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  gpa: z.number().min(0).max(4).optional(),
  notes: z.string().optional(),
  relevant_coursework: nonEmptyArrayOfStrings.default([]),
};

export const createEducationSchema = z.object(educationBase);
export const updateEducationSchema = nonEmptyUpdate(educationBase);
