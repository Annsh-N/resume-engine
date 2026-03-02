import { z } from "zod";
import { nonEmptyUpdate } from "./common";

const awardBase = {
  title: z.string().min(1),
  issuer: z.string().min(1),
  date: z.coerce.date(),
  notes: z.string().optional(),
};

export const createAwardSchema = z.object(awardBase);
export const updateAwardSchema = nonEmptyUpdate(awardBase);
