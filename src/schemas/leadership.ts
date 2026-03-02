import { z } from "zod";
import { nonEmptyArrayOfStrings, nonEmptyUpdate } from "./common";

const leadershipBase = {
  role: z.string().min(1),
  org: z.string().min(1),
  location: z.string().min(1),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  bullets: nonEmptyArrayOfStrings.default([]),
};

export const createLeadershipSchema = z.object(leadershipBase);
export const updateLeadershipSchema = nonEmptyUpdate(leadershipBase);
