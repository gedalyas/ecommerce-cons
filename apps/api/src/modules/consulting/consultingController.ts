import type { Request, Response } from "express";
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
} from "@ecommerce/contracts/consulting";
import { authOf } from "@/shared/http/authOf";
import { forbidden } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import {
  createRecommendation,
  deleteRecommendation,
  milestoneCriteriaFor,
  milestoneSummary,
  setManualKpi,
  setRecommendationDone,
  updateMilestone,
  updatePillar,
  updateRecommendation,
} from "./consultingService";

export type ConsultingDependencies = { now: () => Date };

function editorOf(req: Request) {
  const auth = authOf(req);
  if (auth.role === "CLIENT") throw forbidden("Só a consultoria edita o acompanhamento.");
  return auth;
}

export function consultingController({ now }: ConsultingDependencies) {
  return {
    async milestone(req: Request, res: Response) {
      res.json(await milestoneSummary(authOf(req).clientId));
    },
    async milestoneCriteria(req: Request, res: Response) {
      res.json(await milestoneCriteriaFor(authOf(req).clientId));
    },
    async updateMilestone(req: Request, res: Response) {
      const { key } = parseOrThrow(milestoneKeySchema, req.params);
      const input = parseOrThrow(milestoneUpdateSchema, req.body);
      res.json(await updateMilestone(editorOf(req).clientId, key, input));
    },
    async updatePillar(req: Request, res: Response) {
      const { pillarKey } = parseOrThrow(pillarKeySchema, req.params);
      const input = parseOrThrow(pillarUpdateSchema, req.body);
      res.json(await updatePillar(editorOf(req).clientId, pillarKey, input));
    },
    async setManualKpi(req: Request, res: Response) {
      const { pillarKey, kpiKey } = parseOrThrow(kpiKeySchema, req.params);
      const input = parseOrThrow(manualKpiInputSchema, req.body);
      await setManualKpi(editorOf(req).clientId, pillarKey, kpiKey, input);
      res.status(204).end();
    },
    async createRecommendation(req: Request, res: Response) {
      const input = parseOrThrow(recommendationInputSchema, req.body);
      res.status(201).json(await createRecommendation(editorOf(req).clientId, input));
    },
    async updateRecommendation(req: Request, res: Response) {
      const { id } = parseOrThrow(idSchema, req.params);
      const input = parseOrThrow(recommendationInputSchema, req.body);
      res.json(await updateRecommendation(editorOf(req).clientId, id, input));
    },
    async setRecommendationDone(req: Request, res: Response) {
      const { id } = parseOrThrow(idSchema, req.params);
      const { done } = parseOrThrow(recommendationDoneSchema, req.body);
      await setRecommendationDone(editorOf(req).clientId, id, done, now());
      res.status(204).end();
    },
    async deleteRecommendation(req: Request, res: Response) {
      const { id } = parseOrThrow(idSchema, req.params);
      await deleteRecommendation(editorOf(req).clientId, id);
      res.status(204).end();
    },
  };
}
