import type { ZodError, ZodTypeAny, z } from "zod";
import { ValidationError } from "./httpError";

export function fieldErrorsOf(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export function parseOrThrow<S extends ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError(fieldErrorsOf(result.error));
  return result.data as z.output<S>;
}
