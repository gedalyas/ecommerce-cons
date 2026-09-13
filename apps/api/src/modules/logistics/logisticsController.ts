import type { Request, Response } from "express";
import { authOf } from "@/shared/http/authOf";
import { logisticsScreen } from "./logisticsService";

export function logisticsController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await logisticsScreen(authOf(req).clientId));
    },
  };
}
