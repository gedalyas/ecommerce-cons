/**
 * Pedidos server functions: validate the input, call the service, return the
 * typed payload. Isomorphic - the client gets RPC stubs.
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { ordersSearchSchema, type OrdersSearch } from "@ecommerce/contracts/orders";
import { ordersExport, ordersScreen } from "./ordersScreenService";

const parseInput = (input: Partial<PeriodSearch & OrdersSearch>) => ({
  ...parsePeriodSearch(input),
  ...ordersSearchSchema.parse(input),
});

export const getOrdersScreen = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => ordersScreen(PROTOTYPE_CLIENT_SLUG, data));

export const getOrdersExport = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => ordersExport(PROTOTYPE_CLIENT_SLUG, data));
