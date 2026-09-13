import { createServerFn } from "@tanstack/react-start";
import {
  influencerIdSchema,
  influencerInputSchema,
  influencersSearchSchema,
  influencerUpdateSchema,
  type Influencer,
  type InfluencersScreen,
} from "@ecommerce/contracts/influencers";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getInfluencersScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...influencersSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<InfluencersScreen>("/influencers", { query: data }));

export const createInfluencerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => influencerInputSchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<Influencer>("/influencers", { method: "POST", body: data }),
  );

export const updateInfluencerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => influencerUpdateSchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<Influencer>(`/influencers/${encodeURIComponent(data.id)}`, {
      method: "PUT",
      body: data.input,
    }),
  );

export const deleteInfluencerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => influencerIdSchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<void>(`/influencers/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
  );
