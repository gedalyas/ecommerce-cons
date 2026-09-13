import { z } from "zod";
import { fidelities } from "../shared/fidelity";
import { pillarStatuses } from "./consulting.types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data");

export const pillarUpdateSchema = z.object({
  status: z.enum(pillarStatuses),
  dataPending: z.string().trim().max(250, "No máximo 250 caracteres").default(""),
});
export type PillarUpdateInput = z.infer<typeof pillarUpdateSchema>;

export const recommendationInputSchema = z.object({
  pillarKey: z.string().min(1).nullable(),
  text: z.string().trim().min(1, "Escreva a recomendação").max(300, "No máximo 300 caracteres"),
  dueDate: isoDate,
  owner: z.string().trim().min(1, "Informe o responsável").max(80, "No máximo 80 caracteres"),
});
export type RecommendationInput = z.infer<typeof recommendationInputSchema>;

export const recommendationDoneSchema = z.object({ done: z.boolean() });

export const milestoneUpdateSchema = z.object({
  progress: z.number().int().min(0).max(100),
  achieved: z.boolean(),
  note: z.string().trim().max(160, "No máximo 160 caracteres").default(""),
});
export type MilestoneUpdateInput = z.infer<typeof milestoneUpdateSchema>;

export const manualKpiInputSchema = z.object({
  value: z.string().trim().min(1, "Informe o valor").max(40, "No máximo 40 caracteres"),
  delta: z.string().trim().max(20).nullable().default(null),
  fidelity: z.enum(fidelities),
  note: z.string().trim().max(160, "No máximo 160 caracteres").default(""),
});
export type ManualKpiInput = z.infer<typeof manualKpiInputSchema>;

export const pillarKeySchema = z.object({ pillarKey: z.string().min(1) });
export const kpiKeySchema = z.object({ pillarKey: z.string().min(1), kpiKey: z.string().min(1) });
export const idSchema = z.object({ id: z.string().min(1) });
export const milestoneKeySchema = z.object({ key: z.string().min(1) });
