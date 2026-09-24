import { createServerFn } from "@tanstack/react-start";
import {
  campaignTagSchema,
  marketingSearchSchema,
  type MarketingScreen,
} from "@ecommerce/contracts/marketing";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch, attemptWrite } from "@/shared/dependencies/apiClient";

export const getMarketingScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...marketingSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<MarketingScreen>("/marketing", { query: data }));

export const saveCampaignTagFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => campaignTagSchema.parse(input))
  .handler(({ data }) =>
    attemptWrite(
      () => apiFetch<void>("/marketing/campaign-tags", { method: "PUT", body: data }),
      "Não foi possível salvar a marcação agora.",
    ),
  );
