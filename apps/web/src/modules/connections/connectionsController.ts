import { createServerFn } from "@tanstack/react-start";
import type { ConnectionsHealth, ConnectionsScreen } from "@ecommerce/contracts/connections";
import {
  connectionRequestInputSchema,
  connectorKeySchema,
  type ConnectionRequest,
} from "@ecommerce/contracts/connectors";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type RequestResult =
  { ok: true; request: ConnectionRequest } | { ok: false; message: string };

export const getConnectionsScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ConnectionsScreen>("/connections"),
);

export const getConnectionsHealth = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ConnectionsHealth>("/connections/health"),
);

export const requestConnectionFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    connectorKeySchema.merge(connectionRequestInputSchema).parse(input),
  )
  .handler(async ({ data }): Promise<RequestResult> => {
    try {
      const request = await apiFetch<ConnectionRequest>(
        `/connections/${encodeURIComponent(data.key)}/request`,
        { method: "POST", body: { note: data.note } },
      );
      return { ok: true, request };
    } catch (error) {
      if (error instanceof ApiRequestError && error.status < 500) {
        return { ok: false, message: error.body.message };
      }
      console.error(error);
      return { ok: false, message: "Não foi possível solicitar agora. Tente novamente." };
    }
  });
