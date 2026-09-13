import { createServerFn } from "@tanstack/react-start";
import {
  ordersSearchSchema,
  type OrdersListRow,
  type OrdersScreen,
} from "@ecommerce/contracts/orders";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

const parseInput = (input: Partial<PeriodSearch> & Record<string, unknown>) => ({
  ...parsePeriodSearch(input),
  ...ordersSearchSchema.parse(input),
});

export const getOrdersScreen = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => apiFetch<OrdersScreen>("/orders", { query: data }));

export const getOrdersExport = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => apiFetch<OrdersListRow[]>("/orders/export", { query: data }));
