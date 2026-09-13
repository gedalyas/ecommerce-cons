import { z } from "zod";

export const productsTabs = ["resumo", "lista", "estoque"] as const;
export type ProductsTab = (typeof productsTabs)[number];

export const productsFilterKeys = ["categoria", "subcategoria", "marca", "colecao"] as const;
export type ProductsFilterKey = (typeof productsFilterKeys)[number];

export const stockChips = ["todos", "risco", "velocidade", "sem-estoque"] as const;
export type StockChip = (typeof stockChips)[number];

export const salesWindows = ["total", "90", "30", "7"] as const;
export type SalesWindow = (typeof salesWindows)[number];

const stringList = z.array(z.string().min(1)).catch([]);

/** The `/produtos` route's own search params; the global period params come from the root. */
export const productsSearchSchema = z.object({
  aba: z.enum(productsTabs).catch("resumo"),
  categoria: stringList,
  subcategoria: stringList,
  marca: stringList,
  colecao: stringList,
  estoque: z.enum(stockChips).catch("todos"),
  janela: z.enum(salesWindows).catch("30"),
});

export type ProductsSearch = z.infer<typeof productsSearchSchema>;
export const defaultProductsSearch: ProductsSearch = productsSearchSchema.parse({});
