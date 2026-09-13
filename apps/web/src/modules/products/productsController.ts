/**
 * Produtos server functions: validate the input, call the service, return the
 * typed payload. Isomorphic - the client gets RPC stubs.
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { productsSearchSchema, type ProductsSearch } from "@ecommerce/contracts/products";
import { productsScreen } from "./productsScreenService";

export const getProductsScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch & ProductsSearch>) => ({
    ...parsePeriodSearch(input),
    ...productsSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => productsScreen(PROTOTYPE_CLIENT_SLUG, data));
