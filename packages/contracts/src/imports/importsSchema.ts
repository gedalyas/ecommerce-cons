import { z } from "zod";
import { importKinds } from "./imports.types";

export const importKindSchema = z.object({ kind: z.enum(importKinds) });
export type ImportKindInput = z.infer<typeof importKindSchema>;

export const importIdSchema = z.object({ id: z.string().min(1) });
