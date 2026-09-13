import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@/shared/utils/period";
import {
  influencerIdSchema,
  influencerInputSchema,
  influencersSearchSchema,
  influencerUpdateSchema,
  type InfluencersSearch,
} from "./influencersSchema";
import {
  createInfluencer,
  deleteInfluencer,
  influencersScreen,
  updateInfluencer,
} from "./influencersService";

export const getInfluencersScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch & InfluencersSearch>) => ({
    ...parsePeriodSearch(input),
    ...influencersSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => influencersScreen(PROTOTYPE_CLIENT_SLUG, data));

export const createInfluencerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => influencerInputSchema.parse(input))
  .handler(async ({ data }) => createInfluencer(PROTOTYPE_CLIENT_SLUG, data));

export const updateInfluencerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => influencerUpdateSchema.parse(input))
  .handler(async ({ data }) => updateInfluencer(PROTOTYPE_CLIENT_SLUG, data.id, data.input));

export const deleteInfluencerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => influencerIdSchema.parse(input))
  .handler(async ({ data }) => deleteInfluencer(PROTOTYPE_CLIENT_SLUG, data.id));
