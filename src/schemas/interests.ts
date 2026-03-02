import { z } from "zod";
import { nonEmptyArrayOfStrings, nonEmptyUpdate } from "./common";

const interestsBase = {
  items: nonEmptyArrayOfStrings.default([]),
};

export const createInterestsSchema = z.object(interestsBase);
export const updateInterestsSchema = nonEmptyUpdate(interestsBase);
