import { z } from "zod";
import { connectorKeys } from "./connectorCatalog";
import { connectionRequestStatuses, statusMappingTargets } from "./connectors.types";

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

export const connectorSettingsSchema = z.object({
  statusMap: z.record(z.string().min(1), z.enum(statusMappingTargets)).default({}),
  accountId: z.string().trim().max(120).nullable().default(null),
});
export type ConnectorSettingsInput = z.infer<typeof connectorSettingsSchema>;

export const connectorCallbackSchema = z
  .object({
    code: z.string().min(1).optional(),
    auth_code: z.string().min(1).optional(),
    spapi_oauth_code: z.string().min(1).optional(),
    error: z.string().optional(),
    state: z.string().min(1),
  })
  .passthrough()
  .transform((query) => ({
    code: query.code ?? query.auth_code ?? query.spapi_oauth_code ?? "",
    state: query.state,
    query: Object.fromEntries(
      Object.entries(query).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
    ) as Record<string, string>,
  }))
  .refine((value) => value.code.length > 0 || Boolean(value.query["error"]), {
    message: "code",
  });

export const connectionRequestResolveSchema = z.object({
  status: z.enum(connectionRequestStatuses),
  note: z.string().trim().max(500, "No máximo 500 caracteres").default(""),
});
export type ConnectionRequestResolveInput = z.infer<typeof connectionRequestResolveSchema>;
