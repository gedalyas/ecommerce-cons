import { z } from "zod";
import { connectorCategories } from "../connectors/connectorCategories";
import { connectorErrorReasons } from "../connectors/connectors.types";

export const integrationsTabs = ["integracoes", "minhas", "planilhas"] as const;
export type IntegrationsTab = (typeof integrationsTabs)[number];

export const integrationsTabLabel: Record<IntegrationsTab, string> = {
  integracoes: "Integrações",
  minhas: "Minhas integrações",
  planilhas: "Planilhas",
};

export const integrationsSearchSchema = z.object({
  aba: z.enum(integrationsTabs).catch("integracoes"),
  categoria: z.enum(connectorCategories).catch("gestao"),
  busca: z.string().catch(""),
  conectado: z.string().catch(""),
  escolher: z.boolean().catch(false),
  erro: z.string().catch(""),
  motivo: z.enum(connectorErrorReasons).catch("troca"),
});
export type IntegrationsSearch = z.infer<typeof integrationsSearchSchema>;

export const defaultIntegrationsSearch: IntegrationsSearch = integrationsSearchSchema.parse({});
