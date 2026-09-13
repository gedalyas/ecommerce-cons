import type { Request, Response } from "express";
import { analysisSearchSchema } from "@ecommerce/contracts/analysis";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { analysisScreen } from "./analysisService";

export function analysisController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await analysisScreen(authOf(req).clientId, screenQuery(req, analysisSearchSchema)));
    },
  };
}
