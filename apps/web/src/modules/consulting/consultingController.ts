import { createServerFn } from "@tanstack/react-start";
import type { MilestoneSummary } from "@ecommerce/contracts/consulting";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getMilestoneSummary = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<MilestoneSummary>("/consulting/milestone"),
);
