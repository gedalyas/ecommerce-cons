import { z } from "zod";
import { storefrontConnectorKeys } from "../connectors/connectorCatalog";
import { revenueBands, storeSegments } from "./store.types";

export const storeProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja").max(80, "No máximo 80 caracteres"),
  segment: z.enum(storeSegments).nullable().default(null),
  platform: z
    .string()
    .refine((v) => (storefrontConnectorKeys as string[]).includes(v), "Plataforma desconhecida")
    .nullable()
    .default(null),
  monthlyRevenueBand: z.enum(revenueBands).nullable().default(null),
  timezone: z.string().trim().min(1).max(60).default("America/Sao_Paulo"),
});
export type StoreProfileInput = z.input<typeof storeProfileSchema>;
export type StoreProfileParsed = z.output<typeof storeProfileSchema>;
