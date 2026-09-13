import { z } from "zod";
import { BusinessUnit, CostCategory, CostFrequency } from "@ecommerce/database/enums";
import { isSubcategoryOf, percentFrequencies } from "./costTaxonomy";

export const moneyTabs = ["visao", "dre", "custos"] as const;
export type MoneyTab = (typeof moneyTabs)[number];

export const moneySearchSchema = z.object({
  aba: z.enum(moneyTabs).catch("visao"),
});
export type MoneySearch = z.infer<typeof moneySearchSchema>;
export const defaultMoneySearch: MoneySearch = moneySearchSchema.parse({});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

/** "Adicionar custo ou despesa" form, validated on both sides. */
export const costInputSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome").max(75, "No máximo 75 caracteres"),
    description: z.string().trim().max(250, "No máximo 250 caracteres"),
    businessUnit: z.nativeEnum(BusinessUnit),
    category: z.nativeEnum(CostCategory),
    subcategory: z.string().min(1, "Escolha a subcategoria"),
    frequency: z.nativeEnum(CostFrequency),
    value: z
      .number({ invalid_type_error: "Informe o valor" })
      .min(0, "O valor não pode ser negativo"),
    startDate: isoDate,
    endDate: isoDate.nullable(),
  })
  .refine((c) => isSubcategoryOf(c.category, c.subcategory), {
    path: ["subcategory"],
    message: "Subcategoria não pertence à categoria",
  })
  .refine((c) => !percentFrequencies.includes(c.frequency) || c.value <= 100, {
    path: ["value"],
    message: "Percentual acima de 100%",
  })
  .refine((c) => c.endDate == null || c.endDate >= c.startDate, {
    path: ["endDate"],
    message: "O fim precisa ser depois do início",
  });

export type CostInput = z.infer<typeof costInputSchema>;

export const costIdSchema = z.object({ id: z.string().min(1) });
export const costUpdateSchema = z.object({ id: z.string().min(1), input: costInputSchema });
