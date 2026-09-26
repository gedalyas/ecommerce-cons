import { z } from "zod";
import { channels, comparisons, granularities, rangeLength } from "../shared/period";
import { reportSectionKeys } from "./reports.types";

const MAX_REPORT_DAYS = 366;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reportRequestSchema = z
  .object({
    sections: z
      .array(z.enum(reportSectionKeys, { message: "Seção desconhecida." }))
      .min(1, "Escolha ao menos uma seção.")
      .max(reportSectionKeys.length),
    inicio: isoDate,
    fim: isoDate,
    por: z.enum(granularities).default("dia"),
    comparar: z.enum(comparisons).default("periodo-anterior"),
    canal: z.enum(channels).default("todos"),
  })
  .refine((request) => request.inicio <= request.fim, {
    path: ["fim"],
    message: "O fim do período vem antes do início.",
  })
  .refine((request) => rangeLength(request) <= MAX_REPORT_DAYS, {
    path: ["inicio"],
    message: "O relatório cobre no máximo um ano.",
  });
export type ReportRequest = z.infer<typeof reportRequestSchema>;
