import { createServerFn } from "@tanstack/react-start";
import {
  dashboardLayoutSchema,
  type DashboardLayout,
  type DashboardOverview,
} from "@ecommerce/contracts/dashboard";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type LayoutSaveResult =
  { ok: true; layout: DashboardLayout } | { ok: false; message: string };

export const getDashboardOverview = createServerFn({ method: "GET" })
  .validator((input: PeriodSearch) => parsePeriodSearch(input))
  .handler(async ({ data }) => apiFetch<DashboardOverview>("/dashboard", { query: data }));

export const saveDashboardLayoutFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => dashboardLayoutSchema.parse(input))
  .handler(async ({ data }): Promise<LayoutSaveResult> => {
    try {
      const layout = await apiFetch<DashboardLayout>("/dashboard/layout", {
        method: "PUT",
        body: data,
      });
      return { ok: true, layout };
    } catch (error) {
      if (error instanceof ApiRequestError && error.status < 500) {
        return { ok: false, message: error.body.message };
      }
      console.error(error);
      return { ok: false, message: "Não foi possível salvar o dashboard. Tente novamente." };
    }
  });
