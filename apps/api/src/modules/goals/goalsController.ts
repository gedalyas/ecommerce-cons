import type { Request, Response } from "express";
import { goalPlanSchema, goalsSearchSchema, suggestSchema } from "@ecommerce/contracts/goals";
import { authOf } from "@/shared/http/authOf";
import { coerceQuery } from "@/shared/http/coerceQuery";
import { screenQuery } from "@/shared/http/parseQuery";
import { parseOrThrow } from "@/shared/http/validate";
import { goalsScreen, savePlan, suggestPlan } from "./goalsService";

export function goalsController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await goalsScreen(authOf(req).clientId, screenQuery(req, goalsSearchSchema)));
    },
    async suggestion(req: Request, res: Response) {
      const query = req.query as Record<string, unknown>;
      const { year } = parseOrThrow(suggestSchema, coerceQuery(suggestSchema, query));
      res.json(await suggestPlan(authOf(req).clientId, year));
    },
    async savePlan(req: Request, res: Response) {
      const input = parseOrThrow(goalPlanSchema, req.body);
      res.json(await savePlan(authOf(req).clientId, input));
    },
  };
}
