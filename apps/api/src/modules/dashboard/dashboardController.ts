import type { Request, Response } from "express";
import { dashboardLayoutSchema } from "@ecommerce/contracts/dashboard";
import { authOf } from "@/shared/http/authOf";
import { periodOf } from "@/shared/http/parseQuery";
import { parseOrThrow } from "@/shared/http/validate";
import { saveDashboardLayout } from "./dashboardLayoutService";
import { dashboardOverview } from "./dashboardService";

export function dashboardController() {
  return {
    async overview(req: Request, res: Response) {
      res.json(await dashboardOverview(authOf(req), periodOf(req)));
    },
    async saveLayout(req: Request, res: Response) {
      const input = parseOrThrow(dashboardLayoutSchema, req.body);
      res.json(await saveDashboardLayout(authOf(req), input));
    },
  };
}
