import { z } from "zod";
import { nonEmptyArrayOfStrings, nonEmptyUpdate } from "./common";

const skillsGroupBase = {
  group_name: z.string().min(1),
  items: nonEmptyArrayOfStrings.default([]),
  priority: z.number().int().min(1).max(10).default(5),
};

export const createSkillsGroupSchema = z.object(skillsGroupBase);
export const updateSkillsGroupSchema = nonEmptyUpdate(skillsGroupBase);
