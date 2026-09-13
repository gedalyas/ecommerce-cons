import { createServerFn } from "@tanstack/react-start";
import { productsSearchSchema, type ProductsScreen } from "@ecommerce/contracts/products";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getProductsScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...productsSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<ProductsScreen>("/products", { query: data }));
