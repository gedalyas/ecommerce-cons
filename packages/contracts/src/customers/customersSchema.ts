import { z } from "zod";

export const customersTabs = ["rfm", "recompra", "ltv-cac"] as const;
export type CustomersTab = (typeof customersTabs)[number];

export const inactivityBands = ["0-30", "31-60", "61-90", "91-180", "181+"] as const;
export type InactivityBand = (typeof inactivityBands)[number];

export const customersSortFields = ["name", "orders", "total", "lastOrderAt"] as const;
export type CustomersSortField = (typeof customersSortFields)[number];

const stringList = z.array(z.string().min(1)).catch([]);
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .catch(null);
const amount = z.number().min(0).nullable().catch(null);

/** The `/clientes` route's own search params. The RFM tab ignores the global period. */
export const customersSearchSchema = z.object({
  aba: z.enum(customersTabs).catch("rfm"),
  segmento: stringList,
  origem: stringList,
  uf: stringList,
  cidade: stringList,
  gateway: stringList,
  metodo: stringList,
  cupom: stringList,
  cupomModo: z.enum(["incluir", "excluir"]).catch("incluir"),
  comprou: stringList,
  naoComprou: stringList,
  inatividade: z.array(z.enum(inactivityBands)).catch([]),
  comprasDe: isoDate,
  comprasAte: isoDate,
  primeiraDe: isoDate,
  primeiraAte: isoDate,
  ultimaDe: isoDate,
  ultimaAte: isoDate,
  totalMin: amount,
  totalMax: amount,
  pedidosMin: amount,
  pedidosMax: amount,
  pagina: z.number().int().min(1).catch(1),
  porPagina: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]).catch(20),
  ordenar: z.enum(customersSortFields).catch("total"),
  direcao: z.enum(["asc", "desc"]).catch("desc"),
});

export type CustomersSearch = z.infer<typeof customersSearchSchema>;
export const defaultCustomersSearch: CustomersSearch = customersSearchSchema.parse({});

export const rfmFilterListKeys = [
  "segmento",
  "origem",
  "uf",
  "cidade",
  "gateway",
  "metodo",
  "cupom",
  "comprou",
  "naoComprou",
] as const;
export type RfmFilterListKey = (typeof rfmFilterListKeys)[number];
