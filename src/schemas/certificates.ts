import { z } from "zod";
import { nonEmptyUpdate } from "./common";

const certificateBase = {
  name: z.string().min(1),
  issuer: z.string().min(1),
  issued_date: z.coerce.date().nullable().optional(),
  expires_date: z.coerce.date().nullable().optional(),
  credential_url: z.string().url().optional(),
};

export const createCertificateSchema = z.object(certificateBase);
export const updateCertificateSchema = nonEmptyUpdate(certificateBase);
