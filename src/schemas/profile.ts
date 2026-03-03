import { z } from "zod";
import { nonEmptyUpdate } from "./common";

const profileBase = {
  full_name: z.string().min(1),
  location: z.string().min(1),
  phone: z.string().min(1).optional(),
  email: z.string().email(),
  headline: z.string().min(1).optional(),
};

const linkBase = {
  label: z.string().min(1),
  url: z.string().url(),
  priority: z.number().int().default(0),
};

export const createProfileSchema = z.object(profileBase);
export const updateProfileSchema = nonEmptyUpdate(profileBase);
export const createProfileLinkSchema = z.object(linkBase);
export const updateProfileLinkSchema = nonEmptyUpdate(linkBase);
