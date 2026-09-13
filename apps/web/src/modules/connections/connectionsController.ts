import { createServerFn } from "@tanstack/react-start";
import type { ConnectionsHealth, ConnectionsScreen } from "@ecommerce/contracts/connections";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getConnectionsScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ConnectionsScreen>("/connections"),
);

export const getConnectionsHealth = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ConnectionsHealth>("/connections/health"),
);
