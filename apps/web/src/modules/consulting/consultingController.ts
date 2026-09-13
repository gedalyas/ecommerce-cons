import { createServerFn } from "@tanstack/react-start";
import {
  idSchema,
  kpiKeySchema,
  manualKpiInputSchema,
  milestoneKeySchema,
  milestoneUpdateSchema,
  pillarKeySchema,
  pillarUpdateSchema,
  recommendationDoneSchema,
  recommendationInputSchema,
  type MilestoneCriterion,
  type MilestoneSummary,
} from "@ecommerce/contracts/consulting";
import { ApiRequestError, apiFetch } from "@/shared/dependencies/apiClient";

export type EditResult = { ok: true } | { ok: false; message: string };

async function attempt(run: () => Promise<unknown>): Promise<EditResult> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status < 500) {
      return { ok: false, message: error.body.message };
    }
    console.error(error);
    return { ok: false, message: "Não foi possível salvar agora. Tente novamente." };
  }
}

const path = (segment: string) => encodeURIComponent(segment);

export const getMilestoneSummary = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<MilestoneSummary>("/consulting/milestone"),
);

export const getMilestoneCriteria = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<MilestoneCriterion[]>("/consulting/milestone/criteria"),
);

export const updatePillarFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => pillarKeySchema.merge(pillarUpdateSchema).parse(input))
  .handler(async ({ data: { pillarKey, ...body } }) =>
    attempt(() => apiFetch(`/consulting/pillars/${path(pillarKey)}`, { method: "PUT", body })),
  );

export const setManualKpiFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => kpiKeySchema.merge(manualKpiInputSchema).parse(input))
  .handler(async ({ data: { pillarKey, kpiKey, ...body } }) =>
    attempt(() =>
      apiFetch(`/consulting/pillars/${path(pillarKey)}/kpis/${path(kpiKey)}`, {
        method: "PUT",
        body,
      }),
    ),
  );

export const createRecommendationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => recommendationInputSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(() => apiFetch("/consulting/recommendations", { method: "POST", body: data })),
  );

export const setRecommendationDoneFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.merge(recommendationDoneSchema).parse(input))
  .handler(async ({ data }) =>
    attempt(() =>
      apiFetch(`/consulting/recommendations/${path(data.id)}/done`, {
        method: "PUT",
        body: { done: data.done },
      }),
    ),
  );

export const deleteRecommendationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) =>
    attempt(() => apiFetch(`/consulting/recommendations/${path(data.id)}`, { method: "DELETE" })),
  );

export const updateMilestoneFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => milestoneKeySchema.merge(milestoneUpdateSchema).parse(input))
  .handler(async ({ data: { key, ...body } }) =>
    attempt(() => apiFetch(`/consulting/milestone/${path(key)}`, { method: "PUT", body })),
  );
