import { z } from "zod";
import { connectorKeys } from "./connectorCatalog";
import { connectionRequestStatuses } from "./connectors.types";

export const connectorKeySchema = z.object({ key: z.enum(connectorKeys) });

export const connectionRequestInputSchema = z.object({
  note: z.string().trim().max(500, "No máximo 500 caracteres").default(""),
});
export type ConnectionRequestInput = z.infer<typeof connectionRequestInputSchema>;

export const connectorStartSchema = z.object({
  domain: z.string().trim().max(120).default(""),
});
export type ConnectorStartInput = z.infer<typeof connectorStartSchema>;

export const connectorCredentialsSchema = z.object({
  fields: z.record(z.string().min(1), z.string().trim().max(500)),
});
export type ConnectorCredentialsInput = z.infer<typeof connectorCredentialsSchema>;

export const connectorCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const connectionRequestResolveSchema = z.object({
  status: z.enum(connectionRequestStatuses),
  note: z.string().trim().max(500, "No máximo 500 caracteres").default(""),
});
export type ConnectionRequestResolveInput = z.infer<typeof connectionRequestResolveSchema>;
