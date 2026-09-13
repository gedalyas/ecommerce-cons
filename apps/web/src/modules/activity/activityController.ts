import { createServerFn } from "@tanstack/react-start";
import { activityQuerySchema, type ActivityPage } from "@ecommerce/contracts/audit";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getStoreActivity = createServerFn({ method: "GET" })
  .validator((input: unknown) => activityQuerySchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<ActivityPage>("/activity", { query: { pagina: data.pagina } }),
  );

export const getStaffActivity = createServerFn({ method: "GET" })
  .validator((input: unknown) => activityQuerySchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<ActivityPage>("/admin/activity", {
      query: { pagina: data.pagina, ...(data.storeId ? { storeId: data.storeId } : {}) },
    }),
  );
