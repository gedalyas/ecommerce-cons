/**
 * Server functions for the Pedidos screens. The database module is imported
 * inside the handler so the client bundle never resolves `@/server/*`.
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@/shared/utils/period";

export const getOrdersOverview = createServerFn({ method: "GET" })
  .validator((input: PeriodSearch) => parsePeriodSearch(input))
  .handler(async ({ data }) => {
    const { ordersOverview } = await import("@/server/analytics/orders");
    return ordersOverview(PROTOTYPE_CLIENT_SLUG, data);
  });
