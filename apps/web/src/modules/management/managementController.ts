import { createServerFn } from "@tanstack/react-start";
import type { ManagementScreen } from "@ecommerce/contracts/management";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getManagementScreen = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<ManagementScreen>("/management"),
);
