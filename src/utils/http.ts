import { ZodSchema } from "zod";

type HttpError = Error & {
  statusCode?: number;
  details?: unknown;
};

export const parseBody = <T>(schema: ZodSchema<T>, body: unknown): T => {
  const parsed = schema.safeParse(body);
  if (parsed.success) {
    return parsed.data;
  }

  const error: HttpError = new Error("Validation failed");
  error.statusCode = 400;
  error.details = parsed.error.flatten();
  throw error;
};

export const parseParams = <T>(schema: ZodSchema<T>, params: unknown): T => {
  const parsed = schema.safeParse(params);
  if (parsed.success) {
    return parsed.data;
  }

  const error: HttpError = new Error("Invalid route parameters");
  error.statusCode = 400;
  error.details = parsed.error.flatten();
  throw error;
};

export const parseQuery = <T>(schema: ZodSchema<T>, query: unknown): T => {
  const parsed = schema.safeParse(query);
  if (parsed.success) {
    return parsed.data;
  }

  const error: HttpError = new Error("Invalid query parameters");
  error.statusCode = 400;
  error.details = parsed.error.flatten();
  throw error;
};

export const notFound = (message = "Resource not found"): never => {
  const error: HttpError = new Error(message);
  error.statusCode = 404;
  throw error;
};

export const conflict = (message: string): never => {
  const error: HttpError = new Error(message);
  error.statusCode = 409;
  throw error;
};
