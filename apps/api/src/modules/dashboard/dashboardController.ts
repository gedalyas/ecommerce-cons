import type { Request, Response } from "express";
import { authOf } from "@/shared/http/authOf";
import { periodOf } from "@/shared/http/parseQuery";
import { dashboardOverview } from "./dashboardService";

export function dashboardController() {
  return {
    async overview(req: Request, res: Response) {
      res.json(await dashboardOverview(authOf(req).clientId, periodOf(req)));
    },
  };
}
