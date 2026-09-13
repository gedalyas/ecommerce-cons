import type { Request, Response } from "express";
import { authOf } from "@/shared/http/authOf";
import { milestoneSummary } from "./consultingService";

export function consultingController() {
  return {
    async milestone(req: Request, res: Response) {
      res.json(await milestoneSummary(authOf(req).clientId));
    },
  };
}
