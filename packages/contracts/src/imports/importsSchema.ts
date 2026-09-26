import { z } from "zod";
import { IMPORT_MAX_HEADER_LENGTH, importKinds } from "./imports.types";

export const importKindSchema = z.object({ kind: z.enum(importKinds) });
export type ImportKindInput = z.infer<typeof importKindSchema>;

const MAX_MAPPED_FIELDS = 64;

const parsedJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const columnMappingSchema = z
  .record(z.string().min(1).max(64), z.string().min(1).max(IMPORT_MAX_HEADER_LENGTH))
  .refine((mapping) => Object.keys(mapping).length <= MAX_MAPPED_FIELDS, {
    message: "Mapeamento grande demais.",
  });

export const importUploadSchema = importKindSchema.extend({
  mapping: z.preprocess(parsedJson, columnMappingSchema).optional(),
});

export const importIdSchema = z.object({ id: z.string().min(1) });
