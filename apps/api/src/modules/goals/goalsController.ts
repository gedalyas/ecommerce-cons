import type { Request, Response } from "express";
import { goalPlanSchema, goalsSearchSchema } from "@ecommerce/contracts/goals";
import { currentDay } from "@/shared/config/clock";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { parseOrThrow } from "@/shared/http/validate";
import { goalsScreen, savePlan, suggestPlan } from "./goalsService";

export function goalsController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await goalsScreen(authOf(req).clientId, screenQuery(req, goalsSearchSchema)));
    },
    async suggestion(req: Request, res: Response) {
      res.json(await suggestPlan(authOf(req).clientId, currentDay()));
    },
    async savePlan(req: Request, res: Response) {
      const input = parseOrThrow(goalPlanSchema, req.body);
      res.json(await savePlan(authOf(req).clientId, input));
    },
  };
}
