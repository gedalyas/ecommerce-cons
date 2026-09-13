import { z } from "zod";

export const ordersTabs = ["resumo", "aprovacao", "lista"] as const;
export type OrdersTab = (typeof ordersTabs)[number];

export const ordersFilterKeys = [
  "origem",
  "status",
  "gateway",
  "metodo",
  "cupom",
  "uf",
  "cidade",
] as const;
export type OrdersFilterKey = (typeof ordersFilterKeys)[number];

export const ordersSortFields = [
  "placedAt",
  "number",
  "total",
  "items",
  "cost",
  "grossProfit",
  "margin",
] as const;
export type OrdersSortField = (typeof ordersSortFields)[number];

const stringList = z.array(z.string().min(1)).catch([]);

/** The `/pedidos` route's own search params; the global period params come from the root. */
export const ordersSearchSchema = z.object({
  aba: z.enum(ordersTabs).catch("resumo"),
  origem: stringList,
  status: stringList,
  gateway: stringList,
  metodo: stringList,
  cupom: stringList,
  uf: stringList,
  cidade: stringList,
  busca: z.string().catch(""),
  pagina: z.number().int().min(1).catch(1),
  porPagina: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]).catch(20),
  ordenar: z.enum(ordersSortFields).catch("placedAt"),
  direcao: z.enum(["asc", "desc"]).catch("desc"),
});

export type OrdersSearch = z.infer<typeof ordersSearchSchema>;

export const defaultOrdersSearch: OrdersSearch = ordersSearchSchema.parse({});
