import { createServerFn } from "@tanstack/react-start";
import type { ConnectionsHealth, ConnectionsScreen } from "@ecommerce/contracts/connections";
import {
  connectionRequestInputSchema,
  connectorKeySchema,
  connectorStartSchema,
  type ConnectionRequest,
  type DataReadiness,
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

export type PlainResult = { ok: true } | { ok: false; message: string };

async function plain(run: () => Promise<unknown>, fallback: string): Promise<PlainResult> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      return { ok: false, message: error.body.message };
    }
    console.error(error);
    return { ok: false, message: fallback };
  }
}

export const getDataReadiness = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<DataReadiness>("/data-readiness"),
);

export const startConnectorFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => connectorKeySchema.merge(connectorStartSchema).parse(input))
  .handler(
    async ({ data }): Promise<{ ok: true; url: string } | { ok: false; message: string }> => {
      try {
        const { url } = await apiFetch<{ url: string }>(
          `/connectors/${encodeURIComponent(data.key)}/authorize`,
          { method: "POST", body: { domain: data.domain } },
        );
        return { ok: true, url };
      } catch (error) {
        if (error instanceof ApiRequestError && error.status < 500) {
          return { ok: false, message: error.body.message };
        }
        console.error(error);
        return { ok: false, message: "Não foi possível iniciar a conexão agora." };
      }
    },
  );

export const syncConnectorFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => connectorKeySchema.parse(input))
  .handler(({ data }) =>
    plain(
      () =>
        apiFetch<unknown>(`/connectors/${encodeURIComponent(data.key)}/sync`, { method: "POST" }),
      "Não foi possível sincronizar agora.",
    ),
  );

export const disconnectConnectorFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => connectorKeySchema.parse(input))
  .handler(({ data }) =>
    plain(
      () => apiFetch<void>(`/connectors/${encodeURIComponent(data.key)}`, { method: "DELETE" }),
      "Não foi possível desconectar agora.",
    ),
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
