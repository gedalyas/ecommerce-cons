import { z } from "zod";
import { connectorKeys } from "./connectorCatalog";
import { connectionRequestStatuses } from "./connectors.types";

export const connectorKeySchema = z.object({ key: z.enum(connectorKeys) });

export const connectionRequestInputSchema = z.object({
  note: z.string().trim().max(500, "No máximo 500 caracteres").default(""),
});
export type ConnectionRequestInput = z.infer<typeof connectionRequestInputSchema>;

export const connectionRequestResolveSchema = z.object({
  status: z.enum(connectionRequestStatuses),
  note: z.string().trim().max(500, "No máximo 500 caracteres").default(""),
});
export type ConnectionRequestResolveInput = z.infer<typeof connectionRequestResolveSchema>;
