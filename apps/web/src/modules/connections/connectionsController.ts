import { createServerFn } from "@tanstack/react-start";
import type { ConnectionsHealth, ConnectionsScreen } from "@ecommerce/contracts/connections";
import type { ConnectionCheck } from "@ecommerce/contracts/connectors";
import {
  connectionRequestInputSchema,
  connectorKeySchema,
  connectorSettingsSchema,
  connectorStartSchema,
  dataSourceChoiceSchema,
  type ConnectionRequest,
  type ConnectorSettings,
  type DataReadiness,
} from "@ecommerce/contracts/connectors";
import { ApiRequestError, apiFetch, attempt } from "@/shared/dependencies/apiClient";

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

export const getConnectorSettings = createServerFn({ method: "GET" })
  .validator((input: unknown) => connectorKeySchema.parse(input))
  .handler(({ data }) =>
    apiFetch<ConnectorSettings>(`/connectors/${encodeURIComponent(data.key)}/settings`),
  );

export const saveConnectorSettingsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => connectorKeySchema.merge(connectorSettingsSchema).parse(input))
  .handler(({ data }) =>
    plain(
      () =>
        apiFetch<void>(`/connectors/${encodeURIComponent(data.key)}/settings`, {
          method: "PUT",
          body: { statusMap: data.statusMap, accountId: data.accountId },
        }),
      "Não foi possível salvar o mapeamento.",
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

export const chooseDataSourceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => dataSourceChoiceSchema.parse(input))
  .handler(({ data }) =>
    plain(
      () => apiFetch<void>("/data-sources", { method: "PUT", body: data }),
      "Não foi possível trocar a fonte agora.",
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

export const testConnectionFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => connectorKeySchema.parse(input))
  .handler(({ data }) =>
    attempt(
      () =>
        apiFetch<ConnectionCheck>(`/connectors/${encodeURIComponent(data.key)}/test`, {
          method: "POST",
        }),
      "Não foi possível testar a conexão agora.",
    ),
  );
