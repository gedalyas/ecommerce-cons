/**
 * Marketing server functions: validate the input, call the service, return
 * the typed payload. The marketing cost lines arrive with the input - the
 * route fetches them from the money module, which cannot be imported here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { marketingSearchSchema, type MarketingSearch } from "@ecommerce/contracts/marketing";
import { marketingScreen } from "./marketingScreenService";

const costLineSchema = z.object({
  key: z.string(),
  label: z.string(),
  businessUnit: z.enum(["ECOMMERCE", "MARKETPLACE", "BOTH"]),
  amount: z.number(),
});

const parseInput = (input: Partial<PeriodSearch & MarketingSearch> & { custos?: unknown }) => ({
  ...parsePeriodSearch(input),
  ...marketingSearchSchema.parse(input),
  custos: z.array(costLineSchema).catch([]).parse(input.custos),
});

export const getMarketingScreen = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => marketingScreen(PROTOTYPE_CLIENT_SLUG, data));
