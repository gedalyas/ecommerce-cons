import { createServerFn } from "@tanstack/react-start";
import type { LogisticsScreen } from "@ecommerce/contracts/logistics";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getLogisticsScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<LogisticsScreen>("/logistics"),
);
