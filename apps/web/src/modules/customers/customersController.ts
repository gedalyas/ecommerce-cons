/**
 * Clientes server functions: validate the input, call the service, return the
 * typed payload. The refresh is a POST (writes the aggregates).
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { customersSearchSchema, type CustomersSearch } from "@ecommerce/contracts/customers";
import {
  customersExport,
  customersScreen,
  refreshCustomers,
  retentionSummary,
} from "./customersScreenService";

const parseInput = (input: Partial<PeriodSearch & CustomersSearch>) => ({
  ...parsePeriodSearch(input),
  ...customersSearchSchema.parse(input),
});

export const getCustomersScreen = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => customersScreen(PROTOTYPE_CLIENT_SLUG, data));

export const getCustomersExport = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => customersExport(PROTOTYPE_CLIENT_SLUG, data));

export const refreshCustomerSegments = createServerFn({ method: "POST" }).handler(async () =>
  refreshCustomers(PROTOTYPE_CLIENT_SLUG),
);

export const getRetentionSummary = createServerFn({ method: "GET" }).handler(async () =>
  retentionSummary(PROTOTYPE_CLIENT_SLUG),
);
