/**
 * Dashboard server functions: validate the input, call the service, return
 * the typed payload. Isomorphic - the client gets RPC stubs.
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { dashboardOverview } from "./dashboardService";

export const getDashboardOverview = createServerFn({ method: "GET" })
  .validator((input: PeriodSearch) => parsePeriodSearch(input))
  .handler(async ({ data }) => dashboardOverview(PROTOTYPE_CLIENT_SLUG, data));
