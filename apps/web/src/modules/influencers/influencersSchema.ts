import { z } from "zod";
import { InfluencerRuleType, InfluencerStatus } from "@ecommerce/database/enums";

export const influencersSearchSchema = z.object({
  status: z.nativeEnum(InfluencerStatus).catch("ACTIVE"),
  busca: z.string().catch(""),
});
export type InfluencersSearch = z.infer<typeof influencersSearchSchema>;
export const defaultInfluencersSearch: InfluencersSearch = influencersSearchSchema.parse({});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data");
const optionalIsoDate = z
  .union([isoDate, z.literal(""), z.null()])
  .transform((v) => (v === "" ? null : v));

export const ruleInputSchema = z.object({
  type: z.nativeEnum(InfluencerRuleType),
  value: z.number({ invalid_type_error: "Informe o valor" }).min(0, "Não pode ser negativo"),
  startDate: isoDate,
  endDate: optionalIsoDate,
  cap: z
    .number({ invalid_type_error: "Informe um número" })
    .min(0, "Não pode ser negativo")
    .nullable(),
  notes: z.string().trim().max(250, "No máximo 250 caracteres"),
});

export const couponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe o código")
    .max(40, "No máximo 40 caracteres")
    .transform((v) => v.toUpperCase()),
  activeFrom: optionalIsoDate,
  activeUntil: optionalIsoDate,
});

export const influencerInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "No máximo 120 caracteres"),
  handle: z.string().trim().max(60, "No máximo 60 caracteres"),
  status: z.nativeEnum(InfluencerStatus),
  notes: z.string().trim().max(500, "No máximo 500 caracteres"),
  rules: z.array(ruleInputSchema).max(10, "No máximo 10 regras"),
  coupons: z.array(couponInputSchema).max(10, "No máximo 10 cupons"),
});

export type RuleInput = z.input<typeof ruleInputSchema>;
export type CouponInput = z.input<typeof couponInputSchema>;
export type InfluencerInput = z.input<typeof influencerInputSchema>;
export type InfluencerParsed = z.output<typeof influencerInputSchema>;

export const influencerIdSchema = z.object({ id: z.string().min(1) });
export const influencerUpdateSchema = z.object({
  id: z.string().min(1),
  input: influencerInputSchema,
});
